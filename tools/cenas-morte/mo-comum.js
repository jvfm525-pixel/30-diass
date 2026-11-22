// ================================================================ vídeo: Demônio da Morte (Chainsaw Man) · elenco
// Cabelos estudados das capas e retratos da wiki (vol. 14 Morte, vol. 20 Asa, vol. 12 Yoru, vol. 21 Fome, retrato da Parte 2 do Denji, design do anime da Makima).
// pontas: [y (u), ph (frações de π: 0 testa, ±0,5 lados, 1 nuca), comprimento (u), largura (u), sobe, pra trás, curva, espessura, contra]
const CAB_CSM = {
  // Morte ("Fami"): rosa-acinzentado, chanel liso até o pescoço; franja de lado varrendo a testa (cobre uma sobrancelha);
  // uma mecha comprida caindo na frente da orelha esquerda até o queixo; pontas da nuca viradas pra fora
  morte: { cor: 0xa98a9a, dentes: 26, dente: 0.12, denteFranja: 0.6, crista: 0.003, franjaY: 0.8, ladoY: -0.55, nucaY: -0.9, esp: 0.0095, espBorda: 0.004, varia: 0.04, seed: 701, rigidez: 1.0,
    pontas: [[1.3, -0.2, 1.05, 0.55, 0.12, 0.0, 0.25, 0.5], [1.32, -0.02, 0.92, 0.5, 0.1, 0.0, 0.2, 0.5], [1.28, 0.16, 0.66, 0.45, 0.1, 0.0, 0.15, 0.5], // franja varrida pra um lado (mais comprida à direita dela)
      [0.72, 0.43, 1.45, 0.34, 0.06, 0.0, 0.04, 0.45], [0.72, -0.43, 1.0, 0.34, 0.06, 0.0, 0.04, 0.45], // mechas na frente das orelhas (a esquerda dela mais comprida)
      ...Array.from({ length: 7 }, (_, i) => [0.42, 0.62 + i * 0.12, 0.85, 0.6, 0.22, 0.18, -0.3, 0.45])] }, // nuca: chanel com as pontas viradas pra fora
  // Denji (Parte 2): loiro bagunçado, tufos espetados pra cima e pros lados, franja em mechas grossas caindo na testa
  denji: { cor: 0xe2c06a, dentes: 14, dente: 0.34, denteFranja: 0.45, crista: 0.0045, franjaY: 1.02, ladoY: 0.25, nucaY: -0.45, esp: 0.01, espBorda: 0.004, varia: 0.16, seed: 702,
    pontas: [...coroa(9, 1.5, 0.5, 0.46, 0.3, 0.28, 0.05, 2, 0.22, 0.55), // tufos bagunçados em volta do alto, mais pra trás que pra cima
      [1.22, -0.14, 0.62, 0.36, 0.08, 0.0, -0.12, 0.5], [1.24, 0.06, 0.58, 0.34, 0.06, 0.0, 0.12, 0.5], [1.15, 0.26, 0.5, 0.3, 0.1, 0.05, 0.15, 0.5], // franja em mechas grossas
      [1.08, 0.5, 0.45, 0.3, 0.4, 0.15, 0.25, 0.5], [1.08, -0.5, 0.45, 0.3, 0.4, 0.15, -0.25, 0.5]] }, // tufos pros lados
  // Yoru (no corpo da Asa): preto, liso, solto até o meio das costas; franja reta um pouco aberta no meio
  yoru: { cor: 0x141218, dentes: 30, dente: 0.08, denteFranja: 0.5, crista: 0.0025, franjaY: 0.9, ladoY: -0.3, nucaY: -1.1, esp: 0.009, espBorda: 0.004, varia: 0.03, seed: 703, rigidez: 1.1,
    pontas: [[0.55, 0.4, 2.2, 0.34, 0.05, 0.0, 0.02, 0.45], [0.55, -0.4, 2.2, 0.34, 0.05, 0.0, 0.02, 0.45],
      ...Array.from({ length: 10 }, (_, i) => [0.35 + (i % 2) * 0.12, 0.58 + i * 0.09, 4.2 + (i % 3) * 0.3, 0.9, 0.0, 0.3, 0.1, 0.4])] },
  // Makima: ruivo-claro, franja passando das sobrancelhas, duas mechas laterais compridas emoldurando o rosto; o resto vai na trança
  makima: { cor: 0xd8604c, dentes: 30, dente: 0.08, denteFranja: 0.45, crista: 0.0025, franjaY: 0.88, ladoY: -0.25, nucaY: -0.55, esp: 0.009, espBorda: 0.004, varia: 0.03, seed: 704, rigidez: 1.1,
    pontas: [[0.62, 0.41, 1.6, 0.32, 0.05, 0.0, 0.02, 0.45], [0.62, -0.41, 1.6, 0.32, 0.05, 0.0, 0.02, 0.45]] },
  // Fome: loiro desgrenhado em camadas desiguais, franja na testa, duas mechas até a clavícula, um fio espetado no alto
  fome: { cor: 0xcfa874, dentes: 18, dente: 0.24, denteFranja: 0.35, crista: 0.004, franjaY: 0.95, ladoY: -0.2, nucaY: -0.75, esp: 0.0095, espBorda: 0.004, varia: 0.14, seed: 705,
    pontas: [[0.62, 0.42, 1.5, 0.3, 0.06, 0.05, 0.1, 0.45], [0.62, -0.42, 1.5, 0.3, 0.06, 0.05, -0.1, 0.45],
      ...coroa(7, 0.85, 0.85, 0.48, 0.18, 0.35, 0.55, 0.9, 0.25, 0.5), // camadas desiguais atrás, pontas saindo
      [1.62, 0.02, 0.4, 0.12, 0.9, -0.3, 0.6, 0.4]] }, // fio espetado (antena)
};
const CSM = { pinMorte: 0x6a2634, pinAsa: 0x2c2a34, pinFome: 0x5a3a2c, camisa: 0xf0ece4, laco: 0x5a1a26, preto: 0x141418, gak: 0x16161c, serraLar: 0xe0782a, lamina: 0x9aa0a8 };

