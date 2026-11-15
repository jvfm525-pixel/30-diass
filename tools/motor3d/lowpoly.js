// ================================================================ personagens low-poly v3 (estilo da animação de referência, GUIA-ANIMACAO-ESTILO.md)
// Calibrado reconstruindo um personagem da própria animação e comparando lado a lado.
// Rosto:
//   - cabeça de poucos polígonos com sombreado suave e quinas marcadas (normais com vinco) e frente quase plana;
//   - olhos largos e baixos: pálpebra de cima grossa cobrindo o alto da íris, íris grande com contorno escuro;
//   - sobrancelhas grossas, nariz de triângulo em dois tons, boca pequena vermelho-escura, blush nos mais novos.
// Cabelo: lâminas largas e finas (franja até as sobrancelhas, laterais cobrindo as orelhas, volume no topo).
// Usa o mesmo esqueleto do motor: pose, idle, gait, standFeet e IK continuam funcionando.
const LPM = {};
function LPmat(color, o = {}) {
  const key = color + JSON.stringify(o); if (LPM[key]) return LPM[key];
  const m = new THREE.MeshStandardMaterial({ color, flatShading: !o.liso, roughness: o.rough ?? 0.8, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide, emissive: o.emis ?? 0x000000, emissiveIntensity: o.ei ?? 0 });
  return (LPM[key] = rimify(m, o.rim ?? 0.9));
}
const corCSS = (hex, dl = 0) => { const c = new THREE.Color(hex); if (dl) c.offsetHSL(0, 0, dl); return "#" + c.getHexString(); };
function decalMat(tex, o = {}) {
  if (o.basico) return new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, color: o.cor ?? 0xffffff, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  if (o.suave) return new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  return new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: o.rough ?? 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: o.ei ?? 0.1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
}
const ESP = new Map();
function espelho(tex) { if (ESP.has(tex)) return ESP.get(tex); const t = tex.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; t.needsUpdate = true; ESP.set(tex, t); return t; }
function decal(parent, tex, w, h, x, y, z, ry = 0, rz = 0, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), decalMat(o.espelho ? espelho(tex) : tex, o)); m.position.set(x, y, z); m.rotation.set(0, ry, rz);
  m.castShadow = false; m.receiveShadow = false; m.userData.isDecal = true; m.renderOrder = o.suave ? 3 : 2; parent.add(m); return m;
}
// normais com vinco: suaves entre faces parecidas, quebradas nas quinas (o "low-poly liso" da referência)
function vincoNormais(geo, ang = 0.6) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(), pos = g.attributes.position, n = pos.count, fn = [], mapa = new Map();
  const chave = (i) => `${pos.getX(i).toFixed(5)},${pos.getY(i).toFixed(5)},${pos.getZ(i).toFixed(5)}`;
  const a = V3_(), b = V3_(), c = V3_();
  for (let f = 0; f < n; f += 3) {
    a.fromBufferAttribute(pos, f); b.fromBufferAttribute(pos, f + 1); c.fromBufferAttribute(pos, f + 2);
    fn.push(V3_().subVectors(c, b).cross(V3_().subVectors(a, b)).normalize());
    for (let k = 0; k < 3; k++) { const kk = chave(f + k); if (!mapa.has(kk)) mapa.set(kk, []); mapa.get(kk).push(f / 3); }
  }
  const cs = Math.cos(ang), nor = new Float32Array(n * 3), acc = V3_();
  for (let i = 0; i < n; i++) {
    const me = fn[Math.floor(i / 3)]; acc.set(0, 0, 0);
    for (const fj of mapa.get(chave(i))) if (fn[fj].dot(me) >= cs) acc.add(fn[fj]);
    if (acc.lengthSq() < 1e-10) acc.copy(me.lengthSq() > 0 ? me : V3_(0, 1, 0)); acc.normalize();
    nor[i * 3] = acc.x; nor[i * 3 + 1] = acc.y; nor[i * 3 + 2] = acc.z;
  }
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  return g;
}

