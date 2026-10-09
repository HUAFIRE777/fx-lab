/* data-galaxy-3d · src/main.js
 * 3D 数据星系：四个业务星团（销售/运营/客服/供应链），节点呼吸脉冲，
 * hover/tap 数据卡，chips 筛选星团，拖拽旋转 + 滚轮缩放。
 * 原创实现。参考对象仅为"星系式网络数据可视化"这一表现手法，不含任何第三方源码。
 */
import * as THREE from 'three';

document.documentElement.classList.add('js');

const $ = (s) => document.querySelector(s);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;

/* ---------- 工具：缓动 + 确定性伪随机 ---------- */
const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
let _seed = 20261009;
const rnd = () => { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; };

/* ---------- 场景 ---------- */
const CYAN = 0x22D3EE;
const stage = $('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x04090d, 1);
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1200);
camera.position.set(0, 14, 105);

const galaxy = new THREE.Group();
scene.add(galaxy);

/* ---------- 程序化辉光纹理（无外部素材） ---------- */
function glowTexture(inner = 'rgba(34,211,238,1)', mid = 'rgba(34,211,238,0.28)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.28, mid);
  grad.addColorStop(1, 'rgba(34,211,238,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const GLOW_TEX = glowTexture();
const WHITE_GLOW = glowTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0.22)');

/* ---------- 深空：星点 + 暗星云 ---------- */
(function buildBackdrop() {
  const n = 700;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 280 + rnd() * 220;
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(2 * rnd() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xf2fafd, size: 1.6, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false });
  scene.add(new THREE.Points(geo, mat));

  for (let i = 0; i < 3; i++) {
    const m = new THREE.SpriteMaterial({ map: GLOW_TEX, transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending });
    const s = new THREE.Sprite(m);
    s.scale.setScalar(220 + i * 60);
    s.position.set((rnd() - 0.5) * 260, (rnd() - 0.5) * 160, -180 - rnd() * 120);
    scene.add(s);
  }
})();

/* ---------- 业务星团定义（虚构业务 + 虚构指标） ---------- */
const GROUPS = [
  { name: '销售', hubs: '销售枢纽', subs: ['线上商城', '分销渠道', '大客户部', '直播带货', '区域代理', '出海业务', '团购政企', '会员复购', '新品首发', '闪购活动', '社交电商', '经销商'] },
  { name: '运营', hubs: '运营枢纽', subs: ['内容策划', '用户增长', '活动运营', '商品陈列', '数据看板', '客服工单池', '社群维护', '会员体系', '搜索优化', '广告投放', '风控审核', 'AB测试'] },
  { name: '客服', hubs: '客服枢纽', subs: ['在线接待', '电话客服', '售后工单', '退换货', '智能应答', '投诉处理', '满意度回访', '多语言席位', '夜间值班', '知识库', '质检抽查', '舆情监控'] },
  { name: '供应链', hubs: '供应链枢纽', subs: ['华东仓配', '华南仓配', '华北仓配', '跨境物流', '采购寻源', '库存计划', '干线运输', '最后一公里', '冷链专线', '逆向物流', '供应商协同', '质检入库'] },
];

const nodes = [];        // { mesh, glow, group, baseScale, phase, speed, dim, data }
const lineMats = [];     // per-group { mat, inter:bool, group }
const clusters = [];     // { group, revealAt, factor, nodeMats:[], glowMats:[], lineMats:[] }

const satGeo = new THREE.IcosahedronGeometry(0.62, 1);
const hubGeo = new THREE.OctahedronGeometry(1.7);
const coreGeo = new THREE.IcosahedronGeometry(0.5, 1);

