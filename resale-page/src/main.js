/* 转转乐 RESALE · classic 脚本（被 fx-singlefile.py 原样内联）
   换主体/商品只改顶部 SITE / CATS / DEALS / TRUST */
(function () {
"use strict";

/* ============ 集中配置 ============ */
var SITE = {
  brand: "转转乐",
  brandEn: "RESALE",
  organizer: "转转乐科技有限公司",
  phone: "400-820-2026",
  email: "service@zhuanzhuanle.example.com",
  address: "上海市杨浦区黄兴路2005弄2号",
  icp: "沪ICP备2026000000号-1"
};
// 当前均为虚构示例值，换主体只改 SITE

var CATS = [
  { name: "手机",   en: "PHONE",   kind: "phone",  count: "12,480 件在售", desc: "验机报告随附" },
  { name: "电脑",   en: "LAPTOP",  kind: "laptop", count: "8,214 件在售",  desc: "电池健康可查" },
  { name: "平板",   en: "TABLET",  kind: "tablet", count: "3,102 件在售",  desc: "屏幕无暗病" },
  { name: "家具",   en: "HOME",    kind: "sofa",   count: "15,730 件在售", desc: "上门取件包邮" },
  { name: "服饰",   en: "FASHION", kind: "jacket", count: "21,940 件在售", desc: "正品鉴定服务" },
  { name: "图书",   en: "BOOKS",   kind: "book",   count: "6,450 件在售",  desc: "按斤也要按本" },
  { name: "相机",   en: "CAMERA",  kind: "camera", count: "2,180 件在售",  desc: "快门数可查" },
  { name: "游戏机", en: "CONSOLE", kind: "gamepad",count: "4,620 件在售",  desc: "手柄无漂移" }
];

var DEALS = [
  { cat: "手机", kind: "phone",  name: "iPhone 13 256G 星光色，电池 91%",        price: "3,299", old: "5,999", cond: "几乎全新", hot: true,  meta: "朝阳区 · 2小时前" },
  { cat: "手机", kind: "earbuds",name: "索尼 WH-1000XM4 降噪耳机",               price: "890",   old: "2,499", cond: "轻微使用", hot: false, meta: "海淀区 · 5小时前" },
  { cat: "电脑", kind: "laptop", name: "ThinkPad T14 锐龙7，自用两年",            price: "2,350", old: "6,999", cond: "轻微使用", hot: true,  meta: "海淀区 · 1小时前" },
  { cat: "电脑", kind: "laptop2",name: "MacBook Air M1 8+256，箱说齐全",          price: "3,680", old: "7,999", cond: "几乎全新", hot: false, meta: "朝阳区 · 3小时前" },
  { cat: "家具", kind: "desk",   name: "樱桃实木书桌 1.2 米，搬家带走",           price: "480",   old: "1,299", cond: "正常使用", hot: false, meta: "丰台区 · 4小时前" },
  { cat: "家具", kind: "sofa",   name: "宜家诺曼双人沙发，无塌陷",                price: "750",   old: "2,499", cond: "轻微使用", hot: true,  meta: "朝阳区 · 6小时前" },
  { cat: "服饰", kind: "jacket", name: "北面冲锋衣男款 L，仅穿过两次",           price: "620",   old: "1,898", cond: "几乎全新", hot: false, meta: "东城区 · 2小时前" },
  { cat: "服饰", kind: "jacket2",name: "始祖鸟 Beta LT 女款 S，吊牌还在",        price: "1,350", old: "4,200", cond: "轻微使用", hot: true,  meta: "西城区 · 8小时前" }
];

var TRUST = [
  { t: "56 项专业验机", d: "手机电脑先过验机台：电池、外观、功能逐项打分，报告随商品走，不合格直接下架。", icon: "shield" },
  { t: "7 天无理由退",  d: "收到货 7 天内，描述不符直接退，运费平台出。不用跟卖家扯皮。", icon: "return" },
  { t: "假一赔三",      d: "服饰箱包支持正品鉴定，鉴定为假按成交价三倍赔，先行垫付。", icon: "badge" },
  { t: "资金托管",      d: "钱先放在平台，确认收货 24 小时后才打给卖家，跑单不存在的。", icon: "lock" }
];

var HOTWORDS = ["iPhone 13", "ThinkPad", "实木书桌", "冲锋衣", "MacBook Air", "降噪耳机"];
var PLACEHOLDERS = ["搜「iPhone 13」试试", "搜「ThinkPad」试试", "搜「实木书桌」试试", "搜「冲锋衣」试试"];

/* ============ 程序化商品插画（SVG 几何 + 三色，零外链） ============ */
var B = "#16305C", Y = "#E9B23B", P = "#F7F4EC";
function art(kind) {
  var inner = {
    phone:   '<rect x="52" y="18" width="56" height="104" rx="14" fill="' + B + '"/><rect x="60" y="30" width="40" height="72" rx="6" fill="' + P + '"/><circle cx="80" cy="112" r="4" fill="' + Y + '"/>',
    earbuds: '<circle cx="58" cy="60" r="26" fill="' + B + '"/><circle cx="102" cy="60" r="26" fill="' + B + '"/><rect x="52" y="80" width="12" height="34" rx="6" fill="' + Y + '"/><rect x="96" y="80" width="12" height="34" rx="6" fill="' + Y + '"/>',
    laptop:  '<rect x="30" y="42" width="100" height="62" rx="8" fill="' + B + '"/><rect x="38" y="50" width="84" height="46" rx="4" fill="' + P + '"/><rect x="22" y="104" width="116" height="10" rx="5" fill="' + Y + '"/>',
    laptop2: '<rect x="30" y="42" width="100" height="62" rx="8" fill="' + Y + '"/><rect x="38" y="50" width="84" height="46" rx="4" fill="' + B + '"/><rect x="22" y="104" width="116" height="10" rx="5" fill="' + B + '"/>',
    desk:    '<rect x="24" y="52" width="112" height="14" rx="4" fill="' + Y + '"/><rect x="34" y="66" width="10" height="52" fill="' + B + '"/><rect x="116" y="66" width="10" height="52" fill="' + B + '"/><rect x="60" y="30" width="40" height="22" rx="4" fill="' + B + '" opacity=".85"/>',
    sofa:    '<rect x="26" y="62" width="108" height="44" rx="12" fill="' + B + '"/><rect x="26" y="44" width="108" height="26" rx="12" fill="' + Y + '"/><rect x="18" y="58" width="14" height="40" rx="7" fill="' + B + '"/><rect x="128" y="58" width="14" height="40" rx="7" fill="' + B + '"/>',
    jacket:  '<path d="M60 26 L80 40 L100 26 L122 44 L108 60 L108 116 L52 116 L52 60 Z" fill="' + B + '"/><rect x="76" y="40" width="8" height="76" fill="' + Y + '"/><circle cx="80" cy="66" r="3" fill="' + P + '"/><circle cx="80" cy="86" r="3" fill="' + P + '"/>',
    jacket2: '<path d="M60 26 L80 40 L100 26 L122 44 L108 60 L108 116 L52 116 L52 60 Z" fill="' + Y + '"/><rect x="76" y="40" width="8" height="76" fill="' + B + '"/><circle cx="80" cy="66" r="3" fill="' + P + '"/><circle cx="80" cy="86" r="3" fill="' + P + '"/>',
    tablet:  '<rect x="44" y="24" width="72" height="96" rx="12" fill="' + B + '"/><rect x="52" y="34" width="56" height="72" rx="5" fill="' + P + '"/><circle cx="80" cy="113" r="3.5" fill="' + Y + '"/>',
    book:    '<rect x="44" y="30" width="72" height="88" rx="6" fill="' + Y + '"/><rect x="52" y="30" width="8" height="88" fill="' + B + '"/><rect x="70" y="52" width="34" height="8" rx="4" fill="' + B + '" opacity=".7"/><rect x="70" y="68" width="24" height="6" rx="3" fill="' + B + '" opacity=".45"/>',
    camera:  '<rect x="34" y="52" width="92" height="56" rx="10" fill="' + B + '"/><circle cx="80" cy="80" r="20" fill="' + P + '"/><circle cx="80" cy="80" r="11" fill="' + Y + '"/><rect x="60" y="40" width="40" height="14" rx="4" fill="' + B + '"/>',
    gamepad: '<rect x="34" y="58" width="92" height="52" rx="26" fill="' + B + '"/><circle cx="62" cy="84" r="6" fill="' + Y + '"/><circle cx="98" cy="78" r="5" fill="' + P + '"/><circle cx="108" cy="90" r="5" fill="' + P + '"/>'
  }[kind] || "";
  return '<svg viewBox="0 0 160 140" width="110" height="96" aria-hidden="true">' + inner + "</svg>";
}
function icon(name) {
  var s = {
    shield: '<path d="M28 8 L52 16 V32 C52 46 42 54 28 58 C14 54 4 46 4 32 V16 Z" fill="none" stroke="#16305C" stroke-width="4"/><path d="M20 30 L26 36 L38 22" fill="none" stroke="#16305C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    "return": '<path d="M10 26 H44 M44 26 L34 16 M44 26 L34 36" stroke="#16305C" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 12 V8 H46 V40" fill="none" stroke="#16305C" stroke-width="4" stroke-linecap="round"/>',
    badge: '<circle cx="28" cy="28" r="18" fill="none" stroke="#16305C" stroke-width="4"/><path d="M20 28 L26 34 L38 20" fill="none" stroke="#16305C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    lock: '<rect x="14" y="26" width="28" height="22" rx="6" fill="none" stroke="#16305C" stroke-width="4"/><path d="M20 26 V18 a8 8 0 0 1 16 0 V26" fill="none" stroke="#16305C" stroke-width="4"/>'
  }[name] || "";
  return '<svg viewBox="0 0 56 56" width="30" height="30" aria-hidden="true">' + s + "</svg>";
}

/* ============ 工具 ============ */
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
var toastTimer = null;
function toast(msg) {
  var t = $("toast");
  t.textContent = msg; t.hidden = false;
  requestAnimationFrame(function () { t.classList.add("show"); });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    t.classList.remove("show");
    setTimeout(function () { t.hidden = true; }, 400);
  }, 2600);
}

