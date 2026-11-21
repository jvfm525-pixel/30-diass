"""Monta o JS 3D de um vídeo com o motor v2: núcleo + personagens + cenário + cenas do vídeo + fim.
Uso: python3 tools/motor3d/montar.py <id> "<título>" <saida.js> <cenas1.js> [cenas2.js ...]
O <id> vira a chave de window.__hf.buildReady; o título vai no comentário do topo.
O projeto precisa ter em assets/vendor: three.module.min.js e os módulos de pós-processamento
(EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass, Pass, MaskPass,
CopyShader, LuminosityHighPassShader, OutputShader) da mesma versão (r160).
"""
import os
import sys

D = os.path.dirname(os.path.abspath(__file__))
vid, titulo, out, cenas = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:]
partes = [open(os.path.join(D, f)).read() for f in ("nucleo.js", "personagens.js", "cenario.js")]
partes += [open(c).read() for c in cenas]
partes.append(open(os.path.join(D, "fim.js")).read())
js = "\n".join(partes).replace("__TITULO__", titulo).replace('"__ID__"', f'"{vid}"')
open(out, "w").write(js)
print("ok", out, len(js) // 1024, "KB")
