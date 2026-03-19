'use strict';
// ================================================================
// NUMBER TEXTURE CACHE — Canvas-rendered number textures for tiles
// ================================================================
const NumberTextureCache = (() => {
  const cache = {};

  function make(value) {
    if (cache[value]) return cache[value];

    const size   = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const col = TileColors.get(value);

    ctx.clearRect(0, 0, size, size);

    const str = value.toString();
    const fs  = str.length <= 2 ? 64 : str.length <= 4 ? 44 : 34;
    ctx.font          = `900 ${fs}px 'Segoe UI', system-ui, sans-serif`;
    ctx.fillStyle     = col.text;
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'middle';
    ctx.shadowColor   = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur    = 4;
    ctx.fillText(str, size / 2, size / 2);

    const tex = new THREE.CanvasTexture(canvas);
    cache[value] = tex;
    return tex;
  }

  return { get: make };
})();
