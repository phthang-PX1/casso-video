import { COLORS } from "./theme";

// Shared spring/coil illustration — used stretching in Card3Metaphor and
// reused (stuck/jammed state) in Card3bStuckSpring so the "nợ xấu" beat
// stays visually continuous with the same object instead of switching to a
// new illustration (balloon) mid-metaphor.
export const Coil: React.FC<{ length: number; coils?: number; draw?: number; color?: string; jitter?: number }> = ({
  length,
  coils = 9,
  draw = 0,
  color = COLORS.brandSolid,
  jitter = 0,
}) => {
  const amplitude = 26;
  const points: string[] = [`0,${amplitude}`];
  for (let i = 1; i <= coils * 2; i++) {
    const x = (i * length) / (coils * 2) + (jitter ? Math.sin(i * 7) * jitter : 0);
    const y = i % 2 === 0 ? amplitude * 2 + (jitter ? Math.cos(i * 5) * jitter : 0) : 0 + (jitter ? Math.sin(i * 3) * jitter : 0);
    points.push(`${x},${y}`);
  }
  const clean = `M ${points.join(" L ")}`;
  const estimatedPathLength = length * 1.35 + coils * 20;
  return (
    <svg width={length} height={amplitude * 2 + 8 + jitter} style={{ overflow: "visible" }}>
      <path
        d={clean}
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={estimatedPathLength}
        strokeDashoffset={draw * estimatedPathLength}
      />
    </svg>
  );
};
