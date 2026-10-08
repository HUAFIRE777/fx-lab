/* diorama.js — 纸雕世界三幕：村庄 → 森林 → 湖泊。
 * 一条 CatmullRom 小径穿过三幕；天空是渐变纸 + 剪纸云，湖面是波浪纸条。 */
import * as THREE from 'three';
import {
  paperMat, paperTex, skyTex, grassTex, pathTex, lakeTex, wallTex, roofTex,
  canopyTex, cloudTex, petalTex, wobbleGeo, mulberry,
  PAPER, SAGE, SAGE_DARK, SAGE_LIGHT, TERRA, TERRA_DARK, TERRA_LIGHT, PAPER_DEEP,
} from './paper.js';

export const CHAPTERS = [
  { id: 'village', x: -24, kicker: '第一章 · 村庄', line: '阿纸背起小包，村口的炊烟正袅袅升起。' },
  { id: 'forest', x: 2, kicker: '第二章 · 森林', line: '松果滚到小径上，森林把阳光剪成了碎片。' },
  { id: 'lake', x: 24, kicker: '第三章 · 湖泊', line: '纸船已经下水，湖面替他收好了倒影。' },
];

export function buildDiorama(scene) {
  const rnd = mulberry(20261008);
  const dyn = { clouds: [], smokes: [], ripples: [], boats: [], flowers: [], petals: [] };

  // —— 路径：阿纸的小径 ——
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-34, 0, 2), new THREE.Vector3(-28, 0, -2),
    new THREE.Vector3(-22, 0, 2.5), new THREE.Vector3(-14, 0, -2.5),
    new THREE.Vector3(-6, 0, 2), new THREE.Vector3(2, 0, -2.5),
    new THREE.Vector3(10, 0, 2.5), new THREE.Vector3(18, 0, -2),
    new THREE.Vector3(26, 0, 2), new THREE.Vector3(34, 0, 0),
  ], false, 'catmullrom', 0.4);
  const pathLen = curve.getLength();

  // —— 天空：渐变纸穹顶 ——
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 70),
    new THREE.MeshBasicMaterial({ map: skyTex(), fog: false })
  );
  sky.position.set(0, 26, -34);
  scene.add(sky);
  const sky2 = sky.clone(); sky2.rotation.y = Math.PI; sky2.position.z = 40; scene.add(sky2);

  // —— 远山：鼠尾草剪影 ——
  const mMat = paperMat(paperTex(256, 301, SAGE_DARK), { roughness: 1 });
  [[-52, -26, 16, 11], [-30, -28, 22, 15], [-4, -27, 15, 10], [24, -28, 24, 16], [50, -26, 17, 12]]
    .forEach(([x, z, w, h], i) => {
      const m = new THREE.Mesh(wobbleGeo(new THREE.ConeGeometry(w / 2, h, 5), 1.2, 302 + i), mMat);
      m.position.set(x, h / 2 - 0.5, z);
      scene.add(m);
    });

  // —— 太阳：陶土蜡笔圆 ——
  const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: petalTex(TERRA, 303), transparent: true, fog: false })
  );
  sun.position.set(-42, 20, -30);
  scene.add(sun);

  // —— 剪纸云：分层拼贴，慢慢漂 ——
  for (let i = 0; i < 7; i++) {
    const s = 7 + rnd() * 7;
    const cl = new THREE.Mesh(
      new THREE.PlaneGeometry(s, s * 0.62),
      new THREE.MeshBasicMaterial({ map: cloudTex(310 + i), transparent: true, fog: false, opacity: 0.95 })
    );
    cl.position.set(-60 + rnd() * 120, 10 + rnd() * 9, -12 - rnd() * 16);
    cl.userData.speed = 0.14 + rnd() * 0.22;
    scene.add(cl); dyn.clouds.push(cl);
  }

  // —— 地面：蜡笔草地 ——
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(110, 34),
    paperMat(grassTex(44))
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // —— 小径缎带：沿曲线铺纸 ——
  {
    const N = 140, half = 1.25;
    const posArr = [], uvArr = [], idxArr = [];
    const pt = new THREE.Vector3(), tan = new THREE.Vector3();
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      curve.getPointAt(t, pt); curve.getTangentAt(t, tan);
      const nx = -tan.z, nz = tan.x;
      const l = Math.hypot(nx, nz) || 1;
      posArr.push(pt.x + nx / l * half, 0.06, pt.z + nz / l * half);
      posArr.push(pt.x - nx / l * half, 0.06, pt.z - nz / l * half);
      uvArr.push(0, t * pathLen / 4, 1, t * pathLen / 4);
      if (i < N) { const a = i * 2; idxArr.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
    g.setIndex(idxArr);
    g.computeVertexNormals();
    const ribbon = new THREE.Mesh(g, paperMat(pathTex(33), { roughness: 1 }));
    ribbon.receiveShadow = true;
    scene.add(ribbon);
  }

  const solid = (color, seed) => paperMat(paperTex(128, seed, color));

  // —— 村庄 ——
  const village = new THREE.Group();
  const houseDefs = [
    [-30, 6.5, 0.3, 1.0], [-24, -6.8, -0.25, 1.25], [-18, 7.2, 0.15, 0.9],
    [-26, 5.2, 0.5, 0.75], [-14, -6.2, -0.4, 1.05],
  ];
  houseDefs.forEach(([x, z, ry, s], hi) => {
    const h = new THREE.Group();
    const bw = 3.4 * s, bh = 2.6 * s, bd = 3 * s;
    const bodyM = new THREE.Mesh(wobbleGeo(new THREE.BoxGeometry(bw, bh, bd), 0.14, 320 + hi), paperMat(wallTex(330 + hi)));
    bodyM.position.y = bh / 2;
    const roof = new THREE.Mesh(
      wobbleGeo(new THREE.ConeGeometry(Math.max(bw, bd) * 0.78, 1.7 * s, 4), 0.16, 340 + hi),
      paperMat(roofTex(350 + hi))
    );
    roof.position.y = bh + 0.85 * s; roof.rotation.y = Math.PI / 4;
    // 门窗：剪纸贴片
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * s, 1.4 * s), solid(SAGE_DARK, 360 + hi));
    door.position.set(0, 0.7 * s, bd / 2 + 0.02);
    const winMat = solid(TERRA, 370 + hi);
    const win1 = new THREE.Mesh(new THREE.PlaneGeometry(0.8 * s, 0.8 * s), winMat);
    win1.position.set(-bw / 4, 1.7 * s, bd / 2 + 0.02);
    const win2 = win1.clone(); win2.position.x = bw / 4;
    // 烟囱 + 炊烟
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 1.2 * s, 0.5 * s), solid(TERRA_DARK, 380 + hi));
    chim.position.set(bw / 4, bh + 1.1 * s, 0);
    h.add(bodyM, roof, door, win1, win2, chim);
    const smoke = [];
    for (let k = 0; k < 3; k++) {
      const sm = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.9),
        new THREE.MeshBasicMaterial({ map: cloudTex(390 + hi * 3 + k), transparent: true, opacity: 0.7, depthWrite: false })
      );
      sm.position.set(bw / 4, bh + 1.9 * s + k * 0.9, 0);
      sm.userData = { baseY: sm.position.y, off: k * 2.1, x0: bw / 4 };
      h.add(sm); smoke.push(sm); dyn.smokes.push(sm);
    }
    h.position.set(x, 0, z); h.rotation.y = ry;
    h.traverse(o => { if (o.isMesh) o.castShadow = true; });
    village.add(h);
  });
  // 水井
  {
    const well = new THREE.Group();
    const ring = new THREE.Mesh(wobbleGeo(new THREE.CylinderGeometry(1, 1.1, 0.9, 8), 0.08, 400), solid(SAGE_DARK, 401));
    ring.position.y = 0.45;
    const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.8, 0.18), solid(TERRA_DARK, 402));
    post1.position.set(-0.9, 1.2, 0);
    const post2 = post1.clone(); post2.position.x = 0.9;
    const wroof = new THREE.Mesh(wobbleGeo(new THREE.ConeGeometry(1.5, 0.9, 4), 0.08, 403), paperMat(roofTex(404)));
    wroof.position.y = 2.4; wroof.rotation.y = Math.PI / 4;
    well.add(ring, post1, post2, wroof);
    well.position.set(-21, 0, -4.5);
    well.traverse(o => { if (o.isMesh) o.castShadow = true; });
    village.add(well);
  }
  // 栅栏
  for (let i = 0; i < 9; i++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 0.16), solid(TERRA, 410 + i));
    f.position.set(-31 + i * 1.5, 0.55, 4.6 + Math.sin(i) * 0.2);
    f.castShadow = true;
    village.add(f);
  }
  scene.add(village);

  // —— 森林：蜡笔树 ——
  const forest = new THREE.Group();
  const treeAt = [
    [-8, 6], [-4, -6.5], [0, 7], [4, -7], [8, 6.4], [12, -6],
    [-11, -5.5], [6, 5.2], [-2, 5.8], [14, 5.8], [-6, -7.5], [10, -7.5],
  ];
  treeAt.forEach(([x, z], ti) => {
    const s = 0.8 + rnd() * 0.9;
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(
      wobbleGeo(new THREE.CylinderGeometry(0.28 * s, 0.4 * s, 1.6 * s, 7), 0.06, 420 + ti),
      solid(TERRA_DARK, 421 + ti)
    );
    trunk.position.y = 0.8 * s;
    const c1 = new THREE.Mesh(
      wobbleGeo(new THREE.IcosahedronGeometry(1.7 * s, 1), 0.22, 430 + ti),
      paperMat(canopyTex(440 + ti))
    );
    c1.position.y = 2.6 * s;
    const c2 = new THREE.Mesh(
      wobbleGeo(new THREE.IcosahedronGeometry(1.15 * s, 1), 0.18, 450 + ti),
      paperMat(canopyTex(460 + ti))
    );
    c2.position.set(0.7 * s, 3.6 * s, 0.3 * s);
    t.add(trunk, c1, c2);
    t.position.set(x, 0, z);
    t.traverse(o => { if (o.isMesh) o.castShadow = true; });
    forest.add(t);
  });
  // 灌木丛
  for (let i = 0; i < 10; i++) {
    const b = new THREE.Mesh(
      wobbleGeo(new THREE.IcosahedronGeometry(0.7 + rnd() * 0.6, 1), 0.16, 470 + i),
      paperMat(canopyTex(480 + i))
    );
    const x = -12 + rnd() * 26;
    b.position.set(x, 0.4, (rnd() < 0.5 ? -1 : 1) * (4.5 + rnd() * 3));
    b.scale.y = 0.7;
    b.castShadow = true;
    forest.add(b);
  }
  scene.add(forest);

  // —— 湖泊：波浪纸条 ——
  const lake = new THREE.Group();
  const LX = 24, LZ = 0;
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(10.5, 26),
    paperMat(lakeTex(55), { roughness: 0.7 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(LX, 0.04, LZ);
  water.receiveShadow = true;
  lake.add(water);
  // 湖岸纸圈
  const shore = new THREE.Mesh(
    new THREE.RingGeometry(10.5, 12.2, 30),
    solid(PAPER_DEEP, 500)
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.set(LX, 0.05, LZ);
  lake.add(shore);
  // 涟漪：扩散纸环
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.05, 24),
      new THREE.MeshBasicMaterial({ color: PAPER, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide })
    );
    r.rotation.x = -Math.PI / 2;
    r.position.set(LX + (rnd() - 0.5) * 9, 0.07, LZ + (rnd() - 0.5) * 9);
    r.userData = { off: i * 1.7 };
    lake.add(r); dyn.ripples.push(r);
  }
  // 纸船：折纸小船
  const boatAt = [[21, -3, 0.5], [27, 3.5, -0.9]];
  boatAt.forEach(([x, z, ry], bi) => {
    const boat = new THREE.Group();
    const hullM = solid(PAPER, 510 + bi);
    const bottom = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.2), hullM);
    bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.1;
    const mkSide = (w, h, px, pz, rx, rz) => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), hullM);
      s.position.set(px, 0.45, pz); s.rotation.set(rx, 0, rz);
      return s;
    };
    boat.add(bottom,
      mkSide(2.2, 0.9, 0, 1.0, -0.5, 0), mkSide(2.2, 0.9, 0, -1.0, 0.5, 0),
      mkSide(1.6, 0.9, 0.75, 0, 0, 0.5), mkSide(1.6, 0.9, -0.75, 0, 0, -0.5));
    // 小旗
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.06), solid(TERRA_DARK, 520 + bi));
    mast.position.y = 0.9;
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.35), solid(TERRA, 521 + bi));
    flag.position.set(0.3, 1.3, 0);
    boat.add(mast, flag);
    boat.position.set(x, 0.08, z);
    boat.rotation.y = ry;
    boat.userData = { off: bi * 2.4, x0: x, z0: z };
    boat.traverse(o => { if (o.isMesh) o.castShadow = true; });
    lake.add(boat); dyn.boats.push(boat);
  });
  // 芦苇：鼠尾草细杆 + 陶土穗
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const rx = LX + Math.cos(a) * (11.4 + rnd() * 0.8);
    const rz = LZ + Math.sin(a) * (11.4 + rnd() * 0.8);
    const reed = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1.6 + rnd()), solid(SAGE_DARK, 530 + i));
    stem.position.y = 0.8;
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.5, 3, 6), solid(TERRA, 540 + i));
    ear.position.y = 1.75;
    reed.add(stem, ear);
    reed.position.set(rx, 0, rz);
    reed.rotation.y = rnd() * 3;
    lake.add(reed);
  }
  scene.add(lake);

  // —— 近景纸花（鼠标视差层） ——
  const flowerField = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const f = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.4, 5), solid(SAGE_DARK, 550 + i));
    stem.position.y = 0.7;
    const bloom = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshBasicMaterial({ map: petalTex(i % 2 ? TERRA : TERRA_LIGHT, 560 + i), transparent: true, side: THREE.DoubleSide })
    );
    bloom.position.y = 1.55;
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.28), solid(SAGE, 570 + i));
    leaf.position.set(0.22, 0.8, 0); leaf.rotation.z = -0.5;
    f.add(stem, bloom, leaf);
    const x = -32 + i * 7 + (rnd() - 0.5) * 3;
    f.position.set(x, 0, 7.5 + rnd() * 3);
    f.userData = { x0: x, ph: rnd() * 6.28, bloom };
    flowerField.add(f); dyn.flowers.push(f);
  }
  scene.add(flowerField);

  // —— 飘落纸屑（森林/湖泊上空） ——
  for (let i = 0; i < 36; i++) {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.3),
      new THREE.MeshBasicMaterial({
        color: [SAGE_LIGHT, TERRA_LIGHT, PAPER][i % 3],
        transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false,
      })
    );
    const cx = -12 + rnd() * 48;
    p.position.set(cx, 1 + rnd() * 6, -6 + rnd() * 10);
    p.userData = { x0: cx, y0: p.position.y, sp: 0.2 + rnd() * 0.4, ph: rnd() * 6.28 };
    scene.add(p); dyn.petals.push(p);
  }

  // —— 每帧更新 ——
  const par = { x: 0, y: 0 }; // 视差目标（-1..1）
  function update(dt, time, scrollT) {
    for (const c of dyn.clouds) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 70) c.position.x = -70;
    }
    for (const s of dyn.smokes) {
      const cyc = ((time * 0.35 + s.userData.off) % 3) / 3;
      s.position.y = s.userData.baseY + cyc * 3.2;
      s.position.x = s.userData.x0 + Math.sin(time * 0.8 + s.userData.off) * 0.5 + cyc * 1.2;
      s.material.opacity = 0.7 * (1 - cyc);
      const sc = 0.7 + cyc * 1.1;
      s.scale.set(sc, sc, 1);
    }
    for (const r of dyn.ripples) {
      const cyc = ((time * 0.3 + r.userData.off) % 3) / 3;
      const sc = 0.6 + cyc * 3.4;
      r.scale.set(sc, sc, 1);
      r.material.opacity = 0.65 * (1 - cyc);
    }
    for (const b of dyn.boats) {
      b.position.y = 0.08 + Math.sin(time * 1.1 + b.userData.off) * 0.08;
      b.rotation.z = Math.sin(time * 0.9 + b.userData.off) * 0.06;
      b.rotation.x = Math.cos(time * 0.7 + b.userData.off) * 0.05;
    }
    // 花：轻摆 + 鼠标视差
    par.x += (par.tx - par.x) * Math.min(1, dt * 4);
    par.y += (par.ty - par.y) * Math.min(1, dt * 4);
    for (const f of dyn.flowers) {
      f.position.x = f.userData.x0 + par.x * 1.4;
      f.position.y = par.y * 0.7;
      f.userData.bloom.rotation.y = Math.sin(time * 0.9 + f.userData.ph) * 0.35 + par.x * 0.5;
      f.rotation.z = Math.sin(time * 0.7 + f.userData.ph) * 0.06;
    }
    for (const p of dyn.petals) {
      p.position.y = p.userData.y0 + Math.sin(time * p.userData.sp + p.userData.ph) * 1.2;
      p.position.x = p.userData.x0 + Math.sin(time * 0.3 + p.userData.ph) * 1.6;
      p.rotation.set(time * 0.4 + p.userData.ph, p.userData.ph, time * 0.25);
    }
    sun.rotation.z = time * 0.02;
  }

  return {
    curve, pathLen, chapters: CHAPTERS,
    setParallax(x, y) { par.tx = x; par.ty = y; },
    update,
  };
}

export function chapterOf(x) {
  return x < -12 ? 0 : x < 12 ? 1 : 2;
}
