import { AbsoluteFill } from "remotion";
import { Cena3D } from "../../Cena3D";
import { criarMotor } from "./motor.js";
import dados from "./dados.json";

export const Sukuna3D: React.FC = () => <AbsoluteFill style={{ background: "#06060c" }}><Cena3D criar={criarMotor} dados={dados} /></AbsoluteFill>;
