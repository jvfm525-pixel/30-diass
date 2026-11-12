// thumb: o garoto calmo, o espírito dourado atrás com a coroa de raios e o punho carmesim parado por anéis dourados (personagens originais)
addSet("thumb", (g) => {
  const dome = skyDome(g, { top: 0x23306a, mid: 0x8a5a8a, midY: 0.16, hor: 0xffa060, ground: 0x2a1a14, sunDir: [0.5, 0.14, -1], sunCol: 0xffb060, sunI: 1.0, disk: 2.4, cov: 0.52, cloudA: 0.85, cloudLit: 0xffc8a0, cloudSh: 0x5a3a5a, cloudScale: 0.16 });
  const st = texPair(256, (u, v) => fbm2(u * 16, v * 16, 4, 16), (u, v, h) => mixc([200, 156, 108], [232, 196, 148], h), 2.2); rep(st.map, 12, 12); rep(st.normalMap, 12, 12);
  const fl = mesh(new THREE.PlaneGeometry(120, 120), SM(0xffffff, { map: st.map, normalMap: st.normalMap, roughness: 1 }), 0, 0, 0, g); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
  const bg = bayGeo(4.4, 7.2, 2.7, 5.4, 2.0), bm = matBlocos(texTravertino(), 0.16, 0.16, { col: 0xf6e8d0 });
  for (let tier = 0; tier < 3; tier++) for (let i = -7; i <= 7; i++) { const an = i * 0.075, R = 34; const b_ = mesh(bg, bm, Math.sin(an) * R, tier * 7.2, -Math.cos(an) * R + 6, g); b_.rotation.y = -an; if (tier === 2 && (i > 2 || i < -4)) b_.visible = false; }
  const rays = godRays(g, [8, 22, -30], [-0.3, -0.45, 1], { n: 9, len: 50, w: 4, spread: 18, opacity: 0.1, color: 0xffc080 });
  const motes = dustPts(200, [-4, 4, 0.3, 4, -3, 2], 0xffe0b0, 0.03, 0.8); g.add(motes);
  const gi = garoto(); g.add(gi);
  const sp = evoluir(espDourado({ emisI: 0.6 })); sp.scale.setScalar(1.25); g.add(sp); sp.userData.glow.material.opacity = 0.1;
  const cr = espCarmesim(); cr.scale.setScalar(1.15); g.add(cr); cr.userData.glow.material.opacity = 0.0;
  const fist = V3(0.33, 1.63, 0.34), CAM = V3(0.24, 1.36, 1.98);
  const rings = []; [0.08, 0.14, 0.21].forEach((r, i) => { const m = mesh(new THREE.TorusGeometry(r, 0.01, 8, 64), glowM(0xffd070, 0.85 - i * 0.22), fist.x - 0.04, fist.y, fist.z, g); m.lookAt(CAM); rings.push(m); });
  const fg = glowSprite(0xffd070, 0.5, 0.5); fg.position.copy(fist).add(V3(-0.06, 0, 0)); g.add(fg);
  return {
    bg: 0x2a1c22, fogExp: 0.006, fogCol: 0xc88a68, dome, hand: 0,
    look: { exposure: 1.0, bloom: 0.5, bloomT: 0.84, vig: 0.48, sat: 1.18, con: 1.12, lift: [0.02, 0.0, 0.03] },
    sun: { dir: [0.5, 0.35, -1], col: 0xffb070, I: 2.3, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x9a90c8, ground: 0x7a5034, I: 0.7 }, fill: { col: 0xffd0a0, I: 1.1, dir: [0.1, 0.4, 1] }, rim: { col: 0xffc890, str: 0.75 },
    update(t) {
      restPose(gi); gi.position.set(0, 0, 0); gi.rotation.set(0, 0.12, 0); idle(gi, 1.3, 11, 0.4); standFeet(gi, { hf: () => 0 }); face(gi, { smile: 0.42, lid: 0.86, brow: 0.0 }); clothWind(gi, 2.0, 1.6); gi.userData.eyes.forEach((e) => setEye(e, 0.82, 0.32, 0.02));
      lookAtW(gi, V3(0.8, 1.6, 2), 0.5);
      restPose(sp); sp.position.set(-0.38, 0.2, -0.62); sp.rotation.set(0, 0.25, 0); idle(sp, 1.3, 2, 0.3); evoAnim(sp, 1.3, 1);
      pose(sp, { legR: [0.15, 0, -0.04, 0.3, 0.3], legL: [0.05, 0, 0.05, 0.2, 0.25], armL: [-0.25, 0, 0.3, -0.3], handL: 0 });
      pose(sp, { armR: [-0.15, 0, -0.22, -0.4], armL: [-0.9, 0.2, 0.35, -0.5], handL: 0, handR: 0.3 });
      lookAtW(sp, fist, 0.7); sp.userData.eyeM.color.setScalar(3);
      restPose(cr); cr.position.set(1.2, 0.22, 0.5); cr.rotation.set(0, -Math.PI / 2 + 0.2, 0); idle(cr, 1.3, 31, 0.3); pose(cr, { spine: [0.15, 0, 0], chest: [0, 0.3, 0], handR: 1, handL: 1, armL: [0.4, 0, 0.3, -1.2] });
      armIK(cr, 0, fist, V3(fist.x + 0.4, fist.y - 0.6, fist.z + 0.6), 1);
      floatDust(motes, 1.3, 0.3, 0.2); dome.userData.u.uOff.value.set(0.004, 0);
    },
    cam() { return { pos: CAM.toArray(), look: [0.12, 1.78, -0.2], fov: 42, near: 0.05 }; },
  };
});
