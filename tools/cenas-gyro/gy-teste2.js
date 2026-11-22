// teste dos lugares: canteiro (t < 1) e barraco por dentro (t >= 1), dois ângulos cada
addSet("t-obra", (g) => {
  const C = canteiroObras(g);
  const k = silhueta(pessoaLP({ seed: 622, cabelo: CAB_GY.menino, scale: 0.62, botoes: false })); g.add(k); k.position.set(0.4, 0, 0.5); k.rotation.y = -0.4;
  const pai = silhueta(pessoaLP({ seed: 621, cabelo: CAB_GY.pai, scale: 1.04, botoes: false })); g.add(pai); pai.position.set(-1.2, 0, -0.6); pai.rotation.y = 0.5;
  return { bg: 0xffa860, fog: [25, 200], fogCol: 0xd88a6a, hand: 0, look: { exposure: 1.05, bloom: 0.35, bloomT: 0.82, vig: 0.4, sat: 1.1, con: 1.08, rosto: 0.3 },
    sun: { dir: [-0.3, 0.25, -1], col: 0xffa060, I: 2.4, c: [0, 1, -4], r: 22 }, hemi: { sky: 0xd8906a, ground: 0x3a2a20, I: 0.8 }, fill: { col: 0xffc0a0, I: 0.4, dir: [0.4, 0.3, 1] }, rim: { col: 0xffb070, str: 1.2 },
    update(t) { C.upd(t); vive(k, t, 701, {}, 0.0); vive(pai, t, 702, {}, 0.0); },
    cam(t) { return t < 0.5 ? { pos: [1.5, 1.6, 7.5], look: [-0.5, 1.6, -6], fov: 50 } : { pos: [-1.6, 0.9, 3.2], look: [0.4, 0.8, 0.3], fov: 40 }; } };
});
addSet("t-barraco", (g) => {
  const B = barracoDentro(g);
  const k = silhueta(pessoaLP({ seed: 622, cabelo: CAB_GY.menino, scale: 0.62, botoes: false })); g.add(k); k.position.set(-1.3, 0.12, -0.9); k.rotation.x = -Math.PI / 2; k.position.y = 0.2;
  const pai = silhueta(pessoaLP({ seed: 621, cabelo: CAB_GY.pai, scale: 1.04, botoes: false })); g.add(pai); pai.position.set(-0.2, 0, 1.6); pai.rotation.y = Math.PI;
  return { bg: 0x05050a, fog: [10, 40], fogCol: 0x0a0a10, hand: 0, look: { exposure: 1.1, bloom: 0.5, bloomT: 0.75, vig: 0.55, sat: 1.05, con: 1.1, rosto: 0.3 },
    sun: { dir: [0.4, 0.8, -0.3], col: 0x8aa0ff, I: 0.15, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x2a2a3a, ground: 0x1a120a, I: 0.45 }, fill: { col: 0xffa060, I: 0.1, dir: [0.3, 0.3, 1] }, rim: { col: 0xffb070, str: 1.0 },
    update(t) { B.upd(t); B.dob.rotation.y = t < 1.5 ? 0 : -1.2; vive(pai, t, 702, {}, 0.0); },
    cam(t) { return t < 1.5 ? { pos: [1.4, 1.5, 1.6], look: [-1.0, 0.4, -0.8], fov: 50 } : { pos: [0.9, 0.5, -1.4], look: [-0.3, 1.1, 1.6], fov: 46 }; } };
});
