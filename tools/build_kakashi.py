"""Gera o vídeo 3D de curiosidade "Por que os olhos do Kakashi nunca ficaram cegos mesmo usando tanto o Mangekyou Sharingan?" em kakashi/.

Motor 3D v2 (tools/motor3d) com uma refinada: rosto com pele pintada, tapa-olho, gola alta, faixas,
tecido que balança, transições entre cenas e câmera na mão. O 3D fica em kakashi/assets/kakashi3d.js.
Personagens e símbolos originais (sem máscara, sem bandana e sem o desenho do Sharingan; nomes só no
texto e na narração). Este script gera os tempos-chave, os textos por cena, as legendas e a raiz com
voz, trilha e efeitos.
Uso: python3 tools/build_kakashi.py
"""
import base64
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kakashi")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-kakashi.wav"
MUSIC = "assets/music/trilha-kakashi.wav"
RED, GOLD, BONE, STEEL, GREEN = "#ff3b3b", "#ffc35a", "#f3eadb", "#9fc3e8", "#7dffb0"
HL = "#ff5a4a"  # destaque das legendas (vermelho do olho)

PARS = [
    "O Kakashi usou o Mangekyou Sharingan|várias vezes…|e nunca ficou cego.|Mas o Itachi e o Sasuke|quase perderam a visão.|Por quê?|Fica até o final,|porque a resposta|tem um detalhe triste.",
    "Primeiro, a regra:|o Mangekyou é o Sharingan mais forte,|mas cobra um preço.|Quanto mais você usa,|mais a visão escurece.|O Itachi foi ficando cego…|e o Sasuke só escapou|porque recebeu os olhos do irmão.",
    "E o olho do Kakashi|nem era dele.|Foi um presente do Obito,|o amigo que se sacrificou|pra salvar ele.|Como o Kakashi não é um Uchiha,|o olho não desliga|e fica sugando chakra|o tempo todo.|Por isso ele vivia|com o olho tapado.",
    "Rapidinho:|tem keys aleatórias da Steam|bem baratas no link da minha bio.|Agora, a resposta.",
    "A explicação mais aceita|tem três partes.|Primeiro:|ele quase não usava.|O Kamui gastava tanto chakra|que, depois de uma luta,|ele desmaiou|e teve que ser carregado de volta.",
    "Segundo:|cada uso durava segundos.|O Sasuke lutava inteiro|com o Mangekyou ativado.|O Kakashi abriu o portal…|e fechava o olho.",
    "E terceiro:|o tempo acabou antes.|No fim da guerra,|ele perdeu o Sharingan…|e hoje tem os dois olhos normais.",
    "Ou seja:|ele nunca teve chakra|nem tempo pra ficar cego.|O olho do amigo durou|exatamente até onde precisava.",
    "E pra você:|qual foi o momento mais triste|do Kakashi?|Comenta aqui.",
]
FIX = {"para": ["pra"], "epara": ["e", "pra"], "epra": ["e", "pra"], "eterceiro": ["e", "terceiro"], "eo": ["e", "o"], "view": ["bio"], "isaleatorias": ["keys", "aleatorias"], "stim": ["steam"],
       "mangekyo": ["mangekyou"], "kakachi": ["kakashi"], "itati": ["itachi"], "sasque": ["sasuke"], "uchia": ["uchiha"], "camui": ["kamui"],
       "manguekiosharingan": ["mangekyou", "sharingan"], "manguekio": ["mangekyou"], "manguequio": ["mangekyou"], "utirra": ["uchiha"], "quis": ["keys"]}
_TR = os.path.join(ROOT, "assets/voice/transcript.json")
if not os.path.exists(_TR):  # sem narração ainda: tempos estimados a partir do roteiro
    _TR = os.path.join(ROOT, "assets/voice/transcript-provisorio.json")
