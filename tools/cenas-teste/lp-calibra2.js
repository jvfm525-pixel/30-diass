// calibração 2: o Eren criança da referência, com luz de dia parecida (sol à esquerda, céu azul, grama)
// câmeras (window.TEST_CAM): 1 = como no quadro de referência (≈20° pra direita), 2 = de frente, 3 = 45°, 4 = perfil
addSet("teste", (g) => {
  const dome = skyDome(g, { top: 0x5a86c8, mid: 0x9cc0e8, hor: 0xdfe8ee, ground: 0x6a8a4a, exp: 0.7, sunDir: [-0.5, 0.6, 0.6], sunCol: 0xfff4e0, sunI: 0.6, disk: 1.2, cov: 0.5, cloudA: 0.35, cloudLit: 0xffffff, cloudSh: 0xb0c0d8, midY: 0.15 });
  mesh(new THREE.PlaneGeometry(60, 60), LPmat(0x6a9a40, { rim: 0.2 }), 0, 0, 0, g).rotation.x = -Math.PI / 2;
  const p = erenCriancaLP(); g.add(p);
  return {
    bg: 0x9cc0e8, fog: [20, 90], fogCol: 0xc8d8e8, dome, hand: 0,
    look: { exposure: 1.15, bloom: 0.2, bloomT: 0.92, vig: 0.2, sat: 1.04, con: 1.02 },
    sun: { dir: [-0.75, 0.55, 0.45], col: 0xfff0d8, I: 2.4, c: [0, 1.6, 0], r: 4 }, hemi: { sky: 0xfff2e6, ground: 0x9a9a72, I: 1.05 }, fill: { col: 0xd0e0ff, I: 0.35, dir: [0.7, 0.2, 0.5] }, rim: { col: 0xffffff, str: 0.35 },
    update(t) { restPose(p); p.position.set(0, 0, 0); p.rotation.set(0, 0, 0); standFeet(p); rostoLP(p, 1.0, { boca: "triste", triste: 0.5 }); },
    cam() {
      const c = window.TEST_CAM | 0, A = [0, 0.36, 0, 0.78, 1.57][c] ?? 0, d = 1.25;
      return { pos: [Math.sin(A) * d, 1.73, Math.cos(A) * d], look: [0, 1.7, 0], fov: 22, near: 0.02 };
    },
  };
});
