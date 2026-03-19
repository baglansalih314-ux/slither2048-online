'use strict';
// ================================================================
// NETWORK MANAGER — Socket.io ile sunucu iletişimi
// ================================================================
const NetworkManager = (() => {
  let socket = null;
  let myId   = null;
  let connected = false;
  let joined  = false;  // tracks if we have sent a join event
  let pingStart = 0;
  let latency   = 0;

  // Sunucudan gelen son tick snapshot
  let lastSnapshot = null;

  function connect(serverUrl) {
    socket = io(serverUrl, { transports: ['websocket'], reconnectionDelay: 1000 });

    socket.on('connect', () => {
      connected = true;
      joined = false;  // reset on each new connection
      console.log('✅ Sunucuya bağlandı:', socket.id);
      EventBus.emit('net:connected');
    });

    socket.on('disconnect', () => {
      connected = false;
      console.warn('❌ Bağlantı kesildi');
      EventBus.emit('net:disconnected');
    });

    socket.on('init', (data) => {
      myId = data.myId;
      EventBus.emit('net:init', data);
    });

    socket.on('tick', (snapshot) => {
      lastSnapshot = snapshot;
      EventBus.emit('net:tick', snapshot);
    });

    socket.on('collectible_spawned', (c) => {
      EventBus.emit('net:collectible_spawned', c);
    });

    socket.on('collectible_removed', (id) => {
      EventBus.emit('net:collectible_removed', id);
    });

    socket.on('pickup', (data) => {
      EventBus.emit('net:pickup', data);
    });

    socket.on('you_died', (data) => {
      EventBus.emit('net:you_died', data);
    });

    socket.on('leaderboard', (data) => {
      EventBus.emit('net:leaderboard', data);
    });

    socket.on('online_count', (count) => {
      EventBus.emit('net:online_count', count);
    });

    // Ping ölçümü
    socket.on('pong_custom', () => {
      latency = Date.now() - pingStart;
      document.getElementById('ping-display').textContent = `${latency}ms`;
    });
    setInterval(() => {
      if (connected) { pingStart = Date.now(); socket.emit('ping_custom'); }
    }, 3000);
  }

  function join(name) {
    if (!connected || joined) return;
    joined = true;
    socket.emit('join', { name });
  }

  function respawn(name) {
    if (!connected) return;
    socket.emit('respawn', { name });
  }

  function sendInput(x, z, boost) {
    if (!connected || !socket) return;
    socket.emit('input', { x, z, boost });
  }

  function getMyId()        { return myId; }
  function isConnected()    { return connected; }
  function getLastSnapshot(){ return lastSnapshot; }
  function getLatency()     { return latency; }

  return { connect, join, respawn, sendInput, getMyId, isConnected, getLastSnapshot, getLatency };
})();
