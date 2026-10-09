// robot-arm-3d · 程序化三节机械臂 + 双连杆解析 IK + 抓取状态机
// 全原创：无物理库，自研 IK；配色严格三色 #101014 / #f97316 / #e7e5e4
import * as THREE from 'three';

const INK = 0x101014, ORG = 0xf97316, RICE = 0xe7e5e4;
const L1 = 1.6, L2 = 1.4, SH_H = 1.0, PLANE_Y = 1.15;
const RMAX = L1 + L2 - 0.12, RMIN = 0.55;
const CUBE_HALF = 0.17;
const CUBE_HOME = new THREE.Vector3(1.7, 1.15, 0.6);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 缓动（全部物理感，无 linear） ---------- */
const clamp01 = t => Math.min(1, Math.max(0, t));
const easeInOutCubic = t => { t = clamp01(t); return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; };
const easeOutExpo = t => { t = clamp01(t); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
const easeOutBack = t => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const dampAngle = (a, b, k, dt) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * (1 - Math.exp(-k * dt));
};

/* ---------- 渲染器 / 场景 / 相机 ---------- */
const bg = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
bg.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(INK);
scene.fog = new THREE.Fog(INK, 11, 24);

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 60);
const CAM_POS = new THREE.Vector3(4.8, 3.1, 5.8);
const CAM_TGT = new THREE.Vector3(0.2, 1.05, 0);
if (innerWidth / innerHeight < 0.8) { CAM_POS.multiplyScalar(1.38); CAM_TGT.set(0.1, 1.25, 0); }
camera.position.copy(CAM_POS);
camera.lookAt(CAM_TGT);

/* ---------- 灯光 ---------- */
scene.add(new THREE.HemisphereLight(RICE, INK, 0.5));
const key = new THREE.DirectionalLight(RICE, 1.7);
key.position.set(4, 7, 3);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -5; key.shadow.camera.right = 5;
key.shadow.camera.top = 6; key.shadow.camera.bottom = -3;
key.shadow.camera.far = 20;
key.shadow.bias = -0.0004;
scene.add(key);
const rim = new THREE.PointLight(ORG, 14, 14, 2);
rim.position.set(-4.2, 2.6, -3.2);
scene.add(rim);
const fill = new THREE.PointLight(RICE, 3, 10, 2);
fill.position.set(1.5, 2.2, 4.5);
scene.add(fill);

/* ---------- 材质 ---------- */
const M = {
  rice: new THREE.MeshStandardMaterial({ color: RICE, roughness: 0.42, metalness: 0.35 }),
  riceFlat: new THREE.MeshStandardMaterial({ color: RICE, roughness: 0.7, metalness: 0.1 }),
  org: new THREE.MeshStandardMaterial({ color: ORG, roughness: 0.38, metalness: 0.3, emissive: 0x2a0e00 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x1b1b21, roughness: 0.55, metalness: 0.6 }),
  ground: new THREE.MeshStandardMaterial({ color: INK, roughness: 0.95, metalness: 0 }),
};

function mesh(geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = shadow;
  return m;
}

/* ---------- 地面：暗盘 + 极坐标网格 + 橙色定位环 ---------- */
const ground = mesh(new THREE.CircleGeometry(7, 72), M.ground, 0, 0, 0, false);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const polar = new THREE.PolarGridHelper(6.4, 12, 7, 72, RICE, RICE);
polar.position.y = 0.005;
polar.material.transparent = true;
polar.material.opacity = 0.10;
scene.add(polar);
const baseRing = mesh(new THREE.TorusGeometry(0.95, 0.012, 10, 90), M.org, 0, 0.012, 0, false);
baseRing.rotation.x = Math.PI / 2;
scene.add(baseRing);

/* ---------- 机械臂（程序化建模） ---------- */
const armRoot = new THREE.Group();
scene.add(armRoot);

// 静态底座
armRoot.add(mesh(new THREE.CylinderGeometry(0.62, 0.78, 0.28, 40), M.dark, 0, 0.14, 0));
const baseTrim = mesh(new THREE.TorusGeometry(0.62, 0.028, 10, 60), M.org, 0, 0.30, 0);
baseTrim.rotation.x = Math.PI / 2;
armRoot.add(baseTrim);

