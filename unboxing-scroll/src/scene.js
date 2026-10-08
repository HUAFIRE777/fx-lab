// huafire3d fx-lab — original implementation
// 3D 场景：渲染器、灯光、模型归一化、包围盒切片分解视图、相机轨道。
// 对外 API 全部是滚动进度 p(0~1) 的纯函数 → 天然可逆。

import * as THREE from 'three';
import { GLTFLoader } from '../vendor/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from '../vendor/addons/loaders/DRACOLoader.js';
import { DRACO_WASM_WRAPPER_B64, DRACO_WASM_B64 } from './draco-bin.js';

// Draco 解码器内联：单文件构建后无相对路径可取，
// 用 base64 常量直接喂给 DRACOLoader（dev 与单文件行为一致）。
function makeDracoLoader() {
  const b64ToBytes = (b64) => {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };
  const loader = new DRACOLoader();
  loader.setDecoderConfig({ type: 'wasm' });
  const fallback = loader._loadLibrary.bind(loader);
  loader._loadLibrary = (url, responseType) => {
    if (url === 'draco_wasm_wrapper.js') return Promise.resolve(atob(DRACO_WASM_WRAPPER_B64));
    if (url === 'draco_decoder.wasm') return Promise.resolve(b64ToBytes(DRACO_WASM_B64).buffer);
    return fallback(url, responseType);
  };
  return loader;
}

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
// 进度区间映射：p 在 [a,b] 内 0→1 平滑过渡
const band = (p, a, b) => smooth(clamp01((p - a) / (b - a)));

// 关键帧插值（相机轨道）
function keyTrack(keys, p, out) {
  if (p <= keys[0].p) return Object.assign(out, keys[0]);
  for (let i = 0; i < keys.length - 1; i++) {
    const A = keys[i], B = keys[i + 1];
    if (p <= B.p) {
      const t = smooth((p - A.p) / (B.p - A.p));
      for (const k of ['angle', 'radius', 'height', 'targetY'])
        out[k] = A[k] + (B[k] - A[k]) * t;
      return out;
    }
  }
  return Object.assign(out, keys[keys.length - 1]);
}

