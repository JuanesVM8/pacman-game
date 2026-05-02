import { isWall, TILE, cols } from "./Map.js";
import GeneradorMixto from "../lib/randomLib.js";

const gen = new GeneradorMixto();
const RADIUS = 0.35;
const SPEED = 2.0;

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

function pickRandomDirection(grid, entity) {
  const opts = [];
  for (const [dx, dy] of shuffle(allDirections())) {
    if (dx === -entity.dirX && dy === -entity.dirY) continue;
    const tx = entity.x + dx * 0.2;
    const ty = entity.y + dy * 0.2;
    if (canPlace(grid, tx, ty)) opts.push([dx, dy]);
  }
  if (opts.length === 0) {
    entity.dirX = -entity.dirX;
    entity.dirY = -entity.dirY;
    return;
  }
  const choice = opts[gen.numeroEntero(0, opts.length - 1)];
  entity.dirX = choice[0];
  entity.dirY = choice[1];
}

function validExitDirections(grid, gx, gy) {
  const dirs = allDirections();
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
  if (opts.length === 0) return [1, 0];
  return opts[gen.numeroEntero(0, opts.length - 1)];
}

function wrapTunnel(x) {
  if (x < -0.5) return x + cols();
  if (x > cols() - 0.5) return x - cols();
  return x;
}

export class ExtraLife {
  constructor(startX, startY, grid) {
    this.x = startX + 0.5;
    this.y = startY + 0.5;
    this.lifeTime = 10; // 10 segundos de vida
    
    const d = pickRandomInitialDirection(grid, startX, startY);
    this.dirX = d[0];
    this.dirY = d[1];
  }

  update(grid, dt) {
    this.lifeTime -= dt;
    if (this.lifeTime <= 0) return true; // Indica que debe desaparecer

    if (isAlignedToGrid(this.x, this.y)) {
      pickRandomDirection(grid, this);
    }
    const step = SPEED * dt;
    const nx = this.x + this.dirX * step;
    const ny = this.y + this.dirY * step;
    if (canPlace(grid, nx, this.y)) this.x = nx;
    if (canPlace(grid, this.x, ny)) this.y = ny;
    this.x = wrapTunnel(this.x);
    return false;
  }

  draw(ctx) {
    // Parpadeo cuando quedan menos de 3 segundos
    if (this.lifeTime < 3) {
      const blinkRate = this.lifeTime < 1 ? 10 : 5;
      if (Math.floor(this.lifeTime * blinkRate) % 2 === 0) {
        return; // No dibujar este frame para efecto de parpadeo
      }
    }

    const px = this.x * TILE;
    const py = this.y * TILE;
    
    ctx.save();
    ctx.translate(px, py);
    
    // Configuración para el icono de material symbols
    ctx.font = `${TILE * 1.2}px "Material Symbols Outlined"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Sombra neón roja
    ctx.shadowColor = "#ff2a2a";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ff5555";
    
    ctx.fillText("local_fire_department", 0, 0);
    
    ctx.restore();
  }
}
