"""Trilha de aventura pirata (sintetizada, determinística) para o vídeo do Joy Boy.
Ré menor em 6/8 (balanço de mar): harpa em arpejo, cordas, contrabaixo, sanfona no refrão de navio;
parte triste com flauta (a promessa), calmaria nas keys, os tambores da libertação (batida de coração
que acelera), parte sombria no trono e final em Ré maior com metais, coro e tambores.
Uso: python3 tools/trilha_joyboy.py <saida.wav> <dur> <triste_de> <triste_ate> <calma_de> <calma_ate> <tambor_de> <sombra_de> <sombra_ate> <final_de>
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
out, dur = sys.argv[1], float(sys.argv[2])
sad_a, sad_b, calm_a, calm_b, drum_a, dark_a, dark_b, fin = (float(v) for v in sys.argv[3:11])
N = int(SR * dur)
mix = np.zeros(N)
rng = np.random.default_rng(73)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
BPM = 108
BEAT = 60 / BPM          # semínima pontuada = 1 tempo do 6/8 (3 colcheias)
EI = BEAT / 3            # colcheia
BAR = 2 * BEAT
MIN = [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]]   # Dm Bb C A
MAJ = [[50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52]]   # D Bm G A
MEL = [62, 65, 69, 67, 65, 64, 62, 64, 65, 67, 69, 72]          # motivo original


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


def harp(m, vol):
    n = int(1.6 * SR); x = np.arange(n) / SR; f = hz(m)
    s = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(4 * np.pi * f * x) + 0.12 * np.sin(6 * np.pi * f * x)) * np.exp(-x * 3.2)
    return s * np.minimum(1, x / 0.004) * vol


def flute(m, secs, vol):
    n = int(secs * SR); x = np.arange(n) / SR; f = hz(m) * (1 + 0.006 * np.sin(2 * np.pi * 5.2 * x) * np.minimum(1, x / 0.3))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.08 * np.sin(4 * np.pi * np.cumsum(f) / SR) + lp(rng.standard_normal(n), 3000) * 0.03
    return s * np.minimum(1, x / 0.08) * np.minimum(1, (secs - x) / 0.15) * vol


def squeeze(notes, secs, vol):  # sanfona: quadradas filtradas com trêmulo
    n = int(secs * SR); x = np.arange(n) / SR
    s = sum(np.sign(np.sin(2 * np.pi * hz(m) * x * (1 + 0.002 * i))) for i, m in enumerate(notes)) / len(notes)
    return lp(s, 2200) * (0.8 + 0.2 * np.sin(2 * np.pi * 6 * x)) * np.minimum(1, x / 0.05) * np.minimum(1, (secs - x) / 0.08) * vol


def choir(notes, secs, vol):
    n = int(secs * SR); x = np.arange(n) / SR
    s = sum(saw(hz(m) * d, x * (1 + 0.003 * np.sin(2 * np.pi * (5 + i) * x)), i * 0.13) for i, m in enumerate(notes) for d in (0.995, 1.005)) / (2 * len(notes))
    return (bp(s, 450, 900) + bp(s, 1000, 1300) * 0.5) * np.minimum(1, x / 0.6) * np.minimum(1, (secs - x) / 0.5) * vol


def taiko(vol, f0=52):
    n = int(1.1 * SR); x = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(f0 + 60 * np.exp(-x * 24)) / SR) * np.exp(-x * 4.5) + lp(rng.standard_normal(n), 700) * np.exp(-x * 38) * 0.4) * vol


bar, tt = 0, 0.0
while tt < dur:
    sad, calm, drums, dark, final = sad_a <= tt < sad_b, calm_a <= tt < calm_b, drum_a <= tt < dark_a, dark_a <= tt < dark_b, tt >= fin
    ch = (MAJ if final else MIN)[bar % 4]
    n = int(BAR * SR); x = np.arange(n) / SR
    env = np.minimum(1, x / 0.3) * np.minimum(1, (BAR - x) / 0.3)
    # contrabaixo e cordas
    put(tt, lp(saw(hz(ch[0] - 24), x) + saw(hz(ch[0] - 24) * 1.004, x), 220) * env * (0.05 if calm else 0.13))
    pad = sum(saw(hz(m - 12) * d, x, i * 0.2) for i, m in enumerate(ch) for d in (0.996, 1.004)) / 6
    put(tt, lp(pad, 650 if dark else 1100) * env * (0.04 if calm else 0.085))
    # harpa em arpejo (6 colcheias por compasso)
    if not dark:
        for k, m in enumerate((ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24, ch[2] + 12, ch[1] + 12)):
            put(tt + k * EI, harp(m, 0.05 if calm else 0.07))
    # flauta na parte triste
    if sad:
        for k in range(2):
            m = MEL[(bar * 2 + k) % len(MEL)] + 12
            put(tt + k * BEAT, flute(m, BEAT * 0.95, 0.09))
    # sanfona e tambor de navio na aventura (fora das partes calmas, tristes e sombrias)
    if not (sad or calm or dark or drums) and tt > 2.0:
        put(tt, squeeze([c + 12 for c in ch], BEAT * 0.9, 0.05)); put(tt + BEAT, squeeze([c + 12 for c in ch], BEAT * 0.9, 0.04))
        put(tt, taiko(0.25, 60)); put(tt + BEAT, taiko(0.16, 66))
    # os tambores da libertação: batida de coração que acelera e cresce
    if drums or final:
        for k, a in ((0, 0.55), (EI, 0.38), (BEAT, 0.6), (BEAT + EI, 0.4)):
            put(tt + k, taiko(a * (1.15 if final else 1.0), 48))
        put(tt, choir([c + 12 for c in ch], BAR, 0.07 if drums else 0.12))
    # metais no final
    if final:
        nb = int(BAR * SR); xb = np.arange(nb) / SR
        put(tt, lp(saw(hz(ch[0] - 12), xb) * 0.6 + saw(hz(ch[2] - 12), xb) * 0.4, 1600) * np.minimum(1, xb / 0.6) * np.minimum(1, (BAR - xb) / 0.3) * 0.08)
    # sombra: relógio grave, dissonância, nada de harpa
    if dark:
        nd = int(BAR * SR); xd = np.arange(nd) / SR
        put(tt, lp(saw(hz(ch[0] + 1 - 12), xd) * 0.5 + saw(hz(ch[0] + 6 - 12), xd) * 0.5, 700) * np.minimum(1, xd / 0.8) * 0.06)
        for k in range(2):
            put(tt + k * BEAT, taiko(0.3, 40))
    tt += BAR
    bar += 1
put(max(0, fin - 0.05), taiko(1.0, 44))
nr = int(1.8 * SR); xr = np.arange(nr) / SR
put(max(0, fin - 1.8), lp(rng.standard_normal(nr), 3000) * (xr / 1.8) ** 2 * 0.1)
ir_n = int(2.2 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 2.6); ir[0] = 1.0
mix = mix * 0.8 + fftconvolve(mix, ir)[:N] * 0.055
t = np.arange(N) / SR
mix *= np.minimum(1, np.minimum(t / 1.0, (dur - t) / 3.0))
mix /= np.max(np.abs(mix)) * 1.1
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("ok")