// uniforme feminino da escola (Quarta Escola do Leste): camisa de manga comprida, jardineira-vestido abaixo do joelho, cinto largo, laço na gola, meias pretas
function uniformeEscola(p, pin, laco = CSM.laco) { const u = p.userData, m = LPmat(pin, { rim: 0.8, side: THREE.DoubleSide }), mp = LPmat(CSM.preto, { rim: 0.5 });
  const F = u.P && u.P.fem; const peito = mesh(new THREE.CylinderGeometry(F ? 0.158 : 0.168, F ? 0.15 : 0.162, 0.2, 18, 1, true), m, 0, 0.09, 0.004, u.chest); peito.scale.z = 0.8;
  if (F) [-1, 1].forEach((k) => { const b = mesh(sph(0.05, 12, 8), LPmat(pin, { rim: 0.8 }), k * 0.054, 0.125, 0.076, u.chest); b.scale.set(1, 0.88, 0.7); }); // busto por cima da jardineira
  [-1, 1].forEach((k) => { const al = mesh(box(0.035, 0.02, 0.2), m, k * 0.085, 0.215, 0.0, u.chest); al.rotation.z = -k * 0.15; }); // alças
  const cint = mesh(new THREE.CylinderGeometry(F ? 0.132 : 0.16, F ? 0.146 : 0.158, 0.26, 18, 1, true), m, 0, 0.06, 0, u.spine); cint.scale.z = 0.8;
  const cinto = mesh(new THREE.CylinderGeometry(F ? 0.148 : 0.162, F ? 0.148 : 0.162, 0.05, 18, 1, true), mp, 0, -0.04, 0, u.spine); cinto.scale.z = 0.8;
  const saia = mesh(new THREE.CylinderGeometry(F ? 0.18 : 0.172, F ? 0.3 : 0.28, 0.52, 24, 1, true), m, 0, -0.23, 0, u.hips); saia.scale.z = 0.86; // pregas = facetas
  const lc = LPmat(laco, { rim: 0.6, side: THREE.DoubleSide }), gl = grp(u.chest, 0, 0.3, 0.115);
  [-1, 1].forEach((k) => { const a = mesh(new THREE.ConeGeometry(0.028, 0.06, 4), lc, k * 0.032, 0, 0, gl); a.rotation.z = k * Math.PI / 2; a.scale.z = 0.35; const f = mesh(box(0.022, 0.09, 0.006), lc, k * 0.014, -0.05, 0.004, gl); f.rotation.z = k * 0.2; });
  mesh(sph(0.013, 6, 5), lc, 0, 0, 0.004, gl);
  return p; }
