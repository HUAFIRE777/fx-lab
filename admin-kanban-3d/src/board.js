// huafire3d fx-lab — original implementation
// 看板渲染与数据操作：DOM 构建、跨列移动、增删列/卡片、完成态切换。
// 数据只活在内存 state 里（file:// 下 localStorage 不可用，模板演示不需要持久化）。

import { updateRings } from './rings.js';

const PRIO_LABEL = { high: '高优', med: '中优', low: '低优' };

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cardHTML(c) {
  const tags = (c.tags || []).map(t => '<span class="tag">' + esc(t) + '</span>').join('');
  return (
    '<article class="card prio-' + esc(c.priority || 'med') + (c.done ? ' is-done' : '') + '" data-card-id="' + esc(c.id) + '">' +
      '<div class="card-top">' +
        '<span class="prio-dot" title="' + esc(PRIO_LABEL[c.priority] || '') + '"></span>' +
        '<span class="card-code">' + esc(c.code || '') + '</span>' +
        '<button class="done-toggle" data-done-toggle aria-pressed="' + (c.done ? 'true' : 'false') + '" title="标记完成">' +
          '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
      '</div>' +
      '<h3 class="card-title">' + esc(c.title) + '</h3>' +
      (c.desc ? '<p class="card-desc">' + esc(c.desc) + '</p>' : '') +
      '<div class="card-meta">' + tags +
        (c.due ? '<span class="due">' + esc(c.due) + '</span>' : '') +
      '</div>' +
      '<div class="card-foot">' +
        '<span class="avatar">' + esc((c.assignee || '?').slice(0, 1)) + '</span>' +
        '<span class="assignee">' + esc(c.assignee || '') + '</span>' +
      '</div>' +
    '</article>'
  );
}

function columnHTML(col, idx) {
  const cards = col.cards.map(cardHTML).join('');
  return (
    '<section class="column" data-col-id="' + esc(col.id) + '" style="--col-i:' + idx + '">' +
      '<header class="col-head">' +
        '<span class="col-dot"></span>' +
        '<h2 class="col-title">' + esc(col.title) + '</h2>' +
        '<span class="count">' + col.cards.length + '</span>' +
        '<span class="ring" data-ring></span>' +
        '<button class="icon-btn col-add" data-add-card title="在此列添加卡片">' +
          '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</header>' +
      '<div class="card-list">' + cards +
        '<div class="empty-hint">拖到此处</div>' +
      '</div>' +
    '</section>'
  );
}

export function createBoard(root, config) {
  const state = JSON.parse(JSON.stringify({ columns: config.columns }));
  let uid = 100;

  const board = {
    root,
    get columns() { return state.columns; },

    render() {
      root.innerHTML = state.columns.map(columnHTML).join('');
      updateRings(root, state.columns);
      // 空列提示：只有该列没卡时显示
      root.querySelectorAll('.column').forEach(colEl => {
        const hasCards = colEl.querySelector('.card-list .card');
        colEl.classList.toggle('is-empty', !hasCards);
      });
    },

    locate(cardId) {
      for (const col of state.columns) {
        const i = col.cards.findIndex(c => c.id === cardId);
        if (i !== -1) return { colId: col.id, index: i };
      }
      return null;
    },

    // 跨列/列内移动；无实际变化返回 false
    applyMove(cardId, fromColId, toColId, toIndex) {
      const from = state.columns.find(c => c.id === fromColId);
      const to = state.columns.find(c => c.id === toColId);
      if (!from || !to) return false;
      const i = from.cards.findIndex(c => c.id === cardId);
      if (i === -1) return false;
      let idx = Math.max(0, Math.min(toIndex, to.cards.length));
      if (from === to && idx > i) idx -= 1; // 先删后插，同一列时下标修正
      if (from === to && idx === i) return false;
      const [card] = from.cards.splice(i, 1);
      to.cards.splice(idx, 0, card);
      return true;
    },

    addColumn() {
      uid += 1;
      state.columns.push({ id: 'col-' + uid, title: '新列表 ' + (state.columns.length + 1), cards: [] });
      this.render();
    },

    addCard(colId) {
      const col = state.columns.find(c => c.id === (colId || (state.columns[0] || {}).id));
      if (!col) return;
      uid += 1;
      col.cards.push({
        id: 'n' + uid, code: 'TASK-' + (1050 + uid),
        title: '新建任务（双击标题可改）', desc: '补充一句话说明要做什么。',
        tags: ['待分类'], priority: 'med', due: '待定', assignee: '未分配', done: false,
      });
      this.render();
    },

    toggleDone(cardId) {
      for (const col of state.columns) {
        const c = col.cards.find(x => x.id === cardId);
        if (c) { c.done = !c.done; this.render(); return; }
      }
    },

    reset() {
      state.columns = JSON.parse(JSON.stringify(config.columns));
      this.render();
    },
  };

  // 点击委托：完成态切换 / 列内添加卡片（拖拽引擎会屏蔽拖放后 300ms 内的误触）
  root.addEventListener('click', (e) => {
    const eng = window.__kanban && window.__kanban.engine;
    if (eng && Date.now() - eng.lastDropAt < 300) return;
    const tgl = e.target.closest('[data-done-toggle]');
    if (tgl) {
      const card = tgl.closest('.card');
      if (card) board.toggleDone(card.dataset.cardId);
      return;
    }
    const add = e.target.closest('[data-add-card]');
    if (add) {
      const col = add.closest('.column');
      if (col) board.addCard(col.dataset.colId);
    }
  });

  // 双击标题就地改名（小而实用的管理细节）
  root.addEventListener('dblclick', (e) => {
    const title = e.target.closest('.card-title');
    if (!title) return;
    const card = title.closest('.card');
    const cur = title.textContent;
    title.contentEditable = 'true';
    title.focus();
    const commit = () => {
      title.contentEditable = 'false';
      const v = title.textContent.trim() || cur;
      title.textContent = v;
      for (const col of state.columns) {
        const c = col.cards.find(x => x.id === card.dataset.cardId);
        if (c) c.title = v;
      }
      title.removeEventListener('blur', commit);
    };
    title.addEventListener('blur', commit);
    title.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); title.blur(); } });
  });

  return board;
}
