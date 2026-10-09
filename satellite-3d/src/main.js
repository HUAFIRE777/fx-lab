import * as THREE from 'three';

/* ============================================================
   satellite-3d · 星环轨道
   程序化地球（昼夜纹理 + 晨昏线）+ 4 颗卫星轨道运行 + 信号下行波束
   纯程序化几何与画布纹理，零外部请求
   ============================================================ */

const DEG = Math.PI / 180;
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x04060c, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300);

/* ---------------- 值噪声 + fbm（手写原创） ---------------- */
function makeNoise(seed) {
  const p = new Uint8Array(512);
  const base = Array.from({ length: 256 }, (_, i) => i);
  let s = seed >>> 0;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0;[base[i], base[j]] = [base[j], base[i]]; }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  const fade = t => t * t * (3 - 2 * t);
  function n2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const h = (X, Y) => p[(p[(X & 255)] + (Y & 255)) & 511] / 255;
    const u = fade(xf), v = fade(yf);
    return h(xi, yi) * (1 - u) * (1 - v) + h(xi + 1, yi) * u * (1 - v) +
           h(xi, yi + 1) * (1 - u) * v + h(xi + 1, yi + 1) * u * v;
  }
  return n2;
}
const nz = makeNoise(20261009);
function fbm(x, y, oct) {
  let a = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { a += amp * nz(x * f, y * f); amp *= 0.5; f *= 2.03; }
  return a; // ~0..1
}
/* 大陆掩膜：经度无缝（x 用 cos/sin 映射） */
function landField(u, v) {
  const lon = u * Math.PI * 2;
  const x = Math.cos(lon), y = Math.sin(lon);
  return fbm(x * 1.8 + 7.3, y * 1.8 + v * 3.1, 5);
}
function isLand(u, v) {
  const lat = Math.abs(v - 0.5) * 2;             // 0 赤道 → 1 极
  const ice = lat > 0.86 + 0.05 * (nz(u * 9, v * 9) - 0.5) * 2;
  if (ice) return 2;                             // 2 = 冰盖
  const m = landField(u, v) + (1 - lat) * 0.06;
  return m > 0.52 ? 1 : 0;
}

