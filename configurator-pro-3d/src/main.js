// configurator-pro-3d · src/main.js
// 「玖时 MERIDIAN」实时 3D 腕表配置器 —— 全部原创实现。
// 手法参考：电商获奖 3D 配置器（GLB 模型 + 材质槽切换 + 环境光 + orbit），
// 代码未复制任何第三方模板实现：orbit 为自研（拖拽旋转/滚轮缩放/惯性），
// 阴影为 radial 纹理平面模拟，材质过渡为逐帧 lerp。

import * as THREE from 'three';
import { GLTFLoader } from '../vendor/addons/loaders/GLTFLoader.js';
import { InlineDRACOLoader } from './inline-draco.js';

/* ================= 基础工具 ================= */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
// 帧率无关的指数趋近：k 越大越快
const damp = (cur, target, k, dt) => lerp(cur, target, 1 - Math.exp(-k * dt));
const dampColor = (color, target, k, dt) => {
  color.r = damp(color.r, target.r, k, dt);
  color.g = damp(color.g, target.g, k, dt);
  color.b = damp(color.b, target.b, k, dt);
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const forceProcedural = new URLSearchParams(location.search).has('procedural');

/* ================= 配置数据 ================= */
const MODEL_URL = 'https://models.eazyopc.com/3d-assets-gallery/models-web/hero/tripo_watch.glb';

const DIALS = [
  { name: '曜石黑', color: '#232326', price: 0 },
  { name: '象牙白', color: '#ECE4D2', price: 0 },
  { name: '深海蓝', color: '#1E3A5E', price: 500 },
  { name: '墨绿',   color: '#23402E', price: 500 },
  { name: '赭石',   color: '#C2410C', price: 500 },
  { name: '酒红',   color: '#7C2230', price: 500 },
];
const STRAPS = [
  { id: 'leather', name: '意大利皮革', note: '头层小牛皮，手工缝线', price: 800,  rough: 0.72, metal: 0.0, tex: 'leather' },
  { id: 'metal',   name: '精钢链带',   note: '316L 精钢，拉丝打磨',   price: 2000, rough: 0.32, metal: 0.92, tex: 'brushed' },
  { id: 'nylon',   name: '尼龙织带',   note: '弹道尼龙，轻量透气',     price: 0,    rough: 0.92, metal: 0.0, tex: 'weave' },
];
const ENVS = [
  { id: 'studio', name: '影棚', bg: '#F4F4F2', key: ['#ffffff', 2.2], fill: ['#dfe8ff', 0.65], rim: ['#fff1de', 1.25], hemi: 0.55, exposure: 1.0,  shadow: 0.26 },
  { id: 'dusk',   name: '黄昏', bg: '#2E2118', key: ['#ffb36b', 1.9], fill: ['#5a6f9e', 0.5],  rim: ['#ff8c42', 1.7],  hemi: 0.28, exposure: 1.06, shadow: 0.34 },
  { id: 'night',  name: '夜晚', bg: '#0F0F13', key: ['#cfe0ff', 0.85], fill: ['#3a3a55', 0.32], rim: ['#6ea8ff', 2.1],  hemi: 0.14, exposure: 0.95, shadow: 0.5 },
];
const BASE_PRICE = 12800;
const LUME_PRICE = 300;

const state = { dial: 0, strap: 'leather', env: 'studio', lume: false };

/* ================= DOM ================= */
const $ = (id) => document.getElementById(id);
const canvas = $('gl'), viewport = $('viewport');
const loaderEl = $('loader'), loadBar = $('loadBar'), loadTip = $('loadTip');
const priceNum = $('priceNum'), toast = $('toast');
const hud360 = $('hud360'), envTag = $('envTag');

/* ================= 价格 ================= */
let priceShown = BASE_PRICE;
function targetPrice() {
  const d = DIALS[state.dial], s = STRAPS.find((x) => x.id === state.strap);
  return BASE_PRICE + d.price + s.price + (state.lume ? LUME_PRICE : 0);
}
const fmtPrice = (n) => '¥' + Math.round(n).toLocaleString('zh-CN');

/* ================= Three 基础 ================= */
let renderer = null, scene = null, camera = null;
let webglOK = false;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  webglOK = true;
} catch (e) {
  console.warn('[configurator] WebGL 不可用，降级为纯配置面板模式', e);
}

if (webglOK) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(ENVS[0].bg);
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
}

