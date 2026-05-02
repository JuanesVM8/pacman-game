const spriteCache = new Map();

function createSprite(src) {
  const img = new Image();
  img.src = src;
  return img;
}

export function getSprite(name) {
  if (!spriteCache.has(name)) {
    spriteCache.set(name, createSprite(`assets/images/${name}`));
  }
  return spriteCache.get(name);
}

export function spriteReady(img) {
  return Boolean(img && img.complete && img.naturalWidth > 0);
}
