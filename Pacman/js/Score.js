/**
 * Score.js — Persistencia del ranking en localStorage (clave JSON ordenada).
 *
 * localStorage guarda cadenas; serializamos un arreglo de entradas y lo ordenamos
 * por puntuación descendente (criterio de ordenación estable para empates opcional).
 */

const STORAGE_KEY = "pacman-modular-scores-v1";
const MAX_ENTRIES = 10;

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error("[Score] JSON inválido en localStorage:", e);
    return [];
  }
}

function normalizeEntry(entry) {
  if (
    !entry ||
    typeof entry.score !== "number" ||
    typeof entry.name !== "string"
  ) {
    console.warn("[Score] Entrada ignorada (formato inesperado):", entry);
    return null;
  }
  return {
    name: entry.name.slice(0, 24).trim() || "Anónimo",
    score: Math.floor(entry.score),
    date:
      typeof entry.date === "string" ? entry.date : new Date().toISOString(),
  };
}

export function loadScores() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const data = safeParse(raw);
  if (!Array.isArray(data)) {
    console.error("[Score] Se esperaba un arreglo en", STORAGE_KEY);
    return [];
  }
  return data
    .map(normalizeEntry)
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
}

function saveAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("[Score] No se pudo guardar (¿cuota llena?):", e);
  }
}

/**
 * Inserta una puntuación y devuelve el ranking completo ordenado.
 */
export function addScore(name, score) {
  const entry = normalizeEntry({
    name,
    score,
    date: new Date().toISOString(),
  });
  if (!entry) return loadScores();
  const next = [...loadScores(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  saveAll(next);
  return next;
}
