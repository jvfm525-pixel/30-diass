import { ThreeCanvas } from "@remotion/three";
import { Environment, Lightformer, MeshDistortMaterial } from "@react-three/drei";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// teste de Three.js no Remotion: tudo é função do quadro (nada de relógio), então o render é determinístico
const Cena: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const s = spring({ frame, fps, config: { damping: 11 } });
  return (
    <>
      <color attach="background" args={["#0b0f24"]} />
      <fog attach="fog" args={["#0b0f24", 6, 16]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} castShadow />
      <pointLight position={[-3, -1, 2]} intensity={30} color="#ff3b4e" />
      <mesh rotation={[t * 0.6, t * 0.9, 0]} scale={0.4 + s * 0.8} position={[0, 0.6, 0]} castShadow>
        <torusKnotGeometry args={[1, 0.32, 220, 32]} />
        <MeshDistortMaterial color="#ffc65a" metalness={0.6} roughness={0.25} distort={0.25} speed={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1430" roughness={0.9} />
      </mesh>
      {/* reflexos sem baixar nada: o ambiente é montado com placas de luz (Lightformer), em vez de um "preset" que busca HDR na internet */}
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[0, 4, -6]} scale={[12, 4, 1]} color="#ff8a5a" />
        <Lightformer intensity={1.4} position={[-6, 1, 0]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#6a8aff" />
        <Lightformer intensity={0.8} position={[6, 2, 2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#ffffff" />
      </Environment>
    </>
  );
};

export const Teste3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const op = interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} shadows camera={{ position: [0, 0.8, 6.5], fov: 45 }}>
        <Cena />
      </ThreeCanvas>
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 220 }}>
        <div style={{ opacity: op, fontFamily: "sans-serif", fontWeight: 900, fontSize: 110, color: "#fff", textShadow: "0 8px 30px rgba(0,0,0,.7)" }}>THREE.JS</div>
        <div style={{ opacity: op, fontFamily: "monospace", fontSize: 44, color: "#ffc65a", marginTop: 20 }}>dentro do Remotion</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
