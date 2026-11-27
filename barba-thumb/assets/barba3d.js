// Cena 3D do vídeo de curiosidade "Por que o Barba Negra tem duas Akumas no Mi?" (personagens originais) (Three.js).
// Tudo é função do tempo t (hf-seek). Tempos-chave em window.HF_T (gerado por tools/build_barba.py).
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


// ---------------------------------------------------------------- base: personagens e objetos originais (nada desenhado da série)
rim.color.set(0x9a6aff); rim.intensity = 0.7;
hemi.color.set(0x9aa8d8); hemi.groundColor.set(0x1a1020);
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
function holoText(text, col, w = 1, h = 0.5) { const css = "#" + new THREE.Color(col).getHexString(); const tex = canvasTex(512, 256, (c) => { c.clearRect(0, 0, 512, 256); c.fillStyle = css; c.shadowColor = css; c.shadowBlur = 30; c.font = "700 170px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 256, 136); }); return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: ADD, side: THREE.DoubleSide })); }
function rockAt(g, x, y, z, r, seed = 1, col = 0x3a3444) { const k = mesh(new THREE.DodecahedronGeometry(r, 0), M(col), x, y, z, g); k.rotation.set(hash(seed), hash(seed + 1) * 3, hash(seed + 2)); k.scale.y = 0.6 + hash(seed + 3) * 0.4; return k; }
function shakeCam(c, t, amp) { if (amp <= 0) return c; return { pos: [c.pos[0] + Math.sin(t * 61) * amp, c.pos[1] + Math.sin(t * 47 + 1) * amp, c.pos[2]], look: c.look }; }
function planks(c1 = "#6a4a2c", c2 = "#5a3d24") { return canvasTex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c1 : c2; g.fillRect(i * 32, 0, 32, h); g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(i * 32, 0, 2, h); g.fillRect(i * 32, (hash(i) * h) | 0, 32, 2); } }); }
function stoneTex(c1 = "#6a6470", c2 = "#5c5662", grout = "#2a262e") { return canvasTex(256, 256, (g) => { g.fillStyle = grout; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? c1 : c2; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); } }); }
const PUP = new THREE.MeshBasicMaterial({ color: 0x120a18 }), GLOWPUP = new THREE.MeshBasicMaterial({ color: 0xd8a8ff });

