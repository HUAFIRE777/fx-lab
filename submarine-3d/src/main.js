import * as THREE from 'three';

/* ============================================================
 * submarine-3d · 潜水艇深潜
 * 透过圆形舷窗看深海：浮游颗粒、鲸鱼剪影、声呐扫描、深度系统。
 * 全部手写原创，未复制任何现成海洋特效代码。
 * ============================================================ */

const SEA = 0x9FD8FF, GLOW = 0x6BFFD8;
const DEPTH_MAX = 1000;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);

/* ---------------- 渲染器 / 场景 / 相机 ---------------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a2f47, 0.013);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 220);
camera.position.set(0, 0.5, 6);
camera.lookAt(0, 0, -10);

/* 深海背景渐变（canvas 生成，零外部请求） */
function bgTexture() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#0d3a58');
  gr.addColorStop(0.45, '#062540');
  gr.addColorStop(1, '#01070d');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
scene.background = bgTexture();

/* ---------------- 灯光 ---------------- */
const ambient = new THREE.AmbientLight(0x9FD8FF, 0.9);
const topLight = new THREE.DirectionalLight(0xBFE6FF, 1.15);
topLight.position.set(3, 12, 2);
scene.add(ambient, topLight);

/* ---------------- 精灵纹理 ---------------- */
function radialSprite(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, inner); gr.addColorStop(0.4, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const softDot = radialSprite('rgba(220,240,255,1)', 'rgba(159,216,255,.45)');
const glowDot = radialSprite('rgba(107,255,216,1)', 'rgba(107,255,216,.4)');
function ringSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(200,235,255,.9)'; g.lineWidth = 5;
  g.beginPath(); g.arc(32, 32, 24, 0, Math.PI * 2); g.stroke();
  return new THREE.CanvasTexture(c);
}
const bubbleTex = ringSprite();
function rayTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, 'rgba(180,225,255,.85)');
  gr.addColorStop(1, 'rgba(180,225,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  const side = g.createLinearGradient(0, 0, 64, 0);
  side.addColorStop(0, 'rgba(0,0,0,1)'); side.addColorStop(0.5, 'rgba(0,0,0,0)'); side.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = side; g.fillRect(0, 0, 64, 256);
  return new THREE.CanvasTexture(c);
}
const rayTex = rayTexture();

/* ---------------- 浮游颗粒（marine snow） ---------------- */
const SNOW_N = 1100;
const snowGeo = new THREE.BufferGeometry();
const snowPos = new Float32Array(SNOW_N * 3);
const snowSeed = new Float32Array(SNOW_N * 2);
for (let i = 0; i < SNOW_N; i++) {
  snowPos[i * 3] = rand(-34, 34); snowPos[i * 3 + 1] = rand(-20, 20); snowPos[i * 3 + 2] = rand(-34, 2);
  snowSeed[i * 2] = rand(0.2, 1); snowSeed[i * 2 + 1] = rand(0, Math.PI * 2);
}
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snowMat = new THREE.PointsMaterial({
  map: softDot, size: 0.42, transparent: true, opacity: 0.85,
  depthWrite: false, blending: THREE.AdditiveBlending, color: 0xCFE9FF, sizeAttenuation: true,
});
scene.add(new THREE.Points(snowGeo, snowMat));

/* ---------------- 气泡 ---------------- */
const BUB_N = 60;
const bubGeo = new THREE.BufferGeometry();
const bubPos = new Float32Array(BUB_N * 3);
const bubSpd = new Float32Array(BUB_N);
function resetBubble(i, top) {
  bubPos[i * 3] = rand(-14, 14);
  bubPos[i * 3 + 1] = top ? rand(8, 16) : rand(-18, -6);
  bubPos[i * 3 + 2] = rand(-16, -4);
  bubSpd[i] = rand(1.6, 3.6);
}
for (let i = 0; i < BUB_N; i++) resetBubble(i, false);
bubGeo.setAttribute('position', new THREE.BufferAttribute(bubPos, 3));
const bubMat = new THREE.PointsMaterial({
  map: bubbleTex, size: 0.55, transparent: true, opacity: 0.5,
  depthWrite: false, color: 0xBFE3FF, sizeAttenuation: true,
});
scene.add(new THREE.Points(bubGeo, bubMat));

