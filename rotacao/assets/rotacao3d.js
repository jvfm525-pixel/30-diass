// Cena 3D do episódio "E se você tivesse as bolas de aço da rotação?" (Three.js).
// Tudo é função do tempo t (hf-seek). Tempos-chave em window.HF_T (gerado por tools/build_rotacao.py).
import * as THREE from "./vendor/three.module.min.js";

const T = window.HF_T;
const K = T.k;
const W = 1080, H = 1920;
const INK = 0x0b0a12;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const sm = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, x) => a + (b - a) * x;
const lerp3 = (a, b, x) => [lerp(a[0], b[0], x), lerp(a[1], b[1], x), lerp(a[2], b[2], x)];
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function keys(t, ks) {
  if (t <= ks[0][0]) return { pos: ks[0][1], look: ks[0][2] };
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, pa, la] = ks[i], [b, pb, lb] = ks[i + 1];
    if (t <= b) { const x = sm(seg(t, a, b)); return { pos: lerp3(pa, pb, x), look: lerp3(la, lb, x) }; }
  }
  const l = ks[ks.length - 1];
  return { pos: l[1], look: l[2] };
}

const canvas = document.getElementById("c3d");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, W / H, 0.05, 400);

const grad = (() => {
  const d = new Uint8Array([60, 60, 60, 255, 150, 150, 150, 255, 225, 225, 225, 255, 255, 255, 255, 255]);
  const tx = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
  tx.minFilter = tx.magFilter = THREE.NearestFilter; tx.needsUpdate = true; return tx;
})();
const cache = {};
function M(color, extra = {}) {
  const key = color + JSON.stringify(Object.keys(extra).length ? extra : "");
  if (!extra.map && cache[key]) return cache[key];
  const m = new THREE.MeshToonMaterial({ color, gradientMap: grad, ...extra });
  if (!extra.map) cache[key] = m;
  return m;
}
const outlineMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
function ol(m, w = 0.02, mat = outlineMat) {
  m.geometry.computeBoundingSphere();
  const o = new THREE.Mesh(m.geometry, mat); o.scale.setScalar(1 + w / Math.max(0.05, m.geometry.boundingSphere.radius)); m.add(o); return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const sph = (r, ws = 22, hs = 16) => new THREE.SphereGeometry(r, ws, hs);
const cyl = (rt, rb, h, s = 18) => new THREE.CylinderGeometry(rt, rb, h, s);
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 14);
const glowM = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });

const REDRAW = [];
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  REDRAW.push(() => { const g = c.getContext("2d"); g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; });
  return t;
}
function rep(tex, x, y) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(x, y); return tex; }
function tiles(c1, c2, n) {
  return canvasTex(256, 256, (g, w) => { const s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? c1 : c2; g.fillRect(i * s, j * s, s, s); } });
}
function skyTex(stops, extra) {
  return canvasTex(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); if (extra) extra(g, w, h); });
}
function textTex(lines, o = {}) {
  const { w = 512, h = 256, bg = "#000", fg = "#fff", size = 60, font = "Space Mono" } = o;
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `700 ${size}px '${font}', monospace`; g.textAlign = "center"; g.textBaseline = "middle";
    lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.2));
  });
}

// ---------------------------------------------------------------- pessoas adultas
const SK = [0xf0c8a0, 0xd9a47a, 0xb07a52, 0x8a5636, 0x5c3a22];
function adult(o = {}) {
  const P = { skin: SK[1], hair: 0x231a14, top: 0x3d4a5c, pants: 0x22252e, shoe: 0x141414, style: "short", ...o };
  const ghost = o.ghost ? new THREE.MeshToonMaterial({ color: o.ghost, gradientMap: grad, transparent: true, opacity: o.ghostOpacity ?? 0.45, emissive: o.ghost, emissiveIntensity: 0.35, depthWrite: false }) : null;
  const mm = (c) => ghost || M(c);
  const gOL = o.ghostOutline ? new THREE.MeshBasicMaterial({ color: o.ghostOutline, side: THREE.BackSide, transparent: true, opacity: 0.9, depthWrite: false }) : null;
  const OL = (m, w) => (ghost ? (gOL ? ol(m, w * 1.6, gOL) : m) : ol(m, w));
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const legs = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(0.12 * s, 0.98, 0); body.add(g);
    OL(mesh(cap(0.095, 0.66), mm(P.pants), 0, -0.45, 0, g), 0.012);
    const knee = new THREE.Group(); knee.position.y = -0.48; g.add(knee);
    OL(mesh(box(0.15, 0.09, 0.3), mm(P.shoe), 0, -0.47, 0.06, g), 0.01);
    return g;
  });
  const torso = OL(mesh(cap(0.23, 0.52), mm(P.top), 0, 1.36, 0, body), 0.014); torso.scale.set(1.05, 1, 0.68);
  if (o.hood) OL(mesh(sph(0.2, 16, 12), mm(P.top), 0, 1.72, -0.1, body), 0.01);
  const arms = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(0.31 * s, 1.66, 0); body.add(g);
    OL(mesh(cap(0.07, 0.6), mm(P.top), 0, -0.36, 0, g), 0.01);
    OL(mesh(sph(0.075), mm(P.skin), 0, -0.74, 0, g), 0.008);
    g.rotation.z = 0.06 * s;
    return g;
  });
  const head = new THREE.Group(); head.position.set(0, 1.74, 0); body.add(head);
  mesh(cyl(0.07, 0.08, 0.14), mm(P.skin), 0, 0.03, 0, head);
  const skull = OL(mesh(sph(0.19, 28, 22), mm(P.skin), 0, 0.24, 0, head), 0.01); skull.scale.set(0.95, 1.18, 1.05);
  if (P.style !== "bald") {
    const hc = mesh(new THREE.SphereGeometry(0.2, 26, 14, 0, Math.PI * 2, 0, P.style === "long" ? 1.9 : 1.25), mm(P.hair), 0, 0.27, -0.015, head); hc.scale.set(0.97, 1.2, 1.08); hc.rotation.x = -0.25;
  } else if (!o.noHair) {
    const r = mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 22, Math.PI), mm(P.hair), 0, 0.22, -0.05, head); r.rotation.y = Math.PI / 2;
  }
  if (o.beard) { const b = mesh(sph(0.15, 16, 12), mm(o.beard), 0, 0.12, 0.06, head); b.scale.set(1.05, 0.75, 0.9); }
  const eyes = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(0.07 * s, 0.27, 0.17); head.add(g);
    mesh(sph(0.03, 12, 10), ghost || M(0xf4f1ea), 0, 0, 0, g).scale.z = 0.5;
    mesh(sph(0.018, 10, 8), ghost || M(0x2a1a10), 0, 0, 0.01, g);
    return g;
  });
  [-1, 1].forEach((s) => mesh(box(0.08, 0.016, 0.02), mm(P.hair === 0xe8e8e8 ? 0xbdbdbd : P.hair), 0.07 * s, 0.33, 0.185, head));
  const mouth = mesh(box(0.07, 0.012, 0.02), ghost || M(0x6a2a2a), 0, 0.15, 0.19, head);
  mesh(sph(0.025, 10, 8), mm(P.skin), 0, 0.22, 0.2, head);
  if (o.glasses) [-1, 1].forEach((s) => mesh(new THREE.TorusGeometry(0.045, 0.007, 6, 18), M(0x222222), 0.07 * s, 0.27, 0.2, head));
  if (o.cane) { const c = mesh(cyl(0.015, 0.015, 0.95), M(0x5a3b2b), 0, -1.15, 0.05, arms[1]); arms[1].userData.cane = c; }
  root.userData = { body, head, legs, arms, eyes, mouth, torso, ghost, gOL };
  return root;
}
function breathe(p, t, s = 0, amt = 1) {
  const u = p.userData;
  u.torso.scale.y = 1 + Math.sin(t * 1.6 + s) * 0.012 * amt;
  u.head.rotation.y = Math.sin(t * 0.5 + s) * 0.08 * amt; u.head.rotation.x = Math.sin(t * 0.7 + s) * 0.03 * amt;
  u.arms[0].rotation.x = Math.sin(t * 1.1 + s) * 0.03 * amt; u.arms[1].rotation.x = -Math.sin(t * 1.1 + s) * 0.03 * amt;
  const ph = (t + s * 1.3) % 3.7; u.eyes.forEach((e) => (e.scale.y = ph < 0.1 ? 0.15 : 1));
}
function walk(p, t, speed = 1, amt = 1) {
  const u = p.userData, c = t * 6 * speed;
  u.legs[0].rotation.x = Math.sin(c) * 0.5 * amt; u.legs[1].rotation.x = -Math.sin(c) * 0.5 * amt;
  u.arms[0].rotation.x = -Math.sin(c) * 0.4 * amt; u.arms[1].rotation.x = Math.sin(c) * 0.4 * amt;
  u.body.position.y = Math.abs(Math.cos(c)) * 0.04 * amt;
}
function still(p) { const u = p.userData; u.legs.forEach((l) => (l.rotation.set(0, 0, 0))); u.body.position.y = 0; }
function sit(p) { const u = p.userData; u.legs.forEach((l) => (l.rotation.x = -1.45)); u.body.position.y = -0.46; }

