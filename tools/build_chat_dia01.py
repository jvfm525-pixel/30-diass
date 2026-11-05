"""Gera o DIA 1 de "O Chat Controla a Vida do Armando" em chat-dia01/.

Os tempos vêm das pausas da narração (assets/voice/narracao-dia01.wav).
Uso: python3 tools/build_chat_dia01.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from hq_lib import (CYAN, GREEN, INK, MAG, RED, YEL, armando, burst, fly,  # noqa: E402
                    rodrigo, room, scene, sfx_word, speed_lines, valdir)

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chat-dia01")
COMP = os.path.join(ROOT, "compositions")
TOTAL = 60.0

SCENES = [  # id, início, fim (absolutos)
    ("s1-armando", 0.0, 5.17), ("s2-mensagem", 5.17, 11.38), ("s3-fotos", 11.38, 17.83),
    ("s4-mentira", 17.83, 25.40), ("s5-rodrigo", 25.40, 30.05), ("s6-meta", 30.05, 37.53),
    ("s7-voce", 37.53, 42.37), ("s8-decisao", 42.37, 54.48), ("s9-final", 54.48, TOTAL),
]

# Frases da narração (início, fim, texto; "|" divide em grupos de legenda)
LINES = [
    (0.05, 1.12, "Esse é o Armando."), (1.40, 2.86, "Trinta e dois anos…"),
    (3.17, 4.74, "e a vida dele é isso aí."),
    (5.17, 7.89, "Até que chegou a mensagem|que ele mais temia:"),
    (8.29, 11.01, "o reencontro de dez anos|da turma da escola."),
    (11.38, 14.30, "Todo mundo casado,|rico, viajando…"),
    (14.62, 17.39, "e o Armando aqui,|com miojo e meia furada."),
    (17.83, 20.65, "Então ele fez a maior|besteira da vida dele."),
    (21.33, 21.93, "Mentiu."), (22.50, 23.50, "Quatro vezes."), (23.91, 25.00, "Numa mensagem só."),
    (25.40, 25.99, "E o pior:"), (26.44, 29.68, "o Rodrigo, o valentão da escola,|sabe a verdade."),
    (30.05, 33.86, "Agora ele tem trinta dias|pra transformar cada mentira em verdade:"),
    (34.20, 37.14, "dinheiro, saúde,|amor e reputação."),
    (37.53, 39.75, "Mas ele não vai|decidir nada sozinho."), (40.21, 41.00, "Quem decide…"),
    (41.37, 41.91, "é você."), (42.37, 43.35, "Primeira decisão:"),
    (43.65, 45.70, "o chefe quer ele|trabalhando no sábado."),
    (46.01, 47.56, "Se aceitar, ganha dinheiro,"), (47.73, 49.18, "mas acaba com a saúde."),
    (49.55, 50.25, "Se recusar,"), (50.47, 51.20, "descansa,"), (51.38, 52.43, "mas queima o filme."),
    (52.76, 54.02, "Comenta A ou B!"), (54.48, 55.80, "Faltam trinta dias…"),
    (56.15, 57.46, "e o Rodrigo tá de olho."),
]


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


def place(svg, cid, left, top, width, z=2, extra=""):
    return f'<div id="{cid}" style="position:absolute;left:{left}px;top:{top}px;width:{width}px;z-index:{z};{extra}">{svg}</div>'


def bg(p, color, lines=True, cx=540, cy=900):
    sl = speed_lines(f"{p}-sl", cx, cy, 44, "#fff", .14) if lines else ""
    return f'<svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="{color}"/>{sl}</svg>'


def phone_ui(p, inner, left=170, top=230, w=740, h=960):
    return f'''<div id="{p}-phone" style="position:absolute;left:{left}px;top:{top}px;width:{w}px;height:{h}px;z-index:3">
      <div style="position:absolute;inset:0;border-radius:64px;background:#14151a;border:12px solid {INK};box-shadow:16px 16px 0 {INK}"></div>
      <div style="position:absolute;left:24px;top:24px;right:24px;bottom:24px;border-radius:44px;background:#0e1d24;overflow:hidden">{inner}</div></div>'''


CHAT_HEAD = f'''<div style="height:118px;background:#1f2c34;display:flex;align-items:center;gap:20px;padding:0 26px;font-family:Inter;color:#e9edef">
  <div style="width:74px;height:74px;border-radius:50%;background:{YEL};border:4px solid {INK};font-size:42px;text-align:center;line-height:68px">🎓</div>
  <div><div style="font-weight:700;font-size:38px">Turma 3ºB 🎓</div><div style="font-size:30px;color:#8696a0">32 participantes</div></div></div>'''


def bubble(cid, name, color, text, extra="", right=False):
    side = "margin-left:auto;background:#005c4b;border-radius:28px 6px 28px 28px" if right else "background:#1f2c34;border-radius:6px 28px 28px 28px"
    nm = "" if right else f'<div style="color:{color};font-weight:700;font-size:28px;margin-bottom:6px">{name}</div>'
    return (f'<div id="{cid}" style="{side};max-width:600px;padding:18px 24px;font-family:Inter;color:#e9edef;font-size:36px;'
            f'line-height:1.25;margin:18px 22px;{extra}">{nm}{text}</div>')


# ------------------------------------------------------------------ S1
def s1():
    cid, d = "s1-armando", 5.17
    body = f'''
    <div id="s1-cam" class="full">
      <div class="full">{room("s1r")}</div>
      {place(armando("s1a", "miojo"), "s1-arm", 90, 300, 900)}
      <svg class="full" viewBox="0 0 1080 1920" overflow="visible" style="z-index:5">{fly("s1f0")}{fly("s1f1")}{fly("s1f2")}</svg>
    </div>
    <div id="s1-badge" style="position:absolute;left:70px;top:185px;z-index:8">
      <div id="s1-badge-in" style="font-family:'Archivo Black';font-size:96px;color:{YEL};background:{MAG};border:10px solid {INK};
        padding:0 30px;box-shadow:12px 12px 0 {INK};-webkit-text-stroke:8px {INK};paint-order:stroke fill;line-height:1.25">DIA 1</div></div>
    <div id="s1-title" style="position:absolute;left:70px;top:340px;z-index:8">
      <div id="s1-title-in" class="tag" style="position:relative;font-size:38px;background:{YEL}">O CHAT CONTROLA A VIDA DELE</div></div>
    <div id="s1-tag" class="clip" data-start="1.35" data-duration="3.82" style="position:absolute;left:440px;top:560px;z-index:8">
      <div id="s1-tag-in" class="tag" style="position:relative">ARMANDO, 32 ANOS</div>
      <svg width="140" height="120" style="position:absolute;left:10px;top:70px"><path d="M100 10 Q40 30 30 110" fill="none" stroke="{INK}" stroke-width="10"/>
        <path d="M10 85 L30 115 L55 88" fill="none" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/></svg></div>
    {sfx_word("s1-slurp", "SLURP!", CYAN, 110, -10, "left:620px;top:860px;z-index:7")}'''
    js = '''
      hfAlive(tl, "s1a", 5.17);
      hfFlies(tl, ["s1f0","s1f1","s1f2"], 5.17, [[300,640,130,80],[780,700,110,100],[540,520,240,50]]);
      hfBlink(tl, "s1a", [1.0, 3.9]);
      tl.fromTo("#s1-cam", { scale: 1.22 }, { scale: 1.12, duration: 3.1, ease: "none", transformOrigin: "540px 820px" }, 0);
      tl.to("#s1-cam", { scale: 1, duration: .55, ease: "power3.inOut" }, 3.15);
      tl.fromTo("#s1-badge-in", { scale: 1.3, rotation: -8 }, { scale: 1, rotation: -4, duration: .35, ease: "back.out(3)" }, 0);
      tl.fromTo("#s1-title-in", { x: -30 }, { x: 0, duration: .35, ease: "power3.out" }, 0);
      // mastigando
      [0.15, 0.55, 1.6, 2.0, 2.4].forEach(t => {
        tl.set("#s1a-m-sad", { opacity: 0 }, t); tl.set("#s1a-m-chew", { opacity: 1 }, t);
        tl.set("#s1a-m-chew", { opacity: 0 }, t + .2); tl.set("#s1a-m-sad", { opacity: 1 }, t + .2);
      });
      tl.fromTo("#s1a-noodle", { scaleY: 1 }, { scaleY: .25, duration: .4, ease: "power2.in", transformOrigin: "50% 0%" }, .45);
      tl.to("#s1a-noodle", { scaleY: 1, duration: .01 }, 1.5);
      tl.to("#s1a-noodle", { scaleY: .25, duration: .4, ease: "power2.in" }, 1.55);
      hfPop(tl, "#s1-slurp-in", .45, -10);
      tl.to("#s1-slurp-in", { scale: 0, duration: .15, ease: "power2.in" }, 1.25);
      hfPop(tl, "#s1-tag-in", 1.35, 4);
      tl.fromTo("#s1a-sweat", { opacity: 0, y: -10 }, { opacity: 1, y: 30, duration: .6, ease: "power1.in" }, 3.3);'''
    write(cid, scene(cid, body, js))


# ------------------------------------------------------------------ S2
def s2():
    cid, d = "s2-mensagem", 6.21
    invite = f'''<div id="s2-inv" style="margin:20px 22px;border-radius:26px;overflow:hidden;border:5px solid {INK};background:{YEL};font-family:'Archivo Black';color:{INK};text-align:center;padding:24px 10px">
      <div style="font-size:40px">REENCONTRO</div><div style="font-size:108px;line-height:1;color:{MAG};-webkit-text-stroke:6px {INK};paint-order:stroke fill">10 ANOS</div>
      <div style="font-size:34px">TURMA 3ºB · DAQUI 30 DIAS</div></div>'''
    chat = f'''{CHAT_HEAD}<div id="s2-feed" style="padding-top:10px">
      {bubble("s2-b1", "Juliana", "#ff8fb5", "REENCONTRO em 30 dias!! 🎉<br>Tragam a família 😍")}
      {invite}
      {bubble("s2-b2", "Marcão", "#53bdeb", "BORAAA 🔥🔥")}</div>'''
    body = f'''
    <div id="s2-a" class="clip" data-start="0" data-duration="4.15" style="position:absolute;inset:0;z-index:1">
      {bg("s2", "#2a9d8f")}
      {phone_ui("s2", chat)}
      {sfx_word("s2-bzz", "BZZZ!", YEL, 150, -8, "left:60px;top:1000px;z-index:6")}
    </div>
    <div id="s2-b" class="clip" data-start="4.15" data-duration="2.06" style="position:absolute;inset:0;z-index:2">
      {bg("s2b", RED, True, 540, 760)}
      {place(armando("s2a"), "s2-arm", 40, 240, 1000)}
      <svg class="full" viewBox="0 0 1080 1920" style="z-index:4"><g id="s2-fall" fill="none" stroke="{INK}" stroke-width="16" stroke-linecap="round">
        <path d="M520 920 q-20 60 10 120 q25 60 -5 120"/><path d="M560 925 q25 60 -5 130 q-20 50 10 100"/></g>
        <g id="s2-fall2" fill="none" stroke="#ffd77a" stroke-width="8" stroke-linecap="round">
        <path d="M520 920 q-20 60 10 120 q25 60 -5 120"/><path d="M560 925 q25 60 -5 130 q-20 50 10 100"/></g></svg>
      {sfx_word("s2-plof", "PLOFT!", YEL, 140, 10, "left:600px;top:1000px;z-index:6")}
    </div>'''
    js = '''
      tl.fromTo("#s2-phone", { y: 700, rotation: 8 }, { y: 0, rotation: -2, duration: .45, ease: "back.out(1.3)" }, 0);
      tl.fromTo("#s2-phone", { x: 0 }, { x: 12, duration: .045, repeat: 9, yoyo: true, ease: "none", immediateRender: false }, .45);
      hfPop(tl, "#s2-bzz-in", .3, -8);
      tl.to("#s2-bzz-in", { scale: 0, duration: .15 }, 1.6);
      tl.fromTo("#s2-b1", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: .3, ease: "back.out(1.6)" }, .55);
      tl.fromTo("#s2-inv", { scale: .3, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, ease: "back.out(1.8)" }, 2.4);
      tl.fromTo("#s2-b2", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: .25, ease: "power3.out" }, 3.7);
      // reação: o miojo cai
      hfAlive(tl, "s2a", 6.21);
      tl.set(["#s2a-m-sad", "#s2a-br-sad"], { opacity: 0 }, 4.15);
      tl.set(["#s2a-m-shock", "#s2a-br-shock", "#s2a-sweat"], { opacity: 1 }, 4.15);
      tl.fromTo(["#s2a-lid-l", "#s2a-lid-r"], { scaleY: 1 }, { scaleY: .1, duration: .1, transformOrigin: "50% 0%" }, 4.15);
      tl.fromTo(".s2a-pupil", { scale: 1 }, { scale: .55, duration: .1, transformOrigin: "50% 50%" }, 4.15);
      tl.fromTo("#s2-arm", { scale: 1.25, y: 0 }, { scale: 1, y: 0, duration: .35, ease: "power4.out", transformOrigin: "50% 40%" }, 4.15);
      tl.fromTo(["#s2-fall", "#s2-fall2"], { y: 0, opacity: 1 }, { y: 650, opacity: 1, duration: .55, ease: "power2.in" }, 4.4);
      hfPop(tl, "#s2-plof-in", 4.9, 10);'''
    write(cid, scene(cid, body, js))


# ------------------------------------------------------------------ S3
def photo(kind):
    if kind == "casamento":
        art = f'''<rect width="300" height="260" fill="#ffd6e7"/><circle cx="110" cy="100" r="40" fill="#f1c39a" stroke="{INK}" stroke-width="5"/>
          <path d="M60 260 C70 170 150 170 160 260 Z" fill="#fff" stroke="{INK}" stroke-width="5"/><path d="M70 90 C70 40 150 40 150 90 L170 200 L50 200 Z" fill="#fff" opacity=".8" stroke="{INK}" stroke-width="4"/>
          <circle cx="200" cy="95" r="38" fill="#c98a5a" stroke="{INK}" stroke-width="5"/><path d="M150 260 C160 170 240 170 250 260 Z" fill="#2b2d42" stroke="{INK}" stroke-width="5"/>
          <path d="M150 40 c-10 -20 -40 -10 -30 15 l30 25 l30 -25 c10 -25 -20 -35 -30 -15 Z" fill="{RED}" stroke="{INK}" stroke-width="4"/>'''
    elif kind == "carro":
        art = f'''<rect width="300" height="260" fill="#bde0fe"/><rect y="200" width="300" height="60" fill="#8d99ae"/>
          <path d="M30 200 L50 150 L110 120 L200 120 L250 150 L280 160 L280 200 Z" fill="{RED}" stroke="{INK}" stroke-width="6"/>
          <path d="M115 128 L195 128 L230 152 L90 152 Z" fill="#cde8ff" stroke="{INK}" stroke-width="4"/>
          <circle cx="85" cy="205" r="26" fill="{INK}"/><circle cx="225" cy="205" r="26" fill="{INK}"/><circle cx="85" cy="205" r="10" fill="#ccc"/><circle cx="225" cy="205" r="10" fill="#ccc"/>
          <text x="150" y="60" text-anchor="middle" font-family="Archivo Black" font-size="34" fill="{INK}">0 KM!</text>'''
    elif kind == "praia":
        art = f'''<rect width="300" height="260" fill="#ffb703"/><circle cx="220" cy="80" r="45" fill="#fff3b0" stroke="{INK}" stroke-width="5"/>
          <rect y="160" width="300" height="50" fill="#219ebc"/><rect y="205" width="300" height="55" fill="#ffe8a3"/>
          <path d="M60 210 C70 150 60 110 80 80" fill="none" stroke="#7f4f24" stroke-width="12"/><path d="M80 80 q-50 -10 -70 20 M80 80 q40 -30 70 0 M80 80 q-10 -40 20 -60" fill="none" stroke="#2d6a4f" stroke-width="12" stroke-linecap="round"/>
          <text x="190" y="190" text-anchor="middle" font-size="40">🍹</text>'''
    else:
        art = f'''<rect width="300" height="260" fill="#cdb4db"/><circle cx="150" cy="130" r="80" fill="#f8d1b0" stroke="{INK}" stroke-width="6"/>
          <circle cx="122" cy="125" r="8" fill="{INK}"/><circle cx="178" cy="125" r="8" fill="{INK}"/><path d="M130 160 Q150 178 170 160" fill="none" stroke="{INK}" stroke-width="6"/>
          <path d="M150 50 q10 -20 25 -10" fill="none" stroke="{INK}" stroke-width="5"/><circle cx="105" cy="150" r="12" fill="#ff8fa3" opacity=".7"/><circle cx="195" cy="150" r="12" fill="#ff8fa3" opacity=".7"/>'''
    return f'<svg viewBox="0 0 300 260" width="100%" style="display:block">{art}</svg>'


def s3():
    cid, d = "s3-fotos", 6.45
    posts = [("Carol", "#ff8fb5", "casamento", "casei!! 💍"), ("Marcão", "#53bdeb", "carro", "presente pra mim 😎"),
             ("Fê", "#ffd23f", "praia", "Maldivas 🏝️"), ("Tati", "#a6e3a1", "bebe", "o Theo chegou 💙")]
    cards = "".join(f'''<div id="s3-p{i}" style="position:absolute;left:{110 + (i % 2) * 440}px;top:{230 + (i // 2) * 470}px;width:400px;z-index:3">
        <div id="s3-p{i}-in" style="background:#1f2c34;border:8px solid {INK};border-radius:30px;padding:14px;box-shadow:12px 12px 0 {INK};font-family:Inter;color:#e9edef">
          <div style="color:{c};font-weight:700;font-size:30px;margin:0 6px 8px">{n}</div>
          <div style="border-radius:18px;overflow:hidden;border:4px solid {INK}">{photo(k)}</div>
          <div style="font-size:30px;margin:10px 6px 2px">{cap}</div></div></div>''' for i, (n, c, k, cap) in enumerate(posts))
    sock = f'''<svg viewBox="0 0 340 300" width="340" height="300"><rect width="340" height="300" fill="#5a3b2b"/>
      <path d="M60 300 L80 120 C85 80 140 80 150 120 L170 200 C180 230 260 220 300 240 C330 255 320 300 300 300 Z" fill="#e9e4d6" stroke="{INK}" stroke-width="8"/>
      <path d="M78 150 L150 150" stroke="{RED}" stroke-width="12"/><path d="M76 175 L156 175" stroke="{RED}" stroke-width="12"/>
      <ellipse cx="296" cy="262" rx="24" ry="20" fill="#f0b27a" stroke="{INK}" stroke-width="6"/>
      <g id="s3-toe"><ellipse cx="300" cy="258" rx="14" ry="12" fill="#f0b27a" stroke="{INK}" stroke-width="5"/></g>
      <path d="M250 225 q10 -14 20 0" fill="none" stroke="{INK}" stroke-width="4"/></svg>'''
    body = f'''
    <div id="s3-a" class="clip" data-start="0" data-duration="3.34" style="position:absolute;inset:0;z-index:1">
      {bg("s3", "#0e1d24", False)}{cards}
    </div>
    <div id="s3-b" class="clip" data-start="3.24" data-duration="3.21" style="position:absolute;inset:0;z-index:2">
      <div id="s3-b-in" class="full">
        <div class="full">{room("s3r", .6)}</div>
        {place(armando("s3a"), "s3-arm", 140, 420, 800)}
        <div id="s3-sock" style="position:absolute;left:560px;top:250px;z-index:6">
          <div id="s3-sock-in" class="panel" style="position:relative;width:340px;height:300px;transform-origin:50% 50%;box-shadow:12px 12px 0 {INK}">{sock}</div>
          <div class="tag" style="position:relative;margin-top:16px;font-size:30px;left:-40px">(a mesma de ontem)</div></div>
      </div>
    </div>'''
    js = '''
      [0.05, 0.8, 1.5, 2.2].forEach((t, i) => {
        tl.fromTo("#s3-p" + i + "-in", { scale: 0, rotation: (i % 2 ? 12 : -12) }, { scale: 1, rotation: (i % 2 ? 2 : -2), duration: .35, ease: "back.out(2)" }, t);
      });
      tl.fromTo("#s3-b-in", { x: 1080 }, { x: 0, duration: .3, ease: "power3.out" }, 3.24);
      hfAlive(tl, "s3a", 6.45);
      tl.set(["#s3a-br-sad"], { opacity: 0 }, 3.24); tl.set(["#s3a-br-worry"], { opacity: 1 }, 3.24);
      tl.fromTo("#s3-arm", { y: 0 }, { y: 120, duration: 2.6, ease: "power1.in" }, 3.5);
      hfBlink(tl, "s3a", [4.2]);
      tl.fromTo("#s3-sock-in", { scale: 0, rotation: -20 }, { scale: 1, rotation: 4, duration: .35, ease: "back.out(2)" }, 4.55);
      tl.fromTo("#s3-toe", { rotation: -12 }, { rotation: 12, duration: .14, repeat: 7, yoyo: true, ease: "sine.inOut", transformOrigin: "50% 50%" }, 4.9);'''
    write(cid, scene(cid, body, js, bg="#0e1d24"))


# ------------------------------------------------------------------ S4
MSG = "Claro! Vou com minha namorada 😎 tô bem de vida, sarado e sou gerente agora"
LIES = ["namorada", "bem de vida", "sarado", "gerente"]


def s4():
    cid, d = "s4-mentira", 7.57
    # texto digitado letra a letra
    chars = list(MSG)
    typed = "".join(f'<span class="s4-ch" id="s4-c{i}">{c}</span>' for i, c in enumerate(chars))
    # balão enviado com as 4 mentiras marcadas
    rich = MSG
    for k, lie in enumerate(LIES):
        rich = rich.replace(lie, f'<span style="position:relative;white-space:nowrap">{lie}<span id="s4-m{k}" class="s4-mk"></span>'
                                 f'<span id="s4-n{k}" class="s4-num">{k + 1}</span></span>', 1)
    chat = f'''{CHAT_HEAD}
      <div id="s4-sent" style="position:absolute;left:0;right:0;top:170px">
        <div style="margin-left:auto;margin-right:22px;max-width:640px;background:#005c4b;border-radius:30px 6px 30px 30px;padding:22px 26px;
          font-family:Inter;color:#e9edef;font-size:44px;line-height:1.45;border:5px solid {INK}">{rich}
          <div style="text-align:right;font-size:30px;color:#8696a0;margin-top:6px">21:48 <span id="s4-ticks" style="color:#8696a0">✔✔</span></div></div></div>
      <div id="s4-input" style="position:absolute;left:18px;right:18px;bottom:22px;background:#2a3942;border-radius:36px;padding:20px 26px;
        font-family:Inter;color:#e9edef;font-size:36px;line-height:1.3;min-height:90px">{typed}<span id="s4-caret" style="color:#53bdeb">|</span></div>'''
    body = f'''
    {bg("s4", "#3a0ca3")}
    {phone_ui("s4", chat, 130, 220, 820, 980)}
    {sfx_word("s4-tec", "TEC TEC TEC", "#fff", 90, -6, "left:140px;top:110px;z-index:6")}
    <div data-layout-allow-overlap data-layout-allow-occlusion>{sfx_word("s4-stamp", "MENTIRA!", RED, 170, -12, "left:110px;top:520px;z-index:7")}</div>
    <div id="s4-face" data-layout-allow-overlap style="position:absolute;left:70px;top:820px;z-index:6">
      <div id="s4-face-in" class="panel" style="position:relative;width:360px;height:360px;background:{YEL};box-shadow:12px 12px 0 {INK}">
        <div style="position:absolute;left:-30px;top:-20px;width:420px">{armando("s4a")}</div></div></div>'''
    n = len(chars)
    js = f'''
      tl.fromTo("#s4-phone", {{ scale: .9, y: 40 }}, {{ scale: 1, y: 0, duration: .3, ease: "power3.out" }}, 0);
      tl.fromTo(".s4-ch", {{ opacity: 0 }}, {{ opacity: 1, duration: .01, stagger: {2.55 / n:.4f}, ease: "none" }}, .2);
      tl.fromTo("#s4-caret", {{ opacity: 1 }}, {{ opacity: 0, duration: .2, repeat: 11, yoyo: true, ease: "steps(1)" }}, 0);
      tl.fromTo("#s4-sent", {{ y: 700, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .3, ease: "back.out(1.4)" }}, 2.82);
      tl.to("#s4-input", {{ opacity: 0, duration: .1 }}, 2.82);
      hfPop(tl, "#s4-tec-in", .3, -6);
      tl.to("#s4-tec-in", {{ scale: 0, duration: .15 }}, 2.7);
      // "Mentiu."
      tl.fromTo("#s4-stamp-in", {{ scale: 3, opacity: 0, rotation: -30 }}, {{ scale: 1, opacity: 1, rotation: -12, duration: .18, ease: "power4.in" }}, 3.5);
      tl.fromTo("#s4-phone", {{ x: 0 }}, {{ x: 16, duration: .04, repeat: 5, yoyo: true, ease: "none", immediateRender: false }}, 3.68);
      tl.to("#s4-stamp-in", {{ y: -330, scale: .55, duration: .35, ease: "power3.inOut" }}, 4.4);
      // "Quatro vezes."
      [4.67, 4.92, 5.17, 5.42].forEach((t, k) => {{
        tl.fromTo("#s4-m" + k, {{ scale: 0 }}, {{ scale: 1, duration: .18, ease: "back.out(2.5)" }}, t);
        tl.fromTo("#s4-n" + k, {{ scale: 0 }}, {{ scale: 1, duration: .18, ease: "back.out(3)" }}, t + .04);
      }});
      // "Numa mensagem só."
      hfAlive(tl, "s4a", 7.57);
      tl.set(["#s4a-m-sad", "#s4a-br-sad"], {{ opacity: 0 }}, 0); tl.set(["#s4a-m-grin", "#s4a-br-worry", "#s4a-sweat"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s4-face-in", {{ scale: 0, rotation: -15 }}, {{ scale: 1, rotation: -4, duration: .35, ease: "back.out(2)" }}, 6.08);'''
    css = f'''.s4-mk {{ position:absolute; left:-10px; right:-10px; top:-4px; bottom:-6px; border:7px solid {RED}; border-radius:30px; }}
      .s4-num {{ position:absolute; right:-22px; top:-34px; width:52px; height:52px; border-radius:50%; background:{RED}; color:#fff;
        border:5px solid {INK}; font-family:'Archivo Black'; font-size:30px; line-height:42px; text-align:center; }}'''
    write(cid, scene(cid, body, js, css, bg="#3a0ca3"))


# ------------------------------------------------------------------ S5
def s5():
    cid, d = "s5-rodrigo", 4.65
    chat = f'''{CHAT_HEAD}
      <div style="position:absolute;left:0;right:0;top:150px">
        <div style="margin-left:auto;margin-right:22px;max-width:600px;background:#005c4b;border-radius:30px 6px 30px 30px;padding:18px 24px;
          font-family:Inter;color:#e9edef;font-size:32px;line-height:1.35">Claro! Vou com minha namorada 😎 tô bem de vida, sarado e sou gerente agora
          <div style="text-align:right;font-size:30px;color:#8696a0">21:48 <span style="position:relative">✔✔<span id="s5-blue" style="position:absolute;left:0;top:0;color:#53bdeb">✔✔</span></span></div></div>
        <div id="s5-rep" style="display:flex;gap:16px;align-items:flex-start;margin:26px 22px">
          <div style="width:84px;height:84px;border-radius:50%;overflow:hidden;border:4px solid {INK};background:{MAG};flex:none">
            <div style="width:120px;margin:-6px 0 0 -18px">{rodrigo("s5r0")}</div></div>
          <div style="background:#1f2c34;border-radius:6px 28px 28px 28px;padding:18px 24px;font-family:Inter;color:#e9edef;font-size:40px;line-height:1.3">
            <div style="color:{MAG};font-weight:700;font-size:28px">Rodrigo</div>kkkkk sei… te vejo lá 😏</div></div></div>'''
    body = f'''
    <div id="s5-a" class="clip" data-start="0" data-duration="2.45" style="position:absolute;inset:0;z-index:1">
      {bg("s5", "#3a0ca3")}{phone_ui("s5", chat, 130, 220, 820, 980)}
    </div>
    <div id="s5-b" class="clip" data-start="2.4" data-duration="2.25" style="position:absolute;inset:0;z-index:2">
      <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore><rect width="1080" height="1920" fill="{RED}"/>
        <g id="s5-rays">{speed_lines("s5-sl", 540, 700, 50, "#000", .18)}</g></svg>
      {place(rodrigo("s5r"), "s5-rod", 110, 240, 860)}
      <div id="s5-name" style="position:absolute;left:70px;top:190px;z-index:6">
        <div id="s5-name-in" class="tag" style="position:relative;background:{YEL};font-size:52px">RODRIGO</div>
        <div class="tag" style="position:relative;margin-top:14px;font-size:30px;background:#fff">o valentão da 3ºB</div></div>
      <div id="s5-ins" data-layout-allow-overlap style="position:absolute;left:70px;top:820px;z-index:6">
        <div id="s5-ins-in" class="panel" style="position:relative;width:340px;height:340px;background:{CYAN};box-shadow:12px 12px 0 {INK}">
          <div style="position:absolute;left:-30px;top:-20px;width:400px">{armando("s5a")}</div></div></div>
      {sfx_word("s5-gulp", "GULP!", "#fff", 120, -10, "left:330px;top:780px;z-index:7")}
    </div>'''
    js = '''
      tl.fromTo("#s5-blue", { opacity: 0 }, { opacity: 1, duration: .15 }, .1);
      tl.fromTo("#s5-rep", { x: -500, opacity: 0 }, { x: 0, opacity: 1, duration: .3, ease: "back.out(1.5)" }, 1.04);
      tl.fromTo("#s5-rays", { rotation: 0 }, { rotation: 12, duration: 2.25, ease: "none", transformOrigin: "540px 700px" }, 2.4);
      tl.fromTo("#s5-rod", { scale: 1.3, x: 120 }, { scale: 1, x: 0, duration: .4, ease: "power4.out", transformOrigin: "50% 30%" }, 2.4);
      hfAlive(tl, "s5r", 4.65, 1.2);
      tl.fromTo("#s5r-smirk", { scaleX: 1 }, { scaleX: 1.08, duration: .5, ease: "sine.inOut", transformOrigin: "60% 50%" }, 2.9);
      tl.fromTo("#s5-name-in", { x: -400 }, { x: 0, duration: .3, ease: "back.out(1.6)" }, 2.45);
      hfAlive(tl, "s5a", 4.65);
      tl.set(["#s5a-m-sad", "#s5a-br-sad"], { opacity: 0 }, 0); tl.set(["#s5a-m-shock", "#s5a-br-worry", "#s5a-sweat"], { opacity: 1 }, 0);
      tl.fromTo("#s5-ins-in", { scale: 0, rotation: 15 }, { scale: 1, rotation: -3, duration: .35, ease: "back.out(2)" }, 3.55);
      hfPop(tl, "#s5-gulp-in", 3.75, -10);'''
    write(cid, scene(cid, body, js, bg=RED))


# ------------------------------------------------------------------ S6
BARS = [("💰", "Dinheiro", "“tô bem de vida”", 15, "#ffd23f"), ("❤️", "Saúde", "“tô sarado”", 30, "#ff4d6d"),
        ("💘", "Amor", "“vou com minha namorada”", 10, "#ff8fd8"), ("⭐", "Reputação", "“sou gerente”", 40, "#4cc9f0")]


def s6():
    cid, d = "s6-meta", 7.48
    rows = ""
    for i, (ic, name, lie, val, col) in enumerate(BARS):
        rows += f'''<div id="s6-r{i}" style="position:absolute;left:100px;top:{690 + i * 125}px;width:860px;height:110px;z-index:4">
          <div id="s6-r{i}-in" style="position:relative;width:100%;height:100%">
            <div style="position:absolute;left:0;top:6px;width:96px;height:96px;border-radius:50%;background:#fff;border:7px solid {INK};font-size:52px;text-align:center;line-height:84px">{ic}</div>
            <div style="position:absolute;left:116px;top:0;font-family:'Archivo Black';font-size:34px;color:#fff;-webkit-text-stroke:6px {INK};paint-order:stroke fill">{name.upper()}
              <span style="font-family:Inter;font-weight:700;font-size:28px;-webkit-text-stroke:0;color:#d9c8ff">{lie}</span></div>
            <div style="position:absolute;left:116px;top:52px;width:620px;height:46px;background:#1b1035;border:7px solid {INK};border-radius:24px;overflow:hidden">
              <div id="s6-f{i}" style="width:{val}%;height:100%;background:{col};transform-origin:0% 50%"></div></div>
            <div style="position:absolute;left:{116 + 620 * .7 - 4}px;top:40px;width:8px;height:70px;background:#fff;border:3px solid {INK}"></div>
            <div id="s6-v{i}" style="position:absolute;left:760px;top:46px;font-family:'Archivo Black';font-size:48px;color:#fff;-webkit-text-stroke:7px {INK};paint-order:stroke fill">{val}</div>
          </div></div>'''
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#5a189a"/>
      <g id="s6-burst">{burst("s6-b", MAG, 16, 260, 360, 540, 440)}</g></svg>
    <div id="s6-cal" style="position:absolute;left:290px;top:230px;width:500px;z-index:3">
      <div id="s6-cal-in" style="background:#fff;border:10px solid {INK};border-radius:30px;box-shadow:14px 14px 0 {INK};text-align:center;overflow:hidden">
        <div style="background:{RED};border-bottom:8px solid {INK};font-family:'Archivo Black';font-size:40px;color:#fff;padding:10px">REENCONTRO EM</div>
        <div id="s6-n" style="font-family:'Archivo Black';font-size:200px;line-height:1.05;color:{INK}">30</div>
        <div style="font-family:'Archivo Black';font-size:44px;color:{INK};margin:-12px 0 16px">DIAS</div></div></div>
    <div id="s6-meta" style="position:absolute;left:640px;top:640px;z-index:5">
      <div id="s6-meta-in" class="tag" style="position:relative;font-size:30px;background:{GREEN}">META: 70</div></div>
    {rows}'''
    js = '''
      tl.fromTo("#s6-burst", { scale: .2, rotation: -30 }, { scale: 1, rotation: 0, duration: .45, ease: "back.out(1.6)", transformOrigin: "540px 440px" }, 0);
      tl.to("#s6-burst", { rotation: 20, duration: 7, ease: "none" }, .45);
      tl.fromTo("#s6-cal-in", { y: -500, rotation: -10 }, { y: 0, rotation: -3, duration: .45, ease: "back.out(1.5)" }, .1);
      tl.fromTo("#s6-n", { scale: 1 }, { scale: 1.12, duration: .18, repeat: 3, yoyo: true, ease: "sine.inOut" }, 1.5);
      [4.15, 4.95, 5.7, 6.25].forEach((t, i) => {
        tl.fromTo("#s6-r" + i + "-in", { x: -900, opacity: 0 }, { x: 0, opacity: 1, duration: .3, ease: "back.out(1.4)" }, t);
        tl.fromTo("#s6-f" + i, { scaleX: 0 }, { scaleX: 1, duration: .45, ease: "power3.out" }, t + .2);
      });
      hfPop(tl, "#s6-meta-in", 6.7, 4);'''
    write(cid, scene(cid, body, js, bg="#5a189a"))


# ------------------------------------------------------------------ S7
def s7():
    cid, d = "s7-voce", 4.84
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="{CYAN}"/>
      <g id="s7-rays">{speed_lines("s7-sl", 540, 800, 48, "#fff", .25)}</g></svg>
    <div id="s7-a" class="clip" data-start="0" data-duration="3.84" style="position:absolute;inset:0;z-index:2">
      {place(armando("s7a"), "s7-arm", 40, 300, 1000)}
    </div>
    <div id="s7-b" class="clip" data-start="3.84" data-duration="1.0" style="position:absolute;inset:0;z-index:2">
      {place(armando("s7b", "point"), "s7-armb", 40, 300, 1000)}
      {sfx_word("s7-voce", "VOCÊ!", YEL, 230, -6, "left:150px;top:360px;z-index:6")}
    </div>'''
    js = '''
      tl.fromTo("#s7-rays", { rotation: 0 }, { rotation: 15, duration: 4.84, ease: "none", transformOrigin: "540px 800px" }, 0);
      hfAlive(tl, "s7a", 3.84);
      tl.set(["#s7a-br-sad"], { opacity: 0 }, 0); tl.set(["#s7a-br-worry", "#s7a-sweat"], { opacity: 1 }, 0);
      hfBlink(tl, "s7a", [1.1]);
      tl.fromTo("#s7-arm", { scale: 1 }, { scale: 1.15, duration: 3.6, ease: "power1.in", transformOrigin: "50% 40%" }, 0);
      hfMood(tl, "s7a", 2.68, ["m-smirk", "br-angry"], ["m-sad", "br-worry"]);
      tl.fromTo(".s7a-pupil", { x: 0 }, { x: -8, duration: .15 }, 2.0);
      tl.to(".s7a-pupil", { x: 0, duration: .15 }, 2.7);
      hfAlive(tl, "s7b", 4.84);
      tl.set(["#s7b-br-sad", "#s7b-m-sad"], { opacity: 0 }, 0); tl.set(["#s7b-br-angry", "#s7b-m-grin"], { opacity: 1 }, 0);
      tl.fromTo("#s7b-hand", { scale: .4, y: 220 }, { scale: 1.3, y: 190, duration: .25, ease: "power4.out", svgOrigin: "300 620" }, 3.84);
      tl.fromTo("#s7-voce-in", { scale: 3, opacity: 0 }, { scale: 1, opacity: 1, duration: .2, ease: "power4.in" }, 3.86);'''
    write(cid, scene(cid, body, js, bg=CYAN))


# ------------------------------------------------------------------ S8
def chip(cid, text, col):
    return (f'<div id="{cid}" style="display:inline-block;margin:6px;font-family:\'Archivo Black\';font-size:40px;color:{INK};'
            f'background:{col};border:6px solid {INK};border-radius:18px;padding:4px 16px;box-shadow:6px 6px 0 {INK}">{text}</div>')


def s8():
    cid, d = "s8-decisao", 12.11
    call = f'''<div id="s8-call" style="position:absolute;left:190px;top:580px;width:700px;z-index:3">
      <div id="s8-call-in" style="background:#111827;border:10px solid {INK};border-radius:50px;box-shadow:14px 14px 0 {INK};padding:40px 30px;text-align:center;font-family:Inter;color:#fff">
        <div style="font-size:38px;color:#9ca3af">chamada recebida…</div>
        <div id="s8-av" style="width:260px;height:260px;margin:26px auto">{valdir("s8v")}</div>
        <div style="font-family:'Archivo Black';font-size:52px">SEU VALDIR</div><div style="font-size:34px;color:{YEL};font-weight:700">(CHEFE) 😤</div></div></div>'''
    balloon = f'''<div id="s8-bal" style="position:absolute;left:110px;top:330px;width:860px;z-index:5">
      <div id="s8-bal-in" style="position:relative;background:#fff;border:9px solid {INK};border-radius:60px;padding:30px 36px;box-shadow:12px 12px 0 {INK};
        font-family:'Archivo Black';font-size:52px;line-height:1.15;color:{INK};text-align:center">Armando, preciso de você no <span style="color:{RED}">SÁBADO!</span>
        <svg width="80" height="70" style="position:absolute;left:120px;bottom:-66px"><path d="M0 0 L20 66 L70 0" fill="#fff" stroke="{INK}" stroke-width="9" stroke-linejoin="round"/>
          <rect x="4" y="-8" width="62" height="12" fill="#fff"/></svg></div></div>'''

    def card(k, letter, col, icon, title, chips, x):
        return f'''<div id="s8-{k}" style="position:absolute;left:{x}px;top:600px;width:390px;z-index:4">
          <div id="s8-{k}-in" style="position:relative;background:{col};border:10px solid {INK};border-radius:40px;box-shadow:14px 14px 0 {INK};padding:26px 10px 20px;text-align:center">
            <div style="position:absolute;left:-30px;top:-40px;width:110px;height:110px;border-radius:50%;background:#fff;border:9px solid {INK};
              font-family:'Archivo Black';font-size:66px;line-height:92px;color:{INK}">{letter}</div>
            <div style="font-size:110px;line-height:1.1">{icon}</div>
            <div style="font-family:'Archivo Black';font-size:54px;color:#fff;-webkit-text-stroke:8px {INK};paint-order:stroke fill;margin:6px 0 10px">{title}</div>
            {chips}</div></div>'''
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#1d3557"/>
      <g id="s8-rays">{speed_lines("s8-sl", 540, 1000, 36, "#4cc9f0", .16)}</g>
      <g fill="{YEL}">{"".join(f'<circle class="s8-bulb" cx="{x}" cy="{y}" r="14" stroke="{INK}" stroke-width="4"/>' for x, y in [(60 + i * 120, 1460) for i in range(9)])}</g></svg>
    <div id="s8-p1" class="clip" data-start="0" data-duration="12.11" style="position:absolute;inset:0;z-index:2">
      {call}{balloon}
      {sfx_word("s8-trim", "TRIIIM!", YEL, 120, 8, "left:480px;top:400px;z-index:6")}
    </div>
    <div id="s8-p2" class="clip" data-start="3.6" data-duration="8.51" style="position:absolute;inset:0;z-index:3">
      {card("a", "A", "#2a9d8f", "💼", "ACEITAR", chip("s8-a1", "💰 +15", YEL) + chip("s8-a2", "❤️ −10", "#ff8fa3"), 100)}
      {card("b", "B", MAG, "🛋️", "RECUSAR", chip("s8-b1", "❤️ +10", GREEN) + chip("s8-b2", "⭐ −10", "#ff8fa3"), 545)}
      <div id="s8-com" style="position:absolute;left:0;right:0;top:1030px;text-align:center;z-index:6">
        <div id="s8-com-in" style="display:inline-block;font-family:'Archivo Black';font-size:80px;color:#fff;-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">
          COMENTA <span style="color:#2ee6c5">A</span> OU <span style="color:{MAG}">B</span></div></div>
    </div>'''
    js = '''
      tl.fromTo("#s8-rays", { rotation: 0 }, { rotation: 20, duration: 12.11, ease: "none", transformOrigin: "540px 1000px" }, 0);
      tl.fromTo(".s8-bulb", { opacity: .3 }, { opacity: 1, duration: .25, stagger: { each: .12, repeat: 11, yoyo: true }, ease: "none" }, 0);
      tl.fromTo("#s8-call-in", { scale: .3, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, ease: "back.out(1.8)" }, 0);
      tl.fromTo("#s8-call-in", { rotation: 0 }, { rotation: 3, duration: .06, repeat: 13, yoyo: true, ease: "none", immediateRender: false }, .35);
      hfPop(tl, "#s8-trim-in", .1, 8);
      tl.to("#s8-trim-in", { scale: 0, duration: .15 }, 1.25);
            tl.to("#s8-call-in", { opacity: 0, y: 700, duration: .3, ease: "power2.in" }, 3.4);
      tl.fromTo("#s8-bal-in", { scale: 0 }, { scale: 1, duration: .35, ease: "back.out(2)", transformOrigin: "20% 100%" }, 1.28);
      tl.fromTo("#s8-a-in", { x: -700, rotation: -15 }, { x: 0, rotation: -3, duration: .4, ease: "back.out(1.4)" }, 3.64);
      hfPop(tl, "#s8-a1", 4.4, -2); hfPop(tl, "#s8-a2", 5.36, 2);
      tl.fromTo("#s8-b-in", { x: 700, rotation: 15 }, { x: 0, rotation: 3, duration: .4, ease: "back.out(1.4)" }, 7.18);
      hfPop(tl, "#s8-b1", 8.1, -2); hfPop(tl, "#s8-b2", 9.01, 2);
      tl.fromTo("#s8-com-in", { scale: 0, rotation: -10 }, { scale: 1, rotation: -2, duration: .35, ease: "back.out(2.5)" }, 10.39);
      tl.fromTo("#s8-com-in", { scale: 1 }, { scale: 1.08, duration: .22, repeat: 3, yoyo: true, ease: "sine.inOut", immediateRender: false }, 10.8);
      tl.fromTo(["#s8-a-in", "#s8-b-in"], { y: 0 }, { y: -14, duration: .3, repeat: 3, yoyo: true, stagger: .15, ease: "sine.inOut", immediateRender: false }, 10.8);'''
    write(cid, scene(cid, body, js, bg="#1d3557"))


# ------------------------------------------------------------------ S9
def s9():
    cid, d = "s9-final", TOTAL - 54.48
    body = f'''
    <div class="full">{room("s9r", 0)}</div>
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:1"><rect width="1080" height="1920" fill="#05070f" opacity=".72"/></svg>
    <svg id="s9-eyes" class="full" viewBox="0 0 1080 1920" style="z-index:2">
      <g id="s9-eyes-in"><path d="M160 470 Q200 440 240 470 Q200 490 160 470 Z M270 470 Q310 440 350 470 Q310 490 270 470 Z" fill="#ffef5a" stroke="{INK}" stroke-width="4"/>
        <circle cx="205" cy="468" r="9" fill="{INK}"/><circle cx="315" cy="468" r="9" fill="{INK}"/>
        <path d="M190 560 Q260 590 330 540" fill="none" stroke="#ffef5a" stroke-width="10" stroke-linecap="round"/></g></svg>
    {place(armando("s9a", "phone"), "s9-arm", 190, 560, 760, 3)}
    <div id="s9-t" style="position:absolute;left:0;right:0;top:250px;text-align:center;z-index:6">
      <div id="s9-t-in" style="display:inline-block;font-family:'Archivo Black';font-size:110px;color:{YEL};-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">FALTAM 30 DIAS…</div></div>
    <div id="s9-end" class="clip" data-start="3.25" data-duration="{d - 3.25:.2f}" style="position:absolute;left:0;right:0;top:1240px;text-align:center;z-index:7">
      <div id="s9-end-in" class="tag" style="position:relative;display:inline-block;font-size:44px;background:{MAG};color:#fff">DIA 2 AMANHÃ · COMENTA A OU B 👇</div></div>'''
    js = f'''
      hfAlive(tl, "s9a", {d:.2f});
      tl.set(["#s9a-br-sad"], {{ opacity: 0 }}, 0); tl.set(["#s9a-br-worry", "#s9a-sweat"], {{ opacity: 1 }}, 0);
      tl.fromTo("#s9a-glow", {{ opacity: 0 }}, {{ opacity: .14, duration: .4 }}, .1);
      tl.fromTo("#s9-t-in", {{ scale: 1.4, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: .3, ease: "power3.out" }}, .05);
      tl.fromTo("#s9-eyes-in", {{ opacity: 0 }}, {{ opacity: 1, duration: .5, ease: "power2.out" }}, 1.67);
      tl.fromTo(".s9a-pupil", {{ x: 0 }}, {{ x: -10, duration: .2 }}, 2.0);
      hfBlink(tl, "s9a", [2.9]);
      tl.fromTo("#s9-end-in", {{ scale: 0 }}, {{ scale: 1, duration: .35, ease: "back.out(2)" }}, 3.25);'''
    write(cid, scene(cid, body, js, bg="#05070f"))


# ------------------------------------------------------------------ HUD (mini painel)
def hud():
    cid = "hud"
    items = "".join(f'''<div style="display:flex;align-items:center;gap:6px">
        <div style="font-size:34px">{ic}</div><div style="width:110px;height:22px;background:#1b1035;border:5px solid {INK};border-radius:12px;overflow:hidden;position:relative">
          <div style="width:{v}%;height:100%;background:{c}"></div><div style="position:absolute;left:70%;top:0;width:4px;height:100%;background:#fff"></div></div></div>'''
                    for ic, _, _, v, c in BARS)
    body = f'''
    <div id="hud-box" style="position:absolute;left:70px;top:180px;width:820px;z-index:2">
      <div id="hud-in" style="display:flex;align-items:center;gap:18px;background:rgba(255,255,255,.92);border:7px solid {INK};border-radius:26px;padding:10px 18px;box-shadow:8px 8px 0 {INK}">
        <div style="font-family:'Archivo Black';font-size:30px;line-height:1;color:{INK};text-align:center">⏳ 30<br><span style="font-size:28px">DIAS</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px">{items}</div></div></div>'''
    js = '''
      tl.fromTo("#hud-in", { y: -200 }, { y: 0, duration: .35, ease: "back.out(1.5)" }, 0);
      tl.to("#hud-in", { y: -450, duration: .3, ease: "power2.in" }, 16.6);'''
    write(cid, scene(cid, body, js, "#root { background: transparent; }", bg="transparent"))


# ------------------------------------------------------------------ legendas
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
        spans = "".join(f'<span id="cw{gi}-{wi}" class="cw">{w}</span> ' for wi, w in enumerate(words))
        start = max(0.1, st - 0.05)
        end = (groups[gi + 1][0] - 0.02) if gi + 1 < len(groups) and groups[gi + 1][0] - en < 0.35 else en + 0.25
        rot = (-1.5, 1.2, -0.8, 1.6)[gi % 4]
        html.append(f'''<div id="cg{gi}" class="clip cg" data-start="{start:.2f}" data-duration="{end - start:.2f}">
        <div id="cg{gi}-in" class="cbox" style="--r:{rot}deg">{spans.strip()}</div></div>''')
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
SFX = [  # arquivo, início, volume
    ("mosca.wav", 0.0, .22), ("pop.mp3", 1.38, .4), ("whoosh-short.mp3", 3.15, .35), ("mosca.wav", 3.3, .18),
    ("vibrar.wav", 5.3, .55), ("notification.mp3", 5.75, .45), ("pop.mp3", 8.35, .4),
    ("whoosh.mp3", 9.3, .35), ("boing.wav", 9.6, .55),
    ("pop.mp3", 11.43, .4), ("click-soft.mp3", 12.18, .5), ("pop.mp3", 12.88, .4), ("click-soft.mp3", 13.58, .5),
    ("whoosh-short.mp3", 14.6, .4), ("boing.wav", 15.95, .35),
    ("typing.mp3", 18.0, .5), ("typing.mp3", 19.25, .45), ("whoosh-short.mp3", 20.62, .45), ("ping.mp3", 20.75, .3),
    ("carimbo.wav", 21.33, .7), ("carimbo.wav", 22.5, .5), ("carimbo.wav", 22.75, .5), ("carimbo.wav", 23.0, .5), ("carimbo.wav", 23.25, .55),
    ("pop.mp3", 23.91, .4), ("ping.mp3", 25.5, .3), ("notification.mp3", 26.42, .4), ("glitch-1.mp3", 27.3, .3), ("boing.wav", 29.2, .3),
    ("whoosh.mp3", 30.05, .35), ("pop.mp3", 34.35, .35), ("pop.mp3", 35.15, .35), ("pop.mp3", 35.9, .35), ("pop.mp3", 36.45, .35),
    ("sparkle.mp3", 36.75, .3), ("whoosh-short.mp3", 37.5, .35),
    ("toque.wav", 42.37, .28), ("pop.mp3", 43.65, .35), ("whoosh.mp3", 46.0, .4), ("pop.mp3", 46.8, .35), ("pop.mp3", 47.75, .35),
    ("whoosh.mp3", 49.55, .4), ("pop.mp3", 50.5, .35), ("pop.mp3", 51.4, .35), ("sparkle.mp3", 52.76, .35),
    ("whoosh-short.mp3", 54.48, .3), ("glitch-1.mp3", 56.15, .22), ("pop.mp3", 57.6, .35),
]


def dur(path):
    import subprocess
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = [f'''      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s}" data-duration="{e - s:.2f}"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:1"></div>''' for c, s, e in SCENES]
    hosts.append(f'''      <div id="hud" data-composition-id="hud" data-composition-src="compositions/hud.html" data-start="37.53" data-duration="{TOTAL - 37.53:.2f}"
        data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:10"></div>''')
    hosts.append(f'''      <div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{TOTAL}"
        data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>''')
    audio = [f'      <audio id="voz" class="clip" src="assets/voice/narracao-dia01.wav" data-start="0" data-duration="57.8" data-volume="1" data-track-index="4"></audio>',
             f'      <audio id="trilha" class="clip" src="assets/music/trilha-dia01.wav" data-start="0" data-duration="58.6" data-volume="0.2" data-track-index="5"></audio>']
    lanes = []
    for i, (f, st, vol) in enumerate(SFX):
        d = round(min(dur(os.path.join(ROOT, "assets/sfx", f)), TOTAL - st, 2.5), 2)
        lane = next((k for k, end in enumerate(lanes) if end <= st), None)
        if lane is None:
            lanes.append(0)
            lane = len(lanes) - 1
        lanes[lane] = st + d
        name = f.split(".")[0]
        audio.append(f'      <audio id="sfx-{i:02d}-{name}" class="clip" src="assets/sfx/{f}" data-start="{st}" data-duration="{d}" data-volume="{vol}" data-track-index="{6 + lane}"></audio>')
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
    <!-- O Chat Controla a Vida do Armando — DIA 1 (gerado por tools/build_chat_dia01.py) -->
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
    for fn in (s1, s2, s3, s4, s5, s6, s7, s8, s9, hud, caps):
        fn()
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    meta = {"id": "chat-dia01", "name": "O Chat Controla — DIA 1", "createdAt": "2026-11-05T22:00:00.000Z"}
    with open(os.path.join(ROOT, "meta.json"), "w") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print("ok")
