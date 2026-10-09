import * as THREE from 'three';

/* ============================================================
 * observatory-3d · 天文台星空
 * 程序化天文台（圆柱基座 + 半球穹顶，穹顶巡天旋转、观测缝开合）
 * FBM 银河带 shader、3200 星点、流星粒子、3 星座连线标注
 * original implementation — huafire3d fx-lab
 * ============================================================ */

const PAL = { bg: 0x05070F, star: 0xDCE8FF, warm: 0xFFC46B };
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- DOM ---------------- */
const canvas = document.getElementById('scene');
const loader = document.getElementById('loader');
const hint = document.getElementById('hint');
const shutterEl = document.getElementById('shutter');
const shutterVal = document.getElementById('shutterVal');
const burstBtn = document.getElementById('burstBtn');
const patrolBtn = document.getElementById('patrolBtn');
const meteorCountEl = document.getElementById('meteorCount');
const cstool = document.getElementById('cstool');
const cstoolN = cstool.querySelector('.n');
const cstoolD = cstool.querySelector('.d');

/* ---------------- renderer / scene / camera ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(PAL.bg, 0.0042);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2600);

/* ---------------- lights ---------------- */
scene.add(new THREE.HemisphereLight(PAL.star, PAL.bg, 0.5));
const moon = new THREE.DirectionalLight(PAL.star, 0.8);
moon.position.set(30, 46, 18);
scene.add(moon);

/* ---------------- sky dome : gradient + FBM milky way ---------------- */
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  uniforms: {
    uBand: { value: new THREE.Vector3(0.63, 0.0, -0.777).normalize() }, // 银河带穿过默认机位视野（方位 ~231°）与天顶
  },
  vertexShader: `
    varying vec3 vDir;
    void main(){
      vDir = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    varying vec3 vDir;
    uniform vec3 uBand;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float vnoise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for(int i = 0; i < 5; i++){ v += a * vnoise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; }
      return v;
    }
    void main(){
      vec3 d = normalize(vDir);
      float up = smoothstep(-0.06, 0.30, d.y);
      /* 深空底色 #05070F */
      vec3 col = mix(vec3(0.010, 0.013, 0.030), vec3(0.020, 0.027, 0.059), up);
      /* 银河带：绕 uBand 法线的大圆高斯带 */
      vec3 bn = normalize(uBand);
      float g = dot(d, bn);
      float band = exp(-g * g * 10.0) * smoothstep(-0.02, 0.15, d.y);
      vec2 muv = vec2(atan(d.z, d.x) * 2.2, d.y * 7.0);
      float n1 = fbm(muv * 1.6);
      float n2 = fbm(muv * 3.4 + 7.7);
      float neb = band * smoothstep(0.50, 0.95, n1 * 0.72 + n2 * 0.38);
      /* 星云带 #DCE8FF */
      col += vec3(0.863, 0.910, 1.000) * neb * 0.38;
      /* 暗尘带 */
      float lane = band * smoothstep(0.55, 0.95, fbm(muv * 2.2 + vec2(3.1, 8.7)));
      col *= 1.0 - lane * 0.7;
      col += vec3(0.863, 0.910, 1.000) * band * 0.05;
      gl_FragColor = vec4(col, 1.0);
    }`,
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1200, 48, 32), skyMat));

/* ---------------- stars : 3200 点，shader 闪烁 ---------------- */
const STAR_N = 3200;
{
  const pos = new Float32Array(STAR_N * 3);
  const size = new Float32Array(STAR_N);
  const phase = new Float32Array(STAR_N);
  const alpha = new Float32Array(STAR_N);
  const R = 1050;
  for (let i = 0; i < STAR_N; i++) {
    let x, y, z;
    do {
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      x = Math.sin(p) * Math.cos(t); y = Math.cos(p); z = Math.sin(p) * Math.sin(t);
    } while (y < -0.03);
    pos[i * 3] = x * R; pos[i * 3 + 1] = y * R; pos[i * 3 + 2] = z * R;
    const bright = Math.random();
    size[i] = bright > 0.93 ? 5.5 + Math.random() * 2.0 : 1.6 + Math.random() * 3.4;
    phase[i] = Math.random() * Math.PI * 2;
    alpha[i] = 0.35 + Math.random() * 0.65;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(PAL.star) },
    },
    vertexShader: `
      attribute float aSize; attribute float aPhase; attribute float aAlpha;
      uniform float uTime; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = 0.55 + 0.45 * sin(uTime * 1.6 + aPhase);
        vA = aAlpha * tw;
        gl_PointSize = aSize * (900.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying float vA;
      void main(){
        float m = smoothstep(0.5, 0.08, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(uColor, vA * m);
      }`,
  });
  var starMat = m;
  scene.add(new THREE.Points(g, m));
}

