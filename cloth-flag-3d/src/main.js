/* cloth-flag-3d · 布料波浪 shader —— 原创实现
 * 手法借鉴：品牌官网丝绸/旗帜背景的"顶点波浪 + 风力可调"思路，
 * 位移函数、噪声组合、涟漪扩散、展旗卷筒均为本模板独立编写。
 */
import * as THREE from 'three';

/* ---------------- 基础 ---------------- */
const INK = 0x0d0b09;
const isMobile = matchMedia('(max-width: 640px)').matches || matchMedia('(pointer: coarse)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const PLANE_W = 10.5, PLANE_H = 6.6;
const SEG = isMobile ? [76, 48] : [150, 92];

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.NoToneMapping;
if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('bg').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(INK);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 60);
camera.position.set(0, 0, 9.6);

/* ---------------- 缓动 ---------------- */
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const tweens = [];
function tween(dur, onUpdate, { ease = easeInOutCubic, onDone = null } = {}) {
  tweens.push({ t: 0, dur, onUpdate, ease, onDone });
}
function stepTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(tw.t / tw.dur, 1);
    tw.onUpdate(tw.ease(k));
    if (k >= 1) { tweens.splice(i, 1); tw.onDone && tw.onDone(); }
  }
}

/* ---------------- GLSL：Ashima simplex 噪声（标准公开实现，手法借鉴非源码复制场景） ---------------- */
const SNOISE = /* glsl */`
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

/* ---------------- 布料 shader ---------------- */
const VERT = /* glsl */`
${SNOISE}
uniform float uTime, uWind, uMode, uReveal;
uniform vec4 uRipples[6];
varying vec2 vUv;
varying vec3 vNW;
varying vec3 vWP;
varying float vEdge;
varying float vH;

const float PW = ${PLANE_W.toFixed(1)};
const float PH = ${PLANE_H.toFixed(1)};

/* 基础高度场：三层正弦 + 单次 simplex 噪声复用，三种形态 */
float baseH(vec2 q){
  float t = uTime;
  float w = uWind;
  float amp = 0.10 + 0.95 * w;
  float spd = 0.5 + 2.4 * w;
  float nz  = snoise(vec3(q * 4.2, t * 0.55));
  float nz2 = snoise(vec3(q * vec2(9.0, 6.0) + 7.3, t * 0.9));

  /* 0 旗：左缘固定，波向右缘传播放大 */
  float f0 = ( sin(q.x*22.0 - t*spd*2.0) * 0.55
            + sin(q.x*11.0 + q.y*14.0 - t*spd*1.25) * 0.30
            + nz * 0.45 + nz2 * 0.12 ) * q.x;
  /* 1 绸：上缘固定，垂落，噪声主导的慢浪 */
  float hang = 1.0 - q.y;
  float f1 = ( sin(q.x*13.0 + t*spd*0.9 + nz*1.5) * 0.5
            + nz * 0.6 + nz2 * 0.15 ) * (0.2 + 0.8*hang);
  /* 2 幅：上下固定，中部鼓动 */
  float belly = sin(q.y * 3.14159265);
  float f2 = belly * ( sin(t*spd*1.7 + q.x*15.0 + nz*2.0) * 0.55
            + nz2 * 0.3 + nz * 0.2 );

  float m = uMode;
  float f = m < 1.0 ? mix(f0, f1, m) : mix(f1, f2, m - 1.0);
  return f * amp;
}

/* 涟漪：径向扩散的衰减波环 */
float ripH(vec2 q){
  float h = 0.0;
  for(int i = 0; i < 6; i++){
    vec4 r = uRipples[i];
    float age = uTime - r.z;
    if(age > 0.0 && age < 2.5){
      float d = distance(q, r.xy);
      float rad = age * 0.9;
      float g = (d - rad) * 9.0;
      float band = exp(-g * g) * exp(-age * 1.8);
      h += sin((d - rad) * 46.0) * band * r.w;
    }
  }
  return h * (0.25 + 0.35 * uWind);
}

