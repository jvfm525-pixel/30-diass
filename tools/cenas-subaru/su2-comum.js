// ================================================================ vídeo: Subaru (Re:Zero) · elenco (cabelos estudados do original, nosso desenho low-poly)
// pontas: [y (u), ph (frações de π: 0 testa, ±0,5 lados, 1 nuca), comprimento (u), largura (u), sobe, pra trás, curva, espessura, contra]
const CAB_RZ = {
  // Subaru: preto, curto, penteado pra cima e pra trás (testa à mostra), tufos espetados apontando pra trás no alto, laterais curtas,
  // duas mechinhas curtas caindo na têmpora
  subaru: { cor: 0x16151a, dentes: 16, dente: 0.22, denteFranja: 0.5, crista: 0.0045, franjaY: 1.3, ladoY: 0.35, nucaY: -0.45, esp: 0.0095, espBorda: 0.0036, varia: 0.08, seed: 401, rigidez: 0.55,
    pontas: [...coroa(5, 1.25, 1.05, 0.62, 0.05, 0.6, -0.28, 0.56, -0.35, 0.45).map((q) => [...q, 1]), // da testa pra trás (topete)
      ...coroa(6, 1.55, 0.62, 0.5, 0.55, 0.55, 0.62, 0.76, 0.08, 0.55), // tufos do alto apontando pra trás/cima
      [0.95, 0.36, 0.42, 0.22, -0.2, 0.05, -0.1, 0.5], [0.95, -0.36, 0.42, 0.22, -0.2, 0.05, -0.1, 0.5]] },
  // Emilia: prateado-lilás, liso, até a cintura; franja reta; mechas compridas emoldurando o rosto; orelhas à mostra
  emilia: { cor: 0xe2dcef, dentes: 34, dente: 0.08, denteFranja: 0.6, crista: 0.0025, franjaY: 0.92, ladoY: 0.25, nucaY: -1.25, esp: 0.009, espBorda: 0.004, varia: 0.02, seed: 402, rigidez: 1.1,
    pontas: [[0.45, 0.38, 2.7, 0.36, -0.85, 0.0, 0.0, 0.45], [0.45, -0.38, 2.7, 0.36, -0.85, 0.0, 0.0, 0.45], [0.4, 0.47, 2.5, 0.34, -0.85, 0.03, 0.0, 0.45], [0.4, -0.47, 2.5, 0.34, -0.85, 0.03, 0.0, 0.45],
      ...Array.from({ length: 12 }, (_, i) => [0.35 + (i % 2) * 0.15, 0.55 + i * 0.082, 5.6 + (i % 3) * 0.35, 0.92, 0.0, 0.32, 0.12, 0.4])] },
  // Echidna: branco-neve, liso, passando da cintura; franja reta; presilha de asa de borboleta sobre a orelha esquerda
  echidna: { cor: 0xf4f4f7, dentes: 34, dente: 0.07, denteFranja: 0.5, crista: 0.0025, franjaY: 0.9, ladoY: -0.2, nucaY: -1.3, esp: 0.009, espBorda: 0.004, varia: 0.02, seed: 403, rigidez: 1.1,
    pontas: [[0.42, 0.4, 3.1, 0.36, -0.85, 0.0, 0.0, 0.45], [0.42, -0.4, 3.1, 0.36, -0.85, 0.0, 0.0, 0.45],
      ...Array.from({ length: 12 }, (_, i) => [0.3 + (i % 2) * 0.15, 0.55 + i * 0.082, 6.2 + (i % 3) * 0.3, 0.94, 0.0, 0.3, 0.1, 0.4])] },
};
const RZ = { moletom: 0x33343c, laranja: 0xe8782a };
function subaruLP(o = {}) { // agasalho cinza-escuro com punhos e zíper laranja, tênis brancos, olhos estreitos de pupila pequena
  const p = pessoaLP({ seed: 411, pele: 0xf8dcc0, olho: "#3a2418", olhoAlt: 0.6, olhoTam: 0.9, brava: 0.28, browW: 0.058, queixo: 0.72, sobrancelha: 0x16151a, roupa: RZ.moletom, calca: RZ.moletom, sapato: 0xeeeeee, sola: 0xd8d8d8, botoes: false, cabelo: CAB_RZ.subaru, ...o });
  const u = p.userData, lr = LPmat(RZ.laranja, { rim: 0.6 });
  [0, 1].forEach((i) => mesh(cyl(0.053, 0.053, 0.04, 12), lr, 0, -0.205, 0, u.el[i]));
  mesh(box(0.012, 0.3, 0.008), LPmat(0xd8d8d8, { metal: 0.6 }), 0, 0.14, 0.128, u.chest); mesh(box(0.012, 0.18, 0.008), LPmat(0xd8d8d8, { metal: 0.6 }), 0, 0.08, 0.108, u.spine);
  [-1, 1].forEach((k) => mesh(box(0.012, 0.3, 0.01), lr, k * 0.16, 0.12, 0.0, u.chest).rotation.z = k * 0.15); // faixas laranja nos lados
  return p;
}
function orelhaPontuda(p) { const u = p.userData, sk = LPmat(u.P.pele, { rim: 0.45, liso: true }); [-1, 1].forEach((k) => { const c = mesh(new THREE.ConeGeometry(0.012, 0.05, 6), sk, k * 0.08, 0.098, -0.012, u.head); c.rotation.set(-0.35, 0, -k * 0.95); }); }
function florCabelo(p, x, y, z) { const u = p.userData, g = grp(u.head, x, y, z), pt = LPmat(0xfbfbff, { rim: 0.5, liso: true });
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, f = mesh(sph(0.014, 8, 6), pt, Math.cos(a) * 0.016, Math.sin(a) * 0.016, 0, g); f.scale.set(1.15, 0.65, 0.4); f.rotation.z = a; }
  mesh(sph(0.007, 8, 6), LPmat(0xffe070, { rim: 0.3 }), 0, 0, 0.003, g); [-1, 1].forEach((k) => { const r = mesh(box(0.024, 0.01, 0.004), LPmat(0x8a5ac8, { rim: 0.5 }), k * 0.016, -0.026, -0.004, g); r.rotation.z = k * 0.6; });
  g.rotation.y = Math.sign(x) * 0.9; return g; }
