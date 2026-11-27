"""Vídeo promocional do servidor VEXORA (Discord), estilo editado: texto cinético, telas do Discord recriadas, memes.
Gera discord-promo/index.html, compositions/cenas.html e compositions/legendas.html a partir da transcrição.
Uso: python3 tools/build_vexora.py   (depois: python3 tools/som_vexora.py para trilha e efeitos)
"""
import json, os, re, unicodedata
from difflib import SequenceMatcher

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
P = os.path.join(ROOT, "discord-promo")
TR = json.load(open(os.path.join(P, "assets/voice/transcript.json")))
TOTAL = 90.4

ROTEIRO = open(os.path.join(P, "ROTEIRO-VEXORA.md")).read()
falado = ROTEIRO[ROTEIRO.index("```") + 3:]
falado = falado[:falado.index("```")]
falado = re.sub(r"\[[a-z]+\]", " ", falado)


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in w if unicodedata.category(c) != "Mn"))


# palavras do roteiro (com a grafia certa) ← tempos da transcrição
ws = falado.split()
FIX = {"eo": "e o", "equem": "e quem", "ese": "e se", "bote": "bot", "lógi": "loja", "logi": "loja", "stinky": "steam key", "skiwishu": "skill issue", "vicoes": "vcoins", "sundin": "sung jin"}
tr = []
for x in TR:
    for i, p in enumerate(FIX.get(norm(x["text"]), norm(x["text"])).split()):
        tr.append((p, x["start"], x["end"]))
a = [norm(w) for w in ws]
b = [t[0] for t in tr]
tempo = [None] * len(ws)
for blk in SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
    for k in range(blk.size):
        tempo[blk.a + k] = tr[blk.b + k][1]
for i in range(len(ws)):  # sem par: interpola
    if tempo[i] is None:
        p = max([j for j in range(i) if tempo[j] is not None], default=None)
        n = min([j for j in range(i + 1, len(ws)) if tempo[j] is not None], default=None)
        tempo[i] = (tempo[p] + 0.25) if n is None else (tempo[n] - 0.25 * (n - i) if p is None else tempo[p] + (tempo[n] - tempo[p]) * (i - p) / (n - p))

# legendas: grupos de até 3 palavras, quebrando na pontuação
grupos, cur = [], []
for w, t in zip(ws, tempo):
    cur.append((w, t))
    if len(cur) >= 3 or w[-1] in ".,?!:":
        grupos.append(cur); cur = []
if cur: grupos.append(cur)
leg = []
for i, g in enumerate(grupos):
    a0 = g[0][1]; a1 = (grupos[i + 1][0][1] if i + 1 < len(grupos) else TOTAL - 0.5)
    leg.append((a0, min(a1, a0 + 2.2), " ".join(w for w, _ in g)))

DESTAQUE = {"vexora", "pix", "vip", "diamante", "lendario", "gratis", "graca", "cringe", "skill", "issue", "aura", "farming", "vacuo", "zero", "rei", "lanche", "bio", "ranking", "batalha"}
VERM = "#ff2e4d"


def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ---------------------------------------------------------------- legendas
el, js = [], []
for i, (a0, a1, f) in enumerate(leg):
    palavras = []
    for w in f.split():
        cls = ' class="hl"' if norm(w) in DESTAQUE else ""
        palavras.append(f"<span{cls}>{esc(w)}</span>")
    el.append(f'<div id="lg{i}" class="clip lg" data-start="{a0:.2f}" data-duration="{a1 - a0:.2f}"><div class="lt">{" ".join(palavras)}</div></div>')
    js.append(f'tl.fromTo("#lg{i} .lt",{{scale:.6,opacity:0,y:30}},{{scale:1,opacity:1,y:0,duration:.18,ease:"back.out(3)"}},{a0:.2f});')
legendas = f'''<template>
  <style>
    #root {{ position:absolute; inset:0; }}
    .lg {{ position:absolute; left:60px; right:60px; top:1120px; text-align:center; }}
    .lt {{ font-family:"Montserrat"; font-weight:900; font-size:76px; line-height:1.05; color:#fff; text-transform:uppercase;
           -webkit-text-stroke:10px #000; paint-order:stroke fill; text-shadow:0 8px 0 rgba(0,0,0,.55); }}
    .hl {{ color:#ffd23a; }}
  </style>
  <div id="root" data-composition-id="legendas" data-width="1080" data-height="1920">
{chr(10).join(el)}
  </div>
  <script>
    (function(){{ window.__timelines = window.__timelines || {{}}; const tl = gsap.timeline({{ paused: true }});
{chr(10).join("      " + j for j in js)}
      window.__timelines["legendas"] = tl; }})();
  </script>
</template>
'''

# ---------------------------------------------------------------- cenas (uma por trecho do roteiro)
def T(palavra, n=1):  # tempo da n-ésima ocorrência de uma palavra do roteiro
    k = 0
    for w, t in zip(ws, tempo):
        if norm(w) == norm(palavra):
            k += 1
            if k == n: return round(t, 2)
    raise KeyError(palavra)


C, J = [], []
RV, RJ = [], []  # vídeos ficam na raiz (não podem ficar dentro de um elemento temporizado)


def video(wid, cls, vid, src, a, d, anim):
    RV.append(f'<div id="{wid}" class="{cls}"><video id="{vid}" class="clip" src="{src}" data-start="{a:.2f}" data-duration="{d:.2f}" muted playsinline></video></div>')
    RJ.append(f'tl.set("#{wid}",{{opacity:0}},0);tl.set("#{wid}",{{opacity:1}},{a:.2f});tl.set("#{wid}",{{opacity:0}},{a + d:.2f});' + anim)


