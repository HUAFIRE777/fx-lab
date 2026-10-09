/* coral-reef-3d · 珊瑚礁生态 — original implementation for huafire3d fx-lab
 * 程序化珊瑚（递归分支/扇形/管状）+ boids 鱼群 + 焦散光纹 + 丁达尔光束
 */
import * as THREE from 'three';

/* ---------- 基础 ---------- */
const canvas = document.getElementById('v');
const isMobile = matchMedia('(max-width:640px)').matches || 'ontouchstart' in window;
const FISH_N = isMobile ? 20 : 32;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.querySelector('#loader .lt').textContent = '当前设备不支持 WebGL';
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const BG = new THREE.Color(0x0a4a66);
scene.background = BG;
scene.fog = new THREE.Fog(0x0a4a66, 30, 95);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 220);
camera.position.set(0, 9, 26);

/* 确定性随机，保证每次构图一致 */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261009);

/* 共享 uniform（同一对象引用，多材质联动） */
const uTime = { value: 0 };
const uCaustic = { value: 0.75 };  // 焦散强度
const uRay = { value: 0.38 };      // 光束强度
const uGlow = { value: 0.35 };     // 珊瑚荧光
const uFishLight = { value: 1.0 }; // 鱼群受光
const uFogColor = { value: new THREE.Color(0x0a4a66) };

/* ---------- 灯光 ---------- */
const hemi = new THREE.HemisphereLight(0x9fd8e8, 0x06283c, 0.85);
scene.add(hemi);
const dirL = new THREE.DirectionalLight(0xcff4ff, 1.35);
dirL.position.set(8, 22, 6);
scene.add(dirL);
const glowL = new THREE.PointLight(0x5df2ff, 12, 42, 1.8);
glowL.position.set(0, 6, 0);
scene.add(glowL);

/* ---------- 几何工具 ---------- */
const _v = new THREE.Vector3();
function paintGrow(geo, grow, ripple) {
  const n = geo.attributes.position.count;
  const gr = new Float32Array(n).fill(grow);
  const rp = new Float32Array(n).fill(ripple || 0);
  geo.setAttribute('aGrow', new THREE.BufferAttribute(gr, 1));
  geo.setAttribute('aRipple', new THREE.BufferAttribute(rp, 1));
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  return geo;
}
/* 按 aGrow 做顶点色：基部深橙 -> 中部珊瑚橙 -> 梢部泛荧光青 */
const C_BASE = new THREE.Color(0xb23c1e), C_MID = new THREE.Color(0xff7a59),
      C_TIP = new THREE.Color(0xffd9b0), C_CYAN = new THREE.Color(0x5df2ff);
function colorize(geo, tipCyan) {
  const pos = geo.attributes.position, gr = geo.attributes.aGrow, n = pos.count;
  const col = new Float32Array(n * 3), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const g = gr.array[i];
    _v.fromBufferAttribute(pos, i);
    if (g < 0.55) c.lerpColors(C_BASE, C_MID, g / 0.55);
    else c.lerpColors(C_MID, C_TIP, (g - 0.55) / 0.45);
    if (tipCyan && g > 0.86) c.lerp(C_CYAN, (g - 0.86) / 0.14 * 0.85); // 梢部荧光青点缀
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}
function mergeGeos(list) {
  const items = list.map(g => (g.index ? g.toNonIndexed() : g));
  let total = 0;
  for (const g of items) total += g.attributes.position.count;
  const P = new Float32Array(total * 3), N = new Float32Array(total * 3),
        C = new Float32Array(total * 3), U = new Float32Array(total * 2),
        G = new Float32Array(total), R = new Float32Array(total);
  let o = 0;
  for (const g of items) {
    const n = g.attributes.position.count;
    P.set(g.attributes.position.array, o * 3);
    N.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) C.set(g.attributes.color.array, o * 3); // 无色则留零，colorize 后补
    U.set(g.attributes.uv.array, o * 2);
    G.set(g.attributes.aGrow.array, o);
    R.set(g.attributes.aRipple.array, o);
    o += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  out.setAttribute('color', new THREE.BufferAttribute(C, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  out.setAttribute('aGrow', new THREE.BufferAttribute(G, 1));
  out.setAttribute('aRipple', new THREE.BufferAttribute(R, 1));
  return out;
}
/* a->b 的圆柱段 */
function tube(a, b, r0, r1, radial) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, radial || 7, 1, false);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
}

