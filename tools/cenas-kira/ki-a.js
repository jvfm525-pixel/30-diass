// ================================================================ vídeo: Kira · cenas 1–5

// ---------------------------------------------------------------- utilidades de cena
// distância percorrida com velocidade constante e desaceleração final (chega em D no instante t1, parado)
function andarAte(t, t0, t1, D, td = 1.1) {
  const T_ = t1 - t0, v = D / (T_ - td / 2), tau = clamp(t - t0, 0, T_);
  if (tau < T_ - td) return v * tau;
  const s = tau - (T_ - td); return v * (T_ - td) + v * s - (v * s * s) / (2 * td);
}
// pasta pendurada na mão: fica na vertical (gira só no rumo do corpo) e balança com a mola
function pastaPendura(b, p, L) {
  const pq = new THREE.Quaternion(); b.parent.getWorldQuaternion(pq);
  const want = new THREE.Quaternion().setFromEuler(new THREE.Euler(clamp(L[2] * 5, -0.5, 0.5), p.rotation.y, clamp(-L[0] * 5, -0.5, 0.5), "YXZ"));
  b.quaternion.copy(pq.invert().multiply(want));
}
// cidade distante (prédios com janelas acesas), para o fundo das cenas de rua
const janelasTex = canvasTex(256, 512, (c, w, h) => { c.fillStyle = "#0a0c14"; c.fillRect(0, 0, w, h); for (let y = 8; y < h; y += 18) for (let x = 6; x < w; x += 14) { const r = hash2(x * 0.37, y * 0.71); if (r > 0.55) { c.fillStyle = r > 0.9 ? "#ffe8b0" : r > 0.75 ? "#ffc878" : "#9ab4d8"; c.globalAlpha = 0.35 + r * 0.5; c.fillRect(x, y, 8, 10); } } c.globalAlpha = 1; });
function cidadeLonge(g, z0, n = 40, o = {}) {
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshBasicMaterial({ map: janelasTex, color: o.tint ?? 0xffffff, fog: true });
  const blds = [];
  for (let i = 0; i < n; i++) {
    const w = 8 + hash(i * 3.1) * 16, h = 12 + Math.pow(hash(i * 5.7), 2) * (o.hmax ?? 70), x = (i / n - 0.5) * (o.span ?? 420) + (hash(i * 7.3) - 0.5) * 12, z = z0 - hash(i * 9.1) * 60;
    const m = new THREE.Mesh(geo, mat.clone()); m.material.map = janelasTex.clone(); m.material.map.needsUpdate = true; m.material.map.wrapS = m.material.map.wrapT = THREE.RepeatWrapping; m.material.map.repeat.set(w / 18, h / 34); m.material.map.offset.set(hash(i), hash(i * 2));
    m.scale.set(w, h, w * 0.8); m.position.set(x, 0, z); g.add(m); blds.push(m);
    if (h > 50) { const red = glowSprite(0xff3030, 4, 0.8); red.position.set(x, h + 1, z); g.add(red); blds.push(red); }
  }
  return blds;
}

