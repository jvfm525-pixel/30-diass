// ================================================================ vídeo: Subaru · lugares (capital ao entardecer, jardim da mansão, vazio da Satella, colina do chá, campo dos marcos, terraço ao amanhecer)
// regra: tudo apoiado no chão; nada solto no ar, a não ser luz, poeira, pétalas e fumaça.

// ---------------------------------------------------------------- pessoas da rua (andam em linha; somem fora do quadro quando dão a volta)
function passantes(g, n, o = {}) { const cores = [0x6a4a3a, 0x3a5a6a, 0x7a6a3a, 0x5a3a5a, 0x4a6a4a, 0x8a5a3a, 0x3a3a5a, 0x6a6a6a];
  return Array.from({ length: n }, (_, i) => { const p = pessoaLP({ seed: 600 + i, pele: [0xf8dcc0, 0xeac0a0, 0xf4d4b8, 0xd8a888][i % 4], olho: "#4a3a2a", olhoAlt: 0.9, roupa: cores[i % cores.length], calca: cores[(i + 3) % cores.length], botoes: false, sobrancelha: 0x3a2a20, scale: 0.92 + hash(i * 7) * 0.12,
      cabelo: { ...CABELOS_AOT.kruger, cor: [0x3a2a20, 0x8a6a40, 0x1a1a1e, 0x6a4a30][i % 4], seed: 620 + i } }); g.add(p);
    const ida = i % 2 ? 1 : -1, x = (o.xs ?? [-2.2, -1.2, 1.0, 2.0])[i % 4] + (hash(i) - 0.5) * 0.4, L = o.L ?? 36, v = 1.0 + hash(i * 3) * 0.35, off = hash(i * 5) * L, sp = sombraPe(g, p);
    return { p, upd(t) { const d = (off + t * v) % L, z0 = ida > 0 ? -L / 2 : L / 2; gait(p, d, { from: [x, 0, z0], ang: ida > 0 ? 0 : Math.PI, step: 0.62 }); rostoLP(p, t, { boca: "linha", palpebra: 0.9 }); sp(0); } }; }); }

// ---------------------------------------------------------------- 1/2 · rua da capital ao entardecer, com a barraca de frutas
function barracaFrutas(g, x, z, ry = 0) { const b = grp(g, x, 0, z); b.rotation.y = ry; const mad = LPmat(0x7a5232, { rim: 0.4 }), madE = LPmat(0x4a3020, { rim: 0.3 });
  mesh(box(2.4, 0.08, 1.0), mad, 0, 0.86, 0, b); [[-1.1, -0.42], [1.1, -0.42], [-1.1, 0.42], [1.1, 0.42]].forEach(([a, c]) => mesh(box(0.08, 0.86, 0.08), madE, a, 0.43, c, b));
  [[-1.1, -0.45], [1.1, -0.45]].forEach(([a, c]) => mesh(box(0.08, 2.4, 0.08), madE, a, 1.2, c, b));
  const lona = canvasTex(128, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#e8e0c8" : "#c8402a"; c.fillRect(i * 16, 0, 16, h); } });
  const tl = mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshStandardMaterial({ map: lona, side: THREE.DoubleSide, roughness: 0.9 }), 0, 2.2, 0.05, b); tl.rotation.x = -Math.PI / 2 + 0.38;
  const caixas = [[-0.75, 0.2, 0xc83a2a], [0, 0.2, 0xe8a030], [0.75, 0.2, 0x8ac04a], [-0.4, -0.2, 0xc83a2a], [0.4, -0.2, 0xd8c040]];
  caixas.forEach(([cx, cz, cor], i) => { mesh(box(0.6, 0.14, 0.36), madE, cx, 0.97, cz, b); const fr = []; for (let k = 0; k < 12; k++) fr.push([cx - 0.22 + (k % 4) * 0.145, 1.08 + (k > 7 ? 0.06 : 0), cz - 0.1 + Math.floor((k % 8) / 4) * 0.13 + (k > 7 ? 0.065 : 0)]);
    instG(b, sph(0.07, 10, 8), LPmat(cor, { rim: 0.5, liso: true }), fr); });
  [[-1.6, 0.5], [1.55, 0.6], [-1.5, -0.3]].forEach(([a, c], i) => mesh(box(0.5, 0.5, 0.5), madE, a, 0.25, c, b).rotation.y = i * 0.4);
  return b; }
