// folha de personagens: Morte (com e sem boné), Denji, Yoru, Makima, Fome, Chainsaw Man, Pochita verdadeiro, Demônio da Queda; 3 ângulos pela câmera conforme o tempo
addSet("t-folha", (g) => {
  skyDome(g, { top: 0x7a8aa8, hor: 0xd8dce6, ground: 0x6a6a70, sunDir: [0.4, 0.6, 0.7], sunI: 0.5, cov: 0 });
  const ch = mesh(new THREE.PlaneGeometry(40, 40), SM(0x8a8a90), 0, 0, 0, g); ch.rotation.x = -Math.PI / 2;
  const P = [morteLP(), morteLP({ bone: true }), denjiLP(), yoruLP(), makimaLP(), fomeLP(), chainsawManLP()];
  P.forEach((p, i) => { g.add(p); p.position.set(-1.5 + i * 0.5, 0, 0); });
  const pr = pochitaReal({ scale: 1.2 }); g.add(pr); pr.position.set(2.1, 0, -0.6); const qd = quedaLP({ scale: 1.4 }); g.add(qd); qd.position.set(-2.4, 0, -0.8);
  const todos = [...P, pr, qd];
  return { bg: 0xd8dce6, fog: [30, 120], fogCol: 0xd8dce6, hand: 0, look: { exposure: 1.05, bloom: 0.3, bloomT: 0.85, vig: 0.25, rosto: 0.4 },
    sun: { dir: [0.4, 0.8, 0.9], col: 0xffffff, I: 2.2, c: [0, 1, 0], r: 6 }, hemi: { sky: 0xdfe6ff, ground: 0x6a6a6a, I: 0.9 }, fill: { col: 0xffffff, I: 0.5, dir: [-0.5, 0.3, 1] }, rim: { col: 0xffffff, str: 0.8 },
    update(t) { const c = window.TEST_CAM || 0, ang = c ? 0 : t < 0.66 ? 0 : t < 1.33 ? 0.75 : Math.PI; todos.forEach((p, i) => { p.rotation.y = ang; vive(p, t, 500 + i, { boca: "linha", palpebra: 0.95, piscaCada: 99 }, 0.0); }); },
    cam(t) { const c = window.TEST_CAM || 0; if (c >= 11) { const ord = [0, 2, 3, 4, 5, 6], p = todos[ord[c - 11]], h = olhosW(p); return { pos: [h.x, h.y - 0.3, h.z + 1.6], look: [h.x, h.y - 0.33, h.z], fov: 34, near: 0.02 }; }
      if (c >= 1) { const p = todos[c - 1], h = olhosW(p), a = t < 0.66 ? 0 : t < 1.33 ? 0.8 : Math.PI, d = c > 6 ? 3.2 : 1.3; return { pos: [h.x + Math.sin(a) * d, h.y + 0.03, h.z + Math.cos(a) * d], look: [h.x, h.y - 0.02, h.z], fov: 32, near: 0.02 }; }
      return { pos: [0, 1.6, 8.6], look: [0, 1.05, 0], fov: 46, near: 0.03 }; } };
});
