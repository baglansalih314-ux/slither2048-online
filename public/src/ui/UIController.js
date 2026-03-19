'use strict';
const UIController = (() => {
  function init() {
    _bindNameScreen();
    _bindHudButtons();
    _bindGameOverButtons();
    _bindSettingsButtons();
    _bindTutorialButtons();
  }

  function _bindNameScreen() {
    const input = document.getElementById('name-input');
    const btn   = document.getElementById('btn-play');
    input.addEventListener('keydown', e => { if (e.key === 'Enter') _doPlay(); });
    btn.addEventListener('click', () => { AudioManager.init(); AudioManager.resume(); _doPlay(); });
  }

  function _doPlay() {
    const raw  = document.getElementById('name-input').value.trim();
    const name = raw.length > 0 ? raw.slice(0, 16) : 'Anonymous';
    SaveManager.set('playerName', name);
    Game.start(name);
  }

  function _bindHudButtons() {
    document.getElementById('btn-sound').addEventListener('click', () => {
      AudioManager.sfx.click();
      const muted = !SaveManager.getSetting('muted');
      SaveManager.setSetting('muted', muted);
      AudioManager.setMuted(muted);
      document.getElementById('btn-sound').textContent = muted ? '🔇' : '🔊';
    });
    document.getElementById('btn-lb-toggle').addEventListener('click', () => {
      document.getElementById('lb-panel').classList.toggle('hidden');
    });
  }

  function _bindGameOverButtons() {
    document.getElementById('btn-restart').addEventListener('click', () => {
      AudioManager.sfx.click(); Game.respawn();
    });
    document.getElementById('btn-menu-go').addEventListener('click', () => {
      AudioManager.sfx.click(); Game.stop(); StateMachine.show('name');
    });
  }

  function _bindSettingsButtons() {
    document.getElementById('btn-settings-menu').addEventListener('click', () => {
      AudioManager.sfx.click(); StateMachine.show('settings');
      document.getElementById('btn-settings-back').dataset.from = 'name';
    });
    document.getElementById('btn-settings-back').addEventListener('click', () => {
      AudioManager.sfx.click();
      StateMachine.show(document.getElementById('btn-settings-back').dataset.from || 'name');
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('Reset all progress?')) { SaveManager.reset(); AudioManager.sfx.click(); }
    });
    ['master','music','sfx'].forEach(type => {
      const key = 'vol' + type[0].toUpperCase() + type.slice(1);
      const slider = document.getElementById('vol-' + type);
      if (!slider) return;
      slider.value = SaveManager.getSetting(key);
      slider.addEventListener('input', () => { SaveManager.setSetting(key, +slider.value); AudioManager.applySettings(); });
    });
    ['vibration','particles'].forEach(key => {
      const t = document.getElementById('toggle-' + key);
      if (!t) return;
      t.classList.toggle('on', SaveManager.getSetting(key));
      t.addEventListener('click', () => {
        const v = !SaveManager.getSetting(key);
        SaveManager.setSetting(key, v); t.classList.toggle('on', v);
        if (key === 'particles') VFX.setParticlesEnabled(v);
        AudioManager.sfx.click();
      });
    });
    ['low','med','high'].forEach(q => {
      const btn = document.getElementById('q-' + q);
      if (!btn) return;
      btn.addEventListener('click', () => {
        ['low','med','high'].forEach(qq => document.getElementById('q-' + qq)?.classList.remove('active'));
        btn.classList.add('active');
        SaveManager.setSetting('quality', {low:'low',med:'medium',high:'high'}[q]);
        Renderer.setQuality({low:'low',med:'medium',high:'high'}[q]);
        AudioManager.sfx.click();
      });
    });
  }

  function _bindTutorialButtons() {
    document.getElementById('btn-show-tutorial')?.addEventListener('click', () => {
      AudioManager.sfx.click(); TutorialSystem.show();
    });
  }

  function showGameOver(score, maxTile, killer) {
    const prevBest = SaveManager.get('bestScore') || 0;
    if (score > prevBest) { SaveManager.set('bestScore', score); document.getElementById('go-newbest').style.display = 'block'; }
    else document.getElementById('go-newbest').style.display = 'none';
    document.getElementById('go-score').textContent   = score;
    document.getElementById('go-maxtile').textContent = maxTile;
    document.getElementById('go-killer').textContent  = killer ? '💀 Öldüren: ' + killer : '💀 Arena sınırı';
    StateMachine.show('gameover');
  }

  return { init, showGameOver };
})();