function ruaCapital(g) {
  skyDome(g, { top: 0x2a3a7a, mid: 0xa86a8a, hor: 0xffb070, ground: 0x3a2a24, sunDir: [-0.4, 0.12, -1], sunCol: 0xffc080, sunI: 1.0, disk: 1.4, cov: 0.45, cloudLit: 0xffb08a, cloudSh: 0x6a4a6a, midY: 0.18 });
  const ch = mesh(new THREE.PlaneGeometry(300, 300), LPmat(0x5a4a3a), 0, -0.01, 0, g); ch.rotation.x = -Math.PI / 2;
  ruaPedra(g, 9, 90, 45);
  for (let i = 0; i < 12; i++) [-1, 1].forEach((k) => casaEnx(g, k * (7.4 + hash(i * 3 + k) * 0.8), 33 - i * 6.2, { ry: k > 0 ? -Math.PI / 2 : Math.PI / 2, w: 5.6, d: 4.6, h: 5.5 + hash(i + k) * 3.5, luz: hash(i * 7 + k * 3) > 0.4 }));
  const barraca = barracaFrutas(g, 3.6, 0, -Math.PI / 2);
  [[-4.1, 8], [4.1, -8], [-4.1, -14], [4.1, 14]].forEach(([x, z]) => lampiao(g, x, z, 3.2));
  const sol = solFlare(g, [-80, 30, -200], 1.2, 0xffd0a0);
  const poeira = dustPts(120, [-5, 5, 0.2, 4, -10, 10], 0xffd8a0, 0.03, 0.7); g.add(poeira); const D = decorRua(g);
  return { barraca, poeira, upd(t) { floatDust(poeira, t, 0.2, 0.1); D.fumos.forEach((f) => f.upd(t, 1)); } };
}

// ---------------------------------------------------------------- 3/4/0 · jardim da mansão à noite (fachada com janelas, chafariz, sebes, caminho de pedra, postes)
const fachadaTex = canvasTex(512, 256, (c, w, h) => { c.fillStyle = "#d8d0c0"; c.fillRect(0, 0, w, h); c.fillStyle = "#bfb6a4"; for (let r = 0; r < 16; r++) c.fillRect(0, r * 16, w, 1.5);
  for (let r = 0; r < 2; r++) for (let k = 0; k < 10; k++) { const x = 16 + k * 50, y = 30 + r * 118, lit = hash(r * 31 + k * 7) > 0.35; c.fillStyle = "#6a5a4a"; c.fillRect(x - 4, y - 4, 32, 78);
    c.fillStyle = lit ? "#ffd9a0" : "#1a2234"; c.fillRect(x, y, 24, 70); c.fillStyle = "#6a5a4a"; c.fillRect(x + 11, y, 2, 70); c.fillRect(x, y + 34, 24, 2); } });
function mansao(g, z = -22) { const m = grp(g, 0, 0, z), mat = new THREE.MeshStandardMaterial({ map: texRep(fachadaTex, 3, 1), emissive: 0xffffff, emissiveMap: texRep(fachadaTex, 3, 1), emissiveIntensity: 0.35, roughness: 0.85 });
  const corpo = mesh(box(48, 12, 12), [SM(0xc8c0b0), SM(0xc8c0b0), SM(0x3a4a6a), SM(0x3a4a6a), mat, SM(0xc8c0b0)], 0, 6, 0, m);
  const tel = LPmat(0x3a4a6a, { rim: 0.5 }); [-1, 1].forEach((k) => { const r = mesh(box(49, 0.3, 7.4), tel, 0, 14.6, k * 3.2, m); r.rotation.x = -k * 0.72; });
  mesh(box(10, 14, 13), [SM(0xd8d0c0), SM(0xd8d0c0), SM(0x3a4a6a), SM(0xd8d0c0), new THREE.MeshStandardMaterial({ map: texRep(fachadaTex, 0.6, 1.2), emissive: 0xffffff, emissiveMap: texRep(fachadaTex, 0.6, 1.2), emissiveIntensity: 0.35, roughness: 0.85 }), SM(0xd8d0c0)], 0, 7, 0.6, m); const fr = mesh(new THREE.ConeGeometry(7.8, 4, 4), tel, 0, 16, 0.6, m); fr.rotation.y = Math.PI / 4; fr.scale.z = 0.85;
  const porta = mesh(box(2.6, 4, 0.2), new THREE.MeshStandardMaterial({ color: 0x3a2418, emissive: 0xffb860, emissiveIntensity: 0.25 }), 0, 2, 7.15, m);
  [-2.2, 2.2].forEach((x) => mesh(cyl(0.4, 0.45, 6, 12), SM(0xe8e0d0), x, 3, 7.6, m)); mesh(box(6, 0.6, 2.4), SM(0xe0d8c8), 0, 6.3, 7.4, m);
  for (let i = 0; i < 4; i++) mesh(box(8 - i * 0.8, 0.2, 1.2 - i * 0.2), SM(0xc8c0b0), 0, 0.1 + i * 0.2, 8.4 - i * 0.2, m);
  return m; }
