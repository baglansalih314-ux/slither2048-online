'use strict';
// ================================================================
// CUBE MATERIAL FACTORY — Creates Three.js materials for tile cubes
// ================================================================

/**
 * Creates a Lambert material for a snake segment or collectible.
 * @param {number}  value  - Tile value (2, 4, 8, …)
 * @param {boolean} isHead - Higher emissive intensity for the head segment
 */
function makeCubeMaterial(value, isHead = false) {
  const col = TileColors.get(value);
  return new THREE.MeshLambertMaterial({
    color:             col.bg,
    emissive:          new THREE.Color(col.emissive),
    emissiveIntensity: isHead ? 0.6 : 0.3,
  });
}

/**
 * Creates a transparent top-face plane displaying the tile number.
 * @param {number} value - Tile value
 */
function makeNumberPlane(value) {
  const mat  = new THREE.MeshBasicMaterial({
    map:        NumberTextureCache.get(value),
    transparent: true,
    side:        THREE.FrontSide,
    depthWrite:  false
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), mat);
  mesh.position.y = Config.SEGMENT_SIZE / 2 + 0.01;
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
