// careers-3d · ESM 入口：星空背景 + 职位卡 3D 扇形入场 + 筛选翻转重排
import * as THREE from 'three';
import { CONFIG } from './config.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const EASE = 'cubic-bezier(.2,.8,.2,1)';

/* ---------- three：深蓝星空（程序化粒子，无外链） ---------- */
const glHost = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
glHost.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 60);
camera.position.z = 8;

const STAR_N = 700;
const sPos = new Float32Array(STAR_N * 3);
const sCol = new Float32Array(STAR_N * 3);
{
  const blue = new THREE.Color(CONFIG.palette.blue);
  const white = new THREE.Color(CONFIG.palette.white);
  const tmp = new THREE.Color();
  for (let i = 0; i < STAR_N; i++) {
    sPos[i * 3] = (Math.random() * 2 - 1) * 16;
    sPos[i * 3 + 1] = (Math.random() * 2 - 1) * 10;
    sPos[i * 3 + 2] = -Math.random() * 14;
    tmp.copy(Math.random() < 0.75 ? blue : white).multiplyScalar(0.35 + Math.random() * 0.65);
    sCol[i * 3] = tmp.r; sCol[i * 3 + 1] = tmp.g; sCol[i * 3 + 2] = tmp.b;
  }
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
  size: 0.055, vertexColors: true, transparent: true, opacity: 0.85,
  depthWrite: false, sizeAttenuation: true,
}));
scene.add(stars);

function tick3d(t) {
  stars.rotation.y = t * 0.008;
  stars.rotation.x = Math.sin(t * 0.05) * 0.02;
  renderer.render(scene, camera);
}

/* ---------- DOM 搭建 ---------- */
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

// 顶栏
const top = el('header', 'topbar',
  '<div class="brand"><span>' + CONFIG.brand + '</span><small>' + CONFIG.brandSub + '</small></div>' +
  '<div class="brand-en">CAREERS · 2026</div>');
document.body.appendChild(top);

// 首屏标题
const hero = el('section', 'hero',
  '<div class="eyebrow">我们在招人</div>' +
  '<h1>' + CONFIG.title + '</h1>' +
  '<p class="sub">' + CONFIG.subtitle + '</p>');
document.body.appendChild(hero);

// 筛选 pills
const pills = el('nav', 'pills');
pills.setAttribute('aria-label', '部门筛选');
let activeDept = '全部';
CONFIG.depts.forEach((d) => {
  const b = el('button', 'pill' + (d === '全部' ? ' on' : ''), d);
  b.addEventListener('click', () => { if (d !== activeDept) filterTo(d); });
  pills.appendChild(b);
});
document.body.appendChild(pills);

// 卡片舞台（3D 透视容器）
const stage = el('div', 'stage');
const grid = el('div', 'grid');
stage.appendChild(grid);
document.body.appendChild(stage);

const cardEls = CONFIG.jobs.map((job) => {
  const c = el('article', 'card', '');
  c.dataset.dept = job.dept;
  c.innerHTML =
    '<div class="card-dept">' + job.dept + '</div>' +
    '<h3>' + job.title + '</h3>' +
    '<div class="card-meta"><span>' + job.loc + '</span><span class="dot-sep">·</span><span class="salary">' + job.salary + '</span></div>' +
    '<div class="card-tags">' + job.tags.map((t) => '<span>' + t + '</span>').join('') + '</div>' +
    '<div class="card-more">查看详情 <i>→</i></div>';
  c.addEventListener('click', () => openDetail(job));
  grid.appendChild(c);
  return c;
});

// 页脚
const foot = el('footer', 'foot', '<p>' + CONFIG.applyNote + '</p>');
document.body.appendChild(foot);

// 装饰 + 加载态
const vg = el('div', 'vignette'); document.body.appendChild(vg);
const gr = el('div', 'grain'); document.body.appendChild(gr);
const loading = el('div', null,
  '<div class="spin"></div><div id="loadingText">正在整理职位</div>' +
  '<div class="load-track"><div id="loadBar"></div></div><div id="loadPct">0%</div>');
