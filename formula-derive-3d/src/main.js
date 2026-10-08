// huafire3d fx-lab — original implementation · formula-derive-3d
// 公式四步 stagger 展开 + 每步 3D 辅助图形同步生长；上一步/下一步/空格/指示点。
import * as THREE from 'three';
import { STEPS } from './config.js';
import { BUILDERS } from './helpers3d.js';

document.body.classList.add('js');

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof window.gsap !== 'undefined';

// ---------- 步骤 DOM ----------
const stepsEl = $('steps'), dotsEl = $('dots');
STEPS.forEach((s, i) => {
  const sec = document.createElement('section');
  sec.className = 'step' + (i === 0 ? ' active' : ' dim');
  sec.innerHTML = `
    <div class="num">${s.numeral}</div>
    <div class="tag">${s.tag}</div>
    <div class="fx">${s.fx}</div>
    <div class="note">${s.note}</div>`;
  stepsEl.appendChild(sec);

  const dot = document.createElement('button');
  dot.className = 'dot' + (i === 0 ? ' on' : '');
  dot.setAttribute('aria-label', `第${s.numeral}步`);
  dot.addEventListener('click', () => goStep(i));
  dotsEl.appendChild(dot);
});
const stepEls = [...stepsEl.children];
const dotEls = [...dotsEl.children];

// ---------- 3D ----------
const holder = $('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (e) {
  holder.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#999;font-size:13px;">此设备不支持 WebGL，公式推导不受影响</div>';
}
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
let camDist = 9.2;
const camDir = new THREE.Vector3(4.6, 3.4, 7.0).normalize();
function placeCamera() {
  camera.position.copy(camDir).multiplyScalar(camDist);
  camera.lookAt(0, 1.45, 0);
}
placeCamera();

scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc9b8, 1.05));
const key = new THREE.DirectionalLight(0xffffff, 2.0);
key.position.set(4, 6, 5);
scene.add(key);
const fill = new THREE.DirectionalLight(0xfff2ec, 0.5);
fill.position.set(-5, 2, -3);
scene.add(fill);

const spin = new THREE.Group(); // 慢速自转
const tilt = new THREE.Group(); // 用户拖拽
spin.add(tilt);
scene.add(spin);

const built = BUILDERS.map((b) => b());
built.forEach((s, i) => {
  s.group.visible = i === 0;
  tilt.add(s.group);
});

function sizeRenderer() {
  const w = holder.clientWidth || 560, h = holder.clientHeight || 560;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
if (renderer) {
  holder.appendChild(renderer.domElement);
  sizeRenderer();
  addEventListener('resize', sizeRenderer);
}

// 用户拖拽旋转 + 滚轮缩放（手写，不引入 OrbitControls）
let dragging = false, px = 0, py = 0;
holder.addEventListener('pointerdown', (e) => { dragging = true; px = e.clientX; py = e.clientY; holder.setPointerCapture(e.pointerId); });
holder.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  tilt.rotation.y += (e.clientX - px) * 0.006;
  tilt.rotation.x = Math.max(-0.15, Math.min(0.55, tilt.rotation.x + (e.clientY - py) * 0.004));
  px = e.clientX; py = e.clientY;
});
holder.addEventListener('pointerup', () => { dragging = false; });
holder.addEventListener('wheel', (e) => {
  e.preventDefault();
  camDist = Math.max(6.5, Math.min(14, camDist * (1 + e.deltaY * 0.001)));
  placeCamera();
}, { passive: false });

const clock = new THREE.Clock();
let firstFrame = true;
(function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!reducedMotion && !dragging) spin.rotation.y += dt * 0.22;
  renderer.render(scene, camera);
  if (firstFrame) { firstFrame = false; $('glcard').classList.add('ready'); }
})();

// ---------- 步骤切换 ----------
let cur = 0;
const prevBtn = $('prevBtn'), nextBtn = $('nextBtn');
const countEl = $('count'), barFill = $('barFill');

function goStep(i) {
  i = Math.max(0, Math.min(STEPS.length - 1, i));
  if (i === cur && built[i].group.visible) return;
  const prev = cur;
  cur = i;

  stepEls.forEach((el, j) => {
    el.classList.toggle('active', j === i);
    el.classList.toggle('dim', j !== i);
  });
  dotEls.forEach((d, j) => d.classList.toggle('on', j === i));

  if (hasGsap && !reducedMotion) {
    const el = stepEls[i];
    gsap.fromTo(el, { y: 26 }, { y: 0, duration: 0.65, ease: 'power3.out', clearProps: 'transform' });
  }

  // 3D 图形切换：旧的下沉收起，新的生长淡入
  const oldG = built[prev].group, newG = built[i].group;
  if (oldG !== newG) {
    if (hasGsap && !reducedMotion) {
      gsap.to(oldG.position, { y: -0.55, duration: 0.4, ease: 'power2.in' });
      gsap.to(oldG.scale, {
        x: 0.92, y: 0.92, z: 0.92, duration: 0.4, ease: 'power2.in',
        onComplete() {
          oldG.visible = false;
          oldG.position.y = 0; oldG.scale.setScalar(1);
        },
      });
      newG.visible = true;
      newG.position.y = 0.35;
      gsap.to(newG.position, { y: 0, duration: 0.5, delay: 0.18, ease: 'power3.out' });
      setTimeout(() => built[i].intro(), 180);
    } else {
      oldG.visible = false;
      newG.visible = true;
      built[i].intro();
    }
  }

  // 图注 / 指示器 / 按钮
  $('figNo').textContent = STEPS[i].figNo;
  $('figTitle').textContent = STEPS[i].figTitle;
  $('figDesc').textContent = STEPS[i].figDesc;
  countEl.textContent = `${i + 1} / ${STEPS.length}`;
  barFill.style.transform = `scaleX(${(i + 1) / STEPS.length})`;
  prevBtn.disabled = i === 0;
  nextBtn.innerHTML = i === STEPS.length - 1 ? '回到开头' : '下一步 →';
}

prevBtn.addEventListener('click', () => goStep(cur - 1));
nextBtn.addEventListener('click', () => {
  if (cur === STEPS.length - 1) goStep(0);
  else goStep(cur + 1);
});
addEventListener('keydown', (e) => {
  const t = e.target;
  if (t instanceof Element && t.matches('input, textarea')) return;
  if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); nextBtn.click(); }
  else if (e.code === 'ArrowLeft') { prevBtn.click(); }
});

// 首步入场
built[0].intro();

// ---------- 启动 ----------
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded')));
