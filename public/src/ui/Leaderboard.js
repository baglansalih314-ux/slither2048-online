'use strict';
// ================================================================
// LEADERBOARD — Anlık skor tablosu (sunucudan gelir)
// ================================================================
const Leaderboard = (() => {
  let myId      = null;
  let myName    = null;
  let entries   = [];

  function init(id, name) {
    myId   = id;
    myName = name;
  }

  function update(data) {
    entries = data;
    render();
  }

  function render() {
    const el = document.getElementById('lb-list');
    if (!el) return;
    const medals = ['🥇','🥈','🥉'];
    el.innerHTML = entries.map((e, i) => {
      const isMe = (e.name === myName);
      return `<div class="lb-row${isMe ? ' lb-me' : ''}">
        <span class="lb-rank">${medals[i] || (i+1)}</span>
        <span class="lb-name">${escHtml(e.name)}</span>
        <span class="lb-score">${e.score}</span>
      </div>`;
    }).join('');
  }

  function escHtml(str) {
    return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  return { init, update };
})();
