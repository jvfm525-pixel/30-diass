#!/usr/bin/env bash
# Prepara a narração do vídeo do Kakashi quando o áudio chegar (ElevenLabs, voz Roberta).
# Uso: bash tools/narracao_kakashi.sh <arquivo_da_narracao.mp3>
# Acelera 8%, normaliza em -15 LUFS, transcreve (whisper) e regera o vídeo e a trilha com os tempos reais.
set -euo pipefail
cd "$(dirname "$0")/.."
IN="$1"
V=kakashi/assets/voice
cp "$IN" "$V/narracao-kakashi-original.${IN##*.}"
ffmpeg -y -v error -i "$IN" -af "atempo=1.08,loudnorm=I=-15:TP=-1.5" -ar 48000 "$V/narracao-kakashi.wav"
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx -y hyperframes@0.9.17 transcribe "$V/narracao-kakashi.wav" -d "$V" --model small --language pt --json
python3 tools/build_kakashi.py
DUR=$(python3 -c "import json;s=open('kakashi/assets/timing.js').read();d=json.loads(s[s.index('=')+1:].strip().rstrip(';'));sc={n:a for n,a,b in d['scenes']};print(d['total'],sc['s4-keys'],sc['s5-desmaio'],sc['s5-desmaio'],sc['s7-guerra'])")
python3 tools/trilha_kakashi.py kakashi/assets/music/trilha-kakashi.wav $DUR
python3 tools/build_kakashi.py
echo "pronto: confira as palavras que não casaram (FIX em tools/build_kakashi.py) antes de renderizar"
