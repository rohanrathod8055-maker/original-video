// Scene 03: DEPTH - 3D Isometric Voxel Arena & Cyber Surface
const { clamp, lerp } = require('../easing');

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function shadeColor(hex, factor) {
  const [r, g, b] = hexToRgb(hex);
  const nr = Math.min(255, Math.max(0, Math.round(r * factor)));
  const ng = Math.min(255, Math.max(0, Math.round(g * factor)));
  const nb = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `rgb(${nr},${ng},${nb})`;
}

// Deterministic voxel color assignment
const COLOR_TYPES = ['charcoal', 'orange', 'blue', 'white'];
const voxelColorMap = {};

let vSeed = 1337;
function vRand() {
  vSeed = (vSeed * 9301 + 49297) % 233280;
  return vSeed / 233280;
}

for (let u = -22; u <= 22; u++) {
  for (let v = -22; v <= 22; v++) {
    const key = `${u},${v}`;
    const r = Math.hypot(u, v);
    const rnd = vRand();
    let colType = 'charcoal';
    if (r < 14) {
      if (rnd < 0.28) colType = 'orange';
      else if (rnd < 0.58) colType = 'blue';
      else if (rnd < 0.78) colType = 'white';
      else colType = 'charcoal';
    }
    voxelColorMap[key] = colType;
  }
}

function renderScene03(ctx, frame, width = 1280, height = 720) {
  // frame: 180 to 239 (localFrame: 0 to 59)
  const localFrame = frame - 180;

  // Background: Dark Slate Void
  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(0, 0, width, height);

  // Subtle radial ambient floor glow
  const floorGlow = ctx.createRadialGradient(width / 2, height / 2 + 30, 50, width / 2, height / 2 + 30, 600);
  floorGlow.addColorStop(0, 'rgba(45, 60, 95, 0.35)');
  floorGlow.addColorStop(1, 'rgba(11, 12, 16, 0)');
  ctx.fillStyle = floorGlow;
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2 + 45;

  const GRID_RADIUS = 16;
  const TILE_W = 19; // isometric tile half-width
  const TILE_H = 10.5; // isometric tile half-height

  // Beat pulses at localFrame 0 and 30
  const beat1T = clamp(localFrame / 22, 0, 1);
  const beat2T = clamp((localFrame - 28) / 22, 0, 1);

  const voxels = [];

  for (let u = -GRID_RADIUS; u <= GRID_RADIUS; u++) {
    for (let v = -GRID_RADIUS; v <= GRID_RADIUS; v++) {
      const r = Math.hypot(u, v);
      if (r > GRID_RADIUS + 0.5) continue;

      const isWall = r >= GRID_RADIUS - 1.2;

      // Base undulating wave
      let z = Math.sin(r * 0.7 - localFrame * 0.32) * 12;

      // Center tower surge on Beat 1 (localFrame 0-25)
      if (r < 4.0) {
        const falloff = 1 - r / 4.0;
        const blast1 = Math.exp(-beat1T * 3.5) * Math.sin(beat1T * Math.PI) * 160 * falloff;
        z += blast1;
      }

      // Expanding concentric ripple wave 1
      const waveRadius1 = beat1T * 20;
      const dist1 = Math.abs(r - waveRadius1);
      if (dist1 < 3.2) {
        z += (1 - dist1 / 3.2) * 45 * Math.exp(-beat1T * 1.8);
      }

      // Center tower surge on Beat 2 (localFrame 28-55)
      if (localFrame >= 28) {
        if (r < 4.0) {
          const falloff = 1 - r / 4.0;
          const blast2 = Math.exp(-beat2T * 3.5) * Math.sin(beat2T * Math.PI) * 170 * falloff;
          z += blast2;
        }
        const waveRadius2 = beat2T * 20;
        const dist2 = Math.abs(r - waveRadius2);
        if (dist2 < 3.2) {
          z += (1 - dist2 / 3.2) * 48 * Math.exp(-beat2T * 1.8);
        }
      }

      // Outer Arena Amphitheater Wall
      if (isWall) {
        const wallUndulate = Math.sin(Math.atan2(v, u) * 6 + localFrame * 0.2) * 8;
        z += 42 + wallUndulate;
      }

      // Pillar base height
      const pillarHeight = isWall ? 48 : 28 + Math.max(0, z * 0.7);

      // Determine color
      const cType = voxelColorMap[`${u},${v}`] || 'charcoal';
      let baseColor = '#222530';

      if (isWall) {
        baseColor = '#555b6e';
      } else if (r < 2.0 && z > 50) {
        baseColor = '#ffffff'; // gleaming white center monolith
      } else if (cType === 'orange') {
        baseColor = z > 15 ? '#ff5500' : '#bb3d00';
      } else if (cType === 'blue') {
        baseColor = z > 15 ? '#3058ff' : '#1e38bb';
      } else if (cType === 'white') {
        baseColor = z > 15 ? '#f5f5f0' : '#888b99';
      } else {
        baseColor = (u + v) % 2 === 0 ? '#262a38' : '#1c1f2b';
      }

      voxels.push({
        u,
        v,
        z,
        pillarHeight,
        baseColor,
        depth: u + v
      });
    }
  }

  // Sort voxels back-to-front
  voxels.sort((a, b) => a.depth - b.depth);

  // Render Voxels
  for (let i = 0; i < voxels.length; i++) {
    const vox = voxels[i];
    const screenX = centerX + (vox.u - vox.v) * TILE_W;
    const screenY = centerY + (vox.u + vox.v) * TILE_H - vox.z;
    const h = vox.pillarHeight;

    const topC = vox.baseColor;
    const rightC = shadeColor(vox.baseColor, 0.70);
    const leftC = shadeColor(vox.baseColor, 0.45);

    // 1. LEFT FACE
    ctx.fillStyle = leftC;
    ctx.beginPath();
    ctx.moveTo(screenX - TILE_W, screenY);
    ctx.lineTo(screenX, screenY + TILE_H);
    ctx.lineTo(screenX, screenY + TILE_H + h);
    ctx.lineTo(screenX - TILE_W, screenY + h);
    ctx.closePath();
    ctx.fill();

    // 2. RIGHT FACE
    ctx.fillStyle = rightC;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY + TILE_H);
    ctx.lineTo(screenX + TILE_W, screenY);
    ctx.lineTo(screenX + TILE_W, screenY + h);
    ctx.lineTo(screenX, screenY + TILE_H + h);
    ctx.closePath();
    ctx.fill();

    // 3. TOP FACE
    ctx.fillStyle = topC;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - TILE_H);
    ctx.lineTo(screenX + TILE_W, screenY);
    ctx.lineTo(screenX, screenY + TILE_H);
    ctx.lineTo(screenX - TILE_W, screenY);
    ctx.closePath();
    ctx.fill();

    // Subtle edge line
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

module.exports = {
  renderScene03
};
