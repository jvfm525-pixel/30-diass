"""Gera o DIA 2 (B venceu: foi pro treino) de "O Chat Faz um Craque" em craque-dia02/.

Estilo Álbum de Figurinhas, com o Biel desenhado pelas barras e a cena
"O QUE MUDOU". Uso: python3 tools/build_craque_dia02.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from build_craque_dia01 import chalk, onom, place, sticker, sunset_field  # noqa: E402
from figurinha_lib import (BLUE, GREEN, INK, RED, YEL, biel, bigode, cut, kaua, kraft,  # noqa: E402
                           scene, silhouette, tape, vo_cida)
from figurinha_upgrade import figurinha_upgrade  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "craque-dia02")
COMP = os.path.join(ROOT, "compositions")
BEFORE = {"s": 35, "f": 20, "m": 5, "c": 25}
AFTER = {"s": 45, "f": 20, "m": 0, "c": 30}
DAYS_LEFT = 28
STATS = [("s", "⚽", "HABILIDADE", "#4cc9f0"), ("f", "💪", "FÍSICO", "#ff8fa3"), ("m", "💰", "DINHEIRO", YEL), ("c", "🧠", "CABEÇA", "#b18cff")]

PARS = [
    "Dia 2.|Vocês escolheram B:|o Biel foi pro treino.",
    "E a Vó Cida foi pra feira sozinha…|e vendeu tudo.|Disse que foi o melhor dia do ano,|porque ninguém comeu|os salgados escondido.",
    "No treino,|o Biel deu um chapéu tão bonito…|que até o cachorro do campo|aplaudiu.",
    "O Professor Bigode alisou o bigode|e soltou a frase do dia:|tem futuro…|mas tá precisando|de um prato de comida.",
    "Habilidade subiu 10.|Cabeça subiu 5.|E o dinheiro…|zerou.",
    "No bolso:|um botão,|uma bala de menta…|e a esperança.",
    "Mas teve upgrade:|a cabeça subiu de nível.|Olha a postura dele!|Parece até que dormiu bem.",
    "E justo amanhã|tem o primeiro amistoso,|no bairro vizinho.|São 8 quilômetros…|e a passagem custa 5 reais.",
    "Enquanto isso,|o Kauã postou foto|indo pro amistoso…|de carro, com motorista.",
    "Próxima decisão:|como o Biel chega no amistoso?|Ir correndo os 8 quilômetros…|ou pedir carona pro Kauã?|Uma mexe com o corpo…|a outra com o orgulho.|Qual vale mais?|Comenta A ou B!",
    "Faltam 28 dias pra peneira…|e o Kauã tá de olho.",
]
FIX = {"ea": ["e", "a"], "avocida": ["a", "vo", "cida"], "kaohan": ["kaua"], "para": ["pra"], "alizou": ["alisou"],
       "esta": ["ta"], "diz": ["disse"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-resultado", "s2-feira", "s3-chapeu", "s4-bigode", "s5-carta", "s6-bolso", "s7-mudou", "s8-mapa", "s9-kaua", "s10-decisao", "s11-final"]
SCENES = []
for k, n in enumerate(NAMES):
    s = 0.0 if k == 0 else round(PSTART[k] - .12, 2)
    e = TOTAL if k == len(NAMES) - 1 else round(PSTART[k + 1] - .12, 2)
    SCENES.append((n, s, e))
SC = {n: (s, e) for n, s, e in SCENES}


def W(par, word, nth=0):
    hits = [w for w in WORDS if w[0] == par and w[3].startswith(norm(word))]
    return round(hits[nth][4], 2)


def L(sc, par, word, nth=0, off=0.0):
    return round(W(par, word, nth) - SC[sc][0] + off, 2)


def D(sc):
    return round(SC[sc][1] - SC[sc][0], 2)


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


def confetti(cls, seed=2):
    import random
    rnd = random.Random(seed)
    return "".join(f'<rect class="{cls}" x="{rnd.uniform(40, 1040):.0f}" y="{rnd.uniform(-300, -40):.0f}" width="{rnd.choice([18, 26])}" height="{rnd.choice([14, 22])}" '
                   f'fill="{rnd.choice([YEL, RED, BLUE, GREEN, "#fff"])}" transform="rotate({rnd.uniform(0, 90):.0f})"/>' for _ in range(60))


# ------------------------------------------------------------------ S1 resultado
def s1():
    sc = "s1-resultado"
    d = D(sc)
    card = f'''<div class="card" style="position:relative;width:460px;padding:18px;text-align:center;background:#3a86ff">
      <div class="bang" style="position:absolute;left:-28px;top:-38px;width:110px;height:110px;border-radius:50%;background:#fff;border:7px solid {INK};font-size:78px;line-height:96px;color:{INK}">B</div>
      <div style="width:240px;margin:0 auto">{bigode("s1g")}</div>
      <div class="bang" style="font-size:72px;color:#fff;text-shadow:4px 4px 0 {INK}">IR PRO TREINO</div></div>'''
    body = f'''
    {kraft("s1", seed=21)}
    <div style="position:absolute;left:70px;top:190px;z-index:8"><div id="s1-dia-in" class="card bang" style="position:relative;padding:6px 30px;font-size:110px;color:{RED}">DIA 2</div></div>
    {tape(60, 175, 120, -20)}
    <div style="position:absolute;left:0;right:0;top:420px;text-align:center;z-index:6"><div id="s1-t-in" class="strip bang" style="font-size:80px;color:{INK}">VOCÊS ESCOLHERAM:</div></div>
    <div id="s1-card" data-layout-allow-overlap style="position:absolute;left:300px;top:600px;z-index:5"><div id="s1-card-in">{card}</div></div>
    {tape(470, 585, 150, 8)}
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:7">{confetti("s1-cf")}</svg>
    {onom("s1-tap", "TAP!", INK, 120, 700, 560, 10)}'''
    js = f'''
      tl.fromTo("#s1-dia-in", {{ scale: 1.15, rotation: -10 }}, {{ scale: 1, rotation: -5, duration: .3, ease: "steps(3)" }}, 0);
      tl.fromTo("#s1-t-in", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "steps(3)" }}, {L(sc, 0, "voces")});
      hfSlap(tl, "#s1-card-in", {L(sc, 0, "escolheram") + .3}, -3);
      hfPop(tl, "#s1-tap-in", {L(sc, 0, "escolheram") + .45}, 10);
      tl.fromTo(".s1-cf", {{ y: 0 }}, {{ y: (i) => 1500 + (i % 7) * 90, duration: 2.4, stagger: .012, ease: "steps(20)" }}, {L(sc, 0, "escolheram") + .3});'''
    write(sc, scene(sc, body, js))


# ------------------------------------------------------------------ S2 a Vó na feira
def s2():
    sc = "s2-feira"
    d = D(sc)
    stall = cut('<rect x="0" y="0" width="900" height="80"/><rect x="40" y="80" width="820" height="300"/>',
                f'<rect x="0" y="0" width="900" height="80" fill="{RED}"/>' + "".join(f'<rect x="{x}" y="0" width="60" height="80" fill="#fff"/>' for x in range(60, 900, 120))
                + f'<rect x="40" y="80" width="820" height="300" fill="#a0703f"/><ellipse cx="450" cy="100" rx="250" ry="34" fill="#d9d9d9"/><ellipse cx="450" cy="96" rx="210" ry="22" fill="#f1f1f1"/>')
    body = f'''
    {kraft("s2", "#f2c49b", 22)}
    {place(vo_cida("s2v"), "s2-vo", 260, 520, 560, 3)}
    <div style="position:absolute;left:90px;top:1000px;width:900px;z-index:4"><svg viewBox="0 0 900 380" width="900" height="380" overflow="visible">{stall}</svg></div>
    {sticker("s2-sales", '<div class="bang" style="font-size:64px;color:' + GREEN + '">VENDAS +200% 📈</div>', 110, 250, 560, 6, "background:#fff7d6")}
    {chalk("s2-why", "motivo: o Biel não tava lá comendo", 110, 400, 46, INK, -2)}
    <div id="s2-coins" style="position:absolute;left:640px;top:880px;z-index:6;font-size:70px">🪙🪙🪙</div>'''
    js = f'''
      hfStop(tl, ["s2v-rig"], {d});
      tl.fromTo("#s2-vo", {{ x: 700 }}, {{ x: 0, duration: .45, ease: "steps(6)" }}, 0);
      tl.fromTo("#s2-coins", {{ y: -300, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .35, ease: "steps(5)" }}, {L(sc, 1, "vendeu")});
      hfSlap(tl, "#s2-sales-in", {L(sc, 1, "melhor")}, -3);
      tl.fromTo("#s2-why-in", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "steps(3)" }}, {L(sc, 1, "porque") - .2});'''
    write(sc, scene(sc, body, js, bg="#f2c49b"))


# ------------------------------------------------------------------ S3 o chapéu
def s3():
    sc = "s3-chapeu"
    d = D(sc)
    dog = cut('<circle cx="90" cy="80" r="70"/><ellipse cx="90" cy="190" rx="70" ry="60"/>',
              f'<ellipse cx="90" cy="190" rx="70" ry="60" fill="#c98a55"/><circle cx="90" cy="80" r="70" fill="#d9a066"/>'
              f'<ellipse cx="30" cy="60" rx="22" ry="40" fill="#8a5a3c"/><ellipse cx="150" cy="60" rx="22" ry="40" fill="#8a5a3c"/>'
              f'<circle cx="68" cy="78" r="9" fill="{INK}"/><circle cx="112" cy="78" r="9" fill="{INK}"/><ellipse cx="90" cy="104" rx="16" ry="11" fill="{INK}"/>'
              f'<path d="M80 122 Q90 135 100 122" stroke="{INK}" stroke-width="5" fill="none"/>')
    body = f'''
    {sunset_field("s3")}
    {place(silhouette("s3z", "#5c5470"), "s3-zag", 520, 600, 300, 3)}
    {place(biel("s3b", BEFORE), "s3-biel", 170, 560, 400, 4)}
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:5" data-layout-ignore>
      <path id="s3-arc" d="M420 1360 Q660 300 900 1300" stroke="#fff" stroke-width="10" fill="none" stroke-dasharray="1600" stroke-dashoffset="1600"/>
      <g id="s3-ball"><circle cx="0" cy="0" r="34" fill="#fff" stroke="{INK}" stroke-width="5"/><path d="M-10 -12 L12 -12 L16 8 L0 18 L-16 8 Z" fill="{INK}"/></g></svg>
    {onom("s3-hat", "CHAPÉU! 🎩", YEL, 120, 470, 330, -6)}
    <div id="s3-dog" style="position:absolute;left:40px;top:1080px;width:200px;z-index:6"><svg viewBox="0 0 180 260" overflow="visible">{dog}</svg></div>
    {onom("s3-clap", "👏👏", "#fff", 90, 220, 1020, 8)}'''
    js = f'''
      hfStop(tl, ["s3b-rig", "s3z-rig"], {d});
      tl.fromTo("#s3-arc", {{ strokeDashoffset: 1600 }}, {{ strokeDashoffset: 0, duration: .7, ease: "steps(8)" }}, {L(sc, 2, "chapeu") - .2});
      const bp = {{ t: 0 }};
      tl.to(bp, {{ t: 1, duration: .7, ease: "steps(8)", onUpdate: () => {{ const t = bp.t; gsap.set("#s3-ball", {{ x: 420 + 480 * t, y: 1360 - 2 * 1030 * t * (1 - t) - 60 * t }}); }} }}, {L(sc, 2, "chapeu") - .2});
      tl.fromTo("#s3b-legR", {{ rotation: 0 }}, {{ rotation: -60, duration: .2, ease: "steps(3)", svgOrigin: "285 600" }}, {L(sc, 2, "chapeu") - .3});
      tl.to("#s3b-legR", {{ rotation: 0, duration: .2, ease: "steps(3)" }}, {L(sc, 2, "chapeu") + .1});
      tl.fromTo("#s3-zag", {{ rotation: 0 }}, {{ rotation: -12, duration: .3, ease: "steps(3)", transformOrigin: "50% 100%" }}, {L(sc, 2, "chapeu") + .2});
      hfPop(tl, "#s3-hat-in", {L(sc, 2, "chapeu")}, -6);
      tl.fromTo("#s3-dog", {{ y: 300 }}, {{ y: 0, duration: .3, ease: "steps(4)" }}, {L(sc, 2, "cachorro") - .2});
      hfPop(tl, "#s3-clap-in", {L(sc, 2, "aplaudiu")}, 8);
      tl.fromTo("#s3-clap-in", {{ scale: 1 }}, {{ scale: 1.2, duration: .12, repeat: 5, yoyo: true, ease: "steps(2)", immediateRender: false }}, {L(sc, 2, "aplaudiu") + .3});'''
    write(sc, scene(sc, body, js, bg="#ff9f43"))


# ------------------------------------------------------------------ S4 Professor Bigode
def s4():
    sc = "s4-bigode"
    d = D(sc)
    body = f'''
    {kraft("s4", "#9ccf9a", 24)}
    <div id="s4-g" style="position:absolute;left:190px;top:600px;width:700px;z-index:3">{bigode("s4g")}</div>
    {chalk("s4-nm", "PROFESSOR BIGODE", 230, 1360, 64, INK, -3)}
    <div id="s4-bal" data-layout-allow-overlap style="position:absolute;left:90px;top:260px;width:900px;z-index:6">
      <div id="s4-bal-in" style="position:relative">
        <svg viewBox="0 0 900 330" width="900" height="330" overflow="visible">{cut('<ellipse cx="450" cy="150" rx="440" ry="145"/><path d="M380 270 L420 340 L480 280 Z"/>', '<ellipse cx="450" cy="150" rx="440" ry="145" fill="#fff"/><path d="M380 270 L420 340 L480 280 Z" fill="#fff"/>', (6, 8), 10)}</svg>
        <div class="mk" style="position:absolute;left:60px;right:60px;top:70px;text-align:center;font-size:52px;line-height:1.15">"Tem futuro… mas tá precisando de um prato de comida." 🍽️</div></div></div>'''
    js = f'''
      tl.fromTo("#s4-g", {{ y: 500 }}, {{ y: 0, duration: .4, ease: "steps(5)" }}, 0);
      tl.fromTo("#s4-g", {{ rotation: -3 }}, {{ rotation: 3, duration: .25, repeat: 5, yoyo: true, ease: "steps(2)", immediateRender: false }}, {L(sc, 3, "alisou")});
      tl.fromTo("#s4-nm-in", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "steps(3)" }}, .3);
      tl.fromTo("#s4-bal-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2)", transformOrigin: "45% 100%" }}, {L(sc, 3, "tem") - .1});'''
    write(sc, scene(sc, body, js, bg="#9ccf9a"))


# ------------------------------------------------------------------ S5 carta do jogador (barras)
def s5():
    sc = "s5-carta"
    d = D(sc)
    rows = "".join(f'''<div id="s5-r{i}" style="position:relative;display:flex;align-items:center;gap:14px;margin:12px 0">
        <div style="font-size:52px;width:64px;text-align:center">{ic}</div>
        <div style="flex:1"><div class="bang" style="font-size:38px;color:{INK}">{nm}</div>
          <div style="position:relative;height:34px;background:#e9e1cc;border:5px solid {INK};border-radius:18px;overflow:hidden">
            <div id="s5-f{i}" style="width:{max(AFTER[k], 1)}%;height:100%;background:{c};transform-origin:0% 50%"></div>
            <div style="position:absolute;left:70%;top:-4px;width:7px;height:40px;background:{RED}"></div></div></div>
        <div class="bang" style="font-size:58px;width:150px;text-align:right;color:{INK}"><span style="color:#999;font-size:40px">{BEFORE[k]}→</span>{AFTER[k]}</div></div>''' for i, (k, ic, nm, c) in enumerate(STATS))
    body = f'''
    {kraft("s5", "#9ccf9a", 25)}
    <div id="s5-card" data-layout-allow-overlap style="position:absolute;left:110px;top:250px;width:860px;z-index:3">
      <div id="s5-card-in" class="card" style="position:relative;padding:24px 34px 18px">
        <div class="bang" style="font-size:44px;color:#888">Nº 10 · BIEL · DIA 2</div>{rows}</div></div>
    <div id="s5-z" data-layout-allow-overlap style="position:absolute;left:330px;top:880px;z-index:7"><div id="s5-z-in" class="bang" style="font-size:120px;color:{RED};border:12px solid {RED};padding:0 30px;border-radius:16px;background:rgba(255,255,255,.85)">ZEROU!</div></div>'''
    js = f'''
      hfSlap(tl, "#s5-card-in", 0, -2);
      tl.fromTo("#s5-f0", {{ scaleX: {BEFORE["s"] / AFTER["s"]:.3f} }}, {{ scaleX: 1, duration: .45, ease: "steps(5)" }}, {L(sc, 4, "subiu")});
      tl.fromTo("#s5-f3", {{ scaleX: {BEFORE["c"] / AFTER["c"]:.3f} }}, {{ scaleX: 1, duration: .45, ease: "steps(5)" }}, {L(sc, 4, "subiu", 1)});
      tl.fromTo("#s5-f2", {{ scaleX: 5 }}, {{ scaleX: 1, duration: .5, ease: "steps(5)" }}, {L(sc, 4, "zerou") - .3});
      tl.fromTo("#s5-r2", {{ x: 0 }}, {{ x: 12, duration: .05, repeat: 9, yoyo: true, ease: "none" }}, {L(sc, 4, "zerou")});
      tl.fromTo("#s5-z-in", {{ scale: 2.6, opacity: 0, rotation: -20 }}, {{ scale: 1, opacity: 1, rotation: -8, duration: .16, ease: "power4.in" }}, {L(sc, 4, "zerou")});'''
    write(sc, scene(sc, body, js, bg="#9ccf9a"))


# ------------------------------------------------------------------ S6 o bolso
def s6():
    sc = "s6-bolso"
    d = D(sc)
    botao = '<svg viewBox="0 0 120 120" width="120"><circle cx="60" cy="60" r="50" fill="#8d6e63" stroke="#1d1a17" stroke-width="7"/>' + "".join(f'<circle cx="{x}" cy="{y}" r="8" fill="#1d1a17"/>' for x, y in [(45, 45), (75, 45), (45, 75), (75, 75)]) + '</svg>'
    bala = '<svg viewBox="0 0 200 100" width="190"><path d="M50 50 L10 20 L10 80 Z M150 50 L190 20 L190 80 Z" fill="#8ce99a" stroke="#1d1a17" stroke-width="6"/><ellipse cx="100" cy="50" rx="55" ry="34" fill="#c3fae8" stroke="#1d1a17" stroke-width="7"/><path d="M70 40 Q100 30 130 40" stroke="#fff" stroke-width="7" fill="none"/></svg>'
    body = f'''
    {kraft("s6", seed=26)}
    {place(biel("s6b", AFTER), "s6-biel", 290, 300, 500, 3)}
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:4" data-layout-ignore>
      <path id="s6-pl" d="M370 860 L420 860 L410 930 L380 930 Z" fill="#fff" stroke="{INK}" stroke-width="5"/>
      <path id="s6-pr" d="M660 860 L710 860 L700 930 L670 930 Z" fill="#fff" stroke="{INK}" stroke-width="5"/></svg>
    <div id="s6-i1" data-layout-allow-overlap style="position:absolute;left:150px;top:1000px;z-index:6"><div id="s6-i1-in">{botao}</div></div>
    <div id="s6-i2" data-layout-allow-overlap style="position:absolute;left:430px;top:1040px;z-index:6"><div id="s6-i2-in">{bala}</div></div>
    <div id="s6-i3" data-layout-allow-overlap style="position:absolute;left:760px;top:980px;z-index:6"><div id="s6-i3-in" class="mk" style="font-size:80px">✨🙏</div></div>
    {sticker("s6-tag", '<div class="bang" style="font-size:56px;color:' + INK + '">PATRIMÔNIO TOTAL</div>', 300, 330, 480, 7, "background:#fff7d6")}'''
    js = f'''
      hfStop(tl, ["s6b-rig"], {d});
      tl.fromTo(["#s6-pl", "#s6-pr"], {{ scaleY: 0 }}, {{ scaleY: 1, duration: .2, ease: "steps(3)", transformOrigin: "50% 0%" }}, 0);
      hfSet(tl, "s6b", 0, ["m-o"], ["m-shy", "m-sad"]);
      hfSlap(tl, "#s6-i1-in", {L(sc, 5, "botao")}, -10);
      hfSlap(tl, "#s6-i2-in", {L(sc, 5, "bala")}, 6);
      hfSlap(tl, "#s6-i3-in", {L(sc, 5, "esperanca")}, -4);
      hfSet(tl, "s6b", {L(sc, 5, "esperanca")}, ["m-shy"], ["m-o"]);
      hfSlap(tl, "#s6-tag-in", .2, -3);'''
    write(sc, scene(sc, body, js))


# ------------------------------------------------------------------ S7 O QUE MUDOU
def s7():
    sc = "s7-mudou"
    write(sc, figurinha_upgrade(sc, BEFORE, AFTER, D(sc), reveal=round(L(sc, 6, "cabeca") - .1, 2)))


# ------------------------------------------------------------------ S8 mapa
def s8():
    sc = "s8-mapa"
    d = D(sc)
    lines = '<g stroke="#fff" stroke-width="6" fill="none" opacity=".25"><rect x="60" y="200" width="960" height="1500"/></g>'
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore><rect width="1080" height="1920" fill="#2f5d3a"/>{lines}
      <path id="s8-path" d="M200 1150 C300 950 500 1050 560 850 C620 650 820 700 860 480" stroke="#fff" stroke-width="12" fill="none" stroke-dasharray="40 26" stroke-linecap="round"/>
      <g stroke="#fff" stroke-width="16" stroke-linecap="round"><path d="M820 440 L900 520 M900 440 L820 520"/></g>
      <circle cx="200" cy="1150" r="26" fill="{YEL}"/></svg>
    {chalk("s8-home", "casa do Biel 🏠", 90, 1190, 50)}
    {chalk("s8-dest", "CAMPO DO VILA ESPERANÇA", 260, 360, 46)}
    {chalk("s8-km", "8 KM!", 500, 680, 110, YEL, -6)}
    {sticker("s8-bus", '<div class="bang" style="font-size:52px;color:' + INK + '">🚌 PASSAGEM: R$ 5,00</div>', 110, 830, 470, 6, "background:#fff7d6")}
    {sticker("s8-biel", '<div class="bang" style="font-size:52px;color:' + RED + '">BIEL: R$ 0,00</div>', 560, 960, 380, 6, "background:#fff")}'''
    js = f'''
      tl.fromTo("#s8-path", {{ strokeDashoffset: 900 }}, {{ strokeDashoffset: 0, duration: 1.2, ease: "steps(12)" }}, {L(sc, 7, "amistoso") - .2});
      tl.fromTo("#s8-home-in", {{ scale: 0 }}, {{ scale: 1, duration: .2, ease: "steps(3)" }}, .2);
      tl.fromTo("#s8-dest-in", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "steps(3)" }}, {L(sc, 7, "bairro")});
      tl.fromTo("#s8-km-in", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "steps(3)" }}, {L(sc, 7, "oito") if any(w[3] == "oito" for w in WORDS) else L(sc, 7, "quilometros") - .3});
      hfSlap(tl, "#s8-bus-in", {L(sc, 7, "passagem")}, -3);
      hfSlap(tl, "#s8-biel-in", {L(sc, 7, "custa")}, 4);'''
    write(sc, scene(sc, body, js, bg="#2f5d3a"))


# ------------------------------------------------------------------ S9 story do Kauã
def s9():
    sc = "s9-kaua"
    d = D(sc)
    story = f'''<div id="s9-phone" style="position:absolute;left:200px;top:260px;width:680px;height:1000px;z-index:3">
      <div style="position:absolute;inset:0;border-radius:60px;background:#14151a;border:12px solid {INK};box-shadow:14px 14px 0 rgba(0,0,0,.35)"></div>
      <div style="position:absolute;left:24px;top:24px;right:24px;bottom:24px;border-radius:40px;overflow:hidden;background:linear-gradient(#3c096c,#9a3412)">
        <div style="position:absolute;left:20px;right:20px;top:20px;height:8px;background:rgba(255,255,255,.4);border-radius:4px"><div id="s9-prog" style="width:100%;height:100%;background:#fff;border-radius:4px;transform-origin:0% 50%"></div></div>
        <div style="position:absolute;left:24px;top:44px;font-family:Inter;font-weight:800;font-size:34px;color:#fff">@kaua.oficial ✔️</div>
        <svg viewBox="0 0 632 952" width="632" height="952" style="position:absolute;left:0;top:0" data-layout-ignore>
          <rect x="30" y="200" width="572" height="520" rx="40" fill="#3a3f4b" stroke="#1d1a17" stroke-width="10"/>
          <rect x="70" y="240" width="492" height="300" rx="24" fill="#bde0fe" stroke="#1d1a17" stroke-width="8"/>
          <rect x="60" y="620" width="512" height="80" rx="20" fill="#2b2b2b"/></svg>
        <div style="position:absolute;left:170px;top:250px;width:300px">{kaua("s9k")}</div>
        <div style="position:absolute;left:120px;top:300px;font-size:90px">🕶️</div>
        <div class="bang" style="position:absolute;left:0;right:0;bottom:90px;text-align:center;font-size:68px;color:#fff;text-shadow:4px 4px 0 #1d1a17">partiu amistoso 😎🚗</div></div></div>'''
    body = f'''
    {kraft("s9", "#bfa0d9", 29)}
    {story}
    {place(silhouette("s9m", "#2b2b2b"), "s9-mot", 760, 760, 220, 5)}
    {chalk("s9-mt", "motorista", 760, 700, 44, INK, 4)}'''
    js = f'''
      tl.fromTo("#s9-phone", {{ y: 900, rotation: 8 }}, {{ y: 0, rotation: -2, duration: .4, ease: "steps(5)" }}, 0);
      tl.fromTo("#s9-prog", {{ scaleX: 0 }}, {{ scaleX: 1, duration: {d}, ease: "none" }}, 0);
      hfStop(tl, ["s9k-rig"], {d});
      hfSlap(tl, "#s9-mot", {L(sc, 8, "motorista") - .2}, 3);
      tl.fromTo("#s9-mt-in", {{ scale: 0 }}, {{ scale: 1, duration: .2, ease: "steps(3)" }}, {L(sc, 8, "motorista")});'''
    write(sc, scene(sc, body, js, bg="#bfa0d9"))


# ------------------------------------------------------------------ S10 decisão (sem números)
def s10():
    sc = "s10-decisao"
    d = D(sc)

    def card(k, letter, col, icon, title, mexe, x):
        return f'''<div id="s10-{k}" data-layout-allow-overlap style="position:absolute;left:{x}px;top:600px;width:410px;z-index:5">
          <div id="s10-{k}-in" class="card" style="position:relative;padding:18px 14px;text-align:center;background:{col}">
            <div class="bang" style="position:absolute;left:-28px;top:-38px;width:100px;height:100px;border-radius:50%;background:#fff;border:7px solid {INK};font-size:70px;line-height:88px;color:{INK}">{letter}</div>
            <div style="font-size:120px;line-height:1.2">{icon}</div>
            <div class="bang" style="font-size:58px;color:#fff;text-shadow:4px 4px 0 {INK};line-height:1">{title}</div>
            <div class="mk" style="margin-top:12px;background:#fff;border:5px solid {INK};border-radius:14px;padding:6px 10px;font-size:34px">MEXE COM: {mexe}</div></div></div>'''
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#2f5d3a"/>
      <g stroke="#fff" stroke-width="6" fill="none" opacity=".35"><rect x="60" y="200" width="960" height="1500"/><line x1="60" y1="950" x2="1020" y2="950"/><circle cx="540" cy="950" r="150"/></g></svg>
    {chalk("s10-t", "COMO ELE CHEGA LÁ?", 120, 380, 70, "#fff", -3, 6)}
    {card("a", "A", "#f4a261", "🏃", "IR CORRENDO<br>8 KM", "💪 ⚽", 90)}
    {card("b", "B", "#3a86ff", "🚗", "CARONA COM<br>O KAUÃ", "🧠 ⚽", 570)}
    <div style="position:absolute;left:0;right:0;top:1120px;text-align:center;z-index:8"><div id="s10-com-in" class="strip bang" style="font-size:80px;color:{INK}">COMENTA <span style="color:#e76f00">A</span> OU <span style="color:#1d4ed8">B</span> 👇</div></div>'''
    js = f'''
      tl.fromTo("#s10-t-in", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "steps(3)" }}, {L(sc, 9, "como")});
      hfSlap(tl, "#s10-a-in", {L(sc, 9, "ir")}, -3);
      hfSlap(tl, "#s10-b-in", {L(sc, 9, "pedir")}, 3);
      tl.fromTo("#s10-a-in", {{ y: 0 }}, {{ y: -16, duration: .18, repeat: 3, yoyo: true, ease: "steps(2)", immediateRender: false }}, {L(sc, 9, "corpo")});
      tl.fromTo("#s10-b-in", {{ y: 0 }}, {{ y: -16, duration: .18, repeat: 3, yoyo: true, ease: "steps(2)", immediateRender: false }}, {L(sc, 9, "orgulho")});
      tl.fromTo("#s10-com-in", {{ scale: 0, rotation: -8 }}, {{ scale: 1, rotation: -2, duration: .3, ease: "back.out(2.5)" }}, {L(sc, 9, "comenta")});'''
    write(sc, scene(sc, body, js, bg="#2f5d3a"))


# ------------------------------------------------------------------ S11 final
def s11():
    sc = "s11-final"
    d = D(sc)
    import random
    rnd = random.Random(31)
    stars = "".join(f'<path d="M{(x := rnd.uniform(60, 1020)):.0f} {(y := rnd.uniform(160, 700)):.0f} l6 14 l15 2 l-11 10 l3 15 l-13 -8 l-13 8 l3 -15 l-11 -10 l15 -2 Z" fill="#fff6c2"/>' for _ in range(14))
    gold = '<svg viewBox="0 0 120 70" width="200"><path d="M5 50 L70 45 C100 48 110 65 90 68 L5 68 Z" fill="#f2c230" stroke="#1d1a17" stroke-width="5"/></svg>'
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#1b2a4a"/>{stars}
      {cut('<rect x="560" y="520" width="420" height="380"/>', '<rect x="560" y="520" width="420" height="380" fill="#0f1830"/><path d="M560 760 L980 700" stroke="#3a4a6a" stroke-width="30"/>', (6, 8), 12)}</svg>
    <div id="s11-gold" style="position:absolute;left:820px;top:640px;z-index:1">{gold}</div>
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:2" data-layout-ignore><g id="s11-shine" fill="#fff6c2">{"".join(f'<path d="M{920 + 110 * __import__("math").cos(a):.0f} {680 + 110 * __import__("math").sin(a):.0f} l8 -24 l8 24 Z"/>' for a in [k * .785 for k in range(8)])}</g></svg>
    {place(biel("s11b", AFTER), "s11-biel", 120, 520, 480, 3)}
    <div style="position:absolute;left:0;right:0;top:220px;text-align:center;z-index:6"><div id="s11-t-in" class="bang" style="display:inline-block;font-size:96px;color:{YEL};text-shadow:6px 8px 0 rgba(0,0,0,.4)">FALTAM {DAYS_LEFT} DIAS<br>PRA PENEIRA…</div></div>
    <div id="s11-end" class="clip" data-start="{d - 2.2:.2f}" data-duration="2.2" style="position:absolute;left:0;right:0;top:1240px;text-align:center;z-index:9"><div id="s11-end-in" class="strip bang" style="font-size:52px;color:{RED}">DIA 3 AMANHÃ · COMENTA A OU B 👇</div></div>'''
    js = f'''
      hfStop(tl, ["s11b-rig"], {d});
      tl.fromTo(".s11b-pupil", {{ x: 0 }}, {{ x: 12, duration: .2, ease: "steps(2)" }}, .6);
      tl.fromTo("#s11-t-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "steps(4)" }}, .05);
      tl.fromTo("#s11-shine", {{ opacity: 0, rotation: 0 }}, {{ opacity: 1, rotation: 30, duration: 1.2, ease: "none", svgOrigin: "920 680" }}, {L(sc, 10, "kaua") - .2});
      tl.fromTo("#s11-end-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2)" }}, {d - 2.2:.2f});'''
    write(sc, scene(sc, body, js, bg="#1b2a4a"))


# ------------------------------------------------------------------ HUD + legendas
def hud(start, end):
    cid = "hud"
    items = "".join(f'<div style="display:flex;align-items:center;gap:6px"><div style="font-size:32px">{ic}</div>'
                    f'<div style="width:96px;height:20px;background:#e9e1cc;border:4px solid {INK};border-radius:10px;overflow:hidden;position:relative">'
                    f'<div style="width:{AFTER[k]}%;height:100%;background:{c}"></div><div style="position:absolute;left:70%;top:0;width:4px;height:100%;background:{RED}"></div></div></div>'
                    for k, ic, _, c in STATS)
    body = f'''<div id="hud-box" style="position:absolute;left:70px;top:180px;width:820px;z-index:2">
      <div id="hud-in" class="card" style="display:flex;align-items:center;gap:18px;padding:8px 18px">
        <div class="bang" style="font-size:34px;line-height:1;color:{INK};text-align:center">⏳ {DAYS_LEFT}<br>DIAS</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px">{items}</div></div></div>'''
    js = f'''tl.fromTo("#hud-in", {{ y: -260 }}, {{ y: 0, duration: .3, ease: "steps(4)" }}, 0);
      tl.to("#hud-in", {{ y: -460, duration: .25, ease: "steps(3)" }}, {round(end - start - .3, 2)});'''
    write(cid, scene(cid, body, js, "#root { background: transparent; }", bg="transparent"))


def caps():
    cid = "caps"
    groups = caption_groups(WORDS)
    html, js = [], []
    for gi, ws in enumerate(groups):
        st, en = ws[0][4], ws[-1][5]
        start = max(0.1, st - .05)
        nxt = groups[gi + 1][0][4] if gi + 1 < len(groups) else None
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
        ("papel.wav", 0.0, .35), ("fita.wav", W(0, "escolheram") + .3, .45), ("pop.mp3", W(0, "escolheram") + .45, .35), ("sparkle.mp3", W(0, "escolheram") + .3, .35),
        ("whoosh.mp3", PSTART[1] - .1, .35), ("moedas.wav", W(1, "vendeu"), .45), ("fita.wav", W(1, "melhor"), .4), ("papel.wav", W(1, "ninguem"), .3),
        ("apito.wav", PSTART[2], .35), ("chute.wav", W(2, "chapeu") - .25, .55), ("whoosh.mp3", W(2, "chapeu"), .35), ("pop.mp3", W(2, "chapeu"), .35),
        ("boing.wav", W(2, "cachorro"), .3), ("pop.mp3", W(2, "aplaudiu"), .35),
        ("papel.wav", PSTART[3] - .1, .3), ("apito.wav", W(3, "frase"), .3), ("pop.mp3", W(3, "tem") - .1, .35),
        ("papel.wav", PSTART[4] - .1, .35), ("pop.mp3", W(4, "subiu"), .3), ("pop.mp3", W(4, "subiu", 1), .3), ("bip.wav", W(4, "zerou") - .3, .35), ("carimbo.wav", W(4, "zerou"), .65),
        ("pop.mp3", W(5, "botao"), .35), ("pop.mp3", W(5, "bala"), .35), ("sparkle.mp3", W(5, "esperanca"), .3),
        ("sparkle.mp3", PSTART[6], .4), ("fita.wav", W(6, "cabeca") - .1, .45), ("pop.mp3", W(6, "postura"), .3),
        ("papel.wav", PSTART[7] - .1, .35), ("whoosh-short.mp3", W(7, "amistoso"), .3), ("fita.wav", W(7, "passagem"), .4), ("carimbo.wav", W(7, "reais"), .5),
        ("notification.mp3", PSTART[8], .4), ("fita.wav", W(8, "motorista") - .2, .35),
        ("papel.wav", W(9, "como"), .3), ("fita.wav", W(9, "ir"), .45), ("fita.wav", W(9, "pedir"), .45), ("sparkle.mp3", W(9, "comenta"), .35),
        ("whoosh-short.mp3", PSTART[10] - .1, .3), ("sparkle.mp3", W(10, "kaua"), .3),
    ]


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = [f'''      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s}" data-duration="{e - s:.2f}"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:1"></div>''' for c, s, e in SCENES]
    hs, he = SC["s6-bolso"][0], SC["s11-final"][0]
    hosts.append(f'''      <div id="hud" data-composition-id="hud" data-composition-src="compositions/hud.html" data-start="{hs}" data-duration="{he - hs:.2f}"
        data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:10"></div>''')
    hosts.append(f'''      <div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>''')
    vd = round(dur(os.path.join(ROOT, "assets/voice/narracao-craque02.wav")), 2)
    z0, z1 = round(W(4, "zerou") - .2, 2), SC["s7-mudou"][0]  # a música para no "zerou"
    m0 = 30.0
    audio = [f'      <audio id="voz" class="clip" src="assets/voice/narracao-craque02.wav" data-start="0" data-duration="{vd}" data-volume="1" data-track-index="4"></audio>',
             f'      <audio id="trilha-a" class="clip" src="assets/music/samba-eitabyte.mp3" data-start="0" data-duration="{z0:.2f}" data-media-start="{m0}" data-volume="0.13" data-fade-out="0.3" data-track-index="5"></audio>',
             f'      <audio id="trilha-b" class="clip" src="assets/music/samba-eitabyte.mp3" data-start="{z1}" data-duration="{TOTAL - z1:.2f}" data-media-start="{m0 + z1:.2f}" data-volume="0.13" data-fade-in="0.4" data-fade-out="1.5" data-track-index="5"></audio>']
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
    <!-- O Chat Faz um Craque — DIA 2 (gerado por tools/build_craque_dia02.py) -->
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
    for fn in (s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, caps):
        fn()
    hud(SC["s6-bolso"][0], SC["s11-final"][0])
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "craque-dia02", "name": "O Chat Faz um Craque — DIA 2", "createdAt": "2026-11-07T15:00:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, [(n, s, e) for n, s, e in SCENES])
