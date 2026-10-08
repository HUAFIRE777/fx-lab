/* huafire3d fx-lab — original implementation · teaser-reveal-3d
 * 黑场剪影 + 指针撕幕布 + 发布信息揭晓。
 * 图层：#gl(3D 真容) < #curtain(2D 幕布,可擦除) < 文案。
 * 隐藏等 JS 的元素一律由 JS 设初始态（CSS 默认可见），保证无 JS/无 WebGL 仍可读。
 */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from '../vendor/addons/loaders/DRACOLoader.js';
import { DRACO_WRAPPER_SRC, DRACO_WASM_B64 } from './draco-assets.js';
import { CONFIG } from './config.js';

// Draco 解码库内联：单文件构建零额外请求也能解 Draco 压缩模型。
class InlineDRACOLoader extends DRACOLoader {
  _loadLibrary(url, responseType) {
    if (url === 'draco_wasm_wrapper.js') return Promise.resolve(DRACO_WRAPPER_SRC);
    if (url === 'draco_decoder.wasm') {
      const bin = atob(DRACO_WASM_B64);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return Promise.resolve(buf.buffer);
    }
    return super._loadLibrary(url, responseType);
  }
}

const $ = (id) => document.getElementById(id);
const EASE = 'power3.out';

// ---------- 程序化剪影（R2 模型不可用时的兜底，保证首屏完整） ----------
function proceduralFallback() {
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x141416, metalness: 0.6, roughness: 0.42 });
  const rim = new THREE.MeshStandardMaterial({
    color: 0xe8341c, metalness: 0.4, roughness: 0.4, emissive: 0xe8341c, emissiveIntensity: 0.55,
  });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.085, 20, 48, Math.PI), dark);
  g.add(band);
  [-1, 1].forEach((s) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.26, 32), dark);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(s * 0.88, -0.08, 0);
    g.add(cup);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 12, 40), rim);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(s * (0.88 + 0.14), -0.08, 0);
    g.add(ring);
  });
  return g;
}

// ---------- 3D 舞台：被幕布盖住的"真容" ----------
function createStage(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x000000, 1);
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(0, 0.35, 5.4);
  camera.lookAt(0, 0, 0);

  // 红色轮廓光（悬念感的来源）+ 白色主光（真容质感）
  const rimLight = new THREE.PointLight(0xe8341c, 90, 30);
  rimLight.position.set(-2.6, 1.6, -2.2);
  scene.add(rimLight);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(2.4, 3.2, 4.2);
  scene.add(keyLight);
  scene.add(new THREE.AmbientLight(0x303036, 0.9));

  // 产品后方极淡的红色光晕
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    const grd = x.createRadialGradient(128, 128, 8, 128, 128, 128);
    grd.addColorStop(0, 'rgba(232,52,28,0.55)');
    grd.addColorStop(1, 'rgba(232,52,28,0)');
    x.fillStyle = grd; x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 7),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.5, depthWrite: false })
  );
  glow.position.set(0, 0, -2.4);
  scene.add(glow);

  // 悬浮微尘：手工细节
  const dust = (() => {
    const n = 130, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 2] = -1 - Math.random() * 4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xe8341c, size: 0.02, transparent: true, opacity: 0.55,
    }));
    scene.add(pts);
    return pts;
  })();

  const productGroup = new THREE.Group();
  scene.add(productGroup);

  const resize = (w, h, pr) => {
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  return { renderer, scene, camera, productGroup, dust, resize };
}

