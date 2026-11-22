"""Trilha e efeitos do vídeo do Demônio da Morte (Chainsaw Man) (sintetizados aqui, determinísticos).
Como na referência: tapete contínuo e suave (graves + pads, sem bateria), volume constante, poucos efeitos delicados
nos momentos de luz, cigarras na lembrança de verão, grilos na escola à noite; a trilha quase some na pergunta final.
Uso: python3 tools/som_morte.py  → morte/assets/music/trilha-morte.wav e morte/assets/sfx/*.wav + lista.json
"""
import json
import os
import shutil
import wave

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
P = os.path.join(ROOT, "morte")
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
ACORDES = {  # dó menor sombrio; a escola num lá menor mais suave; a igreja e o fim em tensão; a pergunta em aberto
    "s0-capa": [36, 43, 48, 51], "m1-gancho": [36, 43, 48, 51, 55], "m1b-escola": [45, 52, 57, 60], "m2-regra": [38, 45, 50, 53], "m3-cavaleiros": [33, 40, 45, 48, 52], "m4-profecia": [37, 44, 49, 52],
    "m4b-onda": [34, 41, 46, 49], "m5-discord": [41, 48, 53, 57], "m6-fami": [45, 52, 57, 60, 64], "m7-poderes": [36, 43, 48, 51], "m7b-queda": [35, 42, 47, 50], "m8-oca": [40, 47, 52, 55, 59],
    "m9-plano": [34, 41, 46, 49], "m9b-igreja": [37, 44, 49, 53], "m10-fim": [33, 40, 45, 48], "m10b-guerra": [36, 43, 48, 51], "m10c-volta": [41, 48, 53, 57, 60], "m11-pergunta": [36, 43, 48, 51, 55],
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
k = np.clip((t - (K["sem"] - 0.6)) / 0.5, 0, 1) * 0.5
mus *= (1 - 0.82 * k)[:, None]
mus[:, :] *= env(N, 0.4, 1.5)[:, None]
mus /= np.max(np.abs(mus)) + 1e-9
mus *= 0.8
os.makedirs(os.path.join(P, "assets/music"), exist_ok=True)
salvar(os.path.join(P, "assets/music/trilha-morte.wav"), mus)

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


def corvos(d=1.6):  # bater de asas + grasnos
    n = int(d * SR); tt = np.arange(n) / SR; x = lp(rng.standard_normal(n), 0.12) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * tt))) * 0.5
    for i in range(4):
        p = int((0.1 + i * 0.35) * SR)
        if p < n - 9000:
            b = np.arange(9000) / SR; x[p:p + 9000] += np.sin(2 * np.pi * (700 - 300 * b) * b + 2 * np.sin(2 * np.pi * 60 * b)) * np.exp(-b * 9) * 0.5
    return x * env(n, 0.05, 0.4)


