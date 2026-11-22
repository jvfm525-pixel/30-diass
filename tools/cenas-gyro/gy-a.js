// ================================================================ vídeo: Gyro · cenas 0–5 (capa, abertura, o canteiro, a febre, a verdade, a noite)
const GDOF_C = { ap: 0.008, max: 0.014 }, GDOF_M = { ap: 0.005, max: 0.012 }, GDOF_L = { ap: 0.0025, max: 0.008 };
const LUZ_OBRA = { bg: 0xffa860, fog: [25, 200], fogCol: 0xd88a6a, look: { exposure: 1.05, bloom: 0.35, bloomT: 0.82, vig: 0.42, sat: 1.1, con: 1.08, dof: GDOF_M, rosto: 0.3, lift: [0.015, 0.005, 0] },
  sun: { dir: [-0.3, 0.25, -1], col: 0xffa060, I: 2.4, c: [0, 1, -4], r: 22 }, hemi: { sky: 0xd8906a, ground: 0x3a2a20, I: 0.8 }, fill: { col: 0xffc0a0, I: 0.4, dir: [0.4, 0.3, 1] }, rim: { col: 0xffb070, str: 1.2 } };
const LUZ_OBRA_NOITE = { bg: 0x1a2238, fog: [18, 140], fogCol: 0x161c30, look: { exposure: 1.12, bloom: 0.5, bloomT: 0.76, vig: 0.55, sat: 1.0, con: 1.1, dof: GDOF_M, rosto: 0.3, lift: [0, 0.006, 0.02] },
  sun: { dir: [0.3, 0.6, -0.7], col: 0x8aa0ff, I: 0.7, c: [0, 1, -3], r: 18 }, hemi: { sky: 0x2a3050, ground: 0x0a0a0a, I: 0.5 }, fill: { col: 0xffa060, I: 0.15, dir: [0.4, 0.3, 1] }, rim: { col: 0x9ab0ff, str: 1.3 } };
const LUZ_BARRACO = { bg: 0x05050a, fog: [10, 40], fogCol: 0x0a0a10, look: { exposure: 1.12, bloom: 0.5, bloomT: 0.75, vig: 0.55, sat: 1.05, con: 1.1, dof: GDOF_C, rosto: 0.3 },
  sun: { dir: [0.4, 0.8, -0.3], col: 0x8aa0ff, I: 0.15, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x2a2a3a, ground: 0x1a120a, I: 0.45 }, fill: { col: 0xffa060, I: 0.1, dir: [0.3, 0.3, 1] }, rim: { col: 0xffb070, str: 1.0 } };
const LUZ_NGL_NOITE = { bg: 0x04050c, fog: [12, 110], fogCol: 0x0a0e18, look: { exposure: 1.12, bloom: 0.5, bloomT: 0.76, vig: 0.55, sat: 1.0, con: 1.08, dof: GDOF_M, rosto: 0.35, lift: [0, 0.008, 0.02] },
  sun: { dir: [0.3, 0.7, -0.6], col: 0xa8b8ff, I: 0.8, c: [0, 1, 0], r: 16 }, hemi: { sky: 0x2a3456, ground: 0x0a0c0a, I: 0.55 }, fill: { col: 0x8aa0d8, I: 0.25, dir: [0.3, 0.3, 1] }, rim: { col: 0xb8c8ff, str: 1.5 } };
// elenco do flashback (silhuetas) e ajudantes
const meninoG = (esc = 0.58, seed = 622) => silhueta(pessoaLP({ seed, cabelo: CAB_GY.menino, scale: esc, botoes: false }));
function paiG(gar = true) { const p = silhueta(pessoaLP({ seed: 621, cabelo: CAB_GY.pai, scale: 1.04, botoes: false }));
  if (gar) { const b = garrafa(0x161a12); p.userData.wr[1].add(b); b.position.set(0, -0.1, 0.03); b.rotation.x = -0.3; p.userData.garrafa = b; } return p; }