// ---------------------------------------------------------------- texturas do rosto
const EYT = {};
// olho largo e baixo: pálpebra de cima grossa e quase reta cobrindo o alto da íris; íris grande com contorno escuro
function olhoTex(iris, o = {}) {
  const k = iris + JSON.stringify(o); if (EYT[k]) return EYT[k];
  return (EYT[k] = canvasTex(256, 160, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const al = o.alt ?? 1, mid = 84, L = 24, R = 232, T = mid - 58 * al, B = mid + 52 * al;
    const cima = () => { c.moveTo(L, mid + 8); c.bezierCurveTo(L + 26, T - 2, R - 58, T - 8, R, mid - 14); };
    const baixo = () => { c.bezierCurveTo(R - 26, B + 2, L + 40, B + 6, L, mid + 8); };
    c.save(); c.beginPath(); cima(); baixo(); c.closePath(); c.clip();
    c.fillStyle = o.esclera ?? "#f3f0ec"; c.fillRect(0, 0, w, h);
    const ix = w / 2 + 2 + (o.dx ?? 0), iy = mid + 8, ir = 50 * Math.min(1.1, Math.max(0.8, al));
    const g = c.createRadialGradient(ix, iy + ir * 0.3, ir * 0.1, ix, iy, ir); g.addColorStop(0, corCSS(iris, 0.18)); g.addColorStop(0.65, corCSS(iris)); g.addColorStop(1, corCSS(iris, -0.2));
    c.fillStyle = g; c.beginPath(); c.arc(ix, iy, ir, 0, Math.PI * 2); c.fill();
    c.strokeStyle = corCSS(iris, -0.34); c.lineWidth = 6; c.beginPath(); c.arc(ix, iy, ir - 3, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "#0e0a0c"; c.beginPath(); if (o.fenda) c.ellipse(ix, iy, ir * 0.15, ir * 0.62, 0, 0, Math.PI * 2); else c.arc(ix, iy, ir * 0.42, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffffff"; c.beginPath(); c.ellipse(ix - ir * 0.32, iy - ir * 0.3, ir * 0.3, ir * 0.27, -0.4, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 0.85; c.beginPath(); c.arc(ix + ir * 0.36, iy + ir * 0.34, ir * 0.12, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    const sh = c.createLinearGradient(0, T, 0, T + 34); sh.addColorStop(0, "rgba(60,40,40,.5)"); sh.addColorStop(1, "rgba(60,40,40,0)"); c.fillStyle = sh; c.fillRect(0, 0, w, h);
    c.restore();
    c.strokeStyle = o.cilio ?? "#1a1414"; c.lineCap = "round"; c.lineJoin = "round";
    c.lineWidth = 13; c.beginPath(); cima(); c.lineTo(R + 12, mid - 22); c.stroke();
    c.lineWidth = 4; c.globalAlpha = 0.4; c.beginPath(); c.moveTo(R - 4, mid - 10); c.bezierCurveTo(R - 26, B + 2, L + 40, B + 6, L + 8, mid + 10); c.stroke(); c.globalAlpha = 1;
  }));
}
const olhoFechadoTex = canvasTex(256, 160, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "#1a1414"; c.lineCap = "round"; c.lineWidth = 11; c.beginPath(); c.moveTo(24, 82); c.quadraticCurveTo(128, 118, 234, 76); c.stroke(); c.lineWidth = 6; [[74, 100], [114, 106], [154, 104], [194, 94]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 7, y + 14); c.stroke(); }); });
const sobrancelhaTex = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(10, 42); c.bezierCurveTo(60, 10, 170, 4, 246, 22); c.lineTo(244, 44); c.bezierCurveTo(170, 28, 70, 34, 16, 62); c.closePath(); c.fill(); });
const BOCAT = {};
function bocaTex(tipo) {
  if (BOCAT[tipo]) return BOCAT[tipo];
  return (BOCAT[tipo] = canvasTex(256, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.lineCap = "round"; c.lineJoin = "round"; const cx = w / 2, cy = h / 2, cor = "#7a2a26";
    if (tipo === "linha") { c.fillStyle = cor; c.beginPath(); c.roundRect(cx - 44, cy - 8, 88, 16, 6); c.fill(); }
    else if (tipo === "sorriso") { c.strokeStyle = cor; c.lineWidth = 15; c.beginPath(); c.moveTo(cx - 50, cy - 8); c.quadraticCurveTo(cx, cy + 14, cx + 50, cy - 8); c.stroke(); }
    else if (tipo === "triste") { c.strokeStyle = cor; c.lineWidth = 13; c.beginPath(); c.moveTo(cx - 46, cy + 6); c.lineTo(cx - 22, cy - 6); c.lineTo(cx, cy + 2); c.lineTo(cx + 22, cy - 6); c.lineTo(cx + 46, cy + 6); c.stroke(); }
    else if (tipo === "aberta") { c.fillStyle = "#5a1014"; c.beginPath(); c.ellipse(cx, cy, 26, 20, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#a83a3e"; c.beginPath(); c.ellipse(cx, cy + 9, 16, 8, 0, 0, Math.PI * 2); c.fill(); }
    else if (tipo === "risada") { // sorriso de canto a canto do Sukuna, fino, com a fileira de dentes
      c.fillStyle = "#2a0a0e"; c.beginPath(); c.moveTo(cx - 96, cy - 14); c.quadraticCurveTo(cx, cy + 34, cx + 96, cy - 14); c.quadraticCurveTo(cx, cy + 6, cx - 96, cy - 14); c.fill();
      c.save(); c.clip(); c.fillStyle = "#f4efe6"; for (let i = 0; i < 13; i++) c.fillRect(cx - 90 + i * 14, cy - 12, 11, 14); c.restore();
    }
  }));
}
const NARIZT = {};
function narizTex(pele) { // só a sombrinha escura em triângulo (um lado do nariz)
  const k = pele; if (NARIZT[k]) return NARIZT[k];
  return (NARIZT[k] = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "rgba(120,70,60,.55)"; c.beginPath(); c.moveTo(w * 0.48, h * 0.06); c.lineTo(w * 0.8, h * 0.94); c.lineTo(w * 0.3, h * 0.94); c.closePath(); c.fill(); }));
}
const blushTex = canvasTex(128, 64, (c, w, h) => { c.clearRect(0, 0, w, h); const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, "rgba(240,120,120,.55)"); g.addColorStop(1, "rgba(240,120,120,0)"); c.fillStyle = g; c.beginPath(); c.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); c.fill(); });
// marcas do Sukuna: o segundo par de olhos, as listras das bochechas e a marca da testa
const olhoExtraTex = canvasTex(256, 96, (c, w, h) => { c.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2; c.fillStyle = "#140a0c"; c.beginPath(); c.moveTo(cx - 116, cy + 4); c.quadraticCurveTo(cx, cy - 44, cx + 116, cy - 6); c.quadraticCurveTo(cx, cy + 40, cx - 116, cy + 4); c.fill();
  c.fillStyle = "#d8202c"; c.beginPath(); c.ellipse(cx, cy, 28, 20, 0, 0, 7); c.fill(); c.fillStyle = "#2a0606"; c.beginPath(); c.ellipse(cx, cy, 9, 18, 0, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(cx - 9, cy - 7, 5, 0, 7); c.fill(); });
const bochechaTex = canvasTex(256, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#16090c"; [[30, 34], [44, 74]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(w - 26, y - 14); c.lineTo(w - 32, y - 2); c.lineTo(x + 6, y + 12); c.closePath(); c.fill(); }); });
const testaTex = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#16090c"; c.beginPath(); c.moveTo(14, 20); c.lineTo(w / 2 - 22, 22); c.lineTo(w / 2, 58); c.lineTo(w / 2 + 22, 22); c.lineTo(w - 14, 20); c.lineTo(w - 14, 30); c.lineTo(w / 2 + 16, 32); c.lineTo(w / 2, 48); c.lineTo(w / 2 - 16, 32); c.lineTo(14, 30); c.closePath(); c.fill(); });

// ---------------------------------------------------------------- cabeça
// quadrado arredondado (superelipsoide) com a frente quase plana; afina numa mandíbula comprida e queixo arredondado
const HEAD = { a: 0.084, b: 0.103, c: 0.088, n: 2.6, cy: 0.11, frente: 0.86, jawY: -0.16, jaw: 0.5 };
function superDir(d, n) { const s_ = Math.pow(Math.pow(Math.abs(d.x), n) + Math.pow(Math.abs(d.y), n) + Math.pow(Math.abs(d.z), n), -1 / n); return d.multiplyScalar(s_); }
function headUnit(v, H = HEAD) {
  superDir(v.normalize(), H.n);
  if (v.z > H.frente) v.z = H.frente;
  if (v.y < H.jawY) { const k = sm(clamp((H.jawY - v.y) / (1 + H.jawY))); v.x *= 1 - H.jaw * k; v.z *= v.z < 0 ? 1 - 0.35 * k : 1 - 0.1 * k; }
  if (v.z < 0) v.z *= 1.05;
  return v;
}
function headGeoLP(o = {}) {
  const H = { ...HEAD, ...o }, g = new THREE.SphereGeometry(1, o.ws ?? 12, o.hs ?? 11);
  deform(g, (v) => { headUnit(v, H); v.set(v.x * H.a, H.cy + v.y * H.b, v.z * H.c); });
  return vincoNormais(g, 0.72);
}

// ---------------------------------------------------------------- cabelo
// mecha: tufo largo que afina até a ponta. Eixo Y = comprimento, X = largura, Z = espessura (aponta pra fora da cabeça).
// esp = espessura total em relação à largura (0.16 = lâmina fina, 0.5 = tufo grosso); curva > 0 levanta a ponta, < 0 deita sobre a cabeça.
function laminaGeo(L, W, curva = -0.2, seg = 5, esp = 0.32) {
  const pos = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg, w = W * Math.pow(1 - u, 0.85), y = L * u, z = curva * L * u * u, t = W * esp * 0.5 * (1 - u) + 0.0012;
    pos.push(-w / 2, y, z, 0, y, z + t, w / 2, y, z, 0, y, z - t);
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < 4; j++) { const a = i * 4 + j, b = i * 4 + ((j + 1) % 4), c = a + 4, d = b + 4; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const _mb = new THREE.Matrix4();
function lamina(parent, base, dir, radial, L, W, mat, curva, esp, giro = 0) {
  const y = dir.clone().normalize(), z = radial.clone().addScaledVector(y, -radial.dot(y)); if (z.lengthSq() < 1e-6) z.set(0, 0, 1); z.normalize();
  if (giro) z.applyAxisAngle(y, giro);
  const x = V3_().crossVectors(y, z).normalize();
  const m = mesh(laminaGeo(L, W, curva, 5, esp), mat, base.x, base.y, base.z, parent); m.quaternion.setFromRotationMatrix(_mb.makeBasis(x, y, z)); m.castShadow = true;
  return m;
}
// capacete de cabelo: a superfície da cabeça inflada (mais no topo), com a borda em zigue-zague:
// franja até as sobrancelhas, laterais cobrindo as orelhas, nuca. As pontas viram as mechas da borda.
function bordaCabelo(o, ph) { const f = Math.cos(ph); return f > 0 ? lerp(o.bordaLado ?? 0.62, o.bordaFrente ?? 0.44, Math.pow(f, 1.6)) : lerp(o.bordaLado ?? 0.62, o.bordaTras ?? 0.68, Math.pow(-f, 1.2)); }
function inflaCabelo(o, i01) { return lerp(o.volume ?? 1.15, o.volBorda ?? 1.035, Math.pow(i01, 1.3)); }
function capaceteGeo(o, H) {
  const NT = o.dentes ?? 24, SV = 12, SH = NT * 2, pos = [], idx = [], seed = o.seed ?? 0;
  for (let j = 0; j <= SH; j++) {
    const ph = (j / SH) * Math.PI * 2, ponta = j % 2 === 0, jj = j % SH;
    const thE = (bordaCabelo(o, ph) + (ponta ? (hash(jj * 1.7 + seed) - 0.5) * (o.varia ?? 0.06) : -(o.entalhe ?? 0.1))) * Math.PI;
    for (let i = 0; i <= SV; i++) {
      const th = (i / SV) * thE, u = headUnit(V3_(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)), H), inf = inflaCabelo(o, i / SV);
      pos.push(u.x * H.a * inf, H.cy + u.y * H.b * inf, u.z * H.c * inf);
    }
  }
  for (let j = 0; j < SH; j++) for (let i = 0; i < SV; i++) { const a = j * (SV + 1) + i, b = a + SV + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return vincoNormais(g, 0.9);
}
// anéis de mechas: cada anel = [th, n, ph0, ph1, kr, ky, kb, L, W, curva, esp, kl]
//   th, ph em frações de π (th 0 = topo, 0.5 = altura das orelhas; ph 0 = testa, ±0.5 = lados, 1 = nuca);
//   direção = radial·kr + cima·ky + trás·kb + (pra fora do rosto, de lado)·kl
function aneisMechas(o) {
  const out = [], seed = o.seed ?? 0;
  (o.aneis || []).forEach((A, ai) => {
    const [th, n, ph0, ph1, kr, ky, kb, L, W, curva = 0.12, esp = 0.45, kl = 0] = A, fechado = Math.abs(ph1 - ph0) >= 1.999;
    for (let i = 0; i < n; i++) {
      const r1 = hash(ai * 31 + i * 3.7 + seed), r2 = hash(ai * 17 + i * 5.3 + seed), r3 = hash(ai * 7 + i * 9.1 + seed);
      const f = fechado ? (i + 0.5 * (ai % 2)) / n : n === 1 ? 0.5 : i / (n - 1);
      out.push({ th: th + (r1 - 0.5) * 0.05, ph: lerp(ph0, ph1, f) + (r2 - 0.5) * (fechado ? 1.2 / n : 0.3 / n), kr, ky: ky + (r3 - 0.5) * 0.25, kb, kl, L: L * (0.85 + r1 * 0.3), W: W * (0.88 + r2 * 0.24), curva, esp, giro: (r3 - 0.5) * 0.5 });
    }
  });
  return out.concat(o.mechas || []);
}
function cabeloLP(head, o) {
  const H = HEAD, cy = H.cy;
  const hg = grp(head, 0, cy, 0), hr = grp(hg, 0, -cy, 0); head.userData.hairG = hg; head.userData.hairLong = false;
  const m = LPmat(o.cor, { rim: 1.1, liso: true, side: THREE.DoubleSide, rough: 0.78 });
  const mf = LPmat(o.cor, { rim: 1.1, side: THREE.DoubleSide, rough: 0.82 }); // mechas facetadas (sombreado chapado, como na referência)
  if (o.baixo) mesh(capaceteGeo({ ...o, ...o.baixo }, H), LPmat(o.baixo.cor, { rim: 0.9, liso: true, side: THREE.DoubleSide, rough: 0.85 }), 0, 0, 0, hr); // camada de baixo (undercut escuro)
  mesh(capaceteGeo(o, H), m, 0, 0, 0, hr);
  const pt = (th, ph, inf) => { const u = headUnit(V3_(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)), H); return { u, w: V3_(u.x * H.a * inf, cy + u.y * H.b * inf, u.z * H.c * inf) }; };
  const naCasca = (th, ph, ext = 0.012) => { const thE = bordaCabelo(o, ph) * Math.PI, inf = inflaCabelo(o, clamp(th / thE)) + ext; return pt(th, ph, inf); };
  // pétalas largas deitadas, escorrendo do topo (dão as camadas do cabelo)
  const np = o.petalas ?? 0, seed = o.seed ?? 0;
  for (let i = 0; i < np; i++) {
    const ph = (i / np) * Math.PI * 2 + (hash(i + seed) - 0.5) * 0.5, th = (0.1 + hash(i * 3 + seed) * 0.2) * Math.PI;
    const A = naCasca(th, ph, 0.006), Bp = naCasca(th + 0.08, ph, 0.006), dir = Bp.w.clone().sub(A.w).normalize();
    lamina(hr, A.w, dir, A.u.clone().normalize(), (o.petalaLen ?? 0.07) * (0.8 + hash(i * 5 + seed) * 0.4), (o.petalaLarg ?? 0.06) * (0.85 + hash(i * 7 + seed) * 0.3), o.petalaFacetada ? mf : m, o.petalaCurva ?? -0.55);
  }
  // mechas em anéis (cabelo espetado, pra cima ou pra trás): saem de dentro do capacete, largas na base
  aneisMechas(o).forEach((q) => {
    const A = naCasca(q.th * Math.PI, q.ph * Math.PI, -(q.fundo ?? 0.006)), r = A.u.clone().normalize();
    const lado = V3_(r.x, 0, 0).normalize().multiplyScalar(q.kl || 0);
    const d = r.clone().multiplyScalar(q.kr).add(V3_(0, q.ky, -q.kb)).add(lado).normalize();
    lamina(hr, A.w, d, r, q.L, q.W, mf, q.curva, q.esp, q.giro || 0);
  });
  // franja extra: lâminas grandes caindo na testa (assimetria)
  (o.franjaExtra || []).forEach(([ph, len, lado, larg]) => { const A = naCasca(0.3 * Math.PI, ph, 0.01); lamina(hr, A.w, V3_(lado, -1, 0.42).normalize(), A.u.clone().normalize(), len, larg ?? 0.055, mf, -0.25, 0.3); });
  return hg;
}

// ---------------------------------------------------------------- corpo
function perfilR(pts, y) { for (let i = 0; i < pts.length - 1; i++) if (y <= pts[i + 1][1]) return lerp(pts[i][0], pts[i + 1][0], (y - pts[i][1]) / (pts[i + 1][1] - pts[i][1])); return pts[pts.length - 1][0]; }
function pessoaLP(o = {}) {
  const P = { pele: 0xf2d4b8, olho: "#2a8a7a", roupa: 0x1b2232, calca: 0x1b2232, sapato: 0x141418, sola: 0xe4e0d8, botao: 0xd4aa50, seed: 1, scale: 1, ...o };
  const S = skeleton({ ...HUMANO, ...(o.dims || {}) });
  const skin = LPmat(P.pele, { rim: 0.45, liso: true, rough: 0.7 }), roupa = LPmat(P.roupa, { rim: 1, liso: true }), roupa2 = LPmat(P.roupa, { rim: 1, liso: true, side: THREE.DoubleSide }), calca = LPmat(P.calca, { liso: true }), sapato = LPmat(P.sapato, { rough: 0.5 }), botao = LPmat(P.botao, { metal: 0.6, rough: 0.35, rim: 0.4 });
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
  // tronco: casaco fechado de gola alta, barra até o quadril, botões
  const abdP = [[0.001, -0.06], [0.136, -0.06], [0.14, 0.05], [0.136, 0.13], [0.14, 0.21], [0.001, 0.21]];
  const abd = mesh(lathe(abdP, R + 2), roupa, 0, 0, 0, S.spine); abd.scale.z = 0.76;
  const chP = [[0.001, -0.02], [0.138, -0.02], [0.16, 0.06], [0.176, 0.15], [0.174, 0.22], [0.148, 0.27], [0.086, 0.305], [0.001, 0.31]];
  const ch = mesh(lathe(chP, R + 2), roupa, 0, 0, 0, S.chest); ch.scale.z = 0.72;
  const hem = mesh(lathe([[0.152, 0.07], [0.16, -0.03], [0.172, -0.13]], R + 2), roupa2, 0, 0, 0, S.hips); hem.scale.z = 0.84;
  const gola = mesh(new THREE.CylinderGeometry(0.056, 0.07, 0.085, R + 2, 1, true), roupa2, 0, 0.34, -0.004, S.chest); gola.scale.z = 0.94;
  if (P.botoes !== false) {
    [0.07, 0.15, 0.23].forEach((y) => { const b = mesh(cyl(0.012, 0.012, 0.006, 8), botao, 0, y, perfilR(chP.slice(1), y) * 0.72 + 0.002, S.chest); b.rotation.x = Math.PI / 2; });
    [0.04, 0.13].forEach((y) => { const b = mesh(cyl(0.012, 0.012, 0.006, 8), botao, 0, y, 0.137 * 0.76 + 0.002, S.spine); b.rotation.x = Math.PI / 2; });
  }
  if (P.capuz != null) { // capuz vermelho do moletom por baixo do casaco (Yuji)
    const cm = LPmat(P.capuz, { rim: 0.9, liso: true, side: THREE.DoubleSide });
    const cp = mesh(new THREE.SphereGeometry(1, 10, 7, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.5), cm, 0, 0.3, -0.1, S.chest); cp.scale.set(0.12, 0.11, 0.075); cp.rotation.x = -0.35;
    const an = mesh(new THREE.TorusGeometry(0.066, 0.016, 6, 14), cm, 0, 0.318, -0.004, S.chest); an.rotation.x = Math.PI / 2; an.scale.set(1, 0.92, 1);
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
  mesh(cyl(0.036, 0.042, 0.1, R), skin, 0, 0.03, 0, S.neck);
  const headM = mesh(headGeoLP(P.cabeca || {}), skin, 0, 0, 0);
  const zAt = (x, y) => surfZ(headM, x, y);
  [-1, 1].forEach((k) => { const ea = mesh(sph(1, 8, 6), skin, k * 0.084, 0.094, -0.014); ea.scale.set(0.01, 0.021, 0.014); S.head.add(ea); });
  // rosto: olhos largos e baixos, sobrancelhas grossas, nariz em dois tons, bocas, blush
  const EX = 0.038, EY = 0.093, OW = 0.056 * (P.olhoTam ?? 1), OH = OW * 0.625;
  const olhos = [], fechados = [];
  if (!P.venda) [-1, 1].forEach((k) => {
    const g = grp(S.head, k * EX, EY, zAt(k * EX, EY) + 0.003); g.rotation.set(0, 0, k * (P.olhoInc ?? 0));
    decal(g, olhoTex(P.olho, { fenda: P.fenda, alt: P.olhoAlt ?? 1 }), OW, OH, 0, 0, 0, 0, 0, { espelho: k < 0, ei: 0.28 });
    const f = decal(S.head, olhoFechadoTex, OW, OH, k * EX, EY - 0.002, zAt(k * EX, EY) + 0.0035, 0, 0, { espelho: k < 0 }); f.visible = false;
    olhos.push(g); fechados.push(f);
  });
  const brows = [-1, 1].map((k) => { const y = EY + 0.0235, rz0 = -k * (0.04 + (P.brava ?? 0) * 0.22); const g = grp(S.head, k * (EX + 0.001), y, zAt(k * EX, y) + 0.0034); g.rotation.z = rz0; g.userData = { y0: y, rz0 }; decal(g, sobrancelhaTex, 0.054, 0.017, 0, 0, 0, 0, 0, { espelho: k < 0, basico: true, cor: P.sobrancelha ?? 0x2a1c18 }); g.visible = !P.venda; return g; });
  decal(S.head, narizTex(P.pele), 0.012, 0.016, 0.002, 0.069, zAt(0, 0.069) + 0.004);
  const MY = 0.043, mz = zAt(0, MY) + 0.003;
  const bocas = {};
  ["linha", "sorriso", "triste", "aberta"].forEach((t) => (bocas[t] = decal(S.head, bocaTex(t), 0.042, 0.021, 0, MY, mz)));
  bocas.risada = decal(S.head, bocaTex("risada"), 0.058, 0.029, 0, MY, mz + 0.001);
  if (P.blush) [-1, 1].forEach((k) => decal(S.head, blushTex, 0.03, 0.016, k * 0.046, 0.068, zAt(k * 0.046, 0.068) + 0.003, k * 0.2, 0, { suave: true }));
  let extras = null;
  if (P.sukuna) { // marcas do Sukuna
    extras = [-1, 1].map((k) => { const y = EY - 0.025, g = grp(S.head, k * 0.036, y, zAt(k * 0.036, y) + 0.003); g.rotation.set(0, 0, k * 0.1); decal(g, olhoExtraTex, 0.032, 0.012, 0, 0, 0); return g; });
    [-1, 1].forEach((k) => { const g = grp(S.head, k * 0.052, 0.058, zAt(k * 0.052, 0.058) + 0.004); g.rotation.set(0, k * 0.4, 0); decal(g, bochechaTex, 0.034, 0.017, 0, 0, 0, 0, 0, { espelho: k < 0 }); });
    decal(S.head, testaTex, 0.062, 0.015, 0, EY + 0.045, zAt(0, EY + 0.045) + 0.004);
  }
  S.head.add(headM);
  if (P.venda) { const vg = new THREE.CylinderGeometry(1, 1, 0.046, 28, 1, true); deform(vg, (v) => { const d = V3_(v.x, 0, v.z).normalize(), k_ = Math.pow(Math.pow(Math.abs(d.x), HEAD.n) + Math.pow(Math.abs(d.z), HEAD.n), -1 / HEAD.n); v.x = d.x * k_ * HEAD.a * 1.07; v.z = Math.min(d.z * k_, HEAD.frente) * HEAD.c * (d.z < 0 ? 1.12 : 1.08); }); mesh(vg, LPmat(0x121216, { side: THREE.DoubleSide, rim: 0.6, liso: true }), 0, EY + 0.006, 0, S.head); }
  if (P.cabelo) cabeloLP(S.head, P.cabelo);
  S.head.scale.setScalar(P.cabecaEscala ?? 1.12); // cabeça um pouco maior (proporção de anime)
  S.root.scale.setScalar(P.scale);
  shadows(S.root);
  S.root.traverse((c) => { if (c.userData && c.userData.isDecal) { c.castShadow = false; c.receiveShadow = false; } });
  S.root.userData = { ...S, eyes: null, brows: null, mouth: null, hands, P, headM, kind: "lp", tails: [], scarfTails: [], lp: { olhos, fechados, brows, bocas, extras } };
  restPose(S.root);
  return S.root;
}
// expressões: piscada (olho vira a linha fechada), olhos fechados, sobrancelhas (bravo/triste/sobe), boca (linha, sorriso,
// triste, aberta, risada) e fala (boca abrindo)
function rostoLP(p, t, f = {}) {
  const u = p.userData, L = u.lp; if (!L) return;
  const per = f.piscaCada ?? 3.4, ph = (t + hash(u.P.seed) * 5) % per, piscando = ph < 0.12;
  const fecha = f.fechados || piscando;
  L.olhos.forEach((g) => (g.visible = !fecha)); L.fechados.forEach((g) => (g.visible = fecha));
  if (!fecha) L.olhos.forEach((g) => (g.scale.y = clamp(f.palpebra ?? 1, 0.3, 1.2)));
  if (L.extras) L.extras.forEach((g) => (g.visible = !fecha));
  L.brows.forEach((g, i) => { const k = i ? 1 : -1; g.rotation.z = g.userData.rz0 - k * ((f.bravo ?? 0) * 0.32 - (f.triste ?? 0) * 0.3); g.position.y = g.userData.y0 + (f.sobe ?? 0) * 0.006 - (f.bravo ?? 0) * 0.003; });
  let tipo = f.boca ?? "linha";
  if (f.fala) { const a = Math.abs(Math.sin(t * 12.5)) * f.fala; if (a > 0.4) tipo = "aberta"; L.bocas.aberta.scale.y = 0.6 + a * 0.5; }
  for (const k in L.bocas) L.bocas[k].visible = k === tipo;
}

// ---------------------------------------------------------------- calibração: o Eren da animação de referência (para comparar o estilo lado a lado)
function erenRefLP(o = {}) { return pessoaLP({ seed: 5, pele: 0xf2d6bc, olho: "#1f8f80", olhoAlt: 0.9, roupa: 0x2a2a30, calca: 0x2a2a30, botoes: false, sobrancelha: 0x2a1a14, cabelo: { cor: 0x4a2e20, dentes: 22, bordaFrente: 0.45, bordaLado: 0.64, bordaTras: 0.7, volume: 1.16, petalas: 12, seed: 2 }, ...o }); }

// ---------------------------------------------------------------- elenco: Jujutsu Kaisen
const JJK = { navy: 0x2f3b58, navy2: 0x222a3e, botao: 0xd4aa50 };
// cabelos: capacete com franja em zigue-zague + anéis de mechas largas e facetadas (ver aneisMechas)
const CAB = {
  undercut: { cor: 0x4a2a30, bordaFrente: 0.26, bordaLado: 0.56, bordaTras: 0.6, volume: 1.05, volBorda: 1.03, dentes: 26, entalhe: 0.03, varia: 0.02 },
  yuji: { cor: 0xeb98a4, dentes: 18, bordaFrente: 0.43, bordaLado: 0.36, bordaTras: 0.42, volume: 1.12, volBorda: 1.065, entalhe: 0.08, varia: 0.06, seed: 3,
    aneis: [
      [0.04, 4, 0, 2, 0.6, 1.0, 0.2, 0.065, 0.065, 0.15, 0.5],          // topo
      [0.16, 8, 0, 2, 1.0, 0.8, 0.15, 0.07, 0.07, 0.15, 0.5],           // coroa: pra cima e pra fora
      [0.27, 7, 0.25, 1.75, 1.0, 0.45, 0.3, 0.06, 0.065, 0.12, 0.45],    // lados e trás
      [0.23, 3, -0.14, 0.14, 0.9, 0.9, -0.25, 0.065, 0.06, 0.18, 0.45],  // franja espetada pra cima e pra frente
    ],
    franjaExtra: [[-0.24, 0.068, -0.3, 0.045], [0.24, 0.068, 0.3, 0.045]] },
  sukunaYuji: { cor: 0xeb98a4, dentes: 24, bordaFrente: 0.25, bordaLado: 0.36, bordaTras: 0.42, volume: 1.1, volBorda: 1.065, entalhe: 0.03, varia: 0.02, seed: 4,
    aneis: [
      [0.19, 5, -0.26, 0.26, 0.12, 0.3, 1.0, 0.12, 0.085, 0.34, 0.2],     // penteado pra trás, por cima (mechas largas)
      [0.25, 3, 0.32, 0.5, 0.12, 0.2, 1.0, 0.11, 0.075, 0.3, 0.2],        // laterais pra trás
      [0.25, 3, -0.5, -0.32, 0.12, 0.2, 1.0, 0.11, 0.075, 0.3, 0.2],
      [0.3, 8, 0.62, 1.38, 0.85, 0.55, 0.75, 0.07, 0.065, 0.2, 0.45],     // nuca espetada
    ] },
  megumi: { cor: 0x3a4256, dentes: 20, bordaFrente: 0.45, bordaLado: 0.58, bordaTras: 0.62, volume: 1.2, entalhe: 0.12, varia: 0.08, seed: 7,
    aneis: [
      [0.04, 4, 0, 2, 0.5, 1.0, 0.3, 0.08, 0.07, 0.15, 0.5],             // topo: pra cima
      [0.17, 8, 0, 2, 1.0, 0.75, 0.25, 0.09, 0.075, 0.15, 0.5],          // coroa: pra cima e pra fora
      [0.3, 8, 0.3, 1.7, 1.0, 0.5, 0.3, 0.07, 0.07, 0.14, 0.45],         // lados e trás: pra fora e pra cima
      [0.44, 5, 0.7, 1.3, 0.6, -0.1, 0.5, 0.065, 0.065, 0.1, 0.4],       // nuca
      [0.25, 3, -0.12, 0.12, 0.15, -1.0, 0, 0.06, 0.05, 0.1, 0.25],      // franja caindo na testa
    ] },
  gojo: { cor: 0xdde2ea, dentes: 22, bordaFrente: 0.34, bordaLado: 0.5, bordaTras: 0.58, volume: 1.18, entalhe: 0.06, varia: 0.05, seed: 9,
    aneis: [
      [0.04, 4, 0, 2, 0.35, 1.0, 0.15, 0.09, 0.07, 0.12, 0.45],
      [0.16, 8, 0, 2, 0.6, 1.0, 0.15, 0.1, 0.075, 0.12, 0.45],
      [0.28, 10, 0, 2, 0.8, 0.85, 0.15, 0.09, 0.07, 0.12, 0.42],
      [0.4, 7, 0.45, 1.55, 0.7, 0.35, 0.4, 0.075, 0.065, 0.1, 0.4],
    ],
    franjaExtra: [[-0.08, 0.06, -0.15, 0.035], [0.1, 0.055, 0.2, 0.03]] },
};
function yujiLP(o = {}) { return pessoaLP({ seed: 11, pele: 0xf3d2b6, olho: "#a8642e", olhoAlt: 1.0, capuz: 0xb3262c, roupa: JJK.navy, calca: JJK.navy, blush: true, sobrancelha: 0x5a2a30, cabelo: { ...CAB.yuji, baixo: CAB.undercut }, ...o }); }
function sukunaYujiLP(o = {}) { return yujiLP({ seed: 12, olho: "#c41e2a", olhoAlt: 0.82, olhoInc: 0.06, blush: false, sukuna: true, brava: 0.6, cabelo: { ...CAB.sukunaYuji, baixo: CAB.undercut }, ...o }); }
function megumiLP(o = {}) { return pessoaLP({ seed: 21, pele: 0xf1d0b4, olho: "#2f5a66", olhoAlt: 0.86, brava: 0.5, roupa: JJK.navy, calca: JJK.navy, sobrancelha: 0x101216, cabelo: CAB.megumi, ...o }); }
function sukunaMegumiLP(o = {}) { return megumiLP({ seed: 22, olho: "#c41e2a", olhoInc: 0.06, sukuna: true, brava: 0.7, ...o }); }
function gojoLP(o = {}) { return pessoaLP({ seed: 31, pele: 0xf4dcc4, venda: true, roupa: JJK.navy2, calca: JJK.navy2, scale: 1.08, cabelo: CAB.gojo, ...o }); }
