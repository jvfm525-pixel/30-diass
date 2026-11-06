"""Estilo "HQ pop" da série O Chat Controla a Vida do Armando.

Traço de tinta grosso, sombra em retícula (pontos), cores chapadas fortes,
onomatopeias e caixas de narrador. Todas as funções devolvem SVG/HTML;
`p` é o prefixo de ids (únicos por cena).
"""
import random

INK = "#15122b"
SKIN = "#f0b27a"
SKIN_SH = "#d48a55"
HAIR = "#2d1f17"
TANK = "#efe8d2"
YEL = "#ffd23f"
MAG = "#ff3d7f"
CYAN = "#22c3e6"
RED = "#e63946"
GREEN = "#4cd964"


def dots(p, color=INK, size=9, r=2.3, op=0.55, name="dots"):
    """Padrão de retícula (Ben-Day)."""
    return (f'<pattern id="{p}-{name}" width="{size}" height="{size}" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">'
            f'<circle cx="{size/2}" cy="{size/2}" r="{r}" fill="{color}" opacity="{op}"/></pattern>')


def _stubble(seed):
    rnd = random.Random(seed)
    out = []
    for _ in range(140):
        x, y = rnd.uniform(170, 430), rnd.uniform(430, 560)
        if ((x - 300) / 150) ** 2 + ((y - 400) / 165) ** 2 < 1 and not (250 < x < 350 and 445 < y < 520):
            out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="2.4"/>')
    return "".join(out)


def _skin(hT):
    """Pele por nível de saúde: espinhas, tom amarelado ou bochechas coradas."""
    pimples = [(205, 235), (392, 212), (332, 176), (158, 418), (446, 438), (250, 470)][:[6, 3, 1, 0][hT]]
    out = "".join(f'<circle cx="{x}" cy="{y}" r="10" fill="#d9613e" stroke="#9c3a22" stroke-width="3"/><circle cx="{x - 3}" cy="{y - 3}" r="3" fill="#ffd0a8"/>' for x, y in pimples)
    if hT == 0:
        out += '<rect x="100" y="110" width="400" height="450" fill="#9fb34a" opacity=".16"/>'
    if hT == 3:
        out += '<circle cx="175" cy="445" r="30" fill="#ff8fa3" opacity=".45"/><circle cx="425" cy="445" r="30" fill="#ff8fa3" opacity=".45"/>'
    return out


def _hair(p, lT):
    """Cabelo por nível de amor (se cuidar): careca → nascendo → curto → topete."""
    sides = (f'<path d="M112 310 C100 230 130 190 160 175 C150 230 150 280 160 320 Z" fill="{HAIR}" stroke="{INK}" stroke-width="5"/>'
             f'<path d="M488 310 C500 230 470 190 440 175 C450 230 450 280 440 320 Z" fill="{HAIR}" stroke="{INK}" stroke-width="5"/>')
    if lT == 0:
        return sides + (f'<path d="M160 200 C210 120 330 110 430 170" fill="none" stroke="{HAIR}" stroke-width="9" stroke-linecap="round"/>'
                        f'<path d="M170 225 C230 140 350 135 440 195" fill="none" stroke="{HAIR}" stroke-width="7" stroke-linecap="round"/>')
    if lT == 1:  # raspado, nascendo
        return sides + (f'<path d="M112 300 C100 165 200 108 300 108 C400 108 500 165 488 300 C460 225 400 190 300 186 C200 190 140 225 112 300 Z" '
                        f'fill="#5a4535" stroke="{INK}" stroke-width="6"/>'
                        f'<g fill="#2d1f17">{"".join(f"<circle cx=\"{x}\" cy=\"{y}\" r=\"3\"/>" for x, y in [(200, 150), (240, 130), (280, 122), (320, 122), (360, 130), (400, 150), (220, 165), (300, 140), (380, 165)])}</g>')
    full = (f'<path d="M104 330 C88 160 190 88 300 88 C410 88 512 160 496 330 C476 250 452 200 420 186 C370 205 230 205 180 186 C148 200 124 250 104 330 Z" '
            f'fill="{HAIR}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>')
    if lT == 2:  # curto, penteado de lado
        return full + f'<path d="M180 186 C240 150 320 140 420 186" fill="none" stroke="#5a4535" stroke-width="6" stroke-linecap="round"/>'
    # topete com brilho
    return (full + f'<path d="M160 190 C170 70 330 30 440 120 C460 140 455 180 420 186 C380 140 260 130 160 190 Z" fill="{HAIR}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>'
            f'<path d="M220 130 C280 80 360 80 410 120" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".6"/>'
            f'<path d="M250 155 C300 125 350 125 390 145" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".4"/>')


def _glasses(mT):
    """Óculos por nível de dinheiro: fita → inteiro → moderno → de grife."""
    if mT <= 1:
        tape = (f'<rect x="278" y="304" width="44" height="34" rx="4" fill="#f6f1e2" stroke="{INK}" stroke-width="4" transform="rotate(10 300 321)"/>'
                f'<path d="M286 312 l28 16 M286 328 l28 -8" stroke="#b4ad97" stroke-width="3"/>') if mT == 0 else ""
        return f'''<g transform="rotate({-2.5 if mT == 0 else 0} 300 340)">
      <rect x="166" y="290" width="128" height="100" rx="26" fill="rgba(200,235,255,.16)" stroke="{INK}" stroke-width="16"/>
      <rect x="306" y="290" width="128" height="100" rx="26" fill="rgba(200,235,255,.16)" stroke="{INK}" stroke-width="16"/>
      <path d="M184 372 L226 306 M200 378 L238 318" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"/>
      <path d="M324 372 L366 306" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"/>
      <path d="M294 322 Q300 314 306 322" stroke="{INK}" stroke-width="12" fill="none"/>{tape}
      <path d="M166 320 L118 312 M434 320 L482 312" stroke="{INK}" stroke-width="10"/></g>'''
    if mT == 2:  # armação moderna fina
        return f'''<g>
      <rect x="172" y="300" width="118" height="78" rx="14" fill="rgba(200,235,255,.12)" stroke="{INK}" stroke-width="8"/>
      <rect x="310" y="300" width="118" height="78" rx="14" fill="rgba(200,235,255,.12)" stroke="{INK}" stroke-width="8"/>
      <path d="M290 322 Q300 314 310 322" stroke="{INK}" stroke-width="7" fill="none"/>
      <path d="M190 365 L222 310" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>
      <path d="M172 318 L118 312 M428 318 L482 312" stroke="{INK}" stroke-width="7"/></g>'''
    # redondos de grife (tartaruga)
    return f'''<g>
      <circle cx="230" cy="340" r="56" fill="rgba(200,235,255,.1)" stroke="#7a4a1f" stroke-width="10"/>
      <circle cx="370" cy="340" r="56" fill="rgba(200,235,255,.1)" stroke="#7a4a1f" stroke-width="10"/>
      <circle cx="230" cy="340" r="56" fill="none" stroke="{INK}" stroke-width="3"/><circle cx="370" cy="340" r="56" fill="none" stroke="{INK}" stroke-width="3"/>
      <path d="M286 330 Q300 318 314 330" stroke="#c9a227" stroke-width="6" fill="none"/>
      <path d="M200 370 L235 305" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>
      <path d="M174 330 L118 314 M426 330 L482 314" stroke="#c9a227" stroke-width="6"/></g>'''


