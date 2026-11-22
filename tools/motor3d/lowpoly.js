// ================================================================ personagens low-poly v7 (estilo da animação de referência, GUIA-ANIMACAO-ESTILO.md)
// Calibrado reconstruindo o Eren criança da própria animação e comparando lado a lado, no mesmo ângulo dos quadros de 9 s e 12 s.
// Rosto: retângulo em cima (laterais retas até o nariz) que afina num "U" comprido até um queixo estreito; frente plana e quinas marcadas. Medido nos rostos
//   de frente do vídeo (Kruger, Eren adulto, Eren criança, Armin). Olhos grandes de anime, nariz em pirâmide 3D, sobrancelhas
//   grossas, boca curta, blush. Os traços são decalques curvos que acompanham a pele.
// Cabelo: uma touca justa feita de MECHAS em triângulo com aresta no meio, saindo do redemoinho no topo e terminando em dentes
//   (franja, têmporas, nuca), mais alguns tufos largos no alto. Pouco volume, como no vídeo.
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
    const ix = 130 + (o.dx ?? 0), iy = 106, ir = 68 * Math.min(1.02, Math.max(0.7, al)) * (o.ir ?? 1);
    const g = c.createRadialGradient(ix, iy + ir * 0.4, ir * 0.1, ix, iy, ir);
    g.addColorStop(0, corCSS(iris, 0.22)); g.addColorStop(0.6, corCSS(iris, 0.04)); g.addColorStop(1, corCSS(iris, -0.14));
    c.fillStyle = g; c.beginPath(); c.arc(ix, iy, ir, 0, Math.PI * 2); c.fill();
    if (o.aneis) { // olhos dos Quatro Cavaleiros (Chainsaw Man): anéis concêntricos na íris, pupila pequena
      c.strokeStyle = o.corAnel ?? corCSS(iris, -0.45); c.lineWidth = 5; for (let i = 1; i <= o.aneis; i++) { c.beginPath(); c.arc(ix, iy - 2, ir * (0.2 + 0.78 * i / (o.aneis + 0.4)), 0, Math.PI * 2); c.stroke(); }
      c.fillStyle = "#0b0809"; c.beginPath(); c.arc(ix, iy - 2, ir * 0.12, 0, Math.PI * 2); c.fill();
    } else {
    c.strokeStyle = "rgba(255,255,255,.16)"; c.lineWidth = 3; for (let i = 0; i < 14; i++) { const an = (i / 14) * Math.PI * 2; c.beginPath(); c.moveTo(ix + Math.cos(an) * ir * 0.4, iy + Math.sin(an) * ir * 0.4); c.lineTo(ix + Math.cos(an) * ir * 0.86, iy + Math.sin(an) * ir * 0.86); c.stroke(); }
    c.strokeStyle = corCSS(iris, -0.34); c.lineWidth = 7; c.beginPath(); c.arc(ix, iy, ir - 3.5, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "#0b0809"; c.beginPath(); if (o.fenda) c.ellipse(ix, iy - 4, ir * 0.13, ir * 0.58, 0, 0, Math.PI * 2); else c.ellipse(ix + 2, iy - 6, ir * 0.33, ir * 0.37, 0, 0, Math.PI * 2); c.fill();
    }
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
    if (o.femi) { c.strokeStyle = o.cilio ?? "#141010"; c.lineWidth = 5; [[R - 30, T + 2, R - 18, T - 18], [R - 12, T + 10, R + 6, T - 6], [R + 2, T + 26, R + 20, T + 16]].forEach(([x0, y0, x1, y1]) => { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 4, y1 + 4, x1, y1); c.stroke(); }); }
  }));
}
// olho fechado (medido no Eren dormindo): arco escuro grosso curvado pra baixo, com cílios curtos embaixo
const olhoFechadoTex = canvasTex(256, 200, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "#141010"; c.lineCap = "round"; c.lineWidth = 13; c.beginPath(); c.moveTo(28, 104); c.bezierCurveTo(70, 140, 180, 146, 228, 100); c.stroke(); c.lineWidth = 5; [[80, 130], [110, 136], [140, 137], [170, 133], [198, 122]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3, y + 15); c.stroke(); }); });
// sobrancelha: barra comprida e grossa, mais grossa na ponta de dentro, arco suave e pontas arredondadas
const sobrancelha2Tex = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(10, 34); c.bezierCurveTo(60, 12, 150, 8, 246, 30); c.bezierCurveTo(250, 33, 246, 37, 240, 36); c.bezierCurveTo(160, 24, 80, 30, 18, 52); c.bezierCurveTo(8, 54, 4, 42, 10, 34); c.fill();
  c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 3; for (let i = 0; i < 9; i++) { const x = 30 + i * 22; c.beginPath(); c.moveTo(x, 40 - i * 1.2); c.lineTo(x + 18, 24 - i * 0.6); c.stroke(); } });
// rugas e olheiras (homens mais velhos): linhas finas, sem borda retangular
const rugasTex = canvasTex(256, 192, (c, w, h) => { c.clearRect(0, 0, w, h); c.lineCap = "round"; c.strokeStyle = "rgba(120,70,60,.55)"; c.lineWidth = 3;
  [-1, 1].forEach((k) => { const cx = 128 + k * 62; c.beginPath(); c.moveTo(cx - 26, 70); c.quadraticCurveTo(cx, 84, cx + 24, 70); c.stroke(); c.globalAlpha = 0.6; c.beginPath(); c.moveTo(cx - 18, 82); c.quadraticCurveTo(cx, 92, cx + 16, 82); c.stroke(); c.globalAlpha = 1;
    c.beginPath(); c.moveTo(128 + k * 30, 104); c.quadraticCurveTo(128 + k * 42, 128, 128 + k * 36, 150); c.stroke();
    c.globalAlpha = 0.5; c.beginPath(); c.moveTo(cx + k * 34, 44); c.lineTo(cx + k * 46, 38); c.moveTo(cx + k * 34, 52); c.lineTo(cx + k * 47, 54); c.stroke(); c.globalAlpha = 1; }); });
