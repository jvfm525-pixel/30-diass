// Cena 3D do vídeo de curiosidade "Por que o Asta nasceu sem magia?" (símbolos originais) (Three.js).
// Tudo é função do tempo t (hf-seek). Tempos-chave em window.HF_T (gerado por tools/build_asta.py).
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


// ---------------------------------------------------------------- símbolos originais (sem personagens do anime)
rim.color.set(0x7d8cff); rim.intensity = 0.75;
const ADD = THREE.AdditiveBlending, NORM = THREE.NormalBlending;
const softTex = canvasTex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,.6)"); gr.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
function dustPts(n, b, color = 0xffe6b0, size = 0.06, opacity = 0.85, blending = ADD, seed = 0) {
  const p = [];
  for (let i = 0; i < n; i++) { const j = i + seed * 997; p.push(b[0] + hash(j) * (b[1] - b[0]), b[2] + hash(j + 7) * (b[3] - b[2]), b[4] + hash(j + 13) * (b[5] - b[4])); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color, size, map: softTex, transparent: true, opacity, depthWrite: false, blending }));
}
function flowPts(n, color, size = 0.06) { // pontos que o update reposiciona a cada quadro
  const pos = new Float32Array(n * 3); const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: softTex, transparent: true, depthWrite: false, blending: ADD }));
  return { pts, pos, geo, upd() { geo.attributes.position.needsUpdate = true; } };
}
function glowSprite(color, size = 1, opacity = 0.8, blending = ADD) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color, transparent: true, opacity, depthWrite: false, blending })); s.scale.setScalar(size); return s; }
const PALETTE = [0xff7a2a, 0x3ab0ff, 0x4cdf8a, 0xffd23f, 0xb07aff, 0xff5aa8, 0x7af0ff];
const SILM = new THREE.MeshBasicMaterial({ color: 0x0b0a12 });
const KIDM = new THREE.MeshBasicMaterial({ color: 0x15131c });
const rimM = new THREE.MeshBasicMaterial({ color: 0xdfe6ff, side: THREE.BackSide, transparent: true, opacity: 0.6 });
const rimMom = new THREE.MeshBasicMaterial({ color: 0xc8b4ff, side: THREE.BackSide, transparent: true, opacity: 0.42 });

// ---------------------------------------------------------------- texturas
function woodTex(c1 = "#4a2e1c", c2 = "#3a2416", n = 6, vertical = false) {
  return canvasTex(256, 256, (g, w, h) => {
    const s = (vertical ? w : h) / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? c1 : c2;
      if (vertical) g.fillRect(i * s, 0, s, h); else g.fillRect(0, i * s, w, s);
      g.strokeStyle = "rgba(0,0,0,.22)"; g.lineWidth = 1;
      for (let k = 1; k < 5; k++) { const o = i * s + (k * s) / 5; g.beginPath(); if (vertical) { g.moveTo(o, 0); g.bezierCurveTo(o + 3, h * 0.3, o - 3, h * 0.6, o + 1, h); } else { g.moveTo(0, o); g.bezierCurveTo(w * 0.3, o + 3, w * 0.6, o - 3, w, o + 1); } g.stroke(); }
      g.fillStyle = "rgba(0,0,0,.55)"; if (vertical) g.fillRect(i * s, 0, 2, h); else g.fillRect(0, i * s, w, 2);
    }
  });
}
function brickTex(c1 = "#43363c", c2 = "#382c32", mortar = "#16111a") {
  return canvasTex(256, 256, (g, w, h) => { g.fillStyle = mortar; g.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { g.fillStyle = (r * 3 + c + 9) % 3 ? c1 : c2; g.fillRect(c * 64 + (r % 2) * 32 + 2, r * 32 + 2, 60, 28); } });
}
function stoneTex(c1 = "#55505e", c2 = "#4a4554", grout = "#26232c") {
  return canvasTex(256, 256, (g) => { g.fillStyle = grout; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? c1 : c2; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); } });
}
function grassTex(c1 = "#22382a", c2 = "#1a2c20") {
  return canvasTex(256, 256, (g, w, h) => { g.fillStyle = c2; g.fillRect(0, 0, w, h); g.lineWidth = 1.5; for (let i = 0; i < 700; i++) { g.strokeStyle = i % 3 ? c1 : "#2a4632"; const x = hash(i) * w, y = hash(i + 5) * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hash(i + 9) - 0.5) * 6, y - 5 - hash(i + 3) * 8); g.stroke(); } });
}
function cobble(c1 = "#4a4652", c2 = "#3f3b47") { return canvasTex(256, 256, (g, w, h) => { g.fillStyle = c2; g.fillRect(0, 0, w, h); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? c1 : c2; g.beginPath(); g.ellipse(x * 32 + 16 + (y % 2) * 8, y * 32 + 16, 13, 11, 0, 0, 7); g.fill(); } }); }

// ---------------------------------------------------------------- personagens (silhuetas genéricas)
function mage(color, opt = {}) { // mago genérico (aura colorida) ou a criança sem magia (sem aura, contorno claro)
  const g = new THREE.Group();
  const child = !!opt.child, robe = !!opt.robe && !child;
  const s = opt.scale ?? (child ? 0.72 : 1);
  const m = opt.mat || (child ? KIDM : SILM);
  const up = robe ? 0.25 * s : 0;
  const body = new THREE.Group(); g.add(body);
  const parts = [];
  if (robe) parts.push(mesh(new THREE.CylinderGeometry(0.2 * s, 0.42 * s, 1.3 * s, 14), m, 0, 0.65 * s, 0, body));
  else [-1, 1].forEach((k) => parts.push(mesh(cap(0.08 * s, 0.6 * s), m, 0.1 * k * s, 0.4 * s, 0, body)));
  parts.push(mesh(cap(0.2 * s, 0.45 * s), m, 0, 1.0 * s + up, 0, body));
  const head = mesh(sph(0.16 * s, 16, 12), m, 0, 1.5 * s + up, 0, body); parts.push(head);
  const arms = [-1, 1].map((k) => { const a = new THREE.Group(); a.position.set(0.25 * k * s, 1.25 * s + up, 0); body.add(a); parts.push(mesh(cap(0.06 * s, 0.45 * s), m, 0, -0.28 * s, 0, a)); a.rotation.z = 0.15 * k; return a; });
  if (opt.hat && !child) { const h = mesh(new THREE.ConeGeometry(0.2 * s, 0.5 * s, 12), m, 0.02 * s, 0.32 * s, 0, head); h.rotation.z = -0.18; mesh(cyl(0.3 * s, 0.3 * s, 0.025 * s, 18), m, 0, 0.09 * s, 0, head); }
  let tip = null;
  if (opt.staff && !child && color != null) { mesh(cyl(0.022 * s, 0.022 * s, 1.75 * s, 6), m, 0, -0.25 * s, 0.06 * s, arms[1]); tip = glowSprite(color, 0.45 * s, 0.95); tip.position.set(0, 0.64 * s, 0.06 * s); arms[1].add(tip); }
  if (child) parts.forEach((p) => ol(p, 0.02 * (s / 0.72), rimM));
  let aura = null, orbit = null;
  if (color != null) {
    aura = glowSprite(color, 2.4 * s, 0.55); aura.position.y = 0.95 * s; g.add(aura);
    orbit = new THREE.Group(); orbit.position.y = 0.9 * s; g.add(orbit);
    const om = glowM(color, 1);
    for (let i = 0; i < 6; i++) mesh(sph(0.035, 8, 6), om, Math.cos(i) * 0.45, (i % 3) * 0.3 - 0.3, Math.sin(i) * 0.45, orbit);
  }
  g.userData = { body, head, arms, aura, orbit, color, child, s, up, tip };
  return g;
}
function mageIdle(g, t, i = 0) {
  const u = g.userData;
  u.body.position.y = Math.abs(Math.sin(t * 1.6 + i)) * 0.02;
  if (u.orbit) { u.orbit.rotation.y = t * (1 + (i % 3) * 0.3); u.orbit.rotation.x = Math.sin(t * 0.7 + i) * 0.4; }
  if (u.aura) u.aura.material.opacity = 0.45 + 0.12 * Math.sin(t * 3 + i);
  if (u.tip) u.tip.material.opacity = 0.75 + 0.2 * Math.sin(t * 5 + i);
}
function kidPose(kid, down = 0, hands = 0) { // cabeça baixa e mãos à frente (olhando as próprias mãos)
  const u = kid.userData, s = u.s;
  u.head.position.set(0, (1.5 - 0.06 * down) * s + u.up, 0.08 * down * s);
  u.arms.forEach((a, i) => { a.rotation.x = -1.1 * hands; a.rotation.z = (i ? 1 : -1) * (0.15 - 0.08 * hands); });
}
function magicField(g, n, b, kidPosFn, size = 0.1) { // partículas mágicas que sobem; perto da criança, perdem a cor
  const F = flowPts(n, 0xffffff, size); const col = new Float32Array(n * 3);
  F.geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); F.pts.material.vertexColors = true; g.add(F.pts);
  const base = []; for (let i = 0; i < n; i++) base.push(b[0] + hash(i) * (b[1] - b[0]), hash(i + 7), b[4] + hash(i + 13) * (b[5] - b[4]));
  const c = new THREE.Color();
  return (t) => {
    const kp = kidPosFn ? kidPosFn() : null;
    for (let i = 0; i < n; i++) {
      const x = base[i * 3] + Math.sin(t * 0.6 + i) * 0.15, z = base[i * 3 + 2] + Math.cos(t * 0.5 + i) * 0.15;
      const y = b[2] + ((base[i * 3 + 1] * (b[3] - b[2]) + t * (0.25 + hash(i + 3) * 0.3)) % (b[3] - b[2]));
      F.pos[i * 3] = x; F.pos[i * 3 + 1] = y; F.pos[i * 3 + 2] = z;
      c.setHex(PALETTE[i % PALETTE.length]);
      let k = 1; if (kp) { const d = Math.hypot(x - kp.x, z - kp.z); k = clamp((d - 0.4) / 1.4, 0.06, 1); }
      col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
    }
    F.upd(); F.geo.attributes.color.needsUpdate = true;
  };
}
function darkBook(s = 1) { // livro escuro original (capa lisa com um anel prateado; nada de trevo)
  const g = new THREE.Group();
  const cover = M(0x14111a);
  ol(mesh(box(0.7 * s, 0.14 * s, 0.95 * s), cover, 0, 0, 0, g), 0.01 * s);
  mesh(box(0.66 * s, 0.11 * s, 0.9 * s), M(0xe6d8b4), 0.02 * s, 0, 0, g);
  mesh(box(0.06 * s, 0.16 * s, 0.97 * s), cover, -0.34 * s, 0, 0, g);
  const ring = mesh(new THREE.TorusGeometry(0.16 * s, 0.025 * s, 8, 28), M(0xb8c0cc), 0, 0.075 * s, 0, g); ring.rotation.x = Math.PI / 2;
  mesh(box(0.08 * s, 0.17 * s, 0.12 * s), M(0x5a5f6a), 0.36 * s, 0, 0, g);
  return g;
}
function openBook(s = 1) { // o mesmo livro, com as duas metades articuladas na lombada
  const g = new THREE.Group();
  const coverM = M(0x14111a), pageM = M(0xe6d8b4);
  const halves = [-1, 1].map((k) => { const h = new THREE.Group(); g.add(h); ol(mesh(box(0.36 * s, 0.03 * s, 0.95 * s), coverM, 0.18 * s * k, 0, 0, h), 0.008 * s); mesh(box(0.33 * s, 0.05 * s, 0.9 * s), pageM, 0.17 * s * k, 0.04 * s, 0, h); return h; });
  const ring = mesh(new THREE.TorusGeometry(0.12 * s, 0.02 * s, 8, 24), M(0xb8c0cc), -0.18 * s, -0.02 * s, 0, halves[0]); ring.rotation.x = Math.PI / 2;
  const spine = mesh(cyl(0.035 * s, 0.035 * s, 0.97 * s, 8), coverM, 0, 0.01 * s, 0, g); spine.rotation.x = Math.PI / 2;
  const glow = glowSprite(0x8a7aff, 1.3 * s, 0); glow.position.y = 0.15 * s; g.add(glow);
  g.userData = { halves, glow, s };
  return g;
}
function setOpen(b, k) { // k: 0 fechado → 1 aberto
  const u = b.userData, s = u.s;
  u.halves[0].rotation.z = lerp(-Math.PI, -0.22, k); u.halves[0].position.y = 0.13 * s * (1 - k);
  u.halves[1].rotation.z = lerp(0, 0.22, k);
  u.glow.material.opacity = 0.75 * k;
}
function chainLine(parent, a, b, y, r, mat) { // corrente de elos alternados entre dois pontos (plano xz local)
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), n = Math.floor(L / (r * 1.9)), phi = Math.atan2(dz, dx);
  const geo = new THREE.TorusGeometry(r, r * 0.28, 6, 14);
  for (let i = 0; i <= n; i++) { const k = i / n; const lg = new THREE.Group(); lg.position.set(a[0] + dx * k, y, a[1] + dz * k); lg.rotation.y = -phi; parent.add(lg); const l = mesh(geo, mat, 0, 0, 0, lg); l.scale.set(1.5, 1, 1); l.rotation.x = i % 2 ? Math.PI / 2 : 0; }
}
function shadowImp(s = 1) { // pequeno ser de sombra original: corpo de fumaça, olhos brancos, chifrinhos
  const g = new THREE.Group();
  const dark = new THREE.MeshBasicMaterial({ color: 0x08070c });
  const body = mesh(sph(0.32, 20, 16), dark, 0, 0.42, 0, g); body.scale.set(1, 1.15, 0.9);
  const puffs = []; for (let i = 0; i < 9; i++) puffs.push(mesh(sph(0.1 + hash(i) * 0.08, 10, 8), dark, Math.cos(i * 0.7) * 0.28, 0.12 + hash(i + 2) * 0.15, Math.sin(i * 0.7) * 0.2, g));
  [-1, 1].forEach((k) => { const h = mesh(new THREE.ConeGeometry(0.045, 0.16, 8), dark, 0.15 * k, 0.8, 0.02, g); h.rotation.z = -0.45 * k; });
  const tail = new THREE.Group(); tail.position.set(0, 0.25, -0.25); g.add(tail);
  mesh(cap(0.025, 0.3), dark, 0, 0.12, -0.06, tail).rotation.x = -0.7; mesh(new THREE.ConeGeometry(0.05, 0.1, 4), dark, 0, 0.27, -0.2, tail).rotation.x = -0.7;
  const eyeM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyes = [-1, 1].map((k) => { const e = mesh(sph(0.075, 14, 10), eyeM, 0.11 * k, 0.5, 0.27, g); e.scale.z = 0.4; return e; });
  const arms = [-1, 1].map((k) => { const a = new THREE.Group(); a.position.set(0.28 * k, 0.4, 0.02); g.add(a); mesh(cap(0.04, 0.16), dark, 0, -0.1, 0, a); a.rotation.z = 0.8 * k; return a; });
  g.scale.setScalar(s);
  g.userData = { eyes, puffs, arms, body, tail };
  return g;
}
function impIdle(c, t) { const u = c.userData; u.body.scale.y = 1.15 + Math.sin(t * 2) * 0.04; u.puffs.forEach((p, i) => (p.position.y = 0.12 + hash(i + 2) * 0.15 + Math.sin(t * 3 + i) * 0.03)); const bl = (t % 3.3) < 0.12; u.eyes.forEach((e) => (e.scale.y = bl ? 0.15 : 1)); u.tail.rotation.z = Math.sin(t * 2.2) * 0.35; }
function hooded(color = 0x0b0a12, o = {}) { // silhueta de capuz (a mãe), sem rosto
  const g = new THREE.Group();
  const m = o.mat || new THREE.MeshBasicMaterial({ color, transparent: true });
  const parts = [];
  parts.push(mesh(new THREE.CylinderGeometry(0.22, 0.52, 1.5, 18), m, 0, 0.75, 0, g));
  const sh = mesh(sph(0.3, 16, 12), m, 0, 1.55, 0, g); sh.scale.set(1.2, 0.7, 0.85); parts.push(sh);
  const hood = mesh(new THREE.SphereGeometry(0.24, 18, 14), m, 0, 1.86, 0, g); hood.scale.set(1, 1.2, 1.05); parts.push(hood);
  const tip = mesh(new THREE.ConeGeometry(0.12, 0.25, 10), m, 0, 2.08, -0.08, g); tip.rotation.x = -0.6; parts.push(tip);
  const arm = new THREE.Group(); arm.position.set(0.3, 1.55, 0); g.add(arm); parts.push(mesh(cap(0.06, 0.5), m, 0, -0.3, 0, arm));
  if (o.rim) parts.forEach((p) => ol(p, 0.018, o.rim));
  g.userData = { arm, m };
  return g;
}
function blackCat() { // gato preto (símbolo de azar), olhos amarelos
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: 0x050407 });
  const body = mesh(sph(0.2, 16, 12), m, 0, 0.2, 0, g); body.scale.set(0.9, 1.15, 1.1);
  const head = new THREE.Group(); head.position.set(0, 0.5, 0.06); g.add(head);
  mesh(sph(0.13, 16, 12), m, 0, 0, 0, head);
  [-1, 1].forEach((k) => { const e = mesh(new THREE.ConeGeometry(0.05, 0.12, 4), m, 0.075 * k, 0.12, 0, head); e.rotation.z = -0.25 * k; });
  const eyes = [-1, 1].map((k) => { const e = mesh(sph(0.028, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe14a }), 0.05 * k, 0.02, 0.112, head); e.scale.set(1, 0.7, 0.5); mesh(box(0.008, 0.04, 0.01), m, 0, 0, 0.03, e); return e; });
  const eg = glowSprite(0xffe14a, 0.22, 0.55); eg.position.set(0, 0.02, 0.13); head.add(eg);
  const tail = new THREE.Group(); tail.position.set(0, 0.08, -0.2); g.add(tail);
  mesh(cap(0.025, 0.4), m, 0, 0.2, 0, tail).rotation.x = -0.3;
  g.userData = { head, eyes, tail };
  return g;
}
function bully(col) { // sombra maior, com magia (olhos e aura coloridos)
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: 0x0a0812, transparent: true });
  mesh(new THREE.ConeGeometry(0.55, 2.0, 14), m, 0, 1.0, 0, g);
  mesh(sph(0.3, 14, 10), m, 0, 2.15, 0, g);
  [-1, 1].forEach((k) => { const h = mesh(new THREE.ConeGeometry(0.07, 0.36, 8), m, 0.17 * k, 2.45, 0, g); h.rotation.z = -0.5 * k; });
  const arm = new THREE.Group(); arm.position.set(0.32, 1.6, 0.05); g.add(arm); mesh(cap(0.07, 0.6), m, 0, -0.38, 0, arm); arm.rotation.z = 0.3;
  const em = new THREE.MeshBasicMaterial({ color: col, transparent: true });
  [-1, 1].forEach((k) => mesh(sph(0.055, 8, 6), em, 0.11 * k, 2.2, 0.26, g));
  const eg = glowSprite(col, 0.5, 0.8); eg.position.set(0, 2.2, 0.3); g.add(eg);
  const aura = glowSprite(col, 2.8, 0.35); aura.position.y = 1.2; g.add(aura);
  g.userData = { m, em, eg, aura, arm };
  return g;
}

