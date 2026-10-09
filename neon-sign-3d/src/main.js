/* neon-sign-3d · src/main.js
 * 行为层：JS 门控 → 加载态 → Three.js 霓虹灯牌
 * （程序化砖墙 + 灯管文字贴图 + 多层辉光 sprite 模拟 bloom + 电流闪烁/接触不良 + 鼠标临近增亮 + 开关灯）
 * 手法借鉴：酒吧/潮牌霓虹招牌的灯管发光与电流闪烁。代码全部原创实现。
 */
import * as THREE from 'three';

document.documentElement.classList.add('js');

const $ = (s) => document.querySelector(s);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= 1. 加载态：保证完成态可达 ================= */
let readyDone = false;
function markReady() {
  if (readyDone) return;
  readyDone = true;
  document.documentElement.classList.add('done');
  beginStrike(); // 通电：灯管起辉
}
window.addEventListener('load', () => setTimeout(markReady, 450));
setTimeout(markReady, 3200); // 兜底：load 迟迟不来也必须进完成态

/* ================= 2. 配色（一档霓虹） ================= */
const NEONS = { pink: 0xff2d95, cyan: 0x22d3ee, orange: 0xfb923c };
const NEON_CSS = { pink: '#ff2d95', cyan: '#22d3ee', orange: '#fb923c' };
let neonKey = 'pink';

