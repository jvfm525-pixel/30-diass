// folha de personagens (aprovação dos cabelos): Subaru, Emilia, Echidna, Satella; 3 ângulos pela câmera conforme o tempo
addSet("t-folha", (g) => {
  skyDome(g, { top: 0x7a8aa8, hor: 0xd8dce6, ground: 0x6a6a70, sunDir: [0.4, 0.6, 0.7], sunI: 0.5, cov: 0 });
  const ch = mesh(new THREE.PlaneGeometry(40, 40), SM(0x8a8a90), 0, 0, 0, g); ch.rotation.x = -Math.PI / 2;
  const P = [subaruLP(), emiliaLP(), echidnaLP(), satellaSombra()]; P.forEach((p, i) => { g.add(p); p.position.set(-0.84 + i * 0.56, 0, 0); });
  return { bg: 0xd8dce6, fog: [30, 120], fogCol: 0xd8dce6, hand: 0, look: { exposure: 1.05, bloom: 0.25, bloomT: 0.9, vig: 0.25, rosto: 0.4 },
    sun: { dir: [0.4, 0.8, 0.9], col: 0xffffff, I: 2.2, c: [0, 1, 0], r: 6 }, hemi: { sky: 0xdfe6ff, ground: 0x6a6a6a, I: 0.9 }, fill: { col: 0xffffff, I: 0.5, dir: [-0.5, 0.3, 1] }, rim: { col: 0xffffff, str: 0.8 },
    update(t) { const ang = t < 0.66 ? 0 : t < 1.33 ? 0.75 : Math.PI; P.forEach((p, i) => { p.rotation.y = ang; vive(p, t, 500 + i, { boca: "linha", palpebra: 0.95, piscaCada: 99 }, 0.0); }); },
    cam(t) { return { pos: [0, 1.4, 4.6], look: [0, 1.15, 0], fov: 46, near: 0.03 }; } };
});