/* ---------- 珊瑚材质：生长裁剪 + 摆动 + 梢部荧光 ---------- */
function makeCoralMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.05, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGrow = { value: 0 };
    sh.uniforms.uTime = uTime;
    sh.uniforms.uGlow = uGlow;
    sh.uniforms.uPhase = { value: rnd() * 6.28 };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aGrow; attribute float aRipple;
        uniform float uTime; uniform float uPhase;
        varying float vGrow; varying float vTip;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vGrow = aGrow;
        vTip = smoothstep(0.78, 1.0, aGrow);
        transformed.x += sin(uTime*0.9 + uPhase + transformed.y*0.6) * 0.07 * aGrow;
        transformed.z += cos(uTime*0.7 + uPhase + transformed.y*0.5) * 0.05 * aGrow
          + sin(uTime*1.7 + uPhase + transformed.x*2.0 + transformed.y*1.6) * 0.14 * aRipple * aGrow;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uGrow; uniform float uGlow;
        varying float vGrow; varying float vTip;`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        if (vGrow > uGrow) discard;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += vColor * 0.22; // 珊瑚本体微发光，在深蓝场景里跳出来
        totalEmissiveRadiance += vec3(0.36, 0.95, 1.0) * vTip * uGlow;`);
    m.userData.shader = sh;
  };
  m.customProgramCacheKey = () => 'coral1';
  return m;
}

/* ---------- 珊瑚生成：鹿角状（递归分支） ---------- */
function buildStaghorn(scale) {
  const segs = [];
  let order = 0;
  const total = 23; // 实际段数约 22，梯度铺满
  function branch(p, dir, len, r, depth) {
    const g = order / total;
    const q = new THREE.Vector3().copy(p).addScaledVector(dir, len);
    segs.push(paintGrow(tube(p, q, r, r * 0.66), Math.min(g, 1), 0));
    order++;
    if (depth <= 0) { // 梢部小球
      const tip = new THREE.SphereGeometry(r * 1.5, 8, 6);
      tip.translate(q.x, q.y, q.z);
      segs.push(paintGrow(tip, 1, 0));
      return;
    }
    const kids = depth > 2 ? 3 : 2;
    for (let i = 0; i < kids; i++) {
      const axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
      const nd = dir.clone().applyAxisAngle(axis, 0.6 + rnd() * 0.6).normalize();
      nd.y = nd.y * 0.5 + 0.25; nd.normalize(); // 轻微上偏、保持开散
      branch(q, nd, len * (0.68 + rnd() * 0.12), r * 0.6, depth - 1);
    }
  }
  branch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.12, 1, 0.06).normalize(), 1.7 * scale, 0.3 * scale, 3);
  const geo = mergeGeos(segs);
  colorize(geo, true);
  geo.scale(scale, scale, scale);
  return geo;
}

/* ---------- 珊瑚生成：扇状 ---------- */
function buildFan(R) {
  const segs = 26, posArr = [], idx = [];
  const base = [0, 0, 0];
  for (let i = 0; i <= segs; i++) {
    const a = -1.05 + (2.1 * i) / segs;
    const rr = R * (0.88 + 0.12 * Math.sin(i * 2.3));
    posArr.push(Math.sin(a) * rr, Math.cos(a) * rr * 0.92 + 0.15, Math.sin(i * 3.1) * 0.12 * R);
  }
  const g = new THREE.BufferGeometry();
  const P = new Float32Array((segs + 2) * 3);
  P.set(base, 0);
  for (let i = 0; i <= segs; i++) P.set([posArr[i * 3], posArr[i * 3 + 1], posArr[i * 3 + 2]], (i + 1) * 3);
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  const I = [];
  for (let i = 1; i <= segs; i++) I.push(0, i, i + 1);
  g.setIndex(I);
  g.computeVertexNormals();
  // aGrow 按到基部距离
  const n = g.attributes.position.count, gr = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    _v.fromBufferAttribute(g.attributes.position, i);
    gr[i] = Math.min(_v.length() / R, 1);
  }
  g.setAttribute('aGrow', new THREE.BufferAttribute(gr, 1));
  g.setAttribute('aRipple', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  const merged = mergeGeos([g]);
  colorize(merged, true);
  return merged;
}