/* ================= 3. 程序化砖墙纹理 ================= */
function makeBrickTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = '#0a0a0f'; // 灰缝
  x.fillRect(0, 0, S, S);
  const bw = 128, bh = 48, gap = 7;
  let row = 0;
  for (let yy = 0; yy < S + bh; yy += bh + gap, row++) {
    const off = (row % 2) * (bw / 2);
    for (let xx = -bw; xx < S + bw; xx += bw + gap) {
      const bx = xx + off;
      // 每块砖独立明暗：压得很暗，保持全页三色纪律
      const v = 13 + Math.random() * 11;
      const warm = Math.random() * 5;
      x.fillStyle = 'rgb(' + (v + warm | 0) + ',' + (v * 0.92 | 0) + ',' + (v * 1.06 | 0) + ')';
      x.fillRect(bx, yy, bw, bh);
      // 砖面斑驳
      for (let i = 0; i < 34; i++) {
        const a = Math.random() * 0.05;
        x.fillStyle = Math.random() < 0.5 ? 'rgba(245,243,255,' + a.toFixed(3) + ')' : 'rgba(0,0,0,' + a.toFixed(3) + ')';
        x.fillRect(bx + Math.random() * bw, yy + Math.random() * bh, 2 + Math.random() * 5, 2 + Math.random() * 4);
      }
      // 浮雕：上亮下暗
      x.fillStyle = 'rgba(245,243,255,0.05)';
      x.fillRect(bx, yy, bw, 3);
      x.fillStyle = 'rgba(0,0,0,0.4)';
      x.fillRect(bx, yy + bh - 4, bw, 4);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ================= 4. 灯管文字贴图 ================= */
const SW = 2048, SH = 1024;
const FONT_STACK = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",system-ui,sans-serif';

function roundRectPath(x, X, Y, W, H, R) {
  x.beginPath();
  x.moveTo(X + R, Y);
  x.arcTo(X + W, Y, X + W, Y + H, R);
  x.arcTo(X + W, Y + H, X, Y + H, R);
  x.arcTo(X, Y + H, X, Y, R);
  x.arcTo(X, Y, X + W, Y, R);
  x.closePath();
}

/* 排版：逐字测量，返回每字 {ch, cx(u), w(u)} 与字号 */
function layoutChars(ctx, text) {
  let fs = 340;
  const tracking = () => fs * 0.12;
  let widths = [];
  while (fs > 60) {
    ctx.font = '900 ' + fs + 'px ' + FONT_STACK;
    widths = Array.from(text).map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + tracking() * (text.length - 1);
    if (total <= SW * 0.8) break;
    fs -= 12;
  }
  const total = widths.reduce((a, b) => a + b, 0) + tracking() * (text.length - 1);
  let cx = (SW - total) / 2;
  return Array.from(text).map((ch, i) => {
    const w = widths[i];
    const r = { ch, u: (cx + w / 2) / SW, wu: w / SW, fs };
    cx += w + tracking();
    return r;
  });
}

function paintBackplate(x) {
  // 挂墙背板
  roundRectPath(x, SW * 0.055, SH * 0.14, SW * 0.89, SH * 0.72, 64);
  x.fillStyle = 'rgba(13,13,19,0.94)';
  x.fill();
  x.lineWidth = 3;
  x.strokeStyle = 'rgba(245,243,255,0.07)';
  x.stroke();
  // 顶部高光线
  x.fillStyle = 'rgba(245,243,255,0.05)';
  x.fillRect(SW * 0.055 + 64, SH * 0.14 + 6, SW * 0.89 - 128, 3);
  // 两根吊线
  x.strokeStyle = 'rgba(245,243,255,0.10)';
  x.lineWidth = 5;
  for (const fx of [0.3, 0.7]) {
    x.beginPath();
    x.moveTo(SW * fx, 0);
    x.lineTo(SW * fx, SH * 0.14);
    x.stroke();
  }
}

/* lit=true 灯管发光三层；lit=false 熄灯玻璃管（暗） */
function drawSign(text, lit) {
  const c = document.createElement('canvas');
  c.width = SW; c.height = SH;
  const x = c.getContext('2d');
  const neon = NEON_CSS[neonKey];
  paintBackplate(x);
  if (!text) {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { texture: t, chars: [] };
  }
  const chars = layoutChars(x, text);
  const fs = chars.length ? chars[0].fs : 200;
  x.textBaseline = 'middle';
  x.textAlign = 'left';
  x.lineJoin = 'round';
  x.lineCap = 'round';
  const y = SH * 0.53;
  const passes = lit ? [
    { w: fs * 0.16, style: neon, alpha: 0.30, blur: fs * 0.28 },  // 外层光晕
    { w: fs * 0.075, style: neon, alpha: 0.95, blur: fs * 0.12 }, // 灯管本体
    { w: fs * 0.028, style: '#ffffff', alpha: 0.95, blur: fs * 0.05 }, // 白热灯芯
  ] : [
    { w: fs * 0.075, style: '#2e2e38', alpha: 1, blur: 0 },  // 熄灯玻璃管
    { w: fs * 0.028, style: '#3d3d4a', alpha: 1, blur: 0 },
  ];
  let pen = 0;
  // 首字 pen 起点需与 layoutChars 的居中起点一致
  const totalW = chars.reduce((a, ch) => a + ch.wu * SW, 0) + fs * 0.12 * (chars.length - 1);
  let px = (SW - totalW) / 2;
  for (const pass of passes) {
    x.globalAlpha = pass.alpha;
    x.strokeStyle = pass.style;
    x.lineWidth = pass.w;
    x.shadowColor = lit ? neon : 'transparent';
    x.shadowBlur = pass.blur;
    px = (SW - totalW) / 2;
    for (const ch of chars) {
      x.strokeText(ch.ch, px, y);
      px += ch.wu * SW + fs * 0.12;
    }
  }
  x.globalAlpha = 1;
  x.shadowBlur = 0;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { texture: t, chars };
}

/* ================= 5. 辉光 sprite 纹理（径向） ================= */
function makeGlowTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.16)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ================= 6. 场景 ================= */
const SIGN_W = 13.5, SIGN_H = 6.75, SIGN_Y = 0.35, SIGN_Z = 0;
let renderer, scene, camera, wallMat, tubeMat, unlitMat, wash, spriteGroup;
let chars = [];      // 当前每字 {u, sprite, boost}
let glowTex = null;

function fitWall() {
  const dist = camera.position.z + 6; // camera z, wall z=-6
  const h = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const w = h * camera.aspect;
  const mesh = scene.getObjectByName('wall');
  mesh.scale.set(w * 1.06, h * 1.06, 1);
  const tex = wallMat.map;
  tex.repeat.set((w / h) * 0.75, 1.5); // 砖块保持正方形观感
}

/* 响应式：窄屏拉远相机，保证灯牌横向完整入画 */
function fitCamera() {
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const needW = SIGN_W * 1.06;
  camera.position.z = Math.max(20, needW / (2 * t * camera.aspect));
}

function initGL() {
  const bg = $('#bg');
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight);
  bg.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);
  camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 160);
  camera.position.set(0, 0.6, 20);
  fitCamera();

  // 砖墙
  wallMat = new THREE.MeshBasicMaterial({ map: makeBrickTexture() });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), wallMat);
  wall.name = 'wall';
  wall.position.z = -6;
  scene.add(wall);

  // 灯管（发光层，additive）
  tubeMat = new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const tube = new THREE.Mesh(new THREE.PlaneGeometry(SIGN_W, SIGN_H), tubeMat);
  tube.name = 'tube';
  tube.position.set(0, SIGN_Y, SIGN_Z);
  scene.add(tube);

  // 熄灯玻璃管（关灯时显现）
  unlitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const unlit = new THREE.Mesh(new THREE.PlaneGeometry(SIGN_W, SIGN_H), unlitMat);
  unlit.position.set(0, SIGN_Y, SIGN_Z - 0.06);
  scene.add(unlit);

  // 墙面洗光：霓虹洒在砖墙上的大光斑
  glowTex = makeGlowTexture();
  wash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  wash.scale.set(21, 12, 1);
  wash.position.set(0, SIGN_Y, -1.2);
  scene.add(wash);

  // 逐字辉光 sprite（鼠标临近增亮的载体）
  spriteGroup = new THREE.Group();
  scene.add(spriteGroup);

  fitWall();
  buildSign($('#txt').value.trim());
  recolor();
}

