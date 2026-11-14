"""Personagens e balões de pensamento do episódio "E se você pudesse ler mentes".

Mesmo traço HQ pop do Armando (hq_lib). Cada função devolve SVG/HTML.
"""
from hq_lib import CYAN, INK, MAG, YEL, dots

SKINS = ["#f0b27a", "#c98c64", "#8a5a3c", "#e8c4a0", "#6e4429"]


def voce(p):
    """VOCÊ, de moletom. viewBox 0 0 600 800.
    Partes: {p}-rig, {p}-body, {p}-head, {p}-lid-l/-r, classe {p}-pupil, {p}-glow,
    sobrancelhas {p}-br-calm/-shock/-worry, bocas {p}-m-calm/-smile/-o/-grin/-drool, {p}-sweat.
    """
    skin = "#e8b48a"

    def eye(side, cx):
        return f'''
      <clipPath id="{p}-ec-{side}"><ellipse cx="{cx}" cy="350" rx="40" ry="34"/></clipPath>
      <g clip-path="url(#{p}-ec-{side})">
        <ellipse cx="{cx}" cy="350" rx="40" ry="34" fill="#fbf8ef"/>
        <g class="{p}-pupil"><circle cx="{cx}" cy="355" r="17" fill="#3d5a80"/><circle cx="{cx}" cy="355" r="9" fill="{INK}"/><circle cx="{cx + 6}" cy="348" r="5" fill="#fff"/></g>
        <rect id="{p}-lid-{side}" x="{cx - 44}" y="314" width="88" height="34" fill="{skin}"/>
      </g>
      <ellipse cx="{cx}" cy="350" rx="40" ry="34" fill="none" stroke="{INK}" stroke-width="6"/>
      <g class="{p}-glow" opacity="0"><ellipse cx="{cx}" cy="350" rx="40" ry="34" fill="{CYAN}"/><circle cx="{cx}" cy="350" r="12" fill="#fff"/></g>'''
    return f'''<svg viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>{dots(p)}{dots(p, "#6a3a1a", 8, 2, .5, "dskin")}</defs>
  <g id="{p}-rig">
  <g id="{p}-body">
    <path d="M150 600 C150 500 450 500 450 600 L470 700 L130 700 Z" fill="#5f4bb6" stroke="{INK}" stroke-width="10"/>
    <path d="M10 800 C20 650 120 590 220 575 L300 600 L380 575 C480 590 580 650 590 800 Z" fill="#6c5ce7" stroke="{INK}" stroke-width="10"/>
    <path d="M10 800 C20 650 120 590 210 578 L180 640 C120 670 90 730 80 800 Z" fill="url(#{p}-dots)"/>
    <path d="M255 600 L240 720 M345 600 L360 720" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
    <circle cx="240" cy="726" r="9" fill="#fff" stroke="{INK}" stroke-width="3"/><circle cx="360" cy="726" r="9" fill="#fff" stroke="{INK}" stroke-width="3"/>
    <path d="M200 760 L400 760 L390 800 L210 800 Z" fill="#5f4bb6" stroke="{INK}" stroke-width="7"/>
  </g>
  <g id="{p}-head">
    <rect x="250" y="510" width="100" height="90" fill="{skin}" stroke="{INK}" stroke-width="9"/>
    <ellipse cx="128" cy="350" rx="28" ry="44" fill="{skin}" stroke="{INK}" stroke-width="8"/>
    <ellipse cx="472" cy="350" rx="28" ry="44" fill="{skin}" stroke="{INK}" stroke-width="8"/>
    <path d="M300 140 C420 140 470 230 470 330 C470 450 410 540 300 545 C190 540 130 450 130 330 C130 230 180 140 300 140 Z" fill="{skin}" stroke="{INK}" stroke-width="10"/>
    <path d="M135 300 C150 420 200 520 300 545 L140 545 Z" fill="url(#{p}-dskin)"/>
    <path d="M118 300 C90 150 230 70 340 95 C420 110 500 170 482 300 C460 230 420 200 390 190 C380 215 350 225 330 200 C310 230 270 230 250 200 C230 225 190 225 175 200 C150 220 130 250 118 300 Z" fill="#3b2a1f" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M300 95 q-20 -40 10 -60 M330 98 q25 -30 10 -55" fill="none" stroke="#3b2a1f" stroke-width="10" stroke-linecap="round"/>
    <g id="{p}-br-calm" fill="none" stroke="#3b2a1f" stroke-width="13" stroke-linecap="round"><path d="M190 300 Q230 288 272 300"/><path d="M328 300 Q370 288 410 300"/></g>
    <g id="{p}-br-shock" opacity="0" fill="none" stroke="#3b2a1f" stroke-width="13" stroke-linecap="round"><path d="M190 280 Q230 258 272 278"/><path d="M328 278 Q370 258 410 280"/></g>
    <g id="{p}-br-worry" opacity="0" fill="none" stroke="#3b2a1f" stroke-width="13" stroke-linecap="round"><path d="M192 304 L272 284"/><path d="M328 284 L408 304"/></g>
    {eye("l", 232)}{eye("r", 368)}
    <path d="M300 380 C282 420 276 448 292 456 C300 460 310 458 316 452" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="190" cy="430" r="22" fill="#ff8fa3" opacity=".35"/><circle cx="410" cy="430" r="22" fill="#ff8fa3" opacity=".35"/>
    <path id="{p}-m-calm" d="M262 495 Q300 505 338 495" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>
    <path id="{p}-m-smile" opacity="0" d="M248 480 Q300 540 352 480 Z" fill="#6b1f2a" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>
    <ellipse id="{p}-m-o" opacity="0" cx="300" cy="500" rx="22" ry="28" fill="#6b1f2a" stroke="{INK}" stroke-width="7"/>
    <g id="{p}-m-grin" opacity="0"><path d="M245 482 Q300 494 355 482 L345 516 Q300 528 255 516 Z" fill="#fbf8ef" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/><path d="M250 500 Q300 510 350 500" stroke="{INK}" stroke-width="4" fill="none"/></g>
    <g id="{p}-m-drool" opacity="0"><path d="M255 490 Q300 525 345 490" fill="#6b1f2a" stroke="{INK}" stroke-width="7"/><path d="M330 505 q6 30 -2 50 q-8 6 -10 -6 q2 -20 0 -40" fill="#8fe0ff" stroke="{INK}" stroke-width="4"/></g>
    <g id="{p}-sweat" opacity="0"><path d="M450 240 C434 270 434 288 450 292 C466 288 466 270 450 240 Z" fill="#8fe0ff" stroke="{INK}" stroke-width="5"/></g>
    <g id="{p}-waves" opacity="0" fill="none" stroke="{CYAN}" stroke-width="10" stroke-linecap="round">
      <path d="M200 90 Q300 30 400 90"/><path d="M160 60 Q300 -20 440 60"/><path d="M120 30 Q300 -70 480 30"/></g>
  </g>
  </g>
</svg>'''


