// huafire3d fx-lab — original implementation
// product-hero-3d · src/ui.js
// 界面层：文案注入 / loading 进度 / 加载失败占位 / ⚙ 实时参数面板。全部手写，无外部依赖。
export function initUI(config, viewer) {
  const $ = (sel) => document.querySelector(sel);

  // ---- 文案注入（换产品只改 CONFIG.copy）----
  const cp = config.copy;
  $('#brand').textContent = cp.brand;
  $('#eyebrow').textContent = cp.eyebrow;
  $('#pTitle').textContent = cp.title;
  $('#tagline').innerHTML = cp.tagline;
  $('#price').textContent = cp.price;
  $('#priceNote').textContent = cp.priceNote;
  $('#ctaPrimary').textContent = cp.ctaPrimary;
  $('#ctaSecondary').textContent = cp.ctaSecondary;
  $('#loadingText').textContent = config.ui.loadingText;
  document.title = `${cp.brand} ${cp.title} — 3D 产品展示`;

  // ---- loading ----
  const overlay = $('#loading'), bar = $('#loadBar'), pct = $('#loadPct');
  let lastShown = -1;
  const hooks = {
    onProgress(p) {
      overlay.classList.add('show');
      const v = Math.round(p * 100);
      if (v !== lastShown) {
        lastShown = v;
        bar.style.width = v + '%';
        pct.textContent = v + '%';
      }
    },
    onLoaded() {
      overlay.classList.remove('show');
      $('#hero').classList.add('ready');   // 文案淡入
    },
    onError(err) {
      overlay.classList.remove('show');
      $('#fallback').classList.add('show');
      $('#hero').classList.add('ready');   // 占位态下文案照常展示，不白屏
      window.__LOAD_ERROR__ = String((err && err.stack) || err); // 调试用
    },
  };
  $('#retryBtn').addEventListener('click', () => {
    $('#fallback').classList.remove('show');
    viewer.reload();
  });

  // ---- ⚙ 实时参数面板：改参即生效 ----
  if (config.ui.panel) {
    buildPanel(config, viewer);
  } else {
    $('#gearBtn').style.display = 'none';
  }

  return hooks;
}

// 路径读写小工具：'lights.key.intensity'
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => o[k], obj);
}
function setPath(obj, path, val) {
  const ks = path.split('.');
  const last = ks.pop();
  ks.reduce((o, k) => o[k], obj)[last] = val;
}

function buildPanel(config, viewer) {
  const panel = document.querySelector('#panel');
  const gear = document.querySelector('#gearBtn');
  gear.addEventListener('click', () => panel.classList.toggle('open'));

  // [标签, 配置路径, 最小, 最大, 步长]
  const sliders = [
    ['主光强度', 'lights.key.intensity', 0, 5, 0.1],
    ['补光强度', 'lights.fill.intensity', 0, 3, 0.1],
    ['轮廓光强度', 'lights.rim.intensity', 0, 8, 0.1],
    ['环境反射', 'environment.intensity', 0, 2, 0.05],
    ['曝光', 'lights.exposure', 0.4, 2, 0.05],
    ['自动转速', 'controls.autoRotateSpeed', 0, 5, 0.1],
    ['相机距离', 'camera.distanceFactor', 0.8, 2.6, 0.05],
    ['阴影浓度', 'floor.shadowOpacity', 0, 0.8, 0.05],
    ['光晕不透明度', 'background.glowOpacity', 0, 0.6, 0.02],
  ];
  const colors = [
    ['主光颜色', 'lights.key.color'],
    ['轮廓光颜色', 'lights.rim.color'],
    ['背景上', 'background.top'],
    ['背景下', 'background.bottom'],
    ['光晕颜色', 'background.glowColor'],
  ];

  const list = panel.querySelector('.panel-list');
  const addRow = (label, input) => {
    const row = document.createElement('label');
    row.className = 'panel-row';
    const name = document.createElement('span');
    name.textContent = label;
    row.append(name, input);
    list.appendChild(row);
  };

  sliders.forEach(([label, path, min, max, step]) => {
    const input = document.createElement('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = step;
    input.value = getPath(config, path);
    const val = document.createElement('b');
    val.textContent = Number(input.value).toFixed(2);
    input.addEventListener('input', () => {
      setPath(config, path, parseFloat(input.value));
      val.textContent = Number(input.value).toFixed(2);
      viewer.apply();
    });
    const wrap = document.createElement('span');
    wrap.className = 'slider-wrap';
    wrap.append(input, val);
    addRow(label, wrap);
  });

  colors.forEach(([label, path]) => {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = getPath(config, path);
    input.addEventListener('input', () => {
      setPath(config, path, input.value);
      viewer.apply();
    });
    addRow(label, input);
  });

  panel.querySelector('#resetBtn').addEventListener('click', () => {
    location.reload(); // 最可靠的重置：回到 CONFIG 出厂值
  });
}
