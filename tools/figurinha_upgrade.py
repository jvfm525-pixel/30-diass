"""Cena "O QUE MUDOU" no estilo Álbum de Figurinhas (série do Biel).

Duas figurinhas lado a lado (ANTES e DEPOIS), as barras que mudaram e a lista
do que mudou no visual (figurinha_lib.biel_changes).
"""
from figurinha_lib import BIEL_ICON, GREEN, INK, RED, YEL, biel, biel_changes, kraft, scene, tier

NAME = {"s": "habilidade", "f": "físico", "m": "dinheiro", "c": "cabeça"}


def figurinha_upgrade(cid, before, after, dur, reveal=0.6):
    changes = biel_changes(before, after)
    up = any(c[1] in ("UPGRADE", "FIGURINHA LENDÁRIA") for c in changes)
    down = any(c[1] == "DOWNGRADE" for c in changes) and not up
    title = "UPGRADE!" if up else "DOWNGRADE…" if down else "QUASE LÁ! 👀"
    tcol = "#8ce99a" if up else "#ff8fa3" if down else YEL
    deltas = "".join(
        f'<div class="fu-d" style="display:inline-block;margin:6px;font-family:Bangers;font-size:46px;letter-spacing:.03em;color:{INK};'
        f'background:{"#8ce99a" if after[k] > before[k] else "#ff8fa3"};border:5px solid {INK};border-radius:14px;padding:2px 16px">'
        f'{BIEL_ICON[k]} {before[k]} → {after[k]}</div>'
        for k in "sfmc" if after[k] != before[k])
    if changes:
        items = "".join(f'<div style="margin:6px 0">{ic} <span style="color:{GREEN if kind != "DOWNGRADE" else RED}">{kind}</span>: {", ".join(t)}</div>'
                        for ic, kind, t in changes)
    else:
        need, k = min(([26, 51, 70][tier(after[k])] - after[k], k) for k in "sfmc" if tier(after[k]) < 3)
        items = f'<div style="margin:6px 0">Falta {need} de {BIEL_ICON[k]} {NAME[k]} pro próximo visual 👀</div>'

    def card(side, label, st, x, bgc, rot):
        return f'''<div id="{cid}-{side}" style="position:absolute;left:{x}px;top:470px;width:440px;z-index:{3 if side == "b" else 4}">
          <div id="{cid}-{side}-in" class="card" style="position:relative;height:550px;background:{bgc};overflow:hidden;transform-origin:50% 50%">
            <div class="bang" style="position:absolute;left:0;right:0;top:10px;text-align:center;font-size:48px;color:{INK}">{label}</div>
            <div style="position:absolute;left:85px;top:66px;width:270px">{biel(cid + side, stats=st)}</div>
            <div class="bang" style="position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:34px;color:#1d1a17">Nº 10 · BIEL</div></div></div>'''
    body = f'''
    {kraft(cid + "-k", "#b5d99c", 8)}
    <div style="position:absolute;left:0;right:0;top:320px;text-align:center;z-index:6">
      <div id="{cid}-t" class="bang" style="display:inline-block;font-size:130px;color:{tcol};-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:8px 10px 0 rgba(0,0,0,.3)">{title}</div></div>
    {card("b", "ANTES", before, 70, "#e9e1cc", -4)}
    {card("a", "DEPOIS", after, 570, "#fff7d6", 3)}
    <div id="{cid}-arrow" class="bang" style="position:absolute;left:490px;top:700px;z-index:5;font-size:110px;color:{INK}">➜</div>
    <div style="position:absolute;left:0;right:0;top:1035px;text-align:center;z-index:5">{deltas}</div>
    <div id="{cid}-list" data-layout-allow-overlap style="position:absolute;left:90px;right:90px;top:1105px;z-index:5;text-align:center">
      <div id="{cid}-list-in" class="strip mk" style="font-size:34px;line-height:1.15;color:{INK}">{items}</div></div>'''
    js = f'''
      tl.fromTo("#{cid}-t", {{ scale: 0, rotation: -12 }}, {{ scale: 1, rotation: -3, duration: .3, ease: "steps(4)" }}, 0);
      hfSlap(tl, "#{cid}-b-in", .1, -4);
      tl.fromTo("#{cid}-arrow", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "steps(3)" }}, {reveal - .15});
      hfSlap(tl, "#{cid}-a-in", {reveal}, 3);
      tl.fromTo(".fu-d", {{ scale: 0 }}, {{ scale: 1, duration: .25, stagger: .12, ease: "back.out(2.5)" }}, {reveal + .4});
      tl.fromTo("#{cid}-list-in", {{ y: 200, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .3, ease: "steps(4)" }}, {reveal + .7});
      hfStop(tl, ["{cid}b-rig", "{cid}a-rig"], {dur});'''
    return scene(cid, body, js, bg="#b5d99c")
