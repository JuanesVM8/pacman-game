/**
 * Game.js — Bucle principal (requestAnimationFrame), estados y ensamblaje de módulos.
 *
 * requestAnimationFrame(fn) pide al navegador que ejecute fn antes del siguiente repintado
 * (~60 Hz). Recibimos un timestamp de alta resolución para calcular Δt y animar con
 * velocidad independiente del framerate.
 */

import { createLevel, renderMap, countDots, canvasSize, GHOST_SPAWN_CELLS, loadMapLevel, cols, rows, Tile } from "./Map.js";
import { Player } from "./Player.js";
import { Ghost, GhostState, setGhostSpeed } from "./Ghost.js";
import { loadScores, addScore } from "./Score.js";
import { renderRankingBoard } from "./components/RankingBoard.js";
import { createGameOverScreen } from "./components/GameOverScreen.js";
import { playSfx, playLoop, stopLoop, toggleMute, isMuted } from "./Sound.js";
import { ExtraLife } from "./ExtraLife.js";
import GeneradorMixto from "../lib/randomLib.js";

const State = Object.freeze({
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  DYING: "dying",
  GAMEOVER: "gameover",
  VICTORY: "victory",
});

let canvas;
let ctx;
let grid;
let player;
let ghosts;
let extraLifeItem = null;
let extraLifeSpawnTimer = 0;
const gen = new GeneradorMixto();
let totalScore = 0;
let gameState = State.MENU;
let lastNow = 0;
let munchFlip = false;
let lives = 3;
let dyingTimer = 0;
let gameOverScreen;
let powerTimer = 0;
let currentPowerDuration = 10;

const el = {
  score: null,
  state: null,
  ranking: null,
  form: null,
  name: null,
  highScore: null,
  livesDisplay: null,
};
const runStats = {
  powerUps: 0,
  ghostsEaten: 0,
  levelReached: 1,
};

function bindDom() {
  canvas = document.getElementById("game");
  el.score = document.getElementById("score");
  el.state = document.getElementById("state");
  el.ranking = document.getElementById("ranking");
  el.form = document.getElementById("name-form");
  el.name = document.getElementById("player-name");
  el.highScore = document.getElementById("high-score");
  el.livesDisplay = document.getElementById("lives-display");
  el.levelText = document.getElementById("level-display-text");
  el.levelFiresContainer = document.getElementById("level-fires-container");
  if (!canvas || !el.score || !el.state) {
    console.error("[Game] Faltan nodos del DOM necesarios.");
    return false;
  }
  ctx = canvas.getContext("2d");
  return true;
}

function syncCanvasSize() {
  const { width, height } = canvasSize();
  canvas.width = width;
  canvas.height = height;
}

function labelForState(s) {
  if (s === State.MENU) return "MENU (Espacio: jugar)";
  if (s === State.PLAYING) return "JUGANDO";
  if (s === State.GAMEOVER) return "PARTIDA TERMINADA";
  if (s === State.VICTORY) return "VICTORIA";
  return s;
}

function setHudState() {
  el.state.textContent = labelForState(gameState);
  el.score.textContent = String(totalScore);
  const ready = document.getElementById("game-ready-overlay");
  if (ready) {
    ready.classList.toggle("hidden", gameState !== State.MENU);
  }
  
  if (el.levelText) {
    el.levelText.textContent = `Nivel 0${runStats.levelReached}`;
  }
  
  if (el.levelFiresContainer) {
    const fires = el.levelFiresContainer.querySelectorAll(".level-fire");
    fires.forEach((fire, idx) => {
      if (idx < runStats.levelReached) {
        fire.classList.remove("opacity-20", "text-primary");
        fire.classList.add("text-error");
      } else {
        fire.classList.add("opacity-20", "text-primary");
        fire.classList.remove("text-error");
      }
    });
  }
}