// ---------------------------------------------------------------- piratas originais animados (rosto, chapéu, casaco)
const SKIN = 0xd9a07a;
function pirata(o = {}) {
  const s = o.scale ?? 1, fat = o.fat ?? 1;
  const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
  const coatC = o.coat ?? 0x2a1838, shirtC = o.shirt ?? 0x6a1a24, skinC = o.skin ?? SKIN, pantsC = o.pants ?? 0x1c1a24;
  const outl = (m, w = 0.012) => ol(m, w * s);
  const legs = [-1, 1].map((k) => { const l = new THREE.Group(); l.position.set(0.15 * k * s * fat, 0.82 * s, 0); body.add(l); outl(mesh(cap(0.095 * s, 0.5 * s), M(pantsC), 0, -0.36 * s, 0, l)); outl(mesh(box(0.2 * s, 0.14 * s, 0.32 * s), M(0x16121a), 0, -0.74 * s, 0.05 * s, l)); return l; });
  const torso = mesh(sph(0.34 * s, 22, 16), M(shirtC), 0, 1.2 * s, 0, body); torso.scale.set(1.05 * fat, 1.2, 0.85 * fat); outl(torso, 0.014);
  const belt = mesh(cyl(0.33 * s * fat, 0.33 * s * fat, 0.08 * s, 20), M(0x2a1a10), 0, 0.92 * s, 0, body); belt.scale.z = 0.85;
  mesh(box(0.12 * s, 0.09 * s, 0.03 * s), M(0xd9b44a), 0, 0.92 * s, 0.29 * s * fat, body);
  const coatM = new THREE.MeshToonMaterial({ color: coatC, gradientMap: grad, side: THREE.DoubleSide });
  const coat = mesh(new THREE.CylinderGeometry(0.36 * s * fat, 0.52 * s * fat, 1.15 * s, 22, 1, true, 0.55, Math.PI * 2 - 1.1), coatM, 0, 1.0 * s, 0, body); coat.scale.z = 0.9;
  if (o.collar !== false) mesh(new THREE.CylinderGeometry(0.24 * s, 0.34 * s, 0.34 * s, 16, 1, true, Math.PI * 0.55, Math.PI * 0.9), coatM, 0, 1.62 * s, -0.02 * s, body);
  for (let i = 0; i < 3; i++) [-1, 1].forEach((k) => mesh(sph(0.025 * s, 8, 6), M(0xd9b44a), 0.2 * k * s * fat, 1.35 * s - i * 0.16 * s, 0.3 * s * fat, body));
  const arms = [-1, 1].map((k) => { const a = new THREE.Group(); a.position.set(0.42 * k * s * fat, 1.48 * s, 0); body.add(a); outl(mesh(cap(0.1 * s, 0.42 * s), coatM, 0, -0.3 * s, 0, a)); outl(mesh(sph(0.09 * s, 12, 10), M(skinC), 0, -0.6 * s, 0, a), 0.01); a.rotation.z = 0.12 * k; return a; });
  const head = new THREE.Group(); head.position.set(0, 1.78 * s, 0.02 * s); body.add(head);
  outl(mesh(sph(0.23 * s, 22, 16), M(skinC), 0, 0, 0, head), 0.012);
  mesh(sph(0.045 * s, 10, 8), M(skinC), 0, -0.01 * s, 0.225 * s, head);
  const eyeW = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyes = [-1, 1].map((k) => { const e = new THREE.Group(); e.position.set(0.085 * k * s, 0.06 * s, 0.195 * s); head.add(e); mesh(sph(0.042 * s, 12, 10), eyeW, 0, 0, 0, e).scale.z = 0.6; const p = mesh(sph(0.022 * s, 10, 8), PUP, 0, 0, 0.022 * s, e); return { e, p }; });
  const brows = [-1, 1].map((k) => { const b = mesh(box(0.1 * s, 0.024 * s, 0.02 * s), M(o.hairC ?? 0x120a10), 0.085 * k * s, 0.13 * s, 0.205 * s, head); b.rotation.z = (o.angry ? -0.3 : 0.12) * k; return b; });
  const smile = mesh(new THREE.TorusGeometry(0.075 * s, 0.014 * s, 6, 18, Math.PI), new THREE.MeshBasicMaterial({ color: 0x2a0a10 }), 0, -0.065 * s, 0.208 * s, head); smile.rotation.z = Math.PI;
  const mouth = mesh(sph(0.075 * s, 14, 10), new THREE.MeshBasicMaterial({ color: 0x3a0a14 }), 0, -0.09 * s, 0.19 * s, head); mouth.scale.set(1.2, 0.01, 0.5);
  const teeth = mesh(box(0.13 * s, 0.026 * s, 0.02 * s), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, -0.065 * s, 0.218 * s, head); teeth.visible = false;
  if (o.beard === "goatee") { const b = mesh(new THREE.ConeGeometry(0.09 * s, 0.26 * s, 12), M(0x0e0a10), 0, -0.25 * s, 0.13 * s, head); b.rotation.x = Math.PI + 0.35; outl(b, 0.008); [-1, 1].forEach((k) => mesh(box(0.05 * s, 0.16 * s, 0.08 * s), M(0x0e0a10), 0.205 * k * s, -0.02 * s, 0.05 * s, head)); }
  if (o.beard === "long") { const b = mesh(new THREE.ConeGeometry(0.2 * s, 0.62 * s, 16), M(0xf2f2f6), 0, -0.37 * s, 0.1 * s, head); b.rotation.x = Math.PI + 0.12; outl(b, 0.01); mesh(sph(0.21 * s, 16, 12), M(0xf2f2f6), 0, -0.11 * s, 0.07 * s, head).scale.set(1, 0.6, 0.9); }
  if (o.hat === "crooked") { const hc = M(0x1a1020); const hg = new THREE.Group(); hg.position.set(0, 0.17 * s, 0); head.add(hg); outl(mesh(cyl(0.42 * s, 0.42 * s, 0.03 * s, 28), hc, 0, 0, 0, hg), 0.01); outl(mesh(cyl(0.16 * s, 0.22 * s, 0.26 * s, 18), hc, 0, 0.14 * s, 0, hg), 0.01); const tip = new THREE.Group(); tip.position.set(0, 0.27 * s, 0); hg.add(tip); outl(mesh(new THREE.ConeGeometry(0.16 * s, 0.38 * s, 16), hc, 0, 0.17 * s, 0, tip), 0.01); tip.rotation.z = -0.55; mesh(cyl(0.225 * s, 0.225 * s, 0.05 * s, 18), M(0x8a3ac8), 0, 0.05 * s, 0, hg); }
  if (o.hat === "captain") { const hc = M(o.hatC ?? 0xe8e8ee); const hg = new THREE.Group(); hg.position.set(0, 0.16 * s, 0); head.add(hg); outl(mesh(cyl(0.34 * s, 0.34 * s, 0.03 * s, 24), hc, 0, 0, 0, hg), 0.01); outl(mesh(cyl(0.2 * s, 0.24 * s, 0.18 * s, 18), hc, 0, 0.1 * s, 0, hg), 0.01); mesh(cyl(0.245 * s, 0.245 * s, 0.04 * s, 18), M(0xc9a227), 0, 0.03 * s, 0, hg); }
  if (o.hat === "bandana") { const hc = M(o.hatC ?? 0xc83a3a); outl(mesh(new THREE.SphereGeometry(0.24 * s, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hc, 0, 0.02 * s, -0.01 * s, head), 0.008); mesh(sph(0.05 * s, 8, 6), hc, 0, 0.0, -0.25 * s, head); }
  if (o.scarf) mesh(new THREE.TorusGeometry(0.2 * s, 0.06 * s, 8, 20), M(o.scarf), 0, 1.6 * s, 0, body).rotation.x = Math.PI / 2;
  if (o.cape) mesh(new THREE.CylinderGeometry(0.55 * s * fat, 0.78 * s * fat, 1.55 * s, 22, 1, true, Math.PI * 0.35, Math.PI * 1.3), new THREE.MeshToonMaterial({ color: o.cape, gradientMap: grad, side: THREE.DoubleSide }), 0, 0.95 * s, -0.04 * s, body);
  const glowEyes = [-1, 1].map((k) => { const gl = glowSprite(o.eyeGlow ?? 0xb06aff, 0.13 * s, 0); gl.position.set(0.085 * k * s, 0.06 * s, 0.24 * s); head.add(gl); return gl; });
  g.userData = { body, legs, arms, head, torso, eyes, brows, smile, mouth, teeth, glowEyes, s };
  return g;
}
function pReset(p) { const u = p.userData; u.legs.forEach((l) => l.rotation.set(0, 0, 0)); u.arms.forEach((a, i) => a.rotation.set(0, 0, (i ? 1 : -1) * 0.12)); u.body.position.set(0, 0, 0); u.body.rotation.set(0, 0, 0); u.head.rotation.set(0, 0, 0); u.mouth.scale.y = 0.01; u.smile.visible = true; u.teeth.visible = false; u.eyes.forEach((e) => (e.e.scale.y = 1)); }
function pIdle(p, t, i = 0) { const u = p.userData; u.torso.scale.y = 1.2 + Math.sin(t * 2 + i) * 0.015; u.head.position.y = 1.78 * u.s + Math.sin(t * 2 + i) * 0.006 * u.s; const bl = ((t + i * 0.7) % 3.6) < 0.12; u.eyes.forEach((e) => (e.e.scale.y = bl ? 0.1 : 1)); }
function pLaugh(p, t, k) { if (k <= 0) return; const u = p.userData; u.body.position.y += Math.abs(Math.sin(t * 16)) * 0.04 * k * u.s; u.head.rotation.x = -0.35 * k; u.mouth.scale.y = 0.01 + 0.9 * k * (0.7 + 0.3 * Math.abs(Math.sin(t * 16))); u.smile.visible = k < 0.2; u.teeth.visible = k > 0.2; u.arms.forEach((a, i) => (a.rotation.z = (i ? 1 : -1) * (0.12 + 0.35 * k))); }
function pWalk(p, t, amt = 1) { const u = p.userData, c = t * 6; u.legs[0].rotation.x = Math.sin(c) * 0.55 * amt; u.legs[1].rotation.x = -Math.sin(c) * 0.55 * amt; u.arms[0].rotation.x = -Math.sin(c) * 0.45 * amt; u.arms[1].rotation.x = Math.sin(c) * 0.45 * amt; u.body.position.y = Math.abs(Math.cos(c)) * 0.04 * amt * u.s; }
function pEyesGlow(p, k) { p.userData.glowEyes.forEach((gl) => (gl.material.opacity = 0.75 * k)); p.userData.eyes.forEach((e) => (e.p.material = k > 0.4 ? GLOWPUP : PUP)); }
function capitaoSombra(s = 1.12) { return pirata({ scale: s, fat: 1.25, coat: 0x2a1838, shirt: 0x5a1420, hat: "crooked", beard: "goatee", angry: true }); }
function velhoGigante(s = 1.85) { return pirata({ scale: s, fat: 1.15, coat: 0x8a8070, shirt: 0xd8d0c0, pants: 0x3a3a44, hat: "captain", beard: "long", cape: 0xf2f0ea, collar: false, hairC: 0xf2f2f6 }); }

// ---------------------------------------------------------------- frutas originais e cenário
function fruit(kind, s = 1) {
  const g = new THREE.Group(); const dark = kind === "dark";
  const tex = canvasTex(256, 128, (c) => {
    c.fillStyle = dark ? "#1c0c2c" : kind === "quake" ? "#e8eef8" : kind === "green" ? "#1a6a3a" : "#c8641a"; c.fillRect(0, 0, 256, 128);
    c.strokeStyle = dark ? "#b06aff" : kind === "quake" ? "#5ad8ff" : "#ffe9a0"; c.lineWidth = 5;
    if (kind === "quake") { for (let k = 0; k < 9; k++) { c.beginPath(); let x = hash(k + 3) * 256, y = 0; c.moveTo(x, y); for (let j = 0; j < 8; j++) { x += (hash(k * 9 + j) - 0.5) * 40; y += 16; c.lineTo(x, y); } c.stroke(); } }
    else { for (let k = 0; k < 6; k++) { c.beginPath(); for (let a = 0; a < 14; a += 0.2) { const r = 4 + a * 2.2; const x = 22 + k * 44 + Math.cos(a) * r * 0.5, y = 64 + Math.sin(a) * r * 0.9; a === 0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); } }
  });
  const ball = mesh(sph(0.17 * s, 28, 20), new THREE.MeshToonMaterial({ map: tex, gradientMap: grad }), 0, 0, 0, g); ol(ball, 0.008 * s); ball.scale.set(1, 0.92, 1);
  mesh(cyl(0.012 * s, 0.018 * s, 0.1 * s, 6), M(0x3a2a14), 0, 0.19 * s, 0, g).rotation.z = 0.3;
  const leaf = mesh(sph(0.06 * s, 10, 6), M(dark ? 0x2a1a3a : 0x6ad88a), 0.05 * s, 0.22 * s, 0, g); leaf.scale.set(1.4, 0.25, 0.7); leaf.rotation.z = -0.4;
  const gl = glowSprite(dark ? 0x8a3ac8 : kind === "quake" ? 0x9fe8ff : kind === "green" ? 0x6aff9a : 0xffb05a, 0.8 * s, 0.55); g.add(gl);
  g.userData = { ball, gl };
  return g;
}
function seaPlane(g, col = 0x0e1c34, size = 220, segs = 100) {
  const geo = new THREE.PlaneGeometry(size, size, segs, segs); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, M(col)); g.add(m);
  const base = Float32Array.from(geo.attributes.position.array);
  return (t) => { const p = geo.attributes.position.array; for (let i = 0; i < p.length; i += 3) { const x = base[i], z = base[i + 2]; p[i + 1] = Math.sin(x * 0.3 + t * 1.2) * 0.22 + Math.sin(z * 0.45 + t * 1.6) * 0.15 + Math.sin((x + z) * 0.8 + t * 2.2) * 0.05; } geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); };
}
function skyDome(g, stops, o = {}) {
  const sky = plane(220, 100, new THREE.MeshBasicMaterial({ map: skyTex(stops), fog: false, transparent: !!o.fade, opacity: 1 })); sky.position.set(0, 26, o.z ?? -80); g.add(sky);
  const st = dustPts(o.stars ?? 300, [-100, 100, 12, 70, (o.z ?? -80) + 2, (o.z ?? -80) + 3], 0xffffff, 0.3, 0.9, ADD, 7); st.material.fog = false; g.add(st);
  let moon = null; if (o.moon) { moon = mesh(sph(o.moonR || 3, 28, 20), new THREE.MeshBasicMaterial({ color: o.moonCol || 0xfff2d8, fog: false }), o.moon[0], o.moon[1], o.moon[2], g); const mg = glowSprite(o.moonCol || 0xffe6b8, (o.moonR || 3) * 6, 0.45); mg.material.fog = false; moon.add(mg); }
  return { sky, st, moon };
}
function ship(g, o = {}) {
  const sh = new THREE.Group(); g.add(sh);
  const wood = M(0x6a4428), dark = M(0x3a2414), deckM = M(0xffffff, { map: rep(planks(), 2, 5) });
  ol(mesh(box(3.2, 1.6, 11), wood, 0, 0.3, 0, sh), 0.03);
  const bs = new THREE.Shape(); bs.moveTo(-1.6, 0); bs.lineTo(1.6, 0); bs.lineTo(0, 3.2); bs.lineTo(-1.6, 0);
  const bow = mesh(new THREE.ExtrudeGeometry(bs, { depth: 1.6, bevelEnabled: false }), wood, 0, -0.5, -5.5, sh); bow.rotation.x = -Math.PI / 2; ol(bow, 0.03);
  mesh(box(3.0, 0.1, 10.8), deckM, 0, 1.1, 0, sh); mesh(box(0.1, 0.1, 10.8), deckM, 0, 1.1, 0, sh);
  [-1, 1].forEach((k) => { mesh(box(0.12, 0.45, 11), dark, 1.55 * k, 1.35, 0, sh); for (let i = 0; i < 8; i++) mesh(box(0.08, 0.45, 0.08), dark, 1.55 * k, 1.35, -5 + i * 1.4, sh); });
  mesh(box(3.2, 1.2, 2.2), wood, 0, 1.6, 4.4, sh); mesh(box(3.3, 0.12, 2.3), dark, 0, 2.25, 4.4, sh);
  for (let i = 0; i < 4; i++) { const w = mesh(box(0.35, 0.3, 0.05), new THREE.MeshBasicMaterial({ color: 0xffc27a }), -1.05 + i * 0.7, 1.6, 5.52, sh); }
  const sailM = new THREE.MeshToonMaterial({ color: o.sail ?? 0xe0d4b8, gradientMap: grad, side: THREE.DoubleSide });
  const sails = [];
  [[-2.2, 7.5, 3.2], [2.2, 6.6, 2.8]].forEach(([z, h, w]) => {
    ol(mesh(cyl(0.12, 0.16, h + 1.5, 10), dark, 0, 1.1 + (h + 1.5) / 2, z, sh), 0.01);
    [0.55, 0.85].forEach((f, j) => { mesh(cyl(0.06, 0.06, w * 1.4, 8), dark, 0, 1.1 + h * f + 0.7, z, sh).rotation.z = Math.PI / 2; const s2 = mesh(new THREE.CylinderGeometry(3.4, 3.4, h * 0.28, 14, 1, true, Math.PI - 0.4, 0.8), sailM, 0, 1.1 + h * f - h * 0.15 + 0.7, z + 3.4 - 0.25, sh); sails.push(s2); });
  });
  const flagT = canvasTex(128, 80, (c) => { c.fillStyle = "#0e0a12"; c.fillRect(0, 0, 128, 80); c.fillStyle = "#e8e0ff"; c.beginPath(); c.arc(64, 40, 22, 0, Math.PI * 2); c.fill(); c.fillStyle = "#0e0a12"; c.beginPath(); c.arc(74, 34, 20, 0, Math.PI * 2); c.fill(); c.strokeStyle = "#e8e0ff"; c.lineWidth = 5; c.beginPath(); c.moveTo(28, 66); c.lineTo(100, 14); c.moveTo(28, 14); c.lineTo(100, 66); c.stroke(); });
  const flag = mesh(new THREE.PlaneGeometry(1.3, 0.8, 8, 1), new THREE.MeshBasicMaterial({ map: flagT, side: THREE.DoubleSide }), 0.7, 10.2, -2.2, sh);
  const lan = [[-1.4, 1.9, -5.0], [1.4, 1.9, -5.0], [0, 2.7, 5.4]].map(([x, y, z]) => { mesh(box(0.14, 0.2, 0.14), new THREE.MeshBasicMaterial({ color: 0xffd08a }), x, y, z, sh); const l = glowSprite(0xffb36b, 1.1, 0.75); l.position.set(x, y, z); sh.add(l); return l; });
  for (let i = 0; i < 5; i++) { const b = mesh(cyl(0.22, 0.22, 0.5, 12), M(0x5a3a22), -1.0 + (i % 2) * 0.5, 1.4, 2.6 + Math.floor(i / 2) * 0.55, sh); ol(b, 0.01); }
  ol(mesh(box(0.6, 0.5, 0.6), M(0x7a5232), 1.0, 1.4, 1.6, sh), 0.01);
  return { sh, sails, flag, lan, upd(t) { sh.position.y = Math.sin(t * 0.9) * 0.12; sh.rotation.z = Math.sin(t * 0.7) * 0.03; sh.rotation.x = Math.sin(t * 0.55) * 0.015; flag.rotation.y = Math.sin(t * 3) * 0.2; lan.forEach((l, i) => (l.material.opacity = 0.65 + 0.12 * Math.sin(t * 7 + i))); } };
}
function darkAura(g, n = 14) { const ws = []; for (let i = 0; i < n; i++) { const w = glowSprite(0x0a0610, 0.8, 0, NORM); g.add(w); ws.push(w); } const vp = flowPts(70, 0xb06aff, 0.06); g.add(vp.pts); return (t, pos, k = 1, r0 = 0.6) => { ws.forEach((w, i) => { const ph = (t * 0.5 + hash(i)) % 1; const a = hash(i + 1) * 6.28 + t * 0.8; const r = r0 + ph * 0.5; w.position.set(pos.x + Math.cos(a) * r, pos.y + ph * 1.6, pos.z + Math.sin(a) * r); w.scale.setScalar(0.6 + 0.6 * Math.sin(ph * Math.PI)); w.material.opacity = 0.65 * k * Math.sin(ph * Math.PI); }); for (let i = 0; i < 70; i++) { const ph = (t * 0.4 + hash(i + 9)) % 1; const a = hash(i + 3) * 6.28 + t; vp.pos[i * 3] = pos.x + Math.cos(a) * (r0 + 0.2); vp.pos[i * 3 + 1] = pos.y + ph * 2.2; vp.pos[i * 3 + 2] = pos.z + Math.sin(a) * (r0 + 0.2); } vp.upd(); vp.pts.material.opacity = 0.85 * k; }; }
function quakeRings(g, col = 0xcff4ff) { const rs = [0, 1, 2].map(() => { const r = mesh(new THREE.TorusGeometry(1, 0.02, 6, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, blending: ADD }), 0, 0, 0, g); return r; }); return (t, pos, k = 1, axis = "y") => { rs.forEach((r, i) => { const ph = (t * 0.9 + i / 3) % 1; r.position.copy(pos); r.scale.setScalar(0.15 + ph * 0.6); r.material.opacity = 0.9 * k * (1 - ph); r.rotation.set(axis === "y" ? Math.PI / 2 : 0, axis === "z" ? 0 : 0, 0); }); }; }
function boom(g, size = 1) {
  const b = new THREE.Group(); g.add(b);
  const smoke = glowSprite(0x2a2026, 1, 0, NORM), fire = glowSprite(0xff7a2a, 1, 0), core = glowSprite(0xfff0c0, 1, 0); b.add(smoke, fire, core);
  const L = new THREE.PointLight(0xff8a3a, 0, 18 * size); b.add(L);
  return { b, set(t0, t) { const k = t - t0; const on = k >= 0 && k < 2.6; [smoke, fire, core].forEach((s) => (s.visible = on)); L.intensity = on ? 12 * Math.max(0, 1 - k / 0.9) : 0; if (!on) return; const e = Math.min(1, k / 0.25); core.scale.setScalar((0.5 + e * 3.2) * size); core.material.opacity = Math.max(0, 1 - k / 0.5); fire.scale.setScalar((1 + e * 5 + k) * size); fire.material.opacity = Math.max(0, 0.95 - k / 1.4); smoke.scale.setScalar((2 + k * 3.2) * size); smoke.material.opacity = Math.min(0.7, k * 1.5) * Math.max(0, 1 - k / 2.6); smoke.position.y = k * 1.2 * size; } };
}