// ---------------------------------------------------------------- o espírito carmesim (original)
function spirit() {
  const g = new THREE.Group();
  const s = adult({ ghost: 0xc0142f, ghostOpacity: 0.5, ghostOutline: 0x3a0008, style: "bald", noHair: true, top: 0, pants: 0, skin: 0, shoe: 0, hair: 0 });
  s.scale.setScalar(1.18); g.add(s);
  // rachaduras douradas
  const pts = [];
  for (let i = 0; i < 160; i++) {
    const a = hash(i) * Math.PI * 2, y = 0.3 + hash(i + 3) * 1.9, r = y > 1.75 ? 0.2 : (y > 1.0 ? 0.25 : 0.12);
    const x0 = Math.cos(a) * r, z0 = Math.sin(a) * r * 0.7 + 0.02;
    const ox = y < 1.0 ? (i % 2 ? 0.12 : -0.12) : 0;
    pts.push(x0 + ox, y, z0, x0 + ox + (hash(i + 7) - 0.5) * 0.12, y + (hash(i + 9) - 0.5) * 0.16, z0);
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const cracks = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.9 })); s.add(cracks);
  // olhos brancos sem pupila
  const eyeM = glowM(0xffffff, 1);
  const eyes = [-1, 1].map((k) => { const e = mesh(sph(0.032, 12, 10), eyeM, 0.07 * k, 2.01, 0.18, s); e.scale.set(1.4, 0.7, 0.6); return e; });
  // aura
  const aura = mesh(new THREE.PlaneGeometry(2.6, 3.4), glowM(0xff1a3c, 0.18), 0, 1.4, -0.25, g);
  const auraTex = canvasTex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,40,70,.9)"); gr.addColorStop(1, "rgba(255,0,40,0)"); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
  aura.material.map = auraTex; aura.material.needsUpdate = true;
  // partículas para a dissolução
  const pp = []; for (let i = 0; i < 260; i++) pp.push((hash(i) - 0.5) * 0.7, hash(i + 11) * 2.4, (hash(i + 23) - 0.5) * 0.4);
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.Float32BufferAttribute(pp, 3));
  const base = pp.slice();
  const parts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xff3a5a, size: 0.035, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.add(parts);
  g.userData = { s, cracks, eyes, aura, parts, base, mat: s.userData.ghost };
  return g;
}
function spiritSet(sp, t, vis, dissolve = 0) {
  const u = sp.userData; sp.visible = vis > 0.001;
  u.mat.opacity = 0.5 * vis * (1 - dissolve); if (u.s.userData.gOL) u.s.userData.gOL.opacity = 0.9 * vis * (1 - dissolve);
  u.cracks.material.opacity = 0.9 * vis * (1 - dissolve);
  u.eyes.forEach((e) => (e.material.opacity = vis * (1 - dissolve)));
  u.aura.material.opacity = (0.16 + 0.05 * Math.sin(t * 3)) * vis * (1 - dissolve * 0.7);
  sp.position.y = Math.sin(t * 1.4) * 0.04 + 0.08;
  breathe(u.s, t, 9, 0.6);
  const pa = u.parts.geometry.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const d = dissolve * (0.6 + hash(i + 5) * 1.6);
    pa.setXYZ(i, u.base[i * 3] * (1 + d), u.base[i * 3 + 1] + d * 1.5, u.base[i * 3 + 2] + d * 0.4 * (hash(i) - 0.5));
  }
  pa.needsUpdate = true;
  u.parts.material.opacity = dissolve > 0 ? Math.min(1, dissolve * 3) * (1 - seg(dissolve, 0.7, 1)) : 0;
}

