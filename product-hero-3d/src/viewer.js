// huafire3d fx-lab — original implementation
// product-hero-3d · src/viewer.js
// 3D 产品查看器：场景/灯光/相机/交互/加载，全手写封装（r160 API）。
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from '../vendor/addons/loaders/DRACOLoader.js';
import { OrbitControls } from '../vendor/addons/controls/OrbitControls.js';
import { RoomEnvironment } from '../vendor/addons/environments/RoomEnvironment.js';
import { DRACO_WRAPPER_SRC, DRACO_WASM_B64 } from './draco-assets.js';

// Draco 解码库内联：单文件构建零额外请求也能解 Draco 压缩模型。
// 原理：DRACOLoader 通过 _loadLibrary 取 wrapper.js + .wasm，重写它直接返回内存里的资源。
class InlineDRACOLoader extends DRACOLoader {
  _loadLibrary(url, responseType) {
    if (url === 'draco_wasm_wrapper.js') return Promise.resolve(DRACO_WRAPPER_SRC);
    if (url === 'draco_decoder.wasm') {
      const bin = atob(DRACO_WASM_B64);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return Promise.resolve(buf.buffer);
    }
    return super._loadLibrary(url, responseType);
  }
}

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_MOBILE =
  window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;

export class ProductViewer {
  constructor(mount, config, hooks) {
    this.mount = mount;
    this.cfg = config;
    this.hooks = hooks || {};           // { onProgress(0..1), onLoaded(), onError(err) }
    this.staticMode = REDUCED;         // 降级：只渲染静态帧
    this._raf = 0;
    this._idleTimer = 0;
    this._introT = -1;
    this._disposed = false;
    this._build();
    this._bindResize();
  }

  // ---------- 搭建 ----------
  _build() {
    const c = this.cfg;
    const renderer = new THREE.WebGLRenderer({
      antialias: !IS_MOBILE && c.perf.antialias,
      alpha: true,                       // 透明：CSS 渐变背景透出来
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(
      window.devicePixelRatio || 1,
      IS_MOBILE ? c.perf.pixelRatioMaxMobile : c.perf.pixelRatioMax,
    ));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = c.lights.exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.mount.appendChild(renderer.domElement);
    this.renderer = renderer;
    renderer.domElement.style.touchAction = 'none'; // 触屏手势不跟页面滚动打架

    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      c.camera.fov, window.innerWidth / window.innerHeight, 0.01, 200,
    );
    this.camera = camera;

    // 程序化影棚环境（零外部 HDR 文件）
    if (c.environment.enabled) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    }

    // 灯光组（引用保留，apply() 实时改）
    const L = this.lights = {};
    const mk = (Cls, color, intensity) => {
      const l = new Cls(color, intensity);
      scene.add(l);
      if (l.target) scene.add(l.target);
      return l;
    };
    L.key = mk(THREE.DirectionalLight, c.lights.key.color, c.lights.key.intensity);
    L.key.position.set(...c.lights.key.position);
    L.key.castShadow = true;
    L.key.shadow.mapSize.setScalar(IS_MOBILE ? c.perf.shadowMapSizeMobile : c.perf.shadowMapSize);
    L.key.shadow.bias = -0.0002;
    L.key.shadow.radius = 6;
    L.fill = mk(THREE.DirectionalLight, c.lights.fill.color, c.lights.fill.intensity);
    L.fill.position.set(...c.lights.fill.position);
    L.rim = mk(THREE.DirectionalLight, c.lights.rim.color, c.lights.rim.intensity);
    L.rim.position.set(...c.lights.rim.position);
    L.hemi = mk(THREE.HemisphereLight, c.lights.hemi.sky, c.lights.hemi.ground, c.lights.hemi.intensity);

