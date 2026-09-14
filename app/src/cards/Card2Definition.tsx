import { Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fragment } from "react";
import { CardScene } from "../CardScene";
import { PersonAvatar } from "../illustrations/PersonAvatar";
import { UndrawReveal } from "../UndrawReveal";
import { Icon } from "../Icon";
import { SfxCue } from "../SfxCue";
import { useIdlePulse } from "../useIdlePulse";
import { COLORS, FONT_FAMILY } from "../theme";
import { findWord } from "../narrationTimestamps";

// v6 Card 2 (Định nghĩa) — REBUILT for clarity: instead of 5 disconnected
// chips, the concept is one connected two-way exchange between "Bên cho vay"
// and "Bạn":
//   ① Bên cho vay đưa tiền/hàng cho Bạn NGAY (top arrow, money travels over)
//   ② Bạn TRẢ LẠI SAU, kèm LÃI (bottom arrow, coin+% travels back)
// That single loop = the definition of tín dụng, easy to picture & remember.
const LEAD_FRAMES = 10;

const PROVIDER_FRAME = findWord("card_2", "bên")?.startFrame ?? 88;
const F_NGAN = findWord("card_2", "ngân")?.startFrame ?? 103;
const F_TO = findWord("card_2", "tổ")?.startFrame ?? 119;
const F_NGUOI = findWord("card_2", "người")?.startFrame ?? 161;
const F_SETTLE = findWord("card_2", "bán,")?.startFrame ?? 175;
const GIVE_FRAME = findWord("card_2", "dùng")?.startFrame ?? 196;
const PING_FRAME = findWord("card_2", "ngay")?.startFrame ?? 233;
const REPAY_FRAME = findWord("card_2", "trả")?.startFrame ?? 275;
const LAI_FRAME = findWord("card_2", "lãi.")?.startFrame ?? 317;

const PROVIDER = { x: 300, y: 660 };
const PERSON = { x: 780, y: 660 };

// quadratic bezier point
const qbez = (p0: number[], c: number[], p1: number[], t: number) => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t ** 2 * p1[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t ** 2 * p1[1],
];

const GIVE_P0 = [PROVIDER.x + 40, PROVIDER.y - 40];
const GIVE_C = [540, 430];
const GIVE_P1 = [PERSON.x - 40, PERSON.y - 40];
const REPAY_P0 = [PERSON.x - 40, PERSON.y + 40];
const REPAY_C = [540, 900];
const REPAY_P1 = [PROVIDER.x + 40, PROVIDER.y + 40];

