// ================================================================ vídeo: Giorno · cenas 5–9
// cortina de veludo que ondula
function cortina(g, x, y, z, w, h, rotY = 0, col = 0x8a1020) {
  const geo = new THREE.PlaneGeometry(w, h, 8, 10); geo.translate(0, -h / 2, 0);
  deform(geo, (v) => { v.z += Math.sin(v.x * 9) * 0.06; });
  const m = mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.75, side: THREE.DoubleSide }), x, y, z, g); m.rotation.y = rotY; m.userData.base = Float32Array.from(geo.attributes.position.array); m.frustumCulled = false;
  return (t, k = 1) => { const a = geo.attributes.position, b = m.userData.base; for (let i = 0; i < a.count; i++) { const yy = b[i * 3 + 1], xx = b[i * 3], q = -yy / h; a.setZ(i, b[i * 3 + 2] + Math.sin(t * 1.3 + xx * 4 + yy * 0.8) * 0.05 * q * k); } a.needsUpdate = true; geo.computeVertexNormals(); };
}
// lustre dourado com velas
function lustre(g, x, y, z) {
  const l = grp(g, x, y, z), gm = GOLDM();
  mesh(cyl(0.02, 0.02, 2.2, 6), gm, 0, 1.1, 0, l);
  [[0.9, 0], [0.55, 0.45]].forEach(([r, dy]) => { const ring = mesh(new THREE.TorusGeometry(r, 0.035, 8, 40), gm, 0, dy, 0, l); ring.rotation.x = Math.PI / 2; });
  const flames = [];
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = i % 2 ? 0.55 : 0.9, yy = i % 2 ? 0.45 : 0; mesh(cyl(0.025, 0.025, 0.14, 6), SM(0xf4ead8), Math.cos(a) * r, yy + 0.08, Math.sin(a) * r, l); const f = glowSprite(0xffb050, 0.16, 0.9); f.position.set(Math.cos(a) * r, yy + 0.2, Math.sin(a) * r); l.add(f); flames.push(f); }
  mesh(sph(0.12, 12, 10), gm, 0, -0.15, 0, l);
  const L = new THREE.PointLight(0xffb060, 3.5, 12, 1.6); L.position.y = 0.1; l.add(L);
  return (t, k = 1) => { flames.forEach((f, i) => { f.material.opacity = (0.75 + 0.25 * noise1(t * 7 + i * 3)) * k; f.scale.setScalar(0.13 + 0.05 * noise1(t * 5 + i)); }); L.intensity = 3.2 * k * (0.9 + 0.1 * noise1(t * 6)); };
}
// baú dourado com tampa (dobradiça atrás)
function bau(g, x, y, z) {
  const c = grp(g, x, y, z), wood = SM(0x6a1a14, { roughness: 0.6 }), gm = GOLDM();
  mesh(box(0.92, 0.42, 0.56), wood, 0, 0.21, 0, c); [-0.32, 0.32].forEach((xx) => mesh(box(0.06, 0.44, 0.58), gm, xx, 0.21, 0, c)); mesh(box(0.96, 0.05, 0.6), gm, 0, 0.02, 0, c);
  const lid = grp(c, 0, 0.42, -0.28); mesh(box(0.92, 0.13, 0.56), wood, 0, 0.065, 0.28, lid); [-0.32, 0.32].forEach((xx) => mesh(box(0.06, 0.15, 0.58), gm, xx, 0.065, 0.28, lid));
  mesh(box(0.12, 0.12, 0.04), gm, 0, 0.36, 0.29, c);
  return { c, lid };
}

