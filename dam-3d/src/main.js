/* dam-3d · 大坝泄洪 —— 全部程序化几何，无外部请求。huafire3d fx-lab original implementation. */
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 900);
const CAM0 = new THREE.Vector3(34, 8, 64);
const LOOK0 = new THREE.Vector3(0, -9, 4);
camera.position.copy(CAM0);
camera.lookAt(LOOK0);

/* ================= 世界常量 ================= */
const CREST_Y = 0;          // 坝顶
const BASIN_Y = -26;        // 下游水面
const FACE_Z = 8;           // 坝体下游面
const GATES_X = [-13, 0, 13];
const GATE_W = 7;           // 每孔净宽
const LIP_Y = -3.4;         // 泄洪口唇缘
const JET_VZ = 5.8;         // 初速（下游方向）

/* ================= 天空 ================= */
function skyTexture() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0.00, '#7FA8CE');
  gr.addColorStop(0.42, '#B9D4EA');
  gr.addColorStop(0.72, '#E4EFF8');
  gr.addColorStop(1.00, '#F2F7FB');
  g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
scene.background = skyTexture();
scene.fog = new THREE.Fog(0xDCE9F4, 130, 380);

/* ================= 灯光 ================= */
scene.add(new THREE.HemisphereLight(0xEAF3FB, 0x8A9299, 0.95));
const sun = new THREE.DirectionalLight(0xFFFFFF, 1.7);
sun.position.set(46, 52, 58);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -60;
sun.shadow.camera.far = 260;
sun.shadow.bias = -0.0004;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xBFD9F2, 0.35);
fill.position.set(-40, 20, 30);
scene.add(fill);

/* ================= 混凝土纹理（程序化 canvas） ================= */
function concreteTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#B7BEC4'; g.fillRect(0, 0, 512, 512);
  // 竖向水渍条纹
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 512, w = 2 + Math.random() * 14;
    g.fillStyle = `rgba(${120 + Math.random() * 40 | 0},${128 + Math.random() * 40 | 0},${132 + Math.random() * 40 | 0},${0.05 + Math.random() * 0.10})`;
    g.fillRect(x, 0, w, 512);
  }
  // 施工缝：横向分仓线
  g.strokeStyle = 'rgba(70,78,84,0.5)'; g.lineWidth = 2;
  for (let y = 0; y <= 512; y += 128) {
    g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(512, y + 0.5); g.stroke();
  }
  // 竖向分缝
  g.strokeStyle = 'rgba(70,78,84,0.35)';
  for (let x = 0; x <= 512; x += 170) {
    g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, 512); g.stroke();
  }
  // 细噪点
  for (let i = 0; i < 2600; i++) {
    const v = 140 + Math.random() * 60 | 0;
    g.fillStyle = `rgba(${v},${v + 4},${v + 8},0.12)`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 1.6, 1.6);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const concreteTex = concreteTexture();
concreteTex.repeat.set(6, 1.4);
const concreteMat = new THREE.MeshStandardMaterial({
  map: concreteTex, color: 0xD8DDE1, roughness: 0.92, metalness: 0.0,
});
const concreteDark = new THREE.MeshStandardMaterial({ color: 0x6E777D, roughness: 0.95 });

/* ================= 大坝本体 ================= */
const dam = new THREE.Group();
scene.add(dam);

const body = new THREE.Mesh(new THREE.BoxGeometry(130, 26, 16), concreteMat);
body.position.set(0, -13, 0);
body.castShadow = body.receiveShadow = true;
dam.add(body);

// 坝顶人行道
const walk = new THREE.Mesh(new THREE.BoxGeometry(130, 0.9, 4.4),
  new THREE.MeshStandardMaterial({ color: 0x8E979D, roughness: 0.9 }));
walk.position.set(0, 0.45, 4.8);
walk.receiveShadow = true;
dam.add(walk);