def _rest_mouth(score):
    """Boca "parada": triste no começo, neutra no meio, sorriso confiante no fim."""
    if score >= 9:
        return f'<path d="M248 508 Q300 548 352 508" fill="none" stroke="{INK}" stroke-width="9" stroke-linecap="round"/><path d="M340 506 q10 -2 14 -10" stroke="{INK}" stroke-width="6" fill="none" stroke-linecap="round"/>'
    if score >= 6:
        return f'<path d="M255 515 Q300 530 345 515" fill="none" stroke="{INK}" stroke-width="9" stroke-linecap="round"/>'
    return (f'<path d="M250 520 Q300 498 350 520" fill="none" stroke="{INK}" stroke-width="9" stroke-linecap="round"/>'
            f'<path d="M272 532 Q300 542 328 532" fill="none" stroke="{INK}" stroke-width="4" opacity=".5"/>')


def _clothes(p, mT, rT):
    """Roupa por nível de dinheiro (+ crachá/gravata pela reputação)."""
    shade = f'<path d="M110 800 C115 700 160 640 205 600 L230 610 C180 660 160 720 165 800 Z" fill="url(#{p}-dots)"/>'
    skin_sh = f'<path d="M10 800 C20 650 110 590 205 578 L180 620 C110 650 80 720 75 800 Z" fill="url(#{p}-dskin)"/>'
    if mT <= 1:  # regata (furada e manchada no nível 0, limpa no 1)
        out = (f'<path d="M110 800 C115 700 160 640 205 600 L300 640 L395 600 C440 640 485 700 490 800 Z" fill="{TANK if mT == 0 else "#ffffff"}" stroke="{INK}" stroke-width="9"/>'
               f'<path d="M205 600 C230 640 370 640 395 600" fill="none" stroke="{INK}" stroke-width="7"/>')
        if mT == 0:
            out += (f'<ellipse cx="250" cy="720" rx="40" ry="26" fill="#d9b24c" opacity=".75"/><ellipse cx="360" cy="690" rx="20" ry="14" fill="#c9752e" opacity=".6"/>'
                    f'<circle cx="410" cy="760" r="14" fill="none" stroke="{INK}" stroke-width="5"/>')
        out += shade + skin_sh + f'<path d="M140 660 l-12 10 M150 672 l-14 6 M455 660 l12 10 M447 674 l14 6" stroke="{HAIR}" stroke-width="4"/>'
    else:  # polo (2) ou camisa social (3): cobre os ombros
        col = "#2a9d8f" if mT == 2 else "#cfe3f7"
        out = (f'<path d="M10 800 C20 650 110 590 215 575 L300 600 L385 575 C490 590 580 650 590 800 Z" fill="{col}" stroke="{INK}" stroke-width="10"/>'
               f'<path d="M10 800 C20 650 110 590 205 578 L180 620 C110 650 80 720 75 800 Z" fill="url(#{p}-dots)"/>'
               f'<path d="M235 585 L300 640 L365 585 L345 640 L300 660 L255 640 Z" fill="{col}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>')
        if mT == 2:
            out += f'<path d="M300 660 L300 720" stroke="{INK}" stroke-width="6"/><circle cx="300" cy="690" r="6" fill="#fff" stroke="{INK}" stroke-width="3"/>'
        else:
            out += (f'<path d="M300 660 L300 800" stroke="{INK}" stroke-width="5"/>' + "".join(f'<circle cx="300" cy="{y}" r="6" fill="#fff" stroke="{INK}" stroke-width="3"/>' for y in (690, 740, 790))
                    + f'<rect x="380" y="680" width="70" height="60" fill="none" stroke="{INK}" stroke-width="5"/><rect x="398" y="660" width="10" height="40" fill="#1a73e8" stroke="{INK}" stroke-width="3"/>')
    if rT >= 3:  # gravata
        out += f'<path d="M285 650 L315 650 L325 680 L312 790 L300 805 L288 790 L275 680 Z" fill="{RED}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/><path d="M290 700 L312 690 M288 740 L314 730" stroke="#fff" stroke-width="5" opacity=".6"/>'
    if rT >= 2:  # crachá
        label = "GERENTE" if rT >= 3 else "ARMANDO"
        out += (f'<g transform="rotate(-4 175 735)"><rect x="110" y="700" width="140" height="78" rx="8" fill="#fff" stroke="{INK}" stroke-width="6"/>'
                f'<rect x="110" y="700" width="140" height="22" rx="6" fill="{CYAN}"/>'
                f'<text x="180" y="760" text-anchor="middle" font-family="Archivo Black" font-size="{20 if rT >= 3 else 18}" fill="{INK}">{label}</text></g>')
    return out


