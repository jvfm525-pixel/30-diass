"""Gera o episódio 3D "E se você tivesse as bolas de aço da rotação?" em rotacao/.

O 3D (Three.js) fica em rotacao/assets/rotacao3d.js e é desenhado a partir do tempo.
Este script gera os tempos-chave, os textos por cena (estilo documentário), as
legendas sóbrias e a raiz com voz, trilha sintetizada e efeitos.
Uso: python3 tools/build_rotacao.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "rotacao")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-rotacao.wav"
CRIM, GOLD, ICE = "#ffc94a", "#ffc94a", "#9fd8ff"

PARS = [
    "Imagina abrir uma caixa velha|do seu avô|e encontrar duas bolas de aço.|Pesadas,|gravadas…|e que giram|como se tivessem vida.",
    "O segredo não é força.|É proporção.|Um para 1,618:|a proporção áurea.|A mesma espiral do caracol,|do girassol…|e das galáxias.",
    "Primeiro arremesso:|você erra todas as latas.|Mas a bola faz a curva…|e volta sozinha|pra sua mão.",
    "Aí você descobre|a parte estranha:|a rotação passa|pras coisas que a bola toca.|A água vira|um redemoinho perfeito.|Em espiral.",
    "E o primeiro grande feito|da história|da técnica de rotação…|foi abrir o pote de pepino|que ninguém da casa conseguia.",
    "Você treina o dia inteiro.|312 tentativas.|A bola não obedece.|Quanto mais força,|pior ela gira.",
    "Até que você olha um girassol.|55 espirais pra um lado,|89 pro outro.|A natureza não força.|Ela segue a proporção.",
    "O próximo arremesso|sai sem força.|Só proporção.|E pela primeira vez…|a rotação é perfeita.",
    "À noite,|o seu avô,|que não mexia a mão direito|fazia anos,|pega a bola.|Ela gira devagar|na palma dele.|E os dedos…|voltam a se mexer.",
    "Se você tivesse|a técnica de rotação…|usaria pra lutar,|ou pra curar?|Comenta A ou B.",
]
FIX = {"para": ["pra"], "redemoino": ["redemoinho"], "pipino": ["pepino"], "eo": ["e", "o"], "epela": ["e", "pela"], "eos": ["e", "os"], "piora": ["pior"], "olhe": ["olha"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-sotao", "s2-proporcao", "s3-quintal", "s4-agua", "s5-pote", "s6-treino", "s7-girassol", "s8-perfeito", "s9-avo", "s10-pergunta"]
SCENES = []
for k, n in enumerate(NAMES):
    s = 0.0 if k == 0 else round(PSTART[k] - .15, 2)
    e = TOTAL if k == len(NAMES) - 1 else round(PSTART[k + 1] - .15, 2)
    SCENES.append((n, s, e))
SC = {n: (s, e) for n, s, e in SCENES}


def W(par, word, nth=0):
    hits = [w for w in WORDS if w[0] == par and w[3].startswith(norm(word))]
    return round(hits[nth][4], 2)


KEYS = {
    "caixa": W(0, "caixa"), "giram": W(0, "giram"),
    "proporcao": W(1, "proporcao"), "aurea": W(1, "aurea"), "caracol": W(1, "caracol"), "girassol": W(1, "girassol"), "galaxias": W(1, "galaxias"),
    "arremesso": W(2, "arremesso"), "latas": W(2, "latas"), "curva": W(2, "curva"), "mao": W(2, "mao"),
    "toca": W(3, "toca"), "agua": W(3, "agua"), "espiral3": W(3, "espiral"),
    "pote": W(4, "pote"), "conseguia": W(4, "conseguia"),
    "tentativas": W(5, "tentativas"), "forca": W(5, "forca"),
    "espirais": W(6, "espirais"), "outro": W(6, "outro"), "natureza": W(6, "natureza"),
    "arremesso8": W(7, "arremesso"), "perfeita": W(7, "perfeita"),
    "gira": W(8, "gira"), "dedos": W(8, "dedos"),
    "lutar": W(9, "lutar"), "curar": W(9, "curar"), "comenta": W(9, "comenta"),
}


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


CSS = f'''#root {{ background: transparent; }}
  .lbl {{ position:absolute; font-family:'Space Mono',monospace; font-weight:700; color:#fff; letter-spacing:.06em; text-transform:uppercase;
    background:rgba(8,6,14,.72); border-left:8px solid {CRIM}; padding:10px 22px; font-size:38px; }}
  .big {{ position:absolute; left:0; right:0; text-align:center; font-family:'Archivo Black'; color:#fff; letter-spacing:.02em; text-shadow:0 6px 24px rgba(0,0,0,.8); }}
  .tint {{ position:absolute; inset:0; background:radial-gradient(circle at 50% 45%, rgba(120,0,20,.15), rgba(90,0,15,.75)); mix-blend-mode:multiply; opacity:0; }}
  .scan {{ position:absolute; inset:0; opacity:0; background:repeating-linear-gradient(0deg, rgba(255,40,70,.18) 0 2px, rgba(0,0,0,0) 2px 7px); }}
  .clk {{ position:absolute; right:70px; top:200px; font-family:'Space Mono',monospace; font-weight:700; font-size:54px; color:{CRIM}; background:rgba(8,6,14,.8); border:4px solid {CRIM}; padding:4px 18px; opacity:0; }}
  .win {{ position:absolute; left:120px; top:330px; width:840px; height:560px; border:6px solid {ICE}; box-shadow:0 0 40px rgba(159,216,255,.6), inset 0 0 60px rgba(159,216,255,.35); opacity:0; }}
  .win .t {{ position:absolute; left:16px; top:10px; font-family:'Space Mono',monospace; font-weight:700; font-size:40px; color:{ICE}; }}'''


def ov(sc, body, js):
    write(sc, scene(sc, body, js, CSS, bg="transparent"))


def erase_fx(sc, a, b):
    """Efeito do tempo apagado (tinta vermelha, linhas e relógio que salta 11 s)."""
    t0 = SC[sc][0]
    a, b = round(a - t0, 2), round(b - t0, 2)
    body = f'''<div id="{sc}-tint" class="tint" style="z-index:1"></div><div id="{sc}-scan" class="scan" style="z-index:1"></div>
    <div id="{sc}-clk" class="clk" style="z-index:6">⏱ <span id="{sc}-n">00:00</span></div>'''
    js = f'''
      tl.fromTo(["#{sc}-tint", "#{sc}-scan"], {{ opacity: 0 }}, {{ opacity: 1, duration: .25 }}, {a});
      tl.to(["#{sc}-tint", "#{sc}-scan"], {{ opacity: 0, duration: .3 }}, {b});
      tl.fromTo("#{sc}-clk", {{ opacity: 0 }}, {{ opacity: 1, duration: .2 }}, {a});
      tl.set("#{sc}-n", {{ textContent: "00:11" }}, {b - .05});
      tl.fromTo("#{sc}-clk", {{ scale: 1 }}, {{ scale: 1.25, duration: .12, yoyo: true, repeat: 1 }}, {b - .05});
      tl.to("#{sc}-clk", {{ opacity: 0, duration: .3 }}, {b + .9});'''
    return body, js


def vision(sc, at, dur=1.8, label="PREVISÃO: +7 s"):
    t0 = SC[sc][0]
    a = round(at - t0, 2)
    body = f'''<div id="{sc}-win" class="win" style="z-index:5"><div class="t">◉ {label}</div></div>'''
    js = f'''
      tl.fromTo("#{sc}-win", {{ opacity: 0, scale: 1.08 }}, {{ opacity: 1, scale: 1, duration: .25 }}, {a});
      tl.fromTo("#{sc}-win", {{ x: 0 }}, {{ x: 4, duration: .05, repeat: 5, yoyo: true, ease: "none", immediateRender: false }}, {a + .2});
      tl.to("#{sc}-win", {{ opacity: 0, duration: .3 }}, {a + dur});'''
    return body, js


def lbl(cid, text, left, top, at, sc, color=CRIM, size=38):
    t0 = SC[sc][0]
    return (f'<div id="{cid}" class="lbl" style="left:{left}px;top:{top}px;z-index:7;border-left-color:{color};font-size:{size}px;opacity:0">{text}</div>',
            f'tl.fromTo("#{cid}", {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: .3 }}, {round(at - t0, 2)});')


# ------------------------------------------------------------------ textos por cena
def at(sc, k, off=0.0):
    return round(KEYS[k] - SC[sc][0] + off, 2)


def lbl2(cid, text, left, top, t, color=GOLD, size=40):
    return (f'<div id="{cid}" class="lbl" style="left:{left}px;top:{top}px;z-index:7;border-left-color:{color};font-size:{size}px;opacity:0">{text}</div>',
            f'tl.fromTo("#{cid}", {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: .3 }}, {t});')


def big(cid, html, top, t, size=110, color=GOLD, out=None):
    b = f'<div class="big" id="{cid}" style="top:{top}px;font-size:{size}px;color:{color};opacity:0">{html}</div>'
    j = f'tl.fromTo("#{cid}", {{ opacity: 0, scale: .9 }}, {{ opacity: 1, scale: 1, duration: .4 }}, {t});'
    if out is not None:
        j += f'tl.to("#{cid}", {{ opacity: 0, duration: .3 }}, {out});'
    return b, j


def s1():
    sc = "s1-sotao"
    b = big("s1-t", "ROTAÇÃO", 300, at(sc, "giram"), 120)
    ov(sc, b[0], b[1])


def s2():
    sc = "s2-proporcao"
    b = big("s2-t", "1 : 1,618", 300, at(sc, "proporcao", .3), 120)
    l1 = lbl2("s2-l1", "PROPORÇÃO ÁUREA · φ", 70, 470, at(sc, "aurea"))
    ov(sc, b[0] + l1[0], b[1] + l1[1])


def s3():
    sc = "s3-quintal"
    l1 = lbl2("s3-l1", "ACERTOS: 0", 70, 300, at(sc, "latas"))
    l2 = lbl2("s3-l2", "VOLTAS: 1 ↺", 70, 380, at(sc, "mao"))
    ov(sc, l1[0] + l2[0], l1[1] + l2[1])


def s4():
    sc = "s4-agua"
    l1 = lbl2("s4-l1", "A ROTAÇÃO PASSA<br>PRAS COISAS", 70, 300, at(sc, "toca"))
    ov(sc, l1[0], l1[1])


def s5():
    sc = "s5-pote"
    l1 = lbl2("s5-l1", "POTE DE PEPINO: DERROTADO 🥒", 60, 300, at(sc, "conseguia", .3), GOLD, 38)
    ploc = big("s5-p", "<span style='-webkit-text-stroke:10px #0a0705;paint-order:stroke fill'>PLOC!</span>", 420, at(sc, "conseguia"), 100, GOLD)
    ov(sc, l1[0] + ploc[0], l1[1] + ploc[1] + f'tl.to("#s5-p", {{ opacity: 0, duration: .3 }}, {at(sc, "conseguia", 1.0)});')


def s6():
    sc = "s6-treino"
    t0 = SC[sc][0]
    body = f'<div class="lbl" id="s6-c" style="left:70px;top:300px;z-index:7;opacity:0">TENTATIVAS: <span id="s6-n">0</span></div>'
    js = f'''tl.fromTo("#s6-c", {{ opacity: 0 }}, {{ opacity: 1, duration: .3 }}, .2);
      tl.fromTo("#s6-n", {{ innerText: 0 }}, {{ innerText: 312, duration: {max(.5, KEYS["tentativas"] - t0)}, snap: {{ innerText: 1 }}, ease: "power1.in" }}, .2);'''
    ov(sc, body, js)


def s7():
    sc = "s7-girassol"
    l1 = lbl2("s7-l1", "55 ↻ · 89 ↺ (FIBONACCI)", 70, 300, at(sc, "espirais"))
    ov(sc, l1[0], l1[1])


def s8():
    sc = "s8-perfeito"
    b = big("s8-t", "ROTAÇÃO<br>PERFEITA", 300, at(sc, "perfeita"), 110)
    ov(sc, b[0], b[1])


def s9():
    sc = "s9-avo"
    ov(sc, "<div></div>", "")


def s10():
    sc = "s10-pergunta"

    def card(k, letter, col, title, x):
        return f'''<div id="s10-{k}" style="position:absolute;left:{x}px;top:1380px;width:400px;z-index:4;opacity:0">
          <div style="background:rgba(10,7,5,.82);border:4px solid {col};box-shadow:0 0 30px {col}66;padding:26px 18px;text-align:center">
            <div style="font-family:'Space Mono';font-weight:700;font-size:60px;color:{col}">{letter}</div>
            <div style="font-family:'Archivo Black';font-size:44px;line-height:1.1;color:#fff;margin-top:6px">{title}</div></div></div>'''
    body = f'''<div class="big" style="top:250px;font-size:76px">E VOCÊ?</div>
    {card("a", "A", "#ff6b4a", "PRA<br>LUTAR ⚔️", 90)}
    {card("b", "B", "#8ce99a", "PRA<br>CURAR 🩹", 590)}
    <div class="big" id="s10-c" style="top:1700px;font-family:'Space Mono';font-weight:700;font-size:54px;opacity:0">COMENTA A OU B ↓</div>'''
    js = f'''tl.fromTo("#s10-a", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .4 }}, {at(sc, "lutar")});
      tl.fromTo("#s10-b", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .4 }}, {at(sc, "curar")});
      tl.fromTo("#s10-c", {{ opacity: 0 }}, {{ opacity: 1, duration: .4 }}, {at(sc, "comenta")});'''
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
        html.append(f'<div id="cg{gi}" class="clip cg" data-start="{start:.2f}" data-duration="{max(.2, end - start):.2f}"><div id="cg{gi}-in" class="cbox">{spans}</div></div>')
        js.append(f'tl.fromTo("#cg{gi}-in", {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: .2 }}, {start:.2f});')
        for j, w in enumerate(ws):
            js.append(f'tl.fromTo("#cw{gi}-{j}", {{ color: "#ffffff" }}, {{ color: "{CRIM}", duration: .05, immediateRender: false }}, {w[4]:.2f});')
    css = '''#root { background: transparent; }
      .cg { position:absolute; left:90px; right:150px; top:1240px; text-align:center; }
      .cbox { display:inline-block; padding:8px 18px; background:rgba(6,5,10,.55); font-family:Montserrat; font-weight:800; font-size:50px; line-height:1.15; color:#fff;
        text-transform:uppercase; text-shadow:0 3px 10px rgba(0,0,0,.9); max-width:840px; }'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


def sfx_list():
    return [("nhec.wav", KEYS["caixa"] - .2, .35), ("giro.wav", KEYS["giram"] - .2, .4), ("metal.wav", KEYS["giram"] + .3, .3),
            ("previsao.wav", KEYS["proporcao"], .3), ("sparkle.mp3", KEYS["caracol"], .25), ("sparkle.mp3", KEYS["girassol"], .25), ("sparkle.mp3", KEYS["galaxias"], .3),
            ("whoosh.mp3", KEYS["arremesso"], .4), ("giro.wav", KEYS["curva"], .35), ("metal.wav", KEYS["mao"] + .25, .4),
            ("plic.wav", KEYS["toca"], .4), ("giro.wav", KEYS["agua"], .3),
            ("giro.wav", KEYS["pote"] - .3, .35), ("ploc.wav", KEYS["conseguia"], .5),
            ("toc.wav", SC["s6-treino"][0] + .5, .3), ("toc.wav", SC["s6-treino"][0] + 1.4, .3), ("toc.wav", SC["s6-treino"][0] + 2.3, .3),
            ("sparkle.mp3", KEYS["espirais"], .3), ("whoosh.mp3", KEYS["arremesso8"], .4), ("giro.wav", KEYS["arremesso8"] + .2, .4),
            ("impact-bass-1.mp3", KEYS["perfeita"], .45), ("crack.wav", KEYS["perfeita"], .4), ("giro.wav", KEYS["gira"], .25), ("sparkle.mp3", KEYS["dedos"], .3),
            ("whoosh.mp3", KEYS["lutar"], .3), ("whoosh.mp3", KEYS["curar"], .3)]


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = [f'''      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s}" data-duration="{e - s:.2f}"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:5"></div>''' for c, s, e in SCENES]
    hosts.append(f'''      <div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>''')
    vd = round(dur(os.path.join(ROOT, VOICE)), 2)
    audio = [
        f'      <audio id="voz" class="clip" src="{VOICE}" data-start="0" data-duration="{vd}" data-volume="1" data-track-index="4"></audio>',
        f'      <audio id="trilha" class="clip" src="assets/music/trilha-rotacao.wav" data-start="0" data-duration="{TOTAL}" data-volume="0.28" data-fade-out="2" data-track-index="5"></audio>',
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
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #0a0705; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
      #c3d {{ position: absolute; inset: 0; width: 1080px; height: 1920px; z-index: 0; }}
      .fontwarm {{ position: absolute; left: -9999px; top: 0; }}
    </style>
  </head>
  <body>
    <!-- E se você tivesse as bolas de aço da rotação? — 3D (gerado por tools/build_rotacao.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920"></canvas>
      <div class="fontwarm"><span style="font-family:'Space Mono';font-weight:700">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/rotacao3d.js"></script>
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
    for fn in (s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, caps):
        fn()
    with open(os.path.join(ROOT, "assets/timing.js"), "w") as f:
        f.write("window.HF_T = " + json.dumps({"scenes": SCENES, "sc": SC, "k": KEYS, "total": TOTAL}) + ";\n")
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "rotacao", "name": "E se você tivesse as bolas de aço da rotação? (3D)", "createdAt": "2026-11-08T03:00:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, SCENES)
