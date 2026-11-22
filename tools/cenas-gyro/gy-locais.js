// ================================================================ Gyro: lugares (1) canteiro de obras e barraco
// tijolos instanciados (pilhas e paredes) para não pesar
function tijolos(g, lista, cor = 0xa0502e) { const im = new THREE.InstancedMesh(box(0.22, 0.07, 0.1), LPmat(0xffffff, { rough: 0.95 }), lista.length), M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  lista.forEach(([x, y, z, ry], i) => { q.setFromAxisAngle(V3(0, 1, 0), ry || 0); M4.compose(V3(x, y, z), q, V3(1, 1, 1)); im.setMatrixAt(i, M4); im.setColorAt(i, c.set(cor).multiplyScalar(0.8 + hash(i * 1.7) * 0.35)); });
  im.castShadow = im.receiveShadow = true; g.add(im); return im; }
function pilhaTijolos(x, z, nx = 4, nz = 3, ny = 6, ry = 0) { const out = [], ca = Math.cos(ry), sa = Math.sin(ry);
  for (let y = 0; y < ny; y++) for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) { const rot = y % 2 ? Math.PI / 2 : 0, lx = (i - nx / 2 + 0.5) * 0.23, lz = (k - nz / 2 + 0.5) * 0.11;
    out.push([x + lx * ca + lz * sa, 0.035 + y * 0.072, z - lx * sa + lz * ca, ry + (y % 2 ? 0 : 0) + rot * 0]); } return out; }
// fio entre dois postes com lâmpadas penduradas (curva caída)
function varalLampadas(g, a, b, n = 6, cor = 0xffc070) { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, p = V3(...a).lerp(V3(...b), u); p.y -= Math.sin(u * Math.PI) * 0.5; pts.push(p); }
  const cv = new THREE.CatmullRomCurve3(pts); mesh(new THREE.TubeGeometry(cv, 24, 0.008, 4), LPmat(0x1a1a1a), 0, 0, 0, g).castShadow = false; const L = [];
  for (let i = 1; i <= n; i++) { const p = cv.getPoint(i / (n + 1)); const bm = mesh(sph(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: cor }), p.x, p.y - 0.08, p.z, g); bm.castShadow = false;
    const gl = glowSprite(cor, 0.7, 0.55); gl.position.copy(bm.position); g.add(gl); L.push({ bm, gl, i }); } return L; }
function poste(g, x, z, h = 4.2) { const m = LPmat(0x4a3424, { rough: 0.9 }); mesh(cyl(0.07, 0.09, h, 7), m, x, h / 2, z, g); mesh(box(0.7, 0.06, 0.06), m, x, h - 0.3, z, g); }
// barraco de tábuas com telhado de zinco ondulado, porta e janela acesa
function barracoObra(g, x, z, ry = 0, o = {}) { const b = grp(g, x, 0, z); b.rotation.y = ry; const w = o.w ?? 3, d = o.d ?? 2.6, h = o.h ?? 2.3;
  const pk = texPlanks([112, 84, 58], [84, 62, 42]); const pm = SM(0xffffff, { map: pk.map, normalMap: pk.normalMap, roughness: 0.95 });
  mesh(box(w, h, d), pm, 0, h / 2, 0, b);
  const zinco = LPmat(0x8a8c90, { metal: 0.5, rough: 0.5 }), tl = grp(b, 0, h + 0.12, 0); tl.rotation.x = 0.12;
  for (let i = 0; i < 14; i++) mesh(cyl(0.05, 0.05, d + 0.5, 6), zinco, -w / 2 - 0.15 + i * ((w + 0.3) / 13), 0, 0, tl).rotation.x = Math.PI / 2;
  mesh(box(0.8, 1.8, 0.05), LPmat(0x2a1e14), -w * 0.22, 0.9, d / 2 + 0.03, b);
  const jan = mesh(new THREE.PlaneGeometry(0.6, 0.45), new THREE.MeshBasicMaterial({ color: o.luz === false ? 0x1a1814 : 0xffb060 }), w * 0.22, 1.4, d / 2 + 0.03, b); jan.castShadow = false;
  b.userData.jan = jan; if (o.luz !== false) { const gl = glowSprite(0xffa050, 1.4, 0.35); gl.position.set(w * 0.22, 1.4, d / 2 + 0.2); b.add(gl); b.userData.gl = gl; }
  mesh(cyl(0.07, 0.07, 0.9, 8), LPmat(0x3a3a3a, { metal: 0.6 }), w * 0.35, h + 0.5, -d * 0.2, b); // chaminé do fogão
  return b; }
