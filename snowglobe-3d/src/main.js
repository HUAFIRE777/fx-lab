/* snowglobe-3d · src/main.js
 * 玻璃雪景球：程序化球体折射 + 三档微缩冬景（小镇/松林/雪人）+ 暴风雪粒子
 * 全原创实现；Three.js (MIT) 本地 vendor。
 */
import * as THREE from '../vendor/three.module.js';

/* ================= 配置 ================= */
const CFG = {
  night: 0x0e1b2e, snow: 0xf4f8ff, pine: 0x2e7d5b,
  globeR: 2.18,          // 玻璃球半径
  groundY: -1.02,        // 球内地面高度
  snowMax: 2600,         // 粒子总数
  snowH: 2.7,           // 雪柱高度
  shakeDecay: 1.35,      // 暴风雪能量衰减
  blizzardGain: 8.0,     // 能量对降雪速度的放大
  wobble: 0.085,         // 摇晃幅度
};
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = matchMedia('(pointer: coarse)').matches;

/* ================= 渲染器 / 场景 ================= */
const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 80);
const CAM_HOME = new THREE.Vector3(0, 0.5, 9.2);
const LOOK_AT = new THREE.Vector3(0, -0.35, 0);
camera.position.copy(CAM_HOME);
camera.lookAt(LOOK_AT);
// 按宽高比保证球体横向完整入画（竖屏拉远机位）
function fitCamera() {
  camera.aspect = innerWidth / innerHeight;
  const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
  const zForWidth = 2.55 / (Math.tan(vHalf) * camera.aspect);
  CAM_HOME.z = Math.max(9.2, zForWidth);
  camera.position.z = CAM_HOME.z;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
fitCamera();

/* ================= 灯光 ================= */
scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x0e1b2e, 0.55));
const moon = new THREE.DirectionalLight(0xdfeaff, 1.5);   // 月光
moon.position.set(-4, 6, 5);
scene.add(moon);
const rim = new THREE.DirectionalLight(0x9db8dd, 0.7);    // 冷色轮廓
rim.position.set(5, 2, -6);
scene.add(rim);
const hearth = new THREE.PointLight(0xfff2d9, 18, 12, 2); // 球内暖心光（小镇灯火用）
hearth.position.set(0, 0.4, 0);
scene.add(hearth);

/* ================= 工具 ================= */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...opts });
const easeOutBack = t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeInBack = t => { const c = 1.70158; return (c + 1) * t * t * t - c * t * t; };
const tweens = [];
function tween(dur, onU, onC, ease = t => t) {
  tweens.push({ t: 0, dur, onU, onC, ease });
}
function stepTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(1, tw.t / tw.dur);
    tw.onU(tw.ease(k));
    if (k >= 1) { tweens.splice(i, 1); tw.onC && tw.onC(); }
  }
}
// 程序化径向渐变贴图（月亮 / 灯光晕 / 铭牌）
function radialTex(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ================= 雪景球整机（可摇晃的 rig） ================= */
const rig = new THREE.Group();
const RIG_Y = -0.35;
rig.position.y = RIG_Y;
scene.add(rig);
const globe = new THREE.Group();
rig.add(globe);
globe.position.y = 0.35;

// —— 玻璃罩：物理折射 ——
const glass = new THREE.Mesh(
  new THREE.SphereGeometry(CFG.globeR, 64, 48),
  new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.06, metalness: 0,
    transmission: 1.0, thickness: 0.4, ior: 1.45,
    clearcoat: 1, clearcoatRoughness: 0.12,
    specularIntensity: 1, envMapIntensity: 1.2,
  })
);
globe.add(glass);
// 玻璃高光弧（贴着玻璃表面的一笔反光，卖"玻璃感"）
const glint = new THREE.Mesh(
  new THREE.TorusGeometry(CFG.globeR * 1.004, 0.014, 8, 64, 1.05),
  new THREE.MeshBasicMaterial({ color: 0xf4f8ff, transparent: true, opacity: 0.5 })
);
glint.rotation.set(0.35, 0.3, 2.05);
globe.add(glint);