// ---------------------------------------------------------------- cenário
function nightSky(g, stops = [[0, "#070a1e"], [0.65, "#1d2450"], [1, "#4a3a6a"]], o = {}) {
  const sky = plane(170, 76, new THREE.MeshBasicMaterial({ map: skyTex(stops), fog: false })); sky.position.set(0, 18, -56); g.add(sky);
  const st = dustPts(420, [-70, 70, 6, 55, -54, -53], 0xffffff, 0.28, 0.95, ADD, 3); st.material.fog = false; g.add(st);
  const mp = o.moon || [9, 17, -50], mr = o.moonR || 2.4, mc = o.moonCol || 0xfff4d6;
  const moon = mesh(sph(mr, 28, 20), new THREE.MeshBasicMaterial({ color: mc, fog: false }), mp[0], mp[1], mp[2], g);
  const mg = glowSprite(mc, mr * 6.5, 0.45); mg.material.fog = false; mg.position.set(mp[0], mp[1], mp[2] + 0.6); g.add(mg);
  for (let i = 0; i < (o.clouds ?? 7); i++) { const c = glowSprite(o.cloudCol || 0x252a50, 16 + hash(i + 40) * 12, 0.5, NORM); c.material.fog = false; c.position.set((hash(i + 41) - 0.5) * 90, 6 + hash(i + 42) * 26, -51); c.scale.y *= 0.3; g.add(c); }
  return { st, moon };
}
function castle(g, x, z, s = 1) {
  const c = new THREE.Group(); c.position.set(x, 0, z); c.scale.setScalar(s); g.add(c);
  const dm = new THREE.MeshBasicMaterial({ color: 0x161838 });
  const wm = new THREE.MeshBasicMaterial({ color: 0xffd27a, fog: false });
  const fm = new THREE.MeshBasicMaterial({ color: 0x8ef0b0, fog: false });
  mesh(new THREE.ConeGeometry(9, 4, 6), dm, 0, 2, 0, c);
  [[-2.4, 7, 1.2], [0, 9, 1.5], [2.4, 6.5, 1.1], [-4, 5, 0.9], [4.2, 5.5, 0.9]].forEach(([tx, h, w]) => {
    mesh(box(w, h, w), dm, tx, 4 + h / 2, 0, c); mesh(new THREE.ConeGeometry(w * 0.8, 1.6, 6), dm, tx, 4 + h + 0.8, 0, c);
    for (let k = 0; k < 3; k++) mesh(box(0.25, 0.4, 0.05), wm, tx, 5 + k * (h / 3.2), w / 2 + 0.02, c);
    mesh(cyl(0.03, 0.03, 1.0, 4), dm, tx, 4 + h + 2.0, 0, c); mesh(box(0.5, 0.3, 0.02), fm, tx + 0.26, 4 + h + 2.3, 0, c);
  });
  return c;
}
function house(g, x, z, rotY, w, h, d, col, lit, seed, roofCol = 0x2e2228) {
  const hg = new THREE.Group(); hg.position.set(x, 0, z); hg.rotation.y = rotY; g.add(hg);
  building(hg, 0, 0, w, h, d, col, lit, seed);
  const rg = new THREE.Group(); rg.position.y = h; rg.scale.set(w * 1.12, 1, d * 1.12); hg.add(rg);
  const r = mesh(new THREE.ConeGeometry(Math.SQRT1_2, 1.0, 4), M(roofCol), 0, 0.5, 0, rg); r.rotation.y = Math.PI / 4;
  if (hash(seed + 4) > 0.5) mesh(box(0.25, 0.7, 0.25), M(0x2a2228), w * 0.25, h + 0.6, -d * 0.15, hg);
  return hg;
}
function lampPost(g, x, z, h = 2.4, col = 0xffc27a) {
  const p = new THREE.Group(); p.position.set(x, 0, z); g.add(p);
  mesh(cyl(0.04, 0.06, h, 8), M(0x1a1820), 0, h / 2, 0, p);
  mesh(box(0.22, 0.04, 0.22), M(0x1a1820), 0, h + 0.27, 0, p);
  mesh(box(0.16, 0.22, 0.16), new THREE.MeshBasicMaterial({ color: col }), 0, h + 0.13, 0, p);
  const gl = glowSprite(col, 1.3, 0.75); gl.position.y = h + 0.13; p.add(gl);
  return p;
}
function torch(g, x, y, z, col = 0xff9a3a, s = 1) {
  const t = new THREE.Group(); t.position.set(x, y, z); g.add(t);
  mesh(cyl(0.035 * s, 0.05 * s, 0.5 * s, 8), M(0x2a1a10), 0, -0.25 * s, 0, t);
  const f1 = glowSprite(col, 0.55 * s, 0.95), f2 = glowSprite(0xfff0c0, 0.22 * s, 0.9), f3 = glowSprite(col, 1.7 * s, 0.35);
  f1.position.y = 0.12 * s; f2.position.y = 0.08 * s; f3.position.y = 0.1 * s; t.add(f1, f2, f3);
  return (time) => { const k = 0.85 + 0.15 * Math.sin(time * 13 + x * 3) + 0.08 * Math.sin(time * 29 + z); f1.scale.setScalar(0.55 * s * k); f3.material.opacity = 0.32 * k; f1.position.y = 0.12 * s + 0.02 * Math.sin(time * 17 + x); };
}
function deadTree(g, x, z, h = 3, seed = 1) {
  const m = new THREE.MeshBasicMaterial({ color: 0x07060b });
  const tr = new THREE.Group(); tr.position.set(x, 0, z); tr.rotation.y = hash(seed) * 6.28; g.add(tr);
  const k = h / 3;
  mesh(cyl(0.06 * k, 0.16 * k, h, 7), m, 0, h / 2, 0, tr);
  for (let i = 0; i < 5; i++) {
    const L = h * (0.36 - i * 0.04); const b = new THREE.Group(); b.position.y = h * (0.45 + i * 0.11); b.rotation.set(0, i * 2.4 + seed, 0.7 + hash(seed + i) * 0.5); tr.add(b);
    mesh(cyl(0.015 * k, 0.05 * k, L, 5), m, 0, L / 2, 0, b);
    const b2 = new THREE.Group(); b2.position.y = L * 0.7; b2.rotation.z = -0.8; b.add(b2); mesh(cyl(0.01 * k, 0.025 * k, L * 0.5, 4), m, 0, L * 0.25, 0, b2);
  }
  return tr;
}
function leafyTree(g, x, z, h = 3, seed = 1, col = 0x0a0a12) {
  const m = new THREE.MeshBasicMaterial({ color: col }); const k = h / 3;
  const tr = new THREE.Group(); tr.position.set(x, 0, z); g.add(tr);
  mesh(cyl(0.1 * k, 0.18 * k, h * 0.6, 8), m, 0, h * 0.3, 0, tr);
  for (let i = 0; i < 6; i++) mesh(sph((0.5 + hash(seed + i) * 0.3) * k, 10, 8), m, (hash(seed + i + 1) - 0.5) * 1.3 * k, h * (0.65 + hash(seed + i + 2) * 0.25), (hash(seed + i + 3) - 0.5) * 0.8 * k, tr);
  return tr;
}
function rockAt(g, x, y, z, r, seed = 1, col = 0x3a3444) { const k = mesh(new THREE.DodecahedronGeometry(r, 0), M(col), x, y, z, g); k.rotation.set(hash(seed), hash(seed + 1) * 3, hash(seed + 2)); k.scale.y = 0.6 + hash(seed + 3) * 0.4; return k; }
function lightString(g, a, b, n, sag, colors, size = 0.35) {
  const out = []; const wire = [];
  for (let i = 0; i <= n; i++) { const k = i / n; const p = [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * sag, lerp(a[2], b[2], k)]; wire.push(...p); const s = glowSprite(colors[i % colors.length], size, 0.9); s.position.set(...p); g.add(s); out.push(s); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(wire, 3)); g.add(new THREE.Line(wg, new THREE.LineBasicMaterial({ color: 0x050408 })));
  return out;
}

