"""Gera o DIA 5 (A venceu: parcelou o celular) de "O Chat Controla" em chat-dia05/.

Mesmo estilo HQ pop dos DIAS 1–4, com cenários novos e detalhados em cada cena
(tools/armando_cenarios.py). Estreia do Tonhão.
Uso: python3 tools/build_chat_dia05.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
import armando_cenarios as cen  # noqa: E402
from align_lib import align, caption_groups, norm  # noqa: E402
from build_chat_dia01 import BARS, CHAT_HEAD, chip, phone_ui, place  # noqa: E402
from build_chat_dia02 import bar_rows  # noqa: E402
from build_chat_dia03 import tag  # noqa: E402
from hq_lib import CYAN, GREEN, INK, MAG, RED, YEL, armando, rodrigo, scene, sfx_word  # noqa: E402
from mentes_lib import pessoa  # noqa: E402
from upgrade_scene import upgrade_scene  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chat-dia05")
COMP = os.path.join(ROOT, "compositions")
VOICE = "assets/voice/narracao-dia05.wav"
BEFORE = {"money": 20, "health": 30, "love": 20, "rep": 30}
AFTER = {"money": 5, "health": 30, "love": 20, "rep": 40}
DAYS_LEFT = 26

PARS = [
    "Dia 5.|Vocês escolheram A:|o Armando parcelou|um celular novo.",
    "Ele entrou só pra comprar um celular…|e saiu com seguro,|capinha,|película|e garantia estendida.|O vendedor era bom.",
    "O dinheiro caiu 15.|Sobrou o suficiente|pra um pastel…|sem caldo de cana.",
    "Com o celular novo,|ele finalmente mandou|mensagem pra Carla.|Escreveu e apagou 17 vezes.|Mandou:|oi, é o Armando do 302.",
    "Ela respondeu:|o do churrasco?|E pronto.|Agora ele é o cara do churrasco|pra sempre.",
    "No grupo da turma,|ele postou uma selfie|com o celular novo…|sem querer querendo.|Todo mundo achou|que ele tá rico.|O Rodrigo ficou com inveja.",
    "Reputação subiu 10.|Ninguém sabe que ele vai pagar|até o ano que vem.",
    "E o cabelo?|Continua esperando…|faltam só 6 pontos de amor.",
    "Aí chega o Tonhão,|o melhor amigo dele.|Churrasco amanhã na laje…|e é pra levar a vizinha!|Só que amanhã,|às 7 da manhã,|tem reunião com o Seu Valdir.",
    "Próxima decisão:|ir no churrasco|e chamar a Carla…|ou dormir cedo pra reunião?|Um é o coração…|o outro é a saúde.|Ou será que não?|Comenta A ou B!",
    "Faltam 26 dias…|e a Carla já sabe do churrasco.",
]
FIX = {"para": ["pra"], "ducho": ["do"], "rasco": ["churrasco"], "epronto": ["e", "pronto"], "eo": ["e", "o"],
       "cadelo": ["cabelo"], "ea": ["e", "a"], "lage": ["laje"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-resultado", "s2-loja", "s3-dinheiro", "s4-mensagem", "s5-resposta", "s6-grupo", "s7-barras",
         "s8-mudou", "s9-tonhao", "s10-decisao", "s11-final"]
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


def face(p, show, hide=("br-sad", "m-sad")):
    return (f'tl.set([{", ".join(f"{chr(34)}#{p}-{h}{chr(34)}" for h in hide)}], {{ opacity: 0 }}, 0); '
            f'tl.set([{", ".join(f"{chr(34)}#{p}-{s}{chr(34)}" for s in show)}], {{ opacity: 1 }}, 0);')


def tonhao(p):
    apron = (f'<path d="M110 390 L290 390 L300 500 L100 500 Z" fill="#fff4e0" stroke="{INK}" stroke-width="7"/>'
             f'<text x="200" y="450" text-anchor="middle" font-family="Archivo Black" font-size="26" fill="{RED}">REI DA</text>'
             f'<text x="200" y="482" text-anchor="middle" font-family="Archivo Black" font-size="26" fill="{RED}">BRASA 🔥</text>')
    svg = pessoa(p, 4, "short", "#1a1210", "#e63946", apron, beard=False)
    stache = f'<path d="M150 278 C170 258 195 262 200 272 C205 262 230 258 250 278 C235 290 215 286 200 280 C185 286 165 290 150 278 Z" fill="#1a1210" stroke="{INK}" stroke-width="4"/>'
    head, tail = svg.rsplit("</g>", 1)
    return head + stache + "</g>" + tail


SETF = '''
      function setF(tl, p, t, show, hide) { hide.forEach(id => tl.set('#' + p + '-' + id, { opacity: 0 }, t)); show.forEach(id => tl.set('#' + p + '-' + id, { opacity: 1 }, t)); }'''


# ------------------------------------------------------------------ S1 resultado (fachada do shopping)
def s1():
    sc = "s1-resultado"
    d = D(sc)
    bgh, cjs = cen.shopping("c1", d)
    import random
    rnd = random.Random(5)
    conf = "".join(f'<rect class="s1-cf" x="{rnd.uniform(40, 1040):.0f}" y="{rnd.uniform(-300, -40):.0f}" width="{rnd.choice([16, 22, 28])}" height="{rnd.choice([30, 40])}" '
                   f'fill="{rnd.choice([YEL, MAG, CYAN, GREEN, "#fff"])}" stroke="{INK}" stroke-width="3"/>' for _ in range(60))
    card = f'''<div id="s1-card" style="position:absolute;left:150px;top:520px;width:780px;z-index:5">
      <div id="s1-card-in" style="position:relative;background:{MAG};border:10px solid {INK};border-radius:40px;box-shadow:14px 14px 0 {INK};padding:30px 20px;text-align:center">
        <div style="position:absolute;left:-30px;top:-40px;width:110px;height:110px;border-radius:50%;background:#fff;border:9px solid {INK};font-family:'Archivo Black';font-size:66px;line-height:92px;color:{INK}">A</div>
        <div style="font-size:110px;line-height:1.1">📱</div>
        <div style="font-family:'Archivo Black';font-size:66px;line-height:1.05;color:#fff;-webkit-text-stroke:9px {INK};paint-order:stroke fill">PARCELAR EM 12X</div></div></div>'''
    body = f'''
    {bgh}
    <div style="position:absolute;left:70px;top:185px;z-index:8"><div id="s1-badge-in" style="font-family:'Archivo Black';font-size:96px;color:{YEL};background:{MAG};border:10px solid {INK};
      padding:0 30px;box-shadow:12px 12px 0 {INK};-webkit-text-stroke:8px {INK};paint-order:stroke fill;line-height:1.25">DIA 5</div></div>
    {card}
    {sfx_word("s1-pa", "PÁ!", YEL, 150, 10, "left:720px;top:420px;z-index:8")}
    {tag("s1-voc", "VOCÊS ESCOLHERAM: A", 170, 960, YEL, 54)}
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:7">{conf}</svg>'''
    js = f'''
      tl.fromTo("#s1-badge-in", {{ scale: 1.3, rotation: -8 }}, {{ scale: 1, rotation: -4, duration: .35, ease: "back.out(3)" }}, 0);
      tl.fromTo("#s1-card-in", {{ scale: 2.2, rotation: -20, opacity: 0 }}, {{ scale: 1, rotation: -3, opacity: 1, duration: .25, ease: "power4.in" }}, {L(sc, 0, "escolheram") - .1});
      hfPop(tl, "#s1-pa-in", {L(sc, 0, "escolheram") + .15}, 10);
      hfPop(tl, "#s1-voc-in", {L(sc, 0, "a") }, -3);
      tl.fromTo(".s1-cf", {{ y: 0, rotation: 0 }}, {{ y: (i) => 1500 + (i % 7) * 90, rotation: (i) => (i % 2 ? 1 : -1) * (200 + i * 9), duration: 2.4, stagger: .012, ease: "power1.in" }}, {L(sc, 0, "escolheram") + .15});'''
    write(sc, scene(sc, body, js + cjs, bg="#f1e3d3"))


# ------------------------------------------------------------------ S2 a loja (comprovante gigante)
def s2():
    sc = "s2-loja"
    d = D(sc)
    bgh, cjs = cen.loja_celular("c2", d)
    items = [("seguro", "+ SEGURO"), ("capinha", "+ CAPINHA"), ("pelicula", "+ PELÍCULA"), ("garantia", "+ GARANTIA ESTENDIDA")]
    lines = "".join(f'<div id="s2-i{k}" style="opacity:0">{t}</div>' for k, (_, t) in enumerate(items))
    body = f'''
    {bgh}
    {place(A("s2a"), "s2-arm", 0, 860, 560, 3)}
    {place(pessoa("s2v", 1, "slick", "#1e1a24", "#2b2d42", f'<path d="M190 360 L210 360 L220 390 L200 470 L180 390 Z" fill="{YEL}" stroke="{INK}" stroke-width="5"/>'), "s2-vend", 600, 760, 440, 3)}
    <div id="s2-rec" data-layout-allow-overlap style="position:absolute;left:330px;top:300px;width:420px;z-index:5">
      <div id="s2-rec-in" style="background:#fffdf5;border:7px solid {INK};box-shadow:10px 10px 0 {INK};padding:20px 24px;font-family:'Space Mono';font-weight:700;font-size:34px;line-height:1.35;color:{INK};transform-origin:50% 0%">
        <div style="text-align:center;font-family:'Archivo Black';font-size:38px">CELULAR JÁ</div>
        <div>CELULAR NOVO</div><div style="color:{RED}">12x R$ 199,90</div>{lines}
        <div style="border-top:5px dashed {INK};margin-top:8px;padding-top:6px">OBRIGADO, VOLTE SEMPRE 😈</div></div></div>
    {tag("s2-bom", "O VENDEDOR ERA BOM 🦈", 120, 1080, YEL, 48)}'''
    js = SETF + f'''
      hfAlive(tl, "s2a", {d}); hfAlive(tl, "s2v", {d});
      {face("s2a", ["br-worry", "m-grin"])}
      tl.fromTo("#s2-rec-in", {{ scaleY: 0 }}, {{ scaleY: 1, duration: .5, ease: "steps(6)" }}, {L(sc, 1, "comprar")});
      ''' + "".join(f'tl.fromTo("#s2-i{k}", {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: .15 }}, {L(sc, 1, w)});\n      ' for k, (w, _) in enumerate(items)) + f'''
      tl.fromTo(".s2v-pupil", {{ x: 0 }}, {{ x: -12, duration: .2 }}, {L(sc, 1, "seguro")});
      setF(tl, "s2a", {L(sc, 1, "garantia")}, ["sweat", "br-shock"], ["br-worry"]);
      hfPop(tl, "#s2-bom-in", {L(sc, 1, "garantia") + .5}, -3);
      tl.fromTo("#s2-vend", {{ rotation: 0 }}, {{ rotation: 4, duration: .2, repeat: 3, yoyo: true, transformOrigin: "50% 100%" }}, {L(sc, 1, "bom")});'''
    write(sc, scene(sc, body, js + cjs, bg="#1b1340"))


# ------------------------------------------------------------------ S3 o dinheiro (pastelaria)
MOTH = f'''<svg viewBox="0 0 160 110" width="160" height="110"><path d="M80 55 C40 0 0 20 10 60 C20 90 60 80 80 55 Z M80 55 C120 0 160 20 150 60 C140 90 100 80 80 55 Z" fill="#c2b59b" stroke="{INK}" stroke-width="6"/>
  <ellipse cx="80" cy="60" rx="10" ry="26" fill="#8a7a5e" stroke="{INK}" stroke-width="5"/><path d="M75 36 q-10 -20 -20 -22 M85 36 q10 -20 20 -22" stroke="{INK}" stroke-width="4" fill="none"/></svg>'''


def s3():
    sc = "s3-dinheiro"
    d = D(sc)
    bgh, cjs = cen.pastelaria("c3", d)
    bar = f'''<div id="s3-bar" style="position:absolute;left:110px;top:980px;width:860px;z-index:6">
      <div style="position:relative;height:120px;background:#fff;border:9px solid {INK};border-radius:30px;box-shadow:12px 12px 0 {INK};padding:14px 20px">
        <div style="position:absolute;left:20px;top:10px;font-size:76px">💰</div>
        <div style="position:absolute;left:130px;top:28px;width:560px;height:52px;background:#1b1035;border:7px solid {INK};border-radius:26px;overflow:hidden">
          <div id="s3-fill" style="width:20%;height:100%;background:{YEL};transform-origin:0% 50%"></div></div>
        <div id="s3-num" style="position:absolute;left:720px;top:14px;font-family:'Archivo Black';font-size:66px;color:{INK}">20</div></div></div>'''
    body = f'''
    {bgh}
    {place(A("s3a"), "s3-arm", 520, 1150, 560, 3)}
    {bar}
    <div id="s3-wal" data-layout-allow-overlap style="position:absolute;left:130px;top:1300px;z-index:5"><div style="width:280px;height:180px;background:#6f4e37;border:9px solid {INK};border-radius:24px;box-shadow:10px 10px 0 {INK}"></div></div>
    <div id="s3-moth" data-layout-allow-overlap style="position:absolute;left:190px;top:1260px;z-index:6">{MOTH}</div>
    {tag("s3-q", "⚠️ QUASE ZERADO", 470, 860, "#fff", 46, 8, RED)}
    {tag("s3-pas", "🥟 PASTEL ✓ · 🥤 CALDO ✗", 150, 380, "#fff", 46)}'''
    js = f'''
      hfAlive(tl, "s3a", {d});
      {face("s3a", ["br-worry", "m-sad"], ("br-sad",))}
      tl.fromTo("#s3-bar", {{ y: 500, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .35, ease: "back.out(1.4)" }}, 0);
      tl.fromTo("#s3-fill", {{ scaleX: 1 }}, {{ scaleX: .25, duration: .7, ease: "power3.in" }}, {L(sc, 2, "caiu")});
      tl.fromTo("#s3-num", {{ innerText: 20 }}, {{ innerText: 5, duration: .7, snap: {{ innerText: 1 }}, ease: "power3.in" }}, {L(sc, 2, "caiu")});
      tl.fromTo("#s3-bar", {{ x: 0 }}, {{ x: 12, duration: .05, repeat: 9, yoyo: true, ease: "none", immediateRender: false }}, {L(sc, 2, "15") + .4});
      tl.fromTo("#s3-q-in", {{ scale: 2.4, opacity: 0, rotation: -20 }}, {{ scale: 1, opacity: 1, rotation: -6, duration: .16, ease: "power4.in" }}, {L(sc, 2, "15") + .4});
      tl.fromTo("#s3-moth", {{ x: 0, y: 60, opacity: 0 }}, {{ x: 140, y: -420, opacity: 1, duration: 1.6, ease: "sine.out" }}, {L(sc, 2, "sobrou")});
      tl.fromTo("#s3-moth", {{ rotation: -10 }}, {{ rotation: 10, duration: .12, repeat: 13, yoyo: true, ease: "none", immediateRender: false }}, {L(sc, 2, "sobrou")});
      hfPop(tl, "#s3-pas-in", {L(sc, 2, "pastel")}, -3);'''
    write(sc, scene(sc, body, js + cjs, bg="#ffe0b2"))


# ------------------------------------------------------------------ S4 a mensagem (ponto de ônibus)
def s4():
    sc = "s4-mensagem"
    d = D(sc)
    bgh, cjs = cen.ponto_onibus("c4", d)
    drafts = ["oi", "olá, vizinha", "e aí, sobreviveu ao meu churrasco?", "oi Carla, tudo bem? então..."]
    dr = "".join(f'<div id="s4-d{k}" style="opacity:0;position:relative;margin:10px 0;font-size:36px;color:#e9edef;background:#005c4b;border-radius:18px;padding:10px 16px;display:inline-block">{t}'
                 f'<div id="s4-x{k}" style="position:absolute;left:-6px;right:-6px;top:50%;height:7px;background:{RED};transform-origin:0% 50%"></div></div><br>' for k, t in enumerate(drafts))
    ui = f'''<div style="height:110px;background:#1f2c34;display:flex;align-items:center;gap:18px;padding:0 24px;font-family:Inter;color:#e9edef">
        <div style="width:70px;height:70px;border-radius:50%;background:{MAG};border:4px solid {INK};font-size:40px;text-align:center;line-height:64px">👩</div>
        <div style="font-weight:700;font-size:38px">Carla (vizinha) 🔥</div></div>
      <div style="padding:20px 24px;font-family:Inter;text-align:right">{dr}
        <div id="s4-sent" style="opacity:0;display:inline-block;margin-top:14px;font-size:40px;font-weight:700;color:#111;background:#d9fdd3;border:4px solid {INK};border-radius:20px;padding:12px 18px">oi, é o Armando do 302 😎 <span style="color:#53bdeb">✓✓</span></div></div>'''
    body = f'''
    {bgh}
    {place(A("s4a", "phone"), "s4-arm", -40, 1020, 560, 3)}
    {phone_ui("s4", ui, 400, 300, 640, 900)}
    <div id="s4-cnt" data-layout-allow-overlap style="position:absolute;left:60px;top:560px;z-index:7"><div id="s4-cnt-in" class="tag" style="position:relative;background:{YEL};font-size:48px">APAGOU: <span id="s4-n">0</span>x</div></div>'''
    js = f'''
      hfAlive(tl, "s4a", {d});
      {face("s4a", ["br-worry", "sweat", "m-grin"])}
      tl.set("#s4a-glow", {{ opacity: .15 }}, 0);
      tl.fromTo("#s4-phone", {{ y: 900 }}, {{ y: 0, duration: .4, ease: "back.out(1.3)" }}, .1);'''
    t0, t1 = L(sc, 3, "escreveu") - 1.6, L(sc, 3, "mandou", 1) - .2
    step = (t1 - t0) / len(drafts)
    for k in range(len(drafts)):
        a = round(t0 + k * step, 2)
        js += f'''
      tl.fromTo("#s4-d{k}", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: .12 }}, {a});
      tl.fromTo("#s4-x{k}", {{ scaleX: 0 }}, {{ scaleX: 1, duration: .15 }}, {round(a + step * .55, 2)});
      tl.to("#s4-d{k}", {{ opacity: .35, duration: .1 }}, {round(a + step * .75, 2)});'''
    js += f'''
      tl.fromTo("#s4-cnt-in", {{ scale: 0 }}, {{ scale: 1, rotation: -4, duration: .3, ease: "back.out(2)" }}, {L(sc, 3, "escreveu")});
      tl.fromTo("#s4-n", {{ innerText: 0 }}, {{ innerText: 17, duration: 1.2, snap: {{ innerText: 1 }}, ease: "none" }}, {L(sc, 3, "escreveu")});
      tl.fromTo("#s4-sent", {{ opacity: 0, scale: .5 }}, {{ opacity: 1, scale: 1, duration: .25, ease: "back.out(2)" }}, {L(sc, 3, "oi")});'''
    write(sc, scene(sc, body, js + cjs, bg="#ffd6a5"))


# ------------------------------------------------------------------ S5 a resposta (portaria)
def s5():
    sc = "s5-resposta"
    d = D(sc)
    bgh, cjs = cen.portaria("c5", d)
    body = f'''
    {bgh}
    {place(pessoa("s5z", 3, "cap", "#1d3557", "#457b9d"), "s5-ze", 760, 660, 300, 2)}
    {place(A("s5a", "phone"), "s5-arm", 120, 900, 640, 3)}
    <div id="s5-typ" data-layout-allow-overlap style="position:absolute;left:150px;top:400px;z-index:6"><div id="s5-typ-in" style="background:#fff;border:7px solid {INK};border-radius:30px;padding:10px 26px;font-family:Inter;font-weight:700;font-size:40px;color:#555;box-shadow:8px 8px 0 {INK}">Carla está digitando<span id="s5-dots">…</span></div></div>
    <div id="s5-msg" data-layout-allow-overlap style="position:absolute;left:150px;top:520px;z-index:7"><div id="s5-msg-in" style="background:#fff;border:8px solid {INK};border-radius:34px;padding:18px 30px;font-family:Inter;font-weight:800;font-size:56px;color:#111;box-shadow:10px 10px 0 {INK}">o do churrasco? 😂</div></div>
    {sfx_word("s5-ha", "KKKK", YEL, 90, 8, "left:700px;top:660px;z-index:8")}
    {tag("s5-tag", "O CARA DO CHURRASCO 🍖 (PRA SEMPRE)", 70, 760, "#fff", 42)}'''
    js = SETF + f'''
      hfAlive(tl, "s5a", {d}); hfAlive(tl, "s5z", {d});
      {face("s5a", ["br-worry", "m-grin"])}
      tl.set("#s5a-glow", {{ opacity: .15 }}, 0);
      tl.fromTo("#s5-typ-in", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "back.out(2)" }}, .05);
      tl.fromTo("#s5-dots", {{ opacity: 1 }}, {{ opacity: 0, duration: .25, repeat: 5, yoyo: true, ease: "steps(1)" }}, .2);
      tl.to("#s5-typ-in", {{ scale: 0, duration: .15 }}, {L(sc, 4, "do") - .25});
      tl.fromTo("#s5-msg-in", {{ scale: 0, rotation: -6 }}, {{ scale: 1, rotation: -2, duration: .3, ease: "back.out(2)" }}, {L(sc, 4, "do") - .1});
      setF(tl, "s5a", {L(sc, 4, "pronto")}, ["br-shock", "sweat"], ["br-worry"]);
      setF(tl, "s5z", {L(sc, 4, "pronto")}, ["m-o"], ["m-smile"]);
      hfPop(tl, "#s5-ha-in", {L(sc, 4, "pronto")}, 8);
      tl.fromTo("#s5-ze", {{ y: 0 }}, {{ y: -14, duration: .12, repeat: 11, yoyo: true, ease: "sine.inOut", immediateRender: false }}, {L(sc, 4, "pronto")});
      hfPop(tl, "#s5-tag-in", {L(sc, 4, "cara")}, -3);'''
    write(sc, scene(sc, body, js + cjs, bg="#d8e2dc"))


# ------------------------------------------------------------------ S6 grupo da turma (selfie no banheiro)
def s6():
    sc = "s6-grupo"
    d = D(sc)
    bgh, cjs = cen.banheiro("c6", d)

    def msg(cid, who, col, text):
        return (f'<div id="{cid}" style="opacity:0;margin:10px 0;max-width:520px;background:#1f2c34;border-radius:20px;padding:10px 18px;font-family:Inter;font-size:32px;color:#e9edef">'
                f'<div style="font-weight:800;color:{col};font-size:28px">{who}</div>{text}</div>')
    ui = CHAT_HEAD + f'''<div style="padding:16px 20px">
      <div id="s6-sel" style="opacity:0;margin-left:auto;width:330px;background:#005c4b;border-radius:20px;padding:10px">
        <div style="position:relative;height:300px;background:#bde0fe;border-radius:14px;overflow:hidden"><div style="position:absolute;left:10px;top:10px;width:310px">{A("s6s", "phone")}</div></div>
        <div style="font-family:Inter;font-size:28px;color:#e9edef;margin-top:6px">nada demais, só o celular novo 🤳</div></div>
      {msg("s6-m1", "Paulinha", "#ff8fd8", "eita, tá podendo! 🤑")}
      {msg("s6-m2", "Juninho", "#8ce99a", "gerente é outro nível 👔")}
      {msg("s6-m3", "Rodrigo", "#ffd23f", "🙄")}</div>'''
    body = f'''
    {bgh}
    {phone_ui("s6", ui, 170, 300, 740, 960)}
    <div id="s6-rod" data-layout-allow-overlap style="position:absolute;left:640px;top:1040px;width:380px;z-index:6">
      <div id="s6-rod-in" class="panel" style="position:relative;width:340px;height:340px;background:#ff8fa3;box-shadow:10px 10px 0 {INK};overflow:hidden">
        <div style="position:absolute;left:-30px;top:-10px;width:400px">{rodrigo("s6r")}</div></div></div>
    {tag("s6-sq", "SEM QUERER QUERENDO 😏", 70, 1150, YEL, 44)}'''
    js = f'''
      hfAlive(tl, "s6s", {d}); hfAlive(tl, "s6r", {d});
      {face("s6s", ["m-smirk"], ("m-sad",))}
      tl.fromTo("#s6-phone", {{ y: 900, rotation: 6 }}, {{ y: 0, rotation: -2, duration: .4, ease: "back.out(1.3)" }}, 0);
      tl.fromTo("#s6-sel", {{ opacity: 0, scale: .6 }}, {{ opacity: 1, scale: 1, duration: .25, ease: "back.out(2)" }}, {L(sc, 5, "selfie")});
      hfPop(tl, "#s6-sq-in", {L(sc, 5, "querer")}, -3);
      tl.fromTo("#s6-m1", {{ opacity: 0, x: -40 }}, {{ opacity: 1, x: 0, duration: .2 }}, {L(sc, 5, "todo")});
      tl.fromTo("#s6-m2", {{ opacity: 0, x: -40 }}, {{ opacity: 1, x: 0, duration: .2 }}, {L(sc, 5, "rico") - .2});
      tl.fromTo("#s6-m3", {{ opacity: 0, x: -40 }}, {{ opacity: 1, x: 0, duration: .2 }}, {L(sc, 5, "rodrigo") - .1});
      tl.fromTo("#s6-rod-in", {{ scale: 0, rotation: 15 }}, {{ scale: 1, rotation: 4, duration: .35, ease: "back.out(2)" }}, {L(sc, 5, "rodrigo")});'''
    write(sc, scene(sc, body, js + cjs, bg="#a2d2ff"))


# ------------------------------------------------------------------ S7 barras (palco)
def s7():
    sc = "s7-barras"
    d = D(sc)
    bgh, cjs = cen.palco("c7", d)
    body = f'''
    {bgh}
    <div style="position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:3">{bar_rows("s7", [AFTER["money"], AFTER["health"], AFTER["love"], AFTER["rep"]], top=360)}</div>
    {tag("s7-d3", "+10", 660, 765, GREEN, 40)}
    {tag("s7-par", "PARCELA 1/12 😬", 330, 960, "#fff", 52, 8, RED)}'''
    js = f'''
      [0, 1, 2, 3].forEach(i => tl.fromTo("#s7-r" + i, {{ x: -900, opacity: 0 }}, {{ x: 0, opacity: 1, duration: .3, ease: "back.out(1.4)" }}, i * .08));
      tl.fromTo("#s7-f3", {{ scaleX: .75 }}, {{ scaleX: 1, duration: .6, ease: "power3.out" }}, {L(sc, 6, "subiu")});
      tl.fromTo("#s7-v3", {{ innerText: 30 }}, {{ innerText: 40, duration: .6, snap: {{ innerText: 1 }} }}, {L(sc, 6, "subiu")});
      hfPop(tl, "#s7-d3-in", {L(sc, 6, "subiu") + .1}, -4);
      tl.fromTo("#s7-par-in", {{ scale: 2.4, opacity: 0, rotation: -20 }}, {{ scale: 1, opacity: 1, rotation: -5, duration: .16, ease: "power4.in" }}, {L(sc, 6, "ninguem")});'''
    write(sc, scene(sc, body, js + cjs, bg="#2b0f3a"))


# ------------------------------------------------------------------ S8 O QUE MUDOU
def s8():
    sc = "s8-mudou"
    write(sc, upgrade_scene(sc, BEFORE, AFTER, D(sc), reveal=round(L(sc, 7, "continua"), 2)))


# ------------------------------------------------------------------ S9 Tonhão (laje)
def s9():
    sc = "s9-tonhao"
    d = D(sc)
    bgh, cjs = cen.laje("c9", d)
    wave = "".join(f'<rect class="s9-w" x="{110 + 16*i}" y="{30 - h}" width="9" height="{2*h}" rx="4" fill="#53bdeb"/>' for i, h in enumerate([8, 16, 24, 12, 26, 18, 10, 22, 28, 14, 20, 8, 16, 24, 12, 20]))
    audio = f'''<div style="background:#d9fdd3;border:7px solid {INK};border-radius:30px;padding:14px 20px;box-shadow:10px 10px 0 {INK};width:520px">
      <svg viewBox="0 0 400 60" width="480" height="70" data-layout-ignore><circle cx="40" cy="30" r="26" fill="#2a9d8f"/><path d="M33 18 L52 30 L33 42 Z" fill="#fff"/>{wave}</svg>
      <div style="font-family:Inter;font-weight:800;font-size:34px;color:#111">"churrasco amanhã aqui na laje, traz a vizinha!!! 🍖🍖"</div></div>'''
    cal = f'''<div style="width:380px;background:#fff;border:8px solid {INK};box-shadow:10px 10px 0 {INK};text-align:center;font-family:'Archivo Black'">
      <div style="background:{RED};color:#fff;font-size:40px;padding:6px">AMANHÃ</div>
      <div style="font-size:90px;color:{INK};line-height:1.1">7H</div><div style="font-size:30px;color:{INK};padding:0 10px 12px">REUNIÃO COM O SEU VALDIR 😠</div></div>'''
    body = f'''
    {bgh}
    {place(tonhao("s9t"), "s9-ton", 330, 700, 700, 3)}
    {tag("s9-fic", "TONHÃO · MELHOR AMIGO · REI DA BRASA 🔥", 50, 330, YEL, 38)}
    <div id="s9-au" data-layout-allow-overlap style="position:absolute;left:60px;top:450px;z-index:6"><div id="s9-au-in">{audio}</div></div>
    <div id="s9-cal" data-layout-allow-overlap style="position:absolute;left:60px;top:880px;z-index:7"><div id="s9-cal-in">{cal}</div></div>'''
    js = f'''
      hfAlive(tl, "s9t", {d});
      tl.fromTo("#s9-ton", {{ x: 600 }}, {{ x: 0, duration: .4, ease: "back.out(1.3)" }}, 0);
      hfPop(tl, "#s9-fic-in", {L(sc, 8, "tonhao")}, -2);
      tl.fromTo("#s9-au-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2)", transformOrigin: "0% 100%" }}, {L(sc, 8, "churrasco") - .2});
      tl.fromTo(".s9-w", {{ scaleY: .3 }}, {{ scaleY: 1, duration: .15, stagger: {{ each: .04, repeat: 9, yoyo: true }}, ease: "none", transformOrigin: "50% 50%" }}, {L(sc, 8, "churrasco")});
      tl.fromTo("#s9-cal-in", {{ y: 600, rotation: 20 }}, {{ y: 0, rotation: -4, duration: .35, ease: "back.out(1.6)" }}, {L(sc, 8, "so")});
      tl.fromTo("#s9-cal-in", {{ x: 0 }}, {{ x: 10, duration: .05, repeat: 9, yoyo: true, ease: "none", immediateRender: false }}, {L(sc, 8, "valdir")});'''
    write(sc, scene(sc, body, js + cjs, bg="#ff9e6d"))


# ------------------------------------------------------------------ S10 decisão (churrasco | cama)
def s10():
    sc = "s10-decisao"
    d = D(sc)
    bgh, cjs = cen.decisao_split("c10", d)
    mex = "MEXE COM: ❤️ 💘"

    def card(k, letter, col, icon, title, x):
        return f'''<div id="s10-{k}" style="position:absolute;left:{x}px;top:560px;width:390px;z-index:4">
          <div id="s10-{k}-in" style="position:relative;background:{col};border:10px solid {INK};border-radius:40px;box-shadow:14px 14px 0 {INK};padding:26px 10px 20px;text-align:center">
            <div style="position:absolute;left:-30px;top:-40px;width:110px;height:110px;border-radius:50%;background:#fff;border:9px solid {INK};font-family:'Archivo Black';font-size:66px;line-height:92px;color:{INK}">{letter}</div>
            <div style="font-size:110px;line-height:1.1">{icon}</div>
            <div style="font-family:'Archivo Black';font-size:44px;line-height:1.05;color:#fff;-webkit-text-stroke:8px {INK};paint-order:stroke fill;margin:6px 0 10px">{title}</div>
            {chip(f"s10-{k}c", mex, "#fff")}</div></div>'''
    body = f'''
    {bgh}
    <div style="position:absolute;left:0;right:0;top:340px;text-align:center;z-index:5"><div id="s10-t-in" style="display:inline-block;font-family:'Archivo Black';font-size:74px;color:{YEL};-webkit-text-stroke:11px {INK};paint-order:stroke fill;text-shadow:9px 9px 0 {INK}">DIA 6: CHURRASCO?</div></div>
    {card("a", "A", "#e76f51", "🍖💘", "IR E CHAMAR<br>A CARLA", 95)}
    {card("b", "B", "#457b9d", "😴⏰", "DORMIR<br>CEDO", 595)}
    <div style="position:absolute;left:0;right:0;top:1115px;text-align:center;z-index:6"><div id="s10-com-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;color:#fff;-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">
      COMENTA <span style="color:#ff9f6e">A</span> OU <span style="color:#8ecae6">B</span></div></div>
    {sfx_word("s10-sera", "SERÁ? 🤔", "#fff", 80, -5, "left:330px;top:960px;z-index:8")}'''
    js = f'''
      tl.fromTo("#s10-t-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2.5)" }}, 0);
      tl.fromTo("#s10-a-in", {{ x: -700, rotation: -15 }}, {{ x: 0, rotation: -3, duration: .4, ease: "back.out(1.4)" }}, {L(sc, 9, "ir")});
      tl.fromTo("#s10-b-in", {{ x: 700, rotation: 15 }}, {{ x: 0, rotation: 3, duration: .4, ease: "back.out(1.4)" }}, {L(sc, 9, "dormir")});
      hfPop(tl, "#s10-ac", {L(sc, 9, "coracao")}, -2);
      hfPop(tl, "#s10-bc", {L(sc, 9, "saude")}, 2);
      hfPop(tl, "#s10-sera-in", {L(sc, 9, "sera")}, -5);
      tl.to("#s10-sera-in", {{ scale: 0, duration: .15 }}, {L(sc, 9, "comenta") - .1});
      tl.fromTo("#s10-com-in", {{ scale: 0, rotation: -10 }}, {{ scale: 1, rotation: -2, duration: .35, ease: "back.out(2.5)" }}, {L(sc, 9, "comenta")});'''
    write(sc, scene(sc, body, js + cjs, bg="#1d3557"))


# ------------------------------------------------------------------ S11 final (quarto à noite)
def s11():
    sc = "s11-final"
    d = D(sc)
    bgh, cjs = cen.quarto_noite("c11", d)
    body = f'''
    {bgh}
    {place(A("s11a", "phone"), "s11-arm", 190, 720, 700, 3)}
    <div id="s11-n" data-layout-allow-overlap style="position:absolute;left:150px;top:500px;width:780px;z-index:6">
      <div id="s11-n-in" style="position:relative;background:rgba(255,255,255,.95);border:7px solid {INK};border-radius:30px;padding:18px 24px;font-family:Inter;color:#111">
        <div style="font-weight:900;font-size:34px">💬 Carla · agora</div><div style="font-size:46px;margin-top:6px">churrasco? 👀🍖</div></div></div>
    <div style="position:absolute;left:0;right:0;top:250px;text-align:center;z-index:6"><div id="s11-t-in" style="display:inline-block;font-family:'Archivo Black';font-size:100px;color:{YEL};-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">FALTAM {DAYS_LEFT} DIAS…</div></div>
    <div id="s11-end" class="clip" data-start="{d - 1.7:.2f}" data-duration="1.7" style="position:absolute;left:0;right:0;top:1240px;text-align:center;z-index:7">
      <div id="s11-end-in" class="tag" style="position:relative;display:inline-block;font-size:44px;background:{MAG};color:#fff">DIA 6 AMANHÃ · COMENTA A OU B 👇</div></div>'''
    js = SETF + f'''
      hfAlive(tl, "s11a", {d});
      {face("s11a", ["br-worry", "m-grin"])}
      tl.fromTo("#s11a-glow", {{ opacity: 0 }}, {{ opacity: .18, duration: .4 }}, .1);
      tl.fromTo("#s11-t-in", {{ scale: 1.4, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: .3 }}, .05);
      tl.fromTo("#s11-n-in", {{ y: -200, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .35, ease: "back.out(1.6)" }}, {L(sc, 10, "carla") - .2});
      setF(tl, "s11a", {L(sc, 10, "carla")}, ["br-shock", "sweat", "m-shock"], ["br-worry", "m-grin"]);
      tl.fromTo("#s11-end-in", {{ scale: 0 }}, {{ scale: 1, duration: .35, ease: "back.out(2)" }}, {d - 1.7:.2f});'''
    write(sc, scene(sc, body, js + cjs, bg="#1b2240"))


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
            js.append(f'tl.fromTo("#cw{gi}-{j}", {{ color: "#15122b" }}, {{ color: "#c8006e", duration: .05, immediateRender: false }}, {w[4]:.2f});')
    css = f'''#root {{ background: transparent; }}
      .cg {{ position:absolute; left:90px; right:150px; top:1235px; text-align:center; }}
      .cbox {{ display:inline-block; background:{YEL}; border:7px solid {INK}; box-shadow:9px 9px 0 {INK}; padding:10px 24px;
        font-family:Montserrat; font-weight:900; font-size:52px; line-height:1.12; color:{INK}; text-transform:uppercase; max-width:840px; }}'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


# ------------------------------------------------------------------ áudio + raiz
def sfx_list():
    return [
        ("impact-bass-1.mp3", 0.0, .4), ("carimbo.wav", W(0, "escolheram") + .1, .55), ("sparkle.mp3", W(0, "escolheram") + .15, .4),
        ("whoosh.mp3", PSTART[1] - .1, .35), ("caixa.wav", W(1, "comprar"), .45), ("pop.mp3", W(1, "seguro"), .3), ("pop.mp3", W(1, "capinha"), .3),
        ("pop.mp3", W(1, "pelicula"), .3), ("pop.mp3", W(1, "garantia"), .3), ("ping.mp3", W(1, "vendedor"), .35),
        ("whoosh-short.mp3", PSTART[2] - .1, .3), ("error.mp3", W(2, "caiu"), .4), ("alarme.wav", W(2, "15") + .4, .3), ("mosca.wav", W(2, "sobrou"), .3),
        ("whoosh.mp3", PSTART[3] - .1, .35), ("typing.mp3", W(3, "escreveu") - 1.6, .3), ("typing.mp3", W(3, "apagou"), .3), ("notification.mp3", W(3, "oi"), .4),
        ("typing.mp3", PSTART[4], .25), ("notification.mp3", W(4, "do") - .1, .45), ("boing.wav", W(4, "pronto"), .35), ("pop.mp3", W(4, "cara"), .3),
        ("whoosh.mp3", PSTART[5] - .1, .35), ("click-soft.mp3", W(5, "selfie"), .4), ("notification.mp3", W(5, "todo"), .3), ("notification.mp3", W(5, "rico") - .2, .3), ("boing.wav", W(5, "rodrigo"), .35),
        ("whoosh.mp3", PSTART[6] - .1, .35), ("sparkle.mp3", W(6, "subiu"), .4), ("carimbo.wav", W(6, "ninguem"), .45),
        ("sparkle.mp3", PSTART[7], .4), ("pop.mp3", W(7, "continua") + .4, .3), ("boing.wav", W(7, "faltam"), .35),
        ("whoosh.mp3", PSTART[8] - .1, .35), ("fogo.wav", PSTART[8] + .2, .3), ("pop.mp3", W(8, "tonhao"), .3), ("notification.mp3", W(8, "churrasco") - .2, .35),
        ("whoosh.mp3", W(8, "so"), .35), ("alarme.wav", W(8, "valdir"), .3),
        ("whoosh.mp3", W(9, "ir"), .4), ("whoosh.mp3", W(9, "dormir"), .4), ("pop.mp3", W(9, "coracao"), .3), ("pop.mp3", W(9, "saude"), .3),
        ("boing.wav", W(9, "sera"), .35), ("sparkle.mp3", W(9, "comenta"), .35),
        ("whoosh-short.mp3", PSTART[10] - .1, .3), ("notification.mp3", W(10, "carla") - .2, .4),
    ]


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = [f'''      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s}" data-duration="{e - s:.2f}"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:1"></div>''' for c, s, e in SCENES]
    hs, he = SC["s7-barras"][0], SC["s10-decisao"][0]
    hosts.append(f'''      <div id="hud" data-composition-id="hud" data-composition-src="compositions/hud.html" data-start="{hs}" data-duration="{he - hs:.2f}"
        data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:10"></div>''')
    hosts.append(f'''      <div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>''')
    vd = round(dur(os.path.join(ROOT, VOICE)), 2)
    c0, c1 = round(W(2, "caiu") - .1, 2), round(W(2, "15") + 1.2, 2)  # a música para quando o dinheiro cai
    m0 = 30.0
    audio = [
        f'      <audio id="voz" class="clip" src="{VOICE}" data-start="0" data-duration="{vd}" data-volume="1" data-track-index="4"></audio>',
        f'      <audio id="trilha-a" class="clip" src="assets/music/positive-background.mp3" data-start="0" data-duration="{c0:.2f}" data-media-start="{m0}" data-volume="0.12" data-fade-out="0.3" data-track-index="5"></audio>',
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
    <!-- O Chat Controla a Vida do Armando — DIA 5 (gerado por tools/build_chat_dia05.py) -->
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
    hud(SC["s7-barras"][0], SC["s10-decisao"][0])
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "chat-dia05", "name": "O Chat Controla — DIA 5", "createdAt": "2026-11-07T22:40:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, [(n, s, e) for n, s, e in SCENES])
