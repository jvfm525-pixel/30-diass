"""Cena "O QUE MUDOU" (UPGRADE / DOWNGRADE) da série O Chat Controla.

Mostra o Armando ANTES e DEPOIS lado a lado, com as barras que mudaram e a
lista do que mudou na aparência (calculada por hq_lib.visual_changes).
"""
from hq_lib import GREEN, INK, MAG, RED, YEL, armando, scene, speed_lines, tier, visual_changes

ICON = {"money": "💰", "health": "❤️", "love": "💘", "rep": "⭐"}
NAME = {"money": "DINHEIRO", "health": "SAÚDE", "love": "AMOR", "rep": "REPUTAÇÃO"}


def upgrade_scene(cid, before, after, dur, reveal=0.6):
    """before/after: dicts com money, health, love, rep (0–100)."""
    changes = visual_changes(before, after)
    up = any(c[1] == "UPGRADE" for c in changes) or sum(after.values()) > sum(before.values())
    title = "UPGRADE!" if up else "DOWNGRADE…"
    tcol = GREEN if up else RED
    deltas = "".join(
        f'<div class="uc-d" style="display:inline-block;margin:6px;font-family:\'Archivo Black\';font-size:40px;color:{INK};'
        f'background:{GREEN if after[k] > before[k] else "#ff8fa3"};border:6px solid {INK};border-radius:16px;padding:2px 16px;box-shadow:6px 6px 0 {INK}">'
        f'{ICON[k]} {before[k]} → {after[k]}</div>'
        for k in ("money", "health", "love", "rep") if after[k] != before[k])
    if changes:
        items = "".join(f'<div class="uc-i" style="margin:8px 0">{ic} <b style="color:{GREEN if kind == "UPGRADE" else RED}">{kind}</b>: {", ".join(t)}</div>'
                        for ic, kind, t in changes)
    else:
        nxt = []
        for k in ("money", "health", "love", "rep"):
            t = tier(after[k])
            if t < 3:
                need = [26, 51, 70][t] - after[k]
                nxt.append((need, k))
        need, k = min(nxt)
        items = f'<div class="uc-i" style="margin:8px 0">Quase lá! Falta {need} de {ICON[k]} {NAME[k].lower()} pro próximo visual 👀</div>'
    body = f'''
    <svg class="full" viewBox="0 0 1080 1920" data-layout-ignore style="z-index:0"><rect width="1080" height="1920" fill="#3a0ca3"/>
      <g id="{cid}-rays">{speed_lines(cid + "-sl", 540, 760, 44, "#fff", .12)}</g></svg>
    <div style="position:absolute;left:0;right:0;top:330px;text-align:center;z-index:6">
      <div id="{cid}-t" style="display:inline-block;font-family:'Archivo Black';font-size:110px;color:{tcol};-webkit-text-stroke:12px {INK};paint-order:stroke fill;text-shadow:10px 10px 0 {INK}">{title}</div></div>
    <div id="{cid}-b" style="position:absolute;left:60px;top:500px;width:450px;z-index:3">
      <div id="{cid}-b-in" style="position:relative;background:#ddd;border:9px solid {INK};border-radius:30px;box-shadow:10px 10px 0 {INK};overflow:hidden;height:520px">
        <div style="position:absolute;left:0;right:0;top:10px;text-align:center;font-family:'Archivo Black';font-size:40px;color:{INK}">ANTES</div>
        <div style="position:absolute;left:10px;top:70px;width:430px">{armando(cid + "b", stats=before)}</div></div></div>
    <div id="{cid}-a" style="position:absolute;left:570px;top:500px;width:450px;z-index:4">
      <div id="{cid}-a-in" style="position:relative;background:{YEL};border:9px solid {INK};border-radius:30px;box-shadow:10px 10px 0 {INK};overflow:hidden;height:520px">
        <div style="position:absolute;left:0;right:0;top:10px;text-align:center;font-family:'Archivo Black';font-size:40px;color:{INK}">DEPOIS</div>
        <div style="position:absolute;left:10px;top:70px;width:430px">{armando(cid + "a", stats=after)}</div></div></div>
    <div id="{cid}-arrow" style="position:absolute;left:480px;top:700px;z-index:5;font-size:110px">➡️</div>
    <div style="position:absolute;left:0;right:0;top:1050px;text-align:center;z-index:5">{deltas}</div>
    <div id="{cid}-list" data-layout-allow-overlap style="position:absolute;left:80px;right:80px;top:1150px;z-index:5">
      <div id="{cid}-list-in" style="background:#fff;border:8px solid {INK};box-shadow:10px 10px 0 {INK};padding:14px 26px;font-family:Inter;font-weight:800;font-size:34px;line-height:1.25;color:{INK}">{items}</div></div>'''
    js = f'''
      tl.fromTo("#{cid}-rays", {{ rotation: 0 }}, {{ rotation: 15, duration: {dur}, ease: "none", transformOrigin: "540px 760px" }}, 0);
      tl.fromTo("#{cid}-t", {{ scale: 0, rotation: -12 }}, {{ scale: 1, rotation: -3, duration: .35, ease: "back.out(2.5)" }}, 0);
      tl.fromTo("#{cid}-b-in", {{ x: -600 }}, {{ x: 0, duration: .35, ease: "back.out(1.4)" }}, .1);
      tl.fromTo("#{cid}-a-in", {{ scale: 0, rotation: 12 }}, {{ scale: 1, rotation: 2, duration: .4, ease: "back.out(2)" }}, {reveal});
      tl.fromTo("#{cid}-arrow", {{ scale: 0 }}, {{ scale: 1, duration: .25, ease: "back.out(3)" }}, {reveal - .15});
      tl.fromTo(".uc-d", {{ scale: 0 }}, {{ scale: 1, duration: .25, stagger: .12, ease: "back.out(2.5)" }}, {reveal + .4});
      tl.fromTo("#{cid}-list-in", {{ y: 300, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .35, ease: "back.out(1.5)" }}, {reveal + .8});
      hfAlive(tl, "{cid}b", {dur}); hfAlive(tl, "{cid}a", {dur});
      tl.set(["#{cid}a-m-sad", "#{cid}a-br-sad"], {{ opacity: 0 }}, 0); tl.set(["#{cid}a-m-{'grin' if up else 'shock'}", "#{cid}a-br-{'shock' if up else 'worry'}"], {{ opacity: 1 }}, 0);'''
    return scene(cid, body, js, bg="#3a0ca3")
