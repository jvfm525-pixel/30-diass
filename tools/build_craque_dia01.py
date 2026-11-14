"""Gera o DIA 1 de "O Chat Faz um Craque" em craque-dia01/.

Os tempos das palavras vêm de assets/voice/transcript.json (whisper), alinhados
com o texto do roteiro (que tem a grafia certa).
Uso: python3 tools/build_craque_dia01.py
"""
import difflib
import json
import os
import re
import subprocess
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(__file__))
from figurinha_lib import (BLUE, GREEN, INK, PAPER, RED, YEL, biel, bigode, bola,  # noqa: E402
                           chuteira, cut, kaua, kraft, picole, scene, silhouette, tape, trofeu,
                           vo_cida)

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "craque-dia01")
COMP = os.path.join(ROOT, "compositions")

PARS = [
    "Olha ele!|Esse é o Biel.|17 anos,|chinelo de dedo…|e um sonho:|ser o melhor|jogador do mundo.",
    "O problema?|A chuteira dele|é emprestada…|do primo…|que também|pegou emprestada.",
    "E a bola|é tão murcha que,|quando ele chuta,|ela pede desculpa.",
    "Até que a Vó Cida|chegou com a notícia:|um olheiro europeu|vai fazer uma peneira|no bairro.|Daqui a 30 dias.|E só um garoto|vai ser escolhido.",
    "E quem mais vai?|O Kauã.|Filho do dono|do mercadinho.|Chuteira dourada,|personal trainer…|e até a sombra dele|faz embaixadinha.",
    "Pra ser escolhido,|ele precisa chegar|com tudo acima de 70:|habilidade,|físico,|dinheiro e cabeça.|Hoje ele tá assim.|Dinheiro: 5 reais.|O preço do picolé|que ele não comprou.",
    "Mas o Biel|não decide nada sozinho.|Quem manda|na carreira dele…|é você.",
    "Primeira decisão:|sábado de manhã,|a Vó Cida precisa de ajuda|pra vender salgado na feira…|no mesmo horário|do treino do Professor Bigode.|Ajudar a vó:|ganha dinheiro,|mas perde treino.|Ir pro treino:|melhora o futebol…|mas o dinheiro zera.|Comenta A ou B!",
    "Faltam 30 dias|pra peneira…|e o Kauã|tá de olho.",
]
NUM = {"17": "dezessete", "30": "trinta", "70": "setenta", "5": "cinco"}


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    w = re.sub(r"[^a-z0-9]", "", w)
    return NUM.get(w, w)


# ---------- alinhamento texto ↔ transcrição
def align():
    tr = json.load(open(os.path.join(ROOT, "assets/voice/transcript.json")))
    # separa tokens grudados pela transcrição ("Esó" → "E só", "avocida" → "a vo cida")
    tw = []
    for x in tr:
        n = norm(x["text"])
        fix = {"ea": ["e", "a"], "eso": ["e", "so"], "equem": ["e", "quem"], "eo": ["e", "o"], "avocida": ["a", "vo", "cida"],
               "kaohan": ["kaua"], "avo": ["a", "vo"], "melhor": ["melhor"]}
        parts = fix.get(n, [n])
        d = (x["end"] - x["start"]) / len(parts)
        for k, p in enumerate(parts):
            tw.append((p, x["start"] + k * d, x["start"] + (k + 1) * d))
    words = []  # (par, grupo, texto, norm)
    for pi, par in enumerate(PARS):
        for gi, grp in enumerate(par.split("|")):
            for w in grp.split(" "):
                words.append([pi, gi, w, norm(w), None, None])
    sm = difflib.SequenceMatcher(a=[w[3] for w in words], b=[t[0] for t in tw], autojunk=False)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            words[a + k][4], words[a + k][5] = tw[b + k][1], tw[b + k][2]
    # interpola o que não casou
    for i, w in enumerate(words):
        if w[4] is None:
            prev = next((words[j][5] for j in range(i - 1, -1, -1) if words[j][5] is not None), 0.0)
            nxt = next((words[j][4] for j in range(i + 1, len(words)) if words[j][4] is not None), prev + .3)
            w[4], w[5] = prev, min(nxt, prev + .35)
    return words


WORDS = align()
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.1, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-biel", "s2-chuteira", "s3-bola", "s4-noticia", "s5-kaua", "s6-carta", "s7-voce", "s8-decisao", "s9-final"]
SCENES = []
for k, n in enumerate(NAMES):
    s = 0.0 if k == 0 else round(PSTART[k] - .12, 2)
    e = TOTAL if k == len(NAMES) - 1 else round(PSTART[k + 1] - .12, 2)
    SCENES.append((n, s, e))
SC = {n: (s, e) for n, s, e in SCENES}


def W(par, word, nth=0):
    """Tempo absoluto da palavra (pelo começo) no parágrafo."""
    hits = [w for w in WORDS if w[0] == par and w[3].startswith(norm(word))]
    return round(hits[nth][4], 2)


def L(sc, par, word, nth=0, off=0.0):
    return round(W(par, word, nth) - SC[sc][0] + off, 2)


def D(sc):
    return round(SC[sc][1] - SC[sc][0], 2)


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


def place(svg, cid, left, top, width, z=2, extra=""):
    return f'<div id="{cid}" style="position:absolute;left:{left}px;top:{top}px;width:{width}px;z-index:{z};{extra}">{svg}</div>'


def onom(cid, text, color, size, left, top, rot=-6, z=8):
    return (f'<div id="{cid}" class="onom" data-layout-allow-overlap data-layout-allow-occlusion style="left:{left}px;top:{top}px;font-size:{size}px;color:{color};z-index:{z}">'
            f'<span id="{cid}-in" data-layout-allow-occlusion style="display:inline-block;transform-origin:50% 50%">{text}</span></div>')


def chalk(cid, text, left, top, size=64, color="#fff", rot=-4, z=7):
    return (f'<div id="{cid}" data-layout-allow-overlap style="position:absolute;left:{left}px;top:{top}px;z-index:{z}">'
            f'<div id="{cid}-in" class="mk" style="font-size:{size}px;color:{color};transform-origin:0% 50%;white-space:nowrap">{text}</div></div>')


def sticker(cid, inner, left, top, w, z=6, extra=""):
    return (f'<div id="{cid}" data-layout-allow-overlap style="position:absolute;left:{left}px;top:{top}px;width:{w}px;z-index:{z}">'
            f'<div id="{cid}-in" class="card" style="position:relative;padding:16px 22px;{extra}">{inner}</div></div>')


