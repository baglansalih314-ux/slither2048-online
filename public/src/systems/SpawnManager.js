'use strict';
// ================================================================
// SPAWN MANAGER — Collectible cube lifecycle management
// ================================================================
const SpawnManager = (() => {
  let scene        = null;
  let collectibles = [];
  let spawnTimer   = 0;
  const H          = Config.ARENA_HALF - 5;

  function init(sc) {
    scene        = sc;
    collectibles = [];
    spawnTimer   = 0;
  }

  /** Weighted random value using the rarity table */
  function getWeightedValue() {
    const table = Config.RARITY_TABLE;
    const total = table.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [v, w] of table) {
      r -= w;
      if (r <= 0) return v;
    }
    return 2;
  }

  function spawnOne(x, z) {
    const value = getWeightedValue();
    const cube  = new CollectibleCube(
      scene,
      value,
      x ?? (Math.random() * H * 2 - H),
      z ?? (Math.random() * H * 2 - H)
    );
    collectibles.push(cube);
    return cube;
  }

  function update(dt, playerPos) {
    spawnTimer -= dt;
    if (spawnTimer <= 0 && collectibles.filter(c => c.alive).length < Config.MAX_COLLECTIBLES) {
      spawnTimer = Config.SPAWN_INTERVAL;
      // Try to avoid spawning too close to the player
      let x, z, tries = 0;
      do {
        x = Math.random() * H * 2 - H;
        z = Math.random() * H * 2 - H;
        tries++;
      } while (tries < 10 && playerPos &&
        Math.sqrt((x - playerPos.x) ** 2 + (z - playerPos.z) ** 2) < 8);
      spawnOne(x, z);
    }

    const time = performance.now() / 1000;
    collectibles.forEach(c => { if (c.alive) c.update(dt, time); });
  }

  /** Spawn loots from a dying snake: array of { value, x, z } */
  function spawnLoot(loots) {
    loots.forEach(l => spawnOne(l.x, l.z));
  }

  function getAlive() {
    return collectibles.filter(c => c.alive);
  }

  function cleanup() {
    collectibles.forEach(c => { if (c.alive) c.collect(scene); });
    collectibles = [];
  }

  return { init, update, spawnLoot, getAlive, cleanup };
})();
