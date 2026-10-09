// kaleidoscope-3d · 万花筒
// 全屏 fragment shader：fbm 云海 + 几何线条双源，经极坐标镜面折叠成对称图案。
// 代码全部原创；three.js 仅作 WebGL 渲染器（vendor 本地文件）。
import * as THREE from 'three';

const canvas = document.getElementById('k');
const loader = document.getElementById('loader');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 状态：目标值与实际值分离，每帧阻尼逼近（物理感） ----------
const S = {
  segT: 8, seg: 8,
  spdT: reduceMotion ? 0 : 0.225, spd: reduceMotion ? 0 : 0.225,
  zoomT: 1, zoom: 1,
  srcT: 0, src: 0,
  rot: 0, rotV: 0,      // 拖拽偏移 + 惯性角速度
  phase: 0,            // 自动旋转累积相位
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  document.getElementById('noWebgl').style.display = 'flex';
  loader.classList.add('done');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
scene.add(camera);

const uniforms = {
  uRes:   { value: new THREE.Vector2(innerWidth, innerHeight) },
  uTime:  { value: 0 },
  uSeg:   { value: S.seg },
  uSpd:   { value: S.spd },
  uRot:   { value: 0 },
  uZoom:  { value: 1 },
  uSrc:   { value: 0 },
  uStill: { value: reduceMotion ? 1 : 0 },
};

const mat = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    varying vec2 vUv;
    uniform vec2 uRes;
    uniform float uTime, uSeg, uSpd, uRot, uZoom, uSrc, uStill;

    // 全页严格三色
    const vec3 CBG = vec3(0.05098, 0.03922, 0.07843); // #0d0a14
    const vec3 CMID= vec3(0.75294, 0.51765, 0.98824); // #c084fc
    const vec3 CHI = vec3(0.94118, 0.67059, 0.98824); // #f0abfc

    float hash(vec2 p){
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float vnoise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < 5; i++){ v += a * vnoise(p); p = m * p; a *= 0.5; }
      return v;
    }

    void main(){
      // 以短边归一化，滚轮控制图案密度
      vec2 uv = ((vUv * uRes - 0.5 * uRes) / min(uRes.x, uRes.y)) * uZoom;
      float r = length(uv);
      float ang = atan(uv.y, uv.x);

      // 极坐标镜面折叠：角度按瓣数折成 [0, π/seg]
      float t  = (ang + uRot) * uSeg / 6.2831853;
      float ft = abs(fract(t) * 2.0 - 1.0);
      float a  = ft * 3.14159265 / uSeg;
      vec2 fp  = vec2(cos(a), sin(a)) * r;

      // —— 图案源 A：域扭曲 fbm 云海 ——
      vec2 wp    = fp * 2.3 + vec2(uTime * 0.06, -uTime * 0.045);
      float warp = fbm(wp + vec2(uTime * 0.10));
      float cloud = fbm(wp + warp * 1.6 + vec2(0.0, uTime * 0.05));

      // —— 图案源 B：几何线条（镜面接缝 + 同心环 + 网格） ——
      float seam    = 1.0 - smoothstep(0.0, 0.09, min(ft, 1.0 - ft));
      float rings   = pow(0.5 + 0.5 * sin(r * 20.0 - uTime * 0.8 + cloud * 5.0), 6.0);
      vec2  gp      = fp * 8.0;
      float lattice = pow(abs(sin(gp.x) * sin(gp.y)), 0.4);
      float lines   = clamp(rings * 0.9 + seam * 0.8 + lattice * 0.3, 0.0, 1.0);

      // —— 三档源切换：0 云海 / 1 线条 / 2 交融（uniform 连续过渡） ——
      float s    = clamp(uSrc, 0.0, 2.0);
      float pat  = mix(cloud, lines, clamp(s, 0.0, 1.0));
      float both = clamp(cloud * 0.55 + lines * 0.75, 0.0, 1.0);
      float v    = mix(pat, both, clamp(s - 1.0, 0.0, 1.0));

      // —— 三色映射 ——
      vec3 col = CBG;
      col = mix(col, CMID, smoothstep(0.22, 0.72, v));
      col = mix(col, CHI,  smoothstep(0.60, 0.97, v * v * 1.25));
      // 中心微光呼吸（同色系叠加，不引入第四色）
      col += CMID * exp(-r * r * 4.0) * 0.18 * (0.6 + 0.4 * sin(uTime * 0.7));
      // 径向收敛回背景
      col = mix(col, CBG, smoothstep(0.85, 1.5, r) * 0.55);
      // 暗角
      col *= 1.0 - 0.5 * pow(length(vUv - 0.5) * 1.18, 2.1);
      // 动态噪点
      float gseed = uStill > 0.5 ? 7.3 : uTime * 61.7;
      col += (hash(vUv * uRes * 0.73 + gseed) - 0.5) * 0.045;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

// ---------- 交互：拖拽转动（带惯性）、滚轮缩放 ----------
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, t: performance.now() };
  S.rotV = 0;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const now = performance.now();
  const dx = e.clientX - drag.x;
  const dt = Math.max((now - drag.t) / 1000, 0.008);
  S.rot += dx * 0.0055;
  const instV = (dx / dt) * 0.0055;
  S.rotV = 0.65 * S.rotV + 0.35 * clamp(instV, -14, 14);
  drag = { x: e.clientX, t: now };
});
const endDrag = () => { drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  S.zoomT = clamp(S.zoomT * Math.exp(e.deltaY * 0.0012), 0.55, 3.2);
}, { passive: false });