def visual_changes(before, after):
    """Lista do que mudou na aparência entre dois estados de barras (para a cena de UPGRADE)."""
    txt = {
        "health": [["muitas espinhas", "pele amarelada", "olheiras fundas"], ["menos espinhas", "olheiras menores"], ["quase sem espinhas", "olheiras quase sumindo"], ["pele limpa", "sem olheiras", "sem papada"]],
        "money": [["regata furada e manchada", "óculos com fita"], ["regata nova e limpa", "óculos sem fita"], ["camisa polo", "óculos modernos"], ["camisa social", "óculos de grife"]],
        "love": [["barba por fazer", "careca"], ["barba aparada", "cabelo nascendo"], ["barba feita", "cabelo curto penteado"], ["cara lisinha", "topete com brilho"]],
        "rep": [["ninguém conhece"], ["sem crachá"], ["crachá da empresa"], ["gravata", "crachá de GERENTE"]],
    }
    icons = {"health": "❤️", "money": "💰", "love": "💘", "rep": "⭐"}
    out = []
    for k in ("money", "health", "love", "rep"):
        a, b = tier(before[k]), tier(after[k])
        if b != a:
            out.append((icons[k], "UPGRADE" if b > a else "DOWNGRADE", txt[k][b]))
    return out


# ------------------------------------------------------------------ Armando
def tier(v):
    """Nível visual de uma barra: 0 (0–25), 1 (26–50), 2 (51–69), 3 (70+)."""
    return 0 if v <= 25 else 1 if v <= 50 else 2 if v < 70 else 3


