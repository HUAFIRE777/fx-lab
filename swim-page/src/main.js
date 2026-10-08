/* ============================================================
   浪里 WAVELANE · swim-page 交互脚本（classic，无依赖除 GSAP）
   主视觉：Hero 波浪三层视差 + 气泡/水花 Canvas 粒子
   其余区块：IntersectionObserver reveal + 克制 hover 微交互
   ============================================================ */
(function () {
  'use strict';

  /* ---------- SITE 配置：一改全改 ---------- */
  var SITE = {
    name: '浪里 WAVELANE',
    phone: '400-820-8820',
    email: 'hi@wavelane.club',
    address: '上海市杨浦区江畔路 88 号 3 层',
    icp: '沪ICP备2026000000号-1'
  };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. SITE 渲染 ---------- */
  $$('[data-site]').forEach(function (el) {
    var k = el.getAttribute('data-site');
    if (!(k in SITE)) return;
    el.textContent = SITE[k];
    if (k === 'phone' && el.tagName === 'A') el.href = 'tel:' + SITE.phone.replace(/-/g, '');
    if (k === 'email' && el.tagName === 'A') el.href = 'mailto:' + SITE.email;
  });

  /* ---------- 2. 加载态 ---------- */
  function hideLoader() {
    $('#loader').classList.add('done');
    heroIntro();
  }
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader);
  setTimeout(function () { /* 兜底：3.5s 还没 load 也放行 */
    if (!$('#loader').classList.contains('done')) hideLoader();
  }, 3500);

  /* ---------- 3. Hero 入场（整页唯一大动效的开场编排） ---------- */
  var heroDone = false;
  function heroIntro() {
    if (heroDone) return; heroDone = true;
    var items = $$('.hero .reveal');
    if (reduced || !window.gsap) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    gsap.to(items, {
      opacity: 1, y: 0, duration: 1.05, ease: 'power3.out', stagger: 0.13,
      onComplete: function () {
        items.forEach(function (el) { el.classList.add('is-in'); });
        gsap.set(items, { clearProps: 'opacity,transform' }); /* 交棒给 CSS 完成态 */
      }
    });
  }

  /* ---------- 4. 滚动 reveal（Hero 除外，交由入场编排） ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.14 });
  $$('.reveal').forEach(function (el) {
    if (el.closest('.hero')) return; /* hero 走 GSAP 入场 */
    io.observe(el);
  });
  setTimeout(function () { /* 4s 安全网：IO 漏报兜底 */
    $$('.reveal:not(.is-in)').forEach(function (el) {
      if (!el.closest('.hero')) el.classList.add('is-in');
    });
  }, 4000);

  /* ---------- 5. 数字滚动（easeOutCubic 物理感） ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var t0 = null, dur = 1600;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      var v = (target * e) / Math.pow(10, dec);
      el.textContent = dec ? v.toFixed(dec) : Math.round(target * e);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var statIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { countUp(e.target); statIO.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  $$('.num').forEach(function (el) { statIO.observe(el); });

  /* ---------- 6. 导航：滚动毛玻璃 ---------- */
  var nav = $('#nav');
  function onScrollNav() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- 7. 移动端抽屉 ---------- */
  var burger = $('#burger'), drawer = $('#drawer'), mask = $('#drawerMask');
  function setDrawer(open) {
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { mask.hidden = false; requestAnimationFrame(function(){ mask.classList.add('show'); }); document.body.style.overflow = 'hidden'; }
    else { mask.classList.remove('show'); document.body.style.overflow = ''; setTimeout(function(){ mask.hidden = true; }, 320); }
  }
  burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('open')); });
  $('#drawerClose').addEventListener('click', function () { setDrawer(false); });
  mask.addEventListener('click', function () { setDrawer(false); });

  /* ---------- 8. 锚点平滑滚动（JS 驱动，不用 CSS scroll-behavior） ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      ev.preventDefault();
      setDrawer(false);
      t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------- 9. 课程 tab ---------- */
  var tabs = $$('.tab'), panels = $$('.panel');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      if (tab.classList.contains('is-on')) return;
      tabs.forEach(function (t) { t.classList.remove('is-on'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-on'); tab.setAttribute('aria-selected', 'true');
      var cur = $('.panel:not([hidden])');
      var next = $('.panel[data-panel="' + tab.getAttribute('data-tab') + '"]');
      if (!cur || cur === next) { panels.forEach(function(p){ p.hidden = p !== next; }); return; }
      cur.classList.add('leaving');
      setTimeout(function () {
        cur.hidden = true; cur.classList.remove('leaving');
        next.hidden = false; next.classList.remove('entering');
        void next.offsetWidth; /* reflow，重启入场动画 */
        next.classList.add('entering');
      }, 170);
    });
  });

  /* ---------- 10. 气泡 Canvas + 点击水花 ---------- */
  (function bubbles() {
    var cv = $('#bubbles'); if (!cv) return;
    var ctx = cv.getContext('2d');
    var W, H, parts = [], rings = [];
    function size() {
      var r = cv.parentElement.getBoundingClientRect();
      W = cv.width = Math.floor(r.width); H = cv.height = Math.floor(r.height);
    }
    size(); window.addEventListener('resize', size);
    function spawn(init) {
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : H + 20,
        r: 1.5 + Math.random() * 5.5,
        vy: 0.35 + Math.random() * 0.9,
        ph: Math.random() * Math.PI * 2,
        amp: 12 + Math.random() * 26,
        sp: 0.004 + Math.random() * 0.01,
        a: 0.12 + Math.random() * 0.3,
        teal: Math.random() < 0.45
      };
    }
    for (var i = 0; i < 42; i++) parts.push(spawn(true));
    function splash(x, y) {
      rings.push({ x: x, y: y, r: 6, a: 0.55 });
      for (var i = 0; i < 9; i++) {
        var ang = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 3;
        parts.push({ x: x, y: y, r: 1.5 + Math.random() * 3, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1.2,
          ph: 0, amp: 0, sp: 0, a: 0.5, teal: Math.random() < 0.6, drop: true, life: 46 + Math.random() * 22 });
      }
    }
    cv.parentElement.addEventListener('pointerdown', function (ev) {
      if (reduced) return;
      var r = cv.getBoundingClientRect();
      splash(ev.clientX - r.left, ev.clientY - r.top);
    });
    var t = 0, visible = true;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(cv.parentElement);
    (function loop() {
      requestAnimationFrame(loop);
      if (document.hidden || !visible) return;
      t += 1;
      ctx.clearRect(0, 0, W, H);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        if (p.drop) {
          p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.life--;
          if (p.life <= 0 || p.y > H + 20) { parts.splice(i, 1); continue; }
        } else {
          p.ph += p.sp; p.y -= p.vy; p.x += Math.sin(p.ph) * 0.5;
          if (p.y < -20) parts[i] = spawn(false);
        }
        var wob = p.drop ? 0 : Math.sin(p.ph) * p.amp * 0.12;
        ctx.beginPath();
        ctx.arc(p.x + wob, p.y, p.r, 0, Math.PI * 2);
        ctx.strokeStyle = p.teal ? 'rgba(53,196,181,' + p.a + ')' : 'rgba(255,255,255,' + (p.a * 0.85) + ')';
        ctx.lineWidth = 1.4; ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x + wob - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (p.a * 0.7) + ')'; ctx.fill();
      }
      for (var j = rings.length - 1; j >= 0; j--) {
        var g = rings[j]; g.r += 3.4; g.a -= 0.016;
        if (g.a <= 0) { rings.splice(j, 1); continue; }
        ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r, g.r * 0.42, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(53,196,181,' + g.a + ')'; ctx.lineWidth = 2; ctx.stroke();
      }
    })();
  })();

  /* ---------- 11. 波浪滚动视差 ---------- */
  (function waveParallax() {
    if (reduced) return;
    var waves = $('.waves'), hero = $('.hero'), ticking = false;
    function upd() {
      ticking = false;
      var y = window.scrollY;
      if (y < window.innerHeight * 1.2) {
        waves.style.transform = 'translateY(' + (y * 0.14) + 'px)';
        hero.querySelector('.hero-inner').style.transform = 'translateY(' + (y * 0.22) + 'px)';
      }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(upd); }
    }, { passive: true });
  })();

  /* ---------- 12. 法务弹窗：遮罩 / × / ESC 三通道 ---------- */
  var lastFocus = null;
  function openModal(id) {
    var m = document.getElementById(id); if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add('open'); document.body.style.overflow = 'hidden';
    var c = m.querySelector('.sheet-close'); if (c) c.focus();
  }
  function closeModal(m) {
    m.classList.remove('open'); document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('.legal-link').forEach(function (b) {
    b.addEventListener('click', function () { openModal(b.getAttribute('data-modal')); });
  });
  $$('.modal').forEach(function (m) {
    m.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-close]')) closeModal(m);
    });
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      var m = $('.modal.open'); if (m) closeModal(m);
      if (drawer.classList.contains('open')) setDrawer(false);
    }
  });

  /* ---------- 13. 预约表单 ---------- */
  var form = $('#trialForm');
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var name = $('#fName'), phone = $('#fPhone');
    var ok = true;
    function err(input, box, msg) {
      $(box).textContent = msg || '';
      input.classList.toggle('invalid', !!msg);
      if (msg) ok = false;
    }
    var nv = name.value.trim();
    err(name, '#eName', nv ? '' : '留个称呼吧，教练好知道怎么叫你');
    var pv = phone.value.replace(/\D/g, '');
    err(phone, '#ePhone',
      !pv ? '填个手机号，教练好联系你约时间' :
      !/^1[3-9]\d{9}$/.test(pv) ? '这个手机号好像少了几位，再检查一下' : '');
    if (!ok) return;
    $('#doneText').textContent = '谢谢 ' + nv + '！教练会在 2 小时内联系你约时间，记得带条毛巾，泳镜现场有。';
    form.style.display = 'none';
    var done = $('#trialDone'); done.hidden = false;
    if (window.gsap && !reduced) {
      gsap.from(done, { opacity: 0, y: 24, scale: 0.97, duration: 0.7, ease: 'back.out(1.4)' });
    }
    done.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  });
  ['fName', 'fPhone'].forEach(function (id) {
    $('#' + id).addEventListener('input', function (ev) {
      ev.target.classList.remove('invalid');
      var box = id === 'fName' ? '#eName' : '#ePhone';
      $(box).textContent = '';
    });
  });
})();
