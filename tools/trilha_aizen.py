"""Trilha sombria (sintetizada, determinística) para o vídeo do Aizen, no estilo xadrez 3D.
Valsa lenta em Si menor (Bm, G, Em, F#): piano e cordas graves; tique-taque de relógio
de xadrez entre `tick_from` e `tick_to`; calmaria entre `calm_from` e `calm_to`
(pausa das keys); tensão (tímpano e cordas abertas) a partir de `rise_at`; final suave.
Uso: python3 tools/trilha_aizen.py <saida.wav> <duracao_s> <tick_from> <tick_to> <calm_from> <calm_to> <rise_at>
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
out, dur = sys.argv[1], float(sys.argv[2])
tick_from, tick_to, calm_from, calm_to, rise_at = (float(v) for v in sys.argv[3:8])
N = int(SR * dur)
mix = np.zeros(N)
rng = np.random.default_rng(33)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
B = 60 / 72  # semínima a 72 bpm, compasso 3/4
CH = [[47, 50, 54], [43, 47, 50], [40, 43, 47], [42, 46, 49]]  # Bm G Em F#
MEL = [[66, 69, 71], [67, 66, 62], [64, 67, 66], [61, 64, 66]]  # piano: uma nota por tempo


def lp(x, fc):
    b, a = butter(2, min(fc, SR / 2 - 100) / (SR / 2), btype="low")
    return lfilter(b, a, x)


def hp(x, fc):
    b, a = butter(2, fc / (SR / 2), btype="high")
    return lfilter(b, a, x)


def put(st, sig):
    s0 = int(st * SR)
    if s0 >= N:
        return
    n = min(len(sig), N - s0)
    mix[s0:s0 + n] += sig[:n]


def piano(m, n_s, vol):
    n = int(n_s * SR); x = np.arange(n) / SR; f = hz(m)
    tone = sum(np.sin(2 * np.pi * f * k * x) * a * np.exp(-x * (2.2 + k * 1.3)) for k, a in ((1, 1.0), (2, 0.45), (3, 0.2), (4, 0.1)))
    return tone * np.minimum(1, x / 0.004) * vol


bar, tt = 0, 0.0
while tt < dur:
    ch = CH[bar % 4]
    calm = calm_from <= tt < calm_to
    rise = tt >= rise_at
    n = int(3 * B * SR); x = np.arange(n) / SR
    env = np.minimum(1, x / 0.8) * np.minimum(1, (n / SR - x) / 0.5)
    pad = sum(2 * ((hz(m - 12) * d * x + i * 0.23) % 1) - 1 for i, m in enumerate(ch) for d in (0.996, 1.004)) / 6
    put(tt, lp(pad, 1500 if rise else 800) * env * (0.05 if calm else 0.16 if rise else 0.11))
    # baixo da valsa no 1 e acordes no 2 e no 3
    put(tt, piano(ch[0] - 12, 2.0, 0.18 if not calm else 0.08))
    for k in (1, 2):
        for m in ch:
            put(tt + k * B, piano(m + 12, 0.9, 0.05 if not calm else 0.025))
    # melodia do piano
    if not calm:
        for k, m in enumerate(MEL[bar % 4]):
            put(tt + k * B + 0.02, piano(m, 1.4, 0.1 if not rise else 0.12))
    # tique-taque do relógio de xadrez
    if tick_from <= tt < tick_to:
        for k in range(6):
            nt = int(0.03 * SR); xt = np.arange(nt) / SR
            put(tt + k * B / 2, hp(rng.standard_normal(nt), 3000) * np.exp(-xt * 220) * (0.16 if k % 2 == 0 else 0.1))
    # tensão: tímpano no 1 e cordas abertas
    if rise:
        nk = int(1.0 * SR); xk = np.arange(nk) / SR
        put(tt, np.sin(2 * np.pi * np.cumsum(55 + 30 * np.exp(-xk * 14)) / SR) * np.exp(-xk * 3.5) * 0.4)
    tt += 3 * B
    bar += 1
# subida de cordas antes da tensão
nr = int(2.0 * SR); xr = np.arange(nr) / SR
put(max(0, rise_at - 2.0), lp(sum(2 * ((hz(m) * xr * (1 + xr * 0.02)) % 1) - 1 for m in (47, 54, 59)) / 3, 2000) * (xr / 2.0) ** 2 * 0.12)
t = np.arange(N) / SR
mix *= np.minimum(1, np.minimum(t / 2.0, (dur - t) / 4.0))
mix /= np.max(np.abs(mix)) * 1.1
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("ok")
