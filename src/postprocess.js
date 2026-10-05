// Post-Processing Shaders: Film Grain, Vignette, Chromatic Aberration

function applyPostProcessing(canvas, ctx, frame, options = {}) {
  const width = canvas.width;
  const height = canvas.height;
  const grainAmount = options.grainAmount !== undefined ? options.grainAmount : 7.0;
  const vignetteStrength = options.vignetteStrength !== undefined ? options.vignetteStrength : 0.35;
  const chromaticShift = options.chromaticShift !== undefined ? options.chromaticShift : 0; // px shift

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistSq = (centerX * centerX) + (centerY * centerY);

  // Pre-seed pseudo-random generator with frame to keep consistent yet dynamic grain
  let seed = (frame * 19349663 + 1234567) & 0x7fffffff;
  function fastRand() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed >> 16) / 32768.0; // 0 to 2
  }

  // Precompute vignette lookups or scan per row
  for (let y = 0; y < height; y++) {
    const dy = y - centerY;
    const dySq = dy * dy;
    const rowOffset = y * width * 4;

    for (let x = 0; x < width; x++) {
      const idx = rowOffset + (x * 4);
      const dx = x - centerX;
      const distSq = (dx * dx) + dySq;
      const vigFactor = 1.0 - (vignetteStrength * (distSq / maxDistSq));

      // Film Grain
      const noise = (fastRand() - 1.0) * grainAmount;

      let r = (data[idx] * vigFactor) + noise;
      let g = (data[idx + 1] * vigFactor) + noise;
      let b = (data[idx + 2] * vigFactor) + noise;

      data[idx] = r < 0 ? 0 : r > 255 ? 255 : r;
      data[idx + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      data[idx + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
    }
  }

  // Apply chromatic aberration if shift > 0
  if (chromaticShift > 0) {
    const shift = Math.round(chromaticShift);
    const tempCopy = new Uint8ClampedArray(data);
    for (let y = 0; y < height; y++) {
      const rowOffset = y * width * 4;
      for (let x = 0; x < width; x++) {
        const idx = rowOffset + (x * 4);
        const redX = Math.min(width - 1, x + shift);
        const blueX = Math.max(0, x - shift);
        const redIdx = rowOffset + (redX * 4);
        const blueIdx = rowOffset + (blueX * 4);

        data[idx] = tempCopy[redIdx];         // red channel from offset
        data[idx + 2] = tempCopy[blueIdx + 2]; // blue channel from opposite offset
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

module.exports = {
  applyPostProcessing
};
