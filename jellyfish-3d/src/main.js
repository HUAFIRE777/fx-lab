/* jellyfish-3d · 水母群游
 * 手法：程序化水母（伞盖 fresnel shader + 触手程序化弹簧摆动），
 * 呼吸式游动（收缩=推进），深海光柱 + 浮游颗粒，点击海面涟漪吸引聚拢。
 * 代码全部原创实现（three.js 仅作渲染器）。
 */
import * as THREE from 'three';

document.documentElement.classList.add('js');

/* ================= 基础 ================= */
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04121F);
scene.fog = new THREE.FogExp2(0x04121F, 0.042);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
const camBase = new THREE.Vector3(0, 0.4, 13.5);
camera.position.copy(camBase);
camera.lookAt(0, 0, 0);

const CYAN = new THREE.Color(0x7DF9FF);
const MAG = new THREE.Color(0xFF6FD8);

let glow = 1.0;            // 发光强度（滑杆）
const clock = new THREE.Clock();
let elapsed = 0;

/* ================= 水母 ================= */
const bellVert = `
uniform float uTime;
uniform float uPhase;
varying vec3 vN;
varying vec3 vV;
varying float vY;
void main(){
  vN = normalMatrix * normal;
  vec3 p = position;
  p += normal * sin(uTime * 2.2 + uPhase + position.y * 4.0) * 0.035;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vV = -mv.xyz;
  vY = position.y;
  gl_Position = projectionMatrix * mv;
}`;
const bellFrag = `
uniform vec3 uCyan;
uniform vec3 uMag;
uniform float uTint;
uniform float uGlow;
varying vec3 vN;
varying vec3 vV;
varying float vY;
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  float fres = pow(1.0 - abs(dot(n, v)), 2.0);
  vec3 base = mix(uCyan, uMag, uTint);
  float top = smoothstep(-0.2, 1.0, vY);
  vec3 col = base * (0.22 + 0.78 * top) + base * fres * 1.7;
  float a = (0.16 + fres * 0.84) * uGlow;
  gl_FragColor = vec4(col * uGlow, a);
}`;

const bellGeo = new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.52);
const coreGeo = new THREE.SphereGeometry(0.3, 12, 10);

const T_SEG = 9;                 // 每条触手分段数
const T_COUNT = 7;               // 缘触手数
const A_COUNT = 4;               // 口腕数

