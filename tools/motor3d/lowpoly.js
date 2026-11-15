// ================================================================ personagens low-poly (estilo da animação de referência, GUIA-ANIMACAO-ESTILO.md)
// Facetado (flatShading) e sem contorno. Olhos grandes de anime pintados em decalque (com piscada), nariz de triângulo,
// boca de traço (com expressões), cabelo de espetos facetados. Usa o mesmo esqueleto do motor: pose, idle, gait,
// standFeet e IK continuam funcionando. Os personagens da obra são redesenhados aqui (desenho próprio, nada de arte oficial).
const LPM = {};
function LPmat(color, o = {}) {
  const key = color + JSON.stringify(o); if (LPM[key]) return LPM[key];
  const m = new THREE.MeshStandardMaterial({ color, flatShading: !o.liso, roughness: o.rough ?? 0.8, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide, emissive: o.emis ?? 0x000000, emissiveIntensity: o.ei ?? 0 });
  return (LPM[key] = rimify(m, o.rim ?? 0.9));
}
const corCSS = (hex, dl = 0) => { const c = new THREE.Color(hex); if (dl) c.offsetHSL(0, 0, dl); return "#" + c.getHexString(); };
function decalMat(tex, o = {}) {
  return new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: o.rough ?? 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: o.ei ?? 0.12, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
}
function decal(parent, tex, w, h, x, y, z, ry = 0, rz = 0, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), decalMat(tex, o)); m.position.set(x, y, z); m.rotation.set(0, ry, rz); m.castShadow = false; m.receiveShadow = false; m.userData.isDecal = true; parent.add(m); return m;
}

