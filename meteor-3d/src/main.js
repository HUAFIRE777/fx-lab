import * as THREE from 'three';

/* ============ meteor-3d · 星陨：流星雨撞击 ============
 * 纯程序化：夜空穹顶 shader / 星点 / 山脊剪影 / 流星火尾粒子 /
 * 撞击冲击波 / 尘埃爆发 / 撞击坑。零外部请求。
 */

const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (cur, target, lambda, dt) => lerp(cur, target, 1 - Math.exp(-lambda * dt));

/* ---------- 渲染器 / 场景 / 相机 ---------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const fogNight = new THREE.Color(0x050914);
const fogDay = new THREE.Color(0xbcd6f2);
scene.fog = new THREE.Fog(fogNight.getHex(), 60, 200);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 600);
const camBase = new THREE.Vector3(0, 8.5, 31);
camera.position.copy(camBase);
camera.lookAt(0, 5, 0);

/* ---------- 程序化纹理（canvas 生成，无外部请求） ---------- */
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,220,170,.9)');
  gr.addColorStop(0.55, 'rgba(255,140,60,.35)');
  gr.addColorStop(1, 'rgba(255,110,40,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function craterTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 8, 128, 128, 128);
  gr.addColorStop(0, 'rgba(2,5,12,.96)');
  gr.addColorStop(0.52, 'rgba(6,10,22,.92)');
  gr.addColorStop(0.66, 'rgba(20,28,52,.55)');
  gr.addColorStop(0.74, 'rgba(255,120,50,.5)');   // 撞击坑辉光边缘
  gr.addColorStop(0.8, 'rgba(255,120,50,.12)');
  gr.addColorStop(1, 'rgba(255,120,50,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const TEX_GLOW = glowTexture();
const TEX_CRATER = craterTexture();

/* ---------- 夜空穹顶 ---------- */
const skyUni = {
  topN: { value: new THREE.Color(0x02040d) },
  horN: { value: new THREE.Color(0x0d1a38) },
  topD: { value: new THREE.Color(0x6fa8e0) },
  horD: { value: new THREE.Color(0xdceeff) },
  dayF: { value: 0 },
};
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(260, 32, 20),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: skyUni,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `
      varying vec3 vP;
      uniform vec3 topN, horN, topD, horD; uniform float dayF;
      void main(){
        float h = normalize(vP).y;
        vec3 top = mix(topN, topD, dayF);
        vec3 hor = mix(horN, horD, dayF);
        float m = smoothstep(0.02, 0.62, max(h, 0.0));
        vec3 col = mix(hor, top, m);
        if (h < 0.0) col = hor * 0.5;
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
);
scene.add(sky);

/* ---------- 星点 ---------- */
const STAR_N = 700;
const starPos = new Float32Array(STAR_N * 3);
for (let i = 0; i < STAR_N; i++) {
  const th = rand(0, Math.PI * 2), ph = rand(0.06, Math.PI * 0.48);
  const r = 240;
  starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
  starPos[i * 3 + 1] = r * Math.cos(ph);
  starPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({
  size: 1.6, sizeAttenuation: false, map: TEX_GLOW, color: 0xdfeaff,
  transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

/* ---------- 地面 ---------- */
const groundNight = new THREE.Color(0x0a1122);
const groundDay = new THREE.Color(0xa9c3e2);
const groundMat = new THREE.MeshStandardMaterial({ color: groundNight.clone(), roughness: 0.95, metalness: 0 });
const ground = new THREE.Mesh(new THREE.CircleGeometry(170, 72), groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---------- 山脊剪影（两层） ---------- */
function ridge(z, hBase, hVar, colorNight, colorDay, seed) {
  const pts = [];
  for (let x = -180; x <= 180; x += 6) {
    const h = hBase + Math.abs(Math.sin(x * 0.05 + seed)) * hVar + Math.sin(x * 0.013 + seed * 2) * hVar * 0.5;
    pts.push(x, Math.max(0.5, h));
  }
  const shape = new THREE.Shape();
  shape.moveTo(-180, -3);
  for (let i = 0; i < pts.length; i += 2) shape.lineTo(pts[i], pts[i + 1]);
  shape.lineTo(180, -3); shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshBasicMaterial({ color: colorNight, fog: true });
  const m = new THREE.Mesh(geo, mat);
  m.position.z = z;
  scene.add(m);
  return { mat, night: new THREE.Color(colorNight), day: new THREE.Color(colorDay) };
}
const ridges = [
  ridge(-150, 7, 9, 0x040814, 0x8aa9cf, 1.7),
  ridge(-105, 4, 6, 0x060c1c, 0xa3bfe0, 4.2),
];

/* ---------- 灯光 ---------- */
const ambient = new THREE.AmbientLight(0x8fa8d8, 0.35);
scene.add(ambient);
const moon = new THREE.DirectionalLight(0x9db8ff, 0.55);
moon.position.set(-40, 60, 20);
scene.add(moon);
const impactLight = new THREE.PointLight(0xff7a33, 0, 90, 1.8);
scene.add(impactLight);

/* ---------- 状态 ---------- */
let dayF = 0, dayTarget = 0;
let freq = 4;
let hits = 0, meteorTotal = 0;
const hitEl = document.getElementById('hitCount');
const metEl = document.getElementById('meteorCount');
const hintEl = document.getElementById('hint');
let hintGone = false;

const meteors = [];
const rings = [];
const decals = [];
const bursts = [];
const craters = [];
const MAX_CRATERS = 26;
let shake = 0;
let spawnTimer = 0;

/* ---------- 流星 ---------- */
const TRAIL = 90;
const headGeoShared = new THREE.PlaneGeometry(1, 1);
const trailMatBase = new THREE.PointsMaterial({
  size: 1.9, map: TEX_GLOW, vertexColors: true, transparent: true,
  depthWrite: false, blending: THREE.AdditiveBlending,
});

class Meteor {
  constructor(target) {
    meteorTotal++; metEl.textContent = meteorTotal;
    const start = target.clone().add(new THREE.Vector3(
      rand(24, 58) * (Math.random() < 0.5 ? -1 : 1), rand(44, 64), rand(-16, 8)));
    this.pos = start;
    this.dir = target.clone().sub(start).normalize();
    this.speed = rand(30, 46);
    this.life = start.distanceTo(target) / this.speed;
    this.t = 0;
    this.target = target.clone();

    this.headMat = new THREE.SpriteMaterial({
      map: TEX_GLOW, color: 0xffe6c4, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.head = new THREE.Sprite(this.headMat);
    this.head.scale.setScalar(rand(2.6, 3.6));
    this.head.position.copy(this.pos);
    scene.add(this.head);

    // 实心火核：短线
    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.coreMat = new THREE.LineBasicMaterial({
      color: 0xffd9a8, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.core = new THREE.Line(lg, this.coreMat);
    scene.add(this.core);

    // 拖尾粒子
    this.hist = [];
    for (let i = 0; i < TRAIL; i++) this.hist.push(this.pos.clone());
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    const cols = new Float32Array(TRAIL * 3);
    const cHead = new THREE.Color(0xffc07a), cMid = new THREE.Color(0xff5a22);
    for (let i = 0; i < TRAIL; i++) {
      const f = Math.pow(1 - i / TRAIL, 1.6);
      const c = i < TRAIL * 0.3 ? cHead.clone().multiplyScalar(f) : cMid.clone().multiplyScalar(f * 0.9);
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    tg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    this.trailMat = trailMatBase.clone();
    this.trail = new THREE.Points(tg, this.trailMat);
    this.trail.frustumCulled = false;
    scene.add(this.trail);
    this.dead = false;
  }
  update(dt) {
    this.t += dt;
    this.pos.addScaledVector(this.dir, this.speed * dt);
    this.hist.pop();
    this.hist.unshift(this.pos.clone());
    const p = this.trail.geometry.attributes.position.array;
    for (let i = 0; i < TRAIL; i++) {
      p[i * 3] = this.hist[i].x; p[i * 3 + 1] = this.hist[i].y; p[i * 3 + 2] = this.hist[i].z;
    }
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.head.position.copy(this.pos);
    const cp = this.core.geometry.attributes.position;
    cp.setXYZ(0, this.pos.x, this.pos.y, this.pos.z);
    cp.setXYZ(1, this.pos.x - this.dir.x * 5, this.pos.y - this.dir.y * 5, this.pos.z - this.dir.z * 5);
    cp.needsUpdate = true;
    const dim = 1 - 0.4 * dayF;
    this.trailMat.opacity = dim;
    this.headMat.opacity = dim;
    this.coreMat.opacity = 0.95 * dim;
    if (this.t >= this.life || this.pos.y <= 0.1) this.impact();
  }
  impact() {
    this.dead = true;
    const p = this.target.clone(); p.y = 0;
    spawnImpact(p);
    scene.remove(this.head, this.core, this.trail);
    this.headMat.dispose(); this.coreMat.dispose(); this.trailMat.dispose();
    this.head.geometry.dispose(); this.core.geometry.dispose(); this.trail.geometry.dispose();
  }
}

function spawnMeteor(target) {
  if (!target) {
    target = new THREE.Vector3(rand(-55, 55), 0, rand(-45, 25));
  }
  target.y = 0;
  meteors.push(new Meteor(target));
}

/* ---------- 撞击：冲击波 / 辉光 / 尘埃 / 撞击坑 ---------- */
function spawnImpact(p) {
  hits++; hitEl.textContent = hits;
  shake = 1;
  impactLight.position.set(p.x, 4, p.z);
  impactLight.intensity = 220;

  // 地面辉光贴片
  const dMat = new THREE.MeshBasicMaterial({
    map: TEX_GLOW, color: 0xff7a33, transparent: true, opacity: 0.95,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), dMat);
  decal.rotation.x = -Math.PI / 2;
  decal.position.set(p.x, 0.07, p.z);
  scene.add(decal);
  decals.push({ mesh: decal, t: 0, dur: 1.5 });

  // 双冲击波环
  for (const [s0, s1, dur, w] of [[1.5, 15, 1.0, 0.9], [1.0, 24, 1.7, 0.55]]) {
    const rMat = new THREE.MeshBasicMaterial({
      color: 0xff8a3c, transparent: true, opacity: w,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.93, 1.0, 64), rMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.x, 0.1, p.z);
    scene.add(ring);
    rings.push({ mesh: ring, t: 0, dur, s0, s1, w });
  }

  // 尘埃爆发
  burstDust(p);

  // 撞击坑（永久保留，上限轮转）
  const cMat = new THREE.MeshBasicMaterial({
    map: TEX_CRATER, transparent: true, opacity: 0.96, depthWrite: false,
  });
  const crater = new THREE.Mesh(new THREE.CircleGeometry(rand(1.6, 2.8), 40), cMat);
  crater.rotation.x = -Math.PI / 2;
  crater.rotation.z = rand(0, Math.PI * 2);
  crater.position.set(p.x, 0.045, p.z);
  scene.add(crater);
  craters.push(crater);
  if (craters.length > MAX_CRATERS) {
    const old = craters.shift();
    scene.remove(old); old.material.dispose(); old.geometry.dispose();
  }
}

function burstDust(p) {
  const N = 130;
  const pos = new Float32Array(N * 3);
  const vel = [];
  const life = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = p.x + rand(-0.6, 0.6);
    pos[i * 3 + 1] = rand(0.1, 1.2);
    pos[i * 3 + 2] = p.z + rand(-0.6, 0.6);
    const a = rand(0, Math.PI * 2);
    const sp = rand(3, 11);
    vel.push(new THREE.Vector3(Math.cos(a) * sp, rand(2.5, 8.5), Math.sin(a) * sp));
    life[i] = rand(1.0, 2.1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    size: 1.35, map: TEX_GLOW, color: 0xff8a3c, transparent: true,
    opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  scene.add(pts);
  bursts.push({ pts, vel, life, t: 0, max: 2.1 });
}

/* ---------- 交互 ---------- */
const freqEl = document.getElementById('freq');
const freqVal = document.getElementById('freqVal');
function syncFreqUI() {
  freqVal.textContent = freq + ' 级';
  freqEl.style.setProperty('--fill', ((freq - 1) / 9 * 100).toFixed(1) + '%');
}
freqEl.addEventListener('input', () => { freq = +freqEl.value; syncFreqUI(); });
syncFreqUI();

const nightBtn = document.getElementById('nightBtn');
const dayBtn = document.getElementById('dayBtn');
function setDay(isDay) {
  dayTarget = isDay ? 1 : 0;
  nightBtn.classList.toggle('on', !isDay);
  dayBtn.classList.toggle('on', isDay);
  nightBtn.setAttribute('aria-pressed', String(!isDay));
  dayBtn.setAttribute('aria-pressed', String(isDay));
}
nightBtn.addEventListener('click', () => setDay(false));
dayBtn.addEventListener('click', () => setDay(true));

const raycaster = new THREE.Raycaster();
function summonAt(clientX, clientY) {
  const nx = (clientX / window.innerWidth) * 2 - 1;
  const ny = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera({ x: nx, y: ny }, camera);
  const o = raycaster.ray.origin, d = raycaster.ray.direction;
  let target = null;
  if (d.y < -0.02) {
    const t = -o.y / d.y;
    if (t > 0 && t < 500) {
      target = o.clone().addScaledVector(d, t);
      target.x = Math.max(-70, Math.min(70, target.x));
      target.z = Math.max(-60, Math.min(30, target.z));
    }
  }
  spawnMeteor(target);
  if (!hintGone) { hintGone = true; hintEl.classList.add('gone'); }
}
canvas.addEventListener('click', (e) => summonAt(e.clientX, e.clientY));
document.getElementById('summonBtn').addEventListener('click', () => {
  summonAt(window.innerWidth * rand(0.3, 0.7), window.innerHeight * rand(0.15, 0.35));
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- 主循环 ---------- */
const clock = new THREE.Clock();
function intervalFor(f) { return lerp(4.2, 0.45, (f - 1) / 9); }

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 昼夜过渡
  dayF = damp(dayF, dayTarget, 2.4, dt);
  skyUni.dayF.value = dayF;
  scene.fog.color.copy(fogNight).lerp(fogDay, dayF);
  groundMat.color.copy(groundNight).lerp(groundDay, dayF);
  for (const r of ridges) r.mat.color.copy(r.night).lerp(r.day, dayF);
  starMat.opacity = (1 - dayF) * (0.72 + 0.28 * Math.sin(t * 2.1));
  ambient.intensity = lerp(0.35, 1.05, dayF);
  moon.intensity = lerp(0.55, 1.5, dayF);
  moon.color.setHex(dayF > 0.5 ? 0xfff3e0 : 0x9db8ff);

  // 自动流星雨
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnMeteor();
    spawnTimer = intervalFor(freq) * rand(0.7, 1.3);
  }

  // 流星
  for (let i = meteors.length - 1; i >= 0; i--) {
    meteors[i].update(dt);
    if (meteors[i].dead) meteors.splice(i, 1);
  }

  // 冲击波环
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.t += dt;
    const k = Math.min(r.t / r.dur, 1);
    const e = 1 - Math.pow(1 - k, 3);           // easeOutCubic：物理感扩散
    const s = lerp(r.s0, r.s1, e);
    r.mesh.scale.set(s, s, 1);
    r.mesh.material.opacity = r.w * (1 - k);
    if (k >= 1) { scene.remove(r.mesh); r.mesh.geometry.dispose(); r.mesh.material.dispose(); rings.splice(i, 1); }
  }

  // 地面辉光
  for (let i = decals.length - 1; i >= 0; i--) {
    const d = decals[i]; d.t += dt;
    const k = Math.min(d.t / d.dur, 1);
    d.mesh.scale.setScalar(lerp(3, 17, 1 - Math.pow(1 - k, 2)));
    d.mesh.material.opacity = 0.95 * (1 - k);
    if (k >= 1) { scene.remove(d.mesh); d.mesh.geometry.dispose(); d.mesh.material.dispose(); decals.splice(i, 1); }
  }

  // 尘埃
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i]; b.t += dt;
    const p = b.pts.geometry.attributes.position.array;
    for (let j = 0; j < b.vel.length; j++) {
      const v = b.vel[j];
      const alive = b.t < b.life[j];
      if (alive) {
        v.y -= 7.5 * dt;
        p[j * 3] += v.x * dt; p[j * 3 + 1] += v.y * dt; p[j * 3 + 2] += v.z * dt;
        if (p[j * 3 + 1] < 0.06) { p[j * 3 + 1] = 0.06; v.y *= -0.25; v.x *= 0.6; v.z *= 0.6; }
      } else {
        p[j * 3 + 1] = -10;   // 藏到地下
      }
    }
    b.pts.geometry.attributes.position.needsUpdate = true;
    b.pts.material.opacity = 0.9 * Math.max(0, 1 - b.t / b.max);
    if (b.t >= b.max) {
      scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); bursts.splice(i, 1);
    }
  }

  // 撞击闪光衰减
  impactLight.intensity = damp(impactLight.intensity, 0, 5, dt);

  // 相机：呼吸漂移 + 撞击震屏
  shake = damp(shake, 0, 5.5, dt);
  camera.position.set(
    camBase.x + Math.sin(t * 0.24) * 0.9 + (Math.random() - 0.5) * 0.5 * shake,
    camBase.y + Math.sin(t * 0.31) * 0.35 + (Math.random() - 0.5) * 0.35 * shake,
    camBase.z
  );
  camera.lookAt(0, 5, 0);

  renderer.render(scene, camera);
}
animate();

/* ---------- 开场：3 颗先行流星 + intro ---------- */
// 开场即有流星划过，第一屏就有戏
setTimeout(() => spawnMeteor(), 350);
setTimeout(() => spawnMeteor(), 1150);
setTimeout(() => spawnMeteor(), 1950);

const loader = document.getElementById('loader');
const intros = Array.from(document.querySelectorAll('[data-intro]'));
let revealed = false;
function reveal() {
  if (revealed) return; revealed = true;
  loader.classList.add('done');
  intros.forEach((el, i) => {
    el.style.transitionDelay = (i * 0.12) + 's';
    requestAnimationFrame(() => el.classList.add('is-in'));
  });
}
setTimeout(reveal, 1000);
setTimeout(reveal, 3800);   // 兜底：完成态必达
