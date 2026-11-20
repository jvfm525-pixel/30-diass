// ================================================================ vídeo: Por que o Ging abandonou o Gon? (comum)
// Usa su-comum.js e li-comum.js (mãos, câmera, gestos). Personagens de Hunter x Hunter desenhados por nós em low-poly;
// cenários baseados nos lugares da obra, redesenhados (nada de print ou arte oficial).

// ---------------------------------------------------------------- elenco
const CABELOS_HXH = {
  gon: { cor: 0x14180f, dentes: 14, dente: 0.4, crista: 0.005, franjaY: 1.05, ladoY: 0.3, nucaY: -0.4, esp: 0.011, espBorda: 0.004, varia: 0.1, seed: 71,
    pontas: [...coroa(9, 1.62, 0.95, 0.5, 1.35, 0.08, 0.0, 2, 0.0, 0.62), ...coroa(7, 1.3, 0.75, 0.52, 1.0, 0.28, 0.25, 2, 0.04, 0.6), ...coroa(4, 1.05, 0.5, 0.5, 0.6, -0.1, -0.35, 0.7, 0.0, 0.6)] },
  ging: { cor: 0x16161a, dentes: 16, dente: 0.4, crista: 0.005, franjaY: 1.0, ladoY: 0.15, nucaY: -0.6, esp: 0.01, espBorda: 0.0036, varia: 0.14, seed: 72,
    pontas: [...coroa(8, 1.35, 0.5, 0.52, 0.5, 0.3, 0.1, 2, 0.12, 0.6), ...coroa(6, 1.1, 0.42, 0.5, 0.25, 0.4, 0.6, 1.2, 0.1, 0.6)] },
  mito: { cor: 0xc4542a, dentes: 24, dente: 0.14, crista: 0.003, franjaY: 1.02, ladoY: -0.55, nucaY: -0.85, esp: 0.009, espBorda: 0.004, varia: 0.04, seed: 73, pontas: [] },
  kite: { cor: 0xe6e6ea, dentes: 26, dente: 0.12, crista: 0.003, franjaY: 1.0, ladoY: -1.1, nucaY: -1.45, esp: 0.009, espBorda: 0.004, varia: 0.05, seed: 74, pontas: [] },
};
const PANO = 0xe2d6bc;
// turbante/faixa do Ging: anel de pano em volta da cabeça com a ponta caindo atrás
function turbante(p, cor = PANO) { const u = p.userData, m = LPmat(cor, { rim: 0.7, rough: 0.9 }); const a = mesh(new THREE.TorusGeometry(0.084, 0.024, 6, 14), m, 0, 0.142, -0.01, u.head); a.rotation.x = Math.PI / 2 + 0.2; a.scale.set(1, 1.08, 1);
  const b = mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 14), m, 0, 0.165, -0.018, u.head); b.rotation.x = Math.PI / 2 + 0.28; return a; }
// barba por fazer (sombra no queixo)
const barbaTex = canvasTex(128, 64, (c, w, h) => { const g_ = c.createRadialGradient(w / 2, h * 0.75, 4, w / 2, h * 0.7, w * 0.55); g_.addColorStop(0, "rgba(30,26,24,.55)"); g_.addColorStop(0.6, "rgba(30,26,24,.35)"); g_.addColorStop(1, "rgba(30,26,24,0)"); c.fillStyle = g_; c.fillRect(0, 0, w, h); c.clearRect(w * 0.36, h * 0.3, w * 0.28, h * 0.22); });
function barba(p) { const u = p.userData; const zAt = (x, y) => surfZ(u.headM, x, y); decal(u.head, barbaTex, 0.13, 0.06, 0, -0.005, zAt(0, -0.005) + 0.004, 0, 0, { suave: true }); }
function gingLP(o = {}) { const p = pessoaLP({ seed: 81, pele: 0xf4cfa8, olho: "#3a2a1c", olhoAlt: 0.84, olhoTam: 0.96, brava: 0.25, roupa: 0x6a5a44, calca: 0x2e2c2a, sapato: 0x2a1e14, sola: 0x2a1e14, botoes: false, sobrancelha: 0x16161a, cabelo: CABELOS_HXH.ging, ...o }); turbante(p); barba(p); cachecol(p, PANO); return p; }
function cachecol(p, cor) { const u = p.userData, m = LPmat(cor, { rim: 0.6, rough: 0.9 }); const c = mesh(new THREE.TorusGeometry(0.085, 0.03, 6, 14), m, 0, 0.3, 0.0, u.chest); c.rotation.x = Math.PI / 2 - 0.2; c.scale.set(1, 0.85, 1); }
// Gon: criança, cabelo espetado pra cima, jaqueta verde, short verde, botas; olhos castanhos grandes
function gonLP(o = {}) { const p = pessoaLP({ seed: 82, pele: 0xf6d2ac, olho: "#5a3418", olhoAlt: 1.0, olhoTam: 1.12, brava: 0.05, roupa: 0x2f7a3a, calca: 0x2a6a32, sapato: 0x1e5a2a, sola: 0xe8e4d8, botoes: false, sobrancelha: 0x14180f, cabelo: CABELOS_HXH.gon, scale: 0.78, ...o });
  return p; }
