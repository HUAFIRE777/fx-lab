/* cablecar-3d · 云端缆车 — original implementation
 * 缆车沿 Catmull-Rom 钢索缓行，FBM 云海翻涌，三层山影视差，到站停靠播报。
 */
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const canvas = $('scene');
const EASE = (a, b, l, dt) => THREE.MathUtils.damp(a, b, l, dt);

/* ================= 基础 ================= */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xE9EFEB, 130, 460);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1200);
camera.position.set(-130, 26, 60);

/* 天空穹顶：山青雾 → 云白，禁彩虹 */
{
  const geo = new THREE.SphereGeometry(900, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vP; void main(){ vP=position;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP;
      void main(){ float h=normalize(vP).y;
        vec3 top=vec3(0.80,0.87,0.85), hor=vec3(0.949,0.961,0.953);
        vec3 c=mix(hor, top, smoothstep(-0.02,0.65,h));
        gl_FragColor=vec4(c,1.); }`
  });
  scene.add(new THREE.Mesh(geo, mat));
}

scene.add(new THREE.HemisphereLight(0xF2F5F3, 0x2E4A3E, 0.95));
const sun = new THREE.DirectionalLight(0xFFF6E8, 1.15);
sun.position.set(70, 110, 50);
scene.add(sun);

const PINE = 0x2E4A3E, PINE_D = 0x22362C, CLOUD = 0xF2F5F3, RED = 0xD84A3A;

/* ================= 钢索路径 ================= */
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-110, 14, 10),
  new THREE.Vector3(-78, 22, 2),
  new THREE.Vector3(-55, 30, -8),   // 支架塔 1
  new THREE.Vector3(-32, 27.2, -2), // 垂度
  new THREE.Vector3(-12, 25, 6),    // 云海站
  new THREE.Vector3(8, 31, 4),      // 垂度
  new THREE.Vector3(38, 39, -6),    // 支架塔 2
  new THREE.Vector3(62, 36, 2),      // 垂度
  new THREE.Vector3(88, 34, 8),
  new THREE.Vector3(110, 33, 10),
], false, 'centripetal');
const curveLen = curve.getLength();

scene.add(new THREE.Mesh(
  new THREE.TubeGeometry(curve, 220, 0.07, 8, false),
  new THREE.MeshStandardMaterial({ color: 0x24352E, roughness: 0.55, metalness: 0.35 })
));

/* 站点 t：采样找最近点 */
function tOfPoint(p) {
  let best = 0, bd = 1e9;
  for (let i = 0; i <= 400; i++) {
    const t = i / 400, q = curve.getPointAt(t);
    const d = q.distanceToSquared(p);
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}
const stations = [
  { name: '山麓站', sub: '海拔 480 米 · 始发', t: tOfPoint(new THREE.Vector3(-110, 14, 10)) },
  { name: '云海站', sub: '海拔 1210 米 · 观云台', t: tOfPoint(new THREE.Vector3(-12, 25, 6)) },
  { name: '峰顶站', sub: '海拔 1860 米 · 终点', t: tOfPoint(new THREE.Vector3(110, 33, 10)) },
];

/* ================= 支架塔 ================= */
function tower(top) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: PINE_D, roughness: 0.8 });
  const baseY = 4, topY = top.y;
  for (const sx of [-1.6, 1.6]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, topY - baseY, 0.7), mat);
    leg.position.set(sx, (topY + baseY) / 2, 0);
    leg.rotation.z = sx > 0 ? 0.055 : -0.055;
    g.add(leg);
  }
  const arm = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.8, 1.1), mat);
  arm.position.y = topY - 0.5; g.add(arm);
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.5, topY - baseY, 0.5), mat);
  brace.rotation.z = 0.5; brace.position.y = (topY + baseY) / 2; g.add(brace);
  for (const sx of [-2.6, 2.6]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 14), mat);
    wheel.rotation.x = Math.PI / 2; wheel.position.set(sx, topY - 0.1, 0); g.add(wheel);
  }
  g.position.set(top.x, 0, top.z);
  return g;
}
scene.add(tower(new THREE.Vector3(-55, 30, -8)));
scene.add(tower(new THREE.Vector3(38, 39, -6)));

/* ================= 缆车 ================= */
const car = new THREE.Group();
const bodyG = new THREE.Group();           // 吊舱（摇摆）
bodyG.position.y = -5.4;
car.add(bodyG);
{
  const red = new THREE.MeshStandardMaterial({ color: RED, roughness: 0.42, metalness: 0.12 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x20302A, roughness: 0.16, metalness: 0.65 });
  const dark = new THREE.MeshStandardMaterial({ color: PINE_D, roughness: 0.7 });
  const white = new THREE.MeshStandardMaterial({ color: CLOUD, roughness: 0.5 });

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.8, 2.4), red); bodyG.add(cabin);
  const winBand = new THREE.Mesh(new THREE.BoxGeometry(3.46, 1.05, 2.46), glass);
  winBand.position.y = 0.55; bodyG.add(winBand);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.62, 0.28, 2.62), white);
  roof.position.y = 1.54; bodyG.add(roof);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.42, 2.05), dark);
  skirt.position.y = -1.58; bodyG.add(skirt);
  const lampF = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xFFF2D8, emissive: 0xFFDF9E, emissiveIntensity: 1.4 }));
  lampF.position.set(0, -0.9, 1.24); bodyG.add(lampF);

  const armM = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.9, 10), dark);
  armM.position.y = 3.45; bodyG.add(armM);          // 从舱顶连到滑轮
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.62), dark);
  trolley.position.y = 5.42; bodyG.add(trolley);
  for (const sx of [-0.52, 0.52]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 14), dark);
    w.rotation.x = Math.PI / 2; w.position.set(sx, 5.62, 0); bodyG.add(w);
  }
}
scene.add(car);

/* ================= 群山：三层剪影 ================= */
function ridgeTexture(seed, alpha, withTrees) {
  const W = 1024, H = 256;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  let s = seed * 7919 + 13;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const hs = [];
  x.beginPath(); x.moveTo(0, H);
  for (let px = 0; px <= W; px += 8) {
    const y = 205 - Math.abs(Math.sin(px * 0.008 + seed)) * 78 - rnd() * 34;
    hs.push([px, y]); x.lineTo(px, y);
  }
  x.lineTo(W, H); x.closePath();
  x.globalAlpha = alpha; x.fillStyle = '#2E4A3E'; x.fill();
  if (withTrees) {
    x.globalAlpha = alpha; x.fillStyle = '#22362C';
    for (let i = 0; i < 70; i++) {
      const [px, py] = hs[(rnd() * hs.length) | 0];
      const w = 5 + rnd() * 7;
      x.beginPath(); x.moveTo(px, py - 4 - rnd() * 8);
      x.lineTo(px - w / 2, py + 2); x.lineTo(px + w / 2, py + 2); x.closePath(); x.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
[
  { z: -200, w: 760, h: 190, y: 62, seed: 3, a: 0.42, trees: false },
  { z: -120, w: 660, h: 165, y: 48, seed: 11, a: 0.68, trees: false },
  { z: -58, w: 560, h: 140, y: 36, seed: 27, a: 1.0, trees: true },
].forEach(L => {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(L.w, L.h),
    new THREE.MeshBasicMaterial({ map: ridgeTexture(L.seed, L.a, L.trees), transparent: true, fog: true })
  );
  m.position.set(0, L.y, L.z);
  scene.add(m);
});

/* ================= 云海：FBM 翻涌 ================= */
const cloudUniforms = { uTime: { value: 0 } };
{
  const geo = new THREE.PlaneGeometry(560, 560, 1, 1);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: cloudUniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
                   mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float v=0.,a=.5;
        for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
      void main(){
        vec2 uv=vUv*vec2(7.,7.);
        float n =fbm(uv+vec2(uTime*.030,uTime*.012));
        float n2=fbm(uv*2.1+vec2(-uTime*.020,uTime*.010));
        float d=smoothstep(.26,.74,n*.72+n2*.28);
        vec3 col=mix(vec3(.878,.906,.894),vec3(.992,1.,.984),d);
        float a=smoothstep(.12,.62,n*.78+n2*.22);
        gl_FragColor=vec4(col,a*.94);
      }`
  });
  const sea = new THREE.Mesh(geo, mat);
  sea.rotation.x = -Math.PI / 2; sea.position.y = 5;
  scene.add(sea);
}
/* 云团精灵：近景视差 */
const puffs = [];
{
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 6, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,.95)');
  g.addColorStop(0.55, 'rgba(248,250,249,.55)');
  g.addColorStop(1, 'rgba(248,250,249,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  let s = 99;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 26; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false,
      opacity: 0.5 + rnd() * 0.4, fog: false
    }));
    const sc = 14 + rnd() * 26;
    sp.scale.set(sc, sc * 0.55, 1);
    sp.position.set(-140 + rnd() * 280, 7 + rnd() * 14, -40 + rnd() * 70);
    sp.userData.v = 0.35 + rnd() * 0.7;
    scene.add(sp); puffs.push(sp);
  }
}

