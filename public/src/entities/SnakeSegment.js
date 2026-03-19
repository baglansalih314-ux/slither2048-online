'use strict';
// ================================================================
// SNAKE SEGMENT — One numbered cube in a snake's body chain
// ================================================================
class SnakeSegment {
  constructor(value, isHead = false) {
    this.value    = value;
    this.isHead   = isHead;
    this.position = new THREE.Vector3();
    this.scaleAnim = 1.0;

    const size = isHead ? Config.HEAD_SIZE : Config.SEGMENT_SIZE;
    this.mesh  = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      makeCubeMaterial(value, isHead)
    );
    this.mesh.castShadow = true;

    this.numPlane = makeNumberPlane(value);
    this.mesh.add(this.numPlane);

    // Randomised bob offset so segments don't all bounce in sync
    this._bobOffset = Math.random() * Math.PI * 2;
    this._bobSpeed  = 0.8 + Math.random() * 0.4;
  }

  /** Update value, swap material and texture, trigger scale punch */
  setValue(newValue) {
    this.value = newValue;
    this.mesh.material = makeCubeMaterial(newValue, this.isHead);
    this.numPlane.material.map = NumberTextureCache.get(newValue);
    this.numPlane.material.needsUpdate = true;
    this.scaleAnim = 1.4; // punch
  }

  update(dt, time) {
    // Smooth position lerp
    // this.mesh.position.lerp(this.position, 0.25);
    // DO NOT LERP! Fizik zaten 60 fps kusursuz çalışıyor.
    // LERP (exponential smoothing) eklemek "birim birim atlama" takılmasına ve gövdenin kopmasına sebep oluyor.
    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.z;

    // Bob animation
    const bob = Math.sin(time * this._bobSpeed + this._bobOffset) * 0.08;
    this.mesh.position.y = this.position.y + 0.5 + bob;


    // Scale punch decay + Ripple bulge
    if (this.scaleAnim > 1.0) {
      this.scaleAnim = Math.max(1.0, this.scaleAnim - dt * 5);
    }
    const s = this.scaleAnim + (this.rippleScale || 0);
    this.mesh.scale.set(s, s, s);
  }

  addToScene(scene)    { scene.add(this.mesh); }
  removeFromScene(scene) { scene.remove(this.mesh); }
}
