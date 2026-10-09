/* lantern-3d · 孔明灯放飞 — original implementation
 * 夜空下 30–50 盏孔明灯缓缓升空、随风漂移；
 * 用户可写下愿望（≤12 字）放飞属于自己的一盏；
 * 点击任意一盏灯聚焦跟随 3 秒；风速滑杆影响漂移。
 */
import * as THREE from 'three';

const AMBER = 0xFFB45E;
const MOON = 0xE8EDF5;
const BG = 0x0B0E1A;
const EASE = (t) => 1 - Math.pow(1 - t, 3); // cubic-out，物理感 easing

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(BG, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(BG, 55, 130);

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 400
);
const CAM_HOME = new THREE.Vector3(0, 7.5, 46);
const LOOK_HOME = new THREE.Vector3(0, 9, 0);
camera.position.copy(CAM_HOME);
camera.lookAt(LOOK_HOME);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= canvas 纹理工具 ================= */
function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 灯罩纸纹理：暖橙渐变 + 纵向竹骨 + 底部火光透光
function paperTexture(wish) {
  return makeCanvas(256, 320, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#FFD9A0');
    grad.addColorStop(0.45, '#FFBE6E');
    grad.addColorStop(1, '#F49B3D');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    // 纵向竹骨线
    g.strokeStyle = 'rgba(146,74,20,.38)';
    g.lineWidth = 3;
    for (let i = 1; i < 6; i++) {
      const x = (w / 6) * i;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
    }
    // 顶部收口阴影
    const top = g.createLinearGradient(0, 0, 0, h * 0.22);
    top.addColorStop(0, 'rgba(120,58,14,.5)');
    top.addColorStop(1, 'rgba(120,58,14,0)');
    g.fillStyle = top; g.fillRect(0, 0, w, h * 0.22);
    // 底部火光透光
    const bot = g.createRadialGradient(w / 2, h * 0.94, 6, w / 2, h * 0.94, w * 0.62);
    bot.addColorStop(0, 'rgba(255,244,214,.95)');
    bot.addColorStop(0.5, 'rgba(255,205,120,.5)');
    bot.addColorStop(1, 'rgba(255,205,120,0)');
    g.fillStyle = bot; g.fillRect(0, 0, w, h);
    if (wish) {
      // 愿望竖排字，灯罩正中
      g.fillStyle = 'rgba(122,46,18,.92)';
      g.font = '600 46px "Songti SC","STSong","SimSun",serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const chars = wish.split('');
      const cx = w / 2, cy = h / 2;
      const step = 52;
      const startY = cy - ((chars.length - 1) * step) / 2;
      chars.forEach((ch, i) => g.fillText(ch, cx, startY + i * step));
    }
  });
}

// 径向光晕 sprite 纹理
const glowTexture = makeCanvas(128, 128, (g, w, h) => {
  const r = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
  r.addColorStop(0, 'rgba(255,220,160,1)');
  r.addColorStop(0.35, 'rgba(255,180,94,.55)');
  r.addColorStop(1, 'rgba(255,180,94,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
});

// 火焰 sprite 纹理
const flameTexture = makeCanvas(64, 96, (g, w, h) => {
  const r = g.createRadialGradient(w / 2, h * 0.66, 2, w / 2, h * 0.66, w * 0.55);
  r.addColorStop(0, 'rgba(255,246,220,1)');
  r.addColorStop(0.45, 'rgba(255,190,100,.85)');
  r.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
});

// 月亮纹理
const moonTexture = makeCanvas(256, 256, (g, w, h) => {
  const r = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
  r.addColorStop(0, '#F4F7FC');
  r.addColorStop(0.85, '#E8EDF5');
  r.addColorStop(1, 'rgba(232,237,245,.92)');
  g.fillStyle = r;
  g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2); g.fill();
  // 环形山（同色系深一点）
  g.fillStyle = 'rgba(180,190,210,.5)';
  const craters = [[86, 96, 22], [160, 130, 14], [120, 170, 26], [180, 88, 10], [70, 150, 12]];
  craters.forEach(([x, y, rr]) => {
    g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(200,208,226,.4)';
  });
});

