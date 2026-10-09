/* ferris-wheel-3d · src/main.js
 * 摩天轮夜景：旋转轮体 + pivot 座舱水平补偿 + 灯珠/光晕 + 嘉年华灯串
 * 全原创实现；Three.js (MIT) 本地 vendor。
 */
import * as THREE from '../vendor/three.module.js';

/* ================= 配置 ================= */
const CFG = {
  wheelR: 4.2,          // 轮半径
  wheelY: 4.7,          // 轮心高度
  gondolas: 8,          // 座舱数
  rimBulbs: 48,         // 轮圈灯珠数
  baseSpeed: 0.14,      // 基础角速度 rad/s（慢速浪漫）
  starCount: 650,       // 星星数
  meterPerUnit: 7.2,    // 世界单位 → 米（轮直径约 60 米）
};
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = matchMedia('(pointer: coarse)').matches;

const PAL = {
  bg: 0x0a1030, pink: 0xff5c8a, gold: 0xffd166,
  navy: 0x16205c, dark: 0x070b24, silh: 0x0c1340,
};
const C_PINK = new THREE.Color(PAL.pink);
const C_GOLD = new THREE.Color(PAL.gold);

/* ================= 渲染器 / 场景 / 相机 ================= */
const canvas = document.getElementById('v');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  document.getElementById('noWebgl').style.display = 'flex';
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(PAL.bg);
scene.fog = new THREE.Fog(PAL.bg, 20, 46);

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 120);
const CAM_HOME = new THREE.Vector3(0, 4.5, 14.6);
const LOOK_HOME = new THREE.Vector3(0, 4.2, 0);
const lookTarget = LOOK_HOME.clone();
const _lookShift = new THREE.Vector3();
camera.position.copy(CAM_HOME);
camera.lookAt(lookTarget);
// 窄屏拉远机位，保证轮体横向完整入画
function fitCamera() {
  camera.aspect = innerWidth / innerHeight;
  const need = camera.aspect < 0.85 ? 26 : camera.aspect < 1.2 ? 15.8 : 14.6;
  CAM_HOME.z = need;
  if (focusIdx < 0) camera.position.z = need;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

/* ================= 灯光 ================= */
scene.add(new THREE.HemisphereLight(0x8fa3e8, PAL.bg, 0.5));
const moonLight = new THREE.DirectionalLight(0xdfe8ff, 0.7);
moonLight.position.set(9, 13, 6);
scene.add(moonLight);
const groundGlow = new THREE.PointLight(PAL.gold, 26, 26, 2); // 地面灯串的暖光
groundGlow.position.set(0, 2.2, 3.5);
scene.add(groundGlow);

/* ================= 工具 ================= */
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.28, 'rgba(255,255,255,.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const GLOW = glowTexture();
const metalMat = new THREE.MeshStandardMaterial({ color: PAL.navy, roughness: 0.42, metalness: 0.65 });

/* ================= 星空 + 月亮 ================= */
const starLayers = [];
function makeStars(count, size, phase) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const tint = [new THREE.Color(0xffffff), C_GOLD.clone(), C_PINK.clone()];
  for (let i = 0; i < count; i++) {
    const r = 30 + Math.random() * 16;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.random() * Math.PI * 0.48; // 天顶半球
    pos[i * 3] = r * Math.cos(th) * Math.cos(ph);
    pos[i * 3 + 1] = 2 + r * Math.sin(ph);
    pos[i * 3 + 2] = -8 - r * Math.sin(th) * Math.cos(ph) * 0.7;
    const c = tint[(Math.random() * 3) | 0];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const matp = new THREE.PointsMaterial({
    size, map: GLOW, vertexColors: true, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, matp);
  pts.userData.phase = phase;
  scene.add(pts);
  starLayers.push(pts);
}
makeStars(CFG.starCount, 0.22, 0);
makeStars(Math.floor(CFG.starCount / 2.4), 0.15, 2.1);

// 月亮：暖白光晕 + 亮核
const moon = new THREE.Sprite(new THREE.SpriteMaterial({
  map: GLOW, color: 0xfff0cd, transparent: true, opacity: 0.85,
  blending: THREE.AdditiveBlending, depthWrite: false,
}));
moon.position.set(11.5, 12.5, -20); moon.scale.setScalar(7);
scene.add(moon);
const moonCore = new THREE.Sprite(new THREE.SpriteMaterial({
  map: GLOW, color: 0xfff8e6, transparent: true, opacity: 0.95,
  blending: THREE.AdditiveBlending, depthWrite: false,
}));
moonCore.position.copy(moon.position); moonCore.scale.setScalar(2.4);
scene.add(moonCore);

/* ================= 远景城市剪影 ================= */
(function skyline() {
  const grp = new THREE.Group();
  const bmat = new THREE.MeshBasicMaterial({ color: 0x0a0f38 });
  const winPos = [], winCol = [];
  let x = -17;
  while (x < 17) {
    const w = 1.6 + Math.random() * 1.8, h = 2.2 + Math.random() * 4.4;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.4), bmat);
    b.position.set(x + w / 2, h / 2, -13 - Math.random() * 3);
    grp.add(b);
    // 零星亮窗（暖金/霓虹粉）
    for (let wy = 0.7; wy < h - 0.4; wy += 0.55) {
      for (let wx = -w / 2 + 0.35; wx < w / 2 - 0.2; wx += 0.55) {
        if (Math.random() < 0.34) {
          winPos.push(b.position.x + wx, wy, b.position.z + 0.72);
          const c = Math.random() < 0.7 ? C_GOLD : C_PINK;
          winCol.push(c.r, c.g, c.b);
        }
      }
    }
    x += w + 0.4 + Math.random() * 1.2;
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(winPos), 3));
  wg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(winCol), 3));
  grp.add(new THREE.Points(wg, new THREE.PointsMaterial({
    size: 0.13, map: GLOW, vertexColors: true, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));
  scene.add(grp);
})();

