/* crystal-cave-3d · 水晶洞穴漫游
 * 程序化环形洞穴 + 发光水晶簇，自动巡航 + 滚动加速 + 点击聚焦
 * 配色全页 3 色：#0D0716 / #A78BFA / #BFE9FF
 */
import * as THREE from 'three';

/* ---------- 确定性随机 ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261009);

/* ---------- 配置 ---------- */
const D = {
  BG: 0x0d0716,
  VIOLET: 0xa78bfa,
  ICE: 0xbfe9ff,
  TUBE_R: 9,          // 隧道半径
  CTRL_PTS: 12,       // 环路控制点数
  RING_R: 58,         // 环路半径
  CLUSTER_EVERY: 8,   // 水晶簇间隔（米）
  BASE_SPEED: 0.0038, // 巡航基速（t/秒）
  FOG_D: 0.02,        // 雾浓度
  LIGHT_EVERY: 8,     // 每 N 个簇一盏真实点光源
};
const GLOW_MODES = {
  violet: { name: '紫晶光', color: D.VIOLET, rock: 0x241a3f },
  ice:    { name: '冰蓝光', color: D.ICE,    rock: 0x14283f },
  mixed:  { name: '双色混光', color: null,   rock: null }, // 簇按奇偶取色
};
let glowMode = 'violet';

/* ---------- 渲染器 / 场景 ---------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(D.BG);
scene.fog = new THREE.FogExp2(D.BG, D.FOG_D);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 400);

/* ---------- 环形洞穴路径 ---------- */
const ctrlPts = [];
for (let i = 0; i < D.CTRL_PTS; i++) {
  const a = (i / D.CTRL_PTS) * Math.PI * 2;
  const r = D.RING_R * (0.92 + rnd() * 0.16);
  ctrlPts.push(new THREE.Vector3(
    Math.cos(a) * r,
    (rnd() - 0.5) * 14,
    Math.sin(a) * r
  ));
}
const curve = new THREE.CatmullRomCurve3(ctrlPts, true, 'catmullrom', 0.6);
const TRACK_LEN = curve.getLength();

/* 隧道壁 */
{
  const geo = new THREE.TubeGeometry(curve, 240, D.TUBE_R, 22, true);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x150c24, roughness: 0.95, metalness: 0.05, side: THREE.BackSide,
  });
  scene.add(new THREE.Mesh(geo, mat));
}

/* 壁面岩石点缀 */
{
  const rockGeo = new THREE.IcosahedronGeometry(1, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x100a1c, roughness: 1, metalness: 0 });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 90);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 90; i++) {
    const t = rnd();
    const c = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const n1 = new THREE.Vector3().crossVectors(tan, up).normalize();
    const n2 = new THREE.Vector3().crossVectors(tan, n1).normalize();
    const ang = rnd() * Math.PI * 2;
    const dir = n1.clone().multiplyScalar(Math.cos(ang)).add(n2.clone().multiplyScalar(Math.sin(ang)));
    p.copy(c).addScaledVector(dir, D.TUBE_R * 0.88);
    e.set(rnd() * 3, rnd() * 3, rnd() * 3); q.setFromEuler(e);
    const k = 0.8 + rnd() * 2.2;
    s.set(k * (0.7 + rnd() * 0.6), k * (0.5 + rnd() * 0.5), k * (0.7 + rnd() * 0.6));
    m.compose(p, q, s);
    rocks.setMatrixAt(i, m);
  }
  scene.add(rocks);
}

/* ---------- 灯光 ---------- */
scene.add(new THREE.AmbientLight(0x2a1a4d, 0.85));
scene.add(new THREE.HemisphereLight(0x241a45, D.BG, 0.5));
const headLamp = new THREE.PointLight(D.ICE, 9, 46, 1.8); // 相机前灯，保证近处可见
scene.add(headLamp);

/* ---------- 光晕纹理 ---------- */
function glowTexture(hex) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const col = '#' + hex.toString(16).padStart(6, '0');
  const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.16, col); // 白热核心收紧，光晕主体为发光色
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const TEX = { violet: glowTexture(D.VIOLET), ice: glowTexture(D.ICE) };

/* ---------- 水晶簇 ---------- */
const clusters = [];   // {t, pos, dir, group, mat, sprite, light?, phase, h, name}
const clickTargets = [];
const upV = new THREE.Vector3(0, 1, 0);

function clusterColor(i) {
  if (glowMode === 'ice') return D.ICE;
  if (glowMode === 'violet') return D.VIOLET;
  return i % 2 === 0 ? D.VIOLET : D.ICE;
}
function clusterRock(i) {
  const c = clusterColor(i);
  return c === D.VIOLET ? 0x241a3f : 0x14283f;
}

