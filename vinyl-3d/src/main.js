// vinyl-3d · 黑胶唱片机
// 纯程序化几何 + shader：凹槽反光黑胶、唱臂落针动画、WebAudio 程序化合成音源驱动音纹光环。
// 代码全部原创；three.js 仅作 WebGL 渲染器（vendor 本地文件）。
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const canvas = $('v'), loader = $('loader');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 常量 ----------
const BLACK = 0x0b0b0c, WARM = 0xffd9a0, RED = 0xd64541;
const RPM33 = 33.333 * Math.PI * 2 / 60;   // 3.4907 rad/s
const RPM45 = 45 * Math.PI * 2 / 60;       // 4.7124 rad/s
const NBARS = 72, RING_R = 1.98;
const PIVOT = { x: 1.95, z: -0.75 }, ARM_L = 1.85;
const TRACK_OUT = 1.30, TRACK_IN = 0.58, SIDE_SECONDS = 720;
const GROOVE_Y = 0.2715;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const damp = (cur, tgt, rate, dt) => cur + (tgt - cur) * (1 - Math.pow(rate, dt));

// ---------- 状态：目标值与实际值分离，每帧阻尼逼近（物理感） ----------
const S = {
  playing: false,
  rpmT: 0, rpm: 0,
  yawT: 0.35, yaw: 0.35,
  liftT: 1, lift: 1,               // 1=抬起 0=落下
  trackT: 0, track: 0,             // 0=外圈 1=内圈
  vizT: 1, viz: 1,
  disc: 0, labelFade: 1,
  armMode: 'parked',               // parked|swing|drop|tracking|lift
  bars: new Float32Array(NBARS),
  ptr: { x: 0, y: 0, tx: 0, ty: 0 },
  frames: 0,
};

// 唱臂几何：给定针尖半径 r，求偏航角（固定枢轴 + 固定臂长，余弦定理）
function yawForRadius(r) {
  const m = Math.hypot(PIVOT.x, PIVOT.z);
  const beta = Math.atan2(PIVOT.x, PIVOT.z);
  const cosG = clamp((m * m + r * r - ARM_L * ARM_L) / (2 * m * r), -1, 1);
  const tipA = beta - Math.acos(cosG);
  return Math.atan2(r * Math.sin(tipA) - PIVOT.x, r * Math.cos(tipA) - PIVOT.z);
}

// ---------- 渲染器 ----------
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  $('noWebgl').style.display = 'flex';
  loader.classList.add('done');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(BLACK);
scene.fog = new THREE.Fog(BLACK, 9, 16);

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 60);
camera.position.set(0, 4.7, 6.1);
camera.lookAt(0, 0.2, 0);

// 灯光：暖黄主光 + 红色轮廓光（严格三色）
scene.add(new THREE.AmbientLight(0x2a2018, 1.1));
const key = new THREE.DirectionalLight(WARM, 2.2);
key.position.set(-3.5, 6, 3.5);
scene.add(key);
const rim = new THREE.PointLight(RED, 14, 12, 2);
rim.position.set(3.2, 1.4, -2.6);
scene.add(rim);

// ---------- 底座 ----------
const plinth = new THREE.Mesh(
  new THREE.BoxGeometry(5.6, 0.3, 4.6),
  new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 0.55, metalness: 0.25 })
);
plinth.position.y = 0;
scene.add(plinth);
// 暖黄细边框：底座顶面描边（手工细节）
const trimEdge = new THREE.Mesh(
  new THREE.BoxGeometry(5.62, 0.02, 4.62),
  new THREE.MeshBasicMaterial({ color: WARM })
);
trimEdge.position.y = 0.145;
scene.add(trimEdge);
const trimTop = new THREE.Mesh(
  new THREE.BoxGeometry(5.5, 0.022, 4.5),
  new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 0.55, metalness: 0.25 })
);
trimTop.position.y = 0.146;
scene.add(trimTop);