// ---------------------------------------------------------------- utilidades de cenário
function plane(w, h, mat) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); }
function floorP(w, d, mat, y = 0) { const m = plane(w, d, mat); m.rotation.x = -Math.PI / 2; m.position.y = y; return m; }
function building(g, x, z, w, h, d, col, lit, seed) {
  ol(mesh(box(w, h, d), M(col), x, h / 2, z, g), 0.03);
  const rows = Math.floor(h / 0.9), cols = Math.max(1, Math.floor(w / 0.8));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (hash(seed * 31 + r * 7 + c) < 0.45) continue;
    mesh(box(0.35, 0.45, 0.02), new THREE.MeshBasicMaterial({ color: lit }), x - w / 2 + 0.45 + c * 0.8, 0.8 + r * 0.9, z + d / 2 + 0.01, g);
  }
}
function rain(g, n, area, seed = 1) {
  const pos = new Float32Array(n * 6);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const ln = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x9fb8d9, transparent: true, opacity: 0.45 })); g.add(ln);
  return (t, slow = 1) => {
    for (let i = 0; i < n; i++) {
      const x = area[0] + hash(i + seed) * (area[1] - area[0]), z = area[4] + hash(i + seed + 50) * (area[5] - area[4]);
      const span = area[3] - area[2];
      const y = area[3] - ((hash(i + seed + 90) * span + t * 9 * slow) % span);
      pos.set([x, y, z, x - 0.02, y + 0.35 * slow + 0.02, z], i * 6);
    }
    geo.attributes.position.needsUpdate = true;
  };
}

const hemi = new THREE.HemisphereLight(0x9fb4d9, 0x101018, 0.9); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 6, 4); scene.add(key);
const rim = new THREE.DirectionalLight(0xff3050, 0.9); rim.position.set(-4, 3, -4); scene.add(rim);

const SETS = {};
function addSet(name, build) { const g = new THREE.Group(); g.visible = false; scene.add(g); const s = build(g); s.group = g; SETS[name] = s; }


// ---------------------------------------------------------------- bolas de aço e espiral áurea
const PHI = (1 + Math.sqrt(5)) / 2;
const steelTex = canvasTex(512, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#e9edf2"); gr.addColorStop(0.5, "#9aa3ae"); gr.addColorStop(1, "#d5dbe2");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#3a3f47"; g.lineWidth = 5;
  [0.3, 0.5, 0.7].forEach((y) => { g.beginPath(); g.moveTo(0, y * h); g.lineTo(w, y * h); g.stroke(); });
  g.lineWidth = 3;
  for (let k = 0; k < 8; k++) { g.beginPath(); for (let x = 0; x <= w; x += 8) { const y = h * 0.5 + Math.sin((x / w) * Math.PI * 2 + k * 0.785) * h * 0.38; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  g.fillStyle = "#c9a227"; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc((k + 0.5) * w / 6, h * 0.5, 7, 0, 7); g.fill(); }
});
function steelBall(r = 0.12) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), new THREE.MeshPhongMaterial({ map: steelTex, color: 0xffffff, specular: 0xffffff, shininess: 90 }));
  g.add(b); ol(b, 0.008);
  g.userData.ball = b; return g;
}
function spiralPts(turns = 3.2, scale = 1) {
  // espiral áurea: r = a * phi^(2θ/π)
  const pts = [];
  const thMax = turns * Math.PI * 2;
  for (let i = 0; i <= 400; i++) { const th = (i / 400) * thMax; const r = scale * Math.pow(PHI, (2 * (th - thMax)) / Math.PI); pts.push(new THREE.Vector3(Math.cos(th) * r, Math.sin(th) * r, 0)); }
  return pts;
}
function spiralLine(color = 0xffc94a, scale = 1, turns = 3.2, opacity = 1) {
  const geo = new THREE.BufferGeometry().setFromPoints(spiralPts(turns, scale));
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
}
function waves(n = 3, color = 0xffc94a) { // anéis em espiral que saem da bola girando
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const s = spiralLine(color, 0.6 + i * 0.25, 2.6, 0.9); s.rotation.z = (i * Math.PI * 2) / n; g.add(s); }
  return g;
}
function goldenRect(scale = 1) { // retângulo áureo subdividido (linhas) + espiral por arcos
  const segs = []; let x = 0, y = 0, w = PHI * scale, h = 1 * scale;
  const push = (x0, y0, x1, y1) => segs.push(x0, y0, 0, x1, y1, 0);
  push(x, y, x + w, y); push(x + w, y, x + w, y + h); push(x + w, y + h, x, y + h); push(x, y + h, x, y);
  for (let k = 0; k < 7; k++) {
    const d = k % 4;
    if (d === 0) { push(x + h, y, x + h, y + h); x += h; w -= h; }
    else if (d === 1) { push(x, y + w, x + w, y + w); y += w; h -= w; }
    else if (d === 2) { push(x + w - h, y, x + w - h, y + h); w -= h; }
    else { push(x, y + h - w, x + w, y + h - w); h -= w; }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.9 }));
}
function sunflower(nSeeds = 520, R = 0.55) {
  const g = new THREE.Group();
  ol(mesh(cyl(R * 1.05, R * 1.05, 0.08, 40), M(0x5a3a1a), 0, 0, 0, g), 0.01).rotation.x = Math.PI / 2;
  const seedGeo = sph(0.018, 6, 5);
  const inst = new THREE.InstancedMesh(seedGeo, M(0x2a1a0a), nSeeds); const m4 = new THREE.Matrix4();
  for (let i = 0; i < nSeeds; i++) { const a = i * 2.39996, r = R * Math.sqrt(i / nSeeds); m4.makeTranslation(Math.cos(a) * r, Math.sin(a) * r, 0.05); inst.setMatrixAt(i, m4); }
  g.add(inst);
  for (let i = 0; i < 26; i++) { const p = mesh(sph(0.16, 10, 8), M(i % 2 ? 0xffc91a : 0xffb000), 0, 0, 0, g); const a = (i / 26) * Math.PI * 2; p.position.set(Math.cos(a) * (R + 0.2), Math.sin(a) * (R + 0.2), 0); p.scale.set(0.5, 1.5, 0.15); p.rotation.z = a - Math.PI / 2; }
  return g;
}
function galaxy(n = 1400) {
  const pts = [], cols = [];
  for (let i = 0; i < n; i++) { const arm = i % 2, t = hash(i) * 3.2 * Math.PI, r = 0.05 * Math.pow(PHI, (2 * t) / Math.PI); const a = t + arm * Math.PI + (hash(i + 3) - 0.5) * 0.4; pts.push(Math.cos(a) * r, Math.sin(a) * r, (hash(i + 5) - 0.5) * 0.08); const c = new THREE.Color().setHSL(0.1 + hash(i + 9) * 0.6, 0.7, 0.75); cols.push(c.r, c.g, c.b); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.025, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
}
function snail() {
  const curve = new THREE.CatmullRomCurve3(spiralPts(2.6, 0.9).map((p) => new THREE.Vector3(p.x, p.y, 0)));
  const g = new THREE.Group();
  const shell = mesh(new THREE.TubeGeometry(curve, 200, 0.06, 10, false), M(0xc58a4a), 0, 0, 0, g); ol(shell, 0.01);
  return g;
}
function addFingers(p, curlInit = 1) { // dedos na mão direita (para a cena do avô)
  const hand = p.userData.arms[1];
  const fingers = [];
  for (let i = 0; i < 4; i++) { const f = new THREE.Group(); f.position.set(-0.045 + i * 0.03, -0.8, 0.02); hand.add(f); ol(mesh(cap(0.014, 0.06), M(SK[0]), 0, -0.04, 0, f), 0.003); fingers.push(f); }
  p.userData.fingers = fingers; return fingers;
}
const dustPts = (n, box3) => { const p = []; for (let i = 0; i < n; i++) p.push(box3[0] + hash(i) * (box3[1] - box3[0]), box3[2] + hash(i + 7) * (box3[3] - box3[2]), box3[4] + hash(i + 13) * (box3[5] - box3[4])); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffe6b0, size: 0.02, transparent: true, opacity: 0.7, depthWrite: false })); };
const wood = (c1 = "#8a5a35", c2 = "#7a4d2c") => canvasTex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c1 : c2; g.fillRect(0, i * 32, w, 32); g.fillStyle = "#00000022"; g.fillRect(0, i * 32, w, 3); } });

