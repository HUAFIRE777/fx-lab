/* ============================================================
 * sand-dune-3d · 沙丘风场
 * 程序化沙丘高度场 + 数千沙粒沿风场流淌 + 相机缓慢漫游
 * 配色（全页严格三色）：沙金 #E8C47A / 深棕 #2A1E12 / 米白 #F5EDDA
 * shader 内全部用 sRGB 直值（ShaderMaterial 不走 three 颜色管理，不做转换）
 * ============================================================ */
document.documentElement.classList.add('js');

import * as THREE from 'three';

/* ---------- 基础 ---------- */
const stage = document.getElementById('stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }
if (!renderer || !renderer.getContext()) {
  document.documentElement.classList.add('nogl');
  throw new Error('WebGL unavailable');
}
const DPR = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(DPR);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color(0x2A1E12), 1);
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2A1E12);
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);

const isMobile = window.innerWidth < 640 || 'ontouchstart' in window;
const timeScale = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.25 : 1;

/* ---------- sRGB 直值 ---------- */
const SAND = new THREE.Vector3(0.9098, 0.7686, 0.4784); // #E8C47A
const SOIL = new THREE.Vector3(0.1647, 0.1176, 0.0706); // #2A1E12
const BONE = new THREE.Vector3(0.9608, 0.9294, 0.8549); // #F5EDDA
const SUN  = new THREE.Vector3(-0.62, 0.34, -0.42).normalize(); // 低角度暖阳（指向太阳）

/* ---------- 共享 GLSL：Ashima snoise 2D + 三档沙丘高度场 ---------- */
const GLSL_COMMON = /* glsl */`
vec3 permute_(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute_(permute_(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<4;i++){ v += a*snoise(p); p = p*2.03 + 11.7; a *= 0.5; }
  return v;
}
/* 三档沙丘：0 新月(barchan) / 1 横脊(transverse) / 2 星形(star)，mode 连续值三角混合 */
float duneH(vec2 p, float mode){
  float base = fbm(p*0.16)*1.45 + fbm(p*0.45 + 7.3)*0.35;
  float ang = atan(p.y, p.x);
  float d0 = length(p*vec2(0.42,0.85)) - 5.2;                    /* 新月：月牙形主脊 */
  float m0 = 2.6*exp(-d0*d0/9.0)*(0.72+0.28*cos(2.0*ang))*(0.89+0.22*smoothstep(-4.0,4.0,p.x));
  float s1 = sin(p.x*0.85 + fbm(p*0.28 + 3.1)*3.4);              /* 横脊：平行脊线 */
  float m1 = 2.3*pow(0.5+0.5*s1, 1.7)*exp(-p.x*p.x/260.0);
  float r = length(p);                                          /* 星形：中央峰 + 五臂 */
  float arms = 0.5+0.5*sin(ang*5.0 + fbm(p*0.35 + 9.7)*4.2);
  float m2 = 3.6*exp(-r*r/80.0)*(0.32+0.68*pow(arms,1.6));
  float w0 = max(0.0, 1.0-abs(mode-0.0));
  float w1 = max(0.0, 1.0-abs(mode-1.0));
  float w2 = max(0.0, 1.0-abs(mode-2.0));
  return base + m0*w0 + m1*w1 + m2*w2;
}
`;

