// Cena 3D do vídeo de curiosidade "Por que o Shanks nunca foi atrás do One Piece antes do Luffy?" (personagens originais) (Three.js).
// Tudo é função do tempo t (hf-seek). Tempos-chave em window.HF_T (gerado por tools/build_shanks.py).
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
rim.color.set(0xff8a5a); rim.intensity = 0.75;
hemi.color.set(0xb8c4e8); hemi.groundColor.set(0x1a1418);
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
const PUP = new THREE.MeshBasicMaterial({ color: 0x120a18 }), GLOWPUP = new THREE.MeshBasicMaterial({ color: 0xffc8b0 });

// ---------------------------------------------------------------- personagens originais animados (nada desenhado da série)
const SKIN = 0xd9a07a;
function strawHat(s = 1, bandC = 0x5a3418) {
  const hg = new THREE.Group(); const hc = M(0xe6c56a);
  ol(mesh(cyl(0.44 * s, 0.44 * s, 0.025 * s, 28), hc, 0, 0, 0, hg), 0.008 * s);
  ol(mesh(new THREE.SphereGeometry(0.24 * s, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hc, 0, 0, 0, hg), 0.008 * s);
  mesh(cyl(0.245 * s, 0.245 * s, 0.05 * s, 20), M(bandC), 0, 0.03 * s, 0, hg);
  return hg;
}
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
  if (o.oneArm) arms[1].visible = false; // manga vazia sob a capa
  const head = new THREE.Group(); head.position.set(0, 1.78 * s, 0.02 * s); body.add(head);
  outl(mesh(sph(0.23 * s, 22, 16), M(skinC), 0, 0, 0, head), 0.012);
  mesh(sph(0.045 * s, 10, 8), M(skinC), 0, -0.01 * s, 0.225 * s, head);
  const eyeW = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyes = [-1, 1].map((k) => { const e = new THREE.Group(); e.position.set(0.085 * k * s, 0.06 * s, 0.195 * s); head.add(e); mesh(sph(0.042 * s, 12, 10), eyeW, 0, 0, 0, e).scale.z = 0.6; const p = mesh(sph(0.022 * s, 10, 8), PUP, 0, 0, 0.022 * s, e); return { e, p }; });
  const brows = [-1, 1].map((k) => { const b = mesh(box(0.1 * s, 0.024 * s, 0.02 * s), M(o.hairC ?? 0x120a10), 0.085 * k * s, 0.13 * s, 0.205 * s, head); b.rotation.z = (o.angry ? -0.3 : 0.12) * k; return b; });
  const smile = mesh(new THREE.TorusGeometry(0.075 * s, 0.014 * s, 6, 18, Math.PI), new THREE.MeshBasicMaterial({ color: 0x2a0a10 }), 0, -0.065 * s, 0.208 * s, head); smile.rotation.z = Math.PI;
  const mouth = mesh(sph(0.075 * s, 14, 10), new THREE.MeshBasicMaterial({ color: 0x3a0a14 }), 0, -0.09 * s, 0.19 * s, head); mouth.scale.set(1.2, 0.01, 0.5);
  const teeth = mesh(box(0.13 * s, 0.026 * s, 0.02 * s), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, -0.065 * s, 0.218 * s, head); teeth.visible = false;
  if (o.beard === "goatee") { const b = mesh(new THREE.ConeGeometry(0.09 * s, 0.26 * s, 12), M(o.beardC ?? 0x0e0a10), 0, -0.25 * s, 0.13 * s, head); b.rotation.x = Math.PI + 0.35; outl(b, 0.008); [-1, 1].forEach((k) => mesh(box(0.05 * s, 0.16 * s, 0.08 * s), M(o.beardC ?? 0x0e0a10), 0.205 * k * s, -0.02 * s, 0.05 * s, head)); }
  if (o.beard === "long") { const b = mesh(new THREE.ConeGeometry(0.2 * s, 0.62 * s, 16), M(o.beardC ?? 0xf2f2f6), 0, -0.37 * s, 0.1 * s, head); b.rotation.x = Math.PI + 0.12; outl(b, 0.01); mesh(sph(0.21 * s, 16, 12), M(o.beardC ?? 0xf2f2f6), 0, -0.11 * s, 0.07 * s, head).scale.set(1, 0.6, 0.9); }
  if (o.hat === "crooked") { const hc = M(0x1a1020); const hg = new THREE.Group(); hg.position.set(0, 0.17 * s, 0); head.add(hg); outl(mesh(cyl(0.42 * s, 0.42 * s, 0.03 * s, 28), hc, 0, 0, 0, hg), 0.01); outl(mesh(cyl(0.16 * s, 0.22 * s, 0.26 * s, 18), hc, 0, 0.14 * s, 0, hg), 0.01); const tip = new THREE.Group(); tip.position.set(0, 0.27 * s, 0); hg.add(tip); outl(mesh(new THREE.ConeGeometry(0.16 * s, 0.38 * s, 16), hc, 0, 0.17 * s, 0, tip), 0.01); tip.rotation.z = -0.55; mesh(cyl(0.225 * s, 0.225 * s, 0.05 * s, 18), M(0x8a3ac8), 0, 0.05 * s, 0, hg); }
  if (o.hat === "captain") { const hc = M(o.hatC ?? 0xe8e8ee); const hg = new THREE.Group(); hg.position.set(0, 0.16 * s, 0); head.add(hg); outl(mesh(cyl(0.34 * s, 0.34 * s, 0.03 * s, 24), hc, 0, 0, 0, hg), 0.01); outl(mesh(cyl(0.2 * s, 0.24 * s, 0.18 * s, 18), hc, 0, 0.1 * s, 0, hg), 0.01); mesh(cyl(0.245 * s, 0.245 * s, 0.04 * s, 18), M(0xc9a227), 0, 0.03 * s, 0, hg); }
  if (o.hat === "bandana") { const hc = M(o.hatC ?? 0xc83a3a); outl(mesh(new THREE.SphereGeometry(0.24 * s, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hc, 0, 0.02 * s, -0.01 * s, head), 0.008); mesh(sph(0.05 * s, 8, 6), hc, 0, 0.0, -0.25 * s, head); }
  let hatG = null;
  if (o.hat === "straw") { hatG = strawHat(s, o.bandC); hatG.position.set(0, 0.15 * s, 0); head.add(hatG); }
  if (o.hair) { const hm = M(o.hair); // cabelo: calota só no alto (os olhos ficam livres), volume atrás e mechas pra cima
    outl(mesh(new THREE.SphereGeometry(0.248 * s, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.34), hm, 0, 0.012 * s, -0.012 * s, head), 0.008);
    outl(mesh(sph(0.235 * s, 18, 12), hm, 0, -0.01 * s, -0.085 * s, head), 0.008).scale.set(1.06, 0.98, 0.84);
    for (let i = 0; i < 7; i++) { const a = -1.0 + i * (2.0 / 6); const tf = mesh(new THREE.ConeGeometry(0.05 * s, 0.15 * s, 6), hm, Math.sin(a) * 0.17 * s, 0.17 * s, Math.cos(a) * 0.12 * s, head); tf.rotation.set(0.55, 0, -a * 0.7); }
    for (let i = 0; i < 6; i++) { const a = Math.PI * 0.55 + i * 0.36; const tf = mesh(new THREE.ConeGeometry(0.06 * s, 0.17 * s, 6), hm, Math.sin(a) * 0.15 * s, 0.13 * s, Math.cos(a) * 0.17 * s - 0.04 * s, head); tf.rotation.set(-0.7 * Math.cos(a), 0, 0.7 * Math.sin(a)); }
    [-1, 1].forEach((k) => { const sd = mesh(new THREE.ConeGeometry(0.045 * s, 0.13 * s, 6), hm, 0.215 * k * s, -0.02 * s, -0.01 * s, head); sd.rotation.set(0, 0, Math.PI - 0.25 * k); }); }
  let hood = null, hoodSh = null;
  if (o.hood) { hood = new THREE.Group(); head.add(hood); const hm2 = new THREE.MeshToonMaterial({ color: o.hood, gradientMap: grad, side: THREE.DoubleSide });
    outl(mesh(new THREE.SphereGeometry(0.31 * s, 22, 14, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, 0, Math.PI * 0.62), hm2, 0, 0.03 * s, -0.03 * s, hood), 0.01);
    hoodSh = glowSprite(0x05030a, 0.58 * s, 0.95, NORM); hoodSh.position.set(0, -0.01 * s, 0.31 * s); hood.add(hoodSh); }
  if (o.sword) { const sw = new THREE.Group(); sw.position.set(0.38 * s * fat, 0.92 * s, 0.1 * s); body.add(sw); ol(mesh(box(0.035 * s, 0.9 * s, 0.012 * s), M(0xdfe4ee), 0, -0.47 * s, 0, sw), 0.005);
    mesh(box(0.18 * s, 0.03 * s, 0.05 * s), M(0xc9a227), 0, -0.01 * s, 0, sw); mesh(cyl(0.022 * s, 0.022 * s, 0.17 * s, 8), M(0x2a1410), 0, 0.08 * s, 0, sw); sw.rotation.set(0.3, 0, 0.22); }
  if (o.scarf) mesh(new THREE.TorusGeometry(0.2 * s, 0.06 * s, 8, 20), M(o.scarf), 0, 1.6 * s, 0, body).rotation.x = Math.PI / 2;
  if (o.cape) mesh(new THREE.CylinderGeometry(0.55 * s * fat, 0.78 * s * fat, 1.55 * s, 22, 1, true, Math.PI * 0.35, Math.PI * 1.3), new THREE.MeshToonMaterial({ color: o.cape, gradientMap: grad, side: THREE.DoubleSide }), 0, 0.95 * s, -0.04 * s, body);
  const glowEyes = [-1, 1].map((k) => { const gl = glowSprite(o.eyeGlow ?? 0xb06aff, 0.13 * s, 0); gl.position.set(0.085 * k * s, 0.06 * s, 0.24 * s); head.add(gl); return gl; });
  g.userData = { body, legs, arms, head, torso, eyes, brows, smile, mouth, teeth, glowEyes, s, hatG, hood, hoodSh };
  return g;
}
function pReset(p) { const u = p.userData; u.legs.forEach((l) => l.rotation.set(0, 0, 0)); u.arms.forEach((a, i) => a.rotation.set(0, 0, (i ? 1 : -1) * 0.12)); u.body.position.set(0, 0, 0); u.body.rotation.set(0, 0, 0); u.head.rotation.set(0, 0, 0); u.mouth.scale.y = 0.01; u.smile.visible = true; u.teeth.visible = false; u.eyes.forEach((e) => (e.e.scale.y = 1)); }
function pIdle(p, t, i = 0) { const u = p.userData; u.torso.scale.y = 1.2 + Math.sin(t * 2 + i) * 0.015; u.head.position.y = 1.78 * u.s + Math.sin(t * 2 + i) * 0.006 * u.s; const bl = ((t + i * 0.7) % 3.6) < 0.12; u.eyes.forEach((e) => (e.e.scale.y = bl ? 0.1 : 1)); }
function pLaugh(p, t, k) { if (k <= 0) return; const u = p.userData; u.body.position.y += Math.abs(Math.sin(t * 16)) * 0.04 * k * u.s; u.head.rotation.x = -0.35 * k; u.mouth.scale.y = 0.01 + 0.9 * k * (0.7 + 0.3 * Math.abs(Math.sin(t * 16))); u.smile.visible = k < 0.2; u.teeth.visible = k > 0.2; u.arms.forEach((a, i) => (a.rotation.z = (i ? 1 : -1) * (0.12 + 0.35 * k))); }
function pWalk(p, t, amt = 1) { const u = p.userData, c = t * 6; u.legs[0].rotation.x = Math.sin(c) * 0.55 * amt; u.legs[1].rotation.x = -Math.sin(c) * 0.55 * amt; u.arms[0].rotation.x = -Math.sin(c) * 0.45 * amt; u.arms[1].rotation.x = Math.sin(c) * 0.45 * amt; u.body.position.y = Math.abs(Math.cos(c)) * 0.04 * amt * u.s; }
function pEyesGlow(p, k) { p.userData.glowEyes.forEach((gl) => (gl.material.opacity = 0.75 * k)); p.userData.eyes.forEach((e) => (e.p.material = k > 0.4 ? GLOWPUP : PUP)); }
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
  const flagT = o.flagT || canvasTex(128, 80, (c) => { c.fillStyle = "#0e0a12"; c.fillRect(0, 0, 128, 80); c.fillStyle = o.flagC || "#d8322a"; c.beginPath(); c.arc(64, 40, 21, 0, Math.PI * 2); c.fill(); c.strokeStyle = "#f2efe6"; c.lineWidth = 5; c.beginPath(); c.moveTo(40, 64); c.lineTo(88, 16); c.moveTo(88, 64); c.lineTo(40, 16); c.stroke(); c.fillStyle = "#f2efe6"; [[40, 64], [88, 64]].forEach(([x, y]) => c.fillRect(x - 6, y - 3, 12, 6)); });
  const flag = mesh(new THREE.PlaneGeometry(1.3, 0.8, 8, 1), new THREE.MeshBasicMaterial({ map: flagT, side: THREE.DoubleSide }), 0.7, 10.2, -2.2, sh);
  const lan = [[-1.4, 1.9, -5.0], [1.4, 1.9, -5.0], [0, 2.7, 5.4]].map(([x, y, z]) => { mesh(box(0.14, 0.2, 0.14), new THREE.MeshBasicMaterial({ color: 0xffd08a }), x, y, z, sh); const l = glowSprite(0xffb36b, 1.1, 0.75); l.position.set(x, y, z); sh.add(l); return l; });
  for (let i = 0; i < 5; i++) { const b = mesh(cyl(0.22, 0.22, 0.5, 12), M(0x5a3a22), -1.0 + (i % 2) * 0.5, 1.4, 2.6 + Math.floor(i / 2) * 0.55, sh); ol(b, 0.01); }
  ol(mesh(box(0.6, 0.5, 0.6), M(0x7a5232), 1.0, 1.4, 1.6, sh), 0.01);
  return { sh, sails, flag, lan, upd(t) { sh.position.y = Math.sin(t * 0.9) * 0.12; sh.rotation.z = Math.sin(t * 0.7) * 0.03; sh.rotation.x = Math.sin(t * 0.55) * 0.015; flag.rotation.y = Math.sin(t * 3) * 0.2; lan.forEach((l, i) => (l.material.opacity = 0.65 + 0.12 * Math.sin(t * 7 + i))); } };
}
function quakeRings(g, col = 0xcff4ff) { const rs = [0, 1, 2].map(() => { const r = mesh(new THREE.TorusGeometry(1, 0.02, 6, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, blending: ADD }), 0, 0, 0, g); return r; }); return (t, pos, k = 1, axis = "y") => { rs.forEach((r, i) => { const ph = (t * 0.9 + i / 3) % 1; r.position.copy(pos); r.scale.setScalar(0.15 + ph * 0.6); r.material.opacity = 0.9 * k * (1 - ph); r.rotation.set(axis === "y" ? Math.PI / 2 : 0, axis === "z" ? 0 : 0, 0); }); }; }
function boom(g, size = 1) {
  const b = new THREE.Group(); g.add(b);
  const smoke = glowSprite(0x2a2026, 1, 0, NORM), fire = glowSprite(0xff7a2a, 1, 0), core = glowSprite(0xfff0c0, 1, 0); b.add(smoke, fire, core);
  const L = new THREE.PointLight(0xff8a3a, 0, 18 * size); b.add(L);
  return { b, set(t0, t) { const k = t - t0; const on = k >= 0 && k < 2.6; [smoke, fire, core].forEach((s) => (s.visible = on)); L.intensity = on ? 12 * Math.max(0, 1 - k / 0.9) : 0; if (!on) return; const e = Math.min(1, k / 0.25); core.scale.setScalar((0.5 + e * 3.2) * size); core.material.opacity = Math.max(0, 1 - k / 0.5); fire.scale.setScalar((1 + e * 5 + k) * size); fire.material.opacity = Math.max(0, 0.95 - k / 1.4); smoke.scale.setScalar((2 + k * 3.2) * size); smoke.material.opacity = Math.min(0.7, k * 1.5) * Math.max(0, 1 - k / 2.6); smoke.position.y = k * 1.2 * size; } };
}