function chafariz(g, x, z) { const c = grp(g, x, 0, z), p = LPmat(0xc8c4bc, { rim: 0.4 });
  mesh(cyl(2.4, 2.5, 0.6, 24), p, 0, 0.3, 0, c); const ag = mesh(cyl(2.15, 2.15, 0.05, 24), new THREE.MeshStandardMaterial({ color: 0x2a4a6a, metalness: 0.6, roughness: 0.12, emissive: 0x0a1a2a }), 0, 0.5, 0, c);
  mesh(cyl(0.25, 0.35, 1.6, 12), p, 0, 1.1, 0, c); mesh(cyl(0.9, 0.5, 0.3, 16), p, 0, 1.9, 0, c);
  const jato = dustPts(160, [-0.6, 0.6, 0.6, 2.3, -0.6, 0.6], 0xcfe6ff, 0.025, 0.7); c.add(jato); return { c, jato }; }
function jardimMansao(g) {
  skyDome(g, { top: 0x040818, mid: 0x0c1a3a, hor: 0x1a2a4a, ground: 0x05070a, sunDir: [0.3, 0.5, -1], sunCol: 0xb8c8ff, sunI: 0.2, disk: 0.2, cov: 0.2, cloudLit: 0x4a5a7a, cloudSh: 0x0a0e18, stars: 1, midY: 0.16 });
  const gram = mesh(new THREE.PlaneGeometry(200, 200), LPmat(0x16281a, { rim: 0 }), 0, -0.01, 0, g); gram.rotation.x = -Math.PI / 2;
  const cam_ = mesh(new THREE.PlaneGeometry(3.2, 30), SM(0xffffff, { map: texRep(lajeTex, 1, 10), roughness: 0.9 }), 0, 0.01, -6, g); cam_.rotation.x = -Math.PI / 2;
  const roda = mesh(new THREE.RingGeometry(2.6, 4.2, 40), SM(0xffffff, { map: texRep(lajeTex, 6, 1), roughness: 0.9 }), 0, 0.012, 0, g); roda.rotation.x = -Math.PI / 2;
  const F = chafariz(g, 0, 0); mansao(g, -22);
  const seb = LPmat(0x16301a, { rim: 0.5 }); [-1, 1].forEach((k) => { for (let i = 0; i < 6; i++) mesh(box(0.8, 0.9, 2.2), seb, k * 2.2, 0.45, -6 - i * 2.4, g); [-1, 1].forEach((s) => mesh(box(0.8, 0.9, 3.2), seb, k * 5.2, 0.45, s * 3.4, g)); });
  const flor = []; for (let i = 0; i < 90; i++) { const a = hash(i) * 6.28, r = 4.5 + hash(i * 3) * 1.2; flor.push([Math.cos(a) * r, 0.12, Math.sin(a) * r]); }
  instG(g, sph(0.09, 6, 5), LPmat(0xe8e0ff, { rim: 0.5, emis: 0x6a6a9a, ei: 0.3 }), flor, false);
  [[-1.9, 3.5], [1.9, -3.5], [-1.9, -12], [1.9, -12]].forEach(([x, z]) => lampiao(g, x, z, 3.0));
  arvoresLonge(g, 60, 26, 60, () => 0, { cores: [0x1a3020, 0x203a24] });
  const lua = luaG(g, [40, 60, -150], 12);
  const vag = dustPts(70, [-8, 8, 0.3, 3, -10, 8], 0xd8ff9a, 0.045, 0.8); g.add(vag); decorJardim(g); decorMansao(g);
  return { F, vag };
}

// ---------------------------------------------------------------- 5 · vazio da Satella: areia negra em dunas, céu roxo escuro, lua pálida
function vazioSatella(g) {
  skyDome(g, { top: 0x05020c, mid: 0x1a0a2a, hor: 0x3a1a4a, ground: 0x020104, sunDir: [0, 0.35, -1], sunCol: 0xd8c8ff, sunI: 0.2, disk: 0.3, cov: 0.15, cloudLit: 0x3a2a4a, cloudSh: 0x05020a, midY: 0.15 });
  const dun = mesh(new THREE.PlaneGeometry(240, 240, 120, 120), LPmat(0x141018, { rim: 0.4 }), 0, 0, 0, g); dun.rotation.x = -Math.PI / 2;
  const pa = dun.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), d = Math.hypot(x, y); pa.setZ(i, d < 6 ? 0 : (Math.sin(x * 0.12) * 1.4 + Math.sin(y * 0.09 + 1) * 1.8) * Math.min(1, (d - 6) / 10)); } dun.geometry.computeVertexNormals();
  const lua = luaG(g, [0, 40, -160], 16);
  const po = dustPts(220, [-12, 12, 0.1, 4, -12, 8], 0x9a7ad8, 0.035, 0.6); g.add(po); const D = decorVazio(g);
  return { po, upd(t) { floatDust(po, t, 0.3, 0.2); D.miasma.upd(t, 1); floatDust(D.cinza, t, 0.2, 0.5); } };
}

