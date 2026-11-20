// ================================================================ vídeo: Sukuna · cenas 0–5 (capa, abertura, reformatório, jaula, Dez Sombras, Discord)

// ---------------------------------------------------------------- utilidades de personagem
function vive(p, t, seed, rosto = {}, amt = 0.4) { restPose(p); idle(p, t, seed, amt); standFeet(p); rostoLP(p, t, rosto); }
// linha dos olhos (mundo) e os dois olhos (o direito do personagem fica no -x local)
function olhosW(p) { p.updateMatrixWorld(true); return p.userData.head.localToWorld(V3(0, CAB.EY, CAB.HW * 0.9)); }
function olhoW(p, lado = -1) { p.updateMatrixWorld(true); return p.userData.head.localToWorld(V3(lado * 0.036, CAB.EY, CAB.HW * 1.0)); }
function peitoW(p) { p.updateMatrixWorld(true); return p.userData.chest.localToWorld(V3(0, 0.16, 0.12)); }
const arr = (v) => [v.x, v.y, v.z];
const add3 = (v, d) => [v.x + d[0], v.y + d[1], v.z + d[2]];
// sinal de mãos do Megumi (mãos juntas na frente do peito)
function sinalMaos(p, k) { if (k <= 0) return; pose(p, { armR: [-0.62, 0, 0.5, -1.45], armL: [-0.62, 0, -0.5, -1.45], handR: 0.55, handL: 0.55, chest: [0.05, 0, 0] }, clamp(k)); }
// poça de sombra que se espalha no chão
function pocaSombra(g, x, z, cor = 0x000000) {
  const tex = canvasTex(256, 256, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.7, "rgba(0,0,0,.92)"); gr.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  const m = mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: tex, color: cor, transparent: true, depthWrite: false }), x, 0.015, z, g); m.rotation.x = -Math.PI / 2; m.castShadow = m.receiveShadow = false; m.renderOrder = 2;
  return { m, set(r) { m.scale.setScalar(Math.max(0.001, r)); m.visible = r > 0.01; } };
}

// ---------------------------------------------------------------- mundo da abertura e do fecho: vazio preto e vermelho
function mundoVermelho(g) {
  const dome = vazio(g, 0x080204, 0x4a0a10, 0x050102, { sunCol: 0xff3030, sunI: 0.35, disk: 0.6, sunDir: [0, 0.06, -1] });
  palcoPreto(g, { cor: 0xff3a3a, op: 0.28, linhas: 12, chao: 0x070304 });
  const brasa = dustPts(160, [-8, 8, 0.2, 5, -12, 4], 0xff5a40, 0.035, 0.6); g.add(brasa);
  return { dome, brasa };
}

// ---------------------------------------------------------------- 0 · capa (thumb): o Megumi com os olhos do Sukuna
addSet("s0-capa", (g) => {
  const M = mundoVermelho(g);
  const sm_ = sukunaMegumiLP(); g.add(sm_);
  const yu = yujiLP(); g.add(yu); yu.position.set(-1.6, 0, -6); yu.rotation.y = Math.PI;
  return {
    bg: 0x080204, fog: [6, 40], fogCol: 0x1a0406, dome: M.dome, hand: 0,
    look: { exposure: 1.1, bloom: 0.7, bloomT: 0.72, vig: 0.55, sat: 1.1, con: 1.08 },
    sun: { dir: [0.4, 0.5, -0.8], col: 0xff5040, I: 2.2, c: [0, 1.5, 0], r: 6 }, hemi: { sky: 0x6a2028, ground: 0x100204, I: 0.7 }, fill: { col: 0xffd0c0, I: 0.9, dir: [-0.3, 0.3, 1] }, rim: { col: 0xff6a50, str: 0.9 },
    update(t) { vive(sm_, t, 22, { boca: "risada", bravo: 0.7, piscaCada: 99 }, 0.15); vive(yu, t, 11, {}, 0.3); },
    cam() { const e = olhosW(sm_); return { pos: add3(e, [0.18, -0.02, 0.62]), look: add3(e, [0.02, -0.06, 0]), fov: 30, near: 0.03 }; },
  };
});

