'use strict';
// ================================================================
// BOOST SYSTEM — Energy drain / regen and boost state management
// ================================================================
const BoostSystem = (() => {
  let energy   = Config.BOOST_ENERGY_MAX;
  let isActive = false;

  function reset() {
    energy   = Config.BOOST_ENERGY_MAX;
    isActive = false;
    updateBar();
  }

  function update(dt, boostInput, snakeLength) {
    const sizePenalty = Math.max(0.5, 1 - Math.floor(snakeLength / 5) * Config.SPEED_PENALTY_PER_5);

    if (boostInput && energy > 0) {
      isActive = true;
      energy   = Math.max(0, energy - Config.BOOST_DRAIN_RATE * dt);
    } else {
      isActive = (energy > 0) ? boostInput : false;
      energy   = Math.min(Config.BOOST_ENERGY_MAX, energy + Config.BOOST_REGEN_RATE * dt);
    }

    if (energy <= 0) isActive = false;
    updateBar();
    return isActive;
  }

  function updateBar() {
    document.getElementById('boost-fill').style.width =
      (energy / Config.BOOST_ENERGY_MAX * 100) + '%';
    document.getElementById('boost-btn').classList.toggle('disabled', energy <= 5);
  }

  function addEnergy(amount) {
    energy = Math.min(Config.BOOST_ENERGY_MAX, energy + amount);
    updateBar();
  }

  return { reset, update, addEnergy, isActive: () => isActive };
})();