/* ---- 影棚三点布光 ---- */
let keyLight, fillLight, rimLight, hemiLight, shadowPlane, shadowMat;
const lightTargets = { keyC: new THREE.Color(), fillC: new THREE.Color(), rimC: new THREE.Color(), bg: new THREE.Color(), keyI: 2, fillI: 1, rimI: 1, hemiI: 1, exposure: 1, shadow: 0.3 };
function buildLights() {
  keyLight = new THREE.DirectionalLight(0xffffff, 2.2); keyLight.position.set(3.2, 5, 4);
  fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.65); fillLight.position.set(-4.5, 1.6, 2.5);
  rimLight = new THREE.DirectionalLight(0xfff1de, 1.25); rimLight.position.set(-1.5, 3.2, -4.5);
  hemiLight = new THREE.HemisphereLight(0xffffff, 0xd8d4cc, 0.55);
  scene.add(keyLight, fillLight, rimLight, hemiLight);
}
/* ---- ContactShadow 式：radial 纹理平面 ---- */
function buildContactShadow() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 8, 128, 128, 126);
  grad.addColorStop(0, 'rgba(0,0,0,0.85)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.32)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  shadowMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.26, depthWrite: false });
  shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.42;
  scene.add(shadowPlane);
}

/* ================= 自研 orbit =================
   拖拽旋转（yaw/pitch）+ 滚轮缩放 + 惯性 + 双指开合，无插件。 */
const orbit = {
  yaw: 0.6, pitch: 0.28, radius: 8.5,           // 当前值
  tYaw: 0.6, tPitch: 0.28, tRadius: 5.6,        // 目标值
  vyaw: 0, vpitch: 0,                           // 惯性速度
  dragging: false, lastX: 0, lastY: 0,
  pinchD: 0,
};
const PITCH_MIN = -0.5, PITCH_MAX = 1.05, R_MIN = 3.2, R_MAX = 10;
let lastInteract = performance.now();
function poke() { lastInteract = performance.now(); }

function bindOrbit() {
  const el = canvas;
  el.addEventListener('pointerdown', (e) => {
    orbit.dragging = true; orbit.lastX = e.clientX; orbit.lastY = e.clientY;
    orbit.vyaw = orbit.vpitch = 0;
    el.setPointerCapture(e.pointerId);
    poke();
  });
  el.addEventListener('pointermove', (e) => {
    if (!orbit.dragging) return;
    const dx = e.clientX - orbit.lastX, dy = e.clientY - orbit.lastY;
    orbit.lastX = e.clientX; orbit.lastY = e.clientY;
    orbit.tYaw -= dx * 0.0062;
    orbit.tPitch = clamp(orbit.tPitch + dy * 0.0048, PITCH_MIN, PITCH_MAX);
    orbit.vyaw = -dx * 0.0062; orbit.vpitch = dy * 0.0048;
    poke();
  });
  const endDrag = () => { orbit.dragging = false; };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    orbit.tRadius = clamp(orbit.tRadius * (1 + Math.sign(e.deltaY) * 0.09), R_MIN, R_MAX);
    poke();
  }, { passive: false });
  el.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (orbit.pinchD > 0) orbit.tRadius = clamp(orbit.tRadius * (orbit.pinchD / d), R_MIN, R_MAX);
      orbit.pinchD = d;
      poke();
    }
  }, { passive: false });
  el.addEventListener('touchend', () => { orbit.pinchD = 0; });
}
function updateOrbit(dt, now) {
  // 松手惯性
  if (!orbit.dragging && (Math.abs(orbit.vyaw) > 1e-5 || Math.abs(orbit.vpitch) > 1e-5)) {
    orbit.tYaw += orbit.vyaw; orbit.tPitch = clamp(orbit.tPitch + orbit.vpitch, PITCH_MIN, PITCH_MAX);
    orbit.vyaw *= Math.pow(0.02, dt); orbit.vpitch *= Math.pow(0.02, dt);
  }
  // 无操作 5 秒自动旋转
  if (!reducedMotion && !orbit.dragging && now - lastInteract > 5000) {
    orbit.tYaw += dt * 0.28;
  }
  orbit.yaw = damp(orbit.yaw, orbit.tYaw, 9, dt);
  orbit.pitch = damp(orbit.pitch, orbit.tPitch, 9, dt);
  orbit.radius = damp(orbit.radius, orbit.tRadius, 7, dt);
  const cp = Math.cos(orbit.pitch), sp = Math.sin(orbit.pitch);
  camera.position.set(
    Math.sin(orbit.yaw) * cp * orbit.radius,
    sp * orbit.radius + 0.25,
    Math.cos(orbit.yaw) * cp * orbit.radius
  );
  camera.lookAt(0, 0.25, 0);
}

