// ================================================================ vídeo: Gojo · cenas 0–4 (capa, Shibuya, plataforma, a lembrança, o fecho, dentro da prisão)
const OLHO_GL = (p, op = 0.55) => { const u = p.userData; return [-1, 1].map((k) => { const s = glowSprite(0x6ad8ff, 0.07, op); s.position.set(k * 0.036, CAB.EY, surfZ(u.headM, k * 0.036, CAB.EY) + 0.012); u.head.add(s); return s; }); };
function bancoMadeira(g, x, z, L = 4.4) { const b = grp(g, x, 0, z), m = LPmat(0x6a4a30, { rim: 0.4 }); mesh(box(L, 0.07, 0.45), m, 0, 0.425, 0, b); [[-L / 2 + 0.2, -0.16], [L / 2 - 0.2, -0.16], [-L / 2 + 0.2, 0.16], [L / 2 - 0.2, 0.16]].forEach(([a, c]) => mesh(box(0.08, 0.39, 0.08), LPmat(0x4a3020), a, 0.195, c, b)); return b; }
// sentado num banco de 0,46 m, mãos nos joelhos (ou atrás, apoiado)
function sentaBanco(p, t, seed, o = {}) { restPose(p); idle(p, t, seed, o.idle ?? 0.25); sitPose(p, 1, { seatY: 0.46, lean: o.lean ?? -0.06 }); pose(p, { neck: o.neck ?? [0, 0, 0], head: o.head ?? [0, 0, 0] }, 1);
  if (o.apoiado) { maoEm(p, 0, frenteW(p, 0.22, 0.47, -0.2), 1, { abre: 0.8, poleY: 0.5, poleZ: -0.6 }); maoEm(p, 1, frenteW(p, -0.22, 0.47, -0.2), 1, { abre: 0.8, poleY: 0.5, poleZ: -0.6 }); }
  else { maoEm(p, 0, frenteW(p, 0.13, 0.53, 0.36), 1, { abre: 0.5, poleY: 0.3, poleZ: -0.2 }); maoEm(p, 1, frenteW(p, -0.13, 0.53, 0.36), 1, { abre: 0.5, poleY: 0.3, poleZ: -0.2 }); } }
const LUZ_PLAT = { bg: 0x06080a, fog: [8, 46], fogCol: 0x0a0e10, look: { exposure: 1.1, bloom: 0.55, bloomT: 0.78, vig: 0.55, sat: 1.0, con: 1.1, dof: GDOF_M, rosto: 0.45, lift: [0, 0.01, 0.012] },
  sun: { dir: [0.2, 1, 0.1], col: 0xdff4ea, I: 0.5, c: [0.8, 1, 1.6], r: 8 }, hemi: { sky: 0xb8d0c8, ground: 0x202428, I: 0.55 }, fill: { col: 0xcfe0ff, I: 0.35, dir: [-0.6, 0.3, 0.5] }, rim: { col: 0xcfe8ff, str: 1.1 } };

// ---------------------------------------------------------------- 0 · capa: o Gojo sem venda, preso dentro do Reino da Prisão, olhos azuis acesos
addSet("s0-capa", (g) => {
  const __n = "s0-capa";
  const PD = prisaoDentro(g);
  const go = gojoOlhosLP(); g.add(go); go.position.set(0, 0, 0); const gl = OLHO_GL(go, 0.6);
  restPose(go); kneelPose(go); amarras(g, go, [["hips", 0.16, 0, 0.02, 0.9, 0.5], ["hips", -0.16, 0, 0.02, -0.9, 0.5], ["chest", 0.18, 0.15, 0, 1.4, -0.4], ["chest", -0.18, 0.15, 0, -1.4, -0.4]]);
  return { bg: 0x0a0204, fog: [6, 30], fogCol: 0x1a0408, hand: 0, look: { exposure: 1.12, bloom: 0.7, bloomT: 0.72, vig: 0.6, sat: 1.12, con: 1.1, dof: GDOF_C, rosto: 0.6 },
    sun: { dir: [0.3, 1, 0.6], col: 0xffb0b8, I: 0.6, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x8a3a4a, ground: 0x1a0408, I: 0.5 }, fill: { col: 0xb8d8ff, I: 0.5, dir: [-0.4, 0.2, 1] }, rim: { col: 0xff8a9a, str: 1.4 },
    update(t) { floatDust(PD.poeira, t, 0.15, 0.08); PD.nevoa.upd(t, 1); restPose(go); idle(go, t, 312, 0.05); kneelPose(go); rostoLP(go, t, { boca: "linha", palpebra: 0.92, piscaCada: 99 }); gl.forEach((s) => (s.material.opacity = 0.5 + 0.1 * Math.sin(t * 3))); },
    cam() { { const d = dbgCam(__n); if (d) return d; } return closeRosto(go, 0.72, 0.1, 0.005, 30); } };
});

