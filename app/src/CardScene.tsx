import { AbsoluteFill } from "remotion";
import { COLORS } from "./theme";
import { BackgroundMotion } from "./BackgroundMotion";

// Content-card background for Card 1-5: a white rounded card floating on the
// brand green gradient (the v5 look), with a subtle moving texture behind so
// the frame is never fully static. Unlike SceneCard, children are rendered in
// a full-frame overlay on top of the white card (not as flex children of it),
// so cards built with absolute 1080x1920 coordinates (Card1/Card2) keep their
// exact positions. Keep content within roughly x:116..964, y:230..1690 to
// stay inside the white card.
export const CardScene: React.FC<{ children: React.ReactNode; eyebrow?: string }> = ({ children, eyebrow }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(155deg, ${COLORS.brandPressed} 0%, ${COLORS.brandSolid} 60%, ${COLORS.brandHover} 100%)`,
    }}
  >
    <BackgroundMotion clip="calm" />

    {/* white card */}
    <AbsoluteFill style={{ padding: "150px 60px" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: COLORS.canvasAlt,
          borderRadius: 56,
          boxShadow: "0 40px 90px rgba(0,0,0,0.32)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {eyebrow && (
          <div
            style={{
              position: "absolute",
              top: 44,
              left: 56,
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 2,
              color: COLORS.brandSolid,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        )}
      </div>
    </AbsoluteFill>

    {/* content overlay in full-frame coordinates */}
    <AbsoluteFill>{children}</AbsoluteFill>
  </AbsoluteFill>
);
