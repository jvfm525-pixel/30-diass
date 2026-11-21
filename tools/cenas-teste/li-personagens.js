addSet("teste", (g) => {
  const dome = vazio(g, 0x1a1830, 0x5a4a70, 0x0a0810);
  mesh(new THREE.PlaneGeometry(80, 80), LPmat(0x3a3448, { rim: 0.2 }), 0, 0, 0, g).rotation.x = -Math.PI / 2;
  const P = [lightLP(), nearLP(), melloLP(), mikamiLP(), takadaLP(), ryukLP(), lightLP({ kira: true })], X = [0, 3, 6, 9, 12, 15, 18];
  P.forEach((p, i) => { g.add(p); p.position.x = X[i]; });
  const F = [{ boca: "smirk", sombra: 1, bravo: 0.5 }, { boca: "linha", palpebra: 0.72, sobe: -0.2 }, { boca: "mastiga", bravo: 0.6 }, { boca: "grito", bravo: 0.8 }, { boca: "aberta", triste: 0.7, sobe: 0.6, suor: 1 }, { boca: "ryuk" }, { boca: "grito", choque: 1, triste: 0.9, sobe: 0.8, suor: 1, choro: 1 }];
  return {
    bg: 0x1a1830, fog: [30, 120], dome, hand: 0, look: { exposure: 1.2, bloom: 0.4, bloomT: 0.85, vig: 0.3 },
    sun: { dir: [-0.5, 0.7, 0.6], col: 0xfff0e0, I: 2.0, c: [9, 1, 0], r: 16 }, hemi: { sky: 0xd8d0ff, ground: 0x4a4058, I: 1.2 }, fill: { col: 0xa0b0ff, I: 0.4, dir: [0.7, 0.3, -0.5] }, rim: { col: 0xffffff, str: 0.5 },
    update(t) { P.forEach((p, i) => { restPose(p); standFeet(p); rostoLP(p, 1, F[i]); }); },
    cam() { const c = window.TEST_CAM | 0, i = c % 10, sc = i === 5 ? 1.32 : 1, x = X[i]; if (c >= 10) return { pos: [x + 1.2, 1.2 * sc, 3.6 * sc], look: [x, 1.0 * sc, 0], fov: 34 }; return { pos: [x + 0.25, 1.72 * sc, 1.3 * sc], look: [x, 1.68 * sc, 0], fov: 28, near: 0.02 }; },
  };
});
