// huafire3d fx-lab — original implementation
// 列头进度环：SVG 圆环，按该列 done 卡片占比绘制。

const R = 15.5;
const CIRC = 2 * Math.PI * R;

export function ringSVG(pct) {
  const p = Math.max(0, Math.min(1, pct));
  const off = CIRC * (1 - p);
  return (
    '<svg viewBox="0 0 36 36" class="ring-svg" aria-hidden="true">' +
    '<circle cx="18" cy="18" r="' + R + '" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="3.5"/>' +
    '<circle cx="18" cy="18" r="' + R + '" fill="none" stroke="var(--accent)" stroke-width="3.5"' +
    ' stroke-linecap="round" stroke-dasharray="' + CIRC.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"' +
    ' transform="rotate(-90 18 18)" class="ring-fg"/>' +
    '</svg>'
  );
}

export function columnProgress(col) {
  if (!col.cards.length) return 0;
  return col.cards.filter(c => c.done).length / col.cards.length;
}

// 刷新所有列头的环与计数；done 变化时环带过渡动画
export function updateRings(root, columns) {
  root.querySelectorAll('.column').forEach(colEl => {
    const col = columns.find(c => c.id === colEl.dataset.colId);
    if (!col) return;
    const pct = columnProgress(col);
    const ring = colEl.querySelector('.ring');
    if (ring) {
      ring.innerHTML = ringSVG(pct);
      ring.title = '完成 ' + Math.round(pct * 100) + '%';
    }
    const count = colEl.querySelector('.count');
    if (count) count.textContent = col.cards.length;
  });
}
