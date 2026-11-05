"""Gera o DIA 2 (A venceu: hora extra) de "O Chat Controla" em chat-dia02/.

A narração foi acelerada 10% (atempo 1.1); os tempos abaixo são os do áudio
original e são divididos por SPEED.
Uso: python3 tools/build_chat_dia02.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from build_chat_dia01 import BARS, CHAT_HEAD, bg, chip, phone_ui, photo, place  # noqa: E402
from hq_lib import (CYAN, GREEN, INK, MAG, RED, YEL, armando, rodrigo, room,  # noqa: E402
                    scene, sfx_word, speed_lines, valdir)

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chat-dia02")
COMP = os.path.join(ROOT, "compositions")
SPEED = 1.1

# trechos de fala (início, fim no áudio original) + texto
RAW = [
    (0.00, 0.93, "Dia dois."), (1.23, 2.39, "Vocês escolheram A:"), (2.77, 4.70, "o Armando aceitou a hora extra."),
    (5.00, 7.28, "Obrigado pela consideração, gente."),
    (7.63, 9.24, "Sábado, sete da manhã."), (9.54, 11.60, "Enquanto a turma posta foto na praia…"),
    (11.85, 13.41, "ele tá carimbando papel."), (13.78, 16.55, "O único bronzeado dele|é o da luz do monitor."),
    (16.95, 17.95, "O ar-condicionado"), (18.16, 20.55, "tava tão quebrado|que até o grampeador suou."),
    (20.94, 22.95, "E o Seu Valdir ainda|pediu um cafezinho…"), (23.22, 25.20, "sem açúcar,|porque açúcar é caro."),
    (25.66, 28.55, "Oito horas depois,|ele tava destruído."), (28.93, 29.73, "A coluna"),
    (29.91, 31.68, "estalou tão alto|que o GPS falou:"), (32.07, 33.35, "recalculando rota."),
    (33.73, 34.71, "Mas valeu a pena:"), (34.94, 36.44, "dinheiro subiu quinze."), (36.78, 37.60, "Saúde…"),
    (37.91, 38.83, "caiu dez."), (39.19, 40.33, "Matemática de adulto:"), (40.56, 41.45, "ganha quinze,"),
    (41.65, 43.68, "perde dez e ainda|paga o Uber."),
    (44.07, 45.32, "Aí veio o golpe:"), (45.58, 48.65, "o pagamento da hora extra|só cai mês que vem."),
    (49.00, 49.74, "Ou seja…"), (50.10, 51.44, "ele trabalhou no fiado."),
    (51.81, 53.96, "E adivinha quem|também foi chamado?"), (54.25, 55.06, "O Rodrigo."),
    (55.29, 59.28, "Saiu ao meio-dia, de chinelo,|como se o escritório fosse resort…"),
    (59.52, 60.85, "e ainda mandou no grupo:"), (61.06, 63.00, "trabalhando no sábado,|né, gerente?"),
    (63.43, 66.39, "Agora ele chegou em casa|com vinte reais no bolso…"), (66.69, 67.40, "e uma geladeira"),
    (67.61, 68.43, "tão vazia"), (68.62, 70.21, "que até a luz|pediu demissão."), (70.57, 71.67, "Só sobrou um limão…"),
    (71.92, 74.11, "do aniversário|de dois anos atrás."),
    (74.46, 75.40, "Próxima decisão:"), (75.68, 77.10, "miojo a semana inteira,"), (77.30, 78.53, "ou mercado de verdade?"),
    (78.84, 82.61, "Com miojo sobra dinheiro,|mas a saúde desce ainda mais."),
    (82.93, 85.88, "Com mercado ele come bem,|mas o dinheiro vai embora."), (86.17, 87.48, "Comenta A ou B!"),
    (87.83, 89.61, "Faltam vinte e nove dias…"), (89.92, 93.46, "e a saúde dele tá igual bateria|de celular às onze da noite:"),
    (93.85, 94.87, "vinte por cento."),
]
LINES = [(round(a / SPEED, 2), round(b / SPEED, 2), t) for a, b, t in RAW]


def at(i):  # início (s) do trecho i
    return LINES[i][0]


TOTAL = round(LINES[-1][1] + 1.8, 2)
CUTS = [0, 4, 8, 12, 16, 23, 27, 32, 38, 44]  # trecho onde cada cena começa
NAMES = ["s1-resultado", "s2-sabado", "s3-escritorio", "s4-coluna", "s5-barras", "s6-golpe",
         "s7-rodrigo", "s8-geladeira", "s9-decisao", "s10-final"]
SCENES = [(NAMES[k], at(c), (at(CUTS[k + 1]) if k + 1 < len(CUTS) else TOTAL)) for k, c in enumerate(CUTS)]


def L(i, sc):
    """Tempo local (na cena sc) do trecho i."""
    return round(at(i) - dict((n, s) for n, s, _ in SCENES)[sc], 2)


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


def dur_of(sc):
    return round(next(e - s for n, s, e in SCENES if n == sc), 2)


# ------------------------------------------------------------------ S1 resultado
def s1():
    cid = "s1-resultado"
    d = dur_of(cid)
    import random
    rnd = random.Random(2)
    conf = "".join(f'<rect class="s1-cf" x="{rnd.uniform(40, 1040):.0f}" y="{rnd.uniform(-300, -40):.0f}" width="{rnd.choice([16, 22, 28])}" height="{rnd.choice([30, 40])}" '
                   f'fill="{rnd.choice([YEL, MAG, CYAN, GREEN, "#fff"])}" stroke="{INK}" stroke-width="3"/>' for _ in range(60))
    body = f'''
    {bg("s1", "#1d3557", True, 540, 760)}
    <div id="s1-badge" style="position:absolute;left:70px;top:185px;z-index:8">
      <div id="s1-badge-in" style="font-family:'Archivo Black';font-size:96px;color:{YEL};background:{MAG};border:10px solid {INK};
        padding:0 30px;box-shadow:12px 12px 0 {INK};-webkit-text-stroke:8px {INK};paint-order:stroke fill;line-height:1.25">DIA 2</div></div>
    <div id="s1-title" style="position:absolute;left:0;right:0;top:390px;text-align:center;z-index:6">
      <div id="s1-title-in" style="display:inline-block;font-family:'Archivo Black';font-size:84px;color:#fff;-webkit-text-stroke:11px {INK};paint-order:stroke fill;text-shadow:9px 9px 0 {INK}">VOCÊS ESCOLHERAM:</div></div>
    <div id="s1-card" data-layout-allow-overlap style="position:absolute;left:300px;top:540px;width:480px;z-index:5">
      <div id="s1-card-in" style="position:relative;background:#2a9d8f;border:12px solid {INK};border-radius:44px;box-shadow:16px 16px 0 {INK};text-align:center;padding:30px 0 26px">
        <div style="font-family:'Archivo Black';font-size:200px;line-height:1;color:#fff;-webkit-text-stroke:12px {INK};paint-order:stroke fill">A</div>
        <div style="font-size:90px">💼</div>
        <div style="font-family:'Archivo Black';font-size:62px;color:#fff;-webkit-text-stroke:9px {INK};paint-order:stroke fill">ACEITAR</div></div></div>
    <div id="s1-votes" style="position:absolute;left:140px;top:1070px;width:800px;z-index:5">
      <div style="display:flex;height:70px;border:8px solid {INK};border-radius:36px;overflow:hidden;box-shadow:8px 8px 0 {INK};font-family:'Archivo Black';font-size:36px;line-height:54px;color:#fff">
        <div id="s1-va" style="width:68%;background:#2a9d8f;padding-left:24px;-webkit-text-stroke:6px {INK};paint-order:stroke fill;transform-origin:0% 50%">A 68%</div>
        <div style="flex:1;background:{MAG};text-align:right;padding-right:24px;-webkit-text-stroke:6px {INK};paint-order:stroke fill">32% B</div></div></div>
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:7">{conf}</svg>
    <div id="s1-face" data-layout-allow-overlap style="position:absolute;left:640px;top:780px;z-index:8">
      <div id="s1-face-in" class="panel" style="position:relative;width:330px;height:330px;background:{YEL};box-shadow:12px 12px 0 {INK}">
        <div style="position:absolute;left:-30px;top:-20px;width:390px">{armando("s1a")}</div></div></div>'''
    js = f'''
      tl.fromTo("#s1-badge-in", {{ scale: 1.3, rotation: -8 }}, {{ scale: 1, rotation: -4, duration: .35, ease: "back.out(3)" }}, 0);
      tl.fromTo("#s1-title-in", {{ y: -40, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .3 }}, {L(1, cid)});
      tl.fromTo("#s1-card-in", {{ rotationY: 0, scale: .2, rotation: -30 }}, {{ scale: 1, rotation: -3, duration: .5, ease: "back.out(1.7)" }}, {L(1, cid) + .2});
      tl.fromTo("#s1-va", {{ scaleX: 0 }}, {{ scaleX: 1, duration: .6, ease: "power3.out" }}, {L(2, cid)});
      tl.fromTo(".s1-cf", {{ y: 0, rotation: 0 }}, {{ y: (i) => 1500 + (i % 7) * 90, rotation: (i) => (i % 2 ? 1 : -1) * (200 + i * 9), duration: 2.6, stagger: .012, ease: "power1.in" }}, {L(1, cid) + .3});
      hfAlive(tl, "s1a", {d});
      tl.set(["#s1a-m-sad", "#s1a-br-sad"], {{ opacity: 0 }}, 0); tl.set(["#s1a-m-grin", "#s1a-br-worry", "#s1a-sweat"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s1-face-in", {{ scale: 0, rotation: 15 }}, {{ scale: 1, rotation: 4, duration: .35, ease: "back.out(2)" }}, {L(3, cid)});'''
    write(cid, scene(cid, body, js, bg="#1d3557"))


# ------------------------------------------------------------------ S2 sábado (tela dividida)
def office_bg(p):
    return f'''<svg class="full" viewBox="0 0 1080 1920" data-layout-ignore><rect width="1080" height="1920" fill="#c9d6c3"/>
      {"".join(f'<rect x="{x}" y="0" width="6" height="1920" fill="#b5c4ae"/>' for x in range(60, 1080, 140))}
      <rect x="0" y="1300" width="1080" height="620" fill="#8a9a86"/></svg>'''


def desk(p, y=1180):
    return f'''<svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:4">
      <rect x="-20" y="{y}" width="1120" height="70" fill="#a0703f" stroke="{INK}" stroke-width="9"/>
      <rect x="40" y="{y + 70}" width="1000" height="600" fill="#87592e" stroke="{INK}" stroke-width="9"/>
      <g stroke="{INK}" stroke-width="6">{"".join(f'<rect x="{80 + k * 6}" y="{y - 30 - k * 22}" width="230" height="22" fill="#fbf8ef" transform="rotate({(k % 3 - 1) * 3} 195 {y - 20 - k * 22})"/>' for k in range(8))}</g></svg>'''


def s2():
    cid = "s2-sabado"
    d = dur_of(cid)
    post = f'''<div id="s2-post" style="position:absolute;left:190px;top:210px;width:700px;z-index:3">
      <div id="s2-post-in" style="background:#1f2c34;border:8px solid {INK};border-radius:30px;padding:14px;box-shadow:12px 12px 0 {INK};font-family:Inter;color:#e9edef">
        <div style="color:#ffd23f;font-weight:700;font-size:32px;margin:0 6px 8px">Fê · Turma 3ºB</div>
        <div style="border-radius:18px;overflow:hidden;border:4px solid {INK};height:330px">{photo("praia")}</div>
        <div style="font-size:34px;margin:10px 6px 2px">sabadão de praia 🏖️☀️</div></div></div>'''
    body = f'''
    <div id="s2-top" class="panel" style="left:-12px;top:-12px;width:1104px;height:900px;background:#ffb703;z-index:1">
      <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore>{speed_lines("s2-sl", 540, 500, 40, "#fff", .25)}</svg>{post}</div>
    <div id="s2-bot" class="panel" style="left:-12px;top:876px;width:1104px;height:1060px;z-index:2">
      <div style="position:absolute;left:0;top:-876px;width:1080px;height:1920px">
        {office_bg("s2o")}
        {place(armando("s2a"), "s2-arm", 260, 760, 560, 3)}
        <svg class="full" viewBox="0 0 1080 1920" style="z-index:3"><rect id="s2-glow" x="260" y="760" width="560" height="560" fill="#5ad1ff" opacity=".28"/></svg>
        {desk("s2d", 1360)}
        <div id="s2-clock" style="position:absolute;left:800px;top:930px;width:180px;height:180px;z-index:4;border-radius:50%;background:#fff;border:9px solid {INK};
          font-family:'Archivo Black';font-size:54px;line-height:162px;text-align:center;color:{INK}">7:00</div>
        <div id="s2-stamp" style="position:absolute;left:560px;top:1230px;z-index:6;width:120px;height:150px">
          <div style="width:60px;height:80px;margin:0 auto;background:{RED};border:7px solid {INK};border-radius:16px"></div>
          <div style="width:120px;height:44px;background:#5a3b2b;border:7px solid {INK};border-radius:8px"></div></div>
      </div></div>
    <div id="s2-tag" class="clip" data-start="{L(7, cid)}" data-duration="{d - L(7, cid):.2f}" style="position:absolute;left:60px;top:930px;z-index:8">
      <div id="s2-tag-in" class="tag" style="position:relative;background:{CYAN}">BRONZEADO: MONITOR LED</div></div>
    {sfx_word("s2-poc", "POC!", "#fff", 110, -10, "left:690px;top:1120px;z-index:8")}'''
    js = f'''
      tl.fromTo("#s2-post-in", {{ y: -500, rotation: -8 }}, {{ y: 0, rotation: -2, duration: .4, ease: "back.out(1.5)" }}, {L(5, cid) - .2});
      tl.fromTo("#s2-bot", {{ y: 900 }}, {{ y: 0, duration: .35, ease: "power3.out" }}, 0);
      hfAlive(tl, "s2a", {d});
      [{L(6, cid)}, {L(6, cid) + .5}, {L(6, cid) + 1.0}].forEach((t, i) => {{
        tl.fromTo("#s2-stamp", {{ y: 0 }}, {{ y: 60, duration: .1, ease: "power2.in", yoyo: true, repeat: 1, immediateRender: i === 0 }}, t);
      }});
      hfPop(tl, "#s2-poc-in", {L(6, cid) + .1}, -10);
      tl.to("#s2-poc-in", {{ scale: 0, duration: .15 }}, {L(6, cid) + 1.4});
      tl.fromTo("#s2-glow", {{ opacity: .15 }}, {{ opacity: .4, duration: .5, ease: "sine.inOut", yoyo: true, repeat: 5 }}, {L(7, cid)});
      hfPop(tl, "#s2-tag-in", {L(7, cid) + .1}, -3);
      hfBlink(tl, "s2a", [1.2, 3.4]);'''
    write(cid, scene(cid, body, js, bg="#ffb703"))


# ------------------------------------------------------------------ S3 escritório
def s3():
    cid = "s3-escritorio"
    d = dur_of(cid)
    drops = "".join(f'<path class="s3-drop" d="M{x} 520 c-10 18 -10 26 0 28 c10 -2 10 -10 0 -28 Z" fill="#8fe0ff" stroke="{INK}" stroke-width="4"/>' for x in (300, 420, 540))
    stapler = f'''<svg id="s3-stap" viewBox="0 0 260 150" width="260" height="150" style="position:absolute;left:90px;top:1080px;z-index:6" overflow="visible">
      <rect x="10" y="100" width="230" height="40" rx="14" fill="#3a3f4b" stroke="{INK}" stroke-width="8"/>
      <path d="M20 100 L220 70 Q240 68 238 90 L230 100 Z" fill="{RED}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
      <circle cx="90" cy="90" r="6" fill="#fff"/><circle cx="150" cy="82" r="6" fill="#fff"/>
      <path d="M85 86 q5 6 10 0 M145 78 q5 6 10 0" fill="none" stroke="{INK}" stroke-width="3"/>
      <g id="s3-sweat"><path d="M60 40 c-10 18 -10 26 0 28 c10 -2 10 -10 0 -28 Z M200 20 c-10 18 -10 26 0 28 c10 -2 10 -10 0 -28 Z" fill="#8fe0ff" stroke="{INK}" stroke-width="4"/></g></svg>'''
    body = f'''
    {office_bg("s3o")}
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:2">
      <rect x="220" y="380" width="400" height="140" rx="18" fill="#eef2f5" stroke="{INK}" stroke-width="9"/>
      <path d="M250 470 L590 470 M250 490 L590 490" stroke="{INK}" stroke-width="5"/>
      <path d="M560 400 l40 40 M600 400 l-40 40" stroke="{RED}" stroke-width="10"/>
      {drops}
      <rect x="760" y="300" width="250" height="900" fill="#7b5a3a" stroke="{INK}" stroke-width="10"/>
      <rect x="760" y="300" width="250" height="900" fill="#2a1d12" opacity=".35"/></svg>
    <div id="s3-boss" style="position:absolute;left:790px;top:520px;width:220px;z-index:3">{valdir("s3v")}</div>
    <div id="s3-cup" style="position:absolute;left:820px;top:760px;z-index:5">
      <div id="s3-cup-in" style="font-size:90px">☕</div></div>
    <div id="s3-postit" class="clip" data-start="{L(11, cid)}" data-duration="{d - L(11, cid):.2f}" style="position:absolute;left:560px;top:880px;width:380px;z-index:7">
      <div id="s3-postit-in" style="background:#fff36b;border:7px solid {INK};box-shadow:9px 9px 0 {INK};padding:22px;font-family:'Archivo Black';font-size:38px;line-height:1.15;color:{INK}">SEM AÇÚCAR.<br>AÇÚCAR É CARO.</div></div>
    {place(armando("s3a"), "s3-arm", 120, 640, 560, 4)}
    {desk("s3d", 1180)}
    {stapler}
    {sfx_word("s3-plic", "PLIC!", CYAN, 100, -8, "left:120px;top:560px;z-index:8")}'''
    js = f'''
      tl.fromTo(".s3-drop", {{ y: 0, opacity: 1 }}, {{ y: 520, opacity: 1, duration: .55, stagger: {{ each: .35, repeat: 5 }}, ease: "power2.in" }}, 0);
      hfPop(tl, "#s3-plic-in", .25, -8);
      tl.to("#s3-plic-in", {{ scale: 0, duration: .15 }}, 1.3);
      hfAlive(tl, "s3a", {d});
      tl.set(["#s3a-br-sad"], {{ opacity: 0 }}, 0); tl.set(["#s3a-br-worry", "#s3a-sweat"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s3-stap", {{ scale: 1 }}, {{ scale: 1.08, duration: .2, repeat: 7, yoyo: true, ease: "sine.inOut" }}, {L(9, cid) + 1});
      tl.fromTo("#s3-sweat", {{ y: 0, opacity: 0 }}, {{ y: 30, opacity: 1, duration: .5, ease: "power1.in" }}, {L(9, cid) + 1.1});
      tl.fromTo("#s3-boss", {{ x: 260 }}, {{ x: 0, duration: .35, ease: "back.out(1.6)" }}, {L(10, cid)});
      tl.fromTo("#s3-cup-in", {{ scale: 0, rotation: -20 }}, {{ scale: 1, rotation: 0, duration: .3, ease: "back.out(2)" }}, {L(10, cid) + .8});
      tl.fromTo("#s3-postit-in", {{ scale: 0, rotation: 12 }}, {{ scale: 1, rotation: 4, duration: .3, ease: "back.out(2)" }}, {L(11, cid) + .5});'''
    write(cid, scene(cid, body, js, bg="#c9d6c3"))


# ------------------------------------------------------------------ S4 coluna
def s4():
    cid = "s4-coluna"
    d = dur_of(cid)
    body = f'''
    {bg("s4", "#e76f51", True, 540, 700)}
    <div id="s4-clock" style="position:absolute;left:340px;top:230px;width:400px;height:400px;z-index:3">
      <svg viewBox="0 0 400 400" width="400" height="400"><circle cx="200" cy="200" r="185" fill="#fff" stroke="{INK}" stroke-width="14"/>
        {"".join(f'<line x1="200" y1="30" x2="200" y2="60" stroke="{INK}" stroke-width="9" transform="rotate({k * 30} 200 200)"/>' for k in range(12))}
        <g id="s4-hh"><line x1="200" y1="200" x2="200" y2="110" stroke="{INK}" stroke-width="16" stroke-linecap="round"/></g>
        <g id="s4-mh"><line x1="200" y1="200" x2="200" y2="60" stroke="{RED}" stroke-width="10" stroke-linecap="round"/></g>
        <circle cx="200" cy="200" r="16" fill="{INK}"/></svg></div>
    <div id="s4-time" style="position:absolute;left:0;right:0;top:640px;text-align:center;z-index:4">
      <div id="s4-time-in" class="tag" style="position:relative;display:inline-block;font-size:44px">8 HORAS DEPOIS…</div></div>
    {place(armando("s4a"), "s4-arm", 190, 760, 700, 3)}
    {sfx_word("s4-crack", "CRACK!", "#fff", 150, 10, "left:400px;top:760px;z-index:7")}
    <div id="s4-gps" class="clip" data-start="{L(15, cid) - .1:.2f}" data-duration="{d - L(15, cid) + .1:.2f}" style="position:absolute;left:110px;top:760px;z-index:8">
      <div id="s4-gps-in" style="background:#1a73e8;border:8px solid {INK};border-radius:30px;box-shadow:10px 10px 0 {INK};padding:20px 30px;font-family:Inter;font-weight:800;font-size:46px;color:#fff">📍 Recalculando rota…</div></div>'''
    js = f'''
      tl.fromTo("#s4-mh", {{ rotation: 0 }}, {{ rotation: 360 * 8, duration: 2.6, ease: "power2.inOut", svgOrigin: "200 200" }}, 0);
      tl.fromTo("#s4-hh", {{ rotation: 210 }}, {{ rotation: 210 + 240, duration: 2.6, ease: "power2.inOut", svgOrigin: "200 200" }}, 0);
      tl.fromTo("#s4-time-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2)" }}, .1);
      hfAlive(tl, "s4a", {d});
      tl.set(["#s4a-br-sad", "#s4a-m-sad"], {{ opacity: 0 }}, 0); tl.set(["#s4a-br-worry", "#s4a-m-grin", "#s4a-sweat"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s4-arm", {{ rotation: 0, y: 0 }}, {{ rotation: -7, y: 60, duration: 2.2, ease: "power2.in", transformOrigin: "50% 100%" }}, .4);
      // olho tremendo
      tl.fromTo("#s4a-lid-r", {{ scaleY: 1 }}, {{ scaleY: 1.7, duration: .05, repeat: 15, yoyo: true, ease: "none", transformOrigin: "50% 0%" }}, {L(12, cid) + 1.6});
      tl.fromTo("#s4-arm", {{ x: 0 }}, {{ x: 18, duration: .04, repeat: 5, yoyo: true, ease: "none", immediateRender: false }}, {L(14, cid)});
      hfPop(tl, "#s4-crack-in", {L(14, cid)}, 10);
      tl.to("#s4-crack-in", {{ scale: 0, duration: .15 }}, {L(15, cid) - .2});
      tl.fromTo("#s4-gps-in", {{ y: 60, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .25, ease: "back.out(2)" }}, {L(15, cid) - .1});'''
    write(cid, scene(cid, body, js, bg="#e76f51"))


# ------------------------------------------------------------------ S5 barras + matemática
def bar_rows(p, vals, top=330, ids=True):
    rows = ""
    for i, (ic, name, lie, _, col) in enumerate(BARS):
        v = vals[i]
        rows += f'''<div id="{p}-r{i}" style="position:absolute;left:100px;top:{top + i * 125}px;width:860px;height:110px;z-index:4">
            <div style="position:absolute;left:0;top:6px;width:96px;height:96px;border-radius:50%;background:#fff;border:7px solid {INK};font-size:52px;text-align:center;line-height:84px">{ic}</div>
            <div style="position:absolute;left:116px;top:0;font-family:'Archivo Black';font-size:34px;color:#fff;-webkit-text-stroke:6px {INK};paint-order:stroke fill">{name.upper()}</div>
            <div style="position:absolute;left:116px;top:52px;width:620px;height:46px;background:#1b1035;border:7px solid {INK};border-radius:24px;overflow:hidden">
              <div id="{p}-f{i}" style="width:{v}%;height:100%;background:{col};transform-origin:0% 50%"></div></div>
            <div style="position:absolute;left:{116 + 620 * .7 - 4}px;top:40px;width:8px;height:70px;background:#fff;border:3px solid {INK}"></div>
            <div id="{p}-v{i}" style="position:absolute;left:760px;top:46px;font-family:'Archivo Black';font-size:48px;color:#fff;-webkit-text-stroke:7px {INK};paint-order:stroke fill">{v}</div></div>'''
    return rows


def s5():
    cid = "s5-barras"
    d = dur_of(cid)
    coins = "".join(f'<div class="s5-coin" data-layout-allow-overlap data-layout-ignore style="position:absolute;left:{560 + (k % 4) * 60}px;top:200px;font-size:64px;z-index:6">🪙</div>' for k in range(8))
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#5a189a"/>
      {speed_lines("s5-sl", 540, 600, 40, "#fff", .1)}</svg>
    {bar_rows("s5", [30, 20, 10, 40])}
    {coins}
    <div id="s5-d0" data-layout-allow-overlap style="position:absolute;left:880px;top:318px;z-index:7"><div id="s5-d0-in" class="tag" style="position:relative;background:{YEL}">+15</div></div>
    <div id="s5-d1" data-layout-allow-overlap style="position:absolute;left:880px;top:443px;z-index:7"><div id="s5-d1-in" class="tag" style="position:relative;background:#ff8fa3">−10</div></div>
    <div id="s5-math" class="clip" data-start="{L(20, cid) - .1:.2f}" data-duration="{d - L(20, cid) + .1:.2f}" style="position:absolute;left:110px;top:870px;width:860px;z-index:6">
      <div id="s5-math-in" style="background:#264d3b;border:12px solid #7b5a3a;outline:6px solid {INK};box-shadow:12px 12px 0 {INK};padding:26px 30px;
        font-family:'Archivo Black';color:#f4f1e6;text-align:center">
        <div style="font-size:36px;color:#cfe8d5">MATEMÁTICA DE ADULTO</div>
        <div style="font-size:64px;line-height:1.3"><span id="s5-m1">+15</span> <span id="s5-m2">−10</span> <span id="s5-m3">− 🚕 UBER</span> <span id="s5-m4">= 😐</span></div></div></div>'''
    js = f'''
      [0, 1, 2, 3].forEach(i => tl.fromTo("#s5-r" + i, {{ x: -900, opacity: 0 }}, {{ x: 0, opacity: 1, duration: .3, ease: "back.out(1.4)" }}, i * .08));
      tl.fromTo("#s5-f0", {{ scaleX: .5 }}, {{ scaleX: 1, duration: .6, ease: "power3.out" }}, {L(17, cid) + .3});
      tl.fromTo(".s5-coin", {{ y: -200, opacity: 0 }}, {{ y: 120, opacity: 1, duration: .5, stagger: .07, ease: "bounce.out" }}, {L(17, cid) + .2});
      tl.to(".s5-coin", {{ opacity: 0, duration: .2 }}, {L(18, cid)});
      hfPop(tl, "#s5-d0-in", {L(17, cid) + .5}, -4);
      tl.fromTo("#s5-f1", {{ scaleX: 1.5 }}, {{ scaleX: 1, duration: .5, ease: "power3.in" }}, {L(19, cid)});
      hfPop(tl, "#s5-d1-in", {L(19, cid) + .1}, 4);
      tl.fromTo("#s5-r1", {{ x: 0 }}, {{ x: 14, duration: .05, repeat: 7, yoyo: true, ease: "none", immediateRender: false }}, {L(19, cid)});
      tl.fromTo("#s5-math-in", {{ scale: 0, rotation: -8 }}, {{ scale: 1, rotation: -2, duration: .35, ease: "back.out(2)" }}, {L(20, cid) - .1});
      tl.fromTo("#s5-m1", {{ opacity: 0 }}, {{ opacity: 1, duration: .1 }}, {L(21, cid)});
      tl.fromTo("#s5-m2", {{ opacity: 0 }}, {{ opacity: 1, duration: .1 }}, {L(22, cid)});
      tl.fromTo("#s5-m3", {{ opacity: 0 }}, {{ opacity: 1, duration: .1 }}, {L(22, cid) + .8});
      tl.fromTo("#s5-m4", {{ opacity: 0, scale: 2 }}, {{ opacity: 1, scale: 1, duration: .25, ease: "back.out(2)" }}, {L(22, cid) + 1.6});'''
    write(cid, scene(cid, body, js, bg="#5a189a"))


# ------------------------------------------------------------------ S6 golpe
def s6():
    cid = "s6-golpe"
    d = dur_of(cid)
    body = f'''
    {bg("s6", "#2b2d42", True, 540, 900)}
    <div id="s6-notif" style="position:absolute;left:110px;top:335px;width:860px;z-index:4">
      <div id="s6-notif-in" style="background:#fff;border:9px solid {INK};border-radius:34px;box-shadow:12px 12px 0 {INK};padding:24px 30px;font-family:Inter;color:#111">
        <div style="display:flex;align-items:center;gap:16px;font-weight:900;font-size:36px"><div style="width:64px;height:64px;border-radius:16px;background:#1a73e8;color:#fff;text-align:center;line-height:64px;font-size:30px">RH</div>Recursos Humanos · agora</div>
        <div style="font-size:42px;margin-top:14px;line-height:1.25">O pagamento da hora extra será feito no <b>próximo mês</b> 🙂</div></div></div>
    {place(armando("s6a"), "s6-arm", 190, 760, 700, 3)}
    <div id="s6-bar" style="position:absolute;left:110px;top:640px;width:860px;z-index:5">
      <div id="s6-bar-in" style="position:relative;display:flex;align-items:center;gap:16px;background:#1b1035;border:8px solid {INK};border-radius:30px;padding:12px 20px;box-shadow:10px 10px 0 {INK}">
        <div style="font-size:52px">💰</div>
        <div style="flex:1;height:40px;background:#000;border:6px solid {INK};border-radius:20px;overflow:hidden"><div style="width:30%;height:100%;background:{YEL}"></div></div>
        <div id="s6-lock" style="font-size:64px">🔒</div></div></div>
    {sfx_word("s6-fiado", "FIADO", RED, 170, -12, "left:300px;top:540px;z-index:7")}'''
    js = f'''
      tl.fromTo("#s6-notif-in", {{ y: -500 }}, {{ y: 0, duration: .4, ease: "back.out(1.5)" }}, .2);
      hfAlive(tl, "s6a", {d});
      tl.set(["#s6a-m-sad", "#s6a-br-sad"], {{ opacity: 0 }}, 0); tl.set(["#s6a-m-shock", "#s6a-br-shock"], {{ opacity: 1 }}, 0);
      tl.fromTo(["#s6a-lid-l", "#s6a-lid-r"], {{ scaleY: 1 }}, {{ scaleY: .1, duration: .1, transformOrigin: "50% 0%" }}, {L(24, cid) + 1.5});
      tl.fromTo(".s6a-pupil", {{ scale: 1 }}, {{ scale: .5, duration: .1, transformOrigin: "50% 50%" }}, {L(24, cid) + 1.5});
      tl.fromTo("#s6-arm", {{ scale: 1 }}, {{ scale: 1.15, duration: .25, ease: "power4.out", transformOrigin: "50% 40%" }}, {L(24, cid) + 1.5});
      tl.fromTo("#s6-bar-in", {{ x: -900 }}, {{ x: 0, duration: .3, ease: "power3.out" }}, {L(24, cid) + 2.2});
      tl.fromTo("#s6-lock", {{ scale: 3, y: -200, opacity: 0 }}, {{ scale: 1, y: 0, opacity: 1, duration: .25, ease: "power4.in" }}, {L(25, cid)});
      tl.fromTo("#s6-fiado-in", {{ scale: 3, opacity: 0, rotation: -30 }}, {{ scale: 1, opacity: 1, rotation: -12, duration: .18, ease: "power4.in" }}, {L(26, cid) + .5});'''
    write(cid, scene(cid, body, js, bg="#2b2d42"))


# ------------------------------------------------------------------ S7 Rodrigo
def s7():
    cid = "s7-rodrigo"
    d = dur_of(cid)
    chat = f'''{CHAT_HEAD}
      <div id="s7-msg" style="display:flex;gap:16px;align-items:flex-start;margin:30px 22px">
        <div style="width:84px;height:84px;border-radius:50%;overflow:hidden;border:4px solid {INK};background:{MAG};flex:none">
          <div style="width:120px;margin:-6px 0 0 -18px">{rodrigo("s7r0")}</div></div>
        <div style="background:#1f2c34;border-radius:6px 28px 28px 28px;padding:18px 24px;font-family:Inter;color:#e9edef;font-size:44px;line-height:1.3">
          <div style="color:{MAG};font-weight:700;font-size:30px">Rodrigo</div>trabalhando no sábado, né <b style="color:{YEL}">GERENTE</b>? kkkkk 😏</div></div>
      <div id="s7-reacts" style="margin:0 22px 0 122px;font-size:54px">😂😂🤣💀</div>'''
    duck = f'''<svg viewBox="0 0 900 300" width="900" height="300" overflow="visible">
      <ellipse cx="450" cy="170" rx="430" ry="110" fill="{YEL}" stroke="{INK}" stroke-width="12"/>
      <ellipse cx="450" cy="150" rx="250" ry="50" fill="#f2b07c" stroke="{INK}" stroke-width="8"/>
      <path d="M760 110 C780 30 880 30 880 100 C880 140 840 150 820 140 L860 160 L800 170 Z" fill="{YEL}" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/>
      <circle cx="830" cy="80" r="10" fill="{INK}"/><path d="M860 110 L910 118 L860 130 Z" fill="#ff8c1a" stroke="{INK}" stroke-width="6"/>
      <path d="M120 200 Q200 240 300 210" fill="none" stroke="#fff" stroke-width="10" opacity=".6"/></svg>'''
    body = f'''
    <div id="s7-a" class="clip" data-start="0" data-duration="{L(30, cid) + .05:.2f}" style="position:absolute;inset:0;z-index:1">
      <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore><rect width="1080" height="1920" fill="{CYAN}"/>
        <g id="s7-rays">{speed_lines("s7-sl", 540, 700, 50, "#fff", .25)}</g></svg>
      {place(rodrigo("s7r"), "s7-rod", 110, 300, 860)}
      <svg class="full" viewBox="0 0 1080 1920" style="z-index:3"><g transform="translate(110 300) scale(1.4333)"><g id="s7-shades">
        <rect x="180" y="305" width="110" height="56" rx="20" fill="#111" stroke="{INK}" stroke-width="8"/>
        <rect x="310" y="305" width="110" height="56" rx="20" fill="#111" stroke="{INK}" stroke-width="8"/>
        <path d="M290 328 L310 328" stroke="{INK}" stroke-width="8"/><path d="M196 318 L230 318" stroke="#fff" stroke-width="6"/></g></g></svg>
      <div id="s7-duck" style="position:absolute;left:90px;top:1060px;z-index:4">{duck}</div>
      <div id="s7-tag" data-layout-allow-overlap style="position:absolute;left:70px;top:330px;z-index:6">
        <div id="s7-tag-in" class="tag" style="position:relative;background:{YEL};font-size:44px">SAÍDA: 12:00 🩴</div></div>
      {sfx_word("s7-resort", "RESORT?!", MAG, 110, 8, "left:420px;top:420px;z-index:7")}
    </div>
    <div id="s7-b" class="clip" data-start="{L(30, cid):.2f}" data-duration="{d - L(30, cid):.2f}" style="position:absolute;inset:0;z-index:2">
      {bg("s7b", "#3a0ca3")}{phone_ui("s7", chat, 130, 300, 820, 880)}
    </div>'''
    js = f'''
      tl.fromTo("#s7-rays", {{ rotation: 0 }}, {{ rotation: 12, duration: {d}, ease: "none", transformOrigin: "540px 700px" }}, 0);
      tl.fromTo("#s7-rod", {{ x: 1100 }}, {{ x: 0, duration: .45, ease: "back.out(1.3)" }}, {L(28, cid) - .1});
      tl.fromTo("#s7-shades", {{ y: -60 }}, {{ y: 0, duration: .3, ease: "bounce.out" }}, {L(28, cid) + .5});
      hfAlive(tl, "s7r", {d}, 1.2);
      tl.fromTo("#s7-duck", {{ y: 600 }}, {{ y: 0, duration: .4, ease: "back.out(1.6)" }}, {L(29, cid) + 1.0});
      tl.fromTo("#s7-duck", {{ rotation: -3 }}, {{ rotation: 3, duration: .4, repeat: 5, yoyo: true, ease: "sine.inOut", immediateRender: false }}, {L(29, cid) + 1.4});
      tl.fromTo("#s7-tag-in", {{ x: -500 }}, {{ x: 0, duration: .3, ease: "back.out(1.6)" }}, {L(29, cid)});
      hfPop(tl, "#s7-resort-in", {L(29, cid) + 2.6}, 8);
      tl.fromTo("#s7-msg", {{ x: -500, opacity: 0 }}, {{ x: 0, opacity: 1, duration: .3, ease: "back.out(1.5)" }}, {L(31, cid) - .3});
      tl.fromTo("#s7-reacts", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2.5)", transformOrigin: "0% 50%" }}, {L(31, cid) + .9});'''
    write(cid, scene(cid, body, js, bg=CYAN))


# ------------------------------------------------------------------ S8 geladeira
def s8():
    cid = "s8-geladeira"
    d = dur_of(cid)
    fridge = f'''<svg viewBox="0 0 640 1000" width="640" height="1000" overflow="visible">
      <rect x="10" y="10" width="620" height="980" rx="40" fill="#e6edf2" stroke="{INK}" stroke-width="14"/>
      <rect x="50" y="60" width="540" height="880" rx="20" fill="#f9fcff" stroke="{INK}" stroke-width="8"/>
      <rect id="s8-light" x="50" y="60" width="540" height="880" rx="20" fill="#fff6c9" opacity=".7"/>
      <g stroke="#9fb3c2" stroke-width="10">{"".join(f'<line x1="60" y1="{y}" x2="580" y2="{y}"/>' for y in (330, 560, 780))}</g>
      <circle cx="320" cy="90" r="22" fill="#fff8b0" stroke="{INK}" stroke-width="5"/>
      <g transform="translate(250 450)"><g id="s8-lemon">
        <ellipse cx="70" cy="60" rx="78" ry="56" fill="#c9cf4a" stroke="{INK}" stroke-width="8"/>
        <path d="M20 50 q20 -6 30 6 M90 40 q16 -4 26 8 M60 90 q16 -6 26 4" stroke="#8d9230" stroke-width="5" fill="none"/>
        <path d="M30 14 L70 -80 L110 14 Z" fill="{MAG}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>
        <circle cx="70" cy="-84" r="14" fill="{YEL}" stroke="{INK}" stroke-width="5"/>
        <path d="M45 -10 l20 -20 M70 -30 l18 -18" stroke="{YEL}" stroke-width="8"/>
        <circle cx="48" cy="60" r="6" fill="{INK}"/><circle cx="92" cy="60" r="6" fill="{INK}"/><path d="M55 84 Q70 74 85 84" fill="none" stroke="{INK}" stroke-width="5"/></g></g>
      <rect x="380" y="700" width="140" height="70" rx="12" fill="#ffe28a" stroke="{INK}" stroke-width="6"/>
      <text x="450" y="745" text-anchor="middle" font-family="Archivo Black" font-size="30" fill="{INK}">VAZIO</text></svg>'''
    note = f'''<svg viewBox="0 0 300 150" width="300" height="150"><rect x="5" y="5" width="290" height="140" rx="10" fill="#9bd37a" stroke="{INK}" stroke-width="8" transform="rotate(-4 150 75)"/>
      <circle cx="150" cy="75" r="40" fill="#c4e8ad" stroke="{INK}" stroke-width="5"/><text x="150" y="92" text-anchor="middle" font-family="Archivo Black" font-size="46" fill="{INK}">20</text>
      <text x="40" y="45" font-family="Archivo Black" font-size="26" fill="{INK}">R$</text></svg>'''
    body = f'''
    <div class="full">{room("s8r", .3)}</div>
    <div id="s8-fridge" style="position:absolute;left:60px;top:260px;z-index:2">{fridge}</div>
    <div id="s8-yr" class="clip" data-start="{L(37, cid) - .1:.2f}" data-duration="{d - L(37, cid) + .1:.2f}" style="position:absolute;left:150px;top:580px;z-index:6">
      <div id="s8-yr-in" class="tag" style="position:relative;background:{YEL}">DESDE 2024 🎂</div></div>
    {place(armando("s8a"), "s8-arm", 520, 820, 560, 3)}
    <div id="s8-note" data-layout-allow-overlap style="position:absolute;left:600px;top:1340px;z-index:5"><div id="s8-note-in">{note}</div></div>
    {sfx_word("s8-tic", "TIC… TIC…", "#fff", 90, -6, "left:120px;top:180px;z-index:7")}'''
    js = f'''
      tl.fromTo("#s8-fridge", {{ scale: .9, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: .3, ease: "power3.out" }}, 0);
      hfAlive(tl, "s8a", {d});
      tl.set(["#s8a-br-sad"], {{ opacity: 0 }}, 0); tl.set(["#s8a-br-worry"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s8-note-in", {{ y: 300, rotation: 20 }}, {{ y: 0, rotation: -6, duration: .4, ease: "back.out(1.6)" }}, .9);
      tl.fromTo("#s8-light", {{ opacity: .7 }}, {{ opacity: 0, duration: .06, repeat: 9, yoyo: true, ease: "steps(1)" }}, {L(35, cid)});
      tl.to("#s8-light", {{ opacity: 0, duration: .05 }}, {L(35, cid) + .7});
      hfPop(tl, "#s8-tic-in", {L(35, cid)}, -6);
      tl.to("#s8-tic-in", {{ scale: 0, duration: .15 }}, {L(36, cid)});
      tl.fromTo("#s8-lemon", {{ y: 0 }}, {{ y: -30, duration: .25, repeat: 3, yoyo: true, ease: "sine.inOut" }}, {L(36, cid)});
      hfPop(tl, "#s8-yr-in", {L(37, cid)}, -4);
      hfBlink(tl, "s8a", [1.6]);'''
    write(cid, scene(cid, body, js, bg="#27506b"))


# ------------------------------------------------------------------ S9 decisão
def s9():
    cid = "s9-decisao"
    d = dur_of(cid)

    def card(k, letter, col, icon, title, chips, x, t):
        return f'''<div id="s9-{k}" style="position:absolute;left:{x}px;top:560px;width:390px;z-index:4">
          <div id="s9-{k}-in" style="position:relative;background:{col};border:10px solid {INK};border-radius:40px;box-shadow:14px 14px 0 {INK};padding:26px 10px 20px;text-align:center">
            <div style="position:absolute;left:-30px;top:-40px;width:110px;height:110px;border-radius:50%;background:#fff;border:9px solid {INK};
              font-family:'Archivo Black';font-size:66px;line-height:92px;color:{INK}">{letter}</div>
            <div style="font-size:110px;line-height:1.1">{icon}</div>
            <div style="font-family:'Archivo Black';font-size:48px;line-height:1.05;color:#fff;-webkit-text-stroke:8px {INK};paint-order:stroke fill;margin:6px 0 10px">{title}</div>
            {chips}</div></div>'''
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#1d3557"/>
      <g id="s9-rays">{speed_lines("s9-sl", 540, 1000, 36, "#4cc9f0", .16)}</g></svg>
    <div id="s9-t" style="position:absolute;left:0;right:0;top:360px;text-align:center;z-index:5">
      <div id="s9-t-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;color:{YEL};-webkit-text-stroke:11px {INK};paint-order:stroke fill;text-shadow:9px 9px 0 {INK}">DIA 3: O QUE ELE COME?</div></div>
    {card("a", "A", "#f4a261", "🍜", "MIOJO A<br>SEMANA TODA", chip("s9-a1", "💰 +10", YEL) + chip("s9-a2", "❤️ −10", "#ff8fa3"), 100, 0)}
    {card("b", "B", "#2a9d8f", "🛒", "MERCADO DE<br>VERDADE", chip("s9-b1", "💰 −10", "#ff8fa3") + chip("s9-b2", "❤️ +10", GREEN), 545, 0)}
    <div id="s9-com" style="position:absolute;left:0;right:0;top:1115px;text-align:center;z-index:6">
      <div id="s9-com-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;color:#fff;-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">
        COMENTA <span style="color:#f4a261">A</span> OU <span style="color:#2ee6c5">B</span></div></div>'''
    js = f'''
      tl.fromTo("#s9-rays", {{ rotation: 0 }}, {{ rotation: 20, duration: {d}, ease: "none", transformOrigin: "540px 1000px" }}, 0);
      tl.fromTo("#s9-t-in", {{ scale: 0 }}, {{ scale: 1, duration: .3, ease: "back.out(2.5)" }}, 0);
      tl.fromTo("#s9-a-in", {{ x: -700, rotation: -15 }}, {{ x: 0, rotation: -3, duration: .4, ease: "back.out(1.4)" }}, {L(39, cid)});
      tl.fromTo("#s9-b-in", {{ x: 700, rotation: 15 }}, {{ x: 0, rotation: 3, duration: .4, ease: "back.out(1.4)" }}, {L(40, cid)});
      hfPop(tl, "#s9-a1", {L(41, cid) + .5}, -2); hfPop(tl, "#s9-a2", {L(41, cid) + 2.2}, 2);
      hfPop(tl, "#s9-b2", {L(42, cid) + .8}, 2); hfPop(tl, "#s9-b1", {L(42, cid) + 2.2}, -2);
      tl.fromTo("#s9-com-in", {{ scale: 0, rotation: -10 }}, {{ scale: 1, rotation: -2, duration: .35, ease: "back.out(2.5)" }}, {L(43, cid)});
      tl.fromTo("#s9-com-in", {{ scale: 1 }}, {{ scale: 1.08, duration: .22, repeat: 3, yoyo: true, ease: "sine.inOut", immediateRender: false }}, {L(43, cid) + .4});'''
    write(cid, scene(cid, body, js, bg="#1d3557"))


# ------------------------------------------------------------------ S10 final
def s10():
    cid = "s10-final"
    d = dur_of(cid)
    body = f'''
    <div class="full">{room("s10r", 0)}</div>
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:1"><rect width="1080" height="1920" fill="#05070f" opacity=".72"/></svg>
    {place(armando("s10a", "phone"), "s10-arm", 190, 600, 700, 3)}
    <div id="s10-t" style="position:absolute;left:0;right:0;top:230px;text-align:center;z-index:6">
      <div id="s10-t-in" style="display:inline-block;font-family:'Archivo Black';font-size:100px;color:{YEL};-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">FALTAM 29 DIAS…</div></div>
    <div id="s10-bat" style="position:absolute;left:300px;top:470px;z-index:6">
      <div id="s10-bat-in" style="display:flex;align-items:center;gap:20px">
        <div style="font-size:70px">❤️</div>
        <div style="position:relative;width:300px;height:130px;border:12px solid #fff;border-radius:24px;box-shadow:0 0 0 6px {INK}">
          <div id="s10-bat-f" style="position:absolute;left:8px;top:8px;bottom:8px;width:18%;background:{RED};border-radius:8px"></div>
          <div style="position:absolute;right:-34px;top:34px;width:22px;height:40px;background:#fff;border-radius:6px"></div>
          <div style="position:absolute;inset:0;text-align:center;font-family:'Archivo Black';font-size:60px;line-height:106px;color:#fff;-webkit-text-stroke:8px {INK};paint-order:stroke fill">20%</div></div></div></div>
    <div id="s10-end" class="clip" data-start="{d - 2.2:.2f}" data-duration="2.2" style="position:absolute;left:0;right:0;top:1240px;text-align:center;z-index:7">
      <div id="s10-end-in" class="tag" style="position:relative;display:inline-block;font-size:44px;background:{MAG};color:#fff">DIA 3 AMANHÃ · COMENTA A OU B 👇</div></div>'''
    js = f'''
      hfAlive(tl, "s10a", {d});
      tl.set(["#s10a-br-sad"], {{ opacity: 0 }}, 0); tl.set(["#s10a-br-worry", "#s10a-sweat"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s10a-glow", {{ opacity: 0 }}, {{ opacity: .14, duration: .4 }}, .1);
      tl.fromTo("#s10-t-in", {{ scale: 1.4, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: .3 }}, .05);
      tl.fromTo("#s10-bat-in", {{ scale: 0 }}, {{ scale: 1, duration: .35, ease: "back.out(2)" }}, {L(46, cid) - 1.2});
      tl.fromTo("#s10-bat-f", {{ opacity: 1 }}, {{ opacity: .2, duration: .3, repeat: 9, yoyo: true, ease: "steps(1)" }}, {L(46, cid) - .8});
      hfBlink(tl, "s10a", [1.4]);
      tl.fromTo("#s10-end-in", {{ scale: 0 }}, {{ scale: 1, duration: .35, ease: "back.out(2)" }}, {d - 2.2:.2f});'''
    write(cid, scene(cid, body, js, bg="#05070f"))


# ------------------------------------------------------------------ HUD + legendas
def hud(start):
    cid = "hud"
    items = "".join(f'''<div style="display:flex;align-items:center;gap:6px">
        <div style="font-size:34px">{ic}</div><div style="width:110px;height:22px;background:#1b1035;border:5px solid {INK};border-radius:12px;overflow:hidden;position:relative">
          <div style="width:{v}%;height:100%;background:{c}"></div><div style="position:absolute;left:70%;top:0;width:4px;height:100%;background:#fff"></div></div></div>'''
                    for (ic, _, _, _, c), v in zip(BARS, [30, 20, 10, 40]))
    body = f'''
    <div id="hud-box" style="position:absolute;left:70px;top:180px;width:820px;z-index:2">
      <div id="hud-in" style="display:flex;align-items:center;gap:18px;background:rgba(255,255,255,.92);border:7px solid {INK};border-radius:26px;padding:10px 18px;box-shadow:8px 8px 0 {INK}">
        <div style="font-family:'Archivo Black';font-size:30px;line-height:1;color:{INK};text-align:center">⏳ 29<br><span style="font-size:28px">DIAS</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px">{items}</div></div></div>'''
    hide = round(at(38) - start - .3, 2)
    js = f'''
      tl.fromTo("#hud-in", {{ y: -200 }}, {{ y: 0, duration: .35, ease: "back.out(1.5)" }}, 0);
      tl.to("#hud-in", {{ y: -450, duration: .3, ease: "power2.in" }}, {hide});'''
    write(cid, scene(cid, body, js, "#root { background: transparent; }", bg="transparent"))


def caps():
    cid = "caps"
    groups = []
    for st, en, text in LINES:
        parts = text.split("|")
        total = sum(len(x) for x in parts)
        t = st
        for part in parts:
            du = (en - st) * len(part) / total
            groups.append((round(t, 2), round(t + du, 2), part))
            t += du
    html, js = [], []
    for gi, (st, en, text) in enumerate(groups):
        words = text.split(" ")
        nchar = sum(len(w) for w in words)
        spans = " ".join(f'<span id="cw{gi}-{wi}" class="cw">{w}</span>' for wi, w in enumerate(words))
        start = max(0.1, st - 0.05)
        end = (groups[gi + 1][0] - 0.02) if gi + 1 < len(groups) and groups[gi + 1][0] - en < 0.35 else en + 0.25
        rot = (-1.5, 1.2, -0.8, 1.6)[gi % 4]
        html.append(f'''<div id="cg{gi}" class="clip cg" data-start="{start:.2f}" data-duration="{end - start:.2f}">
        <div id="cg{gi}-in" class="cbox">{spans}</div></div>''')
        js.append(f'tl.fromTo("#cg{gi}-in", {{ scale: .6, rotation: {rot - 4} }}, {{ scale: 1, rotation: {rot}, duration: .18, ease: "back.out(2.5)" }}, {start:.2f});')
        acc = 0
        for wi, w in enumerate(words):
            wt = st + (en - st) * acc / max(1, nchar)
            js.append(f'tl.fromTo("#cw{gi}-{wi}", {{ color: "#15122b" }}, {{ color: "#e5007e", duration: .05, immediateRender: false }}, {wt:.2f});')
            acc += len(w)
    css = f'''#root {{ background: transparent; }}
      .cg {{ position:absolute; left:90px; right:150px; top:1235px; text-align:center; }}
      .cbox {{ display:inline-block; background:{YEL}; border:7px solid {INK}; box-shadow:9px 9px 0 {INK}; padding:10px 24px;
        font-family:Montserrat; font-weight:900; font-size:52px; line-height:1.12; color:{INK}; text-transform:uppercase; max-width:840px; }}'''
    write(cid, scene(cid, "\n".join(html), "\n      ".join(js), css, bg="transparent"))


# ------------------------------------------------------------------ áudio + raiz
def sfx_list():
    S = lambda i, o=0: round(at(i) + o, 2)  # noqa: E731
    return [
        ("impact-bass-1.mp3", 0.0, .45), ("sparkle.mp3", S(1, .2), .4), ("whoosh.mp3", S(1, .2), .35), ("pop.mp3", S(2), .35),
        ("boing.wav", S(3, .1), .35),
        ("whoosh-short.mp3", S(4), .35), ("pop.mp3", S(5, -.2), .35), ("carimbo.wav", S(6), .45), ("carimbo.wav", S(6, .5), .4),
        ("carimbo.wav", S(6, 1.0), .45), ("pop.mp3", S(7, .1), .3),
        ("plic.wav", S(8), .5), ("plic.wav", S(8, .35), .45), ("plic.wav", S(8, .7), .5), ("plic.wav", S(8, 1.05), .45),
        ("whoosh-short.mp3", S(10), .35), ("pop.mp3", S(10, .8), .3), ("pop.mp3", S(11, .5), .35),
        ("whoosh.mp3", S(12), .35), ("crack.wav", S(14), .7), ("ping.mp3", S(15, -.1), .35),
        ("moedas.wav", S(17, .2), .45), ("bip.wav", S(19), .35), ("pop.mp3", S(20, -.1), .3), ("click-soft.mp3", S(21), .45),
        ("click-soft.mp3", S(22), .45), ("click-soft.mp3", S(22, .8), .45), ("boing.wav", S(22, 1.6), .4),
        ("notification.mp3", S(23, .2), .45), ("error.mp3", S(24, 1.5), .4), ("cadeado.wav", S(25), .6), ("carimbo.wav", S(26, .5), .7),
        ("whoosh.mp3", S(28, -.1), .4), ("pop.mp3", S(29), .3), ("boing.wav", S(29, 1.0), .3), ("pop.mp3", S(29, 2.6), .35),
        ("notification.mp3", S(31, -.3), .4), ("pop.mp3", S(31, .9), .3),
        ("zumbido-geladeira.wav", S(32), .3), ("glitch-1.mp3", S(35), .25), ("pop.mp3", S(37), .35),
        ("whoosh.mp3", S(38), .35), ("whoosh-short.mp3", S(39), .35), ("whoosh-short.mp3", S(40), .35),
        ("pop.mp3", S(41, .5), .3), ("pop.mp3", S(41, 2.2), .3), ("pop.mp3", S(42, .8), .3), ("pop.mp3", S(42, 2.2), .3),
        ("sparkle.mp3", S(43), .35), ("whoosh-short.mp3", S(44), .3), ("coracao.wav", S(45), .5), ("bip.wav", S(46, -.8), .3),
    ]


def dur(path):
    import subprocess
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = [f'''      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s}" data-duration="{e - s:.2f}"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:1"></div>''' for c, s, e in SCENES]
    hs = at(16)
    hosts.append(f'''      <div id="hud" data-composition-id="hud" data-composition-src="compositions/hud.html" data-start="{hs}" data-duration="{TOTAL - hs:.2f}"
        data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:10"></div>''')
    hosts.append(f'''      <div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>''')
    vd = round(dur(os.path.join(ROOT, "assets/voice/narracao-dia02.wav")), 2)
    g0, g1 = at(23), at(27)  # pausa da música no "golpe"
    audio = [
        f'      <audio id="voz" class="clip" src="assets/voice/narracao-dia02.wav" data-start="0" data-duration="{vd}" data-volume="1" data-track-index="4"></audio>',
        f'      <audio id="trilha-a" class="clip" src="assets/music/positive-background.mp3" data-start="0" data-duration="{g0:.2f}" data-media-start="2.0" data-volume="0.12" data-fade-out="0.25" data-track-index="5"></audio>',
        f'      <audio id="trilha-b" class="clip" src="assets/music/positive-background.mp3" data-start="{g1:.2f}" data-duration="{TOTAL - g1:.2f}" data-media-start="{2.0 + g1:.2f}" data-volume="0.12" data-fade-in="0.4" data-fade-out="1.2" data-track-index="5"></audio>',
    ]
    lanes = []
    for i, (f, st, vol) in enumerate(sfx_list()):
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
    <!-- O Chat Controla a Vida do Armando — DIA 2 (gerado por tools/build_chat_dia02.py) -->
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
    hud(at(16))
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump({"id": "chat-dia02", "name": "O Chat Controla — DIA 2", "createdAt": "2026-11-05T23:30:00.000Z"}, f, ensure_ascii=False, indent=2)
    print("ok", TOTAL, [(n, s, e) for n, s, e in SCENES])
