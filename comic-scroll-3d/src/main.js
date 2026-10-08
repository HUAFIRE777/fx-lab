/* huafire3d fx-lab — original implementation */
/* comic-scroll-3d · 滚动漫画《追光者》第一期：分镜 × WebGL 实时渲染 */
import * as THREE from 'three';

const INK = 0x111111, PAPER = 0xFAFAF7, RED = 0xE23E22;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 加载态 ---------- */
const loader = document.getElementById('loader');
const loadfill = document.getElementById('loadfill');
let loadP = 0;
const loadTick = setInterval(() => {
  loadP = Math.min(96, loadP + 8 + Math.random() * 10);
  loadfill.style.width = loadP + '%';
}, 120);
function loaderDone() {
  clearInterval(loadTick);
  loadfill.style.width = '100%';
  setTimeout(() => loader.classList.add('done'), 260);
}

/* ---------- 顶部进度 ---------- */
const pnum = document.getElementById('pnum');
const pfill = document.getElementById('pfill');
let maxPanel = 0;
function updateTopProgress() {
  const h = document.documentElement;
  const p = clamp01(h.scrollTop / Math.max(1, h.scrollHeight - innerHeight));
  pfill.style.width = (p * 100).toFixed(1) + '%';
}

/* ---------- 分镜激活：进入视口 30% 播放一次 ---------- */
const panels = [...document.querySelectorAll('.panel')];
const playIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting && !e.target.classList.contains('played')) {
      e.target.classList.add('played');
      const n = +e.target.dataset.panel;
      if (n >= 1 && n <= 5 && n > maxPanel) { maxPanel = n; pnum.textContent = n; }
      playIO.unobserve(e.target);
    }
  }
}, { threshold: 0.3 });
if ('IntersectionObserver' in window) panels.forEach((p) => playIO.observe(p));
else panels.forEach((p) => p.classList.add('played'));

/* ---------- 滚动进度工具 ---------- */
function viewProg(el) {
  const r = el.getBoundingClientRect();
  return clamp01((innerHeight - r.top) / (innerHeight + r.height));
}

/* ---------- WebGL 通用 ---------- */
function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  return r;
}
function fitRenderer(r, canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * r.getPixelRatio()) || canvas.height !== Math.floor(h * r.getPixelRatio())) {
    r.setSize(w, h, false);
  }
}

const stages = [];
function registerStage(canvas, build) {
  const s = build(canvas);
  s.canvas = canvas;
  s.active = false;
  stages.push(s);
  return s;
}
/* 视口附近才渲染，离开暂停 */
const glIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const s = stages.find((x) => x.canvas === e.target);
    if (s) s.active = e.isIntersecting && e.intersectionRatio > 0.02;
  }
}, { threshold: [0, 0.02, 0.5, 1] });

/* ===== 第一格：红日在纸海上滚动 ===== */
function buildSunrise(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 2, 0.1, 100);
  camera.position.set(0, 2.6, 14);
  camera.lookAt(0, 1.2, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4);
  dl.position.set(5, 10, 6);
  scene.add(dl);

  const seaGeo = new THREE.PlaneGeometry(36, 18, 90, 28);
  seaGeo.rotateX(-Math.PI / 2);
  const base = seaGeo.attributes.position.array.slice();
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: PAPER, roughness: 1 }));
  const grid = new THREE.Mesh(seaGeo, new THREE.MeshBasicMaterial({ color: INK, wireframe: true, transparent: true, opacity: 0.10 }));
  grid.position.y = 0.02;
  scene.add(sea, grid);

  const sun = new THREE.Mesh(new THREE.SphereGeometry(2.4, 40, 40), new THREE.MeshBasicMaterial({ color: RED }));
  const halo = new THREE.Mesh(new THREE.CircleGeometry(3.5, 48), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.20 }));
  sun.position.x = -4.5; halo.position.x = -4.5; halo.position.z = -1.2;
  scene.add(sun, halo);

  return {
    renderer, scene, camera,
    update(t, dt, p) {
      const pos = seaGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], y = base[i * 3 + 2];
        pos.array[i * 3 + 1] = Math.sin(x * 0.45 + t * 1.6) * 0.45 + Math.cos(y * 0.6 + t * 1.1) * 0.35;
      }
      pos.needsUpdate = true;
      seaGeo.computeVertexNormals();
      const e = easeInOut(p);
      const sy = -3.4 + e * 9.6 + Math.sin(t * 2) * 0.08;
      sun.position.y = sy; halo.position.y = sy;
      halo.material.opacity = 0.14 + e * 0.12;
    },
  };
}