// 底座 yaw 转台
const yawG = new THREE.Group();
yawG.position.y = 0.30;
armRoot.add(yawG);
yawG.add(mesh(new THREE.CylinderGeometry(0.44, 0.52, 0.42, 36), M.rice, 0, 0.21, 0));
const turretTrim = mesh(new THREE.TorusGeometry(0.45, 0.022, 10, 60), M.org, 0, 0.40, 0);
turretTrim.rotation.x = Math.PI / 2;
yawG.add(turretTrim);
const shoulderHousing = mesh(new THREE.BoxGeometry(0.5, 0.5, 0.62), M.rice, 0, 0.52, 0);
yawG.add(shoulderHousing);
const shAxle = mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.66, 28), M.dark, 0, 0.52, 0);
shAxle.rotation.x = Math.PI / 2;
yawG.add(shAxle);

// 肩关节（连杆1起点）
const shG = new THREE.Group();
shG.position.set(0, 0.70, 0); // = SH_H（相对 yawG）
yawG.add(shG);
const shDisc = mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.70, 28), M.org, 0, 0, 0);
shDisc.rotation.x = Math.PI / 2;
shG.add(shDisc);
// 连杆1：锥形臂 + 活塞细节
const link1 = mesh(new THREE.CylinderGeometry(0.13, 0.19, L1, 24), M.rice, L1 / 2, 0, 0);
link1.rotation.z = -Math.PI / 2;
shG.add(link1);
const piston = mesh(new THREE.CylinderGeometry(0.045, 0.045, L1 * 0.55, 12), M.dark, L1 * 0.52, 0.20, 0);
piston.rotation.z = -Math.PI / 2;
shG.add(piston);
shG.add(mesh(new THREE.BoxGeometry(0.10, 0.34, 0.10), M.dark, L1 * 0.30, 0.13, 0));

// 肘关节（连杆2起点）
const elG = new THREE.Group();
elG.position.set(L1, 0, 0);
shG.add(elG);
const elDisc = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.56, 24), M.org, 0, 0, 0);
elDisc.rotation.x = Math.PI / 2;
elG.add(elDisc);
// 连杆2
const link2 = mesh(new THREE.CylinderGeometry(0.09, 0.14, L2, 20), M.rice, L2 / 2, 0, 0);
link2.rotation.z = -Math.PI / 2;
elG.add(link2);
elG.add(mesh(new THREE.BoxGeometry(L2 * 0.4, 0.05, 0.16), M.org, L2 * 0.45, 0.11, 0));

// 腕 + 夹爪（保持水平）
const wrG = new THREE.Group();
wrG.position.set(L2, 0, 0);
elG.add(wrG);
const wrDisc = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.30, 20), M.dark, 0, 0, 0);
wrDisc.rotation.x = Math.PI / 2;
wrG.add(wrDisc);
const palm = mesh(new THREE.BoxGeometry(0.26, 0.14, 0.30), M.rice, 0, -0.13, 0);
wrG.add(palm);
const fingerGeoL = new THREE.BoxGeometry(0.07, 0.34, 0.10);
const tipGeo = new THREE.BoxGeometry(0.07, 0.10, 0.10);
function makeFinger(side) {
  const g = new THREE.Group();
  g.position.set(0.10 * side, -0.20, 0);
  const f = mesh(fingerGeoL, M.rice, 0, -0.17, 0);
  const tip = mesh(tipGeo, M.org, 0, -0.36, 0);
  g.add(f, tip);
  return g;
}
const fingerL = makeFinger(-1), fingerR = makeFinger(1);
wrG.add(fingerL, fingerR);

armRoot.traverse(o => { if (o.isMesh) o.castShadow = true; });

/* ---------- 悬浮立方体 ---------- */
const cube = new THREE.Group();
const cubeBody = mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), M.org, 0, 0, 0);
const cubeEdge = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(0.345, 0.345, 0.345)),
  new THREE.LineBasicMaterial({ color: RICE, transparent: true, opacity: 0.55 })
);
cube.add(cubeBody, cubeEdge);
cube.position.copy(CUBE_HOME);
scene.add(cube);

/* ---------- 目标标记：平面脉冲环 + 垂线 ---------- */
const marker = mesh(new THREE.RingGeometry(0.13, 0.175, 48), new THREE.MeshBasicMaterial({
  color: ORG, transparent: true, opacity: 0.85, side: THREE.DoubleSide,
}), 0, PLANE_Y, 0, false);
marker.rotation.x = -Math.PI / 2;
scene.add(marker);
const dropLineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const dropLine = new THREE.Line(dropLineGeo, new THREE.LineBasicMaterial({ color: ORG, transparent: true, opacity: 0.30 }));
scene.add(dropLine);

