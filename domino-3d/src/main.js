/* domino-3d · 多米诺连锁倒塌
 * 自研确定性倒塌链：每块牌绕底边前沿翻倒，前块角度越过接触角即触发下一块。
 * 不用任何物理库（cannon 等），全部手写。
 * 配色全页严格 3 色：#0f0e0c / #f5f0e6 / #dc2626
 */
import * as THREE from 'three';

/* ---------------- 配置 ---------------- */
const INK = 0x0f0e0c;      // 墨
const CREAM = 0xf5f0e6;    // 米白
const RED = 0xdc2626;      // 红

const D = {
  W: 0.62,          // 牌宽（横向）
  H: 2.7,           // 牌高
  T: 0.44,          // 牌厚（倒塌方向）
  SPACING: 1.42,    // 中心间距
  REST: 1.27,       // 倒定角 ≈73°
  FALL_TIME: 0.46,  // 单块倒下用时（秒，正常速）
  SLOW_K: 3.4,      // 慢动作倍率
  GRAV_POW: 2.15,   // 倒塌加速指数（ease-in 物理感：越倒越快）
};

const LAYOUTS = {
  line:   { label: '直线', n: 48 },
  sbend:  { label: 'S 弯', n: 54 },
  double: { label: '双排', n: 52 },
};

/* 确定性伪随机（连锁节奏可复现，不用 Math.random） */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- 场景 ---------------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(INK);
scene.fog = new THREE.Fog(INK, 34, 95);

const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 400);

