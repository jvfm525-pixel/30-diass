"""Trilha orquestral dramática (sintetizada, determinística) para o vídeo do Giorno.
Sol menor, 92 bpm: ostinato de cordas, cravo em arpejo, metais e coro; calmaria nas keys;
parte sinistra (relógio, cordas dissonantes, caixinha de música) no destino do vilão; final triunfante e suave.
Uso: python3 tools/trilha_giorno.py <saida.wav> <duracao_s> <calma_de> <calma_ate> <sinistro_de> <triunfo_de>
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
out, dur = sys.argv[1], float(sys.argv[2])
calm_a, calm_b, sin_a, tri = (float(v) for v in sys.argv[3:7])
N = int(SR * dur)
mix = np.zeros(N)
rng = np.random.default_rng(91)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
B = 60 / 92
CH = [[55, 58, 62], [51, 55, 58], [53, 57, 60], [50, 54, 57]]  # Gm Eb F D
TRI = [[51, 55, 58], [53, 57, 60], [55, 58, 62], [50, 54, 57]]  # Eb F Gm D


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


def harpsi(m, vol):
    n = int(0.9 * SR); x = np.arange(n) / SR; f = hz(m)
    s = sum(saw(f * k, x) * a for k, a in ((1, 0.6), (2, 0.25))) * np.exp(-x * 6)
    return bp(s, 300, 6000) * vol


def choir(notes, secs, vol):
    n = int(secs * SR); x = np.arange(n) / SR
    s = sum(saw(hz(m) * d, x * (1 + 0.003 * np.sin(2 * np.pi * (5 + i) * x)), i * 0.13) for i, m in enumerate(notes) for d in (0.995, 1.005)) / (2 * len(notes))
    return (bp(s, 450, 900) + bp(s, 1000, 1300) * 0.5) * np.minimum(1, x / 0.6) * np.minimum(1, (secs - x) / 0.5) * vol


def timp(vol, f0=60):
    n = int(1.2 * SR); x = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(f0 + 30 * np.exp(-x * 18)) / SR) * np.exp(-x * 4) + lp(rng.standard_normal(n), 500) * np.exp(-x * 35) * 0.3) * vol


bar, tt = 0, 0.0
while tt < dur:
    calm, sinis, trium = calm_a <= tt < calm_b, sin_a <= tt < tri, tt >= tri
    ch = (TRI if trium else CH)[bar % 4]
    L = 4 * B; n = int(L * SR); x = np.arange(n) / SR
    env = np.minimum(1, x / 0.4) * np.minimum(1, (L - x) / 0.4)
    # baixo e cordas
    put(tt, lp(saw(hz(ch[0] - 24), x) + saw(hz(ch[0] - 24) * 1.004, x), 200) * env * (0.06 if calm else 0.14))
    pad = sum(saw(hz(m - 12) * d, x, i * 0.2) for i, m in enumerate(ch) for d in (0.996, 1.004)) / 6
    put(tt, lp(pad, 700 if sinis else 1100) * env * (0.04 if calm else 0.09))
    # ostinato em semicolcheias (cordas)
    if not calm and not sinis:
        for k in range(16):
            m = (ch[0], ch[1], ch[2], ch[1])[k % 4] + 12
            nn = int(B / 4 * SR * 0.85); xx = np.arange(nn) / SR
            put(tt + k * B / 4, lp(saw(hz(m), xx), 1800) * np.exp(-xx * 9) * 0.035)
    # cravo em arpejo
    if not sinis:
        for k, m in enumerate((ch[0] + 12, ch[2] + 12, ch[1] + 24, ch[2] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 24, ch[2] + 12)):
            put(tt + k * B / 2, harpsi(m, 0.05 if calm else 0.07))
    # coro e metais
    if not calm and not sinis:
        put(tt, choir([m + 12 for m in ch], L, 0.08 if not trium else 0.12))
        nb = int(L * SR); xb = np.arange(nb) / SR
        br = saw(hz(ch[0] - 12), xb) * 0.6 + saw(hz(ch[2] - 12), xb) * 0.4
        rr = np.minimum(1, xb / L)
        put(tt, (lp(br, 600) * (1 - rr) + lp(br, 1500) * rr) * np.minimum(1, xb / 1.0) * np.minimum(1, (L - xb) / 0.4) * (0.05 if not trium else 0.08))
        for k in ((0, 0.5), (2, 0.35)) if not trium else ((0, 0.55), (1, 0.3), (2, 0.45), (3, 0.3)):
            put(tt + k[0] * B, timp(k[1]))
    # sinistro: relógio, dissonância e caixinha de música
    if sinis:
        for k in range(8):
            nt = int(0.03 * SR); xt = np.arange(nt) / SR
            put(tt + k * B / 2, bp(rng.standard_normal(nt), 2500, 7000) * np.exp(-xt * 200) * (0.16 if k % 2 == 0 else 0.1))
        nd = int(L * SR); xd = np.arange(nd) / SR
        put(tt, lp(saw(hz(ch[0] + 1), xd) * 0.5 + saw(hz(ch[0] + 6), xd) * 0.5, 900) * np.minimum(1, xd / 1) * 0.04)
        for k, m in enumerate((ch[2] + 24, ch[1] + 24, ch[0] + 24, ch[1] + 25)):
            nm = int(1.0 * SR); xm = np.arange(nm) / SR
            put(tt + k * B, (np.sin(2 * np.pi * hz(m) * xm) + 0.25 * np.sin(2 * np.pi * hz(m) * 4.1 * xm)) * np.exp(-xm * 4) * 0.05)
    tt += L
    bar += 1
put(tri - 0.05, timp(0.9, 50))
nr = int(2.0 * SR); xr = np.arange(nr) / SR
put(max(0, tri - 2.0), lp(rng.standard_normal(nr), 3000) * (xr / 2.0) ** 2 * 0.12)
ir_n = int(2.4 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 2.4); ir[0] = 1.0
mix = mix * 0.8 + fftconvolve(mix, ir)[:N] * 0.06
t = np.arange(N) / SR
mix *= np.minimum(1, np.minimum(t / 1.2, (dur - t) / 3.0))
mix /= np.max(np.abs(mix)) * 1.1
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("ok")
