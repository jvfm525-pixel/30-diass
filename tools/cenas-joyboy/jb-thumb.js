// thumb: o homem de luz (Joy Boy, original) na proa ao nascer do sol, cachecol ao vento, a bandeira do sol que ri acima
addSet("thumb", (g) => {
  const dome = skyDome(g, { top: 0x2a3a78, mid: 0xc07a7a, midY: 0.12, hor: 0xffb060, ground: 0x1a2028, sunDir: [0.05, 0.1, -1], sunCol: 0xffc070, sunI: 1.4, disk: 3.4, cov: 0.5, cloudA: 0.85, cloudLit: 0xffd0a0, cloudSh: 0x6a5a7a, cloudScale: 0.15 });
  const sea = oceano(g, { size: 300, segs: 120, deep: 0x0e3448, crest: 0x4a8aa0, foam: 0xf0f4f4, env: envGold(), envI: 0.6, amp: 0.6 });
  const nv = navio(g, { casco: 0x4a2c1a, faixa: 0xd8a848, vela: 0xe8d8b8 }); nv.rotation.y = Math.PI;
  const hl = homemLuz({ luz: 1.4, brilho: 1.0, cachecol: 2.8 }); nv.add(hl); hl.position.set(0, nv.userData.deckY + 0.08, 4.4); hl.scale.setScalar(1.12);
  const rays = godRays(g, [0, 20, -120], [0, -0.15, 1], { n: 10, len: 160, w: 9, spread: 36, opacity: 0.08, color: 0xffc080 });
  const brd = birds(g, 7, { center: [0, 14, -10], rx: 14, rz: 8, speed: 0.12, color: 0x2a2a30 });
  return {
    bg: 0x6a7090, fogExp: 0.005, fogCol: 0xd8a890, dome, hand: 0,
    look: { exposure: 1.05, bloom: 0.6, bloomT: 0.8, vig: 0.5, sat: 1.2, con: 1.1, lift: [0.02, 0.0, 0.03] },
    sun: { dir: [0.05, 0.35, -1], col: 0xffc080, I: 2.4, c: [0, 2, 0], r: 12 }, hemi: { sky: 0x9ab0e0, ground: 0x2a3a48, I: 0.7 }, fill: { col: 0xffd8b0, I: 0.7, dir: [0.2, 0.4, 1] }, rim: { col: 0xffd0a0, str: 0.8 },
    update(t) {
      const T0 = 1.4; nv.position.set(0, -0.35, 0); nv.userData.velas.forEach((v) => v(T0, 1.2)); nv.userData.flag.upd(T0, 1.4);
      restPose(hl); idle(hl, T0, 71, 0.3); standFeetOn(hl, nv, { y: nv.userData.deckY + 0.08, spread: 1.4 });
      pose(hl, { armR: [-0.2, 0, -0.35, -0.2], armL: [-1.2, 0.3, 0.6, -0.15], handL: 0, head: [-0.12, 0, 0], chest: [-0.06, 0, 0] });
      clothWind(hl, T0, 2.6, [0.25, 0.05, 0.1]);
      sea.upd(T0); brd(T0); rays.userData.rays.forEach((r, i) => (r.material.opacity = 0.07 + 0.02 * Math.sin(i)));
    },
    cam() { return { pos: [-1.75, 0.95, -6.7], look: [-0.1, 2.35, -4.1], fov: 44, near: 0.05 }; },
  };
});
