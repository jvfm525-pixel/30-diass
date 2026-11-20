// ================================================================ vídeo: Por que o Grisha comeu a família real? (comum)
// Estilo do vídeo de referência (GUIA-ANIMACAO-ESTILO.md): vento nas folhas, na grama, no cabelo e no casaco; fundo desfocado;
// cenários de Attack on Titan redesenhados por nós em low-poly (muralhas, Shiganshina, capela dos Reiss, caverna de cristal,
// Caminhos). Usa su-comum.js e li-comum.js.

// ---------------------------------------------------------------- vento: folhas voando (instanciadas, determinísticas)
// box = [x0, x1, y0, y1, z0, z1]; dir = direção do vento; cada folha atravessa a caixa e volta (posição = função do tempo)
function folhasVento(g, n, box, o = {}) {
  const geo = new THREE.PlaneGeometry(0.07, 0.035); geo.translate(0.02, 0, 0);
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.7, emissive: o.brilho ?? 0x1a3a10, emissiveIntensity: 0.4 });
  const im = new THREE.InstancedMesh(geo, m, n); im.frustumCulled = false; im.castShadow = false; g.add(im);
  const cols = o.cores ?? [0x6aa83a, 0x8ac04a, 0x4a8a2a, 0xa8c858], col = new THREE.Color();
  for (let i = 0; i < n; i++) im.setColorAt(i, col.setHex(cols[i % cols.length]));
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const [x0, x1, y0, y1, z0, z1] = box, dir = new THREE.Vector3(...(o.dir ?? [1, -0.25, 0.15])).normalize(), vel = o.vel ?? 2.2, L = x1 - x0;
  return (t, forca = 1) => {
    for (let i = 0; i < n; i++) {
      const sp = vel * (0.7 + hash(i * 3.1) * 0.6) * forca, ph = hash(i * 1.7) * L, d = ((ph + t * sp) % L + L) % L;
      p.set(x0 + d, y0 + hash(i * 5.3) * (y1 - y0) + dir.y * d * 0.3 + Math.sin(t * 2.1 + i) * 0.12, z0 + hash(i * 7.9) * (z1 - z0) + dir.z * d + Math.cos(t * 1.7 + i * 2) * 0.1);
      e.set(t * (3 + hash(i) * 5) + i, t * (2 + hash(i * 2) * 4), t * 4 + i * 0.7); q.setFromEuler(e); const k = (o.s ?? 1) * (0.7 + hash(i * 9) * 0.8); s.set(k * 1.6, k, k);
      M4.compose(p, q, s); im.setMatrixAt(i, M4);
    }
    im.instanceMatrix.needsUpdate = true;
  };
}
// aba de casaco/cachecol que bate ao vento: plano com vértices ondulando (preso no osso 'osso')
function abaVento(p, osso, w, h, cor, pos, rot = [0, 0, 0], o = {}) {
  const u = p.userData, geo = new THREE.PlaneGeometry(w, h, 3, 8); geo.translate(0, -h / 2, 0);
  const m = mesh(geo, LPmat(cor, { rim: 0.8, side: THREE.DoubleSide }), ...pos, u[osso] || osso); m.rotation.set(...rot);
  const a = geo.attributes.position, b = a.array.slice();
  m.userData.vento = (t, forca = 1) => { for (let i = 0; i < a.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], k = Math.min(1, -y / h); a.setZ(i, b[i * 3 + 2] - (o.tras ?? 0.07) * k * forca * (1 + 0.25 * Math.sin(t * 3)) + Math.sin(t * 7 + y * 18 + x * 9) * 0.018 * k * forca); a.setX(i, x + Math.sin(t * 5.3 + y * 12) * 0.012 * k * forca); } a.needsUpdate = true; geo.computeVertexNormals(); };
  (u.abas = u.abas || []).push(m); return m;
}
function ventoAbas(p, t, f = 1) { (p.userData.abas || []).forEach((m) => m.userData.vento(t, f)); }

