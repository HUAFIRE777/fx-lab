// particle-morph-3d — src/main.js
// 同一套粒子在 4 个目标点云之间插值变形，自研 simplex 噪声呼吸 + additive 辉光。
// 参考 SAYELI 式"粒子聚成目标再炸开"手法，代码全部原创。
import * as THREE from 'three';

/* ============================================================
   0. 配置
   ============================================================ */
const IS_MOBILE = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
const COUNT = IS_MOBILE ? 12000 : 40000;
const MORPH_DUR = 2.4;          // 变形时长（秒）
const CAROUSEL_SEC = 6;         // 自动轮播间隔
const BASE_BREATH = 0.16;       // 常态呼吸振幅
const BURST_GAIN = 2.6;         // 切换中"炸开"峰值增益
const REPEL_RADIUS = 2.4;       // 鼠标斥力半径
const REPEL_STRENGTH = 1.1;

const C_PURPLE = new THREE.Color('#A78BFA');
const C_CYAN = new THREE.Color('#22D3EE');
const C_DIM = new THREE.Color('#3b3b55');

/* ============================================================
   1. 自研 tween（ease 物理感，不用 GSAP）
   ============================================================ */
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/* ============================================================
   2. 自研 3D simplex 噪声（按公开算法独立实现，非复制源码）
   ============================================================ */
class Simplex3 {
  constructor(seed = 1337) {
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    let s = (seed >>> 0) || 1;
    const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 255; i > 0; i--) {
      const j = (rand() * (i + 1)) | 0;
      const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
    }
    this.p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
    // 12 条 3D 梯度
    this.g = [
      1,1,0, -1,1,0, 1,-1,0, -1,-1,0,
      1,0,1, -1,0,1, 1,0,-1, -1,0,-1,
      0,1,1, 0,-1,1, 0,1,-1, 0,-1,-1,
    ];
  }
  noise(xin, yin, zin) {
    const { p, g } = this;
    const F = 1 / 3, G = 1 / 6;
    const s = (xin + yin + zin) * F;
    const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
    const t = (i + j + k) * G;
    const x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0)      { i1=1;j1=0;k1=0; i2=1;j2=1;k2=0; }
      else if (x0 >= z0) { i1=1;j1=0;k1=0; i2=1;j2=0;k2=1; }
      else               { i1=0;j1=0;k1=1; i2=1;j2=0;k2=1; }
    } else {
      if (y0 < z0)       { i1=0;j1=0;k1=1; i2=0;j2=1;k2=1; }
      else if (x0 < z0)  { i1=0;j1=1;k1=0; i2=0;j2=1;k2=1; }
      else               { i1=0;j1=1;k1=0; i2=1;j2=1;k2=0; }
    }
    const x1 = x0 - i1 + G,     y1 = y0 - j1 + G,     z1 = z0 - k1 + G;
    const x2 = x0 - i2 + 2 * G, y2 = y0 - j2 + 2 * G, z2 = z0 - k2 + 2 * G;
    const x3 = x0 - 1 + 3 * G,  y3 = y0 - 1 + 3 * G,  z3 = z0 - 1 + 3 * G;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let n = 0;
    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t0 > 0) { const gi = (p[ii+p[jj+p[kk]]] % 12) * 3; t0 *= t0; n += t0 * t0 * (g[gi]*x0 + g[gi+1]*y0 + g[gi+2]*z0); }
    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t1 > 0) { const gi = (p[ii+i1+p[jj+j1+p[kk+k1]]] % 12) * 3; t1 *= t1; n += t1 * t1 * (g[gi]*x1 + g[gi+1]*y1 + g[gi+2]*z1); }
    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t2 > 0) { const gi = (p[ii+i2+p[jj+j2+p[kk+k2]]] % 12) * 3; t2 *= t2; n += t2 * t2 * (g[gi]*x2 + g[gi+1]*y2 + g[gi+2]*z2); }
    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t3 > 0) { const gi = (p[ii+1+p[jj+1+p[kk+1]]] % 12) * 3; t3 *= t3; n += t3 * t3 * (g[gi]*x3 + g[gi+1]*y3 + g[gi+2]*z3); }
    return 32 * n;
  }
}
const simplex = new Simplex3(20261008);

/* ============================================================
   3. 4 个目标点云（全部预计算为 Float32Array）
   ============================================================ */
function sampleIcosahedron(n, radius) {
  const out = new Float32Array(n * 3);
  const geo = new THREE.IcosahedronGeometry(radius, 2);
  const pos = geo.getAttribute('position');
  const idx = geo.getIndex();
  const triCount = idx ? idx.count / 3 : pos.count / 3;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const t = (Math.random() * triCount) | 0;
    const v0 = idx ? idx.getX(t * 3) : t * 3;
    const v1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
    const v2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, v0); b.fromBufferAttribute(pos, v1); c.fromBufferAttribute(pos, v2);
    let u = Math.random(), v = Math.random();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;
    // 70% 贴面采样，30% 向内填充成团块
    const fill = Math.random() < 0.3 ? 0.55 + Math.random() * 0.45 : 1;
    out[i*3]   = (a.x*u + b.x*v + c.x*w) * fill;
    out[i*3+1] = (a.y*u + b.y*v + c.y*w) * fill;
    out[i*3+2] = (a.z*u + b.z*v + c.z*w) * fill;
  }
  geo.dispose();
  return out;
}

