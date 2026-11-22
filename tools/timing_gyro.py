"""Tempo do vídeo do Gyro: alinha o texto marcado (tools/gyro_texto.py) com a transcrição da narração.
Uso: python3 tools/timing_gyro.py [--provisorio]  → escreve gyro/assets/timing.js e remotion/src/videos/gyro/dados.json.
Sem transcrição (ou com --provisorio), inventa os tempos das palavras no ritmo da narração dos outros vídeos.
"""
import json
import os
import re
import sys
import unicodedata
from difflib import SequenceMatcher

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gyro_texto as S  # noqa: E402

CAPA = 0.7  # quadro de capa antes da narração
TR = os.path.join(ROOT, "gyro/assets/voice/transcript.json")
OUT = os.path.join(ROOT, "gyro/assets/timing.js")
# o que o reconhecedor ouviu diferente do texto
FIX = {"enao": "e nao", "porque": "por que", "para": "pra", "gendin": "genshin", "genchin": "genshin", "jojo": "gojo", "goujo": "gojo", "sugoru": "suguru", "getto": "geto", "sugurugetu": "suguru geto", "sugurugeto": "suguru geto", "eas": "e as", "eo": "e o", "maldicoada": "amaldicoada", "131": "cento e trinta e um", "satela": "satella", "equidna": "echidna", "subaro": "subaru", "emilha": "emilia", "giro": "gyro", "jairo": "gyro", "dedois": "d2", "deedois": "d2", "welfim": "welfin", "gom": "gon", "engel": "ngl", "enegel": "ngl", "neguel": "ngl"}
DADOS = os.path.join(ROOT, "remotion/src/videos/gyro/dados.json")
# cortes do 3D que não coincidem com os parágrafos: (nome, parágrafo, chave, deslocamento)
CORTES = [("g2b-medo", "g2-obra", "medo", -0.3), ("g7b-lab", "g7-ngl", "baixo", 0.45), ("g7c-fachada", "g7-ngl", "fachada", -0.3), ("g9c-amar", "g9b-gyro", "amar", -0.25), ("g9d-vingar", "g9b-gyro", "vingar", -0.25)]
SEM_3D = set()  # parágrafo sem cenário próprio (o s3b-prisao continua por cima dele)


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in w if unicodedata.category(c) != "Mn"))


def provisoria():
    out, t = [], 0.0
    for cena, cap, tx in S.PARS:
        for f in S.frases(tx):
            for w in f.split():
                d = 0.05 + 0.04 * len(norm(w)); out.append((norm(w), t, t + d)); t += d
                if w[-1:] in ".?!": t += 0.25
                elif w[-1:] in ",:": t += 0.08
            t += 0.06
        t += 0.35
    return out


def transcricao():
    if PROV:
        return provisoria()
    out = []
    for x in json.load(open(TR)):
        t0, t1 = x["start"], x.get("end", x["start"] + 0.3)
        partes = FIX.get(norm(x["text"]), norm(x["text"])).split()
        for i, p in enumerate(partes):  # palavra colada ("Ejunto") vira duas, dividindo o tempo
            a = t0 + (t1 - t0) * i / len(partes)
            out.append((p, a, t0 + (t1 - t0) * (i + 1) / len(partes)))
    return out


def alinhar():
    tr = transcricao()
    script = []
    for cena, cap, tx in S.PARS:
        for w, chave in S.palavras(tx):
            script.append([norm(w), chave, cena, None, None])
    a = [s[0] for s in script]
    b = [t[0] for t in tr]
    sm_ = SequenceMatcher(None, a, b, autojunk=False)
    for blk in sm_.get_matching_blocks():
        for k in range(blk.size):
            script[blk.a + k][3], script[blk.a + k][4] = tr[blk.b + k][1], tr[blk.b + k][2]
    # palavras sem par: interpola entre vizinhos casados
    idx = [i for i, s in enumerate(script) if s[3] is not None]
    for i, s in enumerate(script):
        if s[3] is None:
            p = max([j for j in idx if j < i], default=None)
            n = min([j for j in idx if j > i], default=None)
            if p is None:
                s[3] = script[n][3] - 0.3 * (n - i)
            elif n is None:
                s[3] = script[p][4] + 0.3 * (i - p)
            else:
                s[3] = script[p][4] + (script[n][3] - script[p][4]) * (i - p) / (n - p)
            s[4] = s[3] + 0.25
    faltam = [s[0] for s in script if s[3] is None]
    nao = len(script) - sum(b.size for b in sm_.get_matching_blocks())
    return script, nao, faltam


def montar():
    script, nao, _ = alinhar()
    k, ini, i = {}, {}, 0
    legendas = []
    for cena, cap, tx in S.PARS:
        ws = S.palavras(tx)
        bloco = script[i:i + len(ws)]
        ini[cena] = bloco[0][3] + CAPA
        for s in bloco:
            if s[1]:
                k[s[1]] = round(s[3] + CAPA, 3)
        j = 0
        for f in S.frases(tx):
            n = len(f.split())
            legendas.append([round(bloco[j][3] + CAPA, 3), round(bloco[j + n - 1][4] + CAPA + 0.25, 3), f])
            j += n
        i += len(ws)
    fim_voz = script[-1][4] + CAPA
    total = round(fim_voz + 1.6, 3)
    nomes = [p[0] for p in S.PARS]
    par = [["s0-capa", 0.0, CAPA]]
    for n_, nome in enumerate(nomes):
        par.append([nome, CAPA if n_ == 0 else round(ini[nome] - 0.18, 3), None])
    for j in range(len(par) - 1):
        par[j][2] = par[j + 1][1]
    par[-1][2] = total
    sc = [list(p) for p in par if p[0] not in SEM_3D]
    for nome, _, chave, d in CORTES:
        sc.append([nome, round(k[chave] + d, 3), None])
    sc.sort(key=lambda x: x[1])
    for j in range(len(sc) - 1):
        sc[j][2] = sc[j + 1][1]
    sc[-1][2] = total
    # legendas não se sobrepõem
    for j in range(len(legendas) - 1):
        legendas[j][1] = min(legendas[j][1], legendas[j + 1][0] - 0.05)
    caps = [[round(ini[n] - 0.1, 3), cap] for n, cap, _ in S.PARS if cap]
    T = {"scenes": sc, "sc": {n: [a, b] for n, a, b in sc}, "par": {n: [a, b] for n, a, b in par}, "k": k, "total": total, "cut": False, "capa": CAPA, "provisorio": PROV,
         "legendas": legendas, "caps": caps, "fotos": []}
    return T, nao


PROV = "--provisorio" in sys.argv or not os.path.exists(TR)

if __name__ == "__main__":
    T, nao = montar()
    out = OUT
    open(out, "w").write("window.HF_T = " + json.dumps(T, ensure_ascii=False) + ";\n")
    json.dump(T, open(DADOS, "w"), ensure_ascii=False)
    print("ok", out, "total", T["total"], "palavras sem par:", nao)
    for n, a, b in T["scenes"]:
        print(f"  {n:12s} {a:6.2f} → {b:6.2f}")