// ---------------------------------------------------------------- elenco de Attack on Titan (desenho nosso)
const barbaTex = canvasTex(128, 64, (c, w, h) => { const g_ = c.createRadialGradient(w / 2, h * 0.72, 3, w / 2, h * 0.66, w * 0.42); g_.addColorStop(0, "rgba(40,30,26,.42)"); g_.addColorStop(0.6, "rgba(40,30,26,.22)"); g_.addColorStop(1, "rgba(40,30,26,0)"); c.fillStyle = g_; c.fillRect(0, 0, w, h); c.clearRect(w * 0.34, h * 0.36, w * 0.32, h * 0.2); });
function barba(p) { const u = p.userData; const zAt = (x, y) => surfZ(u.headM, x, y); decal(u.head, barbaTex, 0.13, 0.06, 0, -0.005, zAt(0, -0.005) + 0.004, 0, 0, { suave: true }); }
const CABELOS_AOT = {
  // Grisha: cabelo até o ombro preso atrás, repartido no meio, mechas caindo dos lados do rosto
  grisha: { cor: 0x3a2618, dentes: 22, dente: 0.2, crista: 0.003, franjaY: 0.92, ladoY: -0.95, nucaY: -1.0, esp: 0.009, espBorda: 0.004, varia: 0.06, seed: 91,
    pontas: [[1.05, 0.95, 0.6, 0.32, -0.75, 0.05, -0.1, 0.5], [1.05, -0.95, 0.6, 0.32, -0.75, 0.05, -0.1, 0.5], [1.22, 0.32, 0.42, 0.3, -0.45, 0.0, -0.15, 0.5], [1.22, -0.3, 0.4, 0.3, -0.5, 0.0, -0.15, 0.5]] },
  // Kruger: preto, bagunçado, mechas caindo na testa
  kruger: { cor: 0x1a1a1e, dentes: 18, dente: 0.3, crista: 0.004, franjaY: 0.95, ladoY: 0.05, nucaY: -0.7, esp: 0.009, espBorda: 0.0036, varia: 0.12, seed: 92,
    pontas: [...coroa(6, 1.28, 0.42, 0.4, -0.3, 0.05, -0.65, 1.3, -0.15, 0.5), ...coroa(5, 1.5, 0.36, 0.42, 0.3, 0.35, 0.6, 1.2, 0.05, 0.6)] },
  // Frieda: chanel preto com franja reta
  frieda: { cor: 0x141418, dentes: 30, dente: 0.1, crista: 0.003, franjaY: 0.86, ladoY: -0.62, nucaY: -0.9, esp: 0.009, espBorda: 0.004, varia: 0.03, seed: 93, pontas: [] },
  rod: { cor: 0x8a7050, dentes: 18, dente: 0.2, crista: 0.003, franjaY: 1.25, ladoY: 0.0, nucaY: -0.6, esp: 0.007, espBorda: 0.003, varia: 0.05, seed: 94, pontas: coroa(4, 1.45, 0.4, 0.45, 0.2, 0.5, -0.3, 0.6, 0.1, 0.5) },
  // Eren adulto: cabelo comprido até o queixo, repartido, meio coque
  erenAdulto: { cor: 0x2e1e14, dentes: 22, dente: 0.18, crista: 0.003, franjaY: 0.95, ladoY: -1.05, nucaY: -0.95, esp: 0.009, espBorda: 0.004, varia: 0.07, seed: 95,
    pontas: [[1.05, 1.0, 0.7, 0.34, -0.8, 0.05, -0.1, 0.5], [1.05, -1.0, 0.7, 0.34, -0.8, 0.05, -0.1, 0.5], [1.25, 0.3, 0.5, 0.3, -0.55, 0.0, -0.15, 0.5], [1.25, -0.28, 0.48, 0.3, -0.6, 0.0, -0.15, 0.5]] },
};
// óculos redondos do Grisha
function oculosRedondos(p) { const u = p.userData, m = LPmat(0x8a6a3a, { metal: 0.8, rough: 0.25, rim: 0.3, liso: true }); [-1, 1].forEach((k) => { mesh(new THREE.TorusGeometry(0.0205, 0.0013, 6, 32), m, k * 0.036, CAB.EY - 0.002, surfZ(u.headM, k * 0.036, CAB.EY) + 0.008, u.head); mesh(box(0.012, 0.0014, 0.0014), m, k * 0.062, CAB.EY + 0.004, surfZ(u.headM, k * 0.062, CAB.EY) + 0.002, u.head); }); mesh(box(0.016, 0.0014, 0.0014), m, 0, CAB.EY + 0.004, surfZ(u.headM, 0, CAB.EY) + 0.009, u.head); }
// coque/rabo de cavalo
function rabo(p, cor, y = 0.06, z = -0.1, L = 0.12) { const u = p.userData, m = LPmat(cor, { rim: 0.5 }); const r = mesh(new THREE.ConeGeometry(0.03, L, 5), m, 0, y - L / 2, z, u.head); r.rotation.x = Math.PI - 0.25; return r; }
function coque(p, cor) { const u = p.userData; mesh(sph(0.04, 7, 5), LPmat(cor, { rim: 0.5 }), 0, 0.16, -0.08, u.head); }
function casacoLongo(p, cor, L = 0.62) { const u = p.userData; const c = mesh(new THREE.CylinderGeometry(0.165, 0.25, L, 12, 1, true), LPmat(cor, { rim: 0.8, side: THREE.DoubleSide }), 0, -L / 2 + 0.06, -0.005, u.hips); c.scale.z = 0.82; abaVento(p, "hips", 0.2, L * 0.9, cor, [0.09, -0.04, -0.14], [0.1, 0, 0]); abaVento(p, "hips", 0.2, L * 0.9, cor, [-0.09, -0.04, -0.14], [0.1, 0, 0]); return c; }
function grishaLP(o = {}) { const p = pessoaLP({ seed: 101, pele: 0xf4d0aa, olho: "#4a3a24", olhoAlt: 0.76, olhoTam: 0.9, brava: 0.0, rugas: 0.28, browW: 0.06, roupa: 0x6a5238, calca: 0x3a3028, sapato: 0x2a1e14, sola: 0x2a1e14, botoes: false, sobrancelha: 0x3a2618, cabelo: CABELOS_AOT.grisha, ...o });
  oculosRedondos(p); rabo(p, 0x3a2618); casacoLongo(p, 0x6a5238); return p; }
