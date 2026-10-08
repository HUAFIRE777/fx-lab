// huafire3d fx-lab — original implementation · lookbook-scroll
// 纵向滚轮 → Lenis 平滑 → 横向轨道；每幕一件服装 3D + 大标题，视差分层
import * as THREE from 'three';
import { PANELS } from './config.js';
import { BUILDERS } from './garments.js';

document.body.classList.add('js');

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const track = $('track');

// ---------- 建幕 ----------
const stages = []; // { renderer, scene, camera, group, el }
PANELS.forEach((p) => {
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="bgword">${p.bgword}</div>
    <div class="copy">
      <div class="num">${p.num}<b>.</b></div>
      <div class="ptitle">${p.title}</div>
      <div class="pdesc">${p.desc}</div>
      <div class="pmeta">
        <span class="tag">${p.meta}</span><span class="dot"></span><span>${p.price}</span>
      </div>
    </div>
    <div class="stage" data-stage="${p.id}">
      <div class="stage-fallback">${p.word}</div>
    </div>`;
  track.appendChild(panel);

  const stageEl = panel.querySelector('.stage');
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const s = stageEl.clientWidth || 400;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(s, s);
    stageEl.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff8ec, 0x8a7a63, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb4552d, 0.9);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    const group = BUILDERS[p.id]();
    // 归一化：最低点统一落到 y=-0.5，悬浮陈列
    const box = new THREE.Box3().setFromObject(group);
    group.position.y -= (box.min.y + 0.5);
    scene.add(group);
    const baseY = group.position.y;

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30);
    camera.position.set(0, 1.05, 4.6);
    camera.lookAt(0, 0.72, 0);

    stages.push({ renderer, scene, camera, group, el: stageEl, seed: Math.random() * 10, baseY });
    requestAnimationFrame(() => stageEl.classList.add('ready'));
  } catch (err) {
    console.warn('[lookbook] WebGL unavailable for', p.id, err);
    stageEl.classList.add('webgl-fail', 'ready');
  }
});

// ---------- 横向映射 ----------
let progress = 0;
const panels = [...track.children];

function update() {
  const max = Math.max(1, track.scrollWidth - innerWidth);
  track.style.transform = `translate3d(${-progress * max}px, 0, 0)`;

  const idx = Math.min(PANELS.length - 1, Math.max(0, Math.round(progress * (PANELS.length - 1))));
  $('curNum').textContent = PANELS[idx].num;
  $('progBar').style.transform = `scaleX(${progress})`;

  panels.forEach((el, i) => {
    const local = progress * (PANELS.length - 1) - i; // 0 = 当前幕
    const copy = el.querySelector('.copy');
    const stage = el.querySelector('.stage');
    const bg = el.querySelector('.bgword');
    copy.style.transform = `translateX(${local * -70}px)`;
    stage.style.transform = `translateX(${local * 55}px)`;
    bg.style.transform = `translate(-50%,-50%) translateX(${local * -170}px)`;
    el.style.opacity = Math.max(0.1, 1 - Math.abs(local) * 0.85);
  });
}

function bindScroll(getY, getMax) {
  const onScroll = () => {
    const max = getMax();
    progress = max > 0 ? Math.min(1, Math.max(0, getY() / max)) : 0;
    update();
  };
  return onScroll;
}

let onScroll;
if (typeof window.Lenis !== 'undefined' && !reducedMotion) {
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  onScroll = bindScroll(() => lenis.scroll, () => lenis.limit);
  lenis.on('scroll', onScroll);
  window.__lenis = lenis;
} else {
  // 降级：原生滚动
  onScroll = bindScroll(
    () => window.scrollY,
    () => document.documentElement.scrollHeight - innerHeight
  );
  addEventListener('scroll', onScroll, { passive: true });
}

// ---------- 渲染循环 ----------
const clock = new THREE.Clock();
function raf() {
  requestAnimationFrame(raf);
  if (window.__lenis) window.__lenis.raf(performance.now());
  const t = clock.getElapsedTime();
  for (const st of stages) {
    if (!reducedMotion) {
      st.group.rotation.y = t * 0.4 + st.seed;
      st.group.position.y = st.baseY + Math.sin(t * 1.1 + st.seed) * 0.035;
    }
    st.renderer.render(st.scene, st.camera);
  }
}

// ---------- 启动 ----------
update();
onScroll();
raf();
addEventListener('resize', update);
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded')));