    // 地面阴影承接盘
    const floorMat = new THREE.ShadowMaterial({ opacity: c.floor.shadowOpacity });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 48), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.visible = c.floor.enabled;
    scene.add(floor);
    this.floor = floor;

    // 控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = c.controls.dampingFactor;
    controls.enablePan = c.controls.enablePan;
    controls.autoRotate = !this.staticMode && c.controls.autoRotate;
    controls.autoRotateSpeed = c.controls.autoRotateSpeed;
    controls.minPolarAngle = THREE.MathUtils.degToRad(c.camera.minPolarDeg);
    controls.maxPolarAngle = THREE.MathUtils.degToRad(c.camera.maxPolarDeg);
    this.controls = controls;

    // 闲置恢复自动旋转：用户一上手就停，松手 N 秒后恢复
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
      clearTimeout(this._idleTimer);
    });
    controls.addEventListener('end', () => {
      clearTimeout(this._idleTimer);
      if (this.staticMode || !this.cfg.controls.autoRotate) return;
      this._idleTimer = setTimeout(() => { controls.autoRotate = true; }, c.controls.idleSeconds * 1000);
    });

    this.modelRoot = new THREE.Group();
    scene.add(this.modelRoot);

    if (this.staticMode) {
      // 降级：静态渲染，交互变化时补一帧
      controls.addEventListener('change', () => this.renderOnce());
    } else {
      this._loop();
    }
  }

  // ---------- 加载模型 ----------
  load(url) {
    const loader = new GLTFLoader();
    // Draco 压缩的模型（如默认耳机）需要解码器；解码库已内联进包
    const draco = new InlineDRACOLoader();
    draco.setDecoderConfig({ type: 'wasm' });
    draco.preload();
    loader.setDRACOLoader(draco);
    this.hooks.onProgress && this.hooks.onProgress(0);
    loader.load(
      url,
      (gltf) => this._onModel(gltf),
      (xhr) => {
        if (xhr.total > 0) this.hooks.onProgress && this.hooks.onProgress(xhr.loaded / xhr.total);
      },
      (err) => this.hooks.onError && this.hooks.onError(err),
    );
  }

  reload() {
    while (this.modelRoot.children.length) this.modelRoot.remove(this.modelRoot.children[0]);
    this.load(this.cfg.model.url);
  }

  _onModel(gltf) {
    const model = gltf.scene;
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = false;
        const m = o.material;
        if (m && m.isMeshStandardMaterial) m.envMapIntensity = this.cfg.environment.intensity;
      }
    });
    this.modelRoot.add(model);

    // 归一化：包围球中心拉到原点，底部落到地面
    const box = new THREE.Box3().setFromObject(model);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    model.position.sub(sphere.center);
    this.fitRadius = sphere.radius;
    this.floor.position.y = -sphere.radius * 1.02;
    this.floor.scale.setScalar(Math.max(1, sphere.radius * 1.4));

    // 阴影相机包住模型
    const s = this.lights.key.shadow;
    const ext = sphere.radius * 2.2;
    Object.assign(s.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 0.5, far: 40 });
    s.camera.updateProjectionMatrix();

    this._frameCamera(true);
    this.hooks.onProgress && this.hooks.onProgress(1);
    this.hooks.onLoaded && this.hooks.onLoaded();
    if (this.staticMode) this.renderOnce();
  }

  // 按包围球贴合距离摆相机（3/4 视角）
  _frameCamera(withIntro) {
    const c = this.cfg;
    const r = this.fitRadius || 1;
    const fitDist = r / Math.sin(THREE.MathUtils.degToRad(c.camera.fov / 2));

    const az = THREE.MathUtils.degToRad(-32); // 方位角：左侧 3/4
    const el = THREE.MathUtils.degToRad(14);  // 仰角：略俯视
    // 移动端：目标点下移，模型让到屏幕上半区给底部文案腾地方
    const target = new THREE.Vector3(
      0, IS_MOBILE ? r * c.camera.mobile.targetYOffsetFactor : 0, 0);
    const dist = fitDist * c.camera.distanceFactor *
      (IS_MOBILE ? c.camera.mobile.distanceBoost : 1);
    this._fitDist = fitDist;

    const place = (d) => new THREE.Vector3(
      target.x + d * Math.cos(el) * Math.sin(az),
      target.y + d * Math.sin(el),
      target.z + d * Math.cos(el) * Math.cos(az),
    );

    this.controls.target.copy(target);
    this.controls.minDistance = fitDist * c.camera.minFactor;
    this.controls.maxDistance = fitDist * c.camera.maxFactor;

    if (withIntro && c.intro.enabled && !this.staticMode) {
      this.camera.position.copy(place(dist * c.intro.startFactor));
      this._introFrom = dist * c.intro.startFactor;
      this._introTo = dist;
      this._introT = 0;
    } else {
      this.camera.position.copy(place(dist));
      this._introT = -1;
    }
    this.controls.update();
  }

  // ---------- 实时改参（面板/控制台调完直接调这个） ----------
  apply() {
    const c = this.cfg, L = this.lights;
    this.renderer.toneMappingExposure = c.lights.exposure;
    const setL = (l, p) => {
      l.color.set(p.color); l.intensity = p.intensity;
      if (p.position) l.position.set(...p.position);
    };
    setL(L.key, c.lights.key);
    setL(L.fill, c.lights.fill);
    setL(L.rim, c.lights.rim);
    L.hemi.color.set(c.lights.hemi.sky);
    L.hemi.groundColor.set(c.lights.hemi.ground);
    L.hemi.intensity = c.lights.hemi.intensity;

    if (this.modelRoot) {
      this.modelRoot.traverse((o) => {
        if (o.isMesh && o.material && o.material.isMeshStandardMaterial) {
          o.material.envMapIntensity = c.environment.intensity;
        }
      });
    }
    this.floor.visible = c.floor.enabled;
    this.floor.material.opacity = c.floor.shadowOpacity;

    this.controls.autoRotateSpeed = c.controls.autoRotateSpeed;
    this.controls.autoRotate = !this.staticMode && c.controls.autoRotate;
    this.controls.dampingFactor = c.controls.dampingFactor;

    // 背景渐变走 CSS 变量
    const root = document.documentElement.style;
    root.setProperty('--bg-top', c.background.top);
    root.setProperty('--bg-bottom', c.background.bottom);
    root.setProperty('--glow-color', c.background.glowColor);
    root.setProperty('--glow-opacity', c.background.glowOpacity);

    // 相机距离：沿当前视角方向重摆
    if (this._fitDist) {
      const dir = this.camera.position.clone().sub(this.controls.target).normalize();
      const dist = this._fitDist * c.camera.distanceFactor *
        (IS_MOBILE ? c.camera.mobile.distanceBoost : 1);
      this.camera.position.copy(this.controls.target).addScaledVector(dir, dist);
      this.controls.minDistance = this._fitDist * c.camera.minFactor;
      this.controls.maxDistance = this._fitDist * c.camera.maxFactor;
    }
    if (this.staticMode) this.renderOnce();
  }

  // ---------- 渲染循环 ----------
  _loop() {
    if (this._disposed) return;
    this._raf = requestAnimationFrame(() => this._loop());
    const dt = Math.min(this._clockDelta(), 0.05);

    // 开场推进：easeOutCubic
    if (this._introT >= 0) {
      this._introT += dt / this.cfg.intro.durationSec;
      const t = Math.min(this._introT, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const d = this._introFrom + (this._introTo - this._introFrom) * e;
      const dir = this.camera.position.clone().sub(this.controls.target).normalize();
      this.camera.position.copy(this.controls.target).addScaledVector(dir, d);
      if (t >= 1) this._introT = -1;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  _clockDelta() {
    const now = performance.now();
    const dt = this._last ? (now - this._last) / 1000 : 0.016;
    this._last = now;
    return dt;
  }

  renderOnce() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  _bindResize() {
    this._onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      if (this.staticMode) this.renderOnce();
    };
    window.addEventListener('resize', this._onResize);
  }

  dispose() {
    this._disposed = true;
    cancelAnimationFrame(this._raf);
    clearTimeout(this._idleTimer);
    window.removeEventListener('resize', this._onResize);
    this.controls.dispose();
    this.renderer.dispose();
  }
}
