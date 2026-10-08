// culture-values-3d · 几何体采样 + morph
// 手法：四种几何体各采样 N 个表面点，按球面角排序建立点对点对应，
// 滚动进度驱动顶点插值，实现"一个几何体形变成另一个"的滚动叙事。
import * as THREE from 'three';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSampler(rng) {
  return () => rng();
}

function sampleSphere(n, rng) {
  const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = rng(), v = rng();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = 1.0;
    p[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    p[i * 3 + 1] = r * Math.cos(phi);
    p[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  return p;
}

function sampleCube(n, rng) {
  const p = new Float32Array(n * 3);
  const s = 0.92;
  for (let i = 0; i < n; i++) {
    const face = Math.floor(rng() * 6);
    const a = (rng() * 2 - 1) * s, b = (rng() * 2 - 1) * s;
    let x = a, y = b, z = s;
    if (face === 1) z = -s;
    else if (face === 2) { z = a; x = s; }
    else if (face === 3) { z = a; x = -s; }
    else if (face === 4) { z = b; y = s; }
    else if (face === 5) { z = b; y = -s; }
    p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
  }
  return p;
}

function sampleTorus(n, rng) {
  const p = new Float32Array(n * 3);
  const R = 0.78, r = 0.34;
  for (let i = 0; i < n; i++) {
    const u = rng() * Math.PI * 2, v = rng() * Math.PI * 2;
    p[i * 3]     = (R + r * Math.cos(v)) * Math.cos(u);
    p[i * 3 + 1] = r * Math.sin(v);
    p[i * 3 + 2] = (R + r * Math.cos(v)) * Math.sin(u);
  }
  return p;
}

function sampleCone(n, rng) {
  const p = new Float32Array(n * 3);
  const H = 0.95, R = 0.72;
  for (let i = 0; i < n; i++) {
    if (rng() < 0.2) { // 底面圆盘
      const a = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * R;
      p[i * 3] = rr * Math.cos(a); p[i * 3 + 1] = -H; p[i * 3 + 2] = rr * Math.sin(a);
    } else { // 侧面
      const y = (rng() * 2 - 1) * H;
      const a = rng() * Math.PI * 2;
      const rr = R * (H - y) / (2 * H);
      p[i * 3] = rr * Math.cos(a); p[i * 3 + 1] = y; p[i * 3 + 2] = rr * Math.sin(a);
    }
  }
  return p;
}

// 按球面角 (theta, phi) 排序：让四个形状的第 k 个点大致处在同一方位，
// morph 插值时粒子沿短路径滑行，不会满天乱飞。
function sortByAngle(p) {
  const n = p.length / 3;
  const order = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2];
    const theta = Math.atan2(z, x);                 // -PI..PI
    const rr = Math.hypot(x, z);
    const phi = Math.atan2(rr, y);                  // 0..PI
    order[i] = [theta * 256 + phi, i];
  }
  order.sort((a, b) => a[0] - b[0]);
  const out = new Float32Array(p.length);
  for (let k = 0; k < n; k++) {
    const i = order[k][1];
    out[k * 3] = p[i * 3]; out[k * 3 + 1] = p[i * 3 + 1]; out[k * 3 + 2] = p[i * 3 + 2];
  }
  return out;
}

export function buildShapes(count) {
  const rng = mulberry32(20261005);
  const fns = [sampleSphere, sampleCube, sampleTorus, sampleCone];
  return fns.map(fn => sortByAngle(fn(count, rng)));
}

// 圆形柔边粒子贴图（canvas 程序化生成，无外链）
export function makeSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// t ∈ [0, shapes.length-1]，段内用 smootherstep 缓动
export function morphInto(out, shapes, t) {
  const seg = Math.min(shapes.length - 2, Math.max(0, Math.floor(t)));
  let f = t - seg;
  f = Math.min(1, Math.max(0, f));
  f = f * f * f * (f * (f * 6 - 15) + 10); // smootherstep
  const a = shapes[seg], b = shapes[seg + 1];
  const n = out.length;
  for (let i = 0; i < n; i++) out[i] = a[i] + (b[i] - a[i]) * f;
}
