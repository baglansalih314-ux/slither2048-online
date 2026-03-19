'use strict';
// ================================================================
// SCORE SYSTEM — Points accumulation, combos, HUD updates
// ================================================================
const ScoreSystem = (() => {
  let score      = 0;
  let comboCount = 0;
  let comboTimer = 0;
  const COMBO_WINDOW = Config.MERGE_CHAIN_WINDOW;

  function reset() {
    score = 0; comboCount = 0; comboTimer = 0;
    updateHUD();
  }

  function add(points, multiplier = 1) {
    score += Math.round(points * multiplier);
    updateHUD();
  }

  function onMerge(value, chain) {
    comboCount = chain + 1;
    comboTimer = COMBO_WINDOW;
    const pts  = Config.SCORE_PER_MERGE * Math.log2(value);
    const mult = 1 + chain * 0.5;
    add(pts, mult);

    if (chain > 0) {
      AudioManager.sfx.comboUp(chain);
      showCombo(comboCount);
    }
    AudioManager.sfx.merge(value);
    if (value >= 64) AudioManager.sfx.bigMerge(value);
  }

  function onPickup(value) {
    add(Config.SCORE_PER_CUBE + value);
    AudioManager.sfx.pickup();
  }

  function onKill() {
    add(Config.SCORE_KILL);
    AudioManager.sfx.killEnemy();
  }

  function showCombo(count) {
    const el = document.getElementById('combo-display');
    if (count >= 2) {
      el.textContent = `🔥 COMBO x${count}`;
      el.classList.add('show');
    }
  }

  function update(dt) {
    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) {
        comboCount = 0;
        document.getElementById('combo-display').classList.remove('show');
      }
    }
  }

  function updateHUD() {
    document.getElementById('hud-score').textContent = score;
  }

  function getScore() { return score; }
  function getCombo() { return comboCount; }

  return { reset, add, onMerge, onPickup, onKill, update, getScore, getCombo };
})();
