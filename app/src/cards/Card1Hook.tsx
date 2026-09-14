import { Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Card2Definition } from "./Card2Definition";
import { CardScene } from "../CardScene";
import { PersonAvatar } from "../illustrations/PersonAvatar";
import { HouseIllustration } from "../illustrations/HouseIllustration";
import { CreditCardObject } from "../illustrations/CreditCardObject";
import { UndrawReveal } from "../UndrawReveal";
import { SfxCue } from "../SfxCue";
import { useIdlePulse } from "../useIdlePulse";
import { COLORS, FONT_FAMILY } from "../theme";
import { findWord, NARRATION } from "../narrationTimestamps";

// v6 Card 1 (Hook) — white-card design. Synced to whisper word timestamps:
//  1. "Bạn" (avatar) rises in, center.
//  2. 3 arrows draw out to house / card / phone as each is named
//     (nhà / thẻ / góp), each target rising in at the arrow's tip.
//  3. "...dùng tiền của người khác, để trả sau" — targets recede, a bank
//     appears and coins flow up the curve into the person. This closes the
//     card and leads straight into Card 2's definition (no repeated "?").
const LEAD_FRAMES = 10;

const AVATAR_FRAME = LEAD_FRAMES;
const NHA_FRAME = findWord("card_1", "nhà")?.startFrame ?? LEAD_FRAMES + 30;
const THE_FRAME = findWord("card_1", "thẻ")?.startFrame ?? LEAD_FRAMES + 60;
const GOP_FRAME = findWord("card_1", "góp")?.startFrame ?? LEAD_FRAMES + 90;
const BANK_FRAME = findWord("card_1", "chung")?.startFrame ?? LEAD_FRAMES + 150;
// Derived from real narration timing (not hand-tuned literals) so this stays
// correct automatically if card_1's wording/audio ever changes length:
// - speechEndFrame: frame the last recognized word of card_1 ends.
// - DEFINITION_OFFSET: start Card 2's embedded scene a touch before that, so
//   the move-transition (mid-word) reads as a continuation, not a hard cut.
// - MOVE_START/MOVE_END: the glide window straddling that handoff point.
const CARD1_SPEECH_END = NARRATION.card_1.speechEndFrame;
const DEFINITION_OFFSET = CARD1_SPEECH_END - 4;
const MOVE_START = DEFINITION_OFFSET - 4;
const MOVE_END = MOVE_START + 46;
export const CARD1_DURATION = DEFINITION_OFFSET + 350;

// Layout coordinates in the 1080x1920 canvas.
const AVATAR = { cx: 540, cy: 560, size: 300 };
const AVATAR_HAND = { x: 540, y: 720 };
const TARGETS = [
  { key: "house", cx: 260, cy: 1080, frame: NHA_FRAME, label: "Vay mua nhà" },
  { key: "card", cx: 540, cy: 1080, frame: THE_FRAME, label: "Quẹt thẻ" },
  { key: "phone", cx: 820, cy: 1080, frame: GOP_FRAME, label: "Trả góp" },
];
const CARD_W = 240;
const CARD_TOP = 960;

// --- inline flat objects (brand palette) so the target set stays consistent
// and person-free (unDraw phone/bank scenes all include stray characters) ---
const PhoneObject: React.FC = () => (
  <svg viewBox="0 0 120 190" width={140} height={222} style={{ overflow: "visible" }}>
    <rect x={10} y={4} width={100} height={182} rx={18} fill={COLORS.neutralTextTemp} />
    <rect x={20} y={22} width={80} height={132} rx={6} fill={COLORS.canvasAlt} />
    <circle cx={60} cy={170} r={7} fill={COLORS.canvasAlt} />
    <rect x={34} y={40} width={52} height={30} rx={5} fill={COLORS.brandSolid} />
    <rect x={34} y={82} width={52} height={10} rx={5} fill="#D9F2E4" />
    <rect x={34} y={100} width={38} height={10} rx={5} fill="#D9F2E4" />
    <rect x={34} y={124} width={52} height={16} rx={8} fill={COLORS.positive} />
  </svg>
);

