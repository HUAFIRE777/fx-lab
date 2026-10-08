/* 谜屿 MYSTERY ISLE · 交互逻辑（纯原生，无外部依赖）
   章节：SITE 配置 → 加载态 → 导航/抽屉 → 迷雾 canvas → 打字机 →
          reveal → 题材筛选 → 预约表单 → 法务弹窗 */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 0 · 站点配置（页脚/表单共用，改这里即可） ---------- */
  var SITE = {
    name: '谜屿剧本杀馆',
    en: 'MYSTERY ISLE',
    phone: '021-6406-8820',
    address: '上海市徐汇区漕溪北路 45 号 3 层',
    hours: '营业时间 13:00 – 23:30（周五六延至 24:00）',
    wechat: 'miyu_sh',
    icp: '沪ICP备2026000000号-1'
  };
  var fPhone = $('#fPhone'), fAddr = $('#fAddr'), fHours = $('#fHours'),
      fWechat = $('#fWechat'), fName2 = $('#fName2'), fIcp = $('#fIcp');
  if (fPhone) { fPhone.textContent = SITE.phone; fPhone.href = 'tel:' + SITE.phone.replace(/-/g, ''); }
  if (fAddr) fAddr.textContent = '地址 ' + SITE.address;
  if (fHours) fHours.textContent = SITE.hours;
  if (fWechat) fWechat.textContent = SITE.wechat;
  if (fName2) fName2.textContent = SITE.name;
  if (fIcp) fIcp.textContent = SITE.icp;

  /* ---------- 1 · 加载态 ---------- */
  var loader = $('#loader');
  function hideLoader() { if (loader) loader.classList.add('done'); }
  window.addEventListener('load', function () { setTimeout(hideLoader, 450); });
  setTimeout(hideLoader, 3000); /* 兜底：load 迟迟不来也不卡死 */

  /* ---------- 2 · 导航滚动毛玻璃 ---------- */
  var nav = $('#nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3 · 移动端抽屉（三通道关闭：遮罩 / × / ESC） ---------- */
  var burger = $('#burger'), drawer = $('#drawer'), mask = $('#drawerMask');
  function openDrawer() {
    drawer.hidden = false; mask.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      drawer.classList.add('open'); mask.classList.add('open');
    }); });
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    $('#drawerClose').focus();
  }
  function closeDrawer() {
    drawer.classList.remove('open'); mask.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(function () { drawer.hidden = true; mask.hidden = true; }, 380);
    burger.focus();
  }
  burger.addEventListener('click', openDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  mask.addEventListener('click', closeDrawer);
  $$('#drawer a').forEach(function (a) { a.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !drawer.hidden) closeDrawer();
  });

  /* ---------- 4 · Hero 迷雾 canvas（程序化，无外部资源） ---------- */
  var fog = $('#fog'), hero = $('#hero'), ctx = fog.getContext('2d');
  var blobs = [], fogRunning = true, W = 0, H = 0;
  function sizeFog() {
    var r = hero.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    fog.width = W * dpr; fog.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function seedBlobs() {
    blobs = [];
    for (var i = 0; i < 34; i++) {
      var gold = Math.random() < 0.28;
      blobs.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 90 + Math.random() * 220,
        vx: (Math.random() - 0.35) * 0.35, vy: (Math.random() - 0.5) * 0.18,
        a: 0.028 + Math.random() * 0.05,
        hue: gold ? '201,162,75' : (Math.random() < 0.5 ? '88,60,140' : '120,110,150')
      });
    }
  }
  function drawFog() {
    if (!fogRunning) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      b.x += b.vx; b.y += b.vy;
      if (b.x < -b.r) b.x = W + b.r; if (b.x > W + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = H + b.r; if (b.y > H + b.r) b.y = -b.r;
      var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, 'rgba(' + b.hue + ',' + b.a + ')');
      g.addColorStop(1, 'rgba(' + b.hue + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    requestAnimationFrame(drawFog);
  }
  sizeFog(); seedBlobs();
  if (reduceMotion) { drawFogOnce(); } else { drawFog(); }
  function drawFogOnce() { fogRunning = false; ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < blobs.length; i++) { var b = blobs[i];
      var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, 'rgba(' + b.hue + ',' + b.a + ')'); g.addColorStop(1, 'rgba(' + b.hue + ',0)');
      ctx.fillStyle = g; ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2); } }
  window.addEventListener('resize', function () { sizeFog(); seedBlobs(); if (reduceMotion) drawFogOnce(); });
  /* hero 离开视口就暂停，省电 */
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (reduceMotion) return;
      if (e.isIntersecting && !fogRunning) { fogRunning = true; drawFog(); }
      else if (!e.isIntersecting) fogRunning = false;
    });
  }).observe(hero);

  /* ---------- 5 · 钥匙孔微光跟随鼠标 ---------- */
  var keyGlow = $('#keyGlow');
  hero.addEventListener('mousemove', function (e) {
    var r = hero.getBoundingClientRect();
    var dx = (e.clientX - r.left - r.width / 2) / r.width;
    var dy = (e.clientY - r.top - r.height * 0.32) / r.height;
    keyGlow.style.transform = 'translate(calc(-50% + ' + (dx * 46) + 'px), calc(-50% + ' + (dy * 36) + 'px))';
  });

  /* ---------- 6 · 打字机悬疑文案 ---------- */
  var tw = $('#typewriter');
  (function typewriter() {
    var full = tw.textContent;
    if (reduceMotion) return; /* 完成态即全文，无障碍兜底 */
    tw.textContent = '';
    var i = 0;
    (function tick() {
      if (i <= full.length) { tw.textContent = full.slice(0, i++); setTimeout(tick, 95); }
    })();
  })();

  /* ---------- 7 · 滚动 reveal（data-delay 做 stagger） ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) {
        var el = e.target, d = el.getAttribute('data-delay');
        if (d) el.style.transitionDelay = d + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach(function (el) { io.observe(el); });
  /* 兜底：4 秒后全部点亮，完成态永远可达 */
  setTimeout(function () { $$('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); }); }, 4000);

  /* ---------- 8 · 剧本题材 tab 筛选 ---------- */
  var tabs = $$('.tab'), grid = $('#scriptGrid'), cards = $$('.card', grid);
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active'); tab.setAttribute('aria-selected', 'true');
      var g = tab.getAttribute('data-genre');
      cards.forEach(function (c) {
        var show = g === 'all' || c.getAttribute('data-genre') === g;
        c.classList.toggle('hide', !show);
        if (show) { /* 重新触发一次 reveal 入场 */
          c.style.transform = 'none'; /* GSAP 百分比位移式坑位：先清 transform */
          c.classList.remove('is-in');
          void c.offsetWidth;
          c.classList.add('is-in');
        }
      });
    });
  });

  /* ---------- 9 · 组局预约 ---------- */
  var datePills = $('#datePills'), slotPills = $('#slotPills');
  var selDate = '', selSlot = '';
  var week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  (function buildDates() {
    var now = new Date();
    for (var i = 0; i < 7; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pill' + (i === 0 ? ' is-on' : '');
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
      var label = (d.getMonth() + 1) + '月' + d.getDate() + '日';
      b.innerHTML = (i === 0 ? '今天 ' : '') + label + '<span>' + week[d.getDay()] + '</span>';
      b.dataset.date = label + ' ' + week[d.getDay()];
      (function (btn) {
        btn.addEventListener('click', function () {
          $$('.pill', datePills).forEach(function (p) { p.classList.remove('is-on'); p.setAttribute('aria-checked', 'false'); });
          btn.classList.add('is-on'); btn.setAttribute('aria-checked', 'true');
          selDate = btn.dataset.date;
        });
      })(b);
      datePills.appendChild(b);
    }
    selDate = datePills.firstChild.dataset.date;
  })();
  $$('.pill', slotPills).forEach(function (p) {
    p.addEventListener('click', function () {
      $$('.pill', slotPills).forEach(function (q) { q.classList.remove('is-on'); q.setAttribute('aria-checked', 'false'); });
      p.classList.add('is-on'); p.setAttribute('aria-checked', 'true');
      selSlot = p.dataset.slot;
    });
  });

  /* 人数步进 */
  var count = 6, countOut = $('#countOut');
  $('#countMinus').addEventListener('click', function () { if (count > 2) { count--; countOut.textContent = count; } });
  $('#countPlus').addEventListener('click', function () { if (count < 12) { count++; countOut.textContent = count; } });

  /* 卡片"约这局"直达表单并预填 */
  var scriptSelect = $('#scriptSelect');
  $$('.card-link').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var name = btn.getAttribute('data-book');
      for (var i = 0; i < scriptSelect.options.length; i++) {
        if (scriptSelect.options[i].text === name) { scriptSelect.selectedIndex = i; break; }
      }
      $('#booking').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* 提交 */
  var form = $('#bookForm'), err = $('#formErr'), submitBtn = $('#submitBtn');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    var name = $('#fName').value.trim(), phone = $('#fPhoneInput').value.trim();
    function fail(msg) { err.textContent = msg; err.hidden = false; }
    if (!selDate) return fail('先选个日期吧。');
    if (!selSlot) return fail('再选个场次，午场晚场都行。');
    if (!name) return fail('留个称呼，DM 好认出你。');
    if (!/^1\d{10}$/.test(phone)) return fail('手机号好像少了位，11 位的那个。');
    submitBtn.disabled = true; submitBtn.textContent = '正在锁定…';
    setTimeout(function () {
      var no = 'MY-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' +
        Math.floor(1000 + Math.random() * 9000);
      $('#doneNo').textContent = no;
      $('#doneDetail').textContent = selDate + ' · ' + selSlot + ' · ' +
        (scriptSelect.value || 'DM 推荐剧本') + ' · ' + count + ' 人（' + name + '）';
      form.hidden = true;
      $('#bookDone').hidden = false;
      $('#bookDone').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }, 900);
  });
  $('#bookAgain').addEventListener('click', function () {
    $('#bookDone').hidden = true; form.hidden = false;
    submitBtn.disabled = false; submitBtn.textContent = '锁定这局';
  });

  /* ---------- 10 · 法务弹窗（三通道关闭：遮罩 / × / ESC） ---------- */
  var modalMask = $('#modalMask'), lastFocus = null;
  function openModal(id) {
    lastFocus = document.activeElement;
    var m = $('#' + id);
    m.hidden = false; modalMask.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      m.classList.add('open'); modalMask.classList.add('open');
    }); });
    document.body.style.overflow = 'hidden';
    $('.modal-x', m).focus();
  }
  function closeModal() {
    $$('.modal').forEach(function (m) { m.classList.remove('open'); });
    modalMask.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () {
      $$('.modal').forEach(function (m) { m.hidden = true; });
      modalMask.hidden = true;
    }, 320);
    if (lastFocus) lastFocus.focus();
  }
  $$('[data-modal]').forEach(function (b) {
    b.addEventListener('click', function () { openModal(b.getAttribute('data-modal')); });
  });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
  modalMask.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modalMask.hidden) closeModal();
  });
})();
