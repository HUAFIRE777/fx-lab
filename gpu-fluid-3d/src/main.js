import * as THREE from 'three';

/*
 * gpu-fluid-3d · GPGPU 粒子流体
 * 参考：大阪世博"数字水体"（巴黎 three.js 大会爆点）——GPGPU 粒子物理、全 GPU 模拟渲染。
 * 借鉴手法：ping-pong 浮点 RenderTarget 存位置/速度、curl 噪声平流、顶点纹理取点渲染。
 * 以下全部代码（含 shader）为原创重写。
 */

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---------------- 模式参数 ---------------- */
const MODES = [
  { key: 'water', curl: 2.3, damp: 0.65, buoy: 0.0, swirl: 0.0, grav: 0.0,
    freq: 1.7, flow: 0.30, stir: 5.0, size: 5.2, maxSpeed: 1.6,
    colorA: '#0a4d5c', colorB: '#38e1c6' },
  { key: 'smoke', curl: 0.9, damp: 1.15, buoy: 0.55, swirl: 0.0, grav: 0.0,
    freq: 1.1, flow: 0.20, stir: 3.5, size: 7.5, maxSpeed: 1.1,
    colorA: '#59616d', colorB: '#eef4f6' },
  { key: 'stardust', curl: 1.1, damp: 0.45, buoy: 0.0, swirl: 1.7, grav: 0.35,
    freq: 1.35, flow: 0.34, stir: 4.2, size: 4.4, maxSpeed: 1.9,
    colorA: '#2a1b5e', colorB: '#8b9cf0' },
];
const FOAM = '#f4fbfa';   // 泡沫白
const DEEP = '#04121f';   // 深海

/* ---------------- 原创 GLSL：值噪声 + curl 场 ---------------- */
const NOISE_GLSL = /* glsl */`
float hash13(vec3 p){
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p){
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1.0,0.0,0.0));
  float n010 = hash13(i + vec3(0.0,1.0,0.0));
  float n110 = hash13(i + vec3(1.0,1.0,0.0));
  float n001 = hash13(i + vec3(0.0,0.0,1.0));
  float n101 = hash13(i + vec3(1.0,0.0,1.0));
  float n011 = hash13(i + vec3(0.0,1.0,1.0));
  float n111 = hash13(i + vec3(1.0,1.0,1.0));
  return mix(mix(mix(n000,n100,u.x), mix(n010,n110,u.x), u.y),
             mix(mix(n001,n101,u.x), mix(n011,n111,u.x), u.y), u.z);
}
float fbm(vec3 p){
  float s = 0.0;
  float a = 0.5;
  for(int i = 0; i < 3; i++){
    s += a * vnoise(p);
    p = p * 2.03 + vec3(11.3, 7.7, 5.1);
    a *= 0.5;
  }
  return s;
}
vec3 potential(vec3 p, float t){
  vec3 q = p + vec3(0.0, t * 0.35, 0.0);
  return vec3(
    fbm(q + vec3(5.2, 1.3, 2.8)),
    fbm(q + vec3(1.7, 9.2, 4.1)),
    fbm(q + vec3(3.3, 7.7, 1.9)));
}
vec3 curlField(vec3 p, float t){
  float e = 0.12;
  vec3 v0 = potential(p, t);
  vec3 vx = potential(p + vec3(e,0.0,0.0), t);
  vec3 vy = potential(p + vec3(0.0,e,0.0), t);
  vec3 vz = potential(p + vec3(0.0,0.0,e), t);
  float dVy_dz = (vz.y - v0.y) / e;
  float dVz_dy = (vy.z - v0.z) / e;
  float dVz_dx = (vx.z - v0.z) / e;
  float dVx_dz = (vz.x - v0.x) / e;
  float dVx_dy = (vy.x - v0.x) / e;
  float dVy_dx = (vx.y - v0.y) / e;
  return vec3(dVy_dz - dVz_dy, dVz_dx - dVx_dz, dVx_dy - dVy_dx);
}
`;