WORDS = align(PARS, _TR, FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-gancho", "s2-regra", "s3-presente", "s4-keys", "s5-desmaio", "s6-segundos", "s7-guerra", "s8-amigo", "s9-pergunta"]
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
    "kakashi0": W(0, "kakashi"), "mangekyou0": W(0, "mangekyou"), "vezes": W(0, "vezes"), "nunca0": W(0, "nunca"), "cego0": W(0, "cego"),
    "itachi0": W(0, "itachi"), "sasuke0": W(0, "sasuke"), "visao0": W(0, "visao"), "porque0": W(0, "por"), "fica": W(0, "fica"), "triste": W(0, "triste"),
    "regra": W(1, "regra"), "forte": W(1, "forte"), "preco": W(1, "preco"), "usa": W(1, "usa"), "escurece": W(1, "escurece"), "itachi1": W(1, "itachi"),
    "cego1": W(1, "cego"), "escapou": W(1, "escapou"), "olhos1": W(1, "olhos"), "irmao": W(1, "irmao"),
    "olho2": W(2, "olho"), "presente": W(2, "presente"), "obito": W(2, "obito"), "sacrificou": W(2, "sacrificou"), "salvar": W(2, "salvar"),
    "uchiha": W(2, "uchiha"), "desliga": W(2, "desliga"), "sugando": W(2, "sugando"), "tempo2": W(2, "tempo"), "tapado": W(2, "tapado"),
    "rapidinho": W(3, "rapidinho"), "steam": W(3, "steam"), "bio": W(3, "bio"), "agora": W(3, "agora"),
    "explicacao": W(4, "explicacao"), "tres": W(4, "tres"), "quase4": W(4, "quase"), "kamui": W(4, "kamui"), "luta4": W(4, "luta"), "desmaiou": W(4, "desmaiou"), "carregado": W(4, "carregado"),
    "segundo5": W(5, "segundo"), "segundos": W(5, "segundos"), "sasuke5": W(5, "sasuke"), "ativado": W(5, "ativado"), "portal": W(5, "portal"), "fechava": W(5, "fechava"),
    "terceiro": W(6, "terceiro"), "acabou": W(6, "acabou"), "guerra": W(6, "guerra"), "perdeu": W(6, "perdeu"), "normais": W(6, "normais"),
    "seja": W(7, "seja"), "chakra7": W(7, "chakra"), "cego7": W(7, "cego"), "amigo7": W(7, "amigo"), "precisava": W(7, "precisava"),
    "voce": W(8, "voce"), "triste8": W(8, "triste"), "comenta": W(8, "comenta"),
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
    text-shadow:0 0 26px rgba(255,60,60,.35), 0 6px 26px rgba(0,0,0,.9), 0 2px 0 rgba(0,0,0,.6); -webkit-text-stroke:6px rgba(18,8,4,.9); paint-order:stroke fill; }}
  .big::before {{ content:''; position:absolute; left:4%; right:4%; top:-46px; bottom:-46px; z-index:-1;
    background:radial-gradient(ellipse at 50% 50%, rgba(12,6,4,.62) 0%, rgba(12,6,4,.42) 45%, rgba(12,6,4,0) 72%); }}
  .card {{ position:absolute; left:70px; right:70px; padding:22px 30px 24px; background:linear-gradient(135deg, rgba(30,12,8,.92), rgba(12,8,6,.9));
    border:3px solid rgba(255,90,80,.6); border-radius:6px; box-shadow:0 0 44px rgba(255,60,60,.25); }}
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
        big("s1-a", f"NUNCA FICOU<br>{g('CEGO', RED)} 👁️", 300, at(sc, "nunca0", -.2), 104, out=at(sc, "itachi0", -.25)),
        big("s1-b", f"ELES QUASE<br>{g('PERDERAM A VISÃO', RED)}", 300, at(sc, "itachi0", -.05), 84, out=at(sc, "porque0", -.25)),
        big("s1-c", f"POR {g('QUÊ?', RED)}", 320, at(sc, "porque0", -.1), 140, out=at(sc, "fica", -.25)),
        lbl2("s1-l2", "👀 TEM UM DETALHE TRISTE", 60, 560, at(sc, "fica"), GOLD, 34),
    ))


def s2():
    sc = "s2-regra"
    ov(sc, *join(
        lbl2("s2-l1", "📜 A REGRA DO MANGEKYOU", 60, 230, at(sc, "regra", -.2), RED, 36, out=at(sc, "usa", -.3)),
        big("s2-a", f"O MAIS FORTE…<br>{g('MAS COBRA', RED)}", 300, at(sc, "forte", -.3), 96, out=at(sc, "usa", -.3)),
        big("s2-b", f"MAIS USO =<br>{g('MENOS VISÃO', RED)}", 300, at(sc, "usa", -.15), 100, out=at(sc, "itachi1", -.25)),
        lbl2("s2-i1", "🩸 ITACHI: FICANDO CEGO", 60, 300, at(sc, "itachi1", -.1), RED, 38),
        lbl2("s2-i2", "👁️ SASUKE: OLHOS DO IRMÃO", 60, 390, at(sc, "escapou", -.1), GOLD, 38),
    ))


