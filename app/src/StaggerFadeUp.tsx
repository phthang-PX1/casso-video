import { useRef } from "react";
import { useVideoConfig } from "remotion";
import { useGsapSeek } from "./useGsapSeek";

// The GSAP stagger primitive missing from the first render — fx_stagger_fade_in_list
// in metadata/effect.json, now actually exercised. Wraps N direct children and
// fades+slides them in one after another via a single frame-locked GSAP
// timeline (see useGsapSeek for why the timeline must be re-seeked, not left
// to run on GSAP's own real-time ticker).
export const StaggerFadeUp: React.FC<{
  startFrame: number;
  staggerSec?: number;
  itemDurationSec?: number;
  distance?: number;
  children: React.ReactNode;
}> = ({ startFrame, staggerSec = 0.12, itemDurationSec = 0.4, distance = 28, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { fps } = useVideoConfig();

  useGsapSeek(
    (tl) => {
      if (!containerRef.current) return;
      const items = Array.from(containerRef.current.children);
      if (items.length === 0) return;
      tl.fromTo(
        items,
        { opacity: 0, y: distance },
        { opacity: 1, y: 0, duration: itemDurationSec, stagger: staggerSec, ease: "power2.out" },
        startFrame / fps
      );
    },
    [startFrame, staggerSec, itemDurationSec, distance]
  );

  return (
    <div ref={containerRef} style={{ display: "contents" }}>
      {children}
    </div>
  );
};