/* ================= 站台（起终点）：开放式登车甲板，车厢悬于甲板之上 ================= */
function platform(p) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: PINE, roughness: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: PINE_D, roughness: 0.8 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(12, 1.8, 9), mat);
  deck.position.y = 5.0; g.add(deck);                    // 甲板顶 y=5.9，低于舱底
  for (const [sx, sz] of [[-5.4, -3.9], [5.4, -3.9], [-5.4, 3.9], [5.4, 3.9]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 0.4), dark);
    post.position.set(sx, 6.4, sz); g.add(post);
  }
  const railY = 7.0;
  for (const sz of [-3.9, 3.9]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.16, 0.16), dark);
    bar.position.set(0, railY, sz); g.add(bar);
  }
  for (const sx of [-5.4, 5.4]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 7.9), dark);
    bar.position.set(sx, railY, 0); g.add(bar);
  }
  /* 站牌：立于侧面，避开车厢摆动区 */
  const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.6, 0.35), dark);
  signPost.position.set(5.4, 7.6, 3.6); g.add(signPost);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.5, 3.6),
    new THREE.MeshStandardMaterial({ color: RED, roughness: 0.5 }));
  sign.position.set(5.4, 9.6, 3.6); g.add(sign);
  g.position.set(p.x, 0, p.z);
  return g;
}
scene.add(platform(new THREE.Vector3(-110, 14, 10)));
scene.add(platform(new THREE.Vector3(110, 33, 10)));

