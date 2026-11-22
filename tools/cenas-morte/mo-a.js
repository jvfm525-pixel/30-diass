// ================================================================ vídeo: Demônio da Morte · cenas 0–5 (capa, gancho, escola, a regra, os Cavaleiros, a profecia, a onda, Discord)
const MDOF_C = { ap: 0.008, max: 0.014 }, MDOF_M = { ap: 0.005, max: 0.012 }, MDOF_L = { ap: 0.0025, max: 0.008 };
const LUZ_VAZIO_M = { bg: 0x07030a, fog: [12, 70], fogCol: 0x16060e, look: { exposure: 1.12, bloom: 0.6, bloomT: 0.74, vig: 0.6, sat: 1.08, con: 1.1, dof: MDOF_M, rosto: 0.45, lift: [0.02, 0.0, 0.01] },
  sun: { dir: [0.3, 0.8, -0.6], col: 0xff8aa0, I: 0.6, c: [0, 1, 0], r: 16 }, hemi: { sky: 0x3a1424, ground: 0x0a0406, I: 0.5 }, fill: { col: 0xffb0c0, I: 0.55, dir: [0.2, 0.3, 1] }, rim: { col: 0xff5a7a, str: 1.6 } };
const LUZ_SALA_POR = { bg: 0xffc890, fog: [14, 40], fogCol: 0xe8b890, look: { exposure: 1.05, bloom: 0.42, bloomT: 0.8, vig: 0.42, sat: 1.1, con: 1.06, dof: MDOF_C, rosto: 0.45, lift: [0.015, 0.006, 0] },
  sun: { dir: [-0.9, 0.45, 0.25], col: 0xffb070, I: 2.6, c: [0, 1, 0], r: 8 }, hemi: { sky: 0xffd8b0, ground: 0x5a4030, I: 0.75 }, fill: { col: 0xffe0c8, I: 0.45, dir: [0.5, 0.3, 1] }, rim: { col: 0xffc080, str: 1.1 } };
const LUZ_SALA_NOITE = { bg: 0x0a0e1a, fog: [10, 36], fogCol: 0x0c1220, look: { exposure: 1.14, bloom: 0.5, bloomT: 0.76, vig: 0.55, sat: 1.0, con: 1.1, dof: MDOF_C, rosto: 0.45, lift: [0, 0.006, 0.02] },
  sun: { dir: [-0.9, 0.55, 0.2], col: 0x9ab0ff, I: 1.3, c: [0, 1, 0], r: 8 }, hemi: { sky: 0x2a3456, ground: 0x0a0c10, I: 0.45 }, fill: { col: 0x8aa0d8, I: 0.3, dir: [0.4, 0.3, 1] }, rim: { col: 0xb8c8ff, str: 1.4 } };
const LUZ_CIDADE_M = { bg: 0x06040c, fog: [20, 160], fogCol: 0x120a1c, look: { exposure: 1.28, bloom: 0.6, bloomT: 0.76, vig: 0.5, sat: 1.1, con: 1.06, dof: MDOF_L, rosto: 0.45, lift: [0.01, 0.008, 0.02] },
  sun: { dir: [-0.4, 0.9, 0.5], col: 0xc8b8ff, I: 1.0, c: [0, 1, 0], r: 14 }, hemi: { sky: 0x6a5aa0, ground: 0x2a2030, I: 0.9 }, fill: { col: 0xd8e0ff, I: 0.5, dir: [0.4, 0.3, 0.8] }, rim: { col: 0xb8c8ff, str: 1.3 } };
const LUZ_SANGUE = { bg: 0xff6a2a, fog: [30, 160], fogCol: 0x8a2a1a, look: { exposure: 0.96, bloom: 0.32, bloomT: 0.84, vig: 0.5, sat: 1.12, con: 1.12, dof: MDOF_M, rosto: 0.5, lift: [0.02, 0, 0] },
  sun: { dir: [0, 0.12, -1], col: 0xff7a40, I: 1.5, c: [0, 1, -2], r: 14 }, hemi: { sky: 0xa83a2a, ground: 0x1a0606, I: 0.55 }, fill: { col: 0xffc0a0, I: 0.7, dir: [0.2, 0.3, 1] }, rim: { col: 0xff8a50, str: 1.4 } };

