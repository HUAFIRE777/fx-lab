import * as THREE from 'three';

/* ============ geyser-3d · 间歇泉喷发 ============
   地热山谷：蓄力→喷发→平息→休眠的完整间歇周期。
   水粒子 CPU 物理（抛物线 + 重力回卷）、billboard 蒸汽、
   程序化裂缝地热岩地形、一抹虹光。全部手写原创。
*/

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const BG = 0x1a1d21, INK = 0x7fd8e8, LAVA = 0xff9a3d;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(BG, 0.009);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1200);
const clock = new THREE.Clock();
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- JS 侧值噪声（地形位移用） ---------------- */
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return hash2(ix, iy) * (1 - ux) * (1 - uy) + hash2(ix + 1, iy) * ux * (1 - uy) +
         hash2(ix, iy + 1) * (1 - ux) * uy + hash2(ix + 1, iy + 1) * ux * uy;
}
function fbm2(x, y, oct) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; }
  return v;
}

/* ---------------- 天空穹顶 ---------------- */
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uHeat: { value: 0 } },
  vertexShader: `varying vec3 vDir;
    void main(){ vDir = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `varying vec3 vDir; uniform float uHeat;
    void main(){
      float h = clamp(vDir.y, -1.0, 1.0);
      vec3 top = vec3(0.012, 0.016, 0.022);
      vec3 hor = vec3(0.13, 0.15, 0.155);
      vec3 col = mix(hor, top, smoothstep(0.0, 0.65, h));
      col = mix(vec3(0.05, 0.055, 0.06), col, smoothstep(-0.25, 0.02, h));
      // 地平线处随喷发微微泛起暖意
      float band = pow(max(0.0, 1.0 - abs(h) * 5.0), 2.0);
      col += vec3(1.0, 0.55, 0.22) * band * uHeat * 0.10;
      gl_FragColor = vec4(col, 1.0);
    }`
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), skyMat));

/* ---------------- 星点 ---------------- */
{
  const N = 320, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = Math.random() * Math.PI * 2, p = Math.random() * 0.9 + 0.12;
    const r = 640;
    pos[i * 3] = Math.cos(t) * Math.cos(p) * r;
    pos[i * 3 + 1] = Math.sin(p) * r;
    pos[i * 3 + 2] = Math.sin(t) * Math.cos(p) * r;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xa8c8d8, size: 1.6, sizeAttenuation: false,
    transparent: true, opacity: 0.55, fog: false, depthWrite: false
  })));
}

/* ---------------- 地热岩地形（位移平面 + 裂缝 shader） ---------------- */
const groundUniforms = { uTime: { value: 0 }, uHeat: { value: 0 } };
{
  const geo = new THREE.PlaneGeometry(480, 480, 110, 110);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const d = Math.hypot(x, z);
    let h = (fbm2(x * 0.02 + 7, z * 0.02 - 3, 4) - 0.5) * 22;
    h *= THREE.MathUtils.smoothstep(d, 8, 46);           // 泉眼附近压平
    h += 2.6 * Math.exp(-((d - 6) * (d - 6)) / 14);        // 泉口岩环隆起
    h += 1.4 * Math.exp(-(d * d) / 18);                   // 泉心小丘
    p.setY(i, h);
  }
  geo.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    uniforms: groundUniforms,
    vertexShader: `varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      varying vec3 vW; uniform float uTime; uniform float uHeat;
      float hash(vec2 q){ return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
      float noi(vec2 q){ vec2 i = floor(q), f = fract(q); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y); }
      float fbm(vec2 q){ float v = 0.0, a = 0.5;
        for(int i = 0; i < 5; i++){ v += a * noi(q); q *= 2.03; a *= 0.5; } return v; }
      float ridge(vec2 q){ float v = 0.0, a = 0.55;
        for(int i = 0; i < 4; i++){ float n = noi(q); v += a * abs(n * 2.0 - 1.0);
          q *= 2.13; a *= 0.5; } return v; }
      void main(){
        vec2 q = vW.xz;
        float d = length(q);
        float rock = fbm(q * 0.045);
        vec3 base = mix(vec3(0.055, 0.06, 0.068), vec3(0.115, 0.12, 0.125), rock);
        base *= 0.85 + 0.3 * fbm(q * 0.35);              // 岩石颗粒感
        // 地热裂缝：只在泉眼周围 90m 内
        float r = ridge(q * 0.10 + rock * 0.9);
        float crack = smoothstep(0.60, 0.78, r) * (1.0 - smoothstep(28.0, 92.0, d));
        float pulse = 0.6 + 0.4 * sin(uTime * 1.6 + d * 0.32);
        vec3 lava = vec3(1.0, 0.60, 0.24);
        vec3 col = base + lava * crack * (0.30 + uHeat * 1.7) * pulse;
        // 泉口热晕
        col += lava * (1.0 - smoothstep(0.0, 15.0, d)) * uHeat * 0.16;
        // 手动雾：远处沉入夜色
        float f = 1.0 - exp(-pow(d * 0.009, 2.0));
        col = mix(col, vec3(0.102, 0.114, 0.129), f);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  scene.add(new THREE.Mesh(geo, mat));
}

