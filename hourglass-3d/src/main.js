import * as THREE from 'three';

/* ============================================================
 * hourglass-3d · 沙漏
 * huafire3d fx-lab — original implementation
 * 玻璃沙漏 + 沙粒流 + 沙堆质量守恒 + 点击翻转仪式感
 * ============================================================ */

const CFG = {
  totalSeconds: 120,      // 中速下一漏时长
  streamCount: 260,       // 主沙流粒子数
  trickleCount: 90,       // 顶部汇聚粒子数
  bulbR: 1.0,             // 樽体最大半径
  bulbH: 2.05,            // 樽体半高
  neckR: 0.07,            // 细颈半径
  floorY: -1.78,          // 下樽内底
  pileMaxH: 1.05,         // 沙堆最大高度
  sand: 0xE8B86D,         // 流沙金
  ink: 0x0C0C0E,          // 墨黑
};

// ---------- 渲染器 / 场景 ----------
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 60);
camera.position.set(0, 0.35, 6.4);

// 程序化环境反射（纯代码生成，无外部资源）：暖主光 + 冷轮廓 + 顶光
{
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x050506);
  const card = (c, w, h, x, y, z, i) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i) })
    );
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  };
  card(0xffd9a0, 6, 9, -7, 4, 2, 5);    // 暖主光
  card(0x8fb4ff, 5, 8, 7, 2, -1, 3);    // 冷轮廓
  card(0xfff2dd, 8, 4, 0, 9, 3, 4);     // 顶光
  card(0xE8B86D, 10, 2, 0, -6, 4, 1.2); // 底部金色反光
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.04).texture;
  pmrem.dispose();
}

// ---------- 灯光 ----------
scene.add(new THREE.AmbientLight(0x2a2a30, 0.7));
const key = new THREE.DirectionalLight(0xffe6c0, 2.2); key.position.set(-4, 5, 4); scene.add(key);
const rim = new THREE.DirectionalLight(0x9db8ff, 1.4); rim.position.set(5, 2, -4); scene.add(rim);
const goldPt = new THREE.PointLight(CFG.sand, 12, 9, 2); goldPt.position.set(0, -1.2, 2.2); scene.add(goldPt);

// ---------- 沙漏主体 ----------
const glass = new THREE.Group();
glass.scale.setScalar(0.82);
scene.add(glass);

// 玻璃樽：LatheGeometry 对称双球 + 细颈
function glassProfile() {
  const pts = [];
  const R = CFG.bulbR, H = CFG.bulbH, n = CFG.neckR;
  pts.push(new THREE.Vector2(R * 1.02, H));
  pts.push(new THREE.Vector2(R * 1.0, H - 0.12));
  const steps = 26;
  for (let i = 1; i <= steps; i++) {           // 上樽收腰
    const t = i / steps;
    const y = (H - 0.12) - t * (H - 0.22);
    const r = n + (R - n) * Math.pow(Math.cos(t * Math.PI * 0.5), 0.72);
    pts.push(new THREE.Vector2(Math.max(r, n), y));
  }
  pts.push(new THREE.Vector2(n, 0.1));
  pts.push(new THREE.Vector2(n, -0.1));
  for (let i = 1; i <= steps; i++) {           // 下樽外扩
    const t = i / steps;
    const y = -0.1 - t * (H - 0.22);
    const r = n + (R - n) * Math.pow(Math.sin(t * Math.PI * 0.5), 0.72);
    pts.push(new THREE.Vector2(Math.max(r, n), y));
  }
  pts.push(new THREE.Vector2(R * 1.0, -(H - 0.12)));
  pts.push(new THREE.Vector2(R * 1.02, -H));
  return pts;
}
const glassMesh = new THREE.Mesh(
  new THREE.LatheGeometry(glassProfile(), 72),
  new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.06,
    transparent: true, opacity: 0.16,
    clearcoat: 1, clearcoatRoughness: 0.08,
    envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false,
  })
);
glass.add(glassMesh);