/* ---------------- ground : 山丘 + 地面 + 微光晕 ---------------- */
{
  const hill = new THREE.Mesh(
    new THREE.ConeGeometry(17, 5.2, 40),
    new THREE.MeshStandardMaterial({ color: 0x04060c, roughness: 1 })
  );
  hill.position.y = -2.6;
  scene.add(hill);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(900, 48),
    new THREE.MeshStandardMaterial({ color: 0x03040a, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.75;
  scene.add(ground);

  // 基座周围一圈微弱星光晕
  const hc = document.createElement('canvas');
  hc.width = hc.height = 128;
  const hx = hc.getContext('2d');
  const grad = hx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(220,232,255,0.10)');
  grad.addColorStop(1, 'rgba(220,232,255,0)');
  hx.fillStyle = grad;
  hx.fillRect(0, 0, 128, 128);
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 46),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(hc), transparent: true, depthWrite: false,
    })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.06;
  scene.add(halo);
}

/* ---------------- observatory : 基座 + 穹顶 + 观测缝 + 望远镜 ---------------- */
const SLIT = 0.22; // 观测缝半角
const obs = new THREE.Group();
scene.add(obs);

const domeMetal = new THREE.MeshStandardMaterial({ color: 0x1b2438, roughness: 0.55, metalness: 0.65 });
const baseMetal = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8, metalness: 0.3 });
const trimMetal = new THREE.MeshStandardMaterial({ color: 0x232f4d, roughness: 0.5, metalness: 0.7 });

// 基座
{
  const base = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.9, 9, 48), baseMetal);
  base.position.y = 4.5;
  obs.add(base);
  const rimTop = new THREE.Mesh(new THREE.TorusGeometry(6.02, 0.14, 12, 64), trimMetal);
  rimTop.rotation.x = Math.PI / 2; rimTop.position.y = 9;
  obs.add(rimTop);
  const rimBot = new THREE.Mesh(new THREE.TorusGeometry(6.9, 0.16, 12, 64), trimMetal);
  rimBot.rotation.x = Math.PI / 2; rimBot.position.y = 0.35;
  obs.add(rimBot);

  // 暖色窗光 #FFC46B（仅点缀）
  const winMat = new THREE.MeshBasicMaterial({ color: PAL.warm });
  for (let i = -2; i <= 2; i++) {
    const a = i * 0.42;
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.6), winMat);
    w.position.set(Math.sin(a) * 6.48, 5.4, Math.cos(a) * 6.48);
    w.lookAt(Math.sin(a) * 20, 5.4, Math.cos(a) * 20);
    obs.add(w);
  }
}

// 穹顶组（整体巡天旋转）
const domeGroup = new THREE.Group();
domeGroup.position.y = 9;
domeGroup.rotation.y = Math.PI / 2; // 观测缝初始朝向相机
obs.add(domeGroup);

{
  // 半球穹顶，留出观测缝缺口
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(5.6, 56, 28, SLIT, Math.PI * 2 - SLIT * 2, 0, Math.PI / 2),
    domeMetal
  );
  domeGroup.add(dome);

  // 穹顶底圈
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.62, 0.16, 12, 64), trimMetal);
  ring.rotation.x = Math.PI / 2;
  domeGroup.add(ring);
}

// 快门：盖住缝隙的外层弧板，开合时滑到穹顶外侧
const shutter = new THREE.Mesh(
  new THREE.SphereGeometry(5.66, 28, 14, -SLIT - 0.03, SLIT * 2 + 0.06, 0, Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x141b2e, roughness: 0.6, metalness: 0.6 })
);
domeGroup.add(shutter);

