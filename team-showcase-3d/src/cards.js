/* huafire3d fx-lab — original implementation
 * 卡片：外层 tilt（JS 驱动 rotateX/Y + glare 高光），内层 flip（CSS rotateY 180）。 */
import { DEPT_LABEL } from "./config.js";
import { makeAvatar } from "./avatars.js";

const FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TILT_OK = FINE_POINTER && !REDUCED;

export function buildCard(member, index) {
  const el = document.createElement("article");
  el.className = "tcard reveal";
  el.dataset.dept = member.dept;
  el.dataset.index = index;
  el.tabIndex = 0;
  el.setAttribute("aria-label", `${member.name}，${member.role}`);

  const links = Object.entries(member.links || {})
    .map(([k, v]) => `<a href="${v}" target="_blank" rel="noopener">${k}</a>`).join("");

  el.innerHTML = `
    <div class="tcard-tilt">
      <div class="tcard-flip">
        <div class="tcard-face tcard-front" style="--accent:${member.color}">
          <img class="tcard-avatar" alt="${member.name} 的头像">
          <h3>${member.name}</h3>
          <p class="role">${member.role}</p>
          <span class="dept-tag">${DEPT_LABEL[member.dept]}</span>
          <span class="flip-hint">悬停翻面 →</span>
        </div>
        <div class="tcard-face tcard-back" style="--accent:${member.color}">
          <p class="bio">${member.bio}</p>
          <div class="links">${links}</div>
          <span class="flip-hint">← 点按翻回</span>
        </div>
      </div>
      <div class="tcard-glare" aria-hidden="true"></div>
    </div>`;

  el.querySelector(".tcard-avatar").src = makeAvatar(member.name, member.color);

  if (TILT_OK) attachTilt(el);
  else el.addEventListener("click", () => el.classList.toggle("flipped")); // 触屏/降级：点按翻面

  return el;
}

function attachTilt(card) {
  const tilt = card.querySelector(".tcard-tilt");
  let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;

  const render = () => {
    raf = 0;
    cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18; // 阻尼跟随，手感顺滑
    tilt.style.transform = `perspective(900px) rotateX(${cx.toFixed(2)}deg) rotateY(${cy.toFixed(2)}deg)`;
    if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(render);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(render); };

  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    tx = (0.5 - py) * 14; ty = (px - 0.5) * 14;
    card.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    card.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    card.classList.add("is-tilting");
    kick();
  });
  card.addEventListener("pointerleave", () => {
    tx = 0; ty = 0;
    card.classList.remove("is-tilting");
    tilt.style.transition = "transform .5s cubic-bezier(.2,.7,.3,1)";
    kick();
    setTimeout(() => { tilt.style.transition = ""; }, 500);
  });
}
