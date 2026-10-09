// paper-plane-3d · 纸飞机飞行
// 纯程序化建模：折纸飞机（三角面片+机翼扑动）/ Catmull-Rom 环岛航线 / 粒子尾迹 / 按住拖拽投掷。
// 代码全部原创；three.js 仅作 WebGL 渲染器（vendor 本地文件）。
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const canvas = $('v'), loader = $('loader'), chargeEl = $('charge'), chargeArc = $('chargeArc');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 配色（严格三色） ----------
const PAPER = 0xF5F1E8, SKY = 0x7FB8E8, SUNSET = 0xF0974B;
const DAY = {
  skyTop: new THREE.Color(0x3F8FD4), skyHor: new THREE.Color(0xBFE0F7),
  sea: new THREE.Color(0x6FA9DD), fog: new THREE.Color(0xA9CFEF),
  sun: new THREE.Color(SUNSET), cloud: new THREE.Color(0xF5F1E8),
  dir: new THREE.Color(0xFFF3E0), dirI: 1.7, ambI: 0.55,
};
const NIGHT = {
  skyTop: new THREE.Color(0x050C1C), skyHor: new THREE.Color(0x0E2547),
  sea: new THREE.Color(0x0A1A30), fog: new THREE.Color(0x0E2547),
  sun: new THREE.Color(0xF5F1E8), cloud: new THREE.Color(0x8FA8CC),
  dir: new THREE.Color(0x9DB8E8), dirI: 0.35, ambI: 0.3,
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const damp = (cur, tgt, rate, dt) => cur + (tgt - cur) * (1 - Math.pow(rate, dt));
const lerpC = (a, b, t, out) => out.copy(a).lerp(b, t);

// ---------- 状态 ----------
const S = {
  mode: 'cruise',          // cruise | thrown | return
  t: 0, tGhost: 0, laps: 1,
  speedT: 1, speed: 1,
  nightT: 0, night: 0,
  trailT: 1, trail: 1,
  vel: new THREE.Vector3(), throwT: 0,
  ptr: { x: 0, y: 0, tx: 0, ty: 0 },
  frames: 0, ready: false, time: 0,
};

// ---------- 渲染器 ----------
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  $('noWebgl').style.display = 'flex';
  loader.classList.add('done');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(DAY.fog.getHex(), 18, 46);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 120);
camera.position.set(0, 4.2, 9);

// ---------- 灯光 ----------
const ambLight = new THREE.AmbientLight(0xFFFFFF, DAY.ambI);
scene.add(ambLight);
const dirLight = new THREE.DirectionalLight(DAY.dir.getHex(), DAY.dirI);
dirLight.position.set(-6, 10, 4);
scene.add(dirLight);

// ---------- 天空穹顶 ----------
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: {
    topColor: { value: DAY.skyTop.clone() },
    horizonColor: { value: DAY.skyHor.clone() },
  },
  vertexShader: `varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 topColor; uniform vec3 horizonColor; varying vec3 vW;
    void main(){ float h = normalize(vW).y * .5 + .5;
      vec3 c = mix(horizonColor, topColor, pow(clamp(h,0.,1.), .75));
      gl_FragColor = vec4(c, 1.0); }`,
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(60, 24, 16), skyMat));

// ---------- 海面 ----------
const seaMat = new THREE.MeshStandardMaterial({ color: DAY.sea.getHex(), roughness: 1, metalness: 0 });
const sea = new THREE.Mesh(new THREE.CircleGeometry(58, 48), seaMat);
sea.rotation.x = -Math.PI / 2; sea.position.y = -4.5;
scene.add(sea);

