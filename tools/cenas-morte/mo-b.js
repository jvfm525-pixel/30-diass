// ================================================================ vídeo: Demônio da Morte · cenas 6–11 (a Fami, os poderes, a Queda, oca, o plano, a igreja, o fim, a guerra, a volta, a pergunta)
function vazioArena(g, top = 0x0a0206, hor = 0x4a0e1c) { vazio(g, top, hor, 0x050203, { sunI: 0.35, sunDir: [0, 0.2, -1] });
  const ch = mesh(new THREE.PlaneGeometry(200, 200), SM(0x0c0608, { roughness: 0.22, metalness: 0.35 }), 0, 0, 0, g); ch.rotation.x = -Math.PI / 2; return ch; }
function pilhaComida(g, x, y, z) { const c = grp(g, x, y, z); for (let i = 0; i < 7; i++) { const p = pao(); c.add(p); p.position.set((hash(i) - 0.5) * 0.3, 0.03 + Math.floor(i / 3) * 0.06, (hash(i * 3) - 0.5) * 0.2); p.rotation.y = hash(i * 5) * 3; }
  const pr = mesh(cyl(0.16, 0.13, 0.03, 18), LPmat(0xf2f0ea, { rim: 0.3 }), 0.25, 0.015, 0.0, c); const mac = mesh(sph(0.12, 10, 6), LPmat(0xe8c070, { rim: 0.4, rough: 0.7 }), 0.25, 0.05, 0, c); mac.scale.y = 0.45; // prato de macarrão
  return c; }
// fenda escura e oca no tronco da Morte (sem sangue: um rasgo negro com brilho roxo por dentro)
function fendaOca(p) { const u = p.userData, g = grp(u.spine, 0, 0.1, 0.165); const m = mesh(box(0.022, 0.36, 0.01), new THREE.MeshBasicMaterial({ color: 0x050008 }), 0, 0, 0, g); m.castShadow = false;
  const gl = glowSprite(0x9a4aff, 0.15, 0); gl.position.z = 0.02; g.add(gl); const ln = mesh(box(0.006, 0.34, 0.004), new THREE.MeshBasicMaterial({ color: 0xc08aff, transparent: true, opacity: 0, blending: ADD, depthWrite: false }), 0, 0, 0.007, g); ln.castShadow = false;
  g.visible = false; return { set(k) { g.visible = k > 0.01; g.scale.set(1, Math.max(0.01, k), 1); gl.material.opacity = 0.55 * k; ln.material.opacity = 0.9 * k; } }; }
function flor(g, x, z) { const f = grp(g, x, 0, z), cau = LPmat(0x2a5a2a, { rim: 0.4 }); const h = grp(f); mesh(cyl(0.008, 0.01, 0.45, 5), cau, 0, 0.225, 0, h); const top = grp(h, 0, 0.45, 0);
  const pet = Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2, pp = mesh(sph(0.03, 6, 5), LPmat(0xf2f0f6, { rim: 0.5 }), Math.cos(a) * 0.035, 0, Math.sin(a) * 0.035, top); pp.scale.set(1.3, 0.35, 0.8); pp.rotation.y = -a; pp.userData.p0 = pp.position.clone(); return pp; });
  mesh(sph(0.018, 6, 5), LPmat(0xf0c030), 0, 0.01, 0, top); return { f, murcha(k, t) { h.rotation.z = 0.9 * k; pet.forEach((pp, i) => { const cai = smr(k, 0.3 + i * 0.1, 0.6 + i * 0.1); pp.position.set(pp.userData.p0.x + cai * 0.1 * Math.cos(i), pp.userData.p0.y - cai * (0.3 + 0.1 * i), pp.userData.p0.z + cai * 0.05); pp.rotation.x = cai * 2; }); } }; }