// ---------------------------------------------------------------- 7 · colina do chá (o castelo dos sonhos da Echidna): grama clara, mesa branca, céu limpo; nuvens escuras longe
function mesaCha(g, x, z) { const m = grp(g, x, 0, z), br = LPmat(0xf6f4ee, { rim: 0.4 });
  mesh(cyl(0.6, 0.6, 0.05, 24), br, 0, 0.74, 0, m); mesh(cyl(0.62, 0.66, 0.2, 24), LPmat(0xffffff, { rim: 0.3, side: THREE.DoubleSide }), 0, 0.64, 0, m); mesh(cyl(0.05, 0.07, 0.72, 10), br, 0, 0.36, 0, m); mesh(cyl(0.3, 0.32, 0.04, 16), br, 0, 0.02, 0, m);
  const bule = grp(m, 0.18, 0.765, -0.1); mesh(sph(0.08, 12, 10), LPmat(0xfafaff, { rim: 0.5, liso: true }), 0, 0.07, 0, bule).scale.y = 0.85; const bico = mesh(cyl(0.012, 0.02, 0.1, 8), LPmat(0xfafaff), 0.08, 0.08, 0, bule); bico.rotation.z = -0.9;
  [[-0.25, 0.15], [0.25, 0.2]].forEach(([a, c]) => { mesh(cyl(0.06, 0.07, 0.012, 14), LPmat(0xfafaff), a, 0.772, c, m); mesh(cyl(0.035, 0.028, 0.05, 12), LPmat(0xfafaff, { liso: true }), a, 0.8, c, m); });
  return m; }
function cadeira(g, x, z, ry) { const c = grp(g, x, 0, z), br = LPmat(0xf2f0ea, { rim: 0.4 }); c.rotation.y = ry; mesh(box(0.46, 0.05, 0.46), br, 0, 0.46, 0, c);
  [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([a, b]) => mesh(cyl(0.02, 0.02, 0.46, 6), br, a, 0.23, b, c)); mesh(box(0.46, 0.5, 0.04), br, 0, 0.72, -0.22, c); return c; }
function colinaCha(g) {
  skyDome(g, { top: 0x2a6ad8, mid: 0x7ab0ec, hor: 0xe8f4ff, ground: 0x6a8a4a, sunDir: [0.5, 0.6, 0.6], sunCol: 0xfff4e0, sunI: 1.1, disk: 1.3, cov: 0.35, cloudLit: 0xffffff, cloudSh: 0xa8bcd4, midY: 0.18 });
  const ter = terrain(g, { size: 300, segs: 90, grassA: 0x4f8a36, grassB: 0x6fa24a, h: (x, z) => { const d = Math.hypot(x, z); return d < 8 ? 0 : -(d - 8) * 0.09 + Math.sin(x * 0.05) * 1.2 * Math.min(1, (d - 8) / 20); } });
  const mesa = mesaCha(g, 0, 0); const cE = cadeira(g, 0, -0.78, 0), cS = cadeira(g, 0, 0.78, Math.PI);
  arvoreRef(g, -4.5, -3.5, 1.1);
  const grama = gramaAlta(g, 1600, [-14, 14, -14, 14], () => 0, { base: 0x3a7a22, ponta: 0xb8d870, w: 0.03, h: 0.42, mask: (x, z) => Math.hypot(x, z) > 1.4 });
  const flor = []; for (let i = 0; i < 160; i++) { const a = hash(i * 1.7) * 6.28, r = 2 + hash(i * 3.1) * 12; flor.push([Math.cos(a) * r, 0.18, Math.sin(a) * r]); }
  instG(g, sph(0.05, 6, 5), LPmat(0xffffff, { rim: 0.4 }), flor, false);
  const nuv = []; for (let i = 0; i < 9; i++) { const s = glowSprite(0x2a1838, 46 + hash(i) * 30, 0.8, NORM, puffTex); s.material.fog = false; s.position.set(-120 + i * 30, 10 + hash(i * 3) * 8, -110); g.add(s); nuv.push(s); }
  const folhas = folhasRef(g, 60, [-6, 6, 0.3, 4, -6, 6], { cores: [0xffffff, 0xf0f0ff, 0xffe8f0], brilho: 0x302a30, s: 0.6 }); const D = decorCha(g);
  return { ter, mesa, folhas, cE, cS, upd(t) { folhas(t, 0.6); const f = ((t * 0.37) % 1); D.relampago.material.opacity = f < 0.04 || (f > 0.06 && f < 0.08) ? 0.5 : 0; } };
}

