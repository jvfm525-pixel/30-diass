import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// composição de teste: título que entra com mola, subtítulo que aparece e fundo em degradê que gira devagar
export const Teste: React.FC<{ titulo: string; sub: string }> = ({ titulo, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const subOp = interpolate(frame, [40, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const giro = interpolate(frame, [0, 180], [0, 40]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${160 + giro}deg, #0b0f24, #3a1450 60%, #ff3b4e)`, justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${0.6 + entra * 0.4}) translateY(${(1 - entra) * 120}px)`, opacity: entra, fontFamily: "sans-serif", fontWeight: 900, fontSize: 150, color: "#fff", letterSpacing: 4, textShadow: "0 10px 40px rgba(0,0,0,.6)" }}>
        {titulo}
      </div>
      <div style={{ opacity: subOp, marginTop: 40, fontFamily: "monospace", fontSize: 48, color: "#ffc65a" }}>{sub}</div>
    </AbsoluteFill>
  );
};
