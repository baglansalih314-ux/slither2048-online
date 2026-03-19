'use strict';
window.addEventListener('DOMContentLoaded', () => {
  Game.init();
  // Kayıtlı ismi doldur
  const saved = SaveManager.get('playerName');
  if (saved) document.getElementById('name-input').value = saved;
});
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('touchmove',   e => e.preventDefault(), { passive: false });
