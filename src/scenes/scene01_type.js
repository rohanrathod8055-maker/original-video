// Scene 01: TYPE - Kinetic Typography & Slice Displacement
const { snappyEase, easeOutBack, lerp, clamp } = require('../easing');

function renderScene01(ctx, frame, width = 1280, height = 720) {
  // frame: 60 to 119 (localFrame: 0 to 59)
  const localFrame = frame - 60;
  const t = localFrame / 60;

  if (localFrame < 22) {
    // --- PHASE 1: VIBRANT ORANGE "MOTION" SLAM & SLICE ---
    // Warm Studio Orange Background
    ctx.fillStyle = '#ff4d15';
    ctx.fillRect(0, 0, width, height);

    // Subtle dark vignette gradient
    const vig = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, 650);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);

    // Subtitle background faint repeated text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.font = 'bold 64px DejaVuSansBold, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MOTION DESIGN', width / 2, height / 2 - 120);
    ctx.fillText('MOTION DESIGN', width / 2, height / 2 + 120);

    // Slam animation (frames 0 to 10)
    const slamProgress = clamp(localFrame / 8, 0, 1);
    const slamEase = snappyEase(slamProgress);
    const scale = lerp(1.5, 1.0, slamEase);
    const opacity = clamp(localFrame / 3, 0, 1);

    // Glitch morph slice (frames 15 to 22)
    const isGlitch = localFrame >= 15;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);

    if (isGlitch) {
      // Draw sliced text with horizontal scanline offsets
      const numSlices = 7;
      const sliceHeight = 160 / numSlices;
      const startY = -80;

      for (let s = 0; s < numSlices; s++) {
        const sy = startY + s * sliceHeight;
        const glitchT = (localFrame - 15) / 7;
        const offset = Math.sin(s * 2.5 + localFrame * 1.5) * (18 * (1 - glitchT) + 30 * glitchT);

        ctx.save();
        ctx.beginPath();
        ctx.rect(-width / 2, sy, width, sliceHeight);
        ctx.clip();

        // Draw text shifted
        ctx.fillStyle = '#0e0f14';
        ctx.font = 'bold 130px DejaVuSansBold, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const morphText = glitchT > 0.5 ? 'DESIGN' : 'MOTION';
        ctx.fillText(morphText, offset, 0);

        // Subtle slice highlight line
        if (s % 2 === 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(-250 + offset, sy, 500, sliceHeight);
        }

        ctx.restore();
      }
    } else {
      // Solid bold "MOTION"
      ctx.fillStyle = '#0e0f14';
      ctx.font = 'bold 130px DejaVuSansBold, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MOTION', 0, 0);
    }

    ctx.restore();
  } else {
    // --- PHASE 2: DARK KINETIC TYPOGRAPHY WALL & HERO "DESIGN" ---
    // Deep obsidian background
    ctx.fillStyle = '#0e0f14';
    ctx.fillRect(0, 0, width, height);

    // Kinetic scrolling marquee wall
    const rowCount = 7;
    const rowHeight = 90;
    const startY = (height - (rowCount * rowHeight)) / 2 + 30;

    ctx.font = 'bold 44px DejaVuSansBold, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1.2;

    for (let r = 0; r < rowCount; r++) {
      const y = startY + r * rowHeight;
      const speed = (r % 2 === 0 ? 1 : -1) * (1.8 + (r % 3) * 0.4);
      const textXOffset = (localFrame * speed * 4) % 650;

      // Draw outlined kinetic marquee
      ctx.strokeStyle = r % 2 === 0 ? 'rgba(255, 77, 21, 0.35)' : 'rgba(200, 60, 20, 0.22)';
      ctx.fillStyle = 'rgba(255, 77, 21, 0.04)';

      for (let copy = -2; copy <= 3; copy++) {
        const x = width / 2 + textXOffset + (copy * 650);
        const textStr = 'MOTION — DESIGN — ';
        ctx.strokeText(textStr, x, y);
        ctx.fillText(textStr, x, y);
      }
    }

    // Hero Center Text: "DESIGN"
    const heroT = clamp((localFrame - 22) / 8, 0, 1);
    const heroEase = snappyEase(heroT);
    const heroScale = lerp(0.85, 1.0, heroEase);

    // Beat 3 pulse (around localFrame 45 = total frame 105)
    let beatPulse = 1.0;
    if (localFrame >= 42 && localFrame <= 54) {
      const bT = (localFrame - 42) / 12;
      beatPulse = 1.0 + 0.06 * Math.sin(bT * Math.PI);
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(heroScale * beatPulse, heroScale * beatPulse);

    // Center dark box / matte backdrop to ensure hero text pops
    ctx.fillStyle = '#0e0f14';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 30;
    ctx.fillRect(-340, -80, 680, 160);
    ctx.shadowBlur = 0;

    // Center text shadow & glow
    ctx.fillStyle = '#f5f5f0';
    ctx.font = 'bold 125px DejaVuSansBold, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Letter spacing expansion / track
    ctx.fillText('DESIGN', 0, 0);

    // Accent technical bounding box
    ctx.strokeStyle = 'rgba(255, 77, 21, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-330, -70, 660, 140);

    // Corner crosshairs on bounding box
    const chSize = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    [
      [-330, -70], [330, -70], [-330, 70], [330, 70]
    ].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.moveTo(cx - chSize, cy);
      ctx.lineTo(cx + chSize, cy);
      ctx.moveTo(cx, cy - chSize);
      ctx.lineTo(cx, cy + chSize);
      ctx.stroke();
    });

    ctx.restore();
  }
}

module.exports = {
  renderScene01
};
