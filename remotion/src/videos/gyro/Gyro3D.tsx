import { AbsoluteFill } from "remotion";
import { Cena3D } from "../../Cena3D";
import { criarMotor } from "./motor.js";
import dados from "./dados.json";

export const Gyro3D: React.FC = () => <AbsoluteFill style={{ background: "#06060c" }}><Cena3D criar={criarMotor} dados={dados} /></AbsoluteFill>;
// prévia de revisão: um quadro a cada meio segundo do vídeo
export const Gyro3DPrev: React.FC = () => <AbsoluteFill style={{ background: "#06060c" }}><Cena3D criar={criarMotor} dados={dados} passo={0.5} /></AbsoluteFill>;
