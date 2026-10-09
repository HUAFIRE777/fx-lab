import * as THREE from 'three';

/* ================= 0. 确定性随机 ================= */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261009);

/* ================= 1. 场景基础 ================= */
const PAPER = 0xF4F0E3, PAPER_DEEP = 0xEAE3D0;
const INK = 0x1E2B22, TERRA = 0xB4653F, BARK = 0x39432E;

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(PAPER);
scene.fog = new THREE.Fog(PAPER, 15, 30);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 60);
const CAM_BASE = new THREE.Vector3(5.8, 4.3, 8.4);
const LOOK_AT = new THREE.Vector3(0, 2.5, 0);
camera.position.copy(CAM_BASE);
camera.lookAt(LOOK_AT);

const hemi = new THREE.HemisphereLight(0xFFF8EA, 0x8A7F66, 0.95);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xFFF1DA, 1.7);
sun.position.set(4.5, 8, 3.5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -7; sun.shadow.camera.right = 7;
sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -3;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 24;
sun.shadow.bias = -0.0006;
scene.add(sun);

const world = new THREE.Group();   // 转台：整盆缓慢旋转
scene.add(world);

/* 地面：宣纸色圆盘，承接柔光阴影 */
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(40, 48),
  new THREE.MeshStandardMaterial({ color: PAPER_DEEP, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ================= 2. 盆 / 托 / 土 ================= */
const TRAY_Y = 0.14;
{
  const tray = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 2.5, TRAY_Y, 40),
    new THREE.MeshStandardMaterial({ color: 0x232B22, roughness: 0.85 })
  );
  tray.position.y = TRAY_Y / 2;
  tray.castShadow = tray.receiveShadow = true;
  world.add(tray);

  // 陶盆：车削剖面（盆体 + 外翻沿）
  const pts = [];
  pts.push(new THREE.Vector2(0.02, 0));
  pts.push(new THREE.Vector2(1.02, 0));
  pts.push(new THREE.Vector2(1.12, 0.08));
  pts.push(new THREE.Vector2(1.30, 0.62));
  pts.push(new THREE.Vector2(1.42, 0.86));
  pts.push(new THREE.Vector2(1.52, 0.92));   // 沿下
  pts.push(new THREE.Vector2(1.52, 1.02));   // 沿上
  pts.push(new THREE.Vector2(1.34, 1.02));
  pts.push(new THREE.Vector2(1.24, 0.82));
  pts.push(new THREE.Vector2(1.24, 0.30));
  pts.push(new THREE.Vector2(0.02, 0.30));
  const pot = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 48),
    new THREE.MeshStandardMaterial({ color: TERRA, roughness: 0.9 })
  );
  pot.position.y = TRAY_Y;
  pot.castShadow = pot.receiveShadow = true;
  world.add(pot);

  // 土面
  const soil = new THREE.Mesh(
    new THREE.CircleGeometry(1.30, 40),
    new THREE.MeshStandardMaterial({ color: 0x33382A, roughness: 1 })
  );
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = TRAY_Y + 0.86;
  soil.receiveShadow = true;
  world.add(soil);
}
const SOIL_Y = TRAY_Y + 0.86;
const TREE_BASE = new THREE.Vector3(0, SOIL_Y, 0);

/* 冬雪：土面积雪 + 盆沿积雪（透明度随季节淡入） */
const snowMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0 });
{
  const cap = new THREE.Mesh(new THREE.CircleGeometry(1.28, 40), snowMat);
  cap.rotation.x = -Math.PI / 2;
  cap.position.y = SOIL_Y + 0.015;
  world.add(cap);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.47, 0.055, 10, 48), snowMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = TRAY_Y + 1.02;
  world.add(rim);
}

/* ================= 3. 递归盆景生成 ================= */
const MAXD = 4;
const segs = [];   // {p0,p1,dir,len,r,t0,t1,mid,quat}
const leaves = []; // {pos,quat,size,tb,jitter,phase}

