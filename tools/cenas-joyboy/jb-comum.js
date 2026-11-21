// ================================================================ vídeo: Quem é o Joy Boy? (comum)
// Personagens e símbolos originais: nada desenhado da série; nomes só no texto e na narração.
// Animação v4: tecido e cabelo com mola (reagem a arrancadas, paradas e ao balanço do navio), gargalhada com o corpo
// inteiro, pés plantados no convés que balança, elefante de quatro patas com os pés plantados, gigante de ferro que
// desperta com antecipação, expressões presas à fala e câmera contínua.

// ---------------------------------------------------------------- câmera: posição em curva contínua (Catmull-Rom), olhar sem ultrapassar o alvo
// (o ponto de olhar interpola suave entre as chaves; evita a câmera "chicotear" quando os alvos estão muito longe um do outro)
function path2(t, ks) {
  const c = path(t, ks), n = ks.length;
  if (t <= ks[0][0] || t >= ks[n - 1][0]) return c;
  let i = 0; while (i < n - 2 && t > ks[i + 1][0]) i++;
  const u = sm(seg(t, ks[i][0], ks[i + 1][0]));
  return { ...c, look: lerp3(ks[i][2], ks[i + 1][2], u) };
}
// ---------------------------------------------------------------- utilidades de pose (pés plantados em posições dadas)
function plantFeet(p, feet, ang, toe = [0, 0]) {
  const u = p.userData; p.updateMatrixWorld(true);
  [0, 1].forEach((i) => {
    const f = feet[i]; legIK(p, i, V3(f[0], f[1], f[2]), V3(f[0] + Math.sin(ang) * 1.2, f[1] + 0.6, f[2] + Math.cos(ang) * 1.2));
    u.knee[i].updateMatrixWorld(true); u.knee[i].getWorldQuaternion(_gq); _gq.invert(); _gq2.setFromEuler(_gE.set(-(toe[i] || 0), ang, 0, "YXZ")); u.ankle[i].quaternion.copy(_gq.multiply(_gq2));
  });
}
const standPos = (x, z, ang, hw = 0.11, fwd = [0.05, -0.05], y = 0) => [0, 1].map((i) => { const side = (i ? 1 : -1) * hw; return [x + Math.cos(ang) * side + Math.sin(ang) * fwd[i], y, z - Math.sin(ang) * side + Math.cos(ang) * fwd[i]]; });

