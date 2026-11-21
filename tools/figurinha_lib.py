"""Estilo "Álbum de Figurinhas" da série O Chat Faz um Craque.

Personagens de papel recortado (borda branca + sombra de papel), fundo kraft,
fita adesiva, giz de prancheta e movimento em "stop motion" (12 qps).
Cada função devolve SVG/HTML; `p` é o prefixo de ids.
"""
import math
import random

INK = "#1d1a17"
KRAFT = "#c9a56d"
PAPER = "#fffdf3"
RED = "#e63946"
GREEN = "#2a9d4b"
YEL = "#ffd23f"
BLUE = "#2b59c3"
SKIN_B = "#8a5a3c"      # Biel
SKIN_B2 = "#6e4429"
SKIN_K = "#e3b083"      # Kauã
SKIN_V = "#c98c64"      # Vó Cida


def cut(sil, detail="", shadow=(8, 10), border=16):
    """Peça de papel recortado: sombra + borda branca + desenho."""
    dx, dy = shadow
    return (f'<g fill="#000" opacity=".22" transform="translate({dx} {dy})">{sil}</g>'
            f'<g fill="#fff" stroke="#fff" stroke-width="{border}" stroke-linejoin="round">{sil}</g>'
            f'{detail}')


def kraft(p, color=KRAFT, seed=1):
    rnd = random.Random(seed)
    specks = "".join(f'<circle cx="{rnd.uniform(0, 1080):.0f}" cy="{rnd.uniform(0, 1920):.0f}" r="{rnd.uniform(1, 3.2):.1f}" '
                     f'fill="{rnd.choice(["#8a6a3a", "#e8d2a6", "#a8834d"])}" opacity=".55"/>' for _ in range(260))
    fibers = "".join(f'<path d="M{(x := rnd.uniform(0, 1080)):.0f} {(y := rnd.uniform(0, 1920)):.0f} q{rnd.uniform(-30, 30):.0f} {rnd.uniform(-8, 8):.0f} {rnd.uniform(20, 70):.0f} {rnd.uniform(-6, 6):.0f}" '
                     f'stroke="#9c7a45" stroke-width="2" fill="none" opacity=".35"/>' for _ in range(120))
    return (f'<svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0">'
            f'<defs><radialGradient id="{p}-vg" cx="50%" cy="45%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/>'
            f'<stop offset="100%" stop-color="#3b2410" stop-opacity=".45"/></radialGradient></defs>'
            f'<rect width="1080" height="1920" fill="{color}"/>{specks}{fibers}<rect width="1080" height="1920" fill="url(#{p}-vg)"/></svg>')


def tape(x, y, w=170, rot=-8, color="#f3e7b8"):
    jag = " ".join(f"{w + (6 if i % 2 else 0)},{i * 9}" for i in range(7))
    jag2 = " ".join(f"{(6 if i % 2 else 0)},{54 - i * 9}" for i in range(7))
    return (f'<svg style="position:absolute;left:{x}px;top:{y}px;z-index:9;overflow:visible" width="{w + 10}" height="60" data-layout-ignore>'
            f'<g transform="rotate({rot} {w / 2} 27)"><polygon points="0,0 {jag} {jag2}" fill="{color}" opacity=".82"/></g></svg>')


# ------------------------------------------------------------------ Biel
def tier(v):
    """Nível visual de uma barra: 0 (0–25), 1 (26–50), 2 (51–69), 3 (70+)."""
    return 0 if v <= 25 else 1 if v <= 50 else 2 if v < 70 else 3