const _v = new THREE.Vector3();
function branch(p, dir, len, rad, depth) {
  const steps = depth === 0 ? 4 : 2;
  let cp = p.clone(), cd = dir.clone(), cr = rad;
  for (let s = 0; s < steps; s++) {
    cd = cd.clone();
    cd.x += (rnd() - 0.5) * 0.55;
    cd.z += (rnd() - 0.5) * 0.55;
    cd.y += (rnd() - 0.5) * 0.22 + 0.14;
    if (depth === 0) { cd.x += Math.sin(cp.y * 1.15) * 0.30; cd.z += Math.cos(cp.y * 0.9) * 0.20; }  // 主干 S 形虬曲
    if (depth >= 1) cd.y += -0.10;                           // 侧枝走平，云片式树冠
    if (depth >= 3) cd.y += 0.10;                            // 梢头微翘
    cd.normalize();
    const sl = len / steps;
    const p1 = cp.clone().addScaledVector(cd, sl);
    const r1 = cr * (1 - 0.30 / steps);
    segs.push({ p0: cp.clone(), p1: p1.clone(), dir: cd.clone(), len: sl, r: (cr + r1) / 2, segIdx: segs.length });
    // 侧枝
    const sideP = depth === 0 ? 0.85 : depth === 1 ? 0.55 : 0.42;
    if (depth < MAXD && rnd() < sideP) {
      const sd = cd.clone();
      sd.x += (rnd() - 0.5) * 1.7;
      sd.z += (rnd() - 0.5) * 1.7;
      sd.y += rnd() * 0.8 - 0.05;
      sd.normalize();
      branch(p1, sd, len * 0.60, r1 * 0.62, depth + 1);
    }
    cp = p1; cr = r1;
  }
  if (depth < MAXD) {
    const n = depth === 0 ? 2 : depth === 1 ? 2 : (rnd() < 0.6 ? 2 : 3);
    for (let i = 0; i < n; i++) {
      const nd = cd.clone();
      nd.x += (rnd() - 0.5) * 1.4;
      nd.z += (rnd() - 0.5) * 1.4;
      nd.y += rnd() * 0.6;
      nd.normalize();
      branch(cp, nd, len * 0.58, cr * 0.6, depth + 1);
    }
  } else {
    // 叶簇：记在最后一段枝上，出生时间取该段结束
    const nL = 4 + Math.floor(rnd() * 4);
    for (let i = 0; i < nL; i++) {
      const off = new THREE.Vector3((rnd() - 0.5), (rnd() - 0.5) * 0.6, (rnd() - 0.5))
        .multiplyScalar(0.38);
      leaves.push({
        pos: cp.clone().add(off),
        quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI)),
        size: 0.13 + rnd() * 0.09,
        seg: segs.length - 1,
        jitter: 0.90 + rnd() * 0.20,
        phase: rnd() * Math.PI * 2,
      });
    }
  }
  // depth 3 的枝端也挂少量叶（树冠更密）
  if (depth === MAXD - 1 && rnd() < 0.7) {
    const nL = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < nL; i++) {
      const off = new THREE.Vector3((rnd() - 0.5), (rnd() - 0.5) * 0.6, (rnd() - 0.5)).multiplyScalar(0.34);
      leaves.push({
        pos: cp.clone().add(off),
        quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI)),
        size: 0.12 + rnd() * 0.08,
        seg: segs.length - 1,
        jitter: 0.90 + rnd() * 0.20,
        phase: rnd() * Math.PI * 2,
      });
    }
  }
}
branch(TREE_BASE, new THREE.Vector3(0.06, 1, 0.03).normalize(), 2.05, 0.17, 0);

/* 生长时间窗：先序 = 父先子后，保证生长顺序物理正确 */
{
  const N = segs.length;
  segs.forEach((s, i) => {
    s.t0 = 0.05 + 0.80 * (i / N);
    s.t1 = Math.min(s.t0 + 0.10, 0.985);
    s.mid = s.p0.clone().addScaledVector(s.dir, s.len / 2);
    s.quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), s.dir);
  });
  leaves.forEach(l => { l.tb = segs[l.seg].t1 + 0.015; });
}

