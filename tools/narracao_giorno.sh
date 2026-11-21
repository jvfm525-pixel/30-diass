#!/usr/bin/env bash
# Prepara a narração do vídeo do Giorno quando o áudio chegar (ElevenLabs, voz Roberta, modelo v4).
# Uso: bash tools/narracao_giorno.sh <arquivo_da_narracao.mp3>
# Acelera 8%, normaliza em -15 LUFS, transcreve (whisper) e regera o vídeo e a trilha com os tempos reais.
set -euo pipefail
cd "$(dirname "$0")/.."
IN="$1"
V=giorno/assets/voice
cp "$IN" "$V/narracao-giorno-original.${IN##*.}"
ffmpeg -y -v error -i "$IN" -af "atempo=1.08,loudnorm=I=-15:TP=-1.5" -ar 48000 "$V/narracao-giorno.wav"
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx -y hyperframes@0.9.17 transcribe "$V/narracao-giorno.wav" -d "$V" --model small --language pt --json
python3 tools/build_giorno.py
DUR=$(python3 -c "import json;s=open('giorno/assets/timing.js').read();d=json.loads(s[s.index('=')+1:].strip().rstrip(';'));sc={n:a for n,a,b in d['scenes']};print(d['total'],sc['s5-keys'],sc['s6-sozinho'],sc['s7-destino'],sc['s8-ninguem'])")
python3 tools/trilha_giorno.py giorno/assets/music/trilha-giorno.wav $DUR
python3 tools/build_giorno.py
echo "pronto: confira as palavras que não casaram (FIX em tools/build_giorno.py) antes de renderizar"
