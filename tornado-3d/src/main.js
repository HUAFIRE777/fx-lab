/* tornado-3d · 龙卷风粒子柱
 * 纯程序化：螺旋粒子漏斗 + 碎片 + 地面尘环 + 云底
 * 三色：#1A1D21 / #8A9199 / #FF7A1A
 */
import * as THREE from 'three';

/* ================= EF 等级参数 ================= */
const EF_LEVELS = [
  { label: 'EF0', wind: '105–137 km/h', dmg: '掀翻屋顶瓦片', density: 0.22, spin: 1.6, rise: 0.55, width: 0.55, debris: 0.15, ring: 0.35, flash: 0.15 },
  { label: 'EF1', wind: '138–178 km/h', dmg: '掀翻活动板房', density: 0.38, spin: 2.4, rise: 0.72, width: 0.70, debris: 0.32, ring: 0.50, flash: 0.30 },
  { label: 'EF2', wind: '179–218 km/h', dmg: '连根拔起大树', density: 0.55, spin: 3.4, rise: 0.90, width: 0.85, debris: 0.52, ring: 0.65, flash: 0.50 },
  { label: 'EF3', wind: '219–266 km/h', dmg: '整面墙被撕走',   density: 0.72, spin: 4.6, rise: 1.10, width: 1.00, debris: 0.72, ring: 0.80, flash: 0.70 },
  { label: 'EF4', wind: '267–322 km/h', dmg: '房屋只剩地基',   density: 0.88, spin: 6.0, rise: 1.30, width: 1.16, debris: 0.88, ring: 0.92, flash: 0.90 },
  { label: 'EF5', wind: '＞322 km/h',    dmg: '汽车抛上半空',   density: 1.00, spin: 7.6, rise: 1.55, width: 1.32, debris: 1.00, ring: 1.00, flash: 1.20 },
];
const FUNNEL_H = 14;          // 漏斗高度
const STORM = 0x1A1D21, DUST = 0x8A9199, WARN = 0xFF7A1A;

const state = {
  ef: 3,
  cur: { ...EF_LEVELS[3] },   // 当前（插值后）参数
  tgt: { ...EF_LEVELS[3] },   // 目标参数
  timeScale: 1, timeScaleTgt: 1,
  simT: 0,
  flash: 0, flashTgt: 0,
  nextFlash: 4,
  ready: false,
};

/* ================= 渲染器 / 场景 / 相机 ================= */
const container = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
const DPR = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(DPR);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(STORM, 1);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(STORM, 34, 95);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);

/* 灯光：尘灰半球光 + 冷白方向光 + 橙色闪光点光 */
const hemi = new THREE.HemisphereLight(DUST, 0x111417, 0.6);
scene.add(hemi);
const dirLight = new THREE.DirectionalLight(0xDFE4E9, 1.0);
dirLight.position.set(14, 22, 9);
scene.add(dirLight);
const flashLight = new THREE.PointLight(WARN, 0, 60, 1.6);
flashLight.position.set(0, 12, 0);
scene.add(flashLight);