/* ================= 摩天轮 ================= */
const wheel = new THREE.Group();
wheel.position.set(0, CFG.wheelY, 0);
scene.add(wheel);

// 轮圈：前后双圈
for (const z of [0.2, -0.2]) {
  const rim = new THREE.Mesh(new THREE.TorusGeometry(CFG.wheelR, 0.06, 12, 140), metalMat);
  rim.position.z = z;
  wheel.add(rim);
}
// 辐条：12 根
for (let i = 0; i < 12; i++) {
  const holder = new THREE.Group();
  holder.rotation.z = (i / 12) * Math.PI * 2;
  const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, CFG.wheelR, 8), metalMat);
  spoke.position.y = CFG.wheelR / 2;
  holder.add(spoke);
  wheel.add(holder);
}
// 轮毂 + 霓虹粉核心
const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.9, 20), metalMat);
hub.rotation.x = Math.PI / 2;
wheel.add(hub);
const hubCore = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 16, 12),
  new THREE.MeshBasicMaterial({ color: PAL.pink })
);
hubCore.position.z = 0.48;
wheel.add(hubCore);
const hubGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: GLOW, color: PAL.pink, transparent: true, opacity: 0.75,
  blending: THREE.AdditiveBlending, depthWrite: false,
}));
hubGlow.position.z = 0.48; hubGlow.scale.setScalar(1.6);
wheel.add(hubGlow);

// 轮圈灯珠：instanced 小球（硬核灯珠）+ Points 光晕层
const bulbGeo = new THREE.SphereGeometry(0.085, 10, 8);
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const rimBulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, CFG.rimBulbs);
const rimBulbPos = [];
{
  const m = new THREE.Matrix4();
  for (let i = 0; i < CFG.rimBulbs; i++) {
    const a = (i / CFG.rimBulbs) * Math.PI * 2;
    const x = Math.cos(a) * CFG.wheelR, y = Math.sin(a) * CFG.wheelR;
    const z = i % 2 === 0 ? 0.2 : -0.2;
    m.setPosition(x, y, z);
    rimBulbs.setMatrixAt(i, m);
    rimBulbs.setColorAt(i, C_GOLD);
    rimBulbPos.push(x, y, z);
  }
  rimBulbs.instanceColor.needsUpdate = true;
}
wheel.add(rimBulbs);

const haloGeo = new THREE.BufferGeometry();
haloGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rimBulbPos), 3));
const haloCol = new Float32Array(CFG.rimBulbs * 3);
for (let i = 0; i < CFG.rimBulbs; i++) { haloCol[i * 3] = C_GOLD.r; haloCol[i * 3 + 1] = C_GOLD.g; haloCol[i * 3 + 2] = C_GOLD.b; }
haloGeo.setAttribute('color', new THREE.BufferAttribute(haloCol, 3));
const haloMat = new THREE.PointsMaterial({
  size: 0.62, map: GLOW, vertexColors: true, transparent: true, opacity: 0.85,
  blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
});
wheel.add(new THREE.Points(haloGeo, haloMat));

