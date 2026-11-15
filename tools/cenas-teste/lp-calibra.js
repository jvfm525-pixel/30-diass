// calibração do estilo: o Eren da animação de referência, de frente e de três-quartos, com luz parecida (pôr do sol suave)
addSet("teste", (g) => {
  const dome = skyDome(g, { top: 0x3a2a48, mid: 0x9a6070, hor: 0xf0a878, ground: 0x3a2a2a, exp: 0.6, sunDir: [0.4, 0.1, -1], sunCol: 0xffc890, sunI: 1.1, disk: 2.6, cov: 0.6, cloudA: 0.4, cloudLit: 0xffd0b0, cloudSh: 0x6a4a5a, midY: 0.12 });
  mesh(new THREE.PlaneGeometry(60, 60), LPmat(0x7a5a4a, { rim: 0.2 }), 0, 0, 0, g).rotation.x = -Math.PI / 2;
  const P = [erenRefLP(), yujiLP(), megumiLP(), sukunaYujiLP(), gojoLP(), sukunaMegumiLP()], X = [0, 3, 6, 9, 12, 15];
  P.forEach((p) => g.add(p));
  const F = [{ boca: "linha", triste: 0.3 }, { boca: "sorriso", sobe: 0.3 }, { boca: "linha", bravo: 0.2 }, { boca: "risada", bravo: 0.6 }, { boca: "sorriso" }, { boca: "risada", bravo: 0.7 }];
  return {
    bg: 0x3a2a3a, fog: [30, 120], fogCol: 0x8a6060, dome, hand: 0,
    look: { exposure: 1.05, bloom: 0.4, bloomT: 0.88, vig: 0.35, sat: 1.04, con: 1.03 },
    sun: { dir: [-0.3, 0.65, 0.95], col: 0xffe6cc, I: 1.1, c: [0, 1.6, 0], r: 6 }, hemi: { sky: 0xe0d0e4, ground: 0x7a5a4a, I: 1.45 }, fill: { col: 0xffb080, I: 0.8, dir: [0.7, 0.3, -0.6] }, rim: { col: 0xffd0a0, str: 0.5 },
    update(t) { P.forEach((p, i) => { restPose(p); p.position.set(X[i], 0, 0); p.rotation.set(0, 0, 0); idle(p, t, i * 5, 0.25); standFeet(p); rostoLP(p, 1.0, F[i]); }); },
    cam() {
      const c = window.TEST_CAM | 0, i = c % 10, x = X[i], sc = i === 4 ? 1.08 : 1;
      if (c >= 30) return { pos: [x - 0.62, 1.78 * sc, -0.8], look: [x, 1.68 * sc, 0], fov: 30, near: 0.02 }; // costas (três-quartos)
      if (c >= 20) return { pos: [x + 1.0, 1.72 * sc, 0.04], look: [x, 1.68 * sc, 0], fov: 30, near: 0.02 };  // perfil
      if (c >= 10) return { pos: [x + 0.62, 1.72 * sc, 0.82], look: [x, 1.68 * sc, 0], fov: 30, near: 0.02 }; // três-quartos
      return { pos: [x + 0.04, 1.75 * sc, 1.1], look: [x, 1.69 * sc, 0], fov: 30, near: 0.02 };             // frente
    },
  };
});
