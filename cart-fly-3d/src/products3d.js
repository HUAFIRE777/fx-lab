// huafire3d fx-lab — original implementation · cart-fly-3d
// 程序化 3D 商品小件：零外部依赖，四个 builder 各返回一个 ~1 单位高的 Group
import * as THREE from 'three';
import { ACCENT } from './config.js';

const dark = () => new THREE.MeshStandardMaterial({ color: 0x1d2026, metalness: 0.55, roughness: 0.38 });
const light = () => new THREE.MeshStandardMaterial({ color: 0xe9e6df, metalness: 0.08, roughness: 0.5 });
const accent = () => new THREE.MeshStandardMaterial({
  color: ACCENT, metalness: 0.35, roughness: 0.32,
  emissive: ACCENT, emissiveIntensity: 0.35,
});

function pedestal() {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.58, 0.07, 40),
    new THREE.MeshStandardMaterial({ color: 0x23262d, metalness: 0.3, roughness: 0.6 })
  );
  m.position.y = -0.62;
  return m;
}

// 耳机：头梁半环 + 两耳罩 + 橙色饰圈
function headphone() {
  const g = new THREE.Group();
  const d = dark(), a = accent();
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.055, 16, 48, Math.PI), d);
  band.position.y = 0.28;
  g.add(band);
  [-1, 1].forEach((s) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.16, 28), d);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(s * 0.47, 0.22, 0);
    g.add(cup);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 10, 36), a);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(s * (0.47 + 0.085), 0.22, 0);
    g.add(ring);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.05), d);
    stem.position.set(s * 0.47, 0.36, 0);
    g.add(stem);
  });
  g.add(pedestal());
  return g;
}

// 保温杯：杯身 + 杯盖 + 提手半环
function mug() {
  const g = new THREE.Group();
  const l = light(), d = dark(), a = accent();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.62, 36), l);
  body.position.y = 0.02;
  g.add(body);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.1, 36), d);
  lid.position.y = 0.38;
  g.add(lid);
  const bandRing = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.02, 10, 40), a);
  bandRing.rotation.x = Math.PI / 2;
  bandRing.position.y = -0.12;
  g.add(bandRing);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 12, 32, Math.PI), d);
  handle.position.set(0.3, 0.08, 0);
  handle.rotation.z = -Math.PI / 2;
  g.add(handle);
  g.add(pedestal());
  return g;
}

// 手表：表盘方块 + 圆形表盘 + 橙色秒针 + 上下表带
function watch() {
  const g = new THREE.Group();
  const d = dark(), a = accent();
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x2b2e35, metalness: 0.2, roughness: 0.7 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.07), strapMat);
  top.position.y = 0.5;
  const bottom = top.clone();
  bottom.position.y = -0.16;
  g.add(top, bottom);
  const kase = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.14), d);
  kase.position.y = 0.17;
  g.add(kase);
  const dial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.03, 36),
    new THREE.MeshStandardMaterial({ color: 0x0a0b0d, metalness: 0.4, roughness: 0.25 })
  );
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0, 0.17, 0.08);
  g.add(dial);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.13, 0.012), a);
  hand.position.set(0.03, 0.21, 0.1);
  hand.rotation.z = -0.6;
  g.add(hand);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 16), a);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(0.24, 0.17, 0);
  g.add(crown);
  g.add(pedestal());
  return g;
}

// 音箱：圆柱机身 + 顶部橙圈 + 三道格栅环
function speaker() {
  const g = new THREE.Group();
  const d = dark(), a = accent();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.58, 36), d);
  body.position.y = 0.0;
  g.add(body);
  const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 12, 40), a);
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = 0.3;
  g.add(topRing);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 24),
    new THREE.MeshStandardMaterial({ color: 0x33363d, metalness: 0.6, roughness: 0.35 }));
  knob.position.y = 0.31;
  g.add(knob);
  [-0.14, 0.0, 0.14].forEach((y) => {
    const slat = new THREE.Mesh(new THREE.TorusGeometry(0.295, 0.012, 8, 44),
      new THREE.MeshStandardMaterial({ color: 0x3a3e46, metalness: 0.5, roughness: 0.5 }));
    slat.rotation.x = Math.PI / 2;
    slat.position.y = y;
    g.add(slat);
  });
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), a);
  dot.position.set(0, 0.3, 0.24);
  g.add(dot);
  g.add(pedestal());
  return g;
}

export const BUILDERS = { buds: headphone, mug, watch, speaker };
