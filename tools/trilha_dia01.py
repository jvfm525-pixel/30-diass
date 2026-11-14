"""Trilha original do DIA 1 (O Chat Controla), sintetizada em numpy.

Seções acompanham a narração (segundos):
  A 0.0–17.6   groove "sneaky" de pizzicato
  B 17.6–21.3  tensão: só drone e tique-taque ("a maior besteira")
  C 21.3–25.3  três golpes: "Mentiu." "Quatro vezes." "Numa mensagem só."
  D 25.3–30.0  tema do vilão (Rodrigo)
  E 30.0–37.5  groove volta mais claro (a meta)
  F 37.5–41.37 breakdown + subida até "é você"
  G 41.37–54.4 groove de game show (a decisão) + relógio
  H 54.4–58.6  drone no escuro + "dun dun" final

Uso: python3 tools/trilha_dia01.py <saida.wav>
"""
import sys
import wave

import numpy as np
from scipy.signal import lfilter

SR = 44100
TOTAL = 58.6
N = int(SR * TOTAL)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(30)


def note_hz(n):  # n = número MIDI
    return 440.0 * 2 ** ((n - 69) / 12)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * (1 - pan) / 2 * 2 ** 0.5
    R[i:i + len(sig)] += sig * (1 + pan) / 2 * 2 ** 0.5


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def pluck(midi, dur=0.5, bright=0.5):
    """Karplus-Strong: corda beliscada (pizzicato / baixo)."""
    f = note_hz(midi)
    p = max(2, int(SR / f))
    n = int(SR * dur)
    burst = rng.uniform(-1, 1, p)
    x = np.zeros(n)
    x[:p] = burst
    a = 0.5 * (0.994 + 0.005 * bright)
    y = lfilter([1.0], np.r_[1.0, np.zeros(p - 1), -a, -a], x)
    return y * np.minimum(1, np.arange(n) / (SR * 0.002)) * np.exp(-np.arange(n) / (SR * dur * 0.6))


def marimba(midi, dur=0.35):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = note_hz(midi)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.03)) * env(n, 0.001, dur * 0.35)


def kick(gain=1.0):
    n = int(SR * 0.35)
    t = np.arange(n) / SR
    f = 45 + 90 * np.exp(-t / 0.04)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.12) * gain


def noise_hp(n, k=0.85):
    w = rng.uniform(-1, 1, n)
    return lfilter([1, -1], [1, -k], w)


def snare():
    n = int(SR * 0.22)
    t = np.arange(n) / SR
    return (0.6 * noise_hp(n, 0.6) * np.exp(-t / 0.06) + 0.5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05))


def clap():
    n = int(SR * 0.25)
    t = np.arange(n) / SR
    e = np.zeros(n)
    for o in (0, 0.01, 0.02):
        e += np.where(t >= o, np.exp(-(t - o) / 0.012), 0)
    e += 0.6 * np.exp(-t / 0.08)
    return noise_hp(n, 0.4) * e * 0.5


def hat(open_=False):
    n = int(SR * (0.18 if open_ else 0.05))
    t = np.arange(n) / SR
    return noise_hp(n, 0.0) * np.exp(-t / (0.06 if open_ else 0.015)) * 0.35


def tick():
    n = int(SR * 0.03)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.006) * 0.5


def saw(midi, dur, detune=0.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = note_hz(midi) * (1 + detune)
    return 2 * ((f * t) % 1) - 1


def lowpass(x, k):
    return lfilter([1 - k], [1, -k], x)


def drone(midis, dur, gain=0.2, k=0.985):
    sig = sum(saw(m, dur, d) for m in midis for d in (-0.004, 0.004))
    n = len(sig)
    t = np.arange(n) / SR
    fade = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.4)
    return lowpass(sig, k) * fade * gain / len(midis)


def stab(midis, dur=0.6, gain=0.5):
    sig = sum(saw(m, dur, d) for m in midis for d in (-0.006, 0.006))
    n = len(sig)
    return lowpass(sig, 0.8) * env(n, 0.005, 0.18) * gain / len(midis)


def riser(dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    w = rng.uniform(-1, 1, n)
    out = np.zeros(n)
    k = 0.995 - 0.5 * (t / dur) ** 2
    y = 0.0
    for i in range(0, n, 64):  # filtro que vai abrindo
        seg = w[i:i + 64]
        kk = k[i]
        o, _ = lfilter([1 - kk], [1, -kk], seg, zi=[y]), None
        out[i:i + 64] = o[0]
        y = o[1][0]
    return out * (t / dur) ** 2 * 0.6


def impact():
    n = int(SR * 1.6)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (40 + 60 * np.exp(-t / 0.08)) * t) * np.exp(-t / 0.5)
    return boom + 0.4 * noise_hp(n, 0.3) * np.exp(-t / 0.08)


