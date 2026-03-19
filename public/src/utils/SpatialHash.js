'use strict';
// ================================================================
// SPATIAL HASH — Fast broad-phase collision detection grid
// ================================================================

/**
 * Creates a spatial hash for O(1) average proximity queries.
 * @param {number} cellSize - Grid cell size in world units
 */
function createSpatialHash(cellSize) {
  const grid = new Map();

  function key(x, y) {
    return `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
  }

  function insert(obj, x, y) {
    const k = key(x, y);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(obj);
  }

  function query(x, y, radius) {
    const results = [];
    const r  = Math.ceil(radius / cellSize);
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const cell = grid.get(`${cx + dx},${cy + dy}`);
        if (cell) results.push(...cell);
      }
    }
    return results;
  }

  function clear() { grid.clear(); }

  return { insert, query, clear };
}
