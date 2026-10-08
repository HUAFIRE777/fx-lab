/* code-typing-3d · main.js — original implementation
 * 打字机逐字符打出教学代码 → 点「运行」→ 3D 粒子阵列随代码逐行生长。
 * 动效全部走自研 src/tween.js（无外部动画库依赖）。
 */
import * as THREE from 'three';
import { tween, delayedCall, killAll, Easings } from './tween.js';

/* ---------------- 代码数据：[类型, 文本] ----------------
 * 类型: k=关键字(绿) f=函数名(亮绿) n=数字(琥珀) s=字符串(琥珀)
 *       c=注释(灰) p=普通 o=运算符 */
const CODE = [
  [['c', '// 用循环生成粒子阵列']],
  [['k', 'const '], ['p', 'COLS '], ['o', '= '], ['n', '6'], ['o', ';'], ['c', '      // 横向 6 列']],
  [['k', 'const '], ['p', 'ROWS '], ['o', '= '], ['n', '4'], ['o', ';'], ['c', '      // 纵向 4 行']],
  [['k', 'const '], ['p', 'GAP  '], ['o', '= '], ['n', '2.2'], ['o', ';'], ['c', '    // 柱子间距']],
  [],
  [['k', 'const '], ['p', 'group '], ['o', '= '], ['k', 'new '], ['p', 'THREE.'], ['f', 'Group'], ['p', '();']],
  [['p', 'scene.'], ['f', 'add'], ['p', '(group);'], ['c', '  // 先搭一个空舞台']],
  [],
  [['k', 'for '], ['p', '('], ['k', 'let '], ['p', 'x '], ['o', '= '], ['n', '0'], ['o', '; '],
   ['p', 'x '], ['o', '< '], ['p', 'COLS; '], ['p', 'x'], ['o', '++) {']],
  [['p', '  '], ['k', 'for '], ['p', '('], ['k', 'let '], ['p', 'z '], ['o', '= '], ['n', '0'], ['o', '; '],
   ['p', 'z '], ['o', '< '], ['p', 'ROWS; '], ['p', 'z'], ['o', '++) {']],
  [['p', '    '], ['k', 'const '], ['p', 'h '], ['o', '= '], ['n', '1.2'], ['o', ' + '], ['f', 'rnd'], ['p', '(x, z) '], ['o', '* '], ['n', '2.6'], ['o', ';'],
   ['c', ' // 高度伪随机，看着自然']],
  [['p', '    '], ['k', 'const '], ['p', 'geo '], ['o', '= '], ['k', 'new '], ['p', 'THREE.'], ['f', 'CylinderGeometry'],
   ['p', '('], ['n', '0.32'], ['p', ', '], ['n', '0.32'], ['p', ', h, '], ['n', '12'], ['p', ');']],
  [['p', '    '], ['k', 'const '], ['p', 'mesh '], ['o', '= '], ['k', 'new '], ['p', 'THREE.'], ['f', 'Mesh'],
   ['p', '(geo, matGreen);']],
  [['p', '    mesh.position.'], ['f', 'set'], ['p', '(x '], ['o', '* '], ['p', 'GAP, h '], ['o', '/ '], ['n', '2'], ['p', ', z '], ['o', '* '], ['p', 'GAP);']],
  [['p', '    group.'], ['f', 'add'], ['p', '(mesh);'], ['c', '   // 柱子逐根升起']],
  [['p', '  }']],
  [['p', '}']],
  [],
  [['k', 'const '], ['p', 'grid '], ['o', '= '], ['k', 'new '], ['p', 'THREE.'], ['f', 'GridHelper'], ['p', '('], ['n', '16'], ['p', ', '], ['n', '8'], ['p', ');']],
  [['p', 'scene.'], ['f', 'add'], ['p', '(grid);'], ['c', '     // 底座网格收尾']],
];
const TOTAL_LINES = CODE.length; // 20

const COLS = 6, ROWS = 4, GAP = 2.2;
/* 确定性伪随机：同一份代码永远长出同一片阵列 */
const rnd = (x, z) => { const v = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return v - Math.floor(v); };
const colH = (x, z) => 1.2 + rnd(x, z) * 2.6;

