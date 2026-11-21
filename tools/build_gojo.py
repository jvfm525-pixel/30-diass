"""Monta o projeto HyperFrames do vídeo do Gojo (camada de texto + áudio sobre o 3D renderizado pelo Remotion).
Estilo da animação de referência (GUIA-ANIMACAO-ESTILO.md):
  - legenda por frase em serifa itálica branca no terço de cima, com mancha escura desfocada atrás, fade de ~0,3 s;
  - cabeçalho de capítulo em versalete entre traços ("— A JAULA —"); quem fala em lilás; fichas de citação tipo etiqueta;
  - título no começo com a palavra-tema maior em lilás.
Uso: python3 tools/build_gojo.py   (precisa de gojo/assets/timing.js; a trilha e os efeitos vêm de tools/som_gojo.py)
"""
import json
import os
import shutil
import subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
P = os.path.join(ROOT, "gojo")
s = open(os.path.join(P, "assets/timing.js")).read()
T = json.loads(s[s.index("{"):s.rindex("}") + 1])
K, TOTAL = T["k"], T["total"]
SC_ = T["sc"]
PAR = T.get("par", SC_)
LIL = "#8ad8ff"  # azul dos Seis Olhos


def dur(path):
    try:
        return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).decode().strip())
    except Exception:
        return 1.0


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ---------------------------------------------------------------- elementos de texto
els, js = [], []


def add(html, script=""):
    els.append(html)
    if script:
        js.append(script)


# título (0,75 → pouco antes da 2ª frase)
import sys as _s; _s.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import gojo_texto as GT
N1 = 1
t0, t1 = 0.75, K["vencido"] - 0.3
add(f'''<div id="titulo" class="clip titulo" data-start="{t0}" data-duration="{t1 - t0:.2f}">
  <div class="tl1">Por que o</div><div class="tl2">GOJO</div><div class="tl3">FICOU PRESO</div><div class="tl1">tanto tempo?</div></div>''',
    f'tl.fromTo("#titulo",{{opacity:0,y:20}},{{opacity:1,y:0,duration:.6,ease:"power2.out"}},{t0});'
    f'tl.fromTo("#titulo .tl3",{{opacity:0,scale:1.3}},{{opacity:1,scale:1,duration:.45,ease:"back.out(2)"}},{t0 + 0.3:.2f});'
    f'tl.to("#titulo",{{opacity:0,duration:.35}},{t1 - 0.35:.2f});')

# cabeçalhos de capítulo
caps_t = {}
for i, (tc, nome) in enumerate(T["caps"]):
    a, b = tc, tc + 2.6
    caps_t[nome] = (a, b)
    estilo = ' style="font-size:34px;letter-spacing:.2em"' if len(nome) > 16 else ""
    add(f'<div id="cap{i}" class="clip cap"{estilo} data-start="{a:.2f}" data-duration="{b - a:.2f}">— {esc(nome)} —</div>',
        f'tl.fromTo("#cap{i}",{{opacity:0,scale:1.06}},{{opacity:1,scale:1,duration:.7,ease:"power2.out"}},{a:.2f});'
        f'tl.to("#cap{i}",{{opacity:0,duration:.4}},{b - 0.4:.2f});')


def em_capitulo(t):
    return any(a - 0.05 <= t <= b for a, b in caps_t.values())


# legendas por frase (a 1ª fica escondida enquanto o título está na tela? não: o título é a própria pergunta → pula as 2 primeiras)
for i, (a, b, f) in enumerate(T["legendas"]):
    if i < N1:
        continue
    fala = ""
    txt = esc(f)
    if "siga em frente" in f.lower():
        fala = '<span class="quem">EREN:</span> '
        txt = '“' + txt + '”'
    top = 330 if em_capitulo(a) else 250
    add(f'<div id="lg{i}" class="clip leg" data-start="{a:.2f}" data-duration="{b - a:.2f}" style="top:{top}px"><div class="mancha"></div><div class="lt">{fala}{txt}</div></div>',
        f'tl.fromTo("#lg{i}",{{opacity:0}},{{opacity:1,duration:.25}},{(max(a, t1 - 0.05) if i == N1 else a):.2f});tl.to("#lg{i}",{{opacity:0,duration:.25}},{max(a + 0.3, b - 0.25):.2f});')

