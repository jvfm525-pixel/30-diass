// ================================================================ vídeo: Grisha · cenas 0–4 (capa, morro, Shiganshina, missão, Frieda)
const _sp4 = [];
const DOF_CLOSE = { ap: 0.008, max: 0.014 }, DOF_MED = { ap: 0.005, max: 0.012 };
const CORES_OURO = [0xffd890, 0xffb860, 0xffe8b8, 0xffc070];

// ---------------------------------------------------------------- 0 · capa: Shiganshina ao entardecer; o Colossal agarrado no topo da Muralha Maria, vapor, sol atrás
function cenaShiganshina(g, o = {}) {
  skyDome(g, { top: 0x2a2048, mid: 0xc06048, hor: 0xffb070, ground: 0x2a2020, sunDir: [0.25, 0.1, -1], sunCol: 0xffd090, sunI: 0.9, disk: 1.6, cov: 0.5, cloudLit: 0xffb080, cloudSh: 0x5a3a4a, midY: 0.2 });
  const ch = mesh(new THREE.PlaneGeometry(600, 600), LPmat(0x4a4038), 0, -0.01, 0, g); ch.rotation.x = -Math.PI / 2;
  ruaPedra(g, 7, 90, 30);
  for (let i = 0; i < 11; i++) [-1, 1].forEach((k) => casaEnx(g, k * (6.2 + hash(i * 3 + k) * 0.8), 24 - i * 6.5, { ry: k > 0 ? -Math.PI / 2 : Math.PI / 2, w: 5.5, d: 4.5, h: 5 + hash(i + k) * 3, luz: hash(i * 7 + k * 3) > 0.45 }));
  for (let i = 0; i < 26; i++) { const k = i % 2 ? 1 : -1; casaEnx(g, k * (14 + hash(i) * 20), 20 - hash(i * 3) * 60, { ry: hash(i * 5) * 6, w: 5, d: 5, h: 5 + hash(i * 7) * 4, luz: hash(i) > 0.6 }); }
  muralhaV2(g, 330, 50, { c: [0, 0, 260], a0: -0.16, a1: 0.16, n: 7, portao: true, canhoes: 10 });
  const co = colossal(g, 1); co.position.set(0, 50, -68); co.rotation.x = 0.12;
  // as mãos do Colossal agarrando o topo da muralha
  const mus = LPmat(0xb8463a, { rim: 0.9 }); [-1, 1].forEach((k) => { const m = grp(g, k * 11, 49.5, -70.5); for (let f = 0; f < 4; f++) { const d = mesh(cap(0.9, 3.6, 3, 6), mus, (f - 1.5) * 2.0, 0.2, 2.2, m); d.rotation.x = 1.25; } mesh(box(8.5, 3, 4), mus, 0, 0.6, -0.6, m); });
  const vap = steam(g, { origin: [0, 46, -66], n: 36, size: 12, spread: 14, rise: 7, grow: 2.4, opacity: 0.45, life: 4, color: 0xf2dcd0 });
  const fum = steam(g, { origin: [0, 3, -56], n: 26, size: 9, spread: 10, rise: 5, opacity: 0.35, color: 0x5a4a44, wind: [1.2, 0, 0] });
  const sol = solFlare(g, [60, 70, -320], 1.6, 0xffe0b0);
  const pedras = []; for (let i = 0; i < 18; i++) { const r = mesh(new THREE.DodecahedronGeometry(1.2 + hash(i) * 2.4, 0), matMuro(0.3, 0.3), (hash(i * 3) - 0.5) * 18, 0.9, -40 - hash(i * 5) * 16, g); r.rotation.set(i, i * 2, i * 3); pedras.push(r); }
  const brasa = estrelinhas(g, 40, [-8, 8, 1, 14, -40, 6], { cor: 0xffa060, s: 0.22 });
  return { co, vap, fum, sol, brasa };
}
const LUZ_SHIG = { bg: 0x2a2048, fog: [30, 520], fogCol: 0x9a6a5a, look: { exposure: 1.05, bloom: 0.5, bloomT: 0.8, vig: 0.5, sat: 1.1, con: 1.08, dof: DOF_MED },
  sun: { dir: [0.25, 0.35, -1], col: 0xffb070, I: 2.4, c: [0, 3, -10], r: 30 }, hemi: { sky: 0xd8a0a0, ground: 0x3a2a30, I: 0.85 }, fill: { col: 0xffc8a0, I: 0.6, dir: [0.3, 0.4, 1] }, rim: { col: 0xffb070, str: 1.4 } };
