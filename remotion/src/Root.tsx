import { Composition } from "remotion";
import { Teste } from "./Teste";

// Vídeos verticais do TikTok: 1080 x 1920, 60 quadros por segundo
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Teste" component={Teste} durationInFrames={180} fps={60} width={1080} height={1920} defaultProps={{ titulo: "REMOTION", sub: "instalado e funcionando" }} />
  </>
);
