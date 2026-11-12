// ---------------------------------------------------------------- personagens v2 (originais, nada desenhado de séries)
// Esqueleto com quadril, coluna, peito, pescoço, cabeça, ombro/cotovelo/punho, quadril/joelho/tornozelo.
// Convenções (personagem olhando para +z): braço [0] = direito (-x), [1] = esquerdo (+x).
// Braço pra frente = rotação x negativa; cotovelo dobra com x negativo; coxa pra frente = x negativo; joelho dobra com x positivo.
const SKINS = { clara: 0xf1c9a5, media: 0xdba27a, morena: 0xb07850, escura: 0x75492f };
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
const _m4 = new THREE.Matrix4(), _q1 = new THREE.Quaternion();
const _ray = new THREE.Raycaster();
function surfZ(m, x, y, z0 = 2) { _ray.set(_v4.set(x, y, z0), new THREE.Vector3(0, 0, -1)); const h = _ray.intersectObject(m, false)[0]; return h ? h.point.z : 0; }

const HUMANO = { hipY: 0.95, spine: 0.1, chest: 0.2, neckY: 0.275, headY: 0.05, shW: 0.185, shY: 0.235, upper: 0.29, fore: 0.255, hipW: 0.092, thigh: 0.435, shin: 0.435 };
function skeleton(d) {
  const root = new THREE.Group();
  const hips = grp(root, 0, d.hipY, 0);
  const spine = grp(hips, 0, d.spine, 0);
  const chest = grp(spine, 0, d.chest, 0);
  const neck = grp(chest, 0, d.neckY, d.neckZ ?? 0);
  const head = grp(neck, 0, d.headY, d.headZ ?? 0.01);
  const sh = [-1, 1].map((k) => grp(chest, k * d.shW, d.shY, 0));
  const el = sh.map((s) => grp(s, 0, -d.upper, 0));
  const wr = el.map((e) => grp(e, 0, -d.fore, 0));
  const hipJ = [-1, 1].map((k) => grp(hips, k * d.hipW, -0.03, 0));
  const knee = hipJ.map((h) => grp(h, 0, -d.thigh, 0));
  const ankle = knee.map((k) => grp(k, 0, -d.shin, 0));
  return { root, hips, spine, chest, neck, head, sh, el, wr, hipJ, knee, ankle, d };
}

// cabeça: esfera deformada (mandíbula afinando, queixo, nuca)
function headGeo(o = {}) {
  const g = new THREE.SphereGeometry(1, 44, 32);
  const jaw = o.jaw ?? 0.3, chin = o.chin ?? 0.1;
  deform(g, (v) => {
    if (v.y < 0) { const k = Math.pow(-v.y, 1.35); v.x *= 1 - jaw * k; v.z += chin * k * Math.max(0, v.z); }
    if (v.z < 0) v.z *= o.back ?? 1.06;
    if (v.y > 0.3 && v.z > 0) v.z *= 1 - 0.07 * (v.y - 0.3);
    v.x *= 1 + (o.cheek ?? 0.05) * Math.exp(-((v.y + 0.08) ** 2) * 18) * Math.max(0, v.z);
  });
  g.scale(o.sx ?? 0.078, o.sy ?? 0.106, o.sz ?? 0.096);
  g.translate(0, o.cy ?? 0.11, 0);
  g.computeVertexNormals();
  return g;
}

// olho: globo + íris/pupila em calota + brilho; pálpebra de cima gira para piscar
function eye(parent, x, y, z, r, o = {}) {
  const g = grp(parent, x, y, z);
  const ball = grp(g);
  mesh(sph(r, 20, 16), TM(o.white ?? 0xf6f1ea), 0, 0, 0, ball);
  const capGeo = (rr, th) => { const c = new THREE.SphereGeometry(rr, 24, 8, 0, Math.PI * 2, 0, th); c.rotateX(Math.PI / 2); return c; };
  mesh(capGeo(r * 1.006, o.irisA ?? 0.68), TM(o.iris ?? 0x5a3a22), 0, 0, 0, ball);
  mesh(capGeo(r * 1.012, o.pupilA ?? 0.3), BM(0x0a0608), 0, 0, 0, ball);
  const hl = mesh(sph(r * 0.13, 8, 6), BM(o.hl ?? 0xc8c8c8), -r * 0.32, r * 0.36, r * 0.94, ball); hl.castShadow = false;
  const lidM = TM(o.lid ?? o.skin ?? SKINS.media);
  const up = grp(g);
  mesh(new THREE.SphereGeometry(r * 1.07, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), lidM, 0, 0, 0, up);
  const lash = mesh(new THREE.TorusGeometry(r * 1.07, r * (o.lash ?? 0.1), 6, 22, Math.PI), BM(o.lashCol ?? 0x140c0c), 0, 0, 0, up); lash.rotation.x = Math.PI / 2; lash.castShadow = false;
  const lo = mesh(new THREE.SphereGeometry(r * 1.05, 22, 8, 0, Math.PI * 2, Math.PI * 0.64, Math.PI * 0.36), lidM, 0, 0, 0, g);
  return { g, ball, up, lo, open: o.open ?? -0.5 };
}
function setEye(e, open, yaw = 0, pitch = 0) { e.up.rotation.x = lerp(1.05, e.open, clamp(open)); e.ball.rotation.set(pitch, yaw, 0); }

// cabelo em mechas (curvas afinando) sobre uma calota
function hairLocks(head, o) {
  const cx = 0, cy = o.cy ?? 0.11, ax = (o.ax ?? 0.078) + 0.006, ay = (o.ay ?? 0.106) + 0.006, az = (o.az ?? 0.096) + 0.006;
  const hm = TM(o.color, { side: THREE.DoubleSide }), hc = new THREE.Color(o.color);
  const shades = [hm, TM(hc.clone().offsetHSL(0, 0, 0.05).getHex(), { side: THREE.DoubleSide }), TM(hc.clone().offsetHSL(0, 0, -0.04).getHex(), { side: THREE.DoubleSide })];
  const capG = new THREE.SphereGeometry(1, 30, 16, 0, Math.PI * 2, 0, Math.PI * (o.capA ?? 0.42)); capG.scale(ax, ay, az);
  const capM = mesh(capG, hm, cx, cy, -0.004, head); capM.rotation.x = o.capTilt ?? -0.42; ol(capM, 0.003);
  const style = o.style ?? "curto", n = o.n ?? (style === "longo" ? 96 : 56);
  const P = (th, ph, k = 1) => new THREE.Vector3(Math.sin(th) * Math.sin(ph) * ax * k, cy + Math.cos(th) * ay * k, Math.sin(th) * Math.cos(ph) * az * k);
  for (let i = 0; i < n; i++) {
    const ph = (i / n) * Math.PI * 2 + (hash(i * 3.7 + (o.seed ?? 0)) - 0.5) * 0.35;
    const front = Math.cos(ph) > 0.55, side = !front && Math.cos(ph) > -0.3;
    const th = front ? (0.12 + hash(i * 5.1) * 0.16) * Math.PI : (0.18 + hash(i * 5.1) * 0.22) * Math.PI;
    const root = P(th, ph, 0.96), nrm = root.clone().sub(new THREE.Vector3(0, cy, 0)).normalize();
    let len = (style === "longo" ? (front ? 0.09 : 0.24 + hash(i) * 0.1) : (front ? 0.075 : 0.07)) * (0.8 + hash(i * 9.3) * 0.45) * (o.len ?? 1);
    if (style === "espetado") len *= 0.8;
    // direção de penteado: franja cai pra frente/baixo, lados e nuca pra baixo
    const comb = front ? new THREE.Vector3(Math.sin(ph) * 0.4 + (hash(i) - 0.5) * 0.5, -0.75, 0.55) : style === "longo" ? new THREE.Vector3(nrm.x * 0.35, -1, Math.min(nrm.z * 0.2, 0) - 0.22) : new THREE.Vector3(nrm.x * 0.5, -1, nrm.z * 0.5);
    if (style === "espetado") comb.set(nrm.x, 0.6 + nrm.y, nrm.z);
    comb.normalize();
    const p1 = root.clone().addScaledVector(nrm, 0.018).addScaledVector(comb, len * 0.3);
    const p2 = p1.clone().addScaledVector(comb, len * 0.4).addScaledVector(nrm, front ? 0.008 : 0.004);
    const p3 = p2.clone().addScaledVector(comb, len * 0.35).add(new THREE.Vector3((hash(i * 4.4) - 0.5) * 0.02, 0, (hash(i * 6.6) - 0.5) * 0.015));
    if (front) { p2.z = Math.max(p2.z, az * 0.98); p3.z = Math.max(p3.z, az * 1.0); const yMin = cy + (o.bangY ?? 0.036); p2.y = Math.max(p2.y, yMin + 0.012); p3.y = Math.max(p3.y, yMin); }
    const w = (o.thick ?? (style === "longo" ? 0.012 : 0.016)) * (0.75 + hash(i * 2.9) * 0.5);
    if (style === "longo" && !front) { p1.addScaledVector(nrm, 0.012); p2.addScaledVector(nrm, 0.02); }
    const lm = mesh(lockGeo([root.toArray(), p1.toArray(), p2.toArray(), p3.toArray()], w, 0.0015, 0.55, 10, 7), shades[i % 3], 0, 0, 0, head);
    lm.castShadow = i % 2 === 0;
  }
  if (style === "rabo") { const pts = [[0, cy + 0.02, -az * 0.95], [0, cy - 0.02, -az * 1.25], [0, cy - 0.12, -az * 1.3], [0, cy - 0.22, -az * 1.15]]; ol(mesh(lockGeo(pts, 0.03, 0.004, 0.8, 14, 9), hm, 0, 0, 0, head), 0.003); }
}

