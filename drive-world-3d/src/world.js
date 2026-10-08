/* drive-world-3d · src/world.js — 程序化低多边形小岛（原创实现） */
import * as THREE from 'three';

// 确定性随机：同一种子永远同一座岛
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261008);
const rr = (a, b) => a + rand() * (b - a);

const C = {
  grass: 0x4ADE80, grassDark: 0x22C55E, leaf: 0x16A34A,
  sand: 0xFDE68A, sandDark: 0xF5D67B, wall: 0xFEF3C7,
  water: 0x8EC9F5, trunk: 0x8a6a45, ink: 0x17211b, gold: 0xFBBF24,
};

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial(Object.assign(
    { color, roughness: 0.9, metalness: 0, flatShading: true }, extra));
}

export function buildWorld(scene) {
  const world = new THREE.Group();
  scene.add(world);
  const colliders = { boxes: [], circles: [] };

  // —— 海床沙盘 + 草地（两层扁圆柱） ——
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(44, 46, 2, 28), mat(C.sand));
  sand.position.y = -1.0; sand.receiveShadow = true; world.add(sand);

  const grass = new THREE.Mesh(new THREE.CylinderGeometry(34, 35, 2.4, 28), mat(C.grass));
  grass.position.y = -0.6; grass.receiveShadow = true; world.add(grass);
  const GROUND_Y = 0.6;

  // 草地色块点缀（扁圆片，深绿 family）
  for (let i = 0; i < 14; i++) {
    const r = rr(2, 5), a = rand() * Math.PI * 2, d = rr(6, 30);
    const patch = new THREE.Mesh(new THREE.CircleGeometry(r, 9), mat(C.grassDark));
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(Math.cos(a) * d, GROUND_Y + 0.015, Math.sin(a) * d);
    patch.receiveShadow = true; world.add(patch);
  }

  // —— 水面 ——
  const water = new THREE.Mesh(new THREE.CircleGeometry(160, 40),
    new THREE.MeshStandardMaterial({ color: C.water, roughness: 0.35, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -1.35; world.add(water);

  // —— 环形土路 ——
  const road = new THREE.Mesh(new THREE.RingGeometry(15.5, 19.5, 48), mat(C.sandDark));
  road.rotation.x = -Math.PI / 2; road.position.y = GROUND_Y + 0.02;
  road.receiveShadow = true; world.add(road);

  // —— 池塘 + 小桥（装饰） ——
  const pond = new THREE.Mesh(new THREE.CircleGeometry(5, 24),
    new THREE.MeshStandardMaterial({ color: C.water, roughness: 0.3 }));
  pond.rotation.x = -Math.PI / 2; pond.position.set(11, GROUND_Y + 0.02, 13); world.add(pond);
  colliders.circles.push({ x: 11, z: 13, r: 5 });

  const bridge = new THREE.Group();
  const plank = new THREE.Mesh(new THREE.BoxGeometry(11, 0.35, 2.6), mat(C.trunk));
  plank.position.y = 0.9; plank.castShadow = true; bridge.add(plank);
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(11, 0.9, 0.18), mat(C.trunk));
    rail.position.set(0, 1.5, s * 1.25); rail.castShadow = true; bridge.add(rail);
  }
  for (const px of [-4.5, 4.5]) for (const pz of [-1.25, 1.25]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.9, 6), mat(C.trunk));
    post.position.set(px, 0.95, pz); bridge.add(post);
  }
  bridge.position.set(11, GROUND_Y, 13); bridge.rotation.y = Math.PI / 5;
  world.add(bridge);

  // —— 小房子 ×4（box 墙 + 四棱锥屋顶） ——
  const houseDefs = [
    { x: -12, z: -8, ry: 0.5, w: 4.2, d: 3.6 },
    { x: 9, z: -14, ry: -0.35, w: 3.6, d: 3.2 },
    { x: -9, z: 12, ry: 0.2, w: 4.6, d: 3.4 },
    { x: 20, z: 4, ry: 1.1, w: 3.4, d: 3.0 },
  ];
  for (const h of houseDefs) {
    const g = new THREE.Group();
    const wallH = 2.4;
    const walls = new THREE.Mesh(new THREE.BoxGeometry(h.w, wallH, h.d), mat(C.wall));
    walls.position.y = wallH / 2; walls.castShadow = walls.receiveShadow = true; g.add(walls);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(h.w, h.d) * 0.78, 1.8, 4), mat(C.leaf));
    roof.position.y = wallH + 0.9; roof.rotation.y = Math.PI / 4;
    roof.castShadow = true; g.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.1), mat(C.ink));
    door.position.set(0, 0.75, h.d / 2 + 0.03); g.add(door);
    g.position.set(h.x, GROUND_Y, h.z); g.rotation.y = h.ry;
    world.add(g);
    // AABB 碰撞（取旋转前的包围，略放大）
    const ext = Math.max(h.w, h.d) / 2 + 0.3;
    colliders.boxes.push({ minX: h.x - ext, maxX: h.x + ext, minZ: h.z - ext, maxZ: h.z + ext });
  }

  // —— 低多边形树 ——
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.4, 1.8, 6);
  const leafGeo = new THREE.ConeGeometry(1.9, 3.2, 7);
  const trunkMat = mat(C.trunk), leafMat = mat(C.leaf), leafMat2 = mat(C.grassDark);
  const ringDefs = [
    { id: 'about', x: -20, z: 2 }, { id: 'works', x: 2, z: -21 },
    { id: 'skills', x: 22, z: -3 }, { id: 'contact', x: -3, z: 21 },
  ];
  const treeSpots = [];
  let guard = 0;
  while (treeSpots.length < 14 && guard++ < 300) {
    const a = rand() * Math.PI * 2, d = rr(8, 31);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.hypot(x - 11, z - 13) < 8) continue;                    // 避开池塘
    if (ringDefs.some(r => Math.hypot(x - r.x, z - r.z) < 5)) continue; // 避开圆环
    if (houseDefs.some(h => Math.hypot(x - h.x, z - h.z) < 6)) continue;
    if (treeSpots.some(t => Math.hypot(x - t.x, z - t.z) < 5)) continue;
    treeSpots.push({ x, z });
  }
  treeSpots.forEach((t, i) => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.9; trunk.castShadow = true; g.add(trunk);
    const leaf = new THREE.Mesh(leafGeo, i % 2 ? leafMat : leafMat2);
    leaf.position.y = 3.1; leaf.castShadow = true; g.add(leaf);
    const s = rr(0.85, 1.3); g.scale.setScalar(s);
    g.position.set(t.x, GROUND_Y, t.z); g.rotation.y = rand() * Math.PI;
    world.add(g);
    colliders.circles.push({ x: t.x, z: t.z, r: 0.8 });
  });

  // —— 4 枚发光圆环（内容触发器；ringDefs 已在树生成前定义） ——
  const rings = ringDefs.map((d, i) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.2, 10, 36),
      new THREE.MeshStandardMaterial({
        color: C.gold, emissive: C.gold, emissiveIntensity: 0.9,
        roughness: 0.4, flatShading: true,
      }));
    m.position.set(d.x, GROUND_Y + 1.9, d.z);
    m.castShadow = true; world.add(m);
    // 底座光圈
    const halo = new THREE.Mesh(new THREE.RingGeometry(1.2, 2.2, 32),
      new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    halo.rotation.x = -Math.PI / 2; halo.position.set(d.x, GROUND_Y + 0.04, d.z);
    world.add(halo);
    return { id: d.id, x: d.x, z: d.z, r: 2.8, mesh: m, halo, phase: i * 1.7, got: false };
  });

  // 出生点：环路南侧
  const spawn = { x: 0, z: 17.5, heading: Math.PI / 2 };

  return {
    group: world, colliders, rings, spawn, groundY: GROUND_Y, bounds: 32,
    update(dt, t) {
      for (const r of rings) {
        if (r.got) continue;
        r.mesh.rotation.y = t * 0.9 + r.phase;
        const s = 1 + Math.sin(t * 2.4 + r.phase) * 0.07;
        r.mesh.scale.setScalar(s);
        r.mesh.position.y = GROUND_Y + 1.9 + Math.sin(t * 1.8 + r.phase) * 0.18;
        r.halo.material.opacity = 0.28 + Math.sin(t * 2.4 + r.phase) * 0.12;
      }
      // 水面微波
      water.position.y = -1.35 + Math.sin(t * 0.8) * 0.06;
    },
    collectRing(r) {
      r.got = true;
      r.mesh.material.emissiveIntensity = 0.12;
      r.mesh.material.opacity = 0.55; r.mesh.material.transparent = true;
      r.halo.material.opacity = 0.1;
    },
  };
}
