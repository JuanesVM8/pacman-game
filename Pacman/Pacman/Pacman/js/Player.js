/**
 * Player.js — Pac-Man: movimiento continuo en coordenadas de “casilla” + colisión AABB.
 *
 * Idea: la posición (x,y) está en espacio de casillas (float). El radio es < 0.5 para
 * caber en un pasillo de 1 casilla. Antes de mover, comprobamos si la caja del jugador
 * seguiría siendo válida (sin solaparse con muros).
 */

import { isWall, inBounds, tryEatDot, TILE, cols, rows } from "./Map.js";
import { getSprite, spriteReady } from "./Sprites.js";

const RADIUS = 0.35;
const SPEED = 4.2;
const PLAYER_SPRITES = Object.freeze({
  UP: "pacmanUp.png",
  DOWN: "pacmanUp.png",
  LEFT: "pacmanLeft.png",
  RIGHT: "pacmanLeft.png",
  CLOSED: "pacmanClosed.png",
  DEATH: "deathSprite.png",
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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

function isNearCellCenter(value, tolerance = 0.30) {
  const center = Math.floor(value) + 0.5;
  return Math.abs(value - center) < tolerance;
}

/**
 * ¿Puede el círculo (aproximado por esquinas) ocupar (x,y) en el grid?
 */
function canPlace(grid, x, y) {
  for (const [cx, cy] of boxCorners(x, y)) {
    const gx = Math.floor(cx);
    const gy = Math.floor(cy);
    if (isWall(grid, gx, gy)) return false;
  }
  return true;
}

function wrapTunnel(x, y) {
  let nx = x;
  if (nx < -0.5) nx += cols();
  if (nx > cols() - 0.5) nx -= cols();
  return { x: nx, y: y };
}

export class Player {
  constructor(startX, startY) {
    this.x = startX + 0.5;
    this.y = startY + 0.5;
    this.dirX = 0;
    this.dirY = 0;
    this.nextDirX = 0;
    this.nextDirY = 0;
    this.scoreBuffer = 0;
    this.audioEvents = [];
    this.isDead = false;
  }

  setDirection(dx, dy) {
    this.nextDirX = dx;
    this.nextDirY = dy;
  }

  tryApplyQueuedTurn(grid) {
    const tdx = this.nextDirX;
    const tdy = this.nextDirY;
    if (tdx === 0 && tdy === 0) return;
    if (tdx !== 0 && !isNearCellCenter(this.y)) return;
    if (tdy !== 0 && !isNearCellCenter(this.x)) return;
    if (tdx !== 0) this.y = Math.round(this.y - 0.5) + 0.5;
    if (tdy !== 0) this.x = Math.round(this.x - 0.5) + 0.5;
    const tx = this.x + tdx * 0.2;
    const ty = this.y + tdy * 0.2;
    if (canPlace(grid, tx, ty)) {
      this.dirX = tdx;
      this.dirY = tdy;
    }
  }

  moveAxis(grid, dt, axis) {
    const step = SPEED * dt;
    if (axis === "x") {
      const nx = this.x + this.dirX * step;
      if (canPlace(grid, nx, this.y)) this.x = nx;
      else {
        // Evita "rebote" contra muro y centra el personaje en la celda
        // para facilitar giros perpendiculares.
        if (this.dirX !== 0) this.snapAxis("x");
        this.dirX = 0;
      }
    } else {
      const ny = this.y + this.dirY * step;
      if (canPlace(grid, this.x, ny)) this.y = ny;
      else {
        if (this.dirY !== 0) this.snapAxis("y");
        this.dirY = 0;
      }
    }
  }

  snapAxis(axis) {
    if (axis === "x") this.x = Math.round(this.x - 0.5) + 0.5;
    if (axis === "y") this.y = Math.round(this.y - 0.5) + 0.5;
  }

  collectDots(grid) {
    const gx = Math.floor(this.x);
    const gy = Math.floor(this.y);
    const gained = tryEatDot(grid, gx, gy);
    this.scoreBuffer += gained;
    if (gained === 10) this.audioEvents.push("MUNCH");
    if (gained === 50) this.audioEvents.push("POWER");
  }

  update(grid, dt) {
    this.tryApplyQueuedTurn(grid);
    this.moveAxis(grid, dt, "x");
    this.moveAxis(grid, dt, "y");
    const w = wrapTunnel(this.x, this.y);
    this.x = w.x;
    this.y = w.y;
    this.collectDots(grid);
  }

  draw(ctx) {
    const px = this.x * TILE;
    const py = this.y * TILE;

    if (this.isDead) {
      const sprite = getSprite(PLAYER_SPRITES.DEATH);
      const size = TILE * 1.2; // Un poco mas grande para el efecto
      if (spriteReady(sprite)) {
        ctx.drawImage(sprite, px - size / 2, py - size / 2, size, size);
        return;
      }
    }
    
    let spriteName = PLAYER_SPRITES.CLOSED;
    let flipX = false;
    let flipY = false;

    if (this.dirY < 0) {
      spriteName = PLAYER_SPRITES.UP;
    } else if (this.dirY > 0) {
      spriteName = PLAYER_SPRITES.DOWN;
      flipY = true;
    } else if (this.dirX < 0) {
      spriteName = PLAYER_SPRITES.LEFT;
    } else if (this.dirX > 0) {
      spriteName = PLAYER_SPRITES.RIGHT;
      flipX = true;
    }

    const sprite = getSprite(spriteName);
    const size = TILE * 0.86;
    const ox = px - size / 2;
    const oy = py - size / 2;

    if (spriteReady(sprite)) {
      if (flipX || flipY) {
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        ctx.restore();
      } else {
        ctx.drawImage(sprite, ox, oy, size, size);
      }
      return;
    }

    ctx.fillStyle = "#f0d030";
    ctx.beginPath();
    ctx.arc(px, py, TILE * 0.36, 0, Math.PI * 2);
    ctx.fill();
  }

  gridCell() {
    return { gx: Math.floor(this.x), gy: Math.floor(this.y) };
  }

  consumeScore() {
    const s = this.scoreBuffer;
    this.scoreBuffer = 0;
    return s;
  }

  consumeAudioEvents() {
    const pending = this.audioEvents;
    this.audioEvents = [];
    return pending;
  }
}