void main(){
  vUv = uv;
  float h = baseH(uv) + ripH(uv);
  vH = h;

  /* 高度场法线（数值偏导，涟漪不计入法线以省性能） */
  float e = 0.015;
  float hx = baseH(uv + vec2(e,0.0)) - baseH(uv - vec2(e,0.0));
  float hy = baseH(uv + vec2(0.0,e)) - baseH(uv - vec2(0.0,e));
  vec3 n = normalize(vec3(-hx/(2.0*e*PW), -hy/(2.0*e*PH), 1.0));

  vec3 p = position;
  p.z += h;

  /* 展旗：未展开部分卷成筒，卷边从左扫到右 */
  float edgeX = mix(-PW*0.5 - 0.8, PW*0.5 + 0.8, uReveal);
  if(p.x > edgeX){
    float d = p.x - edgeX;
    float R = 0.42;
    float a = d / R;
    float ca = cos(a), sa = sin(a);
    p.x = edgeX + R * sa;
    p.z += R * (1.0 - ca);
    n = vec3(n.x*ca + n.z*sa, n.y, -n.x*sa + n.z*ca);
  }

  float ex = min(uv.x, 1.0 - uv.x);
  float ey = min(uv.y, 1.0 - uv.y);
  vEdge = smoothstep(0.0, 0.035, min(ex, ey));

  vNW = normalize(mat3(modelMatrix) * n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAG = /* glsl */`
precision highp float;
uniform float uFade;
varying vec2 vUv;
varying vec3 vNW;
varying vec3 vWP;
varying float vEdge;
varying float vH;

void main(){
  vec3 N = normalize(vNW);
  /* 双面光照差异：背面翻转法线并压暗偏冷 */
  bool back = !gl_FrontFacing;
  if(back) N = -N;

  vec3 L = normalize(vec3(-0.45, 0.55, 0.75));
  vec3 V = normalize(cameraPosition - vWP);
  float diff = clamp(dot(N, L), 0.0, 1.0);
  float wrap = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);

  vec3 deep = vec3(0.420, 0.102, 0.051);  /* #6b1a0d */
  vec3 mid  = vec3(0.761, 0.227, 0.133); /* #c23a22 朱砂 */
  vec3 hi   = vec3(0.910, 0.380, 0.210); /* 受光提亮 */
  vec3 col = mix(deep, mid, smoothstep(0.12, 0.95, wrap));
  col = mix(col, hi, pow(diff, 2.0) * 0.5);

  /* 丝绸高光 */
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 36.0);
  col += vec3(1.0, 0.85, 0.70) * spec * 0.34;

  if(back){
    col *= 0.66;
    col = mix(col, vec3(0.16, 0.09, 0.08), 0.28);
  }

  /* 边缘压暗：布料厚度感 */
  col *= mix(0.52, 1.0, vEdge);
  /* 高度微染色：波峰略亮 */
  col *= 0.92 + 0.16 * clamp(vH * 2.0 + 0.5, 0.0, 1.0);

  gl_FragColor = vec4(col, uFade);
}
`;

/* ---------------- 涟漪槽位 ---------------- */
const RIPPLE_N = 6;
const ripples = [];
for (let i = 0; i < RIPPLE_N; i++) ripples.push(new THREE.Vector4(0, 0, -10, 0));
let ripIdx = 0, elapsed = 0;
function addRipple(u, v, strength = 0.5) {
  ripples[ripIdx].set(
    Math.min(Math.max(u, 0.02), 0.98),
    Math.min(Math.max(v, 0.02), 0.98),
    elapsed, strength);
  ripIdx = (ripIdx + 1) % RIPPLE_N;
}

function makeClothMaterial(fade) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uWind: { value: 0.0 },
      uMode: { value: 0 },
      uReveal: { value: 0 },
      uFade: { value: fade },
      uRipples: { value: ripples },
    },
  });
}

const clothMat = makeClothMaterial(1.0);
const cloth = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_W, PLANE_H, SEG[0], SEG[1]), clothMat);
scene.add(cloth);

/* ---------------- 边缘飘带（复用同一 shader，uv 映射到旗面自由端） ---------------- */
const ribbonMat = makeClothMaterial(1.0);
const ribbons = [];
{
  const spots = [1.0, 0.0, -1.0];
  for (const y of spots) {
    const g = new THREE.PlaneGeometry(0.6, 3.6, 10, 64);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, 0.74 + uv.getX(i) * 0.26);
    const m = new THREE.Mesh(g, ribbonMat);
    m.position.set(PLANE_W / 2 + 0.24, y, 0.15);
    scene.add(m);
    ribbons.push(m);
  }
}

/* ---------------- 杆（旗/绸/幅三种悬挂件，模式切换淡入淡出） ---------------- */
const rodMat = new THREE.MeshBasicMaterial({ color: 0x6b543a, transparent: true, opacity: 1 });
function rod(w, h, x, y, vertical) {
  const g = vertical ? new THREE.CylinderGeometry(0.06, 0.06, h, 12)
                     : new THREE.CylinderGeometry(0.045, 0.045, w, 12);
  const m = new THREE.Mesh(g, rodMat.clone());
  if (!vertical) m.rotation.z = Math.PI / 2;
  m.position.set(x, y, -0.05);
  scene.add(m);
  return m;
}
const poleFlag = rod(0, PLANE_H + 0.3, -PLANE_W / 2 - 0.07, 0, true);
const finial = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), rodMat.clone());
finial.position.set(-PLANE_W / 2 - 0.07, PLANE_H / 2 + 0.15, -0.05);
scene.add(finial);
const rodSilk = rod(PLANE_W + 0.6, 0, 0, PLANE_H / 2 + 0.06, false);
const rodBanT = rod(PLANE_W + 0.6, 0, 0, PLANE_H / 2 + 0.06, false);
const rodBanB = rod(PLANE_W + 0.6, 0, 0, -PLANE_H / 2 - 0.06, false);
const rodMeshes = [poleFlag, finial, rodSilk, rodBanT, rodBanB];
function rodTargets(mode) {
  return [
    mode < 0.5 ? 1 : 0,          // poleFlag
    mode < 0.5 ? 1 : 0,          // finial
    (mode > 0.5 && mode < 1.5) ? 1 : 0, // rodSilk
    mode > 1.5 ? 1 : 0,          // rodBanT
    mode > 1.5 ? 1 : 0,          // rodBanB
  ];
}
let rodTarget = rodTargets(0);

