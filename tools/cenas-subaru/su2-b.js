// ================================================================ vídeo: Subaru · cenas 5–9 (a bruxa, Discord, a exceção, só dele, fim)

// ---------------------------------------------------------------- 5 · a bruxa: areia negra; o Subaru de joelhos; a sombra da Satella atrás; as mãos o abraçam
addSet("s5-bruxa", (g) => {
  const __n = "s5-bruxa"; const [a, b] = T.sc["s5-bruxa"];
  const VZ = vazioSatella(g);
  const su = subaruLP(); g.add(su); su.position.set(0, 0, 0.4); const spS = sombraPe(g, su);
  const sa = satellaSombra(); g.add(sa); sa.scale.setScalar(1.25); sa.position.set(0, 0, -1.4);
  const aura = glowSprite(0x8a5ad8, 2.4, 0); aura.position.set(0, 1.6, -1.6); g.add(aura);
  const M = [0, 1, 2, 3].map(() => maoSombra(g)), bases = [V3(-1.1, 0, -0.9), V3(1.1, 0, -0.9), V3(-1.3, 0, 0.6), V3(1.3, 0, 0.7)];
  const alvos = (p) => [corpoW(p, "chest", -0.16, 0.2, 0.02), corpoW(p, "chest", 0.16, 0.2, 0.02), corpoW(p, "spine", -0.15, 0.05, 0.05), corpoW(p, "spine", 0.15, 0.05, 0.05)];
  return { bg: 0x05020c, fog: [12, 90], fogCol: 0x140a20, hand: 0.004,
    look: { exposure: 1.1, bloom: 0.5, bloomT: 0.8, vig: 0.62, sat: 1.0, con: 1.12, dof: RDOF_M, rosto: 0.5, lift: [0.01, 0, 0.03] },
    sun: { dir: [0, 0.6, 0.8], col: 0xd8c8ff, I: 0.9, c: [0, 1, 0], r: 10 }, hemi: { sky: 0x3a2a5a, ground: 0x05020a, I: 0.5 }, fill: { col: 0xb8a8ff, I: 0.4, dir: [0.3, 0.3, 1] }, rim: { col: 0xb89aff, str: 1.4 },
    update(t) {
      floatDust(VZ.po, t, 0.3, 0.2);
      vive(su, t, 411, { boca: "linha", triste: 0.8, choro: 0.3, palpebra: 0.75 }, 0.06); kneelPose(su, 1); pose(su, { neck: [0.3, 0, 0] }, 1); spS(0);
      const ap = smr(t, K.satella - 0.6, K.satella + 0.4); sa.visible = ap > 0.02; aura.material.opacity = 0.18 * ap; restPose(sa); idle(sa, t, 441, 0.05); standFeet(sa); pose(sa, { neck: [0.35, 0, 0] }, 1);
      sa.position.y = -0.6 * (1 - ap); cabeloVento(sa, t, 0.6, [1, 0, 0.3]);
      const abr = smr(t, K.inveja - 0.3, K.dividir + 0.3), al = alvos(su); M.forEach((m, i) => m.set(bases[i], al[i], abr * (0.85 + 0.15 * Math.sin(t * 1.5 + i)), t, i * 2));
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.3, 1.2, 6.5], [0.2, 1.0, 4.8], [0, 0.9, 0], [0, 1.0, 0], 44, 42)],
        [K.satella - 0.3, mov([0.9, 0.6, 3.4], [0.7, 0.55, 3.0], [0, 1.6, -1.2], [0, 1.9, -1.4], 44, 42)],
        [K.inveja - 0.2, (tt, u) => ({ ...closeRosto(su, lerp(1.0, 0.85, E.inOut(u)), 0.2, -0.02, 30) })],
        [K.dividir - 0.2, mov([2.2, 1.6, 3.2], [1.9, 1.5, 2.8], [0, 0.8, 0.2], [0, 0.85, 0.2], 42, 40)],
        [K.saber - 0.3, (tt, u) => ({ ...closeRosto(su, lerp(0.85, 0.7, E.inOut(u)), -0.18, 0, 30) })],
      ], b); },
  };
});

