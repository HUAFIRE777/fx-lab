// huafire3d fx-lab — original implementation · lab-experiment-3d
// 程序化光学实验台：光具座 / 蜡烛 / 双凸透镜 / 光屏 / 三束光线 / 像箭头
import * as THREE from 'three';
import { F, CANDLE_X, AXIS_Y, H_OBJ, BLUE, CYAN, INK } from './config.js';

// ---------- 文字精灵（canvas 手绘标签，无外部字体） ----------
export function makeLabel(text, { size = 46, color = '#16222e', pad = 18, scale = 0.62 } = {}) {
  const cv = document.createElement('canvas');
  const cx = cv.getContext('2d');
  cx.font = `700 ${size}px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;
  const w = Math.ceil(cx.measureText(text).width) + pad * 2;
  const h = size + pad * 2;
  cv.width = w * 2; cv.height = h * 2; // 2x 清晰度
  const c2 = cv.getContext('2d');
  c2.scale(2, 2);
  c2.font = `700 ${size}px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;
  c2.textBaseline = 'middle';
  c2.fillStyle = color;
  c2.fillText(text, pad, h / 2 + 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(scale * (w / h), scale, 1);
  return sp;
}

// ---------- 环境：地面 / 网格 / 光具座 / 主光轴 / 刻度 ----------
export function buildEnvironment(scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 18),
    new THREE.MeshStandardMaterial({ color: 0xe9eef3, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const grid = new THREE.GridHelper(24, 48, 0xc3d0dd, 0xd9e2ec);
  grid.position.y = 0.012;
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  scene.add(grid);

  // 光具座导轨
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(9.8, 0.18, 1.15),
    new THREE.MeshStandardMaterial({ color: 0xd5dfea, roughness: 0.7 })
  );
  rail.position.y = 0.81;
  scene.add(rail);
  const railEdge = new THREE.Mesh(
    new THREE.BoxGeometry(9.8, 0.03, 1.15),
    new THREE.MeshStandardMaterial({ color: 0xb9c8d8, roughness: 0.7 })
  );
  railEdge.position.y = 0.915;
  scene.add(railEdge);

  // 主光轴
  const axis = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 0.022, 0.022),
    new THREE.MeshBasicMaterial({ color: 0x9fb2c5 })
  );
  axis.position.y = AXIS_Y;
  scene.add(axis);

  // 刻度（每 0.5 一个）
  const tickMat = new THREE.MeshBasicMaterial({ color: 0xa9bccd });
  for (let x = -4.5; x <= 4.51; x += 0.5) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.1, 0.5), tickMat);
    t.position.set(x, 0.96, 0);
    scene.add(t);
  }
}

// ---------- 蜡烛 ----------
export function buildCandle() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf6f8fb, roughness: 0.55 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.75, 24), bodyMat);
  body.position.y = 0.9 + 0.375;
  g.add(body);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.08, 24),
    new THREE.MeshStandardMaterial({ color: BLUE, roughness: 0.5 }));
  dish.position.y = 0.94;
  g.add(dish);
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8),
    new THREE.MeshStandardMaterial({ color: INK }));
  wick.position.y = 0.9 + 0.75 + 0.05;
  g.add(wick);
  // 烛焰：青色光锥（风格化），焰尖 = 物点 O
  const flameY = AXIS_Y + H_OBJ;
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, flameY - (0.9 + 0.75), 20),
    new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.92 })
  );
  flame.position.y = (0.9 + 0.75 + flameY) / 2;
  g.add(flame);
  const glow = new THREE.PointLight(0xbfefff, 6, 7, 1.6);
  glow.position.y = flameY - 0.1;
  g.add(glow);
  const label = makeLabel('蜡烛', { scale: 0.5 });
  label.position.y = 0.52;
  label.position.z = 0.85;
  g.add(label);
  g.position.x = CANDLE_X;
  return g;
}

// ---------- 双凸透镜（可拖拽） ----------
export function buildLens() {
  const g = new THREE.Group();
  const R = 0.95, TH = 0.26;
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * Math.PI / 2;
    pts.push(new THREE.Vector2(Math.max(0.001, R * Math.sin(a)), (TH / 2) * Math.cos(a)));
  }
  for (let i = 20; i >= 0; i--) {
    const a = (i / 20) * Math.PI / 2;
    pts.push(new THREE.Vector2(Math.max(0.001, R * Math.sin(a)), -(TH / 2) * Math.cos(a)));
  }
  const lensGeo = new THREE.LatheGeometry(pts, 56);
  lensGeo.rotateZ(Math.PI / 2); // 轴线转到 X 方向
  const lens = new THREE.Mesh(lensGeo, new THREE.MeshPhysicalMaterial({
    color: BLUE, transparent: true, opacity: 0.5, roughness: 0.12, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.15, side: THREE.DoubleSide,
  }));
  lens.position.y = AXIS_Y;
  g.add(lens);
  // 高光 streak
  const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 1.25),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  streak.position.set(-0.1, AXIS_Y + 0.12, 0.1);
  streak.rotation.z = 0.35;
  g.add(streak);
  // 镜框 + 支架
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R + 0.02, 0.045, 12, 64),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45 }));
  ring.rotation.y = Math.PI / 2;
  ring.position.y = AXIS_Y;
  g.add(ring);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, AXIS_Y - R - 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0x8fa3b8, roughness: 0.5 }));
  stem.position.y = 0.9 + (AXIS_Y - R - 0.9) / 2;
  g.add(stem);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x8fa3b8, roughness: 0.5 }));
  foot.position.y = 0.95;
  g.add(foot);
  const label = makeLabel('凸透镜', { color: '#1d4ed8', scale: 0.5 });
  label.position.y = 0.52;
  label.position.z = 0.85;
  g.add(label);
  // 隐形抓取体（好拖）
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 1.0, 12),
    new THREE.MeshBasicMaterial({ visible: false }));
  hit.rotation.z = Math.PI / 2;
  hit.position.y = AXIS_Y;
  hit.userData.isLensHit = true;
  g.add(hit);
  return { group: g, hitbox: hit };
}

