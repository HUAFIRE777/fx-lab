/* terrain-flyover-3d · 程序化地形低空漫游
 * huafire3d fx-lab — original implementation
 * 手法参考（未使用任何原站代码）：Google Earth Studio 式样条巡航运镜 + 滚动控速。
 * 地形/噪声/配色/运镜全部原创实现。
 */
import * as THREE from 'three';

/* ================= 配置 ================= */
const CFG = {
  seed: 20261009,
  terrainSize: 2400,      // 地形边长（世界单位）
  terrainSeg: 200,        // 网格分段（200x200）
  waterLevel: 0,
  baseSpeed: 34,          // 基础巡航速度 u/s
  maxBoost: 4,            // 滚动最大加速倍数
  cruiseAlt: 130,         // 巡航相对地形高度
  fogColor: 0x141b3d,
  fogDensity: 0.00072,
  sunColor: 0xffb066,
};

/* ================= 随机 + 噪声（原创实现） ================= */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise2D(rand) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  const perm = new Uint8Array(512), permMod12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; permMod12[i] = perm[i] % 12; }
  // 12 组梯度（permMod12 索引 0..11，需 24 个 float，缺一即越界 NaN）
  const grad = new Float32Array([1,1, -1,1, 1,-1, -1,-1, 1,0, -1,0, 1,0, -1,0, 0,1, 0,-1, 0,1, 0,-1]);
  const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
  return function (xin, yin) {
    let n0 = 0, n1 = 0, n2 = 0;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t), y0 = yin - (j - t);
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) { t0 *= t0; const g = permMod12[ii + perm[jj]] * 2; n0 = t0 * t0 * (grad[g] * x0 + grad[g + 1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) { t1 *= t1; const g = permMod12[ii + i1 + perm[jj + j1]] * 2; n1 = t1 * t1 * (grad[g] * x1 + grad[g + 1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) { t2 *= t2; const g = permMod12[ii + 1 + perm[jj + 1]] * 2; n2 = t2 * t2 * (grad[g] * x2 + grad[g + 1] * y2); }
    return 70 * (n0 + n1 + n2);
  };
}

const rand = mulberry32(CFG.seed);
const noise = makeNoise2D(rand);
const noiseM = makeNoise2D(mulberry32(CFG.seed ^ 0x9e37));

function fbm(nf, x, y, oct) {
  let v = 0, a = 0.5, f = 1, norm = 0;
  for (let o = 0; o < oct; o++) {
    v += a * nf(x * f, y * f);
    norm += a; a *= 0.5; f *= 2.03;
  }
  return v / norm;
}

/* 地形高度：起伏 fbm + 脊线山脉 */
function heightAt(x, z) {
  const base = fbm(noise, x * 0.0011, z * 0.0011, 5);
  const ridge = 1 - Math.abs(fbm(noise, x * 0.00068 + 13.7, z * 0.00068 - 7.1, 4));
  const m = Math.pow(Math.max(0, ridge), 1.7);
  return base * 62 + m * 235 - 42;
}
function moistureAt(x, z) {
  return fbm(noiseM, x * 0.0016 + 51.2, z * 0.0016 - 33.8, 3) * 0.5 + 0.5;
}

/* ================= 场景 ================= */
const container = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(CFG.fogColor, CFG.fogDensity);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 1, 12000);

/* 灯光：低角度暖阳 + 暮色半球光 */
const sunDir = new THREE.Vector3(-0.72, 0.20, 0.42).normalize();
const sun = new THREE.DirectionalLight(CFG.sunColor, 1.7);
sun.position.copy(sunDir).multiplyScalar(1200);
scene.add(sun);
scene.add(new THREE.HemisphereLight(0x5a6aa8, 0x11162e, 0.9));
scene.add(new THREE.AmbientLight(0x2a3358, 0.5));

/* 天空穹顶：暮色渐变 + 落日辉光（原创 shader） */
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: {
    sunDir: { value: sunDir },
    top: { value: new THREE.Color(0x05081a) },
    mid: { value: new THREE.Color(0x232c5c) },
    glow: { value: new THREE.Color(0xd97f3c) },
  },
  vertexShader: `
    varying vec3 vDir;
    void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    varying vec3 vDir;
    uniform vec3 sunDir, top, mid, glow;
    void main(){
      float h = clamp(vDir.y, -0.12, 1.0);
      vec3 col = mix(mid, top, pow(max(h, 0.0), 0.55));
      float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
      col += glow * pow(s, 9.0) * 0.85;          // 落日辉光
      col += glow * pow(s, 90.0) * 1.6;          // 日盘
      col = mix(col, vec3(0.10,0.12,0.26), smoothstep(0.0,-0.12,vDir.y)); // 地平线下压暗
      gl_FragColor = vec4(col, 1.0);
    }`,
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(7000, 32, 20), skyMat));

