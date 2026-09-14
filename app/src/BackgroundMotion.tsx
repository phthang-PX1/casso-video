import { Loop, OffthreadVideo, staticFile } from "remotion";

// Native clip length in composition frames (30fps) — both source clips are
// ~20s (see metadata/background.json videoplayback-4/5 duration_sec), used
// to loop them seamlessly via Remotion's <Loop> instead of a bare `loop`
// prop (OffthreadVideo has no such prop in this Remotion version).
const CLIP_DURATION_FRAMES = 600;

// Fixes root cause #3 from the user's frame-diff audit: the gradient behind
// every SceneCard was a flat, motionless color for the entire 82.8s, even
// though real background motion assets exist in metadata/background.json
// (bg_videoplayback_4/5 etc.) and were never wired into the render. This
// plays one of those cataloged clips, muted, looped, blended under the
// brand gradient at low opacity — real continuous pixel motion behind every
// scene, not just another flat layer.
export const BackgroundMotion: React.FC<{ clip?: "calm" | "energetic"; opacity?: number }> = ({
  clip = "calm",
  opacity = 0.16,
}) => (
  <Loop durationInFrames={CLIP_DURATION_FRAMES}>
    <OffthreadVideo
      src={staticFile(clip === "calm" ? "backgrounds/grid-white-calm.mp4" : "backgrounds/grid-green-energetic.mp4")}
      muted
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity,
        mixBlendMode: "overlay",
      }}
    />
  </Loop>
);
