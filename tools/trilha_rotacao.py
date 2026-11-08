"""Trilha misteriosa e quente (sintetizada, determinística) para o episódio das bolas de aço.
Arpejo em Ré maior com notas espaçadas pela razão áurea, pad suave e pulso leve.
Uso: python3 tools/trilha_rotacao.py <saida.wav> <duracao_s>
"""
import sys

import numpy as np
from scipy.io import wavfile

SR = 44100
out, dur = sys.argv[1], float(sys.argv[2])
t = np.arange(int(SR * dur)) / SR
PHI = (1 + 5 ** .5) / 2
notes = [146.83, 220.0, 293.66, 369.99, 440.0, 587.33, 739.99]
pad = sum(np.sin(2 * np.pi * f * t) for f in (73.42, 110.0, 146.83, 185.0)) * 0.08 * (0.6 + 0.4 * np.sin(2 * np.pi * t / 16))
arp = np.zeros_like(t)
k, tt = 0, 0.0
while tt < dur - 1:
    f = notes[int((k * PHI * 7) % len(notes))]
    s0, n = int(tt * SR), int(1.6 * SR)
    seg = np.arange(min(n, len(t) - s0)) / SR
    arp[s0:s0 + len(seg)] += 0.22 * (np.sin(2 * np.pi * f * seg) + 0.3 * np.sin(2 * np.pi * 2 * f * seg)) * np.exp(-seg * 2.6)
    tt += 0.5 if k % 4 else 0.75
    k += 1
beat = np.zeros_like(t)
for b in np.arange(0, dur, 1.0):
    s0, n = int(b * SR), int(0.15 * SR)
    if s0 + n < len(t):
        x = np.arange(n) / SR
        beat[s0:s0 + n] += 0.35 * np.sin(2 * np.pi * 55 * x) * np.exp(-x * 25)
mix = pad + arp + beat
mix *= np.minimum(1, np.minimum(t / 2.5, (dur - t) / 4))
mix /= np.max(np.abs(mix)) * 1.1
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