// 1 · sótão do avô
addSet("s1-sotao", (g) => {
  g.add(floorP(10, 10, M(0xffffff, { map: rep(wood(), 3, 3) })));
  [-1, 1].forEach((s) => { const r = plane(10, 5, M(0xffffff, { map: rep(wood("#6b4426", "#5e3b20"), 3, 2) })); r.position.set(s * 1.9, 2.0, -0.5); r.rotation.set(0, s * -Math.PI / 2, 0); r.rotation.x = 0; r.rotateX(s * 0.0); g.add(r); });
  const back = plane(6, 5, M(0x4a2f1c)); back.position.set(0, 2, -3); g.add(back);
  const win = plane(0.9, 0.9, new THREE.MeshBasicMaterial({ color: 0xffe2a8 })); win.position.set(0.4, 2.8, -2.98); g.add(win);
  const shaft = mesh(new THREE.PlaneGeometry(1.0, 4.2), glowM(0xffe2a8, 0.12), 0.25, 1.6, -1.6, g); shaft.rotation.set(-0.6, 0, 0.15);
  ol(mesh(box(5, 0.2, 0.2), M(0x5e3b20), 0, 3.6, -1, g), 0.01);
  [[-1.3, -2.2, 0.8], [1.3, -2.4, 0.6], [-1.0, -1.4, 0.5]].forEach(([x, z, s]) => ol(mesh(box(s, s * 0.7, s * 0.8), M(0xb08a5a), x, s * 0.35, z, g), 0.015));
  ol(mesh(box(0.7, 1.2, 0.5), M(0x7a7a7a), 1.4, 0.6, -1.4, g), 0.015);
  const dust = dustPts(220, [-1.5, 1.5, 0.2, 3.2, -2.5, 0.5]); g.add(dust);
  // baú com as bolas
  const chest = new THREE.Group(); chest.position.set(0, 0, -0.6); g.add(chest);
  ol(mesh(box(0.9, 0.45, 0.55), M(0x6f4a2a, { map: wood() }), 0, 0.225, 0, chest), 0.015);
  const lidP = new THREE.Group(); lidP.position.set(0, 0.45, -0.275); chest.add(lidP);
  ol(mesh(box(0.92, 0.1, 0.57), M(0x5e3b20), 0, 0.05, 0.285, lidP), 0.015);
  mesh(box(0.8, 0.02, 0.45), M(0x7a1a2a), 0, 0.43, 0, chest);
  const b1 = steelBall(0.11), b2 = steelBall(0.11); b1.position.set(-0.17, 0.55, 0); b2.position.set(0.17, 0.55, 0); chest.add(b1, b2);
  const wv = waves(3); wv.position.set(0, 0.6, 0.05); wv.scale.setScalar(0.6); chest.add(wv);
  const you = adult({ top: 0x3a5a7a }); you.position.set(1.05, 0, 0.0); you.rotation.y = -2.06; g.add(you);
  const warm = new THREE.PointLight(0xffc98a, 5, 7); warm.position.set(0.4, 2.6, -1.8); g.add(warm);
  return {
    bg: 0x2a1a10,
    update(t) {
      still(you); breathe(you, t); you.userData.body.rotation.x = 0.35; you.userData.arms.forEach((a) => a.rotation.set(-0.7, 0, 0));
      lidP.rotation.x = -sm(seg(t, K.caixa - 0.3, K.caixa + 0.8)) * 1.9;
      const spin = seg(t, K.giram - 0.3, K.giram + 0.5);
      [b1, b2].forEach((b, i) => { b.position.y = 0.52 + spin * 0.1 + Math.sin(t * 3 + i) * 0.01 * spin; b.userData.ball.rotation.y = t * 6 * spin * (i ? -1 : 1); });
      wv.visible = spin > 0; wv.rotation.z = t * 2; wv.children.forEach((c) => (c.material.opacity = 0.7 * spin));
      dust.rotation.y = t * 0.03; dust.position.y = Math.sin(t * 0.4) * 0.05;
    },
    cam(t) { const s = T.sc["s1-sotao"]; return keys(t, [[s[0], [-1.2, 2.2, 2.8], [0.2, 1.0, -0.6]], [K.caixa, [-0.8, 1.6, 1.2], [0, 0.6, -0.6]], [K.giram, [-0.55, 1.25, 0.55], [0, 0.62, -0.6]], [s[1], [-0.45, 1.15, 0.4], [0, 0.62, -0.6]]]); },
  };
});

