/* pagoda-3d · 宝塔夜景 — original implementation, huafire3d fx-lab
 * 程序化七层宝塔(飞檐翘角+檐角风铃) / 灯笼阵列随风摆 / 镜像湖面+点击涟漪 /
 * 月相切换+云遮月 / 萤火虫 / 缓慢环绕+鼠标视差
 */
import * as THREE from 'three';

/* ================= 配置 ================= */
const NIGHT = 0x0D0F16, LANTERN = 0xFFB45E, MOONW = 0xE8EDF5;
const TIERS = 7;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const S = {
  light: 0,            // 已点亮层数 0..7
  autoOrbit: !reduced,
  moonPhase: 0,        // 0 满月 1 半月 2 月牙
  cloudCover: true,
  target: new Array(TIERS).fill(0),   // 每层目标亮度
  cur: new Array(TIERS).fill(0),      // 每层当前亮度(lerp)
};
const PHASE_NAME = ['满月', '半月', '月牙'];
if (window.__PAGODA_STILL) S.autoOrbit = false;   // 截图测试钩子：冻结初始机位

/* ================= 渲染器 / 场景 / 相机 ================= */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(NIGHT, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(NIGHT, 70, 210);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 800);
const CAM_R = 42, CAM_H = 8.2, LOOK = new THREE.Vector3(0, 11.5, -12);

