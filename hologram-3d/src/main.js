import * as THREE from 'three';

/* ============================================================
 * hologram-3d · 全息投影展台
 * huafire3d fx-lab — original implementation
 * 手法参考：科幻全息 UI 展台（扫描线滚动 / 投影闪烁 / 底座光环），
 * 代码全部原创重写，未使用任何原站源码。
 * ============================================================ */

const COLORS = { cyan: 0x00f0ff, magenta: 0xff2ed1 };
const state = { mode: 'cyan', speed: 0.72, scanFreq: 96 };

const canvas = document.getElementById('scene');
const stage = document.getElementById('stage');

/* ---------------- 渲染器 / 场景 / 相机 ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04060a);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
const CAM_HOME = new THREE.Vector3(0, 2.75, 7.8);
camera.position.copy(CAM_HOME);

scene.add(new THREE.AmbientLight(0x334455, 0.55));
const keyLight = new THREE.PointLight(COLORS.cyan, 60, 25, 2);
keyLight.position.set(0, 3.4, 2.6);
scene.add(keyLight);
const rimLight = new THREE.PointLight(0xffffff, 8, 20, 2);
rimLight.position.set(-3, 4, -3);
scene.add(rimLight);

/* ---------------- 全息 shader（additive + fresnel） ---------------- */
const shaderMats = [];
function makeHoloMaterial({ alpha = 0.55, y0 = 0.9, y1 = 3.5, scanSpeed = 6 } = {}) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(COLORS.cyan) },
      uScanFreq: { value: state.scanFreq },
      uScanSpeed: { value: scanSpeed },
      uAlpha: { value: alpha },
      uY0: { value: y0 },
      uY1: { value: y1 },
    },
    vertexShader: /* glsl */`
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vW;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = normalize(-mv.xyz);
        vW = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uScanFreq, uScanSpeed, uAlpha, uY0, uY1;
      uniform vec3 uColor;
      varying vec3 vN, vV, vW;
      float hash(float n) { return fract(sin(n) * 43758.5453123); }
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(vV);
        float rim = pow(1.0 - abs(dot(n, v)), 2.1);

        // 横向扫描线滚动
        float scan = 0.5 + 0.5 * sin(vW.y * uScanFreq + uTime * uScanSpeed);
        float line = smoothstep(0.72, 1.0, scan);

        // 纵向扫过的高亮带
        float yn = clamp((vW.y - uY0) / max(uY1 - uY0, 0.001), 0.0, 1.0);
        float sweep = smoothstep(0.09, 0.0, abs(fract(uTime * 0.16) - yn));

        // 偶发撕裂抖动
        float g = hash(floor(uTime * 18.0));
        float tear = step(0.965, g)
          * smoothstep(0.35, 0.0, abs(fract(vW.y * 2.1 + g * 9.0) - 0.5) - 0.12);

        // 投影闪烁
        float fl = 1.0 - 0.5 * step(0.962, hash(floor(uTime * 26.0) + floor(vW.y * 9.0) * 0.17));

        // 上下边缘淡出（投影体积感）
        float fade = smoothstep(uY0, uY0 + 0.55, vW.y)
                   * (1.0 - smoothstep(uY1 - 0.55, uY1, vW.y));

        float a = uAlpha * (0.26 + rim * 1.5 + line * 0.38 + sweep * 1.1 + tear * 0.9) * fade * fl;
        vec3 col = uColor * (0.5 + rim * 1.7 + line * 0.55 + sweep * 1.2 + tear * 0.8);
        gl_FragColor = vec4(col, a);
      }`,
  });
  shaderMats.push(mat);
  return mat;
}
const holoMat = makeHoloMaterial({ alpha: 0.5, y0: 1.15, y1: 3.35 });
const coneMat = makeHoloMaterial({ alpha: 0.16, y0: 0.35, y1: 2.25, scanSpeed: 9 });

/* ---------------- 台座 ---------------- */
const pedestal = new THREE.Group();
scene.add(pedestal);

const baseMat = new THREE.MeshStandardMaterial({ color: 0x0b0e16, metalness: 0.75, roughness: 0.32 });
const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.64, 0.34, 72), baseMat);
base.position.y = 0.17;
pedestal.add(base);
const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.045, 72), baseMat.clone());
plate.material.color.set(0x11151f);
plate.position.y = 0.36;
pedestal.add(plate);