function krugerLP(o = {}) { const p = pessoaLP({ seed: 102, pele: 0xf0cca4, olho: "#3a3a40", olhoAlt: 0.6, brava: 0.6, rugas: 0.5, queixo: 0.8, roupa: 0x16161a, calca: 0x16161a, botoes: true, botao: 0xb89a50, sobrancelha: 0x16161a, cabelo: CABELOS_AOT.kruger, ...o }); casacoLongo(p, 0x16161a, 0.7); return p; }
function friedaLP(o = {}) { const p = pessoaLP({ seed: 103, pele: 0xf8e0c8, olho: "#4a5a8a", olhoAlt: 0.95, olhoTam: 1.04, browW: 0.056, queixo: 0.68, roupa: 0xe8e2d4, calca: 0xe8e2d4, sapato: 0x3a2a24, botoes: false, sobrancelha: 0x141418, cabelo: CABELOS_AOT.frieda, scale: 0.94, ...o });
  const u = p.userData; const s = mesh(new THREE.CylinderGeometry(0.16, 0.3, 0.75, 14, 1, true), LPmat(0xe8e2d4, { rim: 0.8, side: THREE.DoubleSide }), 0, -0.38, 0, u.hips); s.scale.z = 0.85; abaVento(p, "hips", 0.3, 0.6, 0xe8e2d4, [0, -0.08, -0.16], [0.08, 0, 0], { tras: 0.08 }); return p; }
function rodLP(o = {}) { const p = pessoaLP({ seed: 104, pele: 0xf0cca8, olho: "#5a4a30", olhoAlt: 0.7, brava: -0.1, rugas: 0.8, barba3d: 0x8a7050, roupa: 0x3a2a3a, calca: 0x2a2028, botoes: true, botao: 0xd8b860, sobrancelha: 0x8a7050, cabelo: CABELOS_AOT.rod, ...o }); casacoLongo(p, 0x3a2a3a, 0.6); return p; }
function criancaLP(i, o = {}) { const cab = [0x8a6a40, 0x3a2a20, 0xc8a060, 0x5a3a28][i % 4]; return pessoaLP({ seed: 110 + i, pele: 0xf8dcc0, olho: "#4a5a6a", olhoAlt: 1.0, olhoTam: 1.1, blush: true, roupa: [0x5a6a8a, 0x8a5a4a, 0x6a7a5a, 0x7a6a8a][i % 4], calca: 0x3a3a44, botoes: false, sobrancelha: cab, cabelo: { ...CABELOS_AOT.kruger, cor: cab, seed: 120 + i }, scale: 0.62 + (i % 2) * 0.06, ...o }); }
function erenAdultoLP(o = {}) { const p = pessoaLP({ seed: 105, pele: 0xf2d2ae, olho: "#2a9a88", olhoAlt: 0.66, brava: 0.5, queixo: 0.78, roupa: 0x1e1e24, calca: 0x1e1e24, botoes: false, sobrancelha: 0x2e1e14, cabelo: CABELOS_AOT.erenAdulto, ...o }); coque(p, 0x2e1e14); casacoLongo(p, 0x1e1e24, 0.72); return p; }
function erenKidLP(o = {}) { return erenCriancaLP({ scale: 0.72, ...o }); }

