/* liquid-chrome-3d · src/main.js
 * 行为层：JS 门控 → 加载态 → Three.js 液态金属球（顶点噪声流动 + 环境反射 + 拖拽惯性）
 * 滑杆（流动强度）+ 表面预设（镜面/磨砂，只调粗糙度）→ 全部经指数平滑过渡
 * 手法借鉴：产品渲染站的"液态金属 hero"（镜面球 + 条纹环境光 + 缓慢形变）。代码全部原创实现。
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

/* ---------- 2. 场景 ---------- */
const container = $('#scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b0e);
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.4, 6.4);

/* ---------- 3. 环境光：画布手绘的条纹环境 ---------- */
function envTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const v = g.createLinearGradient(0, 0, 0, 512);
  v.addColorStop(0, '#0a0a0c');
  v.addColorStop(0.42, '#1c1c22');
  v.addColorStop(0.5, '#f4f4f5');   // 一道亮带：铬面的主反光
  v.addColorStop(0.58, '#3f3f46');
  v.addColorStop(1, '#050506');
  g.fillStyle = v;
  g.fillRect(0, 0, 1024, 512);
  // 一道暖色条纹：反射里的一点温度
  const warm = g.createLinearGradient(0, 0, 1024, 0);
  warm.addColorStop(0, 'rgba(245,158,11,0)');
  warm.addColorStop(0.5, 'rgba(245,158,11,0.55)');
  warm.addColorStop(1, 'rgba(245,158,11,0)');
  g.fillStyle = warm;
  g.fillRect(0, 210, 1024, 46);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
scene.environment = envTexture();

/* ---------- 4. 液态金属球：顶点噪声位移（Ashima simplex 3D） ---------- */
const SNOISE = /* glsl */`
vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

const uniforms = {
  uTime: { value: 0 },
  uMorph: { value: 1 },
};
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 1.0,
  roughness: 0.08,
  envMapIntensity: 1.25,
});
material.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = uniforms.uTime;
  shader.uniforms.uMorph = uniforms.uMorph;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uMorph;\n' + SNOISE)
    .replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>
     float ln = snoise(normal * 1.6 + vec3(uTime * 0.22));
     float ln2 = snoise(normal * 3.4 - vec3(uTime * 0.15)) * 0.35;
     transformed += normal * (ln + ln2) * 0.14 * uMorph;`,
  );
};
const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 5), material);
scene.add(blob);

// 底部一道微光：把球"放"在空间里
const floorGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(7, 7),
  new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false }),
);
floorGlow.rotation.x = -Math.PI / 2;
floorGlow.position.y = -2.4;
scene.add(floorGlow);

/* ---------- 5. 交互：拖拽惯性 + 滚动形变 + 滑杆 + 表面 ---------- */
const tgt = { flow: 1.0, rough: 0.08 };
const cur = { flow: 1.0, rough: 0.08 };
let morphBoost = 0;
let velX = 0, velY = 0;       // 拖拽角速度
let dragging = false;
let lastX = 0, lastY = 0;

if (!reduced) {
  container.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    container.setPointerCapture(e.pointerId);
  });
  container.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    velY = (e.clientX - lastX) * 0.005;
    velX = (e.clientY - lastY) * 0.005;
    lastX = e.clientX; lastY = e.clientY;
  });
  const endDrag = () => { dragging = false; };
  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', endDrag);
  window.addEventListener('wheel', (e) => {
    morphBoost = Math.min(morphBoost + Math.abs(e.deltaY) * 0.0009, 1.6);
  }, { passive: true });
}
const flowInput = $('#flow');
const flowVal = $('#flowVal');
flowInput.addEventListener('input', () => {
  tgt.flow = flowInput.value / 100;
  flowVal.textContent = tgt.flow.toFixed(1) + '×';
});
document.querySelectorAll('.preset').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.preset').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    tgt.rough = b.dataset.finish === 'brushed' ? 0.38 : 0.08;
  });
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- 6. 渲染循环 ---------- */
const ease = (c, t, k, dt) => c + (t - c) * (1 - Math.exp(-dt * k));
let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  cur.flow = ease(cur.flow, tgt.flow, 4, dt);
  cur.rough = ease(cur.rough, tgt.rough, 3, dt);
  material.roughness = cur.rough;
  morphBoost *= Math.exp(-dt * 0.8);

  if (!reduced) {
    uniforms.uTime.value += dt * (0.6 + cur.flow);
    uniforms.uMorph.value = cur.flow * (1 + morphBoost);
    // 拖拽惯性 + 待机自转
    blob.rotation.y += velY + dt * 0.12;
    blob.rotation.x += velX + dt * 0.03;
    velX *= Math.exp(-dt * 3.2);
    velY *= Math.exp(-dt * 3.2);
  } else {
    uniforms.uTime.value += dt * 0.1;
    uniforms.uMorph.value = cur.flow;
  }
  floorGlow.material.opacity = 0.04 + 0.02 * Math.sin(now * 0.0005);

  renderer.render(scene, camera);
  if (!firstFrameAt) { firstFrameAt = now; setTimeout(markReady, 450); }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
