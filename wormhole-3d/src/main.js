/* wormhole-3d · src/main.js
 * 行为层：JS 门控 → 加载态 → 滚动驱动穿越引擎 → Three.js 虫洞隧道（shader 环 + 粒子流 + 出口白光）
 * 手法借鉴：Awwwards 发布会开场式"滚动驱动穿越速度"转场。代码全部原创实现。
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
window.addEventListener('load', () => setTimeout(markReady, 450));
setTimeout(markReady, 3200); // 兜底：load 迟迟不来也必须进完成态

/* ---------- 2. 滚动 → 穿越进度 ---------- */
const TRAVEL_LEN = 620;          // 全程穿越对应的世界单位
const tunnel = $('#tunnel');
const exitSec = $('#exit');
const progressEl = $('#progress');
const velNum = $('#velNum');
const pctNum = $('#pctNum');
const phaseEls = Array.from(document.querySelectorAll('#phase p'));
const speedlinesEl = $('#speedlines');
const flashEl = $('#flash');
const hero = document.querySelector('.hero');

let p = 0;            // 隧道穿越进度 0..1
let lastY = window.scrollY || 0;
let velRaw = 0;       // 每帧滚动像素（原始速度）
let speed = 0;        // 平滑后的速度 0..1（驱动 FOV/粒子/速度线）

function smooth01(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }

function onScroll() {
  const vh = window.innerHeight;
  const y = window.scrollY || window.pageYOffset;
  const max = document.documentElement.scrollHeight - vh;
  progressEl.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';

  const top = tunnel.offsetTop;
  const h = tunnel.offsetHeight;
  p = Math.min(1, Math.max(0, (y - top) / Math.max(1, h - vh)));
  pctNum.textContent = String(Math.round(p * 100));

  // 阶段文案
  const ph = p < 0.25 ? 0 : p < 0.55 ? 1 : p < 0.85 ? 2 : 3;
  phaseEls.forEach((el, i) => el.classList.toggle('on', i === ph));

  // 首屏内容随滚动淡出
  if (hero) {
    const k = Math.min(1, y / (vh * 0.85));
    hero.style.opacity = String(1 - k * 0.92);
    hero.style.visibility = k > 0.985 ? 'hidden' : 'visible';
  }

  // 出口白闪：隧道末段升起，进入发布区后褪去
  const exitTop = exitSec.offsetTop;
  const q = Math.min(1, Math.max(0, (y - (top + h - vh)) / vh));
  const flash = smooth01((p - 0.78) / 0.22) * (1 - q) * 0.96;
  flashEl.style.opacity = flash.toFixed(3);
}
let ticking = false;
function queueScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }
}
window.addEventListener('scroll', queueScroll, { passive: true });
window.addEventListener('resize', () => { onScroll(); sizeGL(); });
onScroll();

/* ---------- 3. 按住穿越（移动端代替滚动） ---------- */
const holdBtn = $('#holdBtn');
let holding = false;
let holdT = 0;
holdBtn.addEventListener('pointerdown', (e) => {
  holding = true; holdT = 0;
  holdBtn.classList.add('live');
  holdBtn.setPointerCapture(e.pointerId);
});
function endHold() { holding = false; holdBtn.classList.remove('live'); }
holdBtn.addEventListener('pointerup', endHold);
holdBtn.addEventListener('pointercancel', endHold);
holdBtn.addEventListener('lostpointercapture', endHold);

