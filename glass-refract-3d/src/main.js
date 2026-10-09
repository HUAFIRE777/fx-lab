import * as THREE from 'three';

document.documentElement.classList.add('js');

/* ================= glass-refract-3d · 玻璃折射棱镜 =================
   手法：程序化线条波纹背景 + MeshPhysicalMaterial(transmission=1)
   真实折射透镜 + 鼠标视差漂移 + 缓慢自转。代码全部原创。 */

const INK = '#0a0c10', PAPER = '#e8f4ff', SKY = '#7dd3fc';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const CFG = { ior: 1.52, count: 5, pattern: 0 };

/* ---------------- 程序化背景图案（canvas 纹理） ---------------- */
function makePattern(mode, W, H) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = INK;
  x.fillRect(0, 0, W, H);
  x.lineWidth = 1;

  const paper = (a) => `rgba(232,244,255,${a})`;
  const sky = (a) => `rgba(125,211,252,${a})`;

  if (mode === 0) {
    // 同心波纹：圆环半径被正弦扰动，细线条涟漪
    const cx = W * 0.5, cy = H * 0.46;
    const maxR = Math.hypot(W, H) * 0.62;
    let i = 0;
    for (let r = 14; r < maxR; r += 9, i++) {
      const accent = i % 9 === 4;
      x.strokeStyle = accent ? sky(0.30) : paper(0.10 + 0.05 * Math.sin(i * 0.7));
      x.beginPath();
      const steps = 240;
      for (let s = 0; s <= steps; s++) {
        const t = (s / steps) * Math.PI * 2;
        const rr = r + 7 * Math.sin(t * 5 + r * 0.045) + 3 * Math.sin(t * 11 - r * 0.02);
        const px = cx + Math.cos(t) * rr, py = cy + Math.sin(t) * rr * 0.82;
        s === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
      }
      x.closePath();
      x.stroke();
    }
  } else if (mode === 1) {
    // 斜波条纹：对角线族，每点沿法向做正弦偏移
    const dx = Math.cos(Math.PI / 5), dy = Math.sin(Math.PI / 5);
    const nx = -dy, ny = dx;
    const span = W * Math.abs(nx) + H * Math.abs(ny);
    let i = 0;
    for (let d = -span; d < span; d += 10, i++) {
      const accent = i % 10 === 5;
      x.strokeStyle = accent ? sky(0.28) : paper(0.09 + 0.05 * Math.sin(i * 0.5));
      x.beginPath();
      const steps = 160;
      for (let s = 0; s <= steps; s++) {
        const t = -span + (s / steps) * span * 2;
        const wob = 34 * Math.sin(t * 0.012 + d * 0.03) + 12 * Math.sin(t * 0.031 - d * 0.017);
        const px = W / 2 + dx * t + nx * (d + wob);
        const py = H / 2 + dy * t + ny * (d + wob);
        s === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
      }
      x.stroke();
    }
  } else {
    // 流场网格：短划线沿正弦流场方向排布
    const cell = 44;
    for (let gy = cell / 2; gy < H; gy += cell) {
      for (let gx = cell / 2; gx < W; gx += cell) {
        const a = Math.sin(gx * 0.008) * 1.4 + Math.cos(gy * 0.011) * 1.4;
        const len = cell * 0.42;
        const x2 = gx + Math.cos(a) * len, y2 = gy + Math.sin(a) * len;
        const accent = ((gx / cell) | 0) % 8 === 3 && ((gy / cell) | 0) % 8 === 3;
        x.strokeStyle = accent ? sky(0.34) : paper(0.10);
        x.beginPath(); x.moveTo(gx, gy); x.lineTo(x2, y2); x.stroke();
        // 淡网格底
        x.strokeStyle = paper(0.028);
        x.strokeRect(gx - cell / 2, gy - cell / 2, cell, cell);
      }
    }
  }
  return c;
}

/* ---------------- 环境反射（程序化 equirect → PMREM，无外部资源） ---------------- */
function makeEnvTexture(renderer) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#0a0c10');
  g.addColorStop(0.42, '#101720');
  g.addColorStop(0.5, '#e8f4ff');   // 地平线高光带 → 玻璃上的亮边
  g.addColorStop(0.58, '#101720');
  g.addColorStop(1, '#05070a');
  x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  // 一道棱镜蓝光斑
  const rg = x.createRadialGradient(140, 128, 4, 140, 128, 90);
  rg.addColorStop(0, 'rgba(125,211,252,0.95)');
  rg.addColorStop(1, 'rgba(125,211,252,0)');
  x.fillStyle = rg; x.fillRect(0, 0, 512, 256);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromEquirectangular(t).texture;
  t.dispose(); pm.dispose();
  return env;
}

/* ---------------- 场景 ---------------- */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 640 ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
scene.background = new THREE.Color(INK);
scene.environment = makeEnvTexture(renderer);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 60);
camera.position.set(0, 0, 8);

/* 背景板：铺满视锥，透镜透过 transmission 真实折射它 */
const bgCanvas = makePattern(CFG.pattern, 2048, 1280);
const bgTex = new THREE.CanvasTexture(bgCanvas);
bgTex.colorSpace = THREE.SRGBColorSpace;
bgTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
const bgMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ map: bgTex, toneMapped: false })
);
scene.add(bgMesh);