def s3():
    sc = "s3-presente"
    body = f'''<div id="s3-card" class="card" style="top:240px;z-index:7;opacity:0"><div class="nm">OBITO</div><div class="sub">O AMIGO QUE SE SACRIFICOU</div></div>'''
    js = f'''tl.fromTo("#s3-card", {{ opacity: 0, x: -40 }}, {{ opacity: 1, x: 0, duration: .35 }}, {at(sc, "obito", -.15)});
      tl.to("#s3-card", {{ opacity: 0, duration: .3 }}, {at(sc, "uchiha", -.6)});'''
    a = big("s3-a", f"O OLHO<br>{g('NEM ERA DELE')}", 300, at(sc, "olho2", -.2), 100, out=at(sc, "obito", -.3))
    l1 = lbl2("s3-l1", "⚡ NÃO DESLIGA · SUGA CHAKRA", 40, 250, at(sc, "desliga", -.15), STEEL, 34, out=at(sc, "tapado", -.5))
    b = big("s3-b", f"POR ISSO,<br>{g('O OLHO TAPADO', RED)}", 300, at(sc, "tapado", -.45), 92)
    ov(sc, body + a[0] + l1[0] + b[0], js + a[1] + l1[1] + b[1])


def s4():
    sc = "s4-keys"
    body = f'''<div id="s4-card" class="card" style="top:250px;z-index:7;opacity:0"><div class="nm" style="font-size:64px">🎮 KEYS ALEATÓRIAS</div>
      <div class="sub" style="font-size:36px">DA STEAM · BEM BARATAS</div>
      <div class="sub" style="font-size:40px;color:{GOLD};margin-top:14px">👆 LINK NA MINHA BIO</div></div>'''
    js = f'''tl.fromTo("#s4-card", {{ opacity: 0, y: -30, scale: .92 }}, {{ opacity: 1, y: 0, scale: 1, duration: .35, ease: "back.out(1.6)" }}, {at(sc, "rapidinho", -.1)});
      tl.fromTo("#s4-card", {{ scale: 1 }}, {{ scale: 1.05, duration: .18, yoyo: true, repeat: 1, immediateRender: false }}, {at(sc, "bio")});
      tl.to("#s4-card", {{ opacity: 0, duration: .3 }}, {at(sc, "agora", -.4)});'''
    l1 = lbl2("s4-l1", "🔎 AGORA, A RESPOSTA", 60, 300, at(sc, "agora", -.2), GOLD, 38)
    ov(sc, body + l1[0], js + l1[1])


def s5():
    sc = "s5-desmaio"
    ov(sc, *join(
        lbl2("s5-l1", "🧠 EXPLICAÇÃO MAIS ACEITA (FÃS)", 40, 230, at(sc, "explicacao", -.2), GOLD, 32, out=at(sc, "kamui", -.3)),
        big("s5-a", f"1. QUASE<br>{g('NÃO USAVA', RED)}", 300, at(sc, "quase4", -.35), 104, out=at(sc, "kamui", -.3)),
        lbl2("s5-l2", "🌀 KAMUI = CHAKRA DEMAIS", 60, 250, at(sc, "kamui", -.15), STEEL, 36, out=at(sc, "desmaiou", -.3)),
        big("s5-b", f"{g('DESMAIOU', RED)} 😵", 310, at(sc, "desmaiou", -.15), 110),
    ))


def s6():
    sc = "s6-segundos"
    ov(sc, *join(
        big("s6-a", f"2. CADA USO:<br>{g('SEGUNDOS', GOLD)}", 300, at(sc, "segundo5", -.2), 100, out=at(sc, "sasuke5", -.3)),
        lbl2("s6-l1", "SASUKE · ⏱️ A LUTA INTEIRA", 40, 260, at(sc, "sasuke5", -.1), RED, 36, out=at(sc, "portal", -.4)),
        lbl2("s6-l2", "KAKASHI · ⏱️ 2 SEGUNDOS", 40, 260, at(sc, "portal", -.3), GOLD, 36),
    ))