// 2 · o segredo: proporção áurea
addSet("s2-proporcao", (g) => {
  const gr = goldenRect(1.2); gr.position.set(-0.97, 1.4, 0); g.add(gr);
  const sp = spiralLine(0xffe08a, 1.1, 3.4); sp.position.set(0.33, 2.0, 0.02); sp.rotation.z = Math.PI; g.add(sp);
  const sn = snail(); sn.position.set(0, 1.9, 0.3); sn.scale.setScalar(0.7); g.add(sn);
  const sf = sunflower(400, 0.6); sf.position.set(0, 1.9, 0.3); g.add(sf);
  const gx = galaxy(); gx.position.set(0, 1.9, 0.2); gx.scale.setScalar(1.5); g.add(gx);
  const stars = dustPts(300, [-6, 6, -4, 8, -8, -3]); stars.material.color.set(0xffffff); g.add(stars);
  return {
    bg: 0x05040a,
    update(t) {
      const a = seg(t, T.sc["s2-proporcao"][0] + 0.2, K.aurea + 0.5);
      gr.geometry.setDrawRange(0, Math.floor(a * 22) * 2); sp.geometry.setDrawRange(0, Math.floor(seg(t, K.proporcao, K.aurea + 1) * 401));
      gr.visible = sp.visible = t < K.caracol - 0.2; sn.visible = t > K.caracol - 0.2 && t < K.girassol - 0.15; sn.scale.setScalar(0.7 * sm(seg(t, K.caracol - 0.2, K.caracol + 0.3)) + 0.001); sn.rotation.z = t * 0.3;
      sf.visible = t > K.girassol - 0.2 && t < K.galaxias - 0.2; sf.scale.setScalar(sm(seg(t, K.girassol - 0.2, K.girassol + 0.3)) + 0.001); sf.rotation.z = -t * 0.2;
      gx.visible = t > K.galaxias - 0.3; gx.material.opacity = seg(t, K.galaxias - 0.3, K.galaxias + 0.6); gx.rotation.z = t * 0.25;
    },
    cam(t) { const s = T.sc["s2-proporcao"]; return keys(t, [[s[0], [0, 1.9, 5.2], [0, 1.9, 0]], [K.aurea, [0, 1.9, 4.6], [0, 1.9, 0]], [K.caracol, [0, 2.4, 5.4], [0, 2.2, 0]], [s[1], [0, 1.5, 7.0], [0, 1.6, 0]]]); },
  };
});

// 3 · quintal: as latas
function backyard(g, sky = [[0, "#f2a65a"], [1, "#ffe3a8"]]) {
  const sk = plane(60, 30, new THREE.MeshBasicMaterial({ map: skyTex(sky) })); sk.position.set(0, 10, -15); g.add(sk);
  const grass = canvasTex(128, 128, (c) => { for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? "#5e9e4a" : "#6aac55"; c.fillRect(0, i * 32, 128, 32); } });
  g.add(floorP(30, 30, M(0xffffff, { map: rep(grass, 8, 8) })));
  ol(mesh(box(8, 1.6, 0.3), M(0xc9b79c), 0, 0.8, -3.5, g), 0.02);
  for (let i = 0; i < 9; i++) mesh(box(0.85, 0.06, 0.32), M(0xb8a487), -3.6 + i * 0.9, 1.63, -3.5, g);
  const tree = new THREE.Group(); tree.position.set(3.2, 0, -5); g.add(tree); mesh(cyl(0.15, 0.2, 2), M(0x6f5238), 0, 1, 0, tree); ol(mesh(sph(1.1, 14, 10), M(0x3f8a3a), 0, 2.6, 0, tree), 0.03);
  mesh(cyl(0.02, 0.02, 7), M(0x888888), 0, 2.2, -2.2, g).rotation.z = Math.PI / 2;
  [[-2, 0xe63946], [-1.2, 0x3a86ff], [0.5, 0xffffff]].forEach(([x, c]) => ol(mesh(box(0.5, 0.6, 0.02), M(c), x, 1.85, -2.2, g), 0.01));
}
addSet("s3-quintal", (g) => {
  backyard(g);
  const cans = [-0.9, -0.3, 0.3, 0.9].map((x, i) => { const c = ol(mesh(cyl(0.07, 0.07, 0.2, 14), M([0xe63946, 0x2a9d8f, 0xffd166, 0x3a86ff][i]), x, 1.73, -3.5, g), 0.006); return c; });
  const you = adult({ top: 0x3a5a7a }); you.position.set(0.2, 0, 1.8); you.rotation.y = Math.PI; g.add(you);
  const ball = steelBall(0.06); g.add(ball);
  const trail = waves(2); trail.scale.setScalar(0.25); g.add(trail);
  return {
    bg: 0xf2a65a,
    update(t) {
      still(you); breathe(you, t);
      const a = K.arremesso, b = K.mao + 0.3;
      const throwA = sm(seg(t, a - 0.5, a)); you.userData.arms[1].rotation.set(-throwA * 2.4 + seg(t, a, a + 0.3) * 1.6, 0, 0);
      const x = seg(t, a, b);
      // passa por cima das latas, faz a curva e volta pra mão
      const hand = new THREE.Vector3(0.5, 1.0, 1.75);
      const p = x <= 0 ? hand : new THREE.Vector3(hand.x + Math.sin(x * Math.PI * 2) * 1.6, 1.0 + Math.sin(x * Math.PI) * 1.4, hand.z - Math.sin(x * Math.PI) * 5.3);
      ball.position.copy(p); ball.userData.ball.rotation.y = t * 20;
      trail.position.copy(p); trail.rotation.z = t * 4; trail.visible = x > 0 && x < 1;
      cans.forEach((c, i) => { c.rotation.z = Math.sin(t * 9 + i) * 0.05 * seg(t, a + 0.4, a + 0.6) * (1 - seg(t, a + 1.0, a + 1.5)); });
      if (x >= 1) you.userData.arms[1].rotation.set(-1.2, 0, 0);
    },
    cam(t) { const s = T.sc["s3-quintal"]; return keys(t, [[s[0], [1.6, 1.9, 4.4], [0, 1.3, -1]], [K.arremesso, [1.4, 1.7, 4.0], [0, 1.5, -2]], [K.curva, [2.6, 2.6, 3.2], [0, 1.6, -2.5]], [s[1], [1.3, 1.6, 3.6], [0.4, 1.1, 1.6]]]); },
  };
});