/* ================= 地面 ================= */
function makeGroundTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(256, 256, 20, 256, 256, 256);
  grad.addColorStop(0, '#2B3036');
  grad.addColorStop(0.45, '#22262B');
  grad.addColorStop(1, '#1A1D21');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 512);
  // 尘土噪点
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const d = Math.hypot(x - 256, y - 256) / 256;
    if (d > 0.75) continue;
    const a = Math.random() * 0.10 * (1 - d);
    g.fillStyle = `rgba(138,145,153,${a.toFixed(3)})`;
    g.fillRect(x, y, 1.4, 1.4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(46, 64),
  new THREE.MeshLambertMaterial({ map: makeGroundTexture() })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ================= 漏斗粒子（GPU 螺旋） ================= */
const FUNNEL_N = 9000;
const funnelGeo = new THREE.BufferGeometry();
{
  const pos = new Float32Array(FUNNEL_N * 3); // 占位，顶点着色器里重算
  const aY = new Float32Array(FUNNEL_N);
  const aAng = new Float32Array(FUNNEL_N);
  const aRad = new Float32Array(FUNNEL_N);
  const aSpd = new Float32Array(FUNNEL_N);
  const aSize = new Float32Array(FUNNEL_N);
  const aAlpha = new Float32Array(FUNNEL_N);
  for (let i = 0; i < FUNNEL_N; i++) {
    // 高度偏向中下部（漏斗主体），顶部云底另有云体
    aY[i] = Math.pow(Math.random(), 0.72);
    aAng[i] = Math.random() * Math.PI * 2;
    aRad[i] = Math.random();
    aSpd[i] = Math.random();
    aSize[i] = 2.2 + Math.random() * 5.2;
    aAlpha[i] = 0.28 + Math.random() * 0.5;
  }
  funnelGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  funnelGeo.setAttribute('aY', new THREE.BufferAttribute(aY, 1));
  funnelGeo.setAttribute('aAng', new THREE.BufferAttribute(aAng, 1));
  funnelGeo.setAttribute('aRad', new THREE.BufferAttribute(aRad, 1));
  funnelGeo.setAttribute('aSpd', new THREE.BufferAttribute(aSpd, 1));
  funnelGeo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  funnelGeo.setAttribute('aAlpha', new THREE.BufferAttribute(aAlpha, 1));
}
const funnelUniforms = {
  uTime: { value: 0 },
  uSpin: { value: EF_LEVELS[3].spin },
  uRise: { value: EF_LEVELS[3].rise },
  uWidth: { value: EF_LEVELS[3].width },
  uPR: { value: DPR },
};
const funnelMat = new THREE.ShaderMaterial({
  uniforms: funnelUniforms,
  transparent: true,
  depthWrite: false,
  vertexShader: /* glsl */`
    attribute float aY; attribute float aAng; attribute float aRad;
    attribute float aSpd; attribute float aSize; attribute float aAlpha;
    uniform float uTime, uSpin, uRise, uWidth, uPR;
    varying float vAlpha; varying float vShade;
    float profile(float y){
      float r = 1.5 + 5.6 * pow(smoothstep(0.42, 1.0, y), 1.7);   // 顶部云底扩张
      r += 2.6 * pow(1.0 - smoothstep(0.0, 0.20, y), 2.2);        // 地面尘脚
      return r * uWidth;
    }
    void main(){
      float y = fract(aY + uTime * uRise * (0.35 + 0.65 * aSpd) * 0.055);
      float r = profile(y);
      float ang = aAng + uTime * uSpin * (0.45 + 0.85 * aSpd) / pow(max(r, 0.5), 0.72);
      float wob = 0.55 * sin(uTime * 1.25 + aAng * 4.0 + y * 11.0)
                + 0.30 * sin(uTime * 2.05 - aAng * 7.0 + y * 5.0);
      float rad = r * (0.66 + 0.46 * aRad) + wob * 0.5;
      vec3 p = vec3(cos(ang) * rad, y * ${FUNNEL_H.toFixed(1)}, sin(ang) * rad);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      float px = aSize * uPR * (150.0 / max(1.0, -mv.z));
      gl_PointSize = clamp(px, 1.0, 56.0);
      float edge = smoothstep(0.0, 0.09, y) * (1.0 - smoothstep(0.88, 1.0, y));
      vAlpha = aAlpha * edge;
      vShade = y;
    }`,
  fragmentShader: /* glsl */`
    varying float vAlpha; varying float vShade;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.10, d) * vAlpha;
      if (a < 0.012) discard;
      vec3 col = mix(vec3(0.60, 0.62, 0.65), vec3(0.23, 0.25, 0.28), vShade);
      gl_FragColor = vec4(col, a);
    }`,
});
const funnelGroup = new THREE.Group();
const funnel = new THREE.Points(funnelGeo, funnelMat);
funnel.frustumCulled = false;
funnelGroup.add(funnel);
scene.add(funnelGroup);

/* ================= 碎片 debris（卷起的杂物 + 余烬） ================= */
function makeDebris(count, size, color, emissive) {
  const geo = new THREE.BoxGeometry(size, size * 0.7, size * 1.3);
  const mat = emissive
    ? new THREE.MeshBasicMaterial({ color })
    : new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      y01: Math.pow(Math.random(), 1.4) * 0.62,       // 集中在下 2/3
      ang: Math.random() * Math.PI * 2,
      radJ: 0.7 + Math.random() * 0.7,
      spd: 0.6 + Math.random() * 0.9,
      s: 0.6 + Math.random() * 1.1,
      tx: Math.random() * Math.PI * 2, ty: Math.random() * Math.PI * 2,
      wx: 1 + Math.random() * 4, wy: 1 + Math.random() * 4,
    });
  }
  return { mesh, items };
}
const debrisGray = makeDebris(120, 0.22, 0x6E747B, false);
const debrisEmber = makeDebris(26, 0.13, WARN, true);
funnelGroup.add(debrisGray.mesh, debrisEmber.mesh);
const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
function debrisRadius(y) {
  let r = 1.5 + 5.6 * Math.pow(THREE.MathUtils.smoothstep(y, 0.42, 1.0), 1.7);
  r += 2.6 * Math.pow(1 - THREE.MathUtils.smoothstep(y, 0.0, 0.20), 2.2);
  return r * state.cur.width;
}
function updateDebris(sys, t, dt) {
  const n = Math.floor(sys.items.length * (0.15 + 0.85 * state.cur.debris));
  sys.mesh.count = n;
  for (let i = 0; i < n; i++) {
    const d = sys.items[i];
    const ang = d.ang + t * state.cur.spin * d.spd * 0.9 / Math.pow(Math.max(debrisRadius(d.y01), 0.8), 0.7);
    const rad = debrisRadius(d.y01) * d.radJ;
    const y = d.y01 * FUNNEL_H + Math.sin(t * 2.2 + d.ang * 3) * 0.5;
    _v.set(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
    _e.set(d.tx + t * d.wx, d.ty + t * d.wy, 0);
    _q.setFromEuler(_e);
    _s.setScalar(d.s);
    _m4.compose(_v, _q, _s);
    sys.mesh.setMatrixAt(i, _m4);
  }
  sys.mesh.instanceMatrix.needsUpdate = true;
}

/* ================= 地面尘环（扩散） ================= */
const rings = [];
for (let i = 0; i < 5; i++) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(0.93, 1.0, 72),
    new THREE.MeshBasicMaterial({ color: DUST, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.12 + i * 0.03;
  scene.add(m);
  rings.push({ mesh: m, off: i / 5 });
}
function updateRings(t) {
  for (const r of rings) {
    const cyc = (t * 0.22 * (0.5 + state.cur.ring) + r.off) % 1;
    const s = 2 + cyc * 15 * (0.6 + 0.4 * state.cur.width);
    r.mesh.scale.setScalar(s);
    r.mesh.material.opacity = (1 - cyc) * 0.30 * state.cur.ring;
  }
}

/* ================= 云底（噪声云墙） ================= */
const cloudUniforms = {
  uTime: { value: 0 },
  uFlash: { value: 0 },
};
const cloudMat = new THREE.ShaderMaterial({
  uniforms: cloudUniforms,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    varying vec2 vUv;
    uniform float uTime, uFlash;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
                 mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }
      return v;
    }
    void main(){
      vec2 p = vec2(vUv.x * 9.0 + uTime * 0.05, vUv.y * 2.2 - uTime * 0.015);
      float n = fbm(p + fbm(p * 1.7 + uTime * 0.02) * 0.9);
      float body = smoothstep(0.28, 0.75, n);
      float topFade = smoothstep(1.0, 0.55, vUv.y);
      float a = body * topFade * 0.92;
      if (a < 0.01) discard;
      vec3 base = mix(vec3(0.10, 0.11, 0.13), vec3(0.32, 0.34, 0.37), n);
      vec3 col = mix(base, vec3(1.0, 0.48, 0.10), uFlash * 0.55 * body);
      gl_FragColor = vec4(col, a);
    }`,
});
const cloud = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 5.2, 3.6, 48, 1, true), cloudMat);
cloud.position.y = FUNNEL_H + 1.4;
scene.add(cloud);

/* ================= 背景尘埃 ================= */
const moteGeo = new THREE.BufferGeometry();
{
  const n = 260, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    p[i * 3] = (Math.random() - 0.5) * 90;
    p[i * 3 + 1] = Math.random() * 26;
    p[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
}
const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
  color: DUST, size: 0.09, transparent: true, opacity: 0.22, depthWrite: false,
}));
scene.add(motes);

/* ================= 自定义环绕视角（拖拽/滚轮/触屏） ================= */
const orbit = {
  tx: 0, ty: 7.2, tz: 0,                 // 目标点
  theta: 0.65, phi: 1.10, radius: 46,   // 当前
  thetaT: 0.65, phiT: 1.10, radiusT: 27,// 目标（含开场推进）
  dragging: false, px: 0, py: 0,
};
const el = renderer.domElement;
const pointers = new Map();
let pinchD = 0;
el.style.touchAction = 'none';
el.addEventListener('pointerdown', (e) => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  el.setPointerCapture(e.pointerId);
  orbit.dragging = true;
  orbit.px = e.clientX; orbit.py = e.clientY;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchD = Math.hypot(a.x - b.x, a.y - b.y);
  }
});
el.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchD > 0) orbit.radiusT = THREE.MathUtils.clamp(orbit.radiusT * (pinchD / d), 13, 52);
    pinchD = d;
    return;
  }
  if (!orbit.dragging) return;
  const dx = e.clientX - orbit.px, dy = e.clientY - orbit.py;
  orbit.px = e.clientX; orbit.py = e.clientY;
  orbit.thetaT -= dx * 0.0052;
  orbit.phiT = THREE.MathUtils.clamp(orbit.phiT - dy * 0.0042, 0.52, 1.46);
});
function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size === 0) orbit.dragging = false;
  pinchD = 0;
}
el.addEventListener('pointerup', endPointer);
el.addEventListener('pointercancel', endPointer);
el.addEventListener('wheel', (e) => {
  e.preventDefault();
  orbit.radiusT = THREE.MathUtils.clamp(orbit.radiusT * (1 + e.deltaY * 0.0011), 13, 52);
}, { passive: false });

/* ================= UI 接线 ================= */
const efRange = document.getElementById('efRange');
const efOut = document.getElementById('efOut');
const efVal = document.getElementById('efVal');
const efWind = document.getElementById('efWind');
const efDmg = document.getElementById('efDmg');
const tickSpans = document.querySelectorAll('#ticks span');
function paintTicks() {
  tickSpans.forEach((s, i) => s.classList.toggle('on', i === state.ef));
}
efRange.addEventListener('input', () => {
  state.ef = +efRange.value;
  state.tgt = { ...EF_LEVELS[state.ef] };
  const L = EF_LEVELS[state.ef];
  efOut.textContent = L.label;
  efVal.textContent = L.label;
  efWind.textContent = L.wind;
  efDmg.textContent = L.dmg;
  efVal.classList.remove('bump');
  void efVal.offsetWidth; // 重启动画
  efVal.classList.add('bump');
  paintTicks();
});
paintTicks();

const slowmo = document.getElementById('slowmo');
slowmo.addEventListener('change', () => {
  state.timeScaleTgt = slowmo.checked ? 0.12 : 1;
});

document.getElementById('resetView').addEventListener('click', () => {
  orbit.thetaT = 0.65; orbit.phiT = 1.10; orbit.radiusT = 27;
});

/* ================= 主循环 ================= */
const clock = new THREE.Clock();
const flashEl = document.getElementById('flash');
let loaderHidden = false;

function animate() {
  requestAnimationFrame(animate);
  const rawDt = Math.min(clock.getDelta(), 0.05);

  // 参数向目标做物理感插值
  const k = 1 - Math.exp(-rawDt * 3.2);
  for (const key of ['density', 'spin', 'rise', 'width', 'debris', 'ring', 'flash']) {
    state.cur[key] += (state.tgt[key] - state.cur[key]) * k;
  }
  state.timeScale += (state.timeScaleTgt - state.timeScale) * (1 - Math.exp(-rawDt * 5));
  const dt = rawDt * state.timeScale;
  state.simT += dt;
  const t = state.simT;

  // 漏斗 uniforms
  funnelUniforms.uTime.value = t;
  funnelUniforms.uSpin.value = state.cur.spin;
  funnelUniforms.uRise.value = state.cur.rise;
  funnelUniforms.uWidth.value = state.cur.width;
  funnelGeo.setDrawRange(0, Math.floor(FUNNEL_N * state.cur.density));

  // 漏斗摆动（整组）
  const swayAmp = 0.5 + state.cur.width * 1.1;
  funnelGroup.position.x = Math.sin(t * 0.42) * swayAmp;
  funnelGroup.position.z = Math.cos(t * 0.31) * swayAmp * 0.7;
  funnelGroup.rotation.z = Math.sin(t * 0.36) * 0.045;
  funnelGroup.rotation.x = Math.cos(t * 0.29) * 0.03;

  updateDebris(debrisGray, t, dt);
  updateDebris(debrisEmber, t * 1.25, dt);
  updateRings(t);

  // 云底
  cloudUniforms.uTime.value = t;
  cloud.rotation.y = t * 0.03;

  // 闪电：随机双脉冲（橙色尘光）
  state.nextFlash -= dt;
  if (state.nextFlash <= 0) {
    state.flashTgt = 1;
    state.nextFlash = (3.5 + Math.random() * 5.5) / Math.max(0.4, state.cur.flash);
    setTimeout(() => { state.flashTgt = 0; }, 130 + Math.random() * 90);
  }
  state.flash += (state.flashTgt - state.flash) * (1 - Math.exp(-rawDt * 14));
  cloudUniforms.uFlash.value = state.flash;
  flashLight.intensity = state.flash * 260 * state.cur.flash;
  flashEl.style.opacity = (state.flash * 0.10).toFixed(3);

  // 背景尘埃缓转
  motes.rotation.y = t * 0.008;

  // 相机阻尼
  const ck = 1 - Math.exp(-rawDt * 4.5);
  orbit.theta += (orbit.thetaT - orbit.theta) * ck;
  orbit.phi += (orbit.phiT - orbit.phi) * ck;
  orbit.radius += (orbit.radiusT - orbit.radius) * ck;
  camera.position.set(
    orbit.tx + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
    orbit.ty + orbit.radius * Math.cos(orbit.phi),
    orbit.tz + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta)
  );
  camera.lookAt(orbit.tx, orbit.ty, orbit.tz);

  renderer.render(scene, camera);

  // 首帧 → 完成态
  if (!loaderHidden) {
    loaderHidden = true;
    document.documentElement.classList.add('js');
    const loader = document.getElementById('loader');
    setTimeout(() => loader.setAttribute('hidden', ''), 900);
  }
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  funnelUniforms.uPR.value = Math.min(window.devicePixelRatio || 1, 2);
});
