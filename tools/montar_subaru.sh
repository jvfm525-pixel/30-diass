#!/bin/sh
# monta o motor 3D do vídeo do Subaru
cd "$(dirname "$0")/.." && python3 tools/motor3d/montar_remotion.py remotion/src/videos/subaru/motor.js tools/motor3d/lowpoly.js tools/cenas-sukuna/su-comum.js tools/cenas-light/li-comum.js tools/cenas-grisha/gr-comum.js tools/cenas-grisha/gr-kit.js tools/cenas-grisha/gr-locais.js tools/cenas-gojo/go-locais.js tools/cenas-subaru/su2-comum.js tools/cenas-subaru/su2-locais.js tools/cenas-subaru/su2-a.js tools/cenas-subaru/su2-b.js
