'use strict';
// ================================================================
// CONFIG — All tunable game parameters in one place
// ================================================================
const Config = {
  // Arena
  ARENA_HALF: 80,
  GRID_DIVISIONS: 40,

  // Snake
  SNAKE_SPEED_BASE: 14,
  SNAKE_SPEED_BOOST: 26,
  SNAKE_TURN_SPEED: 4.5,
  SEGMENT_SPACING: 1.5,
  SEGMENT_SIZE: 1.1,
  HEAD_SIZE: 1.25,

  // Boost
  BOOST_ENERGY_MAX: 100,
  BOOST_DRAIN_RATE: 35,
  BOOST_REGEN_RATE: 18,

  // Merge
  MERGE_CHAIN_WINDOW: 0.8,

  // Collectibles
  CUBE_SIZE: 0.95,
  MAX_COLLECTIBLES: 60,
  SPAWN_INTERVAL: 1.2,
  RARITY_TABLE: [
    [2, 50], [4, 25], [8, 12], [16, 7], [32, 4], [64, 2]
  ],

  // Bots
  BOT_COUNT: 5,
  BOT_NAMES: ['Rexar','Zyla','Nova','Dusk','Viper','Orion','Kira','Blaze'],

  // Camera
  CAM_HEIGHT: 16,
  CAM_DISTANCE: 4,
  CAM_LERP: 0.10,
  CAM_FOV: 62,

  // Collision
  PICKUP_RADIUS: 2.4,
  BODY_HIT_RADIUS: 0.9,
  HEAD_HIT_RADIUS: 0.7,

  // Scoring
  SCORE_PER_CUBE: 10,
  SCORE_PER_MERGE: 50,
  SCORE_KILL: 200,
  SCORE_SURVIVE_TICK: 1,

  // Difficulty
  DIFFICULTY_SCALE_INTERVAL: 30,

  // Spatial hash
  SPATIAL_CELL: 8,

  // Speed penalty formula
  SPEED_PENALTY_PER_5: 0.05,
};
