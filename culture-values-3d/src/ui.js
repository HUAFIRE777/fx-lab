// culture-values-3d · DOM 搭建与滚动状态（不含 three 逻辑）
import { CONFIG } from './config.js';

export function buildDOM() {
  // 顶栏
  const top = document.createElement('header');
  top.className = 'topbar';
  top.innerHTML =
    '<div class="brand"><span>' + CONFIG.brand + '</span><small>' + CONFIG.brandSub + '</small></div>' +
    '<div class="brand-en">CULTURE · 2026</div>';
  document.body.appendChild(top);

  // 四屏文案
  const main = document.createElement('main');
  main.className = 'screens';
  CONFIG.values.forEach((v, i) => {
    const s = document.createElement('section');
    s.className = 'val' + (i === 0 ? ' active' : '');
    s.id = 'val-' + i;
    s.innerHTML =
      '<div class="val-num"><span>' + String(i + 1).padStart(2, '0') + '</span><i></i><span>' + CONFIG.values.length + '</span></div>' +
      '<div class="val-shape">' + v.shape + ' · ' + v.en + '</div>' +
      '<h2>' + v.title + '</h2>' +
      '<p>' + v.desc + '</p>';
    main.appendChild(s);
  });

  // 结尾行挂在最后一屏底部
  const closing = document.createElement('div');
  closing.className = 'closing';
  closing.textContent = CONFIG.closing;
  main.querySelector('#val-3').appendChild(closing);

  // 第一屏滚动提示
  const hint = document.createElement('div');
  hint.className = 'scroll-hint';
  hint.innerHTML = '<span>' + CONFIG.hint + '</span><b></b>';
  main.querySelector('#val-0').appendChild(hint);

  document.body.appendChild(main);

  // 右侧圆点导航
  const dots = document.createElement('nav');
  dots.className = 'dots';
  dots.setAttribute('aria-label', '价值观导航');
  CONFIG.values.forEach((v, i) => {
    const d = document.createElement('button');
    d.className = 'dot' + (i === 0 ? ' on' : '');
    d.title = v.title;
    d.setAttribute('aria-label', '跳转到' + v.title);
    d.addEventListener('click', () => window.__cvScrollTo && window.__cvScrollTo(i));
    dots.appendChild(d);
  });
  document.body.appendChild(dots);

  // 装饰层 + 加载态
  ['.vignette', '.grain'].forEach(() => {});
  const vg = document.createElement('div'); vg.className = 'vignette'; document.body.appendChild(vg);
  const gr = document.createElement('div'); gr.className = 'grain'; document.body.appendChild(gr);

  const loading = document.createElement('div');
  loading.id = 'loading';
  loading.className = 'show';
  loading.innerHTML =
    '<div class="spin"></div><div id="loadingText">正在准备价值观</div>' +
    '<div class="load-track"><div id="loadBar"></div></div><div id="loadPct">0%</div>';
  document.body.appendChild(loading);

  return { loading };
}

// active 切换：base 样式下未激活屏也有 .28 透明度（JS 挂了也不白屏、不消失）
export function setActive(index) {
  const vals = document.querySelectorAll('.val');
  const dots = document.querySelectorAll('.dot');
  vals.forEach((el, i) => el.classList.toggle('active', i === index));
  dots.forEach((el, i) => el.classList.toggle('on', i === index));
}
