'use strict';
// ================================================================
// ARENA — Floor grid, glowing boundary ring, decorative pillars
// ================================================================
const Arena = (() => {
  let scene;
  const H = Config.ARENA_HALF;

  function init(sc) {
    scene = sc;
    buildFloor();
    createBoundaryGlow();
    addDecorations();
  }

  // ── Tiled floor plane ─────────────────────────────────────────
  function buildFloor() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b0b20';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = 'rgba(50,50,120,0.5)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(128, 0);
    ctx.moveTo(0, 0); ctx.lineTo(0, 128);
    ctx.stroke();

    ctx.fillStyle = 'rgba(80,80,180,0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(80, 80);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(H * 20, H * 20),
      new THREE.MeshLambertMaterial({ color: 0xffffff, map: tex, side: THREE.DoubleSide })
    );
    floor.rotation.x   = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  // ── Soft boundary ring ────────────────────────────────────────
  function createBoundaryGlow() {
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const angle = (i / 80) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * H, 0.5, Math.sin(angle) * H));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.15, 6, true);
    const mat = new THREE.MeshBasicMaterial({ color: 0x3333aa, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Mesh(geo, mat));
  }

  // ── Corner pillars ────────────────────────────────────────────
  function addDecorations() {
    const geo = new THREE.CylinderGeometry(0.4, 0.6, 3, 6);
    const mat = new THREE.MeshLambertMaterial({ color: 0x1a1a44 });
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(a => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(Math.cos(a) * (H - 3), 1.5, Math.sin(a) * (H - 3));
      scene.add(m);
    });
  }

  // ── Soft boundary clamp ───────────────────────────────────────
  function clamp(snake) {
    const pos    = snake.headPosition;
    const limit  = H - 2;
    if (pos.x >  limit) { pos.x =  limit; snake.angle = Math.PI - snake.angle; }
    if (pos.x < -limit) { pos.x = -limit; snake.angle = Math.PI - snake.angle; }
    if (pos.z >  limit) { pos.z =  limit; snake.angle = -snake.angle; }
    if (pos.z < -limit) { pos.z = -limit; snake.angle = -snake.angle; }
  }

  return { init, clamp };
})();