// 栏杆：立柱 + 顶栏
{
  const postGeo = new THREE.BoxGeometry(0.14, 1.15, 0.14);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x5A636A, roughness: 0.6, metalness: 0.5 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x6E777D, roughness: 0.55, metalness: 0.55 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(130, 0.09, 0.09), railMat);
  rail.position.set(0, 2.0, 6.9); dam.add(rail);
  for (let x = -64; x <= 64; x += 4) {
    const p = new THREE.Mesh(postGeo, postMat);
    p.position.set(x, 1.45, 6.9); dam.add(p);
  }
}

// 泄洪口：深色凹腔 + 边墩
const openingMat = new THREE.MeshStandardMaterial({ color: 0x4A5257, roughness: 1 });
for (const gx of GATES_X) {
  const hole = new THREE.Mesh(new THREE.BoxGeometry(GATE_W + 0.8, 8.4, 1.2), openingMat);
  hole.position.set(gx, LIP_Y + 0.8, FACE_Z - 0.3);
  dam.add(hole);
}
for (const px of [-19.5, -6.5, 6.5, 19.5]) {
  const pier = new THREE.Mesh(new THREE.BoxGeometry(2.6, 10.5, 2.2), concreteMat);
  pier.position.set(px, -4.2, FACE_Z + 0.4);
  pier.castShadow = pier.receiveShadow = true;
  dam.add(pier);
}
// 两端闸墩塔楼
for (const tx of [-66.5, 66.5]) {
  const tower = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), concreteMat);
  tower.position.set(tx, 4, 2);
  tower.castShadow = true;
  dam.add(tower);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.7, 5.8), concreteDark);
  cap.position.set(tx, 8.3, 2);
  dam.add(cap);
}

/* ================= 闸门（升降闸板） ================= */
const gateLeaves = [];
const gateMat = new THREE.MeshStandardMaterial({ color: 0x9AA4AB, roughness: 0.55, metalness: 0.35 });
for (const gx of GATES_X) {
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(GATE_W, 5.2, 0.55), gateMat);
  leaf.castShadow = true;
  leaf.position.set(gx, LIP_Y - 0.4, FACE_Z + 0.55); // 关闭位
  dam.add(leaf);
  gateLeaves.push(leaf);
}
const GATE_CLOSED_Y = LIP_Y - 0.4;
const GATE_OPEN_Y = LIP_Y + 4.4;

/* ================= 下游水面 ================= */
const basin = new THREE.Mesh(
  new THREE.PlaneGeometry(560, 260),
  new THREE.MeshStandardMaterial({ color: 0x5E93B8, roughness: 0.32, metalness: 0.08 })
);
basin.rotation.x = -Math.PI / 2;
basin.position.set(0, BASIN_Y, 110);
basin.receiveShadow = true;
scene.add(basin);

// 上游库水（坝顶后方一小片，相机偶尔带到）
const reservoir = new THREE.Mesh(
  new THREE.PlaneGeometry(560, 200),
  new THREE.MeshStandardMaterial({ color: 0x6FA3C4, roughness: 0.25 })
);
reservoir.rotation.x = -Math.PI / 2;
reservoir.position.set(0, -1.6, -110);
scene.add(reservoir);

/* ================= 水舌：抛物线曲面 + 滚动条纹 ================= */
function streakTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 256);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 128;
    const w = 1 + Math.random() * 5;
    const a = 0.10 + Math.random() * 0.30;
    const grd = g.createLinearGradient(x, 0, x, 256);
    grd.addColorStop(0, `rgba(255,255,255,${a * 0.4})`);
    grd.addColorStop(0.5, `rgba(235,246,253,${a})`);
    grd.addColorStop(1, `rgba(255,255,255,${a * 0.9})`);
    g.fillStyle = grd;
    g.fillRect(x - w / 2, 0, w, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const streakTex = streakTexture();
streakTex.repeat.set(2, 3);

const nappes = [];
for (const gx of GATES_X) {
  // 按弹道预计算抛物线：y = LIP_Y - 4.9 t² + 0.6 t, z = FACE_Z + 0.6 + JET_VZ t
  const SEG = 26;
  const geo = new THREE.PlaneGeometry(GATE_W, 1, 1, SEG);
  const pos = geo.attributes.position;
  for (let i = 0; i <= SEG; i++) {
    const t = (i / SEG) * 2.2;
    const y = LIP_Y - 4.9 * t * t + 0.6 * t;
    const z = FACE_Z + 0.6 + JET_VZ * t;
    for (let j = 0; j < 2; j++) {
      const vi = i * 2 + j;
      const x = gx + pos.getX(vi);
      pos.setXYZ(vi, x, Math.max(y, BASIN_Y + 0.2), z);
    }
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    map: streakTex.clone(), color: 0xDDF0FC, transparent: true, opacity: 0.8,
    depthWrite: false, side: THREE.DoubleSide,
  });
  mat.map.needsUpdate = true;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  scene.add(mesh);
  nappes.push(mat);
}

