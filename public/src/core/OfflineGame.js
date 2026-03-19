'use strict';
// ================================================================
// OFFLINE GAME — Self-contained local game with AI bots
// ================================================================
const OfflineGame = (() => {
  let running  = false;
  let scene, camera, renderer;
  let player   = null;
  let bots     = [];
  let lastTime = 0;
  let myName   = '';

  const BOT_PERSONALITIES = ['greedy','coward','hunter','balanced','opportunist'];

  function init() {
    const r = Renderer.init();
    scene    = r.scene;
    camera   = r.camera;
    renderer = r.renderer;
    CameraController.init(camera);
    Arena.init(scene);
    UIController.init(true); // true = offline mode
    requestAnimationFrame(_renderLoop);
    checkOrientation();
    window.addEventListener('orientationchange', checkOrientation);
    window.addEventListener('resize', checkOrientation);
  }

  function checkOrientation() {
    const warn = document.getElementById('orientation-warning');
    if (!warn) return;
    warn.style.display = (window.innerHeight > window.innerWidth && window.innerWidth < 500) ? 'flex' : 'none';
  }

  function start(name) {
    myName = name || 'Anonymous';
    _startRound();
  }

  function _startRound() {
    running = true;
    lastTime = 0;

    BoostSystem.reset();
    SpawnManager.init(scene);

    // Seed initial cubes
    for (let i = 0; i < 40; i++) SpawnManager.spawnOne ? SpawnManager.spawnOne() : null;

    // Create player
    if (player) { player.destroy(); player = null; }
    player = new PlayerSnake(scene);

    // Create bots
    bots.forEach(b => b.destroy());
    bots = [];
    const count = Config.BOT_COUNT || 5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r     = 15 + Math.random() * 25;
      const bot   = new AISnake(
        scene,
        Math.cos(angle) * r,
        Math.sin(angle) * r,
        Config.BOT_NAMES[i % Config.BOT_NAMES.length],
        BOT_PERSONALITIES[i % BOT_PERSONALITIES.length]
      );
      bots.push(bot);
    }

    // Update online count UI
    const el = document.getElementById('online-count');
    if (el) el.innerHTML = '<span class="online-dot" style="background:#9b59b6"></span>Çevrimdışı · ' + (count + 1) + ' oyuncu';

    StateMachine.show('gameplay');
    AudioManager.startMusic();
  }

  function respawn() {
    if (player) { player.destroy(); player = null; }
    player = new PlayerSnake(scene);
    running = true;

    // Respawn dead bots
    bots = bots.filter(b => b.alive);
    while (bots.length < (Config.BOT_COUNT || 5)) {
      const angle = Math.random() * Math.PI * 2;
      const r     = 15 + Math.random() * 25;
      const idx   = bots.length;
      bots.push(new AISnake(
        scene,
        Math.cos(angle) * r,
        Math.sin(angle) * r,
        Config.BOT_NAMES[idx % Config.BOT_NAMES.length],
        BOT_PERSONALITIES[idx % BOT_PERSONALITIES.length]
      ));
    }

    StateMachine.show('gameplay');
  }

  function stop() {
    running = false;
    if (player) { player.destroy(); player = null; }
    bots.forEach(b => b.destroy());
    bots = [];
    SpawnManager.cleanup();
    AudioManager.stopMusic();
  }

  function _renderLoop(timestamp) {
    requestAnimationFrame(_renderLoop);
    let dt = (timestamp - lastTime) / 1000;
    if (lastTime === 0 || dt <= 0 || dt > 0.1) { lastTime = timestamp; return; }
    lastTime = timestamp;
    _update(dt, timestamp / 1000);
    Renderer.render();
  }

  function _update(dt, time) {
    const collectibles = SpawnManager.getAlive();
    SpawnManager.update(dt, player ? player.headPosition : null);

    if (!running || !player || !player.alive) return;

    const input = InputManager.getInput();

    // ── Player update ────────────────────────────────────────────
    player.isBoosting = BoostSystem.update(dt, input.boost, player.length);
    player.update(dt, time, { x: input.x, y: input.y });
    Arena.clamp(player);

    // ── Build spatial hash ───────────────────────────────────────
    CollisionSystem.buildHash(collectibles, bots.filter(b => b.alive));

    // ── Player pickups ───────────────────────────────────────────
    const picked = CollisionSystem.checkPickups(player, scene);
    for (const val of picked) {
      player.swallowRipples.push({ progress: 0 });
      player.addTailSegment(val);
      ScoreSystem.add(Config.SCORE_PER_CUBE + val);
      AudioManager.sfx.pickup();
      if (player.segments.length > 1) { VFX.mergeFlash(); }
    }

    document.getElementById('hud-score').textContent = Math.floor(ScoreSystem.getScore());
    document.getElementById('hud-tile').textContent  = player.maxTile;
    document.getElementById('online-hud').textContent = '🤖 ' + bots.filter(b => b.alive).length + ' bot';

    // ── Player vs enemy head ─────────────────────────────────────
    const headResult = CollisionSystem.checkPlayerVsEnemyHeads(player, bots.filter(b => b.alive));
    if (headResult) {
      _handleHeadCollision(headResult);
      return;
    }

    // ── Player vs bot body ───────────────────────────────────────
    if (player.alive) {
      const bodyResult = CollisionSystem.checkPlayerVsBotBodies(player, bots.filter(b => b.alive));
      if (bodyResult) {
        if (bodyResult.type === 'death_by_body') {
          _killPlayer(bodyResult.bot.name);
          return;
        }
      }
    }

    // ── Update bots ──────────────────────────────────────────────
    bots.forEach(bot => {
      if (!bot.alive) return;
      bot.update(dt, time, collectibles, player);

      // Bot pickups
      const botPicked = CollisionSystem.checkPickups(bot, scene);
      for (const val of botPicked) {
        bot.addTailSegment(val);
      }
    });

    // ── Respawn dead bots over time ──────────────────────────────
    const aliveBots = bots.filter(b => b.alive).length;
    if (aliveBots < (Config.BOT_COUNT || 5) && Math.random() < dt * 0.3) {
      const angle = Math.random() * Math.PI * 2;
      const r     = 30 + Math.random() * 20;
      const idx   = bots.length % Config.BOT_NAMES.length;
      bots.push(new AISnake(
        scene,
        Math.cos(angle) * r,
        Math.sin(angle) * r,
        Config.BOT_NAMES[idx],
        BOT_PERSONALITIES[Math.floor(Math.random() * BOT_PERSONALITIES.length)]
      ));
    }

    CameraController.update(dt, player.headPosition, player.isBoosting);
    VFX.update(dt);
  }

  function _handleHeadCollision(result) {
    if (result.type === 'mutual_death') {
      SpawnManager.spawnLoot(result.bot.die(scene));
      _killPlayer(result.bot.name);
    } else if (result.type === 'death_by_head') {
      _killPlayer(result.bot.name);
    } else if (result.type === 'kill') {
      SpawnManager.spawnLoot(result.bot.die(scene));
      ScoreSystem.add(Config.SCORE_KILL);
    }
  }

  function _killPlayer(killerName) {
    running = false;
    if (player) {
      SpawnManager.spawnLoot(player.die(scene));
      player = null;
    }
    AudioManager.stopMusic();
    CameraController.shake(2.5);
    const score = Math.floor(ScoreSystem.getScore());
    ScoreSystem.reset();
    setTimeout(() => UIController.showGameOver(score, 0, killerName), 800);
  }

  function getMyName() { return myName; }
  return { init, start, stop, respawn, getMyName, checkOrientation };
})();
