import { Audio, Sequence, staticFile } from "remotion";

// Ties a real cataloged SFX (metadata/sfx.json — sfx_bubble_pop_293342 /
// sfx_fast_swish_82e3aed2b3, copied into app/public/sfx/) to a specific reveal
// frame, instead of leaving reveals silent. `sfx_punctuation` (pop) for
// icon/keyword reveals, `sfx_transition` (whoosh) for scene/chapter changes.
export const SfxCue: React.FC<{ frame: number; kind: "pop" | "whoosh"; volume?: number }> = ({
  frame,
  kind,
  volume = 0.8,
}) => (
  <Sequence from={Math.max(0, frame)} layout="none">
    <Audio src={staticFile(kind === "pop" ? "sfx/pop.mp3" : "sfx/whoosh.wav")} volume={volume} />
  </Sequence>
);
