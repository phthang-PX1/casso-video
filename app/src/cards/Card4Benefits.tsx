import { Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CardScene } from "../CardScene";
import { Icon } from "../Icon";
import { SfxCue } from "../SfxCue";
import { useIdlePulse } from "../useIdlePulse";
import { COLORS, FONT_FAMILY } from "../theme";
import { findWord } from "../narrationTimestamps";
import type { IconName } from "../icons";

// v6 Card 4 (Lợi ích) — reworked from a bullet list into an illustrated
// "growth" scene: an upward trend line draws itself with a rising green area,
// and the 3 benefits pop as milestone markers ALONG the climb (synced to each
// phrase), ending at a flag with the 2-pill "bí quyết". Motion-driven and
// pictorial rather than a stack of rows.
const LEAD_FRAMES = 10;

// Trend line control points (rising left->bottom to right->top) in canvas coords.
const BASE_Y = 1180;
const LINE = "M 200 1120 C 300 1085, 320 1035, 380 1000 C 470 950, 500 900, 570 840 C 660 765, 700 720, 760 660 C 815 605, 850 585, 880 560";
const LINE_END = { x: 880, y: 560 };

// milestones along the line, each tied to a phrase in the narration
const MILESTONE_BASE: { word: string; icon: IconName; label: string; x: number; y: number }[] = [
  { word: "xoay", icon: "clockCircle", label: "Xoay vòng vốn", x: 380, y: 1000 },
  { word: "ngay", icon: "creditCard", label: "Mua ngay", x: 570, y: 840 },
  { word: "tốt.", icon: "diagramUp", label: "Lịch sử tốt", x: 760, y: 660 },
];
const MILESTONES = MILESTONE_BASE.map((m) => ({ ...m, frame: findWord("card_4", m.word)?.startFrame ?? LEAD_FRAMES + 40 }));

const DRAW_START = LEAD_FRAMES + 40;
const DRAW_END = (findWord("card_4", "tốt.")?.startFrame ?? 174) + 12;
const FLAG_FRAME = DRAW_END;
const SECRET_FRAME = findWord("card_4", "Bí")?.startFrame ?? 190;
const PILL1_FRAME = findWord("card_4", "khả")?.startFrame ?? 240;
const PILL2_FRAME = findWord("card_4", "hạn.")?.startFrame ?? 285;

const Milestone: React.FC<{ m: (typeof MILESTONES)[number] }> = ({ m }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - m.frame, fps, config: { damping: 12, mass: 0.4 } });
  const idle = useIdlePulse(m.frame + 16, { amplitude: 0.03, periodFrames: 58 });
  if (frame < m.frame) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: m.x - 130,
        top: m.y - 190,
        width: 260,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        transform: `scale(${0.7 + pop * 0.3}) ${frame >= m.frame + 16 ? idle.transform : ""}`,
        transformOrigin: "center bottom",
      }}
    >
      <SfxCue frame={m.frame} kind="pop" volume={0.6} />
      <div
        style={{
          background: COLORS.canvasAlt,
          border: `2px solid #E5E7EB`,
          borderRadius: 999,
          padding: "8px 20px 8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: COLORS.brandSolid,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name={m.icon} size={30} color={COLORS.canvasAlt} />
        </div>
        <span style={{ fontFamily: FONT_FAMILY, fontSize: 30, fontWeight: 800, color: COLORS.neutralTextTemp }}>{m.label}</span>
      </div>
      {/* connector dot down to the line */}
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: COLORS.brandSolid, border: `3px solid ${COLORS.canvasAlt}` }} />
    </div>
  );
};

const SecretPill: React.FC<{ appearFrame: number; label: string }> = ({ appearFrame, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - appearFrame, fps, config: { damping: 11, mass: 0.4 } });
  const idle = useIdlePulse(appearFrame + 16, { amplitude: 0.02, periodFrames: 60 });
  if (frame < appearFrame) return <div style={{ opacity: 0 }} />;
  return (
    <div
      style={{
        transform: `scale(${0.7 + pop * 0.3}) ${frame >= appearFrame + 16 ? idle.transform : ""}`,
        background: COLORS.brandSolid,
        color: COLORS.canvasAlt,
        fontFamily: FONT_FAMILY,
        fontSize: 34,
        fontWeight: 800,
        borderRadius: 999,
        padding: "16px 38px",
        boxShadow: "0 12px 28px rgba(0,168,94,0.28)",
        whiteSpace: "nowrap",
      }}
    >
      <SfxCue frame={appearFrame} kind="pop" volume={0.6} />
      {label}
    </div>
  );
};

export const Card4Benefits: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // wipe reveal of the trend line + area, left -> right
  const wipeX = interpolate(frame, [DRAW_START, DRAW_END], [180, 940], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flagPop = spring({ frame: frame - FLAG_FRAME, fps, config: { damping: 11, mass: 0.5 } });
  const secretOpacity = interpolate(frame, [SECRET_FRAME, SECRET_FRAME + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CardScene>
      <Sequence from={LEAD_FRAMES}>
        <Audio src={staticFile("audio/card_4.mp3")} />
      </Sequence>
      <SfxCue frame={LEAD_FRAMES - 5} kind="whoosh" volume={0.6} />
      <SfxCue frame={DRAW_START} kind="pop" volume={0.4} />

      {/* growth chart */}
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <clipPath id="growthWipe">
            <rect x={0} y={0} width={wipeX} height={1920} />
          </clipPath>
          <linearGradient id="growthArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.brandSolid} stopOpacity={0.28} />
            <stop offset="100%" stopColor={COLORS.brandSolid} stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* baseline */}
        <line x1={200} y1={BASE_Y} x2={900} y2={BASE_Y} stroke="#E5E7EB" strokeWidth={3} />
        <g clipPath="url(#growthWipe)">
          {/* area under the line */}
          <path d={`${LINE} L ${LINE_END.x} ${BASE_Y} L 200 ${BASE_Y} Z`} fill="url(#growthArea)" />
          {/* the trend line */}
          <path d={LINE} fill="none" stroke={COLORS.brandSolid} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {/* arrow head at the top when the line reaches it */}
        {frame >= FLAG_FRAME - 6 && (
          <g transform={`translate(${LINE_END.x} ${LINE_END.y}) scale(${0.6 + flagPop * 0.4})`}>
            <path d="M -22 14 L 0 -20 L 22 14 Z" fill={COLORS.brandSolid} />
          </g>
        )}
      </svg>

      {/* milestones along the climb */}
      {MILESTONES.map((m) => (
        <Milestone key={m.word} m={m} />
      ))}

      {/* flag / payoff at the top */}
      {frame >= FLAG_FRAME && (
        <div
          style={{
            position: "absolute",
            left: LINE_END.x - 30,
            top: LINE_END.y - 150,
            transform: `scale(${flagPop})`,
            transformOrigin: "left bottom",
          }}
        >
          <Icon name="checkCircle" size={64} color={COLORS.positive} />
        </div>
      )}

      {/* Bí quyết */}
      {frame >= SECRET_FRAME && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            opacity: secretOpacity,
          }}
        >
          <div style={{ fontFamily: FONT_FAMILY, fontSize: 26, fontWeight: 800, letterSpacing: 3, color: COLORS.brandSolid }}>
            BÍ QUYẾT
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            <SecretPill appearFrame={PILL1_FRAME} label="Vay trong khả năng" />
            <SecretPill appearFrame={PILL2_FRAME} label="Trả đúng hạn" />
          </div>
        </div>
      )}
    </CardScene>
  );
};