// ---------------------------------------------------------------- 6 · a Fami: na sala, comendo uma montanha de comida do lado do Denji, que não entende nada
addSet("m6-fami", (g) => {
  const __n = "m6-fami"; const [a, b] = T.sc[__n];
  skyDome(g, { top: 0xffb070, hor: 0xffd8a8, ground: 0x6a4a30, sunDir: [-0.9, 0.35, 0.2], sunI: 0.8, cov: 0 });
  const S = salaAula(g, { por: true }); const de = denjiLP(), mo = morteLP({ bone: true }); g.add(de, mo); olhosBrilho(mo);
  const D = S.D(2, 2); pilhaComida(g, D.x + 1.2, 0.74, D.z - 0.02); const pa = pao(); naMao(mo, 1, pa, { dy: -0.07, dz: 0.03 });
  const po = dustPts(120, [-4.5, 4.5, 0.3, 3, -5, 6], 0xffe0b0, 0.025, 0.6); g.add(po);
  return { ...LUZ_SALA_POR, hand: 0.004,
    update(t) { floatDust(po, t, 0.2, 0.1); S.senta(de, 2, 2); idle(de, t, 712, 0.1); const olha = smr(t, K.comendo - 0.4, K.comendo); pose(de, { neck: [0.05, -0.8 * olha, 0] }, 1); rostoLP(de, t, { boca: olha > 0.5 ? "aberta" : "linha", palpebra: 0.95, choque: olha * 0.6 });
      S.senta(mo, 3, 2); idle(mo, t, 711, 0.08); const mord = mordidas(t, [a + 0.3, a + 1.5, K.fami - 0.8, K.comendo - 0.3, K.comendo + 0.7], 0.8);
      maoEm(mo, 1, bocaW(mo, 0.06), 0.3 + 0.7 * mord, { abre: 0.3 }); rostoLP(mo, t, { boca: mord > 0.3 ? "mastiga" : "linha", palpebra: 0.6, piscaCada: 99 }); brilhoK(mo, smr(t, K.fami - 0.2, K.fami + 0.3) * (1 - smr(t, K.comendo - 0.3, K.comendo))); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; } const P = S.D(3, 2);
      return planos(t, [
        [a, mov([-1.5, 1.9, -4.6], [-1.2, 1.8, -4.2], [0.5, 1.0, 0], [0.6, 1.0, 0], 44, 42)],
        [K.escola - 0.3, mov([-4.2, 1.6, 4.8], [-3.8, 1.5, 4.2], [0.8, 1.0, -0.3], [0.9, 1.0, -0.3], 42, 40)],
        [K.fami - 0.3, (tt, u) => ({ ...closeRosto(mo, lerp(0.8, 0.6, E.inOut(u)), 0.12, -0.02, 30) })],
        [K.comendo - 0.3, mov([P.x + 1.1, 1.25, P.z - 0.9], [P.x + 0.95, 1.2, P.z - 0.8], [P.x - 0.1, 0.95, P.z + 0.2], [P.x - 0.1, 0.95, P.z + 0.2], 38, 36)],
        [K.fome6 - 0.6, (tt, u) => ({ ...closeRosto(de, lerp(0.8, 0.65, E.inOut(u)), -0.15, -0.02, 30) })],
      ], b); },
  };
});

// ---------------------------------------------------------------- 7 · os poderes: mata um demônio na hora, ressuscita, os corvos comem, vira fantoche na mão dela
addSet("m7-poderes", (g) => {
  const __n = "m7-poderes"; const [a, b] = T.sc[__n];
  vazioArena(g); const mo = morteLP(); g.add(mo); mo.position.set(0, 0, 1.5); mo.rotation.y = Math.PI; olhosBrilho(mo);
  const dv = demonioComum({ seed: 731, cor: 0x6a5a62, scale: 1.9, olho: 0xffd040 }); g.add(dv); dv.position.set(0, 0, -1.8);
  const cs = Array.from({ length: 16 }, () => corvo(g)); const ef = efigie(() => demonioComum({ seed: 731, scale: 1 }), 0.09); g.add(ef);
  const vida = glowSprite(0x8aff9a, 3, 0); vida.position.set(0, 1.2, -1.8); g.add(vida);
  return { ...LUZ_VAZIO_M, hand: 0.004,
    update(t) { vive(mo, t, 711, { boca: "linha", palpebra: 0.62 }, 0.06); const ap = smr(t, K.matanahora - 0.25, K.matanahora + 0.05) * (1 - smr(t, K.ressuscita, K.ressuscita + 0.3));
      pose(mo, { armR: [-1.45 * ap, 0.05, -0.1, -0.1] }, 1); brilhoK(mo, 0.5 + 0.5 * ap);
      const morre = smr(t, K.matanahora, K.matanahora + 0.4) * (1 - smr(t, K.ressuscita, K.ressuscita + 0.8)); restPose(dv); idle(dv, t, 731, 0.2 * (1 - morre)); dv.rotation.x = -1.35 * morre; dv.position.y = 0.15 * morre; olhosK(dv, 1 - morre);
      vida.material.opacity = 0.6 * Math.sin(Math.PI * seg(t, K.ressuscita, K.ressuscita + 1.0));
      const kc = seg(t, K.come - 0.3, K.fantoches - 0.4); dv.visible = kc < 0.75; if (kc > 0) dv.scale.setScalar(1.9 * (1 - 0.6 * smr(kc, 0.4, 0.75)));
      cs.forEach((c, i) => { const on = kc > 0 && kc < 0.95; c.visible = on; const an = t * 3 + i * 0.4, r = 0.9 - 0.5 * kc + 0.2 * Math.sin(i); c.position.set(Math.sin(an) * r, 0.6 + (i % 5) * 0.3 + Math.sin(t * 4 + i) * 0.1, -1.8 + Math.cos(an) * r); c.rotation.y = an + Math.PI / 2; bateAsas(c, t + i); });
      const kf = smr(t, K.fantoches - 0.4, K.fantoches); ef.visible = kf > 0.01; mo.updateMatrixWorld(true); const m = mo.userData.wr[0].localToWorld(V3(0, -0.06, 0.03)); ef.position.set(m.x, m.y + 0.02 + 0.3 * (1 - kf), m.z); ef.rotation.y = t;
      if (t > K.fantoches - 0.5) pose(mo, { armL: [-1.2, 0, 0.1, -0.6] }, smr(t, K.fantoches - 0.5, K.fantoches - 0.2));
      flash(t, K.matanahora + 0.05, 0.03, 0.35, [0.6, 0.1, 0.2]); GU.uFlash.value *= 0.4; },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([2.4, 1.3, 3.4], [2.0, 1.35, 3.0], [0, 1.1, -0.5], [0, 1.1, -0.8], 42, 40)],
        [K.ressuscita - 0.25, mov([-2.2, 0.6, -0.2], [-2.0, 0.9, -0.4], [0, 0.8, -1.8], [0, 1.6, -1.8], 44, 42)],
        [K.come - 0.3, mov([4.4, 2.1, 0.4], [4.0, 2.0, 0.0], [0, 2.0, -1.8], [0, 1.7, -1.8], 50, 48)],
        [K.fantoches - 0.6, (tt, u) => { mo.updateMatrixWorld(true); const m = mo.userData.wr[0].localToWorld(V3(0, -0.06, 0.03)); return { pos: [m.x + 0.55, m.y + 0.3, m.z - 0.75], look: [m.x, m.y + 0.05, m.z], fov: 36, near: 0.02 }; }],
      ], b); },
  };
});

