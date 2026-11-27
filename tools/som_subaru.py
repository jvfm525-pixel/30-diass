"""Trilha e efeitos do vídeo do Subaru (sintetizados aqui, determinísticos).
Como na referência: tapete contínuo e suave (graves + pads, sem bateria), volume constante, poucos efeitos delicados
nos momentos de luz, cigarras na lembrança de verão, grilos na escola à noite; a trilha quase some na pergunta final.
Uso: python3 tools/som_subaru.py  → subaru/assets/music/trilha-subaru.wav e subaru/assets/sfx/*.wav + lista.json
"""
import json
import os
import shutil
import wave

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
P = os.path.join(ROOT, "subaru")
s = open(os.path.join(P, "assets/timing.js")).read()
T = json.loads(s[s.index("{"):s.rindex("}") + 1])
K, SC, TOTAL = T["k"], T["sc"], T["total"]
SR = 48000
rng = np.random.default_rng(7)


def salvar(path, x):
    x = np.clip(x, -1, 1)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def nota(n):  # midi → Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, a):  # passa-baixa de 1 polo (a pequeno = mais escuro)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y


def env(n, at, rel):
    e = np.ones(n); a = int(at * SR); r = int(rel * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e


# ---------------------------------------------------------------- trilha: acordes por capítulo (lá menor escuro, sem bateria)
N = int(TOTAL * SR)
t = np.arange(N) / SR
mus = np.zeros((N, 2))
# (cena, acorde em midi)
ACORDES = {
    "s0-capa": [38, 45, 50, 53], "s1-abertura": [40, 47, 52, 55, 59], "s2-volta": [41, 48, 53, 57, 60], "s3-mao": [37, 44, 49, 52], "s4-preco": [36, 43, 48, 51],
    "s5-bruxa": [34, 41, 46, 49, 53], "s6-discord": [41, 48, 53, 57], "s7-echidna": [43, 50, 55, 59, 62], "s8-heidegger": [40, 47, 52, 55, 62], "s9-fim": [41, 48, 53, 57, 60, 64],
}
for nome, (a, b) in SC.items():
    i0, i1 = int(max(0, a - 0.6) * SR), min(N, int((b + 0.8) * SR))
    n = i1 - i0
    if n <= 0:
        continue
    tt = np.arange(n) / SR
    e = env(n, 0.9, 1.0)
    pad = np.zeros((n, 2))
    for j, m in enumerate(ACORDES[nome]):
        f = nota(m)
        for d, pan in ((-0.07, 0.3), (0.07, 0.7)):  # duas vozes desafinadas = coro suave
            v = np.sin(2 * np.pi * f * (1 + d / 100) * tt + j) + 0.25 * np.sin(2 * np.pi * 2 * f * tt + j * 2)
            amp = 0.05 if j else 0.075
            pad[:, 0] += v * amp * (1 - pan); pad[:, 1] += v * amp * pan
    trem = 1 + 0.08 * np.sin(2 * np.pi * 0.18 * tt)
    pad *= (e * trem)[:, None]
    mus[i0:i1] += pad
# sub-grave contínuo (lá) e ar (ruído escuro filtrado)
mus += (0.06 * np.sin(2 * np.pi * 55 * t))[:, None]
ar = lp(rng.standard_normal(N) * 0.5, 0.004)
mus += (ar * 0.35)[:, None]
# quase silêncio sob a última frase (fica só o grave segurado)
k = np.clip((t - (K["voltar9"] - 0.6)) / 0.5, 0, 1) * 0.5
mus *= (1 - 0.82 * k)[:, None]
mus[:, :] *= env(N, 0.4, 1.5)[:, None]
mus /= np.max(np.abs(mus)) + 1e-9
mus *= 0.8
os.makedirs(os.path.join(P, "assets/music"), exist_ok=True)
salvar(os.path.join(P, "assets/music/trilha-subaru.wav"), mus)

# ---------------------------------------------------------------- efeitos
SFX = os.path.join(P, "assets/sfx")
os.makedirs(SFX, exist_ok=True)


def brilho(d=1.4, f0=1800):  # cintilância (sinos agudos que decaem)
    n = int(d * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for i in range(7):
        f = f0 * (1 + i * 0.37) * (1 + 0.02 * rng.standard_normal()); st = int(i * 0.05 * SR)
        x[st:] += np.sin(2 * np.pi * f * tt[: n - st]) * np.exp(-tt[: n - st] * 4) * 0.2
    return x * env(n, 0.005, 0.3)


def boom(d=2.2, f=42):  # estouro grave (flash)
    n = int(d * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt * (1 - 0.3 * tt / d)) * np.exp(-tt * 2.2) + lp(rng.standard_normal(n), 0.02) * np.exp(-tt * 3) * 0.6
    return x * env(n, 0.004, 0.4) * 0.9


def sopro(d=1.2):  # vento/sopro (chicote)
    n = int(d * SR); tt = np.arange(n) / SR; x = rng.standard_normal(n)
    a = 0.02 + 0.2 * np.sin(np.pi * tt / d) ** 2
    y = np.empty(n); acc = 0.0
    for i in range(n):
        acc += a[i] * (x[i] - acc); y[i] = acc
    return y * np.sin(np.pi * tt / d) * 1.4


def clique(d=0.9):  # trava metálica da roda
    n = int(d * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for f in (420, 1130, 2210, 3470):
        x += np.sin(2 * np.pi * f * tt) * np.exp(-tt * (9 + f / 600))
    x += rng.standard_normal(n) * np.exp(-tt * 120) * 0.8
    return x * 0.35


def chuva_amb(d):
    n = int(d * SR); x = rng.standard_normal(n); y = x - lp(x, 0.08)
    y = lp(y, 0.5) * 0.35
    gotas = np.zeros(n)
    for _ in range(int(d * 40)):
        p = rng.integers(0, n - 2000); gotas[p:p + 2000] += rng.standard_normal(2000) * np.exp(-np.arange(2000) / 200) * 0.25
    return (y + gotas) * env(n, 0.8, 1.2)


def agua_amb(d):
    n = int(d * SR); x = lp(rng.standard_normal(n), 0.003) * 3.0
    tt = np.arange(n) / SR; x *= 1 + 0.3 * np.sin(2 * np.pi * 0.2 * tt)
    for _ in range(int(d * 3)):
        p = rng.integers(0, n - 6000); f = rng.uniform(300, 700); b = np.arange(6000) / SR
        x[p:p + 6000] += np.sin(2 * np.pi * f * b * (1 + 3 * b)) * np.exp(-b * 25) * 0.15
    return x * env(n, 1.0, 1.0)


def fogo_amb(d):
    n = int(d * SR); x = lp(rng.standard_normal(n), 0.01) * 1.6
    for _ in range(int(d * 25)):
        p = rng.integers(0, n - 400); x[p:p + 400] += rng.standard_normal(400) * np.exp(-np.arange(400) / 60) * 0.5
    return x * env(n, 0.8, 1.0)


def rosnado(d=1.4):
    n = int(d * SR); tt = np.arange(n) / SR
    x = lp(rng.standard_normal(n), 0.05) * (1 + np.sin(2 * np.pi * 28 * tt)) * 1.4
    return x * env(n, 0.15, 0.4)


def tique(d=0.25):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 60) + rng.standard_normal(n) * np.exp(-tt * 300) * 0.3) * 0.4


def cigarra(d):
    n = int(d * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for f0, am, ph in ((4100, 37, 0.0), (4700, 41, 1.3), (3800, 29, 2.1)):
        x += np.sin(2 * np.pi * f0 * tt + 3 * np.sin(2 * np.pi * 90 * tt)) * (0.5 + 0.5 * np.sin(2 * np.pi * am * tt + ph)) ** 3 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * tt + ph))
    return x * env(n, 0.6, 0.8) * 0.3


