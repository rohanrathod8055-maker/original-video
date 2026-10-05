# 🎬 Motion Designer Showreel 2026

A 15-second generative motion graphics showreel coded from scratch frame-by-frame, demonstrating mathematical easing physics, kinetic typography, generative Bauhaus geometry, 3D isometric voxel rendering, toroidal vector fields, and HUD telemetry synced to 120 BPM.

---

## 📹 Video Deliverables

- **Rendered Output:** `showreel.mp4` (~18.2 MB, 1280x720 @ 30 FPS, H.264 High Profile, 48kHz Stereo AAC)
- **Duration:** 15.03 seconds (450 frames exact)
- **Tempo:** 120.0 BPM (15 frames per beat / 60 frames per bar)

---

## ⏱ Scene-by-Scene Architecture

| Scene | Timecode | Frames | Title | Description |
|---|---|---|---|---|
| **00** | `00:00:00` – `00:00:02` | `000`–`059` | **00 / INTRO** | Interactive Bézier Curve Graph Editor UI with animated cursor manipulating tangent handles to `cubic-bezier(0.83, 0.00, 0.17, 1.00)`, accelerating kinetic playhead orb with trailing motion blur and burst. |
| **01** | `00:00:02` – `00:00:04` | `060`–`119` | **01 / TYPE** | Slamming kinetic typography **"MOTION"** on warm studio orange, horizontal scanline displacement glitch cut morphing into multi-tier kinetic marquee wall with center **"DESIGN"**. |
| **02** | `00:00:04` – `00:00:06` | `120`–`179` | **02 / SHAPE** | 10×6 generative Bauhaus modular tile grid with cascading radial snap-rotation waves and optical illusion color shifts. |
| **03** | `00:00:06` – `00:00:08` | `180`–`239` | **03 / DEPTH** | 3D isometric voxel matrix with amphitheater perimeter, 3-face shaded directional lighting, and center tower shockwave surges. |
| **04** | `00:00:08` – `00:00:10` | `240`–`299` | **04 / FLOW** | 6,500+ particle 3D toroidal vortex in deep space with velocity-stretched filaments, camera tilt/yaw orbit, and Z-depth attenuation. |
| **05** | `00:00:10` – `00:00:12` | `300`–`359` | **05 / RHYTHM** | 4-beat typographic study: **"EASE"** (cubic-bezier slide), **"WEIGHT"** (100→900 stroke morph), **"SPACE"** (tracking -0.06em→0.32em), **"SCALE"** (elastic pop 0.25→1.25). |
| **06** | `00:00:12` – `00:00:15` | `360`–`450` | **06 / HELLO** | High-end identity finale: Display typography **"ARENA."** with glowing orange accent period, editorial italic serif *"Motion Designer"*, shimmer highlight divider rule, and pulsing `● AVAILABLE FOR WORK` badge. |

---

## 🛠 Technical Pipeline

- **Rendering Engine:** `@napi-rs/canvas` (HTML5 Canvas 2D / Subpixel Vector Graphics)
- **Video Encoder:** FFmpeg H.264 CRF 17 pipe muxed with 120 BPM synchronized soundtrack
- **Post-Processing:** Procedural film grain noise, radial vignette luminance falloff, chromatic aberration glitch shifts
- **HUD System:** Dynamic corner brackets, frame-accurate SMPTE timecode (`TC 00:00:SS:FF`), dynamic section indicator, and 4-step metronome sequencer

---

## 🚀 How to Run & Re-render

### 1. Re-render Video
```bash
node src/render.js
```

### 2. Start Interactive Web Preview Server
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000) to view the interactive player with frame stepper, speed controls, scene timeline, and specs.
