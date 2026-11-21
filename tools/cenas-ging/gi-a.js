// ================================================================ vídeo: Ging · cenas 0–4 (capa, porto, lenda, ilha, pistas)
const LUZ_POR = { bg: 0x2a2030, fog: [14, 70], fogCol: 0xb0705a, hand: 0, look: { exposure: 1.02, bloom: 0.32, bloomT: 0.9, vig: 0.45, sat: 1.1, con: 1.06 },
  sun: { dir: [0.6, 0.4, -0.7], col: 0xffb070, I: 2.2, c: [0, 1, -2], r: 9 }, hemi: { sky: 0xd8a0a0, ground: 0x3a2a30, I: 0.85 }, fill: { col: 0xffc8a0, I: 0.7, dir: [0.3, 0.4, 1] }, rim: { col: 0xffb070, str: 1.2 } };

// ---------------------------------------------------------------- 0 · capa: o Ging no porto, olhar sério, sol atrás
addSet("s0-capa", (g) => {
  const __n = "s0-capa";
  porto(g);
  const gi = gingLP(); g.add(gi); gi.position.set(0, 0, -1.5); gi.rotation.y = 0.15;
  return { ...LUZ_POR, update(t) { vive(gi, t, 81, { boca: "linha", bravo: 0.35, palpebra: 0.92, piscaCada: 99 }, 0.1); },
    cam() { { const d = dbgCam(__n); if (d) return d; } return closeRosto(gi, 0.7, 0.1, 0, 30); } };
});

