// Scene 00: INTRO - Bézier Graph Editor & Easing Physics
const { sampleBezierX, sampleBezierY, solveCubicBezier, clamp, lerp, snappyEase } = require('../easing');

function renderScene00(ctx, frame, width = 1280, height = 720) {
  // frame: 0 to 59 (0.00s to 1.97s)
  const tNorm = frame / 60;

  // Background: Deep Slate Studio
  ctx.fillStyle = '#0e0f14';
  ctx.fillRect(0, 0, width, height);

  // Subtle radial gradient centered on the graph
  const bgGrad = ctx.createRadialGradient(width / 2, height / 2 - 20, 50, width / 2, height / 2 - 20, 600);
  bgGrad.addColorStop(0, 'rgba(25, 28, 38, 0.6)');
  bgGrad.addColorStop(1, 'rgba(14, 15, 20, 0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Graph dimensions
  const graphSize = 380;
  const graphX = (width - graphSize) / 2;
  const graphY = (height - graphSize) / 2 - 20;

  // Keyframe progression of Control Points
  // P1 starts at (0.33, 0.33) -> moves to (0.83, 0.00) between frames 10 and 26
  let p1x = 0.33, p1y = 0.33;
  if (frame < 10) {
    p1x = 0.33; p1y = 0.33;
  } else if (frame < 26) {
    const moveT = (frame - 10) / 16;
    const easeT = moveT * moveT * (3 - 2 * moveT);
    p1x = lerp(0.33, 0.83, easeT);
    p1y = lerp(0.33, 0.00, easeT);
  } else {
    p1x = 0.83; p1y = 0.00;
  }

  // P2 starts at (0.67, 0.67) -> moves to (0.17, 1.00) between frames 24 and 38
  let p2x = 0.67, p2y = 0.67;
  if (frame < 24) {
    p2x = 0.67; p2y = 0.67;
  } else if (frame < 38) {
    const moveT = (frame - 24) / 14;
    const easeT = moveT * moveT * (3 - 2 * moveT);
    p2x = lerp(0.67, 0.17, easeT);
    p2y = lerp(0.67, 1.00, easeT);
  } else {
    p2x = 0.17; p2y = 1.00;
  }

  // Cursor position
  let cursorX = graphX + 60, cursorY = graphY - 40;
  let cursorVisible = true;
  let cursorPressed = false;

  if (frame < 10) {
    // Glide toward P1
    const t = frame / 10;
    cursorX = lerp(graphX - 40, graphX + 0.33 * graphSize, t);
    cursorY = lerp(graphY + 40, graphY + (1 - 0.33) * graphSize, t);
  } else if (frame < 26) {
    cursorPressed = true;
    cursorX = graphX + p1x * graphSize;
    cursorY = graphY + (1 - p1y) * graphSize;
  } else if (frame < 30) {
    cursorPressed = false;
    const t = (frame - 26) / 4;
    cursorX = lerp(graphX + 0.83 * graphSize, graphX + 0.67 * graphSize, t);
    cursorY = lerp(graphY + (1 - 0.00) * graphSize, graphY + (1 - 0.67) * graphSize, t);
  } else if (frame < 38) {
    cursorPressed = true;
    cursorX = graphX + p2x * graphSize;
    cursorY = graphY + (1 - p2y) * graphSize;
  } else if (frame < 46) {
    cursorPressed = false;
    const t = (frame - 38) / 8;
    cursorX = lerp(graphX + 0.17 * graphSize, graphX - 60, t);
    cursorY = lerp(graphY + (1 - 1.00) * graphSize, graphY - 50, t);
  } else {
    cursorVisible = false;
  }

  // --- 1. Draw Graph Frame & Background Box ---
  ctx.strokeStyle = 'rgba(75, 82, 100, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(graphX, graphY, graphSize, graphSize);

  // 5x5 Grid lines inside graph
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  const gridSteps = 6;
  for (let i = 1; i < gridSteps; i++) {
    const gx = graphX + (i / gridSteps) * graphSize;
    const gy = graphY + (i / gridSteps) * graphSize;
    ctx.beginPath();
    ctx.moveTo(gx, graphY);
    ctx.lineTo(gx, graphY + graphSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(graphX, gy);
    ctx.lineTo(graphX + graphSize, gy);
    ctx.stroke();
  }

  // Graph Labels
  ctx.fillStyle = 'rgba(200, 205, 220, 0.65)';
  ctx.font = '12px DejaVuSansMonoBold, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('GRAPH EDITOR', graphX, graphY - 14);

  ctx.textAlign = 'right';
  ctx.fillText('POSITION.Y', graphX + graphSize, graphY - 14);

  // Axis Labels at bottom
  ctx.fillStyle = 'rgba(150, 155, 170, 0.55)';
  ctx.font = '11px DejaVuSansMono, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('0f', graphX, graphY + graphSize + 8);

  ctx.textAlign = 'center';
  ctx.fillText('TIME', graphX + graphSize / 2, graphY + graphSize + 8);

  ctx.textAlign = 'right';
  ctx.fillText('14f', graphX + graphSize, graphY + graphSize + 8);

  // --- 2. Draw Handle Stick Lines & Control Nodes ---
  const pt0 = { x: graphX, y: graphY + graphSize };
  const pt1 = { x: graphX + p1x * graphSize, y: graphY + (1 - p1y) * graphSize };
  const pt2 = { x: graphX + p2x * graphSize, y: graphY + (1 - p2y) * graphSize };
  const pt3 = { x: graphX + graphSize, y: graphY };

  // Handle line P0 -> P1
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(pt0.x, pt0.y);
  ctx.lineTo(pt1.x, pt1.y);
  ctx.stroke();

  // Handle line P3 -> P2
  ctx.beginPath();
  ctx.moveTo(pt3.x, pt3.y);
  ctx.lineTo(pt2.x, pt2.y);
  ctx.stroke();

  // Handle control dots (circles)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(pt1.x, pt1.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(pt2.x, pt2.y, 4, 0, Math.PI * 2);
  ctx.fill();

  // --- 3. Draw The Dynamic Bézier Curve ---
  ctx.strokeStyle = '#ff4d15';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  const curveSteps = 100;
  for (let s = 0; s <= curveSteps; s++) {
    const t = s / curveSteps;
    const bx = sampleBezierX(t, p1x, p2x);
    const by = sampleBezierY(t, p1y, p2y);
    const px = graphX + bx * graphSize;
    const py = graphY + (1 - by) * graphSize;
    if (s === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Draw Start Diamond (White) at P0
  ctx.save();
  ctx.translate(pt0.x, pt0.y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-6, -6, 12, 12);
  ctx.restore();

  // Draw End Diamond (Orange) at P3
  ctx.save();
  ctx.translate(pt3.x, pt3.y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#ff4d15';
  ctx.fillRect(-6, -6, 12, 12);
  ctx.restore();

  // --- 4. Animated Playhead Orb / Acceleration Demonstration ---
  if (frame >= 36) {
    const orbDuration = 20; // from frame 36 to 56
    const orbProg = clamp((frame - 36) / orbDuration, 0, 1);
    // Evaluate position along curve using the solved bezier ease
    const orbYNorm = solveCubicBezier(orbProg, p1x, p1y, p2x, p2y);
    const orbX = graphX + orbProg * graphSize;
    const orbY = graphY + (1 - orbYNorm) * graphSize;

    // Draw motion trail / ghost echoes behind the orb
    for (let g = 1; g <= 8; g++) {
      const prevProg = clamp(orbProg - (g * 0.025), 0, 1);
      const prevYNorm = solveCubicBezier(prevProg, p1x, p1y, p2x, p2y);
      const prevX = graphX + prevProg * graphSize;
      const prevY = graphY + (1 - prevYNorm) * graphSize;
      const ghostAlpha = (1 - g / 9) * 0.45;

      ctx.fillStyle = `rgba(255, 100, 30, ${ghostAlpha})`;
      ctx.beginPath();
      ctx.arc(prevX, prevY, 5 - g * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main kinetic orb
    const glowGrad = ctx.createRadialGradient(orbX, orbY, 2, orbX, orbY, 18);
    glowGrad.addColorStop(0, '#ffffff');
    glowGrad.addColorStop(0.4, 'rgba(255, 120, 40, 0.9)');
    glowGrad.addColorStop(1, 'rgba(255, 77, 21, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(orbX, orbY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Shockwave burst on arrival (frames 55 - 59)
    if (frame >= 54) {
      const burstT = (frame - 54) / 6;
      ctx.strokeStyle = `rgba(255, 120, 50, ${1 - burstT})`;
      ctx.lineWidth = 2.5 * (1 - burstT);
      ctx.beginPath();
      ctx.arc(pt3.x, pt3.y, burstT * 120, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // --- 5. Realtime Cubic-Bezier Formula Readout ---
  ctx.fillStyle = 'rgba(235, 238, 245, 0.95)';
  ctx.font = '16px DejaVuSansMonoBold, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const formulaStr = `cubic-bezier(${p1x.toFixed(2)}, ${p1y.toFixed(2)}, ${p2x.toFixed(2)}, ${p2y.toFixed(2)})`;
  ctx.fillText(formulaStr, width / 2, graphY + graphSize + 36);

  // --- 6. Draw Mouse Cursor ---
  if (cursorVisible) {
    ctx.save();
    ctx.translate(cursorX, cursorY);
    // Draw crisp OS pointer arrow
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(5, 14);
    ctx.lineTo(9, 22);
    ctx.lineTo(12, 21);
    ctx.lineTo(8, 13);
    ctx.lineTo(13, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

module.exports = {
  renderScene00
};