function mitoLP(o = {}) { const p = pessoaLP({ seed: 83, pele: 0xf8dcc0, olho: "#6a3a22", olhoAlt: 0.92, blush: true, roupa: 0xeee6d6, calca: 0x7a4a3a, sapato: 0x4a2a1a, sola: 0x4a2a1a, botoes: false, sobrancelha: 0xa0401e, cabelo: CABELOS_HXH.mito, scale: 0.94, ...o });
  const u = p.userData, av = LPmat(0xe8b8a0, { rim: 0.5, side: THREE.DoubleSide }); const s = mesh(new THREE.CylinderGeometry(0.17, 0.27, 0.6, 12, 1, true), LPmat(0x7a4a3a, { rim: 0.6, side: THREE.DoubleSide }), 0, -0.3, 0.0, u.hips); s.scale.z = 0.85;
  const a = mesh(box(0.2, 0.36, 0.01), av, 0, -0.1, 0.15, u.hips); a.rotation.x = 0.12; return p; }
function kiteLP(o = {}) { const p = pessoaLP({ seed: 84, pele: 0xf6dcc4, olho: "#2a2a30", olhoAlt: 0.8, brava: 0.3, roupa: 0xe6e2da, calca: 0x2a2a30, botoes: false, sobrancelha: 0xd0d0d6, cabelo: CABELOS_HXH.kite, ...o });
  const u = p.userData, m = LPmat(0xf2f0ea, { rim: 0.7 }), fita = LPmat(0x2a2a30); mesh(cyl(0.085, 0.095, 0.07, 12), m, 0, 0.19, -0.015, u.head); mesh(cyl(0.14, 0.14, 0.01, 14), m, 0, 0.155, -0.015, u.head); mesh(cyl(0.096, 0.096, 0.024, 12), fita, 0, 0.172, -0.015, u.head);
  const casaco = mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.62, 12, 1, true), LPmat(0xe6e2da, { rim: 0.8, side: THREE.DoubleSide }), 0, -0.26, -0.01, u.hips); casaco.scale.z = 0.8; return p; }
// Netero: velho, careca, barba branca longa, camisa branca; pequeno
function neteroLP(o = {}) { const p = pessoaLP({ seed: 85, pele: 0xf2d2b0, olho: "#2a2a30", olhoAlt: 0.55, olhoTam: 0.85, brava: 0.4, roupa: 0xd8cdb4, calca: 0x8a7a60, sapato: 0x2a2a2a, botoes: false, sobrancelha: 0xf0f0f0, scale: 0.86, ...o });
  const u = p.userData, bm = LPmat(0xf4f4f6, { rim: 0.6, rough: 0.9 }); const z0 = surfZ(u.headM, 0, -0.02);
  const bb = mesh(new THREE.ConeGeometry(0.06, 0.26, 6), bm, 0, -0.1, 0.07, u.head); bb.rotation.x = Math.PI + 0.25; bb.scale.z = 0.6; mesh(sph(0.06, 8, 6), bm, 0, 0.0, 0.05, u.head).scale.set(1, 0.55, 0.6); [-1, 1].forEach((k) => { const bg = mesh(new THREE.ConeGeometry(0.01, 0.06, 4), bm, k * 0.03, 0.03, surfZ(u.headM, 0, 0.03) + 0.004, u.head); bg.rotation.z = k * 2.2; });
  mesh(sph(0.04, 6, 4), bm, 0, 0.21, -0.07, u.head).scale.set(0.6, 1.2, 0.6); return p; }
