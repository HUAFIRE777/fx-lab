/* origami-3d · 一叶小船
 * 手法：把每一步折叠预计算为"绕折痕轴的旋转"，运行时按进度插值角度。
 * 代码全部原创实现（three.js 仅作渲染器）。
 */
import * as THREE from 'three';

const root = document.documentElement;

/* ================= 渲染基础 ================= */
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
const camBase = new THREE.Vector3(0, 0.75, 5.6);
const lookAtPt = new THREE.Vector3(0, -0.12, 0.12);
camera.position.copy(camBase);
camera.lookAt(lookAtPt);

scene.add(new THREE.HemisphereLight(0xfffaf0, 0xd9cfbd, 1.35));
const sun = new THREE.DirectionalLight(0xffffff, 2.6);
sun.position.set(3.2, 5.2, 4.0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -3; sun.shadow.camera.right = 3;
sun.shadow.camera.top = 3; sun.shadow.camera.bottom = -3;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 16;
sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.02;
scene.add(sun);
const rim = new THREE.DirectionalLight(0xffe9d2, 0.35);
rim.position.set(-4, 2, -3);
scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(24, 24),
  new THREE.ShadowMaterial({ opacity: 0.16 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.75;
ground.receiveShadow = true;
scene.add(ground);

/* 小船整体（完成后的轻微浮动挂在这里） */
const boat = new THREE.Group();
scene.add(boat);

/* ================= 纸张 ================= */
const SEG = 48;              // 网格细分
const STEPS = 7;             // 折叠步数
const geo = new THREE.PlaneGeometry(2, 2, SEG, SEG);
const posAttr = geo.attributes.position;
const V = posAttr.count;
const base = new Float32Array(posAttr.array);   // 初始位置（永不改）
const tags = new Int8Array(V);                  // 0 未折 / 1 正面层 / -1 背面层
const cur = new Float32Array(base);             // 预计算时的游标
/* 每个顶点 × 每步：ax,ay,az, dx,dy,dz, ang, zoff, active */
const ops = new Float32Array(V * STEPS * 9);

const _t = [0, 0, 0];
function rotPoint(x, y, z, ax, ay, az, dx, dy, dz, ang, out) {
  const vx = x - ax, vy = y - ay, vz = z - az;
  const c = Math.cos(ang), s = Math.sin(ang);
  const dot = dx * vx + dy * vy + dz * vz;
  const cx = dy * vz - dz * vy, cy = dz * vx - dx * vz, cz = dx * vy - dy * vx;
  const k = 1 - c;
  out[0] = ax + vx * c + cx * s + dx * dot * k;
  out[1] = ay + vy * c + cy * s + dy * dot * k;
  out[2] = az + vz * c + cz * s + dz * dot * k;
}

/* 带回弹的折叠 easing：纸张折到位时有轻微物理回弹，不用 linear */
function easeInOutBack(x) {
  const c1 = 1.30158, c2 = c1 * 1.525;
  return x < 0.5
    ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
    : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}
function easeInOut(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

const SQ = Math.SQRT1_2;
const EPS = 1e-4;

/* 七步折叠定义：test 在"当前已变形空间"里判定 */
const stepDefs = [
  { // 1 · 对折：上半沿中线折下
    test: (x, y, z, t) => y > EPS,
    P: [0, 0, 0], D: [1, 0, 0], ang: Math.PI, zoff: 0.010,
    after: () => {
      for (let i = 0; i < V; i++) {
        const by = base[i * 3 + 1];
        tags[i] = by > EPS ? 1 : (by < -EPS ? -1 : 0);
      }
    }
  },
  { // 2 · 左角归心：正面层左上角沿对角线折向中线
    test: (x, y, z, t) => t === 1 && (x - y) < -EPS,
    P: [0, 0, 0.010], D: [SQ, SQ, 0], ang: Math.PI, zoff: 0.008
  },
  { // 3 · 右角归心
    test: (x, y, z, t) => t === 1 && (x + y) > EPS,
    P: [0, 0, 0.010], D: [-SQ, SQ, 0], ang: Math.PI, zoff: 0.008
  },
  { // 4 · 前襟上折：正面层下摆翻起
    test: (x, y, z, t) => t === 1 && y < -0.5 + EPS,
    P: [0, -0.5, 0.012], D: [1, 0, 0], ang: Math.PI, zoff: 0.006
  },
  { // 5 · 后襟上折：背面层下摆翻起
    test: (x, y, z, t) => t === -1 && y < -0.5 + EPS,
    P: [0, -0.5, 0], D: [1, 0, 0], ang: Math.PI, zoff: 0
  },
  { // 6 · 左舷撑开：左半侧整层刚性向观者弹出（前后层同轴，不留裙边）
    test: (x, y, z, t) => x < -EPS,
    P: [0, -0.25, 0.012], D: [0, 1, 0], ang: 1.25, zoff: 0
  },
  { // 7 · 右舷撑开
    test: (x, y, z, t) => x > EPS,
    P: [0, -0.25, 0.012], D: [0, 1, 0], ang: -1.25, zoff: 0
  }
];

/* 预计算：逐顶点跑一遍七步，记录每步的折叠操作 */
for (let s = 0; s < STEPS; s++) {
  const sd = stepDefs[s];
  for (let i = 0; i < V; i++) {
    const ix = i * 3;
    const x = cur[ix], y = cur[ix + 1], z = cur[ix + 2];
    if (!sd.test(x, y, z, tags[i])) continue;
    const o = (i * STEPS + s) * 9;
    ops[o] = sd.P[0]; ops[o + 1] = sd.P[1]; ops[o + 2] = sd.P[2];
    ops[o + 3] = sd.D[0]; ops[o + 4] = sd.D[1]; ops[o + 5] = sd.D[2];
    ops[o + 6] = sd.ang; ops[o + 7] = sd.zoff; ops[o + 8] = 1;
    rotPoint(x, y, z, sd.P[0], sd.P[1], sd.P[2], sd.D[0], sd.D[1], sd.D[2], sd.ang, _t);
    cur[ix] = _t[0]; cur[ix + 1] = _t[1]; cur[ix + 2] = _t[2] + sd.zoff;
  }
  if (sd.after) sd.after();
}

/* 纸材质：双面，正反面微差（背面略暗暖） */
const paperMat = new THREE.MeshStandardMaterial({
  color: 0xf8f3e8,
  roughness: 0.92,
  metalness: 0,
  side: THREE.DoubleSide
});
paperMat.onBeforeCompile = (sh) => {
  sh.fragmentShader = sh.fragmentShader.replace(
    '#include <color_fragment>',
    '#include <color_fragment>\n  if (!gl_FrontFacing) diffuseColor.rgb *= vec3(0.93, 0.905, 0.86);'
  );
};
const paper = new THREE.Mesh(geo, paperMat);
paper.castShadow = true;
paper.receiveShadow = false; /* 叠层纸面不再自接收阴影：根除层间 shadow acne，阴影只落在地面 */
paper.frustumCulled = false;
boat.add(paper);

/* ================= 折痕线 ================= */
function linePts(a, b, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    pts.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]);
  }
  return pts;
}
/* 每条折痕：定义于"它所属步骤完成时"的变形空间，随后续折叠一起运动 */
const creaseDefs = [
  { step: 0, tag: 0,  pts: linePts([-1, 0, 0.0008], [1, 0, 0.0008], 25) },
  { step: 1, tag: 1,  pts: linePts([0.002, 0.002, 0.0108], [-0.998, -0.998, 0.0108], 25) },
  { step: 2, tag: 1,  pts: linePts([0.002, -0.002, 0.0108], [0.998, -0.998, 0.0108], 25) },
  { step: 3, tag: 1,  pts: linePts([-1, -0.5, 0.0128], [1, -0.5, 0.0128], 25) },
  { step: 4, tag: -1, pts: linePts([-1, -0.5, 0.0008], [1, -0.5, 0.0008], 25) },
  { step: 5, tag: 1,  pts: linePts([0, -0.5, 0.0208], [0, 0.002, 0.0208], 25) },
  { step: 6, tag: 1,  pts: linePts([0, -0.5, 0.0212], [0, 0.002, 0.0212], 25) }
];
const creases = creaseDefs.map((cd) => {
  const n = cd.pts.length;
  const cbase = new Float32Array(n * 3);
  const cops = new Float32Array(n * STEPS * 9);
  const ccur = new Float32Array(n * 3);
  cd.pts.forEach((pt, i) => { cbase[i * 3] = pt[0]; cbase[i * 3 + 1] = pt[1]; cbase[i * 3 + 2] = pt[2]; });
  ccur.set(cbase);
  for (let s = cd.step + 1; s < STEPS; s++) {
    const sd = stepDefs[s];
    for (let i = 0; i < n; i++) {
      const ix = i * 3;
      const x = ccur[ix], y = ccur[ix + 1], z = ccur[ix + 2];
      if (!sd.test(x, y, z, cd.tag)) continue;
      const o = (i * STEPS + s) * 9;
      cops[o] = sd.P[0]; cops[o + 1] = sd.P[1]; cops[o + 2] = sd.P[2];
      cops[o + 3] = sd.D[0]; cops[o + 4] = sd.D[1]; cops[o + 5] = sd.D[2];
      cops[o + 6] = sd.ang; cops[o + 7] = sd.zoff; cops[o + 8] = 1;
      rotPoint(x, y, z, sd.P[0], sd.P[1], sd.P[2], sd.D[0], sd.D[1], sd.D[2], sd.ang, _t);
      ccur[ix] = _t[0]; ccur[ix + 1] = _t[1]; ccur[ix + 2] = _t[2] + sd.zoff;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cbase), 3));
  const m = new THREE.LineBasicMaterial({ color: 0xb83a22, transparent: true, opacity: 0 });
  const line = new THREE.Line(g, m);
  line.frustumCulled = false;
  line.renderOrder = 2;
  boat.add(line);
  return { def: cd, base: cbase, ops: cops, n, line, mat: m };
});

