/* =========================================================================
 * waterfall-3d · 瀑布 FALLS
 * 程序化悬崖 + GPU 粒子瀑布（位置更新全部在 vertex shader）
 * 严格三色：#04121a / #38bdf8 / #f0f9ff
 * 代码全部原创。手法参考：旅游/矿泉水品牌水流 hero（大面积纵向水流 + 底部雾化）。
 * ========================================================================= */
import * as THREE from 'three';

/* ---------------- 0. 基础配置 ---------------- */
const ABYSS = 0x04121a, STREAM = 0x38bdf8, FOAM = 0xf0f9ff;
const isMobile = window.matchMedia('(pointer:coarse)').matches || window.innerWidth < 640;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CFG = {
  falls: isMobile ? 2600 : 6500,   // 瀑布粒子数
  splash: isMobile ? 450 : 1100,   // 水花粒子数
  mist: isMobile ? 20 : 42,        // 雾气 sprite 数
  topY: 6.3,                       // 崖顶出水口高度
  botY: 0.12,                      // 水面高度
  halfW: 1.85,                     // 瀑布半宽
  pxMax: isMobile ? 1.5 : 2.0,
};

/* 缓动（物理感，禁用 linear） */
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* 确定性随机（mulberry32） */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* CPU 用 value-noise fbm（悬崖置换，确定性） */
function makeNoise2D(seed) {
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = (rand() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
  const fade = t => t * t * (3 - 2 * t);
  function noise(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const a = perm[X] + Y, b = perm[X + 1] + Y;
    return (grad(perm[a], x, y) * (1 - u) + grad(perm[b], x - 1, y) * u) * (1 - v) +
           (grad(perm[a + 1], x, y - 1) * (1 - u) + grad(perm[b + 1], x - 1, y - 1) * u) * v;
  }
  return function fbm(x, y, oct = 4) {
    let s = 0, amp = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { s += amp * noise(x * f, y * f); amp *= 0.5; f *= 2.03; }
    return s;
  };
}

/* ---------------- 1. 渲染器 / 场景 / 相机 ---------------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CFG.pxMax));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(ABYSS);
scene.fog = new THREE.Fog(ABYSS, 16, 44);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);

const hemi = new THREE.HemisphereLight(FOAM, ABYSS, 0.75);
scene.add(hemi);
const dirLight = new THREE.DirectionalLight(FOAM, 1.25);
dirLight.position.set(6, 10, 7);
scene.add(dirLight);

/* ---------------- 2. 相机轨道（自研：拖拽 + 自动环绕 + 惯性） ---------------- */
const orbit = {
  az: 0.0, el: 0.10, radius: 14.0,
  tAz: 0.0, tEl: 0.10, tRadius: 14.0,
  auto: !reducedMotion,
  dragging: false,
  target: new THREE.Vector3(0, 2.9, 0),
};
function applyOrbit(dt) {
  if (orbit.auto && !orbit.dragging) orbit.tAz += dt * 0.055; // 缓慢环绕
  const k = 1 - Math.exp(-dt * 5.5);                          // 指数跟随（物理感）
  orbit.az += (orbit.tAz - orbit.az) * k;
  orbit.el += (orbit.tEl - orbit.el) * k;
  orbit.radius += (orbit.tRadius - orbit.radius) * k;
  const ce = Math.cos(orbit.el), se = Math.sin(orbit.el);
  camera.position.set(
    orbit.target.x + orbit.radius * ce * Math.sin(orbit.az),
    orbit.target.y + orbit.radius * se,
    orbit.target.z + orbit.radius * ce * Math.cos(orbit.az)
  );
  camera.lookAt(orbit.target);
}
canvas.addEventListener('pointerdown', e => {
  orbit.dragging = true; canvas.classList.add('dragging');
  canvas.setPointerCapture(e.pointerId);
  orbit._lx = e.clientX; orbit._ly = e.clientY;
});
canvas.addEventListener('pointermove', e => {
  if (!orbit.dragging) return;
  const dx = e.clientX - orbit._lx, dy = e.clientY - orbit._ly;
  orbit._lx = e.clientX; orbit._ly = e.clientY;
  orbit.tAz -= dx * 0.0042;
  orbit.tEl = clamp(orbit.tEl + dy * 0.003, -0.02, 0.55);
});
const endDrag = () => { orbit.dragging = false; canvas.classList.remove('dragging'); };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  orbit.tRadius = clamp(orbit.tRadius + e.deltaY * 0.012, 9, 20);
}, { passive: false });

