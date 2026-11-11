"""Gera o vídeo 3D de curiosidade "Por que os Titãs de Attack on Titan atacavam humanos se nem precisavam comer?" em titas/.

Primeiro vídeo do motor 3D v2 (tools/motor3d): sombras, céu com nuvens, névoa, bloom, gradação de cor,
personagens articulados. O 3D fica em titas/assets/titas3d.js (montado por tools/motor3d/montar.py) e é
desenhado a partir do tempo. Gigantes e pessoas originais (nada desenhado da série; nomes só no texto e
na narração). Este script gera os tempos-chave, os textos por cena, as legendas e a raiz com voz, trilha e efeitos.
Uso: python3 tools/build_titas.py
"""
import base64
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "titas")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-titas.wav"
MUSIC = "assets/music/trilha-titas.wav"
RED, GOLD, BONE, STEEL, GREEN = "#ff4a3d", "#ffc35a", "#f3eadb", "#9fc3e8", "#7dffb0"
HL = "#ffc35a"  # destaque das legendas (dourado do sol)

PARS = [
    "Os Titãs de Attack on Titan|não precisavam comer.|Nem conseguiam digerir nada.|Mesmo assim,|passavam o dia inteiro|caçando gente.|Por quê?|Fica até o final,|porque a resposta|é a mais triste do anime.",
    "Primeiro:|eles não têm um sistema digestivo|de verdade.|É só um saco vazio.|Quando enche…|eles vomitam tudo|e voltam a caçar.",
    "Segundo:|a energia deles vem do sol.|Sem luz,|eles ficam lentos…|e de noite quase param.",
    "E terceiro:|eles ignoram cavalos,|vacas,|qualquer animal.|Só atacam humanos.",
    "Rapidinho:|tem keys aleatórias da Steam|bem baratas no link da minha bio.|Agora, a resposta.",
    "Os Titãs eram pessoas.|Gente transformada à força,|com uma injeção|de fluido espinhal de Titã.|Muitos eram prisioneiros,|jogados na ilha como castigo.",
    "E existe um jeito|de voltar a ser humano:|comer alguém que tenha o poder|de um dos Nove Titãs.|Foi assim que a Ymir voltou…|depois de uns sessenta anos vagando,|quando comeu o Marcel.",
    "Por isso,|a explicação mais aceita é:|eles não caçavam por fome.|Caçavam por instinto,|tentando voltar a ser gente.|E como não sabiam|quem tinha esse poder…|atacavam qualquer um.",
    "E o pior:|a Titã que devorou a mãe do Eren…|era a primeira esposa|do próprio pai dele.",
    "E pra você:|qual é a revelação mais pesada|de Attack on Titan?|Comenta aqui.",
]
FIX = {"para": ["pra"], "epara": ["e", "pra"], "atackontitan": ["attack", "on", "titan"], "atack": ["attack"], "stim": ["steam"], "imir": ["ymir"], "erin": ["eren"]}
_TR = os.path.join(ROOT, "assets/voice/transcript.json")
if not os.path.exists(_TR):  # sem narração ainda: tempos estimados a partir do roteiro
    _TR = os.path.join(ROOT, "assets/voice/transcript-provisorio.json")