def pessoa(p, skin=0, hair="short", hair_col="#2d1f17", shirt="#3a86ff", extra="", glasses=False, beard=False):
    """Pessoa genérica (busto), viewBox 0 0 400 500. Bocas {p}-m-smile / {p}-m-o / {p}-m-flat."""
    sk = SKINS[skin % len(SKINS)]
    hairs = {
        "short": f'<path d="M95 200 C80 90 160 50 200 50 C260 50 330 90 305 200 C290 140 250 120 200 120 C150 120 110 140 95 200 Z" fill="{hair_col}" stroke="{INK}" stroke-width="6"/>',
        "bun": f'<circle cx="200" cy="40" r="42" fill="{hair_col}" stroke="{INK}" stroke-width="6"/><path d="M95 200 C80 80 320 80 305 200 C290 130 110 130 95 200 Z" fill="{hair_col}" stroke="{INK}" stroke-width="6"/>',
        "long": f'<path d="M80 330 C50 120 140 50 200 50 C260 50 350 120 320 330 L280 330 L290 170 C250 120 150 120 110 170 L120 330 Z" fill="{hair_col}" stroke="{INK}" stroke-width="6"/>',
        "bald": f'<path d="M98 200 C95 170 105 150 115 140 M302 200 C305 170 295 150 285 140" stroke="{hair_col}" stroke-width="16" fill="none"/>',
        "slick": f'<path d="M95 190 C70 70 330 60 305 190 C280 110 130 110 95 190 Z" fill="{hair_col}" stroke="{INK}" stroke-width="6"/><path d="M140 100 C190 70 260 75 290 110" stroke="#fff" stroke-width="5" fill="none" opacity=".5"/>',
        "cap": f'<path d="M90 170 C90 60 310 60 310 170 Z" fill="{hair_col}" stroke="{INK}" stroke-width="6"/><path d="M200 170 L360 175 L200 190 Z" fill="{hair_col}" stroke="{INK}" stroke-width="5"/>',
        "curly": "".join(f'<circle cx="{200 + 115 * c:.0f}" cy="{150 + 95 * s:.0f}" r="40" fill="{hair_col}" stroke="{INK}" stroke-width="5"/>'
                         for c, s in [(-.95, .3), (-.8, -.4), (-.4, -.9), (0, -1), (.4, -.9), (.8, -.4), (.95, .3)]),
    }
    gl = (f'<g fill="rgba(200,235,255,.15)" stroke="{INK}" stroke-width="7"><rect x="125" y="185" width="65" height="50" rx="12"/><rect x="210" y="185" width="65" height="50" rx="12"/></g>'
          f'<path d="M190 205 L210 205" stroke="{INK}" stroke-width="6"/>') if glasses else ""
    bd = f'<path d="M110 260 C120 340 280 340 290 260 C280 330 120 330 110 260 Z" fill="{hair_col}" opacity=".85"/>' if beard else ""
    back = hairs["long"] if hair == "long" else ""
    front = "" if hair == "long" else hairs[hair]
    return f'''<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>{dots(p)}</defs>
  <g id="{p}-rig">
  {back}
  <path d="M10 500 C20 400 110 360 200 355 C290 360 380 400 390 500 Z" fill="{shirt}" stroke="{INK}" stroke-width="8"/>
  <path d="M10 500 C20 400 110 360 180 357 L150 410 C90 430 60 470 55 500 Z" fill="url(#{p}-dots)"/>
  {extra}
  <rect x="170" y="300" width="60" height="65" fill="{sk}" stroke="{INK}" stroke-width="7"/>
  <ellipse cx="200" cy="220" rx="108" ry="120" fill="{sk}" stroke="{INK}" stroke-width="8"/>
  {front}
  <ellipse cx="160" cy="215" rx="15" ry="18" fill="#fff" stroke="{INK}" stroke-width="4"/><ellipse cx="240" cy="215" rx="15" ry="18" fill="#fff" stroke="{INK}" stroke-width="4"/>
  <circle class="{p}-pupil" cx="162" cy="218" r="8" fill="{INK}"/><circle class="{p}-pupil" cx="242" cy="218" r="8" fill="{INK}"/>
  <path d="M138 185 Q160 175 182 185 M218 185 Q240 175 262 185" stroke="{INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
  {gl}{bd}
  <path d="M200 225 L192 262 Q200 268 210 262" fill="none" stroke="{INK}" stroke-width="5"/>
  <path id="{p}-m-smile" d="M168 288 Q200 312 232 288" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>
  <ellipse id="{p}-m-o" opacity="0" cx="200" cy="295" rx="14" ry="18" fill="#6b1f2a" stroke="{INK}" stroke-width="5"/>
  <path id="{p}-m-flat" opacity="0" d="M175 295 L225 295" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>
  </g>
</svg>'''


