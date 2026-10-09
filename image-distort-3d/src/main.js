/* image-distort-3d · 主逻辑（原创实现）
 * 手法对标：Awwwards 作品集列表页 "hover → 图片 shader 置换转场"
 * 实现：双纹理 + simplex noise 位移 + RGB 分离；扭曲强度随鼠标速度
 */
import * as THREE from 'three';

/* ---------------- 作品数据（虚构） ---------------- */
const WORKS = [
  { name: '雾屿',   tag: '展览视觉', year: '2026' },
  { name: '陶土低语', tag: '品牌主视觉', year: '2026' },
  { name: '纸上潮汐', tag: '书籍装帧', year: '2025' },
  { name: '锈',     tag: '公共艺术', year: '2025' },
  { name: '静默剧场', tag: '舞台视觉', year: '2024' },
  { name: '麦浪方程', tag: '数据艺术', year: '2024' },
  { name: '归尘',   tag: '影像装置', year: '2024' },
];

/* ---------------- 种子随机 ---------------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- 程序化"作品图" ----------------
 * 6–8 张抽象图：双色渐变底 + 噪点颗粒 + 几何构图，每张不同 seed。
 * 严格三色系：米白 / 墨黑 / 赭石及其邻近明度。
 */
const PAL = {
  paper: '#F4F1EA', ink: '#1B1A17', ochre: '#B56B2B',
  ochreL: '#D49A63', inkL: '#4A4844', paperD: '#E7E2D6',
};

function makeArtwork(seed, w = 960, h = 720) {
  const rnd = mulberry32(seed * 7919 + 13);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');

  // 底：双色纵向渐变（严格三色内）
  const styles = [
    [PAL.paper, PAL.paperD], [PAL.paperD, PAL.paper], [PAL.ink, PAL.inkL],
    [PAL.paper, PAL.ochreL], [PAL.inkL, PAL.ink], [PAL.paperD, PAL.ochreL],
  ];
  const [c0, c1] = styles[seed % styles.length];
  const dark = c0 === PAL.ink || c0 === PAL.inkL;
  const grad = g.createLinearGradient(0, 0, w * (rnd() * 0.6 - 0.3), h);
  grad.addColorStop(0, c0); grad.addColorStop(1, c1);
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  const fg = dark ? PAL.paper : PAL.ink;
  const acc = dark ? PAL.ochreL : PAL.ochre;

  // 几何构图：每张 2–3 个形状
  const kind = seed % 4;
  g.globalAlpha = 0.92;
  if (kind === 0) {
    // 巨圆 + 弦线
    const cx = w * (0.3 + rnd() * 0.4), cy = h * (0.35 + rnd() * 0.3), r = h * (0.28 + rnd() * 0.2);
    g.strokeStyle = fg; g.lineWidth = 10;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    g.fillStyle = acc;
    g.beginPath(); g.arc(cx + r * 0.42, cy - r * 0.3, r * 0.22, 0, Math.PI * 2); g.fill();
    g.strokeStyle = acc; g.lineWidth = 3;
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(cx - r - 40, cy + i * 34);
      g.lineTo(cx + r + 40, cy + i * 34 - 60);
      g.stroke();
    }
  } else if (kind === 1) {
    // 斜切色块 + 圆点矩阵
    g.fillStyle = fg;
    g.beginPath();
    g.moveTo(0, h * (0.25 + rnd() * 0.2)); g.lineTo(w, h * (0.05 + rnd() * 0.2));
    g.lineTo(w, h * (0.55 + rnd() * 0.2)); g.lineTo(0, h * (0.75 + rnd() * 0.2));
    g.closePath(); g.fill();
    g.fillStyle = acc;
    for (let ix = 0; ix < 9; ix++) for (let iy = 0; iy < 6; iy++) {
      const rr = 3 + rnd() * 9;
      g.beginPath();
      g.arc(w * 0.08 + ix * w * 0.1, h * 0.1 + iy * h * 0.13, rr * (rnd() < 0.3 ? 0.4 : 1), 0, Math.PI * 2);
      g.fill();
    }
  } else if (kind === 2) {
    // 同心弧 + 竖条
    g.strokeStyle = fg; g.lineWidth = 7;
    const cx = w * 0.5, cy = h * 0.62;
    for (let i = 1; i <= 7; i++) {
      g.beginPath(); g.arc(cx, cy, i * h * 0.075, Math.PI, Math.PI * 2); g.stroke();
    }
    g.fillStyle = acc;
    for (let i = 0; i < 5; i++) {
      const bw = 18 + rnd() * 40;
      g.fillRect(w * 0.1 + i * w * 0.17, h * (0.1 + rnd() * 0.15), bw, h * 0.5);
    }
  } else {
    // 大色块留白 + 单线框
    g.fillStyle = fg;
    g.fillRect(w * (0.1 + rnd() * 0.2), h * (0.15 + rnd() * 0.15), w * 0.5, h * 0.55);
    g.strokeStyle = acc; g.lineWidth = 6;
    g.strokeRect(w * 0.18, h * 0.22, w * 0.5, h * 0.55);
    g.fillStyle = acc;
    g.beginPath(); g.arc(w * 0.72, h * 0.72, h * 0.09, 0, Math.PI * 2); g.fill();
    g.strokeStyle = fg; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, h * 0.86); g.lineTo(w, h * (0.78 + rnd() * 0.1)); g.stroke();
  }
  g.globalAlpha = 1;

  // 颗粒噪点
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const amt = dark ? 14 : 12;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * amt;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  return cv;
}