// ---------- 转盘 ----------
const platter = new THREE.Group();
platter.position.y = 0.20;
scene.add(platter);
platter.add(new THREE.Mesh(
  new THREE.CylinderGeometry(1.62, 1.62, 0.10, 96),
  new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: 0.35, metalness: 0.85 })
));
// 转盘频闪点：24 颗暖黄小点，随转盘一起转（经典唱机细节）
{
  const dots = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.045, 0.012, 0.09),
    new THREE.MeshBasicMaterial({ color: WARM }), 24);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    m4.makeTranslation(Math.cos(a) * 1.60, 0.052, Math.sin(a) * 1.60);
    dots.setMatrixAt(i, m4);
  }
  dots.instanceMatrix.needsUpdate = true;
  platter.add(dots);
}

// ---------- 黑胶（随转盘旋转） ----------
const vinyl = new THREE.Group();
vinyl.position.y = 0.06; // 相对转盘中心：转盘顶面 0.25，黑胶中心 0.26
platter.add(vinyl);
vinyl.add(new THREE.Mesh(
  new THREE.CylinderGeometry(1.5, 1.5, 0.018, 128),
  new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.4, metalness: 0.1 })
));

// 凹槽 shader：极坐标环纹 + 各向异性反光条纹
const grooveMat = new THREE.ShaderMaterial({
  uniforms: {
    uBase:   { value: new THREE.Color(0x0c0c0d) },
    uGroove: { value: new THREE.Color(0x8a8a92) },
    uStreak: { value: new THREE.Color(WARM) },
    uLight:  { value: new THREE.Vector2(-0.55, 0.83).normalize() },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform vec3 uBase, uGroove, uStreak;
    uniform vec2 uLight;
    void main(){
      vec2 p = vUv * 2.0 - 1.0;
      float r = length(p);
      if (r > 1.0) discard;
      float wax = smoothstep(0.335, 0.365, r);       // 死蜡区（无纹）
      float g = sin(r * 260.0);
      float groove = smoothstep(0.15, 1.0, g) * 0.5 + 0.5;
      vec2 d = p / max(r, 1e-4);
      float s1 = pow(abs(dot(d, uLight)), 90.0);
      float s2 = pow(abs(dot(d, vec2(-uLight.y, uLight.x))), 160.0);
      float streak = s1 * 0.95 + s2 * 0.38;          // 两组正交反光
      float sp = fract(sin(dot(floor(p * 420.0), vec2(12.9898, 78.233))) * 43758.5453);
      float sparkle = step(0.9965, sp) * 0.30;      // 压制工艺微闪点
      vec3 col = uBase;
      col += uGroove * (groove - 0.5) * wax * 0.55;
      col += uStreak * streak * wax * (0.45 + 0.55 * groove);
      col += uStreak * smoothstep(0.965, 1.0, r) * 0.22;
      col += vec3(1.0) * sparkle * wax;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
const grooveMesh = new THREE.Mesh(new THREE.CircleGeometry(1.5, 128), grooveMat);
grooveMesh.rotation.x = -Math.PI / 2;
grooveMesh.position.y = 0.0105;
vinyl.add(grooveMesh);

// ---------- 唱片标签：三张，程序化 Canvas 绘制（零外部资源） ----------
const DISC_DEFS = [
  { name: '红标 · A面', side: '红标 · A 面', bg: '#D64541', ink: '#0B0B0C' },
  { name: '黄标 · B面', side: '黄标 · B 面', bg: '#FFD9A0', ink: '#0B0B0C' },
  { name: '黑标 · C面', side: '黑标 · C 面', bg: '#17171a', ink: '#D64541' },
];
function makeLabelTexture(def) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = def.bg;
  x.beginPath(); x.arc(256, 256, 256, 0, 7); x.fill();
  x.strokeStyle = def.ink; x.lineWidth = 6;
  x.beginPath(); x.arc(256, 256, 232, 0, 7); x.stroke();
  x.lineWidth = 2;
  x.beginPath(); x.arc(256, 256, 196, 0, 7); x.stroke();
  // 环形文字
  x.fillStyle = def.ink;
  x.font = '600 34px system-ui, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  const txt = 'VINYL-3D · ' + def.name.replace(' · ', ' / ');
  const R = 150;
  for (let i = 0; i < txt.length; i++) {
    const a = -Math.PI / 2 + (i / txt.length) * Math.PI * 2;
    x.save();
    x.translate(256 + Math.cos(a) * R, 256 + Math.sin(a) * R);
    x.rotate(a + Math.PI / 2);
    x.fillText(txt[i], 0, 0);
    x.restore();
  }
  x.font = '500 26px system-ui, sans-serif';
  x.fillText('33⅓ RPM', 256, 330);
  x.fillText('STEREO', 256, 366);
  // 中心轴孔
  x.fillStyle = '#0B0B0C';
  x.beginPath(); x.arc(256, 256, 26, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const labelTex = DISC_DEFS.map(makeLabelTexture);
const labelMat = new THREE.MeshStandardMaterial({
  map: labelTex[0], transparent: true, roughness: 0.5, metalness: 0.05,
});
const labelMesh = new THREE.Mesh(new THREE.CircleGeometry(0.5, 64), labelMat);
labelMesh.rotation.x = -Math.PI / 2;
labelMesh.position.y = 0.0115;
vinyl.add(labelMesh);

// 主轴（静止，穿过标签中心孔）
const spindle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.032, 0.032, 0.16, 24),
  new THREE.MeshStandardMaterial({ color: 0x8a8a92, roughness: 0.3, metalness: 0.9 })
);
spindle.position.y = 0.29;
scene.add(spindle);

// ---------- 唱臂 ----------
const armGroup = new THREE.Group();
armGroup.position.set(PIVOT.x, 0.15, PIVOT.z);
scene.add(armGroup);
// 枢轴座
const pivotBase = new THREE.Mesh(
  new THREE.CylinderGeometry(0.17, 0.20, 0.30, 32),
  new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: 0.4, metalness: 0.7 })
);
pivotBase.position.y = 0.15;
armGroup.add(pivotBase);
const armLift = new THREE.Group();   // 升降
armLift.position.y = 0.30;
armGroup.add(armLift);
const armYawG = new THREE.Group();   // 偏航
armLift.add(armYawG);
const armMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.35, metalness: 0.8 });
const armTube = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.045, ARM_L), armMat);
armTube.position.z = ARM_L / 2;
armYawG.add(armTube);
const counter = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.10, 24), armMat);
counter.rotation.x = Math.PI / 2;
counter.position.z = -0.22;
armYawG.add(counter);
const shell = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.045, 0.24),
  new THREE.MeshStandardMaterial({ color: RED, roughness: 0.5, metalness: 0.2 }));
