/* walker.js — 纸片小人「阿纸」：纯 plane 拼成的剪纸人，沿路径行走。
 * 腿/手臂按行走距离摆动，身体轻微起伏，朝向始终顺着路径切线。 */
import * as THREE from 'three';
import { paperMat, paperTex, wobbleGeo, TERRA, TERRA_DARK, PAPER, INK } from './paper.js';

function cutout(w, h, color, seed) {
  // 剪纸片：薄 box + 纸纹 + 手抖顶点
  const g = wobbleGeo(new THREE.BoxGeometry(w, h, 0.12), Math.min(w, h) * 0.06, seed);
  const m = paperMat(paperTex(128, seed, color));
  return new THREE.Mesh(g, m);
}

export function createWalker() {
  const g = new THREE.Group();

  const head = cutout(0.9, 0.9, PAPER, 201);
  head.position.y = 2.35;
  // 脸：陶土腮红两点 + 微笑线（画在贴图上）
  const faceC = document.createElement('canvas');
  faceC.width = faceC.height = 128;
  const fx = faceC.getContext('2d');
  fx.fillStyle = PAPER; fx.fillRect(0, 0, 128, 128);
  fx.fillStyle = TERRA; fx.globalAlpha = 0.8;
  fx.beginPath(); fx.arc(38, 70, 10, 0, 6.2832); fx.fill();
  fx.beginPath(); fx.arc(90, 70, 10, 0, 6.2832); fx.fill();
  fx.globalAlpha = 1; fx.strokeStyle = INK; fx.lineWidth = 5; fx.lineCap = 'round';
  fx.beginPath(); fx.arc(64, 78, 18, 0.25 * 3.14, 0.75 * 3.14); fx.stroke();
  // 眼睛：两道弯弯的笑眼
  fx.lineWidth = 6;
  fx.beginPath(); fx.arc(44, 52, 9, 1.15 * 3.14, 1.85 * 3.14); fx.stroke();
  fx.beginPath(); fx.arc(84, 52, 9, 1.15 * 3.14, 1.85 * 3.14); fx.stroke();
  const faceT = new THREE.CanvasTexture(faceC);
  faceT.colorSpace = THREE.SRGBColorSpace;
  head.material.map = faceT;
  g.add(head);

  // 草帽：纸片圆盘 + 陶土帽带
  const hat = new THREE.Mesh(
    wobbleGeo(new THREE.CylinderGeometry(0.75, 0.85, 0.1, 9), 0.05, 202),
    paperMat(paperTex(128, 203, PAPER))
  );
  hat.position.y = 2.86;
  const hatTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.42, 0.34, 9),
    paperMat(paperTex(64, 204, TERRA))
  );
  hatTop.position.y = 3.02;
  g.add(hat, hatTop);

  const body = cutout(0.85, 1.15, TERRA, 205);
  body.position.y = 1.55;
  g.add(body);

  // 小背包（鼠尾草）
  const pack = cutout(0.5, 0.62, '#9CAF88', 206);
  pack.position.set(0, 1.75, -0.28);
  g.add(pack);

  // 腿：以髋部为轴摆动
  const legs = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.22, 1.0, 0);
    const leg = cutout(0.3, 1.0, TERRA_DARK, 207 + sx);
    leg.position.y = -0.5;
    pivot.add(leg);
    g.add(pivot);
    legs.push(pivot);
  }
  // 手臂：以肩部为轴反向摆动
  const arms = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.58, 2.0, 0);
    const arm = cutout(0.24, 0.85, TERRA, 209 + sx);
    arm.position.y = -0.42;
    pivot.add(arm);
    g.add(pivot);
    arms.push(pivot);
  }

  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });

  const state = { dist: 0, phase: 0 };
  return {
    group: g,
    // dist: 累计行走距离（米），驱动摆腿相位
    update(dist) {
      const dPhase = (dist - state.dist) * 3.4;
      state.dist = dist;
      state.phase += dPhase;
      const p = state.phase;
      const amp = 0.62;
      legs[0].rotation.x = Math.sin(p) * amp;
      legs[1].rotation.x = Math.sin(p + Math.PI) * amp;
      arms[0].rotation.x = Math.sin(p + Math.PI) * amp * 0.8;
      arms[1].rotation.x = Math.sin(p) * amp * 0.8;
      // 起伏 + 轻微左右摇（纸片感）
      g.position.y = Math.abs(Math.sin(p)) * 0.12;
      g.rotation.z = Math.sin(p) * 0.045;
      head.rotation.y = Math.sin(p * 0.5) * 0.12;
      hat.rotation.z = Math.sin(p + 1) * 0.06;
      hatTop.rotation.z = hat.rotation.z;
    }
  };
}
