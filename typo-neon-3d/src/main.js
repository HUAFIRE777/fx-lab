/* typo-neon-3d · src/main.js
 * 行为层：JS 门控 → 加载态 → 滚动导演剪辑引擎 → Three.js 点缀层（粒子流 + 线框 TorusKnot）
 * 原创实现。排印是主角，3D 只做点缀：低透明、慢速、可节流。
 */
import * as THREE from 'three';

document.documentElement.classList.add('js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

/* ---------- 1. 加载态：保证完成态可达 ---------- */
let readyDone = false;
function markReady() {
  if (readyDone) return;
  readyDone = true;
  document.documentElement.classList.add('done');
}
window.addEventListener('load', () => setTimeout(markReady, 450));
setTimeout(markReady, 3200); // 兜底：load 迟迟不来也必须进完成态

/* ---------- 2. 滚动引擎：进度细线 + 章节逐行切入 ---------- */
const progressEl = $('#progress');
const chapters = $$('.chapter');
let ticking = false;

function onScroll() {
  const vh = window.innerHeight;
  const y = window.scrollY || window.pageYOffset;
  const max = document.documentElement.scrollHeight - vh;
  progressEl.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';

  for (const ch of chapters) {
    const top = ch.offsetTop;
    const h = ch.offsetHeight;
    // pin 区间内的阅读进度：进入半屏开始，离场前播完
    const p = Math.min(1, Math.max(0, (y - top + vh * 0.4) / (h - vh * 0.8)));
    const lines = ch.querySelectorAll('.ln');
    lines.forEach((ln, i) => {
      ln.classList.toggle('on', p >= 0.1 + i * 0.15);
    });
  }
}
window.addEventListener('scroll', () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }
}, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

/* ---------- 3. Three.js 点缀层 ---------- */
(function initGL() {
  const mount = $('#bg');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) {
    return; // WebGL 不可用：静态排印页照常可看
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  const rig = new THREE.Group(); // 视差总控
  scene.add(rig);

  // 3a. 缓慢旋转的线框 TorusKnot：霓虹色，透明度 0.15，偏右构图不抢字
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.7, 0.42, 140, 18),
    new THREE.MeshBasicMaterial({ color: 0xd2ff00, wireframe: true, transparent: true, opacity: 0.15 })
  );
  knot.position.set(3.1, 0.5, -1.5);
  rig.add(knot);

  // 3b. 很淡的粒子流：1800 点（≤3000 上限），缓慢上浮
  const COUNT = 1800;
  const pos = new Float32Array(COUNT * 3);
  const spd = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 26;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    spd[i] = 0.12 + Math.random() * 0.35;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xd2ff00, size: 0.035, transparent: true, opacity: 0.5,
      sizeAttenuation: true, depthWrite: false
    })
  );
  rig.add(points);

  // 3c. 鼠标视差（触屏跳过）
  let tx = 0, ty = 0, cx = 0, cy = 0;
  if (!coarsePointer) {
    window.addEventListener('pointermove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    // 慢速自转：点缀感，不抢戏
    knot.rotation.x += dt * 0.07;
    knot.rotation.y += dt * 0.11;
    // 粒子上浮循环
    const arr = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += spd[i] * dt;
      if (arr[i * 3 + 1] > 7.5) arr[i * 3 + 1] = -7.5;
    }
    geo.attributes.position.needsUpdate = true;
    // 视差：lerp 跟随，物理感阻尼
    cx += (tx - cx) * 0.045;
    cy += (ty - cy) * 0.045;
    rig.rotation.y = cx * 0.22;
    rig.rotation.x = -cy * 0.14;
    camera.position.x = cx * 0.35;
    camera.position.y = -cy * 0.25;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  if (reduced) {
    frame(); // 只渲染一帧静态底
    return;
  }
  renderer.setAnimationLoop(() => {
    if (document.hidden) return; // 切后台节流
    frame();
  });
})();