/* ================= 4. 实例化渲染 ================= */
const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(),
      _s = new THREE.Vector3(), _zero = new THREE.Matrix4().makeScale(0, 0, 0);

/* 枝干 */
const branchMesh = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(0.78, 1, 1, 7, 1),
  new THREE.MeshStandardMaterial({ color: BARK, roughness: 1 }),
  segs.length
);
branchMesh.castShadow = true;
world.add(branchMesh);

/* 叶片：对折叶形 */
function makeLeafGeo() {
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.5);
  sh.bezierCurveTo(0.34, -0.28, 0.34, 0.28, 0, 0.5);
  sh.bezierCurveTo(-0.34, 0.28, -0.34, -0.28, 0, -0.5);
  const g = new THREE.ShapeGeometry(sh, 5);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, 0.20 * (1 - Math.abs(x) / 0.36) + 0.05 * Math.sin((y + 0.5) * Math.PI));
  }
  g.computeVertexNormals();
  return g;
}
const leafMesh = new THREE.InstancedMesh(
  makeLeafGeo(),
  new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide }),
  leaves.length
);
leafMesh.castShadow = true;
world.add(leafMesh);
const leafCol = leaves.map(() => new THREE.Color(0x8FAE62));
leaves.forEach((l, i) => leafMesh.setColorAt(i, leafCol[i]));
leafMesh.instanceColor.needsUpdate = true;

/* ================= 5. 四季 ================= */
const SEASONS = [
  { name: '春', leaf: new THREE.Color(0x8FAE62), pcol: new THREE.Color(0xC2703D), pCount: 150, pSpeed: 0.55, pSize: 0.105, sway: 0.9,  snow: 0 }, // 陶土花瓣
  { name: '夏', leaf: new THREE.Color(0x2E5D3B), pcol: new THREE.Color(0x3F7048), pCount: 70,  pSpeed: 0.32, pSize: 0.06,  sway: 0.5,  snow: 0 }, // 浓绿微尘
  { name: '秋', leaf: new THREE.Color(0xC2703D), pcol: new THREE.Color(0xB4653F), pCount: 170, pSpeed: 0.95, pSize: 0.095, sway: 1.25, snow: 0 }, // 赭叶飘落
  { name: '冬', leaf: new THREE.Color(0x8FAE62), pcol: new THREE.Color(0xFFFFFF), pCount: 210, pSpeed: 0.70, pSize: 0.075, sway: 1.6,  snow: 1 }, // 白雪
];
let seasonIdx = 0;
const leafTarget = SEASONS[0].leaf.clone();
let foliageTarget = 1, foliageCur = 1;
let snowTarget = 0;

/* 飘落粒子 */
const PMAX = 220;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(PMAX * 3);
const pSeed = [];
for (let i = 0; i < PMAX; i++) {
  pSeed.push({ sp: 0.7 + rnd() * 0.6, ph: rnd() * Math.PI * 2, r: 1.2 + rnd() * 2.6, a: rnd() * Math.PI * 2 });
  pPos[i * 3] = Math.cos(pSeed[i].a) * pSeed[i].r;
  pPos[i * 3 + 1] = 0.8 + rnd() * 5;
  pPos[i * 3 + 2] = Math.sin(pSeed[i].a) * pSeed[i].r;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
function makePetalSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const grd = x.createRadialGradient(32, 32, 2, 32, 32, 30);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.55, 'rgba(255,255,255,0.85)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = grd;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const pMat = new THREE.PointsMaterial({
  color: SEASONS[0].pcol.clone(), size: SEASONS[0].pSize, map: makePetalSprite(),
  transparent: true, opacity: 0.92, depthWrite: false, sizeAttenuation: true,
});
const points = new THREE.Points(pGeo, pMat);
points.frustumCulled = false;
world.add(points);
function respawnParticle(i, top) {
  const s = pSeed[i];
  const w = SEASONS[seasonIdx].snow ? 4.2 : 2.8;
  s.r = 0.8 + rnd() * w; s.a = rnd() * Math.PI * 2;
  pPos[i * 3] = Math.cos(s.a) * s.r;
  pPos[i * 3 + 1] = top ? (5.2 + rnd() * 2.2) : (0.8 + rnd() * 5);
  pPos[i * 3 + 2] = Math.sin(s.a) * s.r;
}

