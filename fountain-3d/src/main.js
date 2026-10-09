import * as THREE from 'three';

/* ============================================================
 * fountain-3d · 水乐喷泉
 * 音乐喷泉：程序化节奏音序器驱动水柱起舞，灯光联动编排。
 * 声音由 WebAudio 实时合成（无音频文件、零外部请求）；
 * 未开声音时走静默走带，视觉照常随节拍起舞。
 * ============================================================ */

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* ---------------- 渲染器 / 场景 ---------------- */
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040a15);
scene.fog = new THREE.FogExp2(0x040a15, 0.02);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);
const CAM_R = 17.5, CAM_H = 5.0;
camera.position.set(0, CAM_H, CAM_R);

const CYAN = new THREE.Color(0x3fe3ff);
const VIOLET = new THREE.Color(0x8a5cff);
const WHITE = new THREE.Color(0xeaf6ff);

/* ---------------- 曲目：三档节奏 ----------------
 * 通道：0 kick=中央水炮 / 1 bass=内圈 / 2 lead=中圈 / 3 hat=外圈
 * bass/lead 数组：0=休止，否则=相对根音的半音偏移 */
const TRACKS = [
  {
    name: '夜潮', bpm: 92, root: 55.0, // A1
    kick: [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
    bass: [0,0,0,3, 0,0,5,0, 0,0,0,0, 7,0,3,0],
    lead: [0,0,12,0, 0,0,0,0, 15,0,0,0, 0,0,19,0],
    hat:  [0,0,1,0, 0,1,0,0, 1,0,0,1, 0,0,1,0],
  },
  {
    name: '涌泉', bpm: 120, root: 65.41, // C2
    kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,1],
    bass: [0,0,7,0, 0,5,0,3, 0,0,7,0, 10,0,5,0],
    lead: [12,0,15,0, 19,0,15,0, 12,0,24,0, 19,0,15,12],
    hat:  [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,0,1],
  },
  {
    name: '霓虹', bpm: 138, root: 49.0, // G1
    kick: [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,1,0,0],
    bass: [0,3,0,5, 0,3,0,7, 0,3,0,5, 10,0,7,5],
    lead: [12,15,19,24, 19,15,12,15, 19,24,27,24, 19,15,12,0],
    hat:  [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,0,1,1],
  },
];

/* ---------------- 走带 / 包络 ---------------- */
let trackIdx = 1;
let transport = 0;      // 走带秒数（视觉与音频共用同一时钟）
let stepCount = 0;
let nextStepT = 0;
const lastHit = [-100, -100, -100, -100]; // 各通道上次触发时刻
let burstT = -100;      // 点击爆发的时刻

const stepDur = () => 60 / TRACKS[trackIdx].bpm / 4;

function fireStep(s) {
  const p = TRACKS[trackIdx];
  const i = s % 16;
  if (p.kick[i]) { lastHit[0] = transport; if (soundOn) sKick(); }
  if (p.bass[i]) { lastHit[1] = transport; if (soundOn) sBass(p.bass[i]); }
  if (p.lead[i]) { lastHit[2] = transport; if (soundOn) sLead(p.lead[i]); }
  if (p.hat[i])  { lastHit[3] = transport; if (soundOn) sHat(); }
}

function advanceTransport(dt) {
  transport += dt;
  const sd = stepDur();
  let guard = 0;
  while (transport >= nextStepT && guard++ < 64) {
    fireStep(stepCount);
    stepCount++;
    nextStepT += sd;
  }
}

/* ---------------- WebAudio 合成节拍 ---------------- */
let audio = null;
let soundOn = false;

function ensureAudio() {
  if (audio) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0.42;
  master.connect(ctx.destination);
  const nb = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  audio = { ctx, master, noise: nb };
}

function sKick() {
  const { ctx, master } = audio; const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  g.gain.setValueAtTime(0.85, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.32);
}

function sBass(semi) {
  const { ctx, master } = audio; const t = ctx.currentTime;
  const f = TRACKS[trackIdx].root * Math.pow(2, semi / 12);
  const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'sawtooth'; o.frequency.value = f;
  fl.type = 'lowpass'; fl.frequency.value = 320; fl.Q.value = 4;
  g.gain.setValueAtTime(0.34, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
  o.connect(fl); fl.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.4);
}