function buildSign(text) {
  const lit = drawSign(text, true);
  const unlit = drawSign(text, false);
  if (tubeMat.map) tubeMat.map.dispose();
  if (unlitMat.map) unlitMat.map.dispose();
  tubeMat.map = lit.texture;
  unlitMat.map = unlit.texture;
  tubeMat.needsUpdate = unlitMat.needsUpdate = true;

  // 重建逐字 sprite
  while (spriteGroup.children.length) {
    const s = spriteGroup.children.pop();
    s.material.dispose();
  }
  chars = lit.chars.map((ch) => {
    const m = new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sp = new THREE.Sprite(m);
    const s = Math.max(2.6, ch.fs / SH * SIGN_H * 2.1) * 1.5;
    sp.scale.set(s, s, 1);
    sp.position.set((ch.u - 0.5) * SIGN_W, SIGN_Y, SIGN_Z + 0.7);
    spriteGroup.add(sp);
    return { u: ch.u, sprite: sp, boost: 0, baseScale: s };
  });
}

function recolor() {
  const hex = NEONS[neonKey];
  wash.material.color.setHex(hex);
  for (const ch of chars) ch.sprite.material.color.setHex(hex);
  document.documentElement.style.setProperty('--neon', NEON_CSS[neonKey]);
}

/* ================= 7. 电流闪烁 + 开关灯 ================= */
let power = 0;          // 当前功率 0..1
let powerOn = true;     // 开关目标
let envT = -1;          // 起辉/熄灭包络计时（<0 表示无包络）
let envKind = null;     // 'strike' | 'sputter'
const STRIKE_KEYS = [[0, 0], [0.07, 1], [0.13, 0.12], [0.21, 1], [0.3, 0.35], [0.38, 1], [1, 1]];
const SPUTTER_KEYS = [[0, 1], [0.14, 0.25], [0.24, 0.85], [0.38, 0.1], [0.52, 0.55], [0.68, 0.05], [1, 0]];
const ENV_DUR = 0.7;

function envValue(keys, t) {
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      const k = (t - t0) / Math.max(1e-6, t1 - t0);
      return v0 + (v1 - v0) * k;
    }
  }
  return keys[keys.length - 1][1];
}
function beginStrike() { powerOn = true; envKind = 'strike'; envT = 0; }
function beginSputter() { powerOn = false; envKind = 'sputter'; envT = 0; }

let flickAmt = 0.55;    // 闪烁强度滑杆 0..1
let dropT = 0, dropDepth = 0.3, dropPhase = 0;

function updatePowerFlicker(dt, t) {
  // 包络（起辉/熄灭）
  if (envT >= 0) {
    envT += dt;
    const k = Math.min(1, envT / ENV_DUR);
    power = envValue(envKind === 'strike' ? STRIKE_KEYS : SPUTTER_KEYS, k);
    if (k >= 1) { envT = -1; power = powerOn ? 1 : 0; }
  } else {
    power += ((powerOn ? 1 : 0) - power) * (1 - Math.exp(-dt * 10));
  }
  // 电流：市电哼鸣 + 接触不良抖动
  const humAmp = reduced ? 0.02 : 0.07;
  let f = 1 - humAmp + humAmp * (0.55 * Math.sin(t * 43) + 0.45 * Math.sin(t * 29.7 + 1.7));
  if (!reduced && powerOn && flickAmt > 0.01) {
    if (dropT > 0) {
      dropT -= dt;
      const buzz = 0.5 + 0.5 * Math.sin(t * 160 + dropPhase);
      f *= dropDepth + (1 - dropDepth) * buzz;
    } else if (Math.random() < dt * flickAmt * 2.4) {
      dropT = 0.05 + Math.random() * 0.15;
      dropDepth = 0.15 + Math.random() * 0.35;
      dropPhase = Math.random() * 6.28;
    }
  }
  return power * f;
}

