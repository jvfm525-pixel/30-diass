// ================================================================ vídeo: Subaru · cenas 0–4 (capa, a morte e a volta na rua, voltar da morte, a mão, o preço)
const RDOF_C = { ap: 0.008, max: 0.014 }, RDOF_M = { ap: 0.005, max: 0.012 }, RDOF_L = { ap: 0.0025, max: 0.008 };
const peitoRZ = (p) => corpoW(p, "chest", 0, 0.16, 0.12);
// mundo cinza (o tempo parou): satura pra quase zero e puxa pro azul; devolve o tempo "congelado" pras partículas
function cinzaTempo(t, a, b, sat0) { const k = smr(t, a, a + 0.35) * (1 - smr(t, b - 0.35, b)); GU.uSat.value = lerp(sat0, 0.06, k); GU.uLift.value.set(0.01 * k, 0.015 * k, 0.04 * k); return { k, tc: k > 0.5 ? Math.min(t, a + 0.2) : t }; }
// mão no peito (dor)
const maoPeito = (p, k) => { maoEm(p, 0, corpoW(p, "chest", -0.04, 0.12, 0.17), k, { abre: 0.5, poleY: 0.2, poleZ: -0.3 }); maoEm(p, 1, corpoW(p, "chest", 0.05, 0.1, 0.17), k * 0.8, { abre: 0.5, poleY: 0.2, poleZ: -0.3 }); };
const LUZ_RUA = { bg: 0x6a5a7a, fog: [20, 150], fogCol: 0xc89080, look: { exposure: 1.06, bloom: 0.45, bloomT: 0.82, vig: 0.45, sat: 1.12, con: 1.06, dof: RDOF_M, rosto: 0.4, lift: [0.015, 0.006, 0] },
  sun: { dir: [-0.5, 0.35, -0.8], col: 0xffb070, I: 2.2, c: [0, 1, 0], r: 16 }, hemi: { sky: 0xd8a0b0, ground: 0x4a3a30, I: 0.85 }, fill: { col: 0xffd0b0, I: 0.6, dir: [0.4, 0.3, 1] }, rim: { col: 0xffb080, str: 1.3 } };
const LUZ_JARDIM = { bg: 0x040818, fog: [16, 120], fogCol: 0x0c1428, look: { exposure: 1.12, bloom: 0.55, bloomT: 0.78, vig: 0.55, sat: 1.05, con: 1.08, dof: RDOF_M, rosto: 0.55, lift: [0, 0.008, 0.02] },
  sun: { dir: [0.4, 0.7, -0.5], col: 0xb8c8ff, I: 0.8, c: [0, 1, 3], r: 14 }, hemi: { sky: 0x2a3a6a, ground: 0x0a0e10, I: 0.6 }, fill: { col: 0xffc890, I: 0.45, dir: [0.3, 0.3, 1] }, rim: { col: 0xbfd8ff, str: 1.3 } };
const SU_POS = [-0.42, 4.6], EM_POS = [0.42, 4.6]; // no jardim, um de frente pro outro diante do chafariz

// ---------------------------------------------------------------- 0 · capa: o Subaru no mundo cinza, a mão de sombra no peito
addSet("s0-capa", (g) => {
  jardimMansao(g); const su = subaruLP(); g.add(su); su.position.set(0, 0, 4.6);
  const M = maoSombra(g);
  return { ...LUZ_JARDIM, hand: 0, look: { ...LUZ_JARDIM.look, dof: RDOF_C },
    update(t) { cinzaTempo(t, -1, 99, 1.05); vive(su, t, 411, { boca: "grito", choque: 1, triste: 0.6, palpebra: 1.05 }, 0.05); maoPeito(su, 0.8); M.set(V3(0.7, 0, 5.4), peitoRZ(su), 1, t, 1); },
    cam() { return closeRosto(su, 0.95, 0.15, -0.06, 32); } };
});