// —— 球内雪地 ——
const groundGeo = new THREE.CircleGeometry(1.78, 48);
{
  const p = groundGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const d = Math.hypot(x, y) / 1.78;
    p.setZ(i, (1 - d * d) * 0.16 * Math.sin(x * 4.1) * Math.cos(y * 3.3) + d * d * 0.22);
  }
  groundGeo.computeVertexNormals();
}
const ground = new THREE.Mesh(groundGeo, mat(0xf4f8ff, { roughness: 1 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = CFG.groundY;
globe.add(ground);

// —— 底座 ——
const base = new THREE.Group();
const baseBody = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.66, 1.0, 48), mat(0x0e1b2e, { roughness: 0.55, metalness: 0.25 }));
baseBody.position.y = -2.62;
base.add(baseBody);
const baseTrim = new THREE.Mesh(new THREE.TorusGeometry(1.56, 0.075, 12, 64), mat(0x2e7d5b, { roughness: 0.4, metalness: 0.35 }));
baseTrim.rotation.x = Math.PI / 2;
baseTrim.position.y = -2.14;
base.add(baseTrim);
const baseFoot = new THREE.Mesh(new THREE.CylinderGeometry(1.68, 1.72, 0.12, 48), mat(0x0a1424, { roughness: 0.6 }));
baseFoot.position.y = -3.16;
base.add(baseFoot);
// 铭牌
{
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#0e1b2e'; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = '#2e7d5b'; g.lineWidth = 6; g.strokeRect(10, 10, 492, 108);
  g.fillStyle = '#f4f8ff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 44px "PingFang SC","Microsoft YaHei",sans-serif';
  g.fillText('雪 夜 物 语', 256, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 0.26),
    new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 })
  );
  plaque.position.set(0, -2.46, 1.62);
  plaque.rotation.x = -0.06;
  base.add(plaque);
}
globe.add(base);

/* ================= 三档微缩冬景（程序化几何） ================= */
const sceneRoot = new THREE.Group();
sceneRoot.position.y = CFG.groundY;
globe.add(sceneRoot);

function pineTree(s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * s, 0.06 * s, 0.3 * s, 8), mat(0x0e1b2e));
  trunk.position.y = 0.15 * s; g.add(trunk);
  const tiers = [[0.42, 0.5, 0.42], [0.32, 0.42, 0.78], [0.22, 0.34, 1.08]];
  tiers.forEach(([r, h, y], i) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r * s, h * s, 10), mat(0x2e7d5b, { roughness: 0.85 }));
    cone.position.y = y * s; cone.rotation.y = i * 0.5; g.add(cone);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.55 * s, h * 0.4 * s, 10), mat(0xf4f8ff));
    cap.position.y = (y + h * 0.32) * s; cap.rotation.y = i * 0.5; g.add(cap);
  });
  return g;
}
function lampPost() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.62, 8), mat(0x0e1b2e));
  pole.position.y = 0.31; g.add(pole);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xffe9b8, emissiveIntensity: 2.4 })
  );
  bulb.position.y = 0.66; g.add(bulb);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTex('rgba(255,240,200,0.9)', 'rgba(255,240,200,0)'),
    transparent: true, opacity: 0.55, depthWrite: false,
  }));
  halo.scale.setScalar(0.5); halo.position.y = 0.66; g.add(halo);
  return g;
}
function house(w, d, h, roofH) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(0xf4f8ff));
  body.position.y = h / 2; g.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 * 1.02, roofH, 4), mat(0x2e7d5b, { roughness: 0.8 }));
  roof.position.y = h + roofH / 2; roof.rotation.y = Math.PI / 4; g.add(roof);
  const snowcap = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 * 0.72, roofH * 0.5, 4), mat(0xf4f8ff));
  snowcap.position.y = h + roofH * 0.78; snowcap.rotation.y = Math.PI / 4; g.add(snowcap);
  // 发光的窗
  const winMat = new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffdf9e, emissiveIntensity: 1.8 });
  [[-w * 0.22, h * 0.55], [w * 0.22, h * 0.55]].forEach(([x, y]) => {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.13), winMat);
    win.position.set(x, y, d / 2 + 0.002); g.add(win);
  });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.24), mat(0x0e1b2e));
  door.position.set(0, 0.12, d / 2 + 0.002); g.add(door);
  return g;
}