// 缝隙暖光：穹顶内部透出的光
let slitGlow, domeLight;
{
  const gc = document.createElement('canvas');
  gc.width = 64; gc.height = 128;
  const gx = gc.getContext('2d');
  const gg = gx.createLinearGradient(0, 0, 64, 0);
  gg.addColorStop(0, 'rgba(255,196,107,0)');
  gg.addColorStop(0.5, 'rgba(255,196,107,0.95)');
  gg.addColorStop(1, 'rgba(255,196,107,0)');
  gx.fillStyle = gg;
  gx.fillRect(0, 0, 64, 128);
  slitGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 5.4),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(gc), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  // 观测缝在穹顶局部坐标的 -X 方向
  slitGlow.position.set(-5.15, 2.9, 0);
  slitGlow.rotation.y = -Math.PI / 2;
  domeGroup.add(slitGlow);

  domeLight = new THREE.PointLight(PAL.warm, 0, 30, 2);
  domeLight.position.set(-2.2, 3.2, 0);
  domeGroup.add(domeLight);
}

// 望远镜：指向观测缝，仰角 38°
{
  const scope = new THREE.Group();
  scope.position.set(0, 2.3, 0);
  const dir = new THREE.Vector3(-Math.cos(0.66), Math.sin(0.66), 0).normalize();
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0x2a3550, roughness: 0.4, metalness: 0.8 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.62, 5.6, 24), tubeMat);
  tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  tube.position.copy(dir).multiplyScalar(1.4);
  scope.add(tube);
  const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 16), trimMetal);
  eye.quaternion.copy(tube.quaternion);
  eye.position.copy(dir).multiplyScalar(-1.7);
  scope.add(eye);
  const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 2.3, 20), baseMetal);
  pier.position.y = -1.15;
  scope.add(pier);
  domeGroup.add(scope);
}

/* ---------------- meteors ---------------- */
function makeStreakTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 32;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, 'rgba(220,232,255,0)');
  g.addColorStop(0.62, 'rgba(220,232,255,0.28)');
  g.addColorStop(0.92, 'rgba(220,232,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,1)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 32);
  return new THREE.CanvasTexture(c);
}
const streakTex = makeStreakTexture();
const METEOR_POOL = 26;
const meteors = [];
let meteorTotal = 0;
for (let i = 0; i < METEOR_POOL; i++) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: streakTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    })
  );
  mesh.visible = false;
  scene.add(mesh);
  meteors.push({ mesh, active: false, delay: 0, head: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, maxLife: 1, speed: 300 });
}
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3();

function spawnMeteor(stagger) {
  const m = meteors.find(k => !k.active);
  if (!m) return;
  const az = Math.random() * Math.PI * 2;
  const el = (38 + Math.random() * 34) * Math.PI / 180;
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const head = dir.clone().multiplyScalar(880);
  const az2 = az + (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.45);
  const el2 = Math.max(0.18, el - (0.28 + Math.random() * 0.5));
  const end = new THREE.Vector3(
    Math.sin(az2) * Math.cos(el2), Math.sin(el2), Math.cos(az2) * Math.cos(el2)
  ).multiplyScalar(880);
  const speed = 280 + Math.random() * 160;
  m.head.copy(head);
  m.vel.copy(end).sub(head).normalize().multiplyScalar(speed);
  m.maxLife = head.distanceTo(end) / speed;
  m.life = m.maxLife;
  m.speed = speed;
  m.delay = stagger || 0;
  m.active = true;
  meteorTotal++;
  meteorCountEl.textContent = meteorTotal;
}

