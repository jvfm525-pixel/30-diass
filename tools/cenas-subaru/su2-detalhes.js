// ================================================================ vídeo: Subaru · detalhes dos cenários e efeitos (VFX)
// tudo apoiado em algo (chão, parede, poste, corda presa nas casas); só luz, fumaça, poeira e pétalas soltas no ar.

// ---------------------------------------------------------------- peças
function bandeirinhas(g, a, b, n = 14, cores = [0xc83a2a, 0xe8b030, 0x3a6ac8, 0xf0ece0, 0x5aa04a]) { // varal de bandeirinhas preso nas duas pontas
  fio(g, a, b, 0.6, 0.008, 0x2a2018); const tri = new THREE.BufferGeometry(); tri.setAttribute("position", new THREE.Float32BufferAttribute([-0.13, 0, 0, 0.13, 0, 0, 0, -0.3, 0], 3)); tri.computeVertexNormals();
  for (let i = 1; i < n; i++) { const u = i / n, p = V3(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * 0.6, lerp(a[2], b[2], u)); const f = mesh(tri, LPmat(cores[i % cores.length], { rim: 0.4, side: THREE.DoubleSide }), p.x, p.y, p.z, g); f.lookAt(p.x + (b[2] - a[2]), p.y, p.z - (b[0] - a[0])); f.castShadow = false; } }
function fio(g, a, b, sag = 0.45, r = 0.012, col = 0x16161a) { const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push(V3(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * sag, lerp(a[2], b[2], u))); }
  const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 4), new THREE.MeshBasicMaterial({ color: col }), 0, 0, 0, g); m.castShadow = false; return m; }
function barril(g, x, z, s = 1) { const b = grp(g, x, 0, z); mesh(cyl(0.3 * s, 0.3 * s, 0.8 * s, 12), LPmat(0x7a5232, { rim: 0.4 }), 0, 0.4 * s, 0, b); [0.12, 0.68].forEach((y) => mesh(cyl(0.315 * s, 0.315 * s, 0.05 * s, 12), LPmat(0x3a3a40, { metal: 0.5 }), 0, y * s, 0, b)); return b; }
function saco(g, x, z, r = 0) { const s = mesh(sph(0.26, 8, 6), LPmat(0xc8b088, { rim: 0.3 }), x, 0.2, z, g); s.scale.set(1, 0.8, 0.85); s.rotation.y = r; return s; }
function carroca(g, x, z, ry = 0) { const c = grp(g, x, 0, z); c.rotation.y = ry; const m = LPmat(0x6a4a2a, { rim: 0.4 });
  mesh(box(1.5, 0.12, 2.6), m, 0, 0.75, 0, c); [-0.72, 0.72].forEach((xx) => mesh(box(0.06, 0.45, 2.6), m, xx, 0.98, 0, c)); mesh(box(1.5, 0.45, 0.06), m, 0, 0.98, -1.27, c);
  [-0.82, 0.82].forEach((xx) => { const r = mesh(new THREE.TorusGeometry(0.45, 0.05, 6, 16), LPmat(0x3a2a18), xx, 0.47, 0.4, c); r.rotation.y = Math.PI / 2; mesh(cyl(0.05, 0.05, 0.12, 6), LPmat(0x3a2a18), xx, 0.47, 0.4, c).rotation.z = Math.PI / 2; });
  [[0.25, 0.4], [-0.3, -0.5], [0.2, -0.6]].forEach(([a, b], i) => mesh(box(0.42, 0.32, 0.42), LPmat(0x8a6a44), a, 1.0, b, c).rotation.y = i);
  const lanca = mesh(box(0.08, 0.08, 1.6), m, 0, 0.55, 2.0, c); lanca.rotation.x = 0.3; mesh(box(0.3, 0.3, 0.3), m, 0, 0.18, 2.75, c); return c; }
function placaLoja(g, x, y, z, ry, cor) { const p = grp(g, x, y, z); p.rotation.y = ry; mesh(box(0.06, 0.06, 0.7), LPmat(0x2a2018), 0, 0, 0.35, p); const pl = mesh(box(0.05, 0.5, 0.6), LPmat(cor, { rim: 0.4 }), 0, -0.3, 0.55, p); mesh(cyl(0.006, 0.006, 0.1, 4), LPmat(0x2a2018), 0, -0.05, 0.4, p); mesh(cyl(0.006, 0.006, 0.1, 4), LPmat(0x2a2018), 0, -0.05, 0.7, p); return p; }
function floreira(g, x, y, z, ry = 0) { const f = grp(g, x, y, z); f.rotation.y = ry; mesh(box(0.9, 0.18, 0.25), LPmat(0x6a4a2a), 0, 0, 0, f); const fl = []; for (let i = 0; i < 9; i++) fl.push([-0.38 + i * 0.095, 0.14, (hash(i) - 0.5) * 0.12]);
  instG(f, sph(0.06, 6, 5), LPmat([0xe84a6a, 0xf0d040, 0xf4f0ff][Math.floor(hash(x + z) * 3)], { rim: 0.4 }), fl, false); return f; }
