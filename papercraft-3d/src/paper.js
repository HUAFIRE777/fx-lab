/* paper.js — 手绘贴图工具箱：全部纹理用离屏 canvas 手绘生成。
 * 三色定死：纸暖白 #F7F0E1 / 鼠尾草绿 #9CAF88 / 陶土 #C67B5C，
 * 其余一切颜色都是这三色的明暗变化，不引入第四色。 */
import * as THREE from 'three';

export const PAPER = '#F7F0E1';
export const SAGE = '#9CAF88';
export const TERRA = '#C67B5C';
// 同一色相的明暗（手工染色感）
export const PAPER_DEEP = '#EBDFC4';
export const PAPER_SHADOW = '#D9CBA6';
export const SAGE_DARK = '#6F855F';
export const SAGE_LIGHT = '#BFD2AC';
export const TERRA_DARK = '#8F5334';
export const TERRA_LIGHT = '#DB9E7D';
export const INK = '#6B4A38'; // 深陶土，只用于纹理里的勾线

// 确定性随机：同一种子 => 同一张纸，刷新不乱
export function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// 纸纹噪点：细小纤维 + 斑点
export function grain(ctx, w, h, rnd, n = 2600, alpha = 0.05, dark = PAPER_SHADOW, light = '#FFFDF4') {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w, y = rnd() * h;
    const r = 0.4 + rnd() * 1.6;
    ctx.fillStyle = rnd() < 0.5 ? dark : light;
    ctx.globalAlpha = alpha * (0.4 + rnd());
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.fill();
  }
  // 纤维丝
  ctx.globalAlpha = alpha * 0.8;
  ctx.strokeStyle = dark;
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 130; i++) {
    const x = rnd() * w, y = rnd() * h, a = rnd() * 6.2832, l = 4 + rnd() * 14;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// 手抖多边形：顶点按法向抖动，剪纸边缘感
export function wobblePoly(ctx, pts, rnd, amt) {
  ctx.beginPath();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    const [px, py] = pts[(i + 1) % n];
    const dx = px - x, dy = py - y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    // 每条边中间再加一个抖点
    const j1 = (rnd() - 0.5) * amt, j2 = (rnd() - 0.5) * amt;
    const mx = (x + px) / 2 + nx * j2, my = (y + py) / 2 + ny * j2;
    const sx = x + nx * j1, sy = y + ny * j1;
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    ctx.lineTo(mx, my);
  }
  ctx.closePath();
}

