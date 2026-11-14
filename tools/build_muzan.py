"""Gera o vídeo 3D de curiosidade "Por que o Muzan tem medo do Tanjiro?" em muzan/.

O 3D (Three.js) fica em muzan/assets/muzan3d.js e é desenhado a partir do tempo.
Este script gera os tempos-chave, os textos por cena (estilo documentário), as
legendas sóbrias e a raiz com voz, trilha sintetizada e efeitos.
Uso: python3 tools/build_muzan.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "muzan")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-muzan.wav"
CRIM, GOLD, ICE = "#ff2a3a", "#ffd21a", "#9fd8ff"

PARS = [
    "O demônio mais poderoso|de Demon Slayer|tem mil anos,|não morre com quase nada…|e mesmo assim|tem medo de um garoto.|Por quê?",
    "Tudo começa num detalhe:|o brinco.|Quando o Muzan vê o Tanjiro|pela primeira vez,|ele não olha pro rosto.|Olha pros brincos.",
    "Porque, uns 400 anos antes,|um espadachim|usava brincos iguais.|O criador|da Respiração do Sol.|E ele quase matou o Muzan.",
    "Os cortes daquela lâmina|não regeneravam.|Queimaram no corpo do Muzan|por séculos.|Pra quem regenera de quase tudo…|isso é terror puro.",
    "Pra fugir,|o Muzan explodiu o próprio corpo|em 1.800 pedaços.|O espadachim cortou 1.500.|O demônio mais forte do mundo…|sobreviveu escondido,|em pedacinhos.",
    "E o segredo daquela técnica|nunca morreu.|A família do Tanjiro|guardou tudo|numa dança de ano novo,|passada de pai pra filho.|Era a Respiração do Sol,|disfarçada.",
    "O Muzan tem 7 corações|e 5 cérebros,|que mudam de lugar|dentro do corpo.|Quase impossível de acertar.",
    "Mas a Respiração do Sol|tem 12 formas.|E repetidas sem parar,|em círculo,|viram a 13ª:|um ataque contínuo,|feito pra acertar|todos os pontos vitais.",
    "Então o Muzan|não tem medo do Tanjiro.|Ele tem medo|do que o Tanjiro carrega:|a lembrança do único homem|que quase acabou com ele.",
    "E pra você,|quem era mais assustador|pro Muzan:|o espadachim do passado…|ou o Tanjiro?|Comenta A ou B.",
]
FIX = {"para": ["pra"], "musan": ["muzan"], "tangero": ["tanjiro"], "espadachinho": ["espadachim"], "espadaxim": ["espadachim"], "demonslayer": ["demon", "slayer"],
       "eele": ["e", "ele"], "eo": ["e", "o"], "erepetidas": ["e", "repetidas"], "epra": ["e", "pra"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-rua", "s2-brinco", "s3-passado", "s4-ferida", "s5-pedacos", "s6-danca", "s7-orgaos", "s8-formas", "s9-sol", "s10-pergunta"]
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
    "garoto": W(0, "garoto"), "brinco": W(1, "brinco"), "olha": W(1, "olha", 1),
    "anos2": W(2, "400"), "espadachim": W(2, "espadachim"), "matou": W(2, "matou"),
    "cortes": W(3, "cortes"), "seculos": W(3, "seculos"), "terror": W(3, "terror"),
    "explodiu": W(4, "explodiu"), "pedacos": W(4, "1800"), "cortou": W(4, "cortou"), "pedacinhos": W(4, "pedacinhos"),
    "danca": W(5, "danca"), "disfarcada": W(5, "disfarcada"),
    "coracoes": W(6, "coracoes"), "cerebros": W(6, "cerebros"),
    "formas": W(7, "formas"), "circulo": W(7, "circulo"), "decima": W(7, "13"),
    "carrega": W(8, "carrega"), "lembranca": W(8, "lembranca"),
    "passado": W(9, "passado"), "tanjiro9": W(9, "tanjiro"), "comenta": W(9, "comenta"),
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
    sc = "s1-rua"
    l1 = lbl2("s1-l1", "⚠️ SPOILERS DO MANGÁ", 70, 230, .2, GOLD, 34)
    b = big("s1-t", "O DEMÔNIO MAIS FORTE…<br><span style='color:#ff2a3a'>COM MEDO?</span>", 330, at(sc, "garoto"), 70, "#ffffff")
    ov(sc, l1[0] + b[0], l1[1] + b[1])


def s2():
    sc = "s2-brinco"
    b = big("s2-t", "O BRINCO", 300, at(sc, "brinco"), 110, GOLD)
    ov(sc, b[0], b[1])


def s3():
    sc = "s3-passado"
    l1 = lbl2("s3-l1", "400 ANOS ATRÁS", 70, 300, at(sc, "anos2"), GOLD)
    l2 = lbl2("s3-l2", "CRIADOR DA RESPIRAÇÃO DO SOL ☀️", 70, 380, at(sc, "espadachim", 1.2), GOLD, 34)
    ov(sc, l1[0] + l2[0], l1[1] + l2[1])


def s4():
    sc = "s4-ferida"
    l1 = lbl2("s4-l1", "A FERIDA QUE NÃO FECHAVA", 70, 300, at(sc, "cortes", .3), CRIM)
    ov(sc, l1[0], l1[1])


def s5():
    sc = "s5-pedacos"
    t0 = SC[sc][0]
    body = f'''<div class="big" id="s5-a" style="top:300px;font-size:110px;color:{CRIM};opacity:0">1.800</div>
    <div class="big" id="s5-b" style="top:430px;font-family:'Space Mono';font-weight:700;font-size:40px;opacity:0">PEDAÇOS · <span style="color:#ffd21a">1.500 CORTADOS</span> · 300 FUGIRAM</div>'''
    js = f'''tl.fromTo("#s5-a", {{ opacity: 0, scale: .8 }}, {{ opacity: 1, scale: 1, duration: .3 }}, {at(sc, "pedacos")});
      tl.fromTo("#s5-b", {{ opacity: 0 }}, {{ opacity: 1, duration: .3 }}, {at(sc, "cortou")});'''
    ov(sc, body, js)


def s6():
    sc = "s6-danca"
    l1 = lbl2("s6-l1", "DANÇA DO DEUS DO FOGO 🔥", 70, 300, at(sc, "danca"), GOLD)
    ov(sc, l1[0], l1[1])


def s7():
    sc = "s7-orgaos"
    l1 = lbl2("s7-l1", "7 CORAÇÕES ❤️", 70, 300, at(sc, "coracoes"), CRIM)
    l2 = lbl2("s7-l2", "5 CÉREBROS 🧠", 70, 380, at(sc, "cerebros"), "#ff8ad0")
    ov(sc, l1[0] + l2[0], l1[1] + l2[1])


def s8():
    sc = "s8-formas"
    t0 = SC[sc][0]
    body = f'''<div class="big" id="s8-a" style="top:300px;font-size:90px;color:{GOLD};opacity:0">12 FORMAS</div>
    <div class="big" id="s8-b" style="top:1000px;font-size:96px;color:#fff;opacity:0">→ 13ª</div>'''
    js = f'''tl.fromTo("#s8-a", {{ opacity: 0 }}, {{ opacity: 1, duration: .3 }}, {at(sc, "formas")});
      tl.fromTo("#s8-b", {{ opacity: 0, scale: 1.4 }}, {{ opacity: 1, scale: 1, duration: .3 }}, {at(sc, "decima")});'''
    ov(sc, body, js)


def s9():
    sc = "s9-sol"
    b = big("s9-t", "NÃO É MEDO DO GAROTO…", 300, at(sc, "carrega", -.8), 64, "#ffffff")
    l1 = lbl2("s9-l1", "É MEDO DA LEMBRANÇA", 70, 440, at(sc, "lembranca"), GOLD)
    ov(sc, b[0] + l1[0], b[1] + l1[1])


def s10():
    sc = "s10-pergunta"

    def card(k, letter, col, title, x):
        return f'''<div id="s10-{k}" style="position:absolute;left:{x}px;top:1380px;width:400px;z-index:4;opacity:0">
          <div style="background:rgba(8,5,6,.85);border:4px solid {col};box-shadow:0 0 30px {col}66;padding:26px 18px;text-align:center">
            <div style="font-family:'Space Mono';font-weight:700;font-size:60px;color:{col}">{letter}</div>
            <div style="font-family:'Archivo Black';font-size:40px;line-height:1.1;color:#fff;margin-top:6px">{title}</div></div></div>'''
    body = f'''<div class="big" style="top:250px;font-size:64px">QUEM ERA MAIS<br>ASSUSTADOR?</div>
    {card("a", "A", "#ffd21a", "O ESPADACHIM<br>DO SOL ☀️", 90)}
    {card("b", "B", "#ff7a1a", "O<br>TANJIRO 🔥", 590)}
    <div class="big" id="s10-c" style="top:1700px;font-family:'Space Mono';font-weight:700;font-size:54px;opacity:0">COMENTA A OU B ↓</div>'''
    js = f'''tl.fromTo("#s10-a", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .4 }}, {at(sc, "passado", -.6)});
      tl.fromTo("#s10-b", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .4 }}, {at(sc, "tanjiro9")});
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
    return [("whoosh.mp3", 0.2, .3), ("impact-bass-2.mp3", KEYS["garoto"], .35), ("previsao.wav", KEYS["brinco"], .35), ("impact-bass-1.mp3", KEYS["olha"], .4),
            ("apagar.wav", KEYS["anos2"] - .9, .35), ("fogo.wav", KEYS["espadachim"], .35), ("impact-bass-2.mp3", KEYS["matou"], .4),
            ("fogo.wav", KEYS["cortes"], .3), ("glitch-1.mp3", KEYS["terror"], .25),
            ("impact-bass-1.mp3", KEYS["explodiu"], .5), ("crack.wav", KEYS["explodiu"] + .1, .35), ("whoosh.mp3", KEYS["cortou"] - .3, .35), ("whoosh.mp3", KEYS["cortou"], .35),
            ("fogo.wav", KEYS["danca"], .35), ("sparkle.mp3", KEYS["disfarcada"], .3),
            ("bip.wav", KEYS["coracoes"], .3), ("bip.wav", KEYS["cerebros"], .3),
            ("fogo.wav", KEYS["formas"], .3), ("whoosh.mp3", KEYS["circulo"], .35), ("impact-bass-1.mp3", KEYS["decima"], .45),
            ("volta.wav", KEYS["lembranca"] - .3, .35), ("whoosh.mp3", KEYS["passado"] - .6, .3), ("whoosh.mp3", KEYS["tanjiro9"], .3)]


def _unused_sfx():
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
        f'      <audio id="trilha" class="clip" src="assets/music/trilha-carmesim.wav" data-start="0" data-duration="{TOTAL}" data-volume="0.3" data-fade-out="2" data-track-index="5"></audio>',
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
    <!-- Por que o Muzan tem medo do Tanjiro? — 3D (gerado por tools/build_muzan.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920"></canvas>
      <div class="fontwarm"><span style="font-family:'Space Mono';font-weight:700">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/muzan3d.js"></script>
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
        json.dump({"id": "muzan", "name": "Por que o Muzan tem medo do Tanjiro? (3D)", "createdAt": "2026-11-08T15:15:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, SCENES)
