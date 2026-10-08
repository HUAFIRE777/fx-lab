/* huafire3d fx-lab — original implementation
 * 入场 stagger：IntersectionObserver 按列 stagger；无 IO 时兜底全显（保证"显示"可达）。 */
export function initEntrance(grid) {
  const cards = [...grid.querySelectorAll(".tcard")];
  cards.forEach((card, i) => card.style.setProperty("--d", `${(i % 4) * 80}ms`));

  if (!("IntersectionObserver" in window)) {
    cards.forEach((c) => c.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  cards.forEach((c) => io.observe(c));

  // 兜底：3 秒后还没进场的卡片强制显示（IO 在某些环境不触发时不留白屏）
  setTimeout(() => cards.forEach((c) => c.classList.add("in")), 3000);
}