/* ---------- 珊瑚生成：管状 ---------- */
function buildTubes() {
  const segs = [];
  const n = 5 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.6;
    const rr = 0.3 + rnd() * 0.55;
    const bx = Math.cos(a) * rr, bz = Math.sin(a) * rr;
    const h = 1.1 + rnd() * 1.6, r = 0.16 + rnd() * 0.14;
    const tilt = new THREE.Vector3((rnd() - 0.5) * 0.35, 1, (rnd() - 0.5) * 0.35).normalize();
    const top = new THREE.Vector3(bx, 0, bz).addScaledVector(tilt, h);
    const outer = new THREE.CylinderGeometry(r, r * 1.15, h, 9, 1, true);
    outer.translate(0, h / 2, 0);
    outer.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tilt));
    outer.translate(bx, 0, bz);
    // aGrow 按高度
    const nn = outer.attributes.position.count, gr = new Float32Array(nn);
    for (let k = 0; k < nn; k++) {
      _v.fromBufferAttribute(outer.attributes.position, k);
      gr[k] = Math.min(Math.max(_v.y / h, 0), 1);
    }
    outer.setAttribute('aGrow', new THREE.BufferAttribute(gr, 1));
    outer.setAttribute('aRipple', new THREE.BufferAttribute(new Float32Array(nn), 1));
    outer.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(nn * 2), 2));
    // 管口暗色内盘
    const cap = new THREE.CircleGeometry(r * 0.92, 9);
    cap.rotateX(-Math.PI / 2);
    cap.translate(0, h - 0.06, 0);
    cap.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tilt));
    cap.translate(bx, 0, bz);
    const nc = cap.attributes.position.count;
    cap.setAttribute('aGrow', new THREE.BufferAttribute(new Float32Array(nc).fill(1), 1));
    cap.setAttribute('aRipple', new THREE.BufferAttribute(new Float32Array(nc), 1));
    cap.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(nc * 2), 2));
    cap.computeVertexNormals();
    segs.push(outer, cap);
  }
  const geo = mergeGeos(segs);
  colorize(geo, false);
  // 管口内盘压暗：aGrow 顶部 + 法线朝上 = 内盘
  const col = geo.attributes.color, nor = geo.attributes.normal;
  for (let i = 0; i < col.count; i++) {
    if (geo.attributes.aGrow.array[i] > 0.97 && nor.getY(i) > 0.6) col.setXYZ(i, 0.14, 0.09, 0.08);
  }
  return geo;
}

/* ---------- 种植珊瑚 ---------- */
const corals = [];
const coralDefs = [
  { t: 'stag', s: 1.15 }, { t: 'fan', s: 3.0 }, { t: 'tube' }, { t: 'stag', s: 0.85 },
  { t: 'fan', s: 2.2 }, { t: 'stag', s: 1.4 }, { t: 'tube' }, { t: 'fan', s: 2.6 },
  { t: 'stag', s: 0.7 }, { t: 'tube' }, { t: 'stag', s: 1.0 },
];
const spotR = [7.5, 11, 6, 13, 9, 15, 7, 12, 10, 14, 8.5];
coralDefs.forEach((d, i) => {
  let geo;
  if (d.t === 'stag') geo = buildStaghorn(d.s);
  else if (d.t === 'fan') geo = buildFan(d.s);
  else geo = buildTubes();
  const mat = makeCoralMaterial();
  const mesh = new THREE.Mesh(geo, mat);
  const a = (i / coralDefs.length) * Math.PI * 2 + rnd() * 0.5;
  mesh.position.set(Math.cos(a) * spotR[i], 0, Math.sin(a) * spotR[i] * 0.8);
  mesh.rotation.y = rnd() * Math.PI * 2;
  scene.add(mesh);
  corals.push({ mat, delay: 0.4 + i * 0.28 });
});
/* 几块礁石压住构图 */
for (let i = 0; i < 6; i++) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.7 + rnd() * 1.1, 0),
    new THREE.MeshStandardMaterial({ color: 0x0d3a52, roughness: 0.95 })
  );
  const a = rnd() * Math.PI * 2, r = 5 + rnd() * 12;
  rock.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r * 0.8);
  rock.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
  rock.scale.y = 0.55;
  scene.add(rock);
}