const NAMES_V = ['紫晶簇', '星芒紫晶', '深渊晶', '雾紫晶'];
const NAMES_I = ['冰晶簇', '霜晶', '寒晶', '霓冰晶'];
const NOTES = [
  '它在这里长了上亿年，只为等你路过。',
  '洞穴越深，晶体越大——压力是最好的雕刻师。',
  '每一道棱面，都是一次地质年代的停顿。',
  '别碰，体温会在晶面上留下痕迹。',
  '光从裂缝里渗进来，被它留在了身体里。',
];

function makePrism(r, h, mat) {
  // 六棱柱 + 晶尖
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r, h, 6), mat);
  shaft.position.y = h / 2;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 0.62, h * 0.42, 6), mat);
  tip.position.y = h + h * 0.21;
  g.add(shaft, tip);
  return g;
}

function buildCluster(i, t) {
  const c = curve.getPointAt(t);
  const tan = curve.getTangentAt(t);
  const n1 = new THREE.Vector3().crossVectors(tan, upV).normalize();
  if (n1.lengthSq() < 0.01) n1.set(1, 0, 0);
  const n2 = new THREE.Vector3().crossVectors(tan, n1).normalize();
  const ang = rnd() * Math.PI * 2;
  const dir = n1.clone().multiplyScalar(Math.cos(ang)).addScaledVector(n2, Math.sin(ang)).normalize();
  const pos = c.clone().addScaledVector(dir, D.TUBE_R * 0.74);
  const toCenter = dir.clone().negate(); // 生长方向：壁 -> 洞穴中心

  const group = new THREE.Group();
  group.position.copy(pos);
  group.quaternion.setFromUnitVectors(upV, toCenter);
  group.rotateY(rnd() * Math.PI * 2);

  const col = clusterColor(i);
  const mat = new THREE.MeshStandardMaterial({
    color: clusterRock(i), emissive: col, emissiveIntensity: 1.15,
    roughness: 0.22, metalness: 0.35, transparent: true, opacity: 0.96,
  });

  const mainH = 2.4 + rnd() * 2.0;
  const mainR = 0.5 + rnd() * 0.35;
  const main = makePrism(mainR, mainH, mat);
  main.rotation.y = rnd() * Math.PI;
  main.children.forEach(m => { m.userData.ci = i; clickTargets.push(m); });
  group.add(main);

  const smallN = 2 + Math.floor(rnd() * 4);
  for (let s = 0; s < smallN; s++) {
    const sh = 0.7 + rnd() * 1.3, sr = 0.22 + rnd() * 0.25;
    let sm;
    if (rnd() < 0.5) {
      sm = makePrism(sr, sh, mat);
    } else {
      sm = new THREE.Mesh(new THREE.OctahedronGeometry(sr * 1.6), mat);
      sm.scale.y = 2.1; sm.position.y = sh * 0.9;
    }
    const a = rnd() * Math.PI * 2, rr = mainR * (1.2 + rnd() * 1.6);
    sm.position.x = Math.cos(a) * rr;
    sm.position.z = Math.sin(a) * rr;
    if (sm.isGroup) sm.position.y = 0;
    sm.rotation.y = rnd() * Math.PI;
    sm.rotation.z = (rnd() - 0.5) * 0.5;
    sm.traverse(o => { if (o.isMesh) { o.userData.ci = i; clickTargets.push(o); } });
    group.add(sm);
  }

  // 底座岩块
  const base = new THREE.Mesh(
    new THREE.IcosahedronGeometry(mainR * 2.4, 0),
    new THREE.MeshStandardMaterial({ color: 0x100a1c, roughness: 1 })
  );
  base.scale.y = 0.45;
  group.add(base);

  scene.add(group);

  // 光晕
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({
    map: col === D.VIOLET ? TEX.violet : TEX.ice,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55,
  }));
  spr.position.copy(pos).addScaledVector(toCenter, mainH * 0.55);
  spr.scale.setScalar(mainH * 3.4);
  scene.add(spr);

  const names = col === D.VIOLET ? NAMES_V : NAMES_I;
  const cl = {
    i, t, pos, toCenter, group, mat, sprite: spr, light: null,
    phase: rnd() * Math.PI * 2, h: mainH,
    name: names[Math.floor(rnd() * names.length)],
    note: NOTES[Math.floor(rnd() * NOTES.length)],
    depth: Math.round(t * TRACK_LEN),
  };
  clusters.push(cl);
  return cl;
}

