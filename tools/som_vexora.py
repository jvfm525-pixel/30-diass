"""Trilha (batida eletrônica 128 bpm, sintetizada) e efeitos de meme do vídeo VEXORA. Determinístico.
Uso: python3 tools/som_vexora.py && python3 tools/build_vexora.py
"""
import json, os, wave
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
P = os.path.join(ROOT, "discord-promo")
D = json.load(open(os.path.join(P, "assets/tempos.json"))); K, TOTAL = D["k"], D["total"]
SR = 48000
rng = np.random.default_rng(11)


def salvar(path, x):
    x = np.clip(x, -1, 1)
    if x.ndim == 1: x = np.stack([x, x], 1)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())


def env(n, at, rel):
    e = np.ones(n); a = int(at * SR); r = int(rel * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e


# ---------------------------------------------------------------- batida
N = int(TOTAL * SR); mus = np.zeros(N); bpm = 128; beat = 60 / bpm
def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (50 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 9)
def hat():
    n = int(0.06 * SR); x = rng.standard_normal(n); x = x - np.convolve(x, np.ones(6) / 6, "same"); return x * np.exp(-np.arange(n) / SR * 70) * 0.25
def clap():
    n = int(0.2 * SR); x = rng.standard_normal(n); return x * np.exp(-np.arange(n) / SR * 22) * 0.45
KI, HA, CL = kick(), hat(), clap()
def put(x, t, v=1.0):
    i = int(t * SR)
    if i >= N: return
    m = min(len(x), N - i); mus[i:i + m] += x[:m] * v
nota = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = [33, 33, 29, 31]  # lá - lá - fá - sol (grave)
t = 0.0; b = 0
while t < TOTAL - 0.5:
    put(KI, t, 0.9)
    put(HA, t + beat / 2, 0.8)
    if b % 2 == 1: put(CL, t, 0.8)
    m = prog[(b // 8) % 4]; n = int(beat * SR); tt = np.arange(n) / SR
    baixo = np.sign(np.sin(2 * np.pi * nota(m) * tt)) * 0.18 * np.exp(-tt * 3)
    put(baixo, t + beat / 2)
    t += beat; b += 1
# pausa dramática na virada pro Anime Cards
k = np.ones(N); i0, i1 = int((K["mas"] - 0.2) * SR), int((K["anime"] - 0.3) * SR); k[i0:i1] = 0.25
mus *= k
mus *= env(N, 0.3, 1.0)
mus /= np.max(np.abs(mus)) + 1e-9; mus *= 0.85
salvar(os.path.join(P, "assets/music/beat.wav"), mus)

# ---------------------------------------------------------------- efeitos
def whoosh(d=0.45):
    n = int(d * SR); t = np.arange(n) / SR; x = rng.standard_normal(n); y = np.zeros(n); acc = 0.0
    a = 0.02 + 0.3 * np.sin(np.pi * t / d) ** 2
    for i in range(n): acc += a[i] * (x[i] - acc); y[i] = acc
    return y * np.sin(np.pi * t / d) * 1.5
def vine(d=1.1):  # "vine boom": batida grave com queda de tom e cauda
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (90 * np.exp(-t * 2.5) + 38) * t) * np.exp(-t * 3.2) + 0.3 * np.sin(2 * np.pi * 180 * t) * np.exp(-t * 9)) * 0.95
def pop(d=0.12):
    n = int(d * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (900 - 2500 * t) * t) * np.exp(-t * 40)
def caixa(d=0.8):  # "ka-ching"
    n = int(d * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f, st in ((2100, 0.0), (2800, 0.08), (3500, 0.08)):
        s = int(st * SR); x[s:] += np.sin(2 * np.pi * f * t[: n - s]) * np.exp(-t[: n - s] * 7) * 0.4
    x[:int(0.03 * SR)] += rng.standard_normal(int(0.03 * SR)) * 0.5; return x
def ding(d=0.7):
    n = int(d * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 1320 * t) + 0.5 * np.sin(2 * np.pi * 1980 * t)) * np.exp(-t * 6) * 0.5
def grilo(d=1.4):  # silêncio constrangedor (vácuo)
    n = int(d * SR); t = np.arange(n) / SR; p = ((t * 3) % 1) < 0.15
    return np.sin(2 * np.pi * 4500 * t) * p * 0.25
def risada(d=0.9):  # "ba-dum-tss" curto
    n = int(d * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for st, f in ((0.0, 160), (0.18, 120)):
        s = int(st * SR); x[s:] += np.sin(2 * np.pi * f * t[: n - s]) * np.exp(-t[: n - s] * 18)
    s = int(0.36 * SR); x[s:] += rng.standard_normal(n - s) * np.exp(-t[: n - s] * 6) * 0.4; return x
def estalo(d=0.25):
    n = int(d * SR); return rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 35) * 0.8

FX = {"whoosh.wav": whoosh(), "vine.wav": vine(), "pop.wav": pop(), "caixa.wav": caixa(), "ding.wav": ding(), "grilo.wav": grilo(), "badum.wav": risada(), "estalo.wav": estalo()}
SFX = os.path.join(P, "assets/sfx")
for n_, x in FX.items(): salvar(os.path.join(SFX, n_), x / (np.max(np.abs(x)) + 1e-9) * 0.9)
dur = {n_: len(x) / SR for n_, x in FX.items()}
L = []
def at(n_, t_, v): L.append([n_, round(max(0, t_), 3), v, round(dur[n_], 3)])
at("vine.wav", 0.0, 0.5); at("estalo.wav", K["brincadeira"] - 0.1, 0.35); at("whoosh.wav", K["senta"] - 0.2, 0.4)
at("whoosh.wav", K["aberta"] - 0.6, 0.4); at("pop.wav", K["aberta"] - 0.3, 0.5); at("vine.wav", K["tres"] - 0.1, 0.45)
for k_ in ["aleatoria", "premium", "triple", "lista", "guia"]: at("whoosh.wav", K[k_] - 0.15, 0.35); at("caixa.wav", K[k_] + 0.3, 0.3)
at("badum.wav", K["preco"] + 1.6, 0.45)
at("whoosh.wav", K["escolheu"] - 0.3, 0.35); at("pop.wav", K["abre"] + 0.8, 0.5); at("estalo.wav", K["zero"], 0.4); at("pop.wav", K["privado"], 0.4)
at("caixa.wav", K["pagou"], 0.45); at("ding.wav", K["entrega"] - 0.1, 0.5); at("grilo.wav", K["crush"] + 0.9, 0.35)
at("whoosh.wav", K["vip"] - 1.4, 0.35); at("pop.wav", K["vip"] + 0.5, 0.45); at("whoosh.wav", K["dez"] - 0.2, 0.35); at("pop.wav", K["dez"] + 1.6, 0.45); at("vine.wav", K["aura"], 0.45)
at("pop.wav", K["ainda"], 0.35); at("pop.wav", K["ainda"] + 0.5, 0.35)
at("vine.wav", K["anime"] - 0.3, 0.55)
for k_ in ["naruto", "luffy", "goku", "sung"]: at("whoosh.wav", K[k_] - 0.15, 0.3)
at("caixa.wav", K["lendario"], 0.45); at("estalo.wav", K["printar"], 0.4)
at("whoosh.wav", K["monta"], 0.35); at("vine.wav", K["desafia"], 0.45); at("pop.wav", K["sobe"] - 0.2, 0.4); at("vine.wav", K["skill"] - 0.05, 0.6)
at("pop.wav", K["missao"], 0.35); at("pop.wav", K["missao"] + 0.4, 0.35); at("pop.wav", K["missao"] + 0.8, 0.35)
at("estalo.wav", K["deu"], 0.4); at("ding.wav", K["ninguem"] - 0.6, 0.45); at("whoosh.wav", K["ensino"] - 0.4, 0.4)
at("vine.wav", K["vexora3"] - 0.15, 0.5); at("estalo.wav", K["link"] - 0.05, 0.4); at("badum.wav", K["cringe"], 0.45)
json.dump(L, open(os.path.join(SFX, "lista.json"), "w"))
print("ok beat + %d efeitos" % len(L))
