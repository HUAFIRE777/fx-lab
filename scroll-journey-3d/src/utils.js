// utils.js — 原创小工具：种子随机 / 数学 / easing / 程序化纹理
import * as THREE from 'three';
export function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
// 有物理感的 easing：快出慢收，像相机有惯性
export const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutCubic = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;

// 程序化径向辉光精灵纹理（零外部资源）
export function makeGlowTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(103,232,249,.55)'){
  const s = 128;
  const c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  grad.addColorStop(0, inner);
  grad.addColorStop(.35, mid);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, s, s);
  const tex = new THREE.Texture(c);
  tex.needsUpdate = true;
  return tex;
}