// ---------------------------------------------------------------- 6 · Discord ("quer aprender a fazer esses vídeos?"): o Subaru de arame virando modelo num pedestal
addSet("s6-discord", (g) => {
  const [a, b] = T.sc["s6-discord"];
  vazio(g, 0x0c0820, 0x3a2a7a, 0x06040c);
  const grade = new THREE.GridHelper(24, 48, 0x9a8aff, 0x3a2a7a); grade.material.transparent = true; grade.material.opacity = 0.55; g.add(grade);
  const ch = mesh(new THREE.PlaneGeometry(40, 40), SM(0x0a0816, { roughness: 0.5, metalness: 0.2 }), 0, -0.005, 0, g); ch.rotation.x = -Math.PI / 2;
  const gira = grp(g); mesh(cyl(0.62, 0.66, 0.15, 40), SM(0x16122a, { roughness: 0.4, metalness: 0.4 }), 0, 0.075, 0, gira);
  const aro = mesh(new THREE.TorusGeometry(0.64, 0.012, 6, 64), new THREE.MeshBasicMaterial({ color: 0xb8a8ff }), 0, 0.15, 0, gira); aro.rotation.x = Math.PI / 2; aro.castShadow = false;
  const su = subaruLP(); g.add(su); su.position.y = 0.15; const fi = subaruLP(); g.add(fi); fi.position.y = 0.15; const wm = new THREE.MeshBasicMaterial({ color: 0xb8a8ff, wireframe: true, transparent: true, opacity: 0.85 });
  fi.traverse((x) => { if (x.isMesh) { if (x.userData.isDecal) x.visible = false; else x.material = wm; x.castShadow = false; } });
  const scan = mesh(new THREE.TorusGeometry(0.5, 0.01, 6, 64), new THREE.MeshBasicMaterial({ color: 0xe8e0ff, transparent: true, opacity: 0, blending: ADD, depthWrite: false }), 0, 0.15, 0, g); scan.rotation.x = Math.PI / 2; scan.castShadow = false;
  const p = dustPts(160, [-3, 3, 0.1, 3.5, -3, 1], 0xb8a8ff, 0.03, 0.7); g.add(p); const tTroca = K.link - 0.25;
  return { bg: 0x0c0820, fog: [6, 30], fogCol: 0x140c30, hand: 0, look: { exposure: 1.1, bloom: 0.7, bloomT: 0.74, vig: 0.5, sat: 1.08, con: 1.06, rosto: 0.5 },
    sun: { dir: [0.4, 0.8, 0.8], col: 0xf0e8ff, I: 1.6, c: [0, 1, 0], r: 4 }, hemi: { sky: 0x6a5ab8, ground: 0x0a0814, I: 0.7 }, fill: { col: 0xb8a8ff, I: 0.5, dir: [-0.6, 0.3, -0.5] }, rim: { col: 0xb0a0ff, str: 1.3 },
    update(t) { floatDust(p, t, 0.3, 0.15); gira.rotation.y = 0.6 + (t - a) * 0.9;
      [su, fi].forEach((q) => { q.rotation.y = gira.rotation.y; q.position.set(0, 0.15, 0); restPose(q); idle(q, t, 411, 0.06); standFeet(q); }); rostoLP(su, t, { boca: "sorriso", palpebra: 0.95 });
      const k = seg(t, tTroca - 0.35, tTroca + 0.35); su.visible = t > tTroca; fi.visible = t <= tTroca + 0.05; scan.position.y = 0.15 + 2.0 * k; scan.material.opacity = k > 0 && k < 1 ? 0.9 : 0; scan.scale.setScalar(1 - 0.4 * Math.sin(k * Math.PI)); },
    cam(t) { return { ...path2(t, [[a, [0.3, 1.5, 4.6], [0, 1.1, 0], 40], [b, [0.2, 1.45, 3.8], [0, 1.1, 0], 38]]), near: 0.03 }; } };
});

