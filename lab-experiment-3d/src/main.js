// huafire3d fx-lab — original implementation · lab-experiment-3d
// 滑杆/拖拽透镜 → 物距 → 三束光线实时折射（带阻尼），像的大小虚实实时标注。
import * as THREE from 'three';
import {
  F, CANDLE_X, AXIS_Y, H_OBJ, U_MIN, U_MAX, U_DEFAULT, RAIL_END, V_FOLLOW_MAX,
  BLUE, CYAN, conclude, imageOf,
} from './config.js';
import {
  makeLabel, buildEnvironment, buildCandle, buildLens, buildFMarks,
  buildScreen, RaySet, buildImageArrow,
} from './optics.js';

document.body.classList.add('js');

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- 3D 舞台 ----------
const holder = $('gl');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
const CAM_HOME = new THREE.Vector3(0, 4.6, 9.4);
camera.position.copy(CAM_HOME);
const CAM_LOOK = new THREE.Vector3(0, 1.85, 0);
camera.lookAt(CAM_LOOK);

scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe8f2, 1.0));
const key = new THREE.DirectionalLight(0xffffff, 2.0);
key.position.set(4, 7, 5);
scene.add(key);
const fillL = new THREE.DirectionalLight(0xd8f6ff, 0.45);
fillL.position.set(-5, 3, -4);
scene.add(fillL);

buildEnvironment(scene);
const candle = buildCandle();
scene.add(candle);
const { group: lensGroup, hitbox } = buildLens();
scene.add(lensGroup);
const fmarks = buildFMarks();
scene.add(fmarks);
const { group: screenGroup, spot } = buildScreen();
scene.add(screenGroup);
const rays = new RaySet(scene);
const arrow = buildImageArrow(scene);
const flame = candle.children.find((c) => c.geometry && c.geometry.type === 'ConeGeometry');

function sizeRenderer() {
  const w = holder.clientWidth || 640, h = holder.clientHeight || 400;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
holder.appendChild(renderer.domElement);
sizeRenderer();
addEventListener('resize', sizeRenderer);

// ---------- 状态（阻尼） ----------
let uTarget = U_DEFAULT, uCur = U_DEFAULT;
let screenXCur = CANDLE_X + U_DEFAULT + 1.625; // 初值≈像距处
let lensDragging = false;
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const hitPoint = new THREE.Vector3();

function castLens(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObject(hitbox, false).length > 0;
}

holder.addEventListener('pointerdown', (e) => {
  if (castLens(e)) {
    lensDragging = true;
    holder.setPointerCapture(e.pointerId);
    holder.classList.add('draglens');
  }
});
holder.addEventListener('pointermove', (e) => {
  if (!lensDragging) return;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
    setU(clamp(hitPoint.x - CANDLE_X, U_MIN, U_MAX), true);
  }
});
const endDrag = () => { lensDragging = false; holder.classList.remove('draglens'); };
holder.addEventListener('pointerup', endDrag);
holder.addEventListener('pointercancel', endDrag);

// 镜头视差（拖拽透镜时暂停）
let mx = 0, my = 0;
addEventListener('pointermove', (e) => {
  if (lensDragging) return;
  mx = (e.clientX / innerWidth) * 2 - 1;
  my = -((e.clientY / innerHeight) * 2 - 1);
});

// ---------- UI ----------
const slider = $('uSlider'), uVal = $('uVal');
function paintSlider() {
  const p = ((parseFloat(slider.value) - U_MIN) / (U_MAX - U_MIN)) * 100;
  slider.style.background = `linear-gradient(90deg, #2563EB ${p}%, rgba(22,34,46,.12) ${p}%)`;
}
function setU(u, fromDrag = false) {
  uTarget = clamp(u, U_MIN, U_MAX);
  if (fromDrag || reducedMotion) uCur = uTarget; // 拖拽跟手，无阻尼
  slider.value = uTarget.toFixed(2);
  paintSlider();
  document.querySelectorAll('#chips .chip').forEach((c) =>
    c.classList.toggle('on', Math.abs(parseFloat(c.dataset.u) - uTarget) < 0.005));
}
slider.addEventListener('input', () => setU(parseFloat(slider.value)));
document.querySelectorAll('#chips .chip').forEach((c) =>
  c.addEventListener('click', () => setU(parseFloat(c.dataset.u))));
paintSlider();

const vVal = $('vVal'), mVal = $('mVal'), nVal = $('nVal');
const conclBadge = $('conclBadge'), conclTitle = $('conclTitle'), conclDesc = $('conclDesc');
const lastText = {};
function setText(el, key, txt) {
  if (lastText[key] !== txt) { lastText[key] = txt; el.textContent = txt; }
}

