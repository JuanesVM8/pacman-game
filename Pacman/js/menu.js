/**
 * Menú principal (index): solo lectura del mejor puntaje local.
 */
import { loadScores } from "./Score.js";

const el = document.getElementById("menu-high-score");
if (el) {
  const scores = loadScores();
  el.textContent = scores.length ? String(scores[0].score) : "0";
}
