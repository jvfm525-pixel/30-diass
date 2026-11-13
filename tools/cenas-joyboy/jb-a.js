// ================================================================ vídeo: Joy Boy · cenas 1–4
// lanterna de mão que balança com mola (pêndulo) presa à mão de quem segura
function lanternaMao(g) {
  const l = grp(g); const piv = grp(l); mesh(cyl(0.008, 0.008, 0.16, 4), SM(0x2a221c), 0, -0.08, 0, piv);
  const body = grp(piv, 0, -0.24, 0); mesh(cyl(0.09, 0.1, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0xffd8a0, emissive: 0xffa040, emissiveIntensity: 1.6, transparent: true, opacity: 0.9 }), 0, 0, 0, body);
  mesh(new THREE.ConeGeometry(0.11, 0.08, 8), SM(0x2a221c), 0, 0.13, 0, body); mesh(cyl(0.1, 0.1, 0.03, 8), SM(0x2a221c), 0, -0.1, 0, body);
  const gl = glowSprite(0xffb050, 1.4, 0.6); body.add(gl); const L = new THREE.PointLight(0xffa040, 2.6, 9, 1.7); body.add(L);
  return { l, piv, upd(pos, lag, t) { l.position.copy(pos); piv.rotation.set(clamp(lag[2] * 9, -0.9, 0.9), 0, clamp(-lag[0] * 9, -0.9, 0.9)); L.intensity = 2.4 + noise1(t * 7) * 0.4; } };
}

