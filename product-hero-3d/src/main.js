// huafire3d fx-lab — original implementation
// product-hero-3d · src/main.js
// 启动入口：读 CONFIG → 建 viewer → 接 UI → 加载模型。URL 参数：?model= 换模型 / ?autorotate=0 关自转 / ?panel=0 藏面板 / ?static=1 强制静态。
import { CONFIG } from './config.js';
import { ProductViewer } from './viewer.js';
import { initUI } from './ui.js';

const params = new URLSearchParams(location.search);
if (params.get('model')) CONFIG.model.url = params.get('model');
if (params.get('autorotate') === '0') CONFIG.controls.autoRotate = false;
if (params.get('panel') === '0') CONFIG.ui.panel = false;
if (params.get('static') === '1') CONFIG.intro.enabled = false; // 配合系统 reduced-motion 一起静态

const mount = document.getElementById('gl');
const viewer = new ProductViewer(mount, CONFIG, null);
const hooks = initUI(CONFIG, viewer);
viewer.hooks = hooks;

// 先按 CONFIG 把背景/灯光刷一遍（CSS 变量初值）
viewer.apply();
viewer.load(CONFIG.model.url);

// 控制台调参：__HERO.CONFIG.lights.key.intensity = 4; __HERO.apply()
window.__HERO = { CONFIG, apply: () => viewer.apply(), viewer };