function sLead(semi) {
  const { ctx, master } = audio; const t = ctx.currentTime;
  const f = 440 * Math.pow(2, semi / 12);
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = f;
  g.gain.setValueAtTime(0.16, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.55);
}

function sHat() {
  const { ctx, master, noise } = audio; const t = ctx.currentTime;
  const s = ctx.createBufferSource(); s.buffer = noise;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.14, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  s.connect(hp); hp.connect(g); g.connect(master);
  s.start(t); s.stop(t + 0.08);
}

/* ---------------- 星空 ---------------- */
{
  const N = 420, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.random() * Math.PI * 0.42 + 0.06;
    const r = 150;
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph) * 0.9 + 4;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    color: 0x9fc8e8, size: 1.4, sizeAttenuation: false,
    transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const stars = new THREE.Points(g, m);
  stars.frustumCulled = false;
  scene.add(stars);
}

/* ---------------- 地面 / 池体 ---------------- */
const WATER_Y = 0;
{
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(70, 48),
    new THREE.MeshBasicMaterial({ color: 0x02060c })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.1;
  scene.add(ground);
}
{
  const basin = new THREE.Mesh(
    new THREE.CylinderGeometry(7.5, 7.8, 1.1, 72),
    new THREE.MeshStandardMaterial({ color: 0x0a1626, roughness: 0.75, metalness: 0.25 })
  );
  basin.position.y = -0.55;
  scene.add(basin);
}
const rim = new THREE.Mesh(
  new THREE.TorusGeometry(7.5, 0.09, 12, 128),
  new THREE.MeshBasicMaterial({ color: CYAN.clone() })
);
rim.rotation.x = Math.PI / 2;
rim.position.y = 0.03;
scene.add(rim);

