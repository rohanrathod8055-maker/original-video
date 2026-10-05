// Scene 05: RHYTHM - Kinetic Typography Experiments (4 Beats)
const { snappyEase, easeOutBack, easeOutExpo, clamp, lerp } = require('../easing');

function drawTrackingText(ctx, text, x, y, spacing) {
  const chars = text.split('');
  const widths = chars.map(c => ctx.measureText(c).width);
  const totalWidth = widths.reduce((sum, w) => sum + w, 0) + (chars.length - 1) * spacing;
  let curX = x - totalWidth / 2;

  chars.forEach((c, idx) => {
    ctx.fillText(c, curX + widths[idx] / 2, y);
    curX += widths[idx] + spacing;
  });
}

function renderScene05(ctx, frame, width = 1280, height = 720) {
  // frame: 300 to 359 (localFrame: 0 to 59)
  const localFrame = frame - 300;
  const beat = Math.floor(localFrame / 15); // 0, 1, 2, 3
  const beatF = localFrame % 15;            // 0 to 14
  const beatT = beatF / 15;

  if (beat === 0) {
    // --- 5A: "EASE" on Warm Orange ---
    ctx.fillStyle = '#ff4d15';
    ctx.fillRect(0, 0, width, height);

    // Snappy entrance from left to center within first 6 frames
    const inT = clamp(beatF / 7, 0, 1);
    const easeT = snappyEase(inT);
    const textX = lerp(width / 2 - 320, width / 2, easeT);

    // Ghost echo slices (scanline motion blur)
    const numSlices = 7;
    const sliceH = 160 / numSlices;
    const startY = height / 2 - 80;

    for (let s = 0; s < numSlices; s++) {
      const sy = startY + s * sliceH;
      const sliceDelay = s * 0.04;
      const delayedT = snappyEase(clamp((beatF - s * 0.4) / 7, 0, 1));
      const sliceX = lerp(width / 2 - 360, width / 2, delayedT);

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, sy, width, sliceH);
      ctx.clip();

      ctx.fillStyle = '#0e0f14';
      ctx.font = 'bold 150px DejaVuSansBold, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('EASE', sliceX, height / 2);

      // Subtle horizontal scan lines
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, sy, width, sliceH);

      ctx.restore();
    }

    // Telemetry
    ctx.fillStyle = '#0e0f14';
    ctx.font = '14px DejaVuSansMonoBold, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('cubic-bezier(0.83, 0, 0.17, 1)', width / 2, height / 2 + 105);

  } else if (beat === 1) {
    // --- 5B: "WEIGHT" on Deep Crimson ---
    ctx.fillStyle = '#9c1c04';
    ctx.fillRect(0, 0, width, height);

    const weightT = snappyEase(beatT);

    ctx.save();
    ctx.translate(width / 2, height / 2);

    // Dynamic stroke & fill morphing
    ctx.font = 'bold 130px DejaVuSansBold, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (weightT < 0.6) {
      // Outline thin to medium
      const strokeW = lerp(1.5, 14, weightT / 0.6);
      ctx.strokeStyle = '#f5f5f0';
      ctx.lineWidth = strokeW;
      ctx.strokeText('WEIGHT', 0, 0);
    } else {
      // Chunky heavy solid fill + heavy stroke expansion
      ctx.fillStyle = '#f5f5f0';
      ctx.fillText('WEIGHT', 0, 0);
      ctx.strokeStyle = '#f5f5f0';
      ctx.lineWidth = lerp(8, 22, (weightT - 0.6) / 0.4);
      ctx.strokeText('WEIGHT', 0, 0);
    }

    ctx.restore();

    // Telemetry
    const currentWeight = Math.round(lerp(100, 900, weightT));
    ctx.fillStyle = 'rgba(245, 245, 240, 0.9)';
    ctx.font = '14px DejaVuSansMonoBold, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`font-weight: 100 → ${currentWeight}`, width / 2, height / 2 + 105);

  } else if (beat === 2) {
    // --- 5C: "SPACE" on Clean Ivory ---
    ctx.fillStyle = '#f2f1ec';
    ctx.fillRect(0, 0, width, height);

    const spaceEase = snappyEase(beatT);
    const tracking = lerp(-20, 48, spaceEase);

    ctx.fillStyle = '#0e0f14';
    ctx.font = 'bold 125px DejaVuSansBold, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    drawTrackingText(ctx, 'SPACE', width / 2, height / 2, tracking);

    // Telemetry
    const emVal = lerp(-0.06, 0.32, spaceEase).toFixed(2);
    ctx.fillStyle = 'rgba(14, 15, 20, 0.85)';
    ctx.font = '14px DejaVuSansMonoBold, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`letter-spacing: -0.06em → ${emVal}em`, width / 2, height / 2 + 105);

  } else {
    // --- 5D: "SCALE" on Deep Obsidian ---
    ctx.fillStyle = '#0e0f14';
    ctx.fillRect(0, 0, width, height);

    const scaleEase = easeOutBack(beatT, 1.6);
    const curScale = lerp(0.25, 1.25, scaleEase);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(curScale, curScale);

    // Framing crosshairs
    const boxW = 540;
    const boxH = 140;
    ctx.strokeStyle = 'rgba(255, 77, 21, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

    // Center Hero Text
    ctx.fillStyle = '#ff4d15';
    ctx.font = 'bold 130px DejaVuSansBold, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCALE', 0, 0);

    ctx.restore();

    // Telemetry
    ctx.fillStyle = 'rgba(235, 238, 245, 0.85)';
    ctx.font = '14px DejaVuSansMonoBold, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`transform: scale(0.25) → scale(${curScale.toFixed(2)})`, width / 2, height / 2 + 105);
  }
}

function getScene05IsDark(frame) {
  const localFrame = frame - 300;
  const beat = Math.floor(localFrame / 15);
  // Beat 0: Orange (not dark), Beat 1: Crimson (dark), Beat 2: Ivory (not dark), Beat 3: Obsidian (dark)
  return beat === 1 || beat === 3;
}

module.exports = {
  renderScene05,
  getScene05IsDark
};
