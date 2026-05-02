/**
 * Ghost.js — Fantasmas con movimiento aleatorio válido y estados simples.
 *
 * En cada “cruce” (alineado al centro de casilla), elegimos una dirección aleatoria
 * entre las que no chocan con muro. Opcionalmente evitamos dar media vuelta para que
 * el patrón sea menos “temblando”.
 */

import { isWall, TILE, cols, rows } from "./Map.js";
import { getSprite, spriteReady } from "./Sprites.js";
import GeneradorMixto from "../lib/randomLib.js";

const gen = new GeneradorMixto();

const RADIUS = 0.35;
export let GHOST_SPEED = 3.1;

export function setGhostSpeed(speed) {
  GHOST_SPEED = speed;
}

const GHOST_BASE_SPRITES = Object.freeze([
  "GhostTemplate1.png",
  "GhostTemplate2.png",
]);
const EYE_BY_DIRECTION = Object.freeze({
  "1,0": "GhostEyesRight.png",
  "-1,0": "GhostEyesLeft.png",
  "0,1": "GhostEyesDown.png",
  "0,-1": "GhostEyesUp.png",
});

function allDirections() {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
}

function boxCorners(x, y) {
  const r = RADIUS;
  return [
    [x - r, y - r],
    [x + r, y - r],
    [x - r, y + r],
    [x + r, y + r],
  ];
}

function canPlace(grid, x, y) {
  for (const [cx, cy] of boxCorners(x, y)) {
    const gx = Math.floor(cx);
    const gy = Math.floor(cy);
    if (isWall(grid, gx, gy)) return false;
  }
  return true;
}

function isAlignedToGrid(x, y) {
  const ax = Math.abs(x - 0.5 - Math.floor(x)) < 0.08;
  const ay = Math.abs(y - 0.5 - Math.floor(y)) < 0.08;
  return ax && ay;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = gen.numeroEntero(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandomDirection(grid, ghost) {
  const opts = [];
  for (const [dx, dy] of shuffle(allDirections())) {
    if (dx === -ghost.dirX && dy === -ghost.dirY) continue;
    const tx = ghost.x + dx * 0.2;
    const ty = ghost.y + dy * 0.2;
    if (canPlace(grid, tx, ty)) opts.push([dx, dy]);
  }
  if (opts.length === 0) {
    ghost.dirX = -ghost.dirX;
    ghost.dirY = -ghost.dirY;
    return;
  }
  const choice = opts[gen.numeroEntero(0, opts.length - 1)];
  ghost.dirX = choice[0];
  ghost.dirY = choice[1];
}

function wrapTunnel(x) {
  if (x < -0.5) return x + cols();
  if (x > cols() - 0.5) return x - cols();
  return x;
}

/** Direcciones cardinales desde (gx, gy) que no chocan con muro (para salir del bloque inicial). */
function validExitDirections(grid, gx, gy) {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const out = [];
  for (const [dx, dy] of dirs) {
    if (!isWall(grid, gx + dx, gy + dy)) {
      out.push([dx, dy]);
    }
  }
  return out;
}

function pickRandomInitialDirection(grid, gx, gy) {
  const opts = validExitDirections(grid, gx, gy);
  if (opts.length === 0) {
    console.warn("[Ghost] Sin salidas válidas en spawn", gx, gy);
    return [1, 0];
  }
  return opts[gen.numeroEntero(0, opts.length - 1)];
}

export const GhostState = Object.freeze({
  CHASE: "chase",
  FRIGHTENED: "frightened",
  EATEN: "eaten",
});

const tintCanvas = document.createElement("canvas");
const tintCtx = tintCanvas.getContext("2d");

function getTintedSprite(img, color) {
  if (tintCanvas.width !== img.naturalWidth) tintCanvas.width = img.naturalWidth;
  if (tintCanvas.height !== img.naturalHeight) tintCanvas.height = img.naturalHeight;
  tintCtx.clearRect(0, 0, tintCanvas.width, tintCanvas.height);
  tintCtx.drawImage(img, 0, 0);
  tintCtx.globalCompositeOperation = "source-in";
  tintCtx.fillStyle = color;
  tintCtx.fillRect(0, 0, tintCanvas.width, tintCanvas.height);
  tintCtx.globalCompositeOperation = "source-over"; // Reset
  return tintCanvas;
}

export class Ghost {
  /**
   * @param {number} startX celda columna
   * @param {number} startY celda fila
   * @param {string} color
   * @param {number[][]|null} grid mapa actual; si existe, elige dirección inicial aleatoria entre celdas vecinas transitables
   */
  constructor(startX, startY, color, grid = null) {
    this.startX = startX + 0.5;
    this.startY = startY + 0.5;
    this.x = this.startX;
    this.y = this.startY;
    this.color = color;
    this.baseSprite =
      GHOST_BASE_SPRITES[gen.numeroEntero(0, GHOST_BASE_SPRITES.length - 1)];
    this.state = GhostState.CHASE;
    if (grid) {
      const d = pickRandomInitialDirection(grid, startX, startY);
      this.dirX = d[0];
      this.dirY = d[1];
    } else {
      this.dirX = 1;
      this.dirY = 0;
    }
  }

  update(grid, dt) {
    if (this.state === GhostState.EATEN) return;
    if (isAlignedToGrid(this.x, this.y)) {
      pickRandomDirection(grid, this);
    }
    const step = GHOST_SPEED * dt;
    const nx = this.x + this.dirX * step;
    const ny = this.y + this.dirY * step;
    if (canPlace(grid, nx, this.y)) this.x = nx;
    if (canPlace(grid, this.x, ny)) this.y = ny;
    this.x = wrapTunnel(this.x);
  }

  draw(ctx) {
    const px = this.x * TILE;
    const py = this.y * TILE;
    const size = TILE * 0.92;
    const ox = px - size / 2;
    const oy = py - size / 2;

    const eyes = getSprite(
      EYE_BY_DIRECTION[`${this.dirX},${this.dirY}`] ?? "GhostEyesRight.png",
    );

    if (this.state === GhostState.EATEN) {
      if (spriteReady(eyes)) {
        ctx.drawImage(eyes, ox, oy, size, size);
      }
      return;
    }

    const bodyName =
      this.state === GhostState.FRIGHTENED
        ? Math.floor(performance.now() / 180) % 2 === 0
          ? "Blinking.png"
          : "Frightened1.png"
        : this.baseSprite;
    const body = getSprite(bodyName);
    
    if (spriteReady(body)) {
      if (this.state !== GhostState.FRIGHTENED) {
        ctx.drawImage(getTintedSprite(body, this.color), ox, oy, size, size);
      } else {
        ctx.drawImage(body, ox, oy, size, size);
      }
      
      if (spriteReady(eyes) && this.state !== GhostState.FRIGHTENED) {
        ctx.drawImage(eyes, ox, oy, size, size);
      }
      return;
    }
    const fallback =
      this.state === GhostState.FRIGHTENED ? "#3b82f6" : this.color;
    ctx.fillStyle = fallback;
    ctx.beginPath();
    ctx.arc(px, py - 2, TILE * 0.38, Math.PI, 0);
    ctx.lineTo(px + TILE * 0.35, py + TILE * 0.25);
    ctx.lineTo(px - TILE * 0.35, py + TILE * 0.25);
    ctx.fill();
  }
}
