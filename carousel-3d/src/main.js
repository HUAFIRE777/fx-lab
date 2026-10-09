/* carousel-3d · 旋转木马
 * 嘉年华午夜场：木马绕轴旋转 + 上下起伏，顶棚灯珠追逐跑马灯，底座灯光。
 * 交互：转速滑杆 / 灯光三档 / 点击马匹聚焦 + 信息卡 / 自研 orbit。
 * 纯程序化几何 + canvas 纹理，零外部请求。
 */
import * as THREE from 'three';

/* ---------------- 配色（定死 3 色） ---------------- */
const C = {
  night: 0x0b1530,
  red: 0x8e1118,
  redDeep: 0x6e0d12,
  redDark: 0x57090d,
  gold: 0xf0be4a,
  goldBright: 0xffd97a,
  ink: 0x141c38,
};

const HORSES = [
  { name: '焰蹄', en: 'FLAMEHOOF',  story: '第一圈跑出去那年，它鬃毛上的漆还没干透。', body: C.red },
  { name: '追风', en: 'WINDCHASER', story: '它总说自己是马群里最快的，从没被拆穿过。',   body: C.redDeep },
  { name: '夜巡', en: 'NIGHTWATCH', story: '午夜场专属：只有灯全亮时，它才肯睁眼。',     body: C.red },
  { name: '金铃', en: 'GOLDBELL',   story: '脖子上的铃铛是老园长亲手系的，响了四十年。', body: C.redDark },
  { name: '踏浪', en: 'WAVETREADER',story: '它梦见过海，醒来后蹄声里一直带着潮声。',   body: C.redDeep },
  { name: '小满', en: 'GRAINFULL',  story: '园里最小的孩子都爱骑它，它起伏得最温柔。', body: C.red },
];