function makeNode(groupIdx, isHub, name, tput, yoy, anom) {
  const geo = isHub ? hubGeo : satGeo;
  const mat = new THREE.MeshBasicMaterial({ color: isHub ? 0xf2fafd : CYAN, transparent: true, opacity: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  const glowMat = new THREE.SpriteMaterial({
    map: isHub ? WHITE_GLOW : GLOW_TEX, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(isHub ? 12 : 5.2);
  mesh.add(glow);
  const n = {
    mesh, glow, group: groupIdx, isHub,
    baseScale: 1, phase: rnd() * Math.PI * 2, speed: 1.2 + rnd() * 1.6,
    dimTarget: 1, dimCur: 1,
    data: { group: GROUPS[groupIdx].name, name, tput, yoy, anom },
    mats: [mat, glowMat],
  };
  mesh.userData.node = n;
  nodes.push(n);
  return n;
}

function fakeMetrics(i, groupIdx) {
  const t = (20 + rnd() * 320).toFixed(1) + '万条';
  const y = rnd();
  const yoy = (y > 0.32 ? '+' : '−') + (y * 38).toFixed(1) + '%';
  const anom = rnd() < 0.72 ? '0 起' : (1 + Math.floor(rnd() * 4)) + ' 起';
  return [t, yoy, anom];
}

let linkCount = 0;
(function buildGalaxy() {
  const ringR = 44;
  GROUPS.forEach((g, gi) => {
    const cg = new THREE.Group();
    const ang = (gi / GROUPS.length) * Math.PI * 2 + Math.PI / 4;
    cg.position.set(Math.cos(ang) * ringR, (rnd() - 0.5) * 22, Math.sin(ang) * ringR);
    cg.rotation.y = rnd() * Math.PI * 2;
    galaxy.add(cg);

    const cluster = { group: cg, revealAt: 0.25 + gi * 0.42, factor: 0, nodeMats: [], glowMats: [], lineMats: [] };
    clusters.push(cluster);

    // 枢纽
    const hm = fakeMetrics(0, gi);
    const hub = makeNode(gi, true, g.hubs, hm[0], hm[1], hm[2]);
    hub.mesh.position.set(0, 0, 0);
    cg.add(hub.mesh);
    cluster.nodeMats.push(hub.mats[0]);
    cluster.glowMats.push(hub.mats[1]);

    // 白色内核：枢纽呼吸时透出白光（第三色点缀）
    const core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
    hub.mesh.add(core);
    hub.core = core; hub.coreMat = core.material;
    cluster.nodeMats.push(core.material);

    // 卫星节点：球面随机分布
    const sats = [];
    g.subs.forEach((nm, i) => {
      const fm = fakeMetrics(i, gi);
      const s = makeNode(gi, false, nm, fm[0], fm[1], fm[2]);
      const r = 13 + rnd() * 7;
      const th = (i / g.subs.length) * Math.PI * 2 + rnd() * 0.5;
      const ph = Math.acos(2 * rnd() - 1);
      s.mesh.position.set(
        r * Math.sin(ph) * Math.cos(th),
        r * Math.cos(ph) * 0.72,
        r * Math.sin(ph) * Math.sin(th)
      );
      cg.add(s.mesh);
      sats.push(s);
      cluster.nodeMats.push(s.mats[0]);
      cluster.glowMats.push(s.mats[1]);
    });

    // 链路：枢纽→每颗卫星 + 卫星环形链
    const pts = [];
    sats.forEach((s) => {
      pts.push(0, 0, 0, s.mesh.position.x, s.mesh.position.y, s.mesh.position.z);
      linkCount++;
    });
    for (let i = 0; i < sats.length; i += 2) {
      const a = sats[i].mesh.position, b = sats[(i + 1) % sats.length].mesh.position;
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      linkCount++;
    }
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    const lmat = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0 });
    cg.add(new THREE.LineSegments(lgeo, lmat));
    cluster.lineMats.push(lmat);
    lineMats.push({ mat: lmat, group: gi });
  });

  // 星团间：枢纽环路（更暗）
  const hubPts = [];
  const hubs = nodes.filter((n) => n.isHub).map((n) => {
    const v = new THREE.Vector3();
    n.mesh.getWorldPosition(v);
    return v;
  });
  for (let i = 0; i < hubs.length; i++) {
    const a = hubs[i], b = hubs[(i + 1) % hubs.length];
    hubPts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    linkCount++;
  }
  const hgeo = new THREE.BufferGeometry();
  hgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(hubPts), 3));
  const interMat = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0 });
  galaxy.add(new THREE.LineSegments(hgeo, interMat));
  clusters.forEach((c) => c.lineMats.push(interMat));
  lineMats.push({ mat: interMat, group: -1 });
})();

/* ---------- 加载态：星团逐个点亮 ---------- */
let readyDone = false;
function markReady() {
  if (readyDone) return;
  readyDone = true;
  document.documentElement.classList.add('done');
}
setTimeout(markReady, 4200); // 兜底：完成态必达