shell.position.set(0, -0.02, ARM_L - 0.08);
shell.rotation.y = 0.35;
armYawG.add(shell);
const needle = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.16, 12),
  new THREE.MeshStandardMaterial({ color: 0xd8d8de, roughness: 0.25, metalness: 0.9 }));
needle.position.set(0.055, -0.10, ARM_L - 0.015);
needle.rotation.x = Math.PI; // 针尖朝下
armYawG.add(needle);
// 唱臂停靠架
const restPost = new THREE.Mesh(
  new THREE.CylinderGeometry(0.035, 0.045, 0.32, 16),
  new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: 0.4, metalness: 0.7 })
);
restPost.position.set(2.27, 0.31, 0.12);
scene.add(restPost);

// ---------- 音纹可视化光环：72 根暖黄光柱，随频谱跳动 ----------
const barGeo = new THREE.BoxGeometry(0.055, 1, 0.055);
barGeo.translate(0, 0.5, 0); // 缩放时从底部生长
const barMat = new THREE.MeshBasicMaterial({ color: WARM, toneMapped: false });
const bars = new THREE.InstancedMesh(barGeo, barMat, NBARS);
bars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(bars);
const barM4 = new THREE.Matrix4();
const barQ = new THREE.Quaternion();
const barPos = new THREE.Vector3();
const barScl = new THREE.Vector3();
const barCol = new THREE.Color();
function updateBars() {
  for (let i = 0; i < NBARS; i++) {
    const a = (i / NBARS) * Math.PI * 2;
    const h = 0.02 + S.bars[i] * 1.5;
    barPos.set(Math.cos(a) * RING_R, 0.16, Math.sin(a) * RING_R);
    barScl.set(1, h, 1);
    barM4.compose(barPos, barQ, barScl);
    bars.setMatrixAt(i, barM4);
    // 高度越高越亮（instanceColor，严格三色内明度变化）
    const k = 0.25 + 0.75 * clamp(S.bars[i], 0, 1);
    barCol.setHex(WARM).multiplyScalar(k);
    bars.setColorAt(i, barCol);
  }
  bars.instanceMatrix.needsUpdate = true;
  if (bars.instanceColor) bars.instanceColor.needsUpdate = true;
}
// 光环底座：静态细环，音纹关闭时仍有结构
const ringBase = new THREE.Mesh(
  new THREE.TorusGeometry(RING_R, 0.012, 8, 128),
  new THREE.MeshBasicMaterial({ color: WARM, transparent: true, opacity: 0.18 })
);
ringBase.rotation.x = Math.PI / 2;
ringBase.position.y = 0.16;
scene.add(ringBase);