/* ============ 渲染：品类磁贴 ============ */
(function renderTiles() {
  var g = $("tileGrid");
  g.innerHTML = CATS.map(function (c, i) {
    return '<button class="tile rv" style="--d:' + (i % 4 * 0.08) + 's" data-cat="' + c.name + '">' +
      '<span class="ticon">' + art(c.kind) + "</span>" +
      "<h3>" + c.name + "</h3><p>" + c.desc + "</p>" +
      '<span class="tcount">' + c.count + "</span></button>";
  }).join("");
  g.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]");
    if (!b) return;
    filterDeals(b.getAttribute("data-cat"));
    document.getElementById("deals").scrollIntoView({ behavior: "smooth" });
    toast("已为你筛出「" + b.getAttribute("data-cat") + "」的好货");
  });
})();

/* ============ 渲染：捡漏商品流 ============ */
function renderDeals() {
  var g = $("dealGrid");
  g.innerHTML = DEALS.map(function (d, i) {
    return '<article class="deal rv" style="--d:' + (i % 4 * 0.08) + 's" data-cat="' + d.cat + '">' +
      '<div class="d-art">' + art(d.kind) +
      '<span class="d-cond' + (d.hot ? " hot" : "") + '">' + (d.hot ? "手慢无" : d.cond) + "</span></div>" +
      '<div class="d-body"><h3 class="d-name">' + esc(d.name) + "</h3>" +
      '<p class="d-meta">' + d.cond + " · " + d.meta + "</p>" +
      '<div class="d-row"><span class="d-price">¥' + d.price + '</span><span class="d-old">¥' + d.old + "新</span></div>" +
      '<button class="d-btn" data-buy="' + esc(d.name) + '">聊聊这件</button></div></article>';
  }).join("");
  g.addEventListener("click", function (e) {
    var b = e.target.closest("[data-buy]");
    if (b) toast("已帮你约卖家：「" + b.getAttribute("data-buy").slice(0, 12) + "…」");
  });
  bindReveal(g);
}
function filterDeals(cat) {
  var tabs = document.querySelectorAll("#dealTabs .tab");
  tabs.forEach(function (t) {
    var on = t.getAttribute("data-f") === cat;
    t.classList.toggle("on", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll("#dealGrid .deal").forEach(function (el) {
    el.classList.toggle("hide", cat !== "all" && el.getAttribute("data-cat") !== cat);
  });
}
(function bindTabs() {
  $("dealTabs").addEventListener("click", function (e) {
    var t = e.target.closest(".tab");
    if (t) filterDeals(t.getAttribute("data-f"));
  });
})();

/* ============ 渲染：保障区 ============ */
(function renderTrust() {
  $("trustGrid").innerHTML = TRUST.map(function (k, i) {
    return '<div class="trust-card rv" style="--d:' + (i * 0.08) + 's">' +
      '<span class="kicon">' + icon(k.icon) + "</span>" +
      "<h3>" + k.t + "</h3><p>" + k.d + "</p></div>";
  }).join("");
})();

/* ============ 渲染：社交图标 + 页脚联系 ============ */
(function renderSocials() {
  var paths = {
    wechat: '<path d="M8 11a7 5.2 0 1 0 0 .1M9 21l-3 2 1-3" /><circle cx="18" cy="13" r="1.2"/><circle cx="23" cy="13" r="1.2"/>',
    weibo: '<path d="M6 15c-2 0-3.5-1.4-3.5-3S4 9 6 9c2.4 0 3.4 2 5.5 2H14l-1.5 2.5C10.4 14.6 8 15 6 15z"/><path d="M14 8.5c3 0 5 1.8 5 4s-2.4 4.5-5.5 4.5"/>',
    red: '<path d="M7 4h10l4 16H3z"/><path d="M9 12h6M9 15.5h4"/>',
    douyin: '<path d="M14 4v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 7.5A5.5 5.5 0 0 0 19 9"/>'
  };
  $("socials").innerHTML = Object.keys(paths).map(function (k) {
    return '<a href="#top" aria-label="' + k + '"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round">' + paths[k] + "</svg></a>";
  }).join("");
  $("socials").addEventListener("click", function (e) {
    if (e.target.closest("a")) { e.preventDefault(); toast("官方账号马上就来，先逛逛捡漏区"); }
  });
})();
(function renderFooter() {
  $("footContact").innerHTML =
    "<li>电话：" + SITE.phone + "</li>" +
    "<li>邮箱：" + SITE.email + "</li>" +
    "<li>地址：" + SITE.address + "</li>";
  $("copyLine").textContent = "© 2026 " + SITE.organizer + " · " + SITE.brand + SITE.brandEn;
  $("icpLine").textContent = SITE.icp;
})();

/* ============ 法务三件套 ============ */
var LEGAL = {
  privacy: { title: "隐私政策", body:
    "<h5>一、我们收集什么</h5><p>注册时的手机号、发布商品时的照片与描述、交易中的收货地址。仅用于撮合交易与售后，不做他用。</p>" +
    "<h5>二、信息怎么用</h5><p>验机师上门前会电话联系你；物流信息只展示给交易对方。营销短信默认关闭，开启后回复 TD 随时退订。</p>" +
    "<h5>三、信息安全</h5><p>支付走持牌机构，平台不存你的卡号；服务器日志 180 天滚动删除。</p>" +
    "<h5>四、你的权利</h5><p>随时在「我的—设置」里查看、更正、删除个人信息，或致电 " + SITE.phone + " 注销账号，15 个工作日内办结。</p>" +
    "<h5>五、未成年人</h5><p>不满 14 周岁请在监护人陪同下使用，我们不主动收集儿童信息。</p>" },
  terms: { title: "服务条款", body:
    "<h5>一、验机承诺</h5><p>手机、电脑类商品执行 56 项验机标准，验机报告随商品展示；报告与实物不符，买家可 7 天无理由退货。</p>" +
    "<h5>二、交易规则</h5><p>货款由平台托管，买家确认收货 24 小时后结算给卖家。卖家须如实描述成色，隐瞒瑕疵按「假一赔三」处理。</p>" +
    "<h5>三、退货</h5><p>7 天无理由退货运费由平台承担；人为损坏、影响二次销售的不在退货范围内。</p>" +
    "<h5>四、账号</h5><p>一证一号，倒卖账号、刷单炒信一经发现永久封禁，货款原路退回买家。</p>" +
    "<h5>五、争议</h5><p>交易争议先由平台客服介入调解；调解不成，提交 " + SITE.address.slice(0, 6) + "仲裁委员会仲裁。</p>" },
  cookies: { title: "Cookie 政策", body:
    "<h5>一、必需型</h5><p>登录态、购物车、页面偏好设置，没有它们网站跑不起来，无法关闭。</p>" +
    "<h5>二、统计型</h5><p>匿名统计哪些品类最受欢迎，用来决定验机师排班。你可以在浏览器设置里禁用。</p>" +
    "<h5>三、我们不用什么</h5><p>不做跨站追踪，不接第三方广告 Cookie，你的浏览记录不出转转乐。</p>" +
    "<h5>四、有效期</h5><p>统计型 Cookie 保留 90 天，到期自动清除。</p>" }
};
var lastFocus = null;
function openModal(key) {
  lastFocus = document.activeElement;
  $("modalTitle").textContent = LEGAL[key].title;
  $("modalBody").innerHTML = LEGAL[key].body;
  var m = $("modal"), mask = $("modalMask");
  m.hidden = false; mask.hidden = false;
  void m.offsetWidth;
  m.classList.add("open"); mask.classList.add("show");
  document.documentElement.style.overflow = "hidden";
  $("modalClose").focus();
}
function closeModal() {
  var m = $("modal"), mask = $("modalMask");
  m.classList.remove("open"); mask.classList.remove("show");
  m.hidden = true; mask.hidden = true;
  document.documentElement.style.overflow = "";
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
document.querySelectorAll("[data-modal]").forEach(function (b) {
  b.addEventListener("click", function () { openModal(b.getAttribute("data-modal")); });
});
$("modalClose").addEventListener("click", closeModal);
$("modalMask").addEventListener("click", closeModal);

/* ============ 发布闲置弹窗 ============ */
function openSell() {
  lastFocus = document.activeElement;
  var m = $("sellModal"), mask = $("sellMask");
  m.hidden = false; mask.hidden = false;
  void m.offsetWidth;
  m.classList.add("open"); mask.classList.add("show");
  document.documentElement.style.overflow = "hidden";
  $("sellName").focus();
}
function closeSell() {
  var m = $("sellModal"), mask = $("sellMask");
  m.classList.remove("open"); mask.classList.remove("show");
  m.hidden = true; mask.hidden = true;
  document.documentElement.style.overflow = "";
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
document.querySelectorAll("[data-open-sell]").forEach(function (b) {
  b.addEventListener("click", function (e) { e.preventDefault(); closeDrawer(); openSell(); });
});
$("sellClose").addEventListener("click", closeSell);
$("sellMask").addEventListener("click", closeSell);
$("sellForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var ok = true;
  var name = $("sellName"), price = $("sellPrice"), phone = $("sellPhone");
  [name, price, phone].forEach(function (el) { el.classList.remove("err"); });
  if (!name.value.trim()) { name.classList.add("err"); ok = false; }
  if (!/^\d+(\.\d{1,2})?$/.test(price.value.trim()) || parseFloat(price.value) <= 0) { price.classList.add("err"); ok = false; }
  if (!/^1\d{10}$/.test(phone.value.trim())) { phone.classList.add("err"); ok = false; }
  if (!ok) { toast("有两项没填对，标红的地方看一眼"); return; }
  closeSell();
  toast("提交成功！验机师会在 24 小时内联系你");
  e.target.reset();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (!$("modal").hidden) closeModal();
    else if (!$("sellModal").hidden) closeSell();
    else if (!$("drawer").hidden) closeDrawer();
  }
});

/* ============ 导航：滚动毛玻璃 + 抽屉 ============ */
var nav = $("nav");
function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 40); }
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
function openDrawer() {
  var d = $("drawer"), mask = $("drawerMask");
  d.hidden = false; mask.hidden = false;
  void d.offsetWidth;
  d.classList.add("show"); mask.classList.add("show");
  $("burger").setAttribute("aria-expanded", "true");
  document.documentElement.style.overflow = "hidden";
}
function closeDrawer() {
  var d = $("drawer"); if (d.hidden) return;
  d.classList.remove("show"); $("drawerMask").classList.remove("show");
  d.hidden = true; $("drawerMask").hidden = true;
  $("burger").setAttribute("aria-expanded", "false");
  document.documentElement.style.overflow = "";
}
$("burger").addEventListener("click", function () {
  $("drawer").hidden ? openDrawer() : closeDrawer();
});
$("drawerClose").addEventListener("click", closeDrawer);
$("drawerMask").addEventListener("click", closeDrawer);
document.querySelectorAll(".drawer-links a").forEach(function (a) {
  a.addEventListener("click", closeDrawer);
});

/* ============ 搜索 ============ */
(function hotwords() {
  var hw = $("hotwords");
  HOTWORDS.forEach(function (w) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = w;
    b.addEventListener("click", function () { $("searchInput").value = w; doSearch(w); });
    hw.appendChild(b);
  });
  var inp = $("searchInput"), i = 0;
  setInterval(function () {
    if (document.activeElement !== inp && !inp.value) {
      inp.setAttribute("placeholder", PLACEHOLDERS[i++ % PLACEHOLDERS.length]);
    }
  }, 2600);
  inp.setAttribute("placeholder", PLACEHOLDERS[0]);
})();
function doSearch(kw) {
  kw = (kw || "").trim();
  if (!kw) { toast("先输点什么，比如「iPhone」"); return; }
  var n = 0;
  document.querySelectorAll("#dealGrid .deal").forEach(function (el) {
    var hit = el.querySelector(".d-name").textContent.indexOf(kw) !== -1;
    el.classList.toggle("hide", !hit);
    if (hit) n++;
  });
  document.querySelectorAll("#dealTabs .tab").forEach(function (t) {
    t.classList.remove("on"); t.setAttribute("aria-selected", "false");
  });
  document.getElementById("deals").scrollIntoView({ behavior: "smooth" });
  toast(n ? "找到 " + n + " 件「" + kw + "」，都是验过机的" : "还没人卖「" + kw + "」，要不要发布一条求购？");
}
$("searchForm").addEventListener("submit", function (e) {
  e.preventDefault();
  doSearch($("searchInput").value);
});

