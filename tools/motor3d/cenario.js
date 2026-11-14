// ---------------------------------------------------------------- cenário v2: terreno, vegetação, pedra, construções
const WIND = { value: 0 };
// texturas base (geradas uma vez, repetíveis)
const TX = {};
function texGround() {
  if (TX.ground) return TX.ground;
  return (TX.ground = texPair(512, (u, v) => fbm2(u * 16, v * 16, 4, 16) * 0.6 + fbm2(u * 64, v * 64, 2, 64) * 0.4,
    (u, v, h) => { const n = fbm2(u * 6, v * 6, 4, 6); const c = mixc([196, 205, 170], [235, 238, 215], n); return mixc(c, [150, 150, 130], clamp((0.45 - h) * 1.5)); }, 2.5));
}
function texRock() {
  if (TX.rock) return TX.rock;
  return (TX.rock = texPair(512, (u, v) => { const a = fbm2(u * 6, v * 6, 5, 6); const cr = Math.abs(fbm2(u * 4 + 3, v * 4, 4, 4) - 0.5); return a * 0.8 + (cr < 0.02 ? -0.2 : 0) + 0.2; },
    (u, v, h) => { const c = mixc([120, 116, 110], [170, 166, 156], h); return mixc(c, [100, 112, 80], clamp((fbm2(u * 3, v * 3, 3, 3) - 0.6) * 3) * 0.5); }, 5));
}
// pedra em blocos (muralha): fileiras alternadas com argamassa funda
function texBlocks(c1 = [168, 160, 146], c2 = [140, 134, 124]) {
  const k = "blk" + c1 + c2; if (TX[k]) return TX[k];
  const rows = 8, cols = 4;
  const cell = (u, v) => { const r = Math.floor(v * rows), off = (r % 2) * 0.5, cu = u * cols + off, c = Math.floor(cu); return { r, c, fu: cu - c, fv: v * rows - r }; };
  return (TX[k] = texPair(512, (u, v) => { const q = cell(u, v); const edge = Math.min(q.fu, 1 - q.fu, (q.fv) * 0.5, (1 - q.fv) * 0.5); const mortar = edge < 0.03 ? 0 : sm(clamp((edge - 0.03) / 0.05)); return mortar * (0.75 + fbm2(u * 24, v * 24, 3, 24) * 0.25) + hash2(q.r, q.c) * 0.08; },
    (u, v, h) => { const q = cell(u, v); const base = mixc(c1, c2, hash2(q.r * 3, q.c * 7)); const dirt = fbm2(u * 5, v * 5, 4, 5); let c = mixc(base, [100, 96, 90], clamp((dirt - 0.55) * 2)); if (h < 0.2) c = [70, 66, 62]; return mixc(c, [80, 100, 60], clamp((fbm2(u * 7 + 3, v * 7, 3, 7) - 0.68) * 4) * (v > 0.7 ? 0.6 : 0.2)); }, 6, { rep: [1, 1] }));
}
function texPlanks(c1 = [120, 82, 50], c2 = [96, 64, 38]) {
  const k = "pl" + c1 + c2; if (TX[k]) return TX[k];
  return (TX[k] = texPair(512, (u, v) => { const p = Math.floor(u * 6), fu = u * 6 - p; const gap = fu < 0.03 || fu > 0.97 ? 0 : 1; return gap * (0.7 + fbm2(u * 4, v * 40 + p * 3, 3, 40) * 0.3); },
    (u, v, h) => { const p = Math.floor(u * 6); const base = mixc(c1, c2, hash(p * 3.3)); const grain = fbm2(u * 30 + p, v * 3, 4, 3); return h < 0.1 ? [40, 28, 18] : mixc(base, mixc(base, [60, 40, 24], 0.5), grain * 0.8); }, 3));
}
function texBark() {
  if (TX.bark) return TX.bark;
  return (TX.bark = texPair(256, (u, v) => { const n = fbm2(u * 10, v * 2.5, 4, 10); return clamp(Math.abs(Math.sin(u * 40 + n * 6)) * 0.6 + n * 0.4); },
    (u, v, h) => mixc([62, 44, 32], [118, 92, 70], h), 6));
}
function texRoof(c1 = [130, 62, 44], c2 = [96, 46, 36]) {
  const k = "rf" + c1 + c2; if (TX[k]) return TX[k];
  return (TX[k] = texPair(256, (u, v) => { const r = Math.floor(v * 10), fv = v * 10 - r, off = (r % 2) * 0.5, cu = u * 8 + off, fu = cu - Math.floor(cu); return clamp(fv * 1.2) * (fu < 0.06 || fu > 0.94 ? 0.5 : 1); },
    (u, v, h) => { const r = Math.floor(v * 10), cu = Math.floor(u * 8 + (r % 2) * 0.5); return mixc(mixc(c1, c2, hash2(r, cu)), [40, 30, 28], (1 - h) * 0.5); }, 4));
}
function texPlaster(beam = "#3a2618", wall = "#d8cdb6") {
  const k = "pla" + beam + wall; if (TX[k]) return TX[k];
  return (TX[k] = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = wall; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(${hash(i) > 0.5 ? "120,100,80" : "255,250,240"},${0.04 + hash(i * 3) * 0.06})`; c.beginPath(); c.arc(hash(i * 5) * w, hash(i * 7) * h, 4 + hash(i * 9) * 16, 0, 7); c.fill(); }
    c.fillStyle = beam; [0, 0.48, 0.97].forEach((x) => c.fillRect(x * w - 6, 0, 14, h)); [0, 0.5, 0.97].forEach((y) => c.fillRect(0, y * h - 6, w, 13));
    c.lineWidth = 11; c.strokeStyle = beam; c.beginPath(); c.moveTo(0, h * 0.5); c.lineTo(w * 0.48, 0); c.moveTo(w * 0.48, h * 0.5); c.lineTo(w, h); c.stroke();
  }));
}

// terreno: grade com altura h(x,z), cores por altura/inclinação/ruído e textura de detalhe
function terrain(g, o = {}) {
  const size = o.size ?? 400, segs = o.segs ?? 180, hf = o.h ?? (() => 0);
  const geo = new THREE.PlaneGeometry(size, size, segs, segs); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, hf(p.getX(i) + (o.x ?? 0), p.getZ(i) + (o.z ?? 0)));
  geo.computeVertexNormals();
  const n = geo.attributes.normal, cols = new Float32Array(p.count * 3), c = new THREE.Color();
  const A = new THREE.Color(o.grassA ?? 0x5d7a3a), B = new THREE.Color(o.grassB ?? 0x8a9a4a), R = new THREE.Color(o.rock ?? 0x7a7468), D = new THREE.Color(o.dirt ?? 0x8a7458);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + (o.x ?? 0), z = p.getZ(i) + (o.z ?? 0), y = p.getY(i), sl = 1 - n.getY(i);
    c.copy(A).lerp(B, fbm2(x * 0.03, z * 0.03, 4));
    c.lerp(D, clamp((fbm2(x * 0.08 + 9, z * 0.08, 3) - 0.62) * 3) * 0.8);
    if (o.path) c.lerp(D, o.path(x, z));
    c.lerp(R, clamp((sl - 0.25) * 3));
    if (o.color) o.color(c, x, y, z, sl);
    cols.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  const tx = texGround(); const map = tx.map.clone(), nm = tx.normalMap.clone(); map.needsUpdate = nm.needsUpdate = true; rep(map, size / 6, size / 6); rep(nm, size / 6, size / 6);
  const m = mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map, normalMap: nm, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.96 }), o.x ?? 0, 0, o.z ?? 0, g);
  m.castShadow = false;
  return { mesh: m, h: hf };
}
// grama em tufos instanciados que balançam com o vento
function grassField(g, n, area, hf, o = {}) {
  const blade = new THREE.BufferGeometry();
  const w = o.w ?? 0.035, hgt = o.hgt ?? 0.32;
  blade.setAttribute("position", new THREE.Float32BufferAttribute([-w, 0, 0, w, 0, 0, -w * 0.6, hgt * 0.5, 0.02, w * 0.6, hgt * 0.5, 0.02, 0, hgt, 0.06], 3));
  blade.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); blade.computeVertexNormals();
  const tuft = new THREE.BufferGeometry(); // 3 lâminas cruzadas
  const parts = [0, 1, 2].map((k) => { const b = blade.clone(); b.rotateY((k / 3) * Math.PI + 0.3); b.translate((k - 1) * 0.04, 0, (k % 2) * 0.03); return b; });
  const merged = (() => { const pos = [], idx = []; let off = 0; parts.forEach((b) => { pos.push(...b.attributes.position.array); idx.push(...b.index.array.map((i) => i + off)); off += b.attributes.position.count; }); tuft.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); tuft.setIndex(idx); tuft.computeVertexNormals(); return tuft; })();
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uWind = WIND;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uWind;").replace("#include <begin_vertex>", `#include <begin_vertex>
      vec3 ip = vec3(0.0);
      #ifdef USE_INSTANCING
        ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      #endif
      float bend = position.y * position.y * 4.0;
      transformed.x += (sin(uWind * 1.6 + ip.x * 0.3 + ip.z * 0.17) * 0.08 + sin(uWind * 3.3 + ip.z * 0.9 + ip.x) * 0.025) * bend;
      transformed.z += cos(uWind * 1.2 + ip.x * 0.23) * 0.05 * bend;`);
  };
  m.customProgramCacheKey = () => "grass";
  const im = new THREE.InstancedMesh(merged, m, n); im.receiveShadow = true; im.castShadow = false; im.frustumCulled = false;
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), col = new THREE.Color();
  const cA = new THREE.Color(o.colA ?? 0x6a8a3a), cB = new THREE.Color(o.colB ?? 0xa8b45a);
  let k = 0;
  for (let i = 0; i < n * 4 && k < n; i++) {
    const x = area[0] + hash(i * 1.13 + 3) * (area[1] - area[0]), z = area[2] + hash(i * 2.71 + 7) * (area[3] - area[2]);
    if (o.mask && !o.mask(x, z)) continue;
    ps.set(x, hf(x, z) - 0.02, z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), hash(i * 5.3) * 6.28); const s = (o.s ?? 1) * (0.6 + hash(i * 7.7) * 0.8); sc.set(s, s * (0.7 + hash(i * 3.9) * 0.6), s);
    M4.compose(ps, q, sc); im.setMatrixAt(k, M4); col.copy(cA).lerp(cB, hash(i * 9.1) * 0.8 + fbm2(x * 0.05, z * 0.05, 2) * 0.4); im.setColorAt(k, col); k++;
  }
  im.count = k; g.add(im);
  return im;
}
// pedra irregular
function rock(g, x, y, z, r, seed = 1, o = {}) {
  const geo = new THREE.IcosahedronGeometry(1, 3);
  deform(geo, (v) => { const n = fbm2(v.x * 1.7 + seed, v.y * 1.7 + v.z * 1.3, 4); v.multiplyScalar(0.75 + n * 0.55); v.y *= o.flat ?? 0.7; });
  const t = texRock();
  const m = mesh(geo, SM(o.col ?? 0xffffff, { map: t.map, normalMap: t.normalMap, normalScale: new THREE.Vector2(1.2, 1.2) }), x, y, z, g);
  m.scale.setScalar(r); m.rotation.set(hash(seed) * 0.5, hash(seed + 1) * 6, hash(seed + 2) * 0.5);
  return m;
}
// árvore: tronco afinando com casca, galhos e copa em tufos irregulares
const FOL = {};
function foliageGeo(seed) {
  const k = seed % 6; if (FOL[k]) return FOL[k];
  const geo = new THREE.IcosahedronGeometry(1, 3);
  deform(geo, (v) => { const n = fbm2(v.x * 2.2 + k * 3, v.y * 2.2 + v.z * 1.7, 4); v.multiplyScalar(0.72 + n * 0.5); });
  return (FOL[k] = geo);
}
function tree(g, x, y, z, o = {}) {
  const t = grp(g, x, y, z), s = o.s ?? 1, seed = o.seed ?? 1, h = (o.h ?? 6) * s;
  const bk = texBark();
  const trunk = mesh(lathe([[0.45 * s, 0], [0.32 * s, h * 0.15], [0.26 * s, h * 0.5], [0.16 * s, h * 0.85], [0.06 * s, h]], 12), SM(0xffffff, { map: bk.map, normalMap: bk.normalMap }), 0, 0, 0, t);
  trunk.rotation.z = (hash(seed) - 0.5) * 0.08;
  const fc = new THREE.Color(o.leaf ?? 0x4a6a2a);
  const nb = o.blobs ?? 9;
  for (let i = 0; i < nb; i++) {
    const a = hash(seed * 7 + i) * Math.PI * 2, r = (0.3 + hash(seed * 3 + i) * 0.9) * (o.w ?? 1.8) * s, yy = h * (0.55 + hash(seed * 5 + i) * 0.45);
    const c = fc.clone().offsetHSL((hash(i * 3 + seed) - 0.5) * 0.04, 0, (hash(i * 7 + seed) - 0.5) * 0.12 + (yy / h - 0.7) * 0.15);
    const b = mesh(foliageGeo(seed + i), SM(c.getHex(), { roughness: 0.8 }), Math.cos(a) * r, yy, Math.sin(a) * r, t);
    b.scale.setScalar((1.1 + hash(seed * 11 + i) * 0.8) * s * (o.blob ?? 1));
    if (i < 3) { const br = mesh(cyl(0.05 * s, 0.12 * s, r * 1.1, 6), SM(0x4a3424), Math.cos(a) * r * 0.5, yy - 0.5 * s, Math.sin(a) * r * 0.5, t); br.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); }
  }
  return t;
}
// floresta de fundo instanciada (tronco + copa)
function forestInst(g, n, area, hf, o = {}) {
  const tg = cyl(0.12, 0.3, 1, 7); tg.translate(0, 0.5, 0);
  const tm = new THREE.InstancedMesh(tg, SM(0x4a3626), n), fm = new THREE.InstancedMesh(foliageGeo(3), SM(0xffffff, { roughness: 0.85 }), n * 2);
  const M4 = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion(), base = new THREE.Color(o.leaf ?? 0x3e5a28);
  let k = 0;
  for (let i = 0; i < n * 3 && k < n; i++) {
    const x = area[0] + hash(i * 3.17 + 1) * (area[1] - area[0]), z = area[2] + hash(i * 1.91 + 5) * (area[3] - area[2]);
    if (o.mask && !o.mask(x, z)) continue;
    const h = (o.h ?? 8) * (0.7 + hash(i * 4.4) * 0.6), y = hf(x, z);
    M4.compose(new THREE.Vector3(x, y - 0.3, z), q, new THREE.Vector3(h * 0.08, h * 0.6, h * 0.08)); tm.setMatrixAt(k, M4);
    for (let j = 0; j < 2; j++) { M4.compose(new THREE.Vector3(x + (j - 0.5) * h * 0.12, y + h * (0.62 + j * 0.2), z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), hash(i + j) * 6), new THREE.Vector3(h * 0.24, h * (0.3 - j * 0.06), h * 0.24)); fm.setMatrixAt(k * 2 + j, M4); col.copy(base).offsetHSL(0, 0, (hash(i * 2.2 + j) - 0.5) * 0.1); fm.setColorAt(k * 2 + j, col); }
    k++;
  }
  tm.count = k; fm.count = k * 2; tm.castShadow = fm.castShadow = !!o.shadow; tm.receiveShadow = fm.receiveShadow = true; tm.frustumCulled = fm.frustumCulled = false;
  g.add(tm, fm);
  return { tm, fm };
}

// muralha original: pedra em blocos, ameias, torres com telhado cônico e andaimes
function wallSeg(g, len, hgt, thick, o = {}) {
  const w = grp(g, ...(o.pos ?? [0, 0, 0])); w.rotation.y = o.rotY ?? 0;
  const tb = texBlocks();
  const mk = (sx, sy) => { const map = tb.map.clone(), nm = tb.normalMap.clone(); map.needsUpdate = nm.needsUpdate = true; rep(map, sx, sy); rep(nm, sx, sy); return SM(0xffffff, { map, normalMap: nm, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.92 }); };
  const front = mk(len / 12, hgt / 12);
  mesh(box(len, hgt, thick), front, 0, hgt / 2, 0, w);
  // base inclinada (talude)
  const ta = mesh(box(len, hgt * 0.18, thick * 0.5), mk(len / 12, 0.5), 0, hgt * 0.07, thick * 0.55, w); ta.rotation.x = -0.35;
  const mer = mk(0.4, 0.4); const n = Math.floor(len / 3.2);
  for (let i = 0; i < n; i++) { mesh(box(1.8, 2.2, thick * 0.25), mer, -len / 2 + 1.6 + i * 3.2, hgt + 1.1, thick * 0.38, w); mesh(box(1.8, 2.2, thick * 0.25), mer, -len / 2 + 1.6 + i * 3.2, hgt + 1.1, -thick * 0.38, w); }
  mesh(box(len, 0.7, thick * 1.08), SM(0x8a8478), 0, hgt + 0.1, 0, w);
  if (o.scaffold) {
    const wood = SM(0x6a4a2c);
    for (let i = 0; i < 6; i++) { const x = -len * 0.3 + i * 3; mesh(box(0.25, hgt * 0.55, 0.25), wood, x, hgt * 0.275, thick / 2 + 1.4, w); }
    for (let j = 0; j < 4; j++) mesh(box(16, 0.18, 1.4), wood, -len * 0.3 + 7.5, hgt * 0.14 * (j + 1), thick / 2 + 0.8, w);
  }
  return w;
}
function tower(g, x, z, r, h, o = {}) {
  const t = grp(g, x, 0, z), tb = texBlocks();
  const map = tb.map.clone(), nm = tb.normalMap.clone(); map.needsUpdate = nm.needsUpdate = true; rep(map, (r * 6.28) / 6, h / 6); rep(nm, (r * 6.28) / 6, h / 6);
  mesh(cyl(r, r * 1.08, h, 28), SM(0xffffff, { map, normalMap: nm, normalScale: new THREE.Vector2(1.3, 1.3) }), 0, h / 2, 0, t);
  mesh(cyl(r * 1.12, r * 1.12, 0.8, 28), SM(0x8a8478), 0, h, 0, t);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; mesh(box(1.2, 1.8, 0.9), SM(0xa8a090), Math.cos(a) * r * 1.05, h + 1.2, Math.sin(a) * r * 1.05, t).rotation.y = -a; }
  const rf = texRoof([70, 72, 92], [50, 52, 70]);
  mesh(new THREE.ConeGeometry(r * 1.25, r * 2.2, 28), SM(0xffffff, { map: rf.map, normalMap: rf.normalMap }), 0, h + 2.4 + r * 1.1, 0, t);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4, wy = h * (0.45 + (i % 2) * 0.2); const win = mesh(box(0.7, 1.4, 0.3), o.lit ? BM(0xffb860) : SM(0x15100c), Math.cos(a) * r * 0.99, wy, Math.sin(a) * r * 0.99, t); win.rotation.y = -a + Math.PI / 2; }
  if (o.flag) { mesh(cyl(0.08, 0.08, 4, 6), SM(0x3a2a1a), 0, h + 3 + r * 2.2, 0, t); const fl = mesh(new THREE.PlaneGeometry(2.2, 1.3, 6, 1), TM(o.flag, { side: THREE.DoubleSide }), 1.1, h + 4.3 + r * 2.2, 0, t); t.userData.flag = fl; }
  return t;
}
// casa de enxaimel com telhado de telhas, chaminé e janelas (acesas à noite)
function house(g, x, z, o = {}) {
  const h = grp(g, x, o.y ?? 0, z), w = o.w ?? 5, d = o.d ?? 4, hh = o.h ?? 4, seed = o.seed ?? 1;
  h.rotation.y = o.rotY ?? 0;
  const pl = texPlaster(o.beam ?? "#3a2618", o.wall ?? ["#d8cdb6", "#cfc2a4", "#e2d8c4", "#c9b896"][Math.floor(hash(seed) * 4)]);
  const wm = SM(0xffffff, { map: pl, roughness: 0.95 });
  mesh(box(w, hh, d), wm, 0, hh / 2, 0, h);
  mesh(box(w + 0.2, 0.6, d + 0.2), SM(0x6a6258), 0, 0.3, 0, h);
  const rh = d * 0.55, shape = new THREE.Shape(); shape.moveTo(-d / 2 - 0.5, 0); shape.lineTo(d / 2 + 0.5, 0); shape.lineTo(0, rh); shape.lineTo(-d / 2 - 0.5, 0);
  const rg = new THREE.ExtrudeGeometry(shape, { depth: w + 0.8, bevelEnabled: false }); rg.translate(0, 0, -(w + 0.8) / 2); rg.rotateY(Math.PI / 2);
  const rt = texRoof(...(hash(seed * 3) > 0.5 ? [[130, 62, 44], [96, 46, 36]] : [[92, 70, 60], [70, 52, 46]]));
  const rmap = rt.map.clone(), rnm = rt.normalMap.clone(); rmap.needsUpdate = rnm.needsUpdate = true; rep(rmap, 0.5, 0.5); rep(rnm, 0.5, 0.5);
  mesh(rg, SM(0xffffff, { map: rmap, normalMap: rnm }), 0, hh, 0, h);
  const gable = new THREE.Shape(); gable.moveTo(-d / 2, 0); gable.lineTo(d / 2, 0); gable.lineTo(0, rh * 0.92); gable.lineTo(-d / 2, 0);
  [-1, 1].forEach((k) => { const gg = mesh(new THREE.ShapeGeometry(gable), wm, k * (w / 2 + 0.01), hh, 0, h); gg.rotation.y = k * Math.PI / 2; });
  if (hash(seed * 5) > 0.3) mesh(box(0.7, 2.2, 0.7), SM(0x7a6a5a), w * 0.25, hh + rh * 0.7, d * 0.15, h);
  const lit = o.lit ?? 0;
  const winM = lit ? BM(new THREE.Color(0xffb35a).multiplyScalar(0.6 + lit * 1.4).getHex()) : SM(0x1a1612, { roughness: 0.3 });
  const nw = Math.max(1, Math.floor(w / 1.8));
  for (let i = 0; i < nw; i++) for (let fl = 0; fl < (hh > 5 ? 2 : 1); fl++) {
    if (hash(seed * 13 + i * 3 + fl) < 0.25) continue;
    const wx = -w / 2 + (i + 0.5) * (w / nw), wy = 1.6 + fl * 2.4;
    mesh(box(0.8, 1.0, 0.1), winM, wx, wy, d / 2 + 0.02, h);
    mesh(box(1.0, 0.12, 0.2), SM(0x3a2618), wx, wy - 0.58, d / 2 + 0.06, h);
  }
  mesh(box(1.0, 1.9, 0.12), SM(0x4a3020), w * -0.3, 0.95, d / 2 + 0.03, h);
  h.userData.chimney = new THREE.Vector3(w * 0.25, hh + rh * 0.7 + 1.2, d * 0.15);
  return h;
}
// corrente de elos
function chain(g, pts, linkR = 0.05, o = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))); const L = curve.getLength(), n = Math.max(2, Math.floor(L / (linkR * 2.6)));
  const lg = new THREE.TorusGeometry(linkR, linkR * 0.28, 6, 12), m = SM(o.col ?? 0x5a5a62, { metalness: 0.6, roughness: 0.45 }), links = [];
  for (let i = 0; i < n; i++) { const u = i / (n - 1), p = curve.getPointAt(u), tg = curve.getTangentAt(u); const l = mesh(lg, m, p.x, p.y, p.z, g); l.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tg); l.rotateX(i % 2 ? Math.PI / 2 : 0); l.scale.set(1.35, 1, 1); links.push(l); }
  return links;
}