// 蜡笔圆：多层错位描边，蜡笔质感
export function crayonBlob(ctx, x, y, r, rnd, color, line = INK, lw = 2) {
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    const rr = r * (1 - k * 0.06);
    const ox = (rnd() - 0.5) * 6, oy = (rnd() - 0.5) * 6;
    for (let a = 0; a <= 6.29; a += 0.35) {
      const wob = 1 + (rnd() - 0.5) * 0.22;
      const px = x + ox + Math.cos(a) * rr * wob;
      const py = y + oy + Math.sin(a) * rr * wob;
      a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (k === 0) { ctx.fillStyle = color; ctx.globalAlpha = 0.92; ctx.fill(); }
    ctx.globalAlpha = 0.5 - k * 0.12;
    ctx.strokeStyle = line; ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function tex(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// —— 各种手工贴图 ——
export function paperTex(size = 512, seed = 7, base = PAPER) {
  const c = canvas(size, size), ctx = c.getContext('2d'), rnd = mulberry(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  grain(ctx, size, size, rnd);
  return tex(c);
}

export function skyTex(seed = 21) {
  const c = canvas(64, 512), ctx = c.getContext('2d'), rnd = mulberry(seed);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#FBF6E8');
  g.addColorStop(0.55, PAPER);
  g.addColorStop(1, PAPER_DEEP);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 512);
  grain(ctx, 64, 512, rnd, 500, 0.05);
  return tex(c);
}

// 小径：纸底 + 陶土色蜡笔虚线边 + 碎石点
export function pathTex(seed = 33) {
  const c = canvas(256, 256), ctx = c.getContext('2d'), rnd = mulberry(seed);
  ctx.fillStyle = '#FCF7EA'; ctx.fillRect(0, 0, 256, 256);
  grain(ctx, 256, 256, rnd, 1200, 0.05);
  ctx.strokeStyle = TERRA; ctx.lineWidth = 5; ctx.globalAlpha = 0.75;
  ctx.setLineDash([16, 12]);
  ctx.lineDashOffset = rnd() * 20;
  for (const x of [14, 242]) {
    ctx.beginPath();
    ctx.moveTo(x + (rnd() - 0.5) * 6, 0);
    ctx.lineTo(x + (rnd() - 0.5) * 6, 256);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  // 碎石
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = rnd() < 0.6 ? PAPER_SHADOW : SAGE_LIGHT;
    ctx.globalAlpha = 0.8;
    const x = 40 + rnd() * 176, y = rnd() * 256, r = 3 + rnd() * 7;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, rnd() * 3, 0, 6.2832); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// 草地：纸底 + 鼠尾草蜡笔草叶
export function grassTex(seed = 44) {
  const c = canvas(512, 512), ctx = c.getContext('2d'), rnd = mulberry(seed);
  ctx.fillStyle = SAGE_LIGHT; ctx.fillRect(0, 0, 512, 512);
  grain(ctx, 512, 512, rnd, 2000, 0.06);
  for (let i = 0; i < 420; i++) {
    const x = rnd() * 512, y = rnd() * 512;
    const h = 8 + rnd() * 22, lean = (rnd() - 0.5) * 10;
    ctx.strokeStyle = rnd() < 0.55 ? SAGE : SAGE_DARK;
    ctx.globalAlpha = 0.35 + rnd() * 0.4;
    ctx.lineWidth = 2 + rnd() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + lean * 0.4, y - h * 0.6, x + lean, y - h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 2);
  return t;
}

// 湖面：横向波浪纸条
export function lakeTex(seed = 55) {
  const c = canvas(512, 256), ctx = c.getContext('2d'), rnd = mulberry(seed);
  ctx.fillStyle = '#DCE8D2'; ctx.fillRect(0, 0, 512, 256); // 纸调和的浅鼠尾草
  for (let y = 10; y < 256; y += 18) {
    for (let x = 0; x < 512; x += 64) {
      const off = (rnd() - 0.5) * 8;
      ctx.strokeStyle = rnd() < 0.5 ? SAGE : SAGE_DARK;
      ctx.globalAlpha = 0.45 + rnd() * 0.3;
      ctx.lineWidth = 3 + rnd() * 3;
      ctx.beginPath();
      ctx.moveTo(x, y + off);
      ctx.quadraticCurveTo(x + 16, y - 6 + off, x + 32, y + off);
      ctx.quadraticCurveTo(x + 48, y + 6 + off, x + 64, y + off);
      ctx.stroke();
    }
  }
  // 高光纸条
  ctx.globalAlpha = 0.5; ctx.strokeStyle = '#FDFBF2'; ctx.lineWidth = 5;
  for (let i = 0; i < 8; i++) {
    const y = rnd() * 256, x = rnd() * 400;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + rnd() * 60, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  grain(ctx, 512, 256, rnd, 800, 0.04);
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  return t;
}

// 墙面：纸底 + 陶土窗框手绘
export function wallTex(seed = 66) {
  const c = canvas(256, 256), ctx = c.getContext('2d'), rnd = mulberry(seed);
  ctx.fillStyle = '#FBF4E2'; ctx.fillRect(0, 0, 256, 256);
  grain(ctx, 256, 256, rnd, 1100, 0.05);
  // 木纹横线（陶土淡彩）
  ctx.strokeStyle = TERRA_LIGHT; ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
  for (let y = 24; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y + (rnd() - 0.5) * 4);
    for (let x = 0; x <= 256; x += 32)
      ctx.lineTo(x, y + (rnd() - 0.5) * 6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return tex(c);
}

export function roofTex(seed = 77) {
  const c = canvas(256, 256), ctx = c.getContext('2d'), rnd = mulberry(seed);
  ctx.fillStyle = TERRA; ctx.fillRect(0, 0, 256, 256);
  grain(ctx, 256, 256, rnd, 1200, 0.06, TERRA_DARK, TERRA_LIGHT);
  // 瓦片弧线
  ctx.strokeStyle = TERRA_DARK; ctx.globalAlpha = 0.55; ctx.lineWidth = 3;
  for (let y = 16; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 32) {
      const ox = (y / 32) % 2 ? 16 : 0;
      ctx.beginPath();
      ctx.arc(x + ox + (rnd() - 0.5) * 4, y, 15, 0.15 * 3.14, 0.85 * 3.14);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  return tex(c);
}

export function canopyTex(seed = 88) {
  const c = canvas(256, 256), ctx = c.getContext('2d'), rnd = mulberry(seed);
  ctx.fillStyle = SAGE; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 46; i++) {
    crayonBlob(ctx, rnd() * 256, rnd() * 256, 14 + rnd() * 26, rnd,
      rnd() < 0.5 ? SAGE : SAGE_DARK, SAGE_DARK, 2);
  }
  grain(ctx, 256, 256, rnd, 700, 0.05, SAGE_DARK, SAGE_LIGHT);
  return tex(c);
}

// 云：纸白剪纸，边缘手抖
export function cloudTex(seed = 99) {
  const c = canvas(256, 160), ctx = c.getContext('2d'), rnd = mulberry(seed);
  ctx.clearRect(0, 0, 256, 160);
  const blobs = [[70, 100, 44], [120, 80, 52], [175, 95, 40], [100, 115, 50], [150, 115, 46]];
  for (const [x, y, r] of blobs) {
    wobblePoly(ctx, blobPts(x, y, r, rnd), rnd, 7);
    ctx.fillStyle = '#FFFDF6'; ctx.globalAlpha = 0.96; ctx.fill();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAPER_SHADOW; ctx.lineWidth = 2.5; ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return tex(c);
}
function blobPts(x, y, r, rnd) {
  const pts = [];
  for (let a = 0; a < 6.2832; a += 0.5) {
    const w = 1 + (rnd() - 0.5) * 0.3;
    pts.push([x + Math.cos(a) * r * w, y + Math.sin(a) * r * w * 0.72]);
  }
  return pts;
}

// 花瓣 / 叶子剪纸
export function petalTex(color, seed = 111) {
  const c = canvas(128, 128), ctx = c.getContext('2d'), rnd = mulberry(seed);
  ctx.clearRect(0, 0, 128, 128);
  wobblePoly(ctx, blobPts(64, 64, 52, rnd), rnd, 6);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = INK; ctx.globalAlpha = 0.4; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.globalAlpha = 1;
  // 花蕊点
  ctx.fillStyle = PAPER;
  ctx.beginPath(); ctx.arc(64, 64, 12, 0, 6.2832); ctx.fill();
  return tex(c);
}

// 几何顶点轻微抖动：剪纸拼贴感
export function wobbleGeo(geo, amt, seed = 5) {
  const rnd = mulberry(seed);
  const pos = geo.attributes.position;
  const seen = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = [pos.getX(i).toFixed(3), pos.getY(i).toFixed(3), pos.getZ(i).toFixed(3)].join(',');
    if (!seen.has(key)) {
      seen.set(key, [(rnd() - 0.5) * amt, (rnd() - 0.5) * amt, (rnd() - 0.5) * amt]);
    }
    const o = seen.get(key);
    pos.setXYZ(i, pos.getX(i) + o[0], pos.getY(i) + o[1], pos.getZ(i) + o[2]);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function paperMat(map, opts = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({
    map, roughness: 0.95, metalness: 0,
    flatShading: true, side: THREE.DoubleSide,
  }, opts));
}
