/* huafire3d fx-lab — original implementation */
/* product-compare：双品 3D 对比。
   渲染架构：单个 WebGLRenderer + scissor 分区画两个视口。
   选单 renderer 的理由：① 只占一个 GL 上下文（移动端上下文数有限，
   双 renderer 直接翻倍显存与上下文开销）；② 一套 RAF 循环统一调度，
   非激活视口可精确降帧；③ 环境贴图/阴影贴图等资源天然共享。 */

import * as THREE from 'three';
import { GLTFLoader } from '../vendor/addons/GLTFLoader.js';
import { DRACOLoader } from '../vendor/addons/DRACOLoader.js';
import { DRACO_WRAPPER_SRC, DRACO_WASM_B64 } from './draco-inline.gen.js';
import { PRODUCTS, SPECS, COPY } from './config.js';

/* ---------------- Draco 内联解码（wasm+wrapper 打进包，无外部路径） ---------------- */
const wasmBytes = Uint8Array.from(atob(DRACO_WASM_B64), (c) => c.charCodeAt(0));
class InlineDRACOLoader extends DRACOLoader {
  _loadLibrary(url) {
    if (url === 'draco_wasm_wrapper.js') return Promise.resolve(DRACO_WRAPPER_SRC);
    if (url === 'draco_decoder.wasm') return Promise.resolve(wasmBytes.buffer.slice(0));
    return super._loadLibrary(url);
  }
}
const gltfLoader = new GLTFLoader();
const dracoLoader = new InlineDRACOLoader();
gltfLoader.setDRACOLoader(dracoLoader);
dracoLoader.preload();

/* url -> Promise<Group>，同 URL 只请求一次；失败不缓存，允许重试 */
const modelCache = new Map();
function loadModel(url) {
  if (!modelCache.has(url)) {
    const p = gltfLoader.loadAsync(url).then((g) => g.scene).catch((e) => {
      modelCache.delete(url);
      throw e;
    });
    modelCache.set(url, p);
  }
  return modelCache.get(url);
}

/* ---------------- DOM ---------------- */
const $ = (s) => document.querySelector(s);
const stage = $('#stage');
const canvas = $('#gl');
const syncToggle = $('#syncToggle');
const diffToggle = $('#diffToggle');
const specTable = $('#specTable');
const specSummary = $('#specSummary');

let syncOn = true;

/* ---------------- Renderer（单例） ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (w > 0 && h > 0) renderer.setSize(w, h, false);
}
new ResizeObserver(resize).observe(stage);
resize();

/* ---------------- 环境反射：手搭小影棚 → PMREM（手法通用，实现原创） ---------------- */
function buildStudio() {
  const s = new THREE.Scene();
  const geo = new THREE.PlaneGeometry(1, 1);
  const panel = (color, intensity, w, h, x, y, z) => {
    const m = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    );
    m.material.color.set(color).multiplyScalar(intensity);
    m.scale.set(w, h, 1);
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(0xfff0da, 16, 7, 4.5, -6, 7, 5);   // 暖色主光
  panel(0xdde6ff, 5, 5, 3, 7, 2.5, 4);      // 冷色补光
  panel(0xffffff, 9, 9, 1.4, 0, 5, -7);    // 顶部轮廓条
  panel(0xffe9c4, 2.5, 10, 6, 0, -4, 3);    // 地面反光
  return s;
}
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(buildStudio(), 0.06).texture;
pmrem.dispose();

/* 柔和接触阴影：canvas 径向渐变，各视口共用一张贴图 */
function makeShadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,0.42)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.16)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const shadowTex = makeShadowTexture();

/* ---------------- 视口 ---------------- */
function makeRig() {
  return { theta: 0.65, phi: 1.08, radius: 4.8, tTheta: 0.65, tPhi: 1.08, tRadius: 4.8, dirty: true };
}

function makeViewport(side, product) {
  const el = document.querySelector(`.vp[data-side="${side}"]`);
  const scene = new THREE.Scene();
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);

  const key = new THREE.DirectionalLight(0xfff2df, 1.1);
  key.position.set(-4, 6, 5);
  scene.add(key, new THREE.HemisphereLight(0xdde4f0, 0x1a1a1e, 0.35));

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.04;
  scene.add(shadow);

  const vp = { side, el, scene, camera, rig: makeRig(), product, stateEl: el.querySelector('.vp-state') };
  setVpState(vp, 'loading', COPY.loading);
  loadModel(product.modelUrl)
    .then((obj) => {
      // 归一化：包围盒中心回原点，最大边缩到 2 个单位，两款产品视觉体量可比
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const s = 2 / (Math.max(size.x, size.y, size.z) || 1);
      obj.scale.setScalar(s);
      obj.position.sub(center.multiplyScalar(s));
      const pivot = new THREE.Group();
      pivot.add(obj);
      scene.add(pivot);
      setVpState(vp, 'ready');
    })
    .catch((err) => {
      console.warn(`[product-compare] ${side} 模型加载失败:`, err && err.message);
      setVpState(vp, 'error', COPY.loadError);
    });
  return vp;
}

