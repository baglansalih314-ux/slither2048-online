'use strict';
// ================================================================
// MERGE SYSTEM — Core 2048 chain-merge logic for snake segments
// ================================================================
const MergeSystem = (() => {

  /**
   * Merge segment at `idx` with the one immediately after it.
   * The higher-index segment is removed; the lower gains doubled value.
   */
  function performMerge(segments, idx, scene) {
    const merged  = segments[idx].value * 2;
    const removed = segments.splice(idx + 1, 1)[0];

    VFX.spawnBurst(
      removed.position.x,
      removed.position.y + 0.5,
      removed.position.z,
      TileColors.get(merged).bg,
      10
    );
    removed.removeFromScene(scene);
    segments[idx].setValue(merged);
    VFX.mergeFlash();
    return merged;
  }

  /**
   * Repeatedly scan the body from tail → head for any two adjacent
   * equal-value segments and merge them.  Restarts after each merge
   * so cascade chains resolve correctly (like real 2048).
   *
   * @param {SnakeSegment[]} segments
   * @param {THREE.Scene}    scene
   * @param {Function}       onMerge  - callback(mergedValue, chainIndex)
   * @returns {number} total merges performed
   */
  function runChainMerge(segments, scene, onMerge) {
    let totalChain = 0;
    let anyMerged  = true;

    while (anyMerged) {
      anyMerged = false;
      for (let i = segments.length - 2; i >= 0; i--) {
        if (segments[i].value === segments[i + 1].value) {
          const val = performMerge(segments, i, scene);
          if (onMerge) onMerge(val, totalChain);
          totalChain++;
          anyMerged = true;
          break; // restart scan after each merge
        }
      }
    }
    return totalChain;
  }

  return { runChainMerge };
})();
