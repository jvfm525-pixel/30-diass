// calibração 2: o Eren criança da referência, com luz de dia parecida (sol à esquerda, céu azul, grama)
// câmeras (window.TEST_CAM): 1 = ≈20° pra direita, 2 = de frente, 3 = 45°, 4 = perfil,
// 5 = como o quadro de 144 s (olhos fechados, cabeça baixa, ≈30°), 6 = como o quadro de 12,2 s (olhando pra cima, ≈22°)
addSet("teste", (g) => {
  const dome = skyDome(g, { top: 0x5a86c8, mid: 0x9cc0e8, hor: 0xdfe8ee, ground: 0x6a8a4a, exp: 0.7, sunDir: [-0.5, 0.6, 0.6], sunCol: 0xfff4e0, sunI: 0.6, disk: 1.2, cov: 0.5, cloudA: 0.35, cloudLit: 0xffffff, cloudSh: 0xb0c0d8, midY: 0.15 });
  mesh(new THREE.PlaneGeometry(60, 60), LPmat(0x6a9a40, { rim: 0.2 }), 0, 0, 0, g).rotation.x = -Math.PI / 2;
  const p = erenCriancaLP(); g.add(p);
  const alvo = V3_();
  return {
    bg: 0x9cc0e8, fog: [20, 90], fogCol: 0xc8d8e8, dome, hand: 0,
    look: { exposure: 1.32, bloom: 0.18, bloomT: 0.94, vig: 0.2, sat: 1.06, con: 1.02 },
    sun: { dir: [-0.75, 0.55, 0.45], col: 0xfff0d8, I: 2.4, c: [0, 1.6, 0], r: 4 }, hemi: { sky: 0xfff2e6, ground: 0x9a9a72, I: 1.05 }, fill: { col: 0xd0e0ff, I: 0.35, dir: [0.7, 0.2, 0.5] }, rim: { col: 0xffffff, str: 0.35 },
    update(t) {
      const c = window.TEST_CAM | 0;
      restPose(p); p.position.set(0, 0, 0); p.rotation.set(0, 0, 0); standFeet(p);
      rostoLP(p, 1.0, c === 5 ? { fechados: true, boca: "linha" } : { boca: "triste", triste: 0.5 });
      p.updateMatrixWorld(true); p.userData.head.getWorldPosition(alvo); alvo.y += 0.12;
    },
    cam() {
      const c = window.TEST_CAM | 0;
      const [az, el, d, fov] = { 1: [0.36, 0.05, 1.25, 22], 2: [0, 0.05, 1.25, 22], 3: [0.78, 0.05, 1.25, 22], 4: [1.57, 0.05, 1.25, 22], 5: [0.52, 0.3, 1.35, 30], 6: [0.38, -0.14, 1.35, 30], 7: [0.42, 0.1, 1.35, 30] }[c] || [0, 0, 1.25, 22];
      return { pos: [alvo.x + Math.sin(az) * Math.cos(el) * d, alvo.y + Math.sin(el) * d, alvo.z + Math.cos(az) * Math.cos(el) * d], look: [alvo.x, alvo.y, alvo.z], fov, near: 0.02 };
    },
  };
});
