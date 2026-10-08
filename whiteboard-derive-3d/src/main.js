/* whiteboard-derive-3d · main.js — original implementation
 * 粉笔字 SVG 逐笔写出 4 步推导（球表面积 4πr²），3D 线框几何随步骤同步旋转展示。
 * 动效全部走自研 src/tween.js（无外部动画库依赖）。
 */
import * as THREE from 'three';
import { tween, delayedCall, killAll, Easings } from './tween.js';

const $ = (id) => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const stepsLayer = $('stepsLayer'), fxLayer = $('fxLayer'), chalkTip = $('chalkTip');
const btnPrev = $('btnPrev'), btnNext = $('btnNext'), stepInd = $('stepInd');
const dots = [...$('dots').children], vpCap = $('vpCap'), viewport = $('viewport');

/* ---------------- 推导文案（4 步） ---------------- */
const CN = ['一', '二', '三', '四'];
const STEPS = [
  {
    label: '第一步 · 把球装进圆柱',
    lines: ['取一个半径为 r 的球，', '放进一个刚好装下它的圆柱里——', '圆柱的高是 2r，底面半径也是 r。'],
    formula: null, big: false, rotY: 0.6,
    cap: '球，被一个高 2r 的圆柱刚好裹住。',
  },
  {
    label: '第二步 · 切出一条薄带',
    lines: ['在高度 h 处横切一条薄带，', '它的面积约等于 2πr·dh。', '神奇的是：结果和纬度无关。'],
    formula: 'dS = 2πr·dh', big: false, rotY: 0.6 + Math.PI / 2,
    cap: '看这一条薄带：面积只和它的高度 dh 有关。',
  },
  {
    label: '第三步 · 把薄带全部叠起来',
    lines: ['从球底一路叠到球顶，', '所有薄带的高度加起来，刚好是 2r。'],
    formula: 'S = 2πr × 2r', big: false, rotY: 0.6 + Math.PI,
    cap: '九条薄带叠起来，总高度就是 2r。',
  },
  {
    label: '结 论',
    lines: ['球的表面积，恰好等于', '外切圆柱的侧面积。'],
    formula: 'S = 4πr²', big: true, rotY: 0.6 + Math.PI * 2,
    cap: '球面 = 圆柱侧面，证毕。',
  },
];

/* 确定性伪随机：粉笔笔触每次一样 */
const srand = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

/* 手绘波浪下划线路径 */
function wavyPath(x, y, w, seed) {
  const r = srand(seed);
  let d = `M ${x} ${y}`;
  let cx = x;
  const segs = 6, sw = w / segs;
  for (let i = 0; i < segs; i++) {
    const dy = (r() - 0.5) * 7;
    d += ` q ${sw / 2} ${dy.toFixed(1)} ${sw.toFixed(1)} ${((r() - 0.5) * 3).toFixed(1)}`;
    cx += sw;
  }
  return d;
}

/* ---------------- 粉笔书写 ---------------- */
let drawToken = 0;

function buildStep(i) {
  const s = STEPS[i];
  const g = el('g', { class: 'step current', transform: 'rotate(-0.4 330 280)' }, stepsLayer);
  const parts = []; // {els:[tspan...], kind}

  const label = el('text', { x: 56, y: 78, class: 'chalk-label' }, g);
  label.textContent = s.label;
  parts.push({ els: [label], kind: 'label' });

  s.lines.forEach((ln, li) => {
    const t = el('text', { x: 56, y: 140 + li * 48, class: 'chalk-line' }, g);
    const spans = [...ln].map((ch) => {
      const ts = el('tspan', {}, t);
      ts.textContent = ch;
      ts.setAttribute('opacity', '0');
      return ts;
    });
    parts.push({ els: spans, kind: 'line' });
  });

  let uline = null;
  if (s.formula) {
    const fy = 140 + s.lines.length * 48 + 44;
    const t = el('text', { x: 56, y: fy, class: 'chalk-formula' + (s.big ? ' big' : '') }, g);
    const spans = [...s.formula].map((ch) => {
      const ts = el('tspan', {}, t);
      ts.textContent = ch;
      ts.setAttribute('opacity', '0');
      return ts;
    });
    parts.push({ els: spans, kind: 'formula' });
    const w = s.big ? 300 : 250;
    uline = el('path', { d: wavyPath(52, fy + 26, w, 100 + i), class: 'uline' }, g);
    const L = uline.getTotalLength();
    uline.style.strokeDasharray = L;
    uline.style.strokeDashoffset = L;
  }
  return { g, parts, uline };
}

