/* drive-world-3d · src/input.js — 键盘 + 触屏虚拟摇杆（原创） */

export function createInput() {
  const keys = new Set();
  const CODE = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };
  window.addEventListener('keydown', (e) => {
    if (CODE[e.code]) { keys.add(CODE[e.code]); e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    if (CODE[e.code]) keys.delete(CODE[e.code]);
  });
  window.addEventListener('blur', () => keys.clear());

  const stick = { active: false, x: 0, y: 0 }; // x:转向(-1左), y:油门(1前进)

  function bindStick(stickEl, knobEl) {
    const R = 44;
    let pid = null;
    const setKnob = (dx, dy) => {
      knobEl.style.transform = `translate(${dx}px,${dy}px)`;
    };
    const onMove = (e) => {
      if (e.pointerId !== pid) return;
      const rect = stickEl.getBoundingClientRect();
      let dx = e.clientX - (rect.left + rect.width / 2);
      let dy = e.clientY - (rect.top + rect.height / 2);
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = dx / d * R; dy = dy / d * R; }
      setKnob(dx, dy);
      stick.x = dx / R; stick.y = -dy / R;
    };
    stickEl.addEventListener('pointerdown', (e) => {
      pid = e.pointerId; stick.active = true;
      stickEl.setPointerCapture(pid); onMove(e);
    });
    stickEl.addEventListener('pointermove', onMove);
    const end = (e) => {
      if (e.pointerId !== pid) return;
      pid = null; stick.active = false; stick.x = stick.y = 0; setKnob(0, 0);
    };
    stickEl.addEventListener('pointerup', end);
    stickEl.addEventListener('pointercancel', end);
  }

  return {
    bindStick,
    get throttle() {
      let t = (keys.has('up') ? 1 : 0) - (keys.has('down') ? 1 : 0);
      if (stick.active) t += stick.y;
      return Math.max(-1, Math.min(1, t));
    },
    get steer() {
      let s = (keys.has('left') ? -1 : 0) + (keys.has('right') ? 1 : 0);
      if (stick.active) s += stick.x;
      return Math.max(-1, Math.min(1, s));
    },
    get driving() {
      return Math.abs(this.throttle) > 0.05 || Math.abs(this.steer) > 0.05;
    },
  };
}