// bebê enrolado na manta (pra ir no colo)
function bebe(g) { const b = grp(g); mesh(cap(0.07, 0.12, 4, 8), LPmat(0xe8f0d8, { rim: 0.6 }), 0, 0, 0, b).rotation.z = Math.PI / 2; mesh(sph(0.055, 10, 8), LPmat(0xf8d8b8, { rim: 0.5 }), 0.13, 0.02, 0.01, b);
  for (let i = 0; i < 4; i++) { const c = mesh(new THREE.ConeGeometry(0.014, 0.05, 4), LPmat(0x14180f), 0.14 + i * 0.008 - 0.012, 0.07, -0.02 + i * 0.012, b); c.rotation.z = -0.2 - i * 0.1; } return b; }
// segurar o bebê no colo: as duas mãos embaixo, no peito
function colo(p, obj, k = 1) { const c = frenteW(p, 0, 1.08, 0.22); obj.position.copy(c); obj.rotation.set(0, p.rotation.y, 0.2); maoEm(p, 0, frenteW(p, 0.12, 1.0, 0.24), k, { abre: 0.5, poleY: 0.2, poleZ: -0.2 }); maoEm(p, 1, frenteW(p, -0.1, 1.06, 0.24), k, { abre: 0.5, poleY: 0.2, poleZ: -0.2 }); pose(p, { handR: 0.3, handL: 0.3 }, 1); }

// ---------------------------------------------------------------- objetos
const licTex = canvasTex(256, 160, (c, w, h) => { const g_ = c.createLinearGradient(0, 0, w, h); g_.addColorStop(0, "#1a1a1e"); g_.addColorStop(1, "#3a3a44"); c.fillStyle = g_; c.fillRect(0, 0, w, h); c.strokeStyle = "#c8a050"; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#e8c870"; c.font = "bold 40px serif"; c.textAlign = "center"; c.fillText("HUNTER", w / 2, 70); c.font = "22px serif"; c.fillText("LICENSE", w / 2, 104); c.fillStyle = "#f0e0a0"; [0.38, 0.62].forEach((x) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 14; c.lineTo(w * x + Math.cos(a) * r, 132 + Math.sin(a) * r); } c.fill(); }); });
function licenca(g) { const m = mesh(box(0.34, 0.21, 0.01), new THREE.MeshStandardMaterial({ map: licTex, emissive: 0xffffff, emissiveMap: licTex, emissiveIntensity: 0.4, metalness: 0.4, roughness: 0.4 }), 0, 0, 0, g); m.castShadow = false; return m; }
// estrela de luz (Hunter de duas estrelas)
function estrela(g, cor = 0xffd860, s = 0.3) { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * 0.42 : s; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: s * 0.18, bevelEnabled: true, bevelSize: s * 0.06, bevelThickness: s * 0.06, bevelSegments: 1 }); geo.center(); const st = grp(g); mesh(geo, new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: 1.2, metalness: 0.5, roughness: 0.3 }), 0, 0, 0, st); const gl = glowSprite(cor, s * 5, 0.5); st.add(gl); st.userData.gl = gl; return st; }
// caixa do Ging: madeira escura com frisos que brilham quando a aura do Gon toca
function caixaGing(g) { const c = grp(g), mad = LPmat(0x4a3020, { rim: 0.5 }), friso = new THREE.MeshStandardMaterial({ color: 0x302010, emissive: 0x7affa0, emissiveIntensity: 0 });
  mesh(box(0.42, 0.22, 0.3), mad, 0, 0.11, 0, c); const tampa = grp(c, 0, 0.22, -0.15); mesh(box(0.42, 0.06, 0.3), mad, 0, 0.03, 0.15, tampa);
  [-0.12, 0.12].forEach((x) => { mesh(box(0.012, 0.23, 0.305), friso, x, 0.11, 0, c); mesh(box(0.012, 0.062, 0.305), friso, x, 0.03, 0.15, tampa); }); mesh(box(0.425, 0.012, 0.012), friso, 0, 0.18, 0.152, c);
  const luz = new THREE.PointLight(0x9affb0, 0, 1.6, 1.4); luz.position.set(0, 0.35, 0); c.add(luz); return { c, tampa, friso, luz }; }
