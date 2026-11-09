"""Gera o vídeo 3D de curiosidade "Por que o Barba Negra tem duas Akumas no Mi?" em barba/.

O 3D (Three.js) fica em barba/assets/barba3d.js e é desenhado a partir do tempo.
Personagens originais animados (nada desenhado da série; os nomes aparecem só
como texto e narração). Este script gera os tempos-chave, os textos por cena,
as legendas e a raiz com voz, trilha e efeitos.
Uso: python3 tools/build_barba.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "barba")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-barba.wav"
MUSIC = "assets/music/trilha-barba.wav"
CYAN, PINK, RED, GREEN, YELLOW = "#7af0ff", "#c99aff", "#ff4d6d", "#4dffa6", "#ffd27a"
CRIM = "#c99aff"  # destaque das legendas (violeta)

PARS = [
    "Em One Piece,|quem come duas Akumas no Mi…|morre.|Sem exceção.|Mas existe um pirata|com dois poderes ao mesmo tempo…|e até hoje ninguém explicou como.|Fica até o final,|porque as pistas são assustadoras.",
    "O Barba Negra passou décadas|no navio do Barba Branca,|esperando uma única fruta:|a da escuridão.|Quando ela apareceu,|ele matou o próprio companheiro,|o Thatch,|pra ficar com ela.",
    "Na guerra de Marineford,|o Barba Branca morreu de pé.|E a tripulação do Barba Negra|cobriu o corpo dele|com um pano preto enorme.|Quando o pano caiu…|o Barba Negra tinha|o poder dos terremotos.",
    "Então ele comeu uma segunda fruta?|Não.|Ninguém viu ele comer nada.",
    "Foi sorte?|Também não.|O Marco,|que conviveu anos com ele,|disse uma coisa assustadora:|o corpo do Barba Negra não é normal.",
    "Rapidinho:|tem keys aleatórias da Steam|bem baratas no link da bio.|Agora, as pistas.",
    "Pista 1:|ele não dorme.|Já disseram na série|que ele simplesmente nunca dorme.|Pista 2:|a escuridão dele anula o poder|de qualquer outra fruta que ela toca.",
    "Por isso, os fãs têm duas teorias.|A primeira:|ele teria mais de uma alma dentro do corpo…|e cada alma aguentaria um poder.|A segunda:|ele nasceu de uma linhagem rara,|com um corpo diferente de todo mundo.",
    "A resposta completa?|A série ainda não mostrou.|Mas ele é o único na história|que conseguiu…|e talvez não pare em dois.",
    "E pra você:|qual é o segredo do Barba Negra?|Comenta aqui.",
]
FIX = {"acumas": ["akumas"], "para": ["pra"], "quisa": ["keys"], "parem": ["pare", "em"], "epara": ["e", "pra"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-gancho", "s2-navio", "s3-guerra", "s4-comeu", "s5-sorte", "s6-keys", "s7-pistas", "s8-teorias", "s9-unico", "s10-pergunta"]
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
    "duas0": W(0, "duas"), "morre": W(0, "morre"), "excecao": W(0, "excecao"), "pirata": W(0, "pirata"), "poderes": W(0, "poderes"), "ninguem": W(0, "ninguem"),
    "fica": W(0, "fica"), "assustadoras": W(0, "assustadoras"),
    "decadas": W(1, "decadas"), "navio": W(1, "navio"), "unica": W(1, "unica"), "escuridao": W(1, "escuridao"), "apareceu": W(1, "apareceu"), "matou": W(1, "matou"),
    "thatch": W(1, "thatch"), "ficar": W(1, "ficar"),
    "guerra": W(2, "guerra"), "morreu": W(2, "morreu"), "pe": W(2, "pe"), "tripulacao": W(2, "tripulacao"), "cobriu": W(2, "cobriu"), "pano": W(2, "pano"),
    "enorme": W(2, "enorme"), "pano2": W(2, "pano", 1), "caiu": W(2, "caiu"), "tinha": W(2, "tinha"), "terremotos": W(2, "terremotos"),
    "comeu": W(3, "comeu"), "segunda3": W(3, "segunda"), "nao3": W(3, "nao"), "nada": W(3, "nada"),
    "sorte": W(4, "sorte"), "tambem4": W(4, "tambem"), "marco": W(4, "marco"), "assustadora": W(4, "assustadora"), "corpo4": W(4, "corpo"), "normal": W(4, "normal"),
    "rapidinho": W(5, "rapidinho"), "keys": W(5, "keys"), "steam": W(5, "steam"), "bio": W(5, "bio"), "pistas5": W(5, "pistas"),
    "pista1": W(6, "pista"), "dorme": W(6, "dorme"), "nunca": W(6, "nunca"), "pista2": W(6, "pista", 1), "escuridao6": W(6, "escuridao"), "anula": W(6, "anula"), "toca": W(6, "toca"),
    "teorias": W(7, "teorias"), "primeira": W(7, "primeira"), "alma": W(7, "alma"), "cada": W(7, "cada"), "segunda7": W(7, "segunda"), "linhagem": W(7, "linhagem"), "diferente": W(7, "diferente"),
    "resposta": W(8, "resposta"), "mostrou": W(8, "mostrou"), "unico": W(8, "unico"), "conseguiu": W(8, "conseguiu"), "talvez": W(8, "talvez"), "dois8": W(8, "dois"),
    "voce": W(9, "voce"), "segredo": W(9, "segredo"), "comenta": W(9, "comenta"),
}


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


CSS = f'''#root {{ background: transparent; }}
  .lbl {{ position:absolute; font-family:'Space Mono',monospace; font-weight:700; color:#fff; letter-spacing:.06em; text-transform:uppercase;
    background:rgba(8,6,18,.88); border-left:8px solid {PINK}; padding:10px 22px; font-size:36px; }}
  .big {{ position:absolute; left:0; right:0; text-align:center; font-family:'Archivo Black'; color:#fff; letter-spacing:.02em; line-height:1.05;
    text-shadow:0 0 22px rgba(201,154,255,.35), 0 6px 24px rgba(0,0,0,.85); }}
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


def xq(cid, text, t, cross, top=300, size=110):
    """Palpite errado: aparece e leva um risco vermelho."""
    b = (f'<div class="big" id="{cid}" style="top:{top}px;font-size:{size}px;color:#fff;opacity:0;z-index:6">{text}'
         f'<div id="{cid}-x" style="position:absolute;left:8%;right:8%;top:50%;height:16px;margin-top:-8px;background:{RED};'
         f'box-shadow:0 0 18px rgba(255,60,80,.7);transform-origin:0% 50%"></div></div>')
    j = f'tl.fromTo("#{cid}", {{ opacity: 0, scale: .9 }}, {{ opacity: 1, scale: 1, duration: .3 }}, {t});'
    j += f'tl.fromTo("#{cid}-x", {{ scaleX: 0, scaleY: 1, rotation: -4 }}, {{ scaleX: 1, scaleY: 1, rotation: -4, duration: .25 }}, {cross});'
    j += f'tl.to("#{cid}", {{ opacity: .45, duration: .3 }}, {round(cross + .45, 2)});'
    return b, j


def g(span, color=PINK):
    return f"<span style='color:{color}'>{span}</span>"


def s1():
    sc = "s1-gancho"
    l1 = lbl2("s1-l1", "⚠️ SPOILERS DO MANGÁ", 60, 220, .2, RED, 32, out=at(sc, "fica", -.2))
    a = big("s1-a", f"2 FRUTAS<br>= {g('MORTE ☠️', RED)}", 330, at(sc, "duas0", -.1), 96, out=at(sc, "pirata", -.3))
    b = big("s1-b", f"MAS ELE TEM<br>{g('2 PODERES')}", 330, at(sc, "pirata", -.1), 96, out=at(sc, "ninguem", -.3))
    c = big("s1-c", f"{g('???', YELLOW)}", 300, at(sc, "ninguem", -.1), 190, out=at(sc, "fica", -.25))
    d = lbl2("s1-l2", "👀 AS PISTAS NO FINAL", 60, 300, at(sc, "fica"), YELLOW, 34)
    ov(sc, l1[0] + a[0] + b[0] + c[0] + d[0], l1[1] + a[1] + b[1] + c[1] + d[1])


def s2():
    sc = "s2-navio"
    l1 = lbl2("s2-l1", "⏳ DÉCADAS ESPERANDO 1 FRUTA", 50, 260, at(sc, "decadas", -.1), YELLOW, 32, out=at(sc, "escuridao", -.3))
    b = big("s2-b", f"🌑 A FRUTA DA<br>{g('ESCURIDÃO')}", 320, at(sc, "escuridao", -.2), 84, out=at(sc, "matou", -.3))
    l2 = lbl2("s2-l2", "🗡️ TRAIU O PRÓPRIO COMPANHEIRO", 50, 260, at(sc, "matou", -.1), RED, 32)
    ov(sc, l1[0] + b[0] + l2[0], l1[1] + b[1] + l2[1])


def s3():
    sc = "s3-guerra"
    l1 = lbl2("s3-l1", "⚔️ GUERRA DE MARINEFORD", 60, 240, at(sc, "guerra", -.1), YELLOW, 34, out=at(sc, "tripulacao", -.3))
    b = big("s3-b", "MORREU<br>DE PÉ", 310, at(sc, "morreu", -.1), 110, out=at(sc, "cobriu", -.4))
    l2 = lbl2("s3-l2", "🏴 UM PANO PRETO ENORME…", 60, 240, at(sc, "cobriu", -.2), PINK, 34, out=at(sc, "caiu", -.1))
    c = big("s3-c", f"O PODER DOS<br>{g('TERREMOTOS', CYAN)} 🌊", 320, at(sc, "tinha", -.1), 84)
    sh = f'tl.fromTo("#s3-c", {{ x: 0 }}, {{ x: 10, duration: .05, repeat: 9, yoyo: true, ease: "none", immediateRender: false }}, {at(sc, "terremotos")});'
    ov(sc, l1[0] + b[0] + l2[0] + c[0], l1[1] + b[1] + l2[1] + c[1] + sh)


def s4():
    sc = "s4-comeu"
    b = xq("s4-q", "COMEU OUTRA<br>FRUTA? 🍎", at(sc, "comeu", -.3), at(sc, "nao3"), top=290, size=100)
    ov(sc, b[0], b[1])


def s5():
    sc = "s5-sorte"
    b = xq("s5-q", "FOI SORTE? 🍀", at(sc, "sorte", -.3), at(sc, "tambem4"), top=290, size=100)
    l1 = lbl2("s5-l1", "⚠️ O CORPO DELE NÃO É NORMAL", 50, 520, at(sc, "corpo4", -.2), RED, 32)
    ov(sc, b[0] + l1[0], b[1] + l1[1])


def s6():
    sc = "s6-keys"
    body = f'''<div id="s6-card" class="card" style="top:250px;z-index:7;opacity:0;border-left-color:{CYAN}"><div class="nm" style="font-size:70px">🎮 KEYS ALEATÓRIAS</div>
      <div class="sub" style="font-size:36px;color:#fff">DA STEAM · BEM BARATAS</div>
      <div class="sub" style="font-size:40px;color:{YELLOW};margin-top:14px">👆 LINK NA BIO</div></div>'''
    js = f'''tl.fromTo("#s6-card", {{ opacity: 0, y: -30, scale: .92 }}, {{ opacity: 1, y: 0, scale: 1, duration: .35, ease: "back.out(1.6)" }}, {at(sc, "rapidinho", -.1)});
      tl.fromTo("#s6-card", {{ scale: 1 }}, {{ scale: 1.05, duration: .18, yoyo: true, repeat: 1, immediateRender: false }}, {at(sc, "bio")});
      tl.to("#s6-card", {{ opacity: 0, duration: .3 }}, {at(sc, "pistas5", -.6)});'''
    l1 = lbl2("s6-l1", "🔎 AGORA, AS PISTAS", 60, 300, at(sc, "pistas5", -.4), YELLOW, 36)
    ov(sc, body + l1[0], js + l1[1])


def s7():
    sc = "s7-pistas"
    a = big("s7-a", f"PISTA {g('1', YELLOW)}", 260, at(sc, "pista1", -.1), 96, out=at(sc, "pista2", -.3))
    l1 = lbl2("s7-l1", "😳 ELE NUNCA DORME", 60, 400, at(sc, "dorme", -.2), YELLOW, 36, out=at(sc, "pista2", -.3))
    b = big("s7-b", f"PISTA {g('2', YELLOW)}", 260, at(sc, "pista2", -.1), 96)
    l2 = lbl2("s7-l2", "🌑 ANULA OUTROS PODERES", 60, 400, at(sc, "anula", -.2), PINK, 36)
    ov(sc, a[0] + l1[0] + b[0] + l2[0], a[1] + l1[1] + b[1] + l2[1])


def s8():
    sc = "s8-teorias"
    l1 = lbl2("s8-l1", "🧠 TEORIAS DOS FÃS", 60, 230, at(sc, "teorias", -.4), YELLOW, 34)
    a = big("s8-a", f"1️⃣ MAIS DE<br>{g('UMA ALMA')}", 320, at(sc, "primeira", -.1), 88, out=at(sc, "segunda7", -.3))
    b = big("s8-b", f"2️⃣ LINHAGEM<br>{g('RARA', YELLOW)}", 320, at(sc, "segunda7", -.1), 88)
    ov(sc, l1[0] + a[0] + b[0], l1[1] + a[1] + b[1])


def s9():
    sc = "s9-unico"
    a = big("s9-a", "A SÉRIE AINDA<br>NÃO MOSTROU", 310, at(sc, "resposta", -.1), 84, out=at(sc, "unico", -.3))
    b = big("s9-b", f"O {g('ÚNICO', YELLOW)}<br>DA HISTÓRIA", 310, at(sc, "unico", -.1), 92, out=at(sc, "talvez", -.3))
    c = big("s9-c", f"…E TALVEZ<br>NÃO PARE EM {g('2')} 😈", 310, at(sc, "talvez", -.1), 80)
    ov(sc, a[0] + b[0] + c[0], a[1] + b[1] + c[1])


def s10():
    sc = "s10-pergunta"
    b = big("s10-q", f"QUAL É O<br>{g('SEGREDO')} DELE?", 290, at(sc, "voce", -.1), 104)
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
    return [("whoosh.mp3", 0.15, .25), ("mar.wav", 0.0, .22), ("impact-bass-2.mp3", k["morre"] - .1, .4), ("error.mp3", k["excecao"], .25),
            ("sparkle.mp3", k["poderes"], .35), ("glitch-1.mp3", k["ninguem"], .25), ("previsao.wav", k["fica"], .3),
            ("whoosh.mp3", PSTART[1] - .1, .25), ("nhec.wav", PSTART[1] + .2, .3), ("toc.wav", k["decadas"] + .2, .3), ("toc.wav", k["decadas"] + .7, .3),
            ("sparkle.mp3", k["escuridao"], .35), ("impact-bass-1.mp3", k["matou"], .4),
            ("explosao.wav", PSTART[2] - .1, .35), ("explosao.wav", k["guerra"] + 1.2, .3), ("coracao.wav", k["morreu"] - .2, .35), ("whoosh.mp3", k["cobriu"] - .1, .35),
            ("whoosh-short.mp3", k["caiu"] - .2, .35), ("tremor.wav", k["terremotos"] - .3, .55), ("impact-bass-2.mp3", k["terremotos"], .45),
            ("whoosh.mp3", PSTART[3] - .1, .25), ("error.mp3", k["nao3"], .35),
            ("ping.mp3", k["sorte"] - .2, .3), ("error.mp3", k["tambem4"], .35), ("zap.wav", k["corpo4"] - .2, .35), ("glitch-1.mp3", k["normal"], .3),
            ("notification.mp3", k["rapidinho"], .35), ("moedas.wav", k["steam"], .3), ("pop.mp3", k["bio"], .3),
            ("whoosh.mp3", k["pistas5"] - .2, .25), ("carimbo.wav", k["pista1"], .4), ("toc.wav", k["nunca"] - .4, .25), ("toc.wav", k["nunca"] + .1, .25),
            ("carimbo.wav", k["pista2"], .4), ("apagar.wav", k["anula"], .35),
            ("whoosh.mp3", PSTART[7] - .1, .25), ("sparkle.mp3", k["primeira"], .3), ("previsao.wav", k["alma"], .3), ("sparkle.mp3", k["linhagem"], .35),
            ("impact-bass-1.mp3", k["resposta"], .3), ("impact-bass-2.mp3", k["unico"], .4), ("sparkle.mp3", k["talvez"], .35),
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
        f'      <audio id="trilha" class="clip" src="{MUSIC}" data-start="0" data-duration="{TOTAL}" data-volume="0.27" data-fade-out="2" data-track-index="5"></audio>',
    ]
    lanes = []
    for i, (f, st, vol) in enumerate(sfx_list()):
        st = round(max(0, st), 2)
        d = round(min(dur(os.path.join(ROOT, "assets/sfx", f)), TOTAL - st, 8.0 if f in ("mar.wav",) else 3.0), 2)
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
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #08060e; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
      #c3d {{ position: absolute; inset: 0; width: 1080px; height: 1920px; z-index: 0; }}
      .fontwarm {{ position: absolute; left: -9999px; top: 0; }}
    </style>
  </head>
  <body>
    <!-- Por que o Barba Negra tem duas Akumas no Mi? — 3D (gerado por tools/build_barba.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920" data-layout-allow-overflow></canvas>
      <div class="fontwarm" data-layout-allow-overflow><span style="font-family:'Space Mono';font-weight:700">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/barba3d.js"></script>
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
        json.dump({"id": "barba", "name": "Por que o Barba Negra tem duas Akumas no Mi? (3D)", "createdAt": "2026-11-09T19:20:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, "war", round(PSTART[2], 2), "end", round(PSTART[8], 2))
    for n, s, e in SCENES:
        print(f"  {n:15s} {s:6.2f} → {e:6.2f}  ({e - s:.1f}s)")
