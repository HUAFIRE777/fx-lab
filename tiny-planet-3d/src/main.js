/* tiny-planet-3d — 一颗小星球 · 星球工坊
 * huafire3d fx-lab — original implementation.
 * 参考对象：Messenger（Awwwards 2026 开发者年度奖，Igloo 出品）。
 * 借鉴点仅为手法："一颗可以走上去的小星球，导航做成空间探索"。
 * 以下全部代码原创重写。 */
import * as THREE from 'three';

/* ---------------- 配置 ---------------- */
const C = {
  space: 0x0A1628,   // 深空
  sand:  0xE8D5B5,   // 沙色
  coral: 0xFF6B6B,   // 珊瑚（点缀）
  R: 30,             // 星球半径
  walkSpeed: 7,
  camDist: 8.2,
  camH: 3.4,
  touchDist: 9,      // 地标触发距离
};
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (isTouch) document.body.classList.add('touch');

/* ---------------- 小工具 ---------------- */
// 简单确定性伪噪声（地形起伏用）
function hash(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let acc = 0;
  for (let dz = 0; dz <= 1; dz++) for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) {
    const wx = dx ? u : 1 - u, wy = dy ? v : 1 - v, wz = dz ? w : 1 - w;
    acc += wx * wy * wz * hash(xi + dx, yi + dy, zi + dz);
  }
  return acc;
}
// easing：物理感
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const damp = (a, b, lambda, dt) => THREE.MathUtils.damp(a, b, lambda, dt);

const $ = id => document.getElementById(id);
const loadbar = $('loadbar');
function setProgress(p) { loadbar.style.width = Math.round(p * 100) + '%'; }

/* ---------------- 渲染器 / 场景 ---------------- */
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.25 : 2)); // 移动端降档
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(C.space);
scene.fog = new THREE.FogExp2(C.space, 0.0016);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 2000);

/* 灯光：暖阳 + 冷 rim */
const sun = new THREE.DirectionalLight(0xfff1dd, 2.2);
sun.position.set(60, 40, 20);
scene.add(sun);
scene.add(new THREE.AmbientLight(C.sand, 0.55));
const rim = new THREE.DirectionalLight(C.coral, 0.5);
rim.position.set(-50, -20, -40);
scene.add(rim);

setProgress(0.12);

/* ---------------- 星空 ---------------- */
function makeStars(count, rMin, rMax) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const sandC = new THREE.Color(C.sand), coralC = new THREE.Color(C.coral);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize()
      .multiplyScalar(rMin + Math.random() * (rMax - rMin));
    pos.set([v.x, v.y, v.z], i * 3);
    const c = Math.random() < 0.82 ? sandC : coralC;
    const b = 0.45 + Math.random() * 0.55;
    col.set([c.r * b, c.g * b, c.b * b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false,
    vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false });
  return new THREE.Points(g, m);
}
scene.add(makeStars(isTouch ? 700 : 1600, 320, 900)); // 移动端降档
setProgress(0.2);

/* ---------------- 星球 ---------------- */
const R = C.R;
const planetGroup = new THREE.Group();
scene.add(planetGroup);

const planetGeo = new THREE.SphereGeometry(R, 72, 54);
{
  const p = planetGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    const h = vnoise(n.x * 3.1, n.y * 3.1, n.z * 3.1) * 1.7
            + vnoise(n.x * 9.0, n.y * 9.0, n.z * 9.0) * 0.5;
    v.copy(n).multiplyScalar(R + h - 1.1);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  planetGeo.computeVertexNormals();
}
const planetMat = new THREE.MeshStandardMaterial({ color: C.sand, roughness: 1, metalness: 0, flatShading: true });
planetGroup.add(new THREE.Mesh(planetGeo, planetMat));

/* 大气辉光：backside 菲涅尔壳 */
const atmoMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uColor: { value: new THREE.Color(C.sand) } },
  vertexShader: `varying vec3 vN; varying vec3 vV;
    void main(){ vN = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
    void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
      gl_FragColor = vec4(uColor, f * 0.85); }`,
});
planetGroup.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.09, 48, 32), atmoMat));
setProgress(0.32);

