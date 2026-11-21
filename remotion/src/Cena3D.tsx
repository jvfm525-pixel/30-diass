import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";

type Motor = { renderAt: (t: number) => void; ready: Promise<void>; dispose: () => void };
// hospeda o motor 3D (Three.js) e desenha o quadro atual do Remotion
// passo: prévia (quadro i mostra o tempo i × passo segundos), para revisar o vídeo inteiro em poucos quadros
export const Cena3D: React.FC<{ criar: (c: HTMLCanvasElement, T: unknown) => Motor; dados: unknown; passo?: number }> = ({ criar, dados, passo }) => {
  const ref = useRef<HTMLCanvasElement>(null), motor = useRef<Motor | null>(null);
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const fr = useRef(frame); fr.current = frame;
  const [handle] = useState(() => delayRender("motor 3D"));
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    const m = criar(ref.current!, dados); motor.current = m;
    m.ready.then(() => { m.renderAt(passo ? fr.current * passo : fr.current / fps); setPronto(true); continueRender(handle); });
    return () => m.dispose();
  }, []);
  useLayoutEffect(() => { if (pronto) motor.current?.renderAt(passo ? frame * passo : frame / fps); }, [frame, pronto]);
  return <canvas ref={ref} width={1080} height={1920} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
};
