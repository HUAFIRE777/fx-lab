/* huafire3d fx-lab — original implementation */
import { initCarousel } from "./carousel.js";
import { initLogos } from "./logos.js";

document.addEventListener("DOMContentLoaded", function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("reduced");
  }
  initCarousel(document.getElementById("stage"));
  initLogos(document.getElementById("logos"));
});
