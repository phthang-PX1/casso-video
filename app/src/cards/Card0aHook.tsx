import { Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { PaperGridScene } from "../PaperGridScene";
import { UndrawReveal } from "../UndrawReveal";
import { OnlineShoppingIllustration } from "../illustrations/OnlineShoppingIllustration";
import { Keyword } from "../Keyword";
import { SfxCue } from "../SfxCue";
import { useIdlePulse } from "../useIdlePulse";
import { COLORS, FONT_FAMILY } from "../theme";
import { NARRATION } from "../narrationTimestamps";

const LEAD_FRAMES = 10;
const timing = NARRATION.card_0a;

// v6 Card 0a (lead-in). "sàn Cam" instead of naming a platform (TikTok
// throttles branded mentions). Illustration now rises in + keeps a gentle
// idle motion (was static). Keyword pills: "mua trước, trả sau", "sàn Cam",
// "tín dụng".
export const Card0aHook: React.FC = () => {
  const frame = useCurrentFrame();
  const riseY = interpolate(frame, [LEAD_FRAMES, LEAD_FRAMES + 22], [90, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const riseOpacity = interpolate(frame, [LEAD_FRAMES, LEAD_FRAMES + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const idle = useIdlePulse(LEAD_FRAMES + 26, { amplitude: 0.014, periodFrames: 82 });
  const textIdle = useIdlePulse(timing.audioDurationFrames - 30, { amplitude: 0.01, periodFrames: 90 });

  return (
    <PaperGridScene>
      <Sequence from={LEAD_FRAMES}>
        <Audio src={staticFile("audio/card_0a.mp3")} />
      </Sequence>
      <SfxCue frame={LEAD_FRAMES - 5} kind="whoosh" volume={0.5} />

      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 70 }}>
        <div
          style={{
            transform: `translateY(${riseY}px) ${frame >= LEAD_FRAMES + 26 ? idle.transform : ""}`,
            opacity: riseOpacity,
          }}
        >
          <UndrawReveal startFrame={LEAD_FRAMES}>
            <OnlineShoppingIllustration width={620} height={465} />
          </UndrawReveal>
        </div>

        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 46,
            fontWeight: 700,
            color: COLORS.neutralTextTemp,
            textAlign: "center",
            padding: "0 40px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px 12px",
            justifyContent: "center",
            alignItems: "center",
            lineHeight: 1.3,
            transform: textIdle.transform,
          }}
        >
          {/* words 4-7 = "mua trước, trả sau"; 9-10 = "sàn Cam"; 19-20 = "tín dụng." */}
          {timing.words.map((w, i) => {
            if (i === 5 || i === 6 || i === 7 || i === 10 || i === 20) return null;
            if (i === 4)
              return (
                <span key={i} style={{ opacity: frame >= w.startFrame ? 1 : 0 }}>
                  <Keyword>mua trước, trả sau</Keyword>
                </span>
              );
            if (i === 9)
              return (
                <span key={i} style={{ opacity: frame >= w.startFrame ? 1 : 0 }}>
                  <Keyword tone="positive">sàn Cam</Keyword>
                </span>
              );
            if (i === 19)
              return (
                <span key={i} style={{ opacity: frame >= w.startFrame ? 1 : 0 }}>
                  <Keyword>tín dụng</Keyword>
                </span>
              );
            return (
              <span key={i} style={{ opacity: frame >= w.startFrame ? 1 : 0 }}>
                {w.text}
              </span>
            );
          })}
        </div>
      </div>
    </PaperGridScene>
  );
};