/* ---------------- 海面光柱 ---------------- */
const rays = [];
for (let i = 0; i < 4; i++) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(rand(4, 8), 34),
    new THREE.MeshBasicMaterial({
      map: rayTex, transparent: true, opacity: 0.14, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, color: 0x9FD8FF,
    })
  );
  m.position.set(rand(-16, 16), 8, rand(-20, -10));
  m.rotation.z = rand(-0.22, -0.1);
  m.rotation.y = rand(-0.3, 0.3);
  m.userData.base = m.material.opacity;
  scene.add(m); rays.push(m);
}

/* ---------------- 座头鲸剪影 ---------------- */
const whale = new THREE.Group();
const silMat = new THREE.MeshBasicMaterial({ color: 0x02090f, transparent: true, opacity: 0 });
{
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), silMat);
  body.scale.set(7, 2.3, 2.0);
  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.7, 3.6, 12), silMat);
  stock.rotation.z = Math.PI / 2; stock.position.set(-8.4, 0.35, 0);
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 8), silMat);
  dorsal.position.set(-2.6, 2.5, 0); dorsal.rotation.z = 0.5;
  const pecGeo = new THREE.ConeGeometry(0.42, 2.8, 8);
  const pecL = new THREE.Mesh(pecGeo, silMat);
  pecL.position.set(2.4, -1.4, 1.9); pecL.rotation.set(0.9, 0, -2.2); pecL.scale.z = 0.35;
  const pecR = pecL.clone(); pecR.position.z = -1.9; pecR.rotation.x = -0.9;
  whale.add(body, stock, dorsal, pecL, pecR);
}
const fluke = new THREE.Group();
{
  const lobeGeo = new THREE.BoxGeometry(2.8, 0.45, 1.7);
  const l = new THREE.Mesh(lobeGeo, silMat); l.position.z = 1.5; l.rotation.y = 0.55;
  const r = new THREE.Mesh(lobeGeo, silMat); r.position.z = -1.5; r.rotation.y = -0.55;
  fluke.add(l, r);
  fluke.position.set(-10.6, 0.55, 0);
  whale.add(fluke);
}
/* 鲸身荧光斑点 */
const WHALE_SPOTS = 26;
const spotGeo = new THREE.BufferGeometry();
const spotPos = new Float32Array(WHALE_SPOTS * 3);
for (let i = 0; i < WHALE_SPOTS; i++) {
  const x = -6 + (12 * i) / (WHALE_SPOTS - 1);
  const side = i % 2 === 0 ? 1 : -1;
  spotPos[i * 3] = x;
  spotPos[i * 3 + 1] = -0.55 + Math.sin(i * 0.9) * 0.35;
  spotPos[i * 3 + 2] = side * 1.95 * Math.cos(x / 7);
}
spotGeo.setAttribute('position', new THREE.BufferAttribute(spotPos, 3));
const spotMat = new THREE.PointsMaterial({
  map: glowDot, size: 0.5, transparent: true, opacity: 0,
  depthWrite: false, blending: THREE.AdditiveBlending, color: GLOW,
});
const spots = new THREE.Points(spotGeo, spotMat);
whale.add(spots);
whale.position.set(-46, -1, -17);
scene.add(whale);
const whaleState = { wait: 2.5, dir: 1 };

/* ---------------- 银鱼群 ---------------- */
const FISH_N = 42;
const fishGeo = new THREE.ConeGeometry(0.17, 0.7, 5);
fishGeo.rotateZ(-Math.PI / 2); // 鱼头朝 +X
const fishMat = new THREE.MeshBasicMaterial({ color: SEA, transparent: true, opacity: 0.7 });
const fishes = new THREE.InstancedMesh(fishGeo, fishMat, FISH_N);
fishes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(fishes);
const fishOff = [], fishPrev = [], fishPhase = [];
for (let i = 0; i < FISH_N; i++) {
  const a = rand(0, Math.PI * 2), rr = Math.sqrt(Math.random());
  fishOff.push(new THREE.Vector3(Math.cos(a) * rr * 7, Math.sin(a) * rr * 2.6, (Math.random() - 0.5) * 5));
  fishPrev.push(new THREE.Vector3());
  fishPhase.push(rand(0, Math.PI * 2));
}
const fishCenter = new THREE.Vector3(-6, 0, -12);
const dummy = new THREE.Object3D();

