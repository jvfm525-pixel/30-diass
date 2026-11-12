"""Gera o vídeo 3D de curiosidade "Por que o Giorno Giovanna é praticamente impossível de derrotar com o Gold Experience Requiem?" em giorno/.

Motor 3D v2 com animação v3 (tools/motor3d): pés plantados ao andar e correr (IK), gestos com antecipação
e acomodação, cabelo e roupa reagindo ao movimento, rebobinar o tempo e câmera contínua; render a 60 qps.
O 3D fica em giorno/assets/giorno3d.js. Personagens e símbolos originais (nada desenhado da série; nomes só
no texto e na narração). Este script gera os tempos-chave, os textos por cena, as legendas e a raiz com voz,
trilha e efeitos.
Uso: python3 tools/build_giorno.py
"""
import base64
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "giorno")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-giorno.wav"
MUSIC = "assets/music/trilha-giorno.wav"
RED, GOLD, BONE, STEEL, GREEN = "#ff4a5a", "#ffc94a", "#f6eedc", "#b8a8ff", "#7dffb0"
HL = "#ffc94a"  # destaque das legendas (dourado)

PARS = [
    "O Giorno Giovanna tem um poder tão absurdo|que nenhum ataque chega nele.|Nem apagar o tempo funcionou.|Por que o Gold Experience Requiem|é praticamente impossível de derrotar?|Fica até o final,|porque o destino do último inimigo dele|é o mais assustador de JoJo.",
    "Tudo começa com a Flecha.|Quando ela atravessou o Stand do Giorno,|o Gold Experience evoluiu|e virou Requiem.",
    "O poder dele é voltar tudo a zero.|Qualquer ataque,|qualquer ação…|e até a vontade de quem tenta atacar|volta ao ponto zero.|O golpe simplesmente nunca acontece.",
    "O chefe da Passione|podia apagar o tempo com o King Crimson.|Mesmo assim,|o Requiem cancelou isso|como se nada tivesse acontecido.",
    "Rapidinho:|tem keys aleatórias da Steam|bem baratas no link da minha bio.|Agora, a parte mais bizarra.",
    "O Requiem age sozinho.|Ele mesmo diz|que nem o Giorno sabe|tudo o que ele faz.|Ou seja:|nem o dono controla esse poder|por completo.",
    "E o destino do Diavolo|foi o pior possível:|ele morre…|e volta.|Morre de novo,|de outro jeito,|e volta de novo.|Pra sempre.|Como o Requiem disse:|ele nunca vai chegar à verdade.",
    "Então, pra vencer o Giorno,|você teria que atacar|sem que o ataque fosse cancelado.|E isso, na história,|ninguém conseguiu.",
    "E pra você:|quem teria alguma chance|contra o Gold Experience Requiem?|Comenta aqui.",
]
FIX = {"para": ["pra"], "epara": ["e", "pra"], "epra": ["e", "pra"], "eo": ["e", "o"], "eisso": ["e", "isso"], "view": ["bio"], "isaleatorias": ["keys", "aleatorias"], "quis": ["keys"], "stim": ["steam"],
       "jorno": ["giorno"], "giovana": ["giovanna"], "requiem": ["requiem"], "rekiem": ["requiem"], "diavolo": ["diavolo"], "jojo": ["jojo"]}
_TR = os.path.join(ROOT, "assets/voice/transcript.json")
if not os.path.exists(_TR):  # sem narração ainda: tempos estimados a partir do roteiro
    _TR = os.path.join(ROOT, "assets/voice/transcript-provisorio.json")
