import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";

// Casso Design System v1.0.0-beta — only the values confirmed in docs/01_brand_palette.md.
// negative/neutral are placeholders (real tokens/*.css not available yet) — replace when provided.
export const COLORS = {
  brandSolid: "#00A85E",
  brandHover: "#009A54",
  brandPressed: "#008241",
  positive: "#6ED507",
  canvas: "#F7F7F7",
  canvasAlt: "#FFFFFF",
  negativeTemp: "#DC2626", // TODO: replace with real Negative/Solid token when tokens/*.css is provided
  neutralTextTemp: "#1A1A1A", // TODO: replace with real Neutral/Content token
  neutralMutedTemp: "#6B7280",
} as const;

export const FONT_FAMILY =
  "Inter, -apple-system, 'Segoe UI', Roboto, sans-serif";

// v6 Card 0 design system — display font for the signature-motif headline
// (chữ hoa, nén, đậm per the Figma reference). @remotion/google-fonts'
// loadFont() manages deterministic async loading for Remotion (waits for the
// font before rendering each frame) — it does NOT bundle the font file
// locally: the browser still fetches it from fonts.gstatic.com at render
// time, so rendering (Studio preview and `remotion render`) requires network
// access to Google Fonts' CDN.
export const { fontFamily: DISPLAY_FONT_FAMILY } = loadAnton();
