import * as THREE from 'three';

/* ============================================================
 * windmill-3d · 风车田野
 * 程序化荷兰风车 + instanced 郁金香花海 + 漂移云影
 * 配色严格 3 色：晨雾蓝 #DCEEF5 / 风车木棕 #8A6B4F / 郁金香红 #E4574F
 * 其余均为三色的明度衍生（雾化/阴影），无第 4 色相。
 * ============================================================ */

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
// 注：不启用实时阴影贴图 —— SwiftShader 软渲染下任何 shadowMap（PCFSoft/PCF）
// 都会在加载或截图时把 renderer 搞崩（OOM SIGKILL），见 README 踩坑。
// 风车接地用烘焙式 blob 阴影代替，本波其他模板同样做法。
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xdceef5, 90, 260);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 600);
const CAM_WIDE = { pos: new THREE.Vector3(30, 12, 42), tgt: new THREE.Vector3(0, 7.5, 0) };
const CAM_CLOSE = { pos: new THREE.Vector3(10.5, 6.5, 15.5), tgt: new THREE.Vector3(0, 8.5, 0) };
let camTarget = CAM_WIDE;
camera.position.copy(CAM_WIDE.pos);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- 灯光 ---------------- */
const hemi = new THREE.HemisphereLight(0xeaf4f9, 0x8a6b4f, 0.95);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.1);
sun.position.set(40, 55, 25);
scene.add(sun);
scene.add(new THREE.AmbientLight(0xdceef5, 0.25));

const ENV = {
  day:  { hemi: 0.95, sun: 2.10, sunCol: new THREE.Color(0xffffff),
          zen: new THREE.Color(0x9ecfe4), hor: new THREE.Color(0xf2f9fc),
          fog: new THREE.Color(0xdceef5), sunY: 55, glow: 1.0 },
  dusk: { hemi: 0.55, sun: 1.15, sunCol: new THREE.Color(0xf6cfae),
          zen: new THREE.Color(0x5d7f96), hor: new THREE.Color(0xf3ddd2),
          fog: new THREE.Color(0xc9d8e2), sunY: 14, glow: 1.6 },
};
let envMix = 0;          // 0=白昼 1=暮色
let envMixTarget = 0;

/* ---------------- 天空穹顶 ---------------- */
const skyUniforms = {
  uZen:  { value: ENV.day.zen.clone() },
  uHor:  { value: ENV.day.hor.clone() },
  uSunDir: { value: new THREE.Vector3(40, 55, 25).normalize() },
  uGlow: { value: 1.0 },
};
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(420, 24, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: skyUniforms,
    vertexShader: `varying vec3 vDir;
      void main(){ vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vDir;
      uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uSunDir; uniform float uGlow;
      void main(){
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 col = mix(uHor, uZen, pow(h, 0.62));
        float s = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
        col += vec3(1.0, 0.98, 0.94) * (pow(s, 350.0) * 1.2 + pow(s, 18.0) * 0.28 * uGlow);
        gl_FragColor = vec4(col, 1.0);
      }`
  })
);
scene.add(sky);

/* ---------------- 地面 ---------------- */
const groundMat = new THREE.MeshLambertMaterial({ color: 0x9d8468 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// 田间土路：一条浅棕色带，通向风车
const pathMat = new THREE.MeshLambertMaterial({ color: 0xb59a78 });
const path = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 90), pathMat);
path.rotation.x = -Math.PI / 2;
path.position.set(6.5, 0.02, 42);
path.rotation.z = 0.1;
scene.add(path);