/* ================= 地形（分块生成，带进度） ================= */
const SIZE = CFG.terrainSize, SEG = CFG.terrainSeg;
const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
geo.rotateX(-Math.PI / 2);
const pos = geo.attributes.position;
const colors = new Float32Array(pos.count * 3);

const C = {
  deep:  new THREE.Color(0x131a3e),  // 深水/低洼
  shore: new THREE.Color(0x4c4a86),  // 湖岸
  vegA:  new THREE.Color(0x2c3a6e),  // 植被（干）
  vegB:  new THREE.Color(0x5f5ba0),  // 植被（湿）雾紫
  rock:  new THREE.Color(0x39355e),  // 岩石
  snow:  new THREE.Color(0xffb066),  // 雪顶染暖阳
  snowHi:new THREE.Color(0xf3ecff),  // 高光雪
};
const tmpC = new THREE.Color();

function paintVertex(i, x, z, h, moist) {
  if (h < CFG.waterLevel + 3) {
    tmpC.copy(C.deep).lerp(C.shore, THREE.MathUtils.clamp((h - CFG.waterLevel + 6) / 9, 0, 1));
  } else if (h < 26) {
    tmpC.copy(C.shore).lerp(C.vegA, (h - 3) / 23);
  } else if (h < 120) {
    tmpC.copy(C.vegA).lerp(C.vegB, moist).lerp(C.rock, THREE.MathUtils.clamp((h - 80) / 60, 0, 1) * 0.5);
  } else if (h < 195) {
    tmpC.copy(C.rock).lerp(C.vegB, 0.25 * (1 - (h - 120) / 75));
  } else {
    const k = THREE.MathUtils.clamp((h - 195) / 60, 0, 1);
    tmpC.copy(C.rock).lerp(C.snow, k);                       // 雪线染暖阳
    if (moist > 0.55) tmpC.lerp(C.snowHi, (moist - 0.55) * 1.4 * k); // 向阳高光
  }
  // 远山统一罩一层暮色
  const d = Math.hypot(x, z) / (SIZE * 0.5);
  tmpC.lerp(new THREE.Color(CFG.fogColor), Math.pow(d, 2) * 0.28);
  colors[i * 3] = tmpC.r; colors[i * 3 + 1] = tmpC.g; colors[i * 3 + 2] = tmpC.b;
}

const loadfill = document.getElementById('loadfill');
const loadpct = document.getElementById('loadpct');
const loader = document.getElementById('loader');

function buildTerrainChunked() {
  return new Promise((resolve) => {
    const rows = SEG + 1;
    let r = 0;
    const batch = 7;
    function step() {
      const end = Math.min(rows, r + batch);
      for (; r < end; r++) {
        for (let c = 0; c <= SEG; c++) {
          const i = r * (SEG + 1) + c;
          const x = pos.getX(i), z = pos.getZ(i);
          const h = heightAt(x, z);
          pos.setY(i, h);
          paintVertex(i, x, z, h, moistureAt(x, z));
        }
      }
      const pct = Math.round((r / rows) * 100);
      loadfill.style.width = pct + '%';
      loadpct.textContent = pct + '%';
      if (r < rows) requestAnimationFrame(step);
      else {
        pos.needsUpdate = true;
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        resolve();
      }
    }
    step();
  });
}

/* 湖泊水面 */
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x1a2450, transparent: true, opacity: 0.86,
  roughness: 0.25, metalness: 0.55,
});
const water = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), waterMat);
water.rotation.x = -Math.PI / 2;
water.position.y = CFG.waterLevel;

