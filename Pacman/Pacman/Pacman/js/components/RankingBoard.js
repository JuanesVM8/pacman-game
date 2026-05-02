/**
 * RankingBoard.js — Componente UI del listado de ranking (solo presentación).
 * Recibe el mismo formato que devuelve loadScores(): { name, score, date }.
 */

function formatWithCommas(n) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function rankLabel(index) {
  return String(index + 1).padStart(2, "0");
}

function pelletsProxy(score) {
  return Math.max(0, Math.floor(score / 10));
}

function clearContainer(el) {
  el.innerHTML = "";
}

function buildTableHeader() {
  const row = document.createElement("div");
  row.className =
    "hidden md:grid grid-cols-12 px-8 py-4 bg-surface-container-low border-b border-outline-variant/20";
  row.innerHTML = `
    <div class="col-span-1 font-label text-xs text-outline tracking-widest uppercase">Ranking</div>
    <div class="col-span-6 font-label text-xs text-outline tracking-widest uppercase">Nombre del jugador</div>
    <div class="col-span-3 font-label text-xs text-outline tracking-widest uppercase">Puntos</div>
    <div class="col-span-2 font-label text-xs text-outline tracking-widest uppercase text-right">Puntuación más alta</div>
  `;
  return row;
}

function buildEmptyState() {
  const wrap = document.createElement("div");
  wrap.className =
    "px-8 py-10 bg-surface-container-high border border-outline-variant/20 text-center text-on-surface-variant font-label text-sm";
  wrap.textContent = "No hay puntuaciones todavía — juega una partida y guarda tu nombre.";
  return wrap;
}

function avatarBlock(index) {
  const hues = ["#00e3fd", "#fffeac", "#ff6f7d", "#a855f7"];
  const bg = hues[index % hues.length];
  const box = document.createElement("div");
  box.className = "flex items-center justify-center border border-white/10";
  box.style.background = `${bg}22`;
  box.style.borderColor = `${bg}44`;
  const icon = document.createElement("span");
  icon.className = "material-symbols-outlined text-on-surface";
  icon.textContent = "person";
  icon.style.fontVariationSettings = "'FILL' 1";
  box.appendChild(icon);
  return box;
}

function nameBlock(name, subtitle, large) {
  const wrap = document.createElement("div");
  const title = document.createElement("div");
  title.className = large
    ? "font-headline text-2xl font-bold uppercase tracking-tight"
    : "font-headline text-xl font-bold uppercase";
  title.textContent = name;
  wrap.appendChild(title);
  if (subtitle) {
    const sub = document.createElement("div");
    sub.className = "font-label text-[10px] text-secondary tracking-widest uppercase";
    sub.textContent = subtitle;
    wrap.appendChild(sub);
  }
  return wrap;
}

function buildFeaturedRow(entry, index) {
  const outer = document.createElement("div");
  outer.className = "relative group";
  outer.innerHTML = `<div class="absolute -top-1 -right-1 w-4 h-4 bg-primary z-10 shadow-[0_0_10px_rgba(255,254,172,1)]"></div>`;
  const row = document.createElement("div");
  row.className =
    "grid grid-cols-1 md:grid-cols-12 items-center px-8 py-8 bg-surface-container-high border-l-4 border-primary transition-all group-hover:bg-surface-bright shadow-[0_0_20px_rgba(255,254,172,0.05)]";

  const rankCell = document.createElement("div");
  rankCell.className = "col-span-1 flex items-center gap-2 mb-4 md:mb-0";
  rankCell.innerHTML = `
    <span class="font-headline text-3xl font-black text-primary">${rankLabel(index)}</span>
    <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1">workspace_premium</span>
  `;

  const nameCol = document.createElement("div");
  nameCol.className = "col-span-6 flex items-center gap-4 mb-4 md:mb-0";
  const av = avatarBlock(index);
  av.className += " w-12 h-12 bg-surface-container-highest";
  nameCol.appendChild(av);
  const nb = nameBlock(entry.name, "LOCAL ARCADE", true);
  nameCol.appendChild(nb);

  const mid = document.createElement("div");
  mid.className = "col-span-3 mb-4 md:mb-0";
  mid.innerHTML = `
    <div class="md:hidden text-outline text-[10px] uppercase mb-1">Pellets</div>
    <div class="font-headline text-xl text-on-surface">${formatWithCommas(pelletsProxy(entry.score))}</div>
  `;

  const scoreCell = document.createElement("div");
  scoreCell.className = "col-span-2 text-left md:text-right";
  scoreCell.innerHTML = `
    <div class="md:hidden text-outline text-[10px] uppercase mb-1">High Score</div>
    <div class="font-headline text-2xl font-black text-primary drop-shadow-[0_0_8px_rgba(255,254,172,0.5)]">${formatWithCommas(entry.score)}</div>
  `;

  row.append(rankCell, nameCol, mid, scoreCell);
  outer.appendChild(row);
  return outer;
}