/* ===== 第三格：纸飞机穿越云格 ===== */
function buildPlane(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 100);
  camera.position.set(0, 0.6, 12);
  camera.lookAt(0, 0.4, 0);

  const paper = new THREE.MeshBasicMaterial({ color: PAPER });
  const plane = new THREE.Group();
  const fus = new THREE.Mesh(new THREE.ConeGeometry(0.34, 2.0, 4), paper);
  fus.rotation.x = Math.PI / 2;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.06, 0.85), paper);
  wing.position.z = -0.25;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.075, 0.87), new THREE.MeshBasicMaterial({ color: RED }));
  stripe.position.z = -0.25;
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.5), paper);
  fin.position.set(0, 0.28, -0.85);
  plane.add(fus, wing, stripe, fin);
  scene.add(plane);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-10, -2.2, 0), new THREE.Vector3(-5, 1.6, -1),
    new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(5, 2.1, -1),
    new THREE.Vector3(10, -1.2, 0),
  ]);

  const clouds = [];
  const cloudMat = new THREE.MeshBasicMaterial({ color: PAPER, transparent: true, opacity: 0.92 });
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    const n = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < n; j++) {
      const r = 0.7 + Math.random() * 0.8;
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 14), cloudMat);
      m.position.set(j * 1.1 - n * 0.5, Math.random() * 0.5, Math.random() * 0.4);
      m.scale.y = 0.62;
      g.add(m);
    }
    g.position.set(-11 + Math.random() * 22, -3.4 + Math.random() * 6.4, -4.5 + Math.random() * 2.5);
    g.userData.speed = 0.25 + Math.random() * 0.4;
    scene.add(g);
    clouds.push(g);
  }
  const starMat = new THREE.MeshBasicMaterial({ color: RED });
  for (let i = 0; i < 22; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), starMat);
    s.position.set(-11 + Math.random() * 22, -4 + Math.random() * 8, -5.5);
    scene.add(s);
  }
  /* 纸飞机尾迹：印泥红动感线 */
  const TRAIL = 42;
  const trailPos = new Float32Array(TRAIL * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: 0.85 }));
  trail.frustumCulled = false;
  scene.add(trail);

  const tmp = new THREE.Vector3(), tan = new THREE.Vector3();
  return {
    renderer, scene, camera,
    update(t, dt, p) {
      const e = easeInOut(p);
      curve.getPointAt(e, tmp);
      curve.getTangentAt(e, tan);
      plane.position.copy(tmp);
      plane.lookAt(tmp.clone().add(tan));
      plane.rotateZ(Math.sin(e * Math.PI * 4) * 0.35);
      for (let i = TRAIL - 1; i > 0; i--) {
        trailPos[i * 3] = trailPos[(i - 1) * 3];
        trailPos[i * 3 + 1] = trailPos[(i - 1) * 3 + 1];
        trailPos[i * 3 + 2] = trailPos[(i - 1) * 3 + 2];
      }
      trailPos[0] = tmp.x; trailPos[1] = tmp.y; trailPos[2] = tmp.z;
      trailGeo.attributes.position.needsUpdate = true;
      for (const c of clouds) {
        c.position.x += c.userData.speed * dt;
        if (c.position.x > 12.5) c.position.x = -12.5;
      }
    },
  };
}