function velhoG() { const p = silhueta(pessoaLP({ seed: 623, scale: 0.95, botoes: false, cabelo: { ...CAB_GY.pai, seed: 75, cor: 0x101012 } }));
  const b = mesh(cyl(0.012, 0.012, 0.95, 5), p.userData.silM, 0, -0.45, 0.02, p.userData.wr[0]); b.rotation.x = 0.1; return p; }
const curvado = (p, k = 1) => pose(p, { spine: [0.32, 0, 0], chest: [0.15, 0, 0], neck: [0.2, 0, 0] }, k);
// liga/desliga o brilho dos olhos (Gyro, formigas, o menino no fim da cena 5)
function olhosK(p, k) { (p.userData.olhosAc || []).forEach((o) => { if (o.isSprite) { o.material.opacity = 0.55 * k; o.visible = k > 0.02; } else o.visible = k > 0.05; }); }
// deitado de barriga pra cima (pés em z, cabeça para -z) sobre uma superfície em altura y
function deitado(p, x, y, z, ry = 0) { restPose(p); p.position.set(x, y, z); p.rotation.set(-Math.PI / 2, 0, ry); }
// carregar / segurar: um objeto preso na mão i
function naMaoG(p, i, obj, dx = 0, dy = -0.1, dz = 0.04) { p.userData.wr[i].add(obj); obj.position.set(dx, dy, dz); return obj; }
// fumaça escura que sobe de alguém (maldade)
function fumacaEscura(g) { return steam(g, { origin: [0, 0, 0], n: 18, size: 0.5, spread: 0.5, rise: 0.9, grow: 2.2, opacity: 0.55, life: 2.4, color: 0x6a1428, wind: [0.1, 0, 0] }); }

// ---------------------------------------------------------------- 0 · capa: o Gyro de capuz na NGL à noite, olhos acesos
addSet("s0-capa", (g) => {
  vilaNGL(g, { noite: true }); const gy = gyroLP(); g.add(gy); gy.position.set(0, 0, 2);
  return { ...LUZ_NGL_NOITE, hand: 0, look: { ...LUZ_NGL_NOITE.look, dof: GDOF_C },
    update(t) { vive(gy, t, 801, {}, 0.05); olhosK(gy, 1); },
    cam() { return closeRosto(gy, 1.0, 0.18, -0.05, 32); } };
});

// ---------------------------------------------------------------- 1 · abertura: o vilão que quase ninguém viu (NGL à noite, névoa, vagalumes)
addSet("g1-abertura", (g) => {
  const __n = "g1-abertura"; const [a, b] = T.sc[__n];
  const V = vilaNGL(g, { noite: true }); const gy = gyroLP(); g.add(gy); gy.position.set(0, 0, 2); const sp = sombraPe(g, gy, 1.2);
  const nev = steam(g, { origin: [0, 0.1, 2], n: 16, size: 2.4, spread: 6, rise: 0.15, grow: 1.2, opacity: 0.22, life: 6, color: 0x8a98c0, wind: [0.25, 0, 0] });
  return { ...LUZ_NGL_NOITE, hand: 0.004,
    update(t) { V.upd(t, 0); nev.upd(t, 1); vive(gy, t, 801, {}, 0.15); sp(0); gy.rotation.y = lerp(0.4, 0, smr(t, K.rosto - 0.6, K.rosto));
      olhosK(gy, t < K.rosto - 0.2 ? 0.25 : 1); flash(t, K.gyro, 0.08, 0.5, [0.22, 0.25, 0.35]); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([7, 7, 16], [3.2, 3.2, 10], [0, 1.5, 0], [0, 1.4, 1.5], 46, 42)],
        [K.lutou - 0.3, mov([0.7, 1.75, -1.6], [0.55, 1.7, -0.9], [0, 1.4, 6], [0, 1.5, 6], 44, 40)],
        [K.rosto - 0.3, (tt, u) => ({ ...closeRosto(gy, lerp(1.2, 0.95, E.inOut(u)), 0.25, -0.04, 32) })],
        [K.rosto + 1.3, mov([-2.4, 1.3, 4.6], [-2.0, 1.4, 4.2], [0, 1.3, 2], [0, 1.4, 2], 40, 38)],
        [K.ultimo - 0.3, mov([2.0, 0.35, 6.8], [1.6, 0.45, 5.8], [0, 1.9, 1.5], [0, 2.0, 1.5], 40, 38)],
        [K.gyro - 0.35, (tt, u) => ({ ...closeRosto(gy, lerp(0.95, 0.72, E.inOut(u)), 0.05, -0.04, 30) })],
      ], b); },
  };
});

