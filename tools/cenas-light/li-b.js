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
  const ml = melloLP(); g.add(ml);
  const tk = takadaLP(); g.add(tk); tk.position.set(0.15, 0, -0.9); tk.rotation.y = -0.75;
  const penT = naMao(tk, 0, caneta(0xd8c8a0), { dx: 0.006, dy: -0.075, rot: [1.2, 0, 0] });
  const mFrom = [-1.6, 0, 0.5], mAng = 2.26, mD = 1.49, mL = gaitFit(mD, 0.5);
  const papel = mesh(new THREE.PlaneGeometry(0.06, 0.08), new THREE.MeshBasicMaterial({ color: 0xf2efe6, side: THREE.DoubleSide }), 0, 0, 0, g);
  const fogo = fogoLonge(g, 0.8, -3.2, 0.6), fogoOn = { v: 0 };
  // cofre do banco (longe, na mesma cena): porta redonda de aço com o caderno brilhando lá dentro
  const cofre = grp(g, 0, 0, -40); mesh(box(8, 5, 0.4), LPmat(0x4a4e58, { metal: 0.6, rough: 0.4 }), 0, 2.5, -1, cofre);
  const porta = grp(cofre, -1.1, 1.8, -0.75); const disco = mesh(cyl(1.1, 1.1, 0.3, 24), LPmat(0x8a909c, { metal: 0.85, rough: 0.25 }), 1.1, 0, 0, porta); disco.rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) { const r = mesh(box(0.08, 0.6, 0.08), LPmat(0xb0b4bc, { metal: 0.9, rough: 0.2 }), 1.1 + Math.cos(i) * 0.3, Math.sin(i) * 0.3, 0.2, porta); r.rotation.z = i; }
  mesh(cyl(0.95, 0.95, 0.04, 24), LPmat(0x08080a), 0, 1.8, -0.79, cofre).rotation.x = Math.PI / 2; mesh(box(0.7, 0.04, 0.32), LPmat(0x6a6e78, { metal: 0.7 }), 0, 1.42, -0.66, cofre);
  const cdC = caderno(cofre); cdC.c.position.set(0, 1.45, -0.66); const brilhoC = glowSprite(0xffffff, 1.2, 0); brilhoC.position.set(0, 1.6, -0.6); cofre.add(brilhoC);
  const mk = mikamiLP(); g.add(mk);
  const kFrom = [0.4, 0, -37.6], kD = 2.55, kL = gaitFit(kD, 0.5), kAng = Math.PI + 0.1;
  const lC = new THREE.PointLight(0xd8e4ff, 6, 8, 1.6); lC.position.set(0, 3, 2); cofre.add(lC);
  return {
    bg: 0x060a14, fog: [8, 40], fogCol: 0x1a2030, dome, hand: 0,
    look: { exposure: 1.2, bloom: 0.6, bloomT: 0.75, vig: 0.5, sat: 1.0, con: 1.05, lift: [0, 0.005, 0.02] },
    sun: { dir: [0.3, 0.8, 0.5], col: 0x9ab0e0, I: 0.7, c: [0, 1, -1], r: 8 }, hemi: { sky: 0x3a4a6a, ground: 0x6a7080, I: 0.6 }, fill: { col: 0xffa860, I: 0.5, dir: [-0.6, 0.4, 0.5] }, rim: { col: 0xffc080, str: 0.9 },
    update(t) {
      chicote(t, a, 0.22, 1);
      floatDust(flocos, t, 0.6, 0.4);
      // a Takada escreve escondida num pedaço do caderno (a esquerda segura o papel na cintura)
      const esc = smr(t, K.forcou - 0.3, K.forcou + 0.2) * (1 - smr(t, K.morreu + 0.4, K.morreu + 1.0));
      vive(tk, t, 65, { boca: t < K.forcou ? "triste" : "linha", triste: 0.5 * (1 - esc), bravo: esc * 0.6 }, 0.3);
      if (act(t, K.sequestrou + 0.1, K.sequestrou + 0.6) * (1 - smr(t, K.morreu - 0.3, K.morreu)) > 0.3) pose(tk, { spine: [0, 0.15, 0], neck: [0, -0.3, 0] }, 1);
      const papelP = frenteW(tk, -0.04, 0.95, 0.22);
      maoEm(tk, 1, papelP.clone().add(V3(0, -0.02, 0)), esc, { abre: 0.4, poleY: 0.2, poleZ: -0.2 }); pose(tk, { handL: 0.6 * esc, handR: 0.85 }, 1);
      maoEm(tk, 0, papelP.clone().add(frenteW(tk, 0.04 + Math.sin(t * 11) * 0.02, 0, 0.02).sub(tk.position)).add(V3(0, 0.07, 0)), esc, { abre: 0.5, poleY: 0.2, poleZ: -0.2 });
      papel.position.copy(papelP); papel.rotation.set(-1.1, tk.rotation.y, 0, "YXZ"); papel.visible = esc > 0.05; penT.visible = esc > 0.05;
      // o Mello entra andando e agarra o braço da Takada
      const cai = E.inOut(smr(t, K.morreu - 0.1, K.morreu + 0.6)), tomba = E.in(smr(t, K.morreu + 0.5, K.morreu + 1.3));
      restPose(ml); idle(ml, t, 63, 0.3); gait(ml, mD * E.inOut(smr(t, K.mello5 - 0.6, K.sequestrou + 0.3)), { from: mFrom, ang: mAng, step: mL }); ml.rotation.y -= 1.0 * cai;
      rostoLP(ml, t, { boca: cai > 0.2 ? "aberta" : "linha", bravo: 0.6 * (1 - cai), triste: cai * 0.6, fechados: tomba > 0.6 });
      const agarra = act(t, K.sequestrou + 0.1, K.sequestrou + 0.6) * (1 - smr(t, K.morreu - 0.3, K.morreu));
      maoEm(ml, 0, tk.userData.sh[1].localToWorld(V3(0.03, -0.1, 0.02)), clamp(agarra), { abre: 0.5, poleY: 0.1, poleZ: -0.3 }); pose(ml, { handR: 0.3 + 0.6 * clamp(agarra) }, 1);
      // o Mello morre: leva as mãos ao peito, cai de joelhos e tomba
      if (cai > 0) { kneelPose(ml, cai); pose(ml, { armR: [-0.5, 0, 0.1, -0.3], armL: [-0.5, 0, -0.1, -0.3] }, cai); maoEm(ml, 0, corpoW(ml, "chest", 0.0, 0.18, 0.16), cai * (1 - tomba)); maoEm(ml, 1, corpoW(ml, "chest", 0.05, 0.14, 0.16), cai * (1 - tomba)); pose(ml, { handR: 0.9, handL: 0.9, spine: [0.35 + 0.5 * tomba, 0, 0.25 * tomba], neck: [0.3 + 0.4 * tomba, 0, 0] }, 1); ml.rotation.z = 0; }
      fogo.update(t); fogoOn.v = smr(t, K.morreu + 0.2, K.morreu + 1.2);
      // o cofre: a porta abre; o Mikami anda até lá e tira o caderno da prateleira
      porta.rotation.y = -1.6 * E.inOut(smr(t, K.mikami5 + 0.2, K.mikami5 + 1.4));
      brilhoC.material.opacity = 0.5 * smr(t, K.mikami5 + 0.6, K.mikami5 + 1.4) * (1 - smr(t, K.cofre, K.cofre + 0.5));
      restPose(mk); idle(mk, t, 64, 0.25); gait(mk, kD * E.inOut(smr(t, K.verdadeiro - 0.1, K.cofre - 0.2)), { from: kFrom, ang: kAng, step: kL }); rostoLP(mk, t, { boca: "linha", bravo: 0.4 });
      const alcanca = act(t, K.cofre - 0.3, K.cofre + 0.3), puxa = E.inOut(smr(t, K.cofre + 0.3, K.cofre + 0.85));
      const cdW = V3(0, 1.47, -40.66), segura = mixV(cdW, frenteW(mk, 0.1, 1.05, 0.3), puxa);
      maoEm(mk, 0, segura.clone().add(V3(0.1, 0.03, 0.05)), clamp(alcanca), { abre: 0.5, poleY: 0.0, poleZ: -0.3 }); pose(mk, { handR: 0.4 + 0.5 * puxa }, 1);
      cdC.c.position.copy(cofre.worldToLocal(segura.clone())); cdC.c.rotation.set(-0.5 * puxa, 0, 0);
      cdC.abrir(0);
      flash(t, K.morreu, 0.05, 0.4, [1, 0.6, 0.3]);
    },
    cam(t) {
      return planos(t, [
        [a, mov([1.8, 1.7, 3.6], [1.2, 1.6, 2.8], [-0.2, 1.1, -0.7], [-0.2, 1.2, -0.7], 44, 42)],
        [K.takada - 0.2, (tt, u) => ({ ...closeRosto(tk, lerp(1.0, 0.8, E.inOut(u)), 0.2, 0, 32) })],
        [K.forcou - 0.2, mov([0.85, 1.2, 0.2], [0.75, 1.15, 0.05], [0.0, 1.0, -0.8], [0.0, 0.98, -0.8], 34, 32)],
        [K.morreu - 0.4, mov([1.3, 1.25, 1.75], [1.1, 1.05, 1.5], [-0.4, 0.85, -0.5], [-0.45, 0.6, -0.5], 40, 38)],
        [K.mikami5 - 0.2, (tt, u) => { const k = E.inOut(u); return { pos: [lerp(2.0, 1.6, k), lerp(1.65, 1.55, k), lerp(-37.2, -38.2, k)], look: [lerp(-0.1, -0.2, k), 1.35, -40.3], fov: 42, near: 0.05 }; }],
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
  const cd = caderno(g); cd.c.position.copy(frenteW(nr, 0, 0.0, 0.36)); cd.c.rotation.y = nr.rotation.y;
  const CP = cd.c.position.clone();
  const paginasF = []; for (let i = 0; i < 8; i++) { const p = mesh(new THREE.PlaneGeometry(0.24, 0.34), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide }), 0, 0, 0, g); p.castShadow = false; paginasF.push(p); }
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
      paginasF.forEach((p, i) => { const k = clamp(tr * 1.6 - i * 0.08); p.position.set(CP.x + Math.sin(i * 1.7) * 0.4 * k, 0.06 + k * (0.6 + i * 0.12), CP.z + Math.cos(i) * 0.3 * k); p.rotation.set(-1.2 + k * 1.2, i, 0); p.material.opacity = Math.sin(k * Math.PI) * 0.55; });
      vive(nr, t, 62, { boca: "linha" }, 0.2); kneelPose(nr, 1); pose(nr, { spine: [0.85, 0, 0], neck: [0.2, 0, 0], handR: 0.4, handL: 0.5 }, 1);
      // as mãos do Near no caderno: a esquerda segura a borda, a direita vira e arranca as páginas
      const vir = Math.sin(clamp((t - K.trocou + 0.4) / 0.7) * Math.PI) * (t < K.paginas + 0.8 ? 1 : 0);
      maoEm(nr, 1, cd.c.localToWorld(V3(-0.1, 0.04, 0.12)), 1, { abre: 0.6, poleY: 0.3, poleZ: 0.2 });
      maoEm(nr, 0, cd.c.localToWorld(V3(0.08, 0.04 + 0.15 * vir, -0.02)), 1, { abre: 0.6, poleY: 0.3, poleZ: 0.2 });
      vive(li, t, 61, { boca: t < K.ninguem ? "sorriso" : "aberta", bravo: 0.3, sobe: t > K.ninguem ? 0.6 : 0 }, 0.3);
      relo.set(smr(t, K.esperou - 0.2, K.esperou + 0.3), Math.PI * 2 * smr(t, K.esperou, K.ninguem + 0.3), t);
      flash(t, K.ninguem + 0.1, 0.04, 0.35, [1, 0.9, 0.6]);
    },
    cam(t) {
      return planos(t, [
        [a, (tt, u) => ({ ...closeRosto(nr, lerp(1.0, 0.8, E.inOut(u)), 0.2, 0.05, 32) })],
        [K.achou - 0.4, (tt, u) => { const k = E.inOut(u), f = frenteW(nr, -0.45, 0.85, lerp(1.95, 1.7, k)), e = olhosW(nr); return { pos: [f.x, f.y, f.z], look: [lerp(CP.x, e.x, 0.5), lerp(0.05, e.y, 0.6), lerp(CP.z, e.z, 0.5)], fov: 40, near: 0.03 }; }],
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
  const cdR = caderno(g); const penR = naMao(ry, 0, caneta(), { dx: 0.006, dy: -0.075, rot: [1.2, 0, 0] });
  const lD = 1.6, lL = gaitFit(lD, 0.8, 1), lAng = -1.9;
  const luzCd = new THREE.PointLight(0xfff0d0, 0, 2, 1.5); g.add(luzCd);
  const vermelho = new THREE.PointLight(0xff2020, 0, 10, 1.4); vermelho.position.set(0, 3, 1.5); g.add(vermelho);
  return {
    bg: 0x1a1408, fog: [8, 30], fogCol: 0x2a2010, hand: 0,
    look: { exposure: 1.1, bloom: 0.6, bloomT: 0.75, vig: 0.6, sat: 1.05, con: 1.08 },
    sun: { dir: [0.15, 1, 0.9], col: 0xffe0a0, I: 1.6, c: [0, 1, 0], r: 8 }, hemi: { sky: 0xb89848, ground: 0x2a2010, I: 0.6 }, fill: { col: 0xa0b0ff, I: 0.3, dir: [-0.5, 0.3, -0.8] }, rim: { col: 0xffe0a0, str: 0.9 },
    update(t) {
      // o Light gargalha, corre, tropeça de joelhos e implora com as mãos juntas; morre e tomba de lado
      const rk = smr(t, K.riu - 0.4, K.riu) * (1 - smr(t, K.fugir - 0.3, K.fugir)), corre = smr(t, K.fugir - 0.15, K.implorou + 0.1), implora = E.outBack(smr(t, K.implorou, K.implorou + 0.45));
      const morre = E.inOut(smr(t, K.nome + 0.3, K.nome + 1.1)), tomba = E.in(smr(t, K.nome + 0.9, K.nome + 1.6));
      restPose(li); idle(li, t, 61, 0.3);
      gait(li, lD * corre, { from: [0, 0, 0.6], ang: lAng, step: lL, run: 1 - implora });
      li.rotation.y = lerp(lAng, 0.5, smr(t, K.implorou + 0.1, K.implorou + 0.7));
      riso(li, t, rk, K.riu);
      rostoLP(li, t, { boca: rk > 0.3 ? "risada" : t < K.implorou ? "aberta" : "triste", bravo: rk * 0.7, triste: implora * 0.8, sobe: implora * 0.5, fechados: t > K.nome + 0.9 });
      if (rk > 0.01) pose(li, { armR: [-0.3, 0, 0.7, -0.5], armL: [-0.3, 0, -0.7, -0.5], handR: 0.1, handL: 0.1 }, rk);
      if (implora > 0) { kneelPose(li, clamp(implora)); const junta = frenteW(li, 0, 0.98 - 0.3 * morre, 0.3); maoEm(li, 0, junta.clone().add(frenteW(li, 0.035, 0, 0).sub(li.position)), clamp(implora) * (1 - morre), { abre: 0.4, poleY: -0.2, poleZ: 0 }); maoEm(li, 1, junta.clone().add(frenteW(li, -0.035, 0, 0).sub(li.position)), clamp(implora) * (1 - morre), { abre: 0.4, poleY: -0.2, poleZ: 0 }); pose(li, { handR: 0.6, handL: 0.6, neck: [-0.25 * (1 - morre), 0, 0] }, 1); }
      if (morre > 0) { pose(li, { spine: [0.9 * morre, 0, 0.2 * morre], neck: [0.6 * morre, 0, 0], armR: [0.1, 0, 0.1, -0.2], armL: [0.1, 0, -0.1, -0.2], handR: 0.3, handL: 0.3 }, morre); li.rotation.z = -1.25 * tomba; li.position.y = 0.06 * tomba; }
      // o Ryuk flutua: a esquerda segura o caderno aberto, a direita escreve o nome
      vive(ry, t, 66, { boca: "risada" }, 0.3); ry.position.y = 1.4 + Math.sin(t * 1.2) * 0.06;
      if (ry.userData.asas) ry.userData.asas.forEach((w, i) => (w.rotation.z = (i ? 1 : -1) * (0.2 + Math.sin(t * 2.5) * 0.15)));
      const tira = smr(t, K.ryuk - 0.5, K.ryuk), escreve = smr(t, K.ryuk, K.escreveu);
      ry.updateMatrixWorld(true);
      cdR.c.position.copy(frenteW(ry, -0.04, 1.05, 0.34)); cdR.c.rotation.set(-0.12, ry.rotation.y, 0, "YXZ"); cdR.abrir(escreve); cdR.c.visible = tira > 0.05; cdR.c.scale.setScalar(Math.max(0.01, tira) * 1.3); luzCd.position.copy(cdR.c.localToWorld(V3(0, 0.45, -0.2))); luzCd.intensity = 0.7 * escreve;
      maoEm(ry, 1, cdR.c.localToWorld(V3(-0.12, 0, 0.05)), tira, { abre: 0.6, poleY: 0.0, poleZ: -0.3 });
      const pt = cdR.c.localToWorld(V3(0.04 + Math.sin(t * 12) * 0.045, 0.1, ((t * 0.5) % 1) * 0.16 - 0.08));
      maoEm(ry, 0, pt, escreve * (1 - smr(t, K.nome + 0.2, K.nome + 0.6)), { abre: 0.6, poleY: 0.0, poleZ: -0.3 }); pose(ry, { handL: 0.7 * tira, handR: 0.85, neck: [0.35 * escreve, 0, 0] }, 1);
      penR.visible = tira > 0.3;
      vermelho.intensity = 6 * smr(t, K.nome - 0.2, K.nome + 0.3);
      flash(t, K.nome + 0.1, 0.05, 0.5, [1, 0.3, 0.25]);
      escurece(t, b - 0.6, b, [0, 0, 0], 1);
    },
    cam(t) {
      return planos(t, [
        [a, (tt, u) => ({ ...closeRosto(li, lerp(1.0, 0.7, E.inOut(u)), 0.15, 0.02, 32) })],
        [K.fugir - 0.15, mov([1.8, 1.7, 5.6], [1.4, 1.6, 5.2], [-0.8, 1.2, 0.8], [-1.0, 1.1, 1.0], 48, 48)],
        [K.ryuk - 0.4, (tt, u) => { const e = olhosW(ry), c = cdR.c.position, f = frenteW(ry, 0.35, 1.5, lerp(1.7, 1.4, E.inOut(u))); return { pos: [f.x, f.y, f.z], look: [lerp(e.x, c.x, 0.55), lerp(e.y, c.y, 0.6), lerp(e.z, c.z, 0.55)], fov: 38, near: 0.03 }; }],
        [K.prometido - 0.3, (tt, u) => { const h = corpoW(li, "chest", 0, 0, 0), k = E.inOut(u); return { pos: [h.x + lerp(1.4, 1.0, k), lerp(2.6, 3.3, k), h.z + lerp(2.4, 1.8, k)], look: [h.x, h.y * 0.5, h.z], fov: 40, near: 0.05 }; }],
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