/* ===== 第五格：山顶剪影 + 风吹斗篷 ===== */
function buildSummit(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 2, 0.1, 100);
  camera.position.set(0, 2.2, 13);
  camera.lookAt(0, 1.4, 0);

  const sil = new THREE.MeshBasicMaterial({ color: INK });
  const sun = new THREE.Mesh(new THREE.CircleGeometry(3.3, 56), new THREE.MeshBasicMaterial({ color: RED }));
  sun.position.set(0, 3.6, -4);
  scene.add(sun);
  const mountain = new THREE.Mesh(new THREE.ConeGeometry(6.8, 5.6, 4), sil);
  mountain.position.y = -2.4;
  mountain.rotation.y = Math.PI / 4;
  scene.add(mountain);

  const hero = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 20), sil);
  head.position.y = 1.62;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.85, 6, 14), sil);
  body.position.y = 0.78;
  hero.add(head, body);
  hero.position.set(0, 0.62, 1.4);
  scene.add(hero);

  /* 斗篷：顶点波浪 shader，顶部固定、底部飘起 */
  const capeUniforms = { uTime: { value: 0 }, uColor: { value: new THREE.Color(INK) } };
  const capeMat = new THREE.ShaderMaterial({
    uniforms: capeUniforms,
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float hang = 1.0 - uv.y;              /* 顶部固定 */
        p.z += sin(uv.y * 7.0 - uTime * 7.0) * 0.38 * hang;
        p.x += sin(uTime * 3.2 + uv.y * 4.0) * 0.12 * hang;
        p.z += hang * hang * 0.9;             /* 风把下摆往后掀 */
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      void main() { gl_FragColor = vec4(uColor, 1.0); }`,
  });
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.3, 10, 14), capeMat);
  cape.position.set(0, 1.35, 1.02);
  scene.add(cape);

  const streaks = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.055, 0.01), new THREE.MeshBasicMaterial({ color: RED }));
    m.position.set(-8 + Math.random() * 10, 1.6 + i * 1.1, 0.5);
    m.userData.speed = 5 + Math.random() * 3;
    scene.add(m);
    streaks.push(m);
  }
  return {
    renderer, scene, camera,
    update(t, dt) {
      capeUniforms.uTime.value = t;
      hero.rotation.y = Math.sin(t * 0.8) * 0.08;
      for (const s of streaks) {
        s.position.x += s.userData.speed * dt;
        if (s.position.x > 9) { s.position.x = -9; s.position.y = 1.2 + Math.random() * 3.4; }
      }
    },
  };
}

registerStage(document.getElementById('gl1'), buildSunrise);
registerStage(document.getElementById('gl3'), buildPlane);
registerStage(document.getElementById('gl5'), buildSummit);
stages.forEach((s) => glIO.observe(s.canvas));

/* ===== 第四格 SVG：城市灯火逐个点亮 ===== */
const citySvg = document.getElementById('city');
const NS = 'http://www.w3.org/2000/svg';
function cel(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  citySvg.appendChild(el);
  return el;
}
const windowRects = [];
(function buildCity() {
  const BASE = 282;
  cel('circle', { cx: 505, cy: 58, r: 27, fill: '#E23E22' });            /* 红月 */
  const towers = [
    [18, 64, 190], [96, 52, 150], [160, 74, 226], [248, 46, 132],
    [306, 68, 205], [386, 54, 168], [452, 66, 238], [530, 52, 160],
  ];
  towers.forEach(([x, w, h], bi) => {
    cel('rect', { x, y: BASE - h, width: w, height: h, fill: '#111111' });
    if (bi % 2 === 0) cel('line', { x1: x + w / 2, y1: BASE - h, x2: x + w / 2, y2: BASE - h - 22, stroke: '#111111', 'stroke-width': 4 });
    for (let r = 0; r < Math.floor((h - 26) / 24); r++) {
      for (let c = 0; c < Math.floor((w - 16) / 20); c++) {
        windowRects.push(cel('rect', {
          x: x + 10 + c * 20, y: BASE - h + 14 + r * 24, width: 10, height: 13, fill: '#111111',
        }));
      }
    }
  });
  cel('rect', { x: 0, y: BASE, width: 600, height: 38, fill: '#111111' }); /* 地面 */
  cel('rect', { x: 0, y: BASE - 6, width: 600, height: 6, fill: '#E23E22' }); /* 地平红线 */
})();
const panel4 = document.getElementById('panel4');
let litCount = -1;
function updateCityLights() {
  const lit = Math.floor(viewProg(panel4) * windowRects.length);
  if (lit === litCount) return;
  litCount = lit;
  for (let i = 0; i < windowRects.length; i++) {
    windowRects[i].setAttribute('fill', i < lit ? '#E23E22' : '#111111');
  }
}

/* ---------- 主循环 ---------- */
let last = performance.now(), elapsed = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  elapsed += dt;
  let anyActive = false;
  for (const s of stages) {
    if (!s.active) continue;
    anyActive = true;
    fitRenderer(s.renderer, s.canvas);
    s.camera.aspect = s.canvas.clientWidth / s.canvas.clientHeight;
    s.camera.updateProjectionMatrix();
    s.update(elapsed, dt, viewProg(s.canvas));
    s.renderer.render(s.scene, s.camera);
  }
  updateCityLights();
  if (!reduced) requestAnimationFrame(frame);
  return anyActive;
}

/* ---------- 滚动 ---------- */
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { updateTopProgress(); updateCityLights(); ticking = false; });
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);

/* ---------- CTA ---------- */
const cta = document.getElementById('cta');
cta.addEventListener('click', (e) => {
  e.preventDefault();
  const old = cta.textContent;
  cta.textContent = '已订阅！下期见';
  setTimeout(() => { cta.textContent = old; }, 2200);
});

/* ---------- 启动 ---------- */
if (reduced) {
  /* 完成态直接可达：三场景各渲染一帧终态 */
  for (const s of stages) {
    fitRenderer(s.renderer, s.canvas);
    s.update(2.5, 0.016, 1);
    s.renderer.render(s.scene, s.camera);
  }
  litCount = -2; updateCityLights();
  panels.forEach((p) => p.classList.add('played'));
  maxPanel = 5; pnum.textContent = 5;
  loaderDone();
} else {
  updateTopProgress();
  updateCityLights();
  requestAnimationFrame(frame);
  /* 首帧后撤下加载态；兜底 2.5s 必撤，保证完成态可达 */
  setTimeout(loaderDone, 900);
  setTimeout(() => loader.classList.add('done'), 2500);
}