// ---------------------------------------------------------------- 1 · abertura: o Yuji ao longe, de costas; o orbe vermelho sai dele e entra no Megumi
addSet("s1-abertura", (g) => {
  const [a, b] = T.sc["s1-abertura"];
  const M = mundoVermelho(g);
  const yu = yujiLP(); g.add(yu); yu.position.set(-2.4, 0, -3.2); yu.rotation.y = Math.PI * 0.92;
  const mg = megumiLP(), smg = sukunaMegumiLP(); [mg, smg].forEach((p) => { g.add(p); p.position.set(0.9, 0, 0); p.rotation.y = -0.15; });
  const orb = orbe(g, 0xff2a2a, 0.55);
  const t0 = K.abandonou, t1 = K.yuji1 + 0.4, t2 = K.megumi1;
  return {
    bg: 0x080204, fog: [6, 40], fogCol: 0x1a0406, dome: M.dome, hand: 0,
    look: { exposure: 1.1, bloom: 0.75, bloomT: 0.7, vig: 0.5, sat: 1.08, con: 1.06 },
    sun: { dir: [0.3, 0.45, -0.85], col: 0xff4a3a, I: 2.4, c: [-0.5, 1.2, -1.5], r: 8 }, hemi: { sky: 0x5a1820, ground: 0x0a0204, I: 0.6 }, fill: { col: 0xffd8c8, I: 0.75, dir: [-0.4, 0.3, 1] }, rim: { col: 0xff6a50, str: 0.9 },
    update(t) {
      flash(t, a, 0.001, 0.5);
      vive(yu, t, 11, {}, 0.3);
      const vira = t >= t2; mg.visible = !vira; smg.visible = vira;
      vive(mg, t, 21, { boca: "linha", bravo: 0.2 }, 0.3); vive(smg, t, 22, { boca: "sorriso", bravo: 0.6 + 0.2 * smr(t, t2, t2 + 1) }, 0.3);
      // orbe: acende no peito do Yuji, voa em arco e entra no Megumi
      const pY = peitoW(yu), pM = peitoW(vira ? smg : mg), u = smr(t, t1, t2);
      const p = V3().lerpVectors(pY, pM, E.inOut(u)); p.y += Math.sin(u * Math.PI) * 0.9;
      orb.o.position.copy(p); orb.set(smr(t, t0 - 0.2, t0 + 0.4) * (1 - smr(t, t2 - 0.05, t2 + 0.25)), t);
      flash(t, t2 + 0.02, 0.05, 0.35, [1, 0.35, 0.3]);
      floatDust(M.brasa, t, 0.25, 0.2);
      // entra no olho no fim da cena
      escurece(t, b - 0.35, b, [0.25, 0.02, 0.02], 1);
    },
    cam(t) {
      const e = olhoW(smg, -1);
      return { ...path2(t, [
        [a, [1.6, 1.7, 5.6], [-0.6, 1.3, -1.2], 36],
        [t2, [1.7, 1.65, 3.0], [0.4, 1.45, -0.6], 34],
        [K.antes, [1.1, 1.7, 1.25], add3(e, [0, -0.04, 0]), 30],
        [b, add3(e, [0.0, 0.0, 0.07]), arr(e), 26],
      ]), near: 0.01 };
    },
  };
});

