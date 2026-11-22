// ================================================================ Gyro: lugares (2) NGL, laboratório da D², ninho, Cidade Meteoro, penhasco do Gon
// placa com texto em textura de canvas
function placaTexto(txt, w = 1.6, h = 0.5, cor = "#f2e6c8", fundo = "#5a3a22") { const c = document.createElement("canvas"); c.width = 512; c.height = 160; const x = c.getContext("2d");
  x.fillStyle = fundo; x.fillRect(0, 0, 512, 160); x.strokeStyle = "#2a1a10"; x.lineWidth = 10; x.strokeRect(5, 5, 502, 150); x.fillStyle = cor; x.font = "900 96px serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, 256, 86);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return mesh(box(w, h, 0.06), [LPmat(0x5a3a22), LPmat(0x5a3a22), LPmat(0x5a3a22), LPmat(0x5a3a22), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), LPmat(0x5a3a22)]); }
// casa de palafita da NGL: plataforma em estacas, tábuas, telhado de palha em cone, escada
function casaPalafita(g, x, z, ry = 0, o = {}) { const c = grp(g, x, 0, z); c.rotation.y = ry; const s = o.s ?? 1, quebrada = !!o.quebrada;
  const pk = texPlanks(quebrada ? [60, 46, 36] : [130, 96, 62], quebrada ? [44, 34, 28] : [104, 74, 48]), pm = SM(0xffffff, { map: pk.map, normalMap: pk.normalMap, roughness: 0.95 }), est = LPmat(quebrada ? 0x2a2420 : 0x6a4a30, { rough: 0.9 });
  [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]].forEach(([a, b]) => mesh(cyl(0.08, 0.1, 1.2 * s, 6), est, a * 1.3 * s, 0.6 * s, b * 1.1 * s, c));
  mesh(box(3.0 * s, 0.12, 2.6 * s), pm, 0, 1.2 * s, 0, c); mesh(box(2.4 * s, 1.8 * s, 2.0 * s), pm, 0, 2.1 * s, 0, c);
  mesh(box(0.6 * s, 1.2 * s, 0.05), LPmat(0x2a1a10), 0, 1.86 * s, 1.0 * s + 0.03, c);
  const jan = mesh(new THREE.PlaneGeometry(0.45 * s, 0.4 * s), new THREE.MeshBasicMaterial({ color: o.luz ? 0xffb060 : 0x1a140e }), 0.8 * s, 2.3 * s, 1.0 * s + 0.03, c); jan.castShadow = false;
  const palha = LPmat(quebrada ? 0x3a3024 : 0xc8a860, { rough: 1 }); const tel = mesh(new THREE.ConeGeometry(2.3 * s, 1.5 * s, 8, 1, true), palha, 0, 3.7 * s, 0, c); tel.material.side = THREE.DoubleSide;
  if (quebrada) { tel.rotation.set(0.35, 0, 0.25); tel.position.y -= 0.35 * s; tel.scale.set(1, 0.8, 1); }
  for (let i = 0; i < 6; i++) { const d = mesh(box(0.5 * s, 0.05, 0.12), est, 0, 0.15 + i * 0.2 * s, 1.5 * s + i * 0.06, c); } // escada
  return c; }
function cerca(g, x0, z0, x1, z1, cor = 0x7a5a3a) { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.2), m = LPmat(cor, { rough: 0.95 }), ang = Math.atan2(x1 - x0, z1 - z0);
  for (let i = 0; i <= n; i++) mesh(box(0.08, 0.9, 0.08), m, x0 + (x1 - x0) * i / n, 0.45, z0 + (z1 - z0) * i / n, g);
  [0.35, 0.7].forEach((y) => { const r = mesh(box(0.04, 0.06, Math.hypot(x1 - x0, z1 - z0)), m, (x0 + x1) / 2, y, (z0 + z1) / 2, g); r.rotation.y = ang; }); }