/* ---------------- 程序化纹理 ---------------- */
function buildDayTexture() {
  const W = 1024, H = 512;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) {
    const v = y / H, lat = Math.abs(v - 0.5) * 2;
    for (let x = 0; x < W; x++) {
      const u = x / W, i = (y * W + x) * 4;
      const kind = isLand(u, v);
      if (kind === 2) {           // 冰盖：冷白蓝
        const t = nz(u * 40, v * 40) * 30;
        d[i] = 150 + t; d[i + 1] = 178 + t; d[i + 2] = 226; d[i + 3] = 255;
      } else if (kind === 1) {    // 陆地：深蓝→地球蓝高程
        const e = landField(u, v);
        const t = Math.min(1, (e - 0.52) / 0.3);
        d[i] = 20 + t * 46; d[i + 1] = 64 + t * 76; d[i + 2] = 132 + t * 90; d[i + 3] = 255;
      } else {                    // 海洋：地球蓝渐变
        const t = 1 - lat;
        d[i] = 8 + t * 12; d[i + 1] = 28 + t * 28; d[i + 2] = 76 + t * 56; d[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function buildNightTexture() {
  const W = 1024, H = 512;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#030509'; ctx.fillRect(0, 0, W, H);
  // 陆地微光底
  const img = ctx.getImageData(0, 0, W, H), d = img.data;
  for (let y = 0; y < H; y += 2) {
    const v = y / H;
    for (let x = 0; x < W; x += 2) {
      const u = x / W, k = isLand(u, v);
      if (k === 1) { const i = (y * W + x) * 4; d[i] = 10; d[i + 1] = 14; d[i + 2] = 26; }
    }
  }
  ctx.putImageData(img, 0, 0);
  // 城市灯光：陆地上成团随机点，暖橙
  let placed = 0, guard = 0;
  while (placed < 150 && guard++ < 4000) {
    const u = Math.random(), v = Math.random();
    if (isLand(u, v) !== 1) continue;
    const cx = u * W, cy = v * H;
    const n = 14 + (Math.random() * 40 | 0);
    for (let k = 0; k < n; k++) {
      const px = cx + (Math.random() - 0.5) * 26;
      const py = cy + (Math.random() - 0.5) * 16;
      const r = 0.6 + Math.random() * 1.6;
      const a = 0.35 + Math.random() * 0.6;
      ctx.fillStyle = `rgba(255,${140 + (Math.random() * 40 | 0)},40,${a.toFixed(2)})`;
      ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
    }
    placed++;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function buildCloudTexture() {
  const W = 512, H = 256;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      const lon = u * Math.PI * 2;
      let n = fbm(Math.cos(lon) * 2.2 + 3.1, Math.sin(lon) * 2.2 + v * 4.4, 4);
      n = Math.max(0, (n - 0.52)) * 3.2;         // 脊状云带
      const i = (y * W + x) * 4;
      const a = Math.min(1, n);
      d[i] = d[i + 1] = d[i + 2] = 235; d[i + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(c);
}
function glowSprite(color, size = 64) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color); g.addColorStop(0.35, color.replace(/[\d.]+\)$/, '0.45)')); g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------------- 场景 ---------------- */
const earthGroup = new THREE.Group();
scene.add(earthGroup);

const earthMat = new THREE.ShaderMaterial({
  uniforms: {
    uDay: { value: buildDayTexture() },
    uNight: { value: buildNightTexture() },
    uSun: { value: new THREE.Vector3(Math.cos(1.9), 0.28, Math.sin(1.9)).normalize() }
  },
  vertexShader: `
    varying vec2 vUv; varying vec3 vN; varying vec3 vWp;
    void main(){
      vUv = uv;
      vN = normalize(mat3(modelMatrix) * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWp = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: `
    varying vec2 vUv; varying vec3 vN; varying vec3 vWp;
    uniform sampler2D uDay; uniform sampler2D uNight; uniform vec3 uSun;
    void main(){
      vec3 N = normalize(vN);
      float d = dot(N, normalize(uSun));
      float dayMix = smoothstep(-0.06, 0.22, d);
      vec3 day = texture2D(uDay, vUv).rgb;
      vec3 night = texture2D(uNight, vUv).rgb;
      vec3 col = mix(night, day, dayMix);
      float dusk = exp(-pow(d / 0.16, 2.0));            // 晨昏线暖带（信号橙）
      col += vec3(1.0, 0.45, 0.12) * dusk * 0.45 * dayMix;
      col += vec3(0.10, 0.16, 0.32) * (1.0 - dayMix) * 0.25;  // 夜侧地球微光
      vec3 V = normalize(cameraPosition - vWp);
      float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
      col += vec3(0.25, 0.45, 1.0) * rim * (0.22 + 0.5 * dayMix);
      gl_FragColor = vec4(col, 1.0);
    }`
});
earthGroup.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), earthMat));

const cloudMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1.012, 64, 48),
  new THREE.MeshBasicMaterial({ map: buildCloudTexture(), transparent: true, opacity: 0.42, depthWrite: false })
);
earthGroup.add(cloudMesh);

/* 大气辉光 */
const atmo = new THREE.Mesh(
  new THREE.SphereGeometry(1.07, 64, 48),
  new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vN; varying vec3 vWp;
      void main(){ vN = normalize(mat3(modelMatrix)*normal);
        vec4 wp = modelMatrix*vec4(position,1.0); vWp = wp.xyz;
        gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vWp;
      void main(){ vec3 V = normalize(cameraPosition - vWp);
        float f = pow(1.0 - abs(dot(normalize(vN), V)), 2.6);
        gl_FragColor = vec4(vec3(0.25,0.5,1.0) * f * 1.5, f * 0.9); }`
  })
);
scene.add(atmo);

/* 星空 */
{
  const N = 1500, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 34 + Math.random() * 46;
    const t = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(t);
    pos[i * 3 + 1] = r * Math.cos(ph);
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(t);
    const b = 0.35 + Math.random() * 0.65, warm = Math.random() < 0.18;
    col[i * 3] = b * (warm ? 1 : 0.85); col[i * 3 + 1] = b * 0.9; col[i * 3 + 2] = b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false })));
}

