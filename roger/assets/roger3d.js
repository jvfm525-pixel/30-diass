// Cena 3D do vídeo de curiosidade "Por que o Roger se entregou?" (silhueta e símbolos originais) (Three.js).
// Tudo é função do tempo t (hf-seek). Tempos-chave em window.HF_T (gerado por tools/build_roger.py).
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


// ---------------------------------------------------------------- símbolos originais
const dustPts = (n, b, color = 0xffe6b0, size = 0.02) => { const p = []; for (let i = 0; i < n; i++) p.push(b[0] + hash(i) * (b[1] - b[0]), b[2] + hash(i + 7) * (b[3] - b[2]), b[4] + hash(i + 13) * (b[5] - b[4])); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.85, depthWrite: false })); };
const SIL = new THREE.MeshBasicMaterial({ color: 0x07060a });
// silhueta genérica de capitão: capa longa e chapéu de abas largas (sempre em contraluz)
function captain() {
  const g = new THREE.Group();
  const legs = [-1, 1].map((s) => mesh(cap(0.09, 0.7), SIL, 0.11 * s, 0.45, 0, g));
  const coat = mesh(new THREE.CylinderGeometry(0.24, 0.42, 1.2, 16), SIL, 0, 1.05, 0, g);
  const chest = mesh(sph(0.3, 16, 12), SIL, 0, 1.6, 0, g); chest.scale.set(1.25, 0.9, 0.7);
  const head = mesh(sph(0.17, 16, 12), SIL, 0, 1.98, 0, g);
  const brim = mesh(cyl(0.38, 0.38, 0.03, 24), SIL, 0, 2.1, 0, g); brim.rotation.z = 0.08;
  const crown = mesh(cyl(0.16, 0.19, 0.2, 16), SIL, 0, 2.2, 0, g);
  const arms = [-1, 1].map((s) => { const a = new THREE.Group(); a.position.set(0.34 * s, 1.72, 0); g.add(a); mesh(cap(0.07, 0.6), SIL, 0, -0.36, 0, a); a.rotation.z = 0.12 * s; return a; });
  const capeGeo = new THREE.PlaneGeometry(1.1, 1.8, 10, 14);
  const cape = new THREE.Mesh(capeGeo, new THREE.MeshBasicMaterial({ color: 0x07060a, side: THREE.DoubleSide }));
  cape.position.set(0, 0.95, -0.22); g.add(cape);
  const base = capeGeo.attributes.position.array.slice();
  g.userData = { arms, head, cape, capeGeo, base };
  return g;
}
function capeWind(c, t, k = 1) {
  const u = c.userData, p = u.capeGeo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = u.base[i * 3], y = u.base[i * 3 + 1]; const d = (0.9 - y) / 1.8; p.setZ(i, -Math.max(0, d) * (0.5 + 0.25 * Math.sin(t * 3 + x * 3 + y * 2)) * k); p.setX(i, x * (1 + Math.max(0, d) * 0.3) + Math.sin(t * 2.4 + y * 3) * 0.06 * d * k); }
  p.needsUpdate = true;
}
function ship(sailColor = 0xf4f1e8, flagColor = 0x15121a, s = 1) {
  const g = new THREE.Group();
  const hullG = new THREE.CylinderGeometry(0.55 * s, 0.32 * s, 2.6 * s, 4, 1); hullG.rotateZ(Math.PI / 2); hullG.rotateX(Math.PI / 4);
  const hull = mesh(hullG, M(0x5a3b2b), 0, 0.35 * s, 0, g); hull.scale.set(1, 0.6, 0.75); ol(hull, 0.03 * s);
  mesh(box(2.2 * s, 0.06 * s, 0.6 * s), M(0x8a6248), 0, 0.62 * s, 0, g);
  [-0.6, 0.5].forEach((x, i) => {
    mesh(cyl(0.035 * s, 0.035 * s, 2.4 * s, 8), M(0x4a3020), x * s, 1.8 * s, 0, g);
    [0, 1].forEach((k) => { const sg = new THREE.PlaneGeometry(1.0 * s * (1 - k * 0.2), 0.7 * s, 6, 4); const pa = sg.attributes.position; for (let j = 0; j < pa.count; j++) pa.setZ(j, Math.cos(pa.getX(j) / (0.5 * s) * 1.2) * 0.12 * s); const sl = mesh(sg, new THREE.MeshToonMaterial({ color: sailColor, gradientMap: grad, side: THREE.DoubleSide }), x * s, (1.25 + k * 0.85) * s, 0.04, g); sl.rotation.y = Math.PI / 2; });
  });
  const flag = mesh(new THREE.PlaneGeometry(0.4 * s, 0.25 * s), new THREE.MeshBasicMaterial({ color: flagColor, side: THREE.DoubleSide }), -0.6 * s + 0.2 * s, 3.05 * s, 0, g); flag.rotation.y = Math.PI / 2;
  g.userData = { flag };
  return g;
}
function seaPlane(g, color, size = 120, seg = 70) {
  const geo = new THREE.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color, gradientMap: grad })); g.add(sea);
  const base = geo.attributes.position.array.slice();
  return (t, amp = 1) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; p.setY(i, (Math.sin(x * 0.35 + t * 1.3) * 0.22 + Math.sin(z * 0.5 + t * 0.9) * 0.18) * amp); } p.needsUpdate = true; geo.computeVertexNormals(); };
}
function gull() { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: 0xf2f2f2, side: THREE.DoubleSide }); const w = [-1, 1].map((s) => { const p = new THREE.Group(); g.add(p); mesh(new THREE.PlaneGeometry(0.3, 0.07), m, 0.15 * s, 0, 0, p); return p; }); g.userData = { w }; return g; }
function flap(b, t, i) { b.userData.w.forEach((w, k) => (w.rotation.x = (k ? 1 : -1) * Math.sin(t * 8 + i) * 0.6)); }
const sunGlowTex = canvasTex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,210,120,1)"); gr.addColorStop(1, "rgba(255,140,60,0)"); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });

