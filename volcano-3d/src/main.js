// volcano-3d · 火山喷发
// 纪录片式火山 hero：噪声置换火山锥 + emissive 熔岩流 shader、CPU 熔岩粒子
// （抛物线喷发、落地冷却变色）、翻滚烟柱 sprite、火山口点光源辉光。
// 代码全部原创；three.js 仅作 WebGL 渲染器（vendor 本地文件）。
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const canvas = $('v'), loader = $('loader');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 常量 ----------
const BG = 0x0a0a0b, LAVA = 0xff4d00;
const CONE_H = 4.6, CONE_RT = 1.15, CONE_RB = 7.0;
const PMAX = 3000;                 // 熔岩粒子池
const SMOKE_N = 36;                // 烟团数
const GRAV = 5.4;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const damp = (cur, tgt, rate, dt) => cur + (tgt - cur) * (1 - Math.pow(rate, dt));
const lerp = (a, b, t) => a + (b - a) * t;

// 原创 2D value noise（CPU 侧山体置换用）
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(ix, iy), hash2(ix + 1, iy), ux),
              lerp(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), ux), uy);
}

// ---------- 渲染器 ----------
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  $('noWebgl').style.display = 'flex';
  loader.classList.add('done');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 22, 60);

const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 200);

// ---------- 灯光 ----------
const hemi = new THREE.HemisphereLight(0x3a3a44, 0x0a0a0b, 0.3);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xfff2e2, 0.0);
dir.position.set(8, 12, 6);
scene.add(dir);
// 火山口辉光：随喷发脉动的主光源
const craterLight = new THREE.PointLight(LAVA, 60, 34, 2);
craterLight.position.set(0, CONE_H + 0.6, 0);
scene.add(craterLight);
const rimLight = new THREE.PointLight(0xff7a1a, 18, 16, 2);
rimLight.position.set(0, CONE_H - 0.4, 0);
scene.add(rimLight);

// ---------- 地面 ----------
{
  const g = new THREE.CircleGeometry(46, 64);
  const m = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 1, metalness: 0 });
  const ground = new THREE.Mesh(g, m);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);
}

