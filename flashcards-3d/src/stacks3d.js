// huafire3d fx-lab — original implementation · flashcards-3d
// 背景 3D：左右两摞纸卡（待复习 / 已掌握），厚度随数量实时变化。
// transferToMastered：顶部纸卡沿弧线飞入掌握堆；receiveReview：待复习堆顶部弹一下表示"收回"。
// 纯程序化几何，零外部模型。
import * as THREE from 'three';

const PAPER = 0xfffdf8;
const RED = 0xe5484d;
const CARD_T = 0.078; // 单张厚度

const canvas = document.getElementById('bg3d');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
const CAM_BASE = new THREE.Vector3(0, 4.7, 8.8);
camera.position.copy(CAM_BASE);
const LOOK = new THREE.Vector3(0, 0.75, 0);
camera.lookAt(LOOK);

scene.add(new THREE.HemisphereLight(0xfff9f0, 0xd9cfbc, 1.0));
const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(4, 8, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffe9d6, 0.5);
rim.position.set(-5, 3, -4);
scene.add(rim);

// 共享几何/材质
const cardGeo = new THREE.BoxGeometry(2.2, 0.07, 3.1);
const cardMat = new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.85, metalness: 0 });
const shadowGeo = new THREE.CircleGeometry(2.0, 40);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.07, depthWrite: false });
const redMat = new THREE.MeshBasicMaterial({ color: RED });

function makeStack(x) {
  const g = new THREE.Group();
  g.position.set(x, 0, 0);
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  shadow.scale.set(1, 1.35, 1);
  g.add(shadow);
  scene.add(g);
  return { group: g, meshes: [] };
}

let review = null, mastered = null;
let spread = 3.3;

function jitter(mesh, i) {
  mesh.rotation.y = (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.1;
  mesh.position.x = (Math.sin(i * 78.233) * 12543.21 % 1) * 0.08;
  mesh.position.z = (Math.sin(i * 39.425) * 9876.54 % 1) * 0.08;
  mesh.position.y = i * CARD_T + 0.035;
}

function makeCard(i) {
  const m = new THREE.Mesh(cardGeo, cardMat);
  jitter(m, i);
  return m;
}

// 掌握堆顶部的红色对勾（两片薄盒子拼成）
const check = new THREE.Group();
{
  const a = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.16), redMat);
  a.position.set(-0.28, 0, 0.1); a.rotation.y = 0.7;
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.16), redMat);
  b.position.set(0.22, 0, -0.12); b.rotation.y = -0.75;
  check.add(a, b);
  check.visible = false;
  scene.add(check);
}
function updateCheck() {
  const n = mastered.meshes.length;
  check.visible = n > 0;
  if (n > 0) {
    const top = mastered.group.localToWorld(new THREE.Vector3(0, n * CARD_T + 0.09, 0));
    check.position.copy(top);
  }
}

// ---------- 迷你 tween ----------
const tweens = [];
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOutBack = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function tween(dur, onUpdate, onDone, ease = easeInOut) {
  tweens.push({ t: 0, dur, onUpdate, onDone, ease });
}

// ---------- 主循环（常驻：纸堆待机微动 + tween 驱动） ----------
let labelFn = null;
const tmpV = new THREE.Vector3();
function project(world) {
  tmpV.copy(world).project(camera);
  return { x: (tmpV.x * 0.5 + 0.5) * innerWidth, y: (-tmpV.y * 0.5 + 0.5) * innerHeight };
}
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const t = now / 1000;
  // 相机待机微动
  camera.position.x = CAM_BASE.x + Math.sin(t * 0.22) * 0.16;
  camera.position.y = CAM_BASE.y + Math.sin(t * 0.31) * 0.08;
  camera.lookAt(LOOK);
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(tw.t / tw.dur, 1);
    tw.onUpdate(tw.ease(k));
    if (k >= 1) { tweens.splice(i, 1); tw.onDone && tw.onDone(); }
  }
  renderer.render(scene, camera);
  if (labelFn && review && mastered) {
    labelFn(
      project(review.group.localToWorld(new THREE.Vector3(0, review.meshes.length * CARD_T + 0.35, 0))),
      project(mastered.group.localToWorld(new THREE.Vector3(0, mastered.meshes.length * CARD_T + 0.35, 0))),
    );
  }
}

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  const a = camera.aspect;
  spread = a < 0.75 ? 2.0 : a < 1.1 ? 2.7 : 3.3;
  if (review) review.group.position.x = -spread;
  if (mastered) mastered.group.position.x = spread;
  if (a < 0.75) { CAM_BASE.set(0, 5.4, 12.4); } else { CAM_BASE.set(0, 4.7, 8.8); }
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

// ---------- 对外 ----------
export function setLabelTracker(fn) { labelFn = fn; }

export function initStacks(n) {
  review = makeStack(-spread);
  mastered = makeStack(spread);
  for (let i = 0; i < n; i++) {
    const m = makeCard(i);
    review.group.add(m);
    review.meshes.push(m);
  }
  updateCheck();
  resize();
  requestAnimationFrame(loop);
}

export function resetStacks(n) {
  for (const s of [review, mastered]) {
    for (const m of s.meshes) s.group.remove(m);
    s.meshes.length = 0;
  }
  for (let i = 0; i < n; i++) {
    const m = makeCard(i);
    review.group.add(m);
    review.meshes.push(m);
  }
  updateCheck();
}

// 堆顶世界坐标 → 屏幕像素（DOM 卡片飞行动画的落点）
export function stackTopScreen(which) {
  const s = which === 'mastered' ? mastered : review;
  return project(s.group.localToWorld(new THREE.Vector3(0, s.meshes.length * CARD_T + 0.4, 0)));
}

// 顶部纸卡沿弧线飞入掌握堆
export function transferToMastered() {
  return new Promise((resolve) => {
    const mesh = review.meshes.pop();
    if (!mesh) { resolve(); return; }
    scene.attach(mesh);
    const from = mesh.position.clone();
    const fromRot = mesh.rotation.y;
    const toWorld = mastered.group.localToWorld(new THREE.Vector3(0, mastered.meshes.length * CARD_T + 0.035, 0));
    const toRot = (Math.sin(mastered.meshes.length * 12.9898) * 43758.5453 % 1) * 0.1;
    tween(0.72, (k) => {
      mesh.position.lerpVectors(from, toWorld, k);
      mesh.position.y += Math.sin(k * Math.PI) * 1.7; // 弧线
      mesh.rotation.y = fromRot + (toRot - fromRot) * k;
    }, () => {
      mastered.group.add(mesh);
      mesh.position.set(0, mastered.meshes.length * CARD_T + 0.035, 0);
      mesh.rotation.set(0, toRot, 0);
      mastered.meshes.push(mesh);
      updateCheck();
      // 落定弹一下
      const y0 = mesh.position.y;
      tween(0.32, (k2) => { mesh.position.y = y0 - Math.sin(k2 * Math.PI) * 0.09; }, null, easeOutBack);
      resolve();
    });
  });
}

// 待复习堆顶部"收回"弹动
export function receiveReview() {
  return new Promise((resolve) => {
    const top = review.meshes[review.meshes.length - 1];
    if (!top) { resolve(); return; }
    const y0 = top.position.y, r0 = top.rotation.y;
    tween(0.55, (k) => {
      const s = Math.sin(k * Math.PI);
      top.position.y = y0 + s * 0.42;
      top.rotation.y = r0 + Math.sin(k * Math.PI * 2) * 0.06;
    }, resolve, easeOutBack);
  });
}