# fichas de citação (etiqueta de museu)
fichas = [
    ("f1", K["restos"] - 0.1, K["energia"] + 0.4, "Genshin · 942–1017", "monge budista japonês, de verdade", "escreveu o livro que descreveu o inferno"),
    ("f2", K["budismo"] - 0.2, K["apego"] + 0.9, "Budismo", "a segunda nobre verdade", "a origem do sofrimento é o apego"),
    ("f3", K["real"] - 0.2, K["capitulos"] + 1.2, "Jujutsu Kaisen", "selado no cap. 90 · jan/2020", "solto no cap. 221 · abr/2023"),
]
for fid, a, b, autor, obra, nota in fichas:
    add(f'<div id="{fid}" class="clip ficha" data-start="{a:.2f}" data-duration="{b - a:.2f}"><div class="fa">{esc(autor)}</div><div class="fo">{esc(obra)}</div><div class="fn">{esc(nota)}</div></div>',
        f'tl.fromTo("#{fid}",{{opacity:0,y:14}},{{opacity:1,y:0,duration:.45,ease:"power2.out"}},{a:.2f});tl.to("#{fid}",{{opacity:0,duration:.35}},{b - 0.35:.2f});')

# selo do Discord
a, b = K["link"] - 0.1, PAR["s7-discord"][1] + 0.2
add(f'<div id="disc" class="clip disc" data-start="{a:.2f}" data-duration="{b - a:.2f}"><div class="d1">DISCORD</div><div class="d3">link na bio</div></div>',
    f'tl.fromTo("#disc",{{opacity:0,scale:.92}},{{opacity:1,scale:1,duration:.35,ease:"back.out(1.6)"}},{a:.2f});tl.to("#disc",{{opacity:0,duration:.25}},{b - 0.25:.2f});')

texto = f'''<template>
  <style>
    @font-face {{ font-family: "EB Garamond"; src: url("../assets/fonts/EBGaramond-400.woff2") format("woff2"); font-weight: 400; }}
    @font-face {{ font-family: "EB Garamond"; src: url("../assets/fonts/EBGaramond-700.woff2") format("woff2"); font-weight: 700; }}
    @font-face {{ font-family: "Cinzel"; src: url("../assets/fonts/cinzel-900.woff2") format("woff2"); font-weight: 900; }}
    #root {{ position:absolute; inset:0; overflow:hidden; background:transparent; }}
    .titulo {{ position:absolute; left:0; right:0; top:560px; text-align:center; color:#fff; text-shadow:0 4px 30px rgba(0,0,0,.85); }}
    .tl1 {{ font-family:"EB Garamond"; font-style:italic; font-size:72px; line-height:1.05; }}
    .tl2 {{ font-family:"Cinzel"; font-weight:900; font-size:118px; letter-spacing:.06em; line-height:1.05; }}
    .tl3 {{ font-family:"Cinzel"; font-weight:900; font-size:104px; letter-spacing:.03em; color:{LIL}; line-height:1.1; white-space:nowrap; text-shadow:0 0 40px rgba(110,210,255,.55), 0 4px 30px rgba(0,0,0,.85); }}
    .cap {{ position:absolute; left:0; right:0; top:200px; text-align:center; font-family:"Cinzel"; font-weight:900; font-size:44px;
            color:#f2ece0; letter-spacing:.32em; text-shadow:0 2px 18px rgba(0,0,0,.9); white-space:nowrap; }}
    .leg {{ position:absolute; left:70px; right:70px; text-align:center; }}
    .mancha {{ position:absolute; left:-60px; right:-60px; top:-50px; bottom:-50px; background:url("../assets/img/mancha.png") center / 100% 100% no-repeat; }}
    .lt {{ position:relative; font-family:"EB Garamond"; font-style:italic; font-weight:700; font-size:62px; line-height:1.18; color:#fff;
           text-shadow:0 2px 10px rgba(0,0,0,.8); }}
    .quem {{ font-family:"Cinzel"; font-style:normal; font-weight:900; font-size:46px; letter-spacing:.08em; color:{LIL}; }}
    .ficha {{ position:absolute; left:240px; width:600px; top:1290px; padding:22px 30px; border-radius:18px; background:rgba(12,10,16,.78);
              border:2px solid rgba(255,245,230,.55); text-align:center; color:#fff; }}
    .fa {{ font-family:"EB Garamond"; font-weight:700; font-size:44px; }}
    .fo {{ font-family:"EB Garamond"; font-style:italic; font-size:38px; color:#e8e0d0; }}
    .fn {{ font-family:"EB Garamond"; font-style:italic; font-size:30px; color:{LIL}; margin-top:6px; }}
    .disc {{ position:absolute; left:190px; width:700px; top:1250px; padding:26px 30px; border-radius:22px; background:rgba(20,40,28,.82);
             border:2px solid {LIL}; text-align:center; color:#fff; box-shadow:0 0 50px rgba(120,255,160,.35); }}
    .d1 {{ font-family:"Cinzel"; font-weight:900; font-size:40px; letter-spacing:.06em; white-space:nowrap; }}
    .d2 {{ font-family:"EB Garamond"; font-style:italic; font-weight:700; font-size:50px; color:{LIL}; }}
    .bal {{ position:absolute; left:330px; top:1120px; padding:16px 34px; border-radius:26px; background:#fff; color:#2a2440; font-family:"EB Garamond"; font-weight:700; font-size:44px; box-shadow:0 6px 24px rgba(0,0,0,.35); }}
    .d3 {{ font-family:"EB Garamond"; font-style:italic; font-size:40px; margin-top:4px; }}
  </style>
  <div id="root" data-composition-id="texto" data-width="1080" data-height="1920">
{chr(10).join(els)}
  </div>
  <script>
    (function () {{
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join("      " + j for j in js)}
      window.__timelines["texto"] = tl;
    }})();
  </script>
</template>
'''
os.makedirs(os.path.join(P, "compositions"), exist_ok=True)
open(os.path.join(P, "compositions/texto.html"), "w").write(texto)