WORDS = align(PARS, _TR, FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-gancho", "s2-estomago", "s3-sol", "s4-animais", "s5-keys", "s6-pessoas", "s7-voltar", "s8-instinto", "s9-pior", "s10-pergunta"]
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
    "titas0": W(0, "titas"), "precisavam": W(0, "precisavam"), "nem": W(0, "nem"), "digerir": W(0, "digerir"), "mesmo": W(0, "mesmo"),
    "dia": W(0, "dia"), "cacando": W(0, "cacando"), "porque0": W(0, "por"), "fica": W(0, "fica"), "triste": W(0, "triste"),
    "primeiro": W(1, "primeiro"), "digestivo": W(1, "digestivo"), "saco": W(1, "saco"), "vazio": W(1, "vazio"), "enche": W(1, "enche"),
    "vomitam": W(1, "vomitam"), "voltam": W(1, "voltam"), "cacar": W(1, "cacar"),
    "segundo": W(2, "segundo"), "energia": W(2, "energia"), "sol": W(2, "sol"), "luz": W(2, "luz"), "lentos": W(2, "lentos"), "noite": W(2, "noite"), "param": W(2, "param"),
    "terceiro": W(3, "terceiro"), "cavalos": W(3, "cavalos"), "vacas": W(3, "vacas"), "animal": W(3, "animal"), "atacam3": W(3, "atacam"), "humanos": W(3, "humanos"),
    "rapidinho": W(4, "rapidinho"), "steam": W(4, "steam"), "bio": W(4, "bio"), "agora": W(4, "agora"), "resposta4": W(4, "resposta"),
    "pessoas": W(5, "pessoas"), "gente5": W(5, "gente"), "forca": W(5, "forca"), "injecao": W(5, "injecao"), "fluido": W(5, "fluido"), "tita5": W(5, "tita"),
    "prisioneiros": W(5, "prisioneiros"), "ilha": W(5, "ilha"), "castigo": W(5, "castigo"),
    "existe": W(6, "existe"), "voltar6": W(6, "voltar"), "humano6": W(6, "humano"), "comer6": W(6, "comer"), "poder6": W(6, "poder"), "nove": W(6, "nove"),
    "ymir": W(6, "ymir"), "sessenta": W(6, "sessenta"), "vagando": W(6, "vagando"), "comeu": W(6, "comeu"), "marcel": W(6, "marcel"),
    "explicacao": W(7, "explicacao"), "aceita": W(7, "aceita"), "fome": W(7, "fome"), "instinto": W(7, "instinto"), "voltar7": W(7, "voltar"),
    "sabiam": W(7, "sabiam"), "poder7": W(7, "poder"), "qualquer7": W(7, "qualquer"),
    "pior": W(8, "pior"), "tita8": W(8, "tita"), "devorou": W(8, "devorou"), "mae": W(8, "mae"), "eren": W(8, "eren"), "primeira": W(8, "primeira"),
    "esposa": W(8, "esposa"), "pai": W(8, "pai"),
    "voce": W(9, "voce"), "revelacao": W(9, "revelacao"), "pesada": W(9, "pesada"), "comenta": W(9, "comenta"),
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
    text-shadow:0 0 26px rgba(255,120,60,.35), 0 6px 26px rgba(0,0,0,.9), 0 2px 0 rgba(0,0,0,.6); -webkit-text-stroke:6px rgba(18,8,4,.9); paint-order:stroke fill; }}
  .big::before {{ content:''; position:absolute; left:4%; right:4%; top:-46px; bottom:-46px; z-index:-1;
    background:radial-gradient(ellipse at 50% 50%, rgba(12,6,4,.62) 0%, rgba(12,6,4,.42) 45%, rgba(12,6,4,0) 72%); }}
  .card {{ position:absolute; left:70px; right:70px; padding:22px 30px 24px; background:linear-gradient(135deg, rgba(30,12,8,.92), rgba(12,8,6,.9));
    border:3px solid rgba(255,195,90,.6); border-radius:6px; box-shadow:0 0 44px rgba(255,120,60,.25); }}
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
        big("s1-a", f"NÃO PRECISAVAM<br>{g('COMER')}", 300, at(sc, "precisavam", -.25), 96, out=at(sc, "nem", -.25)),
        big("s1-b", f"NEM {g('DIGERIAM')}<br>NADA", 300, at(sc, "nem", -.1), 100, out=at(sc, "mesmo", -.25)),
        big("s1-c", f"MAS CAÇAVAM<br>{g('GENTE', RED)} O DIA<br>INTEIRO", 290, at(sc, "mesmo", -.05), 88, out=at(sc, "porque0", -.25)),
        big("s1-d", f"POR {g('QUÊ?', RED)}", 320, at(sc, "porque0", -.1), 140, out=at(sc, "fica", -.25)),
        lbl2("s1-l2", "👀 A RESPOSTA MAIS TRISTE DO ANIME", 40, 560, at(sc, "fica"), GOLD, 32),
    ))


