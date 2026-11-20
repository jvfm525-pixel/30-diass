// ================================================================ vídeo: Light · cenas 5–8 (sacrifício, caderno falso, Yellow Box, juntos)

// ---------------------------------------------------------------- 5 · o sacrifício: rua com neve à noite; o Mello leva a Takada no caminhão; depois o cofre do banco
addSet("s5-sacrificio", (g) => {
  const [a, b] = T.sc["s5-sacrificio"];
  const dome = vazio(g, 0x060a14, 0x2a3048, 0x0a0c12, { sunCol: 0xffa060, sunI: 0.1 });
  const neve = mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0xc8d0dc, roughness: 0.9 }), 0, 0, 0, g); neve.rotation.x = -Math.PI / 2;
  const rua = mesh(new THREE.PlaneGeometry(6, 60), new THREE.MeshStandardMaterial({ color: 0x3a3e48, roughness: 0.5 }), 0, 0.005, 0, g); rua.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 6; i++) { const z = -18 + i * 7; [-1, 1].forEach((k) => { mesh(cyl(0.05, 0.07, 4, 6), LPmat(0x2a2c30), k * 3.6, 2, z, g); const l = new THREE.PointLight(0xffa860, 4, 9, 1.6); l.position.set(k * 3.3, 4, z); g.add(l); const s = glowSprite(0xffc080, 1.0, 0.8); s.position.set(k * 3.3, 4.02, z); g.add(s); }); }
  for (let i = 0; i < 10; i++) { const h = 6 + hash(i) * 10; mesh(box(5, h, 5), LPmat(0x1a1c24, { rim: 0.2 }), (i % 2 ? 1 : -1) * 9, h / 2, -20 + Math.floor(i / 2) * 9, g); }
  const flocos = dustPts(500, [-8, 8, 0, 8, -16, 8], 0xffffff, 0.04, 0.85, NORM); g.add(flocos);
  const cam_ = grp(g, 2.7, 0, -2.5); mesh(box(1.9, 1.7, 3.8), LPmat(0x5a6070, { rim: 0.4 }), 0, 1.25, -0.9, cam_); mesh(box(1.9, 1.3, 1.3), LPmat(0x3a4250, { rim: 0.4 }), 0, 1.05, 1.6, cam_); [[-0.8, 1.2], [0.8, 1.2], [-0.8, -2], [0.8, -2]].forEach(([x, z]) => { const r = mesh(cyl(0.32, 0.32, 0.25, 10), LPmat(0x101012), x, 0.32, z, cam_); r.rotation.z = Math.PI / 2; });
  const ml = melloLP(); g.add(ml); ml.position.set(-0.6, 0, -0.5); ml.rotation.y = 0.6;
  const tk = takadaLP(); g.add(tk); tk.position.set(0.15, 0, -0.9); tk.rotation.y = -0.4;
  const papel = mesh(new THREE.PlaneGeometry(0.06, 0.08), new THREE.MeshBasicMaterial({ color: 0xf2efe6, side: THREE.DoubleSide }), 0, 0, 0, g);
  const fogo = fogoLonge(g, 0.8, -3.2, 0.6), fogoOn = { v: 0 };
  // cofre do banco (longe, na mesma cena): porta redonda de aço com o caderno brilhando lá dentro
  const cofre = grp(g, 0, 0, -40); mesh(box(8, 5, 0.4), LPmat(0x4a4e58, { metal: 0.6, rough: 0.4 }), 0, 2.5, -1, cofre);
  const porta = grp(cofre, -1.1, 1.8, -0.75); const disco = mesh(cyl(1.1, 1.1, 0.3, 24), LPmat(0x8a909c, { metal: 0.85, rough: 0.25 }), 1.1, 0, 0, porta); disco.rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) { const r = mesh(box(0.08, 0.6, 0.08), LPmat(0xb0b4bc, { metal: 0.9, rough: 0.2 }), 1.1 + Math.cos(i) * 0.3, Math.sin(i) * 0.3, 0.2, porta); r.rotation.z = i; }
  const cdC = caderno(cofre); cdC.c.position.set(0, 1.4, -1.5); cdC.c.rotation.x = Math.PI / 2 - 0.2; const brilhoC = glowSprite(0xffffff, 1.2, 0); brilhoC.position.set(0, 1.4, -1.4); cofre.add(brilhoC);
  const mk = mikamiLP(); cofre.add(mk); mk.position.set(0.6, 0, 0.8); mk.rotation.y = Math.PI + 0.2;
  const lC = new THREE.PointLight(0xd8e4ff, 6, 8, 1.6); lC.position.set(0, 3, 2); cofre.add(lC);
  return {
    bg: 0x060a14, fog: [8, 40], fogCol: 0x1a2030, dome, hand: 0,
    look: { exposure: 1.2, bloom: 0.6, bloomT: 0.75, vig: 0.5, sat: 1.0, con: 1.05, lift: [0, 0.005, 0.02] },
    sun: { dir: [0.3, 0.8, 0.5], col: 0x9ab0e0, I: 0.7, c: [0, 1, -1], r: 8 }, hemi: { sky: 0x3a4a6a, ground: 0x6a7080, I: 0.6 }, fill: { col: 0xffa860, I: 0.5, dir: [-0.6, 0.4, 0.5] }, rim: { col: 0xffc080, str: 0.9 },
    update(t) {
      chicote(t, a, 0.22, 1);
      floatDust(flocos, t, 0.6, 0.4);
      vive(ml, t, 63, { boca: "linha", bravo: 0.6 }, 0.35); pose(ml, { armR: [-0.9, 0, 0.3, -0.5] }, smr(t, K.sequestrou - 0.3, K.sequestrou));
      vive(tk, t, 65, { boca: t < K.forcou ? "triste" : "linha", triste: 0.5, bravo: smr(t, K.forcou, K.forcou + 0.4) * 0.5 }, 0.3);
      // a Takada escreve num pedaço escondido do caderno; o Mello cai
      const esc = smr(t, K.forcou, K.agir || K.forcou + 0.8); tk.updateMatrixWorld(true); papel.position.copy(tk.userData.wr[1].localToWorld(V3(0, -0.08, 0.04))); papel.visible = esc > 0.05 && t < K.morreu + 0.6; pose(tk, { armL: [-0.9 * esc, 0, -0.2, -1.2 * esc] }, 1);
      const cai = smr(t, K.morreu - 0.2, K.morreu + 0.8); if (cai > 0) { kneelPose(ml, cai); pose(ml, { spine: [0.6 * cai, 0, 0], neck: [0.4 * cai, 0, 0] }, 1); }
      fogo.update(t); fogo.update(t); const f = smr(t, K.morreu + 0.2, K.morreu + 1.2); g.children.forEach(() => {}); fogoOn.v = f;
      // o cofre: a porta abre, o Mikami pega o caderno
      porta.rotation.y = -1.6 * E.inOut(smr(t, K.cofre - 0.8, K.cofre + 0.4));
      brilhoC.material.opacity = 0.5 * smr(t, K.cofre - 0.3, K.cofre + 0.4);
      vive(mk, t, 64, { boca: "linha", bravo: 0.4 }, 0.3); pose(mk, { armR: [-1.2, 0, 0.2, -0.4] }, smr(t, K.verdadeiro, K.cofre));
      cdC.abrir(0);
      flash(t, K.morreu, 0.05, 0.4, [1, 0.6, 0.3]);
    },
    cam(t) {
      return planos(t, [
        [a, mov([1.8, 1.7, 3.6], [1.2, 1.6, 2.8], [-0.2, 1.1, -0.7], [-0.2, 1.2, -0.7], 44, 42)],
        [K.takada - 0.2, (tt, u) => ({ ...closeRosto(tk, lerp(1.0, 0.8, E.inOut(u)), 0.2, 0, 32) })],
        [K.morreu - 0.4, mov([-2.2, 1.0, 1.4], [-1.9, 0.9, 1.2], [-0.5, 0.8, -0.6], [-0.5, 0.6, -0.6], 38, 36)],
        [K.mikami5 - 0.2, (tt, u) => { const k = E.inOut(u); return { pos: [lerp(1.6, 0.9, k), 1.7, -36.2 + k * 0.4], look: [0, 1.6, -41], fov: 40, near: 0.05 }; }],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 6 · o caderno falso: o Near troca as páginas; Yellow Box, ninguém morre
addSet("s6-falso", (g) => {
  const [a, b] = T.sc["s6-falso"];
  const raios_ = galpao(g);
  const nr = nearLP(); g.add(nr); nr.position.set(1.6, 0, 1.2); nr.rotation.y = -1.6;
  const pz = puzzle(g, 22, 0.6); pz.forEach((p) => { p.position.x += 1.0; p.position.z += 1.2; });
  const li = lightLP(); g.add(li); li.position.set(-1.6, 0, 0.6); li.rotation.y = 1.3;
  const cd = caderno(g); cd.c.position.set(3, 0.9, 3.5);
  const paginasF = []; for (let i = 0; i < 8; i++) { const p = mesh(new THREE.PlaneGeometry(0.24, 0.34), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide }), 0, 0, 0, g); p.castShadow = false; paginasF.push(p); }
  const mesa = mesh(box(1.2, 0.06, 0.8), LPmat(0x3a3a40), 3, 0.85, 3.5, g); mesh(box(0.08, 0.85, 0.08), LPmat(0x3a3a40), 3, 0.42, 3.5, g);
  const relo = relogioLuz(g, { R: 0.45, cor: 0xff3a3a }); relo.c.position.set(0, 3.2, -5.6);
  return {
    bg: 0x2a2010, fog: [10, 40], fogCol: 0x3a2c14, hand: 0,
    look: { exposure: 1.15, bloom: 0.55, bloomT: 0.78, vig: 0.5, sat: 1.05, con: 1.06 },
    sun: { dir: [0.15, 1, 0.9], col: 0xffe0a0, I: 2.0, c: [0, 1, 0], r: 8 }, hemi: { sky: 0xd8b860, ground: 0x3a3020, I: 0.7 }, fill: { col: 0xa0b0ff, I: 0.3, dir: [-0.5, 0.3, -0.8] }, rim: { col: 0xffe0a0, str: 0.9 },
    update(t) {
      flash(t, a, 0.001, 0.4);
      // troca das páginas: as reais sobem brilhando e as falsas descem
      cd.abrir(smr(t, K.achou - 0.3, K.achou + 0.3));
      const tr = smr(t, K.trocou - 0.2, K.paginas + 0.8);
      paginasF.forEach((p, i) => { const k = clamp(tr * 1.6 - i * 0.08); p.position.set(3 + Math.sin(i * 1.7) * 0.4 * k, 0.95 + k * (0.6 + i * 0.12), 3.5 + Math.cos(i) * 0.3 * k); p.rotation.set(-1.2 + k * 1.2, i, 0); p.material.opacity = Math.sin(k * Math.PI) * 0.9; });
      vive(nr, t, 62, { boca: "linha" }, 0.2); kneelPose(nr, 1); pose(nr, { spine: [0.3, 0, 0], armR: [-0.8, 0, 0.2, -0.6], handR: 0.6 }, 1);
      vive(li, t, 61, { boca: t < K.ninguem ? "sorriso" : "aberta", bravo: 0.3, sobe: t > K.ninguem ? 0.6 : 0 }, 0.3);
      relo.set(smr(t, K.esperou - 0.2, K.esperou + 0.3), Math.PI * 2 * smr(t, K.esperou, K.ninguem + 0.3), t);
      flash(t, K.ninguem + 0.1, 0.04, 0.35, [1, 0.9, 0.6]);
    },
    cam(t) {
      return planos(t, [
        [a, (tt, u) => ({ ...closeRosto(nr, lerp(1.0, 0.8, E.inOut(u)), 0.2, 0.05, 32) })],
        [K.achou - 0.4, mov([3.3, 1.75, 4.7], [3.2, 1.7, 4.4], [3, 1.0, 3.5], [3, 1.2, 3.5], 40, 38)],
        [K.yellow - 0.3, mov([0, 1.9, 7.4], [0, 1.7, 6.6], [0, 1.0, 0], [0, 1.0, 0], 50, 48)],
        [K.esperou - 0.2, (tt, u) => ({ ...closeRosto(li, lerp(1.1, 0.75, E.inOut(u)), 0.22, 0, 32) })],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 7 · Yellow Box: o Light ri, foge, implora; o Ryuk escreve o nome dele
addSet("s7-fim", (g) => {
  const [a, b] = T.sc["s7-fim"];
  galpao(g);
  const li = lightLP({ kira: true }); g.add(li); li.position.set(0, 0, 0.6);
  const ry = ryukLP(); g.add(ry); ry.position.set(-1.6, 1.4, -1.4); ry.rotation.y = 0.6;
  const cdR = caderno(g); const caneta = mesh(cyl(0.006, 0.006, 0.18, 5), LPmat(0x101012), 0, 0, 0, g);
  const vermelho = new THREE.PointLight(0xff2020, 0, 10, 1.4); vermelho.position.set(0, 3, 1.5); g.add(vermelho);
  return {
    bg: 0x1a1408, fog: [8, 30], fogCol: 0x2a2010, hand: 0,
    look: { exposure: 1.1, bloom: 0.6, bloomT: 0.75, vig: 0.6, sat: 1.05, con: 1.08 },
    sun: { dir: [0.15, 1, 0.9], col: 0xffe0a0, I: 1.6, c: [0, 1, 0], r: 8 }, hemi: { sky: 0xb89848, ground: 0x2a2010, I: 0.6 }, fill: { col: 0xa0b0ff, I: 0.3, dir: [-0.5, 0.3, -0.8] }, rim: { col: 0xffe0a0, str: 0.9 },
    update(t) {
      const rindo = t < K.fugir, foge = smr(t, K.fugir - 0.2, K.implorou), implora = smr(t, K.implorou - 0.2, K.implorou + 0.4);
      vive(li, t, 61, { boca: rindo ? "risada" : t < K.implorou ? "aberta" : "triste", bravo: rindo ? 0.7 : 0, triste: implora * 0.8, fechados: t > K.nome + 0.8 }, 0.4);
      li.position.set(-1.4 * foge, 0, 0.6 + 0.8 * foge); li.rotation.y = -0.9 * foge * (1 - implora);
      if (rindo) pose(li, { spine: [-0.25, 0, 0], neck: [-0.25, 0, 0], armR: [-0.4, 0, 0.6, -0.4], armL: [-0.4, 0, -0.6, -0.4] }, smr(t, a, a + 0.3));
      if (implora > 0) { kneelPose(li, implora); pose(li, { armR: [-1.2 * implora, 0, 0.3, -0.6], armL: [-1.2 * implora, 0, -0.3, -0.6] }, 1); }
      const morre = smr(t, K.nome + 0.4, K.nome + 1.4); if (morre > 0) pose(li, { spine: [0.9 * morre, 0, 0.2 * morre], neck: [0.6 * morre, 0, 0] }, 1);
      vive(ry, t, 66, { boca: "risada" }, 0.3); ry.position.y = 1.4 + Math.sin(t * 1.2) * 0.06;
      if (ry.userData.asas) ry.userData.asas.forEach((w, i) => (w.rotation.z = (i ? 1 : -1) * (0.2 + Math.sin(t * 2.5) * 0.15)));
      const escreve = smr(t, K.ryuk - 0.3, K.escreveu);
      pose(ry, { armR: [-1.0 * escreve, 0, 0.1, -1.5 * escreve], armL: [-0.9 * escreve, 0, -0.1, -1.4 * escreve] }, 1);
      ry.updateMatrixWorld(true); cdR.c.position.copy(ry.userData.chest.localToWorld(V3(0, -0.05, 0.42))); cdR.c.rotation.set(0.5, 0.6, 0); cdR.abrir(escreve); cdR.c.visible = escreve > 0.05;
      caneta.position.copy(ry.userData.wr[0].localToWorld(V3(0, -0.12, 0.03))); caneta.position.x += Math.sin(t * 16) * 0.02; caneta.visible = escreve > 0.3;
      vermelho.intensity = 6 * smr(t, K.nome - 0.2, K.nome + 0.3);
      flash(t, K.nome + 0.1, 0.05, 0.5, [1, 0.3, 0.25]);
      escurece(t, b - 0.6, b, [0, 0, 0], 1);
    },
    cam(t) {
      return planos(t, [
        [a, (tt, u) => ({ ...closeRosto(li, lerp(1.0, 0.7, E.inOut(u)), 0.15, 0.02, 32) })],
        [K.fugir - 0.15, mov([1.8, 1.7, 5.6], [1.4, 1.6, 5.2], [-0.8, 1.2, 0.8], [-1.0, 1.1, 1.0], 48, 48)],
        [K.ryuk - 0.4, (tt, u) => ({ ...closeRosto(ry, lerp(1.4, 1.1, E.inOut(u)), -0.2, -0.1, 34) })],
        [K.prometido - 0.3, mov([1.6, 3.2, 4.6], [1.2, 4.0, 4.0], [-1.2, 0.5, 1.4], [-1.2, 0.4, 1.4], 40, 42)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 8 · juntos: o xadrez — os dois peões derrubam o rei; fecha na escrivaninha do começo
addSet("s8-juntos", (g) => {
  const [a, b] = T.sc["s8-juntos"];
  const Q = quartoLight(g);
  const tb = tabuleiro(g, 0.35); tb.position.set(-0.15, 0.79, -1.55);
  const rei = peca(tb, "rei", 0xe8e0d0), pN = peca(tb, "peao", 0xf4f4f6), pM = peca(tb, "peao", 0x1a1a1e);
  const cd = caderno(g); cd.c.position.set(0.35, 0.79, -1.6); const mc = maca(g, 1.2); mc.position.set(0.62, 0.845, -1.5);
  return {
    bg: 0x05060c, fog: [5, 25], fogCol: 0x0a0c18, hand: 0,
    look: { exposure: 1.15, bloom: 0.55, bloomT: 0.78, vig: 0.6, sat: 1.0, con: 1.06 },
    sun: { dir: [0.4, 0.6, -1], col: 0x6a80c0, I: 0.6, c: [0, 1, -1], r: 4 }, hemi: { sky: 0x3a4060, ground: 0x0a0a10, I: 0.55 }, fill: { col: 0xffc890, I: 0.3, dir: [-0.6, 0.4, 0.4] }, rim: { col: 0xa0b8ff, str: 0.9 },
    update(t) {
      flash(t, a, 0.001, 0.45);
      rei.scale.setScalar(0.35); pN.scale.setScalar(0.35); pM.scale.setScalar(0.35);
      const v1 = smr(t, K.venceu1, K.venceu1 + 0.4), v2 = smr(t, K.venceu2, K.venceu2 + 0.4), jun = E.inOut(smr(t, K.perdeu - 0.2, K.juntos)), cai = E.in(smr(t, K.juntos - 0.1, K.juntos + 0.5));
      rei.position.set(0, 0, 0.05); rei.rotation.z = -1.45 * cai;
      // o rei derruba cada peão sozinho (eles tombam e se levantam); juntos, eles avançam e o rei cai
      pN.position.set(lerp(-0.42, -0.1, jun), 0, lerp(-0.1, 0.0, jun)); pN.rotation.z = 1.2 * Math.sin(v1 * Math.PI) * (1 - jun);
      pM.position.set(lerp(0.42, 0.1, jun), 0, lerp(-0.1, 0.0, jun)); pM.rotation.z = -1.2 * Math.sin(v2 * Math.PI) * (1 - jun);
      cd.abrir(0);
      escurece(t, b - 1.0, b, [0, 0, 0], 1);
    },
    cam(t) {
      return planos(t, [
        [a, mov([-0.85, 1.15, -0.9], [-0.75, 1.08, -1.05], [-0.15, 0.86, -1.55], [-0.15, 0.85, -1.55], 34, 32)],
        [K.juntos + 0.6, mov([0.6, 1.4, -0.4], [0.9, 1.7, 0.2], [0.1, 0.86, -1.55], [0.1, 0.9, -1.6], 36, 38)],
      ], b);
    },
  };
});