function sampleGalaxy(n, arms = 3, maxR = 4.6) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const arm = i % arms;
    const r = Math.pow(Math.random(), 0.65) * maxR + 0.15;
    const spin = r * 1.15;                       // 对数螺旋近似
    const branch = (arm / arms) * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * (0.9 - r * 0.12);
    const ang = branch + spin + jitter;
    const thick = (Math.random() - 0.5) * (1.4 - r * 0.22);
    out[i*3]   = Math.cos(ang) * r;
    out[i*3+1] = thick * 0.45;
    out[i*3+2] = Math.sin(ang) * r;
  }
  return out;
}

function sampleText(n, text) {
  // canvas 画字 → 像素采样
  const W = 640, H = 320;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${H * 0.62}px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, H / 2 + H * 0.02);
  const data = ctx.getImageData(0, 0, W, H).data;
  const hits = [];
  for (let y = 0; y < H; y += 2)
    for (let x = 0; x < W; x += 2)
      if (data[(y * W + x) * 4] > 128) hits.push(x, y);
  const out = new Float32Array(n * 3);
  const scaleX = 8.6 / W, scaleY = 4.3 / H;
  for (let i = 0; i < n; i++) {
    const h = ((Math.random() * (hits.length / 2)) | 0) * 2;
    out[i*3]   = (hits[h] - W / 2) * scaleX;
    out[i*3+1] = -(hits[h+1] - H / 2) * scaleY;
    out[i*3+2] = (Math.random() - 0.5) * 0.35;
  }
  return out;
}

function sampleTorus(n, R = 3.1, tube = 0.85) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    // 60% 表面采样，40% 管内填充
    const rr = Math.random() < 0.6 ? tube : tube * Math.sqrt(Math.random());
    const cx = (R + rr * Math.cos(v)) * Math.cos(u);
    const cy = rr * Math.sin(v);
    const cz = (R + rr * Math.cos(v)) * Math.sin(u);
    out[i*3] = cx; out[i*3+1] = cy; out[i*3+2] = cz;
  }
  return out;
}

const TARGETS = [
  { name: '二十面体', arr: sampleIcosahedron(COUNT, 3.4) },
  { name: '银河旋涡', arr: sampleGalaxy(COUNT) },
  { name: 'NOVA',     arr: sampleText(COUNT, 'NOVA') },
  { name: '星环',     arr: sampleTorus(COUNT) },
];

/* ============================================================
   4. 场景 / 粒子
   ============================================================ */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
renderer.setClearColor(0x06060b, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(0, 0.4, 11.5);

// 径向渐变精灵纹理（canvas 生成，零外部请求）
function makeSprite() {
  const s = 64, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  return tex;
}

const cur = new Float32Array(COUNT * 3);
const from = new Float32Array(COUNT * 3);
const to = new Float32Array(COUNT * 3);
const col = new Float32Array(COUNT * 3);

// 初始：从第一目标散开一点，首帧即有呼吸
cur.set(TARGETS[0].arr);
from.set(TARGETS[0].arr);
to.set(TARGETS[0].arr);
for (let i = 0; i < COUNT; i++) {
  const f = Math.random();
  const c = new THREE.Color().copy(C_PURPLE).lerp(Math.random() < 0.55 ? C_CYAN : C_DIM, f * 0.85);
  col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(cur, 3));
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
const mat = new THREE.PointsMaterial({
  size: IS_MOBILE ? 0.075 : 0.06,
  map: makeSprite(),
  vertexColors: true,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
});
const points = new THREE.Points(geo, mat);
scene.add(points);
points.rotation.x = 0.12;

/* ============================================================
   5. 变形状态机：炸开 → 聚拢
   ============================================================ */
let curTarget = 0;
let morphT = 1;              // 1 = 静止
let morphing = false;
let paused = false;
let carouselTimer = 0;

const btns = [...document.querySelectorAll('[data-target]')];
const pauseBtn = document.getElementById('pauseBtn');

function setActiveBtn(i) {
  btns.forEach((b, k) => b.classList.toggle('active', k === i));
}

function goTo(i) {
  i = ((i % TARGETS.length) + TARGETS.length) % TARGETS.length;
  if (i === curTarget && morphing) return;
  from.set(cur);
  to.set(TARGETS[i].arr);
  curTarget = i;
  morphT = 0;
  morphing = true;
  setActiveBtn(i);
}

btns.forEach((b) => b.addEventListener('click', () => { goTo(+b.dataset.target); pokeCarousel(); }));
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.classList.toggle('on', paused);
  pauseBtn.querySelector('span').textContent = paused ? '继续轮播' : '暂停轮播';
  if (!paused) carouselTimer = 0;
});
function pokeCarousel() { carouselTimer = 0; }

