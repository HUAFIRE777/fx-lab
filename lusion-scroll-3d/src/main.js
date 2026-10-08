/* lusion-scroll-3d · src/main.js — original implementation (Three.js only, no post-processing libs) */
import * as THREE from 'three';

const $ = (s) => document.querySelector(s);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 640px)').matches;

/* ---------- 签名 easing：cubic-bezier(0.16,1,0.3,1) 的 JS 等价（惯性跟随用 lerp） ---------- */
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/* ---------- 渲染器 / 场景 ---------- */
const stage = $('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.25 : 2)); // 移动端降采样
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1c1410);
scene.fog = new THREE.FogExp2(0x1c1410, 0.052);

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 60);

/* ---------- 影棚：暖色三点布光 ---------- */
scene.add(new THREE.AmbientLight(0xf5efe6, 0.38)); // 环境底光

const key = new THREE.SpotLight(0xffd9a8, 220, 40, 0.5, 0.55, 1.6); // 主光 warm
key.position.set(-6, 9, 7);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.bias = -0.0004;
scene.add(key);

const rim = new THREE.DirectionalLight(0x8fa3c7, 2.2); // 轮廓光 cool
rim.position.set(6, 4, -7);
scene.add(rim);

const top = new THREE.PointLight(0xfff2dd, 40, 25, 1.8); // 顶光柔
top.position.set(0, 8, 0);
scene.add(top);

const warmFill = new THREE.PointLight(0xb08d57, 12, 18, 2); // 古铜补光
warmFill.position.set(0, 1.2, 5);
scene.add(warmFill);

/* ---------- 地面：暖色光池 ---------- */
function radialTex(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 8, 128, 128, 128);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(16, 48),
  new THREE.MeshStandardMaterial({
    color: 0x241a12, roughness: 0.85, metalness: 0.05,
    map: radialTex('#4a3826', '#171009'),
  })
);
floor.rotation.x = -Math.PI / 2; floor.position.y = -1.55;
floor.receiveShadow = true;
scene.add(floor);

/* ---------- 香水瓶：LatheGeometry 车削 ---------- */
const bottle = new THREE.Group();
scene.add(bottle);

const profile = [];
const P = (r, y) => profile.push(new THREE.Vector2(r, y));
P(0.0, -1.5); P(0.72, -1.5); P(0.95, -1.32); P(1.02, -0.9); P(1.02, -0.15);
P(0.94, 0.28); P(0.62, 0.62); P(0.34, 0.78); P(0.30, 0.95); P(0.30, 1.18);
const glassGeo = new THREE.LatheGeometry(profile, 72);
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xf3e7d3, metalness: 0, roughness: 0.06,
  transmission: 1.0, thickness: 1.4, ior: 1.52,
  clearcoat: 1, clearcoatRoughness: 0.08,
  attenuationColor: new THREE.Color(0xd8b98a), attenuationDistance: 3.5,
  specularIntensity: 1.0,
});
const glass = new THREE.Mesh(glassGeo, glassMat);
glass.castShadow = true;
bottle.add(glass);

/* 瓶内香水：略小的同形体，暖金色 */
const juiceGeo = new THREE.LatheGeometry(profile.map((v) => new THREE.Vector2(v.x * 0.86, v.y * 0.92 - 0.12)), 48);
const juice = new THREE.Mesh(juiceGeo, new THREE.MeshPhysicalMaterial({
  color: 0xd99a3f, roughness: 0.15, transmission: 0.55, thickness: 2.2,
  attenuationColor: new THREE.Color(0xa86a1f), attenuationDistance: 1.2,
  emissive: 0x8a5216, emissiveIntensity: 0.45, // 瓶内暖光：贵价感的来源
}));
bottle.add(juice);

/* 瓶盖：古铜 cylinder */
const capMat = new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 1.0, roughness: 0.28 });
const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.62, 48), capMat);
cap.position.y = 1.5; cap.castShadow = true;
bottle.add(cap);
const capRing = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.035, 16, 48),
  new THREE.MeshStandardMaterial({ color: 0x8a6a3c, metalness: 1, roughness: 0.35 }));