/* ---------------- 云影（漂移的柔和阴影） ---------------- */
function makeCloudShadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 512);
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 46; i++) {
    const x = rnd() * 512, y = rnd() * 512, r = 26 + rnd() * 70;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.10 + rnd() * 0.16;
    gr.addColorStop(0, `rgba(70,80,95,${a})`);
    gr.addColorStop(1, 'rgba(70,80,95,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const shadowTex = makeCloudShadowTexture();
shadowTex.repeat.set(2, 2);
const cloudShadow = new THREE.Mesh(
  new THREE.PlaneGeometry(340, 340),
  new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.85, depthWrite: false })
);
cloudShadow.rotation.x = -Math.PI / 2;
cloudShadow.position.y = 0.06;
scene.add(cloudShadow);

/* ---------------- 风车建造 ---------------- */
const WOOD = 0x8a6b4f, WOOD_D = 0x6b5138, WOOD_L = 0xa5855f;
const woodMat = new THREE.MeshLambertMaterial({ color: WOOD });
const woodDarkMat = new THREE.MeshLambertMaterial({ color: WOOD_D });
const woodLightMat = new THREE.MeshLambertMaterial({ color: WOOD_L });

function buildWindmill(scale = 1, silhouette = false) {
  const g = new THREE.Group();
  const m = (geo, mat) => new THREE.Mesh(geo, mat);
  // 塔身：上窄下宽
  const tower = m(new THREE.CylinderGeometry(2.1, 3.4, 11, 10), woodMat);
  tower.position.y = 5.5;
  g.add(tower);
  // 腰箍
  for (const y of [2.6, 5.4, 8.2]) {
    const band = m(new THREE.CylinderGeometry(2.32 - y * 0.075, 2.36 - y * 0.075, 0.28, 10), woodDarkMat);
    band.position.y = y;
    g.add(band);
  }
  // 门与窗
  const door = m(new THREE.BoxGeometry(1.15, 2.1, 0.18), woodDarkMat);
  door.position.set(0, 1.05, 3.02);
  g.add(door);
  const win = m(new THREE.BoxGeometry(0.7, 0.9, 0.18), woodDarkMat);
  win.position.set(0, 6.4, 2.52);
  g.add(win);
  // 顶盖
  const cap = m(new THREE.ConeGeometry(2.55, 2.4, 10), woodDarkMat);
  cap.position.y = 12.2;
  g.add(cap);
  // 风轮
  const rotor = new THREE.Group();
  rotor.position.set(0, 11.2, 2.55);
  const hub = m(new THREE.SphereGeometry(0.55, 10, 8), woodDarkMat);
  rotor.add(hub);
  const BLADE_LEN = 6.8;
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Group();
    const spar = m(new THREE.BoxGeometry(0.22, BLADE_LEN, 0.22), woodDarkMat);
    spar.position.y = BLADE_LEN / 2 + 0.4;
    blade.add(spar);
    // 帆：格栅 + 帆布
    const frame = m(new THREE.BoxGeometry(2.0, BLADE_LEN * 0.62, 0.1), woodLightMat);
    frame.position.set(1.0, BLADE_LEN * 0.58, 0);
    blade.add(frame);
    const sail = m(new THREE.BoxGeometry(1.7, BLADE_LEN * 0.55, 0.04), silhouette ? woodDarkMat : new THREE.MeshLambertMaterial({ color: 0xf4ede2 }));
    sail.position.set(1.0, BLADE_LEN * 0.58, 0.02);
    blade.add(sail);
    blade.rotation.z = (i * Math.PI) / 2;
    // 帆面微倾角，兜风
    blade.rotation.y = 0.16;
    rotor.add(blade);
  }
  g.add(rotor);
  g.scale.setScalar(scale);
  return { group: g, rotor };
}

// 主风车
const mill = buildWindmill(1, false);
scene.add(mill.group);

// 烘焙式接地阴影：替代实时阴影贴图
{
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 10, 128, 128, 126);
  gr.addColorStop(0, 'rgba(74,58,44,0.42)');
  gr.addColorStop(0.55, 'rgba(74,58,44,0.18)');
  gr.addColorStop(1, 'rgba(74,58,44,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(17, 17),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.04;
  scene.add(blob);
}

