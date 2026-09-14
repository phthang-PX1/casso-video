import { COLORS } from "./theme";

// Colored pill for a keyword inside a line of text — the "SUÔN"-style highlight
// from the reference video that the plain-black-text v1 render was missing.
export const Keyword: React.FC<{
  children: React.ReactNode;
  tone?: "brand" | "positive" | "negative";
}> = ({ children, tone = "brand" }) => {
  const bg =
    tone === "positive" ? COLORS.positive : tone === "negative" ? COLORS.negativeTemp : COLORS.brandSolid;
  const fg = tone === "positive" ? COLORS.neutralTextTemp : COLORS.canvasAlt;
  return (
    <span
      style={{
        background: bg,
        color: fg,
        padding: "2px 16px",
        borderRadius: 999,
        fontWeight: 800,
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
};
