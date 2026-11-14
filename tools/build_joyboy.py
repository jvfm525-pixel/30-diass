"""Gera o vídeo 3D de curiosidade "Quem é o Joy Boy?" em joyboy/.

Motor 3D v2 com animação v4 (tools/motor3d): pés plantados (inclusive no navio que balança), gestos com antecipação
e acomodação, tecido e cabelo com mola (reagem às arrancadas e paradas), gargalhada com o corpo inteiro, elefante
com quatro patas plantadas, expressões presas à fala e câmera contínua; render a 60 qps.
O 3D fica em joyboy/assets/joyboy3d.js. Personagens e símbolos originais (nada desenhado da série; nomes só
no texto e na narração). Este script gera os tempos-chave, os textos por cena, as legendas e a raiz com voz,
trilha e efeitos.
Uso: python3 tools/build_joyboy.py
"""
import base64
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "joyboy")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-joyboy.wav"
MUSIC = "assets/music/trilha-joyboy.wav"
RED, GOLD, BONE, STEEL, SEA = "#ff4a5a", "#ffc94a", "#f6eedc", "#b8a8ff", "#5ad0ff"
HL = "#ffc94a"  # destaque das legendas (dourado, cor do sol)

PARS = [
    "Quando o Roger chegou ao fim do mundo|e descobriu quem era o Joy Boy…|ele começou a rir.|Mas, afinal,|quem é o Joy Boy?|Fica até o final,|porque a última revelação muda tudo.",
    "O Joy Boy viveu há cerca de 800 anos,|no Século Perdido:|um pedaço da história|que o Governo Mundial apagou.|O pouco que sobrou|ficou gravado nos Poneglyphs,|pedras que nada consegue destruir.",
    "E na mensagem do Vegapunk|veio a revelação:|o Joy Boy foi|o primeiro pirata da história.",
    "Na Ilha dos Tritões,|ele deixou um pedido de desculpas|para a princesa sereia daquela época,|por não conseguir|cumprir uma promessa.",
    "Rapidinho:|tem keys aleatórias da Steam|bem baratas no link da minha bio.|Agora, a parte|que liga tudo ao Luffy.",
    "O gigante de ferro de Egghead|era amigo do Joy Boy.|Ele guardou o poder do amigo|por 800 anos…|e usou tudo|pra ajudar o Luffy a escapar.",
    "E quando o Luffy|despertou a fruta Nika,|o elefante gigante Zunesha disse:|“O Joy Boy voltou.”",
    "Então o Luffy é o Joy Boy?|Não.|Quando o Imu enfrentou o Luffy,|disse que ele não é o Joy Boy.|O Luffy herdou o poder e a vontade…|mas a história é dele.",
    "E o Roger riu do tesouro|e disse que tinha chegado cedo demais.|E pra você:|o Luffy vai terminar|o que o Joy Boy começou?|Comenta aqui.",
]
FIX = {"para": ["pra"], "epara": ["e", "pra"], "epra": ["e", "pra"], "eo": ["e", "o"], "eisso": ["e", "isso"], "view": ["bio"], "isaleatorias": ["keys", "aleatorias"], "quis": ["keys"], "stim": ["steam"],
       "joyboy": ["joy", "boy"], "oitocentos": ["800"], "ir": ["keys"]}
_TR = os.path.join(ROOT, "assets/voice/transcript.json")
if not os.path.exists(_TR):  # sem narração ainda: tempos estimados a partir do roteiro
    _TR = os.path.join(ROOT, "assets/voice/transcript-provisorio.json")
