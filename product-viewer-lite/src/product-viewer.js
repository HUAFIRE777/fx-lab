/* huafire3d fx-lab — original implementation
 * <product-viewer> · 轻量 3D 商品查看器 Web Component
 * 只做：拖拽旋转 / 滚轮&双指缩放 / 自动旋转 / 热点卖点卡。不做后期，不做粒子。
 * 用法：<product-viewer src="xxx.glb" auto-rotate background="#111" poster="cover.jpg">
 *         <button data-hotspot data-pos="0.48,-0.31,0" data-title=".." data-desc="..">1</button>
 *       </product-viewer>
 * data-pos 为归一化模型坐标（最长轴映射到 [-1,1]，模型中心为原点）。
 */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { DRACOLoader } from '../vendor/DRACOLoader.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { DRACO_WRAPPER_TEXT } from '../vendor/draco-wrapper-text.js';
import { DRACO_WASM_B64 } from '../vendor/draco-wasm-b64.js';

/* 全局可配项：嵌入方可在 import 后覆盖，如
 *   import { CONFIG } from './product-viewer.js'; CONFIG.poster = 'xxx.jpg'; */
export const CONFIG = {
  poster: '',            // 无 WebGL / 加载失败时的封面图（可被 poster 属性覆盖）
  rotateSpeed: 14,       // 自动旋转速度（度/秒）
  fov: 35,               // 相机视场角
  minZoom: 0.55,         // 相对适配距离的缩放下限
  maxZoom: 2.6,          // 相对适配距离的缩放上限
  exposure: 1.0,         // ACES 曝光
  dracoWorkers: 2,       // draco 解码线程数（轻量起见默认 2）
};

const LOW_END = (() => {
  try {
    const cores = navigator.hardwareConcurrency || 8;
    const mem = navigator.deviceMemory || 8;
    return cores <= 4 || mem <= 4;
  } catch { return false; }
})();

