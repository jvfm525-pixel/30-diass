// ================================================================ vídeo: Demônio da Morte · cenários
// sala de aula da Quarta Escola do Leste: janelas à esquerda (x−), lousa no fundo (z−), carteiras 5×5 viradas pra lousa.
// D(i, j) dá o centro da carteira; o aluno senta em (x, z + 0.42) olhando pra −z.
function salaAula(g, o = {}) { const noite = !!o.noite, por = !!o.por;
  const ceu = noite ? 0x22305a : por ? 0xffb070 : 0xd8ecff, parede = LPmat(0xe6ded0, { rim: 0.3, rough: 0.9 }), madeira = LPmat(0xc49a68, { rim: 0.3, rough: 0.7 }), ferro = LPmat(0x6a6e74, { metal: 0.5, rough: 0.5 });
  const ch = mesh(new THREE.PlaneGeometry(10.4, 13), SM(0x8a6a4a, { roughness: 0.6 }), 0, 0, 0.3, g); ch.rotation.x = -Math.PI / 2;
  const teto = mesh(new THREE.PlaneGeometry(10.4, 13), SM(0xeeeae2, { roughness: 0.9 }), 0, 3.2, 0.3, g); teto.rotation.x = Math.PI / 2;
  mesh(box(10.4, 3.2, 0.2), parede, 0, 1.6, -5.9, g); mesh(box(10.4, 3.2, 0.2), parede, 0, 1.6, 6.6, g); mesh(box(0.2, 3.2, 13), parede, 5.1, 1.6, 0.3, g);
  mesh(box(0.2, 0.95, 13), parede, -5.1, 0.475, 0.3, g); mesh(box(0.2, 0.55, 13), parede, -5.1, 2.925, 0.3, g); // parede das janelas: peitoril e verga
  const vid = new THREE.MeshBasicMaterial({ color: ceu, fog: false }), janelas = [];
  for (let k = 0; k < 6; k++) { const z = -4.6 + k * 1.95; mesh(box(0.22, 1.7, 0.12), parede, -5.1, 1.8, z - 0.97, g);
    const v = mesh(new THREE.PlaneGeometry(1.8, 1.7), vid, -5.16, 1.8, z, g); v.rotation.y = Math.PI / 2; v.castShadow = false; janelas.push(v);
    mesh(box(0.05, 1.7, 0.04), ferro, -5.05, 1.8, z, g); mesh(box(0.05, 0.04, 1.8), ferro, -5.05, 1.8, z, g); }
  mesh(box(0.22, 1.7, 0.12), parede, -5.1, 1.8, 7.1 - 1.95, g);
  mesh(box(4.4, 1.35, 0.06), LPmat(0x1f3a2e, { rough: 0.95 }), 0, 1.65, -5.78, g); mesh(box(4.5, 0.05, 0.12), madeira, 0, 0.96, -5.74, g); // lousa
  mesh(box(1.6, 0.8, 0.7), madeira, 0, 0.4, -4.7, g); // mesa do professor
  const luzes = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const l = mesh(box(1.4, 0.05, 0.22), new THREE.MeshBasicMaterial({ color: noite ? 0x2a2c30 : 0xf6f8ff }), -1.6 + j * 3.2, 3.16, -3 + i * 3.2, g); l.castShadow = false; luzes.push(l); }
  const D = (i, j) => ({ x: -2.4 + i * 1.2, z: -2.6 + j * 1.25 }), tampos = [], pernas = [], assentos = [], encostos = [];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const { x, z } = D(i, j);
    tampos.push([x, 0.72, z, 0, 0, 0]); [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => pernas.push([x + a * 0.28, 0.36, z + b * 0.18, 0, 0, 0]));
    assentos.push([x, 0.45, z + 0.45, 0, 0, 0]); encostos.push([x, 0.7, z + 0.66, 0, 0, 0]); }
  instG(g, box(0.64, 0.04, 0.44), madeira, tampos); instG(g, box(0.03, 0.72, 0.03), ferro, pernas); instG(g, box(0.4, 0.04, 0.38), madeira, assentos); instG(g, box(0.4, 0.36, 0.03), madeira, encostos);
  return { D, janelas, luzes, senta(p, i, j, k = 1) { const { x, z } = D(i, j); restPose(p); p.position.set(x, 0, z + 0.45); p.rotation.y = Math.PI; sitPose(p, k, { seatY: 0.47, lean: -0.05 }); } }; }

