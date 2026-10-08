/* 目屿 MUYU — 主交互逻辑
   纯原生 JS + vendor/tween.js（MUYU_Tween）。零外部依赖。 */
(function () {
  'use strict';
  var T = window.MUYU_Tween;

  /* ================= SITE 集中配置：一改全改 ================= */
  var SITE = {
    brand: '目屿 MUYU',
    phone: '400-088-2026',
    phoneHref: 'tel:4000882026',
    address: '上海市静安区南京西路 1266 号 2 层 L201',
    email: 'hello@muyu-eyewear.com',
    hours: '每日 10:00 – 22:00',
    icp: '沪ICP备2026000000号-1'
  };
  document.querySelectorAll('[data-site]').forEach(function (el) {
    var k = el.getAttribute('data-site');
    if (SITE[k] == null) return;
    el.textContent = SITE[k];
    if (k === 'phone' && el.tagName === 'A') el.setAttribute('href', SITE.phoneHref);
    if (k === 'email' && el.tagName === 'A') el.setAttribute('href', 'mailto:' + SITE.email);
  });

  /* ================= 加载态 ================= */
  var loader = document.getElementById('loader');
  function hideLoader() { if (loader) loader.classList.add('done'); }
  window.addEventListener('load', function () { setTimeout(hideLoader, 500); });
  setTimeout(hideLoader, 2600); // 双保险

  /* ================= 导航滚动态 ================= */
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ================= 移动端抽屉 ================= */
  var burger = document.getElementById('burger'),
      drawer = document.getElementById('drawer'),
      backdrop = document.getElementById('drawerBackdrop'),
      drawerClose = document.getElementById('drawerClose');
  function openDrawer() {
    drawer.classList.add('open'); backdrop.hidden = false;
    requestAnimationFrame(function () { backdrop.classList.add('open'); });
    burger.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open'); backdrop.classList.remove('open');
    setTimeout(function () { backdrop.hidden = true; }, 400);
    burger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', openDrawer);
  drawerClose.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  /* ================= HERO 入场：遮罩行揭示 ================= */
  var hero = document.getElementById('hero');
  // 完成态可达：即使 rAF/IO 异常，2.2s 后强制揭示（与 CSS 的 .is-in 覆盖规则配合）
  setTimeout(function () { hero.classList.add('is-in'); }, 700);
  setTimeout(function () { hero.classList.add('is-in'); }, 2200);

  /* ================= 滚动 stagger 入场 ================= */
  var rvEls = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ============================================================
     核心动效：镜框 360° 旋转展示
     5 层 SVG 挤出（translateZ）→ 伪厚度；rotor 做 rotateY；
     高光/阴影/刻度盘随角度联动。3D 子树内无 filter（防压平）。
     ============================================================ */
  function glassesSVG(detail) {
    var lensL = detail
      ? '<rect class="lens" x="60" y="45" width="130" height="95" rx="30"/>' +
        '<rect class="lens" x="250" y="45" width="130" height="95" rx="30"/>' +
        '<polygon class="lens-glare" points="96,50 132,50 100,135 70,135"/>' +
        '<polygon class="lens-glare" points="286,50 322,50 290,135 260,135"/>'
      : '';
    var pads = detail
      ? '<ellipse class="pad" cx="207" cy="110" rx="6" ry="9"/>' +
        '<ellipse class="pad" cx="233" cy="110" rx="6" ry="9"/>'
      : '';
    return '<svg viewBox="0 0 440 180" aria-hidden="true">' + lensL +
      '<rect class="rim" x="60" y="45" width="130" height="95" rx="30"/>' +
      '<rect class="rim" x="250" y="45" width="130" height="95" rx="30"/>' +
      '<path class="rim" d="M190 74 C206 60 234 60 250 74"/>' +
      '<path class="rim-thin" d="M60 74 L30 66"/>' +
      '<path class="rim-thin" d="M380 74 L410 66"/>' +
      '<circle class="rivet" cx="72" cy="68" r="3.5"/>' +
      '<circle class="rivet" cx="368" cy="68" r="3.5"/>' + pads + '</svg>';
  }

  var rotor = document.getElementById('rotor'),
      stage = document.getElementById('stage'),
      glare = document.getElementById('glare'),
      shadow = document.getElementById('stageShadow'),
      dialArc = document.getElementById('dialArc'),
      dialDeg = document.getElementById('dialDeg'),
      ARC = 188.5;
  var depths = [-10, -5, 0, 5, 8];
  depths.forEach(function (z, i) {
    var layer = document.createElement('div');
    layer.className = 'layer' + (z === 0 ? '' : ' side');
    layer.style.transform = 'translateZ(' + z + 'px)';
    layer.innerHTML = glassesSVG(z === 0);
    rotor.appendChild(layer);
  });

  var angle = -28,            // 开场从 -28° 用 tween 甩回 0（easeOutBack 物理感）
      autoSpeed = 26,         // °/秒
      autoOn = true,
      resumeTimer = null,
      dragging = false,
      lastX = 0, lastT = 0,
      reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render() {
    var a = ((angle % 360) + 360) % 360;
    rotor.style.transform = 'rotateY(' + angle + 'deg)';
    var rad = a * Math.PI / 180, c = Math.cos(rad);
    // 正面时高光最强，侧面时几乎消失
    glare.style.opacity = (0.12 + 0.55 * Math.pow(Math.max(c, 0), 1.6)).toFixed(3);
    // 阴影随朝向轻微呼吸
    var s = 0.72 + 0.28 * Math.abs(c);
    shadow.style.transform = 'scaleX(' + s.toFixed(3) + ')';
    shadow.style.opacity = (0.55 + 0.45 * Math.abs(c)).toFixed(3);
    // 刻度盘
    dialArc.style.strokeDashoffset = (ARC * (1 - a / 360)).toFixed(1);
    dialDeg.textContent = Math.round(a) + '°';
  }

  var prevT = performance.now();
  function loop(t) {
    var dt = Math.min((t - prevT) / 1000, 0.05);
    prevT = t;
    if (autoOn && !dragging && !reduceMotion) angle += autoSpeed * dt;
    render();
    requestAnimationFrame(loop);
  }

  // 开场：甩入（tween 真实调用点之一）
  T.tween({
    from: angle, to: 0, duration: 1100, ease: 'easeOutBack', delay: 800,
    onUpdate: function (v) { angle = v; }
  });
  // 刻度盘扫一圈的小彩蛋：延迟后 dial arc 弹性扫过（tween 真实调用点之二）
  T.tween({
    from: ARC, to: 0, duration: 1400, ease: 'easeOutElastic', delay: 1600,
    onUpdate: function (v) { if (!dragging && autoOn) dialArc.style.strokeDashoffset = v.toFixed(1); }
  });

  stage.addEventListener('pointerdown', function (e) {
    dragging = true; lastX = e.clientX; lastT = performance.now();
    stage.classList.add('dragging');
    stage.setPointerCapture(e.pointerId);
    autoOn = false;
    if (resumeTimer) clearTimeout(resumeTimer);
  });
  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX;
    lastX = e.clientX;
    angle += dx * 0.55; // 拖动系数：跟手但不飘
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('dragging');
    if (reduceMotion) return;
    resumeTimer = setTimeout(function () { autoOn = true; }, 2800); // 松手 2.8s 后恢复自动旋转
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  requestAnimationFrame(loop);

  /* ================= 系列横滑卡片（程序化 SVG 镜框） ================= */
  function frameSVG(kind, color) {
    var s = 'stroke="' + color + '" stroke-width="6" fill="none" stroke-linecap="round"';
    var lensFill = 'fill="' + color + '" opacity="0.14" stroke="none"';
    var bridge = '<path d="M110 42 C118 34 132 34 140 42" ' + s + '/>';
    var temples = '<path d="M20 44 L8 40" ' + s + '/><path d="M230 44 L242 40" ' + s + '/>';
    var inner = '';
    if (kind === 'round') {
      inner = '<circle cx="65" cy="52" r="30" ' + lensFill + '/><circle cx="185" cy="52" r="30" ' + lensFill + '/>' +
              '<circle cx="65" cy="52" r="30" ' + s + '/><circle cx="185" cy="52" r="30" ' + s + '/>';
    } else if (kind === 'panto') {
      inner = '<rect x="30" y="24" width="72" height="58" rx="28" ' + lensFill + '/>' +
              '<rect x="148" y="24" width="72" height="58" rx="28" ' + lensFill + '/>' +
              '<rect x="30" y="24" width="72" height="58" rx="28" ' + s + '/>' +
              '<rect x="148" y="24" width="72" height="58" rx="28" ' + s + '/>';
    } else {
      inner = '<rect x="28" y="22" width="76" height="62" rx="16" ' + lensFill + '/>' +
              '<rect x="146" y="22" width="76" height="62" rx="16" ' + lensFill + '/>' +
              '<rect x="28" y="22" width="76" height="62" rx="16" ' + s + '/>' +
              '<rect x="146" y="22" width="76" height="62" rx="16" ' + s + '/>';
    }
    return '<svg viewBox="0 0 250 110" aria-hidden="true">' + inner + bridge + temples + '</svg>';
  }

  var FRAMES = [
    { name: '雾屿', no: '01', kind: 'wayfarer', color: '#1A1A1A', price: '¥699', was: '¥899', tag: '热卖' },
    { name: '屿岸', no: '02', kind: 'round',    color: '#8C5A2B', price: '¥799', was: '',     tag: '新品' },
    { name: '晨雾', no: '03', kind: 'panto',    color: '#9A938A', price: '¥649', was: '',     tag: '热卖' },
    { name: '归航', no: '04', kind: 'wayfarer', color: '#D9A441', price: '¥899', was: '',     tag: '限量' },
    { name: '听屿', no: '05', kind: 'round',    color: '#4A3A2C', price: '¥749', was: '',     tag: '' },
    { name: '望舒', no: '06', kind: 'panto',    color: '#1A1A1A', price: '¥1299', was: '',    tag: '钛架' }
  ];
  var rail = document.getElementById('rail');
  FRAMES.forEach(function (f, i) {
    var a = document.createElement('a');
    a.className = 'card rv';
    a.href = '#booking';
    a.style.setProperty('--d', (i * 0.08) + 's');
    a.setAttribute('aria-label', f.name + ' ' + f.no + '，' + f.price);
    a.innerHTML =
      (f.tag ? '<span class="card-tag">' + f.tag + '</span>' : '') +
      '<div class="card-frame">' + frameSVG(f.kind, f.color) + '</div>' +
      '<h3>' + f.name + '<small>' + f.no + '</small></h3>' +
      '<p class="price">' + f.price + (f.was ? '<s>' + f.was + '</s>' : '') + '</p>' +
      '<p class="go">加入试戴盒 →</p>';
    rail.appendChild(a);
    ioObserve(a);
  });
  function ioObserve(el) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ens, o) {
        ens.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); o.disconnect(); } });
      }, { threshold: 0.1 }).observe(el);
    } else el.classList.add('in');
  }
  function railStep() {
    var card = rail.querySelector('.card');
    return card ? card.getBoundingClientRect().width + 22 : 320;
  }
  document.getElementById('railPrev').addEventListener('click', function () {
    rail.scrollBy({ left: -railStep(), behavior: 'smooth' });
  });
  document.getElementById('railNext').addEventListener('click', function () {
    rail.scrollBy({ left: railStep(), behavior: 'smooth' });
  });

  /* ================= 验光预约表单 ================= */
  var form = document.getElementById('bookForm'),
      done = document.getElementById('bookDone'),
      dateInput = document.getElementById('fDate'),
      phoneInput = document.getElementById('fPhone'),
      errPhone = document.getElementById('errPhone');
  dateInput.min = new Date().toISOString().slice(0, 10);
  phoneInput.addEventListener('input', function () { errPhone.hidden = true; });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('fName').value.trim(),
        phone = phoneInput.value.trim(),
        city = document.getElementById('fCity').value,
        date = dateInput.value,
        slot = (form.querySelector('input[name="slot"]:checked') || {}).value || '';
    if (!name || !phone || !city || !date) {
      // 浏览器原生缺失提示：聚焦第一个空项
      var first = !name ? 'fName' : !phone ? 'fPhone' : !city ? 'fCity' : 'fDate';
      document.getElementById(first).focus();
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      errPhone.hidden = false;
      phoneInput.focus();
      return;
    }
    document.getElementById('doneSummary').textContent =
      name + '，已为你锁定：' + city + ' · ' + date + ' · ' + slot;
    form.hidden = true;
    done.hidden = false;
    // 成功面板弹性入场（tween 真实调用点之三：stagger）
    var kids = done.querySelectorAll('.done-mark, h3, p, .btn');
    T.stagger(kids.length, 90, function (i, v, ez) {
      kids[i].style.opacity = v.toFixed(2);
      kids[i].style.transform = 'translateY(' + ((1 - ez) * 18).toFixed(1) + 'px)';
    }, { duration: 550 });
  });
  document.getElementById('bookAgain').addEventListener('click', function () {
    form.reset(); form.hidden = false; done.hidden = true;
    document.getElementById('fName').focus();
  });

  /* ================= 法务三件套 ================= */
  var LEGAL = {
    privacy: {
      title: '隐私政策', sub: '最后更新：2026 年 10 月',
      body:
        '<h5>我们收集什么</h5><p>预约验光时，你填写的姓名、手机号、城市和预约时间，用于安排验光师与你联系。浏览页面时，我们会记录匿名化的访问统计（如页面停留时长），用于改进页面体验，不关联你的身份。</p>' +
        '<h5>用来做什么</h5><p>收集的信息只用于三件事：确认你的验光预约、寄送你选择的试戴盒、以及在你同意的情况下推送新品信息。不会出售、出租给任何第三方。</p>' +
        '<h5>保存多久</h5><p>预约信息在服务完成后保留 12 个月用于售后，之后匿名化处理。你可以随时要求提前删除。</p>' +
        '<h5>你的权利</h5><p>你有权查看、更正、删除我们持有的你的个人信息。联系客服 <b>' + SITE.phone + '</b>（' + SITE.hours + '），我们将在 3 个工作日内响应。</p>' +
        '<h5>未成年人</h5><p>14 岁以下儿童的预约须由监护人陪同并代为填写，我们不会主动向儿童营销。</p>'
    },
    terms: {
      title: '服务条款', sub: '最后更新：2026 年 10 月',
      body:
        '<h5>试戴服务</h5><p>在家试戴免费，每位用户每次最多选择 5 副镜框，试戴期 7 天。试戴期间镜框正常佩戴痕迹无需赔偿；如镜框遗失或严重损坏，需按吊牌价的 50% 赔偿。</p>' +
        '<h5>验光预约</h5><p>验光服务免费，单次约 25 分钟。如需改期或取消，请至少提前 4 小时致电客服，无故爽约两次将暂停你的免费预约资格 90 天。</p>' +
        '<h5>退换与质保</h5><p>自签收起 30 天内，无佩戴损坏可无理由退换。镜架享 2 年质保（正常使用下的开焊、断裂免费维修或更换）；镜片划伤、镜架人为折断不在质保范围内。</p>' +
        '<h5>价格与优惠</h5><p>页面标价为人民币含税价。新客首单立减 ¥100 每个手机号限用一次，不与其他优惠叠加。</p>' +
        '<h5>责任限制</h5><p>验光结果仅供配镜参考，不能替代医院眼科诊断。如你有眼部疾病史，请先就医。</p>'
    },
    cookies: {
      title: 'Cookie 政策', sub: '最后更新：2026 年 10 月',
      body:
        '<h5>我们用什么 Cookie</h5><p>必需型：记住你的城市选择和表单草稿，关掉页面就失效。统计型：匿名访问计数，帮助我们知道哪个系列最受欢迎。营销型：仅在你点击社交媒体分享后，由对应平台写入，我们不直接操作。</p>' +
        '<h5>怎么管理</h5><p>你可以在浏览器设置里一键清除或禁用 Cookie。禁用后页面照常浏览，只是试戴盒的已选款式可能记不住，需要重新勾选。</p>' +
        '<h5>第三方</h5><p>我们接入的顺丰物流查询、短信通知服务商会写入自己的 Cookie，受它们各自的隐私政策约束，与我们无关。</p>' +
        '<h5>联系</h5><p>对 Cookie 有任何疑问，致电 <b>' + SITE.phone + '</b> 或发邮件至 <b>' + SITE.email + '</b>。</p>'
    }
  };
  var modal = document.getElementById('legalModal'),
      legalTitle = document.getElementById('legalTitle'),
      legalBody = document.getElementById('legalBody'),
      lastFocus = null;
  function openLegal(key) {
    var L = LEGAL[key];
    if (!L) return;
    lastFocus = document.activeElement;
    legalTitle.innerHTML = L.title + '<small>' + L.sub + '</small>';
    legalBody.innerHTML = L.body;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    legalBody.scrollTop = 0;
    modal.querySelector('.modal-close').focus();
  }
  function closeLegal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll('[data-legal]').forEach(function (btn) {
    btn.addEventListener('click', function () { openLegal(btn.getAttribute('data-legal')); });
  });
  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeLegal);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeLegal();
  });
})();
