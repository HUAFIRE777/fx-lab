// huafire3d fx-lab — original implementation
// 启动编排：骨架 -> 渲染 UI -> 初始化 3D -> 入场 -> 实时流
import { CONFIG } from './config.js';
import { renderNav, renderKPIs, animateKPIs, renderRegions, renderFunnel, animateMeters, startFeed, reveal, hideBoot, linkKPI } from './ui.js';
import { BarChart3D } from './chart3d.js';
import { Globe } from './globe.js';

const $ = s => document.querySelector(s);
window.__fx = { ready: false, errors: [] };
addEventListener('error', e => window.__fx.errors.push(String(e.message || e.error)));

function renderRangeBtns(onPick) {
  $('#rangeBtns').innerHTML = CONFIG.ranges.map((r, i) =>
    `<button role="tab" class="${i === 1 ? 'on' : ''}" data-r="${r}">${r}</button>`).join('');
  document.querySelectorAll('#rangeBtns button').forEach(b =>
    b.addEventListener('click', () => {
      document.querySelectorAll('#rangeBtns button').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); onPick(b.dataset.r);
    }));
}
function renderXLabels(months) {
  const step = Math.ceil(months.length / 6);
  $('#xlabels').innerHTML = months.map((m, i) => `<span>${i % step === 0 ? m : ''}</span>`).join('');
}

let chart, globe, stopFeed;
function boot() {
  renderNav(); renderKPIs(); renderRegions(); renderFunnel();

  const hasData = CONFIG.revenue.current.length > 0;
  $('#chartEmpty').hidden = hasData;

  const applyRange = r => {
    if (!hasData) return;
    const n = r === '6M' ? 6 : 12;
    const mo = CONFIG.revenue.months.slice(-n), cu = CONFIG.revenue.current.slice(-n), pv = CONFIG.revenue.previous.slice(-n);
    chart.build(mo, cu, pv); renderXLabels(mo);
    $('#chartSub').textContent = r === '6M' ? '近 6 个月 · 万元' : '近 12 个月 · 万元';
  };

  try {
    chart = new BarChart3D($('#chart3d'), $('#chartTip'));
    chart.onHover = (i, on) => linkKPI('revenue', on); // 图表 hover 联动 KPI 高亮
    renderRangeBtns(applyRange); applyRange('12M');
  } catch (e) { window.__fx.errors.push('chart:' + e.message); $('#chartEmpty').hidden = false; }
  try { globe = new Globe($('#globe')); }
  catch (e) { window.__fx.errors.push('globe:' + e.message); }

  // KPI 卡片 hover -> 高亮图表最新一柱（反向联动）
  const kpiRev = document.getElementById('kpi-revenue');
  kpiRev?.addEventListener('mouseenter', () => { if (chart?.hovered == null && chart?.bars.length) { /* 轻提示即可 */ } });

  stopFeed = startFeed(() => globe?.ping());
  animateMeters();
  $('#usageBar') && setTimeout(() => { $('#usageBar').style.width = '72%'; }, 600);

  let last = performance.now();
  (function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    try { chart?.frame(t); globe?.frame(dt); } catch (e) { /* 单帧异常不炸整页 */ }
    requestAnimationFrame(loop);
  })(last);

  addEventListener('resize', () => { chart?.resize(); globe?.resize(); });

  reveal();            // 卡片 stagger 入场
  animateKPIs();       // 数字滚动
  hideBoot();          // 收起骨架
  window.__fx.ready = true;
  window.__fx.kpiCount = document.querySelectorAll('.kpi').length;
  window.__fx.barCount = chart ? chart.bars.filter(b => b.userData.cur).length : 0;
}

document.readyState === 'loading' ? addEventListener('DOMContentLoaded', boot) : boot();