// ---------- 幕布：2D canvas，指针擦除；剪影缓慢旋转 ----------
function createCurtain(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  // mask：全不透明黑，擦除戳打出透明洞（持久层）
  const mask = document.createElement('canvas');
  const mctx = mask.getContext('2d');
  // 擦除计数网格
  const GW = 48, GH = 30;
  const grid = new Uint8Array(GW * GH);
  let marked = 0;

  // 噪点贴片
  const noise = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 140;
    const x = c.getContext('2d');
    const img = x.createImageData(140, 140);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255 | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 16;
    }
    x.putImageData(img, 0, 0);
    return c;
  })();

  // 程序化耳机剪影（离屏，红边微光）
  const silhouette = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 480;
    const x = c.getContext('2d');
    const dark = '#151517';
    x.lineCap = 'round';
    // 头梁
    x.strokeStyle = dark; x.lineWidth = 38;
    x.beginPath(); x.arc(240, 258, 148, Math.PI * 1.14, Math.PI * 1.86); x.stroke();
    // 耳罩
    const ends = [Math.PI * 1.14, Math.PI * 1.86].map((a) => [240 + 148 * Math.cos(a), 258 + 148 * Math.sin(a)]);
    x.fillStyle = dark;
    ends.forEach(([ex, ey]) => {
      x.beginPath();
      x.roundRect(ex - 44, ey - 58, 88, 116, 34);
      x.fill();
    });
    // 红色边缘光
    x.save();
    x.strokeStyle = 'rgba(232,52,28,0.85)'; x.lineWidth = 3;
    x.shadowColor = '#e8341c'; x.shadowBlur = 26;
    x.beginPath(); x.arc(240, 258, 148, Math.PI * 1.14, Math.PI * 1.86); x.stroke();
    ends.forEach(([ex, ey]) => {
      x.beginPath(); x.roundRect(ex - 44, ey - 58, 88, 116, 34); x.stroke();
    });
    x.restore();
    return c;
  })();

  // 柔边擦除戳
  const stamp = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.62, 'rgba(0,0,0,0.95)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return c;
  })();

  let angle = 0;
  const resize = (w, h) => {
    W = w; H = h;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mask.width = w; mask.height = h;
    mctx.fillStyle = '#000'; mctx.fillRect(0, 0, w, h);
    grid.fill(0); marked = 0;
  };

  const eraseAt = (px, py) => {
    const r = Math.max(64, Math.min(W, H) * 0.075);
    mctx.save();
    mctx.globalCompositeOperation = 'destination-out';
    mctx.drawImage(stamp, px - r, py - r, r * 2, r * 2);
    mctx.restore();
    // 计数
    const cx = Math.floor((px / W) * GW), cy = Math.floor((py / H) * GH);
    for (let yy = cy - 1; yy <= cy + 1; yy++) {
      for (let xx = cx - 1; xx <= cx + 1; xx++) {
        if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue;
        const i = yy * GW + xx;
        if (!grid[i]) { grid[i] = 1; marked++; }
      }
    }
  };

  const draw = (dt) => {
    angle += dt * 0.12;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = ctx.createPattern(noise, 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // 旋转的剪影
    const s = Math.min(W, H) * 0.52;
    ctx.save();
    ctx.translate(W / 2, H * 0.44);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.92;
    ctx.drawImage(silhouette, -s / 2, -s / 2, s, s);
    ctx.restore();
    // 用 mask 打洞
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0, W, H);
    ctx.restore();
  };

  return {
    resize, draw, eraseAt,
    ratio: () => marked / (GW * GH),
  };
}