/* ---------------- canvas 纹理 ---------------- */
function canvasTex(size, draw) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  draw(cv.getContext('2d'), size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const css = (h) => '#' + h.toString(16).padStart(6, '0');

// 顶棚条纹：竖条纹（canvas-x = u = 环向），在锥面上才是真正的放射条纹
const canopyTex = canvasTex(512, (g, s) => {
  for (let i = 0; i < 24; i++) {
    g.fillStyle = i % 2 ? css(C.gold) : css(C.red);
    g.fillRect((i / 24) * s, 0, s / 24 + 1, s);
  }
  // 顶部收口处加一圈金色压边（v=1 为锥顶）
  g.fillStyle = css(C.gold);
  g.fillRect(0, 0, s, 10);
});
// 顶棚底面：暗红底 + 金色同心环
const canopyUnderTex = canvasTex(512, (g, s) => {
  g.fillStyle = css(C.redDark); g.fillRect(0, 0, s, s);
  g.strokeStyle = 'rgba(240,190,74,.55)';
  for (let r = 40; r < s / 2; r += 44) {
    g.lineWidth = r % 88 < 44 ? 5 : 2;
    g.beginPath(); g.arc(s / 2, s / 2, r, 0, Math.PI * 2); g.stroke();
  }
});
// 平台顶面：暗红底 + 金环 + 灯点
const platformTex = canvasTex(512, (g, s) => {
  g.fillStyle = css(C.redDeep); g.fillRect(0, 0, s, s);
  g.strokeStyle = 'rgba(240,190,74,.5)';
  [70, 130, 190, 240].forEach((r, i) => {
    g.lineWidth = i === 3 ? 6 : 3;
    g.beginPath(); g.arc(s / 2, s / 2, r, 0, Math.PI * 2); g.stroke();
  });
  g.fillStyle = 'rgba(240,190,74,.8)';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    g.beginPath(); g.arc(s / 2 + Math.cos(a) * 210, s / 2 + Math.sin(a) * 210, 5, 0, Math.PI * 2); g.fill();
  }
});
// 中柱：红底 + 金竖条
const columnTex = canvasTex(256, (g, s) => {
  g.fillStyle = css(C.red); g.fillRect(0, 0, s, s);
  g.fillStyle = 'rgba(240,190,74,.85)';
  for (let i = 0; i < 8; i++) g.fillRect((i / 8) * s, 0, 6, s);
});
// 地面：夜蓝底 + 淡金同心环 + 噪点
const groundTex = canvasTex(1024, (g, s) => {
  g.fillStyle = css(C.night); g.fillRect(0, 0, s, s);
  g.strokeStyle = 'rgba(240,190,74,.10)';
  for (let r = 60; r < s / 2; r += 70) {
    g.lineWidth = 2;
    g.beginPath(); g.arc(s / 2, s / 2, r, 0, Math.PI * 2); g.stroke();
  }
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(200,215,245,${Math.random() * 0.08})`;
    g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  }
});
// 光晕 sprite
const glowTex = canvasTex(128, (g, s) => {
  const gr = g.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(255,225,150,1)');
  gr.addColorStop(0.35, 'rgba(240,190,74,.55)');
  gr.addColorStop(1, 'rgba(240,190,74,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
});

/* ---------------- 渲染器 / 场景 ---------------- */
const canvas = document.getElementById('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  document.getElementById('loader-text').textContent = '当前浏览器不支持 WebGL';
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(C.night);
scene.fog = new THREE.FogExp2(C.night, 0.014);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 200);

/* ---------------- 灯光 ---------------- */
scene.add(new THREE.AmbientLight(0x2a3a66, 0.7));
// 棚下主光：两盏对称暖光，照亮木马 / 中柱 / 顶棚底面（放柱外，不放柱心里）
[[-3.6, 3.4, 0], [3.6, 3.4, 0]].forEach(([x, y, z]) => {
  const pl = new THREE.PointLight(0xffc86b, 45, 20, 2);
  pl.position.set(x, y, z);
  scene.add(pl);
});
const spot = new THREE.SpotLight(0xffd97a, 120, 30, 0.75, 0.55, 1.6);
spot.position.set(0, 10.5, 0);
spot.target.position.set(0, 0, 0);
spot.castShadow = true; // 恢复：木马在平台上的投影是氛围关键
spot.shadow.mapSize.set(1024, 1024);
scene.add(spot, spot.target);
const rim = new THREE.DirectionalLight(0x4a6bb5, 0.35);
rim.position.set(-7, 9, 5); // 偏前上：明暗交界线藏到背面，不在棚面切出斜带
scene.add(rim);
// 聚焦马匹用的追光（平时强度 0）
const focusSpot = new THREE.SpotLight(0xffe9a8, 0, 12, 0.42, 0.5, 1.4);
scene.add(focusSpot, focusSpot.target);

/* ---------------- 地面 / 星空 / 尘埃 ---------------- */
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(46, 48),
  new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
ground.receiveShadow = true;
scene.add(ground);

{
  const n = 340, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * 0.9 + 0.12, r = 70;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
    pos[i * 3 + 1] = Math.sin(e) * r;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xafc0e8, size: 0.35, transparent: true, opacity: 0.65, fog: false,
  })));
}
const dust = (() => {
  const n = 130, pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6.5;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.random() * 7;
    pos[i * 3 + 2] = Math.sin(a) * r;
    seed[i] = Math.random() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xf0be4a, size: 0.085, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(pts);
  return { pts, seed, n };
})();

/* ---------------- 旋转木马本体 ---------------- */
const ride = new THREE.Group();
scene.add(ride);
const goldMat = new THREE.MeshStandardMaterial({ color: C.gold, metalness: 0.85, roughness: 0.32 });
const darkMat = new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.85 });

// 平台
{
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(5.2, 5.45, 0.55, 48),
    new THREE.MeshStandardMaterial({ map: platformTex, roughness: 0.7 })
  );
  top.position.y = 0.28;
  top.receiveShadow = true;
  ride.add(top);
  [0.12, 0.46].forEach((y) => {
    const trim = new THREE.Mesh(new THREE.TorusGeometry(5.32, 0.055, 10, 64), goldMat);
    trim.rotation.x = Math.PI / 2;
    trim.position.y = y;
    ride.add(trim);
  });
  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(5.45, 5.6, 0.5, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: C.redDark, roughness: 0.8, side: THREE.DoubleSide })
  );
  skirt.position.y = -0.22;
  ride.add(skirt);
}
// 中柱
{
  const col = new THREE.Mesh(
    new THREE.CylinderGeometry(1.02, 1.22, 4.6, 24),
    new THREE.MeshStandardMaterial({ map: columnTex, roughness: 0.6 })
  );
  col.position.y = 2.85;
  col.castShadow = true;
  ride.add(col);
  [0.85, 4.95].forEach((y) => {
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.07, 10, 32), goldMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    ride.add(band);
  });
}
// 顶棚
{
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(6.4, 2.3, 48, 1, true),
    new THREE.MeshStandardMaterial({ map: canopyTex, roughness: 0.65, side: THREE.DoubleSide })
  );
  cone.position.y = 6.3;
  cone.castShadow = false; // 顶棚不投：避免顶部 spot 在棚面打出难看的斜阴影带
  ride.add(cone);
  const under = new THREE.Mesh(
    new THREE.CircleGeometry(6.4, 48),
    new THREE.MeshStandardMaterial({ map: canopyUnderTex, roughness: 0.8 })
  );
  under.rotation.x = Math.PI / 2;
  under.position.y = 5.15;
  ride.add(under);
  const rimT = new THREE.Mesh(new THREE.TorusGeometry(6.35, 0.09, 10, 72), goldMat);
  rimT.rotation.x = Math.PI / 2;
  rimT.position.y = 5.15;
  ride.add(rimT);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), goldMat);
  finial.position.y = 7.62;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 8), goldMat);
  crown.position.y = 7.95;
  ride.add(finial, crown);
}

/* ---------------- 灯珠（顶棚追逐）+ 底座灯 ---------------- */
const BULBS = 30;
const bulbs = [];
for (let i = 0; i < BULBS; i++) {
  const a = (i / BULBS) * Math.PI * 2;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x554411, emissive: C.goldBright, emissiveIntensity: 0.4, roughness: 0.4,
  });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), mat);
  b.position.set(Math.cos(a) * 6.28, 5.02, Math.sin(a) * 6.28);
  const sm = new THREE.SpriteMaterial({
    map: glowTex, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const spr = new THREE.Sprite(sm);
  spr.scale.set(0.7, 0.7, 1);
  spr.position.copy(b.position);
  ride.add(b, spr);
  bulbs.push({ mesh: b, mat, spr, sm });
}
const baseLights = [];
for (let i = 0; i < 24; i++) {
  const a = (i / 24) * Math.PI * 2;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x554411, emissive: C.goldBright, emissiveIntensity: 1.2, roughness: 0.4,
  });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat);
  b.position.set(Math.cos(a) * 5.12, 0.62, Math.sin(a) * 5.12);
  ride.add(b);
  baseLights.push({ mat });
}

/* ---------------- 木马（程序化） ---------------- */
function buildHorse(bodyColor) {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.55, metalness: 0.08, flatShading: true });
  const hoof = new THREE.MeshStandardMaterial({ color: 0x0e1428, roughness: 0.9 });
  const add = (geo, mat, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    m.castShadow = true;
    g.add(m);
    return m;
  };
  // 躯干 / 脖子 / 头
  const torso = add(new THREE.CapsuleGeometry(0.30, 0.85, 6, 12), body, 0, 0, 0);
  torso.rotation.x = Math.PI / 2;
  add(new THREE.CylinderGeometry(0.13, 0.19, 0.75, 10), body, 0, 0.42, 0.48, -0.65);
  add(new THREE.BoxGeometry(0.24, 0.44, 0.26), body, 0, 0.86, 0.82, -0.5);
  add(new THREE.BoxGeometry(0.18, 0.2, 0.2), darkMat, 0, 0.70, 1.0, -0.5); // 鼻
  add(new THREE.ConeGeometry(0.05, 0.14, 6), darkMat, -0.08, 1.10, 0.70);  // 耳
  add(new THREE.ConeGeometry(0.05, 0.14, 6), darkMat, 0.08, 1.10, 0.70);
  // 鬃（5 片）
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    add(new THREE.BoxGeometry(0.07, 0.17, 0.13), darkMat, 0, 0.34 + t * 0.62, 0.30 + t * 0.34, -0.5);
  }
  // 腿（前腿前迈 / 后腿后蹬）
  [[-0.17, 0.30, 0.50], [0.17, 0.30, 0.50], [-0.17, -0.30, -0.55], [0.17, -0.30, -0.55]].forEach(([x, z, rx]) => {
    add(new THREE.CylinderGeometry(0.065, 0.05, 0.62, 8), body, x, -0.28, z, rx);
    const hy = -0.28 - 0.31 * Math.cos(rx), hz = z + 0.31 * Math.sin(rx);
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.1, 8), hoof, x, hy, hz, rx);
  });
  // 尾
  add(new THREE.ConeGeometry(0.09, 0.55, 8), darkMat, 0, 0.08, -0.58, 0.95);
  // 马鞍：红毯 + 金边 + 金鞍
  add(new THREE.BoxGeometry(0.72, 0.045, 0.61), goldMat, 0, 0.265, -0.02);
  add(new THREE.BoxGeometry(0.66, 0.06, 0.55), new THREE.MeshStandardMaterial({ color: C.redDark, roughness: 0.7 }), 0, 0.30, -0.02);
  add(new THREE.BoxGeometry(0.40, 0.13, 0.36), goldMat, 0, 0.42, -0.02);
  add(new THREE.BoxGeometry(0.30, 0.06, 0.26), new THREE.MeshStandardMaterial({ color: C.redDark, roughness: 0.7 }), 0, 0.50, -0.02);
  return g;
}

const horses = [];
const hitProxies = [];
const poleMat = new THREE.MeshStandardMaterial({ color: C.gold, metalness: 0.9, roughness: 0.25 });
HORSES.forEach((h, i) => {
  const a = (i / HORSES.length) * Math.PI * 2;
  const x = Math.cos(a) * 3.4, z = Math.sin(a) * 3.4;
  // 杆（静止）
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.7, 10), poleMat);
  pole.position.set(x, 2.9, z);
  pole.castShadow = true;
  ride.add(pole);
  // 马（起伏）
  const bob = new THREE.Group();
  bob.position.set(x, 1.5, z);
  bob.rotation.y = -a; // 面向行进切线方向
  const horse = buildHorse(h.body);
  bob.add(horse);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.05, 8, 40),
    new THREE.MeshStandardMaterial({ color: 0x554411, emissive: C.goldBright, emissiveIntensity: 0, transparent: true, opacity: 0 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.88;
  bob.add(ring);
  ride.add(bob);
  // 点击代理（隐形大胶囊，好点）
  const proxy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 2.8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  proxy.position.copy(bob.position);
  proxy.userData.horseIndex = i;
  ride.add(proxy);
  horses.push({ bob, ring, ringMat: ring.material, phase: i * 1.05, info: h });
  hitProxies.push(proxy);
});

/* ---------------- 自研 orbit ---------------- */
const startR = innerWidth < 640 ? 19 : 14.5; // 竖屏拉远，木马群入画
const orbit = {
  target: new THREE.Vector3(0, 2.6, 0),
  radius: startR, theta: 0.65, phi: 1.24,
  gRadius: startR, gTheta: 0.65, gPhi: 1.24,
};
function applyOrbit() {
  const sp = Math.sin(orbit.phi), r = orbit.radius;
  camera.position.set(
    orbit.target.x + r * sp * Math.sin(orbit.theta),
    orbit.target.y + r * Math.cos(orbit.phi),
    orbit.target.z + r * sp * Math.cos(orbit.theta)
  );
  camera.lookAt(orbit.target);
}
{
  let dragging = false, lx = 0, ly = 0, downX = 0, downY = 0, downT = 0, moved = false;
  let pinchD = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; moved = false;
    lx = downX = e.clientX; ly = downY = e.clientY; downT = performance.now();
    canvas.classList.add('dragging');
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* 合成事件无活跃指针，忽略 */ }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) moved = true;
    orbit.gTheta -= dx * 0.0052;
    orbit.gPhi = Math.min(1.45, Math.max(0.85, orbit.gPhi - dy * 0.004));
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('dragging');
    const quick = performance.now() - downT < 450;
    if (!moved && quick) pickHorse(e.clientX, e.clientY);
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    orbit.gRadius = Math.min(22, Math.max(7, orbit.gRadius * (1 + e.deltaY * 0.001)));
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (pinchD > 0) orbit.gRadius = Math.min(22, Math.max(7, orbit.gRadius * (pinchD / d)));
      pinchD = d;
    }
  }, { passive: true });
  canvas.addEventListener('touchend', () => { pinchD = 0; });
}

/* ---------------- 点击马匹聚焦 ---------------- */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let focused = -1;
const card = document.getElementById('card');
function pickHorse(cx, cy) {
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(hitProxies, false);
  if (hits.length) focusHorse(hits[0].object.userData.horseIndex);
  else focusHorse(-1);
}
function focusHorse(i) {
  focused = i;
  if (i < 0) { card.classList.remove('show'); return; }
  const h = horses[i].info;
  document.getElementById('card-name').textContent = h.name;
  document.getElementById('card-en').textContent = h.en;
  document.getElementById('card-story').textContent = h.story;
  card.classList.add('show');
}

/* ---------------- 控制：转速 / 灯光模式 ---------------- */
let targetSpeed = 0.42 * 0.9, speed = 0;
const speedRange = document.getElementById('speed-range');
const speedVal = document.getElementById('speed-val');
function applySpeed() {
  const v = +speedRange.value;
  targetSpeed = (v / 100) * 0.9;
  speedVal.textContent = v + '%';
}
speedRange.addEventListener('input', applySpeed);
applySpeed();

let lightMode = 'chase';
document.querySelectorAll('#mode-seg button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#mode-seg button').forEach((b) => b.classList.remove('on'));
    btn.classList.add('on');
    lightMode = btn.dataset.mode;
  });
});

/* ---------------- 灯光模式 ---------------- */
function bulbBrightness(i, t, chaseT) {
  if (lightMode === 'chase') {
    const p = 0.5 + 0.5 * Math.cos(chaseT * 2 - (i / BULBS) * Math.PI * 2 * 3);
    return 0.22 + 0.78 * Math.pow(p, 3); // 三束追逐，eased 不跳变
  }
  if (lightMode === 'breathe') {
    return 0.5 + 0.5 * Math.sin(t * 1.7 + i * 0.15);
  }
  return 0.95 + 0.05 * Math.sin(t * 7 + i * 1.3); // 全亮 + 微闪
}

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
let angle = 0, bobPhase = 0, chaseT = 0, entered = false;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 转速 eased（加减速有物理感）
  speed += (targetSpeed - speed) * Math.min(1, dt * 1.6);
  angle += speed * dt;
  ride.rotation.y = angle;

  // 木马起伏：频率随转速走
  bobPhase += dt * (1.1 + speed * 2.4);
  horses.forEach((h, i) => {
    const s = Math.sin(bobPhase * 1.5 + h.phase);
    h.bob.position.y = 1.5 + s * 0.42;
    h.bob.rotation.x = s * 0.06;
    h.ringMat.emissiveIntensity += (((i === focused) ? 2.2 : 0) - h.ringMat.emissiveIntensity) * Math.min(1, dt * 6);
    h.ringMat.opacity += (((i === focused) ? (0.65 + 0.35 * Math.sin(t * 4)) : 0) - h.ringMat.opacity) * Math.min(1, dt * 6);
  });

  // 追逐灯相位随转速
  chaseT += dt * (0.9 + speed * 3.4);
  bulbs.forEach((b, i) => {
    const br = bulbBrightness(i, t, chaseT);
    b.mat.emissiveIntensity = 0.15 + 1.7 * br;
    b.sm.opacity = 0.18 + 0.72 * br;
    const s = 0.55 + 0.35 * br;
    b.spr.scale.set(s, s, 1);
  });
  const baseBr = lightMode === 'breathe' ? 0.6 + 0.5 * Math.sin(t * 1.7) : 1.15;
  baseLights.forEach(({ mat }) => { mat.emissiveIntensity = baseBr; });

  // 聚焦追光跟随
  if (focused >= 0) {
    const p = new THREE.Vector3();
    horses[focused].bob.getWorldPosition(p);
    focusSpot.position.set(p.x, p.y + 3.4, p.z);
    focusSpot.target.position.set(p.x, p.y, p.z);
  }
  focusSpot.intensity += (((focused >= 0) ? 130 : 0) - focusSpot.intensity) * Math.min(1, dt * 5);

  // 尘埃上浮
  {
    const pos = dust.pts.geometry.attributes.position;
    for (let i = 0; i < dust.n; i++) {
      let y = pos.getY(i) + dt * 0.22;
      if (y > 7.2) y = 0;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.6 + dust.seed[i]) * dt * 0.08);
    }
    pos.needsUpdate = true;
  }

  // orbit 阻尼
  const k = 1 - Math.exp(-8 * dt);
  orbit.radius += (orbit.gRadius - orbit.radius) * k;
  orbit.theta += (orbit.gTheta - orbit.theta) * k;
  orbit.phi += (orbit.gPhi - orbit.phi) * k;
  applyOrbit();

  renderer.render(scene, camera);

  if (!entered) {
    entered = true;
    if (window.__crEnter) window.__crEnter();
  }
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', onResize);
onResize();
applyOrbit();
tick();

// 调试钩子（无头验收点选链路用，无副作用）
window.__carousel = { focusHorse, pickHorse, horses, hitProxies, camera, renderer, THREE };