/* ---------------- 3. 全局 uniforms ---------------- */
const uTime = { value: 0 };
const uFlow = { value: 1.12 };       // 水量（滑杆 65 → 0.15+1.45*0.65 ≈ 1.09）
const uFlowTarget = { value: 1.12 };
const uDayMix = { value: 1 };       // 1=昼 0=暮
const uDayTarget = { value: 1 };
const uBright = { value: 1.0 };      // 瀑布整体亮度（暮时提亮制造对比）
const uPx = { value: renderer.getPixelRatio() };

/* ---------------- 4. 悬崖（程序化置换 + 顶点色，CPU 一次性） ---------------- */
const fbm = makeNoise2D(20261009);
const cliffGeo = new THREE.PlaneGeometry(17, 12.5, 150, 100);
let cliffMesh = null;

function displaceCliffRows(y0, y1) {
  const pos = cliffGeo.attributes.position;
  const colors = cliffGeo.attributes.color;
  const cAbyss = new THREE.Color(ABYSS);
  const cStream = new THREE.Color(STREAM);
  const tmp = new THREE.Color();
  for (let iy = y0; iy < y1; iy++) {
    for (let ix = 0; ix <= 150; ix++) {
      const i = iy * 151 + ix;
      const x = pos.getX(i), y = pos.getY(i);
      // 岩体起伏
      let z = fbm(x * 0.32 + 7.3, y * 0.32 - 2.1, 4) * 1.5
            + fbm(x * 1.1 - 3.7, y * 1.1 + 5.2, 2) * 0.35;
      // 中央水道：向内凹陷成 U 形槽
      const ax = Math.abs(x);
      const channel = smoothstep(2.7, 1.1, ax);
      z -= channel * 2.6;
      // 两侧峭壁向外推，制造纵深
      z += smoothstep(3.0, 8.5, ax) * 1.1;
      // 顶部崖沿略向后收
      z -= smoothstep(4.6, 6.2, y) * 0.8;
      pos.setZ(i, z);
      // 顶点色：深渊蓝基底，凸起/水道壁/崖顶混入流光蓝
      const wet = channel * smoothstep(6.4, 2.0, y);            // 水道湿润带
      const crest = smoothstep(5.4, 6.3, y) * (1 - channel);    // 崖顶受光
      const ridge = clamp(fbm(x * 0.32 + 7.3, y * 0.32 - 2.1, 2) * 0.5 + 0.5, 0, 1);
      const m = clamp(wet * 0.34 + crest * 0.24 + ridge * 0.10, 0, 0.5);
      tmp.copy(cAbyss).lerp(cStream, m);
      colors.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
  }
  pos.needsUpdate = true; colors.needsUpdate = true;
}
cliffGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cliffGeo.attributes.position.count * 3), 3));
const cliffMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0.0 });
cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
cliffMesh.position.set(0, 3.1, -1.4);
scene.add(cliffMesh);

