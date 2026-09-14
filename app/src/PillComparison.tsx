import { useCurrentFrame } from "remotion";
import { COLORS, FONT_FAMILY } from "./theme";
import { Icon } from "./Icon";
import { SfxCue } from "./SfxCue";
import { useIdlePulse } from "./useIdlePulse";
import type { IconName } from "./icons";

type Pill = { icon: IconName; label: string; color: string };

// Reused layout (Card4 + Card6): "template dùng lại, dữ liệu thay đổi" per
// SKILL.md storytelling principle. Hard-cut reveal (no easing) — instant
// opacity 0/1 switch at revealFrame, matching the "chốt đúng/sai" tier.
// Lives inside <SceneCard> now (flex child), not absolutely positioned
// against the full 1920px canvas like in v1.
export const PillComparison: React.FC<{
  title: string;
  left: Pill;
  right: Pill;
  leftRevealFrame: number;
  rightRevealFrame: number;
  // true when rendered directly on the brand gradient (SceneCard variant="full")
  // instead of inside the white card — dark text would be unreadable there.
  light?: boolean;
}> = ({ title, left, right, leftRevealFrame, rightRevealFrame, light = false }) => {
  const frame = useCurrentFrame();
  const textColor = light ? COLORS.canvasAlt : COLORS.neutralTextTemp;

  // Hard-cut reveal is instant, but each side then sits on screen for
  // several seconds while the other side (and the rest of the narration)
  // plays out — without idle motion this is exactly the kind of held frame
  // the frame-diff audit measured as bit-for-bit frozen.
  const Side: React.FC<{ pill: Pill; revealFrame: number }> = ({ pill, revealFrame }) => {
    const idle = useIdlePulse(revealFrame + 15, { amplitude: 0.025, periodFrames: 68 });
    const settled = frame >= revealFrame + 15;
    return (
      <div
        style={{
          width: 340,
          opacity: frame >= revealFrame ? 1 : 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {frame >= revealFrame && <SfxCue frame={revealFrame} kind="pop" volume={0.7} />}
        <div
          style={{
            width: 190,
            height: 190,
            borderRadius: 42,
            background: COLORS.canvasAlt,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 26px rgba(0,0,0,0.12)",
            border: `5px solid ${pill.color}`,
            transform: settled ? idle.transform : undefined,
          }}
        >
          <Icon name={pill.icon} size={100} color={pill.color} />
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, color: textColor, textAlign: "center" }}>
          {pill.label}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
          color: textColor,
          textAlign: "center",
          padding: "0 40px",
          fontFamily: FONT_FAMILY,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", gap: 60, justifyContent: "center" }}>
        <Side pill={left} revealFrame={leftRevealFrame} />
        <Side pill={right} revealFrame={rightRevealFrame} />
      </div>
    </>
  );
};
