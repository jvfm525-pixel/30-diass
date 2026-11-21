"""Cenários detalhados do episódio "E se você pudesse ler mentes" (um lugar novo por cena).

Cada função devolve (html, js): o SVG de fundo em tela cheia (z-index 0) e
as animações discretas do cenário (nuvens, vapor, luzes), todas seek-safe.
"""
import random

from hq_lib import CYAN, INK, MAG, RED, YEL, dots

W, H = 1080, 1920


def _svg(p, inner, defs="", z=0):
    return (f'<svg class="full" viewBox="0 0 {W} {H}" data-layout-ignore style="z-index:{z}">'
            f'<defs>{dots(p, INK, 12, 2.6, .18)}{defs}</defs>{inner}</svg>')


def _rep(d, period):
    return max(1, int(d / period) + 1)


def _books(x, y, n, seed, h=(60, 95)):
    rnd = random.Random(seed)
    cols = ["#e63946", "#3a86ff", "#ffd23f", "#2a9d8f", "#9b5de5", "#f4a261", "#ff6fa8"]
    out, cx = [], x
    for _ in range(n):
        w, hh = rnd.randint(18, 30), rnd.randint(*h)
        out.append(f'<rect x="{cx}" y="{y - hh}" width="{w}" height="{hh}" fill="{rnd.choice(cols)}" stroke="{INK}" stroke-width="4"/>')
        cx += w + 2
    return "".join(out)


def _plant(x, y, s=1.0, pot="#e76f51"):
    return (f'<g><path d="M{x} {y} q{-60*s} {-120*s} {-20*s} {-200*s} q{20*s} {80*s} {20*s} {200*s}" fill="#2a9d4b" stroke="{INK}" stroke-width="5"/>'
            f'<path d="M{x} {y} q{70*s} {-100*s} {30*s} {-190*s} q{-20*s} {90*s} {-30*s} {190*s}" fill="#4cbf6a" stroke="{INK}" stroke-width="5"/>'
            f'<path d="M{x} {y} q{-110*s} {-50*s} {-120*s} {-120*s} q{60*s} {30*s} {120*s} {120*s}" fill="#38a85a" stroke="{INK}" stroke-width="5"/>'
            f'<path d="M{x - 55*s} {y} L{x + 55*s} {y} L{x + 42*s} {y + 95*s} L{x - 42*s} {y + 95*s} Z" fill="{pot}" stroke="{INK}" stroke-width="6"/></g>')


def _frame(x, y, w, h, inner, col="#f4e1c1", rot=0):
    return (f'<g transform="rotate({rot} {x + w/2} {y + h/2})"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{col}" stroke="{INK}" stroke-width="7"/>'
            f'<rect x="{x + 12}" y="{y + 12}" width="{w - 24}" height="{h - 24}" fill="#fff" stroke="{INK}" stroke-width="4"/>{inner}</g>')


def _floor_boards(y0, col, line, p):
    return (f'<rect x="0" y="{y0}" width="{W}" height="{H - y0}" fill="{col}"/>'
            f'<g stroke="{line}" stroke-width="5">{"".join(f"<line x1=\'0\' y1=\'{y}\' x2=\'{W}\' y2=\'{y}\'/>" for y in range(y0 + 70, H, 90))}'
            f'{"".join(f"<line x1=\'{x}\' y1=\'{y0 + 70 + 90*(k % 7)}\' x2=\'{x}\' y2=\'{y0 + 160 + 90*(k % 7)}\'/>" for k, x in enumerate(range(80, W, 170)))}</g>'
            f'<rect x="0" y="{y0}" width="{W}" height="{H - y0}" fill="url(#{p}-dots)"/>')


def _cloud(x, y, s=1.0):
    return (f'<path d="M{x} {y} q{10*s} {-40*s} {50*s} {-30*s} q{20*s} {-40*s} {70*s} {-20*s} q{40*s} {-10*s} {50*s} {30*s} q{30*s} {10*s} {10*s} {30*s} Z" '
            f'fill="#fff" stroke="{INK}" stroke-width="5"/>')


