"""Monta o motor 3D (Three.js) como módulo para o Remotion: export function criarMotor(canvas, T).
Uso: python3 tools/motor3d/montar_remotion.py <saida.js> <cenas1.js> [...]"""
import os, re, sys
D = os.path.dirname(os.path.abspath(__file__))
out, cenas = sys.argv[1], sys.argv[2:]
nuc = open(os.path.join(D, "nucleo.js")).read()
imp = '''import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
'''
nuc = re.sub(r'^import .*\n', '', nuc, flags=re.M)
nuc = nuc.replace("const T = window.HF_T;", "const T = HF_T;").replace('const canvas = document.getElementById("c3d");', "")
fim = open(os.path.join(D, "fim.js")).read()
corpo = fim[fim.index("function setSun"):fim.index("window.__hf = window.__hf")]
body = "\n".join([nuc, open(os.path.join(D, "personagens.js")).read(), open(os.path.join(D, "cenario.js")).read()] + [open(c).read() for c in cenas])
body += open(os.path.join(D, "fim-remotion.js")).read().replace("FIM_CORPO", corpo)
js = "// @ts-nocheck\n" + imp + "export function criarMotor(canvas, HF_T) {\n" + body
open(out, "w").write(js)
print("ok", out, len(js) // 1024, "KB")