/* ================= 6. 状态与 UI ================= */
let g = 0;                 // 生长进度 0..1
let playing = true;
const GROW_SECS = 26;

const scrub = document.getElementById('scrub');
const playBtn = document.getElementById('playBtn');
const seasonName = document.getElementById('seasonName');
const growPct = document.getElementById('growPct');
const hint = document.getElementById('hint');
const seasonBtns = [...document.querySelectorAll('.seasons button')];

function setPlaying(v) {
  playing = v;
  playBtn.innerHTML = v ? '<b>❚❚</b> 暂停生长' : '<b>▶</b> 继续生长';
}
function syncScrub() {
  scrub.value = Math.round(g * 1000);
  scrub.style.setProperty('--fill', (g * 100).toFixed(1) + '%');
  growPct.textContent = Math.round(g * 100) + '%';
}
playBtn.addEventListener('click', () => {
  if (!playing && g >= 1) { g = 0; }   // 长满后点播放 = 重新生长
  setPlaying(!playing);
  hideHint();
});
scrub.addEventListener('input', () => {
  g = scrub.value / 1000;
  setPlaying(false);
  growthDirty = true;
  hideHint();
});
function setSeason(i) {
  seasonIdx = i;
  const S = SEASONS[i];
  leafTarget.copy(S.leaf);
  foliageTarget = S.snow ? 0 : 1;
  snowTarget = S.snow ? 0.92 : 0;
  pMat.color.copy(S.pcol);
  pMat.size = S.pSize;
  pGeo.setDrawRange(0, S.pCount);
  seasonName.textContent = S.name;
  seasonBtns.forEach((b, j) => b.classList.toggle('on', j === i));
  hideHint();
}
seasonBtns.forEach((b, i) => b.addEventListener('click', () => setSeason(i)));
let hintHidden = false;
function hideHint() {
  if (hintHidden) return; hintHidden = true;
  hint.classList.add('gone');
}
setTimeout(hideHint, 12000);
setSeason(0);
/* 深链：?g=0.85&season=2 可直达某生长阶段/季节（截图与分享用） */
try {
  const qp = new URLSearchParams(location.search);
  const g0 = parseFloat(qp.get('g'));
  if (!isNaN(g0)) g = Math.min(1, Math.max(0, g0));
  const s0 = parseInt(qp.get('season'), 10);
  if (!isNaN(s0) && s0 >= 0 && s0 <= 3) setSeason(s0);
  if (g >= 1) setPlaying(false);
} catch (e) { /* file 协议下忽略 */ }
syncScrub();

/* 鼠标视差 */
let mx = 0, my = 0, px = 0, py = 0;
window.addEventListener('pointermove', e => {
  mx = (e.clientX / window.innerWidth - 0.5) * 2;
  my = (e.clientY / window.innerHeight - 0.5) * 2;
});