# ---------------------------------------------------------------- 1 · quarto de manhã
def quarto_manha(p, d):
    rnd = random.Random(1)
    stars = "".join(f'<path d="M{x} {y} l6 14 l14 0 l-11 9 l4 15 l-13 -9 l-13 9 l4 -15 l-11 -9 l14 0 Z" fill="#fff" opacity=".35"/>'
                    for x, y in [(rnd.randint(500, 1040), rnd.randint(160, 1100)) for _ in range(16)])
    bulbs = "".join(f'<circle class="{p}-bulb" cx="{x}" cy="{190 + 40*abs(((x - 40) % 240) - 120)/120:.0f}" r="13" fill="{["#ffd23f", "#ff6fa8", "#22c3e6"][k % 3]}" stroke="{INK}" stroke-width="4"/>'
                    for k, x in enumerate(range(40, 1080, 80)))
    inner = f'''
  <rect width="{W}" height="{H}" fill="#b9a7e8"/>
  <g opacity=".45">{"".join(f'<rect x="{x}" y="0" width="40" height="1260" fill="#a593db"/>' for x in range(0, W, 110))}</g>{stars}
  <path d="M0 175 {"".join(f"Q{x + 40} 235 {x + 80} 175 " for x in range(0, W, 240))}" fill="none"/>
  <path d="M0 190 C120 250 120 250 240 190 C360 250 360 250 480 190 C600 250 600 250 720 190 C840 250 840 250 960 190 C1020 220 1050 220 1080 205" fill="none" stroke="{INK}" stroke-width="4"/>{bulbs}
  <g>
    <rect x="60" y="300" width="400" height="420" fill="#ffb38a" stroke="{INK}" stroke-width="16"/>
    <rect x="68" y="308" width="384" height="200" fill="#ff8fa3"/>
    <g id="{p}-sun"><circle cx="260" cy="560" r="80" fill="#ffd23f" stroke="{INK}" stroke-width="7"/></g>
    <g id="{p}-clouds">{_cloud(90, 420, .8)}{_cloud(300, 380, 1)}{_cloud(520, 430, .8)}</g>
    <path d="M68 640 L150 600 L210 640 L300 590 L380 640 L452 610 L452 712 L68 712 Z" fill="#6d4c8f" stroke="{INK}" stroke-width="5"/>
    <path d="M150 400 q10 -10 20 0 q10 -10 20 0 M330 460 q8 -8 16 0 q8 -8 16 0" fill="none" stroke="{INK}" stroke-width="4"/>
    <line x1="260" y1="300" x2="260" y2="720" stroke="{INK}" stroke-width="12"/><line x1="60" y1="510" x2="460" y2="510" stroke="{INK}" stroke-width="12"/>
    <rect x="30" y="270" width="460" height="30" rx="8" fill="#5a3b2b" stroke="{INK}" stroke-width="7"/>
    <path d="M40 300 L130 300 C120 480 90 620 50 760 L40 760 Z" fill="{YEL}" stroke="{INK}" stroke-width="7"/>
    <path d="M480 300 L390 300 C400 480 430 620 470 760 L480 760 Z" fill="{YEL}" stroke="{INK}" stroke-width="7"/>
    <rect x="40" y="740" width="440" height="26" rx="6" fill="#fff4e0" stroke="{INK}" stroke-width="6"/>
    {_plant(130, 650, .5, "#3a86ff")}
  </g>
  {_frame(560, 640, 190, 250, f'<circle cx="655" cy="760" r="60" fill="#ff8fa3" stroke="{INK}" stroke-width="5"/><ellipse cx="655" cy="760" rx="95" ry="20" fill="none" stroke="{INK}" stroke-width="6"/><text x="655" y="870" text-anchor="middle" font-family="Archivo Black" font-size="26" fill="{INK}">ESPAÇO</text>', "#22c3e6", 4)}
  <g><rect x="790" y="700" width="260" height="22" fill="#8a6a4a" stroke="{INK}" stroke-width="6"/>{_books(800, 700, 7, 3)}
    <path d="M990 700 l-16 -60 l52 0 l-16 60 Z M968 640 l64 0" fill="#ffd23f" stroke="{INK}" stroke-width="5"/>
    <rect x="790" y="880" width="260" height="22" fill="#8a6a4a" stroke="{INK}" stroke-width="6"/>{_books(805, 880, 5, 8)}
    <rect x="950" y="820" width="60" height="60" rx="8" fill="{MAG}" stroke="{INK}" stroke-width="5"/><circle cx="967" cy="845" r="6" fill="{INK}"/><circle cx="993" cy="845" r="6" fill="{INK}"/></g>
  <rect x="0" y="1240" width="{W}" height="16" fill="#7d6bb5"/>
  {_floor_boards(1256, "#c08552", "#9a6a3e", p)}
  <ellipse cx="540" cy="1640" rx="420" ry="120" fill="#ff6fa8" stroke="{INK}" stroke-width="8"/><ellipse cx="540" cy="1640" rx="320" ry="80" fill="none" stroke="#fff" stroke-width="10" stroke-dasharray="24 18"/>
  <path d="M60 1240 L60 1000 Q60 960 100 960 L980 960 Q1020 960 1020 1000 L1020 1240" fill="#5a3b2b" stroke="{INK}" stroke-width="10"/>
  <path d="M0 1190 L1080 1190 L1080 1460 L0 1460 Z" fill="#3a86ff" stroke="{INK}" stroke-width="9"/>
  <g stroke="{INK}" stroke-width="5" fill="none" opacity=".6">{"".join(f'<path d="M{x} 1190 L{x} 1460"/>' for x in range(120, W, 160))}<path d="M0 1320 L1080 1320"/></g>
  <rect x="0" y="1190" width="{W}" height="270" fill="url(#{p}-dots)"/>
  <rect x="40" y="1460" width="80" height="60" fill="#5a3b2b" stroke="{INK}" stroke-width="7"/><rect x="960" y="1460" width="80" height="60" fill="#5a3b2b" stroke="{INK}" stroke-width="7"/>
  <g stroke="{INK}" stroke-width="6"><path d="M140 1580 l90 -20 l20 40 l-90 20 Z" fill="#fff"/><path d="M820 1560 q40 -40 90 0 l-10 40 l-70 0 Z" fill="{RED}"/></g>'''
    js = f'''
      tl.fromTo("#{p}-sun", {{ y: 90 }}, {{ y: -40, duration: {d}, ease: "none" }}, 0);
      tl.fromTo("#{p}-clouds", {{ x: -40 }}, {{ x: 60, duration: {d}, ease: "none" }}, 0);
      tl.fromTo(".{p}-bulb", {{ opacity: 1 }}, {{ opacity: .35, duration: .4, stagger: .1, repeat: {_rep(d, .8)}, yoyo: true, ease: "steps(1)", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- 2 · sala de estar
def sala(p, d):
    inner = f'''
  <rect width="{W}" height="{H}" fill="#7fc8a9"/>
  <g opacity=".35">{"".join(f'<path d="M{x} {y} l12 -22 l12 22 l-12 22 Z" fill="#4f9e7f"/>' for x in range(30, W, 90) for y in range(60, 1150, 120))}</g>
  <rect x="0" y="1000" width="{W}" height="40" fill="#fff4e0" stroke="{INK}" stroke-width="6"/>
  <g>
    <rect x="80" y="220" width="420" height="520" fill="#9bd1e5" stroke="{INK}" stroke-width="16"/>
    {_cloud(130, 330, .9)}
    <g id="{p}-tree"><rect x="300" y="470" width="40" height="270" fill="#6f5238" stroke="{INK}" stroke-width="6"/>
      <circle cx="320" cy="450" r="120" fill="#2a9d4b" stroke="{INK}" stroke-width="7"/><circle cx="250" cy="500" r="70" fill="#38a85a" stroke="{INK}" stroke-width="6"/><circle cx="400" cy="500" r="70" fill="#38a85a" stroke="{INK}" stroke-width="6"/>
      <circle cx="290" cy="420" r="12" fill="{RED}"/><circle cx="360" cy="470" r="12" fill="{RED}"/></g>
    <path d="M88 700 L492 700 L492 732 L88 732 Z" fill="#7cc36a"/>
    <line x1="290" y1="220" x2="290" y2="740" stroke="{INK}" stroke-width="12"/>
    <path d="M60 190 L520 190 L520 230 L60 230 Z" fill="#c44536" stroke="{INK}" stroke-width="7"/>
    <g id="{p}-curt"><path d="M60 230 L170 230 Q150 520 190 790 L60 790 Z" fill="#e76f51" stroke="{INK}" stroke-width="7"/><path d="M60 230 L170 230 Q150 520 190 790 L60 790 Z" fill="url(#{p}-dots)"/></g>
  </g>
  {_frame(580, 260, 220, 170, f'<circle cx="650" cy="345" r="30" fill="#f4a261" stroke="{INK}" stroke-width="4"/><circle cx="730" cy="345" r="30" fill="#e0ac69" stroke="{INK}" stroke-width="4"/><circle cx="690" cy="370" r="22" fill="#c68642" stroke="{INK}" stroke-width="4"/>', "#5a3b2b", -3)}
  {_frame(840, 230, 170, 220, f'<ellipse cx="925" cy="350" rx="50" ry="45" fill="#c8814a" stroke="{INK}" stroke-width="4"/><text x="925" y="425" text-anchor="middle" font-family="Archivo Black" font-size="22" fill="{INK}">REX ♥</text>', "#ffd23f", 4)}
  <g><rect x="620" y="520" width="440" height="20" fill="#8a6a4a" stroke="{INK}" stroke-width="6"/>{_books(640, 520, 9, 5)}
    <path d="M920 520 l0 -70 l60 0 l0 70" fill="#fff" stroke="{INK}" stroke-width="5"/><path d="M930 470 q20 -20 40 0" stroke="{RED}" stroke-width="6" fill="none"/></g>
  <g><line x1="1000" y1="1000" x2="1000" y2="660" stroke="{INK}" stroke-width="10"/><path d="M940 600 L1060 600 L1040 680 L960 680 Z" fill="#ffd23f" stroke="{INK}" stroke-width="7"/>
    <path d="M960 680 L1040 680 L1080 1000 L920 1000 Z" fill="#fff6c2" opacity=".35"/></g>
  <path d="M-20 820 Q-20 760 40 760 L520 760 Q580 760 580 820 L580 1120 L-20 1120 Z" fill="#c44536" stroke="{INK}" stroke-width="9"/>
  <rect x="-20" y="900" width="600" height="220" fill="#a8372b" stroke="{INK}" stroke-width="8"/><line x1="280" y1="900" x2="280" y2="1120" stroke="{INK}" stroke-width="6"/>
  <rect x="80" y="800" width="130" height="110" rx="20" fill="{YEL}" stroke="{INK}" stroke-width="6" transform="rotate(-8 145 855)"/>
  {_floor_boards(1120, "#d4a373", "#a97c50", p)}
  <ellipse cx="420" cy="1560" rx="420" ry="130" fill="#e9c46a" stroke="{INK}" stroke-width="8"/><ellipse cx="420" cy="1560" rx="300" ry="80" fill="none" stroke="#c44536" stroke-width="12"/>
  <g stroke="{INK}" stroke-width="6"><ellipse cx="190" cy="1500" rx="190" ry="60" fill="#3a86ff"/><ellipse cx="190" cy="1490" rx="150" ry="40" fill="#8ecae6"/>
    <path d="M390 1640 q30 -40 80 0 Z" fill="#9e9e9e"/><text x="430" y="1630" text-anchor="middle" font-family="Archivo Black" font-size="20" fill="{INK}" stroke="none">REX</text>
    <path d="M560 1700 l70 -20 m-80 0 q-20 10 0 25 m80 -45 q20 -10 10 20" fill="#fff"/></g>
  {_plant(990, 1240, .9)}'''
    js = f'''
      tl.fromTo("#{p}-tree", {{ rotation: -2 }}, {{ rotation: 2, duration: 1.2, repeat: {_rep(d, 1.2)}, yoyo: true, ease: "sine.inOut", svgOrigin: "320 740", immediateRender: false }}, 0);
      tl.fromTo("#{p}-curt", {{ skewX: 0 }}, {{ skewX: -3, duration: 1.5, repeat: {_rep(d, 1.5)}, yoyo: true, ease: "sine.inOut", svgOrigin: "60 230", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- 3 · cozinha
def cozinha(p, d):
    tiles = "".join(f'<rect x="{x}" y="{y}" width="60" height="60" fill="{"#e9f5f9" if (x // 60 + y // 60) % 2 else "#cde8f0"}" stroke="#9cc5d3" stroke-width="2"/>'
                    for x in range(0, W, 60) for y in range(720, 1140, 60))
    inner = f'''
  <rect width="{W}" height="{H}" fill="#ffe8b6"/>
  <g opacity=".5">{"".join(f'<circle cx="{x}" cy="{y}" r="6" fill="#f4c97a"/>' for x in range(40, W, 80) for y in range(40, 700, 80))}</g>
  {tiles}
  <g stroke="{INK}" stroke-width="7"><rect x="0" y="180" width="380" height="250" fill="#e76f51"/><line x1="190" y1="180" x2="190" y2="430"/>
    <rect x="150" y="290" width="14" height="40" fill="#fff"/><rect x="216" y="290" width="14" height="40" fill="#fff"/>
    <rect x="700" y="180" width="380" height="250" fill="#e76f51"/><line x1="890" y1="180" x2="890" y2="430"/>
    <rect x="850" y="290" width="14" height="40" fill="#fff"/><rect x="916" y="290" width="14" height="40" fill="#fff"/></g>
  <rect x="0" y="180" width="380" height="250" fill="url(#{p}-dots)"/><rect x="700" y="180" width="380" height="250" fill="url(#{p}-dots)"/>
  <g><rect x="400" y="200" width="280" height="280" fill="#9bd1e5" stroke="{INK}" stroke-width="12"/><circle cx="600" cy="280" r="40" fill="#ffd23f" stroke="{INK}" stroke-width="5"/>
    {_cloud(420, 330, .6)}<line x1="540" y1="200" x2="540" y2="480" stroke="{INK}" stroke-width="9"/><line x1="400" y1="340" x2="680" y2="340" stroke="{INK}" stroke-width="9"/>
    <path d="M390 190 L690 190 L690 220 Q540 300 390 220 Z" fill="#fff" stroke="{INK}" stroke-width="6"/></g>
  <g><rect x="60" y="480" width="250" height="210" fill="#fff" stroke="{INK}" stroke-width="7"/><rect x="60" y="480" width="250" height="50" fill="{RED}" stroke="{INK}" stroke-width="7"/>
    <text x="185" y="518" text-anchor="middle" font-family="Archivo Black" font-size="28" fill="#fff">MARÇO</text>
    <g font-family="Archivo Black" font-size="20" fill="{INK}">{"".join(f'<text x="{78 + 34*(k % 7)}" y="{560 + 30*(k // 7)}">{k + 1}</text>' for k in range(28))}</g>
    <ellipse cx="164" cy="613" rx="24" ry="20" fill="none" stroke="{RED}" stroke-width="6"/>
    <text x="185" y="680" text-anchor="middle" font-family="Archivo Black" font-size="18" fill="{RED}">NIVER DO PAI!!</text></g>
  <g stroke="{INK}" stroke-width="6"><line x1="720" y1="470" x2="1040" y2="470"/>
    <path d="M760 470 l0 70 q-25 30 0 60 q25 -30 0 -60" fill="#c0c7cc"/><circle cx="850" cy="560" r="36" fill="#c0c7cc"/><line x1="850" y1="470" x2="850" y2="524"/>
    <path d="M940 470 l0 110 l-20 40 l40 0 l-20 -40" fill="#c0c7cc"/><path d="M1010 470 l0 80 q-20 0 -20 30 l40 0 q0 -30 -20 -30" fill="#c0c7cc"/></g>
  <rect x="0" y="1140" width="{W}" height="40" fill="#8a6a4a" stroke="{INK}" stroke-width="7"/>
  <g stroke="{INK}" stroke-width="6"><rect x="40" y="1060" width="140" height="80" rx="10" fill="#2b2d42"/><rect x="30" y="1050" width="160" height="16" rx="6" fill="#4a4e69"/>
    <g id="{p}-steam" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"><path d="M80 1030 q-20 -40 0 -80 q20 -40 0 -80"/><path d="M140 1030 q-20 -40 0 -80 q20 -40 0 -80"/></g>
    <rect x="880" y="1070" width="70" height="70" fill="#fff"/><path d="M950 1085 q30 0 30 25 q0 25 -30 25" fill="none"/><text x="915" y="1118" text-anchor="middle" font-family="Archivo Black" font-size="22" fill="{RED}" stroke="none">♥</text>
    <path d="M970 1140 q0 -60 40 -80 q40 20 40 80 Z" fill="#ffd23f"/></g>
  <rect x="0" y="1180" width="{W}" height="{H - 1180}" fill="#c9a27a"/>
  <g opacity=".5">{"".join(f'<rect x="{x}" y="{y}" width="90" height="90" fill="#b98f66"/>' for x in range(0, W, 180) for y in range(1180, H, 180))}{"".join(f'<rect x="{x}" y="{y}" width="90" height="90" fill="#b98f66"/>' for x in range(90, W, 180) for y in range(1270, H, 180))}</g>
  <path d="M-20 1400 L1100 1400 L1100 1920 L-20 1920 Z" fill="#fff" stroke="{INK}" stroke-width="9"/>
  <g fill="{RED}" opacity=".85">{"".join(f'<rect x="{x}" y="{y}" width="60" height="60"/>' for x in range(0, W, 120) for y in range(1400, H, 120))}{"".join(f'<rect x="{x}" y="{y}" width="60" height="60"/>' for x in range(60, W, 120) for y in range(1460, H, 120))}</g>
  <g stroke="{INK}" stroke-width="6"><ellipse cx="760" cy="1470" rx="100" ry="26" fill="#fff"/><path d="M700 1460 l0 -40 l90 0 l0 40" fill="#ffd23f"/>
    <rect x="880" y="1380" width="60" height="100" rx="8" fill="#f4a261"/><path d="M890 1380 l0 -20 l40 0 l0 20" fill="#fff"/></g>'''
    js = f'''
      tl.fromTo("#{p}-steam", {{ y: 10, opacity: .9 }}, {{ y: -30, opacity: .2, duration: 1, repeat: {_rep(d, 1)}, ease: "none", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- 4 · ônibus
def onibus(p, d):
    rnd = random.Random(4)
    bldg, x = [], -200
    while x < 2400:
        w, h = rnd.randint(90, 170), rnd.randint(90, 200)
        col = rnd.choice(["#e76f51", "#3a86ff", "#9b5de5", "#2a9d8f", "#f4a261", "#8d99ae"])
        bldg.append(f'<rect x="{x}" y="{410 - h}" width="{w}" height="{h}" fill="{col}" stroke="{INK}" stroke-width="5"/>'
                    + "".join(f'<rect x="{x + 14 + 30*i}" y="{410 - h + 18 + 34*j}" width="16" height="18" fill="#fff6c2"/>'
                              for i in range((w - 20) // 30) for j in range((h - 30) // 34)))
        x += w + rnd.randint(10, 50)
    straps = "".join(f'<g class="{p}-strap"><line x1="{x}" y1="440" x2="{x}" y2="520" stroke="{INK}" stroke-width="5"/><path d="M{x - 22} 520 q22 -10 44 0 l-6 40 q-16 10 -32 0 Z" fill="#fff" stroke="{INK}" stroke-width="5"/></g>'
                     for x in range(90, W, 180))
    inner = f'''
  <rect width="{W}" height="{H}" fill="#ffb703"/>
  <rect x="0" y="130" width="{W}" height="50" fill="#fb8500" stroke="{INK}" stroke-width="6"/>
  <g font-family="Archivo Black" font-size="26" fill="{INK}"><text x="40" y="166">🍔 X-TUDO R$9,99</text><text x="420" y="166">LINHA 801 · CENTRO</text><text x="800" y="166">📱 PLANO 5G</text></g>
  <rect x="0" y="180" width="{W}" height="230" fill="#9bd1e5"/>
  <g id="{p}-city">{"".join(bldg)}</g>
  <rect x="0" y="395" width="{W}" height="15" fill="#6c757d"/>
  {"".join(f'<line x1="{x}" y1="180" x2="{x}" y2="410" stroke="{INK}" stroke-width="14"/>' for x in (0, 270, 540, 810, 1080))}
  <rect x="0" y="170" width="{W}" height="250" fill="none" stroke="{INK}" stroke-width="12"/>
  <rect x="0" y="420" width="{W}" height="24" rx="12" fill="#c0c7cc" stroke="{INK}" stroke-width="6"/>{straps}
  <g><rect x="930" y="600" width="80" height="80" rx="14" fill="{RED}" stroke="{INK}" stroke-width="6"/><text x="970" y="652" text-anchor="middle" font-family="Archivo Black" font-size="24" fill="#fff">PARE</text></g>
  <g opacity=".5">{"".join(f'<circle cx="{x}" cy="{y}" r="5" fill="#fb8500"/>' for x in range(30, W, 60) for y in range(700, 1300, 60))}</g>
  <rect x="0" y="1340" width="{W}" height="580" fill="#6c757d"/>
  <g stroke="#59616a" stroke-width="10">{"".join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>' for y in range(1370, H, 40))}</g>
  <path d="M440 1340 L640 1340 L760 1920 L320 1920 Z" fill="#ffd23f" opacity=".35"/>
  <g stroke="{INK}" stroke-width="8"><rect x="-20" y="1440" width="300" height="200" rx="30" fill="#3a86ff"/><rect x="800" y="1440" width="300" height="200" rx="30" fill="#3a86ff"/>
    <rect x="-20" y="1640" width="300" height="60" fill="#2b5fbf"/><rect x="800" y="1640" width="300" height="60" fill="#2b5fbf"/></g>
  <g fill="{YEL}" stroke="{INK}" stroke-width="3">{"".join(f'<circle cx="{x}" cy="{y}" r="8"/>' for x in (40, 120, 200, 860, 940, 1020) for y in (1490, 1580))}</g>'''
    js = f'''
      tl.fromTo("#{p}-city", {{ x: 0 }}, {{ x: -1100, duration: {d}, ease: "none" }}, 0);
      tl.fromTo(".{p}-strap", {{ rotation: -6 }}, {{ rotation: 6, duration: .7, repeat: {_rep(d, .7)}, yoyo: true, ease: "sine.inOut", transformOrigin: "50% 0%", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- 5 · escritório
def escritorio(p, d):
    rnd = random.Random(7)
    sky = "".join(f'<rect x="{x}" y="{y}" width="{w}" height="{780 - y}" fill="{c}" stroke="{INK}" stroke-width="4"/>'
                  + "".join(f'<rect x="{x + 10 + 22*i}" y="{y + 14 + 26*j}" width="12" height="14" fill="{"#ffe066" if rnd.random() > .5 else "#5c6b8a"}"/>'
                            for i in range((w - 14) // 22) for j in range((780 - y - 20) // 26))
                  for x, y, w, c in [(rnd.randint(-20, 1040), rnd.randint(380, 620), rnd.randint(80, 140), rnd.choice(["#4a5d8f", "#3d4f7d", "#5c6fa3"])) for _ in range(14)])
    inner = f'''
  <rect width="{W}" height="{H}" fill="#dfe7ec"/>
  <rect x="0" y="0" width="{W}" height="150" fill="#f4f6f8"/>
  {"".join(f'<rect x="{x}" y="40" width="180" height="40" rx="6" fill="#fff" stroke="{INK}" stroke-width="5"/><rect x="{x + 10}" y="50" width="160" height="20" fill="#fff9c4"/>' for x in (80, 450, 820))}
  <g><rect x="0" y="230" width="{W}" height="560" fill="#ffcf9e"/><rect x="0" y="230" width="{W}" height="250" fill="#ffa98a"/>
    <circle cx="840" cy="420" r="70" fill="#ffd23f" stroke="{INK}" stroke-width="6"/>
    <g id="{p}-plane"><path d="M0 330 l60 -10 l20 -20 l10 0 l-8 22 l30 -4 l10 -10 l8 0 l-4 14 l-6 14 l-8 0 l-10 -10 l-30 -4 l8 22 l-10 0 l-20 -20 Z" fill="#fff" stroke="{INK}" stroke-width="4"/></g>
    {sky}
    {"".join(f'<line x1="{x}" y1="230" x2="{x}" y2="790" stroke="{INK}" stroke-width="14"/>' for x in (0, 270, 540, 810, 1080))}
    <rect x="0" y="222" width="{W}" height="18" fill="#8d99ae" stroke="{INK}" stroke-width="5"/><rect x="0" y="782" width="{W}" height="18" fill="#8d99ae" stroke="{INK}" stroke-width="5"/></g>
  <g><rect x="40" y="840" width="300" height="70" fill="#2b2d42" stroke="{INK}" stroke-width="6"/><text x="190" y="890" text-anchor="middle" font-family="Archivo Black" font-size="34" fill="{YEL}">MEGACORP</text></g>
  <g stroke="{INK}" stroke-width="6"><rect x="960" y="860" width="90" height="240" rx="10" fill="#e9ecef"/><path d="M970 760 L1040 760 L1050 860 L960 860 Z" fill="#9bd1e5"/>
    <g id="{p}-bub"><circle cx="1000" cy="830" r="10" fill="#fff"/><circle cx="1020" cy="800" r="7" fill="#fff"/></g></g>
  <rect x="0" y="1100" width="{W}" height="{H - 1100}" fill="#8d99ae"/>
  <g opacity=".35">{"".join(f'<rect x="{x}" y="{y}" width="120" height="120" fill="#6c7891"/>' for x in range(0, W, 240) for y in range(1100, H, 240))}{"".join(f'<rect x="{x}" y="{y}" width="120" height="120" fill="#6c7891"/>' for x in range(120, W, 240) for y in range(1220, H, 240))}</g>
  {_plant(60, 1000, .9, "#2b2d42")}
  <path d="M-30 1330 L1110 1330 L1110 1440 L-30 1440 Z" fill="#7a5233" stroke="{INK}" stroke-width="9"/>
  <path d="M-30 1440 L1110 1440 L1110 1920 L-30 1920 Z" fill="#5a3b2b" stroke="{INK}" stroke-width="9"/>
  <rect x="-30" y="1440" width="1140" height="480" fill="url(#{p}-dots)"/>
  <g stroke="{INK}" stroke-width="6"><path d="M120 1330 l30 -90 l180 0 l-30 90 Z" fill="#c0c7cc"/><rect x="100" y="1330" width="240" height="14" fill="#8d99ae"/>
    <path d="M720 1330 l30 -90 l180 0 l-30 90 Z" fill="#c0c7cc"/><rect x="700" y="1330" width="240" height="14" fill="#8d99ae"/>
    <rect x="460" y="1260" width="60" height="70" fill="#fff"/><path d="M520 1275 q26 0 26 22 q0 22 -26 22" fill="none"/>
    <path d="M560 1330 l100 -10 l10 10 Z" fill="#fff"/><path d="M570 1316 l90 -14" stroke="#fff"/></g>'''
    js = f'''
      tl.fromTo("#{p}-plane", {{ x: -200 }}, {{ x: 1200, duration: {d}, ease: "none" }}, 0);
      tl.fromTo("#{p}-bub", {{ y: 30, opacity: 1 }}, {{ y: -40, opacity: 0, duration: 1.4, repeat: {_rep(d, 1.4)}, ease: "none", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- 6 · corredor da escola
def corredor(p, d):
    lockers = "".join(
        f'<rect x="{x}" y="560" width="110" height="560" fill="{c}" stroke="{INK}" stroke-width="7"/>'
        f'{"".join(f"<line x1=\'{x + 25}\' y1=\'{y}\' x2=\'{x + 85}\' y2=\'{y}\' stroke=\'{INK}\' stroke-width=\'5\'/>" for y in (600, 620, 640))}'
        f'<rect x="{x + 80}" y="820" width="14" height="40" rx="4" fill="#c0c7cc" stroke="{INK}" stroke-width="4"/>'
        for x, c in zip(range(0, W, 110), ["#3a86ff", "#e63946", "#3a86ff", "#e63946", "#3a86ff", "#e63946", "#3a86ff", "#e63946", "#3a86ff", "#e63946"]))
    inner = f'''
  <rect width="{W}" height="{H}" fill="#fcefc7"/>
  <rect x="0" y="0" width="{W}" height="120" fill="#f6dfa0"/>
  {"".join(f'<rect x="{x}" y="30" width="200" height="34" rx="8" fill="#fff" stroke="{INK}" stroke-width="5"/>' for x in (100, 440, 780))}
  <g><rect x="60" y="180" width="460" height="300" fill="#9bd1e5" stroke="{INK}" stroke-width="12"/>
    <rect x="68" y="380" width="444" height="92" fill="#7cc36a"/><circle cx="160" cy="330" r="70" fill="#2a9d4b" stroke="{INK}" stroke-width="6"/><rect x="150" y="380" width="20" height="60" fill="#6f5238"/>
    <path d="M300 440 l60 -70 l60 70 Z M330 440 l0 -30 l60 0 l0 30" fill="#fff" stroke="{INK}" stroke-width="5"/>
    <line x1="290" y1="180" x2="290" y2="480" stroke="{INK}" stroke-width="9"/></g>
  <g><rect x="580" y="180" width="440" height="320" fill="#b07d4f" stroke="{INK}" stroke-width="10"/>
    <g id="{p}-fly1"><rect x="610" y="210" width="150" height="120" fill="#fff" stroke="{INK}" stroke-width="5"/><text x="685" y="262" text-anchor="middle" font-family="Archivo Black" font-size="22" fill="{RED}">FESTA</text><text x="685" y="292" text-anchor="middle" font-family="Archivo Black" font-size="22" fill="{RED}">JUNINA</text><circle cx="685" cy="214" r="7" fill="{RED}"/></g>
    <rect x="790" y="220" width="200" height="110" fill="{YEL}" stroke="{INK}" stroke-width="5" transform="rotate(4 890 275)"/><text x="890" y="285" text-anchor="middle" font-family="Archivo Black" font-size="22" fill="{INK}" transform="rotate(4 890 275)">CLUBE DE XADREZ ♟</text>
    <rect x="620" y="350" width="170" height="120" fill="#ff8fa3" stroke="{INK}" stroke-width="5" transform="rotate(-5 705 410)"/><text x="705" y="420" text-anchor="middle" font-family="Archivo Black" font-size="24" fill="{INK}" transform="rotate(-5 705 410)">PROVA 6ª!</text>
    <rect x="820" y="355" width="170" height="120" fill="#9bd1e5" stroke="{INK}" stroke-width="5"/><text x="905" y="425" text-anchor="middle" font-family="Archivo Black" font-size="22" fill="{INK}">INTERCLASSE ⚽</text></g>
  {lockers}
  <g font-size="40"><text x="140" y="720">⭐</text><text x="360" y="700">😎</text><text x="700" y="730">🎸</text><text x="910" y="710">💯</text></g>
  <rect x="0" y="1120" width="{W}" height="{H - 1120}" fill="#d9d2c3"/>
  <g>{"".join(f'<path d="M{540 + (x - 540) * 0.25} 1120 L{x} {H}" stroke="#b9b09d" stroke-width="6"/>' for x in range(-1080, 2200, 180))}{"".join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}" stroke="#b9b09d" stroke-width="6"/>' for y in (1180, 1270, 1400, 1580, 1820))}</g>
  <g id="{p}-hearts" font-size="54" opacity=".8"><text x="80" y="1000">💗</text><text x="960" y="980">💗</text><text x="240" y="860">💕</text></g>'''
    js = f'''
      tl.fromTo("#{p}-fly1", {{ rotation: -3 }}, {{ rotation: 3, duration: .9, repeat: {_rep(d, .9)}, yoyo: true, ease: "sine.inOut", svgOrigin: "685 214", immediateRender: false }}, 0);
      tl.fromTo("#{p}-hearts", {{ y: 30, opacity: 0 }}, {{ y: -80, opacity: .8, duration: {min(d, 4)}, ease: "sine.out" }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- 7 · sala de aula
def sala_aula(p, d):
    desks = "".join(f'<g stroke="{INK}" stroke-width="7"><path d="M{x} {y} l{w} 0 l-20 60 l{-w + 40} 0 Z" fill="#e9c46a"/><rect x="{x + 10}" y="{y + 60}" width="16" height="140" fill="#6c757d"/><rect x="{x + w - 26}" y="{y + 60}" width="16" height="140" fill="#6c757d"/>'
                    f'<rect x="{x + 40}" y="{y - 12}" width="110" height="14" fill="#fff"/></g>'
                    for x, y, w in [(-40, 1500, 360), (380, 1520, 340), (780, 1500, 360)])
    inner = f'''
  <rect width="{W}" height="{H}" fill="#f2cc8f"/>
  <g opacity=".3">{"".join(f'<rect x="0" y="{y}" width="{W}" height="20" fill="#e0b073"/>' for y in range(0, 1200, 60))}</g>
  <g><rect x="30" y="190" width="1020" height="440" fill="#2f5d3a" stroke="#7a5233" stroke-width="22"/>
    <g fill="none" stroke="#fff" stroke-width="5" opacity=".85" font-family="Permanent Marker, Archivo Black">
      <text x="90" y="280" font-size="52" fill="#fff" stroke="none">PROVA SURPRESA!!</text>
      <text x="90" y="360" font-size="40" fill="#fff" stroke="none">x² + 3x − 4 = 0</text>
      <text x="90" y="430" font-size="40" fill="#fff" stroke="none">Δ = b² − 4ac</text>
      <text x="610" y="380" font-size="36" fill="#ffd23f" stroke="none">→ BOA SORTE 😈</text>
      <path d="M620 470 l120 0 l0 100 Z"/><text x="660" y="600" font-size="28" fill="#fff" stroke="none">90°</text>
      <path d="M860 450 q40 -60 80 0 t80 0"/></g>
    <rect x="30" y="630" width="1020" height="24" fill="#7a5233" stroke="{INK}" stroke-width="5"/><rect x="200" y="620" width="60" height="16" fill="#fff"/><rect x="300" y="622" width="40" height="14" fill="#ffd23f"/></g>
  <g><circle cx="540" cy="110" r="62" fill="#fff" stroke="{INK}" stroke-width="9"/><line x1="540" y1="110" x2="540" y2="70" stroke="{INK}" stroke-width="8"/>
    <g id="{p}-hand"><line x1="540" y1="110" x2="580" y2="110" stroke="{RED}" stroke-width="6"/></g></g>
  <g><rect x="40" y="700" width="260" height="190" fill="#9bd1e5" stroke="{INK}" stroke-width="7"/>
    <path d="M70 760 q40 -30 70 0 q20 40 -20 60 q-40 10 -50 -60 Z M180 740 q50 -10 80 20 q10 50 -30 70 q-40 -20 -50 -90 Z M200 840 q30 0 40 30 l-40 0 Z" fill="#7cc36a" stroke="{INK}" stroke-width="4"/>
    <text x="170" y="880" text-anchor="middle" font-family="Archivo Black" font-size="20" fill="{INK}">MAPA-MÚNDI</text></g>
  <g><rect x="40" y="920" width="260" height="70" fill="#fff" stroke="{INK}" stroke-width="6"/><text x="170" y="967" text-anchor="middle" font-family="Archivo Black" font-size="26" fill="{INK}">A B C D E F</text></g>
  <rect x="0" y="1160" width="{W}" height="{H - 1160}" fill="#a3785a"/>
  <g stroke="#8a6248" stroke-width="5">{"".join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>' for y in range(1220, H, 80))}</g>
  <g stroke="{INK}" stroke-width="7"><rect x="600" y="1260" width="480" height="70" fill="#7a5233"/><rect x="620" y="1330" width="440" height="200" fill="#5a3b2b"/>
    <path d="M960 1260 q-10 -50 20 -60 q30 10 20 60 Z" fill="{RED}"/><path d="M980 1200 q10 -20 25 -20" fill="none"/><rect x="680" y="1230" width="120" height="30" fill="#fff"/><rect x="690" y="1215" width="100" height="18" fill="#3a86ff"/></g>
  {desks}
  <g id="{p}-dust" fill="#fff" opacity=".6">{"".join(f'<circle cx="{x}" cy="{y}" r="5"/>' for x, y in [(120, 640), (300, 650), (480, 645), (700, 655), (900, 640)])}</g>'''
    js = f'''
      tl.fromTo("#{p}-hand", {{ rotation: 0 }}, {{ rotation: {round(d) * 6}, duration: {d}, ease: "steps({max(1, round(d))})", svgOrigin: "540 110" }}, 0);
      tl.fromTo("#{p}-dust", {{ y: 0, opacity: .7 }}, {{ y: 60, opacity: 0, duration: 2, repeat: {_rep(d, 2)}, ease: "none", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- 8 · sala de videogame à noite
def sala_games(p, d):
    rnd = random.Random(8)
    city = "".join(f'<rect x="{x}" y="{y}" width="{w}" height="{520 - y}" fill="#1b1f4a" stroke="{INK}" stroke-width="3"/>'
                   + "".join(f'<rect x="{x + 8 + 18*i}" y="{y + 12 + 22*j}" width="9" height="11" fill="#ffd23f" opacity="{.9 if rnd.random() > .55 else .15}"/>'
                             for i in range((w - 12) // 18) for j in range((520 - y - 16) // 22))
                   for x, y, w in [(60 + 70*k, rnd.randint(320, 440), rnd.randint(50, 80)) for k in range(5)])
    inner = f'''
  <rect width="{W}" height="{H}" fill="#241a4d"/>
  <g opacity=".35">{"".join(f'<polygon points="{x},{y} {x + 30},{y + 52} {x - 30},{y + 52}" fill="#33266b"/>' for x in range(40, W, 120) for y in range(150, 1100, 140))}</g>
  <rect id="{p}-led" x="0" y="140" width="{W}" height="14" fill="{MAG}"/>
  <g><rect x="40" y="220" width="320" height="320" fill="#0c1033" stroke="{INK}" stroke-width="12"/>
    <circle cx="290" cy="290" r="38" fill="#fff4c2" stroke="{INK}" stroke-width="5"/>{"".join(f'<circle cx="{rnd.randint(60, 340)}" cy="{rnd.randint(240, 330)}" r="3" fill="#fff"/>' for _ in range(10))}
    {city}<line x1="200" y1="220" x2="200" y2="540" stroke="{INK}" stroke-width="9"/></g>
  <g><rect x="760" y="240" width="250" height="330" fill="#ff6fa8" stroke="{INK}" stroke-width="8" transform="rotate(4 885 405)"/>
    <text x="885" y="350" text-anchor="middle" font-family="Archivo Black" font-size="44" fill="{INK}" transform="rotate(4 885 405)">GAME</text>
    <text x="885" y="400" text-anchor="middle" font-family="Archivo Black" font-size="44" fill="{INK}" transform="rotate(4 885 405)">OVER</text>
    <text x="885" y="490" text-anchor="middle" font-size="80" transform="rotate(4 885 405)">👾</text></g>
  <g><rect x="250" y="420" width="580" height="340" rx="18" fill="#101010" stroke="{INK}" stroke-width="12"/>
    <rect id="{p}-scr" x="268" y="438" width="544" height="304" fill="#2e86de"/>
    <rect x="268" y="660" width="544" height="82" fill="#38a85a"/>
    <g id="{p}-f1"><rect x="340" y="560" width="50" height="100" fill="{RED}" stroke="{INK}" stroke-width="4"/><rect x="345" y="530" width="40" height="40" fill="#f4c99a" stroke="{INK}" stroke-width="4"/></g>
    <g id="{p}-f2"><rect x="680" y="560" width="50" height="100" fill="{YEL}" stroke="{INK}" stroke-width="4"/><rect x="685" y="530" width="40" height="40" fill="#c68642" stroke="{INK}" stroke-width="4"/></g>
    <rect x="290" y="458" width="200" height="22" fill="{GRN}" stroke="{INK}" stroke-width="3"/><rect x="590" y="458" width="200" height="22" fill="{GRN}" stroke="{INK}" stroke-width="3"/>
    <text x="540" y="520" text-anchor="middle" font-family="Archivo Black" font-size="34" fill="#fff">ROUND 3</text>
    <rect x="510" y="760" width="60" height="50" fill="{INK}"/></g>
  <path id="{p}-glow" d="M268 760 L812 760 L1080 1300 L0 1300 Z" fill="#7fd3ff" opacity=".18"/>
  <g stroke="{INK}" stroke-width="7"><rect x="180" y="810" width="720" height="70" fill="#4a3428"/><rect x="230" y="880" width="620" height="140" fill="#3b2a22"/>
    <rect x="300" y="900" width="200" height="60" rx="10" fill="#1e1e1e"/><circle cx="470" cy="930" r="8" fill="{CYAN}"/><rect x="580" y="900" width="200" height="60" rx="10" fill="#fff"/></g>
  {_plant(990, 1000, .8, "#9b5de5")}
  <rect x="0" y="1300" width="{W}" height="{H - 1300}" fill="#3b2f5c"/>
  <rect x="0" y="1300" width="{W}" height="{H - 1300}" fill="url(#{p}-dots)"/>
  <g stroke="{INK}" stroke-width="6"><path d="M420 1620 q80 -60 160 0 Z" fill="#fff"/><g fill="#ffd23f">{"".join(f'<circle cx="{x}" cy="{y}" r="12"/>' for x, y in [(460, 1585), (500, 1575), (540, 1590), (480, 1600)])}</g>
    <rect x="620" y="1560" width="40" height="70" rx="6" fill="{RED}"/><rect x="680" y="1580" width="40" height="70" rx="6" fill="{CYAN}" transform="rotate(80 700 1615)"/></g>'''
    js = f'''
      tl.fromTo("#{p}-led", {{ fill: "{MAG}" }}, {{ fill: "{CYAN}", duration: 1.6, repeat: {_rep(d, 1.6)}, yoyo: true, ease: "none", immediateRender: false }}, 0);
      tl.fromTo("#{p}-glow", {{ opacity: .12 }}, {{ opacity: .26, duration: .35, repeat: {_rep(d, .35)}, yoyo: true, ease: "steps(2)", immediateRender: false }}, 0);
      tl.fromTo("#{p}-f1", {{ x: 0 }}, {{ x: 120, duration: .6, repeat: {_rep(d, .6)}, yoyo: true, ease: "steps(3)", immediateRender: false }}, 0);
      tl.fromTo("#{p}-f2", {{ x: 0 }}, {{ x: -120, duration: .7, repeat: {_rep(d, .7)}, yoyo: true, ease: "steps(3)", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


GRN = "#4cd964"


# ---------------------------------------------------------------- 9 · varanda à meia-noite
def varanda(p, d, t_off):
    """t_off: instante (na cena) em que a cidade apaga junto com o poder."""
    rnd = random.Random(9)
    stars = "".join(f'<circle class="{p}-star" cx="{rnd.randint(10, 1070)}" cy="{rnd.randint(20, 560)}" r="{rnd.choice([2, 3, 4])}" fill="#fff"/>' for _ in range(60))
    bl, x = [], -10
    while x < W:
        w, h = rnd.randint(70, 140), rnd.randint(120, 300)
        bl.append(f'<rect x="{x}" y="{900 - h}" width="{w}" height="{h}" fill="#141a3a" stroke="{INK}" stroke-width="4"/>'
                  + "".join(f'<rect class="{p}-win" x="{x + 10 + 22*i}" y="{900 - h + 16 + 26*j}" width="11" height="13" fill="#ffd23f"/>'
                            for i in range((w - 14) // 22) for j in range((h - 24) // 26) if rnd.random() > .45))
        x += w + rnd.randint(0, 20)
    lights = "".join(f'<circle class="{p}-lamp" cx="{x}" cy="{1005 + 30*abs(((x - 20) % 200) - 100)/100:.0f}" r="12" fill="#ffd27a" stroke="{INK}" stroke-width="3"/>' for x in range(20, W, 70))
    inner = f'''
  <rect width="{W}" height="{H}" fill="#0b1030"/>
  <rect width="{W}" height="900" fill="#141a4a"/><rect y="500" width="{W}" height="400" fill="#1d2560" opacity=".7"/>
  {stars}
  <circle cx="860" cy="640" r="70" fill="#fff4c2" stroke="{INK}" stroke-width="6"/><circle cx="890" cy="625" r="70" fill="#141a4a"/>
  {"".join(bl)}
  <path d="M0 990 C140 1040 140 1040 280 990 C420 1040 420 1040 560 990 C700 1040 700 1040 840 990 C960 1030 1020 1030 1080 1000" fill="none" stroke="{INK}" stroke-width="4"/>{lights}
  <g stroke="{INK}" stroke-width="8"><rect x="0" y="1100" width="{W}" height="26" fill="#7a5233"/>{"".join(f'<rect x="{x}" y="1126" width="22" height="180" fill="#8a6248"/>' for x in range(30, W, 90))}
    <rect x="0" y="1300" width="{W}" height="22" fill="#7a5233"/></g>
  {_plant(60, 1230, .8, "#c44536")}{_plant(1010, 1240, .7, "#3a86ff")}
  <rect x="0" y="1320" width="{W}" height="{H - 1320}" fill="#5a3b2b"/>
  <g stroke="#3f281c" stroke-width="6">{"".join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>' for y in range(1380, H, 70))}</g>
  <rect x="0" y="1320" width="{W}" height="{H - 1320}" fill="url(#{p}-dots)"/>
  <g stroke="{INK}" stroke-width="6"><ellipse cx="800" cy="1500" rx="260" ry="70" fill="#c44536"/><ellipse cx="800" cy="1490" rx="210" ry="45" fill="#e76f51"/>
    <path d="M260 1520 q30 -20 60 0 l-10 50 l-40 0 Z" fill="#fff"/><path d="M320 1530 q20 0 20 18 q0 18 -20 18" fill="none"/></g>
  <rect width="{W}" height="{H}" fill="#05070f" opacity=".25"/>'''
    js = f'''
      tl.fromTo(".{p}-star", {{ opacity: 1 }}, {{ opacity: .3, duration: .5, stagger: {{ each: .07, repeat: {_rep(d, 1)}, yoyo: true }}, ease: "steps(1)", immediateRender: false }}, 0);
      tl.fromTo(".{p}-win", {{ opacity: 1 }}, {{ opacity: 0, duration: .01, stagger: {{ each: .012, from: "random" }}, immediateRender: false }}, {t_off});
      tl.fromTo(".{p}-lamp", {{ opacity: 1 }}, {{ opacity: .25, duration: .01, stagger: .05, immediateRender: false }}, {t_off + .4});'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- 10 · espaço mental
def espaco_mental(p, d):
    rnd = random.Random(10)
    stars = "".join(f'<circle cx="{rnd.randint(0, W)}" cy="{rnd.randint(0, H)}" r="{rnd.choice([2, 3, 5])}" fill="#fff" opacity="{rnd.choice([.4, .7, 1])}"/>' for _ in range(90))
    bubbles = [("?", 150, 1560, "#ffd23f"), ("!", 920, 1580, "#22c3e6"), ("💭", 720, 1790, "#fff"), ("🙈", 330, 1800, "#ff6fa8"),
               ("😳", 540, 1600, "#fff"), ("🧠", 960, 300, "#fff"), ("🍝", 90, 300, "#fff"), ("🐶", 940, 1340, "#fff"), ("🐱", 130, 1330, "#fff")]
    bb = "".join(f'<g class="{p}-bb"><ellipse cx="{x}" cy="{y}" rx="70" ry="56" fill="{c}" stroke="{INK}" stroke-width="7"/><circle cx="{x - 40}" cy="{y + 70}" r="14" fill="{c}" stroke="{INK}" stroke-width="5"/>'
                 f'<text x="{x}" y="{y + 20}" text-anchor="middle" font-family="Archivo Black" font-size="56" fill="{INK}">{t}</text></g>' for t, x, y, c in bubbles)
    inner = f'''
  <rect width="{W}" height="{H}" fill="#3a0ca3"/>
  <circle cx="540" cy="900" r="760" fill="#4a1bc4" opacity=".6"/><circle cx="540" cy="900" r="520" fill="#5a2bd4" opacity=".5"/>
  {stars}
  <g id="{p}-brain" opacity=".16" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round">
    <path d="M540 520 C380 480 260 580 280 700 C200 760 220 900 320 930 C320 1030 440 1080 540 1040 C640 1080 760 1030 760 930 C860 900 880 760 800 700 C820 580 700 480 540 520 Z"/>
    <path d="M540 520 L540 1040 M400 640 q60 40 0 100 M680 640 q-60 40 0 100 M360 860 q80 -20 120 40 M720 860 q-80 -20 -120 40"/></g>
  <g id="{p}-orbit" opacity=".35" fill="none" stroke="{CYAN}" stroke-width="6" stroke-dasharray="20 22"><ellipse cx="540" cy="780" rx="500" ry="160"/></g>
  {bb}'''
    js = f'''
      tl.fromTo("#{p}-brain", {{ scale: .95 }}, {{ scale: 1.05, duration: 1, repeat: {_rep(d, 1)}, yoyo: true, ease: "sine.inOut", svgOrigin: "540 780", immediateRender: false }}, 0);
      tl.fromTo("#{p}-orbit", {{ rotation: -4 }}, {{ rotation: 4, duration: {d}, ease: "none", svgOrigin: "540 780" }}, 0);
      tl.fromTo(".{p}-bb", {{ y: 20 }}, {{ y: -20, duration: 1.3, stagger: .2, repeat: {_rep(d, 1.3)}, yoyo: true, ease: "sine.inOut", immediateRender: false }}, 0);'''
    return _svg(p, inner), js
