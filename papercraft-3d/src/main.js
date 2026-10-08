/* main.js — 入口：滚动驱动阿纸行走，相机跟随 + 手持晃动，章节翻页转场。
 * 全部参数集中在 CONFIG。 */
import * as THREE from 'three';
import { buildDiorama, chapterOf, CHAPTERS } from './diorama.js';
import { createWalker } from './walker.js';

const CONFIG = {
  scrollVh: 460,            // 页面总高（视口倍数）：散步的路程
  camOffset: [2.4, 5.4, 13.0],  // 相机相对小人的偏移
  lookAhead: [1.6, 1.9, 0],     // 视线前瞻
  swayAmp: 0.22,           // 手持晃动幅度（米）
  smoothK: 4.2,            // 滚动平滑系数（阻尼感）
  camK: 3.0,               // 相机跟随阻尼
  dprDesktop: 2, dprMobile: 1.25,
  wipeMs: 720,             // 纸页翻动时长
};

const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 768px)').matches;
const QS = new URLSearchParams(location.search);
const NOGL = QS.has('nogl');   // 测试钩子：跳过 WebGL，只跑场景搭建 + DOM 逻辑
const LOWFX = QS.has('lowfx'); // 测试钩子：降质渲染（无阴影/无抗锯齿/像素比1）
const STILL = QS.get('still'); // 测试钩子：分块摆拍 "FW,FH,TX,TY,TW,TH"（视角偏移）
const FREEZE = QS.has('freeze'); // 测试钩子：只渲染一帧后停止 rAF
const SCROLLFRAC = parseFloat(QS.get('scrollfrac') || '0');

/* ---------- 渲染器 / 场景 ---------- */
const stage = $('stage');
let renderer = null;
if (!NOGL) {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !LOWFX, powerPreference: 'high-performance' });
    renderer.setPixelRatio(LOWFX ? 1 : Math.min(devicePixelRatio || 1, isMobile ? CONFIG.dprMobile : CONFIG.dprDesktop));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = !LOWFX;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    stage.appendChild(renderer.domElement);
  } catch (err) {
    // WebGL 不可用：显示静态海报兜底，不白屏
    document.body.classList.add('broken');
  }
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#F7F0E1');
scene.fog = new THREE.Fog('#F1E7CE', 34, 95);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 260);
// 静态摆拍：分块渲染全部分辨率（无头 SwiftShader 大窗口会 OOM）
// 测试钩子 clean：隐藏 DOM 覆盖层，只拍 3D
if (QS.has('clean')) { document.body.classList.add('clean'); document.documentElement.classList.add('clean'); }
if (QS.has('domonly')) { document.body.classList.add('domonly'); document.documentElement.classList.add('domonly'); }
if (QS.get('chroma')) document.body.style.background = '#' + QS.get('chroma'); // 抠像底
if (FREEZE) document.body.classList.add('freeze');
let stillSpec = null;
if (STILL && renderer) {
  const [FW, FH, TX, TY, TW, TH] = STILL.split(',').map(Number);
  stillSpec = { FW, FH, TX, TY, TW, TH };
  renderer.setSize(TW, TH);
  camera.aspect = TW / TH;
  camera.setViewOffset(FW, FH, TX, TY, TW, TH);
  camera.updateProjectionMatrix();
}
/* ---------- 滚动驱动（声明提前：摆拍 snap 在模块顶部就要用） ---------- */
let target = 0, smooth = 0;
function readScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  target = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
}
// 静态摆拍：直接跳到指定滚动位置
if (SCROLLFRAC > 0) {
  const max = document.documentElement.scrollHeight - innerHeight;
  scrollTo(0, max * SCROLLFRAC);
  readScroll();
  target = Math.min(1, Math.max(0, SCROLLFRAC));
  smooth = target;
}

