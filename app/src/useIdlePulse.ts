import { useCurrentFrame } from "remotion";

// Fixes the "91% of the video is frozen" measurement: GSAP/interpolate
// entrances finish in <1s, but narration for that beat runs 8-12s, leaving
// the held frame bit-for-bit identical for seconds at a time (frame-diff ==
// 0). This gives every "settled" element a small continuous sine-driven
// breathing motion for as long as it's on screen, so no element is ever
// bit-identical between two frames while `sinceFrame <= frame`.
export function useIdlePulse(
  sinceFrame: number,
  opts: { amplitude?: number; driftPx?: number; periodFrames?: number; rotateAmplitude?: number } = {}
) {
  const frame = useCurrentFrame();
  // `amplitude` drives scale (kept small — a breathing pulse, not a resize).
  // `driftPx` is a separate, larger vertical bob in real pixels so the
  // motion is actually visible (and registers on frame-diff tooling)
  // without the scale factor having to get big enough to look like pumping.
  const { amplitude = 0.02, driftPx = Math.max(6, amplitude * 150), periodFrames = 75, rotateAmplitude = 0 } = opts;
  const t = Math.max(0, frame - sinceFrame);
  const phase = (t / periodFrames) * Math.PI * 2;
  const scale = 1 + Math.sin(phase) * amplitude;
  const y = Math.sin(phase) * driftPx;
  const rotate = rotateAmplitude ? Math.sin(phase * 0.6) * rotateAmplitude : 0;
  return { scale, y, rotate, transform: `scale(${scale}) translateY(${y}px) rotate(${rotate}deg)` };
}
