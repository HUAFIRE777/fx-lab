/* iceberg-3d · 冰山漂浮 — original implementation
 * 极夜北极海：程序化冰山（displaced icosahedron + flat shading + 冰裂纹 emissive）
 * 海面 shader 波浪 / instanced 浮冰 / 远山剪影 / 极光余晖 shader / 水中倒影
 * 交互：自动环绕 + 鼠标/触屏视差，点击冰山切换冰裂纹三档，雾浓度滑杆
 */
import * as THREE from 'three';

/* ================= 基础 ================= */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1628);
scene.fog = new THREE.FogExp2(0x0a1628, 0.0076);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 900);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= 随机与噪声（手写 value noise） ================= */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const perm = new Uint8Array(512);
{
  const r = mulberry32(20261009);
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1));[p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}
function h3(x, y, z) { return perm[(perm[(perm[x & 255] + y) & 255] + z) & 255] / 255; }
function vnoise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(h3(xi, yi, zi), h3(xi + 1, yi, zi), u), l(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), u), v),
    l(l(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), u), l(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), u), v),
    w);
}
function fbm3(x, y, z, oct) {
  let amp = 0.5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { sum += amp * vnoise3(x * f, y * f, z * f); norm += amp; amp *= 0.5; f *= 2.03; }
  return (sum / norm) * 2 - 1; // -1..1
}
function h2(x, y) { return perm[(perm[x & 255] + y) & 255] / 255; }
function vnoise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(h2(xi, yi), h2(xi + 1, yi), u), l(h2(xi, yi + 1), h2(xi + 1, yi + 1), u), v);
}
function fbm2(x, y, oct) {
  let amp = 0.5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { sum += amp * vnoise2(x * f, y * f); norm += amp; amp *= 0.5; f *= 2.11; }
  return sum / norm; // 0..1
}

/* ================= 灯光 ================= */
scene.add(new THREE.HemisphereLight(0x14304d, 0x04070d, 0.6));
const moon = new THREE.DirectionalLight(0xbfe9ff, 0.6);
moon.position.set(28, 42, 20);
scene.add(moon);
const auroraWash = new THREE.DirectionalLight(0x7dffb2, 0.16); // 天际极光余晖的微弱染色
auroraWash.position.set(-10, 26, -120);
scene.add(auroraWash);

/* ================= 天空穹顶 ================= */
{
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vP;
      void main(){
        float h = normalize(vP).y;
        vec3 zen = vec3(0.010, 0.020, 0.047);
        vec3 hor = vec3(0.052, 0.105, 0.190);
        vec3 c = mix(hor, zen, smoothstep(-0.02, 0.62, h));
        c = mix(vec3(0.016, 0.043, 0.086), c, smoothstep(-0.45, -0.02, h));
        gl_FragColor = vec4(c, 1.0);
      }`
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), skyMat));
}

/* ================= 星点 ================= */
{
  const n = 320, pos = new Float32Array(n * 3), r = mulberry32(77);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, e = 0.12 + r() * 1.25, R = 400;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * R;
    pos[i * 3 + 1] = Math.sin(e) * R;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * R;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xbfe9ff, size: 1.6, sizeAttenuation: false,
    transparent: true, opacity: 0.6, fog: false, depthWrite: false
  })));
}

/* ================= 远山剪影 ================= */
function ridgeGeo(w, h, seed) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -1);
  let rnd = seed;
  const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    const x = -w / 2 + (w * i) / steps;
    const env = Math.sin((i / steps) * Math.PI) * 0.85 + 0.15;
    s.lineTo(x, h * (0.2 + rand() * 0.8) * env);
  }
  s.lineTo(w / 2, -1); s.lineTo(-w / 2, -1);
  return new THREE.ShapeGeometry(s);
}
{
  const m1 = new THREE.Mesh(ridgeGeo(560, 26, 4242), new THREE.MeshBasicMaterial({ color: 0x060d1a }));
  m1.position.set(-40, 0, -230); scene.add(m1);
  const m2 = new THREE.Mesh(ridgeGeo(700, 40, 9137), new THREE.MeshBasicMaterial({ color: 0x040a14 }));
  m2.position.set(60, 0, -300); scene.add(m2);
}

/* ================= 极光余晖 ================= */
const auroraUniforms = { uTime: { value: 0 } };
{
  const mat = new THREE.ShaderMaterial({
    uniforms: auroraUniforms, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; varying vec2 vUv;
      float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hh(i), hh(i+vec2(1,0)), u.x), mix(hh(i+vec2(0,1)), hh(i+vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p){
        float s = 0.0, a = 0.5;
        for(int i=0;i<4;i++){ s += a*vn(p); a *= 0.5; p *= 2.07; }
        return s;
      }
      void main(){
        float f = fbm(vec2(vUv.x*5.0 + uTime*0.045, uTime*0.035));
        float curtain = smoothstep(0.36, 0.85, f);
        float vert = smoothstep(0.02, 0.30, vUv.y) * (1.0 - smoothstep(0.42, 1.0, vUv.y));
        float rays = 0.55 + 0.45 * sin(vUv.x*44.0 + uTime*0.12 + f*7.0);
        float a = curtain * vert * (0.20 + 0.30*rays);
        gl_FragColor = vec4(vec3(0.490, 1.0, 0.698), a * 0.8);
      }`
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(420, 90), mat);
  plane.position.set(0, 42, -215);
  scene.add(plane);
}

