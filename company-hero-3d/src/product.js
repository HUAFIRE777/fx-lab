/* huafire3d fx-lab — original implementation */
/* company-hero-3d · hero 右侧真实 3D 产品：悬浮、慢转、随鼠标视差
   加载失败时静默隐藏，不破坏版式、不抛错 */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/addons/GLTFLoader.js';

export function loadProduct(scene, cfg, isMobile) {
  const group = new THREE.Group();
  const mc = isMobile ? cfg.mobile : cfg;
  group.position.set(...mc.position);
  group.visible = false;
  scene.add(group);

  /* 影棚灯光：只照亮产品，不碰粒子 */
  const hemi = new THREE.HemisphereLight(0x8a93b8, 0x0a0c14, 0.55);
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(3.5, 4.5, 5);
  const rim = new THREE.PointLight(0x7c6cff, 30, 0, 2);
  rim.position.set(-2.5, 1.2, 1.5);
  scene.add(hemi, key, rim);

  const state = { ready: false, pop: 0 };

  new GLTFLoader().load(
    cfg.url,
    (gltf) => {
      const root = gltf.scene;
      /* 归一化：按包围盒缩放到目标高度，底部居中 */
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const s = mc.targetHeight / Math.max(size.y, 1e-4);
      root.scale.setScalar(s);
      root.position.sub(center.clone().multiplyScalar(s));
      root.position.y += (mc.targetHeight / 2);
      group.add(root);
      group.visible = true;
      state.ready = true;
    },
    undefined,
    () => { /* 加载失败：保持隐藏，版式不受影响 */ }
  );

  return {
    get ready() { return state.ready; },
    tick(t, dt, mouse) {
      if (!state.ready) return;
      /* 入场：scale 弹一下（expo-out，有物理感） */
      if (state.pop < 1) {
        state.pop = Math.min(1, state.pop + dt / 1.1);
        const e = 1 - Math.pow(2, -10 * state.pop);
        const sc = 0.82 + 0.18 * (state.pop >= 1 ? 1 : e);
        group.scale.setScalar(sc);
      }
      /* 悬浮：慢转 + 呼吸浮动 + 鼠标视差（lerp 跟随） */
      group.rotation.y = t * 0.28;
      group.position.y = mc.position[1] + Math.sin(t * 0.9) * 0.09 + mouse.y * 0.12;
      group.position.x += ((mc.position[0] + mouse.x * 0.28) - group.position.x) * Math.min(1, dt * 2.2);
      group.rotation.z = Math.sin(t * 0.5) * 0.04;
    },
  };
}
