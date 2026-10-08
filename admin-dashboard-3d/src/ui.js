// huafire3d fx-lab — original implementation
// UI 层：导航 / KPI 卡片（含 CSS 3D 迷你柱）/ 数字滚动 / feed / 漏斗 / 入场编排
import { CONFIG } from './config.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE_OUT = t => 1 - Math.pow(2, -10 * t); // easeOutExpo：物理感数字滚动

/* ---------- 数字格式化 ---------- */
export function fmt(v, kind) {
  if (kind === 'money0') return '¥' + Math.round(v).toLocaleString('zh-CN');
  if (kind === 'int') return Math.round(v).toLocaleString('zh-CN');
  if (kind === 'pct2') return (v * 100).toFixed(2) + '%';
  return String(v);
}
export function countUp(el, target, kind, ms) {
  if (reduced || ms <= 0) { el.textContent = fmt(target, kind); return; }
  const t0 = performance.now();
  (function tick(t) {
    const p = Math.min(1, (t - t0) / ms), e = p === 1 ? 1 : EASE_OUT(p);
    el.textContent = fmt(target * e, kind);
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

/* ---------- 侧边导航 ---------- */
const ICONS = {
  grid: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5"/><rect x="2" y="10" width="6" height="6" rx="1.5"/><rect x="10" y="10" width="6" height="6" rx="1.5"/></svg>',
  chart: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 15V9M8 15V5M13 15v-8" stroke-linecap="round"/></svg>',
  users: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6.5" cy="6" r="2.6"/><path d="M1.8 14c.6-2.6 2.4-4 4.7-4s4.1 1.4 4.7 4" stroke-linecap="round"/><circle cx="12.5" cy="7" r="2"/><path d="M12.6 10.2c2 .2 3.4 1.5 3.9 3.8" stroke-linecap="round"/></svg>',
  box: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 6 9 2.5 15.5 6v6L9 15.5 2.5 12z" stroke-linejoin="round"/><path d="M2.5 6 9 9.5 15.5 6M9 9.5v6"/></svg>',
  gear: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="9" r="2.4"/><path d="M9 1.8v2.4M9 13.8v2.4M1.8 9h2.4M13.8 9h2.4M3.9 3.9l1.7 1.7M12.4 12.4l1.7 1.7M14.1 3.9l-1.7 1.7M5.6 12.4l-1.7 1.7" stroke-linecap="round"/></svg>',
  pay: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="3.5" width="13" height="9" rx="2"/><path d="M1.5 6.5h13" /></svg>',
  user: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.8-2.8 2.7-4.2 5-4.2s4.2 1.4 5 4.2" stroke-linecap="round"/></svg>',
  warn: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2 14.5 13.5h-13z" stroke-linejoin="round"/><path d="M8 6.5v3.2" stroke-linecap="round"/><circle cx="8" cy="11.6" r=".9" fill="currentColor"/></svg>',
  up: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 13.5 8 8l3 3 2.5-2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 8.5h3v3" stroke-linecap="round"/></svg>',
};
export function renderNav() {
  $('#nav').innerHTML = CONFIG.nav.map(n =>
    `<button class="nav-item rise${n.active ? ' active' : ''}" data-id="${n.id}">${ICONS[n.icon]}<span class="lbl">${n.label}</span></button>`
  ).join('');
  $$('#nav .nav-item').forEach(b => b.addEventListener('click', () => {
    $$('#nav .nav-item').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  }));
}

/* ---------- KPI 卡片 ---------- */
function miniBars(values) {
  const max = Math.max(...values);
  return `<div class="mini3d" aria-hidden="true">${
    values.map(v => `<i data-h="${Math.max(4, Math.round(v / max * 36))}"></i>`).join('')
  }</div>`;
}
export function renderKPIs() {
  $('#kpis').innerHTML = CONFIG.kpis.map(k => {
    const good = k.invert ? k.delta < 0 : k.delta > 0;
    const arrow = k.delta >= 0 ? '▲' : '▼';
    return `<div class="kpi rise" id="kpi-${k.id}" data-kpi="${k.id}">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value" data-count="${k.value}" data-fmt="${k.format}">—</div>
      <div class="kpi-row">
        <span class="delta ${good ? 'up' : 'down'}">${arrow} ${Math.abs(k.delta).toFixed(1)}%</span>
        ${miniBars(k.spark)}
      </div>
    </div>`;
  }).join('');
}
export function animateKPIs() {
  CONFIG.kpis.forEach((k, i) => {
    const el = $(`#kpi-${k.id} .kpi-value`);
    setTimeout(() => countUp(el, k.value, k.format, CONFIG.motion.countupMs), i * 120);
  });
  // 迷你 2.5D 柱生长：stagger
  $$('.mini3d i').forEach((b, i) => setTimeout(() => {
    b.style.height = b.dataset.h + 'px';
  }, 400 + i * 40));
}
// 图表 hover 联动 KPI 高亮
export function linkKPI(id, on) {
  const el = document.getElementById('kpi-' + id);
  if (el) el.classList.toggle('linked', !!on);
}

/* ---------- 地区条 / 漏斗 ---------- */
export function renderRegions() {
  $('#regions').innerHTML = CONFIG.regions.map(r =>
    `<div class="region"><span class="rn">${r.name}</span><span class="rt"><i data-w="${r.pct}"></i></span><span class="rv">${r.pct}%</span></div>`
  ).join('');
}
export function renderFunnel() {
  $('#funnel').innerHTML = CONFIG.funnel.map(f =>
    `<div class="funnel-row"><span class="fl">${f.label}</span><span class="ft"><i data-w="${f.value}"></i></span><span class="fv">${f.value}%</span></div>`
  ).join('');
}
export function animateMeters() {
  $$('[data-w]').forEach((el, i) => setTimeout(() => { el.style.width = el.dataset.w + '%'; }, 500 + i * 90));
}

/* ---------- 实时 feed ---------- */
let feedTimer = null;
export function startFeed(onPush) {
  const ul = $('#feed');
  const push = () => {
    const t = CONFIG.feedTemplates[Math.floor(Math.random() * CONFIG.feedTemplates.length)];
    const li = document.createElement('li');
    const now = new Date();
    li.innerHTML = `<span class="fi ${t.icon === 'warn' ? 'warn' : t.icon === 'up' ? 'up' : ''}">${ICONS[t.icon]}</span>
      <div>${t.text}<time>${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}</time></div>`;
    ul.prepend(li);
    while (ul.children.length > CONFIG.motion.maxFeed) ul.lastChild.remove();
    if (onPush) onPush();
  };
  push(); push();
  if (!reduced) feedTimer = setInterval(push, CONFIG.motion.feedEveryMs);
  return () => feedTimer && clearInterval(feedTimer);
}

/* ---------- 入场编排 ---------- */
export function reveal() {
  const els = $$('.rise');
  els.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), i * CONFIG.motion.staggerMs));
}
export function hideBoot() {
  setTimeout(() => $('#boot').classList.add('gone'), CONFIG.motion.bootMs);
}