/* ================= 7. 生长矩阵更新 ================= */
let growthDirty = true;
const _swayQ = new THREE.Quaternion(), _e = new THREE.Euler();
function updateGrowth() {
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const f = Math.min(1, Math.max(0, (g - s.t0) / (s.t1 - s.t0)));
    if (f <= 0) { branchMesh.setMatrixAt(i, _zero); continue; }
    const rr = s.r * (0.35 + 0.65 * f);
    _p.copy(s.p0).addScaledVector(s.dir, s.len * f / 2);
    _s.set(rr, s.len * f, rr);
    _m.compose(_p, s.quat, _s);
    branchMesh.setMatrixAt(i, _m);
  }
  branchMesh.instanceMatrix.needsUpdate = true;

  for (let i = 0; i < leaves.length; i++) {
    const l = leaves[i];
    let f = Math.min(1, Math.max(0, (g - l.tb) / 0.06));
    f = f * f * (3 - 2 * f);                       // smoothstep 展叶
    const sc = l.size * f * foliageCur;
    if (sc <= 0.0001) { leafMesh.setMatrixAt(i, _zero); continue; }
    _e.set(Math.sin(elapsed * 1.4 + l.phase) * 0.07 * f,
           Math.cos(elapsed * 1.1 + l.phase) * 0.07 * f, 0);
    _swayQ.setFromEuler(_e);
    _q.copy(l.quat).multiply(_swayQ);
    _s.set(sc, sc, sc);
    _m.compose(l.pos, _q, _s);
    leafMesh.setMatrixAt(i, _m);
  }
  leafMesh.instanceMatrix.needsUpdate = true;
  growthDirty = false;
}

/* ================= 8. 主循环 ================= */
const clock = new THREE.Clock();
let elapsed = 0;
const _tc = new THREE.Color();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  // 生长推进
  if (playing && g < 1) {
    g = Math.min(1, g + dt / GROW_SECS);
    growthDirty = true;
    if (g >= 1) setPlaying(false);
    syncScrub();
  }

  // 季节过渡：叶色 / 叶量 / 积雪
  let colorMoving = false;
  for (let i = 0; i < leaves.length; i++) {
    _tc.copy(leafTarget).multiplyScalar(leaves[i].jitter);
    const c = leafCol[i];
    if (c.getHex() !== _tc.getHex()) {
      c.lerp(_tc, Math.min(1, dt * 1.8));
      if (c.getHex() !== _tc.getHex()) colorMoving = true;
      leafMesh.setColorAt(i, c);
    }
  }
  if (colorMoving) leafMesh.instanceColor.needsUpdate = true;
  const fs0 = foliageCur;
  foliageCur += (foliageTarget - foliageCur) * Math.min(1, dt * 2.2);
  if (Math.abs(foliageCur - fs0) > 0.0005) growthDirty = true;
  const sn0 = snowMat.opacity;
  snowMat.opacity += (snowTarget - snowMat.opacity) * Math.min(1, dt * 1.6);
  if (Math.abs(snowMat.opacity - sn0) > 0.002) { /* 透明度逐帧生效 */ }

  if (growthDirty) updateGrowth();

  // 粒子飘落
  const S = SEASONS[seasonIdx];
  const pos = pGeo.attributes.position.array;
  for (let i = 0; i < S.pCount; i++) {
    const sd = pSeed[i];
    pos[i * 3 + 1] -= S.pSpeed * sd.sp * dt;
    pos[i * 3] += Math.sin(elapsed * 1.6 + sd.ph) * S.sway * dt;
    pos[i * 3 + 2] += Math.cos(elapsed * 1.3 + sd.ph) * S.sway * 0.7 * dt;
    if (pos[i * 3 + 1] < 0.6) respawnParticle(i, true);
  }
  pGeo.attributes.position.needsUpdate = true;

  // 转台 + 视差
  world.rotation.y = elapsed * 0.05;
  px += (mx - px) * Math.min(1, dt * 2.5);
  py += (my - py) * Math.min(1, dt * 2.5);
  camera.position.set(CAM_BASE.x + px * 0.7, CAM_BASE.y - py * 0.4, CAM_BASE.z);
  camera.lookAt(LOOK_AT);

  renderer.render(scene, camera);
}

/* ================= 9. 收尾 ================= */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateGrowth();
animate();

/* loader 完成态：首帧已渲染 + 最短停留，兜底 4.5s */
let loaderDone = false;
function finishLoading() {
  if (loaderDone) return; loaderDone = true;
  document.getElementById('loader').classList.add('done');
  const items = document.querySelectorAll('[data-intro]');
  items.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 120 + i * 130));
}
setTimeout(finishLoading, 900);
setTimeout(finishLoading, 4500);   // 兜底：隐藏等 JS 的元素必达完成态
