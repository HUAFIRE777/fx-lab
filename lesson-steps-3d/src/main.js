/* huafire3d fx-lab — original implementation · lesson-steps-3d
 * 入口：搭步骤轨道 + 步骤卡片，接线点击 / 键盘 / 滚轮，驱动进度珠。
 */
import * as THREE from 'three';
import { PALETTE, MOTION, COURSE, STEPS } from './config.js';
import { Bead } from './bead.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

document.documentElement.classList.add('js');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 搭 DOM ---------- */
const railList = $('#railList');
STEPS.forEach((st, i) => {
  const b = document.createElement('button');
  b.className = 'node' + (i === 0 ? ' active' : '');
  b.dataset.i = i;
  b.setAttribute('aria-label', st.title);
  b.innerHTML = `<span class="dot"><i>${st.no}</i></span>
    <span class="nlabel"><b>${st.short}</b><small>STEP ${st.no}</small></span>`;
  b.addEventListener('click', () => goTo(i));
  railList.appendChild(b);
});
$('#brandName').textContent = COURSE.brand;
$('#brandCode').textContent = COURSE.code;
$('#courseTitle').textContent = COURSE.title;
$('#courseSub').textContent = COURSE.sub;

const total = STEPS.length;
let current = -1;
let centers = [];
let bead = null;
const trackFill = $('#trackFill');

/* ---------- 步骤卡片 ---------- */
const card = $('#card');
function renderCard(i) {
  const st = STEPS[i];
  card.innerHTML = `
    <div class="kick rise">第 ${st.no} 步 · 共 ${total} 步</div>
    <h2 class="ctitle rise">${st.title.replace(/^第 \d+ 步 · /, '')}</h2>
    ${st.body.map(p => `<p class="cbody rise">${p}</p>`).join('')}
    <div class="cmeta rise">${st.meta.map(m => `<span>${m}</span>`).join('')}</div>
    <div class="cfoot rise">
      <button class="cbtn" id="prevBtn" ${i === 0 ? 'disabled' : ''}>← 上一步</button>
      <div class="cdots">${STEPS.map((_, k) => `<i class="${k === i ? 'on' : ''}${k < i ? 'done' : ''}"></i>`).join('')}</div>
      <button class="cbtn primary" id="nextBtn" ${i === total - 1 ? 'disabled' : ''}>${i === total - 1 ? '已完成 ✓' : '下一步 →'}</button>
    </div>`;
  $('#prevBtn').addEventListener('click', () => goTo(i - 1));
  $('#nextBtn').addEventListener('click', () => goTo(i + 1));
  $$('.cdots i', card).forEach((d, k) => d.addEventListener('click', () => goTo(k)));
  $('#stepCount').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
}

/* ---------- 切换 ---------- */
function updateRail(i) {
  $$('.node', railList).forEach((n, k) => {
    n.classList.toggle('active', k === i);
    n.classList.toggle('done', k < i);
  });
  const c = centers[i];
  if (c != null) trackFill.style.height = c + 'px'; // centers 已是相对 rail 顶部的坐标
}

function flipCard(i) {
  if (reduceMotion) { renderCard(i); return; }
  const tl = gsap.timeline();
  tl.to(card, {
    rotationX: 38, y: 30, opacity: 0, duration: MOTION.flipOutMs / 1000,
    ease: 'power2.in', transformOrigin: '50% 100%',
  })
  .add(() => renderCard(i))
  .fromTo(card,
    { rotationX: -52, y: 36, opacity: 0 },
    { rotationX: 0, y: 0, opacity: 1, duration: MOTION.flipInMs / 1000, ease: 'expo.out' })
  // .rise 在 renderCard 之后才存在，必须懒求值，否则 GSAP 报 target not found
  .add(() => {
    gsap.fromTo(card.querySelectorAll('.rise'),
      { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out' });
  }, '-=0.5');
}

function goTo(i) {
  i = Math.max(0, Math.min(total - 1, i));
  if (i === current) return;
  const dist = current < 0 ? 0 : Math.abs(i - current);
  current = i;
  updateRail(i);
  flipCard(i);
  if (bead && !bead.dead && centers[i] != null) {
    const y = centers[i]; // canvas 与 rail 等高，y=0 即 rail 顶部
    if (reduceMotion || dist === 0) bead.place(y);
    else bead.rollTo(y, MOTION.beadBaseMs + dist * MOTION.beadPerStepMs);
  } else if (bead && bead.dead) {
    // WebGL 不可用时的 DOM 备用珠
    const fb = $('#beadFallback');
    if (fb && centers[i] != null) {
      gsap.to(fb, { top: centers[i], duration: 0.6, ease: 'expo.out', overwrite: true });
    }
  }
}

/* ---------- 布局：量出每个节点中心 ---------- */
function layout() {
  const rail = $('#rail');
  const rTop = rail.getBoundingClientRect().top;
  centers = $$('.node', railList).map(n => {
    const r = n.getBoundingClientRect();
    return r.top + r.height / 2 - rTop;
  });
  if (bead && !bead.dead) {
    bead.resize();
    if (current >= 0 && centers[current] != null) bead.place(centers[current]);
  }
  updateRail(Math.max(0, current));
}

/* ---------- 输入：键盘 / 滚轮 ---------- */
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
});
let wheelAcc = 0, lastWheel = 0;
$('#stage').addEventListener('wheel', e => {
  e.preventDefault();
  const now = performance.now();
  wheelAcc += e.deltaY;
  if (now - lastWheel > MOTION.wheelLockMs && Math.abs(wheelAcc) > 50) {
    goTo(current + (wheelAcc > 0 ? 1 : -1));
    lastWheel = now; wheelAcc = 0;
  }
}, { passive: false });

/* ---------- 启动 ---------- */
function init() {
  bead = new Bead($('#beadCanvas'), $('#beadFallback'));
  // 等字体与布局稳定再量位置
  requestAnimationFrame(() => {
    layout();
    current = -1;
    goTo(0);
    // 入场：轨道节点依次点亮
    if (!reduceMotion) {
      gsap.fromTo($$('.node', railList),
        { x: -18, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.15 });
    }
    document.body.classList.add('loaded');
  });
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
  // 完成态兜底：3 秒内无论如何显示内容
  setTimeout(() => document.body.classList.add('loaded'), 3000);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
