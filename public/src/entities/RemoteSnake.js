'use strict';
// ================================================================
// REMOTE SNAKE — Diğer oyuncuların yılanlarını 3D olarak render eder
// ================================================================
class RemoteSnake {
  constructor(scene, playerData) {
    this.scene    = scene;
    this.id       = playerData.id;
    this.name     = playerData.name;
    this.meshes   = [];       // segment mesh'leri
    this.labelEl  = null;     // HTML isim etiketi
    this._buildLabel();
    this._syncSegments(playerData.segments);
  }

  // ── İsim etiketi (DOM overlay) ────────────────────────────────
  _buildLabel() {
    const el = document.createElement('div');
    el.className   = 'remote-label';
    el.textContent = this.name;
    document.getElementById('labels-container').appendChild(el);
    this.labelEl = el;
  }

  // ── Segment mesh sayısını güncelle ────────────────────────────
  _syncSegments(segments) {
    // Fazla mesh'leri kaldır
    while (this.meshes.length > segments.length) {
      const m = this.meshes.pop();
      this.scene.remove(m);
    }
    // Eksik mesh'leri ekle
    while (this.meshes.length < segments.length) {
      const isHead = this.meshes.length === 0;
      const size   = isHead ? Config.HEAD_SIZE : Config.SEGMENT_SIZE;
      const val    = segments[this.meshes.length]?.value || 2;
      const col    = TileColors.get(val);
      const mesh   = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshLambertMaterial({
          color:             col.bg,
          emissive:          new THREE.Color(col.emissive),
          emissiveIntensity: isHead ? 0.5 : 0.25,
        })
      );
      // Sayı plane
      const numPlane = makeNumberPlane(val);
      mesh.add(numPlane);
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }
  }

  // ── Her tick sunucudan gelen data ile güncelle ─────────────────
  update(playerData, camera) {
    this._syncSegments(playerData.segments);

    playerData.segments.forEach((seg, i) => {
      const mesh = this.meshes[i];
      if (!mesh) return;
      // Pozisyon
      const tx = seg.x ?? playerData.x;
      const tz = seg.z ?? playerData.z;
      mesh.position.x += (tx  - mesh.position.x) * 0.35;
      mesh.position.z += (tz  - mesh.position.z) * 0.35;
      mesh.position.y  = 0.5 + Math.sin(Date.now()/800 + i) * 0.07;

      // Renk güncelle
      const col = TileColors.get(seg.value);
      mesh.material.color.setHex(col.bg);
      mesh.material.emissive.setHex(col.emissive);
    });

    // Head rotation
    if (this.meshes[0]) {
      this.meshes[0].rotation.y = -playerData.angle;
    }

    // İsim etiketini kameraya göre konumlandır
    this._updateLabel(playerData, camera);
  }

  _updateLabel(playerData, camera) {
    if (!this.labelEl || !camera) return;
    const pos = new THREE.Vector3(playerData.x, 2.5, playerData.z);
    pos.project(camera);
    const hw = window.innerWidth  / 2;
    const hh = window.innerHeight / 2;
    const sx = pos.x *  hw + hw;
    const sy = pos.y * -hh + hh;
    // Ekran dışındaysa gizle
    if (pos.z > 1 || sx < -50 || sx > window.innerWidth + 50) {
      this.labelEl.style.display = 'none';
    } else {
      this.labelEl.style.display = 'block';
      this.labelEl.style.left    = sx + 'px';
      this.labelEl.style.top     = sy + 'px';
    }
  }

  destroy() {
    this.meshes.forEach(m => this.scene.remove(m));
    this.meshes = [];
    if (this.labelEl) this.labelEl.remove();
  }
}
