'use strict';
// ================================================================
// INPUT MANAGER — Unified pointer / touch / keyboard input handler
// ================================================================
const InputManager = (() => {
  const state = {
    joystickActive:   false,
    joystickX:        0,
    joystickY:        0,
    boostActive:      false,
    joystickPointerId: null,
    boostPointerId:   null,
  };

  const joystickZone = document.getElementById('joystick-zone');
  const joystickBase = document.getElementById('joystick-base');
  const joystickKnob = document.getElementById('joystick-knob');
  const boostBtn     = document.getElementById('boost-btn');

  const KNOB_MAX = 36; // max pixel offset from center

  // ── Joystick helpers ──────────────────────────────────────────
  function getJoyCenterInPage() {
    const r = joystickBase.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function updateKnob(px, py) {
    const center = getJoyCenterInPage();
    let dx = px - center.x;
    let dy = py - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > KNOB_MAX) { dx = dx / dist * KNOB_MAX; dy = dy / dist * KNOB_MAX; }
    state.joystickX = dx / KNOB_MAX;
    state.joystickY = dy / KNOB_MAX;
    joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  function resetKnob() {
    state.joystickX      = 0;
    state.joystickY      = 0;
    state.joystickActive = false;
    joystickKnob.style.transform = 'translate(-50%,-50%)';
  }

  // ── Joystick pointer events ───────────────────────────────────
  joystickZone.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (state.joystickPointerId !== null) return;
    state.joystickPointerId = e.pointerId;
    state.joystickActive    = true;
    joystickZone.setPointerCapture(e.pointerId);
    updateKnob(e.clientX, e.clientY);
  }, { passive: false });

  joystickZone.addEventListener('pointermove', e => {
    e.preventDefault();
    if (e.pointerId !== state.joystickPointerId) return;
    updateKnob(e.clientX, e.clientY);
  }, { passive: false });

  const releaseJoy = e => {
    if (e.pointerId !== state.joystickPointerId) return;
    state.joystickPointerId = null;
    resetKnob();
  };
  joystickZone.addEventListener('pointerup',     releaseJoy);
  joystickZone.addEventListener('pointercancel', releaseJoy);

  // ── Boost button pointer events ───────────────────────────────
  boostBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    state.boostActive      = true;
    state.boostPointerId   = e.pointerId;
    boostBtn.setPointerCapture(e.pointerId);
    boostBtn.classList.add('active');
    AudioManager.sfx.boost();
  }, { passive: false });

  const releaseBoost = e => {
    if (e.pointerId !== state.boostPointerId) return;
    state.boostActive    = false;
    state.boostPointerId = null;
    boostBtn.classList.remove('active');
  };
  boostBtn.addEventListener('pointerup',     releaseBoost);
  boostBtn.addEventListener('pointercancel', releaseBoost);

  // ── Keyboard (desktop) ────────────────────────────────────────
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup',   e => { keys[e.key] = false; });

  // ── Public API ────────────────────────────────────────────────
  function getInput() {
    // Keyboard takes priority over joystick
    let kx = 0, ky = 0;
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) kx = -1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) kx =  1;
    if (keys['ArrowUp']    || keys['w'] || keys['W']) ky = -1;
    if (keys['ArrowDown']  || keys['s'] || keys['S']) ky =  1;
    if (kx !== 0 || ky !== 0) return { x: kx, y: ky, boost: !!keys[' '] };

    const boost = state.boostActive || !!keys[' '];
    return { x: state.joystickX, y: state.joystickY, boost };
  }

  return { getInput };
})();
