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
  const tF = titaLP({ seed: 131, pele: 0xe8c0a8, olho: "#5a7aa8", olhoAlt: 0.9, brava: 0.1, sob: 0x141418, cabelo: { ...CABELOS_AOT.frieda, seed: 141 }, s: 8.2 }); g.add(tF); tF.position.set(0, 0, -7); tF.visible = false;
  const tG = titaLP({ seed: 132, pele: 0xc89078, olho: "#2aaa7a", olhoAlt: 0.62, brava: 0.85, sob: 0x1a1410, cabelo: { cor: 0x1a1410, dentes: 22, dente: 0.28, crista: 0.004, franjaY: 0.9, ladoY: -1.2, nucaY: -1.3, esp: 0.01, espBorda: 0.004, varia: 0.12, seed: 142, pontas: [] }, s: 9.2, orelhas: true }); g.add(tG); tG.position.set(2, 0, 3.5); tG.rotation.y = Math.PI - 0.3; tG.visible = false;
  const onda = choque(g, [0, 0, -2.2], 0xfff0c8), onda2 = choque(g, [2, 0, 3], 0xffb090);
  const vapT = steam(g, { origin: [0, 6, -6.5], n: 24, size: 3.0, spread: 6, rise: 1.5, grow: 2.0, opacity: 0.25, life: 3.5, color: 0xf0e8f0 });
  const vap = steam(g, { origin: [0, 0.5, -9], n: 26, size: 3.0, spread: 12, rise: 2, grow: 2.0, opacity: 0.14, life: 4, color: 0xd8e0f0 });
  const luzesK = kids.map(() => dustPts(60, [-0.3, 0.3, 0, 1.0, -0.3, 0.3], 0x9ad8ff, 0.05, 0.9)); luzesK.forEach((p, i) => { kids[i].parent.add(p); p.position.copy(kids[i].position); p.visible = false; });
  const luzR = new THREE.PointLight(0xff6040, 0, 20, 1.2); luzR.position.set(1, 6, 0); g.add(luzR);
  return {
    bg: 0x060a14, fog: [10, 40], fogCol: 0x0a1428, hand: 0.008,
    look: { exposure: 1.08, bloom: 0.6, bloomT: 0.78, vig: 0.6, sat: 1.12, con: 1.1, dof: DOF_MED, rosto: 0.6 },
    sun: { dir: [0, 1, 0.3], col: 0x7ab8ff, I: 1.0, c: [0, 1, -2], r: 10 }, hemi: { sky: 0x3a6aaa, ground: 0x0a1020, I: 0.6 }, fill: { col: 0x9ad0ff, I: 0.8, dir: [0, 0.3, 1] }, rim: { col: 0x8ad8ff, str: 1.4 },
    update(t) {
      chicote(t, a, 0.22, -1); vap.upd(t, smr(t, K.transformou, K.transformou + 0.6)); vapT.upd(t, 0.45 * smr(t, K.transformou + 0.2, K.transformou + 0.8)); onda(t, K.transformou); onda2(t, K.devorou); CV.brilhos(t); floatDust(CV.poeira, t, 0.2, 0.1);
      // o Grisha de joelhos implorando, mãos juntas
      restPose(gr); idle(gr, t, 101, 0.2); kneelPose(gr); pose(gr, { handR: 0.6, handL: 0.6 }, 1); rostoLP(gr, t, { boca: t < K.transformou ? "aberta" : "grito", triste: 0.7, choro: 0.6, palpebra: 1.0, choque: smr(t, K.transformou, K.transformou + 0.2) });
      const jun = frenteW(gr, 0, 0.95, 0.28); maoEm(gr, 0, jun.clone().add(V3(0.03, 0, 0)), 1, { abre: 0.5, poleY: 0.0, poleZ: -0.3 }); maoEm(gr, 1, jun.clone().add(V3(-0.03, 0, 0)), 1, { abre: 0.5, poleY: 0.0, poleZ: -0.3 }); ventoAbas(gr, t, 0.4);
      const tr = t > K.transformou; fr.visible = !tr; vive(fr, t, 103, { boca: "linha", triste: 0.5, palpebra: 0.8 }, 0.2);
      raio.set(smr(t, K.transformou - 0.1, K.transformou) * (1 - smr(t, K.transformou + 0.3, K.transformou + 0.7)), t); flash(t, K.transformou, 0.03, 0.35, [1, 0.95, 0.8]); GU.uFlash.value *= 0.6;
      tF.visible = tr && t < K.devorou - 0.32; if (tF.visible) { vive(tF, t, 131, { boca: "ryuk", palpebra: 0.9 }, 0.3); tF.position.y = -5 + 5 * E.out(smr(t, K.transformou, K.transformou + 0.8)); }
      tG.visible = t > K.devorou - 0.4; if (tG.visible) { vive(tG, t, 132, { boca: "ryuk", bravo: 0.9, palpebra: 0.85 }, 0.3); tG.position.y = -5 + 5 * E.out(smr(t, K.devorou - 0.4, K.devorou + 0.2)); }  luzR.intensity = 1.6 * smr(t, K.devorou - 0.2, K.devorou + 0.2) * (1 - smr(t, K.filhos - 0.2, K.filhos + 0.3));
      if (tG.visible) gr.visible = false; else gr.visible = true;
      // as crianças viram luz azul; o Rod foge pelo túnel
      kids.forEach((k, i) => { const d = smr(t, K.filhos + i * 0.15, K.filhos + 0.9 + i * 0.15); k.visible = d < 0.5; vive(k, t, 110 + i, { boca: "aberta", choque: 1, triste: 0.6 }, 0.3); luzesK[i].visible = d > 0.05; luzesK[i].material.opacity = 0.9 * (1 - smr(t, K.filhos + 1, K.filhos + 1.8)); luzesK[i].position.y = kids[i].position.y + d * 1.2; });
      const D = 4, f = clamp((t - (K.filhos - 0.5)) / 1.6); gait(rod, D * f, { from: [2.5, 0, -4.5], ang: 2.4, step: gaitFit(D, 0.8, 1), run: 1 }); rostoLP(rod, t, { boca: "grito", choque: 1, suor: 1 });
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.45, 1.1, -1.05], [1.25, 1.08, -0.92], [0, 0.88, 0.1], [0, 0.9, 0.1], 40, 38)],
        [K.implorou + 0.4, (tt, u) => ({ ...closeRosto(gr, lerp(0.95, 0.8, E.inOut(u)), 0.15, 0, 30) })],
        [K.transformou - 0.15, mov([0.4, 1.2, 5.5], [0.3, 1.0, 7.5], [0, 2, -4], [0, 10, -7], 46, 52)],
        [K.caverna - 0.1, mov([-6, 4, 9], [-5, 5, 8], [0, 8, -6], [0, 10, -6], 50, 48)],
        [K.devorou - 0.3, mov([-3, 7, -8], [-3.6, 7.5, -9.5], [2, 11.5, 3.5], [2, 12, 3.5], 46, 44)],
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