addSet("s0-capa", (g) => {
  const __n = "s0-capa";
  const S = cenaShiganshina(g);
  [[-1.2, 2], [0.9, 1.4]].forEach(([x, z], i) => { const p = i ? grishaLP() : erenKidLP(); g.add(p); p.position.set(x, 0, z); p.rotation.y = Math.PI; p.userData.i = i; S["p" + i] = p; });
  return { ...LUZ_SHIG, hand: 0,
    update(t) { S.vap.upd(t); S.fum.upd(t); S.brasa(t); [S.p0, S.p1].forEach((p, i) => { vive(p, t, 90 + i, { boca: "linha" }, 0.2); ventoAbas(p, t, 1); }); },
    cam() { { const d = dbgCam(__n); if (d) return d; } return { pos: [1.6, 1.2, 8.5], look: [0, 22, -60], fov: 50, focus: 60 }; } };
});

// ---------------------------------------------------------------- 1 · abertura: o morro com a árvore grande ao vento (como na referência); a Muralha Maria ao longe; o Grisha olhando
function morroRef(g, o = {}) {
  const hf = (x, z) => 0.9 * Math.exp(-(x * x + (z + 2) * (z + 2)) / 260) + 0.6 * Math.sin(x * 0.045) * Math.cos(z * 0.05) - 0.4 - Math.max(0, Math.hypot(x, z) - 40) * 0.03;
  terrain(g, { size: 520, segs: 140, h: hf, grassA: o.gA ?? 0x6aa83e, grassB: o.gB ?? 0x9cc858, dirt: o.gA ?? 0x6aa83e, rock: o.gB ?? 0x8ab84a });
  grassField(g, o.nGrama ?? 4500, [-14, 14, -14, 12], hf, { s: 0.7, colA: o.gA ?? 0x5a9a30, colB: o.gB ?? 0xa8d060 });
  arvoresLonge(g, o.nLonge ?? 260, 14, 160, hf, { c1: o.c1 ?? 0x3e7a2c, c2: o.c2 ?? 0x74b04a, mask: (x, z) => !(Math.abs(x) < 10 && z > -6) });
  montanhasLonge(g, 260, 16, o.mont ?? 0x9ab0c8, 40);
  return hf;
}
addSet("s1-abertura", (g) => {
  const __n = "s1-abertura";
  const [a, b] = T.sc["s1-abertura"];
  const ceu = skyDome(g, { top: 0x3a72c8, mid: 0x86b2e0, hor: 0xd8eaf4, ground: 0x6a9a4a, sunDir: [0.45, 0.4, -0.8], sunCol: 0xfff4d8, sunI: 1.0, disk: 1.4, cov: 0.6, cloudLit: 0xffffff, cloudSh: 0x9aaac8, cloudScale: 0.12 });
  const hf = morroRef(g);
  muralhaV2(g, 620, 55, { c: [0, -8, 0], a0: -0.35, a1: 0.35, n: 16 });
  const arv = arvoreRef(g, 0, -2, 1.0, { y: hf(0, -2) - 0.15 });
  gramaAlta(g, 2600, [-7, 7, -5, 12], hf, { h: 0.55, mask: (x, z) => Math.hypot(x, z + 2) > 1.0 });
  const gr = grishaLP(); g.add(gr); gr.position.set(1.7, hf(1.7, -0.6), -0.6); gr.rotation.y = Math.PI + 0.2;
  const sp = sombraPe(g, gr);
  const fol = folhasRef(g, 220, [-9, 9, 0.2, 6.5, -7, 9], { vel: 2.6, s: 2.2 }), ris = riscosVento(g, 22, [-6, 6, 0.4, 3.4, -7, -1.5], { op: 0.7, comp: 2.4 });
  const sol = solFlare(g, [90, 80, -160], 1.2);
  return {
    bg: 0x86b2e0, fog: [60, 1100], fogCol: 0xc8dcea, hand: 0,
    look: { exposure: 1.06, bloom: 0.4, bloomT: 0.84, vig: 0.35, sat: 1.14, con: 1.05, dof: { ap: 0.006, max: 0.012 } },
    sun: { dir: [-0.5, 0.75, 0.55], col: 0xfff0d8, I: 2.6, c: [0.5, 3, -1.5], r: 10 }, hemi: { sky: 0xcfe2f6, ground: 0x8a7a5a, I: 1.05 }, fill: { col: 0xffe0c8, I: 1.0, dir: [0.2, 0.4, 1] }, rim: { col: 0xfff6e0, str: 1.1 },
    update(t) {
      flash(t, a, 0.001, 0.45);
      const esc = smr(t, K.que1 - 1.0, K.que1 + 0.3); ceu.material.uniforms.uTop.value.setHex(0x3a72c8).lerp(_c1.setHex(0x3a4258), esc); ceu.material.uniforms.uHor.value.setHex(0xd8eaf4).lerp(_c1.setHex(0x8a8e98), esc); sol.r.material.opacity = 1 - 0.8 * esc;
      fol(t, 1 + 0.5 * esc); ris(t, 1); arv.vento(t, 1 + esc);
      vive(gr, t, 101, { boca: "linha", triste: 0.45, palpebra: 0.85 }, 0.25); pose(gr, { head: [0.06, 0, 0] }, 1);
      maoEm(gr, 0, frenteW(gr, 0.06, 0.88, -0.2), 1, { abre: 0.4, poleY: 0.2, poleZ: 0.4 }); maoEm(gr, 1, frenteW(gr, -0.06, 0.9, -0.2), 1, { abre: 0.4, poleY: 0.2, poleZ: 0.4 });
      ventoAbas(gr, t, 1.2 + 0.5 * esc); cabeloVento(gr, t, 1 + esc, [1, 0, 0.2]); sp(gr.position.y);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.6, 2.4, 14], [0.4, 2.1, 11], [0, 4.4, -2], [0, 4.0, -2], 46, 44)],
        [K.pai - 0.25, (tt, u) => { const e = olhosW(gr); return { pos: [e.x + 1.4 - 0.2 * u, e.y + 0.05, e.z - 2.6 + 0.5 * u], look: [e.x, e.y - 0.25, e.z], fov: 36 }; }],
        [K.pior - 0.1, (tt, u) => ({ ...closeRosto(gr, lerp(1.2, 0.95, E.inOut(u)), 0.2, 0, 30) })],
        [K.que1 - 1.2, mov([2.8, 1.7, 1.6], [3.0, 1.8, 2.6], [1.7, 1.5, -0.6], [0, 30, -620], 40, 44)],
      ], b);
    },
  };
});
const _c1 = new THREE.Color();

