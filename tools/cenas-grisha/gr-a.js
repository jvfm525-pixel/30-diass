// ================================================================ vídeo: Grisha · cenas 0–4 (capa, morro, Shiganshina, missão, Frieda)
const _sp4 = [];
const DOF_CLOSE = { ap: 0.008, max: 0.014 }, DOF_MED = { ap: 0.005, max: 0.012 };
const CORES_OURO = [0xffd890, 0xffb860, 0xffe8b8, 0xffc070];

function cenaShiganshina(g, o = {}) {
  skyDome(g, { top: 0x2a2048, mid: 0xc06048, hor: 0xffb070, ground: 0x2a2020, sunDir: [0.25, 0.1, -1], sunCol: 0xffd090, sunI: 0.9, disk: 1.6, cov: 0.5, cloudLit: 0xffb080, cloudSh: 0x5a3a4a, midY: 0.2 });
  const ch = mesh(new THREE.PlaneGeometry(600, 600), LPmat(0x4a4038), 0, -0.01, 0, g); ch.rotation.x = -Math.PI / 2;
  ruaPedra(g, 7, 90, 30);
  for (let i = 0; i < 11; i++) [-1, 1].forEach((k) => casaEnx(g, k * (6.2 + hash(i * 3 + k) * 0.8), 24 - i * 6.5, { ry: k > 0 ? -Math.PI / 2 : Math.PI / 2, w: 5.5, d: 4.5, h: 5 + hash(i + k) * 3, luz: hash(i * 7 + k * 3) > 0.45 }));
  for (let i = 0; i < 26; i++) { const k = i % 2 ? 1 : -1; casaEnx(g, k * (14 + hash(i) * 20), 20 - hash(i * 3) * 60, { ry: hash(i * 5) * 6, w: 5, d: 5, h: 5 + hash(i * 7) * 4, luz: hash(i) > 0.6 }); }
  muralhaV2(g, 330, 50, { c: [0, 0, 260], a0: -0.16, a1: 0.16, n: 7, portao: true, canhoes: 10 });
  const co = colossal(g, 1); co.position.set(0, 58, -70); co.rotation.x = 0.28;
  // as mãos do Colossal agarrando o topo da muralha
  const mus = LPmat(0xb8463a, { rim: 0.9 }); [-1, 1].forEach((k) => { const m = grp(g, k * 11, 49.5, -70.5); for (let f = 0; f < 4; f++) { const d = mesh(cap(0.9, 3.6, 3, 6), mus, (f - 1.5) * 2.0, 0.2, 2.2, m); d.rotation.x = 1.25; } mesh(box(8.5, 3, 4), mus, 0, 0.6, -0.6, m); });
  const vap = steam(g, { origin: [10, 50, -66], n: 30, size: 10, spread: 16, rise: 7, grow: 2.2, opacity: 0.28, life: 4, color: 0xf2dcd0, wind: [1.2, 0, 0] });
  const fum = steam(g, { origin: [0, 3, -56], n: 26, size: 9, spread: 10, rise: 5, opacity: 0.35, color: 0x5a4a44, wind: [1.2, 0, 0] });
  const sol = solFlare(g, [60, 70, -320], 1.6, 0xffe0b0);
  const pedras = []; for (let i = 0; i < 18; i++) { const r = mesh(new THREE.DodecahedronGeometry(1.2 + hash(i) * 2.4, 0), matMuro(0.3, 0.3), (hash(i * 3) - 0.5) * 18, 0.9, -40 - hash(i * 5) * 16, g); r.rotation.set(i, i * 2, i * 3); pedras.push(r); }
  const brasa = estrelinhas(g, 40, [-8, 8, 1, 14, -40, 6], { cor: 0xffa060, s: 0.22 });
  return { co, vap, fum, sol, brasa };
}
const LUZ_SHIG = { bg: 0x2a2048, fog: [30, 520], fogCol: 0x9a6a5a, look: { exposure: 1.05, bloom: 0.5, bloomT: 0.8, vig: 0.5, sat: 1.1, con: 1.08, dof: DOF_MED },
  sun: { dir: [0.25, 0.35, -1], col: 0xffb070, I: 2.4, c: [0, 3, -10], r: 30 }, hemi: { sky: 0xd8a0a0, ground: 0x3a2a30, I: 0.85 }, fill: { col: 0xffc8a0, I: 0.6, dir: [0.3, 0.4, 1] }, rim: { col: 0xffb070, str: 1.4 } };