// mão com dedos (2 falanges) e polegar; curl 0..1 fecha
function hand(wr, side, skinM, s = 1, fingers = true) {
  const h = grp(wr, 0, 0, 0); h.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; const tk = side < 0 ? -1 : 1;
  const palm = mesh(sph(1, 14, 10), skinM, 0, -0.045 * s, 0, h); palm.scale.set(0.04 * s, 0.05 * s, 0.021 * s);
  const fs = [];
  if (fingers) {
    [-0.025, -0.0085, 0.0085, 0.025].forEach((fx, i) => {
      const L = (i === 0 || i === 3 ? 0.022 : 0.027) * s;
      const k1 = grp(h, fx * s, -0.085 * s, 0.003 * s); mesh(cap(0.0085 * s, L, 3, 8), skinM, 0, -L / 2, 0, k1);
      const k2 = grp(k1, 0, -L - 0.006 * s, 0); mesh(cap(0.0078 * s, L * 0.8, 3, 8), skinM, 0, -L * 0.4, 0, k2);
      fs.push([k1, k2]);
    });
    const t1 = grp(h, tk * 0.032 * s, -0.035 * s, 0.012 * s); t1.rotation.set(0.3, 0, tk * 0.75);
    mesh(cap(0.01 * s, 0.022 * s, 3, 8), skinM, 0, -0.016 * s, 0, t1); const t2 = grp(t1, 0, -0.034 * s, 0); mesh(cap(0.009 * s, 0.018 * s, 3, 8), skinM, 0, -0.012 * s, 0, t2);
    fs.push([t1, t2]);
  } else { const mitt = mesh(sph(1, 12, 8), skinM, 0, -0.1 * s, 0.006 * s, h); mitt.scale.set(0.038 * s, 0.04 * s, 0.02 * s); }
  return { h, fs, tk };
}
function curlHand(hd, k, thumb = k) {
  hd.fs.forEach((f, i) => {
    if (i < 4) { f[0].rotation.x = -k * 1.35; f[1].rotation.x = -k * 1.5; }
    else { f[0].rotation.set(0.3 + thumb * 0.5, 0, hd.tk * (0.75 - thumb * 0.5)); f[1].rotation.x = -thumb * 0.9; }
  });
}

// boca: interior escuro que abre, lábios; sorriso por morph
function mouthRig(head, y, z, w, o = {}) {
  const g = grp(head, 0, y, z);
  const inner = mesh(sph(1, 16, 10), BM(o.inside ?? 0x2a0c10), 0, -0.002, -0.006, g); inner.scale.set(w * 0.9, 0.001, 0.012); inner.castShadow = false;
  const teeth = mesh(box(w * 1.1, 0.008, 0.01), TM(0xf4efe6), 0, 0.001, -0.004, g); teeth.visible = false;
  const lipPts = (dy, curve, smile) => [[-w, dy + smile, -0.008], [-w * 0.5, dy + curve * 0.6 + smile * 0.3, -0.001], [0, dy + curve, 0.001], [w * 0.5, dy + curve * 0.6 + smile * 0.3, -0.001], [w, dy + smile, -0.008]];
  const mkLip = (dy, curve, th) => {
    const a = lockGeo(lipPts(dy, curve, 0), th, th * 0.5, 0.6, 12, 6), b = lockGeo(lipPts(dy, curve, w * 0.45), th, th * 0.5, 0.6, 12, 6);
    a.morphAttributes.position = [b.attributes.position]; a.morphAttributes.normal = [b.attributes.normal];
    const m = mesh(a, TM(o.lip ?? 0xb05a52), 0, 0, 0, g); m.castShadow = false; return m;
  };
  const up = mkLip(0.002, 0.0015, 0.0035 * (o.lipW ?? 1)), lo = mkLip(-0.003, -0.002, 0.0045 * (o.lipW ?? 1));
  return { g, inner, teeth, up, lo, w };
}
function setMouth(m, open = 0, smile = 0) {
  m.inner.scale.y = 0.001 + open * 0.016; m.up.position.y = open * 0.004; m.lo.position.y = -open * 0.012;
  m.up.morphTargetInfluences[0] = smile; m.lo.morphTargetInfluences[0] = smile; m.teeth.visible = open > 0.15;
}