function torreCastelo(g, x, z, h, r, tel = 0x3a4a7a) { const t = grp(g, x, 0, z); mesh(cyl(r, r * 1.05, h, 12), LPmat(0xd8d0c4, { rim: 0.4 }), 0, h / 2, 0, t); mesh(new THREE.ConeGeometry(r * 1.25, h * 0.5, 12), LPmat(tel, { rim: 0.5 }), 0, h + h * 0.25, 0, t);
  for (let i = 0; i < 4; i++) { const w = mesh(box(r * 0.25, h * 0.08, 0.1), new THREE.MeshBasicMaterial({ color: 0xffd090 }), Math.sin(i * 1.6) * r, h * (0.4 + i * 0.12), Math.cos(i * 1.6) * r, t); w.lookAt(x, h * (0.4 + i * 0.12), z); } return t; }
function castelo(g, x, z, s = 1) { const c = grp(g, x, 0, z); c.scale.setScalar(s); mesh(box(30, 10, 14), LPmat(0xd0c8bc, { rim: 0.3 }), 0, 5, 0, c);
  [[-15, 0, 22, 3], [15, 0, 22, 3], [0, -2, 34, 4], [-7, 3, 26, 2.4], [7, 3, 28, 2.4]].forEach(([a, b, h, r]) => torreCastelo(c, a, b, h, r));
  const morro = mesh(new THREE.ConeGeometry(42, 14, 10), LPmat(0x4a5a3a, { rim: 0.2 }), 0, -6, 0, c); return c; }
function estatuaAnjo(g, x, z, ry = 0) { const e = grp(g, x, 0, z); e.rotation.y = ry; const p = LPmat(0xd8d4cc, { rim: 0.6 });
  mesh(box(0.7, 1.0, 0.7), p, 0, 0.5, 0, e); mesh(new THREE.ConeGeometry(0.28, 1.1, 10), p, 0, 1.55, 0, e); mesh(sph(0.14, 10, 8), p, 0, 2.2, 0, e);
  [-1, 1].forEach((k) => { const w = mesh(new THREE.ConeGeometry(0.22, 0.9, 4), p, k * 0.3, 1.85, -0.12, e); w.rotation.z = -k * 0.9; w.scale.z = 0.25; }); return e; }
function arcoFlores(g, x, z, ry = 0) { const a = grp(g, x, 0, z); a.rotation.y = ry; const m = LPmat(0x3a2a20, { rim: 0.4 });
  [-1.4, 1.4].forEach((xx) => mesh(box(0.14, 2.6, 0.14), m, xx, 1.3, 0, a)); const arc = mesh(new THREE.TorusGeometry(1.4, 0.07, 6, 24, Math.PI), m, 0, 2.6, 0, a);
  const fo = []; for (let i = 0; i < 46; i++) { const an = (i / 45) * Math.PI; fo.push([Math.cos(an) * 1.42, 2.6 + Math.sin(an) * 1.42, (hash(i) - 0.5) * 0.25, hash(i * 3) * 3, hash(i * 5) * 3, 0]); }
  for (let i = 0; i < 20; i++) { const xx = i % 2 ? 1.42 : -1.42; fo.push([xx + (hash(i * 7) - 0.5) * 0.15, 0.3 + (i / 20) * 2.2, (hash(i * 9) - 0.5) * 0.2, i, i * 2, 0]); }
  instG(a, new THREE.IcosahedronGeometry(0.16, 0), LPmat(0x2a5a2a, { rim: 0.5 }), fo); const fl = fo.filter((_, i) => i % 3 === 0).map((q) => [q[0], q[1], q[2] + 0.12]); instG(a, sph(0.06, 6, 5), LPmat(0xe8607a, { rim: 0.4, emis: 0x5a1020, ei: 0.3 }), fl, false); return a; }
