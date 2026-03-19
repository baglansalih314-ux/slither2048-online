'use strict';
window.addEventListener('DOMContentLoaded', () => {
  const ctx = Game.init();
  OfflineGame.init(ctx.scene, ctx.camera, ctx.renderer);
  // Kayıtlı ismi doldur
  const saved = SaveManager.get('playerName');
  if (saved) document.getElementById('name-input').value = saved;
});
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('touchmove',   e => e.preventDefault(), { passive: false });