// ---------------------------------------------------------------- 1 · gancho: praia de uma ilha misteriosa à noite; o capitão abre a câmara e cai na gargalhada
addSet("s1-gancho", (g) => {
  const [a, b] = T.sc["s1-gancho"];
  const dome = skyDome(g, { top: 0x050a20, mid: 0x0e1a3c, midY: 0.14, hor: 0x2a3456, ground: 0x04060a, sunDir: [0.15, 0.2, 1], sunCol: 0xd8e4ff, sunI: 0, cov: 0.55, cloudA: 0.45, cloudLit: 0x6a7aa8, cloudSh: 0x0a1020, stars: 1.4 });
  const moon = mesh(sph(26, 40, 30), BM(0xe6e8f0, { fog: false }), 30, 70, 330, g); const mg = glowSprite(0x9aaae8, 110, 0.13); mg.material.fog = false; moon.add(mg);
  const hf = (x, z) => -Math.max(0, z - 1.5) * 0.09 - Math.max(0, z - 10) * 0.12 + fbm2(x * 0.2, z * 0.2, 3) * 0.12 - 0.06;
  terrain(g, { h: (x, z) => (z < -7 ? 3 + fbm2(x * 0.1, z * 0.1, 4) * 6 : hf(x, z)), size: 200, segs: 140, grassA: 0x8a8070, grassB: 0xa8a090, dirt: 0x9a8c78, rock: 0x4a4a52 });
  const sea = oceano(g, { y: -1.3, z: 120, size: 240, segs: 110, deep: 0x06121e, crest: 0x2a4258, foam: 0xa8b8c8, env: envNoite(), envI: 1.1, amp: 0.45 });
  // falésia com a câmara de pedra
  for (let i = 0; i < 16; i++) rock(g, -22 + i * 3 + hash(i) * 2, 1.5 + hash(i * 3) * 2.5, -8.5 - hash(i * 7) * 3, 3.2 + hash(i * 5) * 2.5, i + 30, { col: 0x8a8a96, flat: 1.1 });
  const vault = grp(g, 0, 0, -6.3);
  const vg = bayGeo(5.6, 5.2, 2.6, 3.9, 1.6), stoneM = SM(0x8a8478, { map: texPedraLisa([140, 132, 120], [110, 104, 96]).map, roughness: 0.9 });
  mesh(vg, stoneM, 0, 0, 0, vault);
  const carv = canvasTex(512, 512, (c, w, h) => { c.fillStyle = "#000"; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 6; c.beginPath(); c.arc(w / 2, h * 0.3, 70, 0, 7); c.stroke(); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * 85, h * 0.3 + Math.sin(a) * 85); c.lineTo(w / 2 + Math.cos(a) * 125, h * 0.3 + Math.sin(a) * 125); c.stroke(); } c.beginPath(); c.arc(w / 2, h * 0.32, 38, 0.2, Math.PI - 0.2); c.stroke(); }, { linear: true });
  const doorM = new THREE.MeshStandardMaterial({ color: 0x9a948a, map: texPedraLisa([150, 142, 130], [118, 112, 104]).map, roughness: 0.85, emissive: 0xffc060, emissiveMap: carv, emissiveIntensity: 0 });
  const doorH = grp(vault, -1.3, 0, 0.55); const door = mesh(box(2.6, 3.9, 0.35), doorM, 1.3, 1.95, 0, doorH);
  const inner = mesh(box(2.5, 3.8, 3.0), new THREE.MeshBasicMaterial({ color: 0x9a7438, side: THREE.BackSide }), 0, 1.9, -1.0, vault);
  const vL = new THREE.PointLight(0xffc860, 0, 30, 1.2); vL.position.set(0, 1.8, -0.6); vault.add(vL);
  const vGlow = glowSprite(0xffd070, 4.5, 0); vGlow.position.set(0, 1.9, -0.6); vault.add(vGlow);
  const beam = godRays(g, [0, 2.0, -6.0], [0, 0.1, 1], { n: 9, len: 22, w: 1.8, spread: 2.2, opacity: 0, color: 0xffd890 });
  const sky = godRays(g, [0, 0.5, -6.2], [0, 1, 0.15], { n: 6, len: 60, w: 2.6, spread: 2.0, opacity: 0, color: 0xffd890 });
  const palms = [[-7, 2.5], [-9.5, -1], [8, 1.5], [10.5, -2.5], [-13, 4], [13, 5]].map(([x, z], i) => palmeira(g, x, hf(x, z), z, 6 + hash(i) * 2.5, i + 3));
  for (let i = 0; i < 12; i++) rock(g, (hash(i * 3.1) - 0.5) * 26, -0.1, (hash(i * 5.3)) * 10 - 3, 0.25 + hash(i) * 0.5, i + 60, { col: 0x8a8a90 });
  const flies = dustPts(140, [-8, 8, 0.3, 5, -6, 4], 0xffe0a0, 0.04, 0.0); g.add(flies);
  // a tripulação sobe a praia (pés plantados no declive) e para diante da câmara
  const cap = capitao(); g.add(cap);
  const crew = [0, 1, 2, 3].map((i) => { const p = tripulante(i); g.add(p); return p; });
  const lan = lanternaMao(g);
  const ENDS = [[0, -4.75], [-1.35, -3.85], [1.25, -3.75], [-0.55, -3.05], [0.65, -2.95]], WALK = 4.2;
  const all = [cap, ...crew];
  const fits = all.map((_, i) => gaitFit(WALK + (i ? 0.0 : 0.25), 0.62));
  const tW0 = a + 0.1, tW1 = Math.max(tW0 + 2.0, K.descobriu - 0.9);
  const walkD = (i, t) => (WALK + (i ? 0 : 0.25)) * E.inOut(smr(t, tW0 + i * 0.08, tW1 + i * 0.05));
  const posOf = (i, t) => { const d = walkD(i, t), e = ENDS[i]; return [e[0], hf(e[0], e[1] + (WALK + (i ? 0 : 0.25)) - d), e[1] + (WALK + (i ? 0 : 0.25)) - d]; };
  const openK = (t) => E.inOut(smr(t, K.descobriu - 0.35, K.descobriu + 0.9));
  return {
    bg: 0x050812, fogExp: 0.008, fogCol: 0x0e1628, dome,
    look: { exposure: 1.25, bloom: 0.75, bloomT: 0.7, bloomR: 0.7, vig: 0.5, sat: 1.05, con: 1.08, lift: [0.0, 0.01, 0.04] },
    sun: { dir: [0.2, 0.55, 1], col: 0xa8bcff, I: 1.1, c: [0, 1, -3], r: 12 }, hemi: { sky: 0x34446e, ground: 0x14161c, I: 0.6 }, fill: { col: 0x6a7ab8, I: 0.4, dir: [-0.5, 0.3, -0.4] }, rim: { col: 0xb8c8ff, str: 0.7 },
    update(t) {
      const ok = openK(t);
      doorH.rotation.y = 1.6 * ok; doorM.emissiveIntensity = 0.9 * smr(t, K.descobriu - 0.6, K.descobriu - 0.2) * (1 - 0.6 * ok);
      vL.intensity = 3.2 * ok; vGlow.material.opacity = 0.32 * ok; inner.visible = ok > 0.02;
      beam.userData.rays.forEach((r, i) => (r.material.opacity = (0.05 + 0.02 * Math.sin(t * 2 + i)) * ok));
      const up = smr(t, K.fica - 0.4, K.fica + 1.2); sky.userData.rays.forEach((r, i) => (r.material.opacity = 0.12 * up * (0.8 + 0.2 * Math.sin(t * 1.5 + i))));
      flies.material.opacity = 0.8 * ok;
      // caminhada com pés plantados e mola no cabelo/casaco (atraso calculado pela trajetória)
      all.forEach((p, i) => {
        const e = ENDS[i], d = walkD(i, t), L0 = WALK + (i ? 0 : 0.25);
        restPose(p); idle(p, t, 41 + i, 0.6);
        gait(p, d, { from: [e[0], 0, e[1] + L0], ang: Math.PI, hf, step: fits[i], arms: 0.8 });
        if (i === 0) { // o capitão se vira para a tripulação para rir junto (pés trocam de apoio no giro)
          const turn = E.inOut(smr(t, K.rir - 0.25, K.rir + 0.3));
          if (turn > 0) { const ang = lerp(Math.PI, 0.12, turn), y0 = hf(e[0], e[1]), A_ = standPos(e[0], e[1], Math.PI, 0.11, [0.05, -0.05], y0), B_ = standPos(e[0], e[1], 0.12, 0.11, [0.05, -0.05], y0), f0 = smr(turn, 0, 0.6), f1 = smr(turn, 0.4, 1);
            p.rotation.y = ang; const ft = [lerp3(A_[0], B_[0], f0), lerp3(A_[1], B_[1], f1)]; ft[0][1] += Math.sin(f0 * Math.PI) * 0.07; ft[1][1] += Math.sin(f1 * Math.PI) * 0.07; plantFeet(p, ft, ang); }
        }
        const lag = mola(t, (tt) => posOf(i, tt), { k: 40, c: 6 }), Lc = lagLocal(p, lag);
        clothWind(p, t, 0.5, [Lc[0] * 0.6, 0, Lc[2] * 0.6 - 0.02]); hairMola(p, Lc, 5);
      });
      // o capitão empurra a porta (mãos presas à pedra) e cai na gargalhada
      const push = smr(t, K.descobriu - 0.55, K.descobriu - 0.2) * (1 - smr(t, K.descobriu + 0.5, K.descobriu + 0.9));
      if (push > 0.01) {
        doorH.updateMatrixWorld(true); const pa = door.localToWorld(V3(-0.6, 0.0, 0.2)), pb = door.localToWorld(V3(-0.25, 0.25, 0.2));
        pose(cap, { spine: [0.25 * push, 0, 0], chest: [0.1 * push, 0, 0] });
        armIK(cap, 0, pa, pa.clone().add(V3(0.6, -0.8, 1)), push); armIK(cap, 1, pb, pb.clone().add(V3(-0.6, -0.8, 1)), push); pose(cap, { handR: 0.05, handL: 0.05 });
      }
      const lt = [K.rir - 0.1, K.rir + 0.25, K.rir + 0.45, K.rir + 0.15, K.rir + 0.35];
      all.forEach((p, i) => {
        const k = smr(t, lt[i], lt[i] + 0.35) * (1 - 0.35 * smr(t, K.fica, b));
        if (k <= 0) { face(p, { brow: 0.6 * smr(t, K.descobriu - 0.2, K.descobriu + 0.3), open: 0.35 * smr(t, K.descobriu, K.descobriu + 0.4), lid: 1 }); lookAtW(p, V3(0, 1.9, -6.3), 0.7 * smr(t, K.descobriu - 0.5, K.descobriu)); return; }
        riso(p, t, k, lt[i], { freq: 4.6 + i * 0.35 });
        const ph = Math.abs(Math.sin((t - lt[i]) * (4.6 + i * 0.35) * Math.PI)) * k;
        p.updateMatrixWorld(true); const u = p.userData, belly = wpos(u.spine).add(V3(0, 0.12, 0)), fwd = V3(Math.sin(p.rotation.y), 0, Math.cos(p.rotation.y));
        if (i === 0 || i === 3) { const tg = belly.clone().addScaledVector(fwd, 0.17); armIK(p, 0, tg.clone().add(V3(-0.06, 0, 0)), tg.clone().add(V3(-0.6, -0.5, 0)), k); armIK(p, 1, tg.clone().add(V3(0.06, -0.03, 0)), tg.clone().add(V3(0.6, -0.5, 0)), k); }
        else if (i === 1) { const knee = wpos(u.knee[1]).addScaledVector(fwd, 0.08).add(V3(0, 0.05 + ph * 0.08, 0)); armIK(p, 1, knee, knee.clone().add(V3(0.6, 0.3, 0)), k); pose(p, { spine: [0.25 * k, 0, 0] }); }
        else { pose(p, { armR: [-2.6 * k, 0, -0.5, -0.4], armL: [-2.6 * k, 0, 0.5, -0.4], handR: 0, handL: 0 }); }
      });
      // a lanterna de um tripulante balança (pêndulo com mola)
      const lh = crew[1]; lh.updateMatrixWorld(true); const hp = wpos(lh.userData.hands[0].h);
      if (smr(t, lt[2], lt[2] + 0.35) <= 0) pose(lh, { armR: [-0.35, 0, -0.15, -0.5], handR: 0.9 });
      lh.updateMatrixWorld(true); wpos(lh.userData.hands[0].h, hp);
      lan.upd(hp.add(V3(0, -0.05, 0)), mola(t, (tt) => { const q = posOf(2, tt); return [q[0] - 0.25, q[1] + 0.8, q[2]]; }, { k: 30, c: 3 }), t);
      sea.upd(t); palms.forEach((pm) => pm.upd(t)); floatDust(flies, t, 0.6, 0.3); dome.userData.u.uOff.value.set(t * 0.002, 0);
    },
    after(t) { GU.uFlashCol.value.set(1, 0.9, 0.6); GU.uFlash.value = 0.18 * Math.pow(1 - seg(t, K.descobriu, K.descobriu + 0.6), 2) * (t >= K.descobriu ? 1 : 0); },
    cam(t) {
      const c = path2(t, [
        [a, [2.4, 1.45, 6.2], [0, 1.4, -2.0], 42],
        [K.descobriu - 0.3, [1.5, 1.6, -0.6], [0, 1.6, -5.4], 40],
        [K.rir + 0.6, [0.1, 2.35, -2.3], [0, 1.6, -4.75], 38],
        [K.quem0, [0.05, 2.05, -3.25], [0, 1.64, -4.75], 36],
        [K.fica + 0.3, [1.2, 4.0, -1.0], [0, 1.6, -4.4], 42],
        [b, [0, 9.5, 7.0], [0, 2.0, -5.5], 46],
      ]);
      return { ...shakeCam(c, t, impact(t, K.descobriu, 0.05, 0.6)), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 2 · o Século Perdido: cidade antiga em chamas, páginas se desfazendo; a pedra que nada destrói
addSet("s2-seculo", (g) => {
  const [a, b] = T.sc["s2-seculo"];
  const dome = skyDome(g, { top: 0x120a18, mid: 0x3a1a22, midY: 0.14, hor: 0x8a3a22, ground: 0x0a0606, sunDir: [-0.4, 0.06, -1], sunCol: 0xff7030, sunI: 0.6, disk: 3, cov: 0.6, cloudA: 0.75, cloudLit: 0xa84a2a, cloudSh: 0x1a0a0a, cloudScale: 0.14 });
  const hf = () => 0;
  chao(g, 120, 120, texCalcada([110, 96, 84], [74, 64, 56]), 50, 50, { rough: 0.95 });
  const tv = texTravertino(), wm = matBlocos(tv, 2, 1, { col: 0xb8a890 });
  // ruínas: muros quebrados, arcos, colunas, entulho
  [[-7, -6, 6, 4, 0.3], [6, -8, 8, 6, -0.4], [-10, 3, 5, 3, 1.2], [9, 4, 6, 5, -1.1], [0, -14, 10, 7, 0], [-4, -11, 4, 3, 0.6]].forEach(([x, z, w, h, r], i) => { const wl = mesh(box(w, h, 0.8), wm, x, h / 2, z, g); wl.rotation.y = r; const brk = mesh(box(w * 0.4, h * 0.5, 0.82), wm, x + Math.cos(r) * w * 0.3, h + h * 0.2, z - Math.sin(r) * w * 0.3, g); brk.rotation.set(0, r, 0.25); });
  const archG = bayGeo(5, 6, 2.8, 4.6, 1.0); [[-5.5, -9, 0.2], [5.5, -10, -0.3], [0, -15.5, 0]].forEach(([x, z, r]) => { const ar = mesh(archG, wm, x, 0, z, g); ar.rotation.y = r; });
  const cm = SM(0xc8b8a0, { roughness: 0.85 });
  [[-3.6, -3.4, 0.5], [3.8, -3.0, null], [-4.6, 2.6, 0.35], [4.4, 3.0, 0.7], [-1.8, -7.0, null], [2.4, -7.4, 0.4]].forEach(([x, z, br]) => coluna(g, x, z, 6.2, 0.42, { broken: br, mat: cm }));
  for (let i = 0; i < 22; i++) rock(g, (hash(i * 3) - 0.5) * 24, 0.1, (hash(i * 7) - 0.5) * 22, 0.2 + hash(i) * 0.6, i + 80, { col: 0xb0a08a, flat: 0.6 });
  // a pedra eterna no centro; a coluna que cai sobre ela e se despedaça
  const pe = pedraEterna(g, 0, 0, 0, 2.4);
  const fallC = coluna(g, 2.6, -1.0, 6.2, 0.42, { mat: cm }); const fallPiv = grp(g, 2.6, 0, -1.0); g.remove(fallC); fallPiv.add(fallC); fallC.position.set(0, 0, 0);
  const chunks = Array.from({ length: 14 }, (_, i) => { const c = mesh(colunaGeo(0.5 + hash(i) * 0.4, 0.38), cm, 0, 0, 0, g); c.visible = false; return c; });
  // fogo, brasas, fumaça e páginas queimando no ar
  const fires = [[-6, -4], [5, -5], [-8, 4], [7, 2], [-2, -10], [3, 6]].map(([x, z], i) => { const f = grp(g, x, 0, z); const gl = glowSprite(0xff7020, 2.4, 0.7); gl.position.y = 0.8; f.add(gl); const gl2 = glowSprite(0xffb040, 1.2, 0.8); gl2.position.y = 0.6; f.add(gl2); const L = new THREE.PointLight(0xff6a20, 8, 16, 1.5); L.position.y = 1.2; f.add(L); return { gl, gl2, L, i }; });
  const smoke = [[-6, 1.5, -4], [5, 1.5, -5], [-8, 1.5, 4], [7, 1.5, 2]].map((o_, i) => steam(g, { n: 16, origin: o_, color: 0x2a2220, opacity: 0.35, size: 1.6, rise: 1.4, spread: 1.2, life: 4, seed: i * 3 }));
  const embers = flowPts(260, 0xff8a30, 0.06); g.add(embers.pts);
  const pageTex = canvasTex(128, 160, (c, w, h) => { c.fillStyle = "#e8dcc0"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(60,40,30,.75)"; for (let i = 0; i < 14; i++) c.fillRect(12, 16 + i * 9, 30 + hash(i) * 74, 3); c.strokeStyle = "rgba(120,80,40,.6)"; c.lineWidth = 3; c.strokeRect(4, 4, w - 8, h - 8); });
  const pages = Array.from({ length: 34 }, (_, i) => { const m = new THREE.MeshStandardMaterial({ map: pageTex, side: THREE.DoubleSide, transparent: true, emissive: 0xff6a20, emissiveIntensity: 0 }); const p = mesh(new THREE.PlaneGeometry(0.42, 0.56), m, 0, 0, 0, g); p.castShadow = false; return p; });
  const dust = dustRing(g, 0x8a7a6a);
  const tF = K.destruir - 0.75, tHit = K.destruir - 0.05;
  return {
    bg: 0x140a0a, fogExp: 0.03, fogCol: 0x2a1410, dome,
    look: { exposure: 1.32, bloom: 0.65, bloomT: 0.76, vig: 0.5, sat: 1.1, con: 1.06, lift: [0.03, 0.01, 0.0] },
    sun: { dir: [-0.4, 0.45, -1], col: 0xff9a60, I: 1.6, c: [0, 1, 0], r: 14 }, hemi: { sky: 0x8a5a4a, ground: 0x2a140c, I: 0.75 }, fill: { col: 0xff8a40, I: 0.6, dir: [0.4, 0.3, 1] }, rim: { col: 0xff9a60, str: 0.65 },
    update(t) {
      fires.forEach((f) => { const fl = 0.8 + noise1(t * 6 + f.i * 3) * 0.25; f.gl.scale.setScalar(2.4 * fl); f.gl2.scale.setScalar(1.2 * fl); f.L.intensity = 8 * fl; });
      smoke.forEach((s) => s.upd(t, 1));
      for (let i = 0; i < 260; i++) { const ph = (t * (0.18 + hash(i) * 0.15) + hash(i * 2.1)) % 1, f = fires[i % 6]; const p0 = f.gl.parent.position; embers.pos.set([p0.x + (hash(i * 3) - 0.5) * 2 + Math.sin(t + i) * 0.4 * ph, 0.5 + ph * 9, p0.z + (hash(i * 5) - 0.5) * 2], i * 3); } embers.upd();
      // páginas: giram no ar e queimam (bordas acesas) até sumir
      pages.forEach((p, i) => { const ph = (t * 0.09 + hash(i * 1.7)) % 1, an = hash(i) * 6.28 + t * 0.25 * (hash(i * 3) - 0.5), r = 2.5 + hash(i * 5) * 7;
        p.position.set(Math.cos(an) * r, 0.8 + ph * 6 + Math.sin(t * 1.3 + i) * 0.3, Math.sin(an) * r - 1); p.rotation.set(t * (0.6 + hash(i)) + i, t * 0.7 + i * 2, t * 0.4); p.material.opacity = Math.sin(ph * Math.PI) * (1 - smr(ph, 0.6, 0.95)); p.material.emissiveIntensity = 1.4 * smr(ph, 0.45, 0.85); });
      // inscrições acendem quando "ficou gravado"; a coluna cai, quebra e a pedra fica intacta
      pe.m.emissiveIntensity = 0.95 * smr(t, K.gravado - 0.3, K.gravado + 0.4) + 0.6 * Math.pow(1 - seg(t, tHit, tHit + 0.8), 2) * (t > tHit ? 1 : 0);
      const fk = E.in(seg(t, tF, tHit)); fallPiv.rotation.z = 0.53 * fk; fallC.visible = t < tHit + 0.02;
      chunks.forEach((c, i) => { const k = seg(t, tHit, tHit + 1.6); c.visible = t >= tHit && k < 1; if (!c.visible) return; const a_ = Math.PI * (0.55 + (i / 14) * 0.9) + hash(i) * 0.3, sp = 1.5 + hash(i * 3) * 2.5; c.position.set(Math.cos(a_) * sp * k * 1.4 + 0.6, 2.6 + (3 + hash(i * 5) * 2) * k - 9.8 * k * k * 1.2, Math.sin(a_) * sp * k - 0.4); if (c.position.y < 0.3) c.position.y = 0.3; c.rotation.set(k * 6 + i, k * 4 + i, k * 5); });
      dust(t, tHit, V3(0.5, 0, -0.2), 3.2, 1.6);
      dome.userData.u.uOff.value.set(t * 0.004, 0);
    },
    after(t) { GU.uFlashCol.value.set(1, 0.8, 0.5); GU.uFlash.value = 0.3 * Math.pow(1 - seg(t, tHit, tHit + 0.4), 2) * (t >= tHit ? 1 : 0); },
    cam(t) {
      const c = path2(t, [
        [a, [9, 10.5, 11], [0, 1.5, -2], 46],
        [K.pedaco, [6.5, 5.2, 7.5], [0, 1.8, -1], 42],
        [K.gravado - 0.3, [3.6, 2.6, 4.6], [0, 1.4, 0], 38],
        [tHit - 0.2, [4.2, 2.2, 5.2], [0.8, 2.2, -0.4], 40],
        [b, [3.0, 1.8, 4.2], [0, 1.3, 0], 36],
      ]);
      return { ...shakeCam(c, t, impact(t, tHit, 0.14, 0.8)), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 3 · o primeiro pirata: mar ao amanhecer; o navio com a bandeira do sol que ri e o homem de luz na proa; a transmissão no céu
function holoPainel(g) {
  const p = grp(g), W = 14, H = 7.5;
  const tx = canvasTex(512, 280, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "rgba(140,220,255,.9)"; c.lineWidth = 4; c.strokeRect(6, 6, w - 12, h - 12); c.lineWidth = 2; c.strokeRect(16, 16, w - 32, h - 32); c.fillStyle = "rgba(120,200,255,.12)"; c.fillRect(16, 16, w - 32, h - 32);
    c.strokeStyle = "rgba(160,230,255,.8)"; c.beginPath(); c.arc(w / 2, 90, 46, 0, 7); c.stroke(); c.beginPath(); c.arc(w / 2, 90, 30, 0, 7); c.stroke(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * 30, 90 + Math.sin(a) * 30); c.lineTo(w / 2 + Math.cos(a) * 46, 90 + Math.sin(a) * 46); c.stroke(); } }, { linear: false });
  const scr = mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, blending: ADD, side: THREE.DoubleSide }), 0, 0, 0, p); scr.castShadow = false;
  const bars = Array.from({ length: 28 }, (_, i) => { const m = mesh(box(0.28, 1, 0.05), new THREE.MeshBasicMaterial({ color: 0x8ae0ff, transparent: true, opacity: 0, depthWrite: false, blending: ADD }), (i - 13.5) * 0.4, -1.6, 0.05, p); m.castShadow = false; return m; });
  const halo = glowSprite(0x6ad0ff, 18, 0); p.add(halo);
  return { p, upd(t, k) { p.visible = k > 0.01; scr.material.opacity = 0.85 * k; halo.material.opacity = 0.18 * k; bars.forEach((m, i) => { const v = 0.15 + Math.abs(noise1(t * 6 + i * 0.7)) * 1.6 * (0.5 + 0.5 * Math.sin(t * 2 + i * 0.3)); m.scale.y = Math.max(0.05, v); m.material.opacity = 0.85 * k; }); } };
}
addSet("s3-pirata", (g) => {
  const [a, b] = T.sc["s3-pirata"];
  const dome = skyDome(g, { top: 0x2a4a8a, mid: 0xc88a7a, midY: 0.12, hor: 0xffb070, ground: 0x1a2028, sunDir: [1, 0.07, -0.35], sunCol: 0xffb060, sunI: 1.0, disk: 2.6, cov: 0.5, cloudA: 0.8, cloudLit: 0xffd0a8, cloudSh: 0x6a5a7a, cloudScale: 0.15 });
  const sea = oceano(g, { size: 360, segs: 150, deep: 0x0e3448, crest: 0x4a8aa0, foam: 0xf0f4f4, env: envGold(), envI: 0.8, amp: 0.8 });
  const nv = navio(g, { casco: 0x4a2c1a, faixa: 0xd8a848, vela: 0xe8d8b8 }); const SP = V3(0, 0, 0), SA = 0.25;
  const hl = homemLuz({ luz: 1.0, brilho: 0.9 }); nv.add(hl); hl.position.set(0, nv.userData.deckY + 0.08, 4.6); hl.rotation.y = 0.0;
  const holo = holoPainel(g); holo.p.position.set(-4, 16, -26); holo.p.lookAt(4, 4, 10);
  const brd = birds(g, 8, { center: [0, 14, 6], rx: 18, rz: 10, speed: 0.12, color: 0x2a2a30 });
  const sunR = godRays(g, [110, 16, -40], [-1, -0.12, 0.35], { n: 8, len: 140, w: 8, spread: 30, opacity: 0.04, color: 0xffc080 });
  const shipAt = (t) => { const d = (t - a) * 1.6, x = SP.x + Math.sin(SA) * d, z = SP.z + Math.cos(SA) * d, q = naviaPose(x, z, SA, t, 13, 3.6, 0.8); return { x, z, ...q }; };
  return {
    bg: 0x6a7090, fogExp: 0.006, fogCol: 0xd8a890, dome,
    look: { exposure: 1.0, bloom: 0.5, bloomT: 0.86, vig: 0.4, sat: 1.12, con: 1.06, lift: [0.02, 0.01, 0.03] },
    sun: { dir: [1, 0.35, -0.35], col: 0xffc080, I: 2.6, c: [0, 2, 2], r: 14 }, hemi: { sky: 0x9ab0e0, ground: 0x2a3a48, I: 0.7 }, fill: { col: 0xffd8b0, I: 0.5, dir: [0.4, 0.3, 1] }, rim: { col: 0xffd0a0, str: 0.6 },
    update(t) {
      const s = shipAt(t); nv.position.set(s.x, s.y - 0.35, s.z); nv.rotation.set(0, SA, 0); nv.rotateX(-s.pitch); nv.rotateZ(s.roll);
      nv.userData.velas.forEach((v) => v(t, 1)); nv.userData.flag.upd(t, 1.2 + 0.3 * Math.sin(t));
      // o homem de luz na proa: equilíbrio contra o balanço (tronco compensa), cachecol com mola e vento
      restPose(hl); idle(hl, t, 71, 0.5); standFeetOn(hl, nv, { y: nv.userData.deckY + 0.08 });
      pose(hl, { spine: [s.pitch * 0.5, 0, -s.roll * 0.7], chest: [0, 0, -s.roll * 0.3], armL: [-0.15, 0, 0.25, -0.3], armR: [0.05, 0, -0.2, -0.3] });
      const lag = mola(t, (tt) => { const q = shipAt(tt); return [q.x, q.y + Math.sin(q.pitch) * 4.6, q.z]; }, { k: 30, c: 4 });
      clothWind(hl, t, 1.6, [lagLocal(hl, lag)[0], 0, -0.06]); hairMola(hl, lagLocal(hl, lag), 6);
      const pk = smr(t, K.primeiro - 0.2, K.primeiro + 0.4); hl.userData.glow.material.opacity = 0.14 + 0.16 * pk; hl.userData.core.color.setRGB(0.9 + 0.25 * pk, 0.72 + 0.18 * pk, 0.52 + 0.12 * pk);
      holo.upd(t, smr(t, K.mensagem - 0.3, K.mensagem + 0.4) * (1 - 0.5 * smr(t, K.historia2, b)));
      sea.upd(t); brd(t); dome.userData.u.uOff.value.set(t * 0.004, 0);
    },
    cam(t) {
      const s = shipAt(t), bow = V3(s.x + Math.sin(SA) * 4.8, s.y + 1.9, s.z + Math.cos(SA) * 4.8);
      const c = path2(t, [
        [a, [bow.x + 2.6, 1.6, bow.z + 5.0], [bow.x, bow.y + 0.3, bow.z], 40],
        [K.mensagem + 0.3, [bow.x + 4.0, 3.0, bow.z + 7.5], [bow.x - 1.2, bow.y + 5.5, bow.z - 6], 46],
        [K.primeiro - 0.1, [bow.x + 2.2, 1.9, bow.z + 3.6], [bow.x, bow.y + 0.4, bow.z], 38],
        [b, [bow.x - 2.8, 2.4, bow.z + 4.4], [bow.x, bow.y + 0.6, bow.z - 1], 40],
      ]);
      return { ...c, near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 4 · a promessa: reino no fundo do mar; o homem de luz toca a pedra do pedido de desculpas
addSet("s4-promessa", (g) => {
  const [a, b] = T.sc["s4-promessa"];
  const hf = (x, z) => fbm2(x * 0.08, z * 0.08, 4) * 1.4 - 0.7;
  const sandT = texPair(512, (u, v) => Math.sin(u * 80 + fbm2(u * 6, v * 6, 3, 6) * 6) * 0.3 + 0.5 + fbm2(u * 30, v * 30, 2, 30) * 0.2, (u, v, h) => mixc([150, 150, 130], [200, 196, 170], h), 2.5);
  rep(sandT.map, 10, 10); rep(sandT.normalMap, 10, 10);
  terrain(g, { h: hf, size: 220, segs: 120, grassA: 0xb8b498, grassB: 0xd8d0b0, dirt: 0xa89c80, rock: 0x6a7068 });
  // palácio de coral e conchas (cúpulas peroladas), corais, algas
  const pal = grp(g, 0, 0, -26); cupula(pal, 0, 0, 7, { col: 0xf0e0e8, dome: 0x8ad8d0 }); cupula(pal, -12, 4, 4.5, { col: 0xf0e0e8, dome: 0xf0a8b8 }); cupula(pal, 12, 3, 4.5, { col: 0xf0e0e8, dome: 0xf0a8b8 });
  [-6, 6].forEach((x) => { mesh(cyl(0.9, 1.3, 16, 16), SM(0xf2e6ea), x, 8, 2, pal); mesh(new THREE.ConeGeometry(1.4, 4, 16), SM(0x8ad8d0, { roughness: 0.4 }), x, 18, 2, pal); });
  const coralC = [0xff7a6a, 0xff9ab8, 0xffd06a, 0x8ae0c0, 0xc88aff];
  for (let i = 0; i < 46; i++) { const x = (hash(i * 3.1) - 0.5) * 30, z = (hash(i * 5.7) - 0.5) * 26 - 4; if (Math.hypot(x, z + 1) < 4) continue; const cg = grp(g, x, hf(x, z) - 0.1, z), col = coralC[i % 5];
    for (let k = 0; k < 4; k++) { const br = mesh(lockGeo([[0, 0, 0], [(hash(i + k) - 0.5) * 0.4, 0.5, (hash(i * 2 + k) - 0.5) * 0.4], [(hash(i * 3 + k) - 0.5) * 0.8, 1.0 + hash(k) * 0.6, (hash(i * 4 + k) - 0.5) * 0.8]], 0.12, 0.05, 1, 8, 7), SM(col, { roughness: 0.6, emissive: col, emissiveIntensity: 0.12 }), 0, 0, 0, cg); br.scale.setScalar(0.8 + hash(i * 7) * 0.9); } }
  const kelp = []; for (let i = 0; i < 40; i++) { const x = (hash(i * 7.1) - 0.5) * 34, z = (hash(i * 3.3) - 0.5) * 28 - 6; if (Math.hypot(x, z + 1) < 4.5) continue; const h = 3 + hash(i) * 5; const kg = grp(g, x, hf(x, z), z); const segs = []; let par = kg; for (let k = 0; k < 6; k++) { const s_ = grp(par, 0, k ? h / 6 : 0, 0); mesh(box(0.25, h / 6, 0.02), SM(0x3a7a3a, { side: THREE.DoubleSide, roughness: 0.8 }), 0, h / 12, 0, s_); segs.push(s_); par = s_; } kelp.push({ segs, i }); }
  for (let i = 0; i < 14; i++) rock(g, (hash(i * 9) - 0.5) * 30, 0, (hash(i * 4) - 0.5) * 24 - 4, 0.6 + hash(i) * 1.4, i + 120, { col: 0x5a6a6a });
  // a pedra do pedido de desculpas (com inscrições que acendem) e o homem de luz ajoelhado tocando-a
  const pe = pedraEterna(g, 0, hf(0, -1.5) - 0.2, -1.5, 2.2); pe.c.rotation.y = 0.2;
  const hl = homemLuz({ luz: 1.2, brilho: 0.95, cachecol: 2.4 }); hl.position.set(0.3, hf(0.3, 0.6), 0.65); hl.rotation.y = Math.PI + 0.15; g.add(hl);
  const fishA = cardume(g, 40, [0, 4, -4], 7, 0xc8e0f0), fishB = cardume(g, 26, [-6, 6, -10], 4, 0xffc070);
  const bub = flowPts(160, 0xd8f4ff, 0.08); g.add(bub.pts);
  const rays = godRays(g, [0, 30, -4], [0.05, -1, 0.1], { n: 12, len: 40, w: 3, spread: 22, opacity: 0.08, color: 0x9ae8ff });
  const caust = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#000"; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 3; for (let i = 0; i < 40; i++) { c.beginPath(); let x = hash(i) * w, y = hash(i * 3) * h; c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (hash(i * 7 + k) - 0.5) * 70; y += (hash(i * 11 + k) - 0.5) * 70; c.lineTo(x, y); } c.stroke(); } }, { linear: true });
  rep(caust, 8, 8); const cp = mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: caust, color: 0x6ad0e0, transparent: true, opacity: 0.12, blending: ADD, depthWrite: false }), 0, 0.05, -4, g); cp.rotation.x = -Math.PI / 2; cp.castShadow = false;
  return {
    bg: 0x04324a, fogExp: 0.045, fogCol: 0x0a4a62,
    look: { exposure: 1.15, bloom: 0.65, bloomT: 0.74, vig: 0.5, sat: 1.1, con: 1.05, lift: [0.0, 0.02, 0.04] },
    sun: { dir: [0.1, 1, 0.2], col: 0xa8f0ff, I: 1.6, c: [0, 0, -2], r: 12 }, hemi: { sky: 0x4ac0e0, ground: 0x0a2a3a, I: 0.75 }, fill: { col: 0x6ad8ff, I: 0.4, dir: [0.3, 0.2, 1] }, rim: { col: 0xa8f0ff, str: 0.7 }, hand: 0.01,
    update(t) {
      // ajoelhado diante da pedra; a mão vai até ela (antecipação) quando "deixou um pedido de desculpas"; depois abaixa a cabeça
      restPose(hl); idle(hl, t, 71, 0.4); kneelPose(hl, 1);
      const reach = act(t, K.deixou - 0.2, K.desculpas + 0.2, 0.15, 0.05);
      if (reach > 0.01) { hl.updateMatrixWorld(true); const tgt = V3(0.15, hf(0, -1.5) + 1.25, -0.42); armIK(hl, 1, tgt, tgt.clone().add(V3(0.5, -0.8, 0.6)), clamp(reach)); pose(hl, { handL: 0 }); }
      const bow = smr(t, K.conseguir - 0.2, K.promessa + 0.4);
      pose(hl, { spine: [0.35 + 0.25 * bow, 0, 0], neck: [0.2 + 0.35 * bow, 0, 0] });
      clothWind(hl, t, 0.5, [Math.sin(t * 0.7) * 0.05, 0.05, Math.cos(t * 0.6) * 0.05]);
      const gl = smr(t, K.desculpas - 0.3, K.desculpas + 0.5); pe.m.emissiveIntensity = 0.85 * gl * (1 - 0.5 * bow) + 0.12;
      hl.userData.core.color.setRGB(0.95 - 0.25 * bow, 0.8 - 0.2 * bow, 0.62 - 0.1 * bow); hl.userData.glow.material.opacity = 0.2 - 0.1 * bow;
      kelp.forEach((k) => k.segs.forEach((s, j) => (s.rotation.set(Math.sin(t * 0.9 + k.i + j * 0.6) * 0.12, 0, Math.sin(t * 0.7 + k.i * 2 + j * 0.5) * 0.15))));
      fishA(t); fishB(t * 1.2);
      for (let i = 0; i < 160; i++) { const ph = (t * (0.15 + hash(i) * 0.1) + hash(i * 1.9)) % 1; bub.pos.set([(hash(i * 3) - 0.5) * 20 + Math.sin(t * 2 + i) * 0.2, ph * 14, (hash(i * 5) - 0.5) * 16 - 4], i * 3); } bub.upd();
      caust.offset.set(Math.sin(t * 0.3) * 0.2, t * 0.03);
      rays.userData.rays.forEach((r, i) => (r.material.opacity = 0.06 + 0.03 * Math.sin(t * 0.8 + i * 1.3)));
    },
    cam(t) {
      return { ...path2(t, [
        [a, [3.5, 7.5, 12], [0, 2.5, -10], 46],
        [K.deixou, [3.6, 2.2, 5.0], [0.1, 1.2, -0.8], 40],
        [K.desculpas + 0.4, [2.6, 1.6, 3.4], [0.0, 1.1, -0.6], 38],
        [b, [-2.4, 1.5, 3.6], [0.1, 1.0, -0.4], 38],
      ]), near: 0.05 };
    },
  };
});
