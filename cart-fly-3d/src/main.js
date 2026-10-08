// huafire3d fx-lab — original implementation · cart-fly-3d
// 加购飞入：卡片 3D 缩略沿二次贝塞尔抛物线飞入购物车 → 抽屉滑出 → 数字翻牌
import * as THREE from 'three';
import { PRODUCTS } from './config.js';
import { BUILDERS } from './products3d.js';

document.body.classList.add('js');

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof window.gsap !== 'undefined';

// ---------- 商品卡渲染 ----------
const grid = $('grid');
const thumbs = []; // { renderer, scene, camera, group, id, canvas, shot }

PRODUCTS.forEach((p) => {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <div class="thumb" data-thumb="${p.id}">
      <div class="thumb-fallback">${p.word}</div>
    </div>
    <div class="pname">${p.name}</div>
    <div class="pdesc">${p.desc}</div>
    <div class="prow">
      <div class="price">¥${p.price.toLocaleString('en-US')}</div>
      <button class="add" data-add="${p.id}">加入</button>
    </div>`;
  grid.appendChild(card);

  const holder = card.querySelector('.thumb');
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    const size = holder.clientWidth || 260;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(size, size);
    holder.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1c20, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(2.2, 3.2, 2.4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff5c1f, 1.1);
    rim.position.set(-3, 1.2, -2.4);
    scene.add(rim);

    const group = BUILDERS[p.id]();
    scene.add(group);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
    camera.position.set(0, 0.5, 2.7);
    camera.lookAt(0, 0.05, 0);

    const t = { renderer, scene, camera, group, id: p.id, holder, shot: null, done: false };
    thumbs.push(t);
    // 首帧后淡入 + 截一张小图给抽屉用
    requestAnimationFrame(() => {
      if (!t.done) {
        renderer.render(scene, camera);
        try { t.shot = renderer.domElement.toDataURL('image/png'); } catch (e) { /* 忽略 */ }
        t.done = true;
      }
      holder.classList.add('ready');
    });
  } catch (err) {
    console.warn('[cart-fly] WebGL unavailable for', p.id, err);
    holder.classList.add('webgl-fail', 'ready');
  }
});

// 统一渲染循环：慢速旋转 + 轻微浮动
const clock = new THREE.Clock();
(function loop() {
  requestAnimationFrame(loop);
  const t = clock.getElapsedTime();
  for (const th of thumbs) {
    th.group.rotation.y = t * 0.55;
    th.group.position.y = Math.sin(t * 1.3 + th.group.position.x) * 0.035;
    th.renderer.render(th.scene, th.camera);
  }
})();

// ---------- 购物车状态 ----------
const cart = new Map(); // id -> qty
const cartOf = (id) => PRODUCTS.find((p) => p.id === id);

function cartCount() {
  let n = 0;
  for (const q of cart.values()) n += q;
  return n;
}
function cartTotal() {
  let s = 0;
  for (const [id, q] of cart) s += cartOf(id).price * q;
  return s;
}

// ---------- 翻牌数字 ----------
const rollEl = $('totalRoll');
function renderRoll(total) {
  const str = total.toLocaleString('en-US');
  // 只在字符结构变化时重建（数字位 vs 逗号）
  const sig = str.replace(/\d/g, '#');
  if (rollEl.dataset.sig !== sig) {
    rollEl.dataset.sig = sig;
    rollEl.querySelectorAll('.digit,.sep').forEach((e) => e.remove());
    for (const ch of str) {
      if (ch === ',') {
        const s = document.createElement('span');
        s.className = 'sep';
        s.textContent = ',';
        rollEl.appendChild(s);
      } else {
        const d = document.createElement('div');
        d.className = 'digit';
        const strip = document.createElement('div');
        strip.className = 'strip';
        for (let i = 0; i <= 9; i++) {
          const sp = document.createElement('span');
          sp.textContent = i;
          strip.appendChild(sp);
        }
        d.appendChild(strip);
        rollEl.appendChild(d);
      }
    }
  }
  // 逐位拨到目标数字
  const digits = [...str].filter((c) => c !== ',');
  const cols = rollEl.querySelectorAll('.digit .strip');
  requestAnimationFrame(() => {
    cols.forEach((strip, i) => {
      strip.style.transform = `translateY(${-Number(digits[i])}em)`;
    });
  });
}

// ---------- 抽屉 ----------
const drawer = $('drawer'), scrim = $('scrim'), itemsEl = $('items');
function openDrawer() { drawer.classList.add('open'); scrim.classList.add('show'); }
function closeDrawer() { drawer.classList.remove('open'); scrim.classList.remove('show'); }
$('cartBtn').addEventListener('click', () => (drawer.classList.contains('open') ? closeDrawer() : openDrawer()));
$('closeDrawer').addEventListener('click', closeDrawer);
scrim.addEventListener('click', closeDrawer);

function renderCart() {
  const n = cartCount();
  const badge = $('cartCount');
  badge.textContent = n;
  badge.classList.toggle('show', n > 0);
  $('drawerCount').textContent = n;

  if (cart.size === 0) {
    itemsEl.innerHTML = `
      <div class="empty">
        <div class="basket">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 7h15l-1.6 8.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.2L5 4.8A1 1 0 0 0 4 4H2"/>
            <circle cx="9.5" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>
          </svg>
        </div>
        <p>购物车还空着<br>去挑几件顺眼的吧</p>
      </div>`;
  } else {
    itemsEl.innerHTML = '';
    for (const [id, q] of cart) {
      const p = cartOf(id);
      const th = thumbs.find((t) => t.id === id);
      const row = document.createElement('div');
      row.className = 'item';
      const imgHtml = th && th.shot
        ? `<img src="${th.shot}" alt="${p.name}">`
        : `<div class="iword">${p.word}</div>`;
      row.innerHTML = `
        ${imgHtml}
        <div class="item-info">
          <div class="n">${p.name}</div>
          <div class="p">¥${p.price.toLocaleString('en-US')} × ${q}</div>
        </div>
        <div class="stepper">
          <button data-dec="${id}" aria-label="减少">−</button>
          <b>${q}</b>
          <button data-inc="${id}" aria-label="增加">＋</button>
        </div>`;
      itemsEl.appendChild(row);
    }
  }
  renderRoll(cartTotal());
}

itemsEl.addEventListener('click', (e) => {
  const inc = e.target.dataset.inc, dec = e.target.dataset.dec;
  if (inc) cart.set(inc, cart.get(inc) + 1);
  else if (dec) {
    const q = cart.get(dec) - 1;
    if (q <= 0) cart.delete(dec); else cart.set(dec, q);
  } else return;
  renderCart();
});

// ---------- 抛物线飞入 ----------
const flyLayer = $('flyLayer');
function flyToCart(id, btn) {
  const th = thumbs.find((t) => t.id === id);
  const card = btn.closest('.card');
  const from = card.querySelector('.thumb').getBoundingClientRect();
  const to = $('cartBtn').getBoundingClientRect();

  const p0 = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
  const p2 = { x: to.left + to.width / 2, y: to.top + to.height / 2 };
  const ctrl = { x: (p0.x + p2.x) / 2, y: Math.min(p0.y, p2.y) - 150 };

  const land = () => {
    cart.set(id, (cart.get(id) || 0) + 1);
    renderCart();
    if (hasGsap && !reducedMotion) {
      gsap.fromTo('#cartCount', { scale: 1.7 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
    }
    openDrawer();
  };

  if (!hasGsap || reducedMotion || !th || !th.shot) { land(); return; }

  const size = Math.min(from.width * 0.7, 110);
  const el = document.createElement('img');
  el.className = 'fly-img';
  el.src = th.shot;
  el.style.left = `${p0.x - size / 2}px`;
  el.style.top = `${p0.y - size / 2}px`;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  flyLayer.appendChild(el);

  const st = { t: 0 };
  gsap.to(st, {
    t: 1, duration: 0.72, ease: 'power2.in',
    onUpdate() {
      const t = st.t, u = 1 - t;
      const x = u * u * p0.x + 2 * u * t * ctrl.x + t * t * p2.x;
      const y = u * u * p0.y + 2 * u * t * ctrl.y + t * t * p2.y;
      const s = 1 - 0.74 * t;
      el.style.transform = `translate(${x - p0.x}px, ${y - p0.y}px) scale(${s}) rotate(${t * 50}deg)`;
    },
    onComplete() { el.remove(); land(); },
  });
}

grid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  flyToCart(btn.dataset.add, btn);
  // 按钮即时反馈
  const old = btn.textContent;
  btn.textContent = '已加入 ✓';
  btn.classList.add('added');
  setTimeout(() => { btn.textContent = old; btn.classList.remove('added'); }, 1200);
});

// ---------- toast / 结算 ----------
let toastTimer = 0;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
$('checkout').addEventListener('click', () => {
  if (cart.size === 0) toast('购物车是空的，先挑一件吧');
  else toast(`共 ${cartCount()} 件，¥${cartTotal().toLocaleString('en-US')} —— 演示模板，就不真扣钱了`);
});

// ---------- 启动 ----------
renderCart();
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded')));
