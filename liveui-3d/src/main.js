// huafire3d fx-lab — liveui-3d: original implementation
// 核心手法：3D 屏幕本体只画 CanvasTexture 波形；
// 真实 DOM 播放器卡片每帧用「屏幕四角投影 → 单应性矩阵 → CSS matrix3d」贴合到屏幕上。
// 视觉上 UI 长在 3D 物体表面，交互走真 DOM：零 hack、处处可点。
import * as THREE from 'three';

/* ============ DOM ============ */
const stage   = document.getElementById('stage');
const uiCard  = document.getElementById('uiCard');
const playBtn = document.getElementById('playBtn');
const playIcon= document.getElementById('playIcon');
const vol     = document.getElementById('vol');
const volNum  = document.getElementById('volNum');
const trackName = document.getElementById('trackName');
const trackSub  = document.getElementById('trackSub');
const songBtns  = [...document.querySelectorAll('.song')];

const SVG_PLAY  = '<path d="M8 5v14l11-7z"/>';
const SVG_PAUSE = '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';

/* ============ 渲染器 / 场景 ============ */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.domElement.classList.add('webgl');
stage.prepend(renderer.domElement);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 1.5, 7.4);
camera.lookAt(0, 0.1, 0);
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x0a0a0c, 0.4));
const fill = new THREE.DirectionalLight(0xffffff, 0.55); // 正面补光，托出石墨机身
fill.position.set(0.5, 1.2, 8); scene.add(fill);

scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 1.15);
key.position.set(4, 6, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0xb4ff39, 0.55);
rim.position.set(-5, 2, -4); scene.add(rim);
const under = new THREE.PointLight(0xb4ff39, 6, 9);
under.position.set(0, -1.6, 2.4); scene.add(under);

/* ============ 音箱 ============ */
const NEON = 0xb4ff39, INK = 0x16161a;
const speaker = new THREE.Group();
speaker.position.y = 0.08;
scene.add(speaker);

// 机身：石墨圆柱
const body = new THREE.Mesh(
  new THREE.CylinderGeometry(1.55, 1.72, 2.5, 64),
  new THREE.MeshStandardMaterial({ color: INK, roughness: 0.42, metalness: 0.55 })
);
speaker.add(body);
// 顶部装饰圈
const collar = new THREE.Mesh(
  new THREE.CylinderGeometry(1.56, 1.56, 0.1, 64),
  new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.3, metalness: 0.8 })
);
collar.position.y = 1.22; speaker.add(collar);
// 顶部发光环：荧光绿
const ringMat = new THREE.MeshStandardMaterial({ color: INK, emissive: NEON, emissiveIntensity: 2.0 });
const ring = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.05, 20, 96), ringMat);
ring.rotation.x = Math.PI / 2; ring.position.y = 1.32;
speaker.add(ring);
// 底部阴影盘
const disc = new THREE.Mesh(
  new THREE.CircleGeometry(2.6, 48),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42 })
);
disc.rotation.x = -Math.PI / 2; disc.position.y = -1.45;
scene.add(disc);

// 屏幕：3D 本体只是一块 CanvasTexture 平面（画波形）
const SCREEN_W = 2.02, SCREEN_H = 1.08;
const screenCanvas = document.createElement('canvas');
screenCanvas.width = 512; screenCanvas.height = 276;
const sctx = screenCanvas.getContext('2d');
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
const screen = new THREE.Mesh(
  new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
  new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })
);
screen.position.set(0, 0.12, 1.47);
speaker.add(screen);
// 屏幕边框
const frame = new THREE.Mesh(
  new THREE.PlaneGeometry(SCREEN_W + 0.1, SCREEN_H + 0.1),
  new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.35, metalness: 0.7 })
);
frame.position.set(0, 0.12, 1.465);
speaker.add(frame);

/* ============ 旋转：拖拽 + 惯性 + 闲置自转（物理感） ============ */
let rotY = 0, rotX = 0, velY = 0, velX = 0, dragging = false, lastX = 0, lastY = 0, idleT = 0;
stage.addEventListener('pointerdown', e => {
  if (e.target.closest('.ui-card')) return;      // 卡片上的操作不旋转
  dragging = true; lastX = e.clientX; lastY = e.clientY; idleT = 0;
  stage.classList.add('dragging');
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  velY = dx * 0.0052; velX = dy * 0.0022;
  rotY += velY;
  rotX = THREE.MathUtils.clamp(rotX + velX, -0.28, 0.28);
});
const endDrag = () => { dragging = false; stage.classList.remove('dragging'); };
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
uiCard.addEventListener('pointerdown', e => e.stopPropagation()); // 卡片点击不冒泡

