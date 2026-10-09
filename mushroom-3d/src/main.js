import * as THREE from 'three';

/* mushroom-3d · 荧光蘑菇森林
 * 主视觉：程序化荧光蘑菇群 + 萤火虫 lissajous 粒子 + FBM 地面雾。
 * 交互：点蘑菇泛涟漪 / 孢子按钮 burst / 荧光强度 & 夜色浓度滑杆。
 * huafire3d fx-lab — original implementation
 */

const $ = (id) => document.getElementById(id);
const canvas = $('v');
const loader = $('loader');

const MOBILE = window.matchMedia('(pointer:coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 640;

// ---------------- 配置参数 ----------------
const CFG = {
  shroomN: MOBILE ? 30 : 48,     // 蘑菇数量（桌面 48 / 移动 30）
  flyN: MOBILE ? 70 : 140,       // 萤火虫数量
  sporeN: MOBILE ? 300 : 600,    // 孢子粒子池
  ringPool: 5,                   // 涟漪光波池
  pulseRadius: 4.2,              // 点击涟漪影响半径
  pulseDecay: 2.2,               // 脉冲衰减
  ringLife: 1.15,                // 涟漪时长 s
};

const COL = {
  bg: 0x070b08,
  glow: 0x5cffb1,
  warm: 0xff9e57,
  glowCss: new THREE.Color(0x5cffb1),
  warmCss: new THREE.Color(0xff9e57),
};

// ---------------- 渲染器 / 场景 ----------------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.6 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(COL.bg, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(COL.bg, 0.05);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);
const CAM_BASE = new THREE.Vector3(0, 3.5, 11.6);
camera.position.copy(CAM_BASE);
camera.lookAt(0, 1.3, 0);

// ---------------- 灯光（真 point light 只放 2 盏，其余靠 sprite 光晕） ----------------
const hemi = new THREE.HemisphereLight(0x1d3a2a, 0x030504, 0.5);
scene.add(hemi);
const amb = new THREE.AmbientLight(0x0a140e, 0.6);
scene.add(amb);

const keyLight = new THREE.PointLight(COL.glow, 34, 22, 2);
keyLight.position.set(-3.4, 2.8, 2.6);
scene.add(keyLight);
const warmLight = new THREE.PointLight(COL.warm, 22, 18, 2);
warmLight.position.set(3.6, 2.0, -2.4);
scene.add(warmLight);

// ---------------- 地面 ----------------
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(34, 48),
  new THREE.MeshStandardMaterial({ color: 0x080d09, roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ---------------- FBM 地面雾（shader plane，缓慢流动） ----------------
const fogUniforms = {
  uTime: { value: 0 },
  uGlow: { value: 1 },
};
const fogMat = new THREE.ShaderMaterial({
  uniforms: fogUniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime, uGlow;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
                 mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for(int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; }
      return v;
    }
    void main(){
      vec2 p = vUv * 6.0;
      float q = fbm(p + vec2(uTime * 0.045, uTime * 0.030));
      float r = fbm(p * 1.6 - vec2(uTime * 0.060, 0.0) + q);
      float d = distance(vUv, vec2(0.5));
      float mask = smoothstep(0.5, 0.12, d);
      float a = smoothstep(0.32, 0.85, r) * mask * 0.10 * uGlow;
      vec3 c = mix(vec3(0.05, 0.10, 0.07), vec3(0.36, 1.0, 0.69), smoothstep(0.30, 0.90, r));
      gl_FragColor = vec4(c, a);
    }
  `,
});
const fogPlane = new THREE.Mesh(new THREE.PlaneGeometry(48, 48), fogMat);
fogPlane.rotation.x = -Math.PI / 2;
fogPlane.position.y = 0.02;
scene.add(fogPlane);

// ---------------- 远景树影（雾气纵深） ----------------
{
  const treeMat = new THREE.MeshBasicMaterial({ color: 0x030503 });
  const treeGeo = new THREE.ConeGeometry(1, 1, 7);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + Math.random() * 0.24;
    const r = 15 + Math.random() * 8;
    const h = 6 + Math.random() * 9;
    const t = new THREE.Mesh(treeGeo, treeMat);
    t.scale.set(1.6 + Math.random() * 1.8, h, 1.6 + Math.random() * 1.8);
    t.position.set(Math.cos(a) * r, h / 2 - 0.4, Math.sin(a) * r);
    scene.add(t);
  }
}

// ---------------- 光晕 sprite 纹理（canvas 手绘） ----------------
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.32, 'rgba(255,255,255,0.30)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const glowTex = makeGlowTexture();

// ---------------- 蘑菇群（程序化建模：菌柄 cylinder + 菌盖 squashed sphere） ----------------
const stemGeo = new THREE.CylinderGeometry(0.09, 0.17, 1, 10);
const capGeo = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
capGeo.scale(1, 0.62, 1);
const dotGeo = new THREE.SphereGeometry(1, 8, 6);
const stemMat = new THREE.MeshStandardMaterial({ color: 0x18251d, roughness: 0.92 });
const dotMatCyan = new THREE.MeshStandardMaterial({ color: 0xd8ffe9, emissive: 0x5cffb1, emissiveIntensity: 0.7, roughness: 0.6 });
const dotMatWarm = new THREE.MeshStandardMaterial({ color: 0xffe4c4, emissive: 0xff9e57, emissiveIntensity: 0.7, roughness: 0.6 });

const mushrooms = [];
const capMeshes = []; // 供射线点击

function buildMushroom(x, z, s) {
  const g = new THREE.Group();
  const isWarm = Math.random() < 0.22;
  const h = (0.55 + Math.random() * 1.15) * s;
  const capR = (0.34 + Math.random() * 0.52) * s;
  const glowColor = isWarm ? COL.warm : COL.glow;

  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.scale.set(s, h, s);
  stem.position.y = h / 2;
  g.add(stem);

  const capMat = new THREE.MeshStandardMaterial({
    color: isWarm ? 0x2b1a0e : 0x0e2b1d,
    emissive: glowColor,
    emissiveIntensity: 0.5 + Math.random() * 0.35,
    roughness: 0.55,
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.scale.set(capR, capR, capR);
  cap.position.y = h - capR * 0.06;
  g.add(cap);

  // 菌盖白点（手工细节）
  const dots = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < dots; i++) {
    const d = new THREE.Mesh(dotGeo, isWarm ? dotMatWarm : dotMatCyan);
    const dr = capR * (0.04 + Math.random() * 0.03);
    const th = Math.random() * Math.PI * 2;
    const ph = Math.random() * Math.PI * 0.42;
    d.scale.set(dr, dr * 0.7, dr);
    d.position.set(
      Math.cos(th) * Math.sin(ph) * capR * 0.96,
      cap.position.y + Math.cos(ph) * capR * 0.60,
      Math.sin(th) * Math.sin(ph) * capR * 0.96
    );
    g.add(d);
  }

  // 光晕 sprite（省性能的"假光源"）
  const haloMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: glowColor,
    transparent: true,
    opacity: 0.38,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const halo = new THREE.Sprite(haloMat);
  const hs = capR * 4.2;
  halo.scale.set(hs, hs, 1);
  halo.position.y = cap.position.y + capR * 0.4;
  g.add(halo);

  g.position.set(x, 0, z);
  g.rotation.y = Math.random() * Math.PI * 2;
  scene.add(g);

  const m = {
    group: g, cap, capMat, haloMat,
    baseGlow: capMat.emissiveIntensity,
    pulse: 0, x, z, isWarm, capR, capY: cap.position.y,
  };
  cap.userData.mushroom = m;
  mushrooms.push(m);
  capMeshes.push(cap);
  return m;
}

// 簇状分布：5 个菌落中心 + 散生 + 前景大株
{
  const centers = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.random() * 0.6;
    const r = 2.2 + Math.random() * 4.6;
    centers.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  for (let i = 0; i < CFG.shroomN; i++) {
    let x, z, s;
    if (i < 2) { // 前景大株，撑住构图
      x = (i === 0 ? -1 : 1) * (4.6 + Math.random());
      z = 6.4 + Math.random() * 1.2;
      s = 1.5 + Math.random() * 0.5;
    } else if (Math.random() < 0.72) {
      const c = centers[(Math.random() * centers.length) | 0];
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.6) * 2.6;
      x = c[0] + Math.cos(a) * r;
      z = c[1] + Math.sin(a) * r;
      s = 0.6 + Math.random() * 0.8;
    } else {
      const a = Math.random() * Math.PI * 2;
      const r = 1.4 + Math.random() * 7.6;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      s = 0.55 + Math.random() * 0.75;
    }
    buildMushroom(x, z, s);
  }
}

// ---------------- 萤火虫（Points + lissajous 飞行 + 呼吸闪烁） ----------------
const flyUniforms = { uTime: { value: 0 }, uPx: { value: 1 }, uGlow: { value: 1 } };
let flyGeo, flyPos;
const flyParam = [];
{
  flyGeo = new THREE.BufferGeometry();
  flyPos = new Float32Array(CFG.flyN * 3);
  const aPhase = new Float32Array(CFG.flyN);
  const aWarm = new Float32Array(CFG.flyN);
  const aAmp = new Float32Array(CFG.flyN);
  for (let i = 0; i < CFG.flyN; i++) {
    flyParam.push({
      cx: -8 + Math.random() * 16,
      cy: 0.6 + Math.random() * 3.6,
      cz: -6 + Math.random() * 12,
      ax: 1.0 + Math.random() * 1.8, ay: 0.4 + Math.random() * 0.7, az: 1.0 + Math.random() * 1.8,
      wx: 0.22 + Math.random() * 0.4, wy: 0.30 + Math.random() * 0.5, wz: 0.22 + Math.random() * 0.4,
      px: Math.random() * 6.283, py: Math.random() * 6.283, pz: Math.random() * 6.283,
    });
    aPhase[i] = Math.random();
    aWarm[i] = Math.random() < 0.18 ? 1 : 0;
    aAmp[i] = 0.7 + Math.random() * 0.9;
  }
  flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  flyGeo.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
  flyGeo.setAttribute('aWarm', new THREE.BufferAttribute(aWarm, 1));
  flyGeo.setAttribute('aAmp', new THREE.BufferAttribute(aAmp, 1));
  const flyMat = new THREE.ShaderMaterial({
    uniforms: flyUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aPhase; attribute float aWarm; attribute float aAmp;
      uniform float uTime, uPx;
      varying float vTw; varying float vWarm;
      void main(){
        vTw = 0.5 + 0.5 * sin(uTime * 2.1 + aPhase * 6.28318);
        vWarm = aWarm;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uPx * aAmp * (150.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uGlow;
      varying float vTw; varying float vWarm;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float m = smoothstep(0.5, 0.06, d);
        vec3 c = mix(vec3(0.36, 1.0, 0.69), vec3(1.0, 0.62, 0.34), vWarm);
        float a = m * vTw * vTw * uGlow;
        if (a < 0.012) discard;
        gl_FragColor = vec4(c, a);
      }
    `,
  });
  const flies = new THREE.Points(flyGeo, flyMat);
  flies.frustumCulled = false;
  scene.add(flies);
}

// ---------------- 孢子 burst（粒子池） ----------------
const sporeUniforms = { uPx: { value: 1 }, uGlow: { value: 1 } };
let sporeGeo;
const sporeVel = new Float32Array(CFG.sporeN * 3);
const sporeLife = new Float32Array(CFG.sporeN);
const sporeMax = new Float32Array(CFG.sporeN);
const sporePos = new Float32Array(CFG.sporeN * 3);
{
  sporeGeo = new THREE.BufferGeometry();
  const aLife = new Float32Array(CFG.sporeN);
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));
  sporeGeo.setAttribute('aLife', new THREE.BufferAttribute(aLife, 1));
  const sporeMat = new THREE.ShaderMaterial({
    uniforms: sporeUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aLife;
      uniform float uPx;
      varying float vL;
      void main(){
        vL = aLife;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uPx * (1.0 + aLife * 1.6) * (120.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uGlow;
      varying float vL;
      void main(){
        if (vL <= 0.001) discard;
        float d = length(gl_PointCoord - 0.5);
        float m = smoothstep(0.5, 0.08, d);
        float a = m * pow(1.0 - vL, 1.4) * uGlow;
        if (a < 0.012) discard;
        gl_FragColor = vec4(vec3(0.55, 1.0, 0.78), a);
      }
    `,
  });
  const spores = new THREE.Points(sporeGeo, sporeMat);
  spores.frustumCulled = false;
  scene.add(spores);
}
let sporeCursor = 0;
function burstSpores() {
  const sources = [...mushrooms].sort(() => Math.random() - 0.5).slice(0, 3);
  const per = Math.floor((MOBILE ? 90 : 150) / sources.length);
  for (const m of sources) {
    for (let i = 0; i < per; i++) {
      const k = sporeCursor;
      sporeCursor = (sporeCursor + 1) % CFG.sporeN;
      const j = k * 3;
      sporePos[j] = m.x + (Math.random() - 0.5) * 0.5;
      sporePos[j + 1] = m.capY + Math.random() * 0.3;
      sporePos[j + 2] = m.z + (Math.random() - 0.5) * 0.5;
      const a = Math.random() * Math.PI * 2;
      const sp = 0.4 + Math.random() * 1.1;
      sporeVel[j] = Math.cos(a) * sp;
      sporeVel[j + 1] = 0.7 + Math.random() * 1.3;
      sporeVel[j + 2] = Math.sin(a) * sp;
      sporeMax[k] = 2.6 + Math.random() * 1.6;
      sporeLife[k] = 0.0001;
    }
  }
}

// ---------------- 涟漪光波（ring 池） ----------------
const rings = [];
{
  const ringGeo = new THREE.RingGeometry(0.94, 1.0, 64);
  for (let i = 0; i < CFG.ringPool; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: COL.glow, transparent: true, opacity: 0,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const r = new THREE.Mesh(ringGeo, mat);
    r.rotation.x = -Math.PI / 2;
    r.position.y = 0.04;
    r.visible = false;
    r.userData = { t: 0, active: false };
    scene.add(r);
    rings.push(r);
  }
}
function fireRing(x, z, warm) {
  const r = rings.find((o) => !o.userData.active) || rings[0];
  r.userData.active = true;
  r.userData.t = 0;
  r.position.x = x;
  r.position.z = z;
  r.material.color.set(warm ? COL.warm : COL.glow);
  r.visible = true;
}

// ---------------- 交互：点击蘑菇 → 涟漪 + 周围亮度脉冲 ----------------
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
function rippleAt(x, z, warm) {
  fireRing(x, z, warm);
  for (const m of mushrooms) {
    const d = Math.hypot(m.x - x, m.z - z);
    if (d < CFG.pulseRadius) m.pulse = Math.max(m.pulse, 1 - d / CFG.pulseRadius);
  }
}
function pickMushroom(cx, cy) {
  ptr.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(capMeshes, false)[0];
  return hit ? hit.object.userData.mushroom : null;
}

// 相机拖拽（偏航 ±0.55）与点击区分
let yawTarget = 0, yaw = 0;
let downX = 0, downY = 0, downT = 0, dragging = false;
canvas.addEventListener('pointerdown', (e) => {
  downX = e.clientX; downY = e.clientY; downT = performance.now(); dragging = true;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - downX;
  if (Math.abs(dx) > 8) yawTarget = THREE.MathUtils.clamp(yawTarget - dx * 0.0016, -0.55, 0.55);
});
canvas.addEventListener('pointerup', (e) => {
  dragging = false;
  const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (moved < 9 && performance.now() - downT < 450) {
    const m = pickMushroom(e.clientX, e.clientY);
    if (m) rippleAt(m.x, m.z, m.isWarm);
  }
});

// ---------------- 控制项 ----------------
let glowScale = 1;
let night = 0.72;
const glowRange = $('glowRange'), glowOut = $('glowOut');
const nightRange = $('nightRange'), nightOut = $('nightOut');
const sporeBtn = $('sporeBtn');

glowRange.addEventListener('input', () => {
  glowScale = glowRange.value / 100;
  glowOut.textContent = glowRange.value + '%';
});
nightRange.addEventListener('input', () => {
  night = nightRange.value / 100;
  nightOut.textContent = night < 0.25 ? '薄暮' : night < 0.6 ? '入夜' : '深夜';
});
sporeBtn.addEventListener('click', () => {
  if (sporeBtn.classList.contains('cooling')) return;
  burstSpores();
  sporeBtn.classList.add('cooling');
  setTimeout(() => sporeBtn.classList.remove('cooling'), 1200);
});
$('stat').textContent = '菌群 ' + mushrooms.length + ' · 萤火 ' + CFG.flyN;

function applyNight() {
  hemi.intensity = THREE.MathUtils.lerp(1.15, 0.38, night);
  amb.intensity = THREE.MathUtils.lerp(0.9, 0.45, night);
  scene.fog.density = THREE.MathUtils.lerp(0.030, 0.062, night);
  renderer.toneMappingExposure = THREE.MathUtils.lerp(1.28, 1.0, night);
}

// ---------------- 主循环 ----------------
const clock = new THREE.Clock();
let frames = 0;
let introDone = false;

function finishIntro() {
  if (introDone) return;
  introDone = true;
  loader.classList.add('done');
  document.querySelectorAll('[data-intro]').forEach((el) => el.classList.add('is-in'));
}
setTimeout(finishIntro, 3800); // 兜底：3.8s 必进完成态

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 相机：偏航跟随 + 呼吸式微摆
  yaw += (yawTarget - yaw) * (1 - Math.exp(-dt * 6));
  camera.position.set(
    CAM_BASE.x + Math.sin(yaw) * 10.4 + Math.sin(t * 0.21) * 0.14,
    CAM_BASE.y + Math.sin(t * 0.17) * 0.10,
    CAM_BASE.z - (1 - Math.cos(yaw)) * 6 + Math.cos(t * 0.19) * 0.10
  );
  camera.lookAt(Math.sin(yaw) * 2.2, 1.3, 0);

  // 灯光呼吸
  keyLight.intensity = 34 * (1 + night * 0.5) * glowScale * (1 + Math.sin(t * 1.7) * 0.07);
  warmLight.intensity = 22 * (1 + night * 0.5) * glowScale * (1 + Math.sin(t * 1.3 + 2) * 0.09);

  // 蘑菇：脉冲衰减 + 荧光更新
  for (const m of mushrooms) {
    m.pulse *= Math.exp(-dt * CFG.pulseDecay);
    const gi = (m.baseGlow + m.pulse * 2.0) * glowScale * (1 + night * 0.45);
    m.capMat.emissiveIntensity = gi;
    m.haloMat.opacity = Math.min(0.8, 0.38 * glowScale * (1 + night * 0.3) + m.pulse * 0.45);
    // 菌盖呼吸（不同相位）
    m.cap.scale.y = m.capR * (1 + Math.sin(t * 1.4 + m.x * 2.1 + m.z) * 0.02);
  }

  // 萤火虫 lissajous
  for (let i = 0; i < CFG.flyN; i++) {
    const p = flyParam[i];
    const j = i * 3;
    flyPos[j] = p.cx + p.ax * Math.sin(p.wx * t + p.px);
    flyPos[j + 1] = p.cy + p.ay * Math.sin(p.wy * t + p.py);
    flyPos[j + 2] = p.cz + p.az * Math.cos(p.wz * t + p.pz);
  }
  flyGeo.attributes.position.needsUpdate = true;
  flyUniforms.uTime.value = t;
  flyUniforms.uGlow.value = glowScale * (0.75 + night * 0.5);
  flyUniforms.uPx.value = Math.min(window.devicePixelRatio || 1, 2);

  // 孢子
  {
    const aLife = sporeGeo.attributes.aLife.array;
    for (let k = 0; k < CFG.sporeN; k++) {
      if (sporeLife[k] <= 0) continue;
      sporeLife[k] += dt;
      const j = k * 3;
      if (sporeLife[k] >= sporeMax[k]) {
        sporeLife[k] = 0;
        aLife[k] = 0;
        sporePos[j + 1] = -10; // 藏到地下
        continue;
      }
      sporeVel[j] *= (1 - dt * 0.6);
      sporeVel[j + 2] *= (1 - dt * 0.6);
      sporeVel[j + 1] += dt * 0.18; // 上浮
      sporePos[j] += sporeVel[j] * dt + Math.sin(t * 3 + k) * 0.12 * dt;
      sporePos[j + 1] += sporeVel[j + 1] * dt;
      sporePos[j + 2] += sporeVel[j + 2] * dt;
      aLife[k] = sporeLife[k] / sporeMax[k];
    }
    sporeGeo.attributes.position.needsUpdate = true;
    sporeGeo.attributes.aLife.needsUpdate = true;
  }
  sporeUniforms.uPx.value = Math.min(window.devicePixelRatio || 1, 2);
  sporeUniforms.uGlow.value = glowScale;

  // 涟漪
  for (const r of rings) {
    if (!r.userData.active) continue;
    r.userData.t += dt / CFG.ringLife;
    const k = r.userData.t;
    if (k >= 1) {
      r.userData.active = false;
      r.visible = false;
      continue;
    }
    const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
    const s = 0.5 + e * 4.6;
    r.scale.set(s, s, 1);
    r.material.opacity = (1 - k) * 0.85;
  }

  fogUniforms.uTime.value = t;
  fogUniforms.uGlow.value = glowScale * (0.7 + night * 0.5);

  applyNight();
  renderer.render(scene, camera);

  frames++;
  if (frames === 12) finishIntro(); // 主路径：首帧渲染后快速进入
}
applyNight();
tick();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
