/* 驰轮 VELOCE · 落地页交互（classic script，无 ES module）
   公司信息一改全改：改顶部 SITE 五个值即可 */
'use strict';

var SITE = {
  brand: '驰轮',
  brandEn: 'VELOCE',
  phone: '400-880-9666',
  email: 'ride@veloce-bike.cn',
  address: '上海市闵行区骑行大道 88 号',
  icp: '沪ICP备2026000000号-1',
  year: 2026
};

/* 法务三件套文案（演示模板通用条款） */
var LEGAL = {
  privacy: {
    title: '隐私政策',
    body: '<h4>我们收集什么</h4><p>预约试骑时，你填写的姓名、手机号、城市与意向车型，仅用于门店联系你安排试骑。除此之外，本页面不收集任何可识别个人的信息。</p><h4>怎么用</h4><p>你的信息只会交给就近门店的试骑专员，不会出售、出租或分享给任何第三方营销机构。</p><h4>保存多久</h4><p>试骑完成后 90 天内删除；你也可以随时来电 <b data-site="phone">—</b> 要求立即删除。</p><h4>你的权利</h4><p>你有权查询、更正、删除自己的信息，有权撤回同意。演示模板条款，最终以品牌方正式版本为准。</p>'
  },
  terms: {
    title: '服务条款',
    body: '<h4>页面性质</h4><p>本页面为品牌展示与试骑预约演示模板，车型参数、价格与库存以门店实际公示为准。</p><h4>预约试骑</h4><p>试骑免费，需本人携带有效身份证件到店签署试骑安全须知后进行；未成年人需监护人陪同。</p><h4>价格说明</h4><p>标价为官方建议零售价，"起"表示该系列最低配版本价格，具体配置与价格以门店报价单为准。</p><h4>免责</h4><p>演示模板文案与数据为虚构，仅供样式参考，不构成任何购买承诺。</p>'
  },
  cookie: {
    title: 'Cookie 说明',
    body: '<h4>我们用 Cookie 做什么</h4><p>本演示页面仅使用必要的本地存储记住你的尺码选择偏好，不做跨站追踪，不投放广告。</p><h4>第三方</h4><p>本页面未接入任何第三方统计或广告脚本，不存在第三方 Cookie。</p><h4>怎么关</h4><p>你可以在浏览器设置中随时清除本站的本地存储，不影响页面浏览。</p>'
  }
};

/* 车架尺码几何数据（驰空 AERO-R 实测示意） */
var GEO = {
  S: { stack: 540, reach: 378, head: '72.5', seat: '74',   bb: 68 },
  M: { stack: 560, reach: 390, head: '73',   seat: '73.5', bb: 70 },
  L: { stack: 585, reach: 402, head: '73',   seat: '73',   bb: 70 }
};