capRing.rotation.x = Math.PI / 2; capRing.position.y = 1.2;
bottle.add(capRing);

/* 标签：canvas 手绘品牌字，贴在瓶身前 */
function labelTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 512);
  g.strokeStyle = 'rgba(176,141,87,.9)'; g.lineWidth = 3;
  g.strokeRect(60, 60, 904, 392);
  g.fillStyle = '#2a1f14'; g.textAlign = 'center';
  g.font = '600 150px "Songti SC","STSong","SimSun",serif';
  g.fillText('雾 屿', 512, 250);
  g.font = '44px "PingFang SC","Microsoft YaHei",sans-serif';
  g.fillStyle = 'rgba(42,31,20,.85)';
  g.fillText('WUYU  ATELIER', 512, 330);
  g.font = '30px "PingFang SC","Microsoft YaHei",sans-serif';
  g.fillStyle = 'rgba(42,31,20,.6)';
  g.fillText('EAU DE PARFUM · 50ml', 512, 390);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const label = new THREE.Mesh(
  new THREE.CylinderGeometry(1.035, 1.035, 1.05, 48, 1, true, -0.62, 1.24),
  new THREE.MeshStandardMaterial({ map: labelTexture(), transparent: true, roughness: 0.6, metalness: 0 })
);
label.position.y = -0.5;
bottle.add(label);

/* ---------- 克制辉光：瓶口一缕光尘（additive 精灵） ---------- */
function spriteTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,236,200,1)');
  gr.addColorStop(0.4, 'rgba(255,220,170,.45)');
  gr.addColorStop(1, 'rgba(255,220,170,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const dustTex = spriteTex();
const dust = [];
const dustGroup = new THREE.Group();
for (let i = 0; i < 42; i++) {
  const m = new THREE.SpriteMaterial({
    map: dustTex, transparent: true, opacity: 0, color: 0xffd9a8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const s = new THREE.Sprite(m);
  const a = Math.random() * Math.PI * 2, r = 0.15 + Math.random() * 0.5;
  s.position.set(Math.cos(a) * r, 1.9 + Math.random() * 1.6, Math.sin(a) * r);
  const sc = 0.035 + Math.random() * 0.055;
  s.scale.set(sc, sc, 1);
  s.userData = { base: 0.25 + Math.random() * 0.5, ph: Math.random() * Math.PI * 2, sp: 0.15 + Math.random() * 0.3, y0: s.position.y };
  dustGroup.add(s); dust.push(s);
}
scene.add(dustGroup);

/* ---------- 背景：远处暖色光晕层（雾层次） ---------- */
for (let i = 0; i < 5; i++) {
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dustTex, transparent: true, opacity: 0.10,
    blending: THREE.AdditiveBlending, depthWrite: false, color: 0xb08d57,
  }));
  const a = (i / 5) * Math.PI * 2;
  halo.position.set(Math.cos(a) * 9, 1 + (i % 3), Math.sin(a) * 9 - 4);
  halo.scale.set(7, 7, 1);
  scene.add(halo);
}

/* ---------- 滚动运镜：章节关键帧 ---------- */
/* 每章：angle(弧度) radius height lookY fog */
const SHOTS = [
  { angle: 0.55, radius: 9.5, height: 1.6, lookY: 0.1, fog: 0.052 }, // hero
  { angle: 1.35, radius: 7.2, height: 0.9, lookY: 0.0, fog: 0.058 }, // 诞生：推进
  { angle: 2.45, radius: 5.6, height: 0.5, lookY: -0.1, fog: 0.066 }, // 香调：贴近+雾浓（呼吸）
  { angle: 3.60, radius: 6.4, height: 1.3, lookY: 0.2, fog: 0.055 }, // 工艺：拉开
  { angle: 4.60, radius: 8.2, height: 2.2, lookY: 0.3, fog: 0.048 }, // 拥有：环绕收尾
];
let target = 0;      // 目标滚动进度 0..4
let smooth = 0;      // 惯性跟随后的进度
const sections = [...document.querySelectorAll('.screen')];

function readScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const y = Math.min(Math.max(scrollY, 0), Math.max(max, 1));
  target = (y / Math.max(max, 1)) * (SHOTS.length - 1);
}
addEventListener('scroll', readScroll, { passive: true });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  readScroll();
});
readScroll();

function shotAt(t) {
  const i = Math.min(Math.floor(t), SHOTS.length - 2);
  const f = easeOutExpo(Math.min(Math.max(t - i, 0), 1));
  const a = SHOTS[i], b = SHOTS[i + 1];
  const L = (x, y) => x + (y - x) * f;
  return { angle: L(a.angle, b.angle), radius: L(a.radius, b.radius), height: L(a.height, b.height), lookY: L(a.lookY, b.lookY), fog: L(a.fog, b.fog) };
}

/* ---------- 章节文案：逐字淡入 + inview ---------- */
document.querySelectorAll('[data-chars]').forEach((el) => {
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'c'; s.textContent = ch;
    s.style.transitionDelay = `${i * 70}ms`;
    el.appendChild(s);
  });
});
const io = new IntersectionObserver((ents) => {
  ents.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('inview');
      const t = e.target.querySelector('.ch-title');
      if (t) requestAnimationFrame(() => t.classList.add('lit'));
    }
  });
}, { threshold: 0.35 });
sections.forEach((s) => io.observe(s));

/* ---------- 侧边导航 ---------- */
const nav = $('#nav');
const NAMES = ['序', '诞生', '香调', '工艺', '拥有'];
sections.forEach((s, i) => {
  const b = document.createElement('button');
  b.title = NAMES[i]; b.setAttribute('aria-label', NAMES[i]);
  b.addEventListener('click', () => s.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }));
  nav.appendChild(b);
});
const dots = [...nav.children];

/* ---------- 加载态 ---------- */
const fill = $('#loadfill'), pct = $('#loadpct'), loader = $('#loader');
let firstFrame = false;
function setProgress(p) {
  fill.style.width = `${Math.round(p * 100)}%`;
  pct.textContent = `${Math.round(p * 100)}%`;
  if (p >= 1 && firstFrame) loader.classList.add('done');
}

/* ---------- 主循环 ---------- */
const clock = new THREE.Clock();
let frames = 0;

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (!reduceMotion) {
    smooth += (target - smooth) * (1 - Math.pow(0.0018, dt)); // lerp 惯性跟随
  } else {
    smooth = target;
  }
  const sh = shotAt(smooth);
  const drift = reduceMotion ? 0 : Math.sin(t * 0.12) * 0.05; // 轻微呼吸式环绕
  camera.position.set(
    Math.sin(sh.angle + drift) * sh.radius,
    sh.height,
    Math.cos(sh.angle + drift) * sh.radius
  );
  camera.lookAt(0, sh.lookY, 0);
  scene.fog.density += (sh.fog - scene.fog.density) * (1 - Math.pow(0.01, dt)); // 雾浓度呼吸过渡

  if (!reduceMotion) {
    bottle.rotation.y = t * 0.08; // 瓶身极慢自转
    dust.forEach((s) => {
      const u = s.userData;
      s.position.y = u.y0 + Math.sin(t * u.sp + u.ph) * 0.35;
      s.material.opacity = u.base * (0.55 + 0.45 * Math.sin(t * u.sp * 1.7 + u.ph));
    });
  }

  const active = Math.round(smooth);
  dots.forEach((d, i) => d.classList.toggle('on', i === active));

  renderer.render(scene, camera);
  frames++;
  if (frames === 3) { firstFrame = true; setProgress(1); }
}

setProgress(0.35);
requestAnimationFrame(() => setProgress(0.7));
tick();