def cena(cid, a, b, html, anim=""):
    C.append(f'<div id="{cid}" class="clip cena" data-start="{a:.2f}" data-duration="{b - a:.2f}">{html}</div>')
    J.append(f"// {cid}\n" + anim)


K = {k: T(k) for k in ["vexora", "brincadeira", "senta", "aberta", "porque", "tres", "aleatoria", "premium", "triple", "lista", "guia", "preco", "escolheu", "abre", "zero",
                         "privado", "pagou", "entrega", "rapido", "crush", "quem", "vip", "dez", "aura", "ainda", "mas", "anime", "todo", "naruto", "luffy", "goku", "sung",
                         "lendario", "printar", "monta", "desafia", "sobe", "perdeu", "skill", "missao", "deu", "suporte", "ninguem", "ensino", "link", "entra", "cringe"]}
K["vexora2"] = T("vexora", 2); K["vexora3"] = T("vexora", 3); K["zero2"] = T("zero", 2)
FIM = TOTAL

# 1 · gancho
cena("c1", 0, K["aberta"] - 0.6, f'''
  <div class="raios r1"></div>
  <div class="big" id="c1t">VEXORA<span class="q">?</span></div>
  <div class="sub" id="c1s">TÁ DE BRINCADEIRA?</div>''',
     f'''tl.fromTo("#c1t",{{scale:1.5,opacity:1}},{{scale:1,opacity:1,duration:.3,ease:"power4.out"}},0);
tl.fromTo("#c1t",{{x:-14}},{{x:14,duration:.05,repeat:7,yoyo:true}},.25);
tl.fromTo("#c1s",{{y:60,opacity:0}},{{y:0,opacity:1,duration:.2}},{K["brincadeira"] - 0.1});
tl.to("#c1t",{{y:-420,scale:.6,duration:.4,ease:"power3.inOut"}},{K["senta"] - 0.2});
tl.to("#c1s",{{opacity:0,duration:.2}},{K["senta"] - 0.2});
tl.fromTo(".r1",{{rotation:0}},{{rotation:40,duration:{K["aberta"]:.2f},ease:"none"}},0);''')

video("c1logo", "logo", "c1v", "assets/bot/icone.mp4", K["senta"] - 0.2, K["aberta"] - 0.6 - (K["senta"] - 0.2), f'tl.fromTo("#c1logo",{{scale:0,rotation:-30}},{{scale:1,rotation:0,duration:.4,ease:"back.out(2)"}},{K["senta"] - 0.2:.2f});')

# 2 · loja 24h + 3 da manhã
cena("c2", K["aberta"] - 0.6, K["aleatoria"] - 0.3, f'''
  <div class="raios r2"></div>
  <div class="big24" id="c2h">24H</div>
  <div class="relogio" id="c2r">03:00 <small>AM</small></div>
  <div class="meme" id="c2m">você comprando de madrugada:</div>''',
     f'''tl.fromTo("#c2h",{{scale:0}},{{scale:1,duration:.3,ease:"back.out(3)"}},{K["aberta"] - 0.3});
tl.to("#c2h",{{opacity:0,scale:.5,duration:.2}},{K["porque"] - 0.1});
tl.fromTo("#c2m",{{opacity:0,y:20}},{{opacity:1,y:0,duration:.2}},{K["porque"] - 0.2});
tl.fromTo("#c2r",{{scale:2,opacity:0}},{{scale:1,opacity:1,duration:.25,ease:"power4.out"}},{K["porque"]});
tl.fromTo("#c2r",{{x:-10}},{{x:10,duration:.04,repeat:9,yoyo:true}},{K["tres"] + 0.15});''')

video("c2b", "banner", "c2v", "assets/bot/loja.mp4", K["aberta"] - 0.6, K["aleatoria"] - K["aberta"] + 0.3, f'tl.fromTo("#c2b",{{y:-300}},{{y:0,duration:.3,ease:"power3.out"}},{K["aberta"] - 0.6:.2f});')

# 3 · produtos (cartões no ritmo) + preço de lanche
prods = [("aleatoria", "🎮", "KEY SIMPLES ALEATÓRIA", "R$ 2,00", ""), ("premium", "🎮", "STEAM KEY PREMIUM", "R$ 4,00", ""), ("triple", "🦊", "KEY TRIPLE A+++", "R$ 44,90", ""),
         ("lista", "💰", "FORNECEDORES RUSSOS", "R$ 5,40", ""), ("guia", "🤖", "GUIA DE VÍDEOS COM IA", "R$ 29,99", "ebook")]
a3, b3 = K["aleatoria"] - 0.3, K["escolheu"] - 0.3
cards, an = [], []
for i, (k, emo, nome, preco, extra) in enumerate(prods):
    t0 = K[k] - 0.15; t1 = (K[prods[i + 1][0]] - 0.15) if i + 1 < len(prods) else K["preco"] - 0.3
    img = '<img class="ebk" src="assets/ebook.png">' if extra else ""
    cards.append(f'<div class="prod" id="p{i}" data-layout-allow-overlap><div class="pe">{emo}</div>{img}<div class="pn">{nome}</div><div class="pp">{preco}</div><div class="tag">#{i + 1} NA LOJA</div></div>')
    an.append(f'tl.fromTo("#p{i}",{{x:900,rotation:12,opacity:1}},{{x:0,rotation:-2,duration:.28,ease:"power4.out"}},{t0:.2f});'
              f'tl.fromTo("#p{i} .pp",{{scale:2.4}},{{scale:1,duration:.25,ease:"back.out(3)"}},{t0 + 0.3:.2f});'
              f'tl.to("#p{i}",{{x:-900,rotation:-12,duration:.22,ease:"power3.in"}},{t1 - 0.22:.2f});')
