// folha de personagens (aprovação): Gyro adulto, Gyro menino e o pai (silhuetas), formiga, Welfin, Gon; 3 ângulos pela câmera conforme o tempo
addSet("t-folha", (g) => {
  skyDome(g, { top: 0x7a8aa8, hor: 0xd8dce6, ground: 0x6a6a70, sunDir: [0.4, 0.6, 0.7], sunI: 0.5, cov: 0 });
  const ch = mesh(new THREE.PlaneGeometry(40, 40), SM(0x8a8a90), 0, 0, 0, g); ch.rotation.x = -Math.PI / 2;
  const fundo = mesh(new THREE.PlaneGeometry(1.6, 2.2), new THREE.MeshBasicMaterial({ color: 0xe8a060 }), 0.02, 1.1, -0.6, g); // céu de pôr do sol atrás das silhuetas
  const pai = silhueta(pessoaLP({ seed: 621, cabelo: CAB_GY.pai, scale: 1.04, botoes: false })); const gar = garrafa(); pai.userData.wr[1].add(gar); gar.position.set(0, -0.08, 0.03);
  const P = [gyroLP(), silhueta(pessoaLP({ seed: 622, cabelo: CAB_GY.menino, scale: 0.62, botoes: false })), pai, formigaSombra(), formigaSombra({ lobo: true, seed: 612, olho: 0xff6a3a }), gonLP()];
  P.forEach((p, i) => { g.add(p); p.position.set(-1.25 + i * 0.5, 0, 0); });
  return { bg: 0xd8dce6, fog: [30, 120], fogCol: 0xd8dce6, hand: 0, look: { exposure: 1.05, bloom: 0.3, bloomT: 0.85, vig: 0.25, rosto: 0.4 },
    sun: { dir: [0.4, 0.8, 0.9], col: 0xffffff, I: 2.2, c: [0, 1, 0], r: 6 }, hemi: { sky: 0xdfe6ff, ground: 0x6a6a6a, I: 0.9 }, fill: { col: 0xffffff, I: 0.5, dir: [-0.5, 0.3, 1] }, rim: { col: 0xffffff, str: 0.8 },
    update(t) { const ang = t < 0.66 ? 0 : t < 1.33 ? 0.75 : Math.PI; P.forEach((p, i) => { p.rotation.y = ang; vive(p, t, 500 + i, { boca: "linha", palpebra: 0.95, piscaCada: 99 }, 0.0); }); fundo.visible = ang === 0; },
    cam(t) { return { pos: [0, 1.15, 6.6], look: [0, 0.95, 0], fov: 46, near: 0.03 }; } };
});