WORDS = align(PARS, _TR, FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 3.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-gancho", "s2-seculo", "s3-pirata", "s4-promessa", "s5-keys", "s6-gigante", "s7-fruta", "s8-imu", "s9-pergunta"]
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
    "roger0": W(0, "roger"), "fim0": W(0, "fim"), "descobriu": W(0, "descobriu"), "joy0": W(0, "joy"), "rir": W(0, "rir"), "afinal": W(0, "afinal"),
    "quem0": W(0, "quem", 1), "fica": W(0, "fica"), "ultima": W(0, "ultima"), "muda": W(0, "muda"),
    "viveu": W(1, "viveu"), "anos1": W(1, "anos"), "seculo": W(1, "seculo"), "pedaco": W(1, "pedaco"), "governo": W(1, "governo"), "apagou": W(1, "apagou"),
    "sobrou": W(1, "sobrou"), "gravado": W(1, "gravado"), "poneglyphs": W(1, "poneglyphs"), "destruir": W(1, "destruir"),
    "mensagem": W(2, "mensagem"), "vegapunk": W(2, "vegapunk"), "revelacao": W(2, "revelacao"), "primeiro": W(2, "primeiro"), "pirata": W(2, "pirata"), "historia2": W(2, "historia"),
    "ilha": W(3, "ilha"), "tritoes": W(3, "tritoes"), "deixou": W(3, "deixou"), "desculpas": W(3, "desculpas"), "princesa": W(3, "princesa"), "epoca": W(3, "epoca"),
    "conseguir": W(3, "conseguir"), "promessa": W(3, "promessa"),
    "rapidinho": W(4, "rapidinho"), "steam": W(4, "steam"), "bio": W(4, "bio"), "agora": W(4, "agora"), "liga": W(4, "liga"), "luffy4": W(4, "luffy"),
    "gigante5": W(5, "gigante"), "egghead": W(5, "egghead"), "amigo5": W(5, "amigo"), "guardou": W(5, "guardou"), "poder5": W(5, "poder"), "anos5": W(5, "anos"),
    "usou": W(5, "usou"), "escapar": W(5, "escapar"),
    "quando6": W(6, "quando"), "despertou": W(6, "despertou"), "nika": W(6, "nika"), "elefante": W(6, "elefante"), "zunesha": W(6, "zunesha"), "disse6": W(6, "disse"), "voltou": W(6, "voltou"),
    "entao": W(7, "entao"), "nao7": W(7, "nao"), "imu": W(7, "imu"), "enfrentou": W(7, "enfrentou"), "disse7": W(7, "disse"), "herdou": W(7, "herdou"), "vontade": W(7, "vontade"), "historia7": W(7, "historia"),
    "roger8": W(8, "roger"), "riu": W(8, "riu"), "tesouro": W(8, "tesouro"), "cedo": W(8, "cedo"), "voce": W(8, "voce"), "terminar": W(8, "terminar"), "comecou": W(8, "comecou"), "comenta": W(8, "comenta"),
}


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


FONTE = base64.b64encode(open(os.path.join(ROOT, "assets/fonts/cinzel-900.woff2"), "rb").read()).decode()  # Cinzel embutida (fora da lista automática de fontes)
CSS = f'''@font-face {{ font-family:'Cinzel'; font-weight:900; font-style:normal; src:url(data:font/woff2;base64,{FONTE}) format('woff2'); }}
  #root {{ background: transparent; }}
  .lbl {{ position:absolute; font-family:'Space Mono',monospace; font-weight:700; color:#fff; letter-spacing:.06em; text-transform:uppercase;
    background:linear-gradient(90deg, rgba(14,8,6,.88), rgba(14,8,6,.7)); border-left:8px solid {RED}; padding:10px 22px; font-size:36px; box-shadow:0 8px 30px rgba(0,0,0,.35); }}
  .big {{ position:absolute; left:0; right:0; text-align:center; font-family:'Cinzel','Archivo Black',serif; font-weight:900; color:{BONE}; letter-spacing:.02em; line-height:1.06;
    text-shadow:0 0 26px rgba(255,200,80,.35), 0 6px 26px rgba(0,0,0,.9), 0 2px 0 rgba(0,0,0,.6); -webkit-text-stroke:6px rgba(18,8,4,.9); paint-order:stroke fill; }}
  .big::before {{ content:''; position:absolute; left:4%; right:4%; top:-46px; bottom:-46px; z-index:-1;
    background:radial-gradient(ellipse at 50% 50%, rgba(12,6,4,.62) 0%, rgba(12,6,4,.42) 45%, rgba(12,6,4,0) 72%); }}
  .card {{ position:absolute; left:70px; right:70px; padding:22px 30px 24px; background:linear-gradient(135deg, rgba(30,12,8,.92), rgba(12,8,6,.9));
    border:3px solid rgba(255,200,80,.6); border-radius:6px; box-shadow:0 0 44px rgba(255,200,80,.25); }}
  .card .nm {{ font-family:'Cinzel','Archivo Black',serif; font-weight:900; font-size:92px; color:#fff; line-height:1; letter-spacing:.02em; }}
  .card .sub {{ font-family:'Space Mono',monospace; font-weight:700; font-size:30px; color:#f0dcc8; letter-spacing:.05em; margin-top:10px; text-transform:uppercase; }}'''


def ov(sc, body, js):
    write(sc, scene(sc, body, js, CSS, bg="transparent"))