/* ---------------- 卫星 ---------------- */
const MU = 398600; // km^3/s^2
const SATS = [
  { name: '天枢一号', code: 'TS-01 · NORAD 61001 · 通信', alt: 550,   inc: 53.0, node: 20,  r: 1.45, sig: '下行 2.1 Mbps · 链路正常' },
  { name: '天璇二号', code: 'TX-02 · NORAD 61002 · 遥感', alt: 1150,  inc: 87.9, node: 95,  r: 1.62, sig: '下行 4.8 Mbps · 链路正常' },
  { name: '天玑三号', code: 'TJ-03 · NORAD 61003 · 导航', alt: 20180, inc: 55.0, node: 170, r: 2.02, sig: '下行 0.6 Mbps · 链路正常' },
  { name: '玉衡四号', code: 'YH-04 · NORAD 61004 · 中继', alt: 35786, inc: 0.4,  node: 250, r: 2.42, sig: '下行 1.2 Mbps · 链路正常' },
];
SATS.forEach((s, i) => {
  const a = 6371 + s.alt;
  s.period = 2 * Math.PI * Math.sqrt(a ** 3 / MU);   // 秒（真实物理）
  s.speed = 2 * Math.PI * a / s.period;              // km/s
  s.phase = i * 1.7 + 0.4;
});
const T0 = SATS[0].period;
const beamTex = glowSprite('rgba(255,138,30,1)');
const sats = [];

SATS.forEach((def, idx) => {
  const g = new THREE.Group();
  scene.add(g);

  // 轨道环
  const ringPts = [];
  for (let i = 0; i <= 128; i++) { const t = i / 128 * Math.PI * 2; ringPts.push(new THREE.Vector3(Math.cos(t) * def.r, 0, Math.sin(t) * def.r)); }
  const ringMat = new THREE.LineBasicMaterial({ color: 0x2e7cf6, transparent: true, opacity: 0.28 });
  const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringPts), ringMat);
  ring.rotation.order = 'YXZ'; ring.rotation.y = def.node * DEG; ring.rotation.x = def.inc * DEG;
  scene.add(ring);

  // 星体：舱体 + 太阳能板
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.075),
    new THREE.MeshBasicMaterial({ color: 0xdfe8f8 }));
  g.add(body);
  const panelMat = new THREE.MeshBasicMaterial({ color: 0x2e7cf6 });
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.006, 0.05), panelMat);
  p1.position.x = 0.115; g.add(p1);
  const p2 = p1.clone(); p2.position.x = -0.115; g.add(p2);

  // 信标闪烁
  const beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: beamTex, color: 0xff8a1e, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  beacon.scale.setScalar(0.09); g.add(beacon);

  // 信号下行波束：holder 朝地心，锥体由星体向地面张开
  const holder = new THREE.Object3D(); g.add(holder);
  const L = def.r - 1.03;
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xff8a1e, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.005, L, 20, 1, true), beamMat);
  beam.rotation.x = Math.PI / 2;      // +Y → +Z（朝地）
  beam.position.z = L / 2;
  holder.add(beam);
  const spot = new THREE.Sprite(new THREE.SpriteMaterial({ map: beamTex, color: 0xff8a1e, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }));
  spot.scale.setScalar(0.16); spot.position.z = L;
  holder.add(spot);

  // 点击热区
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.satIdx = idx;
  g.add(hit);

  sats.push({ def, g, holder, beamMat, beacon, spot, ringMat, theta: def.phase, pos: new THREE.Vector3() });
});

