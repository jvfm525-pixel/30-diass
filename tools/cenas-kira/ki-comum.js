// ================================================================ vídeo: Por que o Kira queria tanto uma vida normal? (comum)
// Estilo do vídeo do Eren (documentário): fotos de licença livre + cenários 3D originais. Nada desenhado da obra:
// o Kira aparece como um símbolo original, o homem sem rosto (assalariado de terno com o rosto liso de porcelana).
// Animação v5: pés plantados (gait, gaitFit, standFeet), gestos com antecipação e acomodação (act), gravata, paletó e
// cabelo com mola (mola + lagLocal), mãos que pegam objetos por IK, peso que passa de um pé pro outro e câmera contínua.
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wpos = (o, v = V3()) => o.getWorldPosition(v);
const GOLDM = () => new THREE.MeshStandardMaterial({ color: 0xe8b040, metalness: 0.92, roughness: 0.24, emissive: 0x4a2a00, emissiveIntensity: 0.35, envMap: envGold(), envMapIntensity: 1.1 });
// câmera: posição em curva contínua (Catmull-Rom), olhar interpolado suave entre as chaves (sem chicotear)
function path2(t, ks) {
  const c = path(t, ks), n = ks.length;
  if (t <= ks[0][0] || t >= ks[n - 1][0]) return c;
  let i = 0; while (i < n - 2 && t > ks[i + 1][0]) i++;
  const u = sm(seg(t, ks[i][0], ks[i + 1][0]));
  return { ...c, look: lerp3(ks[i][2], ks[i + 1][2], u) };
}
// pés plantados em posições dadas (mundo)
function plantFeet(p, feet, ang, toe = [0, 0]) {
  const u = p.userData; p.updateMatrixWorld(true);
  [0, 1].forEach((i) => {
    const f = feet[i]; legIK(p, i, V3(f[0], f[1], f[2]), V3(f[0] + Math.sin(ang) * 1.2, f[1] + 0.6, f[2] + Math.cos(ang) * 1.2));
    u.knee[i].updateMatrixWorld(true); u.knee[i].getWorldQuaternion(_gq); _gq.invert(); _gq2.setFromEuler(_gE.set(-(toe[i] || 0), ang, 0, "YXZ")); u.ankle[i].quaternion.copy(_gq.multiply(_gq2));
  });
}

// ---------------------------------------------------------------- fotos de licença livre (assets/img/<chave>.jpg), carregadas antes do 1º quadro
window.HF_PRELOAD = window.HF_PRELOAD || [];
const PHOTO = {};
const _photoLoader = new THREE.TextureLoader();
function photoMat(key, o = {}) {
  const m = new THREE.MeshBasicMaterial({ color: o.tint ?? 0xffffff, toneMapped: o.tm ?? false, fog: o.fog ?? false, transparent: o.transparent ?? false, opacity: o.opacity ?? 1, depthWrite: o.depthWrite ?? true, side: o.side ?? THREE.FrontSide });
  if (!(T.fotos || []).includes(key)) { m.color.set(o.fallback ?? 0x101018); return m; } // foto ainda não baixada: fica o fundo procedural
  if (!PHOTO[key]) {
    const P = (PHOTO[key] = { mats: [], tex: null });
    P.p = _photoLoader.loadAsync(`assets/img/${key}.jpg`).then((tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; P.tex = tex; P.mats.forEach((mm) => { mm.map = tex; mm.needsUpdate = true; }); }).catch(() => { P.mats.forEach((mm) => mm.color.set(o.fallback ?? 0x101018)); });
    window.HF_PRELOAD.push(P.p);
  }
  PHOTO[key].mats.push(m); if (PHOTO[key].tex) m.map = PHOTO[key].tex;
  return m;
}
// foto num plano (com recorte de proporção: aspect = largura/altura da foto; o plano mostra a faixa central)
function photoPlane(parent, key, w, h, o = {}) {
  const m = photoMat(key, o), pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  if (o.crop) { const uv = pl.geometry.attributes.uv; const [u0, v0, u1, v1] = o.crop; for (let i = 0; i < uv.count; i++) uv.setXY(i, lerp(u0, u1, uv.getX(i)), lerp(v0, v1, uv.getY(i))); }
  pl.castShadow = false; pl.receiveShadow = false; parent.add(pl); return pl;
}

