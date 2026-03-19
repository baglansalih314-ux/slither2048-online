'use strict';
// ================================================================
// VFX — 3D particle bursts and screen-space flash effects
// ================================================================
const VFX = (() => {
  const particles  = [];
  let scene        = null;
  let useParticles = true;

  const GEO      = new THREE.SphereGeometry(0.12, 4, 4);
  const MAT_POOL = {};

  function getParticleMat(color) {
    if (!MAT_POOL[color]) {
      MAT_POOL[color] = new THREE.MeshBasicMaterial({ color, transparent: true });
    }
    return MAT_POOL[color];
  }

  function init(sc) { scene = sc; }

  // ── 3D burst ──────────────────────────────────────────────────
  function spawnBurst(x, y, z, color, count = 8) {
    if (!useParticles || !scene) return;
    count = Math.min(count, 12);
    for (let i = 0; i < count; i++) {
      const mesh  = new THREE.Mesh(GEO, getParticleMat(color).clone());
      const angle = (i / count) * Math.PI * 2;
      const speed = 0.04 + Math.random() * 0.06;
      mesh.position.set(x, y, z);
      mesh.userData = {
        vx:    Math.cos(angle) * speed,
        vy:    0.04 + Math.random() * 0.08,
        vz:    Math.sin(angle) * speed,
        life:  1.0,
        decay: 0.035 + Math.random() * 0.03
      };
      scene.add(mesh);
      particles.push(mesh);
    }
  }

  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const d = p.userData;
      d.life -= d.decay;
      if (d.life <= 0) {
        scene.remove(p);
        particles.splice(i, 1);
        continue;
      }
      p.position.x    += d.vx;
      p.position.y    += d.vy;
      p.position.z    += d.vz;
      d.vy             -= 0.003; // gravity
      p.material.opacity = d.life;
    }
  }

  // ── Screen-space flashes ──────────────────────────────────────
  function mergeFlash() {
    const el = document.getElementById('merge-flash');
    el.style.opacity = 0.7;
    setTimeout(() => { el.style.opacity = 0; }, 150);
  }

  function hitFlash() {
    const el = document.getElementById('hit-flash');
    el.style.opacity = 1;
    setTimeout(() => { el.style.opacity = 0; }, 100);
  }

  // ── Floating score pop ────────────────────────────────────────
  function showFloatScore(value, screenX, screenY) {
    const el = document.createElement('div');
    el.className   = 'float-score';
    el.textContent = '+' + value;
    el.style.left  = screenX + 'px';
    el.style.top   = screenY + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  function setParticlesEnabled(v) { useParticles = v; }

  return { init, spawnBurst, mergeFlash, hitFlash, showFloatScore, update, setParticlesEnabled };
})();