// 远山剪影纹理（两层）
function ridgeTexture(seed) {
  return makeCanvas(1024, 160, (g, w, h) => {
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#000';
    g.beginPath(); g.moveTo(0, h);
    let y = h * (0.35 + rnd() * 0.25);
    for (let x = 0; x <= w; x += 32) {
      y += (rnd() - 0.5) * 56;
      y = Math.max(h * 0.12, Math.min(h * 0.72, y));
      g.lineTo(x, y);
    }
    g.lineTo(w, h); g.closePath(); g.fill();
  });
}

// 宝塔剪影纹理
const pagodaTexture = makeCanvas(256, 320, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#000';
  const cx = w / 2, base = h;
  g.fillRect(cx - 14, base - 60, 28, 60); // 塔身
  for (let i = 0; i < 5; i++) {           // 五层檐
    const y = base - 60 - i * 52;
    const half = 92 - i * 13;
    g.beginPath();
    g.moveTo(cx - half, y); g.lineTo(cx + half, y);
    g.lineTo(cx + half - 16, y - 16); g.lineTo(cx - half + 16, y - 16);
    g.closePath(); g.fill();
    g.fillRect(cx - 11, y - 52, 22, 38);  // 层身
  }
  g.beginPath();                          // 塔刹
  g.moveTo(cx, 6); g.lineTo(cx + 9, 30); g.lineTo(cx - 9, 30);
  g.closePath(); g.fill();
});