// ---------------------------------------------------------------- 0 · capa: o Grisha na caverna de cristal, luz azul nos óculos
addSet("s0-capa", (g) => {
  const __n = "s0-capa";
  const CV = cavernaCristal(g);
  const gr = grishaLP(); g.add(gr); gr.position.set(0, 0, 0.2); gr.rotation.y = 0.25;
  return { bg: 0x060a14, fog: [10, 40], fogCol: 0x0a1428, hand: 0, look: { exposure: 1.1, bloom: 0.7, bloomT: 0.72, vig: 0.55, sat: 1.1, con: 1.08, dof: DOF_CLOSE, rosto: 0.5 },
    sun: { dir: [0.6, 0.6, 0.6], col: 0x9ad0ff, I: 1.4, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x3a6aaa, ground: 0x0a1020, I: 0.5 }, fill: { col: 0xffd8c0, I: 0.35, dir: [-0.5, 0.2, 1] }, rim: { col: 0x8ad8ff, str: 1.6 },
    update(t) { CV.brilhos(t); vive(gr, t, 101, { boca: "linha", triste: 0.4, palpebra: 0.85, piscaCada: 99 }, 0.1); },
    cam() { { const d = dbgCam(__n); if (d) return d; } return closeRosto(gr, 0.75, 0.12, 0, 30); } };
});

