/* solar-storm-3d · src/main.js
 * 行为层：JS 门控 → 加载态 → Three.js 喷发恒星（噪声火球 shader + 粒子射流 + 磁弧 + 日冕）
 * 滑杆（喷发强度）+ 点击/按钮触发耀斑 → 全部经指数平滑过渡
 * 手法借鉴：天文可视化站的"太阳风暴"（翻滚火球 + 径向射流 + 日冕辉光）。代码全部原创实现。
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
scene.background = new THREE.Color(0x050505);
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.6, 7.2);
camera.lookAt(0, 0, 0);

const sunGroup = new THREE.Group();
scene.add(sunGroup);

/* ---------- 3. 火球：fbm 噪声表面 shader ---------- */
const sunUniforms = {
  uTime: { value: 0 },
  uFlare: { value: 0 },
};
const sunMat = new THREE.ShaderMaterial({
  uniforms: sunUniforms,
  vertexShader: /* glsl */`
    varying vec3 vN;
    varying vec3 vP;
    void main() {
      vN = normalize(normalMatrix * normal);
      vP = position;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform float uTime;
    uniform float uFlare;
    varying vec3 vN;
    varying vec3 vP;
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    float noise(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                     mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                     mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }
    float fbm(vec3 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.1;
        a *= 0.5;
      }
      return v;
    }
    void main() {
      float n = fbm(normalize(vP) * 2.4 + vec3(uTime * 0.12, uTime * 0.07, -uTime * 0.05));
      float n2 = fbm(normalize(vP) * 5.0 - vec3(uTime * 0.09));
      float m = clamp(n * 0.75 + n2 * 0.45, 0.0, 1.0);
      vec3 deep = vec3(0.55, 0.08, 0.01);
      vec3 ember = vec3(0.98, 0.45, 0.08);
      vec3 gold = vec3(0.99, 0.75, 0.14);
      vec3 col = mix(deep, ember, smoothstep(0.15, 0.55, m));
      col = mix(col, gold, smoothstep(0.6, 0.95, m) * 0.8);
      col *= 1.0 + uFlare * 0.7;
      // 边缘一圈金色辉光
      float rim = pow(1.0 - abs(dot(normalize(vN), vec3(0.0, 0.0, 1.0))), 2.5);
      col += vec3(1.0, 0.6, 0.15) * rim * 0.55;
      gl_FragColor = vec4(col, 1.0);
    }`,
});
const sun = new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 64), sunMat);
sunGroup.add(sun);

/* ---------- 4. 日冕：径向渐变精灵 ---------- */
function coronaTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(251,146,60,0.5)');
  grad.addColorStop(0.35, 'rgba(249,115,22,0.22)');
  grad.addColorStop(1, 'rgba(249,115,22,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const corona = new THREE.Sprite(new THREE.SpriteMaterial({
  map: coronaTexture(), transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending, opacity: 0.85,
}));
corona.scale.set(9, 9, 1);
sunGroup.add(corona);

/* ---------- 5. 磁弧：三条细圆弧，缓慢转动 ---------- */
const arcs = [];
[[2.3, 0.9, 0.02, 0xf97316, 0.4], [2.7, 1.9, 0.015, 0xfbbf24, -0.3], [3.1, 2.6, 0.012, 0xf97316, 0.25]].forEach(([r, tilt, tube, color, speed]) => {
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(r, tube, 8, 80, Math.PI * 0.85),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  arc.rotation.set(tilt, 0.6, 0.3);
  arc.userData.speed = speed;
  sunGroup.add(arc);
  arcs.push(arc);
});

