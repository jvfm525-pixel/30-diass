"""Desenhos SVG reutilizáveis da série "30 Dias do Armando".

Cada função devolve uma string SVG/HTML. `p` é o prefixo de ids, para que
cada cena tenha ids únicos na página montada.
"""
import random

INK = "#2a2420"
SKIN = "#e3a86e"
SKIN_DARK = "#c98a52"
SHIRT = "#7f8f5b"
STINK = "#9bd94f"
STINK_DARK = "#3e6a1d"

W, H = 1080, 1920


def _stubble(seed=7):
    rnd = random.Random(seed)
    dots = []
    for _ in range(70):
        x = rnd.uniform(200, 400)
        y = rnd.uniform(455, 540)
        # mantém os pontos dentro do queixo
        if ((x - 300) / 160) ** 2 + ((y - 400) / 150) ** 2 < 1:
            dots.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.6"/>')
    return "".join(dots)


PIMPLES = [(205, 235), (392, 212), (332, 176), (262, 196), (158, 418),
           (446, 438), (248, 470), (362, 462), (420, 260), (180, 300)]


def armando(p):
    """Armando da cintura pra cima. viewBox 0 0 600 760.

    Partes animáveis (ids):
      {p}-body, {p}-head, {p}-lid-l/-r (pálpebras, scaleY), {p}-pupils,
      {p}-eyes (olhos abertos), {p}-eyes-happy, {p}-brow-tired/-angry/-worried,
      {p}-m-neutral/-smile/-frown/-grit/-shock, {p}-sweat
    """
    pimples = "".join(
        f'<circle cx="{x}" cy="{y}" r="11" fill="#d9613e" stroke="#9c3a22" stroke-width="3"/>'
        f'<circle cx="{x-3}" cy="{y-3}" r="3.5" fill="#ffd0a8"/>' for x, y in PIMPLES)

    def eye(side, cx):
        return f'''
      <clipPath id="{p}-clip-{side}"><ellipse cx="{cx}" cy="345" rx="36" ry="29"/></clipPath>
      <g clip-path="url(#{p}-clip-{side})">
        <ellipse cx="{cx}" cy="345" rx="36" ry="29" fill="#f4f1e6"/>
        <g class="{p}-pupil"><circle cx="{cx}" cy="352" r="12" fill="{INK}"/>
          <circle cx="{cx+4}" cy="348" r="3.5" fill="#fff"/></g>
        <rect id="{p}-lid-{side}" x="{cx-40}" y="314" width="80" height="31" fill="{SKIN}"/>
        <line x1="{cx-38}" y1="345" x2="{cx+38}" y2="345" stroke="{INK}" stroke-width="0"/>
      </g>
      <ellipse cx="{cx}" cy="345" rx="36" ry="29" fill="none" stroke="{INK}" stroke-width="5"/>'''

    return f'''<svg viewBox="0 0 600 760" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <g id="{p}-body">
    <path d="M40 790 C55 610 135 548 300 542 C465 548 545 610 560 790 Z" fill="{SHIRT}" stroke="{INK}" stroke-width="9"/>
    <ellipse cx="225" cy="650" rx="34" ry="22" fill="#a8663a" opacity=".55"/>
    <ellipse cx="392" cy="700" rx="26" ry="18" fill="#a8663a" opacity=".5"/>
    <ellipse cx="330" cy="616" rx="14" ry="10" fill="#c9452f" opacity=".55"/>
    <path d="M150 640 q10 60 -5 130" stroke="{INK}" stroke-width="6" fill="none" opacity=".45"/>
    <path d="M450 640 q-10 60 5 130" stroke="{INK}" stroke-width="6" fill="none" opacity=".45"/>
    <path d="M245 552 Q300 610 355 552" fill="none" stroke="{INK}" stroke-width="8"/>
  </g>
  <g id="{p}-head">
    <ellipse cx="112" cy="352" rx="30" ry="46" fill="{SKIN}" stroke="{INK}" stroke-width="8"/>
    <ellipse cx="488" cy="352" rx="30" ry="46" fill="{SKIN}" stroke="{INK}" stroke-width="8"/>
    <ellipse cx="300" cy="335" rx="190" ry="212" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
    <path d="M118 315 Q100 235 150 182 Q140 250 150 312 Z" fill="#3b2a1f" stroke="{INK}" stroke-width="5"/>
    <path d="M482 315 Q500 235 450 182 Q460 250 450 312 Z" fill="#3b2a1f" stroke="{INK}" stroke-width="5"/>
    <path d="M282 128 q-18 -38 8 -62" stroke="#3b2a1f" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M304 125 q12 -44 -6 -70" stroke="#3b2a1f" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M326 130 q24 -30 10 -56" stroke="#3b2a1f" stroke-width="7" fill="none" stroke-linecap="round"/>
    <g fill="#5a3f2c" opacity=".55">{_stubble()}</g>
    {pimples}
    <g id="{p}-brow-tired" fill="none" stroke="{INK}" stroke-width="13" stroke-linecap="round">
      <path d="M182 290 Q228 274 278 288"/><path d="M322 288 Q372 274 418 290"/></g>
    <g id="{p}-brow-angry" opacity="0" fill="none" stroke="{INK}" stroke-width="15" stroke-linecap="round">
      <path d="M186 266 L280 300"/><path d="M320 300 L414 266"/></g>
    <g id="{p}-brow-worried" opacity="0" fill="none" stroke="{INK}" stroke-width="13" stroke-linecap="round">
      <path d="M186 296 L278 266"/><path d="M322 266 L414 296"/></g>
    <g id="{p}-eyes">{eye("l", 230)}{eye("r", 370)}</g>
    <g id="{p}-eyes-happy" opacity="0" fill="none" stroke="{INK}" stroke-width="10" stroke-linecap="round">
      <path d="M198 352 Q230 318 262 352"/><path d="M338 352 Q370 318 402 352"/></g>
    <g transform="rotate(-3 300 345)">
      <rect x="168" y="298" width="124" height="96" rx="24" fill="rgba(220,235,240,.18)" stroke="{INK}" stroke-width="15"/>
      <rect x="308" y="298" width="124" height="96" rx="24" fill="rgba(220,235,240,.18)" stroke="{INK}" stroke-width="15"/>
      <path d="M292 330 Q300 322 308 330" stroke="{INK}" stroke-width="12" fill="none"/>
      <rect x="280" y="312" width="40" height="32" rx="4" fill="#f2efe4" stroke="{INK}" stroke-width="4" transform="rotate(8 300 328)"/>
      <path d="M288 320 l24 14 M288 334 l24 -6" stroke="#b9b3a1" stroke-width="3"/>
    </g>
    <path d="M300 368 C270 420 255 455 280 468 C292 476 308 476 320 468 C345 455 330 420 300 368 Z" fill="{SKIN_DARK}" stroke="{INK}" stroke-width="7"/>
    <path id="{p}-m-neutral" d="M252 512 Q300 505 348 512" fill="none" stroke="{INK}" stroke-width="9" stroke-linecap="round"/>
    <path id="{p}-m-smile" opacity="0" d="M236 494 Q300 566 364 494 Z" fill="#5b2420" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
    <path id="{p}-m-frown" opacity="0" d="M252 528 Q300 492 348 528" fill="none" stroke="{INK}" stroke-width="9" stroke-linecap="round"/>
    <g id="{p}-m-grit" opacity="0"><path d="M250 498 L350 498 L342 530 L258 530 Z" fill="#f4f1e6" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M252 514 L348 514 M283 498 L283 530 M317 498 L317 530" stroke="{INK}" stroke-width="4"/></g>
    <ellipse id="{p}-m-shock" opacity="0" cx="300" cy="515" rx="24" ry="30" fill="#5b2420" stroke="{INK}" stroke-width="8"/>
    <path id="{p}-sweat" d="M455 250 C440 280 440 296 455 300 C470 296 470 280 455 250 Z" fill="#8fd3ff" stroke="{INK}" stroke-width="4"/>
  </g>
</svg>'''