WORDS = align(PARS, _TR, FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-gancho", "s2-flecha", "s3-zero", "s4-tempo", "s5-keys", "s6-sozinho", "s7-destino", "s8-ninguem", "s9-pergunta"]
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
    "giorno0": W(0, "giorno"), "poder0": W(0, "poder"), "absurdo": W(0, "absurdo"), "nenhum": W(0, "nenhum"), "chega": W(0, "chega"),
    "apagar0": W(0, "apagar"), "funcionou": W(0, "funcionou"), "porque0": W(0, "por"), "requiem0": W(0, "requiem"), "impossivel": W(0, "impossivel"),
    "fica": W(0, "fica"), "destino0": W(0, "destino"), "assustador": W(0, "assustador"),
    "tudo": W(1, "tudo"), "flecha": W(1, "flecha"), "atravessou": W(1, "atravessou"), "stand": W(1, "stand"), "evoluiu": W(1, "evoluiu"), "virou": W(1, "virou"),
    "zero2": W(2, "zero"), "qualquer2": W(2, "qualquer"), "acao": W(2, "acao"), "vontade": W(2, "vontade"), "atacar2": W(2, "atacar"), "volta2": W(2, "volta", 1),
    "ponto": W(2, "ponto"), "golpe": W(2, "golpe"), "nunca2": W(2, "nunca"), "acontece": W(2, "acontece"),
    "chefe": W(3, "chefe"), "apagar3": W(3, "apagar"), "king": W(3, "king"), "mesmo3": W(3, "mesmo"), "cancelou": W(3, "cancelou"), "nada": W(3, "nada"), "acontecido": W(3, "acontecido"),
    "rapidinho": W(4, "rapidinho"), "steam": W(4, "steam"), "bio": W(4, "bio"), "agora": W(4, "agora"), "bizarra": W(4, "bizarra"),
    "sozinho": W(5, "sozinho"), "diz": W(5, "diz"), "sabe": W(5, "sabe"), "faz": W(5, "faz"), "seja5": W(5, "seja"), "dono": W(5, "dono"), "completo": W(5, "completo"),
    "destino6": W(6, "destino"), "pior": W(6, "pior"), "morre6": W(6, "morre"), "volta6": W(6, "volta"), "morre6b": W(6, "morre", 1), "outro": W(6, "outro"),
    "volta6b": W(6, "volta", 1), "sempre": W(6, "sempre"), "disse": W(6, "disse"), "verdade": W(6, "verdade"),
    "vencer": W(7, "vencer"), "atacar7": W(7, "atacar"), "cancelado": W(7, "cancelado"), "historia": W(7, "historia"), "ninguem": W(7, "ninguem"),
    "voce": W(8, "voce"), "chance": W(8, "chance"), "requiem8": W(8, "requiem"), "comenta": W(8, "comenta"),
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
        big("s1-a", f"NENHUM ATAQUE<br>{g('CHEGA NELE')}", 300, at(sc, "nenhum", -.2), 96, out=at(sc, "apagar0", -.25)),
        big("s1-b", f"NEM APAGAR<br>{g('O TEMPO', RED)}", 300, at(sc, "apagar0", -.1), 104, out=at(sc, "porque0", -.25)),
        big("s1-c", f"POR {g('QUÊ?')}", 320, at(sc, "porque0", -.1), 140, out=at(sc, "fica", -.25)),
        lbl2("s1-l2", "💀 O DESTINO MAIS ASSUSTADOR DE JOJO", 30, 560, at(sc, "fica"), RED, 30),
    ))


def s2():
    sc = "s2-flecha"
    ov(sc, *join(
        lbl2("s2-l1", "🏹 TUDO COMEÇA COM A FLECHA", 50, 230, at(sc, "tudo", -.2), GOLD, 34, out=at(sc, "evoluiu", -.35)),
        big("s2-a", f"EVOLUIU PRA<br>{g('REQUIEM')}", 300, at(sc, "evoluiu", -.15), 108),
    ))


def s3():
    sc = "s3-zero"
    ov(sc, *join(
        big("s3-a", f"TUDO VOLTA<br>A {g('ZERO')}", 300, at(sc, "zero2", -.4), 108, out=at(sc, "qualquer2", -.3)),
        lbl2("s3-i1", "✖ QUALQUER ATAQUE", 70, 300, at(sc, "qualquer2", -.1), GOLD, 40, out=at(sc, "golpe", -.4)),
        lbl2("s3-i2", "✖ QUALQUER AÇÃO", 70, 390, at(sc, "acao", -.1), GOLD, 40, out=at(sc, "golpe", -.4)),
        lbl2("s3-i3", "✖ ATÉ A VONTADE", 70, 480, at(sc, "vontade", -.1), RED, 40, out=at(sc, "golpe", -.4)),
        big("s3-b", f"O GOLPE {g('NUNCA', RED)}<br>ACONTECE", 300, at(sc, "golpe", -.3), 96),
    ))


