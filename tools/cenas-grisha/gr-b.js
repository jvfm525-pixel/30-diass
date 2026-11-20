// ================================================================ vídeo: Grisha · cenas 5–9 (caverna, Discord, Sartre, Caminhos, fim)

// ---------------------------------------------------------------- 5 · a caverna: o Grisha implora; a Frieda se transforma (raio); o titã do Grisha a devora; as crianças viram luz
addSet("s5-caverna", (g) => {
  const __n = "s5-caverna";
  const [a, b] = T.sc["s5-caverna"];
  const CV = cavernaCristal(g);
  const fr = friedaLP(); g.add(fr); fr.position.set(0, 0, -2.2);
  const gr = grishaLP(); g.add(gr); gr.position.set(0, 0, 0.2); gr.rotation.y = Math.PI;
  const kids = [0, 1, 2, 3].map((i) => { const k = criancaLP(i); g.add(k); k.position.set(-1.2 + i * 0.55, 0, -4.4 - (i % 2) * 0.3); k.rotation.y = 0.2 - i * 0.1; return k; });
  const rod = rodLP(); g.add(rod);
  const raio = raios(g, [0, 14, -2.2], [0, 0, -2.2], { cor: 0xffe8a0, r: 0.08, amp: 0.8, galhos: 5 });
  // titãs: corpo inteiro musculoso, olhos acesos, vapor; o da Frieda e o de Ataque (cabelo longo)
  const tF = titaFig(g, { cor: 0x8a6a5a, cor2: 0x6a4a40, olho: 0xffe8c0, s: 0.95 }); tF.position.set(0, 0, -6.5); tF.visible = false;
  const tG = titaFig(g, { cor: 0x5a3a30, cor2: 0x3a241e, olho: 0x9affb0, cabelo: true, s: 1.05 }); tG.position.set(2, 0, 3); tG.rotation.y = Math.PI - 0.3; tG.visible = false;
  const onda = choque(g, [0, 0, -2.2], 0xfff0c8), onda2 = choque(g, [2, 0, 3], 0xffb090);
  const vapT = steam(g, { origin: [0, 6, -6.5], n: 24, size: 3.0, spread: 6, rise: 1.5, grow: 2.0, opacity: 0.25, life: 3.5, color: 0xf0e8f0 });
  const vap = steam(g, { origin: [0, 0.5, -5], n: 34, size: 3.0, spread: 9, rise: 2, grow: 2.0, opacity: 0.28, life: 4, color: 0xd8e0f0 });
  const luzesK = kids.map(() => dustPts(60, [-0.3, 0.3, 0, 1.0, -0.3, 0.3], 0x9ad8ff, 0.05, 0.9)); luzesK.forEach((p, i) => { kids[i].parent.add(p); p.position.copy(kids[i].position); p.visible = false; });
  const luzR = new THREE.PointLight(0xff6040, 0, 20, 1.2); luzR.position.set(1, 6, 0); g.add(luzR);
  return {
    bg: 0x060a14, fog: [10, 40], fogCol: 0x0a1428, hand: 0.008,
    look: { exposure: 1.12, bloom: 0.8, bloomT: 0.7, vig: 0.6, sat: 1.12, con: 1.08, dof: DOF_MED },
    sun: { dir: [0, 1, 0.3], col: 0x7ab8ff, I: 1.0, c: [0, 1, -2], r: 10 }, hemi: { sky: 0x3a6aaa, ground: 0x0a1020, I: 0.6 }, fill: { col: 0x9ad0ff, I: 0.8, dir: [0, 0.3, 1] }, rim: { col: 0x8ad8ff, str: 1.4 },
    update(t) {
      chicote(t, a, 0.22, -1); vap.upd(t, smr(t, K.transformou, K.transformou + 0.6)); vapT.upd(t, smr(t, K.transformou + 0.2, K.transformou + 0.8)); onda(t, K.transformou); onda2(t, K.devorou); CV.brilhos(t); floatDust(CV.poeira, t, 0.2, 0.1);
      // o Grisha de joelhos implorando, mãos juntas
      restPose(gr); idle(gr, t, 101, 0.2); kneelPose(gr); pose(gr, { handR: 0.6, handL: 0.6 }, 1); rostoLP(gr, t, { boca: t < K.transformou ? "aberta" : "grito", triste: 0.7, choro: 0.6, palpebra: 1.0, choque: smr(t, K.transformou, K.transformou + 0.2) });
      const jun = frenteW(gr, 0, 0.95, 0.28); maoEm(gr, 0, jun.clone().add(V3(0.03, 0, 0)), 1, { abre: 0.5, poleY: 0.0, poleZ: -0.3 }); maoEm(gr, 1, jun.clone().add(V3(-0.03, 0, 0)), 1, { abre: 0.5, poleY: 0.0, poleZ: -0.3 }); ventoAbas(gr, t, 0.4);
      const tr = t > K.transformou; fr.visible = !tr; vive(fr, t, 103, { boca: "linha", triste: 0.5, palpebra: 0.8 }, 0.2);
      raio.set(smr(t, K.transformou - 0.1, K.transformou) * (1 - smr(t, K.transformou + 0.3, K.transformou + 0.7)), t); flash(t, K.transformou, 0.03, 0.35, [1, 0.95, 0.8]); GU.uFlash.value *= 0.6;
      tF.visible = tr && t < K.devorou - 0.32; tF.position.y = -6 + 6 * E.out(smr(t, K.transformou, K.transformou + 0.8)); tF.rotation.y = Math.sin(t * 0.7) * 0.1;
      tG.visible = t > K.devorou - 0.4; tG.position.y = -6 + 6 * E.out(smr(t, K.devorou - 0.4, K.devorou + 0.2)); flash(t, K.devorou, 0.03, 0.45, [1, 0.5, 0.4]); luzR.intensity = 6 * smr(t, K.devorou - 0.2, K.devorou + 0.2) * (1 - smr(t, K.filhos - 0.2, K.filhos + 0.3));
      if (tG.visible) gr.visible = false; else gr.visible = true;
      // as crianças viram luz azul; o Rod foge pelo túnel
      kids.forEach((k, i) => { const d = smr(t, K.filhos + i * 0.15, K.filhos + 0.9 + i * 0.15); k.visible = d < 0.5; vive(k, t, 110 + i, { boca: "aberta", choque: 1, triste: 0.6 }, 0.3); luzesK[i].visible = d > 0.05; luzesK[i].material.opacity = 0.9 * (1 - smr(t, K.filhos + 1, K.filhos + 1.8)); luzesK[i].position.y = kids[i].position.y + d * 1.2; });
      const D = 4, f = clamp((t - (K.filhos - 0.5)) / 1.6); gait(rod, D * f, { from: [2.5, 0, -4.5], ang: 2.4, step: gaitFit(D, 0.8, 1), run: 1 }); rostoLP(rod, t, { boca: "grito", choque: 1, suor: 1 });
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.6, 1.0, 1.8], [1.2, 1.05, 1.5], [0, 0.95, -0.6], [0, 1.0, -0.8], 40, 38)],
        [K.implorou + 0.4, (tt, u) => ({ ...closeRosto(gr, lerp(0.95, 0.8, E.inOut(u)), 0.15, 0, 30) })],
        [K.transformou - 0.15, mov([0.4, 1.2, 4.5], [0.3, 0.9, 5.5], [0, 2, -3], [0, 8, -6], 46, 52)],
        [K.caverna - 0.1, mov([-8, 5, 12], [-6, 6, 10], [0, 4, -4], [0, 6, -4], 50, 48)],
        [K.devorou - 0.3, mov([-5, 4, -9], [-6, 4.5, -10.5], [2, 8.5, 3], [2, 9, 3], 50, 50)],
        [K.filhos - 0.55, mov([0.2, 1.3, 0.6], [0.1, 1.4, 0.1], [-0.3, 0.7, -4.5], [-0.3, 1.2, -4.6], 44, 44)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 6 · Discord: rapidinho
addSet("s6-discord", (g) => {
  const [a, b] = T.sc["s6-discord"];
  vazio(g, 0x0c0820, 0x3a2a7a, 0x06040c);
  const cards = []; for (let i = 0; i < 12; i++) { const c = mesh(box(0.34, 0.21, 0.01), new THREE.MeshStandardMaterial({ map: keyTex, emissive: 0xffffff, emissiveMap: keyTex, emissiveIntensity: 0.6 }), 0, 0, 0, g); c.castShadow = false; cards.push(c); }
  return { bg: 0x0c0820, fog: [6, 30], fogCol: 0x140c30, hand: 0, look: { exposure: 1.1, bloom: 0.8, bloomT: 0.7, vig: 0.5 },
    sun: { dir: [0, 0.6, 1], col: 0xd8c8ff, I: 1.6, c: [0, 1, 0], r: 4 }, hemi: { sky: 0x6a5ab8, ground: 0x0a0814, I: 0.7 }, fill: { col: 0xffffff, I: 0.4, dir: [0, 0.3, 1] }, rim: { col: 0xb0a0ff, str: 1 },
    update(t) { chicote(t, a, 0.2, 1); const lt = t - a; cards.forEach((c, i) => { const up = E.outBack(smr(t, a + i * 0.04, a + 0.5 + i * 0.04)), an = (i / 12) * Math.PI * 2 + lt * 1.2, r = 0.25 + up * 0.75; c.position.set(Math.cos(an) * r, 1.2 + Math.sin(an * 2 + lt) * 0.25, -0.5 + Math.sin(an) * r * 0.5); c.rotation.set(0.2, an + Math.PI / 2, 0.1); c.scale.setScalar(Math.max(0.001, up)); }); },
    cam(t) { return { ...path2(t, [[a, [0, 1.3, 2.6], [0, 1.2, -0.5], 40], [b, [0, 1.3, 2.1], [0, 1.2, -0.5], 38]]), near: 0.03 }; } };
});

// ---------------------------------------------------------------- 7 · Sartre: o mundo das ideias dourado (como o Boécio da referência): estrada de luz, anéis de mostrador, pilar de luz; correntes; dois caminhos
addSet("s7-sartre", (g) => {
  const __n = "s7-sartre";
  const [a, b] = T.sc["s7-sartre"];
  vazio(g, 0x0a0806, 0x3a2810, 0x050403);
  const ch = mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: 0x1a140c, roughness: 0.25, metalness: 0.55 }), 0, 0, 0, g); ch.rotation.x = -Math.PI / 2;
  const estrada = estradaLuz(g, 6, 140, 7, 0xffc860);
  const pil = pilarLuz(g, [0, 0, -70], 70, 0.9, 0xfff0c8);
  const aneis = [0, 1, 2, 3].map((i) => anelMostrador(g, 6 + i * 2.6, { pos: [0, 2.0, -10 - i * 7], marcas: 72 }));
  const astro = [0, 1, 2].map((i) => { const r = anelMostrador(g, 3.2 + i * 0.5, { pos: [0, 4.2, -14], marcas: 48 }); r.rotation.set(i * 0.9, i * 0.6, 0); return r; });
  const gr = grishaLP(); g.add(gr); const sp = sombraPe(g, gr);
  const corr = [0, 1, 2].map((i) => { const r = mesh(new THREE.TorusGeometry(0.6, 0.012, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }), 0, 0.5 + i * 0.45, 0, g); return r; });
  const cam1 = linhaLuz(g, [[0, 0.02, -0.4], [-1.5, 0.02, -4], [-5, 0.02, -16]], { curva: true, r: 0.05, cor: 0xfff0c0, seg: 30 }), cam2 = linhaLuz(g, [[0, 0.02, -0.4], [1.5, 0.02, -4], [5, 0.02, -16]], { curva: true, r: 0.05, cor: 0xfff0c0, seg: 30 });
  const pts = dustPts(260, [-10, 10, 0.2, 9, -40, 6], 0xffd890, 0.05, 0.85); g.add(pts); const est = estrelinhas(g, 40, [-8, 8, 0.5, 10, -30, 4], { cor: 0xffe8c0, s: 0.3 });
  const D = 2.2, L = gaitFit(D, 0.5);
  return {
    bg: 0x0a0806, fog: [10, 120], fogCol: 0x0a0806, hand: 0,
    look: { exposure: 1.02, bloom: 0.7, bloomT: 0.72, vig: 0.6, sat: 1.05, con: 1.1, dof: DOF_MED },
    sun: { dir: [0, 0.35, -1], col: 0xffc070, I: 2.0, c: [0, 1, -1], r: 8 }, hemi: { sky: 0x6a4a2a, ground: 0x0a0806, I: 0.45 }, fill: { col: 0xffd8a0, I: 0.5, dir: [0.3, 0.3, 1] }, rim: { col: 0xffc070, str: 1.8 },
    update(t) {
      flash(t, a, 0.001, 0.5, [1, 0.9, 0.7]); floatDust(pts, t, 0.2, 0.15); est(t);
      estrada.forEach((l, i) => l.set(smr(t, a + i * 0.06, a + 1.0 + i * 0.06)));
      aneis.forEach((r, i) => { const k = smr(t, K.livre - 0.8 + i * 0.15, K.livre + 0.3 + i * 0.15); r.scale.setScalar(Math.max(0.001, E.outBack(k))); r.visible = k > 0.01; r.rotation.z = t * (0.05 + i * 0.03) * (i % 2 ? 1 : -1); });
      astro.forEach((r, i) => { const k = smr(t, a + 0.4, a + 1.4); r.scale.setScalar(Math.max(0.001, k)); r.rotation.x += 0; r.rotation.y = t * (0.25 + i * 0.1); r.rotation.x = i * 0.9 + t * 0.12; });
      pil.gl.material.opacity = 0.5 + 0.1 * Math.sin(t * 2);
      const anda = clamp((t - a) / (K.queria - a)); gait(gr, D * anda, { from: [0, 0, 1.2], ang: Math.PI, step: L });
      if (t > K.queria) { restPose(gr); idle(gr, t, 101, 0.2); standFeet(gr); gr.position.set(0, 0, 1.2 - D); gr.rotation.y = Math.PI; }
      rostoLP(gr, t, { boca: "linha", triste: 0.5, palpebra: 0.8 }); pose(gr, { neck: [0.3 * smr(t, K.escolha - 0.4, K.escolha + 0.4), 0, 0] }, 1); ventoAbas(gr, t, 0.5); sp(0);
      corr.forEach((r, i) => { const k = smr(t, K.condenado - 0.3 + i * 0.15, K.condenado + 0.4 + i * 0.15); r.material.opacity = 0.9 * k * (1 - smr(t, K.livre, K.livre + 0.5)); r.position.set(gr.position.x, 0.5 + i * 0.45, gr.position.z); r.rotation.set(Math.PI / 2 + Math.sin(t * 1.3 + i) * 0.25, 0, t * (0.6 + i * 0.3)); r.scale.setScalar(lerp(2.5, 0.7, k)); });
      const ca = smr(t, K.queria - 0.2, K.queria + 0.8); [cam1, cam2].forEach((c) => { c.set(ca); c.m.position.z = gr.position.z + 0.4; c.m.material.opacity = 1 - 0.9 * smr(t, K.escolha - 0.1, K.escolha + 0.6); });
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, (tt, u) => { const c = gr.position; return { pos: [c.x + 0.5, 1.5, c.z + 4.2 - 0.6 * u], look: [c.x, 1.5, c.z - 6], fov: 44 }; }],
        [K.condenado - 0.3, (tt, u) => ({ ...closeRosto(gr, lerp(1.2, 0.95, E.inOut(u)), 0.2, 0, 30) })],
        [K.livre - 0.6, (tt, u) => { const c = gr.position; return { pos: [c.x + 0.3, 1.0 + 0.4 * u, c.z + 3.0 + 0.8 * u], look: [c.x, 3.2, c.z - 12], fov: 48 }; }],
        [K.queria - 0.3, mov([0, 6, 2.5], [0, 7.5, 1.0], [0, 0, -3], [0, 0, -6], 46, 46)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 8 · os Caminhos: o Grisha de joelhos chorando na areia; o Eren adulto atrás; "siga em frente"
addSet("s8-caminhos", (g) => {
  const __n = "s8-caminhos";
  const [a, b] = T.sc["s8-caminhos"];
  const CM = caminhos(g);
  const gr = grishaLP(); g.add(gr); gr.position.set(0, 0, 0); gr.rotation.y = 0.1;
  const er = erenAdultoLP(); g.add(er); er.position.set(0.35, 0, -0.75); er.rotation.y = 0.05;
  const brE = glowSprite(0x9ad8ff, 2.4, 0); g.add(brE);
  const spG = sombraPe(g, gr), spE = sombraPe(g, er); const areia = riscosVento(g, 30, [-6, 6, 0.05, 1.2, -4, 5], { cor: 0xe8dcc8, op: 0.45, comp: 2.6 }); const graos = folhasRef(g, 120, [-8, 8, 0.05, 1.5, -5, 5], { cores: [0xe8dcc0, 0xd8c8a8, 0xf0e8d8], brilho: 0x302a20, vel: 3.2, s: 0.5 }); const est = estrelinhas(g, 60, [-30, 30, 4, 30, -60, -10], { cor: 0xd8ecff, s: 0.6 });
  return {
    bg: 0x04060e, fog: [20, 140], fogCol: 0x0a1430, hand: 0,
    look: { exposure: 1.15, bloom: 0.75, bloomT: 0.7, vig: 0.55, sat: 1.05, con: 1.06, dof: DOF_MED, lift: [0.0, 0.01, 0.03] },
    sun: { dir: [0, 0.5, -1], col: 0xa8d0ff, I: 1.6, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x4a6aaa, ground: 0x2a2a30, I: 0.7 }, fill: { col: 0xbfe0ff, I: 0.6, dir: [0.3, 0.3, 1] }, rim: { col: 0x9ad8ff, str: 1.5 },
    update(t) {
      flash(t, a, 0.001, 0.5, [0.8, 0.9, 1]); floatDust(CM.pts, t, 0.2, 0.1); areia(t, 1); graos(t, 1); est(t); spG(0); spE(0); cabeloVento(gr, t, 0.8, [1, 0, 0]); cabeloVento(er, t, 1.2, [1, 0, 0]); CM.ramos.forEach((r, i) => r.set(smr(t, a + i * 0.01, a + 1.5 + i * 0.01)));
      // o Grisha ajoelhado chorando; no "siga em frente" ele levanta o rosto
      restPose(gr); idle(gr, t, 101, 0.25); kneelPose(gr); const ergue = smr(t, K.siga - 0.2, K.frente + 0.4);
      pose(gr, { neck: [0.55 * (1 - ergue), 0, 0], head: [0.15 * (1 - ergue), 0, 0], handR: 0.7, handL: 0.7 }, 1);
      maoEm(gr, 0, frenteW(gr, 0.06, 1.05, 0.2).lerp(frenteW(gr, 0.16, 0.55, 0.2), ergue), 1, { abre: 0.4, poleY: 0.0, poleZ: -0.3 }); maoEm(gr, 1, frenteW(gr, -0.06, 1.05, 0.2).lerp(frenteW(gr, -0.16, 0.55, 0.2), ergue), 1, { abre: 0.4, poleY: 0.0, poleZ: -0.3 });
      rostoLP(gr, t, { boca: ergue > 0.5 ? "linha" : "triste", triste: 0.8, choro: 0.9, palpebra: 0.6 + 0.4 * ergue, choque: ergue > 0.3 && ergue < 0.9 ? 1 : 0 }); ventoAbas(gr, t, 0.6);
      // o Eren aparece atrás, como luz, e põe a mão no ombro do pai
      const ap = smr(t, K.memoria - 0.3, K.memoria + 0.8); er.visible = ap > 0.02; er.traverse((m) => { if (m.isMesh && m.material) { m.material.transparent = ap < 1; m.material.opacity = ap; } });
      vive(er, t, 105, { boca: t > K.siga - 0.2 && t < K.frente + 0.3 ? "aberta" : "linha", bravo: 0.5, palpebra: 0.8 }, 0.2); ventoAbas(er, t, 0.6);
      const mao = smr(t, K.filho8 - 0.3, K.filho8 + 0.4); maoEm(er, 0, corpoW(gr, "chest", -0.14, 0.27, 0), mao, { abre: 0.5, poleY: 0.0, poleZ: -0.3 }); pose(er, { handR: 0.4 * mao }, 1);
      brE.position.copy(olhosW(er)).add(V3(0, -0.5, -0.2)); brE.material.opacity = 0.35 * ap * (1 - smr(t, K.memoria + 0.8, K.memoria + 2));
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.2, 0.9, 4.6], [0.15, 0.85, 3.6], [0, 0.7, -1], [0, 0.75, -1], 40, 38)],
        [K.chorando - 0.3, (tt, u) => ({ ...closeRosto(gr, lerp(1.35, 1.15, E.inOut(u)), 0.3, 0.12, 32) })],
        [K.memoria - 0.3, mov([0.9, 1.0, 2.8], [0.7, 1.2, 2.4], [0.1, 1.1, -0.4], [0.2, 1.4, -0.6], 42, 40)],
        [K.eren - 0.25, (tt, u) => ({ ...closeRosto(er, lerp(1.0, 0.8, E.inOut(u)), -0.15, 0, 30) })],
        [K.siga - 0.2, (tt, u) => ({ ...closeRosto(gr, lerp(0.85, 0.72, E.inOut(u)), 0.12, 0, 30) })],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 9 · fim: o morro com a árvore ao pôr do sol; o Eren criança dorme encostado (como na referência); o Grisha vai embora; guindaste até acima da copa
addSet("s9-fim", (g) => {
  const __n = "s9-fim";
  const [a, b] = T.sc["s9-fim"];
  skyDome(g, { top: 0x3a4a8a, mid: 0xe8946a, hor: 0xffd090, ground: 0x6a7a4a, sunDir: [0.55, 0.08, -0.8], sunCol: 0xfff0c0, sunI: 0.9, disk: 1.6, cov: 0.45, cloudLit: 0xffc8a0, cloudSh: 0x7a6a8a, midY: 0.2 });
  const hf = morroRef(g, { gA: 0x6a9a3a, gB: 0xb8c860, c1: 0x3a6a2a, c2: 0x8aa848, mont: 0x9a8aa8 });
  muralhaV2(g, 620, 55, { c: [0, -8, 0], a0: -0.35, a1: 0.35, n: 16 });
  const arv = arvoreRef(g, 0, -2, 1.0, { y: hf(0, -2) - 0.15 });
  gramaAlta(g, 2600, [-7, 7, -5, 12], hf, { h: 0.5, base: 0x4a6a22, ponta: 0xe0d070, mask: (x, z) => Math.hypot(x, z + 2) > 1.0 && !(x > -1.2 && x < 1.8 && z > -1.6 && z < 3.2) });
  const sol = solFlare(g, [330, 50, -480], 2.0, 0xffe0b0);
  const ek = erenKidLP(); g.add(ek); ek.position.set(0.1, hf(0.1, -1.05), -1.05); ek.rotation.y = 0.12;
  const gr = grishaLP(); g.add(gr); const spG = sombraPe(g, gr), spE = sombraPe(g, ek);
  const fol = folhasRef(g, 220, [-9, 9, 0.2, 7, -7, 9], { vel: 2.4, s: 2.2, cores: [0x7ab83a, 0xa8c84a, 0xe0b850, 0x5a9a2a] }), ris = riscosVento(g, 22, [-5, 5, 0.4, 3.4, -1, 9], { cor: 0xfff0d8, op: 0.6, comp: 2.2 });
  const D = 6, L = gaitFit(D, 0.62), tVai = K.empurrado - 0.2;
  return {
    bg: 0xe08a6a, fog: [60, 1100], fogCol: 0xe0b8a0, hand: 0,
    look: { exposure: 1.05, bloom: 0.5, bloomT: 0.8, vig: 0.42, sat: 1.14, con: 1.06, dof: DOF_MED },
    sun: { dir: [0.6, 0.3, -0.75], col: 0xffc890, I: 2.6, c: [0.5, 3, -1.5], r: 10 }, hemi: { sky: 0xe8c0a8, ground: 0x4a4a3a, I: 0.95 }, fill: { col: 0xffd8b0, I: 0.55, dir: [-0.4, 0.3, 1] }, rim: { col: 0xffc080, str: 1.5 },
    update(t) {
      chicote(t, a, 0.22, 1); fol(t, 1.1); ris(t, 1); arv.vento(t, 1.2);
      // o Eren criança dormindo sentado, encostado no tronco, com lágrima (o sonho)
      restPose(ek); idle(ek, t, 6, 0.12); sitPose(ek, 1, { seatY: 0.16, lean: -0.18 }); pose(ek, { neck: [0.3, 0.15, 0.18], legR: [-1.2, 0.25, -0.1, 0.6, 0], legL: [-1.4, -0.2, 0.1, 1.4, -0.1], handR: 0.3, handL: 0.3 }, 1); rostoLP(ek, t, { fechados: true, boca: "linha", choro: 0.5 }); cabeloVento(ek, t, 1, [1, 0, 0.2]);
      maoEm(ek, 0, frenteW(ek, 0.22, 0.12, 0.2), 1, { abre: 0.6, poleY: 0.2, poleZ: -0.2 }); maoEm(ek, 1, frenteW(ek, -0.22, 0.12, 0.25), 1, { abre: 0.6, poleY: 0.2, poleZ: -0.2 });
      // o Grisha olha o filho e vai embora morro abaixo
      if (t < tVai) { gr.position.set(1.0, hf(1.0, 0.2), 0.2); gr.rotation.y = -2.3; vive(gr, t, 101, { boca: "linha", triste: 0.6, palpebra: 0.75 }, 0.2); pose(gr, { neck: [0.4, 0, 0] }, 1); }
      else { const d = D * clamp((t - tVai) / (K.voltar - tVai)); gait(gr, d, { from: [1.0, 0, 0.2], ang: 0.7, step: L, hf: (x, z) => hf(x, z) }); rostoLP(gr, t, { boca: "linha", triste: 0.6 }); }
      ventoAbas(gr, t, 1.3); cabeloVento(gr, t, 1, [1, 0, 0.2]); spG(hf(gr.position.x, gr.position.z)); spE(hf(0.1, -1.05) + 0.02);
      escurece(t, b - 0.7, b, [0, 0, 0], 1);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.5, 0.95, 2.4], [0.35, 0.85, 1.9], [0.1, 0.5, -1.05], [0.1, 0.5, -1.05], 38, 36)],
        [K.comecou - 0.2, (tt, u) => ({ ...closeRosto(ek, lerp(0.8, 0.65, E.inOut(u)), 0.12, 0, 30) })],
        [K.empurrado - 0.3, (tt, u) => { const c = gr.position; return { pos: [c.x - 1.4, c.y + 1.45, c.z + 2.6], look: [c.x, c.y + 1.1, c.z], fov: 40 }; }],
        // guindaste: sobe colado no tronco, passa pelos galhos e sai acima da copa revelando o vale e a muralha (como o fim da referência)
        [K.voltar - 0.4, (tt, u) => { if (u < 0.5) { const k = E.inOut(u / 0.5); return { pos: [0.3, lerp(1.0, 3.2, k), lerp(1.4, 2.2, k)], look: [0, lerp(2.5, 5.5, k), -2], fov: 52 }; } const k = E.inOut((u - 0.5) / 0.5); return { pos: [0.3, lerp(3.2, 13, k), lerp(2.2, 9, k)], look: [0, lerp(5.5, 8, k), lerp(-2, -220, k)], fov: lerp(52, 46, k) }; }],
      ], b);
    },
  };
});
