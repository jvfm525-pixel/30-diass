"""Trilha e efeitos do vídeo do Gyro (sintetizados aqui, determinísticos).
Como na referência: tapete contínuo e suave (graves + pads, sem bateria), volume constante, poucos efeitos delicados
nos momentos de luz, cigarras na lembrança de verão, grilos na escola à noite; a trilha quase some na pergunta final.
Uso: python3 tools/som_gyro.py  → gyro/assets/music/trilha-gyro.wav e gyro/assets/sfx/*.wav + lista.json
"""
import json
import os
import shutil
import wave

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
P = os.path.join(ROOT, "gyro")
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
ACORDES = {  # infância em ré menor escuro; NGL e laboratório tensos; o Gon em fá maior claro; o fim em aberto
    "s0-capa": [38, 45, 50, 53], "g1-abertura": [38, 45, 50, 53, 57], "g2-obra": [41, 48, 53, 56], "g2b-medo": [36, 43, 48, 51], "g3-febre": [41, 48, 53, 57, 60], "g4-verdade": [37, 44, 49, 52],
    "g5-noite": [34, 41, 46, 49], "g6-discord": [41, 48, 53, 57], "g7-ngl": [43, 50, 55, 59], "g7b-lab": [37, 44, 49, 52, 56], "g7c-fachada": [43, 50, 55, 59], "g8-formigas": [33, 40, 45, 48],
    "g9a-gon": [41, 48, 53, 57, 60, 64], "g9b-gyro": [36, 43, 48, 51], "g9c-amar": [41, 48, 53, 57, 64], "g9d-vingar": [34, 41, 46, 49], "g10-fim": [38, 45, 50, 53, 57],
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
k = np.clip((t - (K["ultimo10"] - 0.6)) / 0.5, 0, 1) * 0.5
mus *= (1 - 0.82 * k)[:, None]
mus[:, :] *= env(N, 0.4, 1.5)[:, None]
mus /= np.max(np.abs(mus)) + 1e-9
mus *= 0.8
os.makedirs(os.path.join(P, "assets/music"), exist_ok=True)
salvar(os.path.join(P, "assets/music/trilha-gyro.wav"), mus)

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


def bater(d=0.35, f=180):  # tijolo/porta: batida seca de madeira e barro
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) * np.exp(-tt * 30) + lp(rng.standard_normal(n), 0.15) * np.exp(-tt * 45) * 0.8) * 0.6


def vidro(d=1.4):  # garrafa rolando no chão de tábua
    n = int(d * SR); tt = np.arange(n) / SR; x = lp(rng.standard_normal(n), 0.05) * 0.4 * (1 + np.sin(2 * np.pi * 7 * tt))
    for i in range(6):
        p = int((0.08 + i * 0.2) * SR)
        if p < n - 4000:
            b = np.arange(4000) / SR; x[p:p + 4000] += np.sin(2 * np.pi * 2600 * b) * np.exp(-b * 50) * 0.5
    return x * env(n, 0.01, 0.4)


fx = {"brilho.wav": brilho(), "brilho-grave.wav": brilho(2.2, 900), "boom.wav": boom(), "sopro.wav": sopro(), "clique.wav": clique(), "tique.wav": tique(), "rosnado.wav": rosnado(2.2), "zap.wav": zap(),
      "bater.wav": bater(), "porta.wav": bater(0.6, 90), "vidro.wav": vidro(), "betoneira.wav": metro(2.4),
      "noite1.wav": grilos(SC["g1-abertura"][1] - SC["g1-abertura"][0] + 0.6), "obra.wav": sopro(SC["g2-obra"][1] - SC["g2-obra"][0] + 0.6), "grilos2b.wav": grilos(SC["g2b-medo"][1] - SC["g2b-medo"][0] + 0.6), "grilos3.wav": grilos(SC["g3-febre"][1] - SC["g3-febre"][0] + 0.6), "obra4.wav": sopro(SC["g4-verdade"][1] - SC["g4-verdade"][0] + 0.6),
      "noite5.wav": grilos(SC["g5-noite"][1] - SC["g5-noite"][0] + 0.6), "vila.wav": cigarra(SC["g7-ngl"][1] - SC["g7-ngl"][0] + 0.6), "lab.wav": metro(SC["g7b-lab"][1] - SC["g7b-lab"][0] + 0.6), "fogo8.wav": fogo_amb(SC["g8-formigas"][1] - SC["g8-formigas"][0] + 0.6), "mar.wav": agua_amb(SC["g9a-gon"][1] - SC["g9a-gon"][0] + 0.6),
      "vento10.wav": sopro(SC["g10-fim"][1] - SC["g10-fim"][0] + 0.6)}