// praça portuária com patíbulo (cenas 1, 8, 9 e thumb)
function harborSquare(g) {
  const sky = plane(120, 50, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#2a2a5a"], [0.55, "#e07a5f"], [1, "#ffd59a"]]) })); sky.position.set(0, 14, -40); g.add(sky);
  const sun = mesh(sph(2.2, 28, 20), new THREE.MeshBasicMaterial({ color: 0xffe2a0 }), 0, 4.2, -36, g);
  const glow = mesh(new THREE.PlaneGeometry(20, 20), glowM(0xffb36b, 0.6), 0, 4.2, -35.8, g); glow.material.map = sunGlowTex; glow.material.needsUpdate = true;
  g.add(floorP(60, 60, M(0xffffff, { map: rep(tiles("#8a7a68", "#7d6e5d", 6), 12, 12) })));
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) { const x = side * (5 + (i % 2)), z = -2 - i * 3.4; const h = 3 + hash(i + side) * 2; ol(mesh(box(2.6, h, 3), M([0xe9c46a, 0xf4a261, 0xe07a5f, 0x8ecae6, 0xf2e8cf][(i + (side > 0 ? 2 : 0)) % 5]), x, h / 2, z, g), 0.03); const r = mesh(new THREE.ConeGeometry(2.3, 1.1, 4), M(0x9d3a2a), x, h + 0.55, z, g); r.rotation.y = Math.PI / 4; for (let k = 0; k < 3; k++) mesh(box(0.4, 0.55, 0.02), M(0xfff1c9), x - side * 1.31, 1.0 + k * 1.0, z - 0.8 + k * 0.6, g).rotation.y = Math.PI / 2; }
  // patíbulo
  const sc = new THREE.Group(); sc.position.set(0, 0, -4); g.add(sc);
  ol(mesh(box(3.2, 1.6, 3.2), M(0x5a3b2b), 0, 0.8, 0, sc), 0.03);
  for (let i = 0; i < 6; i++) ol(mesh(box(1.2, 0.18, 0.4), M(0x6f4a2a), 0, 0.12 + i * 0.27, 1.8 + (5 - i) * 0.3, sc), 0.01);
  [-1.3, 1.3].forEach((x) => ol(mesh(box(0.2, 3.4, 0.2), M(0x4a3020), x, 3.3, -1.0, sc), 0.01));
  ol(mesh(box(3.0, 0.22, 0.24), M(0x4a3020), 0, 5.0, -1.0, sc), 0.01);
  // multidão em silhueta
  const crowd = []; for (let i = 0; i < 70; i++) { const p = new THREE.Group(); const x = (hash(i) - 0.5) * 9, z = 0.5 + hash(i + 3) * 6; p.position.set(x, 0, z); mesh(cap(0.18, 0.7), M(0x1c1a22), 0, 0.6, 0, p); mesh(sph(0.15, 10, 8), M(0x1c1a22), 0, 1.25, 0, p); g.add(p); crowd.push(p); }
  const gulls = []; for (let i = 0; i < 8; i++) { const b = gull(); g.add(b); gulls.push(b); }
  return { sun, glow, sc, crowd, gulls };
}