// 底座 / 顶盖：深色金属 + 金色描边
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x17171b, metalness: 0.85, roughness: 0.38, envMapIntensity: 1.1 });
const goldMetal = new THREE.MeshStandardMaterial({ color: CFG.sand, metalness: 1, roughness: 0.28, envMapIntensity: 1.4 });
const capGeo = new THREE.CylinderGeometry(1.32, 1.38, 0.2, 64);
const capTop = new THREE.Mesh(capGeo, darkMetal); capTop.position.y = CFG.bulbH + 0.1;
const capBot = new THREE.Mesh(capGeo, darkMetal); capBot.position.y = -(CFG.bulbH + 0.1);
glass.add(capTop, capBot);
for (const y of [CFG.bulbH + 0.2, -(CFG.bulbH + 0.2)]) {
  const trim = new THREE.Mesh(new THREE.TorusGeometry(1.33, 0.028, 16, 96), goldMetal);
  trim.rotation.x = Math.PI / 2; trim.position.y = y; glass.add(trim);
}
// 三根立柱
for (let k = 0; k < 3; k++) {
  const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, CFG.bulbH * 2 + 0.2, 24), darkMetal);
  col.position.set(Math.cos(a) * 1.22, 0, Math.sin(a) * 1.22);
  glass.add(col);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 12, 32), goldMetal);
  collar.rotation.x = Math.PI / 2; collar.position.set(Math.cos(a) * 1.22, CFG.bulbH - 0.28, Math.sin(a) * 1.22);
  glass.add(collar);
}

// ---------- 沙堆（质量守恒示意） ----------
const sandMat = new THREE.MeshStandardMaterial({ color: CFG.sand, roughness: 0.9, metalness: 0, envMapIntensity: 0.35 });
const pileGeo = new THREE.ConeGeometry(0.8, CFG.pileMaxH, 48, 1);
pileGeo.translate(0, CFG.pileMaxH / 2, 0);              // 基座在原点，向上长
const pileBot = new THREE.Mesh(pileGeo, sandMat);
pileBot.position.y = CFG.floorY; glass.add(pileBot);

const pileTopGeo = new THREE.ConeGeometry(0.8, CFG.pileMaxH, 48, 1);
pileTopGeo.translate(0, -CFG.pileMaxH / 2, 0);          // 尖端在原点，向下长
pileTopGeo.rotateY(Math.PI);
const pileTop = new THREE.Mesh(pileTopGeo, sandMat);
pileTop.position.y = 0.14; glass.add(pileTop);          // 尖端对准细颈

// ---------- 沙粒 ----------
function makePoints(count, size) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({
    color: CFG.sand, size, sizeAttenuation: true,
    transparent: true, opacity: 0.95, depthWrite: false,
  }));
  p.frustumCulled = false;
  glass.add(p);
  return p;
}
const stream = makePoints(CFG.streamCount, 0.035);
const trickle = makePoints(CFG.trickleCount, 0.03);
const streamPos = stream.geometry.attributes.position;
const tricklePos = trickle.geometry.attributes.position;
const streamSeed = new Float32Array(CFG.streamCount);
const trickleSeed = new Float32Array(CFG.trickleCount);
const rand = (a, b) => a + Math.random() * (b - a);
function seedStream(i) { streamSeed[i] = Math.random(); }
function seedTrickle(i) { trickleSeed[i] = Math.random(); }
for (let i = 0; i < CFG.streamCount; i++) seedStream(i);
for (let i = 0; i < CFG.trickleCount; i++) seedTrickle(i);

// ---------- 状态 ----------
const S = {
  progress: 0.32,        // 开场已有 1/3 沙落下，画面不空
  speed: 1,              // 0.6 / 1 / 1.8
  paused: false,
  flipping: false,
  flipT: 0,
  flipDur: 1.5,
};
const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// 翻转光环（仪式感）
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(1.9, 0.02, 12, 96),
  new THREE.MeshBasicMaterial({ color: CFG.sand, transparent: true, opacity: 0 })
);
ring.rotation.x = Math.PI / 2;
scene.add(ring);

// ---------- 翻转 ----------
function flip() {
  if (S.flipping) return;
  S.flipping = true; S.flipT = 0;
}

// ---------- 交互 ----------
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
let downX = 0, downY = 0;
renderer.domElement.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; });
renderer.domElement.addEventListener('pointerup', e => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return;   // 拖拽不算点击
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  if (ray.intersectObject(glass, true).length) flip();
});
document.getElementById('btn-flip').addEventListener('click', flip);
document.querySelectorAll('.speed').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.speed').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  S.speed = parseFloat(b.dataset.v);
}));
const btnPause = document.getElementById('btn-pause');
btnPause.addEventListener('click', () => {
  S.paused = !S.paused;
  btnPause.textContent = S.paused ? '继 续' : '暂 停';
  btnPause.classList.toggle('on', S.paused);
});