// ---------------------------------------------------------------- elenco original (inspirado só no papel de cada um na história)
function ruivo(s = 1.1, o = {}) { return pirata({ scale: s, fat: 1.05, coat: 0x18181e, shirt: 0xeee8dc, pants: 0x3a2a1e, cape: 0x101014, hair: 0xc4261c, hairC: 0xa81e16, oneArm: true, sword: true, collar: false, eyeGlow: 0xff5a3a, ...o }); }
function gemeo(s = 1.1) { return pirata({ scale: s, fat: 1.05, coat: 0xc4c4d2, shirt: 0x2a2a34, pants: 0xa8a8b6, hair: 0xc4261c, hairC: 0xa81e16, sword: true, collar: false, hood: 0xe8e8f0, eyeGlow: 0x9adfff }); }
function menino(s = 0.6) { return pirata({ scale: s, fat: 0.95, coat: 0x3a7a5a, shirt: 0xf2d24a, pants: 0x7a5a32, hair: 0x18141a, hairC: 0x18141a, collar: false }); }
function jovemRuivo(s = 0.62) { return pirata({ scale: s, fat: 0.95, coat: 0x6a4a2a, shirt: 0xf0ece0, pants: 0x2a3a5a, hair: 0xc4261c, hairC: 0xa81e16, hat: "straw", collar: false }); }
function jovemFebre(s = 0.6) { return pirata({ scale: s, fat: 0.95, coat: 0x2a3a6a, shirt: 0xd8d0c0, pants: 0x3a3a44, hat: "bandana", hatC: 0x2a5ad8, collar: false }); }
function velhoRei(s = 1.18) { return pirata({ scale: s, fat: 1.2, coat: 0x1c2c5c, shirt: 0xe8dcc0, pants: 0x2a2a34, hat: "straw", beard: "goatee", beardC: 0x8a8a94, hairC: 0x6a6a72 }); }
function almirante(s = 1.22) { return pirata({ scale: s, fat: 1.1, coat: 0xf0f0f4, shirt: 0x2a5a3a, pants: 0x3a3a44, cape: 0xf4f4f8, hair: 0x1e3a22, hairC: 0x1e3a22, collar: false }); }
function soldado(i) { return pirata({ scale: 0.95, fat: 1.0 + hash(i) * 0.2, coat: 0x2a3040, shirt: 0x8a8a96, pants: 0x22242c, hat: "bandana", hatC: 0x3a3e4a, collar: false }); }
function pSit(p, k = 1) { const u = p.userData; u.legs.forEach((l) => (l.rotation.x = -1.45 * k)); u.body.position.y -= 0.42 * u.s * k; }
function anciao() {
  const g = new THREE.Group(); const robe = new THREE.MeshToonMaterial({ color: 0x15131c, gradientMap: grad });
  ol(mesh(new THREE.CylinderGeometry(0.32, 0.62, 2.3, 18), robe, 0, 1.15, 0, g), 0.015); ol(mesh(sph(0.3, 18, 14), robe, 0, 2.48, -0.02, g), 0.012);
  mesh(cyl(0.34, 0.36, 0.08, 18), M(0xc9a227), 0, 1.5, 0, g); mesh(box(0.08, 1.4, 0.02), M(0xc9a227), 0, 0.75, 0.47, g).rotation.x = -0.12;
  [-1, 1].forEach((k) => { const e = glowSprite(0xfff2d8, 0.12, 0.9); e.position.set(0.1 * k, 2.52, 0.27); g.add(e); });
  return g;
}
function bebe() {
  const g = new THREE.Group();
  mesh(sph(0.22, 16, 12), M(0xf2ece0), 0, 0.1, 0, g).scale.set(1.25, 0.62, 0.95);
  const hd = mesh(sph(0.12, 16, 12), M(SKIN), 0, 0.18, 0.16, g); ol(hd, 0.006);
  mesh(new THREE.ConeGeometry(0.05, 0.1, 8), M(0xc4261c), 0, 0.31, 0.14, g).rotation.x = -0.4;
  mesh(sph(0.07, 10, 8), M(0xc4261c), 0, 0.27, 0.12, g).scale.set(1.3, 0.6, 1);
  [-1, 1].forEach((k) => { mesh(box(0.035, 0.008, 0.01), new THREE.MeshBasicMaterial({ color: 0x2a1a14 }), 0.04 * k, 0.19, 0.275, g); const ck = glowSprite(0xff8a8a, 0.07, 0.6, NORM); ck.position.set(0.065 * k, 0.16, 0.26); g.add(ck); });
  return g;
}
function bau(s = 1) {
  const g = new THREE.Group(); const wood = M(0x7a4a22), gold = M(0xd9b44a);
  ol(mesh(box(0.9 * s, 0.5 * s, 0.56 * s), wood, 0, 0.25 * s, 0, g), 0.01); [-0.3, 0.3].forEach((x) => mesh(box(0.06 * s, 0.52 * s, 0.58 * s), gold, x * s, 0.25 * s, 0, g));
  const lid = new THREE.Group(); lid.position.set(0, 0.5 * s, -0.28 * s); g.add(lid);
  ol(mesh(new THREE.CylinderGeometry(0.28 * s, 0.28 * s, 0.9 * s, 16, 1, false, 0, Math.PI), wood, 0, 0, 0.28 * s, lid), 0.01); lid.children[0].rotation.z = Math.PI / 2;
  mesh(box(0.1 * s, 0.12 * s, 0.04 * s), gold, 0, -0.02 * s, 0.57 * s, lid);
  const gl = glowSprite(0xffc86a, 1.6 * s, 0); gl.position.set(0, 0.55 * s, 0); g.add(gl);
  return { g, lid, gl, open(k) { lid.rotation.x = -1.9 * k; gl.material.opacity = 0.9 * k; } };
}
function mapaTex(xOn = true) {
  return canvasTex(512, 384, (c) => { c.fillStyle = "#e8d4a8"; c.fillRect(0, 0, 512, 384); c.strokeStyle = "#8a6a3a"; c.lineWidth = 6; c.strokeRect(8, 8, 496, 368);
    c.fillStyle = "#b89a62"; [[110, 120, 50], [300, 90, 36], [400, 250, 60], [180, 280, 42]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x, y, r, r * 0.7, 0.3, 0, Math.PI * 2); c.fill(); });
    c.setLineDash([10, 10]); c.strokeStyle = "#6a4a2a"; c.lineWidth = 4; c.beginPath(); c.moveTo(110, 120); c.bezierCurveTo(200, 60, 260, 200, 300, 90); c.bezierCurveTo(360, 150, 330, 300, 400, 250); c.stroke(); c.setLineDash([]);
    if (xOn) { c.strokeStyle = "#c81e1e"; c.lineWidth = 12; c.beginPath(); c.moveTo(380, 230); c.lineTo(420, 270); c.moveTo(420, 230); c.lineTo(380, 270); c.stroke(); } });
}
function dragao() {
  const g = new THREE.Group(); const pts = []; for (let i = 0; i < 14; i++) pts.push(new THREE.Vector3(Math.sin(i * 0.8) * 3.2, i * 1.3, Math.cos(i * 0.6) * 2.2));
  const curve = new THREE.CatmullRomCurve3(pts); const skin = M(0x2a1a3a);
  ol(mesh(new THREE.TubeGeometry(curve, 120, 0.55, 10), skin, 0, 0, 0, g), 0.04);
  const end = pts[pts.length - 1]; const head = new THREE.Group(); head.position.copy(end); g.add(head);
  ol(mesh(box(1.2, 0.9, 1.9), skin, 0, 0, 0.6, head), 0.04); ol(mesh(box(1.0, 0.3, 1.2), skin, 0, -0.5, 0.9, head), 0.03);
  [-1, 1].forEach((k) => { ol(mesh(new THREE.ConeGeometry(0.14, 1.3, 8), M(0xd8c8a0), 0.45 * k, 0.8, -0.1, head), 0.02).rotation.x = -0.5; const e = glowSprite(0xffd23a, 0.5, 0.95); e.position.set(0.45 * k, 0.2, 1.4); head.add(e); });
  return g;
}
function monstro() {
  const g = new THREE.Group(); const skin = M(0x2a6a6a); const pts = [];
  for (let i = 0; i < 6; i++) pts.push(new THREE.Vector3(0, -2 + i * 0.9, Math.sin(i * 0.9) * 0.6));
  ol(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.6, 12), skin, 0, 0, 0, g), 0.03);
  const head = new THREE.Group(); head.position.copy(pts[5]); g.add(head);
  ol(mesh(sph(0.8, 18, 14), skin, 0, 0.2, 0.4, head), 0.03).scale.set(1, 0.75, 1.5);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.15, 0.2); head.add(jaw); ol(mesh(sph(0.62, 14, 10), M(0x3a7a6a), 0, -0.15, 0.5, jaw), 0.02).scale.set(1, 0.4, 1.4);
  for (let i = 0; i < 6; i++) mesh(new THREE.ConeGeometry(0.06, 0.2, 6), M(0xf2efe6), -0.4 + i * 0.16, -0.12, 1.25 - Math.abs(i - 2.5) * 0.08, head).rotation.x = Math.PI;
  [-1, 1].forEach((k) => { const e = glowSprite(0xfff05a, 0.35, 0.95); e.position.set(0.42 * k, 0.55, 0.85); head.add(e); });
  return { g, head, jaw };
}
function ampulheta(s = 1) {
  const g = new THREE.Group(); const wood = M(0x6a4428); const glass = new THREE.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  [0, 2.2].forEach((y) => ol(mesh(cyl(0.75 * s, 0.75 * s, 0.14 * s, 24), wood, 0, y * s, 0, g), 0.01));
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; ol(mesh(cyl(0.05 * s, 0.05 * s, 2.2 * s, 8), wood, Math.cos(a) * 0.62 * s, 1.1 * s, Math.sin(a) * 0.62 * s, g), 0.006); }
  mesh(new THREE.ConeGeometry(0.55 * s, 1.0 * s, 24, 1, true), glass, 0, 1.6 * s, 0, g).rotation.x = Math.PI; mesh(new THREE.ConeGeometry(0.55 * s, 1.0 * s, 24, 1, true), glass, 0, 0.6 * s, 0, g);
  const sandM = M(0xe8c06a); const top = mesh(new THREE.ConeGeometry(0.5 * s, 0.9 * s, 20), sandM, 0, 1.55 * s, 0, g); top.rotation.x = Math.PI;
  const bot = mesh(new THREE.ConeGeometry(0.5 * s, 0.9 * s, 20), sandM, 0, 0.12 * s, 0, g);
  const stream = mesh(cyl(0.02 * s, 0.02 * s, 1.0 * s, 6), sandM, 0, 0.6 * s, 0, g);
  return { g, set(k) { const r = Math.max(0.001, 1 - k); top.scale.set(r, r, r); top.position.y = (1.12 + 0.43 * r) * s; bot.scale.set(Math.max(0.001, k), Math.max(0.001, k), Math.max(0.001, k)); bot.position.y = (0.07 + 0.45 * k) * s; stream.visible = k > 0.01 && k < 0.99; } };
}
function palacio() {
  const g = new THREE.Group(); const rock = M(0x5a4a5a), white = M(0xf2efe6), gold = M(0xe8c46a);
  ol(mesh(new THREE.ConeGeometry(4.2, 5.5, 9), rock, 0, -2.75, 0, g), 0.04).rotation.x = Math.PI;
  ol(mesh(cyl(4.3, 4.3, 0.5, 24), M(0x6a7a4a), 0, 0.25, 0, g), 0.03);
  ol(mesh(box(4.0, 2.2, 2.4), white, 0, 1.6, -0.4, g), 0.03); ol(mesh(new THREE.SphereGeometry(1.05, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, 2.7, -0.4, g), 0.02);
  [[-2.4, -0.4], [2.4, -0.4], [-1.6, 1.4], [1.6, 1.4]].forEach(([x, z]) => { ol(mesh(cyl(0.45, 0.5, 3.4, 14), white, x, 2.0, z, g), 0.02); ol(mesh(new THREE.ConeGeometry(0.62, 1.2, 14), gold, x, 4.3, z, g), 0.02); });
  for (let i = 0; i < 8; i++) mesh(box(0.28, 0.42, 0.05), new THREE.MeshBasicMaterial({ color: 0xffe6a0 }), -1.5 + (i % 4), 1.3 + Math.floor(i / 4) * 0.9, 0.82, g);
  const crest = canvasTex(256, 256, (c) => { c.clearRect(0, 0, 256, 256); c.strokeStyle = "#ffd76a"; c.fillStyle = "#ffd76a"; c.lineWidth = 14; c.beginPath(); c.arc(128, 128, 46, 0, Math.PI * 2); c.stroke();
    [-1, 1].forEach((k) => { c.beginPath(); c.moveTo(128 + 50 * k, 128); c.quadraticCurveTo(128 + 120 * k, 70, 128 + 118 * k, 150); c.quadraticCurveTo(128 + 90 * k, 120, 128 + 50 * k, 140); c.fill(); }); c.beginPath(); c.arc(128, 128, 16, 0, Math.PI * 2); c.fill(); });
  const cr = mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: crest, transparent: true }), 0, 2.0, 0.83, g);
  return g;
}
function carta(keyT) { return mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshBasicMaterial({ map: keyT, side: THREE.DoubleSide })); }
const KEYT = canvasTex(256, 128, (c) => { c.fillStyle = "#14102a"; c.fillRect(0, 0, 256, 128); c.strokeStyle = "#7af0ff"; c.lineWidth = 6; c.strokeRect(6, 6, 244, 116); c.fillStyle = "#ffd27a"; c.font = "700 30px 'Space Mono', monospace"; c.textAlign = "center"; c.fillText("★ KEY ★", 128, 46); c.fillStyle = "#ffffff"; c.font = "700 24px 'Space Mono', monospace"; c.fillText("XXXX-XXXX-XXXX", 128, 90); });
function capeWave(p, t, amt = 1) { const c = p.userData.body.children.find((m) => m.geometry && m.geometry.parameters && m.geometry.parameters.thetaLength === Math.PI * 1.3); if (c) { c.rotation.x = -0.06 * amt - Math.sin(t * 2.3) * 0.04 * amt; c.scale.x = 1 + Math.sin(t * 3.1) * 0.03 * amt; } }
// ---------------------------------------------------------------- cenário
function palmeira(g, x, z, h = 3.2, seed = 1) {
  const p = new THREE.Group(); p.position.set(x, 0, z); g.add(p); const lean = (hash(seed) - 0.5) * 0.5;
  for (let i = 0; i < 6; i++) { const y = (i + 0.5) * h / 6; ol(mesh(cyl(0.11 - i * 0.008, 0.13 - i * 0.008, h / 6 + 0.02, 8), M(0x7a5a3a), lean * y * 0.4, y, 0, p), 0.006); }
  const top = new THREE.Group(); top.position.set(lean * h * 0.4, h, 0); p.add(top);
  for (let i = 0; i < 7; i++) { const lf = mesh(sph(0.5, 10, 6), M(0x2e8a4a), 0, 0, 0, top); lf.scale.set(1.5, 0.08, 0.35); lf.position.set(Math.cos(i * 0.9) * 0.6, -0.1, Math.sin(i * 0.9) * 0.6); lf.rotation.set(0, -i * 0.9, -0.35); }
  return top;
}
function casa(g, x, z, w, h, d, wallC, roofC, seed = 1) {
  const c = new THREE.Group(); c.position.set(x, 0, z); g.add(c);
  ol(mesh(box(w, h, d), M(wallC), 0, h / 2, 0, c), 0.02);
  const rr = d * 0.64, rg = new THREE.CylinderGeometry(rr, rr, w * 1.08, 3); rg.rotateY(Math.PI / 2); rg.rotateZ(Math.PI / 2); // prisma com a quina pra cima
  ol(mesh(rg, M(roofC), 0, h + rr * 0.5, 0, c), 0.02);
  mesh(box(w * 0.22, h * 0.45, 0.04), M(0x5a3a22), -w * 0.2, h * 0.225, d / 2 + 0.01, c);
  mesh(box(w * 0.2, h * 0.22, 0.04), new THREE.MeshBasicMaterial({ color: hash(seed) > 0.5 ? 0xffe2a0 : 0x8ac8e8 }), w * 0.2, h * 0.6, d / 2 + 0.01, c);
  return c;
}
function fogueira(g, x, y, z, s = 1, seed = 1) {
  const f1 = glowSprite(0xff6a1a, 1.4 * s, 0.85), f2 = glowSprite(0xffd06a, 0.7 * s, 0.9); f1.position.set(x, y + 0.4 * s, z); f2.position.set(x, y + 0.3 * s, z); g.add(f1, f2);
  return (t) => { const k = 0.85 + 0.15 * Math.sin(t * 11 + seed) * Math.sin(t * 7.3 + seed * 2); f1.scale.setScalar(1.4 * s * k); f2.scale.setScalar(0.7 * s * (0.9 + 0.1 * Math.sin(t * 17 + seed))); };
}
function gaivotas(g, n, area, seed = 3) {
  const gs = []; for (let i = 0; i < n; i++) { const b = new THREE.Group(); g.add(b); const wm = new THREE.MeshBasicMaterial({ color: 0xf2f2f2, side: THREE.DoubleSide });
    const w1 = mesh(new THREE.PlaneGeometry(0.5, 0.08), wm, -0.25, 0, 0, b), w2 = mesh(new THREE.PlaneGeometry(0.5, 0.08), wm, 0.25, 0, 0, b); gs.push({ b, w1, w2 }); }
  return (t) => gs.forEach((o, i) => { const ph = t * 0.12 + hash(i + seed); const x = area[0] + ((ph * (area[1] - area[0])) % (area[1] - area[0]));
    o.b.position.set(x, area[2] + hash(i + seed + 5) * (area[3] - area[2]) + Math.sin(t * 2 + i) * 0.3, area[4] + hash(i + seed + 9) * (area[5] - area[4]));
    const f = Math.sin(t * 9 + i * 1.7) * 0.6; o.w1.rotation.z = f; o.w2.rotation.z = -f; o.w1.position.x = -0.25 * Math.cos(f); o.w2.position.x = 0.25 * Math.cos(f); o.w1.position.y = 0.25 * Math.sin(f); o.w2.position.y = 0.25 * Math.sin(f); });
}
function raios(g, n, col = 0xff2a1a) {
  const lines = []; for (let i = 0; i < n; i++) { const pos = new Float32Array(8 * 3); const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: i % 2 ? 0x120208 : col, transparent: true, opacity: 0.95 })); ln.frustumCulled = false; g.add(ln); lines.push({ ln, pos, geo }); }
  return (t, c, k, r = 1.6) => lines.forEach((o, i) => { o.ln.visible = k > 0.02; if (!o.ln.visible) return; const f = Math.floor(t * 18) + i * 13; const a0 = hash(f) * Math.PI * 2;
    for (let j = 0; j < 8; j++) { const rr = 0.3 + (j / 7) * r * (0.6 + 0.4 * hash(f + j)); const a = a0 + (hash(f + j * 3) - 0.5) * 0.7; o.pos[j * 3] = c.x + Math.cos(a) * rr; o.pos[j * 3 + 1] = c.y + (hash(f + j * 5) - 0.3) * 1.4; o.pos[j * 3 + 2] = c.z + Math.sin(a) * rr; }
    o.geo.attributes.position.needsUpdate = true; o.ln.material.opacity = 0.95 * k; });
}