def grilos(d):
    n = int(d * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for f0, rep, ph in ((4400, 2.6, 0.0), (5200, 3.1, 0.7)):
        pulso = ((tt * rep + ph) % 1) < 0.12; x += np.sin(2 * np.pi * f0 * tt) * pulso * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * tt))
    return lp(x, 0.5) * env(n, 0.6, 0.8) * 0.25


def metro(d):
    n = int(d * SR); tt = np.arange(n) / SR
    return (lp(rng.standard_normal(n), 0.002) * 6 + 0.35 * np.sin(2 * np.pi * 47 * tt) + 0.15 * np.sin(2 * np.pi * 94 * tt)) * env(n, 0.5, 0.8) * 0.5


def zap(d=0.8):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * (300 + 1200 * np.exp(-tt * 5)) * tt) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 17 * tt))) * np.exp(-tt * 3)) * 0.5


fx = {"brilho.wav": brilho(), "brilho-grave.wav": brilho(2.2, 900), "boom.wav": boom(), "sopro.wav": sopro(), "clique.wav": clique(), "tique.wav": tique(), "rosnado.wav": rosnado(2.2), "zap.wav": zap(),
      "rua1.wav": sopro(SC["s1-abertura"][1] - SC["s1-abertura"][0] + 0.6), "rua2.wav": sopro(SC["s2-volta"][1] - SC["s2-volta"][0] + 0.6), "vento9.wav": sopro(SC["s9-fim"][1] - SC["s9-fim"][0] + 0.6),
      "grilos3.wav": grilos(SC["s3-mao"][1] - SC["s3-mao"][0] + 0.4), "grilos4.wav": grilos(SC["s4-preco"][1] - SC["s4-preco"][0] + 0.4), "vazio.wav": metro(SC["s5-bruxa"][1] - SC["s5-bruxa"][0] + 0.4),
      "cigarra7.wav": cigarra(SC["s7-echidna"][1] - SC["s7-echidna"][0] + 0.4), "campo.wav": sopro(SC["s8-heidegger"][1] - SC["s8-heidegger"][0] + 0.6)}