function horta(g, x, z, nx = 5, nz = 6) { const terra = LPmat(0x4a3220, { rough: 1 }), fol = LPmat(0x4a8a3a, { rim: 0.4 });
  for (let i = 0; i < nx; i++) { mesh(box(0.5, 0.12, nz * 0.45), terra, x + i * 0.75, 0.06, z, g); for (let k = 0; k < nz; k++) { const f = mesh(new THREE.IcosahedronGeometry(0.12 + hash(i * 7 + k) * 0.06, 0), fol, x + i * 0.75, 0.2, z - nz * 0.22 + k * 0.45 + 0.2, g); f.scale.y = 0.7; } } }
function poco(g, x, z) { const p = grp(g, x, 0, z); mesh(cyl(0.6, 0.65, 0.7, 12), LPmat(0x8a8478, { rough: 1 }), 0, 0.35, 0, p); mesh(cyl(0.5, 0.5, 0.02, 12), new THREE.MeshBasicMaterial({ color: 0x0a0c10 }), 0, 0.68, 0, p);
  [-1, 1].forEach((k) => mesh(box(0.08, 1.5, 0.08), LPmat(0x5a3a24), k * 0.55, 1.2, 0, p)); const t = mesh(new THREE.ConeGeometry(0.9, 0.5, 4), LPmat(0xc8a860), 0, 2.15, 0, p); t.rotation.y = Math.PI / 4; return p; }

// ---------------------------------------------------------------- NGL: vila de madeira na clareira da floresta, sem máquinas; alçapão escondido
// área livre: x -2..2, z -1..5; alçapão em (1.6, 0, 1.2); câmera olhando para -z
function vilaNGL(g, o = {}) {
  const noite = !!o.noite, dest = !!o.destruida;
  skyDome(g, noite ? { top: 0x04050c, mid: 0x14182a, hor: dest ? 0x6a2a1a : 0x2a3448, ground: 0x0a0a08, sunDir: [0.3, 0.3, -1], sunCol: 0xc8d8ff, sunI: 0.3, disk: 0.5, cov: 0.4, cloudLit: dest ? 0x8a3a2a : 0x3a4a6a, cloudSh: 0x08080e }
    : { top: 0x2a6ac8, mid: 0x7ab0e0, hor: 0xd8ecf8, ground: 0x4a5a3a, sunDir: [0.4, 0.5, -0.6], sunCol: 0xfff0d0, sunI: 1.0, disk: 1.2, cov: 0.4 });
  const hf = (x, z) => { const r = Math.hypot(x, z + 4); return r < 16 ? 0 : (r - 16) * 0.08 + Math.sin(x * 0.2) * 0.3 * Math.min(1, (r - 16) / 6); };
  terrain(g, { size: 300, segs: 90, grassA: dest ? 0x2a2a1e : 0x4a7a32, grassB: dest ? 0x3a3424 : 0x6a9a3e, dirt: 0x6a5032, rock: 0x6a6458, h: hf, path: (x, z) => clamp(1 - Math.abs(x - Math.sin(z * 0.15) * 0.6) / 1.1) * (z < 6 && z > -20 ? 1 : 0) });
  [[-5.5, -3, 0.5], [5.8, -4, -0.6], [-6.5, -10, 0.3], [6.5, -11, -0.4], [0.5, -14, 0], [-10, 3, 1.2], [10, 2, -1.1]].forEach(([x, z, r], i) => casaPalafita(g, x, z, r, { quebrada: dest && i % 3 !== 1, luz: noite && !dest && i % 2 === 0 }));
  if (!dest) { horta(g, -4.5, 3.5, 4, 5); horta(g, 3.2, -8, 3, 4); cerca(g, -5, 6, -1.8, 6); cerca(g, 2.4, 6, 5.5, 6); poco(g, 3.8, 1.5); }
  const arco = grp(g, 0, 0, 7.5); [-1, 1].forEach((k) => mesh(cyl(0.12, 0.14, 3.4, 7), LPmat(0x5a3a24), k * 1.6, 1.7, 0, arco)); mesh(box(3.8, 0.18, 0.2), LPmat(0x5a3a24), 0, 3.3, 0, arco);
  const pl = placaTexto("N G L", 1.7, 0.5); pl.position.set(0, 2.95, 0.05); pl.rotation.y = Math.PI; arco.add(pl); if (dest) arco.rotation.z = 0.12;
  for (let i = 0; i < 18; i++) { const an = hash(i * 1.3) * 6.28, r = 13 + hash(i * 2.1) * 7, x = Math.sin(an) * r, z = -4 - Math.cos(an) * r; if (z > 6) continue; arvoreRef(g, x, z, 0.9 + hash(i) * 0.5); }
  arvoresLonge(g, 160, 22, 80, hf, { c1: noite ? 0x0e1a10 : 0x2e6a26, c2: noite ? 0x16241a : 0x4a8a34, s: 1.6 });
  montanhasLonge(g, 200, 14, noite ? 0x0c1018 : 0x5a7a8a, 30);
  // alçapão de madeira no chão, perto da casa da direita
  const alc = grp(g, 1.6, 0.02, 1.2), tampa = grp(alc, -0.5, 0, 0); mesh(box(1.0, 0.06, 1.0), SM(0xffffff, { map: texPlanks([96, 70, 44], [76, 54, 34]).map }), 0.5, 0.03, 0, tampa);
  const buraco = mesh(new THREE.PlaneGeometry(0.96, 0.96), new THREE.MeshBasicMaterial({ color: 0x0a0410 }), 0, 0.005, 0, alc); buraco.rotation.x = -Math.PI / 2; buraco.castShadow = false;
  const roxo = glowSprite(0xa050ff, 2.2, 0); roxo.position.set(0, 0.3, 0); alc.add(roxo);
  const fogos = dest ? [[-5.5, -3], [6.5, -11], [-10, 3]].map(([x, z]) => fogoLonge(g, x, z, 0.9)) : [];
  const pa = dustPts(200, [-10, 10, 0.2, 4, -14, 6], noite ? (dest ? 0xff8a4a : 0x9ac8ff) : 0xfff4c8, 0.035, 0.6); g.add(pa);
  return { alc, tampa, roxo, upd(t, abre = 0) { tampa.rotation.z = abre * 1.9; roxo.material.opacity = 0.5 * abre; floatDust(pa, t, 0.4, 0.2); fogos.forEach((f) => f.update(t)); } };
}