/* ---------- 双连杆解析 IK（肘上解） ---------- */
function solveIK(tx, ty, tz) {
  let dx = Math.hypot(tx, tz), dy = ty - SH_H;
  let D = Math.hypot(dx, dy);
  if (D > RMAX) { const s = RMAX / D; dx *= s; dy *= s; D = RMAX; }
  else if (D < RMIN) { const s = RMIN / Math.max(D, 1e-4); dx *= s; dy *= s; D = RMIN; }
  const yaw = Math.atan2(-tz, tx);
  const alpha = Math.atan2(dy, Math.max(dx, 1e-4));
  const beta = Math.acos(Math.min(1, Math.max(-1, (L1*L1 + D*D - L2*L2) / (2 * L1 * D))));
  const th1 = alpha + beta;                       // 肩：相对水平角
  const gamma = Math.acos(Math.min(1, Math.max(-1, (L1*L1 + L2*L2 - D*D) / (2 * L1 * L2))));
  const bend = Math.PI - gamma;                   // 肘：弯折角
  const th2 = th1 - bend;                         // 连杆2 世界角
  return { yaw, th1, bend, th2, r: Math.max(dx, 0.06), y: SH_H + dy };
}

/* ---------- 状态 ---------- */
const state = {
  mode: 'follow',
  yaw: 0, th1: 0.6, bend: 1.1, grip: 0, lift: 0,
  desired: new THREE.Vector3(1.7, PLANE_Y, 0.6),
  smoothed: new THREE.Vector3(1.7, PLANE_Y, 0.6),
  gripTarget: 0,
  grabHold: false, carried: false, falling: false, homing: false,
  fallVy: 0, homeT: 0, homeFrom: new THREE.Vector3(),
  mouse: new THREE.Vector2(0, 0),
  demoPhase: 0, demoT: 0, demoFrom: new THREE.Vector3(), demoTo: new THREE.Vector3(),
  carrying: false,
};

const DEMO_PHASES = [
  { name: '接近', dur: 1.4, tgt: () => v(CUBE_HOME.x, CUBE_HOME.y + 0.7, CUBE_HOME.z) },
  { name: '下降', dur: 1.0, tgt: () => v(CUBE_HOME.x, CUBE_HOME.y, CUBE_HOME.z) },
  { name: '合爪', dur: 0.55, grip: 1 },
  { name: '举升', dur: 1.3, tgt: () => v(CUBE_HOME.x, CUBE_HOME.y + 1.0, CUBE_HOME.z) },
  { name: '搬运', dur: 1.7, tgt: () => v(2.4, 2.0, -1.3) },
  { name: '松开', dur: 0.5, grip: 0 },
  { name: '复位', dur: 1.0, tgt: () => v(1.4, 1.6, 0.8) },
];
const v = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------- 交互：鼠标 → 目标平面 ---------- */
const ray = new THREE.Raycaster();
const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), -PLANE_Y);
const hitP = new THREE.Vector3();
function pointerToTarget(cx, cy) {
  state.mouse.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(state.mouse, camera);
  if (ray.ray.intersectPlane(planeY, hitP)) {
    const r = Math.hypot(hitP.x, hitP.z);
    if (r > 2.9) { hitP.x *= 2.9 / r; hitP.z *= 2.9 / r; }
    if (r < 0.25 && r > 1e-4) { hitP.x *= 0.25 / r; hitP.z *= 0.25 / r; }
    state.desired.set(hitP.x, PLANE_Y, hitP.z);
  }
}
bg.addEventListener('pointermove', e => { if (state.mode === 'follow') pointerToTarget(e.clientX, e.clientY); });
bg.addEventListener('pointerdown', e => {
  if (state.mode !== 'follow' || state.carried || state.falling) return;
  pointerToTarget(e.clientX, e.clientY);
  state.grabHold = true;
  state.gripTarget = 1;
  state.gripT = 0;
});
addEventListener('pointerup', () => {
  if (state.mode !== 'follow') return;
  if (state.grabHold || state.carried) releaseCube();
  state.grabHold = false;
  state.gripTarget = 0;
  state.gripT = 0;
});

function grabCube() {
  if (state.carried || state.falling || state.homing) return;
  const wp = new THREE.Vector3();
  wrG.getWorldPosition(wp);
  if (wp.distanceTo(cube.position) < 0.85) {
    wrG.attach(cube);
    state.carried = true;
  }
}
function releaseCube() {
  if (state.carried) {
    scene.attach(cube);
    state.carried = false;
  }
  if (!state.falling && !state.homing && !atHome()) {
    state.falling = true;
    state.fallVy = 0;
  }
  state.gripTarget = 0;
}
function atHome() {
  return cube.position.distanceTo(CUBE_HOME) < 0.05 && !state.carried;
}