/* ---- 座舱：anchor(随轮公转) → pivot(反向补偿保水平) → cabin ---- */
const pivots = [];        // 每帧 pivot.rotation.z = -wheel.rotation.z
const cabinBodies = [];   // 可点击
const winMats = [];       // 座舱窗光材质（随灯光模式变色）
const cabinGlows = [];
const cabBodyMat = new THREE.MeshStandardMaterial({ color: 0x182058, roughness: 0.5, metalness: 0.35 });

for (let i = 0; i < CFG.gondolas; i++) {
  const a = (i / CFG.gondolas) * Math.PI * 2;
  const anchor = new THREE.Group();
  anchor.position.set(Math.cos(a) * CFG.wheelR, Math.sin(a) * CFG.wheelR, 0);
  wheel.add(anchor);

  const pivot = new THREE.Group();   // 补偿层：只转 z，保持座舱水平
  anchor.add(pivot);
  pivots.push(pivot);

  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 8), metalMat);
  arm.position.y = -0.31;
  pivot.add(arm);

  const cab = new THREE.Group();
  cab.position.y = -1.0;
  pivot.add(cab);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 0.5, 6, 16), cabBodyMat);
  body.userData.g = i;
  cab.add(body);
  cabinBodies.push(body);

  // 发光舷窗带
  const winMat = new THREE.MeshBasicMaterial({ color: PAL.gold });
  const win = new THREE.Mesh(new THREE.CylinderGeometry(0.475, 0.475, 0.3, 18, 1, true), winMat);
  win.position.y = 0.1;
  cab.add(win);
  winMats.push(winMat);

  // 舱顶小灯
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), winMat);
  cap.position.y = 0.62;
  cab.add(cap);

  // 座舱暖光晕
  const cg = new THREE.Sprite(new THREE.SpriteMaterial({
    map: GLOW, color: PAL.gold, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  cg.position.y = 0.1; cg.scale.setScalar(1.9);
  cab.add(cg);
  cabinGlows.push(cg);
}

// A 形支架（轮后）
function beam(x1, y1, z1, x2, y2, z2, r) {
  const d = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1);
  const len = d.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), metalMat);
  mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  scene.add(mesh);
}
beam(-2.0, 0, -1.1, 0, CFG.wheelY, -0.35, 0.14);
beam(2.0, 0, -1.1, 0, CFG.wheelY, -0.35, 0.14);
beam(-2.0, 0, -1.1, 2.0, 0, -1.1, 0.1);   // 底横梁
const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 12), metalMat);
axle.rotation.x = Math.PI / 2;
axle.position.set(0, CFG.wheelY, -0.2);
scene.add(axle);

/* ================= 地面 / 帐篷 / 灯串 ================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(70, 34),
  new THREE.MeshStandardMaterial({ color: PAL.dark, roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

const stringBulbGeos = [];  // 灯串 Points 的 geometry（随灯光模式变色）

// 嘉年华帐篷剪影：锥顶 + 檐口灯串
function tent(x, z, s) {
  const grp = new THREE.Group();
  const silh = new THREE.MeshStandardMaterial({ color: PAL.silh, roughness: 1 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.11 * s, 1.7 * s, 8), silh);
  pole.position.y = 0.85 * s;
  grp.add(pole);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.55 * s, 1.5 * s, 12), silh);
  roof.position.y = 1.7 * s + 0.75 * s;
  grp.add(roof);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 8, 6),
    new THREE.MeshBasicMaterial({ color: PAL.pink }));
  tip.position.y = 1.7 * s + 1.5 * s;
  grp.add(tip);
  // 檐口一圈灯珠
  const n = 14, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * 1.55 * s;
    pos[i * 3 + 1] = 1.7 * s + 0.02;
    pos[i * 3 + 2] = Math.sin(a) * 1.55 * s;
    col[i * 3] = C_GOLD.r; col[i * 3 + 1] = C_GOLD.g; col[i * 3 + 2] = C_GOLD.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  grp.add(new THREE.Points(g, new THREE.PointsMaterial({
    size: 0.22, map: GLOW, vertexColors: true, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));
  stringBulbGeos.push(g);
  grp.position.set(x, 0, z);
  scene.add(grp);
}
tent(-7.2, -2.6, 1.15);
tent(-3.1, -3.4, 0.85);
tent(6.9, -2.8, 1.05);
tent(3.4, -3.8, 0.7);

// 前景灯串：两杆之间悬链线
function stringLights(x1, x2, z, h, sag) {
  const grp = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: PAL.silh, roughness: 1 });
  for (const x of [x1, x2]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, h, 8), poleMat);
    p.position.set(x, h / 2, z);
    grp.add(p);
  }
  const n = 30, pos = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x1 + (x2 - x1) * t;
    const y = h - sag * 4 * t * (1 - t);   // 抛物线下垂
    pos.push(x, y, z);
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  grp.add(new THREE.Line(wg, new THREE.LineBasicMaterial({ color: 0x2a3577, transparent: true, opacity: 0.7 })));
  const bg = new THREE.BufferGeometry();
  const bp = [], bc = [];
  for (let i = 0; i < pos.length; i += 3) { bp.push(pos[i], pos[i + 1] - 0.09, pos[i + 2]); }
  for (let i = 0; i < bp.length / 3; i++) { bc.push(C_GOLD.r, C_GOLD.g, C_GOLD.b); }
  bg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bp), 3));
  bg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(bc), 3));
  grp.add(new THREE.Points(bg, new THREE.PointsMaterial({
    size: 0.3, map: GLOW, vertexColors: true, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));
  stringBulbGeos.push(bg);
  scene.add(grp);
}
stringLights(-8.5, 8.5, 2.6, 5.4, 1.3);
stringLights(-6.0, 6.0, -5.5, 4.6, 1.0);

/* ================= 灯光模式 ================= */
let lightMode = 'gold';
const segMode = document.getElementById('segMode');
const tmpColor = new THREE.Color();

