// ================================================================ vídeo: Gojo · elenco e objetos (Jujutsu Kaisen redesenhado por nós em low-poly)
const GDOF_C = { ap: 0.008, max: 0.014 }, GDOF_M = { ap: 0.005, max: 0.012 }, GDOF_L = { ap: 0.0025, max: 0.008 };
const AZUL_SEIS = "#6ad8ff";
const CAB_JJK = {
  // Gojo de venda: cabelo branco espetado pra cima
  gojo: { ...CABELOS.gojo, seed: 301 },
  // Gojo sem venda / jovem: branco, bagunçado, caindo na testa
  gojoSolto: { cor: 0xeef2f6, dentes: 16, dente: 0.34, crista: 0.0045, franjaY: 0.88, ladoY: 0.15, nucaY: -0.55, esp: 0.01, espBorda: 0.0036, varia: 0.1, seed: 302,
    pontas: [...coroa(8, 1.45, 0.48, 0.52, 0.5, 0.06, 0.06, 2, 0.06, 0.6), ...coroa(5, 1.15, 0.44, 0.48, 0.12, 0.05, -0.32, 0.64, -0.1, 0.55)] },
  // Geto: preto, comprido até o ombro, repartido, uma mecha caindo na testa (o coque vai à parte)
  geto: { cor: 0x141218, dentes: 24, dente: 0.14, crista: 0.003, franjaY: 1.08, ladoY: -0.75, nucaY: -0.9, esp: 0.009, espBorda: 0.004, varia: 0.05, seed: 303,
    pontas: [[1.18, 0.14, 0.78, 0.24, -0.55, 0.0, -0.1, 0.5], [1.0, 0.9, 0.7, 0.32, -0.8, 0.05, -0.1, 0.5], [1.0, -0.9, 0.7, 0.32, -0.8, 0.05, -0.1, 0.5]] },
  // Anjo: claro, comprido, franja reta
  anjo: { cor: 0xf0dcb8, dentes: 30, dente: 0.1, crista: 0.003, franjaY: 0.9, ladoY: -0.9, nucaY: -1.25, esp: 0.009, espBorda: 0.004, varia: 0.04, seed: 304, pontas: [] },
};

// ---------------------------------------------------------------- elenco
const UNI = 0x2c3552;
function gojoVendaLP(o = {}) { return gojoLP({ seed: 311, cabelo: CAB_JJK.gojo, botoes: false, roupa: UNI, calca: UNI, ...o }); }
// mãos nos bolsos (em pé): o jeito do Gojo
function maosBolso(p, k = 1) { if (k <= 0) return; maoEm(p, 0, frenteW(p, 0.2, 0.84, 0.03), k, { abre: 0.95, poleY: 0.7, poleZ: -0.55 }); maoEm(p, 1, frenteW(p, -0.2, 0.84, 0.03), k, { abre: 0.95, poleY: 0.7, poleZ: -0.55 }); pose(p, { handR: 0.9 * k, handL: 0.9 * k }, 1); }
function gojoOlhosLP(o = {}) { // sem venda: os Seis Olhos azuis
  return pessoaLP({ seed: 312, pele: 0xffe6c8, olho: AZUL_SEIS, olhoAlt: 0.82, olhoTam: 1.0, brava: 0.08, browW: 0.06, sobrancelha: 0x8a929e, roupa: UNI, calca: UNI, botoes: false, scale: 1.08, cabelo: CAB_JJK.gojoSolto, ...o });
}
// óculos escuros redondos do Gojo jovem (um pouco abaixo dos olhos: o azul aparece por cima)
function oculosEscuros(p) {
  const u = p.userData, aro = LPmat(0x1a1a1e, { metal: 0.6, rough: 0.3, rim: 0.3, liso: true }), lente = SM(0x08080c, { roughness: 0.12, metalness: 0.5 });
  [-1, 1].forEach((k) => { const y = CAB.EY - 0.014, z = surfZ(u.headM, k * 0.036, y) + 0.009; mesh(new THREE.CircleGeometry(0.023, 20), lente, k * 0.036, y, z, u.head); mesh(new THREE.TorusGeometry(0.023, 0.0016, 6, 24), aro, k * 0.036, y, z + 0.0006, u.head);
    mesh(box(0.014, 0.0016, 0.0016), aro, k * 0.064, CAB.EY - 0.006, surfZ(u.headM, k * 0.064, CAB.EY) + 0.002, u.head); });
  mesh(box(0.016, 0.0016, 0.0016), aro, 0, CAB.EY - 0.01, surfZ(u.headM, 0, CAB.EY - 0.01) + 0.011, u.head);
}
function gojoJovemLP(o = {}) { const p = gojoOlhosLP({ seed: 313, roupa: 0x1a1d2a, calca: 0x1a1d2a, scale: 1.04, ...o }); oculosEscuros(p); return p; }
function getoLP(o = {}) { // Suguru Geto: cabelo preto com meio coque, mecha na testa, alargadores, olhos puxados
  const p = pessoaLP({ seed: 321, pele: 0xf6dcc0, olho: "#3a3030", olhoAlt: 0.5, olhoTam: 0.98, brava: 0.05, browW: 0.058, queixo: 0.66, sobrancelha: 0x141218, roupa: 0x1a1d2a, calca: 0x1a1d2a, botoes: false, scale: 1.05, cabelo: CAB_JJK.geto, ...o });
  const u = p.userData; mesh(sph(0.042, 8, 6), LPmat(0x141218, { rim: 0.5 }), 0, 0.15, -0.078, u.head);
  [-1, 1].forEach((k) => { const a = mesh(cyl(0.011, 0.011, 0.006, 12), LPmat(0x101012, { metal: 0.5, rough: 0.3 }), k * 0.083, 0.06, -0.006, u.head); a.rotation.z = Math.PI / 2; });
  return p;
}
// pontos de costura na testa (o Kenjaku no corpo do Geto)
const pontosTex = canvasTex(256, 32, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "rgba(70,30,34,.95)"; c.lineWidth = 3; c.beginPath(); c.moveTo(10, h / 2); c.bezierCurveTo(w * 0.3, h / 2 - 3, w * 0.7, h / 2 + 3, w - 10, h / 2); c.stroke();
  c.lineWidth = 2.5; for (let i = 0; i < 13; i++) { const x = 20 + (i * (w - 40)) / 12; c.beginPath(); c.moveTo(x - 4, h / 2 - 8); c.lineTo(x + 4, h / 2 + 8); c.stroke(); } });