/* 球面放置工具：dir 为单位向量 */
const _up = new THREE.Vector3();
function surfPoint(dir, lift = 0) {
  _up.copy(dir).normalize();
  return _up.clone().multiplyScalar(R + lift);
}
function orientToSurface(obj, dir) {
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
}
function randDir(avoid = [], minDot = 0.86) {
  const v = new THREE.Vector3();
  for (let tries = 0; tries < 60; tries++) {
    v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    if (avoid.every(a => v.dot(a) < minDot)) return v.clone();
  }
  return v.clone();
}

const sandMat = new THREE.MeshStandardMaterial({ color: C.sand, roughness: 0.95, flatShading: true });
const sandDark = new THREE.MeshStandardMaterial({ color: 0xC9AE85, roughness: 1, flatShading: true });
const coralMat = new THREE.MeshStandardMaterial({ color: C.coral, roughness: 0.7, flatShading: true });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x8A6B4A, roughness: 1, flatShading: true });
const waterMat = new THREE.MeshStandardMaterial({ color: 0x274b6e, roughness: 0.25, metalness: 0.35 });
const glowMat = new THREE.MeshBasicMaterial({ color: C.coral });

/* 低多边形树 */
function makeTree(s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.14 * s, 0.7 * s, 6), woodMat);
  trunk.position.y = 0.35 * s; g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry((0.85 - i * 0.22) * s, 0.75 * s, 7), sandDark);
    cone.position.y = (0.9 + i * 0.5) * s; g.add(cone);
  }
  return g;
}
/* 蘑菇屋 */
function makeMushroom(s = 1) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * s, 0.36 * s, 0.6 * s, 8), sandMat);
  stem.position.y = 0.3 * s; g.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.62 * s, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), coralMat);
  cap.position.y = 0.52 * s; g.add(cap);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.24 * s, 0.34 * s),
    new THREE.MeshBasicMaterial({ color: C.space }));
  door.position.set(0, 0.28 * s, 0.35 * s); g.add(door);
  return g;
}
/* 小路灯 */
function makeLamp(withLight = true) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 6), woodMat);
  pole.position.y = 0.8; g.add(pole);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), glowMat);
  bulb.position.y = 1.68; g.add(bulb);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8),
    new THREE.MeshBasicMaterial({ color: C.coral, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.position.y = 1.68; g.add(halo);
  if (withLight) {
    const light = new THREE.PointLight(C.coral, 6, 9, 2);
    light.position.y = 1.68; g.add(light);
  }
  return g;
}
/* 围栏 */
function makeFence(len = 3) {
  const g = new THREE.Group();
  const n = Math.max(2, Math.round(len / 0.9));
  for (let i = 0; i < n; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.7, 0.09), woodMat);
    post.position.set(-len / 2 + i * (len / (n - 1)), 0.35, 0); g.add(post);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.08), woodMat);
  rail.position.y = 0.5; g.add(rail);
  return g;
}

/* 地标锚点（固定三处，互斥） */
const LM = {
  lighthouse: new THREE.Vector3(0.3, 0.9, 0.31).normalize(),
  tree: new THREE.Vector3(-0.83, 0.42, -0.36).normalize(),
  hut: new THREE.Vector3(0.12, -0.25, 0.96).normalize(),
};
const avoid = Object.values(LM);

