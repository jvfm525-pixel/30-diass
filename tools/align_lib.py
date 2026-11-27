"""Alinha o texto do roteiro (grafia certa) com os tempos da transcrição (whisper).

align(pars, transcript_path, fix) devolve uma lista de palavras:
[par, grupo, texto, norm, início, fim]. Parágrafos usam "|" para dividir os
grupos de legenda. `fix` separa tokens que a transcrição grudou.
"""
import difflib
import json
import re
import unicodedata


def norm(w, num=None):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    w = re.sub(r"[^a-z0-9]", "", w)
    return (num or {}).get(w, w)


def align(pars, transcript_path, fix=None, num=None):
    fix = fix or {}
    tr = json.load(open(transcript_path))
    tw = []
    for x in tr:
        n = norm(x["text"], num)
        parts = fix.get(n, [n])
        d = (x["end"] - x["start"]) / len(parts)
        for k, p in enumerate(parts):
            tw.append((p, x["start"] + k * d, x["start"] + (k + 1) * d))
    words = []
    for pi, par in enumerate(pars):
        for gi, grp in enumerate(par.split("|")):
            for w in grp.split(" "):
                words.append([pi, gi, w, norm(w, num), None, None])
    sm = difflib.SequenceMatcher(a=[w[3] for w in words], b=[t[0] for t in tw], autojunk=False)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            words[a + k][4], words[a + k][5] = tw[b + k][1], tw[b + k][2]
    # palavras que não casaram: espalha no buraco entre as vizinhas que casaram
    i = 0
    while i < len(words):
        if words[i][4] is not None:
            i += 1
            continue
        j = i
        while j < len(words) and words[j][4] is None:
            j += 1
        prev = words[i - 1][5] if i > 0 else 0.0
        nxt = words[j][4] if j < len(words) else prev + .4 * (j - i)
        step = max(.05, (nxt - prev) / (j - i))
        for k in range(i, j):
            words[k][4] = prev + (k - i) * step
            words[k][5] = prev + (k - i + 1) * step
        i = j
    return words


def caption_groups(words):
    groups = {}
    for w in words:
        groups.setdefault((w[0], w[1]), []).append(w)
    return [groups[k] for k in groups]
