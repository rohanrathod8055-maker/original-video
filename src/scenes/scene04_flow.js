// Scene 04: FLOW - 3D Particle Vortex & Vector Field
const { clamp, lerp } = require('../easing');

const NUM_PARTICLES = 6500;
const particles = [];

let pSeed = 7777;
function pRand() {
  pSeed = (pSeed * 9301 + 49297) % 233280;
  return pSeed / 233280;
}

for (let i = 0; i < NUM_PARTICLES; i++) {
  const arm = Math.floor(pRand() * 3); // 3 spiral arms
  const baseAngle = (arm * Math.PI * 2 / 3);
  const r = 85 + Math.pow(pRand(), 1.2) * 220; // hollow core at 85px out to 305px

  particles.push({
    arm,
    theta: baseAngle + pRand() * (Math.PI * 2 / 3) + (r * 0.015),
    r,
    zBase: (pRand() - 0.5) * 90,
    speed: 0.038 + (300 / (r + 50)) * 0.045, // faster near center
    swirlZ: 0.05 + pRand() * 0.05,
    colorType: pRand() < 0.38 ? 'orange' : pRand() < 0.72 ? 'blue' : pRand() < 0.90 ? 'white' : 'charcoal',
    streakLen: 2.2 + pRand() * 2.8,
    width: 0.8 + pRand() * 1.1
  });
}

function renderScene04(ctx, frame, width = 1280, height = 720) {
  // frame: 240 to 299 (localFrame: 0 to 59)
  const localFrame = frame - 240;

  // Background: Deep Dark Space
  ctx.fillStyle = '#06070a';
  ctx.fillRect(0, 0, width, height);

  // Subtle deep ambient radial glow
  const coreGlow = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, 500);
  coreGlow.addColorStop(0, 'rgba(40, 25, 60, 0.28)');
  coreGlow.addColorStop(0.5, 'rgba(20, 30, 60, 0.18)');
  coreGlow.addColorStop(1, 'rgba(6, 7, 10, 0)');
  ctx.fillStyle = coreGlow;
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;

  // 3D Camera Angles
  const tiltX = 42 * (Math.PI / 180); // 42 degree tilt
  const tiltY = -22 * (Math.PI / 180); // diagonal yaw
  const rotZ = localFrame * 0.018;

  const cosTiltX = Math.cos(tiltX);
  const sinTiltX = Math.sin(tiltX);
  const cosTiltY = Math.cos(tiltY);
  const sinTiltY = Math.sin(tiltY);
  const cosRotZ = Math.cos(rotZ);
  const sinRotZ = Math.sin(rotZ);

  const focal = 680;

  // Pulse at localFrame 28
  const pulseT = clamp((localFrame - 28) / 18, 0, 1);
  const pulseExp = 1.0 + 0.14 * Math.sin(pulseT * Math.PI);

  const projectedList = [];

  for (let i = 0; i < NUM_PARTICLES; i++) {
    const p = particles[i];

    // Current angle and radius
    const curTheta = p.theta + localFrame * p.speed;
    const curR = p.r * pulseExp;
    const curZ = p.zBase + Math.sin(curTheta * 2 + localFrame * p.swirlZ) * 35;

    // Previous point for velocity streak
    const prevTheta = curTheta - (p.streakLen * p.speed * 0.5);
    const prevR = curR;
    const prevZ = p.zBase + Math.sin(prevTheta * 2 + (localFrame - 1) * p.swirlZ) * 35;

    // 3D Coordinates
    const x0 = curR * Math.cos(curTheta);
    const y0 = curR * Math.sin(curTheta);
    const z0 = curZ;

    const px0 = prevR * Math.cos(prevTheta);
    const py0 = prevR * Math.sin(prevTheta);
    const pz0 = prevZ;

    // 3D Rotation (RotZ -> TiltX -> TiltY)
    // Current point
    const rz_x = x0 * cosRotZ - y0 * sinRotZ;
    const rz_y = x0 * sinRotZ + y0 * cosRotZ;
    const rz_z = z0;

    const rx_x = rz_x;
    const rx_y = rz_y * cosTiltX - rz_z * sinTiltX;
    const rx_z = rz_y * sinTiltX + rz_z * cosTiltX;

    const xFinal = rx_x * cosTiltY + rx_z * sinTiltY;
    const yFinal = rx_y;
    const zFinal = -rx_x * sinTiltY + rx_z * cosTiltY;

    // Previous point
    const prz_x = px0 * cosRotZ - py0 * sinRotZ;
    const prz_y = px0 * sinRotZ + py0 * cosRotZ;
    const prz_z = pz0;

    const prx_x = prz_x;
    const prx_y = prz_y * cosTiltX - prz_z * sinTiltX;
    const prx_z = prz_y * sinTiltX + prz_z * cosTiltX;

    const pxFinal = prx_x * cosTiltY + prx_z * sinTiltY;
    const pyFinal = prx_y;
    const pzFinal = -prx_x * sinTiltY + prx_z * cosTiltY;

    // Perspective Projection
    const scale = focal / (focal + zFinal + 250);
    const prevScale = focal / (focal + pzFinal + 250);

    const screenX = centerX + xFinal * scale;
    const screenY = centerY + yFinal * scale;
    const prevScreenX = centerX + pxFinal * prevScale;
    const prevScreenY = centerY + pyFinal * prevScale;

    // Depth Alpha
    const depthNorm = clamp((zFinal + 150) / 300, 0, 1);
    const alpha = (0.28 + 0.72 * depthNorm) * clamp(scale * 1.1, 0.2, 1.0);

    projectedList.push({
      x1: screenX,
      y1: screenY,
      x0: prevScreenX,
      y0: prevScreenY,
      z: zFinal,
      alpha,
      colorType: p.colorType,
      width: p.width * scale
    });
  }

  // Sort back-to-front
  projectedList.sort((a, b) => a.z - b.z);

  // Render particle streaks
  for (let i = 0; i < projectedList.length; i++) {
    const pt = projectedList[i];
    if (pt.alpha <= 0.05) continue;

    let strokeStyle = 'rgba(255, 255, 255, ';
    if (pt.colorType === 'orange') {
      strokeStyle = `rgba(255, 105, 30, ${pt.alpha})`;
    } else if (pt.colorType === 'blue') {
      strokeStyle = `rgba(60, 120, 255, ${pt.alpha * 0.95})`;
    } else if (pt.colorType === 'white') {
      strokeStyle = `rgba(245, 248, 255, ${pt.alpha})`;
    } else {
      strokeStyle = `rgba(90, 105, 145, ${pt.alpha * 0.55})`;
    }

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = Math.max(0.6, pt.width);
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(pt.x0, pt.y0);
    ctx.lineTo(pt.x1, pt.y1);
    ctx.stroke();

    // Occasional bright head dot on highlights
    if (pt.colorType === 'white' && pt.alpha > 0.5) {
      ctx.fillStyle = `rgba(255, 255, 255, ${pt.alpha})`;
      ctx.beginPath();
      ctx.arc(pt.x1, pt.y1, pt.width * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

module.exports = {
  renderScene04
};