// ---------------------------------------------------------------- 1 · abertura: o Ging vai embora pelo cais; a Mito fica com o bebê
addSet("s1-abertura", (g) => {
  const __n = "s1-abertura";
  const [a, b] = T.sc["s1-abertura"];
  const P = porto(g);
  const gi = gingLP(); g.add(gi);
  const mi = mitoLP(); g.add(mi); mi.position.set(0.3, 0, 0.9); mi.rotation.y = Math.PI - 0.1;
  const bb = bebe(g);
  const D = 3.2, L = gaitFit(D, 0.55), tPara = K.maiores - 0.1;
  return { ...LUZ_POR,
    update(t) {
      flash(t, a, 0.001, 0.45); P.M.upd(t); P.aves(t);
      // o Ging anda pelo cais (de costas), para no "maiores" e olha pra trás
      const d = D * clamp((t - a) / (tPara - a)); gait(gi, d, { from: [-0.2, 0, -0.4], ang: Math.PI, step: L });
      const olha = E.inOut(smr(t, K.maiores, K.maiores + 0.7));
      if (t > tPara) { restPose(gi); idle(gi, t, 81, 0.25); standFeet(gi); }
      gi.rotation.y += 1.9 * olha; pose(gi, { neck: [0, 0.35 * olha, 0], head: [0.05 * olha, 0.3 * olha, 0] }, 1);
      rostoLP(gi, t, { boca: "linha", triste: 0.35 * olha, palpebra: 0.85 });
      vive(mi, t, 83, { boca: t > K.amor - 0.4 ? "sorriso" : "linha", triste: 0.4, palpebra: 0.9 }, 0.2); colo(mi, bb);
      bb.rotation.z = 0.2 + Math.sin(t * 1.4) * 0.05;
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.6, 1.5, 3.2], [1.2, 1.4, 2.6], [-0.2, 1.1, -1.4], [-0.2, 1.1, -2.4], 40, 38)],
        [K.gon1 - 0.15, (tt, u) => { const c = bb.position, e = olhosW(mi); return { pos: [c.x + 0.45, c.y + 0.25, c.z - lerp(1.3, 1.1, E.inOut(u))], look: [lerp(c.x, e.x, 0.5), lerp(c.y, e.y, 0.5), c.z], fov: 34, near: 0.02 }; }],
        [K.maiores - 0.15, mov([0.7, 1.35, -1.4], [0.55, 1.4, -1.8], [-0.2, 1.45, -3.6], [-0.2, 1.5, -3.6], 32, 30)],
        [K.amor - 0.6, (tt, u) => ({ ...closeRosto(gi, lerp(1.0, 0.8, E.inOut(u)), 0.05, 0, 30) })],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 2 · lenda: a ruína na selva que o Ging restaurou; licença, duas estrelas, o Netero e as cinco auras
addSet("s2-lenda", (g) => {
  const __n = "s2-lenda";
  const [a, b] = T.sc["s2-lenda"];
  skyDome(g, { top: 0x3a7ab8, hor: 0xc8e0d0, ground: 0x2a4a2a, sunDir: [0.4, 0.5, -1], sunI: 0.8, cov: 0.55 });
  const chao = mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x4a6a32, roughness: 0.95 }), 0, 0, 0, g); chao.rotation.x = -Math.PI / 2;
  const R = ruina(g); const blocos = R.children.slice(); blocos.forEach((m) => (m.userData.y0 = m.position.y));
  forestInst(g, 70, 36, () => 0, { leaf: 0x3a6a2a });
  const gi = gingLP(); g.add(gi); gi.position.set(0, 0, 0.6); gi.rotation.y = 0.1;
  const lic = licenca(g);
  const st = [estrela(g, 0xffd860, 0.16), estrela(g, 0xffd860, 0.16)]; st.forEach((s) => (s.userData.gl.material.opacity = 0.25));
  const ne = neteroLP(); g.add(ne); ne.position.set(-14, 0, 0); // fica num canto da selva; a câmera corta pra ele
  const ne_ = grp(g, -14, 0, 0); const neG = glowSprite(0xfff0c0, 4, 0); neG.position.set(-14, 1.2, -0.6); g.add(neG);
  // cinco auras (pilares de luz) em volta: a do Ging, no centro, é a mais forte
  const AUR = [[-2.2, -1.4, 0x7ad0ff], [-1.1, -2.2, 0xff7a7a], [1.1, -2.2, 0xffd060], [2.2, -1.4, 0xb07aff], [0, 0.6, 0x9affb0]];
  const aur = AUR.map(([x, z, c], i) => { const s = glowSprite(c, i === 4 ? 2.0 : 1.8, 0); s.position.set(x, 1.0, z); g.add(s); const col = mesh(cyl(0.35, 0.5, 4, 12, 1), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), x, 2, z, g); col.castShadow = false; return { s, col }; });
  const sil = AUR.slice(0, 4).map(([x, z], i) => { const p = [kiteLP, mitoLP, neteroLP, kiteLP][i]({ roupa: 0x0a0a10, calca: 0x0a0a10, pele: 0x0a0a10, cabelo: null }); g.add(p); p.position.set(x, 0, z); p.rotation.y = -Math.atan2(x, z - 2) ; p.visible = false; return p; });
  const luzG = new THREE.PointLight(0x9affb0, 0, 4, 1.4); luzG.position.set(0, 1.2, 1.2); g.add(luzG);
  return {
    bg: 0x3a6a8a, fog: [12, 50], fogCol: 0x8ab0a0, hand: 0,
    look: { exposure: 1.15, bloom: 0.55, bloomT: 0.78, vig: 0.4, sat: 1.08, con: 1.04 },
    sun: { dir: [0.4, 0.7, 0.6], col: 0xfff0d0, I: 2.0, c: [0, 1, -2], r: 10 }, hemi: { sky: 0xb8d8e8, ground: 0x2a3a20, I: 0.85 }, fill: { col: 0xffe8c8, I: 0.5, dir: [-0.4, 0.3, 1] }, rim: { col: 0xd8ffe0, str: 0.9 },
    update(t) {
      chicote(t, a, 0.22, 1);
      vive(gi, t, 81, { boca: t > K.estrelas ? "smirk" : "linha", bravo: 0.25, palpebra: 0.92 }, 0.3);
      // licença Hunter sobe na mão do Ging no "exame"
      const lv = E.outBack(smr(t, K.exame - 0.3, K.exame + 0.3)), lsai = smr(t, K.restaurou - 0.2, K.restaurou + 0.3);
      maoEm(gi, 0, frenteW(gi, 0.12, 1.25, 0.36), lv * (1 - lsai), { abre: 0.5, poleY: 0.0, poleZ: -0.4 }); pose(gi, { handR: 0.4 * lv }, 1);
      lic.position.copy(frenteW(gi, 0.1, 1.36 + 0.4 * lsai, 0.42)); lic.rotation.set(-0.1, gi.rotation.y + Math.sin(t * 1.5) * 0.15 + lsai * 6, 0); lic.scale.setScalar(Math.max(0.001, lv * (1 - lsai)));
      // a ruína se reconstrói: os blocos sobem do chão
      blocos.forEach((m, i) => { const k = Math.max(0.12 + 0.06 * hash(i), E.outBack(smr(t, K.restaurou - 0.3 + i * 0.07, K.restaurou + 0.5 + i * 0.07))); m.scale.y = k; m.position.y = m.userData.y0 * k; });
      // duas estrelas
      st.forEach((s, i) => { const k = E.outBack(smr(t, K.estrelas - 0.1 + i * 0.25, K.estrelas + 0.4 + i * 0.25)); s.position.copy(frenteW(gi, (i ? -0.22 : 0.22), 2.15 + Math.sin(t * 2 + i) * 0.03, 0.1)); s.rotation.y = t * 1.5; s.scale.setScalar(Math.max(0.001, k)); s.visible = k > 0.01; });
      // Netero
      vive(ne, t, 85, { boca: "smirk", palpebra: 0.55 }, 0.2); pose(ne, { spine: [0.1, 0, 0] }, 1); neG.material.opacity = 0.25 * smr(t, K.netero - 0.2, K.netero + 0.3);
      // as cinco auras acendem uma por vez; a do Ging cresce no "Nen"
      aur.forEach((A, i) => { const k = smr(t, K.cinco - 0.4 + i * 0.18, K.cinco + i * 0.18), big = i === 4 ? 1 + 0.8 * smr(t, K.nen - 0.2, K.nen + 0.4) : 1; A.s.material.opacity = 0.3 * k * (i === 4 ? 1 + 0.4 * smr(t, K.nen - 0.2, K.nen + 0.4) : 1) * (i === 4 && t > K.nen - 0.25 ? 0.25 : 1); A.col.material.opacity = 0.16 * k * big * (0.85 + 0.15 * Math.sin(t * 9 + i)) * (i === 4 && t > K.nen - 0.25 ? 0.15 : 1); A.col.scale.set(big, 1, big); });
      sil.forEach((p, i) => { p.visible = t > K.cinco - 0.6; if (p.visible) { restPose(p); idle(p, t, 90 + i, 0.2); standFeet(p); } });
      luzG.intensity = 0.6 * smr(t, K.nen - 0.2, K.nen + 0.4);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.8, 3.2, 9.5], [0.4, 2.2, 6.0], [0, 2.2, -4], [0, 1.6, -2], 46, 42)],
        [K.exame - 0.3, (tt, u) => { const c = frenteW(gi, 0.1, 1.38, 0.42); return { pos: [c.x + 0.35, c.y + 0.05, c.z + lerp(1.2, 0.95, E.inOut(u))], look: [c.x - 0.05, c.y - 0.03, c.z - 0.1], fov: 34, near: 0.02 }; }],
        [K.restaurou - 0.15, mov([3.2, 1.0, 5.2], [2.4, 1.6, 4.6], [0, 1.6, -4], [0, 2.4, -5], 46, 44)],
        [K.estrelas - 0.3, mov([0.5, 1.4, 3.4], [0.3, 1.5, 3.0], [0, 1.85, 0.6], [0, 1.9, 0.6], 40, 38)],
        [K.netero - 0.15, (tt, u) => ({ ...closeRosto(ne, lerp(1.0, 0.8, E.inOut(u)), 0.12, 0, 30) })],
        [K.cinco - 0.3, mov([0.6, 5.5, 8.0], [0.3, 4.5, 6.8], [0, 0.8, -0.8], [0, 1.0, -0.6], 46, 44)],
        [K.nen - 0.2, (tt, u) => ({ ...closeRosto(gi, lerp(1.1, 0.85, E.inOut(u)), -0.12, 0, 30) })],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 3 · a ilha: o Ging entrega o bebê à Mito e vai embora de barco; cartas formam uma ilha inteira
