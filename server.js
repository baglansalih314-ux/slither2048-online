'use strict';
const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const path      = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] },
  pingTimeout: 10000,
  pingInterval: 5000,
});

app.use(express.static(path.join(__dirname, 'public')));

// ================================================================
// GAME CONFIG (must mirror client Config.js values)
// ================================================================
const ARENA_HALF      = 80;
const TICK_RATE       = 30;          // server ticks per second
const TICK_MS         = 1000 / TICK_RATE;
const SNAKE_SPEED     = 14;
const SNAKE_SPEED_BST = 26;
const TURN_SPEED      = 4.5;
const SEGMENT_SPACING = 1.5;
const PICKUP_RADIUS   = 2.4;
const HEAD_HIT_RADIUS = 0.7;
const BODY_HIT_RADIUS = 0.9;
const MAX_COLLECTIBLES = 60;
const SPAWN_INTERVAL  = 1.2;
const SPEED_PEN_PER5  = 0.05;
const RARITY = [[2,50],[4,25],[8,12],[16,7],[32,4],[64,2]];

// ================================================================
// HELPERS
// ================================================================
function rng(min, max) { return Math.random() * (max - min) + min; }
function dist2(ax, az, bx, bz) {
  const dx = ax - bx, dz = az - bz;
  return Math.sqrt(dx*dx + dz*dz);
}
function weightedValue() {
  const total = RARITY.reduce((s,[,w])=>s+w, 0);
  let r = Math.random()*total;
  for (const [v,w] of RARITY) { r-=w; if(r<=0) return v; }
  return 2;
}
let _nextId = 1;
function uid() { return _nextId++; }

// ================================================================
// GAME STATE
// ================================================================
const state = {
  players:      {},   // socketId → PlayerState
  collectibles: {},   // id → CollectibleState
  leaderboard:  [],   // [{name, score}]  top-10 all-time
  spawnTimer:   0,
};

// ================================================================
// PLAYER STATE
// ================================================================
function createPlayer(socketId, name) {
  const angle = Math.random() * Math.PI * 2;
  const r     = 20 + Math.random() * 30;
  const px    = Math.cos(angle) * r;
  const pz    = Math.sin(angle) * r;

  const trail = [];
  for (let i = 0; i < 200; i++) {
    trail.push({ x: px, z: pz - i * 0.1 });
  }

  return {
    id:      socketId,
    name:    name || 'Anonymous',
    alive:   true,
    angle:   Math.random() * Math.PI * 2,
    x:       px,
    z:       pz,
    score:   0,
    boost:   false,
    energy:  100,
    segments: [
      { value: 2 },
      { value: 2 },
      { value: 2 },
    ],
    trail,
    // input buffered from client
    inputX:  0,
    inputZ:  0,
    inputBoost: false,
    // for leaderboard
    maxTile: 2,
  };
}

// ================================================================
// COLLECTIBLE STATE
// ================================================================
function spawnCollectible(x, z) {
  const id  = uid();
  const val = weightedValue();
  state.collectibles[id] = {
    id,
    value: val,
    x: x ?? rng(-(ARENA_HALF-5), ARENA_HALF-5),
    z: z ?? rng(-(ARENA_HALF-5), ARENA_HALF-5),
  };
  return state.collectibles[id];
}

// Seed initial collectibles
for (let i = 0; i < 40; i++) spawnCollectible();

// ================================================================
// PHYSICS UPDATE
// ================================================================
function getSpeed(player) {
  const len = player.segments.length;
  const pen = Math.max(0.5, 1 - Math.floor(len/5) * SPEED_PEN_PER5);
  return (player.boost ? SNAKE_SPEED_BST : SNAKE_SPEED) * pen;
}

