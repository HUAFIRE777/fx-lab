/* 贝安 BAYAN · 母婴品牌落地页交互
   零外部依赖，纯原生 JS。 */
(function(){
"use strict";
document.documentElement.classList.add("js");

/* ============ 配置：一改全改 ============ */
var SITE = {
  brand: "贝安 BAYAN",
  organizer: "上海贝安母婴用品有限公司",   // 虚构主体
  address: "上海市静安区安和路 88 号贝安大楼 3 层", // 虚构地址
  email: "service@bayan-mom.example.com",          // 虚构邮箱
  phone: "400-880-2026",                            // 虚构电话
  icp: "沪ICP备2026000000号-1"                      // 虚构备案
};
var CONFIG = {
  revealThreshold: 0.12,   // 滚动 reveal 触发比例
  toastMs: 2600,           // toast 停留毫秒
  fakeLoadMs: 900,         // 产品图模拟加载时长
  railStep: 0.85           // 轮播每次滚动步长（相对视口）
};

/* ============ 产品插画（程序化 SVG，原创） ============ */
function productSVG(kind){
  var bg = '<rect width="400" height="300" fill="#F3ECDD"/>' +
           '<circle cx="200" cy="150" r="105" fill="#FAF6EF"/>' +
           '<circle cx="200" cy="150" r="105" fill="none" stroke="#A8C3D1" stroke-width="3" stroke-dasharray="10 12" opacity=".7"/>';
  var s = "";
  if(kind==="onesie"){
    s = '<g><rect x="150" y="70" width="100" height="150" rx="34" fill="#A8C3D1"/>' +
        '<rect x="118" y="92" width="44" height="60" rx="20" fill="#A8C3D1" transform="rotate(18 140 122)"/>' +
        '<rect x="238" y="92" width="44" height="60" rx="20" fill="#A8C3D1" transform="rotate(-18 260 122)"/>' +
        '<ellipse cx="200" cy="80" rx="26" ry="14" fill="#FAF6EF"/>' +
        '<circle cx="186" cy="150" r="5" fill="#FAF6EF"/><circle cx="200" cy="150" r="5" fill="#FAF6EF"/><circle cx="214" cy="150" r="5" fill="#FAF6EF"/>' +
        '<path d="M170 205c8-8 16 8 24 0s16 8 24 0" stroke="#F4B8A0" stroke-width="6" fill="none" stroke-linecap="round"/></g>';
  }else if(kind==="bottle"){
    s = '<g><rect x="160" y="110" width="80" height="130" rx="26" fill="#A8C3D1" opacity=".9"/>' +
        '<rect x="160" y="150" width="80" height="46" fill="#F4B8A0" opacity=".85"/>' +
        '<rect x="172" y="86" width="56" height="34" rx="8" fill="#7FA3B5"/>' +
        '<path d="M186 86c0-22 8-30 14-30s14 8 14 30z" fill="#F4B8A0"/>' +
        '<circle cx="176" cy="130" r="7" fill="#FAF6EF" opacity=".8"/><circle cx="192" cy="124" r="4" fill="#FAF6EF" opacity=".8"/></g>';
  }else if(kind==="blanket"){
    s = '<g><rect x="105" y="80" width="190" height="150" rx="26" fill="#F4B8A0"/>' +
        '<rect x="105" y="80" width="190" height="150" rx="26" fill="none" stroke="#E89A80" stroke-width="5" stroke-dasharray="14 10"/>' +
        '<path d="M225 120a26 26 0 1020 44 20 20 0 11-20-44z" fill="#FAF6EF"/>' +
        '<circle cx="155" cy="130" r="5" fill="#FAF6EF"/><circle cx="180" cy="185" r="4" fill="#FAF6EF"/><circle cx="150" cy="180" r="3" fill="#FAF6EF"/></g>';
  }else if(kind==="shoes"){
    s = '<g><g transform="rotate(-8 150 190)"><rect x="100" y="150" width="100" height="70" rx="32" fill="#A8C3D1"/>' +
        '<rect x="100" y="196" width="100" height="24" rx="12" fill="#FAF6EF"/>' +
        '<circle cx="150" cy="160" r="6" fill="#FAF6EF"/></g>' +
        '<g transform="rotate(8 250 190)"><rect x="200" y="150" width="100" height="70" rx="32" fill="#F4B8A0"/>' +
        '<rect x="200" y="196" width="100" height="24" rx="12" fill="#FAF6EF"/>' +
        '<circle cx="250" cy="160" r="6" fill="#FAF6EF"/></g></g>';
  }else if(kind==="bib"){
    s = '<g><path d="M150 70h100l30 110c4 16-6 32-22 36l-30 10c-18 6-38 6-56 0l-30-10c-16-4-26-20-22-36z" fill="#A8C3D1"/>' +
        '<path d="M150 70c0-22 22-34 50-34s50 12 50 34" fill="none" stroke="#7FA3B5" stroke-width="10"/>' +
        '<circle cx="200" cy="150" r="30" fill="#FAF6EF" opacity=".85"/>' +
        '<circle cx="192" cy="146" r="4" fill="#7FA3B5"/><circle cx="208" cy="146" r="4" fill="#7FA3B5"/>' +
        '<path d="M192 160c4 6 12 6 16 0" stroke="#7FA3B5" stroke-width="4" fill="none" stroke-linecap="round"/></g>';
  }else if(kind==="sleepsack"){
    s = '<g><path d="M150 60c30-14 70-14 100 0l14 130c2 22-16 40-38 44l-26 6c-20 4-40-12-42-34z" fill="#A8C3D1" transform="translate(-6 0)"/>' +
        '<path d="M168 60c30-14 70-14 100 0l14 130c2 22-16 40-38 44l-26 6c-20 4-40-12-42-34z" fill="none" transform="translate(6 0)"/>' +
        '<rect x="196" y="80" width="8" height="120" rx="4" fill="#FAF6EF"/>' +
        '<circle cx="200" cy="90" r="8" fill="#F4B8A0"/>' +
        '<path d="M160 210c10-8 20 8 30 0s20 8 30 0" stroke="#FAF6EF" stroke-width="6" fill="none" stroke-linecap="round"/></g>';
  }else if(kind==="set"){
    s = '<g><rect x="130" y="70" width="70" height="90" rx="22" fill="#F4B8A0"/>' +
        '<rect x="200" y="70" width="70" height="90" rx="22" fill="#A8C3D1"/>' +
        '<ellipse cx="165" cy="76" rx="18" ry="9" fill="#FAF6EF"/><ellipse cx="235" cy="76" rx="18" ry="9" fill="#FAF6EF"/>' +
        '<rect x="140" y="180" width="52" height="70" rx="16" fill="#F4B8A0"/>' +
        '<rect x="208" y="180" width="52" height="70" rx="16" fill="#A8C3D1"/>' +
        '<rect x="140" y="180" width="120" height="22" rx="10" fill="#FAF6EF" opacity=".7"/></g>';
  }else if(kind==="towel"){
    s = '<g><rect x="110" y="120" width="180" height="100" rx="24" fill="#A8C3D1"/>' +
        '<rect x="110" y="120" width="180" height="100" rx="24" fill="none" stroke="#7FA3B5" stroke-width="5" stroke-dasharray="12 10"/>' +
        '<path d="M140 120l60-52 60 52z" fill="#F4B8A0"/>' +
        '<circle cx="200" cy="98" r="10" fill="#FAF6EF" opacity=".9"/></g>';
  }else{ /* bear */
    s = '<g><circle cx="150" cy="110" r="26" fill="#F4B8A0"/><circle cx="250" cy="110" r="26" fill="#F4B8A0"/>' +
        '<circle cx="150" cy="110" r="12" fill="#E89A80"/><circle cx="250" cy="110" r="12" fill="#E89A80"/>' +
        '<circle cx="200" cy="150" r="62" fill="#F4B8A0"/>' +
        '<ellipse cx="200" cy="168" rx="30" ry="24" fill="#FAF6EF" opacity=".85"/>' +
        '<circle cx="178" cy="140" r="7" fill="#39352e"/><circle cx="222" cy="140" r="7" fill="#39352e"/>' +
        '<ellipse cx="200" cy="162" rx="9" ry="7" fill="#39352e"/>' +
        '<ellipse cx="148" cy="230" rx="34" ry="26" fill="#F4B8A0"/><ellipse cx="252" cy="230" rx="34" ry="26" fill="#F4B8A0"/></g>';
  }
  return '<svg viewBox="0 0 400 300" role="img" aria-label="产品插画">' + bg + s + '</svg>';
}

/* ============ 商品数据 ============ */
var PRODUCTS = [
  {age:0, kind:"onesie", tag:"月销 8 万件", name:"云朵纯棉连体衣", desc:"A类针织棉，裆部三排按扣，换尿布不用整件脱。", price:"¥89", old:"¥129"},
  {age:0, kind:"bottle", tag:"防胀气", name:"宽口径 PPSU 奶瓶", desc:"奶嘴仿乳头弧度，宝宝含接不费力，夜奶也顺。", price:"¥129", old:"¥169"},
  {age:0, kind:"blanket", tag:"新生儿必备", name:"星月针织抱被", desc:"双层针织不掉絮，包得紧又透气，抱出门不哭。", price:"¥159", old:"¥199"},
  {age:1, kind:"shoes", tag:"学步首选", name:"软底学步鞋", desc:"前掌三分之一弯折，鞋底防滑纹，扶站不打滑。", price:"¥119", old:"¥159"},
  {age:1, kind:"bib", tag:"防水易洗", name:"立体防水围兜", desc:"兜口加深接得住饭粒，硅胶面一冲就干净。", price:"¥39", old:"¥59"},
  {age:1, kind:"sleepsack", tag:"整夜安睡", name:"分腿恒温睡袋", desc:"TOG 值按季节分档，踢被子也不着凉。", price:"¥199", old:"¥259"},
  {age:2, kind:"set", tag:"自己穿得上", name:"无骨缝内衣套装", desc:"前后大字区分，3 岁娃自己套头不求人。", price:"¥99", old:"¥139"},
  {age:2, kind:"towel", tag:"加厚吸水", name:"连帽浴巾", desc:"洗完一裹就暖，帽子兜住小脑袋不滴水。", price:"¥79", old:"¥109"},
  {age:2, kind:"bear", tag:"安抚神器", name:"陪伴安抚小熊", desc:"填充物可水洗，耳朵里有轻微响纸，哄睡好帮手。", price:"¥69", old:"¥99"}
];
var STARS = [0, 3, 5, 2, 7]; // 明星单品取 PRODUCTS 下标

/* ============ 渲染 ============ */
function cardHTML(p){
  return '<article class="pcard">' +
    '<div class="pcard-art">' + (p.tag ? '<span class="ptag">' + p.tag + "</span>" : "") + productSVG(p.kind) + "</div>" +
    '<div class="pcard-body"><h3>' + p.name + "</h3><p>" + p.desc + '</p>' +
    '<div class="prow"><span class="price">' + p.price + "<small>" + p.old + '</small></span>' +
    '<button class="pbtn" data-toast="演示：' + p.name + ' 已加入购物袋">加入购物袋</button></div></div></article>';
}
function renderGrids(){
  [0,1,2].forEach(function(a){
    var el = document.querySelector('[data-grid="' + a + '"]');
    el.innerHTML = PRODUCTS.filter(function(p){return p.age===a;}).map(cardHTML).join("");
  });
  var rail = document.getElementById("rail");
  rail.innerHTML = STARS.map(function(i){return cardHTML(PRODUCTS[i]);}).join("");
  // 模拟图片加载：骨架 shimmer 消失
  setTimeout(function(){
    document.querySelectorAll(".pcard-art").forEach(function(a){a.classList.add("done");});
  }, CONFIG.fakeLoadMs);
}

/* ============ SITE 变量注入 ============ */
function renderSite(){
  document.querySelectorAll("[data-site]").forEach(function(el){
    var k = el.getAttribute("data-site");
    if(SITE[k]) el.textContent = SITE[k];
  });
  document.title = SITE.brand + " · 陪伴宝宝安心长大";
}

/* ============ toast ============ */
var toastTimer = null;
function toast(msg){
  var t = document.getElementById("toast");
  t.textContent = msg; t.hidden = false;
  requestAnimationFrame(function(){ t.classList.add("show"); });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.classList.remove("show"); }, CONFIG.toastMs);
}
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-toast]");
  if(b){ e.preventDefault(); toast(b.getAttribute("data-toast")); }
});

