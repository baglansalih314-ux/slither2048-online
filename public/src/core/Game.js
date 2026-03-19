'use strict';
// ================================================================
// GAME — Multiplayer orkestratör
// ================================================================
const Game = (() => {
  let running  = false;
  let scene, camera, renderer;
  let player   = null;
  let remotes  = {};
  let collectibles = {};
  let lastTime = 0;
  let lastInputTime = 0; // Ağ trafiğini sınırlandırmak için eklendi
  let myName   = '';
  let alive    = false;
  let localScore  = 0;
  let localEnergy = 100;

  function init() {
    const r = Renderer.init();
    scene    = r.scene;
    camera   = r.camera;
    renderer = r.renderer;

    CameraController.init(camera);
    Arena.init(scene);
    UIController.init();

    const serverUrl = window.location.origin;
    NetworkManager.connect(serverUrl);

    _bindNetworkEvents();
    requestAnimationFrame(_renderLoop);

    checkOrientation();
    window.addEventListener('orientationchange', checkOrientation);
    window.addEventListener('resize', checkOrientation);

    return { scene, camera, renderer };
  }

  function checkOrientation() {
    const warn = document.getElementById('orientation-warning');
    if (!warn) return;
    warn.style.display = (window.innerHeight > window.innerWidth && window.innerWidth < 500) ? 'flex' : 'none';
  }

  function _bindNetworkEvents() {
    EventBus.on('net:connected', () => {
      const el = document.getElementById('online-count');
      if (el) el.innerHTML = '<span class="online-dot"></span>Bağlandı!';
    });

    EventBus.on('net:disconnected', () => {
      const el = document.getElementById('online-count');
      if (el) el.innerHTML = '<span class="online-dot" style="background:#ff4757"></span>Bağlantı kesildi…';
    });

    EventBus.on('net:init', (data) => {
      Object.values(collectibles).forEach(c => c.collect(scene));
      collectibles = {};
      data.collectibles.forEach(c => _spawnCollectible(c));
      Leaderboard.update(data.leaderboard || []);

      alive = true;
      running = true;
      localScore  = 0;
      BoostSystem.reset();

      if (player) { player.destroy(); player = null; }
      player = new PlayerSnake(scene);

      StateMachine.show('gameplay');
      AudioManager.startMusic();
    });

    EventBus.on('net:tick', (snapshot) => {
      const myId = NetworkManager.getMyId();
      const count = snapshot.players.length;
      const onlineEl = document.getElementById('online-hud');
      if (onlineEl) onlineEl.textContent = '🌐 ' + count + ' online';

      const activeIds = new Set();
      snapshot.players.forEach(pd => {
        if (pd.id === myId) {
          localScore = pd.score;
          document.getElementById('hud-score').textContent = localScore;
          if (pd.segments && pd.segments.length) {
            document.getElementById('hud-tile').textContent =
              pd.segments.reduce((m, s) => Math.max(m, s.value), 2);
          }
          // Local player SERVER SYNC
          if (player && player.alive && pd.segments) {
            // Initial snap to prevent flying from 0,0
            if (player.headPosition.x === 0 && player.headPosition.z === 0) {
              player.headPosition.x = pd.x;
              player.headPosition.z = pd.z;
              player.angle = pd.angle;
              player.trail = [];
              for(let i=0; i<200; i++) player.trail.push(new THREE.Vector3(pd.x, 0, pd.z - i * 0.1));
              player.segments.forEach(seg => seg.position.set(pd.x, 0, pd.z));
            }

            // Store server targets for gentle drift correction (Reconciliation)
            player.serverX = pd.x;
            player.serverZ = pd.z;
            player.serverAngle = pd.angle;

            // Sync segment count: add missing, remove extra
            while (player.segments.length < pd.segments.length) {
              player.addTailSegment(pd.segments[player.segments.length].value);
            }
            while (player.segments.length > pd.segments.length && pd.segments.length > 0) {
              const removed = player.segments.pop();
              removed.removeFromScene(player.scene);
            }

            // Sync segment values ONLY (positions are entirely predicted locally!)
            pd.segments.forEach((sd, i) => {
              const seg = player.segments[i];
              if (!seg) return;
              if (seg.value !== sd.value) seg.setValue(sd.value);
            });
          }

          return;
        }
        activeIds.add(pd.id);
        if (!remotes[pd.id]) remotes[pd.id] = new RemoteSnake(scene, pd);
        remotes[pd.id].onServerTick(pd);
      });

      Object.keys(remotes).forEach(id => {
        if (!activeIds.has(id)) { remotes[id].destroy(); delete remotes[id]; }
      });
    });

    EventBus.on('net:collectible_spawned', (c) => {
      if (!collectibles[c.id]) _spawnCollectible(c);
    });

    EventBus.on('net:collectible_removed', (id) => {
      if (collectibles[id]) { collectibles[id].collect(scene); delete collectibles[id]; }
    });

    EventBus.on('net:pickup', (data) => {
      AudioManager.sfx.pickup();
      if (data.merges > 0) {
        VFX.mergeFlash();
        AudioManager.sfx.merge(data.value * 2);
        CameraController.shake(0.3);
      }
      if (player) {
         player.swallowRipples.push({ progress: 0 }); // Yutkunma animasyonu
         player.addTailSegment(data.value);
      }
    });

    EventBus.on('net:you_died', (data) => {
      alive = false; running = false;
      AudioManager.stopMusic();
      CameraController.shake(2.5);
      VFX.hitFlash();
      if (player) { player.destroy(); player = null; }
      setTimeout(() => UIController.showGameOver(data.score, data.maxTile, data.killer), 800);
    });


    EventBus.on('net:leaderboard', (data) => {
      Leaderboard.update(data);
    });
  }

  function start(name) {
    myName = name || 'Anonymous';
    Leaderboard.init(NetworkManager.getMyId(), myName);
    NetworkManager.join(myName);
  }

  function respawn() {
    NetworkManager.respawn(myName);
  }

  function stop() {
    running = false; alive = false;
    if (player) { player.destroy(); player = null; }
    Object.values(remotes).forEach(r => r.destroy());
    remotes = {};
    Object.values(collectibles).forEach(c => c.collect(scene));
    collectibles = {};
    AudioManager.stopMusic();
  }

  function _spawnCollectible(c) {
    collectibles[c.id] = new CollectibleCube(scene, c.value, c.x, c.z);
    collectibles[c.id]._serverId = c.id;
  }

  function _renderLoop(timestamp) {
    requestAnimationFrame(_renderLoop);
    let dt = (timestamp - lastTime) / 1000;
    if (dt <= 0) return;
    dt = Math.min(dt, 0.05); // Sabit maksimum delta
    lastTime = timestamp;
    
    // Yılan ve kamera hareketini tam animasyon karesinde çalıştır (variable timestep)
    _update(dt, timestamp / 1000);
    if (running || !window.OfflineGameActive) Renderer.render();
  }

  function _update(dt, time) {
    Object.values(collectibles).forEach(c => { if (c.alive) c.update(dt, time); });
    if (!running || !alive) return;

    const input = InputManager.getInput();

    if (player && player.alive) {
      // 1. Tolerance-based Reconciliation (Tolerans/Deadzone Eşitlemesi)
      if (player.serverX !== undefined) {
         let f = Math.min(dt * 60, 2.0);
         
         // Pozisyon Toleransı (İnternet/Ping dalgalanmalarına karşı yumuşatma)
         const dx = player.serverX - player.headPosition.x;
         const dz = player.serverZ - player.headPosition.z;
         const dist = Math.hypot(dx, dz);
         
         // 1.5 birim çapa kadar olan server-istemci farklarını KABUL ET, dokunma (Tolere)
         if (dist > 4.0) {
             // Eğer 4 birimden fazla koptuysa, büyük bir lag veya hata vardır, sertçe çek (0.25)
             player.headPosition.x += dx * 0.25 * f;
             player.headPosition.z += dz * 0.25 * f;
         } else if (dist > 1.5) {
             // 1.5 - 4 aralığında kaydıysa, yavaşça rotaya dokunarak sokkuştur (0.04)
             player.headPosition.x += dx * 0.04 * f;
             player.headPosition.z += dz * 0.04 * f;
         }
         // NOT: Açı eşitlemesi kasıtlı olarak kaldırıldı.
         // Sunucu açısı ağ gecikmesi nedeniyle inputu her zaman doğru yansıtmaz.
         // Yılanın dönüşü tamamen oyuncu inputuna bırakılmıştır.
      }

      // 2. Client Side Prediction! Runs at native 60fps/144fps perfectly!
      // This automatically moves the head, writes the trail, and spaces ALL tail segments flawlessly.
      player.update(dt, time);
      
      // Saniyede 144 mesaj gönderip sunucuyu ve ağı kilitlememesi için 30Hz Rate Limiting
      if (time - lastInputTime > 0.033) {
         NetworkManager.sendInput(input.x, input.y, player.isBoosting);
         lastInputTime = time;
      }

      CameraController.update(dt, player.headPosition, player.isBoosting);
    } else {
      if (time - lastInputTime > 0.033) {
         NetworkManager.sendInput(input.x, input.y, false);
         lastInputTime = time;
      }
    }

    Object.values(remotes).forEach(r => r.update(dt, camera));
    VFX.update(dt);
  }

  function getMyName() { return myName; }
  return { init, start, stop, respawn, getMyName, checkOrientation };
})();
