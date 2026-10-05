// Scene 06: HELLO - Showreel Identity Finale
const { snappyEase, easeOutExpo, easeOutBack, clamp, lerp } = require('../easing');

function renderScene06(ctx, frame, width = 1280, height = 720, brandName = 'ARENA') {
  // frame: 360 to 450 (localFrame: 0 to 90)
  const localFrame = frame - 360;

  // Background: Deep Obsidian
  ctx.fillStyle = '#0c0d12';
  ctx.fillRect(0, 0, width, height);

  // Subtle warm ambient radial backlight
  const bgGlow = ctx.createRadialGradient(width / 2, height / 2 - 40, 40, width / 2, height / 2 - 40, 520);
  bgGlow.addColorStop(0, 'rgba(45, 30, 25, 0.45)');
  bgGlow.addColorStop(0.6, 'rgba(20, 22, 30, 0.25)');
  bgGlow.addColorStop(1, 'rgba(12, 13, 18, 0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, width, height);

  // Fade out to black on final 15 frames (frames 75 to 90)
  let fadeAlpha = 1.0;
  if (localFrame > 75) {
    fadeAlpha = 1.0 - clamp((localFrame - 75) / 15, 0, 1);
  }

  // --- 1. HERO TITLE: "ARENA" / "CLAUDE" with Orange Dot ---
  const heroT = clamp(localFrame / 14, 0, 1);
  const heroEase = snappyEase(heroT);
  const heroScale = lerp(0.85, 1.0, heroEase);
  const heroOpacity = clamp(localFrame / 8, 0, 1) * fadeAlpha;

  ctx.save();
  ctx.globalAlpha = heroOpacity;
  ctx.translate(width / 2, height / 2 - 50);
  ctx.scale(heroScale, heroScale);

  // Measure text and dot
  ctx.font = 'bold 140px DejaVuSansBold, sans-serif';
  const nameWidth = ctx.measureText(brandName).width;
  const dotRadius = 13;
  const dotSpacing = 16;
  const totalHeroWidth = nameWidth + dotSpacing + (dotRadius * 2);

  const startX = -totalHeroWidth / 2;

  // Draw Hero Name
  ctx.fillStyle = '#f5f5f0';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(brandName, startX, 0);

  // Draw Radiant Orange Accent Dot
  const dotCenterX = startX + nameWidth + dotSpacing + dotRadius;
  const dotCenterY = 16; // baseline aligned

  // Dot ambient bloom
  const dotBloom = ctx.createRadialGradient(dotCenterX, dotCenterY, 2, dotCenterX, dotCenterY, 32);
  dotBloom.addColorStop(0, '#ff6525');
  dotBloom.addColorStop(0.4, 'rgba(255, 77, 21, 0.7)');
  dotBloom.addColorStop(1, 'rgba(255, 77, 21, 0)');
  ctx.fillStyle = dotBloom;
  ctx.beginPath();
  ctx.arc(dotCenterX, dotCenterY, 32, 0, Math.PI * 2);
  ctx.fill();

  // Solid Dot
  ctx.fillStyle = '#ff4d15';
  ctx.beginPath();
  ctx.arc(dotCenterX, dotCenterY, dotRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // --- 2. SUBTITLE: "Motion Designer" (Editorial Italic Serif) ---
  const subT = clamp((localFrame - 10) / 16, 0, 1);
  const subEase = snappyEase(subT);
  const subY = lerp(height / 2 + 75, height / 2 + 55, subEase);
  const subOpacity = clamp((localFrame - 10) / 12, 0, 1) * fadeAlpha;

  if (subOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = subOpacity;
    ctx.fillStyle = '#e5e5e0';
    ctx.font = 'italic 58px DejaVuSerifItalic, DejaVuSerif, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Motion Designer', width / 2 - totalHeroWidth / 2 + 6, subY);
    ctx.restore();
  }

  // --- 3. LOWER THIRD DIVIDER LINE ---
  const lineT = clamp((localFrame - 22) / 18, 0, 1);
  const lineEase = snappyEase(lineT);
  const lineOpacity = clamp((localFrame - 22) / 10, 0, 1) * fadeAlpha;

  const lineY = height - 150;
  const maxLineW = width - 180;
  const curLineW = maxLineW * lineEase;

  if (lineOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = lineOpacity;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo((width - curLineW) / 2, lineY);
    ctx.lineTo((width + curLineW) / 2, lineY);
    ctx.stroke();

    // Shimmer highlight traversing the line
    if (localFrame > 35) {
      const shimT = ((localFrame - 35) * 12) % (maxLineW + 200);
      const shimX = (width - maxLineW) / 2 + shimT - 100;
      const shimGrad = ctx.createLinearGradient(shimX - 60, lineY, shimX + 60, lineY);
      shimGrad.addColorStop(0, 'rgba(255, 77, 21, 0)');
      shimGrad.addColorStop(0.5, 'rgba(255, 120, 50, 0.8)');
      shimGrad.addColorStop(1, 'rgba(255, 77, 21, 0)');
      ctx.strokeStyle = shimGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.max((width - maxLineW) / 2, shimX - 60), lineY);
      ctx.lineTo(Math.min((width + maxLineW) / 2, shimX + 60), lineY);
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- 4. LOWER TELEMETRY & AVAILABILITY STATUS ---
  const infoOpacity = clamp((localFrame - 28) / 12, 0, 1) * fadeAlpha;

  if (infoOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = infoOpacity;

    const infoY = lineY + 28;

    // Left Telemetry: "SHOWREEL 2026 — EVERY FRAME IS CODE"
    ctx.fillStyle = 'rgba(190, 195, 210, 0.75)';
    ctx.font = '13px DejaVuSansMonoBold, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('SHOWREEL 2026 — EVERY FRAME IS CODE', (width - maxLineW) / 2, infoY);

    // Right Status Badge: "● AVAILABLE FOR WORK"
    const statusText = 'AVAILABLE FOR WORK';
    ctx.textAlign = 'right';
    const textW = ctx.measureText(statusText).width;
    const badgeRightX = (width + maxLineW) / 2;
    const badgeTextX = badgeRightX;
    const badgeDotX = badgeRightX - textW - 14;
    const badgeDotY = infoY + 6;

    // Pulsing Neon Status Dot (Lime Green / Emerald with breathing halo)
    const pulsePhase = (localFrame * 0.18) % (Math.PI * 2);
    const pulseScale = 1.0 + 0.25 * Math.sin(pulsePhase);
    const pulseAlpha = 0.65 + 0.35 * Math.sin(pulsePhase);

    // Halo
    const haloGrad = ctx.createRadialGradient(badgeDotX, badgeDotY, 1, badgeDotX, badgeDotY, 10 * pulseScale);
    haloGrad.addColorStop(0, `rgba(100, 255, 120, ${0.9 * pulseAlpha})`);
    haloGrad.addColorStop(0.5, `rgba(80, 220, 100, ${0.4 * pulseAlpha})`);
    haloGrad.addColorStop(1, 'rgba(80, 220, 100, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(badgeDotX, badgeDotY, 10 * pulseScale, 0, Math.PI * 2);
    ctx.fill();

    // Solid Dot
    ctx.fillStyle = '#a6ff54';
    ctx.beginPath();
    ctx.arc(badgeDotX, badgeDotY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Status Text
    ctx.fillStyle = 'rgba(235, 238, 245, 0.88)';
    ctx.fillText(statusText, badgeTextX, infoY);

    ctx.restore();
  }

  // Global Fade to Black overlay
  if (localFrame > 75) {
    const fadeProg = clamp((localFrame - 75) / 15, 0, 1);
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeProg})`;
    ctx.fillRect(0, 0, width, height);
  }
}

module.exports = {
  renderScene06
};