def biel(p, stats=None):
    """Biel, corpo inteiro, boneco de papel. viewBox 0 0 500 1000.

    stats = {"s": ⚽ habilidade, "f": 💪 físico, "m": 💰 dinheiro, "c": 🧠 cabeça} (0–100)
    muda pés, corpo, roupa e expressão por nível. Sem stats = visual do DIA 1.
    Juntas: {p}-head, {p}-armL/-armR, {p}-legL/-legR. Rosto: classe {p}-pupil,
    bocas {p}-m-smile/-shy/-o/-sad, {p}-eyes / {p}-eyes-closed, {p}-br-up/-worry.
    """
    st = stats or {"s": 35, "f": 20, "m": 5, "c": 25}
    sT, fT, mT, cT = tier(st["s"]), tier(st["f"]), tier(st["m"]), tier(st["c"])
    legacy = stats is None
    lw = [24, 28, 32, 37][fT]          # meia largura de braços e pernas
    sh = [0, 8, 18, 30][fT]            # ombros mais largos
    hair = "".join(f'<circle cx="{250 + 100 * math.cos(a):.0f}" cy="{205 + 95 * math.sin(a):.0f}" r="30"/>'
                   for a in [math.pi * (1.05 + i * 0.09) for i in range(11)])
    # roupa por dinheiro
    shirt = [RED, RED, GREEN, BLUE][mT]
    shorts = [BLUE, BLUE, "#f5f5f5", BLUE][mT]
    # pés por habilidade
    def foot(x, side):
        fx = x + (6 if side == "R" else -6)
        if sT == 0:  # chinelo
            sil = f'<ellipse cx="{fx}" cy="905" rx="50" ry="20"/>'
            det = (f'<ellipse cx="{fx}" cy="905" rx="50" ry="20" fill="#3fa7d6"/><ellipse cx="{fx}" cy="898" rx="40" ry="12" fill="{SKIN_B}"/>'
                   f'<path d="M{x - 18} 890 Q{x} 870 {x + 18} 890" stroke="#e8f6ff" stroke-width="7" fill="none"/>')
            return sil, det
        col = {1: "#2b2b2b", 2: "#2b2b2b", 3: "#f2c230"}[sT]
        sil = f'<path d="M{fx - 48} 880 L{fx + 30} 875 C{fx + 60} 880 {fx + 62} 925 {fx + 40} 925 L{fx - 48} 925 Z"/>'
        det = f'<path d="M{fx - 48} 880 L{fx + 30} 875 C{fx + 60} 880 {fx + 62} 925 {fx + 40} 925 L{fx - 48} 925 Z" fill="{col}"/>'
        det += "".join(f'<rect x="{fx - 40 + k * 24}" y="922" width="10" height="10" fill="#9a9a9a"/>' for k in range(4))
        if sT == 1:  # emprestada, com fita
            det += f'<rect x="{fx - 20}" y="882" width="40" height="18" fill="#cfd4d9" transform="rotate(-8 {fx} 891)"/>'
        if sT >= 2:
            det += f'<path d="M{fx - 40} 900 L{fx + 40} 896" stroke="{"#fff" if sT == 2 else "#fff6c2"}" stroke-width="6"/>'
        if sT == 3:
            det += f'<path d="M{fx + 52} 870 l5 -14 l5 14 l14 5 l-14 5 l-5 14 l-5 -14 l-14 -5 Z" fill="#fff" stroke="{INK}" stroke-width="2"/>'
        return sil, det
    legs = ""
    for side, x in (("L", 215), ("R", 285)):
        fsil, fdet = foot(x, side)
        sil = f'<path d="M{x - lw - 2} 600 L{x + lw + 2} 600 L{x + lw - 2} 880 L{x - lw + 2} 880 Z"/>' + fsil
        det = (f'<path d="M{x - lw - 2} 600 L{x + lw + 2} 600 L{x + lw - 2} 880 L{x - lw + 2} 880 Z" fill="{SKIN_B}"/>'
               f'<path d="M{x - lw - 2} 600 L{x - 4} 600 L{x - 6} 880 L{x - lw + 2} 880 Z" fill="{SKIN_B2}" opacity=".5"/>')
        if fT == 3:
            det += f'<path d="M{x - 14} 700 Q{x} 730 {x + 14} 700" stroke="{SKIN_B2}" stroke-width="5" fill="none"/>'
        if sT >= 1:  # meião
            det += f'<path d="M{x - lw + 1} 790 L{x + lw - 1} 790 L{x + lw - 2} 880 L{x - lw + 2} 880 Z" fill="{["#fff", "#fff", "#fff", "#f2c230"][sT]}"/>'
        legs += f'<g id="{p}-leg{side}">{cut(sil, det + fdet)}</g>'
    arms = ""
    for side, x, dx in (("L", 160 - sh, -40 - sh // 2), ("R", 340 + sh, 40 + sh // 2)):
        sil = f'<path d="M{x - lw} 345 L{x + lw} 345 L{x + dx + lw - 2} 560 L{x + dx - lw + 2} 560 Z"/><circle cx="{x + dx}" cy="570" r="{28 + fT * 2}"/>'
        sleeve = shirt if mT < 3 else BLUE
        det = (f'<path d="M{x - lw} 345 L{x + lw} 345 L{x + dx + lw - 2} 560 L{x + dx - lw + 2} 560 Z" fill="{SKIN_B if mT < 3 else BLUE}"/>'
               f'<path d="M{x - lw - 6} 335 L{x + lw + 6} 335 L{x + lw + 2} 420 L{x - lw - 2} 420 Z" fill="{sleeve}"/>'
               f'<circle cx="{x + dx}" cy="570" r="{28 + fT * 2}" fill="{SKIN_B}"/>')
        if mT == 3:
            det += f'<path d="M{x + dx // 3 - 4} 345 L{x + dx - 4} 560" stroke="#fff" stroke-width="7"/>'
        if fT >= 2 and mT < 3:
            det += f'<path d="M{x - 10} 450 Q{x + dx // 2} 470 {x + 10} 450" stroke="{SKIN_B2}" stroke-width="5" fill="none"/>'
        if side == "L" and cT == 3:  # faixa de capitão
            det += (f'<rect x="{x - lw - 4}" y="378" width="{2 * lw + 8}" height="30" fill="{YEL}" stroke="{INK}" stroke-width="4"/>'
                    f'<text data-layout-ignore x="{x}" y="402" text-anchor="middle" font-family="Bangers" font-size="26" fill="{INK}">C</text>')
        arms += f'<g id="{p}-arm{side}">{cut(sil, det)}</g>'
    tl, tr = 150 - sh, 350 + sh
    torso_sil = f'<path d="M{tl} 330 L{tr} 330 L345 600 L155 600 Z"/><path d="M160 560 L340 560 L345 660 L155 660 Z"/>'
    torso_det = (f'<path d="M{tl} 330 L{tr} 330 L345 600 L155 600 Z" fill="{shirt}"/>'
                 f'<path d="M{tl} 330 L{tl + 50} 330 L205 600 L155 600 Z" fill="#000" opacity=".12"/>'
                 f'<path d="M215 330 Q250 370 285 330" fill="{SKIN_B}"/>')
    if mT == 3:  # agasalho com zíper e listras
        torso_det += (f'<path d="M250 345 L250 600" stroke="#dfe6ec" stroke-width="8"/><path d="M{tl + 6} 340 L165 600 M{tr - 6} 340 L335 600" stroke="#fff" stroke-width="9"/>'
                      f'<path d="M210 330 L250 360 L290 330" fill="none" stroke="#dfe6ec" stroke-width="10"/>')
    else:
        torso_det += f'<text data-layout-ignore x="252" y="500" text-anchor="middle" font-family="Permanent Marker" font-size="110" fill="#fff">10</text>'
        if mT == 2:  # uniforme do time da várzea
            torso_det += (f'<path d="M{tl} 380 L{tr} 380" stroke="#fff" stroke-width="16"/>'
                          f'<circle cx="305" cy="365" r="22" fill="{YEL}" stroke="{INK}" stroke-width="4"/>')
    if mT == 0:  # furo na camisa
        torso_det += f'<ellipse cx="310" cy="560" rx="14" ry="9" fill="{SKIN_B}"/><path d="M296 560 q14 -12 28 0" stroke="#7a2020" stroke-width="3" fill="none"/>'
    if fT == 3 and mT < 3:
        torso_det += f'<path d="M200 430 Q225 445 250 430 Q275 445 300 430" stroke="#000" stroke-width="4" fill="none" opacity=".25"/>'
    torso_det += (f'<path d="M160 560 L340 560 L345 660 L155 660 Z" fill="{shorts}"/><path d="M250 572 L250 650" stroke="#1d3d8a" stroke-width="5"/>')
    if mT == 0:
        torso_det += f'<path d="M300 640 l12 -14 l8 16" stroke="{SKIN_B}" stroke-width="6" fill="none"/>'
    # expressão por cabeça
    if legacy:
        show_mouth, show_brow = "smile", "up"
    else:
        show_mouth = ["sad", "shy", "smile", "smile"][cT]
        show_brow = "worry" if cT == 0 else "up"
    op = lambda k, v: "1" if k == v else "0"  # noqa: E731
    head_sil = f'<rect x="225" y="290" width="50" height="60"/><circle cx="250" cy="225" r="105"/><ellipse cx="146" cy="235" rx="22" ry="30"/><ellipse cx="354" cy="235" rx="22" ry="30"/>{hair}'
    head_det = f'''<rect x="225" y="290" width="50" height="60" fill="{SKIN_B2}"/>
      <ellipse cx="146" cy="235" rx="22" ry="30" fill="{SKIN_B}"/><ellipse cx="354" cy="235" rx="22" ry="30" fill="{SKIN_B}"/>
      <circle cx="250" cy="225" r="105" fill="{SKIN_B}"/>
      <path d="M150 230 Q160 320 250 330 Q190 300 175 220 Z" fill="{SKIN_B2}" opacity=".45"/>
      <g fill="#1a1210">{hair}<rect x="160" y="130" width="180" height="60" rx="30"/></g>
      {'<path d="M170 150 C210 110 300 105 340 140" stroke="#fff" stroke-width="6" fill="none" opacity=".4"/>' if cT >= 2 else ''}
      <g id="{p}-br-up" opacity="{op(show_brow, "up")}" stroke="#1a1210" stroke-width="10" stroke-linecap="round"><path d="M195 185 L232 178"/><path d="M268 178 L305 185"/></g>
      <g id="{p}-br-worry" opacity="{op(show_brow, "worry")}" stroke="#1a1210" stroke-width="10" stroke-linecap="round"><path d="M195 178 L232 190"/><path d="M268 190 L305 178"/></g>
      <g id="{p}-eyes"><ellipse cx="212" cy="222" rx="24" ry="28" fill="#fff"/><ellipse cx="288" cy="222" rx="24" ry="28" fill="#fff"/>
        <g class="{p}-pupil"><circle cx="215" cy="226" r="12" fill="{INK}"/><circle cx="291" cy="226" r="12" fill="{INK}"/>
        <circle cx="219" cy="221" r="4" fill="#fff"/><circle cx="295" cy="221" r="4" fill="#fff"/></g></g>
      <g id="{p}-eyes-closed" opacity="0" stroke="{INK}" stroke-width="7" fill="none" stroke-linecap="round"><path d="M192 226 Q212 238 232 226"/><path d="M268 226 Q288 238 308 226"/></g>
      <path d="M250 235 Q240 265 252 272 Q262 270 262 262" fill="none" stroke="{SKIN_B2}" stroke-width="7" stroke-linecap="round"/>
      <g id="{p}-m-smile" opacity="{op(show_mouth, "smile")}"><path d="M200 282 Q250 330 300 282 Z" fill="#5a1a1a"/><rect x="236" y="284" width="14" height="14" fill="#fff"/><rect x="254" y="284" width="14" height="14" fill="#fff"/></g>
      <path id="{p}-m-shy" opacity="{op(show_mouth, "shy")}" d="M222 292 Q250 312 278 292" stroke="#5a1a1a" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse id="{p}-m-o" opacity="0" cx="250" cy="295" rx="18" ry="22" fill="#5a1a1a"/>
      <path id="{p}-m-sad" opacity="{op(show_mouth, "sad")}" d="M215 302 Q250 282 285 302" stroke="#5a1a1a" stroke-width="8" fill="none" stroke-linecap="round"/>'''
    return f'''<svg viewBox="0 0 500 1000" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <g id="{p}-rig">
    {legs}
    <g id="{p}-torso">{cut(torso_sil, torso_det)}</g>
    {arms}
    <g id="{p}-head">{cut(head_sil, head_det)}</g>
  </g></svg>'''


BIEL_TXT = {
    "s": [["chinelo de dedo", "bola murcha"], ["chuteira emprestada com fita"], ["chuteira usada inteira"], ["chuteira dourada brilhando ✨"]],
    "f": [["magrelo, braços de palito"], ["menos magro"], ["atlético"], ["forte e definido"]],
    "m": [["camisa furada", "shorts rasgado"], ["camisa nova, sem furo"], ["uniforme do time da várzea"], ["agasalho completo"]],
    "c": [["cara insegura"], ["sorriso tímido", "postura melhor"], ["sorriso confiante"], ["olhar de craque", "faixa de capitão"]],
}
BIEL_ICON = {"s": "⚽", "f": "💪", "m": "💰", "c": "🧠"}


def biel_changes(before, after):
    out = []
    for k in "sfmc":
        a, b = tier(before[k]), tier(after[k])
        if a != b:
            out.append((BIEL_ICON[k], "UPGRADE" if b > a else "DOWNGRADE", BIEL_TXT[k][b]))
    if all(tier(after[k]) == 3 for k in "sfmc") and not all(tier(before[k]) == 3 for k in "sfmc"):
        out.append(("✨", "FIGURINHA LENDÁRIA", ["craque completo!"]))
    return out


# ------------------------------------------------------------------ Vó Cida
def vo_cida(p):
    """Vó Cida, busto. viewBox 0 0 500 700. Boca {p}-m-talk / {p}-m-shout."""
    flowers = "".join(f'<circle cx="{x}" cy="{y}" r="11" fill="{c}"/>' for x, y in
                      [(160, 520), (230, 560), (300, 515), (350, 590), (200, 630), (280, 640), (120, 610), (380, 520)]
                      for c in [["#ff7eb6", "#ffd23f", "#7ec8ff"][(x // 10) % 3]])
    sil = '<path d="M60 700 C70 520 150 460 250 455 C350 460 430 520 440 700 Z"/><circle cx="250" cy="300" r="120"/><circle cx="250" cy="160" r="55"/>'
    det = f'''<path d="M60 700 C70 520 150 460 250 455 C350 460 430 520 440 700 Z" fill="#7b4f9e"/>
      <path d="M140 700 L150 500 L350 500 L360 700 Z" fill="#fff4e0"/>{flowers}
      <circle cx="250" cy="160" r="55" fill="#d9d9d9"/><path d="M215 140 q35 -25 70 0" stroke="#aaa" stroke-width="6" fill="none"/>
      <circle cx="250" cy="300" r="120" fill="{SKIN_V}"/>
      <path d="M130 270 C130 180 370 180 370 270 C340 220 160 220 130 270 Z" fill="#d9d9d9"/>
      <g fill="none" stroke="{INK}" stroke-width="7"><circle cx="205" cy="300" r="32" fill="rgba(255,255,255,.35)"/><circle cx="295" cy="300" r="32" fill="rgba(255,255,255,.35)"/><path d="M237 300 L263 300"/></g>
      <circle class="{p}-pupil" cx="205" cy="302" r="9" fill="{INK}"/><circle class="{p}-pupil" cx="295" cy="302" r="9" fill="{INK}"/>
      <path d="M180 262 L228 270 M272 270 L320 262" stroke="#9a9a9a" stroke-width="9" stroke-linecap="round"/>
      <circle cx="165" cy="350" r="20" fill="#ff8fa3" opacity=".6"/><circle cx="335" cy="350" r="20" fill="#ff8fa3" opacity=".6"/>
      <path d="M250 320 Q236 350 252 356" stroke="#9b5f3c" stroke-width="7" fill="none"/>
      <path id="{p}-m-talk" d="M215 380 Q250 400 285 380" stroke="#5a1a1a" stroke-width="9" fill="none" stroke-linecap="round"/>
      <ellipse id="{p}-m-shout" opacity="0" cx="250" cy="388" rx="34" ry="26" fill="#5a1a1a"/>'''
    return f'<svg viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg" overflow="visible"><g id="{p}-rig">{cut(sil, det)}</g></svg>'


# ------------------------------------------------------------------ Kauã
def kaua(p):
    """Kauã, busto. viewBox 0 0 500 600."""
    spikes = "".join(f'<path d="M{150 + i * 40} 170 L{170 + i * 40} {70 + (i % 2) * 25} L{190 + i * 40} 170 Z"/>' for i in range(5))
    sil = f'<path d="M50 600 C60 470 150 420 250 418 C350 420 440 470 450 600 Z"/><circle cx="250" cy="260" r="115"/>{spikes}<ellipse cx="135" cy="270" rx="20" ry="28"/><ellipse cx="365" cy="270" rx="20" ry="28"/>'
    det = f'''<path d="M50 600 C60 470 150 420 250 418 C350 420 440 470 450 600 Z" fill="#f2c230"/>
      <path d="M200 420 L250 470 L300 420" fill="none" stroke="#b8860b" stroke-width="10"/>
      <text data-layout-ignore x="250" y="560" text-anchor="middle" font-family="Bangers" font-size="80" fill="#b8860b">K</text>
      <ellipse cx="135" cy="270" rx="20" ry="28" fill="{SKIN_K}"/><ellipse cx="365" cy="270" rx="20" ry="28" fill="{SKIN_K}"/>
      <circle cx="250" cy="260" r="115" fill="{SKIN_K}"/>
      <g fill="#ffe066">{spikes}</g><path d="M140 200 C160 150 340 150 360 200 L360 215 L140 215 Z" fill="#4a3220"/>
      <rect x="135" y="190" width="230" height="30" rx="8" fill="{RED}"/>
      <path d="M190 250 L235 262 M265 262 L310 250" stroke="#4a3220" stroke-width="9" stroke-linecap="round"/>
      <ellipse cx="212" cy="282" rx="18" ry="12" fill="#fff"/><ellipse cx="288" cy="282" rx="18" ry="12" fill="#fff"/>
      <circle class="{p}-pupil" cx="216" cy="284" r="8" fill="{INK}"/><circle class="{p}-pupil" cx="292" cy="284" r="8" fill="{INK}"/>
      <path d="M250 290 L240 325 L258 328" stroke="#b07a52" stroke-width="6" fill="none"/>
      <path id="{p}-smirk" d="M205 350 Q255 372 300 338" stroke="#5a1a1a" stroke-width="9" fill="none" stroke-linecap="round"/>'''
    return f'<svg viewBox="0 0 500 600" xmlns="http://www.w3.org/2000/svg" overflow="visible"><g id="{p}-rig">{cut(sil, det)}</g></svg>'


def bigode(p):
    """Professor Bigode (avatar). viewBox 0 0 300 300."""
    sil = '<circle cx="150" cy="160" r="110"/><path d="M40 120 C40 40 260 40 260 120 L290 130 L40 130 Z"/>'
    det = f'''<circle cx="150" cy="160" r="110" fill="#b07a52"/>
      <path d="M40 120 C40 40 260 40 260 120 Z" fill="{GREEN}"/><path d="M150 120 L290 130 L150 135 Z" fill="#1e7a38"/>
      <circle cx="115" cy="155" r="10" fill="{INK}"/><circle cx="185" cy="155" r="10" fill="{INK}"/>
      <path d="M95 135 L130 142 M170 142 L205 135" stroke="{INK}" stroke-width="8"/>
      <path d="M80 205 C110 175 140 190 150 198 C160 190 190 175 220 205 C190 200 165 210 150 218 C135 210 110 200 80 205 Z" fill="#3a2a1f"/>
      <rect x="170" y="225" width="60" height="26" rx="10" fill="#c0c0c0" stroke="{INK}" stroke-width="4"/>
      <path d="M150 220 Q160 240 172 238" stroke="{INK}" stroke-width="4" fill="none"/>'''
    return f'<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" overflow="visible">{cut(sil, det)}</svg>'


def bola(p, face=True):
    """Bola murcha. viewBox 0 0 300 220."""
    sil = '<ellipse cx="150" cy="130" rx="130" ry="85"/>'
    det = f'''<ellipse cx="150" cy="130" rx="130" ry="85" fill="#f5f5f0"/>
      <path d="M150 95 L180 115 L170 150 L130 150 L120 115 Z" fill="{INK}"/>
      <path d="M40 120 L75 105 L85 140 L55 165 Z M260 120 L225 105 L215 140 L245 165 Z" fill="{INK}" opacity=".85"/>
      <path d="M60 80 Q150 40 240 80" stroke="#bbb" stroke-width="6" fill="none"/>
      <path d="M90 190 q60 20 120 0" stroke="#bbb" stroke-width="5" fill="none"/>'''
    f = ""
    if face:
        f = f'''<g id="{p}-face"><ellipse cx="110" cy="170" rx="14" ry="10" fill="#fff" stroke="{INK}" stroke-width="4"/>
          <ellipse cx="190" cy="170" rx="14" ry="10" fill="#fff" stroke="{INK}" stroke-width="4"/>
          <circle cx="110" cy="174" r="5" fill="{INK}"/><circle cx="190" cy="174" r="5" fill="{INK}"/>
          <path d="M95 155 L125 162 M205 155 L175 162" stroke="{INK}" stroke-width="5"/>
          <path d="M135 200 Q150 190 165 200" stroke="{INK}" stroke-width="5" fill="none"/></g>'''
    return f'<svg viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg" overflow="visible"><g id="{p}-rig">{cut(sil, det + f)}</g></svg>'


def chuteira(p):
    """Chuteira remendada. viewBox 0 0 640 380."""
    sil = '<path d="M40 280 C40 200 80 120 160 110 L260 60 L330 70 L360 160 C450 170 560 200 600 250 C620 280 610 320 580 330 L60 330 C45 330 40 310 40 280 Z"/>'
    det = f'''<path d="M40 280 C40 200 80 120 160 110 L260 60 L330 70 L360 160 C450 170 560 200 600 250 C620 280 610 320 580 330 L60 330 C45 330 40 310 40 280 Z" fill="#2b2b2b"/>
      <path d="M60 300 L590 300 L585 330 L60 330 Z" fill="#c7c7c7"/>
      {"".join(f'<rect x="{x}" y="330" width="26" height="24" rx="4" fill="#9a9a9a"/>' for x in (100, 200, 320, 440, 530))}
      <path d="M180 150 L520 230" stroke="#c0392b" stroke-width="22" opacity=".8"/>
      <g fill="#cfd4d9" opacity=".95"><rect x="250" y="190" width="150" height="46" transform="rotate(12 325 213)"/><rect x="430" y="210" width="120" height="40" transform="rotate(-8 490 230)"/></g>
      <g stroke="#aab0b6" stroke-width="3">{"".join(f'<line x1="{260 + k * 14}" y1="198" x2="{256 + k * 14}" y2="240"/>' for k in range(10))}</g>
      <path d="M210 120 L240 230 M250 105 L270 210 M290 95 L305 200" stroke="#fff" stroke-width="7" stroke-dasharray="14 10"/>
      <circle cx="560" cy="270" r="9" fill="#e0e0e0" stroke="{INK}" stroke-width="3"/>
      <path d="M140 250 l40 18 l-36 10 Z" fill="#e8c770" stroke="{INK}" stroke-width="3"/>'''
    return f'<svg viewBox="0 0 640 380" xmlns="http://www.w3.org/2000/svg" overflow="visible"><g id="{p}-rig">{cut(sil, det)}</g></svg>'


def silhouette(p, color="#6b6b6b", towel=False):
    """Pessoa genérica recortada (primo, personal trainer). viewBox 0 0 200 420."""
    sil = '<circle cx="100" cy="70" r="48"/><path d="M40 420 L45 160 C50 130 150 130 155 160 L160 420 Z"/>'
    tw = f'<path d="M150 190 L190 200 L180 300 L150 290 Z" fill="#fff"/>' if towel else ""
    det = f'<circle cx="100" cy="70" r="48" fill="{color}"/><path d="M40 420 L45 160 C50 130 150 130 155 160 L160 420 Z" fill="{color}"/>{tw}'
    return f'<svg viewBox="0 0 200 420" xmlns="http://www.w3.org/2000/svg" overflow="visible"><g id="{p}-rig">{cut(sil, det, (5, 6), 10)}</g></svg>'


def trofeu(p):
    sil = '<path d="M90 40 L210 40 L200 150 C195 190 105 190 100 150 Z"/><rect x="130" y="180" width="40" height="50"/><rect x="85" y="225" width="130" height="40"/><circle cx="70" cy="90" r="34"/><circle cx="230" cy="90" r="34"/>'
    det = f'''<g fill="none" stroke="#e0a800" stroke-width="16"><circle cx="70" cy="90" r="30"/><circle cx="230" cy="90" r="30"/></g>
      <path d="M90 40 L210 40 L200 150 C195 190 105 190 100 150 Z" fill="#ffcf33"/><path d="M120 50 L130 160" stroke="#fff6c2" stroke-width="12" opacity=".8"/>
      <rect x="130" y="180" width="40" height="50" fill="#e0a800"/><rect x="85" y="225" width="130" height="40" fill="#6b3e1f"/>'''
    return f'<svg viewBox="0 0 300 280" xmlns="http://www.w3.org/2000/svg" overflow="visible"><g id="{p}-rig">{cut(sil, det)}</g></svg>'


def picole(p):
    sil = '<rect x="40" y="10" width="100" height="160" rx="45"/><rect x="78" y="160" width="24" height="80" rx="8"/>'
    det = f'<rect x="78" y="160" width="24" height="80" rx="8" fill="#e8c38a"/><rect x="40" y="10" width="100" height="160" rx="45" fill="#ff8fb5"/><rect x="40" y="10" width="100" height="70" rx="40" fill="#ffd1e1"/>'
    return f'<svg viewBox="0 0 180 250" xmlns="http://www.w3.org/2000/svg" overflow="visible">{cut(sil, det)}</svg>'


CSS = f"""
  @font-face {{ font-family: 'Permanent Marker'; src: url('assets/fonts/permanent-marker-latin-400-normal.woff2') format('woff2'); }}
  @font-face {{ font-family: 'Bangers'; src: url('assets/fonts/bangers-latin-400-normal.woff2') format('woff2'); }}
  .full {{ position:absolute; left:0; top:0; width:1080px; height:1920px; }}
  .mk {{ font-family:'Permanent Marker'; color:{INK}; line-height:1.1; }}
  .bang {{ font-family:'Bangers'; letter-spacing:.03em; line-height:1; }}
  .card {{ position:absolute; background:{PAPER}; border:10px solid #fff; box-shadow:10px 12px 0 rgba(0,0,0,.25); }}
  .strip {{ display:inline-block; background:{PAPER}; padding:16px 34px; box-shadow:8px 10px 0 rgba(0,0,0,.25);
    clip-path: polygon(0% 8%, 4% 0%, 9% 6%, 15% 1%, 22% 7%, 30% 0%, 38% 6%, 46% 1%, 55% 7%, 63% 0%, 71% 6%, 79% 1%, 87% 7%, 94% 0%, 100% 6%,
      99% 92%, 95% 100%, 88% 93%, 80% 99%, 72% 93%, 64% 100%, 56% 94%, 47% 100%, 39% 93%, 31% 99%, 23% 93%, 15% 100%, 8% 94%, 2% 100%); }}
  .onom {{ position:absolute; font-family:'Bangers'; letter-spacing:.04em; line-height:1; white-space:nowrap;
    -webkit-text-stroke:10px #fff; paint-order:stroke fill; text-shadow:8px 10px 0 rgba(0,0,0,.3); }}
"""

RIG_JS = """
  function hfHash(n) { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }
  // tremidinha de stop motion: muda a cada 1/12 s
  function hfStop(tl, ids, dur, amp) {
    const st = { t: 0 }; amp = amp || 1;
    tl.to(st, { t: dur, duration: dur, ease: 'none', onUpdate: () => {
      const k = Math.floor(st.t * 12);
      ids.forEach((id, i) => gsap.set('#' + id, { x: (hfHash(k + i * 7) - .5) * 4 * amp, y: (hfHash(k + i * 7 + 50) - .5) * 4 * amp,
        rotation: (hfHash(k + i * 7 + 99) - .5) * 1.6 * amp }));
    } }, 0);
  }
  function hfPop(tl, sel, t, rot) {
    tl.fromTo(sel, { scale: 0, rotation: (rot || 0) - 18 }, { scale: 1, rotation: rot || 0, duration: .3, ease: 'back.out(2.4)' }, t);
  }
  function hfSlap(tl, sel, t, rot) {  // figurinha colada: cai de cima, gira e para
    tl.fromTo(sel, { scale: 1.6, rotation: (rot || 0) + 25, opacity: 0 }, { scale: 1, rotation: rot || 0, opacity: 1, duration: .28, ease: 'steps(4)' }, t);
  }
  function hfSet(tl, p, t, show, hide) {
    hide.forEach(id => tl.set('#' + p + '-' + id, { opacity: 0 }, t));
    show.forEach(id => tl.set('#' + p + '-' + id, { opacity: 1 }, t));
  }
"""


def scene(cid, body, js, css="", bg=KRAFT):
    return f'''<template>
  <style>
    #root {{ position:absolute; inset:0; overflow:hidden; background:{bg}; }}
    {CSS}
    {css}
  </style>
  <div id="root" data-composition-id="{cid}" data-width="1080" data-height="1920">
{body}
  </div>
  <script>
    (function() {{
{RIG_JS}
      const tl = gsap.timeline({{ paused: true }});
{js}
      window.__timelines["{cid}"] = tl;
    }})();
  </script>
</template>
'''