function updateMeteors(dt) {
  const W = window.innerWidth, H = window.innerHeight;
  for (const m of meteors) {
    if (!m.active) continue;
    if (m.delay > 0) { m.delay -= dt; continue; }
    m.life -= dt;
    if (m.life <= 0) { m.active = false; m.mesh.visible = false; continue; }
    m.head.addScaledVector(m.vel, dt);
    const t = 1 - m.life / m.maxLife;
    const env = Math.min(1, t / 0.12) * Math.min(1, (1 - t) / 0.45);
    const len = m.speed * 0.30;
    m.mesh.visible = true;
    m.mesh.material.opacity = env;
    _v1.copy(m.head).addScaledVector(m.vel, -len / 2 / m.speed);
    m.mesh.position.copy(_v1);
    m.mesh.lookAt(camera.position);
    _v1.copy(m.head).project(camera);
    _v2.copy(m.head).add(m.vel).project(camera);
    const dx = (_v2.x - _v1.x) * W / 2;
    const dy = -(_v2.y - _v1.y) * H / 2;
    m.mesh.rotateZ(Math.atan2(dy, dx));
    m.mesh.scale.set(len, 1.5 + m.speed * 0.002, 1);
  }
}

function burst(n) {
  for (let i = 0; i < n; i++) spawnMeteor(i * 0.09);
  hint.classList.add('gone');
}

/* ---------------- constellations : 3 座连线标注 ---------------- */
function skyDir(azDeg, elDeg) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
}
function patch(az, el, pts, s) {
  const c = skyDir(az, el);
  const ref = Math.abs(c.y) > 0.94 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(ref, c).normalize();
  const v = new THREE.Vector3().crossVectors(c, u).normalize();
  return pts.map(p => c.clone().addScaledVector(u, p[0] * s).addScaledVector(v, p[1] * s).normalize().multiplyScalar(900));
}

const CONSTELLATIONS = [
  {
    name: '北斗七星', en: 'BIG DIPPER',
    desc: '大熊座中最亮的七颗星，古人以它辨认方向、划分四季。',
    az: 232, el: 10,
    pts: [[0,0],[2.2,0.4],[2.6,2.4],[0.6,2.8],[-1.4,4.2],[-3.4,5.0],[-5.4,4.6]],
    links: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
    s: 0.022,
  },
  {
    name: '猎户座', en: 'ORION',
    desc: '冬季星空的主角，腰带上的三星是全天最容易认出的标记。',
    az: 206, el: 8,
    pts: [[-1.5,0],[0,0.1],[1.5,0.2],[-2.2,3.2],[2.4,3.4],[-1.8,-3.6],[2.0,-3.4],[0.1,5.0]],
    links: [[0,1],[1,2],[3,0],[2,4],[0,5],[2,6],[3,7],[4,7]],
    s: 0.020,
  },
  {
    name: '天鹅座', en: 'CYGNUS',
    desc: '银河上展翅的天鹅，夏季大三角的一角，横跨银河最亮处。',
    az: 260, el: 12,
    pts: [[0,4.5],[0,1.0],[0,-2.5],[-4,0.5],[4,0.5]],
    links: [[0,1],[1,2],[3,1],[4,1]],
    s: 0.022,
  },
];

const hitTargets = [];
const vertexMat = new THREE.MeshBasicMaterial({ color: PAL.star, fog: false, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
for (const cs of CONSTELLATIONS) {
  const verts = patch(cs.az, cs.el, cs.pts, cs.s);
  cs.lineMat = new THREE.LineBasicMaterial({ color: PAL.star, transparent: true, opacity: 0.85, fog: false, blending: THREE.AdditiveBlending, depthWrite: false });
  const lg = new THREE.BufferGeometry();
  const lp = [];
  for (const [a, b] of cs.links) lp.push(verts[a].x, verts[a].y, verts[a].z, verts[b].x, verts[b].y, verts[b].z);
  lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));
  cs.line = new THREE.LineSegments(lg, cs.lineMat);
  scene.add(cs.line);
  for (const p of verts) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(3.5, 10, 10), vertexMat);
    dot.position.copy(p);
    scene.add(dot);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(11, 8, 8), hitMat);
    hit.position.copy(p);
    hit.userData.cs = cs;
    scene.add(hit);
    hitTargets.push(hit);
  }
}

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let hovered = null;
function setHovered(cs, cx, cy) {
  if (hovered === cs) {
    if (cs) { cstool.style.left = (cx + 18) + 'px'; cstool.style.top = (cy + 14) + 'px'; }
    return;
  }
  if (hovered) {
    hovered.lineMat.color.set(PAL.star);
    hovered.lineMat.opacity = 0.7;
  }
  hovered = cs;
  if (cs) {
    cs.lineMat.color.set(PAL.warm);
    cs.lineMat.opacity = 0.95;
    cstoolN.textContent = cs.name + ' · ' + cs.en;
    cstoolD.textContent = cs.desc;
    cstool.style.left = (cx + 18) + 'px';
    cstool.style.top = (cy + 14) + 'px';
    cstool.classList.add('show');
    canvas.style.cursor = 'pointer';
  } else {
    cstool.classList.remove('show');
    canvas.style.cursor = 'crosshair';
  }
}

