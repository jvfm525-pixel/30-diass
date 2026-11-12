// ================================================================ vídeo: Giorno · cenas 1–4
// pés plantados em posições dadas (IK) com o pé paralelo ao chão
function plantFeet(p, feet, ang, toe = [0, 0]) {
  const u = p.userData; p.updateMatrixWorld(true);
  [0, 1].forEach((i) => {
    const f = feet[i]; legIK(p, i, V3(f[0], f[1], f[2]), V3(f[0] + Math.sin(ang) * 1.2, f[1] + 0.6, f[2] + Math.cos(ang) * 1.2));
    u.knee[i].updateMatrixWorld(true); u.knee[i].getWorldQuaternion(_gq); _gq.invert(); _gq2.setFromEuler(_gE.set(-(toe[i] || 0), ang, 0, "YXZ")); u.ankle[i].quaternion.copy(_gq.multiply(_gq2));
  });
}
// posição dos pés parados (lado a lado) para um corpo em (x, z) com rumo ang
const standPos = (x, z, ang, hw = 0.11, fwd = [0.05, -0.05], y = 0) => [0, 1].map((i) => { const side = (i ? 1 : -1) * hw; return [x + Math.cos(ang) * side + Math.sin(ang) * fwd[i], y, z - Math.sin(ang) * side + Math.cos(ang) * fwd[i]]; });
const lerpF = (A, B, k) => [0, 1].map((i) => lerp3(A[i], B[i], k));
// estandarte de pano que ondula (vértices animados)
function estandarte(g, x, y, z, rotY, col = 0x8a1a1a, w = 1.3, h = 3.2) {
  const tx = canvasTex(128, 256, (c, ww, hh) => { c.fillStyle = "#" + new THREE.Color(col).getHexString(); c.fillRect(0, 0, ww, hh); c.fillStyle = "rgba(255,210,120,.85)"; c.fillRect(0, 10, ww, 8); c.fillRect(0, hh - 30, ww, 6); c.beginPath(); c.arc(ww / 2, hh * 0.42, 26, 0, 7); c.lineWidth = 5; c.strokeStyle = "rgba(255,210,120,.85)"; c.stroke(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.beginPath(); c.moveTo(ww / 2 + Math.cos(a) * 30, hh * 0.42 + Math.sin(a) * 30); c.lineTo(ww / 2 + Math.cos(a) * 42, hh * 0.42 + Math.sin(a) * 42); c.stroke(); } });
  const geo = new THREE.PlaneGeometry(w, h, 4, 10); geo.translate(0, -h / 2, 0);
  const m = mesh(geo, new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide, roughness: 0.9 }), x, y, z, g); m.rotation.y = rotY; m.userData.base = Float32Array.from(geo.attributes.position.array); m.frustumCulled = false;
  mesh(cyl(0.05, 0.05, w + 0.3, 8), SM(0x3a2a1a), x, y + 0.02, z, g).rotation.set(0, rotY, Math.PI / 2);
  return (t, wind = 1) => { const a = geo.attributes.position, b = m.userData.base; for (let i = 0; i < a.count; i++) { const xx = b[i * 3], yy = b[i * 3 + 1], k = -yy / h; a.setZ(i, b[i * 3 + 2] + (Math.sin(t * 1.7 + yy * 1.3 + x) * 0.12 + Math.sin(t * 3.1 + xx * 3 + yy * 2) * 0.04) * k * wind); } a.needsUpdate = true; geo.computeVertexNormals(); };
}
// tocheiro de ferro com chama (luz quente que tremula)
function lanternaArena(g, x, y, z) {
  const l = grp(g, x, y, z); mesh(cyl(0.12, 0.06, 0.25, 10), SM(0x2a221c, { metalness: 0.5 }), 0, 0, 0, l); mesh(cyl(0.03, 0.03, 0.5, 6), SM(0x2a221c), 0, -0.35, 0.12, l).rotation.x = 0.5;
  const fl = glowSprite(0xff9a40, 0.7, 0.85); fl.position.y = 0.22; l.add(fl); const L = new THREE.PointLight(0xff9040, 2.2, 7, 1.8); L.position.y = 0.3; l.add(L);
  l.userData = { fl, L }; TOCHAS.push(l); return l;
}
const TOCHAS = [];
function tochas(t) { TOCHAS.forEach((l, i) => { const f = 0.8 + noise1(t * 6 + i * 3) * 0.2; l.userData.fl.scale.setScalar(0.55 + 0.2 * f); l.userData.L.intensity = 2.0 * f; }); }
// painel de parede com um arco vazado (para arcadas instanciadas)
function bayGeo(w, h, aw, ah, d) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  const hole = new THREE.Path(); hole.moveTo(-aw / 2, 0); hole.lineTo(aw / 2, 0); hole.lineTo(aw / 2, ah - aw / 2); hole.absarc(0, ah - aw / 2, aw / 2, 0, Math.PI, false); hole.lineTo(-aw / 2, 0); s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 10 }); geo.translate(0, 0, -d / 2); return geo;
}