// ---------------------------------------------------------------- 1 · rua residencial à noite: o homem sem rosto volta pra casa; uma janela acesa
addSet("s1-rua", (g) => {
  const [a, b] = T.sc["s1-rua"];
  // céu noturno, lua, cidade no fim da rua
  const dome = skyDome(g, { top: 0x03060f, mid: 0x0c1428, hor: 0x2a2c40, ground: 0x05060a, exp: 0.6, sunDir: [-0.15, 0.32, -1], sunCol: 0xc8d8ff, sunI: 0.12, disk: 0.6, cov: 0.62, cloudA: 0.55, cloudLit: 0x6a7898, cloudSh: 0x1a2236, stars: 0.9, cloudScale: 0.14 });
  lua(g, [38, 66, 172], 11);
  cidadeLonge(g, 250, 46, { hmax: 80 });
  // chão: rua de asfalto com faixas brancas, quintais, calçamento na frente dos portões
  const at = texAsfalto(), road = SM(0xffffff, { map: rep(at.map.clone(), 3, 48), normalMap: rep(at.normalMap.clone(), 3, 48), roughness: 0.62, metalness: 0.05 }); road.map.needsUpdate = road.normalMap.needsUpdate = true;
  const rd = mesh(new THREE.PlaneGeometry(6.2, 170), road, 0, 0, 20, g); rd.rotation.x = -Math.PI / 2;
  [-2.6, 2.6].forEach((x) => { const l = mesh(new THREE.PlaneGeometry(0.12, 170), SM(0xd8d8d0, { roughness: 0.5 }), x, 0.006, 20, g); l.rotation.x = -Math.PI / 2; l.receiveShadow = true; });
  const tm = mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshStandardMaterial({ map: tomareTex, transparent: true, roughness: 0.6, depthWrite: false }), -1.3, 0.008, 13.2, g); tm.rotation.x = -Math.PI / 2; tm.castShadow = false;
  mesh(new THREE.PlaneGeometry(2.6, 0.25), SM(0xd8d8d0), -1.3, 0.007, 12.0, g).rotation.x = -Math.PI / 2;
  placaPare(g, -3.15, 11.8, Math.PI / 2);
  const yard = SM(0x2a3020, { roughness: 1 });
  [-1, 1].forEach((k) => { const y_ = mesh(new THREE.PlaneGeometry(24, 170), yard, k * 15.1, -0.01, 20, g); y_.rotation.x = -Math.PI / 2; });
  // muros de blocos dos dois lados (com portões) e casas atrás
  const gates = { L: [-6, 22, 36, 50, -20], R: [2, 16, 30, 44, -12] };
  const muroLado = (k, zs) => { const xs = k * 3.15; let z = 70; zs.slice().sort((p, q) => q - p).forEach((gz) => { const len = z - (gz + 0.7); if (len > 0.2) muroBloco(g, xs, (z + gz + 0.7) / 2, len, 1.5, Math.PI / 2); z = gz - 0.7; [gz + 0.75, gz - 0.75].forEach((pz) => mesh(box(0.32, 1.75, 0.32), SM(0x8a8680, { roughness: 0.9 }), xs, 0.875, pz, g)); }); muroBloco(g, xs, (z - 40) / 2, z + 40, 1.5, Math.PI / 2); };
  muroLado(-1, [...gates.L, 9.5, 7.1]); muroLado(1, gates.R);
  const cores = ["#d9cdb4", "#c8c4bc", "#d4c0a8", "#bcc4c8", "#e0d6c4", "#c4b49c", "#d8d0c0", "#b8b0a4"];
  const casas = [];
  gates.L.forEach((z, i) => casas.push(casaJP(g, -8.4, z, { rot: Math.PI / 2, cor: cores[i], janelas: z === -6 ? [[-1.6, 1.4, 0], [1.6, 1.4, 0], [-1.6, 4.0, 0.55], [1.6, 4.0, 0]] : [[-1.6, 1.4, hash(i) > 0.5 ? 0.6 : 0], [1.6, 1.4, 0], [-1.6, 4.0, hash(i * 3) > 0.6 ? 0.5 : 0], [1.6, 4.0, 0]], acX: -2.6, varandaX: 1.6 })));
  gates.R.forEach((z, i) => casas.push(casaJP(g, 8.4, z, { rot: -Math.PI / 2, cor: cores[i + 4], janelas: [[-1.6, 1.4, hash(i * 7) > 0.4 ? 0.5 : 0], [1.6, 1.4, hash(i * 2) > 0.6 ? 0.45 : 0], [-1.6, 4.0, 0], [1.6, 4.0, hash(i * 9) > 0.5 ? 0.45 : 0]] })));
  const minha = casas[0];
  // luz da janela do quarto (a única acesa da casa) e lâmpada do portão
  const winL = new THREE.PointLight(0xffb060, 1.2, 8, 1.6); winL.position.set(-4.85, 4.0, -4.4); g.add(winL);
  const gateLamp = grp(g, -3.15, 1.9, -6.85); mesh(box(0.16, 0.22, 0.12), new THREE.MeshStandardMaterial({ color: 0xffe0b0, emissive: 0xffb060, emissiveIntensity: 1.6 }), 0, 0, 0, gateLamp);
  const gl0 = new THREE.PointLight(0xffb870, 1.6, 5, 1.6); gl0.position.set(0.3, 0, 0); gateLamp.add(gl0); gateLamp.add(glowSprite(0xffc080, 0.9, 0.5));
  mesh(box(0.06, 0.3, 0.22), SM(0x2a2a2e), -3.0, 1.2, -5.25, g); // caixa de correio
  // postes, fios, luzes da rua, máquina de bebidas, gato no muro, vasos e bicicleta
  const PZ = [54, 40, 26, 12, -2, -16, -30], tops = PZ.map((z, i) => posteJP(g, 2.75, z, 8.6, { trafo: i === 3 || i === 0 }));
  for (let i = 0; i < tops.length - 1; i++) for (let j = 0; j < 3; j++) fio(g, tops[i][j], tops[i + 1][j], 0.55 + j * 0.06, 0.011);
  [[-1, 36], [-1, 22], [-1, -6], [1, 30], [1, 16], [1, 2], [1, -12]].forEach(([k, z]) => fio(g, tops[Math.min(PZ.length - 1, Math.max(0, Math.round((54 - z) / 14)))][k < 0 ? 0 : 2], [k * 5.25, 4.9, z + 1.6], 0.35, 0.008));
  const luzes = [luzRua(g, -2.95, 5.5, { rot: Math.PI / 2, col: 0xdfe8ff, I: 22 }), luzRua(g, -2.95, -9.5, { rot: Math.PI / 2, col: 0xdfe8ff, I: 22 }), luzRua(g, 2.95, 19, { rot: -Math.PI / 2, col: 0xffc890, I: 20 }), luzRua(g, -2.95, 33, { rot: Math.PI / 2, col: 0xdfe8ff, I: 18 }), luzRua(g, 2.95, 47, { rot: -Math.PI / 2, col: 0xffc890, I: 16 })];
  const maq = maquinaBebidas(g, -2.6, -1.0, Math.PI / 2);
  const cat = gato(g, -3.15, 1.56, 2.3, Math.PI / 2);
  const vaso = (x, z, s = 1) => { mesh(cyl(0.16 * s, 0.12 * s, 0.32 * s, 12), SM(0x8a4a30, { roughness: 0.8 }), x, 0.16 * s, z, g); [0, 1, 2].forEach((i) => mesh(sph(0.14 * s, 10, 8), SM(0x2a4a24, { roughness: 0.9 }), x + (hash(i + x) - 0.5) * 0.16 * s, 0.38 * s + i * 0.06, z + (hash(i * 3 + z) - 0.5) * 0.16, g)); };
  vaso(-2.8, -4.9, 1.1); vaso(-2.8, -7.1, 0.9); vaso(2.8, 1.0); vaso(2.75, 17.1, 1.2); vaso(-2.8, 23.3); vaso(2.8, 3.1, 0.8);
  const bike = grp(g, 2.65, 0, 14.4); bike.rotation.y = 0.05; const bm = SM(0x3a6a8a, { metalness: 0.5, roughness: 0.4 });
  [-0.5, 0.5].forEach((z) => { const w = mesh(new THREE.TorusGeometry(0.32, 0.025, 6, 24), SM(0x1a1a1a), 0, 0.34, z, bike); w.rotation.y = Math.PI / 2; });
  mesh(box(0.04, 0.04, 0.9), bm, 0, 0.55, 0, bike); mesh(box(0.04, 0.45, 0.04), bm, 0, 0.6, -0.15, bike); mesh(box(0.05, 0.03, 0.22), SM(0x1a1a1a), 0, 0.85, -0.15, bike); mesh(box(0.5, 0.03, 0.03), SM(0x8a8a8a, { metalness: 0.7 }), 0, 0.92, 0.42, bike);
  // folhas secas e mariposas nas luzes
  const folhas = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.07, 0.05), SM(0x7a5a2a, { side: THREE.DoubleSide, roughness: 0.9 }), 120);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(); for (let i = 0; i < 120; i++) { M4.compose(V3((hash(i) - 0.5) * 5.6, 0.012, 30 - hash(i * 3) * 42), Q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, hash(i * 5) * 6)), V3(1, 1, 1)); folhas.setMatrixAt(i, M4); } g.add(folhas);
  const moths = luzes.slice(0, 2).map((l, i) => { const d = dustPts(14, [-0.5, 0.5, -0.4, 0.4, -0.5, 0.5], 0xfff4dc, 0.035, 0.9, ADD, i + 3); d.position.copy(wpos(l.lamp)); g.add(d); return d; });
  // o homem sem rosto, de pasta na mão: anda até o portão de casa e para com os dois pés no chão
  const p = semRosto(); g.add(p); const u = p.userData; const case_ = pasta(u.wr[0]); case_.position.set(0, -0.11, 0.02);
  const X0 = -1.45, Z0 = 4.6, ZS = -5.95, D = Z0 - ZS, L = gaitFit(D, 0.62), tStop = K.normal0 + 0.15;
  const distF = (t) => andarAte(t, a - 0.4, tStop, D, 1.3);
  const chestPos = (tt) => { const d = distF(tt), ph = (d / (2 * L)) * Math.PI * 2; return [X0 + Math.sin(ph) * 0.02, 1.32 + Math.cos(2 * ph) * 0.016, Z0 - d]; };
  const janela = V3(-5.34, 4.0, -4.4);
  return {
    bg: 0x070a14, fog: [16, 150], fogCol: 0x0c1020, dome,
    look: { exposure: 1.2, bloom: 0.8, bloomT: 0.66, bloomR: 0.55, vig: 0.48, sat: 1.05, con: 1.06, lift: [0.01, 0.015, 0.032] },
    sun: { dir: [0.3, 0.7, 0.65], col: 0x9ab0e8, I: 0.85, c: [-1, 0, -2], r: 16 }, hemi: { sky: 0x3a4a78, ground: 0x0e0e16, I: 0.6 }, fill: { col: 0x6a80c0, I: 0.12 }, rim: { col: 0xb8c8ff, str: 0.5 }, hand: 0.008,
    update(t) {
      dome.userData.u.uOff.value.set(t * 0.002, 0);
      const d = distF(t);
      restPose(p);
      const gg = gait(p, d, { from: [X0, 0, Z0], ang: Math.PI, step: L, amt: 0.95 });
      const walking = clamp((tStop - t) / 0.6);
      u.sh[0].rotation.x *= 0.3; u.el[0].rotation.x = -0.1; u.sh[0].rotation.z = -0.1; // braço da pasta quase parado
      idle(p, t, 7, 0.25 + 0.75 * (1 - walking));
      // parado no portão: vira a cabeça e o peito para a janela acesa (antecipação e acomodação)
      const lk = act(t, K.normal0 + 0.05, K.fica + 0.3, 0.1, 0.08);
      if (lk > 0) { lookAtW(p, janela, clamp(lk), 1.25); u.chest.rotation.y += 0.35 * lk; u.spine.rotation.y += 0.15 * lk; }
      const Lg = molaHomem(p, t, chestPos);
      pastaPendura(case_, p, Lg);
      // gato acompanha o homem com a cabeça; a cauda balança
      const cp = cat.c.position, ang = Math.atan2(X0 - cp.x, gg.pos[2] - cp.z) - Math.PI / 2;
      cat.head.rotation.y = clamp(-ang, -1.2, 1.2) * 0.8 + Math.sin(t * 0.7) * 0.05; cat.tail.rotation.z = Math.sin(t * 1.6) * 0.35; cat.tail.rotation.y = Math.sin(t * 0.9) * 0.2;
      // a luz da rua pisca quando a narração diz "assassino"
      const fl = t > K.assassino0 - 0.1 && t < K.assassino0 + 1.1 ? (noise1(t * 31) > 0.1 ? 1 : 0.15) * (0.6 + 0.4 * noise1(t * 9)) : 1;
      luzes[1].L.intensity = luzes[1].I * fl; luzes[1].glow.material.opacity = 0.6 * fl; luzes[1].cone.material.opacity = 0.05 * fl; luzes[1].lamp.material.color.setScalar(0.25 + 0.75 * fl);
      maq.L.intensity = 2.1 + noise1(t * 3) * 0.15;
      moths.forEach((m, i) => floatDust(m, t * (1.6 + i * 0.3), 0.35, 1.2));
      // a janela do quarto pulsa de leve (alguém lá dentro)
      const w = minha.wins[2]; w.m.emissiveIntensity = 0.55 + Math.sin(t * 2.1) * 0.03; winL.intensity = 1.2 + Math.sin(t * 2.1) * 0.08;
    },
    cam(t) {
      if (T.cortes) { // estilo novo: um ângulo diferente a cada ~1,5 s, cada um com leve empurrão
        const z = Z0 - distF(t), S = [
          [0, [0.4, 1.0, z - 2.6], [-1.45, 1.55, z], 34], [1.6, [-0.3, 7.5, z - 9], [-1.4, 0.8, z + 3], 38], [3.0, [0.9, 0.5, z - 1.5], [-1.45, 1.7, z], 40],
          [4.6, [-2.3, 1.7, z - 1.2], [-1.45, 1.55, z], 30], [6.1, [0.35, 0.8, z - 1.4], [-1.45, 1.65, z], 28], [7.6, [-0.2, 2.2, z + 2.4], [-1.45, 1.4, z - 1], 36],
          [8.8, [0.9, 2.15, -7.6], [-5.3, 4.05, -4.6], 34]];
        let i = 0; while (i < S.length - 1 && t >= S[i + 1][0]) i++;
        const k = seg(t, S[i][0], (S[i + 1] || [S[i][0] + 1.5])[0]), c = S[i];
        return { pos: lerp3(c[1], lerp3(c[1], c[2], 0.12), k), look: c[2], fov: c[3] - 2 * k };
      }
      return path2(t, [
        [a, [-0.3, 9.0, -16.0], [-1.3, 0.8, 2.5], 38],
        [K.so0 + 0.2, [-0.6, 4.0, -9.5], [-1.4, 1.2, 0.6], 36],
        [K.oito0 + 0.4, [0.1, 1.9, -7.6], [-1.45, 1.35, -2.2], 36],
        [K.assassino0 + 0.3, [0.25, 0.95, -8.6], [-1.42, 1.5, -4.6], 34],
        [K.normal0 + 0.3, [0.3, 1.35, -9.9], [-1.5, 1.55, -6.0], 34],
        [K.fica + 0.25, [0.6, 1.95, -9.3], [-3.2, 2.9, -6.0], 34],
        [b, [0.9, 2.15, -7.6], [-5.3, 4.05, -4.6], 34],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 2 · a rotina: o quarto. Chega às 20h, afrouxa a gravata; às 23h, leite morno; luz apagada, 8 horas de sono
// relógio de parede analógico (ponteiros giram com a hora dada)
function relogioParede(parent, x, y, z, r = 0.26) {
  const c = grp(parent, x, y, z);
  const face = canvasTex(256, 256, (g, w) => { const R = w / 2; g.fillStyle = "#f4f0e6"; g.beginPath(); g.arc(R, R, R, 0, 7); g.fill(); g.fillStyle = "#1a1a1e"; g.font = "700 30px 'Archivo Black', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    for (let i = 1; i <= 12; i++) { const a_ = (i / 12) * Math.PI * 2; g.fillText(String(i), R + Math.sin(a_) * R * 0.76, R - Math.cos(a_) * R * 0.76); }
    for (let i = 0; i < 60; i++) { const a_ = (i / 60) * Math.PI * 2, r0 = i % 5 ? 0.92 : 0.88; g.fillRect(R + Math.sin(a_) * R * r0 - 1.5, R - Math.cos(a_) * R * r0 - 1.5, 3, 3); } });
  mesh(cyl(r + 0.025, r + 0.025, 0.05, 40), SM(0x2a2622, { roughness: 0.5 }), 0, 0, -0.01, c).rotation.x = Math.PI / 2;
  const fm = mesh(new THREE.CircleGeometry(r, 40), SM(0xffffff, { map: face, roughness: 0.6 }), 0, 0, 0.018, c); fm.castShadow = false;
  const hand_ = (len, w, col, z_) => { const h = grp(c, 0, 0, z_); mesh(box(w, len, 0.006), SM(col, { roughness: 0.4 }), 0, len * 0.4, 0, h); return h; };
  const hh = hand_(r * 0.55, 0.022, 0x141418, 0.024), mm = hand_(r * 0.8, 0.014, 0x141418, 0.03), ss = hand_(r * 0.85, 0.005, 0xc8202a, 0.036);
  mesh(cyl(0.012, 0.012, 0.03, 10), SM(0x141418), 0, 0, 0.03, c).rotation.x = Math.PI / 2;
  return { c, set(hours) { const m = (hours % 1) * 60; hh.rotation.z = -((hours % 12) / 12) * Math.PI * 2; mm.rotation.z = -(m / 60) * Math.PI * 2; ss.rotation.z = -((m * 60) % 60) / 60 * Math.PI * 2; } };
}
addSet("s2-rotina", (g) => {
  const [a, b] = T.sc["s2-rotina"];
  const RX = 2.3, RZ0 = -2.0, RZ1 = 2.6, RH = 2.5;
  // paredes, piso, teto (janela de verdade na parede do fundo: a lua entra por ela)
  const pp = texPapelParede("#cbbfa8", "#c2b59c"), wallM = SM(0xffffff, { map: rep(pp.clone(), 4, 2), roughness: 0.9 }); wallM.map.needsUpdate = true;
  const pk = texPlanks([150, 112, 76], [128, 92, 60]), floorM = SM(0xffffff, { map: rep(pk.map.clone(), 2.5, 2.5), normalMap: rep(pk.normalMap.clone(), 2.5, 2.5), roughness: 0.55 }); floorM.map.needsUpdate = floorM.normalMap.needsUpdate = true;
  mesh(box(RX * 2, 0.1, RZ1 - RZ0), floorM, 0, -0.05, (RZ0 + RZ1) / 2, g);
  mesh(box(RX * 2, 0.1, RZ1 - RZ0), SM(0xe8e4dc, { roughness: 0.95 }), 0, RH + 0.05, (RZ0 + RZ1) / 2, g);
  const WX0 = -1.55, WX1 = -0.35, WY0 = 1.0, WY1 = 2.05;
  mesh(box(WX0 + RX, RH, 0.12), wallM, (-RX + WX0) / 2, RH / 2, RZ0 - 0.06, g);
  mesh(box(RX - WX1, RH, 0.12), wallM, (WX1 + RX) / 2, RH / 2, RZ0 - 0.06, g);
  mesh(box(WX1 - WX0, WY0, 0.12), wallM, (WX0 + WX1) / 2, WY0 / 2, RZ0 - 0.06, g);
  mesh(box(WX1 - WX0, RH - WY1, 0.12), wallM, (WX0 + WX1) / 2, (RH + WY1) / 2, RZ0 - 0.06, g);
  mesh(box(0.12, RH, RZ1 - RZ0), wallM, -RX - 0.06, RH / 2, (RZ0 + RZ1) / 2, g);
  // parede direita com o vão da porta (z de -0.6 a 0.3)
  mesh(box(0.12, RH, -0.6 - RZ0), wallM, RX + 0.06, RH / 2, (RZ0 - 0.6) / 2, g); mesh(box(0.12, RH, RZ1 - 0.3), wallM, RX + 0.06, RH / 2, (RZ1 + 0.3) / 2, g); mesh(box(0.12, RH - 2.05, 0.9), wallM, RX + 0.06, (RH + 2.05) / 2, -0.15, g);
  mesh(box(4.6, 0.08, 0.02), SM(0x6a4a30), 0, 0.04, RZ0 + 0.005, g); // rodapé
  // caixilho da janela, vidro, cortinas e a vista da cidade à noite (céu, lua, prédios)
  const frM = SM(0xe8e4dc, { roughness: 0.5 });
  [[WX0, (WY0 + WY1) / 2, 0.05, WY1 - WY0], [WX1, (WY0 + WY1) / 2, 0.05, WY1 - WY0], [(WX0 + WX1) / 2, WY0, WX1 - WX0, 0.05], [(WX0 + WX1) / 2, WY1, WX1 - WX0, 0.05], [(WX0 + WX1) / 2, (WY0 + WY1) / 2, 0.035, WY1 - WY0]].forEach(([x, y, w, h]) => mesh(box(w, h, 0.07), frM, x, y, RZ0 - 0.04, g));
  const vista = canvasTex(512, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#040814"); gr.addColorStop(0.6, "#101a34"); gr.addColorStop(1, "#2a2a40"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + hash(i) * 0.6})`; c.fillRect(hash(i * 3) * w, hash(i * 5) * h * 0.55, 1.5, 1.5); }
    const mg = c.createRadialGradient(150, 120, 0, 150, 120, 90); mg.addColorStop(0, "rgba(255,250,235,1)"); mg.addColorStop(0.32, "rgba(250,244,226,1)"); mg.addColorStop(0.36, "rgba(200,215,255,.35)"); mg.addColorStop(1, "rgba(160,180,255,0)"); c.fillStyle = mg; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 28; i++) { const bx = (i / 28) * w + hash(i) * 10, bw = 14 + hash(i * 3) * 26, bh = 60 + hash(i * 7) * 170; c.fillStyle = "#070a12"; c.fillRect(bx, h - bh, bw, bh); for (let yy = h - bh + 6; yy < h - 4; yy += 9) for (let xx = bx + 3; xx < bx + bw - 3; xx += 6) if (hash2(xx, yy) > 0.62) { c.fillStyle = hash2(yy, xx) > 0.5 ? "rgba(255,200,120,.8)" : "rgba(160,190,230,.6)"; c.fillRect(xx, yy, 3, 4); } } });
  const vw = mesh(new THREE.PlaneGeometry(5.2, 4.4), new THREE.MeshBasicMaterial({ map: vista, fog: false }), (WX0 + WX1) / 2, 1.6, RZ0 - 2.6, g); vw.castShadow = false; vw.receiveShadow = false;
  const vidro = mesh(new THREE.PlaneGeometry(WX1 - WX0, WY1 - WY0), new THREE.MeshStandardMaterial({ color: 0x9ab0d0, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.2, depthWrite: false }), (WX0 + WX1) / 2, (WY0 + WY1) / 2, RZ0 - 0.03, g); vidro.castShadow = false;
  const curGeo = () => { const geo = new THREE.PlaneGeometry(0.55, 1.5, 12, 1); geo.userData.base = Float32Array.from(geo.attributes.position.array); return geo; };
  const curM = new THREE.MeshStandardMaterial({ color: 0xc8b8d0, roughness: 0.95, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
  const curtains = [WX0 - 0.12, WX1 + 0.12].map((x) => { const m = mesh(curGeo(), curM, x, (WY0 + WY1) / 2 + 0.12, RZ0 + 0.06, g); m.castShadow = true; return m; });
  // cama de casal arrumada, criado-mudo, abajur, despertador, copo de leite, tapete, chinelos, guarda-roupa, cabideiro, quadro
  const bed = grp(g, -1.55, 0, -0.95);
  mesh(box(1.5, 0.32, 2.1), SM(0x5a3a26, { roughness: 0.6 }), 0, 0.16, 0, bed); mesh(box(1.55, 0.95, 0.08), SM(0x4a2e1e, { roughness: 0.6 }), 0, 0.5, -1.06, bed);
  mesh(box(1.42, 0.22, 2.0), SM(0xf0ece4, { roughness: 0.9 }), 0, 0.43, 0, bed);
  [-0.35, 0.35].forEach((x) => { const pl = mesh(sph(1, 16, 10), SM(0xf4f2ec, { roughness: 0.95 }), x, 0.6, -0.78, bed); pl.scale.set(0.3, 0.07, 0.17); });
  const duvGeo = new THREE.PlaneGeometry(1.5, 1.46, 18, 18); duvGeo.rotateX(-Math.PI / 2);
  const duvBase = Float32Array.from(duvGeo.attributes.position.array);
  const duvet = mesh(duvGeo, SM(0x6a7a96, { roughness: 0.92, side: THREE.DoubleSide }), 0, 0.56, 0.41, bed);
  const setDuvet = (body) => { const P_ = duvGeo.attributes.position; for (let i = 0; i < P_.count; i++) { const x = duvBase[i * 3], z = duvBase[i * 3 + 2], edge = Math.max(0, Math.abs(x) - 0.62) * 2.2; let y = -edge * 0.5 + Math.sin(x * 9 + z * 3) * 0.006;
      if (body) { const ex = Math.exp(-(x * x) / 0.15), sh = smr(z, -0.73, -0.55); y += ex * (0.31 - Math.max(0, z - 0.2) * 0.14) * sh + ex * 0.1 * (1 - sh); }
      P_.setY(i, y); } P_.needsUpdate = true; duvGeo.computeVertexNormals(); };
  setDuvet(false);
  const ns = grp(g, -0.5, 0, -1.72); mesh(box(0.5, 0.58, 0.42), SM(0x5a3a26, { roughness: 0.6 }), 0, 0.29, 0, ns); mesh(box(0.52, 0.03, 0.44), SM(0x4a2e1e, { roughness: 0.5 }), 0, 0.595, 0, ns);
  mesh(box(0.3, 0.03, 0.02), SM(0xb8a070, { metalness: 0.7, roughness: 0.3 }), 0, 0.42, 0.215, ns);
  const lampG = grp(ns, -0.15, 0.61, -0.11); mesh(cyl(0.05, 0.07, 0.04, 16), SM(0x2a2622), 0, 0.02, 0, lampG); mesh(cyl(0.012, 0.012, 0.3, 8), SM(0xb8a070, { metalness: 0.7 }), 0, 0.18, 0, lampG);
  const shadeM = new THREE.MeshStandardMaterial({ color: 0xf0e0c0, emissive: 0xffb860, emissiveIntensity: 0, roughness: 0.9, side: THREE.DoubleSide });
  mesh(cyl(0.08, 0.13, 0.17, 20, 1, true), shadeM, 0, 0.36, 0, lampG);
  const lampL = new THREE.PointLight(0xffb060, 0, 5, 2); lampL.position.set(0, 0.33, 0); lampG.add(lampL);
  const lampGl = glowSprite(0xffc070, 0.7, 0); lampGl.position.set(0, 0.36, 0); lampG.add(lampGl);
  const alarmTex = canvasTex(128, 64, (c, w, h) => { c.fillStyle = "#0a0606"; c.fillRect(0, 0, w, h); c.fillStyle = "#ff3a2a"; c.font = "700 40px 'Space Mono', monospace"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("23:00", w / 2, h / 2 + 2); }, { redraw: true });
  const alarm = grp(ns, -0.12, 0.61, 0.08); alarm.rotation.y = 0.5; mesh(box(0.14, 0.07, 0.06), SM(0x1a1a1e, { roughness: 0.4 }), 0, 0.035, 0, alarm);
  const alD = mesh(new THREE.PlaneGeometry(0.12, 0.055), new THREE.MeshBasicMaterial({ map: alarmTex }), 0, 0.037, 0.031, alarm); alD.castShadow = false;
  const G0 = V3(-0.47, 0.61, -1.6);
  const copo = grp(g, G0.x, G0.y, G0.z);
  mesh(cyl(0.036, 0.031, 0.13, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }), 0, 0.065, 0, copo);
  const leite = mesh(cyl(0.033, 0.029, 0.1, 20), SM(0xfbf8f0, { roughness: 0.4 }), 0, 0.052, 0, copo);
  const vap = steam(g, { origin: [G0.x, G0.y + 0.14, G0.z], n: 14, size: 0.05, rise: 0.06, grow: 1.4, opacity: 0.32, life: 2.6, spread: 0.03, wind: [0.005, 0, 0.004], color: 0xffffff });
  const tapete = mesh(new THREE.CircleGeometry(1.1, 40), SM(0x6a3a3a, { roughness: 1 }), 0.4, 0.004, 0.2, g); tapete.rotation.x = -Math.PI / 2; tapete.scale.set(1, 0.75, 1);
  [-0.12, 0.12].forEach((dz, i) => { const sl = mesh(cap(0.045, 0.16, 4, 8), SM(0x8a8a9a, { roughness: 0.9 }), -0.55, 0.03, -1.02 + dz, g); sl.rotation.set(Math.PI / 2, 0, Math.PI / 2 + i * 0.2); sl.scale.set(1, 1, 0.4); });
  const wardrobe = mesh(box(0.62, 2.1, 1.3), SM(0x6a4a30, { roughness: 0.6 }), RX - 0.31, 1.05, 1.5, g);
  mesh(box(0.02, 1.9, 0.02), SM(0xb8a070, { metalness: 0.7 }), RX - 0.63, 1.05, 1.5, g);
  const cab = grp(g, 1.75, 0, -1.55); mesh(cyl(0.02, 0.025, 1.75, 8), SM(0x4a2e1e), 0, 0.875, 0, cab); mesh(cyl(0.18, 0.2, 0.03, 16), SM(0x4a2e1e), 0, 0.015, 0, cab);
  const quadro = grp(g, -RX + 0.005, 1.55, -0.6); quadro.rotation.y = Math.PI / 2; mesh(box(0.9, 0.62, 0.04), SM(0x2a2018, { roughness: 0.5 }), 0, 0, 0, quadro);
  const qTex = canvasTex(256, 176, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#9ab8d0"); gr.addColorStop(0.55, "#e8d8b8"); gr.addColorStop(0.56, "#4a6a5a"); gr.addColorStop(1, "#2a4a3a"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#f4f4f4"; c.beginPath(); c.moveTo(60, 98); c.lineTo(128, 30); c.lineTo(196, 98); c.fill(); c.fillStyle = "#6a7a8a"; c.beginPath(); c.moveTo(100, 98); c.lineTo(128, 58); c.lineTo(156, 98); c.fill(); });
  mesh(new THREE.PlaneGeometry(0.8, 0.52), SM(0xffffff, { map: qTex, roughness: 0.7 }), 0, 0, 0.022, quadro);
  const clock = relogioParede(g, 1.65, 1.85, RZ0 + 0.005);
  // luz do teto e a porta (abre para dentro, com antecipação)
  const tetoM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f6ff, emissiveIntensity: 1.2 });
  mesh(cyl(0.3, 0.3, 0.05, 32), tetoM, 0, RH - 0.03, 0.2, g);
  const tetoL = new THREE.PointLight(0xf2f2ff, 4.5, 9, 1.4); tetoL.position.set(0, RH - 0.25, 0.2); g.add(tetoL);
  const door = grp(g, RX + 0.02, 0, 0.3); mesh(box(0.05, 2.02, 0.9), SM(0x7a5a3c, { roughness: 0.6 }), 0, 1.01, -0.45, door); mesh(sph(0.03, 8, 6), SM(0xb8a070, { metalness: 0.8 }), -0.05, 1.0, -0.82, door);
  const hall = new THREE.PointLight(0xffe0b0, 1.6, 4, 1.5); hall.position.set(RX + 1.2, 1.9, -0.15); g.add(hall);
  mesh(box(0.1, 2.6, 3), SM(0x8a7a64), RX + 2.3, 1.3, -0.15, g); mesh(box(2.3, 0.1, 3), floorM, RX + 1.15, -0.05, -0.15, g);
  // o homem (paletó com cor própria nesta cena: dá para "tirar" o paletó trocando a cor por branco)
  const JK = 0x2c3243, p = semRosto({ jacket: JK }); g.add(p); const u = p.userData, jackM = TM(JK, { side: THREE.DoubleSide });
  const caseH = pasta(u.wr[0]); caseH.position.set(0, -0.11, 0.02);
  const caseF = grp(g, 1.3, 0, -0.5); const cf = pasta(caseF); cf.position.set(0, 0.43, 0); caseF.rotation.y = -Math.PI / 2; caseF.visible = false;
  const X0 = 2.9, Z0 = -0.15, D = 1.5, L = gaitFit(D, 0.6), tIn = a + 0.02, tStop = tIn + 1.9;
  const distF = (t) => andarAte(t, tIn, tStop, D, 1.0);
  const tBend = tStop + 0.05, tRel = tBend + 0.75, tUp = tRel + 0.55, tTie = tUp + 0.1;
  const chestPos = (tt) => { const d = distF(tt), ph = (d / (2 * L)) * Math.PI * 2, bend = Math.sin(Math.PI * smr(tt, tBend, tUp)); return [X0 - d - bend * 0.12, 1.32 + Math.cos(2 * ph) * 0.016 - bend * 0.35, Z0 + Math.sin(ph) * 0.02]; };
  const tSit = K.cama, tDark = K.oito1 - 0.12;
  const SEAT = [-0.8, -1.22];
  const mouth = (t) => { u.head.updateMatrixWorld(true); return u.head.localToWorld(V3(0, 0.05, 0.13)); };
  let dark = 0;
  return {
    bg: 0x0a0a10, fog: [10, 40], fogCol: 0x0a0a10,
    look: { exposure: 1.1, bloom: 0.5, bloomT: 0.9, vig: 0.42, sat: 1.04, con: 1.05, lift: [0.006, 0.006, 0.012] },
    sun: { dir: [0.3, 0.62, -0.72], col: 0x9ab4ff, I: 0.3, c: [-0.8, 0.6, -0.9], r: 4 }, hemi: { sky: 0xd8d4e0, ground: 0x4a3a2a, I: 0.45 }, fill: { col: 0xffe0c0, I: 0.0 }, rim: { col: 0xfff0e0, str: 0.45 }, hand: 0.006,
    update(t) {
      const night = smr(t, tSit - 0.05, tSit + 0.5), off = smr(t, tDark, tDark + 0.12);
      dark = off * (1 - smr(t, tDark + 0.18, tDark + 0.6));
      // luzes: teto (até as 23h) → abajur (até apagar) → só a lua
      tetoL.intensity = 4.5 * (1 - night); tetoM.emissiveIntensity = 1.2 * (1 - night);
      lampL.intensity = 0.32 * night * (1 - off); shadeM.emissiveIntensity = 0.9 * night * (1 - off); lampGl.material.opacity = 0.5 * night * (1 - off);
      hemi.intensity = lerp(0.45, 0.12, night) * (1 - off * 0.55); sun.intensity = lerp(0.3, 0.45, night) + off * 0.75;
      clock.set(20 + (t - a) / 60 + 3 * smr(t, tSit - 0.05, tSit + 0.55));
      curtains.forEach((m, i) => { const P_ = m.geometry.attributes.position, B_ = m.geometry.userData.base; for (let k = 0; k < P_.count; k++) { const x = B_[k * 3], y = B_[k * 3 + 1]; P_.setZ(k, Math.sin(x * 26 + i) * 0.03 + Math.sin(t * 0.8 + x * 4 + i) * 0.015 * (0.75 - y / 1.5)); } P_.needsUpdate = true; m.geometry.computeVertexNormals(); });
      door.rotation.y = 1.45 * act(t, a - 0.45, a + 0.35, 0.06, 0.05);
      vap.upd(t, 0.9);
      restPose(p);
      caseH.visible = t < tRel; caseF.visible = t >= tRel;
      if (t < tSit) {
        // 1) entra, para com os dois pés no chão, põe a pasta no chão e afrouxa a gravata
        jackM.color.set(JK);
        const d = distF(t);
        gait(p, d, { from: [X0, 0, Z0], ang: -Math.PI / 2, step: L, amt: 0.95 });
        const walking = clamp((tStop - t) / 0.5);
        u.sh[0].rotation.x *= 0.3; u.el[0].rotation.x = -0.1;
        idle(p, t, 3, 0.3 + 0.7 * (1 - walking));
        const bend = Math.sin(Math.PI * smr(t, tBend, tUp));
        if (bend > 0.001) {
          pose(p, { hipsPos: [0, -0.34 * bend, -0.1 * bend], spine: [0.55 * bend, 0, 0], neck: [0.25 * bend, 0, 0] }, 1);
          standFeet(p);
          armIK(p, 0, V3(1.27, 0.43 + (1 - bend) * 0.5, -0.47), V3(2.2, 1.0, -0.6), clamp(bend * 1.6));
        }
        // gravata: a mão direita vai ao nó, puxa pra baixo e solta; a cabeça inclina
        const tk = act(t, tTie, tTie + 0.55, 0.1, 0.06) * (1 - smr(t, tTie + 0.75, tTie + 1.15));
        if (tk > 0.001) {
          u.tie.updateMatrixWorld(true); const knot = u.tie.localToWorld(V3(0, -0.01 - 0.05 * clamp(tk), 0.05));
          armIK(p, 0, knot, wpos(u.chest).add(V3(0.2, -0.5, -0.6)), clamp(tk * 1.4)); curlHand(u.hands[0], 0.7 * clamp(tk));
          u.neck.rotation.z += 0.18 * tk; u.head.rotation.z += 0.1 * tk; u.tie.position.y = 0.285 - 0.03 * clamp(tk);
        }
        const Lg = molaHomem(p, t, chestPos);
        pastaPendura(caseH, p, Lg);
      } else if (t < tDark + 0.15) {
        // 2) às 23h: sem paletó, sentado na beira da cama; pega o leite com a mão esquerda, bebe e devolve
        jackM.color.set(0xeeebe4);
        p.position.set(SEAT[0], 0, SEAT[1]); p.rotation.set(0, Math.PI / 2, 0);
        idle(p, t, 5, 0.6);
        sitPose(p, 1, { seatY: 0.56, lean: -0.05 });
        plantFeet(p, [[SEAT[0] + 0.5, 0, SEAT[1] + 0.12], [SEAT[0] + 0.48, 0, SEAT[1] - 0.12]], Math.PI / 2);
        const t0 = K.leite - 0.25, grab = act(t, t0, t0 + 0.45, 0.08, 0.05), lift = act(t, t0 + 0.5, t0 + 1.0, 0.06, 0.06), back = smr(t, K.oito1 - 0.75, K.oito1 - 0.35);
        const up = clamp(lift) * (1 - back);
        const mp = mouth(t), gp = G0.clone().lerp(mp.clone().add(V3(0.0, -0.1, 0)), up);
        if (t > t0 + 0.42 && t < K.oito1 - 0.3) { copo.position.copy(gp); copo.rotation.set(0, 0, -0.9 * Math.sin(Math.PI * smr(t, t0 + 0.75, t0 + 1.35))); } else { copo.position.copy(G0); copo.rotation.set(0, 0, 0); }
        const reach = clamp(grab) * (1 - smr(t, K.oito1 - 0.33, K.oito1 - 0.1));
        if (reach > 0.001) { armIK(p, 1, copo.position.clone().add(V3(-0.05, 0.06, 0.02)), wpos(u.chest).add(V3(0.3, -0.4, -1)), reach); curlHand(u.hands[1], 0.65 * reach, 0.5 * reach); }
        u.spine.rotation.x += 0.08 * clamp(grab) * (1 - up); u.neck.rotation.x -= 0.25 * Math.sin(Math.PI * smr(t, t0 + 0.75, t0 + 1.35));
        vap.upd(t, 0.9, copo.position.clone().add(V3(0, 0.14, 0)));
        molaHomem(p, t, () => [SEAT[0], 1.2, SEAT[1]]);
      } else {
        // 3) luz apagada: deitado de barriga pra cima, coberto, respirando devagar sob a luz da lua
        jackM.color.set(0xeeebe4);
        p.position.set(-1.55, 0.67, 0.12); p.rotation.set(-Math.PI / 2, 0, 0);
        idle(p, t, 9, 0.25); u.head.rotation.y = 0.15;
        u.chest.scale.multiplyScalar(1 + Math.sin(t * 1.1) * 0.012);
        setDuvet(true);
        copo.position.copy(G0); copo.rotation.set(0, 0, 0);
        molaHomem(p, t, () => [-1.55, 0.8, -0.8]);
      }
      if (t < tDark + 0.15) setDuvet(false);
    },
    after(t) { if (dark > 0) { GU.uFade.value = Math.max(GU.uFade.value, dark * 0.96); GU.uFadeCol.value.set(0, 0, 0); } },
    cam(t) {
      return path2(t, [
        [a, [-1.1, 1.55, 2.4], [1.7, 1.15, -0.25], 40],
        [tStop - 0.3, [-0.95, 1.5, 2.55], [1.4, 1.0, -0.25], 40],
        [tTie + 0.4, [-0.2, 1.5, 1.7], [1.3, 1.3, -0.3], 37],
        [K.casa1 + 0.35, [0.85, 1.62, -0.15], [1.65, 1.85, -1.95], 34],
        [tSit + 0.6, [1.05, 1.72, -0.75], [1.65, 1.85, -1.95], 30],
        [K.leite - 0.15, [1.35, 1.32, -0.55], [-0.62, 0.98, -1.42], 40],
        [tDark, [1.15, 1.3, -0.7], [-0.68, 1.05, -1.4], 37],
        [tDark + 0.3, [-0.95, 2.3, 0.55], [-1.5, 0.62, -1.0], 40],
        [b, [-1.1, 2.6, 0.95], [-1.52, 0.56, -0.9], 38],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 3 · os potes: escrivaninha com cristaleira, potes de vidro com o ano (1983 → 1999) e o caderno com o gráfico
addSet("s3-potes", (g) => {
  const [a, b] = T.sc["s3-potes"];
  const RX = 1.6, BZ = -1.2, FZ = 2.6, RH = 2.6;
  const pp = texPapelParede("#3a3446", "#332e3e"), wallM = SM(0xffffff, { map: rep(pp.clone(), 3, 2), roughness: 0.9 }); wallM.map.needsUpdate = true;
  const pk = texPlanks([96, 66, 44], [78, 52, 34]), floorM = SM(0xffffff, { map: rep(pk.map.clone(), 2, 2), normalMap: rep(pk.normalMap.clone(), 2, 2), roughness: 0.6 }); floorM.map.needsUpdate = floorM.normalMap.needsUpdate = true;
  mesh(box(RX * 2, 0.1, FZ - BZ), floorM, 0, -0.05, (BZ + FZ) / 2, g); mesh(box(RX * 2, 0.1, FZ - BZ), SM(0x2a2630), 0, RH + 0.05, (BZ + FZ) / 2, g);
  mesh(box(RX * 2, RH, 0.1), wallM, 0, RH / 2, BZ - 0.05, g); mesh(box(0.1, RH, FZ - BZ), wallM, RX + 0.05, RH / 2, (BZ + FZ) / 2, g);
  // parede esquerda com janela de persiana (a luz fria da rua entra em listras)
  const WZ0 = -0.55, WZ1 = 0.75, WY0 = 0.9, WY1 = 2.1;
  mesh(box(0.1, RH, WZ0 - BZ), wallM, -RX - 0.05, RH / 2, (BZ + WZ0) / 2, g); mesh(box(0.1, RH, FZ - WZ1), wallM, -RX - 0.05, RH / 2, (WZ1 + FZ) / 2, g);
  mesh(box(0.1, WY0, WZ1 - WZ0), wallM, -RX - 0.05, WY0 / 2, (WZ0 + WZ1) / 2, g); mesh(box(0.1, RH - WY1, WZ1 - WZ0), wallM, -RX - 0.05, (RH + WY1) / 2, (WZ0 + WZ1) / 2, g);
  for (let i = 0; i < 16; i++) { const sl = mesh(box(0.06, 0.035, WZ1 - WZ0), SM(0xc8c4bc, { roughness: 0.6 }), -RX + 0.04, WY0 + 0.04 + i * 0.075, (WZ0 + WZ1) / 2, g); sl.rotation.z = 0.45; }
  const rua = mesh(new THREE.PlaneGeometry(3, 2.4), new THREE.MeshBasicMaterial({ color: 0x5a6a90, fog: false }), -RX - 1.4, 1.5, 0.1, g); rua.rotation.y = Math.PI / 2;
  // escrivaninha com cristaleira (madeira escura): tampo, gavetas, prateleiras, portas de vidro (a esquerda aberta)
  const wood = SM(0x3a2416, { roughness: 0.5 }), wood2 = SM(0x2c1a10, { roughness: 0.55 });
  const desk = grp(g, 0, 0, BZ);
  mesh(box(1.7, 0.76, 0.6), wood, 0, 0.38, 0.3, desk); mesh(box(1.76, 0.04, 0.64), wood2, 0, 0.78, 0.32, desk);
  [-0.55, 0, 0.55].forEach((x) => { mesh(box(0.5, 0.2, 0.02), wood2, x, 0.6, 0.61, desk); mesh(sph(0.015, 8, 6), SM(0xb8a070, { metalness: 0.8, roughness: 0.3 }), x, 0.6, 0.625, desk); });
  mesh(box(1.7, 1.32, 0.04), wood, 0, 1.6, 0.02, desk); mesh(box(0.05, 1.32, 0.36), wood, -0.83, 1.6, 0.18, desk); mesh(box(0.05, 1.32, 0.36), wood, 0.83, 1.6, 0.18, desk);
  mesh(box(1.76, 0.06, 0.4), wood2, 0, 2.29, 0.2, desk);
  const SH = [0.98, 1.28, 1.58, 1.88];
  SH.forEach((y) => mesh(box(1.62, 0.025, 0.34), wood2, 0, y - 0.0125, 0.18, desk));
  const glassM = new THREE.MeshStandardMaterial({ color: 0xc8d8e0, transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.1, envMap: envGold(), envMapIntensity: 0.5, depthWrite: false, side: THREE.DoubleSide });
  const doorL = grp(desk, -0.82, 0, 0.37); mesh(box(0.8, 1.25, 0.012), glassM, 0.4, 1.6, 0, doorL); [[0.02, 0.025, 1.25], [0.79, 0.025, 1.25]].forEach(([x, w, h]) => mesh(box(w, h, 0.02), wood2, x, 1.6, 0, doorL)); [0.98, 2.22].forEach((y) => mesh(box(0.8, 0.025, 0.02), wood2, 0.4, y, 0, doorL));
  const doorR = grp(desk, 0.82, 0, 0.37); mesh(box(0.8, 1.25, 0.012), glassM, -0.4, 1.6, 0, doorR); [[-0.02, 0.025, 1.25], [-0.79, 0.025, 1.25]].forEach(([x, w, h]) => mesh(box(w, h, 0.02), wood2, x, 1.6, 0, doorR)); [0.98, 2.22].forEach((y) => mesh(box(0.8, 0.025, 0.02), wood2, -0.4, y, 0, doorR));
  doorL.rotation.y = -1.9; doorR.rotation.y = 0.12;
  // potes de vidro com tampa e etiqueta do ano (dentro, lascas claras de unha)
  const jarGlass = new THREE.MeshStandardMaterial({ color: 0xe0eef0, transparent: true, opacity: 0.15, roughness: 0.06, metalness: 0.05, envMap: envGold(), envMapIntensity: 0.35, side: THREE.DoubleSide, depthWrite: false });
  const lidM = SM(0x8a8070, { metalness: 0.75, roughness: 0.35 }), chipG = new THREE.TorusGeometry(0.009, 0.0022, 4, 8, Math.PI), chipM = SM(0xf0e6d8, { roughness: 0.6 });
  const slots = []; SH.slice().reverse().forEach((y, si) => [-0.6, -0.3, 0, 0.3, 0.6].forEach((x, ci) => slots.push([x, y, si, ci])));
  const RES = slots.findIndex(([x, y]) => x === 0 && y === SH[1]);
  const jars = {};
  const mkJar = (year, parent) => {
    const j = grp(parent);
    mesh(cyl(0.062, 0.058, 0.17, 22, 1, true), jarGlass, 0, 0.085, 0, j); mesh(cyl(0.058, 0.058, 0.006, 22), jarGlass, 0, 0.003, 0, j);
    mesh(cyl(0.066, 0.066, 0.03, 22), lidM, 0, 0.185, 0, j);
    const lt = canvasTex(128, 64, (c, w, h) => { c.fillStyle = "#efe4c8"; c.fillRect(0, 0, w, h); c.strokeStyle = "#8a6a3a"; c.lineWidth = 3; c.strokeRect(3, 3, w - 6, h - 6); c.fillStyle = "#2a1a10"; c.font = "700 34px 'Space Mono', monospace"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(year), w / 2, h / 2 + 2); }, { redraw: true });
    const lab = mesh(new THREE.CylinderGeometry(0.0635, 0.0635, 0.06, 22, 1, true, -0.9, 1.8), SM(0xffffff, { map: lt, roughness: 0.8 }), 0, 0.09, 0, j); lab.castShadow = false;
    const n = 6 + Math.floor(hash(year) * 14) + ([1986, 1988, 1991, 1994, 1997].includes(year) ? 26 : 0);
    const chips = new THREE.InstancedMesh(chipG, chipM, n); const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) { const r = Math.sqrt(hash(i + year)) * 0.045, an = hash(i * 3 + year) * 6.28; M4.compose(V3(Math.cos(an) * r, 0.01 + hash(i * 7 + year) * 0.02 * (1 + n / 20), Math.sin(an) * r), Q.setFromEuler(new THREE.Euler(hash(i) * 3, hash(i * 2) * 6, hash(i * 5) * 3)), V3(1, 1, 1)); chips.setMatrixAt(i, M4); }
    j.add(chips);
    return j;
  };
  let k = 0;
  for (let year = 1983; year <= 1998; year++) { if (k === RES) k++; const [x, y] = slots[k++]; const j = mkJar(year, desk); j.position.set(x, y, 0.2); j.rotation.y = (hash(year) - 0.5) * 0.3; jars[year] = j; }
  const novo = mkJar(1999, g), SLOT = V3(0, SH[1], BZ + 0.2);
  // caderno aberto com o gráfico do crescimento das unhas (a linha é desenhada pela caneta)
  const nbC = document.createElement("canvas"); nbC.width = 768; nbC.height = 512; const nbG = nbC.getContext("2d"); const nbT = new THREE.CanvasTexture(nbC); nbT.colorSpace = THREE.SRGBColorSpace; nbT.anisotropy = 8;
  const DATA = [8, 7.5, 9, 31, 8, 30.5, 7, 9, 33, 8.5, 7.5, 32, 9, 8, 34, 8.2, 8.8];
  const gx = (i) => 150 + i * 34, gy = (v) => 440 - v * 10.5;
  let nbP = -1;
  const drawNB = (p) => {
    const c = nbG, w = 768, h = 512; c.fillStyle = "#f2ead8"; c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(90,140,200,.35)"; c.lineWidth = 1; for (let y = 20; y < h; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.fillStyle = "rgba(0,0,0,.12)"; c.fillRect(w / 2 - 4, 0, 8, h);
    c.strokeStyle = "#2a2a3a"; c.lineWidth = 3; c.beginPath(); c.moveTo(gx(0) - 20, 60); c.lineTo(gx(0) - 20, 445); c.lineTo(gx(16) + 20, 445); c.stroke();
    c.fillStyle = "#2a2a3a"; c.font = "700 16px 'Space Mono', monospace"; c.textAlign = "center"; for (let i = 0; i < 17; i += 2) c.fillText("'" + String(83 + i).slice(-2), gx(i), 470);
    c.textAlign = "right"; [10, 20, 30].forEach((v) => { c.fillText(v + " cm", gx(0) - 26, gy(v) + 5); });
    c.setLineDash([8, 6]); c.strokeStyle = "rgba(200,30,40,.7)"; c.lineWidth = 2; c.beginPath(); c.moveTo(gx(0) - 20, gy(30)); c.lineTo(gx(16) + 10, gy(30)); c.stroke(); c.setLineDash([]);
    const n = p * 16, full = Math.floor(n);
    c.lineWidth = 4; c.lineJoin = "round"; c.lineCap = "round";
    for (let i = 0; i < Math.min(16, Math.ceil(n)); i++) { const f = i < full ? 1 : n - full, x0 = gx(i), y0 = gy(DATA[i]), x1 = lerp(x0, gx(i + 1), f), y1 = lerp(y0, gy(DATA[i + 1]), f); c.strokeStyle = DATA[i + 1] > 25 || DATA[i] > 25 ? "#c81e2a" : "#1a2a5a"; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
    for (let i = 0; i <= Math.min(16, full); i++) { c.fillStyle = DATA[i] > 25 ? "#c81e2a" : "#1a2a5a"; c.beginPath(); c.arc(gx(i), gy(DATA[i]), 6, 0, 7); c.fill(); }
    if (p > 0.93) { c.fillStyle = "#c81e2a"; c.font = "700 30px 'Archivo Black', sans-serif"; c.textAlign = "left"; c.save(); c.translate(gx(11) - 40, gy(36)); c.rotate(-0.08); c.fillText("+30 cm!! PERFEITO", 0, 0); c.restore(); }
    nbT.needsUpdate = true;
  };
  const NB = V3(0.3, 0.802, BZ + 0.42);
  const nb = grp(g, NB.x, NB.y, NB.z); nb.rotation.y = -0.12;
  const page = mesh(new THREE.PlaneGeometry(0.48, 0.32), SM(0xffffff, { map: nbT, roughness: 0.85 }), 0, 0.004, 0, nb); page.rotation.x = -Math.PI / 2; page.castShadow = false;
  mesh(box(0.5, 0.012, 0.34), SM(0x5a2a2a, { roughness: 0.7 }), 0, -0.004, 0, nb);
  const toW = (px, py) => nb.localToWorld(V3((px / 768 - 0.5) * 0.48, 0.006, (py / 512 - 0.5) * 0.32));
  // abajur de mesa (luz quente que fica vermelha no fim), livros, calendário, cadeira
  const lamp = grp(g, -0.58, 0.8, BZ + 0.42); mesh(cyl(0.07, 0.08, 0.03, 16), SM(0xb8a070, { metalness: 0.8, roughness: 0.3 }), 0, 0.015, 0, lamp); mesh(cyl(0.01, 0.01, 0.32, 8), SM(0xb8a070, { metalness: 0.8 }), 0, 0.17, 0, lamp);
  const shade = mesh(new THREE.CylinderGeometry(0.06, 0.14, 0.1, 18, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a4a2a, emissive: 0xffb050, emissiveIntensity: 0.1, roughness: 0.4, side: THREE.DoubleSide }), 0.06, 0.35, 0.04, lamp); shade.rotation.z = -0.5;
  const lampL = new THREE.PointLight(0xffb060, 1.2, 4.5, 1.6); lampL.position.set(0.1, 0.28, 0.06); lamp.add(lampL);
  const lampGl = glowSprite(0xffc070, 0.5, 0.45); lampGl.position.set(0.1, 0.3, 0.06); lamp.add(lampGl);
  [[-0.3, 0.07, 0x6a2a2a], [-0.24, 0.06, 0x2a3a5a], [-0.19, 0.05, 0x3a4a2a]].forEach(([x, w, c]) => { const bk = mesh(box(w, 0.28, 0.2), SM(c, { roughness: 0.7 }), x, 0.94, BZ + 0.15, g); bk.rotation.z = 0.04; });
  const cal = canvasTex(256, 320, (c, w, h) => { c.fillStyle = "#f4f0e6"; c.fillRect(0, 0, w, h); c.fillStyle = "#c81e2a"; c.fillRect(0, 0, w, 70); c.fillStyle = "#fff"; c.font = "700 44px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.fillText("1999", w / 2, 52); c.fillStyle = "#2a2a3a"; c.font = "700 20px 'Space Mono', monospace"; for (let i = 0; i < 30; i++) c.fillText(String(i + 1), 26 + (i % 7) * 34, 110 + Math.floor(i / 7) * 42); }, { redraw: true });
  mesh(new THREE.PlaneGeometry(0.34, 0.42), SM(0xffffff, { map: cal, roughness: 0.8 }), 1.15, 1.6, BZ + 0.006, g);
  const chair = grp(g, 0.95, 0, -0.1); chair.rotation.y = -0.6; mesh(box(0.46, 0.05, 0.44), wood, 0, 0.46, 0, chair); mesh(box(0.46, 0.5, 0.04), wood, 0, 0.72, -0.2, chair); [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].forEach(([x, z]) => mesh(box(0.04, 0.46, 0.04), wood2, x, 0.23, z, chair));
  const motes = dustPts(160, [-1.4, 0.4, 0.8, 2.2, -0.6, 0.8], 0xcfe0ff, 0.012, 0.7); g.add(motes);
  const redL = new THREE.PointLight(0xff1a1a, 0, 6, 1.4); redL.position.set(0.9, 1.9, 0.9); g.add(redL);
  // luz de vitrine dentro da cristaleira (os potes brilham como peças de museu)
  const vit = [[2.1, 0.9], [1.45, 0.5]].map(([y, I]) => { const L_ = new THREE.PointLight(0xffd8a0, I, 1.8, 1.6); L_.position.set(0, y, BZ + 0.3); g.add(L_); return L_; });
  // o homem: em pé diante da cristaleira, com o pote de 1999 na mão; guarda o pote e depois escreve no caderno
  const p = semRosto(); g.add(p); const u = p.userData; p.position.set(-0.04, 0, -0.32); p.rotation.y = Math.PI;
  const pen = mesh(cyl(0.004, 0.003, 0.14, 8), SM(0x1a1a22, { metalness: 0.4, roughness: 0.3 }), 0, -0.075, 0.02, u.hands[0].h); pen.rotation.x = 0.35; pen.visible = false;
  const tA = K.guardava - 0.05, tW0 = K.quando2 - 0.45, tW1 = K.bom + 0.1;
  const S0 = V3(0.19, 0.86, -0.36);
  const jarAt = (t) => { const kk = clamp(act(t, tA, tA + 0.95, 0.08, 0.04)); return S0.clone().lerp(SLOT, kk).add(V3(0, 0.16 * Math.sin(Math.PI * clamp(kk)), 0)); };
  return {
    bg: 0x0c0a12, fog: [8, 30], fogCol: 0x0c0a12,
    look: { exposure: 1.2, bloom: 0.6, bloomT: 0.8, vig: 0.52, sat: 1.02, con: 1.08, lift: [0.01, 0.008, 0.02] },
    sun: { dir: [-1, 0.42, 0.18], col: 0x8aaaf0, I: 1.5, c: [-0.2, 1.1, -0.7], r: 2.6 }, hemi: { sky: 0x4a4466, ground: 0x1a1410, I: 0.32 }, fill: { col: 0xffd0a0, I: 0.0 }, rim: { col: 0xffe0c0, str: 0.4 }, hand: 0.005,
    update(t) {
      const red = smr(t, K.bom - 0.35, K.bom + 0.25);
      lampL.color.setHex(0xffb060).lerp(_col.setHex(0xff2020), red); lampL.intensity = 1.2 + red * 0.8 + noise1(t * 5) * 0.04; lampGl.material.color.setHex(0xffc070).lerp(_col.setHex(0xff3030), red);
      redL.intensity = 1.4 * red; vit.forEach((L_, i) => (L_.intensity = (i ? 0.5 : 0.9) * (1 - red * 0.6))); sun.color.setHex(0x8aaaf0).lerp(_col.setHex(0xff5060), red * 0.7);
      floatDust(motes, t, 0.15, 0.2);
      const pr = Math.round(smr(t, tW0 + 0.35, tW1 - 0.15) * 160) / 160; if (pr !== nbP) { nbP = pr; drawNB(pr); }
      restPose(p); idle(p, t, 4, 0.7);
      p.position.set(-0.04, 0, -0.32); p.rotation.set(0, Math.PI, 0);
      const writeK = smr(t, tW0, tW0 + 0.6);
      const lean = 0.18 * Math.sin(Math.PI * clamp(act(t, tA, tA + 1.0, 0.1, 0.05))) + 0.42 * writeK;
      pose(p, { spine: [lean * 0.7, -0.12 * writeK, 0], chest: [lean * 0.3, -0.1 * writeK, 0], neck: [0.2 * writeK, 0, 0] }, 1);
      standFeet(p);
      // pote: na mão até guardar; depois fica na prateleira
      const placed = t > tA + 0.95;
      novo.position.copy(placed ? SLOT : jarAt(t)); novo.rotation.set(0, 0.2, 0);
      const holdK = 1 - smr(t, tA + 0.95, tA + 1.45);
      if (holdK > 0.001) { armIK(p, 0, novo.position.clone().add(V3(0.05, 0.12, 0.06)), wpos(u.chest).add(V3(1, -0.6, 0.6)), holdK); curlHand(u.hands[0], 0.8 * holdK); }
      // escreve: a ponta da caneta segue a ponta da linha do gráfico
      pen.visible = t > tW0 - 0.2;
      if (writeK > 0.001) {
        const n = nbP * 16, i0 = Math.min(15, Math.floor(n)), f = n - i0, px = lerp(gx(i0), gx(i0 + 1), f), py = lerp(gy(DATA[i0]), gy(DATA[i0 + 1]), f);
        const tip = toW(px, py), wob = Math.sin(t * 24) * 0.003;
        armIK(p, 0, tip.add(V3(0.03 + wob, 0.11, 0.05)), wpos(u.chest).add(V3(1.2, 0.2, 0.4)), writeK); curlHand(u.hands[0], 0.75 * writeK, 0.6);
        armIK(p, 1, NB.clone().add(V3(-0.28, 0.06, 0.05)), wpos(u.chest).add(V3(-1, 0, 0.6)), writeK * 0.9);
      }
      molaHomem(p, t, () => [-0.04, 1.3, -0.32]);
    },
    cam(t) {
      return path2(t, [
        [a, [-0.44, 1.96, -0.26], [-0.6, 1.92, -1.0], 34],
        [K.ano83 + 0.9, [-0.05, 1.86, -0.22], [-0.32, 1.72, -1.0], 33],
        [K.assassino2 + 0.25, [0.95, 1.62, 1.45], [0.0, 1.42, -0.9], 38],
        [K.potes, [0.78, 1.52, 0.6], [-0.05, 1.32, -0.95], 36],
        [K.cresciam, [0.98, 1.42, -0.42], [0.3, 0.82, -0.8], 36],
        [K.bom, [0.82, 1.33, -0.55], [0.32, 0.8, -0.82], 34],
        [b, [0.77, 1.28, -0.6], [0.33, 0.8, -0.82], 32],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 4 · culpa? Banheiro: no espelho embaçado aparece "CULPA?"; no "não" o vapor some e o reflexo mostra o rosto liso; ele lava as mãos, calmo
// copia a pose (posições/rotações locais de todos os nós) de um personagem para outro idêntico (o reflexo)
function copyPose(src, dst) { const A = [], B = []; src.traverse((o) => A.push(o)); dst.traverse((o) => B.push(o)); for (let i = 0; i < Math.min(A.length, B.length); i++) { B[i].position.copy(A[i].position); B[i].quaternion.copy(A[i].quaternion); B[i].scale.copy(A[i].scale); B[i].visible = A[i].visible; } }
addSet("s4-culpa", (g) => {
  const [a, b] = T.sc["s4-culpa"];
  const MZ = -1.0, RX = 1.2, FZ = 2.4, RH = 2.5, MX0 = -0.42, MX1 = 0.42, MY0 = 1.12, MY1 = 2.0;
  const az = texAzulejo("#e6ecea", "#9aa6a2", 10), az2 = texAzulejo("#a8c4b8", "#6a827a", 10);
  const tileM = (s) => { const m = SM(0xffffff, { map: rep(az.map.clone(), s[0], s[1]), normalMap: rep(az.normalMap.clone(), s[0], s[1]), roughness: 0.35 }); m.map.needsUpdate = m.normalMap.needsUpdate = true; return m; };
  const tileG = (s) => { const m = SM(0xffffff, { map: rep(az2.map.clone(), s[0], s[1]), normalMap: rep(az2.normalMap.clone(), s[0], s[1]), roughness: 0.35 }); m.map.needsUpdate = m.normalMap.needsUpdate = true; return m; };
  // o banheiro (montado duas vezes: o real e o refletido atrás do espelho)
  const room = (P, mirror) => {
    mesh(box(RX * 2, 0.1, FZ - MZ), tileG([4, 6]), 0, -0.05, (MZ + FZ) / 2, P); mesh(box(RX * 2, 0.1, FZ - MZ), SM(0xe0e4e0, { roughness: 0.9 }), 0, RH + 0.05, (MZ + FZ) / 2, P);
    [-1, 1].forEach((k) => { mesh(box(0.1, 1.2, FZ - MZ), tileG([6, 2]), k * (RX + 0.05), 0.6, (MZ + FZ) / 2, P); mesh(box(0.1, RH - 1.2, FZ - MZ), tileM([6, 2]), k * (RX + 0.05), 1.2 + (RH - 1.2) / 2, (MZ + FZ) / 2, P); });
    if (!mirror) {
      // parede do espelho com o vão (o "vidro" mostra o banheiro refletido)
      mesh(box(MX0 + RX, RH, 0.1), tileM([2, 4]), (-RX + MX0) / 2, RH / 2, MZ - 0.05, P); mesh(box(RX - MX1, RH, 0.1), tileM([2, 4]), (MX1 + RX) / 2, RH / 2, MZ - 0.05, P);
      mesh(box(MX1 - MX0, MY0, 0.1), tileG([1.4, 1]), 0, MY0 / 2, MZ - 0.05, P); mesh(box(MX1 - MX0, RH - MY1, 0.1), tileM([1.4, 1]), 0, (RH + MY1) / 2, MZ - 0.05, P);
      [[MX0 - 0.02, (MY0 + MY1) / 2, 0.04, MY1 - MY0 + 0.08], [MX1 + 0.02, (MY0 + MY1) / 2, 0.04, MY1 - MY0 + 0.08], [0, MY0 - 0.02, MX1 - MX0 + 0.08, 0.04], [0, MY1 + 0.02, MX1 - MX0 + 0.08, 0.04]].forEach(([x, y, w, h]) => mesh(box(w, h, 0.03), SM(0xb8bcc0, { metalness: 0.8, roughness: 0.25 }), x, y, MZ + 0.01, P));
    } else {
      mesh(box(RX * 2, RH, 0.1), tileM([3, 4]), 0, RH / 2, FZ + 0.05, P); // a parede de trás (só aparece no reflexo)
      mesh(box(0.8, 2.05, 0.06), SM(0x6a7a7a, { roughness: 0.6 }), -0.6, 1.02, FZ - 0.02, P);
    }
    // pia, torneira, prateleira com copo e escovas, toalha, luminária
    const pia = grp(P, 0, 0, MZ + 0.24);
    mesh(cyl(0.1, 0.14, 0.78, 16), SM(0xf2f2ee, { roughness: 0.25 }), 0, 0.39, -0.02, pia);
    mesh(lathe([[0.02, 0.0], [0.2, 0.04], [0.27, 0.13], [0.28, 0.16], [0.24, 0.16], [0.17, 0.06], [0.02, 0.04]], 28), SM(0xf6f6f2, { roughness: 0.2, side: THREE.DoubleSide }), 0, 0.72, 0, pia);
    const tq = grp(pia, 0, 0.88, -0.2); mesh(cyl(0.018, 0.022, 0.1, 12), SM(0xd0d4d8, { metalness: 0.9, roughness: 0.15 }), 0, 0, 0, tq); const bico = mesh(cyl(0.012, 0.012, 0.14, 10), SM(0xd0d4d8, { metalness: 0.9, roughness: 0.15 }), 0, 0.045, 0.065, tq); bico.rotation.x = Math.PI / 2.3;
    [-1, 1].forEach((k) => mesh(cyl(0.022, 0.022, 0.03, 10), SM(0xd0d4d8, { metalness: 0.9, roughness: 0.15 }), k * 0.09, 0.03, 0, tq));
    mesh(box(0.72, 0.025, 0.12), SM(0xf2f2ee, { roughness: 0.3 }), 0, MY0 - 0.1, MZ + 0.07, P);
    const cup = mesh(cyl(0.03, 0.026, 0.09, 12), SM(0x6aa8c8, { roughness: 0.3 }), 0.24, MY0 - 0.04, MZ + 0.07, P);
    [0, 1].forEach((i) => { const br = mesh(cyl(0.006, 0.006, 0.17, 6), SM(i ? 0xe84a4a : 0x4a8ae8), 0.235 + i * 0.012, MY0 + 0.03, MZ + 0.07, P); br.rotation.z = (i - 0.5) * 0.3; });
    mesh(new THREE.TorusGeometry(0.1, 0.008, 6, 20), SM(0xd0d4d8, { metalness: 0.9, roughness: 0.15 }), 0.85, 1.3, MZ + 0.02, P);
    const toalha = mesh(box(0.24, 0.5, 0.03), SM(0xc84a4a, { roughness: 0.95 }), 0.85, 1.05, MZ + 0.04, P);
    const luz = grp(P, 0, MY1 + 0.17, MZ + 0.08); mesh(box(0.5, 0.05, 0.08), SM(0xb8bcc0, { metalness: 0.7, roughness: 0.3 }), 0, 0, 0, luz);
    const bulbM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd8a0, emissiveIntensity: 2.2 }); mesh(sph(0.045, 12, 10), bulbM, 0, -0.06, 0.03, luz);
    const L_ = new THREE.PointLight(0xffd8a8, 1.0, 5, 1.6); L_.position.set(0, -0.1, 0.12); luz.add(L_); const gl_ = glowSprite(0xffe0b0, 0.5, 0.5); gl_.position.set(0, -0.06, 0.05); luz.add(gl_);
    return { L: L_, bulbM, gl: gl_ };
  };
  const R1 = room(g, false);
  const mir = grp(g, 0, 0, 2 * MZ); mir.scale.z = -1;
  const R2 = room(mir, true);
  // vidro e vapor no espelho: "CULPA?" escrito com o dedo, letra por letra, com gotas escorrendo
  const glassP = mesh(new THREE.PlaneGeometry(MX1 - MX0, MY1 - MY0), new THREE.MeshStandardMaterial({ color: 0xa0b8c0, transparent: true, opacity: 0.08, roughness: 0.02, metalness: 0.4, depthWrite: false }), 0, (MY0 + MY1) / 2, MZ + 0.002, g); glassP.castShadow = false;
  const fC = document.createElement("canvas"); fC.width = 420; fC.height = 440; const fG = fC.getContext("2d"); const fT = new THREE.CanvasTexture(fC); fT.colorSpace = THREE.SRGBColorSpace;
  const fogP = mesh(new THREE.PlaneGeometry(MX1 - MX0, MY1 - MY0), new THREE.MeshBasicMaterial({ map: fT, transparent: true, depthWrite: false, fog: false }), 0, (MY0 + MY1) / 2, MZ + 0.006, g); fogP.castShadow = false; fogP.renderOrder = 4;
  const noiseC = document.createElement("canvas"); noiseC.width = 420; noiseC.height = 440; { const ng = noiseC.getContext("2d"), im = ng.createImageData(420, 440); for (let y = 0; y < 440; y++) for (let x = 0; x < 420; x++) { const i = (y * 420 + x) * 4, v = fbm2(x / 40, y / 40, 4); im.data[i] = 196; im.data[i + 1] = 204; im.data[i + 2] = 208; im.data[i + 3] = (0.42 + v * 0.3 + (hash2(x, y) - 0.5) * 0.08) * 255; } ng.putImageData(im, 0, 0); }
  let fKey = "";
  const drawFog = (wp, dp) => {
    const key = Math.round(wp * 60) + "_" + Math.round(dp * 40); if (key === fKey) return; fKey = key;
    const c = fG; c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, 420, 440); c.drawImage(noiseC, 0, 0);
    c.globalCompositeOperation = "destination-out"; c.font = "900 70px 'Archivo Black', sans-serif"; c.textAlign = "left"; c.textBaseline = "middle";
    const txt = "CULPA?", w = c.measureText(txt).width, x0 = (420 - w) / 2;
    c.save(); c.beginPath(); c.rect(0, 0, x0 + w * wp, 440); c.clip(); c.fillStyle = "rgba(0,0,0,.92)"; c.fillText(txt, x0, 78); c.restore();
    for (let i = 0; i < 9; i++) { const dx = x0 + 18 + i * (w - 30) / 8 + hash(i) * 10, len = dp * (40 + hash(i * 3) * 150) * (dx < x0 + w * wp ? 1 : 0); if (len < 2) continue; c.fillStyle = "rgba(0,0,0,.8)"; c.beginPath(); c.roundRect(dx, 108, 5 + hash(i * 5) * 3, len, 3); c.fill(); c.beginPath(); c.arc(dx + 3.5, 108 + len, 5, 0, 7); c.fill(); }
    fT.needsUpdate = true;
  };
  const agua = mesh(cyl(0.006, 0.009, 0.2, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.55, roughness: 0.05, emissive: 0x405060, emissiveIntensity: 0.3 }), 0, 0.82, MZ + 0.11, g);
  const gota = mesh(sph(0.007, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe0f4ff, transparent: true, opacity: 0.8, roughness: 0.05 }), 0, 0.9, MZ + 0.11, g);
  const vapor = dustPts(90, [-1.0, 1.0, 0.6, 2.3, MZ + 0.1, MZ + 1.8], 0xffffff, 0.08, 0.12, NORM, 4); g.add(vapor);
  // o homem e o reflexo (mesma pose copiada para o boneco espelhado)
  const p = semRosto(), q = semRosto(); g.add(p); mir.add(q); const u = p.userData;
  const PZ = MZ + 0.58, tWash0 = K.kira3 - 0.1, tWash1 = K.culpa3b + 0.35;
  return {
    bg: 0x0a0c0c, fog: [8, 30], fogCol: 0x0a0c0c,
    look: { exposure: 0.98, bloom: 0.45, bloomT: 0.9, vig: 0.52, sat: 0.92, con: 1.08, lift: [0.0, 0.012, 0.01], gain: [0.98, 1.02, 1.0] },
    sun: { dir: [0.2, 1, 0.4], col: 0xc8d8d0, I: 0.2, c: [0, 1, MZ + 0.5], r: 3 }, hemi: { sky: 0xd0dcd8, ground: 0x4a5450, I: 0.28 }, fill: { col: 0xc8e0d8, I: 0.15 }, rim: { col: 0xffe8d0, str: 0.4 }, hand: 0.005,
    update(t) {
      const fl = 1 - 0.08 * Math.max(0, noise1(t * 7)); [R1, R2].forEach((R) => { R.L.intensity = 1.0 * fl; R.bulbM.emissiveIntensity = 1.4 * fl; });
      const wp = smr(t, K.culpa3 - 0.85, K.culpa3 + 0.35), dp = smr(t, K.culpa3 + 0.1, K.nao3 + 0.6);
      drawFog(wp, dp);
      fogP.material.opacity = 1 - 0.88 * smr(t, K.nao3 - 0.05, K.nao3 + 0.75);
      vapor.material.opacity = 0.12 * (1 - 0.6 * smr(t, K.nao3, K.nao3 + 1));
      floatDust(vapor, t, 0.25, 0.15);
      // torneira: gota caindo; depois água correndo enquanto ele lava as mãos
      const run = smr(t, tWash0 - 0.15, tWash0 + 0.1) * (1 - smr(t, tWash1 - 0.2, tWash1));
      agua.visible = run > 0.02; agua.scale.set(1, run, 1); agua.position.y = 0.92 - 0.1 * run;
      const dph = ((t - a) % 1.3) / 1.3; gota.visible = run < 0.02; gota.position.y = 0.92 - dph * dph * 0.2; gota.scale.setScalar(dph < 0.08 ? dph / 0.08 : 1);
      restPose(p); idle(p, t, 2, 0.5);
      p.position.set(-0.1, 0, PZ); p.rotation.set(0, Math.PI, 0);
      // apoiado na pia, cabeça baixa; no "não" ergue a cabeça e encara o espelho; depois lava as mãos devagar
      const upK = act(t, K.nao3 - 0.15, K.nao3 + 0.45, 0.12, 0.06), wash = smr(t, tWash0 - 0.1, tWash0 + 0.35) * (1 - smr(t, tWash1 - 0.3, tWash1 + 0.1));
      pose(p, { spine: [0.32 - 0.12 * clamp(upK), 0, 0], neck: [0.32 - 0.36 * clamp(upK), 0, 0], head: [0.1 - 0.12 * clamp(upK), 0, 0] }, 1);
      standFeet(p);
      const lean = 1 - wash, rub = Math.sin((t - tWash0) * 9) * 0.025 * wash;
      [0, 1].forEach((i) => {
        const s_ = i ? 1 : -1, edge = V3(-0.05 - s_ * 0.24, 0.89, MZ + 0.4), under = V3(-0.02 + s_ * (0.035 + rub), 0.86 + Math.abs(rub), MZ + 0.12 + rub * s_);
        const tgt = edge.clone().lerp(under, wash);
        armIK(p, i, tgt.add(V3(0, 0.07, 0.03)), V3(-0.05 + s_ * 0.9, 0.6, PZ + 0.4), 1); curlHand(u.hands[i], 0.35 + 0.2 * wash);
      });
      // ajeita a gravata olhando o reflexo
      const tie = act(t, tWash1 + 0.05, tWash1 + 0.55, 0.08, 0.05) * (1 - smr(t, b - 0.25, b));
      if (tie > 0.001) { u.tie.updateMatrixWorld(true); armIK(p, 0, u.tie.localToWorld(V3(0, -0.01, 0.06)), wpos(u.chest).add(V3(0.6, -0.5, 0.8)), clamp(tie)); curlHand(u.hands[0], 0.75 * clamp(tie)); }
      molaHomem(p, t, () => [-0.05, 1.3, PZ]);
      p.updateMatrixWorld(true); copyPose(p, q);
    },
    cam(t) {
      return path2(t, [
        [a, [0.72, 1.8, MZ + 2.05], [0.02, 1.52, MZ - 0.1], 40],
        [K.nao3, [0.6, 1.74, MZ + 1.75], [0.0, 1.52, MZ - 0.2], 37],
        [K.nunca3 + 0.3, [0.52, 1.7, MZ + 1.55], [-0.02, 1.5, MZ - 0.25], 35],
        [b, [0.48, 1.68, MZ + 1.45], [-0.02, 1.5, MZ - 0.3], 34],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 5 · sempre em 3º: palco da escola com pódio; o menino sem rosto sobe no 3º lugar; redação, corrida e violino com fita de bronze; o 1º lugar no escuro
function texCortina(c1 = "#7a1018", c2 = "#3a060c") {
  const k = "cort" + c1; if (TX[k]) return TX[k];
  return (TX[k] = canvasTex(512, 256, (c, w, h) => { for (let x = 0; x < w; x++) { const v = 0.5 + 0.5 * Math.sin((x / w) * Math.PI * 2 * 9 + Math.sin(x * 0.05) * 0.6); const gr = c.createLinearGradient(0, 0, 0, h); c.fillStyle = `rgb(${lerp(58, 140, v) | 0},${lerp(6, 22, v) | 0},${lerp(12, 30, v) | 0})`; c.fillRect(x, 0, 1, h); } }));
}
addSet("s5-terceiro", (g) => {
  const [a, b] = T.sc["s5-terceiro"];
  // palco de madeira, cortinas de veludo, faixa, tela com a foto da escola, plateia de cadeiras vazias
  const pk = texPlanks([156, 112, 70], [132, 94, 58]), stM = SM(0xffffff, { map: rep(pk.map.clone(), 4, 3), normalMap: rep(pk.normalMap.clone(), 4, 3), roughness: 0.45 }); stM.map.needsUpdate = stM.normalMap.needsUpdate = true;
  mesh(box(9, 0.8, 5), stM, 0, -0.4, -1.5, g); mesh(box(9, 0.8, 0.06), SM(0x3a2416), 0, -0.4, 1.02, g);
  mesh(box(30, 0.1, 20), SM(0x2a1e18, { roughness: 0.8 }), 0, -0.85, 9, g);
  const ct = texCortina(), curM = SM(0xffffff, { map: rep(ct.clone(), 3, 1), roughness: 0.75 }); curM.map.needsUpdate = true;
  const fundo = new THREE.PlaneGeometry(9.5, 6, 60, 1); deform(fundo, (v) => { v.z = Math.sin(v.x * 7) * 0.08; }); mesh(fundo, curM, 0, 2.6, -3.9, g);
  [-1, 1].forEach((k) => { const sg = new THREE.PlaneGeometry(1.6, 6, 16, 1); deform(sg, (v) => { v.z = Math.sin(v.x * 9) * 0.1; }); const sd = mesh(sg, curM, k * 3.9, 2.6, -1.2, g); sd.rotation.y = -k * 0.5; });
  const topo = new THREE.PlaneGeometry(9.5, 0.9, 40, 1); deform(topo, (v) => { v.y += Math.cos(v.x * 2.2) * 0.12; v.z = Math.sin(v.x * 9) * 0.05; }); mesh(topo, curM, 0, 5.05, -1.0, g);
  const banner = canvasTex(1024, 128, (c, w, h) => { c.fillStyle = "#f4ead0"; c.fillRect(0, 0, w, h); c.strokeStyle = "#c8a040"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#3a1a10"; c.font = "700 60px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PREMIAÇÃO ESCOLAR", w / 2, h / 2 + 3); }, { redraw: true });
  mesh(new THREE.PlaneGeometry(4.2, 0.52), SM(0xffffff, { map: banner, roughness: 0.8 }), 0.4, 4.35, -3.82, g);
  const escolaTex = canvasTex(768, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#f4b878"); gr.addColorStop(0.55, "#f8dcb0"); gr.addColorStop(0.56, "#a8a090"); gr.addColorStop(1, "#8a8070"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = "#e8e4dc"; c.fillRect(120, 150, 540, 140); c.fillStyle = "#d8d2c8"; c.fillRect(120, 150, 540, 18); for (let fl = 0; fl < 3; fl++) for (let i = 0; i < 14; i++) { c.fillStyle = (i + fl) % 5 ? "#5a7088" : "#8aa0b8"; c.fillRect(138 + i * 37, 178 + fl * 36, 26, 22); }
    c.fillStyle = "#e8e4dc"; c.fillRect(350, 100, 80, 60); c.fillStyle = "#fff"; c.beginPath(); c.arc(390, 128, 20, 0, 7); c.fill(); c.strokeStyle = "#222"; c.lineWidth = 3; c.beginPath(); c.moveTo(390, 128); c.lineTo(390, 114); c.moveTo(390, 128); c.lineTo(401, 133); c.stroke();
    for (let i = 0; i < 9; i++) { const x = 40 + i * 88, y = 300; c.fillStyle = "#6a4a3a"; c.fillRect(x - 4, y - 10, 8, 50); c.fillStyle = `rgba(${240 + hash(i) * 15},${170 + hash(i * 3) * 40},${190 + hash(i * 5) * 30},.95)`; c.beginPath(); c.arc(x, y - 22, 34 + hash(i) * 10, 0, 7); c.fill(); }
    c.fillStyle = "#c8c0b0"; c.fillRect(0, 330, w, 182); });
  const tela = grp(g, 0.4, 2.75, -3.75); mesh(box(3.1, 2.1, 0.05), SM(0x1a1a1a), 0, 0, -0.03, tela);
  const telaM = photoMat("escola", { fallback: 0xffffff }); if (!telaM.map) telaM.map = escolaTex;
  const telaP = mesh(new THREE.PlaneGeometry(2.96, 1.97), telaM, 0, 0, 0.0, tela); telaP.castShadow = false;
  const projL = new THREE.PointLight(0xffe8d0, 0.6, 4, 1.6); projL.position.set(0.4, 2.7, -3.0); g.add(projL);
  const chairM = SM(0x4a4e58, { metalness: 0.4, roughness: 0.5 });
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const ch = grp(g, -4 + i * 1.0 + (r % 2) * 0.5, -0.8, 2.6 + r * 1.2); mesh(box(0.45, 0.04, 0.42), chairM, 0, 0.45, 0, ch); mesh(box(0.45, 0.45, 0.04), chairM, 0, 0.7, -0.2, ch); [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].forEach(([x, z]) => mesh(box(0.03, 0.45, 0.03), chairM, x, 0.225, z, ch)); }
  // pódio 1-2-3
  const numTex = (n) => canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#f4f2ec"; c.fillRect(0, 0, w, h); c.fillStyle = n === 1 ? "#c8a040" : n === 2 ? "#9aa0a8" : "#b0683a"; c.font = "700 170px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(n), w / 2, h / 2 + 10); }, { redraw: true });
  const BL = { 2: [0.55, 0.42], 1: [1.2, 0.62], 3: [1.85, 0.3] };
  Object.entries(BL).forEach(([n, [x, h]]) => { const bx = grp(g, x, 0, -1.0); mesh(box(0.62, h, 0.6), SM(0xf4f2ec, { roughness: 0.5 }), 0, h / 2, 0, bx); const f = mesh(new THREE.PlaneGeometry(0.42, Math.min(0.42, h - 0.04)), SM(0xffffff, { map: numTex(+n), roughness: 0.5 }), 0, h / 2, 0.302, bx); f.castShadow = false; });
  const trofeu = grp(g, 1.2, 0.62, -1.0); const gm = GOLDM(); mesh(lathe([[0.0, 0], [0.09, 0], [0.09, 0.03], [0.03, 0.05], [0.025, 0.16], [0.06, 0.2], [0.11, 0.34], [0.12, 0.38], [0.0, 0.38]], 24), gm, 0, 0, 0, trofeu);
  [-1, 1].forEach((k) => { const al = mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 14, Math.PI), gm, k * 0.12, 0.3, 0, trofeu); al.rotation.z = k * Math.PI / 2; });
  // as três provas: redação (folha com carimbo 3º), corrida (barreira com medalha de bronze), violino (no suporte, fita de bronze)
  const bronze = SM(0xb0683a, { metalness: 0.85, roughness: 0.32 });
  const fita = (parent, x, y, z) => { const f = grp(parent, x, y, z); mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 24), bronze, 0, 0, 0, f).rotation.x = Math.PI / 2; [-1, 1].forEach((k) => { const r = mesh(box(0.05, 0.16, 0.004), SM(0x8a2a2a), k * 0.03, -0.11, -0.004, f); r.rotation.z = k * 0.25; }); const lt = canvasTex(64, 64, (c, w) => { c.fillStyle = "#f0d0a0"; c.font = "700 34px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("3º", w / 2, w / 2 + 2); }, { redraw: true }); mesh(new THREE.CircleGeometry(0.06, 20), new THREE.MeshBasicMaterial({ map: lt, transparent: true }), 0, 0, 0.008, f); return f; };
  const papel = canvasTex(384, 512, (c, w, h) => { c.fillStyle = "#f6f2e6"; c.fillRect(0, 0, w, h); c.fillStyle = "#2a2a3a"; c.font = "700 26px 'Archivo Black', sans-serif"; c.fillText("REDAÇÃO", 30, 50); c.strokeStyle = "rgba(60,60,90,.55)"; c.lineWidth = 2; for (let y = 90; y < h - 40; y += 24) { c.beginPath(); c.moveTo(30, y); c.lineTo(30 + 300 * (0.6 + hash(y) * 0.4), y); c.stroke(); }
    c.save(); c.translate(270, 400); c.rotate(-0.25); c.strokeStyle = "#c81e2a"; c.lineWidth = 7; c.beginPath(); c.arc(0, 0, 58, 0, 7); c.stroke(); c.fillStyle = "#c81e2a"; c.font = "700 54px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("3º", 0, 4); c.restore(); }, { redraw: true });
  const cav = grp(g, -2.55, 0, -1.25); [[-0.25, 0.1], [0.25, 0.1], [0, -0.3]].forEach(([x, z]) => { const l = mesh(box(0.03, 1.5, 0.03), SM(0x6a4a2a), x, 0.74, z, cav); l.rotation.x = z < 0 ? -0.2 : 0.08; });
  const folha = mesh(new THREE.PlaneGeometry(0.42, 0.56), SM(0xffffff, { map: papel, roughness: 0.85 }), 0, 1.15, 0.13, cav); folha.rotation.x = -0.08; fita(cav, 0.22, 0.86, 0.15);
  const bar = grp(g, -1.65, 0, -1.25); const bm = SM(0xf2f2ee, { roughness: 0.5 }), bk = SM(0x1a1a1a);
  [-0.42, 0.42].forEach((x) => { mesh(box(0.04, 0.84, 0.04), bm, x, 0.42, 0, bar); mesh(box(0.04, 0.03, 0.5), bk, x, 0.015, 0, bar); });
  for (let i = 0; i < 4; i++) mesh(box(0.21, 0.12, 0.02), i % 2 ? bk : bm, -0.315 + i * 0.21, 0.78, 0, bar);
  const med = fita(bar, 0.0, 0.62, 0.03); med.scale.setScalar(1.2);
  const vio = grp(g, -0.8, 0, -1.3); mesh(box(0.03, 0.8, 0.03), SM(0x2a2a2a, { metalness: 0.5 }), 0, 0.4, 0, vio); mesh(cyl(0.18, 0.2, 0.02, 12), SM(0x2a2a2a, { metalness: 0.5 }), 0, 0.01, 0, vio);
  const vb = grp(vio, 0, 1.02, 0.04); vb.rotation.z = 0.12; const vw = SM(0x8a3a14, { roughness: 0.35 });
  const vShape = new THREE.Shape(); vShape.moveTo(0, -0.18); vShape.bezierCurveTo(0.13, -0.18, 0.13, -0.05, 0.07, -0.02); vShape.bezierCurveTo(0.05, 0.0, 0.05, 0.04, 0.07, 0.06); vShape.bezierCurveTo(0.12, 0.1, 0.1, 0.18, 0, 0.18); vShape.bezierCurveTo(-0.1, 0.18, -0.12, 0.1, -0.07, 0.06); vShape.bezierCurveTo(-0.05, 0.04, -0.05, 0.0, -0.07, -0.02); vShape.bezierCurveTo(-0.13, -0.05, -0.13, -0.18, 0, -0.18);
  const vGeo = new THREE.ExtrudeGeometry(vShape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 3 }); vGeo.translate(0, 0, -0.025); mesh(vGeo, vw, 0, 0, 0, vb);
  mesh(box(0.03, 0.26, 0.02), SM(0x1a1210), 0, 0.29, 0.035, vb); mesh(sph(0.025, 10, 8), vw, 0, 0.43, 0.03, vb);
  for (let i = 0; i < 4; i++) mesh(cyl(0.0012, 0.0012, 0.56, 4), SM(0xe8e0d0, { metalness: 0.8 }), -0.012 + i * 0.008, 0.12, 0.05, vb);
  fita(vio, 0.16, 0.7, 0.08);
  // luzes: canhão quente no 3º lugar; o 1º no escuro até "chama atenção" (aí um canhão branco e flashes)
  const spot = (x, col, I, ang = 0.32) => { const L_ = new THREE.SpotLight(col, I, 14, ang, 0.5, 1.4); L_.position.set(x, 6.5, 2.5); const tg = grp(g, x, 0.3, -1.0); L_.target = tg; g.add(L_); const cone = mesh(new THREE.ConeGeometry(0.9, 6.6, 28, 1, true), new THREE.MeshBasicMaterial({ color: col, map: coneTex, transparent: true, opacity: 0.08, depthWrite: false, blending: ADD, side: THREE.DoubleSide, fog: false }), 0, 0, 0, g); cone.position.set(x, 3.4, 0.75); cone.lookAt(x, 6.5, 2.5); cone.rotateX(Math.PI / 2); return { L: L_, cone, I }; };
  const s3 = spot(1.85, 0xffc890, 18, 0.2), s1_ = spot(1.2, 0xffffff, 0, 0.17), sProv = spot(-1.65, 0xffd8a8, 18, 0.5);
  const flashes = []; for (let i = 0; i < 9; i++) { const f = glowSprite(0xffffff, 1.6, 0); f.position.set(-3 + hash(i * 3) * 6.5, 0.4 + hash(i * 5) * 1.0, 2.8 + hash(i * 7) * 4); g.add(f); flashes.push(f); }
  const poeira = dustPts(200, [-3, 3, 0, 5, -2.5, 2], 0xfff0d8, 0.02, 0.6); g.add(poeira);
  // o menino sem rosto (uniforme escuro), com medalha de bronze, sobe no degrau do 3º lugar vindo de trás do pódio
  const p = meninoSemRosto(); g.add(p); const u = p.userData;
  const medal = grp(u.chest, 0, 0.0, 0.0); const rib = mesh(new THREE.TorusGeometry(0.11, 0.006, 4, 24, Math.PI * 1.1), SM(0x8a2a2a), 0, 0.2, 0.06, medal); rib.rotation.set(0, 0, Math.PI * 1.45); mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 18), bronze, 0, 0.1, 0.135, medal).rotation.x = Math.PI / 2;
  const hf = (x, z) => (z > -1.31 && z < -0.69 && x > 1.53 && x < 2.17 ? 0.3 : 0), hb = (x, z) => 0.3 * smr(z, -1.5, -1.12);
  const Z0 = -2.55, D = 1.55, Lb = gaitFit(D, 0.4), tW0 = a + 0.15, tW1 = K.lugar4 - 0.1;
  const distF = (t) => andarAte(t, tW0, tW1, D, 0.8);
  return {
    bg: 0x0a0606, fog: [12, 40], fogCol: 0x0a0606,
    look: { exposure: 1.1, bloom: 0.7, bloomT: 0.72, vig: 0.55, sat: 1.06, con: 1.07, lift: [0.012, 0.006, 0.004] },
    sun: { dir: [0.1, 0.8, 0.6], col: 0xffe0c0, I: 0.25, c: [0, 0.5, -1], r: 5 }, hemi: { sky: 0x6a4a40, ground: 0x1a0c08, I: 0.32 }, fill: { col: 0xffc8a0, I: 0.12, dir: [0, 0.3, 1] }, rim: { col: 0xffe0c0, str: 0.5 }, hand: 0.007,
    update(t) {
      const att = smr(t, K.primeiro - 0.1, K.primeiro + 0.15);
      s1_.L.intensity = 38 * att; s1_.cone.material.opacity = 0.14 * att; s3.L.intensity = 18 * (1 - 0.55 * att); s3.cone.material.opacity = 0.08 * (1 - 0.5 * att);
      sProv.L.intensity = 18 * (1 - smr(t, K.sempre - 0.2, K.sempre + 0.4)) + 4;
      flashes.forEach((f, i) => { const tf = K.primeiro + 0.05 + i * 0.17 + hash(i) * 0.08, k = t > tf && t < tf + 0.12 ? 1 - (t - tf) / 0.12 : 0; f.material.opacity = 0.95 * k; f.scale.setScalar(1.2 + k * 1.4); });
      floatDust(poeira, t, 0.2, 0.15);
      restPose(p);
      const d = distF(t);
      gait(p, d, { from: [1.85, 0, Z0], ang: 0, step: Lb, hf, hb, amt: 0.9 });
      idle(p, t, 11, 0.3 + 0.7 * clamp((t - tW1) / 0.5));
      // olha para o 1º lugar no "de propósito"; recua o rosto quando a luz acende lá
      const lk = act(t, K.proposito - 0.2, K.proposito + 0.5, 0.1, 0.06) * (1 - smr(t, K.primeiro + 0.4, K.primeiro + 0.9));
      if (lk > 0.001) lookAtW(p, V3(1.2, 0.9, -1.0), clamp(lk), 1.3);
      const fl = act(t, K.primeiro + 0.05, K.primeiro + 0.5, 0.05, 0.1);
      if (fl > 0) { u.neck.rotation.y -= 0.35 * fl; u.spine.rotation.x -= 0.06 * fl; u.sh.forEach((s_) => (s_.rotation.x -= 0.05 * fl)); }
      molaHomem(p, t, (tt) => { const dd = distF(tt); return [1.85, 0.95 + hb(1.85, Z0 + dd), Z0 + dd]; });
    },
    cam(t) {
      return path2(t, [
        [a, [0.6, 1.9, 5.2], [0.6, 1.2, -1.2], 36],
        [K.terceiro + 0.3, [1.3, 1.45, 3.2], [1.5, 1.0, -1.1], 36],
        [K.redacao + 0.15, [-2.35, 1.3, 0.85], [-2.5, 1.1, -1.25], 34],
        [K.corrida + 0.15, [-1.55, 1.3, 0.95], [-1.65, 0.62, -1.25], 34],
        [K.violino + 0.25, [-0.7, 1.25, 0.6], [-0.78, 1.0, -1.3], 34],
        [K.sempre + 0.45, [1.55, 1.25, 1.75], [1.75, 1.1, -1.0], 34],
        [K.proposito + 0.4, [2.2, 1.35, 1.95], [1.65, 1.0, -1.0], 33],
        [K.primeiro + 0.3, [1.2, 1.6, 3.4], [1.45, 0.95, -1.0], 36],
        [b, [1.0, 1.75, 4.2], [1.35, 0.95, -1.0], 38],
      ]);
    },
  };
});
