'use strict';
// ================================================================
// COLLISION SYSTEM — Pickup checks and snake-vs-snake detection
// ================================================================
const CollisionSystem = (() => {
  const spatialHash = createSpatialHash(Config.SPATIAL_CELL);

  /**
   * Populate the spatial hash with all collectibles and bot body segments.
   * Call once per update tick before any collision queries.
   */
  function buildHash(collectibles, snakes) {
    spatialHash.clear();
    collectibles.forEach(c => {
      if (c.alive) spatialHash.insert({ type: 'cube', obj: c }, c.position.x, c.position.z);
    });
    snakes.forEach(snake => {
      snake.segments.forEach((seg, i) => {
        if (i === 0) return; // skip head
        spatialHash.insert({ type: 'segment', obj: seg, snake }, seg.position.x, seg.position.z);
      });
    });
  }

  /** Returns array of collected cube values */
  function checkPickups(player, scene) {
    const nearby   = spatialHash.query(player.headPosition.x, player.headPosition.z, Config.PICKUP_RADIUS + 2);
    const collected = [];
    nearby.forEach(item => {
      if (item.type !== 'cube' || !item.obj.alive) return;
      const dx = item.obj.position.x - player.headPosition.x;
      const dz = item.obj.position.z - player.headPosition.z;
      if (Math.sqrt(dx * dx + dz * dz) < Config.PICKUP_RADIUS) {
        item.obj.collect(scene);
        collected.push(item.obj.value);
      }
    });
    return collected;
  }

  /**
   * Returns null | { type: 'mutual_death'|'death_by_head'|'kill', bot }
   */
  function checkPlayerVsEnemyHeads(player, bots) {
    for (const bot of bots) {
      if (!bot.alive) continue;
      const dx   = bot.headPosition.x - player.headPosition.x;
      const dz   = bot.headPosition.z - player.headPosition.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < Config.HEAD_HIT_RADIUS * 2.2) {
        const playerMass = player.totalMass;
        const botMass    = bot.totalMass;
        const ratio      = Math.abs(playerMass - botMass) / Math.max(playerMass, botMass);
        if (ratio < 0.2)          return { type: 'mutual_death', bot };
        if (botMass > playerMass) return { type: 'death_by_head', bot };
        return { type: 'kill', bot };
      }
    }
    return null;
  }

  /**
   * Returns null | { type: 'death_by_body'|'destroy_seg', bot, seg, idx }
   */
  function checkPlayerVsBotBodies(player, bots) {
    for (const bot of bots) {
      if (!bot.alive) continue;
      for (let i = 1; i < bot.segments.length; i++) {
        const seg = bot.segments[i];
        const dx  = seg.position.x - player.headPosition.x;
        const dz  = seg.position.z - player.headPosition.z;
        if (Math.sqrt(dx * dx + dz * dz) < Config.BODY_HIT_RADIUS) {
          if (seg.value > player.headPower) {
            return { type: 'death_by_body', bot, seg };
          } else {
            return { type: 'destroy_seg', bot, seg, idx: i };
          }
        }
      }
    }
    return null;
  }

  return { buildHash, checkPickups, checkPlayerVsEnemyHeads, checkPlayerVsBotBodies };
})();
