#!/usr/bin/env bash
# Prepara a narração do vídeo do Kira (ElevenLabs, voz Roberta, modelo v4).
# Uso: bash tools/narracao_kira.sh <arquivo_da_narracao.mp3>
# Esta leitura veio mais lenta (2,5 palavras/s), então acelera 15% (e não 8%) para ficar no ritmo dos vídeos anteriores;
# normaliza em -15 LUFS, transcreve (whisper) e regera o vídeo e a trilha com os tempos reais.
set -euo pipefail
cd "$(dirname "$0")/.."
IN="$1"
V=kira/assets/voice
[ "$IN" -ef "$V/narracao-kira-original.${IN##*.}" ] || cp "$IN" "$V/narracao-kira-original.${IN##*.}"
ffmpeg -y -v error -i "$IN" -af "atempo=1.15,loudnorm=I=-15:TP=-1.5" -ar 48000 "$V/narracao-kira.wav"
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx -y hyperframes@0.9.17 transcribe "$V/narracao-kira.wav" -d "$V" --model small --language pt --json
if [ -f tools/build_kira.py ]; then
  python3 tools/build_kira.py
  [ -f tools/trilha_kira.sh ] && bash tools/trilha_kira.sh && python3 tools/build_kira.py
fi
echo "pronto: confira as palavras que não casaram (FIX em tools/build_kira.py) antes de renderizar"
