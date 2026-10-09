import * as THREE from 'three';

/* ============ tide-3d · 潮汐涨落 ============
   月夜海湾：半日潮涨退循环 × 月相联动潮差。
   朔望大潮（潮差 4.8m）/ 上下弦小潮（潮差 2.0m），
   月相盘真实明暗界线，月光在水面拉出银色光路。
   海滩/海浪/月相全部程序化，零外部请求，手写原创。
*/

const $ = (id) => document.getElementById(id);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- 加载完成守卫 ---------------- */
let booted = false;
function ready() {
  if (booted) return; booted = true;
  document.documentElement.classList.add('js');
  setTimeout(() => { const l = $('loader'); if (l) l.remove(); }, 1000);
}
setTimeout(ready, 3800); // 兜底：超时强制进入完成态

/* ---------------- 渲染器 ---------------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true });
} catch (e) {
  document.querySelector('.l-sub').textContent = '当前环境不支持 WebGL，用真机浏览器打开试试';
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x06121f, 0.0028);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 2000);
camera.layers.enable(1); // 第1层：月亮（相位光只照它）
const BASE_CAM = new THREE.Vector3(2, 13, 60);

/* ---------------- 共享 uniform ---------------- */
const U = {
  uTime:    { value: 0 },
  uTide:    { value: 0 },
  uMoonDir: { value: new THREE.Vector3(0, 1, 0) },
};

/* ---------------- JS 侧噪声/地形/波浪（与 GLSL 同式） ---------------- */
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return hash2(ix, iy) * (1 - ux) * (1 - uy) + hash2(ix + 1, iy) * ux * (1 - uy) +
         hash2(ix, iy + 1) * (1 - ux) * uy + hash2(ix + 1, iy + 1) * ux * uy;
}
// 海滩高度：岸线沿 x 轴，z=0 为平均潮位岸线；z>0 内陆，z<0 入海
function beachH(x, z) {
  const h = z >= 0 ? 0.14 * z : 0.10 * z;
  const dune = 1.2 * Math.exp(-Math.pow((z - 26) / 10, 2));
  return h + (z > 0 ? dune : 0) + 0.25 * Math.sin(x * 0.05) * Math.exp(-Math.abs(z) / 18);
}
function waveY(x, z, t) {
  return 0.22 * Math.sin(x * 0.11 + t * 1.1)
       + 0.16 * Math.sin(z * 0.13 - t * 0.9 + 1.7)
       + 0.09 * Math.sin((x + z) * 0.21 + t * 1.7);
}

const GLSL_NOISE = `
float th_hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float th_vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return th_hash(i)*(1.0-u.x)*(1.0-u.y) + th_hash(i+vec2(1,0))*u.x*(1.0-u.y)
       + th_hash(i+vec2(0,1))*(1.0-u.x)*u.y + th_hash(i+vec2(1,1))*u.x*u.y;
}`;
const GLSL_BEACH = `
float th_beachH(vec2 xz){
  float z = xz.y;
  float h = z >= 0.0 ? 0.14*z : 0.10*z;
  float dune = 1.2*exp(-pow((z-26.0)/10.0, 2.0));
  h += (z > 0.0 ? dune : 0.0) + 0.25*sin(xz.x*0.05)*exp(-abs(z)/18.0);
  return h;
}`;
const GLSL_WAVE = `
float th_waveY(vec2 xz, float t){
  return 0.22*sin(xz.x*0.11 + t*1.1)
       + 0.16*sin(xz.y*0.13 - t*0.9 + 1.7)
       + 0.09*sin((xz.x+xz.y)*0.21 + t*1.7);
}`;