const fitaTex = canvasTex(128, 80, (c, w, h) => { c.fillStyle = "#1a1a1e"; c.fillRect(0, 0, w, h); c.fillStyle = "#e8e0c8"; c.fillRect(10, 8, w - 20, 34); c.fillStyle = "#2a2a30"; c.font = "bold 16px sans-serif"; c.textAlign = "center"; c.fillText("GING", w / 2, 31); c.fillStyle = "#6a6a70"; [38, 90].forEach((x) => { c.beginPath(); c.arc(x, 58, 11, 0, 7); c.fill(); }); });
function fitaK7(g) { return mesh(box(0.2, 0.125, 0.02), new THREE.MeshStandardMaterial({ map: fitaTex, roughness: 0.5 }), 0, 0, 0, g); }
function anel(g) { const a = grp(g); mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 16), new THREE.MeshStandardMaterial({ color: 0xd8b860, metalness: 0.9, roughness: 0.2, emissive: 0x6a4a10, emissiveIntensity: 0.5 }), 0, 0, 0, a); mesh(new THREE.OctahedronGeometry(0.02, 0), new THREE.MeshStandardMaterial({ color: 0x7ad8ff, emissive: 0x3a9aff, emissiveIntensity: 1.2 }), 0, 0.055, 0, a); return a; }
const memTex = canvasTex(128, 96, (c, w, h) => { c.fillStyle = "#2a2a34"; c.fillRect(0, 0, w, h); c.fillStyle = "#d8d8e0"; c.fillRect(8, 8, w - 16, 44); c.fillStyle = "#c83030"; c.font = "bold 22px sans-serif"; c.textAlign = "center"; c.fillText("G.I.", w / 2, 38); c.fillStyle = "#d8b860"; for (let i = 0; i < 8; i++) c.fillRect(12 + i * 13, 70, 8, 18); });
function cartaoMem(g) { return mesh(box(0.15, 0.11, 0.012), new THREE.MeshStandardMaterial({ map: memTex, roughness: 0.4, metalness: 0.3 }), 0, 0, 0, g); }
// cartas (Greed Island): verso com padrão, face com estrela
const cartaTex = canvasTex(128, 180, (c, w, h) => { c.fillStyle = "#f2ecd8"; c.fillRect(0, 0, w, h); c.strokeStyle = "#8a2a2a"; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#8a2a2a"; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 14 : 34; c.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } c.fill(); });
function carta(g) { const m = mesh(box(0.13, 0.18, 0.004), new THREE.MeshStandardMaterial({ map: cartaTex, emissive: 0xffffff, emissiveMap: cartaTex, emissiveIntensity: 0.25 }), 0, 0, 0, g); m.castShadow = false; return m; }
// ilha flutuante (Greed Island): rocha invertida com grama, árvores e um castelinho
function ilhaFlutuante(g, s = 1) { const i = grp(g); const ro = mesh(new THREE.ConeGeometry(1.6 * s, 2.2 * s, 9, 2), LPmat(0x6a5440, { rim: 0.5 }), 0, -1.1 * s, 0, i); ro.rotation.x = Math.PI; deform(ro.geometry, (v) => v.multiplyScalar(0.9 + hash(v.x * 9 + v.y * 3) * 0.2));
  mesh(cyl(1.6 * s, 1.5 * s, 0.18 * s, 9), LPmat(0x5a9a3a, { rim: 0.6 }), 0, 0.02 * s, 0, i);
  for (let k = 0; k < 6; k++) { const a = k * 1.1, r = (0.6 + hash(k) * 0.6) * s; mesh(new THREE.ConeGeometry(0.22 * s, 0.6 * s, 6), LPmat(0x2a6a2a, { rim: 0.5 }), Math.cos(a) * r, 0.4 * s, Math.sin(a) * r, i); }
  const ca = grp(i, -0.2 * s, 0.1 * s, -0.3 * s); mesh(box(0.5 * s, 0.4 * s, 0.4 * s), LPmat(0xd8d0c0), 0, 0.2 * s, 0, ca); [-1, 1].forEach((k) => { mesh(cyl(0.09 * s, 0.09 * s, 0.6 * s, 8), LPmat(0xd8d0c0), k * 0.25 * s, 0.3 * s, 0.2 * s, ca); mesh(new THREE.ConeGeometry(0.12 * s, 0.22 * s, 8), LPmat(0xb83a3a), k * 0.25 * s, 0.7 * s, 0.2 * s, ca); }); return i; }
// gravador de fita
function gravador(g) { const r = grp(g), m = LPmat(0x2a2a30, { rim: 0.5, metal: 0.3 }); mesh(box(0.36, 0.12, 0.22), m, 0, 0.06, 0, r); [-0.08, 0.08].forEach((x) => mesh(cyl(0.035, 0.035, 0.01, 10), LPmat(0x6a6a70, { metal: 0.6 }), x, 0.125, 0, r)); const led = mesh(sph(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3030 }), 0.14, 0.1, 0.11, r); return { r, led }; }
// onda de som de luz (a voz do Ging na fita), apagável
function ondaVoz(g, n = 40, w = 1.6) { const m = new THREE.MeshBasicMaterial({ color: 0x9ae8ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }); const bs = []; for (let i = 0; i < n; i++) { const b = mesh(box(w / n * 0.6, 1, 0.01), m, -w / 2 + (i + 0.5) * w / n, 0, 0, g); b.castShadow = false; bs.push(b); } return { bs, m, set(t, amp, apaga) { bs.forEach((b, i) => { const x = i / n, h = 0.02 + amp * (0.08 + 0.3 * Math.abs(noise1(t * 8 + i * 0.7))) * (x > apaga ? 1 : 0.04); b.scale.y = h; }); } }; }

// ---------------------------------------------------------------- cenários
// porto da Ilha Baleia ao pôr do sol: mar, cais de madeira, barco, casinhas
function mar(g, cor = 0x2a5a8a, y = -0.25) { const geo = new THREE.PlaneGeometry(160, 160, 60, 60); geo.rotateX(-Math.PI / 2); const m = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.25, metalness: 0.35, flatShading: true }); const o = mesh(geo, m, 0, y, 0, g); o.castShadow = false; const p = geo.attributes.position, b = p.array.slice();
  return { o, upd(t) { for (let i = 0; i < p.count; i++) { const x = b[i * 3], z = b[i * 3 + 2]; p.array[i * 3 + 1] = Math.sin(x * 0.6 + t * 1.2) * 0.05 + Math.cos(z * 0.5 + t * 0.9) * 0.05; } p.needsUpdate = true; } }; }
