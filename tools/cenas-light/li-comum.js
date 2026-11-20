// ================================================================ vídeo: Como o Light perdeu pro Near e pro Mello? (comum)
// Usa su-comum.js (efeitos de luz, câmera em planos, chuva, orbe, linhas de luz). Personagens de Death Note desenhados
// por nós em low-poly; cenários baseados nos lugares do anime, redesenhados (nada de print ou arte oficial).
function vive(p, t, seed, rosto = {}, amt = 0.4) { restPose(p); idle(p, t, seed, amt); standFeet(p); rostoLP(p, t, rosto); }
function olhosW(p) { p.updateMatrixWorld(true); return p.userData.head.localToWorld(V3(0, CAB.EY, CAB.HW * 0.9)); }
function peitoW(p) { p.updateMatrixWorld(true); return p.userData.chest.localToWorld(V3(0, 0.16, 0.12)); }
const arr = (v) => [v.x, v.y, v.z];
const add3 = (v, d) => [v.x + d[0], v.y + d[1], v.z + d[2]];
// close no rosto: câmera a d da frente do personagem (rotação y), com deslocamento lateral
function closeRosto(p, d = 0.8, lado = 0.15, dy = 0, fov = 30) { const e = olhosW(p), a = p.rotation.y; return { pos: [e.x + Math.sin(a) * d + Math.cos(a) * lado, e.y + dy, e.z + Math.cos(a) * d - Math.sin(a) * lado], look: [e.x, e.y - 0.03, e.z], fov, near: 0.02 }; }