// ---------------------------------------------------------------- 2 · o canteiro ao pôr do sol: o menino carrega tijolo, mistura cimento; o pai bebe
addSet("g2-obra", (g) => {
  const __n = "g2-obra"; const [a, b] = T.sc[__n];
  const C = canteiroObras(g);
  const k = meninoG(0.58); g.add(k); const spK = sombraPe(g, k, 0.7);
  const tj = naMaoG(k, 0, mesh(box(0.22, 0.07, 0.1), LPmat(0xa0502e, { rough: 0.95 })), 0.1, -0.09, 0.06);
  const pa = naMaoG(k, 1, grp(null), 0, -0.05, 0); mesh(cyl(0.015, 0.015, 0.9, 5), k.userData.silM, 0, 0, 0, pa).rotation.x = 0.4; mesh(box(0.16, 0.2, 0.02), k.userData.silM, 0, -0.42, 0.18, pa).rotation.x = 0.4;
  const pai = paiG(); g.add(pai); const spP = sombraPe(g, pai);
  for (let i = 0; i < 4; i++) { const gb = garrafa(0x22301a); gb.position.set(-4.3 + hash(i) * 0.5, 0.03, -2.0 - hash(i * 3) * 0.6); gb.rotation.set(Math.PI / 2, 0, hash(i * 5) * 3); g.add(gb); }
  const tPai = K.pai - 0.3;
  return { ...LUZ_OBRA, hand: 0.004,
    update(t) {
      C.upd(t); C.BT.tb.rotation.y = t * 2.2;
      // menino: até "cimento" carrega tijolo; até "tijolo" mexe o cimento; depois assenta tijolo; em "falar" fica parado de frente
      restPose(k); tj.visible = t < K.cimento - 0.3 || (t > K.tijolo - 0.3 && t < K.falar - 0.3); pa.visible = t > K.cimento - 0.3 && t < K.tijolo - 0.3;
      if (t < K.cimento - 0.3) { const d = 3.6 * seg(t, a, K.cimento - 0.4); gait(k, d, { from: [3.4, 0, -6.0], ang: -Math.PI * 0.62, step: 0.5 }); maoEm(k, 0, frenteW(k, 0.03, 0.6, 0.22), 1, { abre: 0.3 }); maoEm(k, 1, frenteW(k, -0.08, 0.6, 0.22), 1, { abre: 0.3 }); }
      else if (t < K.tijolo - 0.3) { k.position.set(-2.55, 0, -4.35); k.rotation.y = -2.2; idle(k, t, 701, 0.2); standFeet(k); const c = Math.sin((t - K.cimento) * 5); pose(k, { spine: [0.25 + 0.12 * c, 0, 0] }, 1); maoEm(k, 1, frenteW(k, -0.05, 0.55 + 0.1 * c, 0.35), 1, { abre: 0.4 }); maoEm(k, 0, frenteW(k, 0.05, 0.75 + 0.1 * c, 0.3), 1, { abre: 0.4 }); }
      else if (t < K.falar - 0.3) { k.position.set(0.4, 0, -11.55); k.rotation.y = Math.PI; idle(k, t, 701, 0.2); standFeet(k); const c = seg((t - K.tijolo) % 1.4, 0, 1.4); pose(k, { spine: [0.35 * Math.sin(c * Math.PI), 0, 0] }, 1); maoEm(k, 0, frenteW(k, 0.0, lerp(0.35, 0.85, Math.sin(c * Math.PI)), 0.3), 1, { abre: 0.3 }); }
      else { k.position.set(-1.0, 0, -1.2); k.rotation.y = 0.5; idle(k, t, 701, 0.3); standFeet(k); }
      spK(0);
      // pai: sentado no caixote; bebe; em "batia" levanta e fica sobre o menino (sem mostrar o golpe)
      restPose(pai); pai.position.set(-4.6, 0, -2.4); pai.rotation.y = Math.PI / 2 - 0.2; idle(pai, t, 702, 0.25);
      const lev = smr(t, K.batia - 0.9, K.batia - 0.3); if (lev < 1) sitPose(pai, 1 - lev, { seatY: 0.42 / 1.04, lean: 0.15 }); standFeet(pai);
      const gole = t > K.bebia - 0.4 && t < K.batia - 0.9 ? Math.max(0, Math.sin((t - K.bebia + 0.4) * 2.2)) : 0; maoEm(pai, 1, lerp3v(frenteW(pai, -0.15, 0.85, 0.3), corpoW(pai, "head", 0.02, -0.02, 0.12), gole), 1, { abre: 0.4 }); pose(pai, { neck: [-0.35 * gole, 0, 0] }, 1);
      if (t > K.batia - 0.9) { k.position.set(-3.6, 0, -2.0); k.rotation.y = -Math.PI / 2 - 0.3; restPose(k); idle(k, t, 701, 0.2); const enc = smr(t, K.batia, K.batia + 0.3); kneelPose(k, enc * 0.6); pose(k, { neck: [0.5 * enc, 0, 0], spine: [0.3 * enc, 0, 0] }, 1); standFeet(k); maoEm(pai, 0, frenteW(pai, 0.15, lerp(1.0, 1.7, smr(t, K.batia - 0.5, K.batia - 0.1)), 0.35), 1, { abre: 0.5 }); }
      spP(0); apagao(t, K.batia, 0.08, 0.12, 0.45, 0.85);
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([5.8, 0.5, -1.6], [4.6, 0.45, -2.6], [1.5, 0.8, -7.5], [1.0, 0.8, -8.2], 42, 40)], // baixo, o menino passa contra o céu
        [K.cimento - 0.3, mov([-0.6, 0.9, -2.6], [-0.9, 0.85, -3.0], [-2.7, 0.6, -4.6], [-2.8, 0.6, -4.8], 40, 36)],
        [K.tijolo - 0.3, mov([2.0, 1.0, -9.2], [1.5, 0.9, -9.8], [0.3, 0.6, -11.8], [0.3, 0.6, -11.8], 40, 36)],
        [K.falar - 0.3, mov([0.5, 0.75, 0.9], [0.3, 0.72, 0.4], [-1.0, 0.75, -1.2], [-1.0, 0.75, -1.2], 36, 32)],
        [tPai, mov([-3.9, 0.42, 0.7], [-3.85, 0.48, 0.3], [-4.6, 1.15, -2.4], [-4.6, 1.2, -2.4], 40, 36)], // de baixo: o pai contra o pôr do sol
        [K.batia - 0.9, mov([-2.7, 0.35, -1.5], [-2.8, 0.32, -1.7], [-4.3, 1.4, -2.3], [-4.3, 1.5, -2.3], 44, 42)],
      ], b); },
  };
});
const lerp3v = (a, b, k) => a.clone().lerp(b, clamp(k));
// apagão curto em volta de t0 (entra, fica, volta) — escurece() sozinho não volta
function apagao(t, t0, entra = 0.12, fica = 0.15, sai = 0.5, max = 0.9) { const k = smr(t, t0 - entra, t0) * (1 - smr(t, t0 + fica, t0 + fica + sai)) * max; if (k > 0) { GU.uFade.value = Math.max(GU.uFade.value, k); GU.uFadeCol.value.set(0, 0, 0); } }