// brilho cor-de-rosa nos olhos da Morte (lê no escuro)
function olhosBrilho(p, cor = 0xff4a6a, tam = 0.035) { const u = p.userData, out = []; [-1, 1].forEach((k) => { const gl = glowSprite(cor, tam, 0); gl.position.set(k * 0.036, CAB.EY, surfZ(u.headM, k * 0.036, CAB.EY) + 0.012); u.head.add(gl); out.push(gl); }); u.olhosBr = out; return out; }
function brilhoK(p, k) { (p.userData.olhosBr || []).forEach((s) => { s.material.opacity = 0.45 * k; s.visible = k > 0.01; }); }
// pão / comida na mão
function pao() { const c = grp(null); const m = LPmat(0xd8a060, { rim: 0.4, rough: 0.8 }); const b = mesh(sph(0.05, 8, 6), m, 0, 0, 0, c); b.scale.set(1.6, 0.8, 0.9); return c; }
function pistola() { const c = grp(null), m = LPmat(0x1a1a1e, { metal: 0.6, rough: 0.35, rim: 0.6 }); mesh(box(0.06, 0.05, 0.3), m, 0, 0.04, 0.08, c); mesh(box(0.05, 0.14, 0.07), m, 0, -0.05, -0.04, c).rotation.x = 0.25; return c; }
// olhos gigantes de anéis no céu (textura do próprio olho)
function olhosCeu(g, pos, s = 12, cor = "#d83a52") { const tex = olhoTex(cor, { aneis: 4, corAnel: "#5a0a18", alt: 0.62 }), out = [];
  [-1, 1].forEach((k) => { const m = mesh(new THREE.PlaneGeometry(s, s * 0.78), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false }), pos[0] + k * s * 0.62, pos[1], pos[2], g); if (k < 0) m.scale.x = -1; m.castShadow = false; out.push(m); });
  return { set(k) { out.forEach((m) => { m.material.opacity = k; m.visible = k > 0.01; }); } }; }
// fumaça escura subindo (medo)
function fumacaMedo(g, origin, o = {}) { return steam(g, { origin, n: o.n ?? 14, size: o.size ?? 0.8, spread: o.spread ?? 0.6, rise: o.rise ?? 1.4, grow: 2.4, opacity: o.op ?? 0.5, life: 2.6, color: o.cor ?? 0x2a0a14, wind: [0, 0, 0] }); }

// ---------------------------------------------------------------- 0 · capa: a Morte (Fami) em close, luz vermelha, olhos de anéis
addSet("s0-capa", (g) => {
  vazio(g, 0x14040a, 0x5a1424, 0x050203); const mo = morteLP(); g.add(mo); olhosBrilho(mo);
  return { ...LUZ_VAZIO_M, hand: 0, look: { ...LUZ_VAZIO_M.look, dof: MDOF_C },
    update(t) { vive(mo, t, 711, { boca: "linha", palpebra: 0.62 }, 0.05); pose(mo, { neck: [0.05, 0, 0.12] }, 1); brilhoK(mo, 0.6); },
    cam() { return closeRosto(mo, 0.62, 0.08, -0.02, 30); } };
});