// ---------------------------------------------------------------- 2 · Shiganshina: o Colossal, a multidão fugindo; o Grisha corre ao contrário; a capela dos Reiss ao entardecer
addSet("s2-muralha", (g) => {
  const __n = "s2-muralha";
  const [a, b] = T.sc["s2-muralha"];
  const S = cenaShiganshina(g);
  const mul = multidao(g, 46, [-2.8, 2.8, -40, 4]);
  const gr = grishaLP(); g.add(gr); const sp = sombraPe(g, gr);
  // capela dos Reiss no alto de um morro gramado (x=300), céu do fim de tarde, árvores, caminho
  const C = grp(g, 300, 0, 0);
  const hfC = (x, z) => 6 * Math.exp(-((x - 300) * (x - 300) + z * z) / 900) - 0.5;
  terrain(C, { size: 260, segs: 90, x: 300, h: (x, z) => hfC(x, z), grassA: 0x4a6a32, grassB: 0x6a8a3a, dirt: 0x5a5a3a, rock: 0x5a6a4a });
  const cp = capela(C); cp.position.set(0, hfC(300, -2) - 0.2, -2);
  arvoresLonge(C, 70, 14, 90, (x, z) => hfC(x + 300, z), { c1: 0x2a4a2a, c2: 0x4a6a3a, mask: (x, z) => !(x > 4 && z > 8) });
  const solC = solFlare(C, [-60, 25, -200], 1.4, 0xffc890);
  const D = 9, L = gaitFit(D, 0.8, 1);
  return { ...LUZ_SHIG, hand: 0.01,
    update(t) {
      chicote(t, a, 0.22, 1); S.vap.upd(t); S.fum.upd(t); S.brasa(t); mul(t, 3.2);
      const run = clamp((t - a) / (K.capela - 0.3 - a)); gait(gr, D * run, { from: [0.6, 0, 4], ang: Math.PI, step: L, run: 1 }); rostoLP(gr, t, { boca: "aberta", bravo: 0.5, palpebra: 1.0, suor: 0.6 }); ventoAbas(gr, t, 1.6); cabeloVento(gr, t, 1.4, [0, 0, 1]); sp(0);
      S.co.position.y = 50 + Math.sin(t * 0.5) * 0.3;
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.2, 1.4, 9], [1.0, 1.6, 6.5], [0, 14, -60], [0, 20, -60], 48, 46)],
        [K.grisha2 - 0.2, (tt, u) => { const c = gr.position; return { pos: [c.x + 0.9, 1.5, c.z + 2.2], look: [c.x, 1.3, c.z - 2], fov: 40 }; }],
        [K.correu - 0.2, (tt, u) => { const c = gr.position; return { pos: [c.x - 0.6, 1.2, c.z - 3.4], look: [c.x, 1.25, c.z], fov: 40 }; }],
        [K.contraria - 0.1, mov([4, 9, 14], [3.5, 8, 11], [0, 1, -6], [0, 1, -10], 46, 44)],
        [K.capela - 0.3, mov([316, 7, 30], [311, 8, 24], [300, 9, -2], [300, 10, -2], 42, 40)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 3 · a missão: no topo da muralha de Paradis, à beira-mar, ao pôr do sol (como a cena do Kruger da referência)
addSet("s3-missao", (g) => {
  const __n = "s3-missao";
  const [a, b] = T.sc["s3-missao"];
  skyDome(g, { top: 0x2a2a5a, mid: 0xd8704a, hor: 0xffb070, ground: 0x2a2a3a, sunDir: [0.0, 0.05, -1], sunCol: 0xfff0c0, sunI: 0.55, disk: 1.4, cov: 0.3, cloudLit: 0xffb080, cloudSh: 0x6a4a5a, midY: 0.22 });
  topoMuralha(g, 420, 6.5); marSimples(g, -60, 0x3a3a5a);
  montanhasLonge(g, 420, 12, 0x6a5a6a, 50);
  const sol = solFlare(g, [0, 16, -380], 1.0, 0xffe0b0); sol.r.material.opacity = 0.5; sol.d.material.opacity = 0.7;
  const kr = krugerLP(); g.add(kr); kr.position.set(0.8, 0, -0.2); kr.rotation.y = -1.35;
  const gr = grishaLP(); g.add(gr); gr.position.set(-0.8, 0, -0.1); gr.rotation.y = 1.4;
  const spK = sombraPe(g, kr), spG = sombraPe(g, gr);
  const orbG = glowSprite(0xffe0a0, 0.5, 0); g.add(orbG); const orbL = new THREE.PointLight(0xffd090, 0, 3, 1.5); g.add(orbL); const fag = estrelinhas(g, 30, [-1, 1, 0.6, 1.8, -0.6, 0.4], { s: 0.12 });
  const coroa_ = grp(g, 0, 2.3, -0.2); for (let i = 0; i < 7; i++) mesh(new THREE.ConeGeometry(0.05, 0.18, 4), new THREE.MeshStandardMaterial({ color: 0xffd860, emissive: 0xffb030, emissiveIntensity: 1.4, metalness: 0.6 }), Math.cos(i / 7 * 6.28) * 0.22, 0, Math.sin(i / 7 * 6.28) * 0.22, coroa_); const anelC = mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 20), new THREE.MeshStandardMaterial({ color: 0xffd860, emissive: 0xffb030, emissiveIntensity: 1.2 }), 0, -0.1, 0, coroa_); anelC.rotation.x = Math.PI / 2;
  const fol = folhasRef(g, 90, [-7, 7, 0.2, 4, -6, 5], { cores: CORES_OURO, brilho: 0xffa050, vel: 1.8, s: 1.6 }), ris = riscosVento(g, 18, [-5, 5, 0.3, 3, -3, 6], { cor: 0xffe8c8, op: 0.5 });
  const poeira = dustPts(160, [-6, 6, 0.1, 5, -10, 6], 0xffd8a0, 0.05, 0.8); g.add(poeira);
  return {
    bg: 0x2a2a5a, fog: [60, 900], fogCol: 0xd88a6a, hand: 0,
    look: { exposure: 0.98, bloom: 0.45, bloomT: 0.84, vig: 0.5, sat: 1.12, con: 1.08, dof: DOF_MED },
    sun: { dir: [0.05, 0.22, -1], col: 0xffb070, I: 2.8, c: [0, 1, -1], r: 8 }, hemi: { sky: 0xd8a0a0, ground: 0x3a2a30, I: 0.75 }, fill: { col: 0xffd0a0, I: 0.55, dir: [0.2, 0.4, 1] }, rim: { col: 0xffc080, str: 1.7 },
    update(t) {
      chicote(t, a, 0.22, -1); fol(t, 0.9); ris(t, 0.9); floatDust(poeira, t, 0.2, 0.2);
      vive(kr, t, 102, { boca: t > K.kruger && t < K.missao + 0.8 && Math.sin(t * 9) > 0.2 ? "aberta" : "linha", bravo: 0.5, palpebra: 0.85 }, 0.2); ventoAbas(kr, t, 1.4); cabeloVento(kr, t, 1, [1, 0, 0]);
      vive(gr, t, 101, { boca: "linha", sobe: t > K.tita ? 0.5 : 0, palpebra: t > K.tita ? 1.05 : 0.9 }, 0.2); ventoAbas(gr, t, 1.4); cabeloVento(gr, t, 1, [1, 0, 0]);
      const toca = act(t, K.tita - 1.2, K.tita - 0.5) * (1 - smr(t, K.missao + 0.4, K.missao + 1.0)); maoEm(kr, 0, peitoW(gr).add(V3(0.08, 0, 0)), toca, { abre: 0.5, poleY: 0, poleZ: -0.3 }); pose(kr, { handR: 0.2 }, 1);
      const vai = E.inOut(smr(t, K.tita - 0.4, K.tita + 0.6)); orbG.position.copy(peitoW(kr).lerp(peitoW(gr), vai)); orbG.material.opacity = 0.9 * smr(t, K.tita - 0.6, K.tita - 0.3) * (1 - smr(t, K.tita + 0.6, K.tita + 1.0)); orbL.position.copy(orbG.position); orbL.intensity = 3 * orbG.material.opacity; fag(t, orbG.material.opacity);
      flash(t, K.tita + 0.55, 0.05, 0.4, [1, 0.9, 0.7]); GU.uFlash.value *= 0.5;
      const cr = E.outBack(smr(t, K.fundador - 0.3, K.fundador + 0.4)) * (1 - smr(t, b - 0.4, b)); coroa_.scale.setScalar(Math.max(0.001, cr)); coroa_.rotation.y = t * 1.2; coroa_.visible = cr > 0.01;
      spK(0); spG(0);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.4, 1.6, 9.5], [0.3, 1.5, 6.5], [0, 1.4, -2], [0, 1.3, -2], 40, 38)],
        [K.kruger - 0.2, (tt, u) => ({ ...closeRosto(kr, lerp(1.0, 0.8, E.inOut(u)), -0.55, 0, 30) })],
        [K.tita - 1.0, mov([0.3, 1.35, 3.8], [0.2, 1.35, 3.3], [0, 1.15, -0.15], [0, 1.15, -0.15], 50, 48)],
        [K.missao - 0.1, (tt, u) => ({ ...closeRosto(gr, lerp(1.0, 0.8, E.inOut(u)), 0.55, 0, 30) })],
        [K.fundador - 0.4, mov([0.5, 1.6, 3.6], [0.3, 2.0, 3.0], [0, 1.6, -0.2], [0, 2.2, -0.2], 40, 38)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 4 · Frieda: a caverna de cristal; a família Reiss; a muralha de luz que ela podia erguer; o juramento que a prende
addSet("s4-frieda", (g) => {
  const __n = "s4-frieda";
  const [a, b] = T.sc["s4-frieda"];
  const CV = cavernaCristal(g);
  const fr = friedaLP(); g.add(fr); fr.position.set(0, 0, -1.5);
  const rod = rodLP(); g.add(rod); rod.position.set(1.4, 0, -3.2); rod.rotation.y = -0.3;
  const kids = [0, 1, 2, 3].map((i) => { const k = criancaLP(i); g.add(k); k.position.set(-1.6 + i * 0.6 + (i > 1 ? 1.4 : 0), 0, -3.0 - (i % 2) * 0.4); k.rotation.y = 0.2 - i * 0.12; return k; });
  const holo = muralha(g, 8, 2.2, { c: [0, 0, -1.5 + 0], a0: -3.14, a1: 3.14, n: 18, esp: 0.3 }); holo.traverse((m) => { if (m.isMesh) { m.material = new THREE.MeshBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }); m.castShadow = false; } }); holo.position.z = -1.5 + 8 * 0; holo.scale.setScalar(1);
  const aneis = [0, 1, 2].map((i) => { const r = mesh(new THREE.TorusGeometry(0.55 + i * 0.08, 0.012, 6, 40), new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }), 0, 0.6 + i * 0.4, -1.5, g); r.castShadow = false; return r; });
  return {
    bg: 0x060a14, fog: [10, 40], fogCol: 0x0a1428, hand: 0,
    look: { exposure: 1.15, bloom: 0.75, bloomT: 0.7, vig: 0.55, sat: 1.1, con: 1.06, dof: DOF_MED },
    sun: { dir: [0, 1, 0.3], col: 0x7ab8ff, I: 1.0, c: [0, 1, -2], r: 8 }, hemi: { sky: 0x3a6aaa, ground: 0x0a1020, I: 0.6 }, fill: { col: 0x9ad0ff, I: 0.9, dir: [0, 0.3, 1] }, rim: { col: 0x8ad8ff, str: 1.4 },
    update(t) {
      chicote(t, a, 0.22, 1);
      vive(fr, t, 103, { boca: t > K.proibia ? "triste" : "linha", triste: 0.25 + 0.4 * smr(t, K.juramento, K.proibia), palpebra: 0.85 - 0.15 * smr(t, K.proibia, K.proibia + 0.5) }, 0.2);
      pose(fr, { neck: [0.25 * smr(t, K.proibia - 0.3, K.proibia + 0.4), 0, 0] }, 1);
      vive(rod, t, 104, { boca: "linha", palpebra: 0.8 }, 0.2); kids.forEach((k, i) => vive(k, t, 110 + i, { boca: "sorriso" }, 0.3));
      CV.cr.emissiveIntensity = 0.85 + 0.2 * Math.sin(t * 1.5); CV.brilhos(t); floatDust(CV.poeira, t, 0.2, 0.1); cabeloVento(fr, t, 0.3, [1, 0, 0]);
      const sv = smr(t, K.salvar - 0.3, K.salvar + 0.6) * (1 - smr(t, K.juramento - 0.2, K.juramento + 0.4)); holo.traverse((m) => { if (m.isMesh) m.material.opacity = 0.35 * sv; }); holo.scale.y = Math.max(0.01, E.outBack(sv));
      aneis.forEach((r, i) => { const k = smr(t, K.juramento - 0.1 + i * 0.2, K.juramento + 0.5 + i * 0.2), aperta = smr(t, K.proibia - 0.2, K.proibia + 0.5); r.material.opacity = 0.9 * k; r.scale.setScalar(lerp(2.2, 1, k) * lerp(1, 0.55, aperta)); r.rotation.set(Math.PI / 2 + Math.sin(t + i) * 0.2, t * (1 + i * 0.4), 0); });
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0, 3.5, 9], [0, 2.4, 6.5], [0, 2.5, -4], [0, 1.4, -2], 46, 44)],
        [K.frieda - 0.2, (tt, u) => ({ ...closeRosto(fr, lerp(1.1, 0.85, E.inOut(u)), 0.15, 0, 30) })],
        [K.salvar - 0.3, mov([2.5, 2.2, 5], [1.8, 2.6, 4.4], [0, 0.8, -1.5], [0, 1.0, -1.5], 46, 44)],
        [K.juramento - 0.2, mov([0.6, 1.5, 2.2], [0.4, 1.45, 1.6], [0, 1.2, -1.5], [0, 1.3, -1.5], 40, 38)],
        [K.proibia - 0.2, (tt, u) => ({ ...closeRosto(fr, lerp(0.9, 0.75, E.inOut(u)), -0.1, 0.03, 30) })],
      ], b);
    },
  };
});