// ---------------------------------------------------------------- o homem sem rosto (símbolo original)
// terno cinza-azulado, camisa branca, gravata vinho lisa, cabelo escuro penteado; rosto liso de porcelana, sem traços
const HOMEM = { hair: 0x1e1c22, hairStyle: "penteado", skin: 0xece9e4, iris: 0x222222, jacket: 0x2c3242, shirt: 0xf1eee6, pants: 0x2a3040, boots: 0x121012, belt: 0x16121a, jacketOpen: 0.26, cuff: 0xf1eee6, seed: 71, olw: 0.0042 };
const PORC = () => { const m = new THREE.MeshStandardMaterial({ color: 0xf2f1ee, roughness: 0.34, metalness: 0.0, emissive: 0x1a1c22, emissiveIntensity: 0.18 }); rimify(m, 0.9); return m; };
function semRosto(o = {}) {
  const p = pessoa({ ...HOMEM, ...o }), u = p.userData;
  u.eyes.forEach((e) => (e.g.visible = false)); u.brows.forEach((b) => (b.visible = false)); u.mouth.g.visible = false;
  u.headM.material = PORC();
  u.head.children.forEach((c) => { if (c.isMesh && c !== u.headM && Math.abs(c.position.x) < 0.01 && c.position.y > 0.08 && c.position.y < 0.112) c.visible = false; }); // nariz liso
  // gravata vinho com nó: pende de um pivô no colarinho (balança com a mola)
  const tieM = TM(o.tie ?? 0x5a1a26);
  const tg = grp(u.chest, 0, 0.285, 0.088);
  const knot = mesh(sph(1, 10, 8), tieM, 0, -0.008, 0.008, tg); knot.scale.set(0.017, 0.021, 0.011);
  // gravata que alarga e termina em ponta, curvada para deitar sobre o peito (perfil do peito: z = raio * 0.7)
  const chestZ = (y) => { const P_ = [[-0.02, 0.091], [0.06, 0.106], [0.15, 0.118], [0.22, 0.116], [0.27, 0.098], [0.305, 0.056]]; for (let i = 0; i < P_.length - 1; i++) if (y <= P_[i + 1][0]) return lerp(P_[i][1], P_[i + 1][1], (y - P_[i][0]) / (P_[i + 1][0] - P_[i][0])); return 0.056; };
  const rows = 9, tpos = [], tidx = [];
  for (let r = 0; r <= rows; r++) { const d = 0.016 + (r / rows) * 0.2, hw = lerp(0.011, 0.024, r / rows), zz = chestZ(0.285 - d) + 0.007 - 0.088; tpos.push(-hw, -d, zz, hw, -d, zz); }
  tpos.push(0, -0.244, chestZ(0.041) + 0.007 - 0.088);
  for (let r = 0; r < rows; r++) { const a = r * 2; tidx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  tidx.push(rows * 2, rows * 2 + 2, rows * 2 + 1);
  const tGeo = new THREE.BufferGeometry(); tGeo.setAttribute("position", new THREE.Float32BufferAttribute(tpos, 3)); tGeo.setIndex(tidx); tGeo.computeVertexNormals();
  const tie = mesh(tGeo, TM(o.tie ?? 0x5a1a26, { side: THREE.DoubleSide }), 0, 0, 0, tg); tie.castShadow = false;
  // botões do paletó e lenço no bolso (detalhes do "homem comum")
  mesh(sph(0.008, 8, 6), TM(0x1a1a20), 0.035, 0.05, 0.118, u.chest); mesh(sph(0.008, 8, 6), TM(0x1a1a20), 0.034, -0.02, 0.112, u.spine);
  u.tie = tg; u.tieMesh = tie;
  return p;
}
// mola da gravata e do cabelo a partir da posição do peito ao longo do tempo (fn(τ) -> [x,y,z] no mundo)
function molaHomem(p, t, posFn, o = {}) {
  const L = lagLocal(p, mola(t, posFn, { k: o.k ?? 60, c: o.c ?? 7, w: 1.2 }));
  // a gravata só sai do peito para a frente (parar de andar, inclinar o corpo); para os lados balança livre
  const u = p.userData; u.tie.rotation.x = -clamp(L[2] * 9, 0, 0.9) - Math.max(0, u.spine.rotation.x + u.chest.rotation.x + u.hips.rotation.x) * 0.85;
  u.tie.rotation.z = clamp(-L[0] * 9, -0.6, 0.6) * (1 + u.tie.rotation.x * -1.2);
  hairMola(p, L, 4);
  return L;
}
// pasta executiva (presa na mão direita)
function pasta(parent) {
  const b = grp(parent, 0, -0.1, 0.0), m = SM(0x2a1a14, { roughness: 0.55 });
  mesh(box(0.36, 0.27, 0.08), m, 0, -0.16, 0, b); mesh(box(0.37, 0.02, 0.085), SM(0x1a100c), 0, -0.035, 0, b);
  const hd = mesh(new THREE.TorusGeometry(0.045, 0.009, 6, 14, Math.PI), SM(0x1a100c), 0, -0.02, 0, b); hd.rotation.z = 0;
  [-0.11, 0.11].forEach((x) => mesh(box(0.025, 0.015, 0.088), SM(0xb8a070, { metalness: 0.8, roughness: 0.3 }), x, -0.05, 0, b));
  return b;
}
// o menino sem rosto (uniforme escolar escuro de gola alta, original)
function meninoSemRosto(o = {}) {
  const p = semRosto({ jacket: 0x1c1e28, pants: 0x1c1e28, shirt: 0xf1eee6, collar: "alta", jacketOpen: 0.05, scale: 0.72, tie: 0x1c1e28, seed: 72, dims: { headY: 0.06 }, ...o });
  p.userData.tie.visible = false;
  mesh(sph(0.006, 8, 6), SM(0xc8a050, { metalness: 0.8, roughness: 0.3 }), 0, 0.2, 0.125, p.userData.chest); mesh(sph(0.006, 8, 6), SM(0xc8a050, { metalness: 0.8, roughness: 0.3 }), 0, 0.12, 0.13, p.userData.chest);
  return p;
}
// silhueta (sombra por trás do papel da porta): pessoa toda escura, sem contorno
function silhueta(o = {}) {
  const p = pessoa({ fingers: false, ...o }), m = new THREE.MeshBasicMaterial({ color: 0x120a08, fog: false });
  p.traverse((c) => { if (c.isMesh) { if (c.userData.isOutline) c.visible = false; else { c.material = m; c.castShadow = false; c.receiveShadow = false; } } });
  return p;
}

// ---------------------------------------------------------------- texturas do Japão de bairro (originais, procedurais)
function texAsfalto() {
  if (TX.asf) return TX.asf;
  return (TX.asf = texPair(512, (u, v) => fbm2(u * 40, v * 40, 3, 40) * 0.6 + fbm2(u * 9, v * 9, 3, 9) * 0.4 - (Math.abs(fbm2(u * 5 + 3, v * 5, 4, 5) - 0.5) < 0.012 ? 0.25 : 0),
    (u, v, h) => { const n = fbm2(u * 4, v * 4, 4, 4); const c = mixc([58, 58, 62], [84, 84, 88], n); return mixc(c, [30, 30, 34], clamp((0.42 - h) * 2)); }, 3, { rep: [1, 1] }));
}
function texBloco() { return texBlocks([156, 154, 148], [128, 127, 122]); }
function texTelha() { return texRoof([72, 78, 90], [50, 56, 66]); }
function texSiding(c = "#d9cdb4") {
  const k = "sid" + c; if (TX[k]) return TX[k];
  return (TX[k] = canvasTex(256, 256, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) { g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(0, y, w, 2); g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(0, y + 2, w, 2); }
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${hash(i) > 0.5 ? "90,80,70" : "255,250,240"},${0.03 + hash(i * 3) * 0.05})`; g.beginPath(); g.arc(hash(i * 5) * w, hash(i * 7) * h, 3 + hash(i * 9) * 10, 0, 7); g.fill(); } }));
}
function texPapelParede(c1 = "#cfc4ae", c2 = "#c4b8a0") {
  const k = "pp" + c1 + c2; if (TX[k]) return TX[k];
  return (TX[k] = canvasTex(256, 256, (g, w, h) => { g.fillStyle = c1; g.fillRect(0, 0, w, h); g.fillStyle = c2; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 6, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(hash(i) * w, hash(i * 3) * h, 30, 2); } }));
}
function texAzulejo(c = "#e8eaec", grout = "#9aa2a8", n = 8) {
  const k = "az" + c + n; if (TX[k]) return TX[k];
  return (TX[k] = texPair(256, (u, v) => { const fu = (u * n) % 1, fv = (v * n) % 1; return Math.min(fu, 1 - fu, fv, 1 - fv) < 0.04 ? 0 : 1; },
    (u, v, h) => (h < 0.5 ? hex2rgb(parseInt(grout.slice(1), 16)) : mixc(hex2rgb(parseInt(c.slice(1), 16)), [255, 255, 255], hash2(Math.floor(u * n), Math.floor(v * n)) * 0.2)), 2));
}
function texTatami() {
  if (TX.tat) return TX.tat;
  return (TX.tat = canvasTex(256, 512, (g, w, h) => { g.fillStyle = "#b8b07a"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(${hash(y) > 0.5 ? "90,90,40" : "230,220,160"},.18)`; g.fillRect(0, y, w, 1.5); }
    g.fillStyle = "#2a2a1e"; g.fillRect(0, 0, 12, h); g.fillRect(w - 12, 0, 12, h); }));
}

