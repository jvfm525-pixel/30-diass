// Cena 3D do vídeo de curiosidade "O final de cada personagem de Edgerunners 2" (silhuetas originais) (Three.js).
// Tudo é função do tempo t (hf-seek). Tempos-chave em window.HF_T (gerado por tools/build_edge2.py).
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


// ---------------------------------------------------------------- base: silhuetas e símbolos originais (nada desenhado da série)
rim.color.set(0xff4fd8); rim.intensity = 0.8;
hemi.color.set(0x8a9cff); hemi.groundColor.set(0x14081e);
const ADD = THREE.AdditiveBlending, NORM = THREE.NormalBlending;
const softTex = canvasTex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,.6)"); gr.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
function dustPts(n, b, color = 0xffe6b0, size = 0.06, opacity = 0.85, blending = ADD, seed = 0) {
  const p = [];
  for (let i = 0; i < n; i++) { const j = i + seed * 997; p.push(b[0] + hash(j) * (b[1] - b[0]), b[2] + hash(j + 7) * (b[3] - b[2]), b[4] + hash(j + 13) * (b[5] - b[4])); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color, size, map: softTex, transparent: true, opacity, depthWrite: false, blending }));
}
function flowPts(n, color, size = 0.06, blending = ADD) {
  const pos = new Float32Array(n * 3); const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: softTex, transparent: true, depthWrite: false, blending }));
  return { pts, pos, geo, upd() { geo.attributes.position.needsUpdate = true; } };
}
function glowSprite(color, size = 1, opacity = 0.8, blending = ADD) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color, transparent: true, opacity, depthWrite: false, blending })); s.scale.setScalar(size); return s; }
function glowPlane(color, w, d, opacity = 0.5) { const p = mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: softTex, color, transparent: true, opacity, depthWrite: false, blending: ADD })); p.rotation.x = -Math.PI / 2; return p; }
const SIL = new THREE.MeshBasicMaterial({ color: 0x07060c });
const SIL2 = new THREE.MeshBasicMaterial({ color: 0x07060c, side: THREE.DoubleSide });
const rimCache = {};
function rimMat(color, opacity = 0.8) { const k = color + "_" + opacity; return rimCache[k] || (rimCache[k] = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, transparent: true, opacity })); }
const C_D = 0xffe14d, C_TALIA = 0x4dffa6, C_WEAK = 0x4ff0ff, C_AVIDA = 0xff7ab8, C_KIRIL = 0xff4d6d, C_KYOKO = 0x7ab8ff, C_ROMAN = 0x9dff6a;

// ---------------------------------------------------------------- texturas
function sandTex() { return canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#5a2e24"; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { const r = hash(i + 300); g.fillStyle = r > 0.66 ? "#6e3a2c" : r > 0.33 ? "#4a241c" : "#7a4632"; g.fillRect(hash(i + 301) * w, hash(i + 302) * h, 2 + r * 3, 1 + r * 2); } }); }
function tileTex(c1 = "#d8e2ea", c2 = "#c4d0da", grout = "#8a98a6") { return canvasTex(256, 256, (g) => { g.fillStyle = grout; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? c1 : c2; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); } }); }
function wetTex() { return canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#0c0a14"; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${120 + Math.floor(hash(i) * 100)},${80 + Math.floor(hash(i + 1) * 120)},${180 + Math.floor(hash(i + 2) * 70)},0.10)`; g.fillRect(hash(i + 3) * w, hash(i + 4) * h, 2, 10 + hash(i + 5) * 30); } g.fillStyle = "rgba(255,255,255,.05)"; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 2, h); }); }
const FAC = [0, 1, 2, 3, 4, 5].map((s) => canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = "#0b0a16"; g.fillRect(0, 0, w, h);
  const cols = ["#4ff0ff", "#ff4fd8", "#b07aff", "#ffe14d", "#ffb36b", "#9fd8ff"];
  for (let y = 6; y < h - 6; y += 10) for (let x = 6; x < w - 6; x += 12) { const r = hash(s * 131 + x * 7 + y * 13); if (r < 0.42) continue; g.fillStyle = r > 0.93 ? cols[Math.floor(hash(s + x + y) * 6)] : r > 0.75 ? "#c8b48a" : "#2a2440"; g.fillRect(x, y, 7, 5); }
  if (s % 2) { g.fillStyle = cols[s % 6]; g.fillRect(w - 8, 0, 3, h); }
}));
function facade(i, rx, ry) { const t = FAC[i % FAC.length].clone(); t.needsUpdate = true; return rep(t, rx, ry); }

// ---------------------------------------------------------------- pessoas (silhuetas genéricas com contorno neon)
function person(o = {}) {
  const s = o.scale ?? 1, big = o.build === "big", slim = o.build === "slim", kid = o.build === "kid";
  const sc = kid ? 0.62 * s : big ? 1.12 * s : s;
  const W = big ? 1.3 : slim ? 0.84 : 1;
  const m = o.mat || SIL;
  const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
  const parts = [];
  const legs = [-1, 1].map((k) => { const l = new THREE.Group(); l.position.set(0.1 * k * sc * W, 0.78 * sc, 0); body.add(l); parts.push(mesh(cap(0.075 * sc * W, 0.6 * sc), m, 0, -0.38 * sc, 0, l)); return l; });
  const torso = mesh(cap(0.2 * sc * W, 0.45 * sc), m, 0, 1.05 * sc, 0, body); torso.scale.z = 0.75; parts.push(torso);
  if (o.coat) parts.push(mesh(new THREE.CylinderGeometry(0.2 * sc * W, 0.34 * sc * W, 0.9 * sc, 14, 1, true), o.mat || SIL2, 0, 0.62 * sc, 0, body));
  const head = mesh(sph(0.15 * sc, 16, 12), m, 0, 1.53 * sc, 0, body); parts.push(head);
  if (o.hair === "bun") parts.push(mesh(sph(0.07 * sc, 10, 8), m, 0, 0.12 * sc, -0.1 * sc, head));
  if (o.hair === "long") parts.push(mesh(cap(0.12 * sc, 0.28 * sc), m, 0, -0.12 * sc, -0.07 * sc, head));
  if (o.hood) parts.push(mesh(new THREE.SphereGeometry(0.19 * sc, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), m, 0, 0.02 * sc, -0.02 * sc, head));
  const arms = [-1, 1].map((k) => { const a = new THREE.Group(); a.position.set(0.27 * k * sc * W, 1.3 * sc, 0); body.add(a); parts.push(mesh(cap(0.06 * sc * W, 0.48 * sc), m, 0, -0.3 * sc, 0, a)); a.rotation.z = 0.12 * k; return a; });
  if (o.rim != null) parts.forEach((p) => ol(p, 0.018 * (sc + 0.3), rimMat(o.rim, o.rimOp ?? 0.8)));
  g.userData = { body, legs, arms, head, torso, sc };
  return g;
}
function standPose(p) { const u = p.userData; u.legs.forEach((l) => l.rotation.set(0, 0, 0)); u.arms.forEach((a, i) => a.rotation.set(0, 0, (i ? 1 : -1) * 0.12)); u.body.position.y = 0; u.body.rotation.set(0, 0, 0); }
function runCycle(p, t, amt = 1, speed = 1) { const u = p.userData, c = t * 9 * speed; u.legs[0].rotation.x = Math.sin(c) * 0.75 * amt; u.legs[1].rotation.x = -Math.sin(c) * 0.75 * amt; u.arms[0].rotation.x = -Math.sin(c) * 0.7 * amt; u.arms[1].rotation.x = Math.sin(c) * 0.7 * amt; u.body.position.y = Math.abs(Math.cos(c)) * 0.06 * amt; }
function breathe2(p, t, i = 0) { const u = p.userData; u.torso.scale.y = 1 + Math.sin(t * 2.2 + i) * 0.015; u.head.position.y = 1.53 * u.sc + Math.sin(t * 2.2 + i) * 0.004; }
function kneel(p, k) { const u = p.userData; u.legs[0].rotation.x = -1.5 * k; u.legs[1].rotation.x = 0.35 * k; u.body.position.y = -0.36 * u.sc * k; }
function soldier() { const p = person({ rim: 0xff3355, rimOp: 0.5 }); const u = p.userData; const vis = mesh(box(0.2, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xff2a3a }), 0, 0.01, 0.14, u.head); const vg = glowSprite(0xff2a3a, 0.35, 0.8); vg.position.set(0, 0.01, 0.16); u.head.add(vg); mesh(sph(0.17, 14, 10), SIL, 0, 0.04, 0, u.head).scale.set(1, 0.85, 1.05); const gun = mesh(box(0.06, 0.08, 0.6), M(0x1a1a20), 0.1, -0.5, 0.25, u.arms[1]); u.arms[1].rotation.x = -1.2; u.arms[0].rotation.x = -1.0; p.userData.vg = vg; return p; }