def bianca(p):
    """Bianca (busto) com olhos de coração. viewBox 0 0 300 340."""
    flowers = "".join(
        f'<circle cx="{x}" cy="{y}" r="9" fill="{c}"/><circle cx="{x}" cy="{y}" r="3.5" fill="#ffe066"/>'
        for x, y in [(70, 290), (120, 262), (170, 300), (220, 270), (250, 315), (100, 320), (195, 330), (45, 325)]
        for c in [["#ff7eb6", "#b18cff", "#7ec8ff"][(x + y) % 3]])
    heart = "M0 -6 C-6 -16 -22 -12 -20 0 C-18 10 -6 16 0 22 C6 16 18 10 20 0 C22 -12 6 -16 0 -6 Z"
    return f'''<svg viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <path d="M20 340 C30 260 80 232 150 230 C220 232 270 260 280 340 Z" fill="#fbd3e6" stroke="{INK}" stroke-width="6"/>
  <g>{flowers}</g>
  <circle cx="150" cy="40" r="38" fill="#7a4a2a" stroke="{INK}" stroke-width="6"/>
  <path d="M60 140 C50 60 250 60 240 140 C255 190 230 225 215 240 L85 240 C70 225 45 190 60 140 Z" fill="#7a4a2a" stroke="{INK}" stroke-width="6"/>
  <ellipse cx="150" cy="150" rx="80" ry="88" fill="#f1c39a" stroke="{INK}" stroke-width="6"/>
  <path d="M80 110 C100 70 200 70 220 110 C190 95 120 95 80 110 Z" fill="#7a4a2a"/>
  <g id="{p}-hearts" fill="#ff3b5c" stroke="{INK}" stroke-width="3">
    <path transform="translate(118 150)" d="{heart}"/><path transform="translate(182 150)" d="{heart}"/></g>
  <circle cx="98" cy="185" r="12" fill="#ff8fa3" opacity=".6"/><circle cx="202" cy="185" r="12" fill="#ff8fa3" opacity=".6"/>
  <path d="M128 200 Q150 220 172 200" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>
</svg>'''


