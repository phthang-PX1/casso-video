import { interpolate } from "remotion";
import { COLORS } from "./theme";

// "nợ xấu = bóng bay xì hơi" — the concrete-object metaphor for an abstract
// concept, per SKILL.md's storytelling table. Previously a single filled
// ellipse (one flat shape, no layering). Restructured into 4 layers so it
// reads as an illustration rather than a colored blob:
//   1. halo   — soft glow behind the balloon, fades in first
//   2. string — hand-drawn via stroke-dasharray/dashoffset ("vẽ ra" reveal,
//      the same technique as RoughUnderline — GSAP's paid DrawSVGPlugin is
//      not available in the free npm `gsap` package, so this is the
//      equivalent effect built from Remotion's own interpolate())
//   3. body   — the balloon itself (existing deflate transform)
//   4. wrinkles — 2 accent strokes that draw in one after another as the
//      balloon crosses the halfway point of deflating, instead of both
//      popping in at once via opacity.
export const DeflatingBalloon: React.FC<{ progress: number; size?: number }> = ({
  progress,
  size = 260,
}) => {
  const p = Math.max(0, Math.min(1, progress));
  const scaleY = interpolate(p, [0, 1], [1, 0.5]);
  const scaleX = interpolate(p, [0, 1], [1, 1.25]);
  const rotate = interpolate(p, [0, 1], [0, -8]);
  const droop = interpolate(p, [0, 1], [0, 26]);
  const color = p < 0.5 ? COLORS.negativeTemp : "#9CA3AF";
  const haloOpacity = interpolate(p, [0, 0.15], [0, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Wrinkle path lengths measured from their own `d` (both ~34 units long at
  // this viewBox scale) — dashoffset goes full-length -> 0 to "draw" each
  // one, staggered so the second starts only after the first is half-drawn.
  const WRINKLE_LEN = 34;
  const wrinkle1Draw = interpolate(p, [0.45, 0.58], [WRINKLE_LEN, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wrinkle2Draw = interpolate(p, [0.55, 0.7], [WRINKLE_LEN, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 200 270" style={{ overflow: "visible" }}>
      <ellipse cx={100} cy={90} rx={95} ry={105} fill={color} opacity={haloOpacity} />

      <path
        d={`M 100 ${182 + droop * 0.4} Q ${100 + droop} ${210 + droop} 100 ${240 + droop}`}
        stroke="#9CA3AF"
        strokeWidth={3}
        fill="none"
      />

      <g transform={`translate(100 100) scale(${scaleX} ${scaleY}) rotate(${rotate}) translate(-100 -100)`}>
        <ellipse cx={100} cy={90} rx={70} ry={82} fill={color} />
        <path
          d="M 92 90 Q 100 105 108 90"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth={4}
          fill="none"
          strokeDasharray={WRINKLE_LEN}
          strokeDashoffset={wrinkle1Draw}
        />
        <path
          d="M 80 60 Q 100 75 120 60"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={3}
          fill="none"
          strokeDasharray={WRINKLE_LEN}
          strokeDashoffset={wrinkle2Draw}
        />
        <path d="M 95 170 L 100 180 L 105 170 Z" fill={color} />
      </g>
    </svg>
  );
};