// ---------------------------------------------------------------- 7b · o Demônio da Queda (Medo Primordial) se curva pra ela; depois a Fome, chorando, é engolida pelos corvos
addSet("m7b-queda", (g) => {
  const __n = "m7b-queda"; const [a, b] = T.sc[__n];
  vazioArena(g, 0x0a0206, 0x3a0e2a); const mo = morteLP(); g.add(mo); mo.position.set(0, 0, 2.2); mo.rotation.y = Math.PI; olhosBrilho(mo);
  const qd = quedaLP({ scale: 4.2 }); g.add(qd); const fo = fomeLP(); g.add(fo); fo.position.set(1.6, 0, 1.2); fo.rotation.y = 0.9;
  const cs = Array.from({ length: 18 }, () => corvo(g)); const tI = K.irma - 1.6;
  return { ...LUZ_VAZIO_M, hand: 0.004,
    update(t) { vive(mo, t, 711, { boca: "linha", palpebra: 0.62 }, 0.06); brilhoK(mo, 0.6);
      const ch = smr(t, a, K.queda); qd.position.set(0, 14 * (1 - ch), -4); restPose(qd); idle(qd, t, 717, 0.15); const cv = smr(t, K.servo - 0.3, K.servo + 0.9); kneelPose(qd, cv); pose(qd, { spine: [0.75 * cv, 0, 0], chest: [0.3 * cv, 0, 0] }, 1); standFeet(qd);
      qd.userData.extras.forEach((e, i) => (e.rotation.x = -0.5 + 0.15 * Math.sin(t * 1.5 + i)));
      fo.visible = t > tI - 0.2; vive(fo, t, 715, { boca: "triste", palpebra: 0.85, choro: 1, triste: 1 }, 0.15); const ke = seg(t, tI + 0.3, b);
      cs.forEach((c, i) => { c.visible = ke > 0 && ke < 0.98; const an = t * 3.4 + i * 0.35, r = 0.7 - 0.35 * ke; c.position.set(1.6 + Math.sin(an) * r, 0.5 + (i % 6) * 0.22, 1.2 + Math.cos(an) * r); c.rotation.y = an + Math.PI / 2; bateAsas(c, t + i); });
      if (ke > 0.6) fo.scale.setScalar(Math.max(0.01, 1 - (ke - 0.6) * 2.5)); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.5, 0.8, 7.5], [0.4, 1.0, 6.5], [0, 4, -4], [0, 6, -4], 50, 50)],
        [K.servo - 0.35, mov([-4.5, 2.2, 5.5], [-4, 2.4, 5], [0, 2.2, -1], [0, 2.0, -1], 46, 44)],
        [tI, mov([3.2, 1.4, 3.4], [2.9, 1.45, 3.0], [1.6, 1.3, 1.2], [1.6, 1.2, 1.2], 38, 36)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 8 · oca: a Morte sozinha na sala à noite; come; levanta; a fenda escura no tronco; continua viva
addSet("m8-oca", (g) => {
  const __n = "m8-oca"; const [a, b] = T.sc[__n];
  skyDome(g, { top: 0x0a1020, hor: 0x2a3a6a, ground: 0x0a0a0c, sunDir: [-0.9, 0.5, 0.2], sunCol: 0xe8eeff, sunI: 0.25, disk: 1.0, cov: 0.2 });
  const S = salaAula(g, { noite: true }); const mo = morteLP(); g.add(mo); olhosBrilho(mo); const FE = fendaOca(mo);
  const D = S.D(0, 1); const bento = grp(g, D.x, 0.74, D.z); mesh(box(0.22, 0.05, 0.15), LPmat(0x2a1a1a, { rim: 0.4 }), 0, 0.025, 0, bento); mesh(box(0.2, 0.02, 0.13), LPmat(0xf0ece0), 0, 0.055, 0, bento);
  const raio = mesh(new THREE.PlaneGeometry(2.4, 3.2), new THREE.MeshBasicMaterial({ color: 0x9ab0ff, transparent: true, opacity: 0.07, blending: ADD, depthWrite: false, side: THREE.DoubleSide }), -3.6, 1.4, D.z, g); raio.rotation.set(0, Math.PI / 2, 0.5); raio.castShadow = false;
  const tL = K.matar - 0.4;
  return { ...LUZ_SALA_NOITE, hand: 0.004,
    update(t) { if (t < tL) { S.senta(mo, 0, 1); idle(mo, t, 711, 0.06); const mord = mordidas(t, [a + 0.4, K.comida - 0.4, K.comida + 0.6], 0.8); maoEm(mo, 1, bocaW(mo, 0.06), 0.25 + 0.75 * mord, { abre: 0.3 }); rostoLP(mo, t, { boca: mord > 0.3 ? "mastiga" : "linha", palpebra: 0.6, piscaCada: 99 }); }
      else { restPose(mo); const { x, z } = S.D(0, 1); mo.position.set(x - 0.7, 0, z + 0.6); idle(mo, t, 711, 0.05); standFeet(mo); const vira = smr(t, K.viva - 0.4, K.viva + 0.2); mo.rotation.y = lerp(Math.PI / 2 - 0.25, Math.PI / 2 - 0.6, vira); rostoLP(mo, t, { boca: "linha", palpebra: 0.62, piscaCada: 99 });
        const ab = smr(t, K.orgaos - 0.5, K.orgaos + 0.4); pose(mo, { armR: [0.25 * ab, 0, -0.2 * ab, -1.6 * ab], armL: [0.25 * ab, 0, 0.2 * ab, -1.6 * ab], neck: [0.3 * ab * (1 - vira), 0, 0] }, 1); FE.set(ab); }
      brilhoK(mo, smr(t, K.naomorre - 0.4, K.naomorre)); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; } const P = S.D(0, 1);
      return planos(t, [
        [a, mov([P.x + 1.3, 1.25, P.z - 0.95], [P.x + 1.15, 1.2, P.z - 0.85], [P.x, 0.95, P.z + 0.45], [P.x, 0.95, P.z + 0.45], 40, 38)],
        [K.comida - 0.35, (tt, u) => ({ ...closeRosto(mo, lerp(0.85, 0.7, E.inOut(u)), 0.15, -0.05, 30) })],
        [tL, mov([P.x + 1.6, 1.2, P.z + 1.9], [P.x + 1.4, 1.15, P.z + 1.6], [P.x - 0.6, 1.1, P.z + 0.6], [P.x - 0.6, 1.0, P.z + 0.6], 40, 38)],
        [K.orgaos - 0.4, mov([P.x + 0.6, 1.05, P.z + 0.65], [P.x + 0.5, 1.0, P.z + 0.65], [P.x - 0.7, 1.0, P.z + 0.62], [P.x - 0.7, 0.98, P.z + 0.62], 36, 34)],
        [K.viva - 0.35, mov([P.x + 0.4, 1.35, P.z + 2.4], [P.x + 0.2, 1.38, P.z + 2.0], [P.x - 0.7, 1.3, P.z + 0.6], [P.x - 0.7, 1.35, P.z + 0.6], 38, 36)],
        [K.naomorre - 0.4, (tt, u) => ({ ...closeRosto(mo, lerp(0.7, 0.5, E.inOut(u)), 0.05, -0.02, 30) })],
      ], b); },
  };
});

// ---------------------------------------------------------------- 9 · o plano: se ela morresse, ela vira pó; outro Demônio da Morte nasce, enorme e cruel, olhando a cidade
addSet("m9-plano", (g) => {
  const __n = "m9-plano"; const [a, b] = T.sc[__n];
  vazioArena(g, 0x0a0206, 0x3a0a10); const mo = morteLP(); g.add(mo); olhosBrilho(mo); const PO = desfaz(g, 300, [-0.25, 0.25, 0.0, 1.6, -0.15, 0.15], 0xff6a8a, 0.04, ADD);
  const nv = silhueta(demonioComum({ seed: 732, cor: 0x050304, scale: 9, olho: 0xff2a3a })); g.add(nv); nv.position.set(0, 0, -16);
  const OC = olhosCeu(g, [0, 13.6, -14.2], 1.2, "#ff2a3a");
  const C = Array.from({ length: 14 }, (_, i) => { const p = civilLP(i); g.add(p); p.position.set(-3 + hash(i * 2.1) * 6, 0, -2 + hash(i * 3.3) * 4); p.rotation.y = Math.PI + (hash(i) - 0.5) * 0.6; return p; });
  return { ...LUZ_VAZIO_M, hand: 0.004,
    update(t) { const kd = smr(t, K.morresse - 0.2, K.morresse + 1.2); mo.visible = kd < 0.45; vive(mo, t, 711, { boca: "linha", palpebra: 0.62 }, 0.06); brilhoK(mo, 0.6); PO.upd(kd);
      const kn = smr(t, K.nasceria - 0.5, K.nasceria + 1.4); nv.visible = kn > 0.01; nv.position.y = -16 * (1 - kn); restPose(nv); idle(nv, t, 732, 0.2); olhosK(nv, kn); OC.set(0.85 * smr(t, K.nasceria + 0.6, K.nasceria + 1.4)); pose(nv, { neck: [0.45 * smr(t, K.gente - 0.8, K.gente), 0, 0] }, 1);
      C.forEach((p, i) => { p.visible = t > K.gente - 1.0; vive(p, t, 800 + i, { boca: "aberta", palpebra: 1 }, 0.25); pose(p, { neck: [-0.8, 0, 0] }, 1); }); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, (tt, u) => ({ ...closeRosto(mo, lerp(1.2, 1.6, E.inOut(u)), 0.1, -0.1, 34) })],
        [K.morresse + 0.2, mov([0.4, 1.2, 3.2], [0.3, 1.4, 4.0], [0, 1.0, 0], [0, 1.2, 0], 44, 46)],
        [K.nasceria - 0.4, mov([0, 0.4, 8], [0, 0.6, 7], [0, 8, -16], [0, 13, -16], 52, 54)],
        [K.gente - 1.0, mov([3.5, 15, -9], [3, 14.6, -8], [0, 0.8, 0], [0, 0.8, 0], 44, 42)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 9b · a igreja: os fiéis com medo; o Chainsaw Man e a Yoru no palco crescem com o medo
addSet("m9b-igreja", (g) => {
  const __n = "m9b-igreja"; const [a, b] = T.sc[__n];
  const I = igrejaCSM(g); const cm = chainsawManLP(), yo = yoruLP(); g.add(cm, yo); olhosBrilho(yo, 0xff3a3a, 0.05);
  const esp = grp(null); mesh(box(0.03, 0.9, 0.06), LPmat(0xc8ccd4, { metal: 0.8, rough: 0.25, rim: 0.6 }), 0, -0.45, 0, esp); naMao(yo, 1, esp, { dy: -0.06, dz: 0.03, rot: [0.3, 0, 0] });
  const aura = [-1, 1].map((k) => steam(g, { origin: [k * 0.9, 1.0, -10.5], n: 18, size: 0.9, spread: 1.6, rise: 1.6, grow: 2.2, opacity: 0.4, life: 2.4, color: 0x4a0a1a, wind: [0, 0, -0.6] }));
  return { bg: 0x0a0608, fog: [8, 40], fogCol: 0x140a0c, hand: 0.004, look: { exposure: 1.12, bloom: 0.55, bloomT: 0.76, vig: 0.55, sat: 1.06, con: 1.1, dof: MDOF_M, rosto: 0.4, lift: [0.02, 0.008, 0] },
    sun: { dir: [0, 0.9, 0.6], col: 0xffc890, I: 1.3, c: [0, 1, -12], r: 10 }, hemi: { sky: 0x3a2420, ground: 0x0a0606, I: 0.5 }, fill: { col: 0xffa060, I: 0.45, dir: [0, 0.3, 1] }, rim: { col: 0xffa060, str: 1.5 },
    update(t) { const kf = smr(t, K.fortes - 0.3, K.fortes + 1.6); I.upd(t, 0.4 + kf); aura.forEach((s) => s.upd(t, kf));
      const sc = 1.25 + 0.65 * kf; [cm, yo].forEach((p, i) => { restPose(p); p.scale.setScalar(sc); p.position.set(i ? 0.9 : -0.9, 0.6, -12.5); p.rotation.y = 0; idle(p, t, 760 + i, 0.08); standFeet(p); });
      rostoLP(yo, t, { boca: "smirk", palpebra: 0.85 }); brilhoK(yo, smr(t, K.yoru9 - 0.3, K.yoru9 + 0.2));
      const ra = smr(t, K.matarela - 0.5, K.matarela); pose(cm, { armR: [-2.6 * ra, 0, -0.4 * ra, -0.2], armL: [-2.6 * ra, 0, 0.4 * ra, -0.2] }, 1); if (cm.userData.serraLam) cm.userData.serraLam.position.y = 0.06 + 0.004 * Math.sin(t * 90) * ra; },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0, 3.2, 2], [0, 2.8, -1], [0, 1.6, -12], [0, 1.8, -12], 46, 44)],
        [K.yoru9 - 0.25, mov([2.6, 1.9, -9.6], [2.3, 2.0, -10], [0.9, 2.2, -12.5], [0.9, 2.3, -12.5], 38, 36)],
        [K.fortes - 0.3, mov([0, 1.0, -4], [0, 0.9, -6], [0, 2.4, -12.5], [0, 3.0, -12.5], 50, 50)],
        [K.matarela - 0.6, mov([-1.4, 0.9, -10.2], [-1.2, 0.8, -10.6], [-0.9, 2.6, -12.5], [-0.9, 3.0, -12.5], 44, 46)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 10 · o fim: o Pochita de verdade devora a Morte; o mundo perde a cor
addSet("m10-fim", (g) => {
  const __n = "m10-fim"; const [a, b] = T.sc[__n];
  vazioArena(g, 0x0a0206, 0x4a1018); const mo = morteLP(); g.add(mo); mo.position.set(0, 0, 1.2); mo.rotation.y = Math.PI; olhosBrilho(mo);
  const po = pochitaReal({ scale: 3 }); g.add(po); po.position.set(0, 0, -3.5); const PO = desfaz(g, 200, [-0.3, 0.3, 0.0, 1.6, -0.2, 0.2], 0x05030a, 0.05);
  return { ...LUZ_VAZIO_M, hand: 0.005, rim: { col: 0xff4a5a, str: 2.2 }, fill: { col: 0xffb0c0, I: 0.8, dir: [0.2, 0.4, 1] },
    update(t) { vive(mo, t, 711, { boca: "linha", palpebra: 0.6 }, 0.05); brilhoK(mo, 0.6); const ln = smr(t, K.devorou - 0.45, K.devorou + 0.05);
      restPose(po); idle(po, t, 716, 0.15); po.position.z = -3.5 + 3.6 * ln; pose(po, { spine: [0.6 * ln, 0, 0], chest: [0.3 * ln, 0, 0], armR: [-1.2 * ln, 0, -0.5, -0.5], armL: [-1.2 * ln, 0, 0.5, -0.5] }, 1); standFeet(po);
      (po.userData.tripas || []).forEach((tb, i) => (tb.rotation.x = 0.15 * Math.sin(t * 2 + i)));
      const sm_ = smr(t, K.devorou - 0.05, K.devorou + 0.1); mo.visible = sm_ < 0.5; mo.updateMatrixWorld(true); PO.p.position.set(0, 0, 1.2); PO.upd(smr(t, K.devorou, K.devorou + 1.4), 2.4, 1.8);
      flash(t, K.devorou + 0.02, 0.03, 0.4, [0.05, 0, 0.02]); escurece(t, K.apagou - 0.2, K.apagou + 2.2, [0.8, 0.8, 0.82], 0.55); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.2, 1.4, 4.4], [1.0, 1.3, 3.8], [0, 2.4, -2.5], [0, 3.4, -2.5], 46, 46)],
        [K.pochita - 0.2, mov([-1.8, 0.7, 2.8], [-1.5, 0.8, 2.6], [0, 4.0, -3], [0, 4.6, -2], 50, 52)],
        [K.apagou - 0.3, mov([0, 3, 9], [0, 4, 12], [0, 2, -1], [0, 2, -1], 46, 50)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 10b · a guerra sem fim: Shibuya em ruínas pegando fogo; a Yoru sorri no alto; o soldado cai e levanta de novo
addSet("m10b-guerra", (g) => {
  const __n = "m10b-guerra"; const [a, b] = T.sc[__n];
  ruinasG(g); const fg = [[-8, -10, 2], [9, -14, 2.5], [-3, -22, 3], [14, -4, 1.6], [-14, -4, 1.8]].map(([x, z, s]) => fogoLonge(g, x, z, s));
  const fum = steam(g, { origin: [0, 0.5, -12], n: 22, size: 4, spread: 18, rise: 1.2, grow: 1.8, opacity: 0.35, life: 5, color: 0x2a1a14, wind: [0.4, 0, 0] });
  const yo = yoruLP(); g.add(yo); yo.position.set(0, 2.2, -6); const mt = mesh(new THREE.ConeGeometry(4, 2.2, 7), LPmat(0x2a2624, { rim: 0.4, rough: 1 }), 0, 1.1, -6, g); olhosBrilho(yo, 0xff3a3a, 0.05);
  const SD = Array.from({ length: 8 }, (_, i) => { const p = soldadoLP(i); g.add(p); p.position.set(-5 + i * 1.4 + hash(i) * 0.6, 0, 2 + hash(i * 3) * 2); p.rotation.y = Math.PI + (i % 2 ? 0.3 : -0.3); return p; });
  const tiros = SD.map((p) => { const s = glowSprite(0xffd070, 0.35, 0); p.userData.fuzil.add(s); s.position.set(0, 0, 0.55); return s; });
  const bomba = [[-6, -14], [7, -18], [0, -26]].map(([x, z]) => { const s = glowSprite(0xffa040, 10, 0); s.position.set(x, 3, z); g.add(s); return s; });
  return { bg: 0x1a0a08, fog: [16, 120], fogCol: 0x2a120c, hand: 0.006, look: { exposure: 1.15, bloom: 0.6, bloomT: 0.75, vig: 0.5, sat: 1.05, con: 1.1, dof: MDOF_L, rosto: 0.45, lift: [0.02, 0.006, 0] },
    sun: { dir: [0.2, 0.4, -1], col: 0xff8a4a, I: 1.4, c: [0, 1, -6], r: 18 }, hemi: { sky: 0x6a2a1a, ground: 0x1a0a06, I: 0.6 }, fill: { col: 0xffa070, I: 0.4, dir: [0.3, 0.3, 1] }, rim: { col: 0xff7a3a, str: 1.5 },
    update(t) { fg.forEach((f) => f.update(t)); fum.upd(t, 1); vive(yo, t, 713, { boca: "sorriso", palpebra: 0.8 }, 0.1); cabeloVento(yo, t, 0.8, [1, 0, 0.2]); brilhoK(yo, 0.8);
      SD.forEach((p, i) => { restPose(p); idle(p, t, 790 + i, 0.15); pose(p, { armR: [-1.4, 0, -0.1, -0.3], armL: [-1.2, 0, 0.4, -1.0], neck: [0.1, 0, 0] }, 1); standFeet(p); rostoLP(p, t, { boca: "dentes", palpebra: 0.9 }); tiros[i].material.opacity = (noise1(t * 20 + i * 7) > 0.55 ? 0.9 : 0); });
      const q = SD[3], cai = smr(t, K.ninguem - 0.3, K.ninguem + 0.1) * (1 - smr(t, K.ninguem + 0.5, K.ninguem + 1.3)); q.rotation.x = 1.3 * cai; q.position.y = 0.1 * cai;
      bomba.forEach((s, i) => (s.material.opacity = 0.8 * Math.max(0, Math.sin(Math.PI * seg(t, K.guerra - 0.2 + i * 0.5, K.guerra + 0.6 + i * 0.5))))); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; } const Q = SD[3].position;
      return planos(t, [
        [a, (tt, u) => ({ ...closeRosto(yo, lerp(1.4, 1.0, E.inOut(u)), -0.2, -0.1, 34) })],
        [K.ninguem - 0.5, mov([Q.x + 2.2, 1.0, Q.z + 2.2], [Q.x + 1.9, 0.9, Q.z + 1.9], [Q.x, 0.6, Q.z], [Q.x, 0.9, Q.z], 42, 40)],
        [K.guerra - 0.3, mov([0, 3.5, 12], [0, 5, 15], [0, 2, -8], [0, 2.5, -10], 50, 52)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 10c · a volta: o Chainsaw Man no morro ao amanhecer vira pó; uma flor murcha (a morte voltou a existir)
addSet("m10c-volta", (g) => {
  const __n = "m10c-volta"; const [a, b] = T.sc[__n];
  skyDome(g, { top: 0x3a5a8a, mid: 0xc88a7a, hor: 0xffc890, ground: 0x2a2018, sunDir: [0.45, 0.06, -1], sunCol: 0xffd8a0, sunI: 0.45, disk: 1.8, cov: 0.4, cloudLit: 0xffd0a8, cloudSh: 0x6a5a6a });
  const mo = mesh(new THREE.SphereGeometry(30, 48, 16), LPmat(0x3a4a2a, { rim: 0.4, rough: 1 }), 0, -4.2, 0, g); mo.scale.set(1, 0.15, 0.5);
  const cm = chainsawManLP(); g.add(cm); cm.position.set(0, 0.28, -0.6); const PO = desfaz(g, 360, [-0.3, 0.3, 0.28, 1.95, -0.85, -0.35], 0x3a2010, 0.05);
  const F = flor(g, 0.5, 1.0);
  return { bg: 0xffc890, fog: [30, 160], fogCol: 0xd8a890, hand: 0.004, look: { exposure: 0.95, bloom: 0.3, bloomT: 0.85, vig: 0.4, sat: 1.08, con: 1.05, dof: MDOF_M, rosto: 0.4 },
    sun: { dir: [0.2, 0.15, -1], col: 0xffc890, I: 2.2, c: [0, 1, -2], r: 12 }, hemi: { sky: 0xc8b0c0, ground: 0x2a2018, I: 0.7 }, fill: { col: 0xffd8c0, I: 0.4, dir: [0.2, 0.3, 1] }, rim: { col: 0xffd0a0, str: 1.4 },
    update(t) { restPose(cm); idle(cm, t, 712, 0.08); standFeet(cm); const kd = smr(t, K.voltou - 0.2, K.apagado + 0.2); cm.visible = kd < 0.6; PO.upd(kd, 2.2, 1.4);
      F.murcha(smr(t, K.apagado + 0.1, b - 0.2), t); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.3, 0.6, 6], [0.2, 0.7, 4.8], [0, 1.3, -0.6], [0, 1.4, -0.6], 44, 42)],
        [K.apagado - 0.2, mov([0.9, 0.5, 1.9], [0.8, 0.45, 1.7], [0.5, 0.4, 1.0], [0.5, 0.35, 1.0], 36, 34)],
      ], b); },
  };
});

// ---------------------------------------------------------------- 11 · a pergunta: a Morte na linha entre dois mundos — à esquerda a cidade em paz, à direita a guerra pegando fogo
addSet("m11-pergunta", (g) => {
  const __n = "m11-pergunta"; const [a, b] = T.sc[__n];
  vazio(g, 0x0a0a1a, 0x5a2a3a, 0x050405, { sunI: 0.2 });
  const ch = mesh(new THREE.PlaneGeometry(200, 200), SM(0x0e0c10, { roughness: 0.4, metalness: 0.2 }), 0, 0, 0, g); ch.rotation.x = -Math.PI / 2;
  const linha = mesh(box(0.06, 0.01, 120), new THREE.MeshBasicMaterial({ color: 0xffd8e0 }), 0, 0.006, -40, g); linha.castShadow = false;
  const jan = janelasTex ? janelasTex(1) : null;
  for (let i = 0; i < 16; i++) { const h = 6 + hash(i) * 18, x = -6 - hash(i * 2) * 30, z = -14 - hash(i * 3) * 40; const pr = mesh(box(4 + hash(i * 5) * 4, h, 4), SM(0x1a1c2a, { emissive: 0xffd890, emissiveIntensity: 0.0 }), x, h / 2, z, g);
    for (let j = 0; j < 6; j++) { const w = glowSprite(0xffd890, 0.6, 0.6); w.position.set(x + (hash(i * 7 + j) - 0.5) * 3, 1 + hash(i * 11 + j) * (h - 2), z + 2.1); g.add(w); } }
  for (let i = 0; i < 12; i++) { const h = 4 + hash(i * 13) * 12, x = 6 + hash(i * 17) * 30, z = -14 - hash(i * 19) * 40; const pr = mesh(box(4 + hash(i * 23) * 3, h, 4), LPmat(0x1a1210, { rim: 0.3, rough: 1 }), x, h / 2, z, g); pr.rotation.z = (hash(i) - 0.5) * 0.2; }
  const fg = [[10, -18, 3], [18, -26, 3.5], [8, -34, 2.6], [24, -14, 2.4], [14, -12, 2], [30, -30, 4], [6, -24, 2.2]].map(([x, z, s]) => fogoLonge(g, x, z, s)); const brasa = glowSprite(0xff6a2a, 60, 0.5); brasa.position.set(22, 6, -40); g.add(brasa);
  const lua = glowSprite(0xdde6ff, 6, 0.6); lua.position.set(-24, 22, -50); g.add(lua);
  const mo = morteLP(); g.add(mo); olhosBrilho(mo);
  return { ...LUZ_VAZIO_M, bg: 0x0a0a14, fog: [20, 140], fogCol: 0x140c14, hand: 0.004, rim: { col: 0xffb0c0, str: 1.6 },
    update(t) { fg.forEach((f) => f.update(t)); restPose(mo); mo.position.set(0, 0, 0); mo.rotation.y = Math.PI - Math.PI * smr(t, K.comenta - 0.9, K.comenta - 0.2); idle(mo, t, 711, 0.06); standFeet(mo); const sor = smr(t, K.comenta - 0.4, K.comenta);
      rostoLP(mo, t, { boca: sor > 0.5 ? "sorriso" : "linha", palpebra: 0.62 }); brilhoK(mo, 0.5 + 0.5 * sor); cabeloVento(mo, t, 0.5, [1, 0, 0.1]); },
    cam(t) { { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.2, 1.5, 1.8], [0.3, 2.8, 5.5], [0, 1.4, -10], [0, 2.4, -30], 50, 54)],
        [K.com - 0.3, mov([0.8, 1.6, 2.6], [1.2, 1.7, 2.4], [-6, 3, -20], [-10, 4, -30], 46, 46)],
        [K.sem - 0.3, mov([-0.8, 1.6, 2.6], [-1.2, 1.7, 2.4], [6, 3, -20], [10, 4, -30], 46, 46)],
        [K.comenta - 0.4, (tt, u) => ({ ...closeRosto(mo, lerp(0.9, 0.7, E.inOut(u)), 0.1, -0.02, 30) })],
      ], b); },
  };
});