// 4 · a água em espiral
addSet("s4-agua", (g) => {
  g.add(floorP(10, 10, M(0xffffff, { map: rep(tiles("#bfb3a2", "#b0a492", 4), 3, 3) })));
  const bucket = new THREE.Group(); g.add(bucket);
  ol(mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.55, 32, 1, true), M(0x3a86ff, { side: THREE.DoubleSide }), 0, 0.275, 0, bucket), 0.01);
  mesh(cyl(0.34, 0.34, 0.02, 32), M(0x2b5fbf), 0, 0.01, 0, bucket);
  const vortexTex = canvasTex(256, 256, (c) => { c.fillStyle = "#2f8fd6"; c.fillRect(0, 0, 256, 256); c.strokeStyle = "#bfe8ff"; c.lineWidth = 6; for (let k = 0; k < 4; k++) { c.beginPath(); for (let i = 0; i < 200; i++) { const th = i / 200 * 3 * Math.PI + k * Math.PI / 2, r = 6 * Math.pow(PHI, 2 * th / Math.PI) * 0.5; const x = 128 + Math.cos(th) * r, y = 128 + Math.sin(th) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } });
  const water = mesh(new THREE.CircleGeometry(0.4, 48), new THREE.MeshBasicMaterial({ map: vortexTex }), 0, 0.48, 0, bucket); water.rotation.x = -Math.PI / 2;
  const cone = mesh(new THREE.ConeGeometry(0.2, 0.25, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x1a6aa8, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }), 0, 0.37, 0, bucket); cone.rotation.x = Math.PI;
  const ball = steelBall(0.06); g.add(ball);
  const drops = []; for (let i = 0; i < 18; i++) drops.push(mesh(sph(0.02, 6, 5), new THREE.MeshBasicMaterial({ color: 0xbfe8ff }), 0, 0, 0, g));
  return {
    bg: 0x2a2620,
    update(t) {
      const drop = K.toca;
      const y = t < drop ? lerp(1.6, 0.5, sm(seg(t, T.sc["s4-agua"][0], drop))) : 0.45;
      ball.position.set(0, y, 0); ball.userData.ball.rotation.y = t * 18;
      const v = sm(seg(t, drop, drop + 1.2));
      water.rotation.z = -t * 4 * v; cone.scale.set(v + 0.001, v + 0.001, v + 0.001); cone.visible = v > 0.01;
      drops.forEach((d, i) => { const dt = t - drop; d.visible = dt > 0 && dt < 0.8; const a = i / 18 * Math.PI * 2; d.position.set(Math.cos(a) * (0.1 + dt * 0.6), 0.5 + dt * 1.2 - dt * dt * 4, Math.sin(a) * (0.1 + dt * 0.6)); });
    },
    cam(t) { const s = T.sc["s4-agua"]; return keys(t, [[s[0], [1.4, 1.8, 1.6], [0, 0.6, 0]], [K.toca, [0.6, 1.6, 0.8], [0, 0.45, 0]], [K.agua, [0.05, 1.7, 0.08], [0, 0.45, 0]], [s[1], [0.02, 1.45, 0.03], [0, 0.45, 0]]]); },
  };
});

// 5 · o pote de pepino
addSet("s5-pote", (g) => {
  g.add(floorP(10, 8, M(0xffffff, { map: rep(tiles("#c9a27a", "#b98f66", 6), 4, 3) })));
  const wl = plane(10, 5, M(0xffffff, { map: rep(tiles("#e9f5f9", "#cde8f0", 8), 4, 2) })); wl.position.set(0, 2.5, -2.2); g.add(wl);
  ol(mesh(box(5, 0.9, 0.7), M(0xe76f51), 0, 0.45, -1.8, g), 0.02); ol(mesh(box(5.1, 0.08, 0.8), M(0xf1f3f5), 0, 0.94, -1.8, g), 0.01);
  for (let i = -2; i <= 2; i++) ol(mesh(box(0.9, 0.7, 0.4), M(0xe76f51), i * 1.0, 3.2, -2.0, g), 0.015);
  const jar = new THREE.Group(); jar.position.set(0, 0.98, -1.6); g.add(jar);
  mesh(cyl(0.16, 0.16, 0.36, 24), new THREE.MeshPhongMaterial({ color: 0xcfeee0, transparent: true, opacity: 0.45, shininess: 100 }), 0, 0.18, 0, jar);
  for (let i = 0; i < 7; i++) { const p = mesh(cap(0.03, 0.18), M(0x5a8a2a), (hash(i) - 0.5) * 0.18, 0.17, (hash(i + 3) - 0.5) * 0.18, jar); p.rotation.z = (hash(i + 5) - 0.5) * 0.6; }
  const lid = ol(mesh(cyl(0.17, 0.17, 0.06, 24), M(0xd4a017), 0, 0.39, 0, jar), 0.01);
  const ball = steelBall(0.06); g.add(ball);
  const mom = adult({ top: 0xe76f51, style: "long", hair: 0x3a2618, skin: SK[2] }); mom.position.set(-1.4, 0, -0.9); mom.rotation.y = 0.8; g.add(mom);
  const dad = adult({ top: 0x5c6b7a, beard: 0x3a2a20, hair: 0x3a2a20, skin: SK[2] }); dad.position.set(1.4, 0, -0.9); dad.rotation.y = -0.8; g.add(dad);
  const you = adult({ top: 0x3a5a7a }); you.position.set(0.1, 0, 0.1); you.rotation.y = Math.PI; g.add(you);
  return {
    bg: 0xcde8f0,
    update(t) {
      [mom, dad, you].forEach((p, i) => { still(p); breathe(p, t, i * 3); });
      dad.userData.arms.forEach((a, i) => a.rotation.set(-1.1, 0, (i ? 1 : -1) * 0.8));
      const touch = K.pote - 0.3, pop = K.conseguia;
      const bx = sm(seg(t, touch - 0.8, touch));
      ball.position.set(lerp(0.4, 0, bx), lerp(1.25, 1.47, bx), -1.6); ball.userData.ball.rotation.y = t * 14;
      const sp = seg(t, touch, pop);
      lid.rotation.y = sp * sp * 30; lid.position.y = 0.39 + (t > pop ? Math.min(0.8, (t - pop) * 2.5) - Math.max(0, (t - pop - 0.3)) * 1.2 : 0);
      lid.rotation.x = t > pop ? (t - pop) * 4 : 0;
      mom.userData.head.rotation.x = t > pop ? -0.2 : 0;
    },
    cam(t) { const s = T.sc["s5-pote"]; return keys(t, [[s[0], [1.6, 1.9, 2.8], [0, 1.2, -1.2]], [K.pote, [0.1, 1.45, -0.7], [0, 1.25, -1.6]], [K.conseguia, [0.15, 1.55, -0.55], [0, 1.45, -1.6]], [s[1], [1.6, 1.9, 2.4], [0, 1.3, -1.2]]]); },
  };
});