/* 撒景观 */
const decor = new THREE.Group();
planetGroup.add(decor);
for (let i = 0; i < 26; i++) {
  const t = makeTree(0.8 + Math.random() * 0.9);
  const d = randDir(avoid); orientToSurface(t, d); t.position.copy(surfPoint(d, 0.1));
  t.rotation.y = Math.random() * Math.PI * 2; decor.add(t);
}
for (let i = 0; i < 10; i++) {
  const m = makeMushroom(0.9 + Math.random() * 0.7);
  const d = randDir(avoid); orientToSurface(m, d); m.position.copy(surfPoint(d, 0.1));
  m.rotation.y = Math.random() * Math.PI * 2; decor.add(m);
}
for (let i = 0; i < 7; i++) {
  const l = makeLamp(isTouch ? i < 3 : true); // 移动端降档：只留 3 盏点光源
  const d = randDir(avoid); orientToSurface(l, d); l.position.copy(surfPoint(d, 0.1));
  decor.add(l);
}
for (let i = 0; i < 8; i++) {
  const f = makeFence(2 + Math.random() * 2);
  const d = randDir(avoid); orientToSurface(f, d); f.position.copy(surfPoint(d, 0.1));
  f.rotation.y = Math.random() * Math.PI * 2; decor.add(f);
}
/* 小湖 */
{
  const d = randDir(avoid, 0.8);
  const lake = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), waterMat);
  orientToSurface(lake, d);
  lake.rotateX(-Math.PI / 2);
  lake.position.copy(surfPoint(d, 0.55));
  decor.add(lake);
  const rimRing = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.16, 6, 24), sandDark);
  orientToSurface(rimRing, d);
  rimRing.rotateX(Math.PI / 2);
  rimRing.position.copy(surfPoint(d, 0.55));
  decor.add(rimRing);
}
setProgress(0.45);

/* ---------------- 三地标 ---------------- */
const landmarks = [];
function addLandmark(dir, build, info) {
  const g = build();
  orientToSurface(g, dir);
  g.position.copy(surfPoint(dir, 0.1));
  planetGroup.add(g);
  const anchor = surfPoint(dir, 4.2); // 标签投影点
  landmarks.push({ dir: dir.clone(), anchor, info, el: null, group: g });
}

/* 灯塔 */
addLandmark(LM.lighthouse, () => {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.7, 10), sandDark);
  base.position.y = 0.35; g.add(base);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.0, 3.4, 10), sandMat);
  tower.position.y = 2.4; g.add(tower);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.86 - i * 0.09, 0.14, 8, 16), coralMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = 1.5 + i * 0.95; g.add(ring);
  }
  const room = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.7, 8),
    new THREE.MeshBasicMaterial({ color: C.coral }));
  room.position.y = 4.4; g.add(room);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.7, 8), woodMat);
  roof.position.y = 5.05; g.add(roof);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 7, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: C.coral, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.rotation.z = Math.PI / 2; beam.position.set(3.5, 4.4, 0); g.add(beam);
  g.userData.beam = beam;
  const lamp = new THREE.PointLight(C.coral, 14, 22, 2); lamp.position.y = 4.4; g.add(lamp);
  return g;
}, { tag: '关于我们', title: '灯塔 · 关于我们',
  body: '我们是星球工坊，一间小小的独立游戏工作室。喜欢把宇宙做得温柔一点，再请你上来走走。',
  list: ['成立于一个失眠的夜晚', '成员四人，加一只猫', '相信小而美的世界'] });

/* 大树 */
addLandmark(LM.tree, () => {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 2.4, 8), woodMat);
  trunk.position.y = 1.2; g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6 - i * 0.5, 1.7, 9), sandDark);
    cone.position.y = 2.9 + i * 1.15; g.add(cone);
  }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.34), coralMat);
  star.position.y = 7.6; g.add(star); g.userData.star = star;
  return g;
}, { tag: '作品', title: '大树 · 我们的作品',
  body: '树上挂着的，都是我们亲手种下的小世界。每一款都小而完整，像这颗星球一样。',
  list: ['《纸飞机邮局》—— 慢节奏送信小品', '《苔藓电台》—— 给植物听的音乐', '《晚安灯塔》—— 哄你入睡的灯'] });