// pele do rosto humano pintada na UV da cabeça (frente em u=0.25): bochechas, sombras suaves e cicatriz opcional
const HFACE = {};
function humanFaceTex(skin, o = {}) {
  const k = skin + "_" + (o.scar ? 1 : 0) + "_" + (o.blush ?? 1); if (HFACE[k]) return HFACE[k];
  const Wd = 1024, Hd = 512, px = (ph) => (0.25 + ph / 360) * Wd, py = (th) => (th / 180) * Hd;
  const b = hex2rgb(skin), css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  return (HFACE[k] = canvasTex(Wd, Hd, (c) => {
    c.fillStyle = css(b); c.fillRect(0, 0, Wd, Hd);
    const rg = (x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, css(col, a)); g.addColorStop(1, css(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
    [-1, 1].forEach((s) => { rg(px(s * 30), py(104), 34, [235, 120, 110], 0.22 * (o.blush ?? 1)); rg(px(s * 25), py(90), 22, mixc(b, [90, 50, 60], 0.6), 0.22); });
    rg(px(0), py(80), 60, mixc(b, [255, 245, 235], 0.5), 0.18);
    rg(px(0), py(116), 30, mixc(b, [150, 80, 70], 0.5), 0.18);
    if (o.scar) { c.strokeStyle = css(mixc(b, [150, 70, 70], 0.7), 0.95); c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(px(23), py(72)); c.quadraticCurveTo(px(25), py(80), px(24.5), py(84)); c.moveTo(px(25), py(95)); c.quadraticCurveTo(px(26), py(101), px(27.5), py(107)); c.stroke(); }
  }));
}
const bandageTex = canvasTex(128, 256, (c, w, h) => { c.fillStyle = "#e8e0cc"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(150,135,110,.75)"; c.lineWidth = 3; for (let y = -w; y < h + w; y += 18) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + 24); c.stroke(); } c.fillStyle = "rgba(255,255,255,.25)"; for (let y = 0; y < h; y += 18) c.fillRect(0, y + 4, w, 4); });
// pessoa (humano original)
function pessoa(o = {}) {
  const P = { skin: SKINS.media, hair: 0x2a1a12, hairStyle: "curto", iris: 0x5a3a22, shirt: 0xd8cfbf, jacket: 0x6a4a34, pants: 0x3c3a44, boots: 0x2a1c14, belt: 0x2a1a10, fingers: true, olw: 0.0045, scale: 1, ...o };
  const S = skeleton({ ...HUMANO, ...(o.dims || {}) });
  const skinM = TM(P.skin), shirtM = TM(P.shirt), pantsM = TM(P.pants), bootM = TM(P.boots), jackM = P.jacket ? TM(P.jacket, { side: THREE.DoubleSide }) : null;
  const OL = (m, w = P.olw) => ol(m, w);
  // quadril e pernas
  OL(mesh(sph(1, 20, 14), pantsM, 0, -0.01, 0, S.hips)).scale.set(0.15, 0.11, 0.11);
  S.hipJ.forEach((hj, i) => {
    OL(mesh(lathe([[0.001, -0.45], [0.058, -0.44], [0.064, -0.3], [0.076, -0.1], [0.08, 0.0], [0.062, 0.05], [0.001, 0.065]], 18), pantsM, 0, 0, 0, hj));
    mesh(sph(0.058, 12, 10), pantsM, 0, 0, 0.004, S.knee[i]);
    OL(mesh(lathe([[0.001, -0.44], [0.05, -0.42], [0.056, -0.26], [0.062, -0.1], [0.06, 0.0], [0.001, 0.03]], 18), pantsM, 0, 0, 0, S.knee[i]));
    const bt = OL(mesh(lathe([[0.001, -0.05], [0.06, -0.05], [0.066, 0.0], [0.066, 0.12], [0.07, 0.17], [0.001, 0.17]], 16), bootM, 0, 0, 0, S.ankle[i]));
    const foot = OL(mesh(cap(0.055, 0.13, 4, 12), bootM, 0, -0.035, 0.065, S.ankle[i])); foot.rotation.x = Math.PI / 2; foot.scale.set(1, 1, 0.75);
  });
  // tronco: abdômen e peito em torno (lathe), jaqueta aberta na frente
  const abd = OL(mesh(lathe([[0.001, -0.06], [0.13, -0.06], [0.132, 0.05], [0.128, 0.13], [0.132, 0.21], [0.001, 0.21]], 26), shirtM, 0, 0, 0, S.spine)); abd.scale.z = 0.74;
  const chestPts = [[0.001, -0.02], [0.13, -0.02], [0.152, 0.06], [0.168, 0.15], [0.166, 0.22], [0.14, 0.27], [0.08, 0.305], [0.001, 0.31]];
  const ch = OL(mesh(lathe(chestPts, 28), shirtM, 0, 0, 0, S.chest)); ch.scale.z = 0.7;
  if (jackM) {
    const open = P.jacketOpen ?? 0.42;
    const jc = mesh(lathe(chestPts.map(([r, y]) => [r * 1.08 + 0.004, y]), 28, open, Math.PI * 2 - open * 2), jackM, 0, 0, 0, S.chest); jc.scale.z = 0.74; OL(jc);
    const ja = mesh(lathe([[0.142, -0.06], [0.142, 0.05], [0.14, 0.13], [0.145, 0.21]], 26, open, Math.PI * 2 - open * 2), jackM, 0, 0, 0, S.spine); ja.scale.z = 0.78; OL(ja);
    const hem = mesh(lathe([[0.152, -0.02], [0.17, -0.1], [0.185, -0.17]], 26, open * 1.3, Math.PI * 2 - open * 2.6), jackM, 0, 0.04, 0, S.hips); hem.scale.z = 0.82; OL(hem);
    const col = mesh(new THREE.TorusGeometry(0.075, 0.022, 8, 20, Math.PI * 1.5), jackM, 0, 0.29, -0.006, S.chest); col.rotation.set(Math.PI / 2, 0, Math.PI * 0.25 + Math.PI / 2); col.scale.set(1, 0.85, 1);
  }
  const belt = mesh(new THREE.TorusGeometry(0.135, 0.018, 6, 26), TM(P.belt), 0, 0.05, 0, S.hips); belt.rotation.x = Math.PI / 2; belt.scale.set(1, 0.78, 1);
  mesh(box(0.05, 0.035, 0.012), TM(0xb89a5a), 0, 0.05, 0.108, S.hips);
  // braços
  const armM = jackM || shirtM;
  const hands = S.sh.map((sh, i) => {
    mesh(sph(0.056, 14, 10), armM, 0, -0.012, 0, sh);
    OL(mesh(lathe([[0.001, -0.3], [0.045, -0.29], [0.049, -0.2], [0.053, -0.08], [0.057, 0.0], [0.04, 0.04], [0.001, 0.05]], 16), armM, 0, 0, 0, sh));
    mesh(sph(0.044, 10, 8), armM, 0, 0, 0, S.el[i]);
    OL(mesh(lathe([[0.001, -0.235], [0.04, -0.228], [0.043, -0.15], [0.046, -0.05], [0.047, 0.0], [0.001, 0.03]], 16), P.bandages ? TM(0xffffff, { map: bandageTex }) : armM, 0, 0, 0, S.el[i]));
    mesh(cyl(0.05, 0.048, 0.04, 14), TM(P.cuff ?? P.shirt), 0, -0.225, 0, S.el[i]);
    return hand(S.wr[i], i ? 1 : -1, skinM, 1, P.fingers);
  });
  // pescoço e cabeça
  OL(mesh(cyl(0.041, 0.047, 0.1, 14), skinM, 0, 0.03, 0, S.neck));
  const nl = mesh(new THREE.TorusGeometry(0.05, 0.014, 6, 18), shirtM, 0, 0.3, 0.004, S.chest); nl.rotation.x = Math.PI / 2 - 0.25;
  const hg = headGeo({ sx: 0.081, sy: 0.104, sz: 0.097, jaw: 0.22, chin: 0.07, cheek: 0.07, ...(P.headShape || {}) });
  const headM = mesh(hg, TM(0xffffff, { map: humanFaceTex(P.skin, { scar: P.scar, blush: P.blush }) }), 0, 0, 0); ol(headM, P.olw * 0.9);
  const zAt = (x, y) => surfZ(headM, x, y);
  S.head.add(headM);
  const ex = 0.031, ey = 0.117, er = 0.0148;
  const eyes = [-1, 1].map((k) => eye(S.head, k * ex, ey, zAt(k * ex, ey) - er * 0.62, er, { iris: P.iris, skin: P.skin }));
  const brows = [-1, 1].map((k) => {
    const b = grp(S.head, k * 0.031, 0.142, zAt(k * 0.031, 0.142) + 0.002);
    mesh(lockGeo([[-k * 0.019, -0.003, -0.004], [-k * 0.004, 0.001, 0], [k * 0.017, 0.0, -0.006]], 0.0042, 0.0016, 0.5, 8, 6), TM(P.brow ?? P.hair), 0, 0, 0, b).castShadow = false;
    return b;
  });
  const nz = zAt(0, 0.086);
  const nose = mesh(sph(1, 14, 10), skinM, 0, 0.088, nz + 0.004, S.head); nose.scale.set(0.012, 0.016, 0.014);
  mesh(cap(0.007, 0.03, 3, 8), skinM, 0, 0.104, zAt(0, 0.104) - 0.002, S.head).rotation.x = -0.25;
  [-1, 1].forEach((k) => { const ear = mesh(sph(1, 12, 10), skinM, k * 0.077, 0.108, -0.008, S.head); ear.scale.set(0.012, 0.026, 0.017); });
  const mouth = mouthRig(S.head, 0.058, zAt(0, 0.058) - 0.003, 0.021, { lip: P.lip ?? 0xa85a50 });
  if (P.hairStyle !== "careca") hairLocks(S.head, { color: P.hair, style: P.hairStyle, seed: P.seed ?? 0, len: P.hairLen ?? 1 });
  if (P.beard) { const bd = mesh(sph(1, 18, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), TM(P.beard), 0, 0.075, 0.008, S.head); bd.scale.set(0.074, 0.09, 0.09); }
  // gola alta
  if (P.collar === "alta" && jackM) { const cl = mesh(lathe([[0.066, 0.245], [0.07, 0.31], [0.074, 0.37], [0.078, 0.395]], 24, 0.45, Math.PI * 2 - 0.9), jackM, 0, 0, -0.004, S.chest); cl.scale.z = 0.92; OL(cl); }
  // cachecol com pontas que balançam
  let scarfTails = [];
  if (P.scarf) { const sm2 = TM(P.scarf, { side: THREE.DoubleSide }); const sr = mesh(new THREE.TorusGeometry(0.064, 0.026, 8, 22), sm2, 0, 0.3, 0.004, S.chest); sr.rotation.x = Math.PI / 2 - 0.2; OL(sr);
    scarfTails = [-1, 1].map((k) => { const tg = new THREE.PlaneGeometry(0.07, 0.36, 2, 8); tg.translate(0, -0.18, 0); const tl = mesh(tg, sm2, 0.03 * k + 0.02, 0.29, 0.07, S.chest); tl.rotation.set(-0.15, 0, 0.12 * k); tl.userData.base = Float32Array.from(tg.attributes.position.array); tl.frustumCulled = false; return tl; }); }
  // tapa-olho (olho esquerdo) que pode ser levantado
  let patch = null;
  if (P.eyepatch) { patch = grp(S.head, ex, ey + 0.021, zAt(ex, ey + 0.021) + 0.001); const pm = mesh(sph(1, 16, 12), TM(0x1c1612), 0, -0.021, 0.004, patch); pm.scale.set(0.026, 0.022, 0.011); OL(pm, 0.003);
    const strap = mesh(new THREE.TorusGeometry(0.094, 0.0034, 6, 40), TM(0x1c1612), 0, ey + 0.02, -0.004, S.head); strap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-0.62, -0.77, 0.14).normalize()); }
  // abas do casaco atrás (tecido)
  let tails = [];
  if (P.coatTail && jackM) tails = [-1, 1].map((k) => { const tg = new THREE.PlaneGeometry(0.15, 0.5, 3, 10); tg.translate(0, -0.25, 0); const tl = mesh(tg, jackM, 0.075 * k, -0.06, -0.13, S.hips); tl.rotation.x = 0.12; tl.userData.base = Float32Array.from(tg.attributes.position.array); tl.frustumCulled = false; return tl; });
  // capa opcional (tecido que balança)
  let cloak = null;
  if (P.cloak) {
    const cg = new THREE.PlaneGeometry(0.46, 1.0, 8, 14); cg.translate(0, -0.5, 0);
    cloak = mesh(cg, TM(P.cloak, { side: THREE.DoubleSide }), 0, 0.27, -0.13, S.chest); cloak.userData.base = Float32Array.from(cg.attributes.position.array); cloak.frustumCulled = false;
  }
  S.root.scale.setScalar(P.scale);
  shadows(S.root);
  S.root.userData = { ...S, eyes, brows, mouth, hands, cloak, P, headM, kind: "pessoa", patch, tails, scarfTails };
  restPose(S.root);
  return S.root;
}

// ---------------------------------------------------------------- poses e animação
function restPose(p) {
  const u = p.userData;
  u.hips.position.set(0, u.d.hipY, 0); u.hips.rotation.set(0, 0, 0);
  [u.spine, u.chest, u.neck, u.head].forEach((g) => g.rotation.set(0, 0, 0));
  u.sh.forEach((s, i) => s.rotation.set(0, 0, (i ? 1 : -1) * 0.07)); u.el.forEach((e) => e.rotation.set(-0.12, 0, 0)); u.wr.forEach((w) => w.rotation.set(0, 0, 0));
  u.hipJ.forEach((h) => h.rotation.set(0, 0, 0)); u.knee.forEach((k) => k.rotation.set(0, 0, 0)); u.ankle.forEach((a) => a.rotation.set(0, 0, 0));
  if (u.hands) u.hands.forEach((h) => curlHand(h, 0.25, 0.2));
  if (u.kind === "gigante") { u.spine.rotation.x = 0.1; u.neck.rotation.x = 0.16; u.head.rotation.x = -0.06; u.sh.forEach((s) => (s.rotation.x = -0.1)); u.el.forEach((e) => (e.rotation.x = -0.32)); u.knee.forEach((k) => (k.rotation.x = 0.1)); u.hipJ.forEach((h) => (h.rotation.x = -0.05)); }
  if (u.eyes) u.eyes.forEach((e) => setEye(e, 1));
  if (u.mouth) setMouth(u.mouth, 0, 0);
  if (u.chest.userData.sc0 == null) u.chest.userData.sc0 = u.chest.scale.clone();
}
// aplica uma pose: { hips:[x,y,z] (rotação), hipsPos:[dx,dy,dz], spine, chest, neck, head, armR:[shx,shy,shz,el], armL, legR:[hx,hy,hz,kn,an], legL, handR, handL }
function pose(p, q, k = 1) {
  const u = p.userData, R = (g, a) => { if (a) g.rotation.set(lerp(g.rotation.x, a[0], k), lerp(g.rotation.y, a[1] || 0, k), lerp(g.rotation.z, a[2] || 0, k)); };
  if (q.hipsPos) u.hips.position.set(lerp(u.hips.position.x, q.hipsPos[0], k), lerp(u.hips.position.y, u.d.hipY + q.hipsPos[1], k), lerp(u.hips.position.z, q.hipsPos[2], k));
  R(u.hips, q.hips); R(u.spine, q.spine); R(u.chest, q.chest); R(u.neck, q.neck); R(u.head, q.head);
  [["armR", 0], ["armL", 1]].forEach(([n, i]) => { const a = q[n]; if (!a) return; R(u.sh[i], [a[0], a[1], a[2]]); u.el[i].rotation.x = lerp(u.el[i].rotation.x, a[3] ?? -0.12, k); if (a[4] != null) R(u.wr[i], [a[4], a[5] || 0, a[6] || 0]); });
  [["legR", 0], ["legL", 1]].forEach(([n, i]) => { const a = q[n]; if (!a) return; R(u.hipJ[i], [a[0], a[1], a[2]]); u.knee[i].rotation.x = lerp(u.knee[i].rotation.x, a[3] ?? 0, k); u.ankle[i].rotation.x = lerp(u.ankle[i].rotation.x, a[4] ?? 0, k); });
  if (u.hands) { if (q.handR != null) curlHand(u.hands[0], q.handR); if (q.handL != null) curlHand(u.hands[1], q.handL); }
}
// respiração, piscadas e olhar vivo
function idle(p, t, seed = 0, amt = 1) {
  const u = p.userData, b = Math.sin(t * 1.7 + seed);
  const s0 = u.chest.userData.sc0 || new THREE.Vector3(1, 1, 1);
  u.chest.scale.set(s0.x * (1 + b * 0.012 * amt), s0.y * (1 + b * 0.006 * amt), s0.z * (1 + b * 0.02 * amt));
  u.chest.rotation.x += b * 0.012 * amt;
  u.spine.rotation.z += fbm1(t * 0.3 + seed) * 0.03 * amt;
  u.head.rotation.y += fbm1(t * 0.4 + seed * 3) * 0.12 * amt; u.head.rotation.x += fbm1(t * 0.35 + seed * 5) * 0.05 * amt;
  if (u.eyes) {
    const ph = (t + hash(seed) * 4) % 3.9, bl = ph < 0.16 ? Math.sin((ph / 0.16) * Math.PI) : 0;
    const sacc = Math.floor(t * 1.3 + seed), yaw = (hash(sacc * 1.7 + seed) - 0.5) * 0.35 * amt, pit = (hash(sacc * 2.3 + seed) - 0.5) * 0.15 * amt;
    u.eyes.forEach((e) => setEye(e, (u.lidOpen ?? 1) * (1 - bl), yaw + (u.eyeYaw || 0), pit + (u.eyePitch || 0)));
  }
}
// ciclo de caminhada (fase em ciclos; amt = amplitude). Velocidade do corpo ≈ passada * cadência.
function walk(p, ph, amt = 1, o = {}) {
  const u = p.userData, a = ph * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
  const A = 0.42 * amt * (o.stride ?? 1);
  const thR = -s * A, thL = s * A;
  const knR = (0.06 + 0.95 * Math.pow(Math.max(0, c), 1.5) + 0.12 * Math.max(0, -s)) * amt, knL = (0.06 + 0.95 * Math.pow(Math.max(0, -c), 1.5) + 0.12 * Math.max(0, s)) * amt;
  u.hipJ[0].rotation.set(thR - (o.lean ?? 0) * 0.3, 0, -0.02); u.hipJ[1].rotation.set(thL - (o.lean ?? 0) * 0.3, 0, 0.02);
  u.knee[0].rotation.x = knR; u.knee[1].rotation.x = knL;
  u.ankle[0].rotation.x = -(thR + knR) * 0.75 + 0.1 * Math.max(0, c) * amt; u.ankle[1].rotation.x = -(thL + knL) * 0.75 + 0.1 * Math.max(0, -c) * amt;
  u.hips.position.y = u.d.hipY + (Math.cos(2 * a) * 0.022 - 0.012) * amt * (o.bob ?? 1);
  u.hips.rotation.set(o.lean ?? 0, s * 0.09 * amt, c * 0.03 * amt);
  u.chest.rotation.y = -s * 0.12 * amt; u.spine.rotation.x = (o.lean ?? 0) * 0.5;
  const arm = 0.36 * amt * (o.arms ?? 1);
  u.sh[0].rotation.set(s * arm, 0, -0.07 - 0.03 * amt); u.sh[1].rotation.set(-s * arm, 0, 0.07 + 0.03 * amt);
  u.el[0].rotation.x = -0.25 - 0.25 * Math.max(0, -s) * amt; u.el[1].rotation.x = -0.25 - 0.25 * Math.max(0, s) * amt;
  u.head.rotation.y = s * 0.06 * amt;
}
function run(p, ph, amt = 1) {
  const u = p.userData, a = ph * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
  const thR = -s * 0.75 * amt - 0.15 * amt, thL = s * 0.75 * amt - 0.15 * amt;
  u.hipJ[0].rotation.set(thR, 0, -0.02); u.hipJ[1].rotation.set(thL, 0, 0.02);
  u.knee[0].rotation.x = (0.25 + 1.5 * Math.pow(Math.max(0, c), 1.2)) * amt; u.knee[1].rotation.x = (0.25 + 1.5 * Math.pow(Math.max(0, -c), 1.2)) * amt;
  u.ankle[0].rotation.x = 0.3 * c * amt; u.ankle[1].rotation.x = -0.3 * c * amt;
  u.hips.position.y = u.d.hipY + (Math.abs(Math.cos(a)) * 0.05 - 0.04) * amt;
  u.hips.rotation.set(0.12 * amt, s * 0.12 * amt, 0); u.spine.rotation.x = 0.12 * amt; u.chest.rotation.y = -s * 0.18 * amt;
  u.sh[0].rotation.set(s * 0.8 * amt, 0, -0.12); u.sh[1].rotation.set(-s * 0.8 * amt, 0, 0.12);
  u.el[0].rotation.x = -1.35 * amt; u.el[1].rotation.x = -1.35 * amt;
  if (u.hands) u.hands.forEach((h) => curlHand(h, 0.75));
}
// cabeça (pescoço + cabeça) olhando para um ponto do mundo
function lookAtW(p, target, k = 1, maxYaw = 1.1) {
  const u = p.userData; p.updateMatrixWorld(true);
  const loc = u.neck.worldToLocal(_v1.copy(target));
  const yaw = clamp(Math.atan2(loc.x, loc.z), -maxYaw, maxYaw), pit = clamp(-Math.atan2(loc.y - 0.12 * (u.d.headS ?? 1), Math.hypot(loc.x, loc.z)), -0.7, 0.6);
  u.neck.rotation.y = lerp(u.neck.rotation.y, yaw * 0.45, k); u.head.rotation.y = lerp(u.head.rotation.y, yaw * 0.55, k);
  u.neck.rotation.x = lerp(u.neck.rotation.x, pit * 0.4, k); u.head.rotation.x = lerp(u.head.rotation.x, pit * 0.6, k);
}
// IK de 2 ossos: ombro/cotovelo (sign -1) ou quadril/joelho (sign +1) até um alvo no mundo, dobrando para o polo
function ik2(S, El, L1, L2, target, pole, sign = -1, k = 1) {
  const par = S.parent; par.updateMatrixWorld(true);
  const o = S.position, T_ = par.worldToLocal(_v1.copy(target)), Pp = par.worldToLocal(_v2.copy(pole));
  const dir = _v3.copy(T_).sub(o); let d = dir.length(); d = clamp(d, Math.abs(L1 - L2) + 1e-4, L1 + L2 - 1e-4); dir.normalize();
  const cosA = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1), A = Math.acos(cosA);
  const cosE = clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1), flex = Math.PI - Math.acos(cosE);
  const pv = Pp.sub(o); const n = pv.addScaledVector(dir, -pv.dot(dir)).normalize();
  const uu = dir.clone().multiplyScalar(Math.cos(A)).addScaledVector(n, Math.sin(A));
  let z = dir.clone().addScaledVector(uu, -dir.dot(uu)); if (z.lengthSq() < 1e-8) z.copy(n).negate(); z.normalize(); if (sign > 0) z.negate();
  const y = uu.clone().negate(), x = new THREE.Vector3().crossVectors(y, z).normalize(); z.crossVectors(x, y);
  _m4.makeBasis(x, y, z); _q1.setFromRotationMatrix(_m4);
  if (k >= 1) S.quaternion.copy(_q1); else S.quaternion.slerp(_q1, k);
  El.rotation.set(lerp(El.rotation.x, sign * flex, k), 0, 0);
}
function armIK(p, i, target, pole, k = 1) { const u = p.userData; ik2(u.sh[i], u.el[i], u.d.upper, u.d.fore + 0.07, target, pole, -1, k); }
function legIK(p, i, target, pole, k = 1) { const u = p.userData; ik2(u.hipJ[i], u.knee[i], u.d.thigh, u.d.shin + 0.05, target, pole, 1, k); }
// expressão: sorriso, boca aberta, sobrancelhas (bravo < 0 < surpreso), pálpebras
function face(p, f = {}) {
  const u = p.userData;
  if (u.mouth) setMouth(u.mouth, f.open ?? 0, f.smile ?? 0);
  if (u.brows) u.brows.forEach((b, i) => { const k = i ? 1 : -1; b.position.y = 0.142 + (f.brow ?? 0) * 0.006; b.rotation.z = k * ((f.angry ?? 0) * 0.35 - (f.sad ?? 0) * 0.3); });
  if (f.lid != null) u.lidOpen = f.lid;
}
// sentado no chão / ajoelhado
function sitPose(p, k = 1, o = {}) {
  const u = p.userData;
  pose(p, { hipsPos: [0, -(u.d.hipY - (o.seatY ?? 0.18)), 0], legR: [-1.45, 0.12, -0.05, 1.5, -0.2], legL: [-1.45, -0.12, 0.05, 1.5, -0.2], spine: [o.lean ?? -0.12, 0, 0] }, k);
}
function kneelPose(p, k = 1) {
  const u = p.userData;
  pose(p, { hipsPos: [0, -(u.d.thigh + 0.02), -0.15], legR: [0.1, 0, 0, 1.6, 0.6], legL: [0.1, 0, 0, 1.6, 0.6], spine: [0.35, 0, 0], chest: [0.15, 0, 0], neck: [0.25, 0, 0] }, k);
}
// tapa-olho: 0 = cobrindo, 1 = levantado na testa
function liftPatch(p, k) { const pt = p.userData.patch; if (pt) pt.rotation.x = -k * 2.1; }
// capa balançando ao vento
function clothWind(p, t, wind = 1) {
  const u = p.userData;
  [...(u.tails || []), ...(u.scarfTails || [])].forEach((m, j) => { const a = m.geometry.attributes.position, b = m.userData.base; for (let i = 0; i < a.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], k = -y * 2; a.setXYZ(i, x + Math.sin(t * 3.1 + y * 6 + j) * 0.012 * k * wind, y + k * k * 0.01 * wind, b[i * 3 + 2] - k * k * 0.05 * wind - Math.sin(t * 4.3 + x * 9 + y * 7 + j * 2) * 0.03 * k * wind); } a.needsUpdate = true; m.geometry.computeVertexNormals(); });
  cloakWind(p, t, wind);
}
function cloakWind(p, t, wind = 1) {
  const c = p.userData.cloak; if (!c) return;
  const a = c.geometry.attributes.position, b = c.userData.base;
  for (let i = 0; i < a.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], k = -y; a.setXYZ(i, x + Math.sin(t * 2.3 + y * 4) * 0.02 * k * wind, y, b[i * 3 + 2] - k * k * 0.12 * wind - Math.sin(t * 3.1 + x * 6 + y * 5) * 0.04 * k * wind); }
  a.needsUpdate = true; c.geometry.computeVertexNormals();
}