def cachorro(p):
    """Cachorro (busto). viewBox 0 0 400 420. {p}-eyes / {p}-eyes-closed."""
    return f'''<svg viewBox="0 0 400 420" xmlns="http://www.w3.org/2000/svg" overflow="visible"><g id="{p}-rig">
  <ellipse cx="200" cy="360" rx="150" ry="80" fill="#c98a55" stroke="{INK}" stroke-width="8"/>
  <path d="M90 120 C40 130 30 260 80 280 C110 250 120 170 110 130 Z" fill="#7a4a2a" stroke="{INK}" stroke-width="8"/>
  <path d="M310 120 C360 130 370 260 320 280 C290 250 280 170 290 130 Z" fill="#7a4a2a" stroke="{INK}" stroke-width="8"/>
  <ellipse cx="200" cy="200" rx="120" ry="125" fill="#d9a066" stroke="{INK}" stroke-width="8"/>
  <ellipse cx="200" cy="270" rx="70" ry="50" fill="#f2d2a6" stroke="{INK}" stroke-width="6"/>
  <g id="{p}-eyes"><circle cx="155" cy="185" r="20" fill="#fff" stroke="{INK}" stroke-width="5"/><circle cx="245" cy="185" r="20" fill="#fff" stroke="{INK}" stroke-width="5"/>
    <circle class="{p}-pupil" cx="157" cy="190" r="11" fill="{INK}"/><circle class="{p}-pupil" cx="247" cy="190" r="11" fill="{INK}"/></g>
  <g id="{p}-eyes-closed" opacity="0" stroke="{INK}" stroke-width="7" fill="none" stroke-linecap="round"><path d="M135 190 Q155 202 175 190"/><path d="M225 190 Q245 202 265 190"/></g>
  <ellipse cx="200" cy="245" rx="24" ry="17" fill="{INK}"/><path d="M200 262 L200 285 M175 290 Q200 305 225 290" stroke="{INK}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M180 300 q20 40 40 0" fill="#ff6b81" stroke="{INK}" stroke-width="5"/>
  <rect x="120" y="320" width="160" height="26" rx="10" fill="{MAG}" stroke="{INK}" stroke-width="6"/><circle cx="200" cy="356" r="14" fill="{YEL}" stroke="{INK}" stroke-width="5"/>
</g></svg>'''


