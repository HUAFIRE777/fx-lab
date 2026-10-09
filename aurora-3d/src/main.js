/* aurora-3d · src/main.js
 * 行为层：JS 门控 → 加载态 → Three.js 全屏极光 shader（fbm 幕布 × 3 层 / 程序化星空 / 雪山剪影）
 * 滑杆（强度/流速）+ 地点预设（冰岛/挪威/阿拉斯加，仅调绿紫配比）→ 全部经指数平滑过渡
 * 手法借鉴：极地旅游/户外品牌极光 hero（大面积天空幕布 + 星空 + 山脊剪影）。代码全部原创实现。
 */
import * as THREE from 'three';

document.documentElement.classList.add('js');

const $ = (s) => document.querySelector(s);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. 加载态：保证完成态可达 ---------- */
let readyDone = false;
function markReady() {
  if (readyDone) return;
  readyDone = true;
  document.documentElement.classList.add('done');
}
let firstFrameAt = 0;
window.addEventListener('load', () => setTimeout(markReady, 450));
setTimeout(markReady, 3200); // 兜底
setTimeout(markReady, 5000); // 双兜底

/* ---------- 2. 着色器 ---------- */
const vertexShader = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime;      // 缩放后的秒
uniform vec2  uRes;       // 像素分辨率
uniform float uIntensity; // 极光强度 0..1（已平滑）
uniform float uMix;       // 绿紫配比 0..1，1=全绿（已平滑）

const vec3 NIGHT  = vec3(0.0078, 0.0235, 0.0902); // #020617
const vec3 GREEN  = vec3(0.2039, 0.8275, 0.6000); // #34d399
const vec3 VIOLET = vec3(0.6549, 0.5451, 0.9804); // #a78bfa

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vUv;
  float asp = uRes.x / max(uRes.y, 1.0);

  /* 呼吸：双正弦叠出不规则的慢呼吸 */
  float breath = 0.80 + 0.20 * sin(uTime * 0.42) * sin(uTime * 0.117 + 2.0);

  /* ---- 夜空底 ---- */
  vec3 col = mix(NIGHT * 1.25, NIGHT, smoothstep(0.0, 0.75, uv.y));
  col += VIOLET * 0.045 * (1.0 - smoothstep(0.0, 0.6, uv.y)); // 地平线微紫

  /* ---- 星空（程序化星点 + 微闪烁） ---- */
  vec2 sp = vec2(uv.x * asp, uv.y) * 70.0;
  vec2 cell = floor(sp), f = fract(sp);
  float h = hash21(cell);
  float star = 0.0;
  if (h > 0.978) {
    vec2 spos = vec2(hash21(cell + 7.1), hash21(cell + 3.7));
    float d = length(f - spos);
    float tw = 0.5 + 0.5 * sin(uTime * (1.5 + h * 3.0) + h * 40.0);
    star = smoothstep(0.13, 0.0, d) * (0.30 + 0.70 * tw) * smoothstep(0.30, 0.62, h);
  }
  float starMask = smoothstep(0.10, 0.30, uv.y);

  /* ---- 极光幕布：3 层 fbm 带状，缓慢舞动 ---- */
  vec3 aurora = vec3(0.0);
  float auroraSum = 0.0;
  vec3 hue = mix(VIOLET, GREEN, uMix);
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    float dir = (L == 1) ? -1.0 : 1.0;
    float base = 0.30 + 0.17 * fl;                                   // 幕布中心高度
    float sway = (fbm(vec2(uv.x * 1.4 + fl * 9.1, uTime * 0.05)) - 0.5) * 0.36;
    float yc = base + sway;
    float d = uv.y - yc;
    float sig = d > 0.0 ? 0.20 : 0.085;                              // 下缘更锐 → 辉光边
    float band = exp(-d * d / (2.0 * sig * sig));
    float rays = fbm(vec2(uv.x * 7.0 + fl * 17.3 + uTime * 0.03 * dir, uTime * 0.12));
    rays = pow(smoothstep(0.25, 0.88, rays), 1.4);                   // 纵向光柱条纹
    float cols = 0.35 + 0.65 * pow(smoothstep(0.15, 0.90,           // 垂幕列：打散横向整片
      fbm(vec2(uv.x * 3.2 + fl * 7.7 + uTime * 0.02 * dir, 1.7 + uTime * 0.03))), 1.1);
    float vfade = smoothstep(0.02, 0.24, uv.y) * (1.0 - smoothstep(0.84, 1.02, uv.y));
    float a = band * rays * cols * vfade;
    vec3 lcol = mix(VIOLET, GREEN, clamp(uMix + (fl - 1.0) * 0.12, 0.0, 1.0));
    float edge = exp(-pow((d + 0.05) / 0.030, 2.0));                 // 下缘辉光线
    aurora += lcol * (a * 2.10 + edge * rays * cols * vfade * 1.90);
    auroraSum += a;
  }
  aurora *= breath * uIntensity;

  col += star * starMask * mix(GREEN, VIOLET, 0.35) * 0.9 * (1.0 - clamp(auroraSum, 0.0, 1.0) * 0.85);
  col += aurora;

  /* ---- 雪山剪影（程序化山脊线，两层） ---- */
  float x = uv.x;
  float r1 = 0.155 + (fbm(vec2(x * 2.4, 3.7)) - 0.5) * 0.11 + (fbm(vec2(x * 8.0, 11.3)) - 0.5) * 0.036;
  float r2 = 0.105 + (fbm(vec2(x * 3.1 + 5.0, 8.2)) - 0.5) * 0.076 + (fbm(vec2(x * 9.5, 4.4)) - 0.5) * 0.024;
  float far  = 1.0 - smoothstep(r1 - 0.0025, r1 + 0.0025, uv.y);
  float near = 1.0 - smoothstep(r2 - 0.0025, r2 + 0.0025, uv.y);

  vec3 mtn = mix(col, NIGHT * 1.35 + VIOLET * 0.05, far);   // 远山：微紫剪影
  mtn = mix(mtn, NIGHT * 0.55, near);                        // 近山：更深
  float rim = exp(-pow((uv.y - r1) / 0.006, 2.0)) * far * (1.0 - near);
  mtn += hue * rim * 0.38 * (0.35 + 0.65 * uIntensity);      // 山脊雪线微光
  float refl = (1.0 - smoothstep(0.0, 0.17, r2 - uv.y)) * near;
  mtn += hue * refl * 0.11 * breath * uIntensity;            // 雪面反射极光
  col = mix(col, mtn, max(far, near));

  /* 柔和高光裁剪 + 抖动去色带 */
  col = col / (1.0 + col * 0.35);
  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ---------- 3. 渲染器 ---------- */
