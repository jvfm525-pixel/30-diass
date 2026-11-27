"""Trilha grave e tensa (sintetizada, determinística) para o episódio do espírito carmesim.
Uso: python3 tools/trilha_carmesim.py <saida.wav> <duracao_s>
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
out, dur = sys.argv[1], float(sys.argv[2])
t = np.arange(int(SR * dur)) / SR
rng = np.random.default_rng(7)

# zumbido: Lá grave + quinta, com batimento lento
drone = (np.sin(2 * np.pi * 55 * t) + .6 * np.sin(2 * np.pi * 82.4 * t + .3) + .35 * np.sin(2 * np.pi * 110.3 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t))
# textura de ruído filtrado (vento escuro)
b, a = butter(2, 400 / (SR / 2))
air = lfilter(b, a, rng.standard_normal(len(t))) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.03 * t + 1))
# pulso de coração a ~58 bpm
beat = np.zeros_like(t)
per = 60 / 58
for k in range(int(dur / per)):
    for off, amp in ((0, 1.0), (0.22, 0.6)):
        s0 = int((k * per + off) * SR)
        n = int(0.18 * SR)
        if s0 + n < len(t):
            tt = np.arange(n) / SR
            beat[s0:s0 + n] += amp * np.sin(2 * np.pi * 48 * tt) * np.exp(-tt * 22)
# pad agudo frio que entra e sai
pad = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 659.3 * t)) * 0.04 * (0.5 - 0.5 * np.cos(2 * np.pi * t / 24))
mix = .35 * drone + .25 * air + .55 * beat + pad
fade = np.minimum(1, np.minimum(t / 3, (dur - t) / 4))
mix *= fade
mix /= np.max(np.abs(mix)) * 1.1
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