// 1 · a multidão mágica e a criança sem brilho
function crowdSet(g, n = 46, seed = 1) {
  nightSky(g);
  castle(g, -1, -36, 1.15);
  g.add(floorP(100, 100, M(0xffffff, { map: rep(cobble(), 20, 20) })));
  [[-6.2, -15, 0.15, 3.4, 4.6], [-2.6, -17.5, 0, 2.8, 3.6], [2.9, -17, 0, 3.0, 5.2], [6.4, -14.5, -0.2, 3.2, 4.0], [-8.6, -8, 1.3, 3.0, 3.6], [8.8, -8.5, -1.3, 3.0, 4.4]].forEach(([x, z, r, w, h], i) => house(g, x, z, r, w, h, 2.8, [0x3a3448, 0x40384e, 0x352f44][i % 3], 0xffd27a, 20 + i));
  lightString(g, [-6.5, 4.4, -12], [6.5, 4.6, -12], 18, 0.9, [0xffd27a, 0x8ef0b0, 0xff8ad0, 0x7af0ff], 0.32);
  lightString(g, [-6.5, 4.0, -7.5], [6.5, 4.2, -7.5], 18, 0.8, [0xffd27a, 0xb07aff, 0x7af0ff, 0xff7a2a], 0.32);
  const lanterns = []; for (let i = 0; i < 22; i++) { const l = glowSprite(0xffc27a, 0.5, 0.9); g.add(l); lanterns.push(l); }
  const crowd = [];
  for (let i = 0; i < n; i++) {
    const a = hash(i * 3 + seed) * Math.PI * 2, r = 1.3 + hash(i * 5 + seed) * 5.5;
    let x = Math.cos(a) * r; const z = -3 + Math.sin(a) * r * 0.8;
    if (z > -3.8 && Math.abs(x - 0.3) < 1.2) x += (x >= 0.3 ? 1 : -1) * 1.4; // deixa livre o corredor da câmera
    const m = mage(PALETTE[i % PALETTE.length], { robe: i % 3 === 0, hat: i % 4 === 1, staff: i % 5 === 2 });
    m.position.set(x, 0, z); m.rotation.y = hash(i + 9) * 6.28; g.add(m); crowd.push(m);
  }
  const kid = mage(null, { child: true }); kid.position.set(0, 0, -3); g.add(kid);
  const spot = glowSprite(0xbfd0ff, 2.4, 0.16); spot.position.set(0, 0.7, -3); g.add(spot);
  const field = magicField(g, 520, [-8, 8, 0, 7, -12, 3], () => kid.position);
  const upd = (t) => { crowd.forEach((m, i) => mageIdle(m, t, i)); field(t); lanterns.forEach((l, i) => l.position.set((hash(i + seed) - 0.5) * 16 + Math.sin(t * 0.3 + i) * 0.3, 2.4 + hash(i + 3) * 5 + Math.sin(t * 0.5 + i) * 0.25, -4 - hash(i + 5) * 12)); };
  return { crowd, kid, upd };
}
addSet("s1-multidao", (g) => {
  const C = crowdSet(g);
  return {
    bg: 0x070a1e, fog: [16, 80],
    update(t) { C.upd(t); kidPose(C.kid, 0.4 + 0.6 * sm(seg(t, K.zero - 0.3, K.zero + 0.5)), 0); },
    cam(t) { const s = T.sc["s1-multidao"]; return keys(t, [[s[0], [0, 3.0, 9.5], [0, 2.6, -8]], [K.zero - 0.6, [0.5, 2.0, 3.6], [0, 1.0, -3]], [K.motivo, [0.4, 1.5, 1.4], [0, 0.85, -3]], [K.coracao, [0.3, 1.15, 0.5], [0, 0.85, -3]], [s[1], [0.3, 1.1, 0.3], [0, 0.85, -3]]]); },
  };
});

// 2 · a torre dos grimórios
addSet("s2-torre", (g) => {
  nightSky(g, [[0, "#0a0f2a"], [0.7, "#24305e"], [1, "#6a4a7a"]], { moon: [-14, 21, -50] });
  g.add(floorP(100, 100, M(0xffffff, { map: rep(grassTex(), 24, 24) })));
  const path = floorP(2.2, 9.5, M(0xffffff, { map: rep(stoneTex(), 2, 9) }), 0.01); path.position.z = -4.0; g.add(path);
  const plaza = mesh(new THREE.CircleGeometry(5.2, 40), M(0xffffff, { map: rep(stoneTex("#4f4a5a", "#45404f"), 6, 6) }), 0, 0.012, -10, g); plaza.rotation.x = -Math.PI / 2;
  const tower = new THREE.Group(); tower.position.set(0, 0, -10); g.add(tower);
  const stone = M(0x8d8a9a);
  ol(mesh(cyl(2.2, 2.4, 0.5, 28), M(0x6d6a7a), 0, 0.25, 0, tower), 0.03);
  for (let i = 0; i < 9; i++) { ol(mesh(cyl(1.6 - i * 0.06, 1.65 - i * 0.06, 1.4, 22), stone, 0, 1.2 + i * 1.4, 0, tower), 0.03); mesh(new THREE.TorusGeometry(1.66 - i * 0.06, 0.06, 6, 28), M(0x6d6a7a), 0, 1.9 + i * 1.4, 0, tower).rotation.x = Math.PI / 2; }
  ol(mesh(new THREE.ConeGeometry(1.95, 2.8, 22), M(0x3a2f5a), 0, 14.4, 0, tower), 0.04);
  for (let i = 0; i < 16; i++) { const a = i * 0.9, y = 1.6 + i * 0.72; const w = mesh(box(0.28, 0.45, 0.05), new THREE.MeshBasicMaterial({ color: 0xffd27a }), Math.cos(a) * 1.58, y, Math.sin(a) * 1.58, tower); w.lookAt(Math.cos(a) * 9, y, -10 + Math.sin(a) * 9); }
  ol(mesh(box(0.95, 1.7, 0.12), M(0x3a2618), 0, 1.35, 1.62, tower), 0.01);
  const dg = glowSprite(0xffd27a, 2.0, 0.45); dg.position.set(0, 1.4, 1.9); tower.add(dg);
  [-1, 1].forEach((k) => { const b = mesh(new THREE.PlaneGeometry(0.55, 2.6), M(k < 0 ? 0x8a2a3a : 0x2a6a4a, { side: THREE.DoubleSide }), 0.95 * k, 5.6, 1.16, tower); b.rotation.y = 0.72 * k; mesh(box(0.7, 0.05, 0.05), M(0xc9a227), 0.95 * k, 6.95, 1.16, tower).rotation.y = 0.72 * k; });
  const ring1 = mesh(new THREE.TorusGeometry(2.6, 0.04, 8, 64), glowM(0xb8a0ff, 0.8), 0, 16.6, 0, tower); ring1.rotation.x = Math.PI / 2;
  const ring2 = mesh(new THREE.TorusGeometry(2.0, 0.025, 8, 64), glowM(0x8ef0b0, 0.7), 0, 17.0, 0, tower); ring2.rotation.x = Math.PI / 2;
  const topGlow = glowSprite(0xb8a0ff, 7, 0.55); topGlow.position.set(0, 16.2, 0); tower.add(topGlow);
  const orbitBooks = []; for (let i = 0; i < 16; i++) { const b = darkBook(0.6); b.children[0].material = M(PALETTE[i % PALETTE.length]); g.add(b); orbitBooks.push(b); }
  [-1.5, -4.5, -7.5].forEach((z) => lampPost(g, -1.6, z, 2.3)); lampPost(g, 1.6, -7.5, 2.3);
  for (let i = 0; i < 12; i++) { const k = i % 2 ? 1 : -1; mesh(sph(0.3 + hash(i + 60) * 0.18, 10, 8), M(0x1e3a26), k * (1.3 + hash(i + 61) * 0.25), 0.22, -0.6 - Math.floor(i / 2) * 0.62, g); }
  const row = []; for (let i = 0; i < 5; i++) { const th = -0.76 + i * 0.38; const m = mage(PALETTE[(i * 2) % PALETTE.length], { robe: i % 2 === 0, hat: i === 1 }); m.position.set(Math.sin(th) * 4.4, 0, -10 + Math.cos(th) * 4.4); g.add(m); row.push(m); }
  const kid = mage(null, { child: true }); kid.position.set(1.7, 0, -3.0); g.add(kid);
  const falling = row.map((m, i) => { const b = darkBook(0.5); b.children[0].material = M(PALETTE[(i * 2) % PALETTE.length]); g.add(b); const gl = glowSprite(PALETTE[(i * 2) % PALETTE.length], 0.9, 0); b.add(gl); b.userData.gl = gl; return b; });
  const field = magicField(g, 300, [-7, 7, 0, 8, -12, 2], () => kid.position);
  return {
    bg: 0x0a0f2a, fog: [18, 80],
    update(t) {
      field(t); ring1.rotation.z = t * 0.4; ring2.rotation.z = -t * 0.6;
      orbitBooks.forEach((b, i) => { const a = t * 0.5 + i * 0.4; b.position.set(Math.cos(a) * 3.3, 8.2 + i * 0.4 + Math.sin(t + i) * 0.2, -10 + Math.sin(a) * 3.3); b.rotation.set(0.3, -a, 0.2); });
      falling.forEach((b, i) => {
        const a0 = K.grimorio1 - 1.6 + i * 0.3, e = a0 + 1.5; const k = sm(seg(t, a0, e));
        const m = row[i]; const tx = m.position.x, ty = 1.35, tz = m.position.z + 0.42;
        b.position.set(lerp(0, tx, k), lerp(13.5, ty, k) + Math.sin(k * Math.PI) * 1.6, lerp(-10, tz, k)); b.rotation.set(k * 6.3, k * 4, 0); b.visible = t > a0;
        const on = seg(t, e, e + 0.5);
        mageIdle(m, t, i); m.userData.aura.material.opacity *= on; m.userData.orbit.visible = on > 0.05; b.userData.gl.material.opacity = 0.8 * on;
        if (on > 0) { b.position.set(tx, ty + Math.sin(t * 2 + i) * 0.05, tz); b.rotation.set(1.2, 0, Math.sin(t + i) * 0.1); }
      });
      const look = sm(seg(t, K.nada - 0.5, K.nada + 0.4)); kidPose(kid, 0.3 + 0.7 * look, look);
    },
    cam(t) { const s = T.sc["s2-torre"]; return keys(t, [[s[0], [0, 1.8, 12], [0, 8.2, -10]], [K.anos1, [2.6, 2.6, 3.0], [0, 1.9, -6.5]], [K.grimorio1 + 1.1, [2.4, 2.3, 2.2], [0, 1.6, -6.5]], [K.nada - 0.25, [2.55, 1.2, -0.4], [1.7, 0.85, -3.0]], [s[1], [2.35, 1.1, -0.8], [1.7, 0.85, -3.0]]]); },
  };
});

