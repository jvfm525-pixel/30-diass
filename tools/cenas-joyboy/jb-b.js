// ================================================================ vídeo: Joy Boy · cenas 5–9
// cena num referencial que balança (cabine do navio): transforma posições da câmera do quarto para o mundo
function roomCam(room, c) { room.updateMatrixWorld(true); const p = room.localToWorld(V3(...c.pos)), l = room.localToWorld(V3(...c.look)); return { ...c, pos: p.toArray(), look: l.toArray() }; }
function bauOuro(g, x, y, z) {
  const c = grp(g, x, y, z), wood = SM(0x6a2a18, { roughness: 0.6 }), gm = GOLDM();
  mesh(box(0.92, 0.42, 0.56), wood, 0, 0.21, 0, c); [-0.32, 0.32].forEach((xx) => mesh(box(0.06, 0.44, 0.58), gm, xx, 0.21, 0, c)); mesh(box(0.96, 0.05, 0.6), gm, 0, 0.02, 0, c);
  const lid = grp(c, 0, 0.42, -0.28); mesh(box(0.92, 0.13, 0.56), wood, 0, 0.065, 0.28, lid); [-0.32, 0.32].forEach((xx) => mesh(box(0.06, 0.15, 0.58), gm, xx, 0.065, 0.28, lid));
  mesh(box(0.12, 0.12, 0.04), gm, 0, 0.36, 0.29, c);
  return { c, lid };
}