/* ================= 冰山 ================= */
const crackUniform = { value: 0.12 };
const CRACK_LEVELS = [0.12, 0.7, 1.6];
const CRACK_NAMES = ['Ⅰ', 'Ⅱ', 'Ⅲ'];
let crackLevel = 0;

function buildIcebergGeo() {
  const geo = new THREE.IcosahedronGeometry(9, 4);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  const crease = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.copy(v).normalize();
    const f = fbm3(n.x * 1.35 + 11.3, n.y * 1.35 + 7.1, n.z * 1.35 + 3.7, 4);
    const ridge = Math.abs(fbm3(n.x * 3.0 + 5.0, n.y * 3.0 + 1.2, n.z * 3.0 + 9.4, 3)); // 0..1 ridged
    const taper = 1.0 + 0.5 * Math.max(0, -n.y);      // 底部更宽
    v.multiplyScalar(1 + f * 0.36);
    v.x *= taper; v.z *= taper;
    v.y *= 1.18;                                       // 纵向拉长
    if (n.y > 0.86) v.y *= 0.82;                       // 削平顶峰
    crease[i] = Math.pow(1 - Math.min(1, ridge * 2.4), 2.0); // 谷底=裂缝
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.setAttribute('aCrease', new THREE.BufferAttribute(crease, 1));
  geo.computeVertexNormals();
  return geo;
}

const bobGroup = new THREE.Group();
bobGroup.position.y = 1.4;
scene.add(bobGroup);

const icebergGeo = buildIcebergGeo();
const iceMat = new THREE.MeshStandardMaterial({
  color: 0x8fc3e8, roughness: 0.52, metalness: 0.04, flatShading: true
});
iceMat.onBeforeCompile = (sh) => {
  sh.uniforms.uCrack = crackUniform;
  sh.vertexShader = 'attribute float aCrease;\nvarying float vCrease;\n' +
    sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvCrease = aCrease;');
  sh.fragmentShader = 'uniform float uCrack;\nvarying float vCrease;\n' +
    sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += vec3(0.62, 0.86, 1.0) * vCrease * uCrack;');
};
const spinGroup = new THREE.Group(); // 自转组：冰山 + 倒影一起转
bobGroup.add(spinGroup);
const iceberg = new THREE.Mesh(icebergGeo, iceMat);
spinGroup.add(iceberg);

/* ================= 水中倒影（镜像 + 深色渐隐） ================= */
const reflUniforms = { uTime: { value: 0 } };
{
  const mat = new THREE.ShaderMaterial({
    uniforms: reflUniforms, transparent: true, depthWrite: false,
    vertexShader: `
      uniform float uTime; varying float vF;
      void main(){
        vec3 p = position;
        float f = clamp(p.y / 9.0, 0.0, 1.0);
        p.x += sin(p.y*0.7 + uTime*1.4) * 0.22 * f;
        p.z += cos(p.y*0.5 - uTime*1.1) * 0.18 * f;
        vF = f;
        gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.0);
      }`,
    fragmentShader: `
      varying float vF;
      void main(){
        vec3 c = mix(vec3(0.075, 0.25, 0.37), vec3(0.039, 0.086, 0.157), vF);
        gl_FragColor = vec4(c, 0.52 * (1.0 - vF));
      }`
  });
  const refl = new THREE.Mesh(icebergGeo, mat);
  refl.scale.set(1, -0.92, 1);
  refl.renderOrder = 1;
  spinGroup.add(refl);
}

