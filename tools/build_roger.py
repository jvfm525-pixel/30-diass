"""Gera o vídeo 3D de curiosidade "Por que o Roger se entregou à Marinha?" em roger/.

O 3D (Three.js) fica em roger/assets/roger3d.js e é desenhado a partir do tempo.
Este script gera os tempos-chave, os textos por cena (estilo documentário), as
legendas sóbrias e a raiz com voz, trilha sintetizada e efeitos.
Uso: python3 tools/build_roger.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "roger")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-roger.wav"
CRIM, GOLD, ICE = "#ffd27a", "#ffd27a", "#9fd8ff"

PARS = [
    "Ele era o homem mais poderoso dos mares.|Nenhum almirante|conseguiu pegar ele.|E mesmo assim,|ele andou sozinho até a Marinha…|e se entregou.|Fica até o final,|porque o motivo é lindo.",
    "O Roger foi o único pirata|a atravessar o mundo inteiro|e chegar na última ilha.|Lá, ele encontrou|o maior tesouro de todos.|Virou o Rei dos Piratas.",
    "Então a Marinha|finalmente pegou ele?|Não.|Ninguém pegou o Roger.",
    "A primeira verdade:|o Roger estava doente.|Uma doença sem cura.|O médico do bando|só conseguiu dar a ele|um pouco mais de tempo.",
    "Então ele desistiu?|Também não.",
    "Quando chegou na última ilha,|ele descobriu uma história|tão absurda|que só conseguiu rir.|E percebeu uma coisa:|eles tinham chegado cedo demais.|Quem deveria mudar o mundo…|ainda não tinha nascido.",
    "Então ele desfez o bando.|Cada um seguiu o seu caminho.|E o capitão foi sozinho|até a Marinha.",
    "Ele foi executado|na cidade onde nasceu.|Na frente de uma multidão.|E ele escolheu isso,|porque precisava de uma plateia.",
    "Porque a execução|era o último plano dele.|Diante de todo mundo,|ele disse que o tesouro existia…|e que era de quem fosse buscar.|Com uma única frase,|ele transformou a própria morte|no começo de uma nova era:|milhares de jovens|se lançaram ao mar.|Entre eles…|a pessoa que ele estava esperando.",
    "Ele não se entregou pra morrer.|Ele se entregou|pra dar o mundo|pra próxima geração.",
    "E pra você:|o Roger foi um gênio|que planejou tudo…|ou um homem que se sacrificou|pelos sonhos dos outros?|Comenta A ou B.",
]
FIX = {"emesmo": ["e", "mesmo"], "epercebeu": ["e", "percebeu"], "eo": ["e", "o"], "eele": ["e", "ele"], "epara": ["e", "pra"], "para": ["pra"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-praca", "s2-rota", "s3-capturado", "s4-ampulheta", "s5-desistiu", "s6-ilha", "s7-bando", "s8-praca", "s9-resposta", "s10-era", "s11-pergunta"]
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
    "marinha": W(0, "marinha"), "entregou0": W(0, "entregou"), "lindo": W(0, "lindo"),
    "ilha2": W(1, "ilha"), "tesouro": W(1, "tesouro"), "rei": W(1, "rei"),
    "pegou": W(2, "pegou"), "ninguem": W(2, "ninguem"),
    "doente": W(3, "doente"), "cura": W(3, "cura"), "tempo": W(3, "tempo"),
    "desistiu": W(4, "desistiu"), "tambem": W(4, "tambem"),
    "rir": W(5, "rir"), "cedo": W(5, "cedo"), "nascido": W(5, "nascido"),
    "desfez": W(6, "desfez"), "sozinho6": W(6, "sozinho"),
    "executado": W(7, "executado"), "plateia": W(7, "plateia"),
    "plano": W(8, "plano"), "disse": W(8, "disse"), "frase": W(8, "frase"), "milhares": W(8, "milhares"), "esperando": W(8, "esperando"),
    "geracao": W(9, "geracao"),
    "genio": W(10, "genio"), "sacrificou": W(10, "sacrificou"), "comenta": W(10, "comenta"),
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








def xq(cid, text, t, out=None):
    b = f'<div class="big" id="{cid}" style="top:760px;font-size:120px;color:#fff;opacity:0">{text}<div id="{cid}-x" style="position:absolute;left:12%;right:12%;top:52%;height:14px;background:#ff2a3a;transform-origin:0% 50%;transform:scaleX(0)"></div></div>'
    j = f'tl.fromTo("#{cid}", {{ opacity: 0, scale: .9 }}, {{ opacity: 1, scale: 1, duration: .3 }}, {t});'
    j += f'tl.fromTo("#{cid}-x", {{ scaleX: 0 }}, {{ scaleX: 1, duration: .25 }}, {out});'
    return b, j




def xq(cid, text, t, out=None):
    b = f'<div class="big" id="{cid}" style="top:760px;font-size:120px;color:#fff;opacity:0">{text}<div id="{cid}-x" style="position:absolute;left:12%;right:12%;top:52%;height:14px;background:#ff2a3a;transform-origin:0% 50%;transform:scaleX(0)"></div></div>'
    j = f'tl.fromTo("#{cid}", {{ opacity: 0, scale: .9 }}, {{ opacity: 1, scale: 1, duration: .3 }}, {t});'
    j += f'tl.fromTo("#{cid}-x", {{ scaleX: 0 }}, {{ scaleX: 1, duration: .25 }}, {out});'
    return b, j


def s1():
    sc = "s1-praca"
    l1 = lbl2("s1-l1", "⚠️ SPOILERS", 70, 230, .2, GOLD, 34)
    b = big("s1-t", "O HOMEM MAIS FORTE<br>DOS MARES…<br><span style='color:#ffd27a'>SE ENTREGOU?</span>", 320, at(sc, "entregou0", -.3), 66, "#ffffff")
    ov(sc, l1[0] + b[0], l1[1] + b[1])


def s2():
    sc = "s2-rota"
    l1 = lbl2("s2-l1", "O ÚNICO QUE CHEGOU AO FIM", 60, 300, at(sc, "ilha2"), GOLD, 36)
    b = big("s2-t", "👑 REI DOS PIRATAS", 1000, at(sc, "rei"), 64, GOLD)
    ov(sc, l1[0] + b[0], l1[1] + b[1])


def s3():
    sc = "s3-capturado"
    b = xq("s3-q", "CAPTURADO?", at(sc, "pegou", -.6), at(sc, "ninguem", -.6))
    ov(sc, b[0], b[1])


def s4():
    sc = "s4-ampulheta"
    l1 = lbl2("s4-l1", "UMA DOENÇA SEM CURA ⏳", 70, 300, at(sc, "doente"), GOLD)
    ov(sc, l1[0], l1[1])


def s5():
    sc = "s5-desistiu"
    b = xq("s5-q", "DESISTIU?", at(sc, "desistiu", -.6), at(sc, "tambem"))
    ov(sc, b[0], b[1])


def s6():
    sc = "s6-ilha"
    b = big("s6-t", "“CHEGAMOS<br>CEDO DEMAIS”", 300, at(sc, "cedo", -.3), 84, GOLD)
    ov(sc, b[0], b[1])


def s7():
    sc = "s7-bando"
    l1 = lbl2("s7-l1", "O BANDO SE SEPARA", 70, 300, at(sc, "desfez"), GOLD)
    ov(sc, l1[0], l1[1])


def s8():
    sc = "s8-praca"
    l1 = lbl2("s8-l1", "ELE ESCOLHEU O LUGAR", 70, 300, at(sc, "plateia", -.8), GOLD)
    ov(sc, l1[0], l1[1])


def s9():
    sc = "s9-resposta"
    l0 = big("s9-r", "A RESPOSTA", 260, at(sc, "plano", -.6), 96, GOLD)
    l1 = lbl2("s9-l1", "1. A EXECUÇÃO ERA UM PLANO", 60, 400, at(sc, "plano"), GOLD, 34)
    l2 = lbl2("s9-l2", "2. UMA FRASE MUDOU O MUNDO", 60, 470, at(sc, "frase"), GOLD, 34)
    l3 = lbl2("s9-l3", "3. ELE ESPERAVA ALGUÉM", 60, 540, at(sc, "esperando", -.4), GOLD, 34)
    ov(sc, l0[0] + l1[0] + l2[0] + l3[0], l0[1] + l1[1] + l2[1] + l3[1])


def s10():
    sc = "s10-era"
    b = big("s10-t", "A GRANDE ERA<br>DOS PIRATAS ⛵", 300, at(sc, "geracao", -2.4), 80, "#ffffff")
    ov(sc, b[0], b[1])


def s11():
    sc = "s11-pergunta"

    def card(k, letter, col, title, x):
        return f'''<div id="s11-{k}" style="position:absolute;left:{x}px;top:1380px;width:400px;z-index:4;opacity:0">
          <div style="background:rgba(8,5,6,.85);border:4px solid {col};box-shadow:0 0 30px {col}66;padding:26px 18px;text-align:center">
            <div style="font-family:'Space Mono';font-weight:700;font-size:60px;color:{col}">{letter}</div>
            <div style="font-family:'Archivo Black';font-size:40px;line-height:1.1;color:#fff;margin-top:6px">{title}</div></div></div>'''
    body = f'''<div class="big" style="top:230px;font-size:66px">O ROGER FOI…</div>
    {card("a", "A", "#ffd27a", "UM GÊNIO 🧠", 90)}
    {card("b", "B", "#ff8a8a", "UM SACRIFÍCIO 💔", 590)}
    <div class="big" id="s11-c" style="top:1700px;font-family:'Space Mono';font-weight:700;font-size:54px;opacity:0">COMENTA A OU B ↓</div>'''
    js = f'''tl.fromTo("#s11-a", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .4 }}, {at(sc, "genio")});
      tl.fromTo("#s11-b", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .4 }}, {at(sc, "sacrificou")});
      tl.fromTo("#s11-c", {{ opacity: 0 }}, {{ opacity: 1, duration: .4 }}, {at(sc, "comenta")});'''
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
    return [("whoosh.mp3", 0.2, .25), ("impact-bass-2.mp3", KEYS["entregou0"], .35), ("sparkle.mp3", KEYS["lindo"], .3),
            ("whoosh.mp3", PSTART[1] - .1, .3), ("sparkle.mp3", KEYS["tesouro"], .35), ("impact-bass-1.mp3", KEYS["rei"], .4),
            ("error.mp3", KEYS["ninguem"] - .6, .35), ("toc.wav", KEYS["doente"], .3), ("toc.wav", KEYS["cura"], .3),
            ("error.mp3", KEYS["tambem"], .35), ("sparkle.mp3", KEYS["rir"], .35), ("impact-bass-2.mp3", KEYS["cedo"], .35),
            ("whoosh.mp3", KEYS["desfez"], .3), ("impact-bass-1.mp3", KEYS["executado"], .35),
            ("impact-bass-1.mp3", KEYS["disse"], .45), ("sparkle.mp3", KEYS["frase"], .4), ("whoosh.mp3", KEYS["milhares"], .4), ("sparkle.mp3", KEYS["esperando"], .35),
            ("impact-bass-2.mp3", KEYS["geracao"], .4), ("whoosh.mp3", KEYS["genio"], .3), ("whoosh.mp3", KEYS["sacrificou"], .3)]


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
        f'      <audio id="trilha" class="clip" src="assets/music/trilha-rotacao.wav" data-start="0" data-duration="{TOTAL}" data-volume="0.3" data-fade-out="2" data-track-index="5"></audio>',
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
    <!-- Por que o Roger se entregou? — 3D (gerado por tools/build_roger.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920"></canvas>
      <div class="fontwarm"><span style="font-family:'Space Mono';font-weight:700">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/roger3d.js"></script>
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
    with open(os.path.join(ROOT, "assets/timing.js"), "w") as f:
        f.write("window.HF_T = " + json.dumps({"scenes": SCENES, "sc": SC, "k": KEYS, "total": TOTAL}) + ";\n")
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "roger", "name": "Por que o Roger se entregou? (3D)", "createdAt": "2026-11-08T20:15:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, SCENES)