// ---------------------------------------------------------------- 7 · a exceção: a colina do chá; a Echidna serve; o Subaru conta pela primeira vez; nuvens escuras longe, sem chegar
addSet("s7-echidna", (g) => {
  const __n = "s7-echidna"; const [a, b] = T.sc["s7-echidna"];
  const CC = colinaCha(g);
  const ec = echidnaLP(); g.add(ec); ec.position.set(0, 0, -0.74); ec.rotation.y = 0;
  const su = subaruLP(); g.add(su); su.position.set(0, 0, 0.74); su.rotation.y = Math.PI;
  const senta = (p, t, seed, o) => { restPose(p); idle(p, t, seed, 0.08); sitPose(p, 1, { seatY: 0.49, lean: o.lean ?? 0.05 }); pose(p, { neck: o.neck ?? [0, 0, 0] }, 1);
    maoEm(p, 0, frenteW(p, 0.14, 0.78, 0.34), 1, { abre: 0.6, poleY: 0.1, poleZ: -0.3 }); maoEm(p, 1, frenteW(p, -0.14, 0.78, 0.34), 1, { abre: 0.6, poleY: 0.1, poleZ: -0.3 }); };
  return { bg: 0x9ac8f0, fog: [60, 420], fogCol: 0xd8ecff, hand: 0.004,
    look: { exposure: 0.98, bloom: 0.4, bloomT: 0.86, vig: 0.38, sat: 1.12, con: 1.06, dof: RDOF_M, rosto: 0.2, lift: [0.01, 0.008, 0] },
    sun: { dir: [0.5, 0.65, 0.55], col: 0xfff2d8, I: 2.0, c: [0, 1, 0], r: 12 }, hemi: { sky: 0xcfe6ff, ground: 0x5a7a3a, I: 0.85 }, fill: { col: 0xffe8d0, I: 0.5, dir: [-0.3, 0.3, 1] }, rim: { col: 0xfff4e0, str: 1.1 },
    update(t) {
      CC.folhas(t, 0.6);
      senta(ec, t, 431, { lean: 0.02 }); rostoLP(ec, t, { boca: t > K.sabia - 0.3 ? "sorriso" : "linha", palpebra: 0.85, piscaCada: 4.1 }); cabeloVento(ec, t, 0.6, [1, 0, 0.2]);
      const fala = t > K.falou - 0.4 && t < K.sabia - 0.4; senta(su, t, 411, { lean: 0.12, neck: [0.1, 0, 0] }); rostoLP(su, t, { boca: fala ? "aberta" : "linha", fala: fala ? 1 : 0, triste: 0.3, choro: smr(t, K.sabia - 0.6, K.sabia) * 0.6, palpebra: 0.95 }); cabeloVento(su, t, 0.6, [1, 0, 0.2]);
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([4.5, 3.2, 7.5], [3.2, 2.0, 5.0], [0, 0.9, 0], [0, 0.95, 0], 44, 40)],
        [K.echidna - 0.2, (tt, u) => ({ ...closeRosto(ec, lerp(1.0, 0.85, E.inOut(u)), 0.22, -0.02, 30) })],
        [K.castelo - 0.2, mov([0.9, 1.15, 2.6], [0.8, 1.25, 3.2], [0, 1.4, -6], [0, 4, -80], 44, 46)],
        [K.falou - 0.3, (tt, u) => ({ ...closeRosto(su, lerp(1.0, 0.85, E.inOut(u)), -0.22, -0.02, 30) })],
        [K.sabia - 0.3, (tt, u) => ({ ...closeRosto(ec, lerp(0.9, 0.78, E.inOut(u)), 0.2, -0.02, 30) })],
      ], b); },
  };
});

// ---------------------------------------------------------------- 8 · só dele: campo ao anoitecer, um marco de pedra com luz pra cada morte; ele anda sozinho entre eles
addSet("s8-heidegger", (g) => {
  const __n = "s8-heidegger"; const [a, b] = T.sc["s8-heidegger"];
  const CM = campoMarcos(g);
  const su = subaruLP(); g.add(su); const sp = sombraPe(g, su); const D = 9;
  return { bg: 0x2a2440, fog: [20, 160], fogCol: 0x6a4a5a, hand: 0.004,
    look: { exposure: 1.08, bloom: 0.55, bloomT: 0.78, vig: 0.55, sat: 1.1, con: 1.06, dof: RDOF_M, rosto: 0.45, lift: [0.015, 0.006, 0.01] },
    sun: { dir: [0.2, 0.25, -1], col: 0xffa070, I: 1.8, c: [0, 1, -10], r: 20 }, hemi: { sky: 0x8a6a9a, ground: 0x2a2420, I: 0.7 }, fill: { col: 0xb8b0ff, I: 0.45, dir: [0.2, 0.4, 1] }, rim: { col: 0xffb080, str: 1.3 },
    update(t) {
      floatDust(CM.brilho, t, 0.3, 0.2); CM.marcos.forEach((m) => (m.l.material.opacity = 0.7 + 0.25 * Math.sin(t * 2 + m.i)));
      const f = seg(t, a, b); gait(su, D * f, { from: [0, 0, 0], ang: Math.PI, step: 0.55 }); rostoLP(su, t, { boca: "linha", triste: 0.6, palpebra: 0.85 }); sp(0); cabeloVento(su, t, 0.5, [1, 0, 0]);
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; } const p = su.position;
      return planos(t, [
        [a, mov([2.4, 3.2, 4.5], [1.8, 2.6, 2.6], [0, 0.6, -6], [0, 0.7, -8], 46, 44)],
        [K.morrer8 - 0.3, (tt, u) => ({ pos: [p.x + 0.6, 1.5, p.z + 2.6], look: [p.x, 1.2, p.z - 2], fov: 40 })],
        [K.sua - 0.3, (tt, u) => ({ pos: [p.x + 2.4, 1.2, p.z - 1.0], look: [p.x, 1.1, p.z], fov: 38 })],
        [K.dezenas - 0.3, (tt, u) => ({ pos: [p.x - 3, lerp(4, 9, E.inOut(u)), p.z + 6], look: [p.x, 0.5, p.z - 8], fov: 46 })],
        [K.lembra8 - 0.3, (tt, u) => { const c = closeRosto(su, lerp(1.1, 0.9, E.inOut(u)), 0.2, 0, 30); return c; }],
      ], b); },
  };
});

