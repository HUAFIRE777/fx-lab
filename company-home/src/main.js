/* Hexabase · company-home — 交互逻辑 (classic script,无依赖 except GSAP 可选) */
(function () {
  'use strict';

  /* ============ SITE 配置变量:公司信息集中在此,页脚/支持区/弹窗自动引用 ============ */
  var SITE = {
    name: 'Hexabase',
    address: '北京市朝阳区建国路 88 号现代城 A 座 1206',
    email: 'support@hexabase.io',
    phone: '+86 10 8888 6666',
    icp: '京ICP备xxxxxx号'
  };

  var hasGsap = typeof window.gsap !== 'undefined';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 0. SITE 变量渲染 ---------- */
  $$('[data-site]').forEach(function (el) {
    var k = el.getAttribute('data-site');
    if (SITE[k] != null) el.textContent = SITE[k];
  });
  $$('[data-site-href]').forEach(function (el) {
    var k = el.getAttribute('data-site-href');
    if (k === 'email') el.setAttribute('href', 'mailto:' + SITE.email);
    if (k === 'tel') el.setAttribute('href', 'tel:' + SITE.phone.replace(/\s/g, ''));
  });

  /* ---------- 1. 加载态:无条件隐藏,无提前 return 路径 ---------- */
  function hideLoader() {
    var l = $('#loader');
    if (l) l.classList.add('hide');
  }
  if (document.readyState === 'complete') {
    requestAnimationFrame(function () { requestAnimationFrame(hideLoader); });
  } else {
    window.addEventListener('load', function () {
      requestAnimationFrame(function () { requestAnimationFrame(hideLoader); });
    });
  }
  setTimeout(hideLoader, 2500); /* 兜底:任何情况下 2.5s 必关 */

  /* ---------- 2. 导航滚动态 ---------- */
  var nav = $('#nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. 下拉面板:hover 意图 + 键盘 ---------- */
  var items = $$('[data-menu]');
  var closeTimer = null;
  function closeAll(except) {
    items.forEach(function (it) {
      if (it !== except) {
        it.classList.remove('open');
        $('.nav-btn', it).setAttribute('aria-expanded', 'false');
      }
    });
  }
  items.forEach(function (it) {
    var btn = $('.nav-btn', it);
    it.addEventListener('mouseenter', function () {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      closeAll(it);
      it.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    });
    it.addEventListener('mouseleave', function () {
      closeTimer = setTimeout(function () {
        it.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }, 140);
    });
    btn.addEventListener('focus', function () {
      closeAll(it);
      it.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    });
    btn.addEventListener('click', function () {
      var willOpen = !it.classList.contains('open');
      closeAll();
      if (willOpen) { it.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAll(); closeDrawer(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-menu]')) closeAll();
  });

  /* ---------- 4. 移动端抽屉 ---------- */
  var drawer = $('#drawer'), scrim = $('#scrim'), burger = $('#burger');
  function openDrawer() {
    drawer.classList.add('open'); scrim.classList.add('show');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open'); scrim.classList.remove('show');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', function () {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  $('#drawerClose').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  $$('[data-acc]').forEach(function (acc) {
    var b = $('.acc-btn', acc), body = $('.acc-body', acc);
    b.addEventListener('click', function () {
      var open = acc.classList.toggle('open');
      body.style.maxHeight = open ? body.scrollHeight + 'px' : '0px';
    });
  });

  /* ---------- 5. Hero 光斑:怠速漂移 + 鼠标视差 ---------- */
  var blobs = $$('.blob');
  if (hasGsap && !reduceMotion && blobs.length) {
    blobs.forEach(function (b, i) {
      window.gsap.to(b, {
        x: (i % 2 ? -1 : 1) * (40 + i * 22),
        y: (i % 2 ? 1 : -1) * (30 + i * 16),
        duration: 9 + i * 3, yoyo: true, repeat: -1, ease: 'sine.inOut'
      });
    });
    /* 鼠标视差作用在 .blobs 容器上,与单 blob 的 yoyo 漂移互不打架 */
    var hero = $('#hero'), blobsBox = $('.blobs');
    var qx = window.gsap.quickTo(blobsBox, 'x', { duration: 1.4, ease: 'power3.out' });
    var qy = window.gsap.quickTo(blobsBox, 'y', { duration: 1.4, ease: 'power3.out' });
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      var ny = (e.clientY - r.top) / r.height - 0.5;
      qx(nx * 60); qy(ny * 44);
    });
  }

  /* ---------- 6. 代码窗口打字机 ---------- */
  var CODE = [
    [{ t: '// 1. 引入 SDK,一次接入', c: 'tok-c' }],
    [{ t: 'const ', c: 'tok-k' }, { t: 'hexabase', c: 'tok-p' }, { t: ' = ', c: 'tok-p' }, { t: "require", c: 'tok-f' }, { t: "('", c: 'tok-p' }, { t: 'hexabase', c: 'tok-s' }, { t: "')('", c: 'tok-p' }, { t: 'hb_sk_live_…', c: 'tok-s' }, { t: "');", c: 'tok-p' }],
    [{ t: '', c: '' }],
    [{ t: '// 2. 在离用户最近的区域创建集群', c: 'tok-c' }],
    [{ t: 'const ', c: 'tok-k' }, { t: 'cluster', c: 'tok-p' }, { t: ' = ', c: 'tok-p' }, { t: 'await ', c: 'tok-k' }, { t: 'hexabase.clusters.', c: 'tok-p' }, { t: 'create', c: 'tok-f' }, { t: '({', c: 'tok-p' }],
    [{ t: '  region', c: 'tok-p' }, { t: ': ', c: 'tok-p' }, { t: "'ap-east-1'", c: 'tok-s' }, { t: ',  ', c: 'tok-p' }, { t: '// 东京', c: 'tok-c' }],
    [{ t: '  nodes', c: 'tok-p' }, { t: ': ', c: 'tok-p' }, { t: '3', c: 'tok-n' }, { t: ',', c: 'tok-p' }],
    [{ t: '  type', c: 'tok-p' }, { t: ': ', c: 'tok-p' }, { t: "'c6.large'", c: 'tok-s' }, { t: ',', c: 'tok-p' }],
    [{ t: '});', c: 'tok-p' }],
    [{ t: '', c: '' }],
    [{ t: '// 3. 拿到全球加速入口,直接上线', c: 'tok-c' }],
    [{ t: 'console', c: 'tok-p' }, { t: '.', c: 'tok-p' }, { t: 'log', c: 'tok-f' }, { t: '(cluster.endpoint);', c: 'tok-p' }],
    [{ t: '// → https://api.hexabase.io  (12ms)', c: 'tok-c' }]
  ];
  var codeBody = $('#codeBody'), codeFoot = $('#codeFoot'), codeStatus = $('#codeStatus');
  var typeRun = 0;
  function clearCode() { codeBody.innerHTML = ''; }
  function renderLineFull(line, idx) {
    var div = document.createElement('div');
    div.className = 'ln';
    var no = document.createElement('span');
    no.className = 'no'; no.textContent = idx + 1;
    var body = document.createElement('span');
    line.forEach(function (tok) {
      var s = document.createElement('span');
      s.className = tok.c; s.textContent = tok.t;
      body.appendChild(s);
    });
    div.appendChild(no); div.appendChild(body);
    codeBody.appendChild(div);
  }
  function typeCode() {
    var run = ++typeRun;
    clearCode();
    codeFoot.classList.remove('done');
    codeStatus.textContent = '运行中…';
    if (reduceMotion) {
      CODE.forEach(function (ln, i) { renderLineFull(ln, i); });
      codeFoot.classList.add('done');
      codeStatus.textContent = '部署完成 · 1.8s';
      return;
    }
    var li = 0, ti = 0, ci = 0, curLine = null, curSpan = null;
    function nextLine() {
      if (run !== typeRun) return;
      if (li >= CODE.length) {
        var caret = $('.caret', codeBody);
        if (caret) caret.remove();
        codeFoot.classList.add('done');
        codeStatus.textContent = '部署完成 · 1.8s';
        return;
      }
      curLine = document.createElement('div');
      curLine.className = 'ln';
      var no = document.createElement('span');
      no.className = 'no'; no.textContent = li + 1;
      var body = document.createElement('span');
      curLine.appendChild(no); curLine.appendChild(body);
      codeBody.appendChild(curLine);
      curSpan = null; ti = 0; ci = 0;
      typeToken(body);
    }
    function typeToken(body) {
      if (run !== typeRun) return;
      var line = CODE[li];
      if (ti >= line.length) {
        var caret = document.createElement('span');
        caret.className = 'caret';
        body.appendChild(caret);
        li++;
        setTimeout(nextLine, line.length === 1 && line[0].t === '' ? 60 : 130);
        return;
      }
      var tok = line[ti];
      if (!curSpan || ci === 0) {
        if (curSpan) { var old = $('.caret', body); if (old) old.remove(); }
        curSpan = document.createElement('span');
        curSpan.className = tok.c;
        body.appendChild(curSpan);
      }
      if (ci < tok.t.length) {
        curSpan.textContent += tok.t[ci++];
        setTimeout(function () { typeToken(body); }, tok.c === 'tok-c' ? 14 : 26);
      } else { ti++; ci = 0; setTimeout(function () { typeToken(body); }, 0); }
    }
    nextLine();
  }
  $('#replayBtn').addEventListener('click', typeCode);
  /* hero 进入视口即播一次 */
  var heroSeen = false;
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting && !heroSeen) { heroSeen = true; setTimeout(typeCode, 500); }
    });
  }, { threshold: 0.25 }).observe($('#hero'));

  /* ---------- 7. 区块 reveal ---------- */
  var revealIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(function (el, i) {
    el.style.transitionDelay = (i % 4) * 70 + 'ms';
    revealIO.observe(el);
  });

  /* ---------- 8. 指标数字滚动 ---------- */
  function easeOutExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  var metricIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var m = e.target;
      metricIO.unobserve(m);
      m.classList.add('in');
      var target = parseFloat(m.dataset.count), dec = parseInt(m.dataset.dec || '0', 10);
      var valEl = $('.val', m);
      if (reduceMotion) { valEl.textContent = target.toFixed(dec); return; }
      var t0 = performance.now(), dur = 1700;
      (function tick(t) {
        var p = Math.min((t - t0) / dur, 1);
        valEl.textContent = (target * easeOutExpo(p)).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
        else valEl.textContent = target.toFixed(dec);
      })(t0);
    });
  }, { threshold: 0.4 });
  $$('.metric').forEach(function (m) { metricIO.observe(m); });

  /* ---------- 9. 全球节点地图:程序化点阵世界 ---------- */
  (function buildMap() {
    var svg = $('#worldmap');
    if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg';
    var W = 76, H = 26, S = 10;
    /* 椭圆大陆块 [cx, cy, rx, ry] */
    var LAND = [
      [13, 6, 9.5, 3.6], [26.5, 2.2, 2.6, 1.3], [4.5, 5.5, 3.2, 1.6],
      [13.5, 10.6, 3.6, 1.3], [21, 13.6, 4.6, 2.1], [20.8, 18.6, 3.1, 4.2],
      [38, 5.2, 3.6, 2.3], [39.5, 2.8, 2.4, 1.4], [37.5, 12.6, 4.6, 4.1],
      [42.5, 15.4, 1.1, 1.8], [55, 5, 11.5, 2.6], [55.5, 9.2, 6.8, 2.3],
      [65.5, 7.6, 1.3, 2.0], [59.5, 13.2, 3.4, 1.2], [60, 15.6, 4.2, 0.9],
      [62.5, 20.2, 5.2, 2.3], [71, 23.6, 1.2, 1.0]
    ];
    var g = document.createElementNS(NS, 'g');
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var inside = false;
        for (var k = 0; k < LAND.length; k++) {
          var e = LAND[k];
          var dx = (x - e[0]) / e[2], dy = (y - e[1]) / e[3];
          if (dx * dx + dy * dy <= 1) { inside = true; break; }
        }
        if (inside) {
          var c = document.createElementNS(NS, 'circle');
          c.setAttribute('cx', x * S + S / 2);
          c.setAttribute('cy', y * S + S / 2);
          c.setAttribute('r', 2.1);
          c.setAttribute('fill', '#CBD5F2');
          g.appendChild(c);
        }
      }
    }
    svg.appendChild(g);
    /* 节点 [gx, gy, name] */
    var NODES = [
      [66, 8, 'tokyo'], [59.5, 13.2, 'singapore'], [38, 5.2, 'frankfurt'],
      [14, 8, 'virginia'], [20.8, 19.5, 'saopaulo'], [63, 21, 'sydney']
    ];
    var ARCS = [[0, 1], [1, 5], [0, 2], [2, 3], [3, 4], [1, 2]];
    ARCS.forEach(function (pair) {
      var a = NODES[pair[0]], b = NODES[pair[1]];
      var x1 = a[0] * S + S / 2, y1 = a[1] * S + S / 2;
      var x2 = b[0] * S + S / 2, y2 = b[1] * S + S / 2;
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      var dx = x2 - x1, dy = y2 - y1;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var lift = Math.min(46, len * 0.28);
      var cx = mx - (dy / len) * lift, cy = my - (dx / len) * lift;
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M' + x1 + ',' + y1 + ' Q' + cx + ',' + cy + ' ' + x2 + ',' + y2);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', '#635BFF');
      p.setAttribute('stroke-width', '1.8');
      p.setAttribute('opacity', '0.55');
      p.setAttribute('class', 'arc');
      svg.appendChild(p);
    });
    NODES.forEach(function (n, i) {
      var cx = n[0] * S + S / 2, cy = n[1] * S + S / 2;
      var ping = document.createElementNS(NS, 'circle');
      ping.setAttribute('cx', cx); ping.setAttribute('cy', cy);
      ping.setAttribute('r', 6); ping.setAttribute('fill', 'none');
      ping.setAttribute('stroke', '#635BFF'); ping.setAttribute('stroke-width', '2');
      ping.setAttribute('class', 'node-pulse');
      ping.style.animationDelay = (i * 0.35) + 's';
      var dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
      dot.setAttribute('r', 5); dot.setAttribute('fill', '#635BFF');
      dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', '2');
      svg.appendChild(ping); svg.appendChild(dot);
    });
  })();

  /* ---------- 11. 法务三件套弹窗 ---------- */
  var overlay = $('#modalOverlay'), lastFocus = null;
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    lastFocus = document.activeElement;
    $$('.modal', overlay).forEach(function (x) { x.classList.remove('active'); });
    m.classList.add('active');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var x = $('.modal-x', m);
    if (x) x.focus();
  }
  function closeModal() {
    if (!overlay.classList.contains('show')) return;
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-modal]');
    if (t) { openModal(t.getAttribute('data-modal')); return; }
    if (e.target.closest('[data-close]') || e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('show')) closeModal();
  });

  /* ---------- 12. 终端打字 ---------- */
  var TERM = [
    { t: '$ hexabase deploy --region ap-east-1', c: '' },
    { t: '[ok] 打包 12 个函数 (0.6s)', c: 'ok' },
    { t: '[ok] 镜像推送至 ap-east-1', c: 'ok' },
    { t: '[ok] 健康检查全部通过', c: 'ok' },
    { t: '→ https://api.hexabase.io 已上线 · 1.8s', c: 'link' }
  ];
  var termBody = $('#termBody'), termRun = 0, termSeen = false;
  function typeTerm() {
    var run = ++termRun;
    termBody.innerHTML = '';
    if (reduceMotion) {
      TERM.forEach(function (ln) {
        var d = document.createElement('div');
        var s = document.createElement('span');
        s.className = ln.c; s.textContent = ln.t;
        d.appendChild(s); termBody.appendChild(d);
      });
      return;
    }
    var i = 0;
    function nextLine() {
      if (run !== termRun || i >= TERM.length) return;
      var ln = TERM[i++];
      var div = document.createElement('div');
      var span = document.createElement('span');
      span.className = ln.c;
      div.appendChild(span);
      termBody.appendChild(div);
      var ci = 0;
      (function tick() {
        if (run !== termRun) return;
        if (ci <= ln.t.length) {
          span.textContent = ln.t.slice(0, ci++);
          setTimeout(tick, ln.c === '' ? 34 : 12);
        } else setTimeout(nextLine, 260);
      })();
    }
    nextLine();
  }
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting && !termSeen) { termSeen = true; setTimeout(typeTerm, 400); }
    });
  }, { threshold: 0.35 }).observe($('.terminal'));
})();