function orbitPos(def, theta, out) {
  out.set(Math.cos(theta) * def.r, 0, Math.sin(theta) * def.r);
  out.applyEuler(new THREE.Euler(def.inc * DEG, def.node * DEG, 0, 'YXZ'));
  return out;
}

/* ---------------- 相机控制 ---------------- */
const cam = { mode: 'free', radius: 4.6, theta: 0.7, phi: 1.15, autoT: 0 };
const camTarget = new THREE.Vector3();
const desired = new THREE.Vector3(), desiredT = new THREE.Vector3();
let dragging = false, downX = 0, downY = 0, moved = 0, downT = 0;

function updateCamera(dt) {
  const followSat = sats[selIdx];
  let tGoal = desiredT.set(0, 0, 0), rGoal = cam.radius, phiGoal = cam.phi, auto = 0;
  if (cam.mode === 'follow' && followSat) {
    tGoal = desiredT.copy(followSat.pos);
    phiGoal = cam.phi;
    rGoal = Math.min(cam.radius, 3.2);
  } else if (cam.mode === 'polar') {
    phiGoal = 0.16; auto = 0.06;
  } else {
    auto = 0.045;
  }
  cam.autoT += dt;
  if (!dragging && cam.autoT > 2.5) cam.theta += dt * auto;
  const th = cam.theta, ph = cam.mode === 'polar' ? phiGoal : cam.phi;
  desired.set(
    tGoal.x + rGoal * Math.sin(ph) * Math.cos(th),
    tGoal.y + rGoal * Math.cos(ph),
    tGoal.z + rGoal * Math.sin(ph) * Math.sin(th)
  );
  const k = 1 - Math.exp(-dt * 3.2);
  camera.position.lerp(desired, k);
  camTarget.lerp(tGoal, k);
  camera.lookAt(camTarget);
}

canvas.addEventListener('pointerdown', e => {
  dragging = true; moved = 0; downT = performance.now();
  downX = e.clientX; downY = e.clientY;
  canvas.classList.add('dragging');
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - downX, dy = e.clientY - downY;
  moved += Math.abs(dx) + Math.abs(dy);
  downX = e.clientX; downY = e.clientY;
  cam.theta -= dx * 0.0052;
  cam.phi = Math.min(2.9, Math.max(0.15, cam.phi - dy * 0.004));
  cam.autoT = 0;
});
canvas.addEventListener('pointerup', e => {
  dragging = false;
  canvas.classList.remove('dragging');
  if (moved < 7 && performance.now() - downT < 450) handleClick(e);
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const lo = cam.mode === 'follow' ? 0.7 : 2.2, hi = cam.mode === 'follow' ? 3.2 : 9;
  cam.radius = Math.min(hi, Math.max(lo, cam.radius * (1 + e.deltaY * 0.0011)));
}, { passive: false });

/* ---------------- 点击卫星 → 信息卡 ---------------- */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
const card = document.getElementById('satcard');
let selIdx = 0;

function selectSat(i) {
  selIdx = i;
  const s = SATS[i];
  document.getElementById('sname').textContent = s.name;
  document.getElementById('scode').textContent = s.code;
  document.getElementById('ssig').textContent = s.sig;
  document.getElementById('salt').textContent = s.alt.toLocaleString() + ' km';
  document.getElementById('sinc').textContent = s.inc.toFixed(1) + '°';
  document.getElementById('sspd').textContent = s.speed.toFixed(2) + ' km/s';
  const m = s.period / 60;
  document.getElementById('sprd').textContent = m >= 90 ? (m / 60).toFixed(1) + ' h' : m.toFixed(1) + ' min';
  card.classList.add('show');
  sats.forEach((o, j) => {
    o.ringMat.color.set(j === i ? 0xff8a1e : 0x2e7cf6);
    o.ringMat.opacity = j === i ? 0.75 : 0.28;
  });
  hideHint();
}
function handleClick(e) {
  const r = canvas.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hits = ray.intersectObjects(sats.map(o => o.g.children.find(c => c.userData.satIdx !== undefined)));
  if (hits.length) selectSat(hits[0].object.userData.satIdx);
}
document.getElementById('satclose').addEventListener('click', () => card.classList.remove('show'));
document.getElementById('satfollow').addEventListener('click', () => setView('follow'));

