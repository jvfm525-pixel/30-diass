// teste de 2 s: Gojo (cabelo duro, espetado) e Geto (comprido) lado a lado no vento, no telhado da escola à noite… simples: céu e chão
addSet("t-cabelo", (g) => {
  skyDome(g, { top: 0x2a4a8a, hor: 0xb8d0e8, ground: 0x4a4a40, sunDir: [0.5, 0.5, 0.6], sunI: 0.6, cov: 0.3 });
  const ch = mesh(new THREE.PlaneGeometry(60, 60), SM(0x6a7060), 0, 0, 0, g); ch.rotation.x = -Math.PI / 2;
  const go = gojoVendaLP(); g.add(go); go.position.set(-0.2, 0, 0); go.rotation.y = 0.35;
  const ge = getoLP(); g.add(ge); ge.position.set(0.2, 0, 0); ge.rotation.y = -0.35;
  return { bg: 0x8ab0d8, fog: [20, 120], fogCol: 0xb8d0e8, hand: 0, look: { exposure: 1.05, bloom: 0.3, bloomT: 0.9, vig: 0.35, rosto: 0.4 },
    sun: { dir: [0.4, 0.7, 0.8], col: 0xfff0e0, I: 2.0, c: [0, 1, 0], r: 6 }, hemi: { sky: 0xbfd8ff, ground: 0x5a5a4a, I: 0.8 }, fill: { col: 0xffe8d0, I: 0.4, dir: [-0.4, 0.3, 1] }, rim: { col: 0xffffff, str: 1.0 },
    update(t) { [go, ge].forEach((q, i) => { vive(q, t, 311 + i * 10, { boca: "linha", palpebra: 0.9 }, 0.08); cabeloVento(q, t, 1.0, [1, 0, -0.25]); }); maosBolso(go); },
    cam(t) { const a = olhosW(go), b = olhosW(ge), c = a.add(b).multiplyScalar(0.5); return { pos: [c.x, c.y + 0.02, c.z + 2.2], look: [c.x, c.y - 0.04, c.z], fov: 34, near: 0.03 }; } };
});
