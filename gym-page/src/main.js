/* ============================================================
   gym-page · 铁馆 IRONHOUSE — 交互逻辑（classic 脚本，零依赖）
   huafire3d fx-lab — original implementation
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 站点配置：买家改这里，一改全改 ---------- */
  var SITE = {
    name: '铁馆 IRONHOUSE',
    phone: '400-666-8888',
    phoneHref: 'tel:4006668888',
    address: '朝阳区建国路 88 号铁馆大厦 B1',
    hours: '周一至周日 6:30 – 23:00',
    icp: '京ICP备xxxxxxxxxx号-1',
    year: '2026'
  };

  /* ---------- 法务三件套文案 ---------- */
  var LEGAL = {
    privacy: {
      title: '隐私政策',
      sub: '最后更新：2026 年 10 月 · 铁馆 IRONHOUSE',
      points: [
        '<b>我们收集什么：</b>预约体验课时你填写的姓名、电话和意向课程，仅用于这一次约课联系。',
        '<b>我们不做什么：</b>不群发广告短信，不把你的信息卖给或共享给任何第三方。',
        '<b>保存多久：</b>约课完成后 30 天内删除联系信息；成为会员后按会员协议另行保存。',
        '<b>你的权利：</b>随时打电话 <b>' + SITE.phone + '</b> 要求我们删除你的信息，我们 3 个工作日内处理完。',
        '<b>体测数据：</b>体测报告只存在你自己的手机里，场馆不留存原始数据。'
      ]
    },
    terms: {
      title: '服务条款',
      sub: '最后更新：2026 年 10 月 · 铁馆 IRONHOUSE',
      points: [
        '<b>体验课：</b>每人限约 1 节免费体验课，需提前 2 小时预约；爽约两次后不再接受免费预约。',
        '<b>私教卡：</b>10 次卡有效期 6 个月，可转让一次；7 天内未开卡可全额退款。',
        '<b>年卡：</b>实名制，仅限本人使用；因场馆原因停业超 7 天，顺延相应天数。',
        '<b>安全：</b>训练时请穿运动鞋；有心脏病、高血压等情况请提前告知教练。',
        '<b>场馆规则：</b>器械用完请归位；团课迟到 10 分钟谢绝入场，为了你的安全。'
      ]
    },
    cookies: {
      title: 'Cookie 政策',
      sub: '最后更新：2026 年 10 月 · 铁馆 IRONHOUSE',
      points: [
        '<b>我们用什么：</b>本站只用必要的技术 Cookie（记住你的排期表查看偏好），不做广告追踪。',
        '<b>第三方：</b>不接入任何广告联盟或数据分析 SDK，你的浏览行为不出这个页面。',
        '<b>怎么关：</b>浏览器设置里随时可以清除 Cookie，不影响正常看课表和预约。',
        '<b>联系：</b>对 Cookie 有疑问，打 <b>' + SITE.phone + '</b> 问我们。'
      ]
    }
  };

  /* ---------- 团课数据（周一到周日） ---------- */
  var DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  var SCHEDULE = [
    [ ['07:00', '晨间唤醒跑', '林晓', 1], ['12:15', '午间力量循环', '陈岩', 2], ['19:00', '臀腿塑形', '苏晴', 2], ['20:30', '动感单车', '林晓', 3] ],
    [ ['07:00', '瑜伽修复', '苏晴', 1], ['12:15', '壶铃入门', '阿哲', 2], ['19:00', '拳击燃脂', '阿哲', 3], ['20:30', '普拉提核心', '苏晴', 2] ],
    [ ['07:00', '战绳 HIIT', '阿哲', 3], ['12:15', '午间力量循环', '陈岩', 2], ['19:00', '动感单车', '林晓', 3], ['20:30', '拉伸放松', '苏晴', 1] ],
    [ ['07:00', '晨间唤醒跑', '林晓', 1], ['12:15', '臀腿塑形', '苏晴', 2], ['19:00', '拳击燃脂', '阿哲', 3], ['20:30', '瑜伽修复', '苏晴', 1] ],
    [ ['07:00', '壶铃入门', '阿哲', 2], ['12:15', '午间力量循环', '陈岩', 2], ['19:00', '周五夜练派对', '林晓', 2], ['20:30', '普拉提核心', '苏晴', 2] ],
    [ ['09:30', '周末力量公开课', '陈岩', 2], ['11:00', '动感单车', '林晓', 3], ['14:00', '新手器械体验', '陈岩', 1], ['16:00', '拳击燃脂', '阿哲', 3] ],
    [ ['09:30', '瑜伽修复', '苏晴', 1], ['11:00', '臀腿塑形', '苏晴', 2], ['14:00', '拉伸放松', '苏晴', 1], ['16:00', '战绳 HIIT', '阿哲', 3] ]
  ];
  var LEVEL_TXT = ['', '低强度 · 新手友好', '中强度 · 出汗刚好', '高强度 · 来真的'];

  /* ---------- SITE 渲染 ---------- */
  function renderSite() {
    document.querySelectorAll('[data-site]').forEach(function (el) {
      var k = el.getAttribute('data-site');
      if (k === 'copyright') {
        el.textContent = '© ' + SITE.year + ' ' + SITE.name + ' · 版权所有';
      } else if (SITE[k] !== undefined) {
        el.textContent = SITE[k];
      }
    });
    document.querySelectorAll('[data-site-href]').forEach(function (el) {
      var k = el.getAttribute('data-site-href');
      if (SITE[k + 'Href']) el.setAttribute('href', SITE[k + 'Href']);
    });
  }

  /* ---------- 加载态 → hero 入场 ---------- */
  var introDone = false;
  function startIntro() {
    if (introDone) return;
    introDone = true;
    var hero = document.getElementById('hero');
    if (hero) hero.classList.add('is-in');
  }
  function hideLoader() {
    var loader = document.getElementById('loader');
    if (loader) loader.classList.add('done');
    startIntro();
  }
  var LOAD_MIN = 700;
  var t0 = Date.now();
  function boot() {
    var wait = Math.max(0, LOAD_MIN - (Date.now() - t0));
    setTimeout(hideLoader, wait);
  }
  /* 不依赖 window.load（个别环境 load 延迟/不触发时 loader 会卡住）：
     DOM 解析完即开始计时，所有资源都是内联的，无需等 load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  setTimeout(hideLoader, 4000); /* 兜底：4s 内必达完成态 */

  /* ---------- 导航滚动毛玻璃 ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端抽屉 ---------- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  function setDrawer(open) {
    burger.classList.toggle('open', open);
    drawer.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
    burger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
  }
  burger.addEventListener('click', function () {
    setDrawer(!drawer.classList.contains('open'));
  });
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setDrawer(false); });
  });

  /* ---------- 跑马灯：复制一份做无缝循环 ---------- */
  var ticker = document.getElementById('ticker');
  if (ticker) ticker.innerHTML += ticker.innerHTML;

  /* ---------- 滚动 reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 团课排期：按天切换 ---------- */
  var dayTabs = document.getElementById('dayTabs');
  var classGrid = document.getElementById('classGrid');
  var todayIdx = (new Date().getDay() + 6) % 7; /* 周一=0 */

  function dots(level) {
    var s = '';
    for (var i = 1; i <= 3; i++) s += '<i class="' + (i <= level ? 'on' : '') + '"></i>';
    return s;
  }
  function renderDay(idx) {
    var html = '';
    SCHEDULE[idx].forEach(function (c) {
      html += '<article class="class-card">'
        + '<p class="t">' + c[0] + '</p>'
        + '<h3>' + c[1] + '</h3>'
        + '<p class="coach">教练 ' + c[2] + '</p>'
        + '<div class="intensity">' + dots(c[3]) + '<span>' + LEVEL_TXT[c[3]] + '</span></div>'
        + '</article>';
    });
    classGrid.innerHTML = html;
  }
  DAYS.forEach(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'day-btn' + (i === todayIdx ? ' active' : '');
    b.textContent = d;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', i === todayIdx ? 'true' : 'false');
    b.addEventListener('click', function () {
      if (b.classList.contains('active')) return;
      dayTabs.querySelectorAll('.day-btn').forEach(function (x) {
        x.classList.remove('active');
        x.setAttribute('aria-selected', 'false');
      });
      b.classList.add('active');
      b.setAttribute('aria-selected', 'true');
      classGrid.classList.add('switching');
      setTimeout(function () {
        renderDay(i);
        /* 强制回流后移除类，触发滑入过渡 */
        void classGrid.offsetWidth;
        classGrid.classList.remove('switching');
      }, 220);
    });
    dayTabs.appendChild(b);
  });
  renderDay(todayIdx);

  /* ---------- 预约表单 ---------- */
  var form = document.getElementById('trialForm');
  var formOk = document.getElementById('formOk');
  var okTitle = document.getElementById('okTitle');
  var inName = document.getElementById('inName');
  var inPhone = document.getElementById('inPhone');
  var fName = document.getElementById('fName');
  var fPhone = document.getElementById('fPhone');

  function setInvalid(field, bad) {
    field.classList.toggle('invalid', bad);
    return !bad;
  }
  inName.addEventListener('input', function () { setInvalid(fName, false); });
  inPhone.addEventListener('input', function () { setInvalid(fPhone, false); });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var nameOk = setInvalid(fName, inName.value.trim().length < 1);
    var phoneOk = setInvalid(fPhone, !/^1[3-9]\d{9}$/.test(inPhone.value.trim()));
    if (!nameOk || !phoneOk) {
      (!nameOk ? inName : inPhone).focus();
      return;
    }
    okTitle.textContent = '收到，' + inName.value.trim() + '！';
    form.hidden = true;
    formOk.hidden = false;
  });
  document.getElementById('againBtn').addEventListener('click', function () {
    formOk.hidden = true;
    form.hidden = false;
    form.reset();
    inName.focus();
  });

  /* ---------- 法务弹窗 ---------- */
  var modal = document.getElementById('legalModal');
  var mTitle = document.getElementById('legalTitle');
  var mSub = document.getElementById('legalSub');
  var mList = document.getElementById('legalList');
  var lastFocus = null;

  function openLegal(key) {
    var doc = LEGAL[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    mTitle.textContent = doc.title;
    mSub.textContent = doc.sub;
    mList.innerHTML = doc.points.map(function (p) { return '<li>' + p + '</li>'; }).join('');
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
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
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !modal.hidden) closeLegal();
  });

  renderSite();
})();
