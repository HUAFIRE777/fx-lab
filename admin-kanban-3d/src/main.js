// huafire3d fx-lab — original implementation
// 入口：建板、接拖拽引擎、工具栏、错误收集（无头验证用）。

import { CONFIG } from './config.js';
import { createBoard } from './board.js';
import { DragEngine } from './drag.js';

const errors = [];
window.addEventListener('error', (e) => errors.push(String((e && e.message) || e)));
window.addEventListener('unhandledrejection', (e) => errors.push('promise: ' + String((e && e.reason) || e)));

const boardEl = document.getElementById('board');
document.getElementById('boardTitle').textContent = CONFIG.boardTitle;
document.getElementById('boardSub').textContent = CONFIG.boardSub;

const board = createBoard(boardEl, CONFIG);
const engine = new DragEngine(board, CONFIG.motion);

board.render();
engine.bind();

// 工具栏
document.getElementById('btnAddCol').addEventListener('click', () => { board.addColumn(); engine.bind(); });
document.getElementById('btnAddCard').addEventListener('click', () => { board.addCard(); engine.bind(); });
document.getElementById('btnReset').addEventListener('click', () => { board.reset(); engine.bind(); });

// 每次重渲染后 board.render() 只负责 DOM，拖拽绑定需要补：包一层
const rawRender = board.render.bind(board);
board.render = (...a) => { const r = rawRender(...a); engine.bind(); return r; };

// 无头验证 / 真机调试钩子（不影响正常交互）
window.__kanban = { board, engine, config: CONFIG, errors };