// ---------------------------------------------------------------- objetos
function neonSign(g, text, col, x, y, z, w, h, rotY = 0, vertical = false) {
  const css = "#" + new THREE.Color(col).getHexString();
  const cw = vertical ? 128 : 512, ch = vertical ? 512 : 128;
  const tex = canvasTex(cw, ch, (c) => { c.clearRect(0, 0, cw, ch); c.fillStyle = "rgba(10,6,20,0.85)"; c.fillRect(0, 0, cw, ch); c.strokeStyle = css; c.lineWidth = 6; c.strokeRect(6, 6, cw - 12, ch - 12); c.fillStyle = "#ffffff"; c.shadowColor = css; c.shadowBlur = 22; c.textAlign = "center"; c.textBaseline = "middle"; if (vertical) { c.font = "700 84px 'Archivo Black', sans-serif"; const L = [...text]; L.forEach((k, i) => c.fillText(k, cw / 2, ((i + 0.5) * ch) / L.length)); } else { c.font = "700 78px 'Archivo Black', sans-serif"; c.fillText(text, cw / 2, ch / 2 + 4); } });
  const p = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }), x, y, z, g); p.rotation.y = rotY;
  const gl = glowSprite(col, Math.max(w, h) * 1.5, 0.3); gl.position.set(x, y, z); g.add(gl);
  return { p, gl };
}
function tower(g, x, z, w, h, d, seed) {
  const top = new THREE.MeshBasicMaterial({ color: 0x0b0a16 });
  const mats = [0, 1, 2, 3, 4, 5].map((i) => (i === 2 || i === 3 ? top : new THREE.MeshBasicMaterial({ map: facade(seed + i, Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 7))) })));
  mesh(new THREE.BoxGeometry(w, h, d), mats, x, h / 2, z, g);
  if (hash(seed + 1) > 0.35) { mesh(cyl(0.05, 0.08, 3, 6), top, x + w * 0.2, h + 1.5, z, g); const bl = glowSprite(0xff3355, 0.9, 0.9); bl.position.set(x + w * 0.2, h + 3.05, z); g.add(bl); }
}
function flyCar(g) { const c = new THREE.Group(); mesh(box(0.9, 0.22, 0.42), new THREE.MeshBasicMaterial({ color: 0x14121e }), 0, 0, 0, c); [-1, 1].forEach((k) => { const h = glowSprite(0xffffff, 0.35, 0.95); h.position.set(0.47, 0, 0.13 * k); c.add(h); const r = glowSprite(0xff3355, 0.3, 0.9); r.position.set(-0.47, 0, 0.13 * k); c.add(r); }); g.add(c); return c; }
function urn(s = 1) { const pts = [[0, 0], [0.07, 0], [0.09, 0.03], [0.1, 0.1], [0.085, 0.16], [0.06, 0.19], [0.065, 0.22], [0.04, 0.24], [0.001, 0.25]].map(([x, y]) => new THREE.Vector2(x * s, y * s)); const g = new THREE.Group(); ol(mesh(new THREE.LatheGeometry(pts, 20), M(0xb89a5a), 0, 0, 0, g), 0.004); mesh(new THREE.TorusGeometry(0.092 * s, 0.006 * s, 6, 24), M(0xe8d08a), 0, 0.11 * s, 0, g).rotation.x = Math.PI / 2; return g; }
function pistol() { const g = new THREE.Group(); const m = M(0x1c1c22); const slide = mesh(box(0.05, 0.05, 0.22), m, 0, 0.02, 0.05, g); mesh(box(0.045, 0.12, 0.05), m, 0, -0.05, -0.02, g).rotation.x = 0.25; mesh(box(0.012, 0.02, 0.24), M(0xc8c8d0), 0, 0.048, 0.05, g); g.userData = { slide }; return g; }
function filmCamera() {
  const g = new THREE.Group(); const m = M(0x2a2a30); const hd = new THREE.Group(); g.add(hd);
  ol(mesh(box(0.34, 0.24, 0.18), m, 0, 0, 0, hd), 0.008);
  const reels = [-0.08, 0.1].map((x) => { const r = mesh(cyl(0.1, 0.1, 0.03, 18), M(0x3a3a44), x, 0.2, 0, hd); r.rotation.x = Math.PI / 2; mesh(box(0.15, 0.031, 0.012), M(0x8a8a96), 0, 0, 0, r); return r; });
  const lens = mesh(cyl(0.05, 0.06, 0.12, 14), M(0x14141a), 0, 0, 0.14, hd); lens.rotation.x = Math.PI / 2;
  mesh(new THREE.CircleGeometry(0.045, 16), new THREE.MeshBasicMaterial({ color: 0x5ab8ff }), 0, 0, 0.201, hd);
  const rec = mesh(sph(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a3a }), 0.13, 0.08, 0.091, hd); const rg = glowSprite(0xff2a3a, 0.14, 0.9); rg.position.copy(rec.position); hd.add(rg);
  const tri = new THREE.Group(); tri.position.y = -0.12; g.add(tri);
  [0, 1, 2].forEach((i) => { const a = (i / 3) * Math.PI * 2 + 0.5; const l = mesh(cyl(0.012, 0.012, 1.15, 6), M(0x1a1a20), Math.cos(a) * 0.17, -0.55, Math.sin(a) * 0.17, tri); l.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); });
  g.userData = { reels, rec, rg, hd };
  return g;
}
function capriForm(s = 1) { // entidade digital original: silhueta feita de partículas e anéis
  const g = new THREE.Group(); const pts = [];
  const add = (cx, cy, cz, rx, ry, rz, n, sd) => { for (let i = 0; i < n; i++) { const u = hash(i * 3 + sd) * 2 - 1, v = hash(i * 5 + 7 + sd) * 2 - 1, w = hash(i * 7 + 11 + sd) * 2 - 1; const l = Math.hypot(u, v, w) || 1; const r = Math.cbrt(hash(i + 99 + sd)); pts.push(cx + (u / l) * rx * r, cy + (v / l) * ry * r, cz + (w / l) * rz * r); } };
  add(0, 1.55, 0, 0.14, 0.17, 0.14, 160, 1); add(0, 1.05, 0, 0.22, 0.4, 0.14, 420, 2); add(-0.1, 0.4, 0, 0.08, 0.38, 0.08, 160, 3); add(0.1, 0.4, 0, 0.08, 0.38, 0.08, 160, 4); add(-0.3, 1.05, 0, 0.06, 0.32, 0.06, 110, 5); add(0.3, 1.05, 0, 0.06, 0.32, 0.06, 110, 6);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const P = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffb8f0, size: 0.035, map: softTex, transparent: true, opacity: 0.95, depthWrite: false, blending: ADD })); g.add(P);
  const r1 = mesh(new THREE.TorusGeometry(0.42, 0.012, 6, 64), glowM(0xff8ae8, 0.8), 0, 1.0, 0, g);
  const r2 = mesh(new THREE.TorusGeometry(0.55, 0.008, 6, 64), glowM(0xffd6ff, 0.6), 0, 1.25, 0, g);
  const halo = glowSprite(0xff6ad8, 2.2, 0.35); halo.position.y = 1.0; g.add(halo);
  g.scale.setScalar(s); g.userData = { P, r1, r2, halo };
  return g;
}
function capriIdle(c, t, k = 1) { const u = c.userData; u.r1.rotation.set(Math.PI / 2 + Math.sin(t) * 0.3, t * 1.3, 0); u.r2.rotation.set(Math.PI / 2 - 0.4, -t * 0.9, Math.sin(t * 0.7) * 0.4); u.P.material.opacity = (0.75 + 0.2 * Math.sin(t * 9)) * k; u.halo.material.opacity = (0.3 + 0.08 * Math.sin(t * 3)) * k; u.r1.material.opacity = 0.8 * k; u.r2.material.opacity = 0.6 * k; }
function holoText(text, col, w = 1, h = 0.5) { const css = "#" + new THREE.Color(col).getHexString(); const tex = canvasTex(512, 256, (c) => { c.clearRect(0, 0, 512, 256); c.fillStyle = css; c.shadowColor = css; c.shadowBlur = 30; c.font = "700 170px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 256, 136); }); return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: ADD, side: THREE.DoubleSide })); }
function boom(g, size = 1) { // explosão: luz, fogo, fumaça e destroços (sempre no grupo; some por opacidade)
  const b = new THREE.Group(); g.add(b);
  const smoke = glowSprite(0x2a2026, 1, 0, NORM), fire = glowSprite(0xff7a2a, 1, 0), core = glowSprite(0xfff0c0, 1, 0); b.add(smoke, fire, core);
  const L = new THREE.PointLight(0xff8a3a, 0, 18 * size); b.add(L);
  const deb = []; for (let i = 0; i < 10; i++) deb.push(mesh(box(0.12 * size, 0.08 * size, 0.1 * size), M(0x2a2228), 0, -50, 0, b));
  return {
    b, set(t0, t) {
      const k = t - t0; const on = k >= 0 && k < 2.6;
      [smoke, fire, core].forEach((s) => (s.visible = on)); deb.forEach((d) => (d.visible = on)); L.intensity = on ? 14 * Math.max(0, 1 - k / 0.9) : 0; if (!on) return;
      const e = Math.min(1, k / 0.25);
      core.scale.setScalar((0.5 + e * 3.2) * size); core.material.opacity = Math.max(0, 1 - k / 0.5);
      fire.scale.setScalar((1 + e * 5 + k) * size); fire.material.opacity = Math.max(0, 0.95 - k / 1.4);
      smoke.scale.setScalar((2 + k * 3.2) * size); smoke.material.opacity = Math.min(0.7, k * 1.5) * Math.max(0, 1 - k / 2.6); smoke.position.y = k * 1.2 * size;
      deb.forEach((d, i) => { const a = hash(i + 3) * 6.28, v = (2 + hash(i + 4) * 4) * size; d.position.set(Math.cos(a) * v * k, Math.max(0, (4 + hash(i) * 2) * k - 4.9 * k * k) * size, Math.sin(a) * v * k); d.rotation.set(k * 7 + i, k * 5, 0); });
    },
  };
}
function missile(g) { const m = new THREE.Group(); mesh(cyl(0.07, 0.07, 0.8, 8), M(0x9a9aa6), 0, 0, 0, m); const f = glowSprite(0xffa040, 1.0, 0.95); f.position.y = 0.5; m.add(f); g.add(m); const tr = flowPts(40, 0x9a8a9a, 0.5, NORM); tr.pts.material.opacity = 0.45; g.add(tr.pts); return { m, f, tr }; }
function badlands(g, o = {}) {
  const sd = o.seed || 1;
  const sky = plane(200, 90, new THREE.MeshBasicMaterial({ map: skyTex(o.sky || [[0, "#0c0614"], [0.55, "#2a0f2a"], [1, "#6a2a2a"]]), fog: false })); sky.position.set(0, 22, -64); g.add(sky);
  const st = dustPts(380, [-90, 90, 8, 66, -62, -61], 0xffffff, 0.3, 0.9, ADD, sd); st.material.fog = false; g.add(st);
  if (o.moon !== false) { const mp = o.moon || [-16, 17, -58]; mesh(sph(o.moonR || 3, 28, 20), new THREE.MeshBasicMaterial({ color: o.moonCol || 0xffd8c8, fog: false }), mp[0], mp[1], mp[2], g); const mg = glowSprite(o.moonCol || 0xffb8a0, (o.moonR || 3) * 6, 0.4); mg.material.fog = false; mg.position.set(mp[0], mp[1], mp[2] + 0.5); g.add(mg); }
  g.add(floorP(220, 220, M(0xffffff, { map: rep(sandTex(), 44, 44) })));
  for (let i = 0; i < 9; i++) { const a = -Math.PI * (0.08 + (0.84 * i) / 8) + (hash(i + sd) - 0.5) * 0.15, r = 26 + hash(i + 3 + sd) * 18; const h = 4 + hash(i + 5 + sd) * 9, rad = 3 + hash(i + 7) * 5; mesh(cyl(rad * 0.85, rad, h, 9), M(0x3a1a1c), Math.cos(a) * r, h / 2, Math.sin(a) * r, g).rotation.y = hash(i) * 3; }
  for (let i = 0; i < 16; i++) rockAt(g, (hash(i + 40 + sd) - 0.5) * 30, 0.15, -2 - hash(i + 41 + sd) * 18, 0.2 + hash(i + 42) * 0.7, i + 40, 0x4a2622);
  const dust = dustPts(200, [-12, 12, 0, 5, -16, 6], 0xffb08a, 0.12, 0.35, ADD, sd + 7); g.add(dust);
  return { dust };
}
function rockAt(g, x, y, z, r, seed = 1, col = 0x3a3444) { const k = mesh(new THREE.DodecahedronGeometry(r, 0), M(col), x, y, z, g); k.rotation.set(hash(seed), hash(seed + 1) * 3, hash(seed + 2)); k.scale.y = 0.6 + hash(seed + 3) * 0.4; return k; }
function shakeCam(c, t, amp) { if (amp <= 0) return c; return { pos: [c.pos[0] + Math.sin(t * 61) * amp, c.pos[1] + Math.sin(t * 47 + 1) * amp, c.pos[2]], look: c.look }; }

// 1 · a cidade de neon e a pergunta
function cityStreet(g, o = {}) {
  g.add(floorP(60, 120, M(0xffffff, { map: rep(wetTex(), 6, 12) })));
  const signs = [["RAMEN", 0xff4fd8], ["HOTEL", 0x4ff0ff], ["24H", 0xffe14d], ["BAR", 0xb07aff], ["NOODLE", 0x4dffa6], ["OPEN", 0xff7a3a]];
  const kanji = ["夜市", "電気", "未来", "酒場"];
  for (let i = 0; i < 9; i++) [-1, 1].forEach((k) => {
    const z = 6 - i * 6.5 + (k > 0 ? 2.5 : 0), w = 5 + hash(i * 2 + k + 3) * 3, h = 12 + hash(i * 3 + k + 8) * 30;
    tower(g, k * (4.5 + w / 2), z, w, h, 6, i * 2 + (k > 0 ? 1 : 0));
    const [tx, col] = signs[(i + (k > 0 ? 3 : 0)) % signs.length];
    if (i % 2 === (k > 0 ? 1 : 0)) neonSign(g, tx, col, k * 3.3, 3.2 + hash(i + k) * 5, z + 1.6, 2.1, 0.55, 0);
    else neonSign(g, tx, col, k * 4.45, 4 + hash(i + k) * 6, z + 1.2, 2.6, 0.65, -k * Math.PI / 2);
    if (i % 3 === 1) neonSign(g, kanji[(i + (k > 0 ? 1 : 0)) % kanji.length], [0xff4fd8, 0x4ff0ff][(i + k + 2) % 2], k * 4.4, 9 + hash(i + 9) * 8, z - 1.5, 0.75, 3.0, -k * Math.PI / 2, true);
    const pg = glowPlane([0xff4fd8, 0x4ff0ff, 0xb07aff, 0xffe14d][(i + (k > 0 ? 2 : 0)) % 4], 2.4, 5, 0.24); pg.position.set(k * 2.4, 0.02, z + 1); g.add(pg);
  });
  const cars = []; for (let i = 0; i < 12; i++) { const c = flyCar(g); c.userData = { y: 6 + hash(i + 70) * 16, x: [-3.0, -1.2, 1.2, 3.0][i % 4], sp: (i % 4 < 2 ? 1 : -1) * (6 + hash(i + 73) * 6), off: hash(i + 74) * 57 }; cars.push(c); }
  const rainU = rain(g, 700, [-5, 5, 0, 24, -56, 12], 5);
  return { cars, rainU, upd(t) { rainU(t); cars.forEach((c) => { const u = c.userData; const d = (((t * Math.abs(u.sp) + u.off) % 57) + 57) % 57; c.position.set(u.x, u.y, u.sp > 0 ? 12 - d : -45 + d); c.rotation.y = u.sp > 0 ? Math.PI / 2 : -Math.PI / 2; }); } };
}
addSet("s1-cidade", (g) => {
  const sky = plane(200, 90, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#05030c"], [0.6, "#1a0a2e"], [1, "#4a1a4a"]]), fog: false })); sky.position.set(0, 30, -80); g.add(sky);
  const CS = cityStreet(g);
  tower(g, 0, -53, 7, 18, 6, 21);
  const D = person({ hood: true, rim: C_D }); D.position.set(0, 18, -52); g.add(D);
  const q = holoText("?", 0xffe14d, 1.4, 0.7); q.position.set(0, 20.4, -52); g.add(q);
  const qg = glowSprite(0xffe14d, 2.4, 0.4); qg.position.set(0, 20.4, -52.1); g.add(qg);
  return {
    bg: 0x07040f, fog: [20, 95],
    update(t) { CS.upd(t); standPose(D); breathe2(D, t); D.rotation.y = Math.sin(t * 0.3) * 0.15; q.position.y = 20.4 + Math.sin(t * 2) * 0.06; q.material.opacity = 0.8 + 0.2 * Math.sin(t * 13); qg.material.opacity = 0.35 + 0.1 * Math.sin(t * 5); },
    cam(t) { const s = T.sc["s1-cidade"]; return keys(t, [[s[0], [0, 2.2, 12], [0, 6, -40]], [K.morreu0, [0, 4.0, -8], [0, 9, -45]], [K.personagem - 0.3, [1.2, 16.6, -36], [0, 18.6, -52]], [K.vivo0, [0.5, 18.6, -46.6], [0, 18.95, -52]], [s[1], [0.4, 18.7, -47.5], [0, 18.95, -52]]]); },
  };
});

// 2 · a Avida: a fuga do laboratório
addSet("s2-avida", (g) => {
  g.add(floorP(10, 40, M(0xffffff, { map: rep(tileTex("#2a3440", "#24303a", "#141a22"), 3, 12) })));
  const ceil = floorP(10, 40, M(0x14181e), 3.4); ceil.rotation.x = Math.PI / 2; g.add(ceil);
  [-1, 1].forEach((k) => { const wl = plane(40, 3.4, M(0xffffff, { map: rep(tileTex("#3a4652", "#34404c", "#1a2028"), 12, 1) })); wl.position.set(k * 2.2, 1.7, -12); wl.rotation.y = -k * Math.PI / 2; g.add(wl); });
  for (let i = 0; i < 9; i++) mesh(box(1.6, 0.05, 0.25), new THREE.MeshBasicMaterial({ color: 0xcfefff }), 0, 3.36, 1 - i * 3.5, g);
  const leds = []; for (let i = 0; i < 12; i++) { const k = i % 2 ? 1 : -1, z = -1 - Math.floor(i / 2) * 3.2; ol(mesh(box(0.5, 2.4, 1.2), M(0x1a1e26), k * 1.9, 1.2, z, g), 0.01); for (let j = 0; j < 6; j++) { const l = glowSprite([0x4ff0ff, 0x4dffa6, 0xffe14d][(i + j) % 3], 0.12, 0.9); l.position.set(k * 1.63, 0.5 + j * 0.32, z + (hash(i * 9 + j) - 0.5) * 0.9); g.add(l); leds.push(l); } }
  const alarms = []; for (let i = 0; i < 4; i++) { const a = glowSprite(0xff2a3a, 2.4, 0.5); a.position.set(i % 2 ? 1.6 : -1.6, 3.1, -2 - i * 6); g.add(a); const L = new THREE.PointLight(0xff2a3a, 3, 7); L.position.copy(a.position); g.add(L); alarms.push([a, L]); }
  const avida = person({ build: "slim", hair: "long", rim: C_AVIDA }), weak = person({ build: "big", rim: C_WEAK });
  g.add(avida, weak);
  const flash = glowSprite(0xffd27a, 2.5, 0); flash.position.set(0.3, 1.4, -12); g.add(flash);
  const hand = glowSprite(0xffc8a0, 0.6, 0); g.add(hand);
  const soul = flowPts(80, 0xffd8f0, 0.05); g.add(soul.pts);
  return {
    bg: 0x05070c, fog: [6, 34],
    update(t) {
      const fall = sm(seg(t, K.tiro1 + 0.1, K.tiro1 + 0.7)), stop = seg(t, K.tiro1, K.tiro1 + 0.6), kn = sm(seg(t, K.tiro1 + 0.5, K.mao - 0.3));
      const z = lerp(-16, -4.6, seg(t, T.sc["s2-avida"][0], K.tiro1 + 0.15));
      alarms.forEach(([a, L], i) => { const p = 0.5 + 0.5 * Math.sin(t * 7 + i); a.material.opacity = 0.25 + 0.4 * p; L.intensity = 1 + 3 * p; });
      leds.forEach((l, i) => (l.material.opacity = (hash(i + Math.floor(t * 6)) > 0.3 ? 0.9 : 0.15)));
      avida.position.set(-0.3, 0, z); weak.position.set(0.45, 0, z + 0.4);
      if (fall <= 0) { runCycle(avida, t, 1, 1.05); runCycle(weak, t + 0.2, 1); avida.rotation.set(0, 0, 0); }
      else { standPose(avida); avida.rotation.set(0.15 * fall, 0, 1.4 * fall); avida.position.y = 0.12 * fall; standPose(weak); const step = sm(seg(t, K.tiro1 + 0.4, K.mao - 0.4)); weak.position.set(lerp(0.45, -1.0, step), 0, lerp(z + 0.4, -5.25, step)); kneel(weak, kn); weak.userData.arms[0].rotation.set(-0.95 * kn, 0, -0.12); weak.userData.arms[1].rotation.set(-0.5 * kn, 0, 0.12); }
      flash.material.opacity = Math.max(0, 1 - Math.abs(t - K.tiro1) / 0.12) * 0.95;
      hand.position.set(-1.05, 0.3, -4.55); hand.material.opacity = 0.7 * sm(seg(t, K.mao - 0.4, K.mao));
      const so = seg(t, K.morreu1, K.morreu1 + 1.6);
      for (let i = 0; i < 80; i++) { const k = (so * 0.9 + hash(i) * 0.6) % 1; soul.pos[i * 3] = -1.1 + (hash(i + 1) - 0.5) * 1.2; soul.pos[i * 3 + 1] = 0.2 + k * 2.2; soul.pos[i * 3 + 2] = -4.6 + (hash(i + 2) - 0.5) * 0.5; }
      soul.upd(); soul.pts.material.opacity = so > 0 && so < 1 ? 0.8 * Math.sin(so * Math.PI) : 0;
    },
    cam(t) { const s = T.sc["s2-avida"]; const c = keys(t, [[s[0], [0, 1.6, 1.5], [0, 1.2, -14]], [K.tiro1 - 0.2, [0.6, 1.6, 0.6], [0, 1.1, -6]], [K.tiro1 + 0.6, [0.3, 1.9, -0.2], [-0.6, 0.5, -4.6]], [K.mao, [-0.6, 2.0, -0.3], [-1.0, 0.45, -4.8]], [s[1], [-0.65, 1.95, -0.6], [-1.0, 0.45, -4.8]]]); return shakeCam(c, t, Math.abs(t - K.tiro1) < 0.25 ? 0.05 : 0); },
  };
});

// 3 · o Kiril e o ataque aéreo da própria empresa
addSet("s3-kiril", (g) => {
  badlands(g, { seed: 3 });
  const trans = new THREE.Group(); trans.position.set(1.6, 0, -1.8); trans.rotation.y = -0.5; g.add(trans);
  ol(mesh(box(3.2, 1.3, 1.6), M(0x2a2a34), 0, 1.0, 0, trans), 0.03); ol(mesh(box(1.4, 0.8, 1.5), M(0x24242e), 1.0, 1.95, 0, trans), 0.02);
  [-1.1, 1.1].forEach((x) => [-0.85, 0.85].forEach((z) => { const w = mesh(cyl(0.38, 0.38, 0.3, 14), M(0x111116), x, 0.38, z, trans); w.rotation.x = Math.PI / 2; }));
  [-1, 1].forEach((k) => { const h = glowSprite(0xfff2d0, 0.6, 0.9); h.position.set(1.62, 1.0, 0.55 * k); trans.add(h); });
  mesh(box(0.9, 0.12, 0.02), new THREE.MeshBasicMaterial({ color: 0xff4d6d }), 0, 1.3, 0.81, trans);
  const kiril = person({ coat: true, rim: C_KIRIL }); kiril.position.set(-0.4, 0, -0.2); kiril.rotation.y = 0.3; g.add(kiril);
  const guards = [person({ rim: 0xff3355, rimOp: 0.4 }), person({ rim: 0xff3355, rimOp: 0.4 })]; guards[0].position.set(-1.9, 0, -2.4); guards[1].position.set(0.3, 0, -3.6); g.add(...guards);
  const ms = [0, 1, 2, 3].map(() => missile(g));
  const booms = [boom(g, 1.2), boom(g, 1.0), boom(g, 1.4), boom(g, 1.0)];
  const targets = [[1.6, -1.8], [-2.4, -4], [0.2, -0.8], [3.5, -5]];
  return {
    bg: 0x14060e, fog: [16, 90],
    update(t) {
      const A = K.ataque2;
      standPose(kiril); breathe2(kiril, t); kiril.userData.arms[1].rotation.x = t < A ? -0.5 : 0; guards.forEach((p, i) => { standPose(p); breathe2(p, t, i); });
      ms.forEach((m, i) => {
        const t0 = A - 0.5 + i * 0.35, hit = t0 + 0.9; const k = seg(t, t0, hit); const [tx, tz] = targets[i];
        const p = new THREE.Vector3(lerp(tx - 14, tx, k), lerp(26, 0.4, k), lerp(tz - 20, tz, k));
        m.m.visible = t > t0 && t < hit; m.m.position.copy(p); m.m.lookAt(tx, 0, tz); m.m.rotateX(-Math.PI / 2);
        for (let j = 0; j < 40; j++) { const kk = Math.max(0, k - j * 0.012); m.tr.pos[j * 3] = lerp(tx - 14, tx, kk); m.tr.pos[j * 3 + 1] = lerp(26, 0.4, kk); m.tr.pos[j * 3 + 2] = lerp(tz - 20, tz, kk); }
        m.tr.upd(); m.tr.pts.material.opacity = t > t0 && t < hit + 1.5 ? 0.45 * (1 - seg(t, hit, hit + 1.5)) : 0;
        booms[i].b.position.set(tx, 0.5, tz); booms[i].set(hit, t);
      });
      const blown = seg(t, A + 0.45, A + 1.2); kiril.visible = blown < 0.6; trans.rotation.z = -0.9 * sm(blown); trans.position.y = Math.sin(blown * Math.PI) * 1.4;
    },
    cam(t) { const s = T.sc["s3-kiril"]; const c = keys(t, [[s[0], [3.4, 1.6, 5.6], [0, 1.3, -1]], [K.vilao, [2.0, 1.45, 3.6], [-0.3, 1.35, -0.4]], [K.ataque2 - 0.3, [2.4, 1.6, 4.2], [0, 1.6, -2]], [K.ataque2 + 0.9, [5.5, 4.2, 9.5], [0, 1.2, -2]], [s[1], [6.0, 4.6, 10.5], [0, 1.0, -2]]]); return shakeCam(c, t, t > K.ataque2 + 0.4 && t < K.ataque2 + 2.2 ? 0.08 : 0); },
  };
});

// 4 · a Kyoko e o pulso EMP
addSet("s4-kyoko", (g) => {
  badlands(g, { seed: 4, sky: [[0, "#06060f"], [0.55, "#1a1030"], [1, "#4a2236"]], moon: [14, 15, -58], moonCol: 0xd8e0ff });
  const av = new THREE.Group(); av.position.set(-1.8, 0.3, -2.6); av.rotation.set(0.1, 0.6, 0.25); g.add(av);
  ol(mesh(box(3.0, 0.8, 1.6), M(0x2e3038), 0, 0.4, 0, av), 0.03); ol(mesh(box(0.8, 0.12, 3.4), M(0x2a2c34), 0.2, 0.75, 0, av), 0.02);
  const avl = [0, 1, 2].map((i) => { const l = glowSprite(0x4ff0ff, 0.5, 0.9); l.position.set(-1.0 + i * 0.9, 0.55, 0.82); av.add(l); return l; });
  const sparks = flowPts(60, 0xffd27a, 0.05); g.add(sparks.pts);
  const kyoko = person({ build: "slim", coat: true, hair: "bun", rim: C_KYOKO }); kyoko.position.set(0.3, 0, 0); kyoko.rotation.y = -0.4; g.add(kyoko);
  const dev = new THREE.Group(); dev.position.set(0.7, 0, 0.45); g.add(dev);
  ol(mesh(box(0.45, 0.3, 0.35), M(0x3a3a46), 0, 0.15, 0, dev), 0.01); const core = mesh(sph(0.09, 14, 10), glowM(0x7ab8ff, 1), 0, 0.36, 0, dev); const cg = glowSprite(0x7ab8ff, 0.9, 0.7); cg.position.y = 0.36; dev.add(cg); mesh(cyl(0.01, 0.01, 0.5, 4), M(0x8a8a96), 0.15, 0.5, 0, dev);
  const ring = mesh(new THREE.TorusGeometry(1, 0.03, 8, 96), glowM(0x9fd8ff, 0.9), 0.7, 0.4, 0.45, g); ring.rotation.x = Math.PI / 2;
  const ring2 = mesh(new THREE.TorusGeometry(1, 0.012, 8, 96), glowM(0xffffff, 0.8), 0.7, 1.2, 0.45, g); ring2.rotation.x = Math.PI / 2;
  const flash = glowSprite(0xbfe0ff, 6, 0); flash.position.set(0.7, 0.6, 0.45); g.add(flash);
  const arcs = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.9 })); const ap = new Float32Array(48 * 6); arcs.geometry.setAttribute("position", new THREE.BufferAttribute(ap, 3)); g.add(arcs);
  const ms = [0, 1, 2].map(() => missile(g));
  const soul = flowPts(70, 0xbfd8ff, 0.05); g.add(soul.pts);
  return {
    bg: 0x0a0812, fog: [16, 90],
    update(t) {
      const E = K.emp;
      avl.forEach((l, i) => (l.material.opacity = t < E + 0.3 ? 0.6 + 0.3 * Math.sin(t * 20 + i) : 0));
      for (let i = 0; i < 60; i++) { const k = (t * 1.5 + hash(i)) % 1; sparks.pos[i * 3] = -1.2 + (hash(i + 1) - 0.5) * 0.6; sparks.pos[i * 3 + 1] = 1.0 + k * 0.8 - k * k * 1.6; sparks.pos[i * 3 + 2] = -1.9 + (hash(i + 2) - 0.5) * 0.6 + k * 0.6; } sparks.upd(); sparks.pts.material.opacity = t < E + 0.3 ? 0.9 : 0;
      standPose(kyoko); breathe2(kyoko, t); const crouch = sm(seg(t, K.capri3, K.sacrificou)); kneel(kyoko, crouch * 0.8); kyoko.userData.arms[1].rotation.x = -1.1 * crouch;
      const R = t < E ? 0 : (t - E) * 9; ring.visible = ring2.visible = R > 0.05 && R < 22; ring.scale.set(R, R, 1); ring2.scale.set(R * 0.97, R * 0.97, 1); ring.material.opacity = 0.9 * (1 - R / 22); ring2.material.opacity = 0.8 * (1 - R / 22);
      flash.material.opacity = t > E ? Math.max(0, 0.9 - (t - E) * 2.5) : 0; core.material.opacity = t < E + 0.2 ? 1 : 0.15; cg.material.opacity = t < E ? 0.5 + 0.3 * Math.sin(t * 12) : Math.max(0, 0.9 - (t - E) * 2);
      const ft = Math.floor(t * 30), aOn = t > E - 0.25 && t < E + 0.9;
      for (let i = 0; i < 48; i++) { const a = hash(i + ft * 3) * 6.28, r = 0.3 + hash(i + ft * 5) * (0.6 + Math.max(0, t - E) * 4); const x0 = 0.7 + Math.cos(a) * r, z0 = 0.45 + Math.sin(a) * r, y0 = 0.2 + hash(i + ft) * 1.2; ap.set([x0, y0, z0, x0 + (hash(i + ft * 7) - 0.5) * 0.4, y0 + (hash(i + ft * 9) - 0.5) * 0.4, z0 + (hash(i + ft * 11) - 0.5) * 0.4], i * 6); }
      arcs.geometry.attributes.position.needsUpdate = true; arcs.visible = aOn;
      ms.forEach((m, i) => { const t0 = E - 1.6 + i * 0.25; const k = seg(t, t0, t0 + 3.0); const dead = t > E + 0.15 + i * 0.05; const fallK = seg(t, E + 0.15, E + 2.0); const x = lerp(-8 + i * 5, -2 + i * 3, k), y = lerp(24, 9, k) - (dead ? fallK * fallK * 9 : 0), z = -12 - i * 3; m.m.position.set(x, y, z); m.m.rotation.set(0.4, 0, -0.6 - (dead ? fallK * 1.2 : 0)); m.m.visible = t > t0 && y > 0.5; m.f.material.opacity = dead ? 0 : 0.95; for (let j = 0; j < 40; j++) { const kk = Math.max(0, k - j * 0.012); m.tr.pos[j * 3] = lerp(-8 + i * 5, -2 + i * 3, kk); m.tr.pos[j * 3 + 1] = lerp(24, 9, kk); m.tr.pos[j * 3 + 2] = z; } m.tr.upd(); m.tr.pts.material.opacity = t > t0 ? 0.35 : 0; });
      const so = seg(t, E + 0.6, E + 2.2); kyoko.visible = so < 0.85;
      for (let i = 0; i < 70; i++) { const k = (so * 0.9 + hash(i) * 0.5) % 1; soul.pos[i * 3] = 0.3 + (hash(i + 1) - 0.5) * 0.5; soul.pos[i * 3 + 1] = 0.3 + k * 2.4; soul.pos[i * 3 + 2] = (hash(i + 2) - 0.5) * 0.5; } soul.upd(); soul.pts.material.opacity = so > 0 && so < 1 ? 0.8 * Math.sin(so * Math.PI) : 0;
    },
    cam(t) { const s = T.sc["s4-kyoko"]; const c = keys(t, [[s[0], [3.0, 1.5, 4.4], [0.2, 1.0, 0]], [K.sacrificou, [1.8, 0.9, 2.4], [0.5, 0.6, 0.2]], [K.emp + 0.1, [1.6, 1.0, 2.6], [0.5, 0.7, 0.2]], [K.emp + 1.0, [0.5, 4.0, 9.5], [0, 2.5, -4]], [s[1], [0.4, 4.4, 10.5], [0, 3.0, -5]]]); return shakeCam(c, t, t > K.emp && t < K.emp + 0.6 ? 0.06 : 0); },
  };
});

// 5 · a Talia: clínica e o espaço da mente
addSet("s5-talia", (g) => {
  const room = new THREE.Group(); g.add(room);
  room.add(floorP(8, 8, M(0xffffff, { map: rep(tileTex(), 4, 4) })));
  const back = plane(8, 4, M(0xdfe8f0)); back.position.set(0, 2, -2.6); room.add(back);
  [-1, 1].forEach((k) => { const w = plane(8, 4, M(0xd0dce6)); w.position.set(k * 3.2, 2, 0); w.rotation.y = -k * Math.PI / 2; room.add(w); });
  const skyl = canvasTex(256, 160, (c) => { const gr = c.createLinearGradient(0, 0, 0, 160); gr.addColorStop(0, '#2a1a4a'); gr.addColorStop(0.6, '#ff8a6a'); gr.addColorStop(1, '#ffd29a'); c.fillStyle = gr; c.fillRect(0, 0, 256, 160); c.fillStyle = '#1a1028'; for (let i = 0; i < 18; i++) { const w = 8 + hash(i + 3) * 18, h = 30 + hash(i + 4) * 90; c.fillRect(i * 15 - 6, 160 - h, w, h); } }); const win = mesh(new THREE.PlaneGeometry(1.8, 1.2), new THREE.MeshBasicMaterial({ map: skyl }), 1.4, 2.0, -2.58, room); mesh(box(1.9, 0.06, 0.06), M(0xffffff), 1.4, 1.37, -2.55, room); mesh(box(0.06, 1.25, 0.06), M(0xffffff), 1.4, 2.0, -2.55, room);
  const crossM = new THREE.MeshBasicMaterial({ color: 0x1fbf6a }); mesh(box(0.5, 0.14, 0.02), crossM, -1.3, 2.5, -2.57, room); mesh(box(0.14, 0.5, 0.02), crossM, -1.3, 2.5, -2.57, room); const cgl = glowSprite(0x4dffa6, 1.3, 0.18); cgl.position.set(-1.3, 2.5, -2.5); room.add(cgl);
  [-1, 1].forEach((k) => { const st = mesh(box(0.03, 0.04, 7.6), glowM(0x4ff0ff, 0.7), k * 3.17, 0.06, 0, room); }); mesh(box(6.3, 0.04, 0.03), glowM(0x4ff0ff, 0.7), 0, 0.06, -2.56, room); const wg = glowSprite(0xffd8a0, 2.6, 0.35); wg.position.set(1.4, 2.0, -2.5); room.add(wg);
  ol(mesh(box(0.95, 0.45, 2.0), M(0xe8eef4), 0, 0.42, -0.6, room), 0.01); ol(mesh(box(0.95, 0.12, 0.5), M(0xffffff), 0, 0.7, -1.3, room), 0.01);
  const lampR = mesh(new THREE.TorusGeometry(0.45, 0.05, 8, 40), glowM(0xffffff, 0.9), 0, 2.6, -0.6, room); lampR.rotation.x = Math.PI / 2;
  const mon = new THREE.Group(); mon.position.set(-1.0, 1.3, -1.6); mon.rotation.y = 0.5; room.add(mon);
  ol(mesh(box(0.6, 0.4, 0.06), M(0x2a2e36), 0, 0, 0, mon), 0.01);
  const ekg = canvasTex(256, 128, (c) => { c.fillStyle = "#06120e"; c.fillRect(0, 0, 256, 128); c.strokeStyle = "#4dffa6"; c.lineWidth = 4; c.beginPath(); for (let x = 0; x <= 256; x += 4) { const ph = x % 64; const y = ph > 24 && ph < 28 ? 30 : ph > 28 && ph < 32 ? 100 : 64; x === 0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); });
  ekg.wrapS = THREE.RepeatWrapping; mesh(new THREE.PlaneGeometry(0.54, 0.34), new THREE.MeshBasicMaterial({ map: ekg }), 0, 0, 0.031, mon);
  const talia = person({ build: "slim", rim: C_TALIA }); talia.position.set(0, 0.62, -0.5); room.add(talia);
  const arm = new THREE.Group(); arm.position.set(1.5, 3.0, -0.3); room.add(arm); mesh(cyl(0.05, 0.05, 1.2, 8), M(0xb8c0cc), 0, -0.5, 0, arm).rotation.z = 0.6; mesh(sph(0.08, 10, 8), M(0x8a96a6), -0.35, -1.0, 0, arm);
  const tray = mesh(box(0.7, 0.04, 0.45), M(0xc8d0da), 1.1, 0.95, 0.3, room); ol(tray, 0.005); mesh(cyl(0.03, 0.03, 0.95, 6), M(0x9aa2ae), 1.1, 0.47, 0.3, room);
  const chrome = []; for (let i = 0; i < 9; i++) { const p = mesh(i % 3 ? box(0.14, 0.05, 0.22) : cyl(0.05, 0.05, 0.22, 10), M(0xd8dee8), 0, 0, 0, room); ol(p, 0.004, rimMat(0x4ff0ff, 0.5)); chrome.push({ p, from: new THREE.Vector3((hash(i) - 0.5) * 0.4, 1.3 + hash(i + 1) * 0.7, -0.5 + (hash(i + 2) - 0.5) * 0.3), to: new THREE.Vector3(0.85 + (i % 3) * 0.2, 0.99, 0.18 + Math.floor(i / 3) * 0.12) }); }
  // o espaço da mente (longe do quarto)
  const mind = new THREE.Group(); mind.position.set(100, 0, 0); g.add(mind);
  const grid = new THREE.GridHelper(40, 40, 0xff4fd8, 0x4ff0ff); grid.material.transparent = true; grid.material.opacity = 0.45; mind.add(grid);
  mind.add(dustPts(300, [-8, 8, 0, 6, -10, 4], 0xb8a0ff, 0.06, 0.8, ADD, 15));
  for (let i = 0; i < 18; i++) { const c = mesh(box(0.25, 0.25, 0.25), glowM([0x4ff0ff, 0xff4fd8, 0xb07aff][i % 3], 0.35), (hash(i + 5) - 0.5) * 10, 0.5 + hash(i + 6) * 4, -2 - hash(i + 7) * 8, mind); c.rotation.set(hash(i), hash(i + 1), 0); }
  const mT = person({ build: "slim", rim: C_TALIA }); mind.add(mT);
  const cap2 = capriForm(); mind.add(cap2);
  const mD = person({ hood: true, rim: C_D }); mind.add(mD);
  return {
    bg: 0x0a0a12, fog: [8, 40],
    update(t) {
      standPose(talia); breathe2(talia, t); talia.userData.legs.forEach((l) => (l.rotation.x = -1.45)); talia.position.y = -0.06;
      ekg.offset.x = (t * 0.6) % 1;
      const det = sm(seg(t, K.cromo - 0.3, K.clinica + 0.6));
      chrome.forEach((c, i) => { const k = sm(seg(det, i * 0.05, 0.55 + i * 0.05)); c.p.position.lerpVectors(c.from, c.to, k); c.p.position.y += Math.sin(k * Math.PI) * 0.5; c.p.rotation.set(k * 4 + i, k * 3, 0); });
      arm.rotation.z = Math.sin(t * 1.5) * 0.15 + det * 0.3;
      const sepK = sm(seg(t, K.separou - 0.2, K.separou + 0.9));
      standPose(mT); standPose(mD); breathe2(mT, t); capriIdle(cap2, t);
      mT.position.set(lerp(0, -0.9, sepK), 0, 0); cap2.position.set(lerp(0.05, 1.1, sepK), 0.02, 0.02); const dk = sm(seg(t, K.entrou - 0.1, K.separou)); mD.position.set(0.1, 0, lerp(-3.0, -0.8, dk)); mD.userData.arms.forEach((a, i) => (a.rotation.z = (i ? 1 : -1) * (0.12 + 1.0 * sepK)));
    },
    cam(t) {
      const s = T.sc["s5-talia"];
      return keys(t, [[s[0], [2.4, 1.9, 3.6], [0.2, 0.9, -0.6]], [K.entrou - 0.12, [2.2, 1.8, 3.2], [0.2, 0.9, -0.6]], [K.entrou - 0.1, [100.6, 1.6, 5.4], [100.1, 1.1, -0.2]], [K.separou + 1.5, [100.8, 1.5, 4.6], [100.1, 1.1, -0.2]], [K.separou + 1.52, [2.6, 2.0, 3.8], [0.5, 1.0, -0.4]], [s[1], [2.4, 1.9, 3.4], [0.6, 1.0, -0.3]]]);
    },
  };
});

// 6 · o Weak: a arma trava e a urna das cinzas o salva
addSet("s6-weak", (g) => {
  badlands(g, { seed: 6, sky: [[0, "#070510"], [0.6, "#24102a"], [1, "#5a2230"]], moon: false });
  const dawn = plane(200, 90, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#1a1440"], [0.55, "#ff7a5a"], [1, "#ffd27a"]]), fog: false, transparent: true, opacity: 0 })); dawn.position.set(0, 22, -63); g.add(dawn);
  const sun = glowSprite(0xffc27a, 30, 0); sun.material.fog = false; sun.position.set(-6, 2, -62); g.add(sun);
  const fire = [glowSprite(0xff7a2a, 3, 0.7), glowSprite(0xffd27a, 1.4, 0.9)]; fire.forEach((f) => { f.position.set(-3.5, 0.8, -4); g.add(f); });
  const fl = new THREE.PointLight(0xff8a3a, 6, 12); fl.position.set(-3.5, 1.2, -3.5); g.add(fl);
  ol(mesh(box(2.4, 0.9, 1.4), M(0x24222a), -3.6, 0.45, -4.6, g), 0.02);
  const weak = person({ build: "big", rim: C_WEAK }); weak.position.set(0.4, 0, -0.6); weak.rotation.y = -0.785; g.add(weak);
  const gun = pistol(); weak.userData.arms[1].add(gun); gun.position.set(0, -0.62, 0.06); gun.rotation.x = Math.PI / 2;
  const u1 = urn(1.1); g.add(u1);
  const kiril = person({ coat: true, rim: C_KIRIL, rimOp: 0.6 }); kiril.position.set(-0.9, 0, 0.7); kiril.rotation.y = 2.36; g.add(kiril);
  const shooter = soldier(); shooter.position.set(-3.8, 0, 2.6); shooter.lookAt(0.4, 0, -0.6); g.add(shooter);
  const mflash = glowSprite(0xffd27a, 1.2, 0); g.add(mflash);
  const tracer = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0 })); g.add(tracer);
  const sparks = flowPts(50, 0xffe0a0, 0.045); g.add(sparks.pts);
  const ash = flowPts(90, 0xb8b8c0, 0.06, NORM); ash.pts.material.opacity = 0; g.add(ash.pts);
  const puff = glowSprite(0x9a9aa6, 0.3, 0, NORM); g.add(puff);
  const tears = [0, 1].map(() => { const d = mesh(sph(0.03, 10, 8), glowM(0xbff4ff, 1), 0, 0, 0, g); d.scale.y = 1.4; d.add(glowSprite(0x9fe8ff, 0.16, 0.9)); return d; });
  const urnPos = new THREE.Vector3(), headPos = new THREE.Vector3(), gunTip = new THREE.Vector3();
  return {
    bg: 0x0c0610, fog: [14, 80],
    update(t) {
      fire.forEach((f, i) => f.scale.setScalar((i ? 1.4 : 3) * (0.9 + 0.1 * Math.sin(t * 13 + i))));
      fl.intensity = 5 + Math.sin(t * 11) * 1.2;
      standPose(weak); breathe2(weak, t); standPose(kiril); kneel(kiril, 1); breathe2(kiril, t, 1); kiril.visible = t < K.tiro5 + 0.5; standPose(shooter); shooter.userData.arms[1].rotation.x = -1.4; shooter.userData.arms[0].rotation.x = -1.2;
      const aim = t < K.tiro5 ? 1 : 1 - sm(seg(t, K.tiro5, K.tiro5 + 0.5)); weak.userData.arms[1].rotation.x = -1.45 * aim;
      const jam = seg(t, K.travou - 0.05, K.travou + 0.35); gun.userData.slide.position.z = 0.05 - 0.03 * Math.sin(Math.min(1, jam * 2) * Math.PI);
      gun.getWorldPosition(gunTip); puff.position.copy(gunTip).add(new THREE.Vector3(0, 0.08, 0)); puff.material.opacity = jam > 0 && jam < 1 ? 0.5 * Math.sin(jam * Math.PI) : 0; puff.scale.setScalar(0.2 + jam * 0.4);
      weak.updateMatrixWorld(); urnPos.set(0, 1.0 * 1.12, 0.3); weak.userData.body.localToWorld(urnPos); u1.position.copy(urnPos); u1.rotation.y = weak.rotation.y;
      const hitT = K.urna - 0.1, sh = K.tiro5;
      const pf = Math.max(0, 1 - Math.abs(t - sh) / 0.1); shooter.updateMatrixWorld(); const sp = new THREE.Vector3(0.1, 1.0, 0.75); shooter.userData.body.localToWorld(sp); mflash.position.copy(sp); mflash.material.opacity = pf;
      const tk = seg(t, sh, hitT); tracer.geometry.setFromPoints([sp, new THREE.Vector3().lerpVectors(sp, urnPos, tk)]); tracer.material.opacity = tk > 0 && tk < 1 ? 0.9 : 0;
      const hk = seg(t, hitT, hitT + 0.6);
      for (let i = 0; i < 50; i++) { const a = hash(i) * 6.28, v = 0.6 + hash(i + 1) * 1.2; sparks.pos[i * 3] = urnPos.x + Math.cos(a) * v * hk; sparks.pos[i * 3 + 1] = urnPos.y + Math.sin(a * 1.3) * v * hk * 0.6 - hk * hk * 0.6; sparks.pos[i * 3 + 2] = urnPos.z + Math.sin(a) * v * hk * 0.5; } sparks.upd(); sparks.pts.material.opacity = hk > 0 && hk < 1 ? 1 - hk : 0;
      const ak = seg(t, hitT + 0.1, hitT + 2.4);
      for (let i = 0; i < 90; i++) { const a = hash(i + 7) * 6.28, v = 0.2 + hash(i + 8) * 0.6; ash.pos[i * 3] = urnPos.x + Math.cos(a) * v * ak; ash.pos[i * 3 + 1] = urnPos.y + 0.1 + ak * (0.4 + hash(i + 9) * 0.8); ash.pos[i * 3 + 2] = urnPos.z + Math.sin(a) * v * ak; } ash.upd(); ash.pts.material.opacity = ak > 0 && ak < 1 ? 0.75 * Math.sin(ak * Math.PI) : 0;
      const kb = 0.15 * sm(seg(t, hitT, hitT + 0.3)) * (1 - sm(seg(t, hitT + 0.3, hitT + 1.2))); weak.position.set(0.4 + kb * 0.7, 0, -0.6 - kb * 0.7);
      headPos.set(0, 1.53 * 1.12, 0.17); weak.userData.body.localToWorld(headPos);
      tears.forEach((d, i) => { const k = (((t - K.chorando) * 0.7 + i * 0.5) % 1 + 1) % 1; d.visible = t > K.chorando - 0.2; const off = (i ? 1 : -1) * 0.055; d.position.set(headPos.x + off * 0.7, headPos.y - 0.01 - k * 0.3, headPos.z + off * 0.7); d.material.opacity = 1 - k * 0.7; });
      const dk = sm(seg(t, K.chorando - 0.5, K.viver + 0.4)); dawn.material.opacity = dk; sun.material.opacity = 0.7 * dk;
    },
    cam(t) { const s = T.sc["s6-weak"]; const c = keys(t, [[s[0], [2.2, 1.6, 3.6], [-0.2, 1.2, 0]], [K.travou - 0.4, [1.6, 1.6, 0.9], [-0.1, 1.4, 0.1]], [K.tiro5 - 0.2, [1.9, 1.55, 2.2], [0.0, 1.2, -0.4]], [K.urna, [1.1, 1.3, 0.9], [0.2, 1.15, -0.4]], [K.chorando - 0.3, [-1.0, 1.85, 0.85], [0.4, 1.72, -0.6]], [K.viver, [2.4, 1.9, 4.6], [0, 1.7, -2]], [s[1], [2.6, 2.0, 5.2], [0, 1.8, -3]]]); return shakeCam(c, t, Math.abs(t - (K.urna - 0.1)) < 0.25 ? 0.05 : 0); },
  };
});

