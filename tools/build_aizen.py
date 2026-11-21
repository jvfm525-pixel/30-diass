"""Gera o vídeo 3D de curiosidade "Por que o Aizen deixou o Ichigo ficar mais forte em vez de matá-lo?" em aizen/.

Estilo xadrez 3D: tabuleiro de mármore no deserto branco, sob a lua; peças gigantes e fios de luz.
O 3D (Three.js) fica em aizen/assets/aizen3d.js e é desenhado a partir do tempo. Personagens
originais (nada desenhado da série; os nomes aparecem só como texto e narração). Este script gera
os tempos-chave, os textos por cena, as legendas e a raiz com voz, trilha e efeitos.
Uso: python3 tools/build_aizen.py
"""
import base64
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "aizen")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-aizen.wav"
MUSIC = "assets/music/trilha-aizen.wav"
CYAN, PINK, RED, GREEN, YELLOW = "#7af0ff", "#b48aff", "#ff4d6d", "#4dffa6", "#e8c46a"
CRIM = "#e8c46a"  # destaque das legendas (dourado)

PARS = [
    "O Aizen podia ter matado o Ichigo|com um dedo.|Literalmente.|Mas deixou ele viver…|e ficar cada vez mais forte.|Por quê?|Fica até o final,|porque o motivo é bem mais sinistro|do que parece.",
    "No fim da Soul Society,|o Ichigo atacou com tudo.|O Aizen parou a espada dele|com um dedo…|e derrubou ele com um corte só.|Bastava mais um golpe.|Mas ele foi embora.",
    "Mais tarde, ele confessou:|observava o Ichigo|desde que ele nasceu.|Cada inimigo,|cada treino,|cada luta…|fazia parte do plano.",
    "Rapidinho:|tem keys aleatórias da Steam|bem baratas no link da minha bio.|Agora, a parte mais sinistra.",
    "Anos antes,|um Hollow criado pelo Aizen|em laboratório|atacou a mãe do Ichigo.|E esse poder passou pro filho.|Ou seja:|até parte do poder do Ichigo|nasceu de um experimento do Aizen.",
    "Pra ele,|o Ichigo era o experimento mais valioso.|Matar ele cedo|seria jogar fora o próprio plano.",
    "Mas quando o Ichigo finalmente venceu,|ele sentiu uma coisa|na espada do Aizen:|solidão.|Por isso, muitos fãs acham|que, no fundo,|o Aizen só queria|alguém à altura dele.",
    "E no fim,|contra o vilão final,|foi o próprio Aizen|quem abriu o caminho|pro Ichigo vencer.",
    "E pra você:|qual era o verdadeiro plano do Aizen?|Comenta aqui.",
]
FIX = {"itigo": ["ichigo"], "sol": ["soul"], "holo": ["hollow"], "para": ["pra"], "eno": ["e", "no"], "epara": ["e", "pra"], "isaleatorias": ["aleatorias"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-gancho", "s2-dedo", "s3-plano", "s4-keys", "s5-lab", "s6-experimento", "s7-solidao", "s8-final", "s9-pergunta"]
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
    "aizen0": W(0, "aizen"), "matado": W(0, "matado"), "dedo0": W(0, "dedo"), "literalmente": W(0, "literalmente"), "deixou": W(0, "deixou"),
    "forte": W(0, "forte"), "porque0": W(0, "por"), "fica": W(0, "fica", 1),  # o 1º "fica" é o começo de "ficar" "sinistro0": W(0, "sinistro"),
    "soul": W(1, "soul"), "atacou1": W(1, "atacou"), "parou": W(1, "parou"), "dedo1": W(1, "dedo"), "derrubou": W(1, "derrubou"), "corte": W(1, "corte"),
    "bastava": W(1, "bastava"), "golpe": W(1, "golpe"), "embora": W(1, "embora"),
    "confessou": W(2, "confessou"), "observava": W(2, "observava"), "nasceu": W(2, "nasceu"), "inimigo": W(2, "inimigo"), "treino": W(2, "treino"),
    "luta": W(2, "luta"), "plano2": W(2, "plano"),
    "rapidinho": W(3, "rapidinho"), "steam": W(3, "steam"), "bio": W(3, "bio"), "sinistra": W(3, "sinistra"),
    "anos": W(4, "anos"), "hollow": W(4, "hollow"), "laboratorio": W(4, "laboratorio"), "atacou4": W(4, "atacou"), "mae": W(4, "mae"), "passou": W(4, "passou"),
    "filho": W(4, "filho"), "seja": W(4, "seja"), "nasceu4": W(4, "nasceu"), "experimento4": W(4, "experimento"),
    "valioso": W(5, "valioso"), "matar": W(5, "matar"), "jogar": W(5, "jogar"), "plano5": W(5, "plano"),
    "venceu": W(6, "venceu"), "sentiu": W(6, "sentiu"), "espada6": W(6, "espada"), "solidao": W(6, "solidao"), "fas": W(6, "fas"), "fundo": W(6, "fundo"),
    "queria": W(6, "queria"), "altura": W(6, "altura"),
    "fim7": W(7, "fim"), "vilao": W(7, "vilao"), "proprio7": W(7, "proprio"), "abriu": W(7, "abriu"), "vencer": W(7, "vencer"),
    "voce": W(8, "voce"), "verdadeiro": W(8, "verdadeiro"), "comenta": W(8, "comenta"),
}


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


FONTE = base64.b64encode(open(os.path.join(ROOT, "assets/fonts/cinzel-900.woff2"), "rb").read()).decode()  # Cinzel embutida (fora da lista automática de fontes)
CSS = f'''@font-face {{ font-family:'Cinzel'; font-weight:900; font-style:normal; src:url(data:font/woff2;base64,{FONTE}) format('woff2'); }}
  #root {{ background: transparent; }}
  .lbl {{ position:absolute; font-family:'Space Mono',monospace; font-weight:700; color:#fff; letter-spacing:.06em; text-transform:uppercase;
    background:rgba(10,6,22,.85); border-left:8px solid {PINK}; padding:10px 22px; font-size:36px; }}
  .big {{ position:absolute; left:0; right:0; text-align:center; font-family:'Cinzel','Archivo Black',serif; font-weight:900; color:#fff; letter-spacing:.03em; line-height:1.08;
    text-shadow:0 0 22px rgba(180,138,255,.45), 0 6px 24px rgba(0,0,0,.85); }}
  .card {{ position:absolute; left:70px; right:70px; padding:22px 30px 24px; background:linear-gradient(135deg, rgba(20,10,40,.9), rgba(10,6,22,.9));
    border:3px solid rgba(232,196,106,.55); border-radius:6px; box-shadow:0 0 40px rgba(180,138,255,.25); }}
  .card .nm {{ font-family:'Cinzel','Archivo Black',serif; font-weight:900; font-size:92px; color:#fff; line-height:1; letter-spacing:.02em; }}
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
    a = big("s1-a", f"COM {g('UM DEDO', YELLOW)} ☝️", 320, at(sc, "dedo0", -.2), 110, out=at(sc, "deixou", -.3))
    b = big("s1-b", f"…E DEIXOU ELE<br>FICAR {g('MAIS FORTE', YELLOW)}", 320, at(sc, "deixou", -.1), 80, out=at(sc, "porque0", -.3))
    c = big("s1-c", f"POR {g('QUÊ?', YELLOW)}", 330, at(sc, "porque0", -.1), 140, out=at(sc, "fica", -.25))
    d = lbl2("s1-l2", "👀 O MOTIVO É SINISTRO", 60, 560, at(sc, "fica"), PINK, 34)
    ov(sc, l1[0] + a[0] + b[0] + c[0] + d[0], l1[1] + a[1] + b[1] + c[1] + d[1])


def s2():
    sc = "s2-dedo"
    l1 = lbl2("s2-l1", "⚔️ FIM DA SOUL SOCIETY", 60, 240, at(sc, "soul", -.3), YELLOW, 34, out=at(sc, "parou", -.3))
    a = big("s2-a", f"PAROU A ESPADA<br>COM {g('UM DEDO', YELLOW)} ☝️", 300, at(sc, "parou", -.1), 84, out=at(sc, "derrubou", -.2))
    b = big("s2-b", f"{g('1', YELLOW)} CORTE", 310, at(sc, "corte", -.2), 130, out=at(sc, "bastava", -.2))
    l2 = lbl2("s2-l2", "🗡️ BASTAVA MAIS UM GOLPE…", 50, 300, at(sc, "bastava", -.1), RED, 32, out=at(sc, "embora", -.25))
    c = big("s2-c", f"…E FOI {g('EMBORA', YELLOW)} 🚶", 310, at(sc, "embora", -.15), 92)
    ov(sc, l1[0] + a[0] + b[0] + l2[0] + c[0], l1[1] + a[1] + b[1] + l2[1] + c[1])


def s3():
    sc = "s3-plano"
    l1 = lbl2("s3-l1", "♟️ ELE CONFESSOU", 60, 230, at(sc, "confessou", -.3), PINK, 34)
    a = big("s3-a", f"OBSERVAVA DESDE<br>O {g('NASCIMENTO', YELLOW)} 👁️", 310, at(sc, "observava", -.1), 80, out=at(sc, "inimigo", -.3))
    i1 = lbl2("s3-i1", "✔️ CADA INIMIGO", 70, 330, at(sc, "inimigo", -.1), YELLOW, 40, out=at(sc, "plano2", -.6))
    i2 = lbl2("s3-i2", "✔️ CADA TREINO", 70, 420, at(sc, "treino", -.1), YELLOW, 40, out=at(sc, "plano2", -.6))
    i3 = lbl2("s3-i3", "✔️ CADA LUTA", 70, 510, at(sc, "luta", -.1), YELLOW, 40, out=at(sc, "plano2", -.6))
    b = big("s3-b", f"TUDO ERA<br>{g('PARTE DO PLANO', YELLOW)}", 330, at(sc, "plano2", -.4), 80)
    ov(sc, l1[0] + a[0] + i1[0] + i2[0] + i3[0] + b[0], l1[1] + a[1] + i1[1] + i2[1] + i3[1] + b[1])


def s4():
    sc = "s4-keys"
    body = f'''<div id="s4-card" class="card" style="top:250px;z-index:7;opacity:0"><div class="nm" style="font-size:66px">🎮 KEYS ALEATÓRIAS</div>
      <div class="sub" style="font-size:36px;color:#d8ccff">DA STEAM · BEM BARATAS</div>
      <div class="sub" style="font-size:40px;color:{YELLOW};margin-top:14px">👆 LINK NA MINHA BIO</div></div>'''
    js = f'''tl.fromTo("#s4-card", {{ opacity: 0, y: -30, scale: .92 }}, {{ opacity: 1, y: 0, scale: 1, duration: .35, ease: "back.out(1.6)" }}, {at(sc, "rapidinho", -.1)});
      tl.fromTo("#s4-card", {{ scale: 1 }}, {{ scale: 1.05, duration: .18, yoyo: true, repeat: 1, immediateRender: false }}, {at(sc, "bio")});
      tl.to("#s4-card", {{ opacity: 0, duration: .3 }}, {at(sc, "sinistra", -.9)});'''
    l1 = lbl2("s4-l1", "🧪 AGORA, A PARTE MAIS SINISTRA", 50, 300, at(sc, "sinistra", -.7), PINK, 32)
    ov(sc, body + l1[0], js + l1[1])


def s5():
    sc = "s5-lab"
    l1 = lbl2("s5-l1", "🧪 UM HOLLOW CRIADO EM LABORATÓRIO", 30, 240, at(sc, "hollow", -.2), PINK, 30, out=at(sc, "atacou4", -.3))
    a = big("s5-a", f"ATACOU A MÃE<br>DO {g('ICHIGO', YELLOW)}", 300, at(sc, "atacou4", -.1), 92, out=at(sc, "passou", -.3))
    b = big("s5-b", f"O PODER PASSOU<br>PRO {g('FILHO', YELLOW)} 👶", 300, at(sc, "passou", -.1), 84, out=at(sc, "seja", -.2))
    c = big("s5-c", f"UM {g('EXPERIMENTO', YELLOW)}<br>DO AIZEN 🧬", 300, at(sc, "nasceu4", -.3), 84)
    ov(sc, l1[0] + a[0] + b[0] + c[0], l1[1] + a[1] + b[1] + c[1])


def s6():
    sc = "s6-experimento"
    a = big("s6-a", f"O EXPERIMENTO<br>{g('MAIS VALIOSO', YELLOW)} 💎", 300, at(sc, "valioso", -.4), 84, out=at(sc, "matar", -.3))
    l1 = lbl2("s6-l1", "❌ MATAR CEDO = PERDER O PLANO", 50, 300, at(sc, "matar", -.1), RED, 32)
    ov(sc, a[0] + l1[0], a[1] + l1[1])


def s7():
    sc = "s7-solidao"
    l1 = lbl2("s7-l1", "🏆 QUANDO O ICHIGO VENCEU…", 50, 240, at(sc, "venceu", -.3), YELLOW, 32, out=at(sc, "solidao", -.3))
    a = big("s7-a", g('SOLIDÃO', "#d8ccff"), 330, at(sc, "solidao", -.1), 130, out=at(sc, "fas", -.3))
    l2 = lbl2("s7-l2", "🧠 TEORIA DOS FÃS", 60, 240, at(sc, "fas", -.3), PINK, 34)
    b = big("s7-b", f"ALGUÉM À<br>{g('ALTURA DELE', YELLOW)}", 320, at(sc, "queria", -.2), 96)
    ov(sc, l1[0] + a[0] + l2[0] + b[0], l1[1] + a[1] + l2[1] + b[1])


def s8():
    sc = "s8-final"
    a = big("s8-a", f"CONTRA O<br>{g('VILÃO FINAL', YELLOW)}…", 300, at(sc, "vilao", -.3), 92, out=at(sc, "proprio7", -.3))
    b = big("s8-b", f"FOI O AIZEN QUEM<br>{g('ABRIU O CAMINHO', YELLOW)}", 300, at(sc, "proprio7", -.1), 72)
    ov(sc, a[0] + b[0], a[1] + b[1])


def s9():
    sc = "s9-pergunta"
    b = big("s9-q", f"QUAL ERA O<br>{g('VERDADEIRO', YELLOW)}<br>PLANO DELE?", 280, at(sc, "voce", -.1), 92)
    body = f'''<div class="big" id="s9-c" style="top:1680px;font-family:'Space Mono';font-weight:700;font-size:56px;opacity:0">COMENTA 👇</div>'''
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
            js.append(f'tl.fromTo("#cw{gi}-{j}", {{ color: "#ffffff" }}, {{ color: "{CRIM}", duration: .05, immediateRender: false }}, {w[4]:.2f});')
    css = '''#root { background: transparent; }
      .cg { position:absolute; left:90px; right:150px; top:1240px; text-align:center; }
      .cbox { display:inline-block; padding:8px 18px; background:rgba(8,6,16,.62); font-family:Montserrat; font-weight:800; font-size:50px; line-height:1.15; color:#fff;
        text-transform:uppercase; text-shadow:0 3px 10px rgba(0,0,0,.9); max-width:840px; }'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


def sfx_list():
    k = KEYS
    return [("whoosh.mp3", 0.15, .25), ("toc.wav", k["aizen0"], .3), ("dedo.wav", k["dedo0"], .45), ("impact-bass-1.mp3", k["literalmente"], .35),
            ("sparkle.mp3", k["forte"] - .2, .35), ("glitch-1.mp3", k["porque0"], .3), ("previsao.wav", k["fica"], .3),
            ("whoosh.mp3", PSTART[1] - .1, .25), ("corte.wav", k["atacou1"], .4), ("dedo.wav", k["dedo1"], .5), ("corte.wav", k["corte"] - .1, .5),
            ("impact-bass-2.mp3", k["corte"] + .1, .4), ("coracao.wav", k["bastava"], .3), ("toc.wav", k["embora"], .25), ("toc.wav", k["embora"] + .45, .25),
            ("whoosh.mp3", PSTART[2] - .1, .25), ("previsao.wav", k["observava"], .3), ("toc.wav", k["inimigo"], .4), ("toc.wav", k["treino"], .4), ("toc.wav", k["luta"], .4),
            ("impact-bass-1.mp3", k["plano2"], .35),
            ("notification.mp3", k["rapidinho"], .35), ("moedas.wav", k["steam"], .3), ("pop.mp3", k["bio"], .3), ("whoosh.mp3", k["sinistra"] - .3, .25),
            ("zumbido-geladeira.wav", PSTART[4], .25), ("vidro.wav", k["atacou4"] - .2, .45), ("impact-bass-2.mp3", k["mae"], .35), ("sparkle.mp3", k["filho"] - .2, .35),
            ("glitch-1.mp3", k["experimento4"], .3),
            ("whoosh.mp3", PSTART[5] - .1, .25), ("sparkle.mp3", k["valioso"], .35), ("error.mp3", k["matar"], .3),
            ("corte.wav", k["venceu"] - .3, .45), ("explosao.wav", k["venceu"], .3), ("previsao.wav", k["solidao"] - .1, .35), ("coracao.wav", k["fas"], .25),
            ("whoosh.mp3", PSTART[7] - .1, .25), ("vidro.wav", k["proprio7"] - .2, .4), ("corte.wav", k["abriu"], .45), ("impact-bass-2.mp3", k["vencer"], .4),
            ("whoosh-short.mp3", k["voce"] - .2, .3), ("toc.wav", k["verdadeiro"], .3), ("pop.mp3", k["comenta"], .3)]


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
        d = round(min(dur(os.path.join(ROOT, "assets/sfx", f)), TOTAL - st, 8.0 if f in ("mar.wav", "chuva.wav") else 3.0), 2)
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
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #07060c; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
      #c3d {{ position: absolute; inset: 0; width: 1080px; height: 1920px; z-index: 0; }}
      .fontwarm {{ position: absolute; left: -9999px; top: 0; }}
    </style>
  </head>
  <body>
    <!-- Por que o Aizen deixou o Ichigo ficar mais forte? — xadrez 3D (gerado por tools/build_aizen.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920" data-layout-allow-overflow></canvas>
      <div class="fontwarm" data-layout-allow-overflow><span style="font-family:'Space Mono';font-weight:700">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/aizen3d.js"></script>
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
        json.dump({"id": "aizen", "name": "Por que o Aizen deixou o Ichigo ficar mais forte? (xadrez 3D)", "createdAt": "2026-11-10T23:30:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, "keys", round(PSTART[3], 2), "solidao", round(PSTART[6], 2))
    for n, s, e in SCENES:
        print(f"  {n:15s} {s:6.2f} → {e:6.2f}  ({e - s:.1f}s)")