/* ================= 画布纹理 ================= */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = canvasTex(128, 128, (g) => {          // 灯笼暖光晕
  const r = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,190,110,1)'); r.addColorStop(0.35, 'rgba(255,180,94,.45)');
  r.addColorStop(1, 'rgba(255,180,94,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});
const dotTex = canvasTex(64, 64, (g) => {             // 萤火虫/星点
  const r = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,240,220,.6)');
  r.addColorStop(1, 'rgba(255,240,220,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
});
const moonTex = [0, 1, 2].map((p) => canvasTex(256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#E8EDF5';
  g.beginPath(); g.arc(128, 128, 96, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(13,15,22,1)';                    // 夜色遮罩画出月相
  if (p === 1) { g.fillRect(128, 20, 120, 216); }
  if (p === 2) { g.beginPath(); g.arc(176, 128, 92, 0, Math.PI * 2); g.fill(); }
}));
const cloudTex = canvasTex(256, 128, (g) => {          // 薄云团
  g.clearRect(0, 0, 256, 128);
  for (let i = 0; i < 26; i++) {
    const x = 30 + Math.random() * 196, y = 40 + Math.random() * 48, r = 18 + Math.random() * 30;
    const gr = g.createRadialGradient(x, y, 2, x, y, r);
    gr.addColorStop(0, 'rgba(10,12,18,.85)'); gr.addColorStop(1, 'rgba(10,12,18,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
});

/* ================= 夜空穹顶 + 星 ================= */
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(340, 32, 20),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vP;
      void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vP;
      void main(){
        float h = normalize(vP).y;
        vec3 top = vec3(0.030,0.037,0.063);
        vec3 hor = vec3(0.075,0.095,0.135);
        vec3 c = mix(hor, top, smoothstep(-0.02, 0.65, h));
        gl_FragColor = vec4(c, 1.0);
      }`
  })
));
{ // 稀疏星点，只在高空
  const n = 320, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, e = 0.25 + Math.random() * 1.25, r = 300;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
    pos[i * 3 + 1] = Math.sin(e) * r;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    map: dotTex, color: 0xcfd8ea, size: 2.2, sizeAttenuation: false,
    transparent: true, opacity: 0.55, fog: false, depthWrite: false,
    blending: THREE.AdditiveBlending
  })));
}

/* ================= 灯光 ================= */
scene.add(new THREE.AmbientLight(0x2a3450, 0.85));
const moonLight = new THREE.DirectionalLight(0xdfe8f5, 0.55);
moonLight.position.set(34, 42, -60);
scene.add(moonLight);
const tierGlow = [];   // 3 盏暖色点光，随点亮层数增强
for (let i = 0; i < 3; i++) {
  const p = new THREE.PointLight(LANTERN, 0, 42, 1.8);
  p.position.set(0, 6 + i * 8, -11);
  scene.add(p); tierGlow.push(p);
}

/* ================= 明月 + 云 ================= */
const moonGroup = new THREE.Group();
moonGroup.position.set(34, 31, -88);
const moonDisc = new THREE.Mesh(
  new THREE.CircleGeometry(6.5, 40),
  new THREE.MeshBasicMaterial({ map: moonTex[0], transparent: true, fog: false })
);
moonDisc.lookAt(camera.position);
const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: 0xdfe8f5, transparent: true, opacity: 0.35,
  blending: THREE.AdditiveBlending, depthWrite: false, fog: false
}));
moonHalo.material.color.set(0xdfe8f5);
moonHalo.scale.set(34, 34, 1);
moonGroup.add(moonDisc, moonHalo);
scene.add(moonGroup);

const clouds = [];
for (let i = 0; i < 2; i++) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 20),
    new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.95, depthWrite: false, fog: false })
  );
  m.position.set(20 + i * 30, 29 + i * 3, -80);
  m.userData = { x0: m.position.x, sp: 0.5 + i * 0.35, ph: i * 2.1 };
  scene.add(m); clouds.push(m);
}

/* 窄屏时月亮内收，保证竖屏构图也能看到明月 */
function layoutSky() {
  const mx = window.innerWidth / window.innerHeight < 0.85 ? 13 : 34;
  moonGroup.position.x = mx;
  moonLight.position.set(mx, 42, -60);
  clouds.forEach((c, i) => { c.userData.x0 = mx - 16 + i * 30; });
}
layoutSky();

/* ================= 远山剪影 ================= */
function ridge(z, baseY, amp, color, seed) {
  const sh = new THREE.Shape();
  sh.moveTo(-220, 0);
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let x = -220; x <= 220; x += 14) {
    sh.lineTo(x, baseY + rnd() * amp + Math.sin(x * 0.05 + seed) * amp * 0.3);
  }
  sh.lineTo(220, 0); sh.closePath();
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh),
    new THREE.MeshBasicMaterial({ color, fog: true }));
  m.position.z = z;
  scene.add(m);
}
ridge(-105, 4, 16, 0x0a0d13, 7);
ridge(-135, 6, 24, 0x080a0f, 31);

/* ================= 湖心岛 ================= */
const island = new THREE.Mesh(
  new THREE.CylinderGeometry(10.5, 13, 2.6, 28),
  new THREE.MeshLambertMaterial({ color: 0x121722 })
);
island.position.set(0, -0.3, -16);
scene.add(island);
for (let i = 0; i < 7; i++) {   // 岸石
  const r = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.7, 0),
    island.material);
  const a = Math.random() * Math.PI * 2;
  r.position.set(Math.cos(a) * (10 + Math.random() * 2.5), 0.1, -16 + Math.sin(a) * (10 + Math.random() * 2.5));
  r.rotation.set(Math.random() * 3, Math.random() * 3, 0);
  scene.add(r);
}

/* ================= 宝塔 ================= */
const pagoda = new THREE.Group();
pagoda.position.set(0, 1.0, -16);
scene.add(pagoda);

const bodyMat = new THREE.MeshLambertMaterial({ color: 0x18202f });
const roofMat = new THREE.MeshLambertMaterial({ color: 0x10141d, flatShading: true });
const trimMat = new THREE.MeshLambertMaterial({ color: 0x0c0f16 });
const bellMat = new THREE.MeshLambertMaterial({ color: 0x4a3a26, emissive: 0x1a1208 });
const stringMat = new THREE.LineBasicMaterial({ color: 0x3a3f4d });
const strGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.55, 5);
const bulbGeo = new THREE.SphereGeometry(0.42, 14, 12);
const bellGeo = new THREE.ConeGeometry(0.15, 0.3, 8);
const winGeo = new THREE.PlaneGeometry(0.85, 1.15);

/* 飞檐：四棱锥，底圈四角上翘外张 */
function makeEave(ew, eh) {
  const g = new THREE.ConeGeometry(ew / Math.SQRT2, eh, 4, 4, false, Math.PI / 4);
  const p = g.attributes.position, e = eh * 0.5;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (Math.abs(x) + Math.abs(z) < 1e-4) continue;         // 锥顶/盖心不动
    if (Math.abs(y + e) < 1e-3) { p.setY(i, y + eh * 0.52); p.setX(i, x * 1.12); p.setZ(i, z * 1.12); }
    else if (Math.abs(y + e - eh / 4) < 1e-3) { p.setY(i, y + eh * 0.18); p.setX(i, x * 1.05); p.setZ(i, z * 1.05); }
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, roofMat);
}

const lanternMats = [], winMats = [], haloMats = [];
const lanterns = [];   // {grp, ph}
let py = 0;
const lerp = (a, b, t) => a + (b - a) * t;

for (let i = 0; i < TIERS; i++) {
  const t = i / (TIERS - 1);
  const w = lerp(6.4, 2.5, t), bh = lerp(2.7, 2.0, t);

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, bh, w), bodyMat);
  body.position.y = py + bh / 2;
  pagoda.add(body);
  const band = new THREE.Mesh(new THREE.BoxGeometry(w * 1.04, 0.16, w * 1.04), trimMat);
  band.position.y = py + bh - 0.08;
  pagoda.add(band);

  // 窗：四面各一，点亮时透出暖光
  const wm = new THREE.MeshBasicMaterial({ color: LANTERN, transparent: true, opacity: 0 });
  winMats.push(wm);
  const wy = py + bh * 0.52, o = w / 2 + 0.02;
  [[0, wy, o, 0], [0, wy, -o, Math.PI], [o, wy, 0, Math.PI / 2], [-o, wy, 0, -Math.PI / 2]]
    .forEach(([x, y, z, ry]) => {
      const win = new THREE.Mesh(winGeo, wm);
      win.position.set(x, y, z); win.rotation.y = ry;
      pagoda.add(win);
    });

  py += bh;

  // 檐
  const ew = w * 1.52, eh = lerp(1.6, 1.05, t);
  const eave = makeEave(ew, eh);
  eave.position.y = py + eh / 2 - 0.18;
  pagoda.add(eave);
  const eaveBaseY = py - 0.18 + eh * 0.52;   // 翘起后的檐角高度
  const cornerXZ = (ew / 2) * 1.12;

  // 檐角风铃 ×4
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const bg = new THREE.Group();
    bg.position.set(sx * cornerXZ * 0.96, eaveBaseY, sz * cornerXZ * 0.96);
    const str = new THREE.Mesh(strGeo, bellMat); str.position.y = -0.28;
    const bell = new THREE.Mesh(bellGeo, bellMat); bell.position.y = -0.68;
    bg.add(str, bell);
    pagoda.add(bg);
  }

  // 灯笼 ×4（每面中点），吊在檐下
  const lm = new THREE.MeshBasicMaterial({ color: LANTERN, transparent: true, opacity: 0.1 });
  const hm = new THREE.SpriteMaterial({
    map: glowTex, color: LANTERN, transparent: true, opacity: 0.04,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  lanternMats.push(lm); haloMats.push(hm);
  const hangY = py - 0.1, hd = w / 2 + 0.62;
  [[0, hangY, hd], [0, hangY, -hd], [hd, hangY, 0], [-hd, hangY, 0]].forEach(([x, y, z], k) => {
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    const str = new THREE.Mesh(strGeo, bellMat); str.position.y = -0.28;
    const bulb = new THREE.Mesh(bulbGeo, lm); bulb.scale.y = 1.18; bulb.position.y = -0.85;
    const halo = new THREE.Sprite(hm); halo.position.y = -0.85; halo.scale.set(2.6, 2.6, 1);
    grp.add(str, bulb, halo);
    pagoda.add(grp);
    lanterns.push({ grp, ph: i * 1.7 + k * 1.3 });
  });

  py += eh * 0.66;
}
// 宝刹
{
  const spire = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.4, 8), trimMat);
  pole.position.y = 1.7;
  spire.add(pole);
  for (let k = 0; k < 5; k++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55 - k * 0.07, 0.045, 8, 20),
      new THREE.MeshBasicMaterial({ color: MOONW, transparent: true, opacity: 0.75 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.9 + k * 0.5;
    spire.add(ring);
  }
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshBasicMaterial({ color: MOONW }));
  tip.position.y = 3.6;
  spire.add(tip);
  spire.position.y = py + 0.2;
  pagoda.add(spire);
}

/* ================= 镜像湖面 ================= */
const RT = new THREE.WebGLRenderTarget(512, 512);
const lakeUniforms = {
  tRefl: { value: RT.texture },
  uTexMat: { value: new THREE.Matrix4() },
  uTime: { value: 0 },
  uLantern: { value: new THREE.Color(LANTERN) },
  uRip: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -10, 0)) },
};
const lake = new THREE.Mesh(
  new THREE.PlaneGeometry(600, 520),
  new THREE.ShaderMaterial({
    uniforms: lakeUniforms, fog: false,
    vertexShader: `varying vec3 vW;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `uniform sampler2D tRefl;
      uniform mat4 uTexMat; uniform float uTime;
      uniform vec4 uRip[8]; uniform vec3 uLantern;
      varying vec3 vW;
      void main(){
        vec2 d = vec2(
          sin(vW.x * 0.7 + uTime * 0.9) * 0.004 + sin(vW.z * 0.5 - uTime * 0.7) * 0.004,
          cos(vW.z * 0.6 + uTime * 1.1) * 0.004);
        float ring = 0.0;
        for (int k = 0; k < 8; k++) {
          vec4 R = uRip[k];
          float age = uTime - R.z;
          if (age > 0.0 && age < 4.0 && R.w > 0.0) {
            float r = distance(vW.xz, R.xy);
            float wv = exp(-pow((r - age * 2.6) * 1.6, 2.0)) * exp(-age * 1.2) * R.w;
            ring += wv;
            vec2 dir = r > 0.001 ? (vW.xz - R.xy) / r : vec2(0.0);
            d += dir * wv * 0.05;
          }
        }
        vec4 uv4 = uTexMat * vec4(vW, 1.0);
        vec2 uv = clamp(uv4.xy / max(uv4.w, 0.0001), 0.001, 0.999) + d;
        vec3 refl = texture2D(tRefl, uv).rgb;
        vec3 col = mix(vec3(0.020, 0.027, 0.043), refl, 0.72);
        col += uLantern * ring * 0.4;
        gl_FragColor = vec4(col, 1.0);
      }`
  })
);
lake.rotation.x = -Math.PI / 2;
lake.position.set(0, 0, 20);
lake.updateMatrixWorld();
scene.add(lake);

/* 镜像相机（标准平面反射） */
const vCam = new THREE.PerspectiveCamera();
const _rp = new THREE.Plane(), _n = new THREE.Vector3(0, 1, 0);
const _rwp = new THREE.Vector3(), _cwp = new THREE.Vector3(), _rm = new THREE.Matrix4();
const _look = new THREE.Vector3(), _view = new THREE.Vector3(), _tgt = new THREE.Vector3();
function updateMirror() {
  _rwp.setFromMatrixPosition(lake.matrixWorld);
  _cwp.setFromMatrixPosition(camera.matrixWorld);
  _rm.extractRotation(camera.matrixWorld);
  _look.set(0, 0, -1).applyMatrix4(_rm).add(_cwp);
  _view.subVectors(_rwp, _cwp).reflect(_n).negate().add(_rwp);
  _tgt.subVectors(_rwp, _look).reflect(_n).negate().add(_rwp);
  vCam.position.copy(_view);
  vCam.up.set(0, 1, 0).applyMatrix4(_rm).reflect(_n);
  vCam.lookAt(_tgt);
  vCam.fov = camera.fov; vCam.aspect = camera.aspect;
  vCam.near = camera.near; vCam.far = camera.far;
  vCam.updateProjectionMatrix(); vCam.updateMatrixWorld();
  const tm = lakeUniforms.uTexMat.value;
  tm.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  tm.multiply(vCam.projectionMatrix);
  tm.multiply(vCam.matrixWorldInverse);
  tm.multiply(lake.matrixWorld);
}

/* ================= 萤火虫 ================= */
const FF = 130;
const ffGeo = new THREE.BufferGeometry();
const ffPos = new Float32Array(FF * 3), ffBase = [], ffPh = [];
for (let i = 0; i < FF; i++) {
  const x = (Math.random() - 0.5) * 64, y = 0.8 + Math.random() * 8, z = -26 + Math.random() * 44;
  ffPos.set([x, y, z], i * 3);
  ffBase.push([x, y, z]); ffPh.push(Math.random() * Math.PI * 2);
}
ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
const ffMat = new THREE.PointsMaterial({
  map: dotTex, color: 0xffd9a0, size: 0.55, transparent: true, opacity: 0.85,
  blending: THREE.AdditiveBlending, depthWrite: false
});
scene.add(new THREE.Points(ffGeo, ffMat));

/* ================= 交互 ================= */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let ripIdx = 0;
const btnLight = document.getElementById('btnLight');
const btnMoon = document.getElementById('btnMoon');
const btnCloud = document.getElementById('btnCloud');
const btnOrbit = document.getElementById('btnOrbit');
const hint = document.getElementById('hint');

function refreshLightBtn() {
  btnLight.innerHTML = `点亮宝塔（<b>${S.light}</b>/7）`;
}
function lightUp() {
  S.light = (S.light + 1) % (TIERS + 1);
  for (let i = 0; i < TIERS; i++) S.target[i] = i < S.light ? 1 : 0;
  refreshLightBtn();
  hint.classList.add('gone');
}
function addRipple(x, z) {
  const R = lakeUniforms.uRip.value[ripIdx++ % 8];
  R.set(x, z, lakeUniforms.uTime.value, 1);
  hint.classList.add('gone');
}
function cycleMoon() {
  S.moonPhase = (S.moonPhase + 1) % 3;
  moonDisc.material.map = moonTex[S.moonPhase];
  moonDisc.material.needsUpdate = true;
  btnMoon.innerHTML = `月相：<b>${PHASE_NAME[S.moonPhase]}</b>`;
}
function toggleCloud() {
  S.cloudCover = !S.cloudCover;
  btnCloud.innerHTML = `云遮月：<b>${S.cloudCover ? '开' : '关'}</b>`;
}
function toggleOrbit() {
  S.autoOrbit = !S.autoOrbit;
  btnOrbit.innerHTML = `环绕：<b>${S.autoOrbit ? '开' : '关'}</b>`;
}
btnLight.addEventListener('click', (e) => { e.stopPropagation(); lightUp(); });
btnMoon.addEventListener('click', (e) => { e.stopPropagation(); cycleMoon(); });
btnCloud.addEventListener('click', (e) => { e.stopPropagation(); toggleCloud(); });
btnOrbit.addEventListener('click', (e) => { e.stopPropagation(); toggleOrbit(); });
if (window.__PAGODA_STILL) btnOrbit.innerHTML = `环绕：<b>关</b>`;   // 测试钩子标签同步

canvas.addEventListener('pointerdown', (e) => {
  ptr.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  if (ray.intersectObject(pagoda, true).length) { lightUp(); return; }
  const hit = ray.intersectObject(lake);
  if (hit.length) addRipple(hit[0].point.x, hit[0].point.z);
});

/* 鼠标视差 */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
});

