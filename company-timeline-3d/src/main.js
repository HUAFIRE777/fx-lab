// huafire3d fx-lab — original implementation
// 时间线主逻辑：DOM 构建 / 滚动进度线 / 卡片入场 / 年份导航 / 3D 徽章。
import { CONFIG } from './config.js';
import { mountIcon } from './icons3d.js';

const $ = (s, r = document) => r.querySelector(s);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE_SMOOTH = reducedMotion ? 'auto' : 'smooth';

// ---------- 1. 按 CONFIG 构建 DOM ----------
$('#heroKicker').textContent = CONFIG.kicker;
$('#heroTitle').textContent = CONFIG.title;
$('#heroSub').textContent = CONFIG.subtitle;
$('#ynBrand').textContent = CONFIG.brand;
$('#outroSmall').textContent = CONFIG.outro;

const eventsEl = $('#tlEvents');
const pillsEl = $('#ynPills');
const sections = [];

CONFIG.events.forEach((ev, i) => {
  const side = i % 2 === 0 ? 'left' : 'right';

  const sec = document.createElement('section');
  sec.className = `ev side-${side}`;
  sec.id = `ev-${ev.year}`;

  const badge = document.createElement('div');
  badge.className = 'ev-badge is-loading';
  const canvas = document.createElement('canvas');
  canvas.className = 'ev-icon';
  canvas.setAttribute('aria-hidden', 'true');
  badge.appendChild(canvas);

  const card = document.createElement('article');
  card.className = 'ev-card';
  card.innerHTML =
    `<div class="ev-year" aria-hidden="true">${ev.year}</div>` +
    `<span class="ev-tag">${ev.tag}</span>` +
    `<h3 class="ev-title">${ev.title}</h3>` +
    `<p class="ev-desc">${ev.desc}</p>` +
    (ev.stat
      ? `<div class="ev-stat"><b>${ev.stat.value}</b><span>${ev.stat.label}</span></div>`
      : '');

  sec.appendChild(badge);
  sec.appendChild(card);
  eventsEl.appendChild(sec);
  sections.push({ sec, badge, canvas, ev });

  const pill = document.createElement('button');
  pill.className = 'yn-pill';
  pill.textContent = ev.year;
  pill.addEventListener('click', () => {
    sec.scrollIntoView({ behavior: EASE_SMOOTH, block: 'center' });
  });
  pillsEl.appendChild(pill);
});
const pills = [...pillsEl.children];

// ---------- 2. 卡片入场：3D 翻转（CSS transition，JS 只负责加类） ----------
const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    }
  }
}, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

if (reducedMotion) {
  sections.forEach(({ sec }) => sec.classList.add('is-in'));
} else {
  sections.forEach(({ sec }) => revealIO.observe(sec));
}

// ---------- 3. 滚动：进度线生长 + 当前年份高亮（可逆） ----------
const railFill = $('#railFill');
const timeline = $('#timeline');
let ticking = false;

function updateOnScroll() {
  ticking = false;
  const r = timeline.getBoundingClientRect();
  const vh = window.innerHeight;
  // 进度：视口 62% 处扫过时间线的比例；往回滚自动缩回
  const p = Math.min(1, Math.max(0, (vh * 0.62 - r.top) / r.height));
  railFill.style.height = `${(p * 100).toFixed(2)}%`;

  // 当前年份：徽章中心最接近视口 55% 线的事件
  let best = 0, bestDist = Infinity;
  sections.forEach(({ badge }, i) => {
    const d = Math.abs(badge.getBoundingClientRect().top + 32 - vh * 0.55);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  sections.forEach(({ badge }, i) => badge.classList.toggle('is-active', i === best));
  pills.forEach((pl, i) => pl.classList.toggle('is-active', i === best));

  // 兜底：快速滚动跳过 IO 阈值的卡片，顶部进入视口 92% 即强制显示，永不隐身
  sections.forEach(({ sec }) => {
    if (!sec.classList.contains('is-in') && sec.getBoundingClientRect().top < vh * 0.92) {
      sec.classList.add('is-in');
      revealIO.unobserve(sec);
    }
  });
}

function onScroll() {
  if (!ticking) { ticking = true; requestAnimationFrame(updateOnScroll); }
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
updateOnScroll();

// ---------- 4. 3D 徽章：进入视口才挂载渲染，离开暂停 ----------
const iconIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const m = e.target._iconMount;
    if (m) m.setVisible(e.isIntersecting);
  }
}, { rootMargin: '120px 0px' });

sections.forEach(({ badge, canvas, ev }) => {
  if (reducedMotion) {
    // 降级：静态列表，不加载 3D
    badge.classList.add('no3d');
    badge.classList.remove('is-loading');
    return;
  }
  // 懒挂载：首次进入视口再创建 WebGL 上下文
  const lazy = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      obs.disconnect();
      try {
        const mount = mountIcon(canvas, ev.icon, CONFIG.accent);
        canvas._iconMount = mount;
        iconIO.observe(canvas);
        mount.setVisible(true);
        mount.ready.then(() => {
          badge.classList.remove('is-loading');
          canvas.classList.add('is-ready');
        });
      } catch (err) {
        // WebGL 不可用：降级为金色圆点，不影响阅读
        badge.classList.add('no3d');
        badge.classList.remove('is-loading');
      }
    }
  }, { rootMargin: '200px 0px' });
  lazy.observe(badge);
});