scene.add(new THREE.HemisphereLight(CREAM, INK, 1.0));
const key = new THREE.DirectionalLight(CREAM, 2.3);
key.position.set(-9, 15, 7);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -60; key.shadow.camera.right = 60;
key.shadow.camera.top = 28; key.shadow.camera.bottom = -28;
key.shadow.camera.far = 150;
key.shadow.bias = -0.0004;
scene.add(key);
const rim = new THREE.DirectionalLight(RED, 0.55);
rim.position.set(12, 6, -10);
scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(120, 48),
  new THREE.MeshStandardMaterial({ color: INK, roughness: 0.96, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* 牌面纹理：canvas 手绘，逐牌一字印触发词 */
const texCache = new Map();
function faceTexture(glyph, style, idx) {
  const key2 = glyph + '|' + style + '|' + idx;
  if (texCache.has(key2)) return texCache.get(key2);
  const bg = style === 'red' ? '#dc2626' : '#f5f0e6';
  const fg = style === 'red' ? '#f5f0e6' : '#0f0e0c';
  const c = document.createElement('canvas');
  c.width = 256; c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 256, 1024);
  // 边框
  g.strokeStyle = fg; g.lineWidth = 10;
  g.strokeRect(18, 18, 220, 988);
  // 中线
  g.lineWidth = 6;
  g.beginPath(); g.moveTo(28, 512); g.lineTo(228, 512); g.stroke();
  // 上半：触发词一字
  if (glyph) {
    g.fillStyle = fg;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '300 190px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
    g.fillText(glyph, 128, 300, 200);
  }
  // 下半：编号
  if (idx != null) {
    g.fillStyle = style === 'red' ? '#f5f0e6' : '#dc2626';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '600 84px system-ui,sans-serif';
    g.fillText(String(idx).padStart(2, '0'), 128, 760);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  texCache.set(key2, tex);
  return tex;
}
const edgeMatCache = new Map();
function edgeMat(style) {
  if (!edgeMatCache.has(style)) {
    edgeMatCache.set(style, new THREE.MeshStandardMaterial({
      color: style === 'red' ? RED : CREAM, roughness: 0.62, metalness: 0.04,
    }));
  }
  return edgeMatCache.get(style);
}

/* ---------------- 骨牌链 ---------------- */
const chainGroup = new THREE.Group();
scene.add(chainGroup);
let guideLine = null;

let dominoes = [];   // {pivot, tilt, i, trig:[], thetaC, t0:-1, theta, restJitter}
let layoutName = 'line';
let triggerWord = '连锁反应';
let simTime = 0;
let running = false;
let finished = false;
let slowmo = false;
let frontIdx = 0;

const dominoGeo = new THREE.BoxGeometry(D.T, D.H, D.W);

function disposeMats(mesh) {
  const m = mesh.material;
  (Array.isArray(m) ? m : [m]).forEach(x => { if (x && x._own) x.dispose(); });
}

function buildLayout(name) {
  layoutName = name;
  // 清理旧链
  while (chainGroup.children.length) {
    const o = chainGroup.children.pop();
    o.traverse(n => { if (n.isMesh) disposeMats(n); });
  }
  if (guideLine) { scene.remove(guideLine); guideLine.geometry.dispose(); guideLine = null; }
  dominoes = [];
  simTime = 0; running = false; finished = false; frontIdx = 0;

  const rnd = mulberry32(name === 'line' ? 11 : name === 'sbend' ? 77 : 313);
  const N = LAYOUTS[name].n;
  const pts = [];

  if (name === 'line') {
    for (let i = 0; i < N; i++) pts.push({ x: i * D.SPACING, z: 0 });
  } else if (name === 'sbend') {
    const L = (N - 1) * D.SPACING;
    const lam = L * 0.82, A = 3.1;
    for (let i = 0; i < N; i++) {
      const x = i * D.SPACING - L / 2;
      pts.push({ x, z: A * Math.sin((2 * Math.PI * i * D.SPACING) / lam) });
    }
  } else { // double：两排平行，A 排触发 B 排
    const half = N / 2;
    for (let i = 0; i < half; i++) pts.push({ x: i * D.SPACING, z: -0.92, row: 'A', k: i });
    for (let i = 0; i < half; i++) pts.push({ x: (i + 0.5) * D.SPACING, z: 0.92, row: 'B', k: i });
  }

  const chars = [...triggerWord];
  const thetaCBase = Math.asin(Math.min(0.9, (D.SPACING - D.T) / D.H));

  pts.forEach((p, i) => {
    const pivot = new THREE.Group();
    pivot.position.set(p.x, 0, p.z);
    // 朝向：切线方向（用邻点差分）
    const q = pts[Math.min(i + 1, pts.length - 1)], q0 = pts[Math.max(i - 1, 0)];
    let yaw = Math.atan2(-(q.z - q0.z), (q.x - q0.x) || 1e-6);
    if (name === 'double') yaw = 0;
    pivot.rotation.y = yaw;
    // tilt 组位于底边前沿，绕 Z 负向翻倒（朝 +X 倒）
    const tilt = new THREE.Group();
    tilt.position.set(D.T / 2, 0, 0);
    const mesh = new THREE.Mesh(dominoGeo, null);
    mesh.position.set(-D.T / 2, D.H / 2, 0);
    mesh.castShadow = true; mesh.receiveShadow = true;
    tilt.add(mesh);
    pivot.add(tilt);
    chainGroup.add(pivot);
    dominoes.push({ pivot, tilt, mesh, i, trig: [], thetaC: thetaCBase * (0.92 + rnd() * 0.16), t0: -1, theta: 0, restJ: (rnd() - 0.5) * 0.05 });
  });

  // 触发关系
  if (name === 'double') {
    const A = dominoes.filter(d => pts[d.i].row === 'A');
    const B = dominoes.filter(d => pts[d.i].row === 'B');
    A.forEach((d, k) => {
      if (k + 1 < A.length) d.trig.push(A[k + 1].i);
      d.trig.push(B[k].i);
    });
    B.forEach((d, k) => { if (k + 1 < B.length) d.trig.push(B[k + 1].i); });
  } else {
    dominoes.forEach((d, k) => { if (k + 1 < dominoes.length) d.trig.push(k + 1); });
  }

  paintFaces();
  drawGuide(name, pts);
  resetCamera(true);
  updateHUD();
}

/* 牌面绘制：前 k 块印触发词逐字，第一块红色 */
function paintFaces() {
  const chars = [...triggerWord];
  dominoes.forEach((d) => {
    const isFirst = d.i === 0;
    const style = isFirst ? 'red' : 'cream';
    const glyph = d.i < chars.length ? chars[d.i] : '';
    const face = new THREE.MeshStandardMaterial({
      map: faceTexture(glyph, style, d.i + 1), roughness: 0.58, metalness: 0.04,
    });
    face._own = true;
    const edge = edgeMat(style);
    disposeMats(d.mesh);
    d.mesh.material = [face, face, edge, edge, edge, edge];
  });
}

/* 地面引导线：链条走向虚线 */
function drawGuide(name, pts) {
  const mat = new THREE.LineDashedMaterial({ color: CREAM, transparent: true, opacity: 0.22, dashSize: 0.7, gapSize: 0.55 });
  const v = pts.map(p => new THREE.Vector3(p.x, 0.02, p.z));
  const geo = new THREE.BufferGeometry().setFromPoints(v);
  guideLine = new THREE.Line(geo, mat);
  guideLine.computeLineDistances();
  scene.add(guideLine);
}

/* ---------------- 倒塌推进 ---------------- */
function push() {
  if (running || finished) return;
  running = true;
  dominoes[0].t0 = simTime;
  document.getElementById('btn-push').disabled = true;
  document.getElementById('btn-push').textContent = '倒塌中…';
  swayOn = false;
  updateHUD();
}

function resetAll() {
  buildLayout(layoutName);
  const b = document.getElementById('btn-push');
  b.disabled = false; b.textContent = '推倒';
}

function stepPhysics(dt) {
  const fallT = D.FALL_TIME * (slowmo ? D.SLOW_K : 1);
  let fallen = 0;
  for (const d of dominoes) {
    if (d.t0 < 0) continue;
    const tau = (simTime - d.t0) / fallT;
    if (tau <= 0) { d.theta = 0; continue; }
    const rest = D.REST + d.restJ;
    if (tau < 1) {
      d.theta = rest * Math.pow(tau, D.GRAV_POW);
    } else {
      // 落定轻微"咔哒"回弹
      const s = tau - 1;
      d.theta = rest - 0.03 * Math.sin(s * 16) * Math.exp(-s * 5.5);
      fallen++;
    }
    d.tilt.rotation.z = -d.theta;
    // 越过接触角 → 触发下一块（确定性连锁）
    if (!d.fired && d.theta >= d.thetaC) {
      d.fired = true;
      for (const j of d.trig) if (dominoes[j].t0 < 0) dominoes[j].t0 = simTime;
      frontIdx = Math.max(frontIdx, d.i);
    }
  }
  if (running && fallen >= dominoes.length && !finished) {
    finished = true; running = false;
    const b = document.getElementById('btn-push');
    b.textContent = '全部倒塌';
    updateHUD();
  }
  return fallen;
}

/* ---------------- 相机：跟随倒塌前锋 ---------------- */
const camTarget = new THREE.Vector3();
const camTargetSm = new THREE.Vector3();
const camPosSm = new THREE.Vector3(0, 6, 16);
let swayOn = true, swayA = 0;
let userYaw = 0, userPitch = 0;

function viewAnchor() {
  const a = dominoes[0].pivot.position, b = dominoes[dominoes.length - 1].pivot.position;
  const L = Math.max(10, Math.hypot(b.x - a.x, b.z - a.z));
  // 相机在起点后方左侧，视线顺链条向前：红色首牌在画面左部，链条向右延伸
  // 窄屏时拉远，保证首牌完整入画
  const s = camera.aspect < 1 ? 1.45 : 1;
  const camBase = new THREE.Vector3(a.x - 9 * s, 5.2 * s, a.z + 10 * s);
  const look = new THREE.Vector3(a.x + (camera.aspect < 1 ? 5 : 14), 1.3, a.z);
  return { camBase, look, L };
}

function resetCamera(snap) {
  const { camBase, look } = viewAnchor();
  swayOn = true; userYaw = 0; userPitch = 0;
  camTargetSm.copy(look);
  camPosSm.copy(camBase);
  if (snap) { camera.position.copy(camBase); camTarget.copy(look); camera.lookAt(look); }
}

function stepCamera(dt, t) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (swayOn && !reduced) {
    swayA += dt * 0.06;
    const { camBase, look } = viewAnchor();
    // 待机呼吸：围绕基准位小幅浮动，不破坏构图
    camTarget.copy(look);
    camera.position.set(
      camBase.x + Math.sin(swayA) * 1.4,
      camBase.y + Math.sin(swayA * 0.7) * 0.5,
      camBase.z + (1 - Math.cos(swayA * 0.5)) * 1.6
    );
    camera.lookAt(camTarget);
    camTargetSm.copy(look); camPosSm.copy(camera.position);
    return;
  }
  // 跟随前锋：目标=前锋牌位置+前瞻
  const f = dominoes[Math.min(frontIdx + 2, dominoes.length - 1)].pivot.position;
  const ahead = dominoes[Math.min(frontIdx + 8, dominoes.length - 1)].pivot.position;
  camTarget.set((f.x + ahead.x) / 2, 1.3, (f.z + ahead.z) / 2);
  const k1 = 1 - Math.exp(-dt * 2.6), k2 = 1 - Math.exp(-dt * 3.4);
  camTargetSm.lerp(camTarget, k1);
  const base = new THREE.Vector3(-7.2, 4.6, 8.6);
  base.applyAxisAngle(new THREE.Vector3(0, 1, 0), userYaw);
  base.y += userPitch;
  const want = camTargetSm.clone().add(base);
  camPosSm.lerp(want, k2);
  camera.position.copy(camPosSm);
  camera.lookAt(camTargetSm);
}

/* 手动拖拽微调视角 */
(function () {
  let down = false, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', e => { down = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('pointermove', e => {
    if (!down) return;
    userYaw -= (e.clientX - lx) * 0.004;
    userPitch = Math.max(-2.5, Math.min(6, userPitch + (e.clientY - ly) * 0.006));
    lx = e.clientX; ly = e.clientY;
  });
  window.addEventListener('pointerup', () => { down = false; });
})();