cena("c3", a3, b3, f'''
  <div class="raios r3"></div>
  {"".join(cards)}
  <div class="lanche" id="c3l"><div>PREÇO DE <b>LANCHE</b> 🍔</div><div>QUALIDADE DE <b>REI</b> 👑</div></div>''',
     "\n".join(an) + f'''
tl.fromTo("#c3l div:nth-child(1)",{{scale:0}},{{scale:1,duration:.25,ease:"back.out(3)"}},{K["preco"] - 0.1});
tl.fromTo("#c3l div:nth-child(2)",{{scale:0}},{{scale:1,duration:.25,ease:"back.out(3)"}},{K["preco"] + 1.3});
tl.fromTo(".r3",{{rotation:0}},{{rotation:-50,duration:{b3 - a3:.2f},ease:"none"}},{a3:.2f});''')

# 4 · ticket com PIX
a4, b4 = K["escolheu"] - 0.3, K["pagou"] - 0.2
cena("c4", a4, b4, f'''
  <div class="dc" id="c4d">
    <div class="dch"># ticket-0427-branoov</div>
    <div class="msg"><div class="av">V</div><div class="mb"><div class="mn">Vexora bot <span class="app">APP</span></div>
      <div class="emb"><div class="et">💳 Pagamento via PIX</div><div class="ef">📦 Produto<br><code>Steam Key Premium</code></div>
      <div class="ev">💰 Total <b>R$ 4,00</b></div>
      <div class="btns"><div class="btn" id="c4btn">📋 Copiar Pix Copia e Cola</div><div class="btn g">🔑 Copiar chave PIX</div></div></div></div></div>
  </div>
  <div class="dedo" id="c4f" data-layout-allow-overlap>👆</div>
  <div class="carimbo" id="c4z" data-layout-allow-overlap>ZERO BUROCRACIA</div>
  <div class="riscado" id="c4p">"me chama no privado"</div>''',
     f'''tl.fromTo("#c4d",{{y:400,opacity:0}},{{y:0,opacity:1,duration:.35,ease:"power3.out"}},{a4:.2f});
tl.fromTo("#c4f",{{x:300,y:300,opacity:0}},{{x:0,y:0,opacity:1,duration:.35}},{K["abre"]:.2f});
tl.to("#c4btn",{{scale:.92,backgroundColor:"#1a7a3a",duration:.08,yoyo:true,repeat:1}},{K["abre"] + 0.8:.2f});
tl.to("#c4f",{{opacity:0,duration:.2}},{K["zero"] - 0.4:.2f});
tl.to("#c4d",{{opacity:0,duration:.15}},{K["zero"] - 0.05:.2f});tl.fromTo("#c4z",{{scale:3,opacity:0,rotation:-8}},{{scale:1,opacity:1,rotation:-8,duration:.2,ease:"power4.out"}},{K["zero"]:.2f});
tl.fromTo("#c4p",{{opacity:0}},{{opacity:1,duration:.15}},{K["zero2"]:.2f});
tl.fromTo("#c4p .x",{{scaleX:0}},{{scaleX:1,duration:.2}},{K["privado"]:.2f});''')
C[-1] = C[-1].replace('"me chama no privado"</div>', '"me chama no privado"<div class="x"></div></div>')

# 5 · pago + DM + crush no vácuo
a5, b5 = K["pagou"] - 0.2, K["quem"] - 0.2
cena("c5", a5, b5, f'''
  <div class="raios r5"></div>
  <div class="pago" id="c5p">PAGO ✓</div>
  <div class="notif" id="c5n" data-layout-allow-overlap><div class="av">V</div><div><b>Vexora bot</b><br>📦 Seu pedido chegou! Toque para ver.</div></div>
  <div class="crush" id="c5c"><div class="bal">oi 👉👈</div><div class="visto">visto às 03:12</div><div class="vacuo">VÁCUO 💀</div></div>''',
     f'''tl.fromTo("#c5p",{{scale:4,opacity:0,rotation:-15}},{{scale:1,opacity:1,rotation:-6,duration:.2,ease:"power4.out"}},{K["pagou"]:.2f});
tl.to("#c5p",{{opacity:0,duration:.15}},{K["entrega"] - 0.2:.2f});tl.fromTo("#c5n",{{y:-300,opacity:0}},{{y:0,opacity:1,duration:.35,ease:"back.out(2)"}},{K["entrega"] - 0.1:.2f});

tl.fromTo("#c5c",{{opacity:0,y:60}},{{opacity:1,y:0,duration:.25}},{K["rapido"] - 0.2:.2f});tl.to("#c5n",{{opacity:0,duration:.2}},{K["rapido"] - 0.3:.2f});
tl.fromTo("#c5c .vacuo",{{scale:0}},{{scale:1,duration:.25,ease:"back.out(4)"}},{K["crush"] + 0.9:.2f});
tl.fromTo(".r5",{{rotation:0}},{{rotation:40,duration:{b5 - a5:.2f},ease:"none"}},{a5:.2f});''')

