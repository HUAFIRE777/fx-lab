/* nebula-drift-3d · src/main.js
 * 行为层：JS 门控 → 加载态 → Three.js 粒子星云（双旋臂 × 9000 星尘 / 视差镜头 / 滚动加速穿越）
 * 滑杆（漂流速度）+ 色温预设（紫雾/冰蓝，只调配色混合）→ 全部经指数平滑过渡
 * 手法借鉴：天文可视化站的"旋臂星云"构图（双旋臂 + 中心辉光 + 星尘闪烁）。代码全部原创实现。
 */
import * as THREE from 'three';

document.documentElement.classList.add('js');

const $ = (s) => document.querySelector(s);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. 加载态：保证完成态可达 ---------- */
let readyDone = false;
function markReady() {
  if (readyDone) return;
  readyDone = true;
  document.documentElement.classList.add('done');
}
let firstFrameAt = 0;
window.addEventListener('load', () => setTimeout(markReady, 450));
setTimeout(markReady, 3200); // 兜底
setTimeout(markReady, 5000); // 双兜底

/* ---------- 2. 确定性随机（同一份代码每次生成同一片星云） ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261105);

/* ---------- 3. 场景 ---------- */
const container = $('#scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 2.4, 16);

/* ---------- 4. 星尘：双旋臂 + 中心晕 ---------- */
const COUNT = 9000;
const pos = new Float32Array(COUNT * 3);
const size = new Float32Array(COUNT);
const phase = new Float32Array(COUNT);
const tint = new Float32Array(COUNT);
for (let i = 0; i < COUNT; i++) {
  const arm = (i % 2) * Math.PI;              // 两条旋臂
  const r = Math.pow(rand(), 0.62) * 14;      // 半径：内密外疏
  const spread = (1 - r / 16) * 1.6 + 0.25;
  const a = arm + r * 0.42 + (rand() - 0.5) * 0.55;
  pos[i * 3] = Math.cos(a) * r + (rand() - 0.5) * spread;
  pos[i * 3 + 1] = (rand() - 0.5) * spread * (1 - r / 18) * 1.4;
  pos[i * 3 + 2] = Math.sin(a) * r + (rand() - 0.5) * spread;
  size[i] = 0.5 + Math.pow(rand(), 3) * 2.6;  // 少数亮星，多数暗尘
  phase[i] = rand() * Math.PI * 2;
  tint[i] = rand();
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
geo.setAttribute('aTint', new THREE.BufferAttribute(tint, 1));

const uniforms = {
  uTime: { value: 0 },
  uHue: { value: 0 },          // 0 紫雾 / 1 冰蓝
  uPixelRatio: { value: renderer.getPixelRatio() },
  uViolet: { value: new THREE.Color(0x8b5cf6) },
  uIce: { value: new THREE.Color(0x67e8f9) },
};
const mat = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    attribute float aSize;
    attribute float aPhase;
    attribute float aTint;
    uniform float uTime;
    uniform float uPixelRatio;
    varying float vTw;
    varying float vTint;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float tw = 0.72 + 0.28 * sin(uTime * (0.6 + fract(aPhase)) + aPhase);
      vTw = tw;
      vTint = aTint;
      gl_PointSize = aSize * uPixelRatio * tw * (300.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uViolet;
    uniform vec3 uIce;
    uniform float uHue;
    varying float vTw;
    varying float vTint;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c);
      float a = smoothstep(0.5, 0.05, d) * vTw;
      if (a < 0.01) discard;
      vec3 base = mix(uViolet, uIce, clamp(vTint + uHue * 0.6 - 0.3, 0.0, 1.0));
      gl_FragColor = vec4(base, a);
    }`,
});
const nebula = new THREE.Points(geo, mat);
nebula.rotation.x = 0.12;
scene.add(nebula);

/* 中心辉光：一张径向渐变精灵，叠在星云中心 */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(196,181,253,0.55)');
  grad.addColorStop(0.4, 'rgba(139,92,246,0.18)');
  grad.addColorStop(1, 'rgba(139,92,246,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTexture(), transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending, opacity: 0.9,
}));
glow.scale.set(11, 11, 1);
scene.add(glow);

/* ---------- 5. 交互：视差 + 滚动加速 + 滑杆 + 预设 ---------- */
const tgt = { s: 1.0, hue: 0 };   // 目标值
const cur = { s: 1.0, hue: 0 };   // 平滑后的当前值
const mouse = { x: 0, y: 0 };
let boost = 0;                    // 滚动加速量

if (!reduced) {
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  window.addEventListener('wheel', (e) => {
    boost = Math.min(boost + Math.abs(e.deltaY) * 0.0006, 2.2);
  }, { passive: true });
}
const speedInput = $('#speed');
const speedVal = $('#speedVal');
speedInput.addEventListener('input', () => {
  tgt.s = speedInput.value / 100;
  speedVal.textContent = tgt.s.toFixed(1) + '×';
});
document.querySelectorAll('.preset').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.preset').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    tgt.hue = b.dataset.hue === 'ice' ? 1 : 0;
  });
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.uPixelRatio.value = renderer.getPixelRatio();
});

/* ---------- 6. 渲染循环 ---------- */
const ease = (c, t, k, dt) => c + (t - c) * (1 - Math.exp(-dt * k));
let last = performance.now();
let fov = 55;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  cur.s = ease(cur.s, tgt.s, 4, dt);
  cur.hue = ease(cur.hue, tgt.hue, 2.2, dt);
  uniforms.uHue.value = cur.hue;
  boost *= Math.exp(-dt * 0.9);

  if (!reduced) {
    const speed = cur.s * (1 + boost);
    nebula.rotation.y += dt * 0.045 * speed;
    uniforms.uTime.value += dt * speed;
    // 视差：镜头轻轻跟鼠标走
    const tx = mouse.x * 1.6;
    const ty = 2.4 - mouse.y * 0.9;
    camera.position.x = ease(camera.position.x, tx, 2, dt);
    camera.position.y = ease(camera.position.y, ty, 2, dt);
    camera.lookAt(0, 0.4, 0);
    // 穿越加速时 FOV 拉伸
    const targetFov = 55 + boost * 9;
    if (Math.abs(targetFov - fov) > 0.01) {
      fov = ease(fov, targetFov, 3, dt);
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  } else {
    uniforms.uTime.value += dt * 0.2;
  }
  glow.material.opacity = 0.75 + 0.15 * Math.sin(now * 0.0004);

  renderer.render(scene, camera);
  if (!firstFrameAt) { firstFrameAt = now; setTimeout(markReady, 450); }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
