// Scene 02: SHAPE - Generative Bauhaus Geometry
const { easeOutBack, clamp } = require('../easing');

const PALETTE = [
  '#ff4d15', // Radiant Vermilion Orange
  '#2b4cff', // Electric Cobalt Blue
  '#f2f1ec', // Chalk Cream
  '#1a1c24'  // Dark Slate Charcoal
];

const COLS = 10;
const ROWS = 6;
const CELL_W = 1280 / COLS;
const CELL_H = 720 / ROWS;

const tileMap = [];
let seed = 42;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

for (let r = 0; r < ROWS; r++) {
  const row = [];
  for (let c = 0; c < COLS; c++) {
    const quadrants = [
      { color: Math.floor(rand() * 4), rot: Math.floor(rand() * 4) },
      { color: Math.floor(rand() * 4), rot: Math.floor(rand() * 4) },
      { color: Math.floor(rand() * 4), rot: Math.floor(rand() * 4) },
      { color: Math.floor(rand() * 4), rot: Math.floor(rand() * 4) }
    ];
    row.push(quadrants);
  }
  tileMap.push(row);
}

function renderScene02(ctx, frame, width = 1280, height = 720) {
  // frame: 120 to 179 (localFrame: 0 to 59)
  const localFrame = frame - 120;

  // Background: Deep Charcoal
  ctx.fillStyle = '#0c0d12';
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.hypot(centerX, centerY);

  const beatIndex = Math.floor(localFrame / 15);
  const beatFrame = localFrame % 15;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cellCenterX = c * CELL_W + CELL_W / 2;
      const cellCenterY = r * CELL_H + CELL_H / 2;
      const dist = Math.hypot(cellCenterX - centerX, cellCenterY - centerY);
      const distNorm = dist / maxDist;

      const waveDelay = distNorm * 9.5;
      const activeFrame = beatFrame - waveDelay;

      let rotationOffset = 0;
      let scale = 1.0;

      if (activeFrame > 0 && activeFrame < 13) {
        const prog = clamp(activeFrame / 9.5, 0, 1);
        const ease = easeOutBack(prog, 1.4);
        rotationOffset = ease * (Math.PI / 2);
        scale = 1.0 + 0.06 * Math.sin(prog * Math.PI);
      } else if (activeFrame >= 13) {
        rotationOffset = Math.PI / 2;
      }

      const baseRotation = beatIndex * (Math.PI / 2) + ((r + c) % 2 === 0 ? 0 : Math.PI / 2);
      const currentRot = baseRotation + rotationOffset;

      const qList = tileMap[r][c];

      ctx.save();
      ctx.translate(cellCenterX, cellCenterY);
      ctx.scale(scale, scale);

      const halfW = CELL_W / 2;
      const halfH = CELL_H / 2;
      const radius = Math.min(halfW, halfH);

      const subCenters = [
        { x: -halfW / 2, y: -halfH / 2, qIdx: 0 },
        { x: halfW / 2, y: -halfH / 2, qIdx: 1 },
        { x: -halfW / 2, y: halfH / 2, qIdx: 2 },
        { x: halfW / 2, y: halfH / 2, qIdx: 3 }
      ];

      subCenters.forEach((sub, sIdx) => {
        const q = qList[sIdx];
        const color = PALETTE[(q.color + beatIndex) % 4];

        ctx.save();
        ctx.translate(sub.x, sub.y);
        ctx.rotate(currentRot + (q.rot * Math.PI / 2));

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, 0, Math.PI / 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });

      ctx.restore();
    }
  }

  // Subtle clean grid overlay lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL_W, 0);
    ctx.lineTo(c * CELL_W, height);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL_H);
    ctx.lineTo(width, r * CELL_H);
    ctx.stroke();
  }
}

module.exports = {
  renderScene02
};