// ---------------------------------------------------------------- elenco de Death Note
const DN = { terno: 0x2a2c34, camisa: 0xe8e8e4, gravata: 0x8a1a22 };
const CABELOS_DN = {
  light: { cor: 0x7a4a2c, dentes: 16, dente: 0.34, crista: 0.004, franjaY: 0.95, ladoY: 0.05, nucaY: -0.75, esp: 0.009, espBorda: 0.0036, varia: 0.08, seed: 51, giro: 0.15,
    pontas: [...coroa(4, 1.0, 0.62, 0.42, 0.0, 0.0, -0.32, 0.5, -0.1, 0.4), ...coroa(5, 1.45, 0.4, 0.48, 0.35, 0.3, 0.55, 0.9, 0.06, 0.6)] },
  near: { cor: 0xeef0f4, dentes: 14, dente: 0.22, crista: 0.004, franjaY: 1.0, ladoY: 0.2, nucaY: -0.4, esp: 0.012, espBorda: 0.006, varia: 0.06, seed: 52,
    pontas: [...coroa(10, 1.5, 0.3, 0.42, 0.45, 0.1, 0.0, 2, -0.5, 0.7), ...coroa(9, 1.1, 0.3, 0.42, 0.35, 0.2, 0.05, 2, -0.6, 0.7), ...coroa(7, 0.55, 0.28, 0.4, 0.2, 0.2, 0.3, 1.4, -0.6, 0.7)] },
  mello: { cor: 0xe8c860, dentes: 26, dente: 0.12, crista: 0.003, franjaY: 1.0, ladoY: -1.0, nucaY: -1.3, esp: 0.009, espBorda: 0.004, varia: 0.03, seed: 53, pontas: [] },
  mikami: { cor: 0x1a1a20, dentes: 18, dente: 0.24, crista: 0.004, franjaY: 1.15, ladoY: 0.0, nucaY: -0.7, esp: 0.008, espBorda: 0.0034, varia: 0.05, seed: 54, giro: -0.2,
    pontas: coroa(4, 1.05, 0.6, 0.4, 0.0, 0.0, 0.2, 0.5, -0.1, 0.4) },
  takada: { cor: 0x2a1c18, dentes: 22, dente: 0.14, crista: 0.003, franjaY: 1.0, ladoY: -0.9, nucaY: -1.1, esp: 0.009, espBorda: 0.004, varia: 0.03, seed: 55, pontas: [] },
  ryuk: { cor: 0x101014, dentes: 12, dente: 0.6, crista: 0.006, franjaY: 0.7, ladoY: -0.2, nucaY: -0.9, esp: 0.012, espBorda: 0.005, varia: 0.2, seed: 56,
    pontas: [...coroa(9, 1.45, 0.75, 0.42, 0.8, 0.2, 0.0, 2, 0.1, 0.5), ...coroa(8, 0.9, 0.7, 0.4, 0.6, 0.3, 0.1, 2, 0.1, 0.5)] },
};
function oculos(p, cor = 0x202024) { const u = p.userData, m = LPmat(cor, { metal: 0.6, rough: 0.3 }); [-1, 1].forEach((k) => { const r = mesh(new THREE.TorusGeometry(0.02, 0.0025, 4, 12), m, k * 0.036, CAB.EY, surfZ(u.headM, k * 0.036, CAB.EY) + 0.006, u.head); r.scale.y = 0.8; }); mesh(box(0.02, 0.003, 0.003), m, 0, CAB.EY + 0.004, surfZ(u.headM, 0, CAB.EY) + 0.007, u.head); }
function gravata(p, cor = DN.gravata) { const u = p.userData, m = LPmat(cor, { rim: 0.6 }); const g = mesh(new THREE.ConeGeometry(0.022, 0.2, 4), m, 0, 0.18, 0.125, u.chest); g.rotation.set(Math.PI + 0.12, Math.PI / 4, 0); g.scale.z = 0.3; mesh(box(0.034, 0.03, 0.02), m, 0, 0.29, 0.12, u.chest); }
function lightLP(o = {}) { const p = pessoaLP({ seed: 61, pele: 0xffe0bc, olho: o.kira ? "#c41e2a" : "#8a4a2a", olhoAlt: 0.86, olhoTam: 0.94, brava: 0.15, roupa: DN.terno, calca: DN.terno, botoes: false, sobrancelha: 0x5a3020, cabelo: CABELOS_DN.light, ...o }); gravata(p); return p; }
function nearLP(o = {}) { return pessoaLP({ seed: 62, pele: 0xfff0e4, olho: "#3a3a44", olhoAlt: 0.85, roupa: 0xf2f2f4, calca: 0xf2f2f4, botoes: false, sobrancelha: 0xcfd2d8, cabelo: CABELOS_DN.near, scale: 0.9, ...o }); }
function melloLP(o = {}) { return pessoaLP({ seed: 63, pele: 0xffe2c4, olho: "#3a6a7a", olhoAlt: 0.82, brava: 0.5, roupa: 0x141418, calca: 0x141418, botoes: false, sobrancelha: 0xb89a40, cabelo: CABELOS_DN.mello, ...o }); }
function mikamiLP(o = {}) { const p = pessoaLP({ seed: 64, pele: 0xffe4c8, olho: "#3a2a24", olhoAlt: 0.78, brava: 0.4, roupa: 0x1c1e26, calca: 0x1c1e26, botoes: false, sobrancelha: 0x141418, cabelo: CABELOS_DN.mikami, ...o }); oculos(p); gravata(p, 0x2a3a6a); return p; }
function takadaLP(o = {}) { return pessoaLP({ seed: 65, pele: 0xffe6cc, olho: "#4a2a24", olhoAlt: 0.9, blush: true, roupa: 0x6a2a3a, calca: 0x3a1a24, botoes: false, sobrancelha: 0x2a1c18, cabelo: CABELOS_DN.takada, scale: 0.95, ...o }); }
// Ryuk: shinigami alto e magro, pele cinza-azulada, olhos amarelos com pupila vermelha, sorriso enorme, gola de penas e asas pretas
function ryukLP(o = {}) {
  const p = pessoaLP({ seed: 66, pele: 0x8a98b0, olho: "#e8c020", fenda: true, olhoAlt: 1.0, olhoTam: 1.15, brava: 0.3, roupa: 0x121216, calca: 0x121216, botoes: false, sobrancelha: 0x101014, cabelo: CABELOS_DN.ryuk, scale: 1.32, ...o });
  const u = p.userData, pena = LPmat(0x0c0c10, { rim: 0.9, rough: 0.9 });
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const c = mesh(new THREE.ConeGeometry(0.03, 0.16, 3), pena, Math.sin(a) * 0.12, 0.3, Math.cos(a) * 0.09, u.chest); c.rotation.set(Math.cos(a) * 1.2, 0, -Math.sin(a) * 1.2); }
  const asas = [-1, 1].map((k) => { const w = grp(u.chest, k * 0.08, 0.22, -0.12); for (let i = 0; i < 6; i++) { const f = mesh(new THREE.ConeGeometry(0.05, 0.55 - i * 0.05, 3), pena, k * (0.08 + i * 0.07), -0.05 - i * 0.04, -0.04, w); f.rotation.z = k * (1.9 - i * 0.12); f.scale.z = 0.3; } return w; });
  u.asas = asas;
  return p;
}