// ---------------------------------------------------------------- cenários de Attack on Titan
// textura de pedra das muralhas (blocos grandes cinza-bege com manchas)
const muroTex = canvasTex(512, 512, (c, w, h) => { c.fillStyle = "#cfc8b8"; c.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) { const y = r * 128, off = (r % 2) * 128; for (let k = -1; k < 3; k++) { const x = k * 256 + off, v = 190 + hash(r * 7 + k) * 30; c.fillStyle = `rgb(${v},${v - 6},${v - 18})`; c.fillRect(x + 3, y + 3, 250, 122); } c.fillStyle = "rgba(90,84,74,.55)"; c.fillRect(0, y, w, 3); for (let k = -1; k < 3; k++) c.fillRect(k * 256 + off, y, 3, 128); }
  for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(80,70,60,${0.04 + hash(i) * 0.08})`; c.fillRect(hash(i * 3) * w, hash(i * 5) * h, 4 + hash(i * 7) * 30, 20 + hash(i * 9) * 120); } }, { wrap: true });
function matMuro(sx, sy) { const map = muroTex.clone(); map.needsUpdate = true; rep(map, sx, sy); return SM(0xffffff, { map, roughness: 0.95 }); }
// muralha em arco (raio R, altura H): segmentos retos, ameias no topo, talude na base; gate opcional no ângulo 0
function muralha(g, R = 60, H = 50, o = {}) { const m = grp(g, ...(o.c ?? [0, 0, 0])), a0 = o.a0 ?? -0.6, a1 = o.a1 ?? 0.6, n = o.n ?? 10, esp = o.esp ?? 8;
  for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * (i + 0.5) / n, len = 2 * R * Math.sin((a1 - a0) / n / 2) + 0.4, s = grp(m, Math.sin(a) * R, 0, -Math.cos(a) * R); s.rotation.y = -a;
    mesh(box(len, H, esp), matMuro(len / 12, H / 6), 0, H / 2, 0, s); const ta = mesh(box(len, H * 0.2, esp * 0.6), matMuro(len / 12, 0.6), 0, H * 0.08, esp * 0.65, s); ta.rotation.x = -0.4;
    mesh(box(len, 1.0, esp * 1.1), SM(0x8a8478), 0, H + 0.4, 0, s); for (let k = 0; k < Math.floor(len / 3); k++) mesh(box(1.6, 1.8, 0.8), SM(0x9a948a), -len / 2 + 1.5 + k * 3, H + 1.6, esp * 0.5, s);
    if (o.portao && Math.abs(a) < (a1 - a0) / n / 2 + 1e-3) { const pt = mesh(new THREE.CylinderGeometry(7, 7, esp + 0.4, 16, 1, false, 0, Math.PI), SM(0x1a1612), 0, 9, 0, s); pt.rotation.x = Math.PI / 2; pt.rotation.z = Math.PI / 2 * 0; mesh(box(14, 9, esp + 0.4), SM(0x1a1612), 0, 4.5, 0, s); } }
  return m; }
// Titã Colossal: cabeça sem pele (fibras de músculo vermelhas), sem lábios, fileiras de dentes, olhos fundos, vapor
const musculoTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#a83a30"; c.fillRect(0, 0, w, h); for (let i = 0; i < 140; i++) { const x = hash(i) * w, lw = 1 + hash(i * 3) * 4, v = hash(i * 7); c.strokeStyle = v > 0.55 ? `rgba(240,140,120,${0.25 + v * 0.3})` : `rgba(90,20,18,${0.3 + v * 0.3})`; c.lineWidth = lw; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 8, h * 0.3, x - 8, h * 0.7, x + 4, h); c.stroke(); } });
function colossal(g, s = 1) { const c = grp(g), mus = new THREE.MeshStandardMaterial({ map: musculoTex, roughness: 0.55, color: 0xffffff, emissive: 0x3a0806, emissiveIntensity: 0.4 }), osso = LPmat(0xf0e4c8, { rim: 0.5, liso: true }), escuro = LPmat(0x1a0604);
  const cab = mesh(new THREE.SphereGeometry(9 * s, 28, 20), mus, 0, 0, 0, c); cab.scale.set(0.85, 1.12, 0.92); deform(cab.geometry, (v) => { v.x *= 1 + 0.08 * Math.sin(v.y * 0.6); if (v.z > 3 && v.y < -1) v.z += 0.6; if (v.z > 4 && Math.abs(v.x) < 2.2 && v.y > -1 && v.y < 2) v.z -= 0.9; });
  [-1, 1].forEach((k) => { const ma = mesh(new THREE.SphereGeometry(2.4 * s, 12, 10), mus, k * 4.6 * s, -3.4 * s, 6.0 * s, c); ma.scale.set(0.7, 1.4, 0.55); });
  const boca = mesh(box(8.4 * s, 4.6 * s, 2 * s), escuro, 0, -6.2 * s, 6.6 * s, c);
  for (let i = 0; i < 14; i++) { const x = (i - 6.5) * 0.62 * s, z = 7.7 * s - Math.abs(i - 6.5) * 0.22 * s; mesh(box(0.55 * s, 1.5 * s, 0.5 * s), osso, x, -4.5 * s, z, c); mesh(box(0.55 * s, 1.3 * s, 0.5 * s), osso, x, -7.6 * s, z - 0.2 * s, c); }
  [-1, 1].forEach((k) => { mesh(new THREE.SphereGeometry(1.7 * s, 12, 10), escuro, k * 3.0 * s, 2.4 * s, 6.9 * s, c); const ol = mesh(new THREE.SphereGeometry(0.85 * s, 12, 10), LPmat(0xf4ece0, { liso: true }), k * 3.0 * s, 2.3 * s, 7.6 * s, c); mesh(new THREE.SphereGeometry(0.32 * s, 8, 6), LPmat(0x1a1210, { liso: true }), k * 3.0 * s, 2.3 * s, 8.4 * s, c); });
  mesh(new THREE.ConeGeometry(0.9 * s, 1.4 * s, 4), escuro, 0, -0.2 * s, 8.2 * s, c).rotation.x = Math.PI;
  return c; }
// casa de enxaimel (paredes claras com vigas escuras) e telhado vermelho: Shiganshina
// materiais das casas compartilhados (centenas de casas na vista de cima não podem criar material cada uma)
const CASA_MAT = {}; function casaMats() { if (CASA_MAT.pm) return CASA_MAT; const pl = texPlaster(), rf = texRoof();
  CASA_MAT.pm = SM(0xffffff, { map: rep(pl.clone(), 1.5, 1.7) }); CASA_MAT.pm.map.needsUpdate = true;
  CASA_MAT.tel = SM(0xffffff, { map: rep(rf.map.clone(), 2, 2), normalMap: rf.normalMap }); CASA_MAT.tel.map.needsUpdate = true;
  CASA_MAT.jan = new THREE.MeshStandardMaterial({ color: 0x2a3040 }); CASA_MAT.janLuz = new THREE.MeshStandardMaterial({ color: 0x2a3040, emissive: 0xffc070, emissiveIntensity: 1.2 });
  CASA_MAT.porta = LPmat(0x4a3020); CASA_MAT.cham = SM(0x7a6a5a); return CASA_MAT; }
function casaEnx(g, x, z, o = {}) { const M = casaMats(); const h = grp(g, x, 0, z); h.rotation.y = o.ry ?? 0; const W = o.w ?? 4, D = o.d ?? 4, A = o.h ?? 5;
  mesh(box(W, A, D), M.pm, 0, A / 2, 0, h);
  [-1, 1].forEach((k) => { const r = mesh(box(W + 0.6, 0.2, D * 0.62), M.tel, 0, A + D * 0.22, k * D * 0.25, h); r.rotation.x = k * 0.75; });
  for (let j = 0; j < (o.janelas ?? 2); j++) [-1, 1].forEach((k) => mesh(box(0.6, 0.8, 0.06), o.luz ? M.janLuz : M.jan, k * W * 0.25, 1.6 + j * 1.6, D / 2 + 0.03, h));
  mesh(box(0.9, 1.6, 0.06), M.porta, 0, 0.8, D / 2 + 0.03, h); if (o.chamine !== false) mesh(box(0.5, 1.4, 0.5), M.cham, W * 0.3, A + D * 0.4, -D * 0.1, h); return h; }
function ruaPedra(g, w = 6, L = 60, z0 = 0) { const t = texBlocks([150, 140, 128], [118, 110, 100]), m = SM(0xffffff, { map: rep(t.map.clone(), w / 1.2, L / 1.2), normalMap: t.normalMap, roughness: 0.85 }); m.map.needsUpdate = true; const r = mesh(new THREE.PlaneGeometry(w, L), m, 0, 0.01, z0 - L / 2, g); r.rotation.x = -Math.PI / 2; return r; }
// multidão de gente pequena fugindo (silhuetas low-poly simples)
function multidao(g, n, area, o = {}) { const ps = []; const corpo = new THREE.CapsuleGeometry(0.16, 0.7, 3, 6), cab = new THREE.SphereGeometry(0.13, 6, 5);
  for (let i = 0; i < n; i++) { const p = grp(g), c = [0x5a4a3a, 0x6a5a4a, 0x4a4a5a, 0x7a6a4a, 0x3a3a3a][i % 5]; mesh(corpo, LPmat(c), 0, 0.55, 0, p); mesh(cab, LPmat(0xe8c8a8), 0, 1.15, 0, p); p.userData.b = [area[0] + hash(i * 3.3) * (area[1] - area[0]), area[2] + hash(i * 5.1) * (area[3] - area[2]), 0.7 + hash(i) * 0.5]; ps.push(p); }
  return (t, sp = 3) => ps.forEach((p, i) => { const [x, z, v] = p.userData.b; const zz = z + ((t * sp * v) % 40); p.position.set(x + Math.sin(t * 2 + i) * 0.2, Math.abs(Math.sin(t * 9 * v + i)) * 0.1, zz); p.rotation.set(0.15, 0, Math.sin(t * 9 * v + i) * 0.08); }); }
// capela dos Reiss: pedra, telhado escuro, torre com sino, vitral aceso
function capela(g) { const c = grp(g), pm = matMuro(2, 2), tel = LPmat(0x2a2a34, { rim: 0.4 });
  mesh(box(7, 6, 12), pm, 0, 3, 0, c); [-1, 1].forEach((k) => { const r = mesh(box(4.9, 0.3, 12.8), tel, -k * 1.9, 7.35, 0, c); r.rotation.z = k * 0.62; }); [-1, 1].forEach((k) => { const f = mesh(new THREE.CylinderGeometry(0.001, 3.6, 2.6, 3, 1), pm, 0, 7.1, k * 6.0, c); f.rotation.set(Math.PI / 2 * 0, Math.PI / 2, 0); f.scale.set(1, 1, 0.08); });
  const torre = grp(c, 0, 0, 6.5); mesh(box(3, 12, 3), pm, 0, 6, 0, torre); const ag = mesh(new THREE.ConeGeometry(2.4, 5, 4), tel, 0, 14.5, 0, torre); ag.rotation.y = Math.PI / 4; mesh(box(0.15, 1.4, 0.15), SM(0xd8c070), 0, 17.6, 0, torre); mesh(box(0.8, 0.15, 0.15), SM(0xd8c070), 0, 17.8, 0, torre);
  const vit = mesh(new THREE.CircleGeometry(1.1, 12), new THREE.MeshBasicMaterial({ color: 0xffc070 }), 0, 9, 8.02, c); mesh(box(1.4, 2.6, 0.1), new THREE.MeshBasicMaterial({ color: 0xffb060 }), 0, 1.3, 8.02, c);
  [-1, 1].forEach((k) => [-3, 0, 3].forEach((z) => mesh(box(0.1, 1.8, 0.9), new THREE.MeshBasicMaterial({ color: 0xffb060 }), k * 3.52, 3.5, z, c))); return c; }
// caverna de cristal embaixo da capela: cúpula escura, aglomerados de cristal azul brilhante, chão espelhado
function cavernaCristal(g, o = {}) { const c = grp(g), cr = new THREE.MeshStandardMaterial({ color: 0x9ad8ff, emissive: 0x2a8aff, emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.15, transparent: true, opacity: 0.88, flatShading: true });
  const cup = mesh(new THREE.SphereGeometry(18, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), LPmat(0x0c1424, { rim: 0.2, side: THREE.BackSide }), 0, 0, 0, c); deform(cup.geometry, (v) => v.multiplyScalar(0.92 + hash(v.x * 3 + v.z) * 0.12));
  const chao = mesh(new THREE.CircleGeometry(18, 24), new THREE.MeshStandardMaterial({ color: 0x1a2a40, metalness: 0.7, roughness: 0.18, emissive: 0x0a1a30, emissiveIntensity: 0.4 }), 0, 0.005, 0, c); chao.rotation.x = -Math.PI / 2;
  const crs = []; const N = o.n ?? 70; for (let i = 0; i < N; i++) { const a = hash(i * 1.3) * 6.28, r = 6 + hash(i * 2.9) * 10, h = 0.8 + hash(i * 4.1) * 3.5, x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.hypot(x, z) < 7 && z > -9) continue;
    const k = mesh(new THREE.OctahedronGeometry(1, 0), cr, x, h * 0.45, z, c); k.scale.set(0.35 + hash(i) * 0.5, h, 0.35 + hash(i * 7) * 0.5); k.rotation.set((hash(i * 3) - 0.5) * 0.5, hash(i * 5) * 3, (hash(i * 9) - 0.5) * 0.5); k.castShadow = false; crs.push(k); }
  for (let i = 0; i < 18; i++) { const a = i * 0.35, k = mesh(new THREE.OctahedronGeometry(1, 0), cr, Math.cos(a) * 12, 13 - hash(i) * 3, Math.sin(a) * 12 - 2, c); k.scale.set(0.3, 2.5 + hash(i) * 2, 0.3); k.rotation.x = Math.PI; }
  const luz = new THREE.PointLight(0x5ab0ff, 6, 30, 1.2); luz.position.set(0, 6, -4); c.add(luz); const luz2 = new THREE.PointLight(0x7ad0ff, 3, 18, 1.4); luz2.position.set(-5, 2, 3); c.add(luz2);
  const poeira = dustPts(220, [-10, 10, 0.2, 8, -10, 8], 0x9ae0ff, 0.05, 0.75); c.add(poeira);
  for (let i = 0; i < 26; i++) { const an = hash(i * 9.1) * 6.28, r = 4.5 + hash(i * 2.2) * 5, xx = Math.cos(an) * r, zz = Math.sin(an) * r - 3; if (Math.abs(xx) < 4 && zz > -7) continue; const k = mesh(new THREE.OctahedronGeometry(1, 0), cr, xx, 0.3, zz, c); k.scale.set(0.12 + hash(i) * 0.12, 0.4 + hash(i * 3) * 0.6, 0.12 + hash(i * 5) * 0.12); k.rotation.set((hash(i * 4) - 0.5) * 0.8, hash(i) * 3, (hash(i * 6) - 0.5) * 0.8); k.castShadow = false; crs.push(k); }
  const raiosC = godRays(c, [0, 16, -5], [0.05, -1, 0.15], { color: 0x9ad8ff, n: 5, len: 16, w: 1.4, opacity: 0.06, spread: 5 });
  const brilhos = estrelinhas(c, 50, [-9, 9, 0.3, 7, -12, 5], { cor: 0xbfe8ff, s: 0.18 });
  return { c, crs, cr, luz, poeira, brilhos }; }
// Caminhos: areia clara infinita, céu de estrelas, a árvore de luz ao longe (linhas de luz subindo e ramificando)
function caminhos(g) { const ceu = skyDome(g, { top: 0x04060e, mid: 0x0a1630, hor: 0x2a3a6a, ground: 0x0a0c14, sunDir: [0, 0.2, -1], sunCol: 0xa8d0ff, sunI: 0.4, disk: 0.5, cov: 0, cloudA: 0, stars: 1.6, midY: 0.15 });
  const ch = mesh(new THREE.PlaneGeometry(200, 200, 60, 60), new THREE.MeshStandardMaterial({ color: 0xc8b898, roughness: 0.95, flatShading: true }), 0, 0, 0, g); ch.rotation.x = -Math.PI / 2; deform(ch.geometry, (v) => { v.z = Math.sin(v.x * 0.12) * 0.4 + Math.cos(v.y * 0.1) * 0.5 - 0.5; });
  const arv = grp(g, 0, 0, -60); const ramos = []; const ramo = (x, y, z, a, L, d) => { if (d > 5) return; const x2 = x + Math.sin(a) * L * 0.6, y2 = y + L, z2 = z + Math.cos(a * 1.7) * L * 0.2; ramos.push(linhaLuz(arv, [[x, y, z], [(x + x2) / 2 + Math.sin(d + a) * 0.6, (y + y2) / 2, z], [x2, y2, z2]], { curva: true, r: 0.9 / (d + 1), cor: 0xbfe8ff, seg: 16 })); ramo(x2, y2, z2, a - 0.5, L * 0.72, d + 1); ramo(x2, y2, z2, a + 0.5, L * 0.72, d + 1); };
  ramo(0, 0, 0, 0, 26, 0); const brilho = glowSprite(0x9ad8ff, 60, 0.06); brilho.position.set(0, 40, -60); g.add(brilho);
  // os caminhos de luz no céu: fios que descem de todas as direções e convergem na árvore
  for (let i = 0; i < 14; i++) { const an = (i / 14) * Math.PI * 2, R = 70 + hash(i) * 40; ramos.push(linhaLuz(g, [[Math.cos(an) * R, 30 + hash(i * 3) * 25, -60 + Math.sin(an) * R * 0.6], [Math.cos(an) * R * 0.45, 45 + hash(i * 5) * 10, -60 + Math.sin(an) * R * 0.25], [0, 40, -60]], { curva: true, r: 0.18, cor: 0xbfe8ff, seg: 30 })); }
  const pts = dustPts(300, [-30, 30, 0.2, 20, -60, 10], 0xbfe8ff, 0.08, 0.8); g.add(pts); return { ceu, ramos, pts }; }
// árvore grande e redonda do morro (como a da referência): copa feita de muitos aglomerados de esferas, tronco grosso com raízes
function arvoreMorro(g, x, z, s = 1) { const a = grp(g, x, 0, z), bk = texBark(), cas = SM(0xffffff, { map: rep(bk.map.clone(), 1, 2), normalMap: bk.normalMap, color: 0xa88866, side: THREE.DoubleSide }); cas.map.needsUpdate = true;
  mesh(lathe([[0.7 * s, 0], [0.5 * s, 0.6 * s], [0.42 * s, 2.5 * s], [0.38 * s, 4.2 * s], [0.001, 4.4 * s]], 10), cas, 0, 0, 0, a);
  for (let i = 0; i < 5; i++) { const r = mesh(cyl(0.12 * s, 0.22 * s, 1.6 * s, 6), cas, Math.cos(i * 1.3) * 0.7 * s, 0.15 * s, Math.sin(i * 1.3) * 0.7 * s, a); r.rotation.set(Math.sin(i * 1.3) * 1.2, 0, -Math.cos(i * 1.3) * 1.2); }
  for (let i = 0; i < 4; i++) { const r = mesh(cyl(0.08 * s, 0.2 * s, 2.4 * s, 6), cas, Math.cos(i * 1.6) * 0.6 * s, 4.2 * s, Math.sin(i * 1.6) * 0.6 * s, a); r.rotation.set(Math.sin(i * 1.6) * 0.8, 0, -Math.cos(i * 1.6) * 0.8); }
  const fol = [0x3e8a2a, 0x4e9a32, 0x5aa83a, 0x6ab84a, 0x34782a].map((c) => LPmat(c, { rim: 0.6, rough: 0.8 })), cl = [];
  for (let i = 0; i < 120; i++) { const th = hash(i * 1.7) * 6.28, ph = hash(i * 2.3) * 1.35, r = (2.0 + hash(i * 3.1) * 1.2) * s; const m = mesh(new THREE.IcosahedronGeometry((0.42 + hash(i * 4.4) * 0.42) * s, 1), fol[i % 5], Math.cos(th) * Math.sin(ph + 0.3) * r, 5.6 * s + Math.cos(ph + 0.3) * r * 0.62, Math.sin(th) * Math.sin(ph + 0.3) * r, a); m.userData.b = m.position.clone(); cl.push(m); }
  return { a, cl, vento(t, f = 1) { cl.forEach((m, i) => { m.position.x = m.userData.b.x + Math.sin(t * 1.6 + i * 0.7) * 0.06 * f * s; m.position.y = m.userData.b.y + Math.sin(t * 2.1 + i) * 0.03 * f * s; }); } }; }
function morroGrama(g, o = {}) { const hf = o.hf ?? ((x, z) => Math.max(0, 1.2 - (x * x + z * z) * 0.004) - Math.max(0, (Math.hypot(x, z) - 25)) * 0.05);
  terrain(g, { size: 220, segs: 110, h: hf, grassA: 0x5a9a3a, grassB: 0x8ab84a, dirt: 0x7a8a4a, rock: 0x6a7a5a }); grassField(g, o.n ?? 5000, [-16, 16, -16, 16], hf, { s: 0.75, colA: 0x5a9a2a, colB: 0x9ac84a }); return hf; }

// câmeras de depuração
Object.assign(DBGC, {
  "s0-capa": [{ pos: [0, 1.5, 4], look: [0, 1, 0], fov: 40 }],
});