export async function createScene(canvas, config, opts, onLoad) {
  const { isMobile } = opts;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: isMobile ? config.quality.antialiasMobile : true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, isMobile ? config.quality.dprMobile : config.quality.dprDesktop)
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true; // 分解视图的切片裁剪
  renderer.setClearColor(0x0b0d10, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b0d10, 7, 14);

  const camera = new THREE.PerspectiveCamera(config.camera.fov, 1, 0.05, 60);

  // 灯光：半球 + 主光 + 轮廓光，无阴影（省性能、零报错面）
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1410, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4.5, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x86b8ff, 1.1);
  rim.position.set(-3.5, 1.5, -3);
  scene.add(rim);
  const warm = new THREE.PointLight(0xffb35c, 12, 12, 2);
  warm.position.set(0, 0.4, 2.2);
  scene.add(warm);

  // 地面微光盘（产品摄影感）：收敛、克制
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.7, 48),
    new THREE.MeshBasicMaterial({ color: 0x11151b, transparent: true, opacity: 0.9 })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = -0.62;
  scene.add(disc);
  const glow = new THREE.Mesh(
    new THREE.RingGeometry(1.04, 1.14, 64),
    new THREE.MeshBasicMaterial({ color: 0xf5a623, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -0.615;
  scene.add(glow);

  // ---- 模型加载 ----
  const loader = new GLTFLoader();
  loader.setDRACOLoader(makeDracoLoader()); // 模型为 Draco 压缩
  const gltf = await new Promise((resolve, reject) =>
    loader.load(config.modelUrl, resolve, onLoad, reject)
  );
  let mesh = null;
  gltf.scene.traverse((o) => { if (!mesh && o.isMesh) mesh = o; });
  if (!mesh) throw new Error('model has no mesh');

  // ---- 归一化：最长水平边 → X 轴，宽度 = modelWidth，居中 ----
  const rig = new THREE.Group(); // 静态装配架（分解后不再动，保证裁剪面世界坐标有效）
  scene.add(rig);
  rig.add(mesh);
  let bestRy = 0, bestX = -1;
  for (const ry of [0, Math.PI / 2]) {
    mesh.rotation.set(0, ry, 0);
    mesh.updateMatrixWorld(true);
    const s = new THREE.Box3().setFromObject(mesh).getSize(V3()).x;
    if (s > bestX) { bestX = s; bestRy = ry; }
  }
  mesh.rotation.set(0, bestRy, 0);
  mesh.updateMatrixWorld(true);
  const rawSize = new THREE.Box3().setFromObject(mesh).getSize(V3());
  mesh.scale.setScalar(config.modelWidth / rawSize.x);
  mesh.updateMatrixWorld(true);
  const c0 = new THREE.Box3().setFromObject(mesh).getCenter(V3());
  mesh.position.sub(c0); // 世界包围盒居中到原点
  mesh.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(mesh); // 最终世界包围盒
  const boxSize = box.getSize(V3());
  const boxCenter = box.getCenter(V3());

  // ---- 分解视图：按包围盒切 grid 块，每块独立裁剪面 + 径向散开 ----
  const grid = isMobile ? config.explode.gridMobile : config.explode.grid;
  const parts = [];
  const geom = mesh.geometry;
  for (let ix = 0; ix < grid[0]; ix++)
    for (let iy = 0; iy < grid[1]; iy++)
      for (let iz = 0; iz < grid[2]; iz++) {
        const min = V3(
          box.min.x + boxSize.x * (ix / grid[0]),
          box.min.y + boxSize.y * (iy / grid[1]),
          box.min.z + boxSize.z * (iz / grid[2])
        );
        const max = V3(
          box.min.x + boxSize.x * ((ix + 1) / grid[0]),
          box.min.y + boxSize.y * ((iy + 1) / grid[1]),
          box.min.z + boxSize.z * ((iz + 1) / grid[2])
        );
        // 保留块内：6 个法线朝内的裁剪面（three.js 裁掉平面负侧）。
        // 注意：裁剪面是世界坐标，部件移动时必须同步平移（见 update），
        // 否则部件一动就滑出自己的 cell 被裁没。
        const basePlanes = [
          new THREE.Plane(V3(1, 0, 0), -min.x), new THREE.Plane(V3(-1, 0, 0), max.x),
          new THREE.Plane(V3(0, 1, 0), -min.y), new THREE.Plane(V3(0, -1, 0), max.y),
          new THREE.Plane(V3(0, 0, 1), -min.z), new THREE.Plane(V3(0, 0, -1), max.z),
        ];
        const mat = mesh.material.clone();
        mat.clippingPlanes = basePlanes.map((pl) => pl.clone());
        const part = new THREE.Mesh(geom, mat);
        part.rotation.copy(mesh.rotation);
        part.scale.copy(mesh.scale);
        part.position.copy(mesh.position);
        part.visible = false;
        const cellCenter = min.clone().add(max).multiplyScalar(0.5);
        const dir = cellCenter.clone().sub(boxCenter);
        if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0); else dir.normalize();
        rig.add(part);
        parts.push({ mesh: part, dir, cellCenter, basePlanes });
      }

  // 卖点锚点：挂到所属分块上，分解时跟随部件走
  // （先刷新矩阵，worldToLocal 才准）
  rig.updateMatrixWorld(true);
  const anchors = config.labels.map((L) => {
    const world = V3(
      box.min.x + boxSize.x * L.anchor[0],
      box.min.y + boxSize.y * L.anchor[1],
      box.min.z + boxSize.z * L.anchor[2]
    );
    let owner = parts[0], best = Infinity;
    for (const pt of parts) {
      const d = pt.cellCenter.distanceToSquared(world);
      if (d < best) { best = d; owner = pt; }
    }
    const o = new THREE.Object3D();
    o.position.copy(owner.mesh.worldToLocal(world.clone()));
    owner.mesh.add(o);
    return o;
  });

  // ---- 逐帧更新：纯 p 函数，可逆 ----
  const camState = {};
  const tmpV = V3();
  const tmpOff = V3();
  function update(p) {
    // 分解进度
    const e = band(p, config.explode.range[0], config.explode.range[1]);
    const dist = config.explode.distance * e;
    for (const pt of parts) {
      pt.mesh.visible = e > 0.002;
      if (!pt.mesh.visible) continue;
      // 部件平移 + 裁剪面同步平移（平面平移 t：constant -= normal·t）
      tmpOff.copy(pt.dir).multiplyScalar(dist);
      pt.mesh.position.copy(mesh.position).add(tmpOff);
      const cps = pt.mesh.material.clippingPlanes;
      for (let i = 0; i < cps.length; i++) {
        cps[i].copy(pt.basePlanes[i]);
        cps[i].constant -= cps[i].normal.dot(tmpOff);
      }
    }
    mesh.visible = e <= 0.002;
    glow.material.opacity = 0.1 * (1 - e * 0.6);

    // 相机轨道
    keyTrack(config.camera.keys, p, camState);
    const a = (camState.angle * Math.PI) / 180;
    camera.position.set(
      Math.sin(a) * camState.radius,
      camState.height,
      Math.cos(a) * camState.radius
    );
    camera.lookAt(tmpV.set(0, camState.targetY, 0));
    renderer.render(scene, camera);
    return e;
  }

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // 世界坐标 → 屏幕像素（含 behind 判定）
  const projV = V3();
  function project(world) {
    projV.copy(world).project(camera);
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    return {
      x: (projV.x * 0.5 + 0.5) * w,
      y: (-projV.y * 0.5 + 0.5) * h,
      behind: projV.z > 1,
    };
  }

  return { update, resize, anchors, parts, box, boxCenter, project, rig };
}