/* ---------------- 天空穹顶 ---------------- */
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uMoonDir: U.uMoonDir },
  vertexShader: `varying vec3 vDir;
    void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `varying vec3 vDir; uniform vec3 uMoonDir;
    void main(){
      vec3 d = normalize(vDir);
      vec3 col = mix(vec3(0.052,0.098,0.158), vec3(0.008,0.02,0.045), smoothstep(-0.06, 0.62, d.y));
      float m = max(dot(d, normalize(uMoonDir)), 0.0);
      col += vec3(0.42,0.52,0.68)*pow(m, 18.0)*0.30;   // 月晕染色
      col += vec3(0.62,0.72,0.88)*pow(m, 200.0)*0.85;  // 月盘内辉
      // 地平线一线微光
      col += vec3(0.10,0.16,0.24)*(1.0-smoothstep(0.0,0.16,abs(d.y)))*0.5;
      gl_FragColor = vec4(col, 1.0);
    }`,
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat));

/* ---------------- 星星 ---------------- */
{
  const N = 850, pos = new Float32Array(N * 3), ph = new Float32Array(N), sz = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.asin(Math.random() * 0.98 + 0.02);
    const r = 820;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
    pos[i * 3 + 1] = Math.sin(e) * r;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    ph[i] = Math.random() * 10; sz[i] = 1 + Math.random() * 2.2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: U.uTime },
    vertexShader: `attribute float aPhase; attribute float aSize;
      uniform float uTime; varying float vTw;
      void main(){
        vTw = 0.30+0.70*pow(0.5+0.5*sin(uTime*(0.5+aPhase*0.35)+aPhase*7.0), 2.0);
        gl_PointSize = aSize;
        gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }`,
    fragmentShader: `varying float vTw;
      void main(){
        float d = length(gl_PointCoord-0.5);
        float a = smoothstep(0.5,0.08,d)*vTw;
        gl_FragColor = vec4(0.80,0.87,0.96,a);
      }`,
  });
  scene.add(new THREE.Points(g, m));
}

/* ---------------- 月亮：真球体 + 相位光 = 真实明暗界线 ---------------- */
const moonGroup = new THREE.Group();
moonGroup.layers.set(1);
const MOON_R = 20;
// 程序化月海：canvas 手绘柔边暗斑
const moonTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#cdd8e4'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 46; i++) {
    const r = 6 + Math.random() * 26;
    const gx = Math.random() * 256, gy = Math.random() * 256;
    const gr = x.createRadialGradient(gx, gy, 0, gx, gy, r);
    gr.addColorStop(0, 'rgba(120,138,160,0.20)'); gr.addColorStop(1, 'rgba(120,138,160,0)');
    x.fillStyle = gr; x.beginPath(); x.arc(gx, gy, r, 0, 7); x.fill();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
})();
// 月相着色器：明暗界线由月相解析算出（确定性，不依赖灯光/层）
// uSunDir：世界空间"月面→太阳"方向；p=0 朔（背光全暗），p=0.5 望（全亮）
const moonMat = new THREE.ShaderMaterial({
  fog: false,
  uniforms: { uSunDir: { value: new THREE.Vector3(0, 0, 1) }, uMap: { value: moonTex } },
  vertexShader: `varying vec3 vN; varying vec2 vUv;
    void main(){ vN = normalize(mat3(modelMatrix)*normal); vUv = uv;
      gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `varying vec3 vN; varying vec2 vUv;
    uniform vec3 uSunDir; uniform sampler2D uMap;
    void main(){
      vec3 n = normalize(vN);
      float lit = smoothstep(-0.045, 0.045, dot(n, normalize(uSunDir)));
      vec3 surf = texture2D(uMap, vUv).rgb;
      vec3 col = surf * (0.055 + 1.02 * lit); // 地照微光 + 月相
      gl_FragColor = vec4(col, 1.0);
    }`,
});
const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(MOON_R, 48, 32), moonMat);
moonMesh.layers.set(1);
moonGroup.add(moonMesh);
// 月晕
{
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(128, 128, 20, 128, 128, 128);
  gr.addColorStop(0, 'rgba(215,228,242,0.55)'); gr.addColorStop(0.35, 'rgba(190,208,230,0.18)');
  gr.addColorStop(1, 'rgba(190,208,230,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  halo.scale.set(150, 150, 1); halo.layers.set(1);
  moonGroup.add(halo);
}
scene.add(moonGroup);

// 月相→阳光方向：p=0 朔（太阳在月后，全暗），p=0.5 望（太阳在观察侧，全亮）
function sunDirFromPhase(p, out) {
  const a = p * Math.PI * 2;
  return out.set(0.35 * Math.sin(a), 0.42, -Math.cos(a)).normalize();
}
// 场景月光（第0层，照礁石/沙滩/标尺/浮标）
const moonLight = new THREE.DirectionalLight(0xb9cdea, 1.35);
scene.add(moonLight); scene.add(moonLight.target);
// 补光：让礁石/标尺的向 camera 面有微弱轮廓，不至于死黑
const fillLight = new THREE.DirectionalLight(0x4a6a8a, 0.4);
fillLight.position.set(30, 40, 120);
scene.add(fillLight); scene.add(fillLight.target);
scene.add(new THREE.HemisphereLight(0x2a3f58, 0x0a1220, 0.65));

/* ---------------- 海浪 ---------------- */
const waterMat = new THREE.ShaderMaterial({
  fog: false,
  uniforms: { uTime: U.uTime, uTide: U.uTide, uMoonDir: U.uMoonDir },
  vertexShader: GLSL_WAVE + `
    uniform float uTime; uniform float uTide;
    varying vec3 vWPos; varying vec3 vNorm; varying float vWaveY;
    void main(){
      vec3 p = position;
      vec2 wxz = (modelMatrix*vec4(p,1.0)).xz; // 世界坐标（mesh 有 z 偏移）
      float x = wxz.x, z = wxz.y;
      float t = uTime;
      float w = th_waveY(vec2(x,z), t);
      float dx = 0.22*0.11*cos(x*0.11+t*1.1) + 0.09*0.21*cos((x+z)*0.21+t*1.7);
      float dz = 0.16*0.13*cos(z*0.13-t*0.9+1.7) + 0.09*0.21*cos((x+z)*0.21+t*1.7);
      p.y += uTide + w;
      vWPos = (modelMatrix*vec4(p,1.0)).xyz;
      vNorm = normalize(vec3(-dx, 1.0, -dz));
      vWaveY = w;
      gl_Position = projectionMatrix*viewMatrix*vec4(vWPos,1.0);
    }`,
  fragmentShader: GLSL_NOISE + GLSL_BEACH + `
    uniform float uTime; uniform float uTide; uniform vec3 uMoonDir;
    varying vec3 vWPos; varying vec3 vNorm; varying float vWaveY;
    void main(){
      vec3 n = normalize(vNorm);
      vec3 V = normalize(cameraPosition - vWPos);
      float depth = (uTide + vWaveY) - th_beachH(vWPos.xz);
      // 深浅
      vec3 deep = vec3(0.016,0.070,0.130);
      vec3 shal = vec3(0.050,0.200,0.300);
      vec3 col = mix(shal, deep, smoothstep(0.0, 6.0, depth));
      // 掠射银调
      float fr = pow(1.0-max(dot(n,V),0.0), 3.0);
      col = mix(col, vec3(0.50,0.60,0.74), fr*0.45);
      // 月光镜面 + 光路闪烁
      vec3 L = normalize(uMoonDir);
      vec3 Hv = normalize(L+V);
      float dh = max(dot(n,Hv),0.0);
      col += vec3(0.85,0.90,1.0)*pow(dh,140.0)*1.5;
      float g2 = th_vnoise(vWPos.xz*3.0+uTime*0.7);
      col += vec3(0.70,0.78,0.90)*pow(dh,24.0)*step(0.72,g2)*0.8;
      // 岸线泡沫
      float n1 = th_vnoise(vWPos.xz*0.9+vec2(0.0,uTime*0.4));
      float band = (1.0-smoothstep(0.08,0.6,depth))*step(0.0,depth);
      float stripes = 0.5+0.5*sin(depth*24.0-uTime*2.6+n1*6.0);
      float foam = band*smoothstep(0.38,0.8,stripes*0.55+n1*0.6);
      float lace = (1.0-smoothstep(0.02,0.12,abs(depth-0.06)))*(0.4+0.6*n1);
      vec3 foamC = vec3(0.82,0.88,0.95);
      col = mix(col, foamC, clamp(foam+lace*0.7,0.0,1.0)*0.85);
      // 波峰微白
      col = mix(col, foamC, smoothstep(0.28,0.45,vWaveY)*0.12);
      gl_FragColor = vec4(col, 1.0);
    }`,
});
{
  const g = new THREE.PlaneGeometry(440, 300, 150, 100);
  g.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(g, waterMat);
  water.position.set(0, 0, -20);
  water.frustumCulled = false;
  scene.add(water);
}

/* ---------------- 沙滩 ---------------- */
const beachMat = new THREE.ShaderMaterial({
  fog: false,
  uniforms: { uTime: U.uTime, uTide: U.uTide, uMoonDir: U.uMoonDir },
  vertexShader: `
    varying vec3 vWPos; varying vec3 vNorm;
    void main(){
      vWPos = (modelMatrix*vec4(position,1.0)).xyz;
      vNorm = normalize(mat3(modelMatrix)*normal);
      gl_Position = projectionMatrix*viewMatrix*vec4(vWPos,1.0);
    }`,
  fragmentShader: GLSL_NOISE + `
    uniform float uTide; uniform vec3 uMoonDir;
    varying vec3 vWPos; varying vec3 vNorm;
    void main(){
      vec3 n = normalize(vNorm);
      vec3 V = normalize(cameraPosition - vWPos);
      float g = th_vnoise(vWPos.xz*2.4);
      // 干沙 / 湿沙（水位线上下 1 米渐变）
      float wet = 1.0-smoothstep(uTide+0.15, uTide+1.1, vWPos.y);
      vec3 dry = vec3(0.135,0.190,0.250);
      vec3 wetC = vec3(0.058,0.098,0.148);
      vec3 sand = mix(dry, wetC, wet);
      sand *= 0.90+0.20*g;
      // 月光漫反射
      vec3 L = normalize(uMoonDir);
      float dif = max(dot(n,L),0.0);
      vec3 col = sand*(0.38+0.95*dif*vec3(0.72,0.83,1.0));
      // 湿沙镜面微光
      vec3 Hv = normalize(L+V);
      col += vec3(0.72,0.80,0.92)*pow(max(dot(n,Hv),0.0),36.0)*wet*0.30;
      // 水线一痕
      float wm = 1.0-smoothstep(0.05,0.32,abs(vWPos.y-uTide));
      col = mix(col, vec3(0.72,0.79,0.87), wm*0.22*(0.5+0.5*g));
      gl_FragColor = vec4(col, 1.0);
    }`,
});
{
  const g = new THREE.PlaneGeometry(440, 300, 150, 100);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, beachH(p.getX(i), p.getZ(i) - 20));
  g.computeVertexNormals();
  const beach = new THREE.Mesh(g, beachMat);
  beach.position.set(0, 0, -20);
  scene.add(beach);
}