/* ================= 主循环 ================= */
const clock = new THREE.Clock();
let angle = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  lakeUniforms.uTime.value = t;

  // 灯笼随风轻摆
  for (const L of lanterns) {
    L.grp.rotation.x = Math.sin(t * 1.25 + L.ph) * 0.09;
    L.grp.rotation.z = Math.cos(t * 1.05 + L.ph * 1.3) * 0.09;
  }
  // 逐层点亮 lerp
  for (let i = 0; i < TIERS; i++) {
    S.cur[i] += (S.target[i] - S.cur[i]) * Math.min(1, dt * 3.2);
    const v = S.cur[i];
    lanternMats[i].opacity = 0.1 + v * 0.9;
    haloMats[i].opacity = 0.04 + v * 0.8;
    winMats[i].opacity = v * 0.95;
  }
  const litFrac = S.cur.reduce((a, b) => a + b, 0) / TIERS;
  tierGlow.forEach((p, i) => { p.intensity = litFrac * (1.6 + i * 0.5); });

  // 萤火虫漂移
  const pa = ffGeo.attributes.position;
  for (let i = 0; i < FF; i++) {
    const b = ffBase[i], ph = ffPh[i];
    pa.setXYZ(i,
      b[0] + Math.sin(t * 0.4 + ph) * 1.6,
      b[1] + Math.sin(t * 0.7 + ph * 1.7) * 0.8,
      b[2] + Math.cos(t * 0.33 + ph) * 1.6);
  }
  pa.needsUpdate = true;
  ffMat.opacity = 0.55 + Math.sin(t * 1.4) * 0.3;

  // 云漂移（遮月）
  for (const c of clouds) {
    c.visible = S.cloudCover;
    if (!c.visible) continue;
    c.position.x = c.userData.x0 + Math.sin(t * c.userData.sp * 0.14 + c.userData.ph) * 26;
  }
  moonDisc.lookAt(camera.position);
  moonHalo.material.opacity = 0.3 + Math.sin(t * 0.8) * 0.05;

  // 相机：缓慢环绕 + 鼠标视差
  if (S.autoOrbit) angle += dt * 0.045;
  mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 2.5);
  mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 2.5);
  camera.position.set(
    Math.sin(angle) * CAM_R + mouse.x * 2.4,
    CAM_H + Math.sin(t * 0.21) * 0.5 - mouse.y * 1.1,
    Math.cos(angle) * CAM_R
  );
  camera.lookAt(LOOK);

  // 镜像先行，主渲染随后
  updateMirror();
  lake.visible = false;
  renderer.setRenderTarget(RT);
  renderer.render(scene, vCam);
  renderer.setRenderTarget(null);
  lake.visible = true;
  renderer.render(scene, camera);
}
animate();

/* ================= loader / intro ================= */
let booted = false;
function boot() {
  if (booted) return; booted = true;
  document.getElementById('loader').classList.add('done');
  const els = [...document.querySelectorAll('[data-intro]')];
  els.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 350 + i * 160));
  setTimeout(() => document.getElementById('loader').remove(), 1500);
  setTimeout(() => hint.classList.add('gone'), 12000);
}
setTimeout(boot, 1400);
setTimeout(boot, 4500);   // 兜底

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  layoutSky();
});