function buildTown() {
  const g = new THREE.Group();
  const specs = [
    [-0.85, -0.25, 0.55, 0.5, 0.42, 0.3, 0.4],
    [0.0, -0.75, 0.62, 0.55, 0.5, 0.34, 0.15],
    [0.8, -0.35, 0.5, 0.46, 0.4, 0.28, -0.35],
    [-0.35, 0.45, 0.48, 0.44, 0.38, 0.26, 2.6],
    [0.55, 0.5, 0.56, 0.5, 0.44, 0.3, -2.9],
  ];
  specs.forEach(([x, z, w, d, h, rh, ry]) => {
    const hs = house(w, d, h, rh);
    hs.position.set(x, 0, z); hs.rotation.y = ry; g.add(hs);
  });
  // 教堂
  const ch = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.9, 0.34), mat(0xf4f8ff));
  tower.position.y = 0.45; ch.add(tower);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.5, 4), mat(0x2e7d5b));
  spire.position.y = 1.15; spire.rotation.y = Math.PI / 4; ch.add(spire);
  const cross = new THREE.Group();
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.03), mat(0x0e1b2e)); cross.add(c1);
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), mat(0x0e1b2e)); c2.position.y = 0.04; cross.add(c2);
  cross.position.y = 1.5; ch.add(cross);
  ch.position.set(-0.05, 0, 0.05); g.add(ch);
  // 路灯
  [[-1.15, 0.55], [1.15, 0.6], [0.15, -1.15]].forEach(([x, z]) => {
    const l = lampPost(); l.position.set(x, 0, z); g.add(l);
  });
  // 两棵点缀松
  const t1 = pineTree(0.8); t1.position.set(1.25, 0, -0.85); g.add(t1);
  const t2 = pineTree(0.65); t2.position.set(-1.3, 0, -0.7); g.add(t2);
  return g;
}
function buildPines() {
  const g = new THREE.Group();
  const spots = [
    [0, -0.1, 1.5], [-0.85, 0.35, 1.1], [0.9, 0.4, 1.15], [-0.5, -0.85, 0.95],
    [0.55, -0.8, 1.25], [-1.2, -0.45, 0.8], [1.25, -0.5, 0.85], [0.1, 0.95, 0.9],
  ];
  spots.forEach(([x, z, s], i) => {
    const t = pineTree(s);
    t.position.set(x, 0, z);
    t.rotation.y = i * 1.3;
    g.add(t);
  });
  // 林间小灯
  const l = lampPost(); l.position.set(0, 0, 0.75); g.add(l);
  return g;
}
function buildSnowman() {
  const g = new THREE.Group();
  const sm = new THREE.Group();
  const wm = mat(0xf4f8ff, { roughness: 0.95 });
  [[0.42, 0.42], [0.32, 1.05], [0.23, 1.52]].forEach(([r, y]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), wm);
    b.position.y = y; sm.add(b);
  });
  // 纽扣 / 眼睛
  const bm = mat(0x0e1b2e);
  [[0, 1.12, 0.3], [0, 0.92, 0.37]].forEach(([x, y, z]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), bm);
    b.position.set(x, y, z); sm.add(b);
  });
  [[-0.08, 1.58, 0.2], [0.08, 1.58, 0.2]].forEach(([x, y, z]) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), bm);
    e.position.set(x, y, z); sm.add(e);
  });
  // 胡萝卜鼻（松绿锥，配色内）
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 10), mat(0x2e7d5b));
  nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.52, 0.32); sm.add(nose);
  // 围巾
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.055, 10, 24), mat(0x2e7d5b, { roughness: 0.85 }));
  scarf.rotation.x = Math.PI / 2; scarf.position.y = 1.3; sm.add(scarf);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.3, 0.03), mat(0x2e7d5b, { roughness: 0.85 }));
  tail.position.set(0.18, 1.14, 0.18); tail.rotation.z = 0.25; sm.add(tail);
  // 礼帽
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 16), bm);
  hat.position.y = 1.82; sm.add(hat);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 16), bm);
  brim.position.y = 1.72; sm.add(brim);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.05, 16), mat(0x2e7d5b));
  band.position.y = 1.74; sm.add(band);
  // 树枝手臂
  [[-1, 0.5], [1, -0.55]].forEach(([s, rz]) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.55, 6), bm);
    arm.position.set(s * 0.45, 1.12, 0); arm.rotation.z = rz; sm.add(arm);
  });
  sm.position.set(0.35, 0, 0.1);
  g.add(sm);
  // 小雪人
  const mini = sm.clone();
  mini.scale.setScalar(0.55);
  mini.position.set(-0.75, 0, 0.55);
  mini.rotation.y = 0.7;
  g.add(mini);
  // 环绕松树
  [[-1.15, -0.6, 0.9], [1.2, -0.55, 1.0], [-0.1, -1.1, 0.8], [1.05, 0.85, 0.7]].forEach(([x, z, s], i) => {
    const t = pineTree(s); t.position.set(x, 0, z); t.rotation.y = i; g.add(t);
  });
  return g;
}