/* ---------------- 列表渲染 ---------------- */
const worksEl = document.getElementById('works');
const capIdx = document.getElementById('capIdx');
const capName = document.getElementById('capName');
const capTag = document.getElementById('capTag');
const capBar = document.getElementById('capBar');
WORKS.forEach((wk, i) => {
  const li = document.createElement('li');
  if (i === 0) li.className = 'on';
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.i = i;
  b.innerHTML = `<span class="idx">${String(i + 1).padStart(2, '0')}</span>` +
    `<span class="name">${wk.name}</span>` +
    `<span class="meta">${wk.year} · ${wk.tag}</span>`;
  li.appendChild(b);
  worksEl.appendChild(li);
});
const items = [...worksEl.querySelectorAll('li')];

function setActive(i) {
  items.forEach((li, k) => li.classList.toggle('on', k === i));
  capIdx.textContent = String(i + 1).padStart(2, '0');
  capName.textContent = WORKS[i].name;
  capTag.textContent = WORKS[i].tag;
  gsap.fromTo([capIdx, capName, capTag], { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.55, ease: 'expo.out', stagger: 0.05 });
  gsap.fromTo(capBar, { width: '0%' }, { width: ((i + 1) / WORKS.length * 100) + '%', duration: 0.7, ease: 'expo.out' });
}

