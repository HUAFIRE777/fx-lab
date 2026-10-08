/* huafire3d fx-lab — original implementation
 * 3D 堆叠轮播：CSS perspective 纵深 + JS 状态机。
 * 手法：居中主卡，两侧卡片按偏移量下沉（translateZ）、倾斜（rotateY）、虚化（blur），
 * 拖拽时实时叠加分数偏移，松手按阈值吸附。全部自己实现，无轮播库。
 */
import { CONFIG } from "./config.js";
import { avatarURL } from "./avatars.js";

var STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.7l2.9 5.9 6.5 1-4.7 4.6 1.1 6.5L12 17.6l-5.8 3.1 1.1-6.5L2.6 9.6l6.5-1z"/></svg>';

function starsHTML(rating) {
  var out = '<div class="stars" role="img" aria-label="' + rating + ' out of 5 stars">';
  for (var i = 1; i <= 5; i++) {
    out += '<span class="star' + (i <= rating ? " on" : "") + '">' + STAR_SVG + "</span>";
  }
  return out + "</div>";
}

function pad(n) {
  return (n < 10 ? "0" : "") + n;
}

export function initCarousel(stage) {
  var root = stage.closest(".wall") || document;
  var deck = stage.querySelector(".deck");
  var dotsEl = root.querySelector(".dots");
  var counterEl = root.querySelector(".counter");
  var progressEl = root.querySelector(".progress i");
  var prevBtn = stage.querySelector(".nav.prev");
  var nextBtn = stage.querySelector(".nav.next");

  var items = CONFIG.testimonials;
  var n = items.length;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var compact = window.matchMedia("(max-width: 760px)").matches;

  // 几何参数：桌面 / 移动两套
  var P = compact
    ? { x: 88, z: 150, ry: 13, blur: 2.2, fade: 0.5 }
    : { x: 74, z: 190, ry: 15, blur: 1.6, fade: 0.38 };

  // 建卡
  var cards = items.map(function (t, i) {
    var el = document.createElement("article");
    el.className = "card";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="card-top">' +
        starsHTML(t.rating) +
        '<span class="card-index">' + pad(i + 1) + " / " + pad(n) + "</span>" +
      "</div>" +
      '<blockquote>' + t.quote + "</blockquote>" +
      '<footer>' +
        '<img class="avatar" alt="" src="' + avatarURL(t.name, t.hue) + '">' +
        '<div class="who"><div class="name">' + t.name + '</div>' +
        '<div class="role">' + t.role + " · " + t.company + "</div></div>" +
      "</footer>";
    deck.appendChild(el);
    return el;
  });

  // 建圆点
  var dots = items.map(function (_, i) {
    var b = document.createElement("button");
    b.className = "dot";
    b.setAttribute("aria-label", "Go to testimonial " + (i + 1));
    b.addEventListener("click", function () { go(i); });
    dotsEl.appendChild(b);
    return b;
  });

  var index = 0;
  var timer = null;
  var dragging = false;
  var dragX0 = 0;
  var dragFrac = 0;
  var paused = false; // hover / focus 暂停

  function signedOffset(i) {
    var d = (i - index) % n;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  }

  function layout(frac) {
    frac = frac || 0;
    for (var i = 0; i < n; i++) {
      var s = signedOffset(i) + frac;
      var a = Math.abs(s);
      var card = cards[i];
      var vis = a <= 2.25;
      var near = Math.round(s) === 0 && Math.abs(frac) < 0.5;
      card.style.opacity = vis ? String(Math.max(0, 1 - a * P.fade)) : "0";
      card.style.transform =
        "translateX(" + (s * P.x).toFixed(2) + "%)" +
        " translateZ(" + (-a * P.z).toFixed(1) + "px)" +
        " rotateY(" + (s * -P.ry).toFixed(2) + "deg)" +
        " scale(" + (1 - a * 0.07).toFixed(3) + ")";
      card.style.filter = a > 0.04 ? "blur(" + (a * P.blur).toFixed(1) + "px)" : "none";
      card.style.zIndex = String(30 - Math.round(a * 10));
      card.style.pointerEvents = near && !dragging ? "auto" : "none";
      card.classList.toggle("is-active", near);
      card.setAttribute("aria-hidden", near ? "false" : "true");
    }
    dots.forEach(function (d, i) { d.classList.toggle("on", i === index); });
    counterEl.textContent = pad(index + 1) + " — " + pad(n);
  }

  function restartAutoplay() {
    stopAutoplay();
    if (reduceMotion || !CONFIG.autoplayMs) return;
    progressEl.style.transition = "none";
    progressEl.style.width = "0%";
    void progressEl.offsetWidth; // 强制回流，让下面的 transition 生效
    progressEl.style.transition = "width " + CONFIG.autoplayMs + "ms linear";
    progressEl.style.width = "100%";
    timer = setTimeout(function () { go(index + 1); }, CONFIG.autoplayMs);
  }

  function stopAutoplay() {
    if (timer) { clearTimeout(timer); timer = null; }
    progressEl.style.transition = "none";
  }

  function go(i) {
    index = ((i % n) + n) % n;
    layout(0);
    restartAutoplay();
  }

  // 拖拽：横向拖动带分数偏移，松手阈值吸附
  stage.addEventListener("pointerdown", function (e) {
    if (e.target.closest("button")) return;
    dragging = true;
    dragX0 = e.clientX;
    dragFrac = 0;
    stage.classList.add("dragging");
    stage.setPointerCapture(e.pointerId);
    stopAutoplay();
  });
  stage.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var w = cards[0].offsetWidth || 1;
    dragFrac = Math.max(-1.4, Math.min(1.4, (e.clientX - dragX0) / (w * 0.55)));
    layout(dragFrac);
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("dragging");
    if (dragFrac < -0.32) go(index + 1);
    else if (dragFrac > 0.32) go(index - 1);
    else { layout(0); restartAutoplay(); }
    dragFrac = 0;
  }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  // hover / focus 暂停，离开恢复
  stage.addEventListener("pointerenter", function () { paused = true; stopAutoplay(); });
  stage.addEventListener("pointerleave", function () { paused = false; if (!dragging) restartAutoplay(); });
  stage.addEventListener("focusin", function () { stopAutoplay(); });
  stage.addEventListener("focusout", function () { if (!dragging) restartAutoplay(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopAutoplay();
    else if (!paused && !dragging) restartAutoplay();
  });

  prevBtn.addEventListener("click", function () { go(index - 1); });
  nextBtn.addEventListener("click", function () { go(index + 1); });
  stage.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") go(index - 1);
    else if (e.key === "ArrowRight") go(index + 1);
  });

  window.addEventListener("resize", function () {
    compact = window.matchMedia("(max-width: 760px)").matches;
    P = compact
      ? { x: 88, z: 150, ry: 13, blur: 2.2, fade: 0.5 }
      : { x: 74, z: 190, ry: 15, blur: 1.6, fade: 0.38 };
    layout(0);
  });

  layout(0);
  restartAutoplay();
}
