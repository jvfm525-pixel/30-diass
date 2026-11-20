// ================================================================ vídeo: Light · cenas 0–4 (capa, quarto, herdeiros, erro, Discord)

// ---------------------------------------------------------------- 0 · capa: o Light com os olhos do Kira, rindo
addSet("s0-capa", (g) => {
  const Q = quartoLight(g);
  const li = lightLP({ kira: true }); g.add(li); li.position.set(0, 0, -0.4);
  return {
    bg: 0x05060c, fog: [4, 20], fogCol: 0x0a0a14, hand: 0,
    look: { exposure: 1.1, bloom: 0.6, bloomT: 0.75, vig: 0.6, sat: 1.1, con: 1.08 },
    sun: { dir: [-0.4, 0.5, 0.6], col: 0xff4a3a, I: 1.6, c: [0, 1.5, 0], r: 4 }, hemi: { sky: 0x3a2030, ground: 0x0a0408, I: 0.5 }, fill: { col: 0xffd8b0, I: 0.6, dir: [0.4, 0.2, 1] }, rim: { col: 0xff5a40, str: 1.0 },
    update(t) { vive(li, t, 61, { boca: "risada", bravo: 0.7, piscaCada: 99 }, 0.1); },
    cam() { return closeRosto(li, 0.62, 0.12, -0.02, 30); },
  };
});