addSet("s3-ilha", (g) => {
  const __n = "s3-ilha";
  const [a, b] = T.sc["s3-ilha"];
  const P = porto(g, { top: 0x2a2a5a, mid: 0xb85a5a, hor: 0xffa060 });
  const gi = gingLP(); g.add(gi);
  const mi = mitoLP(); g.add(mi); mi.position.set(0.3, 0, 0.8); mi.rotation.y = Math.PI;
  const bb = bebe(g);
  const ilha = ilhaFlutuante(g, 1.6); ilha.position.set(-3, 3.5, -16);
  const cartas = []; for (let i = 0; i < 70; i++) cartas.push(carta(g));
  const tEnt = K.mito - 0.2, tVai = K.sumiu - 0.9;
  const D = 4.6, L = gaitFit(D, 0.6);
  return { ...LUZ_POR,
    update(t) {
      chicote(t, a, 0.22, -1); P.M.upd(t); P.aves(t);
      // o Ging de frente pra Mito com o bebê; entrega no "Mito" e vai embora andando até o barco
      const vai = clamp((t - tVai) / (K.cigarro - 0.6 - tVai));
      if (t < tVai) { gi.position.set(0.15, 0, -0.1); gi.rotation.y = lerp(0.05, Math.PI, E.inOut(smr(t, tVai - 0.5, tVai))); restPose(gi); idle(gi, t, 81, 0.25); standFeet(gi); }
      else gait(gi, D * vai, { from: [0.15, 0, -0.1], ang: Math.PI, step: L });
      gi.visible = vai < 0.98;
      const ent = E.inOut(smr(t, tEnt - 0.5, tEnt + 0.5));
      rostoLP(gi, t, { boca: "linha", triste: 0.3, palpebra: 0.88 });
      vive(mi, t, 83, { boca: t > K.cigarro - 0.2 ? "linha" : "triste", bravo: t > K.cigarro - 0.2 ? 0.5 : 0, triste: t < K.cigarro ? 0.5 : 0, palpebra: 0.9 }, 0.2);
      if (ent < 1) { const pg = frenteW(gi, 0, 1.08, 0.22).lerp(frenteW(mi, 0, 1.08, 0.22), ent); colo(gi, bb, 1 - ent); bb.position.copy(pg); }
      if (ent > 0) { const keep = bb.position.clone(); colo(mi, bb, ent); if (ent < 1) bb.position.copy(keep); }
      // o barco zarpa
      const sai = E.in(smr(t, K.sumiu - 0.3, K.cigarro + 0.5)); P.bc.position.set(1.7 + 1.5 * sai, -0.25, -4.5 - 14 * sai); P.bc.rotation.y = 0.15 * sai;
      // cartas sobem do mar e montam a ilha flutuante
      const mo = smr(t, K.construir - 0.4, K.construir + 1.4);
      ilha.scale.setScalar(Math.max(0.001, E.outBack(smr(t, K.construir + 0.4, K.construir + 1.5)))); ilha.visible = mo > 0.3; ilha.rotation.y = t * 0.1;
      cartas.forEach((c, i) => { const k = E.inOut(clamp((mo - hash(i) * 0.35) / 0.65)), a0 = i * 2.4, r = 6 + hash(i * 3) * 6; c.position.set(lerp(-3 + Math.cos(a0) * r, -3 + Math.cos(a0) * 1.4, k), lerp(-0.5, 3.4 + hash(i * 5) * 1.5, Math.sin(k * Math.PI * 0.5)), lerp(-16 + Math.sin(a0) * r * 0.5, -16 + Math.sin(a0) * 1.2, k)); c.rotation.set(t * 2 + i, t * 1.5 + i, 0); c.scale.setScalar(2.2); c.visible = mo > 0.01 && k < 0.98; });
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([2.6, 1.45, 0.45], [2.3, 1.4, 0.4], [0.2, 1.2, 0.35], [0.2, 1.2, 0.35], 40, 38)],
        [K.mito - 0.2, (tt, u) => ({ ...closeRosto(mi, lerp(1.0, 0.82, E.inOut(u)), -0.15, -0.03, 32) })],
        [K.sumiu - 1.0, mov([2.2, 1.5, 2.6], [2.0, 1.6, 2.8], [0.6, 1.0, -4], [1.4, 0.9, -9], 38, 38)],
        [K.cigarro - 0.2, (tt, u) => ({ ...closeRosto(mi, lerp(0.95, 0.8, E.inOut(u)), 0.15, 0, 32) })],
        [K.construir - 0.3, mov([1.0, 1.4, 2.6], [0.6, 2.4, 2.4], [-1.5, 2.0, -12], [-2.6, 3.4, -16], 44, 46)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 4 · pistas: o Kite na floresta; a caixa, a fita, o anel, o cartão; o Greed Island; a voz que se apaga
addSet("s4-pistas", (g) => {
  const __n = "s4-pistas";
  const [a, b] = T.sc["s4-pistas"];
  // floresta (origem) ------------------------------------------------
  const F = grp(g);
  skyDome(g, { top: 0x5a8ac8, hor: 0xd8e8d0, ground: 0x2a3a20, sunDir: [0.3, 0.5, -1], cov: 0.5 });
  const chao = mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x4a6a30, roughness: 0.95 }), 0, 0, 0, F); chao.rotation.x = -Math.PI / 2;
  forestInst(F, 60, 24, () => 0, { leaf: 0x3e6a2a }); tree(F, -2.2, 0, -1.5, { s: 0.5, seed: 7 }); tree(F, 2.4, 0, -2.2, { s: 0.55, seed: 9 });
  const raios_ = godRays(F, [0, 6, -3], [0.2, -1, 0.6], { color: 0xfff0c0, n: 5, len: 8, w: 0.8, opacity: 0.1, spread: 4 });
  const gc = gonLP(); F.add(gc); gc.position.set(-0.28, 0, 0.2); gc.rotation.y = 1.0;
  const ki = kiteLP(); F.add(ki); ki.position.set(0.32, 0, -0.05); ki.rotation.y = -1.25;
  // casa da Mito (x=30) -------------------------------------------------
  const C = grp(g, 30, 0, 0);
  const tb = texPlanks([120, 82, 50], [96, 64, 38]), piso = new THREE.MeshStandardMaterial({ map: rep(tb.map.clone(), 3, 3), roughness: 0.7 }); piso.map.needsUpdate = true;
  mesh(new THREE.PlaneGeometry(8, 8), piso, 0, 0, 0, C).rotation.x = -Math.PI / 2; const parede = LPmat(0xe0d4bc, { rim: 0.2, rough: 0.95 }); mesh(box(8, 3.2, 0.2), parede, 0, 1.6, -1.6, C); mesh(box(0.2, 3.2, 8), parede, -2.4, 1.6, 0, C);
  const mesa = LPmat(0x7a5232, { rim: 0.4 }); mesh(box(1.4, 0.06, 0.8), mesa, 0, 0.76, -0.6, C); [[-0.65, -0.95], [0.65, -0.95], [-0.65, -0.25], [0.65, -0.25]].forEach(([x, z]) => mesh(box(0.06, 0.76, 0.06), mesa, x, 0.38, z, C));
  const jan = mesh(new THREE.PlaneGeometry(1.0, 0.8), new THREE.MeshBasicMaterial({ color: 0xbfe0ff }), 1.2, 1.8, -1.49, C); jan.castShadow = false;
  const cx = caixaGing(C); cx.c.position.set(0, 0.79, -0.6);
  const gk = gonLP(); C.add(gk); gk.position.set(0, 0, -0.05); gk.rotation.y = Math.PI;
  const fita = fitaK7(C), an = anel(C), mem = cartaoMem(C);
  const auraG = glowSprite(0x7aff9a, 1.6, 0); C.add(auraG); auraG.position.set(0, 0.95, -0.4);
  // céu do Greed Island (x=60) ------------------------------------------
  const I = grp(g, 60, 0, 0); const ilha = ilhaFlutuante(I, 1.4); ilha.position.set(0, 2.2, -6);
  const cartasI = []; for (let i = 0; i < 40; i++) cartasI.push(carta(I));
  const ceuI = mesh(new THREE.SphereGeometry(40, 16, 10), new THREE.MeshBasicMaterial({ color: 0x8ab8e8, side: THREE.BackSide, fog: false }), 0, 0, 0, I); ceuI.castShadow = false;
  const nI = nuvensMar(I, -2, 18, 0xffffff);
  const gI = gingLP(); I.add(gI); gI.position.set(0.3, 2.3, -5.4); gI.rotation.y = 0.3;
  // gravador (x=90) -------------------------------------------------------
  const R = grp(g, 90, 0, 0); const fundoR = mesh(new THREE.PlaneGeometry(20, 12), LPmat(0x0c1018), 0, 3, -3, R);
  mesh(box(1.6, 0.06, 0.9), mesa, 0, 0.76, -0.6, R); const gv = gravador(R); gv.r.position.set(0, 0.79, -0.6);
  const ond = ondaVoz(R, 46, 1.4); const OG = grp(R, 0, 1.25, -0.9); ond.bs.forEach((x) => OG.add(x));
  const luzR = new THREE.PointLight(0x9ae8ff, 0, 3, 1.4); luzR.position.set(0, 1.3, -0.4); R.add(luzR);
  const tCasa = K.caixa - 1.1, tIlha = K.greed - 0.2, tFita = K.encontrar - 1.4;
  return {
    bg: 0x5a8ac8, fog: [12, 60], fogCol: 0xa8c0b0, hand: 0,
    look: { exposure: 1.15, bloom: 0.55, bloomT: 0.78, vig: 0.45, sat: 1.06, con: 1.04 },
    sun: { dir: [0.4, 0.7, 0.5], col: 0xfff0d0, I: 2.0, c: [0, 1, -1], r: 8 }, hemi: { sky: 0xc8d8e8, ground: 0x3a3a28, I: 0.85 }, fill: { col: 0xffe0c0, I: 0.5, dir: [-0.4, 0.3, 1] }, rim: { col: 0xe0f0ff, str: 0.9 },
    update(t) {
      chicote(t, a, 0.22, 1); chicote(t, tCasa, 0.2, -1); chicote(t, tIlha, 0.2, 1); chicote(t, tFita, 0.2, -1);
      // floresta: o Kite conta do Ging; o Gon escuta de olhos arregalados
      vive(gc, t, 82, { boca: t > K.kite + 1.5 ? "aberta" : "linha", sobe: 0.6, palpebra: 1.1 }, 0.3);
      vive(ki, t, 84, { boca: Math.sin(t * 9) > 0.2 && t > K.kite - 0.2 ? "aberta" : "linha", palpebra: 0.85 }, 0.3);
      const aponta = act(t, K.kite + 0.6, K.kite + 1.3) * (1 - smr(t, K.kite + 3, K.kite + 3.6)); maoEm(ki, 0, frenteW(ki, 0.25, 1.35, 0.55), aponta, { abre: 0.6, poleY: 0.0, poleZ: -0.3 }); pose(ki, { handR: 0.3 }, 1);
      // casa: o Gon encosta na caixa, a aura verde acende os frisos, a tampa abre e os itens sobem
      vive(gk, t, 82, { boca: t > K.fita ? "aberta" : "linha", sobe: 0.5, palpebra: 1.1 }, 0.2);
      const enc = smr(t, K.caixa - 0.3, K.caixa + 0.3), au = smr(t, K.aura - 0.3, K.aura + 0.4);
      const cW = C.localToWorld(V3(0, 0.95, -0.55));
      maoEm(gk, 0, cW.clone().add(V3(0.1, 0, 0)), enc, { abre: 0.5, poleY: 0.0, poleZ: -0.3 }); maoEm(gk, 1, cW.clone().add(V3(-0.1, 0, 0)), enc, { abre: 0.5, poleY: 0.0, poleZ: -0.3 }); pose(gk, { handR: 0.1, handL: 0.1 }, 1);
      cx.friso.emissiveIntensity = 2.2 * au; cx.luz.intensity = 2.5 * au; auraG.material.opacity = 0.5 * au * (1 - smr(t, K.fita, K.fita + 1));
      const abre = E.outBack(smr(t, K.aura + 0.4, K.fita - 0.2)); cx.tampa.rotation.x = -1.8 * abre;
      [[fita, K.fita, -0.18], [an, K.anel, 0], [mem, K.cartao, 0.18]].forEach(([o, tk, x], i) => { const k = E.outBack(smr(t, tk - 0.35, tk + 0.25)); o.position.set(x, 0.85 + 0.42 * k, -0.6); o.rotation.set(0.15, Math.sin(t * 1.4 + i) * 0.4, 0); o.scale.setScalar(Math.max(0.001, k)); o.visible = k > 0.01; });
      // Greed Island: cartas girando em volta da ilha; o Ging em cima, de braços cruzados
      ilha.rotation.y = t * 0.12; ilha.position.y = 2.2 + Math.sin(t * 0.8) * 0.08;
      cartasI.forEach((c, i) => { const an_ = i * 0.6 + t * 0.4, r = 2.6 + hash(i) * 1.6; c.position.set(Math.cos(an_) * r, 1.5 + hash(i * 3) * 2.4 + Math.sin(t + i) * 0.1, -6 + Math.sin(an_) * r); c.rotation.set(0, -an_, 0.2); c.scale.setScalar(1.6); });
      gI.position.y = ilha.position.y + 0.11; gI.rotation.y = 0.3 + ilha.rotation.y * 0; vive(gI, t, 81, { boca: "smirk", palpebra: 0.9 }, 0.2);
      // gravador: a onda da voz; no "apagou" ela some da direita pra esquerda
      const toca = smr(t, tFita, tFita + 0.4), ap = smr(t, K.apagou - 0.3, K.apagou + 1.0);
      ond.set(t, toca * (Math.sin(t * 3) > -0.6 ? 1 : 0.3), 1 - ap); ond.m.opacity = 0.9 * toca; luzR.intensity = 1.5 * toca * (1 - ap * 0.7); gv.led.visible = Math.sin(t * 6) > 0 && toca > 0.5;
      ond.m.color.setHex(ap > 0.05 ? 0xff7a7a : 0x9ae8ff);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      const cw = (x, y, z) => [x + 30, y, z];
      return planos(t, [
        [a, mov([0.2, 1.3, 3.6], [0.15, 1.25, 3.0], [0.02, 1.0, 0.05], [0.02, 1.05, 0.05], 40, 38)],
        [K.kite - 0.2, (tt, u) => ({ ...closeRosto(ki, lerp(1.0, 0.85, E.inOut(u)), 0.15, 0, 32) })],
        [K.kite + 1.6, (tt, u) => ({ ...closeRosto(gc, lerp(0.85, 0.7, E.inOut(u)), -0.12, 0, 32) })],
        [tCasa, mov(cw(0.9, 1.5, 1.2), cw(0.6, 1.4, 0.9), cw(0, 0.95, -0.6), cw(0, 0.9, -0.6), 40, 36)],
        [K.aura - 0.2, mov(cw(0.75, 1.2, -0.05), cw(0.65, 1.15, -0.15), cw(0, 0.9, -0.6), cw(0, 0.9, -0.6), 36, 34)],
        [K.fita - 0.3, mov(cw(0.6, 1.4, 0.05), cw(0.5, 1.36, -0.05), cw(0, 1.22, -0.6), cw(0, 1.22, -0.6), 42, 40)],
        [tIlha, mov([60.5, 2.0, 2.5], [60.3, 3.0, 1.0], [60, 2.6, -6], [60, 2.9, -6], 46, 44)],
        [K.criou - 0.2, (tt, u) => ({ ...closeRosto(gI, lerp(1.2, 0.9, E.inOut(u)), 0.2, 0, 32) })],
        [tFita, mov([90.2, 1.3, 1.4], [90.1, 1.25, 1.0], [90, 1.05, -0.7], [90, 1.05, -0.7], 38, 36)],
      ], b);
    },
  };
});
