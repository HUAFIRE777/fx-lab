// culture-values-3d · ESM 入口：粒子几何体 + Lenis 平滑滚动 + 滚动驱动 morph
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { buildShapes, makeSprite, morphInto } from './morph.js';
import { buildDOM, setActive } from './ui.js';

const $ = (s) => document.querySelector(s);
const EASE = 'cubic-bezier(.2,.8,.2,1)';

// ---------- three 场景 ----------
const glHost = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
glHost.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 50);
camera.position.set(0, 0, 6.4);

const group = new THREE.Group();
scene.add(group);

const COUNT = CONFIG.points;
const shapes = buildShapes(COUNT);
const posAttr = new Float32Array(COUNT * 3);
const colAttr = new Float32Array(COUNT * 3);
{
  const clay = new THREE.Color(CONFIG.palette.clay);
  const ink = new THREE.Color(CONFIG.palette.ink);
  const tmp = new THREE.Color();
  for (let i = 0; i < COUNT; i++) {
    tmp.copy(clay).lerp(ink, (i % 7 === 0) ? 0.35 : Math.random() * 0.12);
    colAttr[i * 3] = tmp.r; colAttr[i * 3 + 1] = tmp.g; colAttr[i * 3 + 2] = tmp.b;
  }
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(posAttr, 3));
geo.setAttribute('color', new THREE.BufferAttribute(colAttr, 3));
const mat = new THREE.PointsMaterial({
  size: CONFIG.pointSize,
  map: makeSprite(),
  vertexColors: true,
  transparent: true,
  opacity: 0.92,
  depthWrite: false,
  sizeAttenuation: true,
});
const points = new THREE.Points(geo, mat);
group.add(points);

// 粒子在屏上大小跟随视口（保持"呼吸感"）
function fitPointSize() {
  mat.size = CONFIG.pointSize * (Math.min(window.innerWidth, window.innerHeight) / 900);
}
fitPointSize();

// ---------- DOM ----------
const { loading } = buildDOM();
const loadBar = $('#loadBar'), loadPct = $('#loadPct');
let loadShown = 0;
const loadTimer = setInterval(() => {
  loadShown = Math.min(92, loadShown + 8 + Math.random() * 10);
  loadBar.style.width = loadShown + '%';
  loadPct.textContent = Math.round(loadShown) + '%';
}, 120);

// ---------- Lenis 平滑滚动 ----------
const lenis = new Lenis({ autoRaf: true, lerp: 0.09, smoothWheel: true });
window.__cvScrollTo = (i) => {
  const target = document.getElementById('val-' + i);
  if (target) lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 3) });
};

// ---------- 滚动 → morph 映射 ----------
const NVAL = CONFIG.values.length;
let activeIdx = -1;
function progressToT() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return 0;
  const p = Math.min(1, Math.max(0, window.scrollY / max));
  return p * (NVAL - 1);
}
function onScrollFrame() {
  const t = progressToT();
  morphInto(posAttr, shapes, t);
  geo.attributes.position.needsUpdate = true;
  const idx = Math.min(NVAL - 1, Math.max(0, Math.round(t)));
  if (idx !== activeIdx) { activeIdx = idx; setActive(idx); }
  // 几何体偏右，移动端居中
  group.position.x = window.innerWidth <= 760 ? 0 : 1.35;
  group.position.y = window.innerWidth <= 760 ? 0.9 : 0;
}

// ---------- 主循环 ----------
const clock = new THREE.Clock();
let firstFrame = true;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  onScrollFrame();
  // 缓慢自转 + 呼吸浮动：物理感，不用 linear 直线
  group.rotation.y += dt * 0.12;
  group.rotation.x = Math.sin(t * 0.35) * 0.08;
  group.position.z = Math.sin(t * 0.5) * 0.08;
  renderer.render(scene, camera);
  if (firstFrame) {
    firstFrame = false;
    clearInterval(loadTimer);
    loadBar.style.width = '100%'; loadPct.textContent = '100%';
    setTimeout(() => {
      loading.style.opacity = '0';
      loading.style.pointerEvents = 'none';
      setTimeout(() => loading.remove(), 500);
    }, 350);
  }
}
tick();
setActive(0);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  fitPointSize();
});

// 减少动态偏好：停转自转，只做滚动 morph
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  group.rotation.y = 0.6;
}