const SIM_VERT = /* glsl */`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const INIT_POS_FRAG = /* glsl */`
varying vec2 vUv;
float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main(){
  float a = hash12(vUv * 913.7) * 6.2831853;
  float b = acos(clamp(2.0 * hash12(vUv * 517.3 + 7.1) - 1.0, -1.0, 1.0));
  float r = 0.85 * pow(hash12(vUv * 311.9 + 3.7), 0.3333333);
  vec3 p = r * vec3(sin(b) * cos(a), cos(b), sin(b) * sin(a));
  gl_FragColor = vec4(p, 1.0);
}
`;

const INIT_VEL_FRAG = /* glsl */`
void main(){
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

const VEL_FRAG = /* glsl */`
uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform float uDt;
uniform float uTime;
uniform float uCurl;
uniform float uDamp;
uniform float uBuoy;
uniform float uSwirl;
uniform float uGrav;
uniform float uFreq;
uniform float uFlow;
uniform float uMaxSpeed;
uniform float uStir;
uniform vec2 uMouse;
uniform float uMouseForce;
uniform float uAspect;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform mat4 uProjView;
uniform vec4 uBurst;
uniform float uReset;
varying vec2 vUv;
${NOISE_GLSL}
void main(){
  vec3 pos = texture2D(uPosTex, vUv).xyz;
  if(uReset > 0.5){
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec3 vel = texture2D(uVelTex, vUv).xyz;
  vec3 acc = vec3(0.0);

  // curl 噪声平流：无散场，天然像流体
  acc += curlField(pos * uFreq, uTime * uFlow) * uCurl;

  // 烟：上升浮力
  acc.y += uBuoy;

  // 星尘：绕 Y 轴旋涡 + 向心引力
  float r2 = dot(pos.xz, pos.xz) + 1e-4;
  float rr = sqrt(r2);
  acc += vec3(-pos.z, 0.0, pos.x) / rr * (uSwirl / (rr + 0.35));
  float r3 = length(pos) + 1e-4;
  acc -= (pos / r3) * uGrav * smoothstep(0.15, 1.0, r3);

  // 软边界：把粒子轻轻推回球内
  acc -= (pos / r3) * smoothstep(0.85, 1.0, r3) * 4.0;

  // 屏幕空间交互：先把粒子投影到 NDC
  vec4 clip = uProjView * vec4(pos, 1.0);
  vec2 ndc = clip.xy / max(clip.w, 1e-3);

  // 鼠标/触屏搅动：径向力，沿相机右/上轴还原为世界方向
  vec2 d = ndc - uMouse;
  d.x *= uAspect;
  float dist = length(d);
  float stirF = uMouseForce * uStir * exp(-dist * dist * 5.0);
  vec2 dir2 = dist > 1e-4 ? d / dist : vec2(0.0);
  acc += (uCamRight * dir2.x + uCamUp * dir2.y) * stirF;

  // 点击爆发：扩散的脉冲环
  float age = uTime - uBurst.z;
  if(age > 0.0 && age < 2.0 && uBurst.w > 0.0){
    vec2 bd = ndc - uBurst.xy;
    bd.x *= uAspect;
    float bdist = length(bd);
    float radius = 0.15 + age * 1.1;
    float ring = exp(-pow((bdist - radius) * 4.5, 2.0));
    vec2 bdir2 = bdist > 1e-4 ? bd / bdist : vec2(0.0);
    acc += (uCamRight * bdir2.x + uCamUp * bdir2.y) * ring * uBurst.w * exp(-age * 2.2);
  }

  vel += acc * uDt;
  vel *= exp(-uDamp * uDt);
  float sp = length(vel);
  if(sp > uMaxSpeed){ vel *= uMaxSpeed / sp; }
  gl_FragColor = vec4(vel, 1.0);
}
`;

const POS_FRAG = /* glsl */`
uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform float uDt;
varying vec2 vUv;
void main(){
  vec3 pos = texture2D(uPosTex, vUv).xyz;
  vec3 vel = texture2D(uVelTex, vUv).xyz;
  pos += vel * uDt;
  pos = clamp(pos, vec3(-1.0), vec3(1.0));
  gl_FragColor = vec4(pos, 1.0);
}
`;

const RENDER_VERT = /* glsl */`
uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform float uSize;
uniform float uPR;
attribute vec2 ref;
varying float vSpeed;
varying float vShade;
void main(){
  vec3 pos = texture2D(uPosTex, ref).xyz;
  vec3 vel = texture2D(uVelTex, ref).xyz;
  vSpeed = length(vel);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = max(-mv.z, 0.1);
  gl_PointSize = min(uSize * uPR / dist, 42.0);
  vShade = smoothstep(5.0, 1.2, dist);
}
`;

const RENDER_FRAG = /* glsl */`
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uFoam;
uniform float uOpacity;
uniform float uSpeedScale;
varying float vSpeed;
varying float vShade;
void main(){
  vec2 pc = gl_PointCoord - vec2(0.5);
  float m = smoothstep(0.5, 0.06, length(pc));
  if(m <= 0.002) discard;
  float t = clamp(vSpeed * uSpeedScale, 0.0, 1.0);
  vec3 col = mix(uColorA, uColorB, t);
  col = mix(col, uFoam, smoothstep(0.65, 1.0, t) * 0.85);
  gl_FragColor = vec4(col, m * uOpacity * vShade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* ---------------- 粒子预算 ---------------- */
function particleBudget() {
  const coarse = window.matchMedia('(pointer:coarse)').matches;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 700;
  let n = (coarse || smallScreen) ? 40000 : 200000;
  const cores = navigator.hardwareConcurrency || 8;
  if (cores <= 4) n = Math.floor(n / 2);
  if (window.devicePixelRatio > 2.5 && !coarse) n = Math.floor(n * 0.75);
  return n;
}
function formatCount(n) {
  return n >= 10000 ? Math.round(n / 10000) + ' 万' : String(n);
}

/* ---------------- WebGL / 浮点 RT 检测 ---------------- */
function createRenderer() {
  try {
    const r = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!r.getContext()) return null;
    return r;
  } catch (e) {
    return null;
  }
}
function pickFloatType(renderer) {
  const gl = renderer.getContext();
  const isGL2 = renderer.capabilities.isWebGL2;
  const has = (n) => { try { return !!gl.getExtension(n); } catch (e) { return false; } };
  if (isGL2) {
    if (has('EXT_color_buffer_float')) return THREE.FloatType;
    if (has('EXT_color_buffer_half_float')) return THREE.HalfFloatType;
  } else {
    if (has('WEBGL_color_buffer_float') && has('OES_texture_float')) return THREE.FloatType;
    if (has('WEBGL_color_buffer_half_float') && has('OES_texture_half_float')) return THREE.HalfFloatType;
  }
  return null;
}

/* ---------------- 降级 ---------------- */
function showFallback() {
  const loader = $('#loader');
  if (loader) loader.style.display = 'none';
  const fb = $('#fallback');
  if (fb) fb.hidden = false;
  window.__fluidInfo = { fallback: true };
}

/* ---------------- 主流程 ---------------- */
let renderer, camera, points, simSceneV, simSceneP, simCam;
let posRT, velRT; // {read, write, swap()}
let velMat, posMat, renderMat;
let texSize = 0, particleCount = 0;
let floatType = THREE.FloatType;

const params = {};       // 当前（每帧向目标插值）
const targetParams = {}; // 目标
const colorA = new THREE.Color(), colorB = new THREE.Color();
const targetA = new THREE.Color(), targetB = new THREE.Color();
const foamColor = new THREE.Color(FOAM);

const mouse = { x: 0, y: 0, force: 0, targetForce: 0, lastT: 0, active: false };
const burst = { x: 0, y: 0, t: -10, strength: 0 };
const projView = new THREE.Matrix4();
const camRight = new THREE.Vector3(1, 0, 0), camUp = new THREE.Vector3(0, 1, 0);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let modeIndex = 0;
let resetFrames = 0;
let simTime = 0;
let degradeSteps = 0;
let fpsFrames = 0, fpsLast = performance.now(), fpsEma = 60, fpsWarmup = 0;

function makeRT(s) {
  return new THREE.WebGLRenderTarget(s, s, {
    type: floatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  });
}
function makePingPong(s) {
  const o = { read: makeRT(s), write: makeRT(s) };
  o.swap = () => { const t = o.read; o.read = o.write; o.write = t; };
  o.dispose = () => { o.read.dispose(); o.write.dispose(); };
  return o;
}

function buildSim(count) {
  if (posRT) { posRT.dispose(); velRT.dispose(); }
  if (points) { points.geometry.dispose(); sceneRef.remove(points); }
  particleCount = count;
  texSize = Math.ceil(Math.sqrt(count));
  posRT = makePingPong(texSize);
  velRT = makePingPong(texSize);

  const quad = new THREE.PlaneGeometry(2, 2);
  simSceneV = new THREE.Scene();
  simSceneP = new THREE.Scene();
  simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  velMat = new THREE.ShaderMaterial({
    uniforms: {
      uPosTex: { value: null }, uVelTex: { value: null },
      uDt: { value: 0 }, uTime: { value: 0 },
      uCurl: { value: 0 }, uDamp: { value: 0 }, uBuoy: { value: 0 },
      uSwirl: { value: 0 }, uGrav: { value: 0 }, uFreq: { value: 0 },
      uFlow: { value: 0 }, uMaxSpeed: { value: 1.5 }, uStir: { value: 0 },
      uMouse: { value: new THREE.Vector2() }, uMouseForce: { value: 0 },
      uAspect: { value: 1 }, uCamRight: { value: camRight }, uCamUp: { value: camUp },
      uProjView: { value: projView }, uBurst: { value: new THREE.Vector4(0, 0, -10, 0) },
      uReset: { value: 0 },
    },
    vertexShader: SIM_VERT, fragmentShader: VEL_FRAG,
  });
  posMat = new THREE.ShaderMaterial({
    uniforms: { uPosTex: { value: null }, uVelTex: { value: null }, uDt: { value: 0 } },
    vertexShader: SIM_VERT, fragmentShader: POS_FRAG,
  });
  const initPosMat = new THREE.ShaderMaterial({ vertexShader: SIM_VERT, fragmentShader: INIT_POS_FRAG });
  const initVelMat = new THREE.ShaderMaterial({ vertexShader: SIM_VERT, fragmentShader: INIT_VEL_FRAG });

  const renderInit = (mat, rt) => {
    const m = new THREE.Mesh(quad, mat);
    const sc = new THREE.Scene(); sc.add(m);
    renderer.setRenderTarget(rt);
    renderer.render(sc, simCam);
    renderer.setRenderTarget(null);
  };
  renderInit(initPosMat, posRT.read);
  renderInit(initPosMat, posRT.write);
  renderInit(initVelMat, velRT.read);
  renderInit(initVelMat, velRT.write);
  simSceneV.add(new THREE.Mesh(quad, velMat));
  simSceneP.add(new THREE.Mesh(quad, posMat));

  // 渲染：顶点从位置纹理取点
  const geo = new THREE.BufferGeometry();
  const total = texSize * texSize;
  const refs = new Float32Array(total * 2);
  for (let i = 0; i < total; i++) {
    refs[i * 2] = ((i % texSize) + 0.5) / texSize;
    refs[i * 2 + 1] = (Math.floor(i / texSize) + 0.5) / texSize;
  }
  geo.setAttribute('ref', new THREE.BufferAttribute(refs, 2));
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(total * 3), 3));
  geo.setDrawRange(0, count);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2);

  renderMat = new THREE.ShaderMaterial({
    uniforms: {
      uPosTex: { value: null }, uVelTex: { value: null },
      uColorA: { value: colorA }, uColorB: { value: colorB }, uFoam: { value: foamColor },
      uOpacity: { value: 0.55 }, uSpeedScale: { value: 0.9 },
      uSize: { value: 5 }, uPR: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: RENDER_VERT, fragmentShader: RENDER_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  points = new THREE.Points(geo, renderMat);
  points.frustumCulled = false;
  sceneRef.add(points);

  const stat = $('#stat');
  if (stat) stat.textContent = formatCount(count) + ' 粒子 · 全 GPU 计算';
  applyModeParams(MODES[modeIndex], true);
}

let sceneRef = null;

function applyModeParams(m, instant) {
  const keys = ['curl', 'damp', 'buoy', 'swirl', 'grav', 'freq', 'flow', 'stir', 'size', 'maxSpeed'];
  for (const k of keys) {
    targetParams[k] = m[k];
    if (instant || params[k] === undefined) params[k] = m[k];
  }
  targetA.set(m.colorA); targetB.set(m.colorB);
  if (instant) { colorA.set(m.colorA); colorB.set(m.colorB); }
}

function setMode(i, instant) {
  modeIndex = ((i % MODES.length) + MODES.length) % MODES.length;
  document.querySelectorAll('.mode-btn').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.mode) === modeIndex);
  });
  applyModeParams(MODES[modeIndex], instant);
  if (!instant) resetFrames = 2; // 速度场重置：清零两帧
}

/* ---------------- 交互 ---------------- */
function bindInteraction() {
  const toNDC = (cx, cy) => ({
    x: (cx / window.innerWidth) * 2 - 1,
    y: -((cy / window.innerHeight) * 2 - 1),
  });
  window.addEventListener('pointermove', (e) => {
    const p = toNDC(e.clientX, e.clientY);
    const now = performance.now();
    const dt = Math.max((now - mouse.lastT) / 1000, 1e-3);
    const dx = p.x - mouse.x, dy = p.y - mouse.y;
    const speed = Math.hypot(dx, dy) / dt;
    mouse.x = p.x; mouse.y = p.y; mouse.lastT = now; mouse.active = true;
    mouse.targetForce = clamp(0.25 + speed * 0.35, 0, 1.6);
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    const p = toNDC(e.clientX, e.clientY);
    mouse.x = p.x; mouse.y = p.y;
    burst.x = p.x; burst.y = p.y; burst.t = simTime; burst.strength = 7.0;
    mouse.targetForce = 1.2;
  }, { passive: true });
  window.addEventListener('pointerleave', () => { mouse.targetForce = 0; });
  document.querySelectorAll('.mode-btn').forEach((b) => {
    b.addEventListener('click', (e) => { e.stopPropagation(); setMode(Number(b.dataset.mode)); });
  });
}

/* ---------------- 帧循环 ---------------- */
const clock = new THREE.Clock();

function stepSim(dt) {
  const u = velMat.uniforms;
  u.uPosTex.value = posRT.read.texture;
  u.uVelTex.value = velRT.read.texture;
  u.uDt.value = dt;
  u.uTime.value = simTime;
  u.uCurl.value = params.curl; u.uDamp.value = params.damp;
  u.uBuoy.value = params.buoy; u.uSwirl.value = params.swirl;
  u.uGrav.value = params.grav; u.uFreq.value = params.freq;
  u.uFlow.value = params.flow; u.uMaxSpeed.value = params.maxSpeed;
  u.uStir.value = params.stir;
  u.uMouse.value.set(mouse.x, mouse.y);
  u.uMouseForce.value = mouse.force;
  u.uAspect.value = window.innerWidth / window.innerHeight;
  u.uBurst.value.set(burst.x, burst.y, burst.t, burst.strength);
  u.uReset.value = resetFrames > 0 ? 1 : 0;
  renderer.setRenderTarget(velRT.write);
  renderer.render(simSceneV, simCam);
  velRT.swap();
  if (resetFrames > 0) resetFrames--;

  const p = posMat.uniforms;
  p.uPosTex.value = posRT.read.texture;
  p.uVelTex.value = velRT.read.texture;
  p.uDt.value = dt;
  renderer.setRenderTarget(posRT.write);
  renderer.render(simSceneP, simCam);
  posRT.swap();
  renderer.setRenderTarget(null);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 1 / 30);
  simTime += dt;

  // 参数向目标做物理感插值（指数趋近 ≈ ease-out）
  const k = 1 - Math.exp(-3.2 * dt);
  for (const key of Object.keys(targetParams)) {
    params[key] += (targetParams[key] - params[key]) * k;
  }
  colorA.lerp(targetA, k); colorB.lerp(targetB, k);

  // 鼠标力衰减
  mouse.force += (mouse.targetForce - mouse.force) * (1 - Math.exp(-6 * dt));
  mouse.targetForce *= Math.exp(-1.4 * dt);

  // 相机缓慢环绕
  const t = simTime;
  const ang = reducedMotion ? 0.6 : t * 0.06;
  const rad = 3.4;
  camera.position.set(Math.sin(ang) * rad, reducedMotion ? 0.4 : 0.5 + Math.sin(t * 0.05) * 0.35, Math.cos(ang) * rad);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  const e = camera.matrixWorld.elements;
  camRight.set(e[0], e[1], e[2]).normalize();
  camUp.set(e[4], e[5], e[6]).normalize();

  stepSim(dt);

  renderMat.uniforms.uPosTex.value = posRT.read.texture;
  renderMat.uniforms.uVelTex.value = velRT.read.texture;
  renderMat.uniforms.uSize.value = params.size;
  renderer.render(sceneRef, camera);

  // FPS 自适应降档
  fpsFrames++; fpsWarmup += dt;
  const now = performance.now();
  if (now - fpsLast >= 2000) {
    fpsEma = fpsEma * 0.5 + (fpsFrames / ((now - fpsLast) / 1000)) * 0.5;
    fpsFrames = 0; fpsLast = now;
    if (fpsWarmup > 8 && fpsEma < 40 && degradeSteps < 2 && particleCount > 25000) {
      degradeSteps++;
      buildSim(Math.floor(particleCount / 2));
    }
  }
}

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  if (renderMat) renderMat.uniforms.uPR.value = Math.min(window.devicePixelRatio || 1, 2);
}
window.addEventListener('resize', onResize);

/* ---------------- 启动 ---------------- */
function boot() {
  const q = new URLSearchParams(location.search);
  const qi = parseInt(q.get('mode') || '0', 10);
  const qn = parseInt(q.get('n') || '0', 10); // 调试：粒子数覆盖（如 ?n=16384）

  renderer = createRenderer();
  if (!renderer) { showFallback(); return; }
  const qf = q.get('forcetype');
  if (qf === 'byte') {
    floatType = THREE.UnsignedByteType; // 调试：无浮点 FBO 环境的管线验证（位置量化，仅看编译+调度）
  } else {
    floatType = pickFloatType(renderer);
    if (!floatType) { showFallback(); return; }
  }

  renderer.setClearColor(new THREE.Color(DEEP), 1);
  renderer.toneMapping = THREE.NoToneMapping;
  $('#stage').appendChild(renderer.domElement);

  sceneRef = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 50);

  modeIndex = Number.isFinite(qi) ? clamp(qi, 0, 2) : 0;
  const budget = (Number.isFinite(qn) && qn >= 1024) ? qn : particleBudget();
  buildSim(budget);
  // 同步按钮高亮（?mode= 调试用）
  document.querySelectorAll('.mode-btn').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.mode) === modeIndex);
  });

  bindInteraction();
  onResize();
  clock.start();
  animate();

  // 加载态完成：首帧渲染后淡出（完成态必达）
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const loader = $('#loader');
    loader.classList.add('done');
    setTimeout(() => { loader.style.display = 'none'; }, 800);
  }));

  window.__fluid = {
    setMode: (i) => setMode(i),
    info: () => ({ particles: particleCount, texSize, mode: MODES[modeIndex].key, fps: Math.round(fpsEma) }),
  };
  window.__fluidInfo = { ok: true };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