// 触屏：轻点画面切换下一个目标
let touchSX = 0, touchSY = 0;
canvas.addEventListener('touchstart', (e) => { touchSX = e.touches[0].clientX; touchSY = e.touches[0].clientY; }, { passive: true });
canvas.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchSX;
  const dy = e.changedTouches[0].clientY - touchSY;
  if (Math.hypot(dx, dy) < 14) { goTo(curTarget + 1); pokeCarousel(); }
}, { passive: true });

/* ============================================================
   6. 鼠标：斥力波纹 + 相机视差
   ============================================================ */
const mouse = { x: 9999, y: 9999, cx: 0, cy: 0 };
window.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.cx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.cy = -((e.clientY / window.innerHeight) * 2 - 1);
  // 换算到 z=0 平面的世界坐标
  const v = new THREE.Vector3(mouse.cx, mouse.cy, 0.5).unproject(camera);
  const dir = v.sub(camera.position).normalize();
  const t = -camera.position.z / dir.z;
  mouse.x = camera.position.x + dir.x * t;
  mouse.y = camera.position.y + dir.y * t;
});
window.addEventListener('pointerleave', () => { mouse.x = 9999; mouse.y = 9999; });

/* ============================================================
   7. 监视器（粒子数 / FPS，可关）
   ============================================================ */
const monitor = document.getElementById('monitor');
const fpsEl = document.getElementById('fps');
document.getElementById('pCount').textContent = COUNT.toLocaleString('en-US');
document.getElementById('monToggle').addEventListener('click', () => monitor.classList.toggle('hidden'));

/* ============================================================
   8. 主循环
   ============================================================ */
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // 窄屏拉远，保证团块完整入画
  camera.position.z = camera.aspect < 0.8 ? 14.8 : 11.5;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let last = performance.now();
let fpsEMA = 60, fpsTick = 0;
let elapsed = 0;
let firstFrame = true;
const loader = document.getElementById('loader');
const NS = 0.55; // 噪声空间缩放

function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  elapsed += dt;

  // FPS
  fpsEMA += ((1 / Math.max(dt, 1e-4)) - fpsEMA) * 0.06;
  if ((fpsTick += dt) > 0.5) { fpsTick = 0; fpsEl.textContent = Math.round(fpsEMA); }

  // 自动轮播
  if (!paused) {
    carouselTimer += dt;
    if (carouselTimer >= CAROUSEL_SEC) { carouselTimer = 0; goTo(curTarget + 1); }
  }

  // 变形进度：0→1，easing easeInOutCubic；噪声振幅中段峰值 = 炸开再聚拢
  let e = 1, burst = 0;
  if (morphing) {
    morphT = Math.min(morphT + dt / MORPH_DUR, 1);
    e = easeInOutCubic(morphT);
    burst = Math.sin(Math.PI * morphT);
    if (morphT >= 1) morphing = false;
  }
  const amp = BASE_BREATH * (1 + BURST_GAIN * burst);
  const t = elapsed;

  const mx = mouse.x, my = mouse.y;
  const R2 = REPEL_RADIUS * REPEL_RADIUS;

  for (let i = 0; i < COUNT; i++) {
    const ix = i * 3;
    const bx = from[ix] + (to[ix] - from[ix]) * e;
    const by = from[ix+1] + (to[ix+1] - from[ix+1]) * e;
    const bz = from[ix+2] + (to[ix+2] - from[ix+2]) * e;
    // simplex 呼吸（三轴独立相位）
    const nx = simplex.noise(bx * NS + t * 0.35, by * NS, bz * NS) * amp;
    const ny = simplex.noise(bx * NS, by * NS + t * 0.35, bz * NS + 7.3) * amp;
    const nz = simplex.noise(bx * NS + 3.1, by * NS, bz * NS + t * 0.35) * amp;
    let px = bx + nx, py = by + ny, pz = bz + nz;
    // 鼠标斥力波纹
    const dx = px - mx, dy = py - my;
    const d2 = dx * dx + dy * dy;
    if (d2 < R2 && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      const f = 1 - d / REPEL_RADIUS;
      const wave = Math.sin(t * 7 - d * 2.4) * f * REPEL_STRENGTH;
      px += (dx / d) * wave * f;
      py += (dy / d) * wave * f;
    }
    cur[ix] = px; cur[ix+1] = py; cur[ix+2] = pz;
  }
  geo.attributes.position.needsUpdate = true;

  // 相机视差 + 缓慢自转
  points.rotation.y = t * 0.05;
  camera.position.x += ((mouse.cx * 0.9) - camera.position.x) * 0.04;
  camera.position.y += ((0.4 + mouse.cy * 0.6) - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);

  if (firstFrame) {
    firstFrame = false;
    loader.classList.add('done');   // 加载态完成，必可达
    setTimeout(() => loader.remove(), 900);
  }
}

setActiveBtn(0);
requestAnimationFrame(tick);