# 6 · VIP / Diamante / aura farming / cupom
a6, b6 = K["quem"] - 0.2, K["mas"] - 0.2
cena("c6", a6, b6, f'''
  <div class="raios r6"></div>
  <div class="cargo vip" id="c6v"><div class="ci">🏆</div><div class="cn">CLIENTE VIP</div><div class="cd">3+ compras</div><div class="co">5% OFF</div></div>
  <div class="cargo dia" id="c6d"><div class="ci">💠</div><div class="cn">CLIENTE DIAMANTE</div><div class="cd">10+ compras</div><div class="co">10% OFF</div></div>
  <div class="aura" id="c6a">+1000 AURA</div>
  <div class="chips" id="c6c"><span>🎟️ CUPOM</span><span>🤝 INDIQUE UM AMIGO</span></div>''',
     f'''tl.fromTo("#c6v",{{y:900,opacity:0}},{{y:0,opacity:1,duration:.35,ease:"power4.out"}},{K["vip"] - 1.4:.2f});
tl.fromTo("#c6v .co",{{scale:0}},{{scale:1,duration:.25,ease:"back.out(3)"}},{K["vip"] + 0.5:.2f});
tl.fromTo("#c6d",{{y:900,opacity:0}},{{y:0,opacity:1,duration:.35,ease:"power4.out"}},{K["dez"] - 0.2:.2f});
tl.fromTo("#c6d .co",{{scale:0}},{{scale:1,duration:.25,ease:"back.out(3)"}},{K["dez"] + 1.6:.2f});
tl.to(["#c6v","#c6d"],{{opacity:0,duration:.2}},{K["aura"] - 0.2:.2f});
tl.fromTo("#c6a",{{scale:0,rotation:-10}},{{scale:1,rotation:-6,duration:.3,ease:"back.out(4)"}},{K["aura"]:.2f});
tl.to("#c6a",{{opacity:0,duration:.2}},{K["ainda"] - 0.2:.2f});
tl.set("#c6c",{{autoAlpha:0}},{a6:.2f});tl.set("#c6c",{{autoAlpha:1}},{K["ainda"] - 0.05:.2f});tl.fromTo("#c6c span",{{y:80,opacity:0}},{{y:0,opacity:1,duration:.25,stagger:.5}},{K["ainda"]:.2f});
tl.fromTo(".r6",{{rotation:0}},{{rotation:-40,duration:{b6 - a6:.2f},ease:"none"}},{a6:.2f});''')

# 7+8 · Anime Cards: virada e invocação
a7, b7 = K["mas"] - 0.2, K["monta"] - 0.2
raro = [("naruto", "NARUTO", "Comum", "#43b581"), ("luffy", "LUFFY", "Comum", "#43b581"), ("goku", "GOKU", "Comum", "#43b581"), ("sung", "SUNG JIN-WOO", "LENDÁRIO", "#f1c40f")]
cs, ca = [], []
for i, (k, nome, r, cor) in enumerate(raro):
    cs.append(f'<div class="carta" id="k{i}" style="--c:{cor}"><div class="kr">{r.upper()}</div><div class="kf">{nome[0]}</div><div class="kn">{nome}</div></div>')
    ca.append(f'tl.fromTo("#k{i}",{{y:800,rotation:{(i - 1.5) * 25}}},{{y:{abs(i - 1.5) * 30:.0f},rotation:{(i - 1.5) * 12},duration:.3,ease:"back.out(2)"}},{K[k] - 0.15:.2f});')
cena("c7", a7, b7, f'''
  <div class="flash" id="c7f"></div>
  <div class="raios r7"></div>
  <div class="titac" id="c7t">ANIME<br>CARDS</div>
  <div class="mao">{"".join(cs)}</div>
  <div class="leg" id="c7l">LENDÁRIO!!</div>
  <div class="print" id="c7p"></div>''',
     f'''tl.fromTo("#c7t",{{scale:0,rotation:-20}},{{scale:1,rotation:0,duration:.35,ease:"back.out(3)"}},{K["anime"] - 0.3:.2f});
tl.fromTo("#c7f",{{opacity:1}},{{opacity:0,duration:.5,immediateRender:false}},{K["anime"] - 0.3:.2f});
tl.to("#c7t",{{y:-430,scale:.55,duration:.35,ease:"power3.inOut"}},{K["todo"] - 0.2:.2f});
''' + "\n".join(ca) + f'''
tl.to(["#k0","#k1","#k2"],{{opacity:.25,duration:.2}},{K["lendario"] - 0.2:.2f});
tl.to("#k3",{{scale:1.35,y:-60,rotation:0,duration:.3,ease:"back.out(2)"}},{K["lendario"] - 0.2:.2f});
tl.fromTo("#c7l",{{scale:0}},{{scale:1,duration:.25,ease:"back.out(4)"}},{K["lendario"]:.2f});
tl.fromTo("#c7p",{{opacity:.9}},{{opacity:0,duration:.35,immediateRender:false}},{K["printar"]:.2f});
tl.fromTo(".r7",{{rotation:0}},{{rotation:60,duration:{b7 - a7:.2f},ease:"none"}},{a7:.2f});''')