const glowMats = [];
function glowMat() {
  const m = new THREE.MeshBasicMaterial({ color: COLORS.cyan, toneMapped: false, transparent: true, opacity: 0.95 });
  glowMats.push(m);
  return m;
}
// 台座边缘光环
const edgeRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.016, 12, 160), glowMat());
edgeRing.rotation.x = Math.PI / 2;
edgeRing.position.y = 0.345;
pedestal.add(edgeRing);
// 底座刻度环（canvas 手绘刻度）
function tickTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 1024);
  g.translate(512, 512);
  for (let i = 0; i < 120; i++) {
    const major = i % 10 === 0;
    const r1 = 500, r0 = major ? 448 : 470;
    const a = (i / 120) * Math.PI * 2;
    g.strokeStyle = major ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)';
    g.lineWidth = major ? 7 : 3;
    g.beginPath();
    g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}
const tickRing = new THREE.Mesh(
  new THREE.RingGeometry(1.0, 1.28, 96),
  new THREE.MeshBasicMaterial({
    map: tickTexture(), transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: COLORS.cyan,
  })
);
tickRing.rotation.x = -Math.PI / 2;
tickRing.position.y = 0.388;
pedestal.add(tickRing);
glowMats.push(tickRing.material);

// 旋转光环 ×2（一正一反）
const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.008, 8, 128), glowMat());
ringA.rotation.x = Math.PI / 2; ringA.position.y = 0.43; pedestal.add(ringA);
const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.008, 8, 128), glowMat());
ringB.rotation.x = Math.PI / 2; ringB.position.y = 0.41; pedestal.add(ringB);
// 环上彗星光点
const cometGeo = new THREE.SphereGeometry(0.032, 12, 12);
const cometA = new THREE.Mesh(cometGeo, glowMat()); pedestal.add(cometA);
const cometB = new THREE.Mesh(cometGeo, glowMat()); pedestal.add(cometB);

// 地面光晕池
function poolTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
const pool = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 8),
  new THREE.MeshBasicMaterial({
    map: poolTexture(), transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: COLORS.cyan,
  })
);
pool.rotation.x = -Math.PI / 2;
pool.position.y = 0.002;
pedestal.add(pool);
glowMats.push(pool.material);

/* ---------------- 投影光锥 ---------------- */
const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.04, 0.52, 1.85, 48, 1, true), coneMat);
cone.position.y = 1.3;
scene.add(cone);

/* ---------------- 全息耳机（纯程序化几何） ---------------- */
const rig = new THREE.Group();          // 旋转+浮动
const holo = new THREE.Group();         // 抖动层
rig.add(holo);
rig.position.y = 2.18;
scene.add(rig);

const PART_INFO = {
  cup:     { name: '耳罩单元', lines: ['50mm 动圈单元', '阻抗 32Ω · 频响 8Hz–42kHz'] },
  band:    { name: '头梁',     lines: ['碳纤维弓梁', '整机 198g · 记忆棉内衬'] },
  hinge:   { name: '铰链',     lines: ['多轴折叠铰链', '5 万次开合寿命测试'] },
  cushion: { name: '耳垫',     lines: ['蛋白皮耳垫', '被动降噪 −28dB'] },
};
const pickables = [];
function part(geo, kind, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, holoMat);
  m.position.set(x, y, z);
  m.userData.kind = kind;
  holo.add(m);
  pickables.push(m);
  return m;
}
// 头梁：上半圆环
part(new THREE.TorusGeometry(0.92, 0.07, 20, 72, Math.PI), 'band', 0, 0.12, 0);
// 头梁内衬垫
const padGeo = new THREE.TorusGeometry(0.82, 0.045, 14, 48, Math.PI * 0.7);
const pad = part(padGeo, 'band', 0, 0.12, 0);
pad.rotation.z = Math.PI * 0.15;
// 两侧：滑臂 + 铰链 + 耳罩
for (const s of [-1, 1]) {
  part(new THREE.CylinderGeometry(0.032, 0.032, 0.52, 12), 'band', s * 0.92, -0.14, 0);
  part(new THREE.SphereGeometry(0.062, 16, 16), 'hinge', s * 0.92, -0.42, 0);
  const cup = part(new THREE.CylinderGeometry(0.3, 0.3, 0.17, 40), 'cup', s * 0.92, -0.62, 0);
  cup.rotation.z = Math.PI / 2;
  const cushion = part(new THREE.TorusGeometry(0.215, 0.075, 16, 48), 'cushion', s * 0.92, -0.62, 0);
  cushion.rotation.y = Math.PI / 2;
  const driver = part(new THREE.CircleGeometry(0.14, 32), 'cup', s * (0.92 + 0.088), -0.62, 0);
  driver.rotation.y = s * Math.PI / 2;
  // 耳罩外侧装饰环
  const deco = part(new THREE.TorusGeometry(0.3, 0.014, 10, 48), 'cup', s * 0.92, -0.62, 0);
  deco.rotation.y = Math.PI / 2;
}