function borderClassForIndex(i) {
  if (i === 1) return "border-secondary/40";
  return "border-transparent";
}

function bgClassForIndex(i) {
  if (i === 2) return "bg-surface-container-low";
  return "bg-surface-container";
}

function rankSpanClass(i) {
  if (i === 1) return "font-headline text-2xl font-bold text-secondary";
  if (i === 2) return "font-headline text-2xl font-bold text-on-surface";
  if (i === 3) return "font-headline text-2xl font-bold text-on-surface";
  return "font-headline text-xl font-bold text-outline";
}

function buildStandardRow(entry, index) {
  const row = document.createElement("div");
  row.className = `grid grid-cols-1 md:grid-cols-12 items-center px-8 py-6 ${bgClassForIndex(
    index,
  )} transition-all hover:bg-surface-container-high border-l-4 ${borderClassForIndex(index)}`;

  const rankCell = document.createElement("div");
  rankCell.className = "col-span-1 mb-4 md:mb-0";
  const rk = document.createElement("span");
  rk.className = rankSpanClass(index);
  rk.textContent = rankLabel(index);
  rankCell.appendChild(rk);

  const nameCol = document.createElement("div");
  nameCol.className = "col-span-6 flex items-center gap-4 mb-4 md:mb-0";
  const av = avatarBlock(index);
  av.className += " w-10 h-10 bg-surface-container-low";
  nameCol.appendChild(av);
  nameCol.appendChild(nameBlock(entry.name, "", false));

  const mid = document.createElement("div");
  mid.className = "col-span-3 mb-4 md:mb-0";
  mid.innerHTML = `
    <div class="md:hidden text-outline text-[10px] uppercase mb-1">Pellets</div>
    <div class="font-headline text-lg text-on-surface">${formatWithCommas(pelletsProxy(entry.score))}</div>
  `;

  const scoreCell = document.createElement("div");
  scoreCell.className = "col-span-2 text-left md:text-right";
  scoreCell.innerHTML = `
    <div class="md:hidden text-outline text-[10px] uppercase mb-1">High Score</div>
    <div class="font-headline text-xl font-bold text-on-surface">${formatWithCommas(entry.score)}</div>
  `;

  row.append(rankCell, nameCol, mid, scoreCell);
  return row;
}

function buildRow(entry, index) {
  if (index === 0) return buildFeaturedRow(entry, index);
  return buildStandardRow(entry, index);
}

/**
 * Pinta la tabla de ranking dentro de `container` (se vacía y reemplaza su contenido).
 * @param {HTMLElement} container
 * @param {Array<{ name: string, score: number, date?: string }>} scores
 */
export function renderRankingBoard(container, scores) {
  if (!container) {
    console.error("[RankingBoard] container inválido.");
    return;
  }
  clearContainer(container);
  container.className = "ranking-board grid grid-cols-1 gap-4 w-full";

  const grid = document.createElement("div");
  grid.className = "grid grid-cols-1 gap-4";
  grid.appendChild(buildTableHeader());

  if (!scores.length) {
    grid.appendChild(buildEmptyState());
  } else {
    scores.forEach((entry, i) => grid.appendChild(buildRow(entry, i)));
  }

  container.appendChild(grid);
}
