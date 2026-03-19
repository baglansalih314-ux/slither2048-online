'use strict';
// ================================================================
// AI SNAKE — Bot-controlled snake driven by BotBrain
// ================================================================
class AISnake extends Snake {
  constructor(scene, x, z, name, personality) {
    super(scene, x, z, Math.random() * Math.PI * 2, 2);
    this.name        = name;
    this.brain       = new BotBrain(personality);
    this._tintOffset = Math.floor(Math.random() * 6);
  }

  update(dt, time, collectibles, playerSnake) {
    const turn = this.brain.think(this, collectibles, playerSnake, dt);
    super.update(dt, time, turn);
    Arena.clamp(this);
  }
}
