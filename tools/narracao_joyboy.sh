#!/usr/bin/env bash
# Prepara a narração do vídeo do Joy Boy quando o áudio chegar (ElevenLabs, voz Roberta, modelo v4).
# Uso: bash tools/narracao_joyboy.sh <arquivo_da_narracao.mp3>
# Acelera 8%, normaliza em -15 LUFS, transcreve (whisper) e regera o vídeo e a trilha com os tempos reais.
set -euo pipefail
cd "$(dirname "$0")/.."
IN="$1"
V=joyboy/assets/voice
cp "$IN" "$V/narracao-joyboy-original.${IN##*.}"
ffmpeg -y -v error -i "$IN" -af "atempo=1.08,loudnorm=I=-15:TP=-1.5" -ar 48000 "$V/narracao-joyboy.wav"
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx -y hyperframes@0.9.17 transcribe "$V/narracao-joyboy.wav" -d "$V" --model small --language pt --json
python3 tools/build_joyboy.py
bash tools/trilha_joyboy.sh
python3 tools/build_joyboy.py
echo "pronto: confira as palavras que não casaram (FIX em tools/build_joyboy.py) antes de renderizar"