/* ---------- 沙地：焦散光纹 ---------- */
const sandMat = new THREE.ShaderMaterial({
  uniforms: { uTime, uCaustic, uFogColor, uFogNear: { value: 30 }, uFogFar: { value: 95 }, uSand: { value: new THREE.Color(0x0e3d57) } },
  vertexShader: `
    varying vec3 vW; varying float vDepth;
    void main(){
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vW = wp.xyz;
      vec4 mv = viewMatrix * wp;
      vDepth = -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform float uTime, uCaustic, uFogNear, uFogFar;
    uniform vec3 uFogColor, uSand;
    varying vec3 vW; varying float vDepth;
    float caustic(vec2 uv, float t){
      vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
      vec2 i = p; float c = 1.0; float inten = 0.005;
      for (int n = 0; n < 4; n++) {
        float tt = t * (1.0 - (3.5 / float(n + 1)));
        i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
        c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
      }
      c /= 4.0; c = 1.17 - pow(c, 1.4);
      return pow(abs(c), 7.0);
    }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main(){
      vec2 uv = vW.xz * 0.055;
      float ca = caustic(uv, uTime * 0.55);
      float grain = hash(floor(vW.xz * 14.0));
      vec3 col = uSand * (0.82 + 0.36 * grain);
      col += vec3(0.5, 0.95, 1.0) * ca * uCaustic * 0.42;
      float d = length(vW.xz);
      col *= 1.0 - smoothstep(30.0, 68.0, d) * 0.55; // 边缘沉入黑暗
      float f = smoothstep(uFogNear, uFogFar, vDepth);
      col = mix(col, uFogColor, f);
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
});
const sand = new THREE.Mesh(new THREE.CircleGeometry(70, 48), sandMat);
sand.rotation.x = -Math.PI / 2;
scene.add(sand);

/* ---------- 丁达尔光束 ---------- */
const rayMat = new THREE.ShaderMaterial({
  uniforms: { uTime, uRay },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform float uTime, uRay;
    varying vec2 vUv;
    void main(){
      float a = pow(1.0 - vUv.y, 1.9) * uRay;
      a *= 0.8 + 0.2 * sin(uTime * 0.6 + vUv.y * 9.0);
      gl_FragColor = vec4(vec3(0.55, 0.9, 1.0) * a, a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
});
const rays = [];
for (let i = 0; i < 6; i++) {
  const g = new THREE.CylinderGeometry(0.7 + rnd() * 0.5, 3.2 + rnd() * 2.2, 24, 12, 1, true);
  const m = new THREE.Mesh(g, rayMat);
  m.position.set(-14 + i * 5.5 + rnd() * 2, 12, -6 + rnd() * 8);
  m.rotation.z = 0.22 + rnd() * 0.12;
  m.rotation.x = (rnd() - 0.5) * 0.1;
  scene.add(m);
  rays.push({ m, ph: rnd() * 6.28 });
}

/* ---------- 水面微光 ---------- */
const surfMat = new THREE.ShaderMaterial({
  uniforms: { uTime, uRay },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform float uTime, uRay;
    varying vec2 vUv;
    void main(){
      vec2 c = vUv - 0.5;
      float w = sin(vUv.x * 24.0 + uTime * 0.8) * sin(vUv.y * 18.0 - uTime * 0.6);
      float a = (0.07 + 0.05 * w) * uRay * 1.3 * smoothstep(0.5, 0.12, length(c));
      gl_FragColor = vec4(vec3(0.5, 0.88, 1.0) * a, a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
});
const surf = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), surfMat);
surf.rotation.x = Math.PI / 2;
surf.position.y = 23;
scene.add(surf);

/* ---------- 浮游微粒 ---------- */
const P_N = isMobile ? 70 : 130;
const pGeo = new THREE.BufferGeometry();
{
  const P = new Float32Array(P_N * 3), S = new Float32Array(P_N);
  for (let i = 0; i < P_N; i++) {
    P[i * 3] = (rnd() - 0.5) * 50; P[i * 3 + 1] = rnd() * 16 + 0.5; P[i * 3 + 2] = (rnd() - 0.5) * 40;
    S[i] = 0.5 + rnd();
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  pGeo.setAttribute('aS', new THREE.BufferAttribute(S, 1));
}
const pMat = new THREE.ShaderMaterial({
  uniforms: { uTime, uRay },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `
    attribute float aS; uniform float uTime; varying float vA;
    void main(){
      vec3 p = position;
      p.x += sin(uTime * 0.3 + p.y * 0.8) * 0.8;
      p.y += sin(uTime * 0.22 + p.x * 0.5) * 0.6;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = aS * 90.0 / max(-mv.z, 1.0);
      vA = 0.5 + 0.5 * sin(uTime * 1.4 + p.x * 3.0);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform float uRay; varying float vA;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float a = (1.0 - d * 2.0) * 0.5 * vA * (0.4 + uRay);
      gl_FragColor = vec4(vec3(0.7, 0.95, 1.0) * a, a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
});
scene.add(new THREE.Points(pGeo, pMat));

/* ---------- 鱼群：几何 + boids ---------- */
function buildFishGeo() {
  const parts = [];
  const body = new THREE.SphereGeometry(0.5, 14, 10);
  body.scale(1.7, 0.45, 0.32);
  body.translate(0.12, 0, 0);
  parts.push(body);
  // 尾鳍：分叉三角
  const tail = new THREE.BufferGeometry();
  tail.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    -0.72, 0, 0,  -1.18, 0.30, 0,  -1.02, 0, 0,
    -0.72, 0, 0,  -1.02, 0, 0,   -1.18, -0.30, 0,
  ]), 3));
  tail.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(12), 2));
  tail.computeVertexNormals();
  parts.push(tail);
  // 背鳍
  const fin = new THREE.BufferGeometry();
  fin.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    -0.15, 0.20, 0,  0.30, 0.20, 0,  0.05, 0.46, 0,
  ]), 3));
  fin.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(6), 2));
  fin.computeVertexNormals();
  parts.push(fin);
  const items = parts.map(g => (g.index ? g.toNonIndexed() : g));
  let total = 0;
  for (const g of items) total += g.attributes.position.count;
  const P = new Float32Array(total * 3), N = new Float32Array(total * 3),
        C = new Float32Array(total * 3), U = new Float32Array(total * 2);
  const cTop = new THREE.Color(0xd84a30), cMid = new THREE.Color(0xff7a59),
        cBelly = new THREE.Color(0xffc9a8), cc = new THREE.Color();
  let o = 0;
  for (const g of items) {
    const n = g.attributes.position.count;
    P.set(g.attributes.position.array, o * 3);
    N.set(g.attributes.normal.array, o * 3);
    U.set(g.attributes.uv.array, o * 2);
    for (let i = 0; i < n; i++) {
      const y = g.attributes.position.array[i * 3 + 1];
      const x = g.attributes.position.array[i * 3];
      if (x < -0.7) cc.copy(cTop);                       // 尾鳍深橙
      else if (y > 0.12) cc.lerpColors(cMid, cTop, 0.45); // 背部
      else cc.lerpColors(cBelly, cMid, 0.55);            // 腹部浅
      C[(o + i) * 3] = cc.r; C[(o + i) * 3 + 1] = cc.g; C[(o + i) * 3 + 2] = cc.b;
    }
    o += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  out.setAttribute('color', new THREE.BufferAttribute(C, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  return out;
}
const fishGeo = buildFishGeo();
const phases = new Float32Array(FISH_N);
for (let i = 0; i < FISH_N; i++) phases[i] = rnd() * 6.28;
fishGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));