/* ---------------- 月形水母 ×3 ---------------- */
const jellies = [];
function makeJelly(x, y, z, s, phase) {
  const g = new THREE.Group();
  const bellMat = new THREE.MeshBasicMaterial({
    color: GLOW, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
  });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(1.15, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), bellMat);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xE8FFF8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), coreMat);
  core.position.y = 0.35;
  g.add(bell, core);
  const tentMat = new THREE.LineBasicMaterial({ color: GLOW, transparent: true, opacity: 0 });
  const tents = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const tg = new THREE.BufferGeometry();
    const tp = new Float32Array(8 * 3);
    for (let s2 = 0; s2 < 8; s2++) {
      tp[s2 * 3] = Math.cos(a) * 0.95 * (1 - s2 / 14);
      tp[s2 * 3 + 1] = -s2 * 0.34;
      tp[s2 * 3 + 2] = Math.sin(a) * 0.95 * (1 - s2 / 14);
    }
    tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
    const line = new THREE.Line(tg, tentMat);
    line.userData = { a, phase: rand(0, 6) };
    g.add(line); tents.push(line);
  }
  g.position.set(x, y, z); g.scale.setScalar(s);
  scene.add(g);
  jellies.push({ g, bell, bellMat, coreMat, tentMat, tents, phase, baseY: y, baseX: x });
}
makeJelly(-9, 1.5, -13, 1.15, 0);
makeJelly(7, -2.5, -15, 0.9, 2.1);
makeJelly(1, 4, -11, 0.7, 4.2);

/* ---------------- 深海鮟鱇鱼 ---------------- */
const angler = new THREE.Group();
const angSil = new THREE.MeshBasicMaterial({ color: 0x030b12, transparent: true, opacity: 0 });
{
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), angSil);
  body.scale.set(1.55, 1.3, 1.1);
  const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.5, 10), angSil);
  jaw.rotation.z = -Math.PI / 2.3; jaw.position.set(1.15, -0.55, 0); jaw.scale.z = 0.7;
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 8), angSil);
  tail.rotation.z = Math.PI / 2; tail.position.set(-1.8, 0.1, 0); tail.scale.z = 0.4;
  angler.add(body, jaw, tail);
}
const lureArm = new THREE.Group();
const stalkMat = new THREE.MeshBasicMaterial({ color: 0x0a1c2a, transparent: true, opacity: 0 });
const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.7, 6), stalkMat);
stalk.position.y = 0.85;
const bulbMat = new THREE.MeshBasicMaterial({ color: GLOW, transparent: true, opacity: 0 });
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), bulbMat);
bulb.position.y = 1.75;
const lureGlowMat = new THREE.SpriteMaterial({
  map: glowDot, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, color: GLOW,
});
const lureGlow = new THREE.Sprite(lureGlowMat);
lureGlow.scale.setScalar(2.2); lureGlow.position.y = 1.75;
const lureLight = new THREE.PointLight(GLOW, 0, 16, 1.6);
lureLight.position.y = 1.75;
lureArm.add(stalk, bulb, lureGlow, lureLight);
lureArm.position.set(0.7, 1.05, 0);
lureArm.rotation.z = -0.5;
angler.add(lureArm);
angler.position.set(5, -1.5, -7);
angler.rotation.y = -0.5;
scene.add(angler);