def armando(p, pose="none", bags=None, stats=None):
    """Armando HQ, busto. viewBox 0 0 600 800.

    stats = {"money": 0-100, "health": 0-100, "love": 0-100, "rep": 0-100}
    muda a aparência por nível (ver tier()). Sem stats = visual do DIA 1.

    Partes: {p}-rig (raiz, para o traço "fervendo"), {p}-body, {p}-head,
    {p}-lid-l/-r, classe {p}-pupil, sobrancelhas {p}-br-sad/-shock/-worry/-angry,
    bocas {p}-m-sad/-chew/-shock/-grin/-smirk, {p}-sweat, poses {p}-pose-*.
    """
    st = stats or {"money": 15, "health": 30, "love": 10, "rep": 40}
    mT, hT, lT, rT = tier(st["money"]), tier(st["health"]), tier(st["love"]), tier(st["rep"])
    if bags is None:
        bags = [1.0, .6, .3, 0.0][hT] if stats else 1.0
    stub_op = [.5, .32, .14, 0][lT]
    stray = lT < 1
    taped = mT < 2

    def eye(side, cx):
        return f'''
      <clipPath id="{p}-ec-{side}"><ellipse cx="{cx}" cy="338" rx="38" ry="31"/></clipPath>
      <g clip-path="url(#{p}-ec-{side})">
        <ellipse cx="{cx}" cy="338" rx="38" ry="31" fill="#fbf8ef"/>
        <g class="{p}-pupil"><circle cx="{cx}" cy="342" r="16" fill="#6b4226"/><circle cx="{cx}" cy="342" r="9" fill="{INK}"/>
          <circle cx="{cx+6}" cy="336" r="4.5" fill="#fff"/></g>
        <rect id="{p}-lid-{side}" x="{cx-42}" y="306" width="84" height="30" fill="{SKIN}"/>
        <path d="M{cx-40} 336 L{cx+40} 336" stroke="{INK}" stroke-width="0"/>
      </g>
      <ellipse cx="{cx}" cy="338" rx="38" ry="31" fill="none" stroke="{INK}" stroke-width="5"/>
      <path d="M{cx-30} 380 Q{cx} 394 {cx+30} 380" fill="none" stroke="{INK}" stroke-width="4" opacity="{.6 * bags:.2f}"/>
      <path d="M{cx-22} 392 Q{cx} 400 {cx+22} 392" fill="none" stroke="{INK}" stroke-width="3" opacity="{.35 * bags * bags:.2f}"/>'''

    poses = {
        "miojo": f'''
    <g id="{p}-pose-miojo">
      <path d="M40 800 C60 720 110 690 170 690 L200 760 L150 800 Z" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
      <g transform="rotate(-8 190 690)">
        <path d="M95 640 L300 640 L285 735 C280 760 115 760 110 735 Z" fill="#9aa3ad" stroke="{INK}" stroke-width="9"/>
        <path d="M95 640 L300 640" stroke="#dfe6ec" stroke-width="6"/>
        <path d="M110 645 q20 -30 40 0 q20 -30 40 0 q20 -30 40 0 q20 -30 40 0 q15 -20 25 0" fill="#ffd77a" stroke="{INK}" stroke-width="5"/>
        <rect x="300" y="655" width="110" height="20" rx="8" fill="{INK}"/>
        <path d="M110 700 L285 700" stroke="{INK}" stroke-width="4" opacity=".3"/>
      </g>
      <path d="M150 700 C140 670 175 650 205 668 C220 680 215 708 196 716 Z" fill="{SKIN}" stroke="{INK}" stroke-width="8"/>
      <path d="M560 800 C560 700 520 630 470 600 L420 650 C440 700 450 750 440 800 Z" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
      <path d="M430 610 C405 590 420 555 450 560 C480 565 485 600 465 620 Z" fill="{SKIN}" stroke="{INK}" stroke-width="8"/>
      <path d="M440 575 L345 498" stroke="#c7ccd2" stroke-width="10" stroke-linecap="round"/>
      <path d="M440 575 L345 498" stroke="{INK}" stroke-width="3" stroke-linecap="round" opacity=".5"/>
      <g id="{p}-noodle" fill="none" stroke="#ffd77a" stroke-width="7" stroke-linecap="round">
        <path d="M348 500 q-6 30 4 60 q8 30 -2 60"/><path d="M340 498 q-12 30 0 70 q10 25 0 50"/><path d="M356 504 q4 25 -4 55"/></g>
      <g fill="none" stroke="{INK}" stroke-width="2.5" opacity=".7">
        <path d="M348 500 q-6 30 4 60 q8 30 -2 60"/><path d="M340 498 q-12 30 0 70 q10 25 0 50"/></g>
    </g>''',
        "phone": f'''
    <g id="{p}-pose-phone">
      <path d="M30 800 C50 720 120 690 210 700 L250 740 L230 800 Z" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
      <path d="M570 800 C550 720 480 690 390 700 L350 740 L370 800 Z" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
      <rect x="215" y="600" width="170" height="150" rx="22" fill="#20232b" stroke="{INK}" stroke-width="9"/>
      <circle cx="255" cy="635" r="14" fill="#3a3f4b" stroke="{INK}" stroke-width="4"/>
      <path d="M205 720 C190 690 215 670 240 680 L250 740 Z M395 720 C410 690 385 670 360 680 L350 740 Z" fill="{SKIN}" stroke="{INK}" stroke-width="8"/>
      <path id="{p}-glow" d="M215 600 L120 380 L480 380 L385 600 Z" fill="#9fe6ff" opacity="0"/>
    </g>''',
        "point": f'''
    <g id="{p}-pose-point">
      <path d="M560 800 C540 700 470 640 400 610 L350 690 C380 720 410 760 420 800 Z" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
      <g id="{p}-hand">
        <path d="M250 640 C230 560 290 520 350 540 C410 560 430 620 400 680 C370 730 290 720 250 640 Z" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
        <ellipse cx="300" cy="580" rx="46" ry="46" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
        <ellipse cx="300" cy="580" rx="26" ry="24" fill="#f7c9a0" stroke="{INK}" stroke-width="5"/>
        <path d="M335 640 q30 -10 45 10 M330 670 q30 -8 42 14" fill="none" stroke="{INK}" stroke-width="6"/>
      </g>
    </g>''',
        "none": "",
    }

    return f'''<svg viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>{dots(p)}{dots(p, "#7a3c12", 8, 2, .55, "dskin")}
    <clipPath id="{p}-headclip"><path d="M300 118 C430 118 492 210 492 320 C492 445 430 548 300 552 C170 548 108 445 108 320 C108 210 170 118 300 118 Z"/></clipPath>
  </defs>
  <g id="{p}-rig">
  <g id="{p}-body">
    <path d="M10 800 C20 650 110 590 215 575 L300 600 L385 575 C490 590 580 650 590 800 Z" fill="{SKIN}" stroke="{INK}" stroke-width="10"/>
    {_clothes(p, mT, rT)}
  </g>
  <g id="{p}-head">
    <rect x="245" y="510" width="110" height="90" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
    <path d="M245 560 L245 600 L355 600 L355 560 Z" fill="url(#{p}-dskin)"/>
    <ellipse cx="108" cy="340" rx="32" ry="50" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
    <ellipse cx="492" cy="340" rx="32" ry="50" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
    <path d="M100 320 q10 -20 18 10 M500 320 q-10 -20 -18 10" fill="none" stroke="{INK}" stroke-width="5"/>
    <path d="M300 118 C430 118 492 210 492 320 C492 445 430 548 300 552 C170 548 108 445 108 320 C108 210 170 118 300 118 Z" fill="{SKIN}" stroke="{INK}" stroke-width="10"/>
    <g clip-path="url(#{p}-headclip)">
      <path d="M108 200 C150 300 140 470 300 560 L100 560 Z" fill="url(#{p}-dskin)"/>
      <g fill="{HAIR}" opacity="{stub_op}">{_stubble(3)}</g>
      {_skin(hT)}
      <ellipse cx="380" cy="180" rx="48" ry="20" fill="#fff" opacity=".35" transform="rotate(-20 380 180)"/>
    </g>
    {'<path d="M200 525 Q300 575 400 525" fill="none" stroke="' + INK + '" stroke-width="5" opacity=".6"/>' if hT < 3 else '<path d="M230 540 Q300 560 370 540" fill="none" stroke="' + INK + '" stroke-width="4" opacity=".35"/>'}
    {_hair(p, lT)}
    {'<path d="M290 122 q-10 -40 15 -66 M318 124 q20 -30 6 -60" fill="none" stroke="' + HAIR + '" stroke-width="7" stroke-linecap="round"/>' if stray else ''}
    {'<path d="M175 215 C240 150 350 150 432 192" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/>' if lT == 3 else ''}
    {'<path d="M230 230 q70 -14 140 0 M245 252 q55 -10 110 0" fill="none" stroke="' + INK + '" stroke-width="4" opacity=".45"/>' if hT < 3 else ''}
    <g id="{p}-br-sad" fill="{HAIR}" stroke="{INK}" stroke-width="4">
      <path d="M180 292 C200 268 250 266 280 282 L276 294 C250 284 210 286 186 304 Z"/>
      <path d="M420 292 C400 268 350 266 320 282 L324 294 C350 284 390 286 414 304 Z"/></g>
    <g id="{p}-br-shock" opacity="0" fill="{HAIR}" stroke="{INK}" stroke-width="4">
      <path d="M182 262 C205 232 255 232 280 252 L274 264 C250 248 212 250 188 276 Z"/>
      <path d="M418 262 C395 232 345 232 320 252 L326 264 C350 248 388 250 412 276 Z"/></g>
    <g id="{p}-br-worry" opacity="0" fill="{HAIR}" stroke="{INK}" stroke-width="4">
      <path d="M180 296 C200 280 250 262 282 262 L280 276 C250 278 214 292 186 310 Z"/>
      <path d="M420 296 C400 280 350 262 318 262 L320 276 C350 278 386 292 414 310 Z"/></g>
    <g id="{p}-br-angry" opacity="0" fill="{HAIR}" stroke="{INK}" stroke-width="4">
      <path d="M182 268 L284 300 L280 312 L186 286 Z"/><path d="M418 268 L316 300 L320 312 L414 286 Z"/></g>
    {eye("l", 228)}{eye("r", 372)}
    {_glasses(mT)}
    <path d="M300 360 C262 420 246 462 274 478 C290 488 312 488 328 478 C356 462 338 420 300 360 Z" fill="{SKIN_SH}" stroke="{INK}" stroke-width="8"/>
    <circle cx="318" cy="440" r="7" fill="#fff" opacity=".7"/>
    <path d="M282 470 q8 6 14 0 M306 470 q8 6 14 0" fill="none" stroke="{INK}" stroke-width="4"/>
    <g id="{p}-m-sad">{_rest_mouth(mT + hT + lT + rT)}</g>
    <g id="{p}-m-chew" opacity="0"><path d="M258 500 Q300 490 342 500 Q338 548 300 550 Q262 548 258 500 Z" fill="#5a1f26" stroke="{INK}" stroke-width="8"/>
      <path d="M285 505 q-4 30 6 60 M305 503 q6 30 -2 70" stroke="#ffd77a" stroke-width="7" fill="none" stroke-linecap="round"/></g>
    <ellipse id="{p}-m-shock" opacity="0" cx="300" cy="518" rx="26" ry="34" fill="#5a1f26" stroke="{INK}" stroke-width="8"/>
    <g id="{p}-m-grin" opacity="0"><path d="M240 500 Q300 512 360 500 L350 536 Q300 548 250 536 Z" fill="#fbf8ef" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M246 518 Q300 528 354 518 M270 504 L268 540 M300 508 L300 544 M330 504 L332 540" stroke="{INK}" stroke-width="4" fill="none"/></g>
    <path id="{p}-m-smirk" opacity="0" d="M255 515 Q310 530 352 498" fill="none" stroke="{INK}" stroke-width="9" stroke-linecap="round"/>
    <g id="{p}-sweat" opacity="0"><path d="M470 230 C452 262 452 282 470 286 C488 282 488 262 470 230 Z" fill="#8fe0ff" stroke="{INK}" stroke-width="5"/>
      <path d="M138 250 C124 276 124 292 138 295 C152 292 152 276 138 250 Z" fill="#8fe0ff" stroke="{INK}" stroke-width="5"/></g>
  </g>
  {poses[pose]}
  </g>
</svg>'''