for nome, x in fx.items():
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    salvar(os.path.join(SFX, nome), x)
shutil.copy(os.path.join(ROOT, "assets/sfx/whoosh-cinematic.mp3"), os.path.join(SFX, "whoosh-cinematic.mp3"))
L = []
def at(n, t_, v):
    L.append([n, round(max(0.0, t_), 3), v])
at("boom.wav", 0.68, 0.22); at("noite1.wav", SC["g1-abertura"][0], 0.1); at("brilho-grave.wav", K["rosto"] - 0.2, 0.25); at("boom.wav", K["gyro"], 0.35)
at("obra.wav", SC["g2-obra"][0], 0.14); at("betoneira.wav", K["cimento"] - 0.3, 0.18); at("bater.wav", K["tijolo"] + 0.3, 0.3); at("bater.wav", K["tijolo"] + 1.7, 0.25); at("vidro.wav", K["bebia"], 0.12); at("boom.wav", K["batia"], 0.3)
at("grilos2b.wav", SC["g2b-medo"][0], 0.1); at("vidro.wav", K["barulho"] - 0.1, 0.35)
at("grilos3.wav", SC["g3-febre"][0], 0.08); at("brilho-grave.wav", K["febre"], 0.2); at("brilho.wav", K["pai3"] - 0.2, 0.22)
at("obra4.wav", SC["g4-verdade"][0], 0.14); at("boom.wav", K["cima"] + 0.35, 0.3); at("zap.wav", K["verdade"] - 0.2, 0.25); at("brilho-grave.wav", K["verdade"], 0.3); at("rosnado.wav", K["morresse"] - 0.2, 0.25)
at("noite5.wav", SC["g5-noite"][0], 0.1); at("porta.wav", K["matou"] - 0.1, 0.4); at("boom.wav", K["matou"] + 0.1, 0.35); at("tique.wav", K["dinheiro"], 0.25); at("sopro.wav", K["fugiu"] - 0.2, 0.3); at("rosnado.wav", K["maldade"] - 0.3, 0.35)
at("whoosh-cinematic.mp3", SC["g6-discord"][0] - 0.3, 0.22); at("brilho.wav", K["link"] - 0.1, 0.25)
at("vila.wav", SC["g7-ngl"][0], 0.07); at("brilho.wav", K["ngl"], 0.22); at("porta.wav", K["baixo"] - 0.4, 0.3); at("lab.wav", SC["g7b-lab"][0], 0.16); at("zap.wav", K["d2"], 0.22); at("brilho-grave.wav", K["fachada"] - 0.2, 0.25)
at("fogo8.wav", SC["g8-formigas"][0], 0.16); at("rosnado.wav", K["formigas"], 0.3); at("boom.wav", K["devorado"], 0.4); at("brilho-grave.wav", K["renasceu"], 0.35); at("brilho.wav", K["memorias"], 0.22); at("rosnado.wav", K["rei"] - 0.2, 0.3)
at("mar.wav", SC["g9a-gon"][0], 0.14); at("brilho.wav", K["espelho"], 0.25); at("brilho.wav", K["amar"], 0.25); at("boom.wav", K["vingar"] + 0.1, 0.3)
at("vento10.wav", SC["g10-fim"][0], 0.14); at("brilho-grave.wav", K["vivo"], 0.28); at("brilho-grave.wav", K["aberto"] - 0.3, 0.22); at("clique.wav", K["comenta"], 0.25)
json.dump(L, open(os.path.join(SFX, "lista.json"), "w"))
print("ok trilha", round(TOTAL, 2), "s,", len(L), "efeitos")
