"""Efeitos sonoros sintetizados (determinísticos) do vídeo do Kakashi.
brilho (o olho acendendo), portal (vórtice que suga), dreno (chakra sendo sugado), relogio (tique-taque), pedras (desmoronamento).
Uso: python3 tools/sfx_kakashi.py <pasta_saida>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(31)


def save(name, x, peak=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x)


def lp(x, fc):
    return sosfilt(butter(2, fc / (SR / 2), btype="low", output="sos"), x)


def T(sec):
    return np.arange(int(SR * sec)) / SR


# brilho: zumbido grave que sobe + cintilância
t = T(1.6)
hum = np.sin(2 * np.pi * np.cumsum(90 + 140 * (t / 1.6)) / SR) * np.minimum(1, t / 0.2) * np.exp(-np.maximum(0, t - 0.6) * 3)
sh = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((2600, 4), (3900, 5), (5200, 7))) * np.minimum(1, t / 0.05)
save("brilho.wav", hum * 0.8 + sh * 0.25)

# portal: vórtice girando e sugando (ruído com filtro varrendo + tom que desce)
t = T(2.2)
n = rng.standard_normal(len(t)); sw = np.zeros_like(t)
for a, b in ((0, .4), (.4, .8), (.8, 1.2), (1.2, 1.6), (1.6, 2.2)):
    i, j = int(a * SR), int(b * SR); fc = 3000 - 2200 * ((a + b) / 2 / 2.2)
    sw[i:j] = bp(n[i:j], fc * 0.7, fc * 1.4)
wob = 0.6 + 0.4 * np.sin(2 * np.pi * (6 + 4 * t) * t)
tone = np.sin(2 * np.pi * np.cumsum(420 - 300 * (t / 2.2)) / SR) * 0.3
env = np.minimum(1, t / 0.15) * np.exp(-np.maximum(0, t - 1.4) * 4)
save("portal.wav", (sw * wob + tone) * env)

# dreno: chiado que é sugado (fica mais agudo e some)
t = T(1.8)
x = bp(rng.standard_normal(len(t)), 600, 4000) * np.minimum(1, t / 0.3) * np.exp(-np.maximum(0, t - 1.0) * 5)
save("dreno.wav", x * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) + np.sin(2 * np.pi * np.cumsum(200 + 600 * t / 1.8) / SR) * 0.15 * np.exp(-t * 1.5))

# relógio: quatro tiques
t = T(2.2); x = np.zeros_like(t)
for k in range(4):
    s0 = int(k * 0.5 * SR); m = int(0.04 * SR); xx = np.arange(m) / SR
    x[s0:s0 + m] += np.sin(2 * np.pi * (3200 if k % 2 == 0 else 2600) * xx) * np.exp(-xx * 160)
save("relogio.wav", x, 0.6)

# pedras: desmoronamento grave com cascalho
t = T(2.6)
rum = lp(rng.standard_normal(len(t)), 220) * np.exp(-t * 1.4) * 2.5
deb = np.zeros_like(t)
for i in range(80):
    s0 = int(rng.uniform(0.0, 1.8) * SR); m = int(0.06 * SR); xx = np.arange(m) / SR
    if s0 + m < len(t):
        deb[s0:s0 + m] += bp(rng.standard_normal(m), 800, 5000) * np.exp(-xx * 60) * rng.uniform(0.05, 0.25)
save("pedras.wav", rum + deb)
print("ok")