// ---------------------------------------------------------------- 1 · gancho: arena ao entardecer; o golpe para no ar, rebobina e some
addSet("s1-gancho", (g) => {
  const [a, b] = T.sc["s1-gancho"];
  const dome = skyDome(g, { top: 0x23306a, mid: 0x7a5a8a, midY: 0.16, hor: 0xffa060, ground: 0x2a1a14, sunDir: [-0.22, 0.12, -1], sunCol: 0xffb060, sunI: 1.1, disk: 2.2, cov: 0.52, cloudA: 0.85, cloudLit: 0xffc8a0, cloudSh: 0x5a3a5a, cloudScale: 0.16 });
  const hf = () => 0, Rx = 30, Rz = 22, podH = 4.2;
  // areia
  const st = texPair(512, (u, v) => fbm2(u * 24, v * 24, 4, 24) * 0.7 + fbm2(u * 90, v * 90, 2, 90) * 0.3, (u, v, h) => mixc(mixc([200, 156, 108], [232, 196, 148], fbm2(u * 5, v * 5, 4, 5)), [150, 110, 76], clamp((0.42 - h) * 1.4)), 2.2);
  rep(st.map, 9, 9); rep(st.normalMap, 9, 9);
  const fl = mesh(new THREE.CircleGeometry(1, 96), SM(0xffffff, { map: st.map, normalMap: st.normalMap, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 1 }), 0, 0, 0, g); fl.rotation.x = -Math.PI / 2; fl.scale.set(Rx + 1, Rz + 1, 1); fl.castShadow = false;
  // muro do pódio, cornija e cávea (degraus) em elipse
  const tv = texTravertino();
  const pod = mesh(new THREE.CylinderGeometry(1, 1, podH, 128, 1, true), matBlocos(tv, 26, 0.55), 0, podH / 2, 0, g); pod.scale.set(Rx, 1, Rz); pod.material.side = THREE.DoubleSide; pod.castShadow = false;
  const cor = mesh(new THREE.CylinderGeometry(1, 1, 0.45, 128, 1, true), SM(0xeadcc0, { side: THREE.DoubleSide }), 0, podH, 0, g); cor.scale.set(Rx + 0.15, 1, Rz + 0.15); cor.castShadow = false;
  const N = 11, prof = [[Rz + 0.05, podH + 0.2]];
  for (let i = 0; i < N; i++) { const r = Rz + 0.6 + i * 0.85, y = podH + 0.5 + i * 0.5; prof.push([r, y], [r + 0.85, y]); }
  prof.push([Rz + 0.6 + N * 0.85 + 0.3, podH + 0.5 + N * 0.5], [Rz + 0.6 + N * 0.85 + 0.3, 0]);
  const cav = mesh(lathe(prof, 128), matBlocos(texPedraLisa(), 40, 8, { rough: 0.95 }), 0, 0, 0, g); cav.scale.set(Rx / Rz, 1, 1); cav.material.side = THREE.DoubleSide; cav.castShadow = false;
  // arcadas em três andares (painéis com arco vazado, instanciados), com um setor em ruína
  const rOut = Rz + 0.6 + N * 0.85 + 1.4, base = podH + 0.5 + N * 0.5, bg = bayGeo(4.4, 7.2, 2.7, 5.4, 2.0);
  const bm = matBlocos(tv, 0.16, 0.16, { col: 0xf6e8d0 });
  const per = 2 * Math.PI * Math.sqrt(((rOut * Rx / Rz) ** 2 + rOut ** 2) / 2), nb = Math.floor(per / 4.4);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S1 = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3();
  for (let tier = 0; tier < 3; tier++) {
    const im = new THREE.InstancedMesh(bg, bm, nb); let k = 0;
    for (let i = 0; i < nb; i++) {
      const an = (i / nb) * Math.PI * 2, ruin = Math.sin(an * 1.0 + 0.6) > 0.55 ? 2 - Math.floor(hash(i * 3.1) * 2) : 3;
      if (tier >= ruin) continue;
      P.set(Math.sin(an) * rOut * Rx / Rz, base + tier * 7.2, Math.cos(an) * rOut);
      Q.setFromAxisAngle(V3(0, 1, 0), Math.atan2(Math.sin(an) * Rz / Rx, Math.cos(an))); M4.compose(P, Q, S1); im.setMatrixAt(k++, M4);
    }
    im.count = k; im.castShadow = true; im.receiveShadow = true; g.add(im);
    const cr = mesh(new THREE.CylinderGeometry(1, 1, 0.6, 128, 1, true), SM(0xe8d8bc, { side: THREE.DoubleSide }), 0, base + (tier + 1) * 7.2 + 0.3, 0, g); cr.scale.set(rOut * Rx / Rz - 0.9, 1, rOut - 0.9); cr.castShadow = false;
  }
  // portões da arena e estandartes
  const gateG = bayGeo(6.2, 5.6, 3.4, 4.4, 1.4), iron = SM(0x1e1a18, { metalness: 0.6, roughness: 0.5 });
  [1, -1].forEach((s) => { const gt = grp(g, 0, 0, s * (Rz + 0.1)); gt.rotation.y = s > 0 ? Math.PI : 0;
    mesh(gateG, matBlocos(tv, 0.2, 0.2), 0, 0, 0, gt); mesh(box(3.6, 4.6, 5), SM(0x1a120c, { side: THREE.BackSide }), 0, 2.3, -2.6, gt);
    mesh(box(3.5, 0.1, 5), SM(0x3a2a1c), 0, 0.02, -2.6, gt);
    for (let i = 0; i < 9; i++) mesh(box(0.06, 3.4, 0.06), iron, -1.6 + i * 0.4, 2.0 + 1.6, -0.3, gt); for (let j = 0; j < 4; j++) mesh(box(3.4, 0.06, 0.06), iron, 0, 2.3 + j * 0.6 + 1.0, -0.3, gt);
    const tl = lanternaArena(gt, 2.3, 3.0, 0.9); const tr = lanternaArena(gt, -2.3, 3.0, 0.9); });
  const flags = [];
  for (let i = 0; i < 10; i++) { const an = (i / 10) * Math.PI * 2 + 0.31; if (Math.abs(Math.cos(an)) > 0.96) continue; const x = Math.sin(an) * (Rx - 0.2), z = Math.cos(an) * (Rz - 0.2); flags.push(estandarte(g, x, podH - 0.1, z, Math.atan2(x / Rx, z / Rz) + Math.PI, i % 2 ? 0x7a1418 : 0x8a5a14)); }
  // colunas quebradas e pedras na areia
  [[-9, -6, 0.5], [11, -9, 0.35], [-12, 7, 0.7], [13, 6, 0.45]].forEach(([x, z, br], i) => coluna(g, x, z, 5, 0.42, { broken: br, mat: SM(0xe2d2b6) }));
  for (let i = 0; i < 9; i++) rock(g, (hash(i * 3) - 0.5) * 40, 0.1, (hash(i * 7) - 0.5) * 30, 0.3 + hash(i) * 0.5, i + 3, { col: 0xe8d0b0 });
  const rays = godRays(g, [-6, 30, -40], [0.22, -0.4, 1], { n: 9, len: 70, w: 5, spread: 22, opacity: 0.08, color: 0xffc080 });
  const motes = dustPts(260, [-14, 14, 0.2, 7, -16, 8], 0xffd8a0, 0.045, 0.7); g.add(motes);
  const brd = birds(g, 9, { center: [0, 26, -14], rx: 26, rz: 12, speed: 0.08 });
  const dust = dustRing(g, 0xd8b890);

  // personagens
  const gi = garoto(); g.add(gi); const GX = 0, GZ = 2.0;
  const sp = espDourado(); sp.scale.setScalar(1.12); g.add(sp);
  const bo = chefe(); g.add(bo);
  const cr = espCarmesim(); g.add(cr);
  const gh = fantasmas(g, () => chefe(), 3, 0xffc040);
  const ring = aneis(g, 4), zero = glyph(g, "0", "#ffd070", 0.9), onda = ondaDourada(g);
  const auraG = aura(g, 60, 0xffd070, 0.04), auraR = aura(g, 50, 0xff4050, 0.04);
  const clockR = grp(g); { const cm = glowM(0xffc860, 0.0); const rr = mesh(new THREE.TorusGeometry(1.6, 0.02, 6, 96), cm, 0, 0, 0, clockR); rr.rotation.x = Math.PI / 2; for (let i = 0; i < 12; i++) { const an = (i / 12) * Math.PI * 2; const tk = mesh(box(0.05, 0.02, i % 3 ? 0.18 : 0.34), cm, Math.sin(an) * 1.6, 0, Math.cos(an) * 1.6, clockR); tk.rotation.y = an; } const hd = mesh(box(0.04, 0.02, 1.3), cm, 0, 0, 0.65, clockR); clockR.userData = { cm, hd }; }

  // a investida (tempo da história σ): corre, derrapa, o espírito carmesim avança e soca
  const tS = Math.max(0.6, K.chega - 3.2), sHit = K.chega - tS, sR = sHit - 1.0, V = 5.0, ACC = 0.35;
  const runD = (s) => (s <= 0 ? 0 : s < ACC ? 0.5 * (V / ACC) * s * s : 0.5 * V * ACC + V * (s - ACC));
  const ZE = -2.9, D = runD(sR), Z0 = ZE - D, X0 = -0.15;
  const fist = V3(GX - 0.02, 1.62, GZ - 0.32);
  // pés no fim da corrida (para a derrapagem) e postura firme
  restPose(bo); const endFeet = gait(bo, D, { from: [X0, 0, Z0], ang: 0, run: 1, hf }).feet.map((f) => f.slice());
  const braced = [[X0 - 0.16, 0, ZE + 0.05], [X0 + 0.12, 0, ZE + 1.0]];
  function bossAt(p, s, t, o = {}) {
    restPose(p); idle(p, t, 21, 0.5);
    const u = p.userData;
    if (s <= sR) {
      const d = runD(s), gr = gait(p, d, { from: [X0, 0, Z0], ang: 0, run: 1, hf, lean: 0.06 }), w = smr(s, 0, 0.32);
      if (w < 1) { plantFeet(p, lerpF(standPos(X0, Z0, 0), gr.feet, w), 0); u.sh.forEach((sh) => (sh.rotation.x *= w)); }
      if (!o.ghost) { clothWind(p, t, 0.6 + 2.2 * w); hairPush(p, 0, -1.2 * w); chefeFlaps(p, t, 1 + 2 * w); }
      face(p, { angry: 0.75, brow: -0.4, open: 0.2 + 0.1 * Math.sin(t * 9) });
    } else {
      const k = smr(s, sR, sR + 0.32), zb = ZE + 0.45 * E.out(k);
      p.position.set(X0, 0, zb); p.rotation.set(0, 0, 0);
      u.hips.position.y = u.d.hipY - 0.13 * k; u.hips.rotation.set(0.1 * k, -0.25 * k, 0); u.spine.rotation.x = 0.22 * k; u.chest.rotation.y = 0.2 * k;
      plantFeet(p, lerpF(endFeet, braced, k), 0, [0, 0]);
      const pa = act(s, sR + 0.05, sR + 0.7, 0.35, 0.06);
      pose(p, { armR: [-1.45 * pa - 0.2, 0.1, -0.1, -0.15 - 0.5 * (1 - pa)], armL: [0.45, 0, 0.35, -0.9], handR: 0.1, handL: 0.8 });
      if (!o.ghost) { clothWind(p, t, 2.4 - 1.6 * k); hairPush(p, 0, 1.2 * (1 - k)); chefeFlaps(p, t, 2); }
      face(p, { angry: 0.9, brow: -0.5, open: 0.45 * pa });
    }
  }
  function crimAt(c, s, t, bp) {
    restPose(c); idle(c, t, 31, 0.6);
    const u = c.userData, appear = E.outBack(smr(s, 0.25, 0.75));
    c.scale.setScalar(Math.max(0.001, appear * 1.1));
    const behind = V3(bp.x - 0.5, 0.35 + Math.sin(t * 3) * 0.05, bp.z - 0.95), hitPos = V3(GX + 0.22, 0.12, GZ - 0.97);
    const lu = s <= sR ? 0 : act(s, sR, sHit, 0.18, 0.03);
    c.position.copy(behind.clone().lerp(hitPos, clamp(lu, -0.2, 1.05))); c.rotation.set(0, -0.12 * clamp(lu), 0);
    pose(c, { hips: [0.35 * (1 - clamp(lu)), 0, 0], legR: [0.5 * (1 - clamp(lu)) + 0.1, 0, -0.05, 0.6], legL: [0.3 * (1 - clamp(lu)) + 0.15, 0, 0.05, 0.8], spine: [0.15, 0, 0] });
    if (lu <= 0.05) pose(c, { armR: [0.6, 0, -0.25, -0.4], armL: [0.6, 0, 0.25, -0.4] });
    else if (lu < 0.5) pose(c, { armR: [0.9, 0, -0.35, -1.9], armL: [-0.5, 0, 0.3, -1.4], chest: [0, -0.45, 0], handR: 1, handL: 1 }, smr(lu, 0.05, 0.4));
    else { pose(c, { armL: [0.5, 0, 0.3, -1.2], chest: [0, 0.35, 0], handR: 1, handL: 0.9 }); armIK(c, 0, fist, V3(fist.x - 0.6, fist.y - 0.6, fist.z - 0.6), smr(lu, 0.5, 0.9)); }
    lookAtW(c, V3(GX, 1.6, GZ), 0.8);
  }
  // tempo apagado: o chefe "pula" quadros e aparece colado no garoto
  const eA = K.apagar0 - 0.12, eB = K.funcionou, XS = 0.55, Zs = GZ - 1.0, D2 = Math.hypot(XS - X0, Zs - Z0), AS = Math.atan2(XS - X0, Zs - Z0);
  function bossErase(p, e, t, o = {}) {
    restPose(p); idle(p, t, 21, 0.5); const u = p.userData;
    if (e <= 0.8) { const d = (e / 0.8) * D2; const gr = gait(p, d, { from: [X0, 0, Z0], ang: AS, run: 1, hf }); const w = smr(e, 0, 0.12); if (w < 1) plantFeet(p, lerpF(standPos(X0, Z0, AS), gr.feet, w), AS); }
    else { const k = smr(e, 0.8, 1), A = -0.5; p.position.set(XS, 0, Zs); p.rotation.set(0, A, 0); u.hips.position.y = u.d.hipY - 0.06; u.spine.rotation.x = -0.12 * k; plantFeet(p, [[XS - 0.12, 0, Zs - 0.28], [XS + 0.05, 0, Zs + 0.3]], A); pose(p, { armR: [-2.6 * k, 0, -0.3, -1.3 * k], armL: [-0.4, 0, 0.3, -0.6], handR: 1 }); }
    face(p, { angry: 1, brow: -0.6, open: 0.5 });
    if (!o.ghost) { clothWind(p, t, 2.2); chefeFlaps(p, t, 2); }
  }
  const eraseE = (t) => { if (t < eA) return 0; if (t < eB) { const q = (t - eA) / (eB - eA); return q < 0.34 ? 0 : q < 0.67 ? 0.45 : 1; } return 1 - E.in(seg(t, eB + 0.12, eB + 0.95)); };
  const sigma = (t) => rebob(t, tS, K.chega, 0.5, 1.25, E.in) * sHit;
  const lateS = Math.max(K.porque0 - 0.4, eB + 1.0);

  return {
    bg: 0x2a1c22, fogExp: 0.006, fogCol: 0xc88a68, dome,
    look: { exposure: 1.05, bloom: 0.6, bloomT: 0.8, vig: 0.42, sat: 1.12, con: 1.07, lift: [0.02, 0.0, 0.03] },
    sun: { dir: [-0.22, 0.3, -1], col: 0xffb070, I: 2.7, c: [0, 1, -3], r: 18 }, hemi: { sky: 0x8a90c8, ground: 0x7a5034, I: 0.62 }, fill: { col: 0x7a8ac8, I: 0.55, dir: [0.4, 0.3, 1] }, rim: { col: 0xffc890, str: 0.6 },
    update(t0) {
      const er = t0 >= eA && t0 < eB, t = er ? stutter(t0, 6) : t0;
      // garoto: calmo; olha o punho que parou; sorriso de canto
      restPose(gi); gi.position.set(GX, 0, GZ); gi.rotation.set(0, Math.PI, 0); idle(gi, t, 11, 0.7);
      const look = smr(t, K.nenhum, K.chega - 0.1) * (1 - smr(t, K.chega + 1.5, K.chega + 2.2));
      lookAtW(gi, fist, look * 0.9);
      if (t > K.chega + 1.5) lookAtW(gi, V3(X0, 1.4, Z0), smr(t, K.chega + 1.6, K.chega + 2.4) * 0.6);
      const smile = 0.12 + 0.25 * smr(t, K.chega + 0.2, K.chega + 0.8);
      face(gi, { smile, brow: 0.1 * smr(t, K.porque0, K.porque0 + 1), lid: 0.88 - 0.15 * (er ? 1 : 0) });
      standFeet(gi, { hf }); clothWind(gi, t, 0.7 + 0.8 * smr(t, K.porque0, K.porque0 + 1.5)); hairPush(gi, 0, 0, 0);
      // espírito dourado: atrás do garoto; ergue a palma quando o golpe chega
      restPose(sp); sp.position.set(GX - 0.45, 0.14 + Math.sin(t * 1.4) * 0.03, GZ + 0.42); sp.rotation.set(0, Math.PI, 0); idle(sp, t, 2, 0.5);
      standFeet(sp, { hf: () => sp.position.y });
      const palm = act(t, K.chega - 0.45, K.chega + 0.1, 0.2, 0.06) * (1 - smr(t, K.chega + 1.0, K.chega + 1.6));
      pose(sp, { armL: [-0.3, 0, 0.12, -0.3], handL: 0.3 });
      if (palm > 0.01) armIK(sp, 0, V3(fist.x - 0.1, fist.y + 0.03, fist.z + 0.12), V3(fist.x - 0.3, fist.y - 0.6, fist.z + 0.9), clamp(palm));
      pose(sp, { handR: 0 });
      lookAtW(sp, fist, smr(t, K.chega - 0.6, K.chega) * 0.8);
      sp.userData.eyeM.color.setScalar(1 + 2 * smr(t, K.chega - 0.1, K.chega + 0.1) * (1 - smr(t, K.chega + 0.6, K.chega + 1.2)));
      auraG(t, V3(sp.position.x, 0, sp.position.z), 0.6 + 0.4 * smr(t, K.porque0, K.porque0 + 1));
      // chefe e espírito carmesim
      let bpos;
      if (t < eA) { const s = sigma(t); bossAt(bo, s, t); crimAt(cr, s, t, bo.position); bpos = bo.position.clone(); }
      else { const e = eraseE(t0 >= eB ? t0 : t); bossErase(bo, e, t); const k = e > 0.8 ? 1 : 0; crimAt(cr, k ? sR + 0.4 : 0.3, t, bo.position); if (e > 0.8) { cr.position.set(XS + 0.45, 0.4, Zs - 0.75); cr.rotation.set(0, -0.5, 0); pose(cr, { armR: [-2.4, 0, -0.4, -1.2], armL: [-2.4, 0, 0.4, -1.2], handR: 1, handL: 1 }); } cr.scale.setScalar(e > 0.05 ? 1 : 0.001); bpos = bo.position.clone(); }
      if (t > lateS) { // depois: o chefe longe, confuso, depois de joelhos
        const kn = act(t, K.destino0 - 1.1, K.destino0 - 0.1, 0.1, 0.05);
        restPose(bo); bo.position.set(X0, 0, Z0); bo.rotation.set(0, 0, 0); idle(bo, t, 21, 1.2);
        if (kn < 0.02) { standFeet(bo, { hf }); pose(bo, { armR: [-1.9, 0.2, -0.5, -2.0], handR: 0.4, head: [0.15, 0, 0] }, smr(t, lateS, lateS + 0.8)); }
        else { kneelPose(bo, clamp(kn)); const fu = bo.userData; pose(bo, { armR: [-0.9, 0, -0.2, -1.2], armL: [-0.9, 0, 0.2, -1.2], handR: 0.3, handL: 0.3, head: [0.45 - 0.75 * smr(t, K.assustador - 0.4, K.assustador + 0.2), 0, 0] }); }
        face(bo, { brow: 0.6, sad: 0.4, open: 0.35 + 0.15 * smr(t, K.assustador - 0.3, K.assustador), lid: 1 });
        cr.scale.setScalar(Math.max(0.001, 1.1 * (1 - smr(t, lateS, lateS + 0.5))));
        clothWind(bo, t, 0.8); chefeFlaps(bo, t, 1);
      }
      auraR(t, V3(cr.position.x, cr.position.y - 0.2, cr.position.z), cr.scale.x > 0.5 ? 0.7 : 0, 0.45, 1.8);
      // fantasmas dourados no rebobinar (o chefe em instantes "mais adiante" da história)
      const rw1 = t > K.chega + 0.5 && t < K.chega + 1.75, rw2 = t0 > eB + 0.1 && t0 < eB + 1.0;
      gh.forEach((p, i) => {
        p.visible = rw1 || rw2; if (!p.visible) return;
        if (rw1) { const s = Math.min(sHit, sigma(t) + (i + 1) * 0.16); bossAt(p, s, t, { ghost: true }); p.userData.holo.uniforms.uA.value = 0.55 - i * 0.14; }
        else { const e = Math.min(1, eraseE(t0) + (i + 1) * 0.08); bossErase(p, e, t, { ghost: true }); p.userData.holo.uniforms.uA.value = 0.55 - i * 0.14; }
      });
      // anéis, "0", onda dourada, relógio em volta do chefe
      ring(t, K.chega - 0.02, fist, [0, 0, 1], 0.9, 1.0);
      const zk = smr(t, K.chega - 0.05, K.chega + 0.15) * (1 - smr(t, K.chega + 0.7, K.chega + 1.1));
      zero.position.set(fist.x + 0.02, fist.y + 0.38, fist.z - 0.05); zero.material.opacity = zk; zero.scale.setScalar(0.25 + 0.25 * E.outBack(smr(t, K.chega - 0.05, K.chega + 0.25)));
      onda(t0, eB, V3(sp.position.x, 1.3, sp.position.z), 34, 1.1);
      const ck = smr(t, K.destino0 - 0.6, K.destino0 + 0.4);
      clockR.position.set(X0, 0.08, Z0); clockR.rotation.y = -t * 0.9; clockR.userData.hd.rotation.y = -t * 4; clockR.userData.cm.opacity = ck * 0.85; clockR.scale.setScalar(1.15 - 0.25 * smr(t, K.assustador - 0.5, b));
      dust(t, K.chega - 1.0, V3(X0, 0, ZE + 0.4), 1.1, 1.1); flags.forEach((f) => f(t, 1)); tochas(t); floatDust(motes, t, 0.5, 0.25); brd(t); dome.userData.u.uOff.value.set(t * 0.004, 0);
      rays.userData.rays.forEach((r, i) => (r.material.opacity = (0.06 + 0.03 * Math.sin(t * 0.7 + i)) * (er ? 0.3 : 1)));
    },
    after(t) {
      const er = t >= eA && t < eB;
      lookApagado(er ? 1 - smr(t, eB - 0.08, eB) * 0 : 0, t);
      if (er) { const q = Math.floor(t * 6); GU.uFlash.value = hash(q * 3.3) > 0.72 ? 0.35 : 0; GU.uFlashCol.value.set(1, 0.2, 0.2); }
      else { GU.uFlashCol.value.set(1, 0.95, 0.8); GU.uFlash.value = Math.max(0, 0.6 * (1 - seg(t, eB, eB + 0.35))) * (t >= eB ? 1 : 0) + 0.12 * (1 - seg(t, K.chega - 0.02, K.chega + 0.2)) * (t >= K.chega - 0.02 ? 1 : 0); }
      const rk = (t > K.chega + 0.5 && t < K.chega + 1.75) || (t > eB + 0.1 && t < eB + 1.0) ? 1 : 0;
      lookRebobina(rk);
    },
    cam(t0) {
      const t = t0 >= eA && t0 < eB ? stutter(t0, 6) : t0;
      const c = path(t, [
        [a, [4.2, 2.6, 9.5], [0.0, 1.5, 0.5], 42],
        [Math.min(1.8, K.nenhum - 1.2), [1.5, 2.0, 6.8], [-0.05, 1.45, -1.0], 38],
        [K.nenhum - 0.2, [0.95, 1.8, 5.2], [-0.05, 1.5, 0.2], 36],
        [K.chega, [2.1, 1.68, 1.75], [0.0, 1.58, 1.78], 36],
        [K.chega + 0.5, [1.4, 1.8, 3.6], [-0.1, 1.45, -2.0], 36],
        [K.chega + 1.6, [0.9, 1.85, 5.4], [-0.1, 1.4, -6.0], 36],
        [K.apagar0 + 0.1, [0.8, 1.8, 5.6], [0.1, 1.5, -1.0], 36],
        [K.funcionou - 0.05, [0.8, 1.75, 5.2], [0.2, 1.55, -0.4], 36],
        [K.funcionou + 0.5, [1.8, 1.5, -0.6], [0.0, 1.45, 1.8], 36],
        [K.porque0 + 0.6, [-0.4, 0.8, -0.9], [-0.1, 1.75, 2.2], 34],
        [K.impossivel, [0.5, 0.7, -0.8], [-0.15, 1.75, 2.2], 33],
        [K.fica + 0.2, [1.2, 1.6, 0.4], [X0, 1.2, Z0 + 2], 36],
        [K.destino0, [-0.4, 1.5, Z0 + 3.4], [X0, 0.75, Z0], 34],
        [b, [0.3, 1.3, Z0 + 2.2], [X0, 0.8, Z0], 30],
      ]);
      const sh = impact(t, K.chega, 0.06, 0.5) + impact(t0, eB, 0.12, 0.7);
      return { ...shakeCam(c, t, sh), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 2 · a Flecha: templo em ruínas ao entardecer; a flecha atravessa o espírito e ele evolui
addSet("s2-flecha", (g) => {
  const [a, b] = T.sc["s2-flecha"];
  const dome = skyDome(g, { top: 0x1c2858, mid: 0x7a5a86, midY: 0.17, hor: 0xff9658, ground: 0x2a1a14, sunDir: [0.12, 0.09, -1], sunCol: 0xffa050, sunI: 1.15, disk: 2.6, cov: 0.56, cloudA: 0.8, cloudLit: 0xffb890, cloudSh: 0x4a3a5a, cloudScale: 0.15 });
  const FY = 0.9, hf0 = () => FY;
  const hfT = (x, z) => { const r = Math.hypot(x * 0.8, z); return r < 16 ? -0.05 : (r - 16) * 0.05 * (0.6 + fbm2(x * 0.03, z * 0.03, 3)) + Math.max(0, r - 70) * 0.3 * fbm2(x * 0.01 + 3, z * 0.01, 3); };
  terrain(g, { h: hfT, size: 420, segs: 110, grassA: 0x55642e, grassB: 0x8a8640, dirt: 0x8a7050 });
  grassField(g, 2600, [-16, 16, -18, 18], hfT, { mask: (x, z) => Math.abs(x) > 6.4 || Math.abs(z) > 10.6, colA: 0x6a7a34, colB: 0xb8a85a, s: 1.3 });
  // plataforma (estilóbato) em três degraus
  const tv = texTravertino();
  [[12.4, 20.6, 0.15], [11.6, 19.8, 0.45], [10.8, 19.0, 0.75]].forEach(([w, d, y], i) => mesh(box(w, 0.3, d), matBlocos(tv, w / 5, d / 5), 0, y, 0, g));
  // colunatas (algumas quebradas), arquitraves e fragmento de frontão
  const cm = SM(0xead8bc, { roughness: 0.85 }), colH = 7.2, colR = 0.5, tops = [];
  [-4.3, 4.3].forEach((x, si) => { for (let i = 0; i < 7; i++) { const z = -8.1 + i * 2.7, h = hash(i * 3.3 + si * 7); const br = (si === 0 && (i === 2 || i === 5)) || (si === 1 && i === 4) ? 0.25 + h * 0.4 : null; if (si === 1 && i === 1) continue; const c = coluna(g, x, z, colH, colR, { y: FY, broken: br, mat: cm }); tops.push([x, z, br == null]); } });
  const arch = (x, z0, z1) => mesh(box(1.25, 0.9, z1 - z0 + 1.2), matBlocos(tv, 0.6, 1.2), x, FY + colR * 0.9 + colH + colR * 0.9 + 0.45, (z0 + z1) / 2, g);
  arch(-4.3, -8.1, -2.7); arch(4.3, 2.7, 8.1); arch(-4.3, 5.4, 8.1);
  const ped = new THREE.Shape(); ped.moveTo(-5, 0); ped.lineTo(5, 0); ped.lineTo(0, 2.2); ped.lineTo(-5, 0);
  const pg = mesh(new THREE.ExtrudeGeometry(ped, { depth: 0.8, bevelEnabled: false }), matBlocos(tv, 0.25, 0.25), -1.2, FY + colH + 2.25, -9.3, g); pg.rotation.z = 0.06;
  mesh(box(10.8, 4.5, 0.8), matBlocos(tv, 2, 1), 0, FY + 2.25, -9.6, g);
  // tambores de coluna caídos, entulho e grama nas frestas
  [[2.2, -5.8, 0.4], [-2.8, 4.6, 1.2], [5.6, -2.0, 2.0], [-6.5, 1.0, 0.7], [3.3, 6.2, 2.6]].forEach(([x, z, r], i) => { const d = mesh(colunaGeo(1.2, 0.48), cm, x, (Math.abs(x) > 5.4 ? 0 : FY) + 0.48, z, g); d.rotation.set(0, r, Math.PI / 2); });
  for (let i = 0; i < 14; i++) rock(g, (hash(i * 3.7) - 0.5) * 12, FY + 0.05, (hash(i * 5.3) - 0.5) * 18, 0.12 + hash(i) * 0.25, i + 11, { col: 0xe0ccb0 });
  // altar com a flecha
  const alt = grp(g, -0.7, FY, -3.2); mesh(box(1.0, 0.25, 1.0), cm, 0, 0.12, 0, alt); mesh(cyl(0.32, 0.38, 0.9, 20), cm, 0, 0.7, 0, alt); mesh(box(0.85, 0.16, 0.85), cm, 0, 1.22, 0, alt);
  [[-20, -26], [24, -30], [-34, -12], [30, 4], [-26, 18], [18, 26], [-44, -40], [40, -44], [0, -52]].forEach(([x, z], i) => cipreste(g, x, hfT(x, z), z, 8 + hash(i) * 5, i + 2));
  const rays = godRays(g, [0, 14, -26], [0, -0.32, 1], { n: 10, len: 60, w: 4.5, spread: 12, opacity: 0.09, color: 0xffb070 });
  const motes = dustPts(240, [-5, 5, FY, FY + 6, -8, 6], 0xffe0b0, 0.035, 0.75); g.add(motes);
  const brd = birds(g, 6, { center: [0, 22, -30], rx: 22, rz: 8, speed: 0.07 });

  const gi = garoto(); g.add(gi);
  const sp = evoluir(espDourado({ emisI: 0.5 })); sp.scale.setScalar(1.12); g.add(sp);
  const ar = flecha(g); ar.scale.setScalar(1.1);
  const ring = aneis(g, 4, 0xffe090), burst = aura(g, 140, 0xffd070, 0.05), onda = ondaDourada(g);
  const SX = -0.7, SZ0 = 0.7, L = 0.55 * 1.12, DS = gaitStop(1.55, L), SZ1 = SZ0 - DS;
  const chestY = FY + 1.52, hitZ = SZ1 + 0.02, A0 = -3.25;
  const tA = K.atravessou;
  // a flecha: flutua sobre o altar, sobe girando, aponta, recua (antecipação) e mergulha no peito do espírito
  const P0 = V3(SX, chestY + 0.3, A0), P1 = V3(SX, chestY + 2.0, -2.3), H = V3(SX, chestY, hitZ), dirH = H.clone().sub(P1).normalize(), P1b = P1.clone().addScaledVector(dirH, -0.4);
  const arrowAt = (t) => {
    if (t < K.flecha + 0.15) return { p: P0.clone().add(V3(0, Math.sin(t * 1.6) * 0.05, 0)), aim: V3(SX, P0.y, 10), roll: t * 0.9 };
    if (t < tA - 0.6) { const k = E.inOut(seg(t, K.flecha + 0.15, tA - 0.6)); const p = P0.clone().lerp(P1, k); p.x += Math.sin(k * Math.PI) * 0.6; return { p, aim: p.clone().add(V3(0, 0, 1).lerp(dirH, sm(seg(k, 0.4, 1)))), roll: t * 0.9 + k * 6 }; }
    if (t < tA - 0.22) { const k = E.inOut(seg(t, tA - 0.6, tA - 0.22)); return { p: P1.clone().lerp(P1b, k), aim: H, roll: (tA - 0.6) * 0.9 + 6 }; }
    if (t < tA) return { p: P1b.clone().lerp(H, E.in(seg(t, tA - 0.22, tA))), aim: H.clone().addScaledVector(dirH, 2), roll: (tA - 0.6) * 0.9 + 6 };
    return { p: H.clone().addScaledVector(dirH, 0.42 * E.out(seg(t, tA, tA + 0.12))), aim: H.clone().addScaledVector(dirH, 2), roll: (tA - 0.6) * 0.9 + 6 };
  };
  return {
    bg: 0x2a1c24, fogExp: 0.0075, fogCol: 0xc88a6a, dome,
    look: { exposure: 1.18, bloom: 0.6, bloomT: 0.82, vig: 0.4, sat: 1.1, con: 1.05, lift: [0.02, 0.01, 0.03] },
    sun: { dir: [0.12, 0.26, -1], col: 0xffaa66, I: 2.6, c: [0, 1, -2], r: 14 }, hemi: { sky: 0x9a9ad0, ground: 0x7a5a3a, I: 0.78 }, fill: { col: 0xffc8a0, I: 0.7, dir: [0.7, 0.35, -0.2] }, rim: { col: 0xffc890, str: 0.6 },
    update(t) {
      // o espírito anda dois passos em direção à flecha (pés plantados), é atravessado, se arqueia, sobe e evolui
      const u = sp.userData, walkK = smr(t, K.flecha - 0.1, tA - 0.75), hitK = act(t, tA, tA + 0.7, 0.05, 0.25);
      restPose(sp); idle(sp, t, 2, 0.5);
      const rise = 0.55 * E.inOut(smr(t, K.stand, K.evoluiu)) + 0.1 * smr(t, K.evoluiu, b);
      if (rise < 0.01) gait(sp, DS * walkK, { from: [SX, FY, SZ0], ang: Math.PI, hf: hf0, arms: 0.5 });
      else { sp.position.set(SX, FY + rise, SZ1); sp.rotation.set(0, Math.PI, 0); pose(sp, { legR: [0.25, 0, -0.05, 0.5, 0.35], legL: [0.1, 0, 0.08, 0.3, 0.3] }); }
      if (rise < 0.01 && walkK >= 1) standFeet(sp, { hf: hf0 });
      const arch = clamp(hitK) * (1 - smr(t, K.evoluiu - 0.3, K.evoluiu + 0.3));
      pose(sp, { spine: [-0.32 * arch, 0, 0], chest: [-0.2 * arch, 0, 0], neck: [-0.3 * arch, 0, 0], armR: [0.3 * arch, 0, -1.1 * arch, -0.3], armL: [0.3 * arch, 0, 1.1 * arch, -0.3], handR: 0.1, handL: 0.1 });
      const open = act(t, K.virou - 0.2, K.virou + 0.8, 0.15, 0.06);
      if (t > K.evoluiu - 0.3) pose(sp, { armR: [-0.3 - 0.2 * open, 0, -0.9 * open, -0.25], armL: [-0.3 - 0.2 * open, 0, 0.9 * open, -0.25], head: [-0.12 * open, 0, 0], handR: 0, handL: 0 }, smr(t, K.evoluiu - 0.3, K.evoluiu + 0.4));
      const ev = smr(t, K.evoluiu - 0.05, K.evoluiu + 0.6);
      u.goldM.emissiveIntensity = 0.5 + 1.6 * smr(t, tA, K.stand + 0.4) * (0.75 + 0.25 * Math.sin(t * 9)) * (1 - ev) + 0.45 * ev;
      sp.scale.setScalar(1.12 * (1 + 0.1 * ev)); evoAnim(sp, t, ev);
      u.eyeM.color.setScalar(1 + 2.5 * smr(t, K.evoluiu - 0.2, K.evoluiu + 0.2));
      // a flecha: flutua girando, recua, dispara, crava e se desfaz em luz
      const st = arrowAt(t), dis = smr(t, K.evoluiu - 0.25, K.evoluiu + 0.15);
      ar.position.copy(st.p); if (t >= tA) ar.position.y += rise; ar.lookAt(st.aim.x, st.aim.y + (t >= tA ? rise : 0), st.aim.z); ar.rotateZ(st.roll);
      ar.scale.setScalar(Math.max(0.001, 1.1 * (1 - dis))); ar.userData.tipGlow.material.opacity = 0.25 + 0.15 * Math.sin(t * 5);
      // garoto: olha a flecha e o espírito; se protege do clarão e depois olha maravilhado
      restPose(gi); gi.position.set(0.2, FY, 0.45); gi.rotation.set(0, Math.PI - 0.25, 0); idle(gi, t, 11, 0.6); standFeet(gi, { hf: hf0 });
      lookAtW(gi, t < tA + 0.3 ? ar.position : V3(SX, chestY + rise + 0.3, SZ1), 0.85);
      const shield = act(t, K.evoluiu - 0.35, K.evoluiu + 0.1, 0.2, 0.05) * (1 - smr(t, K.virou + 0.1, K.virou + 0.9));
      if (shield > 0.01) armIK(gi, 1, V3(0.26, FY + 1.68, 0.21), V3(0.9, FY + 1.0, 0.6), clamp(shield));
      face(gi, { brow: 0.7 * smr(t, tA - 0.1, tA + 0.2), open: 0.25 * smr(t, tA, tA + 0.3) * (1 - smr(t, K.virou, K.virou + 0.6)), smile: 0.3 * smr(t, K.virou, K.virou + 0.8), lid: 0.95 - 0.5 * shield });
      clothWind(gi, t, 0.6 + 2.2 * smr(t, K.evoluiu - 0.1, K.evoluiu + 0.3) * (1 - smr(t, K.evoluiu + 0.8, b)) + 0.4); hairPush(gi, 0, 1.5 * smr(t, K.evoluiu - 0.1, K.evoluiu + 0.2) * (1 - smr(t, K.evoluiu + 0.6, K.evoluiu + 1.4)));
      // luz: anéis no impacto, partículas girando na transformação, onda no clarão
      const cp = V3(SX, chestY + rise, SZ1);
      ring(t, tA, cp, dirH.toArray(), 1.1, 0.9); ring(t, K.evoluiu, cp, [0, 0, -1], 2.6, 1.2);
      burst(t, V3(SX, FY + rise, SZ1), smr(t, K.stand - 0.3, K.stand + 0.5) * (1 - 0.6 * smr(t, K.evoluiu + 0.6, b)), 0.9 + 0.6 * smr(t, K.stand, K.evoluiu), 3.2);
      onda(t, K.evoluiu, cp, 18, 1.0);
      floatDust(motes, t, 0.35, 0.2); brd(t); dome.userData.u.uOff.value.set(t * 0.004, 0);
      rays.userData.rays.forEach((r, i) => (r.material.opacity = 0.07 + 0.03 * Math.sin(t * 0.6 + i * 1.7) + 0.08 * smr(t, K.evoluiu, K.evoluiu + 0.4) * (1 - smr(t, K.evoluiu + 0.6, b))));
    },
    after(t) {
      GU.uFlashCol.value.set(1, 0.92, 0.7);
      GU.uFlash.value = 0.2 * (1 - seg(t, tA, tA + 0.25)) * (t >= tA ? 1 : 0) + 0.6 * Math.pow(1 - seg(t, K.evoluiu, K.evoluiu + 0.45), 2) * (t >= K.evoluiu ? 1 : 0);
    },
    cam(t) {
      const c = path(t, [
        [a, [SX + 0.45, chestY + 0.18, A0 + 0.98], [SX, chestY + 0.33, A0 + 0.6], 30],
        [K.flecha + 0.3, [SX + 0.45, chestY + 0.25, A0 - 1.9], [SX, chestY - 0.1, SZ1 + 0.4], 36],
        [tA - 0.75, [SX + 4.2, 3.05, -1.65], [SX, 3.0, -1.6], 42],
        [tA - 0.1, [SX + 4.0, 2.9, -1.5], [SX, 2.85, -1.45], 42],
        [tA + 0.6, [SX + 2.3, chestY - 0.2, -3.6], [SX, chestY + 0.1, SZ1], 38],
        [K.evoluiu - 0.3, [SX + 1.0, FY + 0.7, -4.4], [SX + 0.2, chestY + 0.5, SZ1 + 0.3], 40],
        [K.virou, [SX + 1.7, FY + 0.45, -4.6], [SX + 0.55, chestY + 0.6, SZ1 + 0.4], 40],
        [b, [SX + 2.3, FY + 0.5, -4.2], [SX + 0.6, chestY + 0.7, SZ1 + 0.4], 38],
      ]);
      return { ...shakeCam(c, t, impact(t, tA, 0.05, 0.45) + impact(t, K.evoluiu, 0.08, 0.8)), near: 0.02 };
    },
  };
});

// ---------------------------------------------------------------- 3 · voltar a zero: espaço do tempo sobre um relógio gigante; golpes que voltam como fita rebobinada
function clockTex(size = 1024, o = {}) {
  return canvasTex(size, size, (c, w) => {
    const r = w / 2; c.fillStyle = o.bg ?? "#0d0b16"; c.fillRect(0, 0, w, w);
    for (let i = 0; i < 160; i++) { c.strokeStyle = `rgba(${hash(i) > 0.5 ? "120,110,150" : "60,50,80"},${0.05 + hash(i * 3) * 0.07})`; c.lineWidth = 1 + hash(i * 5) * 3; c.beginPath(); c.moveTo(hash(i * 7) * w, hash(i * 11) * w); c.bezierCurveTo(hash(i * 13) * w, hash(i * 17) * w, hash(i * 19) * w, hash(i * 23) * w, hash(i * 29) * w, hash(i * 31) * w); c.stroke(); }
    const gold = o.col ?? "#f2c260";
    c.strokeStyle = gold; c.fillStyle = gold;
    [[0.985, 0.012], [0.93, 0.004], [0.66, 0.006], [0.62, 0.003], [0.16, 0.005]].forEach(([k, lw]) => { c.lineWidth = w * lw; c.beginPath(); c.arc(r, r, r * k, 0, 7); c.stroke(); });
    for (let i = 0; i < 60; i++) { const an = (i / 60) * Math.PI * 2, k0 = i % 5 ? 0.9 : 0.86; c.lineWidth = w * (i % 5 ? 0.003 : 0.007); c.beginPath(); c.moveTo(r + Math.sin(an) * r * k0, r - Math.cos(an) * r * k0); c.lineTo(r + Math.sin(an) * r * 0.93, r - Math.cos(an) * r * 0.93); c.stroke(); }
    const RN = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
    c.font = `700 ${Math.round(w * 0.075)}px serif`; c.textAlign = "center"; c.textBaseline = "middle";
    RN.forEach((n, i) => { const an = (i / 12) * Math.PI * 2; c.save(); c.translate(r + Math.sin(an) * r * 0.765, r - Math.cos(an) * r * 0.765); c.rotate(an); c.fillText(n, 0, 0); c.restore(); });
    for (let i = 0; i < 24; i++) { const an = (i / 24) * Math.PI * 2; c.lineWidth = w * 0.002; c.beginPath(); c.moveTo(r + Math.sin(an) * r * 0.18, r - Math.cos(an) * r * 0.18); c.lineTo(r + Math.sin(an) * r * (i % 2 ? 0.45 : 0.58), r - Math.cos(an) * r * (i % 2 ? 0.45 : 0.58)); c.stroke(); }
  });
}
function engrenagem(g, R, teeth, th, mat) {
  const s = new THREE.Shape(), n = teeth * 4;
  for (let i = 0; i <= n; i++) { const an = (i / n) * Math.PI * 2, k = i % 4 < 2 ? 1 : 0.86; const x = Math.cos(an) * R * k, y = Math.sin(an) * R * k; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  const hole = new THREE.Path(); hole.absarc(0, 0, R * 0.3, 0, Math.PI * 2, true); s.holes.push(hole);
  for (let k = 0; k < 6; k++) { const an = (k / 6) * Math.PI * 2 + 0.26, h2 = new THREE.Path(); h2.absarc(Math.cos(an) * R * 0.6, Math.sin(an) * R * 0.6, R * 0.13, 0, Math.PI * 2, true); s.holes.push(h2); }
  return mesh(new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false, curveSegments: 6 }), mat, 0, 0, 0, g);
}
addSet("s3-zero", (g) => {
  const [a, b] = T.sc["s3-zero"];
  const dt = clockTex(2048);
  const dial = mesh(new THREE.CircleGeometry(9, 128), new THREE.MeshStandardMaterial({ map: dt, emissive: 0xffffff, emissiveMap: dt, emissiveIntensity: 0.55, roughness: 0.32, metalness: 0.35 }), 0, 0, 0, g); dial.rotation.x = -Math.PI / 2; dial.castShadow = false;
  mesh(new THREE.TorusGeometry(9.05, 0.12, 10, 128), GOLDM(), 0, 0, 0, g).rotation.x = Math.PI / 2;
  const handM = GOLDM(); handM.emissive.set(0xffa020); handM.emissiveIntensity = 0.7;
  const mkHand = (len, w) => { const hg = grp(g, 0, 0.04, 0); const m = mesh(box(w, 0.05, len), handM, 0, 0, -len / 2 + 0.4, hg); m.castShadow = false; mesh(new THREE.ConeGeometry(w * 1.6, 0.8, 4), handM, 0, 0, -len - 0.1, hg).rotation.x = -Math.PI / 2; return hg; };
  const hH = mkHand(4.2, 0.22), hM = mkHand(7.0, 0.14); mesh(cyl(0.45, 0.5, 0.12, 24), GOLDM(), 0, 0.06, 0, g);
  // relógios flutuando no escuro, engrenagens e chuva de números
  const ct = clockTex(512, { bg: "#16121e", col: "#e8b860" }), clocks = [];
  [[-12, 7, -18, 3.2], [13, 10, -22, 4.2], [-17, 3, -6, 2.4], [16, 2, 4, 2.6], [-9, 13, -30, 5.5], [6, 15, -34, 3.6], [-15, 9, 10, 3.0], [11, 6, 14, 2.2]].forEach(([x, y, z, r], i) => {
    const c = grp(g, x, y, z); c.lookAt(0, 2, 0); c.rotateZ(hash(i) * 0.6);
    mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshStandardMaterial({ map: ct, emissive: 0xffffff, emissiveMap: ct, emissiveIntensity: 0.45, roughness: 0.4 }), 0, 0, 0, c);
    mesh(new THREE.TorusGeometry(r, r * 0.05, 8, 64), GOLDM(), 0, 0, 0, c);
    const h1 = grp(c, 0, 0, 0.05), h2 = grp(c, 0, 0, 0.08); mesh(box(r * 0.06, r * 0.55, 0.02), handM, 0, r * 0.27, 0, h1); mesh(box(r * 0.04, r * 0.82, 0.02), handM, 0, r * 0.4, 0, h2);
    clocks.push({ c, h1, h2, sp: 0.4 + hash(i * 3) * 1.2, y0: y });
  });
  const gm = new THREE.MeshStandardMaterial({ color: 0x8a6a30, metalness: 0.85, roughness: 0.4, envMap: envGold(), envMapIntensity: 0.6, emissive: 0x2a1a04 }), gears = [];
  [[-8, 6, -24, 5, 24], [-1.5, 9, -26, 3.2, 16], [10, 4, -20, 4, 20], [14, 12, -28, 2.6, 14]].forEach(([x, y, z, R, n], i) => { const gg = grp(g, x, y, z); gg.lookAt(0, 4, 0); const e = engrenagem(gg, R, n, 0.6, gm); e.position.z = -0.3; gears.push({ gg, e, sp: (i % 2 ? -1 : 1) * (0.18 / R) * 4 }); });
  const digT = "0123456789".split("").map((d) => canvasTex(128, 128, (c, w) => { c.clearRect(0, 0, w, w); c.font = "700 100px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#ffd890"; c.fillText(d, w / 2, w / 2 + 6); }));
  const digits = []; for (let i = 0; i < 70; i++) { const sMat = new THREE.SpriteMaterial({ map: digT[i % 3 === 0 ? 0 : Math.floor(hash(i * 3.7) * 10)], transparent: true, depthWrite: false, blending: ADD, opacity: 0.6 }); const sp_ = new THREE.Sprite(sMat); sp_.scale.setScalar(0.5 + hash(i) * 0.9); g.add(sp_); digits.push(sp_); }
  const swirl = flowPts(320, 0xffd27a, 0.04); g.add(swirl.pts); swirl.pts.material.opacity = 0.7;
  const ring = aneis(g, 4, 0xffd070), zero = glyph(g, "0", "#ffd070", 1.0);
  // personagens
  const sp = evoluir(espDourado({ emisI: 0.5 })); sp.scale.setScalar(1.15); g.add(sp);
  const bo = chefe(); g.add(bo); const cr = espCarmesim(); cr.scale.setScalar(1.1); g.add(cr); cr.userData.glow.material.opacity = 0.05; sp.userData.glow.material.opacity = 0.08;
  const crG = fantasmas(g, () => espCarmesim(), 3, 0xff4a5a); crG.forEach((p) => p.scale.setScalar(1.1));
  const shard = grp(g); { const sm_ = new THREE.MeshStandardMaterial({ color: 0xc81830, emissive: 0xff2040, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.3 }); const sh = mesh(new THREE.OctahedronGeometry(0.09, 0), sm_, 0, 0, 0, shard); sh.scale.set(0.6, 0.6, 2.2); const gl = glowSprite(0xff3048, 0.5, 0.6); shard.add(gl); }
  const shG = Array.from({ length: 4 }, () => { const s_ = glowSprite(0xffd070, 0.3, 0); g.add(s_); return s_; });
  const auraBo = aura(g, 120, 0xff3a3a, 0.06);
  const SPP = V3(0, 0.18, 2.0), BP = V3(0.25, 0, -2.6), CR0 = V3(-0.75, 0.32, -2.2), face0 = V3(0.0, 1.98, 1.6);
  const hand0 = () => { bo.updateMatrixWorld(true); return wpos(bo.userData.wr[0]); };
  // ações (tempo da história de cada uma)
  const q = K.qualquer2, ac = K.acao, gp = K.golpe;
  const punch1 = (t) => rebob(t, q - 0.4, q + 0.18, 0.3, 0.8, E.inOut);
  const thr = (t) => { if (t < ac - 0.5) return 0; if (t < ac + 0.35) return seg(t, ac - 0.5, ac + 0.35); if (t < ac + 0.65) return 1; return 1 - E.inOut(seg(t, ac + 0.65, ac + 1.35)); };
  const punch2 = (t) => { if (t < gp - 0.45) return 0; if (t < K.nunca2 - 0.15) { const k = seg(t, gp - 0.45, K.nunca2 - 0.15); return 0.985 * (1 - Math.pow(1 - k, 2.4)); } return 0.985 * (1 - E.in(seg(t, K.nunca2 - 0.15, K.nunca2 + 0.45))); };
  function crimAt(c, k, t, fistTo) {
    restPose(c); idle(c, t, 31, 0.7);
    const hit = V3(face0.x + 0.22, 0.32, face0.z - 1.05), lu = clamp(k);
    c.position.copy(CR0.clone().lerp(hit, E.inOut(lu))); c.position.y += Math.sin(t * 2.4) * 0.03; c.rotation.set(0, -0.15 * lu, 0);
    pose(c, { hips: [0.25 * (1 - lu), 0, 0], legR: [0.25, 0, -0.05, 0.5], legL: [0.1, 0, 0.06, 0.4], spine: [0.1 + 0.15 * lu, 0, 0], chest: [0, -0.35 + 0.7 * lu, 0], armL: [0.4, 0, 0.3, -1.3], handR: 1, handL: 0.9 });
    if (lu < 0.35) pose(c, { armR: [0.7, 0, -0.35, -1.9] }, smr(lu, 0, 0.3)); else armIK(c, 0, fistTo, V3(fistTo.x - 0.6, fistTo.y - 0.6, fistTo.z - 0.7), smr(lu, 0.35, 0.8));
    lookAtW(c, face0, 0.8);
  }
  return {
    bg: 0x05060d, fogExp: 0.028, fogCol: 0x0a0a1a,
    look: { exposure: 1.1, bloom: 0.75, bloomT: 0.7, bloomR: 0.7, vig: 0.55, sat: 1.12, con: 1.08, lift: [0.0, 0.0, 0.02] },
    sun: { dir: [0.25, 1, 0.35], col: 0xffd8a0, I: 1.5, c: [0, 1, 0], r: 8 }, hemi: { sky: 0x3a3a6a, ground: 0x2a1a08, I: 0.5 }, fill: { col: 0x6a7ad8, I: 0.5, dir: [-0.5, 0.3, -0.6] }, rim: { col: 0xffd090, str: 0.8 },
    update(t) {
      // ponteiros girando para trás; no "zero" travam no XII
      const snap = smr(t, K.zero2 - 0.25, K.zero2 + 0.1), snap2 = smr(t, K.ponto - 0.2, K.ponto + 0.1);
      const spin = -(t - a) * 1.4 * (1 - snap) - (t - K.ponto) * 0.9 * (t > K.ponto + 0.6 ? 1 : 0);
      hM.rotation.y = lerp(spin * 2.2 + 1.3, 0, snap) * (1 - snap2 * 0); hH.rotation.y = lerp(spin * 0.4 + 2.2, 0, snap);
      clocks.forEach((cl, i) => { cl.h1.rotation.z = t * cl.sp * 0.35; cl.h2.rotation.z = t * cl.sp * 2.1; cl.c.position.y = cl.y0 + Math.sin(t * 0.3 + i) * 0.4; });
      gears.forEach((ge) => (ge.e.rotation.z = -t * ge.sp));
      digits.forEach((d, i) => { const ph = (t * (0.05 + hash(i * 5) * 0.06) + hash(i * 2.3)) % 1, an = hash(i) * 6.28, r = 11 + hash(i * 7) * 16; d.position.set(Math.cos(an) * r, 16 - ph * 20, Math.sin(an) * r - 4); d.material.opacity = 0.55 * Math.sin(ph * Math.PI); });
      for (let i = 0; i < 320; i++) { const ph = (t * 0.06 + hash(i * 1.3)) % 1, an = hash(i) * 6.28 + ph * 4, r = 7.0 * (1 - ph) + 1.8; swirl.pos.set([Math.cos(an) * r, 0.12 + hash(i * 3) * 0.9 * (1 - ph) + Math.sin(ph * 9 + i) * 0.05, Math.sin(an) * r], i * 3); } swirl.upd();
      // espírito dourado: flutua, observa, ergue a palma no golpe final
      restPose(sp); sp.position.set(SPP.x, SPP.y + Math.sin(t * 1.3) * 0.04, SPP.z); sp.rotation.set(0, Math.PI, 0); idle(sp, t, 2, 0.4); evoAnim(sp, t, 1);
      pose(sp, { legR: [0.15, 0, -0.04, 0.3, 0.3], legL: [0.05, 0, 0.05, 0.2, 0.25], armR: [0.05, 0, -0.18, -0.35], armL: [0.05, 0, 0.18, -0.35] });
      const palm = act(t, gp - 0.3, gp + 0.4, 0.2, 0.05) * (1 - smr(t, K.nunca2 + 0.1, K.nunca2 + 0.8));
      if (palm > 0.01) armIK(sp, 1, V3(face0.x - 0.12, face0.y - 0.02, face0.z - 0.12), V3(face0.x + 0.6, face0.y - 0.7, face0.z + 0.5), clamp(palm));
      lookAtW(sp, cr.position.clone().add(V3(0, 1.6, 0)), 0.6);
      sp.userData.eyeM.color.setScalar(1 + 1.5 * (smr(t, q - 0.1, q + 0.2) * (1 - smr(t, q + 0.6, q + 1)) + palm));
      // chefe: arremessa, a pedra volta; a vontade (aura vermelha) se acende e é sugada de volta
      restPose(bo); bo.position.copy(BP); bo.rotation.set(0, -0.05, 0); idle(bo, t, 21, 0.8); standFeet(bo, { hf: () => 0, spread: 1.6 });
      const th = thr(t), wind = clamp(th / 0.47), rel = smr(th, 0.47, 0.62);
      const will = smr(t, K.vontade - 0.2, K.vontade + 0.6) * (1 - smr(t, K.volta2 - 0.1, K.volta2 + 0.5));
      pose(bo, { armR: [-0.2 + 1.3 * wind - 2.4 * rel, 0.2, -0.35 + 0.2 * rel, -1.6 * wind + 1.3 * rel], chest: [0, 0.45 * wind - 0.7 * rel, 0], spine: [0.05 + 0.25 * will, 0, 0], handR: 1 - rel, handL: 0.4 + 0.6 * will });
      pose(bo, { armL: [-0.35 * will, 0, 0.45 * will + 0.1, -1.4 * will - 0.2], armR: [-0.35 * will, 0, -0.45 * will - 0.1, -1.4 * will - 0.2], handR: 1 }, will);
      const fin = smr(t, K.nunca2 + 0.4, K.acontece + 0.2);
      if (fin > 0) pose(bo, { armR: [-1.0, 0.3, -0.3, -1.6], handR: 0.85, head: [0.35, 0.15, 0] }, fin);
      face(bo, { angry: Math.max(0.5 * smr(t, a, q), will) * (1 - fin), brow: -0.5 * will + 0.7 * fin + 0.4 * smr(t, K.volta2, K.volta2 + 0.4) * (1 - smr(t, K.ponto + 0.5, gp)), open: 0.35 * will + 0.25 * fin, lid: 1 });
      clothWind(bo, t, 0.6 + 1.6 * will); chefeFlaps(bo, t, 1 + will); hairPush(bo, 0, 0, will * 2);
      auraBo(t, V3(BP.x, 0, BP.z), will + 0.25 * smr(t, K.volta2, K.volta2 + 0.2) * (1 - smr(t, K.volta2 + 0.2, K.volta2 + 0.8)), 0.55 + 0.4 * will, 2.4 * (1 - smr(t, K.volta2, K.volta2 + 0.7)) + 0.2);
      // pedra arremessada: voa, para na frente do espírito e volta para a mão
      const hp = hand0(), stopP = V3(face0.x + 0.05, 1.55, face0.z - 0.55), fly = smr(th, 0.55, 1), sv = th > 0.5 && th < 1.0001;
      shard.visible = th > 0.02; shard.position.copy(hp.clone().lerp(stopP, E.out(fly))); shard.lookAt(stopP); shard.rotateZ(t * 8);
      shG.forEach((s_, i) => { const kk = Math.max(0, fly - (i + 1) * 0.06); s_.position.copy(hp.clone().lerp(stopP, E.out(kk))); s_.material.opacity = sv && t > ac + 0.65 ? 0.5 - i * 0.1 : 0; });
      // espírito carmesim: soco que volta (fita rebobinando) e o golpe final que nunca chega
      const p1 = punch1(t), p2 = punch2(t), kk = Math.max(p1, p2);
      crimAt(cr, kk, t, V3(face0.x + 0.02, face0.y, face0.z - (p2 > p1 ? 0.04 : 0.02)));
      const rw = (t > q + 0.48 && t < q + 1.3) || (t > K.nunca2 - 0.12 && t < K.nunca2 + 0.5);
      crG.forEach((p, i) => { p.visible = rw; if (!rw) return; const k2 = Math.min(1, kk + (i + 1) * 0.13); crimAt(p, k2, t, V3(face0.x + 0.02, face0.y, face0.z - 0.02)); p.userData.holo.uniforms.uA.value = 0.5 - i * 0.13; });
      // anéis e "0"
      ring(t, K.zero2, V3(0, 0.1, 0), [0, 1, 0], 9, 1.4); ring(t, K.ponto, V3(0, 0.1, 0), [0, 1, 0], 9, 1.4); ring(t, q + 0.15, face0.clone().add(V3(0, 0, -0.1)), [0, 0, 1], 0.9, 0.8);
      const zk = smr(t, K.zero2 - 0.1, K.zero2 + 0.2) * (1 - smr(t, K.zero2 + 0.5, K.zero2 + 0.8)) + smr(t, K.ponto - 0.1, K.ponto + 0.2) * (1 - smr(t, K.ponto + 0.7, K.ponto + 1.0));
      zero.position.set(0, 3.0, -0.5); zero.material.opacity = zk; zero.scale.setScalar(1.0 + 1.0 * E.outBack(clamp(zk)));
    },
    after(t) {
      const rk = (t > q + 0.48 && t < q + 1.3) || (t > ac + 0.65 && t < ac + 1.35) || (t > K.nunca2 - 0.12 && t < K.nunca2 + 0.5) || (t > K.volta2 && t < K.volta2 + 0.6) ? 1 : 0;
      lookRebobina(rk);
      GU.uFlashCol.value.set(1, 0.9, 0.65); GU.uFlash.value = 0.25 * Math.pow(1 - seg(t, K.zero2, K.zero2 + 0.4), 2) * (t >= K.zero2 ? 1 : 0) + 0.2 * Math.pow(1 - seg(t, K.ponto, K.ponto + 0.4), 2) * (t >= K.ponto ? 1 : 0);
    },
    cam(t) {
      const c = path(t, [
        [a, [0.6, 17, 3.5], [0, 0, -0.2], 48],
        [K.zero2 - 0.2, [5.5, 6.0, 8.0], [0, 1.0, 0], 42],
        [q - 0.3, [-0.55, 2.35, 4.0], [0.1, 1.85, 0.6], 38],
        [q + 1.2, [-0.75, 2.3, 4.2], [0.1, 1.8, 0.4], 38],
        [ac - 0.3, [1.1, 2.1, -5.6], [0.0, 1.55, 0.8], 36],
        [ac + 1.2, [0.8, 2.0, -5.3], [0.0, 1.5, 0.9], 36],
        [K.vontade + 0.3, [0.8, 1.65, -0.2], [0.25, 1.55, -2.6], 34],
        [K.volta2 + 0.2, [1.3, 2.0, -0.3], [0.25, 1.35, -2.6], 36],
        [K.ponto + 0.4, [4.0, 4.6, -5.0], [0, 0.6, -0.8], 42],
        [gp - 0.2, [4.7, 2.0, 1.2], [0.1, 1.9, 1.3], 34],
        [K.nunca2, [4.6, 2.0, 1.1], [0.1, 1.85, 1.2], 34],
        [K.acontece, [1.6, 1.8, -0.4], [0.25, 1.45, -2.6], 36],
        [b, [1.4, 1.7, -0.7], [0.25, 1.45, -2.6], 34],
      ]);
      return { ...shakeCam(c, t, impact(t, K.zero2, 0.06, 0.6) + impact(t, K.ponto, 0.06, 0.6)), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 4 · apagar o tempo: terraço sobre os telhados ao pôr do sol; o mundo congela em vermelho e a onda dourada desfaz tudo
function varal(g, A, B, n = 4) {
  const iron = SM(0x2a2420), pts = [];
  [A, B].forEach((p) => mesh(cyl(0.04, 0.05, p[1], 8), iron, p[0], p[1] / 2, p[2], g));
  const line = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(A[0], A[1], A[2]), V3((A[0] + B[0]) / 2, Math.min(A[1], B[1]) - 0.18, (A[2] + B[2]) / 2), V3(B[0], B[1], B[2])]), 20, 0.008, 4), SM(0xd8d0c0), 0, 0, 0, g);
  const cols = [0xf4f0e6, 0x4a6aa8, 0xe8c050, 0xf0ece4, 0xb84040], cloths = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.7) / (n + 0.4), x = lerp(A[0], B[0], u), z = lerp(A[2], B[2], u), y = lerp(A[1], B[1], u) - 0.18 * Math.sin(u * Math.PI) - 0.02;
    const w = i % 2 ? 0.6 : 0.95, h = i % 2 ? 0.75 : 1.1, geo = new THREE.PlaneGeometry(w, h, 5, 7); geo.translate(0, -h / 2, 0);
    const m = mesh(geo, new THREE.MeshStandardMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, roughness: 0.95 }), x, y, z, g); m.rotation.y = Math.atan2(B[0] - A[0], B[2] - A[2]) - Math.PI / 2; m.userData.base = Float32Array.from(geo.attributes.position.array); m.frustumCulled = false; cloths.push(m);
  }
  return (t, wind = 1) => cloths.forEach((m, j) => { const a = m.geometry.attributes.position, b = m.userData.base; for (let i = 0; i < a.count; i++) { const xx = b[i * 3], yy = b[i * 3 + 1], k = -yy; a.setZ(i, b[i * 3 + 2] + (Math.sin(t * 2.6 + xx * 2.5 + yy * 3 + j) * 0.09 + Math.sin(t * 5.3 + xx * 6 + j * 2) * 0.03 + 0.14) * k * wind); a.setX(i, xx + Math.sin(t * 1.9 + yy * 4 + j) * 0.03 * k * wind); } a.needsUpdate = true; m.geometry.computeVertexNormals(); });
}
function vaso(g, x, z, s = 1, seed = 1) {
  const v = grp(g, x, 0, z); mesh(lathe([[0.001, 0], [0.32, 0], [0.4, 0.5], [0.45, 0.58], [0.001, 0.58]], 20), SM(0xb8603a), 0, 0, 0, v);
  const tr = tree(v, 0, 0.55, 0, { s: 0.22 * s, h: 9, leaf: 0x3a6a2a, blobs: 7, seed });
  const lm = SM(0xf0c830, { roughness: 0.6 }); for (let i = 0; i < 9; i++) { const a = hash(i * 3 + seed) * 6.28, r = 0.25 + hash(i * 5 + seed) * 0.25; mesh(sph(0.045, 8, 6), lm, Math.cos(a) * r, 1.3 + hash(i * 7 + seed) * 0.6, Math.sin(a) * r, v).scale.set(1, 1.3, 1); }
  return v;
}
addSet("s4-tempo", (g) => {
  const [a, b] = T.sc["s4-tempo"];
  const dome = skyDome(g, { top: 0x26346e, mid: 0x9a6a8a, midY: 0.15, hor: 0xffa868, ground: 0x2a1c18, sunDir: [1, 0.1, 0.25], sunCol: 0xffb060, sunI: 1.1, disk: 2.4, cov: 0.5, cloudA: 0.85, cloudLit: 0xffc0a0, cloudSh: 0x5a4a6a, cloudScale: 0.16 });
  const hf = () => 0;
  // terraço: piso de lajotas, mureta e balaústres, casinha da escada
  const tile = canvasTex(256, 256, (c, w, h) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = hash2(x + 1, y + 3); c.fillStyle = `rgb(${178 + v * 30},${92 + v * 20},${62 + v * 12})`; c.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); } c.fillStyle = "rgba(220,200,170,.9)"; for (let i = 0; i <= 4; i++) { c.fillRect(i * 64 - 2, 0, 4, h); c.fillRect(0, i * 64 - 2, w, 4); } });
  const fl = mesh(new THREE.PlaneGeometry(10, 8), SM(0xffffff, { map: rep(tile, 5, 4), roughness: 0.85 }), 0, 0, 0, g); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
  mesh(box(10.4, 6, 8.4), SM(0xd89a6a), 0, -3.02, 0, g);
  const wallM = SM(0xe8c89a, { roughness: 0.9 }), capM = SM(0xf2e6d0);
  [[0, -4.1, 10.4, 0.25], [-5.1, 0, 0.25, 8.4]].forEach(([x, z, w, d]) => { mesh(box(w, 1.05, d), wallM, x, 0.52, z, g); mesh(box(w + 0.1, 0.1, d + 0.1), capM, x, 1.1, z, g); });
  const balM = SM(0xf0e4cc), bi = [];
  [[5.05, 0, 0, 8.2], [0, 4.05, 10.2, 0]].forEach(([x, z, wx, wz]) => { mesh(box(Math.max(0.3, wx), 0.14, Math.max(0.3, wz)), capM, x, 1.02, z, g); mesh(box(Math.max(0.3, wx), 0.12, Math.max(0.3, wz)), capM, x, 0.06, z, g); const n = Math.round(Math.max(wx, wz) / 0.32); for (let i = 0; i < n; i++) bi.push([x + (wx ? -wx / 2 + (i + 0.5) * wx / n : 0), z + (wz ? -wz / 2 + (i + 0.5) * wz / n : 0)]); });
  const balG = lathe([[0.001, 0], [0.07, 0], [0.07, 0.06], [0.045, 0.12], [0.075, 0.4], [0.04, 0.72], [0.06, 0.8], [0.06, 0.86], [0.001, 0.86]], 10), balI = new THREE.InstancedMesh(balG, balM, bi.length);
  bi.forEach(([x, z], i) => { const M4 = new THREE.Matrix4(); M4.setPosition(x, 0.12, z); balI.setMatrixAt(i, M4); }); balI.castShadow = true; balI.receiveShadow = true; g.add(balI);
  const hut = grp(g, -3.7, 0, -2.6); mesh(box(2.4, 2.9, 2.2), SM(0xd8a878, { map: texFachada("#d8a878", "#3a4a2a", 1, 1, 0, 7).map }), 0, 1.45, 0, hut); mesh(box(2.7, 0.18, 2.5), capM, 0, 2.95, 0, hut);
  const door = mesh(box(0.06, 2.0, 0.95), SM(0x5a3a22), 1.23, 1.0, 0.3, hut); mesh(box(0.08, 0.06, 0.06), GOLDM(), 1.27, 1.0, -0.05, hut);
  const vline = varal(g, [-2.6, 2.1, 3.1], [2.4, 2.25, 3.4], 5);
  vaso(g, 4.2, -3.3, 1, 3); vaso(g, -4.3, 3.2, 0.9, 5);
  mesh(cyl(0.45, 0.45, 0.05, 20), SM(0x2a2a2a, { metalness: 0.5 }), -1.2, 0.75, 2.2, g); mesh(cyl(0.04, 0.04, 0.75, 8), SM(0x2a2a2a), -1.2, 0.37, 2.2, g);
  [[-1.8, 1.9], [-0.6, 2.4]].forEach(([x, z]) => { const ch = grp(g, x, 0, z); mesh(box(0.42, 0.04, 0.42), SM(0x3a3a3a), 0, 0.45, 0, ch); mesh(box(0.42, 0.45, 0.04), SM(0x3a3a3a), 0, 0.68, -0.2, ch); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a_, b_]) => mesh(cyl(0.015, 0.015, 0.45, 6), SM(0x2a2a2a), a_, 0.22, b_, ch)); });
  // a cidade em volta: prédios abaixo, cúpulas e campanários ao longe
  const city = grp(g);
  for (let i = 0; i < 26; i++) { const an = (i / 26) * Math.PI * 2 + hash(i) * 0.2, r = 16 + hash(i * 3) * 22; const x = Math.cos(an) * r, z = Math.sin(an) * r; if (x > 3 && Math.abs(z) < 8) continue; palazzo(city, x, z, { y: -14 + hash(i * 7) * 6, w: 9 + hash(i * 5) * 6, d: 8 + hash(i * 9) * 4, floors: 4 + Math.floor(hash(i * 11) * 3), seed: i + 2, rotY: -an + Math.PI / 2, balc: r < 26 }); }
  for (let i = 0; i < 14; i++) { const x = 30 + hash(i * 3) * 60, z = (hash(i * 7) - 0.5) * 90; palazzo(city, x, z, { y: -16 + hash(i) * 5, w: 10, d: 9, floors: 5, seed: i + 40, balc: false }); }
  cupula(city, -48, -30, 9, { y: -6 }); cupula(city, 70, 26, 11, { y: -8, dome: 0x8a9a9a }); cupula(city, -30, 52, 6, { y: -6 }); campanario(city, -22, -44, 3.4, 26, { col: 0xd8a070 }); campanario(city, 46, -40, 3, 22); campanario(city, 24, 46, 2.6, 18);
  const brd = birds(g, 8, { center: [6, 12, -2], rx: 14, rz: 9, speed: 0.1 });
  const motes = dustPts(160, [-4, 5, 0.3, 4, -3.8, 3.8], 0xffe0b0, 0.03, 0.7); g.add(motes);
  // personagens
  const gi = garoto(); g.add(gi); const GP = V3(1.9, 0, 0.55), GA = Math.PI / 2;
  const sp = evoluir(espDourado({ emisI: 0.55 })); sp.scale.setScalar(1.12); g.add(sp); sp.userData.glow.material.opacity = 0.1;
  const bo = chefe(); g.add(bo); const cr = espCarmesim(); cr.scale.setScalar(1.08); g.add(cr); cr.userData.glow.material.opacity = 0.08;
  const gh = fantasmas(g, () => chefe(), 3, 0xffc040);
  const onda = ondaDourada(g), ring = aneis(g, 4, 0xffd070);
  // a ação do chefe (tempo da história σ): sai da porta, para, anda (no tempo apagado) até atrás do garoto e ergue o punho
  const fz = K.apagar3 - 0.12, cA = K.cancelou;
  const S0 = K.chefe - 0.35, sA = Math.max(1.2, K.apagar3 - 0.15 - S0), PA0 = [-2.35, -2.25], PA1 = [-1.25, -0.55];
  const angA = Math.atan2(PA1[0] - PA0[0], PA1[1] - PA0[1]), DA = Math.hypot(PA1[0] - PA0[0], PA1[1] - PA0[1]), LA = gaitFit(DA, 0.55);
  const PB1 = [GP.x - 1.0, GP.z + 0.1], sB0 = sA + 0.35, sB = Math.max(1.0, K.king + 0.35 - S0 - sB0);
  const angB = Math.atan2(PB1[0] - (PA0[0] + Math.sin(angA) * DA), PB1[1] - (PA0[1] + Math.cos(angA) * DA)), PBs = [PA0[0] + Math.sin(angA) * DA, PA0[1] + Math.cos(angA) * DA];
  const DB = Math.hypot(PB1[0] - PBs[0], PB1[1] - PBs[1]), LB = gaitFit(DB, 0.6), sF = sB0 + sB;
  const fB = [Math.sin(angB), Math.cos(angB)], lB = [Math.cos(angB), -Math.sin(angB)];
  const sigEnd = Math.min(cA - S0, sF + 1.2);
  const sigma = (t) => { if (t < S0) return 0; if (t < cA) return Math.min(t - S0, sigEnd); return sigEnd * (1 - E.inOut(seg(t, cA + 0.1, cA + 1.3))); };
  function bossAt(p, s, t, o = {}) {
    restPose(p); idle(p, t, 21, 0.6); const u = p.userData;
    const show = s > 0.02;
    if (s <= sA) { const k = E.inOut(seg(s, 0, sA)); gait(p, DA * k, { from: [PA0[0], 0, PA0[1]], ang: angA, hf, arms: 0.8, step: LA }); if (!o.ghost) { clothWind(p, t, 0.7 + 0.6 * Math.sin(k * Math.PI)); chefeFlaps(p, t, 1.3); } }
    else if (s <= sB0) { gait(p, DA, { from: [PA0[0], 0, PA0[1]], ang: angA, hf, step: LA }); if (!o.ghost) { clothWind(p, t, 0.6); chefeFlaps(p, t, 1); } }
    else { const k = E.inOut(seg(s, sB0, sF)); gait(p, DB * k, { from: [PBs[0], 0, PBs[1]], ang: angB, hf, arms: 0.7, step: LB }); if (!o.ghost) { clothWind(p, t, 0.7 + 0.8 * Math.sin(k * Math.PI)); chefeFlaps(p, t, 1.5); } }
    const fist = act(s, sF - 0.1, sF + 0.6, 0.25, 0.08);
    if (fist > 0) pose(p, { armR: [-2.75 * clamp(fist, 0, 1.1), 0, -0.25, -1.25 * clamp(fist)], handR: 1, spine: [-0.12 * clamp(fist), 0, 0], chest: [0, -0.2 * clamp(fist), 0] });
    lookAtW(p, V3(GP.x, 1.5, GP.z), smr(s, 0.6, 1.4) * 0.8);
    face(p, { angry: 0.65 + 0.35 * clamp(fist), brow: -0.4, open: 0.15 + 0.3 * clamp(fist), lid: 0.9 });
    if (u.hat) u.hat.visible = true;
    return show;
  }
  return {
    bg: 0x2a1c22, fogExp: 0.005, fogCol: 0xc8907a, dome,
    look: { exposure: 1.08, bloom: 0.55, bloomT: 0.82, vig: 0.42, sat: 1.12, con: 1.06, lift: [0.02, 0.0, 0.03] },
    sun: { dir: [1, 0.3, 0.25], col: 0xffb070, I: 2.6, c: [0, 1, 0], r: 9 }, hemi: { sky: 0x8a90c8, ground: 0x7a5034, I: 0.62 }, fill: { col: 0x7a8ac8, I: 0.5, dir: [-1, 0.4, -0.3] }, rim: { col: 0xffc890, str: 0.55 },
    update(t) {
      // tempo do mundo: congela no tempo apagado; volta de onde parou depois
      const frozen = t >= fz && t < cA, tw = t < fz ? t : t < cA ? fz : t - (cA - fz);
      // garoto e espírito dourado (congelados no tempo apagado)
      restPose(gi); gi.position.copy(GP); gi.rotation.set(0, GA, 0); idle(gi, tw, 11, 0.7); standFeet(gi, { hf }); face(gi, { smile: 0.15, lid: 0.85 }); clothWind(gi, tw, 1.1); lookAtW(gi, V3(12, 2.4, 1.5), 0.5);
      if (frozen) gi.userData.eyes.forEach((e) => setEye(e, 0.85, 0.05, 0));
      restPose(sp); sp.position.set(GP.x - 0.35, 0.16 + Math.sin(tw * 1.3) * 0.03, GP.z - 0.85); sp.rotation.set(0, GA, 0); idle(sp, tw, 2, 0.4); evoAnim(sp, tw, 1);
      pose(sp, { legR: [0.15, 0, -0.04, 0.3, 0.3], legL: [0.05, 0, 0.05, 0.2, 0.25], armR: [0.05, 0, -0.18, -0.35], armL: [0.05, 0, 0.18, -0.35] });
      // "mesmo assim": no tempo congelado o espírito vira a cabeça sozinho para o chefe
      const turn = smr(t, K.mesmo3 - 0.2, K.mesmo3 + 1.0) * (t < cA + 0.8 ? 1 : 1 - smr(t, cA + 0.8, cA + 2.0));
      // chefe e espírito carmesim
      const s = sigma(t), show = bossAt(bo, s, t);
      const bp = bo.position;
      if (turn > 0) lookAtW(sp, V3(bp.x, 1.7, bp.z), turn);
      sp.userData.eyeM.color.setScalar(1 + 2.2 * smr(t, K.mesmo3, K.mesmo3 + 0.5) * (1 - smr(t, cA + 0.4, cA + 1.2)));
      const appear = smr(s, 0.9, 1.6);
      restPose(cr); idle(cr, t, 31, 0.6); cr.scale.setScalar(Math.max(0.001, 1.08 * E.outBack(appear)));
      const ca = bo.rotation.y; cr.position.set(bp.x - Math.sin(ca) * 0.75 - Math.cos(ca) * 0.35, 0.3 + Math.sin(t * 2.2) * 0.04, bp.z - Math.cos(ca) * 0.75 + Math.sin(ca) * 0.35); cr.rotation.set(0, ca, 0);
      const cf = act(s, sF, sF + 0.6, 0.2, 0.08);
      pose(cr, { hips: [0.1, 0, 0], legR: [0.25, 0, -0.05, 0.5], legL: [0.1, 0, 0.06, 0.4], armR: [-2.6 * clamp(cf, 0, 1.1), 0, -0.4, -1.3 * clamp(cf)], armL: [-2.6 * clamp(cf, 0, 1.1), 0, 0.4, -1.3 * clamp(cf)], handR: 1, handL: 1 });
      lookAtW(cr, V3(GP.x, 1.6, GP.z), 0.7);
      // fantasmas dourados no rebobinar
      const rw = t > cA + 0.1 && t < cA + 1.3;
      gh.forEach((p, i) => { p.visible = rw; if (!rw) return; bossAt(p, Math.min(sigEnd, s + (i + 1) * 0.35), t, { ghost: true }); p.userData.holo.uniforms.uA.value = 0.5 - i * 0.13; });
      // depois: o chefe na porta, desnorteado (cabeça para os lados)
      if (t > cA + 1.3) { const k = smr(t, cA + 1.3, cA + 2.0); bo.userData.head.rotation.y += Math.sin((t - cA) * 2.2) * 0.45 * k; face(bo, { brow: 0.8 * k, open: 0.3 * k, lid: 1 }); }
      onda(t, cA, V3(sp.position.x, 1.6, sp.position.z), 40, 1.2); ring(t, cA, V3(sp.position.x, 2.0, sp.position.z), [0, 1, 0], 4, 1.0);
      vline(tw, 1); brd(tw); floatDust(motes, tw, 0.3, 0.2); dome.userData.u.uOff.value.set(tw * 0.004, 0);
    },
    after(t) {
      const er = t >= fz && t < cA;
      lookApagado(er ? smr(t, fz, fz + 0.25) : 0, t);
      GU.uFlashCol.value.set(1, 0.92, 0.7);
      GU.uFlash.value = 0.35 * Math.pow(1 - seg(t, cA, cA + 0.4), 2) * (t >= cA ? 1 : 0) + 0.35 * Math.pow(1 - seg(t, fz, fz + 0.3), 2) * (t >= fz && t < cA ? 1 : 0);
      if (t >= fz && t < fz + 0.3) GU.uFlashCol.value.set(1, 0.15, 0.15);
      lookRebobina(t > cA + 0.1 && t < cA + 1.3 ? 1 : 0);
    },
    cam(t) {
      const c = path(t, [
        [a, [6.6, 4.0, 5.6], [-0.6, 1.0, -0.6], 42],
        [K.chefe + 0.6, [4.1, 1.65, 1.0], [-1.0, 1.4, -0.4], 38],
        [K.apagar3 + 0.3, [4.0, 1.6, 1.1], [-0.6, 1.4, -0.2], 36],
        [K.king, [3.4, 1.35, 1.6], [1.1, 1.75, 0.55], 36],
        [K.mesmo3 + 0.3, [2.7, 2.3, 1.45], [1.5, 1.98, -0.3], 32],
        [cA - 0.1, [2.85, 2.25, 1.65], [1.45, 1.95, -0.25], 34],
        [cA + 1.0, [5.6, 3.0, 3.4], [-0.8, 1.2, -0.8], 42],
        [b, [4.9, 2.1, 2.5], [-2.2, 1.3, -1.8], 38],
      ]);
      return { ...shakeCam(c, t, impact(t, cA, 0.09, 0.7)), near: 0.05 };
    },
  };
});