/* 云层 sprites（canvas 程序化云朵） */
function cloudTexture() {
  const s = 128, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const r2 = mulberry32(77);
  for (let k = 0; k < 26; k++) {
    const x = s * (0.2 + r2() * 0.6), y = s * (0.35 + r2() * 0.3);
    const rad = s * (0.08 + r2() * 0.14);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(226,216,248,0.55)');
    g.addColorStop(1, 'rgba(226,216,248,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  }
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}
const cloudTex = cloudTexture();
const clouds = [];
for (let i = 0; i < 34; i++) {
  const m = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.32 + rand() * 0.22, depthWrite: false, fog: false });
  const sp = new THREE.Sprite(m);
  const a = rand() * Math.PI * 2, rr = 200 + rand() * 900;
  sp.position.set(Math.cos(a) * rr, 250 + rand() * 190, Math.sin(a) * rr);
  const sc = 160 + rand() * 260;
  sp.scale.set(sc, sc * 0.42, 1);
  sp.userData.vx = 2 + rand() * 4;
  clouds.push(sp); scene.add(sp);
}

/* 落日辉光 sprite */
function glowTexture() {
  const s = 256, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  g.addColorStop(0, 'rgba(255,190,120,0.9)');
  g.addColorStop(0.35, 'rgba(255,150,90,0.35)');
  g.addColorStop(1, 'rgba(255,150,90,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}
const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
sunSprite.position.copy(sunDir).multiplyScalar(6200);
sunSprite.position.y = 320;
sunSprite.scale.set(2200, 2200, 1);
scene.add(sunSprite);

/* 稀疏星点（高空） */
{
  const n = 160, p = new Float32Array(n * 3);
  const sr = mulberry32(913);
  for (let i = 0; i < n; i++) {
    const a = sr() * Math.PI * 2, e = 0.35 + sr() * 1.1, rr = 6400;
    p[i*3] = Math.cos(a) * Math.cos(e) * rr;
    p[i*3+1] = Math.sin(e) * rr;
    p[i*3+2] = Math.sin(a) * Math.cos(e) * rr;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfc6f2, size: 4, sizeAttenuation: false, transparent: true, opacity: 0.45, fog: false })));
}

/* ================= 巡航样条 ================= */
const pathPts = [];
{
  const pr = mulberry32(4242);
  const N = 10;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr = 560 + pr() * 320;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const y = Math.max(heightAt(x, z), 20) + CFG.cruiseAlt + pr() * 70;
    pathPts.push(new THREE.Vector3(x, y, z));
  }
}
const curve = new THREE.CatmullRomCurve3(pathPts, true, 'centripetal', 0.6);
const pathLen = curve.getLength();

/* ================= 输入：滚动控速 / 视差 / 触摸 ================= */
let scrollBoost = 1, scrollBoostTarget = 1;
let lastScrollY = window.scrollY, scrollVel = 0, lastScrollT = performance.now();
window.addEventListener('scroll', () => {
  const now = performance.now();
  const dy = Math.abs(window.scrollY - lastScrollY);
  const dt = Math.max(16, now - lastScrollT);
  scrollVel = scrollVel * 0.82 + (dy / dt) * 1000 * 0.18; // px/s 平滑
  lastScrollY = window.scrollY; lastScrollT = now;
  scrollBoostTarget = THREE.MathUtils.clamp(1 + scrollVel / 850, 1, CFG.maxBoost);
}, { passive: true });

let parX = 0, parY = 0, parTX = 0, parTY = 0;   // 目标/当前视差
window.addEventListener('mousemove', (e) => {
  parTX = (e.clientX / window.innerWidth - 0.5) * 2;
  parTY = (e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });
let touchSX = 0, touchSY = 0;
window.addEventListener('touchstart', (e) => {
  const t = e.touches[0]; touchSX = t.clientX; touchSY = t.clientY;
}, { passive: true });
window.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  parTX = THREE.MathUtils.clamp((t.clientX - touchSX) / 160, -1, 1);
  parTY = THREE.MathUtils.clamp((t.clientY - touchSY) / 160, -1, 1);
}, { passive: true });
window.addEventListener('touchend', () => { parTX = 0; parTY = 0; }, { passive: true });

/* ================= HUD ================= */
const placenameEl = document.getElementById('placename');
const altEl = document.getElementById('alt');
const spdEl = document.getElementById('spd');
const speedvEl = document.getElementById('speedv');
const PLACES = ['苍峦山脉', '雾隐群峰', '落霞岭', '星沉谷', '紫霄原', '暮江源'];
let placeIdx = -1;
function updatePlace(x, z) {
  let a = Math.atan2(z, x);
  if (a < 0) a += Math.PI * 2;
  const idx = Math.floor(a / (Math.PI * 2 / PLACES.length)) % PLACES.length;
  if (idx !== placeIdx) {
    placeIdx = idx;
    placenameEl.style.opacity = '0';
    setTimeout(() => { placenameEl.textContent = PLACES[idx]; placenameEl.style.opacity = '1'; }, 420);
  }
}