/* ---------- chips 筛选：高亮选中星团、其余变暗 ---------- */
let activeGroup = 'all';
$('#chips').addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  document.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
  btn.classList.add('on');
  activeGroup = btn.dataset.g;
  nodes.forEach((n) => {
    n.dimTarget = (activeGroup === 'all' || String(n.group) === activeGroup) ? 1 : 0.1;
  });
});

/* ---------- hover / tap 数据卡 ---------- */
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2(-10, -10);
const card = $('#card');
let hovered = null;
let lastPointer = { x: 0, y: 0 };

function setCard(n, x, y) {
  $('#card-g').textContent = n.data.group + ' · 实时';
  $('#card-n').textContent = n.data.name;
  $('#card-t').textContent = n.data.tput;
  const yv = $('#card-y');
  yv.textContent = n.data.yoy;
  yv.className = 'v ' + (n.data.yoy[0] === '+' ? 'up' : n.data.yoy[0] === '−' ? 'down' : '');
  $('#card-a').textContent = n.data.anom;
  card.hidden = false;
  const pad = 16;
  const w = card.offsetWidth, h = card.offsetHeight;
  card.style.left = Math.min(Math.max(x + 18, pad), window.innerWidth - w - pad) + 'px';
  card.style.top = Math.min(Math.max(y + 16, pad), window.innerHeight - h - pad) + 'px';
  requestAnimationFrame(() => card.classList.add('show'));
}
function hideCard() {
  card.classList.remove('show');
  hovered = null;
}
// 无头验证钩子：暴露拾取函数供自动化测试，不影响页面行为
window.__galaxyTest = { pickAt };

function pickAt(cx, cy) {
  ptr.x = (cx / window.innerWidth) * 2 - 1;
  ptr.y = -(cy / window.innerHeight) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  const meshes = nodes.map((n) => n.mesh);
  const hits = ray.intersectObjects(meshes, false);
  return hits.length ? hits[0].object.userData.node : null;
}

renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  lastPointer = { x: e.clientX, y: e.clientY };
  const n = pickAt(e.clientX, e.clientY);
  if (n) {
    hovered = n;
    setCard(n, e.clientX, e.clientY);
    renderer.domElement.style.cursor = 'pointer';
  } else {
    hideCard();
    renderer.domElement.style.cursor = '';
  }
});
renderer.domElement.addEventListener('pointerleave', hideCard);
// 触屏：点按节点代替 hover
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') return;
  const n = pickAt(e.clientX, e.clientY);
  if (n) { hovered = n; setCard(n, e.clientX, e.clientY); }
  else hideCard();
});

/* ---------- 拖拽旋转 + 滚轮缩放 ---------- */
let dragging = false, px = 0, py = 0;
const vel = { x: 0, y: 0 };
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch') return;
  dragging = true; px = e.clientX; py = e.clientY;
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging || e.pointerType === 'touch') return;
  const dx = e.clientX - px, dy = e.clientY - py;
  px = e.clientX; py = e.clientY;
  vel.x = dx * 0.0032; vel.y = dy * 0.0022;
  galaxy.rotation.y += vel.x;
  galaxy.rotation.x = THREE.MathUtils.clamp(galaxy.rotation.x + vel.y, -0.55, 0.55);
});
// 触屏拖拽旋转（单指）
let tpx = 0, tpy = 0, tDrag = false;
renderer.domElement.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  tDrag = true; tpx = t.clientX; tpy = t.clientY;
}, { passive: true });
renderer.domElement.addEventListener('touchmove', (e) => {
  if (!tDrag) return;
  const t = e.touches[0];
  galaxy.rotation.y += (t.clientX - tpx) * 0.005;
  galaxy.rotation.x = THREE.MathUtils.clamp(galaxy.rotation.x + (t.clientY - tpy) * 0.003, -0.55, 0.55);
  tpx = t.clientX; tpy = t.clientY;
}, { passive: true });
renderer.domElement.addEventListener('touchend', () => { tDrag = false; }, { passive: true });

let camZ = 105;
window.addEventListener('wheel', (e) => {
  e.preventDefault();
  camZ = THREE.MathUtils.clamp(camZ + e.deltaY * 0.045, 58, 175);
}, { passive: false });