def at(sc, k, off=0.0):
    return round(max(0.05, KEYS[k] - SC[sc][0] + off), 2)


def lbl2(cid, text, left, top, t, color=RED, size=36, out=None):
    b = f'<div id="{cid}" class="lbl" style="left:{left}px;top:{top}px;z-index:7;border-left-color:{color};font-size:{size}px;opacity:0">{text}</div>'
    j = f'tl.fromTo("#{cid}", {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: .3 }}, {t});'
    if out is not None:
        j += f'tl.to("#{cid}", {{ opacity: 0, duration: .25 }}, {out});'
    return b, j


def big(cid, html, top, t, size=110, color=BONE, out=None):
    b = f'<div class="big" id="{cid}" style="top:{top}px;font-size:{size}px;color:{color};opacity:0;z-index:6">{html}</div>'
    j = f'tl.fromTo("#{cid}", {{ opacity: 0, scale: .88, y: 12 }}, {{ opacity: 1, scale: 1, y: 0, duration: .4, ease: "back.out(1.4)" }}, {t});'
    if out is not None:
        j += f'tl.to("#{cid}", {{ opacity: 0, duration: .3 }}, {out});'
    return b, j


def g(span, color=GOLD):
    return f"<span style='color:{color}'>{span}</span>"


def join(*parts):
    return "".join(p[0] for p in parts), "".join(p[1] for p in parts)


def s1():
    sc = "s1-gancho"
    ov(sc, *join(
        lbl2("s1-l1", "⚠️ CONTÉM SPOILERS", 60, 220, .2, RED, 32, out=at(sc, "fica", -.25)),
        big("s1-a", f"ELE COMEÇOU<br>{g('A RIR')}", 300, at(sc, "rir", -.25), 104, out=at(sc, "quem0", -.35)),
        big("s1-b", f"QUEM É O<br>{g('JOY BOY?')}", 300, at(sc, "quem0", -.15), 118, out=at(sc, "ultima", -.2)),
        lbl2("s1-l2", "🔥 A ÚLTIMA REVELAÇÃO MUDA TUDO", 30, 560, at(sc, "fica"), RED, 30),
    ))


def s2():
    sc = "s2-seculo"
    ov(sc, *join(
        big("s2-a", f"{g('800')} ANOS<br>ATRÁS", 300, at(sc, "viveu", -.2), 112, out=at(sc, "pedaco", -.3)),
        big("s2-b", f"APAGADO DA<br>{g('HISTÓRIA', RED)}", 300, at(sc, "pedaco", -.15), 100, out=at(sc, "sobrou", -.3)),
        lbl2("s2-l1", "🪨 PONEGLYPHS: INDESTRUTÍVEIS", 50, 250, at(sc, "gravado", -.2), GOLD, 36),
    ))


def s3():
    sc = "s3-pirata"
    ov(sc, *join(
        lbl2("s3-l1", "📡 A MENSAGEM DO VEGAPUNK", 60, 240, at(sc, "mensagem", -.25), SEA, 36, out=at(sc, "primeiro", -.35)),
        big("s3-a", f"O PRIMEIRO<br>{g('PIRATA')}", 300, at(sc, "primeiro", -.2), 116),
    ))


def s4():
    sc = "s4-promessa"
    ov(sc, *join(
        lbl2("s4-l1", "🧜 ILHA DOS TRITÕES", 60, 240, at(sc, "ilha", -.2), SEA, 38, out=at(sc, "desculpas", -.4)),
        big("s4-a", f"UM PEDIDO DE<br>{g('DESCULPAS')}", 300, at(sc, "desculpas", -.25), 100, out=at(sc, "conseguir", -.2)),
        lbl2("s4-l2", "💔 A PROMESSA QUE NÃO CUMPRIU", 40, 260, at(sc, "conseguir", -.05), RED, 34),
    ))


def s5():
    sc = "s5-keys"
    body = f'''<div id="s5-card" class="card" style="top:250px;z-index:7;opacity:0"><div class="nm" style="font-size:64px">🎮 KEYS ALEATÓRIAS</div>
      <div class="sub" style="font-size:36px">DA STEAM · BEM BARATAS</div>
      <div class="sub" style="font-size:40px;color:{GOLD};margin-top:14px">👆 LINK NA MINHA BIO</div></div>'''
    js = f'''tl.fromTo("#s5-card", {{ opacity: 0, y: -30, scale: .92 }}, {{ opacity: 1, y: 0, scale: 1, duration: .35, ease: "back.out(1.6)" }}, {at(sc, "rapidinho", -.1)});
      tl.fromTo("#s5-card", {{ scale: 1 }}, {{ scale: 1.05, duration: .18, yoyo: true, repeat: 1, immediateRender: false }}, {at(sc, "bio")});
      tl.to("#s5-card", {{ opacity: 0, duration: .3 }}, {at(sc, "agora", -.4)});'''
    l1 = lbl2("s5-l1", "🌞 AGORA, O QUE LIGA TUDO AO LUFFY", 30, 300, at(sc, "agora", -.2), GOLD, 32)
    ov(sc, body + l1[0], js + l1[1])