// porta do Inferno no céu (as portas por onde descem os demônios): batentes escuros, folhas que abrem, luz por dentro
function portaInferno(g, pos, s = 1, cor = 0xffd0b0) { const p = grp(g, ...pos); p.scale.setScalar(s); const m = LPmat(0x1a1416, { rim: 0.9, rough: 0.6 });
  mesh(box(0.25, 5.2, 0.3), m, -1.62, 2.6, 0, p); mesh(box(0.25, 5.2, 0.3), m, 1.62, 2.6, 0, p); mesh(box(3.5, 0.3, 0.3), m, 0, 5.3, 0, p);
  const luz = mesh(new THREE.PlaneGeometry(3.0, 5.0), new THREE.MeshBasicMaterial({ color: cor, fog: false }), 0, 2.55, -0.05, p); luz.castShadow = false;
  const gl = glowSprite(cor, 6, 0); gl.position.set(0, 2.6, 0.3); p.add(gl);
  const folhas = [-1, 1].map((k) => { const h = grp(p, k * 1.5, 0, 0); mesh(box(1.5, 5.0, 0.12), LPmat(0x2a2024, { rim: 0.8 }), -k * 0.75, 2.55, 0, h); return h; });
  return { g: p, abre(k) { folhas.forEach((h, i) => (h.rotation.y = (i ? -1 : 1) * 1.9 * k)); luz.visible = k > 0.02; gl.material.opacity = 0.35 * k; } }; }

// morro escuro contra o pôr do sol vermelho (os Quatro Cavaleiros): topo em y ≈ 0.3 perto de x = 0
function morroVermelho(g) {
  skyDome(g, { top: 0x2a0408, mid: 0x7a1410, hor: 0xe85a2a, ground: 0x0a0404, sunDir: [0.35, 0.07, -1], sunCol: 0xffa050, sunI: 0.5, disk: 2.2, cov: 0.35, cloudLit: 0xff8a5a, cloudSh: 0x3a0a0a, midY: 0.18 });
  const mo = mesh(new THREE.SphereGeometry(30, 48, 16), LPmat(0x120606, { rim: 0.4, rough: 1 }), 0, -4.2, 0, g); mo.scale.set(1, 0.15, 0.5);
  const arv = LPmat(0x080303, { rough: 1 }); [[-9, -4, 3.2], [7.5, -6, 2.6], [-14, -9, 4], [12, -10, 3.5]].forEach(([x, z, h]) => { mesh(cyl(0.08, 0.14, h, 5), arv, x, h / 2 - 0.6, z, g);
    for (let i = 0; i < 4; i++) { const r = mesh(cyl(0.03, 0.06, h * 0.45, 4), arv, x, h * 0.6, z, g); r.rotation.set((hash(i + x) - 0.5) * 1.4, 0, (hash(i * 3 + x) - 0.5) * 1.6); } });
  const cs = Array.from({ length: 9 }, (_, i) => corvo(g)); return { upd(t) { cs.forEach((c, i) => { const a = t * 0.3 + i * 0.7; c.position.set(Math.sin(a) * (8 + i), 6 + Math.sin(t + i) * 0.6 + i * 0.3, -12 + Math.cos(a) * 4); c.rotation.y = a + Math.PI / 2; bateAsas(c, t + i); }); } }; }