def s4():
    sc = "s4-tempo"
    body = f'''<div id="s4-card" class="card" style="top:240px;z-index:7;opacity:0"><div class="nm" style="font-size:74px">KING CRIMSON</div><div class="sub">⏱️ APAGA O TEMPO</div></div>'''
    js = f'''tl.fromTo("#s4-card", {{ opacity: 0, x: -40 }}, {{ opacity: 1, x: 0, duration: .35 }}, {at(sc, "apagar3", -.3)});
      tl.to("#s4-card", {{ opacity: 0, duration: .3 }}, {at(sc, "mesmo3", -.3)});'''
    l1 = lbl2("s4-l1", "👔 O CHEFE DA PASSIONE", 60, 240, at(sc, "chefe", -.2), RED, 36, out=at(sc, "apagar3", -.35))
    b = big("s4-b", f"{g('CANCELADO')} ✨", 320, at(sc, "cancelou", -.2), 110)
    ov(sc, body + l1[0] + b[0], js + l1[1] + b[1])


def s5():
    sc = "s5-keys"
    body = f'''<div id="s5-card" class="card" style="top:250px;z-index:7;opacity:0"><div class="nm" style="font-size:64px">🎮 KEYS ALEATÓRIAS</div>
      <div class="sub" style="font-size:36px">DA STEAM · BEM BARATAS</div>
      <div class="sub" style="font-size:40px;color:{GOLD};margin-top:14px">👆 LINK NA MINHA BIO</div></div>'''
    js = f'''tl.fromTo("#s5-card", {{ opacity: 0, y: -30, scale: .92 }}, {{ opacity: 1, y: 0, scale: 1, duration: .35, ease: "back.out(1.6)" }}, {at(sc, "rapidinho", -.1)});
      tl.fromTo("#s5-card", {{ scale: 1 }}, {{ scale: 1.05, duration: .18, yoyo: true, repeat: 1, immediateRender: false }}, {at(sc, "bio")});
      tl.to("#s5-card", {{ opacity: 0, duration: .3 }}, {at(sc, "agora", -.4)});'''
    l1 = lbl2("s5-l1", "🌀 AGORA, A PARTE MAIS BIZARRA", 40, 300, at(sc, "agora", -.2), STEEL, 34)
    ov(sc, body + l1[0], js + l1[1])


def s6():
    sc = "s6-sozinho"
    ov(sc, *join(
        big("s6-a", f"O REQUIEM<br>{g('AGE SOZINHO')}", 300, at(sc, "sozinho", -.45), 100, out=at(sc, "sabe", -.3)),
        lbl2("s6-l1", "🤯 NEM O GIORNO SABE TUDO", 60, 250, at(sc, "sabe", -.15), STEEL, 36, out=at(sc, "dono", -.35)),
        big("s6-b", f"NEM O DONO<br>{g('CONTROLA', RED)}", 300, at(sc, "dono", -.2), 104),
    ))


def s7():
    sc = "s7-destino"
    ov(sc, *join(
        lbl2("s7-l1", "💀 O DESTINO DO DIAVOLO", 60, 230, at(sc, "destino6", -.2), RED, 36, out=at(sc, "morre6", -.3)),
        big("s7-a", f"MORRE…<br>{g('E VOLTA', RED)}", 300, at(sc, "morre6", -.2), 110, out=at(sc, "sempre", -.3)),
        big("s7-b", f"PRA SEMPRE {g('∞', RED)}", 320, at(sc, "sempre", -.15), 104, out=at(sc, "disse", -.25)),
        lbl2("s7-l2", "“NUNCA VAI CHEGAR À VERDADE”", 30, 260, at(sc, "disse", -.1), GOLD, 34),
    ))


def s8():
    sc = "s8-ninguem"
    ov(sc, *join(
        big("s8-a", f"ATACAR SEM<br>{g('SER CANCELADO', RED)}?", 300, at(sc, "atacar7", -.3), 92, out=at(sc, "historia", -.3)),
        big("s8-b", f"{g('NINGUÉM')}<br>CONSEGUIU", 310, at(sc, "ninguem", -.3), 112),
    ))