// ---------- WebAudio：程序化合成音源（零外部音频文件） ----------
// Lo-fi 和弦进行 Am – F – C – G，92 BPM（45 转时提速到 124）
let AC = null, master = null, analyser = null, noiseBuf = null;
let schedTimer = null, step = 0, nextT = 0, delaySend = null;
const CHORDS = [
  { pad: [110.00, 164.81, 220.00, 261.63], bass: 55.00 },  // Am
  { pad: [87.31, 174.61, 220.00, 261.63], bass: 43.65 },   // F
  { pad: [130.81, 196.00, 261.63, 329.63], bass: 65.41 },  // C
  { pad: [98.00, 146.83, 246.94, 293.66], bass: 49.00 },   // G
];
const PENTA = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00];
let leadIdx = 2;
const stepDur = () => 60 / (92 * (S.rpmT > 40 ? 45 / 33.333 : 1)) / 4;

function ensureAudio() {
  if (AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  master = AC.createGain();
  master.gain.value = 0;
  analyser = AC.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.78;
  master.connect(analyser);
  analyser.connect(AC.destination);
  // 噪声缓冲（鼓刷/镲片用）
  noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  // 反馈延迟（主音空间感）
  const delay = AC.createDelay(1);
  delay.delayTime.value = 0.29;
  const fb = AC.createGain(); fb.gain.value = 0.34;
  const wet = AC.createGain(); wet.gain.value = 0.22;
  delaySend = AC.createGain(); delaySend.gain.value = 1;
  delaySend.connect(delay); delay.connect(fb); fb.connect(delay);
  delay.connect(wet); wet.connect(master);
}
function adsr(t, peak, a, r) {
  const g = AC.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0008, t + a + r);
  return g;
}
function scheduleStep(s, t) {
  const bar = Math.floor(s / 16) % 4;
  const ch = CHORDS[bar];
  const sd = stepDur();
  if (s % 16 === 0) {
    // 铺底：四音 + 微失谐三角波
    ch.pad.forEach((f) => {
      const o = AC.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 9;
      const flt = AC.createBiquadFilter();
      flt.type = 'lowpass'; flt.frequency.value = 850;
      const g = adsr(t, 0.055, 0.9, sd * 15);
      o.connect(flt); flt.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.9 + sd * 15);
    });
  }
  if (s % 4 === 0 || s % 16 === 14) {
    // 贝斯：正弦根音
    const o = AC.createOscillator();
    o.type = 'sine';
    o.frequency.value = ch.bass * (s % 16 === 14 ? 1.5 : 1);
    const g = adsr(t, 0.16, 0.01, sd * 3.2);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.01 + sd * 3.2);
  }
  if (s % 2 === 1) {
    // 镲片：高通噪声
    const src = AC.createBufferSource();
    src.buffer = noiseBuf;
    const hp = AC.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 7200;
    const g = adsr(t, s % 8 === 3 ? 0.05 : 0.028, 0.002, 0.09);
    src.connect(hp); hp.connect(g); g.connect(master);
    src.start(t); src.stop(t + 0.12);
  }
  if (s % 4 === 2 && Math.random() < 0.75) {
    // 主音：五声音阶随机游走
    leadIdx = clamp(leadIdx + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.3 ? 2 : 1), 0, PENTA.length - 1);
    const o = AC.createOscillator();
    o.type = 'triangle';
    o.frequency.value = PENTA[leadIdx];
    const g = adsr(t, 0.06, 0.01, sd * 5);
    o.connect(g); g.connect(master); g.connect(delaySend);
    o.start(t); o.stop(t + 0.01 + sd * 5);
  }
}
function scheduler() {
  if (!AC) return;
  while (nextT < AC.currentTime + 0.45) {
    scheduleStep(step, nextT);
    nextT += stepDur();
    step++;
  }
}
function audioStart() {
  ensureAudio();
  if (AC.state === 'suspended') AC.resume();
  master.gain.cancelScheduledValues(AC.currentTime);
  master.gain.setTargetAtTime(0.9, AC.currentTime, 0.25);
  step = 0;
  nextT = AC.currentTime + 0.15;
  if (!schedTimer) schedTimer = setInterval(scheduler, 110);
}
function audioStop() {
  if (!AC) return;
  if (schedTimer) { clearInterval(schedTimer); schedTimer = null; }
  master.gain.setTargetAtTime(0.0, AC.currentTime, 0.3);
}
const freqData = new Uint8Array(128);
function readSpectrum() {
  if (!analyser || !S.playing) return null;
  analyser.getByteFrequencyData(freqData);
  return freqData;
}