// 鼠标视差
let mx = 0, my = 0;
addEventListener('pointermove', e => {
  mx = (e.clientX / innerWidth - 0.5) * 2;
  my = (e.clientY / innerHeight - 0.5) * 2;
});

// ---------- 计时 DOM ----------
const elElapsed = document.getElementById('t-elapsed');
const elLeft = document.getElementById('t-left');
const elBar = document.getElementById('t-bar');
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- 主循环 ----------
const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 翻转动画：整组绕 Z 轴 180°，缓动
  if (S.flipping) {
    S.flipT += dt / S.flipDur;
    const k = Math.min(S.flipT, 1);
    glass.rotation.z = Math.PI * easeInOut(k);
    const rk = Math.sin(k * Math.PI);                    // 光环扩散
    ring.scale.setScalar(1 + rk * 0.9);
    ring.material.opacity = rk * 0.7;
    ring.position.y = Math.sin(k * Math.PI) * 0.4;
    if (k >= 1) {
      S.flipping = false;
      S.progress = 0;                                    // 沙堆清零重计
      glass.rotation.z = 0;                              // 复位（上下已互换，由 progress=0 体现）
      ring.material.opacity = 0;
    }
  } else if (!S.paused) {
    S.progress = Math.min(S.progress + (dt / CFG.totalSeconds) * S.speed, 1);
    if (S.progress >= 1) { /* 流尽：保持满堆，等待翻转 */ }
  }

  // 沙堆：下堆长高 / 上堆降低
  const p = S.progress;
  pileBot.scale.y = Math.max(0.03, p);
  pileTop.scale.y = Math.max(0.001, 1 - p);
  pileTop.visible = p < 0.995;
  const botTopY = CFG.floorY + CFG.pileMaxH * Math.max(0.03, p);
  const topSurfY = 0.14 + CFG.pileMaxH * Math.max(0.001, 1 - p);

  // 主沙流：细颈 → 下堆表面
  const flowing = !S.paused && !S.flipping && p < 1;
  const fallV = (2.6 * S.speed);
  for (let i = 0; i < CFG.streamCount; i++) {
    if (flowing) streamSeed[i] += (dt * fallV) / 2.2;
    if (streamSeed[i] > 1) streamSeed[i] -= 1;
    const s = streamSeed[i];
    const y = 0.12 - s * (0.12 - botTopY);
    const jr = 0.035 * (1 - s * 0.4);
    const a = s * 37.7 + i;
    streamPos.setXYZ(i, Math.cos(a) * jr, y, Math.sin(a) * jr);
  }
  streamPos.needsUpdate = true;
  stream.visible = flowing || S.flipping;

  // 顶部汇聚：上堆表面 → 细颈
  for (let i = 0; i < CFG.trickleCount; i++) {
    if (flowing) trickleSeed[i] += dt * fallV * 0.8;
    if (trickleSeed[i] > 1) trickleSeed[i] -= 1;
    const s = trickleSeed[i];
    const y = topSurfY - s * (topSurfY - 0.14);
    const r = 0.55 * (1 - s) + 0.03;
    const a = s * 21.3 + i * 2.4;
    tricklePos.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r);
  }
  tricklePos.needsUpdate = true;
  trickle.visible = flowing && p < 0.995;

  // 相机：视差 + 呼吸
  camera.position.x += ((mx * 0.55) - camera.position.x) * 0.04;
  camera.position.y += ((0.35 - my * 0.35) - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);
  glass.position.y = Math.sin(t * 0.8) * 0.03;
  glass.rotation.y = Math.sin(t * 0.22) * 0.08;

  // 计时
  const elapsed = p * CFG.totalSeconds;
  elElapsed.textContent = fmt(elapsed);
  elLeft.textContent = fmt(CFG.totalSeconds - elapsed);
  elBar.style.width = `${(p * 100).toFixed(1)}%`;

  renderer.render(scene, camera);
}
tick();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- loader + intro（4s 超时兜底） ----------
let booted = false;
function boot() {
  if (booted) return; booted = true;
  document.getElementById('loader').classList.add('done');
  document.querySelectorAll('[data-intro]').forEach(el => el.classList.add('is-in'));
}
requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(boot, 350)));
setTimeout(boot, 4000);
