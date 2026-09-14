import { AbsoluteFill } from "remotion";

// v6 Card 0 design system: a repeating grid line pattern, masked by a radial
// gradient so it's crisp in the center and fades to solid white at the edges
// (per the user's reference: "grid với gradient dạng radial, mờ dần thành
// trắng xung quanh").
//
// Line opacity/thickness were raised after v6c: at 0.09 alpha on 1px lines
// the grid was visible in still renders but H.264 compression crushed it out
// of the encoded MP4 entirely. 2px lines at ~0.16 alpha survive compression
// while still reading as a light-gray grid, and the radial mask now keeps
// the grid visible across most of the frame (fading only near the edges)
// instead of vanishing halfway out.
export const PaperGridScene: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: "#ffffff" }}>
    <AbsoluteFill
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(15,15,15,0.16) 2px, transparent 2px), linear-gradient(to bottom, rgba(15,15,15,0.16) 2px, transparent 2px)",
        backgroundSize: "96px 96px",
        maskImage:
          "radial-gradient(ellipse 85% 75% at 50% 45%, black 55%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 85% 75% at 50% 45%, black 55%, transparent 100%)",
      }}
    />
    <AbsoluteFill>{children}</AbsoluteFill>
  </AbsoluteFill>
);
