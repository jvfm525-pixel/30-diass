#!/usr/bin/env bash
# Prepara a narração do vídeo dos Titãs quando o áudio chegar (ElevenLabs, voz Roberta).
# Uso: bash tools/narracao_titas.sh <arquivo_da_narracao.mp3>
# Acelera 8%, normaliza em -15 LUFS, transcreve (whisper) e regera o vídeo com os tempos reais.
set -euo pipefail
cd "$(dirname "$0")/.."
IN="$1"
V=titas/assets/voice
cp "$IN" "$V/narracao-titas-original.${IN##*.}"
ffmpeg -y -v error -i "$IN" -af "atempo=1.08,loudnorm=I=-15:TP=-1.5" -ar 48000 "$V/narracao-titas.wav"
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx -y hyperframes@0.9.17 transcribe "$V/narracao-titas.wav" -d "$V" --model small --language pt --json
python3 tools/build_titas.py
DUR=$(python3 -c "import json;s=open('titas/assets/timing.js').read();d=json.loads(s[s.index('=')+1:].strip().rstrip(';'));sc={n:a for n,a,b in d['scenes']};print(d['total'],sc['s2-estomago'],sc['s5-keys'],sc['s6-pessoas'],sc['s6-pessoas'],sc['s9-pior'])")
python3 tools/trilha_titas.py titas/assets/music/trilha-titas.wav $DUR
python3 tools/build_titas.py
echo "pronto: confira as palavras que não casaram (FIX em tools/build_titas.py) antes de renderizar"