// ---------------------------------------------------------------- 5 · keys: cabine do navio (que balança); o jovem pirata abre o baú e as keys voam
addSet("s5-keys", (g) => {
  const [a, b] = T.sc["s5-keys"];
  const room = grp(g, 0, 0, 0);
  const pk = texPlanks([128, 86, 52], [96, 64, 40]), wallM = SM(0xffffff, { map: rep(pk.map.clone(), 3, 1.4), normalMap: pk.normalMap, roughness: 0.8 }); wallM.map.needsUpdate = true;
  const floorM = SM(0xffffff, { map: rep(texPlanks([110, 74, 44], [84, 56, 34]).map.clone(), 2.5, 2.5), roughness: 0.75 }); floorM.map.needsUpdate = true;
  mesh(box(7, 0.2, 6), floorM, 0, -0.1, 0, room); mesh(box(7, 0.2, 6), wallM, 0, 3.3, 0, room);
  mesh(box(7, 3.4, 0.2), wallM, 0, 1.6, -3, room); mesh(box(0.2, 3.4, 6), wallM, -3.5, 1.6, 0, room); mesh(box(0.2, 3.4, 6), wallM, 3.5, 1.6, 0, room);
  for (let i = 0; i < 6; i++) mesh(box(0.22, 0.25, 6), SM(0x4a2c18), -3 + i * 1.2, 3.1, 0, room);
  // escotilhas com o mar lá fora (horizonte que balança contra a cabine)
  const seaTex = canvasTex(128, 128, (c, w, h) => { const g_ = c.createLinearGradient(0, 0, 0, h); g_.addColorStop(0, "#ffd0a0"); g_.addColorStop(0.48, "#ff9a6a"); g_.addColorStop(0.5, "#2a5a7a"); g_.addColorStop(1, "#0a2a40"); c.fillStyle = g_; c.fillRect(0, 0, w, h); });
  const ports = [-1.6, 1.6].map((x) => { const pt = grp(room, x, 1.9, -2.88); mesh(new THREE.TorusGeometry(0.42, 0.07, 8, 24), GOLDM(), 0, 0, 0.02, pt); const v = mesh(new THREE.CircleGeometry(0.4, 24), new THREE.MeshBasicMaterial({ map: seaTex }), 0, 0, 0, pt); return v; });
  // mesa com mapas, lanterna pendurada que balança como pêndulo (a cabine inclina, a lanterna segue a gravidade)
  const mapT = canvasTex(256, 192, (c, w, h) => { c.fillStyle = "#e0cc9a"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(90,60,30,.7)"; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(40 + hash(i) * 180, 40 + hash(i * 3) * 110, 12 + hash(i * 5) * 30, 8 + hash(i * 7) * 20, hash(i) * 3, 0, 7); c.stroke(); } c.setLineDash([6, 6]); c.beginPath(); c.moveTo(20, 170); c.bezierCurveTo(80, 90, 160, 160, 230, 30); c.stroke(); c.setLineDash([]); c.fillStyle = "#a82a1a"; c.font = "700 26px serif"; c.fillText("✕", 220, 40); });
  mesh(box(2.2, 0.1, 1.2), SM(0x5a3a22), 1.6, 0.85, -1.6, room); [[0.6, -2.1], [2.6, -2.1], [0.6, -1.1], [2.6, -1.1]].forEach(([x, z]) => mesh(box(0.1, 0.85, 0.1), SM(0x3a2414), x, 0.42, z, room));
  const mp = mesh(new THREE.PlaneGeometry(1.4, 1.0), SM(0xffffff, { map: mapT }), 1.6, 0.91, -1.6, room); mp.rotation.x = -Math.PI / 2; mp.rotation.z = 0.15;
  const hook = grp(room, -1.2, 3.2, -0.6); const pend = grp(hook); mesh(cyl(0.01, 0.01, 0.5, 4), SM(0x2a221c), 0, -0.25, 0, pend);
  const lampB = grp(pend, 0, -0.62, 0); mesh(cyl(0.12, 0.14, 0.26, 8), new THREE.MeshStandardMaterial({ color: 0xffd8a0, emissive: 0xffa040, emissiveIntensity: 1.6, transparent: true, opacity: 0.9 }), 0, 0, 0, lampB);
  const lampL = new THREE.PointLight(0xffa850, 5, 10, 1.5); lampB.add(lampL); const lampG = glowSprite(0xffb060, 1.2, 0.55); lampB.add(lampG);
  // o baú e as keys
  const ch = bauOuro(room, 0, 0, -1.0);
  const cardTex = canvasTex(256, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#1a1a3a"); gr.addColorStop(1, "#c8962a"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,230,160,.9)"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#fff"; c.font = "700 54px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("KEY", w / 2, h / 2 - 12); c.font = "700 22px 'Space Mono', monospace"; c.fillText("ALEATÓRIA", w / 2, h / 2 + 34); }, { redraw: true });
  const cards = []; for (let i = 0; i < 12; i++) cards.push(mesh(box(0.32, 0.2, 0.01), new THREE.MeshStandardMaterial({ map: cardTex, emissive: 0xffffff, emissiveMap: cardTex, emissiveIntensity: 0.4, roughness: 0.4 }), 0, 0, 0, room));
  const cg = glowSprite(0xffc070, 1.8, 0); cg.position.set(0, 0.8, -1.0); room.add(cg);
  const coins = flowPts(80, 0xffd060, 0.04); room.add(coins.pts);
  const motes = dustPts(120, [-3, 3, 0.3, 3, -2.8, 2], 0xffe0b0, 0.022, 0.6); room.add(motes);
  // o jovem pirata ajoelhado diante do baú
  const jv = jovem(); room.add(jv); jv.position.set(0, 0, -0.05); jv.rotation.y = Math.PI;
  const roll = (t) => 0.045 * Math.sin(t * 0.85) + 0.012 * Math.sin(t * 2.1), pitch = (t) => 0.02 * Math.sin(t * 0.6 + 1);
  const hinge = V3(0, 0.42, -1.28);
  return {
    bg: 0x1a1008, fog: [8, 30],
    look: { exposure: 1.15, bloom: 0.7, bloomT: 0.72, vig: 0.52, sat: 1.12, con: 1.05 },
    sun: { dir: [0.2, 0.6, -1], col: 0xffb070, I: 1.0, c: [0, 1, -1], r: 5 }, hemi: { sky: 0x8a6040, ground: 0x2a1408, I: 0.55 }, fill: { col: 0xffc890, I: 0.35, dir: [0.3, 0.5, 1] }, rim: { col: 0xffc070, str: 0.6 }, hand: 0.006,
    update(t) {
      room.rotation.set(pitch(t), 0, roll(t));
      pend.rotation.set(-pitch(t - 0.3) * 1.25, 0, -roll(t - 0.35) * 1.3);
      lampL.intensity = 4.6 + noise1(t * 6) * 0.5; ports.forEach((v, i) => (v.material.map.offset.y = roll(t) * 2.5));
      // tampa abre com as duas mãos; as keys sobem e giram; no "agora" ele vira para a câmera sorrindo
      const la = -1.75 * E.outBack(smr(t, K.rapidinho + 0.5, K.steam - 0.2)); ch.lid.rotation.x = la;
      restPose(jv); idle(jv, t, 61, 0.5); kneelPose(jv, 1); pose(jv, { spine: [0.25, 0, 0] });
      const grab = smr(t, a + 0.3, K.rapidinho + 0.45) * (1 - smr(t, K.steam + 0.2, K.steam + 0.8));
      room.updateMatrixWorld(true);
      if (grab > 0.01) [-1, 1].forEach((sx, i) => { const e = V3(sx * 0.3, hinge.y + Math.sin(-la) * 0.56 + 0.13 * Math.cos(-la), hinge.z + Math.cos(-la) * 0.56); const w_ = room.localToWorld(e.clone()), pl = room.localToWorld(e.clone().add(V3(sx * 0.8, -0.6, 0.8))); armIK(jv, i === 0 ? 1 : 0, w_, pl, grab); });
      const cheer = act(t, K.steam - 0.1, K.steam + 0.6, 0.2, 0.08) * (1 - smr(t, K.agora - 0.4, K.agora));
      if (cheer > 0.01) pose(jv, { armR: [-2.4 * clamp(cheer), 0, -0.4, -0.3], armL: [-2.4 * clamp(cheer), 0, 0.4, -0.3], handR: 1, handL: 1, spine: [-0.1, 0, 0] }, clamp(cheer));
      const turn = smr(t, K.agora - 0.1, K.agora + 0.35);
      if (turn > 0) { lookAtW(jv, room.localToWorld(V3(1.3, 1.3, -1.8)), turn, 1.4); }
      face(jv, { smile: 0.35 + 0.55 * smr(t, K.steam - 0.3, K.steam) + 0.2 * turn, open: 0.3 * clamp(cheer), brow: 0.4 * clamp(cheer) + 0.2 * turn, lid: 1 });
      clothWind(jv, t, 0.4, [0, 0, -0.02 * Math.sin(t)]);
      const up = smr(t, K.steam - 0.4, K.bio + 0.2), lt = t - a;
      cards.forEach((cd, i) => { const ang = (i / 12) * Math.PI * 2 + lt * 0.7, r = 0.1 + up * (0.42 + (i % 3) * 0.12); cd.position.set(Math.cos(ang) * r * 1.3, 0.55 + up * (0.55 + Math.sin(lt * 2 + i) * 0.08 + (i % 4) * 0.12), -1.0 + Math.sin(ang) * r * 0.7); cd.rotation.set(-0.3 + Math.sin(lt + i) * 0.2, -ang + Math.PI / 2, Math.sin(lt * 1.3 + i) * 0.2); cd.visible = up > 0.01; });
      cg.material.opacity = 0.45 * up;
      for (let i = 0; i < 80; i++) { const ph = (t * 0.5 + hash(i * 1.7)) % 1, an = hash(i) * 6.28 + t; coins.pos.set([Math.cos(an) * (0.2 + ph * 0.9), 0.5 + ph * 1.3 * up, -1.0 + Math.sin(an) * (0.2 + ph * 0.6)], i * 3); } coins.pts.material.opacity = up * 0.8; coins.upd();
      floatDust(motes, t, 0.2, 0.15);
    },
    cam(t) {
      return { ...roomCam(room, path2(t, [
        [a, [1.6, 1.5, 2.4], [0, 0.7, -1.0], 40],
        [K.steam, [1.0, 1.25, 1.2], [0, 0.9, -1.0], 38],
        [K.agora - 0.1, [1.5, 1.3, -1.7], [0, 1.0, -0.2], 36],
        [b, [1.2, 1.3, -1.9], [0, 1.05, -0.2], 34],
      ])), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 6 · o amigo que esperou: ilha-laboratório em ruínas; o gigante de ferro desperta e solta a onda dourada
addSet("s6-gigante", (g) => {
  const [a, b] = T.sc["s6-gigante"];
  const dome = skyDome(g, { top: 0x2a3070, mid: 0xb06a6a, midY: 0.13, hor: 0xffa058, ground: 0x2a1a14, sunDir: [-1, 0.1, 0.3], sunCol: 0xffa050, sunI: 1.1, disk: 2.4, cov: 0.55, cloudA: 0.85, cloudLit: 0xffc0a0, cloudSh: 0x4a3a5a });
  const hf = (x, z) => (z < -6 ? 2 + fbm2(x * 0.08, z * 0.08, 4) * 6 : fbm2(x * 0.1, z * 0.1, 3) * 0.6 - 0.2);
  terrain(g, { h: hf, size: 260, segs: 120, grassA: 0x4a5a30, grassB: 0x6a7040, dirt: 0x6a5a48, rock: 0x5a5a60 });
  grassField(g, 2200, [-14, 14, -6, 12], hf, { colA: 0x5a6a30, colB: 0x9a9a50, s: 1.2 });
  const sea = oceano(g, { y: -1.2, z: 150, size: 260, segs: 90, deep: 0x1a2a3a, crest: 0x6a7a8a, foam: 0xf0e0d0, amp: 0.4 });
  // ruínas metálicas: cúpulas partidas, canos, painéis
  const panel = texPair(256, (u, v) => { const gx = (u * 6) % 1, gy = (v * 6) % 1; return Math.min(gx, gy, 1 - gx, 1 - gy) < 0.04 ? 0.2 : 0.8 + fbm2(u * 20, v * 20, 2, 20) * 0.2; }, (u, v, h) => mixc([150, 156, 162], [110, 116, 122], fbm2(u * 4, v * 4, 3, 4)), 2.2);
  const mt = new THREE.MeshStandardMaterial({ map: panel.map, normalMap: panel.normalMap, metalness: 0.55, roughness: 0.5, envMap: envGold(), envMapIntensity: 0.4, side: THREE.DoubleSide });
  [[-12, -10, 7], [13, -12, 9], [-20, 4, 5]].forEach(([x, z, r], i) => { const d = mesh(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * (1.2 + hash(i) * 0.5), 0, Math.PI / 2), mt, x, hf(x, z) - 0.5, z, g); d.rotation.y = hash(i * 3) * 6; });
  for (let i = 0; i < 10; i++) { const x = (hash(i * 7) - 0.5) * 30, z = (hash(i * 3) - 0.5) * 16 - 2; const pc = mesh(cyl(0.3, 0.3, 4 + hash(i) * 5, 12), mt, x, 0.3, z, g); pc.rotation.set(Math.PI / 2, hash(i * 5) * 3, 0.2); }
  for (let i = 0; i < 14; i++) { const x = (hash(i * 9) - 0.5) * 26, z = (hash(i * 4) - 0.5) * 14; const pn = mesh(box(1.5 + hash(i) * 2, 0.15, 1 + hash(i * 2) * 1.5), mt, x, hf(x, z) + 0.2, z, g); pn.rotation.set(hash(i * 3) - 0.5, hash(i * 5) * 3, hash(i * 7) - 0.5); }
  // o gigante de ferro sentado, com trepadeiras
  const co = colosso({ s: 1.25 }); co.position.set(0, hf(0, -3.5), -3.5); g.add(co);
  const vines = SM(0x3a6a2a); for (let i = 0; i < 10; i++) { const a_ = hash(i) * 6.28; mesh(lockGeo([[Math.cos(a_) * 1.6, 3.5, Math.sin(a_) * 1.2], [Math.cos(a_) * 1.9, 2.2, Math.sin(a_) * 1.5], [Math.cos(a_) * 1.7, 0.8, Math.sin(a_) * 1.6]], 0.06, 0.02, 1, 8, 6), vines, 0, 0, 0, co.userData.torso); }
  // lembrança: o homem de luz tocando a mão do gigante (aparece translúcido)
  const mem = homemLuz({ luz: 0.6, brilho: 0.8 }); mem.position.set(2.4, 0, -0.6); mem.rotation.y = -1.9; g.add(mem); mem.traverse((c) => { if (c.userData.isOutline) c.visible = false; });
  const wave = ondaDourada(g), ring = aneis(g, 4, 0xffd070), beamUp = godRays(g, [0, 4, -2], [0.05, 1, 0.25], { n: 8, len: 70, w: 3.5, spread: 4, opacity: 0, color: 0xffd070 });
  const nvP = navio(g, { L: 6, W: 2.0, D: 1.0, mastros: [[0.05, 5.5]], bw: 1.1, bh: 0.75, vela: 0xf0e6d0 }); nvP.scale.setScalar(1.0);
  const dust = flowPts(160, 0xa89878, 0.08, NORM); g.add(dust.pts); dust.pts.material.opacity = 0;
  const wakeK = (t) => { const k = smr(t, K.guardou - 0.3, K.anos5 + 0.4); return k + (k > 0 && k < 1 ? Math.sin(t * 38) * 0.05 * (1 - k) : 0); };
  return {
    bg: 0x2a1a20, fogExp: 0.006, fogCol: 0xc8907a, dome,
    look: { exposure: 1.08, bloom: 0.6, bloomT: 0.78, vig: 0.42, sat: 1.12, con: 1.06, lift: [0.02, 0.0, 0.03] },
    sun: { dir: [-1, 0.35, 0.3], col: 0xffb070, I: 2.6, c: [0, 2, -2], r: 16 }, hemi: { sky: 0x8a90c8, ground: 0x6a5034, I: 0.62 }, fill: { col: 0x8a9ad0, I: 0.45, dir: [1, 0.3, 0.5] }, rim: { col: 0xffc890, str: 0.6 },
    update(t) {
      const wk = clamp(wakeK(t)), raise = act(t, K.usou - 0.3, K.usou + 0.6, 0.15, 0.06), off = smr(t, K.escapar + 0.2, b);
      colossoPose(co, t, wk * (1 - 0.8 * off), clamp(raise) * (1 - 0.6 * off));
      // poeira e musgo caindo quando ele se mexe
      dust.pts.material.opacity = 0.7 * smr(t, K.guardou, K.guardou + 0.4) * (1 - smr(t, K.anos5 + 0.6, K.anos5 + 1.6)) + 0.6 * smr(t, K.usou - 0.2, K.usou) * (1 - smr(t, K.usou + 0.8, K.usou + 1.6));
      for (let i = 0; i < 160; i++) { const ph = (t * 0.5 + hash(i * 1.3)) % 1; dust.pos.set([(hash(i) - 0.5) * 6, 9 - ph * 9, -3.5 + (hash(i * 3) - 0.5) * 3], i * 3); } dust.upd();
      // lembrança do homem de luz
      const mk = smr(t, K.amigo5 - 0.4, K.amigo5 + 0.2) * (1 - smr(t, K.guardou - 0.3, K.guardou + 0.2));
      mem.visible = mk > 0.01; restPose(mem); idle(mem, t, 71, 0.4); standFeet(mem, { hf }); co.updateMatrixWorld(true);
      const hp = wpos(co.userData.arms[0].hand); armIK(mem, 1, hp.clone().add(V3(0.15, 0.1, 0.25)), hp.clone().add(V3(0.8, -0.5, 1)), 1);
      mem.traverse((c) => { if (c.isMesh && c.material && c.material.isMeshBasicMaterial) { c.material.transparent = true; c.material.opacity = mk * 0.7; } }); mem.userData.glow.material.opacity = 0.2 * mk;
      // a onda dourada que abre caminho; o navio pequeno escapando ao fundo
      const hand = wpos(co.userData.arms[1].hand);
      wave(t, K.usou + 0.25, hand, 60, 1.6); ring(t, K.usou + 0.2, hand, [0, 1, 0.3], 6, 1.2);
      beamUp.userData.rays.forEach((r, i) => (r.material.opacity = 0.14 * smr(t, K.usou + 0.1, K.usou + 0.4) * (1 - smr(t, K.escapar, K.escapar + 1.0))));
      const sx = -18 + (t - a) * 2.2, q = naviaPose(sx, 60, 1.4, t, 6, 2, 0.4); nvP.position.set(sx, -1.2 + q.y, 60); nvP.rotation.set(0, 1.4, 0); nvP.rotateZ(q.roll); nvP.userData.velas.forEach((v) => v(t, 1)); nvP.userData.flag.upd(t, 1);
      sea.upd(t); dome.userData.u.uOff.value.set(t * 0.004, 0); dome.userData.u.uCov.value = 0.55 + 0.25 * smr(t, K.usou + 0.3, K.escapar);
    },
    after(t) {
      const mk = smr(t, K.amigo5 - 0.4, K.amigo5 + 0.2) * (1 - smr(t, K.guardou - 0.3, K.guardou + 0.2));
      if (mk > 0) { GU.uSat.value = lerp(GU.uSat.value, 0.45, mk); GU.uLift.value.set(lerp(GU.uLift.value.x, 0.08, mk), lerp(GU.uLift.value.y, 0.05, mk), GU.uLift.value.z); }
      GU.uFlashCol.value.set(1, 0.92, 0.7); GU.uFlash.value = 0.4 * Math.pow(1 - seg(t, K.usou + 0.2, K.usou + 0.7), 2) * (t >= K.usou + 0.2 ? 1 : 0);
    },
    cam(t) {
      const c = path2(t, [
        [a, [7, 3.5, 11], [0, 4.5, -3.5], 42],
        [K.amigo5, [4.4, 2.2, 3.6], [1.4, 2.6, -1.4], 38],
        [K.guardou + 0.4, [2.2, 5.6, 4.8], [0, 6.4, -3.0], 36],
        [K.usou + 0.3, [5.5, 2.8, 9.0], [0, 7.5, -2], 44],
        [b, [8.5, 4.0, 14], [0, 6.5, 6], 46],
      ]);
      return { ...shakeCam(c, t, impact(t, K.usou + 0.2, 0.12, 0.8)), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 7 · a fruta: mar ao amanhecer; o elefante gigante para, ergue a tromba e brada; tambores de luz no céu
addSet("s7-fruta", (g) => {
  const [a, b] = T.sc["s7-fruta"];
  const dome = skyDome(g, { top: 0x2a3a78, mid: 0xa07a8a, midY: 0.12, hor: 0xffb070, ground: 0x1a2028, sunDir: [0.15, 0.03, -1], sunCol: 0xffc070, sunI: 0.8, disk: 3.2, cov: 0.62, cloudA: 0.9, cloudLit: 0xffc8a8, cloudSh: 0x5a5a7a, cloudScale: 0.14 });
  const SC = 9, WY = 7.2;
  const sea = oceano(g, { y: WY, size: 520, segs: 150, deep: 0x0a2a44, crest: 0x2a6a8c, foam: 0xa8c8d8, env: envGold(), envI: 0.18, rough: 0.62, amp: 0.8 }); sea.m.material.metalness = 0;
  const el = elefante({ s: SC }); el.rotation.y = 0.35; g.add(el);
  const drums = Array.from({ length: 5 }, () => { const r = mesh(new THREE.TorusGeometry(1, 0.035, 8, 96), glowM(0xffd070, 0), 0, 0, 0, g); r.castShadow = false; return r; });
  const sunB = godRays(g, [12, 30, -150], [-0.08, -0.15, 1], { n: 10, len: 200, w: 10, spread: 40, opacity: 0, color: 0xffd090 });
  const motes = dustPts(260, [-60, 60, 10, 70, -60, 40], 0xffe0a0, 0.25, 0.0); g.add(motes);
  const brd = birds(g, 9, { center: [0, 60, -10], rx: 40, rz: 18, speed: 0.07, color: 0x1a1a22 });
  const stopT = K.zunesha - 0.4, V = 0.55;
  const dist = (t) => V * (Math.min(t, stopT) - a) + V * 0.5 * smr(t, stopT, stopT + 0.9) * 0.9;
  return {
    bg: 0x5a6a8a, fogExp: 0.0026, fogCol: 0xd8a890, dome,
    look: { exposure: 1.05, bloom: 0.6, bloomT: 0.8, vig: 0.42, sat: 1.12, con: 1.06, lift: [0.02, 0.01, 0.03] },
    sun: { dir: [0.3, 0.35, -1], col: 0xffc080, I: 2.4, c: [0, 15, 0], r: 45 }, hemi: { sky: 0x9ab0e0, ground: 0x2a3a48, I: 0.7 }, fill: { col: 0xffd8b0, I: 0.5, dir: [-0.4, 0.3, 1] }, rim: { col: 0xffd0a0, str: 0.6 },
    update(t) {
      const ergue = act(t, K.zunesha - 0.2, K.zunesha + 0.7, 0.15, 0.06) * (1 - 0.3 * smr(t, K.voltou + 0.8, b));
      elefanteAnda(el, dist(t), t, { from: [-8, 0, -10], step: 1.0, ergue: clamp(ergue) });
      // tambores da libertação: anéis que pulsam no céu na batida
      const dk = smr(t, K.despertou - 0.3, K.despertou + 0.2);
      drums.forEach((r, i) => { const beat = [0, 0.22, 0.9, 1.12, 1.8][i], k = ((t - K.despertou - beat) % 2.4 + 2.4) % 2.4 / 1.3; r.visible = dk > 0.01 && k < 1; if (!r.visible) return; r.position.set(0, 46, -60); r.lookAt(0, 20, 40); r.scale.setScalar(4 + 26 * E.out(k)); r.material.opacity = (1 - k) * 0.7 * dk; });
      const sk = smr(t, K.voltou - 0.2, K.voltou + 0.8);
      dome.userData.u.uSunI.value = 0.8 + 1.4 * sk; dome.userData.u.uCov.value = 0.62 + 0.2 * sk;
      sunB.userData.rays.forEach((r, i) => (r.material.opacity = 0.09 * sk * (0.8 + 0.2 * Math.sin(t + i))));
      motes.material.opacity = 0.8 * sk; floatDust(motes, t, 2, 0.12);
      sea.upd(t); brd(t); dome.userData.u.uOff.value.set(t * 0.003, 0);
    },
    after(t) { GU.uFlashCol.value.set(1, 0.92, 0.7); GU.uFlash.value = 0.3 * Math.pow(1 - seg(t, K.voltou, K.voltou + 0.6), 2) * (t >= K.voltou ? 1 : 0); },
    cam(t) {
      el.updateMatrixWorld(true); const hp = wpos(el.userData.head);
      const c = path2(t, [
        [a, [hp.x + 46, WY + 5, hp.z + 70], [hp.x - 6, hp.y - 8, hp.z - 6], 40],
        [K.zunesha - 0.2, [hp.x + 38, WY + 3.5, hp.z + 58], [hp.x - 4, hp.y - 2, hp.z - 4], 42],
        [K.voltou, [hp.x + 30, WY + 8, hp.z + 66], [hp.x - 6, hp.y + 6, hp.z - 14], 44],
        [b, [hp.x + 18, WY + 26, hp.z + 86], [hp.x - 8, hp.y + 2, hp.z - 30], 44],
      ]);
      return { ...shakeCam(c, t, impact(t, K.zunesha, 0.25, 1.0)), near: 0.1 };
    },
  };
});

// ---------------------------------------------------------------- 8 · não é o Joy Boy: salão escuro com trono vazio e lua vermelha; o jovem pirata se levanta sorrindo
addSet("s8-imu", (g) => {
  const [a, b] = T.sc["s8-imu"];
  const mm = texMarmore([26, 24, 30], [90, 70, 80]);
  const fl = mesh(new THREE.PlaneGeometry(30, 50), new THREE.MeshStandardMaterial({ map: rep(mm.map, 4, 6), roughness: 0.12, metalness: 0.25, envMap: envNoite(), envMapIntensity: 0.5 }), 0, 0, -12, g); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
  const colM = SM(0x1a1820, { roughness: 0.35, metalness: 0.3 }); [-5, 5].forEach((x) => { for (let i = 0; i < 6; i++) coluna(g, x, -2 - i * 5, 12, 0.7, { mat: colM, cap: GOLDM() }); });
  mesh(box(30, 0.6, 50), SM(0x0c0a10), 0, 14.5, -12, g);
  // janela redonda com a lua vermelha e o trono vazio no alto dos degraus
  const win = grp(g, 0, 9, -34); mesh(new THREE.TorusGeometry(6, 0.4, 10, 64), GOLDM(), 0, 0, 0, win);
  for (let i = 0; i < 8; i++) { const a_ = (i / 8) * Math.PI; mesh(box(0.15, 12, 0.2), SM(0x1a1418), 0, 0, 0.1, win).rotation.z = a_; }
  const skyW = mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshBasicMaterial({ color: 0x3a0a10 }), 0, 0, -0.3, win);
  const moonM = new THREE.MeshBasicMaterial({ color: 0xff2a2a }); const moon = mesh(new THREE.CircleGeometry(2.6, 48), moonM, 0.8, 0.6, -0.25, win); const moonG = glowSprite(0xff2a2a, 12, 0.35); moonG.position.set(0.8, 0.6, -0.1); win.add(moonG);
  mesh(box(30, 30, 0.6), SM(0x0c0a10), 0, 9, -34.6, g);
  for (let i = 0; i < 6; i++) mesh(box(9 - i * 0.6, 0.35, 1.2), SM(0x1a1820, { roughness: 0.3 }), 0, 0.17 + i * 0.35, -24 - i * 1.1, g);
  const th = grp(g, 0, 2.1, -30.5); const thM = SM(0x2a0a10, { roughness: 0.5 }), gm = GOLDM();
  mesh(box(1.8, 0.4, 1.4), thM, 0, 0.6, 0, th); mesh(box(1.8, 4.2, 0.35), thM, 0, 2.8, -0.55, th); [-0.85, 0.85].forEach((x) => { mesh(box(0.3, 1.0, 1.4), thM, x, 1.1, 0, th); mesh(new THREE.ConeGeometry(0.18, 0.7, 6), gm, x, 5.2, -0.55, th); }); mesh(new THREE.ConeGeometry(0.3, 1.1, 6), gm, 0, 5.4, -0.55, th);
  const redL = new THREE.PointLight(0xff2030, 30, 50, 1.4); redL.position.set(0, 9, -30); g.add(redL);
  const rays = godRays(g, [0, 13, -33], [0, -0.45, 1], { n: 10, len: 40, w: 3, spread: 7, opacity: 0.1, color: 0xff4040 });
  const mist = mistLayers(g, { y: 0.15, opacity: 0.22, color: 0x4a1a2a, size: 60, n: 2 });
  const gold = flowPts(160, 0xffd070, 0.06); g.add(gold.pts);
  // o jovem pirata: começa caído (de joelhos), ouve a voz, se levanta, limpa a boca, sorri e fecha o punho
  const jv = jovem(); jv.position.set(0, 0, -6); jv.rotation.y = Math.PI; g.add(jv);
  return {
    bg: 0x050306, fogExp: 0.03, fogCol: 0x12060a,
    look: { exposure: 1.2, bloom: 0.75, bloomT: 0.7, vig: 0.62, sat: 1.1, con: 1.12 },
    sun: { dir: [0, 0.45, -1], col: 0xff4050, I: 1.0, c: [0, 1, -8], r: 14 }, hemi: { sky: 0x3a1a2a, ground: 0x050306, I: 0.42 }, fill: { col: 0x6a4a8a, I: 0.35, dir: [0.4, 0.3, 1] }, rim: { col: 0xff5060, str: 0.8 }, hand: 0.01,
    update(t) {
      const gk = smr(t, K.herdou - 0.3, K.historia7);      // vermelho vira dourado
      moonM.color.setRGB(1, 0.16 + 0.66 * gk, 0.16 + 0.2 * gk); moonG.material.color.setRGB(1, 0.16 + 0.6 * gk, 0.16 + 0.2 * gk); skyW.material.color.setRGB(0.23 + 0.5 * gk, 0.04 + 0.35 * gk, 0.06 + 0.1 * gk);
      redL.color.setRGB(1, 0.13 + 0.62 * gk, 0.19 + 0.1 * gk); redL.intensity = 30 + 10 * Math.sin(t * 1.3) + 25 * smr(t, K.imu - 0.2, K.imu + 0.3) * (1 - smr(t, K.disse7 + 0.6, K.herdou));
      rays.userData.rays.forEach((r, i) => { r.material.color.setRGB(1, 0.25 + 0.6 * gk, 0.25 + 0.2 * gk); r.material.opacity = 0.09 + 0.03 * Math.sin(t + i); });
      restPose(jv); idle(jv, t, 61, 0.6);
      const up = act(t, K.herdou - 0.3, K.herdou + 0.9, 0.18, 0.05);
      if (up < 0.98) { kneelPose(jv, 1 - clamp(up)); pose(jv, { spine: [0.35 * (1 - clamp(up)), 0, 0], head: [0.4 * (1 - clamp(up)) - 0.2 * smr(t, K.imu, K.imu + 0.4) * (1 - clamp(up)), 0, 0] }); }
      if (up > 0.6) standFeet(jv, { hf: () => 0 });
      const wipe = act(t, K.vontade - 0.2, K.vontade + 0.5, 0.15, 0.05) * (1 - smr(t, K.vontade + 0.6, K.vontade + 1.0));
      if (wipe > 0.01) { jv.updateMatrixWorld(true); const m_ = wpos(jv.userData.head).add(V3(0.08, 0.05, -0.12)); armIK(jv, 0, m_, m_.clone().add(V3(0.5, -0.6, 0)), clamp(wipe)); }
      const fist = act(t, K.historia7 - 0.3, K.historia7 + 0.4, 0.2, 0.08);
      if (fist > 0.01) pose(jv, { armL: [-1.3 * clamp(fist), 0, 0.3, -1.9 * clamp(fist)], handL: 1 }, clamp(fist));
      face(jv, { brow: 0.6 * smr(t, K.nao7, K.nao7 + 0.3) * (1 - gk) - 0.1 * gk, sad: 0.4 * (1 - gk), smile: 0.75 * smr(t, K.vontade, K.historia7), angry: 0.2 * smr(t, K.historia7 - 0.2, K.historia7 + 0.3), lid: 0.92 });
      clothWind(jv, t, 0.6 + 1.6 * gk, [0, 0, 0.05 * gk]); hairPush(jv, 0, 0.6 * gk);
      gold.pts.material.opacity = 0.8 * gk; for (let i = 0; i < 160; i++) { const ph = (t * 0.25 + hash(i * 1.3)) % 1; gold.pos.set([(hash(i) - 0.5) * 8, ph * 6, -6 + (hash(i * 3) - 0.5) * 6 - ph * 6], i * 3); } gold.upd();
      mist(t);
    },
    cam(t) {
      const c = path2(t, [
        [a, [0.6, 1.4, 6.5], [0, 2.4, -24], 40],
        [K.imu - 0.2, [1.0, 2.2, -1.0], [0, 3.6, -26], 38],
        [K.herdou - 1.3, [2.6, 1.6, -4.8], [0, 1.0, -6.6], 40],
        [K.herdou - 0.2, [1.6, 1.15, -8.5], [0, 1.0, -6], 38],
        [K.historia7, [0.9, 1.5, -8.4], [0, 1.45, -6], 34],
        [b, [0.6, 1.55, -8.0], [0, 1.5, -6], 32],
      ]);
      return { ...shakeCam(c, t, impact(t, K.imu, 0.06, 1.0)), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 9 · pergunta: o jovem pirata na proa ao nascer do sol; a bandeira do sol que ri ao vento
addSet("s9-pergunta", (g) => {
  const [a, b] = T.sc["s9-pergunta"];
  const dome = skyDome(g, { top: 0x2a5aa0, mid: 0xd8a888, midY: 0.12, hor: 0xffc890, ground: 0x1a2a38, sunDir: [-0.55, 0.12, -1], sunCol: 0xffc070, sunI: 1.0, disk: 2.8, cov: 0.5, cloudA: 0.75, cloudLit: 0xffe0c0, cloudSh: 0x7a7a9a });
  const sea = oceano(g, { size: 360, segs: 140, deep: 0x0e3a52, crest: 0x5a9ab0, foam: 0xf4f8f8, amp: 0.7 });
  [[-60, -140, 28], [40, -170, 36], [110, -120, 20]].forEach(([x, z, s_], i) => { const il = mesh(sph(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), SM(0x3a5a3a), x, -1, z, g); il.scale.set(s_, s_ * 0.35, s_ * 0.6); });
  const nv = navio(g, { L: 8, W: 2.6, D: 1.3, mastros: [[0.0, 7.0]], bw: 1.6, bh: 1.1, casco: 0x6a4024, faixa: 0x2a5ab8 });
  const jv = jovem(); nv.add(jv); jv.position.set(0, nv.userData.deckY + 0.06, 2.6); jv.rotation.y = 0;
  const ghost = holoify(capitao(), holoMat(0xffc860, { alpha: 0 })); ghost.scale.setScalar(7); ghost.position.set(-6, -2, -34); g.add(ghost);
  const brd = birds(g, 7, { center: [0, 12, 0], rx: 14, rz: 8, speed: 0.13 });
  const SA = -0.3, shipAt = (t) => { const d = (t - a) * 1.2, x = Math.sin(SA) * d, z = Math.cos(SA) * d, q = naviaPose(x, z, SA, t, 8, 2.6, 0.7); return { x, z, ...q }; };
  return {
    bg: 0x8aa0c0, fogExp: 0.004, fogCol: 0xe8c8a8, dome,
    look: { exposure: 1.05, bloom: 0.55, bloomT: 0.84, vig: 0.4, sat: 1.14, con: 1.05, lift: [0.02, 0.01, 0.03] },
    sun: { dir: [-0.55, 0.4, -1], col: 0xffc890, I: 2.6, c: [0, 2, 0], r: 10 }, hemi: { sky: 0xa8c0e8, ground: 0x2a3a48, I: 0.75 }, fill: { col: 0xffe0c0, I: 0.6, dir: [0.4, 0.3, 1] }, rim: { col: 0xffe0b0, str: 0.6 },
    update(t) {
      const s = shipAt(t); nv.position.set(s.x, s.y - 0.25, s.z); nv.rotation.set(0, SA, 0); nv.rotateX(-s.pitch); nv.rotateZ(s.roll);
      nv.userData.velas.forEach((v) => v(t, 1.1)); nv.userData.flag.upd(t, 1.4);
      restPose(jv); idle(jv, t, 61, 0.6); standFeetOn(jv, nv, { y: nv.userData.deckY + 0.06, spread: 1.3 });
      pose(jv, { spine: [s.pitch * 0.5, 0, -s.roll * 0.8], chest: [0, 0, -s.roll * 0.3] });
      const look = smr(t, K.voce - 0.2, K.voce + 0.6), point = act(t, K.terminar - 0.2, K.terminar + 0.6, 0.18, 0.06) * (1 - smr(t, K.comenta + 0.6, b));
      if (point > 0.01) pose(jv, { armR: [-1.55 * clamp(point), 0.25, -0.15, -0.15], handR: 0.3 }, clamp(point));
      const wave = act(t, K.comenta - 0.1, K.comenta + 0.5, 0.15, 0.06) * (1 - smr(t, b - 0.6, b));
      if (wave > 0.01) pose(jv, { armL: [-2.5 * clamp(wave), 0, 0.45 + 0.25 * Math.sin((t - K.comenta) * 9) * clamp(wave), -0.6 * clamp(wave)], handL: 0 }, clamp(wave));
      nv.updateMatrixWorld(true); const camP = nv.localToWorld(V3(0.6, 2.4, 6.4));
      lookAtW(jv, camP, look * (1 - smr(t, K.terminar - 0.3, K.terminar + 0.2)) + smr(t, K.comenta - 0.3, K.comenta + 0.2), 1.2);
      face(jv, { smile: 0.55 + 0.35 * look, brow: 0.2 * look, open: 0.15 * smr(t, K.comenta - 0.2, K.comenta + 0.3), lid: 0.92 });
      const lag = mola(t, (tt) => { const q = shipAt(tt); return [q.x, q.y + Math.sin(q.pitch) * 2.6, q.z]; }, { k: 30, c: 4 }), L = lagLocal(jv, lag);
      clothWind(jv, t, 1.6, [L[0], 0, -0.05]); hairMola(jv, L, 6);
      const gk = smr(t, K.riu - 0.3, K.riu + 0.4) * (1 - smr(t, K.cedo + 0.4, K.voce - 0.2)); ghost.visible = gk > 0.01;
      if (ghost.visible) { restPose(ghost); idle(ghost, t, 41, 0.5); riso(ghost, t, 1, K.riu); ghost.traverse((c) => { if (c.isMesh && c.material.uniforms && c.material.uniforms.uA) c.material.uniforms.uA.value = gk * 0.5; }); }
      sea.upd(t); brd(t); dome.userData.u.uOff.value.set(t * 0.004, 0);
    },
    cam(t) {
      const s = shipAt(t); nv.updateMatrixWorld(true);
      const P = (x, y, z) => nv.localToWorld(V3(x, y, z)).toArray();
      const c = path2(t, [
        [a, P(3.0, 2.2, 9.5), P(0, 1.6, 2.2), 40],
        [Math.max(K.riu + 0.6, a + 1.2), P(4.5, 3.4, 10.0), P(-1.5, 7.5, -8), 46],
        [K.voce - 0.2, P(1.2, 2.3, 6.6), P(0, 1.75, 2.6), 36],
        [b, P(0.6, 2.3, 5.8), P(0, 1.8, 2.6), 32],
      ]);
      return { ...c, near: 0.05 };
    },
  };
});