def gato(p):
    """Gato sentado. viewBox 0 0 300 360."""
    return f'''<svg viewBox="0 0 300 360" xmlns="http://www.w3.org/2000/svg" overflow="visible"><g id="{p}-rig">
  <path d="M220 330 C300 300 290 220 250 200" fill="none" stroke="{INK}" stroke-width="22" stroke-linecap="round"/>
  <path d="M220 330 C300 300 290 220 250 200" fill="none" stroke="#5c5c5c" stroke-width="12" stroke-linecap="round"/>
  <ellipse cx="150" cy="270" rx="95" ry="85" fill="#5c5c5c" stroke="{INK}" stroke-width="8"/>
  <path d="M70 110 L85 30 L130 85 Z M230 110 L215 30 L170 85 Z" fill="#5c5c5c" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
  <ellipse cx="150" cy="140" rx="90" ry="80" fill="#6b6b6b" stroke="{INK}" stroke-width="8"/>
  <ellipse cx="115" cy="135" rx="18" ry="14" fill="#c6f432" stroke="{INK}" stroke-width="5"/><ellipse cx="185" cy="135" rx="18" ry="14" fill="#c6f432" stroke="{INK}" stroke-width="5"/>
  <rect x="111" y="124" width="8" height="22" rx="4" fill="{INK}"/><rect x="181" y="124" width="8" height="22" rx="4" fill="{INK}"/>
  <path d="M100 118 L132 128 M200 118 L168 128" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>
  <path d="M142 165 L158 165 L150 175 Z" fill="#ff8fa3" stroke="{INK}" stroke-width="3"/><path d="M130 185 Q150 200 172 180" fill="none" stroke="{INK}" stroke-width="5"/>
  <path d="M60 165 L20 155 M60 175 L18 180 M240 165 L280 155 M240 175 L282 180" stroke="{INK}" stroke-width="4"/>
  <ellipse id="{p}-paw" cx="210" cy="320" rx="26" ry="18" fill="#6b6b6b" stroke="{INK}" stroke-width="6"/>
</g></svg>'''


def thought(cid, html, left, top, width, size=40, z=8, color=INK, bg="#fff"):
    """Balão de pensamento de HQ (nuvem + bolinhas), com texto em HTML."""
    return f'''<div id="{cid}" data-layout-allow-overlap data-layout-allow-occlusion style="position:absolute;left:{left}px;top:{top}px;width:{width}px;z-index:{z}">
      <div id="{cid}-in" style="position:relative;transform-origin:15% 100%">
        <div style="position:relative;background:{bg};border:8px solid {INK};border-radius:60px;padding:22px 28px;box-shadow:8px 8px 0 {INK};
          font-family:'Archivo Black';font-size:{size}px;line-height:1.15;color:{color};text-align:center">{html}</div>
        <div style="position:absolute;left:40px;bottom:-34px;width:30px;height:30px;border-radius:50%;background:{bg};border:6px solid {INK}"></div>
        <div style="position:absolute;left:18px;bottom:-62px;width:18px;height:18px;border-radius:50%;background:{bg};border:5px solid {INK}"></div></div></div>'''
