// Verificador automático de câmera: percorre o vídeo e acusa câmera dentro de objetos
// ou objeto colado na lente (o erro "câmera dentro de objetos" das regras do canal).
// Uso: node tools/motor3d/checa_camera.mjs <motor.js> <dados.json> [passo=0.1] [t0] [t1]
// Sai com código 1 se achar problema. Não desenha nada: só posiciona a cena e lança raios.
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import os from "os";
const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const require = createRequire(path.join(RAIZ, "remotion/package.json"));
const esbuild = require("esbuild");
let chromium; try { ({ chromium } = require("playwright")); } catch { ({ chromium } = await import("playwright")); }

const [motorJs, dadosJson, passoS = "0.1", t0S, t1S] = process.argv.slice(2);
if (!motorJs || !dadosJson) { console.error("uso: checa_camera.mjs <motor.js> <dados.json> [passo] [t0] [t1]"); process.exit(2); }
const dados = JSON.parse(fs.readFileSync(dadosJson, "utf8"));
const passo = +passoS, t0 = t0S ? +t0S : 0, t1 = t1S ? +t1S : dados.total;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "checa-"));
const entrada = path.join(tmp, "entrada.js");
fs.writeFileSync(entrada, `import * as THREE from "three"; import { criarMotor } from ${JSON.stringify(path.resolve(motorJs))}; window.__THREE = THREE; window.__criar = criarMotor;`);
const pacote = await esbuild.build({ entryPoints: [entrada], bundle: true, format: "iife", write: false, logLevel: "error",
  nodePaths: [path.join(RAIZ, "remotion/node_modules")] });

// roda dentro da página: a cada tempo, raios do centro da câmera para uma grade do quadro
function checar({ dados, passo, t0, t1 }) {
  const THREE = window.__THREE;
  const canvas = document.getElementById("c");
  const m = window.__criar(canvas, dados);
  return m.ready.then(() => {
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), esf = new THREE.Sphere(), achados = [];
    const PERTO = 0.25, COLADO = 0.45, GRADE = [];
    for (let i = 0; i < 7; i++) for (let j = 0; j < 12; j++) GRADE.push([-0.9 + i * 0.3, -0.9 + j * (1.8 / 11)]);
    const visivel = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    const ignora = (o, s) => { if (!o.isMesh || o === s.dome || o.userData.semChecar) return true; const mt = Array.isArray(o.material) ? o.material[0] : o.material;
      return !mt || (mt.transparent && (mt.opacity ?? 1) < 0.4) || mt.blending === THREE.AdditiveBlending || mt.visible === false; };
    const nome = (o) => { const c = (Array.isArray(o.material) ? o.material[0] : o.material)?.color; let q = o, n = ""; while (q && !n) { n = q.name || q.userData.nome || ""; q = q.parent; }
      const p = new THREE.Vector3(); o.getWorldPosition(p); return `${n || o.geometry.type}${c ? " #" + c.getHexString() : ""} @(${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)})`; };
    const lados = new Map(), _n = new THREE.Vector3();
    const fechado = (o) => { const g = o.geometry, p = g.parameters || {}; switch (g.type) {
      case "BoxGeometry": case "IcosahedronGeometry": case "DodecahedronGeometry": case "OctahedronGeometry": case "TorusGeometry": return true;
      case "SphereGeometry": return (p.phiLength ?? 7) >= 6.28 && (p.thetaLength ?? 4) >= 3.14;
      case "CylinderGeometry": case "ConeGeometry": return !p.openEnded;
      default: return false; } };
    window.CHECA_CAM = (camera, group, n, t, s) => {
      group.updateMatrixWorld(true); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
      const cand = [];
      group.traverse((o) => { if (ignora(o, s) || !visivel(o)) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        esf.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld); if (esf.center.distanceTo(camera.position) - esf.radius < 1.2) cand.push(o); });
      // de dentro de um objeto fechado o raio só acha faces de costas: testa os dois lados
      cand.forEach((o) => { const mt = o.material; if (!lados.has(mt)) lados.set(mt, mt.side); mt.side = THREE.DoubleSide; });
      // ERRO: câmera dentro/encostada; AVISO: objeto perto da lente tapando o assunto (na frente do ponto olhado)
      const dLook = camera.position.distanceTo(window.__LOOK || camera.position), frente = Math.min(1.2, 0.6 * dLook);
      let colados = 0, tapando = 0, dentro = 0, quemD = null, min = Infinity, quem = null, quemT = null;
      ray.near = 0; ray.far = Math.max(COLADO, frente, 3);
      for (const [x, y] of GRADE) { ndc.set(x, y); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(cand, false)[0];
        if (!h) continue;
        // face de costas de um sólido fechado = a câmera está dentro dele
        if (fechado(h.object) && h.face && _n.copy(h.face.normal).transformDirection(h.object.matrixWorld).dot(ray.ray.direction) > 0) { dentro++; quemD = quemD || h.object; continue; }
        if (h.distance > Math.max(COLADO, frente)) continue; if (h.distance < COLADO) colados++; if (h.distance < frente) { tapando++; quemT = quemT || h.object; }
        if (h.distance < min) { min = h.distance; quem = h.object; } }
      cand.forEach((o) => { o.material.side = lados.get(o.material); });
      const frac = colados / GRADE.length, fracT = tapando / GRADE.length;
      if (dentro / GRADE.length > 0.3) achados.push({ t: +t.toFixed(2), cena: n, tipo: "ERRO", frac: +(dentro / GRADE.length).toFixed(2), min: 0, quem: "DENTRO de " + nome(quemD) });
      else if (min < PERTO || frac > 0.2) achados.push({ t: +t.toFixed(2), cena: n, tipo: "ERRO", frac: +frac.toFixed(2), min: +min.toFixed(2), quem: quem ? nome(quem) : "" });
      else if (fracT > 0.12) achados.push({ t: +t.toFixed(2), cena: n, tipo: "AVISO", frac: +fracT.toFixed(2), min: +min.toFixed(2), quem: quemT ? nome(quemT) : "" });
    };
    for (let t = t0; t <= t1 + 1e-6; t += passo) m.renderAt(t);
    return achados;
  });
}

