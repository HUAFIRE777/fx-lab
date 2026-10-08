// huafire3d fx-lab — original implementation
// 卖点标注：HTML 卡片跟随 3D 锚点投影坐标；SVG 引线连接锚点圆点与卡片；
// 卡片钳制在视口安全区内（移动端不遮挡产品主体）。

import * as THREE from 'three';

const MARGIN = 14; // 视口安全边距

export function createLabels(layerEl, svgEl, anchors, labels, project) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const items = labels.map((L, i) => {
    const card = document.createElement('div');
    card.className = 'tag-card';
    card.innerHTML =
      `<div class="tag-dot-num">${i + 1}</div>` +
      `<div class="tag-body"><h3>${L.title}</h3><p>${L.text}</p></div>`;
    layerEl.appendChild(card);
    const dot = document.createElement('div');
    dot.className = 'tag-dot';
    layerEl.appendChild(dot);
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('class', 'tag-line');
    svgEl.appendChild(line);
    const dotR = document.createElementNS(svgNS, 'circle');
    dotR.setAttribute('class', 'tag-ring');
    dotR.setAttribute('r', '5');
    svgEl.appendChild(dotR);
    return { L, card, dot, line, dotR, on: false };
  });

  const v = new THREE.Vector3();

  function update(p, w, h) {
    svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const vis = p >= it.L.show[0] && p <= it.L.show[1];
      // 投影锚点
      anchors[i].getWorldPosition(v);
      const sp = project(v); // {x, y, behind}
      const show = vis && !sp.behind && sp.x > -50 && sp.x < w + 50 && sp.y > -50 && sp.y < h + 50;

      it.card.classList.toggle('on', show);
      it.dot.classList.toggle('on', show);
      const disp = show ? '' : 'none';
      it.line.style.display = disp;
      it.dotR.style.display = disp;

      if (!show) { if (it.on) it.on = false; continue; }
      it.on = true;

      // 圆点落在锚点
      it.dot.style.transform = `translate(${sp.x}px, ${sp.y}px)`;
      it.dotR.setAttribute('cx', sp.x);
      it.dotR.setAttribute('cy', sp.y);

      // 卡片：锚点 + 方向偏移，再钳制进安全区
      const cw = it.card.offsetWidth || 200;
      const ch = it.card.offsetHeight || 70;
      let cx = sp.x + (it.L.side === 'left' ? -110 - cw / 2 : 110 + cw / 2);
      let cy = sp.y - ch / 2 - 24;
      cx = Math.min(Math.max(cx, MARGIN), w - cw - MARGIN);
      cy = Math.min(Math.max(cy, MARGIN + 8), h - ch - MARGIN);
      it.card.style.transform = `translate(${cx}px, ${cy}px)`;

      // 引线：卡片近锚点一侧的中点 → 锚点
      const ex = it.L.side === 'left' ? cx + cw : cx;
      const ey = cy + ch / 2;
      it.line.setAttribute('x1', ex); it.line.setAttribute('y1', ey);
      it.line.setAttribute('x2', sp.x); it.line.setAttribute('y2', sp.y);
    }
  }

  return { update };
}