function finalizeInstant(built) {
  built.parts.forEach((p) => p.els.forEach((e) => e.setAttribute('opacity', '1')));
  if (built.uline) built.uline.style.strokeDashoffset = 0;
  chalkTip.setAttribute('opacity', '0');
}

/* 粉笔尘：下划线书写时的碎屑 */
function dust(x, y) {
  for (let k = 0; k < 5; k++) {
    const c = el('circle', { cx: x + (Math.random() - 0.5) * 14, cy: y + (Math.random() - 0.5) * 10, r: 1.6, fill: '#F5F2E9' }, fxLayer);
    tween({ from: { v: 0.7 }, to: { v: 0 }, dur: 0.7, delay: Math.random() * 0.4,
      update: (o) => c.setAttribute('opacity', o.v),
      complete: () => c.remove() });
  }
}

function animateDraw(built, token) {
  const alive = () => token === drawToken;
  let t = 0.15;
  built.parts.forEach((p) => {
    const per = p.kind === 'formula' ? 0.07 : p.kind === 'label' ? 0.02 : 0.045;
    p.els.forEach((e2, ci) => {
      delayedCall(t + ci * per, () => { if (alive()) e2.setAttribute('opacity', '1'); });
    });
    t += p.els.length * per + (p.kind === 'label' ? 0.25 : 0.35);
  });
  if (built.uline) {
    const L = built.uline.getTotalLength();
    delayedCall(t, () => {
      if (!alive()) return;
      chalkTip.setAttribute('opacity', '0.9');
      dust(120, parseFloat(built.uline.getAttribute('d').split(' ')[2]) || 300);
      tween({ from: { v: L }, to: { v: 0 }, dur: 0.9, ease: 'outCubic',
        update: (o) => {
          if (!alive()) return;
          built.uline.style.strokeDashoffset = o.v;
          const pt = built.uline.getPointAtLength(L - o.v);
          chalkTip.setAttribute('cx', pt.x); chalkTip.setAttribute('cy', pt.y - 4);
        },
        complete: () => { chalkTip.setAttribute('opacity', '0'); } });
    });
  }
}

function showStep(i, animated) {
  drawToken++;
  killAll();
  stepsLayer.innerHTML = ''; fxLayer.innerHTML = '';
  chalkTip.setAttribute('opacity', '0');
  const built = buildStep(i);
  if (animated) animateDraw(built, drawToken);
  else finalizeInstant(built);
  /* 3D 联动 */
  drive3D(i);
  /* UI */
  dots.forEach((d, di) => d.classList.toggle('on', di <= i));
  stepInd.textContent = `${CN[i]} / 四`;
  vpCap.textContent = STEPS[i].cap;
  btnPrev.disabled = i === 0;
  btnNext.disabled = i === STEPS.length - 1;
}

/* ---------------- Three.js：线框球 + 圆柱 + 薄带 ---------------- */
const CHALK = 0xf5f2e9, YELLOW = 0xf2c94c;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
viewport.insertBefore(renderer.domElement, viewport.firstChild);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14211a);
scene.fog = new THREE.Fog(0x14211a, 12, 26);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

let azim = 0.7, polar = 1.12, radius = 8.2;
function applyCam() {
  camera.position.set(radius * Math.sin(polar) * Math.sin(azim), radius * Math.cos(polar), radius * Math.sin(polar) * Math.cos(azim));
  camera.lookAt(0, 0, 0);
}
function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

const world = new THREE.Group(); scene.add(world);
let stepRot = 0.6, idleOff = 0, idleSpin = true, dragging = false, lastAct = 0;

const sphereWire = new THREE.LineSegments(
  new THREE.WireframeGeometry(new THREE.SphereGeometry(2, 26, 18)),
  new THREE.LineBasicMaterial({ color: CHALK, transparent: true, opacity: 0 })
);
world.add(sphereWire);
const cylWire = new THREE.LineSegments(
  new THREE.WireframeGeometry(new THREE.CylinderGeometry(2, 2, 4, 28, 1, true)),
  new THREE.LineBasicMaterial({ color: CHALK, transparent: true, opacity: 0 })
);
world.add(cylWire);