/* ---------- 4. 重新穿越：物理感缓动滚回顶部 ---------- */
$('#recross').addEventListener('click', () => {
  const y0 = window.scrollY || 0;
  const dur = 1900;
  const t0 = performance.now();
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function step(now) {
    const t = Math.min(1, (now - t0) / dur);
    window.scrollTo(0, y0 * (1 - easeInOutCubic(t)));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
});

/* ---------- 5. Three.js 虫洞隧道 ---------- */
const VIOLET = new THREE.Color('#9B6BFF');
const WHITE = new THREE.Color('#F5F3FF');
const VOID = new THREE.Color('#04060D');

let renderer = null, scene = null, camera = null;
let uTime = { value: 0 }, uTravel = { value: 0 }, uSpeed = { value: 0 }, uExit = { value: 0 };
let fovCur = 68;
const FOV_BASE = 68, FOV_MAX = 126;

function sizeGL() {
  if (!renderer || !camera) return;
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function initGL() {
  const mount = $('#bg');
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(VOID, 1);
  mount.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(FOV_BASE, window.innerWidth / window.innerHeight, 0.1, 600);
  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, -1);
  sizeGL();

  /* 5.1 隧道壁：shader 画环纹理（无大量几何体） */
  const tunnelGeo = new THREE.CylinderGeometry(14, 14, 240, 48, 1, true);
  tunnelGeo.rotateX(Math.PI / 2); // 轴线沿 Z
  const tunnelMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uTime, uTravel, uSpeed, uExit,
      uViolet: { value: VIOLET }, uWhite: { value: WHITE }, uVoid: { value: VOID }
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vZ;
      void main(){
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vZ = wp.z;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      varying float vZ;
      uniform float uTime, uTravel, uSpeed, uExit;
      uniform vec3 uViolet, uWhite, uVoid;
      void main(){
        float dist = -vZ;                       // 距相机距离（相机看向 -Z）
        float phase = (vZ + uTravel) * 0.9;     // 环随滚动向前涌来
        float ring = pow(0.5 + 0.5 * sin(phase * 6.2831853), 28.0);
        float pulse = 0.55 + 0.45 * sin(uTime * 2.1 + phase * 0.10); // 隧道环脉冲
        float near = exp(-dist * 0.016);        // 近亮远暗
        vec3 col = uViolet * ring * pulse * (0.35 + near * 1.1 + uSpeed * 0.9);
        // 纵向能量丝（绕圆周 24 条）
        float streak = pow(0.5 + 0.5 * sin(vUv.x * 150.796 + uTime * 0.5), 3.0);
        col += uViolet * streak * 0.035 * (0.4 + near);
        // 远端出口方向的白光预兆
        float exitGlow = exp(-max(dist - 150.0, 0.0) * 0.05);
        col += mix(uViolet, uWhite, 0.55) * exitGlow * (0.25 + uExit * 1.4);
        col += uVoid;
        col *= (1.0 + uSpeed * 0.35);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
  tunnelMesh.position.set(0, 0, -90); // 覆盖 z = +30（相机身后）到 -210（远端）
  scene.add(tunnelMesh);

  /* 5.2 粒子流：vertex shader 里随 uTravel 涌向相机 */
  const N = reduced ? 500 : 1400;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  const scl = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = 2 + Math.pow(Math.random(), 0.7) * 11;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.sin(a) * r;
    pos[i * 3 + 2] = Math.random() * 235;
    seed[i] = Math.random();
    scl[i] = 0.5 + Math.random() * 1.6;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  pGeo.setAttribute('aScale', new THREE.BufferAttribute(scl, 1));
  const uPx = { value: Math.min(window.devicePixelRatio || 1, 2) };
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime, uTravel, uSpeed, uPx,
      uViolet: { value: VIOLET }, uWhite: { value: WHITE }
    },
    vertexShader: `
      attribute float aSeed;
      attribute float aScale;
      uniform float uTravel, uTime, uSpeed, uPx;
      varying float vSeed;
      varying float vFade;
      void main(){
        vSeed = aSeed;
        float span = 235.0;
        float z = -210.0 + mod(position.z + uTravel, span); // 涌向相机
        vec3 pp = vec3(position.x, position.y, z);
        pp.x += sin(uTime * 0.8 + aSeed * 12.0) * 0.25;     // 轻微呼吸
        pp.y += cos(uTime * 0.7 + aSeed * 9.0) * 0.25;
        vec4 mv = modelViewMatrix * vec4(pp, 1.0);
        float dist = -mv.z;
        vFade = smoothstep(235.0, 120.0, dist) * smoothstep(-18.0, 6.0, dist);
        gl_PointSize = aScale * uPx * (140.0 / max(dist, 1.0)) * (1.0 + uSpeed * 1.6);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      precision highp float;
      varying float vSeed;
      varying float vFade;
      uniform float uTime, uSpeed;
      uniform vec3 uViolet, uWhite;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float disc = smoothstep(0.5, 0.08, d);
        float tw = 0.55 + 0.45 * sin(uTime * 3.0 + vSeed * 21.0);
        vec3 col = mix(uViolet, uWhite, step(0.72, vSeed) * 0.85 + 0.1);
        float a = disc * tw * vFade * (0.35 + uSpeed * 0.65);
        gl_FragColor = vec4(col * (1.0 + uSpeed * 0.8), a);
      }`
  });
  scene.add(new THREE.Points(pGeo, pMat));

  /* 5.3 出口白光：远端发光平面 */
  const exitMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uExit, uWhite: { value: WHITE }, uViolet: { value: VIOLET } },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform float uExit;
      uniform vec3 uWhite, uViolet;
      void main(){
        float d = length(vUv - 0.5) * 2.0;
        float core = exp(-d * d * 5.0);
        float halo = exp(-d * d * 1.6) * 0.5;
        vec3 col = uWhite * core + uViolet * halo;
        float a = clamp(core + halo, 0.0, 1.0) * (0.12 + uExit);
        gl_FragColor = vec4(col, a);
      }`
  });
  const exitPlane = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), exitMat);
  exitPlane.position.set(0, 0, -204);
  scene.add(exitPlane);

  markReady();
}

/* ---------- 6. 主循环 ---------- */
let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;

  // 滚动速度 → 平滑速度（驱动 FOV/粒子/速度线）
  const y = window.scrollY || 0;
  velRaw = Math.abs(y - lastY);
  lastY = y;
  const target = Math.min(1, velRaw / 26);
  const k = 1 - Math.exp(-dt * 5.5);
  speed += (target - speed) * k;

  // 按住穿越：程序化滚动（同样走上面的速度链路）
  if (holding) {
    holdT += dt;
    window.scrollBy(0, Math.min(26, 9 + holdT * 14));
  }

  if (renderer) {
    uTime.value += dt;
    // 滚动目标（物理感追踪）+ 静息呼吸漂移
    uTravelTarget = p * TRAVEL_LEN;
    uTravelBase += (uTravelTarget - uTravelBase) * (1 - Math.exp(-dt * 7));
    if (!reduced) uDrift += dt * 5;
    uTravel.value = uTravelBase + uDrift;

    uSpeed.value = speed;
    uExit.value = smooth01((p - 0.55) / 0.45);

    // FOV 拉伸：速度越快视野越长
    const fovT = FOV_BASE + speed * (FOV_MAX - FOV_BASE);
    fovCur += (fovT - fovCur) * (1 - Math.exp(-dt * 6));
    if (Math.abs(fovCur - camera.fov) > 0.05) {
      camera.fov = fovCur;
      camera.updateProjectionMatrix();
    }
    // 高速微抖
    camera.rotation.z = Math.sin(uTime.value * 7.3) * 0.012 * speed;
    camera.position.x = Math.sin(uTime.value * 0.9) * 0.35 * speed;
    camera.position.y = Math.cos(uTime.value * 0.7) * 0.35 * speed;

    // 速度线覆盖层
    if (!reduced) speedlinesEl.style.opacity = (speed * 0.85).toFixed(3);

    renderer.render(scene, camera);
  }

  velNum.textContent = speed.toFixed(2);
}

let uTravelTarget = 0, uTravelBase = 0, uDrift = 0;

try {
  initGL();
} catch (e) {
  const bg = $('#bg');
  if (bg) bg.style.display = 'none';
  markReady();
}
requestAnimationFrame(frame);
