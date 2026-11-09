"""Efeitos sonoros sintetizados do vídeo do Barba Negra: mar.wav (ondas, 8 s) e
tremor.wav (terremoto: grave longo, rachaduras e pedras caindo).
Uso: python3 tools/sfx_barba.py <pasta_saida>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(21)


def save(name, x, peak=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))


def lp(x, fc):
    b, a = butter(2, fc / (SR / 2), btype="low")
    return lfilter(b, a, x)


def bp(x, lo, hi):
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return lfilter(b, a, x)


# mar: ruído filtrado com ondas lentas de volume
t = np.arange(int(SR * 8)) / SR
w = lp(rng.standard_normal(len(t)), 900) * (0.55 + 0.45 * np.sin(2 * np.pi * t / 3.2) ** 2)
w += 0.35 * bp(rng.standard_normal(len(t)), 1500, 5000) * np.maximum(0, np.sin(2 * np.pi * t / 3.2 + 0.6)) ** 6
save("mar.wav", w * np.minimum(1, np.minimum(t / 0.8, (8 - t) / 1.2)), 0.7)

# tremor: grave que rola + estalos de rachadura
t = np.arange(int(SR * 3.0)) / SR
rumble = lp(rng.standard_normal(len(t)), 120) * 3 + np.sin(2 * np.pi * 38 * t) * 0.6 * (1 + 0.5 * np.sin(2 * np.pi * 7 * t))
env = np.minimum(1, t / 0.15) * np.exp(-np.maximum(0, t - 0.6) * 1.4)
cr = np.zeros_like(t)
for i in range(26):
    s0 = int(rng.uniform(0.05, 2.4) * SR); n = int(0.05 * SR)
    if s0 + n < len(t):
        x = np.arange(n) / SR
        cr[s0:s0 + n] += rng.uniform(0.2, 0.7) * bp(rng.standard_normal(n), 900, 6000) * np.exp(-x * 70)
save("tremor.wav", rumble * env + cr)
print("ok")