def coracao(d=1.2):  # batida grave dupla
    n = int(d * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for st in (0.0, 0.28):
        p = int(st * SR); b = tt[: n - p]; x[p:] += np.sin(2 * np.pi * 50 * b) * np.exp(-b * 14)
    return x * 0.9


def serra(d=1.4):  # motosserra acelerando
    n = int(d * SR); tt = np.arange(n) / SR; f = 70 + 90 * np.clip(tt / 0.4, 0, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR; x = np.sign(np.sin(ph)) * 0.5 + lp(rng.standard_normal(n), 0.3) * 0.4
    return lp(x, 0.35) * env(n, 0.03, 0.3)


def multidao_amb(d):
    n = int(d * SR); x = lp(rng.standard_normal(n), 0.02) * 2.2; tt = np.arange(n) / SR
    return x * (1 + 0.25 * np.sin(2 * np.pi * 0.3 * tt)) * env(n, 0.8, 1.0)


def tiros(d):
    n = int(d * SR); x = lp(rng.standard_normal(n), 0.004) * 2.0
    for _ in range(int(d * 6)):
        p = rng.integers(0, n - 3000); b = np.arange(3000) / SR; x[p:p + 3000] += (rng.standard_normal(3000) * np.exp(-b * 60) + np.sin(2 * np.pi * 90 * b) * np.exp(-b * 30)) * 0.6
    return x * env(n, 0.5, 0.8)


def dur_(n):
    a, b = SC[n]; return b - a + 0.6


fx = {"brilho.wav": brilho(), "brilho-grave.wav": brilho(2.2, 900), "boom.wav": boom(), "sopro.wav": sopro(), "clique.wav": clique(), "rosnado.wav": rosnado(2.2), "zap.wav": zap(), "porta.wav": bater(0.6, 90),
      "corvos.wav": corvos(), "coracao.wav": coracao(), "serra.wav": serra(), "tique.wav": tique(),
      "vazio1.wav": sopro(dur_("m1-gancho")), "escola.wav": cigarra(dur_("m1b-escola")), "cidade2.wav": multidao_amb(dur_("m2-regra")), "vento3.wav": sopro(dur_("m3-cavaleiros")), "cidade4.wav": multidao_amb(dur_("m4-profecia")),
      "escola6.wav": cigarra(dur_("m6-fami")), "noite8.wav": grilos(dur_("m8-oca")), "igreja.wav": multidao_amb(dur_("m9b-igreja")), "guerra.wav": tiros(dur_("m10b-guerra")), "fogo11.wav": fogo_amb(dur_("m11-pergunta"))}
for nome, x in fx.items():
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    salvar(os.path.join(SFX, nome), x)
shutil.copy(os.path.join(ROOT, "assets/sfx/whoosh-cinematic.mp3"), os.path.join(SFX, "whoosh-cinematic.mp3"))
L = []
def at(n, t_, v):
    L.append([n, round(max(0.0, t_), 3), v])
at("boom.wav", 0.68, 0.22); at("vazio1.wav", SC["m1-gancho"][0], 0.1); at("brilho-grave.wav", K["demonio"] - 0.2, 0.25); at("rosnado.wav", K["outros"] - 0.2, 0.25)
at("escola.wav", SC["m1b-escola"][0], 0.06); at("brilho.wav", K["spoiler"], 0.22)
at("cidade2.wav", SC["m2-regra"][0], 0.1); at("rosnado.wav", K["forte"], 0.3); at("clique.wav", K["arma"], 0.3); at("sopro.wav", K["escuro"] - 0.1, 0.25); at("sopro.wav", K["altura"], 0.2); at("coracao.wav", K["morrer"] - 0.2, 0.45)
at("vento3.wav", SC["m3-cavaleiros"][0], 0.12); at("corvos.wav", K["morte"] - 0.3, 0.2); at("brilho-grave.wav", K["morte"], 0.25); at("tique.wav", K["makima"], 0.22); at("tique.wav", K["yoru"], 0.22); at("tique.wav", K["fome"], 0.22); at("boom.wav", K["cavaleiros"], 0.3)
at("cidade4.wav", SC["m4-profecia"][0], 0.08); at("brilho-grave.wav", K["julho"], 0.25); at("porta.wav", K["descer"] - 0.4, 0.35); at("boom.wav", K["humanidade"], 0.3); at("rosnado.wav", K["era"], 0.3)
at("coracao.wav", K["pior"], 0.35); at("zap.wav", K["sozinho"], 0.2); at("boom.wav", K["explodir"], 0.45); at("sopro.wav", K["mata"] - 0.3, 0.3); at("coracao.wav", K["inconsciente"], 0.3)
at("whoosh-cinematic.mp3", SC["m5-discord"][0] - 0.3, 0.22); at("brilho.wav", K["link"] - 0.1, 0.25)
at("escola6.wav", SC["m6-fami"][0], 0.06); at("brilho-grave.wav", K["fami"] - 0.1, 0.3); at("tique.wav", K["comendo"], 0.2)
at("boom.wav", K["matanahora"], 0.35); at("brilho.wav", K["ressuscita"], 0.25); at("corvos.wav", K["come"] - 0.3, 0.35); at("tique.wav", K["fantoches"], 0.3)
at("rosnado.wav", K["primordial"], 0.35); at("boom.wav", K["servo"] + 0.2, 0.35); at("corvos.wav", K["irma"] - 1.3, 0.35)
at("noite8.wav", SC["m8-oca"][0], 0.07); at("coracao.wav", K["orgaos"], 0.35); at("brilho-grave.wav", K["viva"], 0.25); at("brilho-grave.wav", K["naomorre"], 0.3)
at("sopro.wav", K["morresse"], 0.3); at("rosnado.wav", K["nasceria"], 0.4); at("boom.wav", K["gente"] - 0.2, 0.3)
at("igreja.wav", SC["m9b-igreja"][0], 0.1); at("serra.wav", K["chainsaw"], 0.3); at("brilho-grave.wav", K["yoru9"], 0.25); at("serra.wav", K["matarela"] - 0.3, 0.4)
at("rosnado.wav", K["pochita"], 0.4); at("serra.wav", K["devorou"] - 0.4, 0.45); at("boom.wav", K["devorou"], 0.5); at("sopro.wav", K["apagou"], 0.3)
at("guerra.wav", SC["m10b-guerra"][0], 0.14); at("boom.wav", K["guerra"], 0.35); at("boom.wav", K["guerra"] + 0.6, 0.3)
at("brilho-grave.wav", K["voltou"], 0.3); at("sopro.wav", K["apagado"] - 0.3, 0.25)
at("fogo11.wav", SC["m11-pergunta"][0], 0.08); at("brilho.wav", K["com"], 0.2); at("rosnado.wav", K["sem"], 0.25); at("clique.wav", K["comenta"], 0.25)
json.dump(L, open(os.path.join(SFX, "lista.json"), "w"))
print("ok trilha", round(TOTAL, 2), "s,", len(L), "efeitos")
