"""Trilha de aventura misteriosa (sintetizada, determinística) para o vídeo do Shanks.
Mi menor em 6/8 (Em, C, G, D): harpa e cordas; calmaria entre `calm_from` e `calm_to`
(pausa das keys); trompa heroica e tímpanos de `rise_at` até `mystery_at`; depois só
cordas graves e uma caixinha de música até o fim.
Uso: python3 tools/trilha_shanks.py <saida.wav> <duracao_s> <rise_at> <mystery_at> <calm_from> <calm_to>
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
out, dur = sys.argv[1], float(sys.argv[2])
rise_at, mystery_at, calm_from, calm_to = (float(v) for v in sys.argv[3:7])
N = int(SR * dur)
mix = np.zeros(N)
rng = np.random.default_rng(21)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
E = 60 / 150  # colcheia em 6/8
CH = [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]]  # Em C G D
MEL = [[71, 76], [79, 76], [74, 71], [78, 81]]  # trompa: duas notas por compasso


def lp(x, fc):
    b, a = butter(2, min(fc, SR / 2 - 100) / (SR / 2), btype="low")
    return lfilter(b, a, x)


def put(st, sig):
    s0 = int(st * SR)
    if s0 >= N:
        return
    n = min(len(sig), N - s0)
    mix[s0:s0 + n] += sig[:n]


def saw(f, x, ph=0.0):
    return 2 * ((f * x + ph) % 1) - 1


bar, tt = 0, 0.0
while tt < dur:
    ch = CH[bar % 4]
    calm = calm_from <= tt < calm_to
    rise = rise_at <= tt < mystery_at
    myst = tt >= mystery_at
    n = int(6 * E * SR); x = np.arange(n) / SR
    env = np.minimum(1, x / 0.9) * np.minimum(1, (n / SR - x) / 0.6)
    # cordas (pad)
    pad = sum(saw(hz(m - 12) * d, x, i * 0.21) for i, m in enumerate(ch) for d in (0.997, 1.003)) / 6
    put(tt, lp(pad, 650 if myst else 1300 if rise else 900) * env * (0.06 if calm else 0.15 if rise else 0.12))
    # harpa
    if not myst:
        pat = [ch[0], ch[1], ch[2], ch[0] + 12, ch[2], ch[1]]
        for k, m in enumerate(pat):
            nn = int(0.5 * SR); xx = np.arange(nn) / SR
            pl = (np.sin(2 * np.pi * hz(m) * xx) + 0.35 * np.sin(2 * np.pi * hz(m) * 2 * xx) + 0.1 * np.sin(2 * np.pi * hz(m) * 3 * xx)) * np.exp(-xx * 7)
            put(tt + k * E, pl * (0.04 if calm else 0.09))
    # trompa heroica + tímpanos
    if rise:
        for h, m in enumerate(MEL[bar % 4]):
            nm = int(3 * E * SR * 0.96); xm = np.arange(nm) / SR
            vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * xm) * np.minimum(1, xm / 0.4)
            tone = lp(saw(hz(m - 12), xm * vib) * 0.7 + saw(hz(m - 12) * 1.002, xm) * 0.3, 1600)
            put(tt + h * 3 * E, tone * np.minimum(1, xm / 0.12) * np.minimum(1, (nm / SR - xm) / 0.25) * 0.11)
        for k in (0, 3):
            nk = int(0.7 * SR); xk = np.arange(nk) / SR
            put(tt + k * E, np.sin(2 * np.pi * np.cumsum(62 + 40 * np.exp(-xk * 18)) / SR) * np.exp(-xk * 5) * 0.42)
        nb = int(6 * E * SR * 0.95); xb = np.arange(nb) / SR
        put(tt, lp(saw(hz(ch[0] - 24), xb), 320) * np.exp(-xb * 0.5) * 0.2)
    # caixinha de música no mistério
    if myst:
        for k, m in enumerate([ch[2] + 24, ch[0] + 24]):
            nb = int(1.2 * SR); xb = np.arange(nb) / SR
            put(tt + k * 3 * E, (np.sin(2 * np.pi * hz(m) * xb) + 0.25 * np.sin(2 * np.pi * hz(m) * 4.1 * xb)) * np.exp(-xb * 4) * 0.05)
        nl = int(6 * E * SR); xl = np.arange(nl) / SR
        put(tt, lp(saw(hz(ch[0] - 24), xl), 220) * env * 0.12)
    tt += 6 * E
    bar += 1
# rufar de tambor antes da subida
nr = int(1.2 * SR); xr = np.arange(nr) / SR
put(max(0, rise_at - 1.2), lp(rng.standard_normal(nr), 3000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 14 * xr))) * (xr / 1.2) * 0.12)
t = np.arange(N) / SR
mix *= np.minimum(1, np.minimum(t / 2.0, (dur - t) / 4.0))
mix /= np.max(np.abs(mix)) * 1.1
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("ok")
