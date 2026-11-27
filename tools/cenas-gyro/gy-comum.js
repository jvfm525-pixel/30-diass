// ================================================================ Quem é Gyro? (Hunter x Hunter): elenco
// Estudo (ROTEIRO-GYRO.md): o rosto do Gyro nunca foi mostrado. Adulto = casaco de plumas grande com capuz e rosto na sombra;
// infância = silhuetas pretas como no flashback do mangá; formiga = sombra com antenas e olhos acesos.
const GY = { casaco: 0x3a4034, casacoEsc: 0x262a22, calca: 0x1e2026, bota: 0x18181a };
const CAB_GY = {
  gon: { cor: 0x14180f, dentes: 14, dente: 0.4, crista: 0.005, franjaY: 1.05, ladoY: 0.3, nucaY: -0.4, esp: 0.011, espBorda: 0.004, varia: 0.1, seed: 71,
    pontas: [...coroa(9, 1.62, 0.95, 0.5, 1.35, 0.08, 0.0, 2, 0.0, 0.62), ...coroa(7, 1.3, 0.75, 0.52, 1.0, 0.28, 0.25, 2, 0.04, 0.6), ...coroa(4, 1.05, 0.5, 0.5, 0.6, -0.1, -0.35, 0.7, 0.0, 0.6)] },
  // menino do canteiro: curto e desgrenhado (só aparece em silhueta, então o contorno é o que importa)
  menino: { cor: 0x101012, dentes: 14, dente: 0.3, crista: 0.004, franjaY: 0.95, ladoY: 0.15, nucaY: -0.55, esp: 0.01, espBorda: 0.004, varia: 0.18, seed: 73,
    pontas: [...coroa(8, 1.2, 0.5, 0.4, 0.5, 0.2, 0.1, 2, -0.1, 0.5), ...coroa(5, 0.8, 0.4, 0.4, 0.2, 0.25, 0.3, 1.2, -0.2, 0.5)] },
  pai: { cor: 0x101012, dentes: 12, dente: 0.22, crista: 0.003, franjaY: 0.9, ladoY: 0.1, nucaY: -0.6, esp: 0.01, espBorda: 0.004, varia: 0.1, seed: 74,
    pontas: [...coroa(6, 1.0, 0.35, 0.36, 0.2, 0.15, 0.05, 2, -0.2, 0.4)] },
};
function gonLP(o = {}) { return pessoaLP({ seed: 82, pele: 0xf6d2ac, olho: "#5a3418", olhoAlt: 1.0, olhoTam: 1.12, brava: 0.05, roupa: 0x2f7a3a, calca: 0x2a6a32, sapato: 0x1e5a2a, sola: 0xe8e4d8, botoes: false, sobrancelha: 0x14180f, cabelo: CAB_GY.gon, scale: 0.78, ...o }); }

// silhueta preta chapada (flashback do mangá); mantém sombra projetada
const INVIS_G = new THREE.MeshBasicMaterial({ visible: false });
function silhueta(p, cor = 0x0a0a0c) { const m = LPmat(cor, { rim: 1.4, rough: 1 }); // preta, mas com contorno de luz (lê no escuro)
  p.traverse((x) => { if (!x.isMesh) return; if (x.userData.isDecal) { x.material = INVIS_G; return; } x.material = m; x.castShadow = true; }); p.userData.silM = m; return p; }

// dois riscos de olho acesos (rosto na sombra / formiga)
function olhosAcesos(p, cor = 0xd8e8ff, tam = 1) { const u = p.userData, m = new THREE.MeshBasicMaterial({ color: cor }), ey = CAB.EY, out = [];
  [-1, 1].forEach((k) => { const z = surfZ(u.headM, k * 0.036, ey) + 0.004, e = mesh(box(0.026 * tam, 0.007 * tam, 0.004), m, k * 0.036, ey, z, u.head); e.rotation.z = -k * 0.18; e.castShadow = false;
    const gl = glowSprite(cor, 0.07 * tam, 0.55); gl.position.set(k * 0.036, ey, z + 0.01); u.head.add(gl); out.push(e, gl); });
  u.olhosAc = out; return out; }

