// ================================================================ vídeo: Kira · cenas 6–10

// ---------------------------------------------------------------- 6 · keys: a loja de departamentos à noite (vitrines, manequins sem rosto, escada rolante); as keys sobem da caixa de presente
addSet("s6-keys", (g) => {
  const [a, b] = T.sc["s6-keys"];
  const floorT = canvasTex(512, 512, (c, w, h) => { c.fillStyle = "#cfc8bc"; c.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = (x + y) % 2 ? "#c4bcae" : "#d8d2c6"; c.fillRect(x * 128 + 2, y * 128 + 2, 124, 124); } for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(120,110,100,${hash(i) * 0.08})`; c.fillRect(hash(i * 3) * w, hash(i * 5) * h, 2 + hash(i * 7) * 8, 2); } });
  const fl = mesh(new THREE.PlaneGeometry(30, 30), SM(0xffffff, { map: rep(floorT, 12, 12), roughness: 0.12, metalness: 0.15 }), 0, 0, -6, g); fl.rotation.x = -Math.PI / 2;
  mesh(new THREE.PlaneGeometry(30, 30), SM(0x2a2a30, { roughness: 0.9 }), 0, 4.2, -6, g).rotation.x = Math.PI / 2;
  mesh(box(30, 4.2, 0.2), SM(0x3a3a44, { roughness: 0.8 }), 0, 2.1, -16, g);
  // luminárias do teto (metade apagada: loja fechada), placa de saída verde, pilares
  const panels = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const on = (i + j) % 2 === 0; const pm = mesh(box(1.2, 0.04, 0.4), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeef2ff, emissiveIntensity: on ? 1.3 : 0.05 }), -4.5 + i * 1.8, 4.16, 2 - j * 3.6, g); panels.push(pm); }
  const saida = canvasTex(256, 96, (c, w, h) => { c.fillStyle = "#1a8a3a"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "700 54px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("SAÍDA", w / 2 + 20, h / 2 + 3); c.fillRect(22, 30, 30, 40); }, { redraw: true });
  mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshBasicMaterial({ map: saida }), -3.5, 3.2, -15.88, g);
  [[-3.2, -3], [3.2, -3], [-3.2, -10], [3.2, -10]].forEach(([x, z]) => mesh(box(0.6, 4.2, 0.6), SM(0xe8e2d8, { roughness: 0.4 }), x, 2.1, z, g));
  // escada rolante ao fundo
  const esc = grp(g, 3.6, 0, -12); esc.rotation.y = -0.4; const em = SM(0x9aa0a8, { metalness: 0.7, roughness: 0.3 });
  for (let i = 0; i < 18; i++) mesh(box(1.0, 0.2, 0.36), em, 0, 0.1 + i * 0.22, -i * 0.34, esc);
  [-0.55, 0.55].forEach((x) => { const r = mesh(box(0.08, 0.9, 7.2), SM(0x1a1a1e, { roughness: 0.3 }), x, 2.3, -2.9, esc); r.rotation.x = Math.atan2(4, 6.1); });
  // manequins sem rosto de terno (o homem comum, multiplicado)
  const mqs = []; [[-2.4, -6.5, 0.3], [-1.6, -7.2, -0.1], [2.2, -6.8, -0.4], [2.9, -5.6, -0.7]].forEach(([x, z, r], i) => { const m = semRosto({ jacket: [0x3a3a44, 0x4a3a2a, 0x2a3a4a, 0x3a2a3a][i], pants: 0x2a2a30, hairStyle: "careca", seed: 80 + i }); m.userData.tie.visible = i % 2 === 0; m.position.set(x, 0.12, z); m.rotation.y = r; g.add(m); mesh(cyl(0.3, 0.32, 0.12, 20), SM(0xe8e2d8, { roughness: 0.3 }), x, 0.06, z, g); restPose(m); pose(m, { armR: [0.1, 0, -0.25, -0.3], armL: [-0.15, 0, 0.2, -0.5] }); mqs.push(m); });
  // vitrines com caixas de presente; no centro, a caixa de onde sobem as keys
  const vidro = new THREE.MeshStandardMaterial({ color: 0xd8e8f0, transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const balcao = (x, z, w = 1.8) => { const c = grp(g, x, 0, z); mesh(box(w, 0.75, 0.6), SM(0x2a2018, { roughness: 0.5 }), 0, 0.375, 0, c); mesh(box(w, 0.42, 0.6), vidro, 0, 0.96, 0, c); mesh(box(w + 0.02, 0.02, 0.62), SM(0xc8b080, { metalness: 0.8, roughness: 0.3 }), 0, 1.17, 0, c); const L_ = new THREE.PointLight(0xffe4c0, 0.6, 2, 1.6); L_.position.set(0, 1.0, 0); c.add(L_); return c; };
  const presente = (parent, x, y, z, s, col, rib) => { const p = grp(parent, x, y, z); mesh(box(s, s * 0.7, s), SM(col, { roughness: 0.5 }), 0, s * 0.35, 0, p); mesh(box(s * 1.01, s * 0.71, s * 0.14), SM(rib, { roughness: 0.4 }), 0, s * 0.35, 0, p); mesh(box(s * 0.14, s * 0.71, s * 1.01), SM(rib, { roughness: 0.4 }), 0, s * 0.35, 0, p); return p; };
  [[-2.2, -1.6], [2.2, -1.6], [-2.4, -3.9], [2.4, -3.9]].forEach(([x, z], i) => { const c = balcao(x, z); for (let k = 0; k < 3; k++) presente(c, -0.5 + k * 0.5, 0.78, 0, 0.2 + hash(i * 3 + k) * 0.08, [0xc83a3a, 0x3a6ac8, 0xe8c040, 0x3aa86a][(i + k) % 4], 0xf4f0e6); });
  const centro = balcao(0, -0.4, 1.4);
  const caixa = presente(centro, 0, 0.78, 0, 0.3, 0x5a2a8a, 0xffd060); const tampa = grp(caixa, 0, 0.22, -0.15); mesh(box(0.32, 0.05, 0.32), SM(0x5a2a8a, { roughness: 0.5 }), 0, 0.02, 0.15, tampa);
  const cardTex = canvasTex(256, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#14142e"); gr.addColorStop(1, "#7a4ac8"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(220,200,255,.9)"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#fff"; c.font = "700 46px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.fillText("KEY", w / 2, 100); c.fillStyle = "#ffd060"; c.font = "700 22px 'Space Mono', monospace"; c.fillText("★ ★ ★", w / 2, 135); c.fillStyle = "#fff"; c.beginPath(); c.roundRect(w / 2 - 34, 20, 68, 34, 14); c.fill(); c.fillStyle = "#14142e"; c.fillRect(w / 2 - 22, 34, 14, 5); c.fillRect(w / 2 - 17, 29, 5, 15); c.beginPath(); c.arc(w / 2 + 16, 33, 4, 0, 7); c.arc(w / 2 + 22, 41, 4, 0, 7); c.fill(); }, { redraw: true });
  const cards = []; for (let i = 0; i < 12; i++) cards.push(mesh(box(0.3, 0.19, 0.008), new THREE.MeshStandardMaterial({ map: cardTex, emissive: 0xffffff, emissiveMap: cardTex, emissiveIntensity: 0.45, roughness: 0.35 }), 0, 0, 0, g));
  const cg = glowSprite(0xc8a0ff, 2.0, 0); cg.position.set(0, 1.3, -0.4); g.add(cg);
  const sparks = flowPts(90, 0xe0c8ff, 0.035); g.add(sparks.pts);
  const keyL = new THREE.PointLight(0xc8a0ff, 0, 5, 1.5); keyL.position.set(0, 1.5, -0.2); g.add(keyL);
  const motes = dustPts(160, [-3, 3, 0.3, 3.8, -5, 2], 0xfff4e0, 0.018, 0.5); g.add(motes);
  return {
    bg: 0x0c0c12, fog: [6, 22], fogCol: 0x0c0c12,
    look: { exposure: 1.25, bloom: 0.75, bloomT: 0.7, vig: 0.48, sat: 1.08, con: 1.05, lift: [0.01, 0.008, 0.022] },
    sun: { dir: [0.3, 1, 0.5], col: 0xe8ecff, I: 0.8, c: [0, 0, -2], r: 7 }, hemi: { sky: 0x8a8aa0, ground: 0x3a3428, I: 0.55 }, fill: { col: 0xffe0c0, I: 0.2, dir: [0, 0.4, 1] }, rim: { col: 0xd8c8ff, str: 0.5 }, hand: 0.008,
    update(t) {
      tampa.rotation.x = -1.9 * E.outBack(smr(t, K.rapidinho + 0.1, K.keys + 0.1));
      const up = smr(t, K.keys - 0.2, K.steam + 0.4), out = smr(t, K.agora - 0.3, K.agora + 0.5), lt = t - a;
      cards.forEach((cd, i) => { const ang = (i / 12) * Math.PI * 2 + lt * 0.8, r = 0.06 + up * (0.42 + (i % 3) * 0.13) * (1 + out * 2.5), yy = 1.05 + up * (0.35 + Math.sin(lt * 2 + i) * 0.06 + (i % 4) * 0.13) + out * 1.4;
        cd.position.set(Math.cos(ang) * r, yy, -0.4 + Math.sin(ang) * r * 0.75); cd.rotation.set(-0.25 + Math.sin(lt + i) * 0.2, -ang + Math.PI / 2, Math.sin(lt * 1.3 + i) * 0.25); cd.scale.setScalar(Math.max(0.001, up * (1 - out * 0.7))); });
      const pulse = K.bio && t > K.bio - 0.05 && t < K.bio + 0.4 ? 1 - (t - K.bio + 0.05) / 0.45 : 0;
      cg.material.opacity = 0.4 * up * (1 - out) + pulse * 0.35; keyL.intensity = 1.6 * up * (1 - out) + pulse * 1.5;
      for (let i = 0; i < 90; i++) { const ph = (t * 0.45 + hash(i * 1.7)) % 1, an = hash(i) * 6.28 + t * 0.6; sparks.pos.set([Math.cos(an) * (0.15 + ph * 0.6), 1.05 + ph * 1.4 * up, -0.4 + Math.sin(an) * (0.15 + ph * 0.45)], i * 3); } sparks.pts.material.opacity = up * 0.8 * (1 - out); sparks.upd();
      panels.forEach((pm, i) => (pm.material.emissiveIntensity = (pm.material.emissiveIntensity > 0.5 ? 1.3 : 0.05) * (1 - out * 0.6)));
      floatDust(motes, t, 0.2, 0.15);
    },
    cam(t) {
      return path2(t, [
        [a, [0.5, 1.75, 3.6], [0, 1.15, -1.6], 40],
        [K.steam, [0.15, 1.6, 2.6], [0, 1.4, -0.4], 38],
        [K.bio + 0.3, [0.05, 1.45, 1.75], [0, 1.6, -0.4], 36],
        [b, [-0.6, 1.9, 1.3], [-1.6, 1.3, -6.0], 38],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 7 · só disfarce? Mural da investigação: recortes, fotos, fios vermelhos ligados à silhueta com "?"; no "também não" os fios caem
addSet("s7-disfarce", (g) => {
  const [a, b] = T.sc["s7-disfarce"];
  const wallT = texPapelParede("#5a5448", "#544e42"), wm = SM(0xffffff, { map: rep(wallT.clone(), 4, 2), roughness: 0.9 }); wm.map.needsUpdate = true;
  mesh(box(8, 3.2, 0.1), wm, 0, 1.6, -0.05, g); mesh(box(8, 0.1, 5), SM(0x3a3026, { roughness: 0.8 }), 0, -0.05, 2.4, g);
  const cork = texPair(256, (u, v) => fbm2(u * 30, v * 30, 3, 30), (u, v, h) => mixc([150, 108, 64], [196, 150, 96], h), 2, { rep: [3, 2] });
  const board = mesh(box(2.6, 1.7, 0.04), SM(0xffffff, { map: cork.map, normalMap: cork.normalMap, roughness: 0.95 }), 0, 1.62, 0.04, g);
  mesh(box(2.7, 1.8, 0.03), SM(0x5a3a22), 0, 1.62, 0.02, g);
  const papers = [];
  const paper = (x, y, w, h, draw, rot = 0) => { const tx = canvasTex(256, Math.round(256 * h / w), draw, { redraw: true }); const m = mesh(new THREE.PlaneGeometry(w, h), SM(0xffffff, { map: tx, roughness: 0.85 }), x, y, 0.07 + papers.length * 0.0015, g); m.rotation.z = rot; m.castShadow = false; papers.push(m); const pin = mesh(sph(0.018, 10, 8), SM(0xc81e2a, { roughness: 0.3 }), x, y + h * 0.42, 0.09, g); return { m, pin: pin.position.clone() }; };
  const jornal = (titulo) => (c, w, h) => { c.fillStyle = "#e8e2d2"; c.fillRect(0, 0, w, h); c.fillStyle = "#1a1a1a"; c.font = "700 26px 'Archivo Black', sans-serif"; c.fillText(titulo, 12, 36); c.fillStyle = "rgba(30,30,30,.55)"; for (let y = 54; y < h - 10; y += 12) c.fillRect(12, y, (w - 24) * (0.7 + hash(y) * 0.3), 5); c.fillStyle = "rgba(60,60,60,.6)"; c.fillRect(w - 96, 50, 84, 70); };
  const foto = (seed) => (c, w, h) => { c.fillStyle = "#f4f2ec"; c.fillRect(0, 0, w, h); const gr = c.createLinearGradient(0, 14, 0, h - 50); gr.addColorStop(0, "#1a2240"); gr.addColorStop(1, "#4a4a5a"); c.fillStyle = gr; c.fillRect(14, 14, w - 28, h - 64); c.fillStyle = "#0a0c14"; for (let i = 0; i < 5; i++) c.fillRect(14 + i * 46, h - 50 - 60 - hash(i + seed) * 70, 40, 60 + hash(i + seed) * 70); c.fillStyle = "#ffd890"; c.fillRect(60 + seed * 20, 90, 10, 12); };
  const sil = (c, w, h) => { c.fillStyle = "#f4f2ec"; c.fillRect(0, 0, w, h); c.fillStyle = "#1a1a22"; c.beginPath(); c.ellipse(w / 2, 92, 46, 56, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(w / 2 - 90, h - 10); c.quadraticCurveTo(w / 2 - 80, 160, w / 2, 152); c.quadraticCurveTo(w / 2 + 80, 160, w / 2 + 90, h - 10); c.fill(); c.fillStyle = "#c81e2a"; c.font = "700 120px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("?", w / 2, 108); };
  const P = [
    paper(-0.85, 2.05, 0.6, 0.42, jornal("CASO SEM SOLUÇÃO"), -0.05), paper(0.88, 2.08, 0.6, 0.42, jornal("NENHUMA PISTA"), 0.06), paper(-0.95, 1.2, 0.42, 0.5, foto(0)), paper(0.95, 1.18, 0.42, 0.5, foto(1), 0.04),
    paper(-0.3, 0.98, 0.5, 0.36, jornal("BAIRRO TRANQUILO"), 0.03), paper(0.38, 0.95, 0.42, 0.5, foto(2), -0.06),
  ];
  const S = paper(0, 1.68, 0.5, 0.62, sil);
  // fios vermelhos dos alfinetes até a silhueta (caem no "também não")
  const fios = P.map((pp, i) => { const m = mesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 5), SM(0xd01e2a, { roughness: 0.6 }), 0, 0, 0.1, g); m.castShadow = false; return { m, A: pp.pin, B: S.pin, i }; });
  const setFio = (f, A, B) => { const d = B.clone().sub(A); f.m.position.copy(A).addScaledVector(d, 0.5); f.m.scale.set(1, d.length(), 1); f.m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); };
  // mesa com abajur, café, pastas; janela com chuva e luzes da cidade
  const desk = grp(g, 0.2, 0, 1.0); mesh(box(1.8, 0.05, 0.8), SM(0x4a3222, { roughness: 0.5 }), 0, 0.76, 0, desk); [[-0.85, -0.35], [0.85, -0.35], [-0.85, 0.35], [0.85, 0.35]].forEach(([x, z]) => mesh(box(0.05, 0.76, 0.05), SM(0x2a1a10), x, 0.38, z, desk));
  mesh(cyl(0.04, 0.035, 0.1, 14), SM(0xf2f2ee, { roughness: 0.3 }), 0.5, 0.83, 0.1, desk); mesh(box(0.34, 0.03, 0.26), SM(0xc8a060, { roughness: 0.8 }), -0.4, 0.795, 0.05, desk);
  const lampD = grp(desk, -0.7, 0.78, -0.15); mesh(cyl(0.06, 0.07, 0.03, 14), SM(0x2a2a2a, { metalness: 0.6 }), 0, 0.015, 0, lampD); const arm = mesh(cyl(0.01, 0.01, 0.45, 6), SM(0x2a2a2a, { metalness: 0.6 }), 0.08, 0.22, 0, lampD); arm.rotation.z = -0.4;
  const lampL = new THREE.SpotLight(0xffd8a0, 3.2, 6, 0.85, 0.6, 1.5); lampL.position.set(0.2, 0.5, 0.1); lampD.add(lampL); const tg = grp(g, 0, 1.55, 0.05); lampL.target = tg;
  const chuvaT = canvasTex(128, 256, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 70; i++) { c.strokeStyle = `rgba(200,220,255,${0.15 + hash(i) * 0.35})`; c.lineWidth = 1; const x = hash(i * 3) * w, y = hash(i * 5) * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y + 12 + hash(i * 7) * 20); c.stroke(); } });
  const jan = grp(g, 2.55, 1.7, 0.0); mesh(box(1.2, 1.3, 0.05), SM(0x2a2a2a), 0, 0, 0.0, jan);
  const cidade = mesh(new THREE.PlaneGeometry(1.1, 1.2), new THREE.MeshBasicMaterial({ map: janelasTex.clone(), color: 0x8a9ac8 }), 0, 0, 0.03, jan); cidade.material.map.needsUpdate = true;
  const rain = mesh(new THREE.PlaneGeometry(1.1, 1.2), new THREE.MeshBasicMaterial({ map: rep(chuvaT, 2, 2), transparent: true, depthWrite: false }), 0, 0, 0.05, jan);
  const motes = dustPts(90, [-1.5, 1.5, 0.4, 2.8, 0.2, 2], 0xfff0d0, 0.014, 0.5); g.add(motes);
  return {
    bg: 0x0a0806, fog: [6, 20], fogCol: 0x0a0806,
    look: { exposure: 1.15, bloom: 0.55, bloomT: 0.82, vig: 0.58, sat: 0.95, con: 1.1, lift: [0.01, 0.008, 0.004] },
    sun: { dir: [0.4, 0.6, 1], col: 0x8aa0d0, I: 0.25, c: [0, 1.5, 0], r: 3 }, hemi: { sky: 0x5a5040, ground: 0x1a140e, I: 0.35 }, fill: { col: 0xffd0a0, I: 0.0 }, rim: { col: 0xffe0c0, str: 0.3 }, hand: 0.009,
    update(t) {
      rain.material.map.offset.y = -t * 0.9; floatDust(motes, t, 0.15, 0.2);
      const cut = K.tambem - 0.05;
      fios.forEach((f) => { const k = clamp((t - cut - f.i * 0.06) / 0.5); const A = f.A.clone(), B = f.B.clone(); if (k > 0) { const fall = E.in(k); B.copy(f.A).add(V3(0.04 * (f.i % 2 ? 1 : -1), -0.6 * fall - 0.05, 0.02)); B.lerp(f.B, (1 - k) * (1 - k)); } setFio(f, A, B); });
      const dim = smr(t, cut + 0.1, cut + 0.6); lampL.intensity = 3.2 * (1 - dim * 0.55) + noise1(t * 8) * 0.12;
    },
    cam(t) {
      return path2(t, [
        [a, [0.35, 1.7, 3.4], [0, 1.6, 0], 38],
        [K.disfarce6 + 0.2, [0.12, 1.7, 2.2], [0, 1.64, 0], 36],
        [b, [0.08, 1.68, 1.95], [0, 1.62, 0], 35],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 8 · o objetivo: jardim de pedras ao entardecer; o homem toma chá na varanda; o bambu-fonte bate a cada "sem…"; no fim, uma linha vermelha corre escondida entre os sulcos do cascalho
addSet("s8-objetivo", (g) => {
  const [a, b] = T.sc["s8-objetivo"];
  const dome = skyDome(g, { top: 0x2a2a5a, mid: 0x8a5a7a, hor: 0xf0a070, ground: 0x2a2028, exp: 0.7, sunDir: [-0.6, 0.06, -1], sunCol: 0xffb070, sunI: 1.0, disk: 1.8, cov: 0.55, cloudA: 0.7, cloudLit: 0xffc8a0, cloudSh: 0x6a4a6a, midY: 0.12 });
  // cascalho rastelado: linhas retas e anéis em volta das pedras (relevo e sulcos), 8 x 8 m
  const ROCKS = [[-1.2, -1.6, 0.5], [0.9, -2.4, 0.38], [1.9, -0.9, 0.3]], SZ = 8, CZ = -1.6;
  const rake = (u, v) => { const x = (u - 0.5) * SZ, z = (v - 0.5) * SZ + CZ; let best = 1e9, R = 0; ROCKS.forEach(([rx, rz, rr]) => { const d = Math.hypot(x - rx, z - rz) - rr * 1.1; if (d < best) { best = d; R = rr; } }); const ring = best < 0.75; return ring ? 0.5 + 0.5 * Math.cos(Math.max(0, best) * Math.PI * 2 / 0.11) : 0.5 + 0.5 * Math.cos(z * Math.PI * 2 / 0.11); };
  const gr = texPair(1024, rake, (u, v, h) => { const n = hash2(u * 997, v * 991); return mixc([168, 164, 156], [214, 210, 200], h * 0.7 + n * 0.3); }, 2.2);
  const grav = mesh(new THREE.PlaneGeometry(SZ, SZ), SM(0xffffff, { map: gr.map, normalMap: gr.normalMap, normalScale: new THREE.Vector2(1.6, 1.6), roughness: 0.95 }), 0, 0.001, CZ, g); grav.rotation.x = -Math.PI / 2;
  mesh(new THREE.PlaneGeometry(40, 40), SM(0x2a3020, { roughness: 1 }), 0, -0.01, -8, g).rotation.x = -Math.PI / 2;
  ROCKS.forEach(([x, z, r], i) => { const rk = rock(g, x, r * 0.25, z, r, 3 + i * 5, { flat: 0.65 }); const moss = mesh(sph(r * 1.05, 14, 8, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), SM(0x3a5a2a, { roughness: 1 }), x, 0.04, z, g); moss.rotation.x = Math.PI; moss.scale.y = 0.3; });
  // a linha vermelha (desenhada aos poucos sobre os sulcos)
  const rC = document.createElement("canvas"); rC.width = rC.height = 1024; const rG = rC.getContext("2d"); const rT = new THREE.CanvasTexture(rC); rT.colorSpace = THREE.SRGBColorSpace;
  const redP = mesh(new THREE.PlaneGeometry(SZ, SZ), new THREE.MeshBasicMaterial({ map: rT, transparent: true, depthWrite: false, fog: false }), 0, 0.006, CZ, g); redP.rotation.x = -Math.PI / 2; redP.castShadow = false;
  const toPx = (x, z) => [((x / SZ) + 0.5) * 1024, (((z - CZ) / SZ) + 0.5) * 1024];
  const redPath = []; { for (let i = 0; i <= 60; i++) { const k = i / 60, x = -3.8 + k * 2.4; redPath.push([x, -0.3 + Math.round(0.0 / 0.11) * 0.11]); } const [rx, rz, rr] = ROCKS[0]; for (let i = 0; i <= 80; i++) { const a_ = Math.PI * 0.5 + (i / 80) * Math.PI * 1.6, rad = rr * 1.1 + 0.44; redPath.push([rx + Math.sin(a_) * rad, rz + Math.cos(a_) * rad]); } for (let i = 0; i <= 50; i++) redPath.push([rx + rr * 1.1 + 0.44 + (i / 50) * 3.6, -2.19]); }
  let rKey = -1;
  const drawRed = (p) => { const key = Math.round(p * 120); if (key === rKey) return; rKey = key; rG.clearRect(0, 0, 1024, 1024); if (p <= 0) { rT.needsUpdate = true; return; } rG.strokeStyle = "rgba(190,10,24,.95)"; rG.lineWidth = 7; rG.lineCap = rG.lineJoin = "round"; rG.shadowColor = "rgba(255,40,50,.8)"; rG.shadowBlur = 10; rG.beginPath(); const n = Math.floor(p * (redPath.length - 1)); redPath.slice(0, n + 1).forEach(([x, z], i) => { const [px, py] = toPx(x, z); i ? rG.lineTo(px, py) : rG.moveTo(px, py); }); rG.stroke(); rT.needsUpdate = true; };
  // varanda de madeira (engawa), parede com shoji iluminado, beiral do telhado
  const pk = texPlanks([120, 84, 52], [100, 68, 40]), dk = SM(0xffffff, { map: rep(pk.map.clone(), 1, 4), normalMap: rep(pk.normalMap.clone(), 1, 4), roughness: 0.55 }); dk.map.needsUpdate = dk.normalMap.needsUpdate = true;
  const deck = mesh(box(7, 0.08, 1.4), dk, 0, 0.42, 1.95, g); deck.rotation.y = Math.PI / 2; deck.scale.set(1, 1, 1); deck.rotation.y = 0;
  [-3.3, -1.1, 1.1, 3.3].forEach((x) => mesh(box(0.1, 0.42, 0.1), SM(0x4a3020), x, 0.21, 1.3, g));
  const shojiT = canvasTex(256, 512, (c, w, h) => { c.fillStyle = "#f6e8c8"; c.fillRect(0, 0, w, h); c.fillStyle = "#3a2618"; for (let x = 0; x <= w; x += w / 3) c.fillRect(x - 3, 0, 6, h); for (let y = 0; y <= h; y += h / 6) c.fillRect(0, y - 3, w, 6); });
  for (let i = 0; i < 5; i++) { const sj = mesh(new THREE.PlaneGeometry(1.0, 1.9), new THREE.MeshStandardMaterial({ map: shojiT, emissive: 0xffc070, emissiveMap: shojiT, emissiveIntensity: 0.38, roughness: 0.9 }), -2.2 + i * 1.1, 1.42, 2.62, g); sj.rotation.y = Math.PI; }
  mesh(box(7, 0.25, 0.2), SM(0x3a2618), 0, 2.45, 2.62, g); mesh(box(7.6, 0.08, 2.2), SM(0x2a2a30, { roughness: 0.5 }), 0, 2.75, 1.95, g).rotation.x = 0.18;
  [-3.2, 3.2].forEach((x) => mesh(box(0.14, 2.35, 0.14), SM(0x4a3020), x, 1.6, 1.3, g));
  const casaL = new THREE.PointLight(0xffb060, 1.2, 4, 1.6); casaL.position.set(0, 1.3, 2.3); g.add(casaL);
  const pedra = mesh(box(0.7, 0.15, 0.42), SM(0x8a8680, { roughness: 0.9 }), 0, 0.075, 0.92, g);
  // lanterna de pedra com luz, bordo vermelho com folhas caindo, cerca de bambu, bambu-fonte (shishi-odoshi)
  const tr = grp(g, -1.05, 0, 0.05), stoneM = SM(0x7a7670, { roughness: 0.95 });
  mesh(cyl(0.22, 0.28, 0.12, 8), stoneM, 0, 0.06, 0, tr); mesh(cyl(0.08, 0.1, 0.55, 10), stoneM, 0, 0.39, 0, tr); mesh(cyl(0.24, 0.16, 0.1, 6), stoneM, 0, 0.71, 0, tr);
  const lbox = mesh(box(0.3, 0.26, 0.3), new THREE.MeshStandardMaterial({ color: 0x6a6660, emissive: 0xffa040, emissiveIntensity: 0.0, roughness: 0.9 }), 0, 0.89, 0, tr);
  mesh(new THREE.ConeGeometry(0.34, 0.24, 6), stoneM, 0, 1.14, 0, tr); mesh(sph(0.05, 8, 6), stoneM, 0, 1.28, 0, tr);
  const lanL = new THREE.PointLight(0xffa040, 1.4, 4, 1.6); lanL.position.set(0, 0.89, 0); tr.add(lanL); const lanG = glowSprite(0xffb060, 0.7, 0.55); lanG.position.set(0, 0.89, 0.17); tr.add(lanG);
  const maple = tree(g, -1.9, 0, 0.9, { h: 3.4, s: 0.75, leaf: 0xb8322a, blobs: 10, w: 1.1 });
  const leaves = []; for (let i = 0; i < 26; i++) { const lf = mesh(new THREE.PlaneGeometry(0.07, 0.06), SM(i % 3 ? 0xc83a2a : 0xe8602a, { side: THREE.DoubleSide, roughness: 0.8 }), 0, 0, 0, g); lf.castShadow = false; leaves.push(lf); }
  for (let i = 0; i < 46; i++) { const x = -4 + i * 0.18; mesh(cyl(0.035, 0.035, 1.8, 8), SM(i % 4 ? 0x8a8a4a : 0x7a7a3a, { roughness: 0.6 }), x, 0.9, -5.6, g); }
  [0.5, 1.3].forEach((y) => mesh(box(8.4, 0.05, 0.06), SM(0x3a2a1a), 0, y, -5.52, g));
  forestInst(g, 40, [-14, 14, -14, -7], () => 0, { h: 7, leaf: 0x1a2a1a });
  const sod = grp(g, 0.9, 0, 0.75); mesh(cyl(0.34, 0.38, 0.16, 16), stoneM, -0.15, 0.08, -0.2, sod); mesh(cyl(0.3, 0.3, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.05, metalness: 0.4 }), -0.15, 0.165, -0.2, sod);
  [-0.12, 0.12].forEach((x) => mesh(cyl(0.02, 0.02, 0.5, 8), SM(0x8a8a4a), 0.35, 0.25, x, sod));
  const tubo = grp(sod, 0.35, 0.45, 0); const bam = SM(0x9a9a4a, { roughness: 0.5 }); const tb = mesh(cyl(0.045, 0.045, 0.62, 12), bam, 0, 0, 0, tubo); tb.rotation.z = Math.PI / 2;
  const toc = [K.vitorias - 0.05, K.derrotas - 0.05, K.inimigos - 0.05];
  // o homem sentado na beira da varanda, com a xícara de chá
  const p = semRosto(); g.add(p); const u = p.userData;
  const cup = grp(g); mesh(cyl(0.04, 0.032, 0.07, 16), SM(0x6a7a6a, { roughness: 0.3 }), 0, 0.035, 0, cup); mesh(cyl(0.036, 0.036, 0.004, 16), SM(0xa8a060, { roughness: 0.2 }), 0, 0.062, 0, cup);
  const vap = steam(g, { n: 12, size: 0.05, rise: 0.07, grow: 1.4, opacity: 0.28, life: 2.4, spread: 0.03, wind: [0.01, 0, -0.01], color: 0xffffff });
  const SEAT = V3(0, 0, 1.42);
  return {
    bg: 0x2a2028, fog: [10, 40], fogCol: 0x6a4a5a, dome,
    look: { exposure: 1.05, bloom: 0.6, bloomT: 0.78, vig: 0.45, sat: 1.1, con: 1.05, lift: [0.01, 0.006, 0.012] },
    sun: { dir: [-0.8, 0.28, -0.6], col: 0xffa868, I: 1.5, c: [0, 0.5, -0.5], r: 6 }, hemi: { sky: 0x9a7aa0, ground: 0x3a2a2a, I: 0.55 }, fill: { col: 0xffc8a0, I: 0.15 }, rim: { col: 0xffc890, str: 0.55 }, hand: 0.006,
    update(t) {
      const red = smr(t, K.assassinatos - 0.3, K.assassinatos + 0.6);
      const U = dome.userData.u; U.uTop.value.setHex(0x2a2a5a).lerp(_col.setHex(0x2a0a14), red); U.uMid.value.setHex(0x8a5a7a).lerp(_col.setHex(0x8a1a24), red); U.uHor.value.setHex(0xf0a070).lerp(_col.setHex(0xff4a3a), red); U.uOff.value.set(t * 0.003, 0);
      sun.color.setHex(0xffa868).lerp(_col.setHex(0xff3a2a), red);
      lanL.color.setHex(0xffa040).lerp(_col.setHex(0xff2a1a), red); lbox.material.emissiveIntensity = 0.7; lanG.material.color.setHex(0xffb060).lerp(_col.setHex(0xff3a2a), red);
      drawRed(smr(t, K.assassinatos - 0.1, K.rotina + 0.2));
      // bambu-fonte: enche, inclina e bate (toc) nos três "sem…"
      let tilt = 0.18; toc.forEach((tt) => { const k = t - tt; if (k > -0.6 && k < 0) tilt = 0.18 - 0.32 * smr(t, tt - 0.6, tt); else if (k >= 0 && k < 0.5) tilt = -0.55 * (1 - E.out(k / 0.5)) + 0.18 * E.out(k / 0.5); });
      tubo.rotation.z = tilt;
      leaves.forEach((lf, i) => { const ph = ((t * 0.08 + hash(i * 3.3)) % 1), x0 = -1.3 + (hash(i) - 0.5) * 2.2, z0 = 0.2 + (hash(i * 5) - 0.5) * 1.8; lf.position.set(x0 + Math.sin(t * 0.9 + i) * 0.3 - ph * 1.2, 3.0 - ph * 3.0, z0 + Math.cos(t * 0.7 + i) * 0.25 + ph * 0.8); lf.rotation.set(t * 1.3 + i, t * 0.9 + i * 2, t * 0.6); lf.visible = ph < 0.98; });
      restPose(p); idle(p, t, 6, 0.5);
      p.position.copy(SEAT); p.rotation.set(0, Math.PI, 0);
      sitPose(p, 1, { seatY: 0.46, lean: -0.04 });
      plantFeet(p, [[SEAT.x + 0.13, 0.15, SEAT.z - 0.5], [SEAT.x - 0.13, 0.15, SEAT.z - 0.48]], Math.PI);
      // xícara nas duas mãos; no "feliz" leva ao rosto e bebe
      const sip = act(t, K.isso - 0.3, K.isso + 0.35, 0.1, 0.05) * (1 - smr(t, K.feliz + 0.3, K.feliz + 0.9));
      u.head.updateMatrixWorld(true);
      const lap = V3(SEAT.x, 0.82, SEAT.z - 0.36), face_ = u.head.localToWorld(V3(0, 0.03, 0.14));
      const cp = lap.clone().lerp(face_.add(V3(0, -0.07, 0)), clamp(sip)); cup.position.copy(cp); cup.rotation.set(-0.6 * Math.sin(Math.PI * smr(t, K.isso + 0.1, K.feliz + 0.4)), 0, 0);
      armIK(p, 0, cp.clone().add(V3(0.06, 0.05, 0.02)), V3(SEAT.x + 0.6, 0.4, SEAT.z + 0.2), 1); armIK(p, 1, cp.clone().add(V3(-0.06, 0.03, 0.02)), V3(SEAT.x - 0.6, 0.4, SEAT.z + 0.2), 1);
      curlHand(u.hands[0], 0.55, 0.4); curlHand(u.hands[1], 0.55, 0.4);
      u.neck.rotation.x -= 0.22 * Math.sin(Math.PI * smr(t, K.isso + 0.1, K.feliz + 0.4)); u.neck.rotation.x += 0.12 * (1 - clamp(sip));
      vap.upd(t, 1, cup.position.clone().add(V3(0, 0.08, 0)));
      molaHomem(p, t, () => [SEAT.x, 1.2, SEAT.z]);
    },
    cam(t) {
      return path2(t, [
        [a, [0.3, 2.4, -5.4], [0.1, 0.9, 1.2], 40],
        [K.objetivo + 0.2, [0.0, 1.55, -2.9], [0, 0.85, 1.4], 36],
        [K.inimigos + 0.3, [1.15, 1.2, -1.4], [0.4, 0.7, 1.2], 36],
        [K.feliz, [0.35, 1.32, -0.78], [0.02, 1.24, 1.5], 36],
        [K.assassinatos + 0.6, [0.55, 2.3, -1.0], [-0.6, 0.0, -1.8], 42],
        [b, [0.3, 2.9, -1.4], [-0.8, 0.0, -2.3], 44],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 9 · o rosto roubado: quarto de tatame; ele coloca uma máscara de porcelana com rosto; atrás do papel da porta, a família jantando em silhuetas
addSet("s9-rosto", (g) => {
  const [a, b] = T.sc["s9-rosto"];
  const tat = texTatami(); const tm = SM(0xffffff, { map: rep(tat.clone(), 3, 2), roughness: 0.9 }); tm.map.needsUpdate = true;
  mesh(box(6, 0.1, 5), tm, 0, -0.05, 0.5, g); mesh(box(6, 0.1, 5), SM(0x3a2a1e, { roughness: 0.8 }), 0, 2.45, 0.5, g);
  const wallM = SM(0xd8ccb4, { roughness: 0.95 });
  mesh(box(0.1, 2.5, 5), wallM, -2.5, 1.25, 0.5, g); mesh(box(0.1, 2.5, 5), wallM, 2.5, 1.25, 0.5, g);
  // parede do fundo: portas de papel (shoji) iluminadas por trás; a da direita desliza
  const shojiT = canvasTex(256, 512, (c, w, h) => { c.fillStyle = "#f2e2c0"; c.fillRect(0, 0, w, h); c.fillStyle = "#2a1a10"; for (let x = 0; x <= w; x += w / 4) c.fillRect(x - 3, 0, 6, h); for (let y = 0; y <= h; y += h / 8) c.fillRect(0, y - 3, w, 6); });
  const paperM = new THREE.MeshStandardMaterial({ map: shojiT, emissive: 0xffb060, emissiveMap: shojiT, emissiveIntensity: 0.6, roughness: 0.9, transparent: true, opacity: 0.62 });
  const panels = [-1.5, -0.5, 0.5, 1.5].map((x) => mesh(new THREE.PlaneGeometry(1.0, 2.0), paperM, x, 1.0, -1.95, g));
  mesh(box(4.2, 0.12, 0.1), SM(0x2a1a10), 0, 2.05, -1.95, g); mesh(box(4.2, 0.06, 0.1), SM(0x2a1a10), 0, 0.0, -1.95, g); mesh(box(0.8, 2.5, 0.1), wallM, -2.1, 1.25, -1.95, g); mesh(box(0.8, 2.5, 0.1), wallM, 2.1, 1.25, -1.95, g); mesh(box(4.2, 0.4, 0.1), wallM, 0, 2.3, -1.95, g);
  // sala de jantar atrás do papel: luz quente, mesa baixa e a família (silhuetas: esposa e filho)
  const back = new THREE.PointLight(0xffb060, 3.0, 8, 1.4); back.position.set(0.1, 1.5, -3.6); g.add(back);
  mesh(box(5, 0.1, 3), SM(0x6a4a2a), 0, -0.05, -3.5, g); mesh(box(5, 2.5, 0.1), SM(0xc8a878), 0, 1.25, -5.0, g);
  mesh(box(1.3, 0.06, 0.45), new THREE.MeshBasicMaterial({ color: 0x120a08 }), 0.1, 0.36, -2.22, g); [[-0.5, -2.1], [0.7, -2.1]].forEach(([x, z]) => mesh(box(0.05, 0.36, 0.05), new THREE.MeshBasicMaterial({ color: 0x120a08 }), x, 0.18, z, g));
  const esposa = silhueta({ hairStyle: "longo", hairLen: 1.3, seed: 91, jacket: null }), filho = silhueta({ scale: 0.68, hairStyle: "curto", seed: 92, jacket: null });
  g.add(esposa, filho); esposa.position.set(-0.42, 0, -2.2); esposa.rotation.y = Math.PI / 2; filho.position.set(0.72, 0, -2.2); filho.rotation.y = -Math.PI / 2;
  const sombra = grp(g, 0, 0, -1.935); sombra.scale.z = 0.02; const shM = new THREE.MeshBasicMaterial({ color: 0x2a1206, transparent: true, opacity: 0.8, depthWrite: false, fog: false });
  const dup = (src) => { const d = silhueta(src === esposa ? { hairStyle: "longo", hairLen: 1.3, seed: 91, jacket: null } : { scale: 0.68, hairStyle: "curto", seed: 92, jacket: null }); d.traverse((c) => { if (c.isMesh) { c.material = shM; c.renderOrder = 12; } }); sombra.add(d); return d; };
  const shE = dup(esposa), shF = dup(filho); esposa.visible = filho.visible = false;
  mesh(box(0.85, 0.06, 0.4), shM, 0.15, 0.36, 0, sombra).renderOrder = 12; [[-0.22], [0.52]].forEach(([x]) => { const lg = mesh(box(0.05, 0.36, 0.4), shM, x, 0.18, 0, sombra); lg.renderOrder = 12; });
  const tigS = mesh(sph(0.07, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), shM, 0, 0, 0, sombra); tigS.rotation.x = Math.PI; tigS.renderOrder = 12;
  const tigela = mesh(sph(0.07, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x120a08 }), 0, 0, 0, g); tigela.rotation.x = Math.PI;
  // penteadeira com espelho; a máscara de porcelana com rosto num suporte
  const pen_ = grp(g, -2.15, 0, 0.2); mesh(box(0.5, 0.42, 1.0), SM(0x4a2a1a, { roughness: 0.5 }), 0, 0.21, 0, pen_); const esp = mesh(box(0.04, 0.9, 0.6), SM(0x2a1a10), -0.15, 0.95, 0, pen_);
  mesh(new THREE.PlaneGeometry(0.52, 0.8), new THREE.MeshStandardMaterial({ color: 0x8090a0, roughness: 0.05, metalness: 0.9 }), -0.12, 0.95, 0, pen_).rotation.y = Math.PI / 2;
  const maskTex = canvasTex(512, 512, (c, w, h) => { c.fillStyle = "#f0e6d6"; c.fillRect(0, 0, w, h); const cx = w / 2;
    const rg = (x, y, r, col) => { const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, col); gg.addColorStop(1, "rgba(240,230,214,0)"); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); };
    [-1, 1].forEach((s) => { rg(cx + s * 70, 300, 60, "rgba(230,150,140,.35)"); c.fillStyle = "#1a1210"; c.beginPath(); c.ellipse(cx + s * 62, 250, 30, 13, 0, 0, 7); c.fill(); c.fillStyle = "#f8f4ee"; c.beginPath(); c.ellipse(cx + s * 62 - 4, 247, 7, 5, 0, 0, 7); c.fill(); c.strokeStyle = "#3a2a20"; c.lineWidth = 7; c.beginPath(); c.moveTo(cx + s * 30, 212); c.quadraticCurveTo(cx + s * 62, 198, cx + s * 98, 214); c.stroke(); });
    c.strokeStyle = "rgba(150,100,90,.55)"; c.lineWidth = 5; c.beginPath(); c.moveTo(cx - 6, 262); c.quadraticCurveTo(cx - 14, 318, cx - 18, 332); c.quadraticCurveTo(cx, 344, cx + 18, 332); c.stroke();
    c.strokeStyle = "#a85a52"; c.lineWidth = 9; c.beginPath(); c.moveTo(cx - 42, 380); c.quadraticCurveTo(cx, 392, cx + 42, 380); c.stroke(); }, { redraw: true });
  const maskGeo = new THREE.SphereGeometry(1, 32, 24, Math.PI * 0.08, Math.PI * 0.84, Math.PI * 0.12, Math.PI * 0.68); maskGeo.scale(0.083, 0.11, 0.1); maskGeo.translate(0, 0.11, 0.004);
  const uvM = maskGeo.attributes.uv; for (let i = 0; i < uvM.count; i++) uvM.setXY(i, uvM.getX(i), uvM.getY(i));
  const mask = mesh(maskGeo, new THREE.MeshStandardMaterial({ map: maskTex, roughness: 0.32, side: THREE.DoubleSide }), 0, 0, 0, g); mask.castShadow = false;
  const MASK0 = V3(-2.02, 0.62, 0.2); const sup = grp(g, MASK0.x, 0.42, MASK0.z); mesh(cyl(0.01, 0.01, 0.2, 6), SM(0x2a1a10), 0, 0.1, 0, sup); mesh(cyl(0.06, 0.06, 0.02, 12), SM(0x2a1a10), 0, 0.01, 0, sup);
  // relógio na parede da direita (no fim volta no tempo), janela com a sirene da polícia
  const clock = relogioParede(g, 2.44, 1.75, 0.6, 0.22); clock.c.rotation.y = -Math.PI / 2;
  const sirR = new THREE.PointLight(0xff2a2a, 0, 6, 1.4), sirB = new THREE.PointLight(0x2a5aff, 0, 6, 1.4); sirR.position.set(2.0, 1.6, 2.2); sirB.position.set(2.0, 1.6, 1.4); g.add(sirR, sirB);
  const luz = new THREE.PointLight(0xffd8a8, 0.8, 5, 1.6); luz.position.set(0, 2.2, 0.8); g.add(luz);
  const keyM = new THREE.PointLight(0xffe0c0, 1.3, 3, 1.6); keyM.position.set(-1.7, 1.75, 1.0); g.add(keyM);
  // o homem: em pé, de frente para a penteadeira; pega a máscara, coloca no rosto, vai até a porta e a abre
  const p = semRosto(); g.add(p); const u = p.userData;
  const P0 = V3(-1.25, 0, 0.25), tPick = K.roubou - 0.35, tWear = K.rosto + 0.25, tTurn = K.outro - 0.2, tGo = K.continuar - 0.6, tOpen = K.tranquilo - 0.1;
  const DG = 1.25, LG = gaitFit(DG, 0.55);
  return {
    bg: 0x0c0806, fog: [8, 30], fogCol: 0x0c0806,
    look: { exposure: 1.1, bloom: 0.6, bloomT: 0.78, vig: 0.55, sat: 1.04, con: 1.07, lift: [0.01, 0.006, 0.004] },
    sun: { dir: [0.3, 1, 0.6], col: 0xffe0c0, I: 0.2, c: [-0.5, 1, -0.5], r: 4 }, hemi: { sky: 0x8a6a50, ground: 0x2a1a10, I: 0.35 }, fill: { col: 0xffc890, I: 0.15, dir: [0, 0.3, -1] }, rim: { col: 0xffc890, str: 0.55 }, hand: 0.006,
    update(t) {
      const sir = smr(t, K.descoberto - 0.25, K.descoberto) * (1 - smr(t, K.rosto, K.rosto + 0.6)), ph = Math.floor(t * 5) % 2;
      sirR.intensity = 3.5 * sir * (ph ? 1 : 0.15); sirB.intensity = 3.5 * sir * (ph ? 0.15 : 1);
      // relógio volta no tempo no "continuar"
      const rew = smr(t, K.continuar - 0.2, K.tranquilo + 0.4); clock.set(19.5 + (t - a) / 60 - rew * 1.2);
      // a família: a esposa serve a tigela, o filho vira a cabeça
      [esposa, filho].forEach((s, i) => { restPose(s); sitPose(s, 1, { seatY: 0.16, lean: 0.05 }); idle(s, t, 20 + i, 0.6); });
      const serve = act(t, K.esposa - 0.2, K.esposa + 0.6, 0.1, 0.05) * (1 - smr(t, K.filho + 0.5, K.filho + 1.0));
      esposa.updateMatrixWorld(true); const bowl = V3(-0.12 + 0.3 * clamp(serve), 0.43, -2.2);
      armIK(esposa, 1, bowl.clone().add(V3(0, 0.05, 0.05)), V3(-0.6, 0.3, -1.6), clamp(serve * 1.3)); armIK(esposa, 0, bowl.clone().add(V3(0, 0.05, -0.05)), V3(-0.6, 0.3, -2.8), clamp(serve * 1.3));
      tigela.position.copy(bowl).add(V3(0, -0.01, 0)); tigS.position.set(bowl.x, bowl.y - 0.01, 0);
      [[esposa, shE], [filho, shF]].forEach(([src, d]) => { copyPose(src, d); d.position.set(src.position.x, 0, 0); d.visible = true; });
      const look = act(t, K.filho - 0.2, K.filho + 0.4, 0.1, 0.05); filho.userData.neck.rotation.y += 0.6 * clamp(look); filho.userData.head.rotation.x -= 0.1 * clamp(look);
      // o homem
      restPose(p); idle(p, t, 8, 0.6);
      const walkK = smr(t, tGo, tGo + 0.05), dd = andarAte(t, tGo, tOpen, DG, 0.6);
      if (t < tGo) { p.position.copy(P0); p.rotation.set(0, -Math.PI / 2 + 0.25 * smr(t, tTurn, tTurn + 0.6) * 0, 0); standFeet(p); }
      else gait(p, dd, { from: [P0.x, 0, P0.z], path: (d) => { const k = clamp(d / DG); return [P0.x + 0.55 * k, P0.z - 1.15 * k, lerp(-Math.PI / 2, Math.PI, sm(clamp(d / 0.6)))]; }, step: LG, amt: 0.9 });
      // pega a máscara (mão direita), leva ao rosto e encaixa; vira a cabeça para a porta
      const grab = act(t, tPick, tPick + 0.5, 0.1, 0.05), wear = smr(t, tPick + 0.55, tWear);
      u.head.updateMatrixWorld(true);
      const onFace = wear >= 1;
      if (!onFace) { const hold = MASK0.clone().lerp(u.head.localToWorld(V3(0, 0.11, 0.22)), sm(wear)); mask.position.copy(hold); const q = new THREE.Quaternion(); u.head.getWorldQuaternion(q); const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)); mask.quaternion.copy(q0.slerp(q, sm(wear))); mask.scale.setScalar(1); if (mask.parent !== g) g.add(mask); }
      else if (mask.parent !== u.head) { u.head.add(mask); }
      if (onFace) { mask.position.set(0, 0, 0.012); mask.quaternion.identity(); mask.scale.set(1.04, 1.02, 1.08); }
      const reach = clamp(grab) * (1 - smr(t, tWear, tWear + 0.4));
      if (reach > 0.001) { const hp = onFace ? u.head.localToWorld(V3(0.04, 0.11, 0.16)) : mask.getWorldPosition(V3()).add(V3(0.02, 0, 0.05)); armIK(p, 0, hp, wpos(u.chest).add(V3(0, -0.4, 0.8)), reach); curlHand(u.hands[0], 0.5 * reach); if (wear > 0.2) { armIK(p, 1, hp.clone().add(V3(0, 0, -0.12)), wpos(u.chest).add(V3(0, -0.4, -0.8)), reach * 0.8); } }
      const tc = act(t, tWear + 0.05, tWear + 0.6, 0.1, 0.06) * (1 - smr(t, K.casa8 - 0.5, K.casa8)), tl = act(t, K.casa8 - 0.45, K.casa8 + 0.2, 0.1, 0.05) * (1 - walkK);
      if (tc > 0.001) { lookAtW(p, V3(-0.3, 1.55, 1.8), clamp(tc), 1.4); u.chest.rotation.y -= 0.25 * clamp(tc); }
      if (tl > 0.001) lookAtW(p, V3(0.5, 1.3, -1.9), clamp(tl), 1.2);
      // abre a porta de papel da direita (desliza) no fim
      const op = act(t, tOpen, tOpen + 0.7, 0.06, 0.04); panels[2].position.x = 0.5 + 0.95 * clamp(op);
      if (op > 0.01) { armIK(p, 0, V3(panels[2].position.x - 0.45, 1.05, -1.9), wpos(u.chest).add(V3(0.6, -0.5, 0.4)), clamp(op * 2) * (1 - smr(t, tOpen + 0.8, tOpen + 1.2))); }
      back.intensity = 3.0 + 1.5 * clamp(op);
      molaHomem(p, t, (tt) => { const d2 = andarAte(tt, tGo, tOpen, DG, 0.6), k = clamp(d2 / DG); return [P0.x + 0.55 * k, 1.3, P0.z - 1.15 * k]; });
    },
    cam(t) {
      return path2(t, [
        [a, [0.6, 1.6, 2.6], [-1.3, 1.2, 0.2], 40],
        [K.roubou + 0.2, [-1.5, 1.62, 1.5], [-1.45, 1.52, 0.2], 34],
        [K.rosto + 0.9, [-0.85, 1.72, 1.55], [-1.3, 1.95, 0.25], 34],
        [K.casa8 + 0.3, [0.9, 1.45, 2.1], [0.0, 1.0, -2.0], 38],
        [K.filho + 0.3, [0.75, 1.4, 1.9], [0.15, 0.9, -2.2], 37],
        [b, [0.45, 1.55, 2.6], [-0.3, 1.0, -2.0], 40],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 10 · o beco das almas: viela à noite, lanternas, chão molhado; ele olha pra trás e mãos de luz o arrastam para o escuro; depois a câmera sobe até o céu
function maoFantasma(g, mat) {
  const a = grp(g); const fore = mesh(cap(0.045, 1, 4, 10), mat, 0, 0.5, 0, a); fore.castShadow = false;
  const hd = grp(a, 0, 1.0, 0); mesh(sph(1, 12, 10), mat, 0, 0.05, 0, hd).scale.set(0.045, 0.06, 0.022);
  const fs = [-0.025, -0.008, 0.009, 0.026].map((x) => { const f = grp(hd, x, 0.1, 0); mesh(cap(0.009, 0.05, 3, 6), mat, 0, 0.03, 0, f); return f; });
  const th = grp(hd, 0.04, 0.04, 0.01); th.rotation.z = -0.8; mesh(cap(0.01, 0.04, 3, 6), mat, 0, 0.025, 0, th);
  return { a, fore, hd, fs };
}
function maoPoe(m, base, tip, curl) {
  const d = tip.clone().sub(base), L = Math.max(0.05, d.length());
  m.a.position.copy(base); m.a.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize());
  m.fore.scale.set(1, L / 1.0, 1); m.fore.position.y = L / 2; m.hd.position.y = L;
  m.fs.forEach((f) => (f.rotation.x = -curl * 1.4));
}
addSet("s10-beco", (g) => {
  const [a, b] = T.sc["s10-beco"];
  const dome = skyDome(g, { top: 0x02040c, mid: 0x0a1028, hor: 0x1a1c30, ground: 0x02030a, exp: 0.6, sunDir: [0.1, 0.4, -1], sunCol: 0xc8d8ff, sunI: 0.0, disk: 0.5, cov: 0.6, cloudA: 0.5, cloudLit: 0x5a6a90, cloudSh: 0x10182a, stars: 1.0, cloudScale: 0.14 });
  lua(g, [-8, 60, -150], 12);
  cidadeLonge(g, -330, 60, { hmax: 62, span: 820 });
  // chão molhado com poças; prédios dos dois lados com janelas, placas, canos, ar-condicionado
  const wetT = canvasTex(512, 512, (c, w, h) => { c.fillStyle = "#1c1c22"; c.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { c.fillStyle = "rgba(8,8,12,.85)"; c.beginPath(); c.ellipse(hash(i) * w, hash(i * 3) * h, 20 + hash(i * 5) * 60, 10 + hash(i * 7) * 30, hash(i) * 3, 0, 7); c.fill(); } for (let i = 0; i < 800; i++) { c.fillStyle = `rgba(90,90,100,${hash(i) * 0.25})`; c.fillRect(hash(i * 3) * w, hash(i * 5) * h, 2, 2); } });
  const fl = mesh(new THREE.PlaneGeometry(3.4, 40), SM(0xffffff, { map: rep(wetT, 1, 10), roughness: 0.16, metalness: 0.35 }), 0, 0, -12, g); fl.rotation.x = -Math.PI / 2;
  const bldTex = (c1, seed) => canvasTex(256, 512, (c, w, h) => { c.fillStyle = c1; c.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(0,0,0,${hash(i + seed) * 0.12})`; c.fillRect(hash(i * 3 + seed) * w, hash(i * 5 + seed) * h, 6, 6 + hash(i * 7) * 30); } for (let y = 60; y < h; y += 110) for (let x = 30; x < w - 40; x += 90) { const lit = hash2(x + seed, y) > 0.72; c.fillStyle = lit ? "#ffcf8a" : "#141820"; c.fillRect(x, y, 50, 60); c.fillStyle = "#3a3a40"; c.fillRect(x - 3, y + 60, 56, 5); } });
  const signs = ["居酒屋", "スナック", "ラーメン", "麻雀", "BAR", "喫茶"];
  [-1, 1].forEach((k) => { for (let i = 0; i < 6; i++) { const z = 3 - i * 4.2, h = 6 + hash(i * 7 + k) * 5; const m = mesh(box(3, h, 4.1), SM(0xffffff, { map: bldTex(["#5a5450", "#4a4e54", "#6a5a4a", "#545a50"][(i + (k > 0 ? 1 : 0)) % 4], i * 13 + k), roughness: 0.9 }), k * 3.2, h / 2, z, g);
      const sg = canvasTex(64, 256, (c, w, h2) => { c.fillStyle = ["#c81e2a", "#1a1a1a", "#f2e8d0", "#2a4a8a"][(i + k + 4) % 4]; c.fillRect(0, 0, w, h2); c.fillStyle = (i + k) % 4 === 2 ? "#1a1a1a" : "#fff"; c.font = "700 46px sans-serif"; c.textAlign = "center"; const s = signs[(i * 2 + (k > 0 ? 1 : 0)) % signs.length]; [...s].forEach((ch, j) => c.fillText(ch, w / 2, 52 + j * 52)); }, { redraw: true });
      const sp = mesh(box(0.06, 1.2, 0.34), new THREE.MeshStandardMaterial({ color: 0xffffff, map: sg, emissive: 0xffffff, emissiveMap: sg, emissiveIntensity: 0.55, roughness: 0.5 }), k * 1.62, 2.6 + hash(i) * 1.2, z + 1.0, g);
      mesh(box(0.5, 0.36, 0.3), SM(0xd0ccc4, { roughness: 0.6 }), k * 1.52, 0.9 + hash(i * 3) * 1.8, z - 0.8, g);
      mesh(cyl(0.04, 0.04, h, 8), SM(0x5a5a5e, { metalness: 0.5 }), k * 1.66, h / 2, z - 1.6, g); } });
  // lanternas de papel (apagam uma a uma conforme ele é arrastado), fios por cima, vapor de um respiro
  const lanTex = canvasTex(64, 128, (c, w, h) => { c.fillStyle = "#ff3a2a"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(0,0,0,.2)"; for (let y = 8; y < h; y += 12) c.fillRect(0, y, w, 2); c.fillStyle = "#fff"; c.font = "700 34px sans-serif"; c.textAlign = "center"; c.fillText("祭", w / 2, h / 2 + 12); });
  const lans = []; for (let i = 0; i < 8; i++) { const k = i % 2 ? 1 : -1, z = 2.4 - i * 1.6; const lg = grp(g, k * 1.35, 2.5, z); mesh(cyl(0.004, 0.004, 0.4, 4), SM(0x1a1a1a), 0, 0.3, 0, lg);
    const lm = new THREE.MeshStandardMaterial({ map: lanTex, emissive: 0xff6a3a, emissiveMap: lanTex, emissiveIntensity: 1.2, roughness: 0.8 });
    const body = mesh(sph(0.2, 16, 12), lm, 0, 0, 0, lg); body.scale.set(1, 1.35, 1); mesh(cyl(0.12, 0.12, 0.04, 12), SM(0x1a1a1a), 0, 0.27, 0, lg); mesh(cyl(0.12, 0.12, 0.04, 12), SM(0x1a1a1a), 0, -0.27, 0, lg);
    const L_ = i < 5 ? new THREE.PointLight(0xff7a4a, 1.6, 5, 1.6) : null; if (L_) lg.add(L_); const gl_ = glowSprite(0xff7a4a, 0.9, 0.5); lg.add(gl_); lans.push({ lg, lm, L: L_, gl: gl_, z }); }
  for (let i = 0; i < 6; i++) fio(g, [-1.6, 5.5 + hash(i) * 1.5, 2 - i * 3.3], [1.6, 5.2 + hash(i * 3) * 1.5, 1.2 - i * 3.3], 0.3, 0.01);
  const vapor = steam(g, { origin: [1.35, 0.1, -3.6], n: 22, size: 0.5, rise: 0.4, grow: 2.2, opacity: 0.16, life: 4.5, spread: 0.2, wind: [-0.05, 0, 0.04], color: 0xb8c0d0 });
  const fundo = glowSprite(0x6a5aa8, 6, 0.25, ADD); fundo.position.set(0, 1.6, -15); g.add(fundo);
  // o homem e as mãos de luz
  const p = semRosto(); g.add(p); const u = p.userData;
  const ghostM = new THREE.MeshStandardMaterial({ color: 0xcfd6ff, emissive: 0xa8b4ff, emissiveIntensity: 0.9, transparent: true, opacity: 0.78, roughness: 0.4, depthWrite: false });
  const maos = []; for (let i = 0; i < 12; i++) maos.push(maoFantasma(g, ghostM));
  const ghostL = new THREE.PointLight(0xa8b4ff, 0, 5, 1.5); g.add(ghostL);
  const Z0 = 2.4, D = 2.6, L = gaitFit(D, 0.62), tStop = K.morreu - 0.05, tLook = K.morreu + 0.2, tGrab = K.alma - 0.1, tDrag = K.arrastada - 0.05, tGone = K.paz9b + 0.15;
  const distF = (t) => andarAte(t, a - 0.6, tStop, D, 1.2);
  const dragZ = (t) => { const k = clamp((t - tDrag) / (tGone - tDrag)); return Z0 - D - 9.5 * E.in(k) - 0.5 * k; };
  const ATT = [["ankle", 0, [0, 0, 0]], ["ankle", 1, [0, 0, 0]], ["knee", 0, [0, 0, 0.05]], ["knee", 1, [0, 0, 0.05]], ["wr", 0, [0, 0, 0]], ["wr", 1, [0, 0, 0]], ["hips", -1, [0.1, 0, -0.1]], ["hips", -1, [-0.1, 0, -0.1]], ["chest", -1, [0.12, 0.1, -0.12]], ["chest", -1, [-0.12, 0.1, -0.12]], ["spine", -1, [0, 0, -0.14]], ["chest", -1, [0, 0.25, -0.1]]];
  return {
    bg: 0x04040a, fog: [5, 17], fogCol: 0x05050c, dome,
    look: { exposure: 1.15, bloom: 0.9, bloomT: 0.6, bloomR: 0.6, vig: 0.55, sat: 1.05, con: 1.08, lift: [0.008, 0.006, 0.022] },
    sun: { dir: [0.2, 0.9, -0.4], col: 0x8a9ad8, I: 0.45, c: [0, 0, -1], r: 8 }, hemi: { sky: 0x2a3050, ground: 0x0a0a10, I: 0.35 }, fill: { col: 0x6a70c0, I: 0.1 }, rim: { col: 0xd0c8ff, str: 0.6 }, hand: 0.009,
    update(t) {
      dome.userData.u.uOff.value.set(t * 0.002, 0);
      vapor.upd(t, 1);
      const sky = smr(t, tGone, K.voce + 1.5); scene.fog.near = lerp(5, 60, sky); scene.fog.far = lerp(17, 520, sky); scene.fog.color.setHex(0x05050c).lerp(_col.setHex(0x0a1024), sky);
      const zNow = t < tDrag ? Z0 - distF(t) : dragZ(t);
      lans.forEach((ln, i) => { const off = smr(t, tDrag + 0.25 + i * 0.32, tDrag + 0.4 + i * 0.32); const fl = 1 - off; ln.lm.emissiveIntensity = 1.2 * fl * (0.9 + 0.1 * noise1(t * 7 + i)); if (ln.L) ln.L.intensity = 1.6 * fl; ln.gl.material.opacity = 0.5 * fl; ln.lg.rotation.z = Math.sin(t * 1.3 + i) * 0.05; });
      restPose(p);
      if (t < tDrag) {
        gait(p, distF(t), { from: [0, 0, Z0], ang: Math.PI, step: L, amt: 0.9 });
        idle(p, t, 12, 0.3 + 0.7 * clamp((t - tStop) / 0.4));
        // olha pra trás por cima do ombro (a regra do beco)
        const lk = act(t, tLook, tLook + 0.65, 0.12, 0.08);
        if (lk > 0) { u.spine.rotation.y += 0.4 * lk; u.chest.rotation.y += 0.55 * lk; u.neck.rotation.y += 0.55 * lk; u.head.rotation.y += 0.35 * lk; }
      } else {
        // arrastado para trás: pés fora do chão, corpo inclinado, braços estendidos para a câmera
        const k = clamp((t - tDrag) / 0.5);
        p.position.set(Math.sin(t * 3) * 0.04 * k, 0.12 * k, zNow); p.rotation.set(0, Math.PI, 0);
        pose(p, { spine: [-0.45 * k, 0.3, 0], chest: [-0.2 * k, 0.3, 0], neck: [-0.25 * k, 0.4, 0], legR: [0.25 * k, 0, 0, 0.3 * k, 0.4], legL: [0.1 * k, 0, 0, 0.5 * k, 0.4], armR: [-2.3 * k, 0, -0.4, -0.2], armL: [-2.0 * k, 0, 0.5, -0.4], handR: 0.2, handL: 0.4 }, 1);
        u.sh.forEach((s_, i) => (s_.rotation.x += Math.sin(t * 9 + i * 2) * 0.12 * k));
      }
      // mãos: brotam do chão em volta dele, agarram tornozelos, joelhos, pulsos, cintura e paletó, e puxam
      p.updateMatrixWorld(true);
      const rise = smr(t, tGrab - 0.15, tGrab + 0.45), dragK = smr(t, tDrag, tDrag + 0.6);
      maos.forEach((m, i) => {
        const [part, idx, off] = ATT[i], node = idx >= 0 ? u[part][idx] : u[part];
        const tip = node.localToWorld(V3(...off));
        const sideX = (i % 2 ? 1 : -1) * (0.35 + hash(i) * 0.6), base = V3(sideX * (1 - dragK * 0.4), 0, zNow - 0.4 - hash(i * 3) * 0.8 - dragK * (0.8 + hash(i) * 1.2));
        const reachTip = base.clone().lerp(tip, clamp((rise - i * 0.03) * 1.2));
        m.a.visible = rise > 0.02 && t < tGone + 0.6;
        maoPoe(m, base, reachTip, clamp(rise * 1.6 - 0.6));
      });
      ghostM.opacity = 0.78 * rise * (1 - smr(t, tGone - 0.3, tGone + 0.5)); ghostM.emissiveIntensity = 0.9 + 0.3 * noise1(t * 6);
      ghostL.position.set(0, 0.8, zNow - 0.3); ghostL.intensity = 2.2 * rise * (1 - smr(t, tGone - 0.3, tGone + 0.5));
      p.visible = t < tGone + 0.5;
      molaHomem(p, t, (tt) => [0, 1.3, tt < tDrag ? Z0 - distF(tt) : dragZ(tt)]);
    },
    cam(t) {
      return path2(t, [
        [a, [0.55, 1.65, 6.2], [0, 1.3, 0.0], 40],
        [tStop, [0.42, 1.58, 3.2], [0, 1.35, -0.6], 36],
        [tLook + 0.5, [0.6, 1.52, 1.85], [-0.05, 1.5, -0.25], 34],
        [tDrag + 1.4, [0.3, 1.4, 1.75], [0, 1.0, -4.2], 38],
        [tGone, [0.25, 1.6, 1.4], [0, 1.0, -9.0], 38],
        [K.voce + 1.2, [0.2, 6.5, 1.5], [0, 8.0, -30], 42],
        [b, [0.15, 12.5, 0.5], [-2, 30, -120], 42],
      ]);
    },
  };
});
