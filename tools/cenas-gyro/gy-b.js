// ================================================================ vídeo: Gyro · cenas 6–10 (Discord, a NGL e a D², as formigas, o espelho do Gon, hoje)
const LUZ_NGL_DIA = { bg: 0xd8ecf8, fog: [60, 320], fogCol: 0xc8dcec, look: { exposure: 1.02, bloom: 0.3, bloomT: 0.85, vig: 0.35, sat: 1.1, con: 1.05, dof: GDOF_M, rosto: 0.4 },
  sun: { dir: [0.4, 0.6, -0.5], col: 0xfff0d0, I: 2.6, c: [0, 1, 0], r: 20 }, hemi: { sky: 0xbcd8f0, ground: 0x4a5a3a, I: 0.9 }, fill: { col: 0xffffff, I: 0.4, dir: [0.4, 0.3, 1] }, rim: { col: 0xffffff, str: 0.8 } };
const LUZ_LAB = { bg: 0x08060c, fog: [8, 30], fogCol: 0x0e0c12, look: { exposure: 1.08, bloom: 0.45, bloomT: 0.78, vig: 0.5, sat: 1.05, con: 1.08, dof: GDOF_M, rosto: 0.4 },
  sun: { dir: [0.2, 1, 0.1], col: 0xd8e0ff, I: 0.3, c: [0, 1, -2], r: 8 }, hemi: { sky: 0x4a4a5a, ground: 0x1a1420, I: 0.5 }, fill: { col: 0xd8e0ff, I: 0.3, dir: [0.3, 0.3, 1] }, rim: { col: 0xc8a0ff, str: 0.8 } };
const LUZ_FORMIGAS = { bg: 0x05040a, fog: [14, 140], fogCol: 0x1a0c0c, look: { exposure: 1.1, bloom: 0.55, bloomT: 0.74, vig: 0.55, sat: 1.05, con: 1.1, dof: GDOF_M, rosto: 0.35, lift: [0.02, 0.004, 0] },
  sun: { dir: [0.3, 0.6, -0.7], col: 0xa8b0ff, I: 0.6, c: [0, 1, -6], r: 20 }, hemi: { sky: 0x3a2a3a, ground: 0x0a0806, I: 0.5 }, fill: { col: 0xff8a40, I: 0.5, dir: [0.2, 0.2, -1] }, rim: { col: 0xffa060, str: 1.5 } };
const LUZ_MAR = { bg: 0xe0f2ff, fog: [120, 1200], fogCol: 0xd0e6f8, look: { exposure: 1.02, bloom: 0.35, bloomT: 0.84, vig: 0.32, sat: 1.12, con: 1.05, dof: GDOF_M, rosto: 0.45 },
  sun: { dir: [0.5, 0.6, -0.8], col: 0xfff4d8, I: 2.6, c: [0, 1, 0], r: 16 }, hemi: { sky: 0xbcdcf8, ground: 0x5a7a4a, I: 0.9 }, fill: { col: 0xffffff, I: 0.45, dir: [0.4, 0.3, 1] }, rim: { col: 0xffffff, str: 0.9 } };
const LUZ_METEORO = { bg: 0xc8a888, fog: [20, 160], fogCol: 0xa89078, look: { exposure: 1.04, bloom: 0.4, bloomT: 0.8, vig: 0.45, sat: 1.0, con: 1.08, dof: GDOF_M, rosto: 0.35 },
  sun: { dir: [-0.5, 0.3, -1], col: 0xffc890, I: 2.0, c: [0, 1, -6], r: 20 }, hemi: { sky: 0xb8a898, ground: 0x3a3430, I: 0.8 }, fill: { col: 0xffe0c0, I: 0.35, dir: [0.4, 0.3, 1] }, rim: { col: 0xffd0a0, str: 1.2 } };
