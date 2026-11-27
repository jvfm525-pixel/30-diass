"""Efeitos sonoros sintetizados (determinísticos) do vídeo do Kira.
chave (molho de chaves), porta (dobradiça), cama (molas e lençol), leite (gole), caixinha (nota de caixinha de música),
zumbido (zumbido grave do quarto escuro), potes (vidro encostando na madeira), lapis (caneta riscando o papel),
gota (pingo na pia), risco (traço de caneta vermelha), eco (ar de ginásio), medalha (tilintar de metal),
violino (nota curta de violino), fonte (água correndo), sino (sino de templo), cha (chá servido), sirene (sirene ao longe),
porcelana (máscara de porcelana), talheres (louça na mesa), sussurros (vozes de fantasma), arrasto (corpo arrastado).
Uso: python3 tools/sfx_kira.py <pasta_saida>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(41)


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


def env(t, a, d):
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * d)


def ping(f, dur, d, partials=((1, 1), (2.76, 0.4), (5.4, 0.2))):
    t = T(dur)
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d * (1 + r * 0.3)) for r, a in partials) * np.minimum(1, t / 0.002)


def place(total, items):
    out = np.zeros(int(SR * total))
    for st, sig in items:
        s0 = int(st * SR); n = min(len(sig), len(out) - s0)
        if n > 0:
            out[s0:s0 + n] += sig[:n]
    return out


# molho de chaves: vários tilintares metálicos curtos
save("chave.wav", place(0.9, [(0.02 + i * 0.045 + rng.random() * 0.03, ping(2400 + rng.random() * 2600, 0.35, 18, ((1, 1), (2.4, 0.5), (3.9, 0.3))) * (0.5 + rng.random() * 0.5)) for i in range(11)]), 0.7)
# porta: rangido da dobradiça (frequência que sobe e desce) + batida suave
t = T(1.1); f = 380 + 240 * np.sin(np.pi * t / 1.1) + 30 * np.sin(2 * np.pi * 13 * t)
cr = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3 + np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * 0.3
save("porta.wav", bp(cr, 300, 2200) * np.sin(np.pi * t / 1.1) ** 0.6 * 0.8 + place(1.1, [(0.95, lp(N(4000), 300) * np.exp(-T(4000 / SR) * 30))]), 0.6)
# cama: molas rangendo + lençol (ruído filtrado)
t = T(1.2)
save("cama.wav", bp(N(len(t)), 300, 2500) * env(t, 0.25, 2.5) * 0.4 + place(1.2, [(0.05 + i * 0.13, ping(620 + i * 40, 0.3, 14) * 0.25) for i in range(5)]), 0.6)
# leite: gole (dois "glups" graves com ruído de líquido)
glub = lambda f0: np.sin(2 * np.pi * np.cumsum(f0 + 260 * np.exp(-T(0.16) * 30)) / SR) * env(T(0.16), 0.005, 22)
save("leite.wav", place(1.2, [(0.1, bp(N(int(0.5 * SR)), 600, 3000) * env(T(0.5), 0.05, 6) * 0.15), (0.45, glub(140)), (0.78, glub(120))]), 0.7)
# caixinha de música: uma nota limpa com brilho
save("caixinha.wav", ping(1318.5, 2.2, 2.2, ((1, 1), (3.0, 0.25), (5.9, 0.1))) + 0.4 * ping(1975.5, 2.2, 2.6), 0.6)
# zumbido grave (quarto escuro)
t = T(6.0)
save("zumbido.wav", (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 110.4 * t) + 0.25 * lp(N(len(t)), 200)) * np.minimum(1, t / 1.2) * np.minimum(1, (6 - t) / 1.2), 0.5)
# potes: vidro encostando na madeira (tuc + tilintar)
save("potes.wav", place(0.9, [(0.0, lp(N(3000), 900) * np.exp(-T(3000 / SR) * 60) * 0.8), (0.01, ping(1850, 0.8, 7) * 0.6), (0.02, ping(2930, 0.6, 9) * 0.3)]), 0.7)
# lápis/caneta riscando o papel
t = T(2.0); mod = (0.5 + 0.5 * np.sin(2 * np.pi * 6.5 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * t))
save("lapis.wav", hp(bp(N(len(t)), 2500, 9000), 2000) * mod * np.minimum(1, t / 0.1) * np.minimum(1, (2 - t) / 0.2), 0.5)
# gota d'água na pia
t = T(0.6); fd = 900 + 1500 * np.exp(-t * 40)
save("gota.wav", np.sin(2 * np.pi * np.cumsum(fd) / SR) * env(t, 0.002, 18), 0.6)
# risco: traço rápido de caneta grossa (vermelho)
t = T(0.45)
save("risco.wav", bp(N(len(t)), 1200, 7000) * np.sin(np.pi * np.minimum(1, t / 0.32)) ** 1.5 * (t < 0.32), 0.7)
# eco: ar de ginásio vazio (ruído grave com reverberação longa)
t = T(5.0); rv = lp(N(len(t)), 500) * 0.4 + bp(N(len(t)), 200, 1200) * 0.1
save("eco.wav", rv * np.minimum(1, t / 1.0) * np.minimum(1, (5 - t) / 1.0), 0.35)
# medalha: tilintar metálico
save("medalha.wav", ping(2650, 1.4, 4, ((1, 1), (2.32, 0.6), (4.1, 0.3))) + 0.5 * place(1.4, [(0.06, ping(3120, 1.2, 5))]), 0.6)
# violino: nota curta com arco (dente de serra com vibrato)
t = T(1.4); fv = 659.25 * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.3))
ph = np.cumsum(fv) / SR; sawv = 2 * (ph % 1) - 1
save("violino.wav", bp(sawv, 400, 5000) * np.minimum(1, t / 0.08) * np.minimum(1, (1.4 - t) / 0.4) + bp(N(len(t)), 2000, 6000) * 0.04 * np.minimum(1, t / 0.08), 0.5)
# fonte: água correndo (bambu-fonte)
t = T(6.0)
save("fonte.wav", bp(N(len(t)), 800, 6000) * (0.6 + 0.4 * lp(np.abs(N(len(t))), 8)) * np.minimum(1, t / 0.8) * np.minimum(1, (6 - t) / 0.8), 0.35)
# sino de templo (grave, longo)
save("sino.wav", ping(220, 5.0, 0.7, ((1, 1), (2.0, 0.5), (2.76, 0.4), (5.4, 0.2), (8.9, 0.1))) * (1 + 0.15 * np.sin(2 * np.pi * 2.2 * T(5.0))), 0.6)
# chá: líquido servido na xícara
t = T(1.6)
save("cha.wav", bp(N(len(t)), 900, 4000) * np.sin(np.pi * np.minimum(1, t / 1.4)) * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * t)), 0.4)
# sirene ao longe (passa e some)
t = T(3.0); fs = 720 + 260 * np.sin(2 * np.pi * 0.9 * t)
save("sirene.wav", lp(np.sin(2 * np.pi * np.cumsum(fs) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(fs) / SR), 2500) * np.sin(np.pi * t / 3.0) ** 1.5, 0.45)
# porcelana: toque de máscara (tilintar agudo e seco)
save("porcelana.wav", ping(3300, 0.7, 12, ((1, 1), (1.6, 0.5), (2.9, 0.3))) + place(0.7, [(0.0, hp(N(2000), 3000) * np.exp(-T(2000 / SR) * 80) * 0.5)]), 0.6)
# louça e talheres (jantar em família, abafado atrás do papel)
save("talheres.wav", lp(place(1.5, [(0.05 + i * 0.22 + rng.random() * 0.06, ping(1600 + rng.random() * 1500, 0.4, 14) * (0.4 + rng.random() * 0.4)) for i in range(6)]), 3000), 0.5)
# sussurros: vozes de fantasma (ruído com formantes que se mexem)
t = T(4.0); x = np.zeros(len(t))
for fl, fh, sp in ((500, 900, 0.7), (1100, 1700, 1.1), (2300, 3000, 0.5)):
    x += bp(N(len(t)), fl, fh) * (0.5 + 0.5 * np.sin(2 * np.pi * sp * t + rng.random() * 6)) ** 2
save("sussurros.wav", x * np.minimum(1, t / 0.8) * np.minimum(1, (4 - t) / 1.0), 0.5)
# arrasto: corpo sendo puxado (raspar grave que acelera) + rajada
t = T(3.0)
save("arrasto.wav", lp(N(len(t)), 600) * (0.4 + 0.6 * np.minimum(1, t / 1.5)) * np.minimum(1, (3 - t) / 0.6) + bp(N(len(t)), 300, 3000) * np.minimum(1, t / 2.5) * 0.3 * np.minimum(1, (3 - t) / 0.6), 0.7)
print("ok")