/* ---------- 6. 粒子射流：从球面径向抛洒，循环再生 ---------- */
const JETS = 2200;
const jPos = new Float32Array(JETS * 3);
const jDir = new Float32Array(JETS * 3);
const jLife = new Float32Array(JETS);      // 0..1
const jSpeed = new Float32Array(JETS);
const jSize = new Float32Array(JETS);
function respawn(i, randomLife) {
  // 球面均匀随机方向
  const u = Math.random() * 2 - 1;
  const th = Math.random() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  jDir[i * 3] = s * Math.cos(th);
  jDir[i * 3 + 1] = u;
  jDir[i * 3 + 2] = s * Math.sin(th);
  jSpeed[i] = 0.9 + Math.random() * 1.6;
  jSize[i] = 0.5 + Math.random() * 1.6;
  jLife[i] = randomLife ? Math.random() : 0;
}
for (let i = 0; i < JETS; i++) respawn(i, true);
const jetGeo = new THREE.BufferGeometry();
jetGeo.setAttribute('position', new THREE.BufferAttribute(jPos, 3));
jetGeo.setAttribute('aLife', new THREE.BufferAttribute(jLife, 1));
jetGeo.setAttribute('aSize', new THREE.BufferAttribute(jSize, 1));
const jetUniforms = { uPixelRatio: { value: renderer.getPixelRatio() } };
const jetMat = new THREE.ShaderMaterial({
  uniforms: jetUniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    attribute float aLife;
    attribute float aSize;
    uniform float uPixelRatio;
    varying float vLife;
    void main() {
      vLife = aLife;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uPixelRatio * (1.0 - aLife * 0.6) * (160.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    varying float vLife;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c);
      float a = smoothstep(0.5, 0.05, d) * (1.0 - vLife) * 0.9;
      if (a < 0.01) discard;
      vec3 col = mix(vec3(0.99, 0.75, 0.14), vec3(0.98, 0.45, 0.08), vLife);
      gl_FragColor = vec4(col, a);
    }`,
});
const jets = new THREE.Points(jetGeo, jetMat);
sunGroup.add(jets);

/* ---------- 7. 交互：拖拽旋转 + 喷发强度 + 耀斑 ---------- */
const tgt = { rate: 1.0 };
const cur = { rate: 1.0 };
let flare = 0;
let velX = 0, velY = 0;
let dragging = false;
let lastX = 0, lastY = 0;
let downX = 0, downY = 0;

function triggerFlare() { flare = 1; }
$('#flareBtn').addEventListener('click', triggerFlare);
if (!reduced) {
  container.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    downX = e.clientX; downY = e.clientY;
    container.setPointerCapture(e.pointerId);
  });
  container.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    velY = (e.clientX - lastX) * 0.005;
    velX = (e.clientY - lastY) * 0.005;
    lastX = e.clientX; lastY = e.clientY;
  });
  const endDrag = (e) => {
    if (dragging && Math.hypot(e.clientX - downX, e.clientY - downY) < 6) triggerFlare();
    dragging = false;
  };
  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', () => { dragging = false; });
}
const rateInput = $('#rate');
const rateVal = $('#rateVal');
rateInput.addEventListener('input', () => {
  tgt.rate = rateInput.value / 100;
  rateVal.textContent = tgt.rate.toFixed(1) + '×';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  jetUniforms.uPixelRatio.value = renderer.getPixelRatio();
});

/* ---------- 8. 渲染循环 ---------- */
const ease = (c, t, k, dt) => c + (t - c) * (1 - Math.exp(-dt * k));
let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  cur.rate = ease(cur.rate, tgt.rate, 4, dt);
  flare *= Math.exp(-dt * 1.1);
  sunUniforms.uFlare.value = flare;
  sunUniforms.uTime.value += dt;

  if (!reduced) {
    // 射流：寿命推进，位置 = 方向 × (半径 + 射程 × 寿命)，带一点切向漂移
    const rate = cur.rate * (1 + flare * 2.2);
    for (let i = 0; i < JETS; i++) {
      jLife[i] += dt * 0.32 * rate * jSpeed[i];
      if (jLife[i] >= 1) respawn(i, false);
      const r = 1.5 + jLife[i] * 2.3;
      const drift = jLife[i] * 0.5;
      jPos[i * 3] = jDir[i * 3] * r - jDir[i * 3 + 2] * drift * 0.4;
      jPos[i * 3 + 1] = jDir[i * 3 + 1] * r;
      jPos[i * 3 + 2] = jDir[i * 3 + 2] * r + jDir[i * 3] * drift * 0.4;
    }
    jetGeo.attributes.position.needsUpdate = true;
    jetGeo.attributes.aLife.needsUpdate = true;
    // 拖拽惯性 + 待机自转
    sunGroup.rotation.y += velY + dt * 0.05;
    sunGroup.rotation.x += velX;
    velX *= Math.exp(-dt * 3.2);
    velY *= Math.exp(-dt * 3.2);
    arcs.forEach((a) => { a.rotation.z += dt * a.userData.speed * 0.4; });
  }
  corona.material.opacity = 0.7 + 0.25 * flare + 0.08 * Math.sin(now * 0.0006);
  const cs = 9 + flare * 1.6;
  corona.scale.set(cs, cs, 1);

  renderer.render(scene, camera);
  if (!firstFrameAt) { firstFrameAt = now; setTimeout(markReady, 450); }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