/* ---------------- 礁石（程序化抖动二十面体） ---------------- */
const rockMat = new THREE.MeshStandardMaterial({ color: 0x2b3b4d, roughness: 0.92, metalness: 0.05, flatShading: true });
function addRock(x, wz, r) { // 世界坐标
  const g = new THREE.IcosahedronGeometry(r, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const j = 0.72 + 0.55 * vnoise(p.getX(i) * 0.8 + x, p.getZ(i) * 0.8 + wz);
    p.setXYZ(i, p.getX(i) * j, p.getY(i) * j * 0.75, p.getZ(i) * j);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, rockMat);
  m.position.set(x, beachH(x, wz) + r * 0.28, wz);
  scene.add(m);
}
addRock(-24, 6, 3.2); addRock(-9, -2, 2.1); addRock(7, 4, 2.7);
addRock(19, -5, 1.7); addRock(30, 8, 3.8); addRock(-33, -6, 2.3);

/* ---------------- 验潮标尺 ---------------- */
{
  const c = document.createElement('canvas'); c.width = 8; c.height = 256;
  const x = c.getContext('2d');
  for (let i = 0; i < 16; i++) {
    x.fillStyle = i % 2 ? '#dfe8f2' : '#131f2d';
    x.fillRect(0, i * 16, 8, 16);
  }
  x.fillStyle = '#dfe8f2';
  for (let i = 0; i <= 16; i++) x.fillRect(0, i * 16 - 1, 8, 2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 8.6, 12),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })
  );
  const px = -13, pz = -8; // 世界坐标：平均潮位岸线外 8 米
  pole.position.set(px, beachH(px, pz) + 1.6, pz);
  scene.add(pole);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xdfe8f2, roughness: 0.4 }));
  cap.position.set(px, beachH(px, pz) + 5.95, pz);
  scene.add(cap);
}