// 1 · a praça: ele sobe ao patíbulo
addSet("s1-praca", (g) => {
  const H = harborSquare(g);
  const cp = captain(); g.add(cp);
  return {
    bg: 0x2a2a5a,
    update(t) {
      const climb = sm(seg(t, 0.5, K.marinha + 0.5));
      cp.position.set(0, lerp(0, 1.6, climb), lerp(-1.9, -4.2, climb)); cp.rotation.y = Math.PI;
      capeWind(cp, t);
      H.crowd.forEach((p, i) => (p.position.y = Math.abs(Math.sin(t * 2 + i)) * 0.03));
      H.gulls.forEach((b, i) => { b.position.set(-8 + ((t * 1.2 + i * 2.5) % 16), 6 + (i % 3), -10 - (i % 4)); flap(b, t, i); });
    },
    cam(t) { const s = T.sc["s1-praca"]; return keys(t, [[s[0], [0, 2.0, 9], [0, 2.0, -4]], [K.marinha, [1.5, 2.4, 5.5], [0, 2.6, -4]], [s[1], [0.6, 2.0, 4.0], [0, 2.9, -4.2]]]); },
  };
});

// 2 · a rota pelo mundo até a última ilha
addSet("s2-rota", (g) => {
  const R = 1.6;
  const world = new THREE.Group(); world.position.set(0, 2.2, 0); g.add(world);
  const oceanTex = canvasTex(1024, 512, (c, w, h) => { c.fillStyle = "#13406b"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,255,255,.08)"; for (let x = 0; x < w; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let i = 0; i < 70; i++) { c.fillStyle = hash(i) > 0.5 ? "#4a8a4a" : "#6aa65a"; c.beginPath(); c.arc(hash(i + 3) * w, h * 0.2 + hash(i + 5) * h * 0.6, 4 + hash(i + 7) * 14, 0, 7); c.fill(); } c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(0, h * 0.48, w, 6); });
  const sp = mesh(new THREE.SphereGeometry(R, 48, 32), new THREE.MeshToonMaterial({ map: oceanTex, gradientMap: grad }), 0, 0, 0, world); ol(sp, 0.03);
  const pts = []; for (let i = 0; i <= 200; i++) { const a = (i / 200) * Math.PI * 2 * 0.95; pts.push(new THREE.Vector3(Math.cos(a) * R * 1.02, Math.sin(a * 3) * 0.12, Math.sin(a) * R * 1.02)); }
  const route = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffd27a })); world.add(route);
  const isle = mesh(sph(0.1, 12, 10), glowM(0xffd27a, 1), pts[200].x, pts[200].y, pts[200].z, world);
  const isleGlow = mesh(new THREE.PlaneGeometry(1.2, 1.2), glowM(0xffd27a, 0.8), pts[200].x * 1.05, pts[200].y, pts[200].z * 1.05, world); isleGlow.material.map = sunGlowTex; isleGlow.material.needsUpdate = true;
  const st = dustPts(400, [-10, 10, -6, 12, -14, -4], 0xffffff, 0.04); g.add(st);
  return {
    bg: 0x050814,
    update(t) {
      const s = T.sc["s2-rota"]; world.rotation.y = -0.6 + (t - s[0]) * 0.25; world.rotation.x = 0.35;
      route.geometry.setDrawRange(0, Math.floor(sm(seg(t, s[0] + 0.3, K.ilha2 + 0.8)) * 201));
      const on = t > K.tesouro - 0.4; isle.visible = isleGlow.visible = on; isleGlow.lookAt(camera.position); isleGlow.material.opacity = 0.6 + 0.3 * Math.sin(t * 4);
    },
    cam(t) { const s = T.sc["s2-rota"]; return keys(t, [[s[0], [0, 2.4, 6.8], [0, 2.2, 0]], [s[1], [0, 2.4, 5.4], [0, 2.2, 0]]]); },
  };
});