def sunset_field(p):
    return f'''<svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0">
      <rect width="1080" height="1920" fill="#ff9f43"/><rect width="1080" height="700" fill="#ff7b54"/>
      {cut('<circle cx="760" cy="820" r="220"/>', '<circle cx="760" cy="820" r="220" fill="#ffd23f"/>', (0, 0), 14)}
      {cut('<path d="M0 900 L180 760 L330 880 L520 720 L700 860 L880 740 L1080 880 L1080 1000 L0 1000 Z"/>', '<path d="M0 900 L180 760 L330 880 L520 720 L700 860 L880 740 L1080 880 L1080 1000 L0 1000 Z" fill="#7a4b8f"/>', (0, 6), 12)}
      {cut('<rect x="0" y="980" width="1080" height="940"/>', '<rect x="0" y="980" width="1080" height="940" fill="#b5713f"/>' + "".join(f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r * .4:.0f}" fill="#8f5530"/>' for x, y, r in [(150, 1500, 60), (820, 1620, 80), (430, 1760, 50), (950, 1400, 40)]), (0, 0), 0)}
      {cut('<rect x="40" y="620" width="18" height="480"/><rect x="330" y="620" width="18" height="480"/><rect x="40" y="610" width="308" height="18"/>', '<g fill="#e8d2a6"><rect x="40" y="620" width="18" height="480"/><rect x="330" y="620" width="18" height="480"/><rect x="40" y="610" width="308" height="18"/></g>', (5, 6), 10)}
    </svg>'''


# ------------------------------------------------------------------ S1
def s1():
    sc = "s1-biel"
    d = D(sc)
    body = f'''
    {sunset_field("s1")}
    {place(biel("s1b"), "s1-biel", 250, 430, 520, 3)}
    <div id="s1-ball" style="position:absolute;left:660px;top:1270px;width:150px;z-index:4">{bola("s1o", False)}</div>
    {onom("s1-pfff", "PFFF…", "#8a8a8a", 110, 640, 1110, -8)}
    <div id="s1-dia" style="position:absolute;left:70px;top:190px;z-index:8"><div id="s1-dia-in" class="card bang" style="position:relative;padding:6px 30px;font-size:110px;color:{RED}">DIA 1</div></div>
    {tape(60, 175, 120, -20)}
    <div id="s1-tit" style="position:absolute;left:70px;top:350px;z-index:8"><div id="s1-tit-in" class="strip mk" style="font-size:40px">O CHAT FAZ UM CRAQUE ⚽</div></div>
    {sticker("s1-tag", '<div class="bang" style="font-size:30px;color:#888">Nº 10</div><div class="bang" style="font-size:64px;color:' + INK + '">BIEL</div><div class="mk" style="font-size:34px">17 anos · zagueiro de chinelo</div>', 620, 560, 380, 7)}
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:5" data-layout-ignore><ellipse id="s1-circle" cx="510" cy="1365" rx="190" ry="70" fill="none" stroke="#fff" stroke-width="10" stroke-dasharray="1300" stroke-dashoffset="1300"/></svg>
    {chalk("s1-chin", "chinelo de dedo!", 140, 1120, 58)}
    <div id="s1-dream" data-layout-allow-overlap style="position:absolute;left:560px;top:420px;width:440px;z-index:6">
      <div id="s1-dream-in" style="position:relative">
        <svg viewBox="0 0 440 380" width="440" height="380" overflow="visible">{cut('<ellipse cx="220" cy="170" rx="210" ry="160"/><circle cx="60" cy="350" r="22"/><circle cx="20" cy="380" r="12"/>', '<ellipse cx="220" cy="170" rx="210" ry="160" fill="#fff"/>', (6, 8), 10)}</svg>
        <div style="position:absolute;left:130px;top:20px;width:180px">{trofeu("s1t")}</div>
        <div class="bang" style="position:absolute;left:0;right:0;top:220px;text-align:center;font-size:44px;color:{INK}">MELHOR DO MUNDO</div></div></div>'''
    js = f'''
      hfStop(tl, ["s1b-rig"], {d});
      tl.fromTo("#s1-dia-in", {{ scale: 1.15, rotation: -10 }}, {{ scale: 1, rotation: -5, duration: .3, ease: "steps(3)" }}, 0);
      tl.fromTo("#s1b-legR", {{ rotation: 0 }}, {{ rotation: -55, duration: .25, ease: "steps(3)", svgOrigin: "285 600" }}, .05);
      tl.to("#s1b-legR", {{ rotation: 0, duration: .25, ease: "steps(3)" }}, .45);
      tl.fromTo("#s1-ball", {{ x: 0, scaleY: 1 }}, {{ x: 140, scaleY: .6, duration: .5, ease: "steps(5)", transformOrigin: "50% 100%" }}, .3);
      hfPop(tl, "#s1-pfff-in", .35, -8);
      tl.to("#s1-pfff-in", {{ scale: 0, duration: .15 }}, {L(sc, 0, "esse") + .6});
      hfSlap(tl, "#s1-tag-in", {L(sc, 0, "biel")}, 4);
      tl.to("#s1-tag-in", {{ opacity: 0, duration: .15 }}, {L(sc, 0, "sonho") - .3});
      tl.fromTo("#s1-circle", {{ strokeDashoffset: 1300 }}, {{ strokeDashoffset: 0, duration: .45, ease: "steps(6)" }}, {L(sc, 0, "chinelo")});
      tl.fromTo("#s1-chin-in", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "steps(3)" }}, {L(sc, 0, "chinelo") + .2});
      hfSet(tl, "s1b", {L(sc, 0, "sonho")}, ["m-o"], ["m-smile"]);
      hfSet(tl, "s1b", {L(sc, 0, "melhor")}, ["m-smile"], ["m-o"]);
      tl.fromTo(".s1b-pupil", {{ y: 0 }}, {{ y: -8, duration: .2, ease: "steps(2)" }}, {L(sc, 0, "sonho")});
      tl.fromTo("#s1-dream-in", {{ scale: 0, rotation: -12 }}, {{ scale: 1, rotation: 0, duration: .4, ease: "back.out(2)", transformOrigin: "10% 95%" }}, {L(sc, 0, "sonho")});
      tl.fromTo("#s1t-rig", {{ rotation: -6 }}, {{ rotation: 6, duration: .25, repeat: 7, yoyo: true, ease: "steps(2)", svgOrigin: "150 250" }}, {L(sc, 0, "melhor")});'''
    write(sc, scene(sc, body, js, bg="#ff9f43"))