// ---------- 火山锥：噪声置换 + 熔岩流 emissive shader ----------
const uTime = { value: 0 };
const uFlow = { value: 0.9 };
let cone;
{
  const geo = new THREE.CylinderGeometry(CONE_RT, CONE_RB, CONE_H, 128, 30, true);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ang = Math.atan2(z, x);
    const r = Math.hypot(x, z);
    if (r < 1e-4) continue;
    const hFrac = (y + CONE_H / 2) / CONE_H;               // 0 底 → 1 顶
    const ridge = vnoise2(Math.cos(ang) * 2.2 + 5, Math.sin(ang) * 2.2 + y * 0.85);
    const detail = vnoise2(ang * 2.6 + 11, y * 2.1 + 3);
    const wob = (ridge - 0.5) * 1.15 * (1 - hFrac * 0.45) + (detail - 0.5) * 0.5;
    const rimJag = hFrac > 0.9 ? (vnoise2(ang * 5.5, 7.7) - 0.5) * 0.55 : 0;  // 火山口锯齿
    const nr = r + wob + rimJag;
    pos.setX(i, Math.cos(ang) * nr);
    pos.setZ(i, Math.sin(ang) * nr);
    pos.setY(i, y + (vnoise2(ang * 4.0, 1.3) - 0.5) * 0.22 * hFrac);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0x161618, roughness: 0.96, metalness: 0.04 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.uniforms.uFlow = uFlow;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLp = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vLp;
        uniform float uTime; uniform float uFlow;
        float vhash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(vhash(i), vhash(i + vec2(1.0, 0.0)), u.x),
                     mix(vhash(i + vec2(0.0, 1.0)), vhash(i + vec2(1.0, 1.0)), u.x), u.y); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float ang = atan(vLp.z, vLp.x);
          float hgt = clamp((vLp.y + ${(CONE_H / 2).toFixed(2)}) / ${CONE_H.toFixed(2)}, 0.0, 1.0);
          float warp = vnoise(vec2(ang * 7.0, vLp.y * 0.8)) * 1.6;
          float n  = vnoise(vec2(ang * 3.0 + warp, vLp.y * 1.15 - uTime * 0.55));
          float n2 = vnoise(vec2(ang * 9.0 - warp * 0.5, vLp.y * 2.6 - uTime * 0.95));
          float stream = smoothstep(0.64, 0.94, n * 0.70 + n2 * 0.40);
          float topGlow = smoothstep(0.30, 1.0, hgt);
          float lava = stream * mix(0.22, 1.0, topGlow) * uFlow;
          vec3 lavaCol = mix(vec3(0.42, 0.07, 0.0), vec3(1.0, 0.30, 0.0), stream);
          lavaCol = mix(lavaCol, vec3(1.0, 0.74, 0.28), smoothstep(0.78, 0.98, n) * topGlow);
          totalEmissiveRadiance += lavaCol * lava * 2.6;
        }`);
  };
  cone = new THREE.Mesh(geo, mat);
  cone.position.y = CONE_H / 2;
  scene.add(cone);
}

// ---------- 火山口：内壁 + 熔岩池 + 辉光盘 ----------
{
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(CONE_RT + 0.02, 0.70, 1.2, 64, 4, true),
    new THREE.MeshStandardMaterial({ color: 0x0e0e10, roughness: 1, side: THREE.DoubleSide })
  );
  inner.position.y = CONE_H - 0.58;
  scene.add(inner);

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(0.70, 48),
    new THREE.MeshBasicMaterial({ color: 0xff6a00 })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = CONE_H - 1.16;
  pool.name = 'pool';
  scene.add(pool);

  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 48),
    new THREE.MeshBasicMaterial({ color: LAVA, transparent: true, opacity: 0.30,
      blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = CONE_H + 0.06;
  halo.name = 'halo';
  scene.add(halo);
}

// ---------- 程序化 sprite 纹理 ----------
function radialTex(size, stops) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size/2, size/2, 1, size/2, size/2, size/2);
  for (const [o, col] of stops) grd.addColorStop(o, col);
  g.fillStyle = grd; g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
const dotTex = radialTex(64, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
// 烟：柔边圆 + 几团明暗斑，翻滚感来自多 sprite 叠加
const smokeTex = (() => {
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  const base = g.createRadialGradient(s/2, s/2, 4, s/2, s/2, s/2);
  base.addColorStop(0, 'rgba(255,255,255,.8)'); base.addColorStop(0.6, 'rgba(255,255,255,.30)');
  base.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = base; g.fillRect(0, 0, s, s);
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 12; i++) {
    const x = s/2 + (hash2(i, 1) - 0.5) * s * 0.55, y = s/2 + (hash2(i, 2) - 0.5) * s * 0.55;
    const r = 10 + hash2(i, 3) * 26;
    const b = g.createRadialGradient(x, y, 1, x, y, r);
    const dark = hash2(i, 4) > 0.5;
    b.addColorStop(0, dark ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.30)');
    b.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = b; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  return new THREE.CanvasTexture(c);
})();

// ---------- 熔岩粒子：CPU 抛物线池 ----------
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(PMAX * 3);
const pCol = new Float32Array(PMAX * 3);
const pVel = new Float32Array(PMAX * 3);
const pLife = new Float32Array(PMAX);      // 剩余
const pSpan = new Float32Array(PMAX);      // 总寿命
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const pMat = new THREE.PointsMaterial({
  size: 0.30, map: dotTex, vertexColors: true, transparent: true,
  blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
});
const points = new THREE.Points(pGeo, pMat);
points.frustumCulled = false;
scene.add(points);
let pCursor = 0;
const C_HOT = [1.0, 0.62, 0.20], C_MID = [1.0, 0.30, 0.02], C_COLD = [0.30, 0.06, 0.01];

function spawnParticle(speedK) {
  const i = pCursor; pCursor = (pCursor + 1) % PMAX;
  const a = Math.random() * Math.PI * 2, rr = Math.random() * 0.55;
  pPos[i*3] = Math.cos(a) * rr; pPos[i*3+1] = CONE_H + 0.15; pPos[i*3+2] = Math.sin(a) * rr;
  const up = (6.2 + Math.random() * 5.2) * speedK;
  const out = (0.4 + Math.random() * 2.6) * speedK;
  pVel[i*3] = Math.cos(a) * out; pVel[i*3+1] = up; pVel[i*3+2] = Math.sin(a) * out;
  pLife[i] = pSpan[i] = 1.6 + Math.random() * 1.4;
  pCol[i*3] = C_HOT[0]; pCol[i*3+1] = C_HOT[1]; pCol[i*3+2] = C_HOT[2];
}

// ---------- 烟柱：翻滚上升 sprite ----------
const smokes = [];
for (let i = 0; i < SMOKE_N; i++) {
  const m = new THREE.SpriteMaterial({ map: smokeTex, color: 0x84848c, transparent: true,
    opacity: 0, depthWrite: false });
  const s = new THREE.Sprite(m);
  s.userData = { age: Math.random(), dur: 6 + Math.random() * 5,
    seed: Math.random() * 100, x0: (Math.random() - 0.5) * 1.6 };
  scene.add(s); smokes.push(s);
}
const WIND = 1.35;   // 风向 +x

// ---------- 星空（暮档） ----------
let stars;
{
  const n = 420, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * 1.1 + 0.15, r = 90;
    arr[i*3] = Math.cos(a) * Math.cos(e) * r;
    arr[i*3+1] = Math.sin(e) * r;
    arr[i*3+2] = Math.sin(a) * Math.cos(e) * r;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9a9aa0, size: 0.55,
    transparent: true, opacity: 0.7, sizeAttenuation: false, depthWrite: false }));
  scene.add(stars);
}

// ---------- 状态 ----------
const S = {
  powerT: 4, power: 4,          // 喷发强度 1..10
  burst: 0,                     // 大喷发衰减 1→0
  lightT: 'dusk', light: 'dusk',
  lightMix: 0,                  // 0=暮 1=昼
  frames: 0, booted: false,
  ptr: { x: 0, y: 0, tx: 0, ty: 0 },
  drag: { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, down: false, lx: 0, ly: 0 },
  t: 0,
};

// ---------- 交互 ----------
const rng = $('rngPower'), out = $('outPower'), btnBurst = $('btnBurst'), sideState = $('sideState');
function paintRange() {
  const p = (rng.value - rng.min) / (rng.max - rng.min) * 100;
  rng.style.setProperty('--fill', p + '%');
}
rng.addEventListener('input', () => {
  S.powerT = +rng.value;
  out.textContent = rng.value + ' / 10';
  sideState.textContent = '喷发中 · 强度 ' + rng.value;
  paintRange();
});
paintRange();

let burstCool = 0;
btnBurst.addEventListener('click', () => {
  if (burstCool > 0) return;
  S.burst = 1;
  burstCool = 3;
  btnBurst.classList.add('cooling');
  sideState.textContent = '大喷发！';
  setTimeout(() => btnBurst.classList.remove('cooling'), 3000);
});

$('segLight').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  S.lightT = b.dataset.v;
  document.querySelectorAll('#segLight button').forEach(x =>
    x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
});

canvas.addEventListener('pointermove', (e) => {
  if (S.drag.down) {
    S.drag.tyaw = clamp(S.drag.tyaw + (e.clientX - S.drag.lx) * 0.004, -0.7, 0.7);
    S.drag.tpitch = clamp(S.drag.tpitch + (e.clientY - S.drag.ly) * 0.003, -0.18, 0.3);
    S.drag.lx = e.clientX; S.drag.ly = e.clientY;
  } else {
    S.ptr.tx = (e.clientX / innerWidth - 0.5) * 2;
    S.ptr.ty = (e.clientY / innerHeight - 0.5) * 2;
  }
});
canvas.addEventListener('pointerdown', (e) => {
  S.drag.down = true; S.drag.lx = e.clientX; S.drag.ly = e.clientY;
});
addEventListener('pointerup', () => { S.drag.down = false; });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- 主循环 ----------
const clock = new THREE.Clock();
const BG_DUSK = new THREE.Color(BG), BG_DAY = new THREE.Color(0x2b2b31);
const tmpBg = new THREE.Color();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  S.t += dt;
  const t = S.t;

  // 阻尼逼近
  S.power = damp(S.power, S.powerT, 0.12, dt);
  S.lightMix = damp(S.lightMix, S.lightT === 'day' ? 1 : 0, 0.10, dt);
  S.burst = Math.max(0, S.burst - dt * 0.22);
  burstCool = Math.max(0, burstCool - dt);
  S.ptr.x = damp(S.ptr.x, S.ptr.tx, 0.08, dt);
  S.ptr.y = damp(S.ptr.y, S.ptr.ty, 0.08, dt);
  S.drag.yaw = damp(S.drag.yaw, S.drag.tyaw, 0.14, dt);
  S.drag.pitch = damp(S.drag.pitch, S.drag.tpitch, 0.14, dt);

  const eff = S.power * (1 + S.burst * 3.2);      // 有效强度
  const speedK = 0.72 + S.power * 0.075 + S.burst * 0.9;
  uTime.value = t;
  uFlow.value = 0.55 + S.power * 0.085 + S.burst * 0.6;

  // 熔岩粒子：喷发 → 抛物线 → 落地冷却
  const spawnN = Math.floor((60 + S.power * 70 + S.burst * 900) * dt + Math.random());
  for (let k = 0; k < spawnN; k++) spawnParticle(speedK);
  for (let i = 0; i < PMAX; i++) {
    if (pLife[i] <= 0) { pPos[i*3+1] = -50; continue; }
    pLife[i] -= dt;
    pVel[i*3+1] -= GRAV * dt;
    pPos[i*3] += pVel[i*3] * dt;
    pPos[i*3+1] += pVel[i*3+1] * dt;
    pPos[i*3+2] += pVel[i*3+2] * dt;
    // 落地：山体表面近似 y = CONE_H*(1 - r/CONE_RB)；低于则冷却熄灭
    const r = Math.hypot(pPos[i*3], pPos[i*3+2]);
    const surfY = r < CONE_RB ? CONE_H * (1 - r / CONE_RB) : 0;
    if (pPos[i*3+1] <= surfY + 0.05) { pLife[i] = 0; pPos[i*3+1] = -50; continue; }
    const f = clamp(pLife[i] / pSpan[i], 0, 1);       // 1 新生 → 0 熄灭
    const c = f > 0.55 ? C_HOT : f > 0.25 ? C_MID : C_COLD;
    const blend = f > 0.55 ? (f - 0.55) / 0.45 : f > 0.25 ? (f - 0.25) / 0.30 : f / 0.25;
    const c2 = f > 0.55 ? C_MID : f > 0.25 ? C_COLD : C_COLD;
    pCol[i*3]   = lerp(c2[0], c[0], blend);
    pCol[i*3+1] = lerp(c2[1], c[1], blend);
    pCol[i*3+2] = lerp(c2[2], c[2], blend);
  }
  pGeo.attributes.position.needsUpdate = true;
  pGeo.attributes.color.needsUpdate = true;

  // 烟柱：上升翻滚 + 风力偏移
  const smokeRate = 0.75 + S.power * 0.07 + S.burst * 0.8;
  for (const s of smokes) {
    const u = s.userData;
    u.age += dt * smokeRate / u.dur;
    if (u.age >= 1) { u.age = 0; u.dur = 6 + Math.random() * 5; u.x0 = (Math.random() - 0.5) * 1.6; }
    const a = u.age;
    const rise = a * (13 + S.power * 0.5);
    const sway = Math.sin(a * 9 + u.seed) * (0.4 + a * 2.2);      // 翻滚摆动
    s.position.set(u.x0 + WIND * a * a * 7 + sway, CONE_H + 0.4 + rise, Math.cos(a * 7 + u.seed) * a * 1.6);
    const sc = 2.6 + a * 9.5;
    s.scale.set(sc, sc, 1);
    s.material.opacity = 0.55 * Math.sin(Math.PI * clamp(a, 0, 1)) * (1 - S.lightMix * 0.25);
    s.material.rotation = u.seed + a * (2 + u.seed % 3);           // 翻滚
  }

  // 火山口辉光：脉动 + 喷发闪烁
  const flick = vnoise2(t * 3.1, 7.7) * 0.5 + vnoise2(t * 7.3, 2.2) * 0.5;
  craterLight.intensity = (34 + S.power * 13) * (0.82 + flick * 0.36) + S.burst * 130;
  rimLight.intensity = 12 + S.power * 2.4 + S.burst * 40;
  const pool = scene.getObjectByName('pool');
  const halo = scene.getObjectByName('halo');
  const pulse = 1 + Math.sin(t * 2.6) * 0.07 + S.burst * 0.35;
  pool.scale.set(pulse, pulse, 1);
  pool.material.color.setHSL(0.045 + flick * 0.02, 1, 0.52 + flick * 0.06);
  halo.material.opacity = 0.26 + flick * 0.10 + S.burst * 0.25;
  halo.scale.set(pulse, pulse, 1);

  // 昼 / 暮
  const m = S.lightMix;
  tmpBg.copy(BG_DUSK).lerp(BG_DAY, m);
  scene.background.copy(tmpBg);
  scene.fog.color.copy(tmpBg);
  hemi.intensity = lerp(0.30, 1.05, m);
  dir.intensity = lerp(0.0, 0.85, m);
  stars.material.opacity = lerp(0.7, 0.0, m);

  // 相机：缓慢环绕 + 视差 + 拖拽 + 大喷发震屏
  const yaw = Math.sin(t * 0.06) * 0.22 + S.ptr.x * 0.10 + S.drag.yaw;
  const shake = S.burst * (reduceMotion ? 0 : 1);
  const sx = (Math.random() - 0.5) * 0.10 * shake, sy = (Math.random() - 0.5) * 0.08 * shake;
  const R = 15.8 - S.ptr.y * 0.6, cy = 4.6 + S.drag.pitch * 6 - S.ptr.y * 0.5;
  camera.position.set(Math.sin(yaw) * R + sx, cy + sy, Math.cos(yaw) * R);
  camera.lookAt(0, 3.1, 0);

  renderer.render(scene, camera);

  // 完成态：首帧 12 帧后 loader 淡出、data-intro 浮现（3.8s 内联兜底独立生效）
  if (!S.booted && ++S.frames >= 12) {
    S.booted = true;
    window.__volcanoDone();
  }
}
tick();
