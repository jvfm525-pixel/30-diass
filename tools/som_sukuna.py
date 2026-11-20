"""Trilha e efeitos do vídeo do Sukuna (sintetizados aqui, determinísticos).
Como na referência: tapete contínuo e suave (graves + pads, sem bateria), volume constante, poucos efeitos delicados
nos momentos de luz, e a trilha quase some na última frase ("o Megumi foi a chave").
Uso: python3 tools/som_sukuna.py  → sukuna/assets/music/trilha-sukuna.wav e sukuna/assets/sfx/*.wav + lista.json
"""
import json
import os
import shutil
import wave

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
P = os.path.join(ROOT, "sukuna")
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
    "s0-capa": [45, 52, 57, 60], "s1-abertura": [45, 52, 57, 60], "s2-olhar": [41, 48, 53, 57], "s3-jaula": [43, 50, 55, 58],
    "s4-sombras": [40, 47, 52, 55], "s5-keys": [41, 48, 57, 60], "s6-pacto": [38, 45, 50, 53], "s7-banho": [41, 48, 53, 56],
    "s8-manual": [43, 50, 55, 59], "s9-chave": [45, 52, 57, 64],
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
mus += (0.07 * np.sin(2 * np.pi * 55 * t))[:, None]
ar = lp(rng.standard_normal(N) * 0.5, 0.004)
mus += (ar * 0.35)[:, None]
# quase silêncio sob a última frase (fica só o grave segurado)
k = np.clip((t - (K["megumi9"] - 0.6)) / 0.5, 0, 1)
mus *= (1 - 0.82 * k)[:, None]
mus[:, :] *= env(N, 0.4, 1.5)[:, None]
mus /= np.max(np.abs(mus)) + 1e-9
mus *= 0.8
os.makedirs(os.path.join(P, "assets/music"), exist_ok=True)
salvar(os.path.join(P, "assets/music/trilha-sukuna.wav"), mus)

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


fx = {"brilho.wav": brilho(), "brilho-grave.wav": brilho(2.2, 900), "boom.wav": boom(), "sopro.wav": sopro(), "clique.wav": clique(),
      "rosnado.wav": rosnado(), "tique.wav": tique(),
      "chuva.wav": chuva_amb(SC["s2-olhar"][1] - SC["s2-olhar"][0] + 0.6), "agua.wav": agua_amb(SC["s7-banho"][1] - SC["s7-banho"][0] + 0.6),
      "fogo.wav": fogo_amb(SC["s8-manual"][1] - SC["s8-manual"][0] + 0.6)}
for nome, x in fx.items():
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    salvar(os.path.join(SFX, nome), x)
shutil.copy(os.path.join(ROOT, "assets/sfx/whoosh-cinematic.mp3"), os.path.join(SFX, "whoosh-cinematic.mp3"))

L = []
def at(n, t_, v):
    L.append([n, round(max(0.0, t_), 3), v])


at("boom.wav", 0.68, 0.35); at("brilho.wav", 0.7, 0.22)
at("brilho-grave.wav", K["abandonou"] - 0.1, 0.22); at("brilho.wav", K["megumi1"] - 0.1, 0.25)
at("sopro.wav", SC["s2-olhar"][0] - 0.35, 0.25); at("chuva.wav", SC["s2-olhar"][0] - 0.3, 0.3)
at("rosnado.wav", K["megumi2"] + 0.3, 0.3)
at("brilho-grave.wav", SC["s3-jaula"][0] - 0.3, 0.25); at("brilho.wav", K["casa"] - 0.3, 0.22); at("boom.wav", K["jaula"] - 0.05, 0.3)
at("sopro.wav", SC["s4-sombras"][0] - 0.3, 0.2); at("brilho-grave.wav", K["dez"] - 0.1, 0.25); at("rosnado.wav", K["sombras"] + 0.3, 0.25)
at("boom.wav", K["mahoraga1"] - 0.25, 0.3); at("clique.wav", K["adapta"], 0.35); at("clique.wav", K["ataque"], 0.35)
at("whoosh-cinematic.mp3", SC["s5-keys"][0] - 0.3, 0.25); at("brilho.wav", K["discord"] - 0.1, 0.3); at("brilho.wav", K["itens"] - 0.3, 0.22)
at("whoosh-cinematic.mp3", SC["s6-pacto"][0] - 0.3, 0.25)
for i in range(6):
    at("tique.wav", K["minuto"] + i * 0.18, 0.18)
at("boom.wav", K["arrancado"] - 0.05, 0.3); at("brilho-grave.wav", K["cortou"], 0.2); at("boom.wav", K["trocou"] - 0.03, 0.38)
at("agua.wav", SC["s7-banho"][0] - 0.2, 0.32); at("brilho.wav", K["tsumiki"] - 0.6, 0.25); at("brilho-grave.wav", K["usando"], 0.25)
at("fogo.wav", SC["s8-manual"][0] - 0.2, 0.25)
for kk in ("mahoraga2", "adaptar", "aprendeu"):
    at("clique.wav", K[kk] + 0.15, 0.35)
at("sopro.wav", K["cortar"] - 0.25, 0.3); at("boom.wav", K["gojo"] - 0.02, 0.4)
at("boom.wav", SC["s9-chave"][0] - 0.02, 0.25); at("brilho.wav", K["chave"] + 0.1, 0.3); at("clique.wav", K["chave"] + 0.3, 0.3)
json.dump(L, open(os.path.join(SFX, "lista.json"), "w"))
print("ok trilha", round(TOTAL, 2), "s,", len(L), "efeitos")