// betoneira: tambor inclinado laranja no cavalete com rodas
function betoneira(g, x, z, ry = 0) { const b = grp(g, x, 0, z); b.rotation.y = ry; const lar = LPmat(0xc8682a, { rim: 0.5, rough: 0.55 }), fe = LPmat(0x3a3a3c, { metal: 0.5 });
  const tb = grp(b, 0, 0.95, 0); tb.rotation.x = -0.6; mesh(lathe([[0.001, -0.42], [0.3, -0.4], [0.42, -0.1], [0.4, 0.15], [0.22, 0.42], [0.2, 0.46]], 16), lar, 0, 0, 0, tb);
  [-1, 1].forEach((k) => { mesh(box(0.06, 0.95, 0.06), fe, k * 0.45, 0.47, 0, b); mesh(new THREE.TorusGeometry(0.18, 0.06, 6, 12), LPmat(0x141414), k * 0.52, 0.18, 0.3, b).rotation.y = Math.PI / 2; });
  mesh(box(0.96, 0.06, 0.06), fe, 0, 0.2, 0.3, b); return { b, tb }; }
function carrinhoMao(g, x, z, ry = 0) { const c = grp(g, x, 0, z); c.rotation.y = ry; const m = LPmat(0x4a6a8a, { metal: 0.4, side: THREE.DoubleSide }), fe = LPmat(0x2a2a2a);
  // caçamba: caixa aberta com a frente inclinada, roda na frente, dois cabos e dois pés atrás
  const cc = grp(c, 0, 0.42, 0); mesh(box(0.5, 0.03, 0.6), m, 0, -0.12, 0, cc); [-1, 1].forEach((k) => { const l = mesh(box(0.03, 0.26, 0.7), m, k * 0.27, 0, 0, cc); l.rotation.z = -k * 0.25; });
  mesh(box(0.56, 0.26, 0.03), m, 0, 0, -0.33, cc); const fr = mesh(box(0.56, 0.3, 0.03), m, 0, 0.0, 0.36, cc); fr.rotation.x = -0.5;
  mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 14), fe, 0, 0.18, 0.55, c).rotation.y = Math.PI / 2;
  [-1, 1].forEach((k) => { const cb = mesh(cyl(0.018, 0.018, 1.3, 5), fe, k * 0.22, 0.4, -0.15, c); cb.rotation.x = Math.PI / 2 - 0.2; mesh(box(0.03, 0.3, 0.03), fe, k * 0.2, 0.15, -0.3, c); }); return c; }
