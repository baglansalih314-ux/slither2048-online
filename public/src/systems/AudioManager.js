'use strict';
// ================================================================
// AUDIO MANAGER — Web Audio API procedural SFX + background music
// ================================================================
const AudioManager = (() => {
  let ctx = null;
  let masterGain, musicGain, sfxGain;
  let musicNodes  = null;
  let muted       = false;
  let initialized = false;

  // ── Lifecycle ──────────────────────────────────────────────────
  function init() {
    if (initialized) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      musicGain  = ctx.createGain();
      sfxGain    = ctx.createGain();
      musicGain.connect(masterGain);
      sfxGain.connect(masterGain);
      masterGain.connect(ctx.destination);
      applySettings();
      initialized = true;
    } catch (e) {
      console.warn('AudioContext unavailable');
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function applySettings() {
    if (!initialized) return;
    masterGain.gain.value = SaveManager.getSetting('volMaster') / 100;
    musicGain.gain.value  = SaveManager.getSetting('volMusic')  / 100;
    sfxGain.gain.value    = SaveManager.getSetting('volSfx')    / 100;
  }

  // ── Primitive sound builders ───────────────────────────────────
  function tone(freq, type, duration, vol = 0.3, dest = null) {
    if (!initialized || muted) return;
    try {
      resume();
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(env);
      env.connect(dest || sfxGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function noise(duration, vol = 0.2) {
    if (!initialized || muted) return;
    try {
      resume();
      const bufLen = ctx.sampleRate * duration;
      const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data   = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
      const src  = ctx.createBufferSource();
      src.buffer = buf;
      const env  = ctx.createGain();
      env.gain.setValueAtTime(vol, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 800;
      src.connect(filt); filt.connect(env); env.connect(sfxGain);
      src.start(); src.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  // ── SFX definitions ───────────────────────────────────────────
  const sfx = {
    pickup() {
      tone(600, 'sine', 0.12, 0.2);
      tone(900, 'sine', 0.08, 0.15);
    },
    merge(value) {
      const base = Math.min(220 + Math.log2(value) * 80, 880);
      tone(base,       'sine',     0.3,  0.25);
      tone(base * 1.5, 'sine',     0.2,  0.15);
      tone(base * 2,   'triangle', 0.15, 0.1);
    },
    bigMerge(value) {
      const base = Math.min(330 + Math.log2(value) * 60, 660);
      tone(base,        'sine',     0.5, 0.3);
      tone(base * 1.25, 'sine',     0.4, 0.2);
      tone(base * 1.5,  'triangle', 0.3, 0.18);
      tone(base * 2,    'sawtooth', 0.2, 0.1);
    },
    boost() {
      tone(200, 'sawtooth', 0.15, 0.12);
      tone(280, 'sawtooth', 0.12, 0.1);
    },
    death() {
      noise(0.6, 0.35);
      tone(100, 'sawtooth', 0.4, 0.2);
      tone(60,  'square',   0.5, 0.15);
    },
    hit() {
      noise(0.15, 0.2);
      tone(150, 'square', 0.1, 0.15);
    },
    click() {
      tone(800, 'sine', 0.06, 0.15);
    },
    comboUp(level) {
      const freq = 400 + level * 80;
      tone(freq,       'sine', 0.15, 0.2);
      tone(freq * 1.5, 'sine', 0.1,  0.15);
    },
    killEnemy() {
      noise(0.3, 0.25);
      tone(220, 'sine', 0.4, 0.2);
      tone(330, 'sine', 0.3, 0.15);
    }
  };

  // ── Background music ──────────────────────────────────────────
  function startMusic() {
    if (!initialized) return;
    stopMusic();
    try {
      resume();
      const notes   = [130.81, 146.83, 164.81, 174.61, 196, 220, 246.94];
      const pattern = [0, 2, 4, 2, 1, 3, 5, 3, 0, 4, 2, 6];
      let step      = 0;
      const interval = (60 / 120) * 0.5 * 1000; // 120 BPM, eighth notes

      const play = () => {
        if (!initialized || muted) return;
        const freq = notes[pattern[step % pattern.length]];
        tone(freq,       'triangle', 0.25, 0.06, musicGain);
        if (step % 4 === 0) tone(freq * 0.5, 'sine', 0.4, 0.04, musicGain);
        step++;
      };
      musicNodes = setInterval(play, interval);
    } catch (e) {}
  }

  function stopMusic() {
    if (musicNodes) { clearInterval(musicNodes); musicNodes = null; }
  }

  function setMuted(val) {
    muted = val;
    if (val) stopMusic();
  }

  return { init, resume, applySettings, startMusic, stopMusic, setMuted, sfx };
})();
