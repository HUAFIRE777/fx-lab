/* lightning-3d · 闪电风暴 — original implementation, huafire3d fx-lab
 * 夜空风暴云(FBM) + 中点位移程序化闪电 + 斜落雨粒子 + 点击放电交互
 */
import * as THREE from 'three';

/* ================= 基础 ================= */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x060913, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x060913, 60, 170);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(0, 8.5, 44);
camera.lookAt(0, 12, 0);

const clock = new THREE.Clock();

/* ================= 夜空穹顶 ================= */
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `
    varying vec3 vP;
    void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    varying vec3 vP;
    void main(){
      float h = normalize(vP).y;
      vec3 top = vec3(0.012, 0.020, 0.045);
      vec3 mid = vec3(0.035, 0.062, 0.115);
      vec3 hor = vec3(0.058, 0.098, 0.168);
      vec3 c = mix(mid, top, smoothstep(0.05, 0.9, h));
      c = mix(hor, c, smoothstep(-0.05, 0.28, h));
      c += vec3(0.05, 0.10, 0.16) * pow(max(0.0, 1.0 - abs(h) * 4.0), 2.0) * 0.55;
      gl_FragColor = vec4(c, 1.0);
    }`
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(240, 32, 24), skyMat));

/* 稀疏星点：被云层半遮，若隐若现 */
{
  const n = 380, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, e = 0.15 + Math.random() * 1.2, r = 215;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
    pos[i * 3 + 1] = Math.sin(e) * r;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    color: 0x9fc0e8, size: 1.1, sizeAttenuation: false,
    transparent: true, opacity: 0.5, fog: false, depthWrite: false
  })));
}

/* ================= 风暴云：FBM shader 大平面 ================= */
const CLOUD_FRAG = `
  varying vec2 vUv;
  uniform float uTime, uSeed, uFlash;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + vec2(11.3, 7.7); a *= 0.5; }
    return v;
  }
  void main(){
    vec2 p = vUv * vec2(3.4, 1.5);
    float t = uTime * 0.035;
    float d  = fbm(p + vec2(t * 1.7 + uSeed, uSeed * 0.63 - t * 0.55));
    float d2 = fbm(p * 2.1 + vec2(-t * 2.3, uSeed * 1.31) + d);
    float cover = smoothstep(0.26, 0.74, d * 0.62 + d2 * 0.48);
    vec3 dark = vec3(0.016, 0.027, 0.058);
    vec3 lite = vec3(0.150, 0.265, 0.450);
    vec3 col = mix(dark, lite, smoothstep(0.30, 0.95, d2) * 0.55);
    col += vec3(0.42, 0.62, 1.00) * uFlash * 0.55 * smoothstep(0.30, 0.85, d);
    col += vec3(0.55, 0.42, 1.00) * uFlash * 0.16 * smoothstep(0.45, 0.9, d2);
    float edge = smoothstep(0.0, 0.20, vUv.x) * smoothstep(1.0, 0.80, vUv.x)
               * smoothstep(0.0, 0.30, vUv.y) * smoothstep(1.0, 0.70, vUv.y);
    gl_FragColor = vec4(col, cover * edge * 0.97);
  }`;
