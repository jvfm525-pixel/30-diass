"""Gera o DIA 4 (A venceu: abriu a porta) de "O Chat Controla" em chat-dia04/.

Mesmo estilo HQ pop. O Armando é desenhado pelas barras (evolução visual) e o
episódio tem a cena "O QUE MUDOU".
Uso: python3 tools/build_chat_dia04.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from build_chat_dia01 import BARS, bg, chip, phone_ui, place  # noqa: E402
from build_chat_dia02 import bar_rows  # noqa: E402
from build_chat_dia03 import tag  # noqa: E402
from hq_lib import (CYAN, GREEN, INK, MAG, RED, YEL, armando, carla, room, scene,  # noqa: E402
                    sfx_word, speed_lines)
from upgrade_scene import upgrade_scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chat-dia04")
COMP = os.path.join(ROOT, "compositions")
BEFORE = {"money": 20, "health": 30, "love": 10, "rep": 40}
AFTER = {"money": 20, "health": 30, "love": 20, "rep": 30}
DAYS_LEFT = 27

PARS = [
    "Dia 4.|E essa foi por pouco:|a votação mais acirrada até agora!|Mas no final…|deu A.|O Armando abriu a porta.",
    "A Carla olhou pra ele…|olhou pra cueca…|olhou pro frango pegando fogo…|e perguntou:|tá tudo bem aí?",
    "E ele respondeu|a única coisa que veio na cabeça:|é…|churrasco.",
    "E ela riu.|De verdade.|Pela primeira vez em anos,|uma mulher riu com ele…|e não dele.",
    "Açúcar ele não tinha.|Entregou um sachê de ketchup.|E ela…|aceitou.",
    "Antes de ir,|ela pediu o número dele.|Disse que,|se o prédio pegar fogo,|ela avisa.",
    "Ele ficou tão nervoso|que o celular escorregou…|e caiu de tela no chão.|A tela trincou tanto|que agora parece|um mapa do metrô.",
    "Amor subiu 10.|Reputação caiu 10:|o porteiro viu tudo pela câmera…|e já contou pro prédio inteiro.",
    "E a aparência?|Ainda não mudou…|mas faltam só 6 pontos de amor|pro cabelo começar a nascer!",
    "Agora, com o celular quebrado:|parcelar um novo em 12 vezes,|ou consertar com durex?|O novo custa caro|e quase zera o dinheiro…|mas ele chega na Carla com estilo.|O durex é de graça…|mas ninguém leva a sério|um cara de celular com durex.|Comenta A ou B!",
    "Faltam 27 dias…|e a Carla tá esperando a mensagem dele.",
]
FIX = {"eessa": ["e", "essa"], "eele": ["e", "ele"], "eela": ["e", "ela"], "enao": ["e", "nao"], "ea": ["e", "a"],
       "sucar": ["acucar"], "para": ["pra"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-votacao", "s2-porta", "s3-churrasco", "s4-riso", "s5-ketchup", "s6-numero", "s7-crack", "s8-barras",
         "s9-mudou", "s10-decisao", "s11-final"]
SCENES = []
for k, n in enumerate(NAMES):
    s = 0.0 if k == 0 else round(PSTART[k] - .12, 2)
    e = TOTAL if k == len(NAMES) - 1 else round(PSTART[k + 1] - .12, 2)
    SCENES.append((n, s, e))
SC = {n: (s, e) for n, s, e in SCENES}


def W(par, word, nth=0):
    hits = [w for w in WORDS if w[0] == par and w[3].startswith(norm(word))]
    return round(hits[nth][4], 2)


def L(sc, par, word, nth=0, off=0.0):
    return round(W(par, word, nth) - SC[sc][0] + off, 2)


def D(sc):
    return round(SC[sc][1] - SC[sc][0], 2)


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


def A(p, pose="none", stats=None):
    return armando(p, pose, stats=stats or AFTER)


# ------------------------------------------------------------------ S1 votação acirrada
def s1():
    sc = "s1-votacao"
    d = D(sc)
    import random
    rnd = random.Random(4)
    conf = "".join(f'<rect class="s1-cf" x="{rnd.uniform(40, 1040):.0f}" y="{rnd.uniform(-300, -40):.0f}" width="{rnd.choice([16, 22, 28])}" height="{rnd.choice([30, 40])}" '
                   f'fill="{rnd.choice([YEL, MAG, CYAN, GREEN, "#fff"])}" stroke="{INK}" stroke-width="3"/>' for _ in range(60))
    body = f'''
    {bg("s1", "#1d3557", True, 540, 760)}
    <div style="position:absolute;left:70px;top:185px;z-index:8"><div id="s1-badge-in" style="font-family:'Archivo Black';font-size:96px;color:{YEL};background:{MAG};border:10px solid {INK};
      padding:0 30px;box-shadow:12px 12px 0 {INK};-webkit-text-stroke:8px {INK};paint-order:stroke fill;line-height:1.25">DIA 4</div></div>
    {sfx_word("s1-quase", "QUASE EMPATE!", YEL, 110, -6, "left:110px;top:430px;z-index:7")}
    <div id="s1-vote" style="position:absolute;left:110px;top:680px;width:860px;z-index:5">
      <div style="position:relative;height:150px;border:10px solid {INK};border-radius:80px;overflow:hidden;box-shadow:12px 12px 0 {INK};background:{MAG}">
        <div id="s1-va" style="position:absolute;left:0;top:0;bottom:0;width:860px;background:{CYAN};transform-origin:0% 50%"></div>
        <div style="position:absolute;left:40px;top:0;font-family:'Archivo Black';font-size:110px;line-height:130px;color:#fff;-webkit-text-stroke:8px {INK};paint-order:stroke fill">A</div>
        <div style="position:absolute;right:40px;top:0;font-family:'Archivo Black';font-size:110px;line-height:130px;color:#fff;-webkit-text-stroke:8px {INK};paint-order:stroke fill">B</div>
        <div style="position:absolute;left:425px;top:-10px;width:10px;height:170px;background:#fff;border:3px solid {INK}"></div></div></div>
    {sfx_word("s1-deu", "DEU A!", CYAN, 170, -8, "left:240px;top:890px;z-index:8")}
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:7">{conf}</svg>
    {sfx_word("s1-nhec", "NHEEEC…", "#fff", 90, 5, "left:480px;top:1080px;z-index:8")}'''
    # a barra balança em volta do meio e tomba pro A
    wob = "".join(f'tl.to("#s1-va", {{ scaleX: {v}, duration: .22, ease: "sine.inOut" }}, {t:.2f});\n      '
                  for t, v in zip([x * .24 for x in range(int(L(sc, 0, "final") / .24))], [.46, .54, .48, .53, .47, .52, .49, .51] * 6))
    js = f'''
      tl.fromTo("#s1-badge-in", {{ scale: 1.3, rotation: -8 }}, {{ scale: 1, rotation: -4, duration: .35, ease: "back.out(3)" }}, 0);
      tl.fromTo("#s1-va", {{ scaleX: .5 }}, {{ scaleX: .5, duration: .01 }}, 0);
      {wob}
      tl.fromTo("#s1-vote", {{ x: 0 }}, {{ x: 8, duration: .05, repeat: 21, yoyo: true, ease: "none" }}, .3);
      hfPop(tl, "#s1-quase-in", {L(sc, 0, "acirrada")}, -6);
      tl.to("#s1-va", {{ scaleX: .58, duration: .35, ease: "back.out(2)" }}, {L(sc, 0, "deu")});
      hfPop(tl, "#s1-deu-in", {L(sc, 0, "deu")}, -8);
      tl.fromTo(".s1-cf", {{ y: 0, rotation: 0 }}, {{ y: (i) => 1500 + (i % 7) * 90, rotation: (i) => (i % 2 ? 1 : -1) * (200 + i * 9), duration: 2.4, stagger: .012, ease: "power1.in" }}, {L(sc, 0, "deu")});
      hfPop(tl, "#s1-nhec-in", {L(sc, 0, "abriu")}, 5);'''
    write(sc, scene(sc, body, js, bg="#1d3557"))


# ------------------------------------------------------------------ S2 a porta abre
def hallway():
    return f'''<svg class="full" viewBox="0 0 1080 1920" data-layout-ignore><rect width="1080" height="1920" fill="#c9b79c"/>
      {"".join(f'<rect x="{x}" y="0" width="10" height="1300" fill="#b8a487"/>' for x in range(40, 1080, 90))}
      <rect x="0" y="1300" width="1080" height="620" fill="#8a6a4a"/>{"".join(f'<rect x="{x}" y="1300" width="120" height="620" fill="#7d5e40" opacity="{.5 if (x // 120) % 2 else 0}"/>' for x in range(0, 1080, 120))}
      <rect x="560" y="260" width="500" height="1080" fill="#3b2a1d" stroke="{INK}" stroke-width="14"/>
      <rect x="520" y="250" width="40" height="1090" fill="#7b4f2c" stroke="{INK}" stroke-width="10"/></svg>'''


def s2():
    sc = "s2-porta"
    d = D(sc)
    smoke = "".join(f'<circle class="s2-sm" cx="{850 + (k % 3) * 60}" cy="900" r="{50 + (k % 4) * 12}" fill="#4a4a4a" opacity=".8" stroke="{INK}" stroke-width="5"/>' for k in range(7))
    body = f'''
    {hallway()}
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:2" data-layout-ignore>{smoke}</svg>
    {place(A("s2a"), "s2-arm", 560, 640, 520, 3)}
    {place(carla("s2c"), "s2-carla", -40, 580, 600, 4)}
    <div id="s2-cup" style="position:absolute;left:330px;top:1120px;z-index:5;font-size:100px">☕</div>
    {tag("s2-e1", "👀", 250, 420, "#fff", 70)}{tag("s2-e2", "🩲", 450, 420, "#fff", 70)}{tag("s2-e3", "🔥", 650, 420, "#fff", 70)}
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:7" data-layout-ignore>
      <path id="s2-ar1" d="M370 470 L440 470" stroke="{INK}" stroke-width="10" stroke-dasharray="80" stroke-dashoffset="80" marker-end=""/>
      <path id="s2-ar2" d="M570 470 L640 470" stroke="{INK}" stroke-width="10" stroke-dasharray="80" stroke-dashoffset="80"/></svg>
    {sfx_word("s2-ok", "TÁ TUDO BEM AÍ?", "#fff", 76, -4, "left:90px;top:1040px;z-index:8")}'''
    js = f'''
      tl.fromTo("#s2-carla", {{ x: -400 }}, {{ x: 0, duration: .4, ease: "back.out(1.4)" }}, 0);
      tl.fromTo("#s2-arm", {{ x: 300 }}, {{ x: 0, duration: .4, ease: "power3.out" }}, .1);
      tl.fromTo(".s2-sm", {{ y: 0, scale: .4, opacity: 0 }}, {{ y: -700, scale: 1.3, opacity: .8, duration: 2.2, stagger: {{ each: .35, repeat: 1 }}, ease: "power1.out" }}, .2);
      hfAlive(tl, "s2a", {d}); hfAlive(tl, "s2c", {d});
      tl.set(["#s2a-br-sad", "#s2a-m-sad"], {{ opacity: 0 }}, 0); tl.set(["#s2a-br-shock", "#s2a-m-grin", "#s2a-sweat"], {{ opacity: 1 }}, 0);
      hfSet(tl, "s2c", 0, ["m-o"], ["m-smile"]);
      hfPop(tl, "#s2-e1-in", {L(sc, 1, "olhou")}, -4);
      tl.fromTo("#s2-ar1", {{ strokeDashoffset: 80 }}, {{ strokeDashoffset: 0, duration: .2 }}, {L(sc, 1, "cueca") - .2});
      hfPop(tl, "#s2-e2-in", {L(sc, 1, "cueca")}, 4);
      tl.fromTo("#s2-ar2", {{ strokeDashoffset: 80 }}, {{ strokeDashoffset: 0, duration: .2 }}, {L(sc, 1, "frango") - .2});
      hfPop(tl, "#s2-e3-in", {L(sc, 1, "frango")}, -4);
      tl.fromTo(".s2c-pupil", {{ x: 0, y: 0 }}, {{ x: 14, duration: .15 }}, {L(sc, 1, "olhou")});
      tl.to(".s2c-pupil", {{ y: 14, duration: .15 }}, {L(sc, 1, "cueca")});
      tl.to(".s2c-pupil", {{ y: 0, x: 18, duration: .15 }}, {L(sc, 1, "frango")});
      hfPop(tl, "#s2-ok-in", {L(sc, 1, "ta")}, -4);'''
    js = js.replace("hfSet(", "hfSetC(")
    js = '''
      function hfSetC(tl, p, t, show, hide) { hide.forEach(id => tl.set('#' + p + '-' + id, { opacity: 0 }, t)); show.forEach(id => tl.set('#' + p + '-' + id, { opacity: 1 }, t)); }''' + js
    write(sc, scene(sc, body, js, bg="#c9b79c"))


# ------------------------------------------------------------------ S3 churrasco
def s3():
    sc = "s3-churrasco"
    d = D(sc)
    sign = f'''<div style="background:#fff8e1;border:10px solid {INK};box-shadow:12px 12px 0 {INK};padding:16px 30px;font-family:'Archivo Black';font-size:80px;color:{RED};transform:rotate(-6deg)">CHURRASCO 🍖</div>'''
    body = f'''
    {bg("s3", "#e76f51", True, 540, 700)}
    {place(A("s3a"), "s3-arm", 140, 420, 800, 3)}
    <div id="s3-sign" data-layout-allow-overlap style="position:absolute;left:150px;top:1020px;z-index:6"><div id="s3-sign-in">{sign}</div></div>
    {sfx_word("s3-e", "É…", "#fff", 140, -6, "left:120px;top:250px;z-index:8")}'''
    js = f'''
      hfAlive(tl, "s3a", {d});
      tl.set(["#s3a-br-sad", "#s3a-m-sad"], {{ opacity: 0 }}, 0); tl.set(["#s3a-br-worry", "#s3a-m-grin", "#s3a-sweat"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s3-arm", {{ scale: 1 }}, {{ scale: 1.08, duration: {d}, ease: "none", transformOrigin: "50% 40%" }}, 0);
      tl.fromTo(".s3a-pupil", {{ x: 0 }}, {{ x: -10, duration: .15 }}, .5);
      tl.to(".s3a-pupil", {{ x: 10, duration: .15 }}, 1.3);
      hfPop(tl, "#s3-e-in", {L(sc, 2, "churrasco") - .7}, -6);
      tl.fromTo("#s3-sign-in", {{ y: 600, rotation: 20 }}, {{ y: 0, rotation: 0, duration: .35, ease: "back.out(1.6)" }}, {L(sc, 2, "churrasco")});'''
    write(sc, scene(sc, body, js, bg="#e76f51"))


# ------------------------------------------------------------------ S4 ela ri
def s4():
    sc = "s4-riso"
    d = D(sc)
    hearts = "".join(f'<div class="s4-h" style="position:absolute;left:{x}px;top:{y}px;font-size:{s}px;z-index:7">❤️</div>' for x, y, s in [(740, 900, 60), (820, 820, 50), (900, 930, 44), (780, 760, 40)])
    body = f'''
    {bg("s4", "#ffb3c6", True, 540, 760)}
    {place(carla("s4c"), "s4-carla", 160, 340, 760, 3)}
    {sfx_word("s4-ha", "HAHAHA!", MAG, 130, -8, "left:110px;top:250px;z-index:8")}
    <div id="s4-ins" data-layout-allow-overlap style="position:absolute;left:700px;top:880px;z-index:6">
      <div id="s4-ins-in" class="panel" style="position:relative;width:300px;height:300px;background:{YEL};box-shadow:10px 10px 0 {INK}">
        <div style="position:absolute;left:-26px;top:-18px;width:350px">{A("s4a")}</div></div></div>
    {hearts}
    {tag("s4-com", "ELA RIU COM ELE ❤️", 120, 1080, "#fff", 46)}'''
    js = f'''
      hfAlive(tl, "s4c", {d}, 1.4);
      tl.set("#s4c-m-smile", {{ opacity: 0 }}, 0); tl.set("#s4c-m-o", {{ opacity: 1 }}, 0);
      tl.fromTo("#s4-carla", {{ y: 0 }}, {{ y: -16, duration: .14, repeat: 15, yoyo: true, ease: "sine.inOut" }}, .1);
      hfPop(tl, "#s4-ha-in", .1, -8);
      hfAlive(tl, "s4a", {d});
      tl.set(["#s4a-br-sad", "#s4a-m-sad"], {{ opacity: 0 }}, 0); tl.set(["#s4a-br-shock", "#s4a-m-grin"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s4-ins-in", {{ scale: 0, rotation: 15 }}, {{ scale: 1, rotation: 4, duration: .35, ease: "back.out(2)" }}, {L(sc, 3, "pela")});
      tl.fromTo(".s4-h", {{ y: 0, scale: 0, opacity: 1 }}, {{ y: -260, scale: 1, opacity: 1, duration: 1.4, stagger: .2, ease: "power1.out" }}, {L(sc, 3, "mulher")});
      hfPop(tl, "#s4-com-in", {L(sc, 3, "com")}, -3);'''
    write(sc, scene(sc, body, js, bg="#ffb3c6"))


# ------------------------------------------------------------------ S5 ketchup
def s5():
    sc = "s5-ketchup"
    d = D(sc)
    sachet = f'''<svg viewBox="0 0 260 180" width="260" height="180"><path d="M10 20 L250 20 L250 160 L10 160 Z" fill="{RED}" stroke="{INK}" stroke-width="9"/>
      <path d="M10 20 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l10 10" fill="none" stroke="{INK}" stroke-width="5"/>
      <circle cx="80" cy="90" r="34" fill="#c92a2a" stroke="{INK}" stroke-width="5"/><path d="M70 60 q10 -14 20 0" stroke="#2f9e44" stroke-width="7" fill="none"/>
      <text x="175" y="105" text-anchor="middle" font-family="Archivo Black" font-size="34" fill="#fff">KETCHUP</text></svg>'''
    body = f'''
    {bg("s5", "#ffd166", True, 540, 760)}
    {place(A("s5a"), "s5-arm", 60, 600, 640, 3)}
    {place(carla("s5c"), "s5-carla", 600, 560, 480, 3)}
    <div id="s5-sach" data-layout-allow-overlap style="position:absolute;left:400px;top:560px;z-index:6"><div id="s5-sach-in">{sachet}</div></div>
    {tag("s5-lab", "AÇÚCAR (versão Armando)", 110, 380, "#fff", 42)}
    {sfx_word("s5-ok", "…OK?!", "#fff", 110, 6, "left:620px;top:420px;z-index:8")}'''
    js = f'''
      hfAlive(tl, "s5a", {d}); hfAlive(tl, "s5c", {d});
      tl.set(["#s5a-br-sad", "#s5a-m-sad"], {{ opacity: 0 }}, 0); tl.set(["#s5a-br-worry", "#s5a-m-grin"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s5-sach-in", {{ x: -500, rotation: -30, scale: .5 }}, {{ x: 0, rotation: -8, scale: 1, duration: .45, ease: "back.out(1.6)" }}, {L(sc, 4, "entregou")});
      hfPop(tl, "#s5-lab-in", {L(sc, 4, "sache")}, -3);
      tl.set("#s5c-m-smile", {{ opacity: 0 }}, 0); tl.set("#s5c-m-o", {{ opacity: 1 }}, 0);
      tl.set("#s5c-m-o", {{ opacity: 0 }}, {L(sc, 4, "aceitou")}); tl.set("#s5c-m-smile", {{ opacity: 1 }}, {L(sc, 4, "aceitou")});
      hfPop(tl, "#s5-ok-in", {L(sc, 4, "aceitou")}, 6);
      tl.to("#s5-sach-in", {{ x: 180, duration: .3, ease: "power2.inOut" }}, {L(sc, 4, "aceitou")});'''
    write(sc, scene(sc, body, js, bg="#ffd166"))


# ------------------------------------------------------------------ S6 o número
def s6():
    sc = "s6-numero"
    d = D(sc)
    ui = f'''<div style="padding:60px 30px;font-family:Inter;color:#fff;text-align:center">
      <div style="font-size:40px;color:#9ca3af">Novo contato</div>
      <div style="width:200px;height:200px;margin:30px auto;border-radius:50%;background:{YEL};border:6px solid {INK};font-size:110px;line-height:190px">👤</div>
      <div style="font-family:'Archivo Black';font-size:52px">Vizinho do 301 🔥</div>
      <div style="margin-top:30px;background:#1f2c34;border-radius:20px;padding:24px;font-size:54px;letter-spacing:.08em">(11) 9 <span id="s6-num">____-____</span></div></div>'''
    body = f'''
    {bg("s6", "#2a9d8f", True, 540, 760)}
    {phone_ui("s6", ui, 190, 300, 700, 860)}
    {tag("s6-ask", "📱 ME PASSA SEU NÚMERO?", 110, 1000, "#fff", 46)}
    <div id="s6-bal" data-layout-allow-overlap style="position:absolute;left:300px;top:380px;width:740px;z-index:7">
      <div id="s6-bal-in" style="background:#fff;border:8px solid {INK};border-radius:50px;box-shadow:10px 10px 0 {INK};padding:24px 30px;font-family:'Archivo Black';font-size:44px;line-height:1.15;color:{INK};text-align:center">"se o prédio pegar fogo,<br>eu te aviso 😂"</div></div>'''
    js = f'''
      tl.fromTo("#s6-phone", {{ y: 900, rotation: -8 }}, {{ y: 0, rotation: 2, duration: .4, ease: "back.out(1.3)" }}, 0);
      hfPop(tl, "#s6-ask-in", {L(sc, 5, "pediu")}, -3);
      tl.fromTo("#s6-bal-in", {{ scale: 0 }}, {{ scale: 1, duration: .35, ease: "back.out(2)", transformOrigin: "20% 100%" }}, {L(sc, 5, "predio") - .2});'''
    write(sc, scene(sc, body, js, bg="#2a9d8f"))


# ------------------------------------------------------------------ S7 o celular cai
def metro():
    lines = [("#e03131", "M40 200 C200 260 300 120 520 220"), ("#1c7ed6", "M120 40 C160 200 360 260 380 520"), ("#f2c230", "M20 420 C200 360 380 400 560 300"),
             ("#2f9e44", "M300 20 C280 200 120 300 60 520")]
    st = "".join(f'<circle cx="{x}" cy="{y}" r="13" fill="#fff" stroke="{INK}" stroke-width="5"/>' for x, y in [(200, 222), (300, 165), (330, 380), (170, 380), (420, 330), (260, 300)])
    return (f'<svg viewBox="0 0 580 560" width="100%" height="100%" preserveAspectRatio="none" style="position:absolute;inset:0">'
            + "".join(f'<path class="s7-line" d="{d}" stroke="{c}" stroke-width="16" fill="none" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1.2" stroke-dashoffset="1.1"/>' for c, d in lines)
            + f'<g id="s7-st">{st}</g>'
            + "".join(f'<path d="{d}" stroke="#fff" stroke-width="4" fill="none" opacity=".9"/>' for d in ["M290 280 L150 120", "M290 280 L470 90", "M290 280 L520 420", "M290 280 L90 470", "M290 280 L330 540"])
            + '</svg>')


def s7():
    sc = "s7-crack"
    d = D(sc)
    body = f'''
    {bg("s7", "#3a0ca3", True, 540, 760)}
    <div id="s7-fall" style="position:absolute;left:340px;top:200px;width:400px;height:640px;z-index:4">
      <div style="position:absolute;inset:0;border-radius:50px;background:#14151a;border:12px solid {INK}"></div>
      <div style="position:absolute;left:20px;top:20px;right:20px;bottom:20px;border-radius:36px;background:#0e1d24"></div></div>
    {sfx_word("s7-nao", "NÃÃÃO!", "#fff", 130, -8, "left:90px;top:900px;z-index:8")}
    <div id="s7-big" class="clip" data-start="{L(sc, 6, "tela", 1) - .4:.2f}" data-duration="{d - L(sc, 6, "tela", 1) + .4:.2f}" style="position:absolute;inset:0;z-index:5">
      {bg("s7b", "#1b1b2f", False)}
      <div style="position:absolute;left:150px;top:300px;width:780px;height:860px">
        <div style="position:absolute;inset:0;border-radius:70px;background:#14151a;border:14px solid {INK};box-shadow:16px 16px 0 {INK}"></div>
        <div style="position:absolute;left:28px;top:28px;right:28px;bottom:28px;border-radius:50px;background:#e9ecef;overflow:hidden">{metro()}</div></div>
      {tag("s7-l4", "LINHA 4 · AMARELA 🚇", 230, 1000, YEL, 46)}
    </div>
    {sfx_word("s7-crack", "CRACK!", RED, 170, 8, "left:300px;top:640px;z-index:9")}'''
    js = f'''
      tl.fromTo("#s7-fall", {{ y: -100, rotation: 0 }}, {{ y: 0, rotation: 20, duration: .6, ease: "sine.inOut" }}, 0);
      tl.to("#s7-fall", {{ y: 700, rotation: 400, duration: {max(.6, L(sc, 6, "chao") - .7):.2f}, ease: "power2.in" }}, .6);
      hfPop(tl, "#s7-nao-in", {L(sc, 6, "escorregou")}, -8);
      tl.to("#s7-nao-in", {{ scale: 0, duration: .15 }}, {L(sc, 6, "chao")});
      tl.fromTo("#s7-crack-in", {{ scale: 2.6, opacity: 0, rotation: -20 }}, {{ scale: 1, opacity: 1, rotation: 8, duration: .16, ease: "power4.in" }}, {L(sc, 6, "chao")});
      tl.to("#s7-crack-in", {{ y: -480, scale: .6, duration: .3, ease: "power3.inOut" }}, {L(sc, 6, "tela", 1) - .2});
      tl.fromTo(".s7-line", {{ strokeDashoffset: 1.1 }}, {{ strokeDashoffset: 0, duration: .5, stagger: .15, ease: "power2.out" }}, {L(sc, 6, "mapa") - .3});
      tl.fromTo("#s7-st", {{ opacity: 0 }}, {{ opacity: 1, duration: .2 }}, {L(sc, 6, "mapa") + .3});
      hfPop(tl, "#s7-l4-in", {L(sc, 6, "mapa")}, -3);'''
    write(sc, scene(sc, body, js, bg="#3a0ca3"))


# ------------------------------------------------------------------ S8 barras + porteiro
def s8():
    sc = "s8-barras"
    d = D(sc)
    booth = f'''<div style="position:relative;width:860px;height:430px;background:#264653;border:9px solid {INK};box-shadow:12px 12px 0 {INK};border-radius:20px;overflow:hidden">
      <div style="position:absolute;left:24px;top:24px;width:330px;height:220px;background:#111;border:8px solid #555;border-radius:12px;color:#7CFC00;font-family:'Space Mono';font-size:30px;padding:10px">CAM 03 · REC ●<div style="margin-top:20px;font-size:60px">🚪🩲🔥</div></div>
      <div style="position:absolute;left:380px;top:24px;right:24px;background:#1f2c34;border-radius:18px;padding:16px;font-family:Inter;color:#e9edef;font-size:30px;line-height:1.25">
        <div style="color:{YEL};font-weight:800">🏢 GRUPO DO PRÉDIO</div><b>Porteiro Zé:</b> o do 301 abriu a porta DE CUECA pra vizinha kkkkk 📸</div>
      <div style="position:absolute;left:24px;bottom:16px;font-family:'Archivo Black';font-size:40px;color:#fff">PORTARIA 👮</div></div>'''
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#5a189a"/>{speed_lines("s8-sl", 540, 600, 40, "#fff", .1)}</svg>
    {bar_rows("s8", [AFTER["money"], AFTER["health"], AFTER["love"], AFTER["rep"]])}
    {tag("s8-d2", "+10", 640, 560, GREEN, 40)}
    {tag("s8-d3", "−10", 640, 685, "#ff8fa3", 40)}
    <div id="s8-booth" data-layout-allow-overlap style="position:absolute;left:110px;top:820px;z-index:6"><div id="s8-booth-in">{booth}</div></div>'''
    js = f'''
      [0, 1, 2, 3].forEach(i => tl.fromTo("#s8-r" + i, {{ x: -900, opacity: 0 }}, {{ x: 0, opacity: 1, duration: .3, ease: "back.out(1.4)" }}, i * .08));
      tl.fromTo("#s8-f2", {{ scaleX: .5 }}, {{ scaleX: 1, duration: .6, ease: "power3.out" }}, {L(sc, 7, "subiu")});
      hfPop(tl, "#s8-d2-in", {L(sc, 7, "subiu") + .1}, -4);
      tl.fromTo("#s8-f3", {{ scaleX: 1.33 }}, {{ scaleX: 1, duration: .5, ease: "power3.in" }}, {L(sc, 7, "caiu")});
      hfPop(tl, "#s8-d3-in", {L(sc, 7, "caiu") + .1}, 4);
      tl.fromTo("#s8-r3", {{ x: 0 }}, {{ x: 14, duration: .05, repeat: 7, yoyo: true, ease: "none", immediateRender: false }}, {L(sc, 7, "caiu")});
      tl.fromTo("#s8-booth-in", {{ y: 600, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .4, ease: "back.out(1.5)" }}, {L(sc, 7, "porteiro") - .2});'''
    write(sc, scene(sc, body, js, bg="#5a189a"))


# ------------------------------------------------------------------ S9 O QUE MUDOU
def s9():
    sc = "s9-mudou"
    write(sc, upgrade_scene(sc, BEFORE, AFTER, D(sc), reveal=round(L(sc, 8, "ainda"), 2)))


# ------------------------------------------------------------------ S10 decisão
def s10():
    sc = "s10-decisao"
    d = D(sc)

    def card(k, letter, col, icon, title, chips, x):
        return f'''<div id="s10-{k}" style="position:absolute;left:{x}px;top:560px;width:390px;z-index:4">
          <div id="s10-{k}-in" style="position:relative;background:{col};border:10px solid {INK};border-radius:40px;box-shadow:14px 14px 0 {INK};padding:26px 10px 20px;text-align:center">
            <div style="position:absolute;left:-30px;top:-40px;width:110px;height:110px;border-radius:50%;background:#fff;border:9px solid {INK};font-family:'Archivo Black';font-size:66px;line-height:92px;color:{INK}">{letter}</div>
            <div style="font-size:110px;line-height:1.1">{icon}</div>
            <div style="font-family:'Archivo Black';font-size:46px;line-height:1.05;color:#fff;-webkit-text-stroke:8px {INK};paint-order:stroke fill;margin:6px 0 10px">{title}</div>
            {chips}</div></div>'''
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#1d3557"/><g id="s10-rays">{speed_lines("s10-sl", 540, 1000, 36, "#4cc9f0", .16)}</g></svg>
    <div style="position:absolute;left:0;right:0;top:360px;text-align:center;z-index:5"><div id="s10-t-in" style="display:inline-block;font-family:'Archivo Black';font-size:76px;color:{YEL};-webkit-text-stroke:11px {INK};paint-order:stroke fill;text-shadow:9px 9px 0 {INK}">DIA 5: E O CELULAR?</div></div>
    {card("a", "A", MAG, "📱", "PARCELAR<br>EM 12X", chip("s10-a1", "💰 −15", "#ff8fa3") + chip("s10-a2", "⭐ +10", GREEN), 100)}
    {card("b", "B", "#2a9d8f", "🩹", "CONSERTAR<br>COM DUREX", chip("s10-b1", "⭐ −5", "#ff8fa3"), 545)}
    <div id="s10-z" data-layout-allow-overlap style="position:absolute;left:90px;top:1000px;z-index:7"><div id="s10-z-in" style="font-family:'Archivo Black';font-size:50px;color:{RED};border:8px solid {RED};padding:2px 18px;border-radius:12px;background:rgba(255,255,255,.9)">⚠️ QUASE ZERA!</div></div>
    <div style="position:absolute;left:0;right:0;top:1115px;text-align:center;z-index:6"><div id="s10-com-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;color:#fff;-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">
      COMENTA <span style="color:#ff6fa8">A</span> OU <span style="color:#2ee6c5">B</span></div></div>'''
    js = f'''
      tl.fromTo("#s10-rays", {{ rotation: 0 }}, {{ rotation: 20, duration: {d}, ease: "none", transformOrigin: "540px 1000px" }}, 0);
      tl.fromTo("#s10-t-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2.5)" }}, 0);
      tl.fromTo("#s10-a-in", {{ x: -700, rotation: -15 }}, {{ x: 0, rotation: -3, duration: .4, ease: "back.out(1.4)" }}, {L(sc, 9, "parcelar")});
      tl.fromTo("#s10-b-in", {{ x: 700, rotation: 15 }}, {{ x: 0, rotation: 3, duration: .4, ease: "back.out(1.4)" }}, {L(sc, 9, "consertar")});
      hfPop(tl, "#s10-a1", {L(sc, 9, "caro")}, -2);
      tl.fromTo("#s10-z-in", {{ scale: 2.4, opacity: 0, rotation: -20 }}, {{ scale: 1, opacity: 1, rotation: -8, duration: .16, ease: "power4.in" }}, {L(sc, 9, "zera")});
      hfPop(tl, "#s10-a2", {L(sc, 9, "estilo")}, 2);
      hfPop(tl, "#s10-b1", {L(sc, 9, "ninguem")}, 2);
      tl.fromTo("#s10-com-in", {{ scale: 0, rotation: -10 }}, {{ scale: 1, rotation: -2, duration: .35, ease: "back.out(2.5)" }}, {L(sc, 9, "comenta")});'''
    write(sc, scene(sc, body, js, bg="#1d3557"))


# ------------------------------------------------------------------ S11 final
def s11():
    sc = "s11-final"
    d = D(sc)
    body = f'''
    <div class="full">{room("s11r", 0)}</div>
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:1"><rect width="1080" height="1920" fill="#05070f" opacity=".72"/></svg>
    {place(A("s11a", "phone"), "s11-arm", 190, 600, 700, 3)}
    <div id="s11-n" data-layout-allow-overlap style="position:absolute;left:150px;top:470px;width:780px;z-index:6">
      <div id="s11-n-in" style="position:relative;background:rgba(255,255,255,.95);border:7px solid {INK};border-radius:30px;padding:18px 24px;font-family:Inter;color:#111;overflow:hidden">
        <div style="font-weight:900;font-size:34px">💬 Carla · agora</div><div style="font-size:42px;margin-top:6px">oi vizinho 😊</div>
        <svg style="position:absolute;inset:0" width="780" height="160" viewBox="0 0 780 160" data-layout-ignore><path d="M380 0 L330 70 L420 100 L360 160 M330 70 L200 120" stroke="{INK}" stroke-width="4" fill="none" opacity=".7"/></svg></div></div>
    <div style="position:absolute;left:0;right:0;top:230px;text-align:center;z-index:6"><div id="s11-t-in" style="display:inline-block;font-family:'Archivo Black';font-size:100px;color:{YEL};-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">FALTAM {DAYS_LEFT} DIAS…</div></div>
    <div id="s11-end" class="clip" data-start="{d - 2.2:.2f}" data-duration="2.2" style="position:absolute;left:0;right:0;top:1240px;text-align:center;z-index:7">
      <div id="s11-end-in" class="tag" style="position:relative;display:inline-block;font-size:44px;background:{MAG};color:#fff">DIA 5 AMANHÃ · COMENTA A OU B 👇</div></div>'''
    js = f'''
      hfAlive(tl, "s11a", {d});
      tl.set(["#s11a-br-sad"], {{ opacity: 0 }}, 0); tl.set(["#s11a-br-worry", "#s11a-sweat"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s11a-glow", {{ opacity: 0 }}, {{ opacity: .14, duration: .4 }}, .1);
      tl.fromTo("#s11-t-in", {{ scale: 1.4, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: .3 }}, .05);
      tl.fromTo("#s11-n-in", {{ y: -200, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .35, ease: "back.out(1.6)" }}, {L(sc, 10, "carla") - .2});
      tl.fromTo("#s11-n-in", {{ x: 0 }}, {{ x: 6, duration: .05, repeat: 9, yoyo: true, ease: "none", immediateRender: false }}, {L(sc, 10, "carla") + .2});
      tl.fromTo("#s11-end-in", {{ scale: 0 }}, {{ scale: 1, duration: .35, ease: "back.out(2)" }}, {d - 2.2:.2f});'''
    write(sc, scene(sc, body, js, bg="#05070f"))


# ------------------------------------------------------------------ HUD + legendas
def hud(start, end):
    cid = "hud"
    vals = [AFTER["money"], AFTER["health"], AFTER["love"], AFTER["rep"]]
    items = "".join(f'''<div style="display:flex;align-items:center;gap:6px"><div style="font-size:34px">{ic}</div><div style="width:110px;height:22px;background:#1b1035;border:5px solid {INK};border-radius:12px;overflow:hidden;position:relative">
          <div style="width:{v}%;height:100%;background:{c}"></div><div style="position:absolute;left:70%;top:0;width:4px;height:100%;background:#fff"></div></div></div>'''
                    for (ic, _, _, _, c), v in zip(BARS, vals))
    body = f'''<div id="hud-box" style="position:absolute;left:70px;top:180px;width:820px;z-index:2">
      <div id="hud-in" style="display:flex;align-items:center;gap:18px;background:rgba(255,255,255,.92);border:7px solid {INK};border-radius:26px;padding:10px 18px;box-shadow:8px 8px 0 {INK}">
        <div style="font-family:'Archivo Black';font-size:30px;line-height:1;color:{INK};text-align:center">⏳ {DAYS_LEFT}<br><span style="font-size:28px">DIAS</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px">{items}</div></div></div>'''
    js = f'''tl.fromTo("#hud-in", {{ y: -200 }}, {{ y: 0, duration: .35, ease: "back.out(1.5)" }}, 0);
      tl.to("#hud-in", {{ y: -450, duration: .3, ease: "power2.in" }}, {round(end - start - .3, 2)});'''
    write(cid, scene(cid, body, js, "#root { background: transparent; }", bg="transparent"))


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
        rot = (-1.5, 1.2, -0.8, 1.6)[gi % 4]
        html.append(f'<div id="cg{gi}" class="clip cg" data-start="{start:.2f}" data-duration="{max(.2, end - start):.2f}"><div id="cg{gi}-in" class="cbox">{spans}</div></div>')
        js.append(f'tl.fromTo("#cg{gi}-in", {{ scale: .6, rotation: {rot - 4} }}, {{ scale: 1, rotation: {rot}, duration: .18, ease: "back.out(2.5)" }}, {start:.2f});')
        for j, w in enumerate(ws):
            js.append(f'tl.fromTo("#cw{gi}-{j}", {{ color: "#15122b" }}, {{ color: "#e5007e", duration: .05, immediateRender: false }}, {w[4]:.2f});')
    css = f'''#root {{ background: transparent; }}
      .cg {{ position:absolute; left:90px; right:150px; top:1235px; text-align:center; }}
      .cbox {{ display:inline-block; background:{YEL}; border:7px solid {INK}; box-shadow:9px 9px 0 {INK}; padding:10px 24px;
        font-family:Montserrat; font-weight:900; font-size:52px; line-height:1.12; color:{INK}; text-transform:uppercase; max-width:840px; }}'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


# ------------------------------------------------------------------ áudio + raiz
def sfx_list():
    return [
        ("impact-bass-1.mp3", 0.0, .4), ("click-soft.mp3", .6, .4), ("click-soft.mp3", 1.2, .4), ("click-soft.mp3", 1.8, .4), ("click-soft.mp3", 2.4, .4),
        ("pop.mp3", W(0, "acirrada"), .35), ("sparkle.mp3", W(0, "deu"), .45), ("impact-bass-2.mp3", W(0, "deu"), .35), ("nhec.wav", W(0, "abriu"), .5),
        ("whoosh.mp3", PSTART[1] - .1, .35), ("pop.mp3", W(1, "olhou"), .3), ("pop.mp3", W(1, "cueca"), .3), ("fogo.wav", W(1, "frango"), .35), ("pop.mp3", W(1, "ta"), .3),
        ("whoosh-short.mp3", PSTART[2] - .1, .3), ("boing.wav", W(2, "churrasco") - .7, .35), ("carimbo.wav", W(2, "churrasco"), .45),
        ("sparkle.mp3", PSTART[3], .35), ("pop.mp3", W(3, "pela"), .3), ("sparkle.mp3", W(3, "mulher"), .3), ("pop.mp3", W(3, "com"), .3),
        ("whoosh.mp3", W(4, "entregou"), .35), ("pop.mp3", W(4, "sache"), .3), ("boing.wav", W(4, "aceitou"), .4),
        ("whoosh.mp3", PSTART[5] - .1, .35), ("notification.mp3", W(5, "pediu"), .4), ("pop.mp3", W(5, "predio") - .2, .3),
        ("whoosh-cinematic.mp3" if os.path.exists(os.path.join(ROOT, "assets/sfx/whoosh-cinematic.mp3")) else "whoosh.mp3", W(6, "escorregou"), .4),
        ("glitch-1.mp3", W(6, "chao"), .5), ("impact-bass-1.mp3", W(6, "chao"), .5), ("ping.mp3", W(6, "mapa"), .3), ("pop.mp3", W(6, "metro"), .3),
        ("whoosh.mp3", PSTART[7] - .1, .35), ("sparkle.mp3", W(7, "subiu"), .3), ("bip.wav", W(7, "caiu"), .3), ("notification.mp3", W(7, "porteiro") - .2, .4),
        ("sparkle.mp3", PSTART[8], .4), ("pop.mp3", W(8, "ainda") + .4, .3), ("boing.wav", W(8, "cabelo"), .35),
        ("whoosh.mp3", W(9, "parcelar"), .4), ("whoosh.mp3", W(9, "consertar"), .4), ("pop.mp3", W(9, "caro"), .3), ("carimbo.wav", W(9, "zera"), .55),
        ("pop.mp3", W(9, "estilo"), .3), ("pop.mp3", W(9, "ninguem"), .3), ("sparkle.mp3", W(9, "comenta"), .35),
        ("whoosh-short.mp3", PSTART[10] - .1, .3), ("notification.mp3", W(10, "carla") - .2, .35),
    ]


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = [f'''      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s}" data-duration="{e - s:.2f}"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:1"></div>''' for c, s, e in SCENES]
    hs, he = SC["s8-barras"][0], SC["s10-decisao"][0]
    hosts.append(f'''      <div id="hud" data-composition-id="hud" data-composition-src="compositions/hud.html" data-start="{hs}" data-duration="{he - hs:.2f}"
        data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:10"></div>''')
    hosts.append(f'''      <div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>''')
    vd = round(dur(os.path.join(ROOT, "assets/voice/narracao-dia04.wav")), 2)
    c0, c1 = SC["s7-crack"][0], round(W(6, "chao") + 1.0, 2)  # a música para enquanto o celular cai
    m0 = 140.0
    audio = [
        f'      <audio id="voz" class="clip" src="assets/voice/narracao-dia04.wav" data-start="0" data-duration="{vd}" data-volume="1" data-track-index="4"></audio>',
        f'      <audio id="trilha-a" class="clip" src="assets/music/positive-background.mp3" data-start="0" data-duration="{c0 + .5:.2f}" data-media-start="{m0}" data-volume="0.12" data-fade-out="0.4" data-track-index="5"></audio>',
        f'      <audio id="trilha-b" class="clip" src="assets/music/positive-background.mp3" data-start="{c1}" data-duration="{TOTAL - c1:.2f}" data-media-start="{m0 + c1:.2f}" data-volume="0.12" data-fade-in="0.4" data-fade-out="1.2" data-track-index="5"></audio>',
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
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #15122b; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
    </style>
  </head>
  <body>
    <!-- O Chat Controla a Vida do Armando — DIA 4 (gerado por tools/build_chat_dia04.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
{nl.join(hosts)}
{nl.join(audio)}
    </div>
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
    hud(SC["s8-barras"][0], SC["s10-decisao"][0])
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "chat-dia04", "name": "O Chat Controla — DIA 4", "createdAt": "2026-11-07T14:00:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, [(n, s, e) for n, s, e in SCENES])
