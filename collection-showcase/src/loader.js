/* huafire3d fx-lab — original implementation */
/* collection-showcase: GLB 加载器 —— promise 缓存、Draco 内联解码、模型归一化 */

import * as THREE from 'three';
import { GLTFLoader } from '../vendor/addons/GLTFLoader.js';
import { DRACOLoader } from '../vendor/addons/DRACOLoader.js';
import { DRACO_WRAPPER_SRC, DRACO_WASM_B64 } from './draco-inline.gen.js';

/* Draco 解码器（wasm + wrapper）已由 build.py 内联为字符串，
   单文件打包后无需外部路径即可解码 Draco 压缩模型 */
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
dracoLoader.preload(); // 空闲时预热解码 worker，首个 Draco 模型不卡

/* url -> Promise<THREE.Group>，同 URL 只请求一次 */
const cache = new Map();

export function loadModel(url) {
  if (!cache.has(url)) {
    const p = gltfLoader
      .loadAsync(url)
      .then((gltf) => gltf.scene)
      .catch((err) => {
        cache.delete(url); // 失败不缓存，允许重试
        throw err;
      });
    cache.set(url, p);
  }
  /* 每个调用者拿到独立克隆（几何/材质仍共享引用，零额外显存）。
     否则两张卡片配同一模型 URL 时，后加载的会把 scene 从先加载的 pivot 里抢走。 */
  return cache.get(url).then((scene) => scene.clone(true));
}

export function bustModel(url) {
  cache.delete(url);
}

/* 把任意尺寸/位置的模型归一化：包围盒中心移到原点，最大边缩放到 2 个单位。
   返回 pivot（转盘组），旋转 pivot 即可转台展示 */
export function normalizeModel(scene) {
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const s = 2 / maxDim;
  scene.scale.setScalar(s);
  scene.position.sub(center.multiplyScalar(s));

  const pivot = new THREE.Group();
  pivot.add(scene);
  return pivot;
}

/* 柔和接触阴影：canvas 生成的径向渐变贴图，各视口共用一张 */
let shadowTex = null;
export function getShadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  g.addColorStop(0, 'rgba(20,20,26,0.34)');
  g.addColorStop(0.55, 'rgba(20,20,26,0.13)');
  g.addColorStop(1, 'rgba(20,20,26,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}
