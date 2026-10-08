/* 霆驰 ET7 落地页交互（classic script，无模块依赖；GSAP 可选增强） */
(function () {
  'use strict';

  /* ---- 公司信息：一改全改 ---- */
  var SITE = {
    brand: '霆驰汽车',
    phone: '400-821-7007',
    address: '上海市嘉定区汽车城科创路 88 号',
    icp: '沪ICP备2026007707号-1',
    year: String(new Date().getFullYear())
  };
  document.querySelectorAll('[data-site]').forEach(function (el) {
    var k = el.getAttribute('data-site');
    if (k === 'phone-href') { el.setAttribute('href', 'tel:' + SITE.phone.replace(/-/g, '')); return; }
    if (SITE[k] !== undefined) el.textContent = SITE[k];
  });

  var hasGsap = typeof window.gsap !== 'undefined';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 加载态：保底 3.5s 强制消失 ---- */
  var loader = document.getElementById('loader');
  var loadedAt = Date.now();
  function hideLoader() {
    if (!loader || loader.classList.contains('hide')) return;
    var wait = Math.max(0, 900 - (Date.now() - loadedAt));
    setTimeout(function () {
      loader.classList.add('hide');
      document.body.classList.add('ready');
      setTimeout(function () { loader.style.display = 'none'; }, 700);
    }, wait);
  }
  window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, 3500); // 永不卡死

  /* ---- 导航：滚动毛玻璃 + 当前锚点高亮 ---- */
  var nav = document.getElementById('nav');
  var menuLinks = Array.prototype.slice.call(document.querySelectorAll('.menu a'));
  var anchors = menuLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function onScrollNav() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    var cur = 0;
    anchors.forEach(function (sec, i) {
      if (sec && sec.getBoundingClientRect().top < window.innerHeight * 0.4) cur = i;
    });
    menuLinks.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---- 移动端汉堡抽屉 ---- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  function setDrawer(open) {
    burger.classList.toggle('open', open);
    drawer.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('open')); });
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setDrawer(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setDrawer(false); closeLegal(); }
  });

  /* ---- 滚动揭示 ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  /* ---- 数字滚动 ---- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var dur = 1500, t0 = null;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 4); // easeOutQuart
      el.textContent = (target * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });

  /* ---- 滚动叙事：按屏切换粘性视觉 ---- */
  var screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
  var vizs = Array.prototype.slice.call(document.querySelectorAll('.viz'));
  var curViz = -1;
  function setViz(i) {
    if (i === curViz) return;
    curViz = i;
    vizs.forEach(function (v, j) { v.classList.toggle('on', j === i); });
  }
  function narrTick() {
    var best = 0, bestD = Infinity;
    var mid = window.innerHeight * 0.5;
    screens.forEach(function (s, i) {
      var r = s.getBoundingClientRect();
      var d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    setViz(best);
  }
  var narr = document.getElementById('narr');
  var narrIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) narrTick(); });
  }, { threshold: 0 });
  narrIO.observe(narr);
  window.addEventListener('scroll', function () {
    var r = narr.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) narrTick();
  }, { passive: true });

  /* ---- hero 视差：车型剪影随滚动下沉，鼠标微移 ---- */
  var carwrap = document.getElementById('carwrap');
  var hero = document.getElementById('hero');
  var heroInner = hero.querySelector('.hero-inner');
  var mx = 0, my = 0, cx = 0, cy = 0;
  if (!reduceMotion) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
    });
    (function parallax() {
      var sy = window.scrollY;
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      if (hasGsap) {
        gsap.set(carwrap, { x: cx * 26, y: sy * 0.12 + cy * 14 });
        gsap.set(heroInner, { y: sy * -0.06 });
      } else {
        carwrap.style.transform = 'translate(' + (cx * 26) + 'px,' + (sy * 0.12 + cy * 14) + 'px)';
        heroInner.style.transform = 'translateY(' + (sy * -0.06) + 'px)';
      }
      requestAnimationFrame(parallax);
    })();
  }

  /* ---- 预约表单 ---- */
  var form = document.getElementById('bookform');
  var ferr = document.getElementById('ferr');
  var done = document.getElementById('bookdone');
  var dateInput = document.getElementById('bookdate');
  dateInput.min = new Date().toISOString().slice(0, 10);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    var city = form.city.value;
    var date = form.date.value;
    var err = '';
    if (!name) err = '请留下您的称呼，方便我们联系您。';
    else if (!/^1\d{10}$/.test(phone)) err = '手机号码好像不对，请检查 11 位数字。';
    else if (!city) err = '请选择您所在的城市。';
    else if (!date) err = '请选择期望的试驾日期。';
    if (err) {
      ferr.textContent = err;
      if (hasGsap && !reduceMotion) gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,.35)' });
      return;
    }
    ferr.textContent = '';
    document.getElementById('donemsg').textContent =
      name + '，已收到您的预约（' + city + ' · ' + date + '）。试驾专员会在 24 小时内致电 ' + phone + ' 与您确认。';
    form.style.display = 'none';
    done.classList.add('show');
    done.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });
  document.getElementById('bookagain').addEventListener('click', function () {
    form.reset();
    form.style.display = '';
    done.classList.remove('show');
  });

  /* ---- 法务三件套：弹窗 ---- */
  var modal = document.getElementById('legalmodal');
  var ltitle = document.getElementById('legaltitle');
  var lbody = document.getElementById('legalbody');
  var LEGAL = {
    privacy: {
      t: '隐私政策',
      h: '<h4>我们收集哪些信息</h4><p>预约试驾时您主动提供的姓名、手机号码、城市与期望日期；浏览本页面时产生的匿名访问统计（页面停留、点击），不含任何设备指纹与跨站追踪。</p>' +
         '<h4>信息用来做什么</h4><p>仅用于联系您确认试驾安排、发送预约提醒，以及改进页面体验。不会用于任何您未授权的用途。</p>' +
         '<h4>信息保存多久</h4><p>预约信息自提交日起保存 12 个月，到期自动删除；您可随时要求提前删除。</p>' +
         '<h4>您的权利</h4><p>您有权查询、更正、删除您的个人信息，拨打页面底部购车热线即可办理，我们会在 15 个工作日内响应。</p>' +
         '<h4>安全措施</h4><p>传输全程加密，内部访问按最小权限控制。我们不会出售、出租您的个人信息。</p>'
    },
    terms: {
      t: '服务条款',
      h: '<h4>预约试驾</h4><p>本页面预约免费，不构成购车合同。试驾需持有效驾驶证，试驾专员会在出发前核验；未满一年驾龄的用户需专员全程陪同。</p>' +
         '<h4>价格与配置</h4><p>页面所示预售价与参数为发布时信息，实际以官方公布的配置表与购车合同为准；我们保留因法规或供应链调整配置的权利，会提前公示。</p>' +
         '<h4>交付与退款</h4><p>支付定金后可在 7 天内无理由退款，定金原路退回；超过 7 天按购车合同约定执行。</p>' +
         '<h4>保修服务</h4><p>整车质保 6 年或 15 万公里，三电系统 8 年或 20 万公里，以先到为准；具体以随车保修手册为准。</p>' +
         '<h4>服务变更</h4><p>我们可能不时更新本页面内容，重大变更会在页面显著位置提示。继续使用即视为接受更新后的条款。</p>'
    },
    cookie: {
      t: 'Cookie 政策',
      h: '<h4>我们用什么</h4><p>仅使用维持页面正常运行所必需的 Cookie（如记住您关闭过弹窗），以及匿名的访问量统计，不做用户画像。</p>' +
         '<h4>我们不做什么</h4><p>不使用第三方广告追踪 Cookie，不跨站跟踪您的浏览行为，不将 Cookie 数据提供给广告商。</p>' +
         '<h4>您可以自己管理</h4><p>在浏览器设置中清除或禁用 Cookie 即可；禁用后页面依然可以正常浏览，预约功能不受影响。</p>' +
         '<h4>保留期限</h4><p>必需 Cookie 随会话结束自动失效；统计类数据匿名化后保留不超过 13 个月。</p>'
    }
  };
  function openLegal(key) {
    var d = LEGAL[key];
    if (!d) return;
    ltitle.textContent = d.t;
    lbody.innerHTML = d.h;
    lbody.scrollTop = 0;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLegal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('[data-legal]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      openLegal(a.getAttribute('data-legal'));
    });
  });
  document.getElementById('legalclose').addEventListener('click', closeLegal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeLegal(); });

  /* ---- 页脚社交占位：演示模板不外跳 ---- */
  document.querySelectorAll('.social a').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });
})();