// prédio em obra: pilares, lajes, ferros saindo do topo, paredes de tijolo pela metade e andaime na frente
function predioObra(g, x, z, o = {}) { const p = grp(g, x, 0, z), nx = o.nx ?? 4, nz = o.nz ?? 3, vao = 3, andares = o.andares ?? 3, conc = LPmat(0x9a948a, { rough: 0.95 }), ferro = LPmat(0x6a4a3a, { metal: 0.4 });
  const W = (nx - 1) * vao, D = (nz - 1) * vao;
  for (let a = 0; a < andares; a++) for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) { mesh(box(0.35, 3, 0.35), conc, -W / 2 + i * vao, a * 3 + 1.5, -D / 2 + k * vao, p);
    if (a === andares - 1) for (let f = 0; f < 4; f++) mesh(cyl(0.012, 0.012, 0.9, 4), ferro, -W / 2 + i * vao + (f % 2 - 0.5) * 0.2, a * 3 + 3.45, -D / 2 + k * vao + (f > 1 ? 0.1 : -0.1), p); }
  for (let a = 1; a < andares; a++) mesh(box(W + 0.8, 0.25, D + 0.8), conc, 0, a * 3, 0, p);
  const tl = []; for (let y = 0; y < 22; y++) for (let i = 0; i < 12; i++) if (!(y > 10 && i > 8 - y % 3)) tl.push([-W / 2 + 0.3 + i * 0.235 + (y % 2) * 0.11, 0.035 + y * 0.072, D / 2, 0]);
  for (let y = 0; y < 30; y++) for (let i = 0; i < 12; i++) if (y < 18 + (i % 5)) tl.push([W / 2 - 3 + 0.3 + i * 0.235 + (y % 2) * 0.11, 0.035 + y * 0.072, D / 2, 0]);
  const parede = tijolos(p, tl);
  // andaime de canos e tábuas na fachada
  const cano = LPmat(0x8a8a8a, { metal: 0.6, rough: 0.4 }), pk = texPlanks([150, 112, 70], [120, 88, 54]), tab = SM(0xffffff, { map: pk.map, roughness: 0.9 }), zf = D / 2 + 1.0;
  for (let i = 0; i <= 5; i++) [zf, zf + 0.9].forEach((zz) => mesh(cyl(0.025, 0.025, 7.6, 6), cano, -W / 2 + i * (W / 5), 3.8, zz, p));
  for (let y = 1.5; y < 7.5; y += 1.5) { [zf, zf + 0.9].forEach((zz) => mesh(cyl(0.022, 0.022, W, 6), cano, 0, y, zz, p).rotation.z = Math.PI / 2); mesh(box(W, 0.05, 0.85), tab, 0, y + 0.03, zf + 0.45, p); }
  return { p, parede }; }
// grua torre ao longe (treliça simplificada)
function grua(g, x, z, h = 26, ry = 0.6) { const c = grp(g, x, 0, z); c.rotation.y = ry; const m = LPmat(0xd8a02a, { rim: 0.4, metal: 0.3 });
  for (let i = 0; i < 4; i++) mesh(cyl(0.06, 0.06, h, 5), m, (i % 2 - 0.5) * 1.2, h / 2, (i > 1 ? 0.6 : -0.6), c);
  for (let y = 1; y < h; y += 1.6) [0, 1].forEach((k) => { const d = mesh(cyl(0.03, 0.03, 1.9, 4), m, k ? 0 : 0.6, y + 0.8, k ? 0.6 : 0, c); d.rotation.set(k ? 0 : 0.7, 0, k ? 0.7 : 0); if (!k) d.rotation.set(0.7, Math.PI / 2, 0); });
  const lanca = grp(c, 0, h, 0); mesh(box(24, 0.5, 0.6), m, 6, 0.4, 0, lanca); mesh(box(6, 0.5, 0.6), m, -4, 0.4, 0, lanca); mesh(box(1.6, 1.4, 1.2), LPmat(0x5a5a5a), -6, -0.2, 0, lanca);
  mesh(box(1.4, 1.2, 1.4), LPmat(0x3a3a3a), 0.8, -0.8, 0, lanca); mesh(cyl(0.015, 0.015, 9, 4), LPmat(0x111111), 13, -4.3, 0, lanca); mesh(box(0.4, 0.5, 0.3), LPmat(0xd8a02a), 13, -8.9, 0, lanca);
  return c; }