// Gyro adulto: casaco de plumas grande (gomos), capuz levantado, rosto escuro só com o brilho dos olhos
function gyroLP(o = {}) {
  const p = pessoaLP({ seed: 601, pele: 0x2a2624, olho: "#101010", roupa: GY.casaco, calca: GY.calca, sapato: GY.bota, sola: 0x2a2a2a, botoes: false, sobrancelha: 0x0a0a0a, scale: 1.0, ...o });
  const u = p.userData, cm = LPmat(GY.casaco, { rim: 0.6, rough: 0.55 }), ce = LPmat(GY.casacoEsc, { rim: 0.5, rough: 0.6, side: THREE.DoubleSide });
  p.traverse((x) => { if (x.isMesh && x.userData.isDecal) x.visible = false; });
  // casaco de plumas: uma peça só por parte do corpo, perfil com gomos (lathe de raio ondulado), sem buracos entre os gomos
  const gomos = (y0, y1, r0, r1, n, amp, par, sz, mat, fecha) => { const pts = []; if (fecha) pts.push([0.001, y0]);
    for (let i = 0; i <= 32; i++) { const u = i / 32, y = y0 + (y1 - y0) * u, f = (u * n) % 1; pts.push([r0 + (r1 - r0) * Math.sin(u * Math.PI * 0.5 + (r1 < r0 ? 0 : 0)) * 1 + amp * Math.pow(Math.sin(f * Math.PI), 0.7), y]); }
    if (fecha) pts.push([0.001, y1]); const m = mesh(lathe(pts, 18), mat, 0, 0, 0, par); m.scale.z = sz; return m; };
  const cmD = LPmat(GY.casaco, { rim: 0.6, rough: 0.55, side: THREE.DoubleSide });
  gomos(-0.07, 0.22, 0.158, 0.162, 3, 0.012, u.spine, 0.8, cm, true);
  gomos(-0.03, 0.29, 0.176, 0.17, 4, 0.014, u.chest, 0.76, cm, false);
  mesh(new THREE.SphereGeometry(0.17, 18, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), cm, 0, 0.27, 0, u.chest).scale.set(1, 0.45, 0.76); // ombros arredondados
  gomos(0.08, -0.44, 0.18, 0.225, 3, 0.012, u.hips, 0.84, cmD, false); // barra até a coxa
  u.sh.forEach((sh) => gomos(0.05, -0.3, 0.074, 0.07, 3, 0.01, sh, 1, cm, true));
  u.el.forEach((el) => gomos(0.03, -0.235, 0.066, 0.064, 2, 0.009, el, 1, cm, true));
  mesh(new THREE.TorusGeometry(0.085, 0.04, 8, 18), cm, 0, 0.33, 0, u.chest).rotation.x = Math.PI / 2; // gola gorda
  // capuz: casca aberta na frente, maior que a cabeça, bordas com pelo escuro
  // rosto = um vazio escuro (sem luz nenhuma): tudo que está na cabeça vira preto chapado; decalques (boca, nariz, sobrancelha) somem
  const vazioM = new THREE.MeshBasicMaterial({ color: 0x020203 }), INVIS = new THREE.MeshBasicMaterial({ visible: false });
  u.head.traverse((x) => { if (!x.isMesh) return; x.material = x.userData.isDecal ? INVIS : vazioM; });
  // capuz fundo e pontudo atrás, com borda fofa de pelo (anel com vértices bagunçados) em volta da abertura
  const cap = mesh(new THREE.SphereGeometry(1, 18, 14, Math.PI * 0.5 + 0.7, Math.PI * 2 - 1.4, 0, Math.PI * 0.84), ce, 0, 0.09, -0.03, u.head); cap.scale.set(0.155, 0.17, 0.17);
  const bico = mesh(new THREE.ConeGeometry(0.06, 0.12, 10), ce, 0, 0.13, -0.17, u.head); bico.rotation.x = -1.45; // ponta do capuz caída nas costas
  const pg = new THREE.TorusGeometry(0.118, 0.026, 7, 40), pp = pg.attributes.position; for (let i = 0; i < pp.count; i++) { const j = 1 + 0.35 * (hash(i * 1.37) - 0.5); pp.setXYZ(i, pp.getX(i) * (1 + 0.06 * (hash(i * 2.1) - 0.5)), pp.getY(i) * (1 + 0.06 * (hash(i * 3.3) - 0.5)), pp.getZ(i) * j); } pg.computeVertexNormals();
  const pelo = mesh(pg, LPmat(0x4a443a, { rim: 0.7, rough: 1 }), 0, 0.075, 0.075, u.head); pelo.scale.set(0.95, 1.08, 1); pelo.castShadow = false;
  olhosAcesos(p, 0xcfe0ff, 0.72);
  return p; }

// formiga-sombra (as Quimeras): corpo humano escuro, antenas, mandíbulas, olhos acesos
function formigaSombra(o = {}) { const p = pessoaLP({ seed: o.seed ?? 611, pele: 0x111014, roupa: 0x111014, calca: 0x111014, sapato: 0x111014, botoes: false, scale: o.scale ?? 1.05 });
  const u = p.userData, m = LPmat(0x141218, { rim: 1.2 });
  p.traverse((x) => { if (x.isMesh && x.userData.isDecal) x.visible = false; });
  [-1, 1].forEach((k) => { const pts = [V3(k * 0.03, 0.16, 0.02), V3(k * 0.07, 0.3, 0.06), V3(k * 0.14, 0.4, 0.0), V3(k * 0.2, 0.42, -0.08)];
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.006, 5), m, 0, 0, 0, u.head);
    const md = mesh(new THREE.ConeGeometry(0.014, 0.08, 5), m, k * 0.035, -0.06, 0.07, u.head); md.rotation.set(1.2, 0, k * 0.7); });
  if (o.lobo) { const fo = mesh(new THREE.ConeGeometry(0.045, 0.12, 7), m, 0, 0.0, 0.11, u.head); fo.rotation.x = Math.PI / 2; // Welfin: focinho e juba espetada
    for (let i = 0; i < 9; i++) { const c = mesh(new THREE.ConeGeometry(0.03, 0.16, 5), m, (i - 4) * 0.025, 0.14 + Math.cos((i - 4) * 0.4) * 0.03, -0.04, u.head); c.rotation.set(-0.6, 0, (i - 4) * 0.22); } }
  olhosAcesos(p, o.olho ?? 0xffd070, 1.0);
  return p; }

// objetos de mão
function garrafa(cor = 0x3a5a2a) { const g = new THREE.Group(); const m = LPmat(cor, { rim: 0.6, rough: 0.25 });
  mesh(cyl(0.03, 0.03, 0.16, 10), m, 0, 0, 0, g); mesh(new THREE.CylinderGeometry(0.012, 0.03, 0.06, 10), m, 0, 0.11, 0, g); mesh(cyl(0.012, 0.012, 0.04, 8), m, 0, 0.16, 0, g); return g; }
function tijolo(g, x, y, z, ry = 0, cor = 0xa0502e) { const b = mesh(box(0.22, 0.07, 0.1), LPmat(cor, { rough: 0.95 }), x, y, z, g); b.rotation.y = ry; return b; }