def room(p, dark=0.0):
    """Quarto bagunçado do Armando, 1080x1920."""
    planks = "".join(f'<line x1="0" y1="{y}" x2="1080" y2="{y}"/>' for y in range(1450, 1920, 90))
    stripes = "".join(f'<rect x="{x}" y="0" width="34" height="1380"/>' for x in range(30, 1080, 110))
    shade = f'<rect width="1080" height="1920" fill="#0c1218" opacity="{dark}"/>' if dark else ""
    return f'''<svg viewBox="0 0 1080 1920" width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="{p}-vig" cx="50%" cy="45%" r="70%">
    <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>
  <rect width="1080" height="1920" fill="#4e6576"/>
  <g fill="#47606f">{stripes}</g>
  <path d="M760 120 c40 30 30 90 -10 110 c-30 -20 -40 -80 10 -110 Z M150 1000 c60 10 70 70 20 90 c-40 -10 -60 -60 -20 -90 Z" fill="#6b6a4a" opacity=".5"/>
  <g>
    <rect x="80" y="360" width="320" height="400" fill="#1a2838" stroke="{INK}" stroke-width="14"/>
    <circle cx="300" cy="460" r="40" fill="#f2e9b8"/>
    <line x1="240" y1="360" x2="240" y2="760" stroke="{INK}" stroke-width="10"/>
    <line x1="80" y1="560" x2="400" y2="560" stroke="{INK}" stroke-width="10"/>
    <path d="M100 520 L360 380 M300 740 L390 610" stroke="#c9d6e0" stroke-width="5" opacity=".5"/>
    <path d="M60 340 L420 340 L410 420 C360 470 320 420 300 470 C270 520 230 440 200 500 C160 560 120 470 70 520 Z" fill="#8a3b33" stroke="{INK}" stroke-width="8"/>
  </g>
  <g transform="rotate(7 760 470)">
    <rect x="630" y="300" width="270" height="350" fill="#a3503d" stroke="{INK}" stroke-width="10"/>
    <circle cx="765" cy="430" r="62" fill="#e7c06a" opacity=".8"/>
    <rect x="680" y="540" width="170" height="26" fill="#f0e2c0" opacity=".8"/>
    <path d="M900 300 L840 300 L900 370 Z" fill="#4e6576" stroke="{INK}" stroke-width="6"/>
  </g>
  <rect x="0" y="1180" width="1080" height="200" fill="#3d5160"/>
  <rect x="0" y="1170" width="1080" height="22" fill="#2c3a45"/>
  <rect x="0" y="1380" width="1080" height="540" fill="#5e4535"/>
  <g stroke="#4a3528" stroke-width="5">{planks}</g>
  <g stroke="{INK}" stroke-width="7">
    <rect x="40" y="1330" width="300" height="60" fill="#d8b071" transform="rotate(-4 190 1360)"/>
    <rect x="60" y="1280" width="280" height="56" fill="#cfa35f" transform="rotate(5 200 1308)"/>
    <rect x="30" y="1236" width="290" height="52" fill="#d8b071" transform="rotate(-2 175 1262)"/>
    <circle cx="140" cy="1262" r="16" fill="#c8452e"/>
    <path d="M690 1400 C700 1320 820 1300 880 1340 C960 1320 1030 1370 1010 1430 C900 1460 760 1460 690 1400 Z" fill="#7c5d8e"/>
    <path d="M760 1350 C800 1330 860 1350 850 1390" fill="none" stroke-width="6"/>
    <path d="M820 1405 C860 1370 940 1380 960 1420" fill="#3f7c8a"/>
    <rect x="560" y="1420" width="40" height="70" rx="8" fill="#c43c3c" transform="rotate(70 580 1455)"/>
    <rect x="420" y="1460" width="38" height="66" rx="8" fill="#3c7ec4"/>
    <path d="M360 1520 q30 -20 60 0 q-10 30 -60 0 Z" fill="#e9e4d4"/>
  </g>
  <rect width="1080" height="1920" fill="url(#{p}-vig)"/>
  {shade}
</svg>'''