function updatePlayer(player, dt) {
  if (!player.alive) return;

  // Boost energy
  if (player.inputBoost && player.energy > 0) {
    player.boost  = true;
    player.energy = Math.max(0, player.energy - 35 * dt);
  } else {
    player.boost  = false;
    player.energy = Math.min(100, player.energy + 18 * dt);
  }
  if (player.energy <= 0) player.boost = false;

  // Turn
  const mag = Math.sqrt(player.inputX**2 + player.inputZ**2);
  if (mag > 0.08) {
    const target = Math.atan2(player.inputZ, player.inputX);
    let diff = target - player.angle;
    while (diff >  Math.PI) diff -= Math.PI*2;
    while (diff < -Math.PI) diff += Math.PI*2;
    player.angle += diff * TURN_SPEED * dt;
  }

  // Move
  const speed = getSpeed(player);
  player.x += Math.cos(player.angle) * speed * dt;
  player.z += Math.sin(player.angle) * speed * dt;

  // Arena clamp
  const limit = ARENA_HALF - 2;
  if (player.x >  limit) { player.x =  limit; player.angle = Math.PI - player.angle; }
  if (player.x < -limit) { player.x = -limit; player.angle = Math.PI - player.angle; }
  if (player.z >  limit) { player.z =  limit; player.angle = -player.angle; }
  if (player.z < -limit) { player.z = -limit; player.angle = -player.angle; }

  // Trail
  player.trail.unshift({ x: player.x, z: player.z });
  const maxTrail = player.segments.length * 60 + 100;
  if (player.trail.length > maxTrail) player.trail.length = maxTrail;

  // Update segment positions exactly along trail
  player.segments[0].x = player.x;
  player.segments[0].z = player.z;
  
  let trailIdx = 0;
  let prevPos = { x: player.x, z: player.z };
  
  for (let i = 1; i < player.segments.length; i++) {
    let remaining = SEGMENT_SPACING;
    
    while (trailIdx < player.trail.length - 1) {
      const p1 = prevPos;
      const p2 = player.trail[trailIdx + 1];
      const dx = p1.x - p2.x;
      const dz = p1.z - p2.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      
      if (dist >= remaining) {
        const t = remaining / dist;
        const exactX = p1.x - dx * t;
        const exactZ = p1.z - dz * t;
        player.segments[i].x = exactX;
        player.segments[i].z = exactZ;
        
        prevPos = { x: exactX, z: exactZ };
        break;
      } else {
        remaining -= dist;
        trailIdx++;
        prevPos = player.trail[trailIdx];
      }
    }
    
    if (trailIdx >= player.trail.length - 1) {
      player.segments[i].x = player.trail[player.trail.length - 1].x;
      player.segments[i].z = player.trail[player.trail.length - 1].z;
    }
  }

  // Score survival
  player.score += 1 * dt;
}

// ================================================================
// MERGE LOGIC
// ================================================================
function runChainMerge(segments) {
  let any = true;
  let merges = 0;
  while (any) {
    any = false;
    segments.sort((a, b) => b.value - a.value); // Daima büyükten küçüğe diz
    for (let i = segments.length - 2; i >= 0; i--) {
      if (segments[i].value === segments[i+1].value) {
        segments[i].value *= 2;
        segments.splice(i+1, 1);
        merges++;
        any = true;
        break;
      }
    }
  }
  return merges;
}

// ================================================================
// COLLISION + PICKUP
// ================================================================
function checkPickups(player) {
  const picked = [];
  for (const id in state.collectibles) {
    const c = state.collectibles[id];
    if (dist2(player.x, player.z, c.x, c.z) < PICKUP_RADIUS) {
      picked.push(c);
      delete state.collectibles[id];
    }
  }
  return picked;
}

function killPlayer(player, killerId) {
  player.alive = false;
  const loots = player.segments.map(seg => ({
    x: (seg.x ?? player.x) + rng(-3,3),
    z: (seg.z ?? player.z) + rng(-3,3),
    value: seg.value,
  }));
  player.segments = [];

  // Update leaderboard
  updateLeaderboard(player.name, Math.floor(player.score));

  // Emit death event
  io.to(player.id).emit('you_died', {
    score:   Math.floor(player.score),
    maxTile: player.maxTile,
    killer:  killerId ? (state.players[killerId]?.name || 'Unknown') : 'Arena',
  });

  return loots;
}

function updateLeaderboard(name, score) {
  const existing = state.leaderboard.find(e => e.name === name);
  if (existing) {
    if (score > existing.score) existing.score = score;
  } else {
    state.leaderboard.push({ name, score });
  }
  state.leaderboard.sort((a,b) => b.score - a.score);
  if (state.leaderboard.length > 10) state.leaderboard.length = 10;
  io.emit('leaderboard', state.leaderboard);
}

// ================================================================
// MAIN GAME TICK
// ================================================================
let lastTick = Date.now();

