import { Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { PaperGridScene } from "../PaperGridScene";
import { SignatureMotif } from "../SignatureMotif";
import { UndrawReveal } from "../UndrawReveal";
import { Card0CreditCardWoman } from "../illustrations/Card0CreditCardWoman";
import { SfxCue } from "../SfxCue";
import { DISPLAY_FONT_FAMILY } from "../theme";

const LEAD_FRAMES = 10;
const MOTIF_START = LEAD_FRAMES + 5;
const LA_GI_FRAME = MOTIF_START + 8;

// v6 title beat — "Vậy, tín dụng là gì?"
// - Title ("TÍN DỤNG" motif + "LÀ GÌ?") is grouped and horizontally centered
//   as one unit (user correction — it was left-anchored before).
// - Illustration below rises up from underneath (translateY) and fades in
//   starting at the SAME frame as the title (MOTIF_START), per user request,
//   instead of appearing only after the title finished.
export const Card0bTitle: React.FC = () => {
  const frame = useCurrentFrame();

  const riseY = interpolate(frame, [MOTIF_START, MOTIF_START + 24], [110, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const riseOpacity = interpolate(frame, [MOTIF_START, MOTIF_START + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <PaperGridScene>
      <Sequence from={LEAD_FRAMES}>
        <Audio src={staticFile("audio/card_0b.mp3")} />
      </Sequence>
      <SfxCue frame={MOTIF_START + 18} kind="whoosh" volume={0.6} />

      {/* Title group — "TÍN DỤNG" (green motif) + "LÀ GÌ?", one continuous
          line, centered horizontally as a single unit. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 700,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 6,
        }}
      >
        <SignatureMotif word="TÍN DỤNG" startFrame={MOTIF_START} fontSize={128} padV={28} padH={26} />
        <div
          style={{
            fontFamily: DISPLAY_FONT_FAMILY,
            fontSize: 128,
            lineHeight: 1,
            color: "#111111",
            textTransform: "uppercase",
            opacity: frame >= LA_GI_FRAME ? 1 : 0,
          }}
        >
          LÀ GÌ?
        </div>
      </div>

      {/* Illustration — centered, rises from below in sync with the title. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1120,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ transform: `translateY(${riseY}px)`, opacity: riseOpacity }}>
          <UndrawReveal startFrame={MOTIF_START}>
            <Card0CreditCardWoman width={739} height={468} />
          </UndrawReveal>
        </div>
      </div>
    </PaperGridScene>
  );
};
