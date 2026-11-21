"""Trilha sintetizada (determinística) do vídeo do Kira: a canção de ninar da vida tranquila que vai ficando sinistra.
Dó maior em 3/4, 72 bpm. Caixinha de música (canção de ninar original) com cordas suaves; nos potes a caixinha desafina
e entra um pulso grave; vidro no espelho; celesta escolar no 3º lugar; pizzicato leve nas keys; relógio tenso no disfarce;
koto e flauta no jardim (o objetivo), com um zumbido escuro quando entram os assassinatos; a canção de ninar tocada ao
contrário quando o tempo volta; coro de fantasmas e a caixinha perdendo corda no beco; acorde final calmo na pergunta.
Os tempos das seções vêm de kira/assets/timing.js.
Uso: python3 tools/trilha_kira.py <saida.wav>
"""
import json
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kira")
s = open(os.path.join(ROOT, "assets/timing.js")).read()
D = json.loads(s[s.index("=") + 1:].strip().rstrip(";"))
SC = {n: (a, b) for n, a, b in D["scenes"]}
K = D["k"]
TOTAL = D["total"]

SR = 44100
out = sys.argv[1]
N = int(SR * TOTAL)
mix = np.zeros(N)
rng = np.random.default_rng(97)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
BPM = 72
BEAT = 60 / BPM
BAR = 3 * BEAT
# canção de ninar original (Dó maior), notas por tempo: (midi, duração em tempos)
LULL = [(76, 1), (79, 1), (84, 1), (83, 2), (79, 1), (76, 1), (74, 1), (76, 1), (79, 3),
        (81, 1), (79, 1), (76, 1), (77, 2), (74, 1), (72, 1), (74, 1), (76, 1), (72, 3)]
CH = [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]]   # C G Am F


def lp(x, fc):
    return sosfilt(butter(2, min(fc, SR / 2 - 100) / (SR / 2), btype="low", output="sos"), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x)


def put(st, sig, buf=None):
    b = mix if buf is None else buf
    s0 = int(st * SR)
    if s0 >= len(b) or s0 < 0:
        return
    n = min(len(sig), len(b) - s0)
    b[s0:s0 + n] += sig[:n]


def caixa(m, vol, det=0.0, dec=1.7):
    """nota de caixinha de música (parciais inarmônicas, ataque metálico)"""
    n = int(2.4 * SR); x = np.arange(n) / SR; f = hz(m) * (1 + det)
    sig = np.sin(2 * np.pi * f * x) * np.exp(-x * dec) + 0.28 * np.sin(2 * np.pi * f * 3.0 * x) * np.exp(-x * dec * 2.2) + 0.1 * np.sin(2 * np.pi * f * 5.9 * x) * np.exp(-x * dec * 3.5)
    return sig * np.minimum(1, x / 0.002) * vol


def pad(notes, st, dur, vol, fc=1800, att=1.2, rel=1.5):
    n = int((dur + rel) * SR); x = np.arange(n) / SR; sig = np.zeros(n)
    for m in notes:
        for d in (-0.004, 0.0, 0.005):
            sig += 2 * ((hz(m) * (1 + d) * x + rng.random()) % 1) - 1
    sig = lp(sig, fc) / (len(notes) * 3)
    e = np.minimum(1, x / att) * np.where(x < dur, 1, np.maximum(0, 1 - (x - dur) / rel))
    put(st, sig * e * vol)


def koto(m, vol, dur=2.0):
    """corda dedilhada (Karplus-Strong)"""
    f = hz(m); L = int(SR / f); n = int(dur * SR)
    buf = rng.uniform(-1, 1, L); y = np.zeros(n)
    for i in range(n):
        y[i] = buf[i % L]; buf[i % L] = 0.5 * (buf[i % L] + buf[(i + 1) % L]) * 0.996
    return lp(y, 5000) * vol


def flauta(m, secs, vol, bend=0.0):
    n = int(secs * SR); x = np.arange(n) / SR
    f = hz(m) * (1 + 0.007 * np.sin(2 * np.pi * 4.8 * x) * np.minimum(1, x / 0.4)) * (1 + bend * np.exp(-x * 6))
    ph = np.cumsum(f) / SR
    sig = np.sin(2 * np.pi * ph) + 0.1 * np.sin(4 * np.pi * ph) + bp(rng.standard_normal(n), 900, 4000) * 0.08
    return sig * np.minimum(1, x / 0.15) * np.minimum(1, (secs - x) / 0.3) * vol