/* ================= 海面 ================= */
const seaUniforms = { uTime: { value: 0 } };
const SEA_GLSL_WAVE = `
  float seaWave(float x, float z, float t){
    return sin(x*0.16 + t*0.9)*0.32
         + sin(z*0.21 - t*0.7)*0.26
         + sin((x+z)*0.07 + t*0.45)*0.42;
  }`;
{
  const g = new THREE.PlaneGeometry(560, 560, 100, 100);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({
    color: 0x0a1628, roughness: 0.38, metalness: 0.12,
    transparent: true, opacity: 0.88
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = seaUniforms.uTime;
    sh.vertexShader = 'uniform float uTime;\nvarying float vWave;\n' + SEA_GLSL_WAVE + '\n' +
      sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n\tfloat wv = seaWave(position.x, position.z, uTime);\n\ttransformed.y += wv;\n\tvWave = wv;');
    sh.fragmentShader = 'varying float vWave;\n' +
      sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\n\tdiffuseColor.rgb += vec3(0.30, 0.52, 0.72) * smoothstep(0.35, 1.0, vWave) * 0.45;');
  };
  const sea = new THREE.Mesh(g, m);
  sea.renderOrder = 2;
  scene.add(sea);
}
// JS 侧波浪函数（浮冰起伏用，与 shader 同式）
function waveH(x, z, t) {
  return Math.sin(x * 0.16 + t * 0.9) * 0.32
    + Math.sin(z * 0.21 - t * 0.7) * 0.26
    + Math.sin((x + z) * 0.07 + t * 0.45) * 0.42;
}

/* ================= 浮冰（instanced） ================= */
const FLOE_COUNT = 44;
const floes = [];
let floeMesh;
{
  const g = new THREE.IcosahedronGeometry(1, 1);
  const pos = g.attributes.position, v = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i); n.copy(v).normalize();
    const f = fbm3(n.x * 2.2 + 3.1, n.y * 2.2 + 8.8, n.z * 2.2 + 1.9, 3);
    v.multiplyScalar(1 + f * 0.3);
    pos.setXYZ(i, v.x, v.y * 0.42, v.z);
  }
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: 0xa9d6f2, roughness: 0.6, flatShading: true });
  floeMesh = new THREE.InstancedMesh(g, m, FLOE_COUNT);
  const r = mulberry32(5150);
  const dummy = new THREE.Object3D();
  const cA = new THREE.Color(0x8fc8ee), cB = new THREE.Color(0xdff3ff), cc = new THREE.Color();
  for (let i = 0; i < FLOE_COUNT; i++) {
    const a = r() * Math.PI * 2, rad = 13 + r() * 55;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad * 0.8;
    const s = 0.6 + r() * 1.9;
    const sx = s * (0.7 + r() * 0.7), sz = s * (0.7 + r() * 0.7);
    floes.push({ x, z, s, sx, sz, ph: r() * Math.PI * 2, rs: (r() - 0.5) * 0.25, ry: r() * Math.PI * 2 });
    dummy.position.set(x, 0, z);
    dummy.scale.set(sx, s, sz);
    dummy.rotation.y = floes[i].ry;
    dummy.updateMatrix();
    floeMesh.setMatrixAt(i, dummy.matrix);
    floeMesh.setColorAt(i, cc.copy(cA).lerp(cB, r()));
  }
  floeMesh.instanceMatrix.needsUpdate = true;
  if (floeMesh.instanceColor) floeMesh.instanceColor.needsUpdate = true;
  scene.add(floeMesh);
  document.getElementById('floeCount').textContent = FLOE_COUNT;
}
const floeDummy = new THREE.Object3D();
function updateFloes(t, dt) {
  for (let i = 0; i < FLOE_COUNT; i++) {
    const f = floes[i];
    f.ry += dt * f.rs;
    floeDummy.position.set(f.x, waveH(f.x, f.z, t) * 0.85 + 0.12, f.z);
    floeDummy.rotation.set(Math.sin(t * 0.6 + f.ph) * 0.06, f.ry, Math.cos(t * 0.5 + f.ph) * 0.06);
    floeDummy.scale.set(f.sx, f.s, f.sz);
    floeDummy.updateMatrix();
    floeMesh.setMatrixAt(i, floeDummy.matrix);
  }
  floeMesh.instanceMatrix.needsUpdate = true;
}