def s6():
    sc = "s6-gigante"
    ov(sc, *join(
        lbl2("s6-l1", "🤖 O GIGANTE DE FERRO DE EGGHEAD", 30, 240, at(sc, "gigante5", -.2), SEA, 32, out=at(sc, "guardou", -.35)),
        big("s6-a", f"{g('800')} ANOS<br>GUARDANDO", 300, at(sc, "guardou", -.2), 104, out=at(sc, "usou", -.3)),
        big("s6-b", f"TUDO PRO LUFFY<br>{g('ESCAPAR')}", 300, at(sc, "usou", -.15), 96),
    ))


def s7():
    sc = "s7-fruta"
    ov(sc, *join(
        lbl2("s7-l1", "🌞 A FRUTA NIKA DESPERTOU", 50, 240, at(sc, "despertou", -.25), GOLD, 36, out=at(sc, "disse6", -.3)),
        big("s7-a", f"“O JOY BOY<br>{g('VOLTOU')}”", 300, at(sc, "disse6", -.1), 112),
    ))


def s8():
    sc = "s8-imu"
    ov(sc, *join(
        big("s8-a", f"O LUFFY É<br>O {g('JOY BOY')}?", 300, at(sc, "entao", -.15), 104, out=at(sc, "nao7", -.15)),
        big("s8-b", f"{g('NÃO.', RED)}", 330, at(sc, "nao7", -.05), 170, out=at(sc, "herdou", -.35)),
        lbl2("s8-l1", "👁️ PALAVRAS DO IMU", 60, 600, at(sc, "imu", -.1), RED, 34, out=at(sc, "herdou", -.35)),
        big("s8-c", f"A HISTÓRIA<br>É {g('DELE')}", 300, at(sc, "historia7", -.25), 108),
    ))