class Jellyfish {
  constructor() {
    this.group = new THREE.Group();
    this.size = 0.7 + Math.random() * 0.8;
    this.tint = Math.random() < 0.24 ? 1 : 0;   // 约 1/4 品红个体
    this.phase = Math.random() * Math.PI * 2;
    this.pulseRate = 0.55 + Math.random() * 0.35;
    this.seed = Math.random() * 100;
    this.homeY = -3.2 + Math.random() * 6.4;

    const tintCol = this.tint ? MAG : CYAN;

    this.bellMat = new THREE.ShaderMaterial({
      vertexShader: bellVert,
      fragmentShader: bellFrag,
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: this.phase },
        uCyan: { value: CYAN },
        uMag: { value: MAG },
        uTint: { value: this.tint },
        uGlow: { value: glow },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.bell = new THREE.Mesh(bellGeo, this.bellMat);
    this.group.add(this.bell);

    this.coreMat = new THREE.MeshBasicMaterial({
      color: tintCol.clone(), transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeo, this.coreMat);
    core.position.y = 0.34;
    this.group.add(core);

    // 触手：一条 LineSegments 全包，additive 衰减到黑=隐形
    const tentTotal = T_COUNT + A_COUNT;
    const vCount = tentTotal * (T_SEG - 1) * 2;
    this.tPos = new Float32Array(vCount * 3);
    this.tCol = new Float32Array(vCount * 3);
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(this.tPos, 3));
    tg.setAttribute('color', new THREE.BufferAttribute(this.tCol, 3));
    this.tentMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.tentLines = new THREE.LineSegments(tg, this.tentMat);
    this.tentLines.frustumCulled = false;
    this.group.add(this.tentLines);

    this.tents = [];
    for (let i = 0; i < T_COUNT; i++) {
      const a = (i / T_COUNT) * Math.PI * 2 + Math.random() * 0.4;
      this.tents.push({ root: new THREE.Vector3(Math.cos(a) * 0.78, 0.02, Math.sin(a) * 0.78), len: 1.7 + Math.random() * 1.3, ph: Math.random() * 6.28 });
    }
    for (let i = 0; i < A_COUNT; i++) {
      const a = (i / A_COUNT) * Math.PI * 2 + 0.5;
      this.tents.push({ root: new THREE.Vector3(Math.cos(a) * 0.22, 0.3, Math.sin(a) * 0.22), len: 0.7 + Math.random() * 0.4, ph: Math.random() * 6.28 });
    }
    this.baseColor = tintCol.clone();

    this.pos = new THREE.Vector3((Math.random() - 0.5) * 12, this.homeY, -2 - Math.random() * 6);
    this.vel = new THREE.Vector3();
    this.group.position.copy(this.pos);
    this.spin = (Math.random() - 0.5) * 0.2;
  }

  update(dt, t, attract) {
    this.phase += dt * this.pulseRate;
    // 收缩波形：快收慢放，有物理感
    const s = Math.sin(this.phase * Math.PI * 2);
    const c = Math.pow(Math.max(s, 0), 2.4);

    // 呼吸式游动：收缩推进 + 浮力回中 + 阻尼
    this.vel.y += ((c - 0.42) * 4.2 - (this.pos.y - this.homeY) * 0.9 - this.vel.y * 1.7) * dt;

    // 水平：漫游 + 涟漪吸引
    let ax = Math.sin(t * 0.23 + this.seed) * 0.28 + Math.sin(t * 0.11 + this.seed * 2.3) * 0.16;
    let az = Math.cos(t * 0.19 + this.seed * 1.7) * 0.28 + Math.cos(t * 0.09 + this.seed) * 0.16;
    if (attract && attract.strength > 0.01) {
      const dx = attract.x - this.pos.x;
      const dz = attract.z - this.pos.z;
      const d = Math.hypot(dx, dz) + 0.001;
      const pull = Math.min(attract.strength * 3.2, 2.6) * Math.min(d / 3, 1);
      ax += (dx / d) * pull;
      az += (dz / d) * pull;
    }
    this.vel.x += (ax - this.vel.x * 0.8) * dt;
    this.vel.z += (az - this.vel.z * 0.8) * dt;

    this.pos.addScaledVector(this.vel, dt);

    // 边界：柔和推回
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > 9) { this.pos.x *= 9 / r; this.pos.z *= 9 / r; this.vel.x *= 0.6; this.vel.z *= 0.6; }
    this.pos.y = Math.max(-4.4, Math.min(4.2, this.pos.y));

    // 伞盖缩放：收缩时横向鼓、纵向压（体积守恒感）
    const sc = 1 + 0.2 * c, sy = 1 - 0.34 * c;
    this.bell.scale.set(this.size * sc, this.size * sy, this.size * sc);

    this.group.position.copy(this.pos);
    this.group.rotation.z = THREE.MathUtils.clamp(-this.vel.x * 0.16, -0.4, 0.4);
    this.group.rotation.x = THREE.MathUtils.clamp(this.vel.z * 0.16, -0.4, 0.4);
    this.group.rotation.y += this.spin * dt;

    this.bellMat.uniforms.uTime.value = t;
    this.bellMat.uniforms.uGlow.value = glow;
    this.coreMat.opacity = 0.35 * glow;

    this.updateTentacles(t, c);
  }