const fishMat = new THREE.ShaderMaterial({
  uniforms: { uTime, uFishLight, uFogColor, uFogNear: { value: 30 }, uFogFar: { value: 95 } },
  vertexColors: true, side: THREE.DoubleSide,
  vertexShader: `
    attribute float aPhase;
    uniform float uTime;
    varying vec3 vC; varying float vNy; varying float vDepth;
    void main(){
      vC = color;
      vec3 p = position;
      float w = 1.0 - smoothstep(-1.1, 0.9, p.x);   // 头不动、尾摆
      p.z += sin(uTime * 7.0 + aPhase + p.x * 2.2) * 0.24 * w;
      p.y += sin(uTime * 3.1 + aPhase * 1.7) * 0.03;
      vNy = normal.y * 0.5 + 0.5;
      vec4 wp = vec4(p, 1.0);
      #ifdef USE_INSTANCING
        wp = instanceMatrix * wp;
      #endif
      vec4 mv = modelViewMatrix * wp;
      vDepth = -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform float uFishLight, uFogNear, uFogFar;
    uniform vec3 uFogColor;
    varying vec3 vC; varying float vNy; varying float vDepth;
    void main(){
      vec3 c = vC * (0.42 + 0.68 * vNy) * uFishLight;
      c += vec3(0.36, 0.9, 1.0) * pow(1.0 - vNy, 2.0) * 0.14; // 鳞片青色反光
      float f = smoothstep(uFogNear, uFogFar, vDepth);
      c = mix(c, uFogColor, f);
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
});
const fishMesh = new THREE.InstancedMesh(fishGeo, fishMat, FISH_N);
fishMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
fishMesh.frustumCulled = false;
scene.add(fishMesh);

/* boids 状态 */
const fish = [];
for (let i = 0; i < FISH_N; i++) {
  const a = rnd() * Math.PI * 2, r = 4 + rnd() * 8;
  fish.push({
    p: new THREE.Vector3(Math.cos(a) * r, 3 + rnd() * 6, Math.sin(a) * r * 0.7),
    v: new THREE.Vector3(rnd() - 0.5, (rnd() - 0.5) * 0.3, rnd() - 0.5).normalize().multiplyScalar(3),
    scatter: 0,
  });
}
const _d = new THREE.Vector3(), _s = new THREE.Vector3(), _ali = new THREE.Vector3(),
      _coh = new THREE.Vector3(), _sep = new THREE.Vector3(), _m4 = new THREE.Matrix4(),
      _q = new THREE.Quaternion(), _qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
      _sc = new THREE.Vector3(1, 1, 1), _zero = new THREE.Vector3();
const foods = [];
const mouseT = new THREE.Vector3(0, 5, 0); // 鼠标在水中的目标点
let mouseActive = false;

function boids(dt, maxSpeed) {
  const R = 4.2, R2 = R * R;
  for (let i = 0; i < FISH_N; i++) {
    const f = fish[i];
    _sep.set(0, 0, 0); _ali.set(0, 0, 0); _coh.set(0, 0, 0);
    let cnt = 0;
    for (let j = 0; j < FISH_N; j++) {
      if (i === j) continue;
      const o = fish[j];
      const d2 = f.p.distanceToSquared(o.p);
      if (d2 < R2 && d2 > 1e-6) {
        _d.subVectors(f.p, o.p);
        const d = Math.sqrt(d2);
        _sep.addScaledVector(_d.normalize(), (R - d) / R);
        _ali.add(o.v);
        _coh.add(o.p);
        cnt++;
      }
    }
    _s.set(0, 0, 0);
    if (cnt > 0) {
      _sep.multiplyScalar(1.7);
      _ali.multiplyScalar(1 / cnt).normalize().multiplyScalar(maxSpeed).sub(f.v).multiplyScalar(1.0);
      _coh.multiplyScalar(1 / cnt).sub(f.p).normalize().multiplyScalar(maxSpeed).sub(f.v).multiplyScalar(0.85);
      _s.add(_sep).add(_ali).add(_coh);
    }
    // 鼠标：慢移吸引
    if (mouseActive) {
      _d.subVectors(mouseT, f.p);
      const md = _d.length();
      if (md < 12 && md > 0.5) _s.addScaledVector(_d.normalize(), 1.1 * (1 - md / 12));
    }
    // 投食：强吸引
    for (const fd of foods) {
      _d.subVectors(fd.p, f.p);
      const fd2 = _d.length();
      if (fd2 < 16 && fd2 > 0.3) _s.addScaledVector(_d.normalize(), 3.2 * (1 - fd2 / 16));
    }
    // 惊散脉冲
    if (f.scatter > 0.01) {
      _d.subVectors(f.p, f.scatterFrom).normalize();
      _s.addScaledVector(_d, f.scatter * 9);
      f.scatter *= Math.exp(-dt * 1.6);
    }
    // 边界：椭球回游
    const bx = f.p.x / 24, by = (f.p.y - 6.5) / 6, bz = f.p.z / 18;
    const br = bx * bx + by * by + bz * bz;
    if (br > 1) {
      _d.set(-f.p.x / 24, -(f.p.y - 6.5) / 6, -f.p.z / 18).normalize();
      _s.addScaledVector(_d, 3.2 * (br - 1));
    }
    if (f.p.y < 1.2) _s.y += 2.5;
    if (f.p.y > 13) _s.y -= 2.5;
    // 漫游
    _s.x += Math.sin(uTime.value * 0.9 + i * 2.1) * 0.35;
    _s.z += Math.cos(uTime.value * 0.7 + i * 1.7) * 0.35;
    f.v.addScaledVector(_s, dt * 3.2);
    const sp = f.v.length();
    const target = Math.min(Math.max(sp, maxSpeed * 0.55), maxSpeed);
    f.v.multiplyScalar(target / Math.max(sp, 1e-4));
    f.p.addScaledVector(f.v, dt);
  }
}
function updateFishInstances() {
  for (let i = 0; i < FISH_N; i++) {
    const f = fish[i];
    _m4.lookAt(_zero, f.v, camera.up);
    _q.setFromRotationMatrix(_m4).multiply(_qy); // +x 朝前
    const s = 0.85 + (i % 5) * 0.09;
    _sc.set(s, s, s);
    _m4.compose(f.p, _q, _sc);
    fishMesh.setMatrixAt(i, _m4);
  }
  fishMesh.instanceMatrix.needsUpdate = true;
}

/* ---------- 投食 ---------- */
const foodGeo = new THREE.SphereGeometry(0.16, 10, 8);
const foodMat = new THREE.MeshBasicMaterial({ color: 0x9ff7ff });
function dropFood(point) {
  if (foods.length >= 3) {
    const old = foods.shift();
    scene.remove(old.mesh);
  }
  const mesh = new THREE.Mesh(foodGeo, foodMat);
  mesh.position.copy(point);
  scene.add(mesh);
  foods.push({ mesh, p: mesh.position, life: 9 });
  foodCount++;
  document.getElementById('statFood').textContent = foodCount;
}
let foodCount = 0;

/* ---------- 浅滩 / 深海 ---------- */
const MODES = {
  shallow: { bg: new THREE.Color(0x0a4a66), fogNear: 30, fogFar: 95, hemi: 0.85, dir: 1.35, caustic: 0.75, ray: 0.38, glow: 0.35, fish: 1.0, speed: 4.4, depth: '浅滩 · 12m' },
  deep:    { bg: new THREE.Color(0x02141f), fogNear: 22, fogFar: 80, hemi: 0.38, dir: 0.5, caustic: 0.32, ray: 0.16, glow: 1.5, fish: 0.62, speed: 3.2, depth: '深海 · 60m' },
};
let modeTarget = MODES.shallow, fishSpeed = 4.4;
const btnS = document.getElementById('btnShallow'), btnD = document.getElementById('btnDeep');
function setMode(name) {
  modeTarget = MODES[name];
  btnS.classList.toggle('on', name === 'shallow');
  btnD.classList.toggle('on', name === 'deep');
  document.getElementById('statDepth').textContent = modeTarget.depth;
}
btnS.addEventListener('click', () => setMode('shallow'));
btnD.addEventListener('click', () => setMode('deep'));
document.getElementById('btnFeed').addEventListener('click', (e) => {
  e.stopPropagation();
  _v.set((rnd() - 0.5) * 8, 7, (rnd() - 0.5) * 6);
  dropFood(_v.clone());
});

/* ---------- 指针交互：慢移引鱼 / 快挥惊散 / 点击投食 ---------- */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const plane5 = new THREE.Plane(new THREE.Vector3(0, 1, 0), -5);
let lastPX = 0, lastPY = 0, lastPT = 0, pSpeed = 0;
let downX = 0, downY = 0, downT = 0;
function toWorld(cx, cy, out) {
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray.intersectPlane(plane5, out);
}
addEventListener('pointermove', (e) => {
  const now = performance.now();
  const dt = Math.max((now - lastPT) / 1000, 1e-3);
  const dx = e.clientX - lastPX, dy = e.clientY - lastPY;
  pSpeed = Math.hypot(dx, dy) / dt; // px/s
  lastPX = e.clientX; lastPY = e.clientY; lastPT = now;
  if (toWorld(e.clientX, e.clientY, mouseT)) mouseActive = true;
  mouseNX = (e.clientX / innerWidth) * 2 - 1;
  mouseNY = (e.clientY / innerHeight) * 2 - 1;
  if (pSpeed > 1500 && toWorld(e.clientX, e.clientY, _v)) {
    // 快速挥动：惊散
    for (const f of fish) {
      if (f.p.distanceToSquared(_v) < 64) {
        f.scatter = 1;
        f.scatterFrom = (f.scatterFrom || new THREE.Vector3()).copy(_v);
      }
    }
  }
}, { passive: true });
addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; downT = performance.now(); });
addEventListener('pointerup', (e) => {
  const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (moved < 8 && performance.now() - downT < 450 && e.target === canvas) {
    if (toWorld(e.clientX, e.clientY, _v)) dropFood(_v.clone());
  }
});
let mouseNX = 0, mouseNY = 0;

/* ---------- 开场 ---------- */
document.getElementById('statFish').textContent = FISH_N;
let introDone = false;
function completeIntro() {
  if (introDone) return;
  introDone = true;
  document.getElementById('loader').classList.add('done');
  document.querySelectorAll('[data-intro]').forEach((el, i) =>
    setTimeout(() => el.classList.add('is-in'), 150 + i * 130));
}
setTimeout(completeIntro, 3800); // 3.8s 兜底强制进入完成态

const easeOut = t => 1 - Math.pow(1 - t, 3);
const clock = new THREE.Clock();
let frames = 0;

/* ---------- 主循环 ---------- */
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  uTime.value += dt;
  const t = uTime.value;
  const k = 1 - Math.exp(-dt * 2.2); // 环境过渡

  // 环境插值
  BG.lerp(modeTarget.bg, k);
  uFogColor.value.lerp(modeTarget.bg, k);
  scene.fog.color.copy(uFogColor.value);
  scene.fog.near += (modeTarget.fogNear - scene.fog.near) * k;
  scene.fog.far += (modeTarget.fogFar - scene.fog.far) * k;
  hemi.intensity += (modeTarget.hemi - hemi.intensity) * k;
  dirL.intensity += (modeTarget.dir - dirL.intensity) * k;
  uCaustic.value += (modeTarget.caustic - uCaustic.value) * k;
  uRay.value += (modeTarget.ray - uRay.value) * k;
  uGlow.value += (modeTarget.glow - uGlow.value) * k;
  uFishLight.value += (modeTarget.fish - uFishLight.value) * k;
  fishSpeed += (modeTarget.speed - fishSpeed) * k;
  sandMat.uniforms.uFogColor.value.copy(uFogColor.value);
  sandMat.uniforms.uFogNear.value = scene.fog.near;
  sandMat.uniforms.uFogFar.value = scene.fog.far;
  fishMat.uniforms.uFogColor.value.copy(uFogColor.value);
  fishMat.uniforms.uFogNear.value = scene.fog.near;
  fishMat.uniforms.uFogFar.value = scene.fog.far;

  // 珊瑚生长
  for (const c of corals) {
    const sh = c.mat.userData.shader;
    if (sh) sh.uniforms.uGrow.value = easeOut(Math.min(Math.max((t - c.delay) / 2.4, 0), 1));
  }
  // 光束轻摆
  for (const r of rays) {
    r.m.rotation.z = 0.26 + Math.sin(t * 0.24 + r.ph) * 0.05;
  }
  // 投食下沉 + 消散
  for (let i = foods.length - 1; i >= 0; i--) {
    const fd = foods[i];
    fd.life -= dt;
    if (fd.p.y > 1.1) fd.p.y -= dt * 0.9;
    fd.p.x += Math.sin(t * 2 + i) * dt * 0.25;
    const s = Math.min(1, fd.life / 2);
    fd.mesh.scale.setScalar(Math.max(s, 0.01));
    if (fd.life <= 0) { scene.remove(fd.mesh); foods.splice(i, 1); }
  }

  boids(dt, fishSpeed);
  updateFishInstances();

  // 相机：缓慢漂移 + 鼠标视差
  camera.position.x += ((mouseNX * 3.2 + Math.sin(t * 0.1) * 0.8) - camera.position.x) * (1 - Math.exp(-dt * 1.5));
  camera.position.y += ((9 + mouseNY * 1.4) - camera.position.y) * (1 - Math.exp(-dt * 1.5));
  camera.lookAt(0, 4.5, 0);

  renderer.render(scene, camera);

  frames++;
  if (frames === 4) setTimeout(completeIntro, 700); // 首帧渲染后进入完成态
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