// 3 · azar? (mesa de taverna, gato preto e dados)
function diceFace(n) {
  return canvasTex(128, 128, (c) => { c.fillStyle = "#f4f1ea"; c.fillRect(0, 0, 128, 128); c.fillStyle = "#c4122a"; const P = { 1: [[64, 64]], 2: [[34, 34], [94, 94]], 3: [[30, 30], [64, 64], [98, 98]], 4: [[34, 34], [94, 34], [34, 94], [94, 94]], 5: [[30, 30], [98, 30], [64, 64], [30, 98], [98, 98]], 6: [[34, 28], [94, 28], [34, 64], [94, 64], [34, 100], [94, 100]] }[n]; P.forEach(([x, y]) => { c.beginPath(); c.arc(x, y, n === 1 ? 16 : 11, 0, 7); c.fill(); }); });
}
addSet("s3-azar", (g) => {
  g.add(floorP(7, 6, M(0xffffff, { map: rep(woodTex("#6a4428", "#5a381f", 8), 2, 2) })));
  const wall = plane(14, 8, M(0xffffff, { map: rep(woodTex("#2e1e14", "#26180f", 10, true), 4, 1) })); wall.position.set(0, 3, -3.4); g.add(wall);
  for (let i = 0; i < 16; i++) { const b = glowSprite([0xffc27a, 0xff9a5a, 0xffe0a8][i % 3], 0.3 + hash(i + 2) * 0.45, 0.35); b.position.set((hash(i) - 0.5) * 5, 0.25 + hash(i + 1) * 1.3, -3.2); g.add(b); }
  const candle = new THREE.Group(); candle.position.set(0.62, 0, -1.15); g.add(candle);
  mesh(cyl(0.13, 0.15, 0.04, 16), M(0xb08a3a), 0, 0.02, 0, candle);
  mesh(cyl(0.05, 0.05, 0.32, 12), M(0xf2e8d0), 0, 0.2, 0, candle);
  const fl1 = glowSprite(0xffb347, 0.22, 0.95), fl2 = glowSprite(0xffe9b0, 0.1, 1), fl3 = glowSprite(0xff9a3a, 1.4, 0.3); fl1.position.y = 0.42; fl2.position.y = 0.41; fl3.position.y = 0.42; candle.add(fl1, fl2, fl3);
  const cl = new THREE.PointLight(0xffa24a, 3.5, 5); cl.position.set(0.62, 0.6, -1.0); g.add(cl);
  for (let i = 0; i < 6; i++) mesh(cyl(0.06, 0.06, 0.012, 16), M(0xd9a520), 0.25 + hash(i + 20) * 0.6, 0.006 + (i % 2) * 0.012, 0.35 + hash(i + 21) * 0.45, g);
  [[-0.72, 0.4, 0.4], [-0.58, 0.05, -0.3]].forEach(([x, z, r]) => { mesh(box(0.22, 0.006, 0.32), M(0xf2efe6), x, 0.004, z, g).rotation.y = r; mesh(box(0.06, 0.008, 0.06), M(0xc4122a), x, 0.008, z, g).rotation.y = r; });
  const cat = blackCat(); cat.position.set(-0.5, 0, -1.5); cat.rotation.y = 0.35; g.add(cat);
  const spot = new THREE.SpotLight(0xfff1d6, 26, 9, 0.55, 0.6); spot.position.set(0, 4.5, 0.8); spot.target.position.set(0, 0, 0); g.add(spot, spot.target);
  const faces = [2, 5, 1, 6, 3, 4].map((n) => new THREE.MeshToonMaterial({ map: diceFace(n), gradientMap: grad }));
  const dice = [-0.3, 0.32].map((x) => ol(mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), faces, x, 0.21, 0, g), 0.008));
  return {
    bg: 0x0a0604,
    update(t) {
      const s = T.sc["s3-azar"];
      dice.forEach((d, i) => { const k = seg(t, s[0] + 0.02 + i * 0.08, K.nao2 - 0.15); const bounce = Math.abs(Math.sin(k * Math.PI * 3)) * (1 - k) * 0.9; d.position.set((i ? 0.32 : -0.3) + (1 - k) * (i ? 0.5 : -0.5), 0.21 + (1 - sm(k)) * 2.6 + bounce, (1 - k) * -0.4); const sp = (1 - sm(k)) * (8 + i * 3); d.rotation.set(sp, sp * 0.7 + (i ? 0.25 : -0.2) * k, sp * 0.4); });
      const fk = 0.85 + 0.15 * Math.sin(t * 14) + 0.06 * Math.sin(t * 31); fl1.scale.setScalar(0.22 * fk); cl.intensity = 3.2 * fk;
      cat.userData.head.rotation.y = t > K.nao2 - 0.2 ? -0.5 : 0; const bl = Math.abs(t - (K.nao2 + 0.25)) < 0.07; cat.userData.eyes.forEach((e) => (e.scale.y = bl ? 0.1 : 0.7)); cat.userData.tail.rotation.z = Math.sin(t * 2.5) * 0.4;
    },
    cam(t) { const s = T.sc["s3-azar"]; return keys(t, [[s[0], [0, 1.75, 3.4], [0, 0.3, -0.35]], [s[1], [0.05, 1.65, 3.1], [0, 0.28, -0.35]]]); },
  };
});

// 4 · culpa do demônio? (o livro escuro acorrentado numa cripta)
addSet("s4-livro", (g) => {
  const wall = plane(16, 9, M(0xffffff, { map: rep(brickTex(), 5, 3) })); wall.position.set(0, 3.5, -2.8); g.add(wall);
  g.add(floorP(16, 10, M(0xffffff, { map: rep(stoneTex("#3a3540", "#322e38"), 6, 4) })));
  [-1, 1].forEach((k) => ol(mesh(box(0.55, 4.2, 0.55), M(0x4a4250), 1.75 * k, 2.1, -2.3, g), 0.02));
  ol(mesh(box(4.1, 0.5, 0.6), M(0x4a4250), 0, 4.35, -2.3, g), 0.02);
  const torches = [-1, 1].map((k) => torch(g, 1.05 * k, 2.35, -2.45, 0xff6a2a, 1.1));
  const tl = [-1, 1].map((k) => { const l = new THREE.PointLight(0xff7a3a, 2.2, 5); l.position.set(1.05 * k, 2.4, -2.1); g.add(l); return l; });
  ol(mesh(cyl(0.42, 0.55, 1.0, 16), M(0x5a5468), 0, 0.5, 0, g), 0.02);
  ol(mesh(cyl(0.62, 0.62, 0.1, 16), M(0x6a6478), 0, 1.05, 0, g), 0.02);
  const rc = mesh(new THREE.TorusGeometry(1.25, 0.025, 6, 64), glowM(0xff2a3a, 0.7), 0, 0.02, 0, g); rc.rotation.x = Math.PI / 2;
  mesh(new THREE.TorusGeometry(0.95, 0.015, 6, 64), glowM(0xff2a3a, 0.5), 0, 0.02, 0, g).rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; mesh(box(0.12, 0.004, 0.04), glowM(0xff2a3a, 0.8), Math.cos(a) * 1.1, 0.021, Math.sin(a) * 1.1, g).rotation.y = -a; }
  const book = darkBook(1.6); book.position.set(0, 1.85, 0.05); book.rotation.set(1.2, 0, 0); g.add(book);
  const chainM = M(0x8a8a96);
  chainLine(book, [-0.66, -0.86], [0.66, 0.86], 0.125, 0.045, chainM);
  chainLine(book, [0.66, -0.86], [-0.66, 0.86], 0.135, 0.045, chainM);
  const lock = new THREE.Group(); lock.position.set(0, 0.17, 0); book.add(lock);
  ol(mesh(box(0.2, 0.07, 0.18), M(0x9a8a4a), 0, 0, 0.03, lock), 0.006);
  mesh(new THREE.TorusGeometry(0.065, 0.018, 8, 16, Math.PI), M(0x9a9aa6), 0, 0, -0.06, lock).rotation.x = -Math.PI / 2;
  mesh(box(0.03, 0.075, 0.06), new THREE.MeshBasicMaterial({ color: 0x0a0a0a }), 0, 0.005, 0.04, lock);
  const red = glowSprite(0xff2a3a, 4.2, 0.35); red.position.set(0, 1.85, -0.4); g.add(red);
  const rl = new THREE.PointLight(0xff3a4a, 4, 6); rl.position.set(0, 1.4, 1.2); g.add(rl);
  const wisps = []; for (let i = 0; i < 12; i++) { const w = glowSprite(0xa01828, 0.5, 0.3); g.add(w); wisps.push(w); }
  const motes = dustPts(160, [-3, 3, 0, 4, -2.5, 1.5], 0xff8a6a, 0.04, 0.6, ADD, 4); g.add(motes);
  return {
    bg: 0x07040a,
    update(t) {
      torches.forEach((f) => f(t)); tl.forEach((l, i) => (l.intensity = 2 + Math.sin(t * 11 + i * 2) * 0.4));
      const shake = t > K.demonio3 - 0.2 && t < K.demonio3 + 0.8 ? 1 : 0.3;
      book.rotation.y = Math.sin(t * 0.5) * 0.12; book.position.y = 1.85 + Math.sin(t * 1.3) * 0.04; book.position.x = Math.sin(t * 37) * 0.006 * shake;
      red.material.opacity = 0.25 + 0.15 * Math.sin(t * 5); rl.intensity = 3.5 + Math.sin(t * 5) * 1.2; rc.material.opacity = 0.5 + 0.25 * Math.sin(t * 3);
      wisps.forEach((w, i) => { const k = (t * 0.45 + hash(i)) % 1; const side = i % 2 ? 1 : -1; w.position.set(side * (0.45 + hash(i + 3) * 0.25) + Math.sin(t + i) * 0.1, 1.5 + k * 1.6, 0.1 + (hash(i + 5) - 0.5) * 0.4); w.scale.setScalar(0.3 + k * 0.8); w.material.opacity = 0.35 * Math.sin(k * Math.PI); });
      motes.position.y = (t * 0.05) % 0.5;
    },
    cam(t) { const s = T.sc["s4-livro"]; return keys(t, [[s[0], [0, 2.0, 4.7], [0, 1.9, 0]], [s[1], [0.3, 1.95, 3.9], [0, 1.85, 0]]]); },
  };
});