// ---------------------------------------------------------------- canteiro ao pôr do sol (infância do Gyro)
// área livre para personagens: x -2..2, z -2..4 (chão plano); câmera olhando para -z
function canteiroObras(g, o = {}) {
  const noite = !!o.noite;
  skyDome(g, noite ? { top: 0x05060e, mid: 0x1a1428, hor: 0x5a2a2a, ground: 0x0a0808, sunDir: [-0.3, 0.05, -1], sunCol: 0xff6040, sunI: 0.25, disk: 0.4, cov: 0.35, cloudLit: 0x6a2a2a, cloudSh: 0x0a0a14, midY: 0.14 }
    : { top: 0x2a2a5a, mid: 0xb85a4a, hor: 0xffa860, ground: 0x3a2a20, sunDir: [-0.3, 0.07, -1], sunCol: 0xffb070, sunI: 0.85, disk: 1.0, cov: 0.45, cloudLit: 0xffa070, cloudSh: 0x5a3a4a, midY: 0.15 });
  const plano = (x, z) => { const r = Math.hypot(x, z + 6); return r < 22 ? 0 : (r - 22) * 0.06 * (1 + Math.sin(x * 0.1) * 0.5); };
  terrain(g, { size: 300, segs: 90, grassA: 0x7a5a3a, grassB: 0x8a6a46, dirt: 0x6a4a30, rock: 0x6a6058, h: plano });
  const PO = predioObra(g, 1, -15); grua(g, 14, -32); grua(g, -40, -90, 30, 1.4);
  const casaPai = barracoObra(g, -6.5, -3, Math.PI / 2, { luz: !noite || o.luzes !== false }); const casaVelho = barracoObra(g, 7, 2.5, -Math.PI / 2 + 0.15, { luz: true }); barracoObra(g, -6.8, -7.2, Math.PI / 2 + 0.1); barracoObra(g, -6.2, 1.6, Math.PI / 2 - 0.08, { luz: false });
  const BT = betoneira(g, -3.2, -5.2, 0.4); carrinhoMao(g, 2.6, -3.6, -0.5);
  tijolos(g, [...pilhaTijolos(3.6, -6.4, 4, 3, 7, 0.2), ...pilhaTijolos(4.4, -5.6, 4, 3, 5, -0.1), ...pilhaTijolos(-4.2, -9.5, 5, 3, 6, 0.0)]);
  const areia = mesh(new THREE.ConeGeometry(1.5, 1.0, 12), LPmat(0xc8a070, { rough: 1 }), -4.6, 0.5, -10.5, g); areia.scale.z = 0.8;
  for (let i = 0; i < 6; i++) mesh(box(0.55, 0.14, 0.38), LPmat(0xb8b4a8, { rough: 1 }), 5.4 + (i % 3) * 0.57, 0.07 + Math.floor(i / 3) * 0.14, -2.4, g).rotation.y = hash(i) * 0.2; // sacos de cimento
  for (let i = 0; i < 5; i++) mesh(box(3.2, 0.12, 0.12), LPmat(0x8a6a4a), -1.5 + hash(i) * 0.3, 0.06 + i * 0.12, -9 - (i % 2) * 0.13, g); // tábuas empilhadas
  [[-4.6, 2.4], [4.8, 3.4], [-4.8, -12], [5.2, -11]].forEach(([x, z]) => poste(g, x, z));
  const lamp = [...varalLampadas(g, [-4.6, 3.9, 2.4], [4.8, 3.9, 3.4], 6), ...varalLampadas(g, [-4.8, 3.9, -12], [5.2, 3.9, -11], 6)];
  montanhasLonge(g, 200, 14, noite ? 0x14121a : 0x6a4a5a, 26); arvoresLonge(g, 40, 70, 120, () => 0, { c1: noite ? 0x141a14 : 0x3a4a2a, c2: noite ? 0x1a221a : 0x4a5a30 });
  const po = dustPts(220, [-8, 8, 0.1, 3, -14, 4], noite ? 0x8a7a6a : 0xffd8a0, 0.035, 0.55); g.add(po);
  const fumo = steam(g, { origin: [-6.5 + 1.1, 3.2, -3 - 0.5], n: 8, size: 0.5, spread: 0.1, rise: 0.8, grow: 2, opacity: 0.25, life: 4, color: 0x8a8080, wind: [0.4, 0, 0] });
  // caixote do pai na porta do barraco dele
  mesh(box(0.5, 0.42, 0.42), LPmat(0x6a4a30), -4.6, 0.21, -2.4, g);
  return { PO, BT, lamp, po, casaPai, casaVelho, upd(t) { floatDust(po, t, 0.5, 0.25); fumo.upd(t, 1); lamp.forEach((l) => { const f = noite ? 0.75 + 0.25 * noise1(t * 3 + l.i) : 1; l.gl.material.opacity = 0.55 * f; }); } };
}