// ---------- 星空 ----------
const starGeo = new THREE.BufferGeometry();
{
  const n = 320, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI * 0.48 + 0.05, r = 52;
    p[i * 3] = Math.cos(a) * Math.cos(e) * r;
    p[i * 3 + 1] = Math.sin(e) * r;
    p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
}
const starMat = new THREE.PointsMaterial({ color: PAPER, size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
scene.add(new THREE.Points(starGeo, starMat));

// ---------- 太阳 / 月亮 ----------
const sunGroup = new THREE.Group();
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(1.7, 40),
  new THREE.MeshBasicMaterial({ color: DAY.sun.getHex(), fog: false }));
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.35, 'rgba(255,255,255,.28)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const glowTex = glowTexture();
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: DAY.sun.getHex(), transparent: true, opacity: 0.85, depthWrite: false, fog: false,
}));
sunGlow.scale.set(11, 11, 1);
sunGroup.add(sunDisc, sunGlow);
sunGroup.position.set(-16, 11, -30);
sunGroup.lookAt(0, 2, 0);
scene.add(sunGroup);

// ---------- 云（程序化柔边贴图） ----------
function cloudTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const blob = (x, y, r, a) => {
    const gr = g.createRadialGradient(x, y, 2, x, y, r);
    gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  };
  blob(64, 74, 52, .95); blob(40, 80, 34, .8); blob(90, 80, 36, .8); blob(64, 58, 34, .7);
  return new THREE.CanvasTexture(c);
}
const cloudTex = cloudTexture();
const cloudMat = new THREE.SpriteMaterial({ map: cloudTex, color: DAY.cloud.getHex(), transparent: true, opacity: 0.92, depthWrite: false });
const clouds = [];
for (let i = 0; i < 14; i++) {
  const sp = new THREE.Sprite(cloudMat);
  const s = 4 + Math.random() * 6;
  sp.scale.set(s, s * 0.55, 1);
  sp.position.set((Math.random() - 0.5) * 52, 1 + Math.random() * 4.5, (Math.random() - 0.5) * 52);
  sp.userData.v = 0.12 + Math.random() * 0.2;
  clouds.push(sp); scene.add(sp);
}

// ---------- 云中岛屿 ----------
const rockMat = new THREE.MeshStandardMaterial({ color: 0x9FC3E6, roughness: 0.95, flatShading: true });
const islTopMat = new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.9, flatShading: true });
const beaconMat = new THREE.MeshBasicMaterial({ color: SUNSET });
const beacons = [];
const ISLANDS = [
  { x: -8, z: -6, s: 1.6 }, { x: 6, z: -9, s: 2.0 }, { x: 11, z: 2, s: 1.4 },
  { x: -3, z: 8, s: 1.8 }, { x: -12, z: 3, s: 1.2 }, { x: 4, z: 10, s: 1.5 }, { x: 0, z: -2, s: 0.9 },
];
for (const d of ISLANDS) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.ConeGeometry(d.s, d.s * 1.5, 7), rockMat);
  base.rotation.x = Math.PI; base.position.y = -d.s * 0.55;
  g.add(base);
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(d.s * (0.42 - i * 0.08), 10, 8), islTopMat);
    b.scale.y = 0.55;
    b.position.set((i - 1) * d.s * 0.42, d.s * 0.12 + (i === 1 ? d.s * 0.16 : 0), (i % 2 ? 1 : -1) * d.s * 0.18);
    g.add(b);
  }
  const bc = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), beaconMat);
  bc.position.y = d.s * 0.5; bc.scale.setScalar(0.001);
  g.add(bc); beacons.push(bc);
  g.position.set(d.x, 0.4, d.z);
  scene.add(g);
}