/* ---------- 模式切换 ---------- */
const modeBtns = [...document.querySelectorAll('.modes button')];
function setMode(m) {
  state.mode = m;
  modeBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  state.grabHold = false; state.gripTarget = 0; state.gripT = 0;
  if (state.carried) releaseCube();
  if (m === 'grab') {
    state.demoPhase = 0; state.demoT = 0;
    state.demoFrom.copy(state.smoothed);
    state.demoTo.copy(DEMO_PHASES[0].tgt());
    state.gripTarget = 0;
  }
  hintState();
}
modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

/* ---------- 读数面板 ---------- */
const ro = {
  base: document.getElementById('ro-base'),
  sh: document.getElementById('ro-sh'),
  el: document.getElementById('ro-el'),
  gr: document.getElementById('ro-gr'),
  tg: document.getElementById('ro-tg'),
  st: document.getElementById('ro-st'),
};
const hintEl = document.querySelector('.hint');
function hintState() {
  if (state.mode === 'follow') hintEl.innerHTML = '移动鼠标<b>驱动</b>机械臂 · <b>按住</b>抓取方块 · <b>松开</b>落下';
  else if (state.mode === 'auto') hintEl.innerHTML = '自动演示中 · 切换<b>跟随</b>接管控制';
  else hintEl.innerHTML = '抓取演示中 · 切换<b>跟随</b>接管控制';
}
const fmtDeg = r => { const d = r * 180 / Math.PI; return (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1) + '°'; };
let hudT = 0;
function updateHUD(dt, sol) {
  hudT += dt;
  if (hudT < 0.08) return;
  hudT = 0;
  ro.base.textContent = fmtDeg(sol.yaw);
  ro.sh.textContent = fmtDeg(state.th1);
  ro.el.textContent = fmtDeg(state.bend);
  ro.gr.textContent = Math.round(state.grip * 100) + '%';
  ro.tg.textContent = `x ${sol.tx >= 0 ? '+' : '−'}${Math.abs(sol.tx).toFixed(1)} / z ${sol.tz >= 0 ? '+' : '−'}${Math.abs(sol.tz).toFixed(1)}`;
  ro.st.textContent =
    state.carried ? '抓取·举升' :
    state.grabHold ? '抓取中' :
    state.falling ? '落下' :
    state.homing ? '复位' :
    state.mode === 'auto' ? '自动演示' :
    state.mode === 'grab' ? '抓取演示·' + DEMO_PHASES[state.demoPhase].name : '就绪';
}