/* ---------------- 泉口：岩环 + 热水盘 ---------------- */
const vent = new THREE.Group();
const ventRing = new THREE.Mesh(
  new THREE.TorusGeometry(3.4, 1.15, 14, 44),
  new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.95, metalness: 0.05 })
);
ventRing.rotation.x = -Math.PI / 2;
ventRing.position.y = 1.9;
vent.add(ventRing);
const hotDiscMat = new THREE.MeshStandardMaterial({
  color: 0x0d2b30, roughness: 0.35, metalness: 0.1,
  emissive: LAVA, emissiveIntensity: 0.12
});
const hotDisc = new THREE.Mesh(new THREE.CircleGeometry(3.1, 40), hotDiscMat);
hotDisc.rotation.x = -Math.PI / 2;
hotDisc.position.y = 1.55;
vent.add(hotDisc);
scene.add(vent);

/* ---------------- 灯光 ---------------- */
scene.add(new THREE.AmbientLight(0x39434c, 0.85));
const moon = new THREE.DirectionalLight(0x9fc4d4, 0.55);
moon.position.set(-40, 60, 30);
scene.add(moon);
const lavaLight = new THREE.PointLight(LAVA, 0, 60, 1.8);
lavaLight.position.set(0, 4, 0);
scene.add(lavaLight);
const sprayLight = new THREE.PointLight(INK, 0, 90, 1.6);
sprayLight.position.set(0, 24, 0);
scene.add(sprayLight);

/* ---------------- canvas 精灵纹理 ---------------- */
function radialTex(size, stops) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  return t;
}
const dropTex = radialTex(64, [
  [0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,.85)'], [1, 'rgba(255,255,255,0)']
]);
const puffTex = radialTex(128, [
  [0, 'rgba(255,255,255,.75)'], [0.5, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']
]);

/* ---------------- 水粒子（CPU 物理点池） ---------------- */
const WATER_MAX = 4200;
const wPos = new Float32Array(WATER_MAX * 3);
const wVel = new Float32Array(WATER_MAX * 3);
const wAge = new Float32Array(WATER_MAX);
const wLife = new Float32Array(WATER_MAX);
const wSize = new Float32Array(WATER_MAX);
const wAlpha = new Float32Array(WATER_MAX);
let wCursor = 0;
const GRAV = 24;

const waterGeo = new THREE.BufferGeometry();
waterGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3));
waterGeo.setAttribute('aSize', new THREE.BufferAttribute(wSize, 1));
waterGeo.setAttribute('aAlpha', new THREE.BufferAttribute(wAlpha, 1));
const waterMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uMap: { value: dropTex }, uColor: { value: new THREE.Color(INK) } },
  vertexShader: `attribute float aSize; attribute float aAlpha; varying float vA;
    void main(){ vA = aAlpha;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * 160.0 / max(1.0, -mv.z);
      gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform sampler2D uMap; uniform vec3 uColor; varying float vA;
    void main(){ vec4 t = texture2D(uMap, gl_PointCoord);
      gl_FragColor = vec4(uColor, t.a * vA); }`
});
const water = new THREE.Points(waterGeo, waterMat);
water.frustumCulled = false;
scene.add(water);
for (let i = 0; i < WATER_MAX; i++) { wPos[i * 3 + 1] = -50; wAlpha[i] = 0; }

