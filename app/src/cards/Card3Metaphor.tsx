import { Audio, Easing, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";
import { CardScene } from "../CardScene";
import { Spring, SPRING } from "../Spring";
import { Icon } from "../Icon";
import { Keyword } from "../Keyword";
import { SfxCue } from "../SfxCue";
import { useIdlePulse } from "../useIdlePulse";
import { COLORS, FONT_FAMILY } from "../theme";
import { findWord, NARRATION } from "../narrationTimestamps";
import type { IconName } from "../icons";

// v6 Card 3 (Ẩn dụ: lò xo) — coil spring in the white card. The spring draws
// on, then stretches from "Hiện tại" toward "Tương lai" as the narration
// says it extends "sức mua"; a bracket measures the stretched span, and a
// reverse arrow labels the "khả năng kiếm tiền" needed to pull it back.
// The jammed-spring beat continues on this same scene and animation clock.
const LEAD_FRAMES = 10;
const DRAW_END = LEAD_FRAMES + 20;
const STRETCH_START = findWord("card_3", "kéo")?.startFrame ?? 81;
const STRETCH_END = STRETCH_START + 85;
const BRACKET_FRAME = findWord("card_3", "mua")?.startFrame ?? 97;
const REVERSE_FRAME = findWord("card_3", "lực")?.startFrame ?? 245;
const CAPTION_FRAME = findWord("card_3", "trước")?.startFrame ?? 118;
// Word timestamps include the original 10-frame audio lead-in.
// Keep three frames after the final word; trim only two silent opening frames.
const CONTINUATION_FRAME = NARRATION.card_3.speechEndFrame + 3;
const CONTINUATION_TRIM = 2;
const CONTINUATION_OFFSET = CONTINUATION_FRAME - LEAD_FRAMES - CONTINUATION_TRIM;
const JAM_FRAME = CONTINUATION_OFFSET + (findWord("card_3b", "không")?.startFrame ?? 76);
const XAU_FRAME = CONTINUATION_OFFSET + (findWord("card_3b", "xấu")?.startFrame ?? 137);
export const CARD3_DURATION = CONTINUATION_OFFSET + NARRATION.card_3b.speechEndFrame + 23;
const smooth = (frame: number, start: number, end: number) => interpolate(frame, [start, end], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
});

const RIGHT_ANCHOR_X = 930;