// 7 · o Roman e a câmera
addSet("s7-roman", (g) => {
  const sky = plane(200, 90, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#140a2a"], [0.55, "#5a2a5a"], [1, "#ff9a6a"]]), fog: false })); sky.position.set(0, 18, -70); g.add(sky);
  g.add(floorP(30, 30, M(0x2a2630)));
  ol(mesh(box(6, 0.4, 0.3), M(0x3a3644), 0, 0.2, -3, g), 0.02);
  for (let i = 0; i < 16; i++) tower(g, -30 + i * 4 + hash(i) * 2, -30 - hash(i + 1) * 20, 3 + hash(i + 2) * 2, 8 + hash(i + 3) * 26, 3, i + 40);
  const roman = person({ build: "kid", rim: C_ROMAN }); roman.position.set(-0.5, 0, 0); roman.rotation.y = 0.5; g.add(roman);
  const cam = filmCamera(); cam.position.set(0.15, 1.18, -0.25); cam.rotation.y = Math.PI + 0.3; cam.userData.hd.rotation.x = -0.12; g.add(cam);
  const strip = new THREE.Group(); g.add(strip);
  const frameT = canvasTex(64, 64, (c) => { c.fillStyle = "#1a1418"; c.fillRect(0, 0, 64, 64); c.fillStyle = "#ffc89a"; c.fillRect(10, 12, 44, 40); c.fillStyle = "#1a1418"; for (let y = 2; y < 64; y += 12) { c.fillRect(2, y, 5, 6); c.fillRect(57, y, 5, 6); } });
  for (let i = 0; i < 10; i++) mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: frameT, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }), i * 0.31, 0, 0, strip);
  return {
    bg: 0x140a1e, fog: [20, 90],
    update(t) { standPose(roman); breathe2(roman, t); roman.userData.arms[1].rotation.x = -1.0; roman.userData.arms[0].rotation.x = -0.6; cam.userData.reels.forEach((r, i) => (r.rotation.y = t * (i ? 6 : 5))); cam.userData.rg.material.opacity = Math.sin(t * 6) > 0 ? 0.95 : 0.2; strip.position.set(-2 + ((t * 0.6) % 1) * 0.31, 2.4 + Math.sin(t) * 0.1, -1.5); strip.rotation.set(0.2, 0.3, Math.sin(t * 0.7) * 0.15); },
    cam(t) { const s = T.sc["s7-roman"]; return keys(t, [[s[0], [2.6, 1.5, 3.6], [-0.1, 0.9, -0.3]], [s[1], [2.2, 1.4, 3.0], [-0.1, 0.9, -0.3]]]); },
  };
});