// 1 · gancho: duas frutas, um aviso e o capitão no navio
addSet("s1-gancho", (g) => {
  skyDome(g, [[0, "#05040e"], [0.6, "#1a1030"], [1, "#3a1a3a"]], { moon: [14, 22, -70], moonR: 3.4 });
  const seaU = seaPlane(g, 0x0c1426);
  const S = ship(g, { sail: 0x2a2230 }); S.sh.rotation.y = Math.PI;
  const cap0 = capitaoSombra(); g.add(cap0);
  const fD = fruit("dark", 1.6), fQ = fruit("quake", 1.6); g.add(fD, fQ);
  const skull = holoText("✕", 0xff4d6d, 1.2, 0.6); g.add(skull);
  const aura = darkAura(g); const rings = quakeRings(g);
  const vl = new THREE.PointLight(0xa06aff, 0, 8); g.add(vl);
  const P = new THREE.Vector3();
  return {
    bg: 0x05040e, fog: [18, 90],
    update(t) {
      seaU(t); S.upd(t);
      cap0.position.set(0, S.sh.position.y + 1.15, 4.2); cap0.rotation.y = 0; pReset(cap0); pIdle(cap0, t); const pop = sm(seg(t, K.pirata - 0.45, K.pirata + 0.1)); cap0.visible = pop > 0.01; cap0.scale.setScalar(0.6 + 0.4 * pop);
      const rev = sm(seg(t, K.pirata - 0.4, K.pirata + 0.6)), laugh = sm(seg(t, K.ninguem - 0.2, K.ninguem + 0.4)) * (1 - sm(seg(t, K.fica + 1.2, K.assustadoras)));
      pLaugh(cap0, t, laugh); pEyesGlow(cap0, sm(seg(t, K.poderes - 0.3, K.poderes + 0.4)));
      cap0.userData.arms.forEach((a, i) => { a.rotation.x = -0.7 * rev * (i ? 1 : 0.6); });
      P.set(0, cap0.position.y + 1.25, 4.2);
      // antes de aparecer: as frutas sozinhas no escuro; depois, orbitando o capitão
      const clash = seg(t, K.duas0, K.morre); const orbit = rev;
      const a = t * 1.6;
      const preD = new THREE.Vector3(lerp(-0.5, -0.17, sm(clash)), 2.6, 6.9), preQ = new THREE.Vector3(lerp(0.5, 0.17, sm(clash)), 2.6, 6.9);
      fD.position.lerpVectors(preD, new THREE.Vector3(P.x + Math.cos(a) * 1.1, P.y + 0.1, P.z + Math.sin(a) * 1.1), orbit);
      fQ.position.lerpVectors(preQ, new THREE.Vector3(P.x - Math.cos(a) * 1.1, P.y + 0.1, P.z - Math.sin(a) * 1.1), orbit);
      fD.rotation.y = t; fQ.rotation.y = -t;
      skull.position.set(0, 3.25, 6.9); skull.visible = t > K.morre - 0.1 && t < K.pirata - 0.3; skull.material.opacity = 0.9;
      aura(t, new THREE.Vector3(0, cap0.position.y, 4.2), rev); rings(t, fQ.position, rev);
      vl.position.set(0, cap0.position.y + 1.5, 3.4); vl.intensity = 4 * rev;
    },
    cam(t) { const s = T.sc["s1-gancho"]; const c = keys(t, [[s[0], [0, 2.7, 9.6], [0, 2.6, 6.9]], [K.excecao, [0, 2.75, 9.3], [0, 2.65, 6.9]], [K.pirata, [1.4, 2.7, 10.4], [0, 2.9, 4.2]], [K.ninguem, [0.9, 2.8, 8.2], [0, 3.0, 4.2]], [K.fica + 0.6, [0.4, 3.0, 6.9], [0, 3.0, 4.2]], [s[1], [0.3, 3.0, 6.6], [0, 3.05, 4.2]]]); return c; },
  };
});