function updateCreases(p) {
  creases.forEach((c, ci) => {
    const arr = c.line.geometry.attributes.position.array;
    for (let i = 0; i < c.n; i++) {
      let x = c.base[i * 3], y = c.base[i * 3 + 1], z = c.base[i * 3 + 2];
      for (let s = c.def.step + 1; s < STEPS; s++) {
        const o = (i * STEPS + s) * 9;
        if (!c.ops[o + 8]) continue;
        let t = p - s; t = t < 0 ? 0 : (t > 1 ? 1 : t);
        if (t <= 0) continue;
        const e = easeInOutBack(t);
        rotPoint(x, y, z, c.ops[o], c.ops[o + 1], c.ops[o + 2],
          c.ops[o + 3], c.ops[o + 4], c.ops[o + 5], c.ops[o + 6] * e, _t);
        x = _t[0]; y = _t[1]; z = _t[2] + c.ops[o + 7] * e;
      }
      arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z;
    }
    c.line.geometry.attributes.position.needsUpdate = true;
    /* 折痕高亮：当步渐显，之后留作纸面记忆 */
    if (p >= ci + 1) c.mat.opacity = 0.34;
    else if (p > ci) c.mat.opacity = 0.34 + 0.61 * Math.min(1, (p - ci) * 1.6);
    else c.mat.opacity = 0;
  });
}