/* ---------------- 声呐：3D 扩散环 + 回波 ---------------- */
const ringPool = [];
for (let i = 0; i < 5; i++) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(0.94, 1.0, 64),
    new THREE.MeshBasicMaterial({
      color: SEA, transparent: true, opacity: 0, side: THREE.DoubleSide,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  m.visible = false; m.userData.age = 99;
  scene.add(m); ringPool.push(m);
}
const echoPool = [];
for (let i = 0; i < 10; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowDot, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending, color: GLOW,
  }));
  s.visible = false; s.userData = { age: 99, delay: 0, life: 1 };
  s.scale.setScalar(0.9);
  scene.add(s); echoPool.push(s);
}
let ringIdx = 0, echoIdx = 0;
const raycaster = new THREE.Raycaster();
const pingPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 10);

function sonar3D(nx, ny) {
  raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
  const hit = new THREE.Vector3();
  raycaster.ray.intersectPlane(pingPlane, hit);
  if (!hit) return;
  const ring = ringPool[ringIdx++ % ringPool.length];
  ring.position.copy(hit);
  ring.lookAt(camera.position);
  ring.visible = true; ring.userData.age = 0;
  for (let i = 0; i < 4; i++) {
    const e = echoPool[echoIdx++ % echoPool.length];
    const a = rand(0, Math.PI * 2), rr = rand(2.5, 7.5);
    e.position.set(hit.x + Math.cos(a) * rr, hit.y + Math.sin(a) * rr * 0.7, hit.z + rand(-2, 2));
    e.visible = true;
    e.userData = { age: 0, delay: rand(0.35, 1.1), life: rand(0.9, 1.4) };
  }
}

/* ---------------- 深度系统 ---------------- */
let depth = 0, targetDepth = 0, maxDepth = 0;
const depthNum = document.getElementById('depthNum');
const zoneName = document.getElementById('zoneName');
const depthBar = document.getElementById('depthBar');
const depthSlider = document.getElementById('depth');
const depthVal = document.getElementById('depthVal');
const depthdim = document.getElementById('depthdim');
const fogShallow = new THREE.Color(0x0a2f47), fogDeep = new THREE.Color(0x01040a);

function zoneOf(d) {
  if (d < 200) return '浅海阳光区';
  if (d < 600) return '暮光区';
  return '午夜深渊区';
}

/* 生物图鉴 */
const GUIDE = [
  { need: 0, name: '银鱼群', desc: '成群掠过舷窗，像一片流动的银。' },
  { need: 120, name: '座头鲸', desc: '十五米的影子，带着荧光缓缓经过。' },
  { need: 300, name: '月形水母', desc: '暮光区漂浮的灯，一张一合。' },
  { need: 650, name: '深海鮟鱇鱼', desc: '午夜区唯一的路灯，长在它自己头上。' },
];
const guideLis = [...document.querySelectorAll('#guideList li')];
const unlocked = new Set([0]);
const toast = document.getElementById('toast');
let toastTimer = 0;
function unlockGuide(i) {
  if (unlocked.has(i)) return;
  unlocked.add(i);
  guideLis[i].classList.add('got');
  guideLis[i].querySelector('.nm').textContent = GUIDE[i].name;
  clearTimeout(toastTimer);
  toast.innerHTML = `<div class="tk">图鉴解锁 · ${GUIDE[i].need} M</div>` +
    `<div class="tn">${GUIDE[i].name}</div><div class="td">${GUIDE[i].desc}</div>`;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4200);
}
guideLis[0].classList.add('got');

function setTarget(d) {
  targetDepth = clamp(Math.round(d), 0, DEPTH_MAX);
  depthSlider.value = targetDepth;
  depthVal.textContent = `${targetDepth} m`;
}
depthSlider.addEventListener('input', () => setTarget(+depthSlider.value));
document.getElementById('diveBtn').addEventListener('click', () => setTarget(targetDepth + 120));
document.getElementById('floatBtn').addEventListener('click', () => setTarget(targetDepth - 120));
canvas.addEventListener('wheel', (e) => { e.preventDefault(); setTarget(targetDepth + Math.sign(e.deltaY) * 50); }, { passive: false });

