// huafire3d fx-lab — original implementation · formula-derive-3d
// 四步 3D 辅助图形：数列柱 / 倒序行+弧线箭头 / 配对塔 / 矩形取半
// 全部程序化几何，零外部依赖。
import * as THREE from 'three';
import { INK, VERM, N_BARS, UNIT } from './config.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof window.gsap !== 'undefined';

const BW = 0.34, GAP = 0.22, BD = 0.34; // 柱宽 / 间距 / 柱深
const matInk = () => new THREE.MeshStandardMaterial({ color: INK, roughness: 0.62, metalness: 0.04 });
const matVerm = (op = 1) => new THREE.MeshStandardMaterial({
  color: VERM, roughness: 0.5, metalness: 0.04, transparent: op < 1, opacity: op,
});

function barMesh(h, mat) {
  const g = new THREE.BoxGeometry(BW, 1, BD);
  g.translate(0, 0.5, 0); // 缩放从底部生长
  const m = new THREE.Mesh(g, mat);
  m.scale.y = 0.0001;
  m.userData.fullH = h;
  return m;
}

function basePlate(w) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.07, 1.5),
    new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 0.9 })
  );
  m.position.y = -0.035;
  return m;
}

// 图一：数列柱 —— 8 根，a₁/aₙ 朱红
function buildStep1() {
  const group = new THREE.Group();
  const bars = [];
  for (let i = 1; i <= N_BARS; i++) {
    const edge = (i === 1 || i === N_BARS);
    const b = barMesh(i * UNIT, edge ? matVerm() : matInk());
    b.position.x = (i - 1 - (N_BARS - 1) / 2) * (BW + GAP);
    group.add(b);
    bars.push(b);
  }
  group.add(basePlate(N_BARS * (BW + GAP) + 0.6));
  return {
    group,
    intro() {
      if (!hasGsap || reducedMotion) { bars.forEach((b) => { b.scale.y = b.userData.fullH; }); return; }
      bars.forEach((b, i) => {
        gsap.to(b.scale, { y: b.userData.fullH, duration: 0.7, delay: 0.15 + i * 0.09, ease: 'power3.out' });
      });
    },
  };
}

// 图二：倒序行 —— 反向 8 根（朱红半透明）+ 顶部翻转弧线箭头
function buildStep2() {
  const group = new THREE.Group();
  const bars = [];
  for (let i = 1; i <= N_BARS; i++) {
    const h = (N_BARS + 1 - i) * UNIT;
    const b = barMesh(h, matVerm(0.42));
    b.position.set((i - 1 - (N_BARS - 1) / 2) * (BW + GAP), 0, -1.15);
    group.add(b);
    bars.push(b);
  }
  group.add(basePlate(N_BARS * (BW + GAP) + 0.6));
  // 弧线箭头：半圆托鲁斯 + 锥头
  const arrow = new THREE.Group();
  const arc = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.035, 10, 72, Math.PI * 0.92), matVerm());
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.3, 16), matVerm());
  const endA = Math.PI * 0.92;
  head.position.set(Math.cos(endA) * 1.9, Math.sin(endA) * 1.9, 0);
  head.rotation.z = endA - Math.PI / 2 + 0.5;
  arrow.add(arc, head);
  arrow.rotation.x = -Math.PI / 2 + 0.18;
  arrow.rotation.z = Math.PI * 0.04;
  arrow.position.y = N_BARS * UNIT + 1.15;
  arrow.scale.setScalar(0.0001);
  group.add(arrow);
  return {
    group,
    intro() {
      if (!hasGsap || reducedMotion) {
        bars.forEach((b) => { b.scale.y = b.userData.fullH; });
        arrow.scale.setScalar(1);
        return;
      }
      bars.forEach((b, i) => {
        gsap.to(b.scale, { y: b.userData.fullH, duration: 0.6, delay: 0.1 + i * 0.08, ease: 'power3.out' });
      });
      gsap.to(arrow.scale, { x: 1, y: 1, z: 1, duration: 0.8, delay: 0.55, ease: 'back.out(1.6)' });
      gsap.fromTo(arrow.rotation, { z: Math.PI * 0.04 - 0.5 }, { z: Math.PI * 0.04, duration: 0.9, delay: 0.55, ease: 'power3.out' });
    },
  };
}