def s7():
    sc = "s7-guerra"
    ov(sc, *join(
        big("s7-a", f"3. O TEMPO<br>{g('ACABOU ANTES', RED)}", 300, at(sc, "terceiro", -.2), 96, out=at(sc, "guerra", -.3)),
        lbl2("s7-l1", "⚔️ FIM DA GUERRA: PERDEU O SHARINGAN", 20, 250, at(sc, "guerra", -.15), RED, 30, out=at(sc, "normais", -.6)),
        big("s7-b", f"HOJE: OLHOS<br>{g('NORMAIS', GOLD)}", 300, at(sc, "normais", -.55), 100),
    ))


def s8():
    sc = "s8-amigo"
    ov(sc, *join(
        big("s8-a", f"NEM CHAKRA,<br>NEM {g('TEMPO', RED)}", 300, at(sc, "chakra7", -.3), 104, out=at(sc, "amigo7", -.3)),
        big("s8-b", f"O OLHO DO AMIGO<br>DUROU {g('ATÉ ONDE<br>PRECISAVA', GOLD)}", 280, at(sc, "amigo7", -.15), 76),
    ))


def s9():
    sc = "s9-pergunta"
    b = big("s9-q", f"QUAL FOI O MOMENTO<br>{g('MAIS TRISTE', RED)}<br>DO KAKASHI?", 260, at(sc, "voce", -.1), 82)
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
        ("vento.wav", 0.0, .3), ("brilho.wav", k["kakashi0"] + .3, .45), ("impact-bass-1.mp3", k["nunca0"], .35), ("glitch-1.mp3", k["itachi0"], .25),
        ("impact-bass-2.mp3", k["porque0"], .4), ("coracao.wav", k["fica"], .3),
        ("whoosh.mp3", P[1] - .15, .3), ("relogio.wav", k["preco"], .35), ("brilho.wav", k["usa"], .35), ("vidro.wav", k["escurece"], .25), ("coracao.wav", k["itachi1"], .3),
        ("whoosh.mp3", P[2] - .15, .3), ("pedras.wav", k["olho2"], .45), ("brilho.wav", k["presente"], .35), ("sparkle.mp3", k["obito"], .3), ("dreno.wav", k["desliga"], .4),
        ("pop.mp3", k["tapado"], .25),
        ("notification.mp3", k["rapidinho"], .35), ("moedas.wav", k["steam"], .3), ("pop.mp3", k["bio"], .3), ("whoosh.mp3", k["agora"] - .3, .25),
        ("whoosh.mp3", P[4] - .15, .3), ("portal.wav", k["kamui"] - .2, .5), ("explosao.wav", k["luta4"], .3), ("impact-bass-2.mp3", k["desmaiou"], .4), ("vento.wav", k["carregado"], .25),
        ("whoosh.mp3", P[5] - .15, .3), ("relogio.wav", k["segundos"], .35), ("fogo.wav", k["sasuke5"], .35), ("portal.wav", k["portal"] - .2, .45), ("pop.mp3", k["fechava"], .3),
        ("whoosh.mp3", P[6] - .15, .3), ("vento.wav", P[6], .3), ("brilho.wav", k["perdeu"] - .2, .3), ("sparkle.mp3", k["normais"], .3),
        ("whoosh.mp3", P[7] - .15, .3), ("vento.wav", P[7], .3), ("coracao.wav", k["amigo7"], .3),
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
    <!-- Por que o Kakashi nunca ficou cego? — 3D motor v2 (gerado por tools/build_kakashi.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920" data-layout-allow-overflow></canvas>
      <div class="fontwarm" data-layout-allow-overflow><span style="font-family:'Archivo Black'">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/kakashi3d.js"></script>
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
        json.dump({"id": "kakashi", "name": "Por que o Kakashi nunca ficou cego usando o Mangekyou? (3D v2)", "createdAt": "2026-11-12T09:00:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL)
    for n, s, e in SCENES:
        print(f"  {n:15s} {s:6.2f} → {e:6.2f}  ({e - s:.1f}s)")