# 9 · batalha, ranking, skill issue, missões
a9, b9 = K["monta"] - 0.2, K["deu"] - 0.2
eq = lambda pre, cor: "".join(f'<div class="mini" style="--c:{cor}">{pre}{i + 1}</div>' for i in range(5))
cena("c9", a9, b9, f'''
  <div class="raios r9"></div>
  <div class="time t1" id="c9a">{eq("A", "#ff2e4d")}</div>
  <div class="vs" id="c9v">VS</div>
  <div class="time t2" id="c9b">{eq("B", "#3a8bff")}</div>
  <div class="podio" id="c9p"><div class="pd p2">2</div><div class="pd p1">1</div><div class="pd p3">3</div></div>
  <div class="skill" id="c9s">SKILL ISSUE 💀</div>
  <div class="miss" id="c9m"><span>📅 DIÁRIA</span><span>🗓️ SEMANAL</span><span>📆 MENSAL</span><div class="vc">🪙 V-COINS</div></div>''',
     f'''tl.fromTo("#c9a .mini",{{x:-700}},{{x:0,duration:.3,stagger:.08,ease:"power4.out"}},{a9 + 0.1:.2f});
tl.fromTo("#c9b .mini",{{x:700}},{{x:0,duration:.3,stagger:.08,ease:"power4.out"}},{K["desafia"] - 0.3:.2f});
tl.fromTo("#c9v",{{scale:4,opacity:0}},{{scale:1,opacity:1,duration:.2,ease:"power4.out"}},{K["desafia"]:.2f});
tl.to(["#c9a","#c9b","#c9v"],{{opacity:0,duration:.2}},{K["sobe"] - 0.3:.2f});
tl.fromTo("#c9p .pd",{{scaleY:0}},{{scaleY:1,duration:.3,stagger:.12,ease:"back.out(2)",transformOrigin:"50% 100%"}},{K["sobe"] - 0.2:.2f});
tl.to("#c9p",{{opacity:0,duration:.15}},{K["perdeu"] - 0.1:.2f});
tl.fromTo("#c9s",{{scale:5,opacity:0}},{{scale:1,opacity:1,duration:.15,ease:"power4.out"}},{K["skill"] - 0.05:.2f});
tl.fromTo("#c9s",{{x:-16}},{{x:16,duration:.04,repeat:11,yoyo:true}},{K["skill"] + 0.1:.2f});
tl.to("#c9s",{{opacity:0,duration:.15}},{K["missao"] - 0.15:.2f});
tl.fromTo("#c9m span, #c9m .vc",{{scale:0}},{{scale:1,duration:.25,stagger:.4,ease:"back.out(3)"}},{K["missao"]:.2f});
tl.fromTo(".r9",{{rotation:0}},{{rotation:-40,duration:{b9 - a9:.2f},ease:"none"}},{a9:.2f});''')

# 10 · suporte
a10, b10 = K["deu"] - 0.2, K["ensino"] - 0.4
cena("c10", a10, b10, f'''
  <div class="raios r10"></div>
  <div class="bo" id="c10q">DEU B.O.? 🚨</div>
  <div class="balao" id="c10t">🎫 ticket aberto · a equipe já vem</div>''',
     f'''tl.fromTo("#c10q",{{scale:3,opacity:0}},{{scale:1,opacity:1,duration:.2,ease:"power4.out"}},{K["deu"]:.2f});
tl.fromTo("#c10t",{{scale:0}},{{scale:1,duration:.3,ease:"back.out(3)"}},{K["suporte"] + 0.6:.2f});
tl.fromTo(".r10",{{rotation:0}},{{rotation:30,duration:{b10 - a10:.2f},ease:"none"}},{a10:.2f});''')

video("c10b", "banner", "c10v", "assets/bot/suporte.mp4", K["suporte"] - 0.1, b10 - (K["suporte"] - 0.1), f'tl.fromTo("#c10b",{{y:300}},{{y:0,duration:.3}},{K["suporte"] - 0.1:.2f});')

# 11 · aulas (trecho de um vídeo 3D do canal dentro de um celular)
a11, b11 = K["ensino"] - 0.4, K["vexora3"] - 0.15
cena("c11", a11, b11, f'''
  <div class="raios r11"></div>
  <div class="aulas" id="c11a">AULAS NO DISCORD 🎓</div>''',
     f'''tl.fromTo("#c11a",{{scale:0}},{{scale:1,duration:.3,ease:"back.out(3)"}},{a11 + 0.5:.2f});''')

video("c11c", "cel", "c11v", "assets/aula.mp4", a11, b11 - a11, f'tl.fromTo("#c11c",{{y:900,rotation:10}},{{y:0,rotation:-3,duration:.4,ease:"power4.out"}},{a11:.2f});')

# 12 · fim
a12 = K["vexora3"] - 0.15
cena("c12", a12, FIM, f'''
  <div class="raios r12"></div>
  <div class="link" id="c12l">LINK NA BIO</div>
  <div class="seta" id="c12s">⬆️</div>
''',
     f'''tl.fromTo("#c12l",{{scale:3,opacity:0}},{{scale:1,opacity:1,duration:.2,ease:"power4.out"}},{K["link"] - 0.05:.2f});
tl.fromTo("#c12s",{{y:0}},{{y:-40,duration:.3,yoyo:true,repeat:7,ease:"sine.inOut"}},{K["link"]:.2f});
tl.fromTo(".r12",{{rotation:0}},{{rotation:40,duration:{FIM - a12:.2f},ease:"none"}},{a12:.2f});''')

video("c12b", "logo fimlogo", "c12v", "assets/bot/icone.mp4", a12, FIM - a12, f'tl.fromTo("#c12b",{{scale:0}},{{scale:1,duration:.4,ease:"back.out(2)"}},{a12:.2f});')