/* ---------------- 水面（涟漪 + 灯光倒影 shader） ---------------- */
const waterUniforms = {
  uTime: { value: 0 },
  uBeat: { value: 0 },
  uBurst: { value: -100 },
  uColA: { value: CYAN.clone() },
  uColB: { value: VIOLET.clone() },
};
{
  const g = new THREE.PlaneGeometry(15.2, 15.2, 1, 1);
  const m = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    vertexShader: `
      varying vec2 vP;
      void main(){
        vP = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec2 vP;
      uniform float uTime, uBeat, uBurst;
      uniform vec3 uColA, uColB;
      void main(){
        float r = length(vP);
        vec3 deep = vec3(0.012, 0.045, 0.090);
        vec3 col = deep;
        // 同心涟漪
        float rip = sin(r * 26.0 - uTime * 2.4) * 0.5 + 0.5;
        rip *= exp(-r * 2.2);
        col += mix(uColA, uColB, 0.4) * rip * 0.055 * (1.0 + uBeat * 2.2);
        // 旋转光弧：水下灯的倒影
        float ang = atan(vP.y, vP.x);
        float arc = exp(-pow(sin(ang * 3.0 + uTime * 0.35) * 2.0, 2.0));
        arc *= exp(-pow((r - 0.60) * 4.0, 2.0));
        col += mix(uColA, uColB, 0.65) * arc * (0.10 + 0.30 * uBeat);
        float arc2 = exp(-pow(sin(ang * 2.0 - uTime * 0.22 + 1.7) * 2.0, 2.0));
        arc2 *= exp(-pow((r - 0.86) * 5.0, 2.0));
        col += uColB * arc2 * 0.09;
        // 点击爆发的扩散环
        float bt = uTime - uBurst;
        if (bt < 3.0 && bt >= 0.0) {
          float rr = bt * 0.55;
          float ring = exp(-pow((r - rr) * 9.0, 2.0)) * exp(-bt * 1.6);
          col += vec3(0.65, 0.90, 1.0) * ring * 0.6;
        }
        // 中央泡沫随节拍呼吸
        float foam = exp(-r * 9.0) * (0.25 + 0.55 * uBeat);
        col += mix(uColA, vec3(1.0), 0.4) * foam * 0.13;
        // 边缘没入夜色
        col = mix(col, deep * 0.35, smoothstep(0.84, 1.0, r));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const water = new THREE.Mesh(g, m);
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER_Y;
  scene.add(water);
  var waterMesh = water;
}

/* ---------------- 喷嘴布局 ---------------- */
const RINGS = [
  { r: 0,    n: 1,  chan: 0 },  // 中央水炮
  { r: 1.7,  n: 8,  chan: 1 },  // 内圈
  { r: 3.1,  n: 12, chan: 2 },  // 中圈
  { r: 4.5,  n: 16, chan: 3 },  // 外圈
];
const nozzles = [];
RINGS.forEach((ring, ri) => {
  for (let i = 0; i < ring.n; i++) {
    const a = (i / ring.n) * Math.PI * 2 + ri * 0.35;
    nozzles.push({
      x: Math.cos(a) * ring.r,
      z: Math.sin(a) * ring.r,
      chan: ring.chan,
    });
  }
});

// 喷嘴金属座
{
  const geo = new THREE.CylinderGeometry(0.09, 0.13, 0.34, 12);
  const mat = new THREE.MeshStandardMaterial({ color: 0x14202f, roughness: 0.35, metalness: 0.85 });
  nozzles.forEach((nz) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(nz.x, 0.17, nz.z);
    scene.add(m);
  });
}

// 水下灯环（随灯光模式变色）
const glowRings = [];
RINGS.forEach((ring, ri) => {
  if (ring.r === 0) return;
  const t = new THREE.Mesh(
    new THREE.TorusGeometry(ring.r, 0.055, 8, 72),
    new THREE.MeshBasicMaterial({ color: CYAN.clone(), transparent: true, opacity: 0.9 })
  );
  t.rotation.x = Math.PI / 2;
  t.position.y = -0.14;
  scene.add(t);
  glowRings.push(t);
});

// 点光源：随节拍呼吸
const plA = new THREE.PointLight(0x3fe3ff, 26, 34, 1.8); plA.position.set(0, 2.2, 0);
const plB = new THREE.PointLight(0x8a5cff, 18, 34, 1.8); plB.position.set(4.5, 1.2, 3.2);
const plC = new THREE.PointLight(0x1a5cff, 12, 44, 1.8); plC.position.set(-5.5, 2.6, -4.5);
scene.add(plA, plB, plC);

/* ---------------- 水柱粒子（GPU 驱动） ---------------- */
const jetUniforms = {
  uTime: { value: 0 },
  uH0: { value: 0.3 }, uH1: { value: 0.3 }, uH2: { value: 0.3 }, uH3: { value: 0.3 },
  uColA: { value: CYAN.clone() },
  uColB: { value: VIOLET.clone() },
  uPR: { value: Math.min(window.devicePixelRatio || 1, 2) },
};
{
  const PER = [240, 150, 150, 150]; // 中央炮更密
  let total = 0;
  nozzles.forEach((nz) => { total += PER[nz.chan]; });
  const base = new Float32Array(total * 3);
  const seed = new Float32Array(total);
  const chan = new Float32Array(total);
  let k = 0;
  nozzles.forEach((nz) => {
    const c = PER[nz.chan];
    for (let i = 0; i < c; i++) {
      base[k * 3] = nz.x; base[k * 3 + 1] = 0.3; base[k * 3 + 2] = nz.z;
      seed[k] = Math.random();
      chan[k] = nz.chan;
      k++;
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(base, 3)); // 占位，真实位置走 aBase
  g.setAttribute('aBase', new THREE.BufferAttribute(base.slice(), 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  g.setAttribute('aChan', new THREE.BufferAttribute(chan, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: jetUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aBase;
      attribute float aSeed;
      attribute float aChan;
      uniform float uTime, uH0, uH1, uH2, uH3, uPR;
      varying float vAlpha;
      varying float vMix;
      void main(){
        float h = aChan < 0.5 ? uH0 : (aChan < 1.5 ? uH1 : (aChan < 2.5 ? uH2 : uH3));
        float hc = clamp(h, 0.05, 1.7);
        float speed = 0.50 + aSeed * 0.35;
        float phase = fract(uTime * speed + aSeed * 11.7);
        float vy = 4.6 + aSeed * 2.6;
        float tt = phase * 1.35;
        float y = vy * tt - 4.9 * tt * tt;
        y = max(y, 0.0);
        vec3 p = aBase;
        float ang = aSeed * 39.7;
        float spread = (0.05 + tt * 0.42) * (0.4 + 0.6 * aSeed);
        p.x += cos(ang) * spread + sin(uTime * 0.6 + aSeed * 6.28) * 0.12 * tt;
        p.z += sin(ang) * spread;
        p.y += y * (0.30 + 0.70 * hc);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float sz = (2.6 + aSeed * 3.4) * (1.0 - phase * 0.55);
        gl_PointSize = sz * uPR * (120.0 / max(-mv.z, 1.0));
        vAlpha = pow(1.0 - phase, 1.35) * smoothstep(0.0, 0.05, phase) * (0.30 + 0.70 * min(hc, 1.2));
        vMix = clamp(phase * 0.75 + aSeed * 0.25 + aChan * 0.12, 0.0, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uColA, uColB;
      varying float vAlpha;
      varying float vMix;
      void main(){
        vec2 d = gl_PointCoord - 0.5;
        float mask = smoothstep(0.5, 0.08, length(d));
        vec3 col = mix(uColA, uColB, vMix);
        gl_FragColor = vec4(col, mask * vAlpha * 0.85);
      }`,
  });
  const jets = new THREE.Points(g, m);
  jets.frustumCulled = false;
  scene.add(jets);
}