const AnchorChip: React.FC<{ icon: IconName; label: string; cx: number; cy: number }> = ({ icon, label, cx, cy }) => (
  <div
    style={{
      position: "absolute",
      left: cx - 55,
      top: cy - 55,
      width: 110,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
    }}
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

export const Card3Metaphor: React.FC = () => {
  const frame = useCurrentFrame();

  const draw = interpolate(frame, [LEAD_FRAMES, DRAW_END], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const length = interpolate(frame, [STRETCH_START, STRETCH_END], [SPRING.minLength, SPRING.maxLength], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const width = length + 2 * SPRING.radius;
  const rightEnd = SPRING.x0 + width;

  const idle = useIdlePulse(STRETCH_END, { amplitude: 0.01, periodFrames: 60 });
  const springSettled = frame >= STRETCH_END;
  const transition = smooth(frame, CONTINUATION_FRAME - 10, CONTINUATION_FRAME + 10);
  const jam = smooth(frame, JAM_FRAME, XAU_FRAME);
  const strain = smooth(frame, JAM_FRAME, JAM_FRAME + 18);
  const color = interpolateColors(jam, [0, 1], [COLORS.brandSolid, "#9CA3AF"]);
  const jitterX = Math.sin((frame - JAM_FRAME) * 1.3) * strain * (2 + jam * 5);
  const jitterY = Math.sin((frame - JAM_FRAME) * 1.1) * strain * (1 + jam * 2.5);
  const reversePulse = 1 + Math.sin((frame - JAM_FRAME) * 0.9) * strain * 0.04;
  const xauOpacity = smooth(frame, XAU_FRAME, XAU_FRAME + 12);
  const days = Math.max(0, 1 + Math.floor((frame - JAM_FRAME) / 8));

  const bracketOpacity = interpolate(frame, [BRACKET_FRAME, BRACKET_FRAME + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const reverseOpacity = interpolate(frame, [REVERSE_FRAME, REVERSE_FRAME + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CardScene>
      <Sequence from={LEAD_FRAMES} durationInFrames={CONTINUATION_FRAME - LEAD_FRAMES}>
        <Audio src={staticFile("audio/card_3.mp3")} />
      </Sequence>
      <Sequence from={CONTINUATION_FRAME}>
        <Audio src={staticFile("audio/card_3b.mp3")} trimBefore={CONTINUATION_TRIM} />
      </Sequence>
      <SfxCue frame={LEAD_FRAMES - 5} kind="whoosh" volume={0.6} />
      <SfxCue frame={STRETCH_START} kind="pop" volume={0.4} />
      <SfxCue frame={JAM_FRAME} kind="pop" volume={0.5} />
      <SfxCue frame={XAU_FRAME} kind="pop" volume={0.8} />

      {/* anchor stubs + spring */}
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {/* left stub: left anchor -> spring left end */}
        <line x1={200} y1={SPRING.cy} x2={SPRING.x0} y2={SPRING.cy} stroke={COLORS.neutralMutedTemp} strokeWidth={3} />
        {/* right stub: spring right end -> right anchor */}
        <line x1={rightEnd} y1={SPRING.cy} x2={RIGHT_ANCHOR_X - 55} y2={SPRING.cy} stroke={COLORS.neutralMutedTemp} strokeWidth={3} strokeDasharray="6 8" />

        {/* bracket over the stretched span */}
        {frame >= BRACKET_FRAME && (
          <g opacity={bracketOpacity * (1 - transition)}>
            <path
              d={`M ${SPRING.x0} ${SPRING.cy - SPRING.radius - 30} L ${SPRING.x0} ${SPRING.cy - SPRING.radius - 44} L ${rightEnd} ${SPRING.cy - SPRING.radius - 44} L ${rightEnd} ${SPRING.cy - SPRING.radius - 30}`}
              fill="none"
              stroke={COLORS.neutralMutedTemp}
              strokeWidth={3}
            />
          </g>
        )}

        {/* reverse pull arrow (khả năng kiếm tiền) */}
        {frame >= REVERSE_FRAME && (
          <g opacity={reverseOpacity} transform={`translate(${(1 - reversePulse) * (SPRING.x0 + width / 2)} 0) scale(${reversePulse} 1)`}>
            <path
              d={`M ${rightEnd - 20} ${SPRING.cy + SPRING.radius + 60} C ${(SPRING.x0 + rightEnd) / 2} ${SPRING.cy + SPRING.radius + 110}, ${SPRING.x0 + 120} ${SPRING.cy + SPRING.radius + 90}, ${SPRING.x0 + 60} ${SPRING.cy + SPRING.radius + 64}`}
              fill="none"
              stroke={COLORS.negativeTemp}
              strokeWidth={4}
              markerEnd="url(#arrowRev)"
            />
            <defs>
              <marker id="arrowRev" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto">
                <path d="M0,0 L9,4.5 L0,9 Z" fill={COLORS.negativeTemp} />
              </marker>
            </defs>
          </g>
        )}
      </svg>

      {/* bracket label */}
      {frame >= BRACKET_FRAME && (
        <div
          style={{
            position: "absolute",
            left: SPRING.x0,
            width: width,
            top: SPRING.cy - SPRING.radius - 92,
            textAlign: "center",
            opacity: bracketOpacity * (1 - transition),
            fontFamily: FONT_FAMILY,
            fontSize: 26,
            fontWeight: 700,
            color: COLORS.neutralMutedTemp,
          }}
        >
          Sức mua dùng trước
        </div>
      )}

      {/* the spring itself */}
      <div
        style={{
          position: "absolute",
          left: SPRING.x0,
          top: SPRING.cy - SPRING.radius,
          transformOrigin: "left center",
          transform: springSettled ? `translate(${jitterX}px, ${idle.y * (1 - strain) + jitterY}px) scale(${1 + (idle.scale - 1) * (1 - strain)})` : undefined,
        }}
      >
        <Spring length={length} draw={draw} color={color} />
      </div>

      {/* anchors */}
      <AnchorChip icon="users" label="Hiện tại" cx={150} cy={SPRING.cy} />
      <AnchorChip icon="calendar" label="Tương lai" cx={RIGHT_ANCHOR_X} cy={SPRING.cy} />

      {/* reverse label */}
      {frame >= REVERSE_FRAME && (
        <div
          style={{
            position: "absolute",
            left: SPRING.x0,
            width: width,
            top: SPRING.cy + SPRING.radius + 120,
            textAlign: "center",
            opacity: reverseOpacity * (1 - smooth(frame, JAM_FRAME, JAM_FRAME + 14)),
            fontFamily: FONT_FAMILY,
            fontSize: 26,
            fontWeight: 800,
            color: COLORS.negativeTemp,
          }}
        >
          Khả năng kiếm tiền để trả
        </div>
      )}

      {/* caption */}
      {frame >= CAPTION_FRAME && (
        <div
          style={{
            position: "absolute",
            left: 130,
            right: 130,
            top: 1160,
            opacity: 1 - smooth(frame, CONTINUATION_FRAME - 10, CONTINUATION_FRAME),
            transform: `translateY(${-8 * transition}px)`,
            textAlign: "center",
            fontFamily: FONT_FAMILY,
            fontSize: 34,
            fontWeight: 600,
            lineHeight: 1.4,
            color: COLORS.neutralTextTemp,
          }}
        >
          Tín dụng kéo dài <Keyword>sức mua</Keyword> ra trước - càng kéo dài, càng cần nhiều{" "}
          <Keyword tone="negative">khả năng kiếm tiền</Keyword> để kéo về đúng vị trí.
        </div>
      )}
      {frame >= JAM_FRAME && (
        <div style={{ position: "absolute", left: SPRING.x0, top: SPRING.cy - SPRING.radius - 78,
          display: "flex", alignItems: "center", gap: 12, opacity: strain, transform: `translateY(${8 * (1 - strain)}px)` }}>
          <Icon name="alertTriangle" size={30} color={COLORS.negativeTemp} />
          <span style={{ fontFamily: FONT_FAMILY, fontSize: 30, fontWeight: 800, color: COLORS.negativeTemp }}>Trễ hạn: {days} ngày</span>
        </div>
      )}
      {frame >= XAU_FRAME && (
        <div style={{ position: "absolute", left: SPRING.x0, width, top: SPRING.cy + SPRING.radius + 130,
          display: "flex", justifyContent: "center", opacity: xauOpacity, transform: `translateY(${10 * (1 - xauOpacity)}px) scale(${0.96 + 0.04 * xauOpacity})` }}>
          <div style={{ background: COLORS.negativeTemp, color: COLORS.canvasAlt, fontFamily: FONT_FAMILY,
            fontSize: 40, fontWeight: 800, padding: "10px 34px", borderRadius: 999 }}>Nợ xấu</div>
        </div>
      )}
      {frame >= CONTINUATION_FRAME && (
        <div style={{ position: "absolute", left: 130, right: 130, top: 1160, textAlign: "center",
          fontFamily: FONT_FAMILY, fontSize: 34, fontWeight: 600, lineHeight: 1.4, color: COLORS.neutralTextTemp,
          opacity: smooth(frame, CONTINUATION_FRAME, CONTINUATION_FRAME + 10), transform: `translateY(${8 * (1 - transition)}px)` }}>
          Nhưng nếu lò xo giãn quá lâu, không co lại được nữa - <Keyword tone="negative">nợ xấu</Keyword> sẽ xuất hiện.
        </div>
      )}
    </CardScene>
  );
};
