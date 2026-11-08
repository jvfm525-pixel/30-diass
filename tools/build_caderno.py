"""Gera o episódio 3D "E se você tivesse o caderno na vida real?" em caderno/.

O 3D (Three.js) fica em caderno/assets/caderno3d.js e é desenhado a partir do tempo.
Este script gera os tempos-chave, os textos por cena (estilo documentário), as
legendas sóbrias e a raiz com voz, trilha sintetizada e efeitos.
Uso: python3 tools/build_caderno.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "caderno")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-caderno.wav"
CRIM, GOLD, ICE = "#ff2a3a", "#ffd21a", "#9fd8ff"

PARS = [
    "Imagina que,|no meio do pátio da escola,|cai do céu um caderno preto.|E na primeira página|está escrito:|quem tiver o nome escrito aqui…|morre.",
    "Igual no Death Note,|tem uma regra:|precisa saber o nome…|e o rosto da pessoa.",
    "E aí vem o problema da vida real:|hoje, nome e rosto|de quase todo mundo|estão a um clique.|Numa rede social.",
    "No dia seguinte,|o valentão da sala|humilha alguém de novo.|Você abre o caderno|embaixo da mesa.|A caneta encosta no papel.|E você percebe|que bastam três segundos.",
    "Mas a vida real não é anime.|Na vida real,|um monte de mortes sem explicação,|todas ligadas à mesma escola,|vira um padrão.|E padrão…|a polícia acha numa planilha.",
    "E o pior nem é ser pego.|O pior é olhar no espelho|e ver que,|pra acabar com quem você odeia…|você virou exatamente|o que odiava.",
    "Aí você vê,|atrás de você no espelho,|alguma coisa sorrindo.|Ela está esperando|o primeiro nome.",
    "Então você tranca o caderno|numa gaveta.|Um dia.|Uma semana.|30 dias.|Sem escrever nada.",
    "Até que a criatura aparece de novo,|pega o caderno de volta|e fala:|em milhares de anos…|você é o primeiro humano|que nunca escreveu um nome.|Que tédio.",
    "E você?|Usaria o caderno|pra fazer justiça…|ou queimaria ele|no primeiro dia?|Comenta A ou B.",
]
FIX = {"para": ["pra"], "ena": ["e", "na"], "eai": ["e", "ai"], "evoce": ["e", "voce"], "epadrao": ["e", "padrao"], "eo": ["e", "o"], "morte": ["mortes"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-patio", "s2-regras", "s3-feed", "s4-sala", "s5-policia", "s6-espelho", "s7-criatura", "s8-gaveta", "s9-volta", "s10-pergunta"]
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
    "cai": W(0, "cai"), "pagina": W(0, "pagina"), "morre": W(0, "morre"),
    "regra": W(1, "regra"), "nome1": W(1, "nome"), "rosto": W(1, "rosto"),
    "clique": W(2, "clique"), "rede": W(2, "rede"),
    "valentao": W(3, "valentao"), "abre": W(3, "abre"), "caneta": W(3, "caneta"), "tres": W(3, "tres"),
    "anime": W(4, "anime"), "padrao": W(4, "padrao", 1), "planilha": W(4, "planilha"),
    "espelho5": W(5, "espelho"), "virou": W(5, "virou"),
    "sorrindo": W(6, "sorrindo"), "primeiro6": W(6, "primeiro"),
    "tranca": W(7, "tranca"), "dia7": W(7, "dia"), "semana": W(7, "semana"), "dias30": W(7, "dias"),
    "aparece": W(8, "aparece"), "pega": W(8, "pega"), "milhares": W(8, "milhares"), "tedio": W(8, "tedio"),
    "usaria": W(9, "usaria"), "queimaria": W(9, "queimaria"), "comenta": W(9, "comenta"),
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
    sc = "s1-patio"
    b = big("s1-t", "E SE FOSSE<br>REAL?", 280, at(sc, "cai", .8), 100, "#ffffff")
    tum = big("s1-tum", "<span style='-webkit-text-stroke:10px #000;paint-order:stroke fill'>TUM.</span>", 760, at(sc, "cai", 1.4), 90, "#ffffff")
    ov(sc, b[0] + tum[0], b[1] + tum[1] + f'tl.to("#s1-tum", {{ opacity: 0, duration: .3 }}, {at(sc, "cai", 2.4)});')


def s2():
    sc = "s2-regras"
    l1 = lbl2("s2-l1", "REGRA 1: NOME + ROSTO", 70, 300, at(sc, "nome1"), CRIM)
    ov(sc, l1[0], l1[1])


def s3():
    sc = "s3-feed"
    l1 = lbl2("s3-l1", "NOME + ROSTO = QUALQUER PERFIL", 60, 300, at(sc, "clique"), CRIM, 36)
    ov(sc, l1[0], l1[1])


def s4():
    sc = "s4-sala"
    b = big("s4-t", "3 SEGUNDOS", 300, at(sc, "tres"), 96, CRIM)
    ov(sc, b[0], b[1])


def s5():
    sc = "s5-policia"
    l1 = lbl2("s5-l1", "PADRÃO DETECTADO 📈", 70, 300, at(sc, "padrao"), CRIM)
    ov(sc, l1[0], l1[1])


def s6():
    sc = "s6-espelho"
    l1 = lbl2("s6-l1", "QUEM ESTÁ NO ESPELHO?", 70, 300, at(sc, "virou"), CRIM)
    ov(sc, l1[0], l1[1])


def s7():
    sc = "s7-criatura"
    ov(sc, "<div></div>", "")


def s8():
    sc = "s8-gaveta"
    t0 = SC[sc][0]
    body = '<div class="lbl" id="s8-d" style="left:70px;top:300px;z-index:7;opacity:0">DIA <span id="s8-n">1</span></div>'
    js = (f'tl.fromTo("#s8-d", {{ opacity: 0 }}, {{ opacity: 1, duration: .3 }}, {at(sc, "dia7", -.2)});'
          f'tl.set("#s8-n", {{ textContent: "7" }}, {at(sc, "semana", -.1)});'
          f'tl.set("#s8-n", {{ textContent: "30" }}, {at(sc, "dias30", -.1)});')
    ov(sc, body, js)


def s9():
    sc = "s9-volta"
    l1 = lbl2("s9-l1", "NENHUM NOME ESCRITO", 70, 300, at(sc, "milhares"), GOLD)
    b = big("s9-t", "“QUE TÉDIO.”", 820, at(sc, "tedio"), 80, GOLD)
    ov(sc, l1[0] + b[0], l1[1] + b[1])


def s10():
    sc = "s10-pergunta"

    def card(k, letter, col, title, x):
        return f'''<div id="s10-{k}" style="position:absolute;left:{x}px;top:1380px;width:400px;z-index:4;opacity:0">
          <div style="background:rgba(8,5,6,.85);border:4px solid {col};box-shadow:0 0 30px {col}66;padding:26px 18px;text-align:center">
            <div style="font-family:'Space Mono';font-weight:700;font-size:60px;color:{col}">{letter}</div>
            <div style="font-family:'Archivo Black';font-size:40px;line-height:1.1;color:#fff;margin-top:6px">{title}</div></div></div>'''
    body = f'''<div class="big" style="top:250px;font-size:76px">E VOCÊ?</div>
    {card("a", "A", "#9fd8ff", "USARIA PRA<br>“FAZER JUSTIÇA” ⚖️", 90)}
    {card("b", "B", "#ff7a1a", "QUEIMARIA<br>O CADERNO 🔥", 590)}
    <div class="big" id="s10-c" style="top:1700px;font-family:'Space Mono';font-weight:700;font-size:54px;opacity:0">COMENTA A OU B ↓</div>'''
    js = f'''tl.fromTo("#s10-a", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .4 }}, {at(sc, "usaria")});
      tl.fromTo("#s10-b", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .4 }}, {at(sc, "queimaria")});
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
    return [("whoosh.mp3", KEYS["cai"] - .2, .4), ("impact-bass-1.mp3", KEYS["cai"] + 1.4, .5), ("previsao.wav", KEYS["pagina"], .25),
            ("typing.mp3", KEYS["morre"] - .6, .2), ("impact-bass-2.mp3", KEYS["morre"], .35), ("typing.mp3", KEYS["nome1"] - .2, .2),
            ("notification.mp3", KEYS["clique"], .25), ("click-soft.mp3", KEYS["rede"], .3),
            ("nhec.wav", KEYS["abre"], .25), ("coracao.wav", KEYS["caneta"], .4), ("impact-bass-2.mp3", KEYS["tres"], .35),
            ("glitch-1.mp3", KEYS["padrao"], .3), ("bip.wav", KEYS["planilha"], .25),
            ("apagar.wav", KEYS["virou"] - .8, .35), ("volta.wav", KEYS["sorrindo"] - .3, .35), ("impact-bass-1.mp3", KEYS["sorrindo"], .4),
            ("cadeado.wav", KEYS["tranca"] + 1.0, .45), ("toc.wav", KEYS["dia7"], .3), ("toc.wav", KEYS["semana"], .3), ("toc.wav", KEYS["dias30"], .3),
            ("apagar.wav", KEYS["aparece"] - .9, .4), ("whoosh.mp3", KEYS["pega"], .35), ("boing.wav", KEYS["tedio"], .3),
            ("whoosh.mp3", KEYS["usaria"], .3), ("fogo.wav", KEYS["queimaria"], .4)]


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
    <!-- E se você tivesse o caderno na vida real? — 3D (gerado por tools/build_caderno.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920"></canvas>
      <div class="fontwarm"><span style="font-family:'Space Mono';font-weight:700">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/caderno3d.js"></script>
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
        json.dump({"id": "caderno", "name": "E se você tivesse o caderno na vida real? (3D)", "createdAt": "2026-11-08T14:30:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, SCENES)