/* 小屋 */
addLandmark(LM.hut, () => {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 1.9), sandMat);
  body.position.y = 0.75; g.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.1, 4), coralMat);
  roof.position.y = 2.05; roof.rotation.y = Math.PI / 4; g.add(roof);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.95),
    new THREE.MeshBasicMaterial({ color: C.space }));
  door.position.set(0, 0.55, 0.96); g.add(door);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5),
    new THREE.MeshBasicMaterial({ color: C.coral }));
  win.position.set(0.65, 1.0, 0.96); g.add(win);
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 6), woodMat);
  chimney.position.set(-0.6, 2.3, -0.3); g.add(chimney);
  const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8),
    new THREE.MeshBasicMaterial({ color: C.sand, transparent: true, opacity: 0.5 }));
  smoke.position.set(-0.6, 2.9, -0.3); g.add(smoke); g.userData.smoke = smoke;
  return g;
}, { tag: '联系方式', title: '小屋 · 联系我们',
  body: '小屋的门 always 虚掩着。想聊聊你的小星球，或者只是想说声你好，都欢迎。',
  list: ['写信：你好，星球工坊', '来访：每周三下午，灯塔下见', '合作：小而美的想法优先'] });
setProgress(0.6);

/* ---------------- 宇航员 ---------------- */
const astro = new THREE.Group();
{
  const suit = new THREE.MeshStandardMaterial({ color: C.sand, roughness: 0.55, flatShading: true });
  const accent = new THREE.MeshStandardMaterial({ color: C.coral, roughness: 0.6, flatShading: true });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 6, 12), suit);
  body.position.y = 0.75; astro.add(body);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.07, 8, 16), accent);
  belt.rotation.x = Math.PI / 2; belt.position.y = 0.62; astro.add(belt);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.26), accent);
  pack.position.set(0, 0.95, -0.4); astro.add(pack);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), suit);
  helmet.position.y = 1.5; astro.add(helmet);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12),
    new THREE.MeshStandardMaterial({ color: C.space, roughness: 0.15, metalness: 0.6 }));
  visor.position.set(0, 1.5, 0.17); visor.scale.set(1, 0.75, 0.55); astro.add(visor);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), suit);
  antenna.position.set(0.2, 1.85, 0); astro.add(antenna);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), glowMat);
  tip.position.set(0.2, 2.06, 0); astro.add(tip);
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.34, 4, 8), suit);
  legL.position.set(-0.18, 0.26, 0); astro.add(legL);
  const legR = legL.clone(); legR.position.x = 0.18; astro.add(legR);
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.34, 4, 8), suit);
  armL.position.set(-0.44, 0.95, 0); armL.rotation.z = 0.25; astro.add(armL);
  const armR = armL.clone(); armR.position.x = 0.44; armR.rotation.z = -0.25; astro.add(armR);
}
const astroPos = new THREE.Vector3(0.5, 0.25, 0.83).normalize().multiplyScalar(R);
const astroQuat = new THREE.Quaternion();
const _m = new THREE.Matrix4();
function astroFrame(forwardHint) {
  const up = astroPos.clone().normalize();
  const fwd = forwardHint ? forwardHint.clone() : new THREE.Vector3(0, 0, 1);
  fwd.sub(up.clone().multiplyScalar(fwd.dot(up))); // 投影到切平面
  if (fwd.lengthSq() < 1e-8) fwd.set(1, 0, 0).sub(up.clone().multiplyScalar(up.x));
  fwd.normalize();
  // 右手系基：x=up×fwd, y=up, z=fwd（面罩在本地 +Z，朝向 fwd）
  const xAxis = new THREE.Vector3().crossVectors(up, fwd).normalize();
  _m.makeBasis(xAxis, up, fwd);
  // 屏幕右（移动映射用）：D 键 / 摇杆右推 = 视线右方
  const right = new THREE.Vector3().crossVectors(fwd, up).normalize();
  return { up, right, quat: new THREE.Quaternion().setFromRotationMatrix(_m), fwd };
}
{
  const fr = astroFrame();
  astroQuat.copy(fr.quat);
  astro.quaternion.copy(astroQuat);
  astro.position.copy(astroPos);
}
scene.add(astro);
setProgress(0.72);

