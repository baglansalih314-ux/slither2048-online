'use strict';
// ================================================================
// PLAYER SNAKE — Human-controlled snake; reads from InputManager
// ================================================================
class PlayerSnake extends Snake {
  constructor(scene) {
    super(scene, 0, 0, 0);
  }

  update(dt, time) {
    const input      = InputManager.getInput();
    this.isBoosting  = BoostSystem.update(dt, input.boost, this.length);
    // Map joystick XY → world XZ turn direction
    super.update(dt, time, { x: input.x, y: input.y });
    Arena.clamp(this);
    document.getElementById('hud-tile').textContent = this.maxTile;
  }
}