/* ============ WebAudio：三段合成旋律 ============ */
// midi → 频率
const f = m => 440 * Math.pow(2, (m - 69) / 12);
// [midi, 拍数] 循环；三段不同性格
const TRACKS = [
  { name: '晨间电子', sub: '第 1 首 · 合成琶音', bpm: 112, wave: 'triangle',
    seq: [[69,.5],[72,.5],[76,.5],[79,.5],[81,1],[79,.5],[76,.5],[72,.5],[74,.5],[77,.5],[81,.5],[84,1.5]] },
  { name: '深夜爵士', sub: '第 2 首 · 小调漫步', bpm: 76, wave: 'sine',
    seq: [[62,1],[65,1],[67,1.5],[65,.5],[63,1],[62,2],[60,1],[63,1],[65,2],[67,2]] },
  { name: '山间民谣', sub: '第 3 首 · 五声音阶', bpm: 96, wave: 'triangle',
    seq: [[67,.5],[69,.5],[72,1],[69,.5],[67,.5],[64,1],[62,.5],[64,.5],[67,1.5],[69,1]] },
];
let actx = null, master = null, analyser = null, freqData = null;
let playing = false, trackIdx = 0, step = 0, nextT = 0, schedTimer = null;

function ensureAudio() {
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  master = actx.createGain();
  master.gain.value = Math.pow(vol.value / 100, 1.6);
  analyser = actx.createAnalyser();
  analyser.fftSize = 128;
  freqData = new Uint8Array(analyser.frequencyBinCount);
  master.connect(analyser); analyser.connect(actx.destination);
}
function schedule() {
  const tr = TRACKS[trackIdx], spb = 60 / tr.bpm;
  while (nextT < actx.currentTime + 0.15) {
    const [midi, beats] = tr.seq[step % tr.seq.length];
    const t = Math.max(nextT, actx.currentTime + 0.02);
    const dur = beats * spb * 0.92;
    const o1 = actx.createOscillator(), o2 = actx.createOscillator(), g = actx.createGain();
    o1.type = tr.wave; o2.type = tr.wave; o2.detune.value = 6;
    o1.frequency.value = f(midi); o2.frequency.value = f(midi);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o1.connect(g); o2.connect(g); g.connect(master);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    nextT = t + beats * spb;
    step++;
  }
}
function setPlaying(p) {
  ensureAudio();
  if (actx.state === 'suspended') actx.resume();
  playing = p;
  playIcon.innerHTML = p ? SVG_PAUSE : SVG_PLAY;
  playBtn.setAttribute('aria-label', p ? '暂停' : '播放');
  if (p) { nextT = actx.currentTime + 0.06; step = 0; schedTimer = setInterval(schedule, 40); }
  else clearInterval(schedTimer);
}
playBtn.addEventListener('click', () => setPlaying(!playing));
vol.addEventListener('input', () => {
  volNum.textContent = vol.value;
  if (master) master.gain.setTargetAtTime(Math.pow(vol.value / 100, 1.6), actx.currentTime, 0.02);
});
songBtns.forEach(b => b.addEventListener('click', () => {
  const i = +b.dataset.i;
  if (i === trackIdx) return;
  trackIdx = i;
  songBtns.forEach(x => x.classList.toggle('active', x === b));
  trackName.textContent = TRACKS[i].name;
  trackSub.textContent = TRACKS[i].sub;
  if (playing && actx) { step = 0; nextT = actx.currentTime + 0.06; }
}));

/* ============ 3D 屏幕波形（CanvasTexture，每帧重绘） ============ */
const BARS = 44;
function drawScreen(t) {
  const W = screenCanvas.width, H = screenCanvas.height;
  sctx.fillStyle = '#16161A'; sctx.fillRect(0, 0, W, H);
  // 顶部状态行
  sctx.fillStyle = 'rgba(180,255,57,.9)';
  sctx.font = '600 20px system-ui'; sctx.textBaseline = 'top';
  sctx.fillText(playing ? '▶ 播放中' : '❚❚ 已暂停', 22, 18);
  sctx.fillStyle = 'rgba(255,255,255,.55)';
  sctx.font = '20px system-ui';
  sctx.fillText(TRACKS[trackIdx].name, 22, 48);
  // 波形条
  if (playing && analyser) analyser.getByteFrequencyData(freqData);
  const bw = (W - 44) / BARS, volScale = 0.25 + 0.75 * (vol.value / 100);
  for (let i = 0; i < BARS; i++) {
    let v;
    if (playing && freqData) v = (freqData[2 + (i % 30)] / 255) * volScale;
    else v = (0.12 + 0.08 * Math.sin(t * 1.7 + i * 0.55)) * volScale; // 待机呼吸
    const h = Math.max(4, v * (H - 130));
    const x = 22 + i * bw, y = H - 24 - h;
    const grad = sctx.createLinearGradient(0, y, 0, H - 24);
    grad.addColorStop(0, '#B4FF39'); grad.addColorStop(1, 'rgba(180,255,57,.25)');
    sctx.fillStyle = grad;
    sctx.beginPath();
    if (sctx.roundRect) sctx.roundRect(x, y, bw * 0.62, h, 3); else sctx.rect(x, y, bw * 0.62, h);
    sctx.fill();
  }
  screenTex.needsUpdate = true;
}