// 5 · a mãe: o campo de flores que perde o brilho ao redor dela
addSet("s5-mae", (g) => {
  nightSky(g, [[0, "#05081a"], [0.6, "#142a3a"], [1, "#2a4a4a"]], { moon: [-9, 14, -50], moonR: 2.2, cloudCol: 0x1a2a3a });
  g.add(floorP(100, 100, M(0xffffff, { map: rep(grassTex("#1d3326", "#16281d"), 26, 26) })));
  [[-18, -40, 14], [6, -44, 18], [26, -38, 13]].forEach(([x, z, r]) => mesh(sph(r, 24, 12), M(0x13241e), x, -r * 0.62, z, g));
  [[-4.8, -7, 3.2, 3], [5.2, -9, 3.6, 5], [-7, -13, 4, 7], [7.5, -15, 4.2, 9], [2.5, -20, 3.4, 11], [-3, -22, 3.8, 13]].forEach(([x, z, h, s]) => leafyTree(g, x, z, h, s));
  house(g, -2.6, -17, 0.35, 2.4, 2.0, 2.2, 0x2a2836, 0xffd27a, 77);
  const N = 320;
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.012, 1, 4), M(0x2a6a3a), N);
  const fpos = []; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), v = new THREE.Vector3();
  const flowCols = [0x7af0ff, 0xff8ad0, 0xb8a0ff, 0x8ef0b0, 0xffd27a];
  const grey = new THREE.Color(0x2a2e38), c = new THREE.Color(), c2 = new THREE.Color();
  for (let i = 0; i < N; i++) { const a = hash(i) * Math.PI * 2, r = 0.7 + Math.sqrt(hash(i + 3)) * 9; const x = Math.cos(a) * r, z = Math.sin(a) * r - 2; const h = 0.28 + hash(i + 5) * 0.3; fpos.push([x, h, z, r]); m4.makeTranslation(x, h, z); heads.setMatrixAt(i, m4); m4.compose(v.set(x, h / 2, z), q, sc.set(1, h, 1)); stems.setMatrixAt(i, m4); heads.setColorAt(i, c.setHex(flowCols[i % 5])); }
  g.add(heads, stems);
  const fireflies = dustPts(110, [-7, 7, 0.3, 2.6, -10, 4], 0xfff2a0, 0.09, 0.9, ADD, 5); g.add(fireflies);
  const mom = hooded(0x0b0a12, { rim: rimMom }); mom.position.set(0, 0, -2); g.add(mom);
  const absorb = glowSprite(0x7a5aff, 3.6, 0); absorb.position.set(0, 1.2, -2.05); g.add(absorb);
  const SW = flowPts(220, 0xb8e8ff, 0.07); g.add(SW.pts);
  return {
    bg: 0x05081a, fog: [16, 80],
    update(t) {
      const drain = sm(seg(t, K.absorvia - 1.2, K.absorvia + 2.6)); const front = drain * 10;
      for (let i = 0; i < N; i++) { const k = clamp((fpos[i][3] - front) / 1.6, 0, 1); c.setHex(flowCols[i % 5]).multiplyScalar(0.8 + 0.2 * Math.sin(t * 2 + i)); c2.copy(grey).lerp(c, k); heads.setColorAt(i, c2); }
      heads.instanceColor.needsUpdate = true;
      absorb.material.opacity = 0.55 * drain * (0.85 + 0.15 * Math.sin(t * 6));
      for (let i = 0; i < 220; i++) { const f = fpos[(i * 13) % N]; const ph = (t * 0.32 + hash(i)) % 1; const live = drain > 0.02 && f[3] < front + 1.5; const a = Math.atan2(f[2] + 2, f[0]) + ph * 3.2; const rr = lerp(f[3], 0.15, ph); SW.pos[i * 3] = live ? Math.cos(a) * rr : 0; SW.pos[i * 3 + 1] = live ? lerp(f[1], 1.25, ph * ph) : -5; SW.pos[i * 3 + 2] = live ? Math.sin(a) * rr - 2 : -2; }
      SW.upd(); SW.pts.material.opacity = Math.min(1, drain * 2);
      fireflies.position.y = Math.sin(t) * 0.1;
    },
    cam(t) { const s = T.sc["s5-mae"]; return keys(t, [[s[0], [0, 1.7, 8.5], [0, 1.6, -4]], [K.richita - 0.5, [1.5, 1.35, 2.4], [0, 1.45, -2]], [K.absorvia - 0.3, [-2.3, 2.1, 2.9], [0, 0.95, -2]], [s[1], [-2.0, 1.9, 2.3], [0, 1.0, -2]]]); },
  };
});

// 6 · dentro de casa: a luz do bebê se apagando
addSet("s6-bebe", (g) => {
  const wall = plane(10, 6, M(0xffffff, { map: rep(woodTex("#3e2c20", "#33241a", 12, true), 2, 1) })); wall.position.set(0, 3, -3); g.add(wall);
  g.add(floorP(10, 8, M(0xffffff, { map: rep(woodTex("#4a3424", "#3e2b1e", 10), 2, 2) })));
  const win = new THREE.Group(); win.position.set(0.95, 1.85, -2.96); g.add(win);
  mesh(new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshBasicMaterial({ color: 0x24305e }), 0, 0, 0, win);
  const wg = glowSprite(0xbfd8ff, 1.6, 0.5); wg.position.set(0.15, 0.2, 0.02); win.add(wg);
  mesh(sph(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff4d6 }), 0.2, 0.25, 0.01, win);
  [[0, 0.58, 1.0, 0.08], [0, -0.58, 1.0, 0.08], [-0.48, 0, 0.08, 1.24], [0.48, 0, 0.08, 1.24], [0, 0, 0.05, 1.1], [0, 0, 0.9, 0.05]].forEach(([x, y, w, h]) => mesh(box(w, h, 0.06), M(0x2a1a10), x, y, 0.03, win));
  [-1, 1].forEach((k) => mesh(new THREE.PlaneGeometry(0.32, 1.4), M(0x6a1f2a, { side: THREE.DoubleSide }), 0.6 * k, -0.05, 0.08, win));
  const beam = glowSprite(0x9fc0ff, 2.2, 0.12); beam.position.set(0.5, 0.05, -1.6); beam.scale.set(1.6, 0.5, 1); g.add(beam);
  const crib = new THREE.Group(); crib.position.set(-1.0, 0, -2.1); crib.rotation.y = 0.3; g.add(crib);
  const wd = M(0x7a5232);
  ol(mesh(box(0.8, 0.34, 0.46), wd, 0, 0.5, 0, crib), 0.01);
  [-0.38, 0.38].forEach((x) => mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 20, Math.PI), wd, x, 0.33, 0, crib).rotation.set(0, Math.PI / 2, Math.PI));
  [-0.38, 0.38].forEach((x) => [-0.2, 0.2].forEach((z) => mesh(cyl(0.02, 0.02, 0.5, 6), wd, x, 0.75, z, crib)));
  mesh(box(0.7, 0.06, 0.38), M(0xbfd8f0), 0, 0.69, 0, crib);
  const tab = new THREE.Group(); tab.position.set(1.05, 0, -1.95); g.add(tab);
  ol(mesh(box(0.7, 0.05, 0.45), wd, 0, 0.72, 0, tab), 0.01); [-0.3, 0.3].forEach((x) => [-0.18, 0.18].forEach((z) => mesh(cyl(0.025, 0.025, 0.72, 6), wd, x, 0.36, z, tab)));
  const candle = new THREE.Group(); candle.position.set(-0.12, 0.745, 0.05); tab.add(candle); mesh(cyl(0.035, 0.035, 0.18, 10), M(0xf2e8d0), 0, 0.09, 0, candle);
  const cf = [glowSprite(0xffb347, 0.14, 0.95), glowSprite(0xff9a3a, 0.9, 0.3)]; cf.forEach((f) => { f.position.y = 0.23; candle.add(f); });
  const cl = new THREE.PointLight(0xffa24a, 2.5, 5); cl.position.set(0.95, 1.2, -1.7); g.add(cl);
  mesh(box(0.9, 0.04, 0.2), wd, -1.05, 1.75, -2.88, g); [0, 1, 2].forEach((i) => mesh(cyl(0.06, 0.06, 0.16 + i * 0.04, 10), M([0x4a6a8a, 0x8a5a3a, 0x5a8a5a][i]), -1.35 + i * 0.28, 1.85 + i * 0.02, -2.85, g));
  const mom = hooded(0x0d0b16, { rim: rimMom }); mom.position.set(0, 0, -0.9); mom.rotation.y = -0.2; g.add(mom);
  const core = mesh(sph(0.07, 20, 16), glowM(0xfff6d8, 1), 0.06, 1.0, -0.47, g);
  const gIn = glowSprite(0xffe2a0, 0.7, 0.95), gOut = glowSprite(0xffc870, 2.2, 0.5); gIn.position.copy(core.position); gOut.position.copy(core.position); g.add(gIn, gOut);
  const bl = new THREE.PointLight(0xffd08a, 2.5, 3); bl.position.set(0.06, 1.0, -0.2); g.add(bl);
  const ST = flowPts(160, 0xffe0a8, 0.05); g.add(ST.pts);
  return {
    bg: 0x05040c,
    update(t) {
      const life = 1 - sm(seg(t, K.absorveu - 0.4, K.gota + 0.2));
      const beat = 1 + 0.12 * Math.pow(Math.max(0, Math.sin(t * 6.5)), 6) * life;
      core.scale.setScalar(Math.max(0.01, life) * beat); gIn.material.opacity = 0.95 * life; gIn.scale.setScalar(0.7 * (0.3 + 0.7 * life) * beat);
      gOut.material.opacity = 0.5 * life; gOut.scale.setScalar(2.2 * (0.35 + 0.65 * life)); bl.intensity = 2.5 * life;
      for (let i = 0; i < 160; i++) { const k = (t * 0.55 + hash(i)) % 1; const a = hash(i + 3) * Math.PI * 2 + k * 2.5; const r = 0.08 + Math.sin(k * Math.PI) * 0.22; ST.pos[i * 3] = 0.06 + Math.cos(a) * r; ST.pos[i * 3 + 1] = 1.0 + k * 0.62; ST.pos[i * 3 + 2] = -0.47 - k * 0.3 + Math.sin(a) * r * 0.5; }
      ST.upd(); ST.pts.material.opacity = t > K.absorveu - 0.5 && life > 0.01 ? 0.9 * Math.min(1, life * 1.5) : 0;
      const fk = 0.85 + 0.15 * Math.sin(t * 13); cf[0].scale.setScalar(0.14 * fk); cl.intensity = 2.3 * fk;
    },
    cam(t) { const s = T.sc["s6-bebe"]; return keys(t, [[s[0], [0.55, 1.35, 3.4], [0, 1.15, -1]], [K.absorveu, [0.4, 1.25, 2.6], [0, 1.1, -0.9]], [K.gota, [0.3, 1.15, 2.2], [0.05, 1.0, -0.7]], [s[1], [0.55, 1.3, 2.9], [-0.25, 0.95, -1.3]]]); },
  };
});