// 1 · gancho: o capitão ruivo na proa; mais de 20 anos sem ir atrás do tesouro
addSet("s1-gancho", (g) => {
  const sk = skyDome(g, [[0, "#2a1a4a"], [0.55, "#ff7a4a"], [1, "#ffd08a"]], { stars: 160 });
  const night = plane(220, 100, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#04040c"], [1, "#1a1a3a"]]), fog: false, transparent: true, opacity: 0 })); night.position.set(0, 26, -79); g.add(night);
  const sun = glowSprite(0xffc86a, 16, 0.85); sun.material.fog = false; g.add(sun);
  const moon = glowSprite(0xe8eeff, 6, 0); moon.material.fog = false; g.add(moon);
  const seaU = seaPlane(g, 0x1a2a4a);
  for (let i = 0; i < 5; i++) { const isl = mesh(new THREE.ConeGeometry(4 + hash(i) * 5, 2 + hash(i + 1) * 3, 7), M(0x2a1e3a), -50 + i * 26 + hash(i + 2) * 8, 0, -60 - hash(i + 3) * 10, g); isl.scale.y = 0.6; }
  const clouds = []; for (let i = 0; i < 8; i++) { const c = glowSprite(0xffb08a, 10 + hash(i) * 8, 0.35, NORM); c.material.fog = false; c.position.set(-60 + i * 17, 18 + hash(i + 4) * 10, -75); g.add(c); clouds.push(c); }
  const S = ship(g); S.sh.rotation.y = Math.PI;
  const cap = ruivo(); g.add(cap);
  const barril = mesh(cyl(0.3, 0.3, 0.75, 14), M(0x6a4428), 0, 0, 0, g); ol(barril, 0.01);
  const texX = mapaTex(true), texNo = mapaTex(false);
  const mapM = new THREE.MeshBasicMaterial({ map: texX }); const mapa = mesh(new THREE.PlaneGeometry(0.8, 0.6), mapM, 0, 0, 0, g);
  const xg = glowSprite(0xff3a2a, 0.45, 0.8); g.add(xg);
  const xt = holoText("X", 0xff3a2a, 0.6, 0.3); g.add(xt);
  const v = new THREE.Vector3();
  return {
    bg: 0x2a1a3a, fog: [30, 120],
    update(t) {
      const s = T.sc["s1-gancho"];
      seaU(t); S.upd(t); const y0 = S.sh.position.y + 1.15;
      const tl = seg(t, K.vinte - 0.2, K.porque0), cyc = tl * 3, dayK = 0.5 + 0.5 * Math.cos(cyc * Math.PI * 2), ph = cyc % 1;
      night.material.opacity = 1 - dayK; sun.position.set(-40 + ph * 80, 4 + Math.sin(ph * Math.PI) * 22, -76); sun.material.opacity = 0.85 * dayK;
      moon.position.set(40 - ph * 80, 6 + Math.sin(ph * Math.PI) * 18, -76); moon.material.opacity = 0.8 * (1 - dayK); sk.st.material.opacity = 0.15 + 0.75 * (1 - dayK);
      clouds.forEach((c, i) => (c.position.x = -60 + i * 17 + ((t * 0.6 + tl * 40) % 17)));
      cap.position.set(0.3, y0, 3.6); cap.rotation.y = 0.35; pReset(cap); pIdle(cap, t); capeWave(cap, t, 1 + tl * 2);
      cap.userData.head.rotation.y = 0.28 * sm(seg(t, K.fica - 0.3, K.fica + 0.3)); cap.userData.head.rotation.x = 0.18 * (1 - sm(seg(t, K.porque0 - 0.4, K.porque0)));
      pEyesGlow(cap, sm(seg(t, K.estranha - 0.4, K.estranha + 0.1)));
      barril.position.set(-0.55, y0 + 0.375, 4.25); mapa.position.set(-0.55, y0 + 0.77, 4.25); mapa.rotation.set(-Math.PI / 2 + 0.35, 0, 0.25);
      mapM.map = t < K.nunca0 + 0.25 ? texX : texNo;
      mapa.updateMatrixWorld(); mapa.localToWorld(v.set(0.225, -0.09, 0.03));
      const off = sm(seg(t, K.nunca0 - 0.1, K.nunca0 + 0.5));
      xg.position.copy(v); xg.material.opacity = 0.8 * (0.75 + 0.25 * Math.sin(t * 6)) * (1 - off);
      const up = seg(t, K.nunca0, K.nunca0 + 1.4); xt.position.set(v.x, v.y + 0.1 + up * 0.9, v.z); xt.visible = up > 0 && up < 1; xt.material.opacity = 1 - up; xt.lookAt(camera.position);
    },
    cam(t) { const s = T.sc["s1-gancho"]; return keys(t, [[0, [9, 5.5, 15], [0, 2.8, 2]], [K.rei, [5.5, 4.0, 10.5], [0.2, 2.95, 3.4]], [K.vinte - 0.3, [3.8, 3.3, 9.2], [0, 2.8, 3.8]], [K.porque0, [2.2, 3.1, 7.2], [0.1, 3.0, 3.7]], [K.fica, [1.4, 3.05, 6.3], [0.2, 3.12, 3.6]], [s[1], [1.2, 3.0, 5.9], [0.22, 3.18, 3.6]]]); },
  };
});

// 2 · medo? não: ele encerra uma guerra só chegando e um almirante recua
addSet("s2-medo", (g) => {
  skyDome(g, [[0, "#1a0a0a"], [0.6, "#4a1a12"], [1, "#a0401a"]], { stars: 40 });
  g.add(floorP(120, 120, M(0xffffff, { map: rep(stoneTex("#5a5450", "#4e4844", "#221e1c"), 30, 30) })));
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = 9 + hash(i) * 7; const h = 1 + hash(i + 2) * 4; ol(mesh(box(1.5 + hash(i + 3) * 2.5, h, 1.0), M(0x4a4240), Math.cos(a) * r, h / 2, Math.sin(a) * r, g), 0.02); }
  for (let i = 0; i < 12; i++) rockAt(g, (hash(i + 20) - 0.5) * 16, 0.15, (hash(i + 21) - 0.5) * 16, 0.15 + hash(i + 22) * 0.4, i + 20, 0x4a4240);
  const fires = []; for (let i = 0; i < 7; i++) { const a = hash(i + 30) * Math.PI * 2, r = 6 + hash(i + 31) * 6; fires.push(fogueira(g, Math.cos(a) * r, 0, Math.sin(a) * r, 1.4 + hash(i + 32), i)); }
  const smokes = []; for (let i = 0; i < 10; i++) { const s2 = glowSprite(0x2a2224, 6, 0.4, NORM); g.add(s2); smokes.push(s2); }
  const booms = [boom(g, 1.3), boom(g, 1.1)];
  const cap = ruivo(); g.add(cap);
  const adm = almirante(); g.add(adm);
  const sold = []; for (let i = 0; i < 5; i++) { const p = soldado(i); g.add(p); const bl = mesh(box(0.05, 0.85, 0.015), M(0xcfd6e2), 0, 0, 0, g); ol(bl, 0.004); sold.push({ p, bl, x: -2.6 + i * 1.3 + hash(i) * 0.4, z: -3.9 - hash(i + 1) * 1.8 }); }
  const rings = quakeRings(g, 0xff3a2a); const zap = raios(g, 6);
  const aura = glowSprite(0xff2a1a, 3.2, 0); g.add(aura);
  const sweat = []; for (let i = 0; i < 3; i++) { const d = glowSprite(0x9adfff, 0.07, 0); g.add(d); sweat.push(d); }
  const v = new THREE.Vector3();
  return {
    bg: 0x1a0a0a, fog: [12, 55],
    update(t) {
      const s = T.sc["s2-medo"];
      fires.forEach((f) => f(t));
      smokes.forEach((s2, i) => { const ph = (t * 0.06 + hash(i)) % 1; s2.position.set((hash(i + 40) - 0.5) * 24, 1 + ph * 12, -8 + (hash(i + 41) - 0.5) * 20); s2.material.opacity = 0.45 * Math.sin(ph * Math.PI); });
      booms[0].b.position.set(-6, 0.5, 7); booms[0].set(s[0] + 0.2, t); booms[1].b.position.set(7, 0.5, 6); booms[1].set(s[0] + 1.2, t);
      const wk = sm(seg(t, s[0], K.imperador - 0.2));
      cap.position.set(-0.3, 0, lerp(3.2, 0.45, wk)); cap.rotation.y = Math.PI; pReset(cap); pIdle(cap, t); capeWave(cap, t, 1.3); if (wk > 0 && wk < 1) pWalk(cap, t, 0.8);
      const pw = sm(seg(t, K.guerra - 0.2, K.guerra + 0.3)) * (1 - sm(seg(t, K.encostar, K.encostar + 0.6)));
      cap.userData.arms[0].rotation.x = -1.35 * pw; pEyesGlow(cap, Math.max(pw, sm(seg(t, K.imperador - 0.2, K.imperador + 0.2)) * (1 - sm(seg(t, K.guerra + 1.5, K.almirante)))));
      aura.position.set(-0.3, 1.2, 0.45); aura.material.opacity = 0.55 * Math.max(pw, 0.5 * sm(seg(t, K.imperador - 0.2, K.imperador + 0.3)));
      rings(t, v.set(-0.3, 0.06, 0.45), pw, "y"); zap(t, v.set(-0.3, 1.3, 0.45), pw * (1 - seg(t, K.guerra + 1.3, K.guerra + 1.8)));
      sold.forEach((o, i) => { const p = o.p, d = K.aparecendo + i * 0.09; p.position.set(o.x, 0, o.z); p.rotation.y = Math.atan2(-0.3 - o.x, 0.45 - o.z); pReset(p); pIdle(p, t, i);
        const kn = sm(seg(t, d + 0.2, d + 0.7)); p.userData.body.position.y = -0.32 * kn; p.userData.body.rotation.x = -0.25 * kn; p.userData.legs.forEach((l) => (l.rotation.x = 0.9 * kn));
        p.userData.arms[0].rotation.x = -0.9 * (1 - kn); p.updateMatrixWorld(); p.userData.arms[0].children[1].getWorldPosition(v);
        const dr = seg(t, d, d + 0.45); o.bl.position.set(v.x + dr * 0.3, lerp(v.y + 0.38, 0.03, dr * dr), v.z + dr * 0.2); o.bl.rotation.set(dr * 1.2, 0, dr * Math.PI / 2); });
      const bk = sm(seg(t, K.recuar - 0.1, K.encostar + 0.6)), ain = sm(seg(t, K.almirante - 1.3, K.almirante - 0.2));
      adm.position.set(lerp(3.8, 0.45, ain) + 0.2 * bk, 0, lerp(-0.85, -1.55, bk)); adm.rotation.y = lerp(-Math.PI / 2, 0, sm(seg(t, K.almirante - 0.4, K.almirante))); pReset(adm); pIdle(adm, t, 3); if ((ain > 0.02 && ain < 0.98) || (bk > 0.02 && bk < 0.98)) pWalk(adm, bk > 0.02 ? -t : t, 0.6);
      adm.userData.arms.forEach((a, i) => (a.rotation.x = -0.7 * bk)); adm.userData.eyes.forEach((e) => e.e.scale.set(1 + 0.3 * bk, 1 + 0.3 * bk, 1)); adm.userData.brows.forEach((b, i) => (b.rotation.z = (i ? -1 : 1) * 0.35 * bk));
      adm.updateMatrixWorld(); adm.userData.head.getWorldPosition(v);
      sweat.forEach((d, i) => { const ph = (t * 0.9 + i / 3) % 1; d.position.set(v.x + (i - 1) * 0.16, v.y + 0.12 - ph * 0.3, v.z + 0.25); d.material.opacity = 0.9 * bk * (1 - ph); });
    },
    cam(t) { const s = T.sc["s2-medo"]; const c = keys(t, [[s[0], [-0.1, 2.25, -1.8], [-0.3, 2.15, 2.6]], [K.imperador, [-0.15, 2.2, -1.3], [-0.3, 2.2, 2.4]], [K.guerra - 0.1, [3.6, 6.4, 5.8], [-0.2, 0.9, -1.4]], [K.almirante - 0.5, [3.4, 6.0, 5.4], [-0.1, 1.0, -1.4]], [K.almirante + 0.1, [7.6, 2.4, -0.45], [0.2, 1.85, -0.45]], [s[1], [7.4, 2.35, -0.5], [0.25, 1.85, -0.5]]]);
      return shakeCam(c, t, t > K.guerra && t < K.guerra + 0.7 ? 0.06 : 0); },
  };
});