/* ================= 程序化表带纹理（canvas 原创） ================= */
function makeStrapTexture(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  if (kind === 'leather') {
    g.fillStyle = '#5d3d28'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) { // 皮革颗粒
      g.fillStyle = `rgba(${20 + Math.random() * 40 | 0},${12 + Math.random() * 26 | 0},${6 + Math.random() * 16 | 0},0.5)`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
    }
    g.strokeStyle = 'rgba(0,0,0,0.16)'; // 细褶
    for (let i = 0; i < 12; i++) {
      g.beginPath(); g.moveTo(0, Math.random() * 256);
      g.bezierCurveTo(80, Math.random() * 256, 170, Math.random() * 256, 256, Math.random() * 256); g.stroke();
    }
  } else if (kind === 'weave') {
    g.fillStyle = '#2b2d33'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 8) for (let x = 0; x < 256; x += 8) { // 尼龙斜纹
      g.fillStyle = ((x + y) / 8) % 2 ? '#34373f' : '#232529';
      g.fillRect(x, y, 8, 8);
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x, y, 8, 1.5);
    }
  } else { // brushed 拉丝
    g.fillStyle = '#b9bcc2'; g.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 2) {
      g.fillStyle = `rgba(${140 + Math.random() * 60 | 0},${142 + Math.random() * 60 | 0},${148 + Math.random() * 60 | 0},0.55)`;
      g.fillRect(x, 0, 1, 256);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const strapTextures = { leather: makeStrapTexture('leather'), weave: makeStrapTexture('weave'), brushed: makeStrapTexture('brushed') };

/* ================= 腕表装配 =================
   part 结构：{ root, dialMats[], strapMats[], lumeMats[], isProcedural } */
let part = null;

function finalizeModel(root, isProcedural, classified) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  const scale = 2.6 / Math.max(size.x, size.y, size.z);
  const wrap = new THREE.Group();
  root.position.sub(center);           // 居中
  wrap.add(root);
  wrap.scale.setScalar(scale);
  wrap.position.y = 0.25;
  scene.add(wrap);
  return { root: wrap, ...classified, isProcedural };
}

/* ---- 程序化手表（原创几何，GLB 不可用时的 fallback） ---- */
function buildProceduralWatch() {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xd6d8dc, metalness: 0.95, roughness: 0.28 });
  const dialMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(DIALS[state.dial].color), metalness: 0.15, roughness: 0.5 });
  const strapMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: 0.72, map: strapTextures.leather });
  const lumeMat = new THREE.MeshStandardMaterial({ color: 0xdfe8cf, emissive: 0x9fe870, emissiveIntensity: 0 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.5 });

  const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };

  add(new THREE.CylinderGeometry(1.0, 1.0, 0.34, 48), steel).rotation.x = Math.PI / 2;       // 表壳
  const dial = add(new THREE.CylinderGeometry(0.86, 0.86, 0.05, 48), dialMat, 0, 0, 0.16);   // 表盘
  dial.rotation.x = Math.PI / 2;
  add(new THREE.TorusGeometry(0.94, 0.075, 24, 64), steel, 0, 0, 0.14);                       // 表圈
  add(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 24), steel, 1.12, 0, 0).rotation.z = Math.PI / 2; // 表冠

  for (let i = 0; i < 12; i++) {                                                              // 刻度
    const a = (i / 12) * Math.PI * 2;
    const mk = add(new THREE.BoxGeometry(i % 3 === 0 ? 0.075 : 0.045, i % 3 === 0 ? 0.16 : 0.1, 0.02), lumeMat,
      Math.sin(a) * 0.68, Math.cos(a) * 0.68, 0.19);
    mk.rotation.z = -a;
  }
  const hourH = add(new THREE.BoxGeometry(0.07, 0.44, 0.02), dark, 0, 0.14, 0.21);            // 时针
  hourH.geometry.translate(0, 0.08, 0); hourH.rotation.z = -1.05;
  const minH = add(new THREE.BoxGeometry(0.05, 0.66, 0.02), dark, 0, 0.22, 0.22);             // 分针
  minH.geometry.translate(0, 0.12, 0); minH.rotation.z = 0.5;
  const secH = add(new THREE.BoxGeometry(0.018, 0.72, 0.012), new THREE.MeshStandardMaterial({ color: 0xC2410C }), 0, 0.2, 0.23);
  secH.geometry.translate(0, 0.1, 0); secH.rotation.z = 2.2;                                  // 秒针（赭色点缀）
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 24), dark, 0, 0, 0.22).rotation.x = Math.PI / 2;

  const strapTop = add(new THREE.BoxGeometry(0.62, 1.35, 0.1), strapMat, 0, 1.62, -0.12);     // 表带
  strapTop.rotation.x = 0.28;
  const strapBot = add(new THREE.BoxGeometry(0.62, 1.35, 0.1), strapMat, 0, -1.62, -0.12);
  strapBot.rotation.x = -0.28;
  add(new THREE.BoxGeometry(0.66, 0.22, 0.16), steel, 0, 1.02, -0.02);                        // 表耳
  add(new THREE.BoxGeometry(0.66, 0.22, 0.16), steel, 0, -1.02, -0.02);

  return finalizeModel(g, true, { dialMats: [dialMat], strapMats: [strapMat], lumeMats: [lumeMat] });
}