/* ================= 落点泡沫 ================= */
function foamTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 240; i++) {
    const r = 3 + Math.random() * 16;
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * 105;
    const x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d;
    const al = 0.10 + Math.random() * 0.35;
    g.fillStyle = `rgba(255,255,255,${al})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  return t;
}
const foamTex = foamTexture();
const foams = [];
for (const gx of GATES_X) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(10.5, 40),
    new THREE.MeshBasicMaterial({ map: foamTex, transparent: true, opacity: 0.9, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  // 弹道落点：t≈2.05 时 z = 8.6+5.8*2.05 ≈ 20.5
  m.position.set(gx, BASIN_Y + 0.15, 21);
  scene.add(m);
  foams.push(m);
}

/* ================= 远山 ================= */
{
  const mMat = new THREE.MeshStandardMaterial({ color: 0x93A5B5, roughness: 1, flatShading: true });
  const peaks = [
    [-150, -26, -120, 90, 70], [-60, -26, -150, 120, 95], [40, -26, -140, 100, 80],
    [140, -26, -110, 85, 62], [-210, -26, -40, 70, 50], [210, -26, -30, 76, 55],
  ];
  for (const [x, y, z, r, h] of peaks) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mMat);
    cone.position.set(x, y + h / 2, z);
    cone.rotation.y = Math.random() * Math.PI;
    scene.add(cone);
  }
}

/* ================= 云（柔光精灵，z-index 避 blur） ================= */
function puffTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grd.addColorStop(0, 'rgba(255,255,255,.85)');
  grd.addColorStop(0.55, 'rgba(255,255,255,.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const puffTex = puffTexture();
const clouds = [];
for (let i = 0; i < 6; i++) {
  const sm = new THREE.SpriteMaterial({ map: puffTex, transparent: true, opacity: 0.5 + Math.random() * 0.25, depthWrite: false });
  const s = new THREE.Sprite(sm);
  const sc = 34 + Math.random() * 40;
  s.scale.set(sc, sc * 0.42, 1);
  s.position.set(-220 + Math.random() * 440, 34 + Math.random() * 26, -170 - Math.random() * 60);
  scene.add(s);
  clouds.push({ s, v: 0.7 + Math.random() * 0.9 });
}

/* ================= 水粒子：水舌 / 水花 / 雾 三态 ================= */
const PMAX = 11000;
const pPos = new Float32Array(PMAX * 3);
const pCol = new Float32Array(PMAX * 3);
const pSiz = new Float32Array(PMAX);
const pAlp = new Float32Array(PMAX);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
geo.setAttribute('pcolor', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
geo.setAttribute('psize', new THREE.BufferAttribute(pSiz, 1).setUsage(THREE.DynamicDrawUsage));
geo.setAttribute('palpha', new THREE.BufferAttribute(pAlp, 1).setUsage(THREE.DynamicDrawUsage));
const pMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  vertexShader: `
    attribute vec3 pcolor; attribute float psize; attribute float palpha;
    varying vec3 vC; varying float vA;
    void main(){
      vC = pcolor; vA = palpha;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = psize * (240.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying vec3 vC; varying float vA;
    void main(){
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      float m = smoothstep(0.5, 0.08, d);
      if (m * vA < 0.004) discard;
      gl_FragColor = vec4(vC, m * vA);
    }`,
});
const points = new THREE.Points(geo, pMat);
points.frustumCulled = false;
scene.add(points);

// CPU 粒子池：SoA
const vx = new Float32Array(PMAX), vy = new Float32Array(PMAX), vz = new Float32Array(PMAX);
const life = new Float32Array(PMAX), maxlife = new Float32Array(PMAX);
const kind = new Uint8Array(PMAX);           // 0 水舌 1 水花 2 雾
const grow = new Float32Array(PMAX);          // 雾的尺寸生长
let pAlive = 0;

function spawnJet(gx, d) {
  if (pAlive >= PMAX) return;
  const i = pAlive++;
  const spread = (Math.random() - 0.5) * (GATE_W - 1.2);
  pPos[i * 3] = gx + spread;
  pPos[i * 3 + 1] = LIP_Y - Math.random() * 1.2;
  pPos[i * 3 + 2] = FACE_Z + 0.4 + Math.random() * 0.6;
  vx[i] = (Math.random() - 0.5) * 1.2;
  vy[i] = 0.6 + Math.random() * 1.4;
  vz[i] = JET_VZ * (0.92 + Math.random() * 0.16);
  kind[i] = 0;
  life[i] = 0; maxlife[i] = 2.3;
  const b = 0.75 + Math.random() * 0.25;   // 水舌：水蓝偏白
  pCol[i * 3] = 0.78 * b + 0.18; pCol[i * 3 + 1] = 0.88 * b + 0.08; pCol[i * 3 + 2] = 0.97 * b;
  pSiz[i] = 1.5 + Math.random() * 1.3;
  pAlp[i] = 0.75 + Math.random() * 0.2;
}
function spawnSplash(x, y, z) {
  if (pAlive >= PMAX) return;
  const i = pAlive++;
  pPos[i * 3] = x; pPos[i * 3 + 1] = y + 0.2; pPos[i * 3 + 2] = z;
  const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 5.5;
  vx[i] = Math.cos(a) * r; vz[i] = Math.sin(a) * r * 0.7;
  vy[i] = 2.5 + Math.random() * 7.5;
  kind[i] = 1;
  life[i] = 0; maxlife[i] = 0.8 + Math.random() * 0.8;
  const b = 0.92 + Math.random() * 0.08;   // 水花：纯白
  pCol[i * 3] = b; pCol[i * 3 + 1] = b; pCol[i * 3 + 2] = Math.min(1, b + 0.02);
  pSiz[i] = 1.1 + Math.random() * 1.4;
  pAlp[i] = 0.85;
  grow[i] = 0;
}
function spawnMist(x, y, z) {
  if (pAlive >= PMAX) return;
  const i = pAlive++;
  pPos[i * 3] = x + (Math.random() - 0.5) * 8;
  pPos[i * 3 + 1] = y + Math.random() * 1.5;
  pPos[i * 3 + 2] = z + (Math.random() - 0.5) * 8;
  vx[i] = (Math.random() - 0.5) * 2.2;
  vy[i] = 0.8 + Math.random() * 1.6;
  vz[i] = (Math.random() - 0.5) * 1.6;
  kind[i] = 2;
  life[i] = 0; maxlife[i] = 2.4 + Math.random() * 1.4;
  pCol[i * 3] = 0.90; pCol[i * 3 + 1] = 0.95; pCol[i * 3 + 2] = 0.99;
  pSiz[i] = 9 + Math.random() * 9;
  pAlp[i] = 0.10 + Math.random() * 0.12;
  grow[i] = 2.2 + Math.random() * 2.0;      // 雾团膨胀速度
}
function kill(i) {
  const l = --pAlive;
  if (i !== l) {
    pPos[i * 3] = pPos[l * 3]; pPos[i * 3 + 1] = pPos[l * 3 + 1]; pPos[i * 3 + 2] = pPos[l * 3 + 2];
    vx[i] = vx[l]; vy[i] = vy[l]; vz[i] = vz[l];
    life[i] = life[l]; maxlife[i] = maxlife[l]; kind[i] = kind[l]; grow[i] = grow[l];
    pCol[i * 3] = pCol[l * 3]; pCol[i * 3 + 1] = pCol[l * 3 + 1]; pCol[i * 3 + 2] = pCol[l * 3 + 2];
    pSiz[i] = pSiz[l]; pAlp[i] = pAlp[l];
  }
}

/* ================= 状态与控制 ================= */
const state = {
  discharge: 0.70,     // 泄洪量滑杆
  gateT: 1, gateTarget: 1,
  slow: false,
  timeScale: 1,
  emitAcc: 0,
};
const MAX_FLOW = 14800; // 三孔全开 100% 时的标称流量 m³/s

const dischargeEl = $('discharge'), dischargeVal = $('dischargeVal');
const gateBtn = $('gateBtn'), slowBtn = $('slowBtn');
const flowNum = $('flowNum'), flowBar = $('flowBar');
const gateState = $('gateState'), gatePct = $('gatePct'), speedState = $('speedState');

function fmt(n) { return n.toLocaleString('en-US'); }

dischargeEl.addEventListener('input', () => {
  state.discharge = dischargeEl.value / 100;
  dischargeVal.textContent = dischargeEl.value + '%';
});
gateBtn.addEventListener('click', () => {
  state.gateTarget = state.gateTarget > 0.5 ? 0 : 1;
  const open = state.gateTarget > 0.5;
  gateBtn.textContent = open ? '闸门 · 开' : '闸门 · 关';
  gateBtn.classList.toggle('on', open);
  gateBtn.setAttribute('aria-pressed', String(open));
});
slowBtn.addEventListener('click', () => {
  state.slow = !state.slow;
  state.timeScale = state.slow ? 0.22 : 1;
  slowBtn.textContent = state.slow ? '慢动作 · 开' : '慢动作 · 关';
  slowBtn.classList.toggle('on', state.slow);
  slowBtn.setAttribute('aria-pressed', String(state.slow));
  speedState.textContent = state.slow ? '1/4×' : '1×';
});

function refreshHUD() {
  const flow = Math.round(state.discharge * state.gateT * MAX_FLOW);
  flowNum.textContent = fmt(flow);
  flowBar.style.width = (state.discharge * state.gateT * 100).toFixed(1) + '%';
  gatePct.textContent = Math.round(state.gateT * 100) + '%';
  if (state.gateT > 0.98) gateState.textContent = '闸门 · 全开';
  else if (state.gateT < 0.02) gateState.textContent = '闸门 · 全关';
  else gateState.textContent = state.gateTarget > 0.5 ? '闸门 · 开启中' : '闸门 · 关闭中';
}

/* ================= 模拟步进 ================= */
function step(dt) {
  // 闸门开度趋近（物理感：匀速丝杠）
  const gRate = 0.55 * dt;
  if (state.gateT < state.gateTarget) state.gateT = Math.min(state.gateTarget, state.gateT + gRate);
  else if (state.gateT > state.gateTarget) state.gateT = Math.max(state.gateTarget, state.gateT - gRate);

  // 发射
  const rate = state.discharge * state.gateT * 620; // 每孔每秒
  state.emitAcc += rate * dt * GATES_X.length;
  while (state.emitAcc >= 1) {
    state.emitAcc -= 1;
    spawnJet(GATES_X[(Math.random() * 3) | 0], state.discharge);
  }

  // 粒子更新
  const g = -9.8 * dt;
  for (let i = pAlive - 1; i >= 0; i--) {
    life[i] += dt;
    const k = kind[i];
    if (k === 0) {
      vy[i] += g;
      pPos[i * 3] += vx[i] * dt;
      pPos[i * 3 + 1] += vy[i] * dt;
      pPos[i * 3 + 2] += vz[i] * dt;
      if (pPos[i * 3 + 1] <= BASIN_Y + 0.3 || life[i] > maxlife[i]) {
        const sx = pPos[i * 3], sz = pPos[i * 3 + 2];
        kill(i);
        spawnSplash(sx, BASIN_Y, sz);
        if (Math.random() < 0.45) spawnMist(sx, BASIN_Y, sz);
        continue;
      }
    } else if (k === 1) {
      vy[i] += g * 0.9;
      pPos[i * 3] += vx[i] * dt;
      pPos[i * 3 + 1] += vy[i] * dt;
      pPos[i * 3 + 2] += vz[i] * dt;
      if (pPos[i * 3 + 1] < BASIN_Y || life[i] > maxlife[i]) {
        const sx = pPos[i * 3], sz = pPos[i * 3 + 2];
        kill(i);
        if (Math.random() < 0.5) spawnMist(sx, BASIN_Y, sz);
        continue;
      }
      pAlp[i] = 0.85 * (1 - life[i] / maxlife[i]);
    } else {
      pPos[i * 3] += vx[i] * dt;
      pPos[i * 3 + 1] += vy[i] * dt;
      pPos[i * 3 + 2] += vz[i] * dt;
      pSiz[i] += grow[i] * dt;
      if (life[i] > maxlife[i]) { kill(i); continue; }
      const t = life[i] / maxlife[i];
      pAlp[i] = (t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75) * 0.16;
    }
  }

  // 水舌纹理滚动 + 透明度跟随开度
  for (const n of nappes) {
    n.map.offset.y -= dt * (0.6 + state.discharge * 1.6) * state.gateT;
    n.opacity = 0.82 * state.gateT * (0.35 + 0.65 * state.discharge);
  }
  // 泡沫旋转 + 透明度
  for (const f of foams) {
    f.rotation.z += dt * 0.25 * state.gateT;
    f.material.opacity = 0.9 * state.gateT * (0.3 + 0.7 * state.discharge);
  }
  // 闸板位置
  for (const leaf of gateLeaves) {
    leaf.position.y = GATE_CLOSED_Y + (GATE_OPEN_Y - GATE_CLOSED_Y) * state.gateT;
  }
  // 云漂移
  if (!reduced) {
    for (const c of clouds) {
      c.s.position.x += c.v * dt;
      if (c.s.position.x > 240) c.s.position.x = -240;
    }
  }
}

/* 预热：同步推进 4 秒，让截图第一帧就是成型的水幕 */
function prewarm() {
  const h = 1 / 60;
  for (let s = 0; s < 240; s++) step(h);
  geo.attributes.position.needsUpdate = true;
  geo.attributes.pcolor.needsUpdate = true;
  geo.attributes.psize.needsUpdate = true;
  geo.attributes.palpha.needsUpdate = true;
}

/* ================= 主循环 ================= */
let last = performance.now();
let elapsed = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (reduced) dt *= 0.6;
  step(dt * state.timeScale);
  elapsed += dt;

  // 相机呼吸
  if (!reduced) {
    camera.position.set(
      CAM0.x + Math.sin(elapsed * 0.11) * 1.4,
      CAM0.y + Math.sin(elapsed * 0.07 + 1.2) * 0.8,
      CAM0.z + Math.cos(elapsed * 0.09) * 1.2
    );
    camera.lookAt(LOOK0);
  }

  geo.attributes.position.needsUpdate = true;
  geo.attributes.psize.needsUpdate = true;
  geo.attributes.palpha.needsUpdate = true;
  // pcolor 只在 spawn 时写；为保险每帧也同步（便宜）
  geo.attributes.pcolor.needsUpdate = true;

  refreshHUD();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ================= 启动：loader → intro 完成态 ================= */
function boot() {
  prewarm();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
  const loader = $('loader');
  // 完成态：loader 淡出 + 元素 stagger 入场
  setTimeout(() => loader.classList.add('done'), 350);
  const intros = document.querySelectorAll('[data-intro]');
  intros.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 500 + i * 130));
  // 兜底：4 秒强制完成态（完成态选择器带 html.js 前缀，已验证可达）
  setTimeout(() => {
    loader.classList.add('done');
    intros.forEach((el) => el.classList.add('is-in'));
  }, 4000);
  refreshHUD();
}
boot();