function setBulbColors(getColor) {
  for (let i = 0; i < CFG.rimBulbs; i++) {
    const c = getColor(i);
    rimBulbs.setColorAt(i, c);
    haloCol[i * 3] = c.r; haloCol[i * 3 + 1] = c.g; haloCol[i * 3 + 2] = c.b;
  }
  rimBulbs.instanceColor.needsUpdate = true;
  haloGeo.attributes.color.needsUpdate = true;
  for (const g of stringBulbGeos) {
    const arr = g.attributes.color;
    for (let i = 0; i < arr.count; i++) {
      const c = getColor(i * 7);
      arr.setXYZ(i, c.r, c.g, c.b);
    }
    arr.needsUpdate = true;
  }
  winMats.forEach((m, i) => m.color.copy(getColor(i * 6)));
  cabinGlows.forEach((s, i) => s.material.color.copy(getColor(i * 6)));
}

function applyMode(mode, t) {
  if (mode === 'gold') {
    setBulbColors(() => C_GOLD);
  } else if (mode === 'neon') {
    setBulbColors((i) => (i % 3 === 2 ? C_GOLD : C_PINK)); // 粉为主、金点缀
  } else {
    // 彩虹：粉↔金追逐波，严格不出三色盘
    setBulbColors((i) => {
      const k = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 0.55);
      return tmpColor.copy(C_PINK).lerp(C_GOLD, k).clone();
    });
  }
  hubCore.material.color.copy(mode === 'neon' ? C_PINK : C_GOLD);
  hubGlow.material.color.copy(mode === 'neon' ? C_PINK : C_GOLD);
  groundGlow.color.copy(mode === 'neon' ? C_PINK : C_GOLD);
}

segMode.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  lightMode = btn.dataset.m;
  segMode.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
  applyMode(lightMode, elapsed);
});

/* ================= 转速 / 暂停 ================= */
let targetSpeed = 1, speed = 1, paused = false;
const speedInput = document.getElementById('speed');
const speedOut = document.getElementById('speedOut');
const sideSpeed = document.getElementById('sideSpeed');
const btnPause = document.getElementById('btnPause');

function refreshSpeedUI() {
  const v = (speedInput.value / 100).toFixed(1);
  speedOut.textContent = '×' + v;
  sideSpeed.textContent = '转速 ×' + v + (paused ? ' · 已暂停' : ' · 巡航中');
}
speedInput.addEventListener('input', () => {
  targetSpeed = speedInput.value / 100;
  if (targetSpeed > 0 && paused) { paused = false; btnPause.setAttribute('aria-pressed', 'false'); btnPause.textContent = '暂停'; }
  refreshSpeedUI();
});
btnPause.addEventListener('click', () => {
  paused = !paused;
  btnPause.setAttribute('aria-pressed', String(paused));
  btnPause.textContent = paused ? '继续' : '暂停';
  refreshSpeedUI();
});
refreshSpeedUI();

/* ================= 点击座舱聚焦 ================= */
let focusIdx = -1;
const infocard = document.getElementById('infocard');
const icNum = document.getElementById('icNum');
const icH = document.getElementById('icH');
const icClose = document.getElementById('icClose');
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
const cabinWorld = new THREE.Vector3();
let lastH = '';