// 3 · já sabia o caminho? não: ficou na cabine cuidando do amigo com febre
addSet("s3-caminho", (g) => {
  const wallM = new THREE.MeshToonMaterial({ map: rep(planks("#6a4a2c", "#5e4026"), 3, 1), gradientMap: grad, side: THREE.DoubleSide });
  const WX = 2.6, HY = 3.0, Z0 = -2.5, hx = 0.9, hy = 1.95, hs = 0.38;
  const wall = (w, h, x, y, z, ry = 0) => { const m = mesh(new THREE.PlaneGeometry(w, h), wallM, x, y, z, g); m.rotation.y = ry; return m; };
  wall(WX + hx - hs, HY, (-WX + hx - hs) / 2, HY / 2, Z0); wall(WX - hx - hs, HY, (hx + hs + WX) / 2, HY / 2, Z0);
  wall(2 * hs, HY - hy - hs, hx, (hy + hs + HY) / 2, Z0); wall(2 * hs, hy - hs, hx, (hy - hs) / 2, Z0);
  wall(6, HY, -WX, HY / 2, 0.5, Math.PI / 2); wall(6, HY, WX, HY / 2, 0.5, -Math.PI / 2);
  g.add(floorP(5.2, 6, M(0xffffff, { map: rep(planks("#4a3420", "#3e2c1a"), 4, 4) }), 0)); const ceil = floorP(5.2, 6, wallM, HY); ceil.position.z = 0.5; g.add(ceil);
  for (let i = 0; i < 4; i++) ol(mesh(box(5.2, 0.16, 0.18), M(0x3a2414), 0, HY - 0.08, -2 + i * 1.3, g), 0.01);
  mesh(new THREE.RingGeometry(hs - 0.02, 0.62, 40), M(0xb8862a), hx, hy, Z0 + 0.02, g); const tor = mesh(new THREE.TorusGeometry(0.5, 0.07, 10, 40), M(0xd8a83a), hx, hy, Z0 + 0.05, g); ol(tor, 0.01);
  // lá fora: noite de chuva, o navio grande indo embora rumo à ilha que brilha
  const out = new THREE.Group(); out.position.y = -1.4; g.add(out);
  skyDome(out, [[0, "#04040c"], [1, "#16183a"]], { stars: 260 });
  const seaO = seaPlane(out, 0x0a1428, 160, 60);
  const big = ship(out, { sail: 0xe8e0c8 }); big.sh.scale.setScalar(1.15);
  const isl = mesh(new THREE.ConeGeometry(6, 3, 8), M(0x1a1426), -10, 0.6, -70, out); isl.scale.y = 0.5;
  const ig = glowSprite(0xffd06a, 22, 0.75); ig.material.fog = false; ig.position.set(-10, 3, -69); out.add(ig);
  const rainO = rain(out, 140, [-5, 7, 0, 7, -9, -3], 4);
  // dentro: beliche sob a escotilha, o amigo com febre e o menino ruivo cuidando
  ol(mesh(box(2.4, 0.5, 1.0), M(0x5a3a20), 0.7, 0.25, -1.95, g), 0.015); mesh(box(2.3, 0.16, 0.92), M(0xe8e2d4), 0.7, 0.58, -1.95, g);
  mesh(box(0.5, 0.14, 0.6), M(0xf2efe8), 1.08, 0.72, -1.95, g);
  const kidW = new THREE.Group(); kidW.position.set(-0.25, 0.68, -1.95); kidW.rotation.y = -Math.PI / 2; g.add(kidW);
  const kid = jovemFebre(); kid.rotation.x = -Math.PI / 2; kidW.add(kid);
  mesh(box(0.95, 0.07, 0.62), M(0x7a2a2a), 0.12, 0.8, -1.95, g);
  const ks = kid.userData.s; mesh(box(0.22 * ks, 0.05 * ks, 0.12 * ks), M(0xf4f4f4), 0, 0.15 * ks, 0.16 * ks, kid.userData.head).rotation.x = -0.6;
  [-1, 1].forEach((k) => { const ck = glowSprite(0xff4a4a, 0.09, 0.6, NORM); ck.position.set(0.12 * k * ks, -0.03 * ks, 0.21 * ks); kid.userData.head.add(ck); });
  const drops = []; for (let i = 0; i < 2; i++) { const d = glowSprite(0x9adfff, 0.05, 0); kid.userData.head.add(d); drops.push(d); }
  const red = jovemRuivo(); g.add(red);
  const balde = mesh(cyl(0.18, 0.15, 0.3, 14), M(0x6a5a4a), 2.0, 0.15, -1.0, g); ol(balde, 0.01);
  const lamp = new THREE.Group(); g.add(lamp); mesh(cyl(0.01, 0.01, 0.5, 4), M(0x222222), 0, -0.25, 0, lamp);
  ol(mesh(box(0.18, 0.26, 0.18), M(0x2a2a2a), 0, -0.6, 0, lamp), 0.006); const lg = glowSprite(0xffc070, 0.8, 0.85); lg.position.set(0, -0.6, 0); lamp.add(lg);
  const L = new THREE.PointLight(0xffb36b, 7, 8); L.position.set(0, -0.62, 0); lamp.add(L);
  return {
    bg: 0x0a0a14, fog: [16, 90],
    update(t) {
      const s = T.sc["s3-caminho"];
      seaO(t); rainO(t);
      const go = seg(t, K.viagem - 1.0, s[1]); big.sh.position.set(lerp(5, -3, go), Math.sin(t * 0.9) * 0.12, lerp(-16, -40, go)); big.upd(t); big.sh.position.y = Math.sin(t * 0.9) * 0.12;
      lamp.position.set(0.4, HY, -0.4); lamp.rotation.z = Math.sin(t * 1.3) * 0.18; lamp.rotation.x = Math.sin(t * 0.9) * 0.08;
      pReset(kid); kid.userData.body.rotation.z = Math.sin(t * 38) * 0.012; kid.userData.eyes.forEach((e) => (e.e.scale.y = 0.15)); kid.userData.smile.rotation.z = 0;
      drops.forEach((d, i) => { const ph = (t * 0.5 + i * 0.5) % 1; d.position.set((i ? 0.12 : -0.1) * ks, (0.1 - ph * 0.25) * ks, 0.2 * ks); d.material.opacity = 0.9 * Math.sin(ph * Math.PI); });
      red.position.set(1.5, 0, -1.12); red.rotation.y = -2.46; pReset(red); pIdle(red, t, 1);
      const look = sm(seg(t, K.viagem - 0.4, K.viagem + 0.3)) * (1 - sm(seg(t, K.buggy - 0.3, K.buggy + 0.2))) + sm(seg(t, K.nunca2 - 0.6, K.nunca2));
      red.userData.head.rotation.set(-0.5 * look, -0.3 * look, 0);
      const care = sm(seg(t, K.ficou - 0.2, K.ficou + 0.4)) * (1 - sm(seg(t, K.nunca2 - 0.6, K.nunca2)));
      red.userData.arms[0].rotation.x = -1.1 * care; red.userData.arms[1].rotation.x = -0.7 * care; red.userData.body.rotation.x = 0.22 * care;
      red.userData.brows.forEach((b, i) => (b.rotation.z = (i ? -1 : 1) * 0.25));
    },
    cam(t) { const s = T.sc["s3-caminho"]; return keys(t, [[s[0], [1.0, 1.55, 2.4], [0.85, 1.0, -1.7]], [K.viagem - 0.3, [1.1, 1.9, 1.2], [0.9, 1.9, -2.5]], [K.viagem + 1.3, [0.95, 1.94, -1.35], [0.88, 1.9, -6.0]], [K.buggy + 0.2, [1.0, 1.5, 2.2], [0.85, 0.95, -1.75]], [K.cuidando + 0.3, [0.8, 1.4, 1.8], [0.9, 0.95, -1.7]], [K.nunca2 - 0.1, [2.2, 1.5, 1.0], [0.9, 1.6, -2.4]], [s[1], [2.3, 1.45, 1.1], [0.9, 1.65, -2.4]]]); },
  };
});

