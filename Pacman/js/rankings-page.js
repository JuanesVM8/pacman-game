/**
 * Entrada de la página rankings.html — monta el componente y estadísticas derivadas.
 */

import { loadScores } from "./Score.js";
import { renderRankingBoard } from "./components/RankingBoard.js";

function sumPellets(scores) {
  return scores.reduce((acc, s) => acc + Math.max(0, Math.floor(s.score / 10)), 0);
}

function init() {
  const mount = document.getElementById("ranking-board-mount");
  const scores = loadScores();
  if (mount) {
    renderRankingBoard(mount, scores);
  } else {
    console.error("[rankings-page] #ranking-board-mount no encontrado.");
  }

  const hunters = document.getElementById("stat-hunters");
  const pellets = document.getElementById("stat-pellets");
  const topName = document.getElementById("stat-top-name");
  const sidebarHigh = document.getElementById("sidebar-high");

  if (hunters) hunters.textContent = String(scores.length);
  if (pellets) pellets.textContent = sumPellets(scores).toLocaleString("en-US");
  if (topName) topName.textContent = scores[0] ? scores[0].name : "—";
  if (sidebarHigh) sidebarHigh.textContent = scores.length ? String(scores[0].score) : "0";
}

init();