/* ---------------- 状态：风力 / 形态 ---------------- */
let windTarget = 0.42, windCur = 0.0, gust = 0;
let modeCur = 0;

const slider = document.getElementById('wind');
const windVal = document.getElementById('windVal');
slider.addEventListener('input', () => {
  windTarget = slider.value / 100;
  windVal.textContent = slider.value;
});

const modeBtns = [...document.querySelectorAll('.modes button')];
modeBtns.forEach(btn => btn.addEventListener('click', () => setMode(+btn.dataset.mode)));
function setMode(i) {
  if (i === Math.round(modeCur) && tweens.length === 0) { /* 仍允许重复点击补阵风 */ }
  const from = modeCur;
  tween(1.4, k => {
    modeCur = from + (i - from) * k;
    clothMat.uniforms.uMode.value = modeCur;
    ribbonMat.uniforms.uMode.value = modeCur;
    rodTarget = rodTargets(modeCur);
  }, { onDone: () => { modeCur = i; } });
  gust = Math.min(gust + 0.55, 0.9); // 切换形态带起一阵风，物理感
  modeBtns.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.mode === i)));
}

/* ---------------- 拨动涟漪 ---------------- */
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
let dragging = false, lastRip = 0, lastU = -1, lastV = -1;
const cvs = renderer.domElement;
function castAt(cx, cy) {
  ptr.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObject(cloth, false)[0];
  return hit ? hit.uv : null;
}
function poke(cx, cy, force) {
  const uv = castAt(cx, cy);
  if (!uv) return;
  const now = performance.now();
  const moved = Math.hypot(uv.x - lastU, uv.y - lastV);
  if (force || moved > 0.035 || now - lastRip > 110) {
    addRipple(uv.x, uv.y, 0.42 + Math.random() * 0.2);
    lastRip = now; lastU = uv.x; lastV = uv.y;
  }
}
cvs.addEventListener('pointerdown', e => {
  dragging = true;
  cvs.setPointerCapture(e.pointerId);
  poke(e.clientX, e.clientY, true);
});
cvs.addEventListener('pointermove', e => { if (dragging) poke(e.clientX, e.clientY, false); });
addEventListener('pointerup', () => { dragging = false; });

/* ---------------- 加载：展旗 ---------------- */
const loader = document.getElementById('loader');
let revealed = false;
function reveal() {
  if (revealed) return;
  revealed = true;
  if (reduced) {
    clothMat.uniforms.uReveal.value = 1;
    ribbonMat.uniforms.uReveal.value = 1;
    loader.classList.add('done');
    document.documentElement.classList.add('is-in');
    setTimeout(() => loader.setAttribute('hidden', ''), 1000);
    return;
  }
  tween(2.4, k => {
    clothMat.uniforms.uReveal.value = k;
    ribbonMat.uniforms.uReveal.value = k;
    if (k > 0.55) loader.classList.add('done');
  }, {
    ease: easeInOutCubic,
    onDone: () => {
      document.documentElement.classList.add('is-in');
      setTimeout(() => loader.setAttribute('hidden', ''), 1000);
      addRipple(0.5, 0.5, 0.5); // 落定后中央一圈涟漪，点睛
    },
  });
}

/* ---------------- 主循环 ---------------- */
let prev = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - prev) / 1000, 0.05);
  prev = now;
  elapsed += dt;
  stepTweens(dt);

  /* 风力：滑杆目标 + 阵风衰减，lerp 跟随有惯性 */
  gust *= Math.exp(-dt * 1.6);
  const wEff = Math.min(windTarget + gust, 1.25);
  windCur += (wEff - windCur) * Math.min(1, dt * 2.6);
  clothMat.uniforms.uTime.value = elapsed;
  clothMat.uniforms.uWind.value = windCur;
  ribbonMat.uniforms.uTime.value = elapsed;
  ribbonMat.uniforms.uWind.value = Math.min(windCur * 1.15, 1.25);

  /* 杆与飘带淡入淡出 */
  rodMeshes.forEach((m, i) => {
    const t = rodTarget[i];
    m.material.opacity += (t - m.material.opacity) * Math.min(1, dt * 4);
    m.visible = m.material.opacity > 0.02;
  });
  const rf = modeCur < 0.5 ? 1 : Math.max(0, 1 - (modeCur - 0.5) * 2.2);
  const rfo = ribbonMat.uniforms.uFade;
  rfo.value += (rf - rfo.value) * Math.min(1, dt * 4);
  ribbons.forEach(r => { r.visible = rfo.value > 0.02; });

  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
requestAnimationFrame(() => setTimeout(reveal, 350));

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* 兜底：6 秒后无论如何显示文字层（防 shader 异常导致标题永隐） */
setTimeout(() => {
  document.documentElement.classList.add('is-in');
  loader.classList.add('done');
}, 7000);
