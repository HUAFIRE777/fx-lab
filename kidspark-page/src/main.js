/* 泡泡岛 BUBBLE ISLAND · 交互逻辑（零外部依赖，纯原生 JS） */
"use strict";

/* ============ 配置：换主体只改这里 ============ */
const SITE = {
  brand: "泡泡岛",
  brandEn: "BUBBLE ISLAND",
  organizer: "泡泡岛儿童乐园（上海）有限公司",
  phone: "400-820-2026",
  address: "上海市闵行区星乐路 88 号 3 楼",
  email: "hello@bubbleisland.example.com",
  icp: "沪ICP备2026000000号-1",
};

/* 法务三件套文案（真实感通用条款，含儿童安全条款） */
const LEGAL = {
  privacy: {
    title: "隐私政策",
    body: `
      <h5>一、我们收集哪些信息</h5>
      <p>为完成预约服务，我们仅收集您主动填写的信息：家长姓名、手机号码、到店日期与人数。我们不会收集与预约无关的信息，也不会读取您设备的其他数据。</p>
      <div class="kid"><b>儿童信息特别说明：</b>我们不会主动收集 14 周岁以下儿童的姓名、照片等可识别信息。生日派对跟拍照片仅在获得家长书面同意后拍摄，精修后直接发送给预留手机，不做任何公开传播。</div>
      <h5>二、信息如何使用</h5>
      <p>收集的信息仅用于：预约确认短信/电话、到店核销、售后回访。我们不会将您的信息出售、出租或分享给任何第三方营销机构。</p>
      <h5>三、信息保存与删除</h5>
      <p>预约信息自到店日起保留 12 个月用于售后，之后自动删除。您可随时致电 ${SITE.phone} 要求提前删除，我们将在 3 个工作日内处理完毕并回复确认。</p>
      <h5>四、联系我们</h5>
      <p>如对本政策有疑问，请发邮件至 ${SITE.email}，我们会在 5 个工作日内答复。</p>`,
  },
  terms: {
    title: "服务条款",
    body: `
      <h5>一、票价与入场</h5>
      <p>所有票价为明码标价，节假日不加价。1 米以下儿童免票；每位付费儿童可由两名成人免费陪同入场。门票当日有效，离场后再次入场需重新购票（用餐外出可凭手环 1 小时内返回）。</p>
      <h5>二、预约与退改</h5>
      <p>线上预约成功后到店核销，无需预付。免费取消；如需改期，请提前 1 天致电 ${SITE.phone}。生日派对需提前 7 天预定，支付 30% 定金后锁定档期，提前 3 天以上取消全额退还定金。</p>
      <div class="kid"><b>儿童安全条款：</b>6 岁以下儿童须有成人全程陪同；场内禁止追逐打闹、倒立等危险动作，看护员有权劝阻。游乐设施有身高/年龄限制的，以现场标识为准，家长不得强行让孩子乘坐不符合条件的项目。</div>
      <h5>三、场馆规则</h5>
      <p>入场须穿防滑袜；游乐区内禁止饮食（饮水除外）；请勿携带尖锐物品、宠物入场。储物柜免费使用，贵重物品请随身携带，遗失本馆协助查找但不承担保管责任。</p>
      <h5>四、免责与保险</h5>
      <p>本馆已投保公众责任险。儿童在场内活动请家长尽到看护义务；因违反场馆规则或家长看护缺位导致的意外，本馆在保险范围内先行垫付，责任划分依法处理。</p>`,
  },
  cookie: {
    title: "Cookie 政策",
    body: `
      <h5>一、我们使用 Cookie 做什么</h5>
      <p>本页面仅使用维持网站正常运行所必需的 Cookie（如记住您的票种选择、表单填写进度），不做用户画像，不做跨站追踪，不接入任何第三方广告 Cookie。</p>
      <h5>二、您可以如何管理</h5>
      <p>您可以在浏览器设置中随时清除或禁用 Cookie。禁用后预约表单仍可正常使用，仅「记住我的选择」类便利功能会失效。</p>
      <h5>三、政策更新</h5>
      <p>本政策更新时会在本页面显著位置提示，更新后的版本自发布之日起生效。如有疑问请联系 ${SITE.email}。</p>`,
  },
};

/* ============ 工具 ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => (t.hidden = true), 400);
  }, 2600);
}

/* ============ SITE 变量渲染 ============ */
function renderSite() {
  $$("[data-site]").forEach((el) => {
    const k = el.getAttribute("data-site");
    if (SITE[k] != null) el.textContent = SITE[k];
  });
  document.title = `${SITE.brand}儿童乐园 · 3–12 岁孩子的快乐老家`;
}

/* ============ Hero 泡泡（主视觉动效） ============ */
function spawnBubbles() {
  const box = $("#bubbles");
  const N = 16;
  for (let i = 0; i < N; i++) {
    const b = document.createElement("span");
    const size = 14 + Math.random() * 66; // 14–80px
    b.className = "bubble" + (Math.random() < 0.4 ? " y" : "");
    b.style.width = b.style.height = size.toFixed(0) + "px";
    b.style.left = (Math.random() * 96).toFixed(1) + "%";
    const dur = 9 + Math.random() * 9; // 9–18s 上升
    b.style.animationDuration = dur.toFixed(1) + "s";
    b.style.animationDelay = (-Math.random() * dur).toFixed(1) + "s"; // 负延迟：首屏即有泡泡在半空
    box.appendChild(b);
  }
}

