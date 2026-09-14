import { COLORS } from "./theme";

// Shared coil/helix spring — a single continuous path (no dash breaks) that
// stretches smoothly by increasing `length`. Used by both Card 3 and Card 3b
// so the spring is pixel-identical at the cut between them (seamless).
//
// Parametrisation of a side-viewed helix: as phi advances, the wire circles
// (sin/cos) while drifting along +x (prog*length). The radius*sin(phi) term
// on x makes the loops lean/overlap like a real coil rather than a flat
// zigzag. Endpoints land at the vertical centre (y=radius) at x=0 and
// x=width, so anchor stubs connect cleanly.

export const SPRING = {
  x0: 250, // left end of the coil box, in 1080-wide canvas coords
  cy: 720, // vertical centre
  radius: 46,
  coils: 7,
  minLength: 170,
  maxLength: 520,
};

export function springPath(length: number, coils = SPRING.coils, radius = SPRING.radius, samplesPerCoil = 40) {
  const total = coils * samplesPerCoil;
  let d = "";
  for (let i = 0; i <= total; i++) {
    const phi = (i / samplesPerCoil) * Math.PI * 2;
    const prog = i / total;
    const x = radius + prog * length + radius * Math.sin(phi);
    const y = radius - radius * Math.cos(phi);
    d += (i === 0 ? "M " : "L ") + x.toFixed(2) + " " + y.toFixed(2) + " ";
  }
  return d;
}

export const Spring: React.FC<{
  length: number;
  draw?: number; // 0 = fully drawn, 1 = not drawn (for a draw-on entrance)
  color?: string;
  strokeWidth?: number;
  radius?: number;
  coils?: number;
}> = ({ length, draw = 0, color = COLORS.brandSolid, strokeWidth = 11, radius = SPRING.radius, coils = SPRING.coils }) => {
  const width = length + 2 * radius;
  const height = 2 * radius;
  const d = springPath(length, coils, radius);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible", display: "block" }}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={draw * 100}
      />
    </svg>
  );
};