// 2 · décadas no navio do velho capitão; a fruta da escuridão e a traição
addSet("s2-navio", (g) => {
  const sk = skyDome(g, [[0, "#1a2a5a"], [0.6, "#ff8a5a"], [1, "#ffd29a"]]);
  const night = plane(220, 100, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#04040c"], [1, "#1a1a3a"]]), fog: false, transparent: true, opacity: 0 })); night.position.set(0, 26, -79); g.add(night);
  const sun = glowSprite(0xffd27a, 18, 0.8); sun.material.fog = false; g.add(sun);
  const seaU = seaPlane(g, 0x1a2a44);
  const S = ship(g); S.sh.rotation.y = Math.PI;
  const cap0 = capitaoSombra(1.0); g.add(cap0);
  const mate = pirata({ hat: "bandana", hatC: 0xd84a3a, shirt: 0xe8e8f0, coat: 0x2a3a5a, collar: false }); g.add(mate);
  const chest = new THREE.Group(); g.add(chest);
  ol(mesh(box(0.7, 0.42, 0.45), M(0x6a4a2a), 0, 0.21, 0, chest), 0.01); const lid = new THREE.Group(); lid.position.set(0, 0.42, -0.22); chest.add(lid); ol(mesh(box(0.72, 0.1, 0.47), M(0x7a5a3a), 0, 0.05, 0.22, lid), 0.01);
  const cg = glowSprite(0x9a5aff, 1.4, 0); cg.position.set(0, 0.5, 0); chest.add(cg);
  const fD = fruit("dark", 1.2); g.add(fD);
  const flash = glowSprite(0xb06aff, 4, 0); g.add(flash);
  const fall = flowPts(60, 0xc8a8ff, 0.05); g.add(fall.pts);
  return {
    bg: 0x14182a, fog: [18, 90],
    update(t) {
      seaU(t); S.upd(t); const y0 = S.sh.position.y + 1.15;
      const tl = seg(t, K.decadas - 0.2, K.unica); const cyc = tl * 3; const dayK = 0.5 + 0.5 * Math.cos(cyc * Math.PI * 2);
      night.material.opacity = t < K.decadas - 0.2 ? 0 : t > K.unica ? 0.6 : 1 - dayK; sun.position.set(-30 + ((cyc % 1) * 60), 6 + Math.sin((cyc % 1) * Math.PI) * 20, -75); sun.material.opacity = 0.8 * dayK;
      const lunge = sm(seg(t, K.matou - 0.3, K.matou + 0.1)), hold = sm(seg(t, K.matou + 0.05, K.matou + 0.55)), lift = sm(seg(t, K.ficar - 0.7, K.ficar - 0.1));
      cap0.position.set(lerp(-0.8, 0.0, lunge), y0, 1.0); cap0.rotation.y = 0.5; pReset(cap0); pIdle(cap0, t);
      chest.position.set(0.2, y0, -0.4);
      const op = sm(seg(t, K.escuridao - 0.5, K.escuridao + 0.2)); lid.rotation.x = -1.6 * op; cg.material.opacity = 0.8 * op;
      const take = sm(seg(t, K.apareceu - 0.2, K.apareceu + 0.6));
      mate.position.set(lerp(1.4, 0.6, take), y0, lerp(-0.4, -0.2, take)); mate.rotation.y = -0.9; pReset(mate); pIdle(mate, t, 2);
      if (take > 0) mate.userData.arms[0].rotation.x = -1.2 * take;
      const fk = seg(t, K.matou, K.matou + 0.8); mate.rotation.z = 1.3 * sm(fk); mate.position.y = y0 + 0.1 * sm(fk); mate.visible = fk < 0.95;
      // o capitão avança, arranca a fruta da mão do companheiro e depois a ergue rindo
      cap0.userData.arms[1].rotation.x = -1.3 * Math.max(lunge, hold) - 1.6 * lift;
      pEyesGlow(cap0, lift); pLaugh(cap0, t, lift * 0.8); cap0.userData.arms[1].rotation.z = 0.12 - 0.3 * lift; // depois do pLaugh: ergue a fruta acima da cabeça
      const hand = new THREE.Vector3(); mate.updateMatrixWorld(); mate.userData.arms[0].children[1].getWorldPosition(hand);
      const fromChest = new THREE.Vector3(0.2, y0 + 0.6 + Math.sin(t * 2) * 0.05, -0.4);
      const capHand = new THREE.Vector3(); cap0.updateMatrixWorld(); cap0.userData.arms[1].children[1].getWorldPosition(capHand); capHand.y += 0.14;
      if (t < K.apareceu - 0.2) fD.position.copy(fromChest); else if (hold < 0.01) fD.position.lerpVectors(fromChest, hand, take); else fD.position.lerpVectors(hand, capHand, hold);
      fD.visible = op > 0.05; fD.rotation.y = t;
      flash.position.set(0.3, y0 + 1.2, -0.2); flash.material.opacity = Math.max(0, 1 - Math.abs(t - K.matou) / 0.2) * 0.9;
      for (let i = 0; i < 60; i++) { const k = (fk * 0.9 + hash(i) * 0.5) % 1; fall.pos[i * 3] = 0.6 + (hash(i + 1) - 0.5) * 0.8; fall.pos[i * 3 + 1] = y0 + k * 2.2; fall.pos[i * 3 + 2] = -0.2 + (hash(i + 2) - 0.5) * 0.5; } fall.upd(); fall.pts.material.opacity = fk > 0 && fk < 1 ? 0.8 * Math.sin(fk * Math.PI) : 0;
    },
    cam(t) { const s = T.sc["s2-navio"]; return keys(t, [[s[0], [9, 6, 10], [0, 3, 0]], [K.decadas + 0.5, [6.2, 4.0, 7.6], [0.2, 2.2, 0.2]], [K.escuridao - 0.4, [2.4, 2.9, 3.6], [0, 1.9, -0.2]], [K.matou - 0.3, [3.3, 3.3, 6.0], [0.2, 2.1, 0.1]], [K.ficar, [2.6, 3.15, 5.1], [0.05, 2.35, 0.7]], [s[1], [2.45, 3.15, 4.9], [0.05, 2.4, 0.8]]]); },
  };
});

// 3 · a guerra: o gigante morre de pé, o pano preto, o poder dos terremotos
addSet("s3-guerra", (g) => {
  skyDome(g, [[0, "#1a0c10"], [0.55, "#4a1a14"], [1, "#a03a1a"]]);
  g.add(floorP(120, 120, M(0xffffff, { map: rep(stoneTex(), 30, 30) })));
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = 12 + hash(i) * 8; const h = 1 + hash(i + 2) * 4; ol(mesh(box(2 + hash(i + 3) * 3, h, 1.2), M(0x4a4048), Math.cos(a) * r, h / 2, Math.sin(a) * r - 4, g), 0.02); }
  for (let i = 0; i < 14; i++) rockAt(g, (hash(i + 20) - 0.5) * 16, 0.2, -2 - hash(i + 21) * 10, 0.2 + hash(i + 22) * 0.6, i + 20, 0x4a4048);
  const fires = []; for (let i = 0; i < 8; i++) { const f = glowSprite(0xff6a2a, 2 + hash(i) * 2, 0.6); f.position.set((hash(i + 30) - 0.5) * 20, 0.8, -6 - hash(i + 31) * 12); g.add(f); fires.push(f); }
  const smokes = []; for (let i = 0; i < 10; i++) { const s2 = glowSprite(0x2a2224, 6, 0.4, NORM); g.add(s2); smokes.push(s2); }
  const booms = [boom(g, 1.4), boom(g, 1.2), boom(g, 1.6)];
  const giant = velhoGigante(); giant.position.set(0, 0, -1.5); g.add(giant);
  const capB = capitaoSombra(); g.add(capB);
  const clothM = new THREE.MeshToonMaterial({ color: 0x18141e, gradientMap: grad, side: THREE.DoubleSide });
  // lençol enorme: perfil (raio, altura) que passa do chapéu e da capa do gigante
  const CH = 4.3, prof = [[0, 4.3], [0.35, 4.25], [0.62, 4.05], [0.82, 3.82], [0.98, 3.6], [1.14, 3.38], [1.32, 3.12], [1.45, 2.5], [1.57, 1.6], [1.72, 0.7], [1.8, 0.25], [1.84, 0]].map(([r, y]) => new THREE.Vector2(r, y));
  const cloth = mesh(new THREE.LatheGeometry(prof, 48), clothM, 0, 0, -1.5, g);
  cloth.frustumCulled = false; // os vértices mudam a cada quadro; a esfera de recorte calculada uma vez escondia o pano
  const cpos = cloth.geometry.attributes.position; const cbase = Float32Array.from(cpos.array);
  const rings = quakeRings(g); const cracks = new THREE.Group(); g.add(cracks);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + hash(i) * 0.3; const L = 2 + hash(i + 1) * 3; const c = mesh(box(0.06, 0.02, L), new THREE.MeshBasicMaterial({ color: 0xcff4ff }), Math.cos(a) * L / 2, 0.02, 0.6 + Math.sin(a) * L / 2, cracks); c.rotation.y = -a + Math.PI / 2; }
  const air = holoText("╳", 0xdff6ff, 2.2, 1.1); g.add(air);
  const L = new THREE.PointLight(0xbfe8ff, 0, 12); g.add(L);
  return {
    bg: 0x1a0c10, fog: [14, 70],
    update(t) {
      const s = T.sc["s3-guerra"];
      fires.forEach((f, i) => f.scale.setScalar((2 + hash(i) * 2) * (0.9 + 0.1 * Math.sin(t * 9 + i))));
      smokes.forEach((s2, i) => { const ph = (t * 0.06 + hash(i)) % 1; s2.position.set((hash(i + 40) - 0.5) * 24, 1 + ph * 12, -10 - hash(i + 41) * 10); s2.material.opacity = 0.45 * Math.sin(ph * Math.PI); });
      booms[0].b.position.set(-6, 0.5, -9); booms[0].set(s[0] + 0.3, t); booms[1].b.position.set(7, 0.5, -12); booms[1].set(s[0] + 1.6, t); booms[2].b.position.set(-3, 0.5, -16); booms[2].set(s[0] + 3.0, t);
      pReset(giant); pIdle(giant, t, 3);
      const dead = sm(seg(t, K.morreu - 0.3, K.pe + 0.2)); giant.userData.eyes.forEach((e) => (e.e.scale.y = 1 - 0.92 * dead)); giant.userData.head.rotation.x = 0.25 * dead; giant.userData.body.rotation.x = 0.06 * dead;
      giant.userData.arms[1].rotation.x = -0.4 * (1 - dead);
      const cover = sm(seg(t, K.cobriu - 0.2, K.cobriu + 1.3)), drop = seg(t, K.pano2 - 0.15, K.caiu + 0.55);
      const walkIn = sm(seg(t, K.tripulacao, K.cobriu));
      capB.position.set(lerp(4.0, 0.15, walkIn), 0, lerp(2.5, 0.55, walkIn)); capB.rotation.y = walkIn < 1 ? -1.2 : 0; pReset(capB); pIdle(capB, t, 1); if (walkIn > 0 && walkIn < 1) pWalk(capB, t);
      capB.visible = t > K.tripulacao - 0.1;
      // pano: desce do alto e cobre o gigante; no "caiu", desaba e fica amontoado no chão
      const p = cpos.array; const top = lerp(CH + 2.4, CH, cover), hS = lerp(0.3, 1, cover), fl = 1 + 0.3 * (1 - cover);
      for (let i = 0; i < p.length; i += 3) {
        const bx = cbase[i], by = cbase[i + 1], bz = cbase[i + 2]; const r0 = Math.hypot(bx, bz), a = Math.atan2(bz, bx);
        const front = Math.max(0, bz / (r0 || 1)) ** 2, low = 1 - by / CH; // mais justo na frente, onde o capitão está
        const wav = (Math.sin(a * 7 + t * 2.4) * 0.05 + Math.sin(a * 13 - t * 1.6) * 0.02) * low;
        const hem = 0.14 * Math.sin(a * 5 + t * 2.2) * Math.max(0, 1 - by / 0.7) * (1 - cover); // barra ondulando enquanto cai
        const rC = (r0 * (1 - 0.32 * front * low) + wav) * fl, yC = top - (CH - by) * hS + hem;
        const k = Math.min(1, Math.max(0, drop * 1.4 - (by / CH) * 0.4)); // a barra assenta primeiro, o topo por último
        const rr = lerp(rC, 0.4 + low * 1.9, k), yy = lerp(yC, 0.03 + 0.08 * Math.abs(Math.sin(a * 5 + by * 2.3)), k * k);
        const lean = (0.06 * yy + 0.16 * Math.min(1, Math.max(0, (yy - 3.2) / 0.8))) * (1 - k); // acompanha o gigante inclinado
        p[i] = Math.cos(a) * rr; p[i + 1] = yy; p[i + 2] = Math.sin(a) * rr + lean;
      }
      cpos.needsUpdate = true; cloth.geometry.computeVertexNormals(); cloth.visible = cover > 0.01;
      const pw = sm(seg(t, K.caiu, K.tinha)); pEyesGlow(capB, pw);
      const punch = seg(t, K.terremotos - 0.25, K.terremotos + 0.15); capB.userData.arms[1].rotation.x = -1.5 * Math.sin(Math.min(1, punch) * Math.PI / 2) * pw;
      const fist = new THREE.Vector3(); capB.updateMatrixWorld(); capB.userData.arms[1].children[1].getWorldPosition(fist); rings(t, fist, pw, "z");
      const bk = seg(t, K.terremotos, K.terremotos + 1.2); cracks.position.set(0.15, 0, 0.55); cracks.scale.setScalar(sm(bk)); cracks.visible = bk > 0;
      air.position.set(fist.x, fist.y, fist.z + 0.5); air.visible = bk > 0 && bk < 0.6; air.material.opacity = 1 - bk; air.scale.setScalar(0.6 + bk * 2);
      L.position.copy(fist); L.intensity = 8 * Math.max(0, 1 - bk) * (bk > 0 ? 1 : 0);
    },
    cam(t) { const s = T.sc["s3-guerra"]; const c = keys(t, [[s[0], [3.5, 3.2, 9.5], [0, 2.4, -2]], [K.morreu, [2.0, 3.0, 6.0], [0, 3.0, -1.5]], [K.pe + 0.5, [1.6, 3.4, 5.2], [0, 3.4, -1.5]], [K.cobriu + 0.5, [4.0, 3.2, 8.6], [0, 2.4, -1.4]], [K.caiu - 0.1, [2.6, 2.4, 5.6], [0.1, 2.0, -0.4]], [K.terremotos - 0.4, [1.7, 2.2, 4.8], [0.1, 2.0, 0.3]], [s[1], [2.4, 2.6, 6.2], [0.1, 1.7, 0.3]]]); return shakeCam(c, t, t > K.terremotos && t < K.terremotos + 1.0 ? 0.09 : 0); },
  };
});

