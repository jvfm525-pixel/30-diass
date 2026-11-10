"""Gera o vídeo 3D de curiosidade "Por que o Shanks nunca foi atrás do One Piece antes do Luffy?" em shanks/.

O 3D (Three.js) fica em shanks/assets/shanks3d.js e é desenhado a partir do tempo.
Personagens originais animados (nada desenhado da série; os nomes aparecem só
como texto e narração). Este script gera os tempos-chave, os textos por cena,
as legendas e a raiz com voz, trilha e efeitos.
Uso: python3 tools/build_shanks.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "shanks")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-shanks.wav"
MUSIC = "assets/music/trilha-shanks.wav"
CYAN, PINK, RED, GREEN, YELLOW = "#7af0ff", "#ff7a66", "#ff4d4d", "#4dffa6", "#ffd27a"
CRIM = "#ff8a76"  # destaque das legendas (vermelho do cabelo)

PARS = [
    "O Shanks navegou com o Rei dos Piratas|e é um dos homens mais fortes do mundo.|Mas por mais de vinte anos…|nunca foi atrás do One Piece.|Por quê?|Fica até o final,|porque a última pista é a mais estranha.",
    "Medo?|Não.|Ele é um Imperador:|acabou uma guerra só aparecendo…|e fez um almirante recuar|sem encostar nele.",
    "Ele já sabia o caminho?|Também não.|Antes da viagem pra última ilha,|o Buggy pegou febre…|e o Shanks ficou pra trás|cuidando dele.|Nunca pisou lá.",
    "Ele trabalha pro Governo?|Muita gente achou,|porque um homem igualzinho a ele|visitou os Cinco Anciões.|Mas o autor confirmou:|não era ele.|Era o irmão gêmeo,|o Shamrock.",
    "Rapidinho:|tem keys aleatórias da Steam|bem baratas no link da bio.|Agora, as pistas.",
    "Pista 1:|quando o Roger chegou na ilha do tesouro,|ele riu…|e disse que tinham chegado|cedo demais.",
    "Pista 2:|anos depois,|o Shanks deu o chapéu do Roger pro Luffy,|perdeu o braço salvando ele…|e disse que apostou o braço|na nova era.",
    "Pista 3:|ele só falou|“chegou a hora de pegar o One Piece”|depois que o Luffy|derrotou o Kaido.",
    "Ou seja:|ele não estava parado.|Estava esperando.|A pessoa certa,|na hora certa.",
    "Mas tem um detalhe:|o Roger achou o Shanks bebê,|dentro de um baú do tesouro…|e hoje a gente sabe|que ele nasceu numa família|de Dragões Celestiais.|Por isso, muitos fãs acham|que ele tem um plano só dele.",
    "E pra você:|por que o Shanks esperou tanto?|Comenta aqui.",
]
FIX = {"20": ["vinte"], "para": ["pra"], "bug": ["buggy"], "5": ["cinco"], "ansioes": ["ancioes"], "quiz": ["keys"],
       "unpeace": ["one", "piece"], "kaidou": ["kaido"], "epara": ["e", "pra"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-gancho", "s2-medo", "s3-caminho", "s4-governo", "s5-keys", "s6-pista1", "s7-pista2", "s8-pista3", "s9-resposta", "s10-detalhe", "s11-pergunta"]
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
    "rei": W(0, "rei"), "fortes": W(0, "fortes"), "vinte": W(0, "vinte"), "nunca0": W(0, "nunca"), "piece0": W(0, "piece"), "porque0": W(0, "por", 1),
    "fica": W(0, "fica"), "estranha": W(0, "estranha"),
    "medo": W(1, "medo"), "nao1": W(1, "nao"), "imperador": W(1, "imperador"), "guerra": W(1, "guerra"), "aparecendo": W(1, "aparecendo"),
    "almirante": W(1, "almirante"), "recuar": W(1, "recuar"), "encostar": W(1, "encostar"),
    "caminho": W(2, "caminho"), "tambem2": W(2, "tambem"), "viagem": W(2, "viagem"), "buggy": W(2, "buggy"), "febre": W(2, "febre"),
    "ficou": W(2, "ficou"), "cuidando": W(2, "cuidando"), "nunca2": W(2, "nunca"), "pisou": W(2, "pisou"),
    "governo": W(3, "governo"), "achou": W(3, "achou"), "homem": W(3, "homem"), "igualzinho": W(3, "igualzinho"), "visitou": W(3, "visitou"),
    "ancioes": W(3, "ancioes"), "autor": W(3, "autor"), "naoera": W(3, "nao"), "irmao": W(3, "irmao"), "gemeo": W(3, "gemeo"), "shamrock": W(3, "shamrock"),
    "rapidinho": W(4, "rapidinho"), "keys": W(4, "keys"), "steam": W(4, "steam"), "bio": W(4, "bio"), "pistas4": W(4, "pistas"),
    "pista1": W(5, "pista"), "roger5": W(5, "roger"), "ilha5": W(5, "ilha"), "tesouro5": W(5, "tesouro"), "riu": W(5, "riu"), "disse5": W(5, "disse"),
    "cedo": W(5, "cedo"), "demais": W(5, "demais"),
    "pista2": W(6, "pista"), "anos": W(6, "anos"), "chapeu": W(6, "chapeu"), "luffy6": W(6, "luffy"), "perdeu": W(6, "perdeu"), "braco": W(6, "braco"),
    "salvando": W(6, "salvando"), "apostou": W(6, "apostou"), "nova": W(6, "nova"), "era6": W(6, "era"),
    "pista3": W(7, "pista"), "falou": W(7, "falou"), "chegou7": W(7, "chegou"), "pegar": W(7, "pegar"), "piece7": W(7, "piece"), "luffy7": W(7, "luffy"),
    "derrotou": W(7, "derrotou"), "kaido": W(7, "kaido"),
    "ouseja": W(8, "ou"), "parado": W(8, "parado"), "esperando": W(8, "esperando"), "pessoa": W(8, "pessoa"), "certa": W(8, "certa"), "hora8": W(8, "hora"),
    "detalhe": W(9, "detalhe"), "achou9": W(9, "achou"), "bebe": W(9, "bebe"), "bau": W(9, "bau"), "tesouro9": W(9, "tesouro"), "hoje": W(9, "hoje"),
    "nasceu": W(9, "nasceu"), "familia": W(9, "familia"), "dragoes": W(9, "dragoes"), "celestiais": W(9, "celestiais"), "fas": W(9, "fas"), "plano": W(9, "plano"),
    "voce": W(10, "voce"), "esperou": W(10, "esperou"), "tanto": W(10, "tanto"), "comenta": W(10, "comenta"),
}


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


CSS = f'''#root {{ background: transparent; }}
  .lbl {{ position:absolute; font-family:'Space Mono',monospace; font-weight:700; color:#fff; letter-spacing:.06em; text-transform:uppercase;
    background:rgba(8,6,18,.88); border-left:8px solid {PINK}; padding:10px 22px; font-size:36px; }}
  .big {{ position:absolute; left:0; right:0; text-align:center; font-family:'Archivo Black'; color:#fff; letter-spacing:.02em; line-height:1.05;
    text-shadow:0 0 22px rgba(255,120,100,.35), 0 6px 24px rgba(0,0,0,.85); }}
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
    l2 = lbl2("s1-l2", "🏴‍☠️ NAVEGOU COM O REI DOS PIRATAS", 50, 300, at(sc, "rei", -.2), YELLOW, 30, out=at(sc, "vinte", -.3))
    a = big("s1-a", f"{g('+20 ANOS', YELLOW)}", 300, at(sc, "vinte", -.1), 130, out=at(sc, "porque0", -.3))
    b = big("s1-b", "SEM IR ATRÁS DO<br>ONE PIECE", 460, at(sc, "nunca0", -.1), 74, out=at(sc, "porque0", -.3))
    c = big("s1-c", f"POR {g('QUÊ?', YELLOW)}", 320, at(sc, "porque0", -.1), 150, out=at(sc, "fica", -.25))
    d = lbl2("s1-l3", "👀 A ÚLTIMA PISTA É A MAIS ESTRANHA", 40, 300, at(sc, "fica"), YELLOW, 30)
    ov(sc, l1[0] + l2[0] + a[0] + b[0] + c[0] + d[0], l1[1] + l2[1] + a[1] + b[1] + c[1] + d[1])


def s2():
    sc = "s2-medo"
    q = xq("s2-q", "MEDO? 😨", at(sc, "medo", -.3), at(sc, "nao1"), top=290, size=110)
    l1 = lbl2("s2-l1", "👑 UM DOS QUATRO IMPERADORES", 50, 470, at(sc, "imperador", -.2), YELLOW, 32, out=at(sc, "guerra", -.3))
    l2 = lbl2("s2-l2", "⚔️ ACABOU UMA GUERRA SÓ CHEGANDO", 50, 470, at(sc, "guerra", -.2), PINK, 32, out=at(sc, "almirante", -.3))
    l3 = lbl2("s2-l3", "😰 UM ALMIRANTE RECUOU SEM LUTAR", 50, 470, at(sc, "almirante", -.2), RED, 32)
    ov(sc, q[0] + l1[0] + l2[0] + l3[0], q[1] + l1[1] + l2[1] + l3[1])


def s3():
    sc = "s3-caminho"
    q = xq("s3-q", "JÁ SABIA<br>O CAMINHO? 🧭", at(sc, "caminho", -.3), at(sc, "tambem2"), top=270, size=96)
    fade = f'tl.to("#s3-q", {{ opacity: 0, duration: .35 }}, {at(sc, "viagem", .2)});'
    l1 = lbl2("s3-l1", "🤒 O BUGGY PEGOU FEBRE…", 50, 300, at(sc, "buggy", -.2), YELLOW, 32, out=at(sc, "nunca2", -.3))
    l2 = lbl2("s3-l2", "🛏️ …E ELE FICOU CUIDANDO", 50, 380, at(sc, "ficou", -.2), PINK, 32, out=at(sc, "nunca2", -.3))
    b = big("s3-b", f"NUNCA PISOU<br>NA {g('ILHA FINAL', YELLOW)} 🏝️", 300, at(sc, "nunca2", -.1), 86)
    ov(sc, q[0] + l1[0] + l2[0] + b[0], q[1] + fade + l1[1] + l2[1] + b[1])


def s4():
    sc = "s4-governo"
    q = xq("s4-q", "TRABALHA PRO<br>GOVERNO? 🏛️", at(sc, "governo", -.3), at(sc, "naoera"), top=250, size=92)
    l1 = lbl2("s4-l1", "👤 UM HOMEM IGUALZINHO A ELE…", 50, 480, at(sc, "homem", -.2), YELLOW, 32, out=at(sc, "visitou", -.3))
    l2 = lbl2("s4-l2", "🏛️ …VISITOU OS CINCO ANCIÕES", 50, 480, at(sc, "visitou", -.2), PINK, 32, out=at(sc, "autor", -.3))
    l3 = lbl2("s4-l3", "✍️ O AUTOR CONFIRMOU", 50, 480, at(sc, "autor", -.2), GREEN, 32, out=at(sc, "irmao", -.3))
    fade = f'tl.to("#s4-q", {{ opacity: 0, duration: .3 }}, {at(sc, "irmao", -.3)});'
    b = big("s4-b", f"ERA O IRMÃO<br>{g('GÊMEO', YELLOW)} 👯", 290, at(sc, "irmao", -.1), 100)
    l4 = lbl2("s4-l4", "SHAMROCK", 60, 560, at(sc, "shamrock", -.1), YELLOW, 44)
    ov(sc, q[0] + l1[0] + l2[0] + l3[0] + b[0] + l4[0], q[1] + l1[1] + l2[1] + l3[1] + fade + b[1] + l4[1])


def s5():
    sc = "s5-keys"
    body = f'''<div id="s5-card" class="card" style="top:250px;z-index:7;opacity:0;border-left-color:{CYAN}"><div class="nm" style="font-size:70px">🎮 KEYS ALEATÓRIAS</div>
      <div class="sub" style="font-size:36px;color:#fff">DA STEAM · BEM BARATAS</div>
      <div class="sub" style="font-size:40px;color:{YELLOW};margin-top:14px">👆 LINK NA BIO</div></div>'''
    js = f'''tl.fromTo("#s5-card", {{ opacity: 0, y: -30, scale: .92 }}, {{ opacity: 1, y: 0, scale: 1, duration: .35, ease: "back.out(1.6)" }}, {at(sc, "rapidinho", -.1)});
      tl.fromTo("#s5-card", {{ scale: 1 }}, {{ scale: 1.05, duration: .18, yoyo: true, repeat: 1, immediateRender: false }}, {at(sc, "bio")});
      tl.to("#s5-card", {{ opacity: 0, duration: .3 }}, {at(sc, "pistas4", -.6)});'''
    l1 = lbl2("s5-l1", "🔎 AGORA, AS PISTAS", 60, 300, at(sc, "pistas4", -.4), YELLOW, 36)
    ov(sc, body + l1[0], js + l1[1])


def s6():
    sc = "s6-pista1"
    a = big("s6-a", f"PISTA {g('1', YELLOW)}", 250, at(sc, "pista1", -.1), 100)
    l1 = lbl2("s6-l1", "🏝️ ELE CHEGOU NA ILHA… E RIU", 50, 400, at(sc, "riu", -.3), YELLOW, 32, out=at(sc, "cedo", -.4))
    b = big("s6-b", f"“CHEGAMOS<br>{g('CEDO DEMAIS', YELLOW)}” ⏳", 400, at(sc, "cedo", -.2), 76)
    ov(sc, a[0] + l1[0] + b[0], a[1] + l1[1] + b[1])


def s7():
    sc = "s7-pista2"
    a = big("s7-a", f"PISTA {g('2', YELLOW)}", 250, at(sc, "pista2", -.1), 100, out=at(sc, "apostou", -.3))
    l1 = lbl2("s7-l1", "👒 DEU O CHAPÉU PRO LUFFY", 50, 400, at(sc, "chapeu", -.2), YELLOW, 32, out=at(sc, "perdeu", -.3))
    l2 = lbl2("s7-l2", "💔 PERDEU O BRAÇO SALVANDO ELE", 50, 400, at(sc, "perdeu", -.2), RED, 32, out=at(sc, "apostou", -.3))
    b = big("s7-b", f"APOSTOU O BRAÇO<br>NA {g('NOVA ERA', YELLOW)}", 290, at(sc, "apostou", -.1), 82)
    ov(sc, a[0] + l1[0] + l2[0] + b[0], a[1] + l1[1] + l2[1] + b[1])


def s8():
    sc = "s8-pista3"
    a = big("s8-a", f"PISTA {g('3', YELLOW)}", 250, at(sc, "pista3", -.1), 100, out=at(sc, "chegou7", -.3))
    b = big("s8-b", f"“CHEGOU A HORA DE<br>PEGAR O {g('ONE PIECE', YELLOW)}”", 280, at(sc, "chegou7", -.1), 70)
    l1 = lbl2("s8-l1", "⚔️ SÓ DEPOIS QUE O LUFFY VENCEU O KAIDO", 30, 470, at(sc, "luffy7", -.2), PINK, 30)
    ov(sc, a[0] + b[0] + l1[0], a[1] + b[1] + l1[1])


def s9():
    sc = "s9-resposta"
    a = big("s9-a", "ELE NÃO ESTAVA<br>PARADO", 300, at(sc, "parado", -.3), 92, out=at(sc, "esperando", -.3))
    b = big("s9-b", f"ESTAVA<br>{g('ESPERANDO', YELLOW)} ⏳", 300, at(sc, "esperando", -.1), 100)
    l1 = lbl2("s9-l1", "👒 A PESSOA CERTA, NA HORA CERTA", 50, 520, at(sc, "pessoa", -.2), YELLOW, 32)
    ov(sc, a[0] + b[0] + l1[0], a[1] + b[1] + l1[1])


def s10():
    sc = "s10-detalhe"
    l0 = lbl2("s10-l0", "🤫 MAS TEM UM DETALHE…", 60, 240, at(sc, "detalhe", -.3), YELLOW, 34, out=at(sc, "bebe", -.4))
    a = big("s10-a", f"UM BEBÊ NUM<br>{g('BAÚ DO TESOURO', YELLOW)} 👶", 300, at(sc, "bebe", -.2), 80, out=at(sc, "nasceu", -.3))
    b = big("s10-b", f"FAMÍLIA DE<br>{g('DRAGÕES CELESTIAIS', YELLOW)} 👑", 300, at(sc, "nasceu", -.1), 72, out=at(sc, "fas", -.3))
    l1 = lbl2("s10-l1", "🧠 TEORIA DOS FÃS", 60, 240, at(sc, "fas", -.3), PINK, 34)
    c = big("s10-c", f"UM PLANO<br>{g('SÓ DELE?')} 🤔", 320, at(sc, "plano", -.2), 100)
    ov(sc, l0[0] + a[0] + b[0] + l1[0] + c[0], l0[1] + a[1] + b[1] + l1[1] + c[1])


def s11():
    sc = "s11-pergunta"
    b = big("s11-q", f"POR QUE ELE<br>{g('ESPEROU')} TANTO?", 290, at(sc, "voce", -.1), 100)
    body = f'''<div class="big" id="s11-c" style="top:1680px;font-family:'Space Mono';font-weight:700;font-size:56px;opacity:0">COMENTA 👇</div>'''
    js = f'''tl.fromTo("#s11-c", {{ opacity: 0 }}, {{ opacity: 1, duration: .4 }}, {at(sc, "comenta", -.1)});
      tl.fromTo("#s11-c", {{ y: 0 }}, {{ y: 12, duration: .4, yoyo: true, repeat: 5, ease: "sine.inOut", immediateRender: false }}, {at(sc, "comenta", .4)});'''
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
    return [("whoosh.mp3", 0.15, .25), ("mar.wav", 0.0, .22), ("nhec.wav", 1.0, .25), ("sparkle.mp3", k["rei"], .3), ("impact-bass-2.mp3", k["vinte"] - .1, .4),
            ("volta.wav", k["nunca0"], .3), ("glitch-1.mp3", k["porque0"], .3), ("previsao.wav", k["fica"], .3),
            ("whoosh.mp3", PSTART[1] - .1, .25), ("error.mp3", k["nao1"], .35), ("impact-bass-1.mp3", k["imperador"], .4), ("explosao.wav", k["guerra"] - .2, .3),
            ("whoosh-short.mp3", k["aparecendo"], .35), ("impact-bass-2.mp3", k["almirante"] + .2, .45), ("crack.wav", k["recuar"], .35),
            ("whoosh.mp3", PSTART[2] - .1, .25), ("error.mp3", k["tambem2"], .35), ("chuva.wav", k["viagem"] - .3, .2), ("tosse.wav", k["febre"], .35),
            ("coracao.wav", k["cuidando"] - .2, .25), ("nhec.wav", k["nunca2"] - .4, .3),
            ("whoosh.mp3", PSTART[3] - .1, .25), ("toc.wav", k["homem"], .3), ("toc.wav", k["homem"] + .5, .3), ("previsao.wav", k["ancioes"], .3),
            ("error.mp3", k["naoera"], .35), ("sparkle.mp3", k["irmao"], .35), ("carimbo.wav", k["shamrock"], .35),
            ("notification.mp3", k["rapidinho"], .35), ("moedas.wav", k["steam"], .3), ("pop.mp3", k["bio"], .3), ("whoosh.mp3", k["pistas4"] - .2, .25),
            ("carimbo.wav", k["pista1"], .4), ("onda.wav", k["ilha5"] - .2, .3), ("sparkle.mp3", k["riu"], .35), ("impact-bass-1.mp3", k["cedo"], .35),
            ("carimbo.wav", k["pista2"], .4), ("plic.wav", k["chapeu"] + .2, .3), ("onda.wav", k["perdeu"] - .3, .35), ("impact-bass-2.mp3", k["braco"], .4),
            ("sparkle.mp3", k["nova"], .35),
            ("carimbo.wav", k["pista3"], .4), ("tremor.wav", k["chegou7"] - .2, .4), ("explosao.wav", k["derrotou"], .35), ("impact-bass-2.mp3", k["kaido"], .4),
            ("whoosh.mp3", PSTART[8] - .1, .25), ("volta.wav", k["esperando"], .3), ("sparkle.mp3", k["pessoa"], .35),
            ("whoosh.mp3", PSTART[9] - .1, .25), ("cadeado.wav", k["bau"] - .3, .35), ("fogo.wav", k["achou9"], .2), ("sparkle.mp3", k["familia"], .35),
            ("impact-bass-1.mp3", k["dragoes"], .35), ("glitch-1.mp3", k["plano"], .3),
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
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #08060e; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
      #c3d {{ position: absolute; inset: 0; width: 1080px; height: 1920px; z-index: 0; }}
      .fontwarm {{ position: absolute; left: -9999px; top: 0; }}
    </style>
  </head>
  <body>
    <!-- Por que o Shanks nunca foi atrás do One Piece antes do Luffy? — 3D (gerado por tools/build_shanks.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920" data-layout-allow-overflow></canvas>
      <div class="fontwarm" data-layout-allow-overflow><span style="font-family:'Space Mono';font-weight:700">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/shanks3d.js"></script>
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
        json.dump({"id": "shanks", "name": "Por que o Shanks nunca foi atrás do One Piece antes do Luffy? (3D)", "createdAt": "2026-11-10T21:00:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, "pistas", round(PSTART[5], 2), "resposta", round(PSTART[8], 2))
    for n, s, e in SCENES:
        print(f"  {n:15s} {s:6.2f} → {e:6.2f}  ({e - s:.1f}s)")
