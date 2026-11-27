import { AbsoluteFill } from "remotion";
import { Cena3D } from "../../Cena3D";
import { criarMotor } from "./motor.js";
import dados from "./dados.json";

export const TesteCabelo: React.FC = () => <AbsoluteFill style={{ background: "#06060c" }}><Cena3D criar={criarMotor} dados={dados} /></AbsoluteFill>;
export const TesteCabeloPrev: React.FC = () => <AbsoluteFill style={{ background: "#06060c" }}><Cena3D criar={criarMotor} dados={dados} passo={0.5} /></AbsoluteFill>;
