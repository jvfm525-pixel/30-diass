"""Efeitos sonoros sintetizados (determinísticos) do vídeo do Aizen (xadrez 3D).
dedo.wav (o "ting" metálico de uma lâmina parada por um dedo), corte.wav (golpe de espada)
e vidro.wav (tanque de vidro estourando).
Uso: python3 tools/sfx_aizen.py <pasta_saida>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(17)


def save(name, x, peak=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return lfilter(b, a, x)


def T(sec):
    return np.arange(int(SR * sec)) / SR


# dedo: impacto curto + sino metálico inarmônico que some devagar
t = T(2.2)
ring = sum(np.sin(2 * np.pi * f * t) * a * np.exp(-t * d) for f, a, d in ((1870, 1.0, 2.2), (2950, 0.6, 3.0), (4410, 0.4, 4.0), (6230, 0.25, 6.0)))
hit = bp(rng.standard_normal(len(t)), 2000, 9000) * np.exp(-t * 90)
save("dedo.wav", ring * np.minimum(1, t / 0.002) + hit * 0.8)

# corte: ruído que varre do grave pro agudo + brilho de lâmina
t = T(0.7)
w = rng.standard_normal(len(t)); sweep = np.zeros_like(t)
for a, b in ((0, .12), (.12, .24), (.24, .4), (.4, .7)):
    i, j = int(a * SR), int(b * SR); fc = 600 + 5200 * ((a + b) / 2 / .7)
    sweep[i:j] = bp(w[i:j], fc * 0.6, min(fc * 1.5, 16000))
env = np.minimum(1, t / 0.05) * np.exp(-np.maximum(0, t - 0.12) * 9)
shine = np.sin(2 * np.pi * 3200 * t) * np.exp(-np.maximum(0, t - 0.1) * 14) * (t > 0.1) * 0.25
save("corte.wav", sweep * env + shine)

# vidro: estalo + muitos cacos tilintando
t = T(1.8)
crack = bp(rng.standard_normal(len(t)), 1500, 12000) * np.exp(-t * 40)
shards = np.zeros_like(t)
for i in range(46):
    s0 = int(rng.uniform(0.02, 1.3) * SR); n = int(0.12 * SR); x = np.arange(n) / SR; f = rng.uniform(2500, 9000)
    if s0 + n < len(t):
        shards[s0:s0 + n] += rng.uniform(0.1, 0.45) * np.sin(2 * np.pi * f * x) * np.exp(-x * rng.uniform(30, 70))
save("vidro.wav", crack + shards)
print("ok")