function fitBackground() {
  const dist = 10; // 背景板距相机距离
  const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
  const w = h * camera.aspect;
  bgMesh.scale.set(w * 1.04, h * 1.04, 1);
  bgMesh.position.set(camera.position.x * 0.4, camera.position.y * 0.4, camera.position.z - dist);
}
fitBackground();

/* 柔光：给玻璃一点方向性 */
const key = new THREE.DirectionalLight(PAPER, 1.1);
key.position.set(4, 6, 6);
scene.add(key);
scene.add(new THREE.AmbientLight(PAPER, 0.25));

/* ---------------- 透镜 ---------------- */
const lensMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.05,
  transmission: 1,
  thickness: 2.4,
  ior: CFG.ior,
  clearcoat: 1,
  clearcoatRoughness: 0.06,
  attenuationColor: new THREE.Color(SKY),
  attenuationDistance: 7,
  specularIntensity: 1,
  envMapIntensity: 1.25,
});

const lenses = new THREE.Group();
scene.add(lenses);
let lensList = [];

function buildLenses(n) {
  // 清理旧透镜
  for (const l of lensList) {
    lenses.remove(l.mesh);
    l.mesh.geometry.dispose();
  }
  lensList = [];
  const spreadX = Math.min(6.4, camera.aspect * 3.4);
  for (let i = 0; i < n; i++) {
    const r = 0.55 + Math.random() * 0.55;
    const geo = i % 2 === 0
      ? new THREE.SphereGeometry(r, 56, 36)
      : new THREE.CapsuleGeometry(r * 0.55, r * 1.7, 12, 36);
    const mesh = new THREE.Mesh(geo, lensMat);
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const base = new THREE.Vector3(
      Math.cos(a) * spreadX * (0.45 + Math.random() * 0.55),
      Math.sin(a) * 2.1 * (0.4 + Math.random() * 0.6),
      -1.5 - Math.random() * 3.5
    );
    mesh.position.copy(base);
    mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    lenses.add(mesh);
    lensList.push({
      mesh, base,
      depth: 0.35 + (base.z + 5) * 0.22,          // 越近视差越大
      axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      rotSpeed: (reduced ? 0.03 : 0.12) + Math.random() * 0.18,
      phase: Math.random() * Math.PI * 2,
      bobAmp: reduced ? 0 : 0.12 + Math.random() * 0.16,
    });
  }
}
buildLenses(CFG.count);

/* ---------------- 鼠标视差（指数跟随，有物理感） ---------------- */
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = (e.clientY / innerHeight) * 2 - 1;
}, { passive: true });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 640 ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight);
  fitBackground();
});

/* ---------------- 控制条 ---------------- */
const iorInput = document.getElementById('ior');
const iorVal = document.getElementById('iorVal');
iorInput.addEventListener('input', () => {
  CFG.ior = parseFloat(iorInput.value);
  lensMat.ior = CFG.ior;
  iorVal.textContent = CFG.ior.toFixed(2);
});

function segWire(id, fn) {
  const el = document.getElementById(id);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    el.querySelectorAll('button').forEach((o) => o.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    fn(b);
  });
}
segWire('countSeg', (b) => { CFG.count = parseInt(b.dataset.n, 10); buildLenses(CFG.count); });
segWire('patSeg', (b) => {
  CFG.pattern = parseInt(b.dataset.p, 10);
  const old = bgMesh.material.map;
  const tex = new THREE.CanvasTexture(makePattern(CFG.pattern, 2048, 1280));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  bgMesh.material.map = tex;
  bgMesh.material.needsUpdate = true;
  if (old) old.dispose();
});

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
const loader = document.getElementById('loader');
let revealed = false;
const bootAt = performance.now();

function reveal() {
  if (revealed) return;
  revealed = true;
  document.documentElement.classList.add('is-in');
  loader.classList.add('done');
}

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 指数跟随：快跟慢回，物理感
  const k = 1 - Math.exp(-dt * 4.2);
  mouse.sx += (mouse.x - mouse.sx) * k;
  mouse.sy += (mouse.y - mouse.sy) * k;

  for (const l of lensList) {
    const p = l.mesh.position;
    p.x = l.base.x + mouse.sx * l.depth * 1.35 + Math.sin(t * 0.5 + l.phase) * l.bobAmp;
    p.y = l.base.y - mouse.sy * l.depth * 0.9 + Math.cos(t * 0.4 + l.phase * 1.7) * l.bobAmp;
    l.mesh.rotateOnAxis(l.axis, l.rotSpeed * dt); // 缓慢自转
  }

  camera.position.x = mouse.sx * 0.38;
  camera.position.y = -mouse.sy * 0.26;
  camera.lookAt(0, 0, -2);
  fitBackground();

  renderer.render(scene, camera);

  // 首帧 + 最短展示 700ms 后进完成态；三重兜底
  if (!revealed && performance.now() - bootAt > 700) reveal();
}
tick();
setTimeout(reveal, 3200);
setTimeout(reveal, 6000);