/* ---------------- 水雾光晕（程序化画布纹理） ---------------- */
let mist;
{
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(160,225,255,0.55)');
  gr.addColorStop(0.5, 'rgba(120,180,255,0.18)');
  gr.addColorStop(1, 'rgba(120,180,255,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  mist = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  mist.scale.set(13, 6.5, 1);
  mist.position.y = 1.1;
  scene.add(mist);
}

/* ---------------- 灯光模式 ---------------- */
let lightMode = 1; // 0 流光 / 1 呼吸 / 2 爆闪
const tgtA = CYAN.clone(), tgtB = VIOLET.clone();
const curA = CYAN.clone(), curB = VIOLET.clone();
let tgtIntensity = 1;

function tickLights(t, dt) {
  const kickEnv = Math.exp(-(transport - lastHit[0]) * 5);
  if (lightMode === 0) {
    // 流光：双色在色相环上缓慢追逐
    tgtA.setHSL((t * 0.045) % 1, 0.95, 0.60);
    tgtB.setHSL(((t * 0.045) + 0.38) % 1, 0.95, 0.62);
    tgtIntensity = 1.0 + kickEnv * 0.9;
  } else if (lightMode === 1) {
    // 呼吸：青→紫固定，整体缓慢呼吸 + 节拍点缀
    tgtA.set(0x3fe3ff); tgtB.set(0x8a5cff);
    tgtIntensity = 0.75 + 0.35 * Math.sin(t * 1.4) + kickEnv * 0.8;
  } else {
    // 爆闪：平时压暗，kick 来时白光爆闪
    tgtA.set(0x0d2b3d); tgtB.set(0x181245);
    const f = Math.pow(kickEnv, 1.5);
    tgtA.lerp(WHITE, f * 0.9);
    tgtB.lerp(CYAN, f * 0.85);
    tgtIntensity = 0.5 + f * 2.2;
  }
  const k = 1 - Math.exp(-dt * 5);
  curA.lerp(tgtA, k);
  curB.lerp(tgtB, k);
  jetUniforms.uColA.value.copy(curA);
  jetUniforms.uColB.value.copy(curB);
  waterUniforms.uColA.value.copy(curA);
  waterUniforms.uColB.value.copy(curB);
  rim.material.color.copy(curA);
  glowRings.forEach((rg, i) => {
    rg.material.color.copy(i % 2 ? curB : curA);
    rg.material.opacity = 0.55 + 0.35 * Math.min(tgtIntensity, 1.6) / 1.6;
  });
  plA.color.copy(curA); plB.color.copy(curB);
  plA.intensity = 26 * tgtIntensity;
  plB.intensity = 18 * tgtIntensity;
  plC.intensity = 12 * (0.7 + kickEnv * 0.8);
  return kickEnv;
}

/* ---------------- 交互：UI ---------------- */
let masterH = 1.0;
const heightInput = $('#height');
heightInput.addEventListener('input', () => { masterH = heightInput.value / 100; });

$$('[data-track]').forEach((b) => {
  b.addEventListener('click', () => {
    $$('[data-track]').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    trackIdx = +b.dataset.track;
    transport = 0; stepCount = 0; nextStepT = 0;
    lastHit[0] = lastHit[1] = lastHit[2] = lastHit[3] = -100;
    hideHint();
  });
});
$$('[data-light]').forEach((b) => {
  b.addEventListener('click', () => {
    $$('[data-light]').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    lightMode = +b.dataset.light;
    hideHint();
  });
});
const soundBtn = $('#soundBtn');
soundBtn.addEventListener('click', () => {
  ensureAudio();
  if (!audio) return;
  soundOn = !soundOn;
  if (soundOn && audio.ctx.state === 'suspended') audio.ctx.resume();
  soundBtn.textContent = soundOn ? '声音 开' : '声音 关';
  soundBtn.classList.toggle('on', soundOn);
  hideHint();
});

const hint = $('.hint');
let hintHidden = false;
function hideHint() {
  if (hintHidden) return;
  hintHidden = true;
  hint.classList.add('gone');
}
setTimeout(hideHint, 14000);

/* 点击水面：爆发 + 扩散环 */
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
canvas.addEventListener('pointerdown', (e) => {
  ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
  ptr.y = -(e.clientY / window.innerHeight) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObject(waterMesh, false);
  if (hit.length) {
    burstT = transport;
    waterUniforms.uBurst.value = jetUniforms.uTime.value;
    hideHint();
  }
});

/* ---------------- 相机：缓环绕 + 鼠标视差 ---------------- */
let mx = 0, my = 0, smx = 0, smy = 0;
window.addEventListener('pointermove', (e) => {
  mx = (e.clientX / window.innerWidth) * 2 - 1;
  my = (e.clientY / window.innerHeight) * 2 - 1;
});

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
const env = [0.3, 0.3, 0.3, 0.3];

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  advanceTransport(dt);

  // 各通道包络：触发衰减 + 待机呼吸（无触发时也不熄火）
  const burstBoost = 1 + 1.7 * Math.exp(-(transport - burstT) * 1.1);
  for (let c = 0; c < 4; c++) {
    const e = Math.exp(-(transport - lastHit[c]) * 4.2);
    const idle = 0.22 + 0.10 * Math.sin(t * 1.6 + c * 1.7);
    env[c] = Math.max(e, Math.min(idle, 0.36)) * burstBoost * masterH;
  }
  jetUniforms.uH0.value = env[0];
  jetUniforms.uH1.value = env[1];
  jetUniforms.uH2.value = env[2];
  jetUniforms.uH3.value = env[3];
  jetUniforms.uTime.value = t;

  const kickEnv = tickLights(t, dt);
  waterUniforms.uTime.value = t;
  waterUniforms.uBeat.value = kickEnv;

  mist.material.opacity = 0.32 + kickEnv * 0.35;
  const ms = 12 + kickEnv * 3;
  mist.scale.set(ms, ms * 0.5, 1);

  // 相机
  smx += (mx - smx) * (1 - Math.exp(-dt * 2.2));
  smy += (my - smy) * (1 - Math.exp(-dt * 2.2));
  const ang = t * 0.05;
  camera.position.set(
    Math.sin(ang) * CAM_R + smx * 2.2,
    CAM_H + Math.sin(t * 0.4) * 0.35 - smy * 1.1,
    Math.cos(ang) * CAM_R
  );
  camera.lookAt(0, 2.2, 0);

  renderer.render(scene, camera);
}
animate();

/* ---------------- 自适应 ---------------- */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  jetUniforms.uPR.value = Math.min(window.devicePixelRatio || 1, 2);
});

/* ---------------- loader / 入场 ---------------- */
let entered = false;
function enter() {
  if (entered) return;
  entered = true;
  setTimeout(() => {
    $('#loader').classList.add('done');
    const els = $$('[data-intro]');
    els.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 150 + i * 160));
  }, 500);
}
if (document.readyState === 'complete') enter();
else window.addEventListener('load', () => setTimeout(enter, 200));
setTimeout(enter, 4500); // 兜底：超时强制进入完成态