// pintinhas no rosto (a Morte tem várias)
function pintas(p, lista) { const u = p.userData, m = new THREE.MeshBasicMaterial({ color: 0x3a2a2a }); lista.forEach(([x, y]) => { const s = mesh(sph(0.0028, 5, 4), m, x, CAB.EY + y, surfZ(u.headM, x, CAB.EY + y) + 0.001, u.head); s.scale.z = 0.4; s.castShadow = false; }); }
// brincos verdes compridos com triângulo na ponta
function brincosMorte(p) { const u = p.userData, m = LPmat(0x3a8a5a, { rim: 0.5, metal: 0.3 }); [-1, 1].forEach((k) => { const g = grp(u.head, k * 0.08, CAB.EY - 0.05, -0.015);
  mesh(cyl(0.0015, 0.0015, 0.03, 5), m, 0, -0.017, 0, g); const tr = mesh(new THREE.ConeGeometry(0.007, 0.011, 3), m, 0, -0.037, 0, g); tr.rotation.x = Math.PI; tr.scale.z = 0.4; mesh(sph(0.005, 6, 4), m, 0, 0, 0, g); }); }
function boneMorte(p) { const u = p.userData, m = LPmat(0x18181c, { rim: 0.6 }), g = grp(u.head, 0, 0.12, 0.0); const c = mesh(new THREE.SphereGeometry(0.108, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), m, 0, 0, 0, g); c.scale.set(1, 0.72, 1.06);
  const ab = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.008, 16, 1, false, -Math.PI * 0.45, Math.PI * 0.9), m, 0, 0.0, 0.05, g); ab.scale.z = 1.25; g.rotation.x = -0.12; u.bone = g; return g; }
// trança da Makima: contas alternadas descendo pelas costas
function tranca(p, cor, n = 9, passo = 0.045) { const u = p.userData, m = LPmat(cor, { rim: 0.5 }), g = grp(u.head, 0, CAB.EY - 0.03, -0.125); g.rotation.x = 0.2;
  for (let i = 0; i < n; i++) { const r = 0.04 - i * 0.0022, s = mesh(sph(r, 8, 6), m, (i % 2 ? 1 : -1) * 0.009, -i * passo, 0, g); s.scale.set(1.15, 1.25, 0.8); s.rotation.z = (i % 2 ? 1 : -1) * 0.4; }
  const pt = mesh(new THREE.ConeGeometry(0.016, 0.06, 6), m, 0, -n * passo - 0.01, 0, g); pt.rotation.x = Math.PI; u.tranca = g; return g; }
function cicatrizesYoru(p) { const u = p.userData, m = new THREE.MeshBasicMaterial({ color: 0x7a4040 }); // riscos de cicatriz atravessando o rosto
  [[-0.055, -0.04, 0.035, 0.3], [0.05, -0.035, 0.04, -0.35], [0.035, 0.05, 0.025, 0.6]].forEach(([x, y, L, r]) => { const s = mesh(box(L, 0.0018, 0.002), m, x, CAB.EY + y, surfZ(u.headM, x, CAB.EY + y) + 0.0015, u.head); s.rotation.z = r; s.castShadow = false; }); }
