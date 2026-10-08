// huafire3d fx-lab — original implementation
// 拖拽引擎：Pointer Events 从零自研，无第三方库。
// 手法参考：Trello（拖起放大 + 深阴影、目标列高亮、插入槽位指示）、
// Linear（克制的 lift、放下时 FLIP 回弹 settle）。实现全部原创重写，
// 未复制任何一方源码。
//
// 原理速览：
// - pointerdown 后鼠标移动超阈值 / 触屏长按 380ms 即进入 dragging
// - 原卡片 display:none 腾出位置，body 下挂 .drag-layer（带 perspective），
//   卡片 clone 在 layer 内跟随指针：translate3d(x, y, liftZ) + rotateX/Y(速度映射) + scale
// - elementsFromPoint 做列命中，槽位 .drop-slot 指示落点，目标列高亮
// - 放下：先快照其它卡片位置 -> 提交数据 -> 重渲染 -> WAAPI FLIP 播回弹
// - 取消（Esc / 落到列外）：不提交数据，卡片从拖拽位置飞回原位

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class DragEngine {
  constructor(board, motion) {
    this.board = board;
    this.m = motion;
    this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.state = 'idle'; // idle | pending | dragging
    this.pending = null;
    this.drag = null;
    this.target = null;      // { colId, index } | null
    this.targetList = null;
    this.slot = null;
    this.layer = null;
    this.lastDropAt = 0;
    this.scrollRaf = 0;

    this._mv = (e) => this.onPointerMove(e);
    this._up = (e) => this.onPointerUp(e);
    this._cc = () => this.onPointerCancel();
    this._key = (e) => { if (e.key === 'Escape' && this.state === 'dragging') this.finishDrop(false); };
  }

  bind() {
    this.board.root.querySelectorAll('.card').forEach((el) => {
      if (el.dataset.dragBound) return;
      el.dataset.dragBound = '1';
      el.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    });
  }

  onPointerDown(e) {
    if (this.state !== 'idle') return;
    if (e.button !== undefined && e.button > 0) return;
    const cardEl = e.target.closest('.card');
    if (!cardEl || e.target.closest('[data-done-toggle]')) return;
    const ptype = e.pointerType || 'mouse';
    this.state = 'pending';
    this.pending = { cardId: cardEl.dataset.cardId, el: cardEl, x0: e.clientX, y0: e.clientY, ptype };
    window.addEventListener('pointermove', this._mv);
    window.addEventListener('pointerup', this._up);
    window.addEventListener('pointercancel', this._cc);
    if (ptype === 'touch') {
      clearTimeout(this._lpTimer);
      this._lpTimer = setTimeout(() => {
        if (this.state === 'pending' && this.pending) this.begin(this.pending.x0, this.pending.y0);
      }, this.m.longPressMs);
    } else if (ptype === 'debug') {
      this.begin(e.clientX, e.clientY); // 无头验证用：跳过阈值直接拖起
    }
  }

  onPointerMove(e) {
    if (this.state === 'pending' && this.pending) {
      const p = this.pending;
      const dx = e.clientX - p.x0, dy = e.clientY - p.y0;
      const dist = Math.hypot(dx, dy);
      if (p.ptype === 'touch' && dist > 12) { this.cancelPending(); return; } // 手指滑动 = 滚屏
      if (p.ptype === 'mouse' && dist > this.m.dragThresholdPx) { this.begin(e.clientX, e.clientY); return; }
    } else if (this.state === 'dragging') {
      this.move(e.clientX, e.clientY);
    }
  }

  onPointerUp() {
    if (this.state === 'pending') this.cancelPending(); // 一次点击，不成拖拽
    else if (this.state === 'dragging') this.finishDrop(true);
  }

  onPointerCancel() {
    if (this.state === 'pending') this.cancelPending();
    else if (this.state === 'dragging') this.finishDrop(false);
  }

  cancelPending() {
    clearTimeout(this._lpTimer);
    this.pending = null;
    this.state = 'idle';
    this.unbindWindow();
  }

  unbindWindow() {
    window.removeEventListener('pointermove', this._mv);
    window.removeEventListener('pointerup', this._up);
    window.removeEventListener('pointercancel', this._cc);
    window.removeEventListener('keydown', this._key);
  }

  begin(x, y) {
    const p = this.pending;
    if (!p) return;
    clearTimeout(this._lpTimer);
    const from = this.board.locate(p.cardId);
    if (!from) { this.cancelPending(); return; }
    const rect = p.el.getBoundingClientRect();

    // 3D 拖拽层：全屏 fixed + perspective，clone 在里面做 translateZ 浮起
    this.layer = document.createElement('div');
    this.layer.className = 'drag-layer';
    const clone = p.el.cloneNode(true);
    clone.classList.add('drag-clone');
    clone.style.width = rect.width + 'px';
    this.layer.appendChild(clone);
    document.body.appendChild(this.layer);

    // 原卡片腾位，槽位先占住原位置
    p.el.style.display = 'none';
    this.slot = document.createElement('div');
    this.slot.className = 'drop-slot';
    this.slot.style.height = rect.height + 'px';
    p.el.parentNode.insertBefore(this.slot, p.el);

    document.body.classList.add('is-dragging');
    if (p.ptype === 'touch') document.body.style.touchAction = 'none';
    window.addEventListener('keydown', this._key);

    this.drag = {
      cardId: p.cardId, from, clone,
      gx: x - rect.left, gy: y - rect.top, // 抓取点偏移
      x, y, t: performance.now(), vx: 0, vy: 0,
    };
    this.pending = null;
    this.state = 'dragging';
    this.positionClone();
    this.hitTest(x, y);
    this.startScrollLoop();
  }

  move(x, y) {
    const d = this.drag;
    if (!d) return;
    const now = performance.now();
    const dt = Math.max(1, now - d.t);
    const ivx = ((x - d.x) / dt) * 16.7;
    const ivy = ((y - d.y) / dt) * 16.7;
    d.vx += (ivx - d.vx) * 0.25; // 速度做 EMA 平滑，倾斜才不抖
    d.vy += (ivy - d.vy) * 0.25;
    d.x = x; d.y = y; d.t = now;
    this.positionClone();
    this.hitTest(x, y);
  }

  positionClone() {
    const d = this.drag;
    if (!d) return;
    let rx = 0, ry = 0, rz = 0, s = 1, z = 0;
    if (!this.reduced) {
      rx = clamp(-d.vy * 0.9, -this.m.tiltMax, this.m.tiltMax);
      ry = clamp(d.vx * 0.9, -this.m.tiltMax, this.m.tiltMax);
      rz = clamp(d.vx * 0.22, -4, 4);
      s = this.m.liftScale;
      z = this.m.liftZ;
    }
    d.clone.style.transform =
      'translate3d(' + (d.x - d.gx) + 'px,' + (d.y - d.gy) + 'px,' + z + 'px)' +
      ' rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) rotate(' + rz.toFixed(2) + 'deg)' +
      ' scale(' + s + ')';
  }

  hitTest(x, y) {
    const d = this.drag;
    if (!d) return;
    const els = document.elementsFromPoint(x, y);
    let colEl = null;
    for (const el of els) {
      if (el.closest) { colEl = el.closest('.column'); if (colEl) break; }
    }
    this.board.root.querySelectorAll('.column.drop-target')
      .forEach(c => c.classList.remove('drop-target'));
    if (!colEl) {
      this.target = null; this.targetList = null;
      if (this.slot && this.slot.parentNode) this.slot.parentNode.removeChild(this.slot);
      return;
    }
    colEl.classList.add('drop-target');
    const listEl = colEl.querySelector('.card-list');
    this.targetList = listEl;
    const cards = [...listEl.querySelectorAll('.card')]
      .filter(el => el.dataset.cardId !== d.cardId && el.style.display !== 'none');
    let idx = 0;
    for (const c of cards) {
      const r = c.getBoundingClientRect();
      if (y > r.top + r.height / 2) idx += 1;
      else break;
    }
    listEl.insertBefore(this.slot, cards[idx] || null);
    this.target = { colId: colEl.dataset.colId, index: idx };
  }

  startScrollLoop() {
    cancelAnimationFrame(this.scrollRaf);
    const step = () => {
      if (this.state !== 'dragging' || !this.drag) return;
      this.autoScroll();
      this.scrollRaf = requestAnimationFrame(step);
    };
    this.scrollRaf = requestAnimationFrame(step);
  }

  autoScroll() {
    const d = this.drag;
    const board = this.board.root;
    const br = board.getBoundingClientRect();
    const Mg = this.m.scrollMargin, V = this.m.scrollSpeed;
    if (d.x > br.right - Mg) board.scrollLeft += V;
    else if (d.x < br.left + Mg) board.scrollLeft -= V;
    if (this.targetList) {
      const lr = this.targetList.getBoundingClientRect();
      if (d.y > lr.bottom - Mg) this.targetList.scrollTop += V;
      else if (d.y < lr.top + Mg) this.targetList.scrollTop -= V;
    }
  }

  finishDrop(commit) {
    const d = this.drag;
    if (!d) return;
    cancelAnimationFrame(this.scrollRaf);
    const fromRect = d.clone.getBoundingClientRect();
    // 快照其它卡片当前位置（FLIP 用）
    const others = new Map();
    this.board.root.querySelectorAll('.card').forEach((el) => {
      if (el.dataset.cardId !== d.cardId && el.style.display !== 'none') {
        others.set(el.dataset.cardId, el.getBoundingClientRect());
      }
    });
    this.teardownDrag();
    let moved = false;
    if (commit && this.target) {
      moved = this.board.applyMove(d.cardId, d.from.colId, this.target.colId, this.target.index);
    }
    this.board.render();
    this.bind();
    this.lastDropAt = Date.now();
    if (!this.reduced) this.playFlip(d.cardId, fromRect, others);
    this.drag = null;
    this.target = null; this.targetList = null;
    this.state = 'idle';
    this.unbindWindow();
    return moved;
  }

  teardownDrag() {
    if (this.layer && this.layer.parentNode) this.layer.parentNode.removeChild(this.layer);
    this.layer = null;
    if (this.slot && this.slot.parentNode) this.slot.parentNode.removeChild(this.slot);
    this.slot = null;
    document.body.classList.remove('is-dragging');
    document.body.style.touchAction = '';
    this.board.root.querySelectorAll('.column.drop-target')
      .forEach(c => c.classList.remove('drop-target'));
  }

  playFlip(cardId, fromRect, others) {
    const ms = this.m.flipMs;
    const easing = this.m.flipEasing;
    this.board.root.querySelectorAll('.card').forEach((el) => {
      const id = el.dataset.cardId;
      const old = id === cardId ? fromRect : others.get(id);
      if (!old) return;
      const nr = el.getBoundingClientRect();
      const dx = old.left - nr.left, dy = old.top - nr.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      el.animate(
        [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }],
        { duration: ms, easing }
      );
    });
  }

  // —— 无头验证用的人工驾驶接口（preJS 里调，不影响正常交互）
  debugBeginAt(cardId, x, y) {
    const el = this.board.root.querySelector('.card[data-card-id="' + cardId + '"]');
    if (!el) return false;
    this.state = 'pending';
    this.pending = { cardId, el, x0: x, y0: y, ptype: 'debug' };
    this.begin(x, y);
    return this.state === 'dragging';
  }
  debugMoveTo(x, y, steps) {
    const d = this.drag;
    if (!d) return false;
    const n = Math.max(1, steps || 10);
    const sx = d.x, sy = d.y;
    for (let i = 1; i <= n; i += 1) {
      this.move(sx + ((x - sx) * i) / n, sy + ((y - sy) * i) / n);
    }
    return true;
  }
}