/* ================= 天空 ================= */
// 夜空穹顶：深蓝到近黑的垂直渐变
{
  const geo = new THREE.SphereGeometry(190, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vP; void main(){ vP=position;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vP; void main(){
      float t = clamp(normalize(vP).y*0.5+0.5, 0.0, 1.0);
      vec3 top = vec3(0.016,0.022,0.05);
      vec3 bot = vec3(0.043,0.055,0.102);
      gl_FragColor = vec4(mix(bot, top, pow(t,1.4)), 1.0); }`,
  });
  scene.add(new THREE.Mesh(geo, mat));
}

// 星点：两层，月白色，呼吸式微闪
const starLayers = [];
function makeStars(count, size, seed) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const az = rnd() * Math.PI * 2;
    const el = 0.08 + rnd() * 1.35;
    const r = 165;
    pos[i * 3] = r * Math.cos(el) * Math.cos(az);
    pos[i * 3 + 1] = r * Math.sin(el);
    pos[i * 3 + 2] = r * Math.cos(el) * Math.sin(az);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: MOON, size, transparent: true, opacity: 0.75,
    sizeAttenuation: false, depthWrite: false, fog: false,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  starLayers.push({ mat, phase: rnd() * Math.PI * 2, speed: 0.4 + rnd() * 0.5 });
}
makeStars(420, 1.6, 12345);
makeStars(160, 2.6, 67890);

// 月亮 + 月白光晕
{
  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(7, 48),
    new THREE.MeshBasicMaterial({ map: moonTexture, transparent: true, fog: false })
  );
  moon.position.set(-52, 62, -150);
  moon.lookAt(camera.position);
  scene.add(moon);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture, color: MOON, transparent: true, opacity: 0.32,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }));
  halo.scale.set(34, 34, 1);
  halo.position.copy(moon.position);
  scene.add(halo);
  starLayers.push({ mat: halo.material, phase: 1.2, speed: 0.25, base: 0.32 });
}

/* ================= 地面剪影 ================= */
function silhouettePlane(tex, w, h, x, y, z, color, opacity) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map: tex, color, transparent: true, opacity,
      alphaTest: 0.02, depthWrite: false, fog: false,
    })
  );
  m.position.set(x, y, z);
  scene.add(m);
}
silhouettePlane(ridgeTexture(20261), 260, 40, -30, 6, -95, 0x141B30, 0.9);
silhouettePlane(ridgeTexture(90917), 300, 34, 40, 4, -110, 0x0E1322, 1);
silhouettePlane(pagodaTexture, 26, 32, 58, 13, -88, 0x05070E, 1);

/* ================= 孔明灯 ================= */
const lanternGeo = new THREE.SphereGeometry(1, 22, 16);
lanternGeo.scale(1, 1.24, 1);
const rimGeo = new THREE.TorusGeometry(0.52, 0.055, 8, 20);
rimGeo.rotateX(Math.PI / 2);

const LANTERN_COUNT = 44;
const RISE_TOP = 46, RISE_BOTTOM = -7;
const lanterns = [];
const clickTargets = [];

function spawnLantern(wishText, near) {
  const tex = paperTexture(wishText);
  const bodyMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const body = new THREE.Mesh(lanternGeo, bodyMat);
  body.position.y = 0.35;

  const rimMat = new THREE.MeshBasicMaterial({ color: 0x6E3410, transparent: true });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.y = -0.86;

  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture, color: AMBER, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(5.2, 5.2, 1);

  const flameMat = new THREE.SpriteMaterial({
    map: flameTexture, color: 0xFFDCA8, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const flame = new THREE.Sprite(flameMat);
  flame.scale.set(0.85, 1.25, 1);
  flame.position.y = -0.72;

  const group = new THREE.Group();
  group.add(body, rim, glow, flame);

  const far = near ? 1 : 0;
  const depth = near ? 22 : (-28 + Math.random() * 38);
  const distScale = THREE.MathUtils.clamp(1 - (depth - 10) / 90, 0.55, 1.5);
  const s = (near ? 1.5 : 0.9 + Math.random() * 0.7) * distScale;
  group.scale.setScalar(s);

  group.position.set(
    near ? (Math.random() - 0.5) * 10 : (Math.random() - 0.5) * 110,
    near ? 1.5 : RISE_BOTTOM + Math.random() * (RISE_TOP - RISE_BOTTOM),
    depth
  );

  scene.add(group);
  const L = {
    group, body, bodyMat, rimMat, glowMat, flameMat, flame,
    speed: 1.1 + Math.random() * 1.4,
    phase: Math.random() * Math.PI * 2,
    swayFreq: 0.25 + Math.random() * 0.35,
    swayAmp: 0.8 + Math.random() * 1.6,
    flickSeed: Math.random() * 100,
    fade: 1, wish: !!wishText, far,
    mats: [bodyMat, rimMat, glowMat, flameMat],
  };
  body.userData.lantern = L;
  lanterns.push(L);
  clickTargets.push(body);
  return L;
}

for (let i = 0; i < LANTERN_COUNT; i++) spawnLantern(null, false);

// 回收一盏灯：沉到地平线下，换新位置重新升起
function recycle(L) {
  L.group.position.x = (Math.random() - 0.5) * 110;
  L.group.position.y = RISE_BOTTOM - Math.random() * 6;
  L.group.position.z = -28 + Math.random() * 38;
  L.fade = 0;
}

/* ================= 交互 ================= */
let windFactor = 0.76; // 滑杆 38 → 0~2 映射
const windInput = document.getElementById('wind');
const windVal = document.getElementById('windVal');
function windLabel(v) {
  if (v < 25) return '微风';
  if (v < 60) return '和风';
  return '强风';
}
function applyWind() {
  const v = +windInput.value;
  windFactor = (v / 100) * 2;
  windVal.textContent = windLabel(v);
}
windInput.addEventListener('input', applyWind);
applyWind();

const wishInput = document.getElementById('wish');
const releaseBtn = document.getElementById('release');
const wishCountEl = document.getElementById('wishCount');
const skyCountEl = document.getElementById('skyCount');
let wishReleased = 0;
const wishLanterns = [];

function releaseWish() {
  const text = wishInput.value.trim();
  if (!text) { wishInput.focus(); return; }
  const L = spawnLantern(text, true);
  wishLanterns.push(L);
  if (wishLanterns.length > 4) {
    const old = wishLanterns.shift();
    const i = lanterns.indexOf(old);
    if (i >= 0) lanterns.splice(i, 1);
    const j = clickTargets.indexOf(old.body);
    if (j >= 0) clickTargets.splice(j, 1);
    scene.remove(old.group);
    old.bodyMat.map.dispose();
    old.mats.forEach((m) => m.dispose());
  }
  wishReleased++;
  wishCountEl.textContent = wishReleased;
  wishInput.value = '';
  wishInput.blur();
  hideHint();
}
releaseBtn.addEventListener('click', releaseWish);
wishInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') releaseWish();
});

// 点击聚焦：跟随一盏灯 3 秒
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let focus = null; // { L, until }
function pickLantern(cx, cy) {
  pointer.x = (cx / window.innerWidth) * 2 - 1;
  pointer.y = -(cy / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickTargets, false);
  return hits.length ? hits[0].object.userData.lantern : null;
}
const hint = document.getElementById('hint');
let hintHidden = false;
function hideHint() {
  if (hintHidden) return;
  hintHidden = true;
  hint.classList.add('gone');
}
canvas.addEventListener('click', (e) => {
  const L = pickLantern(e.clientX, e.clientY);
  if (L) {
    focus = { L, until: performance.now() + 3000 };
    hideHint();
  }
});
// hover 微交互：悬停灯上变手形指针
let hoverTick = 0;
canvas.addEventListener('pointermove', (e) => {
  const now = performance.now();
  if (now - hoverTick < 120) return;
  hoverTick = now;
  canvas.style.cursor = pickLantern(e.clientX, e.clientY) ? 'pointer' : 'default';
});

/* ================= 动画 ================= */
const clock = new THREE.Clock();
const tmpV = new THREE.Vector3();
const driftScale = reduced ? 0.25 : 1;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 星点呼吸
  for (const s of starLayers) {
    s.mat.opacity = (s.base ?? 0.75) * (0.72 + 0.28 * Math.sin(t * s.speed + s.phase));
  }

  // 孔明灯
  for (const L of lanterns) {
    const p = L.group.position;
    p.y += L.speed * dt;
    const sway = Math.sin(t * L.swayFreq + L.phase) * L.swayAmp * windFactor * driftScale;
    p.x += sway * dt * 2.2;
    p.z += Math.cos(t * L.swayFreq * 0.7 + L.phase) * dt * 0.35 * driftScale;
    // 轻微摇摆，像被风托着
    L.group.rotation.z = Math.sin(t * 0.6 + L.phase) * 0.06 * (0.5 + windFactor);
    L.group.rotation.x = Math.cos(t * 0.45 + L.phase) * 0.04;

    // 火焰闪烁：亮度/尺寸抖动
    const fl = 0.75 + 0.25 * Math.sin(t * 11 + L.flickSeed)
             + 0.12 * Math.sin(t * 23 + L.flickSeed * 2);
    L.flame.scale.set(0.85 * (0.9 + 0.2 * fl), 1.25 * fl, 1);
    L.baseFlameOp = Math.min(1, 0.55 + 0.45 * fl);
    L.baseGlowOp = 0.5 + 0.12 * Math.sin(t * 3 + L.phase);

    // 顶部渐隐 → 回收到地面
    const fadeBand = 10;
    if (p.y > RISE_TOP - fadeBand) {
      L.fade = Math.max(0, (RISE_TOP - p.y) / fadeBand);
    } else if (p.y < RISE_BOTTOM + 4) {
      L.fade = Math.min(1, L.fade + dt * 0.5);
    } else {
      L.fade = Math.min(1, L.fade + dt * 2);
    }
    L.bodyMat.opacity = L.fade;
    L.rimMat.opacity = L.fade;
    L.glowMat.opacity = L.baseGlowOp * L.fade;
    L.flameMat.opacity = L.baseFlameOp * L.fade;

    if (p.y > RISE_TOP) recycle(L);
    if (Math.abs(p.x) > 75) p.x *= -0.98; // 漂太远弹回
  }

  // 相机：聚焦跟随 / 回家
  const now = performance.now();
  if (focus && now < focus.until) {
    const lp = focus.L.group.position;
    tmpV.set(lp.x * 0.82, lp.y + 1.6, lp.z + 11);
    camera.position.lerp(tmpV, 1 - Math.pow(0.0018, dt));
    camera.lookAt(lp.x, lp.y + 0.6, lp.z);
  } else {
    if (focus) focus = null;
    camera.position.lerp(CAM_HOME, 1 - Math.pow(0.02, dt));
    tmpV.copy(LOOK_HOME);
    // 让 lookAt 也平滑：用当前朝向插值
    const cur = new THREE.Vector3();
    camera.getWorldDirection(cur);
    const want = tmpV.sub(camera.position).normalize();
    cur.lerp(want, 1 - Math.pow(0.02, dt)).normalize();
    const look = camera.position.clone().add(cur.multiplyScalar(10));
    camera.lookAt(look);
  }

  renderer.render(scene, camera);
}
animate();

/* ================= loader 与入场 ================= */
let entered = false;
function enter() {
  if (entered) return;
  entered = true;
  document.getElementById('loader').classList.add('done');
  const items = document.querySelectorAll('[data-intro]');
  items.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 180 + i * 150));
}
// 首帧渲染后 + 最短展示 → 入场；3800ms 兜底
setTimeout(enter, 3800);
requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(enter, 900)));

/* ================= 自适应 ================= */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