// ---------------------------------------------------------------- laboratório subterrâneo da D²: bunker de concreto, mesas, frascos, pó roxo
// sala x -4..4, z -7..3, pé-direito 3; escada de mão sobe em (2.5, z 2) até o alçapão
function laboratorioD2(g) {
  const bl = texBlocks([120, 118, 112], [96, 94, 90]), cm = SM(0xffffff, { map: rep(bl.map.clone(), 4, 2), normalMap: bl.normalMap, roughness: 0.95, side: THREE.BackSide });
  const sala = mesh(box(8, 3, 10), cm, 0, 1.5, -2, g); sala.castShadow = false; sala.receiveShadow = true;
  const piso = mesh(new THREE.PlaneGeometry(8, 10), LPmat(0x4a4844, { rough: 0.7 }), 0, 0.005, -2, g); piso.rotation.x = -Math.PI / 2;
  const cano = LPmat(0x5a5a5e, { metal: 0.6, rough: 0.4 }); [-2.5, -1.2, 1.8].forEach((x) => mesh(cyl(0.07, 0.07, 10, 8), cano, x, 2.8, -2, g).rotation.x = Math.PI / 2);
  const tubos = []; [-4.5, -1.5, 1.5].forEach((z, i) => { const tb = mesh(box(1.3, 0.05, 0.12), new THREE.MeshBasicMaterial({ color: 0xe8f0ff }), 0, 2.94, z, g); tb.castShadow = false; const l = new THREE.PointLight(0xd8e4ff, 4, 7, 1.4); l.position.set(0, 2.7, z); g.add(l); tubos.push({ tb, l, i }); });
  const aco = LPmat(0x9a9ca0, { metal: 0.7, rough: 0.35 }), vidro = new THREE.MeshStandardMaterial({ color: 0xe8e0ff, transparent: true, opacity: 0.35, roughness: 0.05 }), liq = new THREE.MeshBasicMaterial({ color: 0xb050ff }), po = LPmat(0xc890ff, { rim: 0.8, rough: 0.9 });
  const mesaLab = (x, z, ry) => { const m = grp(g, x, 0, z); m.rotation.y = ry; mesh(box(2.2, 0.06, 0.8), aco, 0, 0.9, 0, m); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(box(0.05, 0.9, 0.05), aco, a * 1.05, 0.45, b * 0.35, m));
    for (let i = 0; i < 4; i++) { const f = grp(m, -0.8 + i * 0.4, 0.93, -0.15 + (i % 2) * 0.2); mesh(lathe([[0.001, 0], [0.08, 0.01], [0.08, 0.06], [0.03, 0.18], [0.025, 0.26]], 10), vidro, 0, 0, 0, f); mesh(lathe([[0.001, 0], [0.075, 0.01], [0.075, 0.05], [0.05, 0.1], [0.001, 0.1]], 10), liq, 0, 0.005, 0, f); }
    [0.5, 0.85].forEach((xx) => { mesh(box(0.34, 0.03, 0.26), aco, xx, 0.945, 0.15, m); const mt = mesh(new THREE.ConeGeometry(0.11, 0.07, 9), po, xx, 0.99, 0.15, m); mt.scale.z = 0.7; }); return m; };
  mesaLab(-2.2, -3.5, Math.PI / 2); mesaLab(2.2, -3.5, -Math.PI / 2); mesaLab(0, -6, 0); mesaLab(-2.2, -0.5, Math.PI / 2);
  for (let i = 0; i < 10; i++) { const s = mesh(box(0.5, 0.3, 0.35), LPmat(0xe8e0d0, { rough: 1 }), 3.2 - (i % 2) * 0.55, 0.15 + Math.floor(i / 4) * 0.3, -6.3 + (i % 4) * 0.4, g); s.rotation.y = hash(i) * 0.3; } // sacos
  [[-3.4, -6.4], [-3.4, -5.6], [3.3, -0.5]].forEach(([x, z]) => mesh(cyl(0.3, 0.3, 0.9, 12), LPmat(0x3a4a6a, { metal: 0.4 }), x, 0.45, z, g)); // barris
  [[3.2, 1.6, 0.8], [-3.2, 1.6, 0.7]].forEach(([x, z, s]) => { for (let i = 0; i < 3; i++) mesh(box(0.7 * s, 0.5 * s, 0.6 * s), LPmat(0x7a5a3a), x, 0.25 * s + i * 0.5 * s, z, g); });
  const esc = grp(g, 2.5, 0, 2.6); [-1, 1].forEach((k) => mesh(box(0.05, 3.2, 0.05), LPmat(0x5a3a24), k * 0.22, 1.6, 0, esc)); for (let i = 0; i < 9; i++) mesh(box(0.44, 0.04, 0.05), LPmat(0x5a3a24), 0, 0.3 + i * 0.34, 0, esc);
  const facho = mesh(new THREE.CylinderGeometry(0.5, 0.7, 3, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.08, blending: ADD, depthWrite: false, side: THREE.DoubleSide }), 2.5, 1.5, 2.6, g); facho.castShadow = false;
  const nevoa = dustPts(160, [-3.6, 3.6, 0.2, 2.8, -6.8, 2.6], 0xc8a0ff, 0.025, 0.45); g.add(nevoa);
  const brilho = glowSprite(0xa050ff, 3, 0.08); brilho.position.set(0, 1.2, -3.5); g.add(brilho);
  return { tubos, nevoa, upd(t) { floatDust(nevoa, t, 0.3, 0.15); tubos.forEach((u) => { const pisca = u.i === 1 && (Math.sin(t * 17) > 0.93 || noise1(t * 3) > 0.85) ? 0.35 : 1; u.l.intensity = 4 * pisca; u.tb.material.color.setScalar(pisca > 0.5 ? 0.92 : 0.4); }); } };
}

