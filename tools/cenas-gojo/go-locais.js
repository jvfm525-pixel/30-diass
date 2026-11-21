// ================================================================ vídeo: Gojo · lugares (Shibuya, metrô, escola Jujutsu, Reino da Prisão, depósito, cidade em ruínas)
// regra: tudo apoiado em alguma coisa (chão, parede, teto); nada solto no ar, a não ser luz, poeira e fumaça.
function instG(g, geo, mat, arr, sombra = true) { const im = new THREE.InstancedMesh(geo, mat, arr.length), o = new THREE.Object3D();
  arr.forEach((a, i) => { o.position.set(a[0], a[1], a[2]); o.rotation.set(a[3] || 0, a[4] || 0, a[5] || 0); o.scale.set(a[6] ?? 1, a[7] ?? 1, a[8] ?? 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
  im.castShadow = sombra; im.receiveShadow = true; g.add(im); return im; }
function texAsfaltoG() { if (TX.asfG) return TX.asfG;
  return (TX.asfG = texPair(512, (u, v) => fbm2(u * 40, v * 40, 3, 40) * 0.6 + fbm2(u * 9, v * 9, 3, 9) * 0.4 - (Math.abs(fbm2(u * 5 + 3, v * 5, 4, 5) - 0.5) < 0.012 ? 0.25 : 0),
    (u, v, h) => { const n = fbm2(u * 4, v * 4, 4, 4); const c = mixc([50, 50, 56], [76, 76, 82], n); return mixc(c, [28, 28, 32], clamp((0.42 - h) * 2)); }, 3, { rep: [1, 1] })); }
function texAzulejoG(c = "#e8eaec", grout = "#9aa2a8", n = 8) { const k = "azG" + c + grout + n; if (TX[k]) return TX[k];
  return (TX[k] = texPair(256, (u, v) => { const fu = (u * n) % 1, fv = (v * n) % 1; return Math.min(fu, 1 - fu, fv, 1 - fv) < 0.04 ? 0 : 1; },
    (u, v, h) => (h < 0.5 ? hex2rgb(parseInt(grout.slice(1), 16)) : mixc(hex2rgb(parseInt(c.slice(1), 16)), [255, 255, 255], hash2(Math.floor(u * n), Math.floor(v * n)) * 0.12)), 2)); }
const texRep = (t, x, y) => { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); c.needsUpdate = true; return c; };
const coneTexG = canvasTex(16, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
function luzRuaG(g, x, z, o = {}) { // poste de luz com cone de luz
  const p = grp(g, x, o.y ?? 0, z), h = o.h ?? 5.2, col = o.col ?? 0xdfe6ff; p.rotation.y = o.rot ?? 0; const ferro = SM(0x5a5c62, { metalness: 0.5, roughness: 0.5 });
  mesh(cyl(0.05, 0.07, h, 10), ferro, 0, h / 2, 0, p); const arm = mesh(cyl(0.035, 0.035, 1.1, 8), ferro, 0, h - 0.05, 0.5, p); arm.rotation.x = Math.PI / 2 - 0.15;
  const head = grp(p, 0, h - 0.12, 1.05); mesh(box(0.42, 0.08, 0.2), ferro, 0, 0, 0, head); mesh(box(0.36, 0.02, 0.15), new THREE.MeshBasicMaterial({ color: col }), 0, -0.05, 0, head);
  if (o.luz !== false) { const L = new THREE.SpotLight(col, o.I ?? 22, 16, 0.85, 0.6, 1.6); L.position.set(0, -0.08, 0); head.add(L); L.target = grp(head, 0, -6, 0.3); }
  const gl = glowSprite(col, 0.9, 0.45); gl.position.set(0, -0.12, 0); head.add(gl);
  const cone = mesh(new THREE.ConeGeometry(1.6, h - 0.3, 24, 1, true), new THREE.MeshBasicMaterial({ color: col, map: coneTexG, transparent: true, opacity: 0.035, depthWrite: false, blending: ADD, side: THREE.DoubleSide }), 0, -(h - 0.3) / 2 - 0.08, 0, head); cone.castShadow = false;
  return p;
}
function luaG(g, pos, size = 9) {
  const tex = canvasTex(256, 256, (c, w) => { const r = w / 2; const gr = c.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, "#fffbee"); gr.addColorStop(0.92, "#f2ead6"); gr.addColorStop(1, "rgba(242,234,214,0)"); c.fillStyle = gr; c.beginPath(); c.arc(r, r, r, 0, 7); c.fill();
    for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(160,150,140,${0.12 + hash(i) * 0.12})`; c.beginPath(); c.arc(r + (hash(i * 3) - 0.5) * r * 1.2, r + (hash(i * 5) - 0.5) * r * 1.2, 8 + hash(i * 7) * 30, 0, 7); c.fill(); } });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffffff, fog: false, depthWrite: false })); s.scale.setScalar(size); s.position.set(...pos); g.add(s);
  const h = glowSprite(0xcfdcff, size * 4, 0.3); h.material.fog = false; h.position.set(...pos); g.add(h); return s;
}

// ---------------------------------------------------------------- prédios com janelas acesas
const JAN_T = {};
function janelasTex(v) { if (JAN_T[v]) return JAN_T[v]; const fundo = ["#1a1c24", "#262830", "#30343c", "#1c2028"][v % 4], ac = [0.3, 0.45, 0.22, 0.38][v % 4];
  return (JAN_T[v] = canvasTex(256, 512, (c, w, h) => { c.fillStyle = fundo; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 16; r++) for (let k = 0; k < 8; k++) { const q = hash(v * 97 + r * 13 + k * 7), lit = q < ac; c.fillStyle = lit ? (hash(q * 31) > 0.45 ? "#ffd29a" : "#d8e6ff") : "#0b0d14"; c.fillRect(k * 32 + 5, r * 32 + 7, 22, 19); }
    c.fillStyle = "rgba(0,0,0,.35)"; for (let r = 0; r < 16; r++) c.fillRect(0, r * 32 + 28, w, 3); })); }
const PRED_M = {};
function predioG(g, x, z, w, d, h, v = 0, ry = 0) { const rx = Math.max(1, Math.round(w / 20)), ryy = Math.max(1, Math.round(h / 40)), key = v + "_" + rx + "_" + ryy;
  const m = PRED_M[key] || (PRED_M[key] = new THREE.MeshStandardMaterial({ map: texRep(janelasTex(v), rx, ryy), emissive: 0xffffff, emissiveMap: texRep(janelasTex(v), rx, ryy), emissiveIntensity: 0.8, roughness: 0.7 }));
  const b = mesh(box(w, h, d), [m, m, SM(0x14161c), SM(0x14161c), m, m], x, h / 2, z, g); b.rotation.y = ry;
  mesh(box(w + 0.3, 0.4, d + 0.3), SM(0x22242c), x, h + 0.2, z, g).rotation.y = ry; return b; }
const telaTexF = (v) => canvasTex(256, 160, (c, w, h) => { const cs = [["#ff4aa8", "#6a2aff"], ["#2ad8ff", "#2a4aff"], ["#ffb02a", "#ff3a5a"], ["#6aff9a", "#1aa8d8"]][v % 4];
  const g_ = c.createLinearGradient(0, 0, w, h); g_.addColorStop(0, cs[0]); g_.addColorStop(1, cs[1]); c.fillStyle = g_; c.fillRect(0, 0, w, h);
  c.fillStyle = "rgba(255,255,255,.85)"; for (let i = 0; i < 3; i++) c.fillRect(20, 30 + i * 34, 60 + hash(v * 7 + i) * 120, 14); c.beginPath(); c.arc(w - 50, h / 2, 30, 0, 7); c.fill(); });
function telaoG(g, x, y, z, w, h, v, ry = 0) { const t = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: telaTexF(v), toneMapped: true }), x, y, z, g); t.rotation.y = ry; t.castShadow = false;
  const L = new THREE.PointLight(0xff8ad8, 0, 40, 1.5); return t; }
function neonG(g, x, y, z, h, cor, ry = 0) { const n = mesh(box(0.7, h, 0.18), new THREE.MeshStandardMaterial({ color: 0x101014, emissive: cor, emissiveIntensity: 1.6 }), x, y, z, g); n.rotation.y = ry; return n; }
function aboboraG(g, x, y, z, s = 1) { const a = grp(g, x, y, z); const c = mesh(sph(0.22 * s, 14, 10), LPmat(0xe8761a, { rim: 0.6 }), 0, 0.15 * s, 0, a); c.scale.y = 0.72; mesh(cyl(0.02 * s, 0.03 * s, 0.08 * s, 6), LPmat(0x3a5a1a), 0, 0.31 * s, 0, a); return a; }
function semaforoG(g, x, z, ry = 0) { const s = grp(g, x, 0, z); s.rotation.y = ry; const f = SM(0x3a3c42, { metalness: 0.5 }); mesh(cyl(0.07, 0.08, 4.6, 8), f, 0, 2.3, 0, s); mesh(box(1.6, 0.08, 0.08), f, 0.8, 4.5, 0, s);
  const cx = mesh(box(1.0, 0.36, 0.24), SM(0x1a1c20), 1.3, 4.3, 0, s); [[0x2aff8a, 0.98], [0xffd030, 1.3], [0xff2a2a, 1.62]].forEach(([c, xx], i) => mesh(cyl(0.11, 0.11, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0x080808, emissive: c, emissiveIntensity: i === 2 ? 2.2 : 0.15 }), xx, 4.3, 0.13, s).rotation.x = Math.PI / 2); return s; }
const veuTex = canvasTex(64, 512, (c, w, h) => { const g_ = c.createLinearGradient(0, 0, 0, h); g_.addColorStop(0, "rgba(4,2,8,1)"); g_.addColorStop(0.75, "rgba(14,6,24,.97)"); g_.addColorStop(1, "rgba(30,10,46,.85)"); c.fillStyle = g_; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 10; i++) { const x = hash(i) * w, L = h * (0.25 + hash(i * 3) * 0.35); const g2 = c.createLinearGradient(0, h - L, 0, h); g2.addColorStop(0, "rgba(0,0,0,0)"); g2.addColorStop(1, "rgba(0,0,0,.9)"); c.fillStyle = g2; c.fillRect(x, h - L, 2 + hash(i * 5) * 4, L); } });

// ---------------------------------------------------------------- 1 · cruzamento de Shibuya à noite, debaixo do véu
function shibuyaCruz(g) {
  skyDome(g, { top: 0x06040c, mid: 0x140a22, hor: 0x2a1438, ground: 0x0a080c, sunDir: [0.2, 0.2, -1], sunCol: 0x6a4a8a, sunI: 0.1, disk: 0.1, cov: 0.0, midY: 0.2 });
  const veu = mesh(new THREE.SphereGeometry(170, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: veuTex, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false }), 0, -2, 0, g); veu.castShadow = false;
  const asf = texAsfaltoG(); const ch = mesh(new THREE.PlaneGeometry(320, 320), SM(0xffffff, { map: texRep(asf.map, 40, 40), normalMap: texRep(asf.normalMap, 40, 40), roughness: 0.45 }), 0, 0, 0, g); ch.rotation.x = -Math.PI / 2;
  // faixas de pedestre nos quatro lados + as duas diagonais do cruzamento
  const fx = [], bm = SM(0xe8e8e2, { roughness: 0.6 });
  [[0, 12, 0], [0, -12, 0], [12, 0, Math.PI / 2], [-12, 0, Math.PI / 2]].forEach(([x, z, r]) => { for (let i = -9; i <= 9; i++) fx.push([x + Math.cos(r) * i * 1.05, 0.006, z - Math.sin(r) * i * 1.05, 0, r, 0]); });
  instG(g, box(0.55, 0.012, 3.6), bm, fx, false);
  // calçadas (quadras nos cantos), prédios, telões e neons
  const calc = texAzulejoG("#8a8a90", "#55565c", 6), cm = SM(0xffffff, { map: texRep(calc.map, 20, 20), normalMap: texRep(calc.normalMap, 20, 20), roughness: 0.7 });
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => { mesh(box(80, 0.16, 80), cm, sx * 56, 0.08, sz * 56, g); });
  const P = [[16, 22, 12, 14, 44, 0], [30, 19, 14, 12, 30, 1], [19, 34, 12, 14, 58, 2], [-17, 20, 12, 12, 36, 3], [-31, 22, 14, 14, 52, 0], [-20, 36, 12, 16, 28, 1], [18, -20, 14, 12, 48, 2], [33, -22, 12, 14, 34, 3],
    [-18, -19, 14, 12, 40, 0], [-33, -18, 12, 12, 26, 1], [-19, -34, 14, 14, 62, 2], [21, -36, 16, 14, 38, 3], [46, 18, 14, 16, 46, 0], [-46, 20, 14, 14, 40, 2], [46, -20, 16, 14, 30, 1], [-46, -22, 14, 14, 56, 3],
    [24, 54, 18, 14, 70, 1], [-26, 58, 18, 16, 64, 0], [26, -58, 16, 16, 72, 2], [-24, -56, 16, 16, 66, 3], [64, 40, 18, 18, 50, 0], [-64, -40, 18, 18, 58, 1], [64, -46, 18, 18, 44, 2], [-62, 44, 18, 18, 48, 3]];
  P.forEach(([x, z, w, d, h, v]) => predioG(g, x, z, w, d, h, v));
  const torre = mesh(cyl(8, 8, 42, 24), new THREE.MeshStandardMaterial({ map: texRep(janelasTex(1), 3, 1), emissive: 0xffffff, emissiveMap: texRep(janelasTex(1), 3, 1), emissiveIntensity: 0.8, roughness: 0.6 }), -14, 21, -14, g);
  telaoG(g, 10.05, 26, 22, 8, 5, 0, -Math.PI / 2); telaoG(g, -11.05, 22, 20, 7, 4.4, 1, Math.PI / 2); telaoG(g, 18, 30, -13.9, 9, 5.6, 2, 0); telaoG(g, -8, 18, -8.2, 6, 3.6, 3, Math.PI / 4); telaoG(g, 24, 40, 15.95, 10, 6, 3, Math.PI);
  [[10.4, 9, 26, 0xff3a8a, -Math.PI / 2], [10.4, 8, 18, 0x3ad8ff, -Math.PI / 2], [-10.4, 10, 26, 0xffb03a, Math.PI / 2], [-10.4, 7, 15, 0x9a6aff, Math.PI / 2], [24, 9, -13.6, 0x3affb0, 0], [-24, 8, -12.6, 0xff4a4a, 0]].forEach(([x, y, z, c, r]) => neonG(g, x, y, z, 6, c, r));
  // postes de luz, semáforos, abóboras de Halloween e cones na calçada
  [[10.8, 10.8, -Math.PI * 0.75], [-10.8, 10.8, Math.PI * 0.75], [10.8, -10.8, -Math.PI * 0.25], [-10.8, -10.8, Math.PI * 0.25], [10.8, 30, -Math.PI / 2], [-10.8, 30, Math.PI / 2], [10.8, -30, -Math.PI / 2], [-10.8, -30, Math.PI / 2]].forEach(([x, z, r], i) => luzRuaG(g, x, z, { y: 0.16, rot: r, luz: i < 4, col: i % 2 ? 0xffd8a8 : 0xdfe6ff }));
  semaforoG(g, 10.6, 14.5, Math.PI); semaforoG(g, -10.6, -14.5, 0); semaforoG(g, 14.5, -10.6, Math.PI / 2); semaforoG(g, -14.5, 10.6, -Math.PI / 2);
  [[12.2, 16], [13.1, 15.4], [-12.6, 17.2], [16.4, -12.4], [-15.8, -12.1], [-16.6, -13], [12.4, -18.5]].forEach(([x, z], i) => aboboraG(g, x, 0.16, z, 0.9 + hash(i) * 0.5));
  const lixo = []; for (let i = 0; i < 70; i++) { const a = hash(i) * 6.28, r = 2 + hash(i * 3) * 14; lixo.push([Math.cos(a) * r, 0.004, Math.sin(a) * r, 0, hash(i * 5) * 6.28, 0, 0.6 + hash(i * 7), 1, 0.6 + hash(i * 9)]); }
  instG(g, box(0.16, 0.004, 0.11), SM(0xd8d0c0, { roughness: 0.9 }), lixo, false);
  const L1 = new THREE.PointLight(0xff5ab0, 9, 50, 1.6); L1.position.set(14, 16, 22); g.add(L1); const L2 = new THREE.PointLight(0x3ab8ff, 9, 50, 1.6); L2.position.set(-14, 14, -18); g.add(L2);
  const brilho = estrelinhas(g, 16, [-30, 30, 10, 40, -90, -40], { cor: 0xc8a8ff, s: 0.1 });
  return { veu, brilho };
}

// ---------------------------------------------------------------- 2 · plataforma do metrô (subsolo), trem parado com uma porta aberta
function plataforma(g, o = {}) {
  const az = texAzulejoG("#c8cac8", "#7a7e80", 10), azP = texAzulejoG("#d8d2c0", "#8a8678", 8);
  const piso = mesh(new THREE.PlaneGeometry(9, 70), SM(0xffffff, { map: texRep(az.map, 9, 70), normalMap: texRep(az.normalMap, 9, 70), roughness: 0.38 }), -0.5, 0, 0, g); piso.rotation.x = -Math.PI / 2;
  mesh(box(9, 1.15, 70), SM(0x3a3c40), -0.5, -0.585, 0, g); // corpo da plataforma (a frente aparece no fosso)
  const tat = mesh(new THREE.PlaneGeometry(0.32, 70), SM(0xd8b42a, { roughness: 0.6 }), 3.35, 0.004, 0, g); tat.rotation.x = -Math.PI / 2;
  const bor = mesh(new THREE.PlaneGeometry(0.14, 70), SM(0xe8e8e8), 3.88, 0.004, 0, g); bor.rotation.x = -Math.PI / 2;
  // fosso dos trilhos: brita, dormentes, trilhos, parede do túnel
  const brita = mesh(new THREE.PlaneGeometry(6, 70), SM(0x2a2a2c, { roughness: 1 }), 6.5, -1.15, 0, g); brita.rotation.x = -Math.PI / 2;
  const dor = []; for (let i = 0; i < 112; i++) dor.push([5.55, -1.09, -34.7 + i * 0.62]); instG(g, box(2.4, 0.12, 0.24), SM(0x4a4440), dor);
  [4.8, 6.3].forEach((x) => mesh(box(0.08, 0.14, 70), SM(0x8a8a90, { metalness: 0.8, roughness: 0.35 }), x, -0.96, 0, g));
  mesh(box(0.6, 6, 70), SM(0x2a2c30), 9.2, 1.85, 0, g);
  // trem: dois carros, janelas iluminadas por dentro, faixa colorida; uma porta aberta perto de z = 1.6
  const trem = grp(g, 5.55, 0, 0), lata = SM(0xb8bcc4, { metalness: 0.6, roughness: 0.35 }), faixa = SM(0xc87a2a, { roughness: 0.5 }), vidro = new THREE.MeshStandardMaterial({ color: 0x101418, emissive: 0xcfe6ff, emissiveIntensity: 0.55, roughness: 0.2 });
  { const c = grp(trem, 0, 0, -10.4), L = 19.6; mesh(box(2.9, 2.95, L), lata, 0, 1.45, 0, c); mesh(box(2.94, 0.18, L + 0.02), faixa, 0, 0.75, 0, c); mesh(box(2.94, 0.7, L - 1), vidro, 0, 1.75, 0, c); mesh(box(2.7, 0.9, L - 2), SM(0x1a1a1e), 0, -0.55, 0, c); [-L / 2 + 3, L / 2 - 3].forEach((zz) => mesh(box(2.2, 0.5, 2.4), SM(0x26262a, { metalness: 0.4 }), 0, -0.85, zz, c)); }
  { // vagão oco: a porta fica em z = 1,6 (no vagão, z local = -8,8)
    const c = grp(trem, 0, 0, 10.4), L = 19.6, pz = 1.6 - 10.4, pa_ = pz - 0.65, pb_ = pz + 0.65, inte = SM(0xd8d4c8, { roughness: 0.7 });
    mesh(box(2.9, 0.12, L), SM(0x5a5a60), 0, -0.06, 0, c); mesh(box(2.9, 0.25, L), lata, 0, 2.83, 0, c); mesh(box(0.1, 2.7, L), lata, 1.4, 1.35, 0, c); [-L / 2 + 0.05, L / 2 - 0.05].forEach((zz) => mesh(box(2.9, 2.7, 0.1), lata, 0, 1.35, zz, c));
    const seg_ = (z0, z1) => { const Lz = z1 - z0, zc = (z0 + z1) / 2; mesh(box(0.1, 2.7, Lz), lata, -1.4, 1.35, zc, c); mesh(box(0.14, 0.18, Lz), faixa, -1.43, 0.75, zc, c); if (Lz > 1.2) mesh(box(0.12, 0.7, Lz - 0.6), vidro, -1.43, 1.75, zc, c); };
    seg_(-L / 2, pa_); seg_(pb_, L / 2); mesh(box(0.1, 0.75, 1.3), lata, -1.4, 2.33, pz, c);
    mesh(box(2.6, 0.04, L - 0.4), inte, 0, 2.66, 0, c); mesh(box(0.25, 0.05, L - 2), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4fff8, emissiveIntensity: 1.6 }), 0, 2.62, 0, c);
    [[1.1, 0, L - 0.4], [-1.1, pb_ + 0.6, L / 2 - 0.3]].forEach(([x, z0, z1]) => { const zc = x > 0 ? 0 : (z0 + z1) / 2, Lz = x > 0 ? L - 0.6 : z1 - z0; mesh(box(0.45, 0.42, Lz), SM(0x2a5a6a, { roughness: 0.8 }), x, 0.21, zc, c); mesh(box(0.1, 0.5, Lz), SM(0x2a5a6a), x + Math.sign(x) * 0.2, 0.62, zc, c); });
    [pz + 1.4, pz + 3.2, pz - 0.2].forEach((z) => mesh(cyl(0.02, 0.02, 2.6, 8), SM(0xc8ccd4, { metalness: 0.8, roughness: 0.3 }), 0.35, 1.3, z, c));
    mesh(box(2.7, 0.9, L - 2), SM(0x1a1a1e), 0, -0.55, 0, c); [-L / 2 + 3, L / 2 - 3].forEach((zz) => mesh(box(2.2, 0.5, 2.4), SM(0x26262a, { metalness: 0.4 }), 0, -0.85, zz, c));
    const Li = new THREE.PointLight(0xf0fff8, 5, 9, 1.5); Li.position.set(0, 2.3, pz + 1.5); c.add(Li); }
  const portas = []; [-17, -11, -5, 9.6, 15.6].forEach((z) => { [-1, 1].forEach((k) => { const d = mesh(box(0.06, 1.95, 0.68), SM(0x9ca0a8, { metalness: 0.6, roughness: 0.35 }), -1.48, 1.0, z + k * 0.34, trem); portas.push(d); }); });
  const vao = grp(trem, -1.47, 0, 1.6); const pa = mesh(box(0.05, 1.95, 0.66), SM(0x9ca0a8, { metalness: 0.6, roughness: 0.35 }), -0.02, 1.0, -0.98, vao), pb = mesh(box(0.05, 1.95, 0.66), SM(0x9ca0a8, { metalness: 0.6, roughness: 0.35 }), -0.02, 1.0, 0.98, vao);
  // paredes, teto com luminárias, pilares, bancos, placas
  mesh(box(0.4, 4.4, 70), SM(0xffffff, { map: texRep(azP.map, 30, 4), normalMap: texRep(azP.normalMap, 30, 4), roughness: 0.5 }), -5.2, 1.9, 0, g);
  [[-24, 0], [-12, 1], [12, 2], [24, 3]].forEach(([z, v]) => { const pl = mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ map: telaTexF(v) }), -4.99, 1.6, z, g); pl.rotation.y = Math.PI / 2; pl.castShadow = false; mesh(box(0.08, 2.0, 3.4), SM(0x2a2a2e), -5.02, 1.6, z, g); });
  mesh(box(16, 0.3, 70), SM(0x1e2024), 1.8, 3.95, 0, g);
  const lum = []; for (let z = -33; z <= 33; z += 3.3) [-3, 0.6].forEach((x) => lum.push([x, 3.77, z])); instG(g, box(0.22, 0.06, 2.6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe8fff4, emissiveIntensity: 2.2 }), lum, false);
  [-24, -8, 8, 24].forEach((z, i) => { const L = new THREE.PointLight(0xdff4ea, 9, 16, 1.4); L.position.set(-1, 3.4, z); g.add(L); });
  const pil = texAzulejoG("#b8c2c8", "#6a7276", 6); [-27, -18, -9, 9, 18, 27].forEach((z) => mesh(box(0.9, 3.8, 0.9), SM(0xffffff, { map: texRep(pil.map, 1, 4), normalMap: texRep(pil.normalMap, 1, 4) }), -1.2, 1.9, z, g));
  [-21, -3, 15].forEach((z) => { const b = grp(g, -4.6, 0, z); mesh(box(0.5, 0.06, 2.2), SM(0x7a5a3a), 0, 0.45, 0, b); [-0.9, 0.9].forEach((zz) => mesh(box(0.4, 0.45, 0.08), SM(0x3a3c40, { metalness: 0.5 }), 0, 0.22, zz, b)); });
  const placaTex = canvasTex(256, 48, (c, w, h) => { c.fillStyle = "#1a3a7a"; c.fillRect(0, 0, w, h); c.fillStyle = "#f4f4f4"; c.fillRect(14, 14, 90, 8); c.fillRect(14, 28, 60, 6); c.beginPath(); c.moveTo(210, 12); c.lineTo(236, 24); c.lineTo(210, 36); c.fill(); });
  [-15, 6].forEach((z) => { const s = grp(g, 0.8, 0, z); mesh(box(0.08, 0.42, 2.4), new THREE.MeshStandardMaterial({ map: placaTex, emissive: 0xffffff, emissiveMap: placaTex, emissiveIntensity: 0.6 }), 0, 3.2, 0, s); [-1, 1].forEach((k) => mesh(cyl(0.012, 0.012, 0.4, 5), SM(0x5a5a60), 0, 3.6, k, s)); });
  // restos das maldições: poças pretas no chão que somem e fumaça escura subindo
  const pocas = []; for (let i = 0; i < 14; i++) { const a = hash(i * 3) * 6.28, r = 1.5 + hash(i * 5) * 4.5; const p = mesh(new THREE.CircleGeometry(0.22 + hash(i) * 0.28, 9), new THREE.MeshBasicMaterial({ color: 0x07040a, transparent: true, opacity: 0.85, depthWrite: false }), Math.max(-4, Math.min(3, Math.cos(a) * r * 0.6)), 0.006 + i * 0.0003, Math.sin(a) * r, g); p.rotation.x = -Math.PI / 2; p.castShadow = false; p.scale.set(1, 0.55 + hash(i * 7) * 0.6, 1); p.rotation.z = hash(i * 9) * 3; pocas.push(p); }
  const fumo = steam(g, { origin: [-0.5, 0.2, 0], n: 26, size: 1.6, spread: 7, rise: 2.4, grow: 2.2, opacity: 0.35, life: 3.2, color: 0x140a1a, blending: NORM });
  const poeira = dustPts(160, [-4.5, 3.8, 0.1, 3.5, -12, 12], 0xcfe8ff, 0.025, 0.5); g.add(poeira);
  return { trem, vao, pa, pb, pocas, fumo, poeira };
}

// ---------------------------------------------------------------- 3 / 8 · escola Jujutsu: templo de madeira, escada de pedra, torii, lanternas, cedros
function cedros(g, pts) { const tr = [], c1 = [], c2 = [], c3 = []; pts.forEach(([x, z, s]) => { tr.push([x, 2 * s, z, 0, 0, 0, s, s, s]); c1.push([x, 4.5 * s, z, 0, hash(x) * 6, 0, s, s, s]); c2.push([x, 7.2 * s, z, 0, hash(z) * 6, 0, s * 0.78, s, s * 0.78]); c3.push([x, 9.6 * s, z, 0, 0, 0, s * 0.55, s, s * 0.55]); });
  instG(g, cyl(0.22, 0.32, 4, 6), SM(0x4a3426, { roughness: 1 }), tr); const fm = LPmat(0x24402a, { rim: 0.5 }); [c1, c2, c3].forEach((c) => instG(g, new THREE.ConeGeometry(2.2, 4, 7), fm, c)); }
function toro(g, x, z, noite) { const t = grp(g, x, 0, z), p = LPmat(0x8a8a84, { rim: 0.4 });
  mesh(box(0.56, 0.14, 0.56), p, 0, 0.07, 0, t); mesh(cyl(0.11, 0.13, 0.9, 8), p, 0, 0.59, 0, t); mesh(box(0.5, 0.1, 0.5), p, 0, 1.09, 0, t);
  mesh(box(0.34, 0.34, 0.34), new THREE.MeshStandardMaterial({ color: 0x6a6a64, emissive: 0xffb860, emissiveIntensity: noite ? 1.4 : 0, roughness: 0.9 }), 0, 1.31, 0, t);
  const tl = mesh(new THREE.ConeGeometry(0.42, 0.26, 4), p, 0, 1.61, 0, t); tl.rotation.y = Math.PI / 4; mesh(sph(0.05, 6, 4), p, 0, 1.77, 0, t);
  if (noite) { const gl = glowSprite(0xffb860, 1.1, 0.5); gl.position.y = 1.31; t.add(gl); } return t; }
function torii(g, x, z) { const t = grp(g, x, 0, z), v = LPmat(0xc8402a, { rim: 0.6 }), pr = LPmat(0x1a1a1e);
  [-2.4, 2.4].forEach((k) => { mesh(cyl(0.22, 0.26, 5.2, 10), v, k, 2.6, 0, t); mesh(cyl(0.3, 0.3, 0.3, 10), pr, k, 0.15, 0, t); });
  mesh(box(5.6, 0.26, 0.26), v, 0, 4.25, 0, t); mesh(box(6.6, 0.3, 0.5), v, 0, 5.05, 0, t); mesh(box(7.0, 0.2, 0.56), pr, 0, 5.3, 0, t);
  [-1, 1].forEach((k) => { const p = mesh(box(0.9, 0.2, 0.56), pr, k * 3.65, 5.36, 0, t); p.rotation.z = k * 0.16; }); mesh(box(0.3, 0.8, 0.2), v, 0, 4.65, 0, t); return t; }
const paredeJPTex = canvasTex(256, 128, (c, w, h) => { c.fillStyle = "#ece6d6"; c.fillRect(0, 0, w, h); c.fillStyle = "#5a3a22"; c.fillRect(0, h * 0.62, w, h * 0.38);
  c.fillStyle = "rgba(0,0,0,.18)"; for (let i = 0; i < 16; i++) c.fillRect(i * 16, h * 0.62, 1.5, h * 0.38); c.fillStyle = "#3a2418"; c.fillRect(0, 0, w, 7); c.fillRect(0, h * 0.6, w, 6); c.fillRect(0, h * 0.3, w, 4); [0, w / 2].forEach((x) => c.fillRect(x, 0, 10, h)); });
function salaoG(g, x, z, s = 1, ry = 0) { // salão de madeira sobre base de pedra, telhado de quatro águas
  const h = grp(g, x, 0, z); h.rotation.y = ry; h.scale.setScalar(s);
  const pedra = SM(0xffffff, { map: texRep(texBlocks([150, 146, 138], [120, 116, 110]).map, 6, 1) }), mad = LPmat(0x5a3a26, { rim: 0.4 }), madE = LPmat(0x3a2418, { rim: 0.3 });
  mesh(box(14, 0.8, 9), pedra, 0, 0.4, 0, h); mesh(box(14.4, 0.14, 9.4), mad, 0, 0.87, 0, h);
  const parede = SM(0xffffff, { map: texRep(paredeJPTex, 6, 1), roughness: 0.85 }); mesh(box(12, 3, 7), parede, 0, 2.44, 0, h);
  for (let i = 0; i < 6; i++) [-4.6, 4.6].forEach((zz) => mesh(cyl(0.14, 0.14, 3.1, 8), madE, -6.6 + i * 2.64, 2.49, zz, h)); [-6.6, 6.6].forEach((xx) => [-2.3, 0, 2.3].forEach((zz) => mesh(cyl(0.14, 0.14, 3.1, 8), madE, xx, 2.49, zz, h)));
  mesh(box(14.6, 0.24, 9.6), madE, 0, 4.05, 0, h);
  const tel = texRoof([66, 70, 80], [44, 48, 56]); const tm = SM(0xffffff, { map: texRep(tel.map || tel, 6, 3), roughness: 0.8, side: THREE.DoubleSide });
  const tg = new THREE.ConeGeometry(1, 1, 4, 1, true); tg.rotateY(Math.PI / 4); const tet = mesh(tg, tm, 0, 6.05, 0, h); tet.scale.set(8.6, 2.2, 6.0);
  const beiral = new THREE.CylinderGeometry(0.74, 1, 1, 4, 1, true); beiral.rotateY(Math.PI / 4); const be = mesh(beiral, tm, 0, 4.55, 0, h); be.scale.set(13.4, 0.9, 9.6);
  mesh(box(5.4, 0.3, 0.4), madE, 0, 7.12, 0, h); [-1, 1].forEach((k) => { const o_ = mesh(new THREE.ConeGeometry(0.16, 0.5, 4), madE, k * 2.75, 7.25, 0, h); o_.rotation.z = -k * 0.5; });
  for (let i = 0; i < 5; i++) mesh(box(3.2, 0.16, 0.36), pedra, 0, 0.08 + i * 0.16, 4.7 + 0.36 * (4 - i) + 0.18, h); // escada de pedra na frente
  return h; }
function escolaJujutsu(g, noite = false) {
  if (!noite) skyDome(g, { top: 0x2a6ad8, mid: 0x6aa8ec, hor: 0xd8ecff, ground: 0x4a5a3a, sunDir: [0.45, 0.55, -0.7], sunCol: 0xfff2d8, sunI: 1.1, disk: 1.2, cov: 0.42, cloudLit: 0xffffff, cloudSh: 0x9ab0cc, midY: 0.18 });
  else skyDome(g, { top: 0x02040c, mid: 0x081428, hor: 0x1a2a48, ground: 0x05070a, sunDir: [-0.3, 0.4, -1], sunCol: 0xb8c8ff, sunI: 0.15, disk: 0.2, cov: 0.12, cloudLit: 0x4a5a7a, cloudSh: 0x0a0e18, stars: 1, midY: 0.16 });
  const verde = noite ? 0x223028 : 0x568036, verde2 = noite ? 0x2c3c32 : 0x709642;
  const ter = terrain(g, { size: 360, segs: 90, grassA: verde, grassB: verde2, h: (x, z) => { const d = Math.hypot(x, z + 6); return d < 45 ? 0 : (d - 45) * 0.06 + Math.sin(x * 0.05) * 2 * clamp((d - 45) / 30); } });
  const cas = mesh(new THREE.PlaneGeometry(26, 22), SM(noite ? 0x4a4a50 : 0xb8b2a4, { roughness: 1 }), 0, 0.012, 6, g); cas.rotation.x = -Math.PI / 2;
  const laje = mesh(new THREE.PlaneGeometry(2.6, 26), SM(0xffffff, { map: texRep(lajeTex, 1, 10), roughness: 0.9 }), 0, 0.02, 9.5, g); laje.rotation.x = -Math.PI / 2;
  salaoG(g, 0, -9); salaoG(g, 17, 0, 0.62, -Math.PI / 2); salaoG(g, -17, 1, 0.55, Math.PI / 2);
  torii(g, 0, 22); [[-2.3, 18], [2.3, 18], [-2.3, 12], [2.3, 12], [-2.3, 6], [2.3, 6]].forEach(([x, z]) => toro(g, x, z, noite));
  const cp = []; for (let i = 0; i < 70; i++) { const a = hash(i * 2.3) * 6.28, r = 26 + hash(i * 5.1) * 40; const x = Math.cos(a) * r, z = Math.sin(a) * r - 6; if (z > 14 && Math.abs(x) < 16) continue; cp.push([x, z, 0.9 + hash(i * 7) * 0.7]); }
  [[-11, -16, 1.1], [11, -17, 1.2], [-8, 14, 0.8], [9, 15, 0.9], [-24, -8, 1.3], [25, -10, 1.2]].forEach((q) => cp.push(q)); cedros(g, cp);
  montanhasLonge(g, 230, 16, noite ? 0x0e1420 : 0x7a98b8, 46);
  const grama = gramaAlta(g, 1600, [-30, 30, -6, 30], () => 0, { base: noite ? 0x1a2a1e : 0x3a6a22, ponta: noite ? 0x3a5a4a : 0xb8d86a, mask: (x, z) => !(Math.abs(x) < 13.5 && z > -5.5 && z < 17.5) && !(Math.abs(x) < 3 && z > -6 && z < 24) && !(Math.abs(x) < 8.5 && z < -3.5) });
  let extra = {};
  if (noite) { const lua = luaG(g, [-60, 70, -170], 12); const vag = dustPts(90, [-12, 12, 0.2, 2.5, -4, 20], 0xd8ff8a, 0.05, 0.85); g.add(vag); extra = { lua, vag }; }
  else { const sol = solFlare(g, [90, 110, -140], 1.4, 0xfff0d0); const brilho = estrelinhas(g, 40, [-10, 10, 0.5, 6, -4, 16], { cor: 0xfff0c8, s: 0.08 }); extra = { sol, brilho }; }
  const folhas = folhasRef(g, 90, [-14, 14, 0.2, 7, -6, 20], { cores: noite ? [0x2a4a30, 0x3a5a3a] : [0x5aa832, 0x7ac043, 0x3e8a26] });
  return { ter, grama, folhas, ...extra };
}

// ---------------------------------------------------------------- 4 · dentro do Reino da Prisão: sala de carne e osso, olhos nas paredes
function prisaoDentro(g) {
  const m = new THREE.MeshStandardMaterial({ map: texRep(carneTex, 4, 4), roughness: 0.6, emissive: 0x2a0408, emissiveIntensity: 0.4 });
  const ch = mesh(new THREE.PlaneGeometry(40, 40), m, 0, 0, 0, g); ch.rotation.x = -Math.PI / 2;
  const pm = new THREE.MeshStandardMaterial({ map: texRep(carneTex, 3, 2), roughness: 0.55, emissive: 0x3a0610, emissiveIntensity: 0.5, side: THREE.BackSide });
  mesh(new THREE.BoxGeometry(26, 16, 26), pm, 0, 7.98, 0, g);
  const osso = LPmat(0xd8ccb8, { rim: 0.6 }); for (let i = 0; i < 7; i++) { const z = -11 + i * 3.7, pts = [V3(-12.8, 0, z), V3(-12, 8, z), V3(-6, 14.5, z), V3(0, 15.6, z), V3(6, 14.5, z), V3(12, 8, z), V3(12.8, 0, z)];
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.32, 8), osso, 0, 0, 0, g); }
  const olhos = []; [[-12.9, 4, -4, Math.PI / 2], [12.9, 5, 3, -Math.PI / 2], [-6, 6, -12.9, 0], [7, 3.5, -12.9, 0], [0, 9, -12.9, 0]].forEach(([x, y, z, r], i) => { const o = grp(g, x, y, z); o.rotation.y = r;
    const b = mesh(sph(1.3, 24, 16), LPmat(0xeee4d8, { rim: 0.3, liso: true }), 0, 0, -0.6, o); b.scale.z = 0.6; const ir = mesh(new THREE.CircleGeometry(0.62, 24), new THREE.MeshStandardMaterial({ color: 0x3a1408, emissive: 0xff5a20, emissiveIntensity: 0.6 }), 0, 0, 0.19, o); const pu = mesh(new THREE.CircleGeometry(0.28, 20), SM(0x020202), 0, 0, 0.2, o);
    mesh(new THREE.TorusGeometry(1.32, 0.18, 6, 24), LPmat(0x4a0e14, { rim: 0.4 }), 0, 0, -0.1, o).scale.y = 0.62; olhos.push({ o, ir, pu }); });
  const L = new THREE.PointLight(0xff4a5a, 12, 30, 1.4); L.position.set(0, 0.8, -3.5); g.add(L); const L2 = new THREE.PointLight(0x8a3aff, 7, 30, 1.4); L2.position.set(-4, 9, -6); g.add(L2); const L3 = new THREE.PointLight(0xc8dcff, 5, 12, 1.5); L3.position.set(1.2, 2.4, 3.2); g.add(L3);
  const poeira = dustPts(200, [-10, 10, 0.1, 9, -10, 10], 0xffb0b8, 0.035, 0.6); g.add(poeira);
  const nevoa = steam(g, { origin: [0, 0.3, -2], n: 18, size: 4, spread: 14, rise: 0.6, grow: 1.4, opacity: 0.18, life: 5, color: 0x5a1a2a });
  return { olhos, poeira, nevoa };
}
// amarras de carne: tubos do chão até o corpo (fixos depois da pose)
function amarras(g, p, pts) { p.updateMatrixWorld(true); return pts.map(([osso, x, y, z, ax, az]) => { const a = p.userData[osso].localToWorld(V3(x, y, z)); const c = [V3(ax, 0.02, az), V3(lerp(ax, a.x, 0.5), a.y * 0.4 + 0.15, lerp(az, a.z, 0.5)), a];
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(c), 20, 0.035, 6), LPmat(0x7a2430, { rim: 0.7, liso: true }), 0, 0, 0, g); }); }

// ---------------------------------------------------------------- 5 · depósito de ferramentas amaldiçoadas (madeira, talismãs, altar com o cubo da porta de trás)
function depositoG(g) {
  const mad = SM(0xffffff, { map: texRep(madeiraTex, 4, 4), roughness: 0.85 }), madP = SM(0xffffff, { map: texRep(madeiraTex, 6, 2), roughness: 0.85 }), viga = LPmat(0x3a2416, { rim: 0.4 });
  const ch = mesh(new THREE.PlaneGeometry(12, 14), mad, 0, 0, 0, g); ch.rotation.x = -Math.PI / 2;
  mesh(box(12, 4.6, 0.3), madP, 0, 2.3, -7, g); mesh(box(0.3, 4.6, 14), madP, -6, 2.3, 0, g); mesh(box(0.3, 4.6, 14), madP, 6, 2.3, 0, g); mesh(box(12, 4.6, 0.3), madP, 0, 2.3, 7, g);
  mesh(box(12.4, 0.2, 14.4), SM(0x1a120c), 0, 4.7, 0, g);
  const vigas = [-4.5, -1.5, 1.5, 4.5]; vigas.forEach((z) => mesh(box(12, 0.3, 0.3), viga, 0, 4.3, z, g));
  vigas.forEach((z, j) => { for (let i = 0; i < 9; i++) ofuda(g, -5 + i * 1.25 + hash(i + j * 9) * 0.4, 4.15, z, hash(i * 3 + j) * 0.6 - 0.3, 0.24 + hash(i * 7 + j) * 0.1); });
  for (let i = 0; i < 3; i++) { const e = grp(g, -5.4, 0, -5 + i * 3.2); mesh(box(0.9, 3.2, 2.6), SM(0x4a2e1c), 0, 1.6, 0, e); for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { const cx = mesh(box(0.3, 0.4, 0.55), LPmat(0x8a6a44, { rim: 0.3 }), 0.5, 0.45 + r * 0.75, -0.6 + c * 1.2, e); } }
  for (let i = 0; i < 3; i++) { const e = grp(g, 5.4, 0, -5 + i * 3.2); mesh(box(0.9, 3.2, 2.6), SM(0x4a2e1c), 0, 1.6, 0, e); for (let r = 0; r < 4; r++) mesh(cyl(0.09, 0.09, 0.7, 8), LPmat(0xd8c8a0, { rim: 0.3 }), -0.5, 0.4 + r * 0.75, 0, e).rotation.x = Math.PI / 2; }
  // altar no fundo com o cubo da porta de trás, enrolado em talismãs
  const alt = grp(g, 0, 0, -5.4); mesh(box(2.4, 0.9, 1.2), LPmat(0x2a1a12, { rim: 0.4 }), 0, 0.45, 0, alt); mesh(box(2.6, 0.08, 1.4), LPmat(0x5a3a22, { rim: 0.4 }), 0, 0.94, 0, alt);
  const cubo = cuboPrisao(alt, 0.3); cubo.c.position.y = 0.98; for (let i = 0; i < 5; i++) { const f = mesh(new THREE.PlaneGeometry(0.06, 0.34), OFUDA_M(), 0, 0.98 + 0.15, 0, alt); f.rotation.set(0, (i / 5) * Math.PI, 0); f.position.x = Math.cos((i / 5) * Math.PI) * 0.152; f.position.z = -Math.sin((i / 5) * Math.PI) * 0.152; f.rotation.y = Math.PI / 2 + (i / 5) * Math.PI; f.castShadow = false; }
  [-0.9, 0.9].forEach((x) => vela(alt, x, 0.98, 0.2));
  // suporte da Lança (esquerda) e pedestal da Corda (direita)
  const sup = grp(g, -0.75, 0, -2.6); mesh(box(0.9, 0.12, 0.45), LPmat(0x3a2416), 0, 0.06, 0, sup); [-0.32, 0.32].forEach((x) => { mesh(box(0.1, 1.0, 0.1), LPmat(0x3a2416), x, 0.6, 0, sup); mesh(box(0.1, 0.12, 0.05), LPmat(0x3a2416), x, 1.16, 0.045, sup); mesh(box(0.1, 0.12, 0.05), LPmat(0x3a2416), x, 1.16, -0.045, sup); });
  const lanca = lancaInvertida(); sup.add(lanca); lanca.position.set(-0.12, 1.135, 0); lanca.rotation.z = -Math.PI / 2;
  const ped = grp(g, 0.75, 0, -2.6); mesh(cyl(0.42, 0.5, 0.9, 8), LPmat(0x5a4a3a, { rim: 0.3 }), 0, 0.45, 0, ped); mesh(cyl(0.48, 0.48, 0.06, 8), LPmat(0x2a1a12), 0, 0.93, 0, ped);
  const corda = cordaNegra(); ped.add(corda); corda.position.y = 0.96;
  const jan = mesh(new THREE.PlaneGeometry(1.4, 0.6), new THREE.MeshBasicMaterial({ color: 0xfff0d0 }), -5.84, 3.6, 0.5, g); jan.rotation.y = Math.PI / 2; jan.castShadow = false;
  const raios_ = godRays(g, [-5.8, 3.6, 0.5], [1, -0.55, -0.15], { n: 6, len: 9, w: 0.9, spread: 1.2, opacity: 0.16, color: 0xffe8c0 });
  const Ls = new THREE.SpotLight(0xffe0b0, 60, 20, 0.55, 0.6, 1.4); Ls.position.set(-5.6, 3.6, 0.5); Ls.target = grp(g, 0, 0.8, -2.6); g.add(Ls); const Lf = new THREE.PointLight(0xffb870, 6, 12, 1.4); Lf.position.set(0, 2.6, 0.5); g.add(Lf);
  const poeira = dustPts(180, [-5, 5, 0.2, 4.2, -6, 4], 0xffe8c0, 0.03, 0.7); g.add(poeira);
  return { cubo, lanca, corda, sup, ped, poeira, raios_ };
}
// pó que sobe quando uma coisa some (partículas que nascem no objeto)
function poSumindo(g, pos, cor = 0x2a2030, n = 60) { const p = dustPts(n, [-0.35, 0.35, 0, 0.25, -0.15, 0.15], cor, 0.05, 0.9, NORM); p.position.set(...pos); g.add(p); p.visible = false; return p; }

// ---------------------------------------------------------------- 6 / 9 · cidade em ruínas do Jogo do Abate (à noite)
function ruinasG(g, o = {}) {
  skyDome(g, { top: 0x04040c, mid: 0x10122a, hor: 0x3a2a3a, ground: 0x0a0a0c, sunDir: [0.3, 0.12, -1], sunCol: 0xff9a6a, sunI: 0.25, disk: 0.3, cov: 0.35, cloudLit: 0x6a4a5a, cloudSh: 0x0e0e18, stars: 1, midY: 0.15 });
  const asf = texAsfaltoG(); const ch = mesh(new THREE.PlaneGeometry(260, 260), SM(0xffffff, { map: texRep(asf.map, 30, 30), normalMap: texRep(asf.normalMap, 30, 30), roughness: 0.6 }), 0, 0, 0, g); ch.rotation.x = -Math.PI / 2;
  const calc = texAzulejoG("#6a6a70", "#45464c", 6), cm = SM(0xffffff, { map: texRep(calc.map, 10, 40), normalMap: texRep(calc.normalMap, 10, 40) });
  [-1, 1].forEach((k) => mesh(box(5, 0.16, 120), cm, k * 9.5, 0.08, -20, g));
  // prédios quebrados dos dois lados da rua (topo irregular), poucas janelas acesas
  const P = [[-16, 6, 10, 12, 18, 2], [-16, -10, 10, 12, 30, 0], [-17, -27, 12, 14, 22, 3], [-16, -45, 10, 12, 36, 1], [16, 8, 10, 12, 14, 1], [16, -9, 10, 12, 26, 3], [17, -26, 12, 12, 34, 0], [16, -44, 10, 14, 20, 2], [-30, -60, 16, 16, 50, 1], [28, -64, 16, 16, 44, 2], [0, -80, 20, 14, 38, 3]];
  P.forEach(([x, z, w, d, h, v], i) => { predioG(g, x, z, w, d, h, v); const q = grp(g, x, h, z); for (let j = 0; j < 4; j++) mesh(box(w * (0.2 + hash(i * 3 + j) * 0.3), 1 + hash(i + j) * 3, d * (0.2 + hash(i * 5 + j) * 0.3)), SM(0x2a2c32), (hash(i * 7 + j) - 0.5) * w * 0.6, 0.5, (hash(i * 9 + j) - 0.5) * d * 0.6, q); });
  // o prédio baixo do Anjo (telhado plano com mureta), na esquina da direita
  const tel = grp(g, 7.5, 0, -16); mesh(box(6, 7, 6), SM(0x3a3c44), 0, 3.5, 0, tel); mesh(box(6.2, 0.4, 6.2), SM(0x2a2c32), 0, 7.2, 0, tel); [[0, 3.05, 6.2, 0.2], [0, -3.05, 6.2, 0.2], [3.05, 0, 0.2, 6.2], [-3.05, 0, 0.2, 6.2]].forEach(([x, z, w, d]) => mesh(box(w, 0.22, d), SM(0x2a2c32), x, 7.51, z, tel));
  // entulho no chão, carros abandonados, postes apagados, fogo e fumaça ao longe
  const ent = []; for (let i = 0; i < 90; i++) { const x = (hash(i * 3) - 0.5) * 30, z = 10 - hash(i * 5) * 70; if (Math.abs(x) < 3.5 && z > -24 && z < 6) continue; ent.push([x, 0.15 + hash(i) * 0.2, z, hash(i * 7) * 3, hash(i * 9) * 3, 0, 0.4 + hash(i * 11) * 1.4, 0.3 + hash(i * 13) * 0.8, 0.4 + hash(i * 17) * 1.2]); }
  instG(g, new THREE.DodecahedronGeometry(1, 0), LPmat(0x4a4a50, { rim: 0.3 }), ent);
  [[-5, -30, 0.3], [5.5, -38, 2.8], [-5.5, 2, 1.4]].forEach(([x, z, r]) => { const c = grp(g, x, 0, z); c.rotation.y = r; mesh(box(1.8, 0.8, 4.2), SM(0x2a3a4a, { metalness: 0.5, roughness: 0.4 }), 0, 0.65, 0, c); mesh(box(1.6, 0.6, 2.2), SM(0x15181c), 0, 1.3, -0.2, c); [[-0.8, -1.3], [0.8, -1.3], [-0.8, 1.3], [0.8, 1.3]].forEach(([a, b]) => mesh(cyl(0.32, 0.32, 0.22, 10), SM(0x101012), a, 0.32, b, c).rotation.z = Math.PI / 2); });
  [[-7.6, -4], [7.6, 6], [-7.6, -26], [7.6, -32]].forEach(([x, z], i) => luzRuaG(g, x, z, { y: 0.16, rot: x < 0 ? Math.PI / 2 : -Math.PI / 2, luz: false, col: 0x2a2a30 }));
  const fogos = [[-22, -40, 1.6], [24, -52, 2], [-12, -70, 2.4]].map(([x, z, s]) => fogoLonge(g, x, z, s));
  const fumo = steam(g, { origin: [0, 14, -60], n: 20, size: 14, spread: 40, rise: 6, opacity: 0.3, color: 0x2a2228, wind: [1.5, 0, 0] });
  const brasaP = dustPts(70, [-20, 20, 1, 12, -70, -28], 0xffa060, 0.06, 0.8); g.add(brasaP); const brasa = (t) => floatDust(brasaP, t, 0.5, 0.3);
  const Lf = new THREE.PointLight(0xff7a3a, 30, 80, 1.5); Lf.position.set(-18, 6, -40); g.add(Lf);
  return { tel, fogos, fumo, brasa };
}
// a Escada de Jacó: coluna de luz dourada que desce do céu e acende o chão
function escadaJaco(g, pos) { const e = grp(g, ...pos), m = new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0, blending: ADD, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const c1 = mesh(new THREE.CylinderGeometry(0.55, 0.55, 120, 32, 1, true), m, 0, 60, 0, e), c2 = mesh(new THREE.CylinderGeometry(1.4, 1.4, 120, 32, 1, true), m.clone(), 0, 60, 0, e);
  const disco = mesh(new THREE.CircleGeometry(3.2, 40), new THREE.MeshBasicMaterial({ color: 0xffe6a0, map: softTex, transparent: true, opacity: 0, blending: ADD, depthWrite: false }), 0, 0.02, 0, e); disco.rotation.x = -Math.PI / 2;
  const aneis = [0, 1, 2].map(() => { const r = mesh(new THREE.RingGeometry(0.95, 1, 64), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0, blending: ADD, depthWrite: false, side: THREE.DoubleSide }), 0, 0.04, 0, e); r.rotation.x = -Math.PI / 2; return r; });
  const penas = dustPts(80, [pos[0] - 1.6, pos[0] + 1.6, 0.2, 9, pos[2] - 1.6, pos[2] + 1.6], 0xfff0c0, 0.04, 0.8); g.add(penas);
  const L = new THREE.PointLight(0xffe0a0, 0, 30, 1.4); L.position.set(0, 3, 0); e.add(L);
  [c1, c2, disco, ...aneis].forEach((x) => (x.castShadow = false));
  return { e, set(k, t) { const b = E.out(seg(k, 0, 0.4)); c1.scale.y = c2.scale.y = Math.max(0.001, b); c1.position.y = c2.position.y = 120 - 60 * b; m.opacity = 0.32 * k; c2.material.opacity = 0.07 * k; disco.material.opacity = 0.45 * k; L.intensity = 14 * k;
    aneis.forEach((r, i) => { const ph = ((t * 0.6 + i / 3) % 1); r.scale.setScalar(1 + ph * 5); r.material.opacity = k * 0.4 * (1 - ph); }); penas.visible = k > 0.02; penas.material.opacity = 0.8 * k; floatDust(penas, t, 0.6, 0.2); } };
}