def celesta(m, vol):
    n = int(1.8 * SR); x = np.arange(n) / SR; f = hz(m)
    sig = (np.sin(2 * np.pi * f * x) + 0.5 * np.sin(4 * np.pi * f * x) * np.exp(-x * 6)) * np.exp(-x * 2.8)
    return sig * np.minimum(1, x / 0.003) * vol


def pizz(m, vol):
    return koto(m, vol, 0.6) * np.exp(-np.arange(int(0.6 * SR)) / SR * 6)


def tum(st, vol, f0=52):
    n = int(0.5 * SR); x = np.arange(n) / SR
    put(st, np.sin(2 * np.pi * np.cumsum(f0 + 60 * np.exp(-x * 30)) / SR) * np.exp(-x * 9) * vol)


def tic(st, vol, f=2200):
    n = int(0.05 * SR); x = np.arange(n) / SR
    put(st, np.sin(2 * np.pi * f * x) * np.exp(-x * 120) * vol)


def drone(m, st, dur, vol, fc=400):
    n = int(dur * SR); x = np.arange(n) / SR
    sig = np.sin(2 * np.pi * hz(m) * x) + 0.6 * np.sin(2 * np.pi * hz(m) * 1.005 * x) + 0.3 * lp(rng.standard_normal(n), fc)
    put(st, sig * np.minimum(1, x / 1.5) * np.minimum(1, (dur - x) / 1.5) * vol)


def coro(notes, st, dur, vol):
    """coro de fantasmas: dente de serra com formantes de 'ah' e vibrato lento"""
    n = int(dur * SR); x = np.arange(n) / SR; sig = np.zeros(n)
    for i, m in enumerate(notes):
        f = hz(m) * (1 + 0.006 * np.sin(2 * np.pi * (4.2 + i * 0.3) * x + i))
        saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
        sig += bp(saw, 600, 900) + 0.6 * bp(saw, 1050, 1350) + 0.3 * bp(saw, 2400, 2800)
    put(st, sig / len(notes) * np.minimum(1, x / 1.5) * np.minimum(1, (dur - x) / 1.8) * vol)


def ninar(t0, t1, vol, det=lambda t: 0.0, tempo=1.0, stop=None):
    """toca a canção de ninar em loop de t0 a t1 (det(t) = desafinação; stop = instante em que a caixinha perde corda)"""
    t = t0; i = 0
    while t < t1:
        m, d = LULL[i % len(LULL)]
        sp = tempo
        if stop is not None and t > stop - 3:
            sp = tempo * max(0.25, 1 - (t - (stop - 3)) / 3.2)
        if stop is not None and t > stop:
            break
        put(t, caixa(m, vol, det(t)))
        t += d * BEAT / sp; i += 1


S = SC
# 1 · rua à noite: canção de ninar sozinha, grave longo por baixo
a, b = S["s1-rua"]; ninar(a + 0.3, b, 0.22); drone(36, a, b - a + 1, 0.05)
# 2 · rotina: caixinha + cordas suaves (o lar)
a, b = S["s2-rotina"]; ninar(a, b, 0.2)
for k in range(int((b - a) / BAR) + 1):
    pad(CH[k % 4], a + k * BAR, BAR, 0.05, 1400, 0.4, 0.8)
# 3 · os potes: caixinha desafina, pulso grave de coração
a, b = S["s3-potes"]; ninar(a, b, 0.17, det=lambda t: 0.012 * np.sin(t * 3.1) + 0.02 * max(0, (t - K["assassino2"]) / 8))
drone(31, a, b - a + 0.8, 0.09, 250); pad([44, 47, 50], a + 1, b - a, 0.05, 700, 2.0, 1.0)
tt = K["assassino2"]
while tt < b:
    tum(tt, 0.32); tum(tt + 0.24, 0.22); tt += 1.05
# 4 · culpa: vidro (harmônicos agudos) e acorde suspenso
a, b = S["s4-culpa"]
for i, m in enumerate([88, 91, 95, 93]):
    put(a + 0.2 + i * 0.9, caixa(m, 0.07, 0, 0.9))
pad([50, 55, 57], a, b - a, 0.06, 1200, 1.0, 1.0)
# 5 · 3º lugar: celesta escolar em valsa (agridoce)
a, b = S["s5-terceiro"]; mel = [72, 76, 79, 77, 74, 72, 71, 72, 74, 76, 74, 72]
for k, m in enumerate(mel * 3):
    t = a + 0.2 + k * BEAT * 0.75
    if t > b - 0.3:
        break
    put(t, celesta(m, 0.16))
