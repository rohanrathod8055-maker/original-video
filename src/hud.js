// Dynamic HUD Overlay System for Motion Reel

function formatTimecode(frame, fps = 30) {
  const totalSeconds = Math.floor(frame / fps);
  const ff = frame % fps;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return `TC ${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(ff)}`;
}

function drawHUD(ctx, frame, options = {}) {
  const width = options.width || 1280;
  const height = options.height || 720;
  const isDarkBg = options.isDarkBg !== false;
  const sceneName = options.sceneName || '00 / INTRO';
  const brandTitle = options.brandTitle || 'ARENA — MOTION REEL 2026';

  const marginX = 32;
  const marginY = 32;
  const bracketSize = 16;
  const strokeWidth = 1.5;

  const primaryColor = isDarkBg ? 'rgba(240, 243, 250, 0.92)' : '#0e0f14';
  const dimColor = isDarkBg ? 'rgba(150, 155, 170, 0.55)' : 'rgba(14, 15, 20, 0.45)';

  ctx.save();

  // Subtle dark drop shadow to guarantee HUD legibility over any graphics
  ctx.shadowColor = isDarkBg ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.3)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  // 1. TOP-LEFT CORNER: Bracket + Brand Title
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'square';

  // Bracket Top-Left ┌
  ctx.beginPath();
  ctx.moveTo(marginX, marginY + bracketSize);
  ctx.lineTo(marginX, marginY);
  ctx.lineTo(marginX + bracketSize, marginY);
  ctx.stroke();

  // Top-Left Text
  ctx.fillStyle = primaryColor;
  ctx.font = '13px DejaVuSansMonoBold, DejaVuSansMono, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(brandTitle, marginX + bracketSize + 12, marginY - 1);

  // 2. TOP-RIGHT CORNER: Timecode + Bracket
  const timecodeStr = formatTimecode(frame, 30);

  // Bracket Top-Right ┐
  ctx.beginPath();
  ctx.moveTo(width - marginX - bracketSize, marginY);
  ctx.lineTo(width - marginX, marginY);
  ctx.lineTo(width - marginX, marginY + bracketSize);
  ctx.stroke();

  // Top-Right Text
  ctx.fillStyle = primaryColor;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(timecodeStr, width - marginX - bracketSize - 12, marginY - 1);

  // 3. BOTTOM-LEFT CORNER: Bracket + Scene Info
  // Bracket Bottom-Left └
  ctx.beginPath();
  ctx.moveTo(marginX, height - marginY - bracketSize);
  ctx.lineTo(marginX, height - marginY);
  ctx.lineTo(marginX + bracketSize, height - marginY);
  ctx.stroke();

  // Bottom-Left Text
  ctx.fillStyle = primaryColor;
  ctx.font = '13px DejaVuSansMonoBold, DejaVuSansMono, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(sceneName, marginX + bracketSize + 12, height - marginY + 1);

  // 4. BOTTOM-RIGHT CORNER: Metronome Sequencer + Bracket
  // Bracket Bottom-Right ┘
  ctx.beginPath();
  ctx.moveTo(width - marginX - bracketSize, height - marginY);
  ctx.lineTo(width - marginX, height - marginY);
  ctx.lineTo(width - marginX, height - marginY - bracketSize);
  ctx.stroke();

  // 120 BPM Sequencer
  const beatIndex = Math.floor(frame / 15) % 4;
  const beatProgress = (frame % 15) / 15;

  ctx.font = '13px DejaVuSansMonoBold, DejaVuSansMono, monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  const bpmText = '120 BPM ';
  const bpmX = width - marginX - bracketSize - 62;
  ctx.fillStyle = primaryColor;
  ctx.fillText(bpmText, bpmX, height - marginY + 1);

  // Draw 4 metronome beat indicators
  const boxSize = 7;
  const boxSpacing = 3.5;
  const startBoxX = bpmX + 4;
  const boxY = height - marginY - boxSize - 1;

  for (let b = 0; b < 4; b++) {
    const curX = startBoxX + b * (boxSize + boxSpacing);
    if (b === beatIndex) {
      const pulseAlpha = 0.8 + 0.2 * Math.cos(beatProgress * Math.PI);
      ctx.fillStyle = isDarkBg ? `rgba(255, 77, 21, ${pulseAlpha})` : `rgba(220, 45, 10, ${pulseAlpha})`;
      ctx.fillRect(curX, boxY, boxSize, boxSize);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(curX, boxY, boxSize, boxSize);
    } else {
      ctx.strokeStyle = dimColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(curX, boxY, boxSize, boxSize);
    }
  }

  ctx.restore();
}

module.exports = {
  formatTimecode,
  drawHUD
};