// ---------- F / 2F 标记（跟随透镜） ----------
export function buildFMarks() {
  const g = new THREE.Group();
  const mk = (dx, text) => {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.34),
      new THREE.MeshBasicMaterial({ color: BLUE }));
    tick.position.set(dx, 1.06, 0);
    const lb = makeLabel(text, { size: 44, color: '#1d4ed8', scale: 0.42 });
    lb.position.set(dx, 1.42, 0);
    g.add(tick, lb);
  };
  mk(-F, 'F'); mk(F, 'F′'); mk(-2 * F, '2F'); mk(2 * F, '2F′');
  return g;
}

// ---------- 光屏 ----------
export function buildScreen() {
  const g = new THREE.Group();
  const S = 1.7;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(S, S),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: THREE.DoubleSide }));
  board.rotation.y = Math.PI / 2;
  board.position.y = AXIS_Y;
  g.add(board);
  const fm = new THREE.MeshStandardMaterial({ color: BLUE, roughness: 0.45 });
  const bar = (w, h, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, h, w), fm);
    m.position.set(0, y, z);
    g.add(m);
  };
  bar(S + 0.14, 0.07, AXIS_Y + S / 2 + 0.035, 0);
  bar(S + 0.14, 0.07, AXIS_Y - S / 2 - 0.035, 0);
  const side1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, S + 0.14, 0.07), fm);
  side1.position.set(0, AXIS_Y, S / 2 + 0.035); g.add(side1);
  const side2 = side1.clone(); side2.position.z = -S / 2 - 0.035; g.add(side2);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, AXIS_Y - S / 2 - 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0x8fa3b8, roughness: 0.5 }));
  stem.position.y = 0.9 + (AXIS_Y - S / 2 - 0.9) / 2;
  g.add(stem);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x8fa3b8, roughness: 0.5 }));
  foot.position.y = 0.95;
  g.add(foot);
  const label = makeLabel('光屏', { color: '#1d4ed8', scale: 0.5 });
  label.position.y = 0.52;
  label.position.z = 0.85;
  g.add(label);
  // 像的光斑（实像落在屏上时点亮）
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24),
    new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.9 }));
  spot.rotation.y = -Math.PI / 2;
  spot.position.set(-0.02, AXIS_Y, 0);
  spot.visible = false;
  g.add(spot);
  return { group: g, spot };
}

// ---------- 三束光线 ----------
export class RaySet {
  constructor(scene) {
    this.solids = [];
    this.dashes = [];
    for (let i = 0; i < 3; i++) {
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
      const s = new THREE.Line(sg, new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.95 }));
      s.frustumCulled = false;
      scene.add(s);
      this.solids.push(s);
      const dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const d = new THREE.Line(dg, new THREE.LineDashedMaterial({
        color: CYAN, dashSize: 0.14, gapSize: 0.1, transparent: true, opacity: 0.75,
      }));
      d.frustumCulled = false;
      scene.add(d);
      this.dashes.push(d);
    }
  }
  setSolid(i, pts) {
    const a = this.solids[i].geometry.attributes.position;
    pts.forEach((p, k) => a.setXYZ(k, p[0], p[1], p[2] || 0));
    a.needsUpdate = true;
  }
  setDash(i, p0, p1, show) {
    const line = this.dashes[i];
    line.visible = show;
    if (!show) return;
    const a = line.geometry.attributes.position;
    a.setXYZ(0, p0[0], p0[1], p0[2] || 0);
    a.setXYZ(1, p1[0], p1[1], p1[2] || 0);
    a.needsUpdate = true;
    line.computeLineDistances();
  }
}

// ---------- 像箭头 ----------
export function buildImageArrow(scene) {
  const g = new THREE.Group();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const shaft = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: BLUE }));
  shaft.frustumCulled = false;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 16),
    new THREE.MeshBasicMaterial({ color: BLUE }));
  const tag0 = makeLabel('像', { color: '#1d4ed8', scale: 0.42 });
  g.add(shaft, head, tag0);
  g.visible = false;
  scene.add(g);
  let curTag = tag0, curText = '像', curColor = '#1d4ed8';
  return {
    group: g,
    // x: 像位置, s: +1 正立(向上) / -1 倒立(向下), len: 像高, virtual: 是否虚像
    show(x, s, len, virtual, text) {
      g.visible = true;
      const a = geo.attributes.position;
      a.setXYZ(0, x, AXIS_Y, 0);
      a.setXYZ(1, x, AXIS_Y + s * len, 0);
      a.needsUpdate = true;
      head.position.set(x, AXIS_Y + s * len + s * 0.1, 0);
      head.rotation.x = s > 0 ? 0 : Math.PI;
      const op = virtual ? 0.55 : 1;
      shaft.material.transparent = virtual;
      shaft.material.opacity = op;
      head.material.transparent = virtual;
      head.material.opacity = op;
      // 标签文字变化时才重建精灵（避免每帧分配纹理）
      const wantColor = virtual ? '#0e7490' : '#1d4ed8';
      if (text !== curText || wantColor !== curColor) {
        g.remove(curTag);
        curTag.material.map.dispose();
        curTag.material.dispose();
        curTag = makeLabel(text, { color: wantColor, scale: 0.42 });
        g.add(curTag);
        curText = text; curColor = wantColor;
      }
      curTag.position.set(x, AXIS_Y + s * (len + 0.42), 0);
    },
    hide() { g.visible = false; },
  };
}