// ---------------------------------------------------------------- material holográfico (raio-X)
const HOLO_T = { value: 0 };
function holoMat(color = 0x5ad8ff, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uT: HOLO_T, uA: { value: o.alpha ?? 1 } },
    vertexShader: "varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vV = -mv.xyz; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform vec3 uC; uniform float uT, uA; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); float sl = 0.65 + 0.35 * step(0.5, fract(vW.y * 6.0 - uT * 1.5)); gl_FragColor = vec4(uC * (0.06 + f * 1.6) * sl * uA, 1.0); }",
    transparent: true, depthWrite: false, blending: ADD, side: THREE.DoubleSide,
  });
}
function holoify(obj, mat) { obj.traverse((c) => { if (c.isMesh) { if (c.userData.isOutline) c.visible = false; else { c.material = mat; c.castShadow = false; c.receiveShadow = false; } } }); return obj; }

// ---------------------------------------------------------------- gigante (criatura original: pele pálida manchada, pano na cintura, sorriso vazio)
const GIG = { hipY: 0.9, spine: 0.1, chest: 0.21, neckY: 0.265, headY: 0.012, shW: 0.21, shY: 0.24, upper: 0.36, fore: 0.33, hipW: 0.1, thigh: 0.4, shin: 0.42, headS: 1.58 };
const GTEX = {};
function giantSkinTex(base, seed = 0) {
  const k = base + "_" + seed; if (GTEX[k]) return GTEX[k];
  const b = hex2rgb(base), dark = mixc(b, [150, 70, 60], 0.35), pale = mixc(b, [255, 240, 230], 0.25);
  GTEX[k] = texPair(512, (u, v) => fbm2(u * 8 + seed, v * 8, 4, 8) * 0.7 + fbm2(u * 32, v * 32 + seed, 3, 32) * 0.3,
    (u, v, h) => { const bl = fbm2(u * 4 + 7 + seed, v * 4 + 3, 4, 4); let c = mixc(b, dark, clamp((bl - 0.5) * 2.4)); c = mixc(c, pale, clamp((0.45 - bl) * 2)); const vein = Math.abs(fbm2(u * 6 + seed, v * 6 + 9, 4, 6) - 0.5) < 0.012 ? 0.12 : 0; c = mixc(c, [130, 120, 160], vein); return mixc(c, [0, 0, 0], (0.5 - h) * 0.12); }, 2.2, { rep: [2, 2] });
  return GTEX[k];
}
// rosto pintado (UV da esfera: frente em u=0.25): sombras dos olhos, nariz, vincos, sorriso com dentes; open 0..1
const GFACE = {};
function giantFaceTex(base, open = 0, o = {}) {
  const k = base + "_" + open + "_" + (o.sleep ? 1 : 0) + "_" + (o.wide ?? 1); if (GFACE[k]) return GFACE[k];
  const Wd = 2048, Hd = 1024, px = (ph) => (0.25 + ph / 360) * Wd, py = (th) => (th / 180) * Hd;
  const b = hex2rgb(base), css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  return (GFACE[k] = canvasTex(Wd, Hd, (c) => {
    c.fillStyle = css(b); c.fillRect(0, 0, Wd, Hd);
    for (let i = 0; i < 900; i++) { const r = 6 + hash(i * 3.1) * 40; c.fillStyle = css(mixc(b, hash(i) > 0.5 ? [170, 80, 70] : [255, 236, 222], 0.5), 0.05 + hash(i * 7) * 0.06); c.beginPath(); c.arc(hash(i * 5.3) * Wd, hash(i * 9.7) * Hd, r, 0, 7); c.fill(); }
    const rg = (x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, css(col, a)); g.addColorStop(1, css(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
    // olheiras e sombra da testa sobre os olhos
    [-1, 1].forEach((s) => { rg(px(s * 25), py(86), 95, [90, 40, 44], 0.42); rg(px(s * 25), py(92), 70, [120, 50, 60], 0.25); rg(px(s * 33), py(108), 90, [220, 110, 100], 0.18); });
    rg(px(0), py(70), 160, [255, 240, 230], 0.12);
    // rugas da testa
    c.strokeStyle = css(mixc(b, [90, 50, 50], 0.6), 0.35); c.lineWidth = 3;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(px(-26), py(66 + i * 3.2)); c.quadraticCurveTo(px(0), py(64.5 + i * 3.2), px(26), py(66 + i * 3.2)); c.stroke(); }
    // sobrancelhas ralas
    c.strokeStyle = css([70, 46, 36], 0.75); c.lineWidth = 2.5;
    [-1, 1].forEach((s) => { for (let i = 0; i < 26; i++) { const u = i / 25, ph = s * (14 + u * 22), th = 77 - Math.sin(u * Math.PI) * 2.2 + (hash(i * 3 + s) - 0.5); c.beginPath(); c.moveTo(px(ph), py(th + 1.2)); c.lineTo(px(ph + s * 2.4), py(th - 0.6)); c.stroke(); } });
    // nariz: luz no dorso, sombras nas laterais, narinas suaves
    const ng = c.createLinearGradient(px(-7), 0, px(7), 0); ng.addColorStop(0, css([150, 80, 70], 0.0)); ng.addColorStop(0.3, css([150, 80, 70], 0.28)); ng.addColorStop(0.5, css([255, 240, 228], 0.25)); ng.addColorStop(0.7, css([150, 80, 70], 0.28)); ng.addColorStop(1, css([150, 80, 70], 0.0));
    c.fillStyle = ng; c.fillRect(px(-7), py(86), px(7) - px(-7), py(103) - py(86));
    [-1, 1].forEach((s) => { c.fillStyle = css([90, 36, 36], 0.55); c.beginPath(); c.ellipse(px(s * 4.2), py(104.5), 13, 7, s * 0.4, 0, 7); c.fill(); rg(px(s * 8), py(102), 26, [160, 80, 72], 0.4); });
    // vincos do sorriso
    const W_ = o.wide ?? 1, cx0 = 40 * W_, cth = o.sleep ? 121 : 114;
    c.strokeStyle = css([110, 50, 50], 0.45); c.lineWidth = 5;
    [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(px(s * 10), py(103)); c.quadraticCurveTo(px(s * (cx0 - 6)), py(104), px(s * (cx0 + 3)), py(cth + 1)); c.stroke(); });
    // boca: lábios, interior escuro, dentes
    const up = (u) => py(cth + (1 - u * u) * 8.5), lo = (u) => py(cth + (1 - u * u) * (9.5 + open * 9 + (o.sleep ? -6 : 0)) + 1.5 + open * 2);
    const N = 40, P = (f) => { const pts = []; for (let i = 0; i <= N; i++) { const u = i / N * 2 - 1; pts.push([px(u * cx0), f(Math.abs(u))]); } return pts; };
    const pu = P(up), pl = P(lo);
    c.fillStyle = css([36, 8, 12], 1); c.beginPath(); pu.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); pl.slice().reverse().forEach(([x, y]) => c.lineTo(x, y)); c.closePath(); c.fill();
    if (!o.sleep) {
      c.save(); c.clip();
      const tooth = (x, y, w, h, dir) => { const g = c.createLinearGradient(0, y, 0, y + h * dir); g.addColorStop(0, "#fffaf0"); g.addColorStop(1, "#c8b898"); c.fillStyle = g; c.beginPath(); c.roundRect(x - w / 2, Math.min(y, y + h * dir), w, h, 5); c.fill(); };
      const nt = 18;
      for (let i = 0; i < nt; i++) { const u = (i + 0.5) / nt * 2 - 1, x = px(u * cx0 * 0.97), y = up(Math.abs(u)) - 4, w = (px(cx0) - px(-cx0)) / nt * 0.9; tooth(x, y, w, 30 - Math.abs(u) * 10, 1); }
      for (let i = 0; i < nt - 2; i++) { const u = (i + 0.5) / (nt - 2) * 2 - 1, x = px(u * cx0 * 0.9), y = lo(Math.abs(u)) + 4, w = (px(cx0) - px(-cx0)) / nt * 0.85; tooth(x, y, w, 18 + open * 8 - Math.abs(u) * 6, -1); }
      c.restore();
    }
    c.lineWidth = 9; c.strokeStyle = css([176, 96, 92], 1); c.beginPath(); pu.forEach(([x, y], i) => (i ? c.lineTo(x, y - 3) : c.moveTo(x, y - 3))); c.stroke();
    c.lineWidth = 12; c.strokeStyle = css([186, 106, 100], 1); c.beginPath(); pl.forEach(([x, y], i) => (i ? c.lineTo(x, y + 4) : c.moveTo(x, y + 4))); c.stroke();
    c.lineWidth = 3; c.strokeStyle = css([255, 210, 200], 0.5); c.beginPath(); pl.forEach(([x, y], i) => (i ? c.lineTo(x, y + 8) : c.moveTo(x, y + 8))); c.stroke();
    rg(px(0), py(cth + 22), 70, [140, 70, 66], 0.3);
  }));
}
function gigante(o = {}) {
  const v = o.tipo ?? "careca";
  const D = { ...GIG, ...(v === "magro" ? { hipY: 1.02, upper: 0.42, fore: 0.4, thigh: 0.46, shin: 0.48, shW: 0.19, neckY: 0.31, headS: 1.25 } : v === "gordo" ? { hipY: 0.78, thigh: 0.34, shin: 0.36, hipW: 0.13, shW: 0.25, upper: 0.32, fore: 0.3, headS: 1.6 } : {}), ...(o.dims || {}) };
  const S = skeleton(D), hs = D.headS, fat = v === "gordo" ? 1.35 : v === "magro" ? 0.74 : 1;
  const tx = giantSkinTex(o.skin ?? 0xe6b49a, o.seed ?? 0);
  const skinM = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tx.map, normalMap: tx.normalMap, normalScale: new THREE.Vector2(1.0, 1.0), roughness: 0.55, emissive: 0x4a1008, emissiveIntensity: 0.28 });
  const L = (prof, parent, y = 0, segs = 26) => mesh(lathe(prof.map(([r, yy]) => [Math.max(0.0008, r), yy]), segs), skinM, 0, y, 0, parent);
  // quadril, pano (com dobras) e pernas musculosas
  mesh(sph(1, 24, 18), skinM, 0, -0.01, 0, S.hips).scale.set(0.175 * fat, 0.14, 0.135 * fat);
  const clothM = new THREE.MeshStandardMaterial({ color: o.cloth ?? 0x6b5a48, roughness: 0.95, side: THREE.DoubleSide });
  const skirt = lathe([[0.18 * fat, 0.07], [0.188 * fat, -0.02], [0.205 * fat, -0.15], [0.212 * fat, -0.22]], 48);
  deform(skirt, (q) => { const a = Math.atan2(q.x, q.z), k = clamp((0.07 - q.y) / 0.29); const f = 1 + Math.sin(a * 9) * 0.05 * k; q.x *= f; q.z *= f * 0.86; if (Math.abs(Math.sin(a)) > 0.8) q.y += k * 0.06; });
  mesh(skirt, clothM, 0, 0, 0, S.hips);
  const rope = mesh(new THREE.TorusGeometry(0.182 * fat, 0.013, 6, 30), SM(0x4a3a2a), 0, 0.065, 0, S.hips); rope.rotation.x = Math.PI / 2; rope.scale.set(1, 0.86, 1);
  const T_ = D.thigh, Sh = D.shin;
  S.hipJ.forEach((hj, i) => {
    L([[0.001, -T_ - 0.07], [0.05 * fat, -T_ - 0.05], [0.062 * fat, -T_ - 0.01], [0.074 * fat, -T_ * 0.8], [0.094 * fat, -T_ * 0.4], [0.1 * fat, -T_ * 0.15], [0.092 * fat, 0.03], [0.05, 0.085], [0.001, 0.1]], hj);
    L([[0.001, -Sh - 0.03], [0.042 * fat, -Sh], [0.046 * fat, -Sh * 0.8], [0.066 * fat, -Sh * 0.38], [0.068 * fat, -Sh * 0.18], [0.06 * fat, 0.0], [0.05 * fat, 0.05], [0.001, 0.08]], S.knee[i]);
    mesh(sph(0.05 * fat, 14, 10), skinM, 0, -Sh * 0.3, -0.03 * fat, S.knee[i]).scale.set(1, 1.6, 1);
    const ft = mesh(cap(0.058, 0.16, 4, 14), skinM, 0, -0.03, 0.07, S.ankle[i]); ft.rotation.x = Math.PI / 2; ft.scale.set(1.2, 1, 0.6);
    mesh(sph(0.048, 12, 10), skinM, 0, -0.01, -0.01, S.ankle[i]);
    for (let k = 0; k < 5; k++) mesh(sph(0.019 - k * 0.0016, 8, 6), skinM, (k - 2) * 0.023 * (i ? -1 : 1), -0.052, 0.168 - Math.abs(k - 1.5) * 0.008, S.ankle[i]);
  });
  // tronco: abdômen, peito largo, trapézio e ombros que se fundem aos braços
  const abd = L([[0.001, -0.07], [0.155 * fat, -0.07], [0.165 * fat, 0.03], [0.152 * fat, 0.12], [0.155 * (v === "magro" ? 0.8 : 1), 0.22], [0.001, 0.22]], S.spine, 0, 30); abd.scale.z = 0.78;
  if (v === "gordo") { mesh(sph(0.21, 28, 20), skinM, 0, 0.03, 0.07, S.spine).scale.set(1.05, 0.95, 0.9); mesh(sph(0.009, 8, 6), SM(0x8a5048), 0, 0.02, 0.258, S.spine); }
  const cw = v === "magro" ? 0.84 : 1;
  const ch = L([[0.001, -0.03], [0.152 * cw, -0.03], [0.172 * cw, 0.07], [0.195 * cw, 0.16], [0.19 * cw, 0.22], [0.165 * cw, 0.27], [0.1, 0.305], [0.001, 0.315]], S.chest, 0, 30); ch.scale.z = 0.72;
  [-1, 1].forEach((k) => {
    mesh(sph(0.088, 18, 12), skinM, k * 0.07 * cw, 0.175, 0.058 * cw, S.chest).scale.set(1.45, 0.7, 0.3);
    mesh(sph(0.075, 16, 12), skinM, k * 0.095, 0.29, -0.015, S.chest).scale.set(1.35, 0.75, 0.95);
    mesh(sph(0.09, 16, 12), skinM, k * 0.08, 0.12, -0.075, S.chest).scale.set(1.1, 1.3, 0.55);
  });
  if (v === "magro") for (let r = 0; r < 4; r++) { const rib = mesh(new THREE.TorusGeometry(0.14, 0.006, 5, 24, Math.PI * 0.9), skinM, 0, 0.03 + r * 0.045, 0.0, S.chest); rib.rotation.set(Math.PI / 2, 0, Math.PI * 0.05); rib.scale.set(1, 0.72, 1); }
  // braços e mãos grandes
  const U = D.upper, F = D.fore;
  const hands = S.sh.map((sh, i) => {
    mesh(sph(0.082 * fat, 18, 14), skinM, 0, -0.012, 0, sh).scale.set(1, 1.05, 0.95);
    L([[0.001, -U - 0.06], [0.036 * fat, -U - 0.04], [0.046 * fat, -U], [0.05 * fat, -U * 0.85], [0.062 * fat, -U * 0.55], [0.064 * fat, -U * 0.35], [0.07 * fat, -U * 0.12], [0.062 * fat, 0.01], [0.001, 0.05]], sh);
    L([[0.001, -F - 0.02], [0.034 * fat, -F], [0.038 * fat, -F * 0.8], [0.053 * fat, -F * 0.35], [0.056 * fat, -F * 0.15], [0.05 * fat, 0.0], [0.04 * fat, 0.04], [0.001, 0.065]], S.el[i]);
    return hand(S.wr[i], i ? 1 : -1, skinM, 1.6, true);
  });
  // pescoço e cabeça (grande)
  const nk = v === "gordo" ? 1.3 : 1;
  L([[0.001, -0.02], [0.08 * nk, -0.02], [0.068 * nk, 0.05], [0.064 * nk, 0.12], [0.001, 0.14]], S.neck, 0, 20);
  const hg = headGeo({ sx: 0.078 * hs * (v === "gordo" ? 1.12 : 1), sy: 0.106 * hs, sz: 0.096 * hs, cy: 0.11 * hs, jaw: v === "gordo" ? 0.05 : v === "magro" ? 0.35 : 0.18, chin: 0.06, cheek: v === "gordo" ? 0.2 : 0.06 });
  const faces = [0, 0.5, 1].map((op) => giantFaceTex(o.skin ?? 0xe6b49a, op, { wide: v === "gordo" ? 1.1 : 1 }));
  const faceSleep = giantFaceTex(o.skin ?? 0xe6b49a, 0, { sleep: true });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: faces[0], normalMap: tx.normalMap, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.55, emissive: 0x4a1008, emissiveIntensity: 0.28 });
  const headM = mesh(hg, headMat, 0, 0, 0);
  const zAt = (x, y) => surfZ(headM, x, y);
  S.head.add(headM);
  const er = 0.0165 * hs * (v === "gordo" ? 0.8 : v === "magro" ? 1.15 : 1), ex = 0.033 * hs, ey = 0.12 * hs;
  const eyeOpen = v === "careca" ? 0.05 : v === "magro" ? -0.75 : -0.15;
  const eyes = [-1, 1].map((k) => eye(S.head, k * ex, ey, zAt(k * ex, ey) - er * (v === "magro" ? 0.45 : 0.62), er, { iris: o.iris ?? 0x8a7a6a, irisA: 0.5, pupilA: v === "magro" ? 0.1 : 0.16, skin: 0xe6b49a, lid: o.skin ?? 0xe6b49a, open: eyeOpen, white: 0xf2ead8, lashCol: 0x3a1a18 }));
  const brows = [];
  const nz = zAt(0, 0.092 * hs);
  const nose = mesh(sph(1, 18, 14), skinM, 0, 0.09 * hs, nz - 0.005 * hs, S.head); nose.scale.set(0.0125 * hs, 0.019 * hs, 0.012 * hs);
  [-1, 1].forEach((k) => { const ear = mesh(sph(1, 12, 10), skinM, k * 0.079 * hs * (v === "gordo" ? 1.1 : 1), 0.11 * hs, -0.005, S.head); ear.scale.set(0.012 * hs, 0.03 * hs, 0.02 * hs); });
  // cabelo: careca (nada), magro (fios ralos longos), gordo (curto)
  if (v === "magro") hairLocks(S.head, { color: o.hair ?? 0x3a2a20, style: "longo", n: 34, thick: 0.012 * hs, cx: 0, cy: 0.11 * hs, ax: 0.078 * hs, ay: 0.106 * hs, az: 0.096 * hs, capA: 0.3, seed: o.seed ?? 1, len: 1.6, bangY: 0.05 * hs });
  if (v === "gordo") hairLocks(S.head, { color: o.hair ?? 0x6a4a30, style: "curto", n: 40, thick: 0.02 * hs, cy: 0.11 * hs, ax: 0.078 * hs * 1.12, ay: 0.106 * hs, az: 0.096 * hs, capA: 0.36, seed: o.seed ?? 2, len: 1.3, bangY: 0.045 * hs });
  S.root.scale.setScalar(o.scale ?? 7);
  shadows(S.root);
  S.root.userData = { ...S, eyes, brows, mouth: null, gface: { mat: headMat, faces, sleep: faceSleep }, hands, headM, kind: "gigante", tipo: v, lidOpen: 1 };
  restPose(S.root);
  return S.root;
}
// boca do gigante: open 0..1 (mordida), grin estica
function giantMouth(p, open = 0, sleep = false) { const f = p.userData.gface; const tx = sleep ? f.sleep : f.faces[Math.round(clamp(open) * 2)]; if (f.mat.map !== tx) { f.mat.map = tx; } }
// caminhada pesada de gigante (balanço lento, braços soltos, cabeça torta)
function giantWalk(p, ph, t, amt = 1, o = {}) {
  walk(p, ph, amt, { stride: o.stride ?? 0.85, arms: o.arms ?? 0.45, bob: 1.6, lean: o.lean ?? 0.08 });
  const u = p.userData, a = ph * Math.PI * 2;
  u.hips.rotation.z = Math.cos(a) * 0.07 * amt; u.chest.rotation.z = -Math.cos(a) * 0.05 * amt;
  u.neck.rotation.z = fbm1(t * 0.25 + (o.seed ?? 0)) * 0.35 + (o.tilt ?? 0.15); u.head.rotation.x = 0.05 + fbm1(t * 0.3 + 4) * 0.12;
  u.sh[0].rotation.z = -0.12 - 0.06 * Math.max(0, Math.sin(a)); u.sh[1].rotation.z = 0.12 + 0.06 * Math.max(0, -Math.sin(a));
  u.el[0].rotation.x = -0.15 + Math.sin(a + 0.8) * 0.12; u.el[1].rotation.x = -0.15 - Math.sin(a + 0.8) * 0.12;
  if (u.hands) u.hands.forEach((h, i) => curlHand(h, 0.35 + 0.15 * Math.sin(a + i * 3)));
}
// pé que está no chão (para poeira e tremor): devolve 0 ou 1 e o instante do apoio
function footDown(ph) { const f = ((ph % 1) + 1) % 1; return f < 0.5 ? 1 : 0; }

