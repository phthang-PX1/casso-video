import rough from "roughjs";
import { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";

// Frame-driven hand-drawn underline. Deliberately does NOT use rough-notation's
// annotate().show() — that API animates on a real-time (rAF/performance.now())
// ticker with no seek control, which is the exact GSAP-style desync risk
// documented in SKILL.md section 6/7. roughjs (the lower-level library
// rough-notation itself is built on) generates a static wobbly path
// synchronously; we drive its reveal with Remotion's own interpolate(), so it
// is frame-exact and reproducible on every render.
export const RoughUnderline: React.FC<{
  width: number;
  color: string;
  startFrame: number;
  revealFrames?: number;
}> = ({ width, color, startFrame, revealFrames = 9 }) => {
  const frame = useCurrentFrame();
  const height = 14;

  const paths = useMemo(() => {
    const generator = rough.generator();
    const drawable = generator.line(3, height / 2 + 2, width - 3, height / 2 - 2, {
      stroke: color,
      strokeWidth: 4,
      roughness: 1.6,
      bowing: 1,
    });
    return generator.toPaths(drawable);
  }, [width, color]);

  const progress = interpolate(frame, [startFrame, startFrame + revealFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dashLength = width * 1.3;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", left: 0, bottom: -height + 4, overflow: "visible" }}
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dashLength}
          strokeDashoffset={dashLength * (1 - progress)}
        />
      ))}
    </svg>
  );
};