function barco(g, s = 1) { const b = grp(g), mad = LPmat(0x6a4428, { rim: 0.4 }); const casco = mesh(box(1.2 * s, 0.4 * s, 4.2 * s), mad, 0, 0.1 * s, 0, b); deform(casco.geometry, (v) => { if (v.y < 0) v.x *= 0.55; if (Math.abs(v.z) > 1.6 * s) v.x *= 0.5; });
  mesh(box(1.1 * s, 0.05 * s, 3.8 * s), LPmat(0x8a6040), 0, 0.31 * s, 0, b); mesh(cyl(0.05 * s, 0.06 * s, 3.4 * s, 6), mad, 0, 1.9 * s, 0.2 * s, b); const vela = mesh(new THREE.PlaneGeometry(1.6 * s, 2.2 * s, 4, 4), LPmat(0xf2ead8, { side: THREE.DoubleSide, rim: 0.6 }), 0, 2.0 * s, 0.25 * s, b); vela.rotation.y = Math.PI / 2;
  deform(vela.geometry, (v) => { v.z = Math.sin((v.x / (1.6 * s) + 0.5) * Math.PI) * 0.25 * s; }); return b; }
function cais(g, x, z, len = 8, ang = 0) { const c = grp(g, x, 0, z); c.rotation.y = ang; const tb = texPlanks([140, 100, 64], [110, 76, 48]); const piso = new THREE.MeshStandardMaterial({ map: rep(tb.map.clone(), 1, len / 2), roughness: 0.8 }); piso.map.needsUpdate = true;
  mesh(box(1.8, 0.1, len), piso, 0, -0.05, -len / 2, c); for (let i = 0; i <= len; i += 2) [-0.85, 0.85].forEach((xx) => mesh(cyl(0.08, 0.09, 1.6, 6), LPmat(0x4a3220), xx, -0.75, -i, c)); return c; }
