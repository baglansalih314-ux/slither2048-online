'use strict';
const StateMachine = (() => {
  const screens = {
    'name':     'screen-name',
    'gameplay': 'screen-hud',
    'gameover': 'screen-gameover',
    'settings': 'screen-settings',
  };
  let current = 'name', previous = 'name';

  function show(state) {
    Object.values(screens).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    previous = current; current = state;
    const el = document.getElementById(screens[state]);
    if (el) el.classList.add('active');
    EventBus.emit('stateChange', { state, previous });
  }

  function getCurrent()  { return current; }
  function getPrevious() { return previous; }
  return { show, getCurrent, getPrevious };
})();