const PercentCoin: React.FC<{ size?: number }> = ({ size = 60 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <circle cx={50} cy={50} r={46} fill={COLORS.positive} stroke={COLORS.brandPressed} strokeWidth={4} />
    <text x={50} y={68} textAnchor="middle" fontSize={54} fontWeight={800} fill={COLORS.brandPressed} fontFamily={FONT_FAMILY}>
      %
    </text>
  </svg>
);

const Node: React.FC<{ appearFrame: number; cx: number; cy: number; children: React.ReactNode; label: string }> = ({
  appearFrame,
  cx,
  cy,
  children,
  label,
}) => {
  const frame = useCurrentFrame();
  const idle = useIdlePulse(appearFrame + 20, { amplitude: 0.015, periodFrames: 78 });
  return (
    <div
      style={{
        position: "absolute",
        left: cx - 100,
        top: cy - 110,
        width: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        transform: frame >= appearFrame + 20 ? idle.transform : undefined,
      }}
    >
      {children}
      <div style={{ fontFamily: FONT_FAMILY, fontSize: 32, fontWeight: 800, color: COLORS.neutralTextTemp }}>{label}</div>
    </div>
  );
};

export const Card2Definition: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Scene = embedded ? Fragment : CardScene;
  const sharedLabelOpacity = interpolate(frame, [28, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const providerLabel =
    frame >= F_SETTLE
      ? "Bên cho vay"
      : frame >= F_NGUOI
        ? "Người bán"
        : frame >= F_TO
          ? "Tổ chức tài chính"
          : frame >= F_NGAN
            ? "Ngân hàng"
            : "Một bên...";
  const providerPop = spring({ frame: frame - PROVIDER_FRAME, fps, config: { damping: 13 } });

  const giveDraw = interpolate(frame, [GIVE_FRAME, GIVE_FRAME + 16], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const giveT = interpolate(frame, [GIVE_FRAME + 6, GIVE_FRAME + 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const [gx, gy] = qbez(GIVE_P0, GIVE_C, GIVE_P1, giveT);
  const pingR = interpolate(frame, [PING_FRAME, PING_FRAME + 20], [0, 80], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pingO = interpolate(frame, [PING_FRAME, PING_FRAME + 20], [0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const repayDraw = interpolate(frame, [REPAY_FRAME, REPAY_FRAME + 16], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const repayT = interpolate(frame, [REPAY_FRAME + 6, REPAY_FRAME + 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const [rx, ry] = qbez(REPAY_P0, REPAY_C, REPAY_P1, repayT);

  const giveLabelO = interpolate(frame, [GIVE_FRAME, GIVE_FRAME + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const repayLabelO = interpolate(frame, [REPAY_FRAME, REPAY_FRAME + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Scene>
      <Sequence from={LEAD_FRAMES}>
        <Audio src={staticFile("audio/card_2.mp3")} />
      </Sequence>
      {!embedded && <SfxCue frame={LEAD_FRAMES - 5} kind="whoosh" volume={0.6} />}

      {/* exchange arrows */}
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <marker id="ah-give" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill={COLORS.brandSolid} />
          </marker>
          <marker id="ah-repay" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill={COLORS.neutralMutedTemp} />
          </marker>
        </defs>
        {frame >= GIVE_FRAME && (
          <path
            d={`M ${GIVE_P0[0]} ${GIVE_P0[1]} Q ${GIVE_C[0]} ${GIVE_C[1]} ${GIVE_P1[0]} ${GIVE_P1[1]}`}
            fill="none"
            stroke={COLORS.brandSolid}
            strokeWidth={5}
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={giveDraw}
            markerEnd="url(#ah-give)"
          />
        )}
        {frame >= REPAY_FRAME && (
          <path
            d={`M ${REPAY_P0[0]} ${REPAY_P0[1]} Q ${REPAY_C[0]} ${REPAY_C[1]} ${REPAY_P1[0]} ${REPAY_P1[1]}`}
            fill="none"
            stroke={COLORS.neutralMutedTemp}
            strokeWidth={5}
            strokeDasharray="10 10"
            pathLength={100}
            strokeDashoffset={repayDraw}
            markerEnd="url(#ah-repay)"
          />
        )}
        {frame >= PING_FRAME && frame < PING_FRAME + 22 && (
          <circle cx={PERSON.x} cy={PERSON.y} r={pingR} fill="none" stroke={COLORS.positive} strokeWidth={6} opacity={pingO} />
        )}
      </svg>

      {/* traveling money bag (give) */}
      {frame >= GIVE_FRAME + 6 && giveT < 1 && (
        <div style={{ position: "absolute", left: gx - 34, top: gy - 34 }}>
          <Icon name="moneyBag" size={68} color={COLORS.brandSolid} />
        </div>
      )}
      {frame >= GIVE_FRAME && <SfxCue frame={GIVE_FRAME} kind="pop" volume={0.5} />}
      {frame >= PING_FRAME && <SfxCue frame={PING_FRAME} kind="pop" volume={0.6} />}

      {/* traveling coin+% (repay) */}
      {frame >= REPAY_FRAME + 6 && repayT < 1 && (
        <div style={{ position: "absolute", left: rx - 30, top: ry - 30 }}>
          <PercentCoin size={60} />
        </div>
      )}
      {frame >= REPAY_FRAME && <SfxCue frame={REPAY_FRAME} kind="pop" volume={0.5} />}

      {/* top label ① Dùng ngay */}
      {frame >= GIVE_FRAME && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 372,
            textAlign: "center",
            opacity: giveLabelO,
            fontFamily: FONT_FAMILY,
            fontSize: 34,
            fontWeight: 800,
            color: COLORS.brandSolid,
          }}
        >
          ① Đưa tiền / hàng - <span style={{ color: COLORS.neutralTextTemp }}>dùng ngay</span>
        </div>
      )}

      {/* bottom label ② Trả sau + lãi */}
      {frame >= REPAY_FRAME && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 950,
            textAlign: "center",
            opacity: repayLabelO,
            fontFamily: FONT_FAMILY,
            fontSize: 34,
            fontWeight: 800,
            color: COLORS.neutralTextTemp,
          }}
        >
          ② Trả lại sau - <span style={{ color: COLORS.positive }}>kèm lãi</span>
        </div>
      )}

      {/* provider node */}
      {!embedded && frame >= PROVIDER_FRAME && (
        <Node appearFrame={PROVIDER_FRAME} cx={PROVIDER.x} cy={PROVIDER.y} label={providerLabel}>
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: COLORS.canvas,
              border: `3px solid ${COLORS.brandSolid}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: frame < PROVIDER_FRAME + 20 ? `scale(${providerPop})` : undefined,
            }}
          >
            <Icon name="building" size={92} color={COLORS.brandSolid} />
          </div>
        </Node>
      )}

      {/* Bạn node */}
      {!embedded && <Node appearFrame={LEAD_FRAMES} cx={PERSON.x} cy={PERSON.y} label="Bạn">
        <UndrawReveal startFrame={LEAD_FRAMES}>
          <PersonAvatar width={190} height={190} />
        </UndrawReveal>
      </Node>}
      {embedded && (
        <>
          <div style={{ position: "absolute", left: PROVIDER.x - 130, width: 260, top: 730, textAlign: "center",
            opacity: sharedLabelOpacity, fontFamily: FONT_FAMILY, fontSize: 32, fontWeight: 800, color: COLORS.neutralTextTemp }}>
            {frame < PROVIDER_FRAME ? "Ngân hàng" : providerLabel}
          </div>
          <div style={{ position: "absolute", left: PERSON.x - 100, width: 200, top: 750, textAlign: "center",
            opacity: sharedLabelOpacity, fontFamily: FONT_FAMILY, fontSize: 32, fontWeight: 800, color: COLORS.neutralTextTemp }}>Bạn</div>
        </>
      )}

      {/* summary caption */}
      {frame >= LAI_FRAME && (
        <div
          style={{
            position: "absolute",
            left: 130,
            right: 130,
            top: 1180,
            textAlign: "center",
            fontFamily: FONT_FAMILY,
            fontSize: 34,
            fontWeight: 600,
            lineHeight: 1.4,
            color: COLORS.neutralTextTemp,
          }}
        >
          Dùng trước, trả sau, kèm lãi - đó là <span style={{ color: COLORS.brandSolid, fontWeight: 800 }}>tín dụng</span>.
        </div>
      )}
    </Scene>
  );
};
