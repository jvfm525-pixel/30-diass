"""Cenários detalhados da série do Armando (um lugar novo por cena, a partir do DIA 5).

Cada função devolve (html, js): o SVG de fundo (z-index 0) e animações discretas.
"""
import random

from hq_lib import CYAN, INK, MAG, RED, YEL
from mentes_cenarios import H, W, _books, _cloud, _floor_boards, _frame, _plant, _rep, _svg

GRN = "#4cd964"


def _people_sil(p, y, n, seed, cls=None):
    rnd = random.Random(seed)
    out = []
    for k in range(n):
        x = 40 + k * (1000 // n) + rnd.randint(-20, 20)
        s = rnd.uniform(.8, 1.1)
        c = rnd.choice(["#6d597a", "#355070", "#b56576", "#457b9d", "#7f5539"])
        out.append(f'<g class="{cls or p + "-ppl"}"><circle cx="{x}" cy="{y - 150*s:.0f}" r="{34*s:.0f}" fill="{c}" stroke="{INK}" stroke-width="5"/>'
                   f'<path d="M{x - 55*s:.0f} {y} Q{x - 50*s:.0f} {y - 110*s:.0f} {x} {y - 112*s:.0f} Q{x + 50*s:.0f} {y - 110*s:.0f} {x + 55*s:.0f} {y} Z" fill="{c}" stroke="{INK}" stroke-width="5"/></g>')
    return "".join(out)


# ---------------------------------------------------------------- shopping (fachada / corredor)
def shopping(p, d):
    stores = [("📱 CELULARES", MAG, 0), ("👟 TÊNIS", "#3a86ff", 360), ("🍦 SORVETE", "#2a9d8f", 720)]
    fronts = "".join(
        f'<rect x="{x + 10}" y="300" width="340" height="560" fill="#1d1d2b" stroke="{INK}" stroke-width="10"/>'
        f'<rect x="{x + 10}" y="300" width="340" height="90" fill="{c}" stroke="{INK}" stroke-width="8"/>'
        f'<text x="{x + 180}" y="360" text-anchor="middle" font-family="Archivo Black" font-size="34" fill="#fff">{t}</text>'
        f'<rect x="{x + 30}" y="410" width="300" height="430" fill="#9fd8ef" opacity=".9"/>'
        f'<path d="M{x + 60} 420 L{x + 140} 830 M{x + 200} 420 L{x + 280} 830" stroke="#fff" stroke-width="16" opacity=".35"/>'
        for t, c, x in stores)
    goods = (f'{"".join(f"<rect x=\'{60 + 70*i}\' y=\'560\' width=\'50\' height=\'90\' rx=\'10\' fill=\'#20232b\' stroke=\'{INK}\' stroke-width=\'5\'/><rect x=\'{66 + 70*i}\' y=\'568\' width=\'38\' height=\'66\' fill=\'{c}\'/>" for i, c in enumerate([CYAN, MAG, YEL, GRN])) }'
             f'{"".join(f"<path d=\'M{420 + 80*i} 700 q30 -50 70 -10 l0 30 l-70 0 Z\' fill=\'{c}\' stroke=\'{INK}\' stroke-width=\'5\'/>" for i, c in enumerate([RED, "#fff", YEL]))}'
             f'{"".join(f"<path d=\'M{770 + 90*i} 640 l30 70 l30 -70 Z\' fill=\'#f4a261\' stroke=\'{INK}\' stroke-width=\'5\'/><circle cx=\'{800 + 90*i}\' cy=\'625\' r=\'30\' fill=\'{c}\' stroke=\'{INK}\' stroke-width=\'5\'/>" for i, c in enumerate(["#ff8fa3", "#fff6c2", "#8ce99a"]))}')
    inner = f'''
  <rect width="{W}" height="{H}" fill="#f1e3d3"/>
  <rect width="{W}" height="230" fill="#fff8ef"/>
  {"".join(f'<circle cx="{x}" cy="110" r="34" fill="#fff6c2" stroke="{INK}" stroke-width="6"/><path d="M{x - 60} 40 L{x + 60} 40" stroke="{INK}" stroke-width="6"/>' for x in (180, 540, 900))}
  <g id="{p}-banner"><rect x="300" y="170" width="480" height="90" rx="12" fill="{RED}" stroke="{INK}" stroke-width="8"/>
    <text x="540" y="232" text-anchor="middle" font-family="Archivo Black" font-size="46" fill="#fff">SUPER OFERTAS!</text></g>
  {fronts}{goods}
  <rect x="0" y="860" width="{W}" height="20" fill="#c9b79c" stroke="{INK}" stroke-width="5"/>
  <rect x="0" y="880" width="{W}" height="{H - 880}" fill="#e8dcc8"/>
  <g>{"".join(f'<path d="M{540 + (x - 540) * .3} 880 L{x} {H}" stroke="#d2c4ab" stroke-width="6"/>' for x in range(-900, 2000, 200))}
    {"".join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}" stroke="#d2c4ab" stroke-width="6"/>' for y in (940, 1030, 1160, 1340, 1600))}</g>
  <g id="{p}-ppl">{_people_sil(p, 1000, 6, 3, p + "-pp")}</g>
  {_plant(70, 1340, 1.1, "#c44536")}{_plant(1010, 1340, 1.1, "#c44536")}'''
    js = f'''
      tl.fromTo("#{p}-ppl", {{ x: -80 }}, {{ x: 80, duration: {d}, ease: "none" }}, 0);
      tl.fromTo("#{p}-banner", {{ rotation: -2 }}, {{ rotation: 2, duration: .8, repeat: {_rep(d, .8)}, yoyo: true, ease: "sine.inOut", svgOrigin: "540 170", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- loja de celular (neon)
def loja_celular(p, d):
    phones = "".join(f'<g><rect x="{x}" y="{y}" width="64" height="118" rx="12" fill="#20232b" stroke="{INK}" stroke-width="5"/><rect x="{x + 7}" y="{y + 10}" width="50" height="94" rx="6" fill="{c}"/>'
                     f'<rect x="{x + 6}" y="{y + 126}" width="52" height="18" rx="4" fill="#fff" stroke="{INK}" stroke-width="3"/></g>'
                     for (x, y), c in zip([(60 + 92*i, 470 + 200*j) for j in range(2) for i in range(4)] + [(700 + 92*i, 470 + 200*j) for j in range(2) for i in range(4)],
                                          [CYAN, MAG, YEL, GRN, "#9b5de5", "#ff8fa3", CYAN, YEL] * 2))
    inner = f'''
  <rect width="{W}" height="{H}" fill="#1b1340"/>
  <g opacity=".5">{"".join(f'<rect x="{x}" y="0" width="2" height="1200" fill="#3a2d7a"/>' for x in range(30, W, 60))}</g>
  <g id="{p}-neon"><rect x="180" y="200" width="720" height="130" rx="30" fill="none" stroke="{MAG}" stroke-width="14"/>
    <text x="540" y="292" text-anchor="middle" font-family="Archivo Black" font-size="78" fill="#fff" stroke="{MAG}" stroke-width="4">CELULAR JÁ</text></g>
  <rect x="40" y="420" width="400" height="460" fill="#2a2160" stroke="{INK}" stroke-width="8"/><rect x="640" y="420" width="400" height="460" fill="#2a2160" stroke="{INK}" stroke-width="8"/>
  {"".join(f'<rect x="{x}" y="{y}" width="400" height="16" fill="#8d99ae" stroke="{INK}" stroke-width="5"/>' for x in (40, 640) for y in (610, 810))}
  {phones}
  <g><rect x="460" y="420" width="160" height="230" rx="16" fill="{YEL}" stroke="{INK}" stroke-width="7"/><text x="540" y="500" text-anchor="middle" font-family="Archivo Black" font-size="36" fill="{RED}">12X</text>
    <text x="540" y="560" text-anchor="middle" font-family="Archivo Black" font-size="26" fill="{INK}">SEM</text><text x="540" y="600" text-anchor="middle" font-family="Archivo Black" font-size="26" fill="{INK}">JUROS*</text></g>
  <path d="M0 1100 L{W} 1100 L{W} {H} L0 {H} Z" fill="#2e2a4f"/>
  <g opacity=".6">{"".join(f'<rect x="{x}" y="{y}" width="100" height="100" fill="#3b3666"/>' for x in range(0, W, 200) for y in range(1100, H, 200))}{"".join(f'<rect x="{x}" y="{y}" width="100" height="100" fill="#3b3666"/>' for x in range(100, W, 200) for y in range(1200, H, 200))}</g>
  <path id="{p}-light" d="M380 330 L700 330 L960 1100 L120 1100 Z" fill="{MAG}" opacity=".08"/>
  <path d="M-20 1180 L1100 1180 L1100 1260 L-20 1260 Z" fill="#e9ecef" stroke="{INK}" stroke-width="9"/>
  <path d="M-20 1260 L1100 1260 L1100 1700 L-20 1700 Z" fill="#5c5470" stroke="{INK}" stroke-width="9"/>
  <g font-family="Archivo Black" font-size="30" fill="{YEL}"><text x="60" y="1330">✓ SEGURO</text><text x="60" y="1380">✓ CAPINHA</text><text x="60" y="1430">✓ PELÍCULA</text><text x="60" y="1480">✓ GARANTIA ESTENDIDA</text></g>'''
    js = f'''
      tl.fromTo("#{p}-neon", {{ opacity: 1 }}, {{ opacity: .55, duration: .12, repeat: {_rep(d, 1.4)}, repeatDelay: 1.3, yoyo: true, ease: "steps(1)", immediateRender: false }}, .4);
      tl.fromTo("#{p}-light", {{ opacity: .05 }}, {{ opacity: .12, duration: 1, repeat: {_rep(d, 1)}, yoyo: true, ease: "sine.inOut", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- praça de alimentação / pastelaria
def pastelaria(p, d):
    inner = f'''
  <rect width="{W}" height="{H}" fill="#ffe0b2"/>
  <g opacity=".4">{"".join(f'<rect x="{x}" y="0" width="60" height="1150" fill="#ffd08a"/>' for x in range(0, W, 120))}</g>
  <g><path d="M60 180 L1020 180 L1060 300 L20 300 Z" fill="{RED}" stroke="{INK}" stroke-width="9"/>
    {"".join(f'<path d="M{20 + 104*i} 300 q52 60 104 0" fill="{"#fff" if i % 2 else RED}" stroke="{INK}" stroke-width="6"/>' for i in range(10))}
    <text x="540" y="268" text-anchor="middle" font-family="Archivo Black" font-size="66" fill="#fff" stroke="{INK}" stroke-width="3">PASTEL DO JAPA</text></g>
  <g><rect x="80" y="420" width="440" height="360" fill="#fff8e1" stroke="{INK}" stroke-width="8"/>
    <g font-family="Archivo Black" font-size="34" fill="{INK}"><text x="110" y="480">CARDÁPIO</text>
      <text x="110" y="545">PASTEL ........ R$ 8</text><text x="110" y="600">CALDO DE CANA . R$ 7</text><text x="110" y="655">COMBO ........ R$ 14</text></g>
    <path d="M100 590 L500 610" stroke="{RED}" stroke-width="8"/><text x="300" y="740" text-anchor="middle" font-family="Archivo Black" font-size="28" fill="{RED}">(não dá pro Armando)</text></g>
  <g stroke="{INK}" stroke-width="7"><rect x="600" y="430" width="400" height="320" fill="#c0c7cc"/><rect x="630" y="470" width="340" height="140" fill="#ffd166"/>
    <g id="{p}-oil">{"".join(f'<circle cx="{650 + 40*i}" cy="{540 + (i % 2) * 20}" r="10" fill="#fff" stroke="none" opacity=".8"/>' for i in range(8))}</g>
    <path d="M660 520 q60 -40 140 0 q-70 30 -140 0 Z M820 560 q60 -40 130 0 q-65 30 -130 0 Z" fill="#e9a23b"/></g>
  <g id="{p}-steam" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".8"><path d="M700 450 q-20 -40 0 -80"/><path d="M800 450 q20 -40 0 -80"/><path d="M900 450 q-20 -40 0 -80"/></g>
  <rect x="0" y="820" width="{W}" height="120" fill="#8a5a3b" stroke="{INK}" stroke-width="9"/>
  <g stroke="{INK}" stroke-width="6"><rect x="120" y="760" width="70" height="60" fill="#8ce99a"/><path d="M380 820 l40 -80 l40 80 Z" fill="#ffd166"/><rect x="820" y="750" width="60" height="70" fill="#fff"/></g>
  <rect x="0" y="940" width="{W}" height="{H - 940}" fill="#d6c3a5"/>
  <g opacity=".5">{"".join(f'<rect x="{x}" y="{y}" width="90" height="90" fill="#c4ae8c"/>' for x in range(0, W, 180) for y in range(940, H, 180))}{"".join(f'<rect x="{x}" y="{y}" width="90" height="90" fill="#c4ae8c"/>' for x in range(90, W, 180) for y in range(1030, H, 180))}</g>
  <g stroke="{INK}" stroke-width="7"><ellipse cx="200" cy="1520" rx="170" ry="40" fill="#fff"/><rect x="190" y="1560" width="20" height="200" fill="#6c757d"/>
    <ellipse cx="880" cy="1520" rx="170" ry="40" fill="#fff"/><rect x="870" y="1560" width="20" height="200" fill="#6c757d"/>
    <path d="M830 1500 l30 -60 l40 0 l10 60 Z" fill="#ff8fa3"/><path d="M150 1505 q50 -30 100 0 Z" fill="#ffd166"/></g>'''
    js = f'''
      tl.fromTo("#{p}-steam", {{ y: 10, opacity: .9 }}, {{ y: -40, opacity: 0, duration: 1.1, repeat: {_rep(d, 1.1)}, ease: "none", immediateRender: false }}, 0);
      tl.fromTo("#{p}-oil", {{ y: 0 }}, {{ y: -6, duration: .2, repeat: {_rep(d, .2)}, yoyo: true, ease: "steps(1)", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- ponto de ônibus na rua
def ponto_onibus(p, d):
    rnd = random.Random(14)
    bl, x = [], -20
    while x < W:
        w, h = rnd.randint(140, 230), rnd.randint(380, 720)
        c = rnd.choice(["#e9c46a", "#f4a261", "#a8dadc", "#cdb4db", "#ffafcc"])
        bl.append(f'<rect x="{x}" y="{1000 - h}" width="{w}" height="{h}" fill="{c}" stroke="{INK}" stroke-width="7"/>'
                  + "".join(f'<rect x="{x + 20 + 46*i}" y="{1000 - h + 30 + 70*j}" width="28" height="40" fill="#fff6c2" stroke="{INK}" stroke-width="3"/>'
                            for i in range((w - 30) // 46) for j in range((h - 120) // 70)))
        x += w + 10
    inner = f'''
  <rect width="{W}" height="{H}" fill="#ffd6a5"/>
  <rect width="{W}" height="700" fill="#ffb4a2"/>
  <circle cx="820" cy="420" r="110" fill="#ffd23f" stroke="{INK}" stroke-width="7"/>
  <g id="{p}-clouds">{_cloud(80, 300, 1)}{_cloud(500, 240, .8)}{_cloud(900, 330, .7)}</g>
  {"".join(bl)}
  <rect x="0" y="1000" width="{W}" height="120" fill="#adb5bd" stroke="{INK}" stroke-width="7"/>
  <rect x="0" y="1120" width="{W}" height="300" fill="#495057"/>
  <g fill="#fff">{"".join(f'<rect x="{x}" y="1260" width="90" height="16"/>' for x in range(20, W, 180))}</g>
  <g id="{p}-car"><rect x="0" y="1150" width="260" height="90" rx="26" fill="#3a86ff" stroke="{INK}" stroke-width="7"/><path d="M50 1150 l40 -60 l110 0 l40 60 Z" fill="#9fd8ef" stroke="{INK}" stroke-width="7"/>
    <circle cx="60" cy="1245" r="30" fill="{INK}"/><circle cx="200" cy="1245" r="30" fill="{INK}"/></g>
  <rect x="0" y="1420" width="{W}" height="{H - 1420}" fill="#ced4da"/>
  <g stroke="#adb5bd" stroke-width="6">{"".join(f'<line x1="{x}" y1="1420" x2="{x}" y2="{H}"/>' for x in range(0, W, 150))}{"".join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>' for y in (1520, 1660, 1820))}</g>
  <g stroke="{INK}" stroke-width="8"><rect x="40" y="560" width="20" height="900" fill="#6c757d"/><rect x="1020" y="560" width="20" height="900" fill="#6c757d"/>
    <path d="M10 540 L1070 540 L1050 600 L30 600 Z" fill="#2a9d8f"/><rect x="760" y="640" width="250" height="360" fill="#fff"/>
    <rect x="300" y="1300" width="480" height="40" rx="10" fill="#8a6a4a"/></g>
  <g><text x="885" y="720" text-anchor="middle" font-family="Archivo Black" font-size="34" fill="{RED}">NOVO</text><text x="885" y="780" text-anchor="middle" font-family="Archivo Black" font-size="34" fill="{INK}">CELULAR</text>
    <text x="885" y="880" text-anchor="middle" font-size="90">📱</text><text x="885" y="970" text-anchor="middle" font-family="Archivo Black" font-size="24" fill="{INK}">12x sem dó</text></g>
  <g><rect x="90" y="420" width="150" height="110" rx="12" fill="#fff" stroke="{INK}" stroke-width="6"/><text x="165" y="475" text-anchor="middle" font-family="Archivo Black" font-size="34" fill="{INK}">🚌 801</text>
    <text x="165" y="512" text-anchor="middle" font-family="Archivo Black" font-size="22" fill="{RED}">ATRASADO</text><rect x="155" y="530" width="20" height="30" fill="#6c757d"/></g>'''
    js = f'''
      tl.fromTo("#{p}-car", {{ x: -400 }}, {{ x: 1500, duration: 2.6, repeat: {_rep(d, 3.4)}, repeatDelay: .8, ease: "none", immediateRender: false }}, .3);
      tl.fromTo("#{p}-clouds", {{ x: -30 }}, {{ x: 50, duration: {d}, ease: "none" }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- portaria do prédio
def portaria(p, d):
    boxes = "".join(f'<rect x="{60 + 64*i}" y="{430 + 60*j}" width="56" height="52" fill="#d4a373" stroke="{INK}" stroke-width="4"/><text x="{88 + 64*i}" y="{462 + 60*j}" text-anchor="middle" font-family="Archivo Black" font-size="16" fill="{INK}">{100*(j + 1) + i + 1}</text>'
                    for i in range(5) for j in range(4))
    inner = f'''
  <rect width="{W}" height="{H}" fill="#d8e2dc"/>
  <g opacity=".5">{"".join(f'<rect x="0" y="{y}" width="{W}" height="6" fill="#b8c4bd"/>' for y in range(60, 1150, 70))}</g>
  {boxes}
  <rect x="50" y="390" width="340" height="30" fill="#8a6a4a" stroke="{INK}" stroke-width="5"/><text x="220" y="414" text-anchor="middle" font-family="Archivo Black" font-size="22" fill="#fff">CORRESPONDÊNCIA</text>
  <g><rect x="440" y="300" width="300" height="760" fill="#adb5bd" stroke="{INK}" stroke-width="10"/><line x1="590" y1="300" x2="590" y2="1060" stroke="{INK}" stroke-width="7"/>
    <rect x="530" y="220" width="120" height="60" rx="8" fill="#111" stroke="{INK}" stroke-width="6"/><text id="{p}-floor" x="590" y="265" text-anchor="middle" font-family="Space Mono" font-weight="700" font-size="40" fill="{RED}">3 ▲</text>
    <circle cx="780" cy="640" r="18" fill="#fff" stroke="{INK}" stroke-width="5"/></g>
  <g><rect x="800" y="420" width="250" height="300" fill="#264653" stroke="{INK}" stroke-width="8"/><rect x="820" y="440" width="210" height="140" fill="#111" stroke="#555" stroke-width="6"/>
    <text x="925" y="520" text-anchor="middle" font-family="Space Mono" font-size="24" fill="#7CFC00">CAM 01 ●</text>
    <text x="925" y="660" text-anchor="middle" font-family="Archivo Black" font-size="30" fill="#fff">PORTARIA</text></g>
  {_frame(110, 700, 220, 160, f'<text x="220" y="790" text-anchor="middle" font-family="Archivo Black" font-size="22" fill="{RED}">PROIBIDO</text><text x="220" y="820" text-anchor="middle" font-family="Archivo Black" font-size="22" fill="{INK}">CHURRASCO 🔥</text>', "#fff", -3)}
  {_plant(70, 1060, 1, "#264653")}{_plant(1010, 1060, .9, "#264653")}
  <rect x="0" y="1060" width="{W}" height="{H - 1060}" fill="#f1faee"/>
  <g>{"".join(f'<rect x="{x}" y="{y}" width="120" height="120" fill="#a8dadc" opacity=".6"/>' for x in range(0, W, 240) for y in range(1060, H, 240))}{"".join(f'<rect x="{x}" y="{y}" width="120" height="120" fill="#a8dadc" opacity=".6"/>' for x in range(120, W, 240) for y in range(1180, H, 240))}</g>
  <rect x="300" y="1500" width="480" height="120" rx="20" fill="{RED}" stroke="{INK}" stroke-width="7"/><text x="540" y="1580" text-anchor="middle" font-family="Archivo Black" font-size="44" fill="#fff">BEM-VINDO</text>'''
    js = f'''
      tl.fromTo("#{p}-floor", {{ opacity: 1 }}, {{ opacity: .3, duration: .5, repeat: {_rep(d, .5)}, yoyo: true, ease: "steps(1)", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- banheiro (selfie no espelho)
def banheiro(p, d):
    tiles = "".join(f'<rect x="{x}" y="{y}" width="90" height="90" fill="{"#bde0fe" if (x // 90 + y // 90) % 2 else "#a2d2ff"}" stroke="#8ab6e0" stroke-width="3"/>'
                    for x in range(0, W, 90) for y in range(0, 1300, 90))
    inner = f'''
  {tiles}
  <g><rect x="140" y="200" width="800" height="900" rx="40" fill="#8c9ba5" stroke="{INK}" stroke-width="14"/><rect x="170" y="230" width="740" height="840" rx="26" fill="#dff3ff"/>
    <path id="{p}-shine" d="M230 260 L330 260 L200 600 L170 600 Z" fill="#fff" opacity=".6"/><path d="M820 700 L880 700 L800 1000 L740 1000 Z" fill="#fff" opacity=".4"/>
    <g opacity=".5" fill="#fff">{"".join(f'<circle cx="{x}" cy="{y}" r="16"/>' for x, y in [(700, 320), (760, 380), (680, 420)])}</g></g>
  <g stroke="{INK}" stroke-width="7"><rect x="40" y="420" width="70" height="20" fill="#c0c7cc"/><path d="M50 440 L100 440 L100 760 L50 760 Z" fill="{MAG}"/>
    <g fill="#fff">{"".join(f'<rect x="{x}" y="{y}" width="12" height="320"/>' for x, y in [(60, 440), (80, 440)])}</g>
    <circle cx="1010" cy="620" r="45" fill="#fff"/><rect x="1000" y="520" width="20" height="60" fill="#c0c7cc"/><path d="M965 620 l90 0" stroke-dasharray="10 8"/></g>
  <rect x="0" y="1300" width="{W}" height="120" fill="#e9ecef" stroke="{INK}" stroke-width="9"/>
  <g stroke="{INK}" stroke-width="7"><ellipse cx="540" cy="1300" rx="240" ry="50" fill="#fff"/><path d="M540 1240 l0 -60 q0 -30 40 -30 l40 0" fill="none"/>
    <rect x="100" y="1200" width="80" height="100" rx="12" fill="#ffd166"/><rect x="200" y="1220" width="60" height="80" rx="10" fill="#8ce99a"/><path d="M880 1300 l20 -110 l40 0 l20 110 Z" fill="#fff"/>
    <g id="{p}-drop"><path d="M560 1230 q8 18 0 26 q-8 -8 0 -26 Z" fill="{CYAN}"/></g></g>
  <rect x="0" y="1420" width="{W}" height="{H - 1420}" fill="#ffe8d6"/>
  <g>{"".join(f'<rect x="{x}" y="{y}" width="80" height="80" fill="#ffd7ba"/>' for x in range(0, W, 160) for y in range(1420, H, 160))}{"".join(f'<rect x="{x}" y="{y}" width="80" height="80" fill="#ffd7ba"/>' for x in range(80, W, 160) for y in range(1500, H, 160))}</g>
  <ellipse cx="540" cy="1720" rx="260" ry="80" fill="#9b5de5" stroke="{INK}" stroke-width="8"/>'''
    js = f'''
      tl.fromTo("#{p}-drop", {{ y: 0, opacity: 1 }}, {{ y: 40, opacity: 0, duration: .9, repeat: {_rep(d, .9)}, ease: "power1.in", immediateRender: false }}, 0);
      tl.fromTo("#{p}-shine", {{ opacity: .3 }}, {{ opacity: .7, duration: 1.2, repeat: {_rep(d, 1.2)}, yoyo: true, ease: "sine.inOut", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- palco com plateia (reputação)
def palco(p, d):
    inner = f'''
  <rect width="{W}" height="{H}" fill="#2b0f3a"/>
  <path d="M0 0 L240 0 Q200 600 260 1300 L0 1300 Z" fill="#9d0208" stroke="{INK}" stroke-width="10"/><path d="M1080 0 L840 0 Q880 600 820 1300 L1080 1300 Z" fill="#9d0208" stroke="{INK}" stroke-width="10"/>
  <g stroke="#6a040f" stroke-width="10" fill="none">{"".join(f'<path d="M{x} 0 Q{x - 30} 600 {x + 10} 1300"/>' for x in (60, 140, 200))}{"".join(f'<path d="M{x} 0 Q{x + 30} 600 {x - 10} 1300"/>' for x in (1020, 940, 880))}</g>
  <path d="M0 0 L1080 0 L1080 150 Q540 230 0 150 Z" fill="#d00000" stroke="{INK}" stroke-width="10"/>
  {"".join(f'<circle cx="{x}" cy="190" r="22" fill="#ffd23f" stroke="{INK}" stroke-width="5"/>' for x in range(120, 1000, 110))}
  <path id="{p}-spot" d="M480 150 L600 150 L900 1300 L180 1300 Z" fill="#fff6c2" opacity=".14"/>
  <rect x="0" y="1300" width="{W}" height="90" fill="#8a5a3b" stroke="{INK}" stroke-width="9"/>
  <rect x="0" y="1390" width="{W}" height="{H - 1390}" fill="#140a1e"/>
  <g id="{p}-crowd">{_people_sil(p, 1700, 8, 21, p + "-cr")}{_people_sil(p, 1920, 7, 22, p + "-cr")}</g>
  <g id="{p}-stars" font-size="50">{"".join(f'<text x="{x}" y="{y}">⭐</text>' for x, y in [(300, 1450), (520, 1420), (740, 1460), (420, 1520), (640, 1530)])}</g>'''
    js = f'''
      tl.fromTo(".{p}-cr", {{ y: 0 }}, {{ y: -22, duration: .25, stagger: .06, repeat: {_rep(d, .5)}, yoyo: true, ease: "power1.inOut", immediateRender: false }}, 0);
      tl.fromTo("#{p}-spot", {{ opacity: .1 }}, {{ opacity: .22, duration: .8, repeat: {_rep(d, .8)}, yoyo: true, ease: "sine.inOut", immediateRender: false }}, 0);
      tl.fromTo("#{p}-stars", {{ y: 40, opacity: 0 }}, {{ y: -300, opacity: 1, duration: 2.5, repeat: {_rep(d, 2.5)}, ease: "power1.out", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- laje do Tonhão (fim de tarde)
def laje(p, d, night=False):
    rnd = random.Random(31)
    sky = "#2b2d6e" if night else "#ff9e6d"
    sky2 = "#46307a" if night else "#ffcf8a"
    houses = "".join(f'<rect x="{x}" y="{y}" width="{w}" height="{1000 - y}" fill="{c}" stroke="{INK}" stroke-width="6"/>'
                     + "".join(f'<rect x="{x + 16 + 40*i}" y="{y + 20 + 50*j}" width="22" height="28" fill="{"#ffd23f" if night or rnd.random() > .6 else "#5c4b6b"}" stroke="{INK}" stroke-width="3"/>' for i in range((w - 20) // 40) for j in range((1000 - y - 30) // 50))
                     for x, y, w, c in [(rnd.randint(-30, 1000), rnd.randint(640, 820), rnd.randint(110, 200), rnd.choice(["#e07a5f", "#f2cc8f", "#81b29a", "#f4f1de", "#d4a373"])) for _ in range(12)])
    bulbs = "".join(f'<circle class="{p}-bulb" cx="{x}" cy="{520 + 40*abs(((x - 30) % 260) - 130)/130:.0f}" r="13" fill="#ffd27a" stroke="{INK}" stroke-width="4"/>' for x in range(30, W, 70))
    inner = f'''
  <rect width="{W}" height="{H}" fill="{sky}"/><rect y="400" width="{W}" height="600" fill="{sky2}"/>
  {f'<circle cx="840" cy="300" r="60" fill="#fff4c2" stroke="{INK}" stroke-width="6"/>' if night else f'<circle cx="780" cy="560" r="120" fill="#ffd23f" stroke="{INK}" stroke-width="7"/>'}
  <g id="{p}-clouds">{_cloud(60, 300, .9)}{_cloud(600, 230, .7)}</g>
  {houses}
  <g stroke="{INK}" stroke-width="7"><rect x="760" y="560" width="230" height="200" rx="16" fill="#3a86ff"/><rect x="745" y="540" width="260" height="40" rx="10" fill="#2b5fbf"/>
    <rect x="790" y="760" width="20" height="240" fill="#6c757d"/><rect x="940" y="760" width="20" height="240" fill="#6c757d"/>
    <text x="875" y="680" text-anchor="middle" font-family="Archivo Black" font-size="30" fill="#fff" stroke="none">ÁGUA</text></g>
  <path d="M0 500 C130 560 130 560 260 500 C390 560 390 560 520 500 C650 560 650 560 780 500 C910 560 910 560 1080 510" fill="none" stroke="{INK}" stroke-width="4"/>{bulbs}
  <g><line x1="0" y1="900" x2="700" y2="860" stroke="{INK}" stroke-width="4"/>
    <g id="{p}-clothes" stroke="{INK}" stroke-width="5"><path d="M80 895 l90 -5 l10 100 l-110 6 Z" fill="{RED}"/><path d="M250 885 l70 -4 l0 70 l-20 0 l-5 -40 l-20 40 l-20 0 Z" fill="#3a86ff"/>
      <path d="M420 878 l100 -6 l-10 130 l-80 4 Z" fill="#fff"/><text x="465" y="950" text-anchor="middle" font-family="Archivo Black" font-size="20" fill="{RED}" stroke="none">FLA</text></g></g>
  <rect x="0" y="1000" width="{W}" height="60" fill="#bc6c25" stroke="{INK}" stroke-width="8"/>
  <rect x="0" y="1060" width="{W}" height="{H - 1060}" fill="#a3a3a3"/>
  <g stroke="#8d8d8d" stroke-width="6">{"".join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>' for y in range(1130, H, 110))}{"".join(f'<line x1="{x}" y1="1060" x2="{x}" y2="{H}"/>' for x in range(90, W, 230))}</g>
  <g stroke="{INK}" stroke-width="8"><rect x="680" y="1180" width="360" height="260" fill="#6c757d"/><rect x="660" y="1150" width="400" height="40" fill="#495057"/>
    <rect x="720" y="1440" width="30" height="200" fill="#495057"/><rect x="970" y="1440" width="30" height="200" fill="#495057"/>
    <g fill="#9d0208">{"".join(f'<rect x="{x}" y="1110" width="60" height="40" rx="10"/>' for x in (720, 820, 920))}</g></g>
  <g id="{p}-smoke" fill="#e9ecef" stroke="{INK}" stroke-width="4" opacity=".85">{"".join(f'<circle cx="{x}" cy="1060" r="{r}"/>' for x, r in [(760, 30), (860, 40), (960, 34)])}</g>
  <g stroke="{INK}" stroke-width="6"><rect x="40" y="1540" width="240" height="140" rx="14" fill="{RED}"/><rect x="40" y="1520" width="240" height="40" rx="10" fill="#fff"/>
    <text x="160" y="1630" text-anchor="middle" font-family="Archivo Black" font-size="28" fill="#fff" stroke="none">GELADO</text>
    {"".join(f'<rect x="{x}" y="1470" width="34" height="60" rx="6" fill="#ffd23f"/>' for x in (330, 380))}</g>'''
    js = f'''
      tl.fromTo("#{p}-smoke", {{ y: 0, opacity: .9, scale: .8 }}, {{ y: -260, opacity: 0, scale: 1.4, duration: 1.6, repeat: {_rep(d, 1.6)}, ease: "power1.out", svgOrigin: "860 1060", immediateRender: false }}, 0);
      tl.fromTo("#{p}-clothes", {{ skewX: -4 }}, {{ skewX: 4, duration: .9, repeat: {_rep(d, .9)}, yoyo: true, ease: "sine.inOut", svgOrigin: "350 880", immediateRender: false }}, 0);
      tl.fromTo(".{p}-bulb", {{ opacity: 1 }}, {{ opacity: .4, duration: .4, stagger: .08, repeat: {_rep(d, .8)}, yoyo: true, ease: "steps(1)", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- decisão: churrasco à noite | quarto com despertador
def decisao_split(p, d):
    rnd = random.Random(41)
    stars = "".join(f'<circle cx="{rnd.randint(10, 530)}" cy="{rnd.randint(20, 600)}" r="3" fill="#fff"/>' for _ in range(25))
    inner = f'''
  <rect width="540" height="{H}" fill="#3c1642"/>{stars}
  <path d="M0 520 C90 570 180 570 270 520 C360 570 450 570 540 520" fill="none" stroke="{INK}" stroke-width="4"/>
  {"".join(f'<circle class="{p}-bulb" cx="{x}" cy="{540 + (x % 90) / 3:.0f}" r="13" fill="#ffd27a" stroke="{INK}" stroke-width="4"/>' for x in range(30, 540, 60))}
  <g stroke="{INK}" stroke-width="7"><rect x="60" y="1340" width="300" height="200" fill="#6c757d"/><rect x="40" y="1310" width="340" height="36" fill="#495057"/>
    <g fill="#9d0208">{"".join(f'<rect x="{x}" y="1270" width="56" height="40" rx="10"/>' for x in (80, 170, 260))}</g></g>
  <g id="{p}-smoke" fill="#e9ecef" stroke="{INK}" stroke-width="4" opacity=".8">{"".join(f'<circle cx="{x}" cy="1240" r="{r}"/>' for x, r in [(120, 28), (210, 36), (300, 30)])}</g>
  <rect y="1540" width="540" height="{H - 1540}" fill="#8d8d8d"/>
  <rect x="540" width="540" height="{H}" fill="#1d3557"/>
  <g><rect x="620" y="300" width="380" height="300" fill="#0c1033" stroke="{INK}" stroke-width="10"/><circle cx="900" cy="380" r="40" fill="#fff4c2" stroke="{INK}" stroke-width="5"/>
    <line x1="810" y1="300" x2="810" y2="600" stroke="{INK}" stroke-width="8"/></g>
  <g stroke="{INK}" stroke-width="8"><rect x="560" y="1280" width="520" height="260" rx="20" fill="#457b9d"/><rect x="580" y="1250" width="200" height="90" rx="30" fill="#fff"/>
    <rect x="560" y="1340" width="520" height="200" fill="#a8dadc"/><rect x="560" y="1100" width="40" height="440" fill="#6f5238"/></g>
  <g id="{p}-alarm"><circle cx="960" cy="1180" r="70" fill="{RED}" stroke="{INK}" stroke-width="8"/><circle cx="960" cy="1180" r="52" fill="#fff" stroke="{INK}" stroke-width="5"/>
    <text x="960" y="1195" text-anchor="middle" font-family="Space Mono" font-weight="700" font-size="32" fill="{INK}">6:00</text>
    <circle cx="905" cy="1110" r="22" fill="{YEL}" stroke="{INK}" stroke-width="6"/><circle cx="1015" cy="1110" r="22" fill="{YEL}" stroke="{INK}" stroke-width="6"/></g>
  <rect y="1540" x="540" width="540" height="{H - 1540}" fill="#5a3b2b"/>
  <path d="M540 0 L540 {H}" stroke="{INK}" stroke-width="16"/><path d="M540 0 L540 {H}" stroke="#fff" stroke-width="5" stroke-dasharray="30 24"/>'''
    js = f'''
      tl.fromTo("#{p}-alarm", {{ rotation: -6 }}, {{ rotation: 6, duration: .08, repeat: {_rep(d, .16) }, yoyo: true, ease: "none", svgOrigin: "960 1180", immediateRender: false }}, 0);
      tl.fromTo("#{p}-smoke", {{ y: 0, opacity: .9 }}, {{ y: -200, opacity: 0, duration: 1.5, repeat: {_rep(d, 1.5)}, ease: "power1.out", immediateRender: false }}, 0);
      tl.fromTo(".{p}-bulb", {{ opacity: 1 }}, {{ opacity: .4, duration: .4, stagger: .1, repeat: {_rep(d, .8)}, yoyo: true, ease: "steps(1)", immediateRender: false }}, 0);'''
    return _svg(p, inner), js


# ---------------------------------------------------------------- quarto à noite (deitado com o celular)
def quarto_noite(p, d):
    rnd = random.Random(51)
    stars = "".join(f'<circle class="{p}-st" cx="{rnd.randint(640, 1000)}" cy="{rnd.randint(240, 560)}" r="3" fill="#fff"/>' for _ in range(16))
    inner = f'''
  <rect width="{W}" height="{H}" fill="#1b2240"/>
  <g opacity=".5">{"".join(f'<path d="M{x} 0 L{x} 1200" stroke="#232c52" stroke-width="30"/>' for x in range(30, W, 90))}</g>
  <g><rect x="620" y="220" width="400" height="360" fill="#0c1033" stroke="{INK}" stroke-width="14"/>{stars}
    <circle cx="900" cy="320" r="44" fill="#fff4c2" stroke="{INK}" stroke-width="5"/><path d="M630 500 L700 460 L760 500 L830 440 L900 500 L1010 470 L1010 570 L630 570 Z" fill="#070b1f"/>
    <line x1="820" y1="220" x2="820" y2="580" stroke="{INK}" stroke-width="10"/><line x1="620" y1="400" x2="1020" y2="400" stroke="{INK}" stroke-width="10"/></g>
  {_frame(80, 260, 230, 300, f'<text x="195" y="400" text-anchor="middle" font-size="90">🎸</text><text x="195" y="500" text-anchor="middle" font-family="Archivo Black" font-size="26" fill="{INK}">ROCK 90</text>', "#e63946", -4)}
  <g><rect x="340" y="560" width="230" height="16" fill="#8a6a4a" stroke="{INK}" stroke-width="5"/>{_books(350, 560, 6, 52, (50, 80))}</g>
  <path d="M0 980 Q0 900 80 900 L1000 900 Q1080 900 1080 980 L1080 1500 L0 1500 Z" fill="#6f4e37" stroke="{INK}" stroke-width="10"/>
  <rect x="0" y="1120" width="{W}" height="420" fill="#e76f51" stroke="{INK}" stroke-width="9"/>
  <g stroke="#c44536" stroke-width="8">{"".join(f'<line x1="{x}" y1="1120" x2="{x}" y2="1540"/>' for x in range(90, W, 180))}{"".join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>' for y in (1260, 1400))}</g>
  <rect x="0" y="1540" width="{W}" height="{H - 1540}" fill="#3d2b20"/>
  <g stroke="{INK}" stroke-width="7"><rect x="850" y="1580" width="200" height="200" fill="#5a3b2b"/><rect x="880" y="1520" width="60" height="60" rx="10" fill="#fff"/></g>
  <rect width="{W}" height="{H}" fill="#05070f" opacity=".35"/>'''
    js = f'''
      tl.fromTo(".{p}-st", {{ opacity: 1 }}, {{ opacity: .2, duration: .5, stagger: .1, repeat: {_rep(d, 1)}, yoyo: true, ease: "steps(1)", immediateRender: false }}, 0);'''
    return _svg(p, inner), js