/* 脚步粒子 */
const puffGeo = new THREE.BufferGeometry();
const PUFFS = 40;
const puffPos = new Float32Array(PUFFS * 3);
const puffVel = [];
const puffLife = new Float32Array(PUFFS);
for (let i = 0; i < PUFFS; i++) { puffLife[i] = 0; puffVel.push(new THREE.Vector3()); }
puffGeo.setAttribute('position', new THREE.BufferAttribute(puffPos, 3));
const puffMat = new THREE.PointsMaterial({ color: C.sand, size: 0.28, transparent: true,
  opacity: 0.75, depthWrite: false });
const puffs = new THREE.Points(puffGeo, puffMat);
puffs.frustumCulled = false;
scene.add(puffs);
let puffIdx = 0;
function spawnPuff(p, up) {
  const i = puffIdx = (puffIdx + 1) % PUFFS;
  puffPos.set([p.x, p.y, p.z], i * 3);
  puffVel[i].copy(up).multiplyScalar(1.4)
    .add(new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(1.2));
  puffLife[i] = 1;
}

/* ---------------- 输入 ---------------- */
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'Escape') closeCard();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

const stick = $('stick'), knob = $('stickKnob');
const stickVec = { x: 0, y: 0 };
let stickId = null;
function stickUpdate(t) {
  const r = stick.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = (t.clientX - cx) / (r.width / 2), dy = (t.clientY - cy) / (r.height / 2);
  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }
  stickVec.x = dx; stickVec.y = dy;
  knob.style.transform = `translate(calc(-50% + ${dx * 34}px), calc(-50% + ${dy * 34}px))`;
}
stick.addEventListener('pointerdown', e => { stickId = e.pointerId; stick.setPointerCapture(e.pointerId); stickUpdate(e); });
stick.addEventListener('pointermove', e => { if (e.pointerId === stickId) stickUpdate(e); });
const stickEnd = e => {
  if (e.pointerId === stickId) { stickId = null; stickVec.x = 0; stickVec.y = 0;
    knob.style.transform = 'translate(-50%,-50%)'; }
};
stick.addEventListener('pointerup', stickEnd);
stick.addEventListener('pointercancel', stickEnd);

function readInput() {
  let x = 0, y = 0;
  if (keys['KeyA'] || keys['ArrowLeft']) x -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) x += 1;
  if (keys['KeyW'] || keys['ArrowUp']) y += 1;
  if (keys['KeyS'] || keys['ArrowDown']) y -= 1;
  x += stickVec.x; y -= stickVec.y;
  const len = Math.hypot(x, y);
  if (len > 1) { x /= len; y /= len; }
  return { x, y };
}

/* ---------------- 开场着陆 ---------------- */
let state = 'loading'; // loading -> intro -> diving -> playing
const intro = $('intro');
const camStartBase = astroPos.clone().normalize().multiplyScalar(R * 8).add(new THREE.Vector3(0, R * 2.2, 0));
const camStartLook = new THREE.Vector3(0, R * 3.1, 0); // 视线高于球心，星球沉到按钮下方
camera.position.copy(camStartBase);
camera.up.set(0, 1, 0);
camera.lookAt(camStartLook);
let diveFrom = null, diveUp0 = null;

setProgress(0.85);
// 首帧渲染完再揭开 loader（完成态可达：loader 一定消失）
renderer.render(scene, camera);
setProgress(1);
requestAnimationFrame(() => {
  $('loader').classList.add('done');
  intro.style.opacity = '1';
  state = 'intro';
});

const landBtn = $('landBtn');
let diveT = 0;
let DIVE_LEN = 3.2; // 调试 ?nodive 可覆盖为瞬间着陆
landBtn.addEventListener('click', () => {
  if (state !== 'intro') return;
  state = 'diving';
  diveT = 0;
  diveFrom = camera.position.clone();
  diveUp0 = camera.up.clone();
  intro.classList.add('hidden');
  setTimeout(() => { intro.style.display = 'none'; }, 950);
});

