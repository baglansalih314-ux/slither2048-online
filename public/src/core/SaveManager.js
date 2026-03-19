'use strict';
// ================================================================
// SAVE MANAGER — localStorage persistence
// ================================================================
const SaveManager = (() => {
  const KEY = 'slither2048_save';
  const defaults = {
    bestScore: 0,
    bestTile: 2,
    totalGames: 0,
    totalMerges: 0,
    settings: {
      volMaster: 80,
      volMusic: 50,
      volSfx: 80,
      vibration: true,
      particles: true,
      quality: 'medium',
    },
    tutorialDone: false,
  };
  let data = { ...defaults };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = { ...defaults, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('SaveManager: could not load save data', e);
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('SaveManager: could not write save data', e);
    }
  }

  function get(key)           { return data[key]; }
  function set(key, value)    { data[key] = value; save(); }
  function getSetting(key)    { return data.settings[key]; }
  function setSetting(key, v) { data.settings[key] = v; save(); }
  function reset()            { data = { ...defaults }; save(); }

  load();
  return { get, set, getSetting, setSetting, reset };
})();
