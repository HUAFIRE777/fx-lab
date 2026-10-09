/* smoke-ink-3d · src/main.js
 * 行为层：JS 门控 → 加载态 → Three.js 全屏 shader 烟雾
 * 手法借鉴：茶/香氛品牌 hero 的"流体烟雾着色器"——FBM 噪声驱动、鼠标搅动、底部升起。
 * 代码全部原创实现（value-noise FBM + domain warp，无第三方 shader 源码）。
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
window.addEventListener('load', () => setTimeout(markReady, 400));
setTimeout(markReady, 3500); // 兜底：load 迟迟不来也必须进完成态

/* ---------- 2. 状态 ---------- */
const INKS = {
  '#7dd3fc': new THREE.Color('#7dd3fc'), // 冰蓝
  '#f472b6': new THREE.Color('#f472b6'), // 绯
  '#a3e635': new THREE.Color('#a3e635'), // 苔绿
};
const inkCur = INKS['#7dd3fc'].clone();   // 当前渲染色（逐帧指数趋近目标）
const inkTgt = INKS['#7dd3fc'].clone();   // 目标色

let diffuse = 1.0;
const stir = new THREE.Vector2(0, 0);     // 搅动速度（鼠标速度向量，指数衰减）
const mouseUV = new THREE.Vector2(0.5, 0.5);
const clickUV = new THREE.Vector2(0.5, 0.5);
let impulse = 0;                          // 点击冲击，0..1 指数衰减
let lastPX = null, lastPY = null, lastPT = 0;

/* ---------- 3. 指针：速度向量搅动 ---------- */
const stage = $('#stage');
function onPoint(x, y, t) {
  const nx = x / window.innerWidth;
  const ny = 1 - y / window.innerHeight;
  if (lastPX !== null && t - lastPT > 0) {
    const dt = Math.max(8, t - lastPT) / 1000;
    const vx = (nx - lastPX / window.innerWidth) / dt;
    const vy = (ny - (1 - lastPY / window.innerHeight)) / dt;
    stir.x += vx * 0.16;
    stir.y += vy * 0.16;
    const m = stir.length();
    if (m > 0.9) stir.multiplyScalar(0.9 / m); // 限幅，防炸
  }
  mouseUV.set(nx, ny);
  lastPX = x; lastPY = y; lastPT = t;
}
window.addEventListener('pointermove', (e) => onPoint(e.clientX, e.clientY, e.timeStamp), { passive: true });
window.addEventListener('pointerdown', (e) => {
  clickUV.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
  impulse = 1.0;                          // 点击激起涟漪
  onPoint(e.clientX, e.clientY, e.timeStamp);
}, { passive: true });

/* ---------- 4. 控制条 ---------- */
document.querySelectorAll('.chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((b) => b.classList.remove('on'));
    btn.classList.add('on');
    inkTgt.copy(INKS[btn.dataset.ink] || INKS['#7dd3fc']);
  });
});
const diffuseEl = $('#diffuse');
const diffuseVal = $('#diffuseVal');
diffuseEl.addEventListener('input', () => {
  diffuse = parseFloat(diffuseEl.value);
  diffuseVal.textContent = diffuse.toFixed(2);
});

/* ---------- 5. Three.js 全屏 shader 平面 ---------- */
const canvas = $('#ink');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  markReady(); // WebGL 不可用也必须进完成态
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  uTime:    { value: 0 },
  uRes:     { value: new THREE.Vector2(1, 1) },
  uMouse:   { value: mouseUV },
  uStir:    { value: stir },
  uInk:     { value: inkCur },
  uDiffuse: { value: diffuse },
  uClick:   { value: clickUV },
  uImpulse: { value: 0 },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uRes;
    uniform vec2 uMouse;
    uniform vec2 uStir;
    uniform vec3 uInk;
    uniform float uDiffuse;
    uniform vec2 uClick;
    uniform float uImpulse;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash(i), b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      mat2 r = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < 5; i++) {
        v += a * vnoise(p);
        p = r * p;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      vec2 asp = vec2(uRes.x / uRes.y, 1.0);
      vec2 p = uv * asp;
      float t = uTime * uDiffuse;

      // 缓缓升起：采样域随时间上移（等价于烟雾上升）
      vec2 flow = vec2(0.0, -t * 0.055);

      // 鼠标搅动：速度向量扰动采样域，离鼠标越近扰动越强
      vec2 dm = uMouse * asp - p;
      float prox = exp(-dot(dm, dm) * 2.6);
      vec2 warpOff = uStir * (0.30 + 1.6 * prox);

      // 点击涟漪：以点击点为中心的切向旋涡，随冲击衰减
      vec2 dc = uClick * asp - p;
      float dcl = length(dc) + 1e-4;
      float ripple = uImpulse * exp(-dcl * dcl * 2.4);
      vec2 tang = vec2(-dc.y, dc.x) / dcl * ripple * 1.1;

      vec2 q = p + flow + warpOff + tang;

      // domain warp：两次 FBM 扭曲采样域，造出翻卷感
      float w1 = fbm(q * 1.9 + vec2(0.0, t * 0.06));
      float w2 = fbm(q * 1.9 + vec2(5.2, 1.3) - vec2(0.0, t * 0.045));
      vec2 warped = q * 2.7 + vec2(w1, w2) * 2.1 + vec2(1.7, 9.2);
      float body = fbm(warped);                          // 烟主体
      float detail = fbm(warped * 2.1 - vec2(w2, w1));   // 丝缕细节
      float dens = body * 0.74 + detail * 0.26;

      // 纵向包络：底部浓、顶部淡（烟雾从底部升起）
      float prof = smoothstep(1.15, 0.16, uv.y + (w1 - 0.5) * 0.28);
      // 边缘消散
      float edge = smoothstep(0.74, 0.30, length((uv - 0.5) * asp));

      float smoke = smoothstep(0.36, 0.88, dens) * prof * edge;
      smoke = clamp(smoke + ripple * 0.55, 0.0, 1.0);

      vec3 bg = vec3(0.043, 0.055, 0.078); // #0b0e14
      // 墨色罩染 + 浓核微发光（仍是同一墨色，不引入第四色）
      vec3 col = mix(bg, uInk, smoke * 0.82);
      col += uInk * pow(smoke, 3.0) * 0.32;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

function resize() {
  const w = Math.max(1, Math.floor(window.innerWidth));
  const h = Math.max(1, Math.floor(window.innerHeight));
  renderer.setSize(w, h, false);
  uniforms.uRes.value.set(w, h);
}
window.addEventListener('resize', resize);
resize();

/* ---------- 6. 主循环：指数衰减 = 物理感 ---------- */
const clock = new THREE.Clock();
let frames = 0;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const k = 1 - Math.exp(-dt * 3.2);   // 指数趋近系数
  uniforms.uTime.value += dt * (reduced ? 0.15 : 1.0);
  uniforms.uDiffuse.value = diffuse;
  uniforms.uImpulse.value = impulse;
  inkCur.lerp(inkTgt, 1 - Math.exp(-dt * 4.0)); // 换色平滑过渡
  stir.multiplyScalar(Math.exp(-dt * 3.4));    // 搅动衰减
  impulse *= Math.exp(-dt * 2.2);              // 涟漪衰减
  renderer.render(scene, camera);
  if (++frames === 4) markReady();     // 首帧渲染出来即算"酝酿"完成
}
tick();