// ---------------------------------------------------------------- peças da rua residencial (bairro tranquilo, à noite)
// poste de concreto com cruzeta, isoladores e às vezes um transformador; devolve os pontos de fixação dos fios
function posteJP(g, x, z, h = 8.5, o = {}) {
  const p = grp(g, x, 0, z), cm = SM(0x8c8a84, { roughness: 0.9 });
  mesh(cyl(0.11, 0.15, h, 12), cm, 0, h / 2, 0, p);
  const arm = mesh(box(1.7, 0.09, 0.09), SM(0x5a5a5e, { metalness: 0.5, roughness: 0.6 }), 0, h - 0.55, 0, p);
  [-0.75, 0, 0.75].forEach((dx) => mesh(cyl(0.035, 0.045, 0.12, 8), SM(0xd8d4cc, { roughness: 0.4 }), dx, h - 0.45, 0, p));
  if (o.trafo) { mesh(cyl(0.22, 0.22, 0.6, 14), SM(0x7a8088, { metalness: 0.4, roughness: 0.5 }), 0.32, h - 1.6, 0, p); }
  mesh(box(0.06, 0.4, 0.06), SM(0xd8c040), 0, 2.2, 0.12, p); // faixa amarela de aviso
  p.rotation.y = o.rot ?? 0; p.updateMatrixWorld(true);
  return [-0.75, 0, 0.75].map((dx) => p.localToWorld(V3(dx, h - 0.42, 0)).toArray());
}
// fio que verga entre dois pontos
function fio(g, a, b, sag = 0.45, r = 0.012, col = 0x16161a) {
  const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push(V3(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * sag, lerp(a[2], b[2], u))); }
  const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 4), new THREE.MeshBasicMaterial({ color: col }), 0, 0, 0, g); m.castShadow = false; return m;
}
// muro de blocos de concreto com capa no topo
function muroBloco(g, x, z, len, h = 1.5, ang = 0) {
  const w = grp(g, x, 0, z); w.rotation.y = ang; const t = texBloco();
  const m = SM(0xffffff, { map: rep(t.map.clone(), len / 1.6, h / 1.2), normalMap: rep(t.normalMap.clone(), len / 1.6, h / 1.2), roughness: 0.92 }); m.map.needsUpdate = true; m.normalMap.needsUpdate = true;
  mesh(box(len, h, 0.15), m, 0, h / 2, 0, w); mesh(box(len + 0.02, 0.06, 0.2), SM(0x9a9890), 0, h + 0.03, 0, w);
  return w;
}
// casa japonesa de dois andares (telhado de cerâmica, varanda, ar-condicionado, janelas acesas ou apagadas)
function casaJP(g, x, z, o = {}) {
  const c = grp(g, x, 0, z), W_ = o.w ?? 7, D_ = o.d ?? 6, H_ = o.h ?? 5.6; c.rotation.y = o.rot ?? 0;
  const sid = texSiding(o.cor ?? "#d9cdb4"), wallM = SM(0xffffff, { map: rep(sid.clone(), W_ / 2.5, H_ / 2.5), roughness: 0.85 }); wallM.map.needsUpdate = true;
  mesh(box(W_, H_, D_), wallM, 0, H_ / 2, 0, c);
  mesh(box(W_ + 0.06, 0.12, D_ + 0.06), SM(0x6a6460), 0, H_ * 0.5, 0, c); // faixa entre os andares
  // telhado de duas águas em cerâmica escura, com beiral
  const rt = texTelha(), roofM = SM(0xffffff, { map: rep(rt.map.clone(), W_ / 1.8, 2), normalMap: rep(rt.normalMap.clone(), W_ / 1.8, 2), roughness: 0.45, metalness: 0.15 }); roofM.map.needsUpdate = true; roofM.normalMap.needsUpdate = true;
  const rh = o.rh ?? 1.7, half = D_ / 2 + 0.55, sl = Math.hypot(half, rh);
  [-1, 1].forEach((k) => { const r = mesh(box(W_ + 1.0, 0.12, sl), roofM, 0, H_ + rh / 2, k * half / 2, c); r.rotation.x = k * Math.atan2(rh, half); });
  mesh(box(W_ + 1.05, 0.16, 0.22), SM(0x2e3238), 0, H_ + rh + 0.02, 0, c);
  const gab = new THREE.Shape([new THREE.Vector2(-D_ / 2, 0), new THREE.Vector2(D_ / 2, 0), new THREE.Vector2(0, rh)]);
  [-1, 1].forEach((k) => { const gg = mesh(new THREE.ShapeGeometry(gab), wallM, k * W_ / 2 * 0.999, H_, 0, c); gg.rotation.y = k * Math.PI / 2; });
  // janelas: acesas (quente) ou escuras; caixilho de alumínio
  const wins = [];
  (o.janelas ?? [[-1.6, 1.4, 1], [1.6, 1.4, 0], [-1.6, 4.0, 0], [1.6, 4.0, 1]]).forEach(([wx, wy, lit], i) => {
    const fr = mesh(box(1.5, 1.15, 0.08), SM(0xa8acb0, { metalness: 0.6, roughness: 0.35 }), wx, wy, D_ / 2 + 0.02, c);
    const glassM = lit ? new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: o.luzJanela ?? 0xffb860, emissiveIntensity: 1.4 * (lit === true ? 1 : lit), roughness: 0.4 }) : SM(0x1a2230, { roughness: 0.15, metalness: 0.3 });
    const gl = mesh(box(1.32, 0.98, 0.05), glassM, wx, wy, D_ / 2 + 0.06, c);
    mesh(box(0.04, 0.98, 0.07), SM(0xa8acb0, { metalness: 0.6, roughness: 0.35 }), wx, wy, D_ / 2 + 0.07, c);
    if (lit) { const cur = mesh(box(0.5, 0.9, 0.02), new THREE.MeshStandardMaterial({ color: 0xf0d8b0, emissive: 0xffa850, emissiveIntensity: 0.6, roughness: 0.9 }), wx - 0.38, wy, D_ / 2 + 0.085, c); cur.castShadow = false; }
    wins.push({ gl, m: glassM, x: wx, y: wy });
  });
  // varanda do segundo andar com grade
  if (o.varanda !== false) { const vx = o.varandaX ?? 1.6; mesh(box(2.4, 0.08, 0.9), SM(0x8a8480), vx, 3.15, D_ / 2 + 0.45, c); for (let i = 0; i <= 12; i++) mesh(box(0.025, 0.8, 0.025), SM(0x9aa0a6, { metalness: 0.6, roughness: 0.4 }), vx - 1.2 + i * 0.2, 3.58, D_ / 2 + 0.88, c); mesh(box(2.42, 0.04, 0.05), SM(0x9aa0a6, { metalness: 0.6, roughness: 0.4 }), vx, 3.98, D_ / 2 + 0.88, c); }
  // ar-condicionado externo
  const ac = grp(c, o.acX ?? -2.6, 0.35, D_ / 2 + 0.3); mesh(box(0.8, 0.55, 0.28), SM(0xd8d6d0, { roughness: 0.6 }), 0, 0, 0, ac); const fan = mesh(new THREE.CircleGeometry(0.2, 18), SM(0x3a3a3e), 0.12, 0, 0.142, ac); fan.castShadow = false;
  // porta de entrada com luz
  mesh(box(1.0, 2.1, 0.1), SM(0x4a3a2c, { roughness: 0.6 }), o.portaX ?? 0, 1.05, D_ / 2 + 0.03, c);
  return { c, wins, D: D_, W: W_, H: H_ };
}
// máquina de bebidas acesa (fileiras de garrafas genéricas)
const maqTex = canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = "#e8eef4"; g.fillRect(0, 0, w, h);
  const cols = ["#d8342a", "#2a6ad8", "#f0c030", "#38a84a", "#f08a2a", "#8a3ad8", "#2ac8c8", "#e85a8a"];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) { const x = 16 + i * 38, y = 30 + r * 92; g.fillStyle = cols[(r * 3 + i) % cols.length]; g.beginPath(); g.roundRect(x + 6, y + 14, 20, 52, 6); g.fill(); g.fillRect(x + 11, y + 4, 10, 12); g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(x + 9, y + 20, 4, 40);
    g.fillStyle = "#1a1a1a"; g.fillRect(x + 4, y + 72, 26, 10); g.fillStyle = "#4aff6a"; g.fillRect(x + 8, y + 74, 4, 6); }
  g.fillStyle = "#c8ccd0"; g.fillRect(0, 400, w, 112); g.fillStyle = "#2a2a2e"; g.fillRect(40, 440, 176, 40);
});
function maquinaBebidas(g, x, z, ang = 0) {
  const m = grp(g, x, 0, z); m.rotation.y = ang;
  mesh(box(1.0, 1.85, 0.75), SM(0xd8343a, { roughness: 0.5 }), 0, 0.925, 0, m);
  const fr = mesh(new THREE.PlaneGeometry(0.86, 1.64), new THREE.MeshStandardMaterial({ map: maqTex, emissive: 0xffffff, emissiveMap: maqTex, emissiveIntensity: 0.72, roughness: 0.25 }), 0, 0.95, 0.38, m); fr.castShadow = false;
  const L = new THREE.PointLight(0xe8f0ff, 2.1, 7, 1.6); L.position.set(0, 1.0, 0.9); m.add(L);
  const gl = glowSprite(0xdfeaff, 2.0, 0.22); gl.position.set(0, 1.0, 0.5); m.add(gl);
  return { m, L };
}
const coneTex = canvasTex(16, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
// poste de luz da rua (cabeça de LED fria ou lâmpada de sódio quente), com cone de luz
function luzRua(g, x, z, o = {}) {
  const p = grp(g, x, 0, z), h = o.h ?? 5.2, col = o.col ?? 0xdfe6ff; p.rotation.y = o.rot ?? 0;
  mesh(cyl(0.05, 0.07, h, 10), SM(0x6a6c70, { metalness: 0.5, roughness: 0.5 }), 0, h / 2, 0, p);
  const arm = mesh(cyl(0.035, 0.035, 1.1, 8), SM(0x6a6c70, { metalness: 0.5, roughness: 0.5 }), 0, h - 0.05, 0.5, p); arm.rotation.x = Math.PI / 2 - 0.15;
  const head = grp(p, 0, h - 0.12, 1.05); mesh(box(0.42, 0.08, 0.2), SM(0x4a4c50, { metalness: 0.5, roughness: 0.5 }), 0, 0, 0, head);
  const lamp = mesh(box(0.36, 0.02, 0.15), new THREE.MeshBasicMaterial({ color: col }), 0, -0.05, 0, head);
  const L = new THREE.SpotLight(col, o.I ?? 26, 16, 0.85, 0.6, 1.6); L.position.set(0, -0.08, 0); head.add(L); const tg = grp(head, 0, -6, 0.3); L.target = tg;
  const glow = glowSprite(col, 1.6, 0.6); glow.position.set(0, -0.12, 0); head.add(glow);
  const cone = mesh(new THREE.ConeGeometry(1.7, h - 0.3, 32, 1, true), new THREE.MeshBasicMaterial({ color: col, map: coneTex, transparent: true, opacity: 0.11, depthWrite: false, blending: ADD, side: THREE.DoubleSide, fog: false }), 0, -(h - 0.3) / 2 - 0.08, 0, head); cone.castShadow = false;
  return { p, L, glow, lamp, cone, I: o.I ?? 26 };
}
// gato preto sentado no muro (cauda que balança, olhos que brilham e seguem um alvo)
function gato(g, x, y, z, ang = 0) {
  const c = grp(g, x, y, z); c.rotation.y = ang; const m = SM(0x121014, { roughness: 0.7 });
  const body = mesh(sph(1, 14, 10), m, 0, 0.13, 0, c); body.scale.set(0.11, 0.15, 0.13);
  const head = grp(c, 0, 0.32, 0.04); mesh(sph(0.075, 14, 10), m, 0, 0, 0, head);
  [-1, 1].forEach((k) => { const e = mesh(new THREE.ConeGeometry(0.03, 0.06, 4), m, k * 0.045, 0.07, 0, head); e.rotation.z = -k * 0.25; });
  const eyeM = new THREE.MeshBasicMaterial({ color: 0xd8ff6a }); [-1, 1].forEach((k) => mesh(sph(0.012, 8, 6), eyeM, k * 0.028, 0.008, 0.066, head));
  const tail = grp(c, 0, 0.06, -0.11); mesh(lockGeo([[0, 0, 0], [0, -0.04, -0.1], [0.04, -0.12, -0.16], [0.08, -0.22, -0.12]], 0.02, 0.012, 1, 10, 6), m, 0, 0, 0, tail);
  return { c, head, tail };
}
// lua cheia com halo
function lua(g, pos, size = 9) {
  const tex = canvasTex(256, 256, (c, w) => { const r = w / 2; const gr = c.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, "#fffbee"); gr.addColorStop(0.92, "#f2ead6"); gr.addColorStop(1, "rgba(242,234,214,0)"); c.fillStyle = gr; c.beginPath(); c.arc(r, r, r, 0, 7); c.fill();
    for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(160,150,140,${0.12 + hash(i) * 0.12})`; c.beginPath(); c.arc(r + (hash(i * 3) - 0.5) * r * 1.2, r + (hash(i * 5) - 0.5) * r * 1.2, 8 + hash(i * 7) * 30, 0, 7); c.fill(); } });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffffff, fog: false, depthWrite: false })); s.scale.setScalar(size); s.position.set(...pos); g.add(s);
  const h = glowSprite(0xcfdcff, size * 4, 0.35); h.material.fog = false; h.position.set(...pos); g.add(h);
  return s;
}
// texto pintado no asfalto ("止まれ" = pare) e placa triangular de pare (sinalização genérica de rua japonesa)
const tomareTex = canvasTex(512, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "rgba(240,240,236,.92)"; c.font = "700 170px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("止まれ", w / 2, h / 2 + 8); });
function placaPare(g, x, z, ang = 0) {
  const p = grp(g, x, 0, z); p.rotation.y = ang; mesh(cyl(0.035, 0.035, 2.4, 8), SM(0x8a8c90, { metalness: 0.5 }), 0, 1.2, 0, p);
  const tri = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#c8202a"; c.beginPath(); c.moveTo(w / 2, h * 0.92); c.lineTo(w * 0.04, h * 0.1); c.lineTo(w * 0.96, h * 0.1); c.closePath(); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 10; c.stroke(); c.fillStyle = "#fff"; c.font = "700 54px sans-serif"; c.textAlign = "center"; c.fillText("止まれ", w / 2, h * 0.42); });
  const s = mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshStandardMaterial({ map: tri, transparent: true, roughness: 0.5, side: THREE.DoubleSide }), 0, 2.3, 0.04, p); s.castShadow = false;
  return p;
}