let emitAcc = 0;
function spawnDrop(vy, spread, size) {
  const i = wCursor; wCursor = (wCursor + 1) % WATER_MAX;
  const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 1.6;
  wPos[i * 3] = Math.cos(a) * r;
  wPos[i * 3 + 1] = 1.8;
  wPos[i * 3 + 2] = Math.sin(a) * r;
  wVel[i * 3] = (Math.random() - 0.5) * spread;
  wVel[i * 3 + 1] = vy * (0.9 + Math.random() * 0.2);
  wVel[i * 3 + 2] = (Math.random() - 0.5) * spread;
  wAge[i] = 0;
  wLife[i] = (wVel[i * 3 + 1] + Math.sqrt(wVel[i * 3 + 1] ** 2 + 2 * GRAV * 1.8)) / GRAV;
  wSize[i] = size * (0.7 + Math.random() * 0.6);
  wAlpha[i] = 0;
}

/* ---------------- 蒸汽（billboard 精灵池） ---------------- */
const STEAM_MAX = 80;
const steams = [];
for (let i = 0; i < STEAM_MAX; i++) {
  const m = new THREE.SpriteMaterial({
    map: puffTex, color: 0xbfe6ef, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.NormalBlending
  });
  const s = new THREE.Sprite(m);
  s.visible = false;
  scene.add(s);
  steams.push({ s, age: 0, life: 1, rise: 1, grow: 3, active: false });
}
let steamCursor = 0;
function spawnSteam(x, y, z, big) {
  const st = steams[steamCursor]; steamCursor = (steamCursor + 1) % STEAM_MAX;
  st.active = true; st.age = 0;
  st.life = 3.5 + Math.random() * 3;
  st.rise = (0.9 + Math.random() * 0.8) * (big ? 1.5 : 1);
  st.grow = (2.2 + Math.random() * 2) * (big ? 1.6 : 1);
  st.s.position.set(x + (Math.random() - 0.5) * 3, y, z + (Math.random() - 0.5) * 3);
  const sc = (big ? 7 : 4) + Math.random() * 2;
  st.s.scale.set(sc, sc, 1);
  st.s.visible = true;
}

/* ---------------- 虹光：一道极淡的弧形光晕（喷发时出现一次） ---------------- */
const bowTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.translate(128, 150);
  // 宽而淡的主弧（泉水青白），内缘一丝暖
  for (let r = 118; r > 88; r -= 3) {
    const t = (118 - r) / 30; // 0 外缘 → 1 内缘
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI * 1.08, Math.PI * 1.92);
    const warm = t > 0.8 ? 40 : 0;
    ctx.strokeStyle = `rgba(${150 + warm},${225},${238},${0.05 + t * 0.045})`;
    ctx.lineWidth = 3.4;
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
})();
const bowMat = new THREE.SpriteMaterial({
  map: bowTex, transparent: true, opacity: 0,
  depthWrite: false, blending: THREE.AdditiveBlending
});
const rainbow = new THREE.Sprite(bowMat);
rainbow.scale.set(34, 34, 1);
rainbow.position.set(19, 15, -6);
rainbow.visible = false;
scene.add(rainbow);

/* ---------------- 喷发周期状态机 ---------------- */
const PHASES = [
  { id: 'dormant', name: '休眠', dur: 14 },
  { id: 'charge', name: '蓄力', dur: 6 },
  { id: 'eruption', name: '喷发', dur: 9 },
  { id: 'settle', name: '平息', dur: 5 },
];
const TOTAL = PHASES.reduce((s, p) => s + p.dur, 0);
let auto = !reduced;
let phaseIdx = 0, phaseT = 0;
let miniT = 0;              // 点击泉眼的小喷发剩余时间
let level = 6;
let curHeight = 0;          // 当前水柱高度（读数用）
const colH = (lv) => 30 + ((lv - 1) / 9) * 30;

const phaseNameEl = document.getElementById('phaseName');
const colHEl = document.getElementById('colH');
const phaseFill = document.getElementById('phaseFill');
const cycleVal = document.getElementById('cycleVal');
const levelInput = document.getElementById('level');
const levelVal = document.getElementById('levelVal');
const eruptBtn = document.getElementById('eruptBtn');
const autoBtn = document.getElementById('autoBtn');
const hint = document.getElementById('hint');