/* ---------------- interaction ---------------- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
let patrolOn = !reduced;
let shutterTarget = 0.75;
let shutterOpen = 0.0;

window.addEventListener('pointermove', (e) => {
  mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  pointerNDC.set(mouse.tx, mouse.ty); // mouse.ty 已是 NDC（-(y/h)*2+1），勿二次取反
  raycaster.setFromCamera(pointerNDC, camera);
  const hit = raycaster.intersectObjects(hitTargets, false)[0];
  setHovered(hit ? hit.object.userData.cs : null, e.clientX, e.clientY);
});

canvas.addEventListener('click', (e) => {
  // 点到星座星点：显示浮签（触屏无 hover，用点击代替）；否则降下流星雨
  pointerNDC.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  raycaster.setFromCamera(pointerNDC, camera);
  const hit = raycaster.intersectObjects(hitTargets, false)[0];
  if (hit) {
    setHovered(hit.object.userData.cs, e.clientX, e.clientY);
    clearTimeout(window.__csTimer);
    window.__csTimer = setTimeout(() => setHovered(null), 2600);
  } else {
    burst(10);
  }
});

shutterEl.addEventListener('input', () => {
  shutterTarget = shutterEl.value / 100;
  shutterVal.textContent = shutterEl.value + '%';
});
burstBtn.addEventListener('click', () => burst(10));
patrolBtn.addEventListener('click', () => {
  patrolOn = !patrolOn;
  patrolBtn.classList.toggle('on', patrolOn);
  patrolBtn.setAttribute('aria-pressed', String(patrolOn));
});
patrolBtn.classList.toggle('on', patrolOn);

/* ---------------- camera orbit + parallax ---------------- */
let camAngle = 0.6;
const CAM_R = 34, CAM_H = 11.5;
function updateCamera(dt) {
  if (patrolOn) camAngle += dt * 0.035;
  mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 3);
  mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 3);
  camera.position.set(
    Math.sin(camAngle) * CAM_R + mouse.x * 2.4,
    CAM_H + mouse.y * 1.6,
    Math.cos(camAngle) * CAM_R
  );
  camera.lookAt(mouse.x * 3.2, 6.4, 0);
}

/* ---------------- main loop ---------------- */
const clock = new THREE.Clock();
let autoTimer = 2.0;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  starMat.uniforms.uTime.value = t;

  // 穹顶巡天旋转（物理感 easing 由快门插值体现）
  if (patrolOn) domeGroup.rotation.y += dt * 0.05;

  // 快门开合：指数趋近，物理感
  shutterOpen += (shutterTarget - shutterOpen) * Math.min(1, dt * 2.4);
  shutter.rotation.y = shutterOpen * (SLIT * 2 + 0.06);
  slitGlow.material.opacity = shutterOpen * 0.9;
  domeLight.intensity = shutterOpen * 60;

  // 定时流星
  autoTimer -= dt;
  if (autoTimer <= 0) {
    spawnMeteor(0);
    autoTimer = reduced ? 9 + Math.random() * 6 : 2.5 + Math.random() * 4;
  }
  updateMeteors(dt);
  updateCamera(dt);

  renderer.render(scene, camera);
}

/* ---------------- resize ---------------- */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------------- loader + intro ---------------- */
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  loader.classList.add('done');
  const els = document.querySelectorAll('[data-intro]');
  els.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 120 + i * 140));
}
setTimeout(boot, 3800); // 兜底
tick();
requestAnimationFrame(() => setTimeout(boot, 900));
