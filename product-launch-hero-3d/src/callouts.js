/* huafire3d fx-lab — original implementation
 * Callouts: HTML spec chips + SVG leader lines that track 3D anchor points.
 * Chips are created from CONFIG.callouts; anchors are Object3D refs resolved
 * from the loaded model's bounding box (see main.js).
 */
import * as THREE from 'three';
import { clamp01 } from './timeline.js';

const DIRS = {
  left: { x: -1, y: -0.55 },   // up-left: keeps clear of the bottom-left headline
  right: { x: 1, y: 0.25 },
  top: { x: 0.15, y: -1 },
};

export function createCallouts(container, svg, items, accent) {
  const chips = items.map((item, i) => {
    const el = document.createElement('div');
    el.className = 'chip';
    el.innerHTML =
      `<span class="chip-dot" style="background:${accent}"></span>` +
      `<span class="chip-body"><strong>${item.title}</strong><small>${item.sub}</small></span>`;
    el.style.opacity = '0';
    container.appendChild(el);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', accent);
    line.setAttribute('stroke-width', '1');
    line.setAttribute('opacity', '0');
    svg.appendChild(line);
    return { el, line, dir: DIRS[item.side] || DIRS.right, anchor: null, progress: 0 };
  });

  const v = new THREE.Vector3();

  function setAnchors(anchors) {
    anchors.forEach((a, i) => { if (chips[i]) chips[i].anchor = a; });
  }

  // progress: per-chip 0..1 from the timeline (easeOutBack may overshoot >1, clamp)
  function update(camera, w, h, progresses) {
    chips.forEach((chip, i) => {
      const p = clamp01(progresses[i] ?? 0);
      chip.progress = p;
      if (!chip.anchor || p <= 0.001) {
        chip.el.style.opacity = '0';
        chip.line.setAttribute('opacity', '0');
        return;
      }
      chip.anchor.getWorldPosition(v);
      v.project(camera);
      const ax = (v.x * 0.5 + 0.5) * w;
      const ay = (-v.y * 0.5 + 0.5) * h;

      // Chip sits offset from the anchor along its side direction.
      const dist = Math.min(w, h) * 0.19;
      let cx = ax + chip.dir.x * dist;
      let cy = ay + chip.dir.y * dist;
      // Keep chips on screen.
      const r = chip.el.getBoundingClientRect();
      cx = Math.min(Math.max(cx, r.width / 2 + 10), w - r.width / 2 - 10);
      cy = Math.min(Math.max(cy, 56), h - r.height / 2 - 10);
      // Pop-in: scale with slight overshoot handled by timeline easing.
      const s = 0.7 + 0.3 * p;
      chip.el.style.opacity = String(p);
      chip.el.style.transform = `translate(-50%,-50%) translate(${cx}px,${cy}px) scale(${s})`;

      chip.line.setAttribute('x1', String(ax));
      chip.line.setAttribute('y1', String(ay));
      chip.line.setAttribute('x2', String(cx));
      chip.line.setAttribute('y2', String(cy));
      chip.line.setAttribute('opacity', String(0.55 * p));
    });
  }

  return { setAnchors, update };
}