// 双指捏合缩放（移动端）
let pinchD = 0;
renderer.domElement.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    const a = e.touches[0], b = e.touches[1];
    pinchD = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }
}, { passive: true });
renderer.domElement.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2 && pinchD > 0) {
    const a = e.touches[0], b = e.touches[1];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    camZ = THREE.MathUtils.clamp(camZ - (d - pinchD) * 0.25, 58, 175);
    pinchD = d;
  }
}, { passive: true });

/* ---------- 右下统计数字滚动 ---------- */
function countUp(el, target, dur) {
  const t0 = performance.now();
  (function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(easeOutExpo(p) * target);
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

/* ---------- 主循环 ---------- */
const clock = new THREE.Clock();
let counted = false;
const startT = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 自动缓慢旋转（拖拽惯性 + 自动巡航）
  if (!reduced) {
    galaxy.rotation.y += dt * 0.055;
    if (!dragging && !tDrag) {
      galaxy.rotation.y += vel.x; vel.x *= 0.94;
      galaxy.rotation.x = THREE.MathUtils.clamp(galaxy.rotation.x + vel.y * 0.5, -0.55, 0.55);
      vel.y *= 0.94;
    }
  }

  // 星团逐个点亮
  const el = (performance.now() - startT) / 1000;
  let allLit = true;
  clusters.forEach((c) => {
    const p = THREE.MathUtils.clamp((el - c.revealAt) / 1.1, 0, 1);
    c.factor = easeOutExpo(p);
    if (p < 1) allLit = false;
    const rise = (1 - c.factor) * 6;
    c.group.position.y = c.group.userData.baseY !== undefined ? c.group.userData.baseY - rise : -rise;
    if (c.group.userData.baseY === undefined) c.group.userData.baseY = c.group.position.y + rise;
  });
  if (allLit) {
    markReady();
    if (!counted) {
      counted = true;
      countUp($('#st-nodes'), nodes.length, 1400);
      countUp($('#st-links'), linkCount, 1400);
    }
  }

  // 节点呼吸脉冲 + 筛选明暗过渡
  const hl = hovered;
  nodes.forEach((n) => {
    n.dimCur += (n.dimTarget - n.dimCur) * Math.min(dt * 5, 1);
    const cl = clusters[n.group];
    const vis = cl.factor * (0.12 + 0.88 * n.dimCur);
    const pulse = 1 + (reduced ? 0 : 0.22 * Math.sin(t * n.speed + n.phase));
    const target = n.baseScale * pulse * (hl === n ? 1.65 : 1);
    n.mesh.scale.setScalar(n.mesh.scale.x + (target - n.mesh.scale.x) * Math.min(dt * 8, 1));
    n.mats[0].opacity = vis;
    n.glow.material.opacity = vis * (n.isHub ? 0.85 : 0.55) * (hl === n ? 1.6 : 1) * (0.72 + 0.28 * Math.sin(t * n.speed + n.phase));
    if (n.coreMat) {
      n.coreMat.opacity = vis * 0.9 * (0.6 + 0.4 * Math.sin(t * 2.1 + n.phase));
      n.mesh.rotation.y += dt * (reduced ? 0 : 0.6);
    }
  });
  // 筛选时：选中星团的链路保持亮度，其余压暗；跨团环路只在"全部"时显示
  const interMat = lineMats[lineMats.length - 1].mat;
  clusters.forEach((c, ci) => {
    const keep = activeGroup === 'all' || String(ci) === activeGroup;
    c.lineMats.forEach((lm) => {
      if (lm === interMat) return;
      lm.opacity = c.factor * (keep ? 0.32 : 0.05);
    });
  });
  interMat.opacity = clusters[0].factor * (activeGroup === 'all' ? 0.12 : 0.02);

  // hover 高亮时稍微压暗同团其他节点（焦点感）
  // （已通过 hovered scale + glow 强化，不再全局压暗，保持性能与简洁）

  // 卡片跟随节点（悬停时节点在旋转）
  if (hovered && !coarse) {
    const v = new THREE.Vector3();
    hovered.mesh.getWorldPosition(v);
    v.project(camera);
    const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
    if (Math.hypot(sx - lastPointer.x, sy - lastPointer.y) > 46) {
      setCard(hovered, sx, sy);
    }
  }

  camera.position.z += (camZ - camera.position.z) * Math.min(dt * 6, 1);
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