/* ============ 年龄段 tab ============ */
function initTabs(){
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  tabs.forEach(function(tab){
    tab.addEventListener("click", function(){
      tabs.forEach(function(t){ t.classList.remove("is-on"); t.setAttribute("aria-selected","false"); });
      tab.classList.add("is-on"); tab.setAttribute("aria-selected","true");
      var age = tab.getAttribute("data-age");
      document.querySelectorAll(".age-panel").forEach(function(p){
        var on = p.getAttribute("data-panel") === age;
        p.hidden = !on;
        p.classList.toggle("is-on", on);
      });
    });
  });
}

/* ============ 横滑轮播 ============ */
function initRail(){
  var rail = document.getElementById("rail");
  function step(){
    var card = rail.querySelector(".pcard");
    return card ? card.offsetWidth * CONFIG.railStep : 300;
  }
  document.getElementById("railPrev").addEventListener("click", function(){
    rail.scrollBy({left: -step(), behavior: "smooth"});
  });
  document.getElementById("railNext").addEventListener("click", function(){
    rail.scrollBy({left: step(), behavior: "smooth"});
  });
}

/* ============ 导航滚动 + 抽屉 ============ */
function initNav(){
  var nav = document.getElementById("nav");
  function onScroll(){ nav.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, {passive:true}); onScroll();

  var burger = document.getElementById("burger"),
      drawer = document.getElementById("drawer"),
      scrim = document.getElementById("scrim"),
      closeBtn = document.getElementById("drawerClose");
  function openDrawer(){
    drawer.hidden = false; scrim.hidden = false;
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ drawer.classList.remove("off"); }); });
    burger.setAttribute("aria-expanded","true");
    document.documentElement.classList.add("lock");
  }
  function closeDrawer(){
    drawer.classList.add("off"); scrim.hidden = true;
    burger.setAttribute("aria-expanded","false");
    document.documentElement.classList.remove("lock");
    setTimeout(function(){ if(drawer.classList.contains("off")) drawer.hidden = true; }, 420);
  }
  drawer.classList.add("off");
  burger.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  scrim.addEventListener("click", closeDrawer);
  drawer.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", closeDrawer); });
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && !drawer.hidden) closeDrawer();
  });
}

