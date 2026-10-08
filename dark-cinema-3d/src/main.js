/* dark-cinema-3d · 原创实现
 * 手法参考：Active Theory 式 Cinematic dark —— 深空暗场 + 粒子星云 + 远景发光剪影
 * + 缓慢电影运镜 + 强对比排印。代码全部原创重写，无拷贝。
 */
import * as THREE from 'three';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* ---------------- 配置 ---------------- */
const BLUE = 0x4D7CFE;
const INK = 0x050507;
const isMobile = Math.min(window.innerWidth, window.innerHeight) < 720;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CONF = {
  dprMax: isMobile ? 1.5 : 2,
  // 粒子：两种尺寸，additive，呼吸明暗；移动端降档
  big:   { count: isMobile ? 260  : 900,  size: 2.6, spread: 90,  baseOp: 0.85 },
  small: { count: isMobile ? 800  : 2400, size: 1.1, spread: 130, baseOp: 0.55 },
  grainEvery: isMobile ? 220 : 130,   // 噪点刷新间隔 ms
};

/* ---------------- 渲染器 / 场景 ---------------- */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONF.dprMax));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(INK, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(INK, 0.0045);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(0, 0, 20);

/* 柔光圆点 sprite（canvas 生成，零外部请求） */
function makeGlowSprite() {
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}
const glowTex = makeGlowSprite();

/* ---------------- 粒子星云（两种尺寸） ---------------- */
function makeNebula({ count, size, spread, baseOp }, phase) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const cWhite = new THREE.Color(0xf4f6ff);
  const cBlue = new THREE.Color(BLUE);
  const tmp = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // 球壳分布，制造深空纵深感
    const r = spread * (0.35 + 0.65 * Math.random());
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
    pos[i * 3 + 2] = -20 - Math.abs(r * Math.cos(ph)) * 0.9 - Math.random() * 60;
    // 蓝白随机混合，蓝偏多一点营造暗涌感
    tmp.copy(Math.random() < 0.42 ? cBlue : cWhite).multiplyScalar(0.55 + Math.random() * 0.45);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size, vertexColors: true, transparent: true, opacity: baseOp, map: glowTex,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, mat);
  pts.userData = { baseOp, phase };
  return pts;
}
const nebula = new THREE.Group();
const nebBig = makeNebula(CONF.big, 0);
const nebSmall = makeNebula(CONF.small, 2.1);
nebula.add(nebBig, nebSmall);
scene.add(nebula);

/* ---------------- 远景发光圆环剪影 ---------------- */
const ringGroup = new THREE.Group();
{
  const ringGeo = new THREE.TorusGeometry(30, 0.35, 8, 160);
  const ringMat = new THREE.MeshBasicMaterial({
    color: BLUE, wireframe: true, transparent: true, opacity: 0.18,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.35;
  ringGroup.add(ring);

  const innerGeo = new THREE.TorusGeometry(21, 0.18, 6, 128);
  const innerMat = new THREE.MeshBasicMaterial({
    color: BLUE, wireframe: true, transparent: true, opacity: 0.12,
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.rotation.x = Math.PI / 2.1;
  inner.rotation.y = 0.35;
  ringGroup.add(inner);

  ringGroup.position.set(6, 4, -150);
}
scene.add(ringGroup);

/* ---------------- 相机：电影运镜 ---------------- */
const cam = {
  mx: 0, my: 0, tx: 0, ty: 0,   // 鼠标视差（目标/当前）
  pushT: 0,                      // 章节呼吸推近 1→0
  chapter: 0,
};
// 30 秒一个循环的 dolly in/out + 轻微 pan
function cinematicPose(t) {
  const z = 20 - 2.6 * Math.sin((t / 30) * Math.PI * 2);          // dolly
  const x = 2.1 * Math.sin((t / 43) * Math.PI * 2 + 1.0);         // pan x
  const y = 1.0 * Math.sin((t / 37) * Math.PI * 2 + 0.4);         // pan y
  return { x, y, z };
}
window.addEventListener('pointermove', (e) => {
  cam.tx = (e.clientX / window.innerWidth - 0.5) * 2.4;
  cam.ty = -(e.clientY / window.innerHeight - 0.5) * 1.6;
}, { passive: true });
// 触屏：触摸点也给一点视差
window.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  if (t) { cam.tx = (t.clientX / window.innerWidth - 0.5) * 2.4; cam.ty = -(t.clientY / window.innerHeight - 0.5) * 1.6; }
}, { passive: true });

/* ---------------- 章节 ---------------- */
const chapters = $$('.chapter');
const dots = $$('#dots button');
function reveal(section) {
  section.querySelectorAll('.rev, .fade').forEach((el) => el.classList.add('is-in'));
}
function setChapter(i) {
  if (i === cam.chapter) return;
  cam.chapter = i;
  cam.pushT = 1;                       // 呼吸式推近
  reveal(chapters[i]);
  dots.forEach((d, k) => d.classList.toggle('on', k === i));
}
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) setChapter(chapters.indexOf(en.target));
  });
}, { threshold: 0.45 });
chapters.forEach((c) => io.observe(c));
dots.forEach((d) => d.addEventListener('click', () => {
  chapters[+d.dataset.to].scrollIntoView({ behavior: 'smooth' });
}));