for k in range(int((b - a) / BAR) + 1):
    pad(CH[(k + 2) % 4], a + k * BAR, BAR, 0.045, 1600, 0.3, 0.6)
# 6 · keys: pizzicato leve e brilhante
a, b = S["s6-keys"]
for k in range(int((b - a) / (BEAT / 2))):
    put(a + k * BEAT / 2, pizz([60, 64, 67, 72, 67, 64][k % 6], 0.22))
pad([48, 52, 55, 59], a, b - a, 0.05, 2000, 0.4, 0.8)
# 7 · disfarce: relógio rápido e cordas tensas
a, b = S["s7-disfarce"]
t = a
while t < b:
    tic(t, 0.18, 2600); t += 0.25
pad([49, 52, 55], a, b - a, 0.08, 1500, 0.3, 0.6); drone(37, a, b - a + 0.6, 0.08)
# 8 · o objetivo: koto pentatônico e flauta serena; nos assassinatos, zumbido escuro e caixinha desafinada
a, b = S["s8-objetivo"]; pent = [64, 67, 69, 71, 74, 76, 79]
t = a + 0.1; k = 0
while t < b:
    put(t, koto(pent[(k * 3) % len(pent)] - (12 if k % 4 == 0 else 0), 0.2)); t += BEAT * (1.5 if k % 3 == 2 else 0.75); k += 1
put(K["objetivo"] - 0.2, flauta(76, 2.6, 0.12, 0.02)); put(K["vitorias"] - 0.1, flauta(79, 1.8, 0.1, 0.03)); put(K["isso"] - 0.2, flauta(81, 2.2, 0.1, 0.02))
pad([45, 52, 57, 59], a, K["assassinatos"] - a, 0.05, 1800, 1.5, 1.0)
drone(29, K["assassinatos"] - 0.4, b - K["assassinatos"] + 1.2, 0.14, 300)
ninar(K["assassinatos"], b, 0.12, det=lambda t: -0.035)
# 9 · o rosto roubado: canção de ninar tocada ao contrário quando o tempo volta
a, b = S["s9-rosto"]; pad([41, 45, 48, 52], a, b - a, 0.05, 1300, 1.0, 1.0)
ninar(a, K["continuar"] - 0.2, 0.15, det=lambda t: 0.006 * np.sin(t * 2))
rv = np.zeros(int(3.2 * SR)); tt = 0.0; i = 0
while tt < 3.0:
    m, d = LULL[i % len(LULL)]; put(tt, caixa(m, 0.18), rv); tt += d * BEAT * 0.55; i += 1
put(K["continuar"] - 0.25, rv[::-1][: int((b - K["continuar"] + 0.3) * SR)])
# 10 · o beco: coro de fantasmas, grave, caixinha perdendo corda; pergunta: acorde final calmo
a, b = S["s10-beco"]; vz = K["voce"]
coro([57, 60, 64], a, vz - a + 0.5, 0.06); drone(28, a, vz - a + 1.0, 0.13, 220)
ninar(a, vz, 0.15, det=lambda t: -0.02 - 0.03 * max(0, (t - K["alma"]) / 3), stop=K["paz9b"] + 0.4)
pad([48, 55, 64, 67], vz - 0.2, b - vz, 0.07, 1600, 1.8, 2.0); pad([36, 43], vz - 0.2, b - vz, 0.05, 600, 1.8, 2.0)
for i, m in enumerate([72, 76, 79, 84]):
    put(vz + 0.4 + i * BEAT, caixa(m, 0.16, 0, 1.2))
put(b - 2.6, caixa(84, 0.12, 0, 0.8))

# reverberação (sala grande), normalização e fades
ir_n = int(2.6 * SR); xir = np.arange(ir_n) / SR
ir = rng.standard_normal(ir_n) * np.exp(-xir * 2.6); ir[0] = 1.0
wet = fftconvolve(mix, lp(ir, 5000))[:N] * 0.08
y = mix * 0.85 + wet
y = y / (np.max(np.abs(y)) + 1e-9) * 0.9
fade = int(1.5 * SR); y[-fade:] *= np.linspace(1, 0, fade); y[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
wavfile.write(out, SR, (np.stack([y, y], 1) * 32767).astype(np.int16))
print("ok", out, round(TOTAL, 2))
