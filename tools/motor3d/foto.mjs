// Foto rápida de um instante da cena 3D (sem Remotion), para conferir uma correção.
// Uso: node tools/motor3d/foto.mjs <motor.js> <dados.json> <saida.png> <t> [cam]
//   cam = número da câmera de depuração (DBGC[cena][cam-1]); 0 ou vazio = câmera do vídeo.
//   Vários tempos: separe por vírgula (1.5,3,4.2) e a saída vira saida-<t>.png.
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import os from "os";
const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const require = createRequire(path.join(RAIZ, "remotion/package.json"));
const esbuild = require("esbuild");
let chromium; try { ({ chromium } = require("playwright")); } catch { ({ chromium } = await import("playwright")); }

const [motorJs, dadosJson, saida, tS, camS = "0"] = process.argv.slice(2);
if (!motorJs || !dadosJson || !saida || !tS) { console.error("uso: foto.mjs <motor.js> <dados.json> <saida.png> <t[,t2...]> [cam]"); process.exit(2); }
const dados = JSON.parse(fs.readFileSync(dadosJson, "utf8"));
const tempos = tS.split(",").map(Number);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "foto-"));
const entrada = path.join(tmp, "entrada.js");
fs.writeFileSync(entrada, `import { criarMotor } from ${JSON.stringify(path.resolve(motorJs))}; window.__criar = criarMotor;`);
const pacote = await esbuild.build({ entryPoints: [entrada], bundle: true, format: "iife", write: false, logLevel: "error",
  nodePaths: [path.join(RAIZ, "remotion/node_modules")] });

const nav = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const pag = await nav.newPage();
pag.on("pageerror", (e) => console.error("erro na página:", e.message));
await pag.setContent('<canvas id="c" width="1080" height="1920"></canvas>');
await pag.addScriptTag({ content: pacote.outputFiles[0].text });
const fotos = await pag.evaluate(async ({ dados, tempos, cam }) => {
  const canvas = document.getElementById("c"), m = window.__criar(canvas, dados); await m.ready;
  window.TEST_CAM = cam; const out = [];
  for (const t of tempos) { m.renderAt(t); out.push(canvas.toDataURL("image/png")); }
  return out;
}, { dados, tempos, cam: +camS });
await nav.close();
fs.rmSync(tmp, { recursive: true, force: true });
fotos.forEach((d, i) => { const f = tempos.length > 1 ? saida.replace(/\.png$/, `-${tempos[i]}.png`) : saida;
  fs.writeFileSync(f, Buffer.from(d.split(",")[1], "base64")); console.log(f); });