# ------------------------------------------------------------------ S2
def s2():
    sc = "s2-chuteira"
    d = D(sc)
    body = f'''
    {kraft("s2", seed=2)}
    {place(chuteira("s2c"), "s2-shoe", 120, 700, 860, 3)}
    {tape(150, 690, 160, -14)}{tape(760, 980, 150, 10)}
    <div id="s2-tag" data-layout-allow-overlap style="position:absolute;left:250px;top:1010px;z-index:6">
      <div id="s2-tag-in" style="position:relative;transform-origin:50% 0%">
        <svg width="20" height="70" style="position:absolute;left:150px;top:-66px" data-layout-ignore><path d="M10 0 Q0 35 10 70" stroke="#5a3b2b" stroke-width="5" fill="none"/></svg>
        <div class="card mk" style="position:relative;padding:14px 22px;font-size:38px;background:#fff7d6">PROPRIEDADE DO<br>PRIMO DO PRIMO</div></div></div>
    {place(silhouette("s2p1", "#5d7a99"), "s2-p1", 140, 230, 200, 4)}
    {place(silhouette("s2p2", "#8a6d9e"), "s2-p2", 640, 230, 200, 4)}
    {chalk("s2-l1", "PRIMO", 150, 620, 46, INK, -3)}
    {chalk("s2-l2", "PRIMO DO PRIMO", 560, 620, 46, INK, 3)}
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:5" data-layout-ignore>
      <path id="s2-a1" d="M520 760 Q420 650 330 560" stroke="{INK}" stroke-width="9" fill="none" stroke-dasharray="400" stroke-dashoffset="400" stroke-linecap="round"/>
      <path id="s2-a2" d="M360 420 Q500 330 630 420" stroke="{INK}" stroke-width="9" fill="none" stroke-dasharray="400" stroke-dashoffset="400" stroke-linecap="round"/></svg>'''
    js = f'''
      hfStop(tl, ["s2c-rig"], {d}, .8);
      tl.fromTo("#s2-shoe", {{ y: -800, rotation: -20 }}, {{ y: 0, rotation: -4, duration: .35, ease: "steps(5)" }}, 0);
      tl.fromTo("#s2-tag-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2)" }}, {L(sc, 1, "primo")});
      tl.fromTo("#s2-tag-in", {{ rotation: -10 }}, {{ rotation: 10, duration: .3, repeat: 5, yoyo: true, ease: "sine.inOut", immediateRender: false }}, {L(sc, 1, "primo") + .3});
      tl.fromTo("#s2-a1", {{ strokeDashoffset: 400 }}, {{ strokeDashoffset: 0, duration: .3, ease: "steps(5)" }}, {L(sc, 1, "primo")});
      hfSlap(tl, "#s2-p1", {L(sc, 1, "primo") + .1}, -3);
      tl.fromTo("#s2-l1-in", {{ scale: 0 }}, {{ scale: 1, duration: .2, ease: "steps(3)" }}, {L(sc, 1, "primo") + .25});
      tl.fromTo("#s2-a2", {{ strokeDashoffset: 400 }}, {{ strokeDashoffset: 0, duration: .3, ease: "steps(5)" }}, {L(sc, 1, "tambem")});
      hfSlap(tl, "#s2-p2", {L(sc, 1, "tambem") + .2}, 3);
      tl.fromTo("#s2-l2-in", {{ scale: 0 }}, {{ scale: 1, duration: .2, ease: "steps(3)" }}, {L(sc, 1, "pegou")});'''
    write(sc, scene(sc, body, js))


# ------------------------------------------------------------------ S3
def s3():
    sc = "s3-bola"
    d = D(sc)
    foot = cut('<path d="M0 60 L260 40 L300 80 L270 130 L0 130 Z"/>', f'<path d="M0 60 L260 40 L300 80 L270 130 L0 130 Z" fill="#8a5a3c"/><path d="M0 120 L280 118 L290 140 L0 142 Z" fill="#3fa7d6"/><path d="M150 50 Q190 90 150 125" stroke="#e8f6ff" stroke-width="10" fill="none"/>')
    body = f'''
    {kraft("s3", "#d9b47a", 3)}
    <div id="s3-ball" style="position:absolute;left:180px;top:620px;width:720px;z-index:3">{bola("s3o")}</div>
    <div id="s3-foot" style="position:absolute;left:-40px;top:900px;width:420px;z-index:4"><svg viewBox="0 0 320 150" overflow="visible">{foot}</svg></div>
    {onom("s3-pfff", "PFFF…", "#7a7a7a", 130, 560, 520, 6)}
    <div id="s3-bub" data-layout-allow-overlap style="position:absolute;left:520px;top:300px;z-index:6">
      <div id="s3-bub-in" style="position:relative;transform-origin:20% 100%">
        <svg viewBox="0 0 420 260" width="420" height="260" overflow="visible">{cut('<ellipse cx="210" cy="110" rx="200" ry="100"/><path d="M80 180 L40 260 L150 195 Z"/>', '<ellipse cx="210" cy="110" rx="200" ry="100" fill="#fff"/><path d="M80 180 L40 260 L150 195 Z" fill="#fff"/>', (6, 8), 10)}</svg>
        <div class="mk" style="position:absolute;left:0;right:0;top:60px;text-align:center;font-size:62px">foi mal 😔</div></div></div>'''
    js = f'''
      hfStop(tl, ["s3o-rig"], {d}, 1.2);
      tl.fromTo("#s3-ball", {{ scale: .8 }}, {{ scale: 1, duration: .3, ease: "steps(3)" }}, 0);
      tl.fromTo("#s3-foot", {{ x: -500 }}, {{ x: 120, duration: .25, ease: "steps(3)" }}, {L(sc, 2, "chuta") - .25});
      tl.to("#s3-foot", {{ x: -500, duration: .3, ease: "steps(3)" }}, {L(sc, 2, "chuta") + .4});
      tl.fromTo("#s3-ball", {{ scaleX: 1, scaleY: 1 }}, {{ scaleX: 1.15, scaleY: .7, duration: .15, ease: "steps(2)", transformOrigin: "50% 100%", immediateRender: false }}, {L(sc, 2, "chuta")});
      tl.to("#s3-ball", {{ x: 90, scaleX: 1, scaleY: .85, duration: .5, ease: "steps(5)" }}, {L(sc, 2, "chuta") + .15});
      hfPop(tl, "#s3-pfff-in", {L(sc, 2, "chuta") + .1}, 6);
      tl.to("#s3-pfff-in", {{ scale: 0, duration: .15 }}, {L(sc, 2, "pede") - .1});
      tl.fromTo("#s3-bub-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2)" }}, {L(sc, 2, "pede")});'''
    write(sc, scene(sc, body, js))