// 纸世界用光：柔光半球 + 暖阳
scene.add(new THREE.HemisphereLight('#FFFDF4', '#9CAF88', 0.95));
const sun = new THREE.DirectionalLight('#FFEFD2', 1.6);
sun.position.set(-18, 26, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
sun.shadow.camera.far = 80;
sun.shadow.bias = -0.002;
scene.add(sun);
scene.add(new THREE.AmbientLight('#F7F0E1', 0.25));

const world = buildDiorama(scene);
const walker = createWalker();
scene.add(walker.group);

/* ---------- 章节 / 字幕 ---------- */
const capKicker = $('cap-kicker'), capLine = $('cap-line'), capCard = $('cap-card');
const crumb = [...document.querySelectorAll('.crumb')];
const hero = $('hero');
let curChapter = -1;
let wipeTimer = 0;

function setChapter(i, instant) {
  if (i === curChapter) return;
  curChapter = i;
  const c = CHAPTERS[i];
  // 字幕：先收后放，带回弹
  capCard.classList.remove('pop');
  const apply = () => {
    capKicker.textContent = c.kicker;
    capLine.textContent = c.line;
    void capCard.offsetWidth;
    capCard.classList.add('pop');
  };
  if (instant || reduced) { apply(); }
  else setTimeout(apply, CONFIG.wipeMs * 0.45);
  crumb.forEach((el, k) => el.classList.toggle('on', k === i));
  // 纸页翻动：纸色整页扫过
  if (!instant && !reduced) {
    const w = $('wipe');
    w.classList.remove('go');
    void w.offsetWidth;
    w.classList.add('go');
    clearTimeout(wipeTimer);
    wipeTimer = setTimeout(() => w.classList.remove('go'), CONFIG.wipeMs + 60);
  }
}

/* ---------- 滚动监听 ---------- */
addEventListener('scroll', readScroll, { passive: true });
readScroll();

/* ---------- 鼠标视差（近景纸花） ---------- */
addEventListener('pointermove', e => {
  world.setParallax((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
}, { passive: true });

/* ---------- 印章：hover 盖章 ---------- */
const seal = $('seal');
seal.addEventListener('pointerenter', () => {
  seal.classList.remove('stamp');
  void seal.offsetWidth;
  seal.classList.add('stamp');
});

/* ---------- 主循环 ---------- */
const clock = new THREE.Clock();
const _p = new THREE.Vector3(), _t = new THREE.Vector3();
const _camWant = new THREE.Vector3(), _lookWant = new THREE.Vector3(), _lookCur = new THREE.Vector3(0, 2, 0);
let firstFrame = true;

function frame() {
  if (!FREEZE) requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  const time = clock.elapsedTime;

  // 阻尼滚动：物理跟手感
  smooth += (target - smooth) * (1 - Math.exp(-dt * CONFIG.smoothK));
  if (Math.abs(target - smooth) < 1e-4) smooth = target;

  // 阿纸行走
  const dist = smooth * world.pathLen;
  world.curve.getPointAt(smooth, _p);
  world.curve.getTangentAt(smooth, _t);
  walker.group.position.set(_p.x, 0, _p.z);
  walker.group.rotation.y = Math.atan2(_t.x, _t.z);
  walker.update(dist);

  // 章节判定（按小人位置）
  setChapter(chapterOf(_p.x), firstFrame);

  // 相机跟随 + 手持晃动（多正弦叠加噪声）
  const amp = reduced ? 0 : CONFIG.swayAmp;
  const sx = (Math.sin(time * 1.7) * 0.55 + Math.sin(time * 3.1 + 1.3) * 0.3 + Math.sin(time * 5.3 + 4.1) * 0.15) * amp;
  const sy = (Math.cos(time * 1.3 + 0.7) * 0.6 + Math.sin(time * 2.7 + 2.2) * 0.4) * amp * 0.7;
  _camWant.set(
    _p.x + CONFIG.camOffset[0] + sx,
    CONFIG.camOffset[1] + sy,
    _p.z + CONFIG.camOffset[2] + sx * 0.6
  );
  camera.position.lerp(_camWant, 1 - Math.exp(-dt * CONFIG.camK));
  _lookWant.set(_p.x + CONFIG.lookAhead[0], CONFIG.lookAhead[1], _p.z + CONFIG.lookAhead[2]);
  _lookCur.lerp(_lookWant, 1 - Math.exp(-dt * (CONFIG.camK + 1)));
  if (stillSpec || FREEZE) { // 摆拍：直接落位，不插值
    camera.position.copy(_camWant);
    _lookCur.copy(_lookWant);
  }
  camera.lookAt(_lookCur);

  // 开场标题随滚动淡出
  hero.style.opacity = String(Math.max(0, 1 - smooth * 9));
  hero.style.visibility = smooth > 0.12 ? 'hidden' : 'visible';

  world.update(dt, time, smooth);
  if (renderer) renderer.render(scene, camera);

  if (firstFrame) {
    firstFrame = false;
    document.body.classList.add('ready'); // 加载态完成，内容可达
  }
}
frame();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  if (renderer) renderer.setSize(innerWidth, innerHeight);
  readScroll();
});

/* ---------- 兜底：JS 异常也不白屏 ---------- */
addEventListener('error', () => document.body.classList.add('broken'), { once: true });
setTimeout(() => { if (firstFrame) document.body.classList.add('broken'); }, 12000);
