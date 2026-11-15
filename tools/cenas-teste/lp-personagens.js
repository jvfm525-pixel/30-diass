// teste de personagens low-poly (estilo da animação de referência): Yuji, Sukuna no Yuji, Megumi, Sukuna no Megumi, Gojo
// câmeras (window.TEST_CAM): 2i+1 = corpo inteiro do personagem i, 2i+2 = rosto do personagem i
addSet("teste", (g) => {
  const dome = skyDome(g, { top: 0x241e3a, mid: 0x7a4a62, hor: 0xf0a070, ground: 0x2a2028, exp: 0.6, sunDir: [0.35, 0.12, -1], sunCol: 0xffb070, sunI: 1.0, disk: 2.4, cov: 0.55, cloudA: 0.55, cloudLit: 0xffc8a0, cloudSh: 0x5a4a6a, midY: 0.12 });
  const gg = new THREE.PlaneGeometry(90, 90, 46, 46); gg.rotateX(-Math.PI / 2);
  const pa = gg.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), d = Math.hypot(x, z * 1.6); pa.setY(i, d < 9 ? 0 : (fbm2(x * 0.07, z * 0.07, 3) - 0.35) * Math.min(1, (d - 9) / 12) * 6); }
  gg.computeVertexNormals();
  mesh(gg, LPmat(0x6a5446, { rim: 0.3 }), 0, 0, 0, g);
  for (let i = 0; i < 16; i++) { const m = mesh(new THREE.IcosahedronGeometry(0.4 + hash(i) * 1.1, 0), LPmat(0x5a4c48, { rim: 0.4 }), -16 + hash(i * 3) * 32, 0.15, -7 - hash(i * 5) * 22, g); m.rotation.set(hash(i) * 3, hash(i * 2) * 3, 0); }
  const P = [yujiLP(), sukunaYujiLP(), megumiLP(), sukunaMegumiLP(), gojoLP()], X = [-4, -2, 0, 2, 4];
  P.forEach((p) => g.add(p));
  const F = [{ boca: "sorriso", sobe: 0.4 }, { boca: "risada", bravo: 0.7 }, { boca: "linha", bravo: 0.25 }, { boca: "risada", bravo: 0.8 }, { boca: "sorriso" }];
  return {
    bg: 0x2a2028, fog: [22, 95], fogCol: 0x6a4a5a, dome, hand: 0,
    look: { exposure: 1.1, bloom: 0.45, bloomT: 0.86, vig: 0.4, sat: 1.06, con: 1.05 },
    sun: { dir: [-0.45, 0.8, 0.75], col: 0xffe2c4, I: 1.7, c: [0, 1, 0], r: 8 }, hemi: { sky: 0xc0b0d8, ground: 0x4a3a32, I: 1.0 }, fill: { col: 0xffd2b0, I: 0.7, dir: [0.4, 0.35, 1] }, rim: { col: 0xffc8a0, str: 0.6 },
    update(t) { P.forEach((p, i) => { restPose(p); p.position.set(X[i], 0, 0); p.rotation.set(0, i % 2 ? -0.16 : 0.16, 0); idle(p, t, i * 5, 0.5); standFeet(p); rostoLP(p, t, F[i]); }); },
    cam() {
      const c = Math.max(1, window.TEST_CAM | 0), i = Math.floor((c - 1) / 2), x = X[Math.min(4, i)], sc = i === 4 ? 1.08 : 1;
      if ((c - 1) % 2 === 0) return { pos: [x + 0.4, 1.0 * sc, 3.5], look: [x, 0.96 * sc, 0], fov: 36 };
      return { pos: [x + 0.16, 1.74 * sc, 1.05], look: [x, 1.66 * sc, 0], fov: 30, near: 0.02 };
    },
  };
});