# ---------------------------------------------------------------- áudio
aud = []
voz = os.path.join(P, "assets/voice/narracao-gojo.wav")
aud.append(f'<audio id="voz" class="clip" src="assets/voice/narracao-gojo.wav" data-start="{T["capa"]}" data-duration="{dur(voz):.2f}" data-volume="1" data-track-index="4"></audio>')
tr = os.path.join(P, "assets/music/trilha-gojo.wav")
if os.path.exists(tr):
    aud.append(f'<audio id="trilha" class="clip" src="assets/music/trilha-gojo.wav" data-start="0" data-duration="{min(TOTAL, dur(tr)):.2f}" data-volume="0.3" data-fade-out="1.5" data-track-index="5"></audio>')
sf = os.path.join(P, "assets/sfx/lista.json")
if os.path.exists(sf):
    livre = []  # fim do último som em cada trilha (sem sobrepor sons na mesma trilha)
    for i, (nome, t, vol) in enumerate(sorted(json.load(open(sf)), key=lambda x: x[1])):
        f = os.path.join(P, "assets/sfx", nome); d = min(dur(f), TOTAL - t - 0.01)
        tr_ = next((j for j, fim in enumerate(livre) if fim <= t), None)
        if tr_ is None:
            livre.append(0.0); tr_ = len(livre) - 1
        livre[tr_] = t + d + 0.02
        aud.append(f'<audio id="sfx-{i:02d}" class="clip" src="assets/sfx/{nome}" data-start="{t:.2f}" data-duration="{d:.2f}" data-volume="{vol}" data-track-index="{6 + tr_}"></audio>')

index = f'''<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #06060c; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
    </style>
  </head>
  <body>
    <!-- Por que o Gojo ficou preso no Reino da Prisão por tanto tempo? — 3D (Three.js + Remotion) + texto e áudio (HyperFrames). Gerado por tools/build_gojo.py -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <video id="c3d" class="clip" src="assets/3d.mp4" data-start="0" data-duration="{TOTAL}" muted playsinline data-track-index="0" style="position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover"></video>
      <div id="texto" data-composition-id="texto" data-composition-src="compositions/texto.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="1" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:10"></div>
      {chr(10).join("      " + x for x in aud)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''
open(os.path.join(P, "index.html"), "w").write(index)

# arquivos do projeto
os.makedirs(os.path.join(P, "assets/img"), exist_ok=True)
from PIL import Image, ImageDraw, ImageFilter  # mancha escura desfocada em elipse (atrás da legenda), pré-renderizada
im = Image.new("RGBA", (600, 240), (0, 0, 0, 0)); ImageDraw.Draw(im).ellipse((60, 50, 540, 190), fill=(0, 0, 0, 165))
im.filter(ImageFilter.GaussianBlur(34)).save(os.path.join(P, "assets/img/mancha.png"))
for src, dst in [("kira/assets/vendor/gsap.min.js", "assets/vendor/gsap.min.js"), ("kira/assets/fonts/cinzel-900.woff2", "assets/fonts/cinzel-900.woff2")]:
    os.makedirs(os.path.dirname(os.path.join(P, dst)), exist_ok=True)
    shutil.copy(os.path.join(ROOT, src), os.path.join(P, dst))
for w in ("400", "700"):
    import glob
    g = glob.glob(f"/root/.npm/_npx/*/node_modules/hyperframes/dist/skills/hyperframes/assets/frame-presets/code-editorial/fonts/EBGaramond-{w}.woff2")
    if g:
        shutil.copy(g[0], os.path.join(P, f"assets/fonts/EBGaramond-{w}.woff2"))
for f in ("package.json", "hyperframes.json"):
    d = open(os.path.join(ROOT, "kira", f)).read().replace('"kira"', '"gojo"').replace("kira-", "gojo-")
    open(os.path.join(P, f), "w").write(d)
open(os.path.join(P, "meta.json"), "w").write(json.dumps({"id": "gojo-reino-prisao", "name": "Por que o Gojo ficou preso no Reino da Prisão por tanto tempo?"}, ensure_ascii=False))
print("ok", len(els), "elementos de texto,", len(aud), "trilhas de áudio, total", TOTAL)
