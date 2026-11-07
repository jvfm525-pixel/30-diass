"""Gera o episódio único "E se você pudesse ler mentes por 1 dia?" em mentes/.

Estilo HQ pop, legendas sincronizadas pela transcrição.
Uso: python3 tools/build_mentes.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from build_chat_dia01 import bg, place  # noqa: E402
from build_chat_dia03 import tag  # noqa: E402
from hq_lib import CYAN, GREEN, INK, MAG, RED, YEL, room, scene, sfx_word, speed_lines  # noqa: E402
from mentes_lib import cachorro, gato, pessoa, thought, voce  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "mentes")
COMP = os.path.join(ROOT, "compositions")

PARS = [
    "Imagina acordar|e descobrir que você|consegue ler mentes.|Mas só por um dia.",
    "Primeira descoberta:|o seu cachorro|tem medo de abandono.|E o seu gato…|é um criminoso.",
    "No café da manhã,|você descobre que hoje|é aniversário do seu pai.|Pela mente da sua mãe.",
    "No ônibus,|todo mundo pensando ao mesmo tempo.|Alguém esqueceu o fogão ligado…|e alguém comeu cebola|no café da manhã.|Ninguém sabe quem foi.|Só você.",
    "No trabalho,|a maior revelação do dia:|o seu chefe não faz a menor ideia|do que tá fazendo.|E ninguém na sala faz.|O mundo adulto é só isso.",
    "Aí você decide|ler a mente da sua crush.|Ela tá pensando em você!|Pensando:|por que ele tá me encarando|há 10 minutos?",
    "Na prova,|você tenta colar|lendo a mente do professor.|Ele só pensa em lasanha.|Você tira zero…|mas agora quer lasanha.",
    "E aí, no fim do dia,|o seu melhor amigo pensa uma coisa|que nunca teve coragem de falar:|não sei o que eu faria|sem esse cara.",
    "Meia-noite,|o poder acaba.|E o último pensamento que você ouve…|é do seu cachorro:|foi um bom dia.",
    "E você?|Ia querer esse poder pra sempre…|ou prefere não saber|o que pensam de você?|Comenta A ou B!",
]
FIX = {"eo": ["e", "o"], "eninguem": ["e", "ninguem"], "eai": ["e", "ai"], "evoce": ["e", "voce"], "esta": ["ta"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.0, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-acorda", "s2-bichos", "s3-cafe", "s4-onibus", "s5-chefe", "s6-crush", "s7-prova", "s8-amigo", "s9-meianoite", "s10-pergunta"]
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


def glow_on(p, t):
    return (f'tl.set(".{p}-glow", {{ opacity: 1 }}, {t}); tl.set("#{p}-waves", {{ opacity: 1 }}, {t});'
            f'tl.fromTo("#{p}-waves", {{ scale: .6 }}, {{ scale: 1.1, duration: .5, repeat: 5, yoyo: true, ease: "sine.inOut", svgOrigin: "300 60" }}, {t});')


SETF = '''
      function setF(tl, p, t, show, hide) { hide.forEach(id => tl.set('#' + p + '-' + id, { opacity: 0 }, t)); show.forEach(id => tl.set('#' + p + '-' + id, { opacity: 1 }, t)); }'''


def pop(sel, t, rot=0):
    return f'hfPop(tl, "{sel}", {t}, {rot});'


# ------------------------------------------------------------------ S1 acorda
def s1():
    sc = "s1-acorda"
    d = D(sc)
    body = f'''
    <div class="full">{room("s1r", .4)}</div>
    {place(voce("s1v"), "s1-voce", 150, 560, 780, 3)}
    <div style="position:absolute;left:0;right:0;top:190px;text-align:center;z-index:8"><div id="s1-title-in" style="display:inline-block;font-family:'Archivo Black';font-size:86px;line-height:1.05;color:{YEL};-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:9px 9px 0 {INK}">E SE VOCÊ<br>LESSE MENTES?</div></div>
    <div id="s1-clock" style="position:absolute;left:800px;top:460px;z-index:4;width:180px;height:180px;border-radius:50%;background:#fff;border:9px solid {INK};font-family:'Archivo Black';font-size:54px;line-height:162px;text-align:center;color:{INK}">7:00</div>
    {sfx_word("s1-vz", "VZZZM!", CYAN, 130, -8, "left:100px;top:470px;z-index:8")}
    {tag("s1-on", "LEITURA DE MENTES: ATIVADA 🧠⚡", 90, 1110, CYAN, 46)}
    {tag("s1-1d", "SÓ POR 1 DIA ⏳", 600, 980, YEL, 46)}'''
    js = SETF + f'''
      hfAlive(tl, "s1v", {d});
      tl.fromTo("#s1-title-in", {{ scale: 1.1 }}, {{ scale: 1, duration: .4, ease: "back.out(2)" }}, 0);
      tl.fromTo(["#s1v-lid-l", "#s1v-lid-r"], {{ scaleY: 1.9 }}, {{ scaleY: 1, duration: .25, ease: "steps(3)", transformOrigin: "50% 0%" }}, {L(sc, 0, "acordar")});
      tl.to("#s1-title-in", {{ y: -40, scale: .8, opacity: 0, duration: .3 }}, {L(sc, 0, "ler") - .4});
      {glow_on("s1v", L(sc, 0, "ler"))}
      setF(tl, "s1v", {L(sc, 0, "ler")}, ["m-o", "br-shock"], ["m-calm", "br-calm"]);
      tl.fromTo(["#s1v-lid-l", "#s1v-lid-r"], {{ scaleY: 1 }}, {{ scaleY: .1, duration: .1, transformOrigin: "50% 0%", immediateRender: false }}, {L(sc, 0, "ler")});
      {pop("#s1-vz-in", L(sc, 0, "ler"), -8)}
      {pop("#s1-on-in", L(sc, 0, "mentes"), -3)}
      {pop("#s1-1d-in", L(sc, 0, "so") - .3, 4)}'''
    write(sc, scene(sc, body, js, bg="#27506b"))


# ------------------------------------------------------------------ S2 bichos
def s2():
    sc = "s2-bichos"
    d = D(sc)
    body = f'''
    {bg("s2", "#f4a261", True, 540, 900)}
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:1"><rect x="560" y="1020" width="520" height="40" fill="#8a6a4a" stroke="{INK}" stroke-width="8"/><rect x="600" y="1060" width="30" height="400" fill="#6f5238" stroke="{INK}" stroke-width="6"/></svg>
    {place(cachorro("s2d"), "s2-dog", 60, 820, 460, 3)}
    {place(gato("s2c"), "s2-cat", 700, 720, 300, 3)}
    <div id="s2-cup" style="position:absolute;left:630px;top:940px;z-index:4;font-size:90px">🥛</div>
    {thought("s2-tdog", "ele vai sair sem me levar <span style='color:" + RED + "'>DE NOVO?</span> 🥺", 60, 360, 520, 44)}
    {thought("s2-tcat", "e se eu derrubar…<br>agora? 😼", 560, 360, 440, 44)}
    {sfx_word("s2-crash", "CRASH!", RED, 130, 8, "left:560px;top:1120px;z-index:8")}
    {tag("s2-sus", "SUSPEITO Nº 1 🐱", 640, 640, "#fff", 40)}'''
    js = f'''
      hfAlive(tl, "s2d", {d}, .8); hfAlive(tl, "s2c", {d}, .8);
      {pop("#s2-tdog-in", L(sc, 1, "cachorro") - .1, -2)}
      tl.to("#s2-tdog-in", {{ scale: 0, duration: .15 }}, {L(sc, 1, "gato") - .3});
      {pop("#s2-tcat-in", L(sc, 1, "gato") - .2, 2)}
      tl.fromTo("#s2c-paw", {{ x: 0 }}, {{ x: -80, duration: .2, ease: "power2.in" }}, {L(sc, 1, "criminoso") - .3});
      tl.fromTo("#s2-cup", {{ y: 0, rotation: 0 }}, {{ y: 420, rotation: 140, duration: .4, ease: "power2.in" }}, {L(sc, 1, "criminoso") - .1});
      {pop("#s2-crash-in", L(sc, 1, "criminoso") + .3, 8)}
      {pop("#s2-sus-in", L(sc, 1, "gato") + .2, -4)}'''
    write(sc, scene(sc, body, js, bg="#f4a261"))


# ------------------------------------------------------------------ S3 café
def s3():
    sc = "s3-cafe"
    d = D(sc)
    apron = '<path d="M130 380 L270 380 L280 500 L120 500 Z" fill="#fff4e0" stroke="#15122b" stroke-width="6"/>'
    body = f'''
    {bg("s3", "#ffd6a5", True, 540, 900)}
    {place(voce("s3v"), "s3-voce", 0, 760, 600, 3)}
    {place(pessoa("s3m", 1, "bun", "#8d8d8d", "#e76f51", apron), "s3-mae", 600, 760, 440, 3)}
    <div id="s3-toast" style="position:absolute;left:250px;top:1150px;z-index:5;font-size:100px">🍞</div>
    {thought("s3-t", "será que ele lembrou que hoje é <span style='color:" + MAG + "'>aniversário do pai?</span> 🎂", 380, 330, 640, 42)}
    {tag("s3-no", "❌ NÃO LEMBROU", 90, 560, RED, 54, 8, "#fff")}'''
    js = SETF + f'''
      hfAlive(tl, "s3v", {d}); hfAlive(tl, "s3m", {d});
      tl.set(".s3v-glow", {{ opacity: 1 }}, 0);
      {pop("#s3-t-in", L(sc, 2, "descobre") - .2, -2)}
      setF(tl, "s3v", {L(sc, 2, "aniversario")}, ["m-o", "br-shock", "sweat"], ["m-calm", "br-calm"]);
      tl.fromTo("#s3-toast", {{ y: 0, rotation: 0 }}, {{ y: 520, rotation: 90, duration: .5, ease: "power2.in" }}, {L(sc, 2, "aniversario")});
      tl.fromTo("#s3-no-in", {{ scale: 2.5, opacity: 0, rotation: -20 }}, {{ scale: 1, opacity: 1, rotation: -6, duration: .16, ease: "power4.in" }}, {L(sc, 2, "pai")});'''
    write(sc, scene(sc, body, js, bg="#ffd6a5"))


# ------------------------------------------------------------------ S4 ônibus
def s4():
    sc = "s4-onibus"
    d = D(sc)
    people = [("s4p0", 0, "short", "#2d1f17", "#3a86ff", 60, 760), ("s4p1", 3, "long", "#b5651d", MAG, 380, 740),
              ("s4p2", 2, "cap", RED, "#2a9d8f", 700, 760), ("s4p3", 4, "curly", "#1a1210", YEL, 60, 1040),
              ("s4p4", 1, "bald", "#5a4535", "#6c757d", 380, 1060), ("s4p5", 0, "slick", "#1e1a24", "#f4a261", 700, 1040)]
    ppl = "".join(place(pessoa(i, sk, h, hc, sh, glasses=(k == 4)), i + "-w", x, y, 300, 3) for k, (i, sk, h, hc, sh, x, y) in enumerate(people))
    thoughts = [("s4-t0", "tô atrasado!! ⏰", 40, 470, 360), ("s4-t1", "minha playlist é a melhor 🎧", 380, 420, 400),
                ("s4-t2", "esse cara tá me olhando? 👀", 650, 520, 400), ("s4-t3", "esqueci o <span style='color:#e63946'>FOGÃO LIGADO</span>! 🔥", 40, 640, 470),
                ("s4-t4", "quem comeu <span style='color:#2a9d4b'>CEBOLA</span>? 🧅", 560, 680, 460), ("s4-t5", "…fui eu 🧅🤫", 640, 900, 360)]
    th = "".join(thought(i, h, x, y, w, 36) for i, h, x, y, w in thoughts)
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore><rect width="1080" height="1920" fill="#ffb703"/>
      <rect x="0" y="180" width="1080" height="230" fill="#9bd1e5" stroke="{INK}" stroke-width="10"/>{"".join(f'<line x1="{x}" y1="180" x2="{x}" y2="410" stroke="{INK}" stroke-width="12"/>' for x in (270, 540, 810))}
      <rect x="0" y="1340" width="1080" height="580" fill="#6c757d"/>{"".join(f'<rect x="{x}" y="430" width="16" height="900" fill="#c0c7cc" stroke="{INK}" stroke-width="4"/>' for x in (350, 680))}</svg>
    {ppl}{th}
    {tag("s4-noise", "🔊 BARULHO MENTAL", 90, 190, "#fff", 48)}'''
    js = f'''
      {"".join(f'hfAlive(tl, "{i}", {d}, .6);' for i, *_ in people)}
      {pop("#s4-noise-in", L(sc, 3, "todo"), -3)}
      {pop("#s4-t0-in", L(sc, 3, "pensando"), -2)}{pop("#s4-t1-in", L(sc, 3, "mesmo"), 2)}{pop("#s4-t2-in", L(sc, 3, "tempo"), -2)}
      {pop("#s4-t3-in", L(sc, 3, "fogao") - .2, 2)}
      {pop("#s4-t4-in", L(sc, 3, "cebola") - .2, -2)}
      tl.to(["#s4-t0-in", "#s4-t1-in", "#s4-t2-in", "#s4-t3-in"], {{ opacity: .25, duration: .2 }}, {L(sc, 3, "ninguem")});
      {pop("#s4-t5-in", L(sc, 3, "so"), 3)}
      tl.fromTo("#s4p5-w", {{ scale: 1 }}, {{ scale: 1.12, duration: .25, ease: "back.out(2)", transformOrigin: "50% 100%" }}, {L(sc, 3, "so")});'''
    write(sc, scene(sc, body, js, bg="#ffb703"))


# ------------------------------------------------------------------ S5 chefe
def s5():
    sc = "s5-chefe"
    d = D(sc)
    tie = f'<path d="M190 360 L210 360 L220 390 L200 470 L180 390 Z" fill="{RED}" stroke="{INK}" stroke-width="5"/>'
    board = f'''<div id="s5-board" style="position:absolute;left:560px;top:520px;width:440px;height:330px;z-index:2;background:#fff;border:9px solid {INK};box-shadow:10px 10px 0 {INK}">
      <svg viewBox="0 0 440 330" width="440" height="330"><path d="M30 290 L110 220 L170 250 L250 120 L320 170 L410 40" fill="none" stroke="{GREEN}" stroke-width="14" stroke-linecap="round"/>
      <path d="M380 40 L410 40 L410 70" fill="none" stroke="{GREEN}" stroke-width="10"/><text x="40" y="60" font-family="Archivo Black" font-size="34" fill="{INK}">LUCRO???</text></svg></div>'''
    cols = [("s5c0", 3, "long", "#2d1f17", "#2a9d8f", 40, 1030, "eu também não 😅"), ("s5c1", 4, "short", "#1a1210", "#3a86ff", 390, 1060, "nem eu"),
            ("s5c2", 0, "bald", "#5a4535", "#e9c46a", 730, 1030, "socorro 🆘")]
    ppl = "".join(place(pessoa(i, sk, h, hc, sh), i + "-w", x, y, 280, 3) for i, sk, h, hc, sh, x, y, _ in cols)
    th = "".join(thought(i + "-t", txt, x - 10, y - 170, 320, 34) for i, sk, h, hc, sh, x, y, txt in cols)
    body = f'''
    {bg("s5", "#a8dadc", True, 540, 800)}
    {board}
    {place(pessoa("s5b", 0, "slick", "#2d1f17", "#2b2d42", tie), "s5-boss", 90, 500, 460, 3)}
    {thought("s5-tb", "eu não faço a <span style='color:" + RED + "'>MENOR IDEIA</span> do que tô fazendo 😰", 120, 210, 840, 44)}
    {ppl}{th}
    {tag("s5-sec", "SEGREDO DO MUNDO ADULTO 🤫", 140, 900, YEL, 46)}'''
    js = SETF + f'''
      hfAlive(tl, "s5b", {d}); {"".join(f'hfAlive(tl, "{c[0]}", {d}, .6);' for c in cols)}
      {pop("#s5-tb-in", L(sc, 4, "chefe"), -2)}
      setF(tl, "s5b", {L(sc, 4, "ideia")}, ["m-o"], ["m-smile"]);
      {pop("#s5c0-t-in", L(sc, 4, "ninguem"), -2)}{pop("#s5c1-t-in", L(sc, 4, "sala"), 2)}{pop("#s5c2-t-in", L(sc, 4, "faz", 1), -2)}
      {pop("#s5-sec-in", L(sc, 4, "mundo"), -3)}'''
    write(sc, scene(sc, body, js, bg="#a8dadc"))


# ------------------------------------------------------------------ S6 crush
def s6():
    sc = "s6-crush"
    d = D(sc)
    body = f'''
    {bg("s6", "#ffb3c6", True, 540, 760)}
    {place(pessoa("s6c", 2, "long", "#1a1210", "#9b5de5"), "s6-crush", 330, 640, 660, 3)}
    {thought("s6-t1", "💘💘💘", 380, 320, 420, 70)}
    {thought("s6-t2", "por que ele tá me <span style='color:" + RED + "'>encarando</span> há 10 minutos? 😳", 260, 300, 780, 44)}
    <div id="s6-ins" data-layout-allow-overlap style="position:absolute;left:40px;top:900px;z-index:6">
      <div id="s6-ins-in" class="panel" style="position:relative;width:340px;height:340px;background:{CYAN};box-shadow:10px 10px 0 {INK}">
        <div style="position:absolute;left:-26px;top:-24px;width:390px">{voce("s6v")}</div></div></div>'''
    js = SETF + f'''
      hfAlive(tl, "s6c", {d}); hfAlive(tl, "s6v", {d});
      tl.set(".s6v-glow", {{ opacity: 1 }}, 0);
      tl.fromTo("#s6-ins-in", {{ scale: 0, rotation: -15 }}, {{ scale: 1, rotation: -3, duration: .35, ease: "back.out(2)" }}, .1);
      {pop("#s6-t1-in", L(sc, 5, "ela") - .1, 0)}
      tl.fromTo("#s6-t1-in", {{ scale: 1 }}, {{ scale: 1.15, duration: .2, repeat: 3, yoyo: true, ease: "sine.inOut", immediateRender: false }}, {L(sc, 5, "ela") + .3});
      setF(tl, "s6v", {L(sc, 5, "ela")}, ["m-smile"], ["m-calm"]);
      tl.to("#s6-t1-in", {{ scale: 0, duration: .15 }}, {L(sc, 5, "pensando", 1) - .1});
      {pop("#s6-t2-in", L(sc, 5, "pensando", 1), 0)}
      setF(tl, "s6c", {L(sc, 5, "encarando")}, ["m-flat"], ["m-smile"]);
      setF(tl, "s6v", {L(sc, 5, "encarando")}, ["m-grin", "sweat", "br-worry"], ["m-smile", "br-calm"]);'''
    write(sc, scene(sc, body, js, bg="#ffb3c6"))


# ------------------------------------------------------------------ S7 prova
LASANHA = f'''<svg viewBox="0 0 300 180" width="300" height="180"><rect x="20" y="60" width="260" height="100" rx="12" fill="#f4a261" stroke="{INK}" stroke-width="7"/>
  <path d="M20 90 L280 90 M20 125 L280 125" stroke="{RED}" stroke-width="12"/><path d="M20 60 Q60 30 100 60 Q140 30 180 60 Q220 30 280 60" fill="#ffd166" stroke="{INK}" stroke-width="6"/>
  <path d="M120 30 q10 -20 0 -30 M170 30 q10 -20 0 -30" stroke="#ccc" stroke-width="6" fill="none"/></svg>'''


def s7():
    sc = "s7-prova"
    d = D(sc)
    body = f'''
    {bg("s7", "#2f5d3a", False)}
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:1"><g opacity=".25" stroke="#fff" stroke-width="6" fill="none"><path d="M100 300 L500 300 M100 360 L400 360"/></g></svg>
    {place(pessoa("s7p", 3, "bald", "#8d8d8d", "#6d597a", glasses=True, beard=True), "s7-prof", 560, 560, 460, 3)}
    {thought("s7-tp", LASANHA, 560, 240, 380, 40)}
    {place(voce("s7v"), "s7-voce", 0, 820, 560, 3)}
    <div id="s7-paper" data-layout-allow-overlap style="position:absolute;left:560px;top:1060px;z-index:5"><div id="s7-paper-in" style="background:#fff;border:7px solid {INK};padding:16px 26px;box-shadow:8px 8px 0 {INK};font-family:'Archivo Black';font-size:44px;color:{INK};transform-origin:50% 50%">PROVA ✏️ <span id="s7-zero" style="color:{RED};font-size:80px">0</span></div></div>
    {thought("s7-tv", "🍝 lasanha…", 40, 610, 380, 44)}'''
    js = SETF + f'''
      hfAlive(tl, "s7p", {d}); hfAlive(tl, "s7v", {d});
      tl.set(".s7v-glow", {{ opacity: 1 }}, 0);
      setF(tl, "s7v", 0, ["br-worry", "sweat"], ["br-calm"]);
      tl.fromTo("#s7-paper-in", {{ y: 300, rotation: 10 }}, {{ y: 0, rotation: -4, duration: .35, ease: "back.out(1.5)" }}, .1);
      tl.fromTo("#s7-zero", {{ opacity: 0 }}, {{ opacity: 0, duration: .01 }}, 0);
      {pop("#s7-tp-in", L(sc, 6, "lasanha") - .3, 3)}
      tl.fromTo("#s7-zero", {{ opacity: 0, scale: 3 }}, {{ opacity: 1, scale: 1, duration: .15, ease: "power4.in", immediateRender: false }}, {L(sc, 6, "zero")});
      setF(tl, "s7v", {L(sc, 6, "zero")}, ["m-o"], ["m-calm"]);
      {pop("#s7-tv-in", L(sc, 6, "lasanha", 1) - .5, -3)}
      setF(tl, "s7v", {L(sc, 6, "lasanha", 1) - .5}, ["m-drool"], ["m-o"]);'''
    write(sc, scene(sc, body, js, bg="#2f5d3a"))


# ------------------------------------------------------------------ S8 amigo
def s8():
    sc = "s8-amigo"
    d = D(sc)
    body = f'''
    <div class="full">{room("s8r", .2)}</div>
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:1"><rect width="1080" height="1920" fill="#0b1026" opacity=".55"/>
      <rect x="260" y="430" width="560" height="320" rx="16" fill="#9fe6ff" stroke="{INK}" stroke-width="12"/><rect x="510" y="750" width="60" height="60" fill="{INK}"/>
      <path d="M0 1180 C200 1120 880 1120 1080 1180 L1080 1500 L0 1500 Z" fill="#6c3a5c" stroke="{INK}" stroke-width="10"/></svg>
    {place(voce("s8v"), "s8-voce", 20, 820, 500, 3)}
    {place(pessoa("s8a", 4, "cap", "#2a9d8f", "#f4a261"), "s8-amigo", 560, 860, 440, 3)}
    {thought("s8-t", "não sei o que eu faria<br>sem esse cara 💛", 300, 380, 700, 46, 8, INK, "#fff6d6")}'''
    js = SETF + f'''
      hfAlive(tl, "s8v", {d}, .6); hfAlive(tl, "s8a", {d}, .6);
      tl.set(".s8v-glow", {{ opacity: 1 }}, 0);
      setF(tl, "s8a", 0, ["m-flat"], ["m-smile"]);
      tl.fromTo(".s8a-pupil", {{ x: 0 }}, {{ x: -10, duration: .3 }}, {L(sc, 7, "pensa") - .3});
      tl.fromTo("#s8-t-in", {{ scale: 0, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: .6, ease: "power2.out" }}, {L(sc, 7, "pensa") - .2});
      setF(tl, "s8v", {L(sc, 7, "cara") + .2}, ["m-smile"], ["m-calm"]);
      setF(tl, "s8a", {L(sc, 7, "cara") + .2}, ["m-smile"], ["m-flat"]);'''
    write(sc, scene(sc, body, js, bg="#0b1026"))


# ------------------------------------------------------------------ S9 meia-noite
def s9():
    sc = "s9-meianoite"
    d = D(sc)
    body = f'''
    <div class="full">{room("s9r", 0)}</div>
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:1"><rect width="1080" height="1920" fill="#05070f" opacity=".6"/></svg>
    <div id="s9-clock" style="position:absolute;left:320px;top:220px;z-index:4;width:440px;padding:10px;background:#111;border:10px solid {INK};border-radius:24px;font-family:'Space Mono';font-weight:700;font-size:130px;line-height:1.1;text-align:center;color:#ff4d6d"><span id="s9-c1">23:59</span><span id="s9-c2" style="display:none"></span></div>
    {place(voce("s9v"), "s9-voce", 40, 720, 560, 3)}
    {place(cachorro("s9d"), "s9-dog", 600, 1000, 420, 3)}
    {sfx_word("s9-plim", "PLIM.", "#fff", 100, -6, "left:120px;top:600px;z-index:8")}
    {tag("s9-off", "PODER: DESATIVADO", 120, 520, "#fff", 46)}
    {thought("s9-t", "foi um bom dia 🐾", 560, 760, 460, 46, 8, INK, "#fff6d6")}'''
    js = SETF + f'''
      hfAlive(tl, "s9v", {d}, .6);
      tl.set(".s9v-glow", {{ opacity: 1 }}, 0); tl.set("#s9v-waves", {{ opacity: 1 }}, 0);
      setF(tl, "s9d", 0, ["eyes-closed"], ["eyes"]);
      tl.fromTo("#s9-clock", {{ scale: 1 }}, {{ scale: 1.1, duration: .15, yoyo: true, repeat: 1 }}, {L(sc, 8, "meia") + .5});
      tl.set("#s9-c1", {{ opacity: 0 }}, {L(sc, 8, "meia") + .6});
      tl.set("#s9-clock", {{ color: "#4cd964" }}, {L(sc, 8, "meia") + .6});
      tl.to(["#s9v-waves", ".s9v-glow"], {{ opacity: 0, duration: .3 }}, {L(sc, 8, "acaba")});
      {pop("#s9-plim-in", L(sc, 8, "acaba"), -6)}
      {pop("#s9-off-in", L(sc, 8, "acaba") + .2, -3)}
      tl.fromTo("#s9-t-in", {{ scale: 0, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: .5, ease: "power2.out" }}, {L(sc, 8, "cachorro") - .4});
      setF(tl, "s9v", {L(sc, 8, "dia")}, ["m-smile"], ["m-calm"]);'''
    js = js.replace('<span id="s9-c2" style="display:none"></span>', '')
    body = body.replace('<span id="s9-c1">23:59</span><span id="s9-c2" style="display:none"></span>',
                        '<span style="position:relative;display:inline-block"><span id="s9-c0">00:00</span><span id="s9-c1" style="position:absolute;left:0;top:0;background:#111">23:59</span></span>')
    write(sc, scene(sc, body, js, bg="#05070f"))


# ------------------------------------------------------------------ S10 pergunta
def s10():
    sc = "s10-pergunta"
    d = D(sc)

    def card(k, letter, col, icon, title, x):
        return f'''<div id="s10-{k}" style="position:absolute;left:{x}px;top:560px;width:390px;z-index:4">
          <div id="s10-{k}-in" style="position:relative;background:{col};border:10px solid {INK};border-radius:40px;box-shadow:14px 14px 0 {INK};padding:26px 10px 24px;text-align:center">
            <div style="position:absolute;left:-30px;top:-40px;width:110px;height:110px;border-radius:50%;background:#fff;border:9px solid {INK};font-family:'Archivo Black';font-size:66px;line-height:92px;color:{INK}">{letter}</div>
            <div style="font-size:120px;line-height:1.1">{icon}</div>
            <div style="font-family:'Archivo Black';font-size:46px;line-height:1.05;color:#fff;-webkit-text-stroke:8px {INK};paint-order:stroke fill;margin-top:8px">{title}</div></div></div>'''
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#3a0ca3"/><g id="s10-rays">{speed_lines("s10-sl", 540, 900, 40, "#fff", .12)}</g></svg>
    <div style="position:absolute;left:0;right:0;top:300px;text-align:center;z-index:5"><div id="s10-t-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;color:{YEL};-webkit-text-stroke:11px {INK};paint-order:stroke fill;text-shadow:9px 9px 0 {INK}">E VOCÊ? 🧠</div></div>
    {card("a", "A", CYAN, "🧠⚡", "SIM, PRA<br>SEMPRE", 100)}
    {card("b", "B", MAG, "🙈", "NUNCA, PREFIRO<br>NÃO SABER", 545)}
    <div style="position:absolute;left:0;right:0;top:1100px;text-align:center;z-index:6"><div id="s10-com-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;color:#fff;-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">
      COMENTA <span style="color:{CYAN}">A</span> OU <span style="color:#ff6fa8">B</span> 👇</div></div>'''
    js = f'''
      tl.fromTo("#s10-rays", {{ rotation: 0 }}, {{ rotation: 15, duration: {d}, ease: "none", transformOrigin: "540px 900px" }}, 0);
      tl.fromTo("#s10-t-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2.5)" }}, 0);
      tl.fromTo("#s10-a-in", {{ x: -700, rotation: -15 }}, {{ x: 0, rotation: -3, duration: .4, ease: "back.out(1.4)" }}, {L(sc, 9, "ia")});
      tl.fromTo("#s10-b-in", {{ x: 700, rotation: 15 }}, {{ x: 0, rotation: 3, duration: .4, ease: "back.out(1.4)" }}, {L(sc, 9, "prefere")});
      tl.fromTo("#s10-com-in", {{ scale: 0, rotation: -10 }}, {{ scale: 1, rotation: -2, duration: .35, ease: "back.out(2.5)" }}, {L(sc, 9, "comenta")});
      tl.fromTo("#s10-com-in", {{ scale: 1 }}, {{ scale: 1.08, duration: .22, repeat: 3, yoyo: true, ease: "sine.inOut", immediateRender: false }}, {L(sc, 9, "comenta") + .4});'''
    write(sc, scene(sc, body, js, bg="#3a0ca3"))


# ------------------------------------------------------------------ legendas
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
        ("sparkle.mp3", 0.0, .35), ("impact-bass-1.mp3", W(0, "ler"), .45), ("glitch-1.mp3", W(0, "ler"), .35), ("pop.mp3", W(0, "mentes"), .35), ("pop.mp3", W(0, "dia"), .35),
        ("whoosh.mp3", PSTART[1] - .1, .35), ("pop.mp3", W(1, "cachorro") - .1, .3), ("pop.mp3", W(1, "gato") - .2, .3), ("whoosh-short.mp3", W(1, "criminoso") - .1, .35), ("crack.wav", W(1, "criminoso") + .3, .6),
        ("whoosh.mp3", PSTART[2] - .1, .35), ("pop.mp3", W(2, "descobre") - .2, .3), ("boing.wav", W(2, "aniversario"), .35), ("carimbo.wav", W(2, "pai"), .6),
        ("whoosh.mp3", PSTART[3] - .1, .35), ("glitch-1.mp3", W(3, "todo"), .3), ("pop.mp3", W(3, "pensando"), .25), ("pop.mp3", W(3, "mesmo"), .25), ("pop.mp3", W(3, "tempo"), .25),
        ("pop.mp3", W(3, "fogao") - .2, .3), ("pop.mp3", W(3, "cebola") - .2, .3), ("boing.wav", W(3, "so"), .35),
        ("whoosh.mp3", PSTART[4] - .1, .35), ("pop.mp3", W(4, "chefe"), .3), ("error.mp3", W(4, "ideia"), .3), ("pop.mp3", W(4, "ninguem"), .25), ("pop.mp3", W(4, "sala"), .25), ("sparkle.mp3", W(4, "mundo"), .3),
        ("whoosh.mp3", PSTART[5] - .1, .35), ("sparkle.mp3", W(5, "ela") - .1, .4), ("glitch-1.mp3", W(5, "pensando", 1), .3), ("boing.wav", W(5, "encarando"), .35),
        ("whoosh.mp3", PSTART[6] - .1, .35), ("pop.mp3", W(6, "lasanha") - .3, .3), ("carimbo.wav", W(6, "zero"), .6), ("boing.wav", W(6, "lasanha", 1) - .5, .35),
        ("sparkle.mp3", W(7, "nao") - .2, .3),
        ("bip.wav", W(8, "meia") + .5, .3), ("click-soft.mp3", W(8, "acaba"), .5), ("sparkle.mp3", W(8, "foi") - .2, .3),
        ("whoosh.mp3", PSTART[9] - .1, .35), ("whoosh.mp3", W(9, "ia"), .35), ("whoosh.mp3", W(9, "prefere"), .35), ("sparkle.mp3", W(9, "comenta"), .35),
    ]


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = [f'''      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s}" data-duration="{e - s:.2f}"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:1"></div>''' for c, s, e in SCENES]
    hosts.append(f'''      <div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>''')
    vd = round(dur(os.path.join(ROOT, "assets/voice/narracao-mentes.wav")), 2)
    e0, e1 = SC["s8-amigo"][0], SC["s10-pergunta"][0]  # parte emocional: música mais baixa
    m0 = 60.0
    audio = [f'      <audio id="voz" class="clip" src="assets/voice/narracao-mentes.wav" data-start="0" data-duration="{vd}" data-volume="1" data-track-index="4"></audio>',
             f'      <audio id="trilha-a" class="clip" src="assets/music/positive-background.mp3" data-start="0" data-duration="{e0:.2f}" data-media-start="{m0}" data-volume="0.12" data-fade-out="0.6" data-track-index="5"></audio>',
             f'      <audio id="trilha-b" class="clip" src="assets/music/positive-background.mp3" data-start="{e0:.2f}" data-duration="{e1 - e0:.2f}" data-media-start="{m0 + e0:.2f}" data-volume="0.05" data-fade-in="0.6" data-fade-out="0.6" data-track-index="5"></audio>',
             f'      <audio id="trilha-c" class="clip" src="assets/music/positive-background.mp3" data-start="{e1:.2f}" data-duration="{TOTAL - e1:.2f}" data-media-start="{m0 + e1:.2f}" data-volume="0.12" data-fade-in="0.3" data-fade-out="1.2" data-track-index="5"></audio>']
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
    <!-- E se você pudesse ler mentes por 1 dia? (gerado por tools/build_mentes.py) -->
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
    for fn in (s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, caps):
        fn()
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "mentes", "name": "E se você pudesse ler mentes", "createdAt": "2026-11-07T22:00:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, [(n, s, e) for n, s, e in SCENES])
