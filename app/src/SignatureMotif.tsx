import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, DISPLAY_FONT_FAMILY } from "./theme";
import { useIdlePulse } from "./useIdlePulse";

// v6 Card 0 "signature motif" — a green highlight block that hugs a keyword
// TIGHTLY (small padding, sized to the text) so the keyword reads as part of
// a continuous line, with the block as an accent behind it — not a big
// padded box that pushes following words away (the user's correction). The
// box auto-sizes to its text; the border draw uses SVG pathLength
// normalization so it works without knowing pixel dimensions ahead of time.
//
// Reveal order (from the real Figma file, node 167:205): 2 corner-handle
// dots (top-left + bottom-right) pop in first, staggered; then the thin
// offset black border draws itself; then the green block swipes in
// left->right (clip-path, not fade); then the white keyword appears on top.
export const SignatureMotif: React.FC<{
  word: string;
  startFrame: number;
  fontSize?: number;
  padV?: number;
  padH?: number;
}> = ({ word, startFrame, fontSize = 60, padV = 12, padH = 22 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - startFrame;

  const dotStagger = 1.8;
  const dotScales = [0, 1].map((i) => spring({ frame: t - i * dotStagger, fps, config: { damping: 12, mass: 0.4 } }));
  // pathLength-normalized draw: dasharray/offset in 0..100 regardless of size.
  const borderDraw = interpolate(t, [8, 23], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // green block swipes in: clip-path inset from the right, 100% -> 0%.
  const swipeInset = interpolate(t, [18, 30], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textOpacity = interpolate(t, [28, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textScale = spring({ frame: t - 28, fps, config: { damping: 14, mass: 0.5 } });

  const idle = useIdlePulse(startFrame + 45, { amplitude: 0.012, periodFrames: 70 });
  const settled = t >= 45;

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        padding: `${padV}px ${padH}px`,
        transform: settled ? idle.transform : undefined,
      }}
    >
      {/* green highlight block, hugging the text, swiping in left->right */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: COLORS.brandSolid,
          borderRadius: 4,
          transform: "rotate(-1.5deg)",
          clipPath: `inset(0 ${swipeInset}% 0 0)`,
        }}
      />
      {/* offset black border + 2 corner dots, drawn via pathLength */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", transform: "rotate(1.5deg)" }}
        preserveAspectRatio="none"
      >
        <rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          rx={4}
          fill="none"
          stroke="#111111"
          strokeWidth={3}
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={borderDraw}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={0} cy={0} r={7} fill="#111111" style={{ transform: `scale(${dotScales[0]})`, transformOrigin: "0 0" }} />
        <circle cx="100%" cy="100%" r={7} fill="#111111" style={{ transform: `scale(${dotScales[1]})`, transformOrigin: "100% 100%" }} />
      </svg>
      {/* keyword text — in normal flow so the box sizes to it */}
      <span
        style={{
          position: "relative",
          fontFamily: DISPLAY_FONT_FAMILY,
          fontSize,
          lineHeight: 1,
          color: COLORS.canvasAlt,
          textTransform: "uppercase",
          letterSpacing: 1,
          whiteSpace: "nowrap",
          opacity: textOpacity,
          display: "inline-block",
          transform: `scale(${0.85 + textScale * 0.15})`,
        }}
      >
        {word}
      </span>
    </div>
  );
};