/* ---------------- film grain（canvas 噪点） ---------------- */
const grain = $('#grain');
const gtx = grain.getContext('2d');
function paintGrain() {
  const w = 160, h = 90;
  grain.width = w; grain.height = h;
  const img = gtx.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
  }
  gtx.putImageData(img, 0, 0);
}
paintGrain();
setInterval(() => { if (!document.hidden) paintGrain(); }, CONF.grainEvery);

/* ---------------- 加载态：蓝线生长 → 展开成标题下划线 ---------------- */
const loader = $('#loader'), loadbar = $('#loadbar'), loadpct = $('#loadpct');
const heroTitle = $('#heroTitle');
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
function runLoader() {
  const dur = 1500, t0 = performance.now();
  return new Promise((resolve) => {
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = easeOutCubic(p);
      loadbar.style.width = (e * 100).toFixed(1) + '%';
      loadpct.textContent = String(Math.round(e * 100)).padStart(2, '0') + '%';
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    })(t0);
  });
}
function finishLoad() {
  loader.classList.add('done');
  heroTitle.classList.add('lit');       // 蓝线展开成标题下划线
  reveal(chapters[0]);
  setTimeout(() => loader.remove(), 1200);
}

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
let rafId = 0;
function frame() {
  rafId = requestAnimationFrame(frame);
  const t = clock.getElapsedTime();

  // 粒子呼吸：明暗起伏 + 整体极慢旋转
  for (const pts of [nebBig, nebSmall]) {
    const { baseOp, phase } = pts.userData;
    pts.material.opacity = baseOp + 0.16 * Math.sin(t * 0.55 + phase);
  }
  if (!reduceMotion) nebula.rotation.y = t * 0.008;

  // 圆环缓慢自转 + 微光呼吸
  ringGroup.rotation.z = t * 0.02;
  ringGroup.children.forEach((m, i) => {
    m.material.opacity = (i === 0 ? 0.18 : 0.12) + 0.04 * Math.sin(t * 0.4 + i * 1.7);
  });

  // 相机：电影运镜 + 鼠标视差（阻尼，有物理感）+ 章节呼吸推近
  cam.mx += (cam.tx - cam.mx) * 0.045;
  cam.my += (cam.ty - cam.my) * 0.045;
  if (cam.pushT > 0) cam.pushT = Math.max(0, cam.pushT - 0.012);
  const push = Math.sin(cam.pushT * Math.PI);   // 1→0 之间走一个正弦包络：推进再回
  if (reduceMotion) {
    camera.position.set(0, 0, 20);
  } else {
    const p = cinematicPose(t);
    camera.position.set(
      p.x + cam.mx,
      p.y + cam.my,
      p.z - 3.4 * push - cam.chapter * 1.1   // 章节越深，机位越近
    );
  }
  camera.lookAt(cam.mx * 0.4, cam.my * 0.4 - 2, -40);

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(rafId);
  else { clock.getDelta(); frame(); }
});

/* ---------------- 启动 ---------------- */
frame();
runLoader().then(() => requestAnimationFrame(() => setTimeout(finishLoad, 120)));
// 兜底：任何情况下 8 秒内完成态必达
setTimeout(() => {
  if (document.body.contains(loader)) finishLoad();
  chapters.forEach(reveal);
}, 8000);
