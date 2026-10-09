/* magnetic-cards-3d · 全部原创实现（无第三方库）
 * 磁吸倾斜：欠阻尼弹簧驱动 rotateX/rotateY，离场回弹带物理过冲
 * 高光扫过 + 边缘光：CSS 变量 --gx/--gy 驱动 radial-gradient
 * 整组视差：网格整体漂移 + 每卡 depth 系数差异
 * 磁吸按钮：近场吸附 + 弹簧回位 + 点击涟漪
 * 移动端：触摸降级为 tap 翻转
 */
(function () {
  'use strict';

  /* ---------- 虚构 SaaS 文案（原创） ---------- */
  var CARDS = [
    {
      no: '01', tag: '基础版含', title: '实时协同编辑',
      desc: '千人同屏，光标所见即所得。改一个字，全员的屏幕同时变。',
      back: '适用版本：基础版<br>支持 500 人同时在线编辑，延迟低于 80 毫秒。',
      glyph: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="12" width="22" height="22" rx="5"/><rect x="18" y="6" width="22" height="22" rx="5" opacity=".45"/><path d="M14 40l4 8 4-8" opacity=".8"/></svg>'
    },
    {
      no: '02', tag: '全版本', title: '版本快照',
      desc: '每次改动自动存档。改错了，一键回到任意一个昨天。',
      back: '适用版本：全版本<br>无限历史快照保留，支持按人、按时间筛选回滚。',
      glyph: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6l16 8-16 8-16-8z"/><path d="M10 22l14 7 14-7" opacity=".65"/><path d="M10 30l14 7 14-7" opacity=".35"/></svg>'
    },
    {
      no: '03', tag: '专业版', title: '细粒度权限',
      desc: '精确到字段的授权。敏感数据，该看不见的人就是看不见。',
      back: '适用版本：专业版<br>字段级 ACL + 水印追踪，离职交接一键回收。',
      glyph: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 5l15 6v11c0 10-6.5 17-15 21-8.5-4-15-11-15-21V11z"/><circle cx="24" cy="22" r="4"/><path d="M24 26v6"/></svg>'
    },
    {
      no: '04', tag: '专业版', title: '自动化流程',
      desc: '触发器加动作，重复劳动交给规则跑。你只负责点头。',
      back: '适用版本：专业版<br>200+ 触发器模板，复杂分支条件可视化编排。',
      glyph: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><circle cx="36" cy="12" r="5"/><circle cx="24" cy="36" r="5"/><path d="M17 12h14M24 17v14" opacity=".7"/></svg>'
    },
    {
      no: '05', tag: '基础版含', title: '数据看板',
      desc: '拖拽成图，指标实时刷新。周会要的数字，打开就有。',
      back: '适用版本：基础版<br>40+ 图表组件，支持投屏模式与定时推送。',
      glyph: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 40h32"/><path d="M14 40V26M24 40V16M34 40v-12" /><path d="M12 20l12-8 10 6" opacity=".6"/></svg>'
    },
    {
      no: '06', tag: '企业版', title: '开放 API',
      desc: '全量能力开放，Webhook 即配即用。老系统也能接进来。',
      back: '适用版本：企业版<br>REST + Webhook 双通道，SLA 99.95% 专属支持。',
      glyph: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17 15l-8 9 8 9M31 15l8 9-8 9"/><path d="M27 10l-6 28" opacity=".7"/></svg>'
    }
  ];
  var DEPTHS = [0.55, 1.0, 0.7, 0.85, 0.6, 1.0];

  var finePointer = window.matchMedia('(pointer:fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- 渲染卡片 ---------- */
  var grid = document.getElementById('grid');
  var shells = [];
  CARDS.forEach(function (c, i) {
    var shell = document.createElement('div');
    shell.className = 'card-shell reveal';
    shell.setAttribute('data-depth', DEPTHS[i]);
    shell.style.zIndex = String(10 + Math.round(DEPTHS[i] * 10));
    shell.innerHTML =
      '<div class="card">' +
        '<div class="card-face">' +
          '<div class="idx"><span>' + c.no + '</span><span class="tag">' + c.tag + '</span></div>' +
          '<div class="glyph">' + c.glyph + '</div>' +
          '<h3>' + c.title + '</h3><p>' + c.desc + '</p>' +
          '<div class="foot"><span>北极星工作台</span><b>了解更多 →</b></div>' +
        '</div>' +
        '<div class="card-face card-back"><h4>' + c.title + '</h4><p>' + c.back + '</p></div>' +
      '</div>';
    grid.appendChild(shell);
    shells.push(shell);
  });

  /* ---------- 加载态：逐张升起 ---------- */
  function playIntro() {
    var els = document.querySelectorAll('.reveal');
    els.forEach(function (el, i) {
      setTimeout(function () { el.classList.add('on'); }, 120 + i * 95);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', playIntro);
  } else {
    playIntro();
  }

  /* ---------- 欠阻尼弹簧 ---------- */
  function Spring(stiff, damp) {
    this.s = 0; this.v = 0; this.stiff = stiff; this.damp = damp;
    this.t = 0;
  }
  Spring.prototype.step = function (dt) {
    var f = -this.stiff * (this.s - this.t) - this.damp * this.v;
    this.v += f * dt;
    this.s += this.v * dt;
    if (Math.abs(this.v) < 0.0004 && Math.abs(this.s - this.t) < 0.0004) {
      this.s = this.t; this.v = 0;
    }
    return this.s;
  };

  var mouse = { x: -9999, y: -9999, inWin: false };

  /* ---------- 每卡状态 ---------- */
  var tilt = !reduced && finePointer; // 触摸/减弱动效：不做倾斜
  var states = shells.map(function (shell) {
    return {
      shell: shell,
      depth: parseFloat(shell.getAttribute('data-depth')),
      rx: new Spring(170, 13), ry: new Spring(170, 13),
      lift: new Spring(150, 16),
      ox: new Spring(120, 13), oy: new Spring(120, 13), // 视差位移
      hot: false
    };
  });

  function onMove(e) {
    var x = e.clientX, y = e.clientY;
    mouse.x = x; mouse.y = y; mouse.inWin = true;
    if (!tilt) return;
    states.forEach(function (st) {
      var r = st.shell.getBoundingClientRect();
      var nx = (x - (r.left + r.width / 2)) / (r.width / 2);
      var ny = (y - (r.top + r.height / 2)) / (r.height / 2);
      var inside = Math.abs(nx) <= 1.15 && Math.abs(ny) <= 1.15;
      st.hot = inside;
      if (inside) {
        var cx = Math.max(-1, Math.min(1, nx));
        var cy = Math.max(-1, Math.min(1, ny));
        st.rx.t = -cy * 11;
        st.ry.t = cx * 13;
        st.lift.t = -9;
        // 高光/边缘光位置（百分比，clamp 到卡内）
        var gx = ((cx + 1) / 2 * 100).toFixed(1);
        var gy = ((cy + 1) / 2 * 100).toFixed(1);
        st.shell.style.setProperty('--gx', gx + '%');
        st.shell.style.setProperty('--gy', gy + '%');
      } else {
        st.rx.t = 0; st.ry.t = 0; st.lift.t = 0;
      }
    });
  }
  function onLeave() {
    mouse.inWin = false; mouse.x = -9999; mouse.y = -9999;
    states.forEach(function (st) {
      st.rx.t = 0; st.ry.t = 0; st.lift.t = 0; st.hot = false;
      st.ox.t = 0; st.oy.t = 0;
    });
    magnet.x.t = 0; magnet.y.t = 0;
  }
  window.addEventListener('mousemove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);
  window.addEventListener('blur', onLeave);

  /* ---------- 磁吸按钮 ---------- */
  var btn = document.getElementById('magnetBtn');
  var label = btn.querySelector('.label');
  var magnet = { x: new Spring(120, 11), y: new Spring(120, 11) };
  var btnCX = 0, btnCY = 0, btnNear = false;
  function measureBtn() {
    var r = btn.getBoundingClientRect();
    btnCX = r.left + r.width / 2; btnCY = r.top + r.height / 2;
  }
  measureBtn();
  window.addEventListener('resize', measureBtn);
  window.addEventListener('mousemove', function (e) {
    if (!finePointer || reduced) return;
    measureBtn();
    var dx = e.clientX - btnCX, dy = e.clientY - btnCY;
    var d = Math.sqrt(dx * dx + dy * dy);
    var R = 160;
    btnNear = d < R;
    if (btnNear) {
      var pull = 1 - d / R;
      magnet.x.t = dx * pull * 0.42;
      magnet.y.t = dy * pull * 0.42;
    } else {
      magnet.x.t = 0; magnet.y.t = 0;
    }
  }, { passive: true });

  btn.addEventListener('click', function (e) {
    var r = btn.getBoundingClientRect();
    var rip = document.createElement('span');
    rip.className = 'ripple';
    var size = Math.max(r.width, r.height) * 2.2;
    rip.style.width = rip.style.height = size + 'px';
    rip.style.left = (e.clientX - r.left) + 'px';
    rip.style.top = (e.clientY - r.top) + 'px';
    btn.appendChild(rip);
    rip.addEventListener('animationend', function () { rip.remove(); });
  });

  /* ---------- 触摸降级：tap 翻转 ---------- */
  if (!finePointer) {
    shells.forEach(function (shell) {
      shell.addEventListener('click', function () {
        var card = shell.querySelector('.card');
        var was = card.classList.contains('flipped');
        document.querySelectorAll('.card.flipped').forEach(function (c) {
          c.classList.remove('flipped');
        });
        if (!was) card.classList.add('flipped');
      });
    });
  }

  /* ---------- 主循环 ---------- */
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // 整组视差：光标驱动网格漂移，各卡按 depth 差异化
    var gtx = 0, gty = 0;
    if (mouse.inWin && tilt) {
      gtx = (mouse.x / window.innerWidth - 0.5) * 16;
      gty = (mouse.y / window.innerHeight - 0.5) * 10;
    }
    states.forEach(function (st) {
      st.ox.t = -gtx * st.depth;
      st.oy.t = -gty * st.depth;
      var rx = st.rx.step(dt), ry = st.ry.step(dt);
      var lift = st.lift.step(dt);
      var ox = st.ox.step(dt), oy = st.oy.step(dt);
      st.shell.style.transform =
        'translate3d(' + ox.toFixed(2) + 'px,' + (oy + lift).toFixed(2) + 'px,0)' +
        ' rotateX(' + rx.toFixed(2) + 'deg)' +
        ' rotateY(' + ry.toFixed(2) + 'deg)';
    });

    // 磁吸按钮
    if (finePointer && !reduced) {
      var bx = magnet.x.step(dt), by = magnet.y.step(dt);
      btn.style.transform = 'translate3d(' + bx.toFixed(2) + 'px,' + by.toFixed(2) + 'px,0)';
      label.style.transform = 'translate3d(' + (bx * 0.3).toFixed(2) + 'px,' + (by * 0.3).toFixed(2) + 'px,0)';
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