// 4 · trabalha pro governo? não: quem visitou os anciões era o irmão gêmeo
addSet("s4-governo", (g) => {
  g.add(floorP(40, 40, M(0xffffff, { map: rep(stoneTex("#4a4452", "#3e3946", "#24202a"), 12, 12) })));
  const carpet = floorP(2.0, 22, M(0x8a1a22), 0.01); carpet.position.z = -3; g.add(carpet);
  for (let i = 0; i < 6; i++) [-1, 1].forEach((k) => { const z = 4 - i * 2.6; ol(mesh(cyl(0.38, 0.42, 7, 16), M(0x8a8494), 2.6 * k, 3.5, z, g), 0.02); mesh(box(1.0, 0.3, 1.0), M(0xc9a227), 2.6 * k, 7.0, z, g); mesh(box(1.0, 0.3, 1.0), M(0x6a6474), 2.6 * k, 0.15, z, g); });
  const teto = floorP(40, 40, M(0x3a3448), 7.2); teto.rotation.x = Math.PI / 2; g.add(teto);
  const back = mesh(new THREE.PlaneGeometry(14, 9), M(0x3a3444), 0, 4.5, -11, g);
  ol(mesh(box(6.5, 0.6, 2.6), M(0x6a5a4a), 0, 0.3, -9.2, g), 0.02); ol(mesh(box(5.5, 0.4, 2.0), M(0x8a7458), 0, 0.8, -9.4, g), 0.02);
  const crest = canvasTex(256, 384, (c) => { c.fillStyle = "#6a0e18"; c.fillRect(0, 0, 256, 384); c.strokeStyle = "#ffd76a"; c.fillStyle = "#ffd76a"; c.lineWidth = 12; c.beginPath(); c.arc(128, 170, 46, 0, Math.PI * 2); c.stroke();
    [-1, 1].forEach((k) => { c.beginPath(); c.moveTo(128 + 50 * k, 170); c.quadraticCurveTo(128 + 120 * k, 110, 128 + 116 * k, 190); c.quadraticCurveTo(128 + 90 * k, 160, 128 + 50 * k, 182); c.fill(); }); c.beginPath(); c.arc(128, 170, 14, 0, Math.PI * 2); c.fill(); c.fillRect(0, 352, 256, 10); });
  [-3.8, 3.8].forEach((x) => mesh(new THREE.PlaneGeometry(1.8, 2.7), new THREE.MeshBasicMaterial({ map: crest }), x, 4.4, -10.9, g));
  const eld = []; for (let i = 0; i < 5; i++) { const e = anciao(); e.position.set(-2.2 + i * 1.1, 1.0, -9.5 - Math.abs(i - 2) * 0.15); e.scale.setScalar(1.1); g.add(e); eld.push(e); }
  for (let i = 0; i < 4; i++) { const sh = glowPlane(0xfff2c8, 1.2, 9, 0.12); sh.rotation.set(0, 0, 0.35); sh.position.set(-3 + i * 2, 4, -4 - i * 1.5); g.add(sh); }
  g.add(dustPts(260, [-4, 4, 0.3, 6.5, -10, 4], 0xfff2c8, 0.04, 0.6, ADD, 3));
  const tw = gemeo(); g.add(tw);
  const red = ruivo(); g.add(red);
  const flash = glowSprite(0xff4a3a, 2.4, 0); g.add(flash);
  return {
    bg: 0x16121c, fog: [16, 55],
    update(t) {
      const s = T.sc["s4-governo"];
      eld.forEach((e, i) => { e.rotation.y = Math.sin(t * 0.4 + i) * 0.05; });
      const wk = seg(t, s[0] + 0.3, K.autor - 0.2); const z = lerp(3.0, -3.0, sm(wk));
      tw.position.set(0, 0, z); tw.rotation.y = Math.PI; pReset(tw); pIdle(tw, t, 2); capeWave(tw, t);
      if (wk > 0 && wk < 1) pWalk(tw, t, 0.7);
      const off = sm(seg(t, K.naoera - 0.2, K.naoera + 0.45)); tw.userData.hood.rotation.x = -1.7 * off; tw.userData.hood.position.set(0, 0.04 * off, -0.1 * off);
      tw.userData.hoodSh.visible = false; // rosto igualzinho à mostra, como diz a narração tw.userData.hood.visible = off < 0.98;
      pEyesGlow(tw, sm(seg(t, K.shamrock - 0.2, K.shamrock + 0.3)));
      const inn = sm(seg(t, K.irmao - 1.0, K.irmao + 0.1)); red.position.set(lerp(3.4, 0.82, inn), 0, -3.15); red.rotation.y = lerp(-Math.PI / 2, -Math.PI + 0.2, sm(seg(t, K.irmao - 0.1, K.irmao + 0.4)));
      red.visible = inn > 0.01; pReset(red); pIdle(red, t); capeWave(red, t); if (inn > 0.02 && inn < 0.98) pWalk(red, t, 0.8);
      flash.position.set(0.82, 1.9, -3.1); flash.material.opacity = 0.7 * Math.max(0, 1 - Math.abs(t - (K.irmao + 0.05)) / 0.3);
    },
    cam(t) { const s = T.sc["s4-governo"]; const tz = lerp(3.0, -3.0, sm(seg(t, s[0] + 0.3, K.autor - 0.2)));
      const fp = [0.8, 2.1, tz - 3.6], fl = [0, 1.75, tz + 0.4]; // de frente pro homem de capuz, recuando
      const hp = [0.2, 5.6, tz + 5.2], hl = [0, 1.4, -8.5]; // do alto, por trás dele, até os anciões
      if (t < K.homem - 0.6) return keys(t, [[s[0], [0.4, 3.2, -7.0], [0, 2.0, 3.0]], [K.homem - 0.6, fp, fl]]);
      if (t < K.visitou - 0.3) return { pos: fp, look: fl };
      if (t < K.visitou - 0.29) return keys(t, [[K.visitou - 0.3, fp, fl], [K.visitou - 0.29, hp, hl]]);
      return keys(t, [[K.visitou - 0.29, hp, hl], [K.autor - 0.3, [0.2, 5.0, tz + 4.4], [0, 1.6, -8.5]], [K.autor + 0.2, [0.4, 2.05, -6.0], [0, 1.95, -2.6]], [K.irmao + 0.2, [0.45, 2.0, -7.9], [0.4, 1.95, -3.1]], [s[1], [0.45, 2.0, -7.7], [0.4, 1.95, -3.1]]]); },
  };
});