/* 舷窗命中判定：只响应圆内的点击 */
function inPorthole(cx, cy) {
  const px = innerWidth * 0.5, py = innerHeight * (innerWidth <= 640 ? 0.40 : 0.44);
  const r = Math.min(innerWidth, innerHeight) * 0.38;
  return Math.hypot(cx - px, cy - py) <= r;
}
const sonarLayer = document.getElementById('sonar');
const hint = document.getElementById('hint');
let hintGone = false;
function fireSonar(cx, cy) {
  for (const cls of ['run', 'run d2']) {
    const el = document.createElement('i');
    el.style.left = cx + 'px'; el.style.top = cy + 'px';
    el.className = cls;
    el.addEventListener('animationend', () => el.remove());
    sonarLayer.appendChild(el);
  }
  const nx = (cx / innerWidth) * 2 - 1, ny = -(cy / innerHeight) * 2 + 1;
  sonar3D(nx, ny);
  if (!hintGone) { hintGone = true; hint.classList.add('gone'); }
}
canvas.addEventListener('click', (e) => {
  if (inPorthole(e.clientX, e.clientY)) fireSonar(e.clientX, e.clientY);
});
document.getElementById('pingBtn').addEventListener('click', () => {
  fireSonar(innerWidth * 0.5, innerHeight * 0.44);
});

/* ---------------- 舷窗金属圈 + 铆钉 ---------------- */
function buildRing() {
  const pr = Math.min(innerWidth, innerHeight) * 0.38;
  const S = Math.ceil(pr * 2 + 44);
  const svg = document.getElementById('ring');
  svg.setAttribute('width', S); svg.setAttribute('height', S);
  svg.setAttribute('viewBox', `0 0 ${S} ${S}`);
  const c = S / 2, NS = 'http://www.w3.org/2000/svg';
  const body = document.getElementById('ringbody');
  body.innerHTML = '';
  const outer = document.createElementNS(NS, 'circle');
  outer.setAttribute('cx', c); outer.setAttribute('cy', c); outer.setAttribute('r', pr + 16);
  outer.setAttribute('fill', 'none'); outer.setAttribute('stroke', 'url(#steel)'); outer.setAttribute('stroke-width', 30);
  const hi = document.createElementNS(NS, 'circle');
  hi.setAttribute('cx', c); hi.setAttribute('cy', c); hi.setAttribute('r', pr + 4);
  hi.setAttribute('fill', 'none'); hi.setAttribute('stroke', 'rgba(159,216,255,.28)'); hi.setAttribute('stroke-width', 2);
  const inner = document.createElementNS(NS, 'circle');
  inner.setAttribute('cx', c); inner.setAttribute('cy', c); inner.setAttribute('r', pr - 1);
  inner.setAttribute('fill', 'none'); inner.setAttribute('stroke', 'rgba(0,0,0,.65)'); inner.setAttribute('stroke-width', 5);
  body.append(outer, hi, inner);
  const rg = document.getElementById('rivets');
  rg.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
    const rv = document.createElementNS(NS, 'circle');
    rv.setAttribute('cx', c + Math.cos(a) * (pr + 16));
    rv.setAttribute('cy', c + Math.sin(a) * (pr + 16));
    rv.setAttribute('r', 5.5);
    rv.setAttribute('fill', '#16344e');
    rv.setAttribute('stroke', 'rgba(159,216,255,.35)');
    rv.setAttribute('stroke-width', 1.5);
    rg.appendChild(rv);
  }
}
buildRing();