// 远处第二座：剪影，雾中
const mill2 = buildWindmill(0.62, true);
mill2.group.position.set(-58, 9.2, -72); // 站在山丘顶面（该处丘面约 y=10），之前 y=0 被丘体淹没
mill2.group.rotation.y = 0.7;
scene.add(mill2.group);
// 远山丘
const hill = new THREE.Mesh(
  new THREE.SphereGeometry(60, 16, 12),
  new THREE.MeshLambertMaterial({ color: 0xb9cdd8 })
);
hill.scale.set(1.6, 0.22, 1);
hill.position.set(-70, -2, -95);
scene.add(hill);

/* ---------------- 郁金香花海（instanced） ---------------- */
function buildTulipGeometry() {
  const parts = [];
  const paint = (geo, hex) => {
    const g = geo.toNonIndexed();
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    const c = new THREE.Color(hex);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    parts.push(g);
  };
  // 茎
  const stem = new THREE.CylinderGeometry(0.028, 0.04, 1.05, 5);
  stem.translate(0, 0.52, 0);
  paint(stem, 0x6b5138);
  // 花杯：lathe 勾出郁金香杯形
  const pts = [];
  const prof = [[0.001, 0], [0.075, 0.02], [0.13, 0.12], [0.145, 0.22], [0.115, 0.3], [0.075, 0.34], [0.02, 0.3]];
  for (const [x, y] of prof) pts.push(new THREE.Vector2(x, y));
  const head = new THREE.LatheGeometry(pts, 7);
  head.translate(0, 1.0, 0);
  paint(head, 0xe4574f);
  // 叶
  const leaf = new THREE.PlaneGeometry(0.16, 0.62, 1, 3);
  leaf.translate(0, 0.31, 0);
  leaf.rotateX(0.5);
  leaf.translate(0.09, 0.28, 0);
  paint(leaf, 0x6b5138);
  // 合并
  let total = 0;
  for (const p of parts) total += p.attributes.position.count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), colA = new Float32Array(total * 3);
  let off = 0;
  for (const p of parts) {
    const n = p.attributes.position.count;
    pos.set(p.attributes.position.array, off * 3);
    nor.set(p.attributes.normal.array, off * 3);
    colA.set(p.attributes.color.array, off * 3);
    off += n;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colA, 3));
  return geo;
}

