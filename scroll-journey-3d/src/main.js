// main.js — 滚动驱动的相机旅程。滚动 = 时间轴，相机沿 CatmullRom 样条穿越 5 场景。
import * as THREE from 'three';
import { clamp, lerp, smoothstep, easeOutExpo, makeGlowTexture } from './utils.js';
import { buildNebula, buildWormhole, buildMoon, buildCrystals, buildSunrise, INK } from './scenes.js';

const isMobile = matchMedia('(max-width: 640px)').matches || 'ontouchstart' in window;
const DPR = Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2);

/* —— 渲染器 / 场景 —— */
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(INK, 1);
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(INK, 0.0016);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .5, 2200);

/* —— 5 场景落位（沿 -Z 连续排布） —— */
const glowTex = makeGlowTexture();
const NEBULA_COUNT = isMobile ? 10000 : 30000;
const chapters = [
  { title: '序章 · 星海',   no: 'CHAPTER 01', z: 0,     fog: 0.0016, build: () => buildNebula(NEBULA_COUNT, glowTex) },
  { title: '第一章 · 穿越', no: 'CHAPTER 02', z: -400,  fog: 0.0008, build: () => buildWormhole(glowTex) },
  { title: '第二章 · 落月', no: 'CHAPTER 03', z: -800,  fog: 0.0011, build: () => buildMoon() },
  { title: '第三章 · 晶洞', no: 'CHAPTER 04', z: -1200, fog: 0.0018, build: () => buildCrystals(glowTex) },
  { title: '终章 · 破晓',   no: 'CHAPTER 05', z: -1600, fog: 0.0012, build: () => buildSunrise(glowTex) },
];
const groups = chapters.map(c => {
  const g = c.build();
  g.position.z = c.z;
  g.userData.mats.forEach(m => { m.userData.base = m.opacity; });
  scene.add(g);
  return g;
});

/* —— 相机旅程样条 —— */
const spline = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 6, 90),
  new THREE.Vector3(0, 10, -160),
  new THREE.Vector3(10, 14, -330),
  new THREE.Vector3(-12, 20, -620),
  new THREE.Vector3(0, 26, -860),
  new THREE.Vector3(14, 18, -1080),
  new THREE.Vector3(-8, 30, -1330),
  new THREE.Vector3(0, 46, -1560),
  new THREE.Vector3(0, 60, -1720),
], false, 'centripetal', .6);

/* —— 滚动进度：目标值 + 惯性跟随 —— */
let targetP = 0, curP = 0;
function readScroll(){
  const max = document.documentElement.scrollHeight - innerHeight;
  targetP = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
}
addEventListener('scroll', readScroll, { passive: true });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  readScroll();
});
readScroll();

/* —— HUD —— */
const railFill = document.getElementById('railFill');
const railDots = [...document.querySelectorAll('#railChapters i')];
const hudNo = document.getElementById('hudNo');
const hudSwap = document.getElementById('hudSwap');
let curChapter = -1;
function setChapter(i){
  if (i === curChapter) return;
  curChapter = i;
  hudNo.textContent = chapters[i].no;
  hudSwap.textContent = chapters[i].title;
  hudSwap.classList.remove('enter');
  void hudSwap.offsetWidth; // 重启动画
  hudSwap.classList.add('enter');
  railDots.forEach((d, k) => d.classList.toggle('on', k <= i));
}

/* —— 程序化噪点（零外部图） —— */
(function grain(){
  const c = document.getElementById('grain');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4){
    const v = Math.random() * 255 | 0;
    img.data[i] = img.data[i+1] = img.data[i+2] = v; img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);
})();

/* —— 主循环 —— */
const clock = new THREE.Clock();
let booted = false;

function tick(){
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), .05);
  const t = clock.elapsedTime;

  // 惯性跟随：指数衰减式 lerp，有物理感，不直接赋值
  curP = lerp(curP, targetP, 1 - Math.pow(.002, dt));
  if (Math.abs(targetP - curP) < 1e-4) curP = targetP;
  const p = clamp(curP, 0, 1);

  // 相机沿样条行进，看向稍前方
  const pos = spline.getPointAt(p);
  const ahead = spline.getPointAt(clamp(p + .025, 0, 1));
  camera.position.copy(pos);
  camera.lookAt(ahead.x * .6, ahead.y * .7 - 4, ahead.z);
  camera.position.y += Math.sin(t * .5) * 1.2; // 呼吸浮动

  // 场景交叉淡化：每场景以中心 p_i 为峰的分段插值
  groups.forEach((g, i) => {
    const pi = (i + .5) / 5;
    const fade = smoothstep(pi - .20, pi - .07, p) * (1 - smoothstep(pi + .07, pi + .20, p));
    g.visible = fade > .01;
    if (g.visible){
      const e = easeOutExpo(clamp(fade, 0, 1));
      g.userData.mats.forEach(m => { m.opacity = m.userData.base * e; });
      if (g.userData.update) g.userData.update(t);
    }
  });

  // fog 密度随章节插值
  const seg = clamp(p * 5, 0, 4.999);
  const i0 = Math.floor(seg), f = seg - i0;
  scene.fog.density = lerp(chapters[i0].fog, chapters[Math.min(i0 + 1, 4)].fog, smoothstep(0, 1, f));

  // HUD
  railFill.style.height = (p * 100).toFixed(2) + '%';
  setChapter(clamp(Math.floor(p * 5), 0, 4));

  renderer.render(scene, camera);

  if (!booted){
    booted = true;
    document.documentElement.classList.add('ready'); // 完成态：html.js.ready 可达
  }
}
tick();
