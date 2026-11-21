"""Trilha synthwave escura (sintetizada, determinística) para o vídeo de Edgerunners 2.
Ré menor (Dm, Bb, F, C) a 100 bpm: pad e arpejo na abertura; bateria e baixo na parte
principal; mais energia a partir de `climax_at` (o D); calmaria a partir de `calm_at`.
Uso: python3 tools/trilha_edge2.py <saida.wav> <duracao_s> <inicio_principal> <climax_at> <calm_at>
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
out, dur, main_at, climax, calm = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
N = int(SR * dur)
mix = np.zeros(N)
rng = np.random.default_rng(5)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
BEAT = 60 / 100
CHORDS = [[62, 65, 69], [58, 62, 65], [53, 57, 60], [60, 64, 67]]  # Dm Bb F C


def lp(x, fc):
    b, a = butter(2, min(fc, SR / 2 - 100) / (SR / 2), btype="low")
    return lfilter(b, a, x)


def hp(x, fc):
    b, a = butter(2, fc / (SR / 2), btype="high")
    return lfilter(b, a, x)


def saw(f, n, ph=0.0):
    t = np.arange(n) / SR
    return 2 * ((f * t + ph) % 1) - 1


def put(start, sig):
    s0 = int(start * SR)
    if s0 >= N:
        return
    n = min(len(sig), N - s0)
    mix[s0:s0 + n] += sig[:n]


def section(t):
    return "intro" if t < main_at else "climax" if climax <= t < calm else "calm" if t >= calm else "main"


bar = 0
tt = 0.0
while tt < dur:
    ch = CHORDS[bar % 4]
    sec = section(tt)
    # pad (sempre), mais aberto no clímax
    n = int(4 * BEAT * SR)
    x = np.arange(n) / SR
    pad = sum(saw(hz(m - 12) * d, n, i * 0.13) for i, m in enumerate(ch) for d in (0.997, 1.003)) / 6
    env = np.minimum(1, x / 0.8) * np.minimum(1, (n / SR - x) / 0.6)
    put(tt, lp(pad, 900 if sec in ("intro", "calm") else 1500 if sec == "main" else 2600) * env * 0.16)
    # arpejo em semicolcheias (intro e calma: colcheias)
    step = BEAT / 2 if sec in ("intro", "calm") else BEAT / 4
    pat = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[0] + 12, ch[2]]
    k = 0
    while k * step < 4 * BEAT - 1e-6:
        m = pat[k % len(pat)] + (12 if sec == "climax" and k % 4 == 3 else 0)
        nn = int(0.22 * SR)
        xx = np.arange(nn) / SR
        tone = (saw(hz(m), nn) * 0.6 + np.sign(np.sin(2 * np.pi * hz(m) * xx)) * 0.4) * np.exp(-xx * 14)
        put(tt + k * step, lp(tone, 2200 if sec != "climax" else 4200) * (0.08 if sec in ("intro", "calm") else 0.1))
        k += 1
    if sec in ("main", "climax"):
        for b in range(4):
            bt = tt + b * BEAT
            # bumbo
            nk = int(0.35 * SR); xk = np.arange(nk) / SR
            put(bt, np.sin(2 * np.pi * np.cumsum(45 + 75 * np.exp(-xk * 30)) / SR) * np.exp(-xk * 9) * 0.55)
            # chimbal no contratempo
            nh = int(0.06 * SR); xh = np.arange(nh) / SR
            put(bt + BEAT / 2, hp(rng.standard_normal(nh), 7000) * np.exp(-xh * 60) * 0.12)
            # caixa no 2 e no 4 (só no clímax)
            if sec == "climax" and b % 2 == 1:
                ns = int(0.25 * SR); xs = np.arange(ns) / SR
                put(bt, (lp(rng.standard_normal(ns), 5000) * 0.7 + np.sin(2 * np.pi * 190 * xs) * 0.4) * np.exp(-xs * 16) * 0.3)
            # baixo em colcheias
            for e in range(2):
                nb = int(BEAT / 2 * SR * 0.92); xb = np.arange(nb) / SR
                f = hz(ch[0] - 24 + (12 if sec == "climax" and e == 1 else 0))
                put(bt + e * BEAT / 2, lp(saw(f, nb), 380 if sec == "main" else 600) * np.exp(-xb * 5) * 0.28)
    tt += 4 * BEAT
    bar += 1

t = np.arange(N) / SR
mix *= np.minimum(1, np.minimum(t / 2.0, (dur - t) / 4.0))
mix /= np.max(np.abs(mix)) * 1.1
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("ok")