function daysLeft() {
  const ms = new Date(CONFIG.countdownTarget).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

async function main() {
  const params = new URLSearchParams(location.search);
  const debugOpen = params.get('state') === 'open';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const glBox = $('gl'), curtainEl = $('curtain'), loading = $('loading');

  // 倒计时文案
  const d = daysLeft();
  $('cdDays').textContent = d <= 0 ? '就是今天' : String(d);
  $('cdUnit').textContent = d <= 0 ? '' : '天后揭晓';

  // 发布区初始态（JS 设，CSS 默认可见）
  const revealKids = [...document.querySelectorAll('#reveal > *')];
  if (!debugOpen) {
    revealKids.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
    });
    $('reveal').style.visibility = 'hidden';
  }

  // --- 3D ---
  let stage = null;
  try {
    stage = createStage(glBox);
  } catch (err) {
    console.warn('[teaser] WebGL unavailable:', err);
  }
  const pr = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);
  const doResize = () => {
    stage && stage.resize(innerWidth, innerHeight, pr);
    curtain.resize(innerWidth, innerHeight);
  };

  // --- 幕布 ---
  const curtain = createCurtain(curtainEl);
  doResize();
  addEventListener('resize', doResize);

  let revealed = false;
  const hintEl = $('hint');
  const setHint = (t) => { hintEl.textContent = t; };

  const eraseMove = (e) => {
    const r = curtainEl.getBoundingClientRect();
    curtain.eraseAt(e.clientX - r.left, e.clientY - r.top);
    const pct = Math.round(curtain.ratio() * 100);
    setHint(pct > 4 ? `继续 — 已揭开 ${pct}%` : (coarse ? '按住滑动，揭开幕布' : '按住并拖拽，亲手揭开它'));
    if (!revealed && curtain.ratio() >= CONFIG.revealThreshold) {
      revealed = true;
      finishReveal();
    }
  };
  let erasing = false;
  curtainEl.addEventListener('pointerdown', (e) => {
    if (revealed) return;
    erasing = true;
    curtainEl.setPointerCapture(e.pointerId);
    curtainEl.style.cursor = 'grabbing';
    eraseMove(e);
  });
  curtainEl.addEventListener('pointermove', (e) => { if (erasing && !revealed) eraseMove(e); });
  const endErase = () => { erasing = false; curtainEl.style.cursor = 'grab'; };
  curtainEl.addEventListener('pointerup', endErase);
  curtainEl.addEventListener('pointercancel', endErase);

  function finishReveal() {
    setHint('');
    // 幕布整体撕掉
    gsap.to(curtainEl, {
      opacity: 0, duration: 1.3, ease: 'power2.inOut',
      onComplete: () => curtainEl.remove(),
    });
    // 发布信息逐行浮现
    $('reveal').style.visibility = 'visible';
    gsap.to(revealKids, {
      opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.12, delay: 0.55,
    });
    gsap.to('#countdown', { opacity: 0, duration: 0.6 });
  }
  if (debugOpen) {
    revealed = true;
    curtainEl.remove();
    setHint('');
    $('countdown').style.opacity = '0';
  }

  // --- 模型加载（R2，失败/超时走程序化兜底） ---
  const settle3d = (obj, note) => {
    if (!stage) return;
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 2.5 / Math.max(size.x, size.y, size.z);
    obj.scale.setScalar(s);
    obj.position.copy(center).multiplyScalar(-s);
    obj.position.y += 0.1;
    stage.productGroup.add(obj);
    if (note) console.warn(note);
    loading.classList.add('done');
    setTimeout(() => loading.remove(), 700);
  };
  if (stage) {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) { settled = true; settle3d(proceduralFallback(), '[teaser] model load timed out, procedural fallback used'); }
    }, CONFIG.loadTimeoutMs);
    try {
      const loader = new GLTFLoader();
      loader.setDRACOLoader(new InlineDRACOLoader());
      loader.load(CONFIG.modelUrl,
        (gltf) => { if (!settled) { settled = true; clearTimeout(timer); settle3d(gltf.scene); } },
        undefined,
        () => { if (!settled) { settled = true; clearTimeout(timer); settle3d(proceduralFallback(), '[teaser] R2 model unavailable (CORS), procedural fallback used'); } });
    } catch (err) {
      if (!settled) { settled = true; clearTimeout(timer); settle3d(proceduralFallback(), '[teaser] loader threw, procedural fallback used'); }
    }
  } else {
    loading.remove();
  }

  // --- 订阅表单 ---
  $('subForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('subEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      $('subEmail').focus();
      $('subEmail').style.borderColor = '#e8341c';
      return;
    }
    $('subForm').style.display = 'none';
    const ok = $('subOk');
    ok.textContent = '订阅成功。发布当天，第一时间发到你的邮箱。';
    ok.style.opacity = '1';
  });

  // --- 主循环 ---
  const clock = new THREE.Clock();
  const tick = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!revealed && !reducedMotion) curtain.draw(dt);
    if (stage) {
      if (!reducedMotion) {
        stage.productGroup.rotation.y += dt * 0.32;
        stage.productGroup.position.y = Math.sin(t * 0.7) * 0.06;
        stage.camera.position.x = Math.sin(t * 0.22) * 0.35;
        stage.camera.lookAt(0, 0, 0);
        const p = stage.dust.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          let y = p.getY(i) + dt * 0.12;
          if (y > 2.6) y = -2.6;
          p.setY(i, y);
        }
        p.needsUpdate = true;
      }
      stage.renderer.render(stage.scene, stage.camera);
    }
    requestAnimationFrame(tick);
  };
  tick();
}

main();