function camisaFrente(p, cor = CSM.camisa) { const u = p.userData; mesh(box(0.11, 0.3, 0.012), LPmat(cor, { rim: 0.6 }), 0, 0.15, 0.124, u.chest); mesh(box(0.09, 0.14, 0.012), LPmat(cor, { rim: 0.6 }), 0, 0.08, 0.118, u.spine); }

function morteLP(o = {}) { // "Fami": olhos vermelhos de anéis, cara cansada, pintinhas, brincos verdes, jardineira vinho com laço
  const p = pessoaLP({ seed: 711, fem: true, blush: true, pele: 0xf6e6e0, olho: "#d83a52", olhoAlt: 0.66, olhoTam: 1.06, olhoOpts: { aneis: 4, corAnel: "#5a0a18" }, brava: 0.0, browW: 0.046, queixo: 0.6, sobrancelha: 0x8a7080, roupa: CSM.camisa, calca: CSM.preto, sapato: 0xeeeeee, sola: 0xd8d8d8, botoes: false, scale: 0.93, cabelo: CAB_CSM.morte, ...o });
  uniformeEscola(p, CSM.pinMorte); pintas(p, [[0.046, -0.042], [0.058, -0.056], [-0.03, -0.098], [0.035, -0.1]]); brincosMorte(p); if (o.bone) boneMorte(p); return p; }
function famiFalsa(o = {}) { return morteLP(o); }
function denjiLP(o = {}) { // Parte 2: gakuran preto aberto por cima da camisa branca; olhos amarelados com olheira
  const p = pessoaLP({ seed: 712, pele: 0xf6dcc4, olho: "#b8902a", olhoAlt: 0.78, olhoTam: 0.95, brava: 0.1, browW: 0.056, queixo: 0.72, sobrancelha: 0xb89a50, roupa: CSM.gak, calca: CSM.gak, sapato: 0x2a2a2e, sola: 0xe8e4dc, botoes: false, cabelo: CAB_CSM.denji, ...o });
  camisaFrente(p); return p; }
function yoruLP(o = {}) { const p = pessoaLP({ seed: 713, fem: true, blush: true, pele: 0xf4dcd0, olho: "#c8303a", olhoAlt: 0.84, olhoTam: 1.08, olhoOpts: { aneis: 4, corAnel: "#4a0a10" }, brava: 0.35, browW: 0.048, queixo: 0.6, sobrancelha: 0x141218, roupa: 0xd8d2c4, calca: CSM.preto, sapato: 0x2a2a2e, sola: 0xd8d8d8, botoes: false, scale: 0.92, cabelo: CAB_CSM.yoru, ...o });
  uniformeEscola(p, CSM.pinAsa, 0x1a1a22); cicatrizesYoru(p); return p; }
function makimaLP(o = {}) { const p = pessoaLP({ seed: 714, fem: true, blush: true, pele: 0xf8e2d4, olho: "#e8c048", olhoAlt: 0.76, olhoTam: 1.06, olhoOpts: { aneis: 4, corAnel: "#a01818" }, brava: 0.0, browW: 0.048, queixo: 0.58, sobrancelha: 0xb84a3a, roupa: 0xf4f2ee, calca: 0x141418, sapato: 0x6a3a22, sola: 0x3a2014, botoes: false, scale: 0.97, cabelo: CAB_CSM.makima, ...o });
  tranca(p, CAB_CSM.makima.cor); gravata(p, 0x111114); return p; }
function fomeLP(o = {}) { const p = pessoaLP({ seed: 715, fem: true, blush: true, pele: 0xf6e0cc, olho: "#4a9a5a", olhoAlt: 0.94, olhoTam: 1.12, olhoOpts: { aneis: 4, corAnel: "#103a1a" }, brava: 0.0, browW: 0.045, queixo: 0.6, sobrancelha: 0xa88a5a, roupa: 0xc49494, calca: CSM.preto, sapato: 0x2a2a2e, sola: 0xd8d8d8, botoes: false, scale: 0.92, cabelo: CAB_CSM.fome, ...o });
  uniformeEscola(p, CSM.pinFome, 0x3a2418); return p; }

