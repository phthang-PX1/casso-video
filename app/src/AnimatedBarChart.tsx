import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { useGsapTimeline } from "@remotion/gsap";
import { COLORS, FONT_FAMILY } from "./theme";

// Replaces the static @antv/infographic "chart-column-simple" render for
// Card5: that widget draws every bar in one shot with no way to stagger
// individual bars (it renders its own internal SVG, not selectable DOM
// nodes), so the whole chart just "hiện nguyên cục" as one frozen image.
// This hand-rolled chart is real DOM we control per-bar, so each bar can
// grow on its own GSAP-timeline beat (staggered, frame-seeked — same
// technique @remotion/gsap gives us for any layered illustration) with a
// synced count-up number on top of it.
export const AnimatedBarChart: React.FC<{
  items: { label: string; value: number }[];
  width: number;
  height: number;
  startFrame: number;
  color?: string;
  staggerSec?: number;
}> = ({ items, width, height, startFrame, color = COLORS.brandSolid, staggerSec = 0.16 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const maxValue = Math.max(...items.map((i) => i.value));
  const barAreaHeight = height - 70;
  const barWidth = Math.min(110, (width / items.length) * 0.55);
  const gap = (width - barWidth * items.length) / (items.length + 1);

  const scope = useGsapTimeline<HTMLDivElement>(
    ({ timeline, selector }) => {
      timeline.from(
        selector("[data-bar]"),
        {
          scaleY: 0,
          transformOrigin: "bottom center",
          duration: 0.55,
          stagger: staggerSec,
          ease: "back.out(1.5)",
        },
        startFrame / fps
      );
    },
    { dependencies: [startFrame] }
  );

  return (
    <div
      ref={scope}
      style={{ position: "relative", width, height, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 2,
          background: COLORS.neutralMutedTemp,
          opacity: 0.4,
        }}
      />
      <div style={{ display: "flex", alignItems: "flex-end", gap, height: "100%" }}>
        {items.map((item, i) => {
          const barStart = startFrame + i * staggerSec * fps;
          const barSettle = barStart + 0.55 * fps;
          const countProgress = interpolate(frame, [barStart, barSettle], [0, item.value], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const barHeight = (item.value / maxValue) * barAreaHeight;
          return (
            <div
              key={item.label}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}
            >
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: COLORS.neutralTextTemp,
                  fontFamily: FONT_FAMILY,
                  marginBottom: 8,
                  opacity: frame >= barStart ? 1 : 0,
                }}
              >
                {Math.round(countProgress)}%
              </div>
              <div
                data-bar
                style={{
                  width: barWidth,
                  height: barHeight,
                  borderRadius: "12px 12px 4px 4px",
                  background: `linear-gradient(180deg, ${color}, ${COLORS.brandPressed})`,
                }}
              />
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: COLORS.neutralMutedTemp,
                  fontFamily: FONT_FAMILY,
                  marginTop: 10,
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
