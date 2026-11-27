"""Gera o vídeo 3D de curiosidade "Por que o Kira queria tanto uma vida normal?" em kira/.

Estilo do vídeo do Eren (documentário): fotos de licença livre misturadas com cenários 3D originais, palpites errados
riscados em vermelho e a resposta guardada pro final; agora com o motor 3D v2 (luz, névoa, cenários em camadas) e
animação v5 (pés plantados, gestos com antecipação e acomodação, paletó e gravata com mola, câmera contínua).
O Kira é representado por um símbolo original (o homem sem rosto); nada desenhado da obra, nomes só no texto e na narração.
O 3D fica em kira/assets/kira3d.js. Este script gera os tempos-chave, os textos por cena, as legendas e a raiz com
voz, trilha e efeitos.
Uso: python3 tools/build_kira.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kira")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-kira.wav"
MUSIC = "assets/music/trilha-kira.wav"
RED, AMBER, LILAC, ICE, BONE = "#ff3b4e", "#ffc65a", "#c4adff", "#9fd8ff", "#f6f1e8"
HL = "#ffc65a"  # destaque das legendas (âmbar, a luz da janela)

PARS = [
    "Ele matou por 15 anos|sem ser pego…|e só queria uma vida tranquila,|com oito horas de sono.|Por que um assassino|queria tanto ser normal?|Fica até o final.",
    "O Yoshikage Kira tinha 33 anos|e um emprego comum|numa loja de departamentos.|Em casa até as 8,|na cama às 11,|depois de um leite morno.|Oito horas de sono.",
    "Só que, desde 1983,|ele era um assassino em série.|Guardava as próprias unhas|em potes, um por ano…|e quando elas cresciam rápido demais,|era sinal de um ano bom pra caçar.",
    "Então ele queria uma vida normal|por culpa?|Não.|O Kira nunca sentiu culpa.",
    "Desde criança,|ele nunca passava do terceiro lugar.|Redação, corrida, violino…|sempre em terceiro.|De propósito:|o primeiro lugar chama atenção.",
    "Rapidinho:|tem keys aleatórias da Steam|bem baratas no link da minha bio.|Agora, a parte|que explica tudo.",
    "Então a vida normal|era só um disfarce?|Também não.",
    "Pro Kira, a vida tranquila|não era o disfarce.|Era o objetivo.|Ele mesmo dizia:|sem vitórias, sem derrotas,|sem inimigos…|é isso que me faz feliz.|E os assassinatos,|ele escondia no meio da rotina.",
    "Tanto que, quando foi descoberto,|ele roubou o rosto|e a vida de outro homem:|casa, esposa e filho…|só pra continuar tranquilo.",
    "No fim, o homem que só queria|dormir em paz morreu…|e a alma dele foi arrastada|pra um lugar onde|nunca mais vai ter paz.|E pra você:|quem dá mais medo,|o Kira ou o Dio?|Comenta A ou B.",
]
FIX = {"para": ["pra"], "epara": ["e", "pra"], "epra": ["e", "pra"], "eo": ["e", "o"], "eos": ["e", "os"], "ea": ["e", "a"], "eso": ["e", "so"],
       "equando": ["e", "quando"], "eisso": ["e", "isso"], "view": ["bio"], "quis": ["keys"], "quiz": ["keys"], "stim": ["steam"],
       "quira": ["kira"], "kiras": ["kira"], "yoshikague": ["yoshikage"]}
_TR = os.path.join(ROOT, "assets/voice/transcript.json")
WORDS = align(PARS, _TR, FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 3.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-rua", "s2-rotina", "s3-potes", "s4-culpa", "s5-terceiro", "s6-keys", "s7-disfarce", "s8-objetivo", "s9-rosto", "s10-beco"]
SCENES = []
for k, n in enumerate(NAMES):
    s = 0.0 if k == 0 else round(PSTART[k] - .15, 2)
    e = TOTAL if k == len(NAMES) - 1 else round(PSTART[k + 1] - .15, 2)
    SCENES.append((n, s, e))
SC = {n: (s, e) for n, s, e in SCENES}


def W(par, word, nth=0):
    hits = [w for w in WORDS if w[0] == par and w[3].startswith(norm(word))]
    return round(hits[nth][4], 2)


def WE(par, word, nth=0):
    hits = [w for w in WORDS if w[0] == par and w[3].startswith(norm(word))]
    return round(hits[nth][5], 2)


KEYS = {
    "matou": W(0, "matou"), "quinze": W(0, "15"), "pego": W(0, "pego"), "so0": W(0, "so"), "tranquila0": W(0, "tranquila"), "oito0": W(0, "oito"), "sono0": W(0, "sono"),
    "porque": W(0, "por", 1), "assassino0": W(0, "assassino"), "normal0": W(0, "normal"), "fica": W(0, "fica"), "final": W(0, "final"),
    "yoshikage": W(1, "yoshikage"), "trinta": W(1, "33"), "emprego": W(1, "emprego"), "loja": W(1, "loja"), "departamentos": W(1, "departamentos"),
    "casa1": W(1, "casa"), "oitoh": W(1, "8"), "cama": W(1, "cama"), "onze": W(1, "11"), "leite": W(1, "leite"), "morno": W(1, "morno"),
    "oito1": W(1, "oito"), "sono1": W(1, "sono"), "sono1e": WE(1, "sono"),
    "desde2": W(2, "desde"), "ano83": W(2, "1983"), "assassino2": W(2, "assassino"), "serie": W(2, "serie"), "guardava": W(2, "guardava"), "unhas": W(2, "unhas"),
    "potes": W(2, "potes"), "porano": W(2, "ano"), "quando2": W(2, "quando"), "cresciam": W(2, "cresciam"), "rapido": W(2, "rapido"), "sinal": W(2, "sinal"),
    "bom": W(2, "bom"), "cacar": W(2, "cacar"),
    "entao3": W(3, "entao"), "culpa3": W(3, "culpa"), "nao3": W(3, "nao"), "kira3": W(3, "kira"), "nunca3": W(3, "nunca"), "culpa3b": W(3, "culpa", 1),
    "crianca": W(4, "crianca"), "terceiro": W(4, "terceiro"), "lugar4": W(4, "lugar"), "redacao": W(4, "redacao"), "corrida": W(4, "corrida"), "violino": W(4, "violino"),
    "sempre": W(4, "sempre"), "terceiro2": W(4, "terceiro", 1), "proposito": W(4, "proposito"), "primeiro": W(4, "primeiro"), "atencao": W(4, "atencao"),
    "rapidinho": W(5, "rapidinho"), "keys": W(5, "keys"), "steam": W(5, "steam"), "bio": W(5, "bio"), "agora": W(5, "agora"), "explica": W(5, "explica"),
    "entao6": W(6, "entao"), "disfarce6": W(6, "disfarce"), "tambem": W(6, "tambem"),
    "kira7": W(7, "kira"), "tranquila7": W(7, "tranquila"), "disfarce7": W(7, "disfarce"), "objetivo": W(7, "objetivo"), "dizia": W(7, "dizia"),
    "vitorias": W(7, "vitorias"), "derrotas": W(7, "derrotas"), "inimigos": W(7, "inimigos"), "isso": W(7, "isso"), "feliz": W(7, "feliz"),
    "assassinatos": W(7, "assassinatos"), "escondia": W(7, "escondia"), "rotina": W(7, "rotina"),
    "tanto": W(8, "tanto"), "descoberto": W(8, "descoberto"), "roubou": W(8, "roubou"), "rosto": W(8, "rosto"), "vida8": W(8, "vida"), "outro": W(8, "outro"),
    "casa8": W(8, "casa"), "esposa": W(8, "esposa"), "filho": W(8, "filho"), "continuar": W(8, "continuar"), "tranquilo": W(8, "tranquilo"),
    "fim": W(9, "fim"), "homem9": W(9, "homem"), "dormir": W(9, "dormir"), "paz9": W(9, "paz"), "morreu": W(9, "morreu"), "alma": W(9, "alma"),
    "arrastada": W(9, "arrastada"), "lugar9": W(9, "lugar"), "nunca9": W(9, "nunca"), "paz9b": W(9, "paz", 1), "voce": W(9, "voce"), "medo": W(9, "medo"),
    "kira9": W(9, "kira"), "dio": W(9, "dio"), "comenta": W(9, "comenta"),
}


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


CSS = f'''#root {{ background: transparent; }}
  .lbl {{ position:absolute; font-family:'Space Mono',monospace; font-weight:700; color:#fff; letter-spacing:.06em; text-transform:uppercase;
    background:linear-gradient(90deg, rgba(8,8,16,.9), rgba(8,8,16,.72)); border-left:8px solid {RED}; padding:10px 22px; font-size:36px; box-shadow:0 8px 30px rgba(0,0,0,.35); }}
  .big {{ position:absolute; left:0; right:0; text-align:center; font-family:'Archivo Black'; color:{BONE}; letter-spacing:.01em; line-height:1.04;
    text-shadow:0 6px 26px rgba(0,0,0,.9), 0 2px 0 rgba(0,0,0,.6); -webkit-text-stroke:5px rgba(6,6,14,.92); paint-order:stroke fill; }}
  .big::before {{ content:''; position:absolute; left:4%; right:4%; top:-46px; bottom:-46px; z-index:-1;
    background:radial-gradient(ellipse at 50% 50%, rgba(6,6,14,.6) 0%, rgba(6,6,14,.4) 45%, rgba(6,6,14,0) 72%); }}
  .xbar {{ position:absolute; left:8%; right:8%; top:50%; height:16px; margin-top:-8px; background:{RED}; transform-origin:0% 50%; transform:scaleX(0);
    box-shadow:0 0 18px rgba(255,59,78,.7); border-radius:3px; }}
  .clk {{ position:absolute; font-family:'Space Mono',monospace; font-weight:700; color:{AMBER}; background:rgba(8,8,16,.86); border:4px solid {AMBER};
    padding:6px 22px; font-size:58px; letter-spacing:.04em; box-shadow:0 0 30px rgba(255,198,90,.35); }}
  .clk small {{ font-size:30px; color:#fff; margin-left:14px; letter-spacing:.06em; }}
  .bar {{ position:absolute; left:120px; right:120px; height:30px; border:3px solid {AMBER}; background:rgba(8,8,16,.7); }}
  .bar i {{ position:absolute; left:0; top:0; bottom:0; width:100%; background:linear-gradient(90deg, #ffb347, {AMBER}); transform-origin:0% 50%; transform:scaleX(0); }}
  .card {{ position:absolute; left:70px; right:70px; padding:22px 30px 24px; background:linear-gradient(135deg, rgba(20,16,34,.94), rgba(8,8,16,.92));
    border:3px solid rgba(196,173,255,.6); border-radius:6px; box-shadow:0 0 44px rgba(196,173,255,.25); }}
  .card .nm {{ font-family:'Archivo Black'; font-size:64px; color:#fff; line-height:1; }}
  .card .sub {{ font-family:'Space Mono',monospace; font-weight:700; font-size:34px; color:#e6dcf8; letter-spacing:.05em; margin-top:10px; text-transform:uppercase; }}
  .ab {{ position:absolute; top:1430px; width:380px; height:200px; border:5px solid #fff; background:rgba(8,8,16,.82); text-align:center; padding-top:22px; }}
  .ab b {{ display:block; font-family:'Archivo Black'; font-size:66px; line-height:1; }}
  .ab span {{ display:block; font-family:'Space Mono',monospace; font-weight:700; font-size:40px; color:#fff; margin-top:14px; }}'''


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


def xq(cid, text, top, t, tx, size=128, out=None):
    """Palpite errado (estilo do vídeo do Eren): a pergunta aparece e um risco vermelho corta a palavra."""
    b = f'<div class="big" id="{cid}" style="top:{top}px;font-size:{size}px;opacity:0;z-index:6">{text}<div id="{cid}-x" class="xbar"></div></div>'
    j = f'tl.fromTo("#{cid}", {{ opacity: 0, scale: .9 }}, {{ opacity: 1, scale: 1, duration: .3, ease: "back.out(1.5)" }}, {t});'
    j += f'tl.fromTo("#{cid}-x", {{ scaleX: 0 }}, {{ scaleX: 1, duration: .22, ease: "power2.in" }}, {tx});'
    j += f'tl.fromTo("#{cid}", {{ x: 0 }}, {{ x: 10, duration: .05, yoyo: true, repeat: 5, ease: "none", immediateRender: false }}, {round(tx + .2, 2)});'
    j += f'tl.to("#{cid}", {{ color: "#ff9aa4", duration: .2 }}, {round(tx + .2, 2)});'
    if out is not None:
        j += f'tl.to("#{cid}", {{ opacity: 0, duration: .3 }}, {out});'
    return b, j


def g(span, color=AMBER):
    return f"<span style='color:{color}'>{span}</span>"


def join(*parts):
    return "".join(p[0] for p in parts), "".join(p[1] for p in parts)


def s1():
    sc = "s1-rua"
    ov(sc, *join(
        lbl2("s1-l1", "⚠️ CONTÉM SPOILERS · JOJO PARTE 4", 40, 220, .2, RED, 30, out=at(sc, "fica", -.25)),
        big("s1-a", f"{g('15 ANOS', RED)}<br>SEM SER PEGO", 300, at(sc, "quinze", -.25), 112, out=at(sc, "so0", -.3)),
        big("s1-b", f"UMA VIDA<br>{g('TRANQUILA')}", 300, at(sc, "so0", -.1), 112, out=at(sc, "porque", -.3)),
        big("s1-c", f"POR QUE QUERIA<br>SER {g('NORMAL')}?", 300, at(sc, "porque", -.1), 100),
        lbl2("s1-l2", "👀 FICA ATÉ O FINAL", 60, 560, at(sc, "normal0", .15), AMBER, 34),
    ))


def s2():
    sc = "s2-rotina"
    body = f'''<div id="s2-c1" class="clk" style="left:70px;top:420px;opacity:0;z-index:7">20:00<small>EM CASA</small></div>
    <div id="s2-c2" class="clk" style="left:70px;top:540px;opacity:0;z-index:7">23:00<small>NA CAMA</small></div>
    <div id="s2-bar" class="bar" style="top:1150px;opacity:0;z-index:7"><i id="s2-bar-i"></i></div>'''
    js = f'''tl.fromTo("#s2-c1", {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: .3 }}, {at(sc, "casa1", -.15)});
      tl.fromTo("#s2-c2", {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: .3 }}, {at(sc, "cama", -.15)});
      tl.to(["#s2-c1", "#s2-c2"], {{ opacity: 0, duration: .3 }}, {at(sc, "oito1", -.35)});
      tl.fromTo("#s2-bar", {{ opacity: 0 }}, {{ opacity: 1, duration: .25 }}, {at(sc, "oito1", -.1)});
      tl.fromTo("#s2-bar-i", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 1.1, ease: "power1.inOut" }}, {at(sc, "oito1", .05)});'''
    ov(sc, *join(
        lbl2("s2-l1", "YOSHIKAGE KIRA · 33 ANOS", 50, 220, at(sc, "yoshikage", -.15), LILAC, 36, out=at(sc, "casa1", -.3)),
        lbl2("s2-l2", "🏬 LOJA DE DEPARTAMENTOS", 50, 300, at(sc, "loja", -.15), LILAC, 34, out=at(sc, "casa1", -.3)),
        lbl2("s2-l3", "🥛 LEITE MORNO", 70, 660, at(sc, "leite", -.15), AMBER, 36, out=at(sc, "oito1", -.35)),
        big("s2-a", f"{g('8 HORAS')}<br>DE SONO", 300, at(sc, "oito1", -.2), 116),
        (body, js),
    ))


def s3():
    sc = "s3-potes"
    ov(sc, *join(
        big("s3-a", f"DESDE<br>{g('1983', RED)}", 300, at(sc, "desde2", -.15), 128, out=at(sc, "guardava", -.3)),
        lbl2("s3-l1", "🔪 ASSASSINO EM SÉRIE", 60, 600, at(sc, "assassino2", -.1), RED, 36, out=at(sc, "guardava", -.3)),
        lbl2("s3-l2", "🫙 UM POTE DE UNHAS POR ANO", 40, 240, at(sc, "potes", -.2), AMBER, 34, out=at(sc, "sinal", -.2)),
        lbl2("s3-l3", "📈 CRESCEU RÁPIDO = PERIGO", 40, 320, at(sc, "cresciam", -.25), RED, 34, out=at(sc, "sinal", -.2)),
        big("s3-b", f"UM ANO BOM<br>{g('PRA CAÇAR', RED)}", 300, at(sc, "sinal", -.05), 104),
    ))


def s4():
    sc = "s4-culpa"
    ov(sc, *join(
        xq("s4-q", "CULPA?", 300, at(sc, "culpa3", -.35), at(sc, "nao3", -.05), 150),
        lbl2("s4-l1", "😶 NUNCA SENTIU CULPA", 80, 560, at(sc, "nunca3", -.1), RED, 38),
    ))


def s5():
    sc = "s5-terceiro"
    ov(sc, *join(
        big("s5-a", f"NUNCA ACIMA DO<br>{g('3º LUGAR')}", 290, at(sc, "crianca", -.1), 96, out=at(sc, "redacao", -.3)),
        lbl2("s5-l1", "📝 REDAÇÃO · 3º", 70, 260, at(sc, "redacao", -.1), AMBER, 40, out=at(sc, "proposito", -.35)),
        lbl2("s5-l2", "🏃 CORRIDA · 3º", 70, 345, at(sc, "corrida", -.1), AMBER, 40, out=at(sc, "proposito", -.35)),
        lbl2("s5-l3", "🎻 VIOLINO · 3º", 70, 430, at(sc, "violino", -.1), AMBER, 40, out=at(sc, "proposito", -.35)),
        big("s5-b", f"DE {g('PROPÓSITO', RED)}", 300, at(sc, "proposito", -.15), 112),
        lbl2("s5-l4", "👀 O 1º LUGAR CHAMA ATENÇÃO", 40, 450, at(sc, "primeiro", -.15), RED, 32),
    ))


def s6():
    sc = "s6-keys"
    body = f'''<div id="s6-card" class="card" style="top:250px;z-index:7;opacity:0"><div class="nm">🎮 KEYS ALEATÓRIAS</div>
      <div class="sub">DA STEAM · BEM BARATAS</div>
      <div class="sub" style="font-size:40px;color:{AMBER};margin-top:14px">👆 LINK NA MINHA BIO</div></div>'''
    js = f'''tl.fromTo("#s6-card", {{ opacity: 0, y: -30, scale: .92 }}, {{ opacity: 1, y: 0, scale: 1, duration: .35, ease: "back.out(1.6)" }}, {at(sc, "rapidinho", -.1)});
      tl.fromTo("#s6-card", {{ scale: 1 }}, {{ scale: 1.05, duration: .18, yoyo: true, repeat: 1, immediateRender: false }}, {at(sc, "bio")});
      tl.to("#s6-card", {{ opacity: 0, duration: .3 }}, {at(sc, "agora", -.4)});'''
    l1 = lbl2("s6-l1", "🔎 AGORA, A PARTE QUE EXPLICA TUDO", 30, 300, at(sc, "agora", -.2), AMBER, 31)
    ov(sc, body + l1[0], js + l1[1])


def s7():
    sc = "s7-disfarce"
    ov(sc, *join(xq("s7-q", "SÓ UM<br>DISFARCE?", 280, at(sc, "entao6", .1), at(sc, "tambem", -.05), 120)))


def s8():
    sc = "s8-objetivo"
    ov(sc, *join(
        big("s8-a", f"NÃO ERA<br>{g('DISFARCE', RED)}", 300, at(sc, "tranquila7", -.2), 108, out=at(sc, "objetivo", -.3)),
        big("s8-b", f"ERA O<br>{g('OBJETIVO')}", 300, at(sc, "objetivo", -.15), 120, out=at(sc, "dizia", -.25)),
        lbl2("s8-l1", "🏆 SEM VITÓRIAS", 70, 250, at(sc, "vitorias", -.1), AMBER, 40, out=at(sc, "escondia", -.3)),
        lbl2("s8-l2", "🥀 SEM DERROTAS", 70, 335, at(sc, "derrotas", -.1), AMBER, 40, out=at(sc, "escondia", -.3)),
        lbl2("s8-l3", "⚔️ SEM INIMIGOS", 70, 420, at(sc, "inimigos", -.1), AMBER, 40, out=at(sc, "escondia", -.3)),
        big("s8-c", f"“É ISSO QUE<br>ME FAZ {g('FELIZ')}”", 560, at(sc, "isso", -.15), 92, out=at(sc, "escondia", -.3)),
        lbl2("s8-l4", "🩸 OS CRIMES: ESCONDIDOS NA ROTINA", 30, 300, at(sc, "escondia", -.15), RED, 30),
    ))


def s9():
    sc = "s9-rosto"
    ov(sc, *join(
        lbl2("s9-l1", "🚨 DESCOBERTO", 70, 230, at(sc, "descoberto", -.15), RED, 38, out=at(sc, "roubou", -.3)),
        big("s9-a", f"ROUBOU UM<br>{g('ROSTO', RED)}", 300, at(sc, "roubou", -.15), 116, out=at(sc, "casa8", -.3)),
        lbl2("s9-l2", "🏠 CASA", 80, 260, at(sc, "casa8", -.1), AMBER, 42, out=at(sc, "continuar", -.35)),
        lbl2("s9-l3", "💍 ESPOSA", 80, 345, at(sc, "esposa", -.1), AMBER, 42, out=at(sc, "continuar", -.35)),
        lbl2("s9-l4", "👦 FILHO", 80, 430, at(sc, "filho", -.1), AMBER, 42, out=at(sc, "continuar", -.35)),
        big("s9-b", f"SÓ PRA CONTINUAR<br>{g('TRANQUILO')}", 300, at(sc, "continuar", -.2), 84),
    ))


def s10():
    sc = "s10-beco"
    body = f'''<div id="s10-a" class="ab" style="left:110px;border-color:{RED};opacity:0;z-index:7"><b style="color:{RED}">A</b><span>KIRA 💣</span></div>
    <div id="s10-b" class="ab" style="right:110px;border-color:{LILAC};opacity:0;z-index:7"><b style="color:{LILAC}">B</b><span>DIO 🧛</span></div>
    <div class="big" id="s10-c" style="top:1690px;font-family:'Space Mono';font-weight:700;font-size:54px;-webkit-text-stroke:0;opacity:0;z-index:7">COMENTA A OU B 👇</div>'''
    js = f'''tl.fromTo("#s10-a", {{ opacity: 0, y: 40, scale: .9 }}, {{ opacity: 1, y: 0, scale: 1, duration: .35, ease: "back.out(1.6)" }}, {at(sc, "kira9", -.1)});
      tl.fromTo("#s10-b", {{ opacity: 0, y: 40, scale: .9 }}, {{ opacity: 1, y: 0, scale: 1, duration: .35, ease: "back.out(1.6)" }}, {at(sc, "dio", -.1)});
      tl.fromTo("#s10-c", {{ opacity: 0 }}, {{ opacity: 1, duration: .4 }}, {at(sc, "comenta", -.1)});
      tl.fromTo("#s10-c", {{ y: 0 }}, {{ y: 12, duration: .4, yoyo: true, repeat: 5, ease: "sine.inOut", immediateRender: false }}, {at(sc, "comenta", .4)});'''
    ov(sc, *join(
        lbl2("s10-l1", "👻 O BECO DAS ALMAS", 70, 230, at(sc, "alma", -.2), LILAC, 36, out=at(sc, "nunca9", -.3)),
        big("s10-x", f"NUNCA MAIS<br>VAI TER {g('PAZ', RED)}", 290, at(sc, "nunca9", -.15), 104, out=at(sc, "voce", -.35)),
        big("s10-q", f"QUEM DÁ<br>MAIS {g('MEDO', RED)}?", 290, at(sc, "voce", -.1), 116),
        (body, js),
    ))


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
      .cbox { display:inline-block; padding:8px 18px; background:rgba(8,8,16,.74); font-family:Montserrat; font-weight:800; font-size:50px; line-height:1.15; color:#fff;
        text-transform:uppercase; text-shadow:0 3px 10px rgba(0,0,0,.9); max-width:840px; }'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


def sfx_list():
    k, P = KEYS, PSTART
    return [
        # 1 · a rua à noite
        ("grilos.wav", 0.0, .32), ("vento.wav", 0.1, .14), ("coracao.wav", k["matou"] - .1, .32), ("impact-bass-2.mp3", k["quinze"] - .05, .32),
        ("passos.wav", k["so0"] - .3, .22), ("relogio.wav", k["oito0"] - .1, .2), ("impact-bass-1.mp3", k["porque"], .28), ("whoosh-short.mp3", k["fica"] - .2, .25),
        # 2 · a rotina
        ("whoosh.mp3", P[1] - .15, .28), ("zumbido-geladeira.wav", P[1], .12), ("toc.wav", k["yoshikage"], .25), ("chave.wav", k["casa1"] - .35, .35),
        ("porta.wav", k["casa1"] - .1, .3), ("relogio.wav", k["casa1"], .22), ("cama.wav", k["cama"] - .05, .32), ("leite.wav", k["leite"] - .2, .4),
        ("caixinha.wav", k["oito1"] - .1, .3),
        # 3 · os potes
        ("whoosh.mp3", P[2] - .15, .28), ("zumbido.wav", P[2], .2), ("impact-bass-2.mp3", k["ano83"] - .05, .4), ("vidro.wav", k["guardava"] + .1, .3),
        ("potes.wav", k["potes"] - .1, .4), ("lapis.wav", k["rapido"] - .2, .35), ("coracao.wav", k["sinal"], .3), ("impact-bass-1.mp3", k["cacar"], .38),
        # 4 · culpa?
        ("whoosh.mp3", P[3] - .15, .28), ("gota.wav", P[3] + .1, .35), ("vapor.wav", k["culpa3"] - .4, .22), ("risco.wav", k["nao3"] - .05, .45), ("error.mp3", k["nao3"] + .05, .2),
        # 5 · sempre em 3º
        ("whoosh.mp3", P[4] - .15, .28), ("eco.wav", P[4], .2), ("medalha.wav", k["terceiro"], .32), ("plic.wav", k["redacao"], .3), ("plic.wav", k["corrida"], .3),
        ("violino.wav", k["violino"] - .05, .32), ("impact-bass-2.mp3", k["proposito"] - .05, .35), ("obturador.wav", k["primeiro"], .3),
        # 6 · keys
        ("whoosh.mp3", P[5] - .15, .28), ("notification.mp3", k["rapidinho"], .35), ("moedas.wav", k["steam"], .3), ("pop.mp3", k["bio"], .3), ("whoosh.mp3", k["agora"] - .3, .25),
        # 7 · só disfarce?
        ("whoosh.mp3", P[6] - .15, .28), ("obturador.wav", P[6] + .2, .3), ("risco.wav", k["tambem"] - .05, .45), ("error.mp3", k["tambem"] + .05, .2),
        # 8 · o objetivo
        ("whoosh.mp3", P[7] - .15, .28), ("fonte.wav", P[7], .22), ("sino.wav", k["objetivo"] - .05, .35), ("cha.wav", k["dizia"] - .3, .3),
        ("toc.wav", k["vitorias"] - .03, .45), ("toc.wav", k["derrotas"] - .03, .45), ("toc.wav", k["inimigos"] - .03, .45),
        ("impact-bass-1.mp3", k["assassinatos"] - .1, .3), ("coracao.wav", k["escondia"], .3),
        # 9 · o rosto roubado
        ("whoosh.mp3", P[8] - .15, .28), ("sirene.wav", k["descoberto"] - .2, .2), ("impact-bass-2.mp3", k["roubou"] - .05, .4), ("porcelana.wav", k["rosto"] - .1, .4),
        ("talheres.wav", k["casa8"] - .1, .25), ("rebobinar.wav", k["continuar"] - .3, .25),
        # 10 · o beco
        ("whoosh.mp3", P[9] - .15, .28), ("vento.wav", P[9], .22), ("coracao.wav", k["morreu"] - .2, .3), ("sussurros.wav", k["alma"] - .3, .4),
        ("arrasto.wav", k["arrastada"] - .1, .45), ("impact-bass-1.mp3", k["paz9b"] - .1, .4), ("whoosh-short.mp3", k["voce"] - .2, .3),
        ("pop.mp3", k["kira9"], .3), ("pop.mp3", k["dio"], .3), ("pop.mp3", k["comenta"], .3),
    ]


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip())


LONG = ("vento.wav", "grilos.wav", "zumbido.wav", "zumbido-geladeira.wav", "fonte.wav", "eco.wav", "sussurros.wav")


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
        d = round(min(dur(path), TOTAL - st, 6.0 if f in LONG else 3.0), 2)
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
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #06060c; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
      #c3d {{ position: absolute; inset: 0; width: 1080px; height: 1920px; z-index: 0; }}
      .fontwarm {{ position: absolute; left: -9999px; top: 0; }}
    </style>
  </head>
  <body>
    <!-- Por que o Kira queria tanto uma vida normal? — 3D motor v2, animação v5 (gerado por tools/build_kira.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920" data-layout-allow-overflow></canvas>
      <div class="fontwarm" data-layout-allow-overflow><span style="font-family:'Archivo Black'">A</span><span style="font-family:'Space Mono'">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/kira3d.js"></script>
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
        fotos = sorted(f[:-4] for f in os.listdir(os.path.join(ROOT, "assets/img")) if f.endswith(".jpg")) if os.path.isdir(os.path.join(ROOT, "assets/img")) else []
        f.write("window.HF_T = " + json.dumps({"scenes": SCENES, "sc": SC, "k": KEYS, "total": TOTAL, "fotos": fotos}) + ";\n")
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "kira", "name": "Por que o Kira queria uma vida normal? (3D v2)", "createdAt": "2026-11-14T18:00:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL)
    for n, s, e in SCENES:
        print(f"  {n:15s} {s:6.2f} → {e:6.2f}  ({e - s:.1f}s)")
