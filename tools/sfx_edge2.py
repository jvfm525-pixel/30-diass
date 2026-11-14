"""Efeitos sonoros sintetizados (determinísticos) do vídeo de Edgerunners 2.
neon.wav (zumbido de letreiro), tiro.wav, explosao.wav, zap.wav (descarga elétrica),
clique.wav (arma que trava), projetor.wav (câmera de filme rodando), voo.wav (subida
com brilho) e obturador.wav (clique de câmera).
Uso: python3 tools/sfx_edge2.py <pasta_saida>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(11)


def save(name, x, peak=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return lfilter(b, a, x)


def lp(x, hi, order=2):
    b, a = butter(order, hi / (SR / 2), btype="low")
    return lfilter(b, a, x)


def hp(x, lo, order=2):
    b, a = butter(order, lo / (SR / 2), btype="high")
    return lfilter(b, a, x)


def T(sec):
    return np.arange(int(SR * sec)) / SR


# letreiro de neon: zumbido de 60 Hz com harmônicos e pequenas falhas
t = T(3.0)
hum = sum(np.sin(2 * np.pi * 60 * k * t) / k for k in range(1, 9))
flick = np.ones_like(t)
for s in (0.7, 1.9, 2.4):
    flick[int(s * SR):int((s + 0.05) * SR)] = 0.25
save("neon.wav", lp(hum, 2500) * flick * np.minimum(1, np.minimum(t / 0.2, (3 - t) / 0.5)), 0.6)

# tiro: estalo de ruído + grave curto + cauda
t = T(0.9)
crack = hp(rng.standard_normal(len(t)), 900) * np.exp(-t * 60)
thump = np.sin(2 * np.pi * (90 * np.exp(-t * 8) + 40) * t) * np.exp(-t * 14)
tail = lp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 6) * 0.25
save("tiro.wav", crack * 0.9 + thump + tail)

# explosão: estrondo grave descendo + ruído que se abre e fecha
t = T(2.6)
boom = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t * 1.5) + 28) / SR) * np.exp(-t * 1.8)
roar = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 2.2) * np.minimum(1, t / 0.02)
deb = np.zeros_like(t)
for i in range(30):
    s0 = int(rng.uniform(0.15, 2.0) * SR); n = int(0.04 * SR)
    if s0 + n < len(t):
        deb[s0:s0 + n] += rng.uniform(0.05, 0.25) * bp(rng.standard_normal(n), 1200, 6000) * np.exp(-np.arange(n) / SR * 90)
save("explosao.wav", boom * 1.1 + roar + deb)

# zap: descarga elétrica (dente-de-serra com modulação rápida e chiado)
t = T(0.9)
f = 220 + 900 * np.exp(-t * 6)
saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
zz = saw * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 37 * t))) + 0.4 * hp(rng.standard_normal(len(t)), 3000)
save("zap.wav", bp(zz, 150, 9000) * np.exp(-t * 3.5) * np.minimum(1, t / 0.005))

# clique: o mecanismo da arma batendo em seco, duas vezes
t = T(0.6)
c = np.zeros_like(t)
for s0, a in ((0.02, 1.0), (0.2, 0.7)):
    i = int(s0 * SR); n = int(0.03 * SR); x = np.arange(n) / SR
    c[i:i + n] += a * (np.sin(2 * np.pi * 2400 * x) * 0.5 + bp(rng.standard_normal(n), 1500, 8000)) * np.exp(-x * 160)
save("clique.wav", c)

# projetor: câmera de filme rodando (cliques rápidos + motor)
t = T(4.0)
p = np.zeros_like(t)
for k in range(int(4.0 * 18)):
    i = int(k / 18 * SR); n = int(0.012 * SR); x = np.arange(n) / SR
    if i + n < len(t):
        p[i:i + n] += (0.6 + 0.2 * (k % 2)) * bp(rng.standard_normal(n), 1800, 7000) * np.exp(-x * 300)
motor = 0.15 * np.sin(2 * np.pi * 110 * t) * (1 + 0.3 * np.sin(2 * np.pi * 9 * t))
save("projetor.wav", (p + motor) * np.minimum(1, np.minimum(t / 0.3, (4 - t) / 0.6)), 0.7)

# voo: subida com ruído filtrado e brilho
t = T(2.6)
sweep = np.zeros_like(t)
w = rng.standard_normal(len(t))
for a, b in ((0, 0.5), (0.5, 1.0), (1.0, 1.6), (1.6, 2.6)):
    i, j = int(a * SR), int(b * SR); fc = 300 + 2600 * ((a + b) / 2 / 2.6) ** 1.5
    sweep[i:j] = bp(w[i:j], fc * 0.6, min(fc * 1.6, 15000))
shimmer = sum(np.sin(2 * np.pi * (880 * (1 + t / 2.6)) * m * t) / m for m in (1, 2, 3)) * 0.12
env = np.minimum(1, t / 1.2) * np.minimum(1, (2.6 - t) / 0.8)
save("voo.wav", (sweep + shimmer) * env)

# obturador: clique mecânico de câmera
t = T(0.35)
o = np.zeros_like(t)
for s0, a in ((0.0, 1.0), (0.09, 0.6)):
    i = int(s0 * SR); n = int(0.05 * SR); x = np.arange(n) / SR
    o[i:i + n] += a * bp(rng.standard_normal(n), 900, 7000) * np.exp(-x * 120)
save("obturador.wav", o)
print("ok")
