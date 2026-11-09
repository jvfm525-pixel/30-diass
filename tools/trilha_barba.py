"""Trilha pirata sombria (sintetizada, determinística) para o vídeo do Barba Negra.
Ré menor em 6/8 (Dm, Bb, Gm, A): pizzicato e pad graves; tambores de guerra a partir
de `war_at`; calmaria entre `calm_from` e `calm_to` (pausa das keys); final mais cheio.
Uso: python3 tools/trilha_barba.py <saida.wav> <duracao_s> <war_at> <calm_from> <calm_to>
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
out, dur, war_at, calm_from, calm_to = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
N = int(SR * dur)
mix = np.zeros(N)
rng = np.random.default_rng(9)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
E = 60 / 132  # colcheia em 6/8 (tempo de 44 bpm na semínima pontuada)
CH = [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]]  # Dm Bb Gm A


def lp(x, fc):
    b, a = butter(2, min(fc, SR / 2 - 100) / (SR / 2), btype="low")
    return lfilter(b, a, x)


def put(st, sig):
    s0 = int(st * SR)
    if s0 >= N:
        return
    n = min(len(sig), N - s0)
    mix[s0:s0 + n] += sig[:n]


def calm(t):
    return calm_from <= t < calm_to


bar, tt = 0, 0.0
while tt < dur:
    ch = CH[bar % 4]
    war = tt >= war_at and not calm(tt)
    n = int(6 * E * SR); x = np.arange(n) / SR
    pad = sum(2 * ((hz(m - 12) * d * x + i * 0.17) % 1) - 1 for i, m in enumerate(ch) for d in (0.996, 1.004)) / 6
    put(tt, lp(pad, 700 if not war else 1100) * np.minimum(1, x / 0.6) * np.minimum(1, (n / SR - x) / 0.5) * (0.13 if not calm(tt) else 0.07))
    pat = [ch[0], ch[2], ch[1] + 12, ch[2], ch[1] + 12, ch[2] + 12]
    for k, m in enumerate(pat):
        nn = int(0.3 * SR); xx = np.arange(nn) / SR
        pl = (np.sin(2 * np.pi * hz(m) * xx) + 0.3 * np.sin(2 * np.pi * hz(m) * 2 * xx)) * np.exp(-xx * 11)
        put(tt + k * E, pl * (0.1 if not calm(tt) else 0.05))
    if war:
        for k in (0, 3):  # tambor grave no 1 e no 4 (6/8)
            nk = int(0.6 * SR); xk = np.arange(nk) / SR
            put(tt + k * E, np.sin(2 * np.pi * np.cumsum(55 + 50 * np.exp(-xk * 20)) / SR) * np.exp(-xk * 6) * 0.5)
        for k in (2, 5):
            ns = int(0.18 * SR); xs = np.arange(ns) / SR
            put(tt + k * E, lp(rng.standard_normal(ns), 2500) * np.exp(-xs * 25) * 0.12)
        nb = int(6 * E * SR * 0.95); xb = np.arange(nb) / SR
        put(tt, lp(2 * ((hz(ch[0] - 24) * xb) % 1) - 1, 300) * np.exp(-xb * 0.6) * 0.22)
    tt += 6 * E
    bar += 1
t = np.arange(N) / SR
mix *= np.minimum(1, np.minimum(t / 2.0, (dur - t) / 4.0))
mix /= np.max(np.abs(mix)) * 1.1
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("ok")