def s2():
    sc = "s2-estomago"
    ov(sc, *join(
        lbl2("s2-l1", "1️⃣ SEM SISTEMA DIGESTIVO", 50, 230, at(sc, "primeiro", -.2), STEEL, 36, out=at(sc, "saco", -.3)),
        big("s2-a", f"SÓ UM<br>{g('SACO VAZIO')}", 300, at(sc, "saco", -.1), 104, out=at(sc, "enche", -.25)),
        big("s2-b", f"ENCHE…<br>E {g('VOMITA', RED)} TUDO", 300, at(sc, "enche", -.1), 96, out=at(sc, "voltam", -.25)),
        lbl2("s2-l2", "🔁 E VOLTA A CAÇAR", 60, 320, at(sc, "voltam", -.1), RED, 40),
    ))


def s3():
    sc = "s3-sol"
    ov(sc, *join(
        lbl2("s3-l1", "2️⃣ DE ONDE VEM A ENERGIA?", 50, 230, at(sc, "segundo", -.2), GOLD, 34, out=at(sc, "energia", -.25)),
        big("s3-a", f"☀️ {g('LUZ DO SOL')}", 300, at(sc, "energia", -.1), 104, out=at(sc, "noite", -.3)),
        lbl2("s3-l2", "🐢 SEM LUZ = LENTOS", 60, 560, at(sc, "luz", -.1), STEEL, 38, out=at(sc, "noite", -.3)),
        big("s3-c", f"🌙 DE NOITE<br>{g('QUASE PARAM', STEEL)}", 300, at(sc, "noite", -.1), 92),
    ))


def s4():
    sc = "s4-animais"
    ov(sc, *join(
        lbl2("s4-l1", "3️⃣ E OS ANIMAIS?", 60, 230, at(sc, "terceiro", -.2), GREEN, 36, out=at(sc, "atacam3", -.4)),
        lbl2("s4-i1", "🐴 CAVALO: IGNORA", 70, 330, at(sc, "cavalos", -.1), GREEN, 38, out=at(sc, "atacam3", -.4)),
        lbl2("s4-i2", "🐄 VACA: IGNORA", 70, 420, at(sc, "vacas", -.1), GREEN, 38, out=at(sc, "atacam3", -.4)),
        big("s4-a", f"SÓ ATACAM<br>{g('HUMANOS', RED)}", 300, at(sc, "atacam3", -.15), 104),
    ))


def s5():
    sc = "s5-keys"
    body = f'''<div id="s5-card" class="card" style="top:250px;z-index:7;opacity:0"><div class="nm" style="font-size:64px">🎮 KEYS ALEATÓRIAS</div>
      <div class="sub" style="font-size:36px">DA STEAM · BEM BARATAS</div>
      <div class="sub" style="font-size:40px;color:{GOLD};margin-top:14px">👆 LINK NA MINHA BIO</div></div>'''
    js = f'''tl.fromTo("#s5-card", {{ opacity: 0, y: -30, scale: .92 }}, {{ opacity: 1, y: 0, scale: 1, duration: .35, ease: "back.out(1.6)" }}, {at(sc, "rapidinho", -.1)});
      tl.fromTo("#s5-card", {{ scale: 1 }}, {{ scale: 1.05, duration: .18, yoyo: true, repeat: 1, immediateRender: false }}, {at(sc, "bio")});
      tl.to("#s5-card", {{ opacity: 0, duration: .3 }}, {at(sc, "agora", -.4)});'''
    l1 = lbl2("s5-l1", "🔎 AGORA, A RESPOSTA", 60, 300, at(sc, "agora", -.2), GOLD, 38)
    ov(sc, body + l1[0], js + l1[1])