# ------------------------------------------------------------------ Rodrigo
def rodrigo(p):
    """Rodrigo, o valentão. viewBox 0 0 600 800."""
    return f'''<svg viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>{dots(p)}{dots(p, "#5a2a10", 8, 2, .5, "dskin")}</defs>
  <g id="{p}-rig">
  <path d="M0 800 C10 640 120 590 220 580 L300 610 L380 580 C480 590 590 640 600 800 Z" fill="{MAG}" stroke="{INK}" stroke-width="10"/>
  <path d="M220 580 L180 520 L300 610 L420 520 L380 580" fill="#ff8fb5" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
  <path d="M0 800 C10 640 120 590 200 582 L150 660 C90 690 60 740 55 800 Z" fill="url(#{p}-dots)"/>
  <path d="M240 610 Q300 690 360 610" fill="none" stroke="{YEL}" stroke-width="12"/>
  <path d="M240 610 Q300 690 360 610" fill="none" stroke="{INK}" stroke-width="3" stroke-dasharray="6 8"/>
  <path d="M60 800 C80 720 160 700 300 720 C440 700 520 720 540 800 Z" fill="#f2b07c" stroke="{INK}" stroke-width="9"/>
  <path d="M150 720 C220 740 380 740 450 720 M140 760 C230 785 370 785 460 760" fill="none" stroke="{INK}" stroke-width="6"/>
  <rect x="250" y="500" width="100" height="100" fill="#f2b07c" stroke="{INK}" stroke-width="9"/>
  <path d="M300 140 C420 140 470 220 470 320 C470 440 420 530 300 540 C180 530 130 440 130 320 C130 220 180 140 300 140 Z" fill="#f2b07c" stroke="{INK}" stroke-width="10"/>
  <path d="M135 300 C150 420 200 520 300 540 L140 540 Z" fill="url(#{p}-dskin)"/>
  <path d="M170 450 Q300 560 430 450 L440 470 Q300 600 160 470 Z" fill="#c98a5a" opacity=".55"/>
  <path d="M140 270 C120 120 300 40 450 120 C500 160 480 230 470 270 C430 190 330 180 250 200 C200 210 160 240 140 270 Z" fill="#1e1a24" stroke="{INK}" stroke-width="8"/>
  <path d="M190 160 C260 100 380 100 440 150" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".75"/>
  <path d="M220 190 C280 150 360 150 410 175" fill="none" stroke="#8b86a8" stroke-width="6" stroke-linecap="round"/>
  <g transform="rotate(-4 300 215)">
    <rect x="175" y="190" width="115" height="50" rx="20" fill="#14b8c9" stroke="{INK}" stroke-width="9"/>
    <rect x="310" y="190" width="115" height="50" rx="20" fill="#14b8c9" stroke="{INK}" stroke-width="9"/>
    <path d="M290 212 L310 212" stroke="{INK}" stroke-width="9"/>
    <path d="M195 205 L230 205" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>
  <path d="M185 300 L280 290 L280 304 L190 316 Z" fill="#1e1a24"/>
  <path d="M320 272 C350 250 400 252 420 272 L416 286 C390 270 350 274 322 290 Z" fill="#1e1a24"/>
  <path d="M195 335 Q235 315 275 335 Q235 352 195 335 Z" fill="#fff" stroke="{INK}" stroke-width="6"/>
  <path d="M325 335 Q365 312 405 335 Q365 355 325 335 Z" fill="#fff" stroke="{INK}" stroke-width="6"/>
  <circle class="{p}-pupil" cx="240" cy="336" r="10" fill="{INK}"/><circle class="{p}-pupil" cx="370" cy="335" r="10" fill="{INK}"/>
  <path d="M195 328 Q235 316 275 330 M325 328 Q365 314 405 330" fill="none" stroke="{INK}" stroke-width="9"/>
  <path d="M300 345 L280 420 Q300 432 322 420" fill="none" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
  <g id="{p}-smirk"><path d="M230 470 Q300 490 380 445 L378 462 Q330 500 240 484 Z" fill="#fff" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M380 445 q12 -4 16 -16" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/></g>
  <path d="M290 500 q10 8 20 0" fill="none" stroke="{INK}" stroke-width="5"/>
  <ellipse cx="130" cy="340" rx="24" ry="40" fill="#f2b07c" stroke="{INK}" stroke-width="8"/>
  <ellipse cx="470" cy="340" rx="24" ry="40" fill="#f2b07c" stroke="{INK}" stroke-width="8"/>
  <circle cx="470" cy="370" r="7" fill="{YEL}" stroke="{INK}" stroke-width="3"/>
  </g>
</svg>'''