// ---------------------------------------------------------------- 2 · o primeiro olhar: pátio alagado do reformatório, noite de chuva
addSet("s2-olhar", (g) => {
  const [a, b] = T.sc["s2-olhar"];
  const dome = vazio(g, 0x05070e, 0x1a2436, 0x05060a, { sunCol: 0x8aa0d0, sunI: 0.1 });
  const chao = mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.22, metalness: 0.45 }), 0, 0, 0, g); chao.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 9; i++) { const pd = mesh(new THREE.CircleGeometry(0.6 + hash(i) * 1.4, 10), new THREE.MeshStandardMaterial({ color: 0x0e1218, roughness: 0.05, metalness: 0.8 }), (hash(i * 3) - 0.5) * 12, 0.006, (hash(i * 5) - 0.5) * 10, g); pd.rotation.x = -Math.PI / 2; pd.castShadow = false; }
  // prédios de concreto em volta, com janelas apagadas e uma ou outra acesa
  const conc = LPmat(0x4a4e56, { rim: 0.3, rough: 0.95 });
  [[0, -9, 26, 9, 2], [-11, -1, 2, 8, 18], [11, -1, 2, 7, 18]].forEach(([x, z, w, h, d]) => {
    mesh(box(w, h, d), conc, x, h / 2, z, g);
    for (let i = 0; i < 18; i++) { const lit = hash(i * 7.1 + x) > 0.82; const jx = d > w ? x + (x < 0 ? 1.02 : -1.02) : x + (i % 9 - 4) * 2.6, jz = d > w ? z + (i % 9 - 4) * 1.9 : z + 1.02, jy = 1.6 + Math.floor(i / 9) * 2.6; const j = mesh(box(d > w ? 0.05 : 1.1, 1.1, d > w ? 0.9 : 0.05), new THREE.MeshStandardMaterial({ color: lit ? 0xffd8a0 : 0x101418, emissive: lit ? 0xffb060 : 0x000000, emissiveIntensity: lit ? 1.2 : 0, roughness: 0.3 }), jx, jy, jz, g); j.castShadow = false; }
  });
  // postes de luz fria
  const postes = [[-4.5, 2.5], [4.5, -2.5]].map(([x, z]) => { mesh(cyl(0.06, 0.08, 4.2, 6), LPmat(0x30343c), x, 2.1, z, g); const l = new THREE.PointLight(0x9ab8ff, 9, 12, 1.6); l.position.set(x, 4.1, z); g.add(l); const s = glowSprite(0xbfd4ff, 1.4, 0.8); s.position.set(x, 4.15, z); g.add(s); return l; });
  const ch = chuva(g, { n: 1100, area: [-9, 9, 0, 9, -8, 7], op: 0.38 }), rp = respingos(g, 60, [-6, 6, -4, 5]);
  // o Sukuna (no corpo do Yuji) e o Megumi; os cães saem da sombra do Megumi
  const sk = sukunaYujiLP(); g.add(sk); sk.position.set(-1.05, 0, 0); sk.rotation.y = Math.PI / 2 - 0.15;
  const mg = megumiLP(); g.add(mg); mg.position.set(1.05, 0, 0.15); mg.rotation.y = -Math.PI / 2 - 0.1;
  const poca = pocaSombra(g, 1.35, 0.15);
  const lb = loboLP({ cor: 0xe8e8ee, escuro: 0x2a2a32 }), lp = loboLP({ cor: 0x1c1c22, escuro: 0xd8d8e0, olho: 0xf2f2f2 }); g.add(lb, lp);
  const TU = trocaCorPrep(sk, 0xffc860);
  const tC = K.lutou, tD = K.megumi2 + 0.2;
  return {
    bg: 0x05070e, fogExp: 0.045, fogCol: 0x0c1220, dome, hand: 0,
    look: { exposure: 1.2, bloom: 0.55, bloomT: 0.78, vig: 0.5, sat: 0.95, con: 1.06, lift: [0.0, 0.01, 0.03] },
    sun: { dir: [0.3, 0.9, 0.4], col: 0x9ab0e0, I: 0.9, c: [0, 1, 0], r: 8 }, hemi: { sky: 0x3a4a6a, ground: 0x0a0c12, I: 0.55 }, fill: { col: 0xff9a60, I: 0.35, dir: [-0.6, 0.3, 0.6] }, rim: { col: 0xbfd4ff, str: 0.8 },
    update(t) {
      ch.update(t); rp.update(t);
      vive(sk, t, 12, { boca: "risada", bravo: 0.65 }, 0.35); pose(sk, { spine: [0.12, 0, 0], armR: [0.1, 0, -0.3, -0.5], armL: [0.1, 0, 0.3, -0.5] }, 0.7);
      vive(mg, t, 21, { boca: "linha", bravo: 0.45 }, 0.3); sinalMaos(mg, smr(t, tC - 0.6, tC));
      poca.set(lerp(0, 1.6, E.out(smr(t, tC, tC + 1.0))));
      [[lb, 1.75, -0.75, 1], [lp, 1.85, 1.05, 4]].forEach(([d, x, z, sd]) => { const k = E.outBack(smr(t, tD, tD + 0.9)); d.position.set(x, lerp(-1.4, 0, k), z); d.rotation.y = -Math.PI / 2 + (z > 0 ? 0.25 : -0.25); d.visible = k > 0.01; loboAnim(d, t, { seed: sd, rosna: 0.7 }); });
      TU.uY.value = lerp(-0.2, 2.4, smr(t, b - 1.3, b));
    },
    cam(t) {
      const e = olhosW(sk);
      return planos(t, [
        [a, mov([3.6, 5.2, 7.2], [2.6, 3.4, 5.6], [0, 0.8, 0], [0, 1.0, 0], 38, 36)],
        [tC, mov([-2.9, 0.75, 1.5], [-2.5, 0.95, 0.8], [1.3, 1.1, 0.1], [1.3, 1.2, 0.1], 36, 34)],
        [K.partir, (tt, u) => { const k = E.inOut(u); return { pos: add3(e, [lerp(0.95, 0.5, k), lerp(-0.02, 0.0, k), lerp(0.42, 0.22, k)]), look: arr(e), fov: lerp(32, 28, k), near: 0.02 }; }],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 3 · a jaula: mundo preto e dourado; a casa de luz vira jaula
addSet("s3-jaula", (g) => {
  const [a, b] = T.sc["s3-jaula"];
  const dome = vazio(g, 0x040302, 0x2a1c08, 0x020101, { sunCol: 0xffc860, sunI: 0.2 });
  palcoPreto(g, { cor: 0xffc860, op: 0.5, linhas: 16, fz: 0 });
  const ouro = dustPts(220, [-7, 7, 0.1, 5, -9, 4], 0xffd890, 0.03, 0.7); g.add(ouro);
  const yu = yujiLP(); g.add(yu); yu.position.set(0, 0, 0.7);
  const sk = sukunaYujiLP(); g.add(sk); sk.position.set(0, 0, -1.5); sk.scale.setScalar(1.06);
  const TS = trocaCorPrep(sk, 0x9a1414); TS.uY.value = 10; TS.uBorda.value.set(0, 0, 0);
  const casa = casaLinhas(grp(g, 0, 0, -0.4), { w: 2.4, d: 3.6, h: 2.3, tp: 3.2 });
  const jl = jaulaLuz(g, { z: -0.65, w: 2.3, h: 2.6, n: 11 });
  const halo = glowSprite(0xffd890, 2.4, 0.08); halo.position.set(0, 1.4, 0.4); g.add(halo);
  const corCasa = new THREE.Color(0xffd27a), corJaula = new THREE.Color(0xff2a2a);
  return {
    bg: 0x040302, fog: [8, 60], fogCol: 0x0a0704, dome, hand: 0,
    look: { exposure: 1.1, bloom: 0.8, bloomT: 0.7, vig: 0.55, sat: 1.05, con: 1.06 },
    sun: { dir: [0.2, 0.7, 0.7], col: 0xffe0a8, I: 1.6, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x5a4020, ground: 0x050302, I: 0.45 }, fill: { col: 0xffc060, I: 0.5, dir: [-0.5, 0.2, -0.8] }, rim: { col: 0xffd080, str: 1.0 },
    update(t) {
      escurece(t, a, a + 0.001, [0, 0, 0], 0);
      flash(t, a, 0.001, 0.3, [1, 0.85, 0.5]);
      vive(yu, t, 11, { boca: "linha", sobe: 0.1 }, 0.3);
      const prende = smr(t, K.prender - 0.2, K.prender + 0.4); pose(yu, { handR: 0.25 + 0.75 * prende, handL: 0.25 + 0.75 * prende }, 1);
      vive(sk, t, 12, { boca: t < K.admitiu ? "risada" : "linha", bravo: 0.55 + 0.35 * smr(t, K.admitiu, K.admitiu + 0.5) }, 0.3);
      const empurra = smr(t, K.jaula + 0.4, K.jaula + 1.0) * (1 - 0.6 * prende);
      if (empurra > 0.01) { sk.updateMatrixWorld(true); [0, 1].forEach((i) => armIK(sk, i, V3(i ? 0.32 : -0.32, 1.25, -0.75), V3(i ? 1 : -1, 0.6, -1.6), empurra)); pose(sk, { spine: [0.1 * empurra, 0, 0] }, 1); }
      sk.position.z = -1.5 - 0.25 * prende;
      casa.set(smr(t, K.casa - 0.5, K.casa + 0.9));
      const vira = smr(t, K.jaula - 0.15, K.jaula + 0.3); casa.ls.forEach((l) => l.m.material.color.copy(corCasa).lerp(corJaula, vira)); casa.op(1 - 0.75 * smr(t, K.jaula + 0.3, K.jaula + 1.2));
      jl.set(smr(t, K.jaula - 0.1, K.jaula + 0.35), t); jl.bars.forEach((br) => (br.material.opacity *= 0.7 + 0.3 * prende + 0.3));
      halo.material.opacity = 0.05 + 0.08 * prende;
      floatDust(ouro, t, 0.2, 0.15);
      escurece(t, b - 0.45, b, [0, 0, 0], 1);
    },
    cam(t) {
      const es = olhosW(sk);
      return planos(t, [
        [a, mov([3.8, 2.4, 6.2], [1.6, 2.0, 6.4], [0, 1.2, -0.5], [0, 1.3, -0.5], 36, 34)],
        [K.jaula, mov([1.0, 1.25, 3.4], [0.6, 1.35, 2.8], [0, 1.4, -0.6], [0, 1.5, -0.7], 34, 32)],
        [K.admitiu, (tt, u) => { const k = E.inOut(u); return { pos: add3(es, [0.18, 0.02, lerp(1.25, 0.95, k)]), look: arr(es), fov: 30, near: 0.02 }; }],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 4 · as Dez Sombras: a sombra se espalha, os cães saem e o Mahoraga sobe
addSet("s4-sombras", (g) => {
  const [a, b] = T.sc["s4-sombras"];
  const dome = vazio(g, 0x05040e, 0x241a48, 0x020206, { sunCol: 0x8a6aff, sunI: 0.25 });
  const chao = mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x0a0914, roughness: 0.3, metalness: 0.5 }), 0, 0, 0, g); chao.rotation.x = -Math.PI / 2;
  const nevoa = dustPts(200, [-8, 8, 0.1, 6, -10, 4], 0x9a80ff, 0.03, 0.5); g.add(nevoa);
  const mg = megumiLP(); g.add(mg);
  const poca = pocaSombra(g, 0, 0);
  const an = aneisChao(g, { n: 5, cor: 0x8a6aff, r1: 9, gap: 0.3, dur: 2.6 });
  const lb = loboLP({ cor: 0xe8e8ee, escuro: 0x2a2a32 }), lp = loboLP({ cor: 0x1c1c22, escuro: 0xd8d8e0, olho: 0xf2f2f2 }); g.add(lb, lp);
  const mh = mahoragaLP(); g.add(mh); mh.rotation.y = 0;
  const luzM = new THREE.PointLight(0xffd890, 0, 14, 1.6); luzM.position.set(0, 5, -2); g.add(luzM);
  const tS = K.dez, tC = K.sombras + 0.1, tM = K.mahoraga1 - 0.2;
  return {
    bg: 0x05040e, fog: [10, 70], fogCol: 0x0c0a1e, dome, hand: 0,
    look: { exposure: 1.15, bloom: 0.7, bloomT: 0.72, vig: 0.5, sat: 1.05, con: 1.06 },
    sun: { dir: [-0.3, 0.8, 0.5], col: 0xc8b8ff, I: 1.4, c: [0, 1.5, -1], r: 8 }, hemi: { sky: 0x4a3a8a, ground: 0x05040a, I: 0.55 }, fill: { col: 0x6a8aff, I: 0.5, dir: [0.6, 0.2, -0.6] }, rim: { col: 0xb0a0ff, str: 1.0 },
    update(t) {
      chicote(t, b, 0.22, -1);
      vive(mg, t, 21, { boca: "linha", bravo: 0.35 }, 0.3); sinalMaos(mg, smr(t, a + 0.4, tS));
      poca.set(lerp(0, 4.5, E.out(smr(t, tS, tS + 1.6)))); an.update(t, tS);
      [[lb, -1.1, 0.9, 1], [lp, 1.15, 0.8, 4]].forEach(([d, x, z, sd]) => { const k = E.outBack(smr(t, tC, tC + 0.9)); d.position.set(x, lerp(-1.4, 0, k), z); d.rotation.y = x < 0 ? 0.35 : -0.35; d.visible = k > 0.01; loboAnim(d, t, { seed: sd, rosna: 0.5, olha: x < 0 ? -0.2 : 0.2 }); });
      const sobe = E.out(smr(t, tM, tM + 2.0)); mh.position.set(0, lerp(-8.5, 0, sobe), -3.2); mh.visible = sobe > 0.01;
      restPose(mh); pose(mh, { armR: [0.05, 0, -0.3, -0.35], armL: [0.05, 0, 0.3, -0.35], spine: [Math.sin(t * 1.3) * 0.02, 0, 0] });
      const br = rodaClique(mh, t, [K.adapta, K.ataque]); luzM.intensity = 3 * sobe + 6 * br;
      flash(t, K.adapta + 0.05, 0.04, 0.3, [1, 0.9, 0.7]); flash(t, K.ataque + 0.05, 0.04, 0.3, [1, 0.9, 0.7]);
      floatDust(nevoa, t, 0.25, 0.12);
    },
    cam(t) {
      const e = olhosW(mg);
      return planos(t, [
        [a, (tt, u) => { const k = E.inOut(u); return { pos: add3(e, [0.25, 0.0, lerp(1.6, 1.1, k)]), look: add3(e, [0, -0.05, 0]), fov: 30, near: 0.02 }; }],
        [tS, mov([3.4, 5.4, 5.2], [2.4, 3.2, 4.4], [0, 0.4, 0], [0, 0.6, 0], 38, 36)],
        [tM, mov([0.9, 0.55, 3.0], [0.6, 0.7, 3.7], [0, 3.0, -3.2], [0, 5.0, -3.2], 40, 42)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 5 · Discord: templo dourado; o baú se abre e saem keys, itens e a claquete (as aulas)
const keyTex = canvasTex(256, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#2a2050"); gr.addColorStop(1, "#7a5ad8"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,240,255,.9)"; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = "#fff"; c.font = "bold 54px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.fillText("KEY", w / 2, 82); c.font = "bold 22px sans-serif"; c.fillText("XXXX-XXXX-XXXX", w / 2, 122); });
const claqTex = canvasTex(256, 192, (c, w, h) => { c.fillStyle = "#1a1a1e"; c.fillRect(0, 0, w, h); c.fillStyle = "#f2f2f2"; for (let i = 0; i < 6; i++) { c.save(); c.translate(i * 48, 0); c.beginPath(); c.moveTo(0, 0); c.lineTo(24, 0); c.lineTo(48, 44); c.lineTo(24, 44); c.fill(); c.restore(); } c.font = "bold 30px sans-serif"; c.textAlign = "center"; c.fillText("AULA", w / 2, 110); c.font = "bold 22px sans-serif"; c.fillText("COMO FAZER", w / 2, 150); });
addSet("s5-keys", (g) => {
  const [a, b] = T.sc["s5-keys"];
  const dome = vazio(g, 0x1a0e04, 0x8a5a20, 0x0a0602, { sunCol: 0xffc070, sunI: 0.4 });
  const tb = texBlocks([160, 130, 96], [120, 96, 70]), piso = new THREE.MeshStandardMaterial({ map: rep(tb.map.clone(), 6, 6), normalMap: rep(tb.normalMap.clone(), 6, 6), roughness: 0.6, metalness: 0.1 }); piso.map.needsUpdate = piso.normalMap.needsUpdate = true;
  mesh(new THREE.PlaneGeometry(30, 30), piso, 0, 0, 0, g).rotation.x = -Math.PI / 2;
  const pedra = LPmat(0x8a6a48, { rim: 0.5 }), madeira = LPmat(0x7a2a18, { rim: 0.6 });
  [-1, 1].forEach((k) => [-2, -5].forEach((z) => { mesh(cyl(0.28, 0.32, 5, 8), madeira, k * 3, 2.5, z, g); }));
  mesh(box(7.6, 0.5, 0.6), madeira, 0, 5.1, -2, g); mesh(box(8.4, 0.3, 0.8), madeira, 0, 5.55, -2, g);
  mesh(box(14, 7, 0.4), pedra, 0, 3.5, -7, g);
  const cx = grp(g, 0, 0, 0), gm = GOLDM();
  mesh(box(1.3, 0.62, 0.8), pedra, 0, 0.31, 0, cx); [-0.5, 0.5].forEach((x) => mesh(box(0.08, 0.64, 0.82), gm, x, 0.31, 0, cx));
  const lid = grp(cx, 0, 0.62, -0.4); mesh(box(1.3, 0.16, 0.8), pedra, 0, 0.08, 0.4, lid); [-0.5, 0.5].forEach((x) => mesh(box(0.08, 0.18, 0.82), gm, x, 0.08, 0.4, lid));
  const brilho = glowSprite(0xffd890, 2.2, 0); brilho.position.set(0, 0.9, 0); g.add(brilho); const luz = new THREE.PointLight(0xffc070, 0, 6, 1.6); luz.position.set(0, 1.2, 0.2); g.add(luz);
  const cards = []; for (let i = 0; i < 10; i++) { const c = mesh(box(0.34, 0.21, 0.01), new THREE.MeshStandardMaterial({ map: keyTex, emissive: 0xffffff, emissiveMap: keyTex, emissiveIntensity: 0.5, roughness: 0.4 }), 0, 0, 0, g); c.castShadow = false; cards.push(c); }
  const itens = []; for (let i = 0; i < 6; i++) { const it = mesh(i % 2 ? new THREE.OctahedronGeometry(0.09, 0) : new THREE.BoxGeometry(0.14, 0.14, 0.14), new THREE.MeshStandardMaterial({ color: [0x7ae0ff, 0xff7ad8, 0xffd060][i % 3], emissive: [0x2a8aff, 0xff2a9a, 0xffa020][i % 3], emissiveIntensity: 0.9, roughness: 0.3 }), 0, 0, 0, g); it.castShadow = false; itens.push(it); }
  const claq = mesh(box(0.42, 0.32, 0.02), new THREE.MeshStandardMaterial({ map: claqTex, emissive: 0xffffff, emissiveMap: claqTex, emissiveIntensity: 0.35 }), 0, 0, 0, g);
  const yu = yujiLP(); g.add(yu); yu.position.set(0.95, 0, -0.55); yu.rotation.y = -0.45;
  const poeira = dustPts(160, [-4, 4, 0.2, 4, -5, 3], 0xffe0a8, 0.025, 0.7); g.add(poeira);
  const tA = K.discord - 0.2;
  return {
    bg: 0x1a0e04, fog: [8, 40], fogCol: 0x2a1808, dome, hand: 0,
    look: { exposure: 1.15, bloom: 0.75, bloomT: 0.7, vig: 0.5, sat: 1.1, con: 1.05 },
    sun: { dir: [-0.4, 0.8, 0.5], col: 0xffd8a0, I: 1.8, c: [0, 1, -1], r: 6 }, hemi: { sky: 0xa07040, ground: 0x2a1408, I: 0.6 }, fill: { col: 0xffb060, I: 0.6, dir: [0.5, 0.3, 0.8] }, rim: { col: 0xffd080, str: 0.8 },
    update(t) {
      chicote(t, a, 0.22, -1); chicote(t, b, 0.22, 1);
      const ab = E.outBack(smr(t, tA, tA + 0.6)); lid.rotation.x = -1.9 * ab;
      brilho.material.opacity = 0.7 * ab; luz.intensity = 5 * ab;
      const lt = t - tA;
      cards.forEach((c, i) => { const up = smr(t, tA + 0.1 + i * 0.05, K.keys + 0.6), an = (i / 10) * Math.PI * 2 + lt * 0.8, r = 0.15 + up * (0.55 + (i % 3) * 0.12); c.position.set(Math.cos(an) * r, 0.7 + up * (0.5 + (i % 4) * 0.16 + Math.sin(lt * 2 + i) * 0.05), Math.sin(an) * r * 0.6); c.rotation.set(Math.sin(lt + i) * 0.4, an + Math.PI / 2, 0.2); c.visible = up > 0.01; });
      itens.forEach((it, i) => { const up = smr(t, K.itens - 0.4 + i * 0.06, K.itens + 0.5), an = (i / 6) * Math.PI * 2 - lt * 0.9, r = up * 0.75; it.position.set(Math.cos(an) * r, 0.7 + up * (1.15 + (i % 2) * 0.15), Math.sin(an) * r * 0.6); it.rotation.set(lt * 2, lt * 1.5 + i, 0); it.visible = up > 0.01; });
      const uc = E.outBack(smr(t, K.ensino - 0.3, K.ensino + 0.4)); claq.position.set(0, 0.7 + uc * 1.35, 0.25); claq.rotation.set(0, Math.sin(lt * 1.2) * 0.25, Math.sin(lt * 3) * 0.05); claq.scale.setScalar(Math.max(0.001, uc * 1.3)); claq.visible = uc > 0.01;
      vive(yu, t, 11, { boca: "sorriso", sobe: 0.4 }, 0.35);
      const ap = smr(t, K.bio - 0.6, K.bio); if (ap > 0) pose(yu, { armR: [-1.7 * ap, 0, -0.3, -0.4], handR: 1 }, 1);
      floatDust(poeira, t, 0.2, 0.15);
    },
    cam(t) { return { ...path2(t, [[a, [2.4, 1.6, 3.6], [0.1, 1.0, -0.2], 36], [K.itens, [1.6, 1.5, 2.8], [0.1, 1.3, -0.1], 34], [b, [1.2, 1.55, 2.4], [0.2, 1.5, -0.2], 32]]), near: 0.03 }; },
  };
});
