// huafire3d fx-lab — original implementation · quiz-check-3d
// 全屏透明 3D 叠加层：答对 → 绿色对勾绘制 + 粒子爆发 + 冲击环；
// 答错 → 橙色错叉绘制 + 衰减震动 + 碎屑下落。纯程序化几何，零外部模型。
import * as THREE from 'three';

const GREEN = 0x58cc02;
const ORANGE = 0xff9600;
const GREEN_LIGHT = 0xa5e075;
const ORANGE_LIGHT = 0xffc46b;

const canvas = document.getElementById('fx3d');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
camera.position.set(0, 0, 9);
camera.lookAt(0, 0, 0);

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// NDC(-1..1) → 世界坐标（z=0 平面）
function ndcToWorld(nx, ny) {
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  const halfW = halfH * camera.aspect;
  return new THREE.Vector3(nx * halfW, ny * halfH, 0);
}

const effects = [];
let rafId = 0, lastT = 0;

function tick(now) {
  const dt = Math.min((now - lastT) / 1000, 0.05);
  lastT = now;
  for (let i = effects.length - 1; i >= 0; i--) {
    if (!effects[i].update(dt)) {
      effects[i].dispose();
      effects.splice(i, 1);
    }
  }
  renderer.render(scene, camera);
  if (effects.length) rafId = requestAnimationFrame(tick);
  else rafId = 0;
}
function kick() {
  if (!rafId) { lastT = performance.now(); rafId = requestAnimationFrame(tick); }
}
function add(e) { effects.push(e); scene.add(e.group); kick(); }

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const backOut = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// ---------- 粒子云 ----------
function makeBurst(origin, { count, color, color2, speed, up, size, life, gravity }) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const vel = [];
  const c1 = new THREE.Color(color), c2 = new THREE.Color(color2);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = origin.x; pos[i * 3 + 1] = origin.y; pos[i * 3 + 2] = origin.z;
    const c = c1.clone().lerp(c2, Math.random());
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    const a = Math.random() * Math.PI * 2;
    const r = speed * (0.35 + Math.random() * 0.65);
    vel.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.8 + up, (Math.random() - 0.5) * r));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size, vertexColors: true, transparent: true, opacity: 1, depthWrite: false });
  const points = new THREE.Points(g, m);
  let t = 0;
  return {
    obj: points,
    update(dt) {
      t += dt;
      const p = g.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const v = vel[i];
        v.y -= gravity * dt;
        p[i * 3] += v.x * dt; p[i * 3 + 1] += v.y * dt; p[i * 3 + 2] += v.z * dt;
      }
      g.attributes.position.needsUpdate = true;
      if (t > life * 0.62) m.opacity = Math.max(0, 1 - (t - life * 0.62) / (life * 0.38));
      return t < life;
    },
    dispose() { g.dispose(); m.dispose(); },
  };
}

// ---------- 冲击环 ----------
function makeRing(origin, color) {
  const g = new THREE.RingGeometry(0.42, 0.5, 48);
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(g, m);
  mesh.position.copy(origin);
  let t = 0;
  const dur = 0.65;
  return {
    obj: mesh,
    update(dt) {
      t += dt;
      const k = Math.min(t / dur, 1);
      const s = 0.4 + easeOut(k) * 4.2;
      mesh.scale.set(s, s, 1);
      m.opacity = 0.65 * (1 - k);
      return k < 1;
    },
    dispose() { g.dispose(); m.dispose(); },
  };
}

// ---------- 管状笔画（对勾 / 错叉）----------
function makeStroke(points, radius, color, delay, drawDur) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const g = new THREE.TubeGeometry(curve, 42, radius, 12, false);
  const total = g.index.count;
  g.setDrawRange(0, 0);
  const m = new THREE.MeshBasicMaterial({ color, depthWrite: false });
  const mesh = new THREE.Mesh(g, m);
  let t = -delay;
  return {
    obj: mesh,
    update(dt) {
      t += dt;
      if (t < 0) return true;
      const k = Math.min(t / drawDur, 1);
      g.setDrawRange(0, Math.floor(total * easeOut(k)));
      return true; // 笔画常驻，由外层统一回收
    },
    dispose() { g.dispose(); m.dispose(); },
  };
}

function spawnEffect(origin, strokes, burstCfg, ringColor, extra) {
  const group = new THREE.Group();
  group.position.copy(origin);
  group.scale.setScalar(0.55);
  const parts = [];
  const holder = { group, parts, t: 0,
    update(dt) {
      this.t += dt;
      let alive = this.t < 1.7;
      for (const p of parts) p.update(dt);
      // 弹性入场
      const k = Math.min(this.t / 0.45, 1);
      group.scale.setScalar(0.55 + 0.45 * backOut(k));
      if (extra) extra(this.t, group, origin);
      return alive;
    },
    dispose() { for (const p of parts) p.dispose(); scene.remove(group); },
  };
  for (const s of strokes) { parts.push(s); group.add(s.obj); }
  const burst = makeBurst(origin, burstCfg); parts.push(burst); group.add(burst.obj);
  const ring = makeRing(origin, ringColor); parts.push(ring); group.add(ring.obj);
  add(holder);
}

// ---------- 对外 ----------
export function fxPointFromEl(el) {
  const r = el.getBoundingClientRect();
  const nx = ((r.left + r.width / 2) / innerWidth) * 2 - 1;
  const ny = -(((r.top + r.height / 2) / innerHeight) * 2 - 1);
  return { nx, ny };
}

export function playCorrect(nx, ny) {
  const o = ndcToWorld(nx, ny);
  spawnEffect(o, [
    makeStroke([[-1.15, -0.02, 0], [-0.38, -0.68, 0], [1.15, 0.78, 0]], 0.12, GREEN, 0, 0.38),
  ], { count: 120, color: GREEN, color2: GREEN_LIGHT, speed: 5.2, up: 1.6, size: 0.11, life: 1.35, gravity: 3.2 }, GREEN);
}

export function playWrong(nx, ny) {
  const o = ndcToWorld(nx, ny);
  const s = 0.78;
  spawnEffect(o, [
    makeStroke([[-s, -s, 0], [s, s, 0]], 0.12, ORANGE, 0, 0.3),
    makeStroke([[s, -s, 0], [-s, s, 0]], 0.12, ORANGE, 0.14, 0.3),
  ], { count: 55, color: ORANGE, color2: ORANGE_LIGHT, speed: 2.6, up: -0.6, size: 0.09, life: 1.1, gravity: 5.5 }, ORANGE,
  (t, group, origin) => {
    // 衰减震动：只在前 0.7s
    if (t < 0.7) group.position.x = origin.x + Math.sin(t * 52) * 0.24 * Math.exp(-t * 4.5);
    else group.position.x = origin.x;
  });
}