# ------------------------------------------------------------------ S4
def s4():
    sc = "s4-noticia"
    d = D(sc)
    body = f'''
    {kraft("s4", "#e0c08a", 4)}
    <div id="s4-poster" data-layout-allow-overlap style="position:absolute;left:130px;top:230px;width:820px;z-index:3">
      <div id="s4-poster-in" class="card" style="position:relative;padding:26px 30px;background:#fffbe6;text-align:center">
        <div id="s4-l1" class="bang" style="font-size:52px;color:{BLUE}">⚽ OLHEIRO EUROPEU ⚽</div>
        <div id="s4-l2" class="bang" style="font-size:170px;color:{RED};line-height:.95">PENEIRA</div>
        <div id="s4-l3" class="bang" style="font-size:44px;color:{INK}">NO CAMPO DO BAIRRO</div>
        <div id="s4-l4" class="mk" style="font-size:66px;color:{INK};margin-top:8px">DAQUI 30 DIAS!</div></div></div>
    {tape(120, 215, 150, -18)}{tape(820, 215, 150, 16)}
    <div id="s4-stamp" data-layout-allow-overlap style="position:absolute;left:250px;top:700px;z-index:7">
      <div id="s4-stamp-in" class="bang" style="font-size:72px;color:{RED};border:9px solid {RED};padding:6px 24px;border-radius:14px;background:rgba(255,255,255,.75)">SÓ 1 SERÁ ESCOLHIDO!</div></div>
    {place(vo_cida("s4v"), "s4-vo", 260, 820, 560, 4)}
    {onom("s4-oi", "BIEEEL!", RED, 110, 600, 820, 8)}'''
    shouts = "".join(f'hfSet(tl, "s4v", {t:.2f}, ["m-shout"], ["m-talk"]); hfSet(tl, "s4v", {t + .18:.2f}, ["m-talk"], ["m-shout"]);\n      '
                     for t in [x * .36 for x in range(int(d / .36))])
    js = f'''
      hfStop(tl, ["s4v-rig"], {d}, 1.2);
      tl.fromTo("#s4-vo", {{ x: 900 }}, {{ x: 0, duration: .5, ease: "steps(6)" }}, 0);
      hfPop(tl, "#s4-oi-in", .2, 8);
      tl.to("#s4-oi-in", {{ scale: 0, duration: .15 }}, 1.3);
      {shouts}
      hfSlap(tl, "#s4-poster-in", {L(sc, 3, "noticia") - .2}, -2);
      tl.fromTo("#s4-l1", {{ opacity: 0 }}, {{ opacity: 1, duration: .1 }}, {L(sc, 3, "olheiro")});
      tl.fromTo("#s4-l2", {{ opacity: 0, scale: 1.4 }}, {{ opacity: 1, scale: 1, duration: .2, ease: "steps(3)" }}, {L(sc, 3, "peneira")});
      tl.fromTo("#s4-l3", {{ opacity: 0 }}, {{ opacity: 1, duration: .1 }}, {L(sc, 3, "bairro")});
      tl.fromTo("#s4-l4", {{ opacity: 0, scale: 1.3 }}, {{ opacity: 1, scale: 1, duration: .2, ease: "steps(3)" }}, {L(sc, 3, "daqui")});
      tl.fromTo("#s4-stamp-in", {{ scale: 2.4, opacity: 0, rotation: -20 }}, {{ scale: 1, opacity: 1, rotation: -8, duration: .16, ease: "power4.in" }}, {L(sc, 3, "garoto")});'''
    write(sc, scene(sc, body, js))


# ------------------------------------------------------------------ S5
def s5():
    sc = "s5-kaua"
    d = D(sc)
    gold = chuteira("s5g").replace('fill="#2b2b2b"', 'fill="#f2c230"').replace('fill="#c0392b"', 'fill="#fff6c2"')
    body = f'''
    {kraft("s5", "#bfa0d9", 5)}
    <div id="s5-q" style="position:absolute;left:0;right:0;top:640px;text-align:center;z-index:3"><div id="s5-q-in" class="bang" style="display:inline-block;font-size:400px;color:{INK};opacity:.85">?</div></div>
    <div id="s5-card" data-layout-allow-overlap style="position:absolute;left:230px;top:250px;width:620px;z-index:4">
      <div id="s5-card-in" style="position:relative;border:14px solid #fff;box-shadow:12px 14px 0 rgba(0,0,0,.3);border-radius:18px;overflow:hidden">
        <div id="s5-holo" style="position:absolute;inset:0;background:linear-gradient(115deg,#ff9a9e,#fad0c4,#a1c4fd,#c2e9fb,#d4fc79,#fbc2eb,#ff9a9e);background-size:300% 300%"></div>
        <div style="position:relative;padding:20px 30px 10px">
          <div class="bang" style="font-size:44px;color:{INK}">Nº 7 · RARA ✨</div>
          <div style="width:440px;margin:6px auto 0">{kaua("s5k")}</div>
          <div class="bang" style="text-align:center;font-size:96px;color:#fff;-webkit-text-stroke:8px {INK};paint-order:stroke fill">KAUÃ</div></div></div></div>
    {sticker("s5-mkt", '<div class="mk" style="font-size:40px">filho do dono do<br>MERCADINHO 🛒</div>', 90, 880, 420, 6, "background:#fff7d6")}
    {place(gold, "s5-gold", 70, 1060, 480, 5)}
    {place(silhouette("s5pt", "#3d3d3d", True), "s5-pt", 760, 820, 190, 5)}
    {chalk("s5-ptl", "personal", 720, 760, 40, INK, 4)}
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:2" data-layout-ignore>
      <g id="s5-shadow" opacity=".35"><ellipse cx="560" cy="1720" rx="120" ry="26" fill="#000"/><path d="M500 1700 L520 1460 L600 1460 L620 1700 Z" fill="#000"/><circle cx="560" cy="1420" r="44" fill="#000"/></g>
      <circle id="s5-sball" cx="600" cy="1640" r="26" fill="#000" opacity=".4"/></svg>'''
    js = f'''
      tl.fromTo("#s5-q-in", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "steps(3)" }}, 0);
      tl.to("#s5-q-in", {{ opacity: 0, duration: .1 }}, {L(sc, 4, "kaua") - .1});
      tl.fromTo("#s5-card-in", {{ rotationY: 180, scale: .3, rotation: 30 }}, {{ rotationY: 0, scale: 1, rotation: -3, duration: .45, ease: "steps(6)" }}, {L(sc, 4, "kaua") - .15});
      tl.fromTo("#s5-holo", {{ backgroundPosition: "0% 50%" }}, {{ backgroundPosition: "100% 50%", duration: {d}, ease: "none" }}, 0);
      hfStop(tl, ["s5k-rig"], {d}, .8);
      hfSlap(tl, "#s5-mkt-in", {L(sc, 4, "filho")}, -4);
      tl.fromTo("#s5-gold", {{ y: 700, rotation: 20 }}, {{ y: 0, rotation: -6, duration: .35, ease: "steps(5)" }}, {L(sc, 4, "chuteira")});
      hfSlap(tl, "#s5-pt", {L(sc, 4, "personal")}, 3);
      tl.fromTo("#s5-ptl-in", {{ scale: 0 }}, {{ scale: 1, duration: .2, ease: "steps(3)" }}, {L(sc, 4, "personal") + .1});
      tl.fromTo("#s5-shadow", {{ opacity: 0 }}, {{ opacity: .35, duration: .3 }}, {L(sc, 4, "sombra") - .2});
      tl.fromTo("#s5-sball", {{ y: 0, opacity: 0 }}, {{ y: -260, opacity: .45, duration: .25, repeat: 9, yoyo: true, ease: "power1.out" }}, {L(sc, 4, "sombra")});'''
    write(sc, scene(sc, body, js, bg="#bfa0d9"))


