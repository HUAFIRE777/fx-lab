/* huafire3d fx-lab — original implementation */
/* collection-showcase: 陈列网格 —— 卡片 DOM、视口懒加载、悬停加速、点击进详情 */

import { CONFIG } from './config.js';
import { loadModel, bustModel, normalizeModel } from './loader.js';
import { makeView, attachModel, unregisterView, HOVER_SPIN, BASE_SPIN } from './viewer.js';

const BROKEN_ICON = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"
  stroke-linecap="round" stroke-linejoin="round">
  <path d="M32 8 L56 20 v24 L32 56 L8 44 V20 Z"/>
  <path d="M8 20 L32 32 L56 20"/><path d="M32 32 V56"/>
  <path d="M24 24 l16 16 M40 24 L24 40"/></svg>`;

export function buildGrid(onCardClick, list = CONFIG) {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  const cards = [];

  for (const p of list) {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `查看${p.name}详情`);
    card.innerHTML = `
      <div class="view" data-id="${p.id}">
        ${p.tag ? `<span class="tag">${p.tag}</span>` : ''}
        <span class="badge3d">3D</span>
        <div class="skeleton"><div class="spin"></div></div>
        <div class="loadfail">
          ${BROKEN_ICON}
          <p>模型暂时无法加载<br>不影响其他商品浏览</p>
          <button type="button">重新加载</button>
        </div>
        <span class="hint3d">点击查看详情</span>
      </div>
      <div class="info">
        <div class="cat">${p.category}</div>
        <h3>${p.name}</h3>
        <div class="en">${p.en}</div>
        <div class="row">
          <div class="price"><small>¥</small>${p.price.toLocaleString('zh-CN')}</div>
          <span class="detail-link">查看详情 <span aria-hidden="true">→</span></span>
        </div>
      </div>`;

    const viewEl = card.querySelector('.view');
    const skeleton = card.querySelector('.skeleton');
    const loadfail = card.querySelector('.loadfail');
    const view = makeView(viewEl, { bg: p.tint });
    let loaded = false;

    const open = () => onCardClick(p, view);

    /* 悬停：卡片上浮（CSS）+ 模型加速旋转（JS easing） */
    card.addEventListener('mouseenter', () => { view.spinTarget = HOVER_SPIN; });
    card.addEventListener('mouseleave', () => { view.spinTarget = BASE_SPIN; });
    card.addEventListener('click', (e) => {
      if (e.target.closest('.loadfail button')) return; // 重试按钮不进详情
      open();
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    /* 进入视口才加载；离开视口暂停渲染（省 GPU） */
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        view.active = en.isIntersecting;
        if (en.isIntersecting && !loaded) {
          loaded = true;
          io.disconnect();
          loadModel(p.model)
            .then((scene) => {
              attachModel(view, normalizeModel(scene));
              skeleton.classList.add('done');
            })
            .catch(() => {
              skeleton.classList.add('done');
              loadfail.classList.add('show');
            });
        }
      }
    }, { rootMargin: '120px', threshold: 0.02 });
    io.observe(viewEl);

    /* 失败占位：重试 */
    loadfail.querySelector('button').addEventListener('click', (e) => {
      e.stopPropagation();
      loadfail.classList.remove('show');
      skeleton.classList.remove('done');
      bustModel(p.model);
      loadModel(p.model)
        .then((scene) => {
          attachModel(view, normalizeModel(scene));
          skeleton.classList.add('done');
        })
        .catch(() => {
          skeleton.classList.add('done');
          loadfail.classList.add('show');
        });
    });

    grid.appendChild(card);
    card._view = view; // 测试/调试钩子：外部可读取该卡片的 3D 视口状态
    cards.push({ card, view, io });
  }
  return cards;
}

export function destroyGrid(cards) {
  for (const { card, view, io } of cards) {
    io.disconnect();
    unregisterView(view);
    card.remove();
  }
}
