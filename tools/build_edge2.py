"""Gera o vídeo 3D de curiosidade "O final de cada personagem de Edgerunners 2" em edge2/.

O 3D (Three.js) fica em edge2/assets/edge3d.js e é desenhado a partir do tempo.
Só silhuetas e símbolos originais (nada desenhado da série; os nomes aparecem só
como texto e narração). Este script gera os tempos-chave, os cartões com carimbo
(MORTO / VIVO / ???), as legendas e a raiz com voz, trilha e efeitos.
Uso: python3 tools/build_edge2.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "edge2")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-edge2.wav"
MUSIC = "assets/music/trilha-edge2.wav"
CYAN, PINK, RED, GREEN, YELLOW = "#4ff0ff", "#ff4fd8", "#ff4d6d", "#4dffa6", "#ffe14d"
CRIM = CYAN  # destaque das legendas

PARS = [
    "Na primeira temporada de Edgerunners,|quase todo mundo morreu.|Na segunda…|o final é o contrário.|Mas tem um personagem|que ninguém sabe se está vivo.|Fica até o final.",
    "Vamos por partes.|A primeira a cair foi a Avida,|mãe da Talia.|No episódio 8,|ela tentou roubar o Soulkiller|junto com o Weak…|levou um tiro na fuga|e morreu segurando a mão dele.",
    "O Kiril,|pai da Talia e executivo da Kang Tao,|foi vilão até o fim.|Ele morreu nas Badlands…|no meio do ataque aéreo|da própria empresa.",
    "A Kyoko,|a cientista ligada ao projeto da Capri,|se sacrificou|ativando um pulso EMP|pra tentar parar esse ataque.",
    "Agora, os sobreviventes.|A Talia viveu.|O D entrou na mente dela|e separou a Talia da Capri.|Mas ela perdeu quase todo o cromo|e foi pra uma clínica de reabilitação.",
    "O Weak tentou matar o Kiril|com a mesma arma do primeiro episódio…|e a arma travou.|Depois, levou um tiro.|E quem salvou ele|foi a urna com as cinzas da Avida.|Ele termina chorando…|e prometendo viver.",
    "O Roman,|o garoto que filmava tudo,|também sobreviveu.|E ficou com a missão|de contar essa história.",
    "E o D?|O nome verdadeiro dele também é David,|igual ao protagonista da temporada 1…|mas não é a mesma pessoa.|A Capri reconstruiu o corpo dele,|ele enfrentou os soldados das corporações…|e, a pedido dela,|voou em direção a uma luz no céu.|Antes, deu um último sorriso|pra câmera do Roman.",
    "A série nunca mostrou se ele morreu.|Tem fã que acha|que aquela luz era um satélite…|e que a Capri se espalhou pela rede.",
    "E pra você…|pra onde o D foi?|Comenta aqui.",
]
FIX = {"havida": ["avida"], "week": ["weak"], "kirill": ["kiril"], "tanital": ["kang", "tao"], "dentrou": ["d", "entrou"],
       "ea": ["e", "a"], "equem": ["e", "quem"], "eficou": ["e", "ficou"], "eo": ["e", "o"], "epara": ["e", "pra"],
       "dfoi": ["d", "foi"], "para": ["pra"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-cidade", "s2-avida", "s3-kiril", "s4-kyoko", "s5-talia", "s6-weak", "s7-roman", "s8-d", "s9-teoria", "s10-pergunta"]
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
    "quase0": W(0, "quase"), "morreu0": W(0, "morreu"), "segunda": W(0, "segunda"), "contrario": W(0, "contrario"), "personagem": W(0, "personagem"), "vivo0": W(0, "vivo"), "final0": W(0, "final", 1),
    "partes": W(1, "partes"), "avida1": W(1, "avida"), "episodio1": W(1, "episodio"), "soulkiller": W(1, "soulkiller"), "weak1": W(1, "weak"), "tiro1": W(1, "tiro"),
    "morreu1": W(1, "morreu"), "mao": W(1, "mao"),
    "kiril2": W(2, "kiril"), "kang": W(2, "kang"), "vilao": W(2, "vilao"), "morreu2": W(2, "morreu"), "badlands": W(2, "badlands"), "ataque2": W(2, "ataque"), "empresa": W(2, "empresa"),
    "kyoko": W(3, "kyoko"), "capri3": W(3, "capri"), "sacrificou": W(3, "sacrificou"), "emp": W(3, "emp"), "ataque3": W(3, "ataque"),
    "sobreviventes": W(4, "sobreviventes"), "talia4": W(4, "talia"), "viveu": W(4, "viveu"), "entrou": W(4, "entrou"), "separou": W(4, "separou"),
    "cromo": W(4, "cromo"), "clinica": W(4, "clinica"),
    "weak5": W(5, "weak"), "arma5": W(5, "arma"), "travou": W(5, "travou"), "tiro5": W(5, "tiro"), "urna": W(5, "urna"), "cinzas": W(5, "cinzas"),
    "chorando": W(5, "chorando"), "viver": W(5, "viver"),
    "roman6": W(6, "roman"), "filmava": W(6, "filmava"), "sobreviveu6": W(6, "sobreviveu"), "missao": W(6, "missao"), "historia": W(6, "historia"),
    "d7": W(7, "d"), "david": W(7, "david"), "protagonista": W(7, "protagonista"), "mesma7": W(7, "mesma"), "reconstruiu": W(7, "reconstruiu"),
    "enfrentou": W(7, "enfrentou"), "soldados": W(7, "soldados"), "pedido": W(7, "pedido"), "voou": W(7, "voou"), "luz7": W(7, "luz"), "ceu": W(7, "ceu"),
    "sorriso": W(7, "sorriso"), "camera7": W(7, "camera"),
    "nunca8": W(8, "nunca"), "morreu8": W(8, "morreu"), "acha": W(8, "acha"), "satelite": W(8, "satelite"), "rede": W(8, "rede"),
    "voce": W(9, "voce"), "onde": W(9, "onde"), "comenta": W(9, "comenta"),
}


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


CSS = f'''#root {{ background: transparent; }}
  .lbl {{ position:absolute; font-family:'Space Mono',monospace; font-weight:700; color:#fff; letter-spacing:.06em; text-transform:uppercase;
    background:rgba(8,6,18,.88); border-left:8px solid {PINK}; padding:10px 22px; font-size:36px; }}
  .big {{ position:absolute; left:0; right:0; text-align:center; font-family:'Archivo Black'; color:#fff; letter-spacing:.02em; line-height:1.05;
    text-shadow:0 0 22px rgba(79,240,255,.35), 0 6px 24px rgba(0,0,0,.85); }}
  .card {{ position:absolute; left:60px; right:60px; padding:20px 30px 22px; background:rgba(8,6,18,.8); border:3px solid rgba(255,255,255,.16);
    border-left:10px solid {CYAN}; box-shadow:0 0 40px rgba(79,240,255,.18); }}
  .card .nm {{ font-family:'Archivo Black'; font-size:92px; color:#fff; line-height:1; letter-spacing:.02em; }}
  .card .sub {{ font-family:'Space Mono',monospace; font-weight:700; font-size:30px; color:#d6dcff; letter-spacing:.05em; margin-top:10px; text-transform:uppercase; }}
  .stamp {{ position:absolute; right:26px; top:22px; font-family:'Archivo Black'; font-size:46px; padding:4px 16px; border:6px solid; border-radius:6px;
    background:rgba(8,6,18,.55); opacity:0; }}
  .dead {{ color:{RED}; border-color:{RED}; text-shadow:0 0 14px rgba(255,77,109,.6); }}
  .alive {{ color:{GREEN}; border-color:{GREEN}; text-shadow:0 0 14px rgba(77,255,166,.6); }}
  .unk {{ color:{YELLOW}; border-color:{YELLOW}; text-shadow:0 0 14px rgba(255,225,77,.6); }}
  .rec {{ position:absolute; inset:150px 50px 330px; border:4px solid rgba(255,255,255,.75); opacity:0; }}
  .rec .dot {{ position:absolute; left:26px; top:22px; font-family:'Space Mono',monospace; font-weight:700; font-size:40px; color:#ff3b4f; }}
  .rec .tc {{ position:absolute; right:26px; top:22px; font-family:'Space Mono',monospace; font-weight:700; font-size:36px; color:#fff; }}'''


def ov(sc, body, js):
    write(sc, scene(sc, body, js, CSS, bg="transparent"))


def at(sc, k, off=0.0):
    return round(KEYS[k] - SC[sc][0] + off, 2)


def lbl2(cid, text, left, top, t, color=PINK, size=36, out=None):
    b = f'<div id="{cid}" class="lbl" style="left:{left}px;top:{top}px;z-index:7;border-left-color:{color};font-size:{size}px;opacity:0">{text}</div>'
    j = f'tl.fromTo("#{cid}", {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: .3 }}, {t});'
    if out is not None:
        j += f'tl.to("#{cid}", {{ opacity: 0, duration: .25 }}, {out});'
    return b, j


def big(cid, html, top, t, size=110, color="#ffffff", out=None):
    b = f'<div class="big" id="{cid}" style="top:{top}px;font-size:{size}px;color:{color};opacity:0;z-index:6">{html}</div>'
    j = f'tl.fromTo("#{cid}", {{ opacity: 0, scale: .9 }}, {{ opacity: 1, scale: 1, duration: .4 }}, {t});'
    if out is not None:
        j += f'tl.to("#{cid}", {{ opacity: 0, duration: .3 }}, {out});'
    return b, j


def card(cid, name, sub, t, stamp=None, kind="dead", st_t=None, out=None, top=230, edge=CYAN):
    """Cartão do personagem com carimbo (MORTO / VIVO / ???)."""
    st = f'<div id="{cid}-st" class="stamp {kind}">{stamp}</div>' if stamp else ""
    b = f'<div id="{cid}" class="card" style="top:{top}px;z-index:7;opacity:0;border-left-color:{edge}"><div class="nm">{name}</div><div id="{cid}-sub" class="sub">{sub}</div>{st}</div>'
    j = f'tl.fromTo("#{cid}", {{ opacity: 0, x: -40 }}, {{ opacity: 1, x: 0, duration: .35 }}, {t});'
    if stamp:
        j += f'tl.fromTo("#{cid}-st", {{ opacity: 0, scale: 1.9, rotation: -8 }}, {{ opacity: 1, scale: 1, rotation: -8, duration: .2, ease: "back.out(2)" }}, {st_t});'
        j += f'tl.fromTo("#{cid}", {{ x: 0 }}, {{ x: 7, duration: .04, repeat: 3, yoyo: true, ease: "none", immediateRender: false }}, {round(st_t + .18, 2)});'
    if out is not None:
        j += f'tl.to("#{cid}", {{ opacity: 0, duration: .3 }}, {out});'
    return b, j


def s1():
    sc = "s1-cidade"
    l1 = lbl2("s1-l1", "⚠️ SPOILERS DA TEMPORADA 2", 60, 220, .2, RED, 32, out=at(sc, "final0", .3))
    a = big("s1-a", f"<span style='font-size:44px;font-family:Space Mono;color:{CYAN}'>TEMPORADA 1</span><br>☠️ QUASE TODOS<br>MORRERAM", 330, at(sc, "quase0", -.2), 76, out=at(sc, "segunda", -.15))
    b = big("s1-b", f"<span style='font-size:44px;font-family:Space Mono;color:{CYAN}'>TEMPORADA 2</span><br>😮 O CONTRÁRIO", 330, at(sc, "contrario", -.25), 84, out=at(sc, "personagem", -.2))
    c = big("s1-c", f"MAS 1 PERSONAGEM…<br><span style='color:{YELLOW};font-size:190px'>???</span>", 330, at(sc, "personagem", -.05), 70)
    ov(sc, l1[0] + a[0] + b[0] + c[0], l1[1] + a[1] + b[1] + c[1])


def s2():
    sc = "s2-avida"
    c = card("s2-c", "AVIDA", "MÃE DA TALIA · EP. 8", at(sc, "avida1", -.2), "MORTA ❌", "dead", at(sc, "morreu1"), edge=RED)
    l1 = lbl2("s2-l1", "TENTOU ROUBAR O SOULKILLER", 60, 470, at(sc, "soulkiller", -.1), PINK, 32, out=at(sc, "tiro1", -.1))
    ov(sc, c[0] + l1[0], c[1] + l1[1])


def s3():
    sc = "s3-kiril"
    c = card("s3-c", "KIRIL", "PAI DA TALIA · KANG TAO", at(sc, "kiril2", -.2), "MORTO ❌", "dead", at(sc, "morreu2"), edge=RED)
    l1 = lbl2("s3-l1", "💥 ATAQUE AÉREO DA PRÓPRIA EMPRESA", 50, 470, at(sc, "ataque2", -.1), RED, 30)
    ov(sc, c[0] + l1[0], c[1] + l1[1])


def s4():
    sc = "s4-kyoko"
    c = card("s4-c", "KYOKO", "CIENTISTA DO PROJETO CAPRI", at(sc, "kyoko", -.2), "MORTA ❌", "dead", at(sc, "sacrificou"), edge=RED)
    l1 = lbl2("s4-l1", "⚡ SACRIFÍCIO: PULSO EMP", 60, 470, at(sc, "emp", -.2), CYAN, 32)
    ov(sc, c[0] + l1[0], c[1] + l1[1])


def s5():
    sc = "s5-talia"
    b = big("s5-b", f"OS <span style='color:{GREEN}'>SOBREVIVENTES</span>", 320, at(sc, "sobreviventes", -.25), 86, out=at(sc, "talia4", -.3))
    c = card("s5-c", "TALIA", "FILHA DA AVIDA E DO KIRIL", at(sc, "talia4", -.15), "VIVA ✅", "alive", at(sc, "viveu", .05), edge=GREEN)
    l1 = lbl2("s5-l1", "🧠 O D SEPAROU ELA DA CAPRI", 60, 470, at(sc, "entrou"), PINK, 30, out=at(sc, "cromo", -.3))
    l2 = lbl2("s5-l2", "🦾 SEM CROMO → REABILITAÇÃO", 60, 470, at(sc, "cromo"), GREEN, 30)
    ov(sc, b[0] + c[0] + l1[0] + l2[0], b[1] + c[1] + l1[1] + l2[1])


def s6():
    sc = "s6-weak"
    c = card("s6-c", "WEAK", "A LENDA APOSENTADA", at(sc, "weak5", -.2), "VIVO ✅", "alive", at(sc, "cinzas"), edge=GREEN)
    l1 = lbl2("s6-l1", "🔫 A ARMA TRAVOU", 60, 470, at(sc, "travou", -.1), YELLOW, 32, out=at(sc, "urna", -.4))
    l2 = lbl2("s6-l2", "🕊️ SALVO PELAS CINZAS DA AVIDA", 60, 470, at(sc, "urna"), GREEN, 30)
    ov(sc, c[0] + l1[0] + l2[0], c[1] + l1[1] + l2[1])


def s7():
    sc = "s7-roman"
    c = card("s7-c", "ROMAN", "O GAROTO DA CÂMERA 🎥", at(sc, "roman6", -.2), "VIVO ✅", "alive", at(sc, "sobreviveu6"), edge=GREEN)
    l1 = lbl2("s7-l1", "VAI CONTAR ESSA HISTÓRIA", 60, 470, at(sc, "missao", -.1), GREEN, 32)
    ov(sc, c[0] + l1[0], c[1] + l1[1])


def s8():
    sc = "s8-d"
    c = card("s8-c", "D", "NOME VERDADEIRO: ???", at(sc, "d7", -.2), None, out=at(sc, "reconstruiu", -.3), edge=YELLOW)
    sub = f'tl.set("#s8-c-sub", {{ textContent: "NOME VERDADEIRO: DAVID" }}, {at(sc, "david")});tl.fromTo("#s8-c-sub", {{ color: "{YELLOW}" }}, {{ color: "#d6dcff", duration: .8, immediateRender: false }}, {at(sc, "david")});'
    l1 = lbl2("s8-l1", "≠ O DAVID MARTINEZ DA TEMPORADA 1", 50, 470, at(sc, "david", .1), RED, 28, out=at(sc, "reconstruiu", -.2))
    q = big("s8-q", f"<span style='color:{YELLOW};font-size:200px'>???</span>", 300, at(sc, "voou", -.1), 100, out=at(sc, "sorriso", -.6))
    body = '''<div id="s8-rec" class="rec" style="z-index:5"><div class="dot">● REC</div><div class="tc">00:00:84</div></div>'''
    js = f'''tl.fromTo("#s8-rec", {{ opacity: 0 }}, {{ opacity: 1, duration: .2 }}, {at(sc, "sorriso", -.6)});
      tl.fromTo("#s8-rec .dot", {{ opacity: 1 }}, {{ opacity: .2, duration: .3, yoyo: true, repeat: 5, ease: "none", immediateRender: false }}, {at(sc, "sorriso", -.4)});'''
    ov(sc, c[0] + l1[0] + q[0] + body, c[1] + sub + l1[1] + q[1] + js)


def s9():
    sc = "s9-teoria"
    l1 = lbl2("s9-l1", "🛰️ TEORIA DOS FÃS", 60, 230, at(sc, "acha", -.2), YELLOW, 34)
    b = big("s9-b", f"<span style='background:rgba(8,6,18,.66);padding:4px 22px;-webkit-box-decoration-break:clone;box-decoration-break:clone'>A LUZ ERA UM<br><span style='color:{CYAN}'>SATÉLITE?</span></span>", 320, at(sc, "acha", .2), 84)
    ov(sc, l1[0] + b[0], l1[1] + b[1])


def s10():
    sc = "s10-pergunta"
    b = big("s10-q", f"PRA ONDE<br>O <span style='color:{YELLOW}'>D</span> FOI?", 300, at(sc, "voce", -.2), 120)
    body = f'''<div class="big" id="s10-c" style="top:1680px;font-family:'Space Mono';font-weight:700;font-size:56px;opacity:0">COMENTA 👇</div>'''
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
            js.append(f'tl.fromTo("#cw{gi}-{j}", {{ color: "#ffffff" }}, {{ color: "{CRIM}", duration: .05, immediateRender: false }}, {w[4]:.2f});')
    css = '''#root { background: transparent; }
      .cg { position:absolute; left:90px; right:150px; top:1240px; text-align:center; }
      .cbox { display:inline-block; padding:8px 18px; background:rgba(8,6,16,.62); font-family:Montserrat; font-weight:800; font-size:50px; line-height:1.15; color:#fff;
        text-transform:uppercase; text-shadow:0 3px 10px rgba(0,0,0,.9); max-width:840px; }'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


def sfx_list():
    k = KEYS
    return [("chuva.wav", 0.0, .2), ("neon.wav", 0.1, .25), ("whoosh.mp3", 0.15, .25), ("impact-bass-2.mp3", k["morreu0"] - .1, .35),
            ("glitch-1.mp3", k["contrario"] - .1, .3), ("previsao.wav", k["vivo0"] - .3, .3),
            ("alarme.wav", SC["s2-avida"][0] + .1, .14), ("whoosh.mp3", k["avida1"] - .3, .25), ("tiro.wav", k["tiro1"], .45),
            ("carimbo.wav", k["morreu1"], .45), ("coracao.wav", k["mao"] - .3, .3),
            ("whoosh.mp3", PSTART[2] - .1, .25), ("carimbo.wav", k["morreu2"], .45), ("whoosh-short.mp3", k["ataque2"] - .4, .35),
            ("explosao.wav", k["ataque2"] + .2, .5), ("explosao.wav", k["empresa"] - .2, .4),
            ("whoosh.mp3", PSTART[3] - .1, .25), ("carimbo.wav", k["sacrificou"], .45), ("zap.wav", k["emp"] - .1, .4), ("onda.wav", k["emp"], .4),
            ("sparkle.mp3", k["sobreviventes"], .3), ("carimbo.wav", k["viveu"] + .05, .45), ("glitch-1.mp3", k["entrou"], .25), ("corrente.wav", k["cromo"], .25),
            ("whoosh.mp3", PSTART[5] - .1, .25), ("clique.wav", k["travou"] - .1, .55), ("tiro.wav", k["tiro5"] - .1, .45), ("ping.mp3", k["urna"], .4),
            ("carimbo.wav", k["cinzas"], .45), ("sparkle.mp3", k["viver"] - .6, .3),
            ("projetor.wav", k["roman6"], .3), ("carimbo.wav", k["sobreviveu6"], .45),
            ("glitch-1.mp3", k["david"] - .1, .3), ("impact-bass-1.mp3", k["mesma7"], .3), ("sparkle.mp3", k["reconstruiu"], .35),
            ("tiro.wav", k["enfrentou"], .28), ("tiro.wav", k["enfrentou"] + .35, .25), ("tiro.wav", k["soldados"] + .2, .28), ("impact-bass-2.mp3", k["soldados"] + .6, .4),
            ("voo.wav", k["voou"] - .2, .45), ("carimbo.wav", k["luz7"], .4), ("obturador.wav", k["sorriso"], .45),
            ("whoosh.mp3", PSTART[8] - .1, .3), ("sparkle.mp3", k["satelite"], .35), ("glitch-1.mp3", k["rede"] - .3, .25),
            ("whoosh-short.mp3", k["voce"] - .2, .3), ("pop.mp3", k["comenta"], .3)]


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
        f'      <audio id="trilha" class="clip" src="{MUSIC}" data-start="0" data-duration="{TOTAL}" data-volume="0.26" data-fade-out="2" data-track-index="5"></audio>',
    ]
    lanes = []
    for i, (f, st, vol) in enumerate(sfx_list()):
        st = round(max(0, st), 2)
        d = round(min(dur(os.path.join(ROOT, "assets/sfx", f)), TOTAL - st, 8.0 if f in ("chuva.wav", "alarme.wav") else 3.0), 2)
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
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #07040f; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
      #c3d {{ position: absolute; inset: 0; width: 1080px; height: 1920px; z-index: 0; }}
      .fontwarm {{ position: absolute; left: -9999px; top: 0; }}
    </style>
  </head>
  <body>
    <!-- O final de cada personagem de Edgerunners 2 — 3D (gerado por tools/build_edge2.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920" data-layout-allow-overflow></canvas>
      <div class="fontwarm" data-layout-allow-overflow><span style="font-family:'Space Mono';font-weight:700">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/edge3d.js"></script>
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
        json.dump({"id": "edge2", "name": "O final de cada personagem de Edgerunners 2 (3D)", "createdAt": "2026-11-09T10:45:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, "climax", round(PSTART[7], 2))
    for n, s, e in SCENES:
        print(f"  {n:15s} {s:6.2f} → {e:6.2f}  ({e - s:.1f}s)")