/* ============ 单应性：屏幕四角投影 → CSS matrix3d ============ */
// 解 8x8 线性方程组（高斯消元 + 部分主元），求 src→dst 的 3x3 单应矩阵
function solveHomography(src, dst) {
  const A = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  const n = 8;
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    if (Math.abs(A[piv][c]) < 1e-9) return null;
    [A[c], A[piv]] = [A[piv], A[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const k = A[r][c] / A[c][c];
      for (let j = c; j <= n; j++) A[r][j] -= k * A[c][j];
    }
  }
  const s = A.map((row, i) => row[n] / row[i]);
  return [[s[0], s[1], s[2]], [s[3], s[4], s[5]], [s[6], s[7], 1]];
}
const _v = new THREE.Vector3();
const _corner = [[-SCREEN_W/2, SCREEN_H/2], [SCREEN_W/2, SCREEN_H/2],
                 [SCREEN_W/2, -SCREEN_H/2], [-SCREEN_W/2, -SCREEN_H/2]];
let cardW = 340, cardH = 236;
function cacheCardSize() {           // 布局尺寸（不受 transform 影响）
  if (!uiCard.classList.contains('fallback')) {
    cardW = uiCard.offsetWidth; cardH = uiCard.offsetHeight;
  }
}
function quadArea(p) {               // 鞋带公式
  let a = 0;
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % 4];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
}
const _n = new THREE.Vector3(), _c = new THREE.Vector3();
function placeCard() {
  // 1) 屏幕朝向：背对相机时淡出卡片
  screen.getWorldPosition(_c);
  _n.set(0, 0, 1).applyQuaternion(screen.getWorldQuaternion(new THREE.Quaternion()));
  const facing = _n.dot(camera.position.clone().sub(_c).normalize());
  if (facing < 0.08) {
    uiCard.style.opacity = '0'; uiCard.style.pointerEvents = 'none';
    return false;
  }
  // 2) 四角投影到舞台 CSS 像素
  const r = renderer.domElement.getBoundingClientRect();
  const pts = [];
  for (const [lx, ly] of _corner) {
    _v.set(lx, ly, 0); screen.localToWorld(_v);
    const camSpace = _v.clone().applyMatrix4(camera.matrixWorldInverse);
    if (camSpace.z > -0.2) return fallback();       // 在相机后 → 降级
    _v.project(camera);
    pts.push([
      (_v.x * 0.5 + 0.5) * r.width + stage.clientLeft,
      (-_v.y * 0.5 + 0.5) * r.height + stage.clientTop,
    ]);
  }
  if (quadArea(pts) < 1500 || pts.some(p => !isFinite(p[0]) || !isFinite(p[1]))) return fallback();
  // 3b) 四角向形心内收 7%：让 3D 屏幕的 CanvasTexture 波形露出一圈"画框"
  const cx = (pts[0][0] + pts[2][0]) / 2, cy = (pts[0][1] + pts[2][1]) / 2;
  const inset = pts.map(([x, y]) => [cx + (x - cx) * 0.86, cy + (y - cy) * 0.86]);
  // 3) 解单应矩阵 → matrix3d（列主序）
  const H = solveHomography([[0,0],[cardW,0],[cardW,cardH],[0,cardH]], inset);
  if (!H) return fallback();
  const [[a,b,c],[d,e,f],[g,h]] = H;
  uiCard.classList.remove('fallback');
  uiCard.style.opacity = '1'; uiCard.style.pointerEvents = 'auto';
  uiCard.style.transform =
    `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
  return true;
}
function fallback() {                 // 降级：卡片固定在舞台下方，依然可用
  if (!uiCard.classList.contains('fallback')) {
    uiCard.classList.add('fallback');
    uiCard.style.transform = ''; uiCard.style.opacity = '1'; uiCard.style.pointerEvents = 'auto';
  }
  return false;
}

/* ============ 自适应 ============ */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  cacheCardSize();
}
new ResizeObserver(resize).observe(stage);
window.addEventListener('resize', resize);
resize();

/* ============ 主循环 ============ */
const clock = new THREE.Clock();
let booted = false;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  // 旋转物理：拖拽惯性衰减 + 纵轴弹簧回正 + 闲置缓自转
  if (!dragging) {
    rotY += velY; velY *= Math.pow(0.06, dt);       // 惯性阻尼
    rotX += (0 - rotX) * Math.min(1, dt * 3.2);      // 弹簧回正
    idleT += dt;
    if (idleT > 2.5) rotY += dt * 0.22;              // 闲置缓慢展示
  }
  speaker.rotation.y = rotY; speaker.rotation.x = rotX * 0.6;
  // 发光环呼吸 + 播放时随节拍跳
  ringMat.emissiveIntensity = 1.9 + 0.35 * Math.sin(t * 2.1) + (playing ? 0.5 * Math.abs(Math.sin(t * 5.2)) : 0);
  drawScreen(t);
  placeCard();
  renderer.render(scene, camera);
  if (!booted) { booted = true; document.body.classList.add('ready'); } // 完成态可达
}
tick();