// 7 · a igrejinha na vila pobre, na chuva
addSet("s7-igreja", (g) => {
  nightSky(g, [[0, "#04050c"], [1, "#1a2032"]], { moon: [12, 16, -50], moonR: 1.6, cloudCol: 0x10141e });
  g.add(floorP(70, 70, M(0xffffff, { map: rep(cobble("#3a3a46", "#31313c"), 14, 14) })));
  const puddles = [[-0.9, 1.2, 0.5], [0.8, 0.2, 0.4], [-0.4, -0.9, 0.35], [1.3, 2.4, 0.55], [-1.5, 3.0, 0.45], [0.3, 3.8, 0.6]];
  puddles.forEach(([x, z, r]) => mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: 0x8aa0c8, transparent: true, opacity: 0.22 }), x, 0.01, z, g).rotation.x = -Math.PI / 2);
  const ripples = []; for (let i = 0; i < 12; i++) { const p = puddles[i % puddles.length]; const r = mesh(new THREE.TorusGeometry(1, 0.012, 4, 24), glowM(0xbfd0f0, 0.5), p[0] + (hash(i + 3) - 0.5) * p[2], 0.015, p[1] + (hash(i + 4) - 0.5) * p[2], g); r.rotation.x = Math.PI / 2; ripples.push(r); }
  const ch = new THREE.Group(); ch.position.set(0, 0, -5); g.add(ch);
  const stoneM = M(0x7a7488);
  ol(mesh(box(4.2, 3.2, 4.5), stoneM, 0, 1.6, 0, ch), 0.03);
  const roof = mesh(new THREE.CylinderGeometry(0.01, 3.1, 1.8, 4, 1), M(0x3a2a2a), 0, 4.1, 0, ch); roof.rotation.y = Math.PI / 4; roof.scale.z = 1.5; ol(roof, 0.03);
  ol(mesh(box(1.2, 2.6, 1.2), stoneM, 1.3, 4.3, 0.8, ch), 0.02); mesh(new THREE.ConeGeometry(0.95, 1.4, 4), M(0x3a2a2a), 1.3, 6.3, 0.8, ch).rotation.y = Math.PI / 4;
  mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.3, 12, 1, true), M(0xc9a227, { side: THREE.DoubleSide }), 1.3, 4.95, 1.42, ch);
  mesh(cyl(0.02, 0.02, 0.9, 4), M(0x2a2a2a), 1.3, 7.3, 0.8, ch); mesh(box(0.36, 0.05, 0.05), M(0x2a2a2a), 1.3, 7.45, 0.8, ch);
  ol(mesh(box(1.1, 1.9, 0.12), M(0x5a3b2b), 0, 0.95, 2.26, ch), 0.01);
  mesh(box(1.8, 0.12, 0.45), M(0x6a6474), 0, 0.06, 2.48, ch);
  mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshBasicMaterial({ color: 0xffc27a }), 0, 2.6, 2.27, ch);
  [-1, 1].forEach((k) => mesh(box(0.3, 0.7, 0.05), new THREE.MeshBasicMaterial({ color: 0xc9963a }), 1.4 * k, 1.6, 2.27, ch));
  const lampG = glowSprite(0xffc27a, 1.6, 0.85); lampG.position.set(0, 2.15, 2.5); ch.add(lampG);
  mesh(box(0.14, 0.2, 0.14), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), 0, 2.15, 2.4, ch);
  const lamp = new THREE.PointLight(0xffb36b, 7, 7); lamp.position.set(0, 2.1, 2.8); ch.add(lamp);
  [[-3.0, 1.0, 2.6, 2.4], [-3.0, -2.0, 2.4, 2.9], [3.0, 1.2, 2.6, 2.6], [3.0, -1.9, 2.4, 2.2]].forEach(([x, z, w, h], i) => house(g, x, z, x < 0 ? Math.PI / 2 : -Math.PI / 2, w, h, 2.0, [0x4a4250, 0x433c4a, 0x3e3846, 0x4a4452][i], 0xc9963a, 40 + i, 0x2a2024));
  [[-1.75, 2.4], [-1.85, 2.0], [1.8, -0.6]].forEach(([x, z], i) => { const b = new THREE.Group(); b.position.set(x, 0, z); g.add(b); ol(mesh(cyl(0.24, 0.24, 0.6, 14), M(0x5a3a22), 0, 0.3, 0, b), 0.01); [0.12, 0.48].forEach((y) => mesh(cyl(0.25, 0.25, 0.04, 14), M(0x2a2a2a), 0, y, 0, b)); b.rotation.y = i; });
  ol(mesh(box(0.5, 0.42, 0.5), M(0x6a4a2a), 1.75, 0.21, 0.3, g), 0.01);
  const rainU = rain(g, 520, [-6, 6, 0, 9, -9, 6], 11);
  const basket = new THREE.Group(); g.add(basket);
  ol(mesh(cyl(0.32, 0.26, 0.22, 16), M(0x9c6b3f), 0, 0.11, 0, basket), 0.01);
  mesh(new THREE.TorusGeometry(0.3, 0.02, 6, 18, Math.PI), M(0x8a5a32), 0, 0.22, 0, basket);
  const blanket = mesh(sph(0.27, 14, 10), M(0xbfd8f0), 0, 0.24, 0, basket); blanket.scale.y = 0.45;
  const mom = hooded(); g.add(mom);
  return {
    bg: 0x04050c, fog: [10, 50],
    update(t) {
      rainU(t);
      const s = T.sc["s7-igreja"];
      ripples.forEach((r, i) => { const k = (t * 1.3 + hash(i)) % 1; r.scale.set(0.05 + k * 0.3, 0.05 + k * 0.3, 1); r.material.opacity = 0.55 * (1 - k); });
      const walkIn = sm(seg(t, s[0], K.igreja - 0.4)), crouch = seg(t, K.igreja - 0.4, K.igreja + 0.8), leave = sm(seg(t, K.reino - 0.4, K.voltou + 0.6));
      const ax = lerp(-0.9, 0.05, walkIn), az = lerp(3.2, -1.55, walkIn);
      const x = lerp(ax, -1.3, leave), z = lerp(az, 3.0, leave);
      const moving = (walkIn > 0 && walkIn < 1) || (leave > 0 && leave < 1);
      mom.position.set(x, moving ? Math.abs(Math.sin(t * 4.5)) * 0.04 : 0, z);
      mom.rotation.y = leave > 0 ? Math.atan2(-1.35, 4.55) : Math.atan2(0.95, -4.75);
      const cr = Math.sin(Math.PI * clamp(crouch, 0, 1));
      mom.scale.y = 1 - 0.25 * cr; mom.userData.arm.rotation.x = -0.9 * cr;
      mom.userData.m.opacity = 1 - sm(seg(leave, 0.55, 1)); mom.visible = mom.userData.m.opacity > 0.01;
      const placed = crouch > 0.55;
      if (placed) basket.position.set(0, 0, -1.95);
      else { const fx = Math.sin(mom.rotation.y), fz = Math.cos(mom.rotation.y); basket.position.set(x + fx * 0.32, 0.95 - 0.7 * cr, z + fz * 0.32); }
      lamp.intensity = 6.5 + Math.sin(t * 9) * 0.6; lampG.material.opacity = 0.8 + 0.08 * Math.sin(t * 9);
    },
    cam(t) { const s = T.sc["s7-igreja"]; return keys(t, [[s[0], [1.2, 2.4, 9.5], [0, 2.0, -4]], [K.deixou, [1.8, 1.6, 3.8], [0, 1.0, -1.8]], [K.igreja + 0.2, [1.5, 1.5, 3.2], [0, 0.8, -1.9]], [K.reino, [1.6, 1.25, 2.4], [-0.6, 0.85, -1.0]], [K.voltou - 0.2, [0.75, 0.95, 1.2], [0, 0.7, -2.0]], [s[1], [0.6, 0.9, 0.8], [0, 0.65, -2.0]]]); },
  };
});

// 8 · o outro "filho": o pequeno ser de sombra numa clareira enevoada
addSet("s8-sombra", (g) => {
  nightSky(g, [[0, "#06040c"], [0.6, "#1a1030"], [1, "#3a2050"]], { moon: [-7, 12, -50], moonR: 3.2, moonCol: 0xd9c8ff, cloudCol: 0x1a1028 });
  g.add(floorP(90, 90, M(0xffffff, { map: rep(grassTex("#1e1828", "#16111e"), 22, 22) })));
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + hash(i) * 0.3, r = 4.5 + hash(i + 2) * 5; deadTree(g, Math.cos(a) * r, Math.sin(a) * r - 1.5, 2.6 + hash(i + 4) * 2.2, i + 3); }
  for (let i = 0; i < 12; i++) { const a = hash(i + 30) * 6.28, r = 2.4 + hash(i + 31) * 4; rockAt(g, Math.cos(a) * r, 0.1, Math.sin(a) * r - 1, 0.15 + hash(i + 32) * 0.35, i + 30, 0x2e2838); }
  const mist = dustPts(220, [-9, 9, 0, 1.4, -10, 5], 0x6a4a9a, 1.1, 0.16, ADD, 5); g.add(mist);
  const embers = dustPts(120, [-5, 5, 0, 4, -6, 3], 0xc8a0ff, 0.06, 0.8, ADD, 6); g.add(embers);
  const under = new THREE.PointLight(0x7a2aff, 2.5, 8); under.position.set(0, 0.4, 0.6); g.add(under);
  rockAt(g, 0, 0.12, 0, 0.3, 77, 0x3a3348);
  const imp = shadowImp(); imp.position.set(0, 0.24, 0); g.add(imp);
  const spark = glowSprite(0xd8c8ff, 0.3, 0); g.add(spark);
  const puff = dustPts(24, [-0.12, 0.12, -0.08, 0.12, -0.1, 0.1], 0x8a8a96, 0.08, 0, ADD, 9); g.add(puff);
  const bullies = []; for (let i = 0; i < 5; i++) { const b = bully([0xff3a3a, 0xb07aff, 0x3ab0ff, 0xffd23f, 0x4cdf8a][i]); const a = Math.PI * (0.2 + i * 0.15), r = 1.6; b.position.set(Math.cos(a) * r, 0, -Math.sin(a) * r); b.lookAt(0, 0, 0); g.add(b); bullies.push(b); }
  const mom = hooded(0x1a1420); g.add(mom);
  const lantern = new THREE.Group(); lantern.position.set(0.36, 0.95, 0.22); mom.add(lantern);
  mesh(box(0.08, 0.11, 0.08), new THREE.MeshBasicMaterial({ color: 0x1a1208 }), 0, 0, 0, lantern); mesh(box(0.05, 0.07, 0.05), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }), 0, 0, 0.02, lantern); const lg = glowSprite(0xffd27a, 0.4, 0.95); lantern.add(lg);
  const warm = glowSprite(0xffc27a, 3.4, 0); g.add(warm);
  const warmL = new THREE.PointLight(0xffc27a, 0, 7); g.add(warmL);
  const hand = new THREE.Vector3(0.44, 0.78, 0.15);
  return {
    bg: 0x0c0814, fog: [5, 30],
    update(t) {
      impIdle(imp, t); mist.position.x = Math.sin(t * 0.2) * 0.6; embers.position.y = (t * 0.12) % 1;
      // tenta fazer magia… e só sai fumaça
      const sp = seg(t, K.semmagia7 - 0.6, K.semmagia7 + 0.5);
      imp.userData.arms[1].rotation.z = 0.8 + 1.4 * Math.sin(Math.PI * sp);
      spark.position.copy(hand); spark.material.opacity = sp > 0.25 && sp < 0.55 ? 0.9 * Math.sin(((sp - 0.25) / 0.3) * Math.PI) : 0; spark.scale.setScalar(0.3 + 0.2 * Math.sin(t * 40));
      puff.position.set(hand.x, hand.y + (sp - 0.5) * 0.4, hand.z); puff.material.opacity = sp > 0.5 && sp < 1 ? 0.7 * (1 - (sp - 0.5) * 2) : 0;
      // os que têm magia riem dele
      const show = sm(seg(t, K.humilhado - 1.3, K.humilhado - 0.5)), gone = sm(seg(t, K.nome7 - 0.4, K.liebe - 0.2)), laugh = t > K.humilhado - 0.5 && t < K.nome7;
      bullies.forEach((b, i) => { const u = b.userData, vis = show * (1 - gone); b.visible = vis > 0.01; u.m.opacity = vis; u.em.opacity = vis; u.eg.material.opacity = 0.8 * vis; u.aura.material.opacity = 0.35 * vis; b.position.y = laugh ? Math.abs(Math.sin(t * 9 + i)) * 0.1 : 0; u.arm.rotation.x = laugh && i % 2 === 0 ? -1.2 + Math.sin(t * 8 + i) * 0.1 : 0; });
      const sad = t > K.humilhado - 0.6 && t < K.nome7 - 0.2; imp.scale.setScalar(sad ? 0.88 : 1); imp.userData.eyes.forEach((e) => (e.position.y = sad ? 0.44 : 0.5));
      // ela chega com a lanterna e dá um nome a ele
      const appear = sm(seg(t, K.nome7 - 1.3, K.liebe - 0.3)), kneel = sm(seg(t, K.liebe - 0.6, K.liebe + 0.3));
      const mx = lerp(3.4, 0.8, appear), mz = lerp(1.7, 0.45, appear);
      mom.visible = appear > 0.001; mom.position.set(mx, appear < 1 ? Math.abs(Math.sin(t * 4)) * 0.03 : 0, mz); mom.rotation.y = Math.atan2(-mx, -mz); mom.scale.y = 1 - 0.18 * kneel;
      mom.userData.arm.rotation.set(-0.9 * kneel, 0, 0);
      warm.position.set(mx - 0.3, 1.0, mz + 0.1); warm.material.opacity = 0.55 * appear; warmL.position.set(mx - 0.4, 1.3, mz + 0.5); warmL.intensity = 5 * appear; lg.material.opacity = 0.95 * appear;
      imp.rotation.y = 1.0 * appear; imp.userData.eyes.forEach((e) => (e.scale.y *= 1 - 0.35 * kneel));
    },
    cam(t) { const s = T.sc["s8-sombra"]; return keys(t, [[s[0], [0.4, 1.7, 8.0], [0, 0.9, 0]], [K.acolhido, [0.4, 1.05, 3.6], [0, 0.62, 0]], [K.demonio7, [0.2, 0.95, 3.4], [0, 0.6, 0]], [K.humilhado - 0.6, [0.05, 0.42, 2.7], [0, 1.45, -1.3]], [K.nome7 - 0.2, [0.5, 1.3, 4.8], [0.45, 0.85, 0.15]], [K.liebe, [0.5, 1.22, 4.4], [0.42, 0.82, 0.15]], [s[1], [0.5, 1.2, 4.2], [0.42, 0.82, 0.15]]]); },
  };
});