function refreshRankingUi() {
  const scores = loadScores();
  if (el.ranking) {
    renderRankingBoard(el.ranking, scores);
  }
  const best = scores.length ? String(scores[0].score) : "0";
  if (el.highScore) {
    el.highScore.textContent = best;
  }
  const sidebarHigh = document.getElementById("sidebar-high");
  if (sidebarHigh) {
    sidebarHigh.textContent = best;
  }
}

function loadLevel(level) {
  loadMapLevel(level);
  grid = createLevel();
  if (level === 1) {
    currentPowerDuration = 10;
    setGhostSpeed(3.4);
  } else if (level === 2) {
    currentPowerDuration = 7;
    setGhostSpeed(3.7);
  } else {
    currentPowerDuration = 4;
    setGhostSpeed(4.0);
  }
}

function resetMatch() {
  loadLevel(runStats.levelReached);
  lives = 3;
  extraLifeItem = null;
  extraLifeSpawnTimer = 30 + gen.numeroEntero(0, 30);
  resetEntities();
}

/** Solo resetea posiciones, no el mapa/puntos. */
function resetEntities() {
  player = new Player(7, 15);
  const colors = ["#ff0000", "#ffb8ff", "#00ffff", "#ffb852"];
  ghosts = GHOST_SPAWN_CELLS.map((cell, i) => new Ghost(cell[0], cell[1], colors[i], grid));
  powerTimer = 0;
  renderLivesUi();
  if (countDots(grid) === 0) {
    console.warn("[Map] Nivel sin puntos al iniciar; revisa RAW.");
  }
}

function renderLivesUi() {
  if (!el.livesDisplay) return;
  el.livesDisplay.innerHTML = "";
  const totalIcons = Math.max(3, lives);
  for (let i = 0; i < totalIcons; i++) {
    const lifeIcon = document.createElement("div");
    lifeIcon.className = `w-8 h-8 rounded-full pacman-icon ${
      i < lives ? "bg-primary shadow-[0_0_10px_rgba(255,254,172,0.5)]" : "bg-primary/20"
    }`;
    el.livesDisplay.appendChild(lifeIcon);
  }
}

