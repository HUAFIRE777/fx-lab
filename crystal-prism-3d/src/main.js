/* crystal-prism-3d · src/main.js
 * 行为层：JS 门控 → 加载态 → Three.js 三角棱镜（菲涅尔辉光 shader + 光束 + 窄光谱扇 + 地面光斑）
 * 滑杆（光束角度）+ 色温预设（白光/暖光，只调光束颜色）→ 全部经指数平滑过渡
 * 手法借鉴：光学演示站的"棱镜色散"（入射光束 + 出射光谱扇 + 地面光斑）。代码全部原创实现。
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
scene.background = new THREE.Color(0x0a0a12);
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.7, 7.6);
camera.lookAt(0, 0, 0);

/* ---------- 3. 棱镜：三角柱 + 菲涅尔辉光 ---------- */
const prismGeo = new THREE.CylinderGeometry(1.15, 1.15, 2.6, 3, 1);
prismGeo.rotateX(Math.PI / 2);   // 轴线沿 Z，三角截面朝向镜头
prismGeo.rotateZ(Math.PI / 6);   // 一个顶点朝上
const prismUniforms = { uTime: { value: 0 } };
const prismMat = new THREE.ShaderMaterial({
  uniforms: prismUniforms,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  vertexShader: /* glsl */`
    varying vec3 vN;
    varying vec3 vV;
    void main() {
      vN = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform float uTime;
    varying vec3 vN;
    varying vec3 vV;
    void main() {
      float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
      // 边缘随视角缓慢变色：紫 ↔ 冰蓝之间
      float hue = sin(vN.x * 3.0 + uTime * 0.25) * 0.5 + 0.5;
      vec3 edge = mix(vec3(0.65, 0.61, 0.98), vec3(0.40, 0.90, 0.98), hue);
      vec3 col = mix(vec3(0.03, 0.03, 0.06), edge, fr * 0.9);
      col += vec3(0.10, 0.09, 0.16) * pow(fr, 3.0);
      gl_FragColor = vec4(col, 0.22 + fr * 0.68);
    }`,
});
const prism = new THREE.Mesh(prismGeo, prismMat);
scene.add(prism);

/* 棱镜内芯：一根细亮线，暗示光在里面走 */
const core = new THREE.Mesh(
  new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8),
  new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
);
core.rotation.x = Math.PI / 2;
prism.add(core);

/* ---------- 4. 光束与光谱扇 ---------- */
function beamTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.75, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0.95)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 64);
  // 上下柔化
  const v = g.createLinearGradient(0, 0, 0, 64);
  v.addColorStop(0, 'rgba(0,0,0,1)');
  v.addColorStop(0.5, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = v;
  g.fillRect(0, 0, 512, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const beamTex = beamTexture();
const beamGroup = new THREE.Group();
scene.add(beamGroup);

const beam = new THREE.Mesh(
  new THREE.PlaneGeometry(5.4, 0.34),
  new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
);
beam.position.set(-3.4, 0.1, 0);
beamGroup.add(beam);

/* 出射光谱扇：5 条细光带，角度微差，低透明度 */
const SPECTRUM = [0xef4444, 0xf59e0b, 0x84cc16, 0x22d3ee, 0x8b5cf6];
const fan = [];
SPECTRUM.forEach((color, i) => {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 0.07),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  m.position.set(2.9, 0.1, 0);
  m.rotation.z = -0.10 + i * 0.05;   // 扇形散开
  m.geometry.translate(2.3, 0, 0);  // 以棱镜出射点为轴心
  beamGroup.add(m);
  fan.push(m);
});

/* ---------- 5. 地面光斑 + 浮尘 ---------- */
function poolTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(248,250,252,0.5)');
  grad.addColorStop(0.45, 'rgba(167,139,250,0.16)');
  grad.addColorStop(1, 'rgba(167,139,250,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const pool = new THREE.Mesh(
  new THREE.PlaneGeometry(5.2, 2.4),
  new THREE.MeshBasicMaterial({ map: poolTexture(), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }),
);
pool.rotation.x = -Math.PI / 2;
pool.position.set(0.6, -1.9, 0);
scene.add(pool);

/* 浮尘：300 点，缓慢漂移 */
const DUST = 300;
const dPos = new Float32Array(DUST * 3);
for (let i = 0; i < DUST; i++) {
  dPos[i * 3] = (Math.random() - 0.5) * 12;
  dPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
  dPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  color: 0xa78bfa, size: 0.035, transparent: true, opacity: 0.55,
  blending: THREE.AdditiveBlending, depthWrite: false,
}));
scene.add(dust);

/* ---------- 6. 交互：拖拽旋转 + 光束角度 + 色温 ---------- */
const tgt = { angle: 0, temp: 0 };   // temp 0 白光 / 1 暖光
const cur = { angle: 0, temp: 0 };
let velZ = 0, velY = 0;
let dragging = false;
let lastX = 0, lastY = 0;
const beamColor = new THREE.Color(0xffffff);
const whiteColor = new THREE.Color(0xffffff);
const warmColor = new THREE.Color(0xffd9a0);

if (!reduced) {
  container.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    container.setPointerCapture(e.pointerId);
  });
  container.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    velZ = (e.clientX - lastX) * 0.006;
    velY = (e.clientY - lastY) * 0.002;
    lastX = e.clientX; lastY = e.clientY;
  });
  const endDrag = () => { dragging = false; };
  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', endDrag);
}
const angleInput = $('#angle');
const angleVal = $('#angleVal');
angleInput.addEventListener('input', () => {
  tgt.angle = Number(angleInput.value);
  angleVal.textContent = `${tgt.angle > 0 ? '+' : ''}${tgt.angle}°`;
});
document.querySelectorAll('.preset').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.preset').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    tgt.temp = b.dataset.temp === 'warm' ? 1 : 0;
  });
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- 7. 渲染循环 ---------- */
const ease = (c, t, k, dt) => c + (t - c) * (1 - Math.exp(-dt * k));
const easeColor = (c, t, k, dt) => c.lerp(t, 1 - Math.exp(-dt * k));
let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  cur.angle = ease(cur.angle, tgt.angle, 4, dt);
  cur.temp = ease(cur.temp, tgt.temp, 3, dt);
  prismUniforms.uTime.value += dt;

  beamGroup.rotation.z = THREE.MathUtils.degToRad(cur.angle);
  easeColor(beamColor, cur.temp > 0.5 ? warmColor : whiteColor, 3, dt);
  beam.material.color.copy(beamColor);

  if (!reduced) {
    prism.rotation.z += velZ + dt * 0.1;
    prism.rotation.y += velY + dt * 0.05;
    velZ *= Math.exp(-dt * 3.2);
    velY *= Math.exp(-dt * 3.2);
    dust.rotation.y += dt * 0.01;
  }
  // 地面光斑跟着棱镜转：左右轻移、明暗呼吸
  pool.position.x = 0.6 + Math.sin(prism.rotation.z) * 0.5;
  pool.material.opacity = 0.65 + 0.2 * Math.sin(now * 0.0006);

  renderer.render(scene, camera);
  if (!firstFrameAt) { firstFrameAt = now; setTimeout(markReady, 450); }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
