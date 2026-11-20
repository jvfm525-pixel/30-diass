// teste dos personagens novos do vídeo do Sukuna: cães divinos, Mahoraga, Tsumiki e os objetos de luz
// câmeras (window.TEST_CAM): 1 cães, 2 Mahoraga corpo, 3 Mahoraga cabeça/roda, 4 Tsumiki rosto, 5 Tsumiki 3/4, 6 objetos de luz, 7 troca de cor (Megumi)
addSet("teste", (g) => {
  const dome = vazio(g, 0x1a1830, 0x5a4a70, 0x0a0810);
  mesh(new THREE.PlaneGeometry(80, 80), LPmat(0x3a3448, { rim: 0.2 }), 0, 0, 0, g).rotation.x = -Math.PI / 2;
  const lb = loboLP({ cor: 0xe8e8ee, escuro: 0x2a2a32 }), lp = loboLP({ cor: 0x23232b, escuro: 0xd8d8e0, olho: 0xf0f0f0 }); g.add(lb, lp); lb.position.set(-0.6, 0, 0); lp.position.set(0.6, 0, -0.2); lb.rotation.y = 0.5; lp.rotation.y = -0.4;
  const mh = mahoragaLP(); g.add(mh); mh.position.set(6, 0, 0);
  const ts = tsumikiLP(); g.add(ts); ts.position.set(12, 0, 0);
  const obj = grp(g, 18, 0, 0); const jl = jaulaLuz(obj, { z: -0.6 }); const ch = chaveLuz(obj); ch.c.position.set(-1.2, 1.6, 0.6); const rl = relogioLuz(obj); rl.c.position.set(1.2, 1.7, 0.6); const cs = casaLinhas(grp(obj, 0, 0, 2.5));
  const mg = megumiLP(); g.add(mg); mg.position.set(24, 0, 0); const TU = trocaCorPrep(mg, 0xffc860);
  return {
    bg: 0x1a1830, fog: [30, 120], dome, hand: 0,
    look: { exposure: 1.15, bloom: 0.55, bloomT: 0.8, vig: 0.3 },
    sun: { dir: [-0.5, 0.7, 0.6], col: 0xfff0e0, I: 2.0, c: [12, 1, 0], r: 16 }, hemi: { sky: 0xd8d0ff, ground: 0x4a4058, I: 1.1 }, fill: { col: 0xa0b0ff, I: 0.4, dir: [0.7, 0.3, -0.5] }, rim: { col: 0xffffff, str: 0.5 },
    update(t) {
      loboAnim(lb, t, { seed: 1, rosna: 0.6 }); loboAnim(lp, t, { seed: 4, olha: 0.3 });
      restPose(mh); pose(mh, { armR: [0.1, 0, -0.35, -0.3], armL: [0.1, 0, 0.35, -0.3] }); rodaClique(mh, t, [0.4, 1.0]);
      restPose(ts); idle(ts, t, 3, 0.4); standFeet(ts); rostoLP(ts, 1, { boca: "sorriso" });
      jl.set(1, t); ch.set(1, t); ch.c.rotation.y = t; rl.set(1, t * 1.2, t); cs.set(1);
      restPose(mg); idle(mg, t, 5, 0.3); standFeet(mg); rostoLP(mg, 1, { boca: "linha" }); TU.uY.value = 0.95;
    },
    cam() {
      const c = window.TEST_CAM | 0;
      return [null,
        { pos: [0.4, 1.0, 3.0], look: [0, 0.55, 0], fov: 32 },
        { pos: [6.8, 2.2, 7.2], look: [6, 2.0, 0], fov: 34 },
        { pos: [6.3, 3.7, 2.3], look: [6, 3.7, 0], fov: 34 },
        { pos: [12.05, 1.62, 1.1], look: [12, 1.57, 0], fov: 26 },
        { pos: [12.6, 1.6, 1.0], look: [12, 1.55, 0], fov: 28 },
        { pos: [18, 1.8, 6.5], look: [18, 1.5, 0], fov: 36 },
        { pos: [24.3, 1.3, 3.6], look: [24, 1.1, 0], fov: 32 }][c] || { pos: [0, 1, 4], look: [0, 1, 0], fov: 35 };
    },
  };
});