function distanceTiles(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function playerHitGhost() {
  let hitChaseGhost = false;
  for (const g of ghosts) {
    if (distanceTiles(player, g) < 0.65) {
      if (g.state === GhostState.FRIGHTENED) {
        g.state = GhostState.EATEN;
        g.x = g.startX;
        g.y = g.startY;
        runStats.ghostsEaten += 1;
        totalScore += 200;
        playSfx("MUNCH_1");
      } else if (g.state === GhostState.CHASE) {
        hitChaseGhost = true;
      }
    }
  }
  return hitChaseGhost;
}

function applyPlayerScoreBuffer() {
  totalScore += player.consumeScore();
  const events = player.consumeAudioEvents();
  for (const evt of events) {
    if (evt === "POWER") {
      runStats.powerUps += 1;
      stopLoop("SIREN");
      playLoop("POWER", 0.3); // Adjust volume if needed
      powerTimer = currentPowerDuration;
      for (const g of ghosts) {
        if (g.state !== GhostState.EATEN) {
          g.state = GhostState.FRIGHTENED;
        }
      }
      continue;
    }
    if (evt === "MUNCH") {
      playSfx(munchFlip ? "MUNCH_1" : "MUNCH_2");
      munchFlip = !munchFlip;
    }
  }
}

function updateGameOverUi() {
  const pb = loadScores()[0]?.score ?? 0;
  gameOverScreen?.show({
    finalScore: totalScore,
    pbScore: pb,
    levelReached: runStats.levelReached,
    ghostsEaten: runStats.ghostsEaten,
    powerUps: runStats.powerUps,
  });
}

function showGameOverScreen() {
  updateGameOverUi();
}

function hideGameOverScreen() {
  gameOverScreen?.hide();
}

function endRun(nextState) {
  stopLoop("SIREN");
  if (nextState === State.GAMEOVER) {
    playSfx("DEATH");
  }
  if (nextState === State.VICTORY) {
    playSfx("WIN");
  }
  gameState = nextState;
  if (el.form) el.form.hidden = false;
  if (nextState === State.GAMEOVER) {
    showGameOverScreen();
  }
  setHudState();
}

function checkVictoryOrLoss() {
  if (countDots(grid) === 0) {
    if (runStats.levelReached < 3) {
      runStats.levelReached++;
      stopLoop("SIREN");
      playSfx("WIN");
      loadLevel(runStats.levelReached);
      resetEntities();
      playLoop("SIREN", 0.18);
    } else {
      endRun(State.VICTORY);
    }
    return true;
  }
  if (playerHitGhost()) {
    lives--;
    renderLivesUi();
    if (lives > 0) {
      gameState = State.DYING;
      dyingTimer = 1.8; // Segundos de pausa/animacion
      player.isDead = true;
      stopLoop("SIREN");
      playSfx("DEATH");
    } else {
      endRun(State.GAMEOVER);
    }
    return true;
  }
  return false;
}

function spawnExtraLife() {
  const emptyCells = [];
  for (let y = 0; y < rows(); y++) {
    for (let x = 0; x < cols(); x++) {
      if (grid[y][x] === Tile.EMPTY || grid[y][x] === Tile.DOT) {
        emptyCells.push([x, y]);
      }
    }
  }
  if (emptyCells.length > 0) {
    const idx = gen.numeroEntero(0, emptyCells.length - 1);
    const cell = emptyCells[idx];
    extraLifeItem = new ExtraLife(cell[0], cell[1], grid);
  }
}

function updatePlaying(dt) {
  player.update(grid, dt);
  for (const g of ghosts) {
    g.update(grid, dt);
  }
  
  if (!extraLifeItem) {
    if (extraLifeSpawnTimer > 0) {
      extraLifeSpawnTimer -= dt;
      if (extraLifeSpawnTimer <= 0) {
        spawnExtraLife();
      }
    }
  } else {
    const shouldDespawn = extraLifeItem.update(grid, dt);
    if (shouldDespawn) {
      extraLifeItem = null;
      extraLifeSpawnTimer = 30 + gen.numeroEntero(0, 30);
    } else if (distanceTiles(player, extraLifeItem) < 0.8) {
      lives++;
      extraLifeItem = null;
      extraLifeSpawnTimer = 30 + gen.numeroEntero(0, 30);
      playSfx("MUNCH_1");
      renderLivesUi();
    }
  }

  applyPlayerScoreBuffer();
  checkVictoryOrLoss();

  if (powerTimer > 0) {
    powerTimer -= dt;
    if (powerTimer <= 0) {
      stopLoop("POWER");
      playLoop("SIREN", 0.18);
      for (const g of ghosts) {
        g.state = GhostState.CHASE;
      }
    }
  }
}

function update(dt) {
  if (gameState === State.PLAYING) {
    updatePlaying(dt);
  } else if (gameState === State.DYING) {
    dyingTimer -= dt;
    if (dyingTimer <= 0) {
      resetEntities();
      gameState = State.PLAYING;
      playLoop("SIREN", 0.18);
    }
  }
  setHudState();
}

function drawScene() {
  renderMap(ctx, grid);
  for (const g of ghosts) {
    g.draw(ctx);
  }
  if (extraLifeItem) {
    extraLifeItem.draw(ctx);
  }
  player.draw(ctx);
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastNow) / 1000);
  lastNow = now;
  update(dt);
  drawScene();
  requestAnimationFrame(loop);
}

function hideNameForm() {
  if (el.form) el.form.hidden = true;
}

/** Nueva partida (botones UI); el teclado solo inicia desde MENÚ con Espacio. */
function startGameFromMenu() {
  totalScore = 0;
  munchFlip = false;
  runStats.powerUps = 0;
  runStats.ghostsEaten = 0;
  runStats.levelReached = 1;
  resetMatch();
  gameState = State.PLAYING;
  playSfx("START");
  playLoop("SIREN", 0.18);
  hideNameForm();
  hideGameOverScreen();
  setHudState();
}