def fly(p):
    return f'''<g id="{p}">
    <ellipse class="{p}-w" cx="-9" cy="-12" rx="13" ry="8" fill="#e6eef2" stroke="{INK}" stroke-width="3" opacity=".9"/>
    <ellipse class="{p}-w" cx="9" cy="-12" rx="13" ry="8" fill="#e6eef2" stroke="{INK}" stroke-width="3" opacity=".9"/>
    <ellipse cx="0" cy="0" rx="12" ry="15" fill="#161616"/>
    <circle cx="-5" cy="-9" r="4" fill="#c0392b"/><circle cx="5" cy="-9" r="4" fill="#c0392b"/></g>'''


def stink(p, x, y, s=1.0):
    d = "M0 0 q26 -40 0 -80 q-26 -40 0 -80 q26 -40 0 -80"
    return f'''<g transform="translate({x} {y}) scale({s})"><g id="{p}">
    <path d="{d}" fill="none" stroke="{STINK_DARK}" stroke-width="24" stroke-linecap="round"/>
    <path d="{d}" fill="none" stroke="{STINK}" stroke-width="13" stroke-linecap="round"/></g></g>'''


def x_mark(p):
    return f'''<svg id="{p}" viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#1a0f0f" stroke-width="40" stroke-linecap="round"><line x1="22" y1="22" x2="98" y2="98"/><line x1="98" y1="22" x2="22" y2="98"/></g>
  <g stroke="#ff2d3d" stroke-width="24" stroke-linecap="round"><line x1="22" y1="22" x2="98" y2="98"/><line x1="98" y1="22" x2="22" y2="98"/></g></svg>'''


# Estilo de legenda: branco com contorno preto grosso, condensado.
CAPTION_CSS = """
  .cap { position:absolute; left:0; right:0; text-align:center; font-family:'League Gothic', sans-serif;
         color:#fff; text-transform:uppercase; line-height:.92; letter-spacing:.01em;
         -webkit-text-stroke: 14px #111; paint-order: stroke fill;
         text-shadow: 0 10px 0 rgba(0,0,0,.45); }
  .cap-inner { display:inline-block; }
"""