/* ---------------- HUD / 控件 ---------------- */
const elCount = document.getElementById('count');
const elBar = document.getElementById('bar-fill');
const elState = document.getElementById('state');

function updateHUD(fallen) {
  const n = dominoes.length;
  const f = fallen != null ? fallen : 0;
  elCount.textContent = String(f).padStart(2, '0') + ' / ' + n;
  elBar.style.width = (n ? (f / n) * 100 : 0) + '%';
  elState.textContent = finished ? '全部倒塌' : running ? '连锁进行中' : '待命';
}

document.getElementById('btn-push').addEventListener('click', push);
document.getElementById('btn-reset').addEventListener('click', resetAll);
document.getElementById('slowmo').addEventListener('change', e => { slowmo = e.target.checked; });

const wordInput = document.getElementById('word');
wordInput.addEventListener('change', () => {
  triggerWord = [...wordInput.value.trim()].slice(0, 24).join('') || '连锁反应';
  wordInput.value = triggerWord;
  paintFaces();
});

document.querySelectorAll('.lay-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lay-btn').forEach(x => x.classList.remove('on'));
    btn.classList.add('on');
    buildLayout(btn.dataset.lay);
    const b = document.getElementById('btn-push');
    b.disabled = false; b.textContent = '推倒';
  });
});

/* ---------------- 主循环 ---------------- */
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

buildLayout('line');

const clock = new THREE.Clock();
let fallenShown = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const tScale = slowmo ? 1 / D.SLOW_K : 1;
  simTime += dt * tScale;
  if (running || finished) fallenShown = stepPhysics(dt);
  else stepPhysics(dt); // t0 全为 -1，直接返回
  stepCamera(dt, simTime);
  updateHUD(fallenShown);
  renderer.render(scene, camera);
}
loop();

/* ---------------- 加载态 ---------------- */
let ready = false;
function goReady() {
  if (ready) return; ready = true;
  document.body.classList.add('ready');
}
requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(goReady, 500)));
setTimeout(goReady, 3000); // 兜底