/* ================= 状态与交互 ================= */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let t = stations[0].t, dir = 1;
let speed = 0, boost = 0, dwell = 0, jumpTarget = null;
let paused = false, exterior = true;
let sliderV = reduced ? 25 : 50;

const speedInput = $('speed'), speedVal = $('speedVal');
const viewBtn = $('viewBtn'), pauseBtn = $('pauseBtn');
const plate = $('plate'), plateName = $('plateName'), plateSub = $('plateSub');
const statStop = $('statStop'), statSpeed = $('statSpeed');
const hint = $('hint');
const stopBtns = [...document.querySelectorAll('.stop')];

function baseSpeed() { return THREE.MathUtils.lerp(0.004, 0.030, sliderV / 100); }
speedInput.addEventListener('input', () => {
  sliderV = +speedInput.value;
  speedVal.textContent = sliderV + '%';
});
viewBtn.addEventListener('click', () => {
  exterior = !exterior;
  viewBtn.textContent = exterior ? '车外跟随' : '车内视角';
  viewBtn.classList.toggle('on', exterior);
});
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? '继续' : '暂停';
  pauseBtn.classList.toggle('on', paused);
});
stopBtns.forEach(b => b.addEventListener('click', () => {
  const s = stations[+b.dataset.stop];
  jumpTarget = s.t;
  dir = (s.t - t) >= 0 ? 1 : -1;
  paused = false; pauseBtn.textContent = '暂停'; pauseBtn.classList.remove('on');
  hideHint();
}));
window.addEventListener('wheel', (e) => {
  if (reduced) return;
  boost = Math.min(boost + Math.min(Math.abs(e.deltaY) * 2.4e-6, 0.004), 0.030);
  hideHint();
}, { passive: true });

let hintGone = false;
function hideHint() {
  if (hintGone) return; hintGone = true;
  hint.classList.add('gone');
}
setTimeout(hideHint, 9000);

function showPlate(s) {
  plateName.textContent = s.name;
  plateSub.textContent = s.sub + ' · 停靠 3 秒';
  plate.classList.add('show');
  stopBtns.forEach((b, i) => b.classList.toggle('here', stations[i] === s));
  statStop.textContent = s.name;
}
function hidePlate() { plate.classList.remove('show'); }