  updateTentacles(t, c) {
    const P = this.tPos, C = this.tCol;
    const lx = THREE.MathUtils.clamp(-this.vel.x * 0.55, -0.8, 0.8);
    const lz = THREE.MathUtils.clamp(-this.vel.z * 0.55, -0.8, 0.8);
    let v = 0;
    const fade = 0.85 * Math.min(glow, 1.6);
    for (const tn of this.tents) {
      let px = tn.root.x, py = tn.root.y, pz = tn.root.z;
      for (let i = 1; i < T_SEG; i++) {
        const f = i / (T_SEG - 1);
        // 弹簧摆动：正弦叠层 + 速度滞后拖尾 + 收缩下推
        const swx = Math.sin(t * 1.6 + tn.ph + f * 3.5) * (0.1 + f * 0.38);
        const swz = Math.cos(t * 1.15 + tn.ph * 1.7 + f * 3.0) * (0.1 + f * 0.38);
        const nx = tn.root.x + swx + lx * f;
        const ny = tn.root.y - f * tn.len - c * f * 0.55;
        const nz = tn.root.z + swz + lz * f;
        P[v * 3] = px; P[v * 3 + 1] = py; P[v * 3 + 2] = pz; v++;
        P[v * 3] = nx; P[v * 3 + 1] = ny; P[v * 3 + 2] = nz; v++;
        const b0 = Math.pow(1 - (i - 1) / (T_SEG - 1), 1.6) * fade;
        const b1 = Math.pow(1 - f, 1.6) * fade;
        const vi = v - 2, vj = v - 1;
        C[vi * 3] = this.baseColor.r * b0; C[vi * 3 + 1] = this.baseColor.g * b0; C[vi * 3 + 2] = this.baseColor.b * b0;
        C[vj * 3] = this.baseColor.r * b1; C[vj * 3 + 1] = this.baseColor.g * b1; C[vj * 3 + 2] = this.baseColor.b * b1;
        px = nx; py = ny; pz = nz;
      }
    }
    this.tentLines.geometry.attributes.position.needsUpdate = true;
    this.tentLines.geometry.attributes.color.needsUpdate = true;
  }

  dispose() {
    this.bellMat.dispose();
    this.coreMat.dispose();
    this.tentMat.dispose();
    this.tentLines.geometry.dispose();
    // bellGeo / coreGeo 全局共享，不释放
  }
}

const school = new THREE.Group();
scene.add(school);
let jellies = [];

function buildSchool(n) {
  for (const j of jellies) { school.remove(j.group); j.dispose(); }
  jellies = [];
  for (let i = 0; i < n; i++) {
    const j = new Jellyfish();
    jellies.push(j);
    school.add(j.group);
  }
}

