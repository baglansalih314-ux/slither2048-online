'use strict';
// ================================================================
// OBJECT POOL — Generic factory-based reusable object pool
// ================================================================

/**
 * @param {Function} factory     - Creates a new instance
 * @param {Function} resetFn     - Resets an instance before returning to pool
 * @param {number}   initialSize - Pre-warmed pool size
 */
function createPool(factory, resetFn, initialSize = 20) {
  const pool = [];
  for (let i = 0; i < initialSize; i++) pool.push(factory());

  return {
    get() {
      return pool.length > 0 ? pool.pop() : factory();
    },
    release(obj) {
      resetFn(obj);
      pool.push(obj);
    },
    size() { return pool.length; }
  };
}
