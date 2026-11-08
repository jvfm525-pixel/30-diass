"""Efeitos sonoros sintetizados (determinísticos) do vídeo do Asta.
dados.wav (dados quicando), corrente.wav (correntes), chuva.wav (chuva, 8 s) e
onda.wav (a onda de antimagia: grave + varrida de ruído + estalos).
Uso: python3 tools/sfx_asta.py <pasta_saida>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(7)


def save(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return lfilter(b, a, x)


def lp(x, hi, order=2):
    b, a = butter(order, hi / (SR / 2), btype="low")
    return lfilter(b, a, x)


def click(n, f, decay):
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) * 0.6 + rng.standard_normal(n) * 0.4) * np.exp(-t * decay)


# dados: batidas de madeira cada vez mais rápidas e fracas
d = np.zeros(int(SR * 1.6))
tt, gap, amp = 0.05, 0.28, 1.0
while tt < 1.4 and amp > 0.05:
    for die in range(2):
        s0 = int((tt + die * 0.035) * SR)
        n = int(0.06 * SR)
        if s0 + n < len(d):
            d[s0:s0 + n] += amp * bp(click(n, 900 + die * 260 + rng.uniform(-80, 80), 70), 400, 5000)
    tt += gap
    gap *= 0.72
    amp *= 0.72
save("dados.wav", d)

# correntes: elos metálicos tilintando
c = np.zeros(int(SR * 1.8))
for i in range(26):
    s0 = int((0.02 + rng.uniform(0, 1.5)) * SR)
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    f = rng.uniform(2200, 4800)
    ring = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.71 * t)) * np.exp(-t * 22)
    if s0 + n < len(c):
        c[s0:s0 + n] += rng.uniform(0.3, 1) * ring
c = bp(c, 900, 9000) * np.minimum(1, np.arange(len(c)) / SR / 0.05)
save("corrente.wav", c)

# chuva: ruído rosado filtrado + gotas
n = int(SR * 8)
w = rng.standard_normal(n)
r = lp(bp(w, 300, 9000), 5000) * 0.5
for i in range(900):
    s0 = int(rng.uniform(0, 7.9) * SR)
    m = int(0.02 * SR)
    r[s0:s0 + m] += rng.uniform(0.2, 0.8) * bp(click(m, rng.uniform(2500, 6000), 260), 1500, 9000)
t = np.arange(n) / SR
r *= np.minimum(1, np.minimum(t / 0.6, (8 - t) / 1.2))
save("chuva.wav", r)

# onda de antimagia: grave descendo + varrida de ruído + estalos secos
n = int(SR * 2.4)
t = np.arange(n) / SR
f = 90 * np.exp(-t * 1.2) + 32
boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
sweep = bp(rng.standard_normal(n), 200, 3500) * np.exp(-((t - 0.35) ** 2) / 0.05) * 0.5
crk = np.zeros(n)
for i in range(18):
    s0 = int(rng.uniform(0.15, 1.6) * SR)
    m = int(0.03 * SR)
    crk[s0:s0 + m] += rng.uniform(0.2, 0.6) * click(m, rng.uniform(1500, 4000), 180)
save("onda.wav", boom * 1.0 + sweep + bp(crk, 800, 8000) * 0.5)
print("ok")