function roseira(g, x, z, cor = 0xd8304a) { const r = grp(g, x, 0, z); mesh(sph(0.45, 8, 6), LPmat(0x1e3a1e, { rim: 0.4 }), 0, 0.35, 0, r).scale.y = 0.8; const fl = []; for (let i = 0; i < 9; i++) { const a = hash(i + x) * 6.28, e = 0.2 + hash(i * 3 + z) * 0.9; fl.push([Math.cos(a) * 0.38 * Math.sin(e), 0.35 + Math.cos(e) * 0.32, Math.sin(a) * 0.38 * Math.sin(e)]); }
  instG(r, sph(0.065, 6, 5), LPmat(cor, { rim: 0.4 }), fl, false); return r; }
function arvoreMorta(g, x, z, s = 1, cor = 0x0c0810) { const a = grp(g, x, 0, z); a.scale.setScalar(s); const m = LPmat(cor, { rim: 0.8 });
  mesh(cyl(0.12, 0.28, 3.2, 6), m, 0, 1.6, 0, a); for (let i = 0; i < 6; i++) { const b = mesh(cyl(0.02, 0.09, 1.4 - i * 0.12, 5), m, 0, 2.0 + i * 0.22, 0, a); b.rotation.set(Math.sin(i * 2.1) * 0.9, i * 1.3, Math.cos(i * 1.7) * 0.9); b.translateY(0.6); } return a; }
function colunaRuina(g, x, z, h, ry = 0, quebrada = false) { const c = grp(g, x, 0, z); c.rotation.y = ry; const p = LPmat(0xeeeae2, { rim: 0.5 });
  mesh(box(0.9, 0.25, 0.9), p, 0, 0.125, 0, c); mesh(cyl(0.3, 0.34, h, 14), p, 0, 0.25 + h / 2, 0, c); if (!quebrada) mesh(box(0.8, 0.22, 0.8), p, 0, 0.36 + h, 0, c); else { const t = mesh(cyl(0.3, 0.3, 0.6, 14), p, 0.5, 0.3, 0.4, c); t.rotation.z = Math.PI / 2; } return c; }

