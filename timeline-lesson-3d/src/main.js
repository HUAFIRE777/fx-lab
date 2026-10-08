/* huafire3d fx-lab — original implementation · timeline-lesson-3d
 * 入口：DOM（顶栏/章节卡片/提示）+ 场景接线（拖拽惯性/点击节点/滚轮）。
 */
import * as THREE from 'three';
import { PALETTE, MOTION, COURSE, CHAPTERS } from './config.js';
import { TimelineScene } from './scene.js';

const $ = (s, r = document) => r.querySelector(s);
document.documentElement.classList.add('js');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const total = CHAPTERS.length;
let active = 0;
let scene = null;

/* ---------- 顶栏 ---------- */
$('#brandName').textContent = COURSE.brand;
$('#brandCode').textContent = COURSE.code;

function statusOf(k) {
  if (k < active) return '已完成';
  if (k === active) return '学习中';
  return '未解锁';
}

/* ---------- 章节卡片 ---------- */
const card = $('#card');
function renderCard(i) {
  const ch = CHAPTERS[i];
  card.innerHTML = `
    <div class="kick rise">第 ${ch.no} 章 · 共 ${total} 章</div>
    <h2 class="ctitle rise">${ch.title}</h2>
    <p class="cbody rise">${ch.desc}</p>
    <div class="cmeta rise">
      ${ch.meta.map(m => `<span>${m}</span>`).join('')}
      <span class="st">${statusOf(i)}</span>
    </div>
    <div class="cfoot rise">
      <button class="cbtn" id="prevBtn" ${i === 0 ? 'disabled' : ''}>← 上一章</button>
      <div class="cdots">${CHAPTERS.map((_, k) =>
        `<i class="${k === i ? 'on' : ''}${k < i ? 'done' : ''}" data-k="${k}" title="第${k + 1}章"></i>`).join('')}</div>
      <button class="cbtn primary" id="nextBtn" ${i === total - 1 ? 'disabled' : ''}>${i === total - 1 ? '完成课程 ✓' : '下一章 →'}</button>
    </div>`;
  $('#prevBtn').addEventListener('click', () => goTo(i - 1));
  $('#nextBtn').addEventListener('click', () => goTo(i + 1));
  card.querySelectorAll('.cdots i').forEach(d =>
    d.addEventListener('click', () => goTo(+d.dataset.k)));
  $('#chapCount').textContent = String(i + 1).padStart(2, '0') + ' — ' + String(total).padStart(2, '0');
  $('#topProgress').style.width = ((i + 1) / total * 100) + '%';
}

function floatCard(i) {
  renderCard(i);
  if (reduceMotion) return;
  gsap.fromTo(card,
    { y: 46, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.65, ease: 'expo.out', overwrite: true });
  gsap.fromTo(card.querySelectorAll('.rise'),
    { y: 22, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out', delay: 0.08, overwrite: true });
}

/* ---------- 跳转 ---------- */
function goTo(i, silentFx) {
  i = Math.max(0, Math.min(total - 1, i));
  const changed = i !== active;
  active = i;
  if (scene && !scene.dead) {
    const targetX = -i * scene.spacing;
    if (reduceMotion) { scene.line.position.x = targetX; scene.vel = 0; }
    else gsap.to(scene.line.position, {
      x: targetX, duration: MOTION.snapMs / 1000, ease: 'expo.out', overwrite: true,
      onComplete: () => { scene.vel = 0; },
    });
    if (changed && !silentFx) scene.activate(i);
    else scene.setProgress(i);
  }
  floatCard(i);
}

/* ---------- 拖拽 + 惯性 + 点击 ---------- */
function bindDrag() {
  const cv = $('#tlCanvas');
  let dragging = false, moved = 0, lastX = 0, lastT = 0, downX = 0, downY = 0;

  cv.addEventListener('pointerdown', e => {
    dragging = true; moved = 0;
    lastX = downX = e.clientX; downY = e.clientY; lastT = performance.now();
    scene.vel = 0;
    gsap.killTweensOf(scene.line.position);
    cv.setPointerCapture(e.pointerId);
    cv.classList.add('grabbing');
  });

  cv.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const now = performance.now();
    const dt = Math.max(1, now - lastT) / 1000;
    moved += Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) * 0.2;
    const dxw = dx * scene.pxToWorld;
    let x = scene.line.position.x + dxw;
    const m = 1.2; // 橡皮筋余量
    if (x > m) x = m; else if (x < scene.minX - m) x = scene.minX - m;
    scene.line.position.x = x;
    scene.vel = 0.75 * scene.vel + 0.25 * (dxw / dt);
    // 限速
    scene.vel = Math.max(-0.35, Math.min(0.35, scene.vel));
    lastX = e.clientX; lastT = now;
  });

  const end = e => {
    if (!dragging) return;
    dragging = false;
    cv.classList.remove('grabbing');
    if (moved < 8) {
      // 视为点击
      const idx = scene.pick(e.clientX, e.clientY);
      if (idx >= 0) { goTo(idx); return; }
    }
    // 松手：按最近节点吸附
    const cur = scene.line.position.x;
    let nearest = Math.round(-cur / scene.spacing);
    nearest = Math.max(0, Math.min(total - 1, nearest));
    // 有初速度且方向一致时多滑一格（惯性感）
    if (Math.abs(scene.vel) > 0.12) {
      const dir = scene.vel > 0 ? -1 : 1; // vel>0 是往右滑 → 节点索引减小
      const extra = nearest + dir;
      if (extra >= 0 && extra < total) nearest = extra;
    }
    scene.vel = 0;
    goTo(nearest);
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);

  // 滚轮横滚
  window.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) < 4 && Math.abs(e.deltaX) < 4) return;
    e.preventDefault();
    gsap.killTweensOf(scene.line.position);
    const dw = (e.deltaY + e.deltaX) * scene.pxToWorld * 1.6;
    let x = scene.line.position.x - dw;
    x = Math.max(scene.minX - 1.2, Math.min(1.2, x));
    scene.line.position.x = x;
    clearTimeout(window.__wt);
    window.__wt = setTimeout(() => {
      let nearest = Math.round(-scene.line.position.x / scene.spacing);
      nearest = Math.max(0, Math.min(total - 1, nearest));
      goTo(nearest);
    }, 160);
  }, { passive: false });

  // 键盘
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(active + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goTo(active - 1); }
  });
}

/* ---------- 启动 ---------- */
function init() {
  scene = new TimelineScene($('#tlCanvas'));
  if (scene.dead) {
    // WebGL 不可用：退化为纯 DOM 横向节点条
    document.body.classList.add('nogl');
  } else {
    bindDrag();
  }
  active = -1;
  goTo(0, true);
  if (!scene.dead) scene.activate(0);
  document.body.classList.add('loaded');
  setTimeout(() => document.body.classList.add('loaded'), 3000); // 完成态兜底
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