# ------------------------------------------------------------------ Carla
def carla(p):
    """Carla, a vizinha do 302. viewBox 0 0 600 800. Boca {p}-m-smile / {p}-m-o."""
    import math as _m
    curls = "".join(f'<circle cx="{300 + 205 * _m.cos(a):.0f}" cy="{300 + 190 * _m.sin(a):.0f}" r="{58 + (i % 3) * 10}"/>'
                    for i, a in enumerate([_m.pi * (0.75 + k * 0.105) for k in range(15)]))
    return f'''<svg viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>{dots(p)}{dots(p, "#5a2a10", 8, 2, .5, "dskin")}</defs>
  <g id="{p}-rig">
  <g fill="#2a1a14" stroke="{INK}" stroke-width="8">{curls}<ellipse cx="300" cy="330" rx="215" ry="230"/></g>
  <path d="M30 800 C40 650 140 600 230 590 L300 615 L370 590 C460 600 560 650 570 800 Z" fill="{YEL}" stroke="{INK}" stroke-width="10"/>
  <path d="M30 800 C40 650 140 600 210 592 L170 660 C110 690 90 740 85 800 Z" fill="url(#{p}-dots)"/>
  <text x="300" y="740" text-anchor="middle" font-family="Archivo Black" font-size="58" fill="{MAG}">302</text>
  <rect x="255" y="500" width="90" height="110" fill="#b97a56" stroke="{INK}" stroke-width="9"/>
  <path d="M300 150 C410 150 455 230 455 330 C455 450 400 535 300 540 C200 535 145 450 145 330 C145 230 190 150 300 150 Z" fill="#b97a56" stroke="{INK}" stroke-width="10"/>
  <path d="M150 300 C160 420 210 520 300 540 L150 540 Z" fill="url(#{p}-dskin)"/>
  <path d="M150 260 C170 160 430 160 450 260 C400 200 320 190 300 230 C280 190 200 200 150 260 Z" fill="#2a1a14" stroke="{INK}" stroke-width="6"/>
  <circle cx="150" cy="400" r="26" fill="none" stroke="{YEL}" stroke-width="9"/><circle cx="450" cy="400" r="26" fill="none" stroke="{YEL}" stroke-width="9"/>
  <path d="M205 300 Q240 284 275 298 M325 298 Q360 284 395 300" fill="none" stroke="#2a1a14" stroke-width="10" stroke-linecap="round"/>
  <ellipse cx="240" cy="345" rx="30" ry="34" fill="#fff" stroke="{INK}" stroke-width="5"/><ellipse cx="360" cy="345" rx="30" ry="34" fill="#fff" stroke="{INK}" stroke-width="5"/>
  <g class="{p}-pupil"><circle cx="243" cy="350" r="15" fill="#4a2a1a"/><circle cx="363" cy="350" r="15" fill="#4a2a1a"/>
    <circle cx="248" cy="344" r="5" fill="#fff"/><circle cx="368" cy="344" r="5" fill="#fff"/></g>
  <path d="M212 318 l-14 -10 M222 312 l-8 -14 M388 318 l14 -10 M378 312 l8 -14" stroke="{INK}" stroke-width="5"/>
  <circle cx="200" cy="420" r="22" fill="#ff8fa3" opacity=".55"/><circle cx="400" cy="420" r="22" fill="#ff8fa3" opacity=".55"/>
  <path d="M300 370 C285 410 280 430 295 438 C305 442 318 438 318 430" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>
  <g id="{p}-m-smile"><path d="M245 470 Q300 520 355 470 Z" fill="#7a1f2e" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M255 474 Q300 490 345 474" fill="#fff"/></g>
  <ellipse id="{p}-m-o" opacity="0" cx="300" cy="482" rx="18" ry="22" fill="#7a1f2e" stroke="{INK}" stroke-width="6"/>
  </g>
</svg>'''


def valdir(p):
    """Seu Valdir, o chefe (foto de contato). viewBox 0 0 300 300."""
    return f'''<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <circle cx="150" cy="150" r="146" fill="#ffb347" stroke="{INK}" stroke-width="8"/>
  <path d="M40 300 C50 230 100 215 150 215 C200 215 250 230 260 300 Z" fill="#3b4a6b" stroke="{INK}" stroke-width="7"/>
  <path d="M130 215 L150 260 L170 215 Z" fill="{RED}" stroke="{INK}" stroke-width="5"/>
  <ellipse cx="150" cy="135" rx="80" ry="92" fill="#e9a878" stroke="{INK}" stroke-width="7"/>
  <path d="M74 130 C70 90 80 70 95 64 M226 130 C230 90 220 70 205 64" fill="none" stroke="#8d8d8d" stroke-width="12" stroke-linecap="round"/>
  <path d="M95 105 L140 120 M205 105 L160 120" stroke="{INK}" stroke-width="10" stroke-linecap="round"/>
  <circle cx="122" cy="135" r="7" fill="{INK}"/><circle cx="178" cy="135" r="7" fill="{INK}"/>
  <path d="M95 185 C110 160 140 168 150 175 C160 168 190 160 205 185 C185 182 165 186 150 192 C135 186 115 182 95 185 Z" fill="#6d6d6d" stroke="{INK}" stroke-width="5"/>
  <path d="M130 205 Q150 196 170 205" fill="none" stroke="{INK}" stroke-width="6"/>
</svg>'''