// 5 · rapidinho: keys da Steam na bio, numa caverna do tesouro
addSet("s5-keys", (g) => {
  g.add(floorP(60, 60, M(0x3a2e26)));
  mesh(sph(15, 24, 14), new THREE.MeshToonMaterial({ color: 0x1e1820, gradientMap: grad, side: THREE.BackSide }), 0, 0, -2, g);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; rockAt(g, Math.cos(a) * (6 + hash(i) * 3), 1 + hash(i + 1) * 3, Math.sin(a) * (6 + hash(i) * 3) - 2, 1.5 + hash(i + 2) * 2, i, 0x3a3038); }
  const gold = M(0xe0b84a); mesh(sph(2.2, 24, 14), gold, 0, -1.25, -1.7, g).scale.set(1.5, 0.78, 1.0);
  for (let i = 0; i < 70; i++) { const a = hash(i) * Math.PI * 2, r = hash(i + 1) * 2.6; const c = mesh(cyl(0.09, 0.09, 0.02, 12), gold, Math.cos(a) * r * 1.4, 0.02 + Math.max(0, 0.45 - r * 0.17), -1.7 + Math.sin(a) * r * 0.9, g); c.rotation.set(hash(i + 2) * 3, hash(i + 3) * 3, hash(i + 4) * 3); }
  const b1 = bau(1.0); b1.g.position.set(1.7, 0, -0.5); b1.g.rotation.y = -0.5; g.add(b1.g); b1.open(1);
  const b2 = bau(0.8); b2.g.position.set(-1.9, 0, -1.0); b2.g.rotation.y = 0.6; g.add(b2.g);
  const fx = [fogueira(g, -3.2, 2.0, -3.2, 1.0, 1), fogueira(g, 3.4, 2.0, -3.0, 1.0, 2)];
  [[-3.2, -3.2], [3.4, -3.0]].forEach(([x, z]) => ol(mesh(cyl(0.05, 0.07, 2.0, 6), M(0x3a2414), x, 1.0, z, g), 0.005));
  const L = new THREE.PointLight(0xffb05a, 9, 14); L.position.set(0, 3, 1); g.add(L);
  g.add(dustPts(300, [-6, 6, 0.2, 5, -6, 2], 0xffe08a, 0.05, 0.8, ADD, 5));
  const cap = ruivo(); g.add(cap);
  const cards = []; for (let i = 0; i < 8; i++) { const c = carta(KEYT); g.add(c); cards.push(c); }
  const coins = []; for (let i = 0; i < 14; i++) { const c = mesh(cyl(0.08, 0.08, 0.015, 16), gold, 0, 0, 0, g); c.rotation.x = Math.PI / 2; coins.push(c); }
  return {
    bg: 0x140e14, fog: [10, 40],
    update(t) {
      fx.forEach((f) => f(t));
      cap.position.set(0, 0.42, -1.2); cap.rotation.y = 0; pReset(cap); pSit(cap, 1); pIdle(cap, t); capeWave(cap, t, 0.6);
      const pt = sm(seg(t, K.bio - 0.5, K.bio)); cap.userData.arms[0].rotation.set(-2.6 * pt, 0, -0.12); pLaugh(cap, t, sm(seg(t, K.steam - 0.2, K.steam + 0.3)) * (1 - pt) * 0.6);
      cap.userData.eyes.forEach((e, i) => (e.e.scale.y = i === 1 && Math.abs(t - (K.bio + 0.25)) < 0.25 ? 0.1 : e.e.scale.y));
      cards.forEach((c, i) => { const a = t * 0.8 + i * 0.8; c.position.set(Math.cos(a) * 1.6, 1.5 + Math.sin(t * 1.3 + i) * 0.35 + (i % 3) * 0.35, -1.0 + Math.sin(a) * 1.0); c.rotation.set(Math.sin(t + i) * 0.3, -a + Math.PI / 2, 0); });
      coins.forEach((c, i) => { const ph = ((t - K.steam) * 0.8 + hash(i)) % 1; c.visible = t > K.steam - 0.1; c.position.set((hash(i + 3) - 0.5) * 3, 4 - ph * 4.5, -0.6 + (hash(i + 4) - 0.5) * 1.5); c.rotation.set(Math.PI / 2 + t * 6 + i, t * 3, 0); });
    },
    cam(t) { const s = T.sc["s5-keys"]; return keys(t, [[s[0], [0, 2.0, 4.6], [0, 1.55, -1.0]], [s[1], [0, 1.9, 3.9], [0, 1.55, -1.0]]]); },
  };
});

// 6 · pista 1: o velho rei chega na ilha final, ri… e diz que chegaram cedo demais
addSet("s6-pista1", (g) => {
  skyDome(g, [[0, "#3a1a5a"], [0.5, "#ff8a6a"], [1, "#ffe0a0"]], { stars: 60 });
  const seaU = seaPlane(g, 0x1e5a7a);
  mesh(new THREE.CylinderGeometry(16, 18, 1.2, 48), M(0xf0dca8), 0, -0.55, -6, g);
  ol(mesh(new THREE.TorusGeometry(3.2, 0.7, 10, 24, Math.PI), M(0x8a7a6a), -6, 0, -13, g), 0.03);
  const arc2 = mesh(new THREE.TorusGeometry(2.4, 0.55, 10, 24, Math.PI), M(0x7a6a5e), 6.5, 0, -15, g); arc2.rotation.y = 0.6; ol(arc2, 0.03);
  [[-3.2, -8.5, 4.5], [3.6, -9.5, 3.2], [-1.4, -12, 6.2], [2.0, -13, 5.0]].forEach(([x, z, h], i) => { ol(mesh(cyl(0.55, 0.65, h, 12), M(0xb8a888), x, h / 2, z, g), 0.02); mesh(box(1.6, 0.35, 1.6), M(0xa89878), x, h + 0.17, z, g).rotation.y = i; });
  const tops = [[-7, -2], [-8.5, 2.5], [7.5, -1], [8.2, 3.2], [-5, -6]].map(([x, z], i) => palmeira(g, x, z, 3 + hash(i) * 1.2, i));
  const beam = mesh(cyl(1.4, 2.0, 40, 24, 1, true), glowM(0xffd06a, 0.22), 0, 20, -11, g); const bg2 = glowSprite(0xffd06a, 12, 0.6); bg2.position.set(0, 2.5, -11); g.add(bg2);
  g.add(dustPts(200, [-6, 6, 0.5, 9, -14, -6], 0xffe8a0, 0.08, 0.8, ADD, 8));
  const gulls = gaivotas(g, 5, [-14, 14, 7, 11, -16, -6], 2);
  const crew = [pirata({ scale: 1.05, coat: 0x3a2a22, shirt: 0xd8c8a0, hat: "bandana", hatC: 0x2a6a3a }), pirata({ scale: 1.0, fat: 1.2, coat: 0x2a2a3a, shirt: 0xe8e0d0, hat: "captain", hatC: 0x2a2a30 })];
  crew.forEach((c) => g.add(c));
  const king = velhoRei(); g.add(king);
  const amp = ampulheta(0.6); g.add(amp.g);
  return {
    bg: 0x3a2a4a, fog: [24, 90],
    update(t) {
      const s = T.sc["s6-pista1"]; seaU(t); gulls(t);
      tops.forEach((tp, i) => (tp.rotation.z = Math.sin(t * 1.2 + i) * 0.05));
      beam.material.opacity = 0.2 + 0.05 * Math.sin(t * 3); bg2.material.opacity = 0.55 + 0.1 * Math.sin(t * 2.3);
      const wk = sm(seg(t, s[0], K.riu - 0.4)); king.position.set(0, 0.05, lerp(3.2, 0.4, wk)); king.rotation.y = lerp(Math.PI, Math.PI - 0.1, wk); pReset(king); pIdle(king, t);
      const turn = sm(seg(t, K.riu - 0.5, K.riu)); king.rotation.y = lerp(king.rotation.y, 0.25, turn); if (wk > 0 && wk < 1) pWalk(king, t, 0.7);
      pLaugh(king, t, sm(seg(t, K.riu - 0.2, K.riu + 0.2)) * (1 - 0.6 * sm(seg(t, K.cedo, K.cedo + 0.4))));
      crew.forEach((c, i) => { c.position.set(i ? 2.3 : -2.2, 0.05, lerp(4.0, 0.9, wk) + i * 0.4); c.rotation.y = Math.PI - (i ? 0.4 : -0.4); pReset(c); pIdle(c, t, i + 2); if (wk > 0 && wk < 1) pWalk(c, t + i, 0.6); });
      const up = sm(seg(t, K.cedo - 0.5, K.cedo)); amp.g.position.set(-0.35, lerp(-2.0, 0.05, up), 1.6); amp.g.rotation.y = t * 0.3; amp.set(0.06);
    },
    cam(t) { const s = T.sc["s6-pista1"]; return keys(t, [[s[0], [7, 4.5, 11], [0, 2.4, -4]], [K.ilha5, [4.8, 3.3, 7.5], [0, 2.1, -1]], [K.riu - 0.3, [1.9, 2.4, 4.8], [0, 2.3, 0.4]], [K.cedo - 0.2, [1.4, 2.0, 4.8], [0.0, 1.65, 0.6]], [s[1], [1.3, 1.95, 4.6], [0.0, 1.65, 0.6]]]); },
  };
});