// ---------- 交互 ----------
const btnPlay = $('btnPlay'), btnViz = $('btnViz');
const segSpeed = $('segSpeed'), discDots = $('discDots');
const discName = $('discName'), sideDisc = $('sideDisc'), sideRpm = $('sideRpm');

function setPlaying(on) {
  S.playing = on;
  btnPlay.setAttribute('aria-pressed', String(on));
  btnPlay.textContent = on ? '暂停' : '播放';
  if (on) {
    S.rpmT = currentRpmRad();
    S.armMode = 'swing';
    S.yawT = yawForRadius(TRACK_OUT + (TRACK_IN - TRACK_OUT) * S.track);
    S.liftT = 1;
    sideRpm.textContent = rpmLabel() + ' · 加速中';
  } else {
    audioStop();
    S.rpmT = 0;
    S.armMode = 'lift';
    S.liftT = 1;
    sideRpm.textContent = rpmLabel() + ' · 已停';
  }
}
function currentRpmRad() {
  const btn = segSpeed.querySelector('[aria-pressed="true"]');
  return parseFloat(btn.dataset.v) * Math.PI * 2 / 60;
}
function rpmLabel() {
  const btn = segSpeed.querySelector('[aria-pressed="true"]');
  return btn.dataset.v === '45' ? '45 RPM' : '33⅓ RPM';
}
btnPlay.addEventListener('click', () => setPlaying(!S.playing));

segSpeed.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  segSpeed.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  if (S.playing) S.rpmT = currentRpmRad();
  sideRpm.textContent = rpmLabel() + (S.playing ? ' · 播放中' : ' · 已停');
});

btnViz.addEventListener('click', () => {
  const on = btnViz.getAttribute('aria-pressed') !== 'true';
  btnViz.setAttribute('aria-pressed', String(on));
  btnViz.textContent = on ? '开' : '关';
  S.vizT = on ? 1 : 0;
});

discDots.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = parseInt(b.dataset.d, 10);
  if (d === S.disc) return;
  discDots.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  S.disc = d;
  S.labelFade = 0; // 先淡出再换贴纸
  S.track = 0; S.trackT = 0;
  discName.textContent = DISC_DEFS[d].name;
  sideDisc.textContent = DISC_DEFS[d].side;
  if (S.playing && (S.armMode === 'tracking' || S.armMode === 'drop')) {
    S.yawT = yawForRadius(TRACK_OUT);
  }
});

