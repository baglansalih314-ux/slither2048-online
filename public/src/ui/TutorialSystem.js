'use strict';
// ================================================================
// TUTORIAL SYSTEM — Step-by-step first-play tutorial overlay
// ================================================================
const TutorialSystem = (() => {
  const steps = [
    {
      icon:  '🕹️',
      title: 'Move Your Snake',
      desc:  'Drag the joystick on the left to steer your snake through the arena.'
    },
    {
      icon:  '🟣',
      title: 'Collect Cubes',
      desc:  'Run over number cubes to add them to your snake\'s body and grow longer.'
    },
    {
      icon:  '🔢',
      title: 'Merge Numbers',
      desc:  'Same numbers automatically merge! 2+2=4, 4+4=8… Chain merges for combo bonuses!'
    },
    {
      icon:  '⚡',
      title: 'Use Boost',
      desc:  'Hold the lightning button to boost speed. Use it wisely — energy is limited!'
    },
    {
      icon:  '⚔️',
      title: 'Dominate',
      desc:  'Avoid stronger snakes. If your head power is higher, you can crash through weaker ones!'
    },
  ];
  let currentStep = 0;

  function show() {
    currentStep = 0;
    renderStep();
    document.getElementById('tutorial-overlay').classList.add('show');
  }

  function hide() {
    document.getElementById('tutorial-overlay').classList.remove('show');
    SaveManager.set('tutorialDone', true);
  }

  function renderStep() {
    const s = steps[currentStep];
    document.getElementById('tut-icon').textContent  = s.icon;
    document.getElementById('tut-title').textContent = s.title;
    document.getElementById('tut-desc').textContent  = s.desc;

    // Dot indicators
    document.getElementById('tut-dots').innerHTML = steps
      .map((_, i) => `<div class="tut-dot${i === currentStep ? ' active' : ''}"></div>`)
      .join('');

    // Last step changes button label
    document.getElementById('btn-tut-next').textContent =
      currentStep === steps.length - 1 ? '✓ Got it!' : 'Next →';
  }

  // ── Button wiring ─────────────────────────────────────────────
  document.getElementById('btn-tut-next').addEventListener('click', () => {
    AudioManager.sfx.click();
    if (currentStep < steps.length - 1) {
      currentStep++;
      renderStep();
    } else {
      hide();
    }
  });

  document.getElementById('btn-tut-skip').addEventListener('click', () => {
    AudioManager.sfx.click();
    hide();
  });

  return { show, hide };
})();