for nome, x in fx.items():
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    salvar(os.path.join(SFX, nome), x)
shutil.copy(os.path.join(ROOT, "assets/sfx/whoosh-cinematic.mp3"), os.path.join(SFX, "whoosh-cinematic.mp3"))
L = []
def at(n, t_, v):
    L.append([n, round(max(0.0, t_), 3), v])
at("boom.wav", 0.68, 0.25); at("rua1.wav", SC["s1-abertura"][0], 0.16); at("boom.wav", K["morrer"] + 0.1, 0.4); at("rosnado.wav", K["morrer"] + 0.1, 0.25); at("brilho.wav", K["acordar"] - 0.1, 0.35)
at("rua2.wav", SC["s2-volta"][0], 0.16); at("brilho-grave.wav", K["morre"] - 0.2, 0.25); at("brilho.wav", K["lembra"] - 0.1, 0.22)
at("grilos3.wav", SC["s3-mao"][0], 0.12); at("zap.wav", K["parou"] - 0.1, 0.3); at("brilho-grave.wav", K["parou"], 0.3); at("rosnado.wav", K["mao"] - 0.3, 0.35); at("boom.wav", K["apertou"], 0.3); at("rosnado.wav", K["volta3"] - 0.2, 0.25)
at("grilos4.wav", SC["s4-preco"][0], 0.1); at("rosnado.wav", K["ouvindo"] - 0.3, 0.35); at("boom.wav", K["morreu"], 0.35); at("brilho.wav", K["emilia4"], 0.3)
at("vazio.wav", SC["s5-bruxa"][0], 0.18); at("brilho-grave.wav", K["satella"] - 0.4, 0.35); at("rosnado.wav", K["inveja"] - 0.2, 0.3); at("rosnado.wav", K["dividir"], 0.25)
at("whoosh-cinematic.mp3", SC["s6-discord"][0] - 0.3, 0.22); at("brilho.wav", K["link"] - 0.1, 0.25)
at("cigarra7.wav", SC["s7-echidna"][0], 0.08); at("brilho.wav", K["echidna"] - 0.2, 0.25); at("brilho-grave.wav", K["sabia"] - 0.3, 0.3)
at("campo.wav", SC["s8-heidegger"][0], 0.14); at("brilho-grave.wav", K["heidegger"], 0.25); at("clique.wav", K["dezenas"], 0.2)
at("vento9.wav", SC["s9-fim"][0], 0.16); at("brilho.wav", K["salvar"], 0.22); at("brilho-grave.wav", K["voltaria"] - 0.3, 0.25); at("clique.wav", K["comenta"], 0.25)
json.dump(L, open(os.path.join(SFX, "lista.json"), "w"))
print("ok trilha", round(TOTAL, 2), "s,", len(L), "efeitos")