const TULIP_COUNT = 3600;
const tulipMat = new THREE.MeshLambertMaterial({ vertexColors: true });
const timeU = { value: 0 };
const waveU = { value: 0.09 };
tulipMat.onBeforeCompile = (sh) => {
  sh.uniforms.uTime = timeU;
  sh.uniforms.uWave = waveU;
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uWave;')
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
      #else
        vec2 ip = vec2(0.0);
      #endif
      float swayPh = uTime * 2.1 + ip.x * 0.33 + ip.y * 0.27;
      float swayAmt = uWave * smoothstep(0.05, 1.35, transformed.y);
      transformed.x += sin(swayPh) * swayAmt;
      transformed.z += cos(swayPh * 0.83) * swayAmt * 0.62;
    `);
};
const tulips = new THREE.InstancedMesh(buildTulipGeometry(), tulipMat, TULIP_COUNT);
{
  const dummy = new THREE.Object3D();
  const cRed = new THREE.Color(0xe4574f);
  const cDeep = new THREE.Color(0xc23f38);
  let seed = 42;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < TULIP_COUNT; i++) {
    // 环带分布：近处密、远处疏，避开土路与风车基座
    const r = 4 + Math.pow(rnd(), 0.62) * 78;
    const a = rnd() * Math.PI * 2;
    let x = Math.cos(a) * r, z = Math.sin(a) * r * 0.9 + 6;
    if (Math.abs(x - 6.5) < 3.4 && z > -6 && z < 86) x += 7;      // 让开土路
    if (Math.hypot(x, z) < 4.6) { x += 6; z += 4; }               // 让开基座
    dummy.position.set(x, 0, z);
    dummy.rotation.y = rnd() * Math.PI * 2;
    const s = 0.75 + rnd() * 0.85;
    dummy.scale.set(s, s * (0.9 + rnd() * 0.35), s);
    dummy.updateMatrix();
    tulips.setMatrixAt(i, dummy.matrix);
    // 花色抖动：正红 ↔ 深红
    const c = cRed.clone().lerp(cDeep, rnd() * 0.55);
    tulips.setColorAt(i, c);
  }
  tulips.instanceMatrix.needsUpdate = true;
  if (tulips.instanceColor) tulips.instanceColor.needsUpdate = true;
}
scene.add(tulips);

/* ---------------- 云 ---------------- */
const cloudMat = new THREE.MeshLambertMaterial({ color: 0xf6fbfd, transparent: true, opacity: 0.94 });
const clouds = [];
{
  let seed = 99;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 9; i++) {
    const grp = new THREE.Group();
    const puffs = 4 + Math.floor(rnd() * 3);
    for (let j = 0; j < puffs; j++) {
      const r = 3 + rnd() * 4.5;
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), cloudMat);
      s.position.set(j * (r * 1.05) - puffs * r * 0.5, (rnd() - 0.5) * 2.2, (rnd() - 0.5) * 5);
      s.scale.y = 0.55;
      grp.add(s);
    }
    grp.position.set((rnd() - 0.5) * 320, 34 + rnd() * 22, -40 - rnd() * 130);
    grp.userData.speed = 0.7 + rnd() * 0.8;
    scene.add(grp);
    clouds.push(grp);
  }
}

/* ---------------- 交互状态 ---------------- */
const state = {
  wind: 4,
  rotorSpeed: 0,        // rad/s，实际（带惯性）
  rotorTarget: 0,
  rotorAngle: 0,
  view: 'wide',
  dusk: false,
};
if (reducedMotion) state.wind = 2;

const windSlider = document.getElementById('wind');
const windVal = document.getElementById('windVal');
const rpmEl = document.getElementById('rpmCount');
document.getElementById('tulipCount').textContent = TULIP_COUNT.toLocaleString('en-US');
windSlider.value = String(state.wind);

function windToRotor(w) { return w <= 0 ? 0 : 0.35 + w * 0.24; }  // rad/s
function applyWindUI() {
  windVal.textContent = `${state.wind} 级`;
  state.rotorTarget = reducedMotion ? windToRotor(state.wind) * 0.35 : windToRotor(state.wind);
}
windSlider.addEventListener('input', () => {
  state.wind = Number(windSlider.value);
  applyWindUI();
});
applyWindUI();

// 昼 / 暮
const dayBtn = document.getElementById('dayBtn');
const duskBtn = document.getElementById('duskBtn');
function setDusk(dusk) {
  state.dusk = dusk;
  envMixTarget = dusk ? 1 : 0;
  dayBtn.classList.toggle('on', !dusk);
  duskBtn.classList.toggle('on', dusk);
  dayBtn.setAttribute('aria-pressed', String(!dusk));
  duskBtn.setAttribute('aria-pressed', String(dusk));
}
dayBtn.addEventListener('click', () => setDusk(false));
duskBtn.addEventListener('click', () => setDusk(true));

// 点击风车切换视角
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
let downPos = null;
canvas.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const dx = e.clientX - downPos[0], dy = e.clientY - downPos[1];
  downPos = null;
  if (dx * dx + dy * dy > 36) return;   // 拖拽不算点击
  ptr.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObject(mill.group, true);
  if (hit.length) toggleView();
});
const hintEl = document.getElementById('hint');
function toggleView() {
  state.view = state.view === 'wide' ? 'close' : 'wide';
  camTarget = state.view === 'wide' ? CAM_WIDE : CAM_CLOSE;
  hintEl.classList.add('gone');
}
hintEl.addEventListener('click', toggleView);
hintEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') toggleView(); });

/* ---------------- 环境插值 ---------------- */
const tmpV = new THREE.Vector3();
function lerpEnv(dt) {
  const k = 1 - Math.exp(-2.2 * dt);
  envMix += (envMixTarget - envMix) * k;
  if (Math.abs(envMix - envMixTarget) < 0.001) envMix = envMixTarget;
  const A = ENV.day, B = ENV.dusk, m = envMix;
  hemi.intensity = A.hemi + (B.hemi - A.hemi) * m;
  sun.intensity = A.sun + (B.sun - A.sun) * m;
  sun.color.copy(A.sunCol).lerp(B.sunCol, m);
  sun.position.y = A.sunY + (B.sunY - A.sunY) * m;
  skyUniforms.uZen.value.copy(A.zen).lerp(B.zen, m);
  skyUniforms.uHor.value.copy(A.hor).lerp(B.hor, m);
  skyUniforms.uGlow.value = A.glow + (B.glow - A.glow) * m;
  skyUniforms.uSunDir.value.copy(sun.position).normalize();
  scene.fog.color.copy(A.fog).lerp(B.fog, m);
  renderer.setClearColor(scene.fog.color);
}

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
let rpmTick = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  timeU.value = t;

  // 风轮：惯性加速 + 风速联动
  const rk = 1 - Math.exp(-1.6 * dt);
  state.rotorSpeed += (state.rotorTarget - state.rotorSpeed) * rk;
  state.rotorAngle += state.rotorSpeed * dt;
  mill.rotor.rotation.z = -state.rotorAngle;
  mill2.rotor.rotation.z = -state.rotorAngle * 0.8;

  // 花浪幅度联动风速（无风时几乎静止）
  const waveTarget = reducedMotion ? 0.02 : 0.015 + state.wind * 0.022;
  waveU.value += (waveTarget - waveU.value) * rk;

  // 云漂移联动风速
  for (const c of clouds) {
    c.position.x += c.userData.speed * (0.4 + state.wind * 0.55) * dt * (reducedMotion ? 0.2 : 1);
    if (c.position.x > 190) c.position.x = -190;
  }
  // 云影联动
  shadowTex.offset.x += dt * 0.004 * (0.3 + state.wind * 0.5);
  shadowTex.offset.y += dt * 0.0016;

  // 视角：物理感阻尼跟随
  const ck = 1 - Math.exp(-3.2 * dt);
  camera.position.lerp(camTarget.pos, ck);
  tmpV.copy(camTarget.tgt);
  camera.lookAt(tmpV);

  lerpEnv(dt);

  // 读数
  rpmTick += dt;
  if (rpmTick > 0.25) {
    rpmTick = 0;
    rpmEl.textContent = String(Math.round((state.rotorSpeed * 60) / (Math.PI * 2)));
  }

  renderer.render(scene, camera);
}

/* ---------------- loader 与 intro ---------------- */
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  document.getElementById('loader').classList.add('done');
  requestAnimationFrame(() => {
    document.querySelectorAll('[data-intro]').forEach((el) => el.classList.add('is-in'));
  });
  setTimeout(() => {
    document.querySelectorAll('[data-intro]').forEach((el) => el.classList.add('is-in'));
  }, 500);
}
let frames = 0;
(function warmup() {
  renderer.render(scene, camera);
  if (++frames >= 3) boot();
  else requestAnimationFrame(warmup);
})();
setTimeout(boot, 4000);   // 兜底

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 竖屏拉远一点，保证风车与花海同框
  if (camera.aspect < 0.8) {
    CAM_WIDE.pos.set(38, 15, 52);
  } else {
    CAM_WIDE.pos.set(30, 12, 42);
  }
});
if (camera.aspect < 0.8) CAM_WIDE.pos.set(38, 15, 52);

animate();