// ---------------------------------------------------------------- 5 · keys: salão italiano de mármore; o espírito abre o baú e as keys voam
addSet("s5-keys", (g) => {
  const [a, b] = T.sc["s5-keys"];
  const dome = skyDome(g, { top: 0x2a3070, mid: 0x9a6a7a, midY: 0.14, hor: 0xffa060, sunDir: [0.35, 0.1, -1], sunCol: 0xffa850, sunI: 0.35, cov: 0.5, cloudA: 0.7, cloudLit: 0xffc0a0, cloudSh: 0x6a4a5a });
  const hf = () => 0, WH = 9;
  const mT = canvasTex(512, 512, (c, w, h) => { const n = 4; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { c.fillStyle = (x + y) % 2 ? "#26382e" : "#ece4d6"; c.fillRect(x * w / n, y * h / n, w / n, h / n); }
    for (let i = 0; i < 70; i++) { c.strokeStyle = `rgba(${hash(i) > 0.5 ? "255,255,255" : "70,60,50"},${0.08 + hash(i * 3) * 0.12})`; c.lineWidth = 1 + hash(i * 5) * 2; c.beginPath(); let x = hash(i * 7) * w, y = hash(i * 11) * h; c.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (hash(i * 13 + k) - 0.5) * 80; y += (hash(i * 17 + k) - 0.5) * 80; c.lineTo(x, y); } c.stroke(); }
    c.strokeStyle = "rgba(210,176,96,.85)"; c.lineWidth = 3; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * w / 4, 0); c.lineTo(i * w / 4, h); c.stroke(); c.beginPath(); c.moveTo(0, i * h / 4); c.lineTo(w, i * h / 4); c.stroke(); } });
  const fl = mesh(new THREE.PlaneGeometry(12, 20), new THREE.MeshStandardMaterial({ map: rep(mT, 3, 5), roughness: 0.16, metalness: 0.1, envMap: envGold(), envMapIntensity: 0.3 }), 0, 0, -1, g); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
  // paredes laterais de mármore com pilastras, parede do fundo com três janelas em arco, teto em caixotões
  const mm = texMarmore([232, 222, 206], [160, 140, 120]);
  [-6, 6].forEach((x) => { const wm = mesh(box(0.4, WH, 20), SM(0xffffff, { map: rep(mm.map.clone(), 4, 2), roughness: 0.4 }), x, WH / 2, -1, g); wm.material.map.needsUpdate = true; for (let i = 0; i < 6; i++) mesh(box(0.25, WH, 0.7), SM(0xd8c8b0), x - Math.sign(x) * 0.3, WH / 2, -9 + i * 3.4, g); });
  const wb = bayGeo(4, WH, 2.3, 6.4, 0.6), wbm = SM(0xe8dcc8, { roughness: 0.6 });
  [-4, 0, 4].forEach((x) => mesh(wb, wbm, x, 0, -10.6, g));
  const curt = [-4, 0, 4].flatMap((x) => [cortina(g, x - 1.35, 7.4, -10.15, 0.9, 6.6, 0), cortina(g, x + 1.35, 7.4, -10.15, 0.9, 6.6, 0)]);
  const cof = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#c8b088"; c.fillRect(0, 0, w, h); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const g_ = c.createLinearGradient(x * 128, y * 128, x * 128 + 128, y * 128 + 128); g_.addColorStop(0, "#8a6a40"); g_.addColorStop(1, "#5a4024"); c.fillStyle = g_; c.fillRect(x * 128 + 16, y * 128 + 16, 96, 96); c.fillStyle = "#d8b060"; c.beginPath(); c.arc(x * 128 + 64, y * 128 + 64, 10, 0, 7); c.fill(); } });
  const ce = mesh(new THREE.PlaneGeometry(12, 20), SM(0xffffff, { map: rep(cof, 6, 10) }), 0, WH, -1, g); ce.rotation.x = Math.PI / 2;
  [-6, -3, 0, 3].forEach((z) => [-3.7, 3.7].forEach((x) => coluna(g, x, z, 6.6, 0.38, { mat: SM(0xf2ece2, { roughness: 0.35 }), cap: GOLDM() })));
  // quadro com moldura dourada e vasos
  const art = canvasTex(256, 192, (c, w, h) => { const g_ = c.createLinearGradient(0, 0, w, h); g_.addColorStop(0, "#3a2a4a"); g_.addColorStop(0.5, "#c8743a"); g_.addColorStop(1, "#f2c870"); c.fillStyle = g_; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(255,240,200,.8)"; c.beginPath(); c.arc(w * 0.62, h * 0.38, 24, 0, 7); c.fill(); c.fillStyle = "rgba(40,30,40,.6)"; c.beginPath(); c.moveTo(0, h); c.lineTo(w * 0.3, h * 0.55); c.lineTo(w * 0.55, h * 0.75); c.lineTo(w * 0.8, h * 0.5); c.lineTo(w, h); c.fill(); });
  [-5.75, 5.75].forEach((x, i) => { const pf = grp(g, x, 3.4, -4.6); pf.rotation.y = -Math.sign(x) * Math.PI / 2; mesh(box(2.6, 2.0, 0.08), GOLDM(), 0, 0, 0, pf); mesh(new THREE.PlaneGeometry(2.3, 1.7), SM(0xffffff, { map: art }), 0, 0, 0.05, pf); });
  // pedestal e baú
  mesh(box(1.3, 0.85, 0.9), SM(0xf0e8dc, { map: mm.map, roughness: 0.3 }), 0, 0.425, -2.5, g); mesh(box(1.45, 0.08, 1.05), GOLDM(), 0, 0.87, -2.5, g);
  const ch = bau(g, 0, 0.91, -2.5);
  const cardTex = canvasTex(256, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#1a1a3a"); gr.addColorStop(1, "#c8962a"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,230,160,.9)"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#fff"; c.font = "700 54px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("KEY", w / 2, h / 2 - 12); c.font = "700 22px 'Space Mono', monospace"; c.fillText("ALEATÓRIA", w / 2, h / 2 + 34); }, { redraw: true });
  const cards = []; for (let i = 0; i < 12; i++) cards.push(mesh(box(0.32, 0.2, 0.01), new THREE.MeshStandardMaterial({ map: cardTex, emissive: 0xffffff, emissiveMap: cardTex, emissiveIntensity: 0.4, roughness: 0.4 }), 0, 0, 0, g));
  const cg = glowSprite(0xffc070, 1.8, 0); cg.position.set(0, 1.5, -2.5); g.add(cg);
  const coins = flowPts(80, 0xffd060, 0.04); g.add(coins.pts);
  const lus = lustre(g, 0, 6.2, -2.5);
  const rays = godRays(g, [0, 8, -12], [0, -0.42, 1], { n: 9, len: 16, w: 1.6, spread: 9, opacity: 0.1, color: 0xffb070 });
  const motes = dustPts(220, [-4, 4, 0.3, 6, -9, 3], 0xffe0b0, 0.025, 0.7); g.add(motes);
  // o espírito caminha até o baú (pés plantados), se inclina e abre a tampa com as duas mãos
  const sp = espDourado({ emisI: 0.5 }); sp.scale.setScalar(1.08); g.add(sp); sp.userData.glow.material.opacity = 0.08;
  const Z0 = -0.45, Z1 = -1.62, DW = Z0 - Z1, LW = gaitFit(DW, 0.55 * 1.08) / 1.08;
  const hinge = V3(0, 0.91 + 0.42, -2.5 - 0.28);
  const lidAng = (t) => -1.9 * E.outBack(smr(t, K.rapidinho + 0.9, K.steam - 0.1)) * 0.92;
  return {
    bg: 0x1a1210, fog: [14, 60],
    look: { exposure: 1.12, bloom: 0.7, bloomT: 0.72, vig: 0.5, sat: 1.1, con: 1.06, lift: [0.02, 0.01, 0.0] },
    sun: { dir: [0, 0.38, -1], col: 0xffa860, I: 2.4, c: [0, 1, -3], r: 9 }, hemi: { sky: 0xd8b890, ground: 0x4a3020, I: 0.6 }, fill: { col: 0xffd0a0, I: 0.4, dir: [0.3, 0.5, 1] }, rim: { col: 0xffd090, str: 0.6 }, hand: 0.008,
    update(t) {
      const dim = smr(t, K.agora - 0.2, K.agora + 0.5);
      // caminhada até o baú
      const wk = E.inOut(smr(t, a + 0.05, K.rapidinho + 0.75));
      restPose(sp); idle(sp, t, 2, 0.4);
      gait(sp, DW * wk, { from: [0, 0, Z0], ang: Math.PI, hf, step: LW, arms: 0.6 });
      const lean = smr(t, K.rapidinho + 0.5, K.rapidinho + 1.0) * (1 - smr(t, K.steam + 0.6, K.bio));
      pose(sp, { spine: [0.42 * lean, 0, 0], chest: [0.18 * lean, 0, 0], neck: [0.15 * lean, 0, 0] });
      sp.updateMatrixWorld(true);
      // mãos na borda da tampa (a tampa gira na dobradiça; as mãos acompanham)
      const la = lidAng(t), edge = (sx) => V3(sx, hinge.y + Math.sin(-la) * 0.56 * 1 + 0.13 * Math.cos(-la), hinge.z + Math.cos(-la) * 0.56);
      ch.lid.rotation.x = la;
      const grab = smr(t, K.rapidinho + 0.55, K.rapidinho + 0.95) * (1 - smr(t, K.steam + 0.2, K.steam + 0.8));
      if (grab > 0.01) { armIK(sp, 0, edge(0.3), V3(0.9, 1.0, -1.2), grab); armIK(sp, 1, edge(-0.3), V3(-0.9, 1.0, -1.2), grab); pose(sp, { handR: 0.55, handL: 0.55 }); }
      const after = smr(t, K.steam + 0.4, K.bio);
      pose(sp, { armR: [-0.5, 0, -0.5, -0.6], armL: [-0.5, 0, 0.5, -0.6], handR: 0.1, handL: 0.1 }, after * (1 - dim));
      // "agora, a parte mais bizarra": a cabeça vira de repente para a câmera
      const snap = smr(t, K.agora + 0.05, K.agora + 0.3);
      if (snap > 0) { lookAtW(sp, V3(0.75, 1.9, 0.6), snap, 2.75); }
      sp.userData.eyeM.color.setScalar(1 + 3 * snap);
      // keys saindo do baú e girando
      const up = smr(t, K.steam - 0.4, K.bio + 0.2), lt = t - a;
      cards.forEach((cd, i) => { const ang = (i / 12) * Math.PI * 2 + lt * 0.7, r = 0.1 + up * (0.45 + (i % 3) * 0.12); cd.position.set(Math.cos(ang) * r * 1.3, 1.3 + up * (0.45 + Math.sin(lt * 2 + i) * 0.08 + (i % 4) * 0.12), -2.5 + Math.sin(ang) * r * 0.7); cd.rotation.set(-0.3 + Math.sin(lt + i) * 0.2, -ang + Math.PI / 2, Math.sin(lt * 1.3 + i) * 0.2); cd.visible = up > 0.01; });
      cg.material.opacity = 0.45 * up * (1 - dim * 0.5);
      for (let i = 0; i < 80; i++) { const ph = (t * 0.5 + hash(i * 1.7)) % 1, an = hash(i) * 6.28 + t; coins.pos.set([Math.cos(an) * (0.2 + ph * 0.9), 1.35 + ph * 1.4 * up, -2.5 + Math.sin(an) * (0.2 + ph * 0.6)], i * 3); } coins.pts.material.opacity = up * 0.8; coins.upd();
      curt.forEach((f) => f(t, 1)); lus(t, 1 - 0.75 * dim); floatDust(motes, t, 0.2, 0.15);
      rays.userData.rays.forEach((r, i) => (r.material.opacity = (0.08 + 0.03 * Math.sin(t * 0.7 + i)) * (1 - 0.8 * dim)));
    },
    after(t) {
      const dim = smr(t, K.agora - 0.2, K.agora + 0.5);
      if (dim > 0) { GU.uGain.value.set(lerp(1, 0.62, dim), lerp(1, 0.55, dim), lerp(1, 0.95, dim)); GU.uSat.value = lerp(GU.uSat.value, 0.9, dim); GU.uVig.value = lerp(GU.uVig.value, 0.72, dim); }
    },
    cam(t) {
      return { ...path(t, [
        [a, [0.9, 2.15, 4.0], [0, 1.5, -2.4], 40],
        [K.rapidinho + 0.8, [1.7, 1.9, 1.6], [0, 1.35, -2.2], 38],
        [K.steam, [1.2, 1.65, 0.3], [0, 1.5, -2.4], 36],
        [K.bio, [0.85, 1.6, -0.4], [0, 1.7, -2.5], 36],
        [K.agora, [0.75, 1.85, 0.4], [0, 1.85, -1.6], 36],
        [b, [0.6, 1.9, 0.0], [0, 1.95, -1.6], 32],
      ]), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 6 · age sozinho: praça com fonte; o espírito anda em volta do garoto por conta própria
// pombo simples (corpo, cabeça, bico, asas) que bica o chão e levanta voo
function pombo(g, seed) {
  const p = grp(g), body = SM(0x8a8a96, { roughness: 0.8 }), dark = SM(0x4a4a56);
  const b = mesh(sph(0.09, 12, 10), body, 0, 0.11, 0, p); b.scale.set(0.8, 0.8, 1.3);
  const head = grp(p, 0, 0.17, 0.09); mesh(sph(0.045, 10, 8), SM(0x5a6a72), 0, 0, 0, head); mesh(new THREE.ConeGeometry(0.012, 0.04, 6), SM(0xe0b090), 0, -0.005, 0.05, head).rotation.x = Math.PI / 2;
  mesh(box(0.08, 0.015, 0.1), dark, 0, 0.12, -0.14, p);
  const wg = (k) => { const w = grp(p, k * 0.05, 0.14, 0); const m = mesh(new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshStandardMaterial({ color: 0x7a7a88, side: THREE.DoubleSide }), k * 0.08, 0, -0.02, w); m.rotation.x = -Math.PI / 2; return w; };
  p.userData = { head, w: [wg(1), wg(-1)], seed };
  return p;
}
function fonteAgua(g) {
  const f = grp(g), st = SM(0xe6dcc8, { roughness: 0.6 });
  mesh(lathe([[2.3, 0], [2.7, 0], [2.75, 0.62], [2.55, 0.66], [2.3, 0.6], [2.28, 0.1]], 64), st, 0, 0, 0, f);
  const wT = texPair(256, (u, v) => fbm2(u * 6, v * 6, 4, 6), (u, v, h) => mixc([40, 90, 110], [90, 150, 160], h), 2.5);
  rep(wT.normalMap, 2, 2); rep(wT.map, 2, 2);
  const water = mesh(new THREE.CircleGeometry(2.3, 48), new THREE.MeshStandardMaterial({ map: wT.map, normalMap: wT.normalMap, roughness: 0.08, metalness: 0.3, envMap: envGold(), envMapIntensity: 0.6, transparent: true, opacity: 0.92 }), 0, 0.45, 0, f); water.rotation.x = -Math.PI / 2; water.receiveShadow = true;
  mesh(cyl(0.35, 0.5, 1.6, 20), st, 0, 0.8, 0, f);
  mesh(lathe([[0.001, 0], [0.9, 0.1], [1.1, 0.35], [1.05, 0.4], [0.85, 0.2], [0.001, 0.2]], 40), st, 0, 1.6, 0, f);
  mesh(cyl(0.12, 0.16, 0.7, 12), st, 0, 2.2, 0, f);
  const sun_ = grp(f, 0, 2.75, 0); const gm = GOLDM(); mesh(cyl(0.22, 0.22, 0.06, 24), gm, 0, 0, 0, sun_).rotation.x = Math.PI / 2; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = mesh(new THREE.ConeGeometry(0.05, 0.22, 4), gm, Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0, sun_); r.rotation.z = a - Math.PI / 2; }
  const jets = flowPts(420, 0xd8f0ff, 0.05, NORM); jets.pts.material.opacity = 0.75; f.add(jets.pts);
  return { f, water, sun_, upd(t, rev = 0) {
    for (let i = 0; i < 420; i++) {
      const lane = i % 6, ph0 = (t * 0.9 + hash(i * 1.7)) % 1, ph = rev > 0.5 ? 1 - ph0 : ph0;
      if (lane < 4) { const an = (lane / 4) * Math.PI * 2 + 0.4 + (hash(i) - 0.5) * 0.2, r = 1.05 + ph * 1.0; jets.pos.set([Math.cos(an) * r, 1.95 - ph * ph * 1.5, Math.sin(an) * r], i * 3); }
      else { const an = hash(i) * 6.28, r = (hash(i * 3) * 0.12) * (1 + ph); jets.pos.set([Math.cos(an) * r, 2.3 + Math.sin(ph * Math.PI) * 1.0, Math.sin(an) * r], i * 3); }
    }
    jets.upd(); wT.normalMap.offset.set(t * 0.03 * (rev > 0.5 ? -1 : 1), t * 0.02 * (rev > 0.5 ? -1 : 1));
  } };
}
addSet("s6-sozinho", (g) => {
  const [a, b] = T.sc["s6-sozinho"];
  const dome = skyDome(g, { top: 0x3a6ab8, mid: 0x8ab0d8, midY: 0.14, hor: 0xf2d8b0, sunDir: [-0.6, 0.38, -0.7], sunCol: 0xfff0d0, sunI: 0.9, cov: 0.45, cloudA: 0.85, cloudLit: 0xffffff, cloudSh: 0x9aa8c0 });
  const hf = () => 0;
  chao(g, 80, 80, texCalcada([168, 150, 128], [126, 112, 98]), 34, 34);
  for (let i = 0; i < 18; i++) { const an = (i / 18) * Math.PI * 2, r = 15 + hash(i * 3) * 2.5; palazzo(g, Math.sin(an) * r, Math.cos(an) * r, { w: 7 + hash(i) * 3, d: 7, floors: 3 + Math.floor(hash(i * 5) * 3), seed: i + 11, rotY: an + Math.PI }); }
  cupula(g, -10, -34, 7, { y: 0 }); campanario(g, 14, -30, 2.6, 22);
  const fo = fonteAgua(g);
  // mesas de café com guarda-sóis, postes de luz
  const umb = canvasTex(256, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#f2ece0" : "#2a6a4a"; c.fillRect(i * w / 8, 0, w / 8, h); } });
  [[-6.5, 4.5], [-8.5, 1.2], [7.5, -4.5]].forEach(([x, z], i) => { const tb = grp(g, x, 0, z); mesh(cyl(0.45, 0.45, 0.04, 20), SM(0xf2ece0), 0, 0.74, 0, tb); mesh(cyl(0.03, 0.05, 0.74, 8), SM(0x2a2a2a), 0, 0.37, 0, tb); mesh(cyl(0.025, 0.025, 2.3, 6), SM(0xd8d0c0), 0, 1.15, 0, tb); mesh(new THREE.ConeGeometry(1.4, 0.5, 8, 1, true), SM(0xffffff, { map: umb, side: THREE.DoubleSide }), 0, 2.2, 0, tb);
    [0, Math.PI].forEach((r_) => { const chr = grp(tb, Math.sin(r_) * 0.75, 0, Math.cos(r_) * 0.75); chr.rotation.y = r_ + Math.PI; mesh(box(0.4, 0.04, 0.4), SM(0x2a2a2a), 0, 0.45, 0, chr); mesh(box(0.4, 0.4, 0.04), SM(0x2a2a2a), 0, 0.66, -0.19, chr); }); });
  [[-6, -6], [6.5, -6.5], [-7, 6.5], [9, 6.5]].forEach(([x, z]) => { const lp = grp(g, x, 0, z); mesh(cyl(0.06, 0.09, 3.6, 8), SM(0x1e1e22, { metalness: 0.5 }), 0, 1.8, 0, lp); mesh(box(0.3, 0.42, 0.3), SM(0x1e1e22), 0, 3.8, 0, lp); mesh(box(0.22, 0.3, 0.22), SM(0xfff4d8, { emissive: 0xffd8a0, emissiveIntensity: 0.3 }), 0, 3.78, 0, lp); });
  const pigeons = Array.from({ length: 11 }, (_, i) => { const p = pombo(g, i); return { p, x: 4.2 + (hash(i * 3) - 0.5) * 6, z: 1.6 + (hash(i * 7) - 0.5) * 5, r: hash(i * 5) * 6.28 }; });
  const brd = birds(g, 6, { center: [0, 18, -6], rx: 16, rz: 8, speed: 0.09 });
  const motes = dustPts(140, [-5, 6, 0.3, 4, -3, 6], 0xfff0d0, 0.025, 0.6); g.add(motes);
  // personagens: o garoto parado; o espírito anda em volta dele sozinho (arco com pés plantados), mexe na fonte e vai embora
  const gi = garoto(); g.add(gi); const GP = V3(4.4, 0, 1.0), GA = -0.9;
  const sp = espDourado({ emisI: 0.45 }); sp.scale.setScalar(1.08); g.add(sp); sp.userData.glow.material.opacity = 0.07;
  const R = 1.4, phiF = Math.atan2(-GP.x, -GP.z) - 0.25, aStart = GA + Math.PI, tot = (((phiF - aStart) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), arc = arcPath(GP.x, GP.z, R, aStart, 1), sc = 1.08, DARC = tot * R, LA = gaitFit(DARC, 0.6 * sc) / sc;
  // caminho completo: o arco em volta do garoto e depois uma curva suave indo embora (tabela integrada do rumo)
  const endP = arc(DARC), awayAng = Math.atan2(3, -9), dH = Math.atan2(Math.sin(awayAng - endP[2]), Math.cos(awayAng - endP[2]));
  const TB = [[endP[0], endP[1], endP[2]]]; for (let i = 1; i <= 160; i++) { const s_ = i * 0.05, h = endP[2] + dH * sm(clamp(s_ / 1.6)), q = TB[i - 1]; TB.push([q[0] + Math.sin(h) * 0.05, q[1] + Math.cos(h) * 0.05, h]); }
  const fullPath = (d) => { if (d <= DARC) return arc(d); const f = clamp((d - DARC) / 0.05, 0, 159.999), i = Math.floor(f), u = f - i, A = TB[i], B = TB[i + 1]; return [lerp(A[0], B[0], u), lerp(A[1], B[1], u), lerp(A[2], B[2], u)]; };
  const walkD = (t) => DARC * E.inOut(smr(t, K.sozinho - 0.4, K.faz - 0.25)) + 3.6 * smr(t, K.dono + 0.4, b + 0.8);
  // pombos: levantam voo quando o espírito passa perto (instante calculado de antemão, sem estado)
  pigeons.forEach((pg) => { pg.tf = Infinity; for (let tt = a; tt < b; tt += 0.05) { const q = fullPath(walkD(tt)); if (Math.hypot(q[0] - pg.x, q[1] - pg.z) < 1.5) { pg.tf = tt; break; } } if (Math.hypot(pg.x - GP.x, pg.z - GP.z) < 0.7) pg.x += 1.2; });
  return {
    bg: 0x9ab0c8, fogExp: 0.006, fogCol: 0xc8d0d8, dome,
    look: { exposure: 1.12, bloom: 0.45, bloomT: 0.86, vig: 0.36, sat: 1.12, con: 1.05, lift: [0.01, 0.01, 0.02] },
    sun: { dir: [-0.45, 0.85, 0.3], col: 0xfff0d8, I: 2.7, c: [3, 0, 1], r: 10 }, hemi: { sky: 0xbcd4ff, ground: 0x8a7458, I: 0.85 }, fill: { col: 0xffe0c0, I: 0.3, dir: [0.6, 0.3, 0.6] }, rim: { col: 0xfff2dd, str: 0.45 },
    update(t) {
      // o espírito: dá a volta (passos plantados), para, ergue a mão para a fonte, depois sai andando sem obedecer
      restPose(sp); idle(sp, t, 2, 0.4);
      const wd = walkD(t);
      gait(sp, wd, { path: fullPath, hf, step: wd <= DARC + 1e-6 ? LA : LA, arms: 0.6 });
      const reach = act(t, K.faz - 0.2, K.faz + 0.5, 0.2, 0.06) * (1 - smr(t, K.seja5 + 0.3, K.dono));
      const fwd = V3(-endP[0], 0, -endP[1]).normalize(), hT = V3(endP[0], 1.75, endP[1]).addScaledVector(fwd, 0.8);
      if (reach > 0.01) { armIK(sp, 0, hT, hT.clone().add(V3(0, -1, 0)).addScaledVector(fwd, -0.5), clamp(reach)); armIK(sp, 1, hT.clone().add(V3(0, -0.05, 0)), hT.clone().add(V3(0, -1, 0)).addScaledVector(fwd, -0.5), clamp(reach) * 0.8); pose(sp, { handR: 0, handL: 0.1 }); }
      lookAtW(sp, reach > 0.05 ? V3(0, 1.4, 0) : V3(GP.x, 1.5, GP.z), 0.6);
      // o garoto: parado, segue o espírito com o olhar; estranha a fonte voltando; tenta mandar (mão) e desiste
      restPose(gi); gi.position.copy(GP); gi.rotation.set(0, GA, 0); idle(gi, t, 11, 0.7); standFeet(gi, { hf });
      const sp_ = sp.position.clone().add(V3(0, 1.7, 0));
      const lookF = smr(t, K.faz, K.faz + 0.4) * (1 - smr(t, K.seja5, K.seja5 + 0.4));
      lookAtW(gi, lookF > 0.5 ? V3(0, 1.2, 0) : sp_, 0.9);
      const cmd = act(t, K.dono - 0.35, K.dono + 0.35, 0.25, 0.06) * (1 - smr(t, K.completo - 0.2, K.completo + 0.5));
      if (cmd > 0.01) { const tgt = sp_.clone().lerp(GP.clone().add(V3(0, 1.5, 0)), 0.45); armIK(gi, 0, tgt, V3(GP.x + 0.6, 0.9, GP.z + 0.4), clamp(cmd)); pose(gi, { handR: 0.05 }); }
      const shrug = act(t, K.completo - 0.1, K.completo + 0.6, 0.1, 0.1) * (1 - smr(t, b - 0.6, b));
      pose(gi, { armR: [0, 0, -0.35, -1.4], armL: [0, 0, 0.35, -1.4], chest: [0.05, 0, 0] }, clamp(shrug) * 0.6);
      face(gi, { brow: 0.75 * smr(t, K.sabe - 0.3, K.sabe + 0.3) * (1 - smr(t, K.dono - 0.4, K.dono)) + 0.3 * smr(t, K.completo, K.completo + 0.5), open: 0.3 * lookF, smile: 0.12 * smr(t, K.completo + 0.3, b), sad: 0.25 * smr(t, K.completo, K.completo + 0.5), lid: 0.92 });
      clothWind(gi, t, 0.6); hairPush(gi, 0, 0, 0);
      // fonte (volta ao contrário quando o espírito mexe), pombos que bicam e levantam voo quando ele passa
      fo.upd(t, smr(t, K.faz + 0.1, K.faz + 0.3) * (1 - smr(t, K.seja5 + 0.3, K.seja5 + 0.5)));
      pigeons.forEach((pg, i) => {
        const p = pg.p, u = p.userData, k2 = smr(t, pg.tf, pg.tf + 2.4), fly = t >= pg.tf;
        p.position.set(pg.x + Math.sin(pg.r) * k2 * 7, k2 * k2 * 5.5, pg.z + Math.cos(pg.r) * k2 * 7); p.rotation.set(-0.35 * clamp(k2 * 4), pg.r, 0);
        const peck = Math.max(0, Math.sin(t * 5 + i * 2));
        u.head.rotation.x = fly ? -0.2 : peck * 0.9; u.head.position.y = 0.17 - (fly ? 0 : peck * 0.06);
        const fl_ = fly ? Math.sin(t * 24 + i) * 1.0 : 0.05; u.w[0].rotation.z = fl_; u.w[1].rotation.z = -fl_;
      });
      brd(t); floatDust(motes, t, 0.3, 0.2); dome.userData.u.uOff.value.set(t * 0.005, 0);
    },
    cam(t) {
      const F = V3(Math.sin(GA), 0, Math.cos(GA));
      const front = (d, h, side = 0) => [GP.x + F.x * d + F.z * side, h, GP.z + F.z * d - F.x * side];
      return { ...path(t, [
        [a, front(6.5, 2.4, 1.0), [GP.x - 0.4, 1.3, GP.z - 0.6], 40],
        [K.sozinho, front(4.4, 1.7, 0.6), [GP.x, 1.35, GP.z], 38],
        [K.sabe, front(2.7, 1.62, -0.2), [GP.x, 1.5, GP.z], 34],
        [K.faz + 0.2, [GP.x + 2.4, 1.8, GP.z + 2.4], [0.4, 1.25, -0.1], 38],
        [K.dono + 0.15, front(3.5, 1.6, 0.5), [GP.x - 0.3, 1.5, GP.z - 0.1], 36],
        [b, front(4.2, 1.7, 0.9), [GP.x - 0.6, 1.45, GP.z - 0.4], 38],
      ]), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 7 · o destino: rio à noite; ele morre e volta, sempre com corte para o branco antes de qualquer impacto
function archGeo(w, h, aw, ah, d) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-aw / 2, 0); s.absellipse(0, 0, aw / 2, ah, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 24 }); geo.translate(0, 0, -d / 2); return geo;
}
function poste(g, x, y, z, I = 2.4, light = true) {
  const p = grp(g, x, y, z), iron = SM(0x18161a, { metalness: 0.6, roughness: 0.45 });
  mesh(cyl(0.05, 0.08, 3.4, 8), iron, 0, 1.7, 0, p); mesh(cyl(0.12, 0.14, 0.2, 8), iron, 0, 0.1, 0, p);
  mesh(new THREE.ConeGeometry(0.26, 0.2, 4), iron, 0, 3.9, 0, p).rotation.y = Math.PI / 4;
  mesh(box(0.3, 0.42, 0.3), new THREE.MeshStandardMaterial({ color: 0xffd8a0, emissive: 0xffb060, emissiveIntensity: 1.6, transparent: true, opacity: 0.85 }), 0, 3.6, 0, p);
  const gl = glowSprite(0xffb060, 1.6, 0.55); gl.position.y = 3.6; p.add(gl);
  if (light) { const L = new THREE.PointLight(0xffb060, I, 10, 1.7); L.position.y = 3.5; p.add(L); }
  return p;
}
function carro(g) {
  const c = grp(g), paint = new THREE.MeshStandardMaterial({ color: 0x1a2028, metalness: 0.7, roughness: 0.3, envMap: envGold(), envMapIntensity: 0.3 }), glass = SM(0x0a0e14, { roughness: 0.1, metalness: 0.5 });
  mesh(box(1.8, 0.62, 4.3), paint, 0, 0.62, 0, c); mesh(box(1.6, 0.55, 2.2), glass, 0, 1.18, -0.2, c); mesh(box(1.62, 0.06, 2.0), paint, 0, 1.47, -0.25, c);
  [[-0.85, 1.35], [0.85, 1.35], [-0.85, -1.35], [0.85, -1.35]].forEach(([x, z]) => mesh(cyl(0.34, 0.34, 0.24, 18), SM(0x0a0a0a), x, 0.34, z, c).rotation.z = Math.PI / 2);
  const hl = [-0.62, 0.62].map((x) => { mesh(sph(0.11, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }), x, 0.72, 2.16, c); const gl = glowSprite(0xfff4e0, 1.2, 0.9); gl.position.set(x, 0.72, 2.3); c.add(gl); return gl; });
  const SL = new THREE.SpotLight(0xfff2dc, 60, 40, 0.5, 0.6, 1.2); SL.position.set(0, 0.8, 2.2); SL.target.position.set(0, 0.2, 12); c.add(SL, SL.target);
  return { c, hl, SL };
}
// lemniscata (∞) em tubo de luz dourada
function infinito(g, a = 3) {
  const pts = []; for (let i = 0; i <= 200; i++) { const u = (i / 200) * Math.PI * 2, d = 1 + Math.sin(u) ** 2; pts.push(V3((a * Math.cos(u)) / d, (a * Math.sin(u) * Math.cos(u)) / d, 0)); }
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 300, 0.09, 8, true);
  const m = mesh(geo, glowM(0xffd070, 0), 0, 0, 0, g); m.castShadow = false;
  const halo = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 200, 0.35, 8, true), glowM(0xffa030, 0), 0, 0, 0, g); halo.castShadow = false;
  const count = geo.index.count;
  return { m, halo, set(k, draw = 1) { m.material.opacity = k; halo.material.opacity = k * 0.25; m.geometry.setDrawRange(0, Math.floor(count * clamp(draw))); halo.visible = k > 0.01; m.visible = k > 0.01; } };
}
addSet("s7-destino", (g) => {
  const [a, b] = T.sc["s7-destino"];
  const dome = skyDome(g, { top: 0x050a1e, mid: 0x101a3a, midY: 0.14, hor: 0x1e2a4a, ground: 0x04060a, sunDir: [-0.3, 0.42, -1], sunCol: 0xd8e4ff, sunI: 0, cov: 0.6, cloudA: 0.45, cloudLit: 0x5a6a90, cloudSh: 0x0a1020, stars: 1.3 });
  const moon = mesh(sph(16, 40, 30), BM(0xd8dce8, { fog: false }), -70, 120, -330, g); const mg = glowSprite(0x8a9ad8, 60, 0.12); mg.material.fog = false; moon.add(mg);
  const WY = -3, BY = 0.55;
  // rio com reflexo, muros de cais, ruas nas margens, prédios com janelas acesas
  const wT = texPair(256, (u, v) => fbm2(u * 8, v * 3, 4, 8), (u, v, h) => mixc([8, 18, 32], [20, 40, 60], h), 3.0); rep(wT.normalMap, 30, 8); rep(wT.map, 30, 8);
  const water = mesh(new THREE.PlaneGeometry(400, 15), new THREE.MeshStandardMaterial({ map: wT.map, normalMap: wT.normalMap, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.06, metalness: 0.85, envMap: envNoite(), envMapIntensity: 1.6 }), 0, WY, 0, g); water.rotation.x = -Math.PI / 2; water.castShadow = false;
  const stone = matBlocos(texTravertino(), 30, 0.6, { col: 0x9a948a });
  [-1, 1].forEach((sd) => { mesh(box(400, 3.2, 1.0), stone, 0, WY + 1.4, sd * 7.5, g); mesh(box(400, 0.25, 1.3), SM(0xb8b0a0), 0, 0.1, sd * 7.55, g); chao(g, 400, 16, texCalcada([110, 104, 98], [80, 76, 72]), 160, 6, { z: sd * 16, y: 0.0, rough: 0.6 }); });
  const city = grp(g);
  for (let i = 0; i < 26; i++) { const sd = i % 2 ? 1 : -1, x = -70 + Math.floor(i / 2) * 11 + hash(i) * 2; palazzo(city, x, sd * 29, { w: 10, d: 9, floors: 4 + Math.floor(hash(i * 3) * 3), seed: i + 60, rotY: sd > 0 ? Math.PI : 0, lit: 0.45, litI: 1.3, balc: Math.abs(x) < 30 }); }
  cupula(city, 30, -60, 10, { y: 0, lit: true }); campanario(city, -40, -58, 3.2, 28, { lit: true });
  // a ponte de pedra (um arco grande), mureta, postes; a ponte continua como rua escura
  const br = grp(g); const ag = archGeo(16, BY - WY + 0.3, 12.5, 2.9, 4.4); const arch = mesh(ag, stone, 0, WY, 0, br); arch.rotation.y = Math.PI / 2;
  mesh(box(4.4, 0.5, 80), SM(0x8a847a, { map: rep(texCalcada([120, 112, 104], [90, 86, 80]).map.clone(), 2, 36) }), 0, BY - 0.25, 30, br);
  [-2.05, 2.05].forEach((x) => { mesh(box(0.32, 1.0, 80), stone, x, BY + 0.5, 30, br); mesh(box(0.42, 0.1, 80), SM(0xb8b0a0), x, BY + 1.03, 30, br); });
  const posts = [-6, 0, 6, 12, 18, 24].map((z, i) => poste(br, (i % 2 ? 1 : -1) * 2.05, BY + 1.05, z, 7, i < 4));
  const streaks = posts.slice(0, 4).map((p) => { const s_ = new THREE.Sprite(new THREE.SpriteMaterial({ map: rayTex, color: 0xffa050, transparent: true, opacity: 0.2, depthWrite: false, blending: ADD })); s_.scale.set(0.35, 5.5, 1); s_.position.set(p.position.x * 1.6, WY - 2.6, p.position.z); g.add(s_); return s_; });
  const mist = mistLayers(g, { y: WY + 0.3, opacity: 0.18, color: 0x3a4a6a, size: 160, n: 2 });
  // beco/rua estreita (outro lugar) para o segundo "jeito": prédios dos dois lados e o carro que vem
  const AX = 60;
  for (let i = 0; i < 12; i++) { const sd = i % 2 ? 1 : -1; palazzo(g, AX - 6 + Math.floor(i / 2) * 9.5, sd * 7.6, { w: 9, d: 8, floors: 4, seed: i + 90, rotY: sd > 0 ? Math.PI : 0, lit: 0.3, litI: 1.0, balc: true }); }
  chao(g, 90, 7.2, texCalcada([96, 90, 84], [70, 66, 62]), 45, 4, { x: AX + 25, y: 0.01, rough: 0.5 });
  const ap = [poste(g, AX - 2, 0, -3.2, 2.0), poste(g, AX + 14, 0, 3.2, 2.0, false)];
  const car = carro(g); car.c.rotation.y = -Math.PI / 2;
  // ∞ no céu, fantasmas do ciclo, o espírito gigante ao longe e a porta de luz que nunca chega
  const inf = infinito(g, 4.2); [inf.m, inf.halo].forEach((m) => m.position.set(0, 8.5, -10));
  const ghosts = fantasmas(g, () => chefe(), 5, 0xff6a6a);
  const giant = holoify(espDourado(), holoMat(0xffc040, { alpha: 0 })); giant.scale.setScalar(10); giant.position.set(7, -5, 70); giant.rotation.y = Math.PI; g.add(giant);
  const door = grp(g); const dm = glowM(0xfff2d0, 0); mesh(new THREE.PlaneGeometry(1.3, 2.5), dm, 0, 1.25, 0, door); [-0.75, 0.75].forEach((x) => mesh(box(0.18, 2.8, 0.25), stone, x, 1.4, 0, door)); mesh(box(1.7, 0.25, 0.25), stone, 0, 2.85, 0, door); const dh = glowSprite(0xfff0c8, 5, 0); dh.position.y = 1.3; door.add(dh); const dL = new THREE.PointLight(0xfff0d0, 0, 18, 1.4); dL.position.set(0, 1.7, -1); door.add(dL); door.rotation.y = Math.PI;
  // o chefe
  const bo = chefe(); g.add(bo);
  const P0 = V3(1.35, BY, -0.4), A0 = -Math.PI / 2;
  const m1 = K.morre6, v1 = K.volta6, m2 = K.morre6b, o2 = K.outro, v2 = K.volta6b, se = K.sempre, di = K.disse;
  const fallK = (t) => smr(t, m1 - 0.55, m1 + 0.55);
  const RUN0 = V3(0.3, BY, -3.5), runD = (t) => 4.4 * Math.max(0, t - di - 0.2) - 1.4 * Math.max(0, t - di - 0.2) ** 2 * 0 ;
  const flashes = [[m1 + 0.45, v1 - 0.05], [m2 - 0.05, m2 + 0.12], [o2 + 0.5, v2 - 0.05]];
  const seg_ = (t) => (t < v1 - 0.05 ? 1 : t < m2 + 0.12 ? 2 : t < v2 - 0.05 ? 3 : t < se - 0.3 ? 4 : t < di ? 5 : 6);
  return {
    bg: 0x04060c, fogExp: 0.009, fogCol: 0x141c38, dome,
    look: { exposure: 1.3, bloom: 0.75, bloomT: 0.72, bloomR: 0.7, vig: 0.5, sat: 1.02, con: 1.08, lift: [0.01, 0.015, 0.05] },
    sun: { dir: [-0.3, 0.6, -0.8], col: 0xa8bcff, I: 1.1, c: [0, 0, 0], r: 16 }, hemi: { sky: 0x3a4a7a, ground: 0x12141c, I: 0.7 }, fill: { col: 0x8a9ad8, I: 0.95, dir: [0.6, 0.4, 0.7] }, rim: { col: 0xb8c8ff, str: 0.8 },
    update(t) {
      const sg = seg_(t);
      restPose(bo); idle(bo, t, 21, 1.0); const u = bo.userData;
      if (sg === 1) {
        // na ponte, paranoico; recua até a mureta e cai por cima dela
        const k = fallK(t), back = smr(t, m1 - 1.1, m1 - 0.5);
        const base = P0.clone().add(V3(0.45 * back, 0, 0));
        bo.position.copy(base); bo.rotation.set(0, A0, 0);
        if (k <= 0) { standFeet(bo, { hf: () => BY }); lookAtW(bo, V3(-4 + Math.sin(t * 0.9) * 5, 1.5, Math.cos(t * 0.7) * 4), 0.8); }
        else { // gira em volta da borda da mureta e despenca
          const piv = V3(2.05, BY + 0.95, base.z), ang = 1.9 * E.in(clamp(k * 1.25));
          bo.position.set(piv.x + Math.sin(ang) * 0.6 + Math.max(0, k - 0.6) * 1.2, piv.y - 0.95 + Math.cos(ang) * 0 - Math.max(0, k - 0.55) ** 2 * 9, piv.z);
          bo.rotation.set(0, A0, 0); bo.rotateX(-ang); pose(bo, { armR: [-2.2, 0, -0.9, -0.4], armL: [-2.2, 0, 0.9, -0.4], legR: [-0.5, 0, 0, 0.6], legL: [-0.2, 0, 0, 0.3], handR: 0, handL: 0 }, clamp(k * 2));
        }
        face(bo, { brow: 0.8, open: 0.3 + 0.4 * clamp(k * 3), sad: 0.4, lid: 1 });
      } else if (sg === 2 || sg === 4) {
        // volta: de pé (ou de joelhos), ofegante, apalpando o próprio peito
        bo.position.copy(P0); bo.rotation.set(0, A0, 0);
        const breath = Math.sin(t * 9) * 0.5 + 0.5;
        if (sg === 2) { standFeet(bo, { hf: () => BY }); pose(bo, { spine: [0.18 + 0.06 * breath, 0, 0], neck: [0.1, 0, 0] }); }
        else { kneelPose(bo, 1); pose(bo, { spine: [0.3 + 0.06 * breath, 0, 0], neck: [-0.15, 0, 0], head: [-0.3, 0, 0] }); }
        bo.updateMatrixWorld(true); const ch = wpos(u.chest).add(V3(-0.16, 0.14, 0));
        armIK(bo, 0, ch.clone().add(V3(0, 0, 0.07)), ch.clone().add(V3(0.3, -0.5, 0.5)), 0.95); armIK(bo, 1, ch.clone().add(V3(0, -0.08, -0.07)), ch.clone().add(V3(0.3, -0.5, -0.5)), 0.95);
        lookAtW(bo, V3(-3 + Math.sin(t * 2.3) * 4, 1.4 + Math.sin(t * 1.7) * 0.4, Math.cos(t * 1.9) * 3), 0.9);
        face(bo, { brow: 1, open: 0.45 + 0.2 * breath, sad: 0.5, lid: 1 });
      } else if (sg === 3) {
        // no beco: anda, ouve o carro, vira e protege os olhos dos faróis
        const turn = smr(t, o2 - 0.55, o2 - 0.1), wk = 1.0 * Math.max(0, Math.min(t, o2 - 0.5) - m2);
        gait(bo, wk, { from: [AX + 3, 0, 0.6], ang: -Math.PI / 2, hf: () => 0 });
        if (turn > 0) { const fp = bo.position.clone(); bo.rotation.y = -Math.PI / 2 + Math.PI * 0.85 * turn; bo.updateMatrixWorld(true); standFeet(bo, { hf: () => 0 }); bo.position.copy(fp); }
        const shield = act(t, o2 - 0.15, o2 + 0.35, 0.2, 0.05);
        if (shield > 0) pose(bo, { armR: [-1.9 * clamp(shield), 0.3, -0.5, -1.9 * clamp(shield)], armL: [-1.2 * clamp(shield), 0, 0.4, -1.5], spine: [-0.15 * clamp(shield), 0, 0], handR: 0 });
        face(bo, { brow: 1, open: 0.5 * turn, sad: 0.3, lid: 1 - 0.4 * clamp(shield) });
      } else if (sg === 5) {
        bo.position.copy(P0); bo.rotation.set(0, A0, 0); kneelPose(bo, 1); pose(bo, { spine: [0.35, 0, 0], head: [-0.5 * smr(t, se - 0.2, se + 0.6), 0, 0], armR: [-0.4, 0, -0.3, -0.5], armL: [-0.4, 0, 0.3, -0.5] });
        face(bo, { brow: 1, open: 0.5, sad: 0.6, lid: 1 });
      } else {
        // corre para a porta de luz que se afasta na mesma velocidade
        const d = runD(t); const w = smr(t, di, di + 0.45);
        gait(bo, d, { from: [RUN0.x, BY, RUN0.z], ang: 0, run: w, hf: () => BY, lean: 0.05 * w });
        if (d < 0.05) { standFeet(bo, { hf: () => BY }); }
        face(bo, { angry: 0.2, brow: 0.9, open: 0.5, sad: 0.4, lid: 1 }); hairPush(bo, 0, -1.4 * w); clothWind(bo, t, 0.6 + 2.2 * w); chefeFlaps(bo, t, 1 + 2 * w);
      }
      if (sg !== 6) { clothWind(bo, t, 0.7); chefeFlaps(bo, t, 1); }
      // carro: vem pelo beco com os faróis acesos (corte para o branco antes de chegar)
      const cx = AX + 46 - 30 * E.in(smr(t, o2 - 0.9, o2 + 0.55)) - 6 * smr(t, o2 + 0.2, o2 + 0.55);
      car.c.position.set(cx, 0, 0.9); car.c.visible = sg === 3; car.SL.intensity = sg === 3 ? 60 + 140 * smr(t, o2 - 0.5, o2 + 0.5) : 0;
      car.hl.forEach((h) => { h.material.opacity = 0.9; h.scale.setScalar(1.2 + 4 * smr(t, o2 - 0.3, o2 + 0.55)); });
      // ∞, fantasmas do ciclo, gigante e porta
      const ik = smr(t, se - 0.2, se + 0.8) * (1 - 0.6 * smr(t, di + 0.5, b));
      inf.set(ik, smr(t, se - 0.2, se + 1.0)); inf.m.rotation.z = Math.sin(t * 0.4) * 0.05;
      const gk = smr(t, se, se + 0.6) * (1 - smr(t, di - 0.3, di + 0.2));
      ghosts.forEach((p, i) => { p.visible = gk > 0.01; if (!p.visible) return; restPose(p); const an = (i / 5) * Math.PI * 2 + (t - se) * 0.5; p.position.set(P0.x + Math.sin(an) * 1.6 - 0.6, BY, P0.z + Math.cos(an) * 1.6); p.rotation.set(0, an + Math.PI, 0);
        if (i % 3 === 0) kneelPose(p, 1); else if (i % 3 === 1) pose(p, { armR: [-1.9, 0.3, -0.5, -1.9], armL: [-1.2, 0, 0.4, -1.5], spine: [-0.15, 0, 0] }); else { p.rotateX(-0.5); pose(p, { armR: [-2.2, 0, -0.9, -0.4], armL: [-2.2, 0, 0.9, -0.4] }); }
        p.userData.holo.uniforms.uA.value = gk * (0.35 + 0.1 * Math.sin(t * 3 + i)); });
      const gs = smr(t, di - 0.2, di + 1.0); giant.visible = gs > 0.01; giant.traverse((c) => { if (c.isMesh && c.material.uniforms && c.material.uniforms.uA) c.material.uniforms.uA.value = gs * 0.55; }); giant.position.z = 95 + runD(t) * 0.0;
      const dz = 9.5 + runD(t) * 0.985; door.position.set(0, BY, RUN0.z + dz); dm.opacity = sg === 6 ? 0.32 : 0; dh.material.opacity = sg === 6 ? 0.28 + 0.08 * Math.sin(t * 4) : 0; dL.intensity = sg === 6 ? 2.5 : 0;
      water.material.normalMap.offset.set(t * 0.02, t * 0.004); streaks.forEach((s_, i) => (s_.material.opacity = 0.32 + 0.12 * noise1(t * 3 + i * 2))); mist(t); dome.userData.u.uOff.value.set(t * 0.002, 0);
    },
    after(t) {
      GU.uFlashCol.value.set(1, 1, 1);
      let f = 0; flashes.forEach(([x, y]) => { if (t >= x - 0.12 && t <= y + 0.35) f = Math.max(f, Math.min(smr(t, x - 0.12, x), 1 - smr(t, y, y + 0.35))); });
      GU.uFlash.value = f;
      const rk = (t > v1 - 0.05 && t < v1 + 0.5) || (t > v2 - 0.05 && t < v2 + 0.5) ? 1 - smr(t, t > v2 - 0.1 ? v2 : v1, (t > v2 - 0.1 ? v2 : v1) + 0.5) : 0;
      lookRebobina(rk);
      if (t > di) { GU.uLift.value.set(0.03, 0.02, 0.0); }
    },
    cam(t) {
      const sg = seg_(t);
      if (sg === 1) return { ...path(t, [[a, [-17, 1.6, 9.5], [0.5, 0.2, 0], 40], [K.pior, [-7.0, 2.0, 4.6], [1.0, 1.3, -0.3], 36], [m1 - 0.6, [4.6, 2.7, 3.4], [1.8, 1.4, -0.4], 38], [m1 + 0.5, [5.0, 2.5, 3.6], [2.6, 0.2, -0.4], 40]]), near: 0.05 };
      if (sg === 2) return { ...path(t, [[v1 - 0.1, [-1.0, 1.75, 1.3], [1.3, 1.55, -0.3], 34], [m2 + 0.15, [-0.7, 1.7, 1.0], [1.3, 1.5, -0.35], 32]]), near: 0.05 };
      if (sg === 3) return { ...path(t, [[m2 + 0.1, [AX - 1.6, 1.65, -0.9], [AX + 3, 1.4, 0.4], 36], [o2 + 0.5, [AX - 1.0, 1.55, -0.7], [AX + 3, 1.45, 0.5], 34]]), near: 0.05 };
      if (sg === 4) return { ...path(t, [[v2 - 0.1, [-0.9, 1.0, 0.8], [1.3, 1.1, -0.4], 36], [se - 0.3, [-1.2, 1.1, 1.0], [1.3, 1.1, -0.4], 36]]), near: 0.05 };
      if (sg === 5) return { ...path(t, [[se - 0.3, [-1.6, 1.4, 2.0], [1.0, 1.2, -0.4], 36], [se + 1.0, [-4.5, 3.6, 7.5], [0.3, 4.5, -6], 42], [di, [-5.5, 4.2, 6.5], [0, 6.5, -9], 44]]), near: 0.05 };
      const d = runD(t), zb = RUN0.z + d;
      return { pos: [-0.6, 1.9, zb - 3.4], look: [0.25, 1.4, zb + 2.5], fov: 38, near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 8 · ninguém conseguiu: escadaria monumental ao pôr do sol; o chefe sobe correndo (pés em cada degrau) e é rebobinado
addSet("s8-ninguem", (g) => {
  const [a, b] = T.sc["s8-ninguem"];
  const dome = skyDome(g, { top: 0x2a3878, mid: 0xa06a7a, midY: 0.13, hor: 0xffa458, ground: 0x2a1c18, sunDir: [0.12, 0.08, 1], sunCol: 0xffb060, sunI: 1.15, disk: 2.6, cov: 0.5, cloudA: 0.85, cloudLit: 0xffc0a0, cloudSh: 0x5a4a6a, cloudScale: 0.15 });
  // degraus: três lances de 11 degraus e dois patamares (sobe para -z)
  const SR = 0.4, SH = 0.18, F = [[0, 0], [6.4, 1.98], [12.8, 3.96]], TOPD = 17.2, TOPY = 5.94;
  const stairY = (z) => { const d = -z; if (d < 0) return 0; if (d >= TOPD) return TOPY; for (let f = 2; f >= 0; f--) { const [d0, y0] = F[f]; if (d >= d0) { const k = d - d0; return k < 4.4 ? y0 + (Math.floor(k / SR) + 1) * SH : y0 + 11 * SH; } } return 0; };
  const bodyY = (z) => { const d = -z; if (d < 0) return 0; if (d >= TOPD) return TOPY; for (let f = 2; f >= 0; f--) { const [d0, y0] = F[f]; if (d >= d0) { const k = d - d0; return k < 4.4 ? y0 + Math.min(11 * SH, (k / 4.4) * 11 * SH + 0.09) : y0 + 11 * SH; } } return 0; };
  const hfS = (x, z) => stairY(z), hbS = (x, z) => bodyY(z);
  const tv = texTravertino(), stM = matBlocos(tv, 2.5, 0.12, { col: 0xf2e2c8 }), WD = 10;
  F.forEach(([d0, y0]) => { for (let i = 0; i < 11; i++) { const z = -(d0 + (i + 0.5) * SR), h = y0 + (i + 1) * SH; mesh(box(WD, h, SR + 0.02), stM, 0, h / 2, z, g); } if (d0 < 12) mesh(box(WD, y0 + 11 * SH, 2.0), stM, 0, (y0 + 11 * SH) / 2, -(d0 + 4.4 + 1.0), g); });
  mesh(box(30, TOPY, 20), matBlocos(tv, 5, 1.2), 0, TOPY / 2, -(TOPD + 10), g);
  chao(g, 140, 120, texCalcada([150, 136, 118], [116, 104, 92]), 60, 50, { z: 55, y: 0.0 });
  // balaustradas que acompanham a inclinação
  const balG = lathe([[0.001, 0], [0.06, 0], [0.06, 0.05], [0.04, 0.1], [0.065, 0.36], [0.035, 0.64], [0.05, 0.7], [0.05, 0.76], [0.001, 0.76]], 10), bal = [];
  [-WD / 2 - 0.15, WD / 2 + 0.15].forEach((x) => { for (let d = 0.2; d < TOPD; d += 0.33) bal.push([x, stairY(-d), -d]); });
  const balI = new THREE.InstancedMesh(balG, SM(0xf2e6d0), bal.length); bal.forEach(([x, y, z], i) => { const M4 = new THREE.Matrix4(); M4.setPosition(x, y, z); balI.setMatrixAt(i, M4); }); balI.castShadow = true; g.add(balI);
  [-WD / 2 - 0.15, WD / 2 + 0.15].forEach((x) => F.forEach(([d0, y0]) => { const r = mesh(box(0.22, 0.1, 4.75), SM(0xf2e6d0), x, y0 + 1.0 + 1.0, -(d0 + 2.2), g); r.rotation.x = Math.atan2(11 * SH, 4.4); }));
  // vasos de flores nos patamares
  const potM = SM(0xe8dcc4), flM = [0xe84a6a, 0xf2c040, 0xffffff, 0xd85a9a].map((c) => SM(c, { roughness: 0.7 }));
  [[-4.2, 1.98, -5.4], [4.2, 1.98, -5.4], [-4.2, 3.96, -11.8], [4.2, 3.96, -11.8], [-4.4, TOPY, -18.4], [4.4, TOPY, -18.4]].forEach(([x, y, z], i) => { const p = grp(g, x, y, z); mesh(lathe([[0.001, 0], [0.25, 0], [0.42, 0.55], [0.48, 0.62], [0.001, 0.62]], 16), potM, 0, 0, 0, p); for (let k = 0; k < 14; k++) { const an = hash(k + i * 7) * 6.28, r = hash(k * 3 + i) * 0.35; mesh(sph(0.07, 8, 6), flM[(k + i) % 4], Math.cos(an) * r, 0.68 + hash(k * 5) * 0.2, Math.sin(an) * r, p); } mesh(sph(0.36, 12, 8), SM(0x3a6a2a), 0, 0.66, 0, p).scale.y = 0.45; });
  // igreja no alto: fachada, colunas, rosácea, frontão e duas torres
  const ch = grp(g, 0, TOPY, -27); const fm = matBlocos(tv, 3, 3, { col: 0xf6e6cc });
  mesh(box(16, 13, 1.2), fm, 0, 6.5, 0, ch); mesh(box(6, 6.4, 1.3), BM(0x1a120c), 0, 3.2, 0.1, ch);
  const ro = canvasTex(256, 256, (c, w) => { const r = w / 2; c.fillStyle = "#2a1a30"; c.fillRect(0, 0, w, w); for (let i = 0; i < 12; i++) { const an = (i / 12) * Math.PI * 2; c.fillStyle = i % 2 ? "#e8a040" : "#4a6ad8"; c.beginPath(); c.moveTo(r, r); c.arc(r, r, r * 0.95, an, an + Math.PI / 6); c.fill(); } c.strokeStyle = "#f2e2c0"; c.lineWidth = 6; c.beginPath(); c.arc(r, r, r * 0.95, 0, 7); c.stroke(); c.beginPath(); c.arc(r, r, r * 0.3, 0, 7); c.stroke(); });
  mesh(new THREE.CircleGeometry(1.7, 40), new THREE.MeshStandardMaterial({ map: ro, emissive: 0xffffff, emissiveMap: ro, emissiveIntensity: 0.4 }), 0, 9.4, 0.62, ch);
  [-5, -3.2, 3.2, 5].forEach((x) => coluna(ch, x, 0.9, 6.4, 0.32, { mat: SM(0xf2e6d0) }));
  const pd = new THREE.Shape(); pd.moveTo(-8.2, 0); pd.lineTo(8.2, 0); pd.lineTo(0, 3.2); pd.lineTo(-8.2, 0); mesh(new THREE.ExtrudeGeometry(pd, { depth: 1.2, bevelEnabled: false }), fm, 0, 13, -0.6, ch);
  [-9.5, 9.5].forEach((x) => campanario(ch, x, -0.2, 3.4, 19, { col: 0xf0dcc0 })); mesh(sph(0.3, 10, 8), GOLDM(), 0, 16.5, 0, ch);
  // cidade lá embaixo (para o plano final), cúpulas e campanários ao pôr do sol
  for (let i = 0; i < 22; i++) { const x = (hash(i * 3) - 0.5) * 120, z = 25 + hash(i * 7) * 90; if (Math.abs(x) < 9 && z < 40) continue; palazzo(g, x, z, { y: -8 + hash(i) * 4, w: 10, d: 9, floors: 4 + Math.floor(hash(i * 5) * 3), seed: i + 120, rotY: Math.PI, balc: false }); }
  cupula(g, -30, 80, 10, { y: -4 }); cupula(g, 40, 110, 13, { y: -6, dome: 0x8a9a9a }); campanario(g, 18, 70, 3, 24); campanario(g, -52, 100, 3.4, 30);
  const brd = birds(g, 9, { center: [0, 18, 10], rx: 22, rz: 10, speed: 0.08 });
  const rays = godRays(g, [0, 16, 40], [0, -0.35, -1], { n: 9, len: 60, w: 5, spread: 16, opacity: 0.07, color: 0xffb070 });
  // personagens
  const gi = garoto(); g.add(gi); const GP = V3(0, TOPY, -18.4);
  const sp = evoluir(espDourado({ emisI: 0.55 })); sp.scale.setScalar(1.15); g.add(sp); sp.userData.glow.material.opacity = 0.1;
  const bo = chefe(); g.add(bo); const gh = fantasmas(g, () => chefe(), 3, 0xffc040);
  const onda = ondaDourada(g), ring = aneis(g, 3, 0xffd070);
  const Z0 = 4.0, tR = K.atacar7 - 1.4, cN = K.cancelado, V = 4.2;
  const runDist = (t) => V * Math.max(0, Math.min(t, cN) - tR);
  const DMAX = runDist(cN), back = (t) => DMAX * (1 - E.inOut(seg(t, cN + 0.35, cN + 1.6)));
  const dist = (t) => (t < cN + 0.35 ? runDist(t) : back(t));
  function bossAt(p, d, t, o = {}) {
    restPose(p); idle(p, t, 21, 0.6);
    const w = smr(d, 0, 0.6);
    gait(p, d, { from: [0.5, 0, Z0], ang: Math.PI, run: w, hf: hfS, hb: hbS, lean: 0.12 * w, step: 0.55 + 0.33 * w });
    if (d < 0.02) standFeet(p, { hf: hfS });
    if (!o.ghost) { clothWind(p, t, 0.7 + 2.0 * w); chefeFlaps(p, t, 1 + 2 * w); hairPush(p, 0, -1.2 * w); }
    face(p, { angry: 0.85, brow: -0.4, open: 0.3, lid: 1 });
  }
  return {
    bg: 0x2a1c22, fogExp: 0.0045, fogCol: 0xd09078, dome,
    look: { exposure: 1.08, bloom: 0.6, bloomT: 0.8, vig: 0.42, sat: 1.12, con: 1.06, lift: [0.02, 0.0, 0.03] },
    sun: { dir: [0.12, 0.3, 1], col: 0xffb070, I: 2.7, c: [0, 3, -8], r: 16 }, hemi: { sky: 0x8a90c8, ground: 0x7a5034, I: 0.62 }, fill: { col: 0x7a8ac8, I: 0.45, dir: [-0.3, 0.4, -1] }, rim: { col: 0xffc890, str: 0.6 },
    update(t) {
      restPose(gi); gi.position.copy(GP); gi.rotation.set(0, 0, 0); idle(gi, t, 11, 0.6); standFeet(gi, { hf: () => TOPY }); face(gi, { smile: 0.12, lid: 0.85 }); clothWind(gi, t, 1.3); lookAtW(gi, bo.position.clone().add(V3(0, 1.4, 0)), 0.5);
      restPose(sp); sp.position.set(GP.x + 0.9, TOPY + 0.2 + Math.sin(t * 1.3) * 0.04, GP.z - 0.7); sp.rotation.set(0, 0, 0); idle(sp, t, 2, 0.4); evoAnim(sp, t, 1);
      pose(sp, { legR: [0.15, 0, -0.04, 0.3, 0.3], legL: [0.05, 0, 0.05, 0.2, 0.25], armR: [0.05, 0, -0.18, -0.35], armL: [0.05, 0, 0.18, -0.35] });
      const palm = act(t, cN - 0.3, cN + 0.25, 0.2, 0.06) * (1 - smr(t, cN + 1.2, cN + 2));
      if (palm > 0.01) armIK(sp, 1, V3(GP.x + 0.9, TOPY + 1.9, GP.z + 0.6), V3(GP.x + 1.5, TOPY + 1.2, GP.z + 0.2), clamp(palm));
      sp.userData.eyeM.color.setScalar(1 + 2 * smr(t, K.ninguem - 0.2, K.ninguem + 0.4) + 1.5 * palm);
      // o chefe sobe correndo; congela; volta degrau por degrau (rebobinado); no fim, de joelhos lá embaixo
      const d = dist(t); bossAt(bo, d, t);
      const kS = Math.max(K.historia - 0.4, cN + 1.6), kn = act(t, kS, kS + 0.8, 0.1, 0.05);
      if (t > cN + 1.6 && kn > 0) { restPose(bo); bo.position.set(0.5, 0, Z0); bo.rotation.set(0, Math.PI, 0); kneelPose(bo, clamp(kn)); pose(bo, { spine: [0.4, 0, 0], head: [-0.3, 0, 0], armR: [-0.5, 0, -0.3, -0.5], armL: [-0.5, 0, 0.3, -0.5] }); face(bo, { brow: 0.9, sad: 0.6, open: 0.3, lid: 1 }); }
      const rw = t > cN + 0.35 && t < cN + 1.6;
      gh.forEach((p, i) => { p.visible = rw; if (!rw) return; bossAt(p, Math.min(DMAX, d + (i + 1) * 0.9), t, { ghost: true }); p.userData.holo.uniforms.uA.value = 0.5 - i * 0.13; });
      onda(t, cN, V3(sp.position.x, TOPY + 1.8, sp.position.z), 30, 1.2); ring(t, cN, V3(sp.position.x, TOPY + 2.0, sp.position.z), [0, 0, 1], 3, 1.0);
      brd(t); dome.userData.u.uOff.value.set(t * 0.004, 0);
      rays.userData.rays.forEach((r, i) => (r.material.opacity = 0.06 + 0.03 * Math.sin(t * 0.6 + i)));
    },
    after(t) {
      GU.uFlashCol.value.set(1, 0.92, 0.7); GU.uFlash.value = 0.35 * Math.pow(1 - seg(t, cN, cN + 0.4), 2) * (t >= cN ? 1 : 0);
      lookRebobina(t > cN + 0.35 && t < cN + 1.6 ? 1 : 0);
    },
    cam(t) {
      const zb = Z0 - dist(t), yb = bodyY(zb);
      const c0 = path(t, [
        [a, [3.0, 1.1, 8.5], [0, 4.6, -12], 40],
        [tR - 0.2, [-2.6, 2.0, Z0 + 4.6], [0.4, 1.7, Z0 - 2], 38],
        [cN + 1.75, [-3.4, 2.2, Z0 + 4.2], [0.4, 1.3, Z0 - 1], 40],
        [b, [0.35, 8.9, -25.4], [0.4, 6.5, -11], 40],
      ]);
      const tr = { pos: [-3.8, yb + 2.3, zb + 4.6], look: [0.45, yb + 1.25, zb - 1.6], fov: 38 }, w = smr(t, tR - 0.4, tR + 0.3) * (1 - smr(t, cN + 1.25, cN + 1.75));
      const c = { pos: lerp3(c0.pos, tr.pos, w), look: lerp3(c0.look, tr.look, w), fov: lerp(c0.fov, tr.fov, w), roll: 0 };
      return { ...shakeCam(c, t, impact(t, cN, 0.08, 0.7)), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 9 · pergunta: o espírito dourado gigante brilhando sobre a cidade à noite
addSet("s9-pergunta", (g) => {
  const [a, b] = T.sc["s9-pergunta"];
  const dome = skyDome(g, { top: 0x040818, mid: 0x0e1838, midY: 0.15, hor: 0x2a2a48, ground: 0x04060a, sunDir: [0.4, 0.5, -1], sunI: 0, cov: 0.55, cloudA: 0.4, cloudLit: 0x6a6a90, cloudSh: 0x0a1020, stars: 1.5 });
  const moon = mesh(sph(14, 40, 30), BM(0xe0e4f0, { fog: false }), 90, 140, -300, g); const mg = glowSprite(0x9aa8e0, 50, 0.12); mg.material.fog = false; moon.add(mg);
  chao(g, 300, 300, texCalcada([70, 66, 62], [50, 48, 46]), 120, 120, { y: 0 });
  const city = grp(g);
  for (let i = 0; i < 60; i++) { const an = hash(i * 1.7) * Math.PI * 2, r = 10 + hash(i * 3.3) * 60, x = Math.sin(an) * r, z = Math.cos(an) * r - 10; if (Math.hypot(x, z + 16) < 9 || Math.hypot(x - 3, z - 13) < 10 || Math.hypot(x, z - 7) < 8) continue; palazzo(city, x, z, { w: 9 + hash(i) * 4, d: 8, floors: 3 + Math.floor(hash(i * 5) * 4), seed: i + 200, rotY: hash(i * 9) * 6.28, lit: 0.5, litI: 0.9, balc: r < 25 }); }
  cupula(city, -26, -40, 9, { lit: true }); cupula(city, 30, -52, 11, { lit: true, dome: 0x6a7a7a }); campanario(city, 18, -26, 3, 24, { lit: true }); campanario(city, -40, -18, 3.2, 28, { lit: true });
  // terraço onde o garoto está
  const roof = grp(g, 0, 0, 7); mesh(box(7, 10, 7), SM(0xb88a62, { map: texFachada("#b88a62", "#2a3a2a", 3, 3, 0.5, 9).map }), 0, 5, 0, roof); mesh(box(7.2, 0.2, 7.2), SM(0x8a5a3a), 0, 10.1, 0, roof); [[0, -3.5, 7, 0.2], [0, 3.5, 7, 0.2], [-3.5, 0, 0.2, 7], [3.5, 0, 0.2, 7]].forEach(([x, z, w, d]) => mesh(box(w, 0.9, d), SM(0xe0c8a0), x, 10.6, z, roof));
  const lamps = [[-1.2, -2.5], [1.5, -2.6]].map(([x, z]) => poste(roof, x, 10.2, z, 1.6));
  // o espírito gigante: brilho, coroa de raios, asas de luz, partículas subindo
  const sp = evoluir(espDourado({ emisI: 0.38, env: 0.8 })); sp.scale.setScalar(8.5); g.add(sp); sp.userData.glow.material.opacity = 0.05; sp.userData.glowL.intensity = 0; sp.userData.halo.children.forEach((c) => { if (c.isSprite) c.material.opacity = 0.15; });
  const SP0 = V3(0, 5.5, -16);
  const keyL = new THREE.PointLight(0xffc060, 30, 60, 1.6); keyL.position.set(0, 20, -6); g.add(keyL);
  const au = aura(g, 160, 0xffd070, 0.12);
  const gi = garoto(); g.add(gi);
  const motes = dustPts(300, [-30, 30, 2, 40, -40, 10], 0xffe0a0, 0.18, 0.6); g.add(motes);
  const brd = birds(g, 6, { center: [0, 30, -10], rx: 26, rz: 10, speed: 0.06, color: 0x0a0a12 });
  return {
    bg: 0x04060c, fogExp: 0.008, fogCol: 0x101830, dome,
    look: { exposure: 1.12, bloom: 0.7, bloomT: 0.8, bloomR: 0.7, vig: 0.5, sat: 1.06, con: 1.08, lift: [0.0, 0.01, 0.04] },
    sun: { dir: [0.4, 0.8, 0.5], col: 0xa8b8ff, I: 0.9, c: [0, 8, -6], r: 26 }, hemi: { sky: 0x2a3a6a, ground: 0x0a0c12, I: 0.5 }, fill: { col: 0xffc070, I: 0.6, dir: [0, 0.6, -1] }, rim: { col: 0xffd090, str: 0.8 },
    update(t) {
      restPose(sp); sp.position.set(SP0.x, SP0.y + Math.sin(t * 0.7) * 0.3, SP0.z); sp.rotation.set(0, 0, 0); idle(sp, t, 2, 0.3); evoAnim(sp, t, 1);
      const open = act(t, a + 0.3, a + 2.2, 0.12, 0.05);
      pose(sp, { legR: [0.15, 0, -0.04, 0.3, 0.3], legL: [0.05, 0, 0.05, 0.2, 0.25], armR: [-0.2 - 0.15 * open, 0, -0.75 * open - 0.15, -0.3], armL: [-0.2 - 0.15 * open, 0, 0.75 * open + 0.15, -0.3], handR: 0, handL: 0 });
      // olha o garoto lá embaixo e depois a câmera, quando pergunta
      const toCam = smr(t, K.voce - 0.3, K.voce + 0.6);
      lookAtW(sp, V3(0, 11.5, 7).lerp(V3(1.2, 19.5, -2), toCam), 0.9);
      sp.userData.eyeM.color.setScalar(1 + 1.2 * toCam + 2.5 * smr(t, K.comenta - 0.2, K.comenta + 0.3));
      au(t, V3(SP0.x, SP0.y - 2, SP0.z), 1, 6, 22);
      restPose(gi); gi.position.set(0.3, 10.2, 7.8); gi.rotation.set(0, Math.PI, 0); idle(gi, t, 11, 0.6); standFeet(gi, { hf: () => 10.2 }); lookAtW(gi, V3(0, 19, -16), 0.85); face(gi, { smile: 0.15, lid: 0.9 }); clothWind(gi, t, 1.0);
      floatDust(motes, t, 1.2, 0.15); brd(t); dome.userData.u.uOff.value.set(t * 0.002, 0);
    },
    cam(t) {
      return { ...path(t, [
        [a, [3.6, 12.2, 13.6], [0.2, 13.5, 0.0], 42],
        [K.requiem8, [2.6, 16.5, 3.0], [0, 19.0, -14], 38],
        [K.comenta, [1.6, 19.2, -3.5], [0, 20.2, -15], 34],
        [b, [1.1, 19.6, -5.5], [0, 20.4, -15], 32],
      ]), near: 0.05 };
    },
  };
});