/* ================= 控制条 ================= */
let cruising = true;
const cruiseBtn = document.getElementById('cruiseBtn');
const cruiseLabel = document.getElementById('cruiseLabel');
cruiseBtn.addEventListener('click', () => {
  cruising = !cruising;
  cruiseBtn.classList.toggle('paused', !cruising);
  cruiseBtn.setAttribute('aria-pressed', String(cruising));
  cruiseLabel.textContent = cruising ? '暂停巡航' : '开始巡航';
});

/* ================= 主循环 ================= */
const clock = new THREE.Clock();
let dist = 0, curSpeed = 0;
const camPos = new THREE.Vector3(), lookAt = new THREE.Vector3();
const tanA = new THREE.Vector3(), tanB = new THREE.Vector3();
let hudT = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 滚动加速：目标倍数衰减回 1（物理感 easing）
  scrollBoostTarget = Math.max(1, scrollBoostTarget - dt * 1.6);
  scrollBoost += (scrollBoostTarget - scrollBoost) * (1 - Math.exp(-dt * 3.2));

  const targetSpeed = cruising ? CFG.baseSpeed * scrollBoost : 0;
  curSpeed += (targetSpeed - curSpeed) * (1 - Math.exp(-dt * (cruising ? 1.6 : 2.6)));
  dist = (dist + curSpeed * dt) % pathLen;
  const u = dist / pathLen;

  curve.getPointAt(u, camPos);
  curve.getPointAt((u + 0.018) % 1, lookAt);
  curve.getTangentAt(u, tanA);
  curve.getTangentAt((u + 0.012) % 1, tanB);

  // 视差：鼠标/触摸轻微偏移（平滑跟随）
  parX += (parTX - parX) * (1 - Math.exp(-dt * 2.4));
  parY += (parTY - parY) * (1 - Math.exp(-dt * 2.4));
  const side = new THREE.Vector3().crossVectors(tanA, new THREE.Vector3(0, 1, 0)).normalize();
  camera.position.copy(camPos)
    .addScaledVector(side, parX * 26)
    .addScaledVector(new THREE.Vector3(0, 1, 0), -parY * 14);
  lookAt.addScaledVector(side, parX * 60);
  lookAt.y -= parY * 30;
  camera.lookAt(lookAt);

  // 压坡：按转弯给一点滚转
  const turn = tanA.x * tanB.z - tanA.z * tanB.x;
  const targetRoll = THREE.MathUtils.clamp(turn * 260, -0.09, 0.09) + parX * 0.02;
  camera.rotation.z += (targetRoll - camera.rotation.z) * (1 - Math.exp(-dt * 2.0));

  // 云漂移
  for (const c of clouds) {
    c.position.x += c.userData.vx * dt;
    if (c.position.x > 1150) c.position.x = -1150;
  }
  // 水面微光
  waterMat.opacity = 0.84 + Math.sin(t * 0.7) * 0.03;

  // HUD（节流）
  hudT += dt;
  if (hudT > 0.18) {
    hudT = 0;
    const gh = heightAt(camera.position.x, camera.position.z);
    const alt = Math.max(0, Math.round(camera.position.y - Math.max(gh, CFG.waterLevel)));
    const kmh = Math.round(curSpeed * 3.4);
    altEl.textContent = alt;
    spdEl.textContent = kmh;
    speedvEl.textContent = Math.round(curSpeed * 1.15);
    updatePlace(camera.position.x, camera.position.z);
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ================= 启动：分块生成 → 揭示 ================= */
curve.getPointAt(0, camPos);
camera.position.copy(camPos);
camera.lookAt(curve.getPointAt(0.02));

buildTerrainChunked().then(() => {
  const terrain = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0.02 })
  );
  scene.add(terrain);
  scene.add(water);
  frame();

  loader.classList.add('done');
  setTimeout(() => {
    loader.hidden = true;
    const hud = document.getElementById('hud');
    const dock = document.getElementById('dock');
    hud.hidden = false; dock.hidden = false;
    requestAnimationFrame(() => {
      hud.classList.add('is-in');
      setTimeout(() => dock.classList.add('is-in'), 260);
    });
  }, 900);
});