/* ============ 滚动 reveal ============ */
var revealIO = null;
function bindReveal(root) {
  var els = (root || document).querySelectorAll(".rv:not(.in)");
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  if (!revealIO) {
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); revealIO.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
  }
  els.forEach(function (el) { revealIO.observe(el); });
}

/* ============ HERO 漂浮商品卡（整页唯一核心动效） ============ */
(function heroCards() {
  var stage = $("heroStage");
  var cards = [
    { kind: "phone",  name: "iPhone 13 256G",      price: "3,299", tag: "几乎全新", x: "13%", y: "0%",  r: -6 },
    { kind: "laptop", name: "ThinkPad T14",        price: "2,350", tag: "轻微使用", x: "56%", y: "0%",  r: 5 },
    { kind: "sofa",   name: "宜家诺曼双人沙发",    price: "750",   tag: "轻微使用", x: "36%", y: "54%", r: -3 },
    { kind: "jacket", name: "北面冲锋衣 男L",     price: "620",   tag: "几乎全新", x: "62%", y: "58%", r: 7 }
  ];
  stage.innerHTML = cards.map(function (c, i) {
    return '<div class="float-card" data-i="' + i + '" style="left:' + c.x + ";top:" + c.y + '">' +
      '<div class="fc-art">' + art(c.kind) + "</div>" +
      '<div class="fc-name">' + c.name + "</div>" +
      '<div class="fc-row"><span class="fc-price">¥' + c.price + " <small>验机通过</small></span>" +
      '<span class="fc-tag">' + c.tag + "</span></div></div>";
  }).join("");
  var els = stage.querySelectorAll(".float-card");
  if (!window.gsap) { // 兜底：无 GSAP 直接显示
    els.forEach(function (el) { el.style.opacity = "1"; });
    return;
  }
  els.forEach(function (el, i) {
    var c = cards[i];
    gsap.set(el, { rotation: c.r, scale: 0.85, y: 24 });
  });
  // 入场： stagger 弹出
  gsap.to(els, {
    opacity: 1, scale: 1, y: 0, duration: 0.9, ease: "back.out(1.6)",
    stagger: 0.14, delay: 0.35,
    onComplete: function () {
      // 入场完成后再挂漂浮循环（避开 transform 冲突：漂浮只动 y/rotation）
      els.forEach(function (el, i) {
        gsap.to(el, {
          y: "+=" + (10 + i * 3), rotation: "+=" + (i % 2 ? 2.5 : -2.5),
          duration: 2.6 + i * 0.5, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.3
        });
      });
    }
  });
})();

/* ============ 启动 ============ */
renderDeals();
bindReveal(document);
document.body.classList.add("loaded");
$("veil").classList.add("off");
// 兜底：3 秒强制全部 reveal + 幕布退场（完成态永远可达）
setTimeout(function () {
  document.querySelectorAll(".rv:not(.in)").forEach(function (el) { el.classList.add("in"); });
  document.body.classList.add("loaded");
  $("veil").classList.add("off");
}, 3000);
})();