/* ---- GLB 模型：按包围盒启发式分类表盘/表带 ---- */
function classifyGLB(root) {
  const dial = [], strap = [], other = [];
  const items = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.computeBoundingBox();
    const s = new THREE.Vector3(); o.geometry.boundingBox.getSize(s);
    const vol = s.x * s.y * s.z;
    items.push({ o, s, vol });
    const name = ((o.name || '') + ' ' + ((o.material && o.material.name) || '')).toLowerCase();
    if (/dial|face|cadran|zifferblatt|文字盘/.test(name)) { dial.push(o); return; }
    if (/strap|band|bracelet|leather|buckle|表带/.test(name)) { strap.push(o); return; }
    const flatZ = s.z < 0.16 * Math.max(s.x, s.y);
    const roundish = Math.abs(s.x - s.y) / Math.max(s.x, s.y, 1e-6) < 0.3;
    if (flatZ && roundish && s.x > 0.2) { dial.push(o); return; }   // 薄圆盘 ≈ 表盘
    const elongated = Math.max(s.x, s.y) > 2.1 * Math.min(s.x, s.y) && flatZ;
    if (elongated) { strap.push(o); return; }                       // 细长薄片 ≈ 表带
    other.push(o);
  });
  const matsOf = (list) => {
    const set = new Set();
    list.forEach((o) => { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => m && set.add(m)); });
    return [...set];
  };
  let dialMats = matsOf(dial);
  if (!dialMats.length && items.length) {                            // 兜底：最大体块当表盘
    items.sort((a, b) => b.vol - a.vol);
    dialMats = matsOf([items[0].o]);
  }
  let strapMats = matsOf(strap);
  if (!strapMats.length && other.length > 1) {                       // 兜底：除最大件外都算表带区
    const sorted = [...other].sort((a, b) => {
      const va = a.geometry.boundingBox.getSize(new THREE.Vector3());
      const vb = b.geometry.boundingBox.getSize(new THREE.Vector3());
      return (vb.x * vb.y * vb.z) - (va.x * va.y * va.z);
    });
    strapMats = matsOf(sorted.slice(1));
  }
  const lumeMats = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const name = ((o.name || '') + ' ' + ((o.material && o.material.name) || '')).toLowerCase();
    if (/lume|marker|hand|夜光|pointer/.test(name)) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach((m) => m && lumeMats.push(m));
    }
  });
  return { dialMats, strapMats, lumeMats: lumeMats.length ? lumeMats : dialMats };
}

/* ---- 模型加载：GLB 优先，失败/超时 → 程序化 fallback ---- */
const loadTips = ['正在打磨表盘…', '正在装配机芯…', '正在缝制表带…', '正在校准灯光…'];
let tipIdx = 0;
const tipTimer = setInterval(() => { tipIdx = (tipIdx + 1) % loadTips.length; loadTip.textContent = loadTips[tipIdx]; }, 1600);

async function loadWatch() {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(new InlineDRACOLoader());
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 20000));
  try {
    if (forceProcedural) throw new Error('forced procedural (?procedural)');
    const gltf = await Promise.race([
      loader.loadAsync(MODEL_URL, (ev) => {
        if (ev.total > 0) loadBar.style.width = Math.round((ev.loaded / ev.total) * 100) + '%';
      }),
      timeout,
    ]);
    const root = gltf.scene;
    root.traverse((o) => { if (o.isMesh && o.material) { // 克隆材质，避免多 mesh 共享导致串色
      o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
    }});
    part = finalizeModel(root, false, classifyGLB(root));
    console.info('[configurator] GLB 模型加载成功');
  } catch (e) {
    console.warn('[configurator] 模型加载失败，使用程序化手表 fallback：', e && e.message);
    part = buildProceduralWatch();
  }
  clearInterval(tipTimer);
  applyAll(true);
  loaderEl.classList.add('done');
  setTimeout(() => loaderEl.remove(), 700);
  introCam();
}