// ---------------------------------------------------------------- 1 · abertura: a rua da capital; ele "morre" (cai de joelhos, tudo escurece), volta no tempo e acorda em pé na barraca
addSet("s1-abertura", (g) => {
  const __n = "s1-abertura"; const [a, b] = T.sc["s1-abertura"];
  const RU = ruaCapital(g), PS = passantes(g, 6, { xs: [-3.4, -2.6, -1.8, -3.0] });
  const su = subaruLP(); g.add(su); su.position.set(1.3, 0, 0.6); su.rotation.y = -0.4; const sp = sombraPe(g, su);
  const ve = pessoaLP({ seed: 650, pele: 0xeac0a0, olho: "#4a3a2a", roupa: 0x8a5a3a, calca: 0x4a3a2a, botoes: false, cabelo: { ...CABELOS_AOT.rod, seed: 651 } }); g.add(ve); ve.position.set(4.35, 0, 0); ve.rotation.y = -Math.PI / 2;
  const em = emiliaLP(); g.add(em); const spE = sombraPe(g, em);
  return { ...LUZ_RUA, hand: 0.005,
    update(t) {
      chicote(t, a, 0.22, 1); floatDust(RU.poeira, t, 0.2, 0.1); PS.forEach((q) => q.upd(t));
      const cai = smr(t, K.morrer, K.morrer + 0.5) * (1 - smr(t, K.acordar - 0.05, K.acordar)); // morre (cai de joelhos) até o "acordar"
      vive(su, t, 411, { boca: cai > 0.5 ? "aberta" : t > K.acordar && t < K.antes ? "aberta" : "linha", choque: t > K.acordar && t < K.antes ? 1 : 0, triste: t > K.contar ? 0.6 : 0, palpebra: cai > 0.5 ? 0.3 : 1.0 }, 0.12);
      if (cai > 0) kneelPose(su, cai); maoPeito(su, Math.max(cai, smr(t, K.acordar, K.acordar + 0.3) * (1 - smr(t, K.antes, K.antes + 0.5)))); sp(0);
      escurece(t, K.morrer + 0.15, K.morrer + 0.6, [0.05, 0, 0.02], 0.92 * (1 - smr(t, K.acordar - 0.08, K.acordar))); flash(t, K.acordar, 0.05, 0.45, [0.85, 0.9, 1]); GU.uFlash.value *= 0.55;
      vive(ve, t, 650, { boca: "sorriso", palpebra: 0.9 }, 0.15);
      // a Emilia chega no "nem pra quem você mais ama"
      const D = 2.2, f = smr(t, K.ama - 1.6, K.ama - 0.2); em.visible = t > K.ama - 1.7; if (em.visible) { if (f < 1) gait(em, D * f, { from: [-0.6, 0, 3.0], ang: Math.PI * 0.8, step: gaitFit(D, 0.5, 0) }); else { em.position.set(-0.6 + Math.sin(Math.PI * 0.8) * D, 0, 3.0 + Math.cos(Math.PI * 0.8) * D); em.rotation.y = 1.1; vive(em, t, 421, { boca: "sorriso", palpebra: 0.95 }, 0.1); } rostoLP(em, t, { boca: "sorriso" }); cabeloVento(em, t, 0.5, [1, 0, 0.2]); } spE(0);
      if (t > K.ama - 1.6) pose(su, { neck: [0, -0.5 * smr(t, K.ama - 1.0, K.ama - 0.5), 0] }, 1); cabeloVento(su, t, 0.5, [1, 0, 0.2]);
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([2.6, 1.55, 3.6], [2.4, 1.5, 3.1], [1.3, 1.1, 0.6], [1.3, 1.05, 0.6], 38, 36)],
        [K.acordar - 0.05, (tt, u) => ({ ...closeRosto(su, lerp(1.0, 0.85, E.inOut(u)), 0.15, 0, 30) })],
        [K.antes - 0.2, mov([-3.5, 2.6, 6.5], [-3.2, 2.4, 5.6], [1.6, 1.0, 0.2], [1.6, 1.0, 0.2], 42, 40)],
        [K.contar - 0.2, (tt, u) => ({ ...closeRosto(su, lerp(0.95, 0.8, E.inOut(u)), -0.18, 0, 30) })],
        [K.ama - 1.5, mov([0.6, 1.5, 4.6], [0.5, 1.45, 4.0], [0.4, 1.3, 1.2], [0.4, 1.3, 1.0], 40, 38)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 2 · voltar da morte: a mesma rua; ecos dele (de luz) onde já morreu; os outros passam como se nada fosse
addSet("s2-volta", (g) => {
  const __n = "s2-volta"; const [a, b] = T.sc["s2-volta"];
  const RU = ruaCapital(g), PS = passantes(g, 8, { xs: [-3.4, -2.4, -1.4, 2.3] });
  const su = subaruLP(); g.add(su); su.position.set(0.2, 0, 0.8); const sp = sombraPe(g, su);
  const ecos = [[2.6, 0.2, -1.2, 1], [-1.6, -3.5, 0.6, 0], [1.4, 5.0, 2.6, 1]].map(([x, z, ry, aj], i) => { const e = fantasma(subaruLP(), 0xffb8d0, 0); g.add(e); e.position.set(x, 0, z); e.rotation.y = ry; e.userData.aj = aj; return e; });
  const ve = pessoaLP({ seed: 650, pele: 0xeac0a0, olho: "#4a3a2a", roupa: 0x8a5a3a, calca: 0x4a3a2a, botoes: false, cabelo: { ...CABELOS_AOT.rod, seed: 651 } }); g.add(ve); ve.position.set(4.35, 0, 0); ve.rotation.y = -Math.PI / 2;
  return { ...LUZ_RUA, hand: 0.005,
    update(t) {
      chicote(t, a, 0.22, -1); floatDust(RU.poeira, t, 0.2, 0.1); PS.forEach((q) => q.upd(t));
      vive(su, t, 411, { boca: "linha", triste: 0.4, palpebra: 0.95 }, 0.12); pose(su, { neck: [0.25 * smr(t, K.mundo, K.poder) * (1 - smr(t, K.morre, K.morre + 0.4)), 0, 0] }, 1);
      maoEm(su, 0, frenteW(su, 0.1, 1.15, 0.32), smr(t, K.mundo, K.poder) * (1 - smr(t, K.morre, K.morre + 0.4)), { abre: 0.8, poleY: -0.2, poleZ: -0.3 }); sp(0); cabeloVento(su, t, 0.5, [1, 0, 0.2]);
      const ap = smr(t, K.morre - 0.2, K.volta + 0.3) * (1 - smr(t, K.outros, K.outros + 0.8)); ecos.forEach((e, i) => { e.visible = ap > 0.02; e.userData.fm.opacity = 0.18 * ap; restPose(e); idle(e, t, 700 + i, 0.05); if (e.userData.aj) kneelPose(e, 1); maoPeito(e, 1); standFeet(e); });
      vive(ve, t, 650, { boca: "sorriso", palpebra: 0.9 }, 0.15);
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.5, 9, 14], [0.4, 2.2, 6.5], [0.2, 0.6, -2], [0.2, 1.2, 0.8], 46, 40)],
        [K.mundo - 0.2, (tt, u) => ({ ...closeRosto(su, lerp(1.1, 0.95, E.inOut(u)), 0.2, -0.08, 32) })],
        [K.morre - 0.3, mov([-4.2, 2.4, 7.5], [-3.6, 2.2, 6.6], [1.0, 0.9, 0.5], [1.0, 0.9, 0.5], 44, 42)],
        [K.lembra - 0.2, (tt, u) => ({ ...closeRosto(su, lerp(0.95, 0.8, E.inOut(u)), -0.15, 0, 30) })],
        [K.outros - 0.2, mov([-3.0, 1.4, 1.8], [-3.0, 1.45, 0.2], [2.0, 1.1, 0.8], [2.0, 1.1, -0.6], 40, 40)],
        [K.nunca - 0.3, (tt, u) => ({ ...closeRosto(ve, lerp(1.0, 0.85, E.inOut(u)), 0.2, 0, 30) })],
      ], b); },
  };
});

