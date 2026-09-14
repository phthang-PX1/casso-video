import { Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CardScene } from "../CardScene";
import { SignatureMotif } from "../SignatureMotif";
import { Icon } from "../Icon";
import { SfxCue } from "../SfxCue";
import { useIdlePulse } from "../useIdlePulse";
import { COLORS, FONT_FAMILY } from "../theme";
import { findWord, NARRATION } from "../narrationTimestamps";

// v6 Card 5 (Xu hướng) — real data, mono-green (no rainbow): a 2-bar chart
// grows bar-by-bar with count-up when each figure is spoken (17% in 2022 ->
// 49% in 2025), a card-tag for the >50% credit-card-transactions stat, then
// the chart fades back and the closing question + "?" motif bookend Card 0.
const LEAD_FRAMES = 10;
const timing = NARRATION.card_5;
const HEADING_FRAME = LEAD_FRAMES + 5;
const BAR1_FRAME = findWord("card_5", "17%")?.startFrame ?? 134;
const BAR2_FRAME = findWord("card_5", "49%")?.startFrame ?? 219;
const TAG_FRAME = findWord("card_5", "chiếm")?.startFrame ?? 273;
const QUESTION_FRAME = findWord("card_5", "Vậy,")?.startFrame ?? 441;

const BAR_MAX = 60; // headroom above 49%
const BAR_AREA_H = 420;
const BAR_BASE_Y = 1080;
const BAR_W = 150;