const CLOUD_VERT = `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const cloudMats = [];
function addCloud(w, h, x, y, z, seed, tilt) {
  const m = new THREE.ShaderMaterial({
    vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG,
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed }, uFlash: { value: 0 } }
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.position.set(x, y, z);
  mesh.rotation.x = tilt;
  scene.add(mesh);
  cloudMats.push(m);
  return mesh;
}
addCloud(170, 62, 0, 28, -34, 3.7, -0.10);   // 主云层
addCloud(220, 80, -20, 36, -70, 11.2, -0.16); // 远景云层

/* ================= 地平线山脊剪影 ================= */
function ridgeGeo(w, h, seed) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -2);
  let rnd = seed;
  const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  let x = -w / 2;
  s.lineTo(x, h * (0.25 + rand() * 0.5));
  while (x < w / 2) {
    x += 5 + rand() * 10;
    s.lineTo(Math.min(x, w / 2), h * (0.2 + rand() * 0.9));
  }
  s.lineTo(w / 2, -2);
  s.lineTo(-w / 2, -2);
  return new THREE.ShapeGeometry(s);
}
const ridgeMat = new THREE.MeshBasicMaterial({ color: 0x04060c });
const ridge1 = new THREE.Mesh(ridgeGeo(200, 7, 12345), ridgeMat);
ridge1.position.set(0, 0, -52); scene.add(ridge1);
const ridge2 = new THREE.Mesh(ridgeGeo(260, 11, 987), ridgeMat);
ridge2.position.set(-30, 0, -80); scene.add(ridge2);

/* ================= 地面 + 灯光 ================= */
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(160, 48),
  new THREE.MeshStandardMaterial({ color: 0x070d18, roughness: 1.0, metalness: 0.0 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

scene.add(new THREE.HemisphereLight(0x2a4a7a, 0x05070d, 0.45));
const dirLight = new THREE.DirectionalLight(0xbfe3ff, 0.35);
dirLight.position.set(12, 34, 24);
scene.add(dirLight);

/* ================= 精灵贴图（canvas 程序化） ================= */
function radialSprite(size, stops) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
const glowTex = radialSprite(64, [
  [0, 'rgba(235,246,255,1)'], [0.25, 'rgba(191,227,255,0.75)'],
  [0.6, 'rgba(142,123,255,0.22)'], [1, 'rgba(142,123,255,0)']
]);
const rainTex = (() => {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 32;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 32);
  gr.addColorStop(0, 'rgba(191,227,255,0)');
  gr.addColorStop(0.5, 'rgba(191,227,255,0.8)');
  gr.addColorStop(1, 'rgba(191,227,255,0)');
  g.fillStyle = gr; g.fillRect(2, 0, 4, 32);
  return new THREE.CanvasTexture(c);
})();

/* ================= 雨：斜落粒子 ================= */
const RAIN_MAX = 4500;
const rainPos = new Float32Array(RAIN_MAX * 3);
const rainSpd = new Float32Array(RAIN_MAX);
function resetDrop(i, top) {
  rainPos[i * 3] = -48 + Math.random() * 96;
  rainPos[i * 3 + 1] = top ? 26 + Math.random() * 6 : Math.random() * 30;
  rainPos[i * 3 + 2] = -28 + Math.random() * 46;
  rainSpd[i] = 17 + Math.random() * 10;
}
for (let i = 0; i < RAIN_MAX; i++) resetDrop(i, false);
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.PointsMaterial({
  size: 0.55, map: rainTex, transparent: true, opacity: 0.5,
  color: 0x9fc6e8, depthWrite: false, blending: THREE.AdditiveBlending
});
const rain = new THREE.Points(rainGeo, rainMat);
rain.frustumCulled = false;
scene.add(rain);
let rainActive = 2500;
rainGeo.setDrawRange(0, rainActive);
const WIND_X = -4.2;

function updateRain(dt) {
  for (let i = 0; i < rainActive; i++) {
    rainPos[i * 3 + 1] -= rainSpd[i] * dt;
    rainPos[i * 3] += WIND_X * dt;
    if (rainPos[i * 3 + 1] < 0.2 || rainPos[i * 3] < -50) resetDrop(i, true);
  }
  rainGeo.attributes.position.needsUpdate = true;
}

/* ================= 闪电：中点位移递归分叉 ================= */
function midpointBolt(x0, y0, x1, y1, rough) {
  let pts = [[x0, y0], [x1, y1]];
  let disp = rough;
  for (let it = 0; it < 7; it++) {
    const out = [pts[0]];
    for (let j = 1; j < pts.length; j++) {
      const a = pts[j - 1], b = pts[j];
      out.push([
        (a[0] + b[0]) / 2 + (Math.random() - 0.5) * 2 * disp,
        (a[1] + b[1]) / 2 + (Math.random() - 0.5) * 2 * disp * 0.35
      ], b);
    }
    pts = out;
    disp *= 0.52;
  }
  return pts;
}

const bolts = [];
const flashDiv = document.getElementById('flash');
let flashI = 0;

function lineFrom(pts, color, opacity) {
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const m = new THREE.LineBasicMaterial({
    color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  });
  return new THREE.Line(g, m);
}

function strike(x, z) {
  const group = new THREE.Group();
  const mats = [];
  const yTop = 24 + Math.random() * 3;
  const xTop = x + (Math.random() - 0.5) * 7;
  const zBase = z + (Math.random() - 0.5) * 5;

  // 主干：云底 → 地面
  const main2 = midpointBolt(xTop, yTop, x + (Math.random() - 0.5) * 2, 0.25, 5.5);
  const main3 = main2.map(p => new THREE.Vector3(p[0], p[1], zBase + (Math.random() - 0.5) * 2.5));
  const passes = [
    [0x7fb2ff, 0.16],  // 外层辉光
    [0xbfe3ff, 0.45],  // 中层
    [0xf2faff, 1.0]    // 核心白
  ];
  for (const [color, op] of passes) {
    const l = lineFrom(main3, color, op);
    mats.push({ mat: l.material, base: op });
    group.add(l);
  }

  // 分叉：主干上随机取 2-4 个点，向外斜劈
  const nBr = 2 + Math.floor(Math.random() * 3);
  for (let b = 0; b < nBr; b++) {
    const idx = Math.floor(main3.length * (0.2 + Math.random() * 0.6));
    const p = main3[idx];
    const ang = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.7);
    const len = 4 + Math.random() * 6;
    const bx = p.x + Math.sin(ang) * len;
    const by = Math.max(1.2, p.y - Math.cos(ang) * len * 0.8);
    const b2 = midpointBolt(p.x, p.y, bx, by, 2.2);
    const b3 = b2.map(q => new THREE.Vector3(q[0], q[1], p.z + (Math.random() - 0.5) * 2));
    for (const [color, op] of [[0x8fc0ff, 0.35], [0xe8f4ff, 0.8]]) {
      const l = lineFrom(b3, color, op);
      mats.push({ mat: l.material, base: op });
      group.add(l);
    }
  }

  // 辉光节点：主干上撒发光精灵
  const sprites = [];
  for (let s = 0; s < 8; s++) {
    const p = main3[Math.floor(main3.length * (s + 0.5) / 8)];
    const sm = new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    });
    const sp = new THREE.Sprite(sm);
    sp.position.copy(p);
    const sc = 3 + Math.random() * 5;
    sp.scale.set(sc, sc, 1);
    sprites.push({ mat: sm, base: 0.85 });
    group.add(sp);
  }
  // 落点冲击辉光
  const hitM = new THREE.SpriteMaterial({
    map: glowTex, transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  });
  const hit = new THREE.Sprite(hitM);
  hit.position.set(x, 1.1, zBase);
  hit.scale.set(16, 9, 1);
  sprites.push({ mat: hitM, base: 1 });
  group.add(hit);

  scene.add(group);
  const dur = 0.75 + Math.random() * 0.75;
  bolts.push({ group, mats, sprites, t0: clock.elapsedTime, dur });

  // 闪光：灯光 + 云层 + 屏幕
  flashI = Math.min(1.5, flashI + 1.0);
  strikeCount++;
  document.getElementById('strikeCount').textContent = strikeCount;
}

// 双重回击式闪烁包络
function boltEnv(age, dur) {
  const keys = [[0, 1], [0.05, 0.22], [0.11, 1], [0.19, 0.45], [0.28, 0.85], [0.45, 0.4], [1, 0]];
  const t = Math.min(age / dur, 1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      const k = (t - t0) / Math.max(t1 - t0, 1e-5);
      return v0 + (v1 - v0) * k;
    }
  }
  return 0;
}

function updateBolts() {
  const now = clock.elapsedTime;
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i];
    const age = now - b.t0;
    if (age >= b.dur) {
      scene.remove(b.group);
      b.group.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      bolts.splice(i, 1);
      continue;
    }
    const e = boltEnv(age, b.dur);
    for (const m of b.mats) m.mat.opacity = m.base * e;
    for (const s of b.sprites) s.mat.opacity = s.base * e;
  }
}

/* ================= 状态 / 交互 ================= */
let strikeCount = 0;
let level = 5;
let auto = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let nextAuto = 1.2;

const levelInput = document.getElementById('level');
const levelVal = document.getElementById('levelVal');
const autoBtn = document.getElementById('autoBtn');
const strikeBtn = document.getElementById('strikeBtn');
const hint = document.getElementById('hint');
const rainCountEl = document.getElementById('rainCount');

function applyLevel() {
  rainActive = Math.floor(THREE.MathUtils.lerp(500, RAIN_MAX, level / 10));
  rainGeo.setDrawRange(0, rainActive);
  rainMat.opacity = 0.32 + (level / 10) * 0.3;
  levelVal.textContent = level + ' 级';
  rainCountEl.textContent = rainActive;
}
levelInput.addEventListener('input', () => { level = +levelInput.value; applyLevel(); });
applyLevel();

function syncAutoBtn() {
  autoBtn.classList.toggle('on', auto);
  autoBtn.setAttribute('aria-pressed', String(auto));
}
autoBtn.addEventListener('click', () => { auto = !auto; syncAutoBtn(); });
syncAutoBtn();

strikeBtn.addEventListener('click', () => {
  strike(-30 + Math.random() * 60, -10 + Math.random() * 18);
  hideHint();
});

function hideHint() { hint.classList.add('gone'); }

// 点击夜空 → 在点击 x 附近落雷
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
canvas.addEventListener('click', (e) => {
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const p = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(groundPlane, p)) {
    strike(
      THREE.MathUtils.clamp(p.x, -34, 34),
      THREE.MathUtils.clamp(p.z, -14, 12)
    );
    hideHint();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ================= 主循环 ================= */
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  for (const m of cloudMats) {
    m.uniforms.uTime.value = t;
    m.uniforms.uFlash.value = Math.min(flashI, 1);
  }
  updateRain(dt);
  updateBolts();

  // 闪光衰减
  flashI *= Math.pow(0.015, dt);
  if (flashI < 0.003) flashI = 0;
  dirLight.intensity = 0.35 + flashI * 2.8;
  flashDiv.style.opacity = Math.min(0.6, flashI * 0.42).toFixed(3);

  // 自动风暴
  if (auto && t > nextAuto) {
    strike(-30 + Math.random() * 60, -10 + Math.random() * 18);
    const base = THREE.MathUtils.lerp(7.5, 0.8, level / 10);
    nextAuto = t + base * (0.5 + Math.random());
  }

  // 相机微漂
  camera.position.x = Math.sin(t * 0.07) * 1.6;
  camera.lookAt(0, 12, 0);

  renderer.render(scene, camera);
}
tick();

/* ================= loader：3.8s 超时兜底强制完成 ================= */
let booted = false;
function complete() {
  if (booted) return;
  booted = true;
  const loader = document.getElementById('loader');
  loader.classList.add('done');
  const els = [...document.querySelectorAll('[data-intro]')];
  els.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 400 + i * 150));
  setTimeout(() => loader.remove(), 1400);
}
window.addEventListener('load', () => setTimeout(complete, 700));
setTimeout(complete, 3800);