/* ---------------- 5. 崖顶水舌（水涌出崖口的亮带） ---------------- */
const lipMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uTime, uDayMix, uBright },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform float uTime, uDayMix, uBright;
    varying vec2 vUv;
    void main(){
      // 水舌：纵向拉长的流动条纹 + 横向错位，模拟翻涌出崖口的水
      float flow = 0.5 + 0.5*sin(vUv.y*22.0 - uTime*9.0
                  + sin(vUv.x*9.0)*2.0 + sin(vUv.x*23.0 + uTime*2.0)*0.8);
      float edgeY = smoothstep(0.0, 0.30, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
      float edgeX = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
      vec3 stream = vec3(0.22,0.74,0.97);
      vec3 foam  = vec3(0.941,0.976,1.0);
      vec3 col = mix(stream, foam, flow*0.40 + 0.22) * mix(1.02, 1.0, uDayMix);
      gl_FragColor = vec4(col * uBright, edgeY * edgeX * 0.72);
    }`,
});
const lip = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7, 1, 1), lipMat);
lip.position.set(0, 5.95, -0.95);
lip.rotation.x = -0.85;
scene.add(lip);

/* ---------------- 6. 瀑布粒子（GPU Points，轨迹全在 shader） ---------------- */
function buildFalls() {
  const n = CFG.falls;
  const rand = mulberry32(777);
  const pos = new Float32Array(n * 3);       // 占位，真实位置由 shader 计算
  const data = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    data[i * 4 + 0] = rand() * 2 - 1;        // x0 ∈ [-1,1]
    data[i * 4 + 1] = rand();                // phase
    data[i * 4 + 2] = 0.7 + rand() * 0.6;    // 速度倍率
    data[i * 4 + 3] = rand();                // rnd（休眠判定/扰动种子）
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aData', new THREE.BufferAttribute(data, 4));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime, uFlow, uDayMix, uBright, uPx,
      uTopY: { value: CFG.topY }, uFallH: { value: CFG.topY - CFG.botY }, uHalfW: { value: CFG.halfW },
    },
    vertexShader: `
      attribute vec4 aData;
      uniform float uTime,uFlow,uTopY,uFallH,uHalfW,uPx,uDayMix;
      varying float vAlpha; varying float vT; varying float vOn;
      void main(){
        float spd = aData.z * (0.72 + 0.5*uFlow);
        float t = fract(uTime*0.145*spd + aData.y);
        float yy = uTopY - t*t*uFallH;                       // 重力加速下落
        float spread = 1.0 + 0.6*t;                          // 下落扩散
        float x = aData.x * uHalfW * spread;
        float r1 = aData.w*6.2831, r2 = aData.w*12.5664;
        // curl 式扰动：两层反向旋转正弦，越往下越强
        float swirl = sin(yy*1.9 + uTime*2.1 + r1)*0.24
                    + sin(yy*4.7 - uTime*3.2 + r2)*0.09;
        x += swirl * (0.15 + 0.85*t);
        float z = -0.55 + (sin(yy*3.1 + uTime*1.6 + r2)*0.32 + sin(uTime*1.2 + r1)*0.22) * t;
        float on = step(aData.w*1.7, uFlow);                 // 水量小时部分粒子休眠
        vec4 mv = modelViewMatrix * vec4(x, yy, z, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = max(-mv.z, 0.1);
        float wSize = (0.05 + 0.30*t) * (0.7 + 0.6*aData.z);
        gl_PointSize = on * wSize * uPx * (300.0/dist);
        vT = t; vOn = on;
        vAlpha = smoothstep(0.0,0.05,t) * (1.0 - smoothstep(0.90,1.0,t)*0.35);
      }`,
    fragmentShader: `
      uniform float uBright, uDayMix;
      varying float vAlpha; varying float vT; varying float vOn;
      void main(){
        if(vOn < 0.5) discard;
        vec2 pc = gl_PointCoord - vec2(0.5);
        float streak = exp(-pc.x*pc.x*42.0);                 // 纵向水丝
        float caps = smoothstep(0.5, 0.12, abs(pc.y));
        float a = streak * caps * vAlpha * 0.8;
        if(a < 0.004) discard;
        vec3 stream = vec3(0.22,0.74,0.97);
        vec3 foam  = vec3(0.941,0.976,1.0);
        vec3 col = mix(stream, foam, clamp(streak*0.7 + vT*0.25, 0.0, 1.0));
        col *= mix(1.0, 1.22, 1.0-uDayMix);                  // 暮时提亮，制造对比
        gl_FragColor = vec4(col * uBright, a);
      }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  scene.add(pts);
  return pts;
}

/* ---------------- 7. 底部水花（撞击溅射） ---------------- */
function buildSplash() {
  const n = CFG.splash;
  const rand = mulberry32(4242);
  const pos = new Float32Array(n * 3);
  const data = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    data[i * 4 + 0] = rand();   // angle
    data[i * 4 + 1] = rand();   // phase
    data[i * 4 + 2] = rand();   // speed
    data[i * 4 + 3] = rand();   // dist01
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aData', new THREE.BufferAttribute(data, 4));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime, uFlow, uBright, uPx },
    vertexShader: `
      attribute vec4 aData;
      uniform float uTime,uFlow,uPx;
      varying float vAlpha;
      void main(){
        float t = fract(uTime*(0.55 + 0.75*aData.z)*(0.7 + 0.6*uFlow) + aData.y);
        float ang = aData.x*6.2831;
        float r = (0.5 + 3.4*t) * (0.55 + 0.45*aData.w) * (0.7 + 0.5*uFlow);
        vec3 p = vec3(cos(ang)*r*1.35,
                      0.12 + 2.4*sin(3.14159*t)*(0.35 + 0.65*fract(aData.w*7.31)),
                      0.7 + sin(ang)*r*0.85);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = max(-mv.z, 0.1);
        float wSize = 0.03 + 0.11*(1.0-t);
        gl_PointSize = wSize * uPx * (300.0/dist) * (0.6 + 0.4*uFlow);
        vAlpha = pow(1.0-t, 1.6)*0.9;
      }`,
    fragmentShader: `
      uniform float uBright;
      varying float vAlpha;
      void main(){
        vec2 pc = gl_PointCoord - vec2(0.5);
        float d = length(pc)*2.0;
        float a = exp(-d*d*4.0) * vAlpha;
        if(a < 0.004) discard;
        vec3 foam = vec3(0.941,0.976,1.0);
        gl_FragColor = vec4(foam * uBright, a);
      }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  scene.add(pts);
  return pts;
}

/* ---------------- 8. 雾气（大 soft sprite，缓慢上升） ---------------- */
function buildMist() {
  const n = CFG.mist;
  const rand = mulberry32(9001);
  const pos = new Float32Array(n * 3);
  const data = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    data[i * 4 + 0] = rand();
    data[i * 4 + 1] = rand();
    data[i * 4 + 2] = 0.6 + rand() * 0.8;
    data[i * 4 + 3] = rand();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aData', new THREE.BufferAttribute(data, 4));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime, uBright, uPx, uDayMix },
    vertexShader: `
      attribute vec4 aData;
      uniform float uTime,uPx;
      varying float vAlpha; varying float vMix;
      void main(){
        float rise = fract(uTime*0.045*aData.z + aData.y);
        vec3 p = vec3((aData.x*2.0-1.0)*4.4 + sin(uTime*0.24 + aData.y*6.2831)*0.9,
                      0.25 + rise*3.6,
                      0.9 + cos(uTime*0.19 + aData.x*6.2831)*0.8);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = max(-mv.z, 0.1);
        float wSize = 1.7 + 2.0*aData.w;
        gl_PointSize = wSize * uPx * (300.0/dist);
        vAlpha = sin(3.14159*rise);
        vMix = aData.w;
      }`,
    fragmentShader: `
      uniform float uBright, uDayMix;
      varying float vAlpha; varying float vMix;
      void main(){
        vec2 pc = gl_PointCoord - vec2(0.5);
        float d = length(pc)*2.0;
        float a = exp(-d*d*3.2) * vAlpha * mix(0.10, 0.17, 1.0-uDayMix);
        if(a < 0.003) discard;
        vec3 stream = vec3(0.22,0.74,0.97);
        vec3 foam  = vec3(0.941,0.976,1.0);
        gl_FragColor = vec4(mix(foam, stream, vMix*0.55) * uBright, a);
      }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  scene.add(pts);
  return pts;
}

/* ---------------- 9. 水面（波纹法线扰动 + 泡沫带） ---------------- */
const waterUniforms = {
  uTime, uDayMix,
  uFogColor: { value: new THREE.Color(ABYSS) },
  uLightDir: { value: new THREE.Vector3(6, 10, 7).normalize() },
  uFoamBoost: { value: 1.0 },
};
function buildWater() {
  const g = new THREE.PlaneGeometry(70, 44, 1, 1);
  const m = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    vertexShader: `
      varying vec3 vW;
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform float uTime, uDayMix, uFoamBoost;
      uniform vec3 uFogColor, uLightDir;
      varying vec3 vW;
      vec2 wgrad(vec2 p, vec2 dir, float freq, float speed, float t){
        float ph = dot(p, dir)*freq + t*speed;
        return dir * (freq*0.06*cos(ph));
      }
      void main(){
        vec2 p = vW.xz;
        float t = uTime;
        vec2 gr = vec2(0.0);
        gr += wgrad(p, vec2( 1.0, 0.3), 1.4, 0.9, t);
        gr += wgrad(p, vec2(-0.6, 1.0), 2.3, 1.7, t);
        gr += wgrad(p, vec2( 0.8,-0.7), 3.9, 2.6, t);
        gr += wgrad(p, vec2(-0.2,-1.0), 6.1, 3.8, t);
        vec3 n = normalize(vec3(-gr.x*0.5, 1.0, -gr.y*0.5));
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
        vec3 deep   = vec3(0.016,0.071,0.102);
        vec3 stream = vec3(0.22,0.74,0.97);
        vec3 foamC  = vec3(0.941,0.976,1.0);
        vec3 col = mix(deep, deep*1.7 + stream*0.10, 0.4);
        col += stream * fres * mix(0.32, 0.62, uDayMix);
        vec3 Hv = normalize(normalize(uLightDir) + V);
        col += foamC * pow(max(dot(n, Hv), 0.0), 120.0) * mix(0.45, 1.0, uDayMix);
        // 撞击泡沫带：扩散环 + 碎裂（弱对比，避免地形图感）
        float d = length(vec2(p.x*0.75, (p.y-0.9)*1.15));
        float band = smoothstep(5.4, 1.4, d);
        float fn = 0.5 + 0.5*sin(d*6.0 - t*4.2 + sin(p.x*2.6 + t*1.3)*1.6 + sin(p.y*3.4 - t)*1.2
                   + sin(p.x*7.7 + p.y*6.3 + t*0.7)*0.9);
        float foam = band * smoothstep(0.50, 0.90, fn) * uFoamBoost;
        foam *= 0.70 + 0.30*sin(p.x*23.0 + p.y*19.0 + t*2.0);
        col = mix(col, foamC, clamp(foam, 0.0, 1.0)*0.62);
        float fd = smoothstep(18.0, 46.0, length(cameraPosition - vW));
        col = mix(col, uFogColor, fd);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = CFG.botY;
  scene.add(mesh);
  return mesh;
}

/* ---------------- 10. 昼 / 暮 ---------------- */
const dayCfg = {
  bg: new THREE.Color(ABYSS).lerp(new THREE.Color(STREAM), 0.22),
  fogNear: 16, fogFar: 44, hemi: 0.75, dir: 1.25, dirColor: new THREE.Color(FOAM),
  bright: 1.0, foam: 1.0,
};
const duskCfg = {
  bg: new THREE.Color(ABYSS),
  fogNear: 10, fogFar: 34, hemi: 0.30, dir: 0.55, dirColor: new THREE.Color(STREAM),
  bright: 1.28, foam: 1.25,
};
function applyDayMix(v) {
  const a = dayCfg, b = duskCfg;
  const L = (x, y) => x + (y - x) * (1 - v);
  scene.background.copy(a.bg).lerp(b.bg, 1 - v);
  scene.fog.color.copy(scene.background);
  scene.fog.near = L(a.fogNear, b.fogNear);
  scene.fog.far = L(a.fogFar, b.fogFar);
  waterUniforms.uFogColor.value.copy(scene.background);
  hemi.intensity = L(a.hemi, b.hemi);
  dirLight.intensity = L(a.dir, b.dir);
  dirLight.color.copy(a.dirColor).lerp(b.dirColor, 1 - v);
  uBright.value = L(a.bright, b.bright);
  waterUniforms.uFoamBoost.value = L(a.foam, b.foam);
}

/* ---------------- 11. UI 接线 ---------------- */
const flowInput = document.getElementById('flow');
const flowVal = document.getElementById('flowVal');
function syncFlowUI() {
  flowVal.textContent = flowInput.value;
  flowInput.style.setProperty('--fill', flowInput.value + '%');
}
flowInput.addEventListener('input', () => {
  const v = +flowInput.value;
  uFlowTarget.value = 0.15 + 1.45 * (v / 100);
  syncFlowUI();
});
syncFlowUI();

const orbitBtn = document.getElementById('orbitBtn');
orbitBtn.addEventListener('click', () => {
  orbit.auto = !orbit.auto;
  orbitBtn.setAttribute('aria-pressed', String(orbit.auto));
});
if (reducedMotion) { orbit.auto = false; orbitBtn.setAttribute('aria-pressed', 'false'); }

const dayBtn = document.getElementById('dayBtn');
const duskBtn = document.getElementById('duskBtn');
function setDayMode(day) {
  uDayTarget.value = day ? 1 : 0;
  dayBtn.classList.toggle('on', day);
  duskBtn.classList.toggle('on', !day);
}
dayBtn.addEventListener('click', () => setDayMode(true));
duskBtn.addEventListener('click', () => setDayMode(false));

/* ---------------- 12. 分帧加载（进度条 → 完成态） ---------------- */
const loader = document.getElementById('loader');
const loadFill = document.getElementById('loadFill');
const loadPct = document.getElementById('loadPct');

const ROWS = 101, ROW_CHUNK = 13;
const tasks = [];
for (let y0 = 0; y0 < ROWS; y0 += ROW_CHUNK) {
  const a = y0, b = Math.min(y0 + ROW_CHUNK, ROWS);
  tasks.push(() => displaceCliffRows(a, b));
}
tasks.push(() => buildFalls());
tasks.push(() => buildSplash());
tasks.push(() => buildMist());
tasks.push(() => buildWater());
tasks.push(() => applyDayMix(1));
let taskIdx = 0;
let revealed = false;

function setProgress() {
  const p = Math.round((taskIdx / tasks.length) * 100);
  loadFill.style.width = p + '%';
  loadPct.textContent = p + '%';
}

function reveal() {
  if (revealed) return;
  revealed = true;
  loadFill.style.width = '100%';
  loadPct.textContent = '100%';
  loader.classList.add('done');
  setTimeout(() => {
    loader.setAttribute('hidden', '');
    document.documentElement.classList.add('is-in'); // 完成态（html.js 前缀选择器）
  }, 850);
}

/* ---------------- 13. 主循环 ---------------- */
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  // 分帧消化构建任务
  if (taskIdx < tasks.length) {
    tasks[taskIdx++]();
    setProgress();
    if (taskIdx >= tasks.length) reveal();
  }
  // 时间与参数跟随（指数趋近，物理感）
  if (!reducedMotion) uTime.value += dt;
  uFlow.value += (uFlowTarget.value - uFlow.value) * (1 - Math.exp(-dt * 4));
  const dm = uDayMix.value + (uDayTarget.value - uDayMix.value) * (1 - Math.exp(-dt * 2.5));
  if (Math.abs(dm - uDayMix.value) > 1e-4) { uDayMix.value = dm; applyDayMix(dm); }
  applyOrbit(dt);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  uPx.value = renderer.getPixelRatio();
});

applyOrbit(0.016);
frame();