// ---------------------------------------------------------------- 9 · fim: terraço da mansão ao amanhecer; a Emilia lá embaixo no jardim, viva; ele sozinho em cima; a câmera sobe
addSet("s9-fim", (g) => {
  const __n = "s9-fim"; const [a, b] = T.sc["s9-fim"];
  const TA = terracoAmanhecer(g);
  const su = subaruLP(); g.add(su); su.position.set(0, 6.8, TA.vz + 0.5); const sp = sombraPe(g, su);
  const em = emiliaLP(); g.add(em); em.position.set(-1.2, 0, 3.6); em.rotation.y = Math.PI * 0.85; const spE = sombraPe(g, em);
  const ps = [0, 1].map((i) => { const p = pessoaLP({ seed: 660 + i, pele: 0xf4d4b8, olho: "#4a3a2a", roupa: [0x3a5a6a, 0x7a3a3a][i], calca: 0x3a3a44, botoes: false, cabelo: { ...CABELOS_AOT.frieda, cor: [0x3a6ad8, 0xe8a0c0][i], seed: 670 + i }, scale: 0.9 }); g.add(p); p.position.set(1.2 + i * 0.7, 0, 3.2 - i * 0.6); p.rotation.y = Math.PI * 0.9; return p; });
  return { bg: 0xd8a0a0, fog: [30, 260], fogCol: 0xe8b8a0, hand: 0.004,
    look: { exposure: 1.06, bloom: 0.55, bloomT: 0.8, vig: 0.45, sat: 1.12, con: 1.05, dof: RDOF_L, rosto: 0.4 },
    sun: { dir: [0, 0.3, 1], col: 0xffd0a0, I: 2.0, c: [0, 4, -8], r: 24 }, hemi: { sky: 0xe8b0b8, ground: 0x3a3a2a, I: 0.85 }, fill: { col: 0xa8b8ff, I: 0.35, dir: [0, 0.3, -1] }, rim: { col: 0xffc890, str: 1.3 },
    update(t) {
      floatDust(TA.F.jato, t, 1.4, 0.4);
      vive(su, t, 411, { boca: "linha", triste: 0.5, palpebra: 0.85 }, 0.1); pose(su, { neck: [0.12, 0, 0] }, 1); sp(6.8); cabeloVento(su, t, 0.7, [1, 0, 0]);
      vive(em, t, 421, { boca: "sorriso", palpebra: 0.95 }, 0.1); spE(0); cabeloVento(em, t, 0.6, [1, 0, 0]); ps.forEach((p, i) => vive(p, t, 660 + i, { boca: "sorriso" }, 0.15));
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.5, 1.3, 2.0], [1.2, 1.5, 1.0], [0, 7.6, TA.vz], [0, 7.8, TA.vz], 44, 42)],
        [K.salvar - 0.2, mov([0.35, 9.4, TA.vz + 0.2], [0.3, 9.2, TA.vz + 0.5], [0, 0.6, 3.2], [0, 0.7, 3.2], 40, 36)],
        [K.sozinho - 0.3, (tt, u) => ({ ...closeRosto(su, lerp(1.0, 0.85, E.inOut(u)), 0.2, 0, 30) })],
        [K.voltar9 - 0.2, mov([2.2, 7.9, TA.vz + 2.6], [1.8, 7.8, TA.vz + 2.2], [0, 7.6, TA.vz + 0.5], [0, 7.7, TA.vz + 0.5], 42, 40)],
        [K.comenta - 0.2, mov([2.2, 8.2, TA.vz + 3], [6, 24, 26], [0, 7.6, TA.vz], [0, 6, -40], 42, 50)],
      ], b); },
  };
});
