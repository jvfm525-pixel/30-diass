"""Trilha melancólica (sintetizada, determinística) para o vídeo do Asta.
Arpejo de piano em Lá menor (Am, F, C, G) com pad suave; a partir de `swell_at`
entram pulso grave e oitavas altas, para a parte da antimagia.
Uso: python3 tools/trilha_asta.py <saida.wav> <duracao_s> <swell_at_s>
"""
import sys

import numpy as np
from scipy.io import wavfile

SR = 44100
out, dur, swell = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
t = np.arange(int(SR * dur)) / SR
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
BEAT = 60 / 72
mix = np.zeros_like(t)


def note(start, m, amp, decay=2.2, length=2.4):
    s0 = int(start * SR)
    n = min(int(length * SR), len(t) - s0)
    if n <= 0:
        return
    x = np.arange(n) / SR
    f = hz(m)
    w = np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * 2 * f * x) + 0.12 * np.sin(2 * np.pi * 3 * f * x)
    env = np.exp(-x * decay) * np.minimum(1, x / 0.008)
    mix[s0:s0 + n] += amp * w * env


bar = 0
tt = 0.0
while tt < dur:
    ch = CHORDS[bar % 4]
    pat = [ch[0], ch[2], ch[1] + 12, ch[2], ch[0] + 12, ch[2], ch[1] + 12, ch[2]]
    for k, m in enumerate(pat):
        st = tt + k * BEAT / 2
        if st >= dur:
            break
        note(st, m, 0.16)
        if st >= swell and k % 2 == 0:
            note(st, m + 12, 0.07, decay=3.0)
    # pad do acorde
    s0, n = int(tt * SR), int(4 * BEAT * SR)
    n = min(n, len(t) - s0)
    if n > 0:
        x = np.arange(n) / SR
        pad = sum(np.sin(2 * np.pi * hz(m - 12) * x) for m in ch) / 3
        env = np.minimum(1, x / 1.2) * np.minimum(1, (n / SR - x) / 1.0)
        mix[s0:s0 + n] += (0.10 if tt < swell else 0.16) * pad * env
    tt += 4 * BEAT
    bar += 1
# pulso grave depois do swell
for b in np.arange(swell, dur - 1, BEAT):
    s0, n = int(b * SR), int(0.22 * SR)
    if s0 + n < len(t):
        x = np.arange(n) / SR
        mix[s0:s0 + n] += 0.45 * np.sin(2 * np.pi * 52 * x) * np.exp(-x * 18)
mix *= np.minimum(1, np.minimum(t / 2.5, (dur - t) / 4))
mix /= np.max(np.abs(mix)) * 1.1
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
