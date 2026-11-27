"""Gera o episódio 3D "E se você acordasse com um relógio alienígena" em relogio/.

O 3D (Three.js, design original) fica em relogio/assets/relogio3d.js e é desenhado a partir do tempo.
Este script gera os tempos-chave (assets/timing.js), os textos por cena (GSAP),
as legendas e a raiz com áudio.
Uso: python3 tools/build_relogio.py
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

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "relogio")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao.wav"

PARS = [
    "E se você acordasse amanhã|com um Omnitrix no pulso?|Você abre o olho.|Tem um relógio verde|no seu pulso.|Não é seu.|Você tem 24 horas|e 10 transformações.|O que faz primeiro?",
    "O relógio acende|10 silhuetas.|Qual você escolhe primeiro?",
    "Alien número 1:|4 Braços.|Força de 10 toneladas.|O cara ergue um carro.|Ninguém te xinga no trânsito.",
    "Alien número 2:|XLR8.|500 quilômetros por hora.|Você chega no colégio|em 4 segundos|e tira a foto|da professora caindo.",
    "Salvar o mundo?|Errado.|Ficar rico?|Errado.|O jeito é outro.",
    "Alien número 3:|Chama.|Bola de fogo na mão.|Você usa pra acender|o cigarro do crush.|Clássico.",
    "Alien 4 e 5:|Diamante e Fantasmático.|Parede de cristal na prova.|Invisível no recreio.|Você passou de ano|sem estudar.",
    "Depois de 24 horas,|o relógio sai do pulso.|E você percebe?|Não precisava virar alien|pra ser herói.",
    "Letra A:|salvaria o mundo.|Letra B:|zoaria geral.|Comenta A ou B.",
]
FIX = {"ese": ["e", "se"], "tricks": ["omnitrix"], "alem": ["alien"], "anos": ["ano"], "evoce": ["e", "voce"], "para": ["pra"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.0, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-acorda", "s2-silhuetas", "s3-forca", "s4-velocidade", "s5-errado", "s6-fogo", "s7-prova", "s8-fim", "s9-pergunta"]
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
    "olho": W(0, "olho"), "relogio0": W(0, "relogio"), "horas": W(0, "horas"), "primeiro0": W(0, "primeiro"),
    "silhuetas": W(1, "silhuetas"), "escolhe": W(1, "escolhe"),
    "forca": W(2, "forca"), "ergue": W(2, "ergue"), "transito": W(2, "transito"),
    "xlr8": W(3, "xlr8"), "quilometros": W(3, "500"), "chega": W(3, "chega"), "foto": W(3, "foto"), "caindo": W(3, "caindo"),
    "errado1": W(4, "errado"), "rico": W(4, "rico"), "errado2": W(4, "errado", 1), "outro": W(4, "outro"),
    "chama": W(5, "chama"), "fogo": W(5, "fogo"), "acender": W(5, "acender"), "classico": W(5, "classico"),
    "cristal": W(6, "cristal"), "invisivel": W(6, "invisivel"), "passou": W(6, "passou"),
    "sai": W(7, "sai"), "percebe": W(7, "percebe"), "heroi": W(7, "heroi"),
    "letraA": W(8, "salvaria"), "letraB": W(8, "zoaria"), "comenta": W(8, "comenta"),
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
    t0 = SC[sc][0]
    body = f'''
    <div style="position:absolute;left:0;right:0;top:230px;text-align:center;z-index:8"><div id="s1-title-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;line-height:1.05;color:#5cff8a;-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:9px 9px 0 {INK}">E SE VOCÊ<br>ACORDASSE COM ISSO?</div></div>
    {tag("s1-24", "⏱ 24 HORAS · 10 TRANSFORMAÇÕES", 70, 1060, "#5cff8a", 42)}'''
    js = f'''
      tl.fromTo("#s1-title-in", {{ scale: 1.15 }}, {{ scale: 1, duration: .4, ease: "back.out(2)" }}, 0);
      tl.to("#s1-title-in", {{ y: -40, opacity: 0, duration: .3 }}, {KEYS["olho"] - t0 + .2});
      {pop("#s1-24-in", KEYS["horas"] - t0, -3)}'''
    ov(sc, body, js)


def s2():
    sc = "s2-silhuetas"
    t0 = SC[sc][0]
    body = f'''{tag("s2-q", "QUAL PRIMEIRO? 🤔", 280, 330, "#ffffff", 50)}'''
    js = f'''{pop("#s2-q-in", KEYS["escolhe"] - t0, 3)}'''
    ov(sc, body, js)


def s3():
    sc = "s3-forca"
    t0 = SC[sc][0]
    body = f'''{tag("s3-1", "#1 · 10 TONELADAS 💪", 70, 330, "#ff8a8a", 46)}
    {sfx_word("s3-up", "UP!", RED, 140, -8, "left:640px;top:520px;z-index:8")}
    {tag("s3-t", "TRÂNSITO: 🤐", 560, 1060, "#ffffff", 44)}'''
    js = f'''{pop("#s3-1-in", KEYS["forca"] - t0, -3)}
      {pop("#s3-up-in", KEYS["ergue"] - t0 + .2, -8)}
      {pop("#s3-t-in", KEYS["transito"] - t0, 4)}'''
    ov(sc, body, js)


def s4():
    sc = "s4-velocidade"
    t0 = SC[sc][0]
    body = f'''{tag("s4-1", "#2 · 500 KM/H ⚡", 70, 330, "#8ad8ff", 46)}
    {tag("s4-s", "⏱ 4 SEGUNDOS", 600, 420, "#ffffff", 42)}
    <div id="s4-flash" style="position:absolute;inset:0;background:#fff;opacity:0;z-index:9"></div>
    {sfx_word("s4-click", "CLICK! 📸", "#fff", 110, 6, "left:420px;top:620px;z-index:10")}'''
    js = f'''{pop("#s4-1-in", KEYS["xlr8"] - t0, -3)}
      {pop("#s4-s-in", KEYS["chega"] - t0 + .6, 3)}
      tl.fromTo("#s4-flash", {{ opacity: 0 }}, {{ opacity: .9, duration: .06 }}, {KEYS["foto"] - t0 + .2});
      tl.to("#s4-flash", {{ opacity: 0, duration: .3 }}, {KEYS["foto"] - t0 + .3});
      {pop("#s4-click-in", KEYS["foto"] - t0 + .25, 6)}'''
    ov(sc, body, js)


def s5():
    sc = "s5-errado"
    t0 = SC[sc][0]
    def xq(cid, txt, top, t, tx):
        return (f'<div id="{cid}" style="position:absolute;left:0;right:0;top:{top}px;text-align:center;z-index:6;opacity:0"><div style="position:relative;display:inline-block;font-family:Archivo Black;font-size:72px;color:#fff;-webkit-text-stroke:10px {INK};paint-order:stroke fill">{txt}<div id="{cid}-x" style="position:absolute;left:-10px;right:-10px;top:48%;height:14px;background:{RED};transform-origin:0% 50%;transform:scaleX(0)"></div></div></div>',
                f'tl.fromTo("#{cid}", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: .25 }}, {t});tl.fromTo("#{cid}-x", {{ scaleX: 0 }}, {{ scaleX: 1, duration: .2 }}, {tx});')
    a = xq("s5-a", "SALVAR O MUNDO?", 360, PSTART[4] - t0, KEYS["errado1"] - t0)
    b = xq("s5-b", "FICAR RICO?", 500, KEYS["rico"] - t0 - .5, KEYS["errado2"] - t0)
    c = (f'{tag("s5-c", "O JEITO É OUTRO 😏", 230, 1040, "#5cff8a", 50)}', f'{pop("#s5-c-in", KEYS["outro"] - t0, -3)}')
    ov(sc, a[0] + b[0] + c[0], a[1] + b[1] + c[1])


def s6():
    sc = "s6-fogo"
    t0 = SC[sc][0]
    body = f'''{tag("s6-1", "#3 · BOLA DE FOGO 🔥", 70, 330, "#ffb36b", 46)}
    {tag("s6-c", "CLÁSSICO. 😎", 600, 1060, "#ffffff", 46)}'''
    js = f'''{pop("#s6-1-in", KEYS["chama"] - t0, -3)}
      {pop("#s6-c-in", KEYS["classico"] - t0, 4)}'''
    ov(sc, body, js)


def s7():
    sc = "s7-prova"
    t0 = SC[sc][0]
    body = f'''{tag("s7-1", "#4 · PAREDE DE CRISTAL 💎", 60, 330, "#9fefff", 42)}
    {tag("s7-2", "#5 · INVISÍVEL 👻", 60, 410, "#d8c8ff", 42)}
    {tag("s7-3", "PASSOU DE ANO ✅ (SEM ESTUDAR)", 70, 1060, "#5cff8a", 40)}'''
    js = f'''{pop("#s7-1-in", KEYS["cristal"] - t0, -3)}
      {pop("#s7-2-in", KEYS["invisivel"] - t0, 3)}
      {pop("#s7-3-in", KEYS["passou"] - t0, -2)}'''
    ov(sc, body, js)


def s8():
    sc = "s8-fim"
    t0 = SC[sc][0]
    body = f'''<div style="position:absolute;left:0;right:0;top:300px;text-align:center;z-index:6"><div id="s8-t" style="display:inline-block;opacity:0;font-family:'Archivo Black';font-size:66px;line-height:1.1;color:#fff;-webkit-text-stroke:10px {INK};paint-order:stroke fill">NÃO PRECISAVA<br>VIRAR ALIEN 💚</div></div>'''
    js = f'''tl.fromTo("#s8-t", {{ opacity: 0, scale: .9 }}, {{ opacity: 1, scale: 1, duration: .4 }}, {KEYS["heroi"] - t0 - .8});'''
    ov(sc, body, js)


def s9():
    sc = "s9-pergunta"
    t0 = SC[sc][0]

    def card(k, letter, col, icon, title, x):
        return f'''<div id="s9-{k}" style="position:absolute;left:{x}px;top:1400px;width:390px;z-index:4">
          <div id="s9-{k}-in" style="position:relative;background:{col};border:10px solid {INK};border-radius:40px;box-shadow:14px 14px 0 {INK};padding:22px 10px 20px;text-align:center">
            <div style="position:absolute;left:-30px;top:-40px;width:110px;height:110px;border-radius:50%;background:#fff;border:9px solid {INK};font-family:'Archivo Black';font-size:66px;line-height:92px;color:{INK}">{letter}</div>
            <div style="font-size:90px;line-height:1.1">{icon}</div>
            <div style="font-family:'Archivo Black';font-size:44px;line-height:1.05;color:#fff;-webkit-text-stroke:8px {INK};paint-order:stroke fill;margin-top:6px">{title}</div></div></div>'''
    body = f'''
    <div style="position:absolute;left:0;right:0;top:230px;text-align:center;z-index:5"><div id="s9-t-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;color:#5cff8a;-webkit-text-stroke:11px {INK};paint-order:stroke fill;text-shadow:9px 9px 0 {INK}">E VOCÊ? ⌚</div></div>
    {card("a", "A", "#2a9d8f", "🌍", "SALVARIA<br>O MUNDO", 100)}
    {card("b", "B", MAG, "😂", "ZOARIA<br>GERAL", 545)}
    <div style="position:absolute;left:0;right:0;top:1740px;text-align:center;z-index:6"><div id="s9-com-in" style="display:inline-block;font-family:'Archivo Black';font-size:76px;color:#fff;-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">COMENTA A OU B 👇</div></div>'''
    js = f'''
      tl.fromTo("#s9-t-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2.5)" }}, 0);
      tl.fromTo("#s9-a-in", {{ x: -700, rotation: -15 }}, {{ x: 0, rotation: -3, duration: .4, ease: "back.out(1.4)" }}, {KEYS["letraA"] - t0 - .3});
      tl.fromTo("#s9-b-in", {{ x: 700, rotation: 15 }}, {{ x: 0, rotation: 3, duration: .4, ease: "back.out(1.4)" }}, {KEYS["letraB"] - t0 - .3});
      tl.fromTo("#s9-com-in", {{ scale: 0, rotation: -10 }}, {{ scale: 1, rotation: -2, duration: .35, ease: "back.out(2.5)" }}, {KEYS["comenta"] - t0});'''
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
    return [("whoosh.mp3", 0.0, .3), ("glitch-1.mp3", KEYS["relogio0"], .35), ("sparkle.mp3", KEYS["relogio0"] + .2, .35), ("pop.mp3", KEYS["horas"], .3),
            ("previsao.wav", KEYS["silhuetas"] - .4, .3) if os.path.exists(os.path.join(ROOT, "assets/sfx/previsao.wav")) else ("sparkle.mp3", KEYS["silhuetas"], .3),
            ("impact-bass-1.mp3", KEYS["forca"], .45), ("whoosh.mp3", KEYS["ergue"], .35), ("impact-bass-2.mp3", KEYS["ergue"] + .5, .35),
            ("whoosh-short.mp3", KEYS["xlr8"], .35), ("whoosh.mp3", KEYS["quilometros"], .4), ("boing.wav", KEYS["caindo"] - .4, .35), ("click-soft.mp3", KEYS["foto"] + .2, .5),
            ("error.mp3", KEYS["errado1"], .35), ("error.mp3", KEYS["errado2"], .35), ("pop.mp3", KEYS["outro"], .3),
            ("fogo.wav", KEYS["fogo"] - .3, .4), ("pop.mp3", KEYS["classico"], .3),
            ("sparkle.mp3", KEYS["cristal"], .4), ("whoosh-short.mp3", KEYS["invisivel"], .35), ("pop.mp3", KEYS["passou"], .3),
            ("click-soft.mp3", KEYS["sai"], .4), ("sparkle.mp3", KEYS["heroi"] - .8, .3),
            ("whoosh.mp3", KEYS["letraA"] - .3, .35), ("whoosh.mp3", KEYS["letraB"] - .3, .35), ("sparkle.mp3", KEYS["comenta"], .35)]


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = [f'''      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s}" data-duration="{e - s:.2f}"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:5"></div>''' for c, s, e in SCENES]
    hosts.append(f'''      <div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>''')
    vd = round(dur(os.path.join(ROOT, VOICE)), 2)
    e0, e1 = SC["s8-fim"][0], SC["s9-pergunta"][0]
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
    <!-- E se você acordasse com um relógio alienígena — 3D (gerado por tools/build_relogio.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920"></canvas>
      <div class="fontwarm"><span style="font-family:'Archivo Black'">A</span><span style="font-family:'Permanent Marker'">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/relogio3d.js"></script>
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
    for fn in (s1, s2, s3, s4, s5, s6, s7, s8, s9, caps):
        fn()
    with open(os.path.join(ROOT, "assets/timing.js"), "w") as f:
        f.write("window.HF_T = " + json.dumps({"scenes": SCENES, "sc": SC, "k": KEYS, "total": TOTAL}) + ";\n")
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "relogio", "name": "E se você acordasse com um relógio alienígena (3D)", "createdAt": "2026-11-08T17:45:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, SCENES)
