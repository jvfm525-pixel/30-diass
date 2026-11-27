"""Efeitos sonoros sintetizados (determinísticos) do vídeo dos Titãs.
passo (pisada de gigante), rosnado (gemido grave), vapor (chiado), scan (holograma), glub (engolir),
vento, grilos, trovao.
Uso: python3 tools/sfx_titas.py <pasta_saida>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter, sosfilt

SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(29)


def save(name, x, peak=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc / (SR / 2), btype="low", output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc / (SR / 2), btype="high", output="sos"), x)


def T(sec):
    return np.arange(int(SR * sec)) / SR


def noise(n):
    return rng.standard_normal(n)


# passo: baque grave com queda de tom + estrondo + cascalho
t = T(2.6)
boom = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t * 9)) / SR) * np.exp(-t * 2.2)
rumble = lp(noise(len(t)), 160) * np.exp(-t * 1.6) * 2.5
thud = lp(noise(len(t)), 900) * np.exp(-t * 28) * 0.8
deb = np.zeros_like(t)
for i in range(60):
    s0 = int(rng.uniform(0.05, 1.4) * SR); n = int(0.05 * SR); x = np.arange(n) / SR
    if s0 + n < len(t):
        deb[s0:s0 + n] += bp(noise(n), 1500, 6000) * np.exp(-x * 70) * rng.uniform(0.02, 0.1)
save("passo.wav", boom * 1.2 + rumble + thud + deb)

# rosnado: voz grave de gigante (pulsos glotais filtrados por formantes), com tremor
t = T(2.4)
f0 = 52 + 8 * np.sin(2 * np.pi * 0.7 * t) + 4 * np.sin(2 * np.pi * 5.3 * t)
ph = np.cumsum(f0) / SR
src = (2 * (ph % 1) - 1) + 0.4 * noise(len(t)) * 0.3
v = bp(src, 250, 520) * 1.0 + bp(src, 600, 900) * 0.6 + bp(src, 1100, 1500) * 0.25
env = np.minimum(1, t / 0.4) * np.minimum(1, (2.4 - t) / 0.8)
save("rosnado.wav", lp(v, 1800) * env)

# vapor: chiado que sobe e some
t = T(2.8)
v = hp(noise(len(t)), 2500) * 0.7 + bp(noise(len(t)), 5000, 11000) * 0.5
env = np.minimum(1, t / 0.15) * np.exp(-np.maximum(0, t - 0.4) * 1.3)
save("vapor.wav", v * env * (0.8 + 0.2 * np.sin(2 * np.pi * 7 * t)))

# scan: varredura holográfica + tiques digitais
t = T(1.6)
sweep = np.sin(2 * np.pi * np.cumsum(400 + 1800 * (t / 1.6) ** 1.5) / SR) * 0.4 * np.minimum(1, t / 0.05) * np.exp(-np.maximum(0, t - 1.2) * 8)
ticks = np.zeros_like(t)
for k in range(12):
    s0 = int(k * 0.11 * SR); n = int(0.012 * SR)
    ticks[s0:s0 + n] += np.sin(2 * np.pi * 3200 * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 300) * 0.6
save("scan.wav", sweep + ticks, 0.7)

# glub: engolir (gorgolejo grave)
t = T(1.0)
g = np.zeros_like(t)
for k, (st, f) in enumerate(((0.0, 120), (0.18, 95), (0.34, 140), (0.5, 80))):
    s0 = int(st * SR); n = int(0.28 * SR); x = np.arange(n) / SR
    if s0 + n <= len(t):
        g[s0:s0 + n] += np.sin(2 * np.pi * np.cumsum(f * (1 + 0.8 * np.exp(-x * 18))) / SR) * np.exp(-x * 9) * (1 - k * 0.15)
save("glub.wav", lp(g + bp(noise(len(t)), 200, 900) * 0.08 * np.exp(-t * 3), 1200))

# vento: ruído filtrado com rajadas lentas
t = T(7.0)
w = lp(noise(len(t)), 700) * 0.8 + bp(noise(len(t)), 300, 1600) * 0.4
gust = 0.55 + 0.45 * np.sin(2 * np.pi * 0.18 * t + 1) * np.sin(2 * np.pi * 0.07 * t)
save("vento.wav", w * gust * np.minimum(1, np.minimum(t / 1.2, (7 - t) / 1.5)), 0.7)

# grilos: trinados agudos em grupos
t = T(6.5)
cr = np.zeros_like(t)
for j, f in enumerate((4300, 4700, 5100)):
    per = 0.9 + j * 0.23
    for k in range(int(6.5 / per)):
        s0 = int((k * per + j * 0.31) * SR); n = int(0.22 * SR); x = np.arange(n) / SR
        if s0 + n < len(t):
            cr[s0:s0 + n] += np.sin(2 * np.pi * f * x) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 32 * x))) * np.exp(-x * 6) * (0.5 + 0.2 * j)
save("grilos.wav", hp(cr, 2500) * np.minimum(1, np.minimum(t / 0.8, (6.5 - t) / 1.0)), 0.5)

# trovão: estalo + ronco longo
t = T(4.5)
crack = hp(noise(len(t)), 1200) * np.exp(-t * 18) * 1.2
roll = lp(noise(len(t)), 220) * (np.exp(-t * 0.9) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * t) ** 2)) * 3
save("trovao.wav", crack + roll)
print("ok")