function nearestStation() {
  let best = stations[0], bd = 1e9;
  for (const s of stations) { const d = Math.abs(s.t - t); if (d < bd) { bd = d; best = s; } }
  return best;
}

/* ================= 主循环 ================= */
const clock = new THREE.Clock();
const _p = new THREE.Vector3(), _tan = new THREE.Vector3(), _ahead = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0), _perp = new THREE.Vector3();
const _des = new THREE.Vector3(), _look = new THREE.Vector3();
let lookSm = new THREE.Vector3(-110, 10, 10);

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const el = clock.elapsedTime;
  cloudUniforms.uTime.value = el;

  /* 云团漂移 */
  for (const sp of puffs) {
    sp.position.x += sp.userData.v * dt;
    if (sp.position.x > 150) sp.position.x = -150;
  }

  /* 速度与停靠 */
  boost *= Math.exp(-dt * 1.1);
  const tgt = (paused || dwell > 0) ? 0 : baseSpeed() + boost;
  if (dwell > 0) {
    dwell -= dt;
    if (dwell <= 0) { hidePlate(); }
  } else if (jumpTarget !== null) {
    speed = EASE(speed, 0.022, 4, dt);
    const d = jumpTarget - t;
    if (Math.abs(d) < 0.0012) {
      t = jumpTarget; jumpTarget = null;
      const s = stations.reduce((a, b) => Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a);
      dwell = 3; showPlate(s); speed = 0;
    } else t += Math.sign(d) * Math.min(Math.abs(d), speed * dt * 1.6);
  } else {
    /* 前方最近站：接近则减速进站 */
    let ahead = null, ad = 1e9;
    for (const s of stations) { const d = (s.t - t) * dir; if (d > 0 && d < ad) { ad = d; ahead = s; } }
    let v = tgt;
    if (ahead && ad < 0.022) v = Math.min(v, tgt * Math.max(ad / 0.022, 0));
    speed = EASE(speed, v, 5, dt);
    t += dir * speed * dt;
    if (ahead && Math.abs(t - ahead.t) < 0.0009) {
      t = ahead.t; dwell = 3; showPlate(ahead); speed = 0;
    }
    if (t >= 1) { t = 1; dir = -1; dwell = 3; showPlate(stations[2]); speed = 0; }
    if (t <= 0) { t = 0; dir = 1; dwell = 3; showPlate(stations[0]); speed = 0; }
  }

  /* 缆车位姿 */
  curve.getPointAt(t, _p);
  curve.getTangentAt(t, _tan).normalize();
  car.position.copy(_p);
  _ahead.copy(_p).add(_tan);
  car.lookAt(_ahead);
  const sway = Math.sin(el * 1.25) * 0.018 + Math.min(speed / 0.03, 1) * Math.sin(el * 2.2) * 0.035;
  bodyG.rotation.z = sway;
  bodyG.rotation.x = Math.sin(el * 0.9) * 0.012;

  /* 相机 */
  if (exterior) {
    _perp.crossVectors(_tan, _up).normalize();
    _des.copy(_p).addScaledVector(_tan, -15).addScaledVector(_perp, 12).addScaledVector(_up, 5.5);
    _look.copy(_p).addScaledVector(_up, -4.4);
  } else {
    _des.copy(_p).addScaledVector(_tan, 1.6).addScaledVector(_up, -4.4);
    _look.copy(_p).addScaledVector(_tan, 45).addScaledVector(_up, -9);
  }
  const k = 1 - Math.exp(-dt * (exterior ? 3.2 : 5.5));
  camera.position.lerp(_des, k);
  lookSm.lerp(_look, 1 - Math.exp(-dt * 4.5));
  camera.lookAt(lookSm);

  /* 读数 */
  statSpeed.textContent = ((speed + boost) * curveLen * 2.4).toFixed(1);
  if (dwell <= 0 && jumpTarget === null) statStop.textContent = nearestStation().name;

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ================= loader：超时兜底 ================= */
let done = false;
function complete() {
  if (done) return; done = true;
  $('loader').classList.add('done');
  const els = [...document.querySelectorAll('[data-intro]')];
  els.forEach((e, i) => setTimeout(() => e.classList.add('is-in'), 350 + i * 150));
  setTimeout(() => $('loader').remove(), 1400);
}
window.addEventListener('load', () => setTimeout(complete, 700));
setTimeout(complete, 3800);