// ---------------------------------------------------------------- personagens (originais)
// chapéu de três pontas com pena
function tricornio(head, col = 0x1a1410, trim = 0xc8a050, pena = 0xf2ede0) {
  const h = grp(head, 0, 0.215, -0.005); h.rotation.x = 0.08;
  const m = TM(col);
  ol(mesh(cyl(0.085, 0.095, 0.09, 20), m, 0, 0.035, 0, h), 0.003);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + Math.PI / 3; const w = grp(h, 0, -0.005, 0); w.rotation.y = a; const b = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.01, 24, 1, false, -0.55, 1.1), m, 0, 0, 0, w); b.rotation.x = 0; const up = grp(w, 0, 0, 0.13); const wall = mesh(box(0.2, 0.07, 0.012), m, 0, 0.03, 0, up); up.rotation.x = -0.75; mesh(box(0.2, 0.008, 0.014), TM(trim), 0, 0.066, 0, up); }
  const pl = grp(h, 0.06, 0.06, -0.02); pl.rotation.set(-0.5, 0, -0.5);
  mesh(lockGeo([[0, 0, 0], [0.02, 0.08, -0.03], [0.05, 0.16, -0.09], [0.08, 0.2, -0.16]], 0.022, 0.004, 0.3, 12, 6), TM(pena, { side: THREE.DoubleSide }), 0, 0, 0, pl);
  h.userData.pena = pl;
  return h;
}
function bandana(head, col) { const b = mesh(new THREE.TorusGeometry(0.083, 0.014, 6, 30), TM(col), 0, 0.182, -0.012, head); b.rotation.x = Math.PI / 2 + 0.28; b.scale.set(1, 1.12, 1); const k = mesh(sph(0.02, 8, 6), TM(col), 0, 0.15, -0.105, head); return b; }
// o capitão que ri: barba cheia, casaco comprido verde-escuro, chapéu de três pontas com pena
const CAPITAO = { hair: 0x2a1a12, hairStyle: "longo", hairLen: 0.85, beard: 0x2a1a12, skin: SKINS.media, iris: 0x3a2a1a, jacket: 0x1e4a48, shirt: 0xe8e0cc, pants: 0x2a2430, boots: 0x1a120c, belt: 0x4a2a14, coatTail: true, jacketOpen: 0.36, cuff: 0xc8a050, seed: 41, brow: 0x2a1a12, lip: 0x9a5848 };
function barba(head, col, zAt) {
  const m = TM(col, { side: THREE.DoubleSide }), b = grp(head, 0, 0, 0);
  // barba de mechas que nascem na linha da mandíbula (abaixo da boca, que fica livre para rir)
  for (let row = 0; row < 2; row++) for (let i = 0; i < 22; i++) {
    const a = (i / 21 - 0.5) * 2.3, x = Math.sin(a) * 0.066, y = 0.036 - row * 0.016 - (1 - Math.cos(a)) * 0.03 + Math.min(0.012, Math.abs(a) * 0.012), z = (zAt ? zAt(x, y) : 0.07) - 0.006;
    const len = 0.05 + (1 - Math.abs(a) / 1.2) * 0.035 + hash(i + row * 31) * 0.012, dz = Math.cos(a) * 0.022, dx = Math.sin(a) * 0.012;
    mesh(lockGeo([[x, y, z], [x + dx * 0.5, y - len * 0.5, z + dz], [x + dx, y - len, z + dz * 0.6]], 0.008, 0.002, 0.55, 6, 5), m, 0, 0, 0, b);
  }
  mesh(sph(1, 12, 10), m, 0, 0.018, (zAt ? zAt(0, 0.022) : 0.07) - 0.012, b).scale.set(0.035, 0.022, 0.02);
  [-1, 1].forEach((k) => mesh(lockGeo([[k * 0.004, 0.069, (zAt ? zAt(0, 0.069) : 0.09) + 0.002], [k * 0.018, 0.066, (zAt ? zAt(k * 0.018, 0.066) : 0.09) + 0.001], [k * 0.032, 0.058, (zAt ? zAt(k * 0.032, 0.058) : 0.08) - 0.002], [k * 0.04, 0.064, (zAt ? zAt(k * 0.04, 0.064) : 0.08) - 0.006]], 0.0055, 0.0018, 0.6, 8, 5), m, 0, 0, 0, b));
  return b;
}
function capitao(o = {}) { const p = pessoa({ ...CAPITAO, beard: null, ...o }); const u = p.userData; u.tails.forEach((tl) => tl.scale.set(1.2, 1.35, 1)); u.hat = tricornio(u.head); u.hat.scale.setScalar(0.86); u.barba = barba(u.head, CAPITAO.beard, (x, y) => surfZ(u.headM, x, y)); return p; }
// tripulação (variações)
function tripulante(i) {
  const V = [
    { hair: 0x1a1210, hairStyle: "careca", skin: SKINS.morena, jacket: null, shirt: 0xd8c8a8, pants: 0x3a3028, boots: 0x2a1c12, belt: 0x5a3a1a, beard: 0x1a1210, seed: 51, band: 0xb8302a, dims: { shW: 0.21, chest: 0.21 } },
    { hair: 0x8a5a2a, hairStyle: "curto", skin: SKINS.clara, jacket: 0x3a4a6a, shirt: 0xf0e8dc, pants: 0x2a2a34, boots: 0x1a1410, seed: 52, band: 0xe8e0d0, dims: { thigh: 0.46, shin: 0.46 } },
    { hair: 0xa8402a, hairStyle: "longo", skin: SKINS.clara, jacket: 0x5a2a3a, shirt: 0xe8d8c0, pants: 0x2a2028, boots: 0x3a2014, seed: 53, lip: 0xc05a5a, hairLen: 1.2 },
    { hair: 0xb8b0a8, hairStyle: "curto", skin: SKINS.media, jacket: 0x4a3a28, shirt: 0xd0c8b0, pants: 0x3a3a3a, boots: 0x2a2018, beard: 0xc8c0b8, seed: 54, eyepatch: true },
  ][i % 4];
  const p = pessoa(V); if (V.band) bandana(p.userData.head, V.band); return p;
}
// o jovem pirata (original): cabelo preto bagunçado, camisa branca larga, bandana azul no pescoço
const JOVEM = { hair: 0x141218, hairStyle: "espetado", skin: SKINS.media, iris: 0x2a1a12, jacket: null, shirt: 0xf2eee4, pants: 0x34343e, boots: 0x3a2a1a, belt: 0x6a3a1a, scarf: 0x2a5ab8, seed: 61, brow: 0x141218, lip: 0xa85a50 };
const jovem = (o = {}) => pessoa({ ...JOVEM, ...o });
// o homem de luz (Joy Boy): silhueta de luz quente com um cachecol comprido; o rosto fica escondido pela luz
function homemLuz(o = {}) {
  const p = pessoa({ hairStyle: "curto", hair: 0xffffff, jacket: 0xffffff, coatTail: true, scarf: 0xffffff, fingers: true, seed: 71, ...o });
  const u = p.userData, core = new THREE.MeshBasicMaterial({ color: new THREE.Color(o.cor ?? 0xffd49a).multiplyScalar(o.brilho ?? 1.05) }), edge = olMat(0.008, 0xff9a30);
  p.traverse((c) => { if (c.isMesh) { if (c.userData.isOutline) c.material = edge; else { c.material = core; c.castShadow = false; } } });
  u.eyes.forEach((e) => (e.g.visible = false)); u.brows.forEach((b) => (b.visible = false)); if (u.mouth) u.mouth.g.visible = false;
  [...u.tails, ...u.scarfTails].forEach((tl) => tl.scale.set(1.1, o.cachecol ?? 2.2, 1));
  const gl = glowSprite(0xffc870, 3.2, 0.2); gl.position.y = 1.1; p.add(gl); const hg = glowSprite(0xfff0d0, 0.7, 0.55); hg.position.set(0, 0.12, 0.02); u.head.add(hg);
  const L = new THREE.PointLight(0xffc870, o.luz ?? 2.0, 7, 1.6); L.position.set(0, 1.3, 0.6); p.add(L);
  u.core = core; u.glow = gl; u.L = L;
  return p;
}

