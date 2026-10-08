/* 绒 RONG · salon-page 主脚本（classic，零依赖） */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ============ 配置：买家改这里，一改全改 ============ */
  var SITE = {
    name: '绒 RONG',
    address: '上海市静安区南京西路 1266 号恒隆广场 3 层 312 室',
    phone: '021-6288-6688',
    phoneHref: 'tel:+862162886688',
    email: 'hello@rong-salon.cn',
    mailtoHref: 'mailto:hello@rong-salon.cn',
    hours: '周一至周日 10:00 – 21:00（最晚入店 20:00）',
    icp: '沪ICP备xxxxxxxxxx号-1',
    year: 2026
  };

  var LEGAL = {
    privacy: {
      title: '隐私政策',
      points: [
        ['我们收集什么', '预约时我们会记录你的称呼、手机号、预约项目与时间，用于确认到店与售后回访。除此之外不收集任何信息。'],
        ['用来做什么', '你的信息只用于本次预约的确认、提醒与售后，不做营销群发，不出售、不共享给任何第三方。'],
        ['保存多久', '预约完成后 12 个月内删除。如需提前删除，发邮件或到店说一声即可，当场处理。'],
        ['你的权利', '你随时可以要求查看、更正或删除自己的预约信息，店长会在 3 个工作日内办好。'],
        ['未成年人', '14 岁以下顾客预约需由监护人陪同并代为填写信息。'],
        ['联系我们', '任何隐私问题，直接打门店电话或发邮件，店长本人回复，不转客服。']
      ]
    },
    terms: {
      title: '服务条款',
      points: [
        ['预约与到店', '在线预约成功后请按时到店。迟到 15 分钟内为你保留，超过 15 分钟顺延到下一空位，或改约其他时间。'],
        ['改约与取消', '提前 4 小时以上可免费改约或取消；2 小时内取消，染烫类项目需支付 30% 材料准备费。'],
        ['价格说明', '价目表为到店价，含洗发与基础造型。染烫前会做免费发质检测，如发质不适合，我们会如实告知并建议暂缓。'],
        ['效果承诺', '我们承诺按沟通好的方案执行。染烫后 7 天内对效果不满意，免费返工一次（发质受损类除外，会提前说明）。'],
        ['会员储值', '储值卡不记名不挂失，店内消费通用，有效期 2 年，到期未用余额可退。'],
        ['纠纷处理', '先店内协商，协商不成按消费者权益保护法处理。门店电话就是投诉电话。']
      ]
    },
    cookies: {
      title: 'Cookie 政策',
      points: [
        ['我们用什么', '本站只使用维持页面正常显示所必需的本地存储（如记住你上次选的服务项目），不放任何第三方追踪 Cookie。'],
        ['不做什么', '不做跨站追踪、不做广告画像、不把你的浏览行为卖给任何人。'],
        ['你可以关掉', '浏览器设置里随时可以清除本站的本地存储，不影响预约功能使用。'],
        ['有效期', '本地记住的偏好最多保留 30 天，到期自动清除。'],
        ['有问题找谁', '关于 Cookie 的任何疑问，发邮件给我们，3 个工作日内回复。']
      ]
    }
  };

  /* ============ SITE 渲染 ============ */
  function renderSite() {
    var els = document.querySelectorAll('[data-site]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-site');
      if (!(key in SITE)) continue;
      if (els[i].hasAttribute('data-site-href')) {
        els[i].setAttribute('href', SITE[els[i].getAttribute('data-site-href')]);
      }
      els[i].textContent = SITE[key];
    }
  }

  /* ============ 加载态 + hero 入场 ============ */
  function finishIntro() {
    var intro = document.querySelector('[data-intro]');
    if (intro) intro.classList.add('is-in');
    var loader = document.getElementById('loader');
    if (loader) loader.classList.add('done');
  }
  var introDone = false;
  function introOnce() {
    if (introDone) return;
    introDone = true;
    setTimeout(finishIntro, 700); // 最短展示 700ms
  }
  window.addEventListener('load', introOnce);
  setTimeout(introOnce, 4000); // 4s 兜底

  /* ============ 导航滚动态 ============ */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============ 移动端抽屉 ============ */
  var burger = document.getElementById('burger'),
      drawer = document.getElementById('drawer'),
      scrim = document.getElementById('drawerScrim'),
      drawerClose = document.getElementById('drawerClose');
  function openDrawer() {
    drawer.hidden = false; scrim.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.add('open'); scrim.classList.add('open');
    });
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open'); scrim.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(function () { drawer.hidden = true; scrim.hidden = true; }, 550);
  }
  burger.addEventListener('click', openDrawer);
  drawerClose.addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  var dLinks = drawer.querySelectorAll('a');
  for (var i = 0; i < dLinks.length; i++) dLinks[i].addEventListener('click', closeDrawer);

  /* ============ 滚动 reveal ============ */
  function clearDelay(el) {
    setTimeout(function () { el.style.transitionDelay = ''; }, 1100);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var d = el.getAttribute('data-d');
        if (d) el.style.transitionDelay = d + 's';
        el.classList.add('in');
        clearDelay(el);
        io.unobserve(el);
      });
    }, { threshold: 0.12 });
    var revs = document.querySelectorAll('.reveal');
    for (var j = 0; j < revs.length; j++) io.observe(revs[j]);
  } else {
    var revs2 = document.querySelectorAll('.reveal');
    for (var k = 0; k < revs2.length; k++) revs2[k].classList.add('in');
  }

  /* ============ 法务弹窗（三通道关闭） ============ */
  var modal = document.getElementById('modal'),
      modalScrim = document.getElementById('modalScrim'),
      modalTitle = document.getElementById('modalTitle'),
      modalBody = document.getElementById('modalBody'),
      modalClose = document.getElementById('modalClose'),
      lastFocus = null;
  function openLegal(key) {
    var doc = LEGAL[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    modalTitle.textContent = doc.title;
    var html = '';
    doc.points.forEach(function (p) {
      html += '<h4>' + p[0] + '</h4><p>' + p[1] + '</p>';
    });
    modalBody.innerHTML = html;
    modal.hidden = false; modalScrim.hidden = false;
    requestAnimationFrame(function () {
      modal.classList.add('open'); modalScrim.classList.add('open');
    });
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }
  function closeLegal() {
    modal.classList.remove('open'); modalScrim.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { modal.hidden = true; modalScrim.hidden = true; }, 400);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  modalClose.addEventListener('click', closeLegal);
  modalScrim.addEventListener('click', closeLegal);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      if (!modal.hidden) closeLegal();
      if (!drawer.hidden && drawer.classList.contains('open')) closeDrawer();
    }
  });
  var legalBtns = document.querySelectorAll('[data-legal]');
  for (var m = 0; m < legalBtns.length; m++) {
    (function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        openLegal(btn.getAttribute('data-legal'));
      });
    })(legalBtns[m]);
  }

  /* ============ 预约表单 ============ */
  var form = document.getElementById('bookForm'),
      success = document.getElementById('formSuccess'),
      fsBody = document.getElementById('fsBody');
  var fDate = document.getElementById('fDate');
  var today = new Date();
  var iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  fDate.min = iso;

  // 造型师墙"约他/她"直达：预选造型师
  var styBtns = document.querySelectorAll('[data-stylist]');
  for (var s = 0; s < styBtns.length; s++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var sel = document.getElementById('fStylist');
        sel.value = btn.getAttribute('data-stylist');
      });
    })(styBtns[s]);
  }

  function setErr(name, msg) {
    var p = form.querySelector('[data-err="' + name + '"]');
    var input = form.querySelector('[name="' + name + '"]');
    var field = input.closest('.field');
    if (msg) { p.textContent = msg; field.classList.add('invalid'); }
    else { p.textContent = ''; field.classList.remove('invalid'); }
  }
  function validate() {
    var ok = true;
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    if (!name) { setErr('name', '请留下称呼，方便我们确认预约'); ok = false; }
    else setErr('name', '');
    if (!/^1[3-9]\d{9}$/.test(phone)) { setErr('phone', '手机号格式不对，请检查 11 位数字'); ok = false; }
    else setErr('phone', '');
    if (!form.service.value) { setErr('service', '请选择一项服务'); ok = false; }
    else setErr('service', '');
    if (!form.date.value) { setErr('date', '请选择到店日期'); ok = false; }
    else if (form.date.value < iso) { setErr('date', '不能约过去的日子，换一天吧'); ok = false; }
    else setErr('date', '');
    if (!form.time.value) { setErr('time', '请选择时间段'); ok = false; }
    else setErr('time', '');
    return ok;
  }
  ['name', 'phone', 'service', 'date', 'time'].forEach(function (n) {
    var input = form.querySelector('[name="' + n + '"]');
    input.addEventListener('input', function () { setErr(n, ''); });
    input.addEventListener('change', function () { setErr(n, ''); });
  });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!validate()) {
      var bad = form.querySelector('.field.invalid input, .field.invalid select');
      if (bad) bad.focus();
      return;
    }
    var sty = form.stylist.value ? '（' + form.stylist.value + ' 接待）' : '';
    fsBody.innerHTML = form.name.value.trim() + '，你约的 <b>' + form.service.value + '</b>' + sty +
      '<br>' + form.date.value + '　' + form.time.value + '，我们不见不散。';
    success.hidden = false;
  });
  document.getElementById('bookAgain').addEventListener('click', function () {
    success.hidden = true;
    form.reset();
  });

  renderSite();
})();
