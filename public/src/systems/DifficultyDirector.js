'use strict';
// ================================================================
// DIFFICULTY DIRECTOR — Escalates challenge as survival time grows
// ================================================================
const DifficultyDirector = (() => {
  let survivalTime = 0;
  let level        = 0;

  function reset() { survivalTime = 0; level = 0; }

  function update(dt) {
    survivalTime += dt;
    // Award passive survival score
    ScoreSystem.add(Config.SCORE_SURVIVE_TICK * dt);

    const newLevel = Math.floor(survivalTime / Config.DIFFICULTY_SCALE_INTERVAL);
    if (newLevel !== level) {
      level = newLevel;
      EventBus.emit('difficultyUp', { level });
    }
  }

  function getSurvivalTime() { return survivalTime; }
  function getLevel()        { return level; }

  return { reset, update, getSurvivalTime, getLevel };
})();
