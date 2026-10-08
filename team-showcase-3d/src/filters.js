/* huafire3d fx-lab — original implementation
 * 筛选编排：先淡出不匹配的，再 stagger 淡入匹配的。 */
export function initFilters(grid) {
  const buttons = [...document.querySelectorAll(".filter")];
  const cards = () => [...grid.querySelectorAll(".tcard")];

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("is-active")) return;
      buttons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      applyFilter(btn.dataset.filter);
    });
  });

  function applyFilter(f) {
    const list = cards();
    // 1) 不匹配的先淡出
    list.forEach((card) => {
      const match = f === "all" || card.dataset.dept === f;
      if (!match) {
        card.classList.add("is-out");
        setTimeout(() => card.classList.add("gone"), 360);
      }
    });
    // 2) 匹配的 stagger 淡入
    let i = 0;
    list.forEach((card) => {
      const match = f === "all" || card.dataset.dept === f;
      if (!match) return;
      card.classList.remove("gone");
      void card.offsetWidth; // 强制重排，让 transition 重新起播
      setTimeout(() => card.classList.remove("is-out"), 60 + i * 70);
      i++;
    });
  }
}