// ---------------------------------------------------------------- 8 · campo dos marcos ao anoitecer: cada morte, um marco de pedra com uma luzinha
function campoMarcos(g) {
  skyDome(g, { top: 0x1a1a4a, mid: 0x6a3a6a, hor: 0xe88a5a, ground: 0x2a2420, sunDir: [0.2, 0.06, -1], sunCol: 0xffa070, sunI: 0.5, disk: 0.6, cov: 0.4, cloudLit: 0xe8906a, cloudSh: 0x3a2a4a, midY: 0.16 });
  const ter = terrain(g, { size: 300, segs: 80, grassA: 0x3c4a2e, grassB: 0x55603c, h: (x, z) => Math.sin(x * 0.04) * 1.2 * Math.min(1, Math.hypot(x, z) / 30) });
  const marcos = []; const pedra = LPmat(0x8a8478, { rim: 0.5 });
  for (let i = 0; i < 44; i++) { const x = (hash(i * 2.1) - 0.5) * 22, z = -2 - hash(i * 3.7) * 34; if (Math.abs(x) < 1.1) continue; const h = 0.7 + hash(i * 5) * 0.5, m = grp(g, x, 0, z);
    mesh(box(0.28, h, 0.16), pedra, 0, h / 2, 0, m).rotation.y = hash(i) * 0.6; const l = glowSprite(0xffd8a0, 0.5, 0.8); l.position.y = h + 0.12; m.add(l); marcos.push({ m, l, i }); }
  const grama = gramaAlta(g, 1200, [-12, 12, -36, 4], () => 0, { base: 0x3a4a2a, ponta: 0xb8a86a, w: 0.03, h: 0.5, mask: (x, z) => Math.abs(x) > 0.7 });
  const brilho = dustPts(120, [-10, 10, 0.3, 3, -30, 2], 0xffd8a0, 0.04, 0.8); g.add(brilho); const D = decorCampo(g);
  return { marcos, brilho, upd(t) { D.nevoa.upd(t, 1); } };
}

// ---------------------------------------------------------------- 9 · terraço da mansão ao amanhecer (o pórtico da entrada vira varanda com balaústre)
function terracoAmanhecer(g) {
  skyDome(g, { top: 0x2a4a8a, mid: 0xd88a8a, hor: 0xffc890, ground: 0x2a2a24, sunDir: [0, 0.06, 1], sunCol: 0xffd8a0, sunI: 1.3, disk: 1.8, cov: 0.4, cloudLit: 0xffc0a0, cloudSh: 0x6a5a7a, midY: 0.16 });
  const gram = mesh(new THREE.PlaneGeometry(240, 240), LPmat(0x2a4a28, { rim: 0 }), 0, -0.01, 0, g); gram.rotation.x = -Math.PI / 2;
  mansao(g, -22); const F = chafariz(g, 0, 0);
  const cam_ = mesh(new THREE.PlaneGeometry(3.2, 30), SM(0xffffff, { map: texRep(lajeTex, 1, 10), roughness: 0.9 }), 0, 0.01, -6, g); cam_.rotation.x = -Math.PI / 2;
  // varanda em cima do pórtico (pórtico em z = -22 + 7.4 = -14.6, topo em y = 6.6)
  const vz = -14.6, piso = mesh(box(6, 0.2, 2.4), SM(0xe0d8c8), 0, 6.7, vz, g); const bal = LPmat(0xe8e0d0, { rim: 0.4 });
  mesh(box(6, 0.12, 0.16), bal, 0, 7.75, vz + 1.12, g); for (let i = 0; i <= 14; i++) mesh(cyl(0.05, 0.07, 0.95, 8), bal, -2.8 + i * 0.4, 7.25, vz + 1.12, g);
  const sol = solFlare(g, [0, 20, 220], 1.6, 0xffe0b0);
  arvoresLonge(g, 70, 26, 80, () => 0, { cores: [0x2a4a2a, 0x3a5a30] }); const D = decorAmanhecer(g);
  return { vz, F, upd(t) { D.nevoa.upd(t, 1); } };
}
