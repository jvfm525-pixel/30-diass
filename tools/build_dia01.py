"""Gera o episódio DIA 1 em compositions/ e index.html.

Uso: python3 tools/build_dia01.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from armando_lib import (INK, SKIN, armando, bianca, fly, room, scene, stink,  # noqa: E402
                         x_mark)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMP = os.path.join(ROOT, "compositions")

# (id, início, duração)
SCENES = [
    ("s1-gancho", 0.0, 2.2),
    ("s2-convite", 2.2, 3.4),
    ("s3-problema", 5.6, 3.0),
    ("s4-feio", 8.6, 3.4),
    ("s5-pobre", 12.0, 4.0),
    ("s6-casa", 16.0, 4.0),
    ("s7-desafio", 20.0, 4.0),
    ("s8-escolha", 24.0, 6.0),
]
TOTAL = 30.0


def place(svg, left, top, width, cid="", extra=""):
    return f'<div {f"id={chr(34)}{cid}{chr(34)} " if cid else ""}style="position:absolute;left:{left}px;top:{top}px;width:{width}px;{extra}">{svg}</div>'


def flies_svg(prefix, n):
    return ('<svg class="full" viewBox="0 0 1080 1920" overflow="visible" style="z-index:5">'
            + "".join(fly(f"{prefix}{i}") for i in range(n)) + "</svg>")


def stink_svg(prefix, spots):
    return ('<svg class="full" viewBox="0 0 1080 1920" overflow="visible" style="z-index:1">'
            + "".join(stink(f"{prefix}{i}", x, y, s) for i, (x, y, s) in enumerate(spots)) + "</svg>")


def ids(prefix, n):
    return json.dumps([f"{prefix}{i}" for i in range(n)])


def problem_caption(cid, xid, lines, top, start, dur, size=150):
    text = "<br>".join(lines)
    return f'''<div id="{cid}" class="cap clip" data-start="{start}" data-duration="{dur}" style="top:{top}px;z-index:8">
      <div id="{cid}-row" style="display:inline-flex;align-items:center;gap:26px">
        <div id="{cid}-x" style="width:120px;height:120px">{x_mark(xid)}</div>
        <div id="{cid}-t" style="font-size:{size}px;text-align:left">{text}</div></div></div>'''


def write(name, html):
    with open(os.path.join(COMP, name + ".html"), "w") as f:
        f.write(html)


# ---------------------------------------------------------------- S1 gancho
def s1():
    cid, d = "s1-gancho", 2.2
    body = f'''
    <div class="full" style="z-index:0">{room("s1r", dark=.25)}</div>
    {stink_svg("s1st", [(170, 820, 1.2), (240, 640, 1), (880, 800, 1.2), (820, 610, 1), (520, 470, .9)])}
    {place(armando("s1a"), 160, 340, 760, "s1-arm", "z-index:2")}
    {flies_svg("s1f", 4)}
    <div id="s1-dia" class="cap clip" data-start="0" data-duration="{d}" style="top:1010px;font-size:300px;z-index:8">
      <span id="s1-dia-in" class="cap-inner">DIA 1</span></div>
    <div id="s1-sub" class="cap clip" data-start="0" data-duration="{d}" style="top:1250px;font-size:116px;z-index:8">
      <span id="s1-sub-in" class="cap-inner">ELE ERA ASSIM</span></div>'''
    js = f'''
      hfFlies(tl, {ids("s1f", 4)}, {d}, [[300,620,140,90],[790,700,120,110],[540,560,260,60],[420,980,200,80]]);
      hfStink(tl, {ids("s1st", 5)}, {d});
      hfBreath(tl, "s1a", {d});
      hfBlink(tl, "s1a", [1.35]);
      tl.fromTo("#s1-arm", {{ scale: 1.08 }}, {{ scale: 1, duration: {d}, ease: "power1.out", transformOrigin: "50% 40%" }}, 0);
      tl.fromTo("#s1-dia-in", {{ scale: 1.25, rotation: -4 }}, {{ scale: 1, rotation: -2, duration: 0.35, ease: "back.out(3)" }}, 0);
      tl.fromTo("#s1-sub-in", {{ scale: 1.15, y: 10 }}, {{ scale: 1, y: 0, duration: 0.3, ease: "back.out(2.5)" }}, 0.05);
      tl.fromTo("#s1a-sweat", {{ y: 0, opacity: 1 }}, {{ y: 60, opacity: 0, duration: 0.9, ease: "power2.in" }}, 0.6);'''
    write(cid, scene(cid, body, "", js))


# ---------------------------------------------------------------- S2 convite
def s2():
    cid, d = "s2-convite", 3.4
    phone = f'''
    <div id="s2-phone" class="clip" data-start="0" data-duration="2.0" style="position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:2">
      <div class="full" style="background:#2e3d49"></div>
      <div id="s2-ph" style="position:absolute;left:270px;top:360px;width:540px;height:980px">
        <div style="position:absolute;inset:0;border-radius:70px;background:#1d1f24;border:10px solid {INK}"></div>
        <div style="position:absolute;left:26px;top:26px;right:26px;bottom:26px;border-radius:50px;background:linear-gradient(#384a7a,#7b4b7d)"></div>
        <svg style="position:absolute;left:26px;top:26px" width="488" height="928"><path d="M330 0 L280 160 L360 260 L300 420" stroke="#fff" stroke-width="4" fill="none" opacity=".6"/></svg>
        <div style="position:absolute;top:150px;left:0;right:0;text-align:center;color:#fff;font-family:Inter;font-weight:700;font-size:120px">21:47</div>
        <div id="s2-notif" class="clip" data-start="0.15" data-duration="1.85" style="position:absolute;left:44px;right:44px;top:330px">
          <div id="s2-notif-in" style="background:rgba(255,255,255,.95);border-radius:34px;padding:26px 28px;font-family:Inter;color:#111;border:5px solid {INK}">
            <div style="display:flex;align-items:center;gap:16px;font-weight:900;font-size:44px">
              <div style="width:56px;height:56px;border-radius:50%;background:#ff7eb6;border:4px solid {INK}"></div>Bianca</div>
            <div style="font-size:46px;margin-top:12px;line-height:1.2">então tá marcado! daqui 30 dias :)</div></div></div>
      </div>
      <svg id="s2-hand" style="position:absolute;left:180px;top:980px" width="720" height="700" viewBox="0 0 720 700">
        <path d="M60 700 C40 520 60 330 150 260 C200 230 250 250 260 300 L270 420 L460 420 L470 290 C480 240 540 230 570 280 C650 380 660 560 640 700 Z" fill="{SKIN}" stroke="{INK}" stroke-width="10"/>
        <path d="M150 300 q-40 40 -20 110 M560 300 q40 40 20 110" stroke="{INK}" stroke-width="6" fill="none" opacity=".5"/></svg>
    </div>'''
    rest = f'''
    <div class="full" style="z-index:0">{room("s2r", dark=.15)}</div>
    {place(armando("s2a"), 20, 600, 620, "s2-arm", "z-index:1")}
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:1">
      <circle id="s2-b1" cx="560" cy="760" r="18" fill="#fff" stroke="{INK}" stroke-width="6"/>
      <circle id="s2-b2" cx="600" cy="690" r="28" fill="#fff" stroke="{INK}" stroke-width="6"/></svg>
    <div id="s2-bubble" style="position:absolute;left:560px;top:300px;width:400px;height:400px;z-index:1">
      <div style="position:absolute;inset:0;border-radius:50%;background:#fff;border:8px solid {INK}"></div>
      <div style="position:absolute;left:55px;top:40px;width:290px">{bianca("s2b")}</div></div>
    {phone}
    <div id="s2-cap" class="cap clip" data-start="0.35" data-duration="3.05" style="top:1080px;font-size:118px;z-index:8">
      <span id="s2-cap-in" class="cap-inner">ELA ACEITOU<br>SAIR COM ELE</span></div>'''
    js = '''
      hfBreath(tl, "s2a", 3.4);
      tl.fromTo("#s2-ph", { y: 60, rotation: -3 }, { y: 0, rotation: 0, duration: 0.3, ease: "power3.out" }, 0);
      tl.fromTo("#s2-hand", { y: 60 }, { y: 0, duration: 0.3, ease: "power3.out" }, 0);
      tl.fromTo("#s2-ph", { x: 0 }, { x: 10, duration: 0.04, repeat: 5, yoyo: true, ease: "none" }, 0.2);
      tl.fromTo("#s2-notif-in", { y: -260, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.6)" }, 0.2);
      tl.fromTo("#s2-cap-in", { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2.5)" }, 0.35);
      // parte 2: Armando sonha com a Bianca
      tl.set(["#s2a-eyes", "#s2a-m-neutral", "#s2a-brow-tired"], { opacity: 0 }, 2.0);
      tl.set(["#s2a-eyes-happy", "#s2a-m-smile"], { opacity: 1 }, 2.0);
      tl.fromTo("#s2-arm", { scale: 1.1 }, { scale: 1, duration: 0.5, ease: "power3.out", transformOrigin: "50% 60%" }, 2.0);
      tl.fromTo(["#s2-b1", "#s2-b2"], { scale: 0 }, { scale: 1, duration: 0.2, stagger: 0.1, ease: "back.out(3)", transformOrigin: "50% 50%" }, 2.1);
      tl.fromTo("#s2-bubble", { scale: 0, rotation: -10 }, { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(1.8)", transformOrigin: "10% 90%" }, 2.3);
      tl.fromTo("#s2b-hearts", { scale: 0.6 }, { scale: 1.25, duration: 0.18, repeat: 5, yoyo: true, ease: "sine.inOut", transformOrigin: "50% 50%" }, 2.6);'''
    write(cid, scene(cid, rest, "", js))


# ---------------------------------------------------------------- S3 problema
def s3():
    cid, d = "s3-problema", 3.0
    rat = f'''<svg id="s3-rat" style="position:absolute;left:0;top:1560px;z-index:3" width="220" height="110" viewBox="0 0 220 110">
      <path d="M200 70 q30 10 20 30" stroke="#8a7c74" stroke-width="7" fill="none"/>
      <ellipse cx="120" cy="66" rx="80" ry="40" fill="#8a7c74" stroke="{INK}" stroke-width="6"/>
      <circle cx="50" cy="44" r="18" fill="#b8a9a0" stroke="{INK}" stroke-width="5"/>
      <circle cx="34" cy="64" r="5" fill="{INK}"/><circle cx="38" cy="78" r="3" fill="#ff8fa3"/></svg>'''
    body = f'''
    <div id="s3-world" class="full" style="z-index:0">
      {room("s3r")}
      {place(armando("s3a"), 280, 900, 520, "s3-arm", "z-index:2")}
      {stink_svg("s3st", [(330, 1100, .7), (760, 1080, .7)])}
      {rat}
    </div>
    <div id="s3-cap" class="cap clip" data-start="1.35" data-duration="1.65" style="top:620px;font-size:130px;z-index:8">
      <span id="s3-cap-in" class="cap-inner">SÓ TEM UM<br>PROBLEMA…</span></div>'''
    js = '''
      hfBreath(tl, "s3a", 3);
      hfStink(tl, ["s3st0", "s3st1"], 3);
      tl.set(["#s3a-eyes", "#s3a-m-neutral"], { opacity: 0 }, 0);
      tl.set(["#s3a-eyes-happy", "#s3a-m-smile"], { opacity: 1 }, 0);
      tl.fromTo("#s3-world", { scale: 2.3 }, { scale: 1, duration: 1.1, ease: "power3.inOut", transformOrigin: "540px 1190px" }, 0.1);
      hfMood(tl, "s3a", 1.25, ["eyes", "m-frown", "brow-worried"], ["eyes-happy", "m-smile", "brow-tired"]);
      tl.fromTo("#s3a-sweat", { y: -20, opacity: 0 }, { y: 50, opacity: 1, duration: 0.8, ease: "power1.in" }, 1.4);
      tl.fromTo("#s3-rat", { x: -240 }, { x: 1120, duration: 1.4, ease: "none" }, 1.3);
      tl.fromTo("#s3-cap-in", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power3.out" }, 1.35);
      tl.fromTo("#s3-cap-in", { rotation: 0 }, { rotation: -2, duration: 0.6, ease: "sine.inOut" }, 1.6);'''
    write(cid, scene(cid, body, "", js))


# ---------------------------------------------------------------- S4 feio
def s4():
    cid, d = "s4-feio", 3.4
    tiles = "".join(f'<rect x="{x}" y="{y}" width="132" height="132" fill="#7aa39a" stroke="#5f857d" stroke-width="6"/>'
                    for x in range(-20, 1080, 135) for y in range(-20, 1920, 135))
    cracks = ["M540 700 L470 560 L500 470 L430 380", "M540 700 L650 620 L700 500 L780 470",
              "M540 700 L620 820 L600 960 L690 1100", "M540 700 L420 760 L330 740 L240 840",
              "M540 700 L520 860 L450 950", "M470 560 L380 560", "M650 620 L760 690"]
    crack_svg = "".join(f'<path class="s4-crack" d="{c}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1.2" stroke-dashoffset="1.1"/>' for c in cracks)
    body = f'''
    <svg class="full" data-layout-ignore viewBox="0 0 1080 1920" style="z-index:0">{tiles}<rect width="1080" height="1920" fill="#000" opacity=".25"/></svg>
    <div id="s4-mirror" style="position:absolute;left:150px;top:330px;width:780px;height:900px;z-index:1">
      <div style="position:absolute;inset:-34px;border-radius:50%;background:#6a4a30;border:10px solid {INK}"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:#bfd6dc;overflow:hidden;border:8px solid {INK}">
        <div id="s4-refl" style="position:absolute;left:-20px;top:60px;width:820px">{armando("s4a")}</div>
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.35),rgba(255,255,255,0) 40%)"></div>
        <svg style="position:absolute;left:-150px;top:-330px" width="1080" height="1920" viewBox="0 0 1080 1920">{crack_svg}</svg>
      </div></div>
    {problem_caption("s4-cap", "s4x", ["FEIO"], 1150, 1.5, 1.9, 170)}'''
    js = '''
      hfBreath(tl, "s4a", 3.4);
      hfBlink(tl, "s4a", [0.5]);
      tl.fromTo("#s4-refl", { x: -60 }, { x: 0, duration: 0.6, ease: "power3.out" }, 0);
      hfMood(tl, "s4a", 1.15, ["m-shock", "brow-worried"], ["m-neutral", "brow-tired"]);
      tl.fromTo(["#s4a-lid-l", "#s4a-lid-r"], { scaleY: 1 }, { scaleY: 0.2, duration: 0.1, transformOrigin: "50% 0%" }, 1.2);
      tl.fromTo(".s4-crack", { strokeDashoffset: 1.1 }, { strokeDashoffset: 0, duration: 0.18, stagger: 0.03, ease: "power2.out" }, 1.2);
      tl.fromTo("#s4-mirror", { x: 0 }, { x: 14, duration: 0.04, repeat: 7, yoyo: true, ease: "none" }, 1.2);
      tl.fromTo("#s4-cap-x", { scale: 2.6, rotation: -30, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.25, ease: "back.out(2)" }, 1.5);
      tl.fromTo("#s4-cap-t", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: "power3.out" }, 1.62);'''
    write(cid, scene(cid, body, "", js))


# ---------------------------------------------------------------- S5 pobre
def s5():
    cid, d = "s5-pobre", 4.0
    grain = "".join(f'<path d="M0 {y} C300 {y-20} 700 {y+25} 1080 {y}" stroke="#5a3a26" stroke-width="5" fill="none"/>' for y in range(60, 1920, 120))
    moth = f'''<svg id="s5-moth" style="position:absolute;left:470px;top:820px;z-index:4" width="140" height="120" viewBox="-70 -60 140 120" overflow="visible">
      <g class="s5-wing"><path d="M0 0 C-40 -60 -80 -30 -60 10 C-50 30 -20 20 0 0 Z" fill="#b9ad98" stroke="{INK}" stroke-width="4"/>
      <path d="M0 0 C40 -60 80 -30 60 10 C50 30 20 20 0 0 Z" fill="#b9ad98" stroke="{INK}" stroke-width="4"/></g>
      <ellipse cx="0" cy="4" rx="9" ry="22" fill="#6e6151" stroke="{INK}" stroke-width="4"/>
      <path d="M-3 -16 q-10 -14 -16 -14 M3 -16 q10 -14 16 -14" stroke="{INK}" stroke-width="3" fill="none"/></svg>'''
    dust = "".join(f'<circle class="s5-dust" cx="{540 + dx}" cy="900" r="{r}" fill="#d8cbb4"/>' for dx, r in [(-40, 7), (-10, 5), (25, 8), (50, 4), (0, 6), (-60, 4)])
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:0"><rect width="1080" height="1920" fill="#6d4a33"/>{grain}
      <rect width="1080" height="1920" fill="#000" opacity=".2"/></svg>
    <div id="s5-wallet" style="position:absolute;left:190px;top:760px;width:700px;height:400px;z-index:2">
      <div style="position:absolute;inset:0;background:#7a4526;border:10px solid {INK};border-radius:30px"></div>
      <div style="position:absolute;left:40px;top:40px;width:270px;height:300px;border:6px dashed #c59a6a;border-radius:16px"></div>
      <div style="position:absolute;left:380px;top:40px;width:270px;height:300px;border:6px dashed #c59a6a;border-radius:16px"></div>
      <div style="position:absolute;left:345px;top:0;width:10px;height:100%;background:{INK}"></div>
      <div id="s5-flap" style="position:absolute;left:350px;top:0;width:350px;height:400px">
        <div style="position:absolute;inset:0;background:#8d5430;border:10px solid {INK};border-radius:0 30px 30px 0"></div>
        <div style="position:absolute;left:30px;top:150px;width:80px;height:80px;border-radius:50%;background:#c59a6a;border:6px solid {INK}"></div></div>
    </div>
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:3">{dust}</svg>
    {moth}
    <div id="s5-bank" class="clip" data-start="1.9" data-duration="2.1" style="position:absolute;left:250px;top:420px;width:580px;height:620px;z-index:5">
      <div id="s5-bank-in" style="position:absolute;inset:0;background:#f6f7fb;border:10px solid {INK};border-radius:46px;font-family:Inter;text-align:center">
        <div style="margin-top:50px;font-size:40px;font-weight:700;color:#556">SALDO DISPONÍVEL</div>
        <div id="s5-saldo" style="margin-top:40px;font-size:150px;font-weight:900;color:#e0213a;letter-spacing:-.03em">R$ 3,50</div>
        <div style="margin-top:40px;font-size:34px;color:#889">fatura vencida: R$ 1.287,90</div></div></div>
    {problem_caption("s5-cap", "s5x", ["POBRE"], 1180, 2.3, 1.7, 170)}'''
    js = '''
      tl.fromTo("#s5-wallet", { y: 40, rotation: -2 }, { y: 0, rotation: 0, duration: 0.35, ease: "power3.out" }, 0);
      tl.fromTo("#s5-flap", { scaleX: 1 }, { scaleX: -1, duration: 0.45, ease: "power2.inOut", transformOrigin: "0% 50%" }, 0.45);
      tl.fromTo(".s5-dust", { y: 0 }, { y: -260, x: (i) => (i - 2.5) * 40, duration: 1.2, stagger: 0.04, ease: "power2.out" }, 0.8);
      tl.fromTo(".s5-dust", { opacity: 0 }, { opacity: 0.9, duration: 0.2, ease: "none" }, 0.8);
      tl.to(".s5-dust", { opacity: 0, duration: 0.3 }, 1.8);
      tl.fromTo("#s5-moth", { scale: 0.3, opacity: 0 }, { scale: 2, opacity: 1, duration: 0.25, ease: "back.out(2)" }, 0.85);
      const m = { t: 0 };
      tl.to(m, { t: 3.1, duration: 3.1, ease: "none", onUpdate: () => {
        const t = m.t;
        gsap.set("#s5-moth", { x: 160 * Math.sin(t * 2.2) + 60 * t, y: -230 * t - 30 * Math.sin(t * 6), rotation: 18 * Math.sin(t * 5) });
        gsap.set(".s5-wing", { scaleY: (Math.floor(t * 18) % 2) ? 0.3 : 1, transformOrigin: "50% 50%" });
      } }, 0.9);
      tl.fromTo("#s5-bank-in", { y: 900, rotation: 6 }, { y: 0, rotation: -2, duration: 0.4, ease: "back.out(1.4)" }, 1.9);
      tl.fromTo("#s5-saldo", { scale: 1 }, { scale: 1.15, duration: 0.12, repeat: 3, yoyo: true, ease: "sine.inOut" }, 2.35);
      tl.fromTo("#s5-cap-x", { scale: 2.6, rotation: 30, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.25, ease: "back.out(2)" }, 2.3);
      tl.fromTo("#s5-cap-t", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power3.out" }, 2.42);'''
    write(cid, scene(cid, body, "", js))


# ---------------------------------------------------------------- S6 casa
def s6():
    cid, d = "s6-casa", 4.0
    tiles = "".join(f'<rect x="{x}" y="{y}" width="96" height="96" fill="#d6d0b4" stroke="#b5ae90" stroke-width="5"/>'
                    for x in range(0, 1080, 100) for y in range(0, 1120, 100))
    stains = '<path d="M120 300 c40 -10 60 40 20 60 c-40 0 -50 -50 -20 -60 Z M860 520 c50 0 60 60 10 70 c-40 -10 -40 -60 -10 -70 Z" fill="#8b7a3a" opacity=".45"/>'
    plates = []
    y = 1040
    for i in range(11):
        w = 300 - (i % 3) * 30
        x = 540 - w / 2 + ((i * 37) % 5 - 2) * 9
        col = ["#f2efe4", "#e3e8ee", "#f2e2c4"][i % 3]
        plates.append(f'<g class="s6-plate"><rect x="{x:.0f}" y="{y}" width="{w}" height="34" rx="16" fill="{col}" stroke="{INK}" stroke-width="6"/>'
                      f'<ellipse cx="{x + w/2 + 20:.0f}" cy="{y+10}" rx="30" ry="6" fill="#b5653a" opacity=".7"/></g>')
        y -= 40
    plates.append(f'<g class="s6-plate"><rect x="470" y="{y-30}" width="120" height="70" rx="12" fill="#c43c3c" stroke="{INK}" stroke-width="6"/>'
                  f'<path d="M590 {y-10} q40 0 40 26 q0 24 -40 24" fill="none" stroke="{INK}" stroke-width="8"/></g>')
    roach = f'''<svg id="s6-roach" style="position:absolute;left:0;top:1040px;z-index:4" width="150" height="80" viewBox="0 0 150 80">
      <g stroke="{INK}" stroke-width="5"><path d="M40 30 l-20 -20 M75 28 l0 -24 M105 30 l20 -20 M40 50 l-20 20 M75 52 l0 24 M105 50 l20 20"/></g>
      <ellipse cx="75" cy="40" rx="55" ry="24" fill="#6b3a1e" stroke="{INK}" stroke-width="5"/>
      <path d="M130 34 q20 -24 20 -30 M130 46 q20 24 20 30" stroke="{INK}" stroke-width="3" fill="none"/></svg>'''
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" style="z-index:0">
      <rect width="1080" height="1920" fill="#5e4535"/>{tiles}{stains}
      <rect x="0" y="1080" width="1080" height="40" fill="#8a6a4a" stroke="{INK}" stroke-width="8"/>
      <rect x="0" y="1120" width="1080" height="300" fill="#6f5238" stroke="{INK}" stroke-width="8"/>
      <rect x="60" y="1150" width="440" height="240" fill="#7d5d41" stroke="{INK}" stroke-width="6"/>
      <rect x="580" y="1150" width="440" height="240" fill="#7d5d41" stroke="{INK}" stroke-width="6"/>
      <rect x="350" y="1060" width="380" height="40" rx="10" fill="#9aa5ad" stroke="{INK}" stroke-width="7"/>
      <path d="M690 1060 L690 960 Q690 930 650 930 L620 930" fill="none" stroke="#9aa5ad" stroke-width="22"/>
      <path d="M690 1060 L690 960 Q690 930 650 930 L620 930" fill="none" stroke="{INK}" stroke-width="5"/>
    </svg>
    <svg id="s6-tower" class="full" viewBox="0 0 1080 1920" overflow="visible" style="z-index:2">{"".join(plates)}</svg>
    {stink_svg("s6st", [(300, 900, 1), (790, 860, 1), (540, 560, .8)])}
    {flies_svg("s6f", 3)}
    {roach}
    {problem_caption("s6-cap", "s6x", ["CASA UM", "CHIQUEIRO"], 1130, 2.25, 1.75, 130)}'''
    js = f'''
      hfFlies(tl, {ids("s6f", 3)}, 4, [[420,700,120,80],[660,620,100,90],[540,840,200,60]]);
      hfStink(tl, {ids("s6st", 3)}, 4);
      tl.fromTo("#s6-roach", {{ x: -180 }}, {{ x: 1100, duration: 1.5, ease: "none" }}, 0.1);
      tl.fromTo("#s6-tower", {{ rotation: 0 }}, {{ rotation: 3, duration: 0.15, repeat: 5, yoyo: true, ease: "sine.inOut", transformOrigin: "540px 1060px" }}, 1.1);
      tl.fromTo(".s6-plate", {{ x: 0, y: 0, rotation: 0 }}, {{
        x: (i) => ((i * 53) % 7 - 3) * 110, y: (i) => 420 + i * 40 - (i % 3) * 30,
        rotation: (i) => ((i * 71) % 9 - 4) * 30, duration: 0.55, stagger: {{ each: 0.04, from: "end" }}, ease: "power2.in",
        transformOrigin: "50% 50%" }}, 1.95);
      tl.fromTo("#s6-cap-x", {{ scale: 2.6, rotation: -30, opacity: 0 }}, {{ scale: 1, rotation: 0, opacity: 1, duration: 0.25, ease: "back.out(2)" }}, 2.25);
      tl.fromTo("#s6-cap-t", {{ scale: 0.6, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.25, ease: "back.out(2)", transformOrigin: "0% 50%" }}, 2.37);'''
    write(cid, scene(cid, body, "", js))


# ---------------------------------------------------------------- S7 desafio
def s7():
    cid, d = "s7-desafio", 4.0
    rays = "".join(f'<path d="M540 900 L{540 + 1400 * __import__("math").cos(a / 18 * 6.2832):.0f} {900 + 1400 * __import__("math").sin(a / 18 * 6.2832):.0f} L{540 + 1400 * __import__("math").cos((a + .5) / 18 * 6.2832):.0f} {900 + 1400 * __import__("math").sin((a + .5) / 18 * 6.2832):.0f} Z" fill="#ffd23f" opacity=".22"/>' for a in range(18))
    fist = f'''<svg id="s7-fist" style="position:absolute;left:640px;top:820px;z-index:3" width="300" height="520" viewBox="0 0 300 520">
      <path d="M90 520 L110 260 L210 260 L230 520 Z" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
      <rect x="50" y="90" width="210" height="190" rx="60" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
      <path d="M95 100 L95 170 M145 92 L145 170 M195 96 L195 170" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>
      <path d="M60 180 Q110 230 180 190" fill="none" stroke="{INK}" stroke-width="8"/></svg>'''
    body = f'''
    <div class="full" style="z-index:0">{room("s7r", dark=.45)}</div>
    <svg id="s7-rays" class="full" viewBox="0 0 1080 1920" style="z-index:0">{rays}</svg>
    <div id="s7-cam" class="full" style="z-index:1">
      {place(armando("s7a"), 160, 340, 760, "s7-arm", "z-index:2")}
      {fist}
    </div>
    <div id="s7-cap" class="cap clip" data-start="0.6" data-duration="3.4" style="top:1060px;font-size:126px;z-index:8">
      <span id="s7-cap-in" class="cap-inner">30 DIAS PRA<br><span style="color:#ffd23f">VIRAR O JOGO</span></span></div>'''
    js = '''
      hfBreath(tl, "s7a", 4);
      hfBlink(tl, "s7a", [2.6]);
      tl.fromTo("#s7-rays", { rotation: 0, opacity: 0 }, { rotation: 20, opacity: 1, duration: 4, ease: "none", transformOrigin: "540px 900px" }, 0);
      tl.set(["#s7a-brow-tired", "#s7a-m-neutral"], { opacity: 0 }, 0);
      tl.set(["#s7a-brow-worried", "#s7a-m-frown"], { opacity: 1 }, 0);
      hfMood(tl, "s7a", 0.3, ["brow-angry", "m-grit"], ["brow-worried", "m-frown"]);
      tl.fromTo(["#s7a-lid-l", "#s7a-lid-r"], { scaleY: 1 }, { scaleY: 1.35, duration: 0.15, transformOrigin: "50% 0%" }, 0.38);
      tl.fromTo("#s7-fist", { y: 600, rotation: 12 }, { y: 0, rotation: -6, duration: 0.35, ease: "back.out(1.8)" }, 0.45);
      tl.fromTo("#s7-cam", { scale: 1 }, { scale: 1.1, duration: 0.25, ease: "power3.out", transformOrigin: "540px 800px" }, 0.6);
      tl.fromTo("#s7-cam", { x: 0 }, { x: 12, duration: 0.04, repeat: 5, yoyo: true, ease: "none" }, 0.62);
      tl.fromTo("#s7-cap-in", { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: "power4.out" }, 0.6);'''
    write(cid, scene(cid, body, "", js))


# ---------------------------------------------------------------- S8 escolha
def s8():
    cid, d = "s8-escolha", 6.0
    shower = f'''<svg viewBox="0 0 200 200" width="190" height="190"><path d="M40 40 L40 20 L130 20 L130 50" fill="none" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>
      <path d="M90 50 L170 50 L150 90 L110 90 Z" fill="#cfd8dc" stroke="{INK}" stroke-width="9" stroke-linejoin="round"/>
      <g fill="#8fd3ff" stroke="{INK}" stroke-width="4">{"".join(f'<path class="s8-drop" d="M{x} {y} c-8 14 -8 20 0 22 c8 -2 8 -8 0 -22 Z"/>' for x, y in [(110,110),(130,130),(150,110),(120,160),(145,165),(165,140)])}</g></svg>'''
    broom = f'''<svg viewBox="0 0 200 200" width="190" height="190"><g id="s8-broom">
      <line x1="150" y1="10" x2="95" y2="120" stroke="#8d5430" stroke-width="16" stroke-linecap="round"/>
      <line x1="150" y1="10" x2="95" y2="120" stroke="{INK}" stroke-width="4" stroke-linecap="round" opacity=".3"/>
      <path d="M70 110 L125 135 L105 190 L30 160 Z" fill="#ffd23f" stroke="{INK}" stroke-width="9" stroke-linejoin="round"/>
      <path d="M55 165 L75 125 M72 172 L92 132 M90 180 L108 138" stroke="{INK}" stroke-width="5"/></g>
      <g fill="#c9b49a">{"".join(f'<circle class="s8-dust" cx="{x}" cy="{y}" r="7"/>' for x, y in [(20,185),(40,190),(14,170)])}</g></svg>'''

    def card(k, letter, color, icon, label):
        return f'''<div id="s8-card-{k}" class="clip" data-start="{0.3 if k == 'a' else 0.55}" data-duration="{5.7 if k == 'a' else 5.45}"
          style="position:absolute;top:705px;left:{110 if k == 'a' else 550}px;width:380px;height:400px;z-index:3">
          <div id="s8-card-{k}-in" style="position:absolute;inset:0;background:{color};border:10px solid {INK};border-radius:40px;box-shadow:0 14px 0 rgba(0,0,0,.45)">
            <div style="position:absolute;left:-26px;top:-36px;width:110px;height:110px;border-radius:50%;background:#fff;border:9px solid {INK};
              font-family:'League Gothic';font-size:96px;line-height:96px;text-align:center;color:{INK}">{letter}</div>
            <div style="position:absolute;left:0;right:0;top:40px;display:flex;justify-content:center">{icon}</div>
            <div class="cap" style="top:256px;font-size:72px;-webkit-text-stroke:10px #111">{label}</div></div></div>'''
    body = f'''
    <div class="full" style="z-index:0">{room("s8r", dark=.62)}</div>
    <div id="s8-t1" class="cap clip" data-start="0" data-duration="6" style="top:440px;font-size:150px;z-index:4">
      <span id="s8-t1-in" class="cap-inner" style="color:#ffd23f">VOCÊ DECIDE</span></div>
    <div id="s8-t2" class="cap clip" data-start="0.15" data-duration="5.85" style="top:585px;font-size:80px;z-index:4">
      <span id="s8-t2-in" class="cap-inner">O QUE ELE FAZ NO DIA 2?</span></div>
    {card("a", "A", "#3aa0ff", shower, "TOMAR BANHO")}
    {card("b", "B", "#ff9f1c", broom, "ARRUMAR A CASA")}
    {place(armando("s8a"), 405, 1040, 270, "s8-arm", "z-index:2")}
    <div id="s8-t3" class="cap clip" data-start="2.3" data-duration="3.7" style="top:1225px;font-size:120px;z-index:5">
      <span id="s8-t3-in" class="cap-inner">COMENTA <span style="color:#3aa0ff">A</span> OU <span style="color:#ff9f1c">B</span></span></div>'''
    js = '''
      hfBreath(tl, "s8a", 6);
      hfBlink(tl, "s8a", [1.3, 4.2]);
      tl.fromTo("#s8-t1-in", { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(2.5)" }, 0);
      tl.fromTo("#s8-t2-in", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power3.out" }, 0.15);
      tl.fromTo("#s8-card-a-in", { x: -600, rotation: -12 }, { x: 0, rotation: -3, duration: 0.4, ease: "back.out(1.5)" }, 0.3);
      tl.fromTo("#s8-card-b-in", { x: 600, rotation: 12 }, { x: 0, rotation: 3, duration: 0.4, ease: "back.out(1.5)" }, 0.55);
      tl.fromTo("#s8-arm", { y: 260 }, { y: 0, duration: 0.4, ease: "back.out(1.6)" }, 0.75);
      tl.fromTo(".s8a-pupil", { x: 0 }, { x: -11, duration: 0.15, ease: "power2.out" }, 1.0);
      tl.fromTo("#s8-card-a-in", { scale: 1 }, { scale: 1.07, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" }, 1.0);
      tl.to(".s8a-pupil", { x: 11, duration: 0.15, ease: "power2.out" }, 1.6);
      tl.fromTo("#s8-card-b-in", { scale: 1 }, { scale: 1.07, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" }, 1.6);
      tl.to(".s8a-pupil", { x: 0, duration: 0.15, ease: "power2.out" }, 2.2);
      hfMood(tl, "s8a", 2.2, ["brow-worried", "m-frown"], ["brow-tired", "m-neutral"]);
      tl.fromTo(".s8-drop", { y: 0 }, { y: 18, duration: 0.3, repeat: 17, ease: "none" }, 0.3);
      tl.fromTo("#s8-broom", { rotation: -8 }, { rotation: 8, duration: 0.3, repeat: 17, yoyo: true, ease: "sine.inOut", transformOrigin: "75% 10%" }, 0.55);
      tl.fromTo("#s8-t3-in", { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2.5)" }, 2.3);
      tl.fromTo("#s8-t3-in", { scale: 1 }, { scale: 1.08, duration: 0.25, repeat: 5, yoyo: true, ease: "sine.inOut", immediateRender: false }, 3.0);'''
    write(cid, scene(cid, body, "", js))


# ---------------------------------------------------------------- HUD
def hud():
    cid = "hud"
    body = '''
    <div id="hud-days" style="position:absolute;left:70px;top:185px;text-align:center;font-family:'League Gothic';z-index:2">
      <div style="font-size:44px;color:#fff;letter-spacing:.06em;-webkit-text-stroke:8px #111;paint-order:stroke fill">DIAS RESTANTES</div>
      <div id="hud-days-n" style="font-size:150px;line-height:.9;color:#ffd23f;-webkit-text-stroke:12px #111;paint-order:stroke fill">30</div></div>
    <div id="hud-glow" style="position:absolute;right:150px;top:185px;text-align:center;font-family:'League Gothic';z-index:2">
      <div style="font-size:44px;color:#fff;letter-spacing:.06em;-webkit-text-stroke:8px #111;paint-order:stroke fill">GLOW-UP</div>
      <div id="hud-glow-n" style="font-size:150px;line-height:.9;color:#5bd14b;-webkit-text-stroke:12px #111;paint-order:stroke fill">0%</div>
      <div style="width:220px;height:26px;margin:8px auto 0;border:6px solid #111;border-radius:14px;background:#2a2a2a;overflow:hidden">
        <div style="width:4%;height:100%;background:#5bd14b"></div></div></div>'''
    js = '''
      tl.fromTo("#hud-days-n", { scale: 1 }, { scale: 1.3, duration: 0.15, yoyo: true, repeat: 3, ease: "sine.inOut" }, 20.6);
      tl.fromTo("#hud-glow", { x: 0 }, { x: 10, duration: 0.05, yoyo: true, repeat: 9, ease: "none" }, 20.6);
      tl.fromTo("#hud-glow-n", { rotation: 0 }, { rotation: -6, duration: 0.6, ease: "elastic.out(1, 0.3)" }, 8.7);'''
    html = scene(cid, body, "#root { background: transparent; }", js)
    write(cid, html)


# ---------------------------------------------------------------- áudio + raiz
SFX = [  # (arquivo, início, volume)
    ("impact-bass-1", 0.0, 0.55), ("notification", 2.4, 0.6), ("pop", 2.55, 0.5),
    ("whoosh-short", 4.2, 0.45), ("ping", 4.8, 0.35), ("whoosh-cinematic", 5.7, 0.5),
    ("error", 6.9, 0.45), ("whoosh", 8.6, 0.4), ("glitch-1", 9.8, 0.55), ("impact-bass-2", 10.1, 0.45),
    ("whoosh-short", 12.0, 0.4), ("pop", 12.85, 0.45), ("error", 14.25, 0.5),
    ("whoosh", 16.0, 0.4), ("impact-bass-2", 17.95, 0.6), ("pop", 18.3, 0.4),
    ("whoosh-cinematic", 20.1, 0.45), ("impact-bass-1", 20.45, 0.6),
    ("whoosh", 24.0, 0.45), ("pop", 24.3, 0.5), ("pop", 24.55, 0.5), ("click-soft", 25.0, 0.6),
    ("click-soft", 25.6, 0.6), ("ping", 26.3, 0.45),
    ("click-soft", 27.0, 0.5), ("click-soft", 28.0, 0.5), ("click-soft", 29.0, 0.5),
]


def dur(f):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                          os.path.join(ROOT, "assets/sfx", f + ".mp3")], capture_output=True, text=True).stdout
    return float(out.strip())


def index():
    hosts = []
    for i, (cid, st, du) in enumerate(SCENES):
        hosts.append(f'''      <div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html"
        data-start="{st}" data-duration="{du}" data-track-index="1" data-track-kind="graphics"
        data-width="1080" data-height="1920" style="z-index:1"></div>''')
    hosts.append(f'''      <div id="hud" data-composition-id="hud" data-composition-src="compositions/hud.html"
        data-start="0" data-duration="{TOTAL}" data-track-index="2" data-track-kind="graphics"
        data-width="1080" data-height="1920" style="z-index:10"></div>''')
    audio = []
    lanes = []  # fim do último som em cada trilha
    for i, (f, st, vol) in enumerate(SFX):
        d = round(min(dur(f), TOTAL - st, 2.5), 2)
        lane = next((k for k, end in enumerate(lanes) if end <= st), None)
        if lane is None:
            lanes.append(0)
            lane = len(lanes) - 1
        lanes[lane] = st + d
        audio.append(f'      <audio id="sfx-{i:02d}-{f}" class="clip" src="assets/sfx/{f}.mp3" data-start="{st}" '
                     f'data-duration="{d}" data-volume="{vol}" data-track-index="{3 + lane}"></audio>')
    return f'''<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <!-- GSAP 3.15.0 local (render sem depender de rede) -->
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #4e6576; }}
      #root {{ width: 100%; height: 100%; position: relative; }}
    </style>
  </head>
  <body>
    <!-- 30 Dias do Armando — Episódio DIA 1 (gerado por tools/build_dia01.py) -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
{chr(10).join(hosts)}
{chr(10).join(audio)}
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
    for fn in (s1, s2, s3, s4, s5, s6, s7, s8, hud):
        fn()
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(index())
    print("ok: index.html +", len(SCENES) + 1, "cenas")