def s9():
    sc = "s9-pergunta"
    l1 = lbl2("s9-l1", "😂 O ROGER: “CHEGUEI CEDO DEMAIS”", 30, 240, at(sc, "riu", -.2), GOLD, 32, out=at(sc, "voce", -.3))
    b = big("s9-q", f"O LUFFY VAI<br>{g('TERMINAR')} O QUE<br>O JOY BOY COMEÇOU?", 260, at(sc, "voce", -.1), 84)
    body = '''<div class="big" id="s9-c" style="top:1680px;font-family:'Space Mono';font-weight:700;font-size:56px;opacity:0">COMENTA 👇</div>'''
    js = f'''tl.fromTo("#s9-c", {{ opacity: 0 }}, {{ opacity: 1, duration: .4 }}, {at(sc, "comenta", -.1)});
      tl.fromTo("#s9-c", {{ y: 0 }}, {{ y: 12, duration: .4, yoyo: true, repeat: 5, ease: "sine.inOut", immediateRender: false }}, {at(sc, "comenta", .4)});'''
    ov(sc, l1[0] + b[0] + body, l1[1] + b[1] + js)


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
            js.append(f'tl.fromTo("#cw{gi}-{j}", {{ color: "#ffffff" }}, {{ color: "{HL}", duration: .05, immediateRender: false }}, {w[4]:.2f});')
    css = '''#root { background: transparent; }
      .cg { position:absolute; left:90px; right:150px; top:1240px; text-align:center; }
      .cbox { display:inline-block; padding:8px 18px; background:rgba(10,6,4,.74); font-family:Montserrat; font-weight:800; font-size:50px; line-height:1.15; color:#fff;
        text-transform:uppercase; text-shadow:0 3px 10px rgba(0,0,0,.9); max-width:840px; }'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


def sfx_list():
    k, P = KEYS, PSTART
    return [
        ("mar.wav", 0.0, .3), ("vento.wav", 0.2, .2), ("pedras.wav", k["descobriu"] - .6, .45), ("brilho.wav", k["descobriu"] - .1, .4), ("impact-bass-2.mp3", k["rir"], .35),
        ("tambor.wav", k["quem0"] - .1, .4), ("coracao.wav", k["fica"], .3),
        ("whoosh.mp3", P[1] - .15, .3), ("fogo.wav", P[1], .3), ("vento.wav", k["seculo"], .25), ("pedras.wav", k["apagou"], .35), ("brilho.wav", k["gravado"], .4), ("impact-bass-1.mp3", k["destruir"], .35),
        ("whoosh.mp3", P[2] - .15, .3), ("mar.wav", P[2], .3), ("gaivotas.wav", P[2] + .2, .3), ("transmissao.wav", k["mensagem"] - .2, .4), ("impact-bass-2.mp3", k["primeiro"], .45), ("sparkle.mp3", k["pirata"], .3),
        ("whoosh.mp3", P[3] - .15, .3), ("glub.wav", P[3], .35), ("bolhas.wav", P[3] + .3, .3), ("brilho.wav", k["desculpas"], .35), ("coracao.wav", k["promessa"], .3),
        ("notification.mp3", k["rapidinho"], .35), ("moedas.wav", k["steam"], .3), ("pop.mp3", k["bio"], .3), ("whoosh.mp3", k["agora"] - .3, .25),
        ("whoosh.mp3", P[5] - .15, .3), ("engrenagem.wav", k["gigante5"], .4), ("vapor.wav", k["guardou"], .35), ("impact-bass-1.mp3", k["usou"], .45), ("onda.wav", k["usou"] + .1, .45),
        ("whoosh.mp3", P[6] - .15, .3), ("mar.wav", P[6], .3), ("tambor.wav", k["despertou"] - .2, .5), ("trompa.wav", k["zunesha"] - .1, .5), ("brilho.wav", k["voltou"], .4),
        ("whoosh.mp3", P[7] - .15, .3), ("trovao.wav", k["entao"], .35), ("impact-bass-2.mp3", k["nao7"], .45), ("tremor.wav", k["imu"], .35), ("brilho.wav", k["herdou"], .35), ("tambor.wav", k["historia7"] - .2, .35),
        ("whoosh.mp3", P[8] - .15, .3), ("mar.wav", P[8], .3), ("gaivotas.wav", P[8] + .3, .3), ("whoosh-short.mp3", k["voce"] - .2, .3), ("pop.mp3", k["comenta"], .3),
    ]


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = [f'''      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s}" data-duration="{e - s:.2f}"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:5"></div>''' for c, s, e in SCENES]
    hosts.append(f'''      <div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>''')
    audio = []
    if os.path.exists(os.path.join(ROOT, VOICE)):
        vd = round(dur(os.path.join(ROOT, VOICE)), 2)
        audio.append(f'      <audio id="voz" class="clip" src="{VOICE}" data-start="0" data-duration="{vd}" data-volume="1" data-track-index="4"></audio>')
    if os.path.exists(os.path.join(ROOT, MUSIC)):
        audio.append(f'      <audio id="trilha" class="clip" src="{MUSIC}" data-start="0" data-duration="{TOTAL}" data-volume="0.27" data-fade-out="2" data-track-index="5"></audio>')
    lanes = []
    for i, (f, st, vol) in enumerate(sfx_list()):
        path = os.path.join(ROOT, "assets/sfx", f)
        if not os.path.exists(path):
            continue
        st = round(max(0, st), 2)
        d = round(min(dur(path), TOTAL - st, 6.0 if f in ("vento.wav", "grilos.wav", "tremor.wav") else 3.0), 2)
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
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #0a0806; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
      #c3d {{ position: absolute; inset: 0; width: 1080px; height: 1920px; z-index: 0; }}
      .fontwarm {{ position: absolute; left: -9999px; top: 0; }}
    </style>
  </head>
  <body>
    <!-- Quem é o Joy Boy? — 3D motor v2, animação v4 (gerado por tools/build_joyboy.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920" data-layout-allow-overflow></canvas>
      <div class="fontwarm" data-layout-allow-overflow><span style="font-family:'Archivo Black'">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/joyboy3d.js"></script>
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
    with open(os.path.join(ROOT, "assets/timing.js"), "w") as f:
        f.write("window.HF_T = " + json.dumps({"scenes": SCENES, "sc": SC, "k": KEYS, "total": TOTAL}) + ";\n")
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "joyboy", "name": "Quem é o Joy Boy? (3D v2)", "createdAt": "2026-11-13T12:00:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL)
    for n, s, e in SCENES:
        print(f"  {n:15s} {s:6.2f} → {e:6.2f}  ({e - s:.1f}s)")