function openFocus(i) {
  focusIdx = i;
  icNum.textContent = String(i + 1);
  infocard.classList.add('open');
  infocard.setAttribute('aria-hidden', 'false');
  document.querySelector('.hint').style.opacity = '0';
}
function closeFocus() {
  focusIdx = -1;
  infocard.classList.remove('open');
  infocard.setAttribute('aria-hidden', 'true');
  document.querySelector('.hint').style.opacity = '';
}
icClose.addEventListener('click', closeFocus);

let downX = 0, downY = 0;
canvas.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
canvas.addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return; // 拖动不算点击
  pointerNDC.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(cabinBodies, false);
  if (hits.length) openFocus(hits[0].object.userData.g);
  else if (focusIdx >= 0) closeFocus();
});

// 桌面端指针视差（聚焦时停用）
let tpx = 0, tpy = 0, px = 0, py = 0;
if (!COARSE) {
  addEventListener('pointermove', (e) => {
    tpx = e.clientX / innerWidth - 0.5;
    tpy = e.clientY / innerHeight - 0.5;
  });
}

/* ================= 主循环 ================= */
const clock = new THREE.Clock();
let elapsed = 0;
let hTimer = 0;
const desiredCam = new THREE.Vector3();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  // 转速平滑
  const want = paused ? 0 : targetSpeed;
  speed += (want - speed) * (1 - Math.exp(-dt * 2.5));
  wheel.rotation.z += dt * CFG.baseSpeed * speed * (REDUCED ? 0.35 : 1);

  // 座舱水平补偿：pivot 反向转回轮体角度（嵌套结构，不用手算）
  for (const p of pivots) p.rotation.z = -wheel.rotation.z;
  // 座舱轻微摇摆（物理感）
  if (!REDUCED) {
    for (let i = 0; i < pivots.length; i++) {
      pivots[i].rotation.x = Math.sin(elapsed * 0.9 + i * 1.7) * 0.045;
    }
  }

  // 彩虹模式：追逐波逐帧推进
  if (lightMode === 'rainbow') applyMode('rainbow', elapsed);

  // 星星闪烁（双层错相）
  if (!REDUCED) {
    for (const s of starLayers) {
      s.material.opacity = 0.55 + 0.35 * Math.sin(elapsed * 1.6 + s.userData.phase);
    }
  }
  // 灯晕呼吸
  haloMat.opacity = 0.78 + 0.12 * Math.sin(elapsed * 3.1);
  hubGlow.material.opacity = 0.65 + 0.15 * Math.sin(elapsed * 2.3);

  // 相机：聚焦座舱时跟随，否则回全景 + 指针视差
  px += (tpx - px) * (1 - Math.exp(-dt * 3));
  py += (tpy - py) * (1 - Math.exp(-dt * 3));
  if (focusIdx >= 0) {
    cabinBodies[focusIdx].getWorldPosition(cabinWorld);
    desiredCam.set(cabinWorld.x + 2.3, cabinWorld.y + 0.9, cabinWorld.z + 3.4);
    camera.position.lerp(desiredCam, 1 - Math.exp(-dt * 3.2));
    // 注视点向世界 +x 偏移：座舱落在画面中央偏左，避开右侧信息卡
    _lookShift.copy(cabinWorld); _lookShift.x += 1.5; _lookShift.y += 0.1;
    lookTarget.lerp(_lookShift, 1 - Math.exp(-dt * 4));
    // 高度读数节流更新
    hTimer += dt;
    if (hTimer > 0.25) {
      hTimer = 0;
      const h = Math.max(0, Math.round(cabinWorld.y * CFG.meterPerUnit));
      const txt = '约 ' + h + ' 米';
      if (txt !== lastH) { lastH = txt; icH.textContent = txt; }
    }
  } else {
    desiredCam.set(CAM_HOME.x + px * 1.1, CAM_HOME.y - py * 0.7, CAM_HOME.z);
    camera.position.lerp(desiredCam, 1 - Math.exp(-dt * 2.5));
    lookTarget.lerp(LOOK_HOME, 1 - Math.exp(-dt * 3));
  }
  camera.lookAt(lookTarget);

  renderer.render(scene, camera);
}

addEventListener('resize', fitCamera);

/* ================= 入场（完成态必达） ================= */
applyMode('gold', 0);
fitCamera();
tick();
let revealed = false;
function reveal() {
  if (revealed) return; revealed = true;
  document.getElementById('loader').classList.add('done');
  document.querySelectorAll('[data-intro]').forEach((el) => el.classList.add('is-in'));
}
setTimeout(reveal, 900);    // 主路径
setTimeout(reveal, 3800);   // 兜底：完成态恒可达