/* ---------------- 环境随深度变化 ---------------- */
function applyDepth(d) {
  const k = d / DEPTH_MAX;
  ambient.intensity = lerp(0.9, 0.1, k);
  topLight.intensity = lerp(1.15, 0.03, k);
  scene.fog.density = lerp(0.013, 0.045, k);
  scene.fog.color.lerpColors(fogShallow, fogDeep, k);
  for (const r of rays) r.material.opacity = r.userData.base * (1 - k);
  snowMat.opacity = lerp(0.85, 0.38, k);
  depthdim.style.opacity = (0.72 * k).toFixed(3);

  /* 生物可见度 */
  const whaleF = (d < 450 ? 1 : 0) * (1 - smooth(380, 450, d));
  whale.userData.op = lerp(whale.userData.op ?? 0, whaleF, 0.04);
  silMat.opacity = whale.userData.op * 0.96;
  spotMat.opacity = whale.userData.op * 0.95;

  fishMat.opacity = 0.7 * (1 - smooth(250, 380, d));

  const jellyF = smooth(150, 230, d) * (1 - smooth(740, 850, d));
  for (const j of jellies) {
    j.bellMat.opacity = 0.34 * jellyF;
    j.coreMat.opacity = 0.55 * jellyF;
    j.tentMat.opacity = 0.5 * jellyF;
  }

  const angF = smooth(520, 630, d);
  angSil.opacity = angF * 0.97;
  stalkMat.opacity = angF;
  bulbMat.opacity = angF;
  lureGlowMat.opacity = angF * (0.75 + 0.25 * Math.sin(perfT * 3.1));
  lureLight.intensity = angF * 9;
}

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
let perfT = 0;
const swayAmp = reduced ? 0 : 1;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  perfT += dt;
  const t = perfT;

  /* 深度平滑趋近 */
  depth += (targetDepth - depth) * Math.min(1, dt * 1.6);
  if (Math.abs(targetDepth - depth) < 0.4) depth = targetDepth;
  maxDepth = Math.max(maxDepth, depth);
  GUIDE.forEach((g, i) => { if (maxDepth >= g.need) unlockGuide(i); });
  applyDepth(depth);

  const dn = Math.round(depth);
  depthNum.textContent = dn;
  zoneName.textContent = zoneOf(depth);
  depthBar.style.width = (depth / DEPTH_MAX * 100).toFixed(1) + '%';

  /* 相机呼吸 */
  camera.position.x = Math.sin(t * 0.21) * 0.55 * swayAmp;
  camera.position.y = 0.5 + Math.sin(t * 0.16) * 0.4 * swayAmp;
  camera.lookAt(camera.position.x * 0.4, 0, -10);

  /* 浮游颗粒漂移 */
  const pa = snowGeo.attributes.position.array;
  for (let i = 0; i < SNOW_N; i++) {
    const s = snowSeed[i * 2], ph = snowSeed[i * 2 + 1];
    pa[i * 3 + 1] -= dt * (0.35 + s * 0.5) * (reduced ? 0.2 : 1);
    pa[i * 3] += Math.sin(t * 0.5 + ph) * dt * 0.35;
    if (pa[i * 3 + 1] < -20) pa[i * 3 + 1] = 20;
    if (pa[i * 3] > 34) pa[i * 3] = -34; else if (pa[i * 3] < -34) pa[i * 3] = 34;
  }
  snowGeo.attributes.position.needsUpdate = true;

  /* 气泡上升 */
  const ba = bubGeo.attributes.position.array;
  for (let i = 0; i < BUB_N; i++) {
    ba[i * 3 + 1] += dt * bubSpd[i];
    if (ba[i * 3 + 1] > 17) resetBubble(i, false);
  }
  bubGeo.attributes.position.needsUpdate = true;

  /* 光柱轻摆 */
  rays.forEach((r, i) => { r.rotation.z += Math.sin(t * 0.3 + i * 1.7) * dt * 0.02; });

  /* 鲸鱼巡游 */
  if (whale.userData.op > 0.01) {
    const w = whaleState;
    if (w.wait > 0) { w.wait -= dt; }
    else {
      whale.position.x += dt * 3.4 * w.dir * (reduced ? 0.3 : 1);
      if (whale.position.x > 46 || whale.position.x < -46) {
        w.dir *= -1;
        whale.rotation.y = w.dir > 0 ? 0 : Math.PI;
        whale.position.x = clamp(whale.position.x, -46, 46);
        w.wait = rand(6, 16);
      }
    }
    whale.position.y = -1 + Math.sin(t * 0.4) * 1.1;
    fluke.rotation.x = Math.sin(t * 1.7) * 0.42 * swayAmp || 0.001;
    spots.material.size = 0.5 + Math.sin(t * 2.4) * 0.08;
  }

  /* 鱼群 */
  if (fishMat.opacity > 0.01) {
    fishCenter.set(
      -4 + Math.sin(t * 0.13) * 10,
      Math.sin(t * 0.21 + 1) * 2.5,
      -12 + Math.cos(t * 0.1) * 2
    );
    for (let i = 0; i < FISH_N; i++) {
      const o = fishOff[i], ph = fishPhase[i];
      dummy.position.set(
        fishCenter.x + o.x + Math.sin(t * 1.3 + ph) * 0.7,
        fishCenter.y + o.y + Math.sin(t * 1.7 + ph * 1.3) * 0.5,
        fishCenter.z + o.z + Math.cos(t * 1.1 + ph) * 0.7
      );
      dummy.lookAt(dummy.position.x + 1, dummy.position.y + Math.sin(t * 2 + ph) * 0.2, dummy.position.z);
      dummy.updateMatrix();
      fishes.setMatrixAt(i, dummy.matrix);
    }
    fishes.instanceMatrix.needsUpdate = true;
  }
  fishes.visible = fishMat.opacity > 0.01;

  /* 水母 */
  for (const j of jellies) {
    if (j.bellMat.opacity < 0.01) { j.g.visible = false; continue; }
    j.g.visible = true;
    const pulse = Math.sin(t * 1.8 + j.phase);
    j.bell.scale.set(1 + pulse * 0.07, 1 - pulse * 0.14, 1 + pulse * 0.07);
    j.g.position.y = j.baseY + Math.sin(t * 0.5 + j.phase) * 1.1;
    j.g.position.x = j.baseX + Math.sin(t * 0.22 + j.phase * 2) * 1.6;
    for (const ln of j.tents) {
      const p = ln.geometry.attributes.position.array;
      const sw = Math.sin(t * 1.4 + ln.userData.phase) * 0.22;
      for (let s2 = 0; s2 < 8; s2++) {
        const a = ln.userData.a;
        p[s2 * 3] = Math.cos(a) * 0.95 * (1 - s2 / 14) + sw * (s2 / 8);
        p[s2 * 3 + 2] = Math.sin(a) * 0.95 * (1 - s2 / 14);
      }
      ln.geometry.attributes.position.needsUpdate = true;
    }
  }

  /* 鮟鱇鱼 */
  if (angSil.opacity > 0.01) {
    angler.visible = true;
    angler.position.x = 5 + Math.sin(t * 0.24) * 2.4;
    angler.position.y = -1.5 + Math.sin(t * 0.4 + 2) * 0.9;
    angler.rotation.z = Math.sin(t * 0.5) * 0.08;
    lureArm.rotation.x = Math.sin(t * 1.1) * 0.3;
    lureArm.rotation.z = -0.5 + Math.sin(t * 0.9) * 0.18;
  } else angler.visible = false;

  /* 声呐环扩散 */
  for (const r of ringPool) {
    if (!r.visible) continue;
    r.userData.age += dt;
    const a = r.userData.age;
    if (a > 1.7) { r.visible = false; continue; }
    const s = 1 + a * 20;
    r.scale.set(s, s, 1);
    r.material.opacity = 0.85 * (1 - a / 1.7);
  }
  for (const e of echoPool) {
    if (!e.visible) continue;
    const u = e.userData;
    u.age += dt;
    if (u.age < u.delay) { e.material.opacity = 0; continue; }
    const k2 = (u.age - u.delay) / u.life;
    if (k2 > 1) { e.visible = false; continue; }
    e.material.opacity = Math.sin(k2 * Math.PI) * 0.9;
  }

  renderer.render(scene, camera);
}
animate();

/* ---------------- loader / intro ---------------- */
let booted = false;
function boot() {
  if (booted) return; booted = true;
  document.getElementById('loader').classList.add('done');
  const els = document.querySelectorAll('[data-intro]');
  els.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 150 + i * 130));
}
requestAnimationFrame(() => setTimeout(boot, 700));
setTimeout(boot, 3800); // 兜底

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  buildRing();
});
