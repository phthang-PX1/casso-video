import { COLORS } from "./theme";
import { useIdlePulse } from "./useIdlePulse";

// Small sprout decoration (bottom-right corner in the Figma reference) — a
// thin curved stem with 2 leaves. Sways continuously (never static) via
// useIdlePulse's rotate option, anchored at its base like a real plant.
export const LeafSprout: React.FC<{ size?: number; sinceFrame?: number }> = ({ size = 70, sinceFrame = 0 }) => {
  const idle = useIdlePulse(sinceFrame, { amplitude: 0, periodFrames: 90, rotateAmplitude: 4 });
  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 70 91"
      style={{ overflow: "visible", transform: idle.transform, transformOrigin: "50% 100%" }}
    >
      <path d="M35 91 C 35 60, 30 45, 33 20" stroke={COLORS.neutralMutedTemp} strokeWidth={2} fill="none" />
      <path d="M33 28 C 20 24, 14 14, 12 4 C 26 6, 34 14, 33 28 Z" fill={COLORS.brandSolid} />
      <path d="M34 46 C 46 40, 52 30, 53 20 C 40 24, 33 32, 34 46 Z" fill={COLORS.brandSolid} />
    </svg>
  );
};
