/* =====================================================================
 * flame-3d · main.js — 程序化火焰（火焰舌 shader + 上升火星粒子 + 热浪扭曲）
 *
 * 只学了游戏/影视级程序化火焰的手法（FBM 火舌、域扭曲、粒子火星），
 * 噪声、包络、配色映射、粒子系统全部原创手写。
 * Three.js (MIT, three@0.183.0) 仅作 WebGL 载体（全屏 quad + Points）。
 * ===================================================================== */

import * as THREE from 'three';

/* ---------------- 全页限定三色 ---------------- */
/* 全页限定三色：纯黑 #0a0a0a / 火焰橙 #ff6b1a / 炽黄 #ffc53d
   （shader 内用 sRGB 直值 Vector3，避免 THREE.Color 的线性转换） */

/* ---------------- 火焰形态三档 ---------------- */
const MODES = {
  bonfire: { // 篝火：宽而烈，火舌蹿得高
    width: 0.34, height: 0.60, flicker: 0.65, turb: 1.20, seed: 0.0
  },
  torch: { // 火炬：高细直，稳
    width: 0.18, height: 0.68, flicker: 0.30, turb: 0.70, seed: 3.7
  },
  hearth: { // 炉火：圆钝矮，暖
    width: 0.40, height: 0.36, flicker: 0.18, turb: 0.55, seed: 7.9
  }
};

const state = {
  power: 0.65,            // 火力滑杆 0..1
  mode: 'bonfire',       // 篝火 / 火炬 / 炉火
  sparks: true,          // 火星开关
  cur: Object.assign({}, MODES.bonfire), // 当前形态（指数趋近目标）
  t: 0
};

/* ---------------- 渲染器 / 场景 ---------------- */
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

/* ---------------- 火焰：全屏 quad + fragment shader ---------------- */
const flameUniforms = {
  uTime:    { value: 0 },
  uAspect:  { value: window.innerWidth / window.innerHeight },
  uWidth:   { value: state.cur.width },
  uHeight:  { value: state.cur.height },
  uFlicker: { value: state.cur.flicker },
  uTurb:    { value: state.cur.turb },
  uSeed:    { value: state.cur.seed },
  uPower:   { value: state.power },
  uGlow:    { value: 1.0 },  // 入场渐入
  /* 直接用 sRGB 数值（THREE.Color(hex) 会被转线性，数字构造则不会；shader 全程 sRGB） */
  uColFlame:{ value: new THREE.Vector3(1.0, 0.42, 0.10) },
  uColGlow: { value: new THREE.Vector3(1.0, 0.77, 0.24) }
};