// 7 · pista 2: no cais da vila, ele dá o chapéu pro menino e perde o braço salvando ele
addSet("s7-pista2", (g) => {
  skyDome(g, [[0, "#3a8ae8"], [0.7, "#9ad0ff"], [1, "#e8f6ff"]], { stars: 0 });
  for (let i = 0; i < 9; i++) { const c = glowSprite(0xffffff, 9 + hash(i) * 7, 0.7, NORM); c.material.fog = false; c.position.set(-70 + i * 18, 20 + hash(i + 3) * 12, -76); g.add(c); }
  const seaU = seaPlane(g, 0x2a7ab8);
  ol(mesh(box(16, 1.0, 24), M(0xe8d4a0), -14, 0.0, -2, g), 0.02);
  const pier = mesh(box(9, 0.16, 2.0), M(0xffffff, { map: rep(planks("#8a6a44", "#7a5c3a"), 6, 1) }), -1.5, 0.62, 0.3, g); ol(pier, 0.01);
  for (let i = 0; i < 7; i++) [-0.9, 0.9].forEach((k) => ol(mesh(cyl(0.1, 0.1, 1.6, 8), M(0x5a4028), -5.5 + i * 1.4, -0.2, 0.3 + k, g), 0.005));
  [[-9.5, -4, 2.4, 2.0, 0xf2e6d0, 0xc8502a], [-12.5, -1, 2.8, 2.4, 0xd8e8f0, 0x3a6ab8], [-10, 3, 2.2, 1.8, 0xf6dcc8, 0x8a3a2a], [-13, 5.5, 2.6, 2.2, 0xe8f0d8, 0x4a8a3a], [-15.5, -5, 3.0, 2.6, 0xf2e2c2, 0xb8502a], [-8, 7.5, 2.0, 1.7, 0xf0e8e0, 0x6a4ab8]].forEach(([x, z, w, h, wc, rc], i) => casa(g, x, z, w, h, w * 0.85, wc, rc, i).position.y = 0.5);
  const tops = [[-7.5, -6], [-8.5, 1], [-11, 9], [-6.8, 4.5]].map(([x, z], i) => { const tp = palmeira(g, x, z, 3.2 + hash(i) * 1.2, i + 5); tp.parent.position.y = 0.5; return tp; });
  for (let i = 0; i < 3; i++) ol(mesh(cyl(0.26, 0.26, 0.6, 12), M(0x7a5232), -3.6 + i * 0.6, 0.98, -0.25 + (i % 2) * 0.4, g), 0.008);
  const boat = new THREE.Group(); g.add(boat); ol(mesh(new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0xa8483a), 0, 0.3, 0, boat), 0.01); boat.scale.set(1, 0.6, 2.2);
  const gulls = gaivotas(g, 7, [-16, 16, 6, 11, -14, -4], 6);
  const cap = ruivo(1.1, { oneArm: false }); g.add(cap);
  const kid = menino(); g.add(kid);
  const hat = strawHat(1.1); g.add(hat);
  const mon = monstro(); g.add(mon.g);
  const splash = flowPts(140, 0xeaf6ff, 0.1, NORM); g.add(splash.pts);
  const flash = glowSprite(0xffffff, 3, 0); g.add(flash);
  const sunG = glowSprite(0xffe08a, 30, 0); sunG.material.fog = false; sunG.position.set(18, 14, -70); g.add(sunG);
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  return {
    bg: 0x9ad0ff, fog: [30, 110],
    update(t) {
      const s = T.sc["s7-pista2"]; seaU(t); gulls(t); tops.forEach((tp, i) => (tp.rotation.z = Math.sin(t * 1.4 + i) * 0.06));
      boat.position.set(-4.5, Math.sin(t * 1.1) * 0.08, 3.4); boat.rotation.z = Math.sin(t * 0.9) * 0.05;
      const kn = sm(seg(t, K.chapeu - 0.9, K.chapeu - 0.3)) * (1 - sm(seg(t, K.apostou - 0.6, K.apostou)));
      cap.position.set(1.0, 0.7, 0.3); cap.rotation.y = -Math.PI / 2 + 0.55; pReset(cap); pIdle(cap, t); capeWave(cap, t, 0.8);
      cap.userData.body.position.y -= 0.36 * cap.userData.s * kn; cap.userData.legs.forEach((l, i) => (l.rotation.x = (i ? 1.1 : -0.2) * kn));
      const atk = sm(seg(t, K.perdeu - 0.1, K.braco)) * (1 - sm(seg(t, K.salvando + 0.2, K.salvando + 0.9)));
      cap.rotation.y += 1.2 * atk;
      cap.userData.arms[1].visible = t < K.braco + 0.05;
      const give = sm(seg(t, K.chapeu - 0.35, K.chapeu + 0.45));
      cap.userData.arms[0].rotation.x = -2.3 * Math.sin(Math.min(1, give * 1.2) * Math.PI) * (1 - atk) - 0.9 * atk;
      pLaugh(cap, t, 0.35 * sm(seg(t, K.apostou - 0.2, K.apostou + 0.3)));
      kid.position.set(0.1, 0.7, 0.35); kid.rotation.y = Math.PI / 2 - 0.55; pReset(kid); pIdle(kid, t, 2);
      kid.userData.head.rotation.x = -0.35 * sm(seg(t, K.luffy6 - 0.4, K.luffy6)) * (1 - atk);
      kid.userData.eyes.forEach((e) => e.e.scale.set(1 + 0.4 * atk, 1 + 0.4 * atk, 1));
      cap.updateMatrixWorld(); kid.updateMatrixWorld(); cap.userData.head.getWorldPosition(v); kid.userData.head.getWorldPosition(w);
      v.y += 0.16 * 1.1; w.y += 0.15 * 0.6 + 0.04;
      hat.position.lerpVectors(v, w, give); hat.position.y += Math.sin(give * Math.PI) * 0.35; hat.rotation.set(0, cap.rotation.y * (1 - give) + kid.rotation.y * give, (1 - give) * 0.05 + give * 0.12);
      const rise = sm(seg(t, K.perdeu - 0.5, K.perdeu + 0.25)) * (1 - sm(seg(t, K.salvando + 0.1, K.salvando + 1.1)));
      mon.g.position.set(0.6, lerp(-6.5, 0.2, rise), -5.2); mon.g.rotation.set(0.45 * atk, 0, 0); mon.jaw.rotation.x = 0.5 * Math.abs(Math.sin(t * 5)) * rise;
      mon.g.visible = rise > 0.01;
      for (let i = 0; i < 140; i++) { const ph = ((t - K.perdeu + 0.5) * 0.9 + hash(i)) % 1; const a = hash(i + 7) * Math.PI * 2, r = 0.6 + hash(i + 8) * 1.6;
        splash.pos[i * 3] = 0.6 + Math.cos(a) * r * (0.4 + ph); splash.pos[i * 3 + 1] = Math.sin(ph * Math.PI) * (2 + hash(i + 9) * 2.5) - 0.2; splash.pos[i * 3 + 2] = -5.2 + Math.sin(a) * r * (0.4 + ph); }
      splash.upd(); splash.pts.material.opacity = 0.85 * rise;
      flash.position.set(1.2, 1.9, 0.1); flash.material.opacity = 0.95 * Math.max(0, 1 - Math.abs(t - K.braco) / 0.22);
      sunG.material.opacity = 0.75 * sm(seg(t, K.nova - 0.5, K.nova + 0.6));
    },
    cam(t) { const s = T.sc["s7-pista2"]; const c = keys(t, [[s[0], [5.5, 3.2, 8.5], [-1.2, 1.5, -0.5]], [K.chapeu - 0.5, [0.7, 1.65, 5.0], [0.65, 1.45, 0.3]], [K.luffy6, [0.6, 1.55, 4.6], [0.55, 1.4, 0.35]], [K.perdeu - 0.1, [0.9, 2.3, 6.6], [0.6, 2.3, -2.0]], [K.salvando + 0.5, [0.75, 1.85, 5.4], [0.65, 1.75, 0.3]], [K.apostou, [0.8, 2.15, 6.2], [0.65, 2.1, 0.3]], [s[1], [0.85, 2.2, 6.5], [0.65, 2.15, 0.3]]]);
      return shakeCam(c, t, t > K.perdeu - 0.1 && t < K.braco + 0.4 ? 0.05 : 0); },
  };
});