function emiliaLP(o = {}) { // meia-elfa: olhos roxos, orelhas pontudas, flor branca com fita roxa; roupa branca e roxa, botas brancas
  const p = pessoaLP({ seed: 421, pele: 0xfbe8dc, olho: "#7a5ac0", olhoAlt: 1.0, olhoTam: 1.06, browW: 0.054, queixo: 0.66, sobrancelha: 0x8a82a0, roupa: 0xf4f2f8, calca: 0xf6f4fa, sapato: 0xf2f0f6, sola: 0xd8d4e0, botoes: false, scale: 0.93, cabelo: CAB_RZ.emilia, ...o });
  const u = p.userData; orelhaPontuda(p); florCabelo(p, 0.075, 0.175, 0.02);
  const saia = mesh(new THREE.CylinderGeometry(0.17, 0.27, 0.32, 16, 1, true), LPmat(0xf4f2f8, { rim: 0.8, side: THREE.DoubleSide }), 0, -0.13, 0, u.hips); saia.scale.z = 0.85;
  const barra = mesh(new THREE.CylinderGeometry(0.272, 0.276, 0.035, 16, 1, true), LPmat(0x8a5ac8, { rim: 0.6, side: THREE.DoubleSide }), 0, -0.28, 0, u.hips); barra.scale.z = 0.85;
  const cin = mesh(new THREE.CylinderGeometry(0.142, 0.142, 0.045, 18, 1, true), LPmat(0x8a5ac8, { rim: 0.5, side: THREE.DoubleSide }), 0, 0.0, 0, u.spine); cin.scale.z = 0.78; // faixa roxa na cintura
  return p;
}
function echidnaLP(o = {}) { // olhos pretos, pele pálida, presilha de asa de borboleta; vestido preto longo de luto com acabamento branco
  const p = pessoaLP({ seed: 431, pele: 0xfbf2ec, olho: "#141416", olhoAlt: 0.86, olhoTam: 1.02, browW: 0.054, queixo: 0.66, sobrancelha: 0x9a9aa4, roupa: 0x121214, calca: 0x121214, sapato: 0x121214, sola: 0x2a2a2e, botoes: false, scale: 0.95, cabelo: CAB_RZ.echidna, ...o });
  const u = p.userData, preto = LPmat(0x121214, { rim: 0.9, side: THREE.DoubleSide });
  const saia = mesh(new THREE.CylinderGeometry(0.17, 0.32, 0.86, 16, 1, true), preto, 0, -0.37, 0, u.hips); saia.scale.z = 0.88;
  const barra = mesh(new THREE.CylinderGeometry(0.322, 0.326, 0.03, 16, 1, true), LPmat(0xf2f2f2, { rim: 0.4, side: THREE.DoubleSide }), 0, -0.79, 0, u.hips); barra.scale.z = 0.88;
  const gola = mesh(new THREE.TorusGeometry(0.068, 0.012, 6, 20), LPmat(0xf2f2f2, { rim: 0.4 }), 0, 0.31, 0, u.chest); gola.rotation.x = Math.PI / 2;
  const bo = grp(u.head, 0.082, 0.12, -0.01); bo.rotation.y = 1.3; [-1, 1].forEach((k) => { const w = mesh(new THREE.ConeGeometry(0.022, 0.05, 3), LPmat(0x1a1a22, { rim: 0.8, metal: 0.4 }), 0, k * 0.018, 0, bo); w.rotation.z = k * 1.2; w.scale.z = 0.25; });
  return p;
}
// Satella: só a sombra (corpo negro translúcido, cabelo prateado comprido que brilha de leve)
function satellaSombra(o = {}) { const p = pessoaLP({ seed: 441, pele: 0x000000, roupa: 0x000000, calca: 0x000000, botoes: false, scale: 0.95, cabelo: { ...CAB_RZ.emilia, seed: 442, cor: 0xc8c4d8 }, ...o });
  const m = new THREE.MeshBasicMaterial({ color: 0x05030a, transparent: true, opacity: 0.92 }), mc = new THREE.MeshBasicMaterial({ color: 0x8a84a0, transparent: true, opacity: 0.22, blending: ADD, depthWrite: false });
  p.traverse((x) => { if (!x.isMesh) return; if (x.userData.isDecal) { x.visible = false; return; } let n = x; let cab = false; while (n) { if (n.userData && n.userData.hairG) { cab = true; break; } n = n.parent; } x.material = cab ? mc : m; x.castShadow = false; });
  const veu = mesh(new THREE.CylinderGeometry(0.2, 0.45, 1.4, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x05030a, transparent: true, opacity: 0.85, side: THREE.DoubleSide }), 0, -0.55, 0, p.userData.hips); veu.scale.z = 0.8;
  return p; }
