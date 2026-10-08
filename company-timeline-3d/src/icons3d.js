// huafire3d fx-lab — original implementation
// 里程碑 3D 图标：全部由 Three.js 基础几何体程序化搭建，无外部模型。
// 每个图标一个极小场景（64px 徽章内），只在进入视口时渲染。
import * as THREE from 'three';

function mat(color, emissiveIntensity = 0.25) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.35, metalness: 0.6,
    emissive: color, emissiveIntensity,
  });
}

const BUILDERS = {
  // 火箭：柱体机身 + 锥形整流罩 + 3 片尾翼 + 尾焰
  rocket(accent) {
    const g = new THREE.Group();
    const silver = mat(0xd7dde8, 0.08);
    const gold = mat(accent, 0.45);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 1.0, 24), silver);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.30, 0.52, 24), gold);
    nose.position.y = 0.76;
    const win = new THREE.Mesh(new THREE.SphereGeometry(0.10, 16, 12), mat(0x223349, 0.1));
    win.position.set(0, 0.18, 0.27);
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.17, 0.42, 16),
      new THREE.MeshBasicMaterial({ color: 0xffb14e })
    );
    flame.rotation.x = Math.PI;
    flame.position.y = -0.72;
    g.add(body, nose, win, flame);
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.28), gold);
      const a = (i / 3) * Math.PI * 2;
      fin.position.set(Math.cos(a) * 0.34, -0.32, Math.sin(a) * 0.34);
      fin.rotation.y = -a;
      g.add(fin);
    }
    return g;
  },

  // 金币：币面 + 外圈
  coin(accent) {
    const g = new THREE.Group();
    const gold = mat(accent, 0.5);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 32), gold);
    face.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 12, 40), gold);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.03, 10, 32), mat(0x8a6420, 0.2));
    g.add(face, rim, inner);
    return g;
  },

  // 地球：线框球 + 深色内核，倾斜地轴
  globe(accent) {
    const g = new THREE.Group();
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(0.56, 20, 14),
      new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.85 })
    );
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.50, 20, 14),
      new THREE.MeshStandardMaterial({ color: 0x141c2b, roughness: 0.8, metalness: 0.1 })
    );
    g.add(core, wire);
    g.rotation.z = 0.35;
    return g;
  },

  // 奖杯：杯体 + 双耳 + 底座
  trophy(accent) {
    const g = new THREE.Group();
    const gold = mat(accent, 0.5);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.20, 0.55, 24), gold);
    cup.position.y = 0.28;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.32, 12), gold);
    stem.position.y = -0.12;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.34, 0.13, 24), mat(0x2a2f3a, 0.1));
    base.position.y = -0.34;
    g.add(cup, stem, base);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.045, 12, 24, Math.PI), gold);
      ear.position.set(s * 0.44, 0.30, 0);
      ear.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2;
      g.add(ear);
    }
    return g;
  },

  // 大楼：三层退台 + 天线
  tower(accent) {
    const g = new THREE.Group();
    const body = mat(0x3a4356, 0.12);
    const gold = mat(accent, 0.4);
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.45, 0.80), body); b1.position.y = -0.36;
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.45, 0.60), body); b2.position.y = 0.09;
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.42), gold); b3.position.y = 0.50;
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 8), gold);
    ant.position.y = 0.85;
    g.add(b1, b2, b3, ant);
    return g;
  },

  // 星：八面体拉长，象征走向全球
  star(accent) {
    const g = new THREE.Group();
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.52), mat(accent, 0.55));
    s.scale.y = 1.25;
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.02, 8, 48),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5 })
    );
    halo.rotation.x = Math.PI / 2.4;
    g.add(s, halo);
    return g;
  },
};

/**
 * 在 badge 内的 canvas 上挂载一个极简 3D 图标。
 * 返回 { setVisible(bool), ready: Promise<首帧> }。
 * WebGL 不可用时抛错，由调用方降级为 CSS 圆点。
 */
export function mountIcon(canvas, name, accentCss) {
  const accent = new THREE.Color(accentCss).getHex();
  const builder = BUILDERS[name] || BUILDERS.star;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const S = 112; // 内部渲染分辨率，CSS 显示 56px
  renderer.setPixelRatio(dpr);
  renderer.setSize(S, S, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0, 0.15, 3.4);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2233, 1.1));
  const key = new THREE.DirectionalLight(0xfff2d8, 2.2);
  key.position.set(2.5, 3, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 0.8);
  rim.position.set(-2.5, -1, -2);
  scene.add(rim);

  const group = builder(accent);
  scene.add(group);

  let visible = false;
  let raf = 0;
  let firstFrameResolve;
  const ready = new Promise((res) => { firstFrameResolve = res; });
  let firstFrame = true;
  const t0 = performance.now();

  function tick() {
    raf = 0;
    if (!visible) return;
    const t = (performance.now() - t0) / 1000;
    group.rotation.y = t * 0.55;                       // 缓慢恒速旋转
    group.position.y = Math.sin(t * 1.4) * 0.07;       // 正弦浮动，有物理感
    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; firstFrameResolve(); }
    raf = requestAnimationFrame(tick);
  }

  return {
    ready,
    setVisible(v) {
      if (v === visible) return;
      visible = v;
      if (v && !raf) raf = requestAnimationFrame(tick);
      else if (!v && raf) { cancelAnimationFrame(raf); raf = 0; }
    },
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      renderer.dispose();
    },
  };
}