function casinha(g, x, z, cor = 0xe8dcc4, tel = 0x3a6a9a, s = 1, ang = 0) { const h = grp(g, x, 0, z); h.rotation.y = ang; mesh(box(1.6 * s, 1.2 * s, 1.4 * s), LPmat(cor, { rim: 0.3 }), 0, 0.6 * s, 0, h); const t = mesh(new THREE.ConeGeometry(1.25 * s, 0.7 * s, 4), LPmat(tel, { rim: 0.4 }), 0, 1.55 * s, 0, h); t.rotation.y = Math.PI / 4; t.scale.z = 0.95;
  mesh(box(0.3 * s, 0.55 * s, 0.02), LPmat(0x5a3a22), 0, 0.28 * s, 0.71 * s, h); [-0.45, 0.45].forEach((xx) => mesh(box(0.28 * s, 0.26 * s, 0.02), new THREE.MeshBasicMaterial({ color: 0xffd890 }), xx * s, 0.7 * s, 0.71 * s, h)); return h; }
function porto(g, o = {}) {
  const ceu = skyDome(g, { top: o.top ?? 0x3a2a5a, mid: o.mid ?? 0xd86a4a, hor: o.hor ?? 0xe89a68, ground: 0x2a2030, sunDir: [0.5, 0.06, -1], sunCol: 0xffc070, sunI: 0.8, disk: 1.6, cov: 0.4, cloudLit: 0xffb080, cloudSh: 0x6a4a6a, midY: 0.2 });
  const M = mar(g, 0x3a4a7a);
  const terra = mesh(new THREE.CylinderGeometry(9, 10, 1.0, 14), LPmat(0x7a8a4a, { rim: 0.3 }), 0, -0.5, 9, g);
  const cs = cais(g, 0, 1.2, 9);
  [[-4, 6, 0xe8dcc4, 0x3a6a9a, 0.3], [3.6, 5, 0xf0e4d0, 0xb84a3a, -0.4], [-1.5, 8, 0xe0d4b8, 0x4a7a5a, 0.1], [5.5, 8.5, 0xe8dcc4, 0x3a6a9a, -0.6]].forEach(([x, z, c, t, a]) => casinha(g, x, z, c, t, 1, a));
  tree(g, -6, 0, 3.5, { s: 0.5, seed: 3 }); tree(g, 6.5, 0, 3, { s: 0.45, seed: 5 });
  const bc = barco(g, 0.8); bc.position.set(1.7, -0.25, -4.5);
  const aves = birds(g, 5, { center: [0, 7, -22], rx: 10, rz: 4 });
  return { ceu, M, bc, aves };
}
// selva com ruína antiga (templo de pedra com degraus)
function ruina(g) { const r = grp(g), pedra = new THREE.MeshStandardMaterial({ map: texBlocks([150, 146, 120], [120, 118, 98]).map, roughness: 0.9, color: 0xd0d0b8 }); const musgo = LPmat(0x4a7a3a, { rim: 0.4 });
  for (let i = 0; i < 5; i++) { const w = 6 - i * 1.1; mesh(box(w, 0.6, w), pedra, 0, 0.3 + i * 0.6, -6, r); } mesh(box(1.4, 1.2, 1.4), pedra, 0, 3.6, -6, r); mesh(box(0.6, 0.8, 0.05), LPmat(0x0a0a08), 0, 3.45, -5.28, r);
  [[-2.8, -3], [2.8, -3], [-2.8, -0.5], [2.8, -0.5]].forEach(([x, z], k) => { const h = 2.2 + hash(k) * 1.2; mesh(box(0.5, h, 0.5), pedra, x, h / 2, z, r); mesh(box(0.55, 0.15, 0.55), musgo, x, h, z, r); });
  for (let i = 0; i < 6; i++) { const v = mesh(cyl(0.03, 0.03, 2 + hash(i) * 2, 4), musgo, -2.5 + i, 2.2, -2.95 - (i % 2) * 2.4, r); v.rotation.z = 0.2 * (hash(i * 3) - 0.5); } return r; }