# ------------------------------------------------------------------ cenários
def room(p, light=1.0):
    """Quarto do Armando à noite: azul da janela + luz quente do abajur."""
    rnd = random.Random(5)
    stars = "".join(f'<circle cx="{rnd.uniform(90, 390):.0f}" cy="{rnd.uniform(380, 640):.0f}" r="{rnd.uniform(1.5, 3.5):.1f}" fill="#fff" opacity=".8"/>' for _ in range(18))
    return f'''<svg viewBox="0 0 1080 1920" width="1080" height="1920" xmlns="http://www.w3.org/2000/svg" data-layout-ignore>
  <defs>{dots(p, "#0b1a2a", 12, 3, .45)}{dots(p, "#ffd27a", 14, 3.2, .35, "dwarm")}
    <radialGradient id="{p}-lamp" cx="82%" cy="58%" r="45%"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient></defs>
  <rect width="1080" height="1920" fill="#27506b"/>
  <g opacity=".35">{"".join(f'<path d="M{x} 0 L{x} 1350" stroke="#1d3f57" stroke-width="40"/>' for x in range(40, 1080, 120))}</g>
  <path d="M620 160 C680 150 700 260 650 300 C610 320 600 240 640 230 Z" fill="#3f6d86" stroke="{INK}" stroke-width="5"/>
  <path d="M980 900 l60 -40 l20 90 Z" fill="#3f6d86" stroke="{INK}" stroke-width="5"/>
  <g>
    <rect x="70" y="330" width="360" height="380" fill="#0f2238" stroke="{INK}" stroke-width="16"/>{stars}
    <circle cx="330" cy="430" r="46" fill="#fff4c2" stroke="{INK}" stroke-width="6"/>
    <circle cx="315" cy="420" r="9" fill="#e8dca0"/><circle cx="345" cy="448" r="6" fill="#e8dca0"/>
    <path d="M70 600 L130 560 L170 600 L230 540 L290 610 L330 570 L430 620 L430 710 L70 710 Z" fill="#081525"/>
    <g fill="#ffd23f">{"".join(f'<rect x="{x}" y="{y}" width="10" height="14"/>' for x, y in [(110,630),(150,645),(250,620),(270,650),(370,660),(390,640)])}</g>
    <line x1="250" y1="330" x2="250" y2="710" stroke="{INK}" stroke-width="12"/>
    <line x1="70" y1="520" x2="430" y2="520" stroke="{INK}" stroke-width="12"/>
    <path d="M40 300 L460 300 L470 330 L30 330 Z" fill="#4a3428" stroke="{INK}" stroke-width="7"/>
    <path d="M60 330 L160 330 C150 520 110 600 70 640 Z" fill="#a33b3b" stroke="{INK}" stroke-width="7"/>
    <path d="M60 330 L160 330 C150 520 110 600 70 640 Z" fill="url(#{p}-dots)"/>
  </g>
  <g transform="rotate(-6 760 460)">
    <rect x="610" y="300" width="300" height="400" fill="{YEL}" stroke="{INK}" stroke-width="10"/>
    <rect x="640" y="330" width="240" height="250" fill="{MAG}" stroke="{INK}" stroke-width="6"/>
    <path d="M700 560 L760 400 L820 560 Z" fill="{YEL}" stroke="{INK}" stroke-width="6"/>
    <text x="760" y="660" text-anchor="middle" font-family="Archivo Black" font-size="56" fill="{INK}">ROCK!</text>
    <path d="M910 300 L860 300 L910 350 Z" fill="#27506b" stroke="{INK}" stroke-width="6"/>
  </g>
  <rect x="0" y="1180" width="1080" height="20" fill="#16354a"/>
  <rect x="0" y="1200" width="1080" height="720" fill="#5a3b2b"/>
  <g stroke="#45291c" stroke-width="6">{"".join(f'<line x1="0" y1="{y}" x2="1080" y2="{y}"/>' for y in range(1290, 1920, 110))}</g>
  <rect x="0" y="1200" width="1080" height="720" fill="url(#{p}-dots)"/>
  <g>
    <rect x="860" y="760" width="40" height="430" fill="#3b2a22" stroke="{INK}" stroke-width="7"/>
    <path d="M790 640 L970 640 L920 770 L840 770 Z" fill="#ffcf7a" stroke="{INK}" stroke-width="8"/>
    <path d="M800 1190 L960 1190 L940 1150 L820 1150 Z" fill="#3b2a22" stroke="{INK}" stroke-width="7"/>
  </g>
  <rect width="1080" height="1920" fill="url(#{p}-lamp)" opacity="{light}"/>
  <g stroke="{INK}" stroke-width="7">
    <rect x="20" y="1270" width="320" height="56" fill="#e7b46a" transform="rotate(-5 180 1298)"/>
    <rect x="45" y="1225" width="300" height="52" fill="#d9a35a" transform="rotate(4 195 1251)"/>
    <rect x="30" y="1180" width="310" height="50" fill="#e7b46a" transform="rotate(-2 185 1205)"/>
    <text x="185" y="1215" text-anchor="middle" font-family="Archivo Black" font-size="28" fill="{RED}" stroke="none" transform="rotate(-2 185 1205)">PIZZA</text>
    <path d="M700 1300 C720 1210 860 1190 920 1240 C1000 1220 1070 1270 1060 1340 C930 1370 780 1370 700 1300 Z" fill="#6c4f8f"/>
    <path d="M760 1270 C820 1240 880 1260 870 1300" fill="none"/>
    <rect x="560" y="1350" width="46" height="80" rx="10" fill="{RED}" transform="rotate(75 583 1390)"/>
    <rect x="460" y="1400" width="46" height="80" rx="10" fill="{CYAN}"/>
  </g>
</svg>'''


def burst(p, color=YEL, n=14, r1=300, r2=420, cx=540, cy=900):
    """Explosão de HQ (estrela pontuda) para fundos."""
    import math
    pts = []
    for i in range(n * 2):
        a = math.pi * i / n
        r = r2 if i % 2 == 0 else r1
        pts.append(f"{cx + r * math.cos(a):.0f},{cy + r * math.sin(a):.0f}")
    return f'<polygon id="{p}" points="{" ".join(pts)}" fill="{color}" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/>'