// cabeça de motosserra (Chainsaw Man) e serras nos antebraços
function cabecaSerra(p, o = {}) { const u = p.userData, lar = LPmat(o.cor ?? CSM.serraLar, { rim: 0.6, rough: 0.45 }), lam = LPmat(CSM.lamina, { metal: 0.85, rough: 0.3, rim: 0.4 }), esc = LPmat(0x1a1a1e, { rim: 0.4 });
  u.head.traverse((x) => { if (x.isMesh) x.visible = false; });
  const g = grp(u.head, 0, 0.06, 0.0); const s = o.s ?? 1; g.scale.setScalar(s);
  mesh(box(0.15, 0.13, 0.19), lar, 0, 0.0, 0.0, g); mesh(box(0.152, 0.03, 0.12), esc, 0, -0.045, 0.02, g); // carcaça + grade
  const lm = grp(g, 0, 0.06, 0.05); lm.rotation.x = -0.42; mesh(box(0.04, 0.34, 0.1), lam, 0, 0.17, 0, lm); const pon = mesh(cyl(0.05, 0.05, 0.04, 12, 1, false, 0, Math.PI), lam, 0, 0.34, 0, lm); pon.rotation.set(0, 0, Math.PI / 2); pon.rotation.order = 'ZYX'; pon.rotation.y = Math.PI / 2;
  for (let i = 0; i < 10; i++) [-1, 1].forEach((k) => { const d = mesh(new THREE.ConeGeometry(0.011, 0.026, 4), esc, 0, 0.03 + i * 0.032, k * 0.056, lm); d.rotation.x = k * Math.PI / 2; });
  const al = mesh(new THREE.TorusGeometry(0.045, 0.01, 5, 10, Math.PI), esc, 0, 0.07, -0.06, g); al.rotation.y = Math.PI / 2; // alça em cima da carcaça
  const boca = grp(g, 0, -0.085, 0.05); for (let i = 0; i < 7; i++) { const d = mesh(new THREE.ConeGeometry(0.008, 0.03, 4), LPmat(0xf2eee4, { rim: 0.3 }), -0.045 + i * 0.015, 0, 0, boca); d.rotation.x = Math.PI; }
  if (o.olhos) { [-1, 1].forEach((k) => { const gl = glowSprite(o.olhos, 0.07, 0.9); gl.position.set(k * 0.035, -0.02, 0.1); g.add(gl); }); }
  u.serraCab = g; u.serraLam = lm; return g; }
function serrasBracos(p, o = {}) { const u = p.userData, lam = LPmat(CSM.lamina, { metal: 0.85, rough: 0.3, rim: 0.4 }), esc = LPmat(0x1a1a1e, { rim: 0.4 }), out = [];
  u.el.forEach((el) => { const g = grp(el, 0, -0.16, 0.035); mesh(box(0.022, (o.L ?? 0.5), 0.07), lam, 0, -(o.L ?? 0.5) / 2, 0, g);
    for (let i = 0; i < 10; i++) { const d = mesh(new THREE.ConeGeometry(0.007, 0.018, 4), esc, 0, -0.04 - i * 0.045, 0.04, g); d.rotation.x = Math.PI / 2; } out.push(g); });
  const cord = grp(u.chest, 0, 0.14, 0.13); mesh(cyl(0.004, 0.004, 0.08, 5), LPmat(0x2a2a2e), 0, -0.04, 0, cord); mesh(box(0.05, 0.012, 0.012), LPmat(0x2a2a2e), 0, -0.085, 0, cord); // cordinha de partida no peito
  u.serras = out; return out; }
