/* huafire3d fx-lab — original implementation */
import { TEAM } from "./config.js";
import { buildCard } from "./cards.js";
import { initFilters } from "./filters.js";
import { initEntrance } from "./entrance.js";

const grid = document.getElementById("teamGrid");
TEAM.forEach((m, i) => grid.appendChild(buildCard(m, i)));

document.getElementById("count-all").textContent = TEAM.length;

initFilters(grid);
initEntrance(grid);