/* ---------- 主循环 ---------- */
const clock = new THREE.Clock();
let introT = 0, frames = 0, loaderDone = false;
const loader = document.getElementById('loader');
const MAXOPEN = 0.55;

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 入场：整体装配落位（easeOutExpo）
  if (introT < 1) {
    introT = Math.min(1, introT + dt / (reduced ? 0.01 : 1.15));
    const e = reduced ? 1 : easeOutExpo(introT);
    armRoot.position.y = 1.6 * (1 - e);
    yawG.rotation.y = (1 - e) * 1.2;
  }

  // 目标生成
  if (state.mode === 'auto') {
    const a = 0.45 * t;
    const rad = 1.85 + 0.45 * Math.sin(0.63 * t);
    state.desired.set(rad * Math.cos(a), PLANE_Y + 0.28 * Math.sin(0.9 * t + 1), rad * Math.sin(a));
  } else if (state.mode === 'grab') {
    const ph = DEMO_PHASES[state.demoPhase];
    state.demoT += dt;
    const k = easeInOutCubic(state.demoT / ph.dur);
    if (ph.tgt) state.desired.lerpVectors(state.demoFrom, state.demoTo, k);
    if (state.demoT >= ph.dur) {
      if (ph.name === '合爪') grabCube();
      if (ph.name === '松开') releaseCube();
      state.demoPhase = (state.demoPhase + 1) % DEMO_PHASES.length;
      state.demoT = 0;
      const nph = DEMO_PHASES[state.demoPhase];
      state.demoFrom.copy(state.desired);
      if (nph.tgt) state.demoTo.copy(nph.tgt());
      if (nph.grip !== undefined) { state.gripTarget = nph.grip; state.gripT = 0; }
    }
  }

  // 举升偏移（抓取时抬高）
  const liftWant = (state.grabHold || state.carried) ? 0.95 : 0;
  state.lift = damp(state.lift, liftWant, 5, dt);
  state.desired.y = Math.max(state.desired.y, PLANE_Y) + 0; // 基线保护
  const ty = (state.mode === 'follow' ? PLANE_Y : state.desired.y) + state.lift;

  // 目标平滑（阻尼跟随，物理感）
  state.smoothed.x = damp(state.smoothed.x, state.desired.x, 7, dt);
  state.smoothed.z = damp(state.smoothed.z, state.desired.z, 7, dt);
  state.smoothed.y = damp(state.smoothed.y, ty, 7, dt);

  // IK 解算 + 关节阻尼
  const sol = solveIK(state.smoothed.x, state.smoothed.y, state.smoothed.z);
  state.yaw = dampAngle(state.yaw, sol.yaw, 8, dt);
  state.th1 = damp(state.th1, sol.th1, 8, dt);
  state.bend = damp(state.bend, sol.bend, 8, dt);

  yawG.rotation.y = state.yaw;
  shG.rotation.z = state.th1;
  elG.rotation.z = -state.bend;
  wrG.rotation.z = -(state.th1 - state.bend); // 腕部保持水平

  // 夹爪开合：合拢用 easeOutBack 回弹
  state.gripT = (state.gripT || 0) + dt;
  const gk = state.gripTarget === 1 ? easeOutBack(state.gripT / 0.42) : easeInOutCubic(state.gripT / 0.3);
  state.grip = damp(state.grip, state.gripTarget === 1 ? Math.min(gk, 1.15) : 0, state.gripTarget === 1 ? 30 : 10, dt);
  state.grip = Math.min(1.05, Math.max(0, state.grip));
  const open = (1 - Math.min(state.grip, 1)) * MAXOPEN;
  fingerL.rotation.z = open;
  fingerR.rotation.z = -open;
  if (state.grabHold && state.grip >= 0.98 && !state.carried) grabCube();

  // 立方体：悬浮 / 携带 / 落下 / 复位
  if (state.carried) {
    cube.position.x = damp(cube.position.x, 0, 10, dt);
    cube.position.y = damp(cube.position.y, -0.34, 10, dt);
    cube.position.z = damp(cube.position.z, 0, 10, dt);
    cube.rotation.y += dt * 0.4;
  } else if (state.falling) {
    state.fallVy -= 9.8 * dt;
    cube.position.y += state.fallVy * dt;
    cube.rotation.x += dt * 2.2; cube.rotation.z += dt * 1.1;
    if (cube.position.y <= CUBE_HALF) {
      cube.position.y = CUBE_HALF;
      state.fallVy = -state.fallVy * 0.38;             // 弹性回弹
      if (Math.abs(state.fallVy) < 0.6) {
        state.falling = false; state.homing = true;
        state.homeT = 0;
        state.homeFrom.copy(cube.position);
      }
    }
  } else if (state.homing) {
    state.homeT += dt / 1.25;
    const k = easeInOutCubic(state.homeT);
    cube.position.lerpVectors(state.homeFrom, CUBE_HOME, k);
    cube.rotation.x *= (1 - k * 0.2); cube.rotation.z *= (1 - k * 0.2);
    if (state.homeT >= 1) { state.homing = false; cube.position.copy(CUBE_HOME); }
  } else {
    cube.position.set(
      CUBE_HOME.x,
      CUBE_HOME.y + 0.11 * Math.sin(t * 1.4),
      CUBE_HOME.z
    );
    cube.rotation.y += dt * 0.45;
  }

  // 目标标记
  marker.position.set(state.smoothed.x, state.smoothed.y + 0.01, state.smoothed.z);
  const mp = 1 + 0.13 * Math.sin(t * 5.2);
  marker.scale.set(mp, mp, 1);
  const lp = dropLine.geometry.attributes.position;
  lp.setXYZ(0, state.smoothed.x, 0.02, state.smoothed.z);
  lp.setXYZ(1, state.smoothed.x, state.smoothed.y, state.smoothed.z);
  lp.needsUpdate = true;

  // 相机微视差
  camera.position.set(
    CAM_POS.x + state.mouse.x * 0.35,
    CAM_POS.y + state.mouse.y * 0.22,
    CAM_POS.z
  );
  camera.lookAt(CAM_TGT);

  renderer.render(scene, camera);

  // 加载完成
  frames++;
  if (!loaderDone && frames > 4) {
    loaderDone = true;
    setTimeout(() => {
      loader.classList.add('done');
      document.documentElement.classList.add('is-in');
      setTimeout(() => loader.setAttribute('hidden', ''), 1000);
    }, reduced ? 50 : 650);
  }

  updateHUD(dt, { yaw: state.yaw, tx: state.smoothed.x, tz: state.smoothed.z });
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

tick();