/* ---------------- 浮标（随波起伏） ---------------- */
const buoy = new THREE.Group();
const buoyLampMat = new THREE.MeshStandardMaterial({ color: 0xffe9b8, emissive: 0xffd98a, emissiveIntensity: 0.4 });
{
  const hull = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0xb9c6d4, roughness: 0.5, metalness: 0.3 }));
  hull.scale.y = 0.85; buoy.add(hull);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x5b7189, roughness: 0.6 }));
  mast.position.y = 1.1; buoy.add(mast);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), buoyLampMat);
  lamp.position.y = 2.05; buoy.add(lamp);
  buoy.position.set(11, 0, -34);
  scene.add(buoy);
}

/* ---------------- 潮汐模型 ---------------- */
const MAXH = 2.4;              // 大潮半潮差（米）
const TIDE_PERIOD = 12.42;      // 半日潮周期（小时）
const LUNAR_DAY = 24.84;        // 太阴日（小时）
const PHASE0 = 0;
const PHASE_NAMES = ['朔', '娥眉月', '上弦月', '盈凸月', '望', '亏凸月', '下弦月', '残月'];
// 月相→潮差：朔/望=1.0（大潮），上下弦=0.42（小潮），余弦平滑过渡
const ampFromPhase = (p) => 0.71 + 0.29 * Math.cos(4 * Math.PI * p);
const tideKind = (a) => a > 0.85 ? '大潮' : (a < 0.55 ? '小潮' : '中潮');
const levelAt = (h, amp) => amp * MAXH * Math.cos(2 * Math.PI * h / TIDE_PERIOD + PHASE0);