const BankObject: React.FC = () => (
  <svg viewBox="0 0 220 170" width={300} height={232} style={{ overflow: "visible" }}>
    <polygon points="110,8 210,60 10,60" fill={COLORS.brandSolid} />
    <rect x={18} y={60} width={184} height={14} fill={COLORS.neutralTextTemp} />
    {[36, 78, 120, 162].map((x) => (
      <rect key={x} x={x} y={78} width={22} height={70} fill={COLORS.brandSolid} />
    ))}
    <rect x={10} y={150} width={200} height={16} rx={3} fill={COLORS.neutralTextTemp} />
    <circle cx={110} cy={38} r={13} fill={COLORS.canvasAlt} />
    <text x={110} y={45} textAnchor="middle" fontSize={20} fontWeight={800} fill={COLORS.brandSolid} fontFamily={FONT_FAMILY}>
      ₫
    </text>
  </svg>
);

// A curved arrow drawn on with stroke-dashoffset (drawSVG-style, pathLength
// normalized) from the avatar's hand to a target.
const DrawnArrow: React.FC<{ to: { cx: number; cy: number }; startFrame: number }> = ({ to, startFrame }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [startFrame, startFrame + 12], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headOpacity = interpolate(frame, [startFrame + 10, startFrame + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cxCtrl = (AVATAR_HAND.x + to.cx) / 2;
  const cyCtrl = (AVATAR_HAND.y + to.cy) / 2 - 40;
  const d = `M ${AVATAR_HAND.x} ${AVATAR_HAND.y} Q ${cxCtrl} ${cyCtrl} ${to.cx} ${to.cy - 120}`;
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={COLORS.neutralMutedTemp}
        strokeWidth={4}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={draw}
      />
      <circle cx={to.cx} cy={to.cy - 120} r={6} fill={COLORS.brandSolid} opacity={headOpacity} />
    </g>
  );
};

const TargetCard: React.FC<{ target: (typeof TARGETS)[number] }> = ({ target }) => {
  const frame = useCurrentFrame();
  const appear = target.frame + 10;
  const rise = interpolate(frame, [appear, appear + 16], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [appear, appear + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // fade the whole target out when the bank beat begins
  const fadeOut = interpolate(frame, [BANK_FRAME, BANK_FRAME + 18], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const idle = useIdlePulse(appear + 18, { amplitude: 0.02, periodFrames: 62 });
  if (frame < appear) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: target.cx - CARD_W / 2,
        top: CARD_TOP,
        width: CARD_W,
        opacity: opacity * fadeOut,
        transform: `translateY(${rise}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <SfxCue frame={appear} kind="pop" volume={0.6} />
      <div
        style={{
          width: CARD_W,
          height: 240,
          background: COLORS.canvas,
          borderRadius: 28,
          border: `2px solid #E5E7EB`,
          boxShadow: "0 14px 34px rgba(0,0,0,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: frame >= appear + 18 ? idle.transform : undefined,
        }}
      >
        {target.key === "house" && <HouseIllustration width={190} height={110} />}
        {target.key === "card" && <CreditCardObject width={180} height={150} />}
        {target.key === "phone" && <PhoneObject />}
      </div>
      <div style={{ fontFamily: FONT_FAMILY, fontSize: 32, fontWeight: 800, color: COLORS.neutralTextTemp }}>
        {target.label}
      </div>
    </div>
  );
};

// Coins flowing up a curved path from the bank into the person.
const CoinFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame - BANK_FRAME;
  const P0 = { x: 540, y: 1120 };
  const C = { x: 720, y: 900 };
  const P1 = AVATAR_HAND;
  const at = (u: number) => ({
    x: (1 - u) ** 2 * P0.x + 2 * (1 - u) * u * C.x + u ** 2 * P1.x,
    y: (1 - u) ** 2 * P0.y + 2 * (1 - u) * u * C.y + u ** 2 * P1.y,
  });
  const N = 4;
  const period = 40;
  const coins = [];
  for (let i = 0; i < N; i++) {
    const u = ((t / period + i / N) % 1 + 1) % 1;
    if (t < 0) break;
    const p = at(u);
    const fade = Math.sin(u * Math.PI); // fade in/out at ends
    coins.push(
      <g key={i} transform={`translate(${p.x} ${p.y})`} opacity={fade}>
        <circle r={16} fill={COLORS.positive} stroke={COLORS.brandPressed} strokeWidth={2} />
        <text textAnchor="middle" y={6} fontSize={18} fontWeight={800} fill={COLORS.brandPressed} fontFamily={FONT_FAMILY}>
          ₫
        </text>
      </g>
    );
  }
  return <>{coins}</>;
};