// ---------- 纸飞机（折纸三角面片程序化建模） ----------
const paperMat = new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.85, metalness: 0, side: THREE.DoubleSide, flatShading: true });
const creaseMat = new THREE.LineBasicMaterial({ color: 0xCFC6B0 });
const accentMat = new THREE.MeshStandardMaterial({ color: SUNSET, roughness: 0.7, side: THREE.DoubleSide });
function triMesh(ax, ay, az, bx, by, bz, cx, cy, cz, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([ax, ay, az, bx, by, bz, cx, cy, cz]), 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
const plane = new THREE.Group();
const NOSE = [0, 0.02, 1.05], TAIL = [0, 0.02, -0.95];
// 左机翼（绕机身轴扑动）
const wingLPivot = new THREE.Group();
{
  const w = triMesh(...NOSE, -1.05, -0.12, -0.80, ...TAIL, paperMat);
  wingLPivot.add(w);
  const eg = new THREE.EdgesGeometry(w.geometry);
  wingLPivot.add(new THREE.LineSegments(eg, creaseMat));
}
const wingRPivot = new THREE.Group();
{
  const w = triMesh(...NOSE, ...TAIL, 1.05, -0.12, -0.80, paperMat);
  wingRPivot.add(w);
  const eg = new THREE.EdgesGeometry(w.geometry);
  wingRPivot.add(new THREE.LineSegments(eg, creaseMat));
}
// 中央龙骨（垂直折边）
plane.add(triMesh(...NOSE, 0, -0.32, -0.55, ...TAIL, paperMat));
// 尾翼小折角（夕阳橙点缀）
plane.add(triMesh(0, 0.02, -0.95, -0.22, 0.10, -1.12, 0, 0.02, -0.80, accentMat));
plane.add(wingLPivot, wingRPivot);
plane.scale.setScalar(0.95);
scene.add(plane);
const tailAnchor = new THREE.Object3D();
tailAnchor.position.set(0, 0, -1.0);
plane.add(tailAnchor);

// ---------- 环岛航线 ----------
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-11, 3.2, -3), new THREE.Vector3(-6, 2.6, -10),
  new THREE.Vector3(3, 3.4, -11), new THREE.Vector3(10, 2.8, -5),
  new THREE.Vector3(13, 3.2, 3), new THREE.Vector3(7, 2.4, 10),
  new THREE.Vector3(-2, 3.0, 12), new THREE.Vector3(-10, 3.4, 7),
], true, 'catmullrom', 0.6);
const curveLen = curve.getLength();
const CRUISE_V = 3.4;

// ---------- 粒子尾迹 ----------
const TRAIL_N = 160;
const tPos = new Float32Array(TRAIL_N * 3), tVel = new Float32Array(TRAIL_N * 3), tLife = new Float32Array(TRAIL_N);
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
trailGeo.setAttribute('aLife', new THREE.BufferAttribute(tLife, 1));
const trailMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uAlpha: { value: 1 } },
  vertexShader: `attribute float aLife; varying float vLife;
    void main(){ vLife = aLife;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = (1.0 + 4.5 * aLife) * (64.0 / -mv.z);
      gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform float uAlpha; varying float vLife;
    void main(){ vec2 d = gl_PointCoord - .5; float m = smoothstep(.5, .12, length(d));
      vec3 c = mix(vec3(.941,.945,.910), vec3(.941,.592,.294), 1.0 - vLife);
      gl_FragColor = vec4(c, m * vLife * .8 * uAlpha); }`,
});
const trailPts = new THREE.Points(trailGeo, trailMat);
trailPts.frustumCulled = false;
scene.add(trailPts);
let trailHead = 0;
const _tp = new THREE.Vector3();
function emitTrail(n, spread, boost) {
  tailAnchor.getWorldPosition(_tp);
  for (let k = 0; k < n; k++) {
    const i = trailHead; trailHead = (trailHead + 1) % TRAIL_N;
    tPos[i * 3] = _tp.x + (Math.random() - .5) * spread;
    tPos[i * 3 + 1] = _tp.y + (Math.random() - .5) * spread;
    tPos[i * 3 + 2] = _tp.z + (Math.random() - .5) * spread;
    tVel[i * 3] = (Math.random() - .5) * 0.4;
    tVel[i * 3 + 1] = (Math.random() - .5) * 0.4 + 0.2;
    tVel[i * 3 + 2] = (Math.random() - .5) * 0.4;
    tLife[i] = boost;
  }
}
tLife.fill(0);