// ---------------------------------------------------------------- texturas do rosto
const EYT = {};
function olhoTex(iris, o = {}) {
  const k = iris + JSON.stringify(o); if (EYT[k]) return EYT[k];
  return (EYT[k] = canvasTex(256, 192, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.56, rx = w * 0.4, ry = h * 0.34;
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.clip();
    c.fillStyle = o.esclera ?? "#fbf7f2"; c.fillRect(0, 0, w, h);
    const ix = cx + (o.dx ?? 0), irx = w * (o.irisR ?? 0.23), iry = h * 0.36;
    const g = c.createLinearGradient(0, cy - iry, 0, cy + iry); g.addColorStop(0, corCSS(iris, -0.26)); g.addColorStop(0.55, corCSS(iris)); g.addColorStop(1, corCSS(iris, 0.2));
    c.fillStyle = g; c.beginPath(); c.ellipse(ix, cy + h * 0.03, irx, iry, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#120a0c"; c.beginPath();
    if (o.fenda) c.ellipse(ix, cy + h * 0.04, w * 0.032, iry * 0.8, 0, 0, Math.PI * 2); else c.ellipse(ix, cy + h * 0.05, irx * 0.46, iry * 0.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#ffffff"; c.beginPath(); c.ellipse(ix - irx * 0.36, cy - iry * 0.32, irx * 0.27, iry * 0.23, -0.3, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 0.75; c.beginPath(); c.ellipse(ix + irx * 0.4, cy + iry * 0.4, irx * 0.11, iry * 0.1, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    const sh = c.createLinearGradient(0, cy - ry, 0, cy - ry * 0.15); sh.addColorStop(0, "rgba(40,20,30,.5)"); sh.addColorStop(1, "rgba(40,20,30,0)"); c.fillStyle = sh; c.fillRect(0, 0, w, h);
    c.restore();
    c.strokeStyle = o.cilio ?? "#141014"; c.lineCap = "round"; c.lineWidth = h * 0.1;
    c.beginPath(); c.ellipse(cx, cy + h * 0.02, rx * 1.02, ry * 1.08, 0, Math.PI * 1.06, Math.PI * 1.97); c.stroke();
    c.lineWidth = h * 0.028; c.globalAlpha = 0.55; c.beginPath(); c.ellipse(cx, cy - h * 0.02, rx * 0.86, ry * 0.95, 0, Math.PI * 0.22, Math.PI * 0.78); c.stroke(); c.globalAlpha = 1;
  }));
}
const BOCAT = {};
function bocaTex(tipo) {
  if (BOCAT[tipo]) return BOCAT[tipo];
  return (BOCAT[tipo] = canvasTex(256, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.lineCap = "round"; const cx = w / 2, cy = h / 2;
    if (tipo === "linha") { c.strokeStyle = "#5a2626"; c.lineWidth = 12; c.beginPath(); c.moveTo(cx - 32, cy); c.quadraticCurveTo(cx, cy + 3, cx + 32, cy); c.stroke(); }
    else if (tipo === "sorriso") { c.strokeStyle = "#5a2626"; c.lineWidth = 12; c.beginPath(); c.moveTo(cx - 38, cy - 8); c.quadraticCurveTo(cx, cy + 16, cx + 38, cy - 8); c.stroke(); }
    else if (tipo === "triste") { c.strokeStyle = "#5a2626"; c.lineWidth = 8; c.beginPath(); c.moveTo(cx - 28, cy + 6); c.quadraticCurveTo(cx, cy - 8, cx + 28, cy + 6); c.stroke(); }
    else if (tipo === "aberta") { c.fillStyle = "#4a1418"; c.beginPath(); c.ellipse(cx, cy + 4, 28, 22, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#c8586a"; c.beginPath(); c.ellipse(cx, cy + 16, 17, 8, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#f4f0ea"; c.fillRect(cx - 18, cy - 15, 36, 7); }
    else if (tipo === "risada") { // sorriso enorme com dentes (Sukuna)
      const L = cx - 96, R = cx + 96, Y = cy - 22;
      c.fillStyle = "#3a0c10"; c.beginPath(); c.moveTo(L, Y); c.quadraticCurveTo(cx, cy + 56, R, Y); c.quadraticCurveTo(cx, cy + 2, L, Y); c.fill();
      c.save(); c.clip(); c.fillStyle = "#f6f2ea"; for (let i = 0; i < 12; i++) c.fillRect(cx - 88 + i * 15, cy - 22, 12, 15); for (let i = 0; i < 10; i++) c.fillRect(cx - 72 + i * 15, cy + 14, 12, 14); c.restore();
      c.strokeStyle = "#1a0608"; c.lineWidth = 5; c.beginPath(); c.moveTo(L, Y); c.quadraticCurveTo(cx, cy + 56, R, Y); c.stroke(); c.beginPath(); c.moveTo(L, Y); c.quadraticCurveTo(cx, cy + 2, R, Y); c.stroke();
    }
  }));
}
const narizTex = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "rgba(150,80,60,.85)"; c.beginPath(); c.moveTo(w * 0.5, h * 0.15); c.lineTo(w * 0.78, h * 0.85); c.lineTo(w * 0.32, h * 0.85); c.closePath(); c.fill(); });
// marcas do Sukuna: o segundo par de olhos, as listras das bochechas e a marca da testa
const olhoExtraTex = canvasTex(256, 96, (c, w, h) => { c.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2; c.fillStyle = "#140a0c"; c.beginPath(); c.moveTo(cx - 116, cy + 4); c.quadraticCurveTo(cx, cy - 44, cx + 116, cy - 6); c.quadraticCurveTo(cx, cy + 40, cx - 116, cy + 4); c.fill();
  c.fillStyle = "#d8202c"; c.beginPath(); c.ellipse(cx, cy, 28, 20, 0, 0, 7); c.fill(); c.fillStyle = "#2a0606"; c.beginPath(); c.ellipse(cx, cy, 9, 18, 0, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(cx - 9, cy - 7, 5, 0, 7); c.fill(); });
const bochechaTex = canvasTex(256, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#16090c"; [[30, 34], [44, 74]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(w - 26, y - 14); c.lineTo(w - 32, y - 2); c.lineTo(x + 6, y + 12); c.closePath(); c.fill(); }); });
const testaTex = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#16090c"; c.beginPath(); c.moveTo(14, 20); c.lineTo(w / 2 - 22, 22); c.lineTo(w / 2, 58); c.lineTo(w / 2 + 22, 22); c.lineTo(w - 14, 20); c.lineTo(w - 14, 30); c.lineTo(w / 2 + 16, 32); c.lineTo(w / 2, 48); c.lineTo(w / 2 - 16, 32); c.lineTo(14, 30); c.closePath(); c.fill(); });

// ---------------------------------------------------------------- cabeça e cabelo
function headGeoLP(o = {}) {
  const g = new THREE.SphereGeometry(1, o.ws ?? 36, o.hs ?? 26);
  const jaw = o.jaw ?? 0.38, chin = o.chin ?? 0.08;
  deform(g, (v) => { if (v.y < 0) { const k = Math.pow(-v.y, 1.3); v.x *= 1 - jaw * k; v.z += chin * k * Math.max(0, v.z); } if (v.z < 0) v.z *= 1.05; });
  g.scale(o.sx ?? 0.083, o.sy ?? 0.1, o.sz ?? 0.095); g.translate(0, o.cy ?? 0.11, 0); g.computeVertexNormals(); return g;
}
function espeto(parent, base, dir, len, r, mat) {
  const geo = new THREE.ConeGeometry(r, len, 4, 1); geo.translate(0, len / 2, 0);
  const m = mesh(geo, mat, base.x, base.y, base.z, parent);
  m.quaternion.setFromUnitVectors(V3_(0, 1, 0), dir); m.rotateY(hash(base.x * 97.1 + base.z * 31.7) * 3);
  return m;
}
function estiloDir(estilo, nrm, r) {
  const v = nrm.clone();
  if (estilo === "pracima") v.add(V3_(0, 1.0, -0.2));                       // Gojo: tudo pra cima
  else if (estilo === "pratras") v.multiplyScalar(0.35).add(V3_(0, 0.5, -1)); // Sukuna: penteado pra trás
  else if (estilo === "ourico") v.add(V3_(0, 0.3, 0));                       // Megumi: espetado pra todo lado
  else v.add(V3_(0, 0.25, -0.4));                                             // Yuji: curto, espetado pra fora e pra trás
  v.x += (r - 0.5) * 0.45; v.z += (hash(r * 7.3) - 0.5) * 0.3;
  return v.normalize();
}
function cabeloLP(head, o) {
  const ax = 0.086, ay = 0.108, az = 0.099, cy = 0.11, seed = o.seed ?? 0;
  const hg = grp(head, 0, cy, 0), hr = grp(hg, 0, -cy, 0); head.userData.hairG = hg; head.userData.hairLong = false;
  const m = LPmat(o.cor, { rim: 1.2 }), m2 = o.raiz != null ? LPmat(o.raiz, { rim: 1 }) : m;
  const capG = new THREE.SphereGeometry(1, 12, 7, 0, Math.PI * 2, 0, Math.PI * (o.capA ?? 0.44)); capG.scale(ax, ay, az);
  const capM = mesh(capG, m, 0, cy, -0.003, hr); capM.rotation.x = o.capTilt ?? -0.4;
  const P = (th, ph, k = 1) => V3_(Math.sin(th) * Math.sin(ph) * ax * k, cy + Math.cos(th) * ay * k, Math.sin(th) * Math.cos(ph) * az * k);
  const n = o.n ?? 40, thMin = o.thMin ?? 0.06, thMax = o.thMax ?? 0.44;
  for (let i = 0; i < n; i++) {
    const r1 = hash(i * 3.7 + seed), r2 = hash(i * 5.3 + seed), r3 = hash(i * 9.1 + seed);
    const ph = (i / n) * Math.PI * 2 * 2.618 + (r1 - 0.5) * 0.5, front = Math.cos(ph) > 0.45;
    const th = (thMin + r2 * (thMax - thMin) * (front ? o.frontK ?? 0.55 : 1)) * Math.PI;
    const base = P(th, ph, 0.96), nrm = base.clone().sub(V3_(0, cy, 0)).normalize();
    const len = (o.len ?? 0.07) * (0.7 + r3 * 0.6), rad = (o.r ?? 0.03) * (0.75 + r1 * 0.5);
    espeto(hr, base, estiloDir(o.estilo, nrm, r3), len, rad, o.raiz != null && th > 0.33 * Math.PI && !front ? m2 : m);
  }
  (o.franja || []).forEach(([ph, len, lado]) => { const base = P(0.27 * Math.PI, ph, 0.98); espeto(hr, base, V3_(Math.sin(ph) * 0.6 + lado, -1, 0.5).normalize(), len, o.rFranja ?? 0.026, m); });
  return hg;
}

// ---------------------------------------------------------------- corpo
function perfilR(pts, y) { for (let i = 0; i < pts.length - 1; i++) if (y <= pts[i + 1][1]) return lerp(pts[i][0], pts[i + 1][0], (y - pts[i][1]) / (pts[i + 1][1] - pts[i][1])); return pts[pts.length - 1][0]; }
function pessoaLP(o = {}) {
  const P = { pele: 0xf2c8a6, olho: "#3a5a6a", roupa: 0x1b2232, calca: 0x1b2232, sapato: 0x141418, sola: 0xe4e0d8, botao: 0xd4aa50, seed: 1, scale: 1, ...o };
  const S = skeleton({ ...HUMANO, ...(o.dims || {}) });
  const skin = LPmat(P.pele, { rim: 0.5, liso: true }), roupa = LPmat(P.roupa, { rim: 1 }), roupa2 = LPmat(P.roupa, { rim: 1, side: THREE.DoubleSide }), calca = LPmat(P.calca), sapato = LPmat(P.sapato, { rough: 0.5 }), botao = LPmat(P.botao, { metal: 0.6, rough: 0.35, rim: 0.4 });
  const R = 12;
  // quadril, pernas e tênis
  mesh(sph(1, R, 6), calca, 0, -0.01, 0, S.hips).scale.set(0.15, 0.11, 0.11);
  S.hipJ.forEach((hj, i) => {
    mesh(lathe([[0.001, -0.45], [0.058, -0.44], [0.066, -0.3], [0.078, -0.1], [0.082, 0.0], [0.062, 0.05], [0.001, 0.065]], R), calca, 0, 0, 0, hj);
    mesh(sph(0.058, R, 6), calca, 0, 0, 0.004, S.knee[i]);
    mesh(lathe([[0.001, -0.44], [0.054, -0.42], [0.058, -0.26], [0.062, -0.1], [0.06, 0.0], [0.001, 0.03]], R), calca, 0, 0, 0, S.knee[i]);
    mesh(box(0.1, 0.075, 0.23), sapato, 0, -0.03, 0.05, S.ankle[i]);
    mesh(box(0.104, 0.022, 0.236), LPmat(P.sola), 0, -0.07, 0.05, S.ankle[i]);
  });
  // tronco: casaco fechado de gola alta (uniforme), barra até o quadril, botões
  const abdP = [[0.001, -0.06], [0.136, -0.06], [0.14, 0.05], [0.136, 0.13], [0.14, 0.21], [0.001, 0.21]];
  const abd = mesh(lathe(abdP, R + 1), roupa, 0, 0, 0, S.spine); abd.scale.z = 0.76;
  const chP = [[0.001, -0.02], [0.138, -0.02], [0.16, 0.06], [0.176, 0.15], [0.174, 0.22], [0.148, 0.27], [0.086, 0.305], [0.001, 0.31]];
  const ch = mesh(lathe(chP, R + 1), roupa, 0, 0, 0, S.chest); ch.scale.z = 0.72;
  const hem = mesh(lathe([[0.152, 0.07], [0.16, -0.03], [0.172, -0.13]], R + 1), roupa2, 0, 0, 0, S.hips); hem.scale.z = 0.84;
  const gola = mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.09, R + 1, 1, true, 0.3, Math.PI * 2 - 0.6), roupa2, 0, 0.34, -0.004, S.chest); gola.scale.z = 0.92;
  [0.07, 0.15, 0.23].forEach((y) => { const b = mesh(cyl(0.012, 0.012, 0.006, 8), botao, 0, y, perfilR(chP.map(([r, yy]) => [r, yy]).slice(1), y) * 0.72 + 0.002, S.chest); b.rotation.x = Math.PI / 2; });
  [0.04, 0.13].forEach((y) => { const b = mesh(cyl(0.012, 0.012, 0.006, 8), botao, 0, y, 0.137 * 0.76 + 0.002, S.spine); b.rotation.x = Math.PI / 2; });
  if (P.capuz != null) { // capuz vermelho do moletom por baixo do casaco (Yuji)
    const cm = LPmat(P.capuz, { rim: 0.9, side: THREE.DoubleSide });
    const cp = mesh(new THREE.SphereGeometry(1, 9, 6, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.5), cm, 0, 0.3, -0.1, S.chest); cp.scale.set(0.12, 0.11, 0.075); cp.rotation.x = -0.35;
    const an = mesh(new THREE.TorusGeometry(0.074, 0.016, 5, 12), cm, 0, 0.318, -0.004, S.chest); an.rotation.x = Math.PI / 2; an.scale.set(1, 0.92, 1);
  }
  // braços e mãos
  const hands = S.sh.map((sh, i) => {
    mesh(sph(0.06, R, 6), roupa, 0, -0.012, 0, sh);
    mesh(lathe([[0.001, -0.3], [0.048, -0.29], [0.052, -0.2], [0.056, -0.08], [0.06, 0.0], [0.042, 0.04], [0.001, 0.05]], R), roupa, 0, 0, 0, sh);
    mesh(sph(0.046, R, 6), roupa, 0, 0, 0, S.el[i]);
    mesh(lathe([[0.001, -0.235], [0.046, -0.228], [0.047, -0.15], [0.048, -0.05], [0.049, 0.0], [0.001, 0.03]], R), roupa, 0, 0, 0, S.el[i]);
    mesh(cyl(0.051, 0.051, 0.028, R), roupa, 0, -0.222, 0, S.el[i]);
    return hand(S.wr[i], i ? 1 : -1, skin, 1, true);
  });
  // pescoço, cabeça, orelhas
  mesh(cyl(0.042, 0.048, 0.1, R), skin, 0, 0.03, 0, S.neck);
  const headM = mesh(headGeoLP(P.cabeca || {}), skin, 0, 0, 0);
  const zAt = (x, y) => surfZ(headM, x, y);
  [-1, 1].forEach((k) => { const ea = mesh(sph(1, 6, 5), skin, k * 0.079, 0.104, -0.006); ea.scale.set(0.013, 0.026, 0.018); S.head.add(ea); });
  // rosto: olhos (decalque), sobrancelhas, nariz, bocas
  const EX = 0.035, EY = 0.1;
  const olhos = P.venda ? [] : [-1, 1].map((k) => { const g = grp(S.head, k * EX, EY, zAt(k * EX, EY) + 0.003); g.rotation.set(0, k * 0.34, k * (P.olhoInc ?? 0)); decal(g, olhoTex(P.olho, { fenda: P.fenda }), 0.055, 0.041 * (P.olhoAlt ?? 1), 0, 0, 0); return g; });
  const brows = [-1, 1].map((k) => { const y = EY + 0.035, rz0 = k * -0.1; const b = mesh(box(0.034, 0.0075, 0.006), LPmat(P.sobrancelha ?? (P.cabelo ? P.cabelo.cor : 0x222222)), k * EX, y, zAt(k * EX, y) + 0.002); b.rotation.set(0, k * 0.32, rz0); b.userData = { y0: y, rz0 }; S.head.add(b); b.visible = !P.venda; return b; });
  decal(S.head, narizTex, 0.016, 0.018, 0, 0.076, zAt(0, 0.076) + 0.004);
  const MY = 0.052, mz = zAt(0, MY) + 0.003;
  const bocas = {};
  ["linha", "sorriso", "triste", "aberta"].forEach((t) => (bocas[t] = decal(S.head, bocaTex(t), 0.058, 0.029, 0, MY, mz)));
  bocas.risada = decal(S.head, bocaTex("risada"), 0.086, 0.043, 0, MY - 0.002, mz + 0.001);
  let extras = null;
  if (P.sukuna) { // marcas do Sukuna
    extras = [-1, 1].map((k) => { const y = EY - 0.03, g = grp(S.head, k * 0.036, y, zAt(k * 0.036, y) + 0.003); g.rotation.set(0, k * 0.4, k * 0.12); decal(g, olhoExtraTex, 0.034, 0.013, 0, 0, 0); return g; });
    [-1, 1].forEach((k) => { const g = grp(S.head, k * 0.057, 0.064, zAt(k * 0.057, 0.064) + 0.004); g.rotation.set(0, k * 0.62, 0); g.scale.x = k; decal(g, bochechaTex, 0.04, 0.02, 0, 0, 0); });
    decal(S.head, testaTex, 0.07, 0.017, 0, EY + 0.052, zAt(0, EY + 0.052) + 0.004);
  }
  S.head.add(headM);
  if (P.venda) { const v = mesh(new THREE.CylinderGeometry(1, 1, 0.046, 18, 1, true), LPmat(0x121216, { side: THREE.DoubleSide, rim: 0.6 }), 0, EY + 0.004, 0, S.head); v.scale.set(0.088, 1, 0.103); }
  if (P.cabelo) cabeloLP(S.head, P.cabelo);
  S.head.scale.setScalar(P.cabecaEscala ?? 1.12); // cabeça um pouco maior (proporção de anime)
  S.root.scale.setScalar(P.scale);
  shadows(S.root);
  S.root.traverse((c) => { if (c.userData && c.userData.isDecal) { c.castShadow = false; c.receiveShadow = false; } });
  S.root.userData = { ...S, eyes: null, brows: null, mouth: null, hands, P, headM, kind: "lp", tails: [], scarfTails: [], lp: { olhos, brows, bocas, extras } };
  restPose(S.root);
  return S.root;
}
// expressões: piscada automática, sobrancelhas (bravo/triste/sobe), boca (linha, sorriso, triste, aberta, risada), fala (boca abrindo)
function rostoLP(p, t, f = {}) {
  const u = p.userData, L = u.lp; if (!L) return;
  const per = f.piscaCada ?? 3.4, ph = (t + hash(u.P.seed) * 5) % per, bl = ph < 0.15 ? Math.sin((ph / 0.15) * Math.PI) : 0;
  const ab = clamp((f.palpebra ?? 1) * (1 - bl), 0.06, 1);
  L.olhos.forEach((g) => (g.scale.y = ab));
  if (L.extras) L.extras.forEach((g) => (g.scale.y = clamp((f.extras ?? 1) * (1 - bl), 0.06, 1)));
  L.brows.forEach((b, i) => { const k = i ? 1 : -1; b.rotation.z = b.userData.rz0 + k * ((f.bravo ?? 0) * 0.45 - (f.triste ?? 0) * 0.4); b.position.y = b.userData.y0 + (f.sobe ?? 0) * 0.007 - (f.bravo ?? 0) * 0.004; });
  let tipo = f.boca ?? "linha";
  if (f.fala) { const a = Math.abs(Math.sin(t * 12.5)) * f.fala; if (a > 0.4) tipo = "aberta"; L.bocas.aberta.scale.y = 0.6 + a * 0.5; }
  for (const k in L.bocas) L.bocas[k].visible = k === tipo;
}

