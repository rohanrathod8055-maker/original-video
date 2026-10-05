/**
 * CLAUDE — MOTION REEL 2026 (Frame-by-Frame Recreation Engine)
 * High precision 30fps / 120BPM kinetic motion graphics in pure code
 */

(function () {
  'use strict';

  // --- Configuration & Constants ---
  const FPS = 30.0;
  const TOTAL_FRAMES = 452;
  const DURATION = TOTAL_FRAMES / FPS; // 15.066667s
  const BPM = 120.0;
  const BEAT_DURATION = 60.0 / BPM; // 0.5s per beat = 15 frames

  // Canvas & Stage references
  const stageWrapper = document.getElementById('stage-wrapper');
  const stage = document.getElementById('stage');
  const compareStage = document.getElementById('compare-stage');
  const refVideo = document.getElementById('ref-video');
  const codeBadge = document.getElementById('code-badge');
  const canvas = document.getElementById('main-canvas');
  const ctx = canvas.getContext('2d');

  // HUD Elements
  const hudTc = document.getElementById('hud-tc');
  const hudSection = document.getElementById('hud-section');
  const bpmBoxes = [
    document.getElementById('bpm-0'),
    document.getElementById('bpm-1'),
    document.getElementById('bpm-2'),
    document.getElementById('bpm-3')
  ];

  // Controls Elements
  const controlsBar = document.getElementById('controls');
  const btnPlay = document.getElementById('btn-play');
  const playIcon = document.getElementById('play-icon');
  const playText = document.getElementById('play-text');
  const btnStepPrev = document.getElementById('btn-step-prev');
  const btnStepNext = document.getElementById('btn-step-next');
  const scrubber = document.getElementById('scrubber');
  const dispFrame = document.getElementById('disp-frame');
  const dispSec = document.getElementById('disp-sec');
  const btnSpeed = document.getElementById('btn-speed');
  const btnSound = document.getElementById('btn-sound');
  const btnCompare = document.getElementById('btn-compare');
  const btnFs = document.getElementById('btn-fs');
  const startScreen = document.getElementById('start-screen');

  // Playback State
  let isPlaying = false;
  let isCompareMode = false;
  let currentTime = 0.0; // In seconds
  let playbackRate = 1.0;
  let isMuted = false;
  let audioElem = null;
  let audioContext = null;
  let lastTimestamp = 0;
  let idleTimer = null;

  // Responsive Scaling for 16:9 Stage
  function handleResize() {
    const contW = window.innerWidth;
    const contH = window.innerHeight;
    if (isCompareMode) {
      // Fit both stages side by side
      const targetW = 1280 * 2 + 20;
      const targetH = 720;
      const scale = Math.min((contW * 0.96) / targetW, (contH * 0.90) / targetH);
      stageWrapper.style.transform = `scale(${scale})`;
    } else {
      const scale = Math.min((contW * 0.98) / 1280, (contH * 0.96) / 720);
      stageWrapper.style.transform = `scale(${scale})`;
    }
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  // Auto-fading controls on mouse idle
  function resetIdleTimer() {
    controlsBar.classList.remove('faded');
    clearTimeout(idleTimer);
    if (isPlaying) {
      idleTimer = setTimeout(() => {
        controlsBar.classList.add('faded');
      }, 2400);
    }
  }
  window.addEventListener('mousemove', resetIdleTimer);
  window.addEventListener('mousedown', resetIdleTimer);
  window.addEventListener('keydown', resetIdleTimer);

  // --- Audio Setup ---
  function initAudio() {
    if (!audioElem) {
      audioElem = new Audio();
      if (window.AUDIO_BASE64) {
        audioElem.src = window.AUDIO_BASE64;
      } else {
        audioElem.src = 'audio.mp3';
      }
      audioElem.preload = 'auto';
      audioElem.volume = 0.95;
    }
  }

  // --- Color Palette ---
  const PALETTE = {
    orange: '#FF4A13',
    blue: '#2442FF',
    white: '#F4F3EE',
    charcoal: '#111215',
    slate: '#222328',
    darkBg: '#0B0C0F',
    gridLine: '#1E2028',
    cyan: '#00FFE0'
  };

  // Seeded Random for repeatable particles & tiles
  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  // Pre-generate Truchet Grid (Section 02)
  const TILE_COLS = 24;
  const TILE_ROWS = 14;
  const TILE_SIZE = 1280 / TILE_COLS; // ~53.33px
  const truchetTiles = [];
  const rng1 = mulberry32(42);
  const TILE_COLORS = [PALETTE.blue, PALETTE.orange, PALETTE.white, PALETTE.slate];

  for (let r = 0; r < TILE_ROWS; r++) {
    for (let c = 0; c < TILE_COLS; c++) {
      truchetTiles.push({
        r, c,
        x: c * TILE_SIZE,
        y: r * TILE_SIZE,
        color: TILE_COLORS[Math.floor(rng1() * TILE_COLORS.length)],
        baseCorner: Math.floor(rng1() * 4), // 0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left
        rotSpeed: 0.5 + rng1() * 1.5,
        distToCenter: Math.hypot((c - TILE_COLS / 2) * 1.5, r - TILE_ROWS / 2)
      });
    }
  }

  // Pre-generate 3D Voxel Arena (Section 03)
  const VOXEL_GRID_SIZE = 36;
  const voxels = [];
  const rng2 = mulberry32(101);
  const VOXEL_COLORS = [PALETTE.white, PALETTE.orange, PALETTE.blue, '#2D303A'];

  for (let y = -VOXEL_GRID_SIZE / 2; y <= VOXEL_GRID_SIZE / 2; y++) {
    for (let x = -VOXEL_GRID_SIZE / 2; x <= VOXEL_GRID_SIZE / 2; x++) {
      const dist = Math.hypot(x, y);
      const isWall = dist >= 14 && dist <= 17;
      const isFloor = dist < 14;
      if (isWall || isFloor) {
        voxels.push({
          x, y, dist,
          isWall,
          color: isWall ? (rng2() > 0.3 ? '#888E9E' : '#FFFFFF') : VOXEL_COLORS[Math.floor(rng2() * VOXEL_COLORS.length)],
          baseHeight: isWall ? 40 + rng2() * 20 : 6
        });
      }
    }
  }
  // Sort voxels for isometric painter's algorithm (back to front)
  voxels.sort((a, b) => (a.x + a.y) - (b.x + b.y));

  // Pre-generate Flow Particles (Section 04)
  const PARTICLE_COUNT = 3400;
  const particles = [];
  const rng3 = mulberry32(777);
  const PARTICLE_PALETTE = ['#FFFFFF', '#FF85A0', PALETTE.cyan, '#3366FF', '#FF5522'];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = rng3() * Math.PI * 2;
    const r = Math.pow(rng3(), 0.5);
    particles.push({
      angle,
      radiusRatio: r,
      speed: 0.8 + rng3() * 1.2,
      color: PARTICLE_PALETTE[Math.floor(rng3() * PARTICLE_PALETTE.length)],
      size: 1.2 + rng3() * 2.2,
      phase: rng3() * Math.PI * 2,
      // Sphere coordinates for section 04 globe formation
      theta: rng3() * Math.PI * 2,
      phi: Math.acos(2 * rng3() - 1)
    });
  }

  // Cubic Bezier Solver
  function cubicBezierPoint(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  }

  // Shading Helper for Voxels
  function shadeColor(hex, factor) {
    let r, g, b;
    if (hex.startsWith('#')) {
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
      }
    } else {
      r = 200; g = 200; b = 200;
    }
    r = Math.min(255, Math.floor(r * factor));
    g = Math.min(255, Math.floor(g * factor));
    b = Math.min(255, Math.floor(b * factor));
    return `rgb(${r},${g},${b})`;
  }

  // =========================================================================
  // SCENE RENDERERS
  // =========================================================================

  /**
   * SECTION 00: INTRO (0.00s - 2.067s, Frames 0 - 62)
   * Graph Editor with dragging bezier handles, S-curve acceleration, zoom-in.
   */
  function renderScene0(t, p) {
    const w = 1280;
    const h = 720;

    // Dark background
    ctx.fillStyle = PALETTE.darkBg;
    ctx.fillRect(0, 0, w, h);

    let zoom = 1.0;
    let focusX = w / 2;
    let focusY = h / 2;

    const boxSize = 340;
    const boxX = (w - boxSize) / 2;
    const boxY = (h - boxSize) / 2;

    const p0 = { x: boxX, y: boxY + boxSize };
    const p3 = { x: boxX + boxSize, y: boxY };

    // Handles progression
    let h1_norm_x = 0.33;
    let h1_norm_y = 0.33;
    if (t >= 0.40 && t < 0.75) {
      const k = (t - 0.40) / 0.35;
      const easeK = 0.5 - 0.5 * Math.cos(k * Math.PI);
      h1_norm_x = 0.33 + (0.83 - 0.33) * easeK;
      h1_norm_y = 0.33 + (0.00 - 0.33) * easeK;
    } else if (t >= 0.75) {
      h1_norm_x = 0.83;
      h1_norm_y = 0.00;
    }

    let h2_norm_x = 0.67;
    let h2_norm_y = 0.67;
    if (t >= 0.85 && t < 1.25) {
      const k = (t - 0.85) / 0.40;
      const easeK = 0.5 - 0.5 * Math.cos(k * Math.PI);
      h2_norm_x = 0.67 + (0.17 - 0.67) * easeK;
      h2_norm_y = 0.67 + (1.00 - 0.67) * easeK;
    } else if (t >= 1.25) {
      h2_norm_x = 0.17;
      h2_norm_y = 1.00;
    }

    const p1 = {
      x: boxX + h1_norm_x * boxSize,
      y: boxY + boxSize - h1_norm_y * boxSize
    };
    const p2 = {
      x: boxX + h2_norm_x * boxSize,
      y: boxY + boxSize - h2_norm_y * boxSize
    };

    // Camera Zoom into top-right point p3
    if (t >= 1.70) {
      const zoomProgress = Math.min(1.0, (t - 1.70) / 0.36);
      zoom = 1.0 + Math.pow(zoomProgress, 3) * 65.0;
      focusX = p3.x;
      focusY = p3.y;
    }

    ctx.save();
    if (zoom > 1.0) {
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
    }

    // Graph Box Background
    ctx.fillStyle = '#101217';
    ctx.fillRect(boxX, boxY, boxSize, boxSize);
    ctx.strokeStyle = '#232630';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxSize, boxSize);

    // Sub-grid lines (5x5)
    ctx.strokeStyle = '#181A22';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const gx = boxX + (boxSize / 5) * i;
      const gy = boxY + (boxSize / 5) * i;
      ctx.beginPath();
      ctx.moveTo(gx, boxY);
      ctx.lineTo(gx, boxY + boxSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boxX, gy);
      ctx.lineTo(boxX + boxSize, gy);
      ctx.stroke();
    }

    // Graph Header Labels
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8E94A5';
    ctx.textAlign = 'left';
    ctx.fillText('GRAPH EDITOR', boxX, boxY - 14);

    ctx.textAlign = 'right';
    ctx.fillText('POSITION.Y', boxX + boxSize, boxY - 14);

    // Graph Footer Axis Labels
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#5A6072';
    ctx.textAlign = 'left';
    ctx.fillText('0F', boxX, boxY + boxSize + 18);
    ctx.textAlign = 'center';
    ctx.fillText('TIME', boxX + boxSize / 2, boxY + boxSize + 18);
    ctx.textAlign = 'right';
    ctx.fillText('24F', boxX + boxSize, boxY + boxSize + 18);

    // Live cubic-bezier formula below
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillStyle = PALETTE.orange;
    ctx.textAlign = 'center';
    ctx.fillText(`cubic-bezier(${h1_norm_x.toFixed(2)}, ${h1_norm_y.toFixed(2)}, ${h2_norm_x.toFixed(2)}, ${h2_norm_y.toFixed(2)})`, boxX + boxSize / 2, boxY + boxSize + 38);

    // Handle Lines & Control Points
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Control Handle Dots
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.orange;
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // The Main Curve
    ctx.strokeStyle = PALETTE.orange;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = 'rgba(255, 74, 19, 0.6)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Keyframe Diamonds at endpoints
    function drawDiamond(cx, cy, size, color) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = color;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    }
    drawDiamond(p0.x, p0.y, 10, '#FFFFFF');
    drawDiamond(p3.x, p3.y, 12, PALETTE.orange);

    // Moving Ball along curve (1.40s to 1.75s)
    if (t >= 1.40) {
      const travelProgress = Math.min(1.0, (t - 1.40) / 0.35);
      const pt = cubicBezierPoint(p0, p1, p2, p3, travelProgress);

      // Motion Trail Echoes
      ctx.save();
      for (let echo = 3; echo >= 1; echo--) {
        const echoProg = Math.max(0, travelProgress - echo * 0.04);
        const echoPt = cubicBezierPoint(p0, p1, p2, p3, echoProg);
        ctx.fillStyle = `rgba(255, 74, 19, ${0.15 / echo})`;
        ctx.beginPath();
        ctx.arc(echoPt.x, echoPt.y, 8 - echo, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main Ball
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = PALETTE.orange;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Animated Mouse Pointer
    if (t >= 0.35 && t < 1.45) {
      let curX, curY;
      if (t < 0.75) {
        const k = Math.min(1, (t - 0.35) / 0.35);
        curX = p0.x + 80 + (p1.x - (p0.x + 80)) * k;
        curY = p0.y + 60 + (p1.y - (p0.y + 60)) * k;
      } else if (t < 0.85) {
        curX = p1.x;
        curY = p1.y;
      } else if (t < 1.25) {
        const k = Math.min(1, (t - 0.85) / 0.35);
        curX = p2.x;
        curY = p2.y;
      } else {
        const k = (t - 1.25) / 0.20;
        curX = p2.x + k * 80;
        curY = p2.y - k * 50;
      }

      ctx.save();
      ctx.translate(curX, curY);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 15);
      ctx.lineTo(4, 12);
      ctx.lineTo(7, 18);
      ctx.lineTo(9, 17);
      ctx.lineTo(6, 11);
      ctx.lineTo(11, 11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Flash/expansion to pure orange as intro concludes
    if (t >= 2.00) {
      const orangeFade = Math.min(1.0, (t - 2.00) / 0.07);
      ctx.fillStyle = PALETTE.orange;
      ctx.globalAlpha = orangeFade;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1.0;
    }
  }

  /**
   * SECTION 01: TYPE (2.067s - 4.233s, Frames 62 - 127)
   */
  function renderScene1(t, p) {
    const w = 1280;
    const h = 720;
    const sceneTime = t - 2.067; // 0.0s to 2.166s

    if (sceneTime < 0.96) {
      // Phase 1A: Orange background
      ctx.fillStyle = PALETTE.orange;
      ctx.fillRect(0, 0, w, h);

      // Background scrolling outline text
      if (sceneTime > 0.35) {
        ctx.save();
        ctx.font = '900 52px "Syne", sans-serif';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.lineWidth = 1.5;
        const textStr = 'MOTION — DESIGN — MOTION — DESIGN — ';
        const rowOffsets = [-60, 40, -90, 70, -40, 80, -70];
        for (let row = -1; row <= 6; row++) {
          const y = row * 110 + 40;
          const dir = (row % 2 === 0) ? 1 : -1;
          const shift = ((sceneTime - 0.35) * 120 * dir + rowOffsets[(row + 7) % 7]) % 800;
          for (let x = -800; x < w + 800; x += 800) {
            ctx.strokeText(textStr, x + shift, y);
          }
        }
        ctx.restore();
      }

      // Center Typography
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 132px "Syne", sans-serif';

      const lettersMotion = ['M', 'O', 'T', 'I', 'O', 'N'];
      const lettersDesign = ['D', 'E', 'S', 'I', 'G', 'N'];
      const totalLetters = 6;
      const letterSpacing = 95;
      const startX = w / 2 - (totalLetters - 1) * letterSpacing / 2;

      for (let i = 0; i < totalLetters; i++) {
        const lx = startX + i * letterSpacing;
        const ly = h / 2;
        const revealTime = 0.04 + i * 0.06;

        if (sceneTime >= revealTime) {
          const flipStartTime = 0.55 + i * 0.04;
          let flipAngle = 0;
          let currentLetter = lettersMotion[i];

          if (sceneTime >= flipStartTime) {
            const flipProgress = Math.min(1.0, (sceneTime - flipStartTime) / 0.22);
            flipAngle = flipProgress * Math.PI;
            if (flipProgress >= 0.5) {
              currentLetter = lettersDesign[i];
            }
          }

          ctx.save();
          ctx.translate(lx, ly);

          const cosA = Math.cos(flipAngle);
          ctx.scale(1, Math.abs(cosA));

          const entranceAge = sceneTime - revealTime;
          if (entranceAge < 0.10) {
            const blurScale = 1.0 + (0.10 - entranceAge) * 4.0;
            ctx.scale(1, blurScale);
          }

          ctx.fillStyle = '#000000';
          ctx.fillText(currentLetter, 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();

    } else if (sceneTime < 1.50) {
      // Phase 1B: Glitch Cut -> Dark background, white DESIGN
      ctx.fillStyle = PALETTE.darkBg;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.font = '900 52px "Syne", sans-serif';
      ctx.strokeStyle = 'rgba(255, 74, 19, 0.12)';
      ctx.lineWidth = 1;
      const textStr = 'MOTION — DESIGN — MOTION — DESIGN — ';
      for (let row = 0; row < 7; row++) {
        const y = row * 110 + 40;
        const shift = ((sceneTime - 0.96) * 60 * (row % 2 === 0 ? 1 : -1)) % 800;
        ctx.strokeText(textStr, shift - 400, y);
        ctx.strokeText(textStr, shift + 400, y);
      }
      ctx.restore();

      const glitchTime = sceneTime - 0.96;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 132px "Syne", sans-serif';

      if (glitchTime < 0.14) {
        ctx.fillStyle = 'rgba(255, 0, 50, 0.85)';
        ctx.fillText('DESIGN', w / 2 + 7, h / 2 - 2);
        ctx.fillStyle = 'rgba(0, 255, 240, 0.85)';
        ctx.fillText('DESIGN', w / 2 - 7, h / 2 + 2);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('DESIGN', w / 2, h / 2);
      ctx.restore();

    } else {
      // Phase 1C: High-Speed Horizontal Colored Stripes
      const stripeProgress = (sceneTime - 1.50) / 0.66;
      ctx.fillStyle = PALETTE.darkBg;
      ctx.fillRect(0, 0, w, h);

      const stripes = [
        { y: 0, h: 120, col: PALETTE.blue, dir: 1, speed: 2.2 },
        { y: 120, h: 120, col: PALETTE.white, dir: -1, speed: 1.8 },
        { y: 240, h: 120, col: PALETTE.orange, dir: 1, speed: 2.6 },
        { y: 360, h: 120, col: PALETTE.blue, dir: -1, speed: 2.0 },
        { y: 480, h: 120, col: PALETTE.orange, dir: 1, speed: 2.4 },
        { y: 600, h: 120, col: PALETTE.white, dir: -1, speed: 1.9 }
      ];

      for (let s of stripes) {
        const k = Math.min(1.0, stripeProgress * s.speed);
        const easeK = 1 - Math.pow(1 - k, 3);
        const curW = w * easeK;
        const curX = s.dir === 1 ? 0 : w - curW;

        ctx.fillStyle = s.col;
        ctx.fillRect(curX, s.y, curW, s.h);
      }
    }
  }

  /**
   * SECTION 02: SHAPE (4.233s - 6.267s, Frames 127 - 188)
   */
  function renderScene2(t, p) {
    const w = 1280;
    const h = 720;
    const sceneTime = t - 4.233; // 0.0s to 2.034s

    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, w, h);

    const expansionR = Math.min(1.0, sceneTime / 0.35) * Math.hypot(w, h);

    let squareMorph = 0.0;
    if (sceneTime >= 1.40 && sceneTime < 1.65) {
      squareMorph = (sceneTime - 1.40) / 0.25;
    } else if (sceneTime >= 1.65) {
      squareMorph = 1.0;
    }

    const beatPulse = Math.sin((sceneTime - 1.65) * Math.PI * 4);

    for (let tile of truchetTiles) {
      const cx = tile.x + TILE_SIZE / 2;
      const cy = tile.y + TILE_SIZE / 2;
      const distFromCenter = Math.hypot(cx - w / 2, cy - h / 2);

      if (distFromCenter > expansionR) {
        const bandIdx = Math.floor(tile.y / 120);
        const stripeCols = [PALETTE.blue, PALETTE.white, PALETTE.orange, PALETTE.blue, PALETTE.orange, PALETTE.white];
        ctx.fillStyle = stripeCols[bandIdx % stripeCols.length];
        ctx.fillRect(tile.x, tile.y, TILE_SIZE + 0.5, TILE_SIZE + 0.5);
        continue;
      }

      const wavePhase = (sceneTime * 4.5) - (tile.distToCenter * 0.35);
      const waveAngle = Math.sin(wavePhase) * (Math.PI / 2);
      const totalAngle = (tile.baseCorner * Math.PI / 2) + waveAngle;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(totalAngle);

      if (squareMorph > 0.0) {
        const pulseScale = 1.0 + beatPulse * 0.04 * (tile.c % 2 === 0 ? 1 : -1);
        ctx.scale(pulseScale, pulseScale);
      }

      ctx.fillStyle = tile.color;

      if (squareMorph < 1.0) {
        const rFactor = 1.0 - squareMorph;
        ctx.beginPath();
        ctx.moveTo(-TILE_SIZE / 2, -TILE_SIZE / 2);
        ctx.lineTo(TILE_SIZE / 2, -TILE_SIZE / 2);
        ctx.arc(
          -TILE_SIZE / 2, -TILE_SIZE / 2,
          TILE_SIZE * rFactor,
          0,
          Math.PI / 2,
          false
        );
        ctx.lineTo(-TILE_SIZE / 2, TILE_SIZE / 2);
        ctx.closePath();
        ctx.fill();

        if (squareMorph > 0.05) {
          ctx.fillStyle = tile.color;
          ctx.globalAlpha = squareMorph;
          ctx.fillRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
          ctx.globalAlpha = 1.0;
        }
      } else {
        ctx.fillRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE - 0.5, TILE_SIZE - 0.5);
      }

      ctx.restore();
    }
  }

  /**
   * SECTION 03: DEPTH (6.267s - 8.033s, Frames 188 - 241)
   */
  function renderScene3(t, p) {
    const w = 1280;
    const h = 720;
    const sceneTime = t - 6.267; // 0.0s to 1.766s

    ctx.fillStyle = '#08080C';
    ctx.fillRect(0, 0, w, h);

    const isoAngle = Math.PI / 6; // 30 degrees
    const cosIso = Math.cos(isoAngle);
    const sinIso = Math.sin(isoAngle);
    const tileSize = 20;

    let cameraScale = 1.0;
    if (sceneTime >= 1.55) {
      const zoomOutProg = (sceneTime - 1.55) / 0.21;
      cameraScale = Math.max(0.015, Math.pow(1 - zoomOutProg, 3.5));
    }

    ctx.save();
    ctx.translate(w / 2, h / 2 - 20);
    ctx.scale(cameraScale, cameraScale);

    const wave1Time = sceneTime - 0.25;
    const wave2Time = sceneTime - 0.80;
    const wave3Time = sceneTime - 1.25;

    for (let v of voxels) {
      let elevation = 0;

      function getWaveH(wt, speed, maxDist, peakH) {
        if (wt < 0) return 0;
        const waveRadius = wt * speed;
        const distDiff = Math.abs(v.dist - waveRadius);
        if (distDiff < 3.5) {
          const intensity = Math.cos((distDiff / 3.5) * (Math.PI / 2));
          return Math.pow(intensity, 2) * peakH;
        }
        return 0;
      }

      elevation += getWaveH(wave1Time, 14.0, 16.0, 65.0);
      elevation += getWaveH(wave2Time, 14.0, 16.0, 75.0);
      elevation += getWaveH(wave3Time, 15.0, 16.0, 70.0);

      const totalH = (v.baseHeight + elevation);

      const isoX = (v.x - v.y) * cosIso * tileSize;
      const isoY = (v.x + v.y) * sinIso * tileSize - totalH;

      const hw = tileSize * cosIso;
      const hh = tileSize * sinIso;

      // Top Face
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.moveTo(isoX, isoY - hh);
      ctx.lineTo(isoX + hw, isoY);
      ctx.lineTo(isoX, isoY + hh);
      ctx.lineTo(isoX - hw, isoY);
      ctx.closePath();
      ctx.fill();

      // Right Face (medium shade)
      ctx.fillStyle = shadeColor(v.color, 0.70);
      ctx.beginPath();
      ctx.moveTo(isoX, isoY + hh);
      ctx.lineTo(isoX + hw, isoY);
      ctx.lineTo(isoX + hw, isoY + totalH);
      ctx.lineTo(isoX, isoY + hh + totalH);
      ctx.closePath();
      ctx.fill();

      // Left Face (dark shade)
      ctx.fillStyle = shadeColor(v.color, 0.45);
      ctx.beginPath();
      ctx.moveTo(isoX, isoY + hh);
      ctx.lineTo(isoX - hw, isoY);
      ctx.lineTo(isoX - hw, isoY + totalH);
      ctx.lineTo(isoX, isoY + hh + totalH);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    if (sceneTime >= 1.70) {
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = PALETTE.orange;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 - 20, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  /**
   * SECTION 04: FLOW (8.033s - 10.067s, Frames 241 - 302)
   */
  function renderScene4(t, p) {
    const w = 1280;
    const h = 720;
    const sceneTime = t - 8.033; // 0.0s to 2.034s

    ctx.fillStyle = '#060709';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    if (sceneTime < 1.40) {
      const isReversing = sceneTime > 1.05;
      const reverseProg = isReversing ? Math.min(1.0, (sceneTime - 1.05) / 0.35) : 0;

      for (let p of particles) {
        let currentR;
        if (!isReversing) {
          const expandK = Math.min(1.0, sceneTime / 0.85);
          currentR = (expandK * 540) * p.radiusRatio;
        } else {
          const startR = 540 * p.radiusRatio;
          currentR = startR + (180 - startR) * Math.pow(reverseProg, 2);
        }

        const curlSpeed = 2.4 * p.speed;
        const currentAngle = p.angle + sceneTime * curlSpeed + (currentR * 0.005);

        const px = cx + Math.cos(currentAngle) * currentR;
        const py = cy + Math.sin(currentAngle) * currentR * 0.85;

        const tailLen = Math.min(18, currentR * 0.08 * p.speed);
        const tx = px - Math.cos(currentAngle + 0.15) * tailLen;
        const ty = py - Math.sin(currentAngle + 0.15) * tailLen;

        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(px, py);
        ctx.stroke();
      }

    } else {
      const globeTime = sceneTime - 1.40;
      let sphereRadius = 180;

      if (globeTime > 0.40) {
        const implodeK = (globeTime - 0.40) / 0.23;
        sphereRadius = 180 * Math.pow(1 - implodeK, 2.5);
      }

      const rotY = globeTime * 2.8;
      const rotX = 0.35;

      ctx.save();
      ctx.translate(cx, cy);

      for (let p of particles) {
        const curTheta = p.theta + rotY;
        const x3 = sphereRadius * Math.sin(p.phi) * Math.cos(curTheta);
        const y3 = sphereRadius * Math.cos(p.phi);
        const z3 = sphereRadius * Math.sin(p.phi) * Math.sin(curTheta);

        const cosTilt = Math.cos(rotX);
        const sinTilt = Math.sin(rotX);
        const x2 = x3;
        const y2 = y3 * cosTilt - z3 * sinTilt;
        const z2 = y3 * sinTilt + z3 * cosTilt;

        const depthAlpha = 0.25 + 0.75 * ((z2 + sphereRadius) / (2 * sphereRadius));
        ctx.fillStyle = p.color;
        ctx.globalAlpha = depthAlpha;

        const streakLen = 4.5 * ((z2 + sphereRadius) / (2 * sphereRadius));
        ctx.beginPath();
        ctx.ellipse(x2, y2, Math.max(1, p.size * (z2 > 0 ? 1.2 : 0.8)), streakLen, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1.0;

      if (globeTime > 0.42) {
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = PALETTE.orange;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  /**
   * SECTION 05: RHYTHM (10.067s - 12.067s, Frames 302 - 362)
   */
  function renderScene5(t, p) {
    const w = 1280;
    const h = 720;
    const sceneTime = t - 10.067; // 0.0s to 2.000s

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. EASE (0.00s - 0.50s)
    if (sceneTime < 0.50) {
      const k = Math.min(1.0, sceneTime / 0.25);
      const easeK = 1 - Math.pow(1 - k, 4);

      ctx.fillStyle = PALETTE.orange;
      ctx.fillRect(0, 0, w, h);

      const xOffset = (1 - easeK) * 450;

      ctx.font = '900 132px "Syne", sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText('EASE', w / 2 - xOffset, h / 2);

      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillText('cubic-bezier(1.85, 0, 1.17, 1)', w / 2, h / 2 + 85);
    }
    // 2. WEIGHT (0.50s - 0.96s)
    else if (sceneTime < 0.96) {
      const weightK = Math.min(1.0, (sceneTime - 0.50) / 0.40);
      const curWeight = Math.floor(100 + weightK * 800);

      ctx.fillStyle = '#0B0C0F';
      ctx.fillRect(0, 0, w, h);

      ctx.font = '800 128px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = (curWeight - 100) / 100 * 2.8;

      if (ctx.lineWidth > 0.5) {
        ctx.strokeText('WEIGHT', w / 2, h / 2);
      }
      ctx.fillText('WEIGHT', w / 2, h / 2);

      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#777E90';
      ctx.fillText(`font-weight: 100 -> ${curWeight}`, w / 2, h / 2 + 85);
    }
    // 3. STRETCH (0.96s - 1.26s)
    else if (sceneTime < 1.26) {
      const stretchK = Math.min(1.0, (sceneTime - 0.96) / 0.28);
      const scaleX = 0.65 + stretchK * 0.75;

      ctx.fillStyle = PALETTE.blue;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(scaleX, 1.0);
      ctx.font = '900 120px "Syne", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('STRETCH', 0, 0);
      ctx.restore();

      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('font-stretch: 50% -> 125%', w / 2, h / 2 + 85);
    }
    // 4. SPACE (1.26s - 1.50s)
    else if (sceneTime < 1.50) {
      const spaceK = Math.min(1.0, (sceneTime - 1.26) / 0.22);
      const letterGap = 90 + spaceK * 70;

      ctx.fillStyle = '#EDEAE3';
      ctx.fillRect(0, 0, w, h);

      const letters = ['S', 'P', 'A', 'C', 'E'];
      const totalW = (letters.length - 1) * letterGap;
      const sX = w / 2 - totalW / 2;

      ctx.font = '900 120px "Syne", sans-serif';
      ctx.fillStyle = '#08080C';
      for (let i = 0; i < letters.length; i++) {
        ctx.fillText(letters[i], sX + i * letterGap, h / 2);
      }

      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#666B78';
      ctx.fillText('letter-spacing: -0.05em -> 0.35em', w / 2, h / 2 + 85);
    }
    // 5. SCALE (1.50s - 1.63s)
    else if (sceneTime < 1.63) {
      const scaleK = Math.min(1.0, (sceneTime - 1.50) / 0.12);
      const curScale = 0.5 + scaleK * 1.1;

      ctx.fillStyle = PALETTE.orange;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(curScale, curScale);
      ctx.font = '900 120px "Syne", sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText('SCALE', 0, 0);
      ctx.restore();

      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillText('transform: scale(0.6 -> 1.5)', w / 2, h / 2 + 85);
    }
    // 6. SPIN (1.63s - 1.76s)
    else if (sceneTime < 1.76) {
      const spinK = Math.min(1.0, (sceneTime - 1.63) / 0.12);
      const spinAngle = spinK * Math.PI * 2;

      ctx.fillStyle = '#0B0C0F';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(spinAngle);
      ctx.font = '900 120px "Syne", sans-serif';
      ctx.fillStyle = PALETTE.orange;
      ctx.fillText('SPIN', 0, 0);
      ctx.restore();

      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#777E90';
      ctx.fillText('transform: rotate(0deg -> 360deg)', w / 2, h / 2 + 85);
    }
    // 7. FLIP (1.76s - 1.90s)
    else if (sceneTime < 1.90) {
      const flipK = Math.min(1.0, (sceneTime - 1.76) / 0.13);
      const flipAngle = flipK * Math.PI;

      ctx.fillStyle = PALETTE.blue;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(1, Math.cos(flipAngle));
      ctx.font = '900 120px "Syne", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('FLIP', 0, 0);
      ctx.restore();

      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('transform: rotateX(180deg)', w / 2, h / 2 + 85);
    }
    // 8. WHITE FLASH (1.90s - 2.00s)
    else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  /**
   * SECTION 06: HELLO (12.067s - 15.067s, Frames 362 - 452)
   */
  function renderScene6(t, p) {
    const w = 1280;
    const h = 720;
    const sceneTime = t - 12.067; // 0.0s to 3.000s

    ctx.fillStyle = '#0F1014';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2 - 25;

    // Letters of CLAUDE slam in one-by-one from 0.00s to 0.40s
    const claudeLetters = ['C', 'L', 'A', 'U', 'D', 'E'];
    const totalLetters = 6;
    const charSpacing = 82;
    const startX = cx - (totalLetters * charSpacing) / 2 + 25;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 118px "Space Grotesk", "Syne", sans-serif';

    let lastLetterX = startX + 5 * charSpacing;

    for (let i = 0; i < totalLetters; i++) {
      const letterTime = i * 0.065;
      if (sceneTime >= letterTime) {
        const lx = startX + i * charSpacing;
        const letterAge = sceneTime - letterTime;

        ctx.save();
        ctx.translate(lx, cy);

        // Slam impact
        if (letterAge < 0.12) {
          const dropK = letterAge / 0.12;
          const dropY = (1 - dropK) * -120;
          const squash = 1.0 + (1 - dropK) * 0.6;
          ctx.translate(0, dropY);
          ctx.scale(1, squash);
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(claudeLetters[i], 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();

    // Dropping Orange Diamond / Dot (docked closely right next to E as period)
    const dotDropStart = 0.75;
    const dotTargetX = lastLetterX + 46;
    const dotTargetY = cy + 12;

    if (sceneTime >= dotDropStart) {
      const dotAge = sceneTime - dotDropStart;
      let dotY = dotTargetY;

      if (dotAge < 0.28) {
        const k = dotAge / 0.28;
        const bounce = Math.sin(k * Math.PI * 2.5) * Math.exp(-k * 4.5);
        dotY = dotTargetY - 260 * (1 - k) + bounce * 40;
      }

      ctx.save();
      ctx.translate(dotTargetX, dotY);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = PALETTE.orange;
      ctx.fillRect(-8.5, -8.5, 17, 17);
      ctx.restore();
    }

    // "Motion Designer" in elegant italic serif
    if (sceneTime >= 1.00) {
      const serifAge = sceneTime - 1.00;
      const serifK = Math.min(1.0, serifAge / 0.35);
      const serifY = cy + 85 + (1 - serifK) * 22;
      const serifAlpha = serifK;

      ctx.save();
      ctx.globalAlpha = serifAlpha;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'italic 500 52px "Instrument Serif", Georgia, serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Motion Designer', startX - 40, serifY);
      ctx.restore();
    }

    // Divider Rule & Footer Metadata
    if (sceneTime >= 1.35) {
      const footerAge = sceneTime - 1.35;
      const footerAlpha = Math.min(1.0, footerAge / 0.30);

      ctx.save();
      ctx.globalAlpha = footerAlpha;

      // Subtle horizontal divider rule
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.76);
      ctx.lineTo(w * 0.85, h * 0.76);
      ctx.stroke();

      // Left: Typewriter text "SHOWREEL 2026 — EVERY FRAME IS CODE"
      const fullText = "SHOWREEL 2026 — EVERY FRAME IS CODE";
      const charCount = Math.min(fullText.length, Math.floor(footerAge * 24));
      const typedText = fullText.slice(0, charCount);
      const cursorVisible = Math.floor(sceneTime * 3) % 2 === 0;

      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.textAlign = 'left';
      ctx.fillText(typedText, w * 0.15, h * 0.81);

      if (cursorVisible && charCount < fullText.length) {
        ctx.fillStyle = PALETTE.orange;
        ctx.fillText('|', w * 0.15 + ctx.measureText(typedText).width + 3, h * 0.81);
      }

      // Right: Lime-green dot "AVAILABLE FOR WORK"
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('AVAILABLE FOR WORK', w * 0.85, h * 0.81);

      // Neon Lime-green indicator dot
      const dotX = w * 0.85 - ctx.measureText('AVAILABLE FOR WORK').width - 14;
      ctx.fillStyle = '#B4FF00';
      ctx.shadowColor = '#B4FF00';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(dotX, h * 0.81 - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }
  }

  // --- Master Frame Renderer ---
  function renderFrame(timeSec) {
    currentTime = Math.max(0, Math.min(DURATION, timeSec));
    const currentFrame = Math.min(TOTAL_FRAMES, Math.floor(currentTime * FPS));

    // Update HUD & Controls UI
    const seconds = Math.floor(currentTime);
    const subFrames = Math.floor((currentTime % 1.0) * FPS);
    const tcStr = `TC 00:00:${String(seconds).padStart(2, '0')}:${String(subFrames).padStart(2, '0')}`;
    hudTc.textContent = tcStr;

    // Update Section HUD label
    let sectionName = '00 / INTRO';
    if (currentTime >= 12.067) {
      sectionName = '06 / HELLO';
    } else if (currentTime >= 10.067) {
      sectionName = '05 / RHYTHM';
    } else if (currentTime >= 8.033) {
      sectionName = '04 / FLOW';
    } else if (currentTime >= 6.267) {
      sectionName = '03 / DEPTH';
    } else if (currentTime >= 4.233) {
      sectionName = '02 / SHAPE';
    } else if (currentTime >= 2.067) {
      sectionName = '01 / TYPE';
    }
    hudSection.textContent = sectionName;

    // Update 120 BPM active box
    const currentBeat = Math.floor(currentTime / BEAT_DURATION) % 4;
    bpmBoxes.forEach((box, i) => {
      if (i === currentBeat) {
        box.classList.add('active');
      } else {
        box.classList.remove('active');
      }
    });

    // Update Scrubber & Time Display
    scrubber.value = currentFrame;
    dispFrame.textContent = `F ${String(currentFrame).padStart(3, '0')}`;
    dispSec.textContent = `/ ${currentTime.toFixed(2)}s`;

    // Sync comparison video if compare mode is active
    if (isCompareMode && refVideo) {
      if (Math.abs(refVideo.currentTime - currentTime) > 0.08) {
        refVideo.currentTime = currentTime;
      }
    }

    // Render corresponding section
    if (currentTime < 2.067) {
      renderScene0(currentTime, currentTime / 2.067);
    } else if (currentTime < 4.233) {
      renderScene1(currentTime, (currentTime - 2.067) / 2.166);
    } else if (currentTime < 6.267) {
      renderScene2(currentTime, (currentTime - 4.233) / 2.034);
    } else if (currentTime < 8.033) {
      renderScene3(currentTime, (currentTime - 6.267) / 1.766);
    } else if (currentTime < 10.067) {
      renderScene4(currentTime, (currentTime - 8.033) / 2.034);
    } else if (currentTime < 12.067) {
      renderScene5(currentTime, (currentTime - 10.067) / 2.000);
    } else {
      renderScene6(currentTime, (currentTime - 12.067) / 3.000);
    }
  }

  // --- Animation Loop ---
  function loop(now) {
    if (!isPlaying) return;

    if (!lastTimestamp) lastTimestamp = now;
    const delta = (now - lastTimestamp) / 1000.0;
    lastTimestamp = now;

    // Sync with HTML5 Audio if audio is playing
    if (audioElem && !audioElem.paused && !audioElem.ended) {
      currentTime = audioElem.currentTime;
    } else {
      currentTime += delta * playbackRate;
    }

    if (currentTime >= DURATION) {
      currentTime = DURATION;
      renderFrame(currentTime);
      pause();
      return;
    }

    renderFrame(currentTime);
    requestAnimationFrame(loop);
  }

  // --- Playback Controls ---
  function play() {
    initAudio();
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }

    if (currentTime >= DURATION) {
      currentTime = 0.0;
    }

    if (audioElem && !isMuted) {
      audioElem.currentTime = currentTime;
      audioElem.playbackRate = playbackRate;
      audioElem.play().catch(() => {});
    }

    if (isCompareMode && refVideo) {
      refVideo.currentTime = currentTime;
      refVideo.playbackRate = playbackRate;
      refVideo.play().catch(() => {});
    }

    isPlaying = true;
    lastTimestamp = performance.now();
    playIcon.textContent = '⏸';
    playText.textContent = 'PAUSE';
    btnPlay.classList.add('active');
    startScreen.classList.add('hidden');

    resetIdleTimer();
    requestAnimationFrame(loop);
  }

  function pause() {
    isPlaying = false;
    if (audioElem) {
      audioElem.pause();
    }
    if (refVideo) {
      refVideo.pause();
    }
    playIcon.textContent = '▶';
    playText.textContent = 'PLAY';
    btnPlay.classList.remove('active');
    controlsBar.classList.remove('faded');
  }

  function togglePlay() {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function seekToFrame(frameIndex) {
    const targetTime = frameIndex / FPS;
    currentTime = targetTime;
    if (audioElem) {
      audioElem.currentTime = targetTime;
    }
    if (refVideo) {
      refVideo.currentTime = targetTime;
    }
    renderFrame(currentTime);
  }

  function toggleCompare() {
    isCompareMode = !isCompareMode;
    if (isCompareMode) {
      compareStage.style.display = 'block';
      codeBadge.style.display = 'block';
      btnCompare.classList.add('active');
      if (refVideo) {
        refVideo.currentTime = currentTime;
        if (isPlaying) refVideo.play().catch(() => {});
      }
    } else {
      compareStage.style.display = 'none';
      codeBadge.style.display = 'none';
      btnCompare.classList.remove('active');
      if (refVideo) refVideo.pause();
    }
    handleResize();
  }

  // Event Listeners
  btnPlay.addEventListener('click', togglePlay);
  startScreen.addEventListener('click', () => {
    initAudio();
    play();
  });

  btnStepPrev.addEventListener('click', () => {
    pause();
    const curF = Math.floor(currentTime * FPS);
    seekToFrame(Math.max(0, curF - 1));
  });

  btnStepNext.addEventListener('click', () => {
    pause();
    const curF = Math.floor(currentTime * FPS);
    seekToFrame(Math.min(TOTAL_FRAMES, curF + 1));
  });

  scrubber.addEventListener('input', (e) => {
    pause();
    seekToFrame(parseInt(e.target.value, 10));
  });

  btnSpeed.addEventListener('click', () => {
    if (playbackRate === 1.0) playbackRate = 0.5;
    else if (playbackRate === 0.5) playbackRate = 0.25;
    else playbackRate = 1.0;

    btnSpeed.textContent = `${playbackRate.toFixed(playbackRate === 1 ? 1 : 2)}X`;
    if (audioElem) {
      audioElem.playbackRate = playbackRate;
    }
    if (refVideo) {
      refVideo.playbackRate = playbackRate;
    }
  });

  btnSound.addEventListener('click', () => {
    isMuted = !isMuted;
    btnSound.textContent = isMuted ? '🔇 MUTED' : '🔊 AUDIO';
    if (audioElem) {
      audioElem.muted = isMuted;
    }
  });

  btnCompare.addEventListener('click', toggleCompare);

  btnFs.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Keyboard Shortcuts:
  // Space: Play/Pause, [ and ]: Step frame, C: Compare mode, M: Mute, F: Fullscreen
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === '[') {
      pause();
      const curF = Math.floor(currentTime * FPS);
      seekToFrame(Math.max(0, curF - 1));
    } else if (e.key === ']') {
      pause();
      const curF = Math.floor(currentTime * FPS);
      seekToFrame(Math.min(TOTAL_FRAMES, curF + 1));
    } else if (e.key.toLowerCase() === 'c') {
      toggleCompare();
    } else if (e.key.toLowerCase() === 'm') {
      btnSound.click();
    } else if (e.key.toLowerCase() === 'f') {
      btnFs.click();
    }
  });

  // Initial draw & URL parameter support
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('frame')) {
    const targetF = parseInt(urlParams.get('frame'), 10);
    startScreen.classList.add('hidden');
    seekToFrame(targetF);
  } else {
    renderFrame(0.0);
  }

  if (urlParams.get('autoplay') === '1') {
    startScreen.classList.add('hidden');
    play();
  }

  // Expose global controller
  window.MOTION_REEL = {
    play,
    pause,
    seekToFrame,
    renderFrame,
    toggleCompare,
    get time() { return currentTime; },
    get isPlaying() { return isPlaying; },
    TOTAL_FRAMES,
    DURATION
  };

})();