// ---------- 投掷交互（Pointer Events，触屏统一） ----------
const drag = { on: false, sx: 0, sy: 0, ex: 0, ey: 0, power: 0 };
const arrowEl = document.createElement('div');
arrowEl.style.cssText = 'position:absolute;left:50%;top:50%;width:44px;height:3px;background:var(--sunset);border-radius:2px;transform-origin:0 50%;pointer-events:none';
arrowEl.innerHTML = '<span style="position:absolute;right:-2px;top:-5px;border-left:12px solid var(--sunset);border-top:6.5px solid transparent;border-bottom:6.5px solid transparent"></span>';
chargeEl.appendChild(arrowEl);
const _wr = new THREE.Vector3(), _wu = new THREE.Vector3(), _fwd = new THREE.Vector3();
function dragDirWorld() {
  camera.matrixWorld.extractBasis(_wr, _wu, _fwd);
  const dx = drag.ex - drag.sx, dy = drag.sy - drag.ey; // 屏幕上为正
  const w = new THREE.Vector3()
    .addScaledVector(_wr, dx / innerWidth * 2)
    .addScaledVector(_wu, dy / innerHeight * 2)
    .addScaledVector(_fwd, -0.45); // 带一点推离镜头的纵深
  return w.normalize();
}
canvas.addEventListener('pointerdown', (e) => {
  if (S.mode !== 'cruise') return; // 飞行中不接受新的投掷
  drag.on = true; drag.sx = drag.ex = e.clientX; drag.sy = drag.ey = e.clientY; drag.power = 0;
  chargeEl.style.left = e.clientX + 'px'; chargeEl.style.top = e.clientY + 'px';
  chargeEl.classList.add('on');
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag.on) {
    S.ptr.tx = (e.clientX / innerWidth - 0.5) * 2;
    S.ptr.ty = (e.clientY / innerHeight - 0.5) * 2;
    return;
  }
  drag.ex = e.clientX; drag.ey = e.clientY;
  drag.power = clamp(Math.hypot(drag.ex - drag.sx, drag.ey - drag.sy) / 380, 0, 1);
  chargeArc.style.strokeDashoffset = 314 * (1 - drag.power);
  const ang = Math.atan2(drag.sy - drag.ey, drag.ex - drag.sx); // 屏幕上方向
  arrowEl.style.transform = `rotate(${-ang}rad)`;
  arrowEl.style.opacity = drag.power > 0.05 ? 1 : 0;
});
function endDrag(e) {
  if (!drag.on) return;
  drag.on = false; chargeEl.classList.remove('on');
  if (drag.power < 0.08) return;
  const dir = dragDirWorld();
  S.vel.copy(dir).multiplyScalar(5 + drag.power * 13);
  S.mode = 'thrown'; S.throwT = 0;
  $('sideMode').textContent = '投掷中 · 自由飞行';
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// ---------- 控制项 ----------
$('btnFly').addEventListener('click', () => {
  S.t = 0; S.tGhost = 0; S.laps = 1; S.mode = 'cruise';
  $('sideLap').textContent = '第 1 圈';
  $('sideMode').textContent = '巡航中 · 自动航线';
});
$('segDay').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  S.nightT = +b.dataset.v;
  document.querySelectorAll('#segDay button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
});
$('btnTrail').addEventListener('click', () => {
  S.trailT = S.trailT > 0.5 ? 0 : 1;
  $('btnTrail').setAttribute('aria-pressed', S.trailT > 0.5 ? 'true' : 'false');
  $('btnTrail').textContent = S.trailT > 0.5 ? '开' : '关';
});
const SPEED_NAMES = { '0.7': '慢速', '1': '巡航', '1.5': '疾速' };
$('segSpeed').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  S.speedT = +b.dataset.v;
  $('speedName').textContent = SPEED_NAMES[b.dataset.v];
  document.querySelectorAll('#segSpeed button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
});

