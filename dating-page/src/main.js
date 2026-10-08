/* 心屿 XINYU · dating-page 模板交互（vanilla JS，零依赖） */
(function () {
  'use strict';

  /* ============ 配置：一改全改 ============ */
  var SITE = {
    name: '心屿',
    phone: '400-880-6666',
    email: 'hello@xinyu.love',
    address: '上海市长宁区延安西路 889 号 12 层',
    icp: '沪ICP备2026000000号-1'
  };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============ 页脚 SITE 渲染 ============ */
  $$('[data-site]').forEach(function (el) {
    var k = el.getAttribute('data-site');
    if (!SITE[k]) return;
    el.textContent = SITE[k];
    if (k === 'phone') el.setAttribute('href', 'tel:' + SITE.phone.replace(/-/g, ''));
    if (k === 'email') el.setAttribute('href', 'mailto:' + SITE.email);
  });

  /* ============ 加载态 ============ */
  var loader = $('#loader');
  function hideLoader() { if (loader) loader.classList.add('done'); }
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, 3500); /* 兜底：load 迟迟不来也不许一直挡 */

  /* ============ 导航：滚动毛玻璃 ============ */
  var nav = $('#nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============ 移动端抽屉 ============ */
  var burger = $('#burger'), drawerVeil = $('#drawerVeil');
  function setDrawer(open) {
    document.body.classList.toggle('drawer-open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    drawerVeil.hidden = !open;
  }
  burger.addEventListener('click', function () {
    setDrawer(!document.body.classList.contains('drawer-open'));
  });
  drawerVeil.addEventListener('click', function () { setDrawer(false); });
  $$('#drawer a').forEach(function (a) {
    a.addEventListener('click', function () { setDrawer(false); });
  });

  /* ============ 滚动 reveal（完成态 .is-in 必可达） ============ */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var d = parseInt(e.target.getAttribute('data-d') || '0', 10);
          e.target.style.transitionDelay = (d * 0.12) + 's';
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    /* 4 秒安全网：IO 漏报的元素强制点亮 */
    setTimeout(function () {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    }, 4000);
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ============ 数字滚动 ============ */
  var counted = false;
  function countUp() {
    if (counted) return; counted = true;
    $$('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      if (reduced) { el.textContent = target.toFixed(dec); return; }
      var t0 = null, dur = 1400;
      function tick(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3); /* easeOutCubic，有物理感 */
        el.textContent = (target * e).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
  if ('IntersectionObserver' in window) {
    var statIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(); statIO.disconnect(); } });
    }, { threshold: 0.3 });
    var stats = $('.hero-stats');
    if (stats) statIO.observe(stats); else countUp();
  } else countUp();

  /* ============ Hero 主视觉：卡片堆叠滑动 ============ */
  var stack = $('#stack'), hint = $('#deckHint'), deckEmpty = $('#deckEmpty');
  var likesLeft = 5, matched = 0;
  var cards = $$('.pcard', stack);

  function topCard() {
    return $$('.pcard', stack).filter(function (c) {
      return c.getAttribute('data-pos') === '0' &&
             !c.classList.contains('gone-right') && !c.classList.contains('gone-left');
    })[0];
  }
  function renderHint() {
    if (hint) hint.innerHTML = '点一点试试 · 今日还剩 <b>' + likesLeft + '</b> 次心动' +
      (matched ? ' · 已心动 <b>' + matched + '</b>' : '');
  }
  function heartBurst(x, y) {
    if (reduced) return;
    var s = document.createElement('span');
    s.className = 'heart-burst';
    s.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z" fill="currentColor"/></svg>';
    s.style.left = x + 'px'; s.style.top = y + 'px';
    stack.appendChild(s);
    setTimeout(function () { s.remove(); }, 1050);
  }
  function swipe(dir) {
    var card = topCard();
    if (!card) return;
    card.classList.add(dir === 'right' ? 'gone-right' : 'gone-left');
    if (dir === 'right') {
      var r = card.getBoundingClientRect(), sr = stack.getBoundingClientRect();
      heartBurst(r.left - sr.left + r.width / 2 - 17, r.top - sr.top + 60);
      likesLeft = Math.max(0, likesLeft - 1);
      matched++;
    }
    renderHint();
    setTimeout(function () {
      /* 把飞走的卡沉到底部，下一张升上来 */
      card.classList.remove('gone-right', 'gone-left');
      card.setAttribute('data-pos', '3');
      var rest = $$('.pcard', stack).filter(function (c) { return c !== card; });
      rest.forEach(function (c) {
        c.setAttribute('data-pos', String(Math.max(0, parseInt(c.getAttribute('data-pos'), 10) - 1)));
      });
      checkEmpty();
    }, 600);
  }
  var swipedCount = 0;
  function checkEmpty() {
    swipedCount++;
    if (swipedCount >= cards.length && deckEmpty) {
      deckEmpty.hidden = false;
      $('#btnLike').disabled = true; $('#btnPass').disabled = true;
      if (hint) hint.innerHTML = '今日推荐已看完 · 明天早上 8 点上新';
    }
  }
  function resetDeck() {
    swipedCount = 0;
    cards.forEach(function (c, i) {
      c.classList.remove('gone-right', 'gone-left');
      c.setAttribute('data-pos', String(i));
    });
    likesLeft = 5; matched = 0;
    deckEmpty.hidden = true;
    $('#btnLike').disabled = false; $('#btnPass').disabled = false;
    renderHint();
  }
  var btnLike = $('#btnLike'), btnPass = $('#btnPass');
  if (btnLike) btnLike.addEventListener('click', function () { swipe('right'); });
  if (btnPass) btnPass.addEventListener('click', function () { swipe('left'); });
  var deckReset = $('#deckReset');
  if (deckReset) deckReset.addEventListener('click', resetDeck);
  renderHint();

  /* ============ CTA 上升爱心 ============ */
  var hearts = $('#ctaHearts');
  if (hearts && !reduced) {
    for (var i = 0; i < 14; i++) {
      var h = document.createElement('span');
      var size = 12 + Math.random() * 22;
      h.innerHTML = '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size +
        '"><path d="M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z" fill="currentColor"/></svg>';
      h.style.left = (Math.random() * 96) + '%';
      h.style.bottom = '-40px';
      h.style.animationDelay = (-Math.random() * 11) + 's';
      h.style.animationDuration = (8 + Math.random() * 7) + 's';
      hearts.appendChild(h);
    }
  }

  /* ============ 表单校验 + 成功态 ============ */
  var form = $('#smsForm'), phoneInput = $('#phoneInput'),
      formErr = $('#formErr'), formOk = $('#formOk');
  function maskPhone(p) { return p.slice(0, 3) + '****' + p.slice(7); }
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = phoneInput.value.replace(/\D/g, '');
      formErr.textContent = '';
      if (!v) { formErr.textContent = '先填个手机号，我们才知道把链接发给谁呀'; phoneInput.focus(); return; }
      if (!/^1[3-9]\d{9}$/.test(v)) { formErr.textContent = '这个手机号好像少了几位，再检查一下吧'; phoneInput.focus(); return; }
      /* 成功态：表单收起，成功面板展开 */
      form.style.display = 'none';
      $('#okPhone').textContent = maskPhone(v);
      formOk.classList.add('show');
    });
    phoneInput.addEventListener('input', function () { formErr.textContent = ''; });
  }

  /* ============ 法务弹窗：按钮 + 遮罩 + ESC 三通道 ============ */
  var veil = $('#modalVeil'), openModal = null;
  function showModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    openModal = m;
    veil.hidden = false;
    m.hidden = false;
    void m.offsetWidth; /* 强制回流：让 .show 的过渡动画正常起播，不依赖 rAF */
    veil.classList.add('show');
    m.classList.add('show');
    document.body.style.overflow = 'hidden';
    var x = m.querySelector('.modal-x');
    if (x) x.focus();
  }
  function hideModal() {
    if (!openModal) return;
    var m = openModal; openModal = null;
    m.classList.remove('show');
    veil.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(function () { m.hidden = true; if (!openModal) veil.hidden = true; }, 320);
  }
  $$('[data-modal]').forEach(function (b) {
    b.addEventListener('click', function () { showModal(b.getAttribute('data-modal')); });
  });
  $$('[data-close]').forEach(function (b) {
    b.addEventListener('click', hideModal);
  });
  veil.addEventListener('click', hideModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (openModal) hideModal();
      else if (document.body.classList.contains('drawer-open')) setDrawer(false);
    }
  });
})();