// ---------------------------------------------------------------- elenco: Jujutsu Kaisen (desenho próprio low-poly)
const JJK = { navy: 0x232b3e, navy2: 0x181e2c, botao: 0xd4aa50 };
function yujiLP(o = {}) { return pessoaLP({ seed: 11, pele: 0xf3c8a6, olho: "#a8642e", capuz: 0xb3262c, roupa: JJK.navy, calca: JJK.navy, sobrancelha: 0x6a3a40, cabelo: { cor: 0xe8909c, raiz: 0x5a2c34, estilo: "curto", n: 60, len: 0.042, r: 0.028, thMax: 0.5, franja: [[-0.24, 0.058, -0.12], [0.24, 0.058, 0.12]], seed: 3 }, ...o }); }
function sukunaYujiLP(o = {}) { return yujiLP({ seed: 12, olho: "#c41e2a", olhoAlt: 0.85, olhoInc: 0.08, sukuna: true, cabelo: { cor: 0xe8909c, raiz: 0x5a2c34, estilo: "pratras", n: 44, len: 0.075, r: 0.03, capTilt: -0.55, seed: 4 }, ...o }); }
function megumiLP(o = {}) { return pessoaLP({ seed: 21, pele: 0xf1c6a4, olho: "#2f5a66", olhoAlt: 0.86, roupa: JJK.navy, calca: JJK.navy, sobrancelha: 0x101216, cabelo: { cor: 0x101216, estilo: "ourico", n: 52, len: 0.085, r: 0.032, thMax: 0.5, franja: [[-0.18, 0.07, -0.22], [0.08, 0.064, 0.12], [0.34, 0.056, 0.3]], seed: 7 }, ...o }); }
function sukunaMegumiLP(o = {}) { return megumiLP({ seed: 22, olho: "#c41e2a", olhoInc: 0.08, sukuna: true, ...o }); }
function gojoLP(o = {}) { return pessoaLP({ seed: 31, pele: 0xf4d0b4, venda: true, roupa: JJK.navy2, calca: JJK.navy2, scale: 1.08, cabelo: { cor: 0xf0f2f6, estilo: "pracima", n: 54, len: 0.09, r: 0.03, franja: [[-0.22, 0.07, -0.25], [0.0, 0.074, 0], [0.24, 0.068, 0.25]], seed: 9 }, ...o }); }