/* ============ 法务弹窗 ============ */
function initModal(){
  var scrim = document.getElementById("modalScrim"),
      title = document.getElementById("modalTitle"),
      names = {privacy:"隐私政策", terms:"服务条款", cookies:"Cookie 政策"},
      lastFocus = null;
  function open(which){
    lastFocus = document.activeElement;
    title.textContent = names[which] || "政策";
    document.querySelectorAll(".modal-body").forEach(function(b){
      b.hidden = b.getAttribute("data-body") !== which;
    });
    scrim.hidden = false;
    document.documentElement.classList.add("lock");
    document.getElementById("modalClose").focus();
  }
  function close(){
    scrim.hidden = true;
    document.documentElement.classList.remove("lock");
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll("[data-modal]").forEach(function(btn){
    btn.addEventListener("click", function(){ open(btn.getAttribute("data-modal")); });
  });
  document.getElementById("modalClose").addEventListener("click", close);
  scrim.addEventListener("click", function(e){ if(e.target === scrim) close(); });
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && !scrim.hidden) close();
  });
}

/* ============ 表单 ============ */
function initForm(){
  var form = document.getElementById("giftForm"),
      input = document.getElementById("giftPhone");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var v = input.value.replace(/\D/g, "");
    if(!/^1\d{10}$/.test(v)){
      input.classList.remove("err");
      void input.offsetWidth; // 重启动画
      input.classList.add("err");
      toast("手机号格式不对，请检查后再试");
      input.focus();
      return;
    }
    input.classList.remove("err");
    toast("领取成功！新人券已发至 " + v.slice(0,3) + "****" + v.slice(7) + "，注意查收短信");
    form.reset();
  });
}

/* ============ 滚动 reveal + hero 入场 ============ */
function initReveal(){
  // hero 入场：下一帧加类，CSS transition 完成显示态
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      document.querySelector(".hero").classList.add("hero-in");
    });
  });

  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, {threshold: CONFIG.revealThreshold}) : null;

  var els = document.querySelectorAll("[data-reveal]");
  if(io){ els.forEach(function(el){ io.observe(el); }); }
  // 兜底：3 秒后强制全部显示，保证完成态永远可达
  setTimeout(function(){
    els.forEach(function(el){ el.classList.add("in"); });
    document.querySelector(".hero").classList.add("hero-in");
  }, 3000);
}

/* ============ 启动 ============ */
function init(){
  renderSite();
  renderGrids();
  initTabs();
  initRail();
  initNav();
  initModal();
  initForm();
  initReveal();
  // 加载幕布：首屏就绪即消失 + 2.5s 兜底
  function hideVeil(){ document.getElementById("veil").classList.add("gone"); }
  if(document.readyState === "complete") hideVeil();
  else window.addEventListener("load", hideVeil);
  setTimeout(hideVeil, 2500);
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
})();