/* ================= 折叠求值 ================= */
let lastP = -1;
function applyFold(p) {
  const arr = posAttr.array;
  for (let i = 0; i < V; i++) {
    let x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
    for (let s = 0; s < STEPS; s++) {
      const o = (i * STEPS + s) * 9;
      if (!ops[o + 8]) continue;
      let t = p - s; t = t < 0 ? 0 : (t > 1 ? 1 : t);
      if (t <= 0) continue;
      const e = easeInOutBack(t);
      rotPoint(x, y, z, ops[o], ops[o + 1], ops[o + 2],
        ops[o + 3], ops[o + 4], ops[o + 5], ops[o + 6] * e, _t);
      x = _t[0]; y = _t[1]; z = _t[2] + ops[o + 7] * e;
    }
    arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z;
  }
  posAttr.needsUpdate = true;
  geo.computeVertexNormals();
  updateCreases(p);
  lastP = p;
}

/* ================= 文案 ================= */
const NUM = ['壹', '贰', '叁', '肆', '伍', '陆', '柒'];
const STEPS_TXT = [
  { t: '对折',     d: '一张宣纸，对折成双。万折始于第一折。' },
  { t: '左角归心', d: '左角向中线折去，船头初现端倪。' },
  { t: '右角归心', d: '右角亦然。对称，即是秩序。' },
  { t: '前襟上折', d: '下摆前襟翻起，压住双角，不令其松。' },
  { t: '后襟上折', d: '翻过身来，后襟同样折起。三角已成。' },
  { t: '左舷撑开', d: '指尖探入，撑开左舷。船有了呼吸。' },
  { t: '右舷撑开', d: '右舷亦张开。一叶小船，折成。' }
];