def s9():
    sc = "s9-pergunta"
    b = big("s9-q", f"QUEM TERIA {g('CHANCE')}<br>CONTRA O GOLD<br>EXPERIENCE REQUIEM?", 260, at(sc, "voce", -.1), 80)
    body = '''<div class="big" id="s9-c" style="top:1680px;font-family:'Space Mono';font-weight:700;font-size:56px;opacity:0">COMENTA 👇</div>'''
    js = f'''tl.fromTo("#s9-c", {{ opacity: 0 }}, {{ opacity: 1, duration: .4 }}, {at(sc, "comenta", -.1)});
      tl.fromTo("#s9-c", {{ y: 0 }}, {{ y: 12, duration: .4, yoyo: true, repeat: 5, ease: "sine.inOut", immediateRender: false }}, {at(sc, "comenta", .4)});'''
    ov(sc, b[0] + body, b[1] + js)


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
      .cbox { display:inline-block; padding:8px 18px; background:rgba(10,6,4,.62); font-family:Montserrat; font-weight:800; font-size:50px; line-height:1.15; color:#fff;
        text-transform:uppercase; text-shadow:0 3px 10px rgba(0,0,0,.9); max-width:840px; }'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


def sfx_list():
    k, P = KEYS, PSTART
    return [
        ("vento.wav", 0.0, .3), ("passos.wav", 0.3, .35), ("golpe.wav", k["nenhum"] - .25, .45), ("rebobinar.wav", k["chega"], .45), ("sparkle.mp3", k["chega"] + .3, .3),
        ("tempo.wav", k["apagar0"], .45), ("rebobinar.wav", k["funcionou"], .35), ("impact-bass-2.mp3", k["porque0"], .4), ("coracao.wav", k["fica"], .3),
        ("whoosh.mp3", P[1] - .15, .3), ("flecha.wav", k["atravessou"] - .3, .5), ("impact-bass-1.mp3", k["atravessou"] + .15, .45), ("brilho.wav", k["evoluiu"], .45), ("sparkle.mp3", k["virou"], .35),
        ("whoosh.mp3", P[2] - .15, .3), ("relogio.wav", k["zero2"], .35), ("golpe.wav", k["qualquer2"], .4), ("rebobinar.wav", k["qualquer2"] + .4, .4), ("golpe.wav", k["acao"], .4),
        ("rebobinar.wav", k["acao"] + .4, .4), ("coracao.wav", k["vontade"], .3), ("rebobinar.wav", k["volta2"], .45), ("golpe.wav", k["golpe"] - .2, .45), ("sparkle.mp3", k["acontece"], .3),
        ("whoosh.mp3", P[3] - .15, .3), ("tempo.wav", k["apagar3"], .5), ("glitch-1.mp3", k["king"], .3), ("portal.wav", k["cancelou"] - .3, .4), ("rebobinar.wav", k["cancelou"], .4), ("sparkle.mp3", k["acontecido"], .3),
        ("notification.mp3", k["rapidinho"], .35), ("moedas.wav", k["steam"], .3), ("pop.mp3", k["bio"], .3), ("whoosh.mp3", k["agora"] - .3, .25),
        ("whoosh.mp3", P[5] - .15, .3), ("passos.wav", k["sozinho"], .35), ("brilho.wav", k["sabe"], .3), ("impact-bass-1.mp3", k["dono"], .35),
        ("whoosh.mp3", P[6] - .15, .3), ("vento.wav", P[6], .3), ("agua.wav", k["morre6"], .5), ("rebobinar.wav", k["volta6"], .4), ("coracao.wav", k["morre6b"], .35),
        ("buzina.wav", k["outro"], .4), ("rebobinar.wav", k["volta6b"], .4), ("relogio.wav", k["sempre"], .35), ("impact-bass-2.mp3", k["verdade"], .4),
        ("whoosh.mp3", P[7] - .15, .3), ("vento.wav", P[7], .3), ("golpe.wav", k["atacar7"], .35), ("rebobinar.wav", k["cancelado"], .35), ("impact-bass-1.mp3", k["ninguem"], .4),
        ("whoosh-short.mp3", k["voce"] - .2, .3), ("grilos.wav", k["voce"], .3), ("pop.mp3", k["comenta"], .3),
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
    <!-- Por que o Giorno é praticamente impossível de derrotar? — 3D motor v2, animação v3 (gerado por tools/build_giorno.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920" data-layout-allow-overflow></canvas>
      <div class="fontwarm" data-layout-allow-overflow><span style="font-family:'Archivo Black'">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/giorno3d.js"></script>
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
        json.dump({"id": "giorno", "name": "Por que o Giorno é praticamente impossível de derrotar com o Gold Experience Requiem? (3D v2)", "createdAt": "2026-11-12T22:00:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL)
    for n, s, e in SCENES:
        print(f"  {n:15s} {s:6.2f} → {e:6.2f}  ({e - s:.1f}s)")