def s6():
    sc = "s6-pessoas"
    ov(sc, *join(
        big("s6-a", f"OS TITÃS<br>{g('ERAM PESSOAS', RED)}", 290, at(sc, "pessoas", -.35), 104, out=at(sc, "injecao", -.3)),
        lbl2("s6-l1", "💉 FLUIDO ESPINHAL DE TITÃ", 50, 240, at(sc, "injecao", -.15), GOLD, 34, out=at(sc, "prisioneiros", -.3)),
        lbl2("s6-l2", "⛓️ PRISIONEIROS", 60, 240, at(sc, "prisioneiros", -.15), RED, 38),
        lbl2("s6-l3", "🏝️ JOGADOS NA ILHA DE CASTIGO", 40, 330, at(sc, "ilha", -.15), RED, 32),
    ))


def s7():
    sc = "s7-voltar"
    body = f'''<div id="s7-card" class="card" style="top:240px;z-index:7;opacity:0"><div class="nm">YMIR</div><div class="sub">≈ 60 ANOS VAGANDO COMO TITÃ</div></div>'''
    js = f'''tl.fromTo("#s7-card", {{ opacity: 0, x: -40 }}, {{ opacity: 1, x: 0, duration: .35 }}, {at(sc, "ymir", -.15)});
      tl.to("#s7-card", {{ opacity: 0, duration: .3 }}, {at(sc, "comeu", -.3)});'''
    a = big("s7-a", f"DÁ PRA VOLTAR<br>A SER {g('HUMANO')}", 290, at(sc, "existe", -.1), 92, out=at(sc, "comer6", -.25))
    l1 = lbl2("s7-l1", "🦷 COMER UM DOS NOVE TITÃS", 50, 250, at(sc, "comer6", -.1), GOLD, 34, out=at(sc, "ymir", -.3))
    b = big("s7-b", f"COMEU O {g('MARCEL')}…<br>E VOLTOU", 300, at(sc, "comeu", -.15), 88)
    ov(sc, body + a[0] + l1[0] + b[0], js + a[1] + l1[1] + b[1])


def s8():
    sc = "s8-instinto"
    ov(sc, *join(
        lbl2("s8-l1", "🧠 EXPLICAÇÃO MAIS ACEITA (FÃS)", 40, 230, at(sc, "explicacao", -.2), GOLD, 32, out=at(sc, "sabiam", -.3)),
        big("s8-a", f"NÃO ERA<br>{g('FOME', STEEL)}", 310, at(sc, "fome", -.35), 112, out=at(sc, "instinto", -.3)),
        big("s8-b", f"ERA {g('INSTINTO', GOLD)}", 320, at(sc, "instinto", -.15), 104, out=at(sc, "sabiam", -.3)),
        big("s8-c", f"ATACAVAM<br>{g('QUALQUER UM', RED)}", 300, at(sc, "qualquer7", -.25), 100),
    ))


def s9():
    sc = "s9-pior"
    ov(sc, *join(
        lbl2("s9-l1", "💔 O PIOR", 60, 230, at(sc, "pior", -.2), RED, 40, out=at(sc, "primeira", -.3)),
        big("s9-a", f"A TITÃ QUE DEVOROU<br>A {g('MÃE DO EREN')}…", 310, at(sc, "tita8", -.15), 76, out=at(sc, "primeira", -.3)),
        big("s9-b", f"ERA A {g('1ª ESPOSA', RED)}<br>DO PAI DELE", 300, at(sc, "primeira", -.15), 92),
    ))