// ---------------------------------------------------------------- barraco por dentro (febre / a noite do pai)
// cômodo 4 x 4 m; esteira no canto do fundo à esquerda; porta na parede da frente (z = +2) gira no eixo da dobradiça
function barracoDentro(g, o = {}) {
  const pk = texPlanks([104, 76, 50], [80, 58, 38]), pm = SM(0xffffff, { map: pk.map, normalMap: pk.normalMap, roughness: 0.95, side: THREE.DoubleSide });
  const piso = mesh(box(4.2, 0.1, 4.2), SM(0xffffff, { map: texPlanks([90, 66, 44], [70, 50, 34]).map, roughness: 0.95 }), 0, -0.05, 0, g);
  const paredes = [[0, -2, 0], [-2, 0, Math.PI / 2], [2, 0, -Math.PI / 2]].map(([x, z, r]) => { const w = mesh(new THREE.PlaneGeometry(4.2, 2.6), pm, x, 1.3, z, g); w.rotation.y = r; return w; });
  // parede da frente com vão de porta (dois painéis e verga)
  [[-1.35, 1.5], [1.15, 1.9]].forEach(([x, w]) => { const p = mesh(new THREE.PlaneGeometry(w, 2.6), pm, x, 1.3, 2, g); p.rotation.y = Math.PI; });
  const verga = mesh(new THREE.PlaneGeometry(0.85, 0.6), pm, -0.17, 2.3, 2, g); verga.rotation.y = Math.PI;
  const dob = grp(g, -0.6, 0, 2); const porta = mesh(box(0.85, 2.0, 0.05), LPmat(0x3a2a1c, { rough: 0.9 }), 0.425, 1.0, 0, dob);
  // lá fora (pela porta): noite azul enluarada, para a silhueta na porta ter contorno
  const fora = mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ color: o.fora ?? 0x2c3858 }), 0, 2, 5, g); fora.rotation.y = Math.PI; fora.castShadow = false;
  const chaoF = mesh(new THREE.PlaneGeometry(12, 3), LPmat(0x1c1e2a), 0, 0, 3.5, g); chaoF.rotation.x = -Math.PI / 2;
  const luar = new THREE.SpotLight(0x8aa0ff, 6, 9, 0.5, 0.6, 1.2); luar.position.set(0, 2.2, 4.5); luar.target.position.set(-0.6, 0, 0); g.add(luar, luar.target);
  const teto = mesh(new THREE.PlaneGeometry(4.2, 4.2), pm, 0, 2.6, 0, g); teto.rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) mesh(box(0.12, 0.14, 4.2), LPmat(0x4a3424), -1.6 + i * 1.07, 2.5, 0, g); // caibros
  // janelinha com lua
  const jan = mesh(new THREE.PlaneGeometry(0.6, 0.5), new THREE.MeshBasicMaterial({ color: 0x3a4a78 }), 1.99, 1.6, -0.6, g); jan.rotation.y = -Math.PI / 2; jan.castShadow = false;
  [[0, 0.25], [0, -0.25]].forEach(([dy, dz]) => mesh(box(0.04, 0.55, 0.04), LPmat(0x2a1e14), 1.98, 1.6, -0.6 + dz, g)); mesh(box(0.04, 0.04, 0.6), LPmat(0x2a1e14), 1.98, 1.6, -0.6, g);
  // esteira, travesseiro e coberta
  mesh(box(0.95, 0.07, 1.95), LPmat(0xb8a88a, { rough: 1 }), -1.3, 0.035, -0.8, g); mesh(box(0.5, 0.1, 0.3), LPmat(0xd8ccb0, { rough: 1 }), -1.3, 0.12, -1.6, g);
  const cob = mesh(box(0.98, 0.05, 1.1), LPmat(0x6a4a3a, { rough: 1 }), -1.3, 0.1, -0.3, g); cob.rotation.z = 0.04;
  // caixote com lamparina, mesa com garrafas, botas e casaco no prego
  mesh(box(0.45, 0.4, 0.4), LPmat(0x7a5a3a), -0.55, 0.2, -1.55, g);
  const lam = grp(g, -0.55, 0.4, -1.55); mesh(cyl(0.05, 0.06, 0.04, 10), LPmat(0x5a4a3a, { metal: 0.5 }), 0, 0.02, 0, lam); mesh(lathe([[0.001, 0], [0.045, 0.02], [0.05, 0.08], [0.03, 0.14], [0.001, 0.15]], 10), new THREE.MeshStandardMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.35, roughness: 0.1 }), 0, 0.04, 0, lam);
  const chama = glowSprite(0xffb050, 0.12, 0.95); chama.position.y = 0.11; lam.add(chama); const halo = glowSprite(0xff9040, 1.4, 0.3); halo.position.y = 0.11; lam.add(halo);
  const luz = new THREE.PointLight(0xffa050, 5, 7, 1.5); luz.position.set(0, 0.18, 0); lam.add(luz);
  const mesa = grp(g, 1.1, 0, 0.6); mesh(box(1.0, 0.05, 0.6), LPmat(0x6a4a30), 0, 0.72, 0, mesa); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(box(0.05, 0.72, 0.05), LPmat(0x5a3a24), a * 0.45, 0.36, b * 0.25, mesa));
  [[-0.2, 0.05], [0.15, -0.1], [0.3, 0.12]].forEach(([x, z], i) => { const gb = garrafa(i === 1 ? 0x5a3a1a : 0x2a4a2a); gb.position.set(x, 0.83, z); mesa.add(gb); });
  [[0.6, 1.2, 1.4], [0.4, 1.5, -0.3], [1.5, 1.4, 0.4]].forEach(([x, z, r], i) => { const gb = garrafa(0x2a4a2a); gb.position.set(x, 0.03, z); gb.rotation.set(Math.PI / 2, 0, r); g.add(gb); }); // garrafas no chão
  [0, 1].forEach((k) => mesh(box(0.12, 0.16, 0.3), LPmat(0x2a1e14), 1.6 + k * 0.16, 0.08, -1.6, g));
  const casaco = mesh(box(0.5, 0.75, 0.08), LPmat(0x3a4a5a, { rough: 1 }), 1.97, 1.6, 1.2, g); casaco.rotation.y = -Math.PI / 2;
  const lua = new THREE.PointLight(0x8aa0ff, o.lua ?? 1.2, 7, 1.4); lua.position.set(1.6, 1.6, -0.6); g.add(lua);
  const po = dustPts(80, [-1.8, 1.8, 0.2, 2.4, -1.8, 1.8], 0xffd8a0, 0.018, 0.5); g.add(po);
  return { dob, luz, chama, halo, po, fora, upd(t, k = 1) { const f = 0.82 + 0.18 * noise1(t * 7) + 0.06 * Math.sin(t * 23); luz.intensity = 5 * f * k; halo.material.opacity = 0.3 * f * k; chama.material.opacity = 0.95 * k; chama.scale.setScalar(0.12 * (0.9 + 0.2 * noise1(t * 9))); floatDust(po, t, 0.2, 0.12); } };
}