// ---------------------------------------------------------------- mar animado (ondas somadas) e o navio que balança nele
const ONDAS = [[0.9, 0.11, 0.0, 0.85], [0.55, 0.19, 1.3, 1.25], [0.32, 0.31, 2.4, 1.7], [0.18, 0.47, 0.6, 2.3]]; // amplitude, número de onda, direção, velocidade
function ondaH(x, z, t, A = 1) { let h = 0; for (const [a, k, d, sp] of ONDAS) { const dx = Math.cos(d), dz = Math.sin(d); h += a * A * Math.sin((x * dx + z * dz) * k - t * sp); } return h; }
function oceano(g, o = {}) {
  const size = o.size ?? 420, segs = o.segs ?? 150, A = o.amp ?? 1;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs); geo.rotateX(-Math.PI / 2);
  const cols = new Float32Array(geo.attributes.position.count * 3); geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  const m = mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.rough ?? 0.2, metalness: 0.25, envMap: o.env ?? envGold(), envMapIntensity: o.envI ?? 0.55 }), o.x ?? 0, o.y ?? 0, o.z ?? 0, g); m.castShadow = false; m.frustumCulled = false;
  const base = Float32Array.from(geo.attributes.position.array), deep = new THREE.Color(o.deep ?? 0x0c2a3a), crest = new THREE.Color(o.crest ?? 0x5a8a98), foam = new THREE.Color(o.foam ?? 0xe8f0f0), c = new THREE.Color();
  return { m, upd(t) {
    const a = geo.attributes.position;
    for (let i = 0; i < a.count; i++) { const x = base[i * 3] + (o.x ?? 0), z = base[i * 3 + 2] + (o.z ?? 0), h = ondaH(x, z, t, A); a.setY(i, h); const k = clamp((h / (1.5 * A) + 0.5)); c.copy(deep).lerp(crest, k); if (k > 0.86) c.lerp(foam, (k - 0.86) * 4); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    a.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeVertexNormals();
  } };
}
// pose do navio sobre as ondas: altura, arfagem (proa sobe e desce) e balanço lateral
function naviaPose(x, z, ang, t, L = 12, W = 3.4, A = 1) {
  const fx = Math.sin(ang), fz = Math.cos(ang), sx = Math.cos(ang), sz = -Math.sin(ang);
  const hb = ondaH(x + fx * L * 0.42, z + fz * L * 0.42, t, A), hs = ondaH(x - fx * L * 0.42, z - fz * L * 0.42, t, A);
  const hp = ondaH(x - sx * W * 0.5, z - sz * W * 0.5, t, A), hr = ondaH(x + sx * W * 0.5, z + sz * W * 0.5, t, A);
  return { y: (hb + hs + hp + hr) / 4, pitch: Math.atan2(hb - hs, L * 0.84) * 0.8, roll: Math.atan2(hr - hp, W) * 0.55 };
}
// casco por seções (proa afinando, quilha curva, popa alta)
function cascoGeo(L, W, D) {
  const nz = 28, nt = 16, pos = [], idx = [];
  for (let i = 0; i <= nz; i++) {
    const u = i / nz, z = (u - 0.5) * L, bow = u > 0.72 ? Math.pow((u - 0.72) / 0.28, 1.6) : 0, stern = u < 0.1 ? (0.1 - u) / 0.1 : 0;
    const w = W * 0.5 * (1 - bow * 0.95) * (1 - stern * 0.12), d = D * (1 - bow * 0.45), top = 0.15 * bow * D + 0.35 * stern * D;
    for (let j = 0; j <= nt; j++) { const th = -Math.PI / 2 + (j / nt) * Math.PI; pos.push(Math.sin(th) * w, top - Math.cos(th) * d + (Math.abs(Math.sin(th)) > 0.95 ? 0 : 0), z); }
  }
  for (let i = 0; i < nz; i++) for (let j = 0; j < nt; j++) { const a = i * (nt + 1) + j, b = a + nt + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const uv = []; for (let i = 0; i <= nz; i++) for (let j = 0; j <= nt; j++) uv.push(i / nz * 4, j / nt); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}
// bandeira com o sol que ri (símbolo original)
const solRiTex = canvasTex(256, 192, (c, w, h) => {
  c.fillStyle = "#141018"; c.fillRect(0, 0, w, h); const cx = w / 2, cy = h / 2, r = 44;
  c.fillStyle = "#ffd25a"; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(a - 0.12) * r * 1.05, cy + Math.sin(a - 0.12) * r * 1.05); c.lineTo(cx + Math.cos(a) * r * 1.7, cy + Math.sin(a) * r * 1.7); c.lineTo(cx + Math.cos(a + 0.12) * r * 1.05, cy + Math.sin(a + 0.12) * r * 1.05); c.fill(); }
  c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); c.fillStyle = "#141018";
  c.beginPath(); c.ellipse(cx - 15, cy - 10, 5, 8, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(cx + 15, cy - 10, 5, 8, 0, 0, 7); c.fill();
  c.beginPath(); c.arc(cx, cy + 4, 24, 0.15, Math.PI - 0.15); c.lineTo(cx - 22, cy + 10); c.fill();
});
function bandeira(g, x, y, z, w = 2.2, h = 1.5, tex = solRiTex) {
  const geo = new THREE.PlaneGeometry(w, h, 10, 6); geo.translate(w / 2, -h / 2, 0);
  const m = mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }), x, y, z, g); m.userData.base = Float32Array.from(geo.attributes.position.array); m.frustumCulled = false;
  return { m, upd(t, wind = 1) { const a = geo.attributes.position, b = m.userData.base; for (let i = 0; i < a.count; i++) { const xx = b[i * 3], yy = b[i * 3 + 1], k = xx / w; a.setZ(i, (Math.sin(t * 5.5 - xx * 3.2) * 0.16 + Math.sin(t * 8.1 - xx * 5 + yy * 2) * 0.05) * k * wind); a.setY(i, yy - k * k * 0.12 * (1.2 - wind * 0.4)); } a.needsUpdate = true; geo.computeVertexNormals(); } };
}
// vela que enfuna (pano preso à verga)
function vela(g, x, y, z, w, h, col = 0xf0e6d0) {
  const geo = new THREE.PlaneGeometry(w, h, 8, 8); geo.translate(0, -h / 2, 0);
  const m = mesh(geo, new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.95 }), x, y, z, g); m.userData.base = Float32Array.from(geo.attributes.position.array); m.frustumCulled = false;
  return (t, wind = 1) => { const a = geo.attributes.position, b = m.userData.base; for (let i = 0; i < a.count; i++) { const xx = b[i * 3] / (w / 2), yy = -b[i * 3 + 1] / h, bel = (1 - xx * xx) * Math.sin(yy * Math.PI) * (0.55 + 0.08 * Math.sin(t * 1.7)) * wind; a.setZ(i, bel + Math.sin(t * 3 + yy * 4 + xx * 2) * 0.03 * wind); } a.needsUpdate = true; geo.computeVertexNormals(); };
}
// navio original (galeão): casco, convés, castelo de popa, mastros com velas, cordame, gurupés e figura de proa
function navio(g, o = {}) {
  const nv = grp(g), L = o.L ?? 13, W = o.W ?? 3.6, D = o.D ?? 1.9, deckY = 0.55;
  const tp = texPlanks([120, 82, 50], [92, 62, 38]), wood = SM(0xffffff, { map: rep(tp.map.clone(), 2, 1), normalMap: tp.normalMap, roughness: 0.8 }); wood.map.needsUpdate = true;
  const hullM = SM(o.casco ?? 0x5a3a24, { map: rep(texPlanks([110, 70, 44], [80, 52, 32]).map.clone(), 4, 1), roughness: 0.75 }); hullM.map.needsUpdate = true;
  const hull = mesh(cascoGeo(L, W, D), hullM, 0, deckY, 0, nv); hull.material.side = THREE.DoubleSide;
  mesh(box(W * 0.92, 0.12, L * 0.84), wood, 0, deckY - 0.02, -L * 0.04, nv);
  mesh(box(W * 0.98, 0.18, L * 0.86), SM(o.faixa ?? 0xc8a050, { metalness: 0.5, roughness: 0.4 }), 0, deckY - 0.35, -L * 0.04, nv).scale.set(1, 1, 1);
  // amuradas
  [-1, 1].forEach((sd) => { mesh(box(0.1, 0.55, L * 0.78), wood, sd * W * 0.45, deckY + 0.28, -L * 0.06, nv); mesh(box(0.16, 0.06, L * 0.78), SM(0x3a2414), sd * W * 0.45, deckY + 0.57, -L * 0.06, nv); });
  // castelo de popa com janelas acesas
  const cast = grp(nv, 0, deckY, -L * 0.36); mesh(box(W * 0.9, 1.6, L * 0.22), wood, 0, 0.8, 0, cast); mesh(box(W * 0.96, 0.12, L * 0.24), SM(0x3a2414), 0, 1.62, 0, cast);
  for (let i = 0; i < 3; i++) mesh(box(0.5, 0.45, 0.06), o.noite ? BM(0xffb860) : SM(0x2a2218), (i - 1) * 0.9, 0.85, -L * 0.11 - 0.02, cast);
  // mastros, vergas e velas
  const masts = o.mastros ?? [[0.12, 9.5], [-0.2, 8.0]], velas = [];
  masts.forEach(([zf, hgt], i) => {
    const z = zf * L, m = mesh(cyl(0.11, 0.16, hgt, 10), SM(0x5a3a22), 0, deckY + hgt / 2, z, nv);
    [[0.55, 3.2, 2.6], [0.85, 2.4, 1.8]].forEach(([yf, w, h]) => { const y = deckY + hgt * yf; mesh(cyl(0.06, 0.06, w + 0.4, 8), SM(0x4a3020), 0, y, z, nv).rotation.z = Math.PI / 2; velas.push(vela(nv, 0, y - 0.05, z + 0.08, w, h, o.vela ?? 0xf0e6d0)); });
    mesh(cyl(0.12, 0.12, 0.25, 10), SM(0x3a2414), 0, deckY + hgt * 0.7, z, nv);
  });
  const topMast = masts[0], flag = bandeira(nv, 0, deckY + topMast[1] + 0.1, topMast[0] * L, o.bw ?? 1.9, o.bh ?? 1.3, o.flagTex ?? solRiTex);
  // gurupés e cordame
  const bs = mesh(cyl(0.07, 0.11, 4.2, 8), SM(0x5a3a22), 0, deckY + 1.0, L * 0.55, nv); bs.rotation.x = Math.PI / 2 - 0.35;
  const rope = SM(0x2a2018);
  masts.forEach(([zf, hgt]) => [-1, 1].forEach((sd) => { const a = V3(sd * W * 0.45, deckY + 0.5, zf * L - 1.2), b = V3(0, deckY + hgt * 0.92, zf * L), d = b.clone().sub(a); const r = mesh(cyl(0.012, 0.012, d.length(), 4), rope, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, nv); r.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); }));
  // figura de proa: um sol dourado
  const fh = grp(nv, 0, deckY + 0.35, L * 0.5); const gm = GOLDM(); mesh(cyl(0.32, 0.32, 0.08, 24), gm, 0, 0, 0, fh).rotation.x = Math.PI / 2;
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = mesh(new THREE.ConeGeometry(0.07, 0.3, 4), gm, Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0, fh); r.rotation.z = a - Math.PI / 2; }
  fh.rotation.x = -0.4;
  shadows(nv);
  nv.userData = { velas, flag, deckY, L, W };
  return nv;
}