function kenjakuLP(o = {}) {
  const p = getoLP({ seed: 331, olhoAlt: 0.44, rugas: 0.08, roupa: 0x161519, calca: 0x161519, sapato: 0x2a2018, sola: 0x6a5a40, scale: 1.08, ...o });
  const u = p.userData;
  decalSup(u.head, pontosTex, 0.15, 0.019, 0, 0.158, (x, y) => surfZ(u.headM, x, y), { dz: 0.0032 });
  const manto = LPmat(0x161519, { rim: 0.8, side: THREE.DoubleSide });
  const saia = mesh(new THREE.CylinderGeometry(0.17, 0.3, 0.84, 14, 1, true), manto, 0, -0.37, 0, u.hips); saia.scale.z = 0.85;
  [0, 1].forEach((i) => mesh(box(0.05, 0.2, 0.17), manto, 0, -0.15, -0.03, u.el[i])); // mangas largas
  const fx = mesh(box(0.38, 0.085, 0.275), LPmat(0x6a645c, { rim: 0.6 }), 0, 0.16, 0, u.chest); fx.rotation.z = 0.62; // kesa
  abaVento(p, "hips", 0.24, 0.72, 0x161519, [0.0, -0.06, 0.13], [0.04, 0, 0], { tras: 0.03 });
  return p;
}
const asaTex = canvasTex(256, 160, (c, w, h) => { c.clearRect(0, 0, w, h); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 11; i++) { const an = -0.95 + (i / 10) * 1.5, L = w * (0.55 + 0.4 * Math.sin((i / 10) * Math.PI)); c.save(); c.translate(6, h * 0.62); c.rotate(an);
    const g_ = c.createLinearGradient(0, 0, L, 0); g_.addColorStop(0, "rgba(255,240,200,.9)"); g_.addColorStop(0.7, "rgba(255,230,170,.55)"); g_.addColorStop(1, "rgba(255,220,150,0)"); c.fillStyle = g_; c.beginPath(); c.ellipse(L / 2, 0, L / 2, 9, 0, 0, 7); c.fill(); c.restore(); } });
