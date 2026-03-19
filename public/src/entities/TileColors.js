'use strict';
// ================================================================
// TILE COLORS — Maps 2048 tile values to background/emissive colors
// ================================================================
const TileColors = {
  palette: {
    2:    { bg: 0x6c63ff, text: '#ffffff', emissive: 0x3333aa },
    4:    { bg: 0x9d58ff, text: '#ffffff', emissive: 0x550099 },
    8:    { bg: 0xff6b9d, text: '#ffffff', emissive: 0x991155 },
    16:   { bg: 0xff8c42, text: '#ffffff', emissive: 0xaa4400 },
    32:   { bg: 0xffd700, text: '#1a1a2e', emissive: 0x886600 },
    64:   { bg: 0x00f5a0, text: '#0a1a15', emissive: 0x006633 },
    128:  { bg: 0x00d4ff, text: '#001a2e', emissive: 0x006688 },
    256:  { bg: 0xff4757, text: '#ffffff', emissive: 0x991122 },
    512:  { bg: 0xa29bfe, text: '#ffffff', emissive: 0x5544cc },
    1024: { bg: 0xfdcb6e, text: '#1a1000', emissive: 0x996600 },
    2048: { bg: 0xe17055, text: '#ffffff', emissive: 0xaa2200 },
  },

  /**
   * Returns palette entry for a given tile value.
   * Clamps to nearest lower power-of-2 key.
   */
  get(value) {
    const clamped = Math.min(value, 2048);
    let v = 2;
    while (v * 2 <= clamped) v *= 2;
    return this.palette[v] || { bg: 0xffffff, text: '#000000', emissive: 0x444444 };
  }
};