// 指针视差（移动端触屏同样可用 pointer 事件）
addEventListener('pointermove', (e) => {
  S.ptr.tx = (e.clientX / innerWidth - 0.5) * 0.9;
  S.ptr.ty = (e.clientY / innerHeight - 0.5) * 0.5;
});
// 点唱片切换播放 / 暂停（raycast）
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let downAt = 0;
canvas.addEventListener('pointerdown', (e) => { downAt = performance.now(); });
canvas.addEventListener('pointerup', (e) => {
  if (performance.now() - downAt > 350) return; // 拖拽不算点击
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (ray.intersectObject(vinyl, true).length) setPlaying(!S.playing);
});
canvas.addEventListener('pointermove', (e) => {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  canvas.style.cursor = ray.intersectObject(vinyl, true).length ? 'pointer' : 'grab';
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- 主循环 ----------
const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 转速：阻尼加速（带一点 wow 抖动，模拟皮带传动）
  S.rpm = damp(S.rpm, S.rpmT, 0.03, dt);
  const wobble = 1 + 0.0022 * Math.sin(t * 5.3) + 0.0011 * Math.sin(t * 11.7);
  platter.rotation.y -= S.rpm * wobble * dt;

  // 唱臂状态机
  if (S.armMode === 'swing' && Math.abs(S.yaw - S.yawT) < 0.02) {
    S.armMode = 'drop';
    S.liftT = 0;
  } else if (S.armMode === 'drop' && Math.abs(S.lift - S.liftT) < 0.02) {
    S.armMode = 'tracking';
    audioStart();
    sideRpm.textContent = rpmLabel() + ' · 播放中';
  } else if (S.armMode === 'lift' && Math.abs(S.lift - S.liftT) < 0.02) {
    S.armMode = 'parked';
    S.yawT = 0.35;
  }
  // 循迹：唱针随播放缓慢向内圈移动
  if (S.armMode === 'tracking' && S.playing) {
    S.trackT = Math.min(1, S.trackT + dt / SIDE_SECONDS);
    S.track = damp(S.track, S.trackT, 0.5, dt);
    S.yawT = yawForRadius(TRACK_OUT + (TRACK_IN - TRACK_OUT) * S.track);
    if (S.trackT >= 1) { setPlaying(false); } // 播完自动停 + 唱臂归位
  }
  S.yaw = damp(S.yaw, S.yawT, 0.008, dt);
  S.lift = damp(S.lift, S.liftT, 0.004, dt);
  S.viz = damp(S.viz, S.vizT, 0.02, dt);
  armYawG.rotation.y = S.yaw;
  armLift.position.y = 0.30 + S.lift * 0.12;

  // 换碟：标签淡出 → 换贴纸 → 淡入
  if (S.labelFade < 1) {
    S.labelFade = Math.min(1, S.labelFade + dt * 5);
    labelMat.opacity = S.labelFade < 0.5 ? 1 - S.labelFade * 2 : (S.labelFade - 0.5) * 2;
    if (S.labelFade >= 0.5 && labelMat.map !== labelTex[S.disc]) {
      labelMat.map = labelTex[S.disc];
      labelMat.needsUpdate = true;
    }
  } else {
    labelMat.opacity = 1;
  }

  // 音纹光环：频谱驱动（攻击快、释放慢）
  const spec = readSpectrum();
  for (let i = 0; i < NBARS; i++) {
    let target;
    if (spec && S.viz > 0.02) {
      const bin = Math.min(127, 2 + Math.floor(Math.pow(i / NBARS, 1.6) * 100));
      target = Math.pow(spec[bin] / 255, 1.3) * S.viz;
    } else {
      // 待机呼吸：页面不死
      target = S.viz * (0.05 + 0.045 * (0.5 + 0.5 * Math.sin(t * 1.4 + i * 0.42)));
    }
    const rate = target > S.bars[i] ? 0.0001 : 0.02;
    S.bars[i] += (target - S.bars[i]) * (1 - Math.pow(rate, dt));
  }
  updateBars();
  ringBase.material.opacity = 0.10 + 0.12 * S.viz;

  // 相机：指针视差（reduceMotion 时静止）
  if (!reduceMotion) {
    S.ptr.x = damp(S.ptr.x, S.ptr.tx, 0.05, dt);
    S.ptr.y = damp(S.ptr.y, S.ptr.ty, 0.05, dt);
  }
  camera.position.set(S.ptr.x, 4.7 - S.ptr.y * 0.6, 6.1);
  camera.lookAt(0, 0.2, 0);

  renderer.render(scene, camera);

  // 完成态：首帧渲染 10 帧后 loader 淡出、data-intro 浮现
  if (++S.frames === 10) {
    loader.classList.add('done');
    document.querySelectorAll('[data-intro]').forEach((el) => el.classList.add('is-in'));
  }
}
tick();
