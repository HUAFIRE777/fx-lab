/* huafire3d fx-lab — original implementation */
/* collection-showcase: 入口 —— 初始化引擎、陈列网格、分类筛选、详情弹窗 */

import { CONFIG, CATEGORIES } from './config.js';
import { initViewer } from './viewer.js';
import { buildGrid, destroyGrid } from './grid.js';
import { initModal, openModal } from './modal.js';

let cards = [];
let activeCat = '全部';

function currentList() {
  return activeCat === '全部' ? CONFIG : CONFIG.filter((p) => p.category === activeCat);
}

function rebuild() {
  destroyGrid(cards);
  cards = buildGrid((product, view) => openModal(product, view), currentList());
}

function renderFilters() {
  const bar = document.getElementById('filters');
  bar.innerHTML = '';
  for (const c of CATEGORIES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (c === activeCat ? ' active' : '');
    b.textContent = c;
    b.addEventListener('click', () => {
      if (c === activeCat) return;
      activeCat = c;
      bar.querySelectorAll('.chip').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      rebuild();
    });
    bar.appendChild(b);
  }
}

function boot() {
  initViewer();
  initModal();
  renderFilters();
  cards = buildGrid((product, view) => openModal(product, view), currentList());
  document.getElementById('year').textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', boot);