export const Card1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const move = interpolate(frame, [MOVE_START, MOVE_END], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
  });
  const outgoing = interpolate(frame, [MOVE_START, MOVE_START + 20], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
  });
  const avatarRise = interpolate(frame, [AVATAR_FRAME, AVATAR_FRAME + 20], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const avatarOpacity = interpolate(frame, [AVATAR_FRAME, AVATAR_FRAME + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const avatarIdle = useIdlePulse(AVATAR_FRAME + 24, { amplitude: 0.015, periodFrames: 80 });
  const bankRise = interpolate(frame, [BANK_FRAME, BANK_FRAME + 18], [50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bankOpacity = interpolate(frame, [BANK_FRAME, BANK_FRAME + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // when the bank beat starts, the 3 targets/arrows recede so the "money from
  // someone else" idea takes over — no more repeated "?" question (Card 2 now
  // carries the definition).
  const targetsFade = interpolate(frame, [BANK_FRAME, BANK_FRAME + 18], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CardScene>
      <Sequence from={LEAD_FRAMES} durationInFrames={NARRATION.card_1.mediaDurationFrames - LEAD_FRAMES}>
        <Audio src={staticFile("audio/card_1.mp3")} />
      </Sequence>
      <SfxCue frame={LEAD_FRAMES - 5} kind="whoosh" volume={0.6} />

      {/* Person "Bạn" */}
      <div
        style={{
          position: "absolute",
          left: AVATAR.cx - AVATAR.size / 2 + (685 - (AVATAR.cx - AVATAR.size / 2)) * move,
          top: AVATAR.cy - AVATAR.size / 2 + (550 - (AVATAR.cy - AVATAR.size / 2)) * move,
          width: AVATAR.size,
          height: AVATAR.size,
          opacity: avatarOpacity,
          transformOrigin: "top left",
          transform: `translateY(${avatarRise + avatarIdle.y * (1 - move)}px) scale(${(1 - move * (1 - 190 / AVATAR.size)) * (1 + (avatarIdle.scale - 1) * (1 - move))})`,
        }}
      >
        <UndrawReveal startFrame={AVATAR_FRAME}>
          <PersonAvatar width={AVATAR.size} height={AVATAR.size} />
        </UndrawReveal>
      </div>

      {/* Arrows overlay (full-frame coordinate space) */}
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {TARGETS.map((tg) => (
          <g key={tg.key} opacity={targetsFade}>
            {frame >= tg.frame && <DrawnArrow to={tg} startFrame={tg.frame} />}
          </g>
        ))}
        {frame >= BANK_FRAME && outgoing > 0 && <g opacity={outgoing}><CoinFlow /></g>}
      </svg>

      {/* 3 targets */}
      {TARGETS.map((tg) => (
        <TargetCard key={tg.key} target={tg} />
      ))}

      {/* Bank beat — the closing idea: "dùng tiền của người khác, trả sau" */}
      {frame >= BANK_FRAME && (
        <div
          style={{
            position: "absolute",
            left: 390 + (220 - 390) * move,
            top: 1080 + (568 - 1080) * move,
            width: 300,
            height: 232,
            opacity: bankOpacity,
            transformOrigin: "top left",
            transform: `translateY(${bankRise}px) scale(${1 - move * (1 - 160 / 300)})`,
          }}
        >
          <SfxCue frame={BANK_FRAME} kind="pop" volume={0.6} />
          <BankObject />
        </div>
      )}
      {frame >= BANK_FRAME && outgoing > 0 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 1330, textAlign: "center",
            opacity: bankOpacity * outgoing, transform: `translateY(${bankRise - 12 * (1 - outgoing)}px)`,
            fontFamily: FONT_FAMILY, fontSize: 36, fontWeight: 800, color: COLORS.neutralTextTemp }}>
            Dùng tiền của <span style={{ color: COLORS.brandSolid }}>người khác</span> - trả sau
          </div>
      )}
      <Sequence from={DEFINITION_OFFSET} layout="none">
        <Card2Definition embedded />
      </Sequence>
    </CardScene>
  );
};