// 6 · o treino (muro com marcas)
addSet("s6-treino", (g) => {
  backyard(g, [[0, "#7fb8e6"], [1, "#e6f4ff"]]);
  const marks = []; for (let i = 0; i < 40; i++) { const m = mesh(new THREE.CircleGeometry(0.05 + hash(i) * 0.05, 12), new THREE.MeshBasicMaterial({ color: 0x5a4a3a }), -3 + hash(i + 3) * 6, 0.2 + hash(i + 7) * 1.3, -3.34, g); marks.push(m); }
  const you = adult({ top: 0x3a5a7a }); you.position.set(0.3, 0, 0.6); you.rotation.y = Math.PI; g.add(you);
  const ball = steelBall(0.06); g.add(ball);
  return {
    bg: 0x7fb8e6,
    update(t) {
      const s = T.sc["s6-treino"];
      const n = Math.floor(seg(t, s[0], K.forca) * 40);
      marks.forEach((m, i) => (m.visible = i < n));
      still(you); breathe(you, t);
      const c = ((t - s[0]) % 0.9) / 0.9;
      you.userData.arms[1].rotation.set(-2.2 + c * 2.0, 0, 0);
      const target = marks[Math.min(39, n)].position;
      ball.position.set(lerp(0.5, target.x, c), lerp(1.3, target.y, c) + Math.sin(c * Math.PI) * 0.4, lerp(0.5, -3.3, c)); ball.userData.ball.rotation.y = t * 10;
      you.userData.head.rotation.x = t > K.forca ? 0.3 : 0;
    },
    cam(t) { const s = T.sc["s6-treino"]; return keys(t, [[s[0], [2.4, 1.6, 3.4], [-0.5, 1.0, -2.5]], [s[1], [3.2, 2.0, 4.6], [-0.5, 1.0, -2.5]]]); },
  };
});

// 7 · o girassol
addSet("s7-girassol", (g) => {
  backyard(g, [[0, "#9fd0f5"], [1, "#fff1c9"]]);
  const flowers = [];
  for (let i = 0; i < 5; i++) { const f = new THREE.Group(); f.position.set(-2 + i * 1.0, 0, -2.2 + (i % 2) * 0.3); g.add(f); mesh(cyl(0.03, 0.04, 1.6), M(0x3f8a3a), 0, 0.8, 0, f); const h = sunflower(260, 0.22); h.position.y = 1.65; f.add(h); flowers.push(f); }
  const hero = new THREE.Group(); hero.position.set(0.2, 0, -0.6); g.add(hero);
  mesh(cyl(0.04, 0.05, 1.5), M(0x3f8a3a), 0, 0.75, 0, hero);
  const head = sunflower(700, 0.45); head.position.y = 1.6; hero.add(head);
  const sp1 = spiralLine(0xffc94a, 0.55, 3.0), sp2 = spiralLine(0xffc94a, 0.55, 3.0); sp2.scale.x = -1; sp1.position.set(0, 1.6, 0.08); sp2.position.set(0, 1.6, 0.08); hero.add(sp1, sp2);
  const you = adult({ top: 0x3a5a7a }); you.position.set(1.2, 0, 0.5); you.rotation.y = Math.PI + 0.6; g.add(you);
  return {
    bg: 0x9fd0f5,
    update(t) {
      still(you); breathe(you, t);
      const a = seg(t, K.espirais - 0.3, K.outro + 0.5);
      sp1.geometry.setDrawRange(0, Math.floor(a * 401)); sp2.geometry.setDrawRange(0, Math.floor(seg(t, K.outro - 0.4, K.outro + 0.6) * 401));
      sp1.rotation.z = t * 0.2; sp2.rotation.z = -t * 0.2;
      flowers.forEach((f, i) => (f.rotation.z = Math.sin(t * 0.8 + i) * 0.03));
    },
    cam(t) { const s = T.sc["s7-girassol"]; return keys(t, [[s[0], [1.8, 1.8, 3.4], [0.2, 1.4, -0.6]], [K.espirais, [0.3, 1.7, 1.7], [0.2, 1.6, -0.6]], [K.natureza, [0.25, 1.68, 1.3], [0.2, 1.6, -0.6]], [s[1], [1.6, 1.8, 2.6], [0.2, 1.4, -0.6]]]); },
  };
});

// 8 · o arremesso perfeito (câmera lenta)
addSet("s8-perfeito", (g) => {
  g.add(floorP(30, 30, M(0x1a1410)));
  const can = new THREE.Group(); can.position.set(0, 1.0, -4); g.add(can);
  const canBody = ol(mesh(cyl(0.09, 0.09, 0.26, 16), M(0xe63946), 0, 0, 0, can), 0.006);
  ol(mesh(cyl(0.3, 0.35, 1.0, 16), M(0x3a2a20), 0, -0.63, 0, can), 0.01);
  const shards = []; for (let i = 0; i < 16; i++) shards.push(mesh(box(0.06, 0.06, 0.01), M(i % 2 ? 0xe63946 : 0xd9d9d9), 0, 0, 0, g));
  const you = adult({ top: 0x3a5a7a }); you.position.set(0, 0, 1.2); you.rotation.y = Math.PI; g.add(you);
  const ball = steelBall(0.07); g.add(ball);
  const rings = [0, 1, 2, 3].map((i) => { const w = waves(3, 0xffc94a); g.add(w); return w; });
  const goldL = new THREE.PointLight(0xffc94a, 0, 6); g.add(goldL);
  return {
    bg: 0x0d0906,
    update(t) {
      still(you); breathe(you, t);
      const a = K.arremesso8, hit = K.perfeita;
      you.userData.arms[1].rotation.set(-2.4 * sm(seg(t, a - 0.6, a)) + seg(t, a, a + 0.4) * 2.0, 0, 0);
      const x = seg(t, a, hit);
      const p = new THREE.Vector3(lerp(0.3, 0, x), lerp(1.4, 1.0, x) + Math.sin(x * Math.PI) * 0.3, lerp(1.0, -4, x));
      ball.position.copy(p); ball.visible = t < hit + 0.1; ball.userData.ball.rotation.y = t * 25;
      rings.forEach((r, i) => { const k = seg(t, a + i * 0.25, a + i * 0.25 + 1.4); r.visible = k > 0 && k < 1 && t < hit + 0.6; r.position.copy(p); r.scale.setScalar(0.2 + k * 0.9); r.rotation.z = t * 3 + i; r.children.forEach((c) => (c.material.opacity = 1 - k)); });
      goldL.position.copy(p); goldL.intensity = x > 0 && x < 1 ? 6 : 0;
      const boom = t > hit;
      canBody.visible = !boom;
      shards.forEach((s, i) => { s.visible = boom; if (!boom) return; const dt = t - hit, a2 = (i / 16) * Math.PI * 2; s.position.set(Math.cos(a2 + dt * 6) * dt * 1.5, 1.0 + dt * 1.6 - dt * dt * 3, -4 + Math.sin(a2 + dt * 6) * dt * 1.5); s.rotation.set(dt * 9, dt * 7, 0); });
    },
    cam(t) { const s = T.sc["s8-perfeito"]; return keys(t, [[s[0], [1.2, 1.6, 2.6], [0, 1.3, 0.5]], [K.arremesso8, [0.8, 1.5, 1.6], [0, 1.3, 0]], [K.perfeita - 0.4, [0.7, 1.3, -2.6], [0, 1.0, -4]], [s[1], [1.4, 1.5, -2.2], [0, 1.0, -4]]]); },
  };
});

