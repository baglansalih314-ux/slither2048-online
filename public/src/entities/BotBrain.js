'use strict';
// ================================================================
// BOT BRAIN — AI decision logic with personality-driven behaviour
// ================================================================
class BotBrain {
  /**
   * @param {'greedy'|'coward'|'hunter'|'balanced'|'opportunist'} personality
   */
  constructor(personality = 'balanced') {
    this.personality  = personality;
    this.targetPos    = null;
    this.stateTimer   = 0;
    this.state        = 'wander';
    this.wanderAngle  = Math.random() * Math.PI * 2;
  }

  /**
   * Returns a normalised turn-input vector { x, y } for the owning bot.
   * @param {AISnake}           bot
   * @param {CollectibleCube[]} collectibles
   * @param {PlayerSnake|null}  playerSnake
   * @param {number}            dt
   */
  think(bot, collectibles, playerSnake, dt) {
    this.stateTimer -= dt;

    const px = bot.headPosition.x;
    const pz = bot.headPosition.z;

    // ── Find nearest collectible ───────────────────────────────
    let nearestCube = null, nearestDist = 99999;
    collectibles.forEach(c => {
      if (!c.alive) return;
      const dx = c.position.x - px;
      const dz = c.position.z - pz;
      const d  = Math.sqrt(dx * dx + dz * dz);
      if (d < nearestDist) { nearestDist = d; nearestCube = c; }
    });

    // ── Danger assessment ──────────────────────────────────────
    let fleePlayer = false;
    if (playerSnake && playerSnake.alive) {
      const pdx   = playerSnake.headPosition.x - px;
      const pdz   = playerSnake.headPosition.z - pz;
      const pdist = Math.sqrt(pdx * pdx + pdz * pdz);
      if (pdist < 15 && playerSnake.headPower > bot.headPower * 1.5) {
        if (this.personality === 'coward' || this.personality === 'balanced') {
          fleePlayer = true;
        }
      }
    }

    // ── Choose target ──────────────────────────────────────────
    let targetX = px, targetZ = pz;

    if (fleePlayer && playerSnake) {
      const pdx = playerSnake.headPosition.x - px;
      const pdz = playerSnake.headPosition.z - pz;
      targetX = px - pdx * 2;
      targetZ = pz - pdz * 2;
    } else if (nearestCube && nearestDist < 25) {
      targetX = nearestCube.position.x;
      targetZ = nearestCube.position.z;
    } else {
      // Wander with periodic direction change
      if (this.stateTimer <= 0) {
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.stateTimer  = 1.5 + Math.random() * 2;
      }
      targetX = px + Math.cos(this.wanderAngle) * 10;
      targetZ = pz + Math.sin(this.wanderAngle) * 10;
    }

    // ── Boundary avoidance ─────────────────────────────────────
    const limit = Config.ARENA_HALF - 10;
    if (Math.abs(px) > limit || Math.abs(pz) > limit) {
      targetX = 0; targetZ = 0;
    }

    const dx  = targetX - px;
    const dz  = targetZ - pz;
    const mag = Math.sqrt(dx * dx + dz * dz);
    if (mag < 0.01) return { x: 0, y: 0 };
    return { x: dx / mag, y: dz / mag };
  }
}