/* ---------------- 上升粒子光点 ---------------- */
const P_COUNT = 150;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(P_COUNT * 3);
const pSpd = new Float32Array(P_COUNT);
for (let i = 0; i < P_COUNT; i++) {
  const r = 0.3 + Math.random() * 1.05;
  const a = Math.random() * Math.PI * 2;
  pPos[i * 3] = Math.cos(a) * r;
  pPos[i * 3 + 1] = 0.4 + Math.random() * 2.9;
  pPos[i * 3 + 2] = Math.sin(a) * r;
  pSpd[i] = 0.25 + Math.random() * 0.55;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({
  color: COLORS.cyan, size: 0.035, transparent: true, opacity: 0.75,
  blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
});
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

/* ---------------- 交互：拖动旋转 / 点击部件 ---------------- */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let targetRotY = 0.6, rotY = 0.6;
let downX = 0, downY = 0, downT = 0, dragging = false;
const mouseNX = { x: 0 };

canvas.addEventListener('pointerdown', (e) => {
  dragging = true; downX = e.clientX; downY = e.clientY; downT = performance.now();
  canvas.classList.add('dragging');
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  mouseNX.x = (e.clientX / window.innerWidth) * 2 - 1;
  if (!dragging) return;
  targetRotY += (e.clientX - downX) * 0.006;
  downX = e.clientX; downY = e.clientY;
});
function endPointer(e) {
  if (!dragging) return;
  dragging = false;
  canvas.classList.remove('dragging');
  const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (moved < 7 && performance.now() - downT < 450) handlePick(e);
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', () => { dragging = false; canvas.classList.remove('dragging'); });

const tag = document.getElementById('tag');
const tagName = tag.querySelector('.t-name');
const tagLines = tag.querySelector('.t-line');
let tagAnchor = null;
let tagTimer = 0;
function handlePick(e) {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  if (hits.length) {
    showTag(hits[0].object);
  } else {
    hideTag();
  }
}
function showTag(mesh) {
  const info = PART_INFO[mesh.userData.kind];
  if (!info) return;
  tagAnchor = mesh;
  tagName.textContent = info.name;
  tagLines.innerHTML = info.lines.map((l) => `<div>${l}</div>`).join('');
  tag.hidden = false;
  positionTag();
  gsap.fromTo(tag, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.8)' });
  clearTimeout(tagTimer);
  tagTimer = setTimeout(hideTag, 9000);
}
function hideTag() {
  clearTimeout(tagTimer);
  tag.hidden = true;
  tagAnchor = null;
}
document.getElementById('tagClose').addEventListener('click', (ev) => { ev.stopPropagation(); hideTag(); });
const _v3 = new THREE.Vector3();
function positionTag() {
  if (!tagAnchor) return;
  tagAnchor.getWorldPosition(_v3);
  _v3.y += 0.34;
  _v3.project(camera);
  const x = (_v3.x * 0.5 + 0.5) * stage.clientWidth;
  const y = (-_v3.y * 0.5 + 0.5) * stage.clientHeight;
  tag.style.left = Math.min(Math.max(x, 120), stage.clientWidth - 120) + 'px';
  tag.style.top = Math.min(Math.max(y, 130), stage.clientHeight - 60) + 'px';
}

/* ---------------- 控制项 ---------------- */
const speedInput = document.getElementById('speed');
const scanInput = document.getElementById('scan');
const speedVal = document.getElementById('speedVal');
const scanVal = document.getElementById('scanVal');
function applySpeed() {
  const v = +speedInput.value;
  state.speed = 0.05 + (v / 100) * 1.7;
  speedVal.textContent = state.speed.toFixed(1);
}
function applyScan() {
  const v = +scanInput.value;
  state.scanFreq = 24 + (v / 100) * 170;
  scanVal.textContent = Math.round(state.scanFreq);
  for (const m of shaderMats) m.uniforms.uScanFreq.value = state.scanFreq;
}
speedInput.addEventListener('input', applySpeed);
scanInput.addEventListener('input', applyScan);
applySpeed(); applyScan();

const btnCyan = document.getElementById('modeCyan');
const btnMagenta = document.getElementById('modeMagenta');
function setMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  document.documentElement.dataset.mode = mode === 'magenta' ? 'magenta' : '';
  const c = new THREE.Color(COLORS[mode]);
  for (const m of shaderMats) m.uniforms.uColor.value.copy(c);
  for (const m of glowMats) m.color.copy(c);
  keyLight.color.copy(c);
  pMat.color.copy(c);
  btnCyan.classList.toggle('active', mode === 'cyan');
  btnMagenta.classList.toggle('active', mode === 'magenta');
  // 切换时的呼吸脉冲（物理感 easing）
  gsap.fromTo(holoMat.uniforms.uAlpha, { value: 1.0 }, { value: 0.5, duration: 0.7, ease: 'elastic.out(1,0.45)' });
}
btnCyan.addEventListener('click', () => setMode('cyan'));
btnMagenta.addEventListener('click', () => setMode('magenta'));

/* ---------------- 自适应 ---------------- */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  const aspect = w / h;
  // 窄屏拉远，保证台座不被 dock 遮住太多
  const dist = aspect < 0.7 ? 10.4 : aspect < 1 ? 8.8 : 7.8;
  CAM_HOME.set(0, 2.75, dist);
  camera.position.copy(CAM_HOME);
  renderer.setSize(w, h, false);
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// 无头验证用：返回某类部件当前的屏幕坐标
window.__holoTest = {
  partScreenPos(kind) {
    const m = pickables.find((p) => p.userData.kind === kind);
    if (!m) return null;
    m.getWorldPosition(_v3);
    _v3.project(camera);
    const r = canvas.getBoundingClientRect();
    return {
      x: r.left + (_v3.x * 0.5 + 0.5) * r.width,
      y: r.top + (-_v3.y * 0.5 + 0.5) * r.height,
    };
  },
};

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
let frames = 0;
let jitterT = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  for (const m of shaderMats) m.uniforms.uTime.value = t;

  // 旋转（阻尼跟随 → 物理感）
  if (!dragging) targetRotY += state.speed * dt;
  rotY += (targetRotY - rotY) * (dragging ? 0.35 : 0.06);
  rig.rotation.y = rotY;

  // 浮动
  rig.position.y = 2.18 + Math.sin(t * 0.8) * 0.06;

  // 投影不稳定抖动：偶发短促抖动 burst
  if (jitterT <= 0 && Math.random() < 0.012) jitterT = 0.14;
  if (jitterT > 0) {
    jitterT -= dt;
    holo.position.x = (Math.random() - 0.5) * 0.03;
    holo.position.z = (Math.random() - 0.5) * 0.03;
    holo.rotation.z = (Math.random() - 0.5) * 0.012;
  } else {
    holo.position.x *= 0.8; holo.position.z *= 0.8; holo.rotation.z *= 0.8;
  }

  // 底座光环旋转（一正一反）+ 彗星
  ringA.rotation.z = t * 0.5;
  ringB.rotation.z = -t * 0.85;
  cometA.position.set(Math.cos(t * 0.5) * 1.16, 0.43, Math.sin(t * 0.5) * 1.16);
  cometB.position.set(Math.cos(-t * 0.85 + 2.4) * 0.84, 0.41, Math.sin(-t * 0.85 + 2.4) * 0.84);
  tickRing.rotation.z = t * 0.06;
  // 光环呼吸
  const pulse = 0.82 + Math.sin(t * 2.2) * 0.18;
  edgeRing.material.opacity = pulse;

  // 粒子上升
  const arr = pGeo.attributes.position.array;
  for (let i = 0; i < P_COUNT; i++) {
    arr[i * 3 + 1] += pSpd[i] * dt;
    arr[i * 3] += Math.sin(t * 1.4 + i) * 0.0006;
    if (arr[i * 3 + 1] > 3.35) arr[i * 3 + 1] = 0.4;
  }
  pGeo.attributes.position.needsUpdate = true;

  // 相机视差（缓慢跟随鼠标）
  camera.position.x += (mouseNX.x * 0.7 - camera.position.x) * 0.04;
  camera.position.y += ((CAM_HOME.y + mouseNX.x * 0.0) - camera.position.y) * 0.04;
  camera.lookAt(0, 1.75, 0);

  if (tagAnchor && !tag.hidden) positionTag();

  renderer.render(scene, camera);

  if (++frames === 8) {
    document.documentElement.classList.add('ready');
  }
}
animate();