// 8 · o D: o nome, a Capri, os soldados e o voo até a luz
addSet("s8-d", (g) => {
  badlands(g, { seed: 8, sky: [[0, "#04030c"], [0.55, "#140a26"], [1, "#3a1a3a"]], moon: false });
  const star = glowSprite(0xfff6d8, 7, 0.95); star.material.fog = false; star.position.set(4, 44, -60); g.add(star);
  const star2 = glowSprite(0xffffff, 2, 1); star2.material.fog = false; star2.position.copy(star.position); g.add(star2);
  const lights = [-1, 1].map((k) => { const sl = mesh(new THREE.ConeGeometry(2.4, 26, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.07, depthWrite: false, blending: ADD, side: THREE.DoubleSide }), k * 7, 13, -14, g); sl.rotation.z = k * 0.4; return sl; });
  const D = person({ hood: true, rim: C_D }); g.add(D);
  const tag = holoText("D", 0xffe14d, 0.6, 0.3); g.add(tag);
  const tag2 = holoText("DAVID", 0xffe14d, 0.72, 0.36); g.add(tag2);
  const ghost = person({ mat: new THREE.MeshBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0, depthWrite: false, blending: ADD }) }); ghost.position.set(-1.0, 0, -0.4); g.add(ghost);
  const cross = holoText("✕", 0xff4d6d, 0.9, 0.45); g.add(cross);
  const capri = capriForm(1.05); g.add(capri);
  const scan = mesh(new THREE.TorusGeometry(0.4, 0.012, 6, 48), glowM(0xffb8f0, 0.9), 0, 0, 0, g); scan.rotation.x = Math.PI / 2;
  const aura = glowSprite(0xffe14d, 2.6, 0); g.add(aura);
  const soldiers = []; for (let i = 0; i < 6; i++) { const p = soldier(); p.position.set(-3.5 + i * 1.4, 0, -6 - (i % 2) * 0.8); p.lookAt(0, 0, 0); g.add(p); soldiers.push(p); }
  const tracers = soldiers.map(() => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0 })); g.add(l); return l; });
  const wave = mesh(new THREE.TorusGeometry(1, 0.05, 8, 96), glowM(0xffe14d, 0.9), 0, 0.3, 0, g); wave.rotation.x = Math.PI / 2;
  const trail = flowPts(120, 0xffd8f0, 0.08); g.add(trail.pts);
  const smile = mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 20, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0, 0, g); smile.rotation.z = Math.PI;
  const sp = new THREE.Vector3(), tmp = new THREE.Vector3();
  return {
    bg: 0x06040c, fog: [16, 90],
    update(t) {
      const s = T.sc["s8-d"];
      // posição do D: chão → voo → (lembrança) chão → sobe de novo
      const up = sm(seg(t, K.voou - 0.3, K.ceu + 0.5)), flash = t >= K.sorriso - 0.62 && t < K.camera7 + 0.45, up2 = sm(seg(t, K.camera7 + 0.45, s[1]));
      if (flash) D.position.set(0, 0, 0); else if (t >= K.camera7 + 0.45) D.position.set(0, up2 * 9, 0); else D.position.set(2.4 * up, 26 * up, -36 * up);
      const y = D.position.y; standPose(D); breathe2(D, t);
      if (y > 0.1) { D.userData.legs[0].rotation.x = -0.2; D.userData.legs[1].rotation.x = 0.3; D.userData.arms.forEach((a, i) => (a.rotation.z = (i ? 1 : -1) * 0.5)); }
      tag.position.set(0.45, 1.95, 0.2); tag2.position.set(0.5, 1.95, 0.2); const nm = t >= K.david - 0.05; tag.visible = !nm && t < K.reconstruiu - 0.3; tag2.visible = nm && t < K.reconstruiu - 0.3;
      const gl = Math.abs(t - K.david) < 0.18; tag2.position.x += gl ? Math.sin(t * 90) * 0.05 : 0; tag.material.opacity = 0.9; tag2.material.opacity = gl ? 0.5 + 0.5 * Math.sin(t * 70) : 0.95;
      const gk = sm(seg(t, K.protagonista - 0.2, K.protagonista + 0.5)) * (1 - sm(seg(t, K.mesma7 + 0.3, K.reconstruiu - 0.4)));
      ghost.visible = gk > 0.01; ghost.traverse((o) => { if (o.material) o.material.opacity = 0.35 * gk; }); standPose(ghost);
      cross.position.set(-1.0, 1.0, -0.2); cross.visible = t > K.mesma7 - 0.1 && t < K.reconstruiu - 0.4; cross.material.opacity = 0.9;
      // a Capri envolve e reconstrói
      const ck = sm(seg(t, K.reconstruiu - 0.4, K.reconstruiu + 0.4));
      capri.position.set(D.position.x + 0.02, D.position.y, D.position.z + 0.02); capri.visible = ck > 0.01 && !flash; capriIdle(capri, t, ck * (1 - 0.6 * sm(seg(t, K.enfrentou, K.enfrentou + 0.6))));
      const rk = seg(t, K.reconstruiu, K.reconstruiu + 1.4); scan.visible = rk > 0 && rk < 1; scan.position.set(0, rk * 1.8, 0);
      aura.position.set(0, D.position.y + 1.0, 0); aura.material.opacity = 0.55 * ck * (flash ? 0.6 : 1);
      // os soldados
      const fire = t > K.enfrentou - 0.1 && t < K.soldados + 0.6, blast = seg(t, K.soldados + 0.6, K.soldados + 1.4);
      soldiers.forEach((p, i) => {
        standPose(p); p.userData.arms[1].rotation.x = -1.4; p.userData.arms[0].rotation.x = -1.2;
        const v = sm(blast); const dir = tmp.set(p.position.x, 0, p.position.z).normalize();
        const bx = -3.5 + i * 1.4, bz = -6 - (i % 2) * 0.8; p.position.set(bx + dir.x * v * 5, Math.sin(v * Math.PI) * 1.2, bz + dir.z * v * 5); p.rotation.x = -v * 1.3; p.visible = t < K.ceu;
        p.updateMatrixWorld(); sp.set(0.1, 1.0, 0.75); p.userData.body.localToWorld(sp);
        const fl = fire && Math.sin(t * 40 + i * 2) > 0.6; tracers[i].geometry.setFromPoints([sp.clone(), new THREE.Vector3(D.position.x + (hash(i) - 0.5) * 0.8, 1.0 + hash(i + 1) * 0.6, 0.6)]); tracers[i].material.opacity = fl ? 0.85 : 0;
      });
      const W = blast > 0 && blast < 1 ? blast * 12 : 0; wave.visible = W > 0.05; wave.scale.set(W, W, 1); wave.material.opacity = 0.9 * (1 - blast);
      // rastro do voo
      for (let i = 0; i < 120; i++) { const k = i / 120, late = t >= K.camera7 + 0.45, b = Math.max(0, (late ? up2 : up) - k * 0.25); trail.pos[i * 3] = (late ? 0 : 2.4 * b) + (hash(i) - 0.5) * 0.3; trail.pos[i * 3 + 1] = (late ? 9 * b : 26 * b) + 1.0; trail.pos[i * 3 + 2] = (late ? 0 : -36 * b) + (hash(i + 1) - 0.5) * 0.3; } trail.upd(); trail.pts.material.opacity = !flash && y > 0.3 ? 0.85 : 0;
      // o último sorriso pra câmera do Roman
      smile.visible = flash && t > K.sorriso - 0.3; smile.position.set(0, D.position.y + 1.53 - 0.04, 0.155);
      star.material.opacity = 0.85 + 0.1 * Math.sin(t * 3); lights.forEach((l, i) => (l.rotation.z = (i ? 1 : -1) * (0.4 + Math.sin(t * 0.5 + i) * 0.15)));
    },
    cam(t) {
      const s = T.sc["s8-d"];
      const c = keys(t, [[s[0], [2.6, 1.6, 5.0], [0, 1.3, 0]], [K.david, [1.5, 1.6, 3.2], [0.3, 1.5, 0]], [K.mesma7 + 0.3, [1.2, 1.5, 3.6], [-0.4, 1.2, 0]], [K.reconstruiu, [0.9, 1.25, 2.5], [0, 1.0, 0]], [K.enfrentou, [3.6, 2.4, 5.8], [-0.5, 1, -3]], [K.pedido, [2.0, 0.6, 4.2], [0, 3, -1]], [K.ceu + 0.4, [1.0, 0.6, 3.2], [3, 33, -45]],
        [K.sorriso - 0.64, [1.0, 0.6, 3.2], [3, 33, -45]], [K.sorriso - 0.62, [0, 1.45, 2.3], [0, 1.4, 0]], [K.camera7 + 0.45, [0, 1.42, 2.2], [0, 1.4, 0]], [s[1], [0, 1.3, 2.6], [0, 5, 0]]]);
      return shakeCam(c, t, t > K.soldados + 0.5 && t < K.soldados + 1.1 ? 0.07 : 0);
    },
  };
});

