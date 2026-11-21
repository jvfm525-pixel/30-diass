// ================================================================ vídeo: Gojo · cenas 5–9 (as chaves, o Anjo, Discord, apego, fim)
function materiaisProprios(o) { const ms = []; o.traverse((x) => { if (x.isMesh) { x.material = x.material.clone(); x.material.transparent = true; ms.push(x.material); } }); return ms; }
// corrente partida no chão: elos de toro alternados, deitados
function correnteChao(g, pts, s = 0.06) { const m = LPmat(0x6a6a72, { metal: 0.85, rough: 0.35, rim: 0.6, liso: true }), c = grp(g);
  for (let i = 0; i < pts.length - 1; i++) { const a = V3(...pts[i]), b_ = V3(...pts[i + 1]), n = Math.max(1, Math.round(a.distanceTo(b_) / (s * 1.5)));
    for (let j = 0; j < n; j++) { const p = a.clone().lerp(b_, j / n), el = mesh(new THREE.TorusGeometry(s, s * 0.28, 6, 12), m, p.x, s * 0.3 + 0.01, p.z, c); el.rotation.set(j % 2 ? 0 : Math.PI / 2, Math.atan2(b_.x - a.x, b_.z - a.z) + Math.PI / 2, j % 2 ? Math.PI / 2 : 0); if (j % 2) el.rotation.set(Math.PI / 2, 0, -Math.atan2(b_.z - a.z, b_.x - a.x)); el.scale.z = 1.3; } }
  return c; }

