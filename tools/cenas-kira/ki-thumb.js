// thumb: o homem sem rosto (símbolo original do Kira) parado sob a luz da rua, de pasta na mão; a única janela acesa atrás; lua e gato no muro
addSet("thumb", (g) => {
  const dome = skyDome(g, { top: 0x03060f, mid: 0x0c1430, hor: 0x2a2c48, ground: 0x05060a, exp: 0.6, sunDir: [-0.15, 0.32, -1], sunCol: 0xc8d8ff, sunI: 0.0, cov: 0.6, cloudA: 0.55, cloudLit: 0x6a7898, cloudSh: 0x1a2236, stars: 1.0, cloudScale: 0.14 });
  lua(g, [-9, 17, -46], 5);
  const at = texAsfalto(), road = SM(0xffffff, { map: rep(at.map.clone(), 3, 14), normalMap: rep(at.normalMap.clone(), 3, 14), roughness: 0.5, metalness: 0.08 }); road.map.needsUpdate = road.normalMap.needsUpdate = true;
  const rd = mesh(new THREE.PlaneGeometry(6.2, 60), road, 0, 0, -20, g); rd.rotation.x = -Math.PI / 2;
  [-2.6, 2.6].forEach((x) => { const l = mesh(new THREE.PlaneGeometry(0.12, 60), SM(0xd8d8d0, { roughness: 0.5 }), x, 0.006, -20, g); l.rotation.x = -Math.PI / 2; });
  muroBloco(g, -3.15, -2, 12, 1.5, Math.PI / 2); muroBloco(g, 3.15, -14, 30, 1.5, Math.PI / 2); muroBloco(g, -3.15, -24, 24, 1.5, Math.PI / 2);
  const casa = casaJP(g, 2.6, -13, { rot: 0, cor: "#d9cdb4", janelas: [[-1.6, 1.4, 0], [1.6, 1.4, 0], [-1.6, 4.0, 0.75], [1.6, 4.0, 0]], varandaX: 1.6 });
  casaJP(g, -8.4, -6, { rot: Math.PI / 2, cor: "#c8c4bc", janelas: [[-1.6, 1.4, 0], [1.6, 1.4, 0.4], [-1.6, 4.0, 0], [1.6, 4.0, 0]] });
  casaJP(g, -8.4, -24, { rot: Math.PI / 2, cor: "#c4b49c", janelas: [[-1.6, 1.4, 0.45], [1.6, 1.4, 0], [-1.6, 4.0, 0], [1.6, 4.0, 0]] });
  const wl = new THREE.PointLight(0xffb060, 2.0, 9, 1.6); wl.position.set(1.0, 4.0, -9.4); g.add(wl);
  const tops = [6, -8, -22].map((z) => posteJP(g, 2.75, z, 8.6));
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) fio(g, tops[i][j], tops[i + 1][j], 0.55 + j * 0.06, 0.011);
  const L1 = luzRua(g, -2.95, -0.6, { rot: Math.PI / 2, col: 0xe8eeff, I: 13 });
  const cat = gato(g, -3.15, 1.56, -4.2, Math.PI / 2); cat.head.rotation.y = -0.9;
  const p = semRosto(); g.add(p); const u = p.userData; const cs = pasta(u.wr[0]); cs.position.set(0, -0.11, 0.02);
  return {
    bg: 0x070a14, fog: [14, 70], fogCol: 0x0c1020, dome, hand: 0,
    look: { exposure: 1.3, bloom: 0.85, bloomT: 0.62, vig: 0.5, sat: 1.06, con: 1.08, lift: [0.01, 0.015, 0.035] },
    sun: { dir: [0.3, 0.7, -0.65], col: 0x9ab0e8, I: 0.9, c: [-1, 0, -2], r: 14 }, hemi: { sky: 0x3a4a78, ground: 0x0e0e16, I: 0.6 }, fill: { col: 0x6a80c0, I: 0.2 }, rim: { col: 0xb8c8ff, str: 0.7 },
    update() {
      restPose(p); p.position.set(-0.25, 0, 0.6); p.rotation.set(0, 0.06, 0); idle(p, 1.2, 7, 0.3); standFeet(p);
      pose(p, { armR: [0.05, 0, -0.12, -0.1], head: [-0.06, -0.15, 0.04], neck: [0, -0.1, 0] });
      pastaPendura(cs, p, [0, 0, 0]);
      casa.wins[2].m.emissiveIntensity = 0.8;
    },
    cam() { return { pos: [0.05, 0.72, 4.5], look: [-0.05, 2.5, -6.0], fov: 46, near: 0.05 }; },
  };
});
