"""Gera o vídeo 3D de curiosidade "Por que o Asta nasceu sem magia?" em asta/.

O 3D (Three.js) fica em asta/assets/asta3d.js e é desenhado a partir do tempo.
Só símbolos originais: silhuetas genéricas, um livro escuro liso e um pequeno ser
de sombra (nada copiado do anime; os nomes aparecem só como texto e narração).
Este script gera os tempos-chave, os textos por cena, as legendas e a raiz com
voz, trilha sintetizada e efeitos.
Uso: python3 tools/build_asta.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "asta")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-asta.wav"
MUSIC = "assets/music/trilha-asta.wav"
GREEN, SILVER, WARM, RED = "#8ef0b0", "#dfe6ff", "#ffd27a", "#ff5a6a"
CRIM = GREEN  # destaque das legendas

PARS = [
    "Num reino onde até as crianças|fazem magia…|ele nasceu com zero.|Nem um pouquinho.|E o motivo só foi revelado|muito tempo depois.|Fica até o final,|porque é de partir o coração.",
    "No Reino Clover,|todo mundo nasce com mana.|Aos 15 anos,|cada jovem recebe um grimório.|O Asta não sente nada.|Nem a magia que existe no ar.",
    "Então foi azar?|Não.",
    "Foi culpa do demônio|dentro do grimório dele?|Também não.",
    "A resposta está na mãe dele.|O nome dela era Richita.|E ela nasceu com um corpo raríssimo:|ele absorvia a magia|de tudo que estava por perto.",
    "Quando ela ficou grávida…|o corpo dela absorveu,|sem querer,|toda a magia do próprio filho.|O Asta nasceu|sem nenhuma gota de mana.",
    "Com medo de continuar machucando ele,|ela deixou o bebê|na porta de uma igreja,|numa vila pobre|na fronteira do reino.|E nunca mais voltou.",
    "Mas tem um detalhe|que quase ninguém conhece.|Antes do Asta,|a Richita tinha acolhido outro filho:|um pequeno demônio|que também nasceu sem magia…|e que era humilhado por isso.|Ela deu um nome pra ele.|Liebe.",
    "Anos depois,|esse demônio foi parar justamente|no grimório do Asta.|Os dois filhos sem magia|da mesma mãe…|se encontraram.",
    "E é por não ter mana|que o Asta consegue usar a antimagia:|o poder que corta qualquer feitiço.|O garoto sem magia|virou pesadelo|de quem tem magia.",
    "E você?|Ia preferir nascer com magia normal…|ou sem magia,|mas com antimagia?|Comenta A ou B.",
]
FIX = {"eo": ["e", "o"], "rishita": ["richita"], "libe": ["liebe"], "eque": ["e", "que"], "compraram": ["encontraram"],
       "evoce": ["e", "voce"], "para": ["pra"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-multidao", "s2-torre", "s3-azar", "s4-livro", "s5-mae", "s6-bebe", "s7-igreja", "s8-sombra", "s9-encontro", "s10-antimagia", "s11-pergunta"]
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
    "zero": W(0, "zero"), "pouquinho": W(0, "pouquinho"), "motivo": W(0, "motivo"), "final": W(0, "final"), "coracao": W(0, "coracao"),
    "nasce1": W(1, "nasce"), "anos1": W(1, "15"), "grimorio1": W(1, "grimorio"), "nada": W(1, "nada"), "ar": W(1, "ar"),
    "azar": W(2, "azar"), "nao2": W(2, "nao"),
    "culpa": W(3, "culpa"), "demonio3": W(3, "demonio"), "tambem3": W(3, "tambem"),
    "resposta": W(4, "resposta"), "mae": W(4, "mae"), "richita": W(4, "richita"), "corpo4": W(4, "corpo"), "absorvia": W(4, "absorvia"),
    "gravida": W(5, "gravida"), "absorveu": W(5, "absorveu"), "filho5": W(5, "filho"), "gota": W(5, "gota"),
    "medo": W(6, "medo"), "deixou": W(6, "deixou"), "igreja": W(6, "igreja"), "reino": W(6, "reino"), "nunca": W(6, "nunca"), "voltou": W(6, "voltou"),
    "detalhe": W(7, "detalhe"), "acolhido": W(7, "acolhido"), "demonio7": W(7, "demonio"), "semmagia7": W(7, "magia"), "humilhado": W(7, "humilhado"),
    "nome7": W(7, "nome"), "liebe": W(7, "liebe"),
    "anos8": W(8, "anos"), "demonio8": W(8, "demonio"), "grimorio8": W(8, "grimorio"), "dois": W(8, "dois"), "mesma8": W(8, "mesma"), "encontraram": W(8, "encontraram"),
    "mana9": W(9, "mana"), "antimagia9": W(9, "antimagia"), "corta": W(9, "corta"), "garoto": W(9, "garoto"), "pesadelo": W(9, "pesadelo"),
    "voce": W(10, "voce"), "normal": W(10, "normal"), "antimagia10": W(10, "antimagia"), "comenta": W(10, "comenta"),
}


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


CSS = f'''#root {{ background: transparent; }}
  .lbl {{ position:absolute; font-family:'Space Mono',monospace; font-weight:700; color:#fff; letter-spacing:.06em; text-transform:uppercase;
    background:rgba(6,8,14,.74); border-left:8px solid {GREEN}; padding:10px 22px; font-size:38px; }}
  .big {{ position:absolute; left:0; right:0; text-align:center; font-family:'Archivo Black'; color:#fff; letter-spacing:.02em; line-height:1.05;
    text-shadow:0 6px 24px rgba(0,0,0,.85), 0 0 2px rgba(0,0,0,.9); }}
  .meter {{ position:absolute; left:190px; width:700px; top:260px; padding:18px 26px 24px; background:rgba(6,8,14,.78); border:4px solid {WARM};
    box-shadow:0 0 34px rgba(255,210,122,.35); }}
  .meter .t {{ font-family:'Space Mono',monospace; font-weight:700; font-size:36px; color:#fff; letter-spacing:.06em; display:flex; justify-content:space-between; }}
  .meter .bar {{ margin-top:14px; height:34px; background:rgba(255,255,255,.12); border:2px solid rgba(255,255,255,.35); }}
  .meter .fill {{ height:100%; width:100%; background:linear-gradient(90deg,{WARM},#fff3c9); transform-origin:0% 50%; }}'''


def ov(sc, body, js):
    write(sc, scene(sc, body, js, CSS, bg="transparent"))


def at(sc, k, off=0.0):
    return round(KEYS[k] - SC[sc][0] + off, 2)


def lbl2(cid, text, left, top, t, color=GREEN, size=40, out=None):
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


def xq(cid, text, t, cross, top=300, size=120):
    """Palpite errado: aparece e leva um risco vermelho."""
    b = (f'<div class="big" id="{cid}" style="top:{top}px;font-size:{size}px;color:#fff;opacity:0;z-index:6">{text}'
         f'<div id="{cid}-x" style="position:absolute;left:10%;right:10%;top:50%;height:16px;margin-top:-8px;background:{RED};'
         f'box-shadow:0 0 18px rgba(255,60,80,.7);transform-origin:0% 50%;transform:scaleX(0) rotate(-4deg)"></div></div>')
    j = f'tl.fromTo("#{cid}", {{ opacity: 0, scale: .9 }}, {{ opacity: 1, scale: 1, duration: .3 }}, {t});'
    j += f'tl.fromTo("#{cid}-x", {{ scaleX: 0, rotation: -4 }}, {{ scaleX: 1, rotation: -4, duration: .25 }}, {cross});'
    j += f'tl.to("#{cid}", {{ opacity: .45, duration: .3 }}, {round(cross + .45, 2)});'
    return b, j


def g(span, color=GREEN):
    return f"<span style='color:{color}'>{span}</span>"


def s1():
    sc = "s1-multidao"
    l1 = lbl2("s1-l1", "⚠️ SPOILERS DO MANGÁ", 70, 230, .2, RED, 34, out=at(sc, "final", -.2))
    b = big("s1-t", f"MAGIA: {g('0')}", 340, at(sc, "zero", -.15), 130, out=at(sc, "motivo", -.3))
    pulse = f'tl.fromTo("#s1-t", {{ scale: 1 }}, {{ scale: 1.12, duration: .14, yoyo: true, repeat: 1, immediateRender: false }}, {at(sc, "pouquinho")});'
    b2 = big("s1-t2", f"O MOTIVO É DE<br>PARTIR O {g('CORAÇÃO', RED)} 💔", 330, at(sc, "final", -.1), 74)
    ov(sc, l1[0] + b[0] + b2[0], l1[1] + b[1] + pulse + b2[1])


def s2():
    sc = "s2-torre"
    l1 = lbl2("s2-l1", "TODO MUNDO NASCE COM MANA ✨", 60, 290, at(sc, "nasce1"), GREEN, 36, out=at(sc, "nada", -.4))
    l2 = lbl2("s2-l2", "AOS 15 ANOS: UM GRIMÓRIO 📖", 60, 360, at(sc, "anos1"), WARM, 36, out=at(sc, "nada", -.4))
    b = big("s2-t", f"ASTA: {g('NADA', SILVER)}", 320, at(sc, "nada", -.1), 110)
    ov(sc, l1[0] + l2[0] + b[0], l1[1] + l2[1] + b[1])


def s3():
    sc = "s3-azar"
    b = xq("s3-q", "AZAR? 🎲", at(sc, "azar", -.45), at(sc, "nao2"), top=300, size=130)
    ov(sc, b[0], b[1])


def s4():
    sc = "s4-livro"
    b = xq("s4-q", "CULPA DO<br>DEMÔNIO?", at(sc, "culpa", -.1), at(sc, "tambem3"), top=250, size=104)
    ov(sc, b[0], b[1])


def s5():
    sc = "s5-mae"
    b1 = big("s5-t1", f"A RESPOSTA ESTÁ<br>NA {g('MÃE')}", 270, at(sc, "resposta", -.1), 84, out=at(sc, "richita", -.35))
    b2 = big("s5-t2", "RICHITA", 300, at(sc, "richita", -.05), 140, WARM)
    l1 = lbl2("s5-l1", "UM CORPO QUE ABSORVIA MAGIA 🌀", 50, 480, at(sc, "absorvia"), GREEN, 34)
    ov(sc, b1[0] + b2[0] + l1[0], b1[1] + b2[1] + l1[1])


def s6():
    sc = "s6-bebe"
    a, z = at(sc, "absorveu", -.5), at(sc, "gota", .3)
    body = f'''<div id="s6-m" class="meter" style="z-index:6;opacity:0"><div class="t"><span>MANA DO BEBÊ</span><span id="s6-n">100%</span></div>
      <div class="bar"><div id="s6-f" class="fill"></div></div></div>'''
    js = [f'tl.fromTo("#s6-m", {{ opacity: 0, y: -20 }}, {{ opacity: 1, y: 0, duration: .35 }}, {at(sc, "gravida", -.3)});',
          f'tl.fromTo("#s6-f", {{ scaleX: 1 }}, {{ scaleX: 0, duration: {round(z - a, 2)}, ease: "power1.in" }}, {a});']
    steps = [100, 92, 80, 66, 51, 37, 24, 13, 6, 2, 0]
    for i, v in enumerate(steps[1:], 1):
        x = i / (len(steps) - 1)
        js.append(f'tl.set("#s6-n", {{ textContent: "{v}%" }}, {round(a + (z - a) * x ** 1.6, 2)});')
    js.append(f'tl.to("#s6-n", {{ color: "{RED}", duration: .2 }}, {z});')
    js.append(f'tl.to("#s6-m", {{ borderColor: "{RED}", boxShadow: "0 0 34px rgba(255,60,80,.45)", duration: .3 }}, {z});')
    js.append(f'tl.fromTo("#s6-m", {{ x: 0 }}, {{ x: 6, duration: .05, repeat: 5, yoyo: true, ease: "none", immediateRender: false }}, {z});')
    ov(sc, body, "\n      ".join(js))


def s7():
    sc = "s7-igreja"
    l1 = lbl2("s7-l1", "PRA NÃO MACHUCAR O FILHO 💔", 50, 290, at(sc, "medo", .1), WARM, 34, out=at(sc, "igreja", -.4))
    l2 = lbl2("s7-l2", "⛪ UMA IGREJA NA FRONTEIRA", 50, 290, at(sc, "igreja"), GREEN, 34)
    b = big("s7-t", "E NUNCA MAIS<br>VOLTOU.", 400, at(sc, "nunca", -.4), 78)
    ov(sc, l1[0] + l2[0] + b[0], l1[1] + l2[1] + b[1])


def s8():
    sc = "s8-sombra"
    l1 = lbl2("s8-l1", "🤫 QUASE NINGUÉM SABE", 60, 290, at(sc, "detalhe"), SILVER, 36, out=at(sc, "acolhido", -.35))
    l2 = lbl2("s8-l2", "OUTRO FILHO SEM MAGIA", 60, 290, at(sc, "acolhido"), GREEN, 36, out=at(sc, "nome7", -.3))
    b = big("s8-t", "LIEBE", 300, at(sc, "liebe", -.1), 170, SILVER)
    ov(sc, l1[0] + l2[0] + b[0], l1[1] + l2[1] + b[1])


def s9():
    sc = "s9-encontro"
    l1 = lbl2("s9-l1", "ANOS DEPOIS…", 60, 290, .2, SILVER, 36, out=at(sc, "dois", -.35))
    l2 = lbl2("s9-l2", "→ NO GRIMÓRIO DO ASTA 📖", 60, 360, at(sc, "demonio8"), GREEN, 36, out=at(sc, "dois", -.35))
    b = big("s9-t", f"OS DOIS FILHOS<br>SEM MAGIA SE<br>{g('ENCONTRARAM')}", 270, at(sc, "dois", -.1), 80)
    ov(sc, l1[0] + l2[0] + b[0], l1[1] + l2[1] + b[1])


def s10():
    sc = "s10-antimagia"
    l0 = lbl2("s10-l0", "SEM MANA = …", 60, 290, at(sc, "mana9", -.1), SILVER, 36, out=at(sc, "antimagia9", -.3))
    b = big("s10-t", "ANTIMAGIA", 300, at(sc, "antimagia9", -.05), 128, "#ffffff", out=at(sc, "pesadelo", -.4))
    l1 = lbl2("s10-l1", "⚔️ CORTA QUALQUER FEITIÇO", 60, 460, at(sc, "corta"), GREEN, 36, out=at(sc, "pesadelo", -.4))
    b2 = big("s10-t2", f"O {g('PESADELO', RED)}<br>DOS MAGOS", 300, at(sc, "pesadelo", -.1), 96)
    glow = f'tl.fromTo("#s10-t", {{ textShadow: "0 0 0px rgba(220,230,255,0)" }}, {{ textShadow: "0 0 40px rgba(220,230,255,.9)", duration: .5, yoyo: true, repeat: 1, immediateRender: false }}, {at(sc, "antimagia9", .3)});'
    ov(sc, l0[0] + b[0] + l1[0] + b2[0], l0[1] + b[1] + glow + l1[1] + b2[1])


def s11():
    sc = "s11-pergunta"

    def card(k, letter, col, title, x):
        return f'''<div id="s11-{k}" style="position:absolute;left:{x}px;top:1380px;width:420px;z-index:4;opacity:0">
          <div style="background:rgba(6,8,14,.86);border:4px solid {col};box-shadow:0 0 30px {col}66;padding:24px 16px;text-align:center">
            <div style="font-family:'Space Mono';font-weight:700;font-size:62px;color:{col}">{letter}</div>
            <div style="font-family:'Archivo Black';font-size:38px;line-height:1.12;color:#fff;margin-top:6px">{title}</div></div></div>'''
    body = f'''<div class="big" id="s11-q" style="top:240px;font-size:84px;opacity:0">E VOCÊ?</div>
    <div class="big" id="s11-q2" style="top:345px;font-size:44px;font-family:'Space Mono';font-weight:700;opacity:0">IA PREFERIR NASCER…</div>
    {card("a", "A", GREEN, "COM MAGIA<br>NORMAL ✨", 70)}
    {card("b", "B", SILVER, "SEM MAGIA, MAS<br>COM ANTIMAGIA ⚔️", 590)}
    <div class="big" id="s11-c" style="top:1700px;font-family:'Space Mono';font-weight:700;font-size:54px;opacity:0">COMENTA A OU B ↓</div>'''
    js = f'''tl.fromTo("#s11-q", {{ opacity: 0, scale: .9 }}, {{ opacity: 1, scale: 1, duration: .4 }}, {at(sc, "voce", -.1)});
      tl.fromTo("#s11-q2", {{ opacity: 0 }}, {{ opacity: 1, duration: .4 }}, {at(sc, "voce", .7)});
      tl.fromTo("#s11-a", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .4 }}, {at(sc, "normal", -.5)});
      tl.fromTo("#s11-b", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .4 }}, {at(sc, "antimagia10", -.6)});
      tl.fromTo("#s11-c", {{ opacity: 0 }}, {{ opacity: 1, duration: .4 }}, {at(sc, "comenta")});
      tl.fromTo("#s11-c", {{ y: 0 }}, {{ y: 10, duration: .4, yoyo: true, repeat: 7, ease: "sine.inOut", immediateRender: false }}, {at(sc, "comenta", .5)});'''
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
      .cbox { display:inline-block; padding:8px 18px; background:rgba(6,8,12,.6); font-family:Montserrat; font-weight:800; font-size:50px; line-height:1.15; color:#fff;
        text-transform:uppercase; text-shadow:0 3px 10px rgba(0,0,0,.9); max-width:840px; }'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


def sfx_list():
    k = KEYS
    return [("whoosh.mp3", 0.15, .25), ("sparkle.mp3", 1.6, .25), ("impact-bass-2.mp3", k["zero"] - .1, .4), ("glitch-1.mp3", k["pouquinho"], .2),
            ("coracao.wav", k["coracao"] - .2, .35),
            ("whoosh.mp3", PSTART[1] - .1, .3), ("sparkle.mp3", k["nasce1"], .3), ("whoosh-short.mp3", k["grimorio1"] - 1.4, .3),
            ("sparkle.mp3", k["grimorio1"] - .1, .35), ("apagar.wav", k["nada"], .3),
            ("dados.wav", SC["s3-azar"][0] + .05, .55), ("error.mp3", k["nao2"], .35),
            ("corrente.wav", SC["s4-livro"][0] + .05, .4), ("impact-bass-1.mp3", k["demonio3"], .3), ("error.mp3", k["tambem3"], .35),
            ("impact-bass-2.mp3", k["resposta"], .35), ("sparkle.mp3", k["richita"], .35), ("previsao.wav", k["absorvia"] - .3, .3),
            ("apagar.wav", k["absorveu"], .35), ("coracao.wav", k["filho5"] - .6, .3), ("impact-bass-1.mp3", k["gota"], .35),
            ("chuva.wav", SC["s7-igreja"][0], .32), ("toc.wav", k["deixou"] + .2, .3), ("toc.wav", k["deixou"] + .6, .25), ("volta.wav", k["voltou"], .28),
            ("whoosh.mp3", PSTART[7] - .1, .25), ("glitch-1.mp3", k["demonio7"], .25), ("error.mp3", k["humilhado"], .25),
            ("sparkle.mp3", k["nome7"], .3), ("impact-bass-2.mp3", k["liebe"], .4),
            ("whoosh.mp3", PSTART[8] + .5, .35), ("whoosh-short.mp3", k["grimorio8"], .3), ("sparkle.mp3", k["grimorio8"] + .5, .35),
            ("impact-bass-1.mp3", k["encontraram"], .35),
            ("impact-bass-2.mp3", k["antimagia9"], .45), ("onda.wav", k["antimagia9"], .45), ("apagar.wav", k["corta"], .3),
            ("impact-bass-1.mp3", k["pesadelo"], .4),
            ("whoosh.mp3", PSTART[10] - .1, .3), ("sparkle.mp3", k["normal"] - .4, .3), ("whoosh-short.mp3", k["antimagia10"] - .5, .3), ("pop.mp3", k["comenta"], .3)]


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
        f'      <audio id="trilha" class="clip" src="{MUSIC}" data-start="0" data-duration="{TOTAL}" data-volume="0.28" data-fade-out="2" data-track-index="5"></audio>',
    ]
    lanes = []
    for i, (f, st, vol) in enumerate(sfx_list()):
        st = round(max(0, st), 2)
        d = round(min(dur(os.path.join(ROOT, "assets/sfx", f)), TOTAL - st, 8.0 if f == "chuva.wav" else 2.5), 2)
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
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #05060c; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
      #c3d {{ position: absolute; inset: 0; width: 1080px; height: 1920px; z-index: 0; }}
      .fontwarm {{ position: absolute; left: -9999px; top: 0; }}
    </style>
  </head>
  <body>
    <!-- Por que o Asta nasceu sem magia? — 3D (gerado por tools/build_asta.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920" data-layout-allow-overflow></canvas>
      <div class="fontwarm" data-layout-allow-overflow><span style="font-family:'Space Mono';font-weight:700">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/asta3d.js"></script>
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
        json.dump({"id": "asta", "name": "Por que o Asta nasceu sem magia? (3D)", "createdAt": "2026-11-08T21:30:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, "swell", round(PSTART[9], 2))
    for n, s, e in SCENES:
        print(f"  {n:15s} {s:6.2f} → {e:6.2f}  ({e - s:.1f}s)")
