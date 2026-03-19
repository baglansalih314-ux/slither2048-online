'use strict';
// ================================================================
// CAMERA CONTROLLER — Smooth follow, FOV zoom on boost, shake
// ================================================================
const CameraController = (() => {
  let camera;
  let camTarget = new THREE.Vector3();
  let fovBase   = Config.CAM_FOV;
  let fovTarget = fovBase;
  let shakeAmt  = 0;

  function init(cam) {
    camera   = cam;
    fovBase  = Config.CAM_FOV;
    fovTarget = fovBase;
  }

  function update(dt, playerPos, isBoosting) {
    let f = Math.min(dt * 60, 2.0);
    
    // Smoothly follow player in XZ
    camTarget.x += (playerPos.x - camTarget.x) * Config.CAM_LERP * f;
    camTarget.z += (playerPos.z - camTarget.z) * Config.CAM_LERP * f;

    const targetX = camTarget.x;
    const targetY = Config.CAM_HEIGHT;
    const targetZ = camTarget.z + Config.CAM_DISTANCE;

    // Eliminate micro-stutter by removing the secondary lazy LERP for X/Z
    // The camera should exactly rest at the offset of camTarget
    camera.position.x = targetX;
    camera.position.y += (targetY - camera.position.y) * 0.12 * f; // Height lerp is fine and fixed
    camera.position.z = targetZ;
    camera.lookAt(camTarget.x, 0, camTarget.z);

    // FOV widens slightly when boosting
    fovTarget = isBoosting ? fovBase + 10 : fovBase;
    camera.fov += (fovTarget - camera.fov) * 0.08 * f;
    camera.updateProjectionMatrix();

    // Trauma-based camera shake
    if (shakeAmt > 0) {
      shakeAmt -= dt * 6;
      if (shakeAmt < 0) shakeAmt = 0;
      const s = shakeAmt;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s * 0.4;
      camera.position.z += (Math.random() - 0.5) * s;
    }
  }

  /** @param {number} amount - trauma amount (0–2.5 recommended) */
  function shake(amount) { shakeAmt = Math.min(amount, 2.5); }

  return { init, update, shake };
})();
