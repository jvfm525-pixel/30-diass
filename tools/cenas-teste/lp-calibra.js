// folha do elenco: o Eren criança da referência (calibração) + Jujutsu Kaisen, com luz de dia parecida com a da referência
// câmeras (window.TEST_CAM): i = de frente, 10+i = três-quartos, 20+i = perfil, 30+i = costas (i = índice do personagem)
addSet("teste", (g) => {
  const dome = skyDome(g, { top: 0x5a86c8, mid: 0x9cc0e8, hor: 0xdfe8ee, ground: 0x6a8a4a, exp: 0.7, sunDir: [-0.5, 0.6, 0.6], sunCol: 0xfff4e0, sunI: 0.6, disk: 1.2, cov: 0.5, cloudA: 0.35, cloudLit: 0xffffff, cloudSh: 0xb0c0d8, midY: 0.15 });
  mesh(new THREE.PlaneGeometry(60, 60), LPmat(0x6a9a40, { rim: 0.2 }), 0, 0, 0, g).rotation.x = -Math.PI / 2;
  const P = [erenCriancaLP(), yujiLP(), megumiLP(), sukunaYujiLP(), gojoLP(), sukunaMegumiLP()], X = [0, 3, 6, 9, 12, 15];
  P.forEach((p) => g.add(p));
  const F = [{ boca: "triste", triste: 0.5 }, { boca: "sorriso", sobe: 0.3 }, { boca: "linha", bravo: 0.2 }, { boca: "risada", bravo: 0.6 }, { boca: "sorriso" }, { boca: "risada", bravo: 0.7 }];
  return {
    bg: 0x9cc0e8, fog: [20, 90], fogCol: 0xc8d8e8, dome, hand: 0,
    look: { exposure: 1.32, bloom: 0.18, bloomT: 0.94, vig: 0.2, sat: 1.06, con: 1.02 },
    sun: { dir: [-0.75, 0.55, 0.45], col: 0xfff0d8, I: 2.4, c: [7.5, 1.6, 0], r: 10 }, hemi: { sky: 0xfff2e6, ground: 0x9a9a72, I: 1.05 }, fill: { col: 0xd0e0ff, I: 0.35, dir: [0.7, 0.2, 0.5] }, rim: { col: 0xffffff, str: 0.35 },
    update(t) { P.forEach((p, i) => { restPose(p); p.position.set(X[i], 0, 0); p.rotation.set(0, 0, 0); standFeet(p); rostoLP(p, 1.0, F[i]); }); },
    cam() {
      const c = window.TEST_CAM | 0, i = c % 10, x = X[i], sc = i === 4 ? 1.08 : 1, v = Math.floor(c / 10), A = [0, 0.62, 1.57, 2.6][v] ?? 0, d = 1.3;
      return { pos: [x + Math.sin(A) * 1.45, 1.76 * sc, Math.cos(A) * 1.45], look: [x, 1.72 * sc, 0], fov: 26, near: 0.02 };
    },
  };
});
