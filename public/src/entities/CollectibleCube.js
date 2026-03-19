'use strict';
// ================================================================
// COLLECTIBLE CUBE — Floating numbered cube picked up by snakes
// ================================================================
class CollectibleCube {
  constructor(scene, value, x, z) {
    this.value      = value;
    this.alive      = true;
    this.position   = new THREE.Vector3(x, 0, z);
    this.scene      = scene;
    this._bobOffset = Math.random() * Math.PI * 2;
    this._rotOffset = Math.random() * Math.PI * 2;

    const col  = TileColors.get(value);
    const size = Config.CUBE_SIZE;
    this.mesh  = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshLambertMaterial({
        color:             col.bg,
        emissive:          new THREE.Color(col.emissive),
        emissiveIntensity: 0.5,
      })
    );
    this.mesh.castShadow = true;

    this.numPlane = makeNumberPlane(value);
    this.mesh.add(this.numPlane);

    this.mesh.position.copy(this.position);
    this.mesh.position.y = 0.5;
    scene.add(this.mesh);
  }

  update(dt, time) {
    if (!this.alive) return;
    this.mesh.position.y = 0.4 + Math.sin(time * 1.5 + this._bobOffset) * 0.12;
    this.mesh.rotation.y = time * 0.8 + this._rotOffset;
  }

  collect(scene) {
    this.alive = false;
    scene.remove(this.mesh);
  }
}