function resetToMenu() {
  stopLoop("SIREN");
  gameState = State.MENU;
  resetMatch();
  totalScore = 0;
  hideNameForm();
  hideGameOverScreen();
  setHudState();
}

function tryStartRun(e) {
  if (e.code !== "Space" || gameState !== State.MENU) return false;
  e.preventDefault();
  startGameFromMenu();
  return true;
}

function tryResetToMenu(e) {
  if (e.code !== "KeyR") return false;
  e.preventDefault();
  resetToMenu();
  return true;
}

function trySteerPlayer(e) {
  if (gameState !== State.PLAYING) return;
  const keyMap = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    KeyW: [0, -1],
    KeyS: [0, 1],
    KeyA: [-1, 0],
    KeyD: [1, 0],
  };
  const dir = keyMap[e.code];
  if (!dir) return;
  e.preventDefault();
  player.setDirection(dir[0], dir[1]);
}

function tryTogglePause(e) {
  if (e.key !== "Escape") return false;
  e.preventDefault();
  const pauseOverlay = document.getElementById("pause-overlay");
  if (gameState === State.PLAYING) {
    gameState = State.PAUSED;
    pauseOverlay.classList.remove("hidden");
  } else if (gameState === State.PAUSED) {
    gameState = State.PLAYING;
    pauseOverlay.classList.add("hidden");
  }
  return true;
}

function onKeyDown(e) {
  if (tryStartRun(e)) return;
  if (tryResetToMenu(e)) return;
  if (tryTogglePause(e)) return;
  trySteerPlayer(e);
}

function onSubmitName(ev) {
  ev.preventDefault();
  if (!el.form || !el.name) return;
  const name = el.name.value.trim() || "Anonymous";
  addScore(name, totalScore);
  el.name.value = "";
  el.form.hidden = true;
  refreshRankingUi();
}

function attachStartButtons() {
  document.querySelectorAll('[data-action="start-game"]').forEach((btn) => {
    btn.addEventListener("click", () => startGameFromMenu());
  });
}

function attachPauseButtons() {
  const pauseOverlay = document.getElementById("pause-overlay");
  if (!pauseOverlay) return;

  document.getElementById("btn-resume")?.addEventListener("click", () => {
    if (gameState === State.PAUSED) {
      gameState = State.PLAYING;
      pauseOverlay.classList.add("hidden");
    }
  });

  document.getElementById("btn-mute")?.addEventListener("click", () => {
    const muted = toggleMute();
    const muteIcon = document.getElementById("mute-icon");
    const muteText = document.getElementById("mute-text");
    if (muted) {
      muteIcon.textContent = "volume_off";
      muteText.textContent = "SONIDO: OFF";
    } else {
      muteIcon.textContent = "volume_up";
      muteText.textContent = "SONIDO: ON";
    }
  });

  document.getElementById("btn-exit")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

function attachEvents() {
  window.addEventListener("keydown", onKeyDown);
  attachStartButtons();
  attachPauseButtons();
  if (el.form) el.form.addEventListener("submit", onSubmitName);
}

function shouldAutostart() {
  return document.documentElement.dataset.autostartGame === "true";
}

function init() {
  if (!bindDom()) return;
  gameOverScreen = createGameOverScreen({
    onReplay: () => startGameFromMenu(),
    onMenu: () => {
      window.location.href = "index.html";
    },
    onRankings: () => {
      window.location.href = "rankings.html";
    },
  });
  syncCanvasSize();
  resetMatch();
  gameState = State.MENU;
  lastNow = performance.now();
  refreshRankingUi();
  attachEvents();
  drawScene();
  if (shouldAutostart()) {
    startGameFromMenu();
  } else {
    setHudState();
  }
  requestAnimationFrame(loop);
}

init();