# ------------------------------------------------------------------ carta do jogador (barras)
STATS = [("⚽", "HABILIDADE", 35, "#4cc9f0"), ("💪", "FÍSICO", 20, "#ff8fa3"), ("💰", "DINHEIRO", 5, YEL), ("🧠", "CABEÇA", 25, "#b18cff")]


def s6():
    sc = "s6-carta"
    d = D(sc)
    rows = "".join(f'''<div id="s6-r{i}" style="position:relative;display:flex;align-items:center;gap:14px;margin:12px 0">
        <div style="font-size:52px;width:64px;text-align:center">{ic}</div>
        <div style="flex:1"><div class="bang" style="font-size:38px;color:{INK}">{nm}</div>
          <div style="position:relative;height:34px;background:#e9e1cc;border:5px solid {INK};border-radius:18px;overflow:hidden">
            <div id="s6-f{i}" style="width:{v}%;height:100%;background:{c};transform-origin:0% 50%"></div>
            <div class="s6-meta" style="position:absolute;left:70%;top:-4px;width:7px;height:40px;background:{RED}"></div></div></div>
        <div class="bang" style="font-size:58px;width:84px;text-align:right;color:{INK}">{v}</div></div>''' for i, (ic, nm, v, c) in enumerate(STATS))
    body = f'''
    {kraft("s6", "#9ccf9a", 6)}
    <div id="s6-card" data-layout-allow-overlap style="position:absolute;left:120px;top:220px;width:840px;z-index:3">
      <div id="s6-card-in" class="card" style="position:relative;padding:24px 34px 18px;background:#fffdf3">
        <div style="display:flex;align-items:center;gap:20px">
          <div style="width:200px;height:200px;overflow:hidden;border:6px solid {INK};border-radius:16px;background:#ffd8a8">
            <div style="width:300px;margin:-30px 0 0 -50px">{biel("s6b")}</div></div>
          <div><div class="bang" style="font-size:40px;color:#888">Nº 10 · COMUM</div>
            <div class="bang" style="font-size:110px;color:{INK}">BIEL</div></div></div>
        {rows}
        <svg width="840" height="10" style="position:absolute;left:-10px;top:330px" data-layout-ignore><path d="M0 5 L300 0 L520 9 L840 3" stroke="#d8cfb6" stroke-width="3" fill="none"/></svg></div></div>
    <div id="s6-meta-tag" data-layout-allow-overlap style="position:absolute;left:640px;top:440px;z-index:6"><div id="s6-meta-tag-in" class="bang" style="font-size:54px;color:#fff;background:{RED};padding:4px 20px;border:6px solid #fff;box-shadow:6px 6px 0 rgba(0,0,0,.3)">META: 70</div></div>
    <div id="s6-pic" data-layout-allow-overlap style="position:absolute;left:720px;top:880px;width:180px;z-index:7">{picole("s6p")}</div>
    {chalk("s6-pict", "R$ 5 = 1 picolé<br>(não comprou)", 370, 1060, 46, INK, -3)}'''
    js = f'''
      hfSlap(tl, "#s6-card-in", 0, -2);
      [{",".join(str(L(sc, 5, w)) for w in ("habilidade", "fisico", "dinheiro", "cabeca"))}].forEach((t, i) => {{
        tl.fromTo("#s6-r" + i, {{ opacity: .15 }}, {{ opacity: 1, duration: .1 }}, t);
        tl.fromTo("#s6-f" + i, {{ scaleX: 0 }}, {{ scaleX: 1, duration: .35, ease: "steps(5)" }}, t);
      }});
      tl.fromTo("#s6-meta-tag-in", {{ scale: 2.4, opacity: 0, rotation: 20 }}, {{ scale: 1, opacity: 1, rotation: 6, duration: .16, ease: "power4.in" }}, {L(sc, 5, "setenta")});
      tl.fromTo(".s6-meta", {{ scaleY: 0 }}, {{ scaleY: 1, duration: .2, ease: "steps(3)" }}, {L(sc, 5, "setenta")});
      tl.fromTo("#s6-r2", {{ scale: 1 }}, {{ scale: 1.08, duration: .2, repeat: 3, yoyo: true, ease: "steps(2)", immediateRender: false }}, {L(sc, 5, "dinheiro", 1)});
      hfSlap(tl, "#s6-pic", {L(sc, 5, "picole")}, 12);
      tl.fromTo("#s6-pict-in", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "steps(3)" }}, {L(sc, 5, "preco")});'''
    write(sc, scene(sc, body, js, bg="#9ccf9a"))


# ------------------------------------------------------------------ S7
def s7():
    sc = "s7-voce"
    d = D(sc)
    body = f'''
    {kraft("s7", "#f7c59f", 7)}
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:1">{"".join(f'<path d="M540 900 L{540 + 1500 * __import__("math").cos(a / 22 * 6.283):.0f} {900 + 1500 * __import__("math").sin(a / 22 * 6.283):.0f} L{540 + 1500 * __import__("math").cos((a + .45) / 22 * 6.283):.0f} {900 + 1500 * __import__("math").sin((a + .45) / 22 * 6.283):.0f} Z" fill="#fff" opacity=".35"/>' for a in range(22))}</svg>
    {place(biel("s7b"), "s7-biel", 190, 380, 700, 3)}
    {chalk("s7-tec", "VOCÊ É O TÉCNICO!", 110, 330, 86, RED, -5, 8)}
'''
    js = f'''
      hfStop(tl, ["s7b-rig"], {d});
      tl.fromTo("#s7-biel", {{ scale: 1 }}, {{ scale: 1.12, duration: {d}, ease: "none", transformOrigin: "50% 30%" }}, 0);
      hfSet(tl, "s7b", 0, ["br-worry"], ["br-up"]);
      tl.fromTo(".s7b-pupil", {{ x: 0 }}, {{ x: -10, duration: .2, ease: "steps(2)" }}, .6);
      tl.to(".s7b-pupil", {{ x: 10, duration: .2, ease: "steps(2)" }}, 1.4);
      tl.to(".s7b-pupil", {{ x: 0, duration: .2, ease: "steps(2)" }}, {L(sc, 6, "quem")});
      hfSet(tl, "s7b", {L(sc, 6, "quem")}, ["br-up", "m-smile"], ["br-worry"]);
      tl.fromTo("#s7b-armR", {{ rotation: 0 }}, {{ rotation: -95, duration: .3, ease: "steps(4)", svgOrigin: "340 350" }}, {L(sc, 6, "voce") - .3});
      tl.fromTo("#s7-tec-in", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "steps(3)" }}, {L(sc, 6, "quem")});
'''
    write(sc, scene(sc, body, js, bg="#f7c59f"))