// ---------------------------------------------------------------- a pedra indestrutível (cubo de pedra escura com inscrições originais)
const glifoTex = canvasTex(512, 512, (c, w, h) => {
  c.fillStyle = "#000"; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 5; c.lineCap = "round";
  for (let r = 0; r < 9; r++) for (let k = 0; k < 9; k++) { const x = 40 + k * 50, y = 40 + r * 50, s = hash(r * 9 + k);
    c.beginPath(); if (s < 0.25) { c.arc(x, y, 12, 0.4, 5.5); } else if (s < 0.5) { c.moveTo(x - 12, y - 12); c.lineTo(x, y + 12); c.lineTo(x + 12, y - 12); } else if (s < 0.75) { c.moveTo(x - 12, y); c.lineTo(x + 12, y); c.moveTo(x, y - 12); c.lineTo(x, y + 12); c.arc(x, y, 6, 0, 7); } else { c.rect(x - 10, y - 10, 20, 20); c.moveTo(x - 10, y + 14); c.lineTo(x + 10, y + 14); } c.stroke(); }
}, { linear: true });
function pedraEterna(g, x, y, z, s = 2.4) {
  const st = texPair(256, (u, v) => fbm2(u * 6, v * 6, 4, 6) * 0.7 + 0.3, (u, v, h) => mixc([60, 22, 26], [92, 40, 42], h), 2.0);
  const m = new THREE.MeshStandardMaterial({ map: st.map, normalMap: st.normalMap, roughness: 0.55, metalness: 0.15, emissive: 0xffc060, emissiveMap: glifoTex, emissiveIntensity: 0 });
  const c = mesh(box(s, s, s), m, x, y + s / 2, z, g);
  return { c, m };
}

