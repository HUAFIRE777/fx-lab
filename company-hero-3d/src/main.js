/* huafire3d fx-lab — original implementation */
/* company-hero-3d · 主编排：loader → 星云先出 → 标题揭示 → 产品入场 */
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { applyCopy, playIntro, initScrollReveals } from './reveals.js';
import { createNebula } from './nebula.js';
import { loadProduct } from './product.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 760px)').matches;

applyCopy(CONFIG);

/* ---------- renderer / scene ---------- */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setClearColor(new THREE.Color(CONFIG.palette.bg), 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);
camera.position.set(0, 0.15, 7);

const nebula = createNebula(scene, CONFIG.particles, isMobile);
nebula.setPalette(CONFIG.palette.colA || '#cdd8f2', CONFIG.palette.accent, CONFIG.particles.colC);
const product = loadProduct(scene, CONFIG.model, isMobile);

/* ---------- 自适应 ---------- */
function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  const pr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2);
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  nebula.setPixelRatio(pr);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', fit);
fit();

/* ---------- 鼠标视差（lerp 跟随，有阻尼才有物理感） ---------- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
if (!isMobile && !reduced) {
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });
}

/* ---------- 主循环 ---------- */
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 2.4);
  mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 2.4);

  nebula.tick(t);
  product.tick(t, dt, mouse);

  /* 电影感慢镜头：相机极缓漂移 + 视差 */
  camera.position.x = Math.sin(t * 0.05) * 0.32 + mouse.x * 0.55;
  camera.position.y = 0.15 + Math.cos(t * 0.042) * 0.18 + mouse.y * 0.32;
  camera.lookAt(0.25, 0, 0);

  renderer.render(scene, camera);
}

/* ---------- 开场编排 ---------- */
const loader = document.getElementById('loader');
let started = false;
function start() {
  if (started) return;
  started = true;
  if (reduced) {
    frame(); /* 静态：只渲一帧 */
    loader.classList.add('done');
    playIntro({ reduced: true });
  } else {
    frame(); /* 先出一帧，背景不等标题 */
    requestAnimationFrame(() => {
      loader.classList.add('done');
      setTimeout(() => playIntro({ reduced: false }), 350);
      (function loop() { requestAnimationFrame(loop); frame(); })();
    });
  }
  initScrollReveals();
}
/* 开场不依赖 window load（大模型会拖慢 load）：模块执行即 DOM 就绪，700ms 后开场 */
setTimeout(start, 700);
setTimeout(start, 4000); /* 绝对兜底 */

/* ---------- 导航与锚点 ---------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = document.querySelector(id);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
  });
});
const cue = document.querySelector('.scroll-cue');
if (cue) cue.addEventListener('click', () => {
  const el = document.querySelector(cue.dataset.target || '#capabilities');
  if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
});
const toTop = document.getElementById('toTop');
if (toTop) toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
});