# ------------------------------------------------------------------ S8 decisão (prancheta)
def chip(cid, text, col):
    return (f'<div id="{cid}" style="display:inline-block;margin:5px;font-family:Bangers;font-size:40px;letter-spacing:.03em;color:{INK};'
            f'background:{col};border:5px solid {INK};border-radius:14px;padding:2px 14px">{text}</div>')


def s8():
    sc = "s8-decisao"
    d = D(sc)
    lines = '<g stroke="#fff" stroke-width="6" fill="none" opacity=".35"><rect x="60" y="200" width="960" height="1500"/><line x1="60" y1="950" x2="1020" y2="950"/><circle cx="540" cy="950" r="150"/><rect x="330" y="200" width="420" height="200"/><rect x="330" y="1500" width="420" height="200"/></g>'

    def card(k, letter, col, who, title, chips, x):
        return f'''<div id="s8-{k}" data-layout-allow-overlap style="position:absolute;left:{x}px;top:600px;width:400px;z-index:5">
          <div id="s8-{k}-in" class="card" style="position:relative;padding:18px 14px;text-align:center;background:{col}">
            <div class="bang" style="position:absolute;left:-28px;top:-38px;width:100px;height:100px;border-radius:50%;background:#fff;border:7px solid {INK};font-size:70px;line-height:88px;color:{INK}">{letter}</div>
            <div style="width:190px;height:190px;margin:0 auto;overflow:hidden">{who}</div>
            <div class="bang" style="font-size:56px;color:#fff;-webkit-text-stroke:7px {INK};paint-order:stroke fill;margin:4px 0">{title}</div>
            {chips}</div></div>'''
    vo_mini = f'<div style="width:220px;margin:-6px 0 0 -15px">{vo_cida("s8v")}</div>'
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#2f5d3a"/>{lines}</svg>
    {chalk("s8-t", "SÁBADO, 8H ⏰", 250, 330, 84, "#fff", -3, 6)}
    <div id="s8-vs" data-layout-allow-overlap style="position:absolute;left:0;right:0;top:640px;z-index:4;text-align:center">
      <div id="s8-vs-in" style="display:inline-flex;align-items:center;gap:40px">
        <div id="s8-feira" class="card" style="position:relative;width:340px;padding:14px;text-align:center"><div style="width:200px;margin:0 auto">{vo_cida("s8v0")}</div><div class="mk" style="font-size:40px">feira 🥟</div></div>
        <div id="s8-vsx" class="bang" style="font-size:120px;color:{YEL}">VS</div>
        <div id="s8-treino" class="card" style="position:relative;width:340px;padding:14px;text-align:center"><div style="width:200px;margin:0 auto">{bigode("s8g0")}</div><div class="mk" style="font-size:40px">treino ⚽</div></div></div></div>
    {card("a", "A", "#f4a261", vo_mini, "AJUDAR A VÓ", chip("s8-a1", "💰 +10", YEL) + chip("s8-a2", "⚽ −5", "#ff8fa3"), 100)}
    {card("b", "B", "#3a86ff", bigode("s8g"), "IR PRO TREINO", chip("s8-b1", "⚽ +10", "#8ce99a") + chip("s8-b2", "🧠 +5", "#8ce99a") + chip("s8-b3", "💰 −5", "#ff8fa3"), 560)}
    <div id="s8-zera" data-layout-allow-overlap style="position:absolute;left:590px;top:430px;z-index:7"><div id="s8-zera-in" class="bang" style="font-size:64px;color:{RED};border:8px solid {RED};padding:2px 18px;border-radius:12px;background:rgba(255,255,255,.9)">⚠️ ZERA!</div></div>
    <div id="s8-com" style="position:absolute;left:0;right:0;top:1120px;text-align:center;z-index:8"><div id="s8-com-in" class="strip bang" style="font-size:80px;color:{INK}">COMENTA <span style="color:#e76f00">A</span> OU <span style="color:#1d4ed8">B</span> 👇</div></div>'''
    js = f'''
      tl.fromTo("#s8-t-in", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "steps(3)" }}, {L(sc, 7, "sabado")});
      tl.fromTo("#s8-feira", {{ x: -600 }}, {{ x: 0, duration: .35, ease: "steps(5)" }}, {L(sc, 7, "vo")});
      tl.fromTo("#s8-treino", {{ x: 600 }}, {{ x: 0, duration: .35, ease: "steps(5)" }}, {L(sc, 7, "treino")});
      hfPop(tl, "#s8-vsx", {L(sc, 7, "mesmo")}, 0);
      tl.to("#s8-vs-in", {{ opacity: 0, duration: .15 }}, {L(sc, 7, "ajudar") - .2});
      tl.to("#s8-t-in", {{ opacity: 0, duration: .15 }}, {L(sc, 7, "ajudar") - .2});
      hfSlap(tl, "#s8-a-in", {L(sc, 7, "ajudar")}, -3);
      hfPop(tl, "#s8-a1", {L(sc, 7, "ganha")}, -3); hfPop(tl, "#s8-a2", {L(sc, 7, "perde")}, 3);
      hfSlap(tl, "#s8-b-in", {L(sc, 7, "ir")}, 3);
      hfPop(tl, "#s8-b1", {L(sc, 7, "melhora")}, -3); hfPop(tl, "#s8-b2", {L(sc, 7, "melhora") + .3}, 3); hfPop(tl, "#s8-b3", {L(sc, 7, "dinheiro", 1)}, -2);
      tl.fromTo("#s8-zera-in", {{ scale: 2.4, opacity: 0, rotation: -25 }}, {{ scale: 1, opacity: 1, rotation: -10, duration: .16, ease: "power4.in" }}, {L(sc, 7, "zera")});
      tl.fromTo("#s8-com-in", {{ scale: 0, rotation: -8 }}, {{ scale: 1, rotation: -2, duration: .3, ease: "back.out(2.5)" }}, {L(sc, 7, "comenta")});
      tl.fromTo("#s8-com-in", {{ scale: 1 }}, {{ scale: 1.07, duration: .2, repeat: 3, yoyo: true, ease: "steps(2)", immediateRender: false }}, {L(sc, 7, "comenta") + .4});'''
    write(sc, scene(sc, body, js, bg="#2f5d3a"))


# ------------------------------------------------------------------ S9 final
def s9():
    sc = "s9-final"
    d = D(sc)
    import random
    rnd = random.Random(9)
    stars = "".join(f'<path d="M{(x := rnd.uniform(60, 1020)):.0f} {(y := rnd.uniform(160, 760)):.0f} l6 14 l15 2 l-11 10 l3 15 l-13 -8 l-13 8 l3 -15 l-11 -10 l15 -2 Z" fill="#fff6c2"/>' for _ in range(16))
    gold = chuteira("s9g").replace('fill="#2b2b2b"', 'fill="#f2c230"').replace('fill="#c0392b"', 'fill="#fff6c2"')
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#1b2a4a"/>{stars}
      {cut('<circle cx="860" cy="330" r="90"/>', '<circle cx="860" cy="330" r="90" fill="#fff6c2"/><circle cx="890" cy="310" r="80" fill="#1b2a4a"/>', (0, 0), 10)}
      {cut('<rect x="80" y="1230" width="920" height="200" rx="40"/>', '<rect x="80" y="1230" width="920" height="200" rx="40" fill="#5d7a99"/><rect x="100" y="1200" width="260" height="90" rx="40" fill="#e9e1cc"/>', (6, 8), 12)}
      {cut('<rect x="640" y="560" width="340" height="300"/>', '<rect x="640" y="560" width="340" height="300" fill="#0f1830"/><line x1="810" y1="560" x2="810" y2="860" stroke="#e9e1cc" stroke-width="12"/><line x1="640" y1="710" x2="980" y2="710" stroke="#e9e1cc" stroke-width="12"/>', (6, 8), 12)}</svg>
    <div id="s9-gold" style="position:absolute;left:670px;top:620px;width:280px;z-index:1">{gold}</div>
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:2" data-layout-ignore><g id="s9-shine" fill="#fff6c2">{"".join(f'<path d="M{810 + 200 * __import__("math").cos(a):.0f} {700 + 200 * __import__("math").sin(a):.0f} l10 -30 l10 30 Z"/>' for a in [k * .785 for k in range(8)])}</g></svg>
    <div id="s9-biel" style="position:absolute;left:150px;top:620px;width:520px;z-index:3;transform-origin:50% 50%">{biel("s9b")}</div>
    <div id="s9-ball" style="position:absolute;left:470px;top:1080px;width:200px;z-index:4">{bola("s9o", False)}</div>
    {onom("s9-z", "Zzz…", "#cfd8ff", 100, 170, 920, -8)}
    <div id="s9-t" style="position:absolute;left:0;right:0;top:220px;text-align:center;z-index:6"><div id="s9-t-in" class="bang" style="display:inline-block;font-size:96px;color:{YEL};text-shadow:6px 8px 0 rgba(0,0,0,.4)">FALTAM 30 DIAS<br>PRA PENEIRA…</div></div>
    <div id="s9-end" class="clip" data-start="{d - 2.1:.2f}" data-duration="2.1" style="position:absolute;left:0;right:0;top:1240px;text-align:center;z-index:9"><div id="s9-end-in" class="strip bang" style="font-size:52px;color:{RED}">DIA 2 AMANHÃ · COMENTA A OU B 👇</div></div>'''
    js = f'''
      tl.set("#s9-biel", {{ rotation: -84 }}, 0);
      hfSet(tl, "s9b", 0, ["eyes-closed", "m-o"], ["eyes", "m-smile"]);
      hfStop(tl, ["s9b-rig"], {d}, .6);
      tl.fromTo("#s9-t-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "steps(4)" }}, .05);
      hfPop(tl, "#s9-z-in", .4, -8);
      tl.fromTo("#s9-z-in", {{ y: 0 }}, {{ y: -40, duration: .6, repeat: 5, yoyo: true, ease: "steps(3)", immediateRender: false }}, .8);
      tl.fromTo("#s9-shine", {{ opacity: 0, rotation: 0 }}, {{ opacity: 1, rotation: 30, duration: 1.2, ease: "none", svgOrigin: "810 700" }}, {L(sc, 8, "kaua") - .2});
      tl.fromTo("#s9-gold", {{ scale: .8 }}, {{ scale: 1.1, duration: .3, repeat: 3, yoyo: true, ease: "steps(2)" }}, {L(sc, 8, "kaua")});
      tl.fromTo("#s9-end-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2)" }}, {d - 2.1:.2f});'''
    write(sc, scene(sc, body, js, bg="#1b2a4a"))


