"""Trilha épica e sombria (sintetizada, determinística) para o vídeo dos Titãs.
Ré menor, 70 bpm. Abertura com drone, coro e taiko; ostinato de cordas nas curiosidades;
calmaria (caixinha de música) na pausa das keys; parte épica (coro cheio, taiko, metais) na revelação;
piano triste no final.
Uso: python3 tools/trilha_titas.py <saida.wav> <duracao_s> <fatos_de> <calma_de> <calma_ate> <epico_de> <triste_de>
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
out, dur = sys.argv[1], float(sys.argv[2])
fatos, calm_a, calm_b, epic, sad = (float(v) for v in sys.argv[3:8])
N = int(SR * dur)
mix = np.zeros(N)
rng = np.random.default_rng(41)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
B = 60 / 70
CH = [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]]  # Dm Bb Gm A
SAD = [[50, 53, 57], [46, 50, 53], [41, 45, 48], [45, 49, 52]]  # Dm Bb F A


def lp(x, fc):
    return sosfilt(butter(2, min(fc, SR / 2 - 100) / (SR / 2), btype="low", output="sos"), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x)


def put(st, sig):
    s0 = int(st * SR)
    if s0 >= N or s0 < 0:
        return
    n = min(len(sig), N - s0)
    mix[s0:s0 + n] += sig[:n]


def saw(f, x, ph=0.0):
    return 2 * ((f * x + ph) % 1) - 1


def choir(notes, secs, vol):
    n = int(secs * SR); x = np.arange(n) / SR
    s = sum(saw(hz(m) * d, x * (1 + 0.003 * np.sin(2 * np.pi * (4.7 + i) * x)), i * 0.17) for i, m in enumerate(notes) for d in (0.995, 1.0, 1.005)) / (3 * len(notes))
    v = bp(s, 500, 900) * 1.0 + bp(s, 1000, 1300) * 0.5 + lp(s, 400) * 0.4
    return v * np.minimum(1, x / 1.2) * np.minimum(1, (secs - x) / 1.0) * vol


def taiko(vol, f0=72):
    n = int(1.4 * SR); x = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(f0 * 0.6 + f0 * 0.8 * np.exp(-x * 22)) / SR) * np.exp(-x * 4.5) + lp(rng.standard_normal(n), 600) * np.exp(-x * 30) * 0.4) * vol


def piano(m, secs, vol):
    n = int(secs * SR); x = np.arange(n) / SR; f = hz(m)
    return sum(np.sin(2 * np.pi * f * k * x) * a * np.exp(-x * (1.8 + k * 1.2)) for k, a in ((1, 1.0), (2, 0.4), (3, 0.18), (4, 0.08))) * np.minimum(1, x / 0.004) * vol


bar, tt = 0, 0.0
while tt < dur:
    intro, calm, ep, sd = tt < fatos, calm_a <= tt < calm_b, epic <= tt < sad, tt >= sad
    prog = SAD if sd else CH
    ch = prog[bar % 4]
    L = 4 * B
    n = int(L * SR); x = np.arange(n) / SR
    env = np.minimum(1, x / 0.6) * np.minimum(1, (L - x) / 0.5)
    # drone/baixo
    put(tt, lp(saw(hz(ch[0] - 24), x) + saw(hz(ch[0] - 24) * 1.003, x), 180 if not ep else 260) * env * (0.07 if calm else 0.16))
    # coro
    if not calm:
        put(tt, choir([m + 12 for m in ch] if ep else ch, L, 0.1 if intro else 0.14 if ep else 0.06 if sd else 0.09))
    # ostinato de cordas (colcheias) nas curiosidades e na parte épica
    if (not intro and not calm and not sd) or ep:
        for k in range(8):
            m = (ch[0], ch[0] + 12, ch[2], ch[0] + 12)[k % 4]
            nn = int(B / 2 * SR * 0.9); xx = np.arange(nn) / SR
            put(tt + k * B / 2, lp(saw(hz(m), xx) * 0.6 + saw(hz(m) * 1.004, xx) * 0.4, 1400 if ep else 1000) * np.exp(-xx * 5) * (0.07 if ep else 0.05))
    # taiko
    if intro or ep:
        for k, v in ((0, 0.5), (2, 0.35), (2.5, 0.25), (3, 0.4)) if ep else ((0, 0.4), (2, 0.25)):
            put(tt + k * B, taiko(v))
    elif not calm and not sd:
        put(tt, taiko(0.22))
    # metais (subida) na parte épica
    if ep:
        nb = int(L * SR); xb = np.arange(nb) / SR
        fc = 400 + 1400 * np.minimum(1, xb / L)
        tone = saw(hz(ch[0] - 12), xb) * 0.6 + saw(hz(ch[2] - 12), xb) * 0.4
        put(tt, lp(tone, 900) * np.minimum(1, xb / 1.5) * np.minimum(1, (L - xb) / 0.4) * 0.07)
    # caixinha de música na calmaria
    if calm:
        for k, m in enumerate((ch[2] + 24, ch[1] + 24, ch[0] + 24, ch[1] + 24)):
            nm = int(1.2 * SR); xm = np.arange(nm) / SR
            put(tt + k * B, (np.sin(2 * np.pi * hz(m) * xm) + 0.25 * np.sin(2 * np.pi * hz(m) * 4.02 * xm)) * np.exp(-xm * 3.5) * 0.06)
    # piano triste
    if sd:
        put(tt, piano(ch[0] - 12, 3.0, 0.16))
        for k, m in enumerate((ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12)):
            put(tt + k * B, piano(m, 2.0, 0.08))
    tt += L
    bar += 1
# grande batida no começo da revelação e subida antes dela
put(epic - 0.05, taiko(0.9, 60))
nr = int(2.5 * SR); xr = np.arange(nr) / SR
put(max(0, epic - 2.5), lp(rng.standard_normal(nr), 2500) * (xr / 2.5) ** 2 * 0.12)
# reverberação simples (salão)
ir_n = int(2.2 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 2.6); ir[0] = 1.0
wet = fftconvolve(mix, ir)[:N] * 0.06
mix = mix * 0.8 + wet
t = np.arange(N) / SR
mix *= np.minimum(1, np.minimum(t / 1.5, (dur - t) / 3.5))
mix /= np.max(np.abs(mix)) * 1.1
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("ok")
