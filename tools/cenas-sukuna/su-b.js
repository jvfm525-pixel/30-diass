// ================================================================ vídeo: Sukuna · cenas 6–9 (pacto, banho, manual, chave)
const frente = (p) => V3(Math.sin(p.rotation.y), 0, Math.cos(p.rotation.y));
const ladoEsq = (p) => V3(Math.cos(p.rotation.y), 0, -Math.sin(p.rotation.y));

// ---------------------------------------------------------------- 6 · o pacto: pôr do sol laranja e roxo; a boca na bochecha, o relógio de 1 minuto, o orbe que muda de corpo
addSet("s6-pacto", (g) => {
  const [a, b] = T.sc["s6-pacto"];
  const dome = skyDome(g, { top: 0x2a1a48, mid: 0x9a4a6a, hor: 0xffa060, ground: 0x2a1a20, exp: 0.6, sunDir: [-0.55, 0.06, -1], sunCol: 0xffb060, sunI: 0.9, disk: 1.8, cov: 0.4, cloudA: 0.45, cloudLit: 0xffc890, cloudSh: 0x6a3a5a, midY: 0.1 });
  const tb = texBlocks([170, 130, 110], [130, 96, 84]), piso = new THREE.MeshStandardMaterial({ map: rep(tb.map.clone(), 30, 30), normalMap: rep(tb.normalMap.clone(), 30, 30), roughness: 0.5, metalness: 0.15 }); piso.map.needsUpdate = piso.normalMap.needsUpdate = true;
  mesh(new THREE.PlaneGeometry(200, 200), piso, 0, 0, 0, g).rotation.x = -Math.PI / 2;
  const yu = yujiLP(), sk = sukunaYujiLP(); [yu, sk].forEach((p) => { g.add(p); p.position.set(-0.55, 0, 0); p.rotation.y = Math.PI / 2; });
  const mg = megumiLP(), smg = sukunaMegumiLP(); [mg, smg].forEach((p) => { g.add(p); p.position.set(0.6, 0, 0); p.rotation.y = -Math.PI / 2; });
  const boca = bocaBochecha(yu, 1);
  const rl = relogioLuz(g, { R: 0.38 }); rl.c.position.set(-0.55, 2.35, -0.45);
  const ry = raios(g, [-0.55, 3.4, -0.2], [-0.55, 1.85, 0], { seed: 3, cor: 0xff6a6a, galhos: 5 }), ry2 = raios(g, [-1.4, 3.0, 0.4], [-0.6, 1.8, 0.05], { seed: 9, cor: 0xffb0b0, galhos: 3 });
  const orb = orbe(g, 0xff2a2a, 0.32);
  const poeira = dustPts(140, [-5, 5, 0.1, 3, -6, 4], 0xffc890, 0.025, 0.6); g.add(poeira);
  const tX = K.arrancado, tF = K.cortou, tE = K.engolir, tT = K.trocou;
  return {
    bg: 0x2a1a30, fog: [12, 90], fogCol: 0x6a3a50, dome, hand: 0,
    look: { exposure: 1.1, bloom: 0.55, bloomT: 0.8, vig: 0.45, sat: 1.12, con: 1.05 },
    sun: { dir: [-0.55, 0.3, -1], col: 0xffb070, I: 2.4, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x8a5a8a, ground: 0x3a2018, I: 0.7 }, fill: { col: 0xffd0b8, I: 0.9, dir: [0.4, 0.4, 1] }, rim: { col: 0xffc080, str: 1.0 },
    update(t) {
      chicote(t, a, 0.22, 1);
      const sukOn = t >= tX && t < tT + 0.15; yu.visible = !sukOn; sk.visible = sukOn;
      vive(yu, t, 11, { boca: t < tT ? "aberta" : "triste", triste: 0.6, fechados: t > tT + 0.5 }, 0.3);
      vive(sk, t, 12, { boca: "risada", bravo: 0.7 }, 0.3);
      boca.set(smr(t, K.pacto - 0.35, K.pacto + 0.1) * (1 - smr(t, tX - 0.1, tX)));
      ry.set(smr(t, K.pacto - 0.1, K.pacto + 0.25) * (1 - smr(t, K.minuto + 0.6, K.minuto + 1.0)), t); ry2.set(smr(t, K.pacto + 0.1, K.pacto + 0.4) * (1 - smr(t, K.minuto + 0.4, K.minuto + 0.9)), t);
      rl.set(smr(t, K.minuto - 0.3, K.minuto + 0.3) * (1 - smr(t, tX + 0.8, tX + 1.3)), Math.PI * 2 * smr(t, K.minuto, tX + 1.0), t);
      flash(t, tX, 0.05, 0.35, [1, 0.3, 0.25]);
      // o Sukuna ergue a mão: o orbe (o dedo) nasce nela e voa até a boca do Megumi
      const ergue = smr(t, tF - 0.3, tF + 0.2) * (1 - smr(t, tE, tE + 0.3)); if (ergue > 0) pose(sk, { armR: [-1.5 * ergue, 0, 0.1, -0.6 * ergue], handR: 0.8 }, 1);
      const mgOn = t < tT; mg.visible = mgOn; smg.visible = !mgOn;
      const engole = smr(t, tE - 0.1, tE + 0.25);
      vive(mg, t, 21, { boca: engole > 0 && engole < 1 ? "aberta" : "triste", bravo: 0.2, triste: 0.5 }, 0.3); pose(mg, { spine: [0.25, 0, 0], neck: [0.15 - 0.4 * Math.sin(engole * Math.PI), 0, 0] }, 1);
      vive(smg, t, 22, { boca: "sorriso", bravo: 0.6 }, 0.3);
      sk.updateMatrixWorld(true); const mao = sk.userData.wr[0].localToWorld(V3(0, -0.08, 0)), bocaM = mg.userData.head.localToWorld(V3(0, 0.02, 0.1));
      const voa = smr(t, K.obrigou, tE); orb.o.position.lerpVectors(mao, bocaM, E.inOut(voa)); orb.o.position.y += Math.sin(voa * Math.PI) * 0.3;
      orb.set(smr(t, tF, tF + 0.3) * (1 - smr(t, tE - 0.05, tE + 0.1)), t);
      flash(t, tT, 0.06, 0.55);
      // depois da troca o Yuji cai de joelhos
      const cai = smr(t, tT + 0.2, tT + 1.2); if (cai > 0) { kneelPose(yu, cai); pose(yu, { spine: [0.4 * cai, 0, 0], neck: [0.4 * cai, 0, 0] }, 1); }
      floatDust(poeira, t, 0.2, 0.15);
      flash(t, b, 0.15, 0.001);
    },
    cam(t) {
      const ey = olhosW(yu), es = olhosW(smg);
      return planos(t, [
        [a, (tt, u) => { const k = E.inOut(u), f = frente(yu), l = ladoEsq(yu); return { pos: [ey.x + f.x * lerp(0.75, 0.55, k) + l.x * 0.32, ey.y + 0.06, ey.z + f.z * lerp(0.75, 0.55, k) + l.z * 0.32 + 0.0], look: [ey.x, ey.y + 0.05, ey.z], fov: lerp(34, 32, k), near: 0.02 }; }],
        [tX + 0.25, mov([0.25, 1.45, -5.6], [0.15, 1.5, -5.0], [0, 1.35, 0], [0.05, 1.4, 0], 32, 32)],
        [tT, (tt, u) => { const k = E.inOut(u), f = frente(smg); return { pos: [es.x + f.x * lerp(1.0, 0.7, k) + 0.12, es.y + 0.02, es.z + f.z * lerp(1.0, 0.7, k) + 0.28], look: [es.x - 0.05, es.y - 0.03, es.z], fov: 32, near: 0.02 }; }],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 7 · o banho: água escura com raios de luz; o Megumi afunda; a Tsumiki aparece e se desfaz em luz
const causticaTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#000"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(160,220,255,.55)"; c.lineWidth = 3; for (let i = 0; i < 40; i++) { c.beginPath(); const x = hash(i) * w, y = hash(i * 3) * h; c.moveTo(x, y); c.bezierCurveTo(x + 30, y + hash(i * 5) * 40 - 20, x + 50, y + 20, x + 80, y + hash(i * 7) * 30); c.stroke(); } });
addSet("s7-banho", (g) => {
  const [a, b] = T.sc["s7-banho"];
  const dome = vazio(g, 0x0a2a40, 0x02060c, 0x010204, { exp: 1.2 });
  const sup = mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshBasicMaterial({ map: rep(causticaTex, 8, 8), color: 0x6ab0d8, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: ADD }), 0, 9, 0, g); sup.rotation.x = Math.PI / 2;
  const raiosL = godRays(g, [0, 9, -1], [0.05, -1, 0.02], { color: 0x8ad0ff, n: 9, len: 16, w: 1.4, opacity: 0.22, spread: 6 });
  const bol = bolhas(g, 160, [-4, 4, -6, 9, -4, 3]);
  const mg = megumiLP(); g.add(mg);
  const ts = tsumikiLP({ roupa: 0x6a7a9a }); g.add(ts); ts.position.set(1.1, 0, 0.9); ts.rotation.y = -0.5;
  const TT = trocaCorPrep(ts, 0x9ad0ff); TT.uY.value = -100;
  const halo = glowSprite(0xe8f4ff, 1.6, 0), luzT = new THREE.PointLight(0xe8f0ff, 0, 5, 1.6); g.add(halo, luzT);
  const roxo = new THREE.PointLight(0xb070ff, 0, 3, 1.6); g.add(roxo);
  const cinzas = flowPts(160, 0xeef6ff, 0.035); g.add(cinzas.pts);
  const vermelho = glowSprite(0xff2020, 9, 0); vermelho.position.set(0, 9.2, 0); g.add(vermelho);
  const tA = K.tsumiki - 0.6, tD = K.usando;
  let tsY = 0;
  return {
    bg: 0x02060c, fogExp: 0.085, fogCol: 0x041624, dome, hand: 0,
    look: { exposure: 1.1, bloom: 0.6, bloomT: 0.82, vig: 0.6, sat: 1.0, con: 1.05, lift: [0, 0.01, 0.025] },
    sun: { dir: [0.1, 1, 0.2], col: 0x9ad8ff, I: 1.4, c: [0, 0, 0], r: 8, shadow: false }, hemi: { sky: 0x2a6a9a, ground: 0x020408, I: 0.6 }, fill: { col: 0x3a7ab0, I: 0.4, dir: [0.5, -0.3, 0.6] }, rim: { col: 0x9ad8ff, str: 1.1 },
    update(t) {
      const lt = t - a;
      sup.material.map.offset.set(Math.sin(lt * 0.2) * 0.05, lt * 0.01);
      bol.update(t);
      // o Megumi afunda devagar, de olhos fechados, braços soltos subindo
      const afunda = smr(t, a, b); mg.position.set(-0.3, lerp(2.4, -2.6, afunda), -0.2); mg.rotation.set(-0.25 + Math.sin(lt * 0.4) * 0.05, 0.3 + lt * 0.03, Math.sin(lt * 0.3) * 0.08);
      restPose(mg); pose(mg, { armR: [-2.3, 0, -0.5, -0.4], armL: [-2.2, 0, 0.5, -0.5], legR: [0.15, 0, 0, 0.4], legL: [-0.1, 0, 0, 0.2], head: [-0.3, 0, 0], handR: 0.2, handL: 0.2 }); idle(mg, t, 21, 0.25); rostoLP(mg, t, { fechados: true, triste: 0.6, boca: "linha" });
      vermelho.material.opacity = 0.35 * smr(t, K.escolheu - 0.5, K.cruel);
      // a Tsumiki: surge em luz clara, os olhos ficam violeta (possuída), e se desfaz em partículas de baixo pra cima
      const ap = smr(t, tA, tA + 0.7), des = smr(t, tD, tD + 1.3);
      tsY = mg.position.y + 0.3; ts.position.set(1.0, tsY, 1.0); restPose(ts); idle(ts, t, 41, 0.3); rostoLP(ts, t, { boca: t < K.possuida ? "sorriso" : "linha", triste: t > K.possuida ? 0.4 : 0, fechados: t > tD + 0.3 });
      ts.visible = ap > 0.01 && des < 0.999;
      halo.position.set(1.0, tsY + 1.5, 0.9); halo.material.opacity = 0.12 * ap * (1 - des); luzT.position.set(1.4, tsY + 1.8, 1.8); luzT.intensity = 1.2 * ap * (1 - des);
      roxo.position.set(1.0, tsY + 1.6, 1.4); roxo.intensity = 1.5 * smr(t, K.possuida, K.yorozu) * (1 - des);
      TT.uY.value = lerp(tsY - 0.1, tsY + 2.1, des);
      for (let i = 0; i < 160; i++) { const ph = clamp((t - tD - hash(i) * 0.9) / 2.2); const ang = hash(i * 3) * 6.28; cinzas.pos.set([1.0 + Math.cos(ang) * (0.1 + ph * 1.4), tsY + hash(i * 7) * 1.8 + ph * 1.6, 1.0 + Math.sin(ang) * (0.1 + ph * 0.9)], i * 3); }
      cinzas.upd(); cinzas.pts.material.opacity = 0.55 * smr(t, tD, tD + 0.3) * (1 - smr(t, tD + 1.8, tD + 2.4));
      escurece(t, b - 0.5, b, [0.3, 0.22, 0.3], 1);
    },
    cam(t) {
      const em = olhosW(mg), et = olhosW(ts);
      return planos(t, [
        [a, (tt, u) => { const k = E.inOut(u); return { pos: [em.x + 1.6, em.y - lerp(1.4, 1.0, k), em.z + 2.6], look: [em.x, em.y - 0.4, em.z], fov: 38, near: 0.05 }; }],
        [K.escolheu, (tt, u) => { const k = E.inOut(u); return { pos: [em.x + 0.6, em.y - 3.2, em.z + 1.4], look: [em.x, em.y + 2.0 + k * 2, em.z], fov: 46, near: 0.05 }; }],
        [K.matou, (tt, u) => { const k = E.inOut(u); return { pos: [et.x + 0.25, et.y + 0.02, et.z + lerp(1.2, 0.9, k)], look: [et.x - 0.05, et.y - 0.08 - k * 0.3, et.z], fov: 32, near: 0.03 }; }],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 8 · o manual: planície lilás e marrom com fogo no horizonte; a roda trava, o corte no espaço, o Gojo no Infinito
addSet("s8-manual", (g) => {
  const [a, b] = T.sc["s8-manual"];
  const dome = skyDome(g, { top: 0x2a2040, mid: 0x6a4a6a, hor: 0xd08a6a, ground: 0x2a1a18, exp: 0.65, sunDir: [0.3, 0.05, -1], sunCol: 0xff9a60, sunI: 0.7, disk: 1.2, cov: 0.55, cloudA: 0.5, cloudLit: 0xe0a080, cloudSh: 0x4a3a5a, midY: 0.12 });
  const gg = new THREE.PlaneGeometry(200, 200, 60, 60); gg.rotateX(-Math.PI / 2); const pa = gg.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), d = Math.hypot(x, z); pa.setY(i, d < 10 ? 0 : (fbm2(x * 0.05, z * 0.05, 3) - 0.3) * Math.min(1, (d - 10) / 20) * 5); }
  gg.computeVertexNormals(); mesh(gg, LPmat(0x7a5a52, { rim: 0.3 }), 0, 0, 0, g);
  const ruina = LPmat(0x4a3e44, { rim: 0.3 });
  for (let i = 0; i < 14; i++) { const x = (hash(i) - 0.5) * 70, z = -18 - hash(i * 3) * 30, h = 2 + hash(i * 5) * 9; const r = mesh(box(2 + hash(i * 7) * 4, h, 2 + hash(i * 9) * 3), ruina, x, h / 2 - 0.5, z, g); r.rotation.set((hash(i * 2) - 0.5) * 0.2, hash(i * 4) * 3, (hash(i * 6) - 0.5) * 0.25); }
  const fogos = [[-14, -26, 1.4], [6, -34, 2], [20, -28, 1.2], [-28, -40, 2.4]].map(([x, z, s]) => fogoLonge(g, x, z, s));
  const vento = dustPts(220, [-10, 10, 0.1, 4, -10, 6], 0xffd0b0, 0.025, 0.55); g.add(vento);
  const smg = sukunaMegumiLP(); g.add(smg); smg.position.set(0.2, 0, 1.2); smg.rotation.y = 0.35;
  const mh = mahoragaLP(); g.add(mh); mh.position.set(-3.2, 0, -2.2); mh.rotation.y = 0.6;
  const gj = gojoLP(); g.add(gj); gj.position.set(3.4, 0, -1.6); gj.rotation.y = -0.6;
  const aneisG = []; for (let i = 0; i < 4; i++) { const r = mesh(new THREE.TorusGeometry(0.75 + i * 0.32, 0.012, 6, 64), glowM(0x6ac8ff, 0), 3.4, 1.15, -1.6, g); r.rotation.y = -0.6; r.castShadow = false; aneisG.push(r); }
  const esfera = mesh(new THREE.SphereGeometry(1.1, 24, 16), glowM(0x3a9aff, 0), 3.4, 1.15, -1.6, g); esfera.castShadow = false;
  const corte = linhaLuz(g, [[-6, 4.2, -3.5], [7, -0.4, 0.5]], { r: 0.025, cor: 0xffffff, seg: 60 }), corte2 = linhaLuz(g, [[-2.5, 3.9, -6], [9, 0.6, 1.2]], { r: 0.03, cor: 0xffffff, seg: 60 });
  const tC = [K.mahoraga2 + 0.15, K.adaptar + 0.25, K.aprendeu + 0.2];
  return {
    bg: 0x2a2040, fog: [14, 95], fogCol: 0x5a3e52, dome, hand: 0,
    look: { exposure: 1.15, bloom: 0.65, bloomT: 0.74, vig: 0.5, sat: 1.05, con: 1.06 },
    sun: { dir: [0.35, 0.35, -1], col: 0xffa070, I: 2.2, c: [0, 1, -1], r: 9 }, hemi: { sky: 0x7a5a8a, ground: 0x3a2420, I: 0.6 }, fill: { col: 0xb0a0ff, I: 0.5, dir: [-0.4, 0.4, 1] }, rim: { col: 0xffb080, str: 1.0 },
    update(t) {
      fogos.forEach((f) => f.update(t)); floatDust(vento, t, 0.5, 0.6);
      vive(smg, t, 22, { boca: t >= K.palavras ? "risada" : "sorriso", bravo: 0.65 }, 0.3);
      restPose(mh); pose(mh, { armR: [0.05, 0, -0.3, -0.35], armL: [0.05, 0, 0.3, -0.35] });
      const golpe = act(t, K.cortar - 0.35, K.cortar + 0.25); if (golpe > 0) pose(mh, { armR: [-2.2 + 2.6 * clamp(golpe), 0, -0.6, -0.2], chest: [0, -0.3 * golpe, 0] }, 1);
      rodaClique(mh, t, tC);
      tC.forEach((tc) => flash(t, tc + 0.03, 0.03, 0.25, [1, 0.9, 0.7]));
      corte.set(smr(t, K.cortar, K.cortar + 0.12) * (1 - smr(t, K.espaco, K.espaco + 0.4)));
      // o Gojo no Infinito: anéis azuis girando em volta; o corte atravessa
      vive(gj, t, 31, { boca: t < K.gojo ? "sorriso" : "aberta" }, 0.3);
      const inf = smr(t, K.atravessou - 0.6, K.atravessou) * (1 - smr(t, K.gojo + 0.1, K.gojo + 0.6));
      aneisG.forEach((r, i) => { r.material.opacity = 0.75 * inf; r.rotation.x = t * (0.6 + i * 0.3); r.rotation.z = t * 0.3 * (i % 2 ? 1 : -1); });
      esfera.material.opacity = 0.08 * inf;
      corte2.set(smr(t, K.gojo - 0.08, K.gojo + 0.06) * (1 - smr(t, K.gojo + 0.5, K.gojo + 0.9)));
      flash(t, K.gojo, 0.04, 0.5);
      flash(t, b, 0.15, 0.001);
    },
    cam(t) {
      const es = olhosW(smg), eg = olhosW(gj);
      return planos(t, [
        [a, mov([1.6, 1.5, 4.6], [1.3, 1.6, 3.8], [0, 1.4, 0.8], [0, 1.5, 0.8], 36, 34)],
        [K.vendo, mov([-1.0, 0.6, 2.6], [-0.6, 0.7, 2.2], [-3.2, 3.6, -2.2], [-3.2, 4.6, -2.2], 40, 38)],
        [K.cortar - 0.2, mov([2.8, 2.2, 6.0], [2.0, 2.3, 6.4], [-0.5, 1.8, -2], [0, 1.8, -2], 44, 44)],
        [K.atravessou - 0.25, (tt, u) => { const k = E.inOut(u); return { pos: [eg.x - 1.4 - k * 0.3, eg.y - 0.1, eg.z + 2.0], look: [eg.x, eg.y - 0.25, eg.z], fov: 34, near: 0.03 }; }],
        [K.palavras, (tt, u) => { const k = E.inOut(u); return { pos: add3(es, [0.3, 0.02, lerp(0.95, 0.7, k)]), look: add3(es, [0, -0.04, 0]), fov: 30, near: 0.02 }; }],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 9 · a chave: o mesmo vazio do começo; o Yuji atrás das grades, o Megumi com os olhos do Sukuna, a chave de luz que trava
addSet("s9-chave", (g) => {
  const [a, b] = T.sc["s9-chave"];
  const M = mundoVermelho(g);
  const yu = yujiLP(); g.add(yu); yu.position.set(-1.35, 0, -0.6); yu.rotation.y = 0.25;
  const jg = grp(g, -1.35, 0, -0.05); const jl = jaulaLuz(jg, { w: 1.5, h: 2.5, n: 7 });
  const smg = sukunaMegumiLP(); g.add(smg); smg.position.set(1.35, 0, -0.6); smg.rotation.y = -0.25;
  const ch = chaveLuz(g); ch.c.position.set(0, 1.6, 0.6); ch.c.scale.setScalar(0.7);
  return {
    bg: 0x080204, fog: [6, 40], fogCol: 0x1a0406, dome: M.dome, hand: 0,
    look: { exposure: 1.1, bloom: 0.8, bloomT: 0.68, vig: 0.55, sat: 1.08, con: 1.06 },
    sun: { dir: [0, 0.5, -0.9], col: 0xff4a3a, I: 2.4, c: [0, 1.2, -0.5], r: 6 }, hemi: { sky: 0x5a1820, ground: 0x0a0204, I: 0.55 }, fill: { col: 0xffd8c8, I: 0.6, dir: [0, 0.3, 1] }, rim: { col: 0xff6a50, str: 0.9 },
    update(t) {
      flash(t, a, 0.001, 0.45);
      vive(yu, t, 11, { boca: "triste", triste: 0.6 }, 0.3);
      vive(smg, t, 22, { boca: "sorriso", bravo: 0.6 }, 0.3);
      jl.set(1, t);
      const gira = smr(t, K.chave - 0.1, K.chave + 0.4);
      ch.set(smr(t, a, a + 0.8), t); ch.c.rotation.set(0, t * 0.9, -Math.PI / 2 * E.outBack(gira));
      flash(t, K.chave + 0.15, 0.05, 0.6, [1, 0.85, 0.55]);
      floatDust(M.brasa, t, 0.25, 0.2);
      escurece(t, b - 0.7, b, [0, 0, 0], 1);
    },
    cam(t) { return { ...path2(t, [[a, [0.3, 1.6, 3.0], [0, 1.5, 0.4], 34], [K.megumi9, [0.1, 1.65, 4.2], [0, 1.45, -0.3], 36], [b, [0, 1.7, 6.0], [0, 1.4, -0.4], 36]]), near: 0.03 }; },
  };
});