// 8 · pista 3: tempestade ao amanhecer; ele aponta pra frente e, no horizonte, o dragão cai
addSet("s8-pista3", (g) => {
  skyDome(g, [[0, "#141a26"], [0.65, "#3a3e4a"], [1, "#d8804a"]], { stars: 0 });
  const front = plane(220, 100, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#1a1e2a"], [0.6, "#4a3e4a"], [1, "#ffb06a"]]), fog: false })); front.position.set(0, 26, 82); front.rotation.y = Math.PI; g.add(front);
  const clouds = []; for (let i = 0; i < 12; i++) { const c = glowSprite(0x2a2e3a, 16 + hash(i) * 10, 0.75, NORM); c.material.fog = false; c.position.set(-60 + i * 11, 22 + hash(i + 2) * 10, i % 2 ? -74 : 76); g.add(c); clouds.push(c); }
  const seaU = seaPlane(g, 0x1a2430);
  const rainU = rain(g, 420, [-10, 12, 0, 12, -6, 22], 9);
  const S = ship(g); S.sh.rotation.y = Math.PI;
  const cap = ruivo(); g.add(cap);
  const dr = dragao(); dr.scale.setScalar(1.8); g.add(dr);
  const boomG = glowSprite(0xffd06a, 40, 0); boomG.material.fog = false; boomG.position.set(-1, 6, 58); g.add(boomG);
  const flashL = new THREE.PointLight(0xd8e8ff, 0, 60); flashL.position.set(0, 20, 10); g.add(flashL);
  const bolts = [K.pista3 + 0.4, K.falou + 0.1, K.pegar + 0.3, K.kaido + 0.15];
  return {
    bg: 0x1a1e2a, fog: [26, 120],
    update(t) {
      const s = T.sc["s8-pista3"]; seaU(t); rainU(t, 1.3); S.upd(t); const y0 = S.sh.position.y + 1.15;
      clouds.forEach((c, i) => (c.position.x = -60 + i * 11 + ((t * 2) % 11)));
      let fl = 0; bolts.forEach((b) => (fl = Math.max(fl, Math.max(0, 1 - Math.abs(t - b) / 0.12)))); flashL.intensity = 40 * fl;
      const pt = sm(seg(t, K.chegou7 - 0.4, K.chegou7 + 0.1)); cap.position.set(0.2, y0, 6.0); cap.rotation.y = 0.2 + 0.25 * pt; pReset(cap); pIdle(cap, t); capeWave(cap, t, 2.2);
      cap.userData.arms[0].rotation.set(-2.35 * pt, 0, -0.12 - 0.3 * pt);
      cap.userData.head.rotation.y = -0.2 * pt; pEyesGlow(cap, sm(seg(t, K.pegar - 0.2, K.pegar + 0.3)));
      const fall = seg(t, K.derrotou, K.derrotou + 1.6);
      dr.position.set(-1, lerp(-3, -40, fall * fall), 56); dr.rotation.set(0.15 + fall * 0.4, t * 0.2, fall * 1.1); dr.visible = fall < 0.99;
      boomG.material.opacity = 0.95 * Math.max(0, 1 - Math.abs(t - (K.derrotou + 0.5)) / 0.8);
    },
    cam(t) { const s = T.sc["s8-pista3"]; const c = keys(t, [[s[0], [2.8, 3.4, 11.5], [0.2, 2.8, 6.0]], [K.chegou7, [3.4, 3.3, 7.8], [0.2, 3.0, 6.0]], [K.luffy7 - 0.3, [3.3, 3.25, 7.6], [0.2, 3.0, 6.0]], [K.luffy7 - 0.05, [1.6, 4.4, 6.0], [0.4, 3.6, 30]], [K.derrotou - 0.1, [0.6, 3.7, 3.0], [-0.3, 5.0, 50]], [s[1], [0.6, 3.65, 2.9], [-0.3, 4.8, 50]]]);
      return shakeCam(c, t, t > K.derrotou + 0.3 && t < K.derrotou + 1.1 ? 0.04 : 0); },
  };
});

// 9 · a resposta: a ampulheta acaba e, no nascer do sol, passa o navio do menino do chapéu de palha
const PALHAFLAG = canvasTex(128, 80, (c) => { c.fillStyle = "#0e0a12"; c.fillRect(0, 0, 128, 80); c.fillStyle = "#e6c56a"; c.beginPath(); c.ellipse(64, 50, 40, 9, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(64, 40, 22, 16, 0, Math.PI, 0); c.fill(); c.fillStyle = "#5a3418"; c.fillRect(42, 38, 44, 7); });
addSet("s9-resposta", (g) => {
  const sk = skyDome(g, [[0, "#2a2a5a"], [0.55, "#ff9a6a"], [1, "#ffe6b0"]], { stars: 80 });
  const sun = glowSprite(0xffd890, 16, 0.9); sun.material.fog = false; g.add(sun);
  const seaG = new THREE.Group(); seaG.position.y = -6; g.add(seaG); const seaU = seaPlane(seaG, 0x2a3a5a);
  ol(mesh(new THREE.CylinderGeometry(5, 6.5, 6.2, 12), M(0x4a3e3a), 0, -3.1, 1.5, g), 0.03);
  for (let i = 0; i < 26; i++) { const a = hash(i) * Math.PI * 2, r = hash(i + 1) * 4.3; mesh(new THREE.ConeGeometry(0.06, 0.32, 5), M(0x5a8a3a), Math.cos(a) * r, 0.16, 1.5 + Math.sin(a) * r, g).rotation.z = (hash(i + 2) - 0.5) * 0.5; }
  for (let i = 0; i < 6; i++) rockAt(g, (hash(i + 30) - 0.5) * 7, 0.1, 1.5 + (hash(i + 31) - 0.5) * 7, 0.15 + hash(i + 32) * 0.25, i + 30, 0x5a4e48);
  const amp = ampulheta(0.8); amp.g.position.set(0.75, 0, -0.55); g.add(amp.g);
  const cap = ruivo(); g.add(cap);
  const boat = ship(seaG, { sail: 0xf2efe6, flagT: PALHAFLAG }); boat.sh.scale.setScalar(0.5);
  const sparks = dustPts(160, [-3, 3, 0.3, 3.5, -2, 2], 0xffe0a0, 0.05, 0.8, ADD, 4); g.add(sparks);
  return {
    bg: 0x3a2a4a, fog: [30, 120],
    update(t) {
      const s = T.sc["s9-resposta"]; seaU(t);
      const rise = seg(t, s[0], s[1]); sun.position.set(7, lerp(-1, 6, rise), -76); sun.scale.setScalar(16 + rise * 5);
      amp.set(lerp(0.55, 1, sm(seg(t, s[0], K.esperando + 0.4)))); amp.g.rotation.y = 0.3;
      const gone = sm(seg(t, K.esperando + 0.55, K.esperando + 1.05)); amp.g.scale.setScalar(Math.max(0.001, 1 - gone)); amp.g.visible = gone < 0.99; // o tempo acabou: a ampulheta some
      sparks.material.opacity = 0.8 * Math.max(0.25, Math.sin(Math.min(1, seg(t, K.esperando + 0.5, K.esperando + 1.6)) * Math.PI));
      const tn = sm(seg(t, K.pessoa - 0.8, K.pessoa)); cap.position.set(-0.35, 0, -0.1); cap.rotation.y = lerp(0.65, Math.PI - 0.35, tn); pReset(cap); pIdle(cap, t); capeWave(cap, t, 1.2);
      pLaugh(cap, t, 0.3 * sm(seg(t, K.certa - 0.2, K.certa + 0.4)));
      const go = seg(t, K.esperando - 0.5, s[1] + 2); boat.sh.position.set(lerp(9, 1, go), Math.sin(t * 0.9) * 0.12, -36); boat.sh.rotation.y = -Math.PI / 2 - 0.2; boat.upd(t); boat.sh.position.y = Math.sin(t * 0.9) * 0.12;
    },
    cam(t) { const s = T.sc["s9-resposta"]; return keys(t, [[s[0], [2.2, 2.05, 5.8], [0.2, 1.8, -0.3]], [K.esperando + 0.3, [1.4, 1.9, 4.6], [0.05, 1.65, -0.3]], [K.pessoa - 0.1, [0.2, 2.4, 6.0], [2.0, -4.5, -36]], [s[1], [0.15, 2.45, 6.2], [2.0, -4.4, -36]]]); },
  };
});

// 10 · o detalhe: o velho rei acha um bebê ruivo num baú; no céu, o palácio dourado; no fim, o plano dele
addSet("s10-detalhe", (g) => {
  skyDome(g, [[0, "#0a0610"], [0.6, "#2a1020"], [1, "#6a2a1a"]], { stars: 220 });
  g.add(floorP(90, 90, M(0x2a2222)));
  for (let i = 0; i < 12; i++) { const a = hash(i) * Math.PI * 2, r = 3.5 + hash(i + 1) * 7; const h = 0.6 + hash(i + 2) * 2.8; const p = mesh(cyl(0.35, 0.42, h, 10), M(0x5a5050), Math.cos(a) * r, h / 2, Math.sin(a) * r - 2, g); p.rotation.z = (hash(i + 3) - 0.5) * 0.4; ol(p, 0.02); }
  for (let i = 0; i < 10; i++) rockAt(g, (hash(i + 40) - 0.5) * 14, 0.2, (hash(i + 41) - 0.5) * 12 - 2, 0.25 + hash(i + 42) * 0.5, i + 40, 0x4a4040);
  const fires = []; for (let i = 0; i < 6; i++) { const a = hash(i + 50) * Math.PI * 2, r = 3.2 + hash(i + 51) * 6; fires.push(fogueira(g, Math.cos(a) * r, 0, Math.sin(a) * r - 2, 1.2 + hash(i + 52), i + 3)); }
  const FL = new THREE.PointLight(0xff7a3a, 8, 16); FL.position.set(-2, 2, -1); g.add(FL);
  const emb = flowPts(120, 0xff8a3a, 0.06); g.add(emb.pts);
  const ch = bau(1.0); g.add(ch.g);
  const baby = bebe(); baby.position.set(0, 0.24, 0.06); baby.scale.setScalar(1.15); baby.rotation.x = -1.15; g.add(baby);
  const king = velhoRei(); g.add(king);
  const pal = palacio(); pal.scale.setScalar(1.3); g.add(pal);
  const pg = glowSprite(0xffd06a, 22, 0.5); pg.material.fog = false; g.add(pg);
  const pcl = []; for (let i = 0; i < 10; i++) { const c = glowSprite(0xffe6f0, 6 + hash(i) * 5, 0.7, NORM); c.material.fog = false; g.add(c); pcl.push(c); }
  // sala escura do plano (longe, em x = 40)
  const R = new THREE.Group(); R.position.x = 40; g.add(R);
  R.add(floorP(10, 10, M(0xffffff, { map: rep(planks("#3a2a1c", "#33241a"), 4, 4) })));
  mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshToonMaterial({ map: rep(stoneTex("#3a3238", "#332c32", "#1a161a"), 4, 2), gradientMap: grad }), 0, 2.5, -2.2, R);
  ol(mesh(box(1.7, 0.08, 1.05), M(0x5a3a22), 0, 0.88, -0.2, R), 0.01); [[-0.75, -0.6], [0.75, -0.6], [-0.75, 0.2], [0.75, 0.2]].forEach(([x, z]) => mesh(box(0.08, 0.86, 0.08), M(0x3a2414), x, 0.43, z, R));
  const mp = mesh(new THREE.PlaneGeometry(1.0, 0.75), new THREE.MeshBasicMaterial({ map: mapaTex(true) }), 0, 0.925, -0.2, R); mp.rotation.x = -Math.PI / 2;
  const pieces = []; [[-0.6, 0.15, 0xc81e1e], [-0.45, 0.25, 0xf2efe6], [0.55, -0.45, 0xf2efe6], [0.6, 0.18, 0xf2efe6], [-0.3, -0.5, 0xc81e1e]].forEach(([x, z, c]) => { const p = new THREE.Group(); p.position.set(x, 0.93, z); R.add(p); ol(mesh(cyl(0.05, 0.065, 0.12, 12), M(c), 0, 0.06, 0, p), 0.004); ol(mesh(sph(0.045, 10, 8), M(c), 0, 0.15, 0, p), 0.004); pieces.push(p); });
  const cdl = glowSprite(0xffc070, 0.7, 0.9); cdl.position.set(0.7, 1.15, -0.55); R.add(cdl); mesh(cyl(0.03, 0.03, 0.2, 8), M(0xf2efe6), 0.7, 1.02, -0.55, R);
  const CL = new THREE.PointLight(0xffa05a, 5, 6); CL.position.set(0.6, 1.4, -0.2); R.add(CL);
  const redC = ruivo(); R.add(redC);
  const v = new THREE.Vector3();
  return {
    bg: 0x140a10, fog: [14, 70],
    update(t) {
      const s = T.sc["s10-detalhe"]; fires.forEach((f) => f(t)); FL.intensity = 7 + Math.sin(t * 9) * 1.2;
      for (let i = 0; i < 120; i++) { const ph = (t * 0.15 + hash(i)) % 1; emb.pos[i * 3] = (hash(i + 1) - 0.5) * 12 + Math.sin(t + i) * 0.3; emb.pos[i * 3 + 1] = ph * 7; emb.pos[i * 3 + 2] = (hash(i + 2) - 0.5) * 10 - 2; } emb.upd();
      const op = sm(seg(t, K.achou9 - 0.35, K.achou9 + 0.45)); ch.open(op); baby.visible = op > 0.2; baby.rotation.z = Math.sin(t * 3) * 0.04; baby.rotation.x = -1.15; baby.scale.y = 1.15 * (1 + Math.sin(t * 2.2) * 0.02);
      king.position.set(-0.95, 0, 0.35); king.rotation.y = Math.PI / 2 - 0.35; pReset(king); pIdle(king, t);
      king.userData.body.position.y -= 0.36 * king.userData.s; king.userData.legs.forEach((l, i) => (l.rotation.x = i ? 1.1 : -0.2));
      king.userData.arms[0].rotation.x = -1.1 * Math.sin(Math.min(1, op * 1.3) * Math.PI * 0.5) * (1 - 0.5 * op); king.userData.head.rotation.x = 0.35 * op;
      pLaugh(king, t, 0.4 * sm(seg(t, K.bebe, K.bebe + 0.4)));
      pal.position.set(0, 15 + Math.sin(t * 0.6) * 0.3, -26); pal.rotation.y = -0.4 + t * 0.03; pg.position.set(0, 16, -28);
      pcl.forEach((c, i) => c.position.set(-9 + i * 2 + Math.sin(t * 0.2 + i) * 0.8, 11.5 + hash(i + 7) * 2, -24 + hash(i + 8) * 4));
      redC.position.set(0, 0, -1.0); redC.rotation.y = 0; pReset(redC); pIdle(redC, t); capeWave(redC, t, 0.4);
      const mv = sm(seg(t, K.plano - 0.7, K.plano + 0.1)); redC.userData.arms[0].rotation.x = -0.9 * Math.sin(mv * Math.PI) - 0.25 * mv; redC.userData.body.rotation.x = 0.15 * Math.sin(mv * Math.PI);
      pieces[0].position.set(lerp(-0.6, 0.28, mv), 0.93 + Math.sin(mv * Math.PI) * 0.18, lerp(0.15, -0.09, mv));
      pEyesGlow(redC, sm(seg(t, K.plano - 0.1, K.plano + 0.4))); redC.userData.head.rotation.x = 0.12;
      cdl.scale.setScalar(0.7 * (0.9 + 0.1 * Math.sin(t * 13))); CL.intensity = 5 + Math.sin(t * 11) * 0.8;
    },
    cam(t) { const s = T.sc["s10-detalhe"]; return keys(t, [[s[0], [3.0, 2.3, 5.0], [0, 1.0, 0]], [K.achou9, [1.5, 1.7, 2.7], [0, 0.6, 0]], [K.bebe, [0.45, 1.75, 1.2], [0, 0.4, 0]], [K.hoje, [0.7, 1.7, 2.2], [0, 1.3, -0.2]], [K.nasceu, [1.3, 1.4, 4.2], [0, 14.0, -25]], [K.fas - 0.42, [1.0, 1.5, 4.5], [0, 14.4, -25]], [K.fas - 0.4, [41.2, 2.2, 3.0], [40, 1.9, -0.3]], [s[1], [40.9, 2.1, 2.6], [40, 1.92, -0.3]]]); },
  };
});

// 11 · pergunta: ele no penhasco, de noite, capa ao vento
addSet("s11-pergunta", (g) => {
  skyDome(g, [[0, "#04060e"], [1, "#1a2440"]], { stars: 420, moon: [-14, 24, -72], moonR: 4 });
  const seaG = new THREE.Group(); seaG.position.y = -7; g.add(seaG); const seaU = seaPlane(seaG, 0x0e1a30);
  ol(mesh(new THREE.CylinderGeometry(4, 6, 7.2, 10), M(0x3a3640), 0, -3.6, 1.0, g), 0.03);
  const grass = []; for (let i = 0; i < 40; i++) { const a = hash(i) * Math.PI * 2, r = hash(i + 1) * 3.7; const gr = mesh(new THREE.ConeGeometry(0.05, 0.3, 5), M(0x2e5a3a), Math.cos(a) * r, 0.15, 1.0 + Math.sin(a) * r, g); grass.push(gr); }
  const ff = dustPts(90, [-4, 4, 0.3, 3, -2, 4], 0xd8ff8a, 0.06, 0.9, ADD, 6); g.add(ff);
  const S = ship(seaG); S.sh.position.set(9, 0, -20); S.sh.rotation.y = 0.6; S.sh.scale.setScalar(0.8);
  const cap = ruivo(); g.add(cap);
  return {
    bg: 0x060a16, fog: [24, 110],
    update(t) {
      const s = T.sc["s11-pergunta"]; seaU(t); S.upd(t); S.sh.position.y = Math.sin(t * 0.9) * 0.12;
      grass.forEach((gr, i) => (gr.rotation.z = Math.sin(t * 2 + i) * 0.25));
      ff.position.y = Math.sin(t * 0.7) * 0.1; ff.rotation.y = t * 0.05;
      cap.position.set(0, 0, -0.3); cap.rotation.y = 0.3; pReset(cap); pIdle(cap, t); capeWave(cap, t, 2.2);
      cap.userData.head.rotation.y = 0.25 * sm(seg(t, K.comenta - 0.4, K.comenta + 0.2)); pLaugh(cap, t, 0.25 * sm(seg(t, K.comenta, K.comenta + 0.4)));
    },
    cam(t) { const s = T.sc["s11-pergunta"]; return keys(t, [[s[0], [2.5, 1.55, 4.8], [0, 2.0, -0.3]], [s[1], [1.5, 1.2, 3.7], [0, 2.15, -0.3]]]); },
  };
});

// thumb: o capitão ruivo ao pôr do sol, mapa com o X atrás, olhos acesos
addSet("thumb", (g) => {
  skyDome(g, [[0, "#2a1a4a"], [0.55, "#ff6a3a"], [1, "#ffc87a"]], { stars: 60 });
  const sun = glowSprite(0xffc86a, 22, 0.9); sun.material.fog = false; sun.position.set(-7, 5, -70); g.add(sun);
  seaPlane(g, 0x1a2a4a);
  const mp = mesh(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshBasicMaterial({ map: mapaTex(true), transparent: true, opacity: 0.9 }), 0.0, 2.75, -2.6, g); mp.rotation.set(0.05, -0.12, 0.05);
  const xg = glowSprite(0xff3a2a, 0.7, 0.55); xg.position.set(0.66, 2.48, -2.4); g.add(xg);
  g.add(dustPts(140, [-3, 3, 0.5, 4, -3, 1], 0xffd88a, 0.05, 0.8, ADD, 2));
  const cap = ruivo(); g.add(cap);
  return {
    bg: 0x2a1a3a, fog: [30, 120],
    update(t) { cap.position.set(-0.15, 0, 0); cap.rotation.y = 0.2; pReset(cap); pIdle(cap, 0.4); capeWave(cap, 0.6, 1.4); pEyesGlow(cap, 0.75); cap.userData.head.rotation.set(0.06, 0.12, 0); },
    cam(t) { return { pos: [0.1, 2.25, 3.4], look: [0.05, 2.0, 0] }; },
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
window.__hf.buildReady["shanks3d"] = (async () => {
  try { await document.fonts.load("700 48px 'Space Mono'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