// ---------------------------------------------------------------- o gigante de ferro (colosso antigo original)
function colosso(o = {}) {
  const root = new THREE.Group(), sc = o.s ?? 1;
  const rt = texPair(256, (u, v) => fbm2(u * 8, v * 8, 4, 8), (u, v, h) => mixc(mixc([92, 86, 80], [70, 60, 52], h), [140, 70, 40], clamp((fbm2(u * 3 + 5, v * 3, 3, 3) - 0.55) * 3) * 0.6), 2.5);
  const metal = new THREE.MeshStandardMaterial({ map: rt.map, normalMap: rt.normalMap, roughness: 0.6, metalness: 0.65, envMap: envGold(), envMapIntensity: 0.35 });
  const dark = SM(0x2a2622, { metalness: 0.5, roughness: 0.6 }), glowC = new THREE.MeshBasicMaterial({ color: 0xffb040 });
  const hips = grp(root, 0, 2.2, 0), torso = grp(hips, 0, 0.4, 0), head = grp(torso, 0, 3.0, 0.2);
  mesh(box(2.4, 1.0, 1.6), metal, 0, 0, 0, hips);
  const tb = mesh(sph(1, 24, 18), metal, 0, 1.5, 0, torso); tb.scale.set(1.7, 1.6, 1.25);
  mesh(box(3.6, 0.5, 1.4), metal, 0, 2.5, 0, torso);
  const core = mesh(sph(0.34, 18, 14), glowC, 0, 1.7, 1.22, torso); const coreG = glowSprite(0xffb040, 2.4, 0.0); coreG.position.set(0, 1.7, 1.5); torso.add(coreG);
  mesh(new THREE.TorusGeometry(0.42, 0.07, 8, 24), dark, 0, 1.7, 1.18, torso);
  for (let i = 0; i < 5; i++) mesh(box(2.2, 0.08, 0.1), dark, 0, 0.6 + i * 0.36, 1.12 + Math.sin(i) * 0.02, torso).rotation.x = 0.1;
  const hd = mesh(new THREE.CylinderGeometry(0.72, 0.85, 1.25, 8, 1), metal, 0, 0.6, 0, head); mesh(new THREE.ConeGeometry(0.73, 0.45, 8), metal, 0, 1.45, 0, head).rotation.y = Math.PI / 8; mesh(box(0.14, 0.9, 1.5), dark, 0, 1.35, 0, head); mesh(box(1.5, 0.3, 0.3), dark, 0, 0.2, 0.62, head);
  const visor = mesh(box(1.1, 0.12, 0.2), glowC, 0, 0.72, 0.74, head); const visG = glowSprite(0xffb040, 1.6, 0); visG.position.set(0, 0.62, 0.8); head.add(visG);
  mesh(box(0.25, 0.5, 0.25), dark, 0, 1.35, 0, head);
  const arms = [-1, 1].map((k) => {
    const sh = grp(torso, k * 2.0, 2.3, 0); mesh(sph(0.6, 16, 12), metal, 0, 0, 0, sh);
    const up = mesh(cyl(0.42, 0.36, 2.0, 14), metal, 0, -1.0, 0, sh); const el = grp(sh, 0, -2.0, 0); mesh(sph(0.42, 14, 10), dark, 0, 0, 0, el);
    mesh(cyl(0.36, 0.32, 1.8, 14), metal, 0, -0.9, 0, el); const hand = grp(el, 0, -1.9, 0); mesh(box(0.8, 0.7, 0.5), metal, 0, -0.3, 0, hand);
    for (let f = 0; f < 3; f++) { const fg = grp(hand, (f - 1) * 0.25, -0.65, 0.05); mesh(cyl(0.1, 0.09, 0.45, 8), dark, 0, -0.22, 0, fg); fg.rotation.x = -0.4; }
    return { sh, el, hand };
  });
  const legs = [-1, 1].map((k) => { const hp = grp(hips, k * 0.85, -0.3, 0); mesh(cyl(0.55, 0.45, 1.8, 14), metal, 0, -0.9, 0, hp); const kn = grp(hp, 0, -1.8, 0); mesh(sph(0.5, 14, 10), dark, 0, 0, 0, kn); mesh(cyl(0.45, 0.5, 1.7, 14), metal, 0, -0.85, 0, kn); mesh(box(0.9, 0.35, 1.4), metal, 0, -1.75, 0.3, kn); return { hp, kn }; });
  // musgo e trepadeiras (ficou parado por séculos)
  const moss = SM(0x3a5a2a, { roughness: 1 }); for (let i = 0; i < 18; i++) { const a = hash(i * 3) * 6.28; const ms = mesh(sph(0.25 + hash(i) * 0.3, 8, 6), moss, Math.cos(a) * 1.5, 0.4 + hash(i * 5) * 2.6, Math.sin(a) * 1.1, torso); ms.scale.y = 0.4; }
  shadows(root); root.scale.setScalar(sc);
  root.userData = { hips, torso, head, arms, legs, core, coreG, visor, visG, glowC, metal };
  return root;
}
// pose sentada do colosso; acorda (0..1) com antecipação mecânica
function colossoPose(c, t, wake = 0, raise = 0) {
  const u = c.userData;
  u.hips.position.y = 1.0; u.legs.forEach((l, i) => { l.hp.rotation.set(-1.45, 0, (i ? 1 : -1) * 0.18); l.kn.rotation.x = 1.5; });
  u.torso.rotation.x = 0.35 - 0.3 * wake + Math.sin(t * 0.8) * 0.005 * wake; u.head.rotation.x = 0.6 - 0.75 * wake + (wake > 0 && wake < 1 ? Math.sin(t * 40) * 0.01 : 0);
  u.arms.forEach((a, i) => { a.sh.rotation.set(-0.5 + 0.2 * wake, 0, (i ? 1 : -1) * 0.35); a.el.rotation.x = -0.5; });
  if (raise > 0) { const a = u.arms[1]; a.sh.rotation.set(lerp(-0.3, -2.4, raise), lerp(0, -0.3, raise), lerp(0.35, 0.15, raise)); a.el.rotation.x = lerp(-0.5, -0.15, raise); a.hand.rotation.x = -0.6 * raise; }
  u.glowC.color.setRGB(1 * (0.15 + 0.85 * wake), 0.7 * (0.15 + 0.85 * wake), 0.25 * (0.15 + 0.85 * wake));
  u.coreG.material.opacity = 0.55 * wake + 0.4 * raise; u.visG.material.opacity = 0.5 * wake;
}