const S = {
  simH: 3.1,            // 起点：退潮中段，水位过零，岸线居中
  speed: 240, prevSpeed: 240,
  phase: 0.5, phaseT: 0.5,   // 0=朔 0.5=望
  amp: 1, ampT: 1,
  paused: false, demo: null,
};

/* ---------------- UI 接线 ---------------- */
const moonBtns = [...document.querySelectorAll('.moon')];
function selectPhase(i) {
  S.phaseT = i / 8;
  S.ampT = ampFromPhase(S.phaseT);
  moonBtns.forEach(b => b.classList.toggle('sel', +b.dataset.i === i));
  $('phaseName').textContent = PHASE_NAMES[i];
}
moonBtns.forEach(b => b.addEventListener('click', () => selectPhase(+b.dataset.i)));

const speedInput = $('speed');
function setSpeed(s) {
  S.speed = Math.max(1, Math.min(1000, Math.round(s)));
  $('speedVal').textContent = '×' + S.speed;
  speedInput.value = Math.round(1000 * Math.log(S.speed) / Math.log(1000));
}
speedInput.addEventListener('input', () => {
  cancelDemo();
  setSpeed(Math.exp(Math.log(1000) * speedInput.value / 1000));
});

function nextExtreme(flood) {
  const w = 2 * Math.PI / TIDE_PERIOD;
  const target = flood ? 0 : Math.PI; // cos 取极大/极小
  const k = Math.ceil((w * S.simH + PHASE0 - target) / (2 * Math.PI));
  let h = (target + 2 * Math.PI * k - PHASE0) / w;
  if (h < S.simH + 0.15) h += TIDE_PERIOD;
  return h;
}
function startDemo(flood, btn) {
  cancelDemo();
  const hExt = nextExtreme(flood);
  S.prevSpeed = S.speed;
  S.simH = hExt - 1.1;      // 提前 1 模拟小时，×600 看完涨/退全程
  setSpeed(600);
  S.demo = { until: hExt + 0.9, btn };
  btn.classList.add('live');
}
function cancelDemo() {
  if (S.demo && S.demo.btn) S.demo.btn.classList.remove('live');
  S.demo = null;
}
$('demoFlood').addEventListener('click', (e) => startDemo(true, e.currentTarget));
$('demoEbb').addEventListener('click', (e) => startDemo(false, e.currentTarget));
$('pauseBtn').addEventListener('click', (e) => {
  S.paused = !S.paused;
  e.currentTarget.textContent = S.paused ? '继续' : '暂停';
  e.currentTarget.classList.toggle('live', S.paused);
});

