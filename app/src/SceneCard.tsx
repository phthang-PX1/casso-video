import { AbsoluteFill } from "remotion";
import { COLORS } from "./theme";
import { BackgroundMotion } from "./BackgroundMotion";

// Fixes the "80% empty canvas" problem: every content scene (Card1-6) now
// renders inside a fixed two-layer frame — brand gradient (outer) + white
// rounded card with shadow (inner) — instead of floating text/icons directly
// on flat canvas. Card0 (title) intentionally stays full-bleed gradient, no
// inner card, since it's a hero/title treatment, not a content card.
//
// `variant` breaks the "1 layout for all 7 cards" critique: "card" is the
// default center card, "full" skips the inner white card entirely (content
// renders full-bleed over the gradient+motion background) for scenes that
// should read as a different beat (e.g. split comparisons).
export const SceneCard: React.FC<{
  children: React.ReactNode;
  eyebrow?: string;
  variant?: "card" | "full";
}> = ({ children, eyebrow, variant = "card" }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(155deg, ${COLORS.brandPressed} 0%, ${COLORS.brandSolid} 60%, ${COLORS.brandHover} 100%)`,
    }}
  >
    <BackgroundMotion clip="calm" />
    {variant === "full" ? (
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          padding: "120px 60px",
        }}
      >
        {eyebrow && (
          <div
            style={{
              position: "absolute",
              top: 70,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 3,
              color: "rgba(255,255,255,0.85)",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        )}
        {children}
      </AbsoluteFill>
    ) : (
    <AbsoluteFill style={{ padding: "150px 60px" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: COLORS.canvasAlt,
          borderRadius: 56,
          boxShadow: "0 40px 90px rgba(0,0,0,0.32)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          padding: "80px 56px",
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
        {children}
      </div>
    </AbsoluteFill>
    )}
  </AbsoluteFill>
);