// 9 · a teoria: a luz era um satélite?
addSet("s9-teoria", (g) => {
  g.add(dustPts(700, [-60, 60, -40, 60, -80, -30], 0xffffff, 0.25, 0.9, ADD, 21));
  const ptex = canvasTex(512, 256, (c) => { c.fillStyle = "#06102a"; c.fillRect(0, 0, 512, 256); for (let i = 0; i < 900; i++) { const cx = hash(i % 40 + 500) * 512, cy = 60 + hash(i % 40 + 600) * 140; c.fillStyle = hash(i) > 0.5 ? "#ffd27a" : "#ffb36b"; c.fillRect(cx + (hash(i + 1) - 0.5) * 50, cy + (hash(i + 2) - 0.5) * 24, 1.5, 1.5); } });
  const planet = mesh(sph(30, 64, 40), new THREE.MeshBasicMaterial({ map: ptex }), 0, -40, -14, g); planet.rotation.set(0.3, 0, 0.2);
  const atm = glowSprite(0x4a8aff, 78, 0.35); atm.position.set(0, -40, -16); g.add(atm);
  const sat = new THREE.Group(); g.add(sat);
  ol(mesh(box(0.8, 0.8, 1.2), M(0xc8c8d0), 0, 0, 0, sat), 0.01);
  const ptx = canvasTex(128, 64, (c) => { c.fillStyle = "#1a2a5a"; c.fillRect(0, 0, 128, 64); c.strokeStyle = "#6a8ad8"; c.lineWidth = 2; for (let x = 0; x <= 128; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 64); c.stroke(); } for (let y = 0; y <= 64; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(128, y); c.stroke(); } });
  [-1, 1].forEach((k) => { mesh(box(2.6, 0.04, 1.0), new THREE.MeshBasicMaterial({ map: ptx }), k * 1.8, 0, 0, sat); mesh(cyl(0.03, 0.03, 0.5, 6), M(0x8a8a96), k * 0.6, 0, 0, sat).rotation.z = Math.PI / 2; });
  const dish = mesh(new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), M(0xe8e8f0, { side: THREE.DoubleSide }), 0, 0, 0.8, sat); dish.rotation.x = Math.PI / 2;
  const beacon = glowSprite(0xfff6d8, 3.2, 0.9); sat.add(beacon);
  const capriGlow = glowSprite(0xff8ae8, 1.6, 0); sat.add(capriGlow);
  const N = 14; const lines = []; for (let i = 0; i < N; i++) { const l = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: i % 2 ? 0xff8ae8 : 0x4ff0ff, transparent: true, opacity: 0.9 })); const pts = new Float32Array(32 * 3); l.geometry.setAttribute("position", new THREE.BufferAttribute(pts, 3)); g.add(l); lines.push({ l, pts, a: hash(i + 3) * 6.28, r: 6 + hash(i + 4) * 16 }); }
  return {
    bg: 0x02030a, fog: [200, 400],
    update(t) {
      sat.rotation.set(0.3 + Math.sin(t * 0.3) * 0.1, t * 0.2, 0.15); beacon.material.opacity = 0.7 + 0.25 * Math.sin(t * 4);
      const nk = seg(t, K.rede - 1.4, K.rede + 0.8); capriGlow.material.opacity = 0.9 * sm(seg(t, K.satelite, K.satelite + 0.8));
      lines.forEach((o) => { const end = new THREE.Vector3(Math.cos(o.a) * o.r, -12 + Math.sin(o.a * 2) * 2, -14 + Math.sin(o.a) * o.r * 0.6); for (let j = 0; j < 32; j++) { const k = Math.min(j / 31, nk); o.pts[j * 3] = lerp(0, end.x, k); o.pts[j * 3 + 1] = lerp(0, end.y, k) + Math.sin(k * Math.PI) * 3; o.pts[j * 3 + 2] = lerp(0, end.z, k); } o.l.geometry.attributes.position.needsUpdate = true; o.l.visible = nk > 0; o.l.material.opacity = 0.85; });
      planet.rotation.y = t * 0.01;
    },
    cam(t) { const s = T.sc["s9-teoria"]; return keys(t, [[s[0], [0, 1.0, 34], [0, 0, 0]], [K.acha, [0.6, 1.0, 18], [0, 0, 0]], [K.satelite, [3.2, 1.6, 7.0], [0, 0, 0]], [K.rede, [7, 4, 16], [0, -5, -6]], [s[1], [8, 5, 19], [0, -6, -8]]]); },
  };
});