function syncUI() {
  levelVal.textContent = `${level} 级 · ${Math.round(colH(level))}m`;
  autoBtn.classList.toggle('on', auto);
  cycleVal.textContent = auto ? '自动循环' : '已暂停';
}
levelInput.addEventListener('input', () => { level = +levelInput.value; syncUI(); });
eruptBtn.addEventListener('click', () => {
  phaseIdx = PHASES.findIndex(p => p.id === 'eruption');
  phaseT = 0; miniT = 0; hideHint();
});
autoBtn.addEventListener('click', () => { auto = !auto; syncUI(); });
function hideHint() { hint.classList.add('gone'); }

/* 点击泉眼 → 小喷发（射线判泉口附近 9m） */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.8);
const hitP = new THREE.Vector3();
canvas.addEventListener('click', (e) => {
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (raycaster.ray.intersectPlane(groundPlane, hitP)) {
    if (Math.hypot(hitP.x, hitP.z) < 9) {
      miniT = 2.8; hideHint();
    }
  }
});

/* ---------------- 相机：缓慢环绕 + 鼠标/触屏视差 ---------------- */
let orbitA = 0.6;
const orbitR = 74, orbitH = 27;
const lookTarget = new THREE.Vector3(0, 18, 0);
const par = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('pointermove', (e) => {
  par.tx = (e.clientX / window.innerWidth - 0.5) * 2;
  par.ty = (e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

/* ---------------- 主循环 ---------------- */
let heat = 0;                 // 地热强度 0..1（裂缝/灯光/天空共用）
let bowA = 0;                 // 虹光包络 0..1
let frames = 0;
const phaseLabel = { dormant: '休眠', charge: '蓄力', eruption: '喷发', settle: '平息' };

function emissionFor(phase, dt) {
  const h = colH(level);
  const vy = Math.sqrt(2 * GRAV * h);
  if (miniT > 0) {
    emitAcc += 640 * dt;
    while (emitAcc >= 1) { emitAcc--; spawnDrop(Math.sqrt(2 * GRAV * 38), 9, 1.5); }
    return;
  }
  if (!auto) return;
  if (phase === 'eruption') {
    emitAcc += (420 + level * 105) * dt;
    while (emitAcc >= 1) { emitAcc--; spawnDrop(vy, 10, 1.9); }
  } else if (phase === 'charge') {
    emitAcc += 80 * dt;                                  // 冒泡
    while (emitAcc >= 1) { emitAcc--; spawnDrop(vy * 0.12, 4, 1.0); }
    if (Math.random() < dt * 0.9) {                      // 试探性小冲
      for (let k = 0; k < 26; k++) spawnDrop(vy * 0.28, 5, 1.2);
    }
  } else if (phase === 'settle') {
    emitAcc += 55 * dt;
    while (emitAcc >= 1) { emitAcc--; spawnDrop(vy * 0.1, 5, 1.0); }
  }
}

function updateWater(dt) {
  for (let i = 0; i < WATER_MAX; i++) {
    if (wAlpha[i] <= 0 && wAge[i] >= wLife[i]) continue;
    wAge[i] += dt;
    const k = i * 3;
    wVel[k + 1] -= GRAV * dt;
    wPos[k] += wVel[k] * dt;
    wPos[k + 1] += wVel[k + 1] * dt;
    wPos[k + 2] += wVel[k + 2] * dt;
    if (wPos[k + 1] < 0.4 || wAge[i] >= wLife[i]) {
      if (wVel[k + 1] < -9 && Math.random() < 0.10)       // 落地激起水雾
        spawnSteam(wPos[k], 1.2, wPos[k + 2], false);
      wAlpha[i] = 0; wAge[i] = wLife[i]; wPos[k + 1] = -50;
      continue;
    }
    const t = wAge[i] / wLife[i];
    wAlpha[i] = Math.min(1, wAge[i] * 7) * (1 - t * t) * 0.85;
  }
  waterGeo.attributes.position.needsUpdate = true;
  waterGeo.attributes.aAlpha.needsUpdate = true;
  waterGeo.attributes.aSize.needsUpdate = true;
}

function updateSteam(dt, phase) {
  // 环境蒸汽：喷发/平息多，休眠偶尔一缕
  const rate = miniT > 0 ? 6 : !auto ? 1.2 :
    phase === 'eruption' ? 9 : phase === 'settle' ? 7 :
    phase === 'charge' ? 3.5 : 1.4;
  if (Math.random() < rate * dt) spawnSteam(0, 2.5, 0, phase === 'eruption');
  for (const st of steams) {
    if (!st.active) continue;
    st.age += dt;
    if (st.age >= st.life) { st.active = false; st.s.visible = false; continue; }
    st.s.position.y += st.rise * dt;
    st.s.position.x += Math.sin(st.age * 0.9 + st.life) * dt * 0.8;
    const ns = st.s.scale.x + st.grow * dt;
    st.s.scale.set(ns, ns, 1);
    const t = st.age / st.life;
    st.s.material.opacity = 0.30 * Math.sin(Math.PI * Math.min(1, t));
  }
}

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  /* --- 相位推进 --- */
  let phase = PHASES[phaseIdx].id;
  if (miniT > 0) {
    miniT -= dt;
  } else if (auto) {
    phaseT += dt;
    if (phaseT >= PHASES[phaseIdx].dur) {
      phaseT = 0;
      phaseIdx = (phaseIdx + 1) % PHASES.length;
      phase = PHASES[phaseIdx].id;
    }
  }

  /* --- 热度包络 --- */
  const heatTarget =
    miniT > 0 ? 1 :
    !auto ? 0.08 :
    phase === 'eruption' ? 1 :
    phase === 'charge' ? 0.45 + 0.35 * (phaseT / PHASES[phaseIdx].dur) :
    phase === 'settle' ? 0.4 : 0.08;
  heat += (heatTarget - heat) * Math.min(1, dt * 2.2);
  groundUniforms.uTime.value = t;
  groundUniforms.uHeat.value = heat;
  skyMat.uniforms.uHeat.value = heat;
  lavaLight.intensity = heat * 55;
  sprayLight.intensity = (miniT > 0 || (auto && phase === 'eruption')) ? 40 : heat * 12;
  hotDiscMat.emissiveIntensity = 0.10 + heat * 1.3;
  ventRing.scale.setScalar(1 + heat * 0.02 * Math.sin(t * 9));   // 蓄力时岩环微颤

  /* --- 发射与更新 --- */
  emissionFor(phase, dt);
  updateWater(dt);
  updateSteam(dt, phase);

  /* --- 虹光：只在喷发中段出现一次，极淡 --- */
  const bowOn = miniT > 0 || (auto && phase === 'eruption');
  bowA += ((bowOn ? 1 : 0) - bowA) * Math.min(1, dt * 1.4);
  bowMat.opacity = bowA * 0.16;
  rainbow.visible = bowMat.opacity > 0.004;
  rainbow.position.y = 15 + Math.sin(t * 0.5) * 1.5;

  /* --- 水柱高度读数 --- */
  const erupting = miniT > 0 || (auto && phase === 'eruption');
  curHeight += ((erupting ? (miniT > 0 ? 38 : colH(level)) : 0) - curHeight) * Math.min(1, dt * 3);
  phaseNameEl.textContent = miniT > 0 ? '小喷发' : phaseLabel[phase];
  colHEl.textContent = curHeight < 2 ? '—' : `${Math.round(curHeight)}m`;

  /* --- 周期进度条 --- */
  if (auto && miniT <= 0) {
    let done = phaseT;
    for (let i = 0; i < phaseIdx; i++) done += PHASES[i].dur;
    phaseFill.style.width = `${(done / TOTAL) * 100}%`;
  } else if (miniT > 0) {
    phaseFill.style.width = `${(1 - miniT / 2.8) * 100}%`;
  }

  /* --- 相机 --- */
  orbitA += dt * (reduced ? 0.012 : 0.038);
  par.x += (par.tx - par.x) * Math.min(1, dt * 3);
  par.y += (par.ty - par.y) * Math.min(1, dt * 3);
  camera.position.set(
    Math.cos(orbitA) * orbitR + par.x * 7,
    orbitH - par.y * 4,
    Math.sin(orbitA) * orbitR
  );
  camera.lookAt(lookTarget);

  renderer.render(scene, camera);

  /* --- loader / intro --- */
  frames++;
  if (frames === 24) complete();
}

function complete() {
  document.getElementById('loader').classList.add('done');
  const els = document.querySelectorAll('[data-intro]');
  els.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 120 + i * 150));
  setTimeout(hideHint, 9000);
}
setTimeout(() => { if (frames < 24) complete(); }, 3800);   // loader 兜底

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

syncUI();
tick();