// ---------- 每帧：阻尼 → 光路重算 ----------
const clock = new THREE.Clock();
let firstFrame = true;
const tmpV = new THREE.Vector3();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 阻尼跟随
  if (!reducedMotion && !lensDragging) {
    const k = 1 - Math.exp(-7 * dt);
    uCur += (uTarget - uCur) * k;
    if (Math.abs(uTarget - uCur) < 0.0005) uCur = uTarget;
  } else if (reducedMotion) {
    uCur = uTarget;
  }

  const lx = CANDLE_X + uCur;
  lensGroup.position.x = lx;
  fmarks.position.x = lx;

  const { type, v, m } = imageOf(uCur);
  const ox = CANDLE_X, oy = AXIS_Y + H_OBJ, ay = AXIS_Y;
  const A1 = [lx, oy];
  const inv = 1 / Math.hypot(F, H_OBJ);
  const dirA = [F * inv, -H_OBJ * inv];
  const s = (lx - ox) / (lx - F - ox);
  const B1 = [lx, oy + s * (ay - oy)];
  const C0 = [lx, ay];
  const invC = 1 / Math.hypot(lx - ox, ay - oy);
  const dirC = [(lx - ox) * invC, (ay - oy) * invC];
  const L = 3.6;

  let screenTarget = RAIL_END;
  if (type === 'real') {
    const ix = lx + v, iy = ay - m * H_OBJ;
    rays.setSolid(0, [[ox, oy], A1, [ix, iy]]);
    rays.setSolid(1, [[ox, oy], B1, [ix, iy]]);
    rays.setSolid(2, [[ox, oy], C0, [ix, iy]]);
    for (let i = 0; i < 3; i++) rays.setDash(i, null, null, false);
    arrow.show(ix, -1, m * H_OBJ, false, '实像');
    if (v <= V_FOLLOW_MAX) {
      screenTarget = lx + v;
      spot.visible = true;
      spot.position.y = ay - m * H_OBJ;
    } else {
      spot.visible = false;
    }
  } else if (type === 'virtual') {
    const vx = lx + v, vy = ay + m * H_OBJ; // v < 0
    rays.setSolid(0, [[ox, oy], A1, [A1[0] + dirA[0] * L, A1[1] + dirA[1] * L]]);
    rays.setSolid(1, [[ox, oy], B1, [B1[0] + L, B1[1]]]);
    rays.setSolid(2, [[ox, oy], C0, [C0[0] + dirC[0] * L, C0[1] + dirC[1] * L]]);
    rays.setDash(0, A1, [vx, vy], true);
    rays.setDash(1, B1, [vx, vy], true);
    rays.setDash(2, C0, [vx, vy], true);
    arrow.show(vx, 1, m * H_OBJ, true, '虚像');
    spot.visible = false;
  } else {
    rays.setSolid(0, [[ox, oy], A1, [A1[0] + dirA[0] * L, A1[1] + dirA[1] * L]]);
    rays.setSolid(1, [[ox, oy], B1, [B1[0] + L, B1[1]]]);
    rays.setSolid(2, [[ox, oy], C0, [C0[0] + dirC[0] * L, C0[1] + dirC[1] * L]]);
    for (let i = 0; i < 3; i++) rays.setDash(i, null, null, false);
    arrow.hide();
    spot.visible = false;
  }

  // 光屏阻尼跟随
  if (!reducedMotion) {
    const k = 1 - Math.exp(-5 * dt);
    screenXCur += (screenTarget - screenXCur) * k;
  } else {
    screenXCur = screenTarget;
  }
  screenGroup.position.x = screenXCur;

  // 烛焰轻晃（手工感）
  if (flame && !reducedMotion) flame.scale.y = 1 + Math.sin(t * 13) * 0.045;

  // 镜头视差
  if (!reducedMotion && !lensDragging) {
    const k = 1 - Math.exp(-4 * dt);
    tmpV.set(CAM_HOME.x + mx * 0.9, CAM_HOME.y + my * 0.5, CAM_HOME.z);
    camera.position.lerp(tmpV, k);
    camera.lookAt(CAM_LOOK);
  }

  // 读数（文本变化时才写 DOM）
  setText(uVal, 'u', `u = ${uCur.toFixed(2)} f`);
  if (type === 'real') {
    setText(vVal, 'v', v <= V_FOLLOW_MAX ? `${v.toFixed(2)} f` : `${v.toFixed(2)} f · 屏外`);
    setText(mVal, 'm', `${m.toFixed(2)} ×`);
    setText(nVal, 'n', '实像');
  } else if (type === 'virtual') {
    setText(vVal, 'v', `虚 ${Math.abs(v).toFixed(2)} f`);
    setText(mVal, 'm', `${m.toFixed(2)} ×`);
    setText(nVal, 'n', '虚像');
  } else {
    setText(vVal, 'v', '∞');
    setText(mVal, 'm', '—');
    setText(nVal, 'n', '—');
  }
  const [ct, cd, badge, bcls] = conclude(uCur);
  setText(conclTitle, 'ct', ct);
  setText(conclDesc, 'cd', cd);
  setText(conclBadge, 'b', badge);
  conclBadge.className = 'badge' + (bcls ? ' ' + bcls : '');

  renderer.render(scene, camera);
  if (firstFrame) { firstFrame = false; $('glcard').classList.add('ready'); }
}
frame();

// ---------- 启动 ----------
setU(U_DEFAULT);
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded')));
