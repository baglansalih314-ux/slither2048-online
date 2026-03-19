'use strict';
// ================================================================
// SNAKE — Base class shared by PlayerSnake and AISnake
// ================================================================
class Snake {
  constructor(scene, startX, startZ, startAngle, startValue = 2) {
    this.scene       = scene;
    this.angle       = startAngle; // heading in XZ plane (radians)
    this.headPosition = new THREE.Vector3(startX, 0, startZ);
    this.segments    = [];
    this.alive       = true;
    this.isBoosting  = false;
    this.trail       = [];           // head-position history used by body segments
    this.TRAIL_SPACING = Config.SEGMENT_SPACING;
    this.swallowRipples = [];

    // Seed initial body
    this._addSegment(startValue, true);
    this._addSegment(startValue, false);
    this._addSegment(startValue, false);

    // Pre-fill trail so segments have somewhere to sit immediately
    for (let i = 0; i < 200; i++) {
      this.trail.push(new THREE.Vector3(startX, 0, startZ - i * 0.1));
    }
  }

  // ── Segment management ────────────────────────────────────────
  _addSegment(value, isHead) {
    const seg = new SnakeSegment(value, isHead);
    seg.position.copy(this.headPosition);
    seg.mesh.position.copy(seg.position); // İlk karede 0,0'dan uçmasını önle
    seg.addToScene(this.scene);
    if (isHead) this.segments.unshift(seg);
    else        this.segments.push(seg);
  }

  addTailSegment(value) {
    const last = this.segments[this.segments.length - 1];
    const seg  = new SnakeSegment(value, false);
    if (last) {
      seg.position.copy(last.position);
    } else {
      seg.position.copy(this.headPosition);
    }
    seg.mesh.position.copy(seg.position); // İlk karede 0,0'dan sıçramayı önle
    seg.addToScene(this.scene);
    this.segments.push(seg);
    this.runChainMerge();
    return seg;
  }

  runChainMerge() {
    let any = true;
    let merges = 0;
    while (any) {
      any = false;
      this.segments.sort((a,b) => b.value - a.value); // Client tarafında da aynı mantıkla büyükten küçüğe sırala
      for (let i = this.segments.length - 2; i >= 0; i--) {
        if (this.segments[i].value === this.segments[i+1].value) {
          const newValue = this.segments[i].value * 2;
          this.segments[i].setValue(newValue);
          const removed = this.segments.splice(i+1, 1)[0];
          removed.removeFromScene(this.scene);
          merges++;
          any = true;
          break;
        }
      }
    }
    return merges;
  }

  // ── Computed properties ───────────────────────────────────────
  get length()    { return this.segments.length; }
  get maxTile()   { return Math.max(...this.segments.map(s => s.value)); }
  get totalMass() { return this.segments.reduce((s, seg) => s + seg.value, 0); }
  get headPower() { return this.segments[0] ? this.segments[0].value : 0; }

  getEffectiveSpeed() {
    const penalty = Math.max(0.5, 1 - Math.floor(this.length / 5) * Config.SPEED_PENALTY_PER_5);
    const base    = this.isBoosting ? Config.SNAKE_SPEED_BOOST : Config.SNAKE_SPEED_BASE;
    return base * penalty;
  }

  // ── Movement ──────────────────────────────────────────────────
  move(dt, turnInput) {
    if (turnInput) {
      const mag = Math.sqrt(turnInput.x ** 2 + turnInput.y ** 2);
      if (mag > 0.08) {
        const targetAngle = Math.atan2(turnInput.y, turnInput.x);
        let diff = targetAngle - this.angle;
        while (diff >  Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.angle += diff * Config.SNAKE_TURN_SPEED * dt;
      }
    }

    const speed = this.getEffectiveSpeed();
    this.headPosition.x += Math.cos(this.angle) * speed * dt;
    this.headPosition.z += Math.sin(this.angle) * speed * dt;

    // Record trail
    this.trail.unshift(this.headPosition.clone());
    if (this.trail.length > this.length * 60 + 100) this.trail.pop();

    // Place segments exactly along the trail
    this.segments[0].position.copy(this.headPosition);
    
    let trailIdx = 0;
    let prevPos = this.headPosition.clone();
    
    for (let i = 1; i < this.segments.length; i++) {
      let remaining = this.TRAIL_SPACING;
      
      while (trailIdx < this.trail.length - 1) {
        const p1 = prevPos;
        const p2 = this.trail[trailIdx + 1];
        const dist = p1.distanceTo(p2);
        
        if (dist >= remaining) {
          const t = remaining / dist;
          const exactPos = p1.clone().lerp(p2, t);
          this.segments[i].position.copy(exactPos);
          prevPos = exactPos;
          break;
        } else {
          remaining -= dist;
          trailIdx++;
          prevPos = this.trail[trailIdx];
        }
      }
      
      if (trailIdx >= this.trail.length - 1) {
        this.segments[i].position.copy(this.trail[this.trail.length - 1]);
      }
    }
  }

  update(dt, time, turnInput) {
    this.move(dt, turnInput);
    
    // Yutkunma (Swallow Ripple) efektinin güncellenmesi
    const speed = this.getEffectiveSpeed();
    for (let i = this.swallowRipples.length - 1; i >= 0; i--) {
        this.swallowRipples[i].progress += dt * speed * 2.0; // Dalga yılan hızından daha hızlı ilerler
        if (this.swallowRipples[i].progress > this.length * this.TRAIL_SPACING + 5) {
            this.swallowRipples.splice(i, 1);
        }
    }

    this.segments.forEach((seg, i) => {
        // İlgili segmente dalga denk geliyorsa hesapla
        let bulge = 0;
        const segDist = i * this.TRAIL_SPACING;
        this.swallowRipples.forEach(r => {
            const d = Math.abs(r.progress - segDist);
            if (d < 2.0) bulge = Math.max(bulge, (1.0 - d / 2.0) * 0.6);
        });
        seg.rippleScale = bulge;
        
        seg.update(dt, time);
    });

    if (this.segments[0]) {
      this.segments[0].mesh.rotation.y = -this.angle;
    }
    
    // Vücut segmentlerinin gidiş yönüne dönmesi (Rotation Fix)
    for (let i = 1; i < this.segments.length; i++) {
        const cur = this.segments[i].position;
        const target = this.segments[i-1].position;
        const dx = target.x - cur.x;
        const dz = target.z - cur.z;
        if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
             this.segments[i].mesh.rotation.y = -Math.atan2(dz, dx);
        }
    }
  }

  // ── Death — scatter segments as loot ─────────────────────────
  die(scatterScene) {
    this.alive = false;
    const loots = this.segments.map(seg => {
      const loot = {
        value: seg.value,
        x: seg.position.x + (Math.random() - 0.5) * 3,
        z: seg.position.z + (Math.random() - 0.5) * 3
      };
      VFX.spawnBurst(seg.position.x, 0.5, seg.position.z, TileColors.get(seg.value).bg, 8);
      seg.removeFromScene(this.scene);
      return loot;
    });
    this.segments = [];
    AudioManager.sfx.death();
    VFX.hitFlash();
    return loots;
  }

  destroy() {
    this.segments.forEach(seg => seg.removeFromScene(this.scene));
    this.segments = [];
  }
}