const scenes = { town: buildTown(), pines: buildPines(), snowman: buildSnowman() };
Object.entries(scenes).forEach(([k, grp]) => { grp.visible = k === 'town'; sceneRoot.add(grp); });
let currentScene = 'town';
let switching = false;
function syncTabs(name) {
  document.querySelectorAll('.segs button').forEach(b => {
    const on = b.dataset.scene === name;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on);
  });
}
function switchScene(name) {
  if (name === currentScene && !switching) return;
  // 中断飞行中的过渡：先结算到稳定态（当前场景完整可见），再起新过渡——快速连点不吞操作
  // 注：本页只有场景切换使用 tween()，清数组是安全的
  tweens.length = 0;
  switching = false;
  Object.entries(scenes).forEach(([k, g]) => {
    g.visible = (k === currentScene);
    g.scale.setScalar(1);
  });
  if (name === currentScene) { syncTabs(name); return; }
  switching = true;
  const old = scenes[currentScene], next = scenes[name];
  tween(0.32, k => old.scale.setScalar(Math.max(0.001, 1 - easeInBack(k))), () => {
    old.visible = false;
    next.visible = true;
    next.scale.setScalar(0.01);
    tween(0.65, k => next.scale.setScalar(Math.max(0.01, easeOutBack(k))), () => {
      next.scale.setScalar(1); switching = false;
    });
  });
  currentScene = name;
  syncTabs(name);
}