// ---------------------------------------------------------------- 1 · abertura: Shibuya à noite, debaixo do véu; o Gojo sozinho no meio do cruzamento
addSet("s1-abertura", (g) => {
  const __n = "s1-abertura";
  const [a, b] = T.sc["s1-abertura"];
  const SB = shibuyaCruz(g);
  const go = gojoVendaLP(); g.add(go); go.position.set(0, 0, 0); go.rotation.y = 0.25; const sp = sombraPe(g, go);
  const ris = riscosVento(g, 18, [-6, 6, 0.3, 3, -5, 4], { cor: 0xcfc0ff, op: 0.3 });
  return {
    bg: 0x06040c, fog: [20, 160], fogCol: 0x120a1c, hand: 0.006,
    look: { exposure: 1.08, bloom: 0.62, bloomT: 0.74, vig: 0.55, sat: 1.12, con: 1.08, dof: GDOF_L, rosto: 0.5 },
    sun: { dir: [-0.4, 0.9, 0.5], col: 0xb8a8ff, I: 0.55, c: [0, 1, 0], r: 12 }, hemi: { sky: 0x4a3a7a, ground: 0x14101a, I: 0.5 }, fill: { col: 0xff8ac8, I: 0.45, dir: [0.6, 0.3, 0.6] }, rim: { col: 0xb8c8ff, str: 1.3 },
    update(t) {
      chicote(t, a, 0.22, 1); SB.brilho(t, 1); ris(t, 0.8);
      vive(go, t, 311, { boca: "linha", palpebra: 0.9 }, 0.15); maosBolso(go); pose(go, { neck: [-0.06, 0, 0] }, 1); cabeloVento(go, t, 0.7, [1, 0, 0.2]); sp(0);
      flash(t, K.lembranca, 0.05, 0.6, [1, 0.85, 0.6]); GU.uFlash.value *= 0.18;
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([3, 26, 44], [5, 4.5, 12], [0, 9, 0], [0, 1.4, 0], 50, 44)],
        [K.vencido - 0.3, mov([1.5, 1.65, 4.0], [0.85, 1.72, 2.5], [0, 1.55, 0], [0, 1.72, 0], 36, 32)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 2 · Shibuya, plataforma do metrô: os restos das maldições viram fumaça; o Kenjaku sai do trem com o rosto do Geto
const GO_PLAT = [0.8, 1.6], KJ_FIM = 3.0;
addSet("s2-shibuya", (g) => {
  const __n = "s2-shibuya";
  const [a, b] = T.sc["s2-shibuya"];
  const PL = plataforma(g);
  const go = gojoVendaLP(); g.add(go); go.position.set(GO_PLAT[0], 0, GO_PLAT[1]); go.rotation.y = Math.PI / 2;
  const kj = kenjakuLP(); g.add(kj);
  const spG = sombraPe(g, go), spK = sombraPe(g, kj);
  return {
    ...LUZ_PLAT, hand: 0.006,
    update(t) {
      chicote(t, a, 0.22, -1); floatDust(PL.poeira, t, 0.2, 0.1);
      const some = smr(t, a, K.apareceu); PL.fumo.upd(t, 1 - 0.7 * some); PL.pocas.forEach((p, i) => (p.material.opacity = 0.85 * (1 - smr(t, a + 0.4 + i * 0.25, a + 2.4 + i * 0.25))));
      vive(go, t, 311, { boca: "linha", palpebra: 0.9 }, 0.12); maosBolso(go, 1 - smr(t, K.geto, K.geto + 0.5));
      pose(go, { neck: [0.04 + 0.06 * smr(t, K.geto, K.melhor), 0, 0], spine: [-0.03 * smr(t, K.geto, K.melhor), 0, 0] }, 1); spG(0);
      // o Kenjaku: de dentro do vagão até a plataforma, e para olhando o Gojo
      const D = 2.4, f = smr(t, K.apareceu - 0.15, K.apareceu + 1.5);
      if (f < 1) { gait(kj, D * f, { from: [5.4, 0, GO_PLAT[1]], ang: -Math.PI / 2, step: gaitFit(D, 0.6, 0) }); rostoLP(kj, t, { boca: "sorriso", palpebra: 0.75 }); }
      else { kj.position.set(5.4 - D, 0, GO_PLAT[1]); kj.rotation.y = -Math.PI / 2; vive(kj, t, 331, { boca: "sorriso", palpebra: 0.72 }, 0.15); }
      ventoAbas(kj, t, 0.35); spK(0);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([-3.4, 2.3, -11], [-3.1, 2.0, -8.5], [0.8, 1.0, 1.6], [0.8, 1.2, 1.6], 46, 42)],
        [K.centenas - 0.2, mov([-1.6, 1.45, 4.6], [-1.2, 1.5, 4.0], [0.8, 1.35, 1.6], [0.8, 1.45, 1.6], 38, 36)],
        [K.apareceu - 0.25, mov([-0.7, 1.7, 0.75], [-0.55, 1.72, 0.85], [4.2, 1.45, 1.75], [3.4, 1.55, 1.7], 36, 34)],
        [K.rosto - 0.15, (tt, u) => ({ ...closeRosto(kj, lerp(1.05, 0.9, E.inOut(u)), -0.14, -0.01, 30) })],
        [K.melhor - 0.15, (tt, u) => ({ ...closeRosto(go, lerp(1.15, 0.92, E.inOut(u)), 0.16, -0.02, 30) })],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 3 · um instante: a escola num dia de verão; o Gojo e o Geto jovens rindo, sentados no banco
addSet("s3-instante", (g) => {
  const __n = "s3-instante";
  const [a, b] = T.sc["s3-instante"];
  const ES = escolaJujutsu(g, false); bancoMadeira(g, 0, -1.25);
  const gj = gojoJovemLP(); g.add(gj); gj.position.set(0.45, 0, -1.2);
  const ge = getoLP(); g.add(ge); ge.position.set(-0.45, 0, -1.2);
  return {
    bg: 0x9ac8f0, fog: [40, 330], fogCol: 0xc8e0f4, hand: 0.004,
    look: { exposure: 1.04, bloom: 0.45, bloomT: 0.84, vig: 0.38, sat: 1.14, con: 1.05, dof: GDOF_M, rosto: 0.3, lift: [0.01, 0.008, 0] },
    sun: { dir: [0.5, 0.7, 0.55], col: 0xfff0d8, I: 2.2, c: [0, 1, -2], r: 18 }, hemi: { sky: 0xbfe0ff, ground: 0x6a7a4a, I: 0.9 }, fill: { col: 0xffe0c0, I: 0.45, dir: [-0.4, 0.3, 1] }, rim: { col: 0xfff4e0, str: 1.2 },
    update(t) {
      ES.folhas(t, 0.8); ES.brilho(t, 1); ES.sol.visible = true;
      const ri = 0.5 + 0.5 * Math.sin(t * 2.2);
      sentaBanco(gj, t, 313, { apoiado: true, lean: -0.16, neck: [-0.05, 0.25 * smr(t, K.escola, K.amigo3), 0] }); rostoLP(gj, t, { boca: ri > 0.35 ? "risada" : "sorriso", palpebra: 0.95 });
      sentaBanco(ge, t, 321, { lean: 0.05, neck: [0.02, -0.3, 0] }); rostoLP(ge, t, { boca: "risada", palpebra: 0.6, piscaCada: 3.1 });
      cabeloVento(gj, t, 0.5, [1, 0, 0]); cabeloVento(ge, t, 0.5, [1, 0, 0]);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.6, 7.5, 16], [0.8, 1.9, 6.5], [0, 7, -6], [0, 1.2, -1.2], 50, 42)],
        [K.escola - 0.3, mov([0.3, 1.15, 1.55], [0.18, 1.12, 1.2], [0, 0.98, -1.2], [0, 1.0, -1.2], 40, 38)],
        [K.amigo3 - 0.25, (tt, u) => ({ ...closeRosto(ge, lerp(1.0, 0.85, E.inOut(u)), 0.35, 0.0, 30) })],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 3b · o fecho: de volta à plataforma; o cubo abre o olho, as paredes de carne sobem e fecham; depois o espírito do monge Genshin atrás do cubo
addSet("s3b-prisao", (g) => {
  const __n = "s3b-prisao";
  const [a, b] = T.sc["s3b-prisao"];
  const PL = plataforma(g);
  const go = gojoVendaLP(); g.add(go); go.position.set(GO_PLAT[0], 0, GO_PLAT[1]); go.rotation.y = Math.PI / 2; const spG = sombraPe(g, go);
  const kj = kenjakuLP(); g.add(kj); kj.position.set(KJ_FIM, 0, GO_PLAT[1]); kj.rotation.y = -Math.PI / 2; const spK = sombraPe(g, kj);
  const cubo = cuboPrisao(g, 0.26); cubo.c.position.set(GO_PLAT[0] + 0.75, 0, GO_PLAT[1] + 0.1);
  const PF = prisaoFechando(g, [GO_PLAT[0], 0, GO_PLAT[1]], 3.4);
  const GS = genshinEspirito(g, 2.4); GS.e.position.set(GO_PLAT[0] + 0.6, 0, GO_PLAT[1] - 1.9); GS.e.rotation.y = 0.35;
  const tCorte = K.bastou + 0.5, t0 = Math.max(K.prisao3 - 0.7, tCorte + 0.15), t1 = Math.max(K.fechou + 0.75, t0 + 1.3);
  return {
    ...LUZ_PLAT, hand: 0.006,
    update(t) {
      chicote(t, a, 0.22, 1); floatDust(PL.poeira, t, 0.2, 0.1); PL.fumo.upd(t, 0.25); PL.pocas.forEach((p) => (p.material.opacity = 0));
      const k = seg(t, t0, t1); PF.upd(k); go.visible = k < 0.6;
      vive(go, t, 311, { boca: "aberta", palpebra: 0.9, choque: 1 }, 0.08); spG(0); spG.m && (spG.m.visible = go.visible);
      vive(kj, t, 331, { boca: "sorriso", palpebra: 0.72 }, 0.15); ventoAbas(kj, t, 0.3); spK(0);
      // o olho do cubo abre no "bastou"; brilho vermelho enquanto a prisão fecha; depois some e o cubo fica no lugar do Gojo
      cubo.olho(t > K.bastou + 0.05 && t < t1 + 0.4); cubo.gl.material.opacity = 0.6 * smr(t, K.bastou, K.bastou + 0.3) * (1 - smr(t, t1, t1 + 0.6)); cubo.m.emissiveIntensity = 0.25 * cubo.gl.material.opacity;
      const fim = smr(t, t1 - 0.2, t1); cubo.c.position.x = lerp(GO_PLAT[0] + 0.75, GO_PLAT[0], fim); cubo.c.position.z = lerp(GO_PLAT[1] + 0.1, GO_PLAT[1], fim);
      flash(t, K.fechou, 0.05, 0.45, [1, 0.5, 0.5]); GU.uFlash.value *= 0.35;
      GS.set(smr(t, K.monge - 0.35, K.genshin + 0.2));
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([GO_PLAT[0] + 1.3, 0.28, GO_PLAT[1] + 1.2], [GO_PLAT[0] + 1.25, 0.3, GO_PLAT[1] + 1.05], [GO_PLAT[0] + 0.75, 0.16, GO_PLAT[1] + 0.1], [GO_PLAT[0] + 0.7, 0.3, GO_PLAT[1] + 0.05], 38, 36)],
        [tCorte, mov([-3.6, 2.1, 6.8], [-3.3, 2.0, 6.1], [GO_PLAT[0], 1.5, GO_PLAT[1]], [GO_PLAT[0], 1.3, GO_PLAT[1]], 44, 42)],
        [Math.max(K.caixa - 0.25, t1 + 0.1), mov([GO_PLAT[0] - 0.9, 0.3, GO_PLAT[1] + 1.4], [GO_PLAT[0] - 0.75, 0.32, GO_PLAT[1] + 1.2], [GO_PLAT[0], 0.15, GO_PLAT[1]], [GO_PLAT[0], 0.22, GO_PLAT[1]], 38, 36)],
        [K.monge - 0.3, mov([GO_PLAT[0] - 2.6, 0.55, GO_PLAT[1] + 3.6], [GO_PLAT[0] - 3.3, 0.8, GO_PLAT[1] + 4.6], [GO_PLAT[0] + 0.3, 1.0, GO_PLAT[1] - 0.6], [GO_PLAT[0] + 0.4, 1.8, GO_PLAT[1] - 1.2], 44, 50)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 4 · dentro da prisão: o Gojo de joelhos, preso por amarras de carne; a energia azul tenta acender e apaga
addSet("s4b-dentro", (g) => {
  const __n = "s4b-dentro";
  const [a, b] = T.sc["s4b-dentro"];
  const PD = prisaoDentro(g);
  const go = gojoVendaLP(); g.add(go); go.position.set(0, 0, 0);
  restPose(go); kneelPose(go); amarras(g, go, [["hips", 0.16, 0, 0.02, 0.9, 0.5], ["hips", -0.16, 0, 0.02, -0.9, 0.5], ["chest", 0.18, 0.15, 0, 1.4, -0.4], ["chest", -0.18, 0.15, 0, -1.4, -0.4], ["chest", 0, 0.1, -0.12, 0, -1.6]]);
  const aura = glowSprite(0x6ad8ff, 1.5, 0); aura.position.set(0, 0.95, -0.4); g.add(aura);
  const casca = mesh(sph(0.95, 24, 16), new THREE.MeshBasicMaterial({ color: 0x6ad8ff, transparent: true, opacity: 0, blending: ADD, depthWrite: false, wireframe: true }), 0, 0.75, 0, g); casca.castShadow = false;
  const L = new THREE.PointLight(0x6ad8ff, 0, 10, 1.6); L.position.set(0, 1.2, 0.6); g.add(L);
  return {
    bg: 0x0a0204, fog: [6, 32], fogCol: 0x1a0408, hand: 0.004,
    look: { exposure: 1.1, bloom: 0.68, bloomT: 0.72, vig: 0.6, sat: 1.1, con: 1.1, dof: GDOF_M, rosto: 0.5 },
    sun: { dir: [0.3, 1, 0.6], col: 0xffb0b8, I: 0.6, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x8a3a4a, ground: 0x1a0408, I: 0.5 }, fill: { col: 0xb8d8ff, I: 0.3, dir: [-0.4, 0.2, 1] }, rim: { col: 0xff8a9a, str: 1.3 },
    update(t) {
      floatDust(PD.poeira, t, 0.15, 0.08); PD.nevoa.upd(t, 1);
      restPose(go); idle(go, t, 311, 0.04); kneelPose(go); pose(go, { neck: [0.15 * smr(t, K.energia, K.energia + 0.8), 0, 0] }, 1); rostoLP(go, t, { boca: "linha", palpebra: 0.9 });
      // a energia tenta acender (pisca) e apaga de vez no "energia amaldiçoada"
      const tenta = smr(t, K.dentro + 0.1, K.gojo4) * (1 - smr(t, K.energia - 0.1, K.energia + 0.5)), pisca = 0.55 + 0.45 * Math.sin(t * 31) * Math.sin(t * 7.3);
      const e = tenta * pisca; aura.material.opacity = 0.32 * e; casca.material.opacity = 0.14 * e; casca.rotation.y = t * 0.6; L.intensity = 4 * e;
      PD.olhos.forEach((o, i) => { o.pu.position.x = 0.12 * Math.sin(t * 0.7 + i); o.ir.position.x = o.pu.position.x * 0.8; });
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.6, 3.4, 8.8], [0.3, 2.2, 6.4], [0, 1.6, 0], [0, 1.0, 0], 46, 42)],
        [K.gojo4 - 0.2, (tt, u) => ({ ...closeRosto(go, lerp(1.25, 0.95, E.inOut(u)), 0.2, -0.05, 32) })],
      ], b);
    },
  };
});