# JS comum: moscas em órbita, fedor ondulando, respiração e piscadas.
# Tudo é função do tempo da timeline (determinístico).
RIG_JS = """
  function hfFlies(tl, ids, dur, area) {
    const st = { t: 0 };
    tl.to(st, { t: dur, duration: dur, ease: 'none', onUpdate: () => {
      ids.forEach((id, i) => {
        const a = area[i], t = st.t, ph = i * 1.7;
        const x = a[0] + a[2] * Math.cos(t * (2.1 + i * .37) + ph) + 18 * Math.sin(t * 9 + ph);
        const y = a[1] + a[3] * Math.sin(t * (2.9 + i * .23) + ph) + 12 * Math.cos(t * 11 + ph);
        gsap.set('#' + id, { x: x, y: y, rotation: 25 * Math.sin(t * 4 + ph) });
        gsap.set('.' + id + '-w', { scaleY: (Math.floor(t * 30 + i) % 2) ? 0.35 : 1, transformOrigin: '50% 100%' });
      });
    } }, 0);
  }
  function hfStink(tl, ids, dur) {
    const st = { t: 0 };
    tl.to(st, { t: dur, duration: dur, ease: 'none', onUpdate: () => {
      ids.forEach((id, i) => {
        const c = ((st.t * 0.55 + i * 0.37) % 1);
        gsap.set('#' + id, { y: -70 * c, opacity: Math.sin(Math.PI * c) * 0.95, scaleX: 1 + 0.25 * Math.sin(st.t * 3 + i) });
      });
    } }, 0);
  }
  function hfBreath(tl, p, dur) {
    const st = { t: 0 };
    tl.to(st, { t: dur, duration: dur, ease: 'none', onUpdate: () => {
      gsap.set('#' + p + '-body', { scaleY: 1 + 0.018 * Math.sin(st.t * 2.4), transformOrigin: '50% 100%' });
      gsap.set('#' + p + '-head', { y: 4 * Math.sin(st.t * 2.4 - 0.6), rotation: 1.2 * Math.sin(st.t * 1.3), transformOrigin: '50% 90%' });
    } }, 0);
  }
  function hfBlink(tl, p, at) {
    at.forEach(t => {
      tl.fromTo(['#' + p + '-lid-l', '#' + p + '-lid-r'], { scaleY: 1 }, { scaleY: 2.1, duration: 0.07, ease: 'power1.in', transformOrigin: '50% 0%' }, t)
        .to(['#' + p + '-lid-l', '#' + p + '-lid-r'], { scaleY: 1, duration: 0.09, ease: 'power1.out' }, t + 0.08);
    });
  }
  // Troca de expressão com "take": encolhe, troca, estica e assenta.
  function hfMood(tl, p, t, show, hide) {
    tl.to('#' + p + '-head', { scaleY: 0.94, scaleX: 1.04, duration: 0.08, ease: 'power2.in', transformOrigin: '50% 100%' }, t);
    hide.forEach(id => tl.set('#' + p + '-' + id, { opacity: 0 }, t + 0.08));
    show.forEach(id => tl.set('#' + p + '-' + id, { opacity: 1 }, t + 0.08));
    tl.to('#' + p + '-head', { scaleY: 1.05, scaleX: 0.97, duration: 0.1, ease: 'power2.out' }, t + 0.08)
      .to('#' + p + '-head', { scaleY: 1, scaleX: 1, duration: 0.25, ease: 'elastic.out(1, 0.5)' }, t + 0.18);
  }
"""


def scene(cid, body, css, js):
    """Monta um arquivo de cena (sub-composição) 1080x1920."""
    return f'''<template>
  <style>
    #root {{ position:absolute; inset:0; overflow:hidden; background:#4e6576; }}
    .full {{ position:absolute; left:0; top:0; width:1080px; height:1920px; }}
    {CAPTION_CSS}
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
