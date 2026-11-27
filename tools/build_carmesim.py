"""Gera o episódio 3D sério "E se você tivesse esse poder na vida real?" em carmesim/.

O 3D (Three.js) fica em carmesim/assets/carmesim3d.js e é desenhado a partir do tempo.
Este script gera os tempos-chave, os textos por cena (estilo documentário), as
legendas sóbrias e a raiz com voz, trilha sintetizada e efeitos.
Uso: python3 tools/build_carmesim.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from hq_lib import scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "carmesim")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-carmesim.wav"
CRIM, GOLD, ICE = "#ff2a4a", "#ffc94a", "#9fd8ff"

PARS = [
    "Imagina acordar|e perceber que tem alguma coisa|atrás de você.|Um espírito que apaga|11 segundos do tempo…|e mostra 7 segundos do futuro.|Não num anime.|Na vida real.",
    "O primeiro uso é por instinto.|Uma faixa de pedestres.|A visão mostra|um carro furando o sinal.|Você apaga o tempo…|e quando ele volta,|você já está|do outro lado da rua.",
    "Só que a vida real|tem câmeras.|No dia seguinte,|um vídeo seu desaparecendo|no meio da rua|tem 2 milhões de visualizações.|E ninguém consegue explicar.",
    "Num ônibus,|a visão mostra um assalto.|Você apaga o tempo pra impedir…|mas descobre|a regra mais cruel do poder:|no tempo apagado,|você não consegue|tocar em ninguém.|Só consegue|salvar a si mesmo.",
    "Em casa,|uma briga com o seu pai.|Você apaga|os 11 segundos mais difíceis|da conversa.|Mas foi nesses 11 segundos…|que ele pediu desculpa.|E você nunca ouviu.",
    "Então chega um momento|em que o poder|não serve pra nada.|A visão mostra|o seu avô caindo na escada.|Se apagar o tempo,|não pode segurar ele.|Então você corre.|No tempo de verdade.|E segura.",
    "No fim do dia,|você soma:|4 minutos e 37 segundos|da sua vida|que nunca existiram pra você.|E nenhum deles fez falta…|menos um.",
    "O poder de pular o pior momento|parece um presente.|Mas a vida real|não tem só os momentos bons.|E às vezes…|o pior momento|é exatamente|o que você precisava viver.",
    "E você?|Usaria esse poder todo dia…|ou nunca usaria?|Comenta A ou B.",
]
FIX = {"eninguem": ["e", "ninguem"], "evoce": ["e", "voce"], "esegura": ["e", "segura"], "enenhum": ["e", "nenhum"], "para": ["pra"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-acorda", "s2-rua", "s3-camera", "s4-onibus", "s5-pai", "s6-avo", "s7-preco", "s8-telhado", "s9-pergunta"]
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
    "atras": W(0, "atras"), "espirito": W(0, "espirito"), "anime": W(0, "anime"),
    "visao1": W(1, "visao"), "carro": W(1, "carro"), "apaga1": W(1, "apaga"), "volta1": W(1, "volta"), "outro": W(1, "outro"),
    "cameras": W(2, "cameras"), "video": W(2, "video"), "milhoes": W(2, "milhoes"),
    "assalto": W(3, "assalto"), "apaga3": W(3, "apaga"), "regra": W(3, "regra"), "tocar": W(3, "tocar"), "salvar": W(3, "salvar"),
    "briga": W(4, "briga"), "apaga4": W(4, "apaga"), "desculpa": W(4, "desculpa"), "nunca4": W(4, "nunca"),
    "visao5": W(5, "visao"), "corre": W(5, "corre"), "segura": W(5, "segura", 1),
    "soma": W(6, "soma"), "minutos": W(6, "minutos"), "menos": W(6, "menos"),
    "presente": W(7, "presente"), "viver": W(7, "viver"),
    "usaria": W(8, "usaria"), "nunca8": W(8, "nunca"), "comenta": W(8, "comenta"),
}
ERASE = [(KEYS["apaga1"], KEYS["volta1"]), (KEYS["apaga3"], KEYS["salvar"] + .6), (KEYS["apaga4"], KEYS["desculpa"] + 1.6)]


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


CSS = f'''#root {{ background: transparent; }}
  .lbl {{ position:absolute; font-family:'Space Mono',monospace; font-weight:700; color:#fff; letter-spacing:.06em; text-transform:uppercase;
    background:rgba(8,6,14,.72); border-left:8px solid {CRIM}; padding:10px 22px; font-size:38px; }}
  .big {{ position:absolute; left:0; right:0; text-align:center; font-family:'Archivo Black'; color:#fff; letter-spacing:.02em; text-shadow:0 6px 24px rgba(0,0,0,.8); }}
  .tint {{ position:absolute; inset:0; background:radial-gradient(circle at 50% 45%, rgba(120,0,20,.15), rgba(90,0,15,.75)); mix-blend-mode:multiply; opacity:0; }}
  .scan {{ position:absolute; inset:0; opacity:0; background:repeating-linear-gradient(0deg, rgba(255,40,70,.18) 0 2px, rgba(0,0,0,0) 2px 7px); }}
  .clk {{ position:absolute; right:70px; top:200px; font-family:'Space Mono',monospace; font-weight:700; font-size:54px; color:{CRIM}; background:rgba(8,6,14,.8); border:4px solid {CRIM}; padding:4px 18px; opacity:0; }}
  .win {{ position:absolute; left:120px; top:330px; width:840px; height:560px; border:6px solid {ICE}; box-shadow:0 0 40px rgba(159,216,255,.6), inset 0 0 60px rgba(159,216,255,.35); opacity:0; }}
  .win .t {{ position:absolute; left:16px; top:10px; font-family:'Space Mono',monospace; font-weight:700; font-size:40px; color:{ICE}; }}'''


def ov(sc, body, js):
    write(sc, scene(sc, body, js, CSS, bg="transparent"))


def erase_fx(sc, a, b):
    """Efeito do tempo apagado (tinta vermelha, linhas e relógio que salta 11 s)."""
    t0 = SC[sc][0]
    a, b = round(a - t0, 2), round(b - t0, 2)
    body = f'''<div id="{sc}-tint" class="tint" style="z-index:1"></div><div id="{sc}-scan" class="scan" style="z-index:1"></div>
    <div id="{sc}-clk" class="clk" style="z-index:6">⏱ <span id="{sc}-n">00:00</span></div>'''
    js = f'''
      tl.fromTo(["#{sc}-tint", "#{sc}-scan"], {{ opacity: 0 }}, {{ opacity: 1, duration: .25 }}, {a});
      tl.to(["#{sc}-tint", "#{sc}-scan"], {{ opacity: 0, duration: .3 }}, {b});
      tl.fromTo("#{sc}-clk", {{ opacity: 0 }}, {{ opacity: 1, duration: .2 }}, {a});
      tl.set("#{sc}-n", {{ textContent: "00:11" }}, {b - .05});
      tl.fromTo("#{sc}-clk", {{ scale: 1 }}, {{ scale: 1.25, duration: .12, yoyo: true, repeat: 1 }}, {b - .05});
      tl.to("#{sc}-clk", {{ opacity: 0, duration: .3 }}, {b + .9});'''
    return body, js


def vision(sc, at, dur=1.8, label="PREVISÃO: +7 s"):
    t0 = SC[sc][0]
    a = round(at - t0, 2)
    body = f'''<div id="{sc}-win" class="win" style="z-index:5"><div class="t">◉ {label}</div></div>'''
    js = f'''
      tl.fromTo("#{sc}-win", {{ opacity: 0, scale: 1.08 }}, {{ opacity: 1, scale: 1, duration: .25 }}, {a});
      tl.fromTo("#{sc}-win", {{ x: 0 }}, {{ x: 4, duration: .05, repeat: 5, yoyo: true, ease: "none", immediateRender: false }}, {a + .2});
      tl.to("#{sc}-win", {{ opacity: 0, duration: .3 }}, {a + dur});'''
    return body, js


def lbl(cid, text, left, top, at, sc, color=CRIM, size=38):
    t0 = SC[sc][0]
    return (f'<div id="{cid}" class="lbl" style="left:{left}px;top:{top}px;z-index:7;border-left-color:{color};font-size:{size}px;opacity:0">{text}</div>',
            f'tl.fromTo("#{cid}", {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: .3 }}, {round(at - t0, 2)});')


# ------------------------------------------------------------------ textos por cena
def s1():
    sc = "s1-acorda"
    l1 = lbl("s1-l1", "03:00 · QUARTO", 70, 200, .4, sc, ICE)
    body = f'''{l1[0]}
    <div class="big" id="s1-t" style="top:330px;font-size:78px;line-height:1.1;opacity:0">11 s <span style="color:{CRIM}">APAGADOS</span><br>7 s DE <span style="color:{ICE}">FUTURO</span></div>'''
    js = f'''{l1[1]}
      tl.fromTo("#s1-t", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: .5 }}, {KEYS["espirito"]});
      tl.to("#s1-t", {{ opacity: 0, duration: .4 }}, {KEYS["anime"] - .3});'''
    ov(sc, body, js)


def s2():
    sc = "s2-rua"
    e = erase_fx(sc, *ERASE[0]); v = vision(sc, KEYS["visao1"], KEYS["apaga1"] - KEYS["visao1"] - .1)
    l1 = lbl("s2-l1", "TEMPO APAGADO", 70, 290, KEYS["apaga1"] + .1, sc)
    body = e[0] + v[0] + l1[0]
    js = e[1] + v[1] + l1[1] + f'''
      tl.to("#s2-l1", {{ opacity: 0, duration: .3 }}, {KEYS["volta1"] - SC[sc][0]});'''
    ov(sc, body, js)


def s3():
    sc = "s3-camera"
    t0 = SC[sc][0]
    phone = f'''<div id="s3-ph" style="position:absolute;left:200px;top:330px;width:680px;height:880px;z-index:5;opacity:0;border-radius:60px;background:#0b0b10;border:12px solid #222;box-shadow:0 30px 80px rgba(0,0,0,.7);overflow:hidden">
      <div style="height:440px;background:linear-gradient(#1a1f3d,#0a0d18);position:relative">
        <div style="position:absolute;left:24px;top:20px;font-family:'Space Mono';font-weight:700;font-size:28px;color:{CRIM}">● CAM 07 · 23:41</div>
        <div id="s3-fig" style="position:absolute;left:300px;top:200px;width:60px;height:160px;border-radius:30px 30px 8px 8px;background:#3a3f4b"></div>
        <div style="position:absolute;left:0;right:0;bottom:30px;height:60px;background:repeating-linear-gradient(90deg,#e6e6e6 0 40px,transparent 40px 70px);opacity:.6"></div></div>
      <div style="padding:26px 30px;font-family:Inter;color:#fff">
        <div style="font-weight:800;font-size:44px;line-height:1.15">HOMEM SOME E REAPARECE NO MEIO DA RUA 😳</div>
        <div style="margin-top:20px;font-size:36px;color:#aaa">👁 <span id="s3-v" style="color:#fff;font-weight:800">0</span> visualizações</div>
        <div style="margin-top:14px;font-size:30px;color:#888">"isso é edição" · "eu tava lá" · "explica isso"</div></div></div>'''
    body = phone
    js = f'''
      tl.fromTo("#s3-ph", {{ opacity: 0, y: 200 }}, {{ opacity: 1, y: 0, duration: .5, ease: "power3.out" }}, {KEYS["video"] - t0 - .2});
      tl.fromTo("#s3-fig", {{ opacity: 1 }}, {{ opacity: 0, duration: .05, repeat: 5, yoyo: true, ease: "steps(1)" }}, {KEYS["video"] - t0 + .8});
      tl.fromTo("#s3-v", {{ innerText: 0 }}, {{ innerText: 2300000, duration: 2.2, snap: {{ innerText: 1000 }}, ease: "power2.out",
        onUpdate: function () {{ const el = document.querySelector("#s3-v"); const v = Math.round(this.targets()[0].innerText || 0); el.textContent = v >= 1e6 ? (v / 1e6).toFixed(1).replace(".", ",") + " mi" : Math.round(v / 1000) + " mil"; }} }}, {KEYS["milhoes"] - t0 - 1.2});'''
    ov(sc, body, js)


def s4():
    sc = "s4-onibus"
    e = erase_fx(sc, *ERASE[1]); v = vision(sc, KEYS["assalto"] - .3, KEYS["apaga3"] - KEYS["assalto"])
    l1 = lbl("s4-l1", "NO TEMPO APAGADO:<br>NÃO DÁ PRA TOCAR EM NADA", 70, 300, KEYS["tocar"], sc, CRIM, 36)
    ov(sc, e[0] + v[0] + l1[0], e[1] + v[1] + l1[1])


def s5():
    sc = "s5-pai"
    t0 = SC[sc][0]
    e = erase_fx(sc, *ERASE[2])
    body = e[0] + f'''<div id="s5-ap" class="big" style="top:820px;font-family:'Space Mono';font-weight:700;font-size:56px;color:#ffd7dc;opacity:0;letter-spacing:.04em">"…me desculpa, filho."</div>'''
    js = e[1] + f'''
      tl.fromTo("#s5-ap", {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: .9, filter: "blur(0px)", duration: .8 }}, {KEYS["desculpa"] - t0 - .2});
      tl.to("#s5-ap", {{ opacity: 0, filter: "blur(12px)", duration: 1 }}, {KEYS["desculpa"] - t0 + 1.4});'''
    ov(sc, body, js)


def s6():
    sc = "s6-avo"
    v = vision(sc, KEYS["visao5"], KEYS["corre"] - KEYS["visao5"] - .3)
    l1 = lbl("s6-l1", "SEM PODER. SÓ VOCÊ.", 70, 300, KEYS["corre"], sc, GOLD, 42)
    ov(sc, v[0] + l1[0], v[1] + l1[1])


def s7():
    sc = "s7-preco"
    t0 = SC[sc][0]
    body = f'''<div class="big" style="top:300px;font-family:'Space Mono';font-weight:700;font-size:40px;color:{ICE}">TEMPO APAGADO HOJE</div>
    <div class="big" id="s7-n" style="top:370px;font-size:120px;color:{CRIM};opacity:0">4 min 37 s</div>
    <div class="big" id="s7-m" style="top:540px;font-family:'Space Mono';font-weight:700;font-size:40px;color:{GOLD};opacity:0">1 TRECHO FEZ FALTA</div>'''
    js = f'''
      tl.fromTo("#s7-n", {{ opacity: 0, scale: .9 }}, {{ opacity: 1, scale: 1, duration: .5 }}, {KEYS["minutos"] - t0 - .3});
      tl.fromTo("#s7-m", {{ opacity: 0 }}, {{ opacity: 1, duration: .4 }}, {KEYS["menos"] - t0});'''
    ov(sc, body, js)


def s8():
    sc = "s8-telhado"
    ov(sc, '<div></div>', '')


def s9():
    sc = "s9-pergunta"
    t0 = SC[sc][0]

    def card(k, letter, col, title, x):
        return f'''<div id="s9-{k}" style="position:absolute;left:{x}px;top:1380px;width:400px;z-index:4;opacity:0">
          <div style="background:rgba(8,6,14,.82);border:4px solid {col};box-shadow:0 0 30px {col}66;padding:26px 18px;text-align:center">
            <div style="font-family:'Space Mono';font-weight:700;font-size:60px;color:{col}">{letter}</div>
            <div style="font-family:'Archivo Black';font-size:44px;line-height:1.1;color:#fff;margin-top:6px">{title}</div></div></div>'''
    body = f'''
    <div class="big" style="top:250px;font-size:76px">E VOCÊ?</div>
    {card("a", "A", CRIM, "USARIA<br>TODO DIA ⏩", 90)}
    {card("b", "B", ICE, "NUNCA<br>USARIA 🚫", 590)}
    <div class="big" id="s9-c" style="top:1700px;font-family:'Space Mono';font-weight:700;font-size:54px;opacity:0">COMENTA A OU B ↓</div>'''
    js = f'''
      tl.fromTo("#s9-a", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .4 }}, {KEYS["usaria"] - t0});
      tl.fromTo("#s9-b", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .4 }}, {KEYS["nunca8"] - t0});
      tl.fromTo("#s9-c", {{ opacity: 0 }}, {{ opacity: 1, duration: .4 }}, {KEYS["comenta"] - t0});'''
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
      .cbox { display:inline-block; padding:8px 18px; background:rgba(6,5,10,.55); font-family:Montserrat; font-weight:800; font-size:50px; line-height:1.15; color:#fff;
        text-transform:uppercase; text-shadow:0 3px 10px rgba(0,0,0,.9); max-width:840px; }'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


def sfx_list():
    out = [("whoosh.mp3", 0.0, .25), ("previsao.wav", KEYS["espirito"], .35)]
    for a, b in ERASE:
        out += [("apagar.wav", a - .9, .5), ("volta.wav", b - .1, .45)]
    out += [("previsao.wav", KEYS["visao1"], .4), ("previsao.wav", KEYS["assalto"] - .3, .4), ("previsao.wav", KEYS["visao5"], .4),
            ("notification.mp3", KEYS["video"] - .2, .3), ("impact-bass-2.mp3", KEYS["regra"], .4), ("impact-bass-1.mp3", KEYS["segura"], .45),
            ("glitch-1.mp3", KEYS["minutos"] - .3, .25), ("impact-bass-1.mp3", KEYS["menos"], .35), ("whoosh.mp3", KEYS["usaria"], .3)]
    return out


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
        f'      <audio id="trilha" class="clip" src="assets/music/trilha-carmesim.wav" data-start="0" data-duration="{TOTAL}" data-volume="0.32" data-fade-out="2" data-track-index="5"></audio>',
    ]
    lanes = []
    for i, (f, st, vol) in enumerate(sfx_list()):
        st = round(max(0, st), 2)
        d = round(min(dur(os.path.join(ROOT, "assets/sfx", f)), TOTAL - st, 2.5), 2)
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
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #06050a; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
      #c3d {{ position: absolute; inset: 0; width: 1080px; height: 1920px; z-index: 0; }}
      .fontwarm {{ position: absolute; left: -9999px; top: 0; }}
    </style>
  </head>
  <body>
    <!-- E se você tivesse esse poder na vida real? — 3D (gerado por tools/build_carmesim.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <canvas id="c3d" width="1080" height="1920"></canvas>
      <div class="fontwarm"><span style="font-family:'Space Mono';font-weight:700">A</span></div>
{nl.join(hosts)}
{nl.join(audio)}
    </div>
    <script type="module" src="assets/carmesim3d.js"></script>
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
        json.dump({"id": "carmesim", "name": "E se você tivesse esse poder na vida real? (3D)", "createdAt": "2026-11-07T23:45:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, SCENES)