/* ================= 深海环境 ================= */
// 光柱
const rayVert = `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const rayFrag = `
uniform float uGlow;
uniform float uSeed;
uniform float uTime;
varying vec2 vUv;
void main(){
  float edge = smoothstep(0.0, 0.38, vUv.x) * smoothstep(1.0, 0.62, vUv.x);
  float sway = 0.85 + 0.15 * sin(uTime * 0.4 + uSeed + vUv.y * 3.0);
  float a = edge * pow(vUv.y, 2.2) * 0.16 * uGlow * sway;
  gl_FragColor = vec4(0.49, 0.976, 1.0, a);
}`;
const rayGeo = new THREE.PlaneGeometry(2.4, 15);
const rayMats = [];
for (let i = 0; i < 5; i++) {
  const m = new THREE.ShaderMaterial({
    vertexShader: rayVert, fragmentShader: rayFrag,
    uniforms: { uGlow: { value: glow }, uSeed: { value: i * 1.7 }, uTime: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  rayMats.push(m);
  const p = new THREE.Mesh(rayGeo, m);
  p.position.set(-7 + i * 3.4 + Math.random(), 2.2, -7 - Math.random() * 3);
  p.rotation.y = 0.25 + Math.random() * 0.3;
  p.rotation.z = 0.06 * (Math.random() - 0.5);
  scene.add(p);
}

// 浮游颗粒
const SNOW = 420;
const snowPos = new Float32Array(SNOW * 3);
const snowSpd = new Float32Array(SNOW);
for (let i = 0; i < SNOW; i++) {
  snowPos[i * 3] = (Math.random() - 0.5) * 26;
  snowPos[i * 3 + 1] = -6 + Math.random() * 13;
  snowPos[i * 3 + 2] = -10 + Math.random() * 16;
  snowSpd[i] = 0.06 + Math.random() * 0.16;
}
const snowGeo = new THREE.BufferGeometry();
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snowMat = new THREE.PointsMaterial({
  color: 0x7DF9FF, size: 0.045, transparent: true, opacity: 0.5,
  sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
const snow = new THREE.Points(snowGeo, snowMat);
scene.add(snow);

// 海面微光（点击层视觉锚点）
const SURF_Y = 4.8;
const surfGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(34, 10),
  new THREE.MeshBasicMaterial({ color: 0x7DF9FF, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
);
surfGlow.rotation.x = -Math.PI / 2;
surfGlow.position.y = SURF_Y;
scene.add(surfGlow);

/* ================= 涟漪 + 吸引 ================= */
const ripples = [];
const rippleGeo = new THREE.RingGeometry(0.86, 1.0, 56);
function spawnRipple(x, z) {
  for (let k = 0; k < 3; k++) {
    const mat = new THREE.MeshBasicMaterial({
      color: k === 1 ? 0xFF6FD8 : 0x7DF9FF, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(rippleGeo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, SURF_Y, z);
    scene.add(m);
    ripples.push({ mesh: m, age: -k * 0.28, max: 1.6 });
  }
}
const attract = { x: 0, z: 0, strength: 0 };
const surfPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -SURF_Y);
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const hitPt = new THREE.Vector3();
const tapTip = document.getElementById('tapTip');

stage.addEventListener('pointerdown', (e) => {
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (raycaster.ray.intersectPlane(surfPlane, hitPt)) {
    const x = THREE.MathUtils.clamp(hitPt.x, -9, 9);
    const z = THREE.MathUtils.clamp(hitPt.z, -9, 4);
    spawnRipple(x, z);
    attract.x = x; attract.z = z; attract.strength = 1;
    tapTip.classList.add('gone');
  }
});

/* ================= UI ================= */
const rCount = document.getElementById('rCount');
const oCount = document.getElementById('oCount');
const rGlow = document.getElementById('rGlow');
const oGlow = document.getElementById('oGlow');

function paintRange(r) {
  const pct = ((r.value - r.min) / (r.max - r.min)) * 100;
  r.style.setProperty('--fill', pct + '%');
}
rCount.addEventListener('input', () => {
  oCount.textContent = rCount.value;
  paintRange(rCount);
  buildSchool(parseInt(rCount.value, 10));
});
rGlow.addEventListener('input', () => {
  glow = rGlow.value / 100;
  oGlow.textContent = rGlow.value + '%';
  paintRange(rGlow);
});
paintRange(rCount); paintRange(rGlow);

// 深度计：缓慢漂移，手工质感
const depthNum = document.getElementById('depthNum');
let depth = 1240;
setInterval(() => {
  depth = Math.max(1080, Math.min(1420, depth + (Math.random() - 0.5) * 46));
  depthNum.textContent = '−' + Math.round(depth).toLocaleString('en-US') + ' m';
}, 2400);

// 鼠标视差
const mouse = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
});

/* ================= 主循环 ================= */
const loader = document.getElementById('loader');
let firstFrame = true;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resize);
resize();

buildSchool(10);

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  const t = elapsed;

  if (attract.strength > 0) attract.strength = Math.max(0, attract.strength - dt / 7);

  for (const j of jellies) j.update(dt, t, attract);

  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.age += dt;
    if (r.age < 0) continue;
    const f = r.age / r.max;
    if (f >= 1) {
      scene.remove(r.mesh); r.mesh.material.dispose();
      ripples.splice(i, 1); continue;
    }
    const s = 0.4 + f * 7.5;
    r.mesh.scale.set(s, s, 1);
    r.mesh.material.opacity = (1 - f) * 0.65 * Math.min(glow, 1.5);
  }

  for (const m of rayMats) { m.uniforms.uTime.value = t; m.uniforms.uGlow.value = glow; }

  const sp = snowGeo.attributes.position;
  for (let i = 0; i < SNOW; i++) {
    let y = sp.getY(i) - snowSpd[i] * dt;
    if (y < -6) y = 7;
    sp.setY(i, y);
    sp.setX(i, sp.getX(i) + Math.sin(t * 0.6 + i) * dt * 0.08);
  }
  sp.needsUpdate = true;
  snowMat.opacity = 0.28 + 0.24 * Math.min(glow, 1.4);
  surfGlow.material.opacity = 0.05 * glow;

  camera.position.x += (camBase.x + mouse.x * 0.9 - camera.position.x) * 0.04;
  camera.position.y += (camBase.y - mouse.y * 0.55 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);

  if (firstFrame) {
    firstFrame = false;
    loader.classList.add('done');
  }
}
animate();