// ---------------------------------------------------------------- 1 · abertura: quarto do Light à noite; xadrez na mesa; o Ryuk come uma maçã
addSet("s1-abertura", (g) => {
  const [a, b] = T.sc["s1-abertura"];
  const Q = quartoLight(g);
  const li = lightLP(); g.add(li); li.position.set(0, 0, -0.85); li.rotation.y = Math.PI;
  const ry = ryukLP(); g.add(ry); ry.position.set(1.3, 0, -0.4); ry.rotation.y = -2.4;
  const mc = maca(g, 1.2);
  const cd = caderno(g); cd.c.position.set(0.3, 0.79, -1.6);
  const tb = tabuleiro(g, 0.35); tb.position.set(-0.15, 0.79, -1.55);
  const rei = peca(tb, "rei", 0xe8e0d0), pN = peca(tb, "peao", 0xf4f4f6), pM = peca(tb, "peao", 0x1a1a1e);
  return {
    bg: 0x05060c, fog: [5, 25], fogCol: 0x0a0c18, hand: 0,
    look: { exposure: 1.2, bloom: 0.55, bloomT: 0.78, vig: 0.55, sat: 1.0, con: 1.06 },
    sun: { dir: [0.4, 0.6, -1], col: 0x6a80c0, I: 0.6, c: [0, 1, -1], r: 4 }, hemi: { sky: 0x5a6080, ground: 0x0a0a10, I: 0.85 }, fill: { col: 0xffc890, I: 0.8, dir: [-0.8, 0.5, -0.6] }, rim: { col: 0xa0b8ff, str: 0.9 },
    update(t) {
      flash(t, a, 0.001, 0.45);
      vive(li, t, 61, { boca: "linha" }, 0.3); pose(li, { spine: [0.25, 0, 0], armR: [-0.9, 0, 0.1, -1.2], armL: [-0.8, 0, -0.1, -1.3] }, 1);
      vive(ry, t, 66, { boca: "risada" }, 0.3); pose(ry, { spine: [0.2, 0, 0], armR: [-1.3, 0, 0.3, -1.8], handR: 1 }, 1);
      ry.updateMatrixWorld(true); mc.position.copy(ry.userData.wr[0].localToWorld(V3(0, -0.09, 0.03)));
      cd.abrir(1);
      // o rei sozinho; os dois peões entram ao ouvir os nomes e se juntam no "ao mesmo tempo"
      rei.position.set(0, 0, 0.12); rei.scale.setScalar(0.35);
      const n = E.outBack(smr(t, K.near1, K.near1 + 0.4)), m = E.outBack(smr(t, K.mello1, K.mello1 + 0.4)), jun = smr(t, K.dois1, K.dois1 + 0.9);
      pN.scale.setScalar(0.35 * n); pM.scale.setScalar(0.35 * m); pN.visible = n > 0.01; pM.visible = m > 0.01;
      pN.position.set(lerp(-0.45, -0.12, jun), 0, lerp(-0.4, -0.08, jun)); pM.position.set(lerp(0.45, 0.12, jun), 0, lerp(-0.4, -0.08, jun));
      const cai = smr(t, K.tarde, K.tarde + 0.6); rei.rotation.z = -1.4 * E.in(cai);
      escurece(t, b - 0.35, b, [0, 0, 0], 1);
    },
    cam(t) {
      return planos(t, [
        [a, mov([2.4, 1.9, 2.6], [1.6, 1.6, 1.4], [0, 1.0, -1.4], [-0.1, 0.95, -1.5], 38, 36)],
        [K.near1 - 0.2, mov([-0.85, 1.2, -0.9], [-0.75, 1.12, -1.05], [-0.15, 0.84, -1.55], [-0.15, 0.84, -1.6], 34, 32)],
        [K.resposta, (tt, u) => ({ ...closeRosto(ry, lerp(1.6, 1.25, E.inOut(u)), 0.2, -0.05, 34) })],
        [K.tarde - 0.3, mov([-0.85, 1.1, -1.0], [-0.75, 1.02, -1.15], [-0.15, 0.84, -1.5], [-0.15, 0.82, -1.55], 32, 30)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 2 · os herdeiros: sala da Wammy's House em dia de chuva; o L de luz se parte em dois
addSet("s2-herdeiros", (g) => {
  const [a, b] = T.sc["s2-herdeiros"];
  const piso = mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.55 }), 0, 0, 0, g); piso.rotation.x = -Math.PI / 2;
  const par = LPmat(0xb8b0a0, { rim: 0.2, rough: 0.95 }); mesh(box(14, 5, 0.2), par, 0, 2.5, -3, g); mesh(box(0.2, 5, 14), par, -5, 2.5, 2, g); mesh(box(0.2, 5, 14), par, 5, 2.5, 2, g);
  const chuvaJ = canvasTex(256, 256, (c, w, h) => { const g_ = c.createLinearGradient(0, 0, 0, h); g_.addColorStop(0, "#5a6a80"); g_.addColorStop(1, "#8a98a8"); c.fillStyle = g_; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,255,255,.35)"; for (let i = 0; i < 60; i++) { const x = hash(i) * w, y = hash(i * 3) * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4, y + 20); c.stroke(); } });
  [-2.2, 0, 2.2].forEach((x) => { const j = mesh(new THREE.PlaneGeometry(1.4, 2.4), new THREE.MeshBasicMaterial({ map: chuvaJ }), x, 2.3, -2.88, g); j.castShadow = false; mesh(box(1.5, 0.08, 0.1), LPmat(0xf0ece0), x, 1.08, -2.85, g); mesh(box(0.06, 2.4, 0.1), LPmat(0xf0ece0), x, 2.3, -2.85, g); });
  const raios_ = godRays(g, [0, 3.4, -2.8], [0, -0.55, 1], { color: 0xd8e4f0, n: 5, len: 6, w: 1.1, opacity: 0.14, spread: 5 });
  const nr = nearLP(); g.add(nr); nr.position.set(-0.9, 0, 0.3); nr.rotation.y = 0.5;
  const pz = puzzle(g, 26, 0.7); pz.forEach((p) => (p.position.x -= 0.9));
  const ml = melloLP(); g.add(ml); ml.position.set(1.0, 0, -0.1); ml.rotation.y = -0.5;
  const choc = mesh(box(0.05, 0.14, 0.012), LPmat(0x4a2a18), 0, 0, 0, g);
  // o L de luz que se parte: metade branca (Near) e metade preta/dourada (Mello)
  const Lg = grp(g, 0, 2.2, -1.2), Lv = linhaLuz(Lg, [[-0.35, 0.7, 0], [-0.35, -0.6, 0]], { r: 0.03, cor: 0xe8f0ff, seg: 30 }), Lh = linhaLuz(Lg, [[-0.35, -0.6, 0], [0.45, -0.6, 0]], { r: 0.03, cor: 0xffd060, seg: 30 });
  const LT = glowSprite(0xffffff, 2.2, 0); Lg.add(LT);
  return {
    bg: 0x5a6070, fog: [6, 30], fogCol: 0x6a7080, hand: 0,
    look: { exposure: 1.15, bloom: 0.45, bloomT: 0.82, vig: 0.4, sat: 0.9, con: 1.04, lift: [0.01, 0.01, 0.025] },
    sun: { dir: [0, 0.5, -1], col: 0xd8e4f0, I: 1.8, c: [0, 1, 0], r: 6 }, hemi: { sky: 0xc8d4e4, ground: 0x4a4038, I: 0.9 }, fill: { col: 0xffd8b0, I: 0.4, dir: [0.4, 0.3, 1] }, rim: { col: 0xd8e8ff, str: 0.8 },
    update(t) {
      chicote(t, a, 0.22, 1);
      vive(nr, t, 62, { boca: "linha" }, 0.2); kneelPose(nr, 1); pose(nr, { spine: [0.4, 0, 0], neck: [0.3, 0, 0], armR: [-0.9, 0, 0.2, -0.6], handR: 0.6 }, 1);
      vive(ml, t, 63, { boca: "linha", bravo: 0.55 }, 0.35); pose(ml, { armR: [-1.4, 0, 0.35, -1.9], handR: 1 }, 1);
      ml.updateMatrixWorld(true); choc.position.copy(ml.userData.wr[0].localToWorld(V3(0, -0.1, 0.02))); choc.rotation.set(0.3, -0.5, 0.2);
      const ap = smr(t, K.l2 - 0.2, K.herdeiros), sep = E.inOut(smr(t, K.separados - 0.1, K.separados + 0.8));
      Lv.set(ap); Lh.set(ap); LT.material.opacity = 0.2 * ap * (1 - sep);
      Lv.m.position.x = -0.6 * sep; Lh.m.position.set(0.6 * sep, -0.3 * sep, 0);
      flash(t, K.separados + 0.1, 0.05, 0.3, [1, 1, 1]);
    },
    cam(t) {
      return planos(t, [
        [a, mov([0.2, 2.2, 6.4], [0.1, 2.0, 5.6], [0, 1.2, -0.6], [0, 1.4, -0.8], 52, 50)],
        [K.near2 - 0.2, (tt, u) => ({ ...closeRosto(nr, lerp(1.0, 0.8, E.inOut(u)), 0.2, 0.1, 32) })],
        [K.mello2 - 0.2, (tt, u) => ({ ...closeRosto(ml, lerp(1.1, 0.85, E.inOut(u)), -0.18, 0, 32) })],
        [K.separados - 0.3, mov([0, 1.7, 5.6], [0, 1.8, 5.0], [0, 1.4, -0.8], [0, 1.5, -0.8], 52, 50)],
        [K.admitiu - 0.4, (tt, u) => ({ ...closeRosto(nr, lerp(0.9, 0.7, E.inOut(u)), 0.15, 0.08, 30) })],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 3 · o erro: sala de monitores; o Light entrega o caderno ao Mikami, que escreve sozinho
addSet("s3-erro", (g) => {
  const [a, b] = T.sc["s3-erro"];
  const chao = mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x0c0e14, roughness: 0.25, metalness: 0.6 }), 0, 0, 0, g); chao.rotation.x = -Math.PI / 2;
  mesh(box(14, 6, 0.2), LPmat(0x10121a), 0, 3, -3.2, g);
  const telas = paredeTelas(g, 0, -3.05, 6, 4, { y0: 0.9, txts: ["KIRA", "L", "?", "N"], cor: "#7ad0ff" });
  const li = lightLP(); g.add(li); li.position.set(-0.7, 0, 0.2); li.rotation.y = 0.55;
  const mk = mikamiLP(); g.add(mk); mk.position.set(0.9, 0, -0.6); mk.rotation.y = -0.5;
  const cd = caderno(g);
  const caneta = mesh(cyl(0.005, 0.005, 0.14, 5), LPmat(0x101012), 0, 0, 0, g);
  const fio = linhaLuz(g, [[-0.5, 1.6, 0.2], [0.2, 1.9, -0.3], [0.8, 1.5, -0.5]], { curva: true, r: 0.008, cor: 0xff3030, seg: 40 });
  const telaVerm = new THREE.Color(0xff3030);
  return {
    bg: 0x04060a, fog: [6, 26], fogCol: 0x06080e, hand: 0,
    look: { exposure: 1.15, bloom: 0.7, bloomT: 0.7, vig: 0.55, sat: 1.05, con: 1.06 },
    sun: { dir: [0, 0.3, -1], col: 0x7ad0ff, I: 1.4, c: [0, 1, -1], r: 6 }, hemi: { sky: 0x2a4a6a, ground: 0x040608, I: 0.5 }, fill: { col: 0xffc8a0, I: 0.4, dir: [0.5, 0.4, 1] }, rim: { col: 0x7ad0ff, str: 1.1 },
    update(t) {
      flash(t, a, 0.001, 0.4);
      vive(li, t, 61, { boca: t < K.confiou ? "linha" : "sorriso", bravo: 0.2 }, 0.3);
      const entrega = smr(t, K.caderno3 - 0.6, K.caderno3) * (1 - smr(t, K.mikami3 + 0.6, K.mikami3 + 1.0));
      if (entrega > 0) pose(li, { armR: [-1.2 * entrega, 0.4, 0.2, -0.3], handR: 0.5 }, 1);
      vive(mk, t, 64, { boca: "linha", bravo: 0.5 }, 0.3);
      const escreve = smr(t, K.sozinho - 0.6, K.sozinho);
      pose(mk, { spine: [0.35 * escreve, 0, 0], armR: [-0.9 * escreve, 0, 0.1, -1.4 * escreve], armL: [-0.7 * escreve, 0, -0.1, -1.4 * escreve] }, 1);
      li.updateMatrixWorld(true); mk.updateMatrixWorld(true);
      const pL = li.userData.wr[0].localToWorld(V3(0, -0.1, 0.04)), pM = mk.userData.chest.localToWorld(V3(0, 0.0, 0.35));
      const vai = smr(t, K.caderno3, K.mikami3 + 0.6);
      cd.c.position.lerpVectors(pL, pM, E.inOut(vai)); cd.c.rotation.set(-0.4 * (1 - escreve), -0.5, 0); cd.abrir(escreve);
      const mao = mk.userData.wr[0].localToWorld(V3(0, -0.1, 0.02)); caneta.position.copy(mao); caneta.position.x += Math.sin(t * 14) * 0.02 * escreve; caneta.rotation.set(0.5, 0, 0.3); caneta.visible = escreve > 0.2;
      fio.set(smr(t, K.plano - 0.3, K.plano + 0.4)); fio.m.material.opacity = 0.6 + 0.4 * Math.sin(t * 20) * smr(t, K.controlava, K.controlava + 0.3);
      const ver = smr(t, K.controlava - 0.2, K.controlava + 0.5); telas.forEach((s, i) => { s.material.emissive.setRGB(1, 1, 1).lerp(telaVerm, ver * (hash(i) > 0.3 ? 1 : 0.4)); s.material.emissiveIntensity = 1.1 + 0.3 * noise1(t * 3 + i); });
    },
    cam(t) {
      return planos(t, [
        [a, mov([0.4, 1.7, 4.4], [0.1, 1.6, 3.6], [0, 1.6, -1.2], [0, 1.5, -1.0], 40, 38)],
        [K.confiou - 0.2, (tt, u) => ({ ...closeRosto(li, lerp(1.0, 0.75, E.inOut(u)), 0.2, 0, 32) })],
        [K.caderno3 - 0.3, mov([0.1, 1.35, 1.9], [0.15, 1.3, 1.6], [0.1, 1.2, -0.2], [0.3, 1.2, -0.4], 38, 36)],
        [K.sozinho - 0.4, (tt, u) => ({ ...closeRosto(mk, lerp(1.0, 0.8, E.inOut(u)), -0.25, 0.05, 32) })],
        [K.plano - 0.2, mov([2.6, 2.4, 3.4], [1.6, 2.0, 3.0], [0.1, 1.4, -0.4], [0.1, 1.5, -0.5], 40, 38)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 4 · Discord: biblioteca dourada; o baú se abre com keys, itens e a claquete
addSet("s4-keys", (g) => {
  const [a, b] = T.sc["s4-keys"];
  const tb = texPlanks([120, 82, 50], [96, 64, 38]), piso = new THREE.MeshStandardMaterial({ map: rep(tb.map.clone(), 4, 4), roughness: 0.6 }); piso.map.needsUpdate = true;
  mesh(new THREE.PlaneGeometry(20, 20), piso, 0, 0, 0, g).rotation.x = -Math.PI / 2;
  const mad = LPmat(0x5a3220, { rim: 0.4 });
  [-1, 1].forEach((k) => { mesh(box(0.3, 4, 3.4), mad, k * 2.6, 2, -1.6, g); for (let s = 0; s < 6; s++) for (let i = 0; i < 14; i++) { const l = mesh(box(0.22, 0.42 + hash(i + s * 9) * 0.12, 0.08), LPmat([0x8a2a2a, 0x2a4a7a, 0x3a6a3a, 0xc8a050][(i + s) % 4], { rim: 0.4 }), k * 2.42, 0.4 + s * 0.6, -3.1 + i * 0.22, g); l.rotation.y = Math.PI / 2; } });
  mesh(box(5.6, 4, 0.3), mad, 0, 2, -3.3, g);
  const cx = grp(g, 0, 0, -0.6), gm = GOLDM(), ped = LPmat(0x3a2418, { rim: 0.5 });
  mesh(box(1.3, 0.62, 0.8), ped, 0, 0.31, 0, cx); [-0.5, 0.5].forEach((x) => mesh(box(0.08, 0.64, 0.82), gm, x, 0.31, 0, cx));
  const lid = grp(cx, 0, 0.62, -0.4); mesh(box(1.3, 0.16, 0.8), ped, 0, 0.08, 0.4, lid); [-0.5, 0.5].forEach((x) => mesh(box(0.08, 0.18, 0.82), gm, x, 0.08, 0.4, lid));
  const brilho = glowSprite(0xffd890, 2.0, 0); brilho.position.set(0, 0.9, -0.6); g.add(brilho); const luz = new THREE.PointLight(0xffc070, 0, 6, 1.6); luz.position.set(0, 1.2, -0.4); g.add(luz);
  const cards = []; for (let i = 0; i < 10; i++) { const c = mesh(box(0.34, 0.21, 0.01), new THREE.MeshStandardMaterial({ map: keyTex, emissive: 0xffffff, emissiveMap: keyTex, emissiveIntensity: 0.5 }), 0, 0, 0, g); c.castShadow = false; cards.push(c); }
  const itens = []; for (let i = 0; i < 6; i++) { const it = mesh(i % 2 ? new THREE.OctahedronGeometry(0.09, 0) : new THREE.BoxGeometry(0.14, 0.14, 0.14), new THREE.MeshStandardMaterial({ color: [0x7ae0ff, 0xff7ad8, 0xffd060][i % 3], emissive: [0x2a8aff, 0xff2a9a, 0xffa020][i % 3], emissiveIntensity: 0.9 }), 0, 0, 0, g); it.castShadow = false; itens.push(it); }
  const claq = mesh(box(0.42, 0.32, 0.02), new THREE.MeshStandardMaterial({ map: claqTex, emissive: 0xffffff, emissiveMap: claqTex, emissiveIntensity: 0.35 }), 0, 0, 0, g);
  const ry = ryukLP(); g.add(ry); ry.position.set(1.2, 0, -1.1); ry.rotation.y = -0.5;
  const tA = K.discord - 0.2;
  return {
    bg: 0x1a0e04, fog: [6, 30], fogCol: 0x2a1808, hand: 0,
    look: { exposure: 1.15, bloom: 0.7, bloomT: 0.72, vig: 0.5, sat: 1.1, con: 1.05 },
    sun: { dir: [-0.4, 0.8, 0.5], col: 0xffd8a0, I: 1.6, c: [0, 1, -1], r: 5 }, hemi: { sky: 0xa07040, ground: 0x2a1408, I: 0.6 }, fill: { col: 0xffb060, I: 0.6, dir: [0.5, 0.3, 0.8] }, rim: { col: 0xffd080, str: 0.8 },
    update(t) {
      chicote(t, a, 0.22, -1); chicote(t, b, 0.22, 1);
      const ab = E.outBack(smr(t, tA, tA + 0.6)); lid.rotation.x = -1.9 * ab; brilho.material.opacity = 0.6 * ab; luz.intensity = 5 * ab;
      const lt = t - tA;
      cards.forEach((c, i) => { const up = smr(t, tA + 0.1 + i * 0.05, K.keys + 0.6), an = (i / 10) * Math.PI * 2 + lt * 0.8, r = 0.15 + up * (0.55 + (i % 3) * 0.12); c.position.set(Math.cos(an) * r, 0.7 + up * (0.5 + (i % 4) * 0.16), -0.6 + Math.sin(an) * r * 0.6); c.rotation.set(Math.sin(lt + i) * 0.4, an + Math.PI / 2, 0.2); c.visible = up > 0.01; });
      itens.forEach((it, i) => { const up = smr(t, K.itens - 0.4 + i * 0.06, K.itens + 0.5), an = (i / 6) * Math.PI * 2 - lt * 0.9, r = up * 0.75; it.position.set(Math.cos(an) * r, 0.7 + up * (1.15 + (i % 2) * 0.15), -0.6 + Math.sin(an) * r * 0.6); it.rotation.set(lt * 2, lt * 1.5 + i, 0); it.visible = up > 0.01; });
      const uc = E.outBack(smr(t, K.ensino - 0.3, K.ensino + 0.4)); claq.position.set(0, 0.7 + uc * 1.35, -0.35); claq.rotation.set(0, Math.sin(lt * 1.2) * 0.25, 0); claq.scale.setScalar(Math.max(0.001, uc * 1.3)); claq.visible = uc > 0.01;
      vive(ry, t, 66, { boca: "risada" }, 0.35);
    },
    cam(t) { return { ...path2(t, [[a, [2.2, 1.6, 3.2], [0.1, 1.1, -0.7], 36], [K.itens, [1.5, 1.6, 2.5], [0.1, 1.4, -0.6], 34], [b, [1.1, 1.65, 2.1], [0.2, 1.5, -0.7], 32]]), near: 0.03 }; },
  };
});
