/* huafire3d fx-lab — original implementation
 * 演示页入口：注册 <product-viewer>，顺带演示 JS API（暂停/恢复自动旋转）。
 */
import { ProductViewer, CONFIG } from './product-viewer.js';

// 演示页小交互：第二台查看器的旋转开关，展示 setAutoRotate API
document.querySelectorAll('[data-toggle-rotate]').forEach((btn) => {
  const target = document.querySelector(btn.getAttribute('data-toggle-rotate'));
  if (!(target instanceof ProductViewer)) return;
  const sync = () => {
    const on = target.hasAttribute('auto-rotate');
    btn.textContent = on ? '暂停旋转' : '开始旋转';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  };
  btn.addEventListener('click', () => {
    target.setAutoRotate(!target.hasAttribute('auto-rotate'));
    sync();
  });
  sync();
});

// 嵌入方如需全局改默认（如默认封面），解开下面两行：
// import { CONFIG } from './product-viewer.js';
// CONFIG.poster = 'https://your-cdn.com/poster.jpg';
void CONFIG;