// 10 · pergunta: o deserto vazio, a câmera do Roman gravando o céu
addSet("s10-pergunta", (g) => {
  badlands(g, { seed: 10, sky: [[0, "#04030c"], [0.55, "#120a24"], [1, "#2a1430"]], moon: false });
  const star = glowSprite(0xfff6d8, 6, 0.95); star.material.fog = false; star.position.set(-4, 34, -60); g.add(star);
  const star2 = glowSprite(0xffffff, 1.6, 1); star2.material.fog = false; star2.position.copy(star.position); g.add(star2);
  const cam = filmCamera(); cam.position.set(0.5, 1.18, 1.0); cam.rotation.y = Math.PI + 0.07; cam.userData.hd.rotation.x = -0.49; g.add(cam);
  return {
    bg: 0x06040c, fog: [16, 90],
    update(t) { cam.userData.reels.forEach((r, i) => (r.rotation.y = t * (i ? 6 : 5))); cam.userData.rg.material.opacity = Math.sin(t * 6) > 0 ? 0.95 : 0.2; star.material.opacity = 0.8 + 0.15 * Math.sin(t * 3); },
    cam(t) { const s = T.sc["s10-pergunta"]; return keys(t, [[s[0], [1.2, 1.5, 3.8], [0.1, 1.7, -3]], [s[1], [1.1, 1.45, 3.5], [0.1, 1.85, -3.5]]]); },
  };
});