// ---------------------------------------------------------------- o elefante gigante (original), com as quatro patas plantadas
function elefante(o = {}) {
  const root = new THREE.Group(), sc = o.s ?? 1;
  const st = texPair(512, (u, v) => fbm2(u * 20, v * 20, 4, 20) * 0.5 + Math.abs(Math.sin(v * 140 + fbm2(u * 6, v * 6, 3, 6) * 6)) * 0.5, (u, v, h) => mixc([96, 92, 98], [132, 126, 128], h), 3.0);
  const skin = new THREE.MeshStandardMaterial({ map: rep(st.map, 3, 3), normalMap: rep(st.normalMap, 3, 3), roughness: 0.9 });
  const body = grp(root, 0, 0, 0); const B = mesh(sph(1, 32, 24), skin, 0, 0, 0, body); B.scale.set(1.0, 0.95, 1.55);
  // marcas antigas (faixas douradas desbotadas)
  const mk = SM(0xb89a5a, { roughness: 0.7, metalness: 0.3 }); for (let i = 0; i < 3; i++) { const r = mesh(new THREE.TorusGeometry(1.02, 0.03, 6, 48, Math.PI), mk, 0, 0, -0.6 + i * 0.6, body); r.rotation.y = Math.PI / 2; r.scale.set(1, 0.95, 1); }
  const head = grp(body, 0, 0.35, 1.45); mesh(sph(0.62, 24, 18), skin, 0, 0, 0, head).scale.set(1, 1.05, 0.95);
  const ears = [-1, 1].map((k) => { const e = grp(head, k * 0.42, 0.08, -0.12); const eg = new THREE.CircleGeometry(0.5, 20); eg.scale(1, 1.25, 1); eg.translate(k * 0.42, -0.1, 0); deform(eg, (v) => { v.z += (v.x * v.x) * 0.3; }); const m = mesh(eg, new THREE.MeshStandardMaterial({ map: st.map, side: THREE.DoubleSide, roughness: 0.9, color: 0xb8a8a8 }), 0, 0, 0, e); m.rotation.y = k * 0.35; return e; });
  [-1, 1].forEach((k) => { const tk = mesh(lockGeo([[0, 0, 0], [k * 0.08, -0.25, 0.18], [k * 0.1, -0.35, 0.48], [k * 0.05, -0.2, 0.75]], 0.07, 0.02, 0.9, 12, 8), SM(0xf2e8d2, { roughness: 0.5 }), k * 0.28, -0.25, 0.4, head); });
  [-1, 1].forEach((k) => { const ey = mesh(sph(0.05, 10, 8), BM(0x1a1210), k * 0.5, 0.12, 0.32, head); });
  const trunk = []; let par = grp(head, 0, -0.2, 0.55); for (let i = 0; i < 9; i++) { const r = 0.2 * (1 - i * 0.075); mesh(cyl(r * 0.92, r, 0.28, 12), skin, 0, -0.14, 0, par); const nx = grp(par, 0, -0.28, 0); trunk.push(par); par = nx; }
  // patas: coxa e canela (dois ossos para o IK), pés redondos
  const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    const hip = grp(body, sx * 0.62, -0.45, sz * 0.95); mesh(cyl(0.34, 0.3, 1.05, 14), skin, 0, -0.52, 0, hip);
    const knee = grp(hip, 0, -1.05, 0); mesh(sph(0.3, 12, 10), skin, 0, 0, 0, knee); mesh(cyl(0.3, 0.34, 0.95, 14), skin, 0, -0.47, 0, knee);
    const foot = grp(knee, 0, -0.95, 0); mesh(cyl(0.36, 0.38, 0.16, 16), SM(0x6a6060), 0, -0.02, 0, foot);
    return { hip, knee, foot, sx, sz };
  });
  const tail = grp(body, 0, 0.2, -1.5); mesh(lockGeo([[0, 0, 0], [0, -0.4, -0.15], [0, -0.85, -0.1]], 0.05, 0.02, 0.9, 8, 6), skin, 0, 0, 0, tail);
  // floresta e ruínas nas costas
  const back = grp(body, 0, 0.82, 0); const grass = SM(0x4a6a2a, { roughness: 1 }); const gm = mesh(sph(1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.35), grass, 0, -0.62, 0, back); gm.scale.set(0.95, 0.8, 1.45);
  for (let i = 0; i < 26; i++) { const a = hash(i * 3.3) * 6.28, r = Math.sqrt(hash(i * 5.7)) * 0.75, x = Math.cos(a) * r * 0.8, z = Math.sin(a) * r * 1.3; const tg = grp(back, x, -0.1 - r * r * 0.25, z); mesh(cyl(0.02, 0.035, 0.35, 5), SM(0x4a3020), 0, 0.17, 0, tg); const f = mesh(foliageGeo(i), SM(new THREE.Color(0x3a6a2a).offsetHSL((hash(i) - 0.5) * 0.04, 0, (hash(i * 2) - 0.5) * 0.1).getHex(), { roughness: 0.85 }), 0, 0.42, 0, tg); f.scale.setScalar(0.16 + hash(i * 7) * 0.12); }
  mesh(box(0.3, 0.25, 0.3), SM(0xc8b898), 0.25, -0.05, -0.35, back); mesh(cyl(0.05, 0.05, 0.4, 6), SM(0xc8b898), -0.3, 0.08, 0.4, back);
  shadows(root); root.scale.setScalar(sc);
  const D = { hipY: 2.45, L1: 1.05, L2: 1.0 };
  root.userData = { body, head, ears, trunk, legs, tail, D };
  return root;
}
// passo do elefante: sequência lateral (TE, DT? etc.) com cada pé plantado no apoio; d = distância andada (unidades do elefante)
function elefanteAnda(e, d, t, o = {}) {
  const u = e.userData, sc = e.scale.x, L = o.step ?? 0.9, ang = e.rotation.y, from = o.from ?? [0, 0, 0], hf = o.hf ?? (() => 0);
  const dx = Math.sin(ang), dz = Math.cos(ang);
  const px = from[0] + dx * d * sc, pz = from[2] + dz * d * sc;
  e.position.set(px, hf(px, pz), pz);
  const cyc = d / (2 * L), ph = cyc * Math.PI * 2;
  u.body.position.y = u.D.hipY + Math.cos(ph * 2) * 0.03; u.body.rotation.z = Math.sin(ph) * 0.025; u.body.rotation.x = Math.sin(ph * 2) * 0.008;
  e.updateMatrixWorld(true);
  const offs = [0.0, 0.5, 0.75, 0.25];
  u.legs.forEach((lg, i) => {
    const dd = d + offs[i] * 2 * L, k = Math.floor(dd / (2 * L)), uu = dd / (2 * L) - k, stance = 0.7;
    const plant = (kk) => kk * 2 * L - offs[i] * 2 * L + stance * L;
    let fd, lift = 0; if (uu < stance) fd = plant(k); else { const s = E.inOut((uu - stance) / (1 - stance)); fd = lerp(plant(k), plant(k + 1), s); lift = Math.sin(s * Math.PI) * 0.35; }
    const target = e.localToWorld(V3(lg.sx * 0.62, 0.17 + lift, lg.sz * 0.95 + (fd - d)));
    const pole = e.localToWorld(V3(lg.sx * 0.62, 1.2, lg.sz * 0.95 + (lg.sz > 0 ? -2.5 : 2.5)));
    ik2(lg.hip, lg.knee, u.D.L1, u.D.L2 + 0.12, target, pole, 1, 1);
  });
  // tromba balançando em onda (cada segmento com atraso), orelhas abanando, rabo
  u.trunk.forEach((s, i) => { s.rotation.x = (o.ergue ?? 0) * -0.42 * (i < 7 ? 1 : 0.5) + Math.sin(t * 1.6 - i * 0.55) * 0.08 * (1 - (o.ergue ?? 0)) + 0.05; s.rotation.z = Math.sin(t * 1.1 - i * 0.4) * 0.05; });
  u.ears.forEach((ea, i) => (ea.rotation.y = (i ? -1 : 1) * (0.15 + 0.25 * Math.max(0, Math.sin(t * 2.2 + i))) + (o.ergue ?? 0) * (i ? -0.5 : 0.5)));
  u.head.rotation.x = -0.25 * (o.ergue ?? 0) + Math.sin(ph * 2) * 0.02; u.tail.rotation.set(Math.sin(t * 1.4) * 0.2, 0, Math.sin(t * 2.3) * 0.3);
}

