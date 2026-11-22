#!/bin/sh
# monta o motor 3D do vídeo do Demônio da Morte para o Remotion (com "teste" monta só a folha de personagens)
cd "$(dirname "$0")/.."
LIBS="tools/motor3d/lowpoly.js tools/cenas-sukuna/su-comum.js tools/cenas-light/li-comum.js tools/cenas-grisha/gr-comum.js tools/cenas-grisha/gr-kit.js tools/cenas-grisha/gr-locais.js tools/cenas-gojo/go-locais.js tools/cenas-gyro/gy-comum.js tools/cenas-morte/mo-comum.js"
if [ "$1" = "teste" ]; then python3 tools/motor3d/montar_remotion.py remotion/src/videos/morte/motor-teste.js $LIBS tools/cenas-morte/mo-teste.js; exit; fi
python3 tools/motor3d/montar_remotion.py remotion/src/videos/morte/motor.js $LIBS $(ls tools/cenas-morte/mo-locais*.js 2>/dev/null) tools/cenas-morte/mo-a.js tools/cenas-morte/mo-b.js