function anjoLP(o = {}) { // o Anjo (Hana Kurusu): roupa branca, cabelo claro, asas de luz e auréola
  const p = pessoaLP({ seed: 341, pele: 0xfbe6d2, olho: "#c8a060", olhoAlt: 0.9, olhoTam: 1.02, browW: 0.054, queixo: 0.66, sobrancelha: 0xb89870, roupa: 0xf4f1ea, calca: 0xf4f1ea, sapato: 0xe8e2d8, sola: 0xd8d0c0, botoes: false, scale: 0.95, cabelo: CAB_JJK.anjo, ...o });
  const u = p.userData, asaM = new THREE.MeshBasicMaterial({ map: asaTex, color: 0xfff0c8, transparent: true, opacity: 0.95, blending: ADD, depthWrite: false, side: THREE.DoubleSide });
  u.asas = [-1, 1].map((k) => { const a = grp(u.chest, k * 0.05, 0.2, -0.15); const m = mesh(new THREE.PlaneGeometry(0.95, 0.6), asaM, 0.47, 0.08, 0, a); m.castShadow = false; m.receiveShadow = false; a.rotation.y = k > 0 ? -0.35 : Math.PI + 0.35; return a; });
  u.aur = mesh(new THREE.TorusGeometry(0.1, 0.006, 6, 32), new THREE.MeshBasicMaterial({ color: 0xffe8a0, transparent: true, blending: ADD, depthWrite: false }), 0, 0.27, -0.03, u.head); u.aur.rotation.x = Math.PI / 2 - 0.25; u.aur.castShadow = false;
  u.asaM = asaM; return p;
}
// personagem de luz (lembrança): tudo vira um brilho translúcido; sem rosto animado
function fantasma(p, cor = 0x9ad8ff, op = 0.2) { const m = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op, blending: ADD, depthWrite: false, side: THREE.DoubleSide });
  p.traverse((x) => { if (x.isMesh) { if (x.userData.isDecal) x.visible = false; else x.material = m; x.castShadow = false; x.receiveShadow = false; } }); p.userData.fm = m; return p; }
