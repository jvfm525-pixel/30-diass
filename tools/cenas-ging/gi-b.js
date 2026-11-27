// ================================================================ vídeo: Ging · cenas 5–8 (Discord, o caminho, árvore do mundo, fim)

// ---------------------------------------------------------------- 5 · Discord: rapidinho, cartões de key girando num fundo roxo
addSet("s5-discord", (g) => {
  const __n = "s5-discord";
  const [a, b] = T.sc["s5-discord"];
  vazio(g, 0x0c0820, 0x3a2a7a, 0x06040c);
  const cards = []; for (let i = 0; i < 12; i++) { const c = mesh(box(0.34, 0.21, 0.01), new THREE.MeshStandardMaterial({ map: keyTex, emissive: 0xffffff, emissiveMap: keyTex, emissiveIntensity: 0.6 }), 0, 0, 0, g); c.castShadow = false; cards.push(c); }
  const gl = glowSprite(0x8a6aff, 3, 0.5); gl.position.set(0, 1.2, -0.5); g.add(gl);
  return {
    bg: 0x0c0820, fog: [6, 30], fogCol: 0x140c30, hand: 0, look: { exposure: 1.1, bloom: 0.8, bloomT: 0.7, vig: 0.5 },
    sun: { dir: [0, 0.6, 1], col: 0xd8c8ff, I: 1.6, c: [0, 1, 0], r: 4 }, hemi: { sky: 0x6a5ab8, ground: 0x0a0814, I: 0.7 }, fill: { col: 0xffffff, I: 0.4, dir: [0, 0.3, 1] }, rim: { col: 0xb0a0ff, str: 1 },
    update(t) { chicote(t, a, 0.2, 1); const lt = t - a; cards.forEach((c, i) => { const up = E.outBack(smr(t, a + i * 0.04, a + 0.5 + i * 0.04)), an = (i / 12) * Math.PI * 2 + lt * 1.2, r = 0.25 + up * 0.75; c.position.set(Math.cos(an) * r, 1.2 + Math.sin(an * 2 + lt) * 0.25, -0.5 + Math.sin(an) * r * 0.5); c.rotation.set(0.2, an + Math.PI / 2, 0.1); c.scale.setScalar(Math.max(0.001, up)); }); },
    cam(t) { return { ...path2(t, [[a, [0, 1.3, 2.6], [0, 1.2, -0.5], 40], [b, [0, 1.3, 2.1], [0, 1.2, -0.5], 38]]), near: 0.03 }; },
  };
});