// 9 · a mão do avô
addSet("s9-avo", (g) => {
  g.add(floorP(10, 8, M(0xffffff, { map: rep(wood("#8a5a35", "#7d5030"), 4, 3) })));
  const wl = plane(10, 5, M(0xd9b48a)); wl.position.set(0, 2.5, -2.2); g.add(wl);
  for (let i = 0; i < 3; i++) mesh(new THREE.PlaneGeometry(0.5, 0.6), M(0xffffff, { map: textTex([["👴👵", "🎣", "👶"][i]], { w: 128, h: 160, bg: "#e9dcc4", size: 56, fg: "#333" }) }), -1.2 + i * 0.8, 2.2, -2.18, g);
  const chairG = new THREE.Group(); chairG.position.set(0, 0, -0.9); g.add(chairG);
  ol(mesh(box(1.0, 0.45, 0.9), M(0x7a1a2a), 0, 0.25, 0, chairG), 0.02); ol(mesh(box(1.0, 1.0, 0.25), M(0x7a1a2a), 0, 0.85, -0.38, chairG), 0.02);
  [-1, 1].forEach((s) => ol(mesh(box(0.18, 0.35, 0.9), M(0x6a1424), s * 0.55, 0.55, 0, chairG), 0.015));
  const lamp = new THREE.PointLight(0xffb36b, 7, 7); lamp.position.set(1.2, 2.0, 0.2); g.add(lamp);
  ol(mesh(cyl(0.02, 0.02, 1.6), M(0x333333), 1.3, 0.8, -0.8, g), 0.005); ol(mesh(cyl(0.15, 0.28, 0.3), M(0xffe1b0), 1.3, 1.7, -0.8, g), 0.01);
  const avo = adult({ top: 0x8a7a64, hair: 0xe8e8e8, style: "bald", glasses: true, skin: SK[0] }); avo.position.set(0, 0, -0.8); g.add(avo);
  sit(avo);
  const fingers = addFingers(avo);
  const ball = steelBall(0.05); g.add(ball);
  const wv = waves(3); wv.scale.setScalar(0.12); g.add(wv);
  return {
    bg: 0x2a1a10,
    update(t) {
      sit(avo); breathe(avo, t, 2, 0.4);
      const u = avo.userData; u.arms[1].rotation.set(-1.1, 0, 0.25); u.arms[0].rotation.set(-0.4, 0, -0.1);
      const hand = new THREE.Vector3(); u.arms[1].children[1].getWorldPosition(hand);
      ball.position.set(hand.x, hand.y + 0.07, hand.z + 0.03); ball.userData.ball.rotation.y = t * 3;
      wv.position.copy(ball.position); wv.rotation.x = -Math.PI / 2; wv.rotation.z = t * 1.5; wv.visible = t > K.gira - 0.2;
      const open = sm(seg(t, K.dedos - 0.2, K.dedos + 2.2));
      fingers.forEach((f, i) => { const o = sm(seg(open, i * 0.18, i * 0.18 + 0.4)); f.rotation.x = lerp(1.4, 0.1 + Math.sin(t * 3 + i) * 0.08 * o, o); });
      u.head.rotation.x = 0.3;
    },
    cam(t) { const s = T.sc["s9-avo"]; return keys(t, [[s[0], [1.6, 1.6, 2.4], [0, 1.1, -0.8]], [K.gira, [1.5, 1.75, 1.3], [0.2, 1.05, -0.4]], [K.dedos, [1.15, 1.5, 0.85], [0.3, 0.95, -0.2]], [s[1], [1.05, 1.45, 0.75], [0.3, 0.95, -0.2]]]); },
  };
});

// 10 · pergunta
addSet("s10-pergunta", (g) => {
  const stars = dustPts(400, [-8, 8, -6, 12, -12, -3]); stars.material.color.set(0xffe6b0); g.add(stars);
  const b1 = steelBall(0.45), b2 = steelBall(0.45); b1.position.set(-0.9, 3.0, 0); b2.position.set(0.9, 3.0, 0); g.add(b1, b2);
  const w1 = waves(3), w2 = waves(3); w1.position.copy(b1.position); w2.position.copy(b2.position); w1.scale.setScalar(1.3); w2.scale.setScalar(1.3); g.add(w1, w2);
  const key2 = new THREE.PointLight(0xffc94a, 6, 8); key2.position.set(0, 3.5, 2); g.add(key2);
  return {
    bg: 0x0a0705,
    update(t) { b1.userData.ball.rotation.y = t * 2; b2.userData.ball.rotation.y = -t * 2; w1.rotation.z = t; w2.rotation.z = -t; b1.position.y = 3.0 + Math.sin(t * 1.2) * 0.08; b2.position.y = 3.0 + Math.cos(t * 1.2) * 0.08; },
    cam(t) { const s = T.sc["s10-pergunta"]; return keys(t, [[s[0], [0, 2.6, 6.5], [0, 2.6, 0]], [s[1], [0, 2.6, 7.6], [0, 2.6, 0]]]); },
  };
});


function sceneAt(t) { for (const [n, a, b] of T.scenes) if (t >= a && t < b) return n; return T.scenes[T.scenes.length - 1][0]; }
function renderAt(t) {
  const n = sceneAt(t);
  for (const k in SETS) SETS[k].group.visible = k === n;
  const s = SETS[n]; s.update(t);
  const c = s.cam(t);
  camera.position.set(...c.pos); camera.lookAt(...c.look);
  camera.position.x += Math.sin(t * 1.1) * 0.012; camera.position.y += Math.sin(t * 1.5) * 0.01;
  scene.background = new THREE.Color(s.bg);
  scene.fog = new THREE.Fog(s.bg, 14, 70);
  renderer.render(scene, camera);
}
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady["rotacao3d"] = (async () => {
  try { await document.fonts.load("700 48px 'Space Mono'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