const Bar: React.FC<{ value: number; label: string; cx: number; startFrame: number }> = ({ value, label, cx, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = spring({ frame: frame - startFrame, fps, config: { damping: 14, mass: 0.6 } });
  const h = (value / BAR_MAX) * BAR_AREA_H * grow;
  const count = Math.round(interpolate(frame, [startFrame, startFrame + 24], [0, value], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const idle = useIdlePulse(startFrame + 30, { amplitude: 0.02, periodFrames: 64 });
  if (frame < startFrame) return null;
  return (
    <>
      <SfxCue frame={startFrame} kind="pop" volume={0.6} />
      {/* % number */}
      <div
        style={{
          position: "absolute",
          left: cx - 90,
          width: 180,
          top: BAR_BASE_Y - h - 78,
          textAlign: "center",
          fontFamily: FONT_FAMILY,
          fontSize: 56,
          fontWeight: 800,
          color: COLORS.brandSolid,
        }}
      >
        {count}%
      </div>
      {/* bar */}
      <div
        style={{
          position: "absolute",
          left: cx - BAR_W / 2,
          top: BAR_BASE_Y - h,
          width: BAR_W,
          height: h,
          borderRadius: "16px 16px 4px 4px",
          background: `linear-gradient(180deg, ${COLORS.brandSolid}, ${COLORS.brandPressed})`,
          transform: frame >= startFrame + 30 ? idle.transform : undefined,
          transformOrigin: "bottom center",
        }}
      />
      {/* year label */}
      <div
        style={{
          position: "absolute",
          left: cx - 90,
          width: 180,
          top: BAR_BASE_Y + 16,
          textAlign: "center",
          fontFamily: FONT_FAMILY,
          fontSize: 34,
          fontWeight: 700,
          color: COLORS.neutralMutedTemp,
        }}
      >
        {label}
      </div>
    </>
  );
};

export const Card5Stats: React.FC = () => {
  const frame = useCurrentFrame();

  const headingOpacity = interpolate(frame, [HEADING_FRAME, HEADING_FRAME + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // chart fully clears out when the closing question arrives
  const chartOpacity = interpolate(frame, [QUESTION_FRAME - 14, QUESTION_FRAME - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const closingWords = timing.words.filter((w) => w.startFrame >= QUESTION_FRAME);
  const tagOpacity = interpolate(frame, [TAG_FRAME, TAG_FRAME + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <CardScene>
      <Sequence from={LEAD_FRAMES}>
        <Audio src={staticFile("audio/card_5.mp3")} />
      </Sequence>
      <SfxCue frame={LEAD_FRAMES - 5} kind="whoosh" volume={0.6} />

      {/* chart layer (dims at the question) */}
      <div style={{ opacity: chartOpacity }}>
        {frame >= HEADING_FRAME && (
          <div
            style={{
              position: "absolute",
              left: 130,
              right: 130,
              top: 300,
              textAlign: "center",
              opacity: headingOpacity,
              fontFamily: FONT_FAMILY,
              fontSize: 36,
              fontWeight: 700,
              color: COLORS.neutralTextTemp,
            }}
          >
            % người Việt dùng <span style={{ color: COLORS.brandSolid, fontWeight: 800 }}>mua trước, trả sau</span>
          </div>
        )}

        {/* baseline */}
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <line x1={300} y1={BAR_BASE_Y} x2={780} y2={BAR_BASE_Y} stroke="#E5E7EB" strokeWidth={3} />
        </svg>

        <Bar value={17} label="2022" cx={410} startFrame={BAR1_FRAME} />
        <Bar value={49} label="2025" cx={670} startFrame={BAR2_FRAME} />

        {frame >= BAR1_FRAME && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 1150,
              textAlign: "center",
              fontFamily: FONT_FAMILY,
              fontSize: 22,
              color: COLORS.neutralMutedTemp,
            }}
          >
            Nguồn: TGM Research 2025 (BNPL)
          </div>
        )}

        {/* credit-card tag */}
        {frame >= TAG_FRAME && (
          <div
            style={{
              position: "absolute",
              left: 130,
              right: 130,
              top: 1230,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              opacity: tagOpacity,
              background: COLORS.canvas,
              border: "2px solid #E5E7EB",
              borderRadius: 22,
              padding: "18px 26px",
            }}
          >
            <SfxCue frame={TAG_FRAME} kind="pop" volume={0.5} />
            <Icon name="creditCard" size={44} color={COLORS.brandSolid} />
            <span style={{ fontFamily: FONT_FAMILY, fontSize: 28, fontWeight: 700, color: COLORS.neutralTextTemp, textAlign: "center" }}>
              Thẻ tín dụng: <span style={{ color: COLORS.brandSolid, fontWeight: 800 }}>hơn 50%</span> giá trị giao dịch thẻ cả nước
            </span>
          </div>
        )}
      </div>

      {/* closing question — chart is gone; big centred text with the
          signature motif wrapping "tín dụng" (echoes Card 0's title). */}
      {frame >= QUESTION_FRAME && (
        <div
          style={{
            position: "absolute",
            left: 110,
            right: 110,
            top: 720,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "18px 16px",
            fontFamily: FONT_FAMILY,
            fontSize: 62,
            fontWeight: 800,
            lineHeight: 1.3,
            color: COLORS.neutralTextTemp,
            textAlign: "center",
          }}
        >
          {closingWords.map((w, i) => {
            const clean = w.text.toLowerCase();
            // "tín" + "dụng" -> one signature motif box, skip the "dụng" word
            if (clean === "tín" && closingWords[i + 1]?.text.toLowerCase().startsWith("dụng")) {
              return (
                <span key={i} style={{ opacity: frame >= w.startFrame ? 1 : 0, display: "inline-flex" }}>
                  <SignatureMotif word="TÍN DỤNG" startFrame={w.startFrame} fontSize={54} padV={10} padH={20} />
                </span>
              );
            }
            if (clean.startsWith("dụng") && closingWords[i - 1]?.text.toLowerCase() === "tín") {
              return null; // consumed by the motif above
            }
            return (
              <span key={i} style={{ opacity: frame >= w.startFrame ? 1 : 0 }}>
                {w.text}
              </span>
            );
          })}
        </div>
      )}
    </CardScene>
  );
};