// ---------------------------------------------------------------- 6 · o caminho: o Ging sozinho na fogueira; deixa um rastro de pistas; o Gon segue e fica mais forte
addSet("s6-porque", (g) => {
  const __n = "s6-porque";
  const [a, b] = T.sc["s6-porque"];
  skyDome(g, { top: 0x060a1c, mid: 0x1a2040, hor: 0x3a3a5a, ground: 0x0a0c14, sunDir: [0.3, 0.3, -1], sunCol: 0xd8e0ff, sunI: 0.6, disk: 1.0, cov: 0.2, cloudLit: 0x6a7090, cloudSh: 0x10141e, stars: 1 });
  const hf = (x, z) => Math.sin(x * 0.18) * 0.4 + Math.cos(z * 0.15) * 0.3 - 0.3;
  terrain(g, { size: 120, segs: 80, h: (x, z) => hf(x, z) + (z < -14 ? (-14 - z) * 0.25 : 0), grassA: 0x22321f, grassB: 0x2e3e26, dirt: 0x3a3428, rock: 0x3a3a3a });
  forestInst(g, 50, 40, (x, z) => hf(x, z), { leaf: 0x1e2e22 });
  // fogueira
  const fog_ = grp(g, 0.6, hf(0.6, 0.5), 0.5); for (let i = 0; i < 5; i++) { const l = mesh(cyl(0.03, 0.03, 0.4, 5), LPmat(0x3a2414), 0, 0.04, 0, fog_); l.rotation.set(Math.PI / 2, i * 1.2, 0.3); }
  const chama = glowSprite(0xff8a30, 0.9, 0.9); chama.position.set(0.6, hf(0.6, 0.5) + 0.25, 0.5); g.add(chama); const luzF = new THREE.PointLight(0xff8a40, 3, 6, 1.4); luzF.position.copy(chama.position); g.add(luzF);
  const gi = gingLP(); g.add(gi); gi.position.set(0, hf(0, 0), 0); gi.rotation.y = 0.6;
  const lic = licenca(g);
  // rastro de pistas: pegadas de luz verde que vão longe; o Gon anda por elas (outra parte do mapa, x=40)
  const P0 = [40, 0, 6], ps = []; for (let i = 0; i < 24; i++) { const z = 6 - i * 0.7, x = 40 + Math.sin(i * 0.5) * 0.8; const p = mesh(new THREE.CircleGeometry(0.1, 8), new THREE.MeshBasicMaterial({ color: 0x9affb0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), x + (i % 2 ? 0.12 : -0.12), hf(x, z) + 0.03, z, g); p.rotation.x = -Math.PI / 2; p.scale.y = 1.6; ps.push(p); }
  const gn = gonLP(); g.add(gn);
  const aura = glowSprite(0x9affb0, 2.2, 0); g.add(aura); const luzA = new THREE.PointLight(0x9affb0, 0, 4, 1.5); g.add(luzA);
  const pathG = (d) => { const i = d / 0.7, z = 6 - d, x = 40 + Math.sin(i * 0.5) * 0.8, x2 = 40 + Math.sin((i + 0.1) * 0.5) * 0.8; return [x, z, Math.atan2(x2 - x, -0.07) ]; };
  const tGon = K.pistas6 - 0.3;
  return {
    bg: 0x060a1c, fog: [10, 50], fogCol: 0x10142a, hand: 0,
    look: { exposure: 1.2, bloom: 0.7, bloomT: 0.7, vig: 0.55, sat: 1.05, con: 1.06, lift: [0.01, 0.01, 0.03] },
    sun: { dir: [0.3, 0.6, -1], col: 0x8a98d8, I: 1.0, c: [0, 1, 0], r: 8 }, hemi: { sky: 0x3a4a7a, ground: 0x0a0c14, I: 0.6 }, fill: { col: 0xff9a50, I: 0.6, dir: [1, 0.2, 0.4] }, rim: { col: 0x9ab0ff, str: 1.1 },
    update(t) {
      chicote(t, a, 0.22, -1); chama.material.opacity = 0.75 + 0.2 * noise1(t * 8); luzF.intensity = 2.6 + 0.8 * noise1(t * 7);
      // o Ging sentado olhando o fogo; no "Hunter" levanta e a licença brilha
      const lev = E.inOut(smr(t, K.hunter6 - 0.5, K.hunter6 + 0.4));
      restPose(gi); idle(gi, t, 81, 0.25); sitPose(gi, 1 - lev, { seatY: 0.2, lean: 0.25 }); if (lev > 0.99) standFeet(gi);
      rostoLP(gi, t, { boca: "linha", triste: t < K.hunter6 ? 0.45 : 0, bravo: t > K.hunter6 ? 0.4 : 0, palpebra: 0.82 });
      if (lev < 0.5) { maoEm(gi, 0, frenteW(gi, 0.12, 0.55, 0.35), 1 - lev * 2, { abre: 0.5, poleY: 0.3, poleZ: -0.2 }); maoEm(gi, 1, frenteW(gi, -0.12, 0.55, 0.35), 1 - lev * 2, { abre: 0.5, poleY: 0.3, poleZ: -0.2 }); }
      const lv = E.outBack(smr(t, K.hunter6 + 0.2, K.hunter6 + 0.7)) * (1 - smr(t, K.pistas6 - 0.6, K.pistas6 - 0.3));
      maoEm(gi, 0, frenteW(gi, 0.1, 1.3, 0.38), lv, { abre: 0.5, poleY: 0.0, poleZ: -0.4 }); pose(gi, { handR: 0.4 * lv }, 1);
      lic.position.copy(frenteW(gi, 0.08, 1.42, 0.44)); lic.rotation.set(-0.1, gi.rotation.y, 0); lic.scale.setScalar(Math.max(0.001, lv)); lic.material.emissiveIntensity = 0.4 + 0.8 * lv;
      // pegadas acendem uma por uma; o Gon anda nelas e a aura cresce até o "forte"
      const dG = 0.6 + 1.2 * clamp((t - tGon) / (K.forte - tGon));
      ps.forEach((p, i) => (p.material.opacity = 0.85 * smr(t, tGon - 0.6 + i * 0.05, tGon - 0.3 + i * 0.05)));
      gait(gn, dG * 2.2, { path: pathG, hf: (x, z) => hf(x, z), step: gaitFit(2.64, 0.4) });
      const forte = smr(t, K.forte - 1.2, K.forte + 0.3); rostoLP(gn, t, { boca: t > K.forte - 0.3 ? "smirk" : "linha", bravo: 0.3 + 0.5 * forte, palpebra: 1.0 });
      if (t > K.forte - 0.2) { restPose(gn); idle(gn, t, 82, 0.2); standFeet(gn); pose(gn, { handR: 1, handL: 1 }, 1); maoEm(gn, 0, frenteW(gn, 0.22, 0.9, 0.12), 1, { abre: 0.6, poleY: 0.3, poleZ: -0.3 }); maoEm(gn, 1, frenteW(gn, -0.22, 0.9, 0.12), 1, { abre: 0.6, poleY: 0.3, poleZ: -0.3 }); }
      aura.position.copy(gn.position).add(V3(0, 0.6, 0)); aura.material.opacity = 0.15 + 0.5 * forte; aura.scale.setScalar(1.2 + 1.6 * forte); luzA.position.copy(aura.position); luzA.intensity = 0.5 + 3 * forte;
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([3.2, 1.6, 3.4], [2.6, 1.3, 2.8], [0.3, 0.6, 0.2], [0.3, 0.55, 0.2], 40, 38)],
        [K.pai - 0.2, (tt, u) => ({ ...closeRosto(gi, lerp(0.9, 0.72, E.inOut(u)), 0.15, 0, 30) })],
        [K.hunter6 - 0.3, mov([1.4, 1.2, 2.2], [1.2, 1.35, 2.0], [0, 1.1, 0], [0, 1.35, 0], 40, 38)],
        [K.pistas6 - 0.3, (tt, u) => { const c = gn.position; return { pos: [c.x + 1.6, c.y + lerp(2.4, 1.6, u), c.z + 3.0], look: [c.x, c.y + 0.5, c.z - 1.2], fov: 42 }; }],
        [K.forte - 0.9, (tt, u) => ({ ...closeRosto(gn, lerp(1.0, 0.75, E.inOut(u)), 0.1, 0, 32) })],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 7 · árvore do mundo: os dois sentados no galho, acima das nuvens, no nascer do sol
addSet("s7-arvore", (g) => {
  const __n = "s7-arvore";
  const [a, b] = T.sc["s7-arvore"];
  const ceu = skyDome(g, { top: 0x3a6ab8, mid: 0xe8a078, hor: 0xf0c090, ground: 0xc8a8a0, sunDir: [0.8, 0.1, -0.6], sunCol: 0xfff0c0, sunI: 0.8, disk: 1.6, cov: 0.35, cloudLit: 0xffe0c0, cloudSh: 0xa08aa0, midY: 0.18 });
  const arv = arvoreMundo(g);
  const ns = nuvensMar(g, -9, 40, 0xfff2e8);
  const gi = gingLP(); g.add(gi); gi.position.set(-0.45, 0, 0.05);
  const gn = gonLP(); g.add(gn); gn.position.set(0.4, 0, 0.05);
  const aves = birds(g, 6, { center: [4, 4, -18], rx: 10, rz: 4 });
  return {
    bg: 0xd8a080, fog: [30, 160], fogCol: 0xd8a890, hand: 0,
    look: { exposure: 0.98, bloom: 0.3, bloomT: 0.9, vig: 0.45, sat: 1.1, con: 1.06 },
    sun: { dir: [0.7, 0.45, 0.4], col: 0xffd8a0, I: 2.0, c: [0, 0, 0], r: 6 }, hemi: { sky: 0xffd0b0, ground: 0x6a5a6a, I: 0.9 }, fill: { col: 0xffe8d0, I: 0.6, dir: [-0.3, 0.3, 1] }, rim: { col: 0xffc080, str: 1.3 },
    update(t) {
      flash(t, a, 0.001, 0.5, [1, 0.95, 0.85]); aves(t); ns.forEach((n, i) => (n.position.x += Math.sin(t * 0.1 + i) * 0.002));
      // sentados no galho (topo em y=0), pernas penduradas
      [gi, gn].forEach((p, i) => { restPose(p); idle(p, t, 81 + i, 0.25); sitPose(p, 1, { seatY: 0.0, lean: 0.05 }); p.position.y = 0.1; pose(p, { legR: [-1.5, 0.1, -0.05, 0.9 + Math.sin(t * 1.2 + i) * 0.15, 0], legL: [-1.5, -0.1, 0.05, 0.9 + Math.sin(t * 1.2 + i + 1.5) * 0.15, 0] }, 1); });
      // mãos apoiadas no galho
      [gi, gn].forEach((p) => { maoEm(p, 0, frenteW(p, 0.24, 0.02, -0.05), 1, { abre: 0.8, poleY: 0.5, poleZ: -0.5 }); maoEm(p, 1, frenteW(p, -0.24, 0.02, -0.05), 1, { abre: 0.8, poleY: 0.5, poleZ: -0.5 }); pose(p, { handR: 0.5, handL: 0.5 }, 1); });
      // olhares: o Gon olha pro pai na pergunta; o Ging olha pro Gon nos "desvios"
      const olhaG = smr(t, K.mae - 0.6, K.mae) * (1 - smr(t, K.desvios + 1.2, K.desvios + 2)), olhaP = smr(t, K.mae - 1.2, K.mae - 0.6) * (1 - smr(t, K.mae + 0.6, K.mae + 1.2)) + smr(t, K.desvios - 0.6, K.desvios);
      pose(gn, { neck: [0, -0.5 * olhaG, 0], head: [-0.1 * olhaG, -0.4 * olhaG, 0] }, 1); pose(gi, { neck: [0, 0.45 * clamp(olhaP), 0], head: [0, 0.4 * clamp(olhaP), 0] }, 1);
      rostoLP(gi, t, { boca: t > K.desvios ? "sorriso" : "linha", palpebra: 0.85, triste: t > K.desculpa && t < K.mae ? 0.2 : 0 });
      rostoLP(gn, t, { boca: t > K.mito7 - 0.3 && t < K.desvios ? "risada" : t > K.desvios ? "sorriso" : "linha", sobe: 0.4, palpebra: 1.05 });
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.5, 1.8, 7.5], [0.4, 0.9, 5.0], [0, -2, -6], [0, 0.4, 0], 50, 46)],
        [K.arvore - 0.2, mov([7, -2.5, 15], [6, -1.5, 13], [-4, 1, -4], [-3, 2, -4], 56, 54)],
        [K.desculpa - 0.4, mov([0.1, 0.9, -1.4], [0.0, 0.85, -1.2], [0, 0.6, 0.1], [0, 0.6, 0.1], 46, 44)],
        [K.desculpa + 0.6, (tt, u) => ({ ...closeRosto(gi, lerp(0.9, 0.75, E.inOut(u)), 0.15, 0, 30) })],
        [K.mae - 0.2, (tt, u) => ({ ...closeRosto(gn, lerp(0.85, 0.7, E.inOut(u)), -0.12, 0, 30) })],
        [K.desvios - 0.3, (tt, u) => ({ ...closeRosto(gi, lerp(0.85, 0.7, E.inOut(u)), 0.15, 0, 30) })],
        [K.valiosas - 1.3, mov([1.4, 0.7, 2.6], [2.4, 1.2, 4.2], [0, 0.6, 0], [0, 0.7, -2], 40, 46)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 8 · fim: o Gon, agora, é quem anda pelo cais até o barco; a Mito acena
addSet("s8-fim", (g) => {
  const __n = "s8-fim";
  const [a, b] = T.sc["s8-fim"];
  const P = porto(g, { top: 0x3a6ab8, mid: 0xf0a878, hor: 0xffd8a0 });
  const gn = gonLP(); g.add(gn);
  const mi = mitoLP(); g.add(mi); mi.position.set(0.35, 0, 1.4); mi.rotation.y = Math.PI;
  const vara = grp(g); mesh(cyl(0.008, 0.012, 1.4, 5), LPmat(0x8a6a3a), 0, 0.7, 0, vara);
  const D = 4.4, L = gaitFit(D, 0.45);
  return { ...LUZ_POR, fogCol: 0xd8a080,
    update(t) {
      chicote(t, a, 0.22, 1); P.M.upd(t); P.aves(t);
      const d = D * clamp((t - a) / (K.partir + 0.4 - a));
      gait(gn, d, { from: [-0.1, 0, 0.6], ang: Math.PI, step: L });
      rostoLP(gn, t, { boca: "sorriso", sobe: 0.3 });
      // a vara de pescar no ombro direito
      maoEm(gn, 0, frenteW(gn, 0.18, 1.0, 0.1), 1, { abre: 0.4, poleY: 0.0, poleZ: -0.3 }); pose(gn, { handR: 0.9 }, 1);
      gn.updateMatrixWorld(true); const w = gn.userData.wr[0].localToWorld(V3(0.02, -0.07, 0)); vara.position.copy(w); vara.rotation.set(-0.9, gn.rotation.y, 0); vara.position.y -= 0.35;
      // a Mito acena
      vive(mi, t, 83, { boca: "sorriso", triste: 0.2 }, 0.2); const ac = smr(t, K.motivo - 0.5, K.motivo); maoEm(mi, 0, frenteW(mi, 0.3, 1.75 + Math.sin(t * 8) * 0.05 * ac, 0.2).add(V3(Math.sin(t * 8) * 0.06 * ac, 0, 0)), ac, { abre: 0.7, poleY: -0.3, poleZ: -0.2 }); pose(mi, { handR: 0.1 }, 1);
      const sai = E.in(smr(t, K.partir + 0.6, b + 1)); P.bc.position.set(1.7 + 0.5 * sai, -0.25, -4.5 - 3 * sai);
      escurece(t, b - 0.6, b, [0, 0, 0], 1);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, (tt, u) => { const c = gn.position; return { pos: [c.x + 1.7, 1.25, c.z - 0.9], look: [c.x, 0.85, c.z - 0.2], fov: 40 }; }],
        [K.motivo - 0.6, (tt, u) => ({ ...closeRosto(mi, lerp(1.0, 0.85, E.inOut(u)), 0.15, 0, 32) })],
        [K.partir - 0.2, mov([2.4, 2.2, 1.6], [2.6, 3.0, 2.6], [0.2, 0.9, -3.5], [0.6, 1.0, -5.5], 42, 44)],
      ], b);
    },
  };
});