/* ================= 时间轴控制 ================= */
const $ = (id) => document.getElementById(id);
const btnPlay = $('btnPlay'), btnPrev = $('btnPrev'), btnNext = $('btnNext');
const scrub = $('scrub'), btnRefold = $('btnRefold'), pbar = $('pbar');
const stepNo = $('stepNo'), stepTitle = $('stepTitle'), stepDesc = $('stepDesc'), stepCount = $('stepCount');
const dotsBox = $('dots');

const dots = STEPS_TXT.map((s, i) => {
  const b = document.createElement('button');
  b.setAttribute('role', 'tab');
  b.title = s.t;
  b.setAttribute('aria-label', '第' + NUM[i] + '步 ' + s.t);
  b.addEventListener('click', () => goTo(i + 1));
  dotsBox.appendChild(b);
  return b;
});

let p = 0;                 // 折叠进度 0..7
let auto = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let tween = null;          // {from,to,t,dur,done}
let dwell = 0;
let scrubbing = false;

function goTo(target, dur) {
  target = Math.max(0, Math.min(STEPS, target));
  auto = false;
  syncPlayBtn();
  tween = { from: p, to: target, t: 0, dur: dur || 1.2, done: null };
}
function syncPlayBtn() {
  btnPlay.classList.toggle('playing', auto);
  btnPlay.setAttribute('aria-label', auto ? '暂停' : '播放');
}
btnPlay.addEventListener('click', () => {
  if (p >= STEPS - 1e-3) { p = 0; auto = true; tween = null; dwell = 0.4; }
  else { auto = !auto; tween = null; dwell = auto ? 0.3 : 0; }
  syncPlayBtn();
});
btnPrev.addEventListener('click', () => goTo(Math.max(0, Math.ceil(p - 1e-3) - 1)));
btnNext.addEventListener('click', () => goTo(Math.min(STEPS, Math.floor(p + 1e-3) + 1)));
btnRefold.addEventListener('click', () => {
  tween = { from: p, to: 0, t: 0, dur: 2.0, done: () => { auto = true; dwell = 0.5; syncPlayBtn(); } };
  btnRefold.hidden = true;
});
scrub.addEventListener('pointerdown', () => { scrubbing = true; });
window.addEventListener('pointerup', () => { scrubbing = false; });
scrub.addEventListener('input', () => {
  auto = false; tween = null; syncPlayBtn();
  p = parseFloat(scrub.value);
  btnRefold.hidden = p < STEPS - 1e-3;
});