function gameTick() {
  const now = Date.now();
  const dt  = (now - lastTick) / 1000;
  lastTick  = now;

  // Spawn collectibles
  state.spawnTimer -= dt;
  const aliveCount = Object.keys(state.collectibles).length;
  if (state.spawnTimer <= 0 && aliveCount < MAX_COLLECTIBLES) {
    state.spawnTimer = SPAWN_INTERVAL;
    spawnCollectible();
    io.emit('collectible_spawned', Object.values(state.collectibles).slice(-1)[0]);
  }

  const allLoots = [];

  for (const id in state.players) {
    const player = state.players[id];
    if (!player.alive) continue;

    updatePlayer(player, dt);

  // Pickups
    const picked = checkPickups(player);
    for (const c of picked) {
      // Add segment at tail
      const last = player.segments[player.segments.length - 1];
      player.segments.push({ value: c.value, x: last?.x ?? player.x, z: last?.z ?? player.z });
      player.score += 10 + c.value;
      const mergeCount = runChainMerge(player.segments);
      player.maxTile = Math.max(player.maxTile, ...player.segments.map(s=>s.value));
      console.log(`  pickup: ${player.name} collected ${c.value} (merges:${mergeCount}) segs:${player.segments.length}`);
      io.to(player.id).emit('pickup', { value: c.value, merges: mergeCount, score: Math.floor(player.score) });
      io.emit('collectible_removed', c.id);
    }

    // Head vs head collisions
    for (const oid in state.players) {
      if (oid === id) continue;
      const other = state.players[oid];
      if (!other.alive) continue;
      if (dist2(player.x, player.z, other.x, other.z) < HEAD_HIT_RADIUS * 2.2) {
        const pm = player.segments.reduce((s,sg)=>s+sg.value,0);
        const om = other.segments.reduce((s,sg)=>s+sg.value,0);
        if (Math.abs(pm-om)/Math.max(pm,om) < 0.2) {
          allLoots.push(...killPlayer(player, null));
          allLoots.push(...killPlayer(other, null));
        } else if (om > pm) {
          allLoots.push(...killPlayer(player, oid));
          state.players[oid].score += 200;
        } else {
          allLoots.push(...killPlayer(other, id));
          player.score += 200;
        }
      }
    }

    if (!player.alive) continue;

    // Head vs body collisions
    for (const oid in state.players) {
      if (oid === id) continue;
      const other = state.players[oid];
      if (!other.alive) continue;
      for (let i = 1; i < other.segments.length; i++) {
        const seg = other.segments[i];
        if (!seg.x) continue;
        if (dist2(player.x, player.z, seg.x, seg.z) < BODY_HIT_RADIUS) {
          if (seg.value > (player.segments[0]?.value || 0)) {
            allLoots.push(...killPlayer(player, oid));
          }
          break;
        }
      }
      if (!player.alive) break;
    }
  }

  // Spawn loot from deaths
  for (const loot of allLoots) {
    const c = spawnCollectible(loot.x, loot.z);
    c.value = loot.value;
    io.emit('collectible_spawned', c);
  }

  // Broadcast world state (compact)
  const snapshot = {
    players: Object.values(state.players)
      .filter(p => p.alive)
      .map(p => ({
        id:       p.id,
        name:     p.name,
        x:        p.x,
        z:        p.z,
        angle:    p.angle,
        boost:    p.boost,
        score:    Math.floor(p.score),
        segments: p.segments.map(s => ({ value: s.value, x: s.x||p.x, z: s.z||p.z })),
      })),
  };
  io.emit('tick', snapshot);
}

setInterval(gameTick, TICK_MS);

// ================================================================
// SOCKET EVENTS
// ================================================================
io.on('connection', socket => {
  console.log(`+ connected: ${socket.id}`);

  socket.on('join', ({ name }) => {
    // Prevent duplicate join if player already exists and is alive
    if (state.players[socket.id]?.alive) {
      console.warn(`  [WARN] duplicate join ignored: ${name} (${socket.id})`);
      return;
    }
    const player = createPlayer(socket.id, name || 'Anonymous');
    state.players[socket.id] = player;
    console.log(`  join: ${player.name} at (${player.x.toFixed(1)}, ${player.z.toFixed(1)})`);

    // Send initial world state
    socket.emit('init', {
      myId:         socket.id,
      collectibles: Object.values(state.collectibles),
      leaderboard:  state.leaderboard,
    });

    io.emit('leaderboard', state.leaderboard);
  });

  // Client sends input every frame
  socket.on('input', ({ x, z, boost }) => {
    const p = state.players[socket.id];
    if (!p || !p.alive) return;
    p.inputX     = x  || 0;
    p.inputZ     = z  || 0;
    p.inputBoost = !!boost;
  });

  socket.on('respawn', ({ name }) => {
    const player = createPlayer(socket.id, name || state.players[socket.id]?.name || 'Anonymous');
    state.players[socket.id] = player;
    socket.emit('init', {
      myId:         socket.id,
      collectibles: Object.values(state.collectibles),
      leaderboard:  state.leaderboard,
    });
  });

  socket.on('disconnect', () => {
    const p = state.players[socket.id];
    if (p && p.alive) {
      const loots = killPlayer(p, null);
      for (const loot of loots) {
        const c = spawnCollectible(loot.x, loot.z);
        c.value = loot.value;
        io.emit('collectible_spawned', c);
      }
    }
    delete state.players[socket.id];
    console.log(`- disconnected: ${socket.id}`);
  });
});

// ================================================================
// START
// ================================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎮 Slither 2048 running on port ${PORT}`));