let _wasmBytes = null; // 多实例共享：draco wasm 只解一次 base64
function dracoWasmBytes() {
  if (!_wasmBytes) {
    const bin = atob(DRACO_WASM_B64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    _wasmBytes = u8.buffer;
  }
  return _wasmBytes;
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

/* 每实例一份的影子样式：三色——墨底/纸白/点缀金，全部手写，无框架 */
const SHADOW_CSS = `
:host { display:block; position:relative; width:100%; aspect-ratio:4/3;
  border-radius:14px; overflow:hidden; isolation:isolate;
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif; }
.pv-stage { position:absolute; inset:0; overflow:hidden; background:#141414; }
.pv-stage::after { content:""; position:absolute; inset:0; pointer-events:none; z-index:5;
  background:radial-gradient(120% 90% at 50% 40%, transparent 62%, rgba(0,0,0,.28) 100%); }
canvas.pv-canvas { position:absolute; inset:0; width:100%; height:100%; display:block;
  touch-action:none; cursor:grab; }
canvas.pv-canvas:active { cursor:grabbing; }
img.pv-poster { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:2; }
.pv-veil { position:absolute; inset:0; z-index:6; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:14px; color:#e8e4da;
  background:linear-gradient(180deg, rgba(20,20,20,.0), rgba(20,20,20,.35));
  transition:opacity .45s ease; }
.pv-veil[hidden] { display:none; }
.pv-veil.is-done { opacity:0; pointer-events:none; }
.pv-spin { width:34px; height:34px; border-radius:50%;
  border:2px solid rgba(232,228,218,.22); border-top-color:#e0a458;
  animation:pv-spin 0.9s cubic-bezier(.6,.15,.4,.85) infinite; }
@keyframes pv-spin { to { transform:rotate(360deg); } }
.pv-bar { width:150px; height:2px; background:rgba(232,228,218,.18); border-radius:2px; overflow:hidden; }
.pv-bar i { display:block; height:100%; width:0%; background:#e0a458; border-radius:2px;
  transition:width .25s ease-out; }
.pv-pct { font-size:11px; letter-spacing:.28em; text-indent:.28em; color:rgba(232,228,218,.72); }
.pv-err { max-width:78%; text-align:center; font-size:13px; line-height:1.8; color:rgba(232,228,218,.85); }
.pv-retry { margin-top:4px; padding:9px 22px; border-radius:999px; border:1px solid rgba(224,164,88,.65);
  background:transparent; color:#e0a458; font-size:13px; letter-spacing:.14em; cursor:pointer;
  transition:background .25s ease, color .25s ease, transform .25s cubic-bezier(.34,1.4,.64,1); }
.pv-retry:hover { background:#e0a458; color:#141414; transform:translateY(-1px); }
.pv-retry:active { transform:translateY(0) scale(.97); }
/* 热点：圆点 + 呼吸环，每个错峰（--pd 由 JS 写入，避开机械同步） */
.pv-hotspots { position:absolute; inset:0; z-index:7; pointer-events:none; }
.pv-hotspot { position:absolute; left:0; top:0; width:30px; height:30px; margin:-15px 0 0 -15px;
  border-radius:50%; border:1px solid rgba(255,255,255,.85); background:rgba(20,20,20,.55);
  color:#fff; font-size:12px; font-weight:600; cursor:pointer; pointer-events:auto;
  display:flex; align-items:center; justify-content:center; padding:0;
  backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);
  transition:transform .3s cubic-bezier(.34,1.56,.64,1), opacity .3s ease, background .25s ease; }
.pv-hotspot::after { content:""; position:absolute; inset:-7px; border-radius:50%;
  border:1px solid rgba(224,164,88,.8); animation:pv-ping 2.6s cubic-bezier(.3,.6,.4,1) infinite;
  animation-delay:var(--pd, 0s); }
@keyframes pv-ping { 0% { transform:scale(.55); opacity:0; } 25% { opacity:1; }
  70% { transform:scale(1.12); opacity:0; } 100% { transform:scale(1.12); opacity:0; } }
.pv-hotspot:hover { transform:scale(1.22); background:#e0a458; border-color:#e0a458; color:#141414; }
.pv-hotspot.is-back { opacity:.18; pointer-events:none; }
.pv-hotspot.is-active { background:#e0a458; border-color:#e0a458; color:#141414; transform:scale(1.18); }
/* 卖点小卡：底部浮现，弹簧 easing */
.pv-card { position:absolute; left:12px; right:12px; bottom:12px; z-index:8;
  background:rgba(18,18,18,.82); border:1px solid rgba(255,255,255,.12); border-radius:12px;
  padding:14px 40px 14px 16px; color:#f2efe7;
  backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  transform:translateY(16px) scale(.98); opacity:0; pointer-events:none;
  transition:transform .38s cubic-bezier(.32,1.28,.5,1), opacity .3s ease; }
.pv-card.is-open { transform:none; opacity:1; pointer-events:auto; }
.pv-card h4 { margin:0 0 6px; font-size:14px; font-weight:700; letter-spacing:.06em; color:#e0a458; }
.pv-card p { margin:0; font-size:12.5px; line-height:1.75; color:rgba(242,239,231,.82); }
.pv-close { position:absolute; right:8px; top:8px; width:26px; height:26px; border-radius:50%;
  border:0; background:rgba(255,255,255,.1); color:#fff; font-size:14px; line-height:1; cursor:pointer;
  transition:background .25s ease, transform .3s cubic-bezier(.34,1.56,.64,1); }
.pv-close:hover { background:#e0a458; color:#141414; transform:rotate(90deg); }
.pv-hint { position:absolute; right:12px; bottom:12px; z-index:6; font-size:10.5px;
  letter-spacing:.22em; text-indent:.22em; color:rgba(255,255,255,.42); pointer-events:none;
  transition:opacity .5s ease; }
.pv-hint[hidden] { display:none; }
`;

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export class ProductViewer extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'auto-rotate', 'rotate-speed', 'background', 'poster', 'alt', 'exposure'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${SHADOW_CSS}</style>
      <div class="pv-stage">
        <canvas class="pv-canvas"></canvas>
        <img class="pv-poster" alt="" hidden />
        <div class="pv-veil" hidden>
          <div class="pv-spin"></div>
          <div class="pv-bar"><i></i></div>
          <div class="pv-pct">0%</div>
        </div>
        <div class="pv-hotspots"></div>
        <div class="pv-card" role="dialog" aria-live="polite">
          <button class="pv-close" aria-label="关闭">✕</button>
          <h4></h4><p></p>
        </div>
        <div class="pv-hint">拖动旋转 · 滚轮缩放</div>
      </div>`;
    this._els = {
      stage: this.shadowRoot.querySelector('.pv-stage'),
      canvas: this.shadowRoot.querySelector('.pv-canvas'),
      poster: this.shadowRoot.querySelector('.pv-poster'),
      veil: this.shadowRoot.querySelector('.pv-veil'),
      bar: this.shadowRoot.querySelector('.pv-bar i'),
      pct: this.shadowRoot.querySelector('.pv-pct'),
      hotspots: this.shadowRoot.querySelector('.pv-hotspots'),
      card: this.shadowRoot.querySelector('.pv-card'),
      cardTitle: this.shadowRoot.querySelector('.pv-card h4'),
      cardDesc: this.shadowRoot.querySelector('.pv-card p'),
      hint: this.shadowRoot.querySelector('.pv-hint'),
    };
    // 相机状态（球面坐标 + 阻尼目标）
    this._yaw = 0.7; this._pitch = 0.32;
    this._tYaw = 0.7; this._tPitch = 0.32;
    this._dist = 4.4; this._tDist = 4.4; this._fitDist = 4.4;
    this._autoRotate = this.hasAttribute('auto-rotate');
    this._resumeAt = 0;
    this._hotspotDefs = [];
    this._anchors = [];   // {btn, obj, title, desc}
    this._openCard = null;
    this._inited = false; this._ready = false; this._raf = 0; this._visible = false;
    this._lastT = 0; this._interacting = false;
    this._resolveReady = null;
    this.ready = new Promise((res) => { this._resolveReady = res; });
  }

  /* ---------- 生命周期 ---------- */
  connectedCallback() {
    this._collectHotspots();
    this._wireCard();
    // 首屏懒加载：进入视口前 300px 才初始化 WebGL
    this._io = new IntersectionObserver((es) => {
      for (const e of es) {
        this._visible = e.isIntersecting;
        if (e.isIntersecting && !this._inited) this._init();
        this._kick();
      }
    }, { rootMargin: '300px' });
    this._io.observe(this);
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this._els.stage);
    document.addEventListener('visibilitychange', this._onVis);
  }

  disconnectedCallback() {
    this._io?.disconnect(); this._ro?.disconnect();
    document.removeEventListener('visibilitychange', this._onVis);
    cancelAnimationFrame(this._raf); this._raf = 0;
    this._renderer?.dispose();
    this._inited = false;
  }

  attributeChangedCallback(name, _o, v) {
    if (name === 'auto-rotate') { this._autoRotate = v !== null; this._kick(); }
    if (name === 'background' && this._inited) this._applyBackground();
    if (name === 'src' && this._inited && v) this._loadModel(v);
  }

  _onVis = () => this._kick();

  /* ---------- 热点收集：声明式 data-hotspot 转为内部定义 ---------- */
  _collectHotspots() {
    const nodes = [...this.querySelectorAll('[data-hotspot]')];
    nodes.forEach((n, i) => {
      const pos = (n.getAttribute('data-pos') || '0,0,0').split(',').map(Number);
      this._hotspotDefs.push({
        node: n,
        pos: new THREE.Vector3(pos[0] || 0, pos[1] || 0, pos[2] || 0),
        title: n.getAttribute('data-title') || `卖点 ${i + 1}`,
        desc: n.getAttribute('data-desc') || '',
        label: (n.textContent || '').trim() || String(i + 1),
      });
      n.remove(); // 移入影子 overlay，页面源码保持干净
    });
  }

  /** JS API：动态加热点 addHotspot({pos:[x,y,z], title, desc}) */
  addHotspot({ pos, title, desc }) {
    const btn = document.createElement('button');
    btn.className = 'pv-hotspot';
    this._hotspotDefs.push({
      node: btn, pos: new THREE.Vector3(...pos), title, desc,
      label: String(this._hotspotDefs.length + 1),
    });
    if (this._inited) this._buildHotspot(this._hotspotDefs[this._hotspotDefs.length - 1]);
    this._kick();
  }

  setAutoRotate(on) {
    on ? this.setAttribute('auto-rotate', '') : this.removeAttribute('auto-rotate');
  }

  /* ---------- 初始化 ---------- */
  _init() {
    this._inited = true;
    if (!webglAvailable()) return this._fallback('NO_WEBGL');
    const lowEnd = LOW_END;
    try {
      this._renderer = new THREE.WebGLRenderer({
        canvas: this._els.canvas, antialias: !lowEnd, alpha: true,
        powerPreference: lowEnd ? 'low-power' : 'high-performance',
      });
    } catch { return this._fallback('NO_WEBGL'); }
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1 : 2));
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure =
      parseFloat(this.getAttribute('exposure')) || CONFIG.exposure;
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;

    this._scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(CONFIG.fov, 1, 0.1, 100);

    // 灯光：环境反射（RoomEnvironment 打底）+ 主光 + 轮廓光
    const pmrem = new THREE.PMREMGenerator(this._renderer);
    this._scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(3, 5, 4); this._scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfd4ff, 0.55);
    rim.position.set(-4, 2.5, -3.5); this._scene.add(rim);
    this._scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2a2a, 0.35));

    this._modelRoot = new THREE.Group();
    this._scene.add(this._modelRoot);

    this._applyBackground();
    this._bindInput();
    this._hotspotDefs.forEach((d) => this._buildHotspot(d));
    this._wireCard();
    this._resize();
    const src = this.getAttribute('src');
    if (src) this._loadModel(src); else this._fallback('NO_SRC');
    this._kick();
  }

  _applyBackground() {
    const bg = this.getAttribute('background') || '#141414';
    if (bg === 'transparent') {
      this._renderer.setClearColor(0x000000, 0);
      this._els.stage.style.background = 'transparent';
    } else {
      this._renderer.setClearColor(new THREE.Color(bg), 1);
      this._els.stage.style.background = bg;
    }
  }

  _fallback(reason) {
    // 无 WebGL / 无 src / 加载失败：降级封面图
    const poster = this.getAttribute('poster') || CONFIG.poster;
    const veil = this._els.veil;
    veil.hidden = false; veil.classList.remove('is-done');
    if (poster) {
      this._els.poster.src = poster;
      this._els.poster.alt = this.getAttribute('alt') || '商品图';
      this._els.poster.hidden = false;
      veil.innerHTML = `<div class="pv-pct" style="letter-spacing:.2em">${
        reason === 'NO_WEBGL' ? '当前设备不支持 3D 预览' : ''}</div>`;
    } else {
      veil.innerHTML = `<div class="pv-err">3D 预览暂不可用<br>请换个浏览器试试</div>`;
    }
    this._els.hint.hidden = true;
    this._resolveReady?.(false);
  }

  /* ---------- 模型加载（含 draco 内联解码） ---------- */
  _loadModel(src) {
    const veil = this._els.veil;
    veil.hidden = false; veil.classList.remove('is-done');
    veil.innerHTML = `<div class="pv-spin"></div><div class="pv-bar"><i></i></div>
      <div class="pv-pct">0%</div>`;
    this._els.bar = veil.querySelector('.pv-bar i');
    this._els.pct = veil.querySelector('.pv-pct');

    const draco = new DRACOLoader();
    draco.setWorkerLimit(CONFIG.dracoWorkers);
    // 单文件可用的关键：解码器不走网络路径，直接喂内存中的 wasm/wrapper
    draco._loadLibrary = (url) => {
      if (url === 'draco_wasm_wrapper.js') return Promise.resolve(DRACO_WRAPPER_TEXT);
      if (url === 'draco_decoder.wasm') return Promise.resolve(dracoWasmBytes());
      return Promise.reject(new Error('unknown draco lib: ' + url));
    };
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.load(src,
      (gltf) => this._onModel(gltf),
      (ev) => {
        if (ev.lengthComputable && this._els.pct) {
          const p = Math.round((ev.loaded / ev.total) * 100);
          this._els.bar.style.width = p + '%';
          this._els.pct.textContent = p + '%';
        }
      },
      () => this._loadError());
  }

  _onModel(gltf) {
    // 清掉旧模型
    this._modelRoot.clear();
    const model = gltf.scene;
    this._modelRoot.add(model);
    // 归一化：最长轴 → [-1,1]，中心回原点
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 2 / Math.max(size.x, size.y, size.z);
    this._modelRoot.scale.setScalar(s);
    this._modelRoot.position.copy(center).multiplyScalar(-s);
    // 相机适配
    this._fitDist = (1 / Math.tan(THREE.MathUtils.degToRad(CONFIG.fov / 2))) * 1.32;
    this._dist = this._tDist = this._fitDist;
    this._updateCamera(1);
    // 收尾
    const veil = this._els.veil;
    veil.classList.add('is-done');
    setTimeout(() => { veil.hidden = true; }, 500);
    this._els.hint.hidden = false;
    setTimeout(() => { this._els.hint.style.opacity = '0'; }, 6000);
    this._ready = true;
    this._resolveReady?.(true);
    // 首帧强制渲染：非自动旋转的实例此时各目标量已相等，
    // _kick 的按需循环不会触发渲染，必须先画一帧出来
    this._updateCamera();
    this._projectHotspots();
    this._renderer.render(this._scene, this._camera);
    this._kick();
  }

  _loadError() {
    const veil = this._els.veil;
    veil.classList.remove('is-done');
    veil.innerHTML = `<div class="pv-err">模型加载失败<br>检查网络后重试</div>
      <button class="pv-retry">重新加载</button>`;
    veil.querySelector('.pv-retry').onclick = () => this._loadModel(this.getAttribute('src'));
  }

  /* ---------- 输入：旋转 / 缩放（手写轻量轨道，无 OrbitControls） ---------- */
  _bindInput() {
    const cv = this._els.canvas;
    const pts = new Map();
    let pinchD = 0;
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinchD = Math.hypot(a[0] - b[0], a[1] - b[1]);
      }
      this._interacting = true;
      this._resumeAt = 0;
      this._closeCard();
      this._kick();
    });
    cv.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId);
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 1) {
        const dx = e.clientX - prev[0], dy = e.clientY - prev[1];
        this._tYaw -= dx * 0.0085;
        this._tPitch = THREE.MathUtils.clamp(this._tPitch - dy * 0.006, -1.25, 1.25);
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinchD > 0) this._tDist = this._clampDist(this._tDist * (pinchD / d));
        pinchD = d;
      }
      this._kick();
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinchD = 0;
      if (pts.size === 0) {
        this._interacting = false;
        // 松手 2.5s 后恢复自动旋转（有物理感的停顿，不是硬切）
        this._resumeAt = performance.now() + 2500;
        this._kick();
      }
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      this._tDist = this._clampDist(this._tDist * (1 + Math.sign(e.deltaY) * 0.09));
      this._resumeAt = performance.now() + 2500;
      this._kick();
    }, { passive: false });
  }

  _clampDist(d) {
    return THREE.MathUtils.clamp(d, this._fitDist * CONFIG.minZoom, this._fitDist * CONFIG.maxZoom);
  }

  /* ---------- 热点 ---------- */
  _buildHotspot(def) {
    const btn = document.createElement('button');
    btn.className = 'pv-hotspot';
    btn.type = 'button';
    btn.textContent = def.label;
    btn.setAttribute('aria-label', def.title);
    btn.style.setProperty('--pd', (Math.random() * 2.4).toFixed(2) + 's'); // 呼吸环错峰
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleCard(def, btn);
    });
    const anchor = new THREE.Object3D();
    anchor.position.copy(def.pos);
    this._scene.add(anchor);
    this._els.hotspots.appendChild(btn);
    this._anchors.push({ btn, anchor, def });
  }

  _wireCard() {
    const card = this._els.card;
    if (card.dataset.wired) return;
    card.dataset.wired = '1';
    card.querySelector('.pv-close').addEventListener('click', () => this._closeCard());
    this._els.stage.addEventListener('click', (e) => {
      if (!card.contains(e.target)) this._closeCard();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this._closeCard();
    });
  }

  _toggleCard(def, btn) {
    if (this._openCard === def) return this._closeCard();
    this._anchors.forEach((a) => a.btn.classList.remove('is-active'));
    btn.classList.add('is-active');
    this._els.cardTitle.textContent = def.title;
    this._els.cardDesc.textContent = def.desc;
    this._els.card.classList.add('is-open');
    this._openCard = def;
    this._resumeAt = Infinity; // 看卡时暂停自动旋转
  }

  _closeCard() {
    if (!this._openCard) return;
    this._openCard = null;
    this._els.card.classList.remove('is-open');
    this._anchors.forEach((a) => a.btn.classList.remove('is-active'));
    this._resumeAt = performance.now() + 1500;
    this._kick();
  }

  /* ---------- 渲染循环：按需渲染，静止即停 ---------- */
  _kick() {
    if (!this._inited || !this._visible || document.hidden) return;
    if (this._raf) return;
    this._lastT = performance.now();
    const tick = (t) => {
      this._raf = 0;
      const dt = Math.min((t - this._lastT) / 1000, 0.05);
      this._lastT = t;
      let moved = false;
      // 自动旋转（松手/关卡后的缓恢复由 _resumeAt 控制）
      if (this._autoRotate && !this._interacting && !this._openCard &&
          performance.now() >= this._resumeAt && this._ready) {
        this._tYaw += THREE.MathUtils.degToRad(CONFIG.rotateSpeed) * dt;
        moved = true;
      }
      // 阻尼趋近目标：物理感来自这里，不用 linear 硬切
      const k = 1 - Math.pow(0.0018, dt); // 帧率无关的指数阻尼
      const dy = this._tYaw - this._yaw, dp = this._tPitch - this._pitch, dd = this._tDist - this._dist;
      if (Math.abs(dy) > 1e-4 || Math.abs(dp) > 1e-4 || Math.abs(dd) > 1e-4) {
        this._yaw += dy * k; this._pitch += dp * k; this._dist += dd * k;
        moved = true;
      }
      if (moved) {
        this._updateCamera(dt);
        this._projectHotspots();
        this._renderer.render(this._scene, this._camera);
      }
      // 还有动静就继续，否则停掉 rAF 省电
      const busy = this._autoRotate && !this._openCard && this._ready ||
        Math.abs(this._tYaw - this._yaw) > 1e-4 ||
        Math.abs(this._tPitch - this._pitch) > 1e-4 ||
        Math.abs(this._tDist - this._dist) > 1e-4;
      if (this._visible && !document.hidden && busy) {
        this._raf = requestAnimationFrame(tick);
      }
    };
    this._raf = requestAnimationFrame(tick);
  }

  _updateCamera() {
    const { _yaw: yaw, _pitch: pitch, _dist: dist } = this;
    _v1.set(
      dist * Math.cos(pitch) * Math.sin(yaw),
      dist * Math.sin(pitch),
      dist * Math.cos(pitch) * Math.cos(yaw)
    );
    this._camera.position.copy(_v1);
    this._camera.lookAt(0, 0, 0);
  }

  _projectHotspots() {
    const w = this._els.stage.clientWidth, h = this._els.stage.clientHeight;
    if (!w || !h) return;
    const camPos = this._camera.position;
    for (const { btn, anchor } of this._anchors) {
      anchor.getWorldPosition(_v1);           // 热点世界坐标
      _v2.copy(_v1).sub(camPos);              // 热点→相机
      const facing = _v1.clone().normalize().dot(_v2.normalize()); // >0 朝外
      _v1.project(this._camera);
      const behind = _v1.z > 1;
      const x = (_v1.x * 0.5 + 0.5) * w, y = (-_v1.y * 0.5 + 0.5) * h;
      btn.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      btn.classList.toggle('is-back', behind || facing < -0.12);
    }
  }

  _resize() {
    if (!this._inited || !this._renderer) return;
    const w = this._els.stage.clientWidth, h = this._els.stage.clientHeight;
    if (!w || !h) return;
    this._renderer.setSize(w, h, false);
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._projectHotspots();
    // resize 后补一帧
    if (this._ready) this._renderer.render(this._scene, this._camera);
  }
}

customElements.define('product-viewer', ProductViewer);