# ------------------------------------------------------------------ HUD + legendas
def hud(start, end):
    cid = "hud"
    items = "".join(f'<div style="display:flex;align-items:center;gap:6px"><div style="font-size:32px">{ic}</div>'
                    f'<div style="width:96px;height:20px;background:#e9e1cc;border:4px solid {INK};border-radius:10px;overflow:hidden;position:relative">'
                    f'<div style="width:{v}%;height:100%;background:{c}"></div><div style="position:absolute;left:70%;top:0;width:4px;height:100%;background:{RED}"></div></div></div>'
                    for ic, _, v, c in STATS)
    body = f'''<div id="hud-box" style="position:absolute;left:70px;top:180px;width:820px;z-index:2">
      <div id="hud-in" class="card" style="display:flex;align-items:center;gap:18px;padding:8px 18px">
        <div class="bang" style="font-size:34px;line-height:1;color:{INK};text-align:center">⏳ 30<br>DIAS</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px">{items}</div></div></div>'''
    js = f'''tl.fromTo("#hud-in", {{ y: -260 }}, {{ y: 0, duration: .3, ease: "steps(4)" }}, 0);
      tl.to("#hud-in", {{ y: -460, duration: .25, ease: "steps(3)" }}, {round(end - start - .3, 2)});'''
    write(cid, scene(cid, body, js, "#root { background: transparent; }", bg="transparent"))