cenas = '''<template>
  <style>
    #root { position:absolute; inset:0; overflow:hidden; background:#0a0204; font-family:"Montserrat"; color:#fff; }
    .cena { position:absolute; inset:0; overflow:hidden; background:radial-gradient(circle at 50% 42%, #5a0a14 0%, #1a0306 55%, #070103 100%); }
    .raios { position:absolute; left:-600px; top:-180px; width:2280px; height:2280px; opacity:.35;
             background:repeating-conic-gradient(from 0deg, rgba(255,40,70,.55) 0deg 4deg, transparent 4deg 14deg); }
    .big { position:absolute; left:0; right:0; top:620px; text-align:center; font-family:"Archivo Black"; font-size:200px; letter-spacing:-4px;
           -webkit-text-stroke:8px #000; paint-order:stroke fill; text-shadow:0 0 50px #ff2e4d; }
    .q { color:#ff2e4d; }
    .sub { position:absolute; left:0; right:0; top:880px; text-align:center; font-weight:900; font-size:64px; color:#ffd23a; -webkit-text-stroke:6px #000; paint-order:stroke fill; }
    .logo { position:absolute; left:290px; top:560px; width:500px; height:500px; border-radius:40px; overflow:hidden; box-shadow:0 0 80px rgba(255,46,77,.7); }
    .logo video { width:100%; height:100%; object-fit:cover; }
    .banner { position:absolute; left:40px; right:40px; top:260px; height:334px; border-radius:24px; overflow:hidden; box-shadow:0 0 60px rgba(255,46,77,.6); border:3px solid #ff2e4d; }
    .banner video { width:100%; height:100%; object-fit:cover; }
    .big24 { position:absolute; left:0; right:0; top:700px; text-align:center; font-family:"Archivo Black"; font-size:280px; color:#ff2e4d; -webkit-text-stroke:8px #000; paint-order:stroke fill; }
    .meme { position:absolute; left:0; right:0; top:690px; text-align:center; font-weight:700; font-size:50px; color:#ddd; opacity:0; }
    .relogio { position:absolute; left:190px; right:190px; top:790px; padding:20px 0; text-align:center; font-family:"JetBrains Mono"; font-weight:700; font-size:150px;
               color:#ff2e4d; background:#000; border:6px solid #ff2e4d; border-radius:26px; text-shadow:0 0 30px #ff2e4d; opacity:0; }
    .relogio small { font-size:60px; }
    .prod { position:absolute; left:110px; right:110px; top:300px; height:720px; border-radius:40px; background:linear-gradient(160deg,#2b2d31,#1e1f22);
            border:5px solid #ff2e4d; box-shadow:0 30px 80px rgba(0,0,0,.6), 0 0 60px rgba(255,46,77,.35); text-align:center; opacity:0; }
    .pe { font-size:200px; margin-top:60px; }
    .ebk { position:absolute; left:290px; top:40px; width:280px; border-radius:16px; }
    #p4 .pe { visibility:hidden; height:200px; }
    .pn { font-weight:900; font-size:60px; line-height:1.1; margin:30px 40px 0; }
    .pp { font-family:"Archivo Black"; font-size:130px; color:#3ddc84; -webkit-text-stroke:5px #000; paint-order:stroke fill; margin-top:30px; }
    .tag { position:absolute; left:0; right:0; bottom:30px; font-weight:700; font-size:34px; color:#ff8aa0; letter-spacing:6px; }
    .lanche { position:absolute; left:0; right:0; top:520px; text-align:center; font-weight:900; font-size:86px; line-height:1.4; -webkit-text-stroke:6px #000; paint-order:stroke fill; }
    .lanche b { color:#ffd23a; }
    .dc { position:absolute; left:50px; right:50px; top:220px; border-radius:30px; background:#313338; padding:30px; box-shadow:0 30px 90px rgba(0,0,0,.7); }
    .dch { font-weight:700; font-size:40px; color:#b5bac1; border-bottom:2px solid #3f4147; padding-bottom:20px; margin-bottom:24px; }
    .msg { display:flex; gap:24px; }
    .av { flex:none; width:96px; height:96px; border-radius:50%; background:#5a0a14; border:4px solid #ff2e4d; color:#ff2e4d; font-family:"Archivo Black"; font-size:56px; text-align:center; line-height:88px; }
    .mn { font-weight:700; font-size:40px; } .app { font-size:28px; background:#5865f2; border-radius:6px; padding:2px 10px; vertical-align:middle; }
    .emb { margin-top:16px; background:#2b2d31; border-left:8px solid #3ddc84; border-radius:10px; padding:26px; font-size:36px; line-height:1.5; }
    .et { font-weight:900; font-size:42px; margin-bottom:12px; } .ef code { font-family:"JetBrains Mono"; background:#1e1f22; padding:4px 10px; border-radius:8px; }
    .ev b { font-size:64px; color:#3ddc84; }
    .btns { display:flex; flex-direction:column; gap:14px; margin-top:20px; }
    .btn { background:#248046; border-radius:10px; padding:18px; font-weight:700; font-size:36px; text-align:center; } .btn.g { background:#4e5058; }
    .dedo { position:absolute; left:620px; top:900px; font-size:120px; opacity:0; }
    .carimbo { position:absolute; left:70px; right:70px; top:620px; text-align:center; padding:20px; border:12px solid #ff2e4d; border-radius:20px; color:#ff2e4d;
               font-family:"Archivo Black"; font-size:96px; background:rgba(10,2,4,.85); opacity:0; }
    .riscado { position:absolute; left:0; right:0; top:900px; text-align:center; font-weight:700; font-style:italic; font-size:62px; color:#fff; opacity:0; }
    .riscado .x { position:absolute; left:170px; right:170px; top:38px; height:10px; background:#ff2e4d; transform-origin:0 50%; }
    .pago { position:absolute; left:120px; right:120px; top:330px; text-align:center; padding:30px; border:16px solid #3ddc84; border-radius:30px; color:#3ddc84;
            font-family:"Archivo Black"; font-size:170px; }
    .notif { position:absolute; left:60px; right:60px; top:720px; display:flex; gap:24px; align-items:center; background:rgba(43,45,49,.97); border-radius:30px; padding:30px; font-size:40px; line-height:1.35; box-shadow:0 20px 60px rgba(0,0,0,.6); }
    .crush { position:absolute; left:0; right:0; top:260px; text-align:center; opacity:0; }
    .bal { display:inline-block; background:#5865f2; border-radius:40px 40px 6px 40px; padding:30px 50px; font-weight:700; font-size:70px; }
    .visto { margin-top:14px; font-size:36px; color:#aaa; }
    .vacuo { margin-top:40px; font-family:"Archivo Black"; font-size:130px; color:#ffd23a; -webkit-text-stroke:6px #000; paint-order:stroke fill; }
    .cargo { position:absolute; left:110px; right:110px; height:340px; border-radius:36px; text-align:center; padding-top:30px; box-shadow:0 20px 60px rgba(0,0,0,.6); }
    .vip { top:260px; background:linear-gradient(135deg,#e91e63,#7a0e35); } .dia { top:650px; background:linear-gradient(135deg,#7b2cbf,#2b0d4a); }
    .ci { font-size:90px; } .cn { font-weight:900; font-size:56px; } .cd { font-size:36px; opacity:.85; }
    .co { position:absolute; right:-30px; top:-40px; background:#ffd23a; color:#000; font-family:"Archivo Black"; font-size:60px; padding:14px 26px; border-radius:20px; transform:rotate(8deg); }
    .aura { position:absolute; left:0; right:0; top:520px; text-align:center; font-family:"Archivo Black"; font-size:150px; color:#c9a0ff; -webkit-text-stroke:8px #000; paint-order:stroke fill; text-shadow:0 0 60px #9b5cff; opacity:0; }
    .chips { position:absolute; left:0; right:0; top:500px; display:flex; flex-direction:column; align-items:center; gap:30px; }
    .chips span { background:#2b2d31; border:4px solid #ff2e4d; border-radius:60px; padding:24px 50px; font-weight:900; font-size:56px; opacity:0; }
    .flash { position:absolute; inset:0; background:#ff2e4d; opacity:0; z-index:5; }
    .titac { position:absolute; left:0; right:0; top:640px; text-align:center; font-family:"Archivo Black"; font-size:190px; line-height:.95; color:#fff; -webkit-text-stroke:8px #000; paint-order:stroke fill; text-shadow:0 0 60px #ff2e4d; }
    .mao { position:absolute; left:0; right:0; top:520px; height:600px; }
    .carta { position:absolute; top:0; width:230px; height:340px; border-radius:22px; background:linear-gradient(160deg,#2b2d31,#111); border:6px solid var(--c); text-align:center; box-shadow:0 0 40px var(--c); }
    #k0 { left:40px; } #k1 { left:290px; } #k2 { left:540px; } #k3 { left:790px; }
    .kr { margin-top:14px; font-weight:900; font-size:28px; color:var(--c); letter-spacing:2px; }
    .kf { font-family:"Archivo Black"; font-size:150px; color:var(--c); line-height:1.3; }
    .kn { font-weight:900; font-size:28px; padding:0 10px; }
    .leg { position:absolute; left:0; right:0; top:950px; text-align:center; font-family:"Archivo Black"; font-size:110px; color:#f1c40f; -webkit-text-stroke:6px #000; paint-order:stroke fill; text-shadow:0 0 50px #f1c40f; opacity:0; }
    .print { position:absolute; inset:0; background:#fff; opacity:0; }
    .time { position:absolute; left:40px; right:40px; display:flex; justify-content:center; gap:16px; }
    .t1 { top:300px; } .t2 { top:780px; }
    .mini { width:176px; height:250px; border-radius:18px; border:6px solid var(--c); background:#1e1f22; box-shadow:0 0 30px var(--c); font-family:"Archivo Black"; font-size:70px; color:var(--c); text-align:center; line-height:240px; }
    .vs { position:absolute; left:0; right:0; top:560px; text-align:center; font-family:"Archivo Black"; font-size:200px; color:#ffd23a; -webkit-text-stroke:8px #000; paint-order:stroke fill; opacity:0; }
    .podio { position:absolute; left:140px; right:140px; top:400px; height:620px; display:flex; align-items:flex-end; justify-content:center; gap:20px; }
    .pd { width:240px; border-radius:20px 20px 0 0; font-family:"Archivo Black"; font-size:120px; text-align:center; color:#000; }
    .p1 { height:560px; background:#f1c40f; } .p2 { height:420px; background:#c0c4cc; } .p3 { height:320px; background:#cd7f32; }
    .skill { position:absolute; left:0; right:0; top:560px; text-align:center; font-family:"Archivo Black"; font-size:140px; line-height:1; color:#ff2e4d; -webkit-text-stroke:8px #000; paint-order:stroke fill; opacity:0; }
    .miss { position:absolute; left:0; right:0; top:330px; display:flex; flex-direction:column; align-items:center; gap:30px; }
    .miss span { background:#2b2d31; border:4px solid #3a8bff; border-radius:60px; padding:24px 60px; font-weight:900; font-size:60px; }
    .vc { margin-top:20px; font-family:"Archivo Black"; font-size:110px; color:#ffd23a; -webkit-text-stroke:6px #000; paint-order:stroke fill; }
    .bo { position:absolute; left:0; right:0; top:680px; text-align:center; font-family:"Archivo Black"; font-size:130px; color:#ffd23a; -webkit-text-stroke:8px #000; paint-order:stroke fill; }
    .balao { position:absolute; left:120px; right:120px; top:880px; text-align:center; background:#5865f2; border-radius:50px; padding:30px; font-weight:900; font-size:48px; }
    .cel { position:absolute; left:270px; top:220px; width:540px; height:880px; border-radius:60px; overflow:hidden; border:16px solid #111; box-shadow:0 0 80px rgba(255,46,77,.6); }
    .cel video { width:100%; height:100%; object-fit:cover; }
    .aulas { position:absolute; left:0; right:0; top:990px; text-align:center; font-family:"Archivo Black"; font-size:78px; color:#ffd23a; -webkit-text-stroke:6px #000; paint-order:stroke fill; }
    .link { position:absolute; left:0; right:0; top:700px; text-align:center; font-family:"Archivo Black"; font-size:150px; color:#fff; -webkit-text-stroke:8px #000; paint-order:stroke fill; text-shadow:0 0 60px #ff2e4d; opacity:0; }
    .seta { position:absolute; left:0; right:0; top:900px; text-align:center; font-size:110px; }
    .cringe { position:absolute; left:0; right:0; top:1060px; text-align:center; font-weight:900; font-size:60px; color:#ffd23a; }
  </style>
  <div id="root" data-composition-id="cenas" data-width="1080" data-height="1920">
''' + "\n".join(C) + '''
  </div>
  <script>
    (function(){ window.__timelines = window.__timelines || {}; const tl = gsap.timeline({ paused: true });
''' + "\n".join(J) + '''
      window.__timelines["cenas"] = tl; })();
  </script>
</template>
'''