/* ============ 导航滚动态 + 抽屉 ============ */
function initNav() {
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const drawer = $("#drawer"),
    mask = $("#drawerMask"),
    burger = $("#burger");
  const open = (v) => {
    drawer.classList.toggle("open", v);
    mask.hidden = !v;
    requestAnimationFrame(() => mask.classList.toggle("show", v));
    drawer.setAttribute("aria-hidden", String(!v));
    burger.setAttribute("aria-expanded", String(v));
    document.body.style.overflow = v ? "hidden" : "";
  };
  burger.addEventListener("click", () => open(true));
  $("#drawerClose").addEventListener("click", () => open(false));
  mask.addEventListener("click", () => open(false));
  $$("#drawer a").forEach((a) => a.addEventListener("click", () => open(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) open(false);
  });
}

/* ============ 滚动 reveal（带完成态兜底） ============ */
function initReveal() {
  const els = $$(".rv");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  els.forEach((el) => io.observe(el));
  // 3s 兜底：任何原因没触发的 reveal 强制显现，完成态永远可达
  setTimeout(() => els.forEach((el) => el.classList.add("in")), 3000);
}

/* ============ 票种快捷选择：卡片按钮 → 表单 radio ============ */
function initPlanShortcut() {
  $$("[data-plan]").forEach((a) => {
    a.addEventListener("click", () => {
      const plan = a.getAttribute("data-plan");
      const radio = $(`#planRow input[value="${plan}"]`);
      if (radio) {
        radio.checked = true;
        toast(`已为您选中「${plan}」`);
      }
    });
  });
}

/* ============ 预约表单：校验 + 成功态 ============ */
function initForm() {
  const form = $("#bookForm"),
    done = $("#bookDone");
  const fDate = $("#fDate");
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  fDate.min = iso(today);
  fDate.value = iso(today);

  const rules = {
    name: (v) => /^[\u4e00-\u9fa5a-zA-Z·\s]{2,10}$/.test(v.trim()),
    date: (v) => v && v >= iso(today),
    phone: (v) => /^1[3-9]\d{9}$/.test(v.trim()),
  };

  const setErr = (input, bad) => {
    const field = input.closest(".field");
    field.classList.toggle("invalid", bad);
    const err = field.querySelector(".err");
    if (err) err.hidden = !bad;
    return !bad;
  };

  ["name", "date", "phone"].forEach((n) => {
    const input = form.elements[n];
    input.addEventListener("input", () => setErr(input, false));
    input.addEventListener("blur", () => setErr(input, !rules[n](input.value)));
  });

  $("#bookAgain").addEventListener("click", () => {
    done.hidden = true;
    form.hidden = false;
    form.reset();
    fDate.value = iso(today);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name,
      date = form.elements.date,
      phone = form.elements.phone;
    const ok =
      setErr(name, !rules.name(name.value)) &
      setErr(date, !rules.date(date.value)) &
      setErr(phone, !rules.phone(phone.value));
    if (!ok) {
      const firstBad = $(".field.invalid input", form);
      if (firstBad) firstBad.focus();
      toast("还有几项没填对，检查一下再提交");
      return;
    }
    const plan = form.elements.plan.value;
    const count = form.elements.count.value;
    const no =
      "KS-" + date.value.replaceAll("-", "").slice(2) + "-" + Math.floor(1000 + Math.random() * 9000);
    $("#doneText").textContent = `${name.value.trim()}，您预约了 ${date.value}（${count} · ${plan}），客服将在 2 小时内致电 ${phone.value.trim()} 确认。`;
    $("#doneNo").textContent = no;
    form.hidden = true;
    done.hidden = false;
    done.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

/* ============ 法务弹窗（三通道关闭） ============ */
function initLegal() {
  const mask = $("#legalMask"),
    modal = $("#legalModal"),
    title = $("#legalTitle"),
    body = $("#legalBody");
  let lastFocus = null;

  const open = (key) => {
    const doc = LEGAL[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    title.textContent = doc.title;
    body.innerHTML = doc.body;
    body.scrollTop = 0;
    mask.hidden = false;
    modal.hidden = false;
    requestAnimationFrame(() => {
      mask.classList.add("show");
      modal.classList.add("show");
    });
    document.body.style.overflow = "hidden";
    $("#legalClose").focus();
  };
  const close = () => {
    mask.classList.remove("show");
    modal.classList.remove("show");
    document.body.style.overflow = "";
    setTimeout(() => {
      mask.hidden = true;
      modal.hidden = true;
    }, 320);
    if (lastFocus) lastFocus.focus();
  };

  $$(".legal-link").forEach((b) =>
    b.addEventListener("click", () => open(b.getAttribute("data-legal")))
  );
  $("#legalClose").addEventListener("click", close);
  mask.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}

/* ============ 启动 ============ */
function boot() {
  renderSite();
  spawnBubbles();
  initNav();
  initReveal();
  initPlanShortcut();
  initForm();
  initLegal();

  // Hero 标题升起：首屏就绪即播（完成态覆盖规则保证可达）
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.body.classList.add("is-in"))
  );

  // 幕布退场：首屏就绪 + 2.5s 兜底
  const veil = $("#veil");
  const hideVeil = () => veil.classList.add("gone");
  if (document.readyState === "complete") setTimeout(hideVeil, 350);
  else window.addEventListener("load", () => setTimeout(hideVeil, 350));
  setTimeout(hideVeil, 2500);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