/* ================= 材质过渡（lerp，不硬切） ================= */
const transitions = { dialColor: new THREE.Color(DIALS[0].color) };
function applyAll(immediate) {
  if (!part) return;
  // 表盘颜色 → 目标色（逐帧 lerp）
  transitions.dialColor.set(DIALS[state.dial].color);
  if (immediate) part.dialMats.forEach((m) => m.color.copy(transitions.dialColor));
  // 表带
  const s = STRAPS.find((x) => x.id === state.strap);
  part.strapMats.forEach((m) => {
    m.userData.tRough = s.rough; m.userData.tMetal = s.metal;
    if (immediate) { m.roughness = s.rough; m.metalness = s.metal; }
    const want = strapTextures[s.tex];
    if (m.map !== want) { m.map = want; m.needsUpdate = true; }
  });
  // 夜光
  part.lumeMats.forEach((m) => {
    if (!m.emissive) return;
    m.emissive.set(0x9fe870);
    m.userData.tEmissive = state.lume ? 1.6 : 0;
    if (immediate) m.emissiveIntensity = m.userData.tEmissive;
  });
  // 场景
  const e = ENVS.find((x) => x.id === state.env);
  lightTargets.bg.set(e.bg);
  lightTargets.keyC.set(e.key[0]); lightTargets.keyI = e.key[1];
  lightTargets.fillC.set(e.fill[0]); lightTargets.fillI = e.fill[1];
  lightTargets.rimC.set(e.rim[0]); lightTargets.rimI = e.rim[1];
  lightTargets.hemiI = e.hemi; lightTargets.exposure = e.exposure; lightTargets.shadow = e.shadow;
  if (immediate && scene) {
    scene.background.copy(lightTargets.bg);
    keyLight.color.copy(lightTargets.keyC); keyLight.intensity = e.key[1];
    fillLight.color.copy(lightTargets.fillC); fillLight.intensity = e.fill[1];
    rimLight.color.copy(lightTargets.rimC); rimLight.intensity = e.rim[1];
    hemiLight.intensity = e.hemi;
    renderer.toneMappingExposure = e.exposure;
    shadowMat.opacity = e.shadow;
  }
  envTag.textContent = e.name;
  $('envName').textContent = e.name;
}

/* ================= UI 构建 ================= */
function buildUI() {
  // 表盘 swatch
  const sw = $('dialSwatches');
  DIALS.forEach((d, i) => {
    const b = document.createElement('button');
    b.className = 'swatch'; b.type = 'button';
    b.style.background = d.color;
    b.title = d.name; b.setAttribute('aria-label', '表盘：' + d.name);
    b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', i === state.dial ? 'true' : 'false');
    b.addEventListener('click', () => {
      state.dial = i; poke();
      sw.querySelectorAll('.swatch').forEach((x, j) => x.setAttribute('aria-checked', j === i ? 'true' : 'false'));
      $('dialName').textContent = d.name;
      applyAll(false);
    });
    sw.appendChild(b);
  });
  // 表带 / 场景 seg
  const seg = (el, items, get, set, labelEl, noteEl) => {
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = it.name;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', get() === it.id ? 'true' : 'false');
      b.addEventListener('click', () => {
        set(it.id); poke();
        el.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', x === b ? 'true' : 'false'));
        if (labelEl) labelEl.textContent = it.name;
        if (noteEl) noteEl.textContent = it.note + (it.price ? ` · +${fmtPrice(it.price)}` : '');
        applyAll(false);
      });
      el.appendChild(b);
    });
  };
  seg($('strapSeg'), STRAPS, () => state.strap, (v) => { state.strap = v; }, $('strapName'), $('strapNote'));
  seg($('envSeg'), ENVS, () => state.env, (v) => { state.env = v; }, null, null);
  $('strapNote').textContent = STRAPS[0].note + ` · +${fmtPrice(STRAPS[0].price)}`;
  // 夜光开关
  const lume = $('lumeSwitch');
  lume.addEventListener('click', () => {
    state.lume = !state.lume; poke();
    lume.setAttribute('aria-checked', state.lume ? 'true' : 'false');
    applyAll(false);
  });
  // 加入购物袋
  const bag = $('bagBtn');
  bag.addEventListener('click', () => {
    bag.classList.remove('pressed'); void bag.offsetWidth; bag.classList.add('pressed');
    const d = DIALS[state.dial], s = STRAPS.find((x) => x.id === state.strap);
    showToast(`已加入购物袋 · <b>${fmtPrice(targetPrice())}</b><br>曜石系列 ${d.name} 表盘 · ${s.name}${state.lume ? ' · 夜光' : ''}`);
  });
  // 移动端抽屉
  const panel = $('panel'), grip = $('drawerGrip');
  grip.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    grip.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

