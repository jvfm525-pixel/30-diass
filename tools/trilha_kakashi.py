"""Trilha melancólica de inspiração japonesa (sintetizada, determinística) para o vídeo do Kakashi.
Ré menor, 66 bpm. Koto em arpejo, flauta tipo shakuhachi, cordas graves; taiko e ostinato na parte de ação;
calmaria (só koto) na pausa das keys; final triste com a flauta sozinha.
Uso: python3 tools/trilha_kakashi.py <saida.wav> <duracao_s> <calma_de> <calma_ate> <acao_de> <triste_de>
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
out, dur = sys.argv[1], float(sys.argv[2])
calm_a, calm_b, acao, sad = (float(v) for v in sys.argv[3:7])
N = int(SR * dur)
mix = np.zeros(N)
rng = np.random.default_rng(57)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
B = 60 / 66
CH = [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]]  # Dm Bb Gm A
# melodia da flauta (escala In em Ré: D Eb G A Bb), (nota, tempos) por compasso de 4 tempos
MEL = [[(69, 1.5), (70, 0.5), (69, 1), (67, 1)], [(65, 2), (62, 2)], [(67, 1), (69, 1), (70, 1.5), (72, 0.5)], [(69, 3), (0, 1)],
       [(74, 1.5), (72, 0.5), (70, 1), (69, 1)], [(67, 2), (65, 1), (63, 1)], [(62, 1), (63, 1), (67, 1), (69, 1)], [(62, 3), (0, 1)]]


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


def koto(m, vol, secs=1.6):
    n = int(secs * SR); x = np.arange(n) / SR; f = hz(m) * (1 + 0.012 * np.exp(-x * 30))
    ph = np.cumsum(f) / SR
    s = sum(np.sin(2 * np.pi * ph * k) * a * np.exp(-x * (2.5 + k * 1.8)) for k, a in ((1, 1.0), (2, 0.55), (3, 0.3), (4.1, 0.12)))
    return s * np.minimum(1, x / 0.002) * vol


def flute(m, secs, vol):
    n = int(secs * SR); x = np.arange(n) / SR
    bend = -0.5 * np.exp(-x * 9)  # entrada "meri" (de baixo pra cima)
    vib = 0.18 * np.sin(2 * np.pi * 5.2 * x) * np.minimum(1, x / 0.6)
    f = hz(m + bend + vib * 0.1)
    ph = np.cumsum(f) / SR
    tone = np.sin(2 * np.pi * ph) + 0.28 * np.sin(4 * np.pi * ph) + 0.08 * np.sin(6 * np.pi * ph)
    breath = bp(rng.standard_normal(n), hz(m) * 2, hz(m) * 5) * 0.18
    env = np.minimum(1, x / 0.18) * np.minimum(1, (secs - x) / 0.25) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.7 * x))
    return (tone + breath) * env * vol


def taiko(vol, f0=70):
    n = int(1.3 * SR); x = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(f0 * 0.6 + f0 * 0.8 * np.exp(-x * 22)) / SR) * np.exp(-x * 4.5) + lp(rng.standard_normal(n), 600) * np.exp(-x * 30) * 0.4) * vol


bar, tt = 0, 0.0
while tt < dur:
    calm, act, sd = calm_a <= tt < calm_b, acao <= tt < sad, tt >= sad
    ch = CH[bar % 4]
    L = 4 * B
    n = int(L * SR); x = np.arange(n) / SR
    env = np.minimum(1, x / 0.8) * np.minimum(1, (L - x) / 0.6)
    # cordas graves
    pad = sum(saw(hz(m - 12) * d, x, i * 0.2) for i, m in enumerate(ch) for d in (0.996, 1.004)) / 6
    put(tt, lp(pad, 900 if act else 650) * env * (0.04 if calm else 0.1 if not sd else 0.08))
    put(tt, lp(saw(hz(ch[0] - 24), x), 160) * env * (0.05 if calm else 0.12))
    # koto em arpejo (colcheias)
    pat = [ch[0], ch[1], ch[2], ch[0] + 12, ch[2], ch[1], ch[2], ch[0] + 12]
    for k, m in enumerate(pat):
        if sd and k % 2:
            continue
        put(tt + k * B / 2, koto(m + 12, 0.05 if calm else 0.07))
    # flauta
    if not calm:
        ph = tt
        for m, beats in MEL[bar % 8]:
            if m:
                put(ph, flute(m, beats * B * 0.98, 0.06 if not sd else 0.075))
            ph += beats * B
    # ação: taiko e ostinato
    if act:
        for k, v in ((0, 0.45), (1.5, 0.25), (2, 0.35), (3, 0.3), (3.5, 0.2)):
            put(tt + k * B, taiko(v))
        for k in range(8):
            m = (ch[0], ch[0] + 7, ch[0] + 12, ch[0] + 7)[k % 4]
            nn = int(B / 2 * SR * 0.85); xx = np.arange(nn) / SR
            put(tt + k * B / 2, lp(saw(hz(m), xx), 1300) * np.exp(-xx * 6) * 0.045)
    elif not calm and not sd and bar % 2 == 0:
        put(tt, taiko(0.22))
    tt += L
    bar += 1
# batida forte na entrada da ação
put(acao - 0.05, taiko(0.8, 58))
ir_n = int(2.6 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 2.2); ir[0] = 1.0
mix = mix * 0.78 + fftconvolve(mix, ir)[:N] * 0.07
t = np.arange(N) / SR
mix *= np.minimum(1, np.minimum(t / 1.5, (dur - t) / 3.5))
mix /= np.max(np.abs(mix)) * 1.1
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("ok")