const wrap = $('#sky');
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
wrap.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const uniforms = {
  uTime:      { value: 0 },
  uRes:       { value: new THREE.Vector2(1, 1) },
  uIntensity: { value: 0.7 },
  uMix:       { value: 0.78 },
};
const material = new THREE.ShaderMaterial({
  uniforms, vertexShader, fragmentShader, depthTest: false, depthWrite: false,
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
}
window.addEventListener('resize', resize);
resize();

/* ---------- 4. 控制：滑杆 + 预设，全部指数平滑 ---------- */
const tgt = { i: 0.70, m: 0.78, s: 1.0 };
const cur = { i: 0.70, m: 0.78, s: 1.0 };
const smooth = (c, t, k, dt) => c + (t - c) * (1 - Math.exp(-dt * k));

const intInput = $('#intensity'), spdInput = $('#speed');
const intVal = $('#intVal'), spdVal = $('#spdVal');
intInput.addEventListener('input', () => {
  tgt.i = intInput.value / 100;
  intVal.textContent = intInput.value;
});
spdInput.addEventListener('input', () => {
  tgt.s = spdInput.value / 100;
  spdVal.textContent = (tgt.s).toFixed(1) + '×';
});
document.querySelectorAll('.preset').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.preset').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    tgt.m = parseFloat(btn.dataset.mix);
  });
});

/* ---------- 5. 主循环 ---------- */
let timeSec = 0;
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  cur.i = smooth(cur.i, tgt.i, 4.0, dt);
  cur.m = smooth(cur.m, tgt.m, 2.2, dt);
  cur.s = smooth(cur.s, tgt.s, 4.0, dt);

  const flow = reduced ? 0.05 : cur.s;
  timeSec += dt * flow;

  uniforms.uTime.value = timeSec;
  uniforms.uIntensity.value = cur.i;
  uniforms.uMix.value = cur.m;

  renderer.render(scene, camera);

  if (!firstFrameAt) firstFrameAt = now;
  if (!readyDone && now - firstFrameAt > 450) markReady();

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