{
  const n = Math.floor(TRACK_LEN / D.CLUSTER_EVERY);
  for (let i = 0; i < n; i++) buildCluster(i, (i + 0.5) / n);
  // 真实点光源：每 LIGHT_EVERY 个簇一盏
  clusters.forEach((cl, i) => {
    if (i % D.LIGHT_EVERY === 0) {
      const l = new THREE.PointLight(clusterColor(i), 42, 34, 2);
      l.position.copy(cl.pos).addScaledVector(cl.toCenter, 2.5);
      scene.add(l);
      cl.light = l;
    }
  });
}

/* 尘埃粒子 */
let dust;
{
  const N = 340;
  const posArr = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = rnd();
    const c = curve.getPointAt(t);
    posArr[i * 3] = c.x + (rnd() - 0.5) * D.TUBE_R * 1.4;
    posArr[i * 3 + 1] = c.y + (rnd() - 0.5) * D.TUBE_R * 1.4;
    posArr[i * 3 + 2] = c.z + (rnd() - 0.5) * D.TUBE_R * 1.4;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  dust = new THREE.Points(g, new THREE.PointsMaterial({
    color: D.ICE, size: 0.13, transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(dust);
}

/* ---------- 状态 / 交互 ---------- */
const ui = {
  speed: document.getElementById('speed'),
  speedVal: document.getElementById('speed-val'),
  segBtns: [...document.querySelectorAll('.seg-btn')],
  state: document.getElementById('state'),
  depth: document.getElementById('depth'),
  info: document.getElementById('info'),
  infoTitle: document.getElementById('info-title'),
  infoMeta: document.getElementById('info-meta'),
  infoNote: document.getElementById('info-note'),
  infoClose: document.getElementById('info-close'),
};
let sliderK = parseFloat(ui.speed.value); // 0.2 - 3
let boost = 1;                            // 滚轮加速倍率，指数衰减回 1
let travelT = 0;                          // 巡航参数
let distM = 0;
let yaw = 0, pitch = 0;                   // 拖拽视角偏移
let focus = null;                         // 聚焦中的簇
let focusK = 0;                           // 0 巡航 / 1 聚焦（smootherstep 过渡）
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion) sliderK = Math.min(sliderK, 0.6);

ui.speed.addEventListener('input', () => {
  sliderK = parseFloat(ui.speed.value);
  ui.speedVal.textContent = sliderK.toFixed(1) + '×';
});
ui.speedVal.textContent = sliderK.toFixed(1) + '×';

function applyGlowMode(mode) {
  glowMode = mode;
  ui.segBtns.forEach(b => b.classList.toggle('on', b.dataset.glow === mode));
  clusters.forEach((cl, i) => {
    const col = clusterColor(i);
    cl.mat.emissive.setHex(col);
    cl.mat.color.setHex(col === D.VIOLET ? 0x241a3f : 0x14283f);
    cl.sprite.material.map = col === D.VIOLET ? TEX.violet : TEX.ice;
    cl.sprite.material.needsUpdate = true;
    if (cl.light) cl.light.color.setHex(col);
  });
  headLamp.color.setHex(mode === 'ice' ? D.ICE : D.VIOLET);
}
ui.segBtns.forEach(b => b.addEventListener('click', () => applyGlowMode(b.dataset.glow)));

/* 滚轮加速 */
window.addEventListener('wheel', (e) => {
  if (focus) return;
  boost = Math.min(4, Math.max(0.4, boost + (e.deltaY > 0 ? 0.55 : -0.4)));
}, { passive: true });

/* 拖拽视角 + 点击聚焦（pointer 统一处理，移动端可点） */
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
let pDown = null;
canvas.addEventListener('pointerdown', (e) => {
  // ox/oy 记录按下原点（点击判定用），x/y 随拖拽更新（视角增量用）
  pDown = { x: e.clientX, y: e.clientY, ox: e.clientX, oy: e.clientY, t: performance.now() };
});
window.addEventListener('pointercancel', () => { pDown = null; });
window.addEventListener('pointermove', (e) => {
  if (!pDown || focus) return;
  const dx = e.clientX - pDown.x, dy = e.clientY - pDown.y;
  if (Math.hypot(dx, dy) > 12) { // 拖拽：调视角
    yaw = THREE.MathUtils.clamp(yaw - dx * 0.0016, -0.55, 0.55);
    pitch = THREE.MathUtils.clamp(pitch - dy * 0.0013, -0.32, 0.32);
    pDown.x = e.clientX; pDown.y = e.clientY;
  }
});
window.addEventListener('pointerup', (e) => {
  if (!pDown) return;
  const moved = Math.hypot(e.clientX - pDown.ox, e.clientY - pDown.oy); // 相对按下原点
  const dt = performance.now() - pDown.t;
  pDown = null;
  if (moved > 12 || dt > 450) return; // 拖拽/长按不算点击
  if (e.target !== canvas) return;
  ptr.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(clickTargets, false)[0];
  if (hit) enterFocus(clusters[hit.object.userData.ci]);
  else if (focus) exitFocus();
});

function enterFocus(cl) {
  focus = cl;
  ui.state.textContent = '聚焦中';
  ui.infoTitle.textContent = `第 ${cl.i + 1} 窟 · ${cl.name}`;
  ui.infoMeta.textContent = `主晶 ${cl.h.toFixed(1)} 米 · 六方晶系 · 莫氏硬度 7 · 洞穴 ${cl.depth} 米处`;
  ui.infoNote.textContent = cl.note;
  ui.info.classList.add('show');
  ui.info.setAttribute('aria-hidden', 'false');
}
function exitFocus() {
  if (!focus) return;
  travelT = (focus.t + 0.004) % 1; // 从聚焦处继续巡航
  focus = null;
  ui.state.textContent = '巡航中';
  ui.info.classList.remove('show');
  ui.info.setAttribute('aria-hidden', 'true');
}
ui.infoClose.addEventListener('click', exitFocus);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') exitFocus(); });

/* ---------- 相机 ---------- */
const camPos = new THREE.Vector3(), lookPt = new THREE.Vector3();
const focusPos = new THREE.Vector3(), focusLook = new THREE.Vector3();
const smoother = (x) => x * x * x * (x * (x * 6 - 15) + 10);
const dampK = (k, dt) => 1 - Math.exp(-dt * k);

function updateCamera(dt) {
  // focusK 过渡
  const target = focus ? 1 : 0;
  focusK += (target - focusK) * dampK(3.2, dt);
  if (Math.abs(target - focusK) < 0.002) focusK = target;
  const fk = smoother(THREE.MathUtils.clamp(focusK, 0, 1));

  if (!focus || fk < 1) {
    // 巡航推进
    const effK = sliderK * boost * (reduceMotion ? 0.4 : 1);
    travelT = (travelT + D.BASE_SPEED * effK * dt) % 1;
    distM += D.BASE_SPEED * effK * dt * TRACK_LEN;
    boost += (1 - boost) * dampK(0.9, dt);
    yaw += (0 - yaw) * dampK(0.7, dt);   // 视角缓慢回正
    pitch += (0 - pitch) * dampK(0.7, dt);
  }
  curve.getPointAt(travelT, camPos);
  curve.getPointAt((travelT + 0.022) % 1, lookPt);
  // 拖拽视角偏移：绕相机右轴/上轴旋转 lookPt
  const off = lookPt.clone().sub(camPos);
  const qy = new THREE.Quaternion().setFromAxisAngle(upV, yaw);
  off.applyQuaternion(qy);
  const right = new THREE.Vector3().crossVectors(off, upV).normalize();
  off.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(right, pitch));
  lookPt.copy(camPos).add(off);

  if (focus) {
    focusPos.copy(focus.pos).addScaledVector(focus.toCenter, 6.4).add(new THREE.Vector3(0, 2.0, 0));
    focusLook.copy(focus.pos).addScaledVector(focus.toCenter, focus.h * 0.4);
    camPos.lerp(focusPos, fk);
    lookPt.lerp(focusLook, fk);
  }
  camera.position.copy(camPos);
  camera.lookAt(lookPt);
  headLamp.position.copy(camPos);
}

/* ---------- 主循环 ---------- */
const clock = new THREE.Clock();
let firstFrame = true;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 水晶呼吸闪烁
  for (const cl of clusters) {
    const br = 0.92 + Math.sin(t * 1.35 + cl.phase) * 0.3 + Math.sin(t * 3.9 + cl.phase * 2.1) * 0.1;
    cl.mat.emissiveIntensity = br;
    cl.sprite.material.opacity = 0.26 + br * 0.1;
    const s = cl.h * (2.3 + Math.sin(t * 1.35 + cl.phase) * 0.35);
    cl.sprite.scale.set(s, s, 1);
    if (cl.light) cl.light.intensity = 30 + br * 14;
  }
  dust.material.opacity = 0.34 + Math.sin(t * 0.8) * 0.12;
  dust.position.y = Math.sin(t * 0.35) * 0.6;

  updateCamera(dt);

  // HUD（速度值由滑杆 input 事件维护；加速时状态栏提示）
  ui.depth.textContent = String(Math.floor(distM)).padStart(5, '0') + ' m';
  ui.state.textContent = focus ? '聚焦中' : (boost > 1.25 ? '加速巡航' : '巡航中');

  renderer.render(scene, camera);

  if (firstFrame) {
    firstFrame = false;
    setTimeout(() => document.body.classList.add('ready'), 550); // 首帧 + 550ms 进完成态
  }
}
tick();
setTimeout(() => document.body.classList.add('ready'), 3000); // 3s 兜底

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