# ---------------------------------------------------------------- áudio + raiz
aud = ['<audio id="voz" class="clip" src="assets/voice/narracao.wav" data-start="0" data-duration="89.56" data-volume="1" data-track-index="4"></audio>']
if os.path.exists(os.path.join(P, "assets/music/beat.wav")):
    aud.append(f'<audio id="beat" class="clip" src="assets/music/beat.wav" data-start="0" data-duration="{TOTAL}" data-volume="0.22" data-fade-out="1" data-track-index="5"></audio>')
sf = os.path.join(P, "assets/sfx/lista.json")
if os.path.exists(sf):
    livre = []
    for i, (nome, t, vol, d) in enumerate(sorted(json.load(open(sf)), key=lambda x: x[1])):
        tr_ = next((j for j, fim in enumerate(livre) if fim <= t), None)
        if tr_ is None: livre.append(0.0); tr_ = len(livre) - 1
        livre[tr_] = t + d + 0.02
        aud.append(f'<audio id="sfx{i:02d}" class="clip" src="assets/sfx/{nome}" data-start="{t:.2f}" data-duration="{d:.2f}" data-volume="{vol}" data-track-index="{6 + tr_}"></audio>')

index = f'''<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style> * {{ margin:0; padding:0; box-sizing:border-box; }} html, body {{ width:1080px; height:1920px; overflow:hidden; background:#0a0204; }} #root {{ width:100%; height:100%; position:relative; }}
      .logo, .banner, .cel {{ position:absolute; z-index:5; overflow:hidden; opacity:0; }}
      .logo {{ left:290px; top:560px; width:500px; height:500px; border-radius:40px; box-shadow:0 0 80px rgba(255,46,77,.7); }}
      .fimlogo {{ top:180px; }}
      .banner {{ left:40px; right:40px; top:260px; height:334px; border-radius:24px; box-shadow:0 0 60px rgba(255,46,77,.6); border:3px solid #ff2e4d; }}
      .cel {{ left:300px; top:200px; width:480px; height:760px; border-radius:60px; border:16px solid #111; box-shadow:0 0 80px rgba(255,46,77,.6); }}
      .logo video, .banner video, .cel video {{ width:100%; height:100%; object-fit:cover; }} </style>
  </head>
  <body>
    <!-- VEXORA (Discord) — vídeo promocional editado. Gerado por tools/build_vexora.py -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <div id="cenas" data-composition-id="cenas" data-composition-src="compositions/cenas.html" data-start="0" data-duration="{TOTAL}" data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920"></div>
      <div id="legendas" data-composition-id="legendas" data-composition-src="compositions/legendas.html" data-start="0" data-duration="{TOTAL}" data-track-index="2" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:10"></div>
      {chr(10).join("      " + x for x in RV)}
      {chr(10).join("      " + x for x in aud)}
    </div>
    <script> window.__timelines = window.__timelines || {{}}; const tl = gsap.timeline({{ paused: true }}); {"".join(RJ)} window.__timelines["main"] = tl; </script>
  </body>
</html>
'''
os.makedirs(os.path.join(P, "compositions"), exist_ok=True)
open(os.path.join(P, "compositions/cenas.html"), "w").write(cenas)
open(os.path.join(P, "compositions/legendas.html"), "w").write(legendas)
open(os.path.join(P, "index.html"), "w").write(index)
json.dump({"k": K, "total": TOTAL}, open(os.path.join(P, "assets/tempos.json"), "w"))
print("ok", len(leg), "legendas,", len(C), "cenas,", len(aud), "áudios")