// árvore do mundo: tronco gigante que some nas nuvens, galho largo onde os dois sentam
function arvoreMundo(g) { const a = grp(g), bk = texBark(), cas = new THREE.MeshStandardMaterial({ map: rep(bk.map.clone(), 3, 6), normalMap: bk.normalMap, color: 0x9a7a58, roughness: 0.9 }); cas.map.needsUpdate = true;
  // tronco gigante atrás (à esquerda); galho largo horizontal ao longo de x com o topo em y=0, z=0
  const tr = mesh(cyl(4.2, 5.5, 60, 14), cas, -7.5, -26, -3, a); const gal = mesh(cyl(0.55, 1.0, 9, 10), cas, -1.0, -0.62, 0, a); gal.rotation.z = Math.PI / 2;
  const ga2 = mesh(cyl(0.3, 0.5, 5, 8), cas, 3.6, 0.6, -1.2, a); ga2.rotation.set(0.3, 0, -1.1);
  const folha = LPmat(0x4a8a3a, { rim: 0.6 }), folha2 = LPmat(0x3a7032, { rim: 0.5 });
  [[-7, 5, -4, 4], [-3, 4.2, -5, 3], [1.5, 3.4, -4, 2.6], [5, 2.6, -3, 2], [-10, 2, 0, 3.5], [-4, 6.5, 1, 3]].forEach(([x, y, z, r], i) => { const f = mesh(new THREE.IcosahedronGeometry(r, 0), i % 2 ? folha : folha2, x, y, z, a); f.scale.y = 0.62; f.rotation.y = i; });
  [[5.2, 1.3, -1.6, 1.1], [3.0, 1.2, -2.0, 0.9]].forEach(([x, y, z, r]) => mesh(new THREE.IcosahedronGeometry(r, 0), folha, x, y, z, a));
  return a; }
function nuvensMar(g, y = -6, n = 30, cor = 0xfff0e0) { const ns = []; for (let i = 0; i < n; i++) { const s = mesh(new THREE.IcosahedronGeometry(2 + hash(i) * 3, 1), LPmat(cor, { rim: 0.6, rough: 1 }), (hash(i * 3) - 0.5) * 60, y + hash(i * 5) * 1.5, -5 - hash(i * 7) * 40, g); s.scale.y = 0.45; s.castShadow = false; ns.push(s); } return ns; }

// câmeras de depuração
Object.assign(DBGC, {
  "s2-lenda": [{ pos: [-13.3, 1.38, 0.5], look: [-14, 1.33, 0], fov: 30 }, { pos: [-14, 1.38, 0.9], look: [-14, 1.33, 0], fov: 30 }],
  "s0-capa": [{ pos: [0, 1.1, 6.5], look: [0, 0.9, 0], fov: 48 }, { pos: [-1.6, 1.62, 0.9], look: [-1.6, 1.55, 0], fov: 30 }, { pos: [-0.8, 1.3, 0.8], look: [-0.8, 1.22, 0], fov: 32 }, { pos: [0.8, 1.62, 0.9], look: [0.8, 1.55, 0], fov: 30 }, { pos: [2.4, 1.3, 0.6], look: [1.6, 1.25, 0], fov: 30 }, { pos: [-1.6, 1.62, -0.9], look: [-1.6, 1.55, 0], fov: 30 }],
});
