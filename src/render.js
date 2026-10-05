// Main Rendering Pipeline for 15-Second Motion Graphics Showreel
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const { renderScene00 } = require('./scenes/scene00_intro');
const { renderScene01 } = require('./scenes/scene01_type');
const { renderScene02 } = require('./scenes/scene02_shape');
const { renderScene03 } = require('./scenes/scene03_depth');
const { renderScene04 } = require('./scenes/scene04_flow');
const { renderScene05, getScene05IsDark } = require('./scenes/scene05_rhythm');
const { renderScene06 } = require('./scenes/scene06_outro');

const { drawHUD } = require('./hud');
const { applyPostProcessing } = require('./postprocess');

// 1. Register Fonts
const fontMappings = [
  { path: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', name: 'DejaVuSansBold' },
  { path: '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', name: 'DejaVuSansMonoBold' },
  { path: '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', name: 'DejaVuSansMono' },
  { path: '/usr/local/lib/python3.11/dist-packages/matplotlib/mpl-data/fonts/ttf/DejaVuSerif-Italic.ttf', name: 'DejaVuSerifItalic' },
  { path: '/usr/local/lib/python3.11/dist-packages/matplotlib/mpl-data/fonts/ttf/DejaVuSerif-BoldItalic.ttf', name: 'DejaVuSerifBoldItalic' },
  { path: '/usr/local/lib/python3.11/dist-packages/matplotlib/mpl-data/fonts/ttf/DejaVuSerif.ttf', name: 'DejaVuSerif' }
];

fontMappings.forEach(({ path: fPath, name }) => {
  if (fs.existsSync(fPath)) {
    GlobalFonts.registerFromPath(fPath, name);
  }
});

async function renderVideo(outputPath = 'showreel.mp4', brandName = 'ARENA', options = {}) {
  const width = options.width || 1280;
  const height = options.height || 720;
  const fps = 30;
  const totalFrames = 451; // 15.03 seconds

  console.log(`Starting render: ${width}x${height} @ ${fps}fps, ${totalFrames} frames...`);
  const startTime = Date.now();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Spawn ffmpeg image pipe
  const audioFile = path.resolve('/tmp/audio.aac');
  const hasAudio = fs.existsSync(audioFile);

  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(fps),
    '-i', '-'
  ];

  if (hasAudio) {
    ffmpegArgs.push('-i', audioFile);
  }

  ffmpegArgs.push(
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '17',
    '-pix_fmt', 'yuv420p'
  );

  if (hasAudio) {
    ffmpegArgs.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
  }

  ffmpegArgs.push(outputPath);

  const ffmpeg = spawn('ffmpeg', ffmpegArgs);

  ffmpeg.stderr.on('data', data => {
    // optional debug logging
  });

  const renderFramePromise = (f) => {
    return new Promise((resolve, reject) => {
      // Determine Scene and Render
      let sceneName = '00 / INTRO';
      let isDarkBg = true;
      let chromaticShift = 0;

      if (f < 60) {
        // Scene 00: INTRO (0.00s - 2.00s)
        sceneName = '00 / INTRO';
        isDarkBg = true;
        renderScene00(ctx, f, width, height);
        if (f >= 58) chromaticShift = 2.5; // flash cut shift
      } else if (f < 120) {
        // Scene 01: TYPE (2.00s - 4.00s)
        sceneName = '01 / TYPE';
        isDarkBg = f >= 82;
        renderScene01(ctx, f, width, height);
        if (f === 60 || f === 82) chromaticShift = 3.0; // cut glitch
      } else if (f < 180) {
        // Scene 02: SHAPE (4.00s - 6.00s)
        sceneName = '02 / SHAPE';
        isDarkBg = true;
        renderScene02(ctx, f, width, height);
        if (f === 120) chromaticShift = 2.0;
      } else if (f < 240) {
        // Scene 03: DEPTH (6.00s - 8.00s)
        sceneName = '03 / DEPTH';
        isDarkBg = true;
        renderScene03(ctx, f, width, height);
        if (f === 180) chromaticShift = 2.0;
      } else if (f < 300) {
        // Scene 04: FLOW (8.00s - 10.00s)
        sceneName = '04 / FLOW';
        isDarkBg = true;
        renderScene04(ctx, f, width, height);
        if (f === 240) chromaticShift = 2.0;
      } else if (f < 360) {
        // Scene 05: RHYTHM (10.00s - 12.00s)
        sceneName = '05 / RHYTHM';
        isDarkBg = getScene05IsDark(f);
        renderScene05(ctx, f, width, height);
        if (f % 15 === 0) chromaticShift = 2.5; // beat cut shift
      } else {
        // Scene 06: HELLO / OUTRO (12.00s - 15.00s)
        sceneName = '06 / HELLO';
        isDarkBg = true;
        renderScene06(ctx, f, width, height, brandName);
        if (f === 360) chromaticShift = 2.0;
      }

      // Draw Dynamic Adaptive HUD Overlay
      drawHUD(ctx, f, {
        width,
        height,
        sceneName,
        isDarkBg,
        brandTitle: `${brandName} — MOTION REEL 2026`
      });

      // Apply Procedural Shaders
      applyPostProcessing(canvas, ctx, f, {
        grainAmount: 5.5,
        vignetteStrength: 0.35,
        chromaticShift
      });

      // Convert to JPEG buffer and write to ffmpeg stdin
      const buffer = canvas.toBuffer('image/jpeg', { quality: 95 });

      const ok = ffmpeg.stdin.write(buffer);
      if (!ok) {
        ffmpeg.stdin.once('drain', resolve);
      } else {
        process.nextTick(resolve);
      }
    });
  };

  for (let f = 0; f < totalFrames; f++) {
    await renderFramePromise(f);
    if (f % 45 === 0 || f === totalFrames - 1) {
      const progress = ((f / (totalFrames - 1)) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Rendered frame ${f}/${totalFrames - 1} (${progress}%) in ${elapsed}s`);
    }
  }

  ffmpeg.stdin.end();

  return new Promise((resolve, reject) => {
    ffmpeg.on('close', code => {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      if (code === 0) {
        console.log(`Render complete! Output saved to ${outputPath} in ${totalTime}s.`);
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg exited with error code ${code}`));
      }
    });
  });
}

if (require.main === module) {
  renderVideo('showreel.mp4', 'ARENA')
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Render error:', err);
      process.exit(1);
    });
}

module.exports = {
  renderVideo
};