/* 调试参数（验收截图用）：?land=1s 后自动着陆；&walk=着陆后自动前走 2.5s */
{
  const qs = new URLSearchParams(location.search);
  if (qs.has('land')) setTimeout(() => landBtn.click(), 1500);
  if (qs.has('nodive')) DIVE_LEN = 0.01; // 验收截图：跳过俯冲、直接进入游玩态
  if (qs.has('walk')) {
    setTimeout(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' })), 40000);
    setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' })), 43000);

  }
}

const _camTarget = new THREE.Vector3();
const _camUp = new THREE.Vector3();
const _lookAt = new THREE.Vector3();
const _behind = new THREE.Vector3();
const _Y = new THREE.Vector3(0, 1, 0);
let camInit = false;
function followCam(dt, instant = false) {
  const fr = astroFrame(lastFwd);
  _behind.copy(fr.fwd).multiplyScalar(-C.camDist);
  _camTarget.copy(astroPos).addScaledVector(fr.up, C.camH).add(_behind);
  _camUp.copy(fr.up);
  if (!camInit || instant) { camera.position.copy(_camTarget); camera.up.copy(_camUp); camInit = true; }
  else {
    camera.position.x = damp(camera.position.x, _camTarget.x, 4.5, dt);
    camera.position.y = damp(camera.position.y, _camTarget.y, 4.5, dt);
    camera.position.z = damp(camera.position.z, _camTarget.z, 4.5, dt);
    camera.up.lerp(_camUp, 1 - Math.exp(-4.5 * dt)).normalize();
  }
  _lookAt.copy(astroPos).addScaledVector(fr.up, 1.6);
  camera.lookAt(_lookAt);
}

/* ---------------- 地标标签 & 信息卡 ---------------- */
const labelsBox = $('labels');
const card = $('card');
for (const lm of landmarks) {
  const el = document.createElement('button');
  el.className = 'tag';
  el.innerHTML = `<span class="dot"></span>${lm.info.tag}`;
  el.addEventListener('click', () => openCard(lm.info));
  labelsBox.appendChild(el);
  lm.el = el;
}
function openCard(info) {
  $('cardTag').textContent = info.tag;
  $('cardTitle').textContent = info.title;
  $('cardBody').textContent = info.body;
  const list = $('cardList');
  list.innerHTML = '';
  for (const s of info.list) {
    const sp = document.createElement('span');
    sp.textContent = s;
    list.appendChild(sp);
  }
  card.classList.add('open');
}
function closeCard() { card.classList.remove('open'); }
$('cardClose').addEventListener('click', closeCard);

const _pv = new THREE.Vector3();
function updateLabels() {
  for (const lm of landmarks) {
    const d = astroPos.distanceTo(lm.anchor);
    const near = d < C.touchDist * 2.2;
    _pv.copy(lm.anchor).project(camera);
    const visible = near && _pv.z < 1 && Math.abs(_pv.x) < 1.05 && Math.abs(_pv.y) < 1.05;
    lm.el.classList.toggle('show', visible);
    if (visible) {
      lm.el.style.left = ((_pv.x * 0.5 + 0.5) * window.innerWidth) + 'px';
      lm.el.style.top = ((-_pv.y * 0.5 + 0.5) * window.innerHeight - 14) + 'px';
    }
  }
}

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
let walkPhase = 0, puffTimer = 0;
let lastFwd = new THREE.Vector3(0, 0, 1);
const _q = new THREE.Quaternion();
const _inp = new THREE.Vector3();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  /* 灯塔光束旋转 / 大树星星闪烁 / 小屋炊烟 */
  for (const lm of landmarks) {
    const u = lm.group.userData;
    if (u.beam) u.beam.rotation.x = t * 0.9;
    if (u.star) { const s = 1 + Math.sin(t * 2.4) * 0.18; u.star.scale.set(s, s, s); u.star.rotation.y = t * 0.8; }
    if (u.smoke) {
      u.smoke.position.y = 2.9 + (Math.sin(t * 1.3) * 0.5 + 0.5) * 0.9;
      u.smoke.material.opacity = 0.5 - (Math.sin(t * 1.3) * 0.5 + 0.5) * 0.35;
      const ss = 1 + (Math.sin(t * 1.3) * 0.5 + 0.5) * 0.8; u.smoke.scale.set(ss, ss, ss);
    }
  }

  if (state === 'diving') {
    diveT += dt / DIVE_LEN;
    const e = easeInOutCubic(Math.min(diveT, 1));
    // 一镜到底：太空 → 弧线俯冲 → 跟随位
    followCam(0.016, true);
    const end = _camTarget.clone(), endUp = _camUp.clone();
    const arc = Math.sin(e * Math.PI) * R * 0.55; // 俯冲弧线高度
    camera.position.lerpVectors(diveFrom, end, e);
    camera.position.addScaledVector(astroPos.clone().normalize(), arc);
    camera.up.lerpVectors(diveUp0, endUp, easeOutCubic(e)).normalize();
    camera.lookAt(_lookAt.lerp(camStartLook, 1 - e));
    if (diveT >= 1) {
      state = 'playing';
      document.body.classList.add('playing');
      followCam(dt, true);
    }
  } else if (state === 'playing') {
    /* 行走 */
    const { x, y } = readInput();
    const moving = Math.hypot(x, y) > 0.08;
    const fr0 = astroFrame(lastFwd);
    if (moving) {
      _inp.copy(fr0.fwd).multiplyScalar(y).addScaledVector(fr0.right, x);
      _inp.sub(fr0.up.clone().multiplyScalar(_inp.dot(fr0.up))); // 回到切平面
      if (_inp.lengthSq() > 1e-6) _inp.normalize();
      astroPos.addScaledVector(_inp, C.walkSpeed * dt).normalize().multiplyScalar(R);
      lastFwd.copy(_inp);
      walkPhase += dt * 11;
      puffTimer -= dt;
      if (puffTimer <= 0) {
        spawnPuff(astroPos.clone().addScaledVector(fr0.up, 0.15), fr0.up);
        puffTimer = 0.22;
      }
    }
    /* 球面重力：up=法线，平滑转向 */
    const fr = astroFrame(lastFwd);
    _q.copy(fr.quat);
    astroQuat.slerp(_q, 1 - Math.exp(-8 * dt));
    astro.quaternion.copy(astroQuat);
    astro.position.copy(astroPos);
    /* 走路弹跳：物理感小跳 */
    const bounce = moving ? Math.abs(Math.sin(walkPhase)) * 0.16 : 0;
    astro.position.addScaledVector(fr.up, bounce + 0.05);
    const lean = moving ? 0.1 : 0; // 轻微前倾
    astro.rotateX(lean * Math.min(1, dt * 60 * 0.016));

    followCam(dt);
    updateLabels();
  } else if (state === 'intro') {
    /* 开场：相机缓慢环绕漂移（星球/地标不动，避免地形错位） */
    camera.position.copy(camStartBase).applyAxisAngle(_Y, t * 0.045);
    camera.lookAt(camStartLook);
  }

  /* 粒子更新 */
  for (let i = 0; i < PUFFS; i++) {
    if (puffLife[i] > 0) {
      puffLife[i] -= dt * 1.6;
      puffPos[i * 3] += puffVel[i].x * dt;
      puffPos[i * 3 + 1] += puffVel[i].y * dt;
      puffPos[i * 3 + 2] += puffVel[i].z * dt;
      puffVel[i].multiplyScalar(1 - dt * 2);
    } else {
      puffPos[i * 3 + 1] = -9999;
    }
  }
  puffGeo.attributes.position.needsUpdate = true;
  puffMat.opacity = 0.75;

  renderer.render(scene, camera);
}
tick();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