// ---------------------------------------------------------------- palmeira, painel holográfico, peixes
function palmeira(g, x, y, z, h = 6, seed = 1) {
  const p = grp(g, x, y, z), bend = 0.6 + hash(seed) * 0.8, dir = hash(seed * 3) * 6.28;
  const pts = [0, 0.3, 0.6, 1].map((u) => [Math.cos(dir) * bend * u * u, h * u, Math.sin(dir) * bend * u * u]);
  mesh(lockGeo(pts, 0.18, 0.11, 1, 12, 9), SM(0x6a5038, { roughness: 1 }), 0, 0, 0, p);
  const top = V3(...pts[3]), lm = SM(0x2a5a28, { side: THREE.DoubleSide, roughness: 0.85 }), leaves = [];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + hash(seed + i) * 0.4, len = 2.2 + hash(i * 3 + seed) * 0.8; const lg = new THREE.PlaneGeometry(len, 0.55, 8, 1); lg.translate(len / 2, 0, 0); deform(lg, (v) => { v.y -= (v.x / len) ** 2 * 1.1; v.z += Math.abs(v.y) * 0.0; }); const lf = mesh(lg, lm, top.x, top.y, top.z, p); lf.rotation.set(0, -a, -0.15); leaves.push(lf); }
  return { p, leaves, upd(t, w = 1) { leaves.forEach((lf, i) => (lf.rotation.z = -0.15 + Math.sin(t * 1.3 + i * 0.7 + seed) * 0.06 * w)); } };
}
function cardume(g, n, c, R, cor = 0xd8e8f0) {
  const geo = new THREE.ConeGeometry(0.06, 0.24, 5); geo.rotateX(Math.PI / 2);
  const im = new THREE.InstancedMesh(geo, SM(cor, { metalness: 0.6, roughness: 0.3 }), n); im.frustumCulled = false; g.add(im);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3();
  return (t) => { for (let i = 0; i < n; i++) { const a = t * 0.35 + (i / n) * Math.PI * 2 * 0.25 + hash(i) * 0.6, r = R * (0.7 + hash(i * 3) * 0.5); P.set(c[0] + Math.cos(a) * r, c[1] + Math.sin(t * 0.8 + i) * 0.4 + (hash(i * 5) - 0.5) * 1.2, c[2] + Math.sin(a) * r); Q.setFromEuler(new THREE.Euler(0, -a, 0)); M4.compose(P, Q, S); im.setMatrixAt(i, M4); } im.instanceMatrix.needsUpdate = true; };
}
