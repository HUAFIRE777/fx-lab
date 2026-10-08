/* huafire3d fx-lab — original implementation
 * Logo 墙：无缝循环走马灯。手法是把同一组 logo 复制两份，
 * track 做 translateX(-50%) 循环；悬停暂停；reduced-motion 下静止平铺。
 */
import { CONFIG } from "./config.js";

export function initLogos(root) {
  var track = root.querySelector(".track");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function group() {
    var g = document.createElement("div");
    g.className = "group";
    g.setAttribute("aria-hidden", "false");
    CONFIG.logos.forEach(function (l) {
      var s = document.createElement("span");
      s.className = "wordmark " + l.cls;
      s.textContent = l.text;
      g.appendChild(s);
    });
    return g;
  }

  var a = group();
  track.appendChild(a);
  if (!reduceMotion) {
    var b = group();
    b.setAttribute("aria-hidden", "true");
    track.appendChild(b);
    track.classList.add("animate");
  }
}
