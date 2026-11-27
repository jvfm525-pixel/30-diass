"""Tempo PROVISÓRIO do vídeo do Sukuna (estimado pelo texto), para desenvolver as cenas antes de a narração chegar.
Uso: python3 tools/timing_provisorio_sukuna.py <saida/timing.js>
A versão final sai de tools/build_sukuna.py, com o tempo real da narração (mesmo formato).
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sukuna_texto as S  # noqa: E402

CAPA = 0.7  # quadro de capa antes da narração (como na referência)


def estimar():
    t = CAPA
    k, scenes, legendas = {}, [], []
    for cena, cap, tx in S.PARS:
        ini = t
        ws = S.palavras(tx)
        tempos = []
        for w, chave in ws:
            if chave:
                k[chave] = round(t, 3)
            d = 0.12 + 0.045 * len(w.strip(".,?!:\""))
            tempos.append((t, t + d))
            t += d
            if w.endswith("..."):
                t += 0.5
            elif w[-1] in ".?!":
                t += 0.4
            elif w[-1] == ":":
                t += 0.25
            elif w[-1] == ",":
                t += 0.15
        # legendas por frase
        i = 0
        for f in S.frases(tx):
            n = len(f.split())
            a, b = tempos[i][0], tempos[i + n - 1][1]
            legendas.append([round(a, 3), round(b + 0.25, 3), f])
            i += n
        scenes.append([cena, ini, t])
        t += 0.45
    total = round(t + 1.2, 3)
    # cenas: s0-capa + cada parágrafo (começa um pouco antes da 1ª palavra)
    sc = [["s0-capa", 0.0, CAPA]]
    for i, (n, a, b) in enumerate(scenes):
        a2 = CAPA if i == 0 else round(a - 0.15, 3)
        sc.append([n, a2, None])
    for i in range(len(sc) - 1):
        sc[i][2] = sc[i + 1][1]
    sc[-1][2] = total
    caps = [[round(scenes[i][1] - 0.1, 3), cap] for i, (_, cap, _) in enumerate(S.PARS) if cap]
    return {"scenes": sc, "sc": {n: [a, b] for n, a, b in sc}, "k": k, "total": total, "cut": False, "legendas": legendas, "caps": caps, "fotos": []}


if __name__ == "__main__":
    T = estimar()
    out = sys.argv[1]
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    open(out, "w").write("window.HF_T = " + json.dumps(T, ensure_ascii=False) + ";\n")
    print("ok", out, "total", T["total"])
    for n, a, b in T["scenes"]:
        print(f"  {n:12s} {a:6.2f} → {b:6.2f}")
