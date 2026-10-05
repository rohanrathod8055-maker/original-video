// Mathematical Easing & Physics Utilities for Motion Design

function sampleBezierX(t, p1x, p2x) {
  return (3 * (1 - t) * (1 - t) * t * p1x) + (3 * (1 - t) * t * t * p2x) + (t * t * t);
}

function sampleBezierY(t, p1y, p2y) {
  return (3 * (1 - t) * (1 - t) * t * p1y) + (3 * (1 - t) * t * t * p2y) + (t * t * t);
}

function sampleBezierXDeriv(t, p1x, p2x) {
  return (3 * (1 - t) * (1 - t) * p1x) + (6 * (1 - t) * t * (p2x - p1x)) + (3 * t * t * (1 - p2x));
}

function solveCubicBezier(x, p1x, p1y, p2x, p2y) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Newton-Raphson iteration
  let t = x;
  for (let i = 0; i < 8; i++) {
    const xEst = sampleBezierX(t, p1x, p2x) - x;
    if (Math.abs(xEst) < 1e-5) break;
    const dX = sampleBezierXDeriv(t, p1x, p2x);
    if (Math.abs(dX) < 1e-5) break;
    t -= xEst / dX;
    t = Math.max(0, Math.min(1, t));
  }

  // Fallback to binary search if not converged
  let t0 = 0, t1 = 1;
  let currX = sampleBezierX(t, p1x, p2x);
  if (Math.abs(currX - x) > 1e-4) {
    t = x;
    while (t0 < t1) {
      currX = sampleBezierX(t, p1x, p2x);
      if (Math.abs(currX - x) < 1e-5) break;
      if (x > currX) t0 = t;
      else t1 = t;
      t = (t1 + t0) / 2;
      if (Math.abs(t1 - t0) < 1e-6) break;
    }
  }

  return sampleBezierY(t, p1y, p2y);
}

// Snappy custom cubic-bezier (0.83, 0.00, 0.17, 1.00)
function snappyEase(t) {
  return solveCubicBezier(Math.max(0, Math.min(1, t)), 0.83, 0.00, 0.17, 1.00);
}

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t, s = 1.70158) {
  const c1 = s;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutElastic(t) {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

module.exports = {
  sampleBezierX,
  sampleBezierY,
  solveCubicBezier,
  snappyEase,
  easeOutExpo,
  easeInOutCubic,
  easeOutBack,
  easeOutElastic,
  clamp,
  lerp
};