(function () {
  /* ---- 公司信息一改全改 ---- */
  document.querySelectorAll('[data-site]').forEach(function (el) {
    var k = el.getAttribute('data-site');
    if (!(k in SITE)) return;
    el.textContent = SITE[k];
    if (k === 'phone') el.setAttribute('href', 'tel:' + String(SITE.phone).replace(/-/g, ''));
    if (k === 'email') el.setAttribute('href', 'mailto:' + SITE.email);
  });

  /* ---- 加载态：进度条 + 保底 3.5s 强制消失，永不卡死 ---- */
  var loader = document.getElementById('loader');
  var bar = loader.querySelector('.loader-bar i');
  var p = 0, done = false;
  var tick = setInterval(function () {
    p = Math.min(p + Math.random() * 22, 92);
    bar.style.width = p + '%';
  }, 220);
  function hideLoader() {
    if (done) return; done = true;
    clearInterval(tick);
    bar.style.width = '100%';
    setTimeout(function () { loader.classList.add('off'); }, 260);
    setTimeout(function () { loader.remove(); }, 900);
  }
  window.addEventListener('load', function () { setTimeout(hideLoader, 500); });
  setTimeout(hideLoader, 3500); /* 保底 */

  /* ---- 车轮辐条：程序化生成 16 根 ---- */
  document.querySelectorAll('.spokes').forEach(function (g) {
    var cx = +g.getAttribute('data-cx'), cy = +g.getAttribute('data-cy'), r = 72;
    var ns = 'http://www.w3.org/2000/svg';
    for (var i = 0; i < 16; i++) {
      var a = (i / 16) * Math.PI * 2;
      var l = document.createElementNS(ns, 'line');
      l.setAttribute('x1', cx); l.setAttribute('y1', cy);
      l.setAttribute('x2', cx + Math.cos(a) * r); l.setAttribute('y2', cy + Math.sin(a) * r);
      l.setAttribute('stroke', '#9a9a9a'); l.setAttribute('stroke-width', '2.5');
      g.appendChild(l);
    }
  });

  /* ---- 导航：滚动毛玻璃 + 当前锚点高亮 ---- */
  var nav = document.getElementById('nav');
  var links = Array.prototype.slice.call(document.querySelectorAll('.menu a[data-nav]'));
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute('data-nav')); });
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    var cur = null;
    sections.forEach(function (s, i) {
      if (s && s.getBoundingClientRect().top < 160) cur = i;
    });
    links.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- 移动端抽屉 ---- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  function setDrawer(open) {
    drawer.classList.toggle('open', open);
    burger.classList.toggle('x', open);
    burger.setAttribute('aria-expanded', open);
    drawer.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('open')); });
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setDrawer(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setDrawer(false); closeModal(); }
  });

  /* ---- 滚动揭示：stagger 错开 ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      var sibs = Array.prototype.slice.call(el.parentNode.querySelectorAll(':scope > .rv'));
      var idx = Math.max(0, sibs.indexOf(el));
      el.style.transitionDelay = Math.min(idx * 0.09, 0.36) + 's';
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  /* ---- 数字滚动：rAF + easeOutQuart ---- */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      cio.unobserve(en.target);
      var el = en.target, target = +el.getAttribute('data-count'), t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var t = Math.min((ts - t0) / 1500, 1);
        var e = 1 - Math.pow(1 - t, 4);
        el.textContent = Math.round(target * e).toLocaleString('zh-CN');
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });

  /* ---- hero 视差：滚动下沉 + 鼠标微偏移（GSAP 增强，无则跳过） ---- */
  var visual = document.querySelector('.hero-visual');
  var bike = document.getElementById('bike');
  if (window.gsap && visual) {
    var qx = gsap.quickSetter(bike, 'x', 'px'), qy = gsap.quickSetter(bike, 'y', 'px');
    document.getElementById('hero').addEventListener('mousemove', function (e) {
      var r = visual.getBoundingClientRect();
      qx(((e.clientX - r.left) / r.width - 0.5) * 26);
      qy(((e.clientY - r.top) / r.height - 0.5) * 14);
    });
    window.addEventListener('scroll', function () {
      var y = Math.min(window.scrollY, 700);
      gsap.set(bike, { y: y * 0.12 });
    }, { passive: true });
    /* hero 入场：错开渐显 */
    gsap.from('.hero-copy .rv', { y: 34, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.35, clearProps: 'all' });
  }

  /* ---- 几何可视化：hover 参数 ↔ 图上标注联动 + 尺码切换 ---- */
  function lit(id, on) {
    var g = document.getElementById(id);
    if (g) g.classList.toggle('lit', on);
  }
  document.querySelectorAll('.geo-list li').forEach(function (li) {
    var id = li.getAttribute('data-geo');
    li.addEventListener('mouseenter', function () { lit(id, true); li.classList.add('lit'); });
    li.addEventListener('mouseleave', function () { lit(id, false); li.classList.remove('lit'); });
    li.addEventListener('click', function () { lit(id, true); li.classList.add('lit'); });
  });
  document.querySelectorAll('.size').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.size').forEach(function (b) {
        b.classList.remove('on'); b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('on'); btn.setAttribute('aria-selected', 'true');
      var d = GEO[btn.getAttribute('data-size')];
      document.querySelectorAll('.geo-list .v').forEach(function (v) {
        v.textContent = d[v.getAttribute('data-k')];
      });
      if (window.gsap) gsap.fromTo('.geo-list li', { x: 0 }, { x: 6, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', stagger: 0.05, clearProps: 'x' });
    });
  });

  /* ---- 预约表单：校验 + elastic 抖动 + 成功态 ---- */
  var form = document.getElementById('ride-form');
  var err = document.getElementById('form-err');
  var ok = document.getElementById('ride-ok');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    var city = form.city.value;
    var model = form.model.value;
    var msg = '';
    if (name.length < 2) msg = '请留下你的称呼（至少 2 个字）。';
    else if (!/^1\d{10}$/.test(phone)) msg = '手机号不对，应该是 11 位数字。';
    else if (!city) msg = '选个城市，我们好安排就近门店。';
    else if (!model) msg = '选一款想试的车。';
    if (msg) {
      err.textContent = msg;
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      return;
    }
    err.textContent = '';
    document.getElementById('ok-text').textContent =
      '谢谢 ' + name + '，' + city + ' 门店会在 24 小时内联系 ' + phone + '，为你准备好「' + model + '」的试骑车。';
    form.style.display = 'none';
    ok.classList.add('show');
  });
  document.getElementById('ok-back').addEventListener('click', function () {
    ok.classList.remove('show');
    form.reset(); form.style.display = '';
  });

  /* ---- 法务弹窗 ---- */
  var modal = document.getElementById('legal-modal');
  var mTitle = document.getElementById('legal-title');
  var mBody = document.getElementById('legal-body');
  var lastFocus = null;
  function openModal(key) {
    var L = LEGAL[key]; if (!L) return;
    lastFocus = document.activeElement;
    mTitle.textContent = L.title;
    mBody.innerHTML = L.body.replace(/data-site="phone"/g, 'data-site="phone"').replace(/—/g, SITE.phone);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-x').focus();
  }
  function closeModal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.legal-btn').forEach(function (b) {
    b.addEventListener('click', function () { openModal(b.getAttribute('data-legal')); });
  });
  modal.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', closeModal);
  });

  /* ---- 社交图标占位：演示页不跳转 ---- */
  document.querySelectorAll('.social a').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---- 减弱动态偏好：停掉车轮转动 ---- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.spokes, #crank').forEach(function (el) {
      el.style.animation = 'none';
    });
  }
})();
