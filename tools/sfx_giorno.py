"""Efeitos sonoros sintetizados (determinísticos) do vídeo do Giorno.
passos (sapatos na pedra), golpe (soco que corta o ar), rebobinar (fita voltando), tempo (o tempo sendo apagado),
flecha (flecha que voa e crava), agua (queda na água), buzina (carro passando).
Uso: python3 tools/sfx_giorno.py <pasta_saida>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(73)


def save(name, x, peak=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x)


def lp(x, fc):
    return sosfilt(butter(2, fc / (SR / 2), btype="low", output="sos"), x)


def hp(x, fc):
    return sosfilt(butter(2, fc / (SR / 2), btype="high", output="sos"), x)


def T(sec):
    return np.arange(int(SR * sec)) / SR


def N(n):
    return rng.standard_normal(n)


# passos: quatro pisadas de sapato na pedra
t = T(2.2); x = np.zeros_like(t)
for k in range(4):
    s0 = int((0.1 + k * 0.48) * SR); n = int(0.09 * SR); xx = np.arange(n) / SR
    x[s0:s0 + n] += bp(N(n), 300, 3500) * np.exp(-xx * 55) * (0.8 + 0.2 * (k % 2)) + np.sin(2 * np.pi * 110 * xx) * np.exp(-xx * 40) * 0.5
save("passos.wav", x, 0.7)

# golpe: ar cortado (varredura) e um baque seco
t = T(0.9)
sw = np.zeros_like(t); n0 = N(len(t))
for a, b in ((0, .12), (.12, .22), (.22, .32)):
    i, j = int(a * SR), int(b * SR); fc = 800 + 4000 * (b / .32)
    sw[i:j] = bp(n0[i:j], fc * 0.6, fc * 1.4)
env = np.minimum(1, t / 0.08) * np.exp(-np.maximum(0, t - 0.3) * 30)
hit = (lp(N(len(t)), 900) * 1.5 + np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-t * 30)) / SR)) * np.exp(-np.maximum(0, t - 0.3) * 14) * (t > 0.3)
save("golpe.wav", sw * env + hit * 0.8)

# rebobinar: fita voltando (chiados que sobem de tom, rápidos)
t = T(1.3); x = np.zeros_like(t)
for k in range(9):
    s0 = int(k * 0.13 * SR); n = int(0.14 * SR); xx = np.arange(n) / SR
    if s0 + n < len(t):
        f = 900 + k * 260 + 2400 * xx / 0.14
        x[s0:s0 + n] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-xx * 10) * 0.35 + bp(N(n), 1500, 7000) * np.exp(-xx * 25) * 0.25
save("rebobinar.wav", x * np.minimum(1, (1.3 - t) / 0.3), 0.75)

# tempo apagado: zumbido grave que despenca, com cortes (gagueira)
t = T(2.0)
v = np.sin(2 * np.pi * np.cumsum(140 * np.exp(-t * 1.2) + 30) / SR) + 0.5 * lp(N(len(t)), 300)
gate = (np.floor(t * 14) % 3 != 1).astype(float)
save("tempo.wav", v * gate * np.minimum(1, t / 0.05) * np.exp(-t * 0.9))

# flecha: assobio que passa e crava
t = T(1.1)
whi = np.sin(2 * np.pi * np.cumsum(2400 - 1400 * t) / SR) * np.exp(-((t - 0.35) ** 2) / 0.02) * 0.4 + bp(N(len(t)), 2000, 8000) * np.exp(-((t - 0.35) ** 2) / 0.03) * 0.3
thk = (lp(N(len(t)), 1200) + np.sin(2 * np.pi * np.cumsum(180 + 200 * np.exp(-(t - 0.5).clip(0) * 40)) / SR)) * np.exp(-(t - 0.5).clip(0) * 18) * (t > 0.5)
save("flecha.wav", whi + thk * 0.9)

# água: queda e respingos
t = T(2.0)
spl = lp(N(len(t)), 2500) * np.exp(-t * 3) * np.minimum(1, t / 0.01)
bub = np.zeros_like(t)
for k in range(40):
    s0 = int(rng.uniform(0.05, 1.5) * SR); n = int(0.05 * SR); xx = np.arange(n) / SR; f = rng.uniform(400, 1600)
    if s0 + n < len(t):
        bub[s0:s0 + n] += np.sin(2 * np.pi * np.cumsum(f * (1 + xx * 8)) / SR) * np.exp(-xx * 60) * rng.uniform(0.05, 0.2)
save("agua.wav", spl + bub)

# buzina: carro que vem (Doppler) e um clarão de vento
t = T(1.8)
f = 420 * (1 + 0.06 * np.tanh((0.9 - t) * 4))
horn = (np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + np.sign(np.sin(2 * np.pi * np.cumsum(f * 1.26) / SR)) * 0.4)
env = np.exp(-((t - 0.8) ** 2) / 0.12)
save("buzina.wav", lp(horn, 2500) * env * 0.6 + lp(N(len(t)), 900) * env * 0.4)
print("ok")