// 9 · o reencontro: o livro chega, abre, e o pequeno ser sai de dentro dele
addSet("s9-encontro", (g) => {
  nightSky(g, [[0, "#060a20"], [0.7, "#1d2a55"], [1, "#3a3a6a"]], { moon: [1.6, 9.5, -42], moonR: 2.6 });
  g.add(floorP(140, 140, M(0x0e1418), -1.8));
  mesh(sph(14, 48, 24), M(0xffffff, { map: rep(grassTex("#1f3328", "#18291f"), 10, 10) }), 0, -12.4, -2, g);
  [[-14, -30, 10], [12, -34, 12], [-2, -40, 9]].forEach(([x, z, r]) => mesh(sph(r, 24, 12), M(0x111c22), x, -r * 0.7, z, g));
  for (let i = 0; i < 46; i++) { const l = glowSprite([0xffc27a, 0xffd9a0, 0xff9a5a][i % 3], 0.22 + hash(i + 50) * 0.18, 0.9); l.position.set((hash(i + 51) - 0.5) * 22, -1.6 + hash(i + 52) * 1.4, -16 - hash(i + 53) * 12); g.add(l); }
  for (let i = 0; i < 7; i++) house(g, -9 + i * 3 + hash(i) * 1.2, -18 - hash(i + 1) * 6, (hash(i + 2) - 0.5) * 0.6, 1.6, 1.3 + hash(i + 3), 1.4, 0x1a1a2a, 0xffc27a, 60 + i).position.y = -1.8;
  leafyTree(g, -2.3, -2.9, 3.4, 21).position.y = 1.35;
  const tufts = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 0.22, 4), M(0x2a4a32), 70); const m4 = new THREE.Matrix4();
  for (let i = 0; i < 70; i++) { const a = hash(i + 70) * 6.28, r = 0.4 + hash(i + 71) * 4.5; const x = Math.cos(a) * r, z = Math.sin(a) * r - 2; const y = -12.4 + Math.sqrt(Math.max(0, 196 - x * x - (z + 2) * (z + 2))); m4.makeTranslation(x, y + 0.08, z); tufts.setMatrixAt(i, m4); }
  g.add(tufts);
  const fireflies = dustPts(70, [-4, 4, 1.6, 3.4, -5, 1], 0xfff2a0, 0.07, 0.85, ADD, 12); g.add(fireflies);
  const kid = mage(null, { child: true, scale: 0.86 }); kid.position.set(0, 1.58, -2.0); g.add(kid);
  const book = openBook(0.75); g.add(book);
  const TR = flowPts(90, 0x7a6acc, 0.08); g.add(TR.pts);
  const smoke = []; for (let i = 0; i < 10; i++) { const s2 = glowSprite(0x2a1a4a, 0.4, 0, NORM); g.add(s2); smoke.push(s2); }
  const imp = shadowImp(0.7); g.add(imp);
  const ghost = hooded(0, { mat: glowM(0xffd9a0, 0) }); ghost.position.set(-4.0, 0.5, -30); ghost.scale.setScalar(4.6); g.add(ghost);
  const SH = flowPts(30, 0xffffff, 0.25); SH.pts.material.fog = false; g.add(SH.pts);
  const H = new THREE.Vector3(0.62, 2.28, -1.75);
  const flyPos = (f, out) => out.set(lerp(9, H.x, f), lerp(10, H.y, f) + Math.sin(f * Math.PI) * 1.4, lerp(-18, H.z, f));
  const tmp = new THREE.Vector3();
  return {
    bg: 0x060a20, fog: [20, 90],
    update(t) {
      const s = T.sc["s9-encontro"];
      const fly = sm(seg(t, s[0] + 0.1, K.grimorio8 + 0.2)), open = sm(seg(t, K.grimorio8 + 0.25, K.grimorio8 + 1.0));
      flyPos(fly, book.position); if (fly >= 1) book.position.y += Math.sin(t * 2) * 0.03;
      book.rotation.set(1.1 + (1 - fly) * 6, (1 - fly) * 4, 0); setOpen(book, open);
      for (let i = 0; i < 90; i++) { const f2 = sm(seg(t - (i / 90) * 0.45, s[0] + 0.1, K.grimorio8 + 0.2)); flyPos(f2, tmp); TR.pos[i * 3] = tmp.x + (hash(i) - 0.5) * 0.15; TR.pos[i * 3 + 1] = tmp.y + (hash(i + 1) - 0.5) * 0.15; TR.pos[i * 3 + 2] = tmp.z + (hash(i + 2) - 0.5) * 0.15; }
      TR.upd(); TR.pts.material.opacity = fly < 0.98 ? 0.85 : 0;
      const em = sm(seg(t, K.grimorio8 + 0.8, K.grimorio8 + 1.9));
      imp.visible = em > 0.01; imp.position.set(H.x + 0.12 * em, H.y + 0.05 + 0.35 * em + Math.sin(t * 2.2) * 0.04 * em, H.z - 0.25 * em); imp.scale.setScalar(0.7 * Math.max(0.01, em)); impIdle(imp, t);
      smoke.forEach((sp, i) => { const k = (t * 0.6 + hash(i)) % 1; sp.position.set(H.x + (hash(i + 1) - 0.5) * 0.3, H.y + 0.1 + k * 0.9, H.z + (hash(i + 2) - 0.5) * 0.2); sp.scale.setScalar(0.25 + k * 0.6); sp.material.opacity = 0.55 * Math.sin(k * Math.PI) * open * (1 - 0.6 * em); });
      kidPose(kid, t > K.encontraram - 0.5 ? 0 : 0.25, 0);
      imp.rotation.y = t > K.dois ? -0.4 : 0.3;
      ghost.userData.m.opacity = 0.11 * sm(seg(t, K.mesma8 - 0.4, K.mesma8 + 0.8));
      const sk = seg(t, s[0] + 0.3, s[0] + 1.6);
      for (let i = 0; i < 30; i++) { const k2 = clamp(sk - i * 0.012); SH.pos[i * 3] = lerp(-12, 8, k2); SH.pos[i * 3 + 1] = lerp(22, 14, k2); SH.pos[i * 3 + 2] = -40; }
      SH.upd(); SH.pts.material.opacity = sk > 0 && sk < 1 ? 0.9 : 0;
    },
    cam(t) { const s = T.sc["s9-encontro"]; return keys(t, [[s[0], [3.2, 2.9, 5.2], [0.4, 3.4, -6]], [K.grimorio8 - 0.4, [1.4, 2.3, 1.8], [0.4, 2.75, -1.9]], [K.dois, [1.1, 2.2, 2.3], [0.4, 2.9, -1.9]], [K.encontraram - 0.6, [0.35, 2.3, 3.6], [0.35, 3.3, -10]], [s[1], [0.35, 2.3, 3.3], [0.35, 3.3, -10]]]); },
  };
});

