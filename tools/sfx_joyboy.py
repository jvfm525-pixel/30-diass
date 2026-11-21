"""Efeitos sonoros sintetizados (determinísticos) do vídeo do Joy Boy.
tambor (batidas da libertação: tum-tum-tum em ritmo de coração), trompa (elefante gigante), gaivotas,
transmissao (rádio com chiado e bipes), engrenagem (gigante de ferro despertando), bolhas (fundo do mar).
Uso: python3 tools/sfx_joyboy.py <pasta_saida>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(29)


def save(name, x, peak=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x)


def lp(x, fc):
    return sosfilt(butter(2, fc / (SR / 2), btype="low", output="sos"), x)


def T(sec):
    return np.arange(int(SR * sec)) / SR


def N(n):
    return rng.standard_normal(n)


def drum(f0=58, dur=0.9, k=1.0):
    t = T(dur)
    body = np.sin(2 * np.pi * np.cumsum(f0 + 70 * np.exp(-t * 26)) / SR) * np.exp(-t * 5.5)
    skin = lp(N(len(t)), 900) * np.exp(-t * 40) * 0.45
    return (body + skin) * k


# tambor: tum-tum ... tum-tum (ritmo de batida de coração, cada vez mais forte)
t = T(3.0); x = np.zeros_like(t)
for i, (st, k) in enumerate([(0.0, 0.7), (0.22, 0.55), (0.9, 0.85), (1.12, 0.65), (1.8, 1.0), (2.02, 0.8)]):
    d = drum(56 + (i % 2) * 6, 0.95, k); s0 = int(st * SR); n = min(len(d), len(x) - s0); x[s0:s0 + n] += d[:n]
save("tambor.wav", x)

# trompa: brado do elefante (tom que sobe e treme, áspero, com eco)
t = T(2.6)
f = 260 + 340 * np.minimum(1, t / 0.35) - 60 * np.maximum(0, t - 1.4)
car = np.sign(np.sin(2 * np.pi * np.cumsum(f * (1 + 0.025 * np.sin(2 * np.pi * 9 * t))) / SR)) * 0.5 + np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * 0.3
env = np.minimum(1, t / 0.12) * np.exp(-np.maximum(0, t - 1.5) * 3.2)
y = bp(car, 300, 3800) * env + bp(N(len(t)), 600, 2400) * env * 0.25
echo = np.zeros_like(y); d0 = int(0.32 * SR); echo[d0:] = y[:-d0] * 0.35
save("trompa.wav", y + echo, 0.85)

# gaivotas: piados curtos que caem de tom
t = T(3.0); x = np.zeros_like(t)
for i in range(6):
    s0 = int((0.15 + i * 0.45 + rng.uniform(0, 0.12)) * SR); n = int(0.32 * SR); tt = np.arange(n) / SR
    f = 2300 - 1400 * (tt / 0.32) + 300 * np.sin(2 * np.pi * 14 * tt)
    if s0 + n < len(x):
        x[s0:s0 + n] += bp(np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * N(n), 900, 4200) * np.sin(np.pi * tt / 0.32) ** 2 * (0.6 + 0.4 * (i % 2))
save("gaivotas.wav", x, 0.6)

# transmissao: chiado de rádio que abre, dois bipes e o sinal estabilizando
t = T(1.8)
st = bp(N(len(t)), 1200, 6000) * (0.6 * np.exp(-t * 2.5) + 0.12) * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * t))
bips = np.zeros_like(t)
for s_ in (0.35, 0.6):
    s0 = int(s_ * SR); n = int(0.12 * SR); tt = np.arange(n) / SR; bips[s0:s0 + n] += np.sin(2 * np.pi * 1320 * tt) * np.minimum(1, (0.12 - tt) / 0.02) * 0.6
hum = np.sin(2 * np.pi * 110 * t) * 0.12 * np.minimum(1, t / 0.6)
save("transmissao.wav", st + bips + hum, 0.75)

# engrenagem: o gigante desperta (rangido de metal, servo que sobe, baque)
t = T(2.4)
grind = bp(N(len(t)), 300, 1600) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 5 * t))) * np.minimum(1, t / 0.3) * np.exp(-np.maximum(0, t - 1.6) * 4)
servo = np.sin(2 * np.pi * np.cumsum(180 + 220 * np.minimum(1, t / 1.4)) / SR) * 0.35 * np.minimum(1, t / 0.4) * np.exp(-np.maximum(0, t - 1.5) * 5)
thud = drum(48, 0.8, 1.0); x = grind * 0.6 + servo; s0 = int(1.55 * SR); x[s0:s0 + len(thud)] += thud[: len(x) - s0]
save("engrenagem.wav", x)

# bolhas: borbulhas subindo (tons que sobem), fundo grave de água
t = T(2.5); x = lp(N(len(t)), 300) * 0.25
for i in range(34):
    s0 = int(rng.uniform(0.0, 2.2) * SR); n = int(0.06 * SR); tt = np.arange(n) / SR; f0 = rng.uniform(500, 1400)
    if s0 + n < len(x):
        x[s0:s0 + n] += np.sin(2 * np.pi * np.cumsum(f0 * (1 + tt * 10)) / SR) * np.exp(-tt * 50) * rng.uniform(0.2, 0.5)
save("bolhas.wav", x, 0.7)
print("ok")