const sobrancelhaTex = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(14, 26); c.bezierCurveTo(70, 4, 170, 4, 240, 26); c.bezierCurveTo(252, 30, 250, 46, 238, 44); c.bezierCurveTo(170, 28, 80, 30, 20, 58); c.bezierCurveTo(4, 62, 2, 34, 14, 26); c.closePath(); c.fill(); });
// sombra de anime sobre a testa e os olhos (olhar ameaçador), gota de suor e lágrimas
const sombraTex = canvasTex(128, 128, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(8,2,8,.97)"); g.addColorStop(0.62, "rgba(8,2,8,.85)"); g.addColorStop(1, "rgba(8,2,8,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); c.globalCompositeOperation = "destination-in"; const gx = c.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, "rgba(0,0,0,0)"); gx.addColorStop(0.18, "rgba(0,0,0,1)"); gx.addColorStop(0.82, "rgba(0,0,0,1)"); gx.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gx; c.fillRect(0, 0, w, h); });
const suorTex = canvasTex(64, 96, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "rgba(200,230,255,.95)"; c.strokeStyle = "#5a8ab8"; c.lineWidth = 4; c.beginPath(); c.moveTo(32, 6); c.bezierCurveTo(40, 30, 58, 50, 54, 68); c.arc(32, 66, 22, 0.1, Math.PI - 0.1); c.bezierCurveTo(6, 50, 24, 30, 32, 6); c.fill(); c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.ellipse(24, 64, 5, 9, -0.3, 0, Math.PI * 2); c.fill(); });
const lagrimaTex = canvasTex(64, 128, (c, w, h) => { c.clearRect(0, 0, w, h); const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(190,225,255,.9)"); g.addColorStop(1, "rgba(190,225,255,0)"); c.fillStyle = g; c.beginPath(); c.roundRect(22, 0, 20, h, 10); c.fill(); });
const BOCAT = {};
function bocaTex(tipo) {
  if (BOCAT[tipo]) return BOCAT[tipo];
  return (BOCAT[tipo] = canvasTex(256, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.lineCap = "round"; c.lineJoin = "round"; const cx = w / 2, cy = h / 2, cor = "#86402f";
    if (tipo === "linha") { c.fillStyle = cor; c.beginPath(); c.roundRect(cx - 60, cy - 11, 120, 22, 9); c.fill(); }
    else if (tipo === "sorriso") { c.strokeStyle = cor; c.lineWidth = 20; c.beginPath(); c.moveTo(cx - 58, cy - 10); c.quadraticCurveTo(cx, cy + 22, cx + 58, cy - 10); c.stroke(); }
    else if (tipo === "triste") { c.strokeStyle = cor; c.lineWidth = 20; c.beginPath(); c.moveTo(cx - 56, cy + 12); c.quadraticCurveTo(cx, cy - 18, cx + 56, cy + 12); c.stroke(); }
    else if (tipo === "aberta") { c.fillStyle = "#3a0c10"; c.beginPath(); c.ellipse(cx, cy, 34, 26, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#b8343a"; c.beginPath(); c.ellipse(cx, cy + 12, 22, 11, 0, 0, Math.PI * 2); c.fill(); }
    else if (tipo === "smirk") { c.strokeStyle = cor; c.lineWidth = 18; c.beginPath(); c.moveTo(cx - 54, cy + 4); c.bezierCurveTo(cx - 20, cy + 14, cx + 30, cy + 10, cx + 62, cy - 18); c.stroke(); c.lineWidth = 8; c.beginPath(); c.moveTo(cx + 56, cy - 22); c.lineTo(cx + 66, cy - 8); c.stroke(); }
    else if (tipo === "dentes") { c.fillStyle = "#2a0a0e"; c.beginPath(); c.moveTo(cx - 70, cy - 14); c.quadraticCurveTo(cx, cy + 46, cx + 70, cy - 14); c.quadraticCurveTo(cx, cy - 4, cx - 70, cy - 14); c.fill(); c.save(); c.clip(); c.fillStyle = "#f4efe6"; c.fillRect(cx - 70, cy - 16, 140, 15); c.fillStyle = "rgba(0,0,0,.25)"; for (let i = 1; i < 9; i++) c.fillRect(cx - 70 + i * 15.5, cy - 16, 2, 15); c.fillStyle = "#b8343a"; c.beginPath(); c.ellipse(cx, cy + 22, 26, 9, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    else if (tipo === "grito") { c.fillStyle = "#2a0a0e"; c.beginPath(); c.ellipse(cx, cy + 4, 40, 34, 0, 0, Math.PI * 2); c.fill(); c.save(); c.clip(); c.fillStyle = "#f4efe6"; c.fillRect(cx - 40, cy - 32, 80, 12); c.fillStyle = "#b8343a"; c.beginPath(); c.ellipse(cx, cy + 30, 26, 14, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    else if (tipo === "mastiga") { c.fillStyle = cor; c.beginPath(); c.roundRect(cx - 44, cy - 9, 88, 18, 9); c.fill(); c.strokeStyle = "rgba(120,60,50,.5)"; c.lineWidth = 6; [-1, 1].forEach((k) => { c.beginPath(); c.arc(cx + k * 62, cy, 10, k > 0 ? -1.2 : 1.9, k > 0 ? 1.2 : 4.4); c.stroke(); }); }
    else if (tipo === "ryuk") { // sorriso enorme do Ryuk: lábios escuros e grossos de orelha a orelha, dentes afiados
      c.fillStyle = "#1c1424"; c.beginPath(); c.moveTo(cx - 122, cy - 26); c.quadraticCurveTo(cx, cy + 58, cx + 122, cy - 26); c.quadraticCurveTo(cx, cy + 2, cx - 122, cy - 26); c.fill();
      c.fillStyle = "#3a1a40"; c.beginPath(); c.moveTo(cx - 108, cy - 18); c.quadraticCurveTo(cx, cy + 40, cx + 108, cy - 18); c.quadraticCurveTo(cx, cy + 14, cx - 108, cy - 18); c.fill();
      c.save(); c.clip(); c.fillStyle = "#f2ead8"; for (let i = 0; i < 18; i++) { const x = cx - 104 + i * 12.2; c.beginPath(); c.moveTo(x, cy - 20); c.lineTo(x + 11, cy - 20); c.lineTo(x + 5.5, cy + 6); c.fill(); } c.restore();
    }
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

// ---------------------------------------------------------------- cabeça (v7)
// Medida nos rostos de frente da referência (Kruger, Eren adulto, Eren criança, Armin): um BLOCO RETANGULAR arredondado.
// Unidade u = meia-largura do rosto na linha dos olhos (CAB.HW, em metros); y em u a partir da linha dos olhos (EY).
//   - laterais retas desde a testa até o nariz; na boca o rosto tem ~80% da largura;
//   - depois afina num "U" comprido até um queixo estreito e arredondado (~27% da largura), a ~1,72 u abaixo dos olhos;
//   - frente plana (testa, olhos, bochechas), quinas marcadas entre a frente e os lados (low-poly);
//   - crânio arredondado em cima, ~1,8 u acima dos olhos.
const CAB = {
  HW: 0.075, EY: 0.093, nF: 3.4, nT: 2.3,
  // medido de frente no Kruger e no pai do Eren: reto até o nariz, depois afina num "U" comprido até um queixo estreito (~27%)
  larg: [[-1.72, 0], [-1.71, 0.2], [-1.68, 0.3], [-1.62, 0.39], [-1.56, 0.45], [-1.48, 0.52], [-1.36, 0.62], [-1.24, 0.71], [-1.12, 0.79], [-0.95, 0.86], [-0.75, 0.92], [-0.55, 0.96], [-0.3, 0.99], [0.0, 1.0], [0.7, 1.0], [1.1, 0.96], [1.42, 0.84], [1.66, 0.56], [1.78, 0.24], [1.8, 0]],
  frente: [[-1.72, 0.5], [-1.66, 0.62], [-1.5, 0.74], [-1.1, 0.84], [-0.3, 0.9], [0.5, 0.92], [1.05, 0.88], [1.42, 0.72], [1.66, 0.44], [1.8, 0]],
  tras: [[-1.72, -0.3], [-1.45, -0.1], [-1.0, 0.4], [-0.45, 0.95], [0.3, 1.26], [0.95, 1.28], [1.4, 1.06], [1.68, 0.6], [1.8, 0]],
  Y: [-1.72, -1.71, -1.68, -1.62, -1.56, -1.48, -1.36, -1.24, -1.12, -0.95, -0.75, -0.5, -0.2, 0.15, 0.5, 0.8, 1.1, 1.3, 1.48, 1.62, 1.72, 1.8],
};
function perfilY(pts, y) { if (y <= pts[0][0]) return pts[0][1]; for (let i = 0; i < pts.length - 1; i++) if (y <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (y - pts[i][0]) / (pts[i + 1][0] - pts[i][0])); return pts[pts.length - 1][1]; }
// ponto da superfície da cabeça (metros, espaço da cabeça) no ângulo ph (0 = frente, ±π/2 = lados, π = nuca) e altura y (u)
function supCab(ph, y, ext = 0, out = V3_()) {
  const H = CAB, s_ = Math.sin(ph), c_ = Math.cos(ph), fr = c_ >= 0, n = fr ? H.nF : H.nT;
  const w = perfilY(H.larg, y), d = fr ? perfilY(H.frente, y) : perfilY(H.tras, y);
  out.set(Math.sign(s_) * Math.pow(Math.abs(s_), 2 / n) * w, y, Math.sign(c_) * Math.pow(Math.abs(c_), 2 / n) * d);
  if (ext) { const nn = nrmCab(ph, y); out.addScaledVector(nn, ext / H.HW); }
  return out.set(out.x * H.HW, H.EY + out.y * H.HW, out.z * H.HW);
}
function nrmCab(ph, y) { // normal (aprox.) por diferenças finitas, no espaço u
  const e = 0.01, H = CAB, f = (a, b) => { const s_ = Math.sin(a), c_ = Math.cos(a), n = c_ >= 0 ? H.nF : H.nT, w = perfilY(H.larg, b), d = c_ >= 0 ? perfilY(H.frente, b) : perfilY(H.tras, b); return V3_(Math.sign(s_) * Math.pow(Math.abs(s_), 2 / n) * w, b, Math.sign(c_) * Math.pow(Math.abs(c_), 2 / n) * d); };
  const p0 = f(ph, y), tu = f(ph + e, y).sub(f(ph - e, y)), tv = f(ph, Math.min(1.8, y + e)).sub(f(ph, Math.max(-1.72, y - e)));
  const n = V3_().crossVectors(tu, tv); if (n.lengthSq() < 1e-12) n.copy(p0).setY(y > 0 ? 1 : -1); n.normalize();
  if (n.dot(V3_(p0.x, y > 1.7 ? 1 : y < -1.68 ? -1 : 0, p0.z)) < 0) n.negate();
  return n;
}
function headGeoLP(o = {}) {
  const NS = o.ns ?? 24, Y = CAB.Y, pos = [], idx = [], ph0 = Math.PI / NS; // meia volta de deslocamento: o meio do rosto cai numa face plana (sem risco no meio)
  for (let i = 0; i < Y.length; i++) for (let j = 0; j <= NS; j++) { const v = supCab(ph0 + (j / NS) * Math.PI * 2, Y[i]); pos.push(v.x, v.y, v.z); }
  for (let i = 0; i < Y.length - 1; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const q = o.queixo ?? 1; if (q !== 1) for (let i = 0; i < pos.length; i += 3) { const y = pos[i + 1], z = pos[i + 2]; if (y < 0.062) { const f = 1 + (q - 1) * Math.min(1, Math.max(0, (z + 0.01) / 0.07)); pos[i + 1] = 0.062 + (y - 0.062) * f; } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return vincoNormais(g, o.vinco ?? 0.62);
}

// ---------------------------------------------------------------- cabelo (v7)
// Como na referência: uma TOUCA justa no crânio (pouco volume), com a borda cortada em dentes triangulares (franja até perto
// das sobrancelhas, laterais nas têmporas, nuca) e só algumas pontas curtas no alto. Nada de tufos pra todo lado.
// mecha/ponta: lâmina grossa que afina até a ponta. Eixo Y = comprimento, X = largura, Z = espessura.
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
// altura (u) da borda da touca no ângulo ph: franja na frente, lados, nuca (interpolados)
function bordaY(o, ph) { const f = Math.cos(ph); return f > 0 ? lerp(o.ladoY ?? 0.2, o.franjaY ?? 0.75, Math.pow(f, o.franjaK ?? 2.2)) : lerp(o.ladoY ?? 0.2, o.nucaY ?? -0.55, Math.pow(-f, 1.1)); }
// touca de MECHAS (como no vídeo): mechas compridas em triângulo saindo do redemoinho no alto da cabeça e descendo até a borda.
// Cada mecha tem uma aresta no meio (crista), então mostra um lado claro e um escuro; as pontas formam os dentes da franja.
// Feito numa malha só: colunas alternam crista (mais alta, vai até a ponta do dente) e vale (mais baixa, termina no entalhe).
function toucaGeo(o) {
  const NT = o.dentes ?? 18, SH = NT * 2, SV = 12, seed = o.seed ?? 0, pos = [], idx = [];
  const topo = 1.8, espTopo = o.esp ?? 0.0075, espBorda = o.espBorda ?? 0.0032, dente = o.dente ?? 0.34, varia = o.varia ?? 0.1, crista = o.crista ?? 0.0034;
  for (let j = 0; j <= SH; j++) {
    const jj = j % SH, ph = (jj / SH) * Math.PI * 2 + (o.giro ?? 0), ponta = jj % 2 === 0, fr = Math.cos(ph);
    const yE = bordaY(o, ph) + (ponta ? -(dente * (fr > 0.35 ? (o.denteFranja ?? 1) : 1) * (0.8 + hash(jj * 1.7 + seed) * 0.4)) : (hash(jj * 2.3 + seed) - 0.5) * varia);
    for (let i = 0; i <= SV; i++) {
      const f = i / SV, y = lerp(topo, yE, Math.pow(f, 0.9));
      const e = lerp(espTopo, espBorda, Math.pow(f, 1.2)) + (ponta ? crista * sm(clamp(f * 6)) * (1 - 0.45 * f) : 0);
      const v = supCab(ph, y, e); pos.push(v.x, v.y, v.z);
    }
  }
  for (let j = 0; j < SH; j++) for (let i = 0; i < SV; i++) { const a = j * (SV + 1) + i, b = a + SV + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return vincoNormais(g, o.vinco ?? 0.42);
}
// ponto na casca da touca (y em u, ph em rad) e a normal pra fora
function naTouca(o, y, ph, ext = 0) { const fy = clamp((1.8 - y) / Math.max(0.01, 1.8 - bordaY(o, ph))), e = lerp(o.esp ?? 0.0075, o.espBorda ?? 0.0032, Math.pow(fy, 1.2)); return { w: supCab(ph, y, e + ext), n: nrmCab(ph, y) }; }
// pontas: [y (u), ph (frações de π), comprimento (u), largura (u), sobe (0 = deitada na cabeça, 1 = em pé), pra trás, curva]
function cabeloLP(head, o) {
  const cy = CAB.EY + 0.5 * CAB.HW;
  const hg = grp(head, 0, cy, 0), hr = grp(hg, 0, -cy, 0); head.userData.hairG = hg; head.userData.hairLong = false;
  const m = LPmat(o.cor, { rim: 1.0, liso: true, side: THREE.DoubleSide, rough: 0.8 });
  if (o.baixo) mesh(toucaGeo({ ...o, ...o.baixo }), LPmat(o.baixo.cor, { rim: 0.9, liso: true, side: THREE.DoubleSide, rough: 0.85 }), 0, 0, 0, hr); // camada de baixo (undercut)
  const tc = mesh(toucaGeo(o), m, 0, 0, 0, hr); tc.userData.touca = true; hg.userData.rig = o.rigidez ?? 1;
  const mp = o.pontaFacetada ? LPmat(o.cor, { rim: 1.0, side: THREE.DoubleSide, rough: 0.82 }) : m; // pontas com o mesmo sombreado da touca (se misturam ao cabelo)
  (o.pontas || []).forEach(([y, phf, L, W, sobe = 0.4, tras = 0, curva = 0.15, esp = 0.5, contra = 0], i) => {
    const ph = phf * Math.PI, A = naTouca(o, y, ph, -0.002), up = V3_(0, 1, 0);
    // direção: desce pela superfície (tangente) misturada com a normal (sobe) e pra trás
    const t = supCab(ph, y - 0.05).sub(supCab(ph, y + 0.05)).normalize(); if (contra) t.negate(); // contra = sobe pela cabeça (penteado pra trás)
    const d = t.multiplyScalar(1 - sobe).addScaledVector(A.n, sobe * 1.2).add(V3_(0, 0, -tras)).normalize();
    const lm = lamina(hr, A.w, d, A.n, L * CAB.HW, W * CAB.HW, mp, curva, esp, (hash(i * 3.1 + (o.seed ?? 0)) - 0.5) * 0.6); lm.geometry = vincoNormais(lm.geometry, 0.9); lm.userData.lock = { L: L * CAB.HW, i };
  });
  return hg;
}

// ---------------------------------------------------------------- corpo
function perfilR(pts, y) { for (let i = 0; i < pts.length - 1; i++) if (y <= pts[i + 1][1]) return lerp(pts[i][0], pts[i + 1][0], (y - pts[i][1]) / (pts[i + 1][1] - pts[i][1])); return pts[pts.length - 1][0]; }
function pessoaLP(o = {}) {
  const P = { pele: 0xf2d4b8, olho: "#2a8a7a", roupa: 0x1b2232, calca: 0x1b2232, sapato: 0x141418, sola: 0xe4e0d8, botao: 0xd4aa50, seed: 1, scale: 1, ...o };
  const S = skeleton({ ...HUMANO, ...(o.fem ? { shW: 0.164, hipW: 0.1, upper: 0.28, fore: 0.245, neckY: 0.27 } : {}), ...(o.dims || {}) });
  const FEM = !!o.fem, kb = FEM ? 0.84 : 1, kp = FEM ? 0.9 : 1; // braços e canelas mais finos
  const skin = LPmat(P.pele, { rim: 0.45, liso: true, rough: 0.7 }), roupa = LPmat(P.roupa, { rim: 1, liso: true }), roupa2 = LPmat(P.roupa, { rim: 1, liso: true, side: THREE.DoubleSide }), calca = LPmat(P.calca, { liso: true }), sapato = LPmat(P.sapato, { rough: 0.5 }), botao = LPmat(P.botao, { metal: 0.6, rough: 0.35, rim: 0.4 });
  const R = 12;
  // quadril, pernas e tênis
  mesh(sph(1, R, 6), calca, 0, -0.01, 0, S.hips).scale.set(FEM ? 0.165 : 0.15, 0.11, FEM ? 0.12 : 0.11);
  S.hipJ.forEach((hj, i) => {
    mesh(lathe([[0.001, -0.45], [0.058, -0.44], [0.066, -0.3], [0.078, -0.1], [0.082, 0.0], [0.062, 0.05], [0.001, 0.065]], R), calca, 0, 0, 0, hj);
    mesh(sph(0.058, R, 6), calca, 0, 0, 0.004, S.knee[i]);
    { const cn = mesh(lathe([[0.001, -0.44], [0.054, -0.42], [0.058, -0.26], [0.062, -0.1], [0.06, 0.0], [0.001, 0.03]], R), calca, 0, 0, 0, S.knee[i]); cn.scale.set(kp, 1, kp); }
    mesh(box(0.1, 0.075, 0.23), sapato, 0, -0.03, 0.05, S.ankle[i]);
    mesh(box(0.104, 0.022, 0.236), LPmat(P.sola), 0, -0.07, 0.05, S.ankle[i]);
  });
  // tronco: casaco fechado de gola alta, barra até o quadril, botões
  const abdP = FEM ? [[0.001, -0.06], [0.142, -0.06], [0.132, 0.05], [0.118, 0.13], [0.126, 0.21], [0.001, 0.21]] : [[0.001, -0.06], [0.136, -0.06], [0.14, 0.05], [0.136, 0.13], [0.14, 0.21], [0.001, 0.21]];
  const abd = mesh(lathe(abdP, R + 2), roupa, 0, 0, 0, S.spine); abd.scale.z = 0.76;
  const chP = FEM ? [[0.001, -0.02], [0.126, -0.02], [0.146, 0.06], [0.158, 0.14], [0.152, 0.21], [0.128, 0.262], [0.076, 0.296], [0.001, 0.3]] : [[0.001, -0.02], [0.138, -0.02], [0.16, 0.06], [0.176, 0.15], [0.174, 0.22], [0.148, 0.27], [0.086, 0.305], [0.001, 0.31]];
  const ch = mesh(lathe(chP, R + 2), roupa, 0, 0, 0, S.chest); ch.scale.z = 0.72;
  if (FEM) [-1, 1].forEach((k) => { const b = mesh(sph(0.048, R, 8), roupa, k * 0.054, 0.125, 0.07, S.chest); b.scale.set(1, 0.88, 0.7); }); // busto discreto
  const hem = mesh(lathe(FEM ? [[0.148, 0.07], [0.168, -0.03], [0.184, -0.13]] : [[0.152, 0.07], [0.16, -0.03], [0.172, -0.13]], R + 2), roupa2, 0, 0, 0, S.hips); hem.scale.z = 0.84;
  const gola = mesh(new THREE.CylinderGeometry(FEM ? 0.05 : 0.058, FEM ? 0.062 : 0.07, 0.06, R + 2, 1, true), roupa2, 0, FEM ? 0.314 : 0.326, -0.004, S.chest); gola.scale.z = 0.94;
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
    mesh(sph(0.06, R, 6), roupa, 0, -0.012, 0, sh).scale.setScalar(kb);
    mesh(lathe([[0.001, -0.3], [0.048, -0.29], [0.052, -0.2], [0.056, -0.08], [0.06, 0.0], [0.042, 0.04], [0.001, 0.05]], R), roupa, 0, 0, 0, sh).scale.set(kb, 1, kb);
    mesh(sph(0.046, R, 6), roupa, 0, 0, 0, S.el[i]).scale.setScalar(kb);
    mesh(lathe([[0.001, -0.235], [0.046, -0.228], [0.047, -0.15], [0.048, -0.05], [0.049, 0.0], [0.001, 0.03]], R), roupa, 0, 0, 0, S.el[i]).scale.set(kb, 1, kb);
    mesh(cyl(0.051, 0.051, 0.028, R), roupa, 0, -0.222, 0, S.el[i]).scale.set(kb, 1, kb);
    return hand(S.wr[i], i ? 1 : -1, skin, FEM ? 0.86 : 1, true);
  });
  // pescoço, cabeça, orelhas
  mesh(cyl(FEM ? 0.03 : 0.036, FEM ? 0.035 : 0.042, 0.1, R), skin, 0, 0.03, 0, S.neck);
  const V2 = P.rosto !== 1; // rosto v2: queixo mais curto, boca perto do nariz, sobrancelha afinando, rugas opcionais
  const headM = mesh(headGeoLP({ queixo: V2 ? (P.queixo ?? 0.7) : 1, ...(P.cabeca || {}) }), skin, 0, 0, 0);
  const zAt = (x, y) => { let z = surfZ(headM, x, y); if (z === 0) z = surfZ(headM, Math.sign(x) * Math.min(Math.abs(x), CAB.HW * 0.9), y) - 0.006; return z; };
  [-1, 1].forEach((k) => { const ea = mesh(sph(1, 7, 5), skin, k * 0.074, 0.081, -0.008); ea.scale.set(0.011, 0.023, 0.016); ea.rotation.y = k * 0.25; S.head.add(ea); });
  // rosto: olhos largos e baixos, sobrancelhas grossas, nariz em dois tons, bocas, blush
  const EX = 0.036, EY = CAB.EY, OW = 0.058 * (P.olhoTam ?? 1), OH = OW * 200 / 256;
  const olhos = [], fechados = [];
  if (!P.venda) [-1, 1].forEach((k) => {
    const g = grp(S.head, k * EX, EY, 0); g.rotation.set(0, 0, k * (P.olhoInc ?? 0));
    decalSup(g, olhoTex(P.olho, { fenda: P.fenda, alt: P.olhoAlt ?? 1, ...(P.fem ? { femi: true } : {}), ...(P.olhoOpts || {}) }), OW, OH, 0, 0, (x, y) => zAt(k * EX + x, EY + y), { espelho: k < 0, ei: 0.28, dz: 0.0028 });
    const f = decalSup(S.head, olhoFechadoTex, OW, OH, k * EX, EY - 0.002, zAt, { espelho: k < 0, dz: 0.0032 }); f.visible = false;
    olhos.push(g); fechados.push(f);
  });
  const brows = [-1, 1].map((k) => { const y = EY + 0.04, rz0 = -k * (0.02 + (P.brava ?? 0) * 0.24), bx = k * (EX + 0.001); const g = grp(S.head, bx, y, 0); g.rotation.z = rz0; g.userData = { y0: y, rz0 }; decalSup(g, V2 ? sobrancelha2Tex : sobrancelhaTex, P.browW ?? 0.064, V2 ? 0.021 : 0.019, 0, 0, (x, yy) => zAt(bx + x, y + yy), { espelho: k < 0, basico: true, cor: P.sobrancelha ?? 0x2a1c18, dz: 0.0036 }); g.visible = !P.venda; return g; });
  mesh(narizGeo(0.0135, 0.024, 0.0085), LPmat(P.pele, { rim: 0.3, rough: 0.7 }), 0, 0.06, zAt(0, 0.06) - 0.0012, S.head); // nariz 3D
  const MY = V2 ? (P.bocaY ?? 0.03) : 0.009, mz = zAt(0, MY) + 0.003;
  if (P.rugas) { const r = decalSup(S.head, rugasTex, 0.15, 0.1125, 0, 0.058, zAt, { dz: 0.0026, suave: true }); r.material.opacity = Math.min(1, P.rugas); }
  if (P.barba3d != null) { const bm = LPmat(P.barba3d, { rim: 0.6 }); const zc = zAt(0, -0.02); const b = mesh(new THREE.ConeGeometry(0.03, 0.07, 5), bm, 0, -0.045, zc - 0.012, S.head); b.rotation.x = Math.PI + 0.35; b.scale.z = 0.7;
    [-1, 1].forEach((k) => { const m = mesh(box(0.034, 0.008, 0.012), bm, k * 0.019, MY + 0.011, zAt(k * 0.019, MY + 0.011) + 0.002, S.head); m.rotation.z = -k * 0.32; }); }
  const bocas = {};
  ["linha", "sorriso", "triste", "aberta"].forEach((t) => (bocas[t] = decalSup(S.head, bocaTex(t), V2 && t === "linha" ? 0.044 : 0.056, V2 && t === "linha" ? 0.022 : 0.028, 0, MY, zAt, { dz: 0.003 })));
  bocas.risada = decalSup(S.head, bocaTex("risada"), 0.066, 0.033, 0, MY, zAt, { dz: 0.0034 });
  ["smirk", "mastiga"].forEach((t) => (bocas[t] = decalSup(S.head, bocaTex(t), 0.056, 0.028, 0, MY, zAt, { dz: 0.003 }))); ["dentes", "grito"].forEach((t) => (bocas[t] = decalSup(S.head, bocaTex(t), 0.07, 0.036, 0, MY - 0.002, zAt, { dz: 0.0034 })));
  if (P.bocaRyuk) bocas.ryuk = decalSup(S.head, bocaTex("ryuk"), 0.12, 0.06, 0, MY + 0.004, zAt, { dz: 0.0034 });
  const sombra = decalSup(S.head, sombraTex, 0.15, 0.08, 0, EY + 0.012, zAt, { dz: 0.0042, suave: true, sx: 16, sy: 6 }); sombra.visible = false;
  const suor = decal(S.head, suorTex, 0.016, 0.024, 0.068, EY + 0.05, zAt(0.068, EY + 0.05) + 0.004, 0.5, 0, { suave: true }); suor.visible = false;
  const lagrimas = [-1, 1].map((k) => { const m = decalSup(S.head, lagrimaTex, 0.012, 0.05, k * 0.04, EY - 0.045, zAt, { dz: 0.0036, suave: true }); m.visible = false; return m; });
  if (P.blush) [-1, 1].forEach((k) => decal(S.head, blushTex, 0.042, 0.022, k * 0.045, 0.061, zAt(k * 0.045, 0.061) + 0.003, k * 0.15, 0, { suave: true }));
  let extras = null;
  if (P.sukuna) { // marcas do Sukuna
    extras = [-1, 1].map((k) => { const y = EY - 0.026, g = grp(S.head, k * 0.037, y, zAt(k * 0.037, y) + 0.003); g.rotation.set(0, 0, k * 0.1); decal(g, olhoExtraTex, 0.032, 0.012, 0, 0, 0); return g; });
    [-1, 1].forEach((k) => { const g = grp(S.head, k * 0.052, 0.048, zAt(k * 0.052, 0.048) + 0.004); g.rotation.set(0, k * 0.3, 0); decal(g, bochechaTex, 0.034, 0.017, 0, 0, 0, 0, 0, { espelho: k < 0 }); });
    decal(S.head, testaTex, 0.058, 0.014, 0, EY + 0.056, zAt(0, EY + 0.056) + 0.004);
  }
  S.head.add(headM);
  if (P.venda) { // venda do Gojo: faixa que acompanha o bloco da cabeça na linha dos olhos
    const NS = 28, pos = [], idx = [], Yv = [-0.42, 0.44];
    for (let r = 0; r < 2; r++) for (let j2 = 0; j2 <= NS; j2++) { const v = supCab((j2 / NS) * Math.PI * 2, Yv[r], 0.0035); pos.push(v.x, v.y, v.z); }
    for (let j2 = 0; j2 < NS; j2++) { const a = j2, b = j2 + NS + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const vg = new THREE.BufferGeometry(); vg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); vg.setIndex(idx); vg.computeVertexNormals();
    mesh(vg, LPmat(0x121216, { side: THREE.DoubleSide, rim: 0.6, liso: true }), 0, 0, 0, S.head);
  }
  if (P.cabelo) cabeloLP(S.head, P.cabelo);
  S.head.scale.setScalar(P.cabecaEscala ?? 1.35); // cabeça grande como na referência (≈70% da largura dos ombros)
  S.root.scale.setScalar(P.scale);
  shadows(S.root);
  S.root.traverse((c) => { if (c.userData && c.userData.isDecal) { c.castShadow = false; c.receiveShadow = false; } });
  S.root.userData = { ...S, eyes: null, brows: null, mouth: null, hands, P, headM, kind: "lp", tails: [], scarfTails: [], lp: { olhos, fechados, brows, bocas, extras, sombra, suor, lagrimas } };
  restPose(S.root);
  return S.root;
}
// expressões: piscada (olho vira a linha fechada), olhos fechados, sobrancelhas (bravo/triste/sobe), boca (linha, sorriso,
// triste, aberta, risada) e fala (boca abrindo)
function rostoLP(p, t, f = {}) {
  const u = p.userData, L = u.lp; if (!L) return;
  const per = f.piscaCada ?? 3.4, ph = (t + hash(u.P.seed) * 5) % per, piscando = ph < 0.12;
  const fecha = f.fechados || (piscando && !((f.choque ?? 0) > 0.5));
  L.olhos.forEach((g) => (g.visible = !fecha)); L.fechados.forEach((g) => (g.visible = fecha));
  if (!fecha) L.olhos.forEach((g) => (g.scale.y = clamp(f.palpebra ?? 1, 0.3, 1.2)));
  if (L.extras) L.extras.forEach((g) => (g.visible = !fecha));
  L.brows.forEach((g, i) => { const k = i ? 1 : -1; g.rotation.z = g.userData.rz0 - k * ((f.bravo ?? 0) * 0.32 - (f.triste ?? 0) * 0.3); g.position.y = g.userData.y0 + (f.sobe ?? 0) * 0.006 - (f.bravo ?? 0) * 0.003; });
  const chq = (f.choque ?? 0) > 0.5;
  L.olhos.forEach((g) => { const m = g.children[0]; if (!m || !m.material.map) return; if (!m.userData.texN) { const P = u.P, base = olhoTex(P.olho, { fenda: P.fenda, alt: P.olhoAlt ?? 1, ...(P.fem ? { femi: true } : {}), ...(P.olhoOpts || {}), ir: 0.52 * (P.olhoOpts?.ir ?? 1) }); m.userData.texN = m.material.map; m.userData.texC = m.material.map.repeat.x < 0 ? espelho(base) : base; } const want = chq ? m.userData.texC : m.userData.texN; if (m.material.map !== want) { m.material.map = want; if (m.material.emissiveMap) m.material.emissiveMap = want; m.material.needsUpdate = true; } });
  if (L.sombra) { L.sombra.visible = (f.sombra ?? 0) > 0.02; L.sombra.material.opacity = clamp(f.sombra ?? 0); }
  if (L.suor) { L.suor.visible = (f.suor ?? 0) > 0.02; L.suor.position.y = CAB.EY + 0.05 - ((t * 0.03) % 0.03) * (f.suor ?? 0); }
  if (L.lagrimas) L.lagrimas.forEach((m) => { m.visible = (f.choro ?? 0) > 0.02; m.scale.y = Math.max(0.05, f.choro ?? 0); });
  let tipo = f.boca ?? "linha";
  if (f.fala) { const a = Math.abs(Math.sin(t * 12.5)) * f.fala; if (a > 0.4) tipo = "aberta"; L.bocas.aberta.scale.y = 0.6 + a * 0.5; }
  for (const k in L.bocas) L.bocas[k].visible = k === tipo;
}

// ---------------------------------------------------------------- elenco (v7): rosto em bloco retangular + touca justa com dentes
// touca: franjaY / ladoY / nucaY = altura (u) da borda na testa, nos lados e na nuca; dente = profundidade dos dentes (u);
// dentes = quantos em volta da cabeça; esp / espBorda = espessura (m) no alto e na borda (pouco volume, como no vídeo).
// pontas: [y (u), ph (frações de π: 0 testa, ±0,5 lados, 1 nuca), comprimento (u), largura (u), sobe (0 deitada, 1 em pé), pra trás, curva]
// anel de placas largas em volta da cabeça na altura y: n placas, comprimento L e largura W (u), sobe, pra trás;
// ph0/arco em frações de π (padrão: volta inteira começando na testa)
function coroa(n, y, L, W, sobe, tras, ph0 = 0, arco = 2, curva = 0.25, esp = 0.35) { const out = []; for (let i = 0; i < n; i++) { const f = arco >= 2 ? i / n : n === 1 ? 0.5 : i / (n - 1); out.push([y + (hash(i * 2.7 + y) - 0.5) * 0.06, ph0 + f * arco, L * (0.9 + hash(i * 1.3 + y) * 0.2), W, sobe, tras, curva, esp]); } return out; }
const JJK = { navy: 0x2f3b58, navy2: 0x222a3e, botao: 0xd4aa50 };
const CABELOS = {
  erenCrianca: { cor: 0x3a2618, dentes: 16, dente: 0.42, crista: 0.005, franjaY: 0.98, ladoY: 0.12, nucaY: -0.75, esp: 0.008, espBorda: 0.0034, varia: 0.08, seed: 2,
    // topo serrilhado: placas largas e baixas (não chifres), sobrepostas como escamas, com a ponta levantando um pouco
    pontas: coroa(7, 1.6, 0.36, 0.5, 0.55, 0.12, 0.08, 2, 0.05, 0.6) },
  undercut: { cor: 0x3e2226, dentes: 28, dente: 0.1, varia: 0.04, franjaY: 1.2, ladoY: 0.1, nucaY: -0.75, esp: 0.0026, espBorda: 0.0018 },
  yuji: { cor: 0xf09aa8, dentes: 14, dente: 0.3, crista: 0.0045, franjaY: 1.2, ladoY: 0.85, nucaY: 0.35, esp: 0.009, espBorda: 0.004, varia: 0.08, seed: 3,
    pontas: [[1.22, -0.06, 0.5, 0.34, -0.05, 0, -0.15, 0.5], [1.22, 0.08, 0.46, 0.32, -0.05, 0, -0.15, 0.5], // as duas mechas da franja caindo no meio da testa
      ...coroa(6, 1.42, 0.46, 0.46, 0.88, -0.12, -0.42, 0.84, 0.04, 0.6), ...coroa(5, 1.3, 0.4, 0.5, 0.45, 0.35, 0.58, 0.84, 0.06, 0.6)] }, // frente espetada pra cima; trás
  sukunaYuji: { cor: 0xf09aa8, dentes: 14, dente: 0.22, denteFranja: 0.2, crista: 0.0045, franjaY: 1.3, ladoY: 0.85, nucaY: 0.35, esp: 0.009, espBorda: 0.004, varia: 0.05, seed: 4,
    pontas: [...coroa(5, 1.2, 1.0, 0.6, 0.0, 0.75, -0.3, 0.6, -0.4, 0.45).map((q) => [...q, 1]), // penteado pra trás: mechas largas deitadas subindo da testa e dobrando pra trás
      ...coroa(5, 1.3, 0.4, 0.5, 0.45, 0.35, 0.58, 0.84, 0.06, 0.6)] },
  megumi: { cor: 0x2a2e3a, dentes: 14, dente: 0.46, crista: 0.005, franjaY: 1.0, ladoY: 0.2, nucaY: -0.55, esp: 0.01, espBorda: 0.0036, varia: 0.12, seed: 7,
    pontas: [...coroa(8, 1.5, 0.5, 0.56, 0.72, 0.04, 0.06, 2, 0.06, 0.6), ...coroa(6, 1.18, 0.46, 0.54, 0.55, 0.15, 0.3, 1.4, 0.06, 0.6)] }, // espetado pra todo lado, em tufos largos
  gojo: { cor: 0xe6eaf0, dentes: 14, dente: 0.38, crista: 0.0045, franjaY: 0.95, ladoY: 0.3, nucaY: -0.4, esp: 0.01, espBorda: 0.0036, varia: 0.1, seed: 9,
    pontas: [...coroa(8, 1.5, 0.5, 0.56, 0.85, 0.0, 0.06, 2, 0.06, 0.6), ...coroa(6, 1.25, 0.46, 0.52, 0.7, 0.1, 0.25, 1.5, 0.06, 0.6)] }, // pra cima
};
function yujiLP(o = {}) { return pessoaLP({ seed: 11, pele: 0xffe2b8, olho: "#b06a34", olhoAlt: 0.9, olhoTam: 0.96, capuz: 0xb3262c, roupa: JJK.navy, calca: JJK.navy, blush: true, sobrancelha: 0x4a2228, cabelo: { ...CABELOS.yuji, baixo: CABELOS.undercut }, ...o }); }
function sukunaYujiLP(o = {}) { return yujiLP({ seed: 12, olho: "#c41e2a", olhoAlt: 0.8, olhoInc: 0.05, blush: false, sukuna: true, brava: 0.6, cabelo: { ...CABELOS.sukunaYuji, baixo: CABELOS.undercut }, ...o }); }
function megumiLP(o = {}) { return pessoaLP({ seed: 21, pele: 0xfde0b6, olho: "#2f6070", olhoAlt: 0.8, olhoTam: 0.96, brava: 0.35, roupa: JJK.navy, calca: JJK.navy, sobrancelha: 0x14161c, cabelo: CABELOS.megumi, ...o }); }
function sukunaMegumiLP(o = {}) { return megumiLP({ seed: 22, olho: "#c41e2a", olhoInc: 0.05, sukuna: true, brava: 0.65, ...o }); }
function gojoLP(o = {}) { return pessoaLP({ seed: 31, pele: 0xffe6c8, venda: true, roupa: JJK.navy2, calca: JJK.navy2, scale: 1.08, cabelo: CABELOS.gojo, ...o }); }
// calibração: o Eren criança da referência (cena da árvore), pra comparar rosto e cabelo lado a lado
function erenCriancaLP(o = {}) { return pessoaLP({ seed: 6, pele: 0xffdcaa, olho: "#2a9a88", olhoAlt: 0.94, blush: true, roupa: 0x5c7a46, calca: 0x4a5a3a, botoes: false, sobrancelha: 0x2e1e14, cabelo: CABELOS.erenCrianca, ...o }); }