const $ = (id) => document.getElementById(id);
const codeEl = $('code'), stateText = $('stateText'), progText = $('progText');
const btnRun = $('btnRun'), btnReset = $('btnReset');
const viewport = $('viewport'), termEl = $('term'), doneBadge = $('doneBadge');

/* ---------------- 打字机 ---------------- */
let typingToken = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildLineShell(i) {
  const div = document.createElement('div');
  div.className = 'cline';
  const ln = document.createElement('span');
  ln.className = 'ln';
  ln.textContent = i + 1;
  const cc = document.createElement('span');
  cc.className = 'cc';
  div.appendChild(ln); div.appendChild(cc);
  return { div, cc };
}

async function typeCode(token) {
  codeEl.innerHTML = '';
  const caret = document.createElement('span');
  caret.className = 'caret';
  let done = 0;
  for (let i = 0; i < CODE.length; i++) {
    if (token !== typingToken) return false;
    const { div, cc } = buildLineShell(i);
    cc.appendChild(caret);
    codeEl.appendChild(div);
    const segs = CODE[i];
    for (const [type, text] of segs) {
      if (token !== typingToken) return false;
      const sp = document.createElement('span');
      sp.className = 'tok-' + type;
      cc.insertBefore(sp, caret);
      for (const ch of text) {
        if (token !== typingToken) return false;
        sp.textContent += ch;
        await sleep(ch === ' ' ? 6 : 15);
      }
      /* 关键字/函数名打完时闪一下：逐词高亮点亮 */
      if (type === 'k' || type === 'f') { sp.classList.add('flash'); setTimeout(() => sp.classList.remove('flash'), 520); }
    }
    done++;
    progText.textContent = `${done} / ${TOTAL_LINES} 行`;
    await sleep(i === 0 || CODE[i].length === 0 ? 90 : 170);
  }
  caret.remove();
  return true;
}

/* ---------------- Three.js 场景 ---------------- */
const BG = 0x0d1117, GREEN = 0x3fb950, GREEN_B = 0x7ee787, AMBER = 0xd29922;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 26, 62);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

const CX = (COLS - 1) * GAP / 2, CZ = (ROWS - 1) * GAP / 2; // 阵列中心
let azim = 0.62, polar = 1.02, radius = 21, idleSpin = true, dragging = false;

function applyCam() {
  camera.position.set(
    CX + radius * Math.sin(polar) * Math.sin(azim),
    radius * Math.cos(polar),
    CZ + radius * Math.sin(polar) * Math.cos(azim)
  );
  camera.lookAt(CX, 1.4, CZ);
}
function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize(); applyCam();

/* 灯光 */
scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(8, 14, 6); scene.add(key);
const rim = new THREE.DirectionalLight(GREEN, 0.5); rim.position.set(-8, 6, -8); scene.add(rim);

/* 手动轨道控制（不依赖 addons） */
let px = 0, py = 0, lastAct = 0;
const cv = renderer.domElement;
cv.addEventListener('pointerdown', (e) => { dragging = true; px = e.clientX; py = e.clientY; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', (e) => {
  lastAct = performance.now();
  if (dragging) {
    azim -= (e.clientX - px) * 0.005; polar = Math.min(1.45, Math.max(0.35, polar - (e.clientY - py) * 0.004));
    px = e.clientX; py = e.clientY; applyCam(); idleSpin = false;
  } else hoverCheck(e);
});
addEventListener('pointerup', () => { dragging = false; });
cv.addEventListener('wheel', (e) => { e.preventDefault(); radius = Math.min(34, Math.max(10, radius * (1 + e.deltaY * 0.001))); applyCam(); lastAct = performance.now(); }, { passive: false });

/* 舞台：运行后逐步搭建 */
const stage = new THREE.Group(); scene.add(stage);
const colMeshes = [], capMeshes = [];
let gridHelper = null, frameBox = null, baseDisc = null;

const matGreenBase = new THREE.MeshStandardMaterial({ color: GREEN, roughness: .38, metalness: .25, emissive: GREEN, emissiveIntensity: .12 });
const matAmber = new THREE.MeshStandardMaterial({ color: AMBER, roughness: .3, metalness: .4, emissive: AMBER, emissiveIntensity: .35 });