function setVpState(vp, state, text) {
  const box = vp.stateEl;
  box.dataset.state = state;
  box.classList.toggle('hidden', state === 'ready');
  if (state === 'loading') {
    box.innerHTML = `<div class="shimmer"></div><p>${text}</p>`;
  } else if (state === 'error') {
    box.innerHTML = `<p class="err-title">${text}</p>` +
      `<p class="err-sub">请检查网络后重试</p>` +
      `<button class="retry" type="button">${COPY.retry}</button>`;
    box.querySelector('.retry').addEventListener('click', (e) => {
      e.stopPropagation();
      modelCache.delete(vp.product.modelUrl);
      setVpState(vp, 'loading', COPY.loading);
      loadModel(vp.product.modelUrl)
        .then((obj) => {
          const box3 = new THREE.Box3().setFromObject(obj);
          const size = box3.getSize(new THREE.Vector3());
          const center = box3.getCenter(new THREE.Vector3());
          const s = 2 / (Math.max(size.x, size.y, size.z) || 1);
          obj.scale.setScalar(s);
          obj.position.sub(center.multiplyScalar(s));
          const pivot = new THREE.Group();
          pivot.add(obj);
          vp.scene.add(pivot);
          setVpState(vp, 'ready');
        })
        .catch(() => setVpState(vp, 'error', COPY.loadError));
    }, { once: false });
  }
}

const viewports = [makeViewport('a', PRODUCTS.a), makeViewport('b', PRODUCTS.b)];

/* 铭牌 / 价格 */
for (const vp of viewports) {
  vp.el.querySelector('.vp-name').textContent = vp.product.name;
  vp.el.querySelector('.vp-tag').textContent = vp.product.tagline;
  vp.el.querySelector('.vp-price').textContent = vp.product.price;
}

/* ---------------- 轨道交互（手写，带惯性阻尼） ---------------- */
let activeSide = 'a';
let lastInteract = performance.now();
const pointers = new Map(); // pointerId -> {x, y, side}
let pinchDist = 0;

function clampPhi(v) { return Math.min(1.5, Math.max(0.18, v)); }
function clampRadius(v) { return Math.min(9, Math.max(2.6, v)); }

function applyRotate(side, dTheta, dPhi) {
  const targets = syncOn ? viewports : viewports.filter((v) => v.side === side);
  for (const vp of targets) {
    vp.rig.tTheta += dTheta;
    vp.rig.tPhi = clampPhi(vp.rig.tPhi + dPhi);
  }
}
function applyZoom(side, factor) {
  const targets = syncOn ? viewports : viewports.filter((v) => v.side === side);
  for (const vp of targets) vp.rig.tRadius = clampRadius(vp.rig.tRadius * factor);
}

for (const vp of viewports) {
  const el = vp.el;
  el.addEventListener('pointerdown', (e) => {
    try { el.setPointerCapture(e.pointerId); } catch (_) { /* 合成事件无真实 pointer */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, side: vp.side });
    if (pointers.size === 2) {
      const [p1, p2] = [...pointers.values()];
      pinchDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }
    activeSide = vp.side;
    lastInteract = performance.now();
  });
  el.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    lastInteract = performance.now();
    if (pointers.size === 2) {
      p.x = e.clientX; p.y = e.clientY;
      const [p1, p2] = [...pointers.values()];
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (pinchDist > 0) applyZoom(p.side, pinchDist / d);
      pinchDist = d;
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    applyRotate(p.side, -dx * 0.0052, -dy * 0.0052);
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    lastInteract = performance.now();
  };
  el.addEventListener('pointerup', endPointer);
  el.addEventListener('pointercancel', endPointer);
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    activeSide = vp.side;
    lastInteract = performance.now();
    applyZoom(vp.side, 1 + e.deltaY * 0.0011);
  }, { passive: false });
}

/* ---------------- 主循环：阻尼积分 + scissor 分区 + 非激活视口降帧 ---------------- */
const clock = new THREE.Clock();
let frame = 0;
const IDLE_MS = 3000;