// mão de sombra: braço comprido e torto de sombra com dedos finos; sai do chão (base em y = 0) e vai até um alvo
function maoSombra(g) { const m = new THREE.MeshBasicMaterial({ color: 0x06030c }), mr = new THREE.MeshBasicMaterial({ color: 0x6a3aa8, transparent: true, opacity: 0.35, blending: ADD, depthWrite: false, side: THREE.BackSide });
  const tb = mesh(new THREE.BufferGeometry(), m, 0, 0, 0, g), tb2 = mesh(new THREE.BufferGeometry(), mr, 0, 0, 0, g); tb.castShadow = tb2.castShadow = false;
  const dedos = Array.from({ length: 5 }, (_, i) => { const d = mesh(new THREE.ConeGeometry(0.018, 0.22, 5), m, 0, 0, 0, g); d.castShadow = false; return d; });
  return { set(base, alvo, k, t, seed = 0) { const v = tb.visible = tb2.visible = k > 0.01; dedos.forEach((d) => (d.visible = v)); if (!v) return;
    const fim = base.clone().lerp(alvo, k), pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10, q = base.clone().lerp(fim, u); q.y += Math.sin(u * Math.PI) * 0.5 * k; q.x += Math.sin(u * 7 + t * 2 + seed) * 0.06 * u; q.z += Math.cos(u * 5 + t * 1.6 + seed) * 0.06 * u; pts.push(q); }
    const cv = new THREE.CatmullRomCurve3(pts); [tb, tb2].forEach((x, j) => { x.geometry.dispose(); x.geometry = new THREE.TubeGeometry(cv, 30, j ? 0.05 : 0.04, 7); });
    const tg = cv.getTangent(1); dedos.forEach((d, i) => { const ab = (i - 2) * 0.32; d.position.copy(fim).addScaledVector(tg, 0.06); d.quaternion.setFromUnitVectors(V3(0, 1, 0), tg.clone().applyAxisAngle(V3(0, 0, 1), ab * 0.6).applyAxisAngle(V3(1, 0, 0), Math.sin(t * 3 + i) * 0.15)); d.translateY(0.1); }); } }; }
function fantasma(p, cor = 0x9ad8ff, op = 0.2) { const m = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op, blending: ADD, depthWrite: false, side: THREE.DoubleSide });
  p.traverse((x) => { if (x.isMesh) { if (x.userData.isDecal) x.visible = false; else x.material = m; x.castShadow = false; x.receiveShadow = false; } }); p.userData.fm = m; return p; }