// thumb: a equipe em fila na rua de neon e a interrogação no alto
addSet("thumb", (g) => {
  const sky = plane(200, 90, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#05030c"], [0.6, "#1a0a2e"], [1, "#4a1a4a"]]), fog: false })); sky.position.set(0, 30, -80); g.add(sky);
  const CS = cityStreet(g);
  const crew = [[{ build: "slim", hair: "long", rim: C_AVIDA }, -1.56], [{ coat: true, rim: C_KIRIL }, -1.04], [{ build: "slim", coat: true, hair: "bun", rim: C_KYOKO }, -0.52], [{ build: "slim", rim: C_TALIA }, 0.52], [{ build: "big", rim: C_WEAK }, 1.04], [{ build: "kid", rim: C_ROMAN }, 1.56], [{ hood: true, rim: C_D }, 0]];
  const ppl = crew.map(([o, x]) => { const p = person(o); p.position.set(x, 0, x === 0 ? 0.5 : -0.2 - Math.abs(x) * 0.12); p.rotation.y = -x * 0.1; g.add(p); return p; });
  const q = holoText("?", 0xffe14d, 1.0, 0.5); q.position.set(0, 2.2, 0.5); g.add(q);
  const qg = glowSprite(0xffe14d, 1.6, 0.35); qg.position.set(0, 2.2, 0.45); g.add(qg);
  return { bg: 0x07040f, fog: [20, 95], update() { CS.upd(2.0); ppl.forEach((p) => standPose(p)); }, cam() { return { pos: [0, 1.5, 10.4], look: [0, 1.6, 0] }; } };
});

// partículas e linhas que se movem não podem ser descartadas pelo recorte de câmera
scene.traverse((o) => { if (o.isPoints || o.isLineSegments || o.isLine) o.frustumCulled = false; });

function sceneAt(t) { for (const [n, a, b] of T.scenes) if (t >= a && t < b) return n; return T.scenes[T.scenes.length - 1][0]; }
function renderAt(t) {
  const n = sceneAt(t);
  for (const k in SETS) SETS[k].group.visible = k === n;
  const s = SETS[n]; s.update(t);
  const c = s.cam(t);
  camera.position.set(...c.pos); camera.lookAt(...c.look);
  camera.position.x += Math.sin(t * 1.1) * 0.012; camera.position.y += Math.sin(t * 1.5) * 0.01;
  scene.background = new THREE.Color(s.bg);
  scene.fog = new THREE.Fog(s.bg, s.fog ? s.fog[0] : 14, s.fog ? s.fog[1] : 70);
  renderer.render(scene, camera);
}
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady["edge3d"] = (async () => {
  try { await document.fonts.load("700 48px 'Space Mono'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