const flameMat = new THREE.ShaderMaterial({
  uniforms: flameUniforms,
  depthWrite: false,
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime, uAspect, uWidth, uHeight, uFlicker, uTurb, uSeed, uPower, uGlow;
    uniform vec3 uColFlame, uColGlow;

    /* ---- 原创 value-noise FBM ---- */
    float hash(vec2 p){
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float vnoise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.y), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, amp = 0.5;
      mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
      for(int i = 0; i < 5; i++){
        v += amp * vnoise(p);
        p = rot * p;
        amp *= 0.5;
      }
      return v;
    }

    void main(){
      vec2 p = vec2(vUv.x * uAspect, vUv.y);
      p.y -= 0.10; /* 火焰原点上移：根部坐在控制面板后，主体在面板上方 */

      /* 火焰原点：画面底部中央 */
      float cx = uAspect * 0.5;
      float t = uTime;

      /* 摆动：火舌随高度摆幅加大（微风感），高度平方加权 */
      float yy = clamp(p.y / max(uHeight, 1e-3), 0.0, 1.2);
      float sway = sin(t * 1.6 + uSeed) * 0.035
                 + sin(t * 3.3 + p.y * 7.0 + uSeed * 1.7) * 0.05;
      float x = p.x - cx - sway * yy * yy;

      /* 噪声域：向上流动 + 横向域扭曲（火舌撕裂感） */
      float rise = t * (1.35 + uFlicker * 1.0);
      vec2 q = vec2(x * 2.4 / max(uWidth, 1e-3) + uSeed * 1.3, p.y * 4.2 - rise);
      float warp = fbm(q * 0.5 + vec2(0.0, -rise * 0.35)) - 0.5;
      q.x += warp * (1.6 + uTurb * 1.2) * yy;
      float n = fbm(q);

      /* 火舌撕裂：噪声减去随高度增长的梯度，顶部自然尖灭 */
      /* 火舌撕裂：噪声减去随高度增长的梯度；+0.10 基线补偿实测 n 均值偏低 */
      float grad = yy * (0.30 - 0.08 * uPower);
      float flame = n + 0.10 - grad;

      /* 横向包络：底宽顶尖（火舌形） */
      float halfw = uWidth * (1.0 - 0.72 * yy);
      float lat = 1.0 - smoothstep(halfw * 0.22, halfw, abs(x));

      /* 纵向包络：贴底起燃、顶部消散 */
      float base = smoothstep(0.0, 0.05, p.y) * (1.0 - smoothstep(0.70, 1.05, yy));

      /* 闪烁：整体呼吸 + 高频抖 */
      float breathe = 1.0 + sin(t * 2.3 + uSeed) * 0.06;
      float fl = 1.0 + uFlicker * (fbm(vec2(t * 2.8, uSeed)) - 0.5) * 0.6;

      float body = flame * lat * base * fl * breathe;
      float d = smoothstep(0.10, 0.75, body + 0.02);

      /* 温度色（sRGB 直算）：暗橙根部 -> 火焰橙 -> 炽黄舌尖 */
      vec3 dark = uColFlame * 0.45;
      vec3 col = mix(dark, uColFlame, smoothstep(0.03, 0.55, d));
      col = mix(col, uColGlow, smoothstep(0.62, 0.97, d));

      /* 核心炽核：火舌内部最亮处加亮（用火焰橙加亮，保持 R>G>B 的橙色倾向） */
      col += uColFlame * pow(d, 5.0) * 0.22;
      col = min(col, vec3(1.05, 0.85, 0.45));

      /* 热浪扭曲辉光：火焰上方低 alpha 的上升波纹（纯热空气感） */
      float heatBand = smoothstep(uHeight * 0.85, uHeight * 1.15, p.y) *
                       (1.0 - smoothstep(uHeight * 1.35, uHeight * 1.9, p.y));
      float heatWave = fbm(vec2(p.x * 10.0 + sway * 5.0, p.y * 5.5 - t * 2.8)) - 0.5;
      float heat = heatBand * smoothstep(0.06, 0.42, abs(heatWave)) *
                   (1.0 - smoothstep(0.0, uWidth * 1.6, abs(x))) * 0.14 * uPower;

      /* 底部燃料辉光：贴底的暗橙光晕 */
      float ground = exp(-p.y * 16.0) * exp(-abs(x) * 6.0) * 0.5 * uPower;

      vec3 finalCol = col * (0.25 + 0.60 * d) + uColFlame * (heat + ground * 0.55);
      float alpha = clamp(d + heat * 0.6 + ground * 0.45, 0.0, 1.0) * uGlow;
      if (alpha < 0.004) discard;
      gl_FragColor = vec4(finalCol, alpha);
    }
  `,
  transparent: true
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), flameMat));

/* ---------------- 火星：上升粒子 ---------------- */
const MAX_SPARKS = 420;
const sparkGeo = new THREE.BufferGeometry();
const sPos = new Float32Array(MAX_SPARKS * 3);
const sMeta = new Float32Array(MAX_SPARKS * 4); // x0, life, maxLife, speed
const sCol = new Float32Array(MAX_SPARKS * 3);

const sparkUniforms = {
  uPixelRatio: { value: renderer.getPixelRatio() }
};
const sparkMat = new THREE.ShaderMaterial({
  uniforms: sparkUniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: `
    attribute vec4 aMeta;
    attribute vec3 aCol;
    uniform float uPixelRatio;
    varying float vFade;
    varying vec3 vCol;
    void main(){
      vCol = aCol;
      float life = aMeta.y / max(aMeta.z, 1e-3);
      vFade = (1.0 - life) * (1.0 - life);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float size = mix(2.2, 5.2, vFade) * uPixelRatio;
      gl_PointSize = size;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    varying float vFade;
    varying vec3 vCol;
    void main(){
      vec2 c = gl_PointCoord - 0.5;
      float m = smoothstep(0.5, 0.06, length(c));
      if (m < 0.01) discard;
      vec3 srgb = vCol * (0.6 + 0.9 * vFade);
      gl_FragColor = vec4(srgb, m * vFade);
    }
  `
});
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
sparkGeo.setAttribute('aMeta', new THREE.BufferAttribute(sMeta, 4));
sparkGeo.setAttribute('aCol', new THREE.BufferAttribute(sCol, 3));
const sparks = new THREE.Points(sparkGeo, sparkMat);
sparks.frustumCulled = false;
scene.add(sparks);

const flameCol = new THREE.Color(1.0, 0.42, 0.10); // sRGB 直值，不经颜色管理转换
const glowCol = new THREE.Color(1.0, 0.77, 0.24);
const tmpCol = new THREE.Color();

/* 在火焰舌范围内复活一颗火星（NDC 坐标：x∈[-1,1], y∈[-1,1]） */
function respawnSpark(i, aspect){
  const mode = state.cur;
  const wN = mode.width * aspect / 1.6; // 与 shader 侧同归一化
  const x0 = (Math.random() - 0.5) * wN * (0.8 + Math.random() * 0.5);
  sMeta[i * 4]     = x0;
  sMeta[i * 4 + 1] = 0;                              // life
  sMeta[i * 4 + 2] = 0.9 + Math.random() * 1.8;       // maxLife
  sMeta[i * 4 + 3] = 0.22 + Math.random() * 0.5;      // 上升速度（vUv/s）
  sPos[i * 3]     = (x0 / (aspect * 0.5));            // vUv.x = aspect/2 + x0 -> ndc
  sPos[i * 3 + 1] = -1 + (0.11 + Math.random() * 0.06) * 2; // 与火焰原点同上移
  sPos[i * 3 + 2] = 0;
  /* 颜色：橙 -> 炽黄，出生越随机越偏黄 */
  tmpCol.copy(flameCol).lerp(glowCol, Math.random() * 0.75);
  sCol[i * 3] = tmpCol.r; sCol[i * 3 + 1] = tmpCol.g; sCol[i * 3 + 2] = tmpCol.b;
}

/* ---------------- 交互：控制面板 ---------------- */
const $ = (id) => document.getElementById(id);
const powerRange = $('power'), modeBtns = Array.from(document.querySelectorAll('.mode-btn')), sparkToggle = $('sparks');

powerRange.addEventListener('input', (e) => {
  state.power = parseInt(e.target.value, 10) / 100;
  $('power-val').textContent = e.target.value + '%';
});

modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    state.mode = btn.dataset.mode;
    modeBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });
});

sparkToggle.addEventListener('change', (e) => {
  state.sparks = e.target.checked;
  $('sparks-label').textContent = state.sparks ? '开' : '关';
  sparks.visible = state.sparks;
});

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
let firstFrames = 0;

function tick(){
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  state.t += dt;
  const t = state.t;

  /* 形态参数指数趋近目标（切换时无跳变） */
  const target = MODES[state.mode];
  const k = 1 - Math.exp(-dt * 3.2);
  for (const key of ['width', 'height', 'flicker', 'turb', 'seed']) {
    state.cur[key] += (target[key] - state.cur[key]) * k;
  }
  flameUniforms.uTime.value = t;
  const aspectNow = window.innerWidth / window.innerHeight;
  /* 火焰宽度按 aspect 归一化（以桌面 1.6 为基准），移动端视觉宽度一致 */
  flameUniforms.uWidth.value = state.cur.width * aspectNow / 1.6;
  flameUniforms.uHeight.value = state.cur.height * (0.5 + 0.8 * state.power);
  flameUniforms.uFlicker.value = state.cur.flicker;
  flameUniforms.uTurb.value = state.cur.turb;
  flameUniforms.uSeed.value = state.cur.seed;
  flameUniforms.uPower.value = state.power;
  /* 入场：火焰 1.2s 渐入（指数，物理感） */
  flameUniforms.uGlow.value = 1 - Math.exp(-t * 2.4);

  /* 火星更新 */
  if (state.sparks) {
    const aspect = window.innerWidth / window.innerHeight;
    const activeCount = Math.floor(60 + 360 * state.power); // 火力联动粒子数
    for (let i = 0; i < activeCount; i++) {
      const o = i * 4;
      sMeta[o + 1] += dt;
      if (sMeta[o + 1] >= sMeta[o + 2]) { respawnSpark(i, aspect); continue; }
      const life = sMeta[o + 1] / sMeta[o + 2];
      const drift = Math.sin(t * 2.2 + i * 1.7) * 0.10 * life * (aspect / 1.6); // 上升越飘，同归一化
      sPos[i * 3]     = (sMeta[o] + drift) / (aspect * 0.5);
      sPos[i * 3 + 1] += dt * sMeta[o + 3] * (1.0 + state.power * 0.8) * 2.0; // vUv->ndc ×2
      /* 火星冷却：黄 -> 橙 -> 暗 */
      const cool = Math.pow(1 - life, 1.6);
      tmpCol.copy(flameCol).lerp(glowCol, cool * 0.9).multiplyScalar(0.35 + cool * 0.85);
      sCol[i * 3] = tmpCol.r; sCol[i * 3 + 1] = tmpCol.g; sCol[i * 3 + 2] = tmpCol.b;
    }
    /* 其余粒子藏到屏幕下 */
    for (let i = activeCount; i < MAX_SPARKS; i++) { sPos[i * 3 + 1] = -10; }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkGeo.attributes.aMeta.needsUpdate = true;
    sparkGeo.attributes.aCol.needsUpdate = true;
    sparkGeo.setDrawRange(0, activeCount);
  }

  renderer.render(scene, cam);

  /* 加载态：首帧出来后必进 done */
  if (++firstFrames === 4) {
    document.documentElement.classList.add('done');
  }
}
tick();

/* 双重兜底：load + 3.5s */
window.addEventListener('load', () => {
  setTimeout(() => document.documentElement.classList.add('done'), 400);
});
setTimeout(() => document.documentElement.classList.add('done'), 3500);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  flameUniforms.uAspect.value = window.innerWidth / window.innerHeight;
  sparkUniforms.uPixelRatio.value = renderer.getPixelRatio();
});