function chainsawManLP(o = {}) { const p = denjiLP(o); const u = p.userData; u.chest.children.forEach((c) => {}); cabecaSerra(p); serrasBracos(p); return p; }
// o Pochita na forma verdadeira: corpo negro maior, espinhos, tripas penduradas, serras, olhos vermelhos
function pochitaReal(o = {}) { const p = pessoaLP({ seed: 716, pele: 0x0c0b0d, roupa: 0x0c0b0d, calca: 0x0c0b0d, sapato: 0x0c0b0d, sola: 0x0c0b0d, botoes: false, scale: o.scale ?? 1.7 });
  const u = p.userData, pr = LPmat(0x0e0c10, { rim: 1.1, rough: 0.6 }), tr = LPmat(0x4a0c14, { rim: 0.9, rough: 0.5 });
  p.traverse((x) => { if (x.isMesh && x.userData.isDecal) x.visible = false; });
  cabecaSerra(p, { cor: 0x141216, olhos: 0xff2a1a, s: 1.3 }); serrasBracos(p, { L: 0.62 });
  for (let i = 0; i < 7; i++) { const c = mesh(new THREE.ConeGeometry(0.03, 0.18, 5), pr, (i - 3) * 0.045, 0.18 - Math.abs(i - 3) * 0.02, -0.12, u.chest); c.rotation.x = -1.0 - hash(i) * 0.4; }
  u.sh.forEach((sh, k) => { for (let i = 0; i < 3; i++) { const c = mesh(new THREE.ConeGeometry(0.025, 0.14, 5), pr, (k ? 1 : -1) * 0.03, 0.04 - i * 0.06, -0.03, sh); c.rotation.z = (k ? -1 : 1) * 1.1; } }); // espinhos nos ombros
  const tub = []; for (let i = 0; i < 6; i++) { const a = -0.7 + i * 0.28, pts = [V3(Math.sin(a) * 0.12, 0, Math.cos(a) * 0.1 + 0.02), V3(Math.sin(a) * 0.2, -0.2, Math.cos(a) * 0.16 + 0.05), V3(Math.sin(a) * 0.18, -0.42 - hash(i) * 0.15, Math.cos(a) * 0.14 + 0.08), V3(Math.sin(a) * 0.25, -0.62 - hash(i) * 0.2, Math.cos(a) * 0.1)];
    tub.push(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.018, 6), tr, 0, 0, 0, u.hips)); }
  u.tripas = tub; return p; }
// Demônio da Queda: sem cabeça, gorro de cozinheiro flutuando, dólmã branco, avental preto, braços extras
function quedaLP(o = {}) { const p = pessoaLP({ seed: 717, pele: 0xe2d2c8, roupa: 0xf2f0ea, calca: 0x141418, sapato: 0x141418, sola: 0x141418, botoes: false, scale: o.scale ?? 2.4 });
  const u = p.userData; u.head.traverse((x) => { if (x.isMesh) x.visible = false; });
  const br = LPmat(0xf6f4ee, { rim: 0.6 }), gt = grp(u.chest, 0, 0.52, 0); mesh(cyl(0.075, 0.075, 0.14, 12), br, 0, 0, 0, gt); const pf = mesh(sph(0.1, 10, 8), br, 0, 0.1, 0, gt); pf.scale.set(1, 0.7, 1);
  mesh(box(0.3, 0.5, 0.02), LPmat(0x141418, { side: THREE.DoubleSide }), 0, -0.22, 0.14, u.hips); // avental
  const pele = LPmat(0xd8c8bc, { rim: 0.6 }), extras = [];
  [[-1, 0.2], [1, 0.2], [-1, 0.05], [1, 0.05]].forEach(([k, y], i) => { const g = grp(u.chest, k * 0.12, y + 0.1, -0.1); g.rotation.set(-0.5, 0, k * (0.55 + i * 0.22));
    mesh(cyl(0.025, 0.018, 0.55, 6), pele, 0, -0.27, 0, g); const f = mesh(new THREE.ConeGeometry(0.03, 0.32, 5), LPmat(0xece6dc, { rim: 0.5 }), 0, -0.68, 0, g); f.rotation.z = k * 0.2; extras.push(g); });
  u.gorro = gt; u.extras = extras; return p; }
