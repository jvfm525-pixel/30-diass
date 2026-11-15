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
// decal curvo: a malha acompanha a superfície (zFn(x, y) = z da pele no espaço do pai), assim nada "entra" na pele
// quando o rosto é curvo. (x0, y0) = posição do decal no pai.
function decalSup(parent, tex, w, h, x0, y0, zFn, o = {}) {
  const g = new THREE.PlaneGeometry(w, h, o.sx ?? 12, o.sy ?? 4), pa = g.attributes.position, dz = o.dz ?? 0.0028;
  for (let i = 0; i < pa.count; i++) pa.setZ(i, zFn(x0 + pa.getX(i), y0 + pa.getY(i)) + dz);
  pa.needsUpdate = true; g.computeVertexNormals();
  const m = new THREE.Mesh(g, decalMat(o.espelho ? espelho(tex) : tex, o)); m.position.set(x0, y0, 0);
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
// olho de anime da referência (o Eren criança, medido quadro a quadro): abertura alta e redonda; o traço de cima é um arco
// alto e grosso que desce pelos dois cantos (o externo desce mais, em gancho); íris enorme (~70% da largura) com o topo
// escondido sob o traço, anel escuro, raios claros, pupila e dois brilhos; linha de baixo fina e o vinco fino acima do olho.
// alt < 1 deixa o olho mais baixo (adultos, olhar sério).
function olhoTex(iris, o = {}) {
  const k = iris + JSON.stringify(o); if (EYT[k]) return EYT[k];
  return (EYT[k] = canvasTex(256, 200, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const al = o.alt ?? 1, L = 32, R = 224, T = 104 - 66 * al, B = 104 + 62 * al;
    const arco = () => { c.moveTo(L, 122); c.bezierCurveTo(L + 4, T + 18, L + 44, T, 128, T); c.bezierCurveTo(R - 34, T, R + 2, T + 22, R + 2, 112); };
    const abertura = () => { arco(); c.bezierCurveTo(R - 6, B - 10, 170, B + 2, 128, B + 2); c.bezierCurveTo(84, B + 2, L + 6, B - 18, L, 122); };
    c.save(); c.beginPath(); abertura(); c.closePath(); c.clip();
    c.fillStyle = o.esclera ?? "#f8f6f2"; c.fillRect(0, 0, w, h);
    const ix = 130 + (o.dx ?? 0), iy = 106, ir = 68 * Math.min(1.02, Math.max(0.7, al));
    const g = c.createRadialGradient(ix, iy + ir * 0.4, ir * 0.1, ix, iy, ir);
    g.addColorStop(0, corCSS(iris, 0.22)); g.addColorStop(0.6, corCSS(iris, 0.04)); g.addColorStop(1, corCSS(iris, -0.14));
    c.fillStyle = g; c.beginPath(); c.arc(ix, iy, ir, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(255,255,255,.16)"; c.lineWidth = 3; for (let i = 0; i < 14; i++) { const an = (i / 14) * Math.PI * 2; c.beginPath(); c.moveTo(ix + Math.cos(an) * ir * 0.4, iy + Math.sin(an) * ir * 0.4); c.lineTo(ix + Math.cos(an) * ir * 0.86, iy + Math.sin(an) * ir * 0.86); c.stroke(); }
    c.strokeStyle = corCSS(iris, -0.34); c.lineWidth = 7; c.beginPath(); c.arc(ix, iy, ir - 3.5, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "#0b0809"; c.beginPath(); if (o.fenda) c.ellipse(ix, iy - 4, ir * 0.13, ir * 0.58, 0, 0, Math.PI * 2); else c.ellipse(ix + 2, iy - 6, ir * 0.33, ir * 0.37, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffffff"; c.beginPath(); c.ellipse(ix + ir * 0.3, iy - ir * 0.42, ir * 0.24, ir * 0.2, -0.3, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 0.85; c.beginPath(); c.arc(ix - ir * 0.36, iy + ir * 0.42, ir * 0.1, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    const sh = c.createLinearGradient(0, T, 0, T + 44); sh.addColorStop(0, "rgba(60,40,40,.5)"); sh.addColorStop(1, "rgba(60,40,40,0)"); c.fillStyle = sh; c.fillRect(0, 0, w, h);
    c.restore();
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = "rgba(140,96,84,.6)"; c.lineWidth = 3.5; c.beginPath(); c.moveTo(70, B - 2); c.bezierCurveTo(100, B + 6, 180, B + 2, R - 14, B - 22); c.stroke();        // linha de baixo
    c.strokeStyle = "rgba(140,96,84,.55)"; c.lineWidth = 3.5; c.beginPath(); c.moveTo(96, T - 14); c.bezierCurveTo(150, T - 22, R - 6, T - 14, R + 8, T + 18); c.stroke(); // vinco
    // traço de cima: fita de espessura variável seguindo o arco (fino no canto de dentro, grosso no alto e no canto de fora)
    const pts = []; { const P0 = [L + 6, 112], P1 = [L + 8, T + 16], P2 = [L + 44, T], P3 = [128, T], Q1 = [R - 34, T], Q2 = [R + 2, T + 22], Q3 = [R + 2, 112], Q4 = [R - 4, 136];
      const bz = (a, b_, c_, d_, t) => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b_[0] + 3 * u * t * t * c_[0] + t * t * t * d_[0], u * u * u * a[1] + 3 * u * u * t * b_[1] + 3 * u * t * t * c_[1] + t * t * t * d_[1]]; };
      for (let i = 0; i <= 20; i++) pts.push(bz(P0, P1, P2, P3, i / 20)); for (let i = 1; i <= 20; i++) pts.push(bz(P3, Q1, Q2, Q3, i / 20)); for (let i = 1; i <= 6; i++) { const t = i / 6; pts.push([Q3[0] + (Q4[0] - Q3[0]) * t, Q3[1] + (Q4[1] - Q3[1]) * t]); } }
    const esp = (i) => { const f = i / (pts.length - 1); return f < 0.4 ? lerp(1.5, 9, sm(f / 0.4)) : f < 0.85 ? 9 : lerp(9, 6, (f - 0.85) / 0.15); };
    const nrm = (i) => { const a_ = pts[Math.max(0, i - 1)], b_ = pts[Math.min(pts.length - 1, i + 1)], dx = b_[0] - a_[0], dy = b_[1] - a_[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    c.fillStyle = o.cilio ?? "#141010"; c.beginPath();
    pts.forEach((q, i) => { const [nx, ny] = nrm(i), e = esp(i); i ? c.lineTo(q[0] + nx * e, q[1] + ny * e) : c.moveTo(q[0] + nx * e, q[1] + ny * e); });
    for (let i = pts.length - 1; i >= 0; i--) { const [nx, ny] = nrm(i), e = esp(i); c.lineTo(pts[i][0] - nx * e * 0.6, pts[i][1] - ny * e * 0.6); }
    c.closePath(); c.fill();
  }));
}
// olho fechado (medido no Eren dormindo): arco escuro grosso curvado pra baixo, com cílios curtos embaixo
const olhoFechadoTex = canvasTex(256, 200, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "#141010"; c.lineCap = "round"; c.lineWidth = 13; c.beginPath(); c.moveTo(28, 104); c.bezierCurveTo(70, 140, 180, 146, 228, 100); c.stroke(); c.lineWidth = 5; [[80, 130], [110, 136], [140, 137], [170, 133], [198, 122]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3, y + 15); c.stroke(); }); });
// sobrancelha: barra comprida e grossa, mais grossa na ponta de dentro, arco suave e pontas arredondadas
const sobrancelhaTex = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(14, 26); c.bezierCurveTo(70, 4, 170, 4, 240, 26); c.bezierCurveTo(252, 30, 250, 46, 238, 44); c.bezierCurveTo(170, 28, 80, 30, 20, 58); c.bezierCurveTo(4, 62, 2, 34, 14, 26); c.closePath(); c.fill(); });
const BOCAT = {};
function bocaTex(tipo) {
  if (BOCAT[tipo]) return BOCAT[tipo];
  return (BOCAT[tipo] = canvasTex(256, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.lineCap = "round"; c.lineJoin = "round"; const cx = w / 2, cy = h / 2, cor = "#86402f";
    if (tipo === "linha") { c.fillStyle = cor; c.beginPath(); c.roundRect(cx - 60, cy - 11, 120, 22, 9); c.fill(); }
    else if (tipo === "sorriso") { c.strokeStyle = cor; c.lineWidth = 20; c.beginPath(); c.moveTo(cx - 58, cy - 10); c.quadraticCurveTo(cx, cy + 22, cx + 58, cy - 10); c.stroke(); }
    else if (tipo === "triste") { c.strokeStyle = cor; c.lineWidth = 20; c.beginPath(); c.moveTo(cx - 56, cy + 12); c.quadraticCurveTo(cx, cy - 18, cx + 56, cy + 12); c.stroke(); }
    else if (tipo === "aberta") { c.fillStyle = "#3a0c10"; c.beginPath(); c.ellipse(cx, cy, 34, 26, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#b8343a"; c.beginPath(); c.ellipse(cx, cy + 12, 22, 11, 0, 0, Math.PI * 2); c.fill(); }
    else if (tipo === "risada") { // sorriso de canto a canto do Sukuna, com a fileira de dentes
      c.fillStyle = "#2a0a0e"; c.beginPath(); c.moveTo(cx - 110, cy - 16); c.quadraticCurveTo(cx, cy + 40, cx + 110, cy - 16); c.quadraticCurveTo(cx, cy + 8, cx - 110, cy - 16); c.fill();
      c.save(); c.clip(); c.fillStyle = "#f4efe6"; for (let i = 0; i < 15; i++) c.fillRect(cx - 104 + i * 14, cy - 14, 11, 16); c.restore();
    }
  }));
}
function narizGeo(w, hh, p) {
  const T = [0, hh * 0.62, 0], E = [-w / 2, -hh * 0.38, 0], D = [w / 2, -hh * 0.38, 0], P = [0, -hh * 0.3, p];
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...T, ...E, ...P, ...T, ...P, ...D, ...E, ...D, ...P], 3)); g.computeVertexNormals(); return g;
}
const blushTex = canvasTex(128, 64, (c, w, h) => { c.clearRect(0, 0, w, h); const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, "rgba(242,128,120,.5)"); g.addColorStop(0.55, "rgba(242,128,120,.28)"); g.addColorStop(1, "rgba(242,128,120,0)"); c.fillStyle = g; c.save(); c.scale(1, h / w); c.beginPath(); c.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2); c.restore(); c.fill(); });
// marcas do Sukuna: o segundo par de olhos, as listras das bochechas e a marca da testa
const olhoExtraTex = canvasTex(256, 96, (c, w, h) => { c.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2; c.fillStyle = "#140a0c"; c.beginPath(); c.moveTo(cx - 116, cy + 4); c.quadraticCurveTo(cx, cy - 44, cx + 116, cy - 6); c.quadraticCurveTo(cx, cy + 40, cx - 116, cy + 4); c.fill();
  c.fillStyle = "#d8202c"; c.beginPath(); c.ellipse(cx, cy, 28, 20, 0, 0, 7); c.fill(); c.fillStyle = "#2a0606"; c.beginPath(); c.ellipse(cx, cy, 9, 18, 0, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(cx - 9, cy - 7, 5, 0, 7); c.fill(); });
const bochechaTex = canvasTex(256, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#16090c"; [[30, 34], [44, 74]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(w - 26, y - 14); c.lineTo(w - 32, y - 2); c.lineTo(x + 6, y + 12); c.closePath(); c.fill(); }); });
const testaTex = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#16090c"; c.beginPath(); c.moveTo(14, 20); c.lineTo(w / 2 - 22, 22); c.lineTo(w / 2, 58); c.lineTo(w / 2 + 22, 22); c.lineTo(w - 14, 20); c.lineTo(w - 14, 30); c.lineTo(w / 2 + 16, 32); c.lineTo(w / 2, 48); c.lineTo(w / 2 - 16, 32); c.lineTo(14, 30); c.closePath(); c.fill(); });

// ---------------------------------------------------------------- cabeça
// cabeça medida no Eren criança da referência: crânio arredondado em cima; embaixo um bloco mais "cheio" (expoente maior),
// frente plana descendo até o queixo, bochechas retas até a altura da boca e queixo largo em U
const HEAD = { a: 0.077, b: 0.132, bBaixo: 0.156, c: 0.088, n: 2.6, nBaixo: 3.0, cy: 0.103, frente: 0.9, jawY: -0.18, jaw: 0.42 };
const yCab = (uy, H) => H.cy + uy * (uy < 0 ? H.bBaixo ?? H.b : H.b); // metade de baixo mais comprida (queixo longo como na referência)
function superDir(d, n, m = n) { // superelipsoide com expoente n em x/z e m em y: acha t com |tx|^n + |ty|^m + |tz|^n = 1
  const f = (t) => Math.pow(Math.abs(d.x * t), n) + Math.pow(Math.abs(d.y * t), m) + Math.pow(Math.abs(d.z * t), n) - 1;
  let lo = 0, hi = 2; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (f(mid) > 0) hi = mid; else lo = mid; }
  return d.multiplyScalar((lo + hi) / 2);
}
function headUnit(v, H = HEAD) {
  v.normalize(); const baixo = v.y < 0;
  superDir(v, baixo ? (H.nBaixo ?? H.n) : H.n, baixo ? (H.nBaixo ?? H.n) : H.n);
  if (v.z > H.frente) v.z = H.frente;
  if (v.y < H.jawY) { const k = sm(clamp((H.jawY - v.y) / (1 + H.jawY))); v.x *= 1 - H.jaw * k; v.z *= v.z < 0 ? 1 - 0.3 * k : 1 - 0.14 * k; }
  if (v.z < 0) v.z *= 1.05;
  return v;
}
function headGeoLP(o = {}) {
  const H = { ...HEAD, ...o }, g = new THREE.SphereGeometry(1, o.ws ?? 16, o.hs ?? 14);
  deform(g, (v) => { headUnit(v, H); v.set(v.x * H.a, yCab(v.y, H), v.z * H.c); });
  return vincoNormais(g, 1.3);
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
      pos.push(u.x * H.a * inf, H.cy + (yCab(u.y, H) - H.cy) * inf, u.z * H.c * inf);
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
// mechas grossas avulsas (como na referência): franja de triângulos grossos até as sobrancelhas, mechas laterais,
// topete espetado e nuca. Cada mecha: { th, ph (frações de π), L, W, esp, curva, kd (desce pela cabeça), kr (pra fora),
// ky (pra cima), kb (pra trás), giro }
function franjaMechas(n, ph0, ph1, th, L, W, x = {}) { const out = []; for (let i = 0; i < n; i++) { const f = n === 1 ? 0.5 : i / (n - 1), r = hash(i * 7.3 + (x.seed ?? 0)); out.push({ th: th + (r - 0.5) * 0.03, ph: lerp(ph0, ph1, f), L: L * (0.9 + r * 0.2), W, esp: x.esp ?? 0.4, curva: x.curva ?? -0.12, kd: x.kd ?? 1, kr: x.kr ?? 0.12, ky: x.ky ?? 0, kb: x.kb ?? 0, kl: x.kl ?? 0, giro: (r - 0.5) * (x.giro ?? 0.5) }); } return out; }
function cabeloLP(head, o) {
  const H = HEAD, cy = H.cy;
  const hg = grp(head, 0, cy, 0), hr = grp(hg, 0, -cy, 0); head.userData.hairG = hg; head.userData.hairLong = false;
  const m = LPmat(o.cor, { rim: 1.1, liso: true, side: THREE.DoubleSide, rough: 0.78 });
  const mf = LPmat(o.cor, { rim: 1.1, side: THREE.DoubleSide, rough: 0.82 }); // mechas facetadas (sombreado chapado, como na referência)
  if (o.baixo) mesh(capaceteGeo({ ...o, ...o.baixo }, H), LPmat(o.baixo.cor, { rim: 0.9, liso: true, side: THREE.DoubleSide, rough: 0.85 }), 0, 0, 0, hr); // camada de baixo (undercut escuro)
  mesh(capaceteGeo(o, H), m, 0, 0, 0, hr);
  const pt = (th, ph, inf) => { const u = headUnit(V3_(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)), H); return { u, w: V3_(u.x * H.a * inf, cy + (yCab(u.y, H) - cy) * inf, u.z * H.c * inf) }; };
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
  // mechas grossas avulsas: descem pela superfície (kd), com um pouco pra fora (kr), pra cima (ky) ou pra trás (kb)
  const mg = LPmat(o.cor, { rim: 0.8, liso: true, side: THREE.DoubleSide, rough: 0.95 });
  (o.grossas || []).forEach((q) => {
    const A = naCasca(q.th * Math.PI, q.ph * Math.PI, -(q.fundo ?? 0.004)), A2 = naCasca((q.th + 0.04) * Math.PI, q.ph * Math.PI, -(q.fundo ?? 0.004)), r = A.u.clone().normalize();
    const desce = A2.w.clone().sub(A.w).normalize(), lado = V3_(r.x, 0, 0).normalize().multiplyScalar(q.kl || 0);
    const d = desce.multiplyScalar(q.kd ?? 1).addScaledVector(r, q.kr ?? 0.12).add(V3_(0, q.ky ?? 0, -(q.kb ?? 0))).add(lado).normalize();
    const m = lamina(hr, A.w, d, r, q.L, q.W, mg, q.curva ?? -0.12, q.esp ?? 0.4, q.giro || 0); m.geometry = vincoNormais(m.geometry, 0.55);
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
  const gola = mesh(new THREE.CylinderGeometry(0.058, 0.07, 0.06, R + 2, 1, true), roupa2, 0, 0.326, -0.004, S.chest); gola.scale.z = 0.94;
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
  const zAt = (x, y) => { let z = surfZ(headM, x, y); if (z === 0) z = surfZ(headM, Math.sign(x) * Math.min(Math.abs(x), HEAD.a * 0.9), y) - 0.006; return z; };
  [-1, 1].forEach((k) => { const ea = mesh(sph(1, 8, 6), skin, k * 0.078, 0.078, -0.012); ea.scale.set(0.013, 0.028, 0.017); S.head.add(ea); });
  // rosto: olhos largos e baixos, sobrancelhas grossas, nariz em dois tons, bocas, blush
  const EX = 0.0385, EY = 0.093, OW = 0.064 * (P.olhoTam ?? 1), OH = OW * 200 / 256;
  const olhos = [], fechados = [];
  if (!P.venda) [-1, 1].forEach((k) => {
    const g = grp(S.head, k * EX, EY, 0); g.rotation.set(0, 0, k * (P.olhoInc ?? 0));
    decalSup(g, olhoTex(P.olho, { fenda: P.fenda, alt: P.olhoAlt ?? 1 }), OW, OH, 0, 0, (x, y) => zAt(k * EX + x, EY + y), { espelho: k < 0, ei: 0.28, dz: 0.0028 });
    const f = decalSup(S.head, olhoFechadoTex, OW, OH, k * EX, EY - 0.002, zAt, { espelho: k < 0, dz: 0.0032 }); f.visible = false;
    olhos.push(g); fechados.push(f);
  });
  const brows = [-1, 1].map((k) => { const y = EY + 0.047, rz0 = -k * (0.02 + (P.brava ?? 0) * 0.24), bx = k * (EX + 0.001); const g = grp(S.head, bx, y, 0); g.rotation.z = rz0; g.userData = { y0: y, rz0 }; decalSup(g, sobrancelhaTex, 0.074, 0.02, 0, 0, (x, yy) => zAt(bx + x, y + yy), { espelho: k < 0, basico: true, cor: P.sobrancelha ?? 0x2a1c18, dz: 0.0036 }); g.visible = !P.venda; return g; });
  mesh(narizGeo(0.0145, 0.022, 0.009), LPmat(P.pele, { rim: 0.3, rough: 0.7 }), 0, 0.062, zAt(0, 0.062) - 0.0014, S.head); // nariz 3D
  const MY = 0.004, mz = zAt(0, MY) + 0.003;
  const bocas = {};
  ["linha", "sorriso", "triste", "aberta"].forEach((t) => (bocas[t] = decalSup(S.head, bocaTex(t), 0.056, 0.028, 0, MY, zAt, { dz: 0.003 })));
  bocas.risada = decalSup(S.head, bocaTex("risada"), 0.066, 0.033, 0, MY, zAt, { dz: 0.0034 });
  if (P.blush) [-1, 1].forEach((k) => decal(S.head, blushTex, 0.046, 0.024, k * 0.046, 0.066, zAt(k * 0.046, 0.066) + 0.003, k * 0.3, 0, { suave: true }));
  let extras = null;
  if (P.sukuna) { // marcas do Sukuna
    extras = [-1, 1].map((k) => { const y = EY - 0.027, g = grp(S.head, k * 0.037, y, zAt(k * 0.036, y) + 0.003); g.rotation.set(0, 0, k * 0.1); decal(g, olhoExtraTex, 0.032, 0.012, 0, 0, 0); return g; });
    [-1, 1].forEach((k) => { const g = grp(S.head, k * 0.05, 0.05, zAt(k * 0.05, 0.05) + 0.004); g.rotation.set(0, k * 0.4, 0); decal(g, bochechaTex, 0.034, 0.017, 0, 0, 0, 0, 0, { espelho: k < 0 }); });
    decal(S.head, testaTex, 0.062, 0.015, 0, EY + 0.054, zAt(0, EY + 0.054) + 0.004);
  }
  S.head.add(headM);
  if (P.venda) { const vg = new THREE.CylinderGeometry(1, 1, 0.058, 28, 1, true); deform(vg, (v) => { const d = V3_(v.x, 0, v.z).normalize(), k_ = Math.pow(Math.pow(Math.abs(d.x), HEAD.n) + Math.pow(Math.abs(d.z), HEAD.n), -1 / HEAD.n); v.x = d.x * k_ * HEAD.a * 1.07; v.z = Math.min(d.z * k_, HEAD.frente) * HEAD.c * (d.z < 0 ? 1.12 : 1.08); }); mesh(vg, LPmat(0x121216, { side: THREE.DoubleSide, rim: 0.6, liso: true }), 0, EY + 0.012, 0, S.head); }
  if (P.cabelo) cabeloLP(S.head, P.cabelo);
  S.head.scale.setScalar(P.cabecaEscala ?? 1.35); // cabeça grande como na referência (≈70% da largura dos ombros)
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
// cabelos do elenco: capacete liso + mechas grossas (como o Eren criança da referência)
// tufos = mechas espetadas pra fora/cima saindo do topo; franja = mechas caindo na testa
const tufos = (n, ph0, ph1, th, L, W, kr, ky, kb, x = {}) => franjaMechas(n, ph0, ph1, th, L, W, { kd: 0, kr, ky, kb, curva: x.curva ?? 0.2, esp: x.esp ?? 0.45, giro: x.giro ?? 0.6, seed: x.seed ?? 0 });
const camadaTopo = (seed, L = 0.074, W = 0.078) => franjaMechas(8, -1, 0.75, 0.07, L, W, { seed, curva: -0.4, esp: 0.3, kr: 0.02, giro: 0.4 });
const CAB = {
  undercut: { cor: 0x3e2226, bordaFrente: 0.28, bordaLado: 0.56, bordaTras: 0.6, volume: 1.05, volBorda: 1.03, dentes: 26, entalhe: 0.03, varia: 0.02 },
  yuji: { cor: 0xf09aa8, dentes: 16, bordaFrente: 0.32, bordaLado: 0.36, bordaTras: 0.42, volume: 1.12, volBorda: 1.065, entalhe: 0.06, varia: 0.05, petalas: 0, seed: 3,
    grossas: [
      ...camadaTopo(11),
      ...tufos(5, -0.2, 0.2, 0.25, 0.06, 0.042, 0.7, 0.85, -0.15, { seed: 12 }),        // franja espetada pra cima e pra frente
      ...franjaMechas(2, -0.08, 0.06, 0.27, 0.058, 0.034, { seed: 13, giro: 0.6 }),    // duas mechas caindo no meio da testa
      ...tufos(7, -0.85, 0.85, 0.12, 0.06, 0.05, 0.8, 0.7, 0.35, { seed: 14 }),        // topo espetado
      ...tufos(5, 0.6, 1.4, 0.24, 0.05, 0.048, 0.8, 0.4, 0.5, { seed: 15 }),           // trás
    ] },
  sukunaYuji: { cor: 0xf09aa8, dentes: 22, bordaFrente: 0.3, bordaLado: 0.36, bordaTras: 0.42, volume: 1.1, volBorda: 1.065, entalhe: 0.03, varia: 0.02, petalas: 0, seed: 4,
    grossas: [
      ...franjaMechas(6, -0.3, 0.3, 0.27, 0.12, 0.062, { seed: 21, kd: -1, kr: 0.16, kb: 0.5, curva: 0.28, esp: 0.36, giro: 0.4 }), // penteado pra trás
      ...franjaMechas(3, 0.34, 0.5, 0.26, 0.1, 0.055, { seed: 22, kd: -1, kr: 0.12, kb: 0.6, curva: 0.25, esp: 0.36 }),
      ...franjaMechas(3, -0.5, -0.34, 0.26, 0.1, 0.055, { seed: 23, kd: -1, kr: 0.12, kb: 0.6, curva: 0.25, esp: 0.36 }),
      ...tufos(7, 0.6, 1.4, 0.2, 0.062, 0.052, 0.8, 0.5, 0.7, { seed: 24 }),           // pontas espetadas atrás
    ] },
  megumi: { cor: 0x3a4052, dentes: 18, bordaFrente: 0.3, bordaLado: 0.55, bordaTras: 0.64, volume: 1.2, entalhe: 0.06, varia: 0.05, petalas: 0, seed: 7,
    grossas: [
      ...camadaTopo(31, 0.08, 0.07),
      ...franjaMechas(6, -0.24, 0.24, 0.25, 0.07, 0.038, { seed: 32, giro: 0.9 }),     // franja espetada caindo na testa
      ...franjaMechas(2, 0.32, 0.45, 0.3, 0.07, 0.046, { seed: 33, kl: 0.25 }),
      ...franjaMechas(2, -0.45, -0.32, 0.3, 0.07, 0.046, { seed: 34, kl: 0.25 }),
      ...tufos(6, -1, 0.66, 0.05, 0.085, 0.058, 0.6, 1.0, 0.2, { seed: 35 }),          // espetado pra cima
      ...tufos(9, -1, 0.78, 0.17, 0.08, 0.056, 1.0, 0.7, 0.25, { seed: 36 }),          // espetado pra fora
      ...tufos(5, 0.6, 1.4, 0.32, 0.065, 0.05, 0.9, 0.2, 0.5, { seed: 37 }),           // nuca
    ] },
  gojo: { cor: 0xe6eaf0, dentes: 18, bordaFrente: 0.3, bordaLado: 0.5, bordaTras: 0.6, volume: 1.16, entalhe: 0.05, varia: 0.04, petalas: 0, seed: 9,
    grossas: [
      ...tufos(6, -1, 0.66, 0.05, 0.09, 0.06, 0.4, 1.0, 0.15, { seed: 41 }),           // pra cima
      ...tufos(10, -1, 0.8, 0.17, 0.085, 0.058, 0.8, 0.9, 0.2, { seed: 42 }),          // pra cima e pra fora
      ...tufos(5, -0.24, 0.24, 0.26, 0.07, 0.045, 0.6, 0.9, -0.1, { seed: 43 }),       // franja levantada
      ...franjaMechas(3, -0.12, 0.12, 0.27, 0.06, 0.032, { seed: 44, giro: 0.8 }),     // fios caindo sobre a venda
      ...tufos(5, 0.6, 1.4, 0.3, 0.065, 0.05, 0.8, 0.4, 0.5, { seed: 45 }),
    ] },
};
function yujiLP(o = {}) { return pessoaLP({ seed: 11, pele: 0xffe2b8, olho: "#b06a34", olhoAlt: 0.9, olhoTam: 0.92, capuz: 0xb3262c, roupa: JJK.navy, calca: JJK.navy, blush: true, sobrancelha: 0x4a2228, cabelo: { ...CAB.yuji, baixo: CAB.undercut }, ...o }); }
function sukunaYujiLP(o = {}) { return yujiLP({ seed: 12, olho: "#c41e2a", olhoAlt: 0.8, olhoInc: 0.05, blush: false, sukuna: true, brava: 0.6, cabelo: { ...CAB.sukunaYuji, baixo: CAB.undercut }, ...o }); }
function megumiLP(o = {}) { return pessoaLP({ seed: 21, pele: 0xfde0b6, olho: "#2f6070", olhoAlt: 0.8, olhoTam: 0.92, brava: 0.35, roupa: JJK.navy, calca: JJK.navy, sobrancelha: 0x14161c, cabelo: CAB.megumi, ...o }); }
function sukunaMegumiLP(o = {}) { return megumiLP({ seed: 22, olho: "#c41e2a", olhoInc: 0.05, sukuna: true, brava: 0.65, ...o }); }
function gojoLP(o = {}) { return pessoaLP({ seed: 31, pele: 0xffe6c8, venda: true, roupa: JJK.navy2, calca: JJK.navy2, scale: 1.08, cabelo: CAB.gojo, ...o }); }
// calibração 2: o Eren criança da referência (cena da árvore), pra comparar rosto e cabelo lado a lado
function erenCriancaLP(o = {}) {
  const topete = (th, ph, L, kr, ky, kb) => ({ th, ph, L, W: 0.062, esp: 0.45, curva: 0.22, kd: 0.2, kr, ky, kb });
  return pessoaLP({ seed: 6, pele: 0xffdcaa, olho: "#2a9a88", olhoAlt: 0.94, blush: true, roupa: 0x5c7a46, calca: 0x4a5a3a, botoes: false, sobrancelha: 0x2e1e14,
    cabelo: { cor: 0x4a3020, dentes: 16, bordaFrente: 0.3, bordaLado: 0.56, bordaTras: 0.64, volume: 1.12, volBorda: 1.14, entalhe: 0.05, varia: 0.04, petalas: 0, seed: 2,
      grossas: [
        ...franjaMechas(8, -1, 0.75, 0.07, 0.074, 0.078, { seed: 5, curva: -0.4, esp: 0.3, kr: 0.02, giro: 0.4 }), // camada de cima: poucas mechas largas cobrindo o topo
        ...franjaMechas(7, -0.24, 0.24, 0.25, 0.066, 0.038, { seed: 1, giro: 0.7 }),        // franja: triângulos grossos até perto das sobrancelhas
        ...franjaMechas(2, 0.32, 0.5, 0.3, 0.062, 0.064, { seed: 2, kl: 0.16 }),             // laterais curtas e largas sobre as têmporas
        ...franjaMechas(2, -0.5, -0.32, 0.3, 0.062, 0.064, { seed: 3, kl: 0.16 }),
        ...franjaMechas(5, 0.62, 1.38, 0.42, 0.062, 0.042, { seed: 4 }),                    // nuca
        ...tufos(9, -1, 0.78, 0.17, 0.04, 0.054, 1.0, 0.3, 0.25, { seed: 8, curva: 0.2 }),    // topo: várias pontas pequenas abrindo pros lados (silhueta serrilhada)
        topete(0.06, 0.6, 0.034, 0.8, 0.5, 0.4), topete(0.06, -0.6, 0.034, 0.8, 0.5, 0.4),
      ] }, ...o });
}