// ---------------------------------------------------------------- 1 · gancho: a silhueta gigante da Morte no escuro; demônios menores ajoelhados aos pés dela
addSet("m1-gancho", (g) => {
  const __n = "m1-gancho"; const [a, b] = T.sc[__n];
  vazio(g, 0x0a0206, 0x4a0e1c, 0x050203, { sunI: 0.4, sunDir: [0, 0.2, -1] });
  const ch = mesh(new THREE.PlaneGeometry(200, 200), SM(0x0c0608, { roughness: 0.25, metalness: 0.3 }), 0, 0, 0, g); ch.rotation.x = -Math.PI / 2;
  const mo = morteLP(); g.add(mo); mo.scale.setScalar(7.5); mo.position.set(0, 0, -14); olhosBrilho(mo, 0xff4a6a, 0.08);
  const dm = Array.from({ length: 7 }, (_, i) => { const d = demonioComum({ seed: 720 + i, cor: [0x2a1a24, 0x1a2420, 0x24201a][i % 3], scale: 1.3 + hash(i) * 0.6, olho: [0xffd040, 0x9aff6a, 0xff9a3a][i % 3] }); g.add(d);
    const an = -1.1 + i * 0.37; d.position.set(Math.sin(an) * 7, 0, -14 + Math.cos(an) * 7); d.rotation.y = an + Math.PI; return d; });
  const nev = steam(g, { origin: [0, 0.2, -6], n: 16, size: 4, spread: 10, rise: 0.12, grow: 1.2, opacity: 0.25, life: 6, color: 0x5a1a2a, wind: [0.2, 0, 0] });
  return { ...LUZ_VAZIO_M, hand: 0.004,
    update(t) { nev.upd(t, 1); vive(mo, t, 711, { boca: "linha", palpebra: 0.6 }, 0.06); pose(mo, { neck: [0.18, 0, 0.08] }, 1); brilhoK(mo, smr(t, a + 0.4, K.demonio));
      const cur = smr(t, K.outros - 0.4, K.outros + 0.5); dm.forEach((d, i) => { restPose(d); idle(d, t, 720 + i, 0.2); kneelPose(d, cur); pose(d, { spine: [0.6 * cur, 0, 0], neck: [0.4 * cur, 0, 0] }, 1); standFeet(d); }); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0, 1.0, 22], [0, 1.4, 16], [0, 9, -14], [0, 10, -14], 50, 46)],
        [K.demonio - 0.3, (tt, u) => ({ ...closeRosto(mo, lerp(7.5, 5.6, E.inOut(u)), 0.4, -0.1, 32), near: 0.1 })],
        [K.outros - 0.35, mov([8, 1.4, 9], [7, 1.6, 8], [0, 7, -14], [0, 8, -14], 54, 52)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 1b · na escola: o Denji entediado na carteira; do lado, a "Fami" comendo pão
addSet("m1b-escola", (g) => {
  const __n = "m1b-escola"; const [a, b] = T.sc[__n];
  skyDome(g, { top: 0xffb070, hor: 0xffd8a8, ground: 0x6a4a30, sunDir: [-0.9, 0.35, 0.2], sunI: 0.8, cov: 0 });
  const S = salaAula(g, { por: true }); const de = denjiLP(), mo = morteLP(); g.add(de, mo); olhosBrilho(mo);
  const pa = pao(); naMao(mo, 1, pa, { dy: -0.07, dz: 0.03 });
  const po = dustPts(120, [-4.5, 4.5, 0.3, 3, -5, 6], 0xffe0b0, 0.025, 0.6); g.add(po);
  return { ...LUZ_SALA_POR, hand: 0.004,
    update(t) { floatDust(po, t, 0.2, 0.1); S.senta(de, 2, 1); idle(de, t, 712, 0.1); rostoLP(de, t, { boca: "dentes", palpebra: 0.55, abre: 0.85 }); // o sorriso de tubarão do Denji pose(de, { spine: [0.12, 0, 0], neck: [0.2, 0.25, 0.15] }, 1);
      S.senta(mo, 3, 1); idle(mo, t, 711, 0.08); const vira = smr(t, K.spoiler - 0.3, K.spoiler + 0.3); pose(mo, { neck: [0.05, -0.9 * vira, 0] }, 1);
      const mord = mordidas(t, [a + 0.5, a + 1.9], 0.9); maoEm(mo, 1, bocaW(mo, 0.06), 0.35 + 0.65 * mord, { abre: 0.3 }); rostoLP(mo, t, { boca: "linha", mastigar: mord > 0.3 ? 1 : 0, palpebra: 0.6, piscaCada: 99 }); brilhoK(mo, smr(t, K.spoiler - 0.1, K.spoiler + 0.3)); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.2, 1.2, -2.7], [0.15, 1.18, -2.45], [0.05, 1.05, -0.9], [0.05, 1.05, -0.9], 40, 38)],
        [K.denji - 0.3, mov([0.95, 1.2, -2.6], [1.05, 1.18, -2.4], [0.55, 1.05, -0.9], [1.1, 1.05, -0.9], 40, 38)],
        [K.spoiler - 0.25, (tt, u) => ({ ...closeRosto(mo, lerp(0.75, 0.55, E.inOut(u)), -0.05, -0.02, 30) })],
      ], b); },
  };
});

