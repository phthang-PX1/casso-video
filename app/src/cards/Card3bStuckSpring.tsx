import { Audio, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";
import { CardScene } from "../CardScene";
import { Spring, SPRING } from "../Spring";
import { Icon } from "../Icon";
import { Keyword } from "../Keyword";
import { SfxCue } from "../SfxCue";
import { COLORS, FONT_FAMILY } from "../theme";
import { findWord } from "../narrationTimestamps";
import type { IconName } from "../icons";

// v6 Card 3b — continues the SAME coil spring from Card 3 (identical Spring
// component + SPRING layout + anchors + fully-stretched length), so the cut
// from Card 3 is seamless. Here a reverse arrow tries to pull it back but the
// spring is jammed: it jitters, greys out, a "Trễ hạn" counter climbs, and
// it can't recoil — that's when tín dụng becomes nợ xấu.
const LEAD_FRAMES = 10;
const JAM_FRAME = findWord("card_3b", "không")?.startFrame ?? 76;
const XAU_FRAME = findWord("card_3b", "xấu")?.startFrame ?? 187;
const CAPTION_FRAME = LEAD_FRAMES + 5;
const RIGHT_ANCHOR_X = 930;

const AnchorChip: React.FC<{ icon: IconName; label: string; cx: number; cy: number }> = ({ icon, label, cx, cy }) => (
  <div
    style={{ position: "absolute", left: cx - 55, top: cy - 55, width: 110, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
  >
    <div
      style={{
        width: 88,
        height: 88,
        borderRadius: 22,
        background: COLORS.canvas,
        border: `2px solid #E5E7EB`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icon} size={46} color={COLORS.neutralTextTemp} />
    </div>
    <div style={{ fontFamily: FONT_FAMILY, fontSize: 24, fontWeight: 700, color: COLORS.neutralMutedTemp, whiteSpace: "nowrap" }}>
      {label}
    </div>
  </div>
);

export const Card3bStuckSpring: React.FC = () => {
  const frame = useCurrentFrame();
  const length = SPRING.maxLength; // starts (and stays) fully stretched — seamless from Card 3
  const width = length + 2 * SPRING.radius;
  const rightEnd = SPRING.x0 + width;

  const jam = interpolate(frame, [JAM_FRAME, XAU_FRAME], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const color = interpolateColors(frame, [JAM_FRAME, XAU_FRAME], [COLORS.brandSolid, "#9CA3AF"]);
  // straining jitter — grows as it fails to recoil, never fully still
  const jitterAmp = frame >= JAM_FRAME ? 2 + jam * 5 : 0.6;
  const jitterX = Math.sin(frame * 1.3) * jitterAmp;
  const jitterY = Math.cos(frame * 1.1) * jitterAmp * 0.5;

  const reverseOpacity = interpolate(frame, [JAM_FRAME, JAM_FRAME + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const reversePulse = frame >= JAM_FRAME ? 1 + Math.sin(frame * 0.9) * 0.06 : 1;
  const days = frame >= JAM_FRAME ? 1 + Math.floor((frame - JAM_FRAME) / 8) : 0;

  const xauOpacity = interpolate(frame, [XAU_FRAME, XAU_FRAME + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <CardScene>
      <Sequence from={LEAD_FRAMES}>
        <Audio src={staticFile("audio/card_3b.mp3")} />
      </Sequence>
      <SfxCue frame={LEAD_FRAMES - 5} kind="whoosh" volume={0.6} />
      {frame >= JAM_FRAME && <SfxCue frame={JAM_FRAME} kind="pop" volume={0.5} />}

      {/* stubs + reverse arrow */}
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <line x1={200} y1={SPRING.cy} x2={SPRING.x0} y2={SPRING.cy} stroke={COLORS.neutralMutedTemp} strokeWidth={3} />
        <line x1={rightEnd} y1={SPRING.cy} x2={RIGHT_ANCHOR_X - 55} y2={SPRING.cy} stroke={COLORS.neutralMutedTemp} strokeWidth={3} strokeDasharray="6 8" />
        {frame >= JAM_FRAME && (
          <g opacity={reverseOpacity} transform={`translate(${(1 - reversePulse) * (SPRING.x0 + width / 2)} 0) scale(${reversePulse} 1)`}>
            <path
              d={`M ${rightEnd - 20} ${SPRING.cy + SPRING.radius + 60} C ${(SPRING.x0 + rightEnd) / 2} ${SPRING.cy + SPRING.radius + 110}, ${SPRING.x0 + 120} ${SPRING.cy + SPRING.radius + 90}, ${SPRING.x0 + 60} ${SPRING.cy + SPRING.radius + 64}`}
              fill="none"
              stroke={COLORS.negativeTemp}
              strokeWidth={4}
              markerEnd="url(#arrowRevB)"
            />
            <defs>
              <marker id="arrowRevB" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto">
                <path d="M0,0 L9,4.5 L0,9 Z" fill={COLORS.negativeTemp} />
              </marker>
            </defs>
          </g>
        )}
      </svg>

      {/* the jammed spring */}
      <div
        style={{
          position: "absolute",
          left: SPRING.x0,
          top: SPRING.cy - SPRING.radius,
          transform: `translate(${jitterX}px, ${jitterY}px)`,
        }}
      >
        <Spring length={length} color={color} />
      </div>

      {/* anchors */}
      <AnchorChip icon="users" label="Hiện tại" cx={150} cy={SPRING.cy} />
      <AnchorChip icon="calendar" label="Tương lai" cx={RIGHT_ANCHOR_X} cy={SPRING.cy} />

      {/* Trễ hạn counter */}
      {frame >= JAM_FRAME && (
        <div
          style={{
            position: "absolute",
            left: SPRING.x0,
            top: SPRING.cy - SPRING.radius - 78,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Icon name="alertTriangle" size={30} color={COLORS.negativeTemp} />
          <span style={{ fontFamily: FONT_FAMILY, fontSize: 30, fontWeight: 800, color: COLORS.negativeTemp }}>
            Trễ hạn: {days} ngày
          </span>
        </div>
      )}

      {/* Nợ xấu label */}
      {frame >= XAU_FRAME && (
        <div style={{ position: "absolute", left: SPRING.x0 + width / 2 - 90, top: SPRING.cy + SPRING.radius + 130, opacity: xauOpacity }}>
          <SfxCue frame={XAU_FRAME} kind="pop" volume={0.8} />
          <div
            style={{
              background: COLORS.negativeTemp,
              color: COLORS.canvasAlt,
              fontFamily: FONT_FAMILY,
              fontSize: 40,
              fontWeight: 800,
              padding: "10px 34px",
              borderRadius: 999,
            }}
          >
            Nợ xấu
          </div>
        </div>
      )}

      {/* caption */}
      {frame >= CAPTION_FRAME && (
        <div
          style={{
            position: "absolute",
            left: 130,
            right: 130,
            top: 1200,
            textAlign: "center",
            fontFamily: FONT_FAMILY,
            fontSize: 34,
            fontWeight: 600,
            lineHeight: 1.4,
            color: COLORS.neutralTextTemp,
          }}
        >
          Nhưng nếu lò xo giãn quá lâu, không co lại được nữa - <Keyword tone="negative">nợ xấu</Keyword> sẽ xuất hiện.
        </div>
      )}
    </CardScene>
  );
};