// 4 · comeu outra fruta? não
addSet("s4-comeu", (g) => {
  skyDome(g, [[0, "#06040c"], [1, "#24123a"]], { stars: 200 });
  g.add(floorP(60, 60, M(0x14101c)));
  g.add(dustPts(200, [-6, 6, 0, 4, -8, 2], 0x7a4ab8, 0.9, 0.15, ADD, 4));
  const capC = capitaoSombra(); g.add(capC);
  const f3 = fruit("green", 1.1); g.add(f3);
  const puff = flowPts(40, 0xaa88dd, 0.06); g.add(puff.pts);
  return {
    bg: 0x0a0612, fog: [10, 50],
    update(t) {
      pReset(capC); pIdle(capC, t); capC.position.set(0, 0, 0);
      const lift = sm(seg(t, K.comeu - 0.3, K.segunda3 + 0.3)), gone = seg(t, K.nao3 - 0.1, K.nao3 + 0.5), shrug = sm(seg(t, K.nao3 + 0.3, K.nada));
      capC.userData.arms[1].rotation.x = -1.6 * lift * (1 - shrug);
      const hand = new THREE.Vector3(); capC.updateMatrixWorld(); capC.userData.arms[1].children[1].getWorldPosition(hand);
      f3.position.copy(hand).add(new THREE.Vector3(0, 0.15, 0.1)); f3.visible = gone < 0.4 && lift > 0.05; f3.scale.setScalar(1 - gone);
      for (let i = 0; i < 40; i++) { const a = hash(i) * 6.28, r = gone * (0.3 + hash(i + 1) * 0.6); puff.pos[i * 3] = hand.x + Math.cos(a) * r; puff.pos[i * 3 + 1] = hand.y + 0.15 + Math.sin(a * 1.7) * r * 0.6; puff.pos[i * 3 + 2] = hand.z + 0.1; } puff.upd(); puff.pts.material.opacity = gone > 0 && gone < 1 ? 0.9 * (1 - gone) : 0;
      capC.userData.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (0.12 + 0.9 * shrug); }); capC.userData.head.rotation.z = 0.15 * shrug; if (shrug > 0.3) { capC.userData.smile.visible = true; }
    },
    cam(t) { const s = T.sc["s4-comeu"]; return keys(t, [[s[0], [0.8, 2.3, 3.8], [0, 1.9, 0]], [s[1], [0.6, 2.2, 3.3], [0, 1.95, 0]]]); },
  };
});

