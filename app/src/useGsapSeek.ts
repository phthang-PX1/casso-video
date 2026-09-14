import { useCurrentFrame, useVideoConfig } from "remotion";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

// Frame-locked GSAP: builds a paused timeline once, then seeks it to frame/fps
// on every render instead of letting GSAP's real-time ticker drive it. This is
// the fix for the gotcha documented in .claude/skills/video-stack/SKILL.md
// section 6 — GSAP's default rAF-based timing does not match Remotion's
// frame-by-frame (not wall-clock) render loop.
export function useGsapSeek(
  build: (tl: gsap.core.Timeline) => void,
  deps: React.DependencyList = []
) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    const tl = gsap.timeline({ paused: true });
    build(tl);
    timelineRef.current = tl;
    // A `still`/single-frame render (or any render that doesn't start at
    // frame 0) mounts the component with useCurrentFrame() already at an
    // arbitrary frame. gsap.fromTo() applies its "from" state the instant the
    // timeline is built, so without this seek the element would be stuck at
    // that "from" state (e.g. opacity 0) forever on every render but the one
    // where this effect happens to fire at frame 0.
    tl.seek(frame / fps, false);
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  timelineRef.current?.seek(frame / fps, false);
}