/* 薄带：球面上一圈窄带 */
function bandAt(theta) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(2.04, 40, 4, 0, Math.PI * 2, theta - 0.055, 0.11),
    new THREE.MeshBasicMaterial({ color: YELLOW, transparent: true, opacity: 0, side: THREE.DoubleSide })
  );
  m.scale.setScalar(0.001);
  world.add(m);
  return m;
}
const bandOne = bandAt(1.05);
const bandMany = [];
for (let k = 0; k < 9; k++) bandMany.push(bandAt(0.35 + k * 0.305));

function popIn(mesh, delay, op) {
  delayedCall(delay, () => {
    tween({ from: { v: 0.001 }, to: { v: 1 }, dur: 0.5, ease: Easings.backOut(1.8),
      update: (o) => mesh.scale.setScalar(Math.max(0.001, o.v)) });
    tween({ from: { v: 0 }, to: { v: op }, dur: 0.5, update: (o) => { mesh.material.opacity = o.v; } });
  });
}

let bandPulse = false;
function drive3D(i) {
  const s = STEPS[i];
  /* 旋转与步骤绑定 */
  const from = stepRot;
  tween({ from: { v: from }, to: { v: s.rotY }, dur: 1.3, ease: 'inOutCubic',
    update: (o) => { stepRot = o.v; } });
  idleSpin = false; lastAct = performance.now();

  if (i >= 0) {
    tween({ from: { v: sphereWire.material.opacity }, to: { v: 0.5 }, dur: 0.9, update: (o) => { sphereWire.material.opacity = o.v; } });
    tween({ from: { v: cylWire.material.opacity }, to: { v: i === 3 ? 0.6 : 0.22 }, dur: 0.9,
      update: (o) => { cylWire.material.opacity = o.v; } });
  }
  if (i >= 1 && bandOne.material.opacity < 0.1) { bandPulse = true; popIn(bandOne, 0.5, 0.9); }
  if (i >= 2) { bandPulse = false; bandMany.forEach((b, k) => { if (b.material.opacity < 0.1) popIn(b, 0.6 + k * 0.12, 0.85); }); }
  if (i === 3) {
    /* 结论：圆柱染成粉笔黄，薄带全亮 */
    tween({ from: { v: 0 }, to: { v: 1 }, dur: 1.2, delay: 0.5,
      update: (o) => cylWire.material.color.lerpColors(new THREE.Color(CHALK), new THREE.Color(YELLOW), o.v) });
    bandMany.forEach((b) => tween({ from: { v: b.material.opacity }, to: { v: 0.95 }, dur: 0.8, delay: 0.5,
      update: (o) => { b.material.opacity = o.v; } }));
  }
}

/* 手动轨道 */
let px = 0, py = 0;
const cv = renderer.domElement;
cv.addEventListener('pointerdown', (e) => { dragging = true; px = e.clientX; py = e.clientY; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', (e) => {
  lastAct = performance.now();
  if (dragging) {
    azim -= (e.clientX - px) * 0.005;
    polar = Math.min(1.5, Math.max(0.4, polar - (e.clientY - py) * 0.004));
    px = e.clientX; py = e.clientY; applyCam(); idleSpin = false;
  }
});
addEventListener('pointerup', () => { dragging = false; });
cv.addEventListener('wheel', (e) => { e.preventDefault(); radius = Math.min(16, Math.max(5, radius * (1 + e.deltaY * 0.001))); applyCam(); lastAct = performance.now(); }, { passive: false });

function tick() {
  requestAnimationFrame(tick);
  if (idleSpin && !dragging && performance.now() - lastAct > 3000) { idleOff += 0.0012; }
  world.rotation.y = stepRot + idleOff;
  if (bandPulse) bandOne.material.opacity = 0.65 + Math.sin(performance.now() * 0.005) * 0.25;
  renderer.render(scene, camera);
}

/* ---------------- 控制 ---------------- */
let cur = 0;
function go(i) {
  cur = Math.min(STEPS.length - 1, Math.max(0, i));
  showStep(cur, true);
}
btnPrev.addEventListener('click', () => go(cur - 1));
btnNext.addEventListener('click', () => go(cur + 1));
addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
  if (e.code === 'ArrowLeft') go(cur - 1);
});

/* 启动 */
resize(); applyCam(); tick();
addEventListener('load', async () => {
  await new Promise((r) => setTimeout(r, 500));
  $('loader').classList.add('done');
  await new Promise((r) => setTimeout(r, 350));
  showStep(0, true);
});