# ---------- grades de ritmo
def groove(t0, t1, bpm, bass, melody, mel_every=2, hats16=False, claps=False, gain=1.0):
    beat = 60 / bpm
    step = beat / 2
    i = 0
    t = t0
    while t < t1 - 0.05:
        b = i % 8  # 8 colcheias por compasso
        if b in (0, 4) or (b == 6 and i % 16 == 14):
            add(kick(0.9), t, gain)
        if b in (2, 6):
            add(clap() if claps else snare(), t, 0.55 * gain)
        add(hat(open_=(b == 7)), t, 0.5 * gain, pan=0.3)
        if hats16:
            add(hat(), t + step / 2, 0.3 * gain, pan=-0.3)
        bn = bass[(i // 2) % len(bass)]
        if bn is not None and i % 2 == 0:
            add(pluck(bn, 0.45, 0.3), t, 0.55 * gain, pan=-0.1)
        if i % mel_every == 0:
            mn = melody[(i // mel_every) % len(melody)]
            if mn is not None:
                add(pluck(mn, 0.3, 0.9), t, 0.32 * gain, pan=0.25)
        i += 1
        t += step


D2, F2, G2, A2, C3, Bb2 = 38, 41, 43, 45, 48, 46
# A: sneaky em ré menor
groove(0.0, 17.6, 100,
       bass=[D2, D2, F2, D2, G2, G2, A2, C3],
       melody=[62, None, 65, 64, None, 62, 69, None, 68, None, 67, 65, None, 64, 62, None])
# B: tensão
add(drone([38, 45, 51], 3.8, 0.22), 17.55)
for k in range(6):
    add(tick(), 17.8 + k * 0.6, 0.7)
# C: golpes
add(stab([50, 53, 57, 60], 0.9, 0.8), 21.33)
add(stab([49, 52, 56, 59], 0.9, 0.8), 22.5)
add(stab([47, 50, 54, 57], 1.4, 0.9), 23.91)
add(kick(1.2), 21.33)
add(kick(1.2), 22.5)
add(kick(1.3), 23.91)
add(drone([38, 44], 4.0, 0.16), 21.3)
# D: tema do vilão (Rodrigo)
for j, (m, dur) in enumerate([(38, 0.6), (41, 0.6), (40, 0.6), (46, 1.2), (38, 0.6), (41, 0.6), (44, 1.4)]):
    tt = 25.35 + sum(d for _, d in [(38, 0.6), (41, 0.6), (40, 0.6), (46, 1.2), (38, 0.6), (41, 0.6), (44, 1.4)][:j])
    add(stab([m, m + 12], dur + 0.2, 0.55), tt)
for k in range(8):
    add(kick(0.8), 25.4 + k * 0.6)
add(drone([26, 33], 4.8, 0.25, 0.99), 25.3)
# E: a meta (fá maior, mais claro)
groove(30.0, 37.45, 104,
       bass=[F2, F2, A2, C3, Bb2, Bb2, C3, A2],
       melody=[65, 69, 72, 69, 70, 69, 67, 65, 64, 67, 72, None, 74, 72, 69, None], mel_every=1, gain=0.95)
for k, m in enumerate([77, 81, 84, 89]):  # sino a cada barra ("dinheiro, saúde, amor, reputação")
    add(marimba(m, 0.5), 34.2 + k * 0.7, 0.35)
# F: breakdown + subida
add(drone([41, 48, 53], 3.9, 0.18), 37.5)
add(riser(3.8), 37.55, 0.9)
add(impact(), 41.37, 0.9)
# G: game show
groove(41.37, 54.4, 120,
       bass=[D2, D2 + 12, F2, F2 + 12, G2, G2 + 12, A2, A2 + 12],
       melody=[74, 72, 69, 72, 74, None, 77, None, 76, 74, 72, 69, 70, None, 69, None],
       mel_every=1, hats16=True, claps=True, gain=0.85)
for k in range(int((54.3 - 49.5) / 0.5)):
    add(tick(), 49.5 + k * 0.5, 0.9)
# H: escuro + final
add(drone([26, 33, 38], 4.2, 0.28, 0.992), 54.4)
add(stab([26, 38], 0.8, 1.0), 57.2)
add(stab([25, 37], 1.3, 1.1), 57.75)
add(kick(1.4), 57.2)
add(kick(1.5), 57.75)

# ---------- mixagem
mix = np.stack([L, R], axis=1)
mix = np.tanh(mix * 0.9)  # cola e evita clip
peak = np.max(np.abs(mix))
mix = mix / peak * 0.89  # ~ -1 dBFS
fade = np.ones(N)
fade[-int(SR * 0.3):] = np.linspace(1, 0, int(SR * 0.3))
mix *= fade[:, None]

out = sys.argv[1] if len(sys.argv) > 1 else "trilha.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("ok", out, f"{TOTAL}s")
