"""Gera o episódio 3D "E se você tivesse um olho que copia tudo" em olho/.

O 3D (Three.js) fica em olho/assets/olho3d.js e é desenhado a partir do tempo.
Este script gera os tempos-chave (assets/timing.js), os textos por cena (GSAP),
as legendas e a raiz com áudio.
Uso: python3 tools/build_olho.py
"""
import json
import os
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from build_chat_dia03 import tag  # noqa: E402
from hq_lib import CYAN, INK, MAG, RED, YEL, scene, sfx_word  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "olho")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-olho.wav"

PARS = [
    "Imagina acordar com um olho|que copia qualquer coisa que você vê.|E ainda deixa tudo|em câmera lenta.|Mas só por um dia.",
    "Primeira descoberta:|em câmera lenta,|a torrada finalmente cai|com a manteiga pra cima.",
    "Você olhou um vídeo de dança|uma vez…|e copiou tudo.|Copiou até a dor nas costas|do dançarino.",
    "Na escola,|você olhou o professor|resolvendo a conta.|E copiou…|o jeito dele de coçar o bigode.",
    "No futebol,|você copiou o chute de falta perfeito.|A bola fez a curva perfeita…|direto na janela do vizinho.",
    "Aí você copiou a cantada|do galã da escola.|Palavra por palavra.|E levou o mesmo fora|que ele levou.",
    "Em casa,|você tentou usar o olho|pra fugir da louça.|Mas a sua mãe|tem o olhar de mãe.|Esse é outro nível.",
    "No fim da tarde,|o seu avô foi ensinar|a receita do bolo dele.|Você podia copiar|em um segundo,|mas pediu pra ele|mostrar de novo…|devagar.|Tem coisa que a gente aprende|pelo tempo junto.",
    "Meia-noite,|o olho apaga.|Você não sabe mais dançar,|nem chutar falta.|Mas a receita do bolo…|essa ficou.",
    "E você?|Ia preferir copiar|qualquer habilidade…|ou ver tudo em câmera lenta?|Comenta A ou B!",
]
FIX = {"eainda": ["e", "ainda"], "ecopiou": ["e", "copiou"], "elevou": ["e", "levou"], "evoce": ["e", "voce"], "para": ["pra"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.0, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-acorda", "s2-torrada", "s3-danca", "s4-aula", "s5-falta", "s6-crush", "s7-mae", "s8-avo", "s9-noite", "s10-pergunta"]
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


KEYS = {
    "olho": W(0, "olho"), "copia": W(0, "copia"), "camera0": W(0, "camera"), "dia0": W(0, "dia"),
    "torrada": W(1, "torrada"), "cai": W(1, "cai"), "cima": W(1, "cima"),
    "video": W(2, "video"), "copiou2": W(2, "copiou"), "dor": W(2, "dor"),
    "professor": W(3, "professor"), "copiou3": W(3, "copiou"), "jeito": W(3, "jeito"), "bigode": W(3, "bigode"),
    "chute": W(4, "chute"), "bola": W(4, "bola"), "janela": W(4, "janela"),
    "cantada": W(5, "cantada"), "palavra": W(5, "palavra"), "fora": W(5, "fora"),
    "louca": W(6, "louca"), "olhar": W(6, "olhar"), "nivel": W(6, "nivel"),
    "receita": W(7, "receita"), "copiar8": W(7, "copiar"), "devagar": W(7, "devagar"), "junto": W(7, "junto"),
    "apaga": W(8, "apaga"), "dancar": W(8, "dancar"), "bolo9": W(8, "bolo"),
    "preferir": W(9, "preferir"), "comenta": W(9, "comenta"),
}


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


def pop(sel, t, rot=0):
    return f'hfPop(tl, "{sel}", {t}, {rot});'


TRANSP = "#root { background: transparent; }"


def ov(sc, body, js):
    write(sc, scene(sc, body, js, TRANSP, bg="transparent"))


# ------------------------------------------------------------------ textos por cena
def s1():
    sc = "s1-acorda"
    body = f'''
    <div style="position:absolute;left:0;right:0;top:230px;text-align:center;z-index:8"><div id="s1-title-in" style="display:inline-block;font-family:'Archivo Black';font-size:84px;line-height:1.05;color:{YEL};-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:9px 9px 0 {INK}">E SE VOCÊ<br>COPIASSE TUDO?</div></div>
    {sfx_word("s1-vz", "VRRRM!", RED, 130, -8, "left:120px;top:420px;z-index:8")}
    {tag("s1-on", "OLHO ESPELHO: ATIVADO 👁️", 110, 1050, "#fff", 50)}
    {tag("s1-1d", "SÓ POR 1 DIA ⏳", 560, 920, YEL, 46)}
    <div id="s1-flash" style="position:absolute;inset:0;background:radial-gradient(circle at 45% 45%, rgba(255,40,40,.75), rgba(255,0,0,0) 60%);opacity:0;z-index:2"></div>'''
    js = f'''
      tl.fromTo("#s1-title-in", {{ scale: 1.15, opacity: 1 }}, {{ scale: 1, duration: .4, ease: "back.out(2)" }}, 0);
      tl.to("#s1-title-in", {{ y: -40, opacity: 0, duration: .3 }}, {KEYS["copia"] + .6});
      tl.fromTo("#s1-flash", {{ opacity: 0 }}, {{ opacity: 1, duration: .12 }}, {KEYS["olho"]});
      tl.to("#s1-flash", {{ opacity: 0, duration: .6 }}, {KEYS["olho"] + .15});
      {pop("#s1-vz-in", KEYS["olho"], -8)}
      tl.to("#s1-vz-in", {{ scale: 0, duration: .15 }}, {KEYS["copia"] + .8});
      {pop("#s1-on-in", KEYS["copia"] + .2, -3)}
      {pop("#s1-1d-in", L(sc, 0, "so") - .2, 4)}'''
    ov(sc, body, js)


def s2():
    sc = "s2-torrada"
    t0 = SC[sc][0]
    body = f'''
    <div id="s2-tint" style="position:absolute;inset:0;z-index:1;background:radial-gradient(circle at 50% 50%, rgba(255,0,40,0) 45%, rgba(120,0,20,.55) 100%)"></div>
    <div id="s2-scan" style="position:absolute;inset:0;z-index:1;opacity:.18;background:repeating-linear-gradient(0deg, rgba(255,255,255,.35) 0 3px, rgba(0,0,0,0) 3px 9px)"></div>
    <div style="position:absolute;left:80px;top:200px;z-index:6"><div id="s2-rec-in" style="font-family:'Space Mono';font-weight:700;font-size:44px;color:#fff;background:rgba(21,18,43,.8);border:5px solid {RED};border-radius:14px;padding:6px 20px">● CÂMERA LENTA 0.1x</div></div>
    {tag("s2-hist", "PELA PRIMEIRA VEZ NA HISTÓRIA 🍞", 70, 1060, YEL, 44)}'''
    js = f'''
      tl.fromTo("#s2-rec-in", {{ opacity: 1 }}, {{ opacity: .3, duration: .4, repeat: {int(D(sc) / .8)}, yoyo: true, ease: "steps(1)" }}, 0);
      {pop("#s2-hist-in", KEYS["cima"] - t0 + .2, -3)}'''
    ov(sc, body, js)


def s3():
    sc = "s3-danca"
    t0 = SC[sc][0]
    body = f'''
    {tag("s3-cp", "COPIADO ✅", 620, 380, "#8ce99a", 52)}
    {tag("s3-dor", "+ DOR NAS COSTAS 😵", 110, 1060, "#fff", 50, 8, RED)}
    {sfx_word("s3-ai", "AI!", RED, 140, 8, "left:680px;top:620px;z-index:8")}'''
    js = f'''
      {pop("#s3-cp-in", KEYS["copiou2"] - t0, 4)}
      {pop("#s3-dor-in", KEYS["dor"] - t0 + .2, -3)}
      {pop("#s3-ai-in", KEYS["dor"] - t0, 8)}'''
    ov(sc, body, js)


def s4():
    sc = "s4-aula"
    t0 = SC[sc][0]
    body = f'''
    {tag("s4-cp", "COPIANDO… 📡", 90, 330, "#fff", 48)}
    {tag("s4-ok", "COPIADO: COÇAR O BIGODE 🥸", 90, 1060, YEL, 46)}'''
    js = f'''
      {pop("#s4-cp-in", KEYS["professor"] - t0, -3)}
      tl.fromTo("#s4-cp-in", {{ opacity: 1 }}, {{ opacity: .4, duration: .25, repeat: 7, yoyo: true, ease: "steps(1)", immediateRender: false }}, {KEYS["professor"] - t0 + .4});
      {pop("#s4-ok-in", KEYS["bigode"] - t0, 3)}'''
    ov(sc, body, js)


def s5():
    sc = "s5-falta"
    t0 = SC[sc][0]
    body = f'''
    {tag("s5-cp", "CHUTE COPIADO ⚽", 90, 330, "#8ce99a", 48)}
    {sfx_word("s5-crash", "CRASH!", RED, 160, 8, "left:420px;top:560px;z-index:8")}
    {tag("s5-viz", "VIZINHO: 😡", 560, 1040, "#fff", 50)}'''
    js = f'''
      {pop("#s5-cp-in", KEYS["chute"] - t0, -3)}
      {pop("#s5-crash-in", KEYS["janela"] - t0 + .15, 8)}
      {pop("#s5-viz-in", KEYS["janela"] - t0 + .7, -4)}'''
    ov(sc, body, js)


def s6():
    sc = "s6-crush"
    t0 = SC[sc][0]
    body = f'''
    <div id="s6-bal" data-layout-allow-overlap style="position:absolute;left:150px;top:330px;width:780px;z-index:7">
      <div id="s6-bal-in" style="background:#fff;border:8px solid {INK};border-radius:44px;box-shadow:10px 10px 0 {INK};padding:22px 30px;font-family:'Archivo Black';font-size:42px;line-height:1.15;color:{INK};text-align:center">"você é o wi-fi da minha vida: sem você eu não conecto" 😎</div></div>
    {tag("s6-ok", "COPIADO ✅ (O FORA TAMBÉM)", 90, 1060, YEL, 46)}'''
    js = f'''
      tl.fromTo("#s6-bal-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2)" }}, {KEYS["cantada"] - t0 + .1});
      tl.to("#s6-bal-in", {{ scale: 0, duration: .2 }}, {KEYS["fora"] - t0 - .2});
      {pop("#s6-ok-in", KEYS["fora"] - t0 + .1, -3)}'''
    ov(sc, body, js)


def s7():
    sc = "s7-mae"
    t0 = SC[sc][0]
    body = f'''
    {tag("s7-lc", "LOUÇA: 47 ITENS 🍽️", 90, 330, "#fff", 46)}
    {tag("s7-max", "OLHAR DE MÃE: NÍVEL MÁXIMO 😠", 70, 1050, RED, 44, 8, "#fff")}'''
    js = f'''
      {pop("#s7-lc-in", KEYS["louca"] - t0, -3)}
      tl.to("#s7-lc-in", {{ scale: 0, duration: .15 }}, {KEYS["olhar"] - t0 - .2});
      tl.fromTo("#s7-max-in", {{ scale: 2.4, opacity: 0, rotation: -20 }}, {{ scale: 1, opacity: 1, rotation: -4, duration: .16, ease: "power4.in" }}, {KEYS["olhar"] - t0 + .3});'''
    ov(sc, body, js)


def s8():
    sc = "s8-avo"
    t0 = SC[sc][0]
    body = f'''
    {tag("s8-rec", "RECEITA DO VÔ 🎂", 90, 330, "#fff6d6", 48)}'''
    js = f'''
      {pop("#s8-rec-in", KEYS["receita"] - t0, -3)}'''
    ov(sc, body, js)


def s9():
    sc = "s9-noite"
    t0 = SC[sc][0]
    body = f'''
    <div style="position:absolute;left:0;right:0;top:230px;text-align:center;z-index:6"><div id="s9-clk-in" style="display:inline-block;font-family:'Space Mono';font-weight:700;font-size:120px;color:#4cd964;background:#111;border:10px solid {INK};border-radius:24px;padding:0 30px">00:00</div></div>
    {sfx_word("s9-plim", "PLIM.", "#fff", 100, -6, "left:140px;top:520px;z-index:8")}
    {tag("s9-off", "PODER: DESATIVADO", 520, 560, "#fff", 44)}
    {tag("s9-bolo", "RECEITA: SALVA ✅🎂", 300, 1060, YEL, 46)}'''
    js = f'''
      tl.fromTo("#s9-clk-in", {{ scale: 1.3, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: .3, ease: "back.out(2)" }}, 0);
      {pop("#s9-plim-in", KEYS["apaga"] - t0, -6)}
      {pop("#s9-off-in", KEYS["apaga"] - t0 + .3, 3)}
      {pop("#s9-bolo-in", KEYS["bolo9"] - t0, -3)}'''
    ov(sc, body, js)


def s10():
    sc = "s10-pergunta"
    t0 = SC[sc][0]

    def card(k, letter, col, icon, title, x):
        return f'''<div id="s10-{k}" style="position:absolute;left:{x}px;top:1360px;width:390px;z-index:4">
          <div id="s10-{k}-in" style="position:relative;background:{col};border:10px solid {INK};border-radius:40px;box-shadow:14px 14px 0 {INK};padding:22px 10px 20px;text-align:center">
            <div style="position:absolute;left:-30px;top:-40px;width:110px;height:110px;border-radius:50%;background:#fff;border:9px solid {INK};font-family:'Archivo Black';font-size:66px;line-height:92px;color:{INK}">{letter}</div>
            <div style="font-size:100px;line-height:1.1">{icon}</div>
            <div style="font-family:'Archivo Black';font-size:44px;line-height:1.05;color:#fff;-webkit-text-stroke:8px {INK};paint-order:stroke fill;margin-top:6px">{title}</div></div></div>'''
    body = f'''
    <div style="position:absolute;left:0;right:0;top:230px;text-align:center;z-index:5"><div id="s10-t-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;color:{YEL};-webkit-text-stroke:11px {INK};paint-order:stroke fill;text-shadow:9px 9px 0 {INK}">E VOCÊ? 👁️</div></div>
    {card("a", "A", MAG, "🧠", "COPIAR<br>QUALQUER<br>HABILIDADE", 100)}
    {card("b", "B", CYAN, "🐢", "VER TUDO EM<br>CÂMERA<br>LENTA", 545)}
    <div style="position:absolute;left:0;right:0;top:1740px;text-align:center;z-index:6"><div id="s10-com-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;color:#fff;-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">
      COMENTA <span style="color:#ff6fa8">A</span> OU <span style="color:{CYAN}">B</span> 👇</div></div>'''
    js = f'''
      tl.fromTo("#s10-t-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2.5)" }}, 0);
      tl.fromTo("#s10-a-in", {{ x: -700, rotation: -15 }}, {{ x: 0, rotation: -3, duration: .4, ease: "back.out(1.4)" }}, {KEYS["preferir"] - t0});
      tl.fromTo("#s10-b-in", {{ x: 700, rotation: 15 }}, {{ x: 0, rotation: 3, duration: .4, ease: "back.out(1.4)" }}, {L(sc, 9, "ver")});
      tl.fromTo("#s10-com-in", {{ scale: 0, rotation: -10 }}, {{ scale: 1, rotation: -2, duration: .35, ease: "back.out(2.5)" }}, {KEYS["comenta"] - t0});'''
    ov(sc, body, js)


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
        rot = (-1.5, 1.2, -0.8, 1.6)[gi % 4]
        html.append(f'<div id="cg{gi}" class="clip cg" data-start="{start:.2f}" data-duration="{max(.2, end - start):.2f}"><div id="cg{gi}-in" class="cbox">{spans}</div></div>')
        js.append(f'tl.fromTo("#cg{gi}-in", {{ scale: .6, rotation: {rot - 4} }}, {{ scale: 1, rotation: {rot}, duration: .18, ease: "back.out(2.5)" }}, {start:.2f});')
        for j, w in enumerate(ws):
            js.append(f'tl.fromTo("#cw{gi}-{j}", {{ color: "#15122b" }}, {{ color: "#c8006e", duration: .05, immediateRender: false }}, {w[4]:.2f});')
    css = f'''#root {{ background: transparent; }}
      .cg {{ position:absolute; left:90px; right:150px; top:1235px; text-align:center; }}
      .cbox {{ display:inline-block; background:{YEL}; border:7px solid {INK}; box-shadow:9px 9px 0 {INK}; padding:10px 24px;
        font-family:Montserrat; font-weight:900; font-size:52px; line-height:1.12; color:{INK}; text-transform:uppercase; max-width:840px; }}'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


# ------------------------------------------------------------------ áudio + raiz
def sfx_list():
    return [
        ("whoosh.mp3", 0.0, .3), ("glitch-1.mp3", KEYS["olho"], .45), ("impact-bass-1.mp3", KEYS["olho"], .4), ("sparkle.mp3", KEYS["copia"] + .2, .35), ("pop.mp3", W(0, "so") - .2, .3),
        ("whoosh-short.mp3", PSTART[1] - .1, .35), ("ping.mp3", KEYS["cai"], .3), ("sparkle.mp3", KEYS["cima"], .45),
        ("whoosh.mp3", PSTART[2] - .1, .35), ("pop.mp3", KEYS["copiou2"], .3), ("boing.wav", KEYS["dor"], .4),
        ("whoosh.mp3", PSTART[3] - .1, .35), ("bip.wav", KEYS["professor"] + .4, .25), ("pop.mp3", KEYS["bigode"], .3),
        ("whoosh.mp3", PSTART[4] - .1, .35), ("whoosh-short.mp3", KEYS["chute"] + .25, .4), ("crack.wav", KEYS["janela"] + .1, .6),
        ("whoosh.mp3", PSTART[5] - .1, .35), ("pop.mp3", KEYS["cantada"] + .1, .3), ("error.mp3", KEYS["fora"], .35),
        ("whoosh.mp3", PSTART[6] - .1, .35), ("pop.mp3", KEYS["louca"], .3), ("impact-bass-2.mp3", KEYS["olhar"], .45), ("glitch-1.mp3", KEYS["olhar"] + .3, .3),
        ("whoosh-short.mp3", PSTART[7] - .1, .25), ("sparkle.mp3", KEYS["receita"], .25),
        ("whoosh-short.mp3", PSTART[8] - .1, .25), ("ping.mp3", KEYS["apaga"], .35), ("sparkle.mp3", KEYS["bolo9"], .3),
        ("whoosh.mp3", KEYS["preferir"], .4), ("whoosh.mp3", W(9, "ver"), .4), ("sparkle.mp3", KEYS["comenta"], .4),
    ]


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = [f'''      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s}" data-duration="{e - s:.2f}"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:5"></div>''' for c, s, e in SCENES]
    hosts.append(f'''      <div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>''')
    vd = round(dur(os.path.join(ROOT, VOICE)), 2)
    e0, e1 = SC["s8-avo"][0], SC["s10-pergunta"][0]
    audio = [
        f'      <audio id="voz" class="clip" src="{VOICE}" data-start="0" data-duration="{vd}" data-volume="1" data-track-index="4"></audio>',
        f'      <audio id="trilha-a" class="clip" src="assets/music/positive-background.mp3" data-start="0" data-duration="{e0:.2f}" data-media-start="70" data-volume="0.12" data-fade-out="0.8" data-track-index="5"></audio>',
        f'      <audio id="trilha-b" class="clip" src="assets/music/positive-background.mp3" data-start="{e0}" data-duration="{e1 - e0:.2f}" data-media-start="{70 + e0:.2f}" data-volume="0.05" data-fade-in="0.8" data-fade-out="0.6" data-track-index="5"></audio>',
        f'      <audio id="trilha-c" class="clip" src="assets/music/positive-background.mp3" data-start="{e1}" data-duration="{TOTAL - e1:.2f}" data-media-start="{70 + e1:.2f}" data-volume="0.13" data-fade-in="0.4" data-fade-out="1.2" data-track-index="5"></audio>',
    ]
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
    <script src="assets/timing.js"></script>
    <style>
      @font-face {{ font-family: 'Permanent Marker'; src: url('assets/fonts/permanent-marker-latin-400-normal.woff2') format('woff2'); }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #15122b; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
      #c3d {{ position: absolute; inset: 0; width: 1080px; height: 1920px; z-index: 0; }}
      .fontwarm {{ position: absolute; left: -9999px; top: 0; }}
    </style>
  </head>
  <body>
    <!-- E se você tivesse um olho que copia tudo — 3D (gerado por tools/build_olho.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920"></canvas>
      <div class="fontwarm"><span style="font-family:'Archivo Black'">A</span><span style="font-family:'Permanent Marker'">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/olho3d.js"></script>
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
    os.makedirs(os.path.join(ROOT, "assets/fonts"), exist_ok=True)
    shutil.copy(os.path.join(os.path.dirname(ROOT), "craque-dia01/assets/fonts/permanent-marker-latin-400-normal.woff2"), os.path.join(ROOT, "assets/fonts/"))
    for fn in (s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, caps):
        fn()
    with open(os.path.join(ROOT, "assets/timing.js"), "w") as f:
        f.write("window.HF_T = " + json.dumps({"scenes": SCENES, "sc": SC, "k": KEYS, "total": TOTAL}) + ";\n")
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "olho", "name": "E se você tivesse um olho que copia tudo (3D)", "createdAt": "2026-11-07T23:10:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, SCENES)