/* ================= 相机：自动环绕 + 视差 ================= */
let orbitA = 0.6;
const ORBIT_R = 31, CAM_H = 8.4;
const lookTarget = new THREE.Vector3(0, 3.4, 0);
const par = { x: 0, y: 0, tx: 0, ty: 0 };
function onPointMove(cx, cy) {
  par.tx = (cx / window.innerWidth - 0.5) * 2 * 2.8;
  par.ty = -(cy / window.innerHeight - 0.5) * 2 * 1.6;
}
window.addEventListener('pointermove', (e) => onPointMove(e.clientX, e.clientY), { passive: true });
window.addEventListener('touchmove', (e) => {
  if (e.touches.length) onPointMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

/* ================= 交互：点击冰山切换裂纹三档 ================= */
const crackBtns = [...document.querySelectorAll('.crack')];
const crackLabel = document.getElementById('crackLevel');
const hint = document.getElementById('hint');
function setCrack(i, fromClick) {
  crackLevel = ((i % 3) + 3) % 3;
  crackBtns.forEach((b) => b.classList.toggle('on', +b.dataset.level === crackLevel));
  crackLabel.textContent = CRACK_NAMES[crackLevel];
  if (fromClick) hint.classList.add('gone');
  renderOnce();
}
crackBtns.forEach((b) => b.addEventListener('click', () => setCrack(+b.dataset.level, true)));

function renderOnce() { if (REDUCED) { crackUniform.value = CRACK_LEVELS[crackLevel]; renderer.render(scene, camera); } }
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let downX = 0, downY = 0;
canvas.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
canvas.addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return; // 拖动不算点击
  ptr.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  if (ray.intersectObject(iceberg, false).length) setCrack(crackLevel + 1, true);
});

/* ================= 雾浓度滑杆 ================= */
const fogInput = document.getElementById('fog');
const fogVal = document.getElementById('fogVal');
fogInput.addEventListener('input', () => {
  const v = +fogInput.value;
  scene.fog.density = (v / 100) * 0.02;
  fogVal.textContent = v + '%';
  renderOnce();
});

/* ================= 主循环 ================= */
const clock = new THREE.Clock();
function placeCamera(dt) {
  const k = 1 - Math.exp(-dt * 2.5);
  par.x += (par.tx - par.x) * k;
  par.y += (par.ty - par.y) * k;
  camera.position.set(
    Math.cos(orbitA) * ORBIT_R + par.x,
    CAM_H + par.y,
    Math.sin(orbitA) * ORBIT_R
  );
  camera.lookAt(lookTarget);
}
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (!REDUCED) orbitA += dt * 0.05;                    // 极慢环绕
  placeCamera(dt);
  // 冰山 bobbing + 极慢自转
  const bt = REDUCED ? 0 : t;
  bobGroup.position.y = 1.4 + Math.sin(bt * 0.55) * 0.45;
  bobGroup.rotation.z = Math.sin(bt * 0.4) * 0.022;
  bobGroup.rotation.x = Math.cos(bt * 0.33) * 0.018;
  if (!REDUCED) spinGroup.rotation.y += dt * 0.03;
  // 冰裂纹呼吸
  crackUniform.value = CRACK_LEVELS[crackLevel] * (REDUCED ? 1 : (0.86 + 0.14 * Math.sin(t * 2.1)));
  // shader 时间
  seaUniforms.uTime.value = bt;
  reflUniforms.uTime.value = bt;
  auroraUniforms.uTime.value = bt;
  if (!REDUCED) updateFloes(t, dt); else updateFloes(0, 0);
  renderer.render(scene, camera);
  if (!REDUCED) requestAnimationFrame(tick);
}

/* ================= loader / intro ================= */
function finishIntro() {
  const loader = document.getElementById('loader');
  loader.classList.add('done');
  const els = [...document.querySelectorAll('[data-intro]')];
  els.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), REDUCED ? 0 : 400 + i * 150));
  setTimeout(() => loader.remove(), 1400);
}
placeCamera(1 / 60);
updateFloes(0, 0);
renderer.render(scene, camera); // 首帧
if (REDUCED) {
  finishIntro();
} else {
  setTimeout(finishIntro, 700);
  setTimeout(finishIntro, 3800); // 兜底（幂等）
  requestAnimationFrame(tick);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