def speed_lines(p, cx=540, cy=900, n=40, color="#fff", op=.35):
    import math
    out = []
    for i in range(n):
        a = 2 * math.pi * i / n
        a2 = a + 0.035
        out.append(f'<path d="M{cx} {cy} L{cx + 1500 * math.cos(a):.0f} {cy + 1500 * math.sin(a):.0f} L{cx + 1500 * math.cos(a2):.0f} {cy + 1500 * math.sin(a2):.0f} Z" fill="{color}" opacity="{op}"/>')
    return f'<g id="{p}">{"".join(out)}</g>'


def fly(p):
    return f'''<g id="{p}">
    <ellipse class="{p}-w" cx="-10" cy="-13" rx="14" ry="8" fill="#e8f4ff" stroke="{INK}" stroke-width="3" opacity=".9"/>
    <ellipse class="{p}-w" cx="10" cy="-13" rx="14" ry="8" fill="#e8f4ff" stroke="{INK}" stroke-width="3" opacity=".9"/>
    <ellipse cx="0" cy="0" rx="12" ry="15" fill="#141414"/><circle cx="-5" cy="-9" r="4.5" fill="{RED}"/><circle cx="5" cy="-9" r="4.5" fill="{RED}"/></g>'''


def sfx_word(cid, text, color=YEL, size=130, rot=-8, extra=""):
    """Onomatopeia de HQ."""
    return (f'<div id="{cid}" class="onom" data-layout-allow-overlap data-layout-allow-occlusion style="font-size:{size}px;color:{color};{extra}">'
            f'<span id="{cid}-in" data-layout-allow-occlusion style="display:inline-block;transform-origin:50% 50%">{text}</span></div>')


CSS = f"""
  .full {{ position:absolute; left:0; top:0; width:1080px; height:1920px; }}
  .onom {{ position:absolute; font-family:'Archivo Black'; letter-spacing:-.02em; line-height:1;
           -webkit-text-stroke:12px {INK}; paint-order:stroke fill; text-shadow:10px 12px 0 {INK}; white-space:nowrap; }}
  .panel {{ position:absolute; overflow:hidden; border:12px solid {INK}; background:#fff; }}
  .tag {{ position:absolute; font-family:'Archivo Black'; font-size:46px; color:{INK}; background:#fff; border:7px solid {INK};
          padding:8px 22px; box-shadow:8px 8px 0 {INK}; white-space:nowrap; }}
"""

RIG_JS = """
  function hfHash(n) { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }
  // traço "fervendo" a 12 quadros por segundo + respiração
  function hfAlive(tl, p, dur, amp) {
    const st = { t: 0 }; amp = amp || 1;
    tl.to(st, { t: dur, duration: dur, ease: 'none', onUpdate: () => {
      const k = Math.floor(st.t * 12);
      gsap.set('#' + p + '-rig', { x: (hfHash(k) - .5) * 2.4 * amp, y: (hfHash(k + 99) - .5) * 2.4 * amp });
      const b = document.getElementById(p + '-body');
      if (b) gsap.set(b, { scaleY: 1 + 0.016 * Math.sin(st.t * 2.3), transformOrigin: '50% 100%' });
      const h = document.getElementById(p + '-head');
      if (h) gsap.set(h, { y: 4 * Math.sin(st.t * 2.3 - .6), rotation: 1.1 * Math.sin(st.t * 1.2), transformOrigin: '50% 90%' });
    } }, 0);
  }
  function hfBlink(tl, p, at) {
    at.forEach(t => {
      tl.fromTo(['#' + p + '-lid-l', '#' + p + '-lid-r'], { scaleY: 1 }, { scaleY: 2.2, duration: .07, ease: 'power1.in', transformOrigin: '50% 0%', immediateRender: false }, t)
        .to(['#' + p + '-lid-l', '#' + p + '-lid-r'], { scaleY: 1, duration: .09, ease: 'power1.out' }, t + .08);
    });
  }
  // troca de expressão com "take": encolhe, troca, estica, assenta
  function hfMood(tl, p, t, show, hide) {
    tl.to('#' + p + '-head', { scaleY: .94, scaleX: 1.04, duration: .08, ease: 'power2.in', transformOrigin: '50% 100%' }, t);
    hide.forEach(id => tl.set('#' + p + '-' + id, { opacity: 0 }, t + .08));
    show.forEach(id => tl.set('#' + p + '-' + id, { opacity: 1 }, t + .08));
    tl.to('#' + p + '-head', { scaleY: 1.05, scaleX: .97, duration: .1, ease: 'power2.out' }, t + .08)
      .to('#' + p + '-head', { scaleY: 1, scaleX: 1, duration: .3, ease: 'elastic.out(1, .5)' }, t + .18);
  }
  function hfFlies(tl, ids, dur, area) {
    const st = { t: 0 };
    tl.to(st, { t: dur, duration: dur, ease: 'none', onUpdate: () => {
      ids.forEach((id, i) => {
        const a = area[i], t = st.t, ph = i * 1.7;
        gsap.set('#' + id, { x: a[0] + a[2] * Math.cos(t * (2.1 + i * .37) + ph) + 16 * Math.sin(t * 9 + ph),
                            y: a[1] + a[3] * Math.sin(t * (2.9 + i * .23) + ph) + 10 * Math.cos(t * 11 + ph), rotation: 25 * Math.sin(t * 4 + ph) });
        gsap.set('.' + id + '-w', { scaleY: (Math.floor(t * 30 + i) % 2) ? .35 : 1, transformOrigin: '50% 100%' });
      });
    } }, 0);
  }
  function hfPop(tl, sel, t, rot) {
    tl.fromTo(sel, { scale: 0, rotation: (rot || 0) - 14 }, { scale: 1, rotation: rot || 0, duration: .32, ease: 'back.out(2.6)' }, t);
  }
"""


def scene(cid, body, js, css="", bg="#27506b"):
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