const nav = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const pag = await nav.newPage();
pag.on("pageerror", (e) => console.error("erro na página:", e.message));
await pag.setContent('<canvas id="c" width="270" height="480"></canvas>');
await pag.addScriptTag({ content: pacote.outputFiles[0].text });
const achados = await pag.evaluate(checar, { dados, passo, t0, t1 });
await nav.close();
fs.rmSync(tmp, { recursive: true, force: true });

// junta tempos vizinhos com o mesmo objeto em trechos
const trechos = [];
for (const a of achados) { const u = trechos[trechos.length - 1];
  if (u && u.cena === a.cena && u.tipo === a.tipo && a.t - u.fim <= passo * 1.5 && u.quem === a.quem) { u.fim = a.t; u.frac = Math.max(u.frac, a.frac); u.min = Math.min(u.min, a.min); }
  else trechos.push({ ini: a.t, fim: a.t, cena: a.cena, tipo: a.tipo, frac: a.frac, min: a.min, quem: a.quem }); }
for (const r of trechos) console.log(`${r.tipo}  ${r.ini.toFixed(1)}–${r.fim.toFixed(1)} s  ${r.cena}  tapa ${Math.round(r.frac * 100)}%  mais perto ${r.min} m  ${r.quem}`);
const erros = trechos.filter((r) => r.tipo === "ERRO").length, avisos = trechos.length - erros;
console.log(erros ? `ERROS: ${erros} trecho(s) com câmera dentro/colada; avisos: ${avisos}` : `OK: nenhuma câmera dentro de objetos; avisos (olhar o quadro): ${avisos}`);
process.exit(erros ? 1 : 0);