// ---------------------------------------------------------------- ninho das formigas sobre a NGL destruída (noite, fogo)
function ninhoFormigas(g) {
  const V = vilaNGL(g, { noite: true, destruida: true });
  const terra = LPmat(0x3a2a1e, { rough: 1, rim: 0.4 }), n = grp(g, 0, 0, -38);
  mesh(lathe([[0.001, 26], [3, 25], [7, 20], [12, 12], [16, 4], [19, 0]], 14), terra, 0, 0, 0, n);
  for (let i = 0; i < 14; i++) { const a = hash(i * 1.1) * 6.28, y = 3 + hash(i * 2.3) * 18, r = 19 - y * 0.62; const b = mesh(new THREE.ConeGeometry(2 + hash(i) * 2, 4 + hash(i * 3) * 5, 7), terra, Math.sin(a) * r, y, Math.cos(a) * r, n); b.rotation.set((hash(i * 4) - 0.5) * 0.6, 0, (hash(i * 5) - 0.5) * 0.6); }
  const furos = []; for (let i = 0; i < 9; i++) { const a = -1.2 + i * 0.3, y = 4 + (i % 3) * 6, r = 19 - y * 0.62 + 0.3; const f = glowSprite(0xff9a40, 2.2, 0.55); f.position.set(Math.sin(a) * r, y, -38 + Math.cos(a) * r); g.add(f); furos.push(f); }
  return { V, furos, upd(t) { V.upd(t, 0); furos.forEach((f, i) => (f.material.opacity = 0.45 + 0.2 * noise1(t * 2 + i))); } };
}