/* ================= 暴风雪粒子（自定义 shader） ================= */
function scatterInDisc(n, r) {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random()) * r;
    a[i * 3] = Math.cos(th) * rr;
    a[i * 3 + 1] = Math.random();
    a[i * 3 + 2] = Math.sin(th) * rr;
  }
  return a;
}
const snowGeo = new THREE.BufferGeometry();
{
  const n = CFG.snowMax;
  const pos = scatterInDisc(n, 1.7);
  const seed = new Float32Array(n);
  for (let i = 0; i < n; i++) seed[i] = Math.random();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  snowGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
}
const snowUniforms = {
  uTime: { value: 0 },
  uEnergy: { value: 0 },
  uPixelRatio: { value: Math.min(devicePixelRatio || 1, 2) },
  uGroundY: { value: 0 },
  uSnowH: { value: CFG.snowH },
};
const snowMat = new THREE.ShaderMaterial({
  uniforms: snowUniforms,
  transparent: true, depthWrite: false,
  vertexShader: `
    attribute float aSeed;
    uniform float uTime, uEnergy, uPixelRatio, uGroundY, uSnowH;
    varying float vTw;
    void main(){
      vec3 p = position;
      float rate = 0.10 + aSeed * 0.16;
      float fall = uTime * rate * (1.0 + uEnergy * ${CFG.blizzardGain.toFixed(1)});
      float h = fract(p.y + fall);
      p.y = uGroundY + (1.0 - h) * uSnowH;
      float sway = sin(uTime * (0.8 + aSeed) + aSeed * 40.0) * (0.10 + uEnergy * 0.55);
      p.x += sway + uEnergy * 0.35 * sin(uTime * 3.0 + aSeed * 20.0);
      p.z += cos(uTime * (0.7 + aSeed * 0.6) + aSeed * 31.0) * (0.08 + uEnergy * 0.4);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      float tw = 0.55 + 0.45 * sin(uTime * (2.0 + aSeed * 3.0) + aSeed * 50.0);
      vTw = tw;
      gl_PointSize = min((2.2 + aSeed * 3.4) * uPixelRatio * (140.0 / -mv.z), 26.0 * uPixelRatio);
    }`,
  fragmentShader: `
    varying float vTw;
    void main(){
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      float m = smoothstep(0.5, 0.08, d);
      if (m < 0.01) discard;
      gl_FragColor = vec4(0.957, 0.973, 1.0, m * 0.92 * vTw);
    }`,
});
const snow = new THREE.Points(snowGeo, snowMat);
snow.position.y = CFG.groundY;
globe.add(snow);
snowUniforms.uGroundY.value = 0; // 已用 position.y 抬升，shader 内从 0 起算
function setSnowAmount(pct) {
  const count = Math.round(THREE.MathUtils.lerp(300, CFG.snowMax, pct / 100));
  snowGeo.setDrawRange(0, count);
}
setSnowAmount(55);

/* ================= 背景：星空 + 月亮 ================= */
{
  const n = 380, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 0.95);
    const r = 26;
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph) * 0.9 + 2;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: 0xf4f8ff, size: 0.09, transparent: true, opacity: 0.65, sizeAttenuation: true });
  scene.add(new THREE.Points(g, m));
  const moonSpr = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTex('rgba(244,248,255,1)', 'rgba(244,248,255,0)'),
    transparent: true, opacity: 0.9, depthWrite: false,
  }));
  moonSpr.scale.setScalar(3.4);
  moonSpr.position.set(-8.5, 6.8, -13); // 必须在相机前方（相机 z≈9.2），放后方会投影异常
  scene.add(moonSpr);
}

/* ================= 摇一摇：能量 + 物理晃动 ================= */
let energy = 0;
const flashEl = document.getElementById('flash');
const shakeBtn = document.getElementById('shakeBtn');
function triggerShake() {
  energy = 1;
  flashEl.classList.remove('go');
  void flashEl.offsetWidth;
  flashEl.classList.add('go');
}
shakeBtn.addEventListener('click', () => {
  triggerShake();
  requestTiltPermission(); // iOS 需要手势内申请
});
// 点击球体也能摇
const ray = new THREE.Raycaster();
let downAt = 0;
canvas.addEventListener('pointerdown', e => { downAt = performance.now(); });
canvas.addEventListener('pointerup', e => {
  if (performance.now() - downAt > 260) return; // 拖动不算点击
  const nd = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(nd, camera);
  if (ray.intersectObject(glass, false).length) triggerShake();
});

/* 移动端摇晃（deviceorientation 降级：无权限/无事件时按钮照常可用） */
let tiltOn = false, lastGB = null, lastShakeT = 0;
function listenTilt() {
  if (tiltOn) return; tiltOn = true;
  addEventListener('deviceorientation', e => {
    if (e.beta == null || e.gamma == null) return;
    const now = performance.now();
    if (lastGB) {
      const jerk = Math.abs(e.gamma - lastGB.g) + Math.abs(e.beta - lastGB.b);
      if (jerk > 42 && now - lastShakeT > 1600) { lastShakeT = now; triggerShake(); }
    }
    lastGB = { g: e.gamma, b: e.beta };
  });
}
function requestTiltPermission() {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(s => { if (s === 'granted') listenTilt(); }).catch(() => {});
    } else if ('DeviceOrientationEvent' in window) {
      listenTilt();
    }
  } catch (err) { /* 降级为按钮 */ }
}
if (COARSE) {
  const hint = document.getElementById('hint');
  if (hint) hint.textContent = '摇晃手机试试 · 也可以点摇一摇';
  requestTiltPermission(); // Android 等无需手势的直接开
}