// moradores da NGL: roupa de linho, sem nada de máquina; trabalhadores do laboratório: máscara e óculos
function aldeao(seed, roupa = 0xd8ccb0) { return pessoaLP({ seed, pele: [0xf2d4b8, 0xd8a880, 0xb8845a][seed % 3], roupa, calca: 0x7a6a4a, sapato: 0x5a4030, botoes: false, cabelo: { ...CAB_GY.pai, seed: seed + 3, cor: [0x2a1a10, 0x5a3a22, 0x141414][seed % 3] }, scale: 0.96 + hash(seed) * 0.08 }); }
function mascarado(seed) { const p = pessoaLP({ seed, roupa: 0x3a3c40, calca: 0x2a2c30, sapato: 0x1a1a1a, botoes: false, cabelo: { ...CAB_GY.pai, seed: seed + 3 } }); const u = p.userData, m = LPmat(0x1e2024, { rim: 0.6 });
  const z = surfZ(u.headM, 0, -0.03); mesh(box(0.11, 0.07, 0.06), m, 0, -0.035, z + 0.02, u.head); mesh(cyl(0.025, 0.025, 0.03, 8), m, 0, -0.05, z + 0.06, u.head).rotation.x = Math.PI / 2;
  [-1, 1].forEach((k) => { const o = mesh(cyl(0.024, 0.024, 0.02, 10), LPmat(0x9ab8c8, { metal: 0.5, rough: 0.2 }), k * 0.036, CAB.EY, surfZ(u.headM, k * 0.036, CAB.EY) + 0.01, u.head); o.rotation.x = Math.PI / 2; }); return p; }
function caixote(cor = 0x7a5a3a) { const c = new THREE.Group(); mesh(box(0.5, 0.36, 0.38), LPmat(cor, { rough: 0.95 }), 0, 0.18, 0, c); return c; }

// ---------------------------------------------------------------- 6 · Discord: o Gyro de capuz no palco giratório (holograma vira sólido no "link")
addSet("g6-discord", (g) => {
  const [a, b] = T.sc["g6-discord"];
  vazio(g, 0x0c0a14, 0x3a3a5a, 0x06050a);
  const grade = new THREE.GridHelper(24, 48, 0x9ab0ff, 0x2a3050); grade.material.transparent = true; grade.material.opacity = 0.5; g.add(grade);
  const ch = mesh(new THREE.PlaneGeometry(40, 40), SM(0x0a0a12, { roughness: 0.5, metalness: 0.2 }), 0, -0.005, 0, g); ch.rotation.x = -Math.PI / 2;
  const gira = grp(g); mesh(cyl(0.62, 0.66, 0.15, 40), SM(0x14161e, { roughness: 0.4, metalness: 0.4 }), 0, 0.075, 0, gira);
  const aro = mesh(new THREE.TorusGeometry(0.64, 0.012, 6, 64), new THREE.MeshBasicMaterial({ color: 0xa8c0ff }), 0, 0.15, 0, gira); aro.rotation.x = Math.PI / 2; aro.castShadow = false;
  const gy = gyroLP(); g.add(gy); const fi = gyroLP(); g.add(fi); const wm = new THREE.MeshBasicMaterial({ color: 0xa8c0ff, wireframe: true, transparent: true, opacity: 0.85 });
  fi.traverse((x) => { if (x.isMesh) { x.material = wm; x.castShadow = false; } }); olhosK(fi, 0);
  const scan = mesh(new THREE.TorusGeometry(0.5, 0.01, 6, 64), new THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0, blending: ADD, depthWrite: false }), 0, 0.15, 0, g); scan.rotation.x = Math.PI / 2; scan.castShadow = false;
  const p = dustPts(160, [-3, 3, 0.1, 3.5, -3, 1], 0xa8c0ff, 0.03, 0.7); g.add(p); const tTroca = K.link - 0.25;
  return { bg: 0x0c0a14, fog: [6, 30], fogCol: 0x10121c, hand: 0, look: { exposure: 1.1, bloom: 0.7, bloomT: 0.74, vig: 0.5, sat: 1.05, con: 1.06, rosto: 0.5 },
    sun: { dir: [0.4, 0.8, 0.8], col: 0xf0f4ff, I: 1.8, c: [0, 1, 0], r: 4 }, hemi: { sky: 0x5a6aa8, ground: 0x0a0a14, I: 0.8 }, fill: { col: 0xa8c0ff, I: 0.5, dir: [-0.6, 0.3, -0.5] }, rim: { col: 0xb0c8ff, str: 1.4 },
    update(t) { floatDust(p, t, 0.3, 0.15); gira.rotation.y = 0.6 + (t - a) * 0.9;
      [gy, fi].forEach((q) => { q.rotation.y = gira.rotation.y; q.position.set(0, 0.15, 0); restPose(q); idle(q, t, 801, 0.06); standFeet(q); }); olhosK(gy, 1);
      const k = seg(t, tTroca - 0.35, tTroca + 0.35); gy.visible = t > tTroca; fi.visible = t <= tTroca + 0.05; scan.position.y = 0.15 + 2.0 * k; scan.material.opacity = k > 0 && k < 1 ? 0.9 : 0; scan.scale.setScalar(1 - 0.4 * Math.sin(k * Math.PI)); },
    cam(t) { return { ...path2(t, [[a, [0.3, 1.5, 4.6], [0, 1.1, 0], 40], [b, [0.2, 1.45, 3.8], [0, 1.1, 0], 38]]), near: 0.03 }; } };
});