// igreja do Chainsaw Man: salão escuro, fiéis ajoelhados em fileiras, palco com estandarte, velas e feixes de luz
function igrejaCSM(g) { const pedra = LPmat(0x2a2426, { rim: 0.4, rough: 0.95 });
  const ch = mesh(new THREE.PlaneGeometry(18, 30), SM(0x1a1416, { roughness: 0.5, metalness: 0.1 }), 0, 0, -4, g); ch.rotation.x = -Math.PI / 2;
  mesh(box(0.4, 9, 30), pedra, -8.5, 4.5, -4, g); mesh(box(0.4, 9, 30), pedra, 8.5, 4.5, -4, g); mesh(box(18, 9, 0.4), pedra, 0, 4.5, -18, g);
  mesh(box(8, 0.6, 4), LPmat(0x1e1a1c, { rim: 0.4 }), 0, 0.3, -12.5, g); // palco
  const est = canvasTex(256, 512, (c, w, h) => { c.fillStyle = "#120c0c"; c.fillRect(0, 0, w, h); c.strokeStyle = "#c86a2a"; c.lineWidth = 10; c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = "#e0782a"; c.fillRect(78, 210, 100, 90); c.fillStyle = "#b8bcc4"; c.save(); c.translate(128, 210); c.rotate(-0.25); c.fillRect(-14, -170, 28, 175); c.restore(); // cabeça de motosserra
    c.fillStyle = "#f0ece4"; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(86 + i * 16, 300); c.lineTo(94 + i * 16, 330); c.lineTo(102 + i * 16, 300); c.fill(); } c.fillStyle = "#c86a2a"; c.font = "bold 34px serif"; c.textAlign = "center"; c.fillText("✚", 128, 420); });
  const ban = mesh(new THREE.PlaneGeometry(3.6, 7.2), new THREE.MeshBasicMaterial({ map: est }), 0, 4.6, -17.7, g); ban.castShadow = false;
  const fieis = [], corpo = new THREE.CapsuleGeometry(0.17, 0.35, 3, 6), cab = new THREE.SphereGeometry(0.12, 6, 5), roupa = LPmat(0x2a2228, { rim: 0.7 }), pele = LPmat(0xd8b8a0, { rim: 0.5 });
  for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) { const f = grp(g, -4.4 + c * 1.1 + (r % 2) * 0.3, 0, -8.4 + r * 1.5); mesh(corpo, roupa, 0, 0.42, 0, f); mesh(cab, pele, 0, 0.82, -0.06, f); f.rotation.x = 0; f.userData.k = hash(r * 9 + c); fieis.push(f); }
  const velas = []; for (let i = 0; i < 14; i++) { const x = i % 2 ? 7.6 : -7.6, z = -16 + Math.floor(i / 2) * 2.6; mesh(cyl(0.05, 0.05, 1.2, 6), LPmat(0x3a3034), x, 0.6, z, g); const v = glowSprite(0xffa040, 0.8, 0.85); v.position.set(x, 1.3, z); g.add(v); velas.push(v); }
  const feixes = [-1, 1].map((k) => { const f = mesh(new THREE.PlaneGeometry(2.2, 14), new THREE.MeshBasicMaterial({ color: 0xffc890, transparent: true, opacity: 0.08, blending: ADD, depthWrite: false, side: THREE.DoubleSide }), k * 3.2, 5, -10, g); f.rotation.z = k * 0.35; f.castShadow = false; return f; });
  return { fieis, upd(t, medo = 0) { velas.forEach((v, i) => (v.material.opacity = 0.6 + 0.3 * noise1(t * 5 + i))); fieis.forEach((f, i) => { const kk = f.userData.k; f.rotation.x = 0.35 + 0.15 * Math.sin(t * 2.2 + kk * 6) * medo; f.position.y = -0.02 * medo * Math.abs(Math.sin(t * 3 + kk * 5)); }); } }; }

// soldado (a guerra sem fim): uniforme oliva, capacete, fuzil na mão
function soldadoLP(i) { const p = pessoaLP({ seed: 790 + i, boca2: true, pele: [0xe8c4a0, 0xf2d4b8, 0xc89a78][i % 3], olho: "#2a2018", roupa: 0x4a5236, calca: 0x3e4630, sapato: 0x1e1a16, sola: 0x1e1a16, botoes: false, scale: 0.95 + hash(i) * 0.08 });
  const u = p.userData, m = LPmat(0x3a4228, { rim: 0.6 }); const c = mesh(new THREE.SphereGeometry(0.12, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), m, 0, 0.115, 0, u.head); c.scale.set(1, 0.8, 1.08);
  const fz = grp(u.wr[1], 0, -0.06, 0.02); mesh(box(0.035, 0.05, 0.62), LPmat(0x1a1a1c, { metal: 0.4 }), 0, 0, 0.2, fz); fz.rotation.x = -0.2; u.fuzil = fz; return p; }

// pó que se desfaz: partículas que saem de uma caixa e sobem/espalham conforme k (0 → 1)
function desfaz(g, n, caixa, cor = 0x1a0a14, size = 0.06, blending = NORM) { const p = dustPts(n, caixa, cor, size, 0.95, blending); g.add(p); const pa = p.geometry.attributes.position, base = Float32Array.from(pa.array);
  return { p, upd(k, sobe = 1.4, abre = 1.2) { p.visible = k > 0.005 && k < 0.995; for (let i = 0; i < pa.count; i++) { const h = hash(i * 1.37), h2 = hash(i * 2.11);
      pa.setXYZ(i, base[i * 3] * (1 + abre * k * (0.5 + h)), base[i * 3 + 1] + sobe * k * (0.4 + h2), base[i * 3 + 2] * (1 + abre * k * (0.5 + h2))); } pa.needsUpdate = true; p.material.opacity = 0.95 * (1 - k); } }; }