// 3 · "foi capturado?" (mar e navios da marinha genéricos)
addSet("s3-capturado", (g) => {
  const sky = plane(120, 50, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#3a4a66"], [1, "#a8b8c8"]]) })); sky.position.set(0, 12, -40); g.add(sky);
  const wav = seaPlane(g, 0x2a5a8a);
  const fleet = [0, 1, 2, 3].map((i) => { const s = ship(0xe9eef5, 0x3a86ff, 0.9); s.position.set(-6 + i * 4, 0, -10 - (i % 2) * 4); s.rotation.y = 0.3; g.add(s); return s; });
  return { bg: 0x3a4a66, update(t) { wav(t); fleet.forEach((s, i) => { s.position.y = Math.sin(t * 1.2 + i) * 0.12; s.rotation.z = Math.sin(t + i) * 0.04; }); }, cam(t) { return { pos: [0, 2.6, 7], look: [0, 1.5, -10] }; } };
});

// 4 · a ampulheta na cabine
addSet("s4-ampulheta", (g) => {
  g.add(floorP(10, 8, M(0xffffff, { map: rep(tiles("#6b4a35", "#5f412e", 6), 3, 3) })));
  const wl = plane(10, 5, M(0xffffff, { map: rep(canvasTex(256, 256, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#5a3b2b" : "#4f3324"; c.fillRect(0, i * 32, 256, 32); } }), 3, 2) })); wl.position.set(0, 2.5, -2.5); g.add(wl);
  const port = mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshBasicMaterial({ map: skyTex([[0, "#1a2440"], [1, "#e07a5f"]]) }), -1.4, 2.4, -2.48, g);
  mesh(new THREE.TorusGeometry(0.47, 0.06, 8, 24), M(0xc9a227), -1.4, 2.4, -2.45, g);
  ol(mesh(box(2.6, 0.1, 1.3), M(0x7a4a2a), 0, 1.0, -0.8, g), 0.02);
  mesh(new THREE.PlaneGeometry(1.2, 0.8), M(0xe9d8b0, { map: canvasTex(256, 170, (c) => { c.fillStyle = "#e9d8b0"; c.fillRect(0, 0, 256, 170); c.strokeStyle = "#7a5a3a"; c.lineWidth = 3; c.beginPath(); for (let i = 0; i < 30; i++) c.lineTo(20 + i * 7, 80 + Math.sin(i * 0.7) * 40); c.stroke(); c.fillStyle = "#c4122a"; c.beginPath(); c.arc(230, 70, 7, 0, 7); c.fill(); }) }), 0.5, 1.06, -0.8, g).rotation.x = -Math.PI / 2;
  const hg = new THREE.Group(); hg.position.set(-0.5, 1.05, -0.7); g.add(hg);
  [0.02, 0.58].forEach((y) => ol(mesh(cyl(0.22, 0.22, 0.04, 20), M(0x8a5a35), 0, y, 0, hg), 0.01));
  [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([x, z]) => mesh(cyl(0.015, 0.015, 0.56, 6), M(0x8a5a35), x, 0.3, z, hg));
  const glassM = new THREE.MeshPhongMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.3, shininess: 120, specular: 0xffffff });
  mesh(new THREE.ConeGeometry(0.16, 0.26, 20, 1, true), glassM, 0, 0.17, 0, hg).rotation.x = Math.PI;
  mesh(new THREE.ConeGeometry(0.16, 0.26, 20, 1, true), glassM, 0, 0.43, 0, hg);
  const top = mesh(new THREE.ConeGeometry(0.13, 0.2, 20), M(0xe9c46a), 0, 0.45, 0, hg);
  const bot = mesh(new THREE.ConeGeometry(0.13, 0.2, 20), M(0xe9c46a), 0, 0.12, 0, hg);
  const stream = mesh(cyl(0.006, 0.006, 0.2, 6), M(0xe9c46a), 0, 0.27, 0, hg);
  const lamp = new THREE.PointLight(0xffb36b, 6, 6); lamp.position.set(0.8, 1.9, 0); g.add(lamp);
  const lan = mesh(sph(0.1, 12, 10), glowM(0xffc27a, 1), 0.8, 1.7, -0.6, g);
  return {
    bg: 0x1a120c,
    update(t) {
      const s = T.sc["s4-ampulheta"], k = seg(t, s[0], s[1]);
      top.scale.set(1 - k * 0.85, 1 - k * 0.85, 1 - k * 0.85); bot.scale.set(0.15 + k * 0.85, 0.15 + k * 0.85, 0.15 + k * 0.85); bot.position.y = 0.06 + 0.06 * k;
      lamp.intensity = 5.5 + Math.sin(t * 7) * 0.5;
    },
    cam(t) { const s = T.sc["s4-ampulheta"]; return keys(t, [[s[0], [1.4, 1.8, 1.8], [-0.4, 1.3, -0.7]], [s[1], [0.2, 1.45, 0.4], [-0.5, 1.3, -0.7]]]); },
  };
});

// 5 · "desistiu?" (navio na noite)
addSet("s5-desistiu", (g) => {
  const sky = plane(120, 50, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#05070f"], [1, "#1d2a4a"]]) })); sky.position.set(0, 12, -40); g.add(sky);
  const wav = seaPlane(g, 0x14283c);
  const s1 = ship(0xf4f1e8, 0x15121a, 1.2); s1.position.set(0, 0, -6); s1.rotation.y = 0.6; g.add(s1);
  const st = dustPts(300, [-20, 20, 4, 16, -38, -30], 0xffffff, 0.06); g.add(st);
  const moon = mesh(sph(1.2, 24, 18), new THREE.MeshBasicMaterial({ color: 0xfff4c2 }), 6, 9, -34, g);
  const ml = new THREE.DirectionalLight(0x9fb8ff, 1.2); ml.position.set(4, 6, -6); g.add(ml);
  return { bg: 0x05070f, update(t) { wav(t, 0.8); s1.position.y = Math.sin(t * 1.1) * 0.1; s1.rotation.z = Math.sin(t * 0.8) * 0.05; }, cam() { return { pos: [2.5, 2.4, 4], look: [0, 1.6, -6] }; } };
});

// 6 · a ilha dourada e a pedra antiga
addSet("s6-ilha", (g) => {
  const sky = plane(120, 50, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#3a1a5a"], [0.6, "#e07a5f"], [1, "#ffd59a"]]) })); sky.position.set(0, 12, -40); g.add(sky);
  const wav = seaPlane(g, 0x2a6a8a);
  ol(mesh(cyl(6, 7, 0.6, 32), M(0xe9c46a), 0, 0.2, -4, g), 0.04);
  for (let i = 0; i < 6; i++) { const tr = new THREE.Group(); tr.position.set(-4 + i * 1.6, 0.5, -7 + (i % 2)); g.add(tr); mesh(cyl(0.08, 0.12, 2.2, 6), M(0x8a6248), 0, 1.1, 0, tr).rotation.z = (hash(i) - 0.5) * 0.4; for (let k = 0; k < 5; k++) { const l = mesh(new THREE.PlaneGeometry(1.1, 0.25), new THREE.MeshToonMaterial({ color: 0x3f8a3a, gradientMap: grad, side: THREE.DoubleSide }), 0, 2.2, 0, tr); l.rotation.set(0.4, (k / 5) * Math.PI * 2, 0); l.translateX(0.5); } }
  const glyphs = canvasTex(256, 256, (c) => { c.fillStyle = "#1a2a4a"; c.fillRect(0, 0, 256, 256); c.fillStyle = "#c9e8ff"; for (let i = 0; i < 64; i++) { const x = 20 + (i % 8) * 28, y = 24 + Math.floor(i / 8) * 28; c.fillRect(x + (hash(i) * 6), y, 4 + hash(i + 2) * 10, 3); c.fillRect(x, y + 6 + hash(i + 3) * 6, 3, 6 + hash(i + 4) * 6); } });
  const stone = ol(mesh(box(1.6, 1.6, 1.6), new THREE.MeshToonMaterial({ map: glyphs, gradientMap: grad }), 1.2, 1.3, -4.5, g), 0.03); stone.rotation.y = -0.4;
  const gold = new THREE.PointLight(0xffd27a, 8, 10); gold.position.set(1.2, 3, -3); g.add(gold);
  const sparkle = dustPts(200, [-3, 4, 0.6, 4, -7, -2], 0xffd27a, 0.05); g.add(sparkle);
  const cp = captain(); cp.position.set(-0.6, 0.5, -3.4); cp.rotation.y = 2.2; g.add(cp);
  return {
    bg: 0x3a1a5a,
    update(t) {
      wav(t, 0.6); capeWind(cp, t, 0.8);
      const laugh = t > K.rir - 0.2 && t < K.rir + 2.2; cp.position.y = 0.5 + (laugh ? Math.abs(Math.sin(t * 14)) * 0.05 : 0); cp.userData.head.rotation.x = laugh ? -0.3 : 0;
      sparkle.position.y = (t * 0.3) % 1; gold.intensity = 7 + Math.sin(t * 3) * 1.5;
    },
    cam(t) { const s = T.sc["s6-ilha"]; return keys(t, [[s[0], [4.5, 3.2, 5], [0.4, 1.2, -4]], [K.cedo, [3.6, 2.4, 2.2], [0.2, 1.6, -4]], [s[1], [-3.0, 2.2, 2.6], [0.4, 1.6, -4]]]); },
  };
});

// 7 · o bando se separa
addSet("s7-bando", (g) => {
  const sky = plane(120, 50, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#14183a"], [0.7, "#4a3a6a"], [1, "#b8705a"]]) })); sky.position.set(0, 12, -40); g.add(sky);
  const wav = seaPlane(g, 0x1d3a5a);
  ol(mesh(box(2.4, 0.3, 10), M(0x6f4a2a), -3, 0.3, 0, g), 0.02);
  const lanterns = []; for (let i = 0; i < 6; i++) { mesh(cyl(0.05, 0.05, 1.2, 6), M(0x3a2a20), -2.0, 0.9, 3 - i * 1.6, g); lanterns.push(mesh(sph(0.13, 12, 10), glowM(0xffc27a, 1), -2.0, 1.55, 3 - i * 1.6, g)); }
  const sh = ship(0xf4f1e8, 0x15121a, 1.2); g.add(sh);
  const cp = captain(); cp.position.set(-3, 0.45, 2.6); cp.rotation.y = Math.PI * 0.75; g.add(cp);
  return {
    bg: 0x14183a,
    update(t) {
      const s = T.sc["s7-bando"]; wav(t, 0.6); capeWind(cp, t, 0.6);
      const go = seg(t, s[0], s[1]); sh.position.set(lerp(1, 6, go), Math.sin(t) * 0.08, lerp(-3, -22, go)); sh.rotation.y = 0.3;
      lanterns.forEach((l, i) => (l.visible = t < s[0] + 1 + i * ((s[1] - s[0] - 1.5) / 6)));
    },
    cam(t) { const s = T.sc["s7-bando"]; return keys(t, [[s[0], [-0.8, 2.2, 7.0], [1.0, 1.2, -6]], [s[1], [-0.4, 2.0, 6.0], [2.5, 1.4, -14]]]); },
  };
});

// 8 · de volta à praça: ele escolheu o lugar
addSet("s8-praca", (g) => {
  const H = harborSquare(g);
  const cp = captain(); cp.position.set(0, 1.6, -4.2); cp.rotation.y = Math.PI; g.add(cp);
  return {
    bg: 0x2a2a5a,
    update(t) { capeWind(cp, t); cp.userData.head.rotation.x = -0.15; H.gulls.forEach((b, i) => { b.position.set(-8 + ((t * 1.2 + i * 2.5) % 16), 6 + (i % 3), -10 - (i % 4)); flap(b, t, i); }); },
    cam(t) { const s = T.sc["s8-praca"]; return keys(t, [[s[0], [0, 1.0, 6], [0, 1.6, -4]], [s[1], [0.8, 2.4, 1.2], [0, 3.2, -4.2]]]); },
  };
});

// 9 · a resposta: a onda dourada atravessa o mar
addSet("s9-resposta", (g) => {
  const H = harborSquare(g);
  const cp = captain(); cp.position.set(0, 1.6, -4.2); cp.rotation.y = Math.PI; g.add(cp);
  const rings = [0, 1, 2].map(() => { const r = mesh(new THREE.TorusGeometry(1, 0.05, 8, 80), glowM(0xffd27a, 0.9), 0, 3.0, -4.2, g); r.rotation.x = Math.PI / 2; return r; });
  return {
    bg: 0x2a2a5a,
    update(t) {
      capeWind(cp, t, 1.2); cp.userData.arms[1].rotation.set(-2.6 * sm(seg(t, K.disse - 0.3, K.disse + 0.4)), 0, -0.2);
      rings.forEach((r, i) => { const k = ((t - K.disse - i * 0.7) / 2.4); const v = k > 0 ? k % 1 : -1; r.visible = v >= 0; r.scale.setScalar(1 + v * 18); r.material.opacity = 0.45 * (1 - v); });
      H.crowd.forEach((p, i) => (p.position.y = t > K.frase ? Math.abs(Math.sin(t * 6 + i)) * 0.08 : 0));
    },
    cam(t) { const s = T.sc["s9-resposta"]; return keys(t, [[s[0], [1.2, 2.4, 3.2], [0, 3.0, -4.2]], [K.frase, [0, 4.2, 7], [0, 2.6, -4]], [s[1], [0, 7, 12], [0, 2, -8]]]); },
  };
});

// 10 · a nova era: centenas de navios
addSet("s10-era", (g) => {
  const sky = plane(160, 60, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#4a6aa8"], [0.6, "#ffb38a"], [1, "#ffe2a0"]]) })); sky.position.set(0, 14, -60); g.add(sky);
  const sun = mesh(sph(3, 28, 20), new THREE.MeshBasicMaterial({ color: 0xfff1c9 }), 0, 3, -56, g);
  const wav = seaPlane(g, 0x2a6aa8, 160, 80);
  const cols = [0xf4f1e8, 0xffd27a, 0xff8a8a, 0x8ad8ff, 0xb08aff, 0x8ce99a];
  const ships = []; for (let i = 0; i < 46; i++) { const s = ship(cols[i % cols.length], 0x15121a, 0.6 + hash(i) * 0.3); s.position.set((hash(i + 3) - 0.5) * 40, 0, -6 - hash(i + 5) * 40); s.rotation.y = Math.PI / 2 + (hash(i + 7) - 0.5) * 0.5; g.add(s); ships.push(s); }
  const gulls = []; for (let i = 0; i < 12; i++) { const b = gull(); g.add(b); gulls.push(b); }
  return {
    bg: 0x4a6aa8,
    update(t) {
      const s = T.sc["s10-era"], dt = t - s[0]; wav(t, 0.7);
      ships.forEach((sh, i) => { sh.position.z = -6 - hash(i + 5) * 40 - dt * (0.8 + hash(i) * 0.6); sh.position.y = Math.sin(t * 1.2 + i) * 0.08; });
      gulls.forEach((b, i) => { b.position.set(-10 + ((dt * 2 + i * 1.8) % 20), 4 + (i % 4) * 0.6, -4 - (i % 3)); flap(b, t, i); });
    },
    cam(t) { const s = T.sc["s10-era"]; return keys(t, [[s[0], [0, 3, 8], [0, 1.5, -20]], [s[1], [0, 6, 10], [0, 1, -30]]]); },
  };
});

// 11 · pergunta
addSet("s11-pergunta", (g) => {
  const sky = plane(160, 60, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#14183a"], [1, "#e07a5f"]]) })); sky.position.set(0, 14, -60); g.add(sky);
  const wav = seaPlane(g, 0x1d3a5a);
  const cp = captain(); cp.position.set(0, 0.3, -5); cp.rotation.y = Math.PI; cp.scale.setScalar(1.2); g.add(cp);
  ol(mesh(box(3, 0.3, 3), M(0x5a3b2b), 0, 0.15, -5, g), 0.02);
  return { bg: 0x14183a, update(t) { wav(t, 0.5); capeWind(cp, t); }, cam() { return { pos: [0, 1.5, 7.5], look: [0, 1.1, -5] }; } };
});

// thumb
addSet("thumb", (g) => {
  const H = harborSquare(g);
  const cp = captain(); cp.position.set(0, 1.6, -4.2); cp.rotation.y = Math.PI; cp.scale.setScalar(1.05); g.add(cp);
  return { bg: 0x2a2a5a, update() { capeWind(cp, 1.3, 1.3); H.gulls.forEach((b, i) => { b.position.set(-3 + i * 0.9, 6.5 + (i % 3) * 0.5, -8); flap(b, 1, i); }); }, cam() { return { pos: [0, 1.4, 4.2], look: [0, 3.2, -4.2] }; } };
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
window.__hf.buildReady["roger3d"] = (async () => {
  try { await document.fonts.load("700 48px 'Space Mono'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
