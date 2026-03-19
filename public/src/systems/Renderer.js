'use strict';
// ================================================================
// RENDERER — Three.js WebGL renderer, scene, camera, and lighting
// ================================================================
const Renderer = (() => {
  let renderer, scene, camera;
  let quality = 'medium';

  function init() {
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias:       quality !== 'low',
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1.5));
    renderer.shadowMap.enabled = quality !== 'low';
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070712);
    scene.fog        = new THREE.Fog(0x070712, 40, 90);

    camera = new THREE.PerspectiveCamera(
      Config.CAM_FOV,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );
    camera.position.set(0, Config.CAM_HEIGHT, Config.CAM_DISTANCE);
    camera.lookAt(0, 0, 0);

    setupLights();
    VFX.init(scene);

    window.addEventListener('resize', onResize);
    return { renderer, scene, camera };
  }

  function setupLights() {
    scene.add(new THREE.AmbientLight(0x8888cc, 0.6));
    scene.add(new THREE.HemisphereLight(0x4444bb, 0x222244, 0.5));

    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(30, 60, 20);
    if (quality !== 'low') {
      dir.castShadow = true;
      const mapSize  = quality === 'high' ? 1024 : 512;
      dir.shadow.mapSize.set(mapSize, mapSize);
      dir.shadow.camera.near   = 1;
      dir.shadow.camera.far    = 200;
      dir.shadow.camera.left   = -100;
      dir.shadow.camera.right  =  100;
      dir.shadow.camera.top    =  100;
      dir.shadow.camera.bottom = -100;
    }
    scene.add(dir);

    // Rim light for cube pop
    const rim = new THREE.DirectionalLight(0x6c63ff, 0.4);
    rim.position.set(-20, 20, -20);
    scene.add(rim);
  }

  function setQuality(q) {
    quality = q;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, q === 'high' ? 2 : q === 'medium' ? 1.5 : 1));
    renderer.shadowMap.enabled = q !== 'low';
    VFX.setParticlesEnabled(q !== 'low');
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function render()       { renderer.render(scene, camera); }
  function getScene()     { return scene; }
  function getCamera()    { return camera; }
  function getRenderer()  { return renderer; }

  return { init, render, getScene, getCamera, getRenderer, setQuality };
})();