// 5 · foi sorte? não — o corpo dele não é normal
addSet("s5-sorte", (g) => {
  skyDome(g, [[0, "#04060c"], [1, "#122438"]], { stars: 200 });
  g.add(floorP(60, 60, M(0xffffff, { map: rep(planks("#3a2a1c", "#33241a"), 6, 6) })));
  const coin = new THREE.Group(); g.add(coin); ol(mesh(cyl(0.18, 0.18, 0.03, 24), M(0xe0b84a), 0, 0, 0, coin), 0.006); coin.children[0].rotation.x = Math.PI / 2;
  const capS = capitaoSombra(); capS.position.set(0.5, 0, -0.6); g.add(capS);
  const mate2 = pirata({ coat: 0x2a4a7a, shirt: 0xe0e0e8, scarf: 0x3a8ad8, hair: true, hairC: 0xd8b04a, collar: false }); mate2.position.set(-0.65, 0, 0.45); mate2.rotation.y = 0.85; g.add(mate2);
  const scan = mesh(new THREE.PlaneGeometry(2.4, 0.06), new THREE.MeshBasicMaterial({ color: 0x7af0ff, transparent: true, opacity: 0.9, depthWrite: false, blending: ADD, side: THREE.DoubleSide }), 0.5, 0, -0.6, g); scan.rotation.x = -Math.PI / 2;
  const scanG = glowSprite(0x7af0ff, 2.2, 0); g.add(scanG);
  const noise = flowPts(160, 0xff4d6d, 0.05); g.add(noise.pts);
  const q = holoText("?!", 0xff4d6d, 0.9, 0.45); g.add(q);
  return {
    bg: 0x060a12, fog: [12, 60],
    update(t) {
      const fl = seg(t, K.sorte - 0.6, K.tambem4); coin.position.set(-0.4, 1.0 + Math.sin(fl * Math.PI) * 1.6, 1.2); coin.rotation.set(fl * 18, 0, 0.2); coin.visible = t < K.tambem4 + 0.5;
      pReset(capS); pIdle(capS, t); pReset(mate2); pIdle(mate2, t, 2);
      const pt = sm(seg(t, K.marco - 0.2, K.marco + 0.6)); mate2.userData.arms[1].rotation.x = -1.4 * pt; mate2.userData.brows.forEach((b, i) => (b.rotation.z = (i ? 1 : -1) * 0.3 * pt));
      const sk = seg(t, K.corpo4 - 0.3, K.normal + 0.2); scan.position.y = lerp(2.4, 0.1, sk); scan.visible = sk > 0 && sk < 1; scanG.position.set(0.5, scan.position.y, -0.6); scanG.material.opacity = sk > 0 && sk < 1 ? 0.6 : 0;
      const ft = Math.floor(t * 20), on = t > K.corpo4 && t < K.normal + 1.2;
      for (let i = 0; i < 160; i++) { noise.pos[i * 3] = 0.5 + (hash(i + ft * 7) - 0.5) * 0.7; noise.pos[i * 3 + 1] = 0.4 + hash(i + ft * 3) * 1.6; noise.pos[i * 3 + 2] = -0.6 + (hash(i + ft * 5) - 0.5) * 0.5; } noise.upd(); noise.pts.material.opacity = on ? 0.9 : 0;
      q.position.set(0.5, 2.8, -0.4); q.visible = t > K.normal - 0.2; q.material.opacity = 0.7 + 0.3 * Math.sin(t * 20);
      pEyesGlow(capS, on ? 1 : 0); pLaugh(capS, t, sm(seg(t, K.normal, K.normal + 0.4)) * 0.6);
    },
    cam(t) { const s = T.sc["s5-sorte"]; return keys(t, [[s[0], [0.2, 1.8, 4.6], [-0.4, 1.6, 0.8]], [K.tambem4, [0.4, 2.0, 5.2], [-0.2, 1.6, 0]], [K.marco + 0.4, [0.0, 2.2, 6.4], [-0.05, 1.5, 0.0]], [K.corpo4 - 1.0, [-0.1, 2.15, 6.0], [0.0, 1.5, 0.0]], [K.corpo4 - 0.3, [0.9, 2.05, 4.4], [0.4, 1.6, -0.6]], [s[1], [0.8, 2.0, 4.1], [0.45, 1.65, -0.6]]]); },
  };
});