// ---------------------------------------------------------------- 3 · a mão: o jardim da mansão à noite; ele começa a contar pra Emilia, tudo vira cinza e congela, mãos de sombra apertam o coração dele
addSet("s3-mao", (g) => {
  const __n = "s3-mao"; const [a, b] = T.sc["s3-mao"];
  const JM = jardimMansao(g);
  const su = subaruLP(); g.add(su); su.position.set(SU_POS[0], 0, SU_POS[1]); su.rotation.y = Math.PI / 2; const spS = sombraPe(g, su);
  const em = emiliaLP(); g.add(em); em.position.set(EM_POS[0], 0, EM_POS[1]); em.rotation.y = -Math.PI / 2; const spE = sombraPe(g, em);
  const M = [maoSombra(g), maoSombra(g), maoSombra(g)], bases = [V3(-1.4, 0, 5.6), V3(-1.2, 0, 3.6), V3(-1.9, 0, 4.4)];
  return { ...LUZ_JARDIM, hand: 0.004,
    update(t) {
      const C = cinzaTempo(t, K.parou, K.vez + 0.2, LUZ_JARDIM.look.sat), tc = C.tc;
      floatDust(JM.F.jato, tc, 1.4, 0.4); floatDust(JM.vag, tc, 0.4, 0.25);
      const dor = smr(t, K.apertou - 0.2, K.apertou + 0.3) * (1 - smr(t, K.vez + 0.2, K.volta3)) + 0.6 * smr(t, K.volta3 - 0.1, K.volta3 + 0.3);
      vive(su, tc, 411, { boca: dor > 0.4 ? "grito" : t > K.emilia3 - 0.5 && t < K.parou ? "aberta" : "linha", fala: t > K.emilia3 - 0.6 && t < K.parou ? 1 : 0, choque: dor, triste: 0.5 * dor, palpebra: 1.0 }, 0.1);
      if (dor > 0) { pose(su, { spine: [0.35 * dor, 0, 0], neck: [0.15 * dor, 0, 0] }, 1); maoPeito(su, dor); } spS(0);
      vive(em, tc, 421, { boca: "linha", palpebra: 0.95 }, 0.1); spE(0); if (C.k < 0.5) { cabeloVento(em, t, 0.4, [0, 0, 1]); cabeloVento(su, t, 0.4, [0, 0, 1]); }
      const km = smr(t, K.mao - 0.3, K.peito + 0.2) * (1 - smr(t, K.vez + 0.1, K.vez + 0.6)) + smr(t, K.volta3 - 0.2, K.volta3 + 0.4); M.forEach((m, i) => m.set(bases[i], peitoRZ(su), Math.min(1, km) * (1 - i * 0.12), t, i));
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([3, 7, 16], [1.6, 2.4, 10], [0, 3, -10], [0, 1.2, 4.6], 46, 40)],
        [K.emilia3 - 0.3, mov([0.1, 1.5, 7.4], [0.05, 1.45, 6.7], [0, 1.25, 4.6], [0, 1.25, 4.6], 40, 38)],
        [K.mao - 0.3, mov([-2.6, 1.6, 7.6], [-2.3, 1.5, 7.0], [-0.4, 1.0, 4.6], [-0.4, 1.1, 4.6], 42, 40)],
        [K.apertou - 0.2, (tt, u) => ({ ...closeRosto(su, lerp(0.95, 0.75, E.inOut(u)), 0.2, -0.04, 30) })],
        [K.vez - 0.2, mov([1.6, 1.5, 6.8], [1.4, 1.45, 6.3], [-0.2, 1.1, 4.6], [-0.2, 1.1, 4.6], 40, 38)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 4 · o preço: de novo cinza; a mão vai pra Emilia; ela cai de joelhos e vira pétalas de luz
addSet("s4-preco", (g) => {
  const __n = "s4-preco"; const [a, b] = T.sc["s4-preco"];
  const JM = jardimMansao(g);
  const su = subaruLP(); g.add(su); su.position.set(SU_POS[0], 0, SU_POS[1]); su.rotation.y = Math.PI / 2; const spS = sombraPe(g, su);
  const em = emiliaLP(); g.add(em); em.position.set(EM_POS[0], 0, EM_POS[1]); em.rotation.y = -Math.PI / 2; const spE = sombraPe(g, em);
  const M = [maoSombra(g), maoSombra(g)], bases = [V3(1.6, 0, 5.4), V3(1.5, 0, 3.7)];
  const petalas = dustPts(160, [-0.35, 0.35, 0, 1.6, -0.3, 0.3], 0xf0e8ff, 0.04, 0.9); petalas.position.set(EM_POS[0], 0, EM_POS[1]); g.add(petalas);
  return { ...LUZ_JARDIM, hand: 0.004,
    update(t) {
      const C = cinzaTempo(t, a - 1, K.emilia4 + 0.6, LUZ_JARDIM.look.sat), tc = C.tc; floatDust(JM.F.jato, tc, 1.4, 0.4); floatDust(JM.vag, tc, 0.4, 0.25);
      vive(su, tc, 411, { boca: t > K.ouvindo ? "grito" : "aberta", choque: 1, triste: 0.7, palpebra: 1.05 }, 0.08); maoEm(su, 1, frenteW(su, -0.1, 1.2, 0.5), smr(t, K.ouvindo, K.morreu), { abre: 0.9, poleY: -0.3, poleZ: -0.2 }); spS(0);
      const cai = smr(t, K.morreu - 0.2, K.morreu + 0.4), some = smr(t, K.emilia4, K.emilia4 + 0.7);
      em.visible = some < 0.98; vive(em, tc, 421, { boca: t > K.ouvindo ? "aberta" : "linha", choque: smr(t, K.ouvindo - 0.2, K.ouvindo + 0.2), palpebra: lerp(1.0, 0.2, cai) }, 0.05); if (cai > 0) kneelPose(em, cai); maoPeito(em, smr(t, K.ouvindo, K.ouvindo + 0.4)); spE(0);
      petalas.visible = some > 0.01; petalas.material.opacity = 0.9 * (1 - smr(t, K.emilia4 + 1.2, b)); petalas.position.y = 0.6 * some; floatDust(petalas, t, 0.6, 0.3);
      const km = smr(t, K.dele, K.ouvindo + 0.3) * (1 - smr(t, K.emilia4, K.emilia4 + 0.5)); M.forEach((m, i) => m.set(bases[i], peitoRZ(em), km * (1 - i * 0.12), t, i + 3));
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([2.6, 1.6, 7.6], [2.3, 1.5, 7.0], [0.4, 1.0, 4.6], [0.4, 1.1, 4.6], 42, 40)],
        [K.dele - 0.2, (tt, u) => ({ ...closeRosto(su, lerp(0.95, 0.8, E.inOut(u)), -0.2, 0, 30) })],
        [K.ouvindo - 0.3, (tt, u) => ({ ...closeRosto(em, lerp(1.0, 0.85, E.inOut(u)), 0.2, -0.02, 30) })],
        [K.morreu - 0.3, mov([-1.6, 1.3, 6.9], [-1.4, 1.2, 6.5], [0.4, 0.7, 4.6], [0.4, 0.8, 4.6], 40, 38)],
      ], b); },
  };
});