// ---------------------------------------------------------------- decoração por lugar
function decorRua(g) {
  [16, 8, 0, -8, -16].forEach((z, i) => bandeirinhas(g, [-5.4, 5.2 + (i % 2) * 0.4, z + (i % 2)], [5.4, 5.0 + ((i + 1) % 2) * 0.4, z - 1.2]));
  [[-5.15, 3.3, 12, Math.PI / 2, 0x3a6ac8], [5.15, 3.3, 6, -Math.PI / 2, 0xc8402a], [-5.15, 3.3, -4, Math.PI / 2, 0x5a8a3a], [5.15, 3.3, -12, -Math.PI / 2, 0xd8a030], [-5.15, 3.3, -18, Math.PI / 2, 0x8a3a8a]].forEach(([x, y, z, r, c]) => placaLoja(g, x, y, z, r, c));
  for (let i = 0; i < 10; i++) { const k = i % 2 ? 1 : -1; floreira(g, k * 5.0, 2.3, 28 - i * 6.2 + 1.2, k > 0 ? -Math.PI / 2 : Math.PI / 2); }
  barracaFrutas(g, -3.6, -7, Math.PI / 2); [[-4.4, 2.5], [-4.3, 3.3], [4.4, -3.6], [4.2, 9], [-4.5, -12]].forEach(([x, z], i) => barril(g, x, z, 0.9 + hash(i) * 0.2)); [[-4.0, 2.9], [4.0, -4.2], [3.9, 9.6]].forEach(([x, z], i) => saco(g, x, z, i));
  carroca(g, -3.7, 12, 0.08);
  castelo(g, -20, -170, 1.4);
  const fumos = [[-8.5, 10, 14], [8.6, 11, -6], [-8.4, 10.5, -18]].map(([x, y, z]) => steam(g, { origin: [x, y, z], n: 10, size: 1.6, spread: 0.6, rise: 4, grow: 2.2, opacity: 0.25, life: 4, color: 0xd8c8c8, wind: [0.6, 0, 0] }));
  const raios = godRays(g, [-30, 22, -90], [0.4, -0.25, 1], { n: 7, len: 90, w: 6, spread: 18, opacity: 0.06, color: 0xffc890 });
  return { fumos };
}
function decorJardim(g) {
  [-1, 1].forEach((k) => { for (let i = 0; i < 5; i++) roseira(g, k * 2.9, -5.2 - i * 2.4, [0xd8304a, 0xf4f0ff, 0xe86aa0][(i + (k > 0 ? 1 : 0)) % 3]); });
  [[-1, 2], [1, -2]].forEach(([k, d]) => estatuaAnjo(g, k * 6.2, d * 1.2 + 0.3, k > 0 ? -Math.PI / 2 : Math.PI / 2));
  arcoFlores(g, 0, -3.4, 0);
  [[-5.8, -1.6], [5.8, 1.6]].forEach(([x, z], i) => { const v = grp(g, x, 0, z); mesh(cyl(0.3, 0.24, 0.4, 10), LPmat(0x8a5a3a), 0, 0.2, 0, v); const t = mesh(i % 2 ? sph(0.42, 8, 6) : new THREE.ConeGeometry(0.4, 1.1, 8), LPmat(0x1e3a1e, { rim: 0.5 }), 0, i % 2 ? 0.8 : 0.95, 0, v); });
  [[-9.5, -4, 1.0], [9.5, -6, 1.1], [-11, 6, 0.9], [11, 5, 1.0]].forEach(([x, z, s]) => arvoreRef(g, x, z, s));
  [[-3.2, 6.2, 0.5], [3.2, 6.2, -0.5]].forEach(([x, z, r]) => { const b = grp(g, x, 0, z); b.rotation.y = r; mesh(box(1.4, 0.08, 0.45), LPmat(0xd8d0c0), 0, 0.45, 0, b); [-0.55, 0.55].forEach((xx) => mesh(box(0.1, 0.45, 0.4), LPmat(0xc8c0b0), xx, 0.22, 0, b)); });
  const nuv = []; for (let i = 0; i < 6; i++) { const s = glowSprite(0x2a3450, 50, 0.45, NORM, puffTex); s.material.fog = false; s.position.set(-90 + i * 40, 45 + hash(i) * 12, -140); g.add(s); nuv.push(s); }
  return { nuv };
}
function decorMansao(g, z = -22) { [-16, -6, 6, 16].forEach((x) => mesh(box(1.2, 2.4, 1.2), LPmat(0x7a6a5a, { rim: 0.3 }), x, 16.2, z, g)); }
function decorVazio(g) {
  [[-6, -8, 1.3], [7, -11, 1.6], [-11, -4, 1.1], [10, -2, 1.0], [-3, -16, 1.8]].forEach(([x, z, s]) => arvoreMorta(g, x, z, s));
  [[-4.5, -6, 2.2, 0.3, true], [5, -5, 1.4, 1.2, true], [3, -9, 3.0, 0.6, false], [-8, -12, 2.6, 2.0, true]].forEach(([x, z, h, r, q]) => { const c = colunaRuina(g, x, z, h, r, q); c.traverse((m) => { if (m.isMesh) m.material = LPmat(0x2a2430, { rim: 0.6 }); }); c.rotation.z = (hash(x) - 0.5) * 0.25; });
  const maos = []; [[-14, -30], [16, -34], [0, -46], [-28, -40], [26, -26]].forEach(([x, z], i) => { const m = maoSombra(g); m.set(V3(x, 0, z), V3(x + (hash(i) - 0.5) * 3, 9 + hash(i * 3) * 6, z + 2), 1, i * 1.7, i * 3); maos.push(m); });
  const miasma = steam(g, { origin: [0, 0.4, -4], n: 22, size: 4, spread: 16, rise: 0.6, grow: 1.6, opacity: 0.32, life: 6, color: 0x2a1038, wind: [0.4, 0, 0] });
  const cinza = dustPts(260, [-10, 10, 0.2, 7, -12, 6], 0x6a5a7a, 0.03, 0.7, NORM); g.add(cinza);
  return { maos, miasma, cinza };
}
function decorCha(g) {
  for (let i = 0; i < 9; i++) { const a = Math.PI * 0.95 + (i / 8) * Math.PI * 1.1, r = 6.5; colunaRuina(g, Math.cos(a) * r, Math.sin(a) * r, 2.4 + hash(i) * 1.2, a, i % 3 === 1); }
  const cas = castelo(g, 50, -150, 1.0); cas.traverse((m) => { if (m.isMesh && m.material && m.material.color && m.material.color.getHex() === 0x3a4a7a) m.material = LPmat(0x6a5a9a, { rim: 0.5 }); });
  const fl = [], cores = [0xf4f0ff, 0xffd8e8, 0xd8c8ff, 0xfff0a0]; for (let i = 0; i < 320; i++) { const a = hash(i * 2.3) * 6.28, r = 1.6 + hash(i * 4.1) * 13; fl.push([Math.cos(a) * r, 0.2, Math.sin(a) * r]); }
  cores.forEach((c, k) => instG(g, sph(0.05, 6, 5), LPmat(c, { rim: 0.4 }), fl.filter((_, i) => i % 4 === k), false));
  const raios = godRays(g, [20, 30, 20], [-0.5, -1, -0.4], { n: 6, len: 40, w: 3, spread: 10, opacity: 0.07, color: 0xfff4d0 });
  const relampago = glowSprite(0x8a5aff, 40, 0); relampago.material.fog = false; relampago.position.set(-30, 14, -110); g.add(relampago);
  return { relampago };
}
function decorCampo(g) {
  montanhasLonge(g, 160, 14, 0x3a2a4a, 40); arvoreMorta(g, 4, -14, 1.6, 0x1a1418); arvoreMorta(g, -6, -26, 1.2, 0x1a1418);
  const nevoa = steam(g, { origin: [0, 0.3, -14], n: 20, size: 5, spread: 22, rise: 0.4, grow: 1.4, opacity: 0.22, life: 7, color: 0xb89aa8, wind: [0.3, 0, 0] });
  const ecos = [0, 1, 2, 3].map((i) => { const p = fantasma(pessoaLP({ seed: 680 + i, botoes: false, cabelo: { ...CABELOS_AOT.kruger, seed: 690 + i } }), 0xffd8b0, 0.08); g.add(p); p.position.set((i % 2 ? 1 : -1) * (2.5 + i), 0, -8 - i * 5); p.rotation.y = hash(i) * 6; restPose(p); standFeet(p); return p; });
  return { nevoa, ecos };
}
function decorAmanhecer(g) { decorJardim(g); decorMansao(g); montanhasLonge(g, 200, 16, 0x8a7a9a, 50);
  const raios = godRays(g, [0, 25, 120], [0, -0.3, -1], { n: 8, len: 120, w: 8, spread: 30, opacity: 0.07, color: 0xffd8a0 });
  const nevoa = steam(g, { origin: [0, 0.4, 10], n: 16, size: 6, spread: 30, rise: 0.4, grow: 1.4, opacity: 0.2, life: 7, color: 0xf0d0c0, wind: [0.3, 0, 0] }); return { nevoa }; }