// 6 · rapidinho: keys da Steam na bio
addSet("s6-keys", (g) => {
  g.add(dustPts(400, [-10, 10, -4, 10, -14, -2], 0xc99aff, 0.08, 0.8, ADD, 9));
  const bgG = glowSprite(0x6a2aa8, 16, 0.25); bgG.position.set(0, 2, -8); g.add(bgG);
  const capK = capitaoSombra(); capK.position.set(0, 0, -0.5); g.add(capK);
  const keyT = canvasTex(256, 128, (c) => { c.fillStyle = "#14102a"; c.fillRect(0, 0, 256, 128); c.strokeStyle = "#7af0ff"; c.lineWidth = 6; c.strokeRect(6, 6, 244, 116); c.fillStyle = "#ffd27a"; c.font = "700 30px 'Space Mono', monospace"; c.textAlign = "center"; c.fillText("★ KEY ★", 128, 46); c.fillStyle = "#ffffff"; c.font = "700 24px 'Space Mono', monospace"; c.fillText("XXXX-XXXX-XXXX", 128, 90); });
  const cards = []; for (let i = 0; i < 7; i++) { const c = mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshBasicMaterial({ map: keyT, side: THREE.DoubleSide }), 0, 0, 0, g); cards.push(c); }
  const pad = new THREE.Group(); g.add(pad); const pm = M(0x2a2a34); ol(mesh(box(0.7, 0.18, 0.36), pm, 0, 0, 0, pad), 0.01); [-1, 1].forEach((k) => { ol(mesh(sph(0.16, 12, 10), pm, 0.36 * k, -0.06, 0.04, pad), 0.01); }); [[0.18, 0.04, 0xff4d6d], [0.25, 0.1, 0x4dffa6], [0.25, -0.02, 0x7af0ff], [0.32, 0.04, 0xffd27a]].forEach(([x, z, c]) => mesh(cyl(0.025, 0.025, 0.03, 8), new THREE.MeshBasicMaterial({ color: c }), x, 0.1, z, pad)); mesh(box(0.12, 0.03, 0.04), M(0x111116), -0.22, 0.1, 0.04, pad); mesh(box(0.04, 0.03, 0.12), M(0x111116), -0.22, 0.1, 0.04, pad);
  const coins = []; for (let i = 0; i < 14; i++) { const c = mesh(cyl(0.08, 0.08, 0.015, 16), M(0xe0b84a), 0, 0, 0, g); c.rotation.x = Math.PI / 2; coins.push(c); }
  return {
    bg: 0x0e0820, fog: [20, 80],
    update(t) {
      const s = T.sc["s6-keys"]; pReset(capK); pIdle(capK, t);
      const pt = sm(seg(t, K.bio - 0.5, K.bio)); capK.userData.arms[1].rotation.set(-2.6 * pt, 0, 0.12); pLaugh(capK, t, sm(seg(t, K.steam - 0.2, K.steam + 0.3)) * (1 - pt) * 0.7);
      capK.userData.eyes.forEach((e, i) => (e.e.scale.y = i === 0 && Math.abs(t - (K.bio + 0.2)) < 0.25 ? 0.1 : e.e.scale.y));
      cards.forEach((c, i) => { const a = t * 0.8 + i * 0.9; c.position.set(Math.cos(a) * 1.5, 1.4 + Math.sin(t * 1.3 + i) * 0.35 + (i % 3) * 0.35, -0.5 + Math.sin(a) * 1.0); c.rotation.set(Math.sin(t + i) * 0.3, -a + Math.PI / 2, 0); });
      pad.position.set(-0.9, 2.5 + Math.sin(t * 2) * 0.08, 0.4); pad.rotation.set(0.5, t * 0.8, 0.2);
      coins.forEach((c, i) => { const ph = ((t - K.steam) * 0.8 + hash(i)) % 1; const on = t > K.steam - 0.1; c.visible = on; c.position.set((hash(i + 3) - 0.5) * 3, 4 - ph * 4.5, -0.2 + (hash(i + 4) - 0.5) * 1.5); c.rotation.set(Math.PI / 2 + t * 6 + i, t * 3, 0); });
    },
    cam(t) { const s = T.sc["s6-keys"]; return keys(t, [[s[0], [0, 2.0, 5.0], [0, 1.8, -0.5]], [s[1], [0, 1.9, 4.4], [0, 1.8, -0.5]]]); },
  };
});