let toastTimer = null;
function showToast(html) {
  toast.innerHTML = html;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ================= 入场运镜（完成态可达） ================= */
let introT = -1;
function introCam() {
  if (reducedMotion) { orbit.radius = orbit.tRadius; return; }
  introT = 0;
  orbit.radius = 8.6;
}
function updateIntro(dt) {
  if (introT < 0) return;
  introT += dt / 1.6;
  if (introT >= 1) { introT = -1; orbit.radius = orbit.tRadius; return; }
  orbit.radius = lerp(8.6, orbit.tRadius, easeOutCubic(introT));
}

/* ================= 主循环 ================= */
function resize() {
  if (!webglOK) return;
  const w = viewport.clientWidth, h = viewport.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

let lastT = performance.now();
function loop() {
  requestAnimationFrame(loop);
  if (!webglOK) return;
  const now = performance.now();
  const dt = Math.min((now - lastT) / 1000, 0.05);
  lastT = now;

  updateIntro(dt);
  updateOrbit(dt, now);

  // 材质逐帧过渡
  if (part) {
    let dirty = false;
    part.dialMats.forEach((m) => { dampColor(m.color, transitions.dialColor, 7, dt); dirty = true; });
    part.strapMats.forEach((m) => {
      if (m.userData.tRough !== undefined) { m.roughness = damp(m.roughness, m.userData.tRough, 7, dt); dirty = true; }
      if (m.userData.tMetal !== undefined) { m.metalness = damp(m.metalness, m.userData.tMetal, 7, dt); dirty = true; }
    });
    part.lumeMats.forEach((m) => {
      if (m.emissive && m.userData.tEmissive !== undefined) { m.emissiveIntensity = damp(m.emissiveIntensity, m.userData.tEmissive, 7, dt); dirty = true; }
    });
    void dirty;
    // 灯光/场景逐帧过渡
    dampColor(scene.background, lightTargets.bg, 5, dt);
    dampColor(keyLight.color, lightTargets.keyC, 5, dt);
    dampColor(fillLight.color, lightTargets.fillC, 5, dt);
    dampColor(rimLight.color, lightTargets.rimC, 5, dt);
    keyLight.intensity = damp(keyLight.intensity, lightTargets.keyI, 5, dt);
    fillLight.intensity = damp(fillLight.intensity, lightTargets.fillI, 5, dt);
    rimLight.intensity = damp(rimLight.intensity, lightTargets.rimI, 5, dt);
    hemiLight.intensity = damp(hemiLight.intensity, lightTargets.hemiI, 5, dt);
    renderer.toneMappingExposure = damp(renderer.toneMappingExposure, lightTargets.exposure, 5, dt);
    shadowMat.opacity = damp(shadowMat.opacity, lightTargets.shadow, 5, dt);
  }

  // 价格数字滚动
  const tp = targetPrice();
  if (Math.abs(priceShown - tp) > 0.5) {
    priceShown = damp(priceShown, tp, 8, dt);
    priceNum.textContent = fmtPrice(priceShown);
  } else if (priceNum.textContent !== fmtPrice(tp)) {
    priceShown = tp; priceNum.textContent = fmtPrice(tp);
  }

  renderer.render(scene, camera);
}

/* ================= 启动 ================= */
buildUI();
if (webglOK) {
  buildLights();
  buildContactShadow();
  bindOrbit();
  resize();
  loop();
  loadWatch();
} else {
  // WebGL 不可用：面板照常可配，加载态直接收起（完成态可达）
  clearInterval(tipTimer);
  loaderEl.classList.add('done');
  setTimeout(() => loaderEl.remove(), 700);
  hud360.querySelector('span').textContent = '当前设备不支持 3D 预览，可照常配置';
}