/* ================= 拖动旋转 + 视差 ================= */
let targetYaw = 0, yaw = 0, px = 0, py = 0, tpx = 0, tpy = 0;
let dragging = false, lastX = 0;
canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
addEventListener('pointermove', e => {
  tpx = (e.clientX / innerWidth - 0.5);
  tpy = (e.clientY / innerHeight - 0.5);
  if (dragging) {
    targetYaw = THREE.MathUtils.clamp(targetYaw + (e.clientX - lastX) * 0.004, -0.55, 0.55);
    lastX = e.clientX;
  }
});
addEventListener('pointerup', () => { dragging = false; });

/* ================= UI 接线 ================= */
document.querySelectorAll('.segs button').forEach(b => {
  b.addEventListener('click', () => switchScene(b.dataset.scene));
});
const snowRange = document.getElementById('snowRange');
const snowOut = document.getElementById('snowOut');
const SNOW_WORDS = [[15, '微雪'], [45, '小雪'], [75, '中雪'], [101, '大雪']];
function paintRange() {
  snowRange.style.setProperty('--fill', snowRange.value + '%');
  const v = +snowRange.value;
  snowOut.textContent = SNOW_WORDS.find(([lim]) => v < lim)[1];
}
snowRange.addEventListener('input', () => { paintRange(); setSnowAmount(+snowRange.value); });
paintRange();

/* ================= 主循环 ================= */
const clock = new THREE.Clock();
let elapsed = 0;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  stepTweens(dt);

  // 能量衰减（指数，有物理感）
  energy *= Math.exp(-dt * CFG.shakeDecay * (REDUCED ? 1.8 : 1));
  if (energy < 0.002) energy = 0;
  snowUniforms.uTime.value = elapsed;
  snowUniforms.uEnergy.value = energy;

  // 球体晃动：阻尼正弦
  const wob = (REDUCED ? 0.4 : 1) * CFG.wobble * energy;
  rig.rotation.z = wob * Math.sin(elapsed * 13.0) * Math.exp(-energy * 0.4);
  rig.rotation.x = wob * 0.6 * Math.cos(elapsed * 10.7);
  rig.position.y = RIG_Y + Math.abs(Math.sin(elapsed * 13.0)) * energy * 0.12;

  // 缓慢自转 + 拖动偏航
  yaw += (targetYaw - yaw) * (1 - Math.exp(-dt * 6));
  globe.rotation.y = Math.sin(elapsed * 0.12) * 0.08 + yaw;

  // 相机视差 + 暴风雪微抖
  px += (tpx - px) * (1 - Math.exp(-dt * 3));
  py += (tpy - py) * (1 - Math.exp(-dt * 3));
  camera.position.x = CAM_HOME.x + px * 0.9 + (Math.random() - 0.5) * energy * 0.1;
  camera.position.y = CAM_HOME.y - py * 0.6 + (Math.random() - 0.5) * energy * 0.08;
  camera.position.z = CAM_HOME.z;
  camera.lookAt(LOOK_AT);

  // 灯火呼吸
  hearth.intensity = 18 + Math.sin(elapsed * 2.2) * 2.5 + energy * 6;
  glint.material.opacity = 0.42 + Math.sin(elapsed * 1.4) * 0.08;

  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  fitCamera();
  snowUniforms.uPixelRatio.value = Math.min(devicePixelRatio || 1, 2);
});

/* ================= 入场（完成态必达） ================= */
tick();
let revealed = false;
function reveal() {
  if (revealed) return; revealed = true;
  const loader = document.getElementById('loader');
  loader.classList.add('out');
  setTimeout(() => { loader.hidden = true; }, 650);
  document.documentElement.classList.add('is-in');
  // 开场先来一场小雪，告诉用户"这颗球是活的"
  setTimeout(() => triggerShake(), 900);
}
setTimeout(reveal, 850);            // 主路径
setTimeout(reveal, 4000);           // 兜底：完成态恒可达