// ---------------------------------------------------------------- efeitos
// voltar da morte: anéis de relógio roxos girando ao contrário em volta do Subaru + clarão
function vfxVolta(g) { const aneis = [1.2, 1.9, 2.7].map((R, i) => { const a = anelMostrador(g, R, { cor: 0xc8a8ff, marcas: 60 }); a.rotation.x = -Math.PI / 2; a.visible = false; return a; });
  const gl = glowSprite(0xb89aff, 3, 0); g.add(gl);
  return (t, t0, pos, dur = 1.6) => { const k = seg(t, t0 - 0.2, t0 + dur), v = k > 0 && k < 1, op = Math.sin(k * Math.PI);
    aneis.forEach((a, i) => { a.visible = v; a.position.set(pos.x, 0.05 + i * 0.5 + k * 0.4, pos.z); a.rotation.z = -(t - t0) * (2.5 - i * 0.6); a.userData.m.opacity = 0.75 * op; a.scale.setScalar(1 + 0.3 * (1 - k)); });
    gl.position.set(pos.x, 1.1, pos.z); gl.material.opacity = 0.5 * op; }; }
// o tempo para: onda cinza-roxa saindo do Subaru
function vfxParada(g, pos) { const o = choque(g, pos, 0xb8a8ff); return (t, t0) => o(t, t0); }
// fumaça negra na base de cada mão de sombra
function vfxFumacaMaos(g, bases) { return bases.map((b) => steam(g, { origin: [b.x, 0.1, b.z], n: 8, size: 0.7, spread: 0.4, rise: 0.8, grow: 1.6, opacity: 0.5, life: 2, color: 0x0a0410, blending: NORM })); }
// aperto no coração: pulso roxo no peito
function vfxPulso(g) { const s = glowSprite(0x8a3aff, 0.8, 0); g.add(s); return (t, k, pos) => { s.position.copy(pos); s.material.opacity = k * (0.35 + 0.35 * Math.max(0, Math.sin(t * 9))); s.scale.setScalar(0.6 + 0.4 * k); }; }
