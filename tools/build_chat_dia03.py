"""Gera o DIA 3 (B venceu: mercado) de "O Chat Controla" em chat-dia03/.

Mesmo estilo HQ pop dos DIAS 1 e 2. Tempos das palavras vêm da transcrição.
Uso: python3 tools/build_chat_dia03.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from align_lib import align, caption_groups, norm  # noqa: E402
from build_chat_dia01 import BARS, CHAT_HEAD, bg, chip, phone_ui, place  # noqa: E402
from build_chat_dia02 import bar_rows  # noqa: E402
from hq_lib import (CYAN, GREEN, INK, MAG, RED, YEL, armando, carla, rodrigo, room,  # noqa: E402
                    scene, sfx_word, speed_lines)

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chat-dia03")
COMP = os.path.join(ROOT, "compositions")
BAGS = 0.55  # olheiras menores: a saúde subiu

PARS = [
    "Dia 3.|Vocês escolheram B:|mercado de verdade.|O Armando agradece…|a carteira dele, não.",
    "Pela primeira vez em anos,|ele entrou num mercado|sem ser pra usar o banheiro.",
    "Ele pegou um brócolis|achando que era uma árvore|em miniatura.|E levou uma fruta|que ele não sabia o nome.|Era um kiwi.",
    "O total deu R$ 19,90.|Sobraram 10 centavos…|e ele saiu de lá|se sentindo um milionário.",
    "Dinheiro caiu 10.|Saúde subiu 10.|O corpo dele estranhou tanto|que o estômago mandou um áudio|perguntando o que tava acontecendo.",
    "Aí ele tentou cozinhar.|O frango queimou tanto|que o detector de fumaça|pediu demissão…|junto com a luz da geladeira.",
    "Enquanto isso,|o Rodrigo postou foto na academia…|com a legenda:|e o sarado da turma, cadê?",
    "Até que alguém|bateu na porta.|Era a Carla,|a vizinha do 302.|A mais bonita do prédio.|E ela só queria…|açúcar.",
    "O problema?|A casa tá um chiqueiro,|ele tá de cueca…|e o frango ainda tá pegando fogo.",
    "Próxima decisão:|abrir a porta assim mesmo,|ou fingir que não tá em casa?|Se abrir,|ganha uma chance com a Carla…|mas a reputação vai pro ralo.|Se fingir,|se salva da vergonha…|mas perde ponto no amor.|Comenta A ou B!",
    "Faltam 28 dias…|e a Carla ainda tá na porta.",
]
FIX = {"cpra": ["pra"], "elevou": ["e", "levou"], "eele": ["e", "ele"], "eo": ["e", "o"], "eela": ["e", "ela"], "ea": ["e", "a"]}
WORDS = align(PARS, os.path.join(ROOT, "assets/voice/transcript.json"), FIX)
END = max(w[5] for w in WORDS)
TOTAL = round(END + 2.2, 2)
PSTART = [min(w[4] for w in WORDS if w[0] == p) for p in range(len(PARS))]
NAMES = ["s1-resultado", "s2-mercado", "s3-brocolis", "s4-caixa", "s5-barras", "s6-cozinha", "s7-rodrigo",
         "s8-porta", "s9-problema", "s10-decisao", "s11-final"]
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


def A(p, pose="none"):
    return armando(p, pose, BAGS)


def tag(cid, text, left, top, bgc="#fff", size=44, z=8, color=INK):
    return (f'<div id="{cid}" data-layout-allow-overlap style="position:absolute;left:{left}px;top:{top}px;z-index:{z}">'
            f'<div id="{cid}-in" class="tag" style="position:relative;background:{bgc};font-size:{size}px;color:{color}">{text}</div></div>')


# ------------------------------------------------------------------ S1 resultado
def s1():
    sc = "s1-resultado"
    d = D(sc)
    import random
    rnd = random.Random(3)
    conf = "".join(f'<rect class="s1-cf" x="{rnd.uniform(40, 1040):.0f}" y="{rnd.uniform(-300, -40):.0f}" width="{rnd.choice([16, 22, 28])}" height="{rnd.choice([30, 40])}" '
                   f'fill="{rnd.choice([YEL, MAG, CYAN, GREEN, "#fff"])}" stroke="{INK}" stroke-width="3"/>' for _ in range(60))
    body = f'''
    {bg("s1", "#1d3557", True, 540, 760)}
    <div style="position:absolute;left:70px;top:185px;z-index:8"><div id="s1-badge-in" style="font-family:'Archivo Black';font-size:96px;color:{YEL};background:{MAG};border:10px solid {INK};
      padding:0 30px;box-shadow:12px 12px 0 {INK};-webkit-text-stroke:8px {INK};paint-order:stroke fill;line-height:1.25">DIA 3</div></div>
    <div style="position:absolute;left:0;right:0;top:390px;text-align:center;z-index:6"><div id="s1-title-in" style="display:inline-block;font-family:'Archivo Black';font-size:84px;color:#fff;-webkit-text-stroke:11px {INK};paint-order:stroke fill;text-shadow:9px 9px 0 {INK}">VOCÊS ESCOLHERAM:</div></div>
    <div id="s1-card" data-layout-allow-overlap style="position:absolute;left:300px;top:540px;width:480px;z-index:5">
      <div id="s1-card-in" style="position:relative;background:#2a9d8f;border:12px solid {INK};border-radius:44px;box-shadow:16px 16px 0 {INK};text-align:center;padding:30px 0 26px">
        <div style="font-family:'Archivo Black';font-size:200px;line-height:1;color:#fff;-webkit-text-stroke:12px {INK};paint-order:stroke fill">B</div>
        <div style="font-size:90px">🛒</div>
        <div style="font-family:'Archivo Black';font-size:62px;color:#fff;-webkit-text-stroke:9px {INK};paint-order:stroke fill">MERCADO</div></div></div>
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:7">{conf}</svg>
    <div id="s1-face" data-layout-allow-overlap style="position:absolute;left:640px;top:800px;z-index:8">
      <div id="s1-face-in" class="panel" style="position:relative;width:330px;height:330px;background:{YEL};box-shadow:12px 12px 0 {INK}">
        <div style="position:absolute;left:-30px;top:-20px;width:390px">{A("s1a")}</div></div></div>
    {tag("s1-wal", "CARTEIRA: 😭", 120, 1060, "#ff8fa3", 46)}'''
    js = f'''
      tl.fromTo("#s1-badge-in", {{ scale: 1.3, rotation: -8 }}, {{ scale: 1, rotation: -4, duration: .35, ease: "back.out(3)" }}, 0);
      tl.fromTo("#s1-title-in", {{ y: -40, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .3 }}, {L(sc, 0, "voces")});
      tl.fromTo("#s1-card-in", {{ scale: .2, rotation: -30 }}, {{ scale: 1, rotation: 3, duration: .5, ease: "back.out(1.7)" }}, {L(sc, 0, "voces") + .3});
      tl.fromTo(".s1-cf", {{ y: 0, rotation: 0 }}, {{ y: (i) => 1500 + (i % 7) * 90, rotation: (i) => (i % 2 ? 1 : -1) * (200 + i * 9), duration: 2.6, stagger: .012, ease: "power1.in" }}, {L(sc, 0, "escolheram")});
      hfAlive(tl, "s1a", {d});
      tl.set(["#s1a-m-sad", "#s1a-br-sad"], {{ opacity: 0 }}, 0); tl.set(["#s1a-m-grin", "#s1a-br-worry"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s1-face-in", {{ scale: 0, rotation: 15 }}, {{ scale: 1, rotation: 4, duration: .35, ease: "back.out(2)" }}, {L(sc, 0, "armando")});
      hfPop(tl, "#s1-wal-in", {L(sc, 0, "carteira")}, -4);'''
    write(sc, scene(sc, body, js, bg="#1d3557"))


# ------------------------------------------------------------------ S2 mercado
def shelves():
    import random
    rnd = random.Random(7)
    boxes = ""
    for row, y in enumerate((300, 560, 820)):
        x = 30
        while x < 1040:
            w = rnd.choice([70, 90, 110])
            h = rnd.choice([150, 180, 200])
            c = rnd.choice([RED, YEL, CYAN, GREEN, MAG, "#ff9f1c", "#fff"])
            boxes += f'<rect x="{x}" y="{y + 210 - h}" width="{w}" height="{h}" fill="{c}" stroke="{INK}" stroke-width="6"/><rect x="{x + 12}" y="{y + 230 - h}" width="{w - 24}" height="30" fill="#fff" opacity=".6"/>'
            x += w + 8
    return f'''<svg class="full" viewBox="0 0 1080 1920" data-layout-ignore><rect width="1080" height="1920" fill="#dfe9ec"/>
      {boxes}{"".join(f'<rect x="0" y="{y + 210}" width="1080" height="26" fill="#9aa5ad" stroke="{INK}" stroke-width="6"/>' for y in (300, 560, 820))}
      <rect x="0" y="1300" width="1080" height="620" fill="#c8d3d6"/>{"".join(f'<line x1="{x}" y1="1300" x2="{x - 200}" y2="1920" stroke="#b3bfc3" stroke-width="6"/>' for x in range(0, 1400, 160))}</svg>'''


def cart():
    return f'''<svg viewBox="0 0 700 520" width="700" height="520" overflow="visible">
      <path d="M40 60 L120 60 L170 360 L600 360 L650 120 L150 120" fill="none" stroke="{INK}" stroke-width="22" stroke-linejoin="round"/>
      <path d="M40 60 L120 60 L170 360 L600 360 L650 120 L150 120" fill="none" stroke="#c0c7cc" stroke-width="12" stroke-linejoin="round"/>
      {"".join(f'<line x1="{x}" y1="125" x2="{x + 10}" y2="355" stroke="#c0c7cc" stroke-width="7"/>' for x in range(200, 600, 60))}
      {"".join(f'<line x1="160" y1="{y}" x2="640" y2="{y}" stroke="#c0c7cc" stroke-width="7"/>' for y in (190, 260))}
      <circle cx="230" cy="440" r="40" fill="{INK}"/><g id="s2-wheel"><circle cx="560" cy="440" r="40" fill="{INK}"/><rect x="548" y="400" width="24" height="80" fill="#666"/></g></svg>'''


def s2():
    sc = "s2-mercado"
    d = D(sc)
    body = f'''
    {shelves()}
    {tag("s2-sign", "🥦 HORTIFRUTI · CORREDOR 3", 150, 190, YEL, 44, 6)}
    {place(A("s2a"), "s2-arm", 120, 640, 640, 3)}
    <div id="s2-cart" style="position:absolute;left:330px;top:1000px;z-index:4">{cart()}</div>
    {tag("s2-first", "1ª VEZ NA SEÇÃO DE VERDURAS", 90, 880, "#fff", 40)}
    {sfx_word("s2-trec", "TREC TREC", "#fff", 100, -6, "left:560px;top:860px;z-index:8")}'''
    js = f'''
      hfAlive(tl, "s2a", {d});
      tl.set(["#s2a-br-sad"], {{ opacity: 0 }}, 0); tl.set(["#s2a-br-worry"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s2-cart", {{ x: 500 }}, {{ x: 0, duration: 1.2, ease: "power2.out" }}, 0);
      tl.fromTo("#s2-wheel", {{ rotation: -14 }}, {{ rotation: 14, duration: .1, repeat: 21, yoyo: true, ease: "none", svgOrigin: "560 440" }}, 0);
      hfPop(tl, "#s2-trec-in", .2, -6);
      tl.to("#s2-trec-in", {{ scale: 0, duration: .15 }}, 1.6);
      hfPop(tl, "#s2-sign-in", .1, -2);
      hfPop(tl, "#s2-first-in", {L(sc, 1, "entrou")}, -3);
      hfBlink(tl, "s2a", [1.5, 3.3]);'''
    write(sc, scene(sc, body, js, bg="#dfe9ec"))


# ------------------------------------------------------------------ S3 brócolis / kiwi
BROC = f'''<svg viewBox="0 0 300 360" width="300" height="360" overflow="visible">
  <path d="M120 200 L110 350 L190 350 L180 200 Z" fill="#9bc46a" stroke="{INK}" stroke-width="9"/>
  <g fill="#3f8f3a" stroke="{INK}" stroke-width="8">{"".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in [(90, 150, 70), (210, 150, 70), (150, 100, 80), (150, 190, 60), (60, 200, 45), (240, 200, 45)])}</g>
  <g fill="#5fb153">{"".join(f'<circle cx="{x}" cy="{y}" r="14"/>' for x, y in [(120, 90), (180, 80), (80, 150), (220, 140), (150, 160)])}</g></svg>'''
KIWI = f'''<svg viewBox="0 0 260 220" width="260" height="220" overflow="visible">
  <ellipse cx="130" cy="110" rx="120" ry="95" fill="#8a6a3a" stroke="{INK}" stroke-width="9"/>
  <ellipse cx="160" cy="105" rx="70" ry="62" fill="#7cc242" stroke="{INK}" stroke-width="6"/><ellipse cx="160" cy="105" rx="24" ry="20" fill="#f2f5d0"/>
  {"".join(f'<ellipse cx="{160 + 40 * __import__("math").cos(a / 10 * 6.28):.0f}" cy="{105 + 36 * __import__("math").sin(a / 10 * 6.28):.0f}" rx="4" ry="7" fill="{INK}"/>' for a in range(10))}</svg>'''


def s3():
    sc = "s3-brocolis"
    d = D(sc)
    tree = f'''<svg viewBox="0 0 300 300" width="300" height="300"><rect x="130" y="170" width="40" height="110" fill="#7a4a2a" stroke="{INK}" stroke-width="8"/>
      <circle cx="150" cy="130" r="100" fill="#2f7d32" stroke="{INK}" stroke-width="9"/><circle cx="110" cy="110" r="20" fill="#4caf50"/></svg>'''
    body = f'''
    {bg("s3", "#90be6d", True, 540, 760)}
    {place(A("s3a"), "s3-arm", 60, 620, 700, 3)}
    <div id="s3-broc" style="position:absolute;left:640px;top:840px;z-index:5"><div id="s3-broc-in">{BROC}</div></div>
    <div id="s3-think" data-layout-allow-overlap style="position:absolute;left:520px;top:300px;width:420px;z-index:6">
      <div id="s3-think-in" style="position:relative;background:#fff;border:9px solid {INK};border-radius:50%;width:420px;height:400px;box-shadow:10px 10px 0 {INK}">
        <div style="position:absolute;left:60px;top:40px">{tree}</div></div></div>
    {sfx_word("s3-q", "ÁRVORE?", MAG, 90, -8, "left:120px;top:440px;z-index:8")}
    <div id="s3-kiwi" data-layout-allow-overlap style="position:absolute;left:600px;top:540px;z-index:7"><div id="s3-kiwi-in">{KIWI}</div></div>
    {tag("s3-kq", "???", 640, 470, "#fff", 56)}
    {tag("s3-kn", "KIWI 🥝", 620, 800, GREEN, 54)}'''
    js = f'''
      hfAlive(tl, "s3a", {d});
      tl.set(["#s3a-br-sad", "#s3a-m-sad"], {{ opacity: 0 }}, 0); tl.set(["#s3a-br-shock", "#s3a-m-shock"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s3-broc-in", {{ y: 400, rotation: 20 }}, {{ y: 0, rotation: -8, duration: .35, ease: "back.out(1.6)" }}, .1);
      tl.fromTo("#s3-think-in", {{ scale: 0 }}, {{ scale: 1, duration: .35, ease: "back.out(2)", transformOrigin: "10% 100%" }}, {L(sc, 2, "arvore") - .1});
      hfPop(tl, "#s3-q-in", {L(sc, 2, "arvore")}, -8);
      tl.to(["#s3-think-in", "#s3-q-in"], {{ scale: 0, duration: .2 }}, {L(sc, 2, "levou") - .1});
      tl.fromTo("#s3-kiwi-in", {{ scale: 0, rotation: -40 }}, {{ scale: 1, rotation: 0, duration: .35, ease: "back.out(2)" }}, {L(sc, 2, "fruta")});
      hfPop(tl, "#s3-kq-in", {L(sc, 2, "sabia")}, 6);
      tl.to("#s3-kq-in", {{ scale: 0, duration: .15 }}, {L(sc, 2, "kiwi") - .1});
      hfPop(tl, "#s3-kn-in", {L(sc, 2, "kiwi")}, -4);
      tl.fromTo(".s3a-pupil", {{ x: 0 }}, {{ x: 10, duration: .15 }}, .4);'''
    write(sc, scene(sc, body, js, bg="#90be6d"))


# ------------------------------------------------------------------ S4 caixa
def s4():
    sc = "s4-caixa"
    d = D(sc)
    note = f'''<svg viewBox="0 0 300 150" width="300" height="150"><rect x="5" y="5" width="290" height="140" rx="10" fill="#9bd37a" stroke="{INK}" stroke-width="8" transform="rotate(-4 150 75)"/>
      <circle cx="150" cy="75" r="40" fill="#c4e8ad" stroke="{INK}" stroke-width="5"/><text x="150" y="92" text-anchor="middle" font-family="Archivo Black" font-size="46" fill="{INK}">20</text></svg>'''
    body = f'''
    {bg("s4", "#f4a261", True, 540, 700)}
    <div id="s4-reg" style="position:absolute;left:140px;top:300px;width:800px;z-index:3">
      <div id="s4-reg-in" style="background:#3a3f4b;border:12px solid {INK};border-radius:30px;box-shadow:14px 14px 0 {INK};padding:30px">
        <div style="font-family:'Archivo Black';font-size:36px;color:#cfd8dc">TOTAL</div>
        <div id="s4-lcd" style="background:#b8e994;border:8px solid {INK};border-radius:16px;font-family:'Space Mono';font-weight:700;font-size:150px;line-height:1.1;text-align:center;color:{INK}">R$ 19,90</div></div></div>
    <div id="s4-note" style="position:absolute;left:180px;top:780px;z-index:4"><div id="s4-note-in">{note}</div></div>
    <div id="s4-coin" data-layout-allow-overlap style="position:absolute;left:560px;top:760px;z-index:6"><div id="s4-coin-in" style="display:flex;align-items:center;gap:16px">
      <div style="width:120px;height:120px;border-radius:50%;background:#f2c230;border:9px solid {INK};font-family:'Archivo Black';font-size:52px;line-height:102px;text-align:center;color:{INK}">10¢</div>
      <div class="tag" style="position:relative;font-size:40px">TROCO ✨</div></div></div>
    {place(A("s4a"), "s4-arm", 240, 960, 560, 3)}
    {tag("s4-mil", "MILIONÁRIO 💸", 120, 900, YEL, 52)}'''
    js = f'''
      tl.fromTo("#s4-reg-in", {{ y: -600 }}, {{ y: 0, duration: .4, ease: "back.out(1.4)" }}, 0);
      tl.fromTo("#s4-lcd", {{ opacity: .2 }}, {{ opacity: 1, duration: .08, repeat: 4, yoyo: true, ease: "steps(1)" }}, {L(sc, 3, "1990")});
      tl.fromTo("#s4-note-in", {{ x: -500, rotation: -20 }}, {{ x: 0, rotation: -5, duration: .35, ease: "back.out(1.5)" }}, {L(sc, 3, "1990") + .3});
      tl.fromTo("#s4-coin-in", {{ scale: 0, rotation: -90 }}, {{ scale: 1, rotation: 0, duration: .4, ease: "back.out(2)" }}, {L(sc, 3, "sobraram")});
      hfAlive(tl, "s4a", {d});
      tl.set(["#s4a-br-sad", "#s4a-m-sad"], {{ opacity: 0 }}, 0); tl.set(["#s4a-br-worry"], {{ opacity: 1 }}, 0);
      hfMood(tl, "s4a", {L(sc, 3, "milionario") - .2}, ["m-grin", "br-shock"], ["br-worry"]);
      hfPop(tl, "#s4-mil-in", {L(sc, 3, "milionario")}, -6);'''
    write(sc, scene(sc, body, js, bg="#f4a261"))


# ------------------------------------------------------------------ S5 barras
def s5():
    sc = "s5-barras"
    d = D(sc)
    wave = "".join(f'<rect x="{150 + k * 22}" y="{60 - h}" width="12" height="{h * 2}" rx="6" fill="#53bdeb"/>' for k, h in enumerate([10, 22, 34, 18, 40, 26, 12, 30, 20, 36, 14, 24, 32, 16, 28, 10, 22]))
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#5a189a"/>{speed_lines("s5-sl", 540, 600, 40, "#fff", .1)}</svg>
    {bar_rows("s5", [20, 30, 10, 40])}
    {tag("s5-d0", "−10", 880, 318, "#ff8fa3", 40)}
    {tag("s5-d1", "+10", 880, 443, GREEN, 40)}
    <div id="s5-msg" data-layout-allow-overlap style="position:absolute;left:110px;top:880px;width:860px;z-index:6">
      <div id="s5-msg-in" style="background:#1f2c34;border:8px solid {INK};border-radius:30px;box-shadow:12px 12px 0 {INK};padding:22px 28px;font-family:Inter;color:#e9edef">
        <div style="color:#ff8fb5;font-weight:800;font-size:34px">🫃 Estômago do Armando</div>
        <div style="display:flex;align-items:center;gap:20px;margin-top:10px"><div style="font-size:60px">▶️</div>
          <svg width="560" height="120" viewBox="140 0 420 120">{wave}</svg><div style="font-size:30px;color:#8696a0">0:07</div></div>
        <div style="font-size:38px;margin-top:8px">"o que tá acontecendo?? 😳 isso é… VERDURA?"</div></div></div>'''
    js = f'''
      [0, 1, 2, 3].forEach(i => tl.fromTo("#s5-r" + i, {{ x: -900, opacity: 0 }}, {{ x: 0, opacity: 1, duration: .3, ease: "back.out(1.4)" }}, i * .08));
      tl.fromTo("#s5-f0", {{ scaleX: 1.5 }}, {{ scaleX: 1, duration: .5, ease: "power3.in" }}, {L(sc, 4, "caiu")});
      hfPop(tl, "#s5-d0-in", {L(sc, 4, "caiu") + .1}, 4);
      tl.fromTo("#s5-f1", {{ scaleX: .67 }}, {{ scaleX: 1, duration: .6, ease: "power3.out" }}, {L(sc, 4, "subiu")});
      hfPop(tl, "#s5-d1-in", {L(sc, 4, "subiu") + .1}, -4);
      tl.fromTo("#s5-r1", {{ scale: 1 }}, {{ scale: 1.06, duration: .2, repeat: 3, yoyo: true, ease: "sine.inOut", immediateRender: false }}, {L(sc, 4, "subiu") + .3});
      tl.fromTo("#s5-msg-in", {{ y: 600, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .4, ease: "back.out(1.5)" }}, {L(sc, 4, "estomago") - .2});'''
    write(sc, scene(sc, body, js, bg="#5a189a"))


# ------------------------------------------------------------------ S6 cozinha
def s6():
    sc = "s6-cozinha"
    d = D(sc)
    tiles = "".join(f'<rect x="{x}" y="{y}" width="96" height="96" fill="#f1e3c8" stroke="#d8c7a5" stroke-width="5"/>' for x in range(0, 1080, 100) for y in range(0, 1150, 100))
    smoke = "".join(f'<circle class="s6-sm" cx="{430 + (k % 3) * 70}" cy="900" r="{60 + (k % 4) * 15}" fill="#4a4a4a" opacity=".85" stroke="{INK}" stroke-width="5"/>' for k in range(9))
    det = f'''<svg viewBox="0 0 220 260" width="220" height="260" overflow="visible">
      <ellipse cx="110" cy="70" rx="100" ry="40" fill="#f5f5f5" stroke="{INK}" stroke-width="8"/><circle cx="110" cy="64" r="12" fill="{RED}"/>
      <path d="M75 100 l-15 70 M145 100 l15 70" stroke="{INK}" stroke-width="9" stroke-linecap="round"/>
      <rect x="150" y="140" width="70" height="56" rx="8" fill="#8d5430" stroke="{INK}" stroke-width="6"/><path d="M170 140 q15 -20 30 0" fill="none" stroke="{INK}" stroke-width="6"/></svg>'''
    bulb = f'''<svg viewBox="0 0 160 220" width="160" height="220" overflow="visible"><circle cx="70" cy="70" r="55" fill="#fff6b0" stroke="{INK}" stroke-width="8"/>
      <rect x="45" y="118" width="50" height="34" fill="#9aa5ad" stroke="{INK}" stroke-width="6"/><path d="M55 150 l-12 50 M85 150 l12 50" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>
      <rect x="100" y="120" width="56" height="44" rx="6" fill="#3a86ff" stroke="{INK}" stroke-width="5"/></svg>'''
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore><rect width="1080" height="1920" fill="#5e4535"/>{tiles}
      <rect x="0" y="1140" width="1080" height="40" fill="#8a6a4a" stroke="{INK}" stroke-width="8"/><rect x="0" y="1180" width="1080" height="300" fill="#6f5238" stroke="{INK}" stroke-width="8"/>
      <rect x="330" y="1090" width="420" height="60" fill="#3a3f4b" stroke="{INK}" stroke-width="8"/>
      <ellipse cx="540" cy="1080" rx="190" ry="40" fill="#2b2b2b" stroke="{INK}" stroke-width="8"/><rect x="720" y="1065" width="160" height="26" rx="10" fill="#2b2b2b" stroke="{INK}" stroke-width="6"/>
      <path d="M440 1070 C440 1010 640 1010 640 1070 Z" fill="#1a1110" stroke="{INK}" stroke-width="6"/></svg>
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:3" data-layout-ignore>{smoke}</svg>
    <div id="s6-det" style="position:absolute;left:430px;top:360px;z-index:5"><div id="s6-det-in">{det}</div></div>
    <div id="s6-bulb" style="position:absolute;left:-200px;top:560px;z-index:5"><div id="s6-bulb-in">{bulb}</div></div>
    {sfx_word("s6-piii", "PIIIII!", RED, 120, 6, "left:560px;top:380px;z-index:8")}
    {tag("s6-quit", "DETECTOR: PEDIU DEMISSÃO", 120, 620, "#fff", 40)}
    {place(A("s6a"), "s6-arm", 40, 760, 480, 4)}
    {sfx_word("s6-cof", "COF COF!", "#fff", 90, -8, "left:110px;top:640px;z-index:8")}'''
    js = f'''
      tl.fromTo(".s6-sm", {{ y: 0, scale: .4, opacity: 0 }}, {{ y: -700, scale: 1.4, opacity: .85, duration: 2.2, stagger: {{ each: .3, repeat: 2 }}, ease: "power1.out" }}, {L(sc, 5, "frango") - .3});
      hfAlive(tl, "s6a", {d});
      tl.set(["#s6a-br-sad", "#s6a-m-sad"], {{ opacity: 0 }}, 0); tl.set(["#s6a-br-worry", "#s6a-m-shock", "#s6a-sweat"], {{ opacity: 1 }}, 0);
      hfPop(tl, "#s6-cof-in", {L(sc, 5, "frango")}, -8);
      tl.to("#s6-cof-in", {{ scale: 0, duration: .15 }}, {L(sc, 5, "frango") + 1.2});
      hfPop(tl, "#s6-piii-in", {L(sc, 5, "detector")}, 6);
      tl.fromTo("#s6-det-in", {{ x: 0 }}, {{ x: 10, duration: .04, repeat: 9, yoyo: true, ease: "none" }}, {L(sc, 5, "detector")});
      tl.to("#s6-det-in", {{ y: 380, duration: .3, ease: "power2.in" }}, {L(sc, 5, "pediu") - .2});
      tl.to("#s6-det-in", {{ x: 900, duration: 1.4, ease: "steps(10)" }}, {L(sc, 5, "pediu") + .15});
      hfPop(tl, "#s6-quit-in", {L(sc, 5, "pediu")}, -3);
      tl.fromTo("#s6-bulb-in", {{ x: 0 }}, {{ x: 1400, duration: 1.6, ease: "steps(12)" }}, {L(sc, 5, "luz") - .2});'''
    write(sc, scene(sc, body, js, bg="#f1e3c8"))


# ------------------------------------------------------------------ S7 Rodrigo
def s7():
    sc = "s7-rodrigo"
    d = D(sc)
    selfie = f'''<div data-layout-allow-overlap style="position:relative;height:430px;background:#2b2d42;border-radius:18px;overflow:hidden;border:4px solid {INK}">
      <svg class="full" viewBox="0 0 1080 1920" style="width:100%;height:100%" preserveAspectRatio="xMidYMid slice">{speed_lines("s7-sl", 540, 900, 30, "#fff", .1)}</svg>
      <div style="position:absolute;left:70px;top:20px;width:420px">{rodrigo("s7r")}</div>
      <svg style="position:absolute;left:30px;top:250px" width="560" height="120" viewBox="0 0 560 120"><rect x="60" y="50" width="440" height="20" fill="#888" stroke="{INK}" stroke-width="5"/>
        <rect x="20" y="10" width="60" height="100" rx="10" fill="#333" stroke="{INK}" stroke-width="6"/><rect x="480" y="10" width="60" height="100" rx="10" fill="#333" stroke="{INK}" stroke-width="6"/></svg></div>'''
    chat = f'''{CHAT_HEAD}
      <div id="s7-msg" style="margin:22px;background:#1f2c34;border-radius:6px 28px 28px 28px;padding:14px;font-family:Inter;color:#e9edef">
        <div style="color:{MAG};font-weight:700;font-size:30px;margin:0 6px 8px">Rodrigo</div>{selfie}
        <div style="font-size:40px;margin:12px 6px 4px">e o <b style="color:{YEL}">SARADO</b> da turma, cadê? 💪😏</div></div>
      <div id="s7-reacts" style="margin:0 26px;font-size:54px">😂🤣💀🔥</div>'''
    body = f'''
    {bg("s7", "#3a0ca3")}{phone_ui("s7", chat, 130, 330, 820, 880)}
    {sfx_word("s7-sar", "SARADO?!", YEL, 120, -8, "left:120px;top:1060px;z-index:8")}'''
    js = f'''
      tl.fromTo("#s7-phone", {{ y: 900, rotation: 8, opacity: 0 }}, {{ y: 0, rotation: -2, opacity: 1, duration: .4, ease: "back.out(1.3)" }}, 0);
      tl.fromTo("#s7-msg", {{ x: -500, opacity: 0 }}, {{ x: 0, opacity: 1, duration: .3, ease: "back.out(1.5)" }}, {L(sc, 6, "postou")});
      hfAlive(tl, "s7r", {d}, 1.2);
      tl.fromTo("#s7-reacts", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2.5)", transformOrigin: "0% 50%" }}, {L(sc, 6, "cade")});
      hfPop(tl, "#s7-sar-in", {L(sc, 6, "sarado")}, -8);'''
    write(sc, scene(sc, body, js, bg="#3a0ca3"))


# ------------------------------------------------------------------ S8 porta
def s8():
    sc = "s8-porta"
    d = D(sc)
    hearts = "".join(f'<div class="s8-h" style="position:absolute;left:{x}px;top:{y}px;font-size:{s}px;z-index:7">❤️</div>' for x, y, s in [(120, 420, 80), (860, 470, 70), (150, 1000, 60), (840, 980, 90), (480, 230, 60)])
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore><rect width="1080" height="1920" fill="#7b4f2c"/>
      {"".join(f'<rect x="{x}" y="0" width="12" height="1920" fill="#6a4224"/>' for x in range(60, 1080, 150))}
      <rect x="60" y="120" width="960" height="1700" fill="none" stroke="#5a3418" stroke-width="18"/></svg>
    {sfx_word("s8-toc", "TOC TOC!", YEL, 140, -8, "left:230px;top:300px;z-index:8")}
    <div id="s8-hole" style="position:absolute;left:140px;top:340px;width:800px;height:800px;z-index:4">
      <div id="s8-hole-in" style="position:absolute;inset:0;border-radius:50%;overflow:hidden;border:26px solid #c0c7cc;box-shadow:0 0 0 12px {INK},16px 16px 0 12px {INK};background:#e9f1ff">
        <div id="s8-carla" style="position:absolute;left:40px;top:40px;width:680px">{carla("s8c")}</div>
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.4),rgba(255,255,255,0) 40%)"></div></div></div>
    {hearts}
    {tag("s8-name", "CARLA · VIZINHA DO 302", 160, 1150, MAG, 46, 8, "#fff")}
    {tag("s8-sug", "☕ AÇÚCAR?", 620, 1040, "#fff", 50)}'''
    js = f'''
      hfPop(tl, "#s8-toc-in", .05, -8);
      tl.fromTo("#s8-toc-in", {{ x: 0 }}, {{ x: 14, duration: .05, repeat: 7, yoyo: true, ease: "none", immediateRender: false }}, .1);
      tl.to("#s8-toc-in", {{ scale: 0, duration: .15 }}, {L(sc, 7, "era") - .2});
      tl.fromTo("#s8-hole-in", {{ scale: 0 }}, {{ scale: 1, duration: .4, ease: "back.out(1.6)" }}, {L(sc, 7, "era") - .2});
      tl.fromTo("#s8-carla", {{ scale: 1.25 }}, {{ scale: 1, duration: 1.2, ease: "power2.out", transformOrigin: "50% 40%" }}, {L(sc, 7, "era") - .2});
      hfAlive(tl, "s8c", {d});
      hfPop(tl, "#s8-name-in", {L(sc, 7, "carla")}, -3);
      tl.fromTo(".s8-h", {{ scale: 0 }}, {{ scale: 1, duration: .3, stagger: .08, ease: "back.out(3)" }}, {L(sc, 7, "bonita")});
      tl.fromTo(".s8-h", {{ y: 0 }}, {{ y: -20, duration: .3, repeat: 5, yoyo: true, ease: "sine.inOut", immediateRender: false }}, {L(sc, 7, "bonita") + .5});
      hfPop(tl, "#s8-sug-in", {L(sc, 7, "acucar") - .1}, 5);'''
    write(sc, scene(sc, body, js, bg="#7b4f2c"))


# ------------------------------------------------------------------ S9 problema
def s9():
    sc = "s9-problema"
    d = D(sc)
    smoke = "".join(f'<circle class="s9-sm" cx="{820 + (k % 3) * 60}" cy="1000" r="{50 + (k % 4) * 12}" fill="#4a4a4a" opacity=".8" stroke="{INK}" stroke-width="5"/>' for k in range(7))
    body = f'''
    <div id="s9-world" class="full">
      <div class="full">{room("s9r")}</div>
      {place(A("s9a"), "s9-arm", 250, 760, 560, 3)}
      <svg class="full" viewBox="0 0 1080 1920" style="z-index:4" data-layout-ignore>{smoke}</svg>
    </div>
    <div id="s9-list" data-layout-allow-overlap style="position:absolute;left:90px;top:340px;width:560px;z-index:6">
      <div id="s9-list-in" style="background:#fff;border:9px solid {INK};box-shadow:12px 12px 0 {INK};padding:20px 28px;font-family:'Archivo Black';font-size:54px;line-height:1.35;color:{INK}">
        <div id="s9-c1">❌ CASA</div><div id="s9-c2">❌ ROUPA</div><div id="s9-c3">❌ FRANGO</div></div></div>
    {sfx_word("s9-fush", "FUSH!", "#ff9f1c", 110, 8, "left:700px;top:820px;z-index:7")}'''
    js = f'''
      tl.fromTo("#s9-world", {{ scale: 1.8 }}, {{ scale: 1, duration: .8, ease: "power3.inOut", transformOrigin: "530px 1060px" }}, 0);
      hfAlive(tl, "s9a", {d});
      tl.set(["#s9a-br-sad", "#s9a-m-sad"], {{ opacity: 0 }}, 0); tl.set(["#s9a-br-shock", "#s9a-m-grin", "#s9a-sweat"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s9-list-in", {{ x: -700 }}, {{ x: 0, duration: .35, ease: "back.out(1.5)" }}, {L(sc, 8, "casa") - .3});
      tl.fromTo("#s9-c1", {{ opacity: 0 }}, {{ opacity: 1, duration: .1 }}, {L(sc, 8, "chiqueiro")});
      tl.fromTo("#s9-c2", {{ opacity: 0 }}, {{ opacity: 1, duration: .1 }}, {L(sc, 8, "cueca")});
      tl.fromTo("#s9-c3", {{ opacity: 0 }}, {{ opacity: 1, duration: .1 }}, {L(sc, 8, "frango")});
      tl.fromTo(".s9-sm", {{ y: 0, scale: .4, opacity: 0 }}, {{ y: -600, scale: 1.3, opacity: .8, duration: 2, stagger: .25, ease: "power1.out" }}, {L(sc, 8, "frango") - .3});
      hfPop(tl, "#s9-fush-in", {L(sc, 8, "frango")}, 8);'''
    write(sc, scene(sc, body, js, bg="#27506b"))


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
    <div style="position:absolute;left:0;right:0;top:360px;text-align:center;z-index:5"><div id="s10-t-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;color:{YEL};-webkit-text-stroke:11px {INK};paint-order:stroke fill;text-shadow:9px 9px 0 {INK}">DIA 4: ABRE A PORTA?</div></div>
    {card("a", "A", MAG, "🚪", "ABRIR ASSIM<br>MESMO", chip("s10-a1", "💘 +10", "#ffb3d1") + chip("s10-a2", "⭐ −10", "#ff8fa3"), 100)}
    {card("b", "B", "#2a9d8f", "🙈", "FINGIR QUE<br>NÃO TÁ", chip("s10-b1", "💘 −5", "#ff8fa3"), 545)}
    <div style="position:absolute;left:0;right:0;top:1115px;text-align:center;z-index:6"><div id="s10-com-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;color:#fff;-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">
      COMENTA <span style="color:#ff6fa8">A</span> OU <span style="color:#2ee6c5">B</span></div></div>'''
    js = f'''
      tl.fromTo("#s10-rays", {{ rotation: 0 }}, {{ rotation: 20, duration: {d}, ease: "none", transformOrigin: "540px 1000px" }}, 0);
      tl.fromTo("#s10-t-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2.5)" }}, 0);
      tl.fromTo("#s10-a-in", {{ x: -700, rotation: -15 }}, {{ x: 0, rotation: -3, duration: .4, ease: "back.out(1.4)" }}, {L(sc, 9, "abrir")});
      tl.fromTo("#s10-b-in", {{ x: 700, rotation: 15 }}, {{ x: 0, rotation: 3, duration: .4, ease: "back.out(1.4)" }}, {L(sc, 9, "fingir")});
      hfPop(tl, "#s10-a1", {L(sc, 9, "chance")}, -2); hfPop(tl, "#s10-a2", {L(sc, 9, "reputacao")}, 2);
      hfPop(tl, "#s10-b1", {L(sc, 9, "perde")}, 2);
      tl.fromTo("#s10-com-in", {{ scale: 0, rotation: -10 }}, {{ scale: 1, rotation: -2, duration: .35, ease: "back.out(2.5)" }}, {L(sc, 9, "comenta")});
      tl.fromTo("#s10-com-in", {{ scale: 1 }}, {{ scale: 1.08, duration: .22, repeat: 3, yoyo: true, ease: "sine.inOut", immediateRender: false }}, {L(sc, 9, "comenta") + .4});'''
    write(sc, scene(sc, body, js, bg="#1d3557"))


# ------------------------------------------------------------------ S11 final
def s11():
    sc = "s11-final"
    d = D(sc)
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore><rect width="1080" height="1920" fill="#3b2a1d"/>
      <rect x="200" y="300" width="680" height="1300" fill="#7b4f2c" stroke="{INK}" stroke-width="16"/>
      <rect x="330" y="420" width="420" height="380" fill="#cfe3ef" stroke="{INK}" stroke-width="12"/>
      <circle cx="800" cy="1000" r="28" fill="#f2c230" stroke="{INK}" stroke-width="7"/>
      <rect width="1080" height="1920" fill="#05070f" opacity=".45"/></svg>
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:1" data-layout-ignore><g id="s11-shadow" opacity=".75">
      <ellipse cx="540" cy="540" rx="120" ry="110" fill="#1e2a33"/><ellipse cx="540" cy="840" rx="190" ry="120" fill="#1e2a33"/></g></svg>
    {place(A("s11a"), "s11-arm", 230, 760, 620, 3)}
    {sfx_word("s11-toc", "toc toc…", "#fff", 80, -6, "left:330px;top:580px;z-index:6")}
    <div style="position:absolute;left:0;right:0;top:230px;text-align:center;z-index:6"><div id="s11-t-in" style="display:inline-block;font-family:'Archivo Black';font-size:100px;color:{YEL};-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">FALTAM 28 DIAS…</div></div>
    <div id="s11-end" class="clip" data-start="{d - 2.2:.2f}" data-duration="2.2" style="position:absolute;left:0;right:0;top:1240px;text-align:center;z-index:7">
      <div id="s11-end-in" class="tag" style="position:relative;display:inline-block;font-size:44px;background:{MAG};color:#fff">DIA 4 AMANHÃ · COMENTA A OU B 👇</div></div>'''
    js = f'''
      hfAlive(tl, "s11a", {d});
      tl.set(["#s11a-br-sad"], {{ opacity: 0 }}, 0); tl.set(["#s11a-br-shock", "#s11a-m-grin", "#s11a-sweat"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s11-t-in", {{ scale: 1.4, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: .3 }}, .05);
      tl.fromTo("#s11-shadow", {{ opacity: 0 }}, {{ opacity: .75, duration: .5 }}, {L(sc, 10, "carla") - .3});
      hfPop(tl, "#s11-toc-in", {L(sc, 10, "porta")}, -6);
      tl.fromTo(".s11a-pupil", {{ x: 0 }}, {{ x: -10, duration: .2 }}, {L(sc, 10, "carla")});
      tl.fromTo("#s11-end-in", {{ scale: 0 }}, {{ scale: 1, duration: .35, ease: "back.out(2)" }}, {d - 2.2:.2f});'''
    write(sc, scene(sc, body, js, bg="#3b2a1d"))


# ------------------------------------------------------------------ HUD + legendas
def hud(start, end):
    cid = "hud"
    items = "".join(f'''<div style="display:flex;align-items:center;gap:6px"><div style="font-size:34px">{ic}</div><div style="width:110px;height:22px;background:#1b1035;border:5px solid {INK};border-radius:12px;overflow:hidden;position:relative">
          <div style="width:{v}%;height:100%;background:{c}"></div><div style="position:absolute;left:70%;top:0;width:4px;height:100%;background:#fff"></div></div></div>'''
                    for (ic, _, _, _, c), v in zip(BARS, [20, 30, 10, 40]))
    body = f'''<div id="hud-box" style="position:absolute;left:70px;top:180px;width:820px;z-index:2">
      <div id="hud-in" style="display:flex;align-items:center;gap:18px;background:rgba(255,255,255,.92);border:7px solid {INK};border-radius:26px;padding:10px 18px;box-shadow:8px 8px 0 {INK}">
        <div style="font-family:'Archivo Black';font-size:30px;line-height:1;color:{INK};text-align:center">⏳ 28<br><span style="font-size:28px">DIAS</span></div>
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
        ("impact-bass-1.mp3", 0.0, .45), ("sparkle.mp3", W(0, "voces"), .4), ("whoosh.mp3", W(0, "voces") + .3, .35), ("boing.wav", W(0, "carteira"), .35),
        ("carrinho.wav", PSTART[1] - .1, .45), ("pop.mp3", W(1, "entrou"), .3),
        ("whoosh-short.mp3", PSTART[2] - .1, .35), ("pop.mp3", W(2, "arvore"), .35), ("boing.wav", W(2, "fruta"), .35), ("pop.mp3", W(2, "kiwi"), .4),
        ("caixa.wav", W(3, "1990"), .5), ("caixa.wav", W(3, "1990") + .3, .45), ("moedas.wav", W(3, "sobraram"), .4), ("sparkle.mp3", W(3, "milionario"), .4),
        ("whoosh.mp3", PSTART[4] - .1, .35), ("bip.wav", W(4, "caiu"), .3), ("moedas.wav", W(4, "subiu"), .3), ("notification.mp3", W(4, "estomago") - .2, .4),
        ("fogo.wav", W(5, "frango") - .3, .45), ("tosse.wav", W(5, "frango"), .45), ("alarme.wav", W(5, "detector"), .3), ("boing.wav", W(5, "pediu"), .3),
        ("whoosh-short.mp3", W(5, "luz") - .2, .3),
        ("notification.mp3", W(6, "postou"), .4), ("glitch-1.mp3", W(6, "sarado"), .25), ("pop.mp3", W(6, "cade"), .3),
        ("toc.wav", PSTART[7] - .1, .7), ("whoosh.mp3", W(7, "era") - .2, .35), ("pop.mp3", W(7, "carla"), .35), ("sparkle.mp3", W(7, "bonita"), .45), ("pop.mp3", W(7, "acucar") - .1, .35),
        ("whoosh.mp3", PSTART[8] - .1, .35), ("error.mp3", W(8, "chiqueiro"), .3), ("carimbo.wav", W(8, "cueca"), .45), ("fogo.wav", W(8, "fogo") - .2, .45),
        ("whoosh.mp3", W(9, "abrir"), .4), ("whoosh.mp3", W(9, "fingir"), .4), ("pop.mp3", W(9, "chance"), .3), ("pop.mp3", W(9, "reputacao"), .3),
        ("pop.mp3", W(9, "perde"), .3), ("sparkle.mp3", W(9, "comenta"), .35),
        ("whoosh-short.mp3", PSTART[10] - .1, .3), ("toc.wav", W(10, "porta"), .4),
    ]


def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = [f'''      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s}" data-duration="{e - s:.2f}"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:1"></div>''' for c, s, e in SCENES]
    hs, he = SC["s5-barras"][0], SC["s10-decisao"][0]
    hosts.append(f'''      <div id="hud" data-composition-id="hud" data-composition-src="compositions/hud.html" data-start="{hs}" data-duration="{he - hs:.2f}"
        data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:10"></div>''')
    hosts.append(f'''      <div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>''')
    vd = round(dur(os.path.join(ROOT, "assets/voice/narracao-dia03.wav")), 2)
    p9 = SC["s9-problema"][0]
    audio = [
        f'      <audio id="voz" class="clip" src="assets/voice/narracao-dia03.wav" data-start="0" data-duration="{vd}" data-volume="1" data-track-index="4"></audio>',
        f'      <audio id="trilha-a" class="clip" src="assets/music/positive-background.mp3" data-start="0" data-duration="{p9:.2f}" data-media-start="98.0" data-volume="0.12" data-fade-out="0.3" data-track-index="5"></audio>',
        f'      <audio id="trilha-b" class="clip" src="assets/music/positive-background.mp3" data-start="{p9 + 1.6:.2f}" data-duration="{TOTAL - p9 - 1.6:.2f}" data-media-start="{98.0 + p9 + 1.6:.2f}" data-volume="0.12" data-fade-in="0.4" data-fade-out="1.2" data-track-index="5"></audio>',
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
    <!-- O Chat Controla a Vida do Armando — DIA 3 (gerado por tools/build_chat_dia03.py) -->
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
    hud(SC["s5-barras"][0], SC["s10-decisao"][0])
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "chat-dia03", "name": "O Chat Controla — DIA 3", "createdAt": "2026-11-06T23:30:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, [(n, s, e) for n, s, e in SCENES])