/* ---------------- 视角切换 ---------------- */
function setView(v) {
  cam.mode = v;
  document.querySelectorAll('.views button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  if (v === 'follow') { cam.radius = Math.min(cam.radius, 1.6); if (cam.phi < 0.5) cam.phi = 1.1; }
  if (v === 'free' && cam.radius < 2.2) cam.radius = 4.6;
  if (v === 'polar' && cam.radius < 4) cam.radius = 6.2;
  hideHint();
}
document.querySelectorAll('.views button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

/* ---------------- 时间加速 ---------------- */
let timeScale = 24;
const slider = document.getElementById('tslider');
const tout = document.querySelector('.tscale output');
function syncSlider() {
  const pct = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  slider.style.setProperty('--fill', pct + '%');
  tout.textContent = '×' + slider.value;
  document.getElementById('tval').textContent = '×' + slider.value;
}
slider.addEventListener('input', () => { timeScale = +slider.value; syncSlider(); hideHint(); });
syncSlider();

/* ---------------- hint ---------------- */
let hintGone = false;
function hideHint() {
  if (hintGone) return; hintGone = true;
  document.getElementById('hint').classList.add('gone');
}
setTimeout(hideHint, 14000);

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
const sunDir = earthMat.uniforms.uSun.value;
let sunA = Math.atan2(sunDir.z, sunDir.x);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;
  const ts = timeScale;

  // 地球自转 + 云层 + 晨昏线推演
  earthGroup.rotation.y += dt * ts * (Math.PI * 2 / 140);
  cloudMesh.rotation.y += dt * ts * (Math.PI * 2 / 140) * 0.35;
  sunA += dt * ts * (Math.PI * 2 / 700);
  sunDir.set(Math.cos(sunA), 0.28, Math.sin(sunA)).normalize();

  // 卫星
  sats.forEach((o, i) => {
    const Tvis = 90 * (o.def.period / T0);          // 视觉周期 ∝ 真实周期比
    o.theta += dt * ts * (Math.PI * 2 / Tvis);
    orbitPos(o.def, o.theta, o.pos);
    o.g.position.copy(o.pos);
    o.holder.lookAt(0, 0, 0);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2 + i * 1.9);
    o.beamMat.opacity = 0.10 + pulse * 0.16;
    o.beacon.material.opacity = 0.35 + pulse * 0.65;
    o.beacon.scale.setScalar(0.07 + pulse * 0.05);
    const ss = 0.10 + pulse * 0.05;
    o.spot.scale.set(ss, ss, 1);
    // 选中卫星：信标加亮
    if (i === selIdx && card.classList.contains('show')) o.beacon.scale.setScalar(0.14 + pulse * 0.05);
  });

  updateCamera(dt);
  renderer.render(scene, camera);
}

/* ---------------- 启动 / 完成态 ---------------- */
let booted = false;
function boot() {
  if (booted) return; booted = true;
  animate();
  requestAnimationFrame(() => {
    document.getElementById('loader').classList.add('done');
    document.querySelectorAll('[data-intro]').forEach((el, i) => {
      setTimeout(() => el.classList.add('is-in'), 150 + i * 160);
    });
  });
}
boot();
setTimeout(boot, 4500); // loader 兜底

/* 验收探针（无头点击测试用，无界面影响） */
window.__satTest = { selectSat, setView, sats };