// 7 · pistas: ele não dorme; a escuridão anula outros poderes
addSet("s7-pistas", (g) => {
  const sk = skyDome(g, [[0, "#04040e"], [0.6, "#14183a"], [1, "#2a2a5a"]], { moon: [0, 20, -70], moonR: 3 });
  const day = plane(220, 100, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#4a8ad8"], [1, "#ffd8a8"]]), fog: false, transparent: true, opacity: 0 })); day.position.set(0, 26, -79); g.add(day);
  const seaU = seaPlane(g, 0x0e1a30);
  const S = ship(g, { sail: 0x2a2230 }); S.sh.rotation.y = Math.PI;
  const capP = capitaoSombra(); g.add(capP);
  const clock = new THREE.Group(); g.add(clock); ol(mesh(cyl(0.45, 0.45, 0.06, 32), M(0xf2ead8), 0, 0, 0, clock), 0.01); clock.children[0].rotation.x = Math.PI / 2;
  const hH = mesh(box(0.04, 0.24, 0.02), new THREE.MeshBasicMaterial({ color: 0x1a1a1a }), 0, 0.1, 0.04, clock), hM = mesh(box(0.025, 0.36, 0.02), new THREE.MeshBasicMaterial({ color: 0x1a1a1a }), 0, 0.16, 0.05, clock);
  const hHg = new THREE.Group(), hMg = new THREE.Group(); clock.add(hHg, hMg); hHg.add(hH); hMg.add(hM);
  const orb = new THREE.Group(); g.add(orb); const oc = mesh(sph(0.16, 20, 14), new THREE.MeshBasicMaterial({ color: 0xff8a3a }), 0, 0, 0, orb); const og = glowSprite(0xffb05a, 1.2, 0.8); orb.add(og);
  const tend = []; for (let i = 0; i < 10; i++) { const w = glowSprite(0x050308, 0.5, 0, NORM); g.add(w); tend.push(w); }
  const c1 = new THREE.Color(0xff8a3a), c2 = new THREE.Color(0x777777);
  return {
    bg: 0x06060e, fog: [18, 90],
    update(t) {
      seaU(t); S.upd(t); const y0 = S.sh.position.y + 1.15;
      capP.position.set(0, y0, 3.6); pReset(capP); pIdle(capP, t); capP.userData.eyes.forEach((e) => (e.e.scale.y = 1.25)); capP.userData.eyes.forEach((e) => (e.p.scale.setScalar(0.7)));
      const tl = seg(t, K.dorme - 0.3, K.pista2 - 0.4); const cyc = tl * 2.5, dk = Math.max(0, Math.sin(cyc * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5) * (tl > 0 && tl < 1 ? 1 : 0);
      day.material.opacity = dk * 0.9; if (sk.moon) sk.moon.position.set(-30 + ((cyc % 1) * 60), 10 + Math.sin((cyc % 1) * Math.PI) * 18, -70);
      clock.position.set(0.85, y0 + 2.75, 3.5); clock.visible = t < K.pista2 - 0.2; hMg.rotation.z = -t * 9; hHg.rotation.z = -t * 0.75;
      const p2 = t > K.pista2 - 0.2;
      capP.userData.arms[1].rotation.x = p2 ? -1.3 * sm(seg(t, K.pista2, K.escuridao6)) : 0; pEyesGlow(capP, p2 ? 1 : 0);
      const hand = new THREE.Vector3(); capP.updateMatrixWorld(); capP.userData.arms[1].children[1].getWorldPosition(hand);
      const ak = seg(t, K.escuridao6, K.anula + 0.6), eat = sm(seg(t, K.anula - 0.1, K.toca));
      orb.visible = p2 && eat < 0.98; orb.position.set(lerp(hand.x - 2.5, hand.x, ak), lerp(hand.y + 1.2, hand.y + 0.05, ak), lerp(hand.z + 1.2, hand.z + 0.15, ak)); oc.material.color.copy(c1).lerp(c2, eat); og.material.color.copy(c1).lerp(c2, eat); og.material.opacity = 0.8 * (1 - eat); orb.scale.setScalar(1 - eat * 0.9);
      tend.forEach((w, i) => { const a = hash(i) * 6.28 + t * 3; const r = 0.15 + 0.2 * (1 - eat); w.position.set(orb.position.x + Math.cos(a) * r, orb.position.y + Math.sin(a * 1.3) * r, orb.position.z + Math.sin(a) * r); w.material.opacity = p2 && ak > 0.6 && eat < 1 ? 0.75 : 0; w.scale.setScalar(0.35 + 0.2 * Math.sin(t * 6 + i)); });
    },
    cam(t) { const s = T.sc["s7-pistas"]; return keys(t, [[s[0], [1.6, 3.4, 8.0], [0, 3.0, 3.6]], [K.dorme, [1.3, 3.2, 7.2], [0.4, 3.2, 3.6]], [K.pista2 - 0.25, [1.3, 3.2, 7.2], [0.4, 3.2, 3.6]], [K.pista2 - 0.2, [2.9, 3.0, 7.8], [0.3, 2.7, 3.8]], [s[1], [2.6, 2.9, 7.2], [0.4, 2.7, 3.8]]]); },
  };
});

// 8 · teorias: mais de uma alma; linhagem rara
addSet("s8-teorias", (g) => {
  skyDome(g, [[0, "#04030a"], [1, "#1a0e2a"]], { stars: 260 });
  g.add(floorP(60, 60, M(0x120e1a)));
  g.add(dustPts(260, [-8, 8, 0, 6, -10, 2], 0x9a6aff, 0.5, 0.15, ADD, 8));
  const capT = capitaoSombra(); g.add(capT);
  const ghostM = new THREE.MeshBasicMaterial({ color: 0xc8a8ff, transparent: true, opacity: 0, depthWrite: false, blending: ADD });
  const ghosts = [0, 1, 2].map((i) => { const gh = pirata({ scale: 1.12, fat: 1.25, hat: "crooked", beard: "goatee", collar: true }); gh.traverse((o) => { if (o.material && o.isMesh) o.material = ghostM; }); g.add(gh); return gh; });
  const orbs = [fruit("dark", 1), fruit("quake", 1), fruit("green", 1)]; orbs.forEach((o) => g.add(o));
  const helix = new THREE.Group(); helix.position.set(0, 0, -2.2); g.add(helix);
  const hm = glowM(0xffd27a, 0.9), hm2 = glowM(0xffe9b0, 0.7);
  for (let i = 0; i < 40; i++) { const y = i * 0.12, a = i * 0.45; mesh(sph(0.06, 8, 6), hm, Math.cos(a) * 0.6, y, Math.sin(a) * 0.6, helix); mesh(sph(0.06, 8, 6), hm, -Math.cos(a) * 0.6, y, -Math.sin(a) * 0.6, helix); if (i % 3 === 0) { const r = mesh(box(1.2, 0.02, 0.02), hm2, 0, y, 0, helix); r.rotation.y = -a; } }
  const gold = glowSprite(0xffd27a, 4, 0); g.add(gold);
  return {
    bg: 0x06040c, fog: [12, 60],
    update(t) {
      pReset(capT); pIdle(capT, t); capT.position.set(0, 0, 0);
      const t1 = sm(seg(t, K.primeira - 0.2, K.alma + 0.4)) * (1 - sm(seg(t, K.segunda7 - 0.5, K.segunda7))), t2 = sm(seg(t, K.segunda7 - 0.2, K.linhagem + 0.4));
      ghostM.opacity = 0.35 * t1;
      ghosts.forEach((gh, i) => { const a = (i / 3) * Math.PI * 2 + t * 0.6; const r = 1.1 * t1; gh.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r * 0.6 - 0.3); gh.visible = t1 > 0.02; pReset(gh); gh.rotation.y = 0; });
      const holdK = sm(seg(t, K.cada - 0.2, K.cada + 0.5)) * t1;
      orbs.forEach((o, i) => { const gh = ghosts[i]; o.visible = holdK > 0.02; o.position.set(gh.position.x + 0.5, 2.3 + Math.sin(t * 2 + i) * 0.08, gh.position.z + 0.2); o.scale.setScalar(holdK); o.rotation.y = t; });
      helix.visible = t2 > 0.02; helix.rotation.y = t * 0.8; helix.scale.setScalar(t2); gold.position.set(0, 2, -2.0); gold.material.opacity = 0.35 * t2;
      pEyesGlow(capT, Math.max(t1, t2));
    },
    cam(t) { const s = T.sc["s8-teorias"]; return keys(t, [[s[0], [0, 2.3, 6.0], [0, 1.8, 0]], [K.alma, [0, 2.4, 6.6], [0, 1.9, -0.2]], [K.segunda7, [1.0, 2.3, 6.2], [0, 2.4, -1.2]], [s[1], [0.8, 2.2, 5.8], [0, 2.4, -1.4]]]); },
  };
});

// 9 · o único da história... e talvez não pare em dois
addSet("s9-unico", (g) => {
  skyDome(g, [[0, "#030208"], [1, "#160a22"]], { stars: 260 });
  g.add(floorP(60, 60, M(0x0e0a14)));
  const spot = new THREE.SpotLight(0xd8c8ff, 0, 14, 0.42, 0.5); spot.position.set(0, 7, 2); spot.target.position.set(0, 0, 0); g.add(spot, spot.target);
  const pool = glowPlane(0xb08aff, 3, 3, 0); g.add(pool);
  const capU = capitaoSombra(); g.add(capU);
  const crowd = []; for (let i = 0; i < 10; i++) { const p = pirata({ coat: 0x22202a, shirt: 0x3a3a44, hat: i % 3 === 0 ? "bandana" : null, collar: false }); const a = Math.PI * (0.15 + (i / 9) * 0.7); p.position.set(Math.cos(a) * 5, 0, -Math.sin(a) * 4 - 1); p.lookAt(0, 0, 0); g.add(p); crowd.push(p); }
  const q = holoText("?", 0xffd27a, 1.6, 0.8); g.add(q);
  const fr = [fruit("dark", 1.2), fruit("quake", 1.2), fruit("green", 1.2), fruit("orange", 1.2)]; fr.forEach((f) => g.add(f));
  const aura = darkAura(g, 12);
  return {
    bg: 0x050308, fog: [10, 50],
    update(t) {
      const s = T.sc["s9-unico"];
      pReset(capU); pIdle(capU, t); capU.position.set(0, 0, 0);
      const un = sm(seg(t, K.unico - 0.4, K.unico + 0.3)); spot.intensity = 30 * un; pool.position.set(0, 0.02, 0.1); pool.material.opacity = 0.45 * un;
      crowd.forEach((p, i) => { pReset(p); pIdle(p, t, i); p.visible = un < 0.9; p.traverse((o) => { if (o.material && o.material.opacity !== undefined && o.isMesh) { } }); p.scale.setScalar(1 - 0.3 * un); });
      q.position.set(0.95, 2.5 + Math.sin(t * 2) * 0.06, 0.4); q.visible = t < K.unico - 0.3; q.material.opacity = 0.8 + 0.2 * Math.sin(t * 9);
      const more = sm(seg(t, K.talvez - 0.2, K.dois8 + 0.3));
      fr.forEach((f, i) => { const a = t * 1.4 + (i / 4) * Math.PI * 2; const on = i < 2 ? un : more; f.visible = on > 0.02; f.position.set(Math.cos(a) * 1.15, 1.6 + Math.sin(t * 2 + i) * 0.15, Math.sin(a) * 1.15); f.scale.setScalar(on); f.rotation.y = t; });
      pEyesGlow(capU, un); pLaugh(capU, t, more); aura(t, new THREE.Vector3(0, 0, 0), un);
    },
    cam(t) { const s = T.sc["s9-unico"]; return keys(t, [[s[0], [0, 2.6, 7.5], [0, 1.8, 0]], [K.unico, [0, 2.4, 6.2], [0, 1.9, 0]], [K.talvez, [0.8, 2.3, 5.2], [0, 2.0, 0]], [s[1], [0.6, 2.25, 4.8], [0, 2.05, 0]]]); },
  };
});

// 10 · pergunta: o navio dele some na escuridão
addSet("s10-pergunta", (g) => {
  skyDome(g, [[0, "#04030a"], [0.6, "#140c26"], [1, "#2a1438"]], { moon: [-10, 18, -70], moonR: 3.2, moonCol: 0xe8d8ff });
  const seaU = seaPlane(g, 0x0a1022);
  const S = ship(g, { sail: 0x1e1828 }); S.sh.rotation.y = 0.15;
  const capF = capitaoSombra(); g.add(capF);
  const aura = darkAura(g, 10);
  return {
    bg: 0x05040a, fog: [16, 80],
    update(t) {
      const s = T.sc["s10-pergunta"]; seaU(t); S.upd(t); const away = seg(t, s[0], s[1]);
      S.sh.position.z = -away * 6; S.sh.position.x = away * 1.5;
      const p = new THREE.Vector3(0, 0, 4.2); p.applyAxisAngle(new THREE.Vector3(0, 1, 0), S.sh.rotation.y); p.add(S.sh.position); p.y = S.sh.position.y + 2.37;
      capF.position.copy(p); capF.rotation.y = Math.atan2(3.0 - p.x, 12.5 - p.z); pReset(capF); pIdle(capF, t); pLaugh(capF, t, 0.8); pEyesGlow(capF, 1); aura(t, p, 0.8);
    },
    cam(t) { const s = T.sc["s10-pergunta"]; return keys(t, [[s[0], [3.6, 5.4, 15.5], [0, 3.0, 1]], [s[1], [3.4, 5.2, 16.5], [0, 2.8, -3]]]); },
  };
});

// thumb: o capitão sorrindo, olhos acesos, as duas frutas girando
addSet("thumb", (g) => {
  skyDome(g, [[0, "#05040e"], [0.6, "#1e1036"], [1, "#4a1a4a"]], { moon: [9, 20, -70], moonR: 3.4 });
  const seaU = seaPlane(g, 0x0c1426);
  const capH = capitaoSombra(); g.add(capH);
  const fD = fruit("dark", 1.5), fQ = fruit("quake", 1.5); g.add(fD, fQ);
  const aura = darkAura(g, 14); const rings = quakeRings(g);
  const vl = new THREE.PointLight(0xa06aff, 5, 8); vl.position.set(0, 2.6, 1.6); g.add(vl);
  return {
    bg: 0x05040e, fog: [18, 90],
    update() { const t = 1.2; seaU(t); capH.position.set(0, 0.2, 0); pReset(capH); pIdle(capH, t); pLaugh(capH, t, 0.7); pEyesGlow(capH, 1); fD.position.set(-0.55, 1.55, 1.0); fQ.position.set(0.55, 1.55, 1.0); fD.rotation.y = 0.5; fQ.rotation.y = -0.5; aura(t, new THREE.Vector3(0, 0.2, 0), 1); rings(t, fQ.position, 1); },
    cam() { return { pos: [0, 2.3, 4.6], look: [0, 2.05, 0] }; },
  };
});

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
window.__hf.buildReady["barba3d"] = (async () => {
  try { await document.fonts.load("700 48px 'Space Mono'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