def caps():
    cid = "caps"
    groups = {}
    for i, w in enumerate(WORDS):
        groups.setdefault((w[0], w[1]), []).append(w)
    keys = list(groups)
    html, js = [], []
    for gi, k in enumerate(keys):
        ws = groups[k]
        st, en = ws[0][4], ws[-1][5]
        start = max(0.1, st - .05)
        nxt = groups[keys[gi + 1]][0][4] if gi + 1 < len(keys) else None
        end = (nxt - .08) if nxt is not None and nxt - en < .4 else en + .3
        spans = " ".join(f'<span id="cw{gi}-{j}">{w[2]}</span>' for j, w in enumerate(ws))
        rot = (-1.6, 1.3, -.8, 1.7)[gi % 4]
        html.append(f'<div id="cg{gi}" class="clip cg" data-start="{start:.2f}" data-duration="{max(.2, end - start):.2f}"><div id="cg{gi}-in" class="strip mk cbox">{spans}</div></div>')
        js.append(f'tl.fromTo("#cg{gi}-in", {{ scale: .7, rotation: {rot - 5} }}, {{ scale: 1, rotation: {rot}, duration: .16, ease: "steps(3)" }}, {start:.2f});')
        for j, w in enumerate(ws):
            js.append(f'tl.fromTo("#cw{gi}-{j}", {{ color: "{INK}" }}, {{ color: "{RED}", duration: .04, immediateRender: false }}, {w[4]:.2f});')
    css = '''#root { background: transparent; }
      .cg { position:absolute; left:90px; right:150px; top:1232px; text-align:center; }
      .cbox { font-size:50px; max-width:840px; }'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


# ------------------------------------------------------------------ áudio + raiz
def sfx_list():
    return [
        ("chute.wav", .2, .55), ("pfff.wav", .35, .45), ("fita.wav", W(0, "biel"), .45), ("papel.wav", W(0, "chinelo"), .35),
        ("sparkle.mp3", W(0, "sonho"), .35),
        ("whoosh.mp3", PSTART[1] - .1, .35), ("fita.wav", W(1, "primo"), .45), ("pop.mp3", W(1, "primo") + .1, .3), ("pop.mp3", W(1, "tambem") + .2, .3),
        ("chute.wav", W(2, "chuta"), .55), ("pfff.wav", W(2, "chuta") + .1, .5), ("pop.mp3", W(2, "pede"), .35),
        ("whoosh.mp3", PSTART[3] - .1, .35), ("fita.wav", W(3, "noticia") - .2, .4), ("pop.mp3", W(3, "peneira"), .35),
        ("pop.mp3", W(3, "daqui"), .3), ("carimbo.wav", W(3, "garoto"), .65),
        ("papel.wav", PSTART[4] - .1, .35), ("sparkle.mp3", W(4, "kaua"), .45), ("fita.wav", W(4, "filho"), .4),
        ("sparkle.mp3", W(4, "chuteira"), .3), ("pop.mp3", W(4, "personal"), .3), ("boing.wav", W(4, "sombra"), .3),
        ("papel.wav", PSTART[5] - .1, .35), ("carimbo.wav", W(5, "setenta"), .5), ("pop.mp3", W(5, "habilidade"), .3), ("pop.mp3", W(5, "fisico"), .3),
        ("pop.mp3", W(5, "dinheiro"), .3), ("pop.mp3", W(5, "cabeca"), .3), ("boing.wav", W(5, "dinheiro", 1), .35), ("fita.wav", W(5, "picole"), .4),
        ("whoosh.mp3", PSTART[6] - .1, .35), ("apito.wav", W(6, "voce"), .45),
        ("papel.wav", W(7, "sabado"), .3), ("whoosh-short.mp3", W(7, "vo"), .3), ("apito.wav", W(7, "bigode"), .4),
        ("fita.wav", W(7, "ajudar"), .45), ("pop.mp3", W(7, "ganha"), .3), ("pop.mp3", W(7, "perde"), .3),
        ("fita.wav", W(7, "ir"), .45), ("pop.mp3", W(7, "melhora"), .3), ("carimbo.wav", W(7, "zera"), .65), ("sparkle.mp3", W(7, "comenta"), .35),
        ("whoosh-short.mp3", PSTART[8] - .1, .3), ("ronco.wav", PSTART[8] + .3, .35), ("sparkle.mp3", W(8, "kaua"), .3),
    ]


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = [f'''      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s}" data-duration="{e - s:.2f}"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:1"></div>''' for c, s, e in SCENES]
    hs, he = SC["s7-voce"][0], SC["s9-final"][0]
    hosts.append(f'''      <div id="hud" data-composition-id="hud" data-composition-src="compositions/hud.html" data-start="{hs}" data-duration="{he - hs:.2f}"
        data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:10"></div>''')
    hosts.append(f'''      <div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>''')
    vd = round(dur(os.path.join(ROOT, "assets/voice/narracao-craque01.wav")), 2)
    audio = [f'      <audio id="voz" class="clip" src="assets/voice/narracao-craque01.wav" data-start="0" data-duration="{vd}" data-volume="1" data-track-index="4"></audio>',
             f'      <audio id="trilha" class="clip" src="assets/music/samba-eitabyte.mp3" data-start="0" data-duration="{TOTAL}" data-media-start="0.86" data-volume="0.13" data-fade-out="1.5" data-track-index="5"></audio>']
    lanes = []
    for i, (f, st, vol) in enumerate(sfx_list()):
        st = round(max(0, st), 2)
        d = round(min(dur(os.path.join(ROOT, "assets/sfx", f)), TOTAL - st, 2.5), 2)
        lane = next((k for k, end in enumerate(lanes) if end <= st), None)
        if lane is None:
            lanes.append(0)
            lane = len(lanes) - 1
        lanes[lane] = st + d
        audio.append(f'      <audio id="sfx-{i:02d}-{f.split(".")[0]}" class="clip" src="assets/sfx/{f}" data-start="{st}" data-duration="{d}" data-volume="{vol}" data-track-index="{6 + lane}"></audio>')
    nl = "\n"
    return f'''<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #c9a56d; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
    </style>
  </head>
  <body>
    <!-- O Chat Faz um Craque — DIA 1 (gerado por tools/build_craque_dia01.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script>
      gsap.defaults({{ ease: "power3.out", duration: 0.6 }});
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''


if __name__ == "__main__":
    os.makedirs(COMP, exist_ok=True)
    for fn in (s1, s2, s3, s4, s5, s6, s7, s8, s9, caps):
        fn()
    hud(SC["s7-voce"][0], SC["s9-final"][0])
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "craque-dia01", "name": "O Chat Faz um Craque — DIA 1", "createdAt": "2026-11-06T23:00:00.000Z"}, f, ensure_ascii=False, indent=2)
    unmatched = [w[2] for w in WORDS if w[4] is None]
    print("ok", TOTAL, [(n, s, e) for n, s, e in SCENES])