function placeCamera(vp) {
  const r = vp.rig;
  const sp = Math.sin(r.phi), cp = Math.cos(r.phi);
  vp.camera.position.set(
    r.radius * sp * Math.sin(r.theta),
    r.radius * cp,
    r.radius * sp * Math.cos(r.theta)
  );
  vp.camera.lookAt(0, -0.1, 0);
}

function tick() {
  requestAnimationFrame(tick);
  frame++;
  const dt = Math.min(clock.getDelta(), 0.05);
  const now = performance.now();

  // 闲置 3s 后展台式缓慢自转（两侧同步）
  const dragging = pointers.size > 0;
  if (!dragging && now - lastInteract > IDLE_MS) {
    for (const vp of viewports) vp.rig.tTheta += dt * 0.22;
  }

  // 阻尼积分：物理惯性感，不用 linear
  const k = 1 - Math.exp(-dt * 9);
  const canvasRect = canvas.getBoundingClientRect();
  renderer.setScissorTest(true);

  for (const vp of viewports) {
    const r = vp.rig;
    const dT = (r.tTheta - r.theta) * k;
    const dP = (r.tPhi - r.phi) * k;
    const dR = (r.tRadius - r.radius) * k;
    if (Math.abs(dT) > 1e-5 || Math.abs(dP) > 1e-5 || Math.abs(dR) > 1e-5) r.dirty = true;
    r.theta += dT; r.phi += dP; r.radius += dR;

    // 非激活视口降帧：热视口每帧画，冷视口每 4 帧画一次（约 15fps）
    const hot = vp.side === activeSide || r.dirty || dragging || (now - lastInteract < 1500);
    if (!hot && frame % 4 !== 0) continue;

    const rect = vp.el.getBoundingClientRect();
    const x = rect.left - canvasRect.left;
    const y = canvasRect.bottom - rect.bottom;
    vp.camera.aspect = rect.width / rect.height;
    vp.camera.updateProjectionMatrix();
    placeCamera(vp);
    renderer.setViewport(x, y, rect.width, rect.height);
    renderer.setScissor(x, y, rect.width, rect.height);
    renderer.render(vp.scene, vp.camera);
    r.dirty = false;
  }
}
tick();

/* ---------------- 开关 ---------------- */
function bindSwitch(btn, initial, onChange) {
  let on = initial;
  const paint = () => {
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-checked', String(on));
  };
  btn.addEventListener('click', () => { on = !on; paint(); onChange(on); });
  paint();
}
bindSwitch(syncToggle, true, (on) => { syncOn = on; });
bindSwitch(diffToggle, false, (on) => {
  specTable.classList.toggle('hide-same', on);
  document.body.classList.toggle('diff-only', on);
});

/* ---------------- 对照表（CONFIG 驱动，差异自动判定） ---------------- */
function renderTable() {
  const thead = `<thead><tr><th class="c-param">参数</th>` +
    `<th>${PRODUCTS.a.name}</th><th>${PRODUCTS.b.name}</th></tr></thead>`;
  let diff = 0;
  const rows = SPECS.map((s) => {
    const isDiff = String(s.a) !== String(s.b);
    if (isDiff) diff++;
    return `<tr class="${isDiff ? 'diff' : 'same'}">` +
      `<td class="c-param">${s.label}</td><td>${s.a}</td><td>${s.b}</td></tr>`;
  }).join('');
  specTable.innerHTML = thead + `<tbody>${rows}</tbody>`;
  specSummary.textContent = COPY.diffSummary(diff, SPECS.length - diff);
}
renderTable();

/* 文案注入 */
$('#eyebrow').textContent = COPY.eyebrow;
$('#pageTitle').textContent = COPY.title;
$('#pageSub').textContent = COPY.subtitle;
$('#syncLabel').textContent = COPY.syncLabel;
$('#diffLabel').textContent = COPY.diffOnlyLabel;
$('#footnote').textContent = COPY.footnote;

/* 测试钩子（无头验证同步逻辑用，不影响页面） */
window.__pc = { viewports, get syncOn() { return syncOn; } };

/* ?debug=1：在角落显示两侧 rig 角度，供无头截图核验同步 */
if (new URLSearchParams(location.search).has('debug')) {
  const dbg = document.createElement('div');
  dbg.id = 'debugOverlay';
  dbg.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99;background:#000;color:#0f0;font:12px monospace;padding:6px 8px;border-radius:4px;';
  document.body.appendChild(dbg);
  setInterval(() => {
    const [a, b] = viewports;
    dbg.textContent = `sync=${syncOn} Aθ=${a.rig.theta.toFixed(3)} Bθ=${b.rig.theta.toFixed(3)} A=${a.stateEl.dataset.state} B=${b.stateEl.dataset.state}`;
  }, 250);
}
