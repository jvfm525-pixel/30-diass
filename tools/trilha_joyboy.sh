#!/usr/bin/env bash
# Gera a trilha do Joy Boy com as seções presas aos tempos atuais (joyboy/assets/timing.js).
set -euo pipefail
cd "$(dirname "$0")/.."
ARGS=$(python3 -c "
import json;s=open('joyboy/assets/timing.js').read();d=json.loads(s[s.index('=')+1:].strip().rstrip(';'));sc={n:(a,b) for n,a,b in d['scenes']};k=d['k']
print(d['total'], sc['s4-promessa'][0], sc['s4-promessa'][1], sc['s5-keys'][0], sc['s5-keys'][1], sc['s7-fruta'][0], sc['s8-imu'][0], k['herdou'] - 0.3, k['herdou'] - 0.3)")
python3 tools/trilha_joyboy.py joyboy/assets/music/trilha-joyboy.wav $ARGS
