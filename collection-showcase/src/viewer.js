/* huafire3d fx-lab — original implementation */
/* collection-showcase: 共享 WebGL 引擎 —— 一个 renderer，用剪刀区为每张卡片渲染独立视口 */

import * as THREE from 'three';
import { getShadowTexture } from './loader.js';

const isMobile =
  matchMedia('(max-width: 680px)').matches || matchMedia('(pointer: coarse)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const BASE_SPIN = reduceMotion ? 0 : 0.45; // 静息转速 rad/s
const HOVER_SPIN = reduceMotion ? 0 : 2.4; // 悬停加速转速

let renderer = null;
let cardsPaused = false;
const views = [];
const clock = new THREE.Clock();

export function initViewer() {
  // ?preserve=1：保留 drawing buffer，供自动化测试回读像素（生产环境默认关闭，省内存）
  const preserve = /[?&]preserve=1/.test(location.search);
  renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, preserveDrawingBuffer: preserve });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  document.getElementById('gl-stage').appendChild(renderer.domElement);
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) clock.getDelta(); // 回来时丢掉大时间步
  });
  requestAnimationFrame(tick);
}

/* 建一个视口（场景+灯光+相机），模型稍后由 attachModel 挂入 */
export function makeView(el, { bg = '#eceae4', fov = 34 } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc9bd, 1.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(2.6, 4.2, 3.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 1.0);
  rim.position.set(-3.2, 1.6, -2.4);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 60);
  const dist = 1.18 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  camera.position.set(dist * 0.3, dist * 0.24, dist * 0.92);
  camera.lookAt(0, -0.04, 0);

  const view = {
    el, scene, camera,
    pivot: null, ready: false, active: false,
    angle: Math.random() * Math.PI * 2, // 每张卡随机初始角度，不机械
    spin: BASE_SPIN, spinTarget: BASE_SPIN,
    userRX: 0, userRY: 0, autoSpin: true, lastDrag: 0,
    phase: Math.random() * Math.PI * 2, // 随机浮动相位
    floatAmp: 0.035 + Math.random() * 0.02, // 轻微随机浮动幅度
  };
  views.push(view);
  return view;
}

/* 模型挂入视口：加转盘组 + 接触阴影 */
export function attachModel(view, pivot) {
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 2.7),
    new THREE.MeshBasicMaterial({
      map: getShadowTexture(), transparent: true, depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.04;
  view.scene.add(shadow);
  view.scene.add(pivot);
  view.pivot = pivot;
  view.ready = true;
}

export function unregisterView(view) {
  const i = views.indexOf(view);
  if (i !== -1) views.splice(i, 1);
}

export function setCardsPaused(paused) {
  cardsPaused = paused;
}

export function elapsed() {
  return clock.elapsedTime;
}

/* 调试钩子（?debug=1）：暴露视口列表与渲染统计 */
if (/[?&]debug=1/.test(location.search)) {
  window.__fxViews = views;
  window.__fxStats = { frames: 0, draws: 0 };
}

export { BASE_SPIN, HOVER_SPIN };

function tick() {
  requestAnimationFrame(tick);
  if (document.hidden || !renderer) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const W = window.innerWidth, H = window.innerHeight;
  const pr = renderer.getPixelRatio();
  let drew = false;

  for (const v of views) {
    if (!v.ready || !v.active) continue;
    if (cardsPaused && !v.isModal) continue;
    const r = v.el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (r.bottom < -40 || r.top > H + 40 || r.right < -40 || r.left > W + 40) continue;

    const aspect = r.width / r.height;
    if (Math.abs(v.camera.aspect - aspect) > 0.01) {
      v.camera.aspect = aspect;
      v.camera.updateProjectionMatrix();
    }

    // 转速向目标 easing（物理感：快加速、慢回落不对称也可用，这里对称 lerp 已足够顺滑）
    v.spin += (v.spinTarget - v.spin) * Math.min(1, dt * 5);
    if (v.autoSpin) v.angle += v.spin * dt;
    // 弹窗拖拽后 2.5s 恢复自动旋转
    if (!v.autoSpin && t - v.lastDrag > 2.5) v.autoSpin = true;

    v.pivot.rotation.y = v.angle + v.userRY;
    v.pivot.rotation.x = v.userRX;
    v.pivot.position.y = Math.sin(t * 0.85 + v.phase) * v.floatAmp;

    const x0 = Math.max(0, Math.floor(r.left * pr));
    const x1 = Math.min(W * pr, Math.ceil(r.right * pr));
    const y0 = Math.max(0, Math.floor((H - r.bottom) * pr));
    const y1 = Math.min(H * pr, Math.ceil((H - r.top) * pr));
    if (x1 <= x0 || y1 <= y0) continue; // 完全在画布外
    const w = x1 - x0, h = y1 - y0;
    renderer.setScissorTest(true);
    renderer.setViewport(x0, y0, w, h);
    renderer.setScissor(x0, y0, w, h);
    renderer.render(v.scene, v.camera);
    drew = true;
    if (window.__fxStats) { window.__fxStats.frames++; if (v.isModal) window.__fxStats.draws++; }
  }
  if (drew) renderer.setScissorTest(false);
}