function updateUI() {
  const si = p >= STEPS - 1e-3 ? STEPS - 1 : Math.min(STEPS - 1, Math.floor(p));
  stepNo.textContent = '第' + NUM[si] + '步 / STEP 0' + (si + 1);
  stepTitle.textContent = STEPS_TXT[si].t;
  stepDesc.textContent = STEPS_TXT[si].d;
  stepCount.textContent = '0' + (si + 1) + ' / 07';
  pbar.style.transform = 'scaleX(' + (p / STEPS) + ')';
  if (!scrubbing) scrub.value = p.toFixed(2);
  dots.forEach((d, i) => {
    d.classList.toggle('on', i === si);
    d.classList.toggle('seen', p >= i + 1 - 1e-3);
  });
  if (p >= STEPS - 1e-3 && btnRefold.hidden) btnRefold.hidden = false;
  if (p < STEPS - 1e-3 && !btnRefold.hidden && tween === null) btnRefold.hidden = true;
}

/* ================= 相机自适应 ================= */
function fit() {
  const w = stage.clientWidth || window.innerWidth;
  const h = stage.clientHeight || window.innerHeight;
  renderer.setSize(w, h);
  const aspect = w / h;
  camera.aspect = aspect;
  /* 窄屏拉远，保证整张纸入画 */
  const need = 2.7;
  const dist = need / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect);
  camBase.set(0, 0.75, Math.max(5.2, Math.min(12, dist)));
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', fit);
fit();

/* ================= 鼠标视差（克制） ================= */
const mouse = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

/* ================= 主循环 ================= */
let prevT = performance.now();
let firstFrame = true;

function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - prevT) / 1000;
  prevT = now;
  if (dt > 0.1) dt = 0.1;

  if (tween) {
    tween.t += dt;
    const k = easeInOut(Math.min(1, tween.t / tween.dur));
    p = tween.from + (tween.to - tween.from) * k;
    if (tween.t >= tween.dur) {
      p = tween.to;
      const d = tween.done; tween = null;
      if (d) d(); else if (auto) dwell = 0.9;
    }
  } else if (auto && p < STEPS - 1e-3) {
    if (dwell > 0) dwell -= dt;
    else {
      const target = Math.min(STEPS, Math.floor(p + 1e-6) + 1);
      tween = { from: p, to: target, t: 0, dur: 1.5, done: null };
    }
  } else if (auto && p >= STEPS - 1e-3) {
    auto = false; syncPlayBtn();
  }

  if (Math.abs(p - lastP) > 1e-5) { applyFold(p); updateUI(); }

  /* 完成后的轻微浮动：克制 */
  const doneK = Math.max(0, Math.min(1, (p - (STEPS - 0.6)) / 0.6));
  const tsec = now / 1000;
  boat.position.y += ((Math.sin(tsec * 1.15) * 0.028 * doneK) - boat.position.y) * 0.06;
  boat.rotation.z += ((Math.sin(tsec * 0.8) * 0.012 * doneK) - boat.rotation.z) * 0.06;

  /* 视差 */
  camera.position.x += (mouse.x * 0.32 - camera.position.x) * 0.04;
  camera.position.y += ((camBase.y - mouse.y * 0.18) - camera.position.y) * 0.04;
  camera.position.z += (camBase.z - camera.position.z) * 0.08;
  camera.lookAt(lookAtPt);

  renderer.render(scene, camera);

  if (firstFrame) {
    firstFrame = false;
    root.classList.add('done');
  }
}

applyFold(0);
updateUI();
syncPlayBtn();
/* 调试手柄：验收时用 CDP 亲眼验证各折叠态（无视觉影响） */
window.__origami = { applyFold, paper, camera, scene, boat, setP: (v) => { p = v; tween = null; auto = false; syncPlayBtn(); } };
requestAnimationFrame(frame);