function clearStage() {
  killAll(); // 停掉所有进行中的补间
  while (stage.children.length) {
    const o = stage.children.pop();
    o.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.material && n.material._owned) n.material.dispose(); });
  }
  colMeshes.length = 0; capMeshes.length = 0;
  gridHelper = frameBox = baseDisc = null;
  termEl.innerHTML = ''; doneBadge.classList.remove('is-in');
  document.querySelectorAll('.cline.active').forEach((el) => el.classList.remove('active'));
}

function termLog(html, cls) {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  d.innerHTML = html;
  termEl.appendChild(d);
  requestAnimationFrame(() => d.classList.add('show'));
  while (termEl.children.length > 4) termEl.firstChild.remove();
}
function markLines(range, on) {
  range.forEach((i) => {
    const el = codeEl.children[i];
    if (el) el.classList.toggle('active', on);
  });
}

/* 各步骤的搭建动作 */
function stepParams() {
  baseDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(9.2, 9.6, 0.35, 48),
    new THREE.MeshStandardMaterial({ color: 0x161b22, roughness: .9 })
  );
  baseDisc.position.set(CX, -0.18, CZ);
  baseDisc.scale.set(0.001, 1, 0.001);
  stage.add(baseDisc);
  tween({ from: { v: 0.001 }, to: { v: 1 }, dur: 0.8, ease: Easings.backOut(1.6),
    update: (o) => baseDisc.scale.set(o.v, 1, o.v) });
  termLog(`&gt; 参数就绪：<span class="hl">${COLS} 列 × ${ROWS} 行</span>，间距 ${GAP}`);
}
function stepGroup() {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(COLS * GAP + 1.6, 5.2, ROWS * GAP + 1.6));
  frameBox = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: AMBER, transparent: true, opacity: 0 }));
  frameBox.position.set(CX, 2.6, CZ);
  stage.add(frameBox);
  tween({ from: { v: 0 }, to: { v: 0.55 }, dur: 0.8, update: (o) => { frameBox.material.opacity = o.v; } });
  termLog('&gt; 空舞台 <span class="hl">group</span> 已创建');
}
function stepLoops() {
  termLog('&gt; 双层循环：遍历 <span class="hl">24</span> 个格子…');
}
function stepColumns() {
  let i = 0;
  for (let x = 0; x < COLS; x++) for (let z = 0; z < ROWS; z++) {
    const h = colH(x, z);
    const g = new THREE.CylinderGeometry(0.32, 0.38, h, 12);
    g.translate(0, h / 2, 0);
    const tint = (x + z) / (COLS + ROWS);
    const mat = matGreenBase.clone(); mat._owned = true;
    mat.color.lerp(new THREE.Color(GREEN_B), tint * 0.45);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x * GAP, 0, z * GAP);
    m.scale.y = 0.001;
    m.userData.cap = i;
    stage.add(m); colMeshes.push(m);
    const capMat = matAmber.clone(); capMat._owned = true;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 12), capMat);
    cap.position.set(x * GAP, h + 0.1, z * GAP);
    cap.scale.setScalar(0.001);
    stage.add(cap); capMeshes.push(cap);
    const d = 0.35 + i * 0.07;
    delayedCall(d, () => tween({ from: { v: 0.001 }, to: { v: 1 }, dur: 0.55, ease: Easings.backOut(1.5),
      update: (o) => { m.scale.y = o.v; } }));
    delayedCall(d + 0.4, () => tween({ from: { v: 0.001 }, to: { v: 1 }, dur: 0.4, ease: Easings.backOut(2.2),
      update: (o) => cap.scale.setScalar(o.v) }));
    i++;
  }
}
function stepFinish() {
  gridHelper = new THREE.GridHelper(16, 8, GREEN, 0x1d2b23);
  gridHelper.position.set(CX, 0.02, CZ);
  gridHelper.material.transparent = true; gridHelper.material.opacity = 0;
  stage.add(gridHelper);
  tween({ from: { v: 0 }, to: { v: 0.5 }, dur: 1, update: (o) => { gridHelper.material.opacity = o.v; } });
  if (frameBox) tween({ from: { v: frameBox.material.opacity }, to: { v: 0.12 }, dur: 1,
    update: (o) => { frameBox.material.opacity = o.v; } });
  termLog('<span class="ok">&gt; 渲染完成：24 根粒子柱全部升起</span>');
}