// ---------------------------------------------------------------- 2 · a regra: Shibuya à noite; o medo das pessoas sobe como fumaça e vira demônio; arma, escuro, altura; todos olham pro céu
addSet("m2-regra", (g) => {
  const __n = "m2-regra"; const [a, b] = T.sc[__n];
  const SB = shibuyaCruz(g);
  const C = Array.from({ length: 16 }, (_, i) => { const p = civilLP(i); g.add(p); const an = hash(i * 3.7) * 6.28, r = 1.5 + hash(i * 1.9) * 5; p.position.set(Math.cos(an) * r, 0, Math.sin(an) * r); p.rotation.y = hash(i * 5.3) * 6.28; return p; });
  const fum = C.slice(0, 8).map((p) => fumacaMedo(g, [p.position.x, 1.4, p.position.z], { op: 0.45 }));
  const som = demonioComum({ seed: 730, cor: 0x0a0608, scale: 7, olho: 0xff3a3a }); g.add(som); som.position.set(0, 0, -16); som.visible = false;
  const pi = pistola(); g.add(pi); pi.scale.setScalar(6); pi.position.set(-3, 4.6, -2); const piL = glowSprite(0xffd8a0, 1.6, 0); pi.add(piL);
  const esc = mesh(new THREE.SphereGeometry(3.2, 20, 14), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 }), 4, 1.5, -1, g); esc.castShadow = false;
  const OC = olhosCeu(g, [0, 46, -80], 16);
  return { ...LUZ_CIDADE_M, hand: 0.005,
    update(t) { SB.brilho(t, 1); const km = smr(t, K.medo - 0.3, K.medo + 0.8); fum.forEach((f) => f.upd(t, km));
      const kf = smr(t, K.forte - 0.4, K.forte + 1.0); som.visible = kf > 0.01; som.position.y = -10 * (1 - kf); restPose(som); idle(som, t, 730, 0.2); olhosK(som, kf);
      const ka = smr(t, K.arma - 0.2, K.arma + 0.2) * (1 - smr(t, K.escuro, K.escuro + 0.3)); pi.visible = ka > 0.01; pi.rotation.y = t * 0.8; piL.material.opacity = 0.22 * ka;
      esc.material.opacity = 0.92 * smr(t, K.escuro - 0.1, K.escuro + 0.2) * (1 - smr(t, K.altura, K.altura + 0.3));
      const olha = smr(t, K.todo - 0.2, K.todo + 1.2); C.forEach((p, i) => { vive(p, t, 760 + i, { boca: olha > 0.5 ? "aberta" : "linha", treme: olha, abre: 0.6 + 0.5 * olha, palpebra: 1 }, 0.25); pose(p, { neck: [-0.75 * olha, 0, 0], chest: [-0.15 * olha, 0, 0] }, 1); });
      OC.set(0.9 * smr(t, K.morrer - 1.2, K.morrer + 0.4)); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([4, 9, 22], [3, 6, 15], [0, 1.2, 0], [0, 1.4, 0], 46, 44)],
        [K.medo - 0.3, mov([-6, 1.4, 8], [-5, 1.6, 7], [0, 2.5, 0], [0, 4, -4], 44, 46)],
        [K.forte - 0.3, mov([0, 1.0, 12], [0, 1.4, 10], [0, 6, -16], [0, 11, -16], 50, 50)],
        [K.arma - 0.3, mov([-6.5, 3.4, 4], [-6, 3.6, 3], [-3, 4.4, -2], [-3, 4.6, -2], 40, 38)],
        [K.escuro - 0.15, mov([8.5, 2.0, 5], [8, 2.1, 4], [4, 1.5, -1], [4, 1.6, -1], 42, 40)],
        [K.altura - 0.15, mov([2, 1.2, 4], [2, 1.0, 4], [10, 10, -30], [16, 40, -30], 50, 54)],
        [K.todo - 0.3, mov([0, 0.6, 6], [0, 0.8, 5], [0, 2.4, 0], [0, 2.8, 0], 52, 50)],
        [K.morrer - 1.6, mov([0, 1.2, 9], [0, 1.0, 7.5], [0, 14, -40], [0, 30, -80], 50, 54)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 3 · os Quatro Cavaleiros no morro contra o pôr do sol vermelho
addSet("m3-cavaleiros", (g) => {
  const __n = "m3-cavaleiros"; const [a, b] = T.sc[__n];
  const M = morroVermelho(g);
  const mk = makimaLP(), yo = yoruLP(), mo = morteLP(), fo = fomeLP(); const Q = [mk, yo, mo, fo];
  Q.forEach((p, i) => { g.add(p); p.position.set(-1.65 + i * 1.1, 0.27, i === 2 ? 0.35 : 0); });
  olhosBrilho(mk, 0xffd060, 0.05); olhosBrilho(yo, 0xff3a3a, 0.05); olhosBrilho(mo, 0xff4a6a, 0.06); olhosBrilho(fo, 0x6aff8a, 0.05);
  return { ...LUZ_SANGUE, hand: 0.004,
    update(t) { M.upd(t); const tn = [K.makima, K.yoru, K.morte, K.fome];
      const RO = [{ boca: "sorriso", palpebra: 0.8 }, { boca: "smirk", palpebra: 0.9, bravo: 0.4 }, { boca: "linha", palpebra: 0.6 }, { boca: "triste", palpebra: 0.95, triste: 0.8, choro: 0.6 }];
      Q.forEach((p, i) => { vive(p, t, 740 + i, { ...RO[i], piscaCada: 99 }, 0.12); cabeloVento(p, t, 0.6, [1, 0, 0.2]);
        const k = i === 2 ? smr(t, K.morte - 0.3, K.morte + 0.3) : smr(t, tn[i] - 0.25, tn[i] + 0.3); brilhoK(p, Math.max(k, smr(t, K.cavaleiros - 0.2, K.cavaleiros + 0.5))); });
      if (mk.userData.tranca) mk.userData.tranca.rotation.z = 0.08 * Math.sin(t * 1.6); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.6, 1.6, 8], [0.4, 1.5, 6.5], [0.3, 1.4, 0], [0.4, 1.4, 0], 40, 38)],
        [K.morte - 0.3, (tt, u) => ({ ...closeRosto(mo, lerp(0.95, 0.72, E.inOut(u)), 0.15, -0.02, 30) })],
        [K.velha - 0.35, mov([-3.0, 1.5, 3.2], [-2.6, 1.5, 3.0], [-1.2, 1.45, 0], [-1.0, 1.45, 0], 38, 36)],
        [K.makima - 0.2, (tt, u) => ({ ...closeRosto(mk, lerp(0.9, 0.75, E.inOut(u)), 0.12, -0.02, 30) })],
        [K.yoru - 0.2, (tt, u) => ({ ...closeRosto(yo, lerp(0.9, 0.75, E.inOut(u)), -0.12, -0.02, 30) })],
        [K.fome - 0.2, (tt, u) => ({ ...closeRosto(fo, lerp(0.9, 0.75, E.inOut(u)), 0.12, -0.02, 30) })],
        [K.cavaleiros - 0.35, mov([0, 0.5, 9], [0, 0.6, 7.2], [0.1, 1.5, 0], [0.1, 1.6, 0], 42, 40)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 4 · a profecia: Shibuya à noite; a porta do Inferno abre no céu, a Morte desce, as luzes apagam, demônios nos telhados
addSet("m4-profecia", (g) => {
  const __n = "m4-profecia"; const [a, b] = T.sc[__n];
  const SB = shibuyaCruz(g);
  const PO = portaInferno(g, [0, 34, -70], 4.5, 0xd88a7a);
  const mo = silhueta(morteLP()); g.add(mo); mo.scale.setScalar(5); olhosBrilho(mo, 0xff4a6a, 0.09);
  const dm = Array.from({ length: 9 }, (_, i) => { const d = silhueta(demonioComum({ seed: 750 + i, scale: 1.6 + hash(i) * 1.2, olho: 0xff4a3a })); g.add(d); const an = -1.2 + i * 0.3; d.position.set(Math.sin(an) * (12 + i), 0, -6 - Math.cos(an) * 10); d.rotation.y = an * 0.5; return d; });
  const C = Array.from({ length: 10 }, (_, i) => { const p = civilLP(i); g.add(p); p.position.set(-4 + hash(i * 2.1) * 8, 0, 2 + hash(i * 3.3) * 6); p.rotation.y = Math.PI + (hash(i) - 0.5); return p; });
  return { ...LUZ_CIDADE_M, hand: 0.005,
    update(t) { SB.brilho(t, 1); const ap = smr(t, K.julho - 0.2, K.julho + 0.6); PO.g.visible = ap > 0.01; PO.g.scale.setScalar(4.5 * (0.6 + 0.4 * ap)); PO.abre(smr(t, K.descer - 0.6, K.descer + 0.2));
      const de = smr(t, K.descer, K.humanidade + 0.6); mo.visible = de > 0.005; mo.position.set(0, 30 - 30 * de, -64 + 40 * de); restPose(mo); idle(mo, t, 711, 0.05); brilhoK(mo, de);
      escurece(t, K.humanidade - 0.2, K.humanidade + 0.8, [0, 0, 0], 0.45);
      const ke = smr(t, K.era - 0.3, K.era + 0.6); dm.forEach((d, i) => { d.visible = ke > 0.02; restPose(d); idle(d, t, 750 + i, 0.2); d.position.y = -4 * (1 - smr(t, K.era - 0.3 + i * 0.06, K.era + 0.4 + i * 0.06)); olhosK(d, ke); });
      C.forEach((p, i) => { vive(p, t, 770 + i, { boca: t > K.descer ? "aberta" : "linha", treme: t > K.descer ? 1 : 0, palpebra: 1 }, 0.2); pose(p, { neck: [-0.7, 0, 0] }, 1); }); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0, 1.2, 14], [0, 1.0, 12], [0, 18, -60], [0, 26, -70], 52, 52)],
        [K.julho - 0.3, mov([0, 1.6, 10], [0, 1.4, 8], [0, 34, -70], [0, 40, -70], 46, 48)],
        [K.descer - 0.3, mov([6, 1.4, 12], [4, 1.6, 9], [0, 22, -50], [0, 10, -30], 50, 52)],
        [K.humanidade - 0.3, mov([10, 22, 30], [8, 18, 24], [0, 4, -20], [0, 3, -16], 50, 50)],
        [K.era - 0.3, mov([-3, 1.1, 10], [-2.4, 1.2, 8], [6, 3, -10], [8, 3.5, -10], 46, 44)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 4b · a onda: a Morte dorme flutuando; o pulso sai dela, a onda negra atravessa a cidade e derruba todo mundo
addSet("m4b-onda", (g) => {
  const __n = "m4b-onda"; const [a, b] = T.sc[__n];
  const SB = shibuyaCruz(g);
  const sala = grp(g, 400, 0, 0); const bolha = mesh(new THREE.SphereGeometry(18, 24, 16), new THREE.MeshBasicMaterial({ color: 0x0a0206, side: THREE.BackSide, fog: false }), 0, 4, 0, sala); bolha.castShadow = false;
  const mo = morteLP(); sala.add(mo); olhosBrilho(mo);
  const aneis = Array.from({ length: 4 }, (_, i) => { const r = mesh(new THREE.TorusGeometry(1, 0.02, 6, 64), new THREE.MeshBasicMaterial({ color: 0xff4a7a, transparent: true, opacity: 0, blending: ADD, depthWrite: false }), 0, 1.4, 0, sala); r.rotation.x = Math.PI / 2; r.castShadow = false; return r; });
  const C = Array.from({ length: 18 }, (_, i) => { const p = civilLP(i); g.add(p); p.position.set(-6 + hash(i * 2.1) * 12, 0, -10 + hash(i * 3.3) * 16); p.rotation.y = hash(i * 7) * 6.28; return p; });
  const onda = mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x0a0004, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }), 0, 0, -40, g); onda.castShadow = false;
  const tOnda = K.explodir - 0.3, vel = 30;
  return { ...LUZ_CIDADE_M, hand: 0.004,
    update(t) { SB.brilho(t, 1);
      restPose(mo); mo.position.set(0, 1.3 + 0.08 * Math.sin(t * 1.2), 0.8); mo.rotation.set(-Math.PI / 2 + 0.25, 0, 0.3 + t * 0.03); pose(mo, { spine: [0.25, 0, 0], neck: [0.15, 0, 0], armR: [-0.3, 0, -0.3, -1.2], armL: [-0.3, 0, 0.3, -1.2], legR: [-0.5, 0.05, 0, 0.9, 0], legL: [-0.3, -0.05, 0, 0.6, 0] }, 1);
      rostoLP(mo, t, { boca: "linha", palpebra: 0, piscaCada: 99 }); brilhoK(mo, 0);
      aneis.forEach((r, i) => { const ph = ((t - K.sozinho) * 0.45 + i / 4) % 1, on = t > K.sozinho - 0.2 ? 1 : 0; r.scale.setScalar(0.5 + ph * 12); r.material.opacity = on * 0.8 * (1 - ph); });
      const R = Math.max(0.01, (t - tOnda) * vel); onda.visible = t > tOnda; onda.scale.set(R, R * 0.35, R);
      C.forEach((p, i) => { const d = Math.hypot(p.position.x, p.position.z + 40), cai = smr(t, tOnda + (d - 1) / vel, tOnda + (d - 1) / vel + 0.6);
        vive(p, t, 790 + i, { boca: cai > 0.02 && cai < 0.7 ? "grito" : cai >= 0.7 ? "aberta" : "linha", treme: cai < 0.7 ? cai * 2 : 0, palpebra: 1 - cai }, 0.2 * (1 - cai)); p.rotation.x = -1.45 * cai; p.position.y = 0.12 * cai; }); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      const sono = () => (tt, u) => ({ ...closeRosto(mo, lerp(1.6, 1.1, E.inOut(u)), 0.3, 0.1, 34) });
      return planos(t, [
        [a, sono()],
        [K.sozinho - 0.3, (tt, u) => ({ pos: [400 + Math.sin(0.6 + u * 0.8) * 8, 3 + u * 2, Math.cos(0.6 + u * 0.8) * 8], look: [400, 1.2, 0], fov: 44, near: 0.03 })],
        [K.explodir - 0.4, mov([0, 7, 16], [0, 5, 12], [0, 1, -30], [0, 1, -10], 52, 50)],
        [K.mata - 0.3, mov([-6, 1.2, 8], [-5, 1.0, 7], [0, 0.6, 0], [0, 0.4, 0], 46, 44)],
        [K.inconsciente - 0.3, (tt, u) => ({ ...closeRosto(mo, lerp(0.85, 0.65, E.inOut(u)), 0.1, 0.0, 30) })],
      ], b); },
  };
});

// ---------------------------------------------------------------- 5 · Discord: holograma da Morte girando na plataforma (mesmo formato dos outros vídeos)
addSet("m5-discord", (g) => {
  const [a, b] = T.sc["m5-discord"];
  vazio(g, 0x0c0a14, 0x3a3a5a, 0x06050a);
  const grade = new THREE.GridHelper(24, 48, 0xffa8c0, 0x3a2030); grade.material.transparent = true; grade.material.opacity = 0.5; g.add(grade);
  const ch = mesh(new THREE.PlaneGeometry(40, 40), SM(0x0a0a12, { roughness: 0.5, metalness: 0.2 }), 0, -0.005, 0, g); ch.rotation.x = -Math.PI / 2;
  const gira = grp(g); mesh(cyl(0.62, 0.66, 0.15, 40), SM(0x14161e, { roughness: 0.4, metalness: 0.4 }), 0, 0.075, 0, gira);
  const aro = mesh(new THREE.TorusGeometry(0.64, 0.012, 6, 64), new THREE.MeshBasicMaterial({ color: 0xffa8c0 }), 0, 0.15, 0, gira); aro.rotation.x = Math.PI / 2; aro.castShadow = false;
  const mo = morteLP(); g.add(mo); const fi = morteLP(); g.add(fi); const wm = new THREE.MeshBasicMaterial({ color: 0xffa8c0, wireframe: true, transparent: true, opacity: 0.85 });
  fi.traverse((x) => { if (x.isMesh) { x.material = wm; x.castShadow = false; } });
  const scan = mesh(new THREE.TorusGeometry(0.5, 0.01, 6, 64), new THREE.MeshBasicMaterial({ color: 0xfff0f4, transparent: true, opacity: 0, blending: ADD, depthWrite: false }), 0, 0.15, 0, g); scan.rotation.x = Math.PI / 2; scan.castShadow = false;
  const p = dustPts(160, [-3, 3, 0.1, 3.5, -3, 1], 0xffa8c0, 0.03, 0.7); g.add(p); const tTroca = K.link - 0.25;
  return { bg: 0x0c0a14, fog: [6, 30], fogCol: 0x10121c, hand: 0, look: { exposure: 1.1, bloom: 0.7, bloomT: 0.74, vig: 0.5, sat: 1.05, con: 1.06, rosto: 0.5 },
    sun: { dir: [0.4, 0.8, 0.8], col: 0xfff0f4, I: 1.8, c: [0, 1, 0], r: 4 }, hemi: { sky: 0x8a5a7a, ground: 0x0a0a14, I: 0.8 }, fill: { col: 0xffa8c0, I: 0.5, dir: [-0.6, 0.3, -0.5] }, rim: { col: 0xffb8c8, str: 1.4 },
    update(t) { floatDust(p, t, 0.3, 0.15); gira.rotation.y = 0.6 + (t - a) * 0.9;
      [mo, fi].forEach((q) => { q.rotation.y = gira.rotation.y; q.position.set(0, 0.15, 0); restPose(q); idle(q, t, 711, 0.06); standFeet(q); }); rostoLP(mo, t, { boca: "linha", palpebra: 0.62 });
      const k = seg(t, tTroca - 0.35, tTroca + 0.35); mo.visible = t > tTroca; fi.visible = t <= tTroca + 0.05; scan.position.y = 0.15 + 2.0 * k; scan.material.opacity = k > 0 && k < 1 ? 0.9 : 0; scan.scale.setScalar(1 - 0.4 * Math.sin(k * Math.PI)); },
    cam(t) { return { ...path2(t, [[a, [0.3, 1.5, 4.6], [0, 1.05, 0], 40], [b, [0.2, 1.45, 3.8], [0, 1.05, 0], 38]]), near: 0.03 }; } };
});