def s10():
    sc = "s10-pergunta"
    b = big("s10-q", f"QUAL A REVELAÇÃO<br>{g('MAIS PESADA', RED)}<br>DE ATTACK ON TITAN?", 260, at(sc, "voce", -.1), 78)
    body = '''<div class="big" id="s10-c" style="top:1680px;font-family:'Space Mono';font-weight:700;font-size:56px;opacity:0">COMENTA 👇</div>'''
    js = f'''tl.fromTo("#s10-c", {{ opacity: 0 }}, {{ opacity: 1, duration: .4 }}, {at(sc, "comenta", -.1)});
      tl.fromTo("#s10-c", {{ y: 0 }}, {{ y: 12, duration: .4, yoyo: true, repeat: 5, ease: "sine.inOut", immediateRender: false }}, {at(sc, "comenta", .4)});'''
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
        ("vento.wav", 0.0, .35), ("passo.wav", k["titas0"] + .2, .5), ("tremor.wav", k["titas0"] + .3, .3), ("passo.wav", k["nem"], .5),
        ("rosnado.wav", k["mesmo"], .45), ("passo.wav", k["cacando"], .55), ("impact-bass-1.mp3", k["porque0"], .4), ("vapor.wav", k["fica"] - .3, .35),
        ("whoosh.mp3", P[1] - .15, .3), ("scan.wav", P[1] + .1, .35), ("bip.wav", k["digestivo"], .3), ("glub.wav", k["saco"], .4), ("glub.wav", k["enche"], .45),
        ("impact-bass-2.mp3", k["vomitam"], .4), ("rosnado.wav", k["voltam"], .35),
        ("whoosh.mp3", P[2] - .15, .3), ("sparkle.mp3", k["sol"], .3), ("vento.wav", k["luz"], .3), ("grilos.wav", k["noite"] - .2, .35),
        ("whoosh.mp3", P[3] - .15, .3), ("passo.wav", k["terceiro"] + .2, .45), ("passo.wav", k["vacas"], .45), ("impact-bass-1.mp3", k["humanos"], .4),
        ("notification.mp3", k["rapidinho"], .35), ("moedas.wav", k["steam"], .3), ("pop.mp3", k["bio"], .3), ("whoosh.mp3", k["agora"] - .3, .25),
        ("trovao.wav", k["pessoas"] - .3, .45), ("impact-bass-2.mp3", k["pessoas"], .4), ("corrente.wav", k["forca"], .35), ("vidro.wav", k["injecao"], .3),
        ("trovao.wav", k["fluido"] + .2, .4), ("vapor.wav", k["tita5"], .4), ("corrente.wav", k["prisioneiros"], .4), ("passo.wav", k["castigo"], .5),
        ("whoosh.mp3", P[6] - .15, .3), ("grilos.wav", P[6], .3), ("coracao.wav", k["comer6"], .35), ("sparkle.mp3", k["nove"], .35),
        ("previsao.wav", k["ymir"], .3), ("explosao.wav", k["comeu"] - .1, .35), ("vapor.wav", k["marcel"], .45),
        ("whoosh.mp3", P[7] - .15, .3), ("passo.wav", k["explicacao"], .45), ("passo.wav", k["fome"], .45), ("coracao.wav", k["instinto"], .35),
        ("passo.wav", k["sabiam"], .45), ("rosnado.wav", k["qualquer7"], .45),
        ("whoosh.mp3", P[8] - .15, .3), ("vento.wav", P[8], .3), ("passo.wav", k["tita8"], .5), ("vidro.wav", k["mae"], .3), ("impact-bass-2.mp3", k["primeira"], .45),
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
    <!-- Por que os Titãs atacavam humanos se nem precisavam comer? — 3D motor v2 (gerado por tools/build_titas.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920" data-layout-allow-overflow></canvas>
      <div class="fontwarm" data-layout-allow-overflow><span style="font-family:'Archivo Black'">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/titas3d.js"></script>
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
        json.dump({"id": "titas", "name": "Por que os Titãs atacavam humanos se nem precisavam comer? (3D v2)", "createdAt": "2026-11-11T16:00:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL)
    for n, s, e in SCENES:
        print(f"  {n:15s} {s:6.2f} → {e:6.2f}  ({e - s:.1f}s)")