// ---------------------------------------------------------------- Cidade Meteoro: montanhas de lixo, carcaças, fumaça, céu cinza-ocre
// monte de lixo central em (0, 0, -6) com topo plano em y ~ 3.2 para alguém ficar de pé
function cidadeMeteoro(g) {
  skyDome(g, { top: 0x3a3a44, mid: 0x8a7a6a, hor: 0xc8a888, ground: 0x2a2620, sunDir: [-0.5, 0.12, -1], sunCol: 0xffc890, sunI: 0.6, disk: 0.8, cov: 0.7, cloudLit: 0xd8b090, cloudSh: 0x4a4448 });
  terrain(g, { size: 300, segs: 80, grassA: 0x5a5248, grassB: 0x6a6052, dirt: 0x4a4238, rock: 0x5a5650, h: (x, z) => Math.max(0, Math.hypot(x, z + 4) - 14) * 0.04 });
  const cores = [0x6a5a4a, 0x4a4a50, 0x7a6a50, 0x3a3a3a, 0x8a5a3a, 0x5a6a5a, 0x6a6a6a], lix = [];
  const monte = (cx, cz, R, H, n, seed) => { mesh(lathe([[0.001, H], [R * 0.25, H * 0.98], [R * 0.6, H * 0.6], [R, 0]], 12), LPmat(0x4a4038, { rough: 1 }), cx, 0, cz, g);
    for (let i = 0; i < n; i++) { const a = hash(i * 1.7 + seed) * 6.28, u = Math.sqrt(hash(i * 2.9 + seed)), r = u * R * 0.95, y = H * (1 - Math.pow(r / R, 1.3)) * 0.98; lix.push([cx + Math.sin(a) * r, y, cz + Math.cos(a) * r, i + seed]); } };
  monte(0, -6, 4.5, 3.2, 120, 1); monte(-9, -14, 7, 6, 150, 50); monte(10, -18, 8, 7, 160, 90); monte(-22, -40, 14, 13, 120, 140); monte(24, -46, 16, 15, 120, 170); monte(0, -70, 20, 18, 100, 200);
  const geos = [box(0.6, 0.4, 0.5), box(1.0, 0.25, 0.7), cyl(0.25, 0.25, 0.8, 8), new THREE.TorusGeometry(0.3, 0.12, 6, 12), box(0.3, 0.9, 0.3)];
  geos.forEach((geo, gi) => { const L = lix.filter((l, i) => i % geos.length === gi), im = new THREE.InstancedMesh(geo, LPmat(0xffffff, { rough: 0.9, rim: 0.4 }), L.length), M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
    L.forEach(([x, y, z, s], i) => { e.set(hash(s) * 3, hash(s * 2) * 3, hash(s * 3) * 3); q.setFromEuler(e); const k = 0.7 + hash(s * 4) * 0.8; M4.compose(V3(x, y, z), q, V3(k, k, k)); im.setMatrixAt(i, M4); im.setColorAt(i, c.set(cores[Math.floor(hash(s * 5) * cores.length)])); });
    im.castShadow = im.receiveShadow = true; g.add(im); });
  const carro = (x, z, r) => { const c = grp(g, x, 0, z); c.rotation.set(0, r, 0.15); mesh(box(1.9, 0.6, 4), LPmat(0x6a3a2a, { metal: 0.3, rough: 0.8 }), 0, 0.5, 0, c); mesh(box(1.6, 0.5, 1.8), LPmat(0x5a3428), 0, 1.05, -0.2, c); };
  carro(-4.2, -1.5, 0.6); carro(4.6, -2.5, -0.9);
  const fumos = [[-9, 6, -14], [10, 7, -18], [-22, 13, -40]].map(([x, y, z]) => steam(g, { origin: [x, y, z], n: 10, size: 2, spread: 1, rise: 2.5, grow: 2.4, opacity: 0.3, life: 5, color: 0x6a6460, wind: [0.8, 0, 0] }));
  const po = dustPts(220, [-10, 10, 0.2, 5, -14, 6], 0xd8c0a0, 0.035, 0.55); g.add(po);
  return { fumos, po, topo: [0, 3.2, -6], upd(t) { floatDust(po, t, 0.6, 0.3); fumos.forEach((f) => f.upd(t, 1)); } };
}