// 图三：配对塔 —— 4 座等高塔（每座 = 首尾两项之和），朱红顶盖
function buildStep3() {
  const group = new THREE.Group();
  const towers = [], caps = [];
  const towerH = (N_BARS + 1) * UNIT; // i + (n+1-i) = n+1
  const TW = 0.62;
  for (let i = 0; i < N_BARS / 2; i++) {
    const g = new THREE.BoxGeometry(TW, 1, 0.6);
    g.translate(0, 0.5, 0);
    const t = new THREE.Mesh(g, matInk());
    t.scale.y = 0.0001;
    t.userData.fullH = towerH;
    t.position.x = (i - (N_BARS / 4 - 0.5)) * (TW + 0.55);
    const capG = new THREE.BoxGeometry(TW + 0.06, 0.09, 0.66);
    const cap = new THREE.Mesh(capG, matVerm());
    cap.position.set(t.position.x, towerH + 0.045, 0);
    cap.scale.setScalar(0.0001);
    group.add(t, cap);
    towers.push(t); caps.push(cap);
  }
  group.add(basePlate((N_BARS / 2) * (TW + 0.55) + 0.9));
  return {
    group,
    intro() {
      if (!hasGsap || reducedMotion) {
        towers.forEach((t) => { t.scale.y = t.userData.fullH; });
        caps.forEach((c) => c.scale.setScalar(1));
        return;
      }
      towers.forEach((t, i) => {
        gsap.to(t.scale, { y: t.userData.fullH, duration: 0.75, delay: 0.12 + i * 0.14, ease: 'power3.out' });
      });
      caps.forEach((c, i) => {
        gsap.to(c.scale, { x: 1, y: 1, z: 1, duration: 0.5, delay: 0.55 + i * 0.14, ease: 'back.out(2.2)' });
      });
    },
  };
}

// 图四：矩形取半 —— 整块矩形 + 朱红对角线扫过 + 半透明三角（= S）
function buildStep4() {
  const group = new THREE.Group();
  const W = (N_BARS / 2) * (0.62 + 0.55) + 0.4;
  const H = (N_BARS + 1) * UNIT;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.5), matInk());
  plate.position.y = H / 2;
  plate.scale.set(0.0001, 0.0001, 1);
  group.add(plate);
  // 对角线：几何原点移到起点，便于 scale.x 生长
  const diagLen = Math.hypot(W, H);
  const dg = new THREE.BoxGeometry(diagLen, 0.07, 0.07);
  dg.translate(diagLen / 2, 0, 0);
  const diag = new THREE.Mesh(dg, matVerm());
  diag.position.set(-W / 2, 0, 0.29);
  diag.rotation.z = Math.atan2(H, W);
  diag.scale.x = 0.0001;
  group.add(diag);
  // S 三角：左下半
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0); shape.lineTo(-W / 2, H); shape.closePath();
  const tri = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color: VERM, transparent: true, opacity: 0 })
  );
  tri.position.z = 0.3;
  group.add(tri);
  group.add(basePlate(W + 0.6));
  return {
    group,
    intro() {
      if (!hasGsap || reducedMotion) {
        plate.scale.set(1, 1, 1); diag.scale.x = 1; tri.material.opacity = 0.32;
        return;
      }
      gsap.to(plate.scale, { x: 1, y: 1, duration: 0.7, delay: 0.1, ease: 'power3.out' });
      gsap.to(diag.scale, { x: 1, duration: 0.8, delay: 0.65, ease: 'power3.inOut' });
      gsap.to(tri.material, { opacity: 0.32, duration: 0.6, delay: 1.1, ease: 'power2.out' });
    },
  };
}

export const BUILDERS = [buildStep1, buildStep2, buildStep3, buildStep4];