/* 运行序列：代码行高亮与 3D 生长一一对应（绝对时间调度） */
let running = false, runToken = 0;
function runAll() {
  if (running) return;
  running = true; idleSpin = false;
  const tk = ++runToken;
  btnRun.disabled = true; btnReset.disabled = true;
  btnRun.classList.remove('armed');
  stateText.textContent = '运行中…';
  clearStage();
  const alive = () => tk === runToken;
  const at = (t, fn) => delayedCall(t, () => { if (alive()) fn(); });

  at(0.0, () => { markLines([1, 2, 3], true); });
  at(0.15, stepParams);
  at(1.05, () => markLines([1, 2, 3], false));

  at(1.15, () => { markLines([5, 6], true); });
  at(1.3, stepGroup);
  at(2.2, () => markLines([5, 6], false));

  at(2.3, () => { markLines([8, 9], true); });
  at(2.45, stepLoops);
  at(3.35, () => markLines([8, 9], false));

  at(3.45, () => { markLines([10, 11, 12, 13, 14], true); });
  at(3.6, stepColumns);
  /* 柱体 0.35 + 24*0.07 + 0.95 ≈ 3.0s 后收尾 */
  at(6.7, () => { markLines([10, 11, 12, 13, 14], false); markLines([18, 19], true); });
  at(6.85, stepFinish);
  at(7.9, () => markLines([18, 19], false));

  at(8.4, () => { if (alive()) onRunDone(); });
}
function onRunDone() {
  running = false;
  btnReset.disabled = false;
  stateText.textContent = '运行完毕';
  doneBadge.classList.add('is-in'); // 完成态：见 CSS .done-badge.is-in
  /* 镜头轻轻推进 */
  const r0 = radius;
  tween({ from: { v: r0 }, to: { v: r0 * 0.86 }, dur: 1.4, ease: 'inOutCubic',
    update: (o) => { radius = o.v; applyCam(); },
    complete: () => { idleSpin = true; lastAct = performance.now(); } });
}

/* 悬停柱子：顶端粒子放大 + 光标提示 */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let hovered = -1;
function hoverCheck(e) {
  if (!colMeshes.length) return;
  const r = cv.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(colMeshes, false)[0];
  const idx = hit ? hit.object.userData.cap : -1;
  if (idx !== hovered) {
    if (hovered >= 0 && capMeshes[hovered]) {
      const c = capMeshes[hovered];
      tween({ from: { v: c.scale.x }, to: { v: 1 }, dur: 0.25, update: (o) => c.scale.setScalar(o.v) });
    }
    hovered = idx;
    if (hovered >= 0 && capMeshes[hovered]) {
      const c = capMeshes[hovered];
      tween({ from: { v: c.scale.x }, to: { v: 1.7 }, dur: 0.25, ease: Easings.backOut(2), update: (o) => c.scale.setScalar(o.v) });
    }
    cv.style.cursor = hovered >= 0 ? 'pointer' : 'grab';
  }
}

/* 渲染循环 */
function tick() {
  requestAnimationFrame(tick);
  if (idleSpin && !dragging && performance.now() - lastAct > 3500) { azim += 0.0016; applyCam(); }
  const t = performance.now() * 0.002;
  for (let i = 0; i < capMeshes.length; i++) capMeshes[i].position.y += Math.sin(t + i) * 0.0012;
  renderer.render(scene, camera);
}
tick();

/* 按钮 */
btnRun.addEventListener('click', runAll);
btnReset.addEventListener('click', () => {
  if (running) return;
  runToken++; // 作废残留调度
  typingToken++; // 中断可能残留的打字（理论上已结束）
  clearStage();
  btnRun.disabled = false; btnRun.classList.add('armed');
  stateText.textContent = '等待运行';
  progText.textContent = `${TOTAL_LINES} / ${TOTAL_LINES} 行`;
  idleSpin = true; lastAct = performance.now();
});

/* 启动：加载态 → 打字机 */
addEventListener('load', async () => {
  await sleep(500);
  $('loader').classList.add('done');
  await sleep(350);
  typingToken++;
  const ok = await typeCode(typingToken);
  if (ok) {
    stateText.textContent = '等待运行';
    btnRun.disabled = false;
    btnRun.classList.add('armed');
  }
});