// ---------------------------------------------------------------- penhasco de dia sobre o mar (o Gon olhando o horizonte)
// borda do penhasco em z = -2; Gon senta em (0, 0, -1.6)
function penhascoMar(g) {
  skyDome(g, { top: 0x2a74d8, mid: 0x7ab8ec, hor: 0xe0f2ff, ground: 0x4a6a8a, sunDir: [0.5, 0.45, -1], sunCol: 0xfff4d8, sunI: 1.0, disk: 1.2, cov: 0.45 });
  const top = mesh(lathe([[0.001, 0], [30, 0], [30, -40]], 24), LPmat(0x5a8a3a, { rough: 1 }), 0, 0, 30 - 2, g); // platô (meia-lua cortada pela borda)
  const pedra = LPmat(0x8a8072, { rough: 1, rim: 0.4 });
  const borda = mesh(box(60, 40, 2), pedra, 0, -20.03, -1.0, g); // topo escondido sob a grama: a borda cai direto no mar for (let i = 0; i < 14; i++) rock(g, -14 + i * 2.2, -1 - hash(i) * 2, -3.2 - hash(i * 3) * 1.2, 0.9 + hash(i * 2) * 0.8, i);
  marSimples(g, -40, 0x2a6aa8);
  const ondas = dustPts(300, [-80, 80, -39.8, -39.6, -140, -10], 0xffffff, 0.25, 0.5); g.add(ondas);
  arvoreRef(g, -3.2, 1.5, 1.6); arvoreRef(g, 4.5, 4, 1.2); const grama = gramaAlta(g, 900, [-8, 8, -2, 8], () => 0, { base: 0x3a6a2a, ponta: 0xb8d070, w: 0.03, h: 0.4, mask: (x, z) => Math.hypot(x, z + 1.6) > 0.6 });
  const barco = grp(g, -30, -40, -90); mesh(box(1.6, 0.6, 5), LPmat(0xe8e0d0), 0, 0.3, 0, barco); mesh(cyl(0.06, 0.06, 4, 5), LPmat(0x5a3a24), 0, 2.3, 0, barco); const vela = mesh(new THREE.PlaneGeometry(2, 3), LPmat(0xf4f0e8, { side: THREE.DoubleSide }), 0, 2.6, 0.9, barco); vela.rotation.y = Math.PI / 2;
  const gaivotas = []; for (let i = 0; i < 5; i++) { const s = mesh(new THREE.ConeGeometry(0.12, 0.6, 3), LPmat(0xffffff), 0, 0, 0, g); s.rotation.z = Math.PI / 2; gaivotas.push(s); }
  return { grama, upd(t) { floatDust(ondas, t, 0.05, 0.1); barco.position.x = -30 + t * 0.4; gaivotas.forEach((s, i) => { const a = t * 0.3 + i * 1.3; s.position.set(Math.sin(a) * (8 + i * 2) - 4, 6 + i * 0.8 + Math.sin(t * 2 + i) * 0.3, -14 - i * 3 + Math.cos(a) * 3); s.rotation.y = -a; }); } };
}