/* ---------------- WebGL ---------------- */
const canvas = document.getElementById('gl');
const view = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  u_t0: { value: null },
  u_t1: { value: null },
  u_prog: { value: 0 },
  u_vel: { value: 0 },     // 鼠标速度归一化 0..1
  u_time: { value: 0 },
  u_aspect: { value: 4 / 3 },
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
    uniform sampler2D u_t0, u_t1;
    uniform float u_prog, u_vel, u_time, u_aspect;

    /* Ashima simplex noise 2D */
    vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
      vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0*fract(p*C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314*(a0*a0 + h*h);
      vec3 g;
      g.x = a0.x*x0.x + h.x*x0.y;
      g.yz = a0.yz*x12.xz + h.yz*x12.yw;
      return 130.0*dot(m, g);
    }

    /* cover 适配：纹理铺满画面 */
    vec2 coverUV(vec2 uv){
      float texAspect = 4.0/3.0;
      vec2 s = vec2(1.0);
      if(u_aspect > texAspect) s.y = texAspect/u_aspect;
      else s.x = u_aspect/texAspect;
      return (uv - 0.5)*s + 0.5;
    }

    vec3 sampleRGB(sampler2D t, vec2 uv, float shift){
      vec3 c;
      c.r = texture2D(t, uv + vec2(shift, 0.0)).r;
      c.g = texture2D(t, uv).g;
      c.b = texture2D(t, uv - vec2(shift, 0.0)).b;
      return c;
    }

    void main(){
      vec2 uv = coverUV(vUv);

      float wipe = u_prog;
      float n1 = snoise(uv*3.2 + vec2(u_time*0.12, -u_time*0.07))*0.5 + 0.5;
      float n2 = snoise(uv*6.5 - vec2(u_time*0.2, u_time*0.11))*0.5 + 0.5;

      /* 扭曲强度：基础呼吸 + 鼠标速度 + 转场峰值 */
      float surge = sin(3.14159*clamp(wipe,0.0,1.0));
      float amp = 0.018 + u_vel*0.22 + surge*0.24;

      vec2 dir = normalize(vec2(n2 - 0.5, n1 - 0.5) + vec2(0.0001));
      float d = (n1 - 0.5)*amp;
      vec2 uvA = uv + dir*d;
      vec2 uvB = uv - dir*d*0.8;

      /* RGB 分离量同样随速度/转场放大（钳制上限，避免高频噪点处出现彩虹伪色） */
      float shift = min(0.003 + u_vel*0.012 + surge*0.015, 0.03);
      vec3 c0 = sampleRGB(u_t0, uvA, shift);
      vec3 c1 = sampleRGB(u_t1, uvB, shift);

      /* 噪声擦除式混合 */
      float edge = wipe + (n2 - 0.5)*0.4;
      float m = smoothstep(0.32, 0.68, edge);
      vec3 col = mix(c0, c1, m);

      /* 边缘暗角压一下，防止位移露底 */
      float vig = 1.0 - smoothstep(0.45, 1.15, length((vUv-0.5)*vec2(1.0, u_aspect/1.3333333)));
      col *= mix(0.92, 1.0, vig);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

function resize() {
  const r = view.getBoundingClientRect();
  const w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
  renderer.setSize(w, h, false);
  uniforms.u_aspect.value = w / h;
}
new ResizeObserver(resize).observe(view);

/* ---------------- 鼠标速度 → 扭曲强度 ---------------- */
let lastX = null, lastY = null, lastT = 0, rawVel = 0;
addEventListener('pointermove', (e) => {
  const t = performance.now();
  if (lastX !== null && t > lastT) {
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    const speed = Math.hypot(dx, dy) / ((t - lastT) / 1000); // px/s
    rawVel = Math.min(1, speed / 2600);
  }
  lastX = e.clientX; lastY = e.clientY; lastT = t;
}, { passive: true });

/* ---------------- 转场 ---------------- */
let cur = 0, busy = false, textures = [];

function goTo(i) {
  if (i === cur || busy) return;
  if (!textures[i] || !textures[cur]) return; // 纹理未就绪时拒绝转场（加载态保护）
  busy = true;
  setActive(i);
  uniforms.u_t1.value = textures[i];
  gsap.to(uniforms.u_prog, {
    value: 1, duration: 1.15, ease: 'expo.inOut',
    onComplete() {
      uniforms.u_t0.value = textures[i];
      uniforms.u_prog.value = 0;
      cur = i; busy = false;
    },
  });
}

worksEl.addEventListener('pointerover', (e) => {
  const b = e.target.closest('button');
  if (b) goTo(+b.dataset.i);
});
worksEl.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) goTo(+b.dataset.i); // 移动端点按
});
worksEl.addEventListener('focusin', (e) => {
  const b = e.target.closest('button');
  if (b) goTo(+b.dataset.i);
});

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
let fpsAcc = 0, fpsN = 0, fpsLast = performance.now();
const fpsEl = document.getElementById('fps');
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  uniforms.u_time.value += dt;
  // 速度平滑衰减：物理感的惯性
  const target = rawVel;
  uniforms.u_vel.value += (target - uniforms.u_vel.value) * (1 - Math.exp(-dt * 6));
  rawVel *= Math.exp(-dt * 2.2);
  renderer.render(scene, camera);
  fpsAcc += dt; fpsN++;
  const now = performance.now();
  if (now - fpsLast > 800) {
    fpsEl.textContent = Math.round(fpsN / fpsAcc) + ' FPS';
    fpsAcc = 0; fpsN = 0; fpsLast = now;
  }
}

/* ---------------- 加载态：分块生成纹理 ---------------- */
const loadBar = document.getElementById('loadBar');
const loadTxt = document.getElementById('loadTxt');
const phrases = ['正在研磨颜料 …', '正在铺开纸面 …', '正在撒下噪点 …', '正在校准赭石 …'];

function buildTextures(i = 0) {
  if (i < WORKS.length) {
    const cv = makeArtwork(i);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    textures.push(tex);
    const p = (i + 1) / WORKS.length;
    loadBar.style.width = (p * 100).toFixed(0) + '%';
    loadTxt.textContent = phrases[Math.min(i, phrases.length - 1)];
    setTimeout(() => buildTextures(i + 1), 30);
    return;
  }
  // 首帧
  uniforms.u_t0.value = textures[0];
  uniforms.u_t1.value = textures[0];
  resize();
  renderer.render(scene, camera);
  tick();
  setActive(0);
  document.documentElement.classList.add('done');
  window.__distortReady = true;
}

buildTextures();
