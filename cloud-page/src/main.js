/* 云枢 CLOUDPivot · 交互脚本（classic，无模块、无外部依赖）
   章节：0 工具 / 1 SITE 配置 / 2 加载态与 hero 编排 / 3 导航与抽屉 /
         4 终端打字机 / 5 滚动 reveal / 6 价格计算器 / 7 法务弹窗 / 8 CTA 表单 */
(function () {
  'use strict';

  /* ---------- 0. 工具 ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 1. SITE 配置（一改全改） ---------- */
  var SITE = {
    name: '云枢云计算有限公司',
    en: 'CLOUDPivot',
    phone: '400-888-6688',
    email: 'contact@cloudpivot.cloud',
    address: '上海市浦东新区云枢大厦 18 层',
    icp: '沪ICP备2026000000号'
  };
  $$('[data-site]').forEach(function (el) {
    var k = el.getAttribute('data-site');
    var v = SITE[k];
    if (v == null) return;
    if (el.tagName === 'A') {
      if (k === 'phone') el.href = 'tel:' + v.replace(/-/g, '');
      else if (k === 'email') el.href = 'mailto:' + v;
    }
    el.textContent = v;
  });

  /* ---------- 2. 加载态与 hero 编排 ---------- */
  var loader = $('#loader');
  var heroRevealed = false;
  function revealHero() {
    if (heroRevealed) return;
    heroRevealed = true;
    $$('.hero .reveal').forEach(function (el) {
      var d = parseInt(el.getAttribute('data-d') || '0', 10);
      el.style.transitionDelay = (d * 110) + 'ms';
      // requestAnimationFrame 确保 transitionDelay 先应用再生效
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.add('is-in'); });
      });
    });
  }
  function hideLoader() {
    if (!loader || loader.classList.contains('done')) { revealHero(); return; }
    loader.classList.add('done');
    setTimeout(revealHero, reduced ? 0 : 120);
    setTimeout(function () { loader.style.display = 'none'; }, 900);
  }
  window.addEventListener('load', function () { setTimeout(hideLoader, reduced ? 0 : 300); });
  setTimeout(hideLoader, 2500); // 兜底：load 迟迟不来也不卡住

  /* ---------- 3. 导航滚动毛玻璃 + 移动端抽屉 ---------- */
  var nav = $('#nav');
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('#burger'), drawer = $('#drawer'), veil = $('#veil'), drawerClose = $('#drawerClose');
  function openDrawer() {
    drawer.classList.add('open'); veil.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    drawerClose.focus();
  }
  function closeDrawer() {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open'); veil.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    burger.focus();
  }
  burger.addEventListener('click', openDrawer);
  drawerClose.addEventListener('click', closeDrawer);
  veil.addEventListener('click', closeDrawer);
  $$('.drawer-menu a, .drawer-cta a').forEach(function (a) {
    a.addEventListener('click', closeDrawer);
  });

  /* ---------- 4. 终端打字机（本页唯一核心动效） ---------- */
  var SCRIPT = [
    { t: 'cmd', text: 'pivot login' },
    { t: 'ok', text: '[ok] 已登录 cn-shanghai 区域 (sh-2)' },
    { t: 'cmd', text: 'pivot create ecs --name web-01 --cpu 2 --mem 4g' },
    { t: 'out', text: '正在创建实例 web-01 …' },
    { t: 'ok', text: '[ok] web-01 运行中 · 公网 IP 47.96.18.22 · 耗时 42s' },
    { t: 'cmd', text: 'pivot scale web-01 --replicas 3' },
    { t: 'ok', text: '[ok] 已扩容至 3 副本 · 负载均衡自动接管流量' },
    { t: 'cmd', text: 'pivot logs web-01 --tail 3' },
    { t: 'out', text: '12:04:31  GET /api/health   200 · 3ms' },
    { t: 'out', text: '12:04:32  GET /api/orders   200 · 11ms' },
    { t: 'out', text: '12:04:33  GET /api/users    200 · 7ms' }
  ];
  var termBody = $('#termBody');
  var caret = document.createElement('span');
  caret.className = 'caret';
  caret.setAttribute('aria-hidden', 'true');

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function typeLine(step) {
    var line = document.createElement('div');
    line.className = 'tl';
    termBody.appendChild(line);
    if (step.t === 'cmd') {
      var p = document.createElement('span');
      p.className = 'tl-prompt';
      p.textContent = '$ ';
      var c = document.createElement('span');
      c.className = 'tl-cmd';
      line.appendChild(p); line.appendChild(c); line.appendChild(caret);
      var txt = step.text;
      for (var i = 0; i < txt.length; i++) {
        c.textContent += txt[i];
        // 物理感：击键间隔带抖动，不是机械匀速
        await sleep(reduced ? 0 : 26 + Math.random() * 30);
      }
      await sleep(reduced ? 0 : 260);
    } else {
      var cls = step.t === 'ok' ? 'tl-ok' : (step.t === 'dim' ? 'tl-dim' : 'tl-out');
      var s = document.createElement('span');
      s.className = cls;
      line.appendChild(s); line.appendChild(caret);
      if (reduced) { s.textContent = step.text; }
      else {
        // 输出行整行淡入式打印，比逐字更快、节奏更像真实终端
        s.textContent = step.text;
        s.style.opacity = '0';
        await sleep(60);
        s.style.transition = 'opacity .18s ease-out';
        s.style.opacity = '1';
      }
      await sleep(reduced ? 0 : 300);
    }
    if (caret.parentNode) caret.parentNode.removeChild(caret);
  }

  async function termLoop() {
    // 首屏等 hero 编排走完再启动，避免用户看不到开头
    await sleep(reduced ? 0 : 900);
    for (;;) {
      termBody.innerHTML = '';
      for (var i = 0; i < SCRIPT.length; i++) {
        /* eslint-disable no-await-in-loop */
        await typeLine(SCRIPT[i]);
      }
      // 行尾停留一个空提示符，呼吸感
      var last = document.createElement('div');
      last.className = 'tl';
      var p = document.createElement('span');
      p.className = 'tl-prompt'; p.textContent = '$ ';
      last.appendChild(p); last.appendChild(caret);
      termBody.appendChild(last);
      await sleep(reduced ? 1500 : 4200);
      // 淡出清屏再下一轮
      if (!reduced) {
        termBody.style.transition = 'opacity .4s ease';
        termBody.style.opacity = '0';
        await sleep(420);
        termBody.style.opacity = '1';
        termBody.style.transition = '';
      }
    }
  }
  if (reduced) {
    // 减弱动效：直接静态呈现全部内容
    (function () {
      SCRIPT.forEach(function (step) {
        var line = document.createElement('div');
        line.className = 'tl';
        if (step.t === 'cmd') {
          line.innerHTML = '<span class="tl-prompt">$ </span><span class="tl-cmd">' + esc(step.text) + '</span>';
        } else {
          var cls = step.t === 'ok' ? 'tl-ok' : 'tl-out';
          line.innerHTML = '<span class="' + cls + '">' + esc(step.text) + '</span>';
        }
        termBody.appendChild(line);
      });
    })();
  } else {
    termLoop();
  }

  /* ---------- 5. 滚动 reveal + 4 秒安全网 ---------- */
  var ioTargets = $$('.reveal').filter(function (el) {
    return !el.closest('.hero'); // hero 走入场编排，不走 IO
  });
  ioTargets.forEach(function (el) {
    var d = parseInt(el.getAttribute('data-d') || '0', 10);
    el.style.transitionDelay = (d * 90) + 'ms';
  });
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.16 });
    ioTargets.forEach(function (el) { io.observe(el); });
  } else {
    ioTargets.forEach(function (el) { el.classList.add('is-in'); });
  }
  // 安全网：4 秒后还没点亮的，一律点亮（防 IO 漏报）
  setTimeout(function () {
    $$('.reveal:not(.is-in)').forEach(function (el) { el.classList.add('is-in'); });
  }, 4000);

  /* ---------- 6. 价格计算器 ---------- */
  var PRICE = { cpu: 18, mem: 9, disk: 0.6, bw: 25 }; // 元/单位/月
  var PRESETS = {
    starter: { cpu: 1, mem: 2, disk: 50, bw: 1 },
    balanced: { cpu: 4, mem: 8, disk: 100, bw: 5 },
    performance: { cpu: 16, mem: 64, disk: 500, bw: 20 }
  };
  var S = {
    cpu: $('#sCpu'), mem: $('#sMem'), disk: $('#sDisk'), bw: $('#sBw')
  };
  var O = {
    cpu: $('#oCpu'), mem: $('#oMem'), disk: $('#oDisk'), bw: $('#oBw')
  };
  var priceMonth = $('#priceMonth'), priceHour = $('#priceHour'), calcBreak = $('#calcBreak');
  var priceEl = $('.calc-price');

  function fmt(n) { return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 }); }

  function paintSlider(input) {
    var p = (input.value - input.min) / (input.max - input.min) * 100;
    input.style.background = 'linear-gradient(90deg, var(--cyan) ' + p + '%, rgba(242,247,250,.12) ' + p + '%)';
  }

  function calc() {
    var cpu = +S.cpu.value, mem = +S.mem.value, disk = +S.disk.value, bw = +S.bw.value;
    O.cpu.textContent = cpu + ' 核';
    O.mem.textContent = mem + ' GB';
    O.disk.textContent = disk + ' GB';
    O.bw.textContent = bw + ' TB/月';
    Object.keys(S).forEach(function (k) { paintSlider(S[k]); });

    var cCpu = cpu * PRICE.cpu, cMem = mem * PRICE.mem,
        cDisk = disk * PRICE.disk, cBw = bw * PRICE.bw;
    var month = cCpu + cMem + cDisk + cBw;

    priceMonth.textContent = fmt(Math.round(month));
    priceHour.textContent = (month / 730).toFixed(2);
    priceEl.classList.remove('tick');
    void priceEl.offsetWidth; // 重启动画
    priceEl.classList.add('tick');

    var rows = [
      ['vCPU × ' + cpu + ' 核', cCpu],
      ['内存 × ' + mem + ' GB', cMem],
      ['SSD 云硬盘 × ' + disk + ' GB', cDisk],
      ['公网带宽 × ' + bw + ' TB', cBw]
    ];
    calcBreak.innerHTML = rows.map(function (r) {
      return '<li><span>' + esc(r[0]) + '</span><b>¥' + fmt(Math.round(r[1])) + '</b></li>';
    }).join('');
  }

  var presets = $$('.preset');
  presets.forEach(function (btn) {
    btn.addEventListener('click', function () {
      presets.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var p = PRESETS[btn.getAttribute('data-preset')];
      S.cpu.value = p.cpu; S.mem.value = p.mem; S.disk.value = p.disk; S.bw.value = p.bw;
      calc();
    });
  });
  Object.keys(S).forEach(function (k) {
    S[k].addEventListener('input', function () {
      presets.forEach(function (b) { b.classList.remove('active'); }); // 手动拖=自定义
      calc();
    });
  });
  calc();

  /* ---------- 7. 法务三件套弹窗 ---------- */
  var MODAL_DOCS = {
    privacy: {
      title: '隐私政策',
      body: [
        ['我们收集什么', '注册时你填写的邮箱、公司名称；使用过程中产生的实例配置、账单记录与操作日志；遇到问题时你主动提交的工单内容。我们不收集与服务无关的个人信息。'],
        ['用来做什么', '仅用于提供云服务、计费结算、安全风控与客户支持。你的业务数据（云服务器里跑的东西）我们不看、不分析、不用于广告。'],
        ['数据存放在哪', '默认存放在你选择的区域（如 cn-shanghai），不出境。跨境传输只在你主动开启全球加速且书面确认后发生。'],
        ['保存多久', '账户存续期间保存；注销账户后，账单记录按法规保留 3 年，其余个人数据 30 天内彻底删除。'],
        ['你的权利', '你有权查看、更正、导出你的个人数据，也可随时要求删除（法律法规另有要求的除外）。发邮件到 privacy@cloudpivot.cloud，15 个工作日内答复。'],
        ['联系我们', '数据保护负责人邮箱：privacy@cloudpivot.cloud；电话 400-888-6688（工作日 9:00–18:00）。']
      ]
    },
    terms: {
      title: '服务条款',
      body: [
        ['服务内容', '云枢提供云服务器、容器、函数计算、存储、网络与数据库等按量/包年包月服务，服务等级协议（SLA）承诺单实例月度可用性不低于 99.95%。'],
        ['费用与账单', '按量服务按秒计费、每小时出账；包年包月预付费。欠费超过 7 天服务将暂停，数据保留 15 天，逾期释放前会短信+邮件提醒三次。'],
        ['你的责任', '对你账户下的一切操作负责；不得用于挖矿、垃圾邮件、网络攻击等违法违规用途，一经发现立即关停且不退款，并配合主管部门调查。'],
        ['我们的责任上限', '因我方原因导致服务中断，按中断时长 10 倍赔付代金券；任何情况下赔偿总额不超过你过去 12 个月实付费用。'],
        ['解约与退款', '按量服务随时可注销，未消费的预充值余额原路退回；包年包月 5 天内无理由全额退，超过 5 天按剩余天数折算退。'],
        ['条款变更', '重大变更提前 30 天在官网与控制台公告；继续使用即视为接受，不接受可在变更生效前注销并申请退款。']
      ]
    },
    cookie: {
      title: 'Cookie 政策',
      body: [
        ['我们用什么 Cookie', '三类：必要型（登录态、控制台偏好设置，缺了就登不上去）；统计型（页面访问分析，帮我们把文档写得更好找）；营销型（仅在你点过广告后用于归因）。'],
        ['存多久', '必要型会话结束即失效；统计型最长 13 个月；营销型最长 6 个月。到期自动删除，不续命。'],
        ['第三方有吗', '统计用自建服务，不接第三方统计 SDK。支付环节跳转到持牌支付机构时，对方按其自己的 Cookie 政策处理。'],
        ['怎么管', '浏览器设置里可随时清除或禁用；禁用必要型 Cookie 会导致控制台无法登录，其他两类禁用不影响使用。'],
        ['不追踪信号', '我们尊重浏览器的 DoNotTrack 信号：检测到 DNT=1 时，统计型与营销型 Cookie 默认不写入。'],
        ['有问题找谁', 'Cookie 相关问题发邮件到 privacy@cloudpivot.cloud，标题注明「Cookie」，我们 15 个工作日内回复。']
      ]
    }
  };

  var modal = $('#modal'), modalVeil = $('#modalVeil'),
      modalTitle = $('#modalTitle'), modalBody = $('#modalBody'), modalX = $('#modalX');
  var lastFocus = null;

  function openModal(key) {
    var doc = MODAL_DOCS[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    modalTitle.textContent = doc.title;
    modalBody.innerHTML = doc.body.map(function (sec) {
      return '<h5>' + esc(sec[0]) + '</h5><p>' + esc(sec[1]) + '</p>';
    }).join('');
    modalBody.scrollTop = 0;
    modal.classList.add('open'); modalVeil.classList.add('open');
    modal.setAttribute('aria-hidden', 'false'); modalVeil.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modalX.focus();
  }
  function closeModal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open'); modalVeil.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true'); modalVeil.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-modal]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openModal(el.getAttribute('data-modal'));
    });
  });
  modalX.addEventListener('click', closeModal);
  modalVeil.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modal.classList.contains('open')) closeModal(); // 弹窗优先于抽屉
      else closeDrawer();
    }
  });

  /* ---------- 8. CTA 表单 ---------- */
  var form = $('#ctaForm'), email = $('#ctaEmail'), msg = $('#ctaMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      msg.textContent = '邮箱格式不太对，再检查一下？';
      msg.classList.add('err');
      email.focus();
      return;
    }
    msg.classList.remove('err');
    msg.textContent = '领取成功！200 元体验金已记入该邮箱对应账户，有效期 30 天。';
    email.value = '';
  });

})();
