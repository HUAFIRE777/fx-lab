/* huafire3d fx-lab — original implementation · lead-magnet-3d
 * 左文案 + 表单 / 右 3D 白皮书：鼠标倾斜 + 点击翻页 + 表单提交成功态。
 * 全程序化几何（无外部模型），隐藏等 JS 的元素一律由 JS 设初始态（CSS 默认可见），
 * 保证无 JS / 无 WebGL 时文案与表单仍完整可用。
 */
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const EASE = 'power3.out';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 程序化贴图 ----------
function coverTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 680;
  const x = c.getContext('2d');
  x.fillStyle = '#14264d'; x.fillRect(0, 0, 512, 680);
  // 金色双线框
  x.strokeStyle = '#c9a227'; x.lineWidth = 3; x.strokeRect(28, 28, 456, 624);
  x.lineWidth = 1; x.strokeRect(40, 40, 432, 600);
  x.textAlign = 'center';
  x.fillStyle = '#c9a227';
  x.font = '700 44px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText('2026', 256, 180);
  x.fillStyle = '#ffffff';
  x.font = '800 64px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText('独立站', 256, 290);
  x.fillText('增长实战', 256, 372);
  x.fillStyle = '#c9a227'; x.fillRect(196, 420, 120, 3);
  x.fillStyle = 'rgba(255,255,255,.62)';
  x.font = '400 26px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText('7 个真实店铺拆解 · 40 万美金避坑清单', 256, 480);
  x.fillStyle = 'rgba(201,162,39,.85)';
  x.font = '700 24px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText('增长实验室', 256, 600);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function pageTexture(chapter, sub) {
  const c = document.createElement('canvas'); c.width = 480; c.height = 660;
  const x = c.getContext('2d');
  x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, 480, 660);
  x.textAlign = 'left';
  x.fillStyle = '#14264d';
  x.font = '800 34px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText(chapter, 48, 100);
  x.fillStyle = '#c9a227'; x.fillRect(48, 128, 64, 4);
  x.fillStyle = 'rgba(20,38,77,.5)';
  x.font = '400 24px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText(sub, 48, 176);
  // 正文行（示意性排版，非真实文字）
  x.fillStyle = 'rgba(20,38,77,.28)';
  let y = 230;
  while (y < 600) {
    const w = y % 96 < 48 ? 384 : 330;
    x.fillRect(48, y, w, 9);
    y += 34;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function pageEdgeTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#f4efe2'; x.fillRect(0, 0, 128, 256);
  x.fillStyle = 'rgba(20,38,77,.18)';
  for (let y = 4; y < 256; y += 5) x.fillRect(0, y, 128, 1);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------- 舞台 ----------
function createStage(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0.4, 9.2);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c2, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(4, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xfff3d6, 0.3);
  fill.position.set(-5, 2, 3);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ opacity: 0.16 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.35;
  ground.receiveShadow = true;
  scene.add(ground);

  // 书
  const book = new THREE.Group();
  const W = 2.6, H = 3.7, T = 0.34;
  const navy = new THREE.MeshStandardMaterial({ color: 0x14264d, roughness: 0.55, metalness: 0.08 });
  const navyDark = new THREE.MeshStandardMaterial({ color: 0x0e1a36, roughness: 0.6, metalness: 0.05 });

  // 书页块
  const edgeTex = pageEdgeTexture();
  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(W, H, T),
    new THREE.MeshStandardMaterial({ map: edgeTex, roughness: 0.9 })
  );
  pages.castShadow = true;
  book.add(pages);

  // 封面 / 封底
  const coverMat = new THREE.MeshStandardMaterial({ map: coverTexture(), roughness: 0.5, metalness: 0.1 });
  const front = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, H + 0.12, 0.07), [navy, navy, navy, navy, coverMat, navy]);
  front.position.z = T / 2 + 0.035;
  front.castShadow = true;
  book.add(front);
  const back = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, H + 0.12, 0.07), navy);
  back.position.z = -T / 2 - 0.035;
  book.add(back);

  // 书脊
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.2, H + 0.12, T + 0.16), navyDark);
  spine.position.x = -(W / 2 + 0.02);
  book.add(spine);

  // 可翻页（铰链在书脊处）
  const flipPages = [];
  const mkFlip = (chapter, sub, zOff) => {
    const geo = new THREE.PlaneGeometry(W - 0.12, H - 0.1);
    geo.translate((W - 0.12) / 2, 0, 0);
    const mat = new THREE.MeshStandardMaterial({
      map: pageTexture(chapter, sub), roughness: 0.9, side: THREE.DoubleSide,
    });
    const pivot = new THREE.Group();
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    pivot.add(m);
    pivot.position.set(-W / 2 + 0.06, 0, zOff);
    book.add(pivot);
    flipPages.push(pivot);
  };
  mkFlip('第一章 · 流量从哪来', '7 个店铺的真实来源拆解', T / 2 - 0.02);
  mkFlip('第二章 · 广告避坑清单', '40 万美金换来的 3 条教训', T / 2 - 0.1);

  book.rotation.set(0.06, -0.55, 0.02);
  scene.add(book);

  const resize = (w, h, pr) => {
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  return { renderer, scene, camera, book, flipPages, resize };
}