// ---------------------------------------------------------------- animais (cavalo e vaca originais)
const cowTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#f4f1ea"; c.fillRect(0, 0, w, h); c.fillStyle = "#1c1816"; for (let i = 0; i < 9; i++) { c.beginPath(); const x = hash(i * 3) * w, y = hash(i * 7) * h, r = 18 + hash(i * 11) * 30; for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI * 2, rr = r * (0.7 + hash(i * 13 + k) * 0.5); k ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); } });
function quadrupede(o = {}) {
  const vaca = o.tipo === "vaca";
  const C = vaca ? { len: 0.9, r: 0.33, legH: 0.6, neckL: 0.36, headL: 0.36, col: 0xffffff } : { len: 0.95, r: 0.27, legH: 0.88, neckL: 0.66, headL: 0.5, col: o.col ?? 0x7a4a2a };
  const root = new THREE.Group(), body = grp(root, 0, C.legH + C.r * 0.75, 0);
  const bm = vaca ? TM(0xffffff, { map: cowTex }) : TM(C.col), dark = TM(o.mane ?? (vaca ? 0x1c1816 : 0x2a1a10));
  const OL = (m) => ol(m, 0.006, 0x1a1210);
  const tor = OL(mesh(cap(C.r, C.len, 6, 16), bm, 0, 0, 0, body)); tor.rotation.x = Math.PI / 2; tor.scale.set(1, 1, vaca ? 1.05 : 0.95);
  const neck = grp(body, 0, C.r * 0.35, C.len / 2 + C.r * 0.45); neck.rotation.x = vaca ? 1.0 : 0.62;
  OL(mesh(cap(C.r * (vaca ? 0.55 : 0.42), C.neckL, 4, 12), bm, 0, C.neckL / 2, 0, neck));
  const head = grp(neck, 0, C.neckL, 0); head.rotation.x = vaca ? 0.9 : 1.45;
  const hm = OL(mesh(cap(C.r * (vaca ? 0.42 : 0.3), C.headL, 4, 12), bm, 0, C.headL * 0.45, 0.02, head)); hm.scale.set(1, 1, vaca ? 1.1 : 1.15);
  mesh(sph(C.r * (vaca ? 0.4 : 0.27), 12, 10), TM(vaca ? 0xe8b8a8 : 0x3a2618), 0, C.headL * 0.95, 0.02, head);
  [-1, 1].forEach((k) => { mesh(sph(C.r * 0.07, 8, 6), BM(0x0a0608), k * C.r * (vaca ? 0.38 : 0.27), C.headL * 0.25, C.r * 0.12, head); const ear = mesh(new THREE.ConeGeometry(C.r * 0.09, C.r * 0.28, 8), bm, k * C.r * 0.24, C.headL * 0.02, -C.r * 0.1, head); ear.rotation.set(-0.5, 0, -k * 0.6); if (vaca) { const hn = mesh(new THREE.ConeGeometry(C.r * 0.05, C.r * 0.3, 8), TM(0xe8dcc0), k * C.r * 0.2, -C.headL * 0.02, -C.r * 0.18, head); hn.rotation.z = -k * 1.1; } });
  if (!vaca) for (let i = 0; i < 9; i++) { const y = (i / 8) * C.neckL; mesh(lockGeo([[0, y, -C.r * 0.36], [0, y + 0.04, -C.r * 0.55], [0.02 * (i % 2 ? 1 : -1), y - 0.05, -C.r * 0.62]], 0.035, 0.005, 0.5, 6, 6), dark, 0, 0, 0, neck); }
  const tail = grp(body, 0, C.r * 0.3, -C.len / 2 - C.r * 0.7); mesh(lockGeo([[0, 0, 0], [0, -0.1, -0.08], [0, -0.35, -0.1], [0, vaca ? -0.62 : -0.55, -0.06]], vaca ? 0.02 : 0.05, vaca ? 0.04 : 0.012, 0.8, 10, 7), dark, 0, 0, 0, tail);
  const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    const l = grp(body, sx * C.r * 0.55, -C.r * 0.4, sz * C.len * 0.45);
    OL(mesh(cap(C.r * 0.2, C.legH * 0.4, 4, 10), bm, 0, -C.legH * 0.25, 0, l));
    const k = grp(l, 0, -C.legH * 0.5, 0); OL(mesh(cap(C.r * 0.13, C.legH * 0.38, 4, 10), bm, 0, -C.legH * 0.25, 0, k));
    mesh(cyl(C.r * 0.16, C.r * 0.18, C.r * 0.2, 10), TM(0x1a1210), 0, -C.legH * 0.5 + C.r * 0.05, 0, k);
    return { l, k };
  });
  shadows(root);
  root.userData = { body, neck, head, tail, legs, vaca, C, n0: neck.rotation.x, h0: head.rotation.x };
  return root;
}
// pastar (k 0..1 abaixa o pescoço), rabo e passo
function animalAnim(a, t, graze = 0, step = 0, seed = 0) {
  const u = a.userData;
  u.neck.rotation.x = lerp(u.n0, u.vaca ? 2.0 : 2.15, graze) + Math.sin(t * 0.8 + seed) * 0.04;
  u.head.rotation.x = lerp(u.h0, 0.75, graze) + (graze > 0.5 ? Math.sin(t * 6 + seed) * 0.05 : 0);
  u.tail.rotation.set(Math.sin(t * 1.3 + seed) * 0.15, 0, Math.sin(t * 2.1 + seed * 2) * 0.35);
  u.legs.forEach((lg, i) => { const ph = t * 4 + (i === 0 || i === 3 ? 0 : Math.PI); lg.l.rotation.x = Math.sin(ph) * 0.35 * step; lg.k.rotation.x = Math.max(0, Math.cos(ph)) * 0.6 * step * (i < 2 ? -1 : 1); });
  u.body.position.y = u.C.legH + u.C.r * 0.75 + Math.abs(Math.sin(t * 4)) * 0.02 * step;
}