loading.id = 'loading'; loading.className = 'show';
document.body.appendChild(loading);
const loadBar = $('#loadBar'), loadPct = $('#loadPct');
let lp = 0;
const lt = setInterval(() => {
  lp = Math.min(90, lp + 9 + Math.random() * 9);
  loadBar.style.width = lp + '%'; loadPct.textContent = Math.round(lp) + '%';
}, 110);

// 详情弹窗
const overlay = el('div', 'overlay', '<div class="sheet" role="dialog" aria-modal="true"></div>');
document.body.appendChild(overlay);
const sheet = overlay.querySelector('.sheet');

function openDetail(job) {
  sheet.innerHTML =
    '<button class="sheet-x" aria-label="关闭">✕</button>' +
    '<div class="card-dept">' + job.dept + '</div>' +
    '<h3>' + job.title + '</h3>' +
    '<div class="card-meta"><span>' + job.loc + '</span><span class="dot-sep">·</span><span class="salary">' + job.salary + '</span></div>' +
    '<h4>这个岗位每天在做什么</h4><p>' + job.desc + '</p>' +
    '<h4>我们在找这样的人</h4><ul>' + job.reqs.map((r) => '<li>' + r + '</li>').join('') + '</ul>' +
    '<button class="btn-apply">投递简历</button>' +
    '<div class="apply-note">' + CONFIG.applyNote + '</div>';
  sheet.querySelector('.sheet-x').addEventListener('click', closeDetail);
  sheet.querySelector('.btn-apply').addEventListener('click', () => {
    toast(CONFIG.toastOk);
  });
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
  gsap.fromTo(sheet, { rotateX: -14, transformPerspective: 900, y: 40, opacity: 0, scale: 0.96 },
    { rotateX: 0, y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out' });
}
function closeDetail() {
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDetail(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });

// toast
const toastEl = el('div', 'toast');
document.body.appendChild(toastEl);
let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
}

/* ---------- 3D 扇形入场（核心动效） ---------- */
// 入场初始态全部由 JS 设置：CSS 里卡片默认完全可见，JS 挂了也不消失。
function fanIn(cards) {
  gsap.set(cards, { opacity: 0, rotateY: -38, rotateX: 12, z: -420, y: 60, transformOrigin: '50% 100%' });
  gsap.to(cards, {
    opacity: 1, rotateY: 0, rotateX: 0, z: 0, y: 0,
    duration: 1.05, ease: 'power3.out', stagger: { each: 0.07, from: 'center' },
  });
}

function filterTo(dept) {
  activeDept = dept;
  $$('.pill').forEach((p) => p.classList.toggle('on', p.textContent === dept));
  const visible = cardEls.filter((c) => dept === '全部' || c.dataset.dept === dept);
  const leaving = cardEls.filter((c) => !visible.includes(c));
  const tl = gsap.timeline();
  // 旧卡片翻转离场
  tl.to(cardEls, {
    opacity: 0, rotateY: 55, z: -260, y: 30, duration: 0.42, ease: 'power2.in',
    stagger: 0.028, overwrite: true,
    onComplete: () => {
      cardEls.forEach((c) => { c.style.display = visible.includes(c) ? '' : 'none'; });
      fanIn(visible);
    },
  });
  void leaving;
}

// 首屏入场
window.addEventListener('load', () => {
  clearInterval(lt);
  loadBar.style.width = '100%'; loadPct.textContent = '100%';
  setTimeout(() => {
    loading.style.opacity = '0';
    loading.style.pointerEvents = 'none';
    setTimeout(() => loading.remove(), 500);
    fanIn(cardEls);
  }, 300);
});
// 若 load 事件已被触发（缓存等），兜底
if (document.readyState === 'complete') window.dispatchEvent(new Event('load'));

/* ---------- 主循环 ---------- */
const clock = new THREE.Clock();
(function loop() {
  requestAnimationFrame(loop);
  tick3d(clock.getElapsedTime());
})();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
