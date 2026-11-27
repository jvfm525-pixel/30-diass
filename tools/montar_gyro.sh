#!/bin/sh
# monta o motor 3D do vídeo do Gyro para o Remotion
cd "$(dirname "$0")/.." && python3 tools/motor3d/montar_remotion.py remotion/src/videos/gyro/motor.js tools/motor3d/lowpoly.js tools/cenas-sukuna/su-comum.js tools/cenas-light/li-comum.js tools/cenas-grisha/gr-comum.js tools/cenas-grisha/gr-kit.js tools/cenas-grisha/gr-locais.js tools/cenas-gojo/go-locais.js tools/cenas-gyro/gy-comum.js tools/cenas-gyro/gy-locais.js tools/cenas-gyro/gy-locais2.js tools/cenas-gyro/gy-a.js tools/cenas-gyro/gy-b.js