// ---------------------------------------------------------------- 7 · Sartre: a floresta na chuva, à noite; o Grisha ajoelhado diante do Eren criança, com a seringa na mão (a escolha)
addSet("s7-sartre", (g) => {
  const __n = "s7-sartre";
  const [a, b] = T.sc["s7-sartre"];
  const FL = florestaChuva(g);
  const ek = erenKidLP(); g.add(ek); ek.position.set(0.45, FL.hf(0.45, -0.3), -0.3); ek.rotation.y = -1.45;
  const gr = grishaLP(); g.add(gr); gr.position.set(-0.12, FL.hf(-0.12, -0.25), -0.25); gr.rotation.y = 1.5;
  const SR = seringa(null); naMao(gr, 0, SR.s, { dx: 0.02, dy: -0.07 });
  const spE = sombraPe(g, ek), spG = sombraPe(g, gr);
  return {
    bg: 0x06080c, fog: [6, 40], fogCol: 0x0c1218, hand: 0.006,
    look: { exposure: 1.12, bloom: 0.55, bloomT: 0.74, vig: 0.6, sat: 0.95, con: 1.08, dof: DOF_MED, rosto: 0.5, lift: [0.0, 0.01, 0.025] },
    sun: { dir: [0.3, 0.9, 0.3], col: 0x8a9ab8, I: 0.6, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x2a3448, ground: 0x08090a, I: 0.45 }, fill: { col: 0xffb870, I: 0.3, dir: [0.6, 0.1, 0.8] }, rim: { col: 0xa8c0e0, str: 1.4 },
    update(t) {
      chicote(t, a, 0.22, 1); FL.chuva_.update(t); FL.LL.intensity = 3 * (0.9 + 0.1 * noise1(t * 7));
      // o Eren em pé, com medo; o Grisha ajoelhado, a seringa brilhando; a mão treme no "não ter escolha"
      vive(ek, t, 6, { boca: t > K.queria ? "triste" : "aberta", triste: 0.8, choro: 0.6, palpebra: 1.05, sobe: 0.6 }, 0.25); pose(ek, { handR: 0.6, handL: 0.6 }, 1);
      restPose(gr); idle(gr, t, 101, 0.15); kneelPose(gr); pose(gr, { spine: [0.15, 0, 0], neck: [0.1, 0, 0] }, 1);
      const treme = smr(t, K.queria - 0.3, K.queria + 0.2) * Math.sin(t * 38) * 0.008, sobe = smr(t, K.livre - 0.6, K.livre);
      maoEm(gr, 0, frenteW(gr, 0.16, 0.72 + 0.1 * sobe + treme, 0.28 + 0.04 * sobe), 1, { abre: 0.6, poleY: 0.1, poleZ: -0.3 }); pose(gr, { handR: 0.85 }, 1);
      maoEm(gr, 1, corpoW(ek, "chest", 0.15, 0.3, 0.0), smr(t, a + 0.3, a + 1.0), { abre: 0.9, poleY: -0.3, poleZ: -0.2 });
      rostoLP(gr, t, { boca: "triste", triste: 0.7, choro: 0.4 + 0.4 * smr(t, K.queria, K.escolha), palpebra: lerp(0.85, 0.55, smr(t, K.escolha - 0.2, K.escolha + 0.3)) });
      SR.liq.material.emissiveIntensity = 1.3 + 0.4 * Math.sin(t * 5); spE(FL.hf(0.45, -0.3)); spG(FL.hf(-0.4, -0.25));
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.2, 1.3, 3.6], [0.15, 1.2, 2.9], [0, 0.9, -0.3], [0, 0.9, -0.3], 42, 40)],
        [K.condenado - 0.3, (tt, u) => ({ ...closeRosto(gr, lerp(1.0, 0.82, E.inOut(u)), -0.3, 0.02, 30) })],
        [K.livre - 0.4, (tt, u) => { const c = SR.s.getWorldPosition(V3()); return { pos: [c.x + 0.1, c.y + 0.12, c.z + lerp(0.8, 0.62, u)], look: [c.x, c.y, c.z], fov: 32, near: 0.02 }; }],
        [K.queria - 0.2, (tt, u) => ({ ...closeRosto(ek, lerp(0.85, 0.7, E.inOut(u)), -0.25, 0, 30) })],
        [K.escolha - 0.2, (tt, u) => ({ ...closeRosto(gr, lerp(0.9, 0.75, E.inOut(u)), -0.3, 0.02, 30) })],
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
    bg: 0x04060e, fog: [40, 420], fogCol: 0x0a1028, hand: 0,
    look: { exposure: 1.0, bloom: 0.42, bloomT: 0.86, vig: 0.55, sat: 1.12, con: 1.1, dof: { ap: 0.003, max: 0.006 }, rosto: 0.55 },
    sun: { dir: [0.3, 0.45, -1], col: 0xa8d0ff, I: 1.1, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x3a5a9a, ground: 0x1a1a22, I: 0.55 }, fill: { col: 0xbfe0ff, I: 0.6, dir: [0.3, 0.3, 1] }, rim: { col: 0x9ad8ff, str: 1.5 },
    update(t) {
      flash(t, a, 0.001, 0.35, [0.8, 0.9, 1]); GU.uFlash.value *= 0.45; floatDust(CM.pts, t, 0.2, 0.1); areia(t, 1); graos(t, 1); est(t); spG(0); spE(0); cabeloVento(gr, t, 0.8, [1, 0, 0]); cabeloVento(er, t, 1.2, [1, 0, 0]); CM.ramos.forEach((r, i) => r.set(smr(t, a + i * 0.01, a + 1.5 + i * 0.01)));
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

// ---------------------------------------------------------------- 9 · fim: a chave do porão no pescoço do Eren; o pai e o filho na porta de casa em Shiganshina ao amanhecer; a câmera sobe sobre os telhados até a Muralha Maria
addSet("s9-fim", (g) => {
  const __n = "s9-fim";
  const [a, b] = T.sc["s9-fim"];
  const SA = shiganshinaAlto(g);
  ruaPedra(g, 12, 30, 12);
  const casa = casaEnx(g, 0, -4.2, { w: 6, d: 5, h: 6, luz: true });
  const sol = solFlare(g, [300, 40, -420], 1.4, 0xffe0b0);
  const ek = erenKidLP(); g.add(ek); ek.position.set(0.35, 0, -0.9); ek.rotation.y = 0.15;
  const gr = grishaLP(); g.add(gr); gr.position.set(-0.05, 0, -1.25); gr.rotation.y = 0.9;
  const ch = chave(null); ek.userData.chest.add(ch); ch.position.set(0, 0.12, 0.16); ch.scale.setScalar(1 / ek.scale.x * 1.0); const cord = mesh(new THREE.TorusGeometry(0.11, 0.003, 4, 24, Math.PI), LPmat(0x5a3a22), 0, 0.22, 0.05, ek.userData.chest); cord.rotation.z = Math.PI;
  const brilho = estrelinhas(g, 1, [0, 0, 0, 0, 0, 0], { cor: 0xfff0c0, s: 0.045 });
  const spE = sombraPe(g, ek), spG = sombraPe(g, gr);
  const fol = folhasRef(g, 60, [-6, 6, 0.3, 4, -4, 4], { cores: [0xe8c890, 0xd8a868, 0xf0e0c0], brilho: 0x302010, vel: 1.4, s: 1.4 });
  return {
    bg: 0xe8a07a, fog: [40, 600], fogCol: 0xe8b8a0, hand: 0,
    look: { exposure: 1.06, bloom: 0.45, bloomT: 0.82, vig: 0.42, sat: 1.12, con: 1.06, dof: DOF_MED, rosto: 0.35 },
    sun: { dir: [0.7, 0.25, -0.65], col: 0xffc890, I: 2.6, c: [0, 2, -1], r: 10 }, hemi: { sky: 0xe8c0a8, ground: 0x4a4038, I: 0.9 }, fill: { col: 0xffd8b0, I: 0.5, dir: [-0.4, 0.3, 1] }, rim: { col: 0xffc080, str: 1.5 },
    update(t) {
      chicote(t, a, 0.22, 1); SA.aves(t); fol(t, 0.7);
      vive(ek, t, 6, { boca: "linha", palpebra: 1.0, sobe: 0.3 }, 0.2); cabeloVento(ek, t, 0.6, [1, 0, 0]);
      vive(gr, t, 101, { boca: t > K.filho9 ? "sorriso" : "linha", triste: 0.3, palpebra: 0.8 }, 0.2); pose(gr, { neck: [0.3, 0.2, 0] }, 1); ventoAbas(gr, t, 0.7);
      // a mão do pai no ombro do filho
      maoEm(gr, 0, corpoW(ek, "head", 0.0, 0.17, -0.01), smr(t, K.empurrado - 0.6, K.empurrado), { abre: 0.9, poleY: -0.2, poleZ: -0.1 }); pose(gr, { handR: 0.2 }, 1);
      const cw = ch.getWorldPosition(V3()); brilho(t, 1); g.children.filter((c) => c.isSprite && c.material.map === estrelaTex).forEach((s_) => s_.position.copy(cw).add(V3(0.01, 0.02, 0.03)));
      spE(0); spG(0);
      escurece(t, b - 0.7, b, [0, 0, 0], 1);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, (tt, u) => { const c = ch.getWorldPosition(V3()); return { pos: [c.x + 0.05, c.y + 0.05, c.z + lerp(0.42, 0.34, u)], look: [c.x, c.y, c.z], fov: 32, near: 0.02 }; }],
        [K.empurrado - 0.5, mov([1.6, 1.2, 2.6], [1.3, 1.25, 2.2], [-0.05, 0.95, -1.0], [-0.05, 1.0, -1.0], 40, 38)],
        // sobe sobre os telhados até ver Shiganshina inteira e a Muralha Maria ao amanhecer
        [K.voltar - 0.4, (tt, u) => { if (u < 0.35) { const k = E.inOut(u / 0.35); return { pos: [0.4, lerp(1.25, 3.5, k), lerp(2.2, 14, k)], look: [0, lerp(1.0, 2.5, k), -1], fov: 40 }; } const k = E.inOut((u - 0.35) / 0.65); return { pos: [lerp(0.4, 4, k), lerp(3.5, 60, k), lerp(14, 70, k)], look: [lerp(0, -10, k), lerp(2.5, 10, k), lerp(-1, -120, k)], fov: lerp(40, 50, k) }; }],
      ], b);
    },
  };
});