// espírito do monge Genshin: sentado de pernas cruzadas, mãos no colo, auréola; translúcido e dourado
function genshinEspirito(g, s = 3) {
  const e = grp(g), m = new THREE.MeshBasicMaterial({ color: 0xffd8a0, transparent: true, opacity: 0.12, blending: ADD, depthWrite: false }), mb = new THREE.MeshBasicMaterial({ color: 0xffe8b8, transparent: true, opacity: 0.3, blending: ADD, depthWrite: false, side: THREE.BackSide });
  const add = (geo, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) => { [m, mb].forEach((mm, i) => { const q = mesh(geo, mm, x, y, z, e); q.scale.set(sx * (i ? 1.04 : 1), sy * (i ? 1.04 : 1), sz * (i ? 1.04 : 1)); q.rotation.set(rx, 0, rz); }); };
  add(sph(1, 20, 10), 0, 0.14 * s, 0.05 * s, 0.62 * s, 0.15 * s, 0.42 * s); // pernas cruzadas
  add(lathe([[0.001, 0], [0.46, 0.02], [0.5, 0.2], [0.4, 0.55], [0.36, 0.78], [0.3, 0.9], [0.12, 0.96], [0.001, 0.97]].map(([r, y]) => [r * s, y * s]), 20), 0, 0.12 * s, 0);
  add(cyl(0.065 * s, 0.075 * s, 0.12 * s, 10), 0, 1.12 * s, 0); add(sph(0.15 * s, 18, 12), 0, 1.3 * s, 0.01 * s, 1, 1.08, 1.05);
  [-1, 1].forEach((k) => { add(cap(0.075 * s, 0.38 * s, 4, 8), k * 0.38 * s, 0.68 * s, 0.08 * s, 1, 1, 1, 0.5, -k * 0.3); add(cap(0.06 * s, 0.3 * s, 4, 8), k * 0.18 * s, 0.4 * s, 0.24 * s, 1, 1, 1, 1.45, -k * 1.2); });
  add(sph(0.09 * s, 12, 8), 0, 0.38 * s, 0.3 * s, 1.3, 0.7, 1);
  const halo = mesh(new THREE.RingGeometry(0.27 * s, 0.3 * s, 48), new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.4, blending: ADD, depthWrite: false, side: THREE.DoubleSide }), 0, 1.32 * s, -0.14 * s, e);
  const aura = glowSprite(0xffd890, 2.4 * s, 0.14); aura.position.set(0, 0.8 * s, -0.3 * s); e.add(aura);
  e.traverse((x) => { if (x.isMesh) { x.castShadow = false; x.receiveShadow = false; } });
  return { e, m, halo, aura, set(k) { m.opacity = 0.12 * k; mb.opacity = 0.3 * k; halo.material.opacity = 0.4 * k; aura.material.opacity = 0.14 * k; e.visible = k > 0.01; } };
}
// ---------------------------------------------------------------- o Reino da Prisão
const cuboTexF = (olho) => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = "#cdbd9c"; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(${hash(i) > 0.5 ? "90,70,50" : "240,228,200"},${0.04 + hash(i * 3) * 0.06})`; c.fillRect(hash(i * 5) * w, hash(i * 7) * h, 3 + hash(i * 9) * 10, 2 + hash(i * 11) * 6); }
  c.strokeStyle = "rgba(70,48,36,.8)"; c.lineWidth = 7; c.strokeRect(9, 9, w - 18, h - 18); c.lineWidth = 3; c.strokeRect(30, 30, w - 60, h - 60);
  [[30, 30], [w - 30, 30], [30, h - 30], [w - 30, h - 30]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 12, 0, 7); c.stroke(); });
  for (let i = 0; i < 4; i++) { c.save(); c.translate(w / 2, h / 2); c.rotate((i * Math.PI) / 2); c.beginPath(); c.moveTo(-60, -96); c.quadraticCurveTo(0, -74, 60, -96); c.stroke(); c.restore(); }
  if (!olho) { c.lineWidth = 5; c.beginPath(); c.moveTo(w / 2 - 54, h / 2); c.quadraticCurveTo(w / 2, h / 2 + 22, w / 2 + 54, h / 2); c.stroke(); c.lineWidth = 2; for (let i = 0; i < 7; i++) { const x = w / 2 - 42 + i * 14; c.beginPath(); c.moveTo(x, h / 2 + 10); c.lineTo(x - 2, h / 2 + 20); c.stroke(); } }
  else { c.fillStyle = "#f4ece0"; c.beginPath(); c.ellipse(w / 2, h / 2, 58, 34, 0, 0, 7); c.fill(); c.strokeStyle = "rgba(190,40,40,.55)"; c.lineWidth = 1.5; for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * 54, h / 2 + Math.sin(a) * 30); c.lineTo(w / 2 + Math.cos(a) * 30, h / 2 + Math.sin(a) * 16); c.stroke(); }
    const g_ = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, 26); g_.addColorStop(0, "#050505"); g_.addColorStop(0.45, "#2a1a14"); g_.addColorStop(1, "#7a3a20"); c.fillStyle = g_; c.beginPath(); c.arc(w / 2, h / 2, 26, 0, 7); c.fill();
    c.fillStyle = "rgba(255,255,255,.8)"; c.beginPath(); c.arc(w / 2 - 8, h / 2 - 9, 5, 0, 7); c.fill(); c.strokeStyle = "rgba(70,48,36,.9)"; c.lineWidth = 5; c.beginPath(); c.ellipse(w / 2, h / 2, 58, 34, 0, 0, 7); c.stroke(); }
});
const CUBO_T = { fechado: null, olho: null };
function cuboPrisao(g, s = 0.26) { // o cubo pousado no chão (a base fica em y = 0 do grupo)
  CUBO_T.fechado = CUBO_T.fechado || cuboTexF(false); CUBO_T.olho = CUBO_T.olho || cuboTexF(true);
  const c = grp(g), m = new THREE.MeshStandardMaterial({ map: CUBO_T.fechado, roughness: 0.75, emissive: 0xffffff, emissiveMap: CUBO_T.fechado, emissiveIntensity: 0.0 });
  const cb = mesh(new THREE.BoxGeometry(s, s, s), m, 0, s / 2, 0, c);
  const gl = glowSprite(0xff5a40, s * 6, 0); gl.position.y = s / 2; c.add(gl);
  return { c, cb, m, gl, olho(on) { const t = on ? CUBO_T.olho : CUBO_T.fechado; if (m.map !== t) { m.map = t; m.emissiveMap = t; m.needsUpdate = true; } } };
}
// carne com olhos: as paredes da prisão por dentro e por fora
const carneTex = canvasTex(512, 512, (c, w, h) => {
  c.fillStyle = "#5a1a22"; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 120; i++) { c.strokeStyle = `rgba(${hash(i) > 0.5 ? "150,50,60" : "30,6,10"},${0.25 + hash(i * 3) * 0.35})`; c.lineWidth = 2 + hash(i * 5) * 6; c.beginPath(); const x = hash(i * 7) * w, y = hash(i * 9) * h; c.moveTo(x, y); c.bezierCurveTo(x + 40, y + 30, x - 30, y + 80, x + 20, y + 120); c.stroke(); }
  [[0.25, 0.3, 46], [0.72, 0.22, 30], [0.6, 0.66, 54], [0.2, 0.78, 26], [0.88, 0.85, 20]].forEach(([u, v, r]) => { const x = u * w, y = v * h; c.fillStyle = "#e8dcd0"; c.beginPath(); c.ellipse(x, y, r * 1.6, r, 0, 0, 7); c.fill();
    const g_ = c.createRadialGradient(x, y, 1, x, y, r * 0.85); g_.addColorStop(0, "#000"); g_.addColorStop(0.5, "#3a1410"); g_.addColorStop(1, "#8a4a20"); c.fillStyle = g_; c.beginPath(); c.arc(x, y, r * 0.85, 0, 7); c.fill();
    c.strokeStyle = "#2a0608"; c.lineWidth = 6; c.beginPath(); c.ellipse(x, y, r * 1.6, r, 0, 0, 7); c.stroke(); });
});
// a prisão se abre em volta do alvo: quatro paredes de carne com olhos sobem do chão, o teto fecha e tudo encolhe até virar o cubo
function prisaoFechando(g, pos, L = 4.4) {
  const p = grp(g, ...pos), corpo = grp(p), m = new THREE.MeshStandardMaterial({ map: rep(carneTex.clone(), 1, 1), roughness: 0.5, emissive: 0x5a1018, emissiveIntensity: 0.35, side: THREE.DoubleSide }); m.map.needsUpdate = true;
  const paredes = [0, 1, 2, 3].map((i) => { const piv = grp(corpo); piv.rotation.y = (i * Math.PI) / 2; const w = grp(piv, 0, 0, L / 2); mesh(new THREE.PlaneGeometry(L, L), m, 0, L / 2, 0, w); return w; });
  const teto = mesh(new THREE.PlaneGeometry(L, L), m, 0, L, 0, corpo); teto.rotation.x = Math.PI / 2;
  const tent = []; for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2 + 0.3, pts = [V3(Math.cos(an) * L * 0.48, 0.2 + hash(i) * 2.5, Math.sin(an) * L * 0.48), V3(Math.cos(an) * 1.0, 1.0 + hash(i * 3) * 0.6, Math.sin(an) * 1.0), V3(Math.cos(an) * 0.25, 0.9 + hash(i * 5) * 0.5, Math.sin(an) * 0.25)];
    const tb = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.05, 6), LPmat(0x7a2430, { rim: 0.6, liso: true }), 0, 0, 0, corpo); tent.push(tb); }
  corpo.visible = false;
  return { p, corpo, upd(k) { // k: 0 → 1
    corpo.visible = k > 0.001 && k < 0.999; if (!corpo.visible) return;
    const sobe = E.out(seg(k, 0, 0.35)), fecha = E.inOut(seg(k, 0.35, 0.55)), enc = E.in(seg(k, 0.62, 1));
    paredes.forEach((w) => { w.position.y = -L * (1 - sobe); w.rotation.x = 0; });
    teto.position.y = L + 6 * (1 - fecha); teto.visible = fecha > 0.01;
    tent.forEach((tb, i) => { tb.visible = sobe > 0.6; tb.scale.setScalar(Math.max(0.01, seg(sobe, 0.6 + i * 0.03, 1))); });
    corpo.scale.setScalar(Math.max(0.02, 1 - enc)); m.emissiveIntensity = 0.35 + 0.6 * fecha;
  } };
}

// ---------------------------------------------------------------- as duas ferramentas e os talismãs
function lancaInvertida() { // nosso desenho: lâmina curta e larga, guarda com dois ganchos, cabo enfaixado, argola no fim
  const l = grp(), aco = LPmat(0xa8aec0, { metal: 0.85, rough: 0.28, rim: 0.7, liso: true });
  mesh(cyl(0.016, 0.018, 0.34, 8), LPmat(0x3a2a3a, { rim: 0.5 }), 0, 0, 0, l);
  for (let i = 0; i < 6; i++) { const r = mesh(new THREE.TorusGeometry(0.018, 0.004, 4, 10), LPmat(0x1a1218), 0, -0.14 + i * 0.055, 0, l); r.rotation.x = Math.PI / 2; }
  mesh(box(0.13, 0.022, 0.03), aco, 0, 0.18, 0, l);
  [-1, 1].forEach((k) => { const h = mesh(new THREE.ConeGeometry(0.012, 0.09, 4), aco, k * 0.07, 0.215, 0, l); h.rotation.z = -k * 0.5; });
  const sh = new THREE.Shape(); sh.moveTo(-0.026, 0); sh.lineTo(0.026, 0); sh.lineTo(0.021, 0.24); sh.lineTo(0, 0.33); sh.lineTo(-0.021, 0.24); sh.closePath();
  const lg = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.004, bevelSegments: 1 }); lg.translate(0, 0, -0.004);
  mesh(lg, aco, 0, 0.19, 0, l); mesh(new THREE.TorusGeometry(0.026, 0.005, 6, 16), aco, 0, -0.2, 0, l);
  return l;
}
const cordaTex = canvasTex(64, 64, (c, w, h) => { c.fillStyle = "#18161a"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(90,84,100,.55)"; c.lineWidth = 5; for (let i = -2; i < 4; i++) { c.beginPath(); c.moveTo(i * 22, 0); c.lineTo(i * 22 + 32, h); c.stroke(); } });
function cordaNegra() { // corda trançada preta, enrolada em espiral (as voltas se apoiam umas nas outras)
  const c = grp(), t = rep(cordaTex.clone(), 40, 1); t.needsUpdate = true; const m = SM(0xffffff, { map: t, roughness: 0.6 });
  const pts = []; for (let i = 0; i <= 140; i++) { const u = i / 140, a = u * Math.PI * 2 * 3.2, r = 0.2 - u * 0.08; pts.push(V3(Math.cos(a) * r, 0.028 + u * 0.1, Math.sin(a) * r)); }
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 280, 0.027, 8), m, 0, 0, 0, c);
  const ponta = [V3(0.2, 0.028, 0), V3(0.26, 0.02, 0.06), V3(0.32, 0.016, 0.04)]; mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ponta), 12, 0.027, 8), m, 0, 0, 0, c);
  return c;
}
const ofudaTex = canvasTex(64, 256, (c, w, h) => { c.fillStyle = "#efe6cc"; c.fillRect(0, 0, w, h); c.strokeStyle = "#a82a20"; c.lineWidth = 3; c.strokeRect(5, 5, w - 10, h - 10);
  c.fillStyle = "#a82a20"; c.beginPath(); c.arc(w / 2, 24, 9, 0, 7); c.fill(); c.fillStyle = "#2a1a14"; for (let i = 0; i < 6; i++) { c.fillRect(w / 2 - 2, 44 + i * 33, 4, 22); c.fillRect(w / 2 - 11 + hash(i) * 6, 52 + i * 33, 14 + hash(i * 3) * 8, 4); } });
const OFUDA_M = () => (OFUDA_M.m = OFUDA_M.m || new THREE.MeshStandardMaterial({ map: ofudaTex, side: THREE.DoubleSide, roughness: 0.9 }));
function ofuda(g, x, y, z, ry = 0, L = 0.26) { const m = mesh(new THREE.PlaneGeometry(0.065, L), OFUDA_M(), x, y - L / 2, z, g); m.rotation.y = ry; m.castShadow = false; return m; }
// fio vermelho (o apego): tubo fino que brilha, de um ponto a outro, com uma barriga
function fioVermelho(g) { const m = new THREE.MeshBasicMaterial({ color: 0xff3048, transparent: true, opacity: 0.9, blending: ADD, depthWrite: false }); const tb = mesh(new THREE.BufferGeometry(), m, 0, 0, 0, g); tb.castShadow = false;
  return { tb, m, set(a, b, sag = 0.3, k = 1) { const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24, uk = Math.min(u, k); pts.push(V3(lerp(a.x, b.x, uk), lerp(a.y, b.y, uk) - Math.sin(uk * Math.PI) * sag * (uk / Math.max(k, 0.001)) , lerp(a.z, b.z, uk))); }
    tb.geometry.dispose(); tb.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.006, 5); } };
}