function updateReadouts() {
  const lv = levelAt(S.simH, S.amp);
  const lvD = Math.abs(lv) < 0.05 ? 0 : lv; // -0.0 归一化
  const w = 2 * Math.PI / TIDE_PERIOD;
  const d = -S.amp * MAXH * w * Math.sin(w * S.simH + PHASE0); // 米/小时
  $('stLevel').textContent = (lvD >= 0 ? '+' : '') + lvD.toFixed(1) + ' m';
  $('stDir').textContent = d > 0.12 ? '涨潮中' : (d < -0.12 ? '退潮中' : (lv > 0 ? '高潮平潮' : '低潮平潮'));
  $('stRange').textContent = (2 * S.amp * MAXH).toFixed(1) + ' m';
  const pi = Math.round(S.phase * 8) % 8;
  const txt = PHASE_NAMES[pi] + ' · ' + tideKind(S.amp);
  $('stPhase').textContent = txt;
  $('badgeTxt').textContent = txt;
}

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
let tG = 0, frames = 0, lastUI = -1;
const mouse = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });
const moonDir = new THREE.Vector3(), sunDir = new THREE.Vector3(), tmpV = new THREE.Vector3();
const driftOK = !reduced;

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  tG += dt;
  if (!S.paused) S.simH += dt * S.speed / 3600;
  // 月相/潮差指数平滑，无跳变
  S.phase += (S.phaseT - S.phase) * (1 - Math.exp(-dt * 1.4));
  S.amp += (S.ampT - S.amp) * (1 - Math.exp(-dt * 0.7));
  const lv = levelAt(S.simH, S.amp);

  U.uTime.value = tG;
  U.uTide.value = lv;

  // 月亮：随太阴日缓慢起落，仰角约 5°–14°，恒在视野内
  const alt = 0.17 + 0.08 * Math.sin(2 * Math.PI * S.simH / LUNAR_DAY + 0.8);
  const az = -0.35;
  moonDir.set(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt)).normalize();
  U.uMoonDir.value.copy(moonDir);
  moonGroup.position.copy(moonDir).multiplyScalar(760);
  sunDirFromPhase(S.phase, sunDir);
  moonMat.uniforms.uSunDir.value.copy(sunDir);
  moonLight.position.copy(moonDir).multiplyScalar(120);

  // 浮标随波
  const bx = 11, bz = -34;
  buoy.position.y = lv + waveY(bx, bz, tG) + 0.12;
  buoy.rotation.z = (waveY(bx - 1.6, bz, tG) - waveY(bx + 1.6, bz, tG)) / 3.2 * 1.2;
  buoy.rotation.x = (waveY(bx, bz + 1.6, tG) - waveY(bx, bz - 1.6, tG)) / 3.2 * 1.2;
  buoyLampMat.emissiveIntensity = 0.25 + 2.4 * Math.pow(0.5 + 0.5 * Math.sin(tG * 2.1), 6);

  // 相机：缓慢漂移 + 鼠标/触屏视差
  const cx = 2 + (driftOK ? Math.sin(tG * 0.045) * 1.6 : 0) + mouse.x * 4;
  camera.position.lerp(tmpV.set(cx, 13 - mouse.y * 2, 60), 1 - Math.exp(-dt * 2.5));
  camera.lookAt(0, 1.5, -6);

  // 演示结束：恢复原速
  if (S.demo && S.simH >= S.demo.until) { setSpeed(S.prevSpeed); cancelDemo(); }

  renderer.render(scene, camera);
  if (++frames === 4) ready();
  if (tG - lastUI > 0.25) { lastUI = tG; updateReadouts(); }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setSpeed(240);
tick();