// ---------------------------------------------------------------- 7 · a NGL de dia: o Gyro no arco da entrada; moradores na horta; câmera desce até o alçapão
addSet("g7-ngl", (g) => {
  const __n = "g7-ngl"; const [a, b] = T.sc[__n];
  const V = vilaNGL(g); const gy = gyroLP(); g.add(gy); const spG = sombraPe(g, gy, 1.2);
  const M = [[-4.0, 3.2, 0], [-3.1, 4.4, 1], [3.4, -7.2, 2], [-1.6, -3.0, 3], [2.6, -1.5, 4]].map(([x, z, i]) => { const p = aldeao(651 + i, [0xd8ccb0, 0xc8b890, 0xe0d4bc][i % 3]); g.add(p); p.position.set(x, 0, z); p.rotation.y = hash(i) * 6; return { p, i, sp: sombraPe(g, p) }; });
  const cesto = naMaoG(M[3].p, 0, mesh(cyl(0.16, 0.12, 0.2, 10), LPmat(0xb8904a, { rough: 1 })), 0, -0.14, 0.08);
  return { ...LUZ_NGL_DIA, hand: 0.004,
    update(t) {
      const abre = smr(t, K.baixo - 0.6, K.baixo - 0.1); V.upd(t, abre);
      restPose(gy); gait(gy, 3.0 * smr(t, a, K.maquinas), { from: [0, 0, 9.0], ang: Math.PI, step: 0.6 }); olhosK(gy, 0.6); spG(0);
      M.forEach(({ p, i, sp }) => { restPose(p); idle(p, t, 660 + i, 0.4); if (i < 2 || i === 2) { kneelPose(p, 1); const c = Math.sin(t * 2.4 + i); maoEm(p, 0, frenteW(p, 0.1, 0.15 + 0.08 * c, 0.4), 1, { abre: 0.4 }); } else if (i === 3) gait(p, 2.5 * seg(t, a, b), { from: [-1.6, 0, -3.0], ang: 0.4, step: 0.5 }); else standFeet(p); if (i !== 3) standFeet(p); sp(0); });
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.2, 4.5, 15], [0.6, 2.6, 11.5], [0, 2.4, 7.5], [0, 2.0, 5], 44, 40)],
        [K.ngl - 0.2, mov([-0.4, 0.6, 5.5], [-0.3, 0.7, 5.0], [0, 3.0, 7.5], [0, 3.1, 7.5], 40, 38)],
        [K.maquinas - 0.3, mov([-6.5, 1.4, 6.5], [-6.0, 1.3, 5.5], [-3.6, 0.6, 3.6], [-3.4, 0.6, 3.6], 40, 38)],
        [K.natureza - 0.3, mov([2, 2.0, 4], [-2, 3.0, 3], [0, 3, -14], [-6, 4, -16], 46, 46)],
        [K.paz - 0.3, mov([4.5, 6, 12], [3.5, 5, 10], [0, 1.0, -2], [0, 1.0, -2], 46, 44)],
        [K.baixo - 0.8, mov([2.6, 1.9, 3.2], [1.7, 0.6, 1.4], [1.6, 0, 1.0], [1.6, -1.0, 1.15], 46, 50)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 7b · o laboratório da D² debaixo da terra: mesas, frascos, pó roxo; caixas sobem pela escada
addSet("g7b-lab", (g) => {
  const __n = "g7b-lab"; const [a, b] = T.sc[__n];
  const L = laboratorioD2(g);
  const W = [[-1.4, -3.5, Math.PI / 2], [1.4, -3.5, -Math.PI / 2], [0.2, -5.3, Math.PI]].map(([x, z, r], i) => { const p = mascarado(671 + i); g.add(p); p.position.set(x, 0, z); p.rotation.y = r; return { p, i }; });
  const gy = gyroLP(); g.add(gy); const cx = caixote(); g.add(cx); const brilhoCx = glowSprite(0xb060ff, 0.9, 0.5); cx.add(brilhoCx); brilhoCx.position.y = 0.4;
  const sobe = dustPts(120, [-0.4, 0.4, 0, 3, -0.4, 0.4], 0xc890ff, 0.03, 0.8); sobe.position.set(2.5, 0, 2.6); g.add(sobe);
  return { ...LUZ_LAB, hand: 0.004,
    update(t) { L.upd(t); floatDust(sobe, t, 0.2, 0.6); sobe.position.y = ((t * 0.8) % 1.0) * 0.6;
      W.forEach(({ p, i }) => { restPose(p); idle(p, t, 680 + i, 0.3); standFeet(p); pose(p, { spine: [0.3, 0, 0], neck: [0.3, 0, 0] }, 1); const c = Math.sin(t * 3 + i * 2); maoEm(p, 0, frenteW(p, 0.1, 0.95 + 0.04 * c, 0.42), 1, { abre: 0.4 }); maoEm(p, 1, frenteW(p, -0.15, 0.95 - 0.04 * c, 0.4), 1, { abre: 0.4 }); });
      restPose(gy); gy.position.set(-0.2, 0, 0.6); gy.rotation.y = Math.PI - 0.2; idle(gy, t, 801, 0.2); standFeet(gy); olhosK(gy, 0.8);
      const f = smr(t, K.espalhava - 0.3, b - 0.2); cx.position.set(lerp(0.8, 2.5, f), lerp(0, 2.2, smr(t, K.espalhava + 0.3, b)), lerp(-1.0, 2.6, f)); cx.rotation.y = 0.3;
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([2.5, 2.6, 2.4], [2.3, 1.7, 1.4], [0, 1.0, -3], [-0.4, 1.0, -4], 50, 48)],
        [K.droga - 0.3, mov([-1.0, 1.35, -2.4], [-1.2, 1.25, -2.7], [-2.2, 0.95, -3.6], [-2.2, 0.95, -3.6], 40, 34)],
        [K.d2 - 0.1, mov([0.9, 1.25, -4.4], [0.95, 1.2, -4.7], [2.2, 1.0, -3.0], [2.2, 1.0, -3.0], 36, 30)],
        [K.espalhava - 0.3, mov([0.3, 1.3, -1.2], [0.6, 1.4, -0.6], [1.6, 0.8, 1.6], [2.5, 2.0, 2.6], 46, 48)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 7c · a fachada: de volta à vila tranquila; o alçapão fechado solta um fio de brilho roxo
addSet("g7c-fachada", (g) => {
  const __n = "g7c-fachada"; const [a, b] = T.sc[__n];
  const V = vilaNGL(g); const M = [[-1.2, 2.6, 0], [0.6, 3.6, 1]].map(([x, z, i]) => { const p = aldeao(655 + i); g.add(p); p.position.set(x, 0, z); p.rotation.y = 0.4 + i; return { p, i }; });
  const fio = glowSprite(0xa050ff, 0.8, 0); fio.position.set(1.6, 0.08, 1.2); g.add(fio);
  return { ...LUZ_NGL_DIA, hand: 0.004,
    update(t) { V.upd(t, 0); fio.material.opacity = 0.35 + 0.2 * Math.sin(t * 3); M.forEach(({ p, i }) => { vive(p, t, 665 + i, { boca: "sorriso" }, 0.4); }); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; } return mov([1.8, 0.5, 3.2], [3.5, 3.2, 7.5], [1.6, 0.1, 1.2], [0.5, 1.0, 0], 44, 46)(t, seg(t, a, b)); },
  };
});

// ---------------------------------------------------------------- 8 · as formigas: NGL em chamas, o ninho; o Gyro cercado; renasce do casulo; memórias; dá as costas ao Rei e vai embora
addSet("g8-formigas", (g) => {
  const __n = "g8-formigas"; const [a, b] = T.sc[__n];
  const N = ninhoFormigas(g);
  const F = Array.from({ length: 7 }, (_, i) => { const p = formigaSombra({ seed: 611 + i, scale: 0.95 + hash(i) * 0.15 }); g.add(p); return { p, i, sp: sombraPe(g, p) }; });
  const gy = gyroLP(); g.add(gy); const ga = formigaSombra({ seed: 640, olho: 0xcfe0ff, scale: 1.05 }); g.add(ga); const spA = sombraPe(g, ga);
  const rei = formigaSombra({ seed: 645, scale: 2.2, olho: 0xffe080 }); g.add(rei); rei.position.set(0, 25.6, -38); rei.rotation.y = 0;
  const cas = grp(g, 0, 0, -1); const cm = LPmat(0x2a2420, { rim: 0.8 }), luzC = new THREE.MeshBasicMaterial({ color: 0xcfe0ff });
  const met = [0, 1].map((k) => { const h = mesh(new THREE.SphereGeometry(0.5, 14, 10, 0, Math.PI), cm, 0, 0.9, 0, cas); h.scale.set(1, 1.9, 1); h.rotation.y = k * Math.PI; return h; });
  const fenda = mesh(box(0.02, 1.6, 1.02), luzC, 0, 0.9, 0, cas); const brC = glowSprite(0xcfe0ff, 2.5, 0); brC.position.y = 1; cas.add(brC);
  const mem = Array.from({ length: 6 }, (_, i) => { const m = mesh(new THREE.PlaneGeometry(0.34, 0.24), new THREE.MeshBasicMaterial({ color: [0xffa060, 0xd8783a, 0xffc080][i % 3], transparent: true, opacity: 0, side: THREE.DoubleSide, blending: ADD, depthWrite: false }), 0, 0, 0, g); m.castShadow = false; return m; });
  return { ...LUZ_FORMIGAS, hand: 0.005,
    update(t) {
      N.upd(t);
      F.forEach(({ p, i, sp }) => { restPose(p); const ang = -0.3 + i * 0.5, r0 = 9 + hash(i) * 3; const fechar = smr(t, K.devorado - 1.2, K.devorado); const d = (t < K.tomada ? 6 * seg(t, a, K.tomada) : 6) + (r0 - 7.2) * fechar;
        gait(p, d, { from: [Math.sin(ang) * (r0 + 6) * 0.6, 0, -1 - Math.cos(ang) * (r0 + 6) * 0.6], ang: ang + Math.PI, step: 0.6 }); p.visible = t < K.renasceu - 0.3; sp(0); });
      // o Gyro humano até ser devorado; depois o casulo, que racha no "renasceu"
      gy.visible = t < K.devorado + 0.1; restPose(gy); gy.position.set(0, 0, -1); gy.rotation.y = 0.3; idle(gy, t, 801, 0.2); standFeet(gy); olhosK(gy, 1); pose(gy, { neck: [-0.2, 0.3 * Math.sin(t * 2), 0] }, 1);
      escurece(t, K.devorado - 0.15, K.devorado + 0.05, [0, 0, 0], 1); if (t > K.devorado + 0.05) { const v = 1 - smr(t, K.devorado + 0.05, K.devorado + 0.7); if (v > 0) { GU.uFade.value = Math.max(GU.uFade.value, v); GU.uFadeCol.value.set(0, 0, 0); } }
      const casV = t > K.devorado + 0.05 && t < K.memorias; cas.visible = casV; const ab = smr(t, K.renasceu - 0.1, K.renasceu + 0.4); met[0].position.x = -0.35 * ab; met[1].position.x = 0.35 * ab; met.forEach((m) => (m.rotation.z = 0)); fenda.visible = ab < 0.3; fenda.material.color.setScalar(0.6 + 0.4 * Math.sin(t * 9)); brC.material.opacity = 0.8 * Math.sin(ab * Math.PI) + 0.2 * (1 - ab);
      // a formiga-Gyro: levanta do casulo, memórias giram, vira as costas para o Rei e vai embora
      ga.visible = t > K.renasceu; restPose(ga); const vira = smr(t, K.recusou - 0.1, K.recusou + 0.5);
      if (t < K.embora - 0.3) { ga.position.set(0, 0, -1); ga.rotation.y = lerp(Math.PI, 0, vira); idle(ga, t, 641, 0.25); const lev = smr(t, K.renasceu, K.renasceu + 0.6); if (lev < 1) kneelPose(ga, 1 - lev); standFeet(ga); if (t < K.recusou) pose(ga, { neck: [-0.35, 0, 0] }, smr(t, K.rei - 0.8, K.rei - 0.3)); }
      else gait(ga, 7 * smr(t, K.embora - 0.3, b), { from: [0, 0, -1], ang: 0, step: 0.6 });
      olhosK(ga, ga.visible ? 1 : 0); spA(0);
      restPose(rei); idle(rei, t, 646, 0.2); standFeet(rei); rei.position.y = 25.6; olhosK(rei, 1);
      const km = smr(t, K.memorias - 0.3, K.memorias + 0.2) * (1 - smr(t, K.recusou - 0.4, K.recusou)); mem.forEach((m, i) => { const an = t * 0.8 + i * 1.05; m.position.set(Math.sin(an) * 0.8, 1.4 + Math.sin(t * 1.3 + i) * 0.25, -1 + Math.cos(an) * 0.8); m.lookAt(m.position.x * 2, m.position.y, m.position.z * 2 + 1); m.material.opacity = 0.7 * km; });
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([3, 2.2, 12], [2, 1.6, 9], [0, 1.2, 0], [0, 4, -20], 46, 46)],
        [K.tomada - 0.3, mov([12, 14, 22], [10, 12, 18], [0, 4, -20], [0, 6, -26], 46, 46)],
        [K.devorado - 1.2, mov([2.2, 0.5, 2.2], [1.6, 0.45, 1.6], [0, 1.4, -1], [0, 1.5, -1], 46, 40)],
        [K.renasceu - 0.4, mov([1.4, 1.2, 2.2], [1.1, 1.3, 1.7], [0, 0.9, -1], [0, 1.4, -1], 44, 40)],
        [K.memorias - 0.3, (tt, u) => ({ ...closeRosto(ga, lerp(1.4, 1.1, E.inOut(u)), 0.4, 0, 34) })],
        [K.recusou - 0.3, mov([-1.4, 0.6, 2.4], [-1.2, 0.7, 2.0], [0, 3, -20], [0, 12, -36], 44, 40)],
        [K.embora - 0.3, mov([0, 2.4, -6], [0, 2.8, -7], [0, 1.0, 0], [0, 0.9, 3], 44, 44)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 9a · o espelho: o Gon no penhasco olhando o mar; levanta e vai embora atrás do pai
addSet("g9a-gon", (g) => {
  const __n = "g9a-gon"; const [a, b] = T.sc[__n];
  const P = penhascoMar(g); const gon = gonLP(); g.add(gon); const sp = sombraPe(g, gon, 0.8);
  return { ...LUZ_MAR, hand: 0.004,
    update(t) { P.upd(t); restPose(gon); const lev = smr(t, K.embora9 - 0.6, K.embora9 - 0.1);
      if (t < K.mundo9 - 0.3) { gon.position.set(0, 0, -1.55); gon.rotation.y = Math.PI; idle(gon, t, 82, 0.3); sitPose(gon, 1 - lev, { seatY: 0.02, lean: 0.05 }); standFeet(gon); }
      else gait(gon, 6 * smr(t, K.mundo9 - 0.3, b), { from: [0, 0, -1.55], ang: Math.PI / 2, step: 0.5 });
      rostoLP(gon, t, { boca: "sorriso", palpebra: 0.95 }); cabeloVento(gon, t, 0.7, [1, 0, 0.3]); sp(0); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.6, 1.0, 1.4], [0.4, 0.9, 0.8], [0, 0.4, -3], [0, 0.5, -8], 46, 44)],
        [K.espelho - 0.3, mov([1.6, 0.9, -4.5], [1.3, 0.85, -4.0], [0, 0.6, -1.55], [0, 0.6, -1.55], 40, 36)],
        [K.mundo9 - 0.3, mov([-2.5, 2.2, 3.5], [-1.5, 6, 6], [1.5, 0.8, -1.6], [6, 0, -40], 46, 48)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 9b · o pai do Gyro ao lado dele a vida inteira, sem olhar pra ele (canteiro à noite)
addSet("g9b-gyro", (g) => {
  const __n = "g9b-gyro"; const [a, b] = T.sc[__n];
  const C = canteiroObras(g, { noite: true }); const pai = paiG(); g.add(pai); const k = meninoG(0.58); g.add(k);
  return { ...LUZ_OBRA_NOITE, hand: 0.004,
    update(t) { C.upd(t);
      restPose(pai); pai.position.set(-4.6, 0, -2.4); pai.rotation.y = Math.PI / 2 + 0.9; idle(pai, t, 702, 0.25); sitPose(pai, 1, { seatY: 0.42 / 1.04, lean: 0.2 }); standFeet(pai); const gole = Math.max(0, Math.sin(t * 1.4)); maoEm(pai, 1, lerp3v(frenteW(pai, -0.15, 0.85, 0.3), corpoW(pai, "head", 0.02, -0.02, 0.12), gole), 1);
      restPose(k); k.position.set(-4.0, 0, -1.4); k.rotation.y = Math.PI / 2 + 2.4; idle(k, t, 701, 0.25); sitPose(k, 1, { seatY: 0.02, lean: 0.2 }); standFeet(k); pose(k, { neck: [-0.25, -0.5, 0] }, 1); // olha pro pai
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([-1.4, 0.8, 0.6], [-1.8, 0.75, 0.2], [-4.3, 0.6, -1.9], [-4.3, 0.6, -1.9], 40, 36)],
        [K.importou - 0.3, mov([-2.2, 1.6, 1.2], [-1.6, 2.6, 2.4], [-4.3, 0.5, -1.9], [-4.3, 0.5, -1.9], 40, 44)], // afasta e sobe (fora dos barracos)
      ], b); },
  };
});

// ---------------------------------------------------------------- 9c · um aprendeu a amar o mundo: o Gon de braços abertos no penhasco ao sol
addSet("g9c-amar", (g) => {
  const __n = "g9c-amar"; const [a, b] = T.sc[__n];
  const P = penhascoMar(g); const gon = gonLP(); g.add(gon);
  return { ...LUZ_MAR, hand: 0.004,
    update(t) { P.upd(t); vive(gon, t, 82, { boca: "sorriso", palpebra: 0.9 }, 0.3); gon.position.set(0, 0, -1.4); gon.rotation.y = Math.PI * 0.85; const ab = smr(t, a, a + 0.6); pose(gon, { armR: [0, 0, 1.3 * ab, -0.1], armL: [0, 0, -1.3 * ab, -0.1], neck: [-0.25 * ab, 0, 0] }, 1); cabeloVento(gon, t, 0.8, [1, 0, 0.3]); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; } return mov([1.2, 0.35, -3.6], [0.9, 0.4, -3.2], [0, 1.0, -1.4], [0, 1.1, -1.4], 42, 38)(t, seg(t, a, b)); },
  };
});

// ---------------------------------------------------------------- 9d · o outro decidiu se vingar: o Gyro adulto sai das ruínas em chamas, olhos acesos
addSet("g9d-vingar", (g) => {
  const __n = "g9d-vingar"; const [a, b] = T.sc[__n];
  const V = vilaNGL(g, { noite: true, destruida: true }); const gy = gyroLP(); g.add(gy); const sp = sombraPe(g, gy, 1.2);
  return { ...LUZ_FORMIGAS, hand: 0.004,
    update(t) { V.upd(t, 0); restPose(gy); gait(gy, 1.6 * seg(t, a, b), { from: [0, 0, -0.5], ang: 0, step: 0.55 }); olhosK(gy, 1); sp(0); flash(t, K.vingar + 0.2, 0.05, 0.4, [0.4, 0.45, 0.6]); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; } const [a2] = T.sc[__n]; return { ...closeRosto(gy, lerp(1.4, 0.8, E.inOut(seg(t, a2, b))), 0.1, -0.04, 32) }; },
  };
});

// ---------------------------------------------------------------- 10 · hoje: o Welfin procura na Cidade Meteoro; no alto do lixo, olhos acesos; a história em aberto
addSet("g10-fim", (g) => {
  const __n = "g10-fim"; const [a, b] = T.sc[__n];
  const M = cidadeMeteoro(g); const w = formigaSombra({ lobo: true, seed: 612, olho: 0xff6a3a }); g.add(w); const spW = sombraPe(g, w);
  const gy = gyroLP(); g.add(gy); gy.position.set(...M.topo);
  return { ...LUZ_METEORO, hand: 0.004,
    update(t) { M.upd(t);
      restPose(w); gait(w, 3.6 * smr(t, a, K.vivo - 0.3), { from: [-3.0, 0, 6.5], ang: Math.PI * 0.8, step: 0.6 }); // para e olha pro alto do lixo if (t > K.vivo - 0.2 && t < K.meteoro) pose(w, { neck: [-0.4, 0.3, 0] }, smr(t, K.vivo - 0.2, K.vivo + 0.2)); olhosK(w, 1); spW(0);
      restPose(gy); gy.position.set(...M.topo); gy.rotation.y = lerp(0.25, Math.PI, smr(t, K.ultimo10, K.comenta + 0.6)); idle(gy, t, 801, 0.15); standFeet(gy); gy.position.y = M.topo[1];
      olhosK(gy, smr(t, K.vivo - 0.1, K.vivo + 0.3) * (1 - smr(t, K.comenta, K.comenta + 0.8)));
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([-1.0, 1.4, 10.5], [-0.4, 1.2, 9.2], [-2.6, 0.9, 5.5], [-1.4, 1.0, 4.2], 42, 40)],
        [K.vivo - 0.3, mov([-2.6, 1.0, 6.2], [-2.4, 1.05, 5.9], [0, 4.4, -6], [0, 4.5, -6], 40, 34)],
        [K.meteoro - 0.3, mov([6, 8, 14], [10, 12, 20], [0, 2, -10], [0, 3, -20], 48, 50)],
        [K.rosto10 - 0.3, (tt, u) => ({ ...closeRosto(gy, lerp(1.2, 0.85, E.inOut(u)), 0.2, -0.04, 32) })],
        [K.aberto - 0.3, mov([1.2, 4.0, -3.5], [3, 10, 4], [0, 4.2, -6], [0, 3.5, -6], 44, 50)],
        [K.ultimo10 - 0.3, mov([1.4, 3.0, -2.2], [1.6, 3.2, -1.6], [0, 4.2, -6], [0, 4.3, -6], 40, 40)],
      ], b); },
  };
});