/* ---------- 沙丘网格 ---------- */
const PLANE_W = 36, PLANE_H = 26;
const SEG = isMobile ? [120, 88] : [210, 150];
const duneUniforms = {
  uTime:    { value: 0 },
  uMode:    { value: 0 },
  uWindDir: { value: new THREE.Vector2(1, 0) },
  uWindN:   { value: 0.45 },
  uSun:     { value: SUN },
  uSand:    { value: SAND },
  uSoil:    { value: SOIL },
  uBone:    { value: BONE },
  uFogColor:{ value: SOIL },
  uFogNear: { value: 17 },
  uFogFar:  { value: 40 },
};
const duneMat = new THREE.ShaderMaterial({
  uniforms: duneUniforms,
  vertexShader: /* glsl */`
    uniform float uTime;
    uniform float uMode;
    varying vec3 vNw;
    varying vec3 vWp;
    varying float vH;
    varying vec2 vGp;
    ${GLSL_COMMON}
    void main(){
      vec2 gp = position.xy;
      float e = 0.35;
      float h  = duneH(gp, uMode);
      float hx = duneH(gp + vec2(e,0.0), uMode);
      float hy = duneH(gp + vec2(0.0,e), uMode);
      vec3 n = normalize(vec3(-(hx-h)/e, -(hy-h)/e, 1.0));
      vec3 pos = vec3(gp, h);
      vNw = normalize(mat3(modelMatrix) * n);
      vec4 wp = modelMatrix * vec4(pos, 1.0);
      vWp = wp.xyz; vH = h; vGp = gp;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform vec3 uSun, uSand, uSoil, uBone, uFogColor;
    uniform vec2 uWindDir;
    uniform float uWindN, uTime, uFogNear, uFogFar;
    varying vec3 vNw;
    varying vec3 vWp;
    varying float vH;
    varying vec2 vGp;
    ${GLSL_COMMON}
    void main(){
      vec3 N = normalize(vNw);
      vec3 V = normalize(cameraPosition - vWp);
      float wrap = clamp((dot(N, uSun) + 0.55) / 1.55, 0.0, 1.0);
      /* 风蚀波纹：波峰线垂直于风向，随风向实时改向 */
      float rip = sin(dot(vGp, uWindDir)*6.5 + fbm(vGp*0.9 + uTime*0.05)*5.0);
      float ripM = smoothstep(0.12, 1.0, rip*0.5 + 0.5) * (0.2 + 0.8*uWindN);
      /* 高度色带：洼地深棕 → 沙金 → 脊线米白 */
      vec3 col = mix(uSoil*1.4, uSand, smoothstep(-0.6, 4.0, vH));
      col = mix(col, uBone, smoothstep(2.6, 4.6, vH)*0.55);
      col *= 0.36 + 0.86*pow(wrap, 1.2);
      col += uSand * ripM * 0.10 * wrap;
      /* 沙粒闪光 */
      vec3 R = reflect(-uSun, N);
      float spec = pow(max(dot(R, V), 0.0), 90.0);
      col += uBone * spec * (0.10 + 0.28*ripM);
      /* 雾：远端融入深棕背景 */
      float f = smoothstep(uFogNear, uFogFar, distance(cameraPosition, vWp));
      col = mix(col, uFogColor, f);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
const dune = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_W, PLANE_H, SEG[0], SEG[1]), duneMat);
dune.rotation.x = -Math.PI / 2;
dune.frustumCulled = false;
scene.add(dune);

/* ---------- 沙粒：沿风场流淌（参数化流线，无积分、无爆点） ---------- */
const GRAIN_N = isMobile ? 2400 : 5600;
const grainUniforms = {
  uTime:   { value: 0 },
  uMode:   { value: 0 },
  uWindVec:{ value: new THREE.Vector2(1, 0) },
  uWindN:  { value: 0.45 },
  uSand:   { value: SAND },
  uBone:   { value: BONE },
  uPx:     { value: DPR },
};
function makeSeeds(n){
  const a = new Float32Array(n * 4);
  for (let i = 0; i < n * 4; i++) a[i] = Math.random();
  return a;
}
const grainGeo = new THREE.BufferGeometry();
grainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(GRAIN_N * 3), 3));
grainGeo.setAttribute('aSeed', new THREE.BufferAttribute(makeSeeds(GRAIN_N), 4));
const grainMat = new THREE.ShaderMaterial({
  uniforms: grainUniforms,
  transparent: true,
  depthWrite: false,
  vertexShader: /* glsl */`
    uniform float uTime, uMode, uWindN, uPx;
    uniform vec2 uWindVec;
    attribute vec4 aSeed;
    varying float vA;
    varying float vMix;
    ${GLSL_COMMON}
    void main(){
      float s1 = aSeed.x, s2 = aSeed.y, s3 = aSeed.z, s4 = aSeed.w;
      float life = fract(uTime*(0.045 + uWindN*0.34)*(0.65 + s2*0.7) + s1);
      vec2 w = normalize(uWindVec + vec2(1e-4, 0.0));
      vec2 perp = vec2(-w.y, w.x);
      float travel = 34.0;
      float along = life*travel - travel*0.5;
      float wob = snoise(vec2(life*3.0 + s2*17.0, s3*11.0)) * (0.5 + uWindN*2.4);
      vec2 gp = w*along + perp*((s3-0.5)*26.0 + wob);
      float hopF = 2.0 + s4*3.0;
      float hopA = 0.10 + uWindN*1.15;
      float y = duneH(gp, uMode) + 0.07 + hopA*pow(abs(sin(life*hopF*3.14159)), 1.3);
      vec4 wp = modelMatrix * vec4(gp.x, gp.y, y, 1.0);
      /* 注意：粒子在 mesh 局部系里用 (x, y平面, z高)；经 mesh 旋转与沙丘对齐 */
      vec4 mv = viewMatrix * wp;
      float dist = -mv.z;
      gl_PointSize = (1.5 + s4*2.4) * uPx * (160.0 / dist) * 0.14;
      gl_PointSize = min(gl_PointSize, 9.0*uPx);
      float edge = smoothstep(0.0, 0.07, life) * (1.0 - smoothstep(0.93, 1.0, life));
      vA = edge * (0.12 + 0.88*uWindN) * (0.55 + 0.45*s2);
      vMix = s3;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform vec3 uSand, uBone;
    varying float vA;
    varying float vMix;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      float m = smoothstep(0.5, 0.1, d);
      vec3 col = mix(uSand, uBone, vMix*0.6);
      gl_FragColor = vec4(col, m * vA * 0.85);
    }
  `,
});
/* 粒子 mesh 同样做 -90° 旋转，局部 (x, y, z高) 与沙丘局部系一致 */
const grains = new THREE.Points(grainGeo, grainMat);
grains.rotation.x = -Math.PI / 2;
grains.frustumCulled = false;
scene.add(grains);

/* ---------- 远尘：极淡的大颗粒漂浮，给空气纵深 ---------- */
const DUST_N = isMobile ? 120 : 260;
const dustUniforms = {
  uTime: { value: 0 },
  uWindVec: { value: new THREE.Vector2(1, 0) },
  uSand: { value: SAND },
  uPx: { value: DPR },
};
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DUST_N * 3), 3));
dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(makeSeeds(DUST_N), 4));
const dustMat = new THREE.ShaderMaterial({
  uniforms: dustUniforms,
  transparent: true,
  depthWrite: false,
  vertexShader: /* glsl */`
    uniform float uTime, uPx;
    uniform vec2 uWindVec;
    attribute vec4 aSeed;
    varying float vA;
    void main(){
      vec2 w = normalize(uWindVec + vec2(1e-4, 0.0));
      vec2 perp = vec2(-w.y, w.x);
      float t = uTime*0.014*(0.5+aSeed.y);
      vec2 gp = w*(fract(t + aSeed.x)*44.0 - 22.0) + perp*((aSeed.z-0.5)*30.0);
      float y = 1.5 + aSeed.w*5.0 + sin(uTime*0.2 + aSeed.x*20.0)*0.8;
      vec4 mv = viewMatrix * modelMatrix * vec4(gp.x, gp.y, y, 1.0);
      float dist = -mv.z;
      gl_PointSize = min((18.0 + aSeed.z*30.0) * uPx * (160.0/dist) * 0.14, 44.0*uPx);
      vA = 0.028 + 0.022*aSeed.y;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform vec3 uSand;
    varying float vA;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      float m = smoothstep(0.5, 0.05, d);
      gl_FragColor = vec4(uSand, m * vA);
    }
  `,
});
const dust = new THREE.Points(dustGeo, dustMat);
dust.rotation.x = -Math.PI / 2;
dust.frustumCulled = false;
scene.add(dust);

/* ---------- 状态（目标值）与缓动当前值 ---------- */
const S = {
  windT: 0.45, windC: 0.45,          // 风速 0..1
  dirT: 60 * Math.PI / 180, dirC: 60 * Math.PI / 180, // 风向（拨盘度数→弧度）
  modeT: 0, modeC: 0,                // 沙丘形态
  gust: 0,                          // 切换形态时的阵风
};
const windVecT = new THREE.Vector2(), windVecC = new THREE.Vector2();
function dirToVec(deg, out){
  const a = (90 - deg) * Math.PI / 180;
  out.set(Math.cos(a), Math.sin(a));
  return out;
}
dirToVec(60, windVecT); windVecC.copy(windVecT);

/* ---------- 相机：缓慢 dolly 漫游 + 拖拽接管 ---------- */
let theta = 0.7, yawOff = 0, pitchOff = 0, dragging = false, lastPX = 0, lastPY = 0;
let needRecenter = false;
stage.addEventListener('pointerdown', (e) => {
  dragging = true; needRecenter = false;
  lastPX = e.clientX; lastPY = e.clientY;
  stage.classList.add('dragging');
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  yawOff   = THREE.MathUtils.clamp(yawOff - (e.clientX - lastPX) * 0.0042, -1.25, 1.25);
  pitchOff = THREE.MathUtils.clamp(pitchOff - (e.clientY - lastPY) * 0.0032, -0.55, 0.75);
  lastPX = e.clientX; lastPY = e.clientY;
});
function endDrag(){
  dragging = false; needRecenter = true;
  stage.classList.remove('dragging');
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('dblclick', () => { yawOff = 0; pitchOff = 0; });

function updateCamera(t, dt){
  theta += dt * 0.030 * timeScale;
  if (needRecenter && !dragging) {
    const k = 1 - Math.exp(-dt * 0.55);
    yawOff += (0 - yawOff) * k;
    pitchOff += (0 - pitchOff) * k;
    if (Math.abs(yawOff) < 0.002 && Math.abs(pitchOff) < 0.002) { yawOff = 0; pitchOff = 0; needRecenter = false; }
  }
  const r = 15.5 + 2.0 * Math.sin(t * 0.045);
  const h = 4.6 + 1.05 * Math.sin(t * 0.06 + 1.2) + pitchOff * 6.0;
  const a = theta + yawOff;
  camera.position.set(Math.sin(a) * r, Math.max(h, 1.8), Math.cos(a) * r);
  camera.lookAt(0, 1.2, 0);
}

/* ---------- 控件：风速滑杆 ---------- */
const windRange = document.getElementById('windRange');
const windVal = document.getElementById('windVal');
function paintRange(){
  windRange.style.setProperty('--fill', windRange.value + '%');
}
windRange.addEventListener('input', () => {
  S.windT = windRange.value / 100;
  windVal.textContent = windRange.value;
  paintRange();
});
paintRange();

/* ---------- 控件：风向拨盘 ---------- */
const dial = document.getElementById('dial');
const needle = document.getElementById('needle');
const dirDeg = document.getElementById('dirDeg');
const dirName = document.getElementById('dirName');
const COMPASS = ['北','北东北','东北','东东北','东','东东南','东南','南东南','南','南西南','西南','西西南','西','西西北','西北','北西北'];
for (let i = 0; i < 12; i++) {
  const tick = document.createElement('div');
  tick.className = 'tick';
  const a = i * 30;
  tick.style.transform = `rotate(${a}deg) translateY(-37px)`;
  if (isMobile) tick.style.transform = `rotate(${a}deg) translateY(-29px)`;
  dial.appendChild(tick);
}
function setDial(deg){
  deg = ((deg % 360) + 360) % 360;
  S.dirT = deg;
  needle.style.transform = `rotate(${deg}deg)`;
  dirDeg.textContent = Math.round(deg) + '°';
  dirName.textContent = COMPASS[Math.round(deg / 22.5) % 16];
  dial.setAttribute('aria-valuenow', Math.round(deg));
  dirToVec(deg, windVecT);
}
function dialAngle(e){
  const r = dial.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  return (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360; // 0°=北，顺时针
}
let dialing = false;
dial.addEventListener('pointerdown', (e) => { dialing = true; dial.setPointerCapture(e.pointerId); setDial(dialAngle(e)); });
dial.addEventListener('pointermove', (e) => { if (dialing) setDial(dialAngle(e)); });
dial.addEventListener('pointerup', () => { dialing = false; });
dial.addEventListener('pointercancel', () => { dialing = false; });
dial.addEventListener('keydown', (e) => {
  const cur = parseFloat(dial.getAttribute('aria-valuenow')) || 0;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setDial(cur - 5); e.preventDefault(); }
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setDial(cur + 5); e.preventDefault(); }
});
setDial(60);
needle.style.transition = 'none';

/* ---------- 控件：沙丘形态三档 ---------- */
const modeBtns = [...document.querySelectorAll('#modes button')];
modeBtns.forEach((b) => {
  b.addEventListener('click', () => {
    modeBtns.forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    const m = parseInt(b.dataset.mode, 10);
    if (m !== S.modeT) { S.modeT = m; S.gust = 1; } // 切换带一阵风
  });
});

/* ---------- 主循环 ---------- */
const clock = new THREE.Clock();
let elapsed = 0, firstFrame = true;
function easeRate(dt, speed){ return 1 - Math.exp(-dt * speed); }

function tick(){
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = (elapsed += dt * timeScale);

  /* 缓动跟随目标值：物理感 */
  S.windC += (S.windT - S.windC) * easeRate(dt, 2.6);
  S.gust *= Math.exp(-dt * 1.1);
  const windEff = THREE.MathUtils.clamp(S.windC + S.gust * 0.35, 0, 1.4);
  S.modeC += (S.modeT - S.modeC) * easeRate(dt, 2.1);
  const dirK = easeRate(dt, 1.9);
  /* 角度最短弧插值 */
  let d = ((S.dirT - S.dirC + 540) % 360) - 180;
  S.dirC = (S.dirC + d * dirK + 360) % 360;
  dirToVec(S.dirC, windVecC);

  duneUniforms.uTime.value = t;
  duneUniforms.uMode.value = S.modeC;
  duneUniforms.uWindDir.value.copy(windVecC);
  duneUniforms.uWindN.value = Math.min(windEff, 1);
  grainUniforms.uTime.value = t;
  grainUniforms.uMode.value = S.modeC;
  grainUniforms.uWindVec.value.copy(windVecC);
  grainUniforms.uWindN.value = Math.min(windEff, 1);
  dustUniforms.uTime.value = t;
  dustUniforms.uWindVec.value.copy(windVecC);

  updateCamera(t, dt);
  renderer.render(scene, camera);

  if (firstFrame) {
    firstFrame = false;
    setTimeout(() => document.documentElement.classList.add('done'), 350);
  }
}
tick();

/* ---------- 自适应 ---------- */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- 兜底：6 秒还没 done 就强制检查 ---------- */
setTimeout(() => {
  if (!document.documentElement.classList.contains('done') && renderer) {
    document.documentElement.classList.add('done');
  }
}, 6000);