/* ================= 8. 鼠标临近增亮 ================= */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2(-2, -2);
let mouseU = -1, pointerIn = false;
let parX = 0, parY = 0;

window.addEventListener('pointermove', (e) => {
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  parX = ndc.x; parY = ndc.y;
  if (!renderer) return;
  raycaster.setFromCamera(ndc, camera);
  const tube = scene.getObjectByName('tube');
  const hit = raycaster.intersectObject(tube, false)[0];
  if (hit && hit.uv) { mouseU = hit.uv.x; pointerIn = true; }
  else { pointerIn = false; }
}, { passive: true });
window.addEventListener('pointerleave', () => { pointerIn = false; });

/* ================= 9. 主循环 ================= */
let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (!renderer) return;
  const t = now / 1000;

  const I = updatePowerFlicker(dt, t); // 全局发光强度 0..1

  // 灯管层：颜色强度随电流
  tubeMat.color.setHex(NEONS[neonKey]).multiplyScalar(0.04 + 0.96 * I);
  // 熄灯玻璃管：关灯时显现
  unlitMat.opacity = (1 - power) * 0.9;
  // 墙面洗光
  wash.material.opacity = 0.30 * I;
  // 砖墙随电流轻微呼吸（灯光洒在墙上）
  wallMat.color.setScalar(0.82 + 0.18 * I);

  // 逐字辉光：基底 + 鼠标临近增亮（指数追踪，有物理感）
  const k = 1 - Math.exp(-dt * 9);
  for (const ch of chars) {
    let target = 0;
    if (pointerIn && power > 0.02) {
      const du = (ch.u - mouseU) / 0.05;
      target = 0.85 * Math.exp(-du * du);
    }
    ch.boost += (target - ch.boost) * k;
    ch.sprite.material.opacity = Math.min(1, I * (0.30 + ch.boost * 1.6));
    const s = ch.sprite.scale.x;
    const sT = ch.baseScale * (1 + ch.boost * 0.22);
    ch.sprite.scale.set(s + (sT - s) * k, s + (sT - s) * k, 1);
  }

  // 相机视差（轻微）
  if (!reduced) {
    camera.position.x += (parX * 0.9 - camera.position.x) * (1 - Math.exp(-dt * 3));
    camera.position.y += ((0.6 + parY * 0.5) - camera.position.y) * (1 - Math.exp(-dt * 3));
    camera.lookAt(0, SIGN_Y, 0);
  }

  renderer.render(scene, camera);
}

/* ================= 10. 控制条 ================= */
function wireUI() {
  const txt = $('#txt'), sw = $('#sw'), flick = $('#flick'), pwr = $('#pwr');

  let deb = null;
  const rebuild = () => buildSign(txt.value.trim());
  txt.addEventListener('input', () => {
    clearTimeout(deb);
    deb = setTimeout(rebuild, 280);
  });
  txt.addEventListener('change', () => { clearTimeout(deb); rebuild(); });

  sw.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-neon]');
    if (!b || b.dataset.neon === neonKey) return;
    neonKey = b.dataset.neon;
    sw.querySelectorAll('button').forEach((el) => el.classList.toggle('on', el === b));
    recolor();
    buildSign(txt.value.trim()); // 灯管贴图按新霓虹色重绘
  });

  flick.addEventListener('input', () => { flickAmt = flick.value / 100; });

  pwr.addEventListener('click', () => {
    if (powerOn) { beginSputter(); pwr.textContent = '开灯'; pwr.classList.remove('on'); }
    else { beginStrike(); pwr.textContent = '关灯'; pwr.classList.add('on'); }
  });
}

window.addEventListener('resize', () => {
  if (!renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  fitCamera();
  fitWall();
});

/* ================= 11. 启动 ================= */
try {
  initGL();
  wireUI();
} catch (e) {
  const bg = $('#bg');
  if (bg) bg.style.display = 'none';
  markReady();
}
requestAnimationFrame(frame);
