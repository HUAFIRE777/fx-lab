// huafire3d fx-lab — original implementation · lookbook-scroll
// 抽象服装形体：雕塑感单品陈列，零外部依赖
import * as THREE from 'three';

function mat(color, rough = 0.62) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.05, roughness: rough, side: THREE.DoubleSide });
}
function pedestal() {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.78, 0.14, 40),
    new THREE.MeshStandardMaterial({ color: 0xd9d0bd, metalness: 0.05, roughness: 0.8 })
  );
  m.position.y = -0.72;
  return m;
}
function lathe(profile, color, phiStart = 0, phiLength = Math.PI * 2) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 48, phiStart, phiLength), mat(color));
}

// 01 长裙：收腰放摆的钟形
function dress() {
  const g = new THREE.Group();
  g.add(lathe([
    [0.16, 1.55], [0.20, 1.30], [0.24, 1.05], [0.34, 0.70],
    [0.48, 0.40], [0.62, 0.12], [0.68, -0.05],
  ], 0x8ba3b8));
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.22, 24), mat(0x8ba3b8));
  neck.position.y = 1.62;
  g.add(neck, pedestal());
  return g;
}

// 02 风衣：敞开前襟的直筒 + 立领
function coat() {
  const g = new THREE.Group();
  g.add(lathe([
    [0.30, 1.55], [0.32, 1.20], [0.36, 0.80], [0.42, 0.40], [0.48, 0.02],
  ], 0xc9ab7f, 0.55, Math.PI * 2 - 1.1));
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 12, 32, Math.PI * 1.4), mat(0xc9ab7f));
  collar.position.y = 1.62;
  collar.rotation.z = Math.PI * 0.8;
  g.add(collar, pedestal());
  return g;
}

// 03 西装：垫肩躯干 + 翻领
function suit() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.40, 1.35, 28, 1, true), mat(0x2b2723, 0.55));
  body.position.y = 0.75;
  g.add(body);
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.4), mat(0x2b2723, 0.55));
  shoulder.position.y = 1.44;
  g.add(shoulder);
  [-1, 1].forEach((s) => {
    const lapel = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.62), mat(0x3a352d, 0.5));
    lapel.position.set(s * 0.13, 1.05, 0.36);
    lapel.rotation.set(-0.12, s * -0.35, s * 0.28);
    g.add(lapel);
  });
  g.add(pedestal());
  return g;
}

// 04 高领衫：五层针织环 + 领口
function sweater() {
  const g = new THREE.Group();
  const c = 0xe6dfcf;
  const rings = [0.36, 0.35, 0.33, 0.30, 0.26];
  rings.forEach((r, i) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.115, 16, 40), mat(c, 0.9));
    t.rotation.x = Math.PI / 2;
    t.position.y = 0.95 - i * 0.21;
    g.add(t);
  });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.3, 24), mat(c, 0.9));
  neck.position.y = 1.25;
  g.add(neck, pedestal());
  return g;
}

// 05 球鞋：鞋底 + 鞋面 + 三道鞋带
function sneaker() {
  const g = new THREE.Group();
  const c = 0xb4552d;
  const sole = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.2, 0.46), mat(0xf0e9d8, 0.7));
  sole.position.y = -0.42;
  g.add(sole);
  const toe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), mat(c, 0.6));
  toe.scale.set(1.5, 0.85, 0.95);
  toe.position.set(0.32, -0.22, 0);
  g.add(toe);
  const upper = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2), mat(c, 0.6));
  upper.scale.set(1.1, 1.0, 0.9);
  upper.position.set(-0.22, -0.32, 0);
  upper.rotation.z = 0.5;
  g.add(upper);
  [-0.28, -0.16, -0.04].forEach((x) => {
    const lace = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.4, 8), mat(0xf0e9d8, 0.8));
    lace.rotation.x = Math.PI / 2;
    lace.position.set(x, -0.02 + (x + 0.28) * 0.55, 0);
    g.add(lace);
  });
  const heel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.44), mat(c, 0.6));
  heel.position.set(-0.42, -0.12, 0);
  g.add(heel);
  g.add(pedestal());
  return g;
}

export const BUILDERS = { dress, coat, suit, sweater, sneaker };