// ---------- 主流程 ----------
function main() {
  const glBox = $('gl'), loading = $('loading');

  // 表单成功态初始隐藏（JS 设，CSS 默认可见，保证无 JS 时文案仍可读）
  const formOk = $('formOk');
  formOk.style.display = 'none';

  // 入场初始态（JS 设）
  const copyKids = [...document.querySelectorAll('.copy > *')];
  if (!reducedMotion) {
    copyKids.forEach((el) => { el.style.opacity = '0'; el.style.transform = 'translateY(26px)'; });
    glBox.style.opacity = '0';
    glBox.style.transform = 'translateY(20px) scale(.97)';
  }

  let stage = null;
  try {
    stage = createStage(glBox);
  } catch (err) {
    console.warn('[lead] WebGL unavailable:', err);
    loading.classList.add('done');
    setTimeout(() => loading.remove(), 700);
  }
  const pr = Math.min(devicePixelRatio || 1, 2);
  const doResize = () => stage && stage.resize(glBox.clientWidth, glBox.clientHeight, pr);
  doResize();
  addEventListener('resize', doResize);

  // 鼠标倾斜
  let tx = 0, ty = 0, cx = 0, cy = 0;
  const baseRy = -0.55, baseRx = 0.06;
  addEventListener('pointermove', (e) => {
    const r = glBox.getBoundingClientRect();
    if (r.width === 0) return;
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });

  // 翻页
  const flipBtn = $('flipBtn');
  let opened = false, flipping = false;
  const FLIP_Y = -2.85;
  function toggleFlip() {
    if (!stage || flipping) return;
    flipping = true;
    const pages = stage.flipPages;
    if (reducedMotion) {
      pages.forEach((p) => { p.rotation.y = opened ? 0 : FLIP_Y; });
      opened = !opened;
      flipping = false;
      flipBtn.textContent = opened ? '合上' : '翻开看看';
      return;
    }
    const tl = gsap.timeline({ onComplete: () => {
      flipping = false;
      opened = !opened;
      flipBtn.textContent = opened ? '合上' : '翻开看看';
    } });
    if (!opened) {
      pages.forEach((p, i) => tl.to(p.rotation, { y: FLIP_Y, duration: 1.1, ease: 'power2.inOut' }, i * 0.45));
      tl.to(stage.book.rotation, { y: baseRy - 0.18, duration: 1.4, ease: EASE }, 0);
    } else {
      [...pages].reverse().forEach((p, i) => tl.to(p.rotation, { y: 0, duration: 1.0, ease: 'power2.inOut' }, i * 0.4));
      tl.to(stage.book.rotation, { y: baseRy, duration: 1.2, ease: EASE }, 0);
    }
  }
  flipBtn.addEventListener('click', toggleFlip);
  glBox.addEventListener('click', toggleFlip);

  // 表单
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  $('leadForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('fName'), email = $('fEmail');
    let ok = true;
    [name, email].forEach((el) => el.classList.remove('err'));
    if (!name.value.trim()) { name.classList.add('err'); ok = false; }
    if (!emailRe.test(email.value.trim())) { email.classList.add('err'); ok = false; }
    if (!ok) { (name.classList.contains('err') ? name : email).focus(); return; }
    $('leadForm').style.display = 'none';
    formOk.style.display = 'block';
    if (!reducedMotion) {
      formOk.style.opacity = '0';
      formOk.style.transform = 'translateY(14px)';
      gsap.to(formOk, { opacity: 1, y: 0, duration: 0.7, ease: EASE });
    }
  });

  // 入场
  if (!reducedMotion && stage) {
    const tl = gsap.timeline({ delay: 0.25 });
    tl.to(copyKids, { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.1 })
      .to(glBox, { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: EASE }, '-=0.7');
  } else {
    copyKids.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
    glBox.style.opacity = '1'; glBox.style.transform = 'none';
  }
  loading.classList.add('done');
  setTimeout(() => loading.remove(), 700);

  // 主循环
  const clock = new THREE.Clock();
  const tick = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (stage && !reducedMotion) {
      cx += (tx - cx) * Math.min(1, dt * 4);
      cy += (ty - cy) * Math.min(1, dt * 4);
      const lift = Math.sin(t * 0.8) * 0.05;
      stage.book.position.y = lift;
      if (!flipping) {
        stage.book.rotation.y += ((baseRy + (opened ? -0.18 : 0) + cx * 0.4) - stage.book.rotation.y) * Math.min(1, dt * 4);
        stage.book.rotation.x += ((baseRx + cy * 0.25) - stage.book.rotation.x) * Math.min(1, dt * 4);
      }
      stage.renderer.render(stage.scene, stage.camera);
    } else if (stage) {
      stage.renderer.render(stage.scene, stage.camera);
    }
    requestAnimationFrame(tick);
  };
  tick();
}

main();
