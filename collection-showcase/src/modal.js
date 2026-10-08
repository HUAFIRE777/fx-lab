/* huafire3d fx-lab — original implementation */
/* collection-showcase: 详情弹窗 —— 克隆卡片已加载的模型，大视口展示 + 拖拽旋转 */

import { makeView, unregisterView, setCardsPaused, elapsed } from './viewer.js';

let modalView = null;
let currentProduct = null;
let onCloseCb = null;

const modal = () => document.getElementById('modal');

function bindDrag(el, view) {
  let dragging = false, lx = 0, ly = 0;
  el.addEventListener('pointerdown', (e) => {
    dragging = true; lx = e.clientX; ly = e.clientY;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    view.userRY += dx * 0.008;
    view.userRX = Math.max(-0.6, Math.min(0.6, view.userRX + dy * 0.006));
    view.autoSpin = false;
    view.lastDrag = elapsed();
  });
  const up = () => { dragging = false; };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}

export function initModal({ onClose } = {}) {
  onCloseCb = onClose || null;
  const m = modal();
  m.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  m.querySelector('.modal-close').addEventListener('click', closeModal);
  m.querySelector('[data-act="close"]').addEventListener('click', closeModal);
  m.querySelector('[data-act="bag"]').addEventListener('click', () => {
    toast(`已加入购物袋：${currentProduct ? currentProduct.name : ''}（演示）`);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !m.hidden) closeModal();
  });
}

export function openModal(product, sourceView) {
  const m = modal();
  currentProduct = product;
  m.querySelector('.modal-info .cat').textContent = product.category;
  m.querySelector('.modal-info h2').textContent = product.name;
  m.querySelector('.modal-info .en').textContent = product.en;
  m.querySelector('.modal-info .desc').textContent = product.desc;
  m.querySelector('.modal-info .price').innerHTML =
    `<small>¥</small>${product.price.toLocaleString('zh-CN')}`;

  // 视口：克隆卡片里已加载好的模型（几何/材质共享引用，零二次下载）
  const viewEl = m.querySelector('.modal-view');
  modalView = makeView(viewEl, { bg: product.tint, fov: 32 });
  modalView.isModal = true;
  modalView.active = true;
  modalView.spinTarget = 0.7;
  modalView.spin = 0.7;
  if (sourceView && sourceView.pivot) {
    const clone = sourceView.pivot.clone(true);
    modalView.scene.add(clone);
    if (/[?&]debug=1/.test(location.search)) window.__fxClone = clone;
    // 复用卡片里的接触阴影
    const shadow = sourceView.scene.children.find(
      (o) => o.isMesh && o.material && o.material.transparent && o.geometry.type === 'PlaneGeometry'
    );
    if (shadow) modalView.scene.add(shadow.clone());
    modalView.pivot = clone;
    modalView.ready = true;
  }
  bindDrag(viewEl, modalView);

  setCardsPaused(true); // 弹窗打开时卡片暂停渲染
  document.body.style.overflow = 'hidden';
  m.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => m.classList.add('open')));
  m.querySelector('.modal-close').focus({ preventScroll: true });
}

export function closeModal() {
  const m = modal();
  if (m.hidden) return;
  m.classList.remove('open');
  setTimeout(() => {
    m.hidden = true;
    if (modalView) {
      unregisterView(modalView);
      modalView = null;
    }
    setCardsPaused(false);
    document.body.style.overflow = '';
    if (onCloseCb) onCloseCb();
  }, 320); // 等退场过渡播完
}

let toastTimer = null;
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