// ---------------------------------------------------------------- 2b · o medo do barulho: o pai dorme na esteira; o menino anda na ponta dos pés; uma garrafa rola
addSet("g2b-medo", (g) => {
  const __n = "g2b-medo"; const [a, b] = T.sc[__n];
  const B = barracoDentro(g, { lua: 1.0 }); const pai = paiG(false); g.add(pai); const k = meninoG(0.58); g.add(k);
  const gb = garrafa(0x22301a); g.add(gb);
  return { ...LUZ_BARRACO, hand: 0.003,
    update(t) {
      B.upd(t, 0.55);
      deitado(pai, -1.3, 0.16, 0.1); const resp = Math.sin(t * 1.6); pai.userData.chest.scale.set(1, 1 + 0.03 * resp, 1 + 0.05 * resp);
      const mex = smr(t, K.barulho + 0.15, K.barulho + 0.5) * (1 - smr(t, K.barulho + 1.0, K.barulho + 1.6)); pose(pai, { armL: [0, 0, 0.3 + 0.5 * mex, -0.4], neck: [0, 0.4 * mex, 0] }, 1);
      restPose(k); const f = seg(t, a + 0.2, K.barulho - 0.1); gait(k, 1.6 * f, { from: [0.2, 0, 1.4], ang: -Math.PI * 0.85, step: 0.22, lift: 0.14 });
      pose(k, { spine: [0.2, 0, 0], armR: [-0.4, 0, 0.5, -0.9], armL: [-0.4, 0, -0.5, -0.9] }, 1); // ponta dos pés, braços abertos
      if (t > K.barulho - 0.1) { const congela = 1; pose(k, { spine: [0.05, 0, 0], neck: [-0.1, 0.5, 0] }, congela); }
      const rola = smr(t, K.barulho - 0.1, K.barulho + 0.9); gb.position.set(-0.1 + 0.55 * rola, 0.035, 0.35 + 0.1 * rola); gb.rotation.set(Math.PI / 2, 0, 0.3 + rola * 5);
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.4, 1.6, 1.6], [1.3, 1.5, 1.2], [-0.8, 0.6, -0.5], [-0.6, 0.5, -0.3], 52, 48)],
        [K.barulho - 0.45, mov([0.9, 0.16, 0.7], [0.85, 0.18, 0.6], [-0.2, 0.15, 0.25], [-0.2, 0.18, 0.2], 46, 44)],
        [K.barulho + 0.7, mov([0.2, 0.9, -1.2], [0.1, 0.85, -1.35], [-1.3, 0.25, -0.6], [-1.3, 0.25, -0.6], 44, 40)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 3 · a febre: o menino olha o pai lá fora; depois deita com febre e um vulto cuida dele a noite toda
addSet("g3-febre", (g) => {
  const __n = "g3-febre"; const [a, b] = T.sc[__n];
  const B = barracoDentro(g, { fora: 0xd8783a, lua: 0.8 }); const fora = B.fora, corTarde = new THREE.Color(0xd8783a), corNoite = new THREE.Color(0x2c3858);
  const k = meninoG(0.58); g.add(k); const v = velhoG(); g.add(v); const pai = paiG(); g.add(pai);
  const calor = glowSprite(0xff5030, 0.9, 0); g.add(calor); const calor2 = glowSprite(0xffa060, 0.4, 0); g.add(calor2);
  const halo = glowSprite(0xffc080, 2.4, 0); g.add(halo);
  const tF = K.febre - 0.3;
  return { ...LUZ_BARRACO, hand: 0.003,
    update(t) {
      const noite = smr(t, tF - 0.2, tF + 0.2); B.upd(t, t < tF ? 0.6 : 1); B.dob.rotation.y = t < tF ? -1.3 : 0;
      fora.material.color.copy(corTarde).lerp(corNoite, noite);
      // antes da febre: o menino na porta olhando o pai lá fora (contra o pôr do sol)
      pai.visible = t < tF; restPose(pai); pai.position.set(-0.15, 0, 4.4); pai.rotation.y = 0.2; idle(pai, t, 702, 0.25); standFeet(pai);
      if (t < tF) { restPose(k); k.position.set(-0.2, 0, 1.3); k.rotation.y = 0.1; idle(k, t, 701, 0.25); standFeet(k); pose(k, { neck: [-0.15, 0, 0] }, 1); v.visible = false; }
      else {
        deitado(k, -1.3, 0.1, -0.6); pose(k, { neck: [0, -0.4, 0] }, 1);
        v.visible = t > K.alguem - 0.5; restPose(v); v.position.set(-0.62, 0, -1.25); v.rotation.y = -Math.PI / 2; idle(v, t, 703, 0.2); kneelPose(v, 1); curvado(v, 0.5); standFeet(v);
        const pano = 0.5 + 0.5 * Math.sin((t - K.alguem) * 1.3); maoEm(v, 1, V3(-1.3, 0.2 + 0.04 * pano, -1.45 + 0.06 * pano), smr(t, K.alguem - 0.3, K.alguem + 0.4), { abre: 0.5, poleY: 0.2 });
      }
      const fe = t > tF ? 0.5 + 0.35 * Math.sin(t * 3.1) : 0; calor.position.set(-1.3, 0.3, -1.5); calor.material.opacity = fe * 0.6; calor2.position.set(-1.3, 0.25, -1.5); calor2.material.opacity = fe * 0.5;
      const kp = smr(t, K.pai3 - 0.4, K.pai3 + 0.3); halo.position.set(-0.62, 0.9, -1.25); halo.material.opacity = 0.35 * kp; // o menino vê no vulto o pai (luz quente)
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.4, 0.95, -0.6], [0.3, 0.9, -0.2], [-0.1, 0.9, 4], [-0.1, 1.0, 4], 46, 42)],
        [tF, mov([0.6, 1.9, 0.2], [0.3, 1.75, -0.2], [-1.3, 0.1, -1.0], [-1.3, 0.15, -1.1], 46, 40)],
        [K.alguem - 0.3, mov([-1.3, 1.5, 0.7], [-1.25, 1.4, 0.45], [-1.0, 0.35, -1.35], [-1.0, 0.35, -1.4], 46, 42)], // dos pés da esteira: o menino deitado e o vulto ao lado
        [K.pai3 - 0.35, mov([-1.5, 0.35, -0.2], [-1.4, 0.32, -0.35], [-0.7, 0.85, -1.25], [-0.7, 0.9, -1.25], 40, 34)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 4 · a verdade: aos 12, um garoto zomba; ele parte pra cima; um homem conta quem cuidou dele; o mundo fica cinza
addSet("g4-verdade", (g) => {
  const __n = "g4-verdade"; const [a, b] = T.sc[__n];
  const C = canteiroObras(g); const k = meninoG(0.72); g.add(k); const z = meninoG(0.74, 624); g.add(z); const h = silhueta(pessoaLP({ seed: 625, cabelo: { ...CAB_GY.pai, seed: 76 }, scale: 1.02, botoes: false })); g.add(h);
  const v = velhoG(); g.add(v); const pai = paiG(); g.add(pai); const spK = sombraPe(g, k, 0.8), spZ = sombraPe(g, z, 0.8), spH = sombraPe(g, h);
  const CH = choque(g, [0.9, 0, 0.4], 0xffd8a0);
  return { ...LUZ_OBRA, hand: 0.004,
    update(t) {
      C.upd(t); CH(t, K.cima + 0.35);
      const cinza = smr(t, K.verdade - 0.3, K.verdade + 0.3); GU.uSat.value = lerp(LUZ_OBRA.look.sat, 0.12, cinza); const tc = cinza > 0.5 ? K.verdade + (t - K.verdade) * 0.3 : t;
      // menino anda pela rua do canteiro; corre para o garoto em "cima"
      restPose(k); if (t < K.cima - 0.2) gait(k, 2.2 * seg(t, a, K.cima - 0.2), { from: [-2.6, 0, 2.2], ang: Math.PI * 0.62, step: 0.48 });
      else if (t < K.verdade - 0.3) { gait(k, 2.2 + 1.3 * smr(t, K.cima - 0.2, K.cima + 0.35), { from: [-2.6, 0, 2.2], ang: Math.PI * 0.62, step: 0.6, run: 1 }); }
      else { k.position.set(0.55, 0, 0.75); k.rotation.y = Math.PI * 0.62; idle(k, tc, 701, 0.2); standFeet(k); pose(k, { neck: [0.35, 0, 0], spine: [0.15, 0, 0] }, cinza); }
      spK(0);
      // garoto que zomba: aponta e ri; cai sentado com o encontrão
      restPose(z); z.position.set(1.25, 0, 0.35); z.rotation.y = -Math.PI * 0.45; idle(z, t, 704, 0.3); const ri = t > K.zombou - 0.3 && t < K.cima + 0.3 ? Math.abs(Math.sin(t * 9)) : 0;
      const cai = smr(t, K.cima + 0.3, K.cima + 0.6); if (cai > 0) { sitPose(z, cai, { seatY: 0.02, lean: -0.3 }); z.position.x += 0.35 * cai; } standFeet(z); pose(z, { spine: [-0.15 * ri, 0, 0] }, 1);
      if (t > K.zombou - 0.3 && cai < 0.5) maoEm(z, 0, frenteW(z, 0.1, 1.0, 0.6), 1, { abre: 0.4 }); spZ(0);
      // homem: entra e conta a verdade (cabeça balança ao falar)
      h.visible = t > K.cima + 0.5; restPose(h); gait(h, 1.4 * smr(t, K.cima + 0.5, K.verdade - 0.2), { from: [2.6, 0, 2.6], ang: -Math.PI * 0.7, step: 0.6 }); if (t > K.verdade - 0.2) { idle(h, tc, 705, 0.3); standFeet(h); pose(h, { neck: [0.25 + 0.06 * Math.sin(tc * 8), 0, 0], spine: [0.15, 0, 0] }, 1); maoEm(h, 0, frenteW(h, 0.1, 1.05, 0.45), 1, { abre: 0.5 }); } spH(0);
      // o velho vizinho na porta do barraco dele; o pai sentado de costas com a garrafa
      restPose(v); v.position.set(5.5, 0, 2.7); v.rotation.y = -Math.PI / 2; idle(v, tc, 703, 0.2); curvado(v, 1); standFeet(v);
      restPose(pai); pai.position.set(-4.6, 0, -2.4); pai.rotation.y = Math.PI / 2 + 2.6; idle(pai, tc, 702, 0.2); sitPose(pai, 1, { seatY: 0.42 / 1.04, lean: 0.25 }); standFeet(pai); maoEm(pai, 1, frenteW(pai, -0.15, 0.85, 0.3), 1);
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([-0.8, 1.2, 4.6], [0.2, 1.1, 4.2], [-2.2, 0.8, 2.4], [-1.0, 0.8, 1.6], 42, 40)],
        [K.zombou - 0.3, mov([-0.6, 0.85, 1.6], [-0.4, 0.8, 1.3], [1.25, 0.9, 0.35], [1.25, 0.9, 0.35], 40, 36)],
        [K.cima - 0.3, mov([0.2, 1.4, 3.6], [0.4, 1.3, 3.0], [0.4, 0.6, 0.6], [0.8, 0.5, 0.5], 44, 40)],
        [K.verdade - 0.3, mov([2.6, 0.5, 0.9], [2.55, 0.48, 1.0], [1.45, 1.55, 1.75], [1.45, 1.6, 1.75], 42, 38)], // de baixo, o homem falando (o menino fica fora do quadro)
        [K.vizinho - 0.3, mov([4.6, 0.5, 5.6], [4.7, 0.55, 5.2], [5.5, 1.2, 1.5], [5.5, 1.25, 1.5], 40, 36)], // o velho contra o céu
        [K.importava - 0.3, mov([-3.8, 0.45, 1.4], [-3.5, 0.55, 2.6], [-4.6, 1.15, -2.4], [-4.6, 1.15, -2.4], 34, 40)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 5 · a noite: entra no barraco; a luz da janela apaga; sai com o dinheiro e foge; sozinho no escuro, a maldade sobe dele
addSet("g5-noite", (g) => {
  const __n = "g5-noite"; const [a, b] = T.sc[__n];
  const C = canteiroObras(g, { noite: true }); const k = meninoG(0.72); g.add(k); const spK = sombraPe(g, k, 0.8);
  const saco = naMaoG(k, 1, mesh(sph(0.07, 8, 6), k.userData.silM), 0, -0.12, 0.02); saco.scale.y = 1.3; const moeda = glowSprite(0xffd870, 0.12, 0); saco.add(moeda);
  olhosAcesos(k, 0xff4a3a, 0.8); const FU = fumacaEscura(g);
  const est = dustPts(400, [-120, 120, 30, 90, -160, -40], 0xdfe6ff, 0.35, 0.9, ADD, 7); g.add(est); const porta = [-5.2, 0, -2.75];
  return { ...LUZ_OBRA_NOITE, hand: 0.004,
    update(t) {
      C.upd(t); const jan = C.casaPai.userData.jan, gl = C.casaPai.userData.gl;
      const apaga = smr(t, K.matou + 0.1, K.matou + 0.5), tremula = t > K.matou - 0.3 && t < K.matou + 0.1 ? (Math.sin(t * 40) > 0 ? 1 : 0.3) : 1;
      jan.material.color.setRGB(lerp(1, 0.08, apaga) * tremula, lerp(0.69, 0.06, apaga) * tremula, lerp(0.38, 0.05, apaga) * tremula); if (gl) gl.material.opacity = 0.35 * (1 - apaga) * tremula;
      flash(t, K.matou + 0.1, 0.05, 0.9, [0.22, 0.0, 0.01]);
      restPose(k); saco.visible = t > K.dinheiro - 0.3; moeda.material.opacity = saco.visible ? 0.6 + 0.4 * Math.sin(t * 7) : 0;
      if (t < K.matou - 0.4) { k.position.set(-3.6, 0, -2.0); k.rotation.y = -Math.PI / 2 - 0.25; idle(k, t, 701, 0.2); standFeet(k); }
      else if (t < K.dinheiro - 0.3) { const f = smr(t, K.matou - 0.4, K.matou); gait(k, 1.4 * f, { from: [-3.6, 0, -2.0], ang: -Math.PI / 2 - 0.25, step: 0.45 }); k.visible = f < 0.98; }
      else if (t < K.conclusao - 0.3) { k.visible = true; const f = seg(t, K.dinheiro - 0.3, K.conclusao - 0.3); gait(k, 1.0 + 16 * f * f, { from: [-5.0, 0, -2.7], ang: Math.PI * 0.62, step: 0.75, run: smr(t, K.fugiu - 0.3, K.fugiu) }); }
      else { k.visible = true; k.position.set(2.0, 0, 3.0); k.rotation.y = t > K.devolver - 0.3 ? 0.15 : Math.PI * 0.85; idle(k, t, 701, 0.3); standFeet(k); pose(k, { neck: [0.25 - 0.45 * smr(t, K.mundo - 0.3, K.mundo + 0.5), 0, 0] }, 1); }
      spK(0); const mal = smr(t, K.devolver - 0.3, K.maldade + 0.2); olhosK(k, smr(t, K.maldade - 0.2, K.maldade + 0.2)); FU.upd(t, mal, V3(k.position.x, 0.2, k.position.z));
      floatDust(est, t, 0.02, 0.05);
    },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([-1.4, 1.2, 0.2], [-1.8, 1.15, -0.4], [-4.8, 1.0, -2.6], [-4.8, 1.0, -2.6], 42, 40)],
        [K.matou - 0.4, mov([-1.0, 2.0, 1.4], [-1.3, 1.9, 1.0], [-5.6, 1.3, -2.9], [-5.6, 1.3, -2.9], 40, 38)],
        [K.dinheiro - 0.3, mov([-3.4, 0.35, 0.6], [-3.2, 0.4, 0.8], [-4.8, 1.0, -2.4], [-3.8, 1.0, -1.2], 42, 42)],
        [K.fugiu - 0.3, mov([3.5, 0.45, 2.5], [4.0, 0.5, 2.0], [-1.0, 1.4, -8], [3.0, 1.4, -9], 46, 46)], // baixo: ele corre contra o horizonte
        [K.conclusao - 0.3, mov([4.0, 0.9, 6.2], [3.6, 0.9, 5.6], [2.0, 0.8, 3.0], [2.0, 0.8, 3.0], 42, 38)],
        [K.mundo - 0.3, mov([3.0, 1.2, 5.6], [5.0, 6.5, 12], [2.0, 1.0, 3.0], [0, 4, -40], 42, 52)], // sobe e mostra o mundo enorme
        [K.devolver - 0.3, (tt, u) => ({ ...closeRosto(k, lerp(1.1, 0.75, E.inOut(u)), 0.1, -0.03, 32) })],
      ], b); },
  };
});