// demônio comum (vítima): corpo escuro curvado, cabeça com chifres, boca cheia de dentes
function demonioComum(o = {}) { const p = pessoaLP({ seed: o.seed ?? 718, pele: o.cor ?? 0x3a2a34, roupa: o.cor ?? 0x3a2a34, calca: o.cor ?? 0x3a2a34, sapato: 0x1a1418, sola: 0x1a1418, botoes: false, scale: o.scale ?? 1.5 });
  const u = p.userData, m = LPmat(0xd8d0c0, { rim: 0.4 }); p.traverse((x) => { if (x.isMesh && x.userData.isDecal) x.visible = false; });
  [-1, 1].forEach((k) => { const c = mesh(new THREE.ConeGeometry(0.03, 0.16, 5), m, k * 0.06, 0.16, 0.0, u.head); c.rotation.z = -k * 0.5; });
  for (let i = 0; i < 6; i++) { const d = mesh(new THREE.ConeGeometry(0.008, 0.03, 4), m, -0.03 + i * 0.012, -0.06, surfZ(u.headM, -0.03 + i * 0.012, -0.06) - 0.003, u.head); d.rotation.x = Math.PI; }
  olhosAcesos(p, o.olho ?? 0xffd040, 0.8); return p; }
// fantoche (efígie em miniatura) de um personagem: boneco de madeira pequeno
function efigie(make, s = 0.14) { const p = make(); p.scale.setScalar(s); const m = LPmat(0xb08a5a, { rim: 0.5, rough: 0.9 }); p.traverse((x) => { if (x.isMesh) { if (x.userData.isDecal) x.visible = false; else x.material = m; } }); return p; }
// corvo (os corvos assassinos da Morte)
function corvo(g) { const c = grp(g), m = LPmat(0x0c0c10, { rim: 0.9 }); const b = mesh(sph(0.06, 8, 6), m, 0, 0, 0, c); b.scale.set(0.7, 0.7, 1.4); mesh(sph(0.035, 6, 5), m, 0, 0.03, 0.08, c); const bi = mesh(new THREE.ConeGeometry(0.012, 0.05, 4), LPmat(0x2a2a24), 0, 0.03, 0.13, c); bi.rotation.x = Math.PI / 2;
  const asas = [-1, 1].map((k) => { const a = grp(c, k * 0.03, 0.02, 0); const w = mesh(box(0.2, 0.008, 0.09), m, k * 0.1, 0, 0, a); return a; }); c.userData.asas = asas; return c; }
function bateAsas(c, t, f = 14) { c.userData.asas.forEach((a, i) => (a.rotation.z = (i ? -1 : 1) * Math.sin(t * f) * 0.7)); }
// civil comum (multidão) com cara simples
function civilLP(i, o = {}) { const cores = [0x3a4a6a, 0x6a3a3a, 0x3a5a4a, 0x5a5a5a, 0x7a6a4a, 0x2a2a34, 0x8a8478], cab = [0x1a1414, 0x2a1e16, 0x14121a, 0x3a2a1e];
  const f = i % 2 === 1; // metade da multidão é mulher: corpo feminino, cílios, blush e cabelo comprido/chanel
  return pessoaLP({ seed: 760 + i, fem: f, blush: f, pele: [0xf2d4b8, 0xe8c4a0, 0xf6dcc8][i % 3], olho: "#3a2a20", roupa: cores[i % cores.length], calca: cores[(i + 3) % cores.length], botoes: false, scale: (f ? 0.86 : 0.92) + hash(i) * 0.12,
    cabelo: f ? { ...(i % 4 === 1 ? CAB_CSM.yoru : CAB_CSM.morte), cor: cab[i % cab.length], seed: 780 + i } : { ...CAB_CSM.denji, cor: cab[i % cab.length], seed: 780 + i, pontas: [] }, ...o }); }
function olhosK(p, k) { (p.userData.olhosAc || []).forEach((o) => { if (o.isSprite) { o.material.opacity = 0.55 * k; o.visible = k > 0.02; } else o.visible = k > 0.05; }); }
