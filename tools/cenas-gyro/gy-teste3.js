// teste dos lugares 2: NGL de dia, laboratório, Cidade Meteoro, penhasco do Gon (0,5 s cada)
const LUZ_T = { hand: 0, look: { exposure: 1.05, bloom: 0.35, bloomT: 0.82, vig: 0.4, sat: 1.08, con: 1.06, rosto: 0.4 } };
addSet("t-ngl", (g) => { const V = vilaNGL(g); const gy = gyroLP(); g.add(gy); gy.position.set(0.6, 0, 2.2); gy.rotation.y = 0.3;
  return { ...LUZ_T, bg: 0xd8ecf8, fog: [30, 220], fogCol: 0xc8dcec, sun: { dir: [0.4, 0.6, -0.5], col: 0xfff0d0, I: 2.6, c: [0, 1, 0], r: 20 }, hemi: { sky: 0xbcd8f0, ground: 0x4a5a3a, I: 0.9 }, fill: { col: 0xffffff, I: 0.4, dir: [0.4, 0.3, 1] }, rim: { col: 0xffffff, str: 0.8 },
    update(t) { V.upd(t, 0.6); vive(gy, t, 801, {}, 0); }, cam(t) { return { pos: [-1.2, 1.7, 9.5], look: [0.5, 1.5, -2], fov: 50 }; } }; });
addSet("t-lab", (g) => { const L = laboratorioD2(g);
  return { ...LUZ_T, bg: 0x08060c, fog: [8, 30], fogCol: 0x140a1c, sun: { dir: [0.2, 1, 0.1], col: 0xd8e0ff, I: 0.3, c: [0, 1, -2], r: 8 }, hemi: { sky: 0x4a4a5a, ground: 0x1a1420, I: 0.5 }, fill: { col: 0xc080ff, I: 0.3, dir: [0.3, 0.3, 1] }, rim: { col: 0xc8a0ff, str: 1.0 },
    update(t) { L.upd(t); }, cam(t) { return { pos: [1.2, 1.7, 2.2], look: [-0.5, 1.0, -4.5], fov: 52 }; } }; });
addSet("t-meteoro", (g) => { const M = cidadeMeteoro(g); const gy = gyroLP(); g.add(gy); gy.position.set(...M.topo); gy.rotation.y = 0.2;
  return { ...LUZ_T, bg: 0xc8a888, fog: [20, 160], fogCol: 0xa89078, sun: { dir: [-0.5, 0.3, -1], col: 0xffc890, I: 2.0, c: [0, 1, -6], r: 20 }, hemi: { sky: 0xb8a898, ground: 0x3a3430, I: 0.8 }, fill: { col: 0xffe0c0, I: 0.35, dir: [0.4, 0.3, 1] }, rim: { col: 0xffd0a0, str: 1.2 },
    update(t) { M.upd(t); vive(gy, t, 801, {}, 0); }, cam(t) { return { pos: [1.5, 1.4, 6], look: [0, 3.6, -6], fov: 50 }; } }; });
addSet("t-penhasco", (g) => { const P = penhascoMar(g); const gon = gonLP(); g.add(gon); gon.position.set(0, 0, -1.6); gon.rotation.y = Math.PI; sitPose(gon, 1, { seatY: 0.0, lean: 0.1 });
  return { ...LUZ_T, bg: 0xe0f2ff, fog: [40, 400], fogCol: 0xd0e6f8, sun: { dir: [0.5, 0.6, -0.8], col: 0xfff4d8, I: 2.6, c: [0, 1, 0], r: 16 }, hemi: { sky: 0xbcdcf8, ground: 0x5a7a4a, I: 0.9 }, fill: { col: 0xffffff, I: 0.4, dir: [0.4, 0.3, 1] }, rim: { col: 0xffffff, str: 0.9 },
    update(t) { P.upd(t); }, cam(t) { return { pos: [1.4, 1.3, 2.2], look: [0, 0.6, -2.5], fov: 50 }; } }; });