// ---------------------------------------------------------------- 1 · abertura: o porão dos Yeager à luz de vela; o Grisha escreve os diários
addSet("s1-abertura", (g) => {
  const __n = "s1-abertura";
  const [a, b] = T.sc["s1-abertura"];
  const PO = porao(g);
  const gr = grishaLP(); g.add(gr); gr.position.set(-0.6, 0, -0.82); gr.rotation.y = Math.PI;
  const pen = naMao(gr, 0, caneta(0x2a1a10), { dx: 0.006, dy: -0.075, rot: [1.2, 0, 0] });
  return {
    bg: 0x0a0806, fog: [6, 20], fogCol: 0x0a0806, hand: 0.006,
    look: { exposure: 1.12, bloom: 0.55, bloomT: 0.75, vig: 0.55, sat: 1.08, con: 1.08, dof: DOF_MED, rosto: 0.35, lift: [0.01, 0.005, 0] },
    sun: { dir: [0.4, 0.8, 0.5], col: 0xffe8c0, I: 0.35, c: [0, 1, -1], r: 4 }, hemi: { sky: 0x4a3a2a, ground: 0x0a0806, I: 0.35 }, fill: { col: 0xffb870, I: 0.25, dir: [-0.5, 0.2, -1] }, rim: { col: 0xffc080, str: 1.2 },
    update(t) {
      flash(t, a, 0.001, 0.45); PO.vl.upd(t); floatDust(PO.poeira, t, 0.15, 0.1);
      // o Grisha sentado escrevendo; para no "não sabia por quê" e olha pra vela
      restPose(gr); idle(gr, t, 101, 0.2); sitPose(gr, 1, { seatY: 0.56, lean: 0.28 }); pose(gr, { neck: [0.32, 0, 0], handR: 0.85, handL: 0.35 }, 1);
      const para = smr(t, K.que1 - 1.0, K.que1 - 0.3), esc = Math.sin(t * 7.5) * 0.02 * (1 - para), linha = ((t * 0.3) % 1) * 0.07 * (1 - para);
      maoEm(gr, 0, V3(-0.6 + 0.04 + esc, 0.82, -1.33 - linha), 1, { abre: 0.5, poleY: 0.3, poleZ: 0.1 }); maoEm(gr, 1, V3(-0.85, 0.81, -1.2), 1, { abre: 0.5, poleY: 0.3, poleZ: 0.1 });
      pose(gr, { neck: [0.32 - 0.25 * para, -0.35 * para, 0], head: [0, -0.2 * para, 0] }, 1);
      rostoLP(gr, t, { boca: "linha", triste: 0.35 + 0.3 * para, palpebra: 0.82, piscaCada: 4.5 });
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([2.4, 2.9, 1.0], [1.5, 1.9, 0.4], [-0.6, 0.95, -1.4], [-0.6, 1.0, -1.3], 44, 40)],
        [K.pai - 0.25, (tt, u) => ({ pos: [lerp(-0.3, -0.36, u), 1.08, -1.82], look: [-0.62, 1.24, -0.95], fov: 34, near: 0.02 })],
        [K.pior - 0.15, mov([-0.12, 1.06, -1.78], [-0.16, 1.02, -1.72], [-0.58, 0.82, -1.34], [-0.58, 0.82, -1.34], 36, 34)],
        [K.que1 - 1.1, (tt, u) => ({ pos: [lerp(0.5, 0.35, u), 1.3, -1.72], look: [-0.7, 1.2, -0.95], fov: 30, near: 0.02 })],
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
      S.co.position.y = 58 + Math.sin(t * 0.5) * 0.3;
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.2, 1.3, 9], [1.0, 1.4, 6.5], [0, 30, -60], [0, 38, -60], 52, 50)],
        [K.grisha2 - 0.2, (tt, u) => { const c = gr.position; return { pos: [c.x + 0.9, 1.5, c.z + 2.2], look: [c.x, 1.3, c.z - 2], fov: 40 }; }],
        [K.correu - 0.2, (tt, u) => { const c = gr.position; return { pos: [c.x - 0.6, 1.2, c.z - 3.4], look: [c.x, 1.25, c.z], fov: 40 }; }],
        [K.contraria - 0.1, mov([4, 9, 14], [3.5, 8, 11], [0, 1, -6], [0, 1, -10], 46, 44)],
        [K.capela - 0.3, mov([316, 7, 30], [311, 8, 24], [300, 9, -2], [300, 10, -2], 42, 40)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 3 · a missão: o porto de Liberio à noite; o Kruger (oficial de Marley) entrega a seringa; Paradis no horizonte
addSet("s3-missao", (g) => {
  const __n = "s3-missao";
  const [a, b] = T.sc["s3-missao"];
  const LB = portoLiberio(g);
  const kr = krugerLP(); g.add(kr); quepe(kr); kr.position.set(0.7, 0, -2.0); kr.rotation.y = -1.45;
  const gr = grishaLP(); g.add(gr); bracadeira(gr); gr.position.set(-0.7, 0, -2.05); gr.rotation.y = 1.5;
  const spK = sombraPe(g, kr), spG = sombraPe(g, gr);
  const SR = seringa(null); naMao(kr, 0, SR.s, { dx: 0.02, dy: -0.07, rot: [0, 0, 0] });
  const brilhoIlha = glowSprite(0xffd070, 110, 0); brilhoIlha.position.set(25, 22, -430); g.add(brilhoIlha);
  const coroa_ = grp(g, 25, 42, -420); for (let i = 0; i < 7; i++) mesh(new THREE.ConeGeometry(2.5, 9, 4), new THREE.MeshBasicMaterial({ color: 0xffd860, transparent: true, opacity: 0, blending: ADD }), Math.cos(i / 7 * 6.28) * 11, 0, Math.sin(i / 7 * 6.28) * 11, coroa_);
  const ris = riscosVento(g, 16, [-5, 5, 0.3, 3, -6, 2], { cor: 0xbfd0ff, op: 0.35 });
  return {
    bg: 0x060a1c, fog: [30, 1600], fogCol: 0x0e1630, hand: 0,
    look: { exposure: 1.12, bloom: 0.6, bloomT: 0.74, vig: 0.55, sat: 1.08, con: 1.08, dof: DOF_MED, rosto: 0.45 },
    sun: { dir: [-0.3, 0.6, -0.8], col: 0x9ab0e8, I: 0.9, c: [0, 1, -2], r: 10 }, hemi: { sky: 0x2a3a6a, ground: 0x0a0a12, I: 0.55 }, fill: { col: 0xffb870, I: 0.45, dir: [0.8, 0.3, 0.4] }, rim: { col: 0xffc080, str: 1.4 },
    update(t) {
      chicote(t, a, 0.22, -1); LB.fumaca.upd(t); ris(t, 0.8);
      vive(kr, t, 102, { boca: t > K.kruger - 0.1 && t < K.missao + 0.8 && Math.sin(t * 9) > 0.2 ? "aberta" : "linha", bravo: 0.55, palpebra: 0.8 }, 0.15); ventoAbas(kr, t, 0.8);
      vive(gr, t, 101, { boca: "linha", sobe: t > K.tita ? 0.4 : 0, palpebra: t > K.tita ? 1.0 : 0.85 }, 0.15); ventoAbas(gr, t, 0.8);
      // o Kruger estende a seringa; o Grisha pega no "missão"
      const est = act(t, K.tita - 0.8, K.tita - 0.1) * (1 - smr(t, K.missao + 0.2, K.missao + 0.8)); const meio = kr.position.clone().lerp(gr.position, 0.5).setY(1.15);
      maoEm(kr, 0, mixV(frenteW(kr, 0.18, 0.9, 0.1), meio, est), Math.max(0.001, Math.min(1, est * 3)), { abre: 0.5, poleY: 0.0, poleZ: -0.4 }); pose(kr, { handR: 0.6 }, 1);
      const pega = smr(t, K.missao - 0.4, K.missao + 0.1) * (1 - smr(t, K.fundador, K.fundador + 0.6)); maoEm(gr, 0, mixV(frenteW(gr, 0.18, 0.9, 0.1), meio.clone().add(V3(-0.05, -0.02, 0)), pega), Math.max(0.001, pega), { abre: 0.5, poleY: 0.0, poleZ: -0.4 });
      SR.s.visible = t > K.tita - 0.9; SR.liq.material.emissiveIntensity = 1.2 + 0.4 * Math.sin(t * 4); SR.gl.material.opacity = 0.5 + 0.2 * Math.sin(t * 4);
      // Paradis no horizonte: o brilho dourado da família real
      const cr = smr(t, K.fundador - 0.3, K.real + 0.3); brilhoIlha.material.opacity = 0.35 * cr; coroa_.children.forEach((m) => (m.material.opacity = 0.9 * cr)); coroa_.rotation.y = t * 0.3;
      spK(0); spG(0);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([3.2, 1.5, 6.5], [2.6, 1.6, 5.2], [-0.5, 1.6, -4], [-0.3, 1.5, -3], 42, 40)],
        [K.kruger - 0.2, (tt, u) => ({ ...closeRosto(kr, lerp(1.0, 0.82, E.inOut(u)), -0.35, 0, 30) })],
        [K.tita - 0.9, (tt, u) => { const c = SR.s.getWorldPosition(V3()); return { pos: [c.x + 0.25, c.y + 0.12, c.z + lerp(0.75, 0.55, u)], look: [c.x, c.y, c.z], fov: 34, near: 0.02 }; }],
        [K.missao - 0.1, (tt, u) => ({ ...closeRosto(gr, lerp(1.0, 0.82, E.inOut(u)), 0.35, 0, 30) })],
        [K.fundador - 0.5, mov([-1.4, 1.6, -0.2], [-1.2, 1.7, -0.6], [0, 1.4, -6], [25, 30, -420], 40, 30)],
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
