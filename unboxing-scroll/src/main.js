// huafire3d fx-lab — original implementation
// 主入口：原生 scroll + rAF，滚动进度 p(0~1) 精确映射相机轨道与分解进度。
// p 是 scrollY 的纯函数 → 倒滚即回，天然可逆。无重型滚动库。

import { CONFIG } from './config.js';
import { createScene } from './scene.js';
import { createLabels } from './labels.js';

const $ = (s) => document.querySelector(s);

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches ||
    (navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) < 768);
}

// 静态三段式图文（reduced-motion 降级）：不初始化 WebGL
function mountStaticFallback() {
  document.body.classList.add('reduced');
  const host = $('#static-fallback');
  host.innerHTML = CONFIG.staticSections
    .map((s, i) => `<section><span class="n">0${i + 1}</span><h2>${s.title}</h2><p>${s.text}</p></section>`)
    .join('');
  $('#loader').style.display = 'none';
  window.__unboxReady = true; // 静态分支也有就绪标志
}

// 悬浮尘埃：确定性伪随机，大小/透明度/周期各异（手工空气感）
function mountDust() {
  const host = $('#dust');
  if (!host) return;
  let seed = 20261005;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('i');
    const sz = (1 + rnd() * 3).toFixed(1);
    s.style.left = (rnd() * 100).toFixed(2) + '%';
    s.style.top = (rnd() * 100).toFixed(2) + '%';
    s.style.width = sz + 'px';
    s.style.height = sz + 'px';
    s.style.opacity = (0.05 + rnd() * 0.12).toFixed(3);
    s.style.animationDuration = (7 + rnd() * 9).toFixed(2) + 's';
    s.style.animationDelay = (-rnd() * 10).toFixed(2) + 's';
    host.appendChild(s);
  }
}

async function main() {
  if (reducedMotion()) { mountStaticFallback(); return; }

  const mobile = isMobile();
  const stage = $('#stage');
  const canvas = $('#gl');
  const bar = $('#progress-fill');
  const caption = $('#phase-caption');
  const pct = $('#progress-pct');
  const loaderEl = $('#loader');
  const loaderNum = $('#loader-num');

  let scene = null;
  try {
    scene = await createScene(canvas, CONFIG, { isMobile: mobile }, (ev) => {
      if (ev.total) loaderNum.textContent = Math.round((ev.loaded / ev.total) * 100) + '%';
    });
  } catch (err) {
    loaderEl.innerHTML = `<div class="load-err">模型加载失败<br><small>${String(err.message || err)}</small></div>`;
    console.error('[unboxing]', err);
    return;
  }

  const labels = createLabels($('#tags'), $('#leaders'), scene.anchors, CONFIG.labels, scene.project);
  mountDust();

  // ---- 滚动度量 ----
  let stageTop = 0, stageRange = 1;
  function measure() {
    const r = stage.getBoundingClientRect();
    stageTop = r.top + window.scrollY;
    stageRange = Math.max(1, stage.offsetHeight - window.innerHeight);
    const w = stage.clientWidth, h = window.innerHeight;
    scene.resize(w, h);
  }
  measure();
  window.addEventListener('resize', measure, { passive: true });

  // 测试钩子：#p=0.5 直接跳到对应滚动位置（截图验证用，不影响正常使用）
  const mHash = location.hash.match(/p=([\d.]+)/);
  if (mHash) {
    const tp = Math.min(1, Math.max(0, parseFloat(mHash[1])));
    requestAnimationFrame(() => window.scrollTo(0, stageTop + tp * stageRange));
  }

  const progressOf = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    return Math.min(1, Math.max(0, (y - stageTop) / stageRange));
  };

  let lastPhase = '';
  const badge = $('#explode-badge');
  function frame() {
    const p = progressOf(); // 精确映射，无平滑 → 可逆
    const e = scene.update(p);
    labels.update(p, stage.clientWidth, window.innerHeight);
    bar.style.transform = `scaleX(${p})`;
    pct.textContent = Math.round(p * 100) + '%';
    badge.classList.toggle('on', e > 0.03 && e < 0.97);
    const ph = CONFIG.phases.find((x) => p < x.until).text;
    if (ph !== lastPhase) { caption.textContent = ph; lastPhase = ph; }
    requestAnimationFrame(frame);
  }

  loaderEl.classList.add('done');
  window.__unboxReady = true; // 自动化截图就绪标志
  window.__unboxScene = scene; // 调试钩子（CDP 验证用）
  requestAnimationFrame(frame);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