// 10 · a antimagia: a onda escura apaga os feitiços e o golpe corta o maior deles
addSet("s10-antimagia", (g) => {
  nightSky(g, [[0, "#0a0614"], [0.6, "#2a1240"], [1, "#5a2a4a"]], { moon: [-9, 15, -50], moonCol: 0xffd9e8, cloudCol: 0x1a0c24 });
  g.add(floorP(100, 100, M(0x1e1824)));
  const ar = mesh(new THREE.CircleGeometry(8.8, 56), M(0xffffff, { map: rep(stoneTex("#4a4454", "#403a4a"), 10, 10) }), 0, 0.01, -1, g); ar.rotation.x = -Math.PI / 2;
  const torches = [];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + 0.1, r = 8.4; const x = Math.cos(a) * r, z = Math.sin(a) * r - 1; const h = 1.4 + hash(i + 3) * 3.6; ol(mesh(cyl(0.34, 0.4, h, 12), M(0x6a6278), x, h / 2, z, g), 0.02); if (hash(i + 5) > 0.45) ol(mesh(box(0.9, 0.24, 0.9), M(0x5a5468), x, h + 0.12, z, g), 0.02); if (hash(i + 8) > 0.5) torches.push(torch(g, x * 0.93, h * 0.6, z * 0.93 + 0.07, PALETTE[i % 7], 1.2)); }
  for (let i = 0; i < 18; i++) { const a = hash(i + 60) * 6.28, r = 6.2 + hash(i + 61) * 2; rockAt(g, Math.cos(a) * r, 0.12, Math.sin(a) * r - 1, 0.15 + hash(i + 62) * 0.4, i + 60, 0x4a4454); }
  const kid = mage(null, { child: true, scale: 0.86 }); g.add(kid);
  const mages = []; for (let i = 0; i < 7; i++) { const th = -1.05 + i * 0.35; const m = mage(PALETTE[i], { robe: i % 2 === 0, hat: i % 3 === 1, staff: true }); m.position.set(Math.sin(th) * 4.6, 0, -Math.cos(th) * 4.6); m.lookAt(0, 0, 0); g.add(m); mages.push({ m, th }); }
  const F = 2.2, KH = 0.84, W0 = K.antimagia9, WV = 6;
  const from = (mi) => new THREE.Vector3(Math.sin(mages[mi].th) * 4.25, 1.85, -Math.cos(mages[mi].th) * 4.25);
  const pathAt = (mi, k, out) => { const f = from(mi); return out.set(lerp(f.x, 0, k), lerp(f.y, 1.0, k) + Math.sin(k * Math.PI) * 0.7, lerp(f.z, 0, k)); };
  const spells = []; for (let i = 0; i < 28; i++) { const mi = (i * 3) % 7; const col = PALETTE[mi]; const orb = mesh(sph(0.11, 12, 10), glowM(0xffffff, 1), 0, 0, 0, g); const gl = glowSprite(col, 0.75, 0.9); orb.add(gl); const tr = [0, 1, 2].map((k) => { const s2 = glowSprite(col, 0.4 - k * 0.09, 0.5 - k * 0.13); g.add(s2); return s2; }); const ash = dustPts(16, [-0.15, 0.15, -0.1, 0.1, -0.15, 0.15], 0x9a9aa8, 0.07, 0, ADD, 20 + i); g.add(ash); const T0 = T.sc["s10-antimagia"][0] - 1.4 + i * 0.11; const d0 = Math.hypot(from(mi).x, from(mi).z); const tF = T0 + F * KH; const th = (d0 + (d0 * T0) / F + WV * W0) / (WV + d0 / F); const waveHit = th > W0 && th < tF; spells.push({ orb, gl, tr, ash, mi, T0, tEnd: waveHit ? th : tF, waveHit }); }
  const ringW = mesh(new THREE.TorusGeometry(1, 0.02, 8, 96), glowM(0xf2f4ff, 0.95), 0, 0.05, 0, g); ringW.rotation.x = Math.PI / 2;
  const ringB = mesh(new THREE.TorusGeometry(1, 0.06, 8, 96), new THREE.MeshBasicMaterial({ color: 0x030205, transparent: true, opacity: 0.9 }), 0, 0.06, 0, g); ringB.rotation.x = Math.PI / 2;
  const burst = mesh(sph(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }), 0, 0.9, 0, g);
  const flash = glowSprite(0xffffff, 3, 0); flash.position.set(0, 1, 0); g.add(flash);
  const wisps = []; for (let i = 0; i < 12; i++) { const w = glowSprite(0x000000, 0.5, 0, NORM); g.add(w); wisps.push(w); }
  const CR = flowPts(40, 0xffffff, 0.035); g.add(CR.pts);
  const big = mesh(sph(0.2, 20, 16), glowM(0xe6d4ff, 0.9), 0, 0, 0, g); const bigG = glowSprite(0xb07aff, 1.3, 0.8); big.add(bigG); const bigO = new THREE.Group(); big.add(bigO); for (let i = 0; i < 8; i++) mesh(sph(0.03, 8, 6), glowM(PALETTE[i % 7], 1), Math.cos(i * 0.8) * 0.36, Math.sin(i * 1.7) * 0.12, Math.sin(i * 0.8) * 0.36, bigO);
  const halves = [0, 1].map((k) => { const h = mesh(new THREE.SphereGeometry(0.2, 18, 12, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xd8c8ff, transparent: true, side: THREE.DoubleSide }), 0, 0, 0, g); return h; });
  const slashW = mesh(new THREE.TorusGeometry(0.7, 0.025, 8, 48, Math.PI * 0.85), glowM(0xffffff, 0), 0, 1.1, -0.62, g);
  const slashB = mesh(new THREE.TorusGeometry(0.7, 0.06, 8, 48, Math.PI * 0.85), new THREE.MeshBasicMaterial({ color: 0x050307, transparent: true, opacity: 0, depthWrite: false }), 0, 1.1, -0.64, g);
  return {
    bg: 0x0a0614, fog: [12, 60],
    update(t) {
      const s = T.sc["s10-antimagia"], C = K.corta;
      torches.forEach((f) => f(t));
      // feitiços chegando: perto dele viram cinza; depois da onda, viram cinza no ar
      spells.forEach((o) => {
        const vis = t >= o.T0 && t < o.tEnd; o.orb.visible = vis; o.tr.forEach((s2) => (s2.visible = vis));
        if (vis) { const k = (t - o.T0) / F; pathAt(o.mi, k, o.orb.position); o.tr.forEach((s2, j) => pathAt(o.mi, Math.max(0, k - 0.035 * (j + 1)), s2.position)); o.gl.scale.setScalar(0.75 + 0.1 * Math.sin(t * 20 + o.mi)); }
        const ak = (t - o.tEnd) / (o.waveHit ? 1.3 : 0.6); o.ash.visible = ak >= 0 && ak < 1;
        if (o.ash.visible) { pathAt(o.mi, (o.tEnd - o.T0) / F, o.ash.position); o.ash.position.y -= ak * (o.waveHit ? 0.9 : 0.2); o.ash.scale.setScalar(1 + ak * 1.5); o.ash.material.opacity = 0.85 * (1 - ak); }
      });
      // a onda de antimagia
      const R = t < W0 ? 0 : (t - W0) * WV;
      ringW.visible = ringB.visible = R > 0.05 && R < 11; ringW.scale.set(R, R, 1); ringB.scale.set(R * 0.96, R * 0.96, 1); ringW.material.opacity = 0.95 * (1 - R / 11); ringB.material.opacity = 0.9 * (1 - R / 11);
      const bk = seg(t, W0, W0 + 0.5); burst.scale.setScalar(0.3 + bk * 2.6); burst.material.opacity = t > W0 ? 0.55 * (1 - bk) : 0;
      flash.material.opacity = t > W0 ? 0.9 * Math.max(0, 1 - (t - W0) / 0.3) : 0;
      const on = sm(seg(t, W0 - 0.1, W0 + 0.4));
      wisps.forEach((w, i) => { const k = (t * 0.7 + hash(i)) % 1; const a = hash(i + 1) * 6.28 + t * 1.5; const r = 0.3 + 0.25 * k; w.position.set(Math.cos(a) * r, 0.3 + k * 1.3, Math.sin(a) * r); w.scale.setScalar(0.35 + 0.4 * Math.sin(k * Math.PI)); w.material.opacity = 0.6 * on * Math.sin(k * Math.PI); });
      const ft = Math.floor(t * 24); for (let i = 0; i < 40; i++) { const a = hash(i + ft * 7) * 6.28, r = 0.25 + hash(i + ft * 3) * 0.4; CR.pos[i * 3] = Math.cos(a) * r; CR.pos[i * 3 + 1] = 0.2 + hash(i + ft) * 1.1; CR.pos[i * 3 + 2] = Math.sin(a) * r; } CR.upd(); CR.pts.material.opacity = 0.9 * on;
      // o feitiço gigante e o corte
      const bf = seg(t, C - 1.0, C); const bigFrom = from(3);
      big.visible = t > C - 1.0 && t < C; big.position.set(lerp(bigFrom.x, 0, bf), lerp(bigFrom.y, 1.1, bf) + Math.sin(bf * Math.PI) * 0.5, lerp(bigFrom.z, -0.6, bf)); bigG.scale.setScalar(1.3 + 0.2 * Math.sin(t * 25)); bigO.rotation.y = t * 4;
      const sk = seg(t, C, C + 0.9);
      halves.forEach((h, k) => { h.visible = t >= C && sk < 1; h.position.set((k ? -1 : 1) * sk * 0.9, 1.1 - sk * sk * 0.8, -0.6 - sk * 0.4); h.rotation.set(0, Math.PI / 2 + k * Math.PI, (k ? -1 : 1) * sk * 1.2); h.material.color.setRGB(lerp(0.85, 0.45, sk), lerp(0.78, 0.45, sk), lerp(1.0, 0.48, sk)); h.material.opacity = 1 - sk; });
      const sw = seg(t, C - 0.06, C + 0.22), fade = 1 - seg(t, C + 0.2, C + 0.6);
      [slashW, slashB].forEach((m) => { m.visible = sw > 0 && t < C + 0.6; m.rotation.set(0.25, Math.PI / 2, lerp(1.6, -1.9, sm(sw))); });
      slashW.material.opacity = 0.95 * fade; slashB.material.opacity = 0.8 * fade;
      const ra = t < C - 0.4 ? 0 : t < C - 0.1 ? lerp(0, -2.4, sm(seg(t, C - 0.4, C - 0.1))) : lerp(-2.4, 0.6, sm(seg(t, C - 0.1, C + 0.15)));
      kidPose(kid, 0, 0); kid.userData.arms[1].rotation.x = t > C + 0.9 ? lerp(0.6, 0, seg(t, C + 0.9, C + 1.5)) : ra;
      // os magos recuam com medo
      const back = sm(seg(t, K.pesadelo - 0.6, K.pesadelo + 1.2));
      mages.forEach((o, i) => { mageIdle(o.m, t, i); const r = 4.6 + back * 1.8; o.m.position.set(Math.sin(o.th) * r, 0, -Math.cos(o.th) * r); o.m.userData.aura.material.opacity *= 1 - back * 0.85; o.m.userData.aura.scale.setScalar(2.4 * (1 - back * 0.4)); o.m.userData.arms[1].rotation.x = t < W0 + 0.8 ? -1.0 : -1.0 * (1 - seg(t, W0 + 0.8, W0 + 1.4)); o.m.userData.arms[0].rotation.x = -1.3 * back; o.m.scale.y = 1 - 0.1 * back; });
    },
    cam(t) { const s = T.sc["s10-antimagia"]; return keys(t, [[s[0], [0, 1.9, 7.2], [0, 1.4, -2]], [W0 - 0.25, [0, 2.3, 5.4], [0, 1.0, -1]], [W0 + 0.5, [0, 4.2, 6.2], [0, 0.4, -1.4]], [K.corta - 0.7, [2.0, 1.5, 3.1], [-0.2, 1.05, -0.8]], [K.corta + 0.6, [1.8, 1.45, 2.9], [-0.2, 1.05, -0.8]], [K.garoto, [0.35, 0.55, 2.9], [0, 1.3, -1.5]], [K.pesadelo, [-1.2, 0.8, 4.2], [0.2, 1.3, -3.5]], [s[1], [-1.3, 0.85, 4.6], [0.2, 1.3, -3.5]]]); },
  };
});

// 11 · pergunta: orbe de magia x orbe de antimagia
addSet("s11-pergunta", (g) => {
  g.add(dustPts(520, [-14, 14, -8, 16, -16, -5], 0xffffff, 0.06, 0.9, ADD, 31));
  [[0x4cdf8a, 9, 0.1, -2.6, 3.4, -8], [0xb07aff, 8, 0.08, -1.2, 5.6, -10], [0xdfe6ff, 8, 0.06, 2.6, 2.4, -8]].forEach(([c, s, o, x, y, z]) => { const n = glowSprite(c, s, o); n.position.set(x, y, z); g.add(n); });
  const left = new THREE.Group(); left.position.set(-0.95, 3.0, 0); g.add(left);
  mesh(sph(0.26, 24, 18), glowM(0xffffff, 0.95), 0, 0, 0, left);
  [[0x4cdf8a, 1.6, 0.55], [0xb07aff, 1.15, 0.5], [0xff8ad0, 0.8, 0.45]].forEach(([c, s, o]) => left.add(glowSprite(c, s, o)));
  const lo = new THREE.Group(); left.add(lo); for (let i = 0; i < 14; i++) mesh(sph(0.04, 8, 6), glowM(PALETTE[i % 7], 1), Math.cos(i * 0.45) * 0.62, Math.sin(i * 1.3) * 0.22, Math.sin(i * 0.45) * 0.62, lo);
  const SW = flowPts(120, 0xffffff, 0.05); const swc = new Float32Array(360); SW.geo.setAttribute("color", new THREE.BufferAttribute(swc, 3)); SW.pts.material.vertexColors = true; left.add(SW.pts);
  const cc = new THREE.Color(); for (let i = 0; i < 120; i++) { cc.setHex(PALETTE[i % 7]); swc[i * 3] = cc.r; swc[i * 3 + 1] = cc.g; swc[i * 3 + 2] = cc.b; }
  const right = new THREE.Group(); right.position.set(0.95, 3.0, 0); g.add(right);
  mesh(sph(0.42, 28, 20), new THREE.MeshBasicMaterial({ color: 0x030205 }), 0, 0, 0, right);
  const rr = mesh(new THREE.TorusGeometry(0.6, 0.022, 8, 64), glowM(0xf2f4ff, 0.95), 0, 0, 0, right);
  const rr2 = mesh(new THREE.TorusGeometry(0.72, 0.012, 8, 64), glowM(0xdfe6ff, 0.6), 0, 0, 0, right);
  const halo = glowSprite(0xdfe6ff, 1.9, 0.18); right.add(halo);
  const RC = flowPts(30, 0xffffff, 0.03); right.add(RC.pts);
  return {
    bg: 0x06050c,
    update(t) {
      lo.rotation.y = t; lo.rotation.x = Math.sin(t * 0.6) * 0.4;
      for (let i = 0; i < 120; i++) { const k = (t * 0.25 + hash(i)) % 1; const a = hash(i + 4) * 6.28 + t * 1.2 + k * 3; const r = 0.3 + k * 0.55; SW.pos[i * 3] = Math.cos(a) * r; SW.pos[i * 3 + 1] = (hash(i + 2) - 0.5) * 0.5 * (1 - k); SW.pos[i * 3 + 2] = Math.sin(a) * r; } SW.upd();
      rr.rotation.set(t * 0.8, t * 0.5, 0); rr2.rotation.set(-t * 0.5, 0.4, t * 0.3);
      const ft = Math.floor(t * 20); for (let i = 0; i < 30; i++) { const a = hash(i + ft * 5) * 6.28, r = 0.45 + hash(i + ft * 2) * 0.2; RC.pos[i * 3] = Math.cos(a) * r; RC.pos[i * 3 + 1] = (hash(i + ft) - 0.5) * 0.7; RC.pos[i * 3 + 2] = Math.sin(a) * r; } RC.upd();
      left.position.y = 3 + Math.sin(t) * 0.08; right.position.y = 3 + Math.cos(t) * 0.08;
    },
    cam() { return { pos: [0, 2.85, 8.6], look: [0, 2.8, 0] }; },
  };
});

// thumb: a multidão brilhando e a criança sem brilho no meio
addSet("thumb", (g) => {
  const C = crowdSet(g, 34, 4);
  const pool = mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshBasicMaterial({ map: softTex, color: 0xbfd8ff, transparent: true, opacity: 0.55, depthWrite: false, blending: ADD }), 0, 0.02, -3, g); pool.rotation.x = -Math.PI / 2;
  return { bg: 0x070a1e, fog: [16, 80], update() { C.upd(1.3); C.crowd.forEach((m) => { if (m.userData.aura) m.userData.aura.material.opacity = 0.68; }); kidPose(C.kid, 1, 0); }, cam() { return { pos: [0.2, 3.0, 4.2], look: [0, 0.75, -3.0] }; } };
});

// partículas que se movem não podem ser descartadas pelo recorte de câmera
scene.traverse((o) => { if (o.isPoints || o.isLineSegments) o.frustumCulled = false; });

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
window.__hf.buildReady["asta3d"] = (async () => {
  try { await document.fonts.load("700 48px 'Space Mono'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
