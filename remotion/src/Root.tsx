import { Composition } from "remotion";
import { Teste } from "./Teste";
import { Teste3D } from "./Teste3D";
import { Kira3D } from "./videos/kira/Kira3D";
import kiraDados from "./videos/kira/dados.json";
import { Sukuna3D } from "./videos/sukuna/Sukuna3D";
import sukunaDados from "./videos/sukuna/dados.json";
import { Light3D } from "./videos/light/Light3D";
import lightDados from "./videos/light/dados.json";
import { Ging3D } from "./videos/ging/Ging3D";
import gingDados from "./videos/ging/dados.json";
import { Grisha3D } from "./videos/grisha/Grisha3D";
import grishaDados from "./videos/grisha/dados.json";
import { Gojo3D, Gojo3DPrev } from "./videos/gojo/Gojo3D";
import gojoDados from "./videos/gojo/dados.json";

// Vídeos verticais do TikTok: 1080 x 1920, 60 quadros por segundo
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Teste" component={Teste} durationInFrames={180} fps={60} width={1080} height={1920} defaultProps={{ titulo: "REMOTION", sub: "instalado e funcionando" }} />
    <Composition id="Kira3D" component={Kira3D} durationInFrames={Math.round(kiraDados.total * 60)} fps={60} width={1080} height={1920} />
    <Composition id="Sukuna3D" component={Sukuna3D} durationInFrames={Math.round(sukunaDados.total * 30)} fps={30} width={1080} height={1920} />
    <Composition id="Light3D" component={Light3D} durationInFrames={Math.round(lightDados.total * 30)} fps={30} width={1080} height={1920} />
    <Composition id="Ging3D" component={Ging3D} durationInFrames={Math.round(gingDados.total * 30)} fps={30} width={1080} height={1920} />
    <Composition id="Grisha3D" component={Grisha3D} durationInFrames={Math.round(grishaDados.total * 30)} fps={30} width={1080} height={1920} />
    <Composition id="Gojo3D" component={Gojo3D} durationInFrames={Math.round(gojoDados.total * 30)} fps={30} width={1080} height={1920} />
    <Composition id="Gojo3DPrev" component={Gojo3DPrev} durationInFrames={Math.ceil(gojoDados.total / 0.5)} fps={30} width={1080} height={1920} />
    <Composition id="Teste3D" component={Teste3D} durationInFrames={180} fps={60} width={1080} height={1920} />
  </>
);