// ---------- 朝向（含转弯压坡） ----------
const _tan = new THREE.Vector3(), _tanPrev = new THREE.Vector3(), _up = new THREE.Vector3();
const _m = new THREE.Matrix4(), _zero = new THREE.Vector3(), _tgt = new THREE.Vector3();
function orientAlong(pos, tan, dt, bankK) {
  _up.set(0, 1, 0);
  _tgt.copy(tan).negate();
  _m.lookAt(_zero, _tgt, _up);
  plane.quaternion.setFromRotationMatrix(_m);
  // 压坡：切线变化的横向分量 → 绕前轴滚转
  const turn = _tanPrev.x * tan.z - _tanPrev.z * tan.x;
  const roll = clamp(-turn * bankK, -0.7, 0.7);
  const rollS = damp(plane.userData.roll || 0, roll, 0.02, dt);
  plane.userData.roll = rollS;
  plane.rotateZ(rollS);
  _tanPrev.copy(tan);
}

// ---------- 主循环 ----------
const clock = new THREE.Clock();
const _gp = new THREE.Vector3(), _gd = new THREE.Vector3(), _camT = new THREE.Vector3();
const _cA = new THREE.Color();

function applyDayNight(dt) {
  S.night = damp(S.night, S.nightT, 0.25, dt);
  const n = S.night;
  lerpC(DAY.skyTop, NIGHT.skyTop, n, _cA); skyMat.uniforms.topColor.value.copy(_cA);
  lerpC(DAY.skyHor, NIGHT.skyHor, n, _cA); skyMat.uniforms.horizonColor.value.copy(_cA);
  lerpC(DAY.fog, NIGHT.fog, n, _cA); scene.fog.color.copy(_cA);
  lerpC(DAY.sea, NIGHT.sea, n, _cA); seaMat.color.copy(_cA);
  lerpC(DAY.sun, NIGHT.sun, n, _cA); sunDisc.material.color.copy(_cA); sunGlow.material.color.copy(_cA);
  lerpC(DAY.cloud, NIGHT.cloud, n, _cA); cloudMat.color.copy(_cA);
  lerpC(DAY.dir, NIGHT.dir, n, _cA); dirLight.color.copy(_cA);
  dirLight.intensity = DAY.dirI + (NIGHT.dirI - DAY.dirI) * n;
  ambLight.intensity = DAY.ambI + (NIGHT.ambI - DAY.ambI) * n;
  starMat.opacity = n * 0.95;
  sunGlow.material.opacity = 0.85 - n * 0.45;
  for (const b of beacons) b.scale.setScalar(Math.max(0.001, n * 1.6));
}

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  S.time += dt;
  S.speed = damp(S.speed, S.speedT, 0.3, dt);
  S.trail = damp(S.trail, S.trailT, 0.3, dt);
  trailMat.uniforms.uAlpha.value = S.trail;

  // 幽灵航点永远按巡航速度推进（回航目标）
  const prevGhost = S.tGhost;
  S.tGhost = (S.tGhost + dt * CRUISE_V * S.speed / curveLen) % 1;

  // ---- 飞机状态机 ----
  if (S.mode === 'cruise') {
    const prev = S.t;
    S.t = S.tGhost;
    if (prev > S.t) { S.laps++; $('sideLap').textContent = `第 ${S.laps} 圈`; }
    curve.getPointAt(S.t, _gp);
    curve.getTangentAt(S.t, _tan);
    plane.position.copy(_gp);
    orientAlong(_gp, _tan, dt, 28);
    emitTrail(1, 0.10, 1);
  } else if (S.mode === 'thrown') {
    S.throwT += dt;
    S.vel.y -= 2.1 * dt;                       // 柔和重力
    S.vel.multiplyScalar(1 - 0.22 * dt);       // 空气阻尼
    plane.position.addScaledVector(S.vel, dt);
    plane.position.y = Math.max(plane.position.y, -3.2);
    if (S.vel.lengthSq() > 0.01) { _tan.copy(S.vel).normalize(); orientAlong(plane.position, _tan, dt, 6); }
    emitTrail(3, 0.16, 1);
    if (S.throwT > 4.5 || S.vel.length() < 2.2) { S.mode = 'return'; $('sideMode').textContent = '回航中 · 归位'; }
  } else { // return：转向幽灵航点
    curve.getPointAt(S.tGhost, _gp);
    _gd.subVectors(_gp, plane.position);
    const d = _gd.length();
    if (d < 0.7) {
      S.mode = 'cruise'; S.t = S.tGhost;
      $('sideMode').textContent = '巡航中 · 自动航线';
    } else {
      _tan.copy(_gd).normalize();
      plane.position.addScaledVector(_tan, Math.min(8 * dt, d));
      orientAlong(plane.position, _tan, dt, 10);
      emitTrail(1, 0.10, 1);
    }
  }

  // 机翼扑动（巡航轻颤 / 投掷急拍）
  if (!reduceMotion) {
    const amp = S.mode === 'thrown' ? 0.30 : 0.10;
    const flap = Math.sin(S.time * (S.mode === 'thrown' ? 11 : 6)) * amp;
    wingLPivot.rotation.z = flap;
    wingRPivot.rotation.z = -flap;
  }

  // 云漂移
  if (!reduceMotion) for (const c of clouds) {
    c.position.x += c.userData.v * dt;
    if (c.position.x > 28) c.position.x = -28;
  }

  // 尾迹粒子更新
  for (let i = 0; i < TRAIL_N; i++) {
    if (tLife[i] <= 0) continue;
    tLife[i] -= dt * 0.85;
    tPos[i * 3] += tVel[i * 3] * dt;
    tPos[i * 3 + 1] += tVel[i * 3 + 1] * dt;
    tPos[i * 3 + 2] += tVel[i * 3 + 2] * dt;
  }
  trailGeo.attributes.position.needsUpdate = true;
  trailGeo.attributes.aLife.needsUpdate = true;

  applyDayNight(dt);

  // 相机：跟随飞机 + 指针视差 + 缓慢环绕
  if (!reduceMotion) {
    S.ptr.x = damp(S.ptr.x, S.ptr.tx, 0.06, dt);
    S.ptr.y = damp(S.ptr.y, S.ptr.ty, 0.06, dt);
  }
  const orb = reduceMotion ? 0 : Math.sin(S.time * 0.07) * 1.2;
  _camT.set(
    plane.position.x + 2.6 + orb + S.ptr.x * 1.4,
    plane.position.y + 1.7 - S.ptr.y * 0.9,
    plane.position.z + 7.2
  );
  camera.position.x = damp(camera.position.x, _camT.x, 0.12, dt);
  camera.position.y = damp(camera.position.y, _camT.y, 0.12, dt);
  camera.position.z = damp(camera.position.z, _camT.z, 0.12, dt);
  camera.lookAt(plane.position.x, plane.position.y + 0.3, plane.position.z);

  renderer.render(scene, camera);

  // 完成态：首帧渲染 10 帧后 loader 淡出、data-intro 浮现
  if (++S.frames === 10) finishIntro();
}

function finishIntro() {
  if (S.ready) return;
  S.ready = true;
  loader.classList.add('done');
  document.querySelectorAll('[data-intro]').forEach((el) => el.classList.add('is-in'));
}
// 3.5–4s 超时兜底：资源再慢也强制进入完成态
setTimeout(finishIntro, 3800);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

curve.getPointAt(0, _gp);
plane.position.copy(_gp);
curve.getTangentAt(0, _tanPrev);
tick();
