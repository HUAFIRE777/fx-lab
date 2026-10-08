/* 野径 TRAILHEAD · outdoor-page —— 零依赖 classic 脚本 */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= 配置：买家只改这里 ================= */
  var SITE = {
    name: '野径 TRAILHEAD',
    address: '四川省成都市锦江区攀登路 88 号野径大楼 1 层',
    phone: '028-8666-2016',
    phoneHref: 'tel:+862886662016',
    email: 'hello@trailhead-outdoor.cn',
    emailHref: 'mailto:hello@trailhead-outdoor.cn',
    hours: '客服时间 9:00 – 21:00（全年无休）',
    icp: '蜀ICP备2026160888号-1',
    year: String(new Date().getFullYear())
  };

  var LEGAL = {
    privacy: {
      title: '隐私政策', en: 'PRIVACY POLICY', updated: '最后更新：2026 年 10 月',
      points: [
        ['我们收集什么', '当你下单、加入会员或联系客服时，我们会收集你的姓名、电话、收货地址和订单信息。这些只用来把装备准确送到你手上，以及为你提供会员服务。'],
        ['信息用来做什么', '仅用于订单履约、会员权益通知和售后服务。我们不会把你的个人信息出售、出租或分享给任何第三方做营销。'],
        ['信息保存多久', '订单信息按财务规定保存 5 年；会员信息在你注销会员后 30 天内彻底删除。到期自动清理，不留存档。'],
        ['你的权利', '你可以随时联系客服查询、更正或删除你的个人信息，也可以要求注销会员。我们会在 7 个工作日内处理完毕。'],
        ['未成年人', '我们的服务面向成年人。未满 18 岁请在监护人陪同下使用，会员注册需要监护人确认。'],
        ['联系我们', '对隐私政策有任何疑问，发邮件到 hello@trailhead-outdoor.cn，我们会认真回复每一封。']
      ]
    },
    terms: {
      title: '服务条款', en: 'TERMS OF SERVICE', updated: '最后更新：2026 年 10 月',
      points: [
        ['服务内容', '野径提供户外装备零售、会员服务和线下徒步活动组织。商品价格以页面标价为准，标价含税。'],
        ['会员规则', '会员年费 199 元，自开通日起算 12 个月。会员可在 App 内随时查看权益明细；退会按剩余天数折算退款。'],
        ['退换政策', '未使用、不影响二次销售的商品，15 天内无理由退换；攀登类安全装备（主绳、安全带、头盔）拆封后不退，只换质量问题件。'],
        ['活动安全', '线下徒步活动由持证领队带队，行前会做装备检查。高海拔与技术型线路有权拒绝装备不达标者参加，这是为你的安全负责。'],
        ['优惠券', '优惠券不可叠加、不可兑现，过期自动作废，页面会提前 3 天提醒。'],
        ['争议解决', '因本服务产生的争议，双方先友好协商；协商不成，提交野径所在地人民法院处理。']
      ]
    },
    cookies: {
      title: 'Cookie 政策', en: 'COOKIE POLICY', updated: '最后更新：2026 年 10 月',
      points: [
        ['什么是 Cookie', 'Cookie 是网站存在你浏览器里的小文本文件，用来记住你的偏好（比如选中的尺码、所在城市），让你下次不用重新选。'],
        ['我们用的类型', '必要型（维持页面正常运作）、偏好型（记住你的选择）、统计型（匿名统计访问量，帮我们把页面做得更好）。'],
        ['第三方 Cookie', '支付环节会跳转到持牌支付机构页面，可能产生其自身的 Cookie，以该机构的政策为准。'],
        ['你可以怎么管', '随时在浏览器设置里清除或禁用 Cookie。禁用后页面照常可看，只是偏好记不住、购物车可能留不住。'],
        ['有效期', '偏好型 Cookie 最长保存 1 年，统计型 13 个月，到期自动失效。']
      ]
    }
  };

  /* ================= SITE 渲染：一改全改 ================= */
  function renderSite() {
    var els = document.querySelectorAll('[data-site]');
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute('data-site');
      if (SITE[k] != null) els[i].textContent = SITE[k];
    }
    var links = document.querySelectorAll('[data-site-href]');
    for (var j = 0; j < links.length; j++) {
      var k2 = links[j].getAttribute('data-site-href');
      var v = SITE[k2 + 'Href'] || SITE[k2];
      if (v != null) links[j].setAttribute('href', v);
    }
  }

  /* ================= 加载态（多重兜底，保证可达） ================= */
  function loader() {
    var el = document.getElementById('loader');
    if (!el) return;
    var done = false;
    function hide() {
      if (done) return; done = true;
      el.classList.add('done');
      setTimeout(function () { el.style.display = 'none'; }, 600);
    }
    window.addEventListener('load', function () { setTimeout(hide, 500); });
    setTimeout(hide, 2600); /* 兜底：load 不触发也能关 */
  }

  /* ================= 星空（程序化生成） ================= */
  function stars() {
    var box = document.getElementById('stars');
    if (!box || reduce) return;
    var n = 70, html = '';
    for (var i = 0; i < n; i++) {
      var x = (Math.random() * 100).toFixed(2),
          y = (Math.random() * 55).toFixed(2),
          s = (Math.random() * 2 + 1).toFixed(1),
          d = (Math.random() * 3).toFixed(2);
      html += '<i style="left:' + x + '%;top:' + y + '%;width:' + s + 'px;height:' + s + 'px;animation-delay:' + d + 's"></i>';
    }
    box.innerHTML = html;
  }

  /* ================= 导航：滚动毛玻璃 ================= */
  function nav() {
    var bar = document.getElementById('nav');
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        bar.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ================= 移动端抽屉 ================= */
  function drawer() {
    var burger = document.getElementById('burger'),
        panel = document.getElementById('drawer'),
        scrim = document.getElementById('drawerScrim'),
        close = document.getElementById('drawerClose');
    function open() {
      panel.hidden = false; scrim.hidden = false;
      requestAnimationFrame(function () {
        panel.classList.add('open'); scrim.classList.add('open');
      });
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function shut() {
      panel.classList.remove('open'); scrim.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      setTimeout(function () {
        if (!panel.classList.contains('open')) { panel.hidden = true; scrim.hidden = true; }
      }, 450);
    }
    burger.addEventListener('click', open);
    close.addEventListener('click', shut);
    scrim.addEventListener('click', shut);
    var links = panel.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) links[i].addEventListener('click', shut);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) shut();
    });
  }

  /* ================= Hero 山影视差 ================= */
  function parallax() {
    var layers = document.querySelectorAll('.hero [data-depth]');
    var hero = document.getElementById('hero');
    if (!layers.length || reduce) return;
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      for (var i = 0; i < layers.length; i++) {
        var d = parseFloat(layers[i].getAttribute('data-depth'));
        layers[i].style.transform = 'translate3d(0,' + (y * d).toFixed(1) + 'px,0)';
      }
    }
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    /* 桌面端鼠标微视差 */
    if (window.matchMedia('(pointer:fine)').matches) {
      hero.addEventListener('mousemove', function (e) {
        var cx = (e.clientX / window.innerWidth - 0.5),
            cy = (e.clientY / window.innerHeight - 0.5);
        var sky = hero.querySelector('.hero-sky');
        if (sky) sky.style.transform = 'translate3d(' + (cx * -18).toFixed(1) + 'px,' + (cy * -12).toFixed(1) + 'px,0)';
      });
    }
  }

  /* ================= stagger 入场 ================= */
  function reveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) {
        if (entries[k].isIntersecting) {
          entries[k].target.classList.add('in');
          io.unobserve(entries[k].target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  /* ================= 数字滚动 ================= */
  function counters() {
    var nums = document.querySelectorAll('.count');
    if (!nums.length) return;
    function run(el) {
      var to = parseInt(el.getAttribute('data-to'), 10) || 0;
      if (reduce) { el.textContent = to; return; }
      var t0 = null, dur = 1400;
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3); /* easeOutCubic：有物理感 */
        el.textContent = Math.round(to * e);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < nums.length; i++) run(nums[i]);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) {
        if (entries[k].isIntersecting) { run(entries[k].target); io.unobserve(entries[k].target); }
      }
    }, { threshold: 0.4 });
    for (var j = 0; j < nums.length; j++) io.observe(nums[j]);
  }

  /* ================= 翻转卡：移动端点击翻转 ================= */
  function flips() {
    var cards = document.querySelectorAll('.flip');
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener('click', function (e) {
          if (e.target.closest('a')) return; /* 背面链接正常跳转 */
          card.classList.toggle('flipped');
        });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.classList.toggle('flipped');
          }
        });
      })(cards[i]);
    }
  }

  /* ================= 法务三件套弹窗 ================= */
  function legal() {
    var scrim = document.getElementById('modalScrim'),
        modal = document.getElementById('modal'),
        title = document.getElementById('modalTitle'),
        en = document.getElementById('modalEn'),
        updated = document.getElementById('modalUpdated'),
        body = document.getElementById('modalBody'),
        closeBtn = document.getElementById('modalClose'),
        lastFocus = null;

    function open(key) {
      var d = LEGAL[key];
      if (!d) return;
      lastFocus = document.activeElement;
      title.textContent = d.title;
      en.textContent = d.en;
      updated.textContent = d.updated;
      body.innerHTML = '';
      for (var i = 0; i < d.points.length; i++) {
        var h = document.createElement('h4');
        h.textContent = d.points[i][0];
        var p = document.createElement('p');
        p.textContent = d.points[i][1];
        body.appendChild(h); body.appendChild(p);
      }
      scrim.hidden = false; modal.hidden = false;
      requestAnimationFrame(function () {
        scrim.classList.add('open'); modal.classList.add('open');
      });
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function shut() {
      scrim.classList.remove('open'); modal.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () {
        if (!modal.classList.contains('open')) { scrim.hidden = true; modal.hidden = true; }
      }, 400);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    var btns = document.querySelectorAll('[data-legal]');
    for (var i = 0; i < btns.length; i++) {
      (function (b) {
        b.addEventListener('click', function () { open(b.getAttribute('data-legal')); });
      })(btns[i]);
    }
    closeBtn.addEventListener('click', shut);
    scrim.addEventListener('click', shut);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) shut();
    });
  }

  /* ================= 启动 ================= */
  renderSite();
  loader();
  stars();
  nav();
  drawer();
  parallax();
  reveal();
  counters();
  flips();
  legal();
})();