// ---------------------------------------------------------------- 5 · as chaves: o depósito; o cubo da porta de trás no altar; a Lança Invertida e a Corda Negra viram pó
addSet("s5-chaves", (g) => {
  const __n = "s5-chaves";
  const [a, b] = T.sc["s5-chaves"];
  const DP = depositoG(g);
  const mL = materiaisProprios(DP.lanca), mC = materiaisProprios(DP.corda);
  const poL = poSumindo(g, [-0.75, 1.12, -2.6], 0x2a2236, 70), poC = poSumindo(g, [0.75, 1.0, -2.6], 0x1a1620, 70);
  const fan = fantasma(gojoJovemLP(), 0x9ad8ff, 0.12); g.add(fan); fan.position.set(0, 0, -2.9);
  return {
    bg: 0x0a0604, fog: [6, 26], fogCol: 0x120a06, hand: 0.005,
    look: { exposure: 1.1, bloom: 0.55, bloomT: 0.78, vig: 0.6, sat: 1.05, con: 1.1, dof: GDOF_M, rosto: 0.3, lift: [0.01, 0.005, 0] },
    sun: { dir: [-0.8, 0.6, 0.1], col: 0xffe0b0, I: 0.5, c: [0, 1, -2], r: 7 }, hemi: { sky: 0x6a5040, ground: 0x140c08, I: 0.45 }, fill: { col: 0xffb870, I: 0.3, dir: [0.5, 0.3, 1] }, rim: { col: 0xffd8a0, str: 1.2 },
    update(t) {
      chicote(t, a, 0.22, -1); floatDust(DP.poeira, t, 0.15, 0.08); DP.cubo.olho(false);
      // as duas ferramentas somem: ficam transparentes e soltam pó que sobe
      const s = smr(t, K.sumido - 0.1, K.sumido + 0.9); mL.forEach((m) => (m.opacity = 1 - s)); mC.forEach((m) => (m.opacity = 1 - s)); DP.lanca.visible = DP.corda.visible = s < 0.99;
      [poL, poC].forEach((p) => { p.visible = s > 0.02 && s < 0.999 || (t > K.sumido && t < K.sumido + 1.8); p.material.opacity = 0.9 * (1 - smr(t, K.sumido + 0.6, K.sumido + 1.8)); p.position.y = (p === poL ? 1.12 : 1.0) + 0.6 * smr(t, K.sumido - 0.1, K.sumido + 1.8); });
      // o Gojo jovem (de luz) aparece entre os suportes vazios no "próprio Gojo"
      const fv = smr(t, K.proprio - 0.35, K.proprio + 0.2); fan.visible = fv > 0.01; fan.userData.fm.opacity = 0.12 * fv; restPose(fan); idle(fan, t, 313, 0.1); standFeet(fan);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.4, 2.3, 5.6], [0.15, 1.6, 1.4], [0, 1.4, -5.4], [0, 1.15, -5.4], 44, 38)],
        [K.duas - 0.25, mov([0, 1.9, 2.0], [0, 1.8, 1.6], [0, 0.95, -2.6], [0, 1.0, -2.6], 48, 46)],
        [K.lanca - 0.25, mov([-0.35, 1.5, -1.75], [-0.42, 1.42, -1.88], [-0.75, 1.13, -2.6], [-0.78, 1.14, -2.6], 34, 32)],
        [K.corda - 0.25, mov([0.42, 1.55, -1.8], [0.48, 1.45, -1.92], [0.75, 1.02, -2.6], [0.75, 1.04, -2.6], 34, 32)],
        [K.sumido - 0.35, mov([0, 1.75, 1.2], [0, 1.7, 0.8], [0, 1.0, -2.6], [0, 1.05, -2.6], 46, 44)],
        [K.proprio - 0.3, mov([0.15, 1.5, 0.7], [0.1, 1.55, 0.3], [0, 1.35, -2.9], [0, 1.55, -2.9], 42, 38)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 6 · o Anjo: a cidade em ruínas do Jogo do Abate; ela no telhado, asas de luz; a Escada de Jacó desce sobre o cubo
const CUBO_RUA = [0, -8];
addSet("s6-anjo", (g) => {
  const __n = "s6-anjo";
  const [a, b] = T.sc["s6-anjo"];
  const RU = ruinasG(g);
  const cubo = cuboPrisao(g, 0.3); cubo.c.position.set(CUBO_RUA[0], 0, CUBO_RUA[1]); cubo.c.rotation.y = 0.4;
  const EJ = escadaJaco(g, [CUBO_RUA[0], 0, CUBO_RUA[1]]);
  const an = anjoLP(); g.add(an); an.position.set(5.0, 7.4, -16); an.rotation.y = -Math.PI / 2 + 0.35;
  const La = new THREE.SpotLight(0xfff0d8, 30, 18, 0.5, 0.6, 1.4); La.position.set(1.5, 4.5, -12); La.target = an; g.add(La); const ga = glowSprite(0xffe8b0, 3.2, 0.35); ga.position.set(5.4, 8.4, -16.2); g.add(ga);
  const ris = riscosVento(g, 14, [-6, 6, 0.3, 3, -14, 2], { cor: 0xffd8b0, op: 0.25 });
  return {
    bg: 0x05050c, fog: [20, 140], fogCol: 0x1a1220, hand: 0.006,
    look: { exposure: 1.08, bloom: 0.66, bloomT: 0.72, vig: 0.58, sat: 1.1, con: 1.1, dof: GDOF_L, rosto: 0.45 },
    sun: { dir: [0.3, 0.6, -0.8], col: 0xb8a8d8, I: 0.6, c: [0, 1, -8], r: 18 }, hemi: { sky: 0x3a3a6a, ground: 0x1a1414, I: 0.5 }, fill: { col: 0xff9a6a, I: 0.35, dir: [-0.6, 0.2, -1] }, rim: { col: 0xffd8b0, str: 1.3 },
    update(t) {
      chicote(t, a, 0.22, 1); RU.fogos.forEach((f) => f.update(t)); RU.fumo.upd(t, 1); RU.brasa(t, 1); ris(t, 0.8);
      vive(an, t, 341, { boca: "linha", palpebra: 0.75 }, 0.12); pose(an, { neck: [0.25, 0, 0] }, 1); cabeloVento(an, t, 0.7, [-1, 0, 0]);
      an.userData.asas.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * 0.06 * Math.sin(t * 1.6); }); an.userData.aur.material.opacity = 0.7 + 0.3 * Math.sin(t * 2);
      const k = smr(t, K.apaga - 0.35, K.apaga + 0.4); EJ.set(k, t); cubo.olho(k > 0.5); cubo.gl.material.color.set(0xffe0a0); cubo.gl.material.opacity = 0.8 * k; cubo.m.emissiveIntensity = 0.5 * k;
      flash(t, K.apaga, 0.08, 0.6, [1, 0.95, 0.8]); GU.uFlash.value *= 0.3;
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.4, 1.1, -2.6], [1.0, 0.9, -4.0], [0, 0.35, -8], [0, 0.4, -8], 40, 38)],
        [K.anjo - 0.25, mov([1.6, 1.4, -9.5], [1.9, 1.6, -10.2], [5.0, 8.6, -16], [5.0, 8.7, -16], 38, 34)],
        [K.apaga - 0.4, mov([-9, 2.4, 6.5], [-8.2, 3.6, 5], [0, 2.6, -8], [0, 5, -8], 46, 50)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 7 · Discord ("quer aprender a fazer esses vídeos?"): bastidor 3D — grade de editor, o Gojo num pedestal girando, de arame virando modelo
addSet("s7-discord", (g) => {
  const [a, b] = T.sc["s7-discord"];
  vazio(g, 0x0c0820, 0x3a2a7a, 0x06040c);
  const grade = new THREE.GridHelper(24, 48, 0x9a8aff, 0x3a2a7a); grade.material.transparent = true; grade.material.opacity = 0.55; g.add(grade);
  const ch = mesh(new THREE.PlaneGeometry(40, 40), SM(0x0a0816, { roughness: 0.5, metalness: 0.2 }), 0, -0.005, 0, g); ch.rotation.x = -Math.PI / 2;
  const gira = grp(g); mesh(cyl(0.62, 0.66, 0.15, 40), SM(0x16122a, { roughness: 0.4, metalness: 0.4 }), 0, 0.075, 0, gira);
  const aro = mesh(new THREE.TorusGeometry(0.64, 0.012, 6, 64), new THREE.MeshBasicMaterial({ color: 0xb8a8ff }), 0, 0.15, 0, gira); aro.rotation.x = Math.PI / 2; aro.castShadow = false;
  const go = gojoVendaLP(); gira.add(go); go.position.y = 0.15;
  const fio = gojoVendaLP(); gira.add(fio); fio.position.y = 0.15; const wm = new THREE.MeshBasicMaterial({ color: 0xb8a8ff, wireframe: true, transparent: true, opacity: 0.85 });
  fio.traverse((x) => { if (x.isMesh) { if (x.userData.isDecal) x.visible = false; else x.material = wm; x.castShadow = false; } });
  const scan = mesh(new THREE.TorusGeometry(0.5, 0.01, 6, 64), new THREE.MeshBasicMaterial({ color: 0xe8e0ff, transparent: true, opacity: 0, blending: ADD, depthWrite: false }), 0, 0.15, 0, gira); scan.rotation.x = Math.PI / 2; scan.castShadow = false;
  const p = dustPts(160, [-3, 3, 0.1, 3.5, -3, 1], 0xb8a8ff, 0.03, 0.7); g.add(p);
  const tTroca = K.link - 0.25;
  return { bg: 0x0c0820, fog: [6, 30], fogCol: 0x140c30, hand: 0, look: { exposure: 1.1, bloom: 0.7, bloomT: 0.74, vig: 0.5, sat: 1.08, con: 1.06, rosto: 0.5 },
    sun: { dir: [0.4, 0.8, 0.8], col: 0xf0e8ff, I: 1.6, c: [0, 1, 0], r: 4 }, hemi: { sky: 0x6a5ab8, ground: 0x0a0814, I: 0.7 }, fill: { col: 0xb8a8ff, I: 0.5, dir: [-0.6, 0.3, -0.5] }, rim: { col: 0xb0a0ff, str: 1.3 },
    update(t) {
      floatDust(p, t, 0.3, 0.15); gira.rotation.y = 0.6 + (t - a) * 0.9;
      [go, fio].forEach((q) => { vive(q, t, 311, { boca: "linha", palpebra: 0.9 }, 0.08); maosBolso(q); });
      const k = seg(t, tTroca - 0.35, tTroca + 0.35); go.visible = t > tTroca; fio.visible = t <= tTroca + 0.05;
      scan.position.y = 0.15 + 2.1 * k; scan.material.opacity = k > 0 && k < 1 ? 0.9 : 0; scan.scale.setScalar(1 - 0.4 * Math.sin(k * Math.PI));
    },
    cam(t) { return { ...path2(t, [[a, [0.2, 1.35, 3.6], [0, 1.05, 0], 40], [b, [0.1, 1.3, 2.7], [0, 1.05, 0], 38]]), near: 0.03 }; } };
});

// ---------------------------------------------------------------- 8 · apego: a escola à noite; o Gojo sozinho no banco, correntes partidas no chão; um fio vermelho até o Geto (de luz) no torii
addSet("s8-apego", (g) => {
  const __n = "s8-apego";
  const [a, b] = T.sc["s8-apego"];
  const ES = escolaJujutsu(g, true); bancoMadeira(g, 0, -1.25);
  const go = gojoVendaLP(); g.add(go); go.position.set(0.45, 0, -1.2);
  const ge = fantasma(getoLP(), 0xbfe0ff, 0.0); g.add(ge); ge.position.set(0, 0, 20.6); ge.rotation.y = Math.PI;
  correnteChao(g, [[0.2, 0, -0.55], [0.6, 0, -0.2], [1.1, 0, -0.3], [1.5, 0, 0.1]]); correnteChao(g, [[-0.2, 0, -0.4], [-0.6, 0, 0.0], [-0.9, 0, 0.5]]); correnteChao(g, [[0.9, 0, -0.75], [1.3, 0, -0.95]]);
  const fio = fioVermelho(g);
  return {
    bg: 0x02040c, fog: [30, 260], fogCol: 0x0a1222, hand: 0.004,
    look: { exposure: 1.12, bloom: 0.6, bloomT: 0.74, vig: 0.6, sat: 1.05, con: 1.08, dof: GDOF_M, rosto: 0.45, lift: [0, 0.008, 0.02] },
    sun: { dir: [-0.3, 0.8, -0.6], col: 0xb8c8ff, I: 0.7, c: [0, 1, 4], r: 24 }, hemi: { sky: 0x2a3a6a, ground: 0x0a0c10, I: 0.5 }, fill: { col: 0xffb870, I: 0.35, dir: [0.4, 0.2, 1] }, rim: { col: 0xbfd8ff, str: 1.3 },
    update(t) {
      chicote(t, a, 0.22, -1); ES.folhas(t, 0.5); floatDust(ES.vag, t, 0.4, 0.25);
      sentaBanco(go, t, 311, { lean: 0.12, neck: [0.18 - 0.2 * smr(t, K.apego, K.vencer), 0, 0] }); rostoLP(go, t, { boca: "linha", triste: 0.5, palpebra: 0.9 }); cabeloVento(go, t, 0.4, [0, 0, 1]);
      // o Geto aparece no torii, o fio liga os dois e depois ele vira vaga-lume
      const ap = smr(t, K.apego - 0.3, K.apego + 0.3), some = smr(t, K.sentia, K.sentia + 1.0); ge.visible = ap * (1 - some) > 0.01; ge.userData.fm.opacity = 0.24 * ap * (1 - some); restPose(ge); idle(ge, t, 321, 0.1); standFeet(ge);
      go.updateMatrixWorld(true); const pulso = go.userData.wr[0].getWorldPosition(V3()); ge.updateMatrixWorld(true); const mao = ge.userData.wr[1].getWorldPosition(V3());
      const kf = smr(t, K.apego - 0.15, K.apego + 0.9); fio.tb.visible = kf > 0.01 && some < 0.99; fio.m.opacity = 0.9 * (1 - some); if (fio.tb.visible) fio.set(pulso, mao, 0.6, kf);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.9, 4.4, 13], [0.6, 2.2, 9], [0, 1.2, -1.2], [0, 1.0, -1.2], 46, 40)],
        [K.correntes - 0.3, mov([1.3, 0.75, 1.1], [1.15, 0.7, 0.9], [0.6, 0.05, -0.4], [0.7, 0.08, -0.5], 38, 36)],
        [K.apego - 0.25, mov([-0.6, 1.45, -3.0], [-0.5, 1.4, -2.6], [0.4, 1.1, 8], [0.2, 1.2, 20], 40, 36)],
        [K.vencer - 0.25, (tt, u) => ({ ...closeRosto(go, lerp(0.95, 0.78, E.inOut(u)), -0.3, 0.0, 30) })],
        [K.sentia - 0.25, mov([0.9, 1.3, -2.9], [1.0, 1.5, -3.6], [0.3, 1.0, 6], [0.2, 1.6, 20], 40, 44)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 9 · fim: o cubo racha de luz na rua em ruínas; o Gojo se levanta, tira a venda (olhos azuis); a câmera sobe sobre a cidade
addSet("s9-fim", (g) => {
  const __n = "s9-fim";
  const [a, b] = T.sc["s9-fim"];
  const RU = ruinasG(g);
  const cubo = cuboPrisao(g, 0.3); cubo.c.position.set(CUBO_RUA[0], 0, CUBO_RUA[1]); cubo.c.rotation.y = 0.4;
  const EJ = escadaJaco(g, [CUBO_RUA[0], 0, CUBO_RUA[1]]); const onda = choque(g, [CUBO_RUA[0], 0, CUBO_RUA[1]], 0xbfe8ff);
  const go = gojoVendaLP(); g.add(go); go.position.set(CUBO_RUA[0], 0, CUBO_RUA[1]); go.rotation.y = 0.15; const sp = sombraPe(g, go);
  const gv = gojoOlhosLP(); g.add(gv); gv.position.set(CUBO_RUA[0], 0, CUBO_RUA[1]); gv.rotation.y = 0.15; const gl = OLHO_GL(gv, 0.6);
  const ris = riscosVento(g, 14, [-6, 6, 0.3, 3, -14, 2], { cor: 0xcfe0ff, op: 0.16 });
  const Lk = new THREE.PointLight(0xffc090, 7, 12, 1.5); Lk.position.set(CUBO_RUA[0] + 1.6, 2.3, CUBO_RUA[1] + 3); g.add(Lk);
  const tSai = K.semanas - 0.1, tOlhos = K.rever - 0.3;
  return {
    bg: 0x05050c, fog: [24, 170], fogCol: 0x1a1426, hand: 0.006,
    look: { exposure: 1.08, bloom: 0.62, bloomT: 0.74, vig: 0.56, sat: 1.1, con: 1.1, dof: GDOF_L, rosto: 0.5 },
    sun: { dir: [0.35, 0.3, -0.9], col: 0xffb08a, I: 0.9, c: [0, 1, -8], r: 18 }, hemi: { sky: 0x3a3a6a, ground: 0x1a1414, I: 0.55 }, fill: { col: 0x9ac8ff, I: 0.4, dir: [-0.4, 0.3, 1] }, rim: { col: 0xbfe0ff, str: 1.3 },
    update(t) {
      chicote(t, a, 0.22, 1); RU.fogos.forEach((f) => f.update(t)); RU.fumo.upd(t, 1); RU.brasa(t, 1); ris(t, 0.9);
      // a luz ainda em cima do cubo; ele racha no "semanas" e some; o Gojo aparece de joelhos e se levanta
      const luz = 0.7 * (1 - smr(t, tSai + 0.3, tSai + 2.0)); EJ.set(luz, t); cubo.c.visible = t < tSai + 0.05; cubo.olho(true); cubo.gl.material.color.set(0xffe0a0); cubo.gl.material.opacity = 0.9 * luz; cubo.m.emissiveIntensity = 0.6;
      onda(t, tSai); flash(t, tSai, 0.06, 0.5, [0.85, 0.95, 1]); GU.uFlash.value *= 0.45;
      const up = smr(t, tSai + 0.3, tSai + 1.6); go.visible = t > tSai && t < tOlhos; gv.visible = t >= tOlhos;
      [go, gv].forEach((p, i) => { if (!p.visible) return; restPose(p); idle(p, t, 311 + i, 0.12); if (up < 1) kneelPose(p, 1 - up); standFeet(p); maosBolso(p, smr(t, tSai + 1.4, tSai + 2.2)); });
      pose(go, { neck: [0.1 - 0.3 * smr(t, K.real - 0.2, K.real + 0.4) + 0.25 * smr(t, K.real + 0.4, K.real + 1.2), 0.35 * Math.sin(smr(t, K.real - 0.2, K.real + 1.2) * Math.PI), 0] }, 1);
      rostoLP(go, t, { boca: t > K.real ? "smirk" : "linha", palpebra: 0.9 });
      pose(gv, { neck: [-0.35 * smr(t, K.seria - 0.3, K.seria + 0.4), 0, 0] }, 1); rostoLP(gv, t, { boca: "linha", palpebra: 0.95, piscaCada: 3.7 }); gl.forEach((s) => (s.material.opacity = 0.55 + 0.1 * Math.sin(t * 3)));
      cabeloVento(go, t, 0.8, [1, 0, 0.3]); cabeloVento(gv, t, 0.8, [1, 0, 0.3]); sp(0);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      const c = CUBO_RUA;
      return planos(t, [
        [a, mov([c[0] + 1.8, 1.0, c[1] + 4.4], [c[0] + 1.4, 1.1, c[1] + 3.6], [c[0], 0.4, c[1]], [c[0], 0.9, c[1]], 40, 38)],
        [K.real - 0.25, mov([c[0] + 0.9, 1.55, c[1] + 2.6], [c[0] + 0.7, 1.6, c[1] + 2.2], [c[0], 1.6, c[1]], [c[0], 1.7, c[1]], 36, 34)],
        [tOlhos, (tt, u) => ({ ...closeRosto(gv, lerp(1.05, 0.85, E.inOut(u)), 0.12, 0.0, 30) })],
        [K.seria - 0.3, mov([c[0] + 0.6, 0.9, c[1] + 1.6], [c[0] + 0.5, 0.8, c[1] + 1.4], [c[0], 2.4, c[1] - 1.5], [c[0], 3.2, c[1] - 2.5], 42, 40)],
        [K.comenta - 0.2, mov([c[0] + 1.5, 2.2, c[1] + 4.5], [c[0] + 6, 26, c[1] + 34], [c[0], 1.6, c[1]], [c[0], 4, c[1] - 40], 42, 50)],
      ], b);
    },
  };
});
