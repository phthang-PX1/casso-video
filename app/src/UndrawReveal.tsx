import { useGsapTimeline } from "@remotion/gsap";
import { useVideoConfig } from "remotion";

// Wraps a layered illustration (from process_undraw.cjs — every shape tagged
// data-layer="bg" / "body" / "accent", in original paint order) in a real
// GSAP timeline: background fades/scales in first, the character/object body
// follows, and the brand-colored accent details settle last with a bouncy
// stagger. Shapes are tagged in place (not regrouped) so z-order is faithful.
export const UndrawReveal: React.FC<{ children: React.ReactNode; startFrame: number }> = ({
  children,
  startFrame,
}) => {
  const { fps } = useVideoConfig();
  const scope = useGsapTimeline<HTMLDivElement>(
    ({ timeline, selector }) => {
      const t0 = startFrame / fps;
      timeline
        .from(selector('[data-layer="bg"]'), { opacity: 0, scale: 0.85, duration: 0.5, ease: "power2.out" }, t0)
        .from(selector('[data-layer="body"]'), { opacity: 0, y: 30, duration: 0.5, ease: "power2.out" }, "-=0.25")
        .from(
          selector('[data-layer="accent"]'),
          { opacity: 0, scale: 0.3, transformOrigin: "center", duration: 0.4, stagger: 0.06, ease: "back.out(1.9)" },
          "-=0.15"
        );
    },
    { dependencies: [startFrame] }
  );
  return <div ref={scope}>{children}</div>;
};