// ---------- 控制条 ----------
const segEl = document.getElementById('seg');
const segVal = document.getElementById('segVal');
const spdEl = document.getElementById('spd');
const spdVal = document.getElementById('spdVal');
segEl.addEventListener('input', () => { S.segT = +segEl.value; segVal.textContent = segEl.value; });
spdEl.addEventListener('input', () => { S.spdT = (+spdEl.value / 100) * 0.9; spdVal.textContent = spdEl.value; });
if (reduceMotion) { spdEl.value = '0'; spdVal.textContent = '0'; }
document.querySelectorAll('.src-group button').forEach((b) => {
  b.addEventListener('click', () => {
    S.srcT = +b.dataset.src;
    document.querySelectorAll('.src-group button').forEach((x) =>
      x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  });
});

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  uniforms.uRes.value.set(innerWidth, innerHeight);
});

// ---------- 主循环：阻尼 easing（无 linear） ----------
const clock = new THREE.Clock();
let frames = 0, revealed = false;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);

  // 帧率无关的阻尼系数：目标→实际平滑逼近
  const d = 1 - Math.pow(0.002, dt);
  S.seg  += (S.segT  - S.seg)  * d;
  S.spd  += (S.spdT  - S.spd)  * d;
  S.zoom += (S.zoomT - S.zoom) * d;
  S.src  += (S.srcT  - S.src)  * d;

  // 拖拽惯性：松手后角速度指数衰减
  if (!drag) {
    S.rot += S.rotV * dt;
    S.rotV *= Math.pow(0.03, dt);
    if (Math.abs(S.rotV) < 0.0004) S.rotV = 0;
  }
  S.phase += S.spd * dt;

  uniforms.uTime.value += dt;
  uniforms.uSeg.value = S.seg;
  uniforms.uSpd.value = S.spd;
  uniforms.uRot.value = S.rot + S.phase;
  uniforms.uZoom.value = S.zoom;
  uniforms.uSrc.value = S.src;

  renderer.render(scene, camera);

  if (!revealed && ++frames >= 5) {
    revealed = true;
    loader.classList.add('done');
    document.querySelectorAll('[data-intro]').forEach((el) => el.classList.add('is-in'));
  }
}
tick();