// ---------------------------------------------------------------- objetos
const capaTex = canvasTex(256, 360, (c, w, h) => { c.fillStyle = "#0c0c0e"; c.fillRect(0, 0, w, h); c.strokeStyle = "#3a3a40"; c.lineWidth = 4; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = "#e8e8e8"; c.font = "italic bold 46px serif"; c.textAlign = "center"; c.fillText("Caderno", w / 2, 150); c.fillText("da Morte", w / 2, 205); });
const paginaTex = canvasTex(256, 360, (c, w, h) => { c.fillStyle = "#f2efe6"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(60,80,140,.35)"; c.lineWidth = 2; for (let y = 40; y < h; y += 22) { c.beginPath(); c.moveTo(14, y); c.lineTo(w - 14, y); c.stroke(); } c.fillStyle = "#1a1a1a"; c.font = "22px serif"; ["Higuchi", "Kida", "Ooi", "Tanaka", "Watari"].forEach((n, i) => c.fillText(n, 24, 62 + i * 44)); });
function caderno(g, o = {}) {
  const c = grp(g), capa = new THREE.MeshStandardMaterial({ map: capaTex, roughness: 0.6 }), preto = LPmat(0x0c0c0e), pg = new THREE.MeshStandardMaterial({ map: paginaTex, roughness: 0.8, emissive: 0xffffff, emissiveMap: paginaTex, emissiveIntensity: 0.08 });
  mesh(box(0.26, 0.012, 0.36), preto, 0, 0.006, 0, c); const fol = mesh(box(0.25, 0.02, 0.35), LPmat(0xf0ece2), 0, 0.02, 0, c);
  const tampa = grp(c, -0.13, 0.031, 0); const tp = mesh(new THREE.PlaneGeometry(0.26, 0.36), capa, 0.13, 0.001, 0, tampa); tp.rotation.x = -Math.PI / 2;
  const pag = mesh(new THREE.PlaneGeometry(0.24, 0.34), pg, 0, 0.031, 0, c); pag.rotation.x = -Math.PI / 2; pag.visible = false;
  return { c, tampa, pag, abrir(k) { tampa.rotation.z = Math.PI * 0.95 * clamp(k); pag.visible = k > 0.4; } };
}
function maca(g, s = 1) { const m = grp(g); mesh(new THREE.IcosahedronGeometry(0.045 * s, 1), LPmat(0xb8141c, { rim: 0.8, rough: 0.4 }), 0, 0, 0, m).scale.y = 0.9; mesh(cyl(0.004 * s, 0.004 * s, 0.03 * s, 4), LPmat(0x3a2a18), 0, 0.045 * s, 0, m); const f = mesh(new THREE.ConeGeometry(0.012 * s, 0.03 * s, 3), LPmat(0x3a7a2a), 0.012 * s, 0.05 * s, 0, m); f.rotation.z = -1.2; return m; }
// peças de xadrez (o Light é o rei; o Near, peão branco; o Mello, peão preto)
function peca(g, tipo, cor) { const m = LPmat(cor, { rim: 0.8, rough: 0.35, metal: 0.1 }), p = grp(g); const prof = tipo === "rei" ? [[0.001, 0], [0.11, 0], [0.11, 0.03], [0.06, 0.06], [0.045, 0.3], [0.08, 0.34], [0.05, 0.38], [0.06, 0.46], [0.001, 0.48]] : [[0.001, 0], [0.09, 0], [0.09, 0.025], [0.05, 0.05], [0.035, 0.18], [0.06, 0.2], [0.001, 0.21]];
  mesh(lathe(prof, 8), m, 0, 0, 0, p); if (tipo === "rei") { mesh(box(0.02, 0.1, 0.02), m, 0, 0.53, 0, p); mesh(box(0.07, 0.02, 0.02), m, 0, 0.55, 0, p); } else mesh(sph(0.055, 8, 6), m, 0, 0.25, 0, p); return p; }
const tabuleiroTex = canvasTex(512, 512, (c, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? "#2a2420" : "#d8ccb4"; c.fillRect(i * 64, j * 64, 64, 64); } });
function tabuleiro(g, s = 1) { const t = grp(g); mesh(box(1.7 * s, 0.06, 1.7 * s), LPmat(0x3a2418), 0, 0.03, 0, t); const sup = mesh(new THREE.PlaneGeometry(1.6 * s, 1.6 * s), new THREE.MeshStandardMaterial({ map: tabuleiroTex, roughness: 0.35, metalness: 0.1 }), 0, 0.061, 0, t); sup.rotation.x = -Math.PI / 2; return t; }
// monitores (parede de telas da força-tarefa)
const telaTex = (txt, cor) => canvasTex(256, 160, (c, w, h) => { c.fillStyle = "#04070c"; c.fillRect(0, 0, w, h); c.fillStyle = cor; c.globalAlpha = 0.25; for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 1); c.globalAlpha = 1; c.font = "bold 64px serif"; c.textAlign = "center"; c.fillText(txt, w / 2, 104); });
function paredeTelas(g, x, z, cols, rows, o = {}) { const ts = []; const txts = o.txts || ["L", "N", "M", "K"]; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const tx = telaTex(txts[(i + j * 3) % txts.length], o.cor ?? "#7ad0ff"); const m = mesh(box(0.92, 0.58, 0.05), new THREE.MeshStandardMaterial({ color: 0x0a0c10, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 1.1, map: tx }), x + (i - (cols - 1) / 2) * 1.0, (o.y0 ?? 1.0) + j * 0.66, z, g); m.castShadow = false; ts.push(m); } return ts; }
// quebra-cabeça branco do Near (peças no chão)
function puzzle(g, n = 20, raio = 0.9) { const ps = []; const m = LPmat(0xf4f4f6, { rim: 0.5, rough: 0.5 }); for (let i = 0; i < n; i++) { const p = mesh(box(0.1, 0.012, 0.1), m, (hash(i) - 0.5) * raio * 2, 0.006, (hash(i * 3) - 0.5) * raio * 1.4, g); p.rotation.y = hash(i * 5) * 3; ps.push(p); } return ps; }
// galpão amarelo (Yellow Box): paredes de chapa ondulada amarela, porta de ferro, pilares, luz entrando pelo alto
const chapaTex = canvasTex(256, 256, (c, w, h) => { for (let x = 0; x < w; x += 16) { const g_ = c.createLinearGradient(x, 0, x + 16, 0); g_.addColorStop(0, "#b89428"); g_.addColorStop(0.5, "#e8c448"); g_.addColorStop(1, "#a07e1e"); c.fillStyle = g_; c.fillRect(x, 0, 16, h); } c.fillStyle = "rgba(60,40,10,.25)"; for (let i = 0; i < 30; i++) c.fillRect(hash(i) * w, hash(i * 3) * h, 2 + hash(i * 5) * 10, 20 + hash(i * 7) * 60); });
function galpao(g) {
  const parede = new THREE.MeshStandardMaterial({ map: rep(chapaTex, 6, 2), roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide }); parede.map.needsUpdate = true;
  mesh(box(16, 6, 0.2), parede, 0, 3, -6, g); [-8, 8].forEach((x) => mesh(box(0.2, 6, 14), parede, x, 3, 1, g)); mesh(box(16, 0.2, 14), LPmat(0x3a3020), 0, 6, 1, g);
  const chao = mesh(new THREE.PlaneGeometry(16, 14), new THREE.MeshStandardMaterial({ color: 0x5a5448, roughness: 0.4, metalness: 0.3 }), 0, 0, 1, g); chao.rotation.x = -Math.PI / 2;
  mesh(box(3.2, 4, 0.12), LPmat(0x4a4a50, { metal: 0.6, rough: 0.5 }), 0, 2, -5.85, g);
  [-4.5, 4.5].forEach((x) => [-3, 2].forEach((z) => mesh(box(0.35, 6, 0.35), LPmat(0x6a5a3a), x, 3, z, g)));
  for (let i = 0; i < 5; i++) { const j = mesh(box(1.4, 0.5, 0.05), new THREE.MeshBasicMaterial({ color: 0xfff0c0 }), -5 + i * 2.5, 5.2, -5.85, g); j.castShadow = false; }
  return godRays(g, [0, 5.4, -5], [0.15, -1, 0.9], { color: 0xffe0a0, n: 6, len: 9, w: 1.2, opacity: 0.06, spread: 8 });
}
// quarto do Light à noite: escrivaninha, luminária, janela com a cidade, cama
const cidadeTex = canvasTex(256, 256, (c, w, h) => { const g_ = c.createLinearGradient(0, 0, 0, h); g_.addColorStop(0, "#0a1024"); g_.addColorStop(1, "#2a2a4a"); c.fillStyle = g_; c.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { const x = i * 18 + hash(i) * 6, bh = 60 + hash(i * 3) * 120; c.fillStyle = "#0c0e18"; c.fillRect(x, h - bh, 16, bh); c.fillStyle = "#ffd890"; for (let k = 0; k < 10; k++) if (hash(i * 13 + k) > 0.6) c.fillRect(x + 3 + (k % 2) * 6, h - bh + 8 + Math.floor(k / 2) * 14, 4, 6); } });
function quartoLight(g) {
  const parede = LPmat(0x4a4a5a, { rim: 0.2, rough: 0.95 }), madeira = LPmat(0x6a4a30, { rim: 0.4 });
  const chao = mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.6 }), 0, 0, 0, g); chao.rotation.x = -Math.PI / 2;
  mesh(box(10, 4, 0.2), parede, 0, 2, -2.2, g); mesh(box(0.2, 4, 10), parede, -3.2, 2, 2, g); mesh(box(0.2, 4, 10), parede, 3.4, 2, 2, g);
  const jan = mesh(new THREE.PlaneGeometry(1.8, 1.4), new THREE.MeshBasicMaterial({ map: cidadeTex }), 1.2, 2.1, -2.08, g); jan.castShadow = false;
  [[0, 0.72], [0, -0.72]].forEach(() => {}); mesh(box(1.9, 0.08, 0.1), madeira, 1.2, 2.8, -2.05, g); mesh(box(1.9, 0.08, 0.1), madeira, 1.2, 1.4, -2.05, g); mesh(box(0.06, 1.4, 0.1), madeira, 1.2, 2.1, -2.05, g);
  // escrivaninha
  mesh(box(1.6, 0.06, 0.7), madeira, 0, 0.76, -1.65, g); [[-0.75, -1.95], [0.75, -1.95], [-0.75, -1.35], [0.75, -1.35]].forEach(([x, z]) => mesh(box(0.06, 0.76, 0.06), madeira, x, 0.38, z, g));
  const lum = grp(g, -0.55, 0.79, -1.85); mesh(cyl(0.08, 0.1, 0.03, 8), LPmat(0x1a1a1e), 0, 0, 0, lum); mesh(cyl(0.012, 0.012, 0.42, 5), LPmat(0x1a1a1e), 0, 0.21, 0, lum); const cup = mesh(new THREE.ConeGeometry(0.12, 0.14, 8, 1, true), LPmat(0x2a2a30, { side: THREE.DoubleSide }), 0.08, 0.44, 0.06, lum); cup.rotation.z = -0.6;
  const luz = new THREE.SpotLight(0xffd8a0, 1.6, 4, 0.8, 0.5, 1.5); luz.position.set(-0.45, 1.2, -1.75); luz.target.position.set(0, 0.76, -1.6); g.add(luz, luz.target); const bulbo = glowSprite(0xffd8a0, 0.12, 0.6); bulbo.position.set(-0.45, 1.18, -1.77); g.add(bulbo);
  // cadeira e cama
  mesh(box(0.5, 0.06, 0.5), LPmat(0x2a2a30), 0, 0.48, -0.95, g); mesh(box(0.5, 0.6, 0.06), LPmat(0x2a2a30), 0, 0.8, -0.72, g); mesh(cyl(0.03, 0.03, 0.46, 5), LPmat(0x1a1a1e), 0, 0.23, -0.95, g);
  mesh(box(1.1, 0.45, 2.1), LPmat(0x3a4a6a, { rim: 0.3 }), -2.4, 0.22, 0.4, g);
  return { luz, bulbo };
}

// cartões do Discord (keys) e claquete (aulas)
const keyTex = canvasTex(256, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#2a2050"); gr.addColorStop(1, "#7a5ad8"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,240,255,.9)"; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = "#fff"; c.font = "bold 54px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.fillText("KEY", w / 2, 82); c.font = "bold 22px sans-serif"; c.fillText("XXXX-XXXX-XXXX", w / 2, 122); });
const claqTex = canvasTex(256, 192, (c, w, h) => { c.fillStyle = "#1a1a1e"; c.fillRect(0, 0, w, h); c.fillStyle = "#f2f2f2"; for (let i = 0; i < 6; i++) { c.save(); c.translate(i * 48, 0); c.beginPath(); c.moveTo(0, 0); c.lineTo(24, 0); c.lineTo(48, 44); c.lineTo(24, 44); c.fill(); c.restore(); } c.font = "bold 30px sans-serif"; c.textAlign = "center"; c.fillText("AULA", w / 2, 110); c.font = "bold 22px sans-serif"; c.fillText("COMO FAZER", w / 2, 150); });
