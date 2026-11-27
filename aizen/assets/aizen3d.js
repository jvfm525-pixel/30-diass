// Cena 3D do vídeo de curiosidade "Por que o Aizen deixou o Ichigo ficar mais forte? (xadrez 3D, personagens originais)" (personagens originais) (Three.js).
// Tudo é função do tempo t (hf-seek). Tempos-chave em window.HF_T (gerado por tools/build_aizen.py).
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

// ---------------------------------------------------------------- estilo "xadrez 3D": tabuleiro de mármore no deserto, sob a lua (tudo original)
rim.color.set(0xa07aff); rim.intensity = 0.8;
hemi.color.set(0x8a9ad8); hemi.groundColor.set(0x14101e); hemi.intensity = 0.7;
const STD = (color, rough = 0.3, metal = 0.05) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const IVORY = STD(0xefe9dd, 0.32), ONYX = STD(0x17151e, 0.18, 0.1), GOLD = STD(0xd9b44a, 0.28, 0.85);
function peca(tipo, cor, s = 1) {
  const g = new THREE.Group(); const mat = cor === "b" ? IVORY : ONYX;
  const L = (pts, m = mat) => { const o = mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r * s, y * s)), 40), m, 0, 0, 0, g); ol(o, 0.012 * s); return o; };
  L([[0, 0], [0.46, 0], [0.46, 0.09], [0.4, 0.13], [0.42, 0.17], [0.3, 0.22], [0, 0.22]]);
  mesh(new THREE.TorusGeometry(0.4 * s, 0.025 * s, 8, 40), GOLD, 0, 0.13 * s, 0, g).rotation.x = Math.PI / 2;
  const H = { peao: 0.62, torre: 0.95, bispo: 1.15, cavalo: 0.75, rainha: 1.4, rei: 1.55 }[tipo];
  L([[0, 0.2], [0.3, 0.2], [0.2 * (tipo === "peao" ? 1.05 : 1.15), 0.2 + H * 0.35], [0.14 * (tipo === "torre" ? 1.6 : 1), H * 0.92], [0, H * 0.92]]);
  L([[0, H * 0.9], [0.24 * (tipo === "torre" ? 1.35 : 1), H * 0.9], [0.24 * (tipo === "torre" ? 1.35 : 1), H * 0.97], [0, H * 0.97]], GOLD);
  if (tipo === "peao") ol(mesh(sph(0.2 * s, 24, 18), mat, 0, (H + 0.17) * s, 0, g), 0.012 * s);
  if (tipo === "torre") { L([[0, H], [0.32, H], [0.32, H + 0.22], [0.24, H + 0.22], [0.24, H + 0.1], [0, H + 0.1]]); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; mesh(box(0.12 * s, 0.14 * s, 0.1 * s), mat, Math.cos(a) * 0.27 * s, (H + 0.29) * s, Math.sin(a) * 0.27 * s, g).rotation.y = -a; } }
  if (tipo === "bispo") { const m = mesh(sph(0.2 * s, 24, 18), mat, 0, (H + 0.2) * s, 0, g); m.scale.y = 1.45; ol(m, 0.012 * s); ol(mesh(sph(0.06 * s, 12, 10), GOLD, 0, (H + 0.5) * s, 0, g), 0.006 * s); }
  if (tipo === "rainha" || tipo === "rei") { L([[0, H], [0.2, H], [0.3, H + 0.26], [0.22, H + 0.3], [0, H + 0.3]]); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; mesh(new THREE.ConeGeometry(0.035 * s, 0.12 * s, 6), GOLD, Math.cos(a) * 0.27 * s, (H + 0.32) * s, Math.sin(a) * 0.27 * s, g); } }
  if (tipo === "rainha") ol(mesh(sph(0.08 * s, 14, 10), GOLD, 0, (H + 0.42) * s, 0, g), 0.006 * s);
  if (tipo === "rei") { mesh(box(0.07 * s, 0.34 * s, 0.07 * s), GOLD, 0, (H + 0.5) * s, 0, g); mesh(box(0.22 * s, 0.07 * s, 0.07 * s), GOLD, 0, (H + 0.55) * s, 0, g); }
  if (tipo === "cavalo") { const sh2 = new THREE.Shape(); [[-0.22, 0], [0.24, 0], [0.26, 0.3], [0.18, 0.62], [0.02, 0.74], [-0.2, 0.66], [-0.34, 0.5], [-0.3, 0.42], [-0.12, 0.44], [-0.2, 0.22]].forEach(([x, y], i) => (i ? sh2.lineTo(x * s, y * s) : sh2.moveTo(x * s, y * s)));
    const hd = mesh(new THREE.ExtrudeGeometry(sh2, { depth: 0.26 * s, bevelEnabled: true, bevelSize: 0.03 * s, bevelThickness: 0.03 * s, bevelSegments: 2 }), mat, 0, H * 0.9 * s, -0.13 * s, g); ol(hd, 0.012 * s); }
  return g;
}
function tabuleiro(g, n = 8, sq = 1.4, ped = true) {
  const b = new THREE.Group(); g.add(b); const W2 = (n * sq) / 2;
  const vein = (base, line) => canvasTex(256, 256, (c) => { c.fillStyle = base; c.fillRect(0, 0, 256, 256); c.strokeStyle = line; c.lineWidth = 2; for (let i = 0; i < 9; i++) { c.beginPath(); let x = hash(i + 3) * 256, y = 0; c.moveTo(x, y); for (let j = 0; j < 12; j++) { x += (hash(i * 13 + j) - 0.5) * 40; y += 22; c.lineTo(x, y); } c.stroke(); } });
  const mW = new THREE.MeshStandardMaterial({ map: vein("#ece6dc", "rgba(150,140,160,.45)"), roughness: 0.18, metalness: 0.05 }), mB = new THREE.MeshStandardMaterial({ map: vein("#1a1822", "rgba(140,110,200,.35)"), roughness: 0.14, metalness: 0.1 });
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) mesh(box(sq, 0.16 * Math.min(1, sq / 1.4) + 0.01, sq), (i + j) % 2 ? mB : mW, -W2 + sq / 2 + i * sq, 0, -W2 + sq / 2 + j * sq, b);
  ol(mesh(box(n * sq + 0.5 * sq / 1.4, 0.22 * Math.min(1, sq / 1.4) + 0.01, n * sq + 0.5 * sq / 1.4), GOLD, 0, -0.04 * Math.min(1, sq / 1.4), 0, b), 0.02 * Math.min(1, sq / 1.4));
  if (ped) ol(mesh(new THREE.CylinderGeometry(W2 * 0.55, W2 * 0.25, 5, 10), STD(0x3a3446, 0.8), 0, -2.6, 0, b), 0.04);
  return { b, sq, W2, at: (i, j) => [-W2 + sq / 2 + i * sq, 0.08, -W2 + sq / 2 + j * sq] };
}
function arvoreBranca(g, x, z, h = 3, seed = 1) {
  const t = new THREE.Group(); t.position.set(x, -2, z); g.add(t); const m = STD(0xe8eef6, 0.4);
  const ramo = (p, len, r, depth, a, b2) => { const seg = new THREE.Group(); seg.position.copy(p); seg.rotation.set(a, b2, 0); t.add(seg); mesh(cyl(r * 0.7, r, len, 6), m, 0, len / 2, 0, seg);
    if (depth > 0) { seg.updateMatrixWorld(); for (let k = 0; k < 2; k++) { const tip = new THREE.Vector3(0, len, 0); seg.localToWorld(tip); t.worldToLocal(tip); ramo(tip, len * 0.7, r * 0.65, depth - 1, a + (hash(seed + depth * 7 + k) - 0.5) * 1.4, b2 + (k ? 1.2 : -1.2) + hash(seed + k) * 0.6); } } };
  ramo(new THREE.Vector3(0, 0, 0), h * 0.45, 0.14, 3, 0, 0);
  return t;
}
function fio(g, col = 0xc08aff) {
  const n = 16, pos = new Float32Array(n * 3); const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.9, blending: ADD, depthWrite: false })); ln.frustumCulled = false; g.add(ln);
  return (a, b, sag = 0.3, t = 0, k = 1) => { for (let i = 0; i < n; i++) { const u = i / (n - 1); pos[i * 3] = lerp(a.x, b.x, u) + Math.sin(t * 2 + u * 6) * 0.02; pos[i * 3 + 1] = lerp(a.y, b.y, u) - Math.sin(u * Math.PI) * sag; pos[i * 3 + 2] = lerp(a.z, b.z, u); } geo.attributes.position.needsUpdate = true; ln.material.opacity = 0.9 * k; };
}
// cabelo detalhado: calota + volume + dezenas de mechas macias em camadas, com brilho (penteados originais)
function cabeloDetalhado(p, estilo, base, luz) {
  const s = p.userData.s, head = p.userData.head;
  const mB = new THREE.MeshStandardMaterial({ color: base, roughness: 0.5, metalness: 0.04 }), mL = new THREE.MeshStandardMaterial({ color: luz, roughness: 0.34, metalness: 0.06 });
  ol(mesh(new THREE.SphereGeometry(0.25 * s, 26, 12, 0, Math.PI * 2, 0, Math.PI * 0.35), mB, 0, 0.012 * s, -0.01 * s, head), 0.008 * s);
  ol(mesh(sph(0.238 * s, 22, 16), mB, 0, -0.012 * s, -0.082 * s, head), 0.008 * s).scale.set(1.07, 1.0, 0.86);
  const geo = new THREE.SphereGeometry(0.5, 12, 8); geo.translate(0, 0.5, 0); // mecha macia: gota alongada com a base na origem
  const up = new THREE.Vector3(0, 1, 0), P = new THREE.Vector3(), D = new THREE.Vector3(), out = new THREE.Vector3();
  let n = 0;
  const mecha = (th, ph, len, w, dx, dy, dz, ko) => { // th: 0 = topo; ph: 0 = frente
    out.set(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)); P.copy(out).multiplyScalar(0.228 * s); P.z -= 0.02 * s;
    D.set(out.x * ko + dx, out.y * ko + dy, out.z * ko + dz).normalize();
    const m = mesh(geo, n++ % 3 === 0 ? mL : mB, P.x, P.y, P.z, head); m.quaternion.setFromUnitVectors(up, D); m.scale.set(w * 0.085 * s, len * s, w * 0.05 * s); ol(m, 0.004 * s); return m; };
  const evitaRosto = (ph, th) => Math.cos(ph) > 0.5 && th > Math.PI * 0.28;
  if (estilo === "elegante") { // liso, em camadas, deitado pra trás; franja de lado acima das sobrancelhas
    for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) { const th = Math.PI * (0.34 + r * 0.1), ph = Math.PI * (0.32 + (i / 15) * 1.36); if (evitaRosto(ph, th)) continue; mecha(th, ph, 0.2 + r * 0.025 + hash(i + r * 9) * 0.03, 1.1, 0, -0.55, -0.85, 0.12); }
    for (let r = 0; r < 2; r++) for (let i = 0; i < 14; i++) { const th = Math.PI * (0.1 + r * 0.11), ph = (i / 14) * Math.PI * 2; mecha(th, ph, 0.21 + hash(i + 40) * 0.03, 1.15, 0.12, 0.0, -1.0, 0.1); }
    for (let i = 0; i < 7; i++) { const ph = -0.8 + i * 0.27; mecha(Math.PI * (0.21 + (i % 2) * 0.035), ph, 0.15 + hash(i + 60) * 0.025, 1.05, 0.95, -0.1, -0.3, 0.1); }
  } else { // castanho escuro, despenteado mas macio; franja curta
    for (let r = 0; r < 4; r++) for (let i = 0; i < 14; i++) { const th = Math.PI * (0.07 + r * 0.12), ph = (i / 14) * Math.PI * 2 + r * 0.3; if (evitaRosto(ph, th)) continue;
      mecha(th, ph, 0.12 + hash(i * 7 + r) * 0.05, 1.25, (hash(i + r * 13) - 0.5) * 0.5, -0.25, -0.55 + (hash(i * 3 + r) - 0.5) * 0.5, 0.4); }
    for (let i = 0; i < 7; i++) { const ph = -0.75 + i * 0.25; mecha(Math.PI * (0.25 + (i % 2) * 0.04), ph, 0.1 + hash(i + 80) * 0.025, 1.15, (hash(i + 81) - 0.5) * 0.5, -0.45, 0.45, 0.25); }
    [-1, 1].forEach((k) => { for (let j = 0; j < 2; j++) mecha(Math.PI * (0.47 + j * 0.06), k * Math.PI * (0.45 + j * 0.04), 0.11, 1.0, 0, -1, 0.1, 0.25); });
  }
}
function estrategista(s = 1.18) { const p = pirata({ scale: s, fat: 0.9, coat: 0xf2f2f6, shirt: 0x15131c, pants: 0x15131c, hairC: 0x9a9eaa, collar: true, eyeGlow: 0xb07aff }); cabeloDetalhado(p, "elegante", 0xc6cad8, 0xeef0f8); return p; }
function espadachim(s = 1.0) { const p = pirata({ scale: s, fat: 0.95, coat: 0x1c2440, shirt: 0xe2dccf, pants: 0x14141c, hairC: 0x4a2e1e, collar: false, eyeGlow: 0xffb04a }); cabeloDetalhado(p, "baguncado", 0x3a2618, 0x5a4030); return p; }

// ---------------------------------------------------------------- utilitários do vídeo
function luaCrescente(g, x, y, z, size = 22, col = 0xb8a8ff) {
  const lua = canvasTex(512, 512, (c) => { c.clearRect(0, 0, 512, 512); c.save(); c.shadowColor = "rgba(220,210,255,.95)"; c.shadowBlur = 60; c.fillStyle = "#f6f2ff"; c.beginPath(); c.arc(256, 256, 170, 0, Math.PI * 2); c.fill(); c.restore();
    c.globalCompositeOperation = "destination-out"; c.beginPath(); c.arc(330, 215, 160, 0, Math.PI * 2); c.fill(); });
  const m = mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: lua, transparent: true, fog: false, depthWrite: false }), x, y, z, g);
  const mg = glowSprite(col, size * 2.1, 0.22); mg.material.fog = false; mg.position.set(x, y, z - 1); g.add(mg); return m;
}
function deserto(g, col = 0xd8d4e2, y = -4) {
  const dg = new THREE.PlaneGeometry(260, 260, 90, 90); dg.rotateX(-Math.PI / 2); const dp = dg.attributes.position.array;
  for (let i = 0; i < dp.length; i += 3) dp[i + 1] = Math.sin(dp[i] * 0.09) * 1.2 + Math.sin(dp[i + 2] * 0.12 + dp[i] * 0.03) * 1.5; dg.computeVertexNormals();
  const d = new THREE.Mesh(dg, STD(col, 0.95)); d.position.y = y; g.add(d); return d;
}
function espada(g, cor = 0xffa040) {
  const b = new THREE.Group(); g.add(b); ol(mesh(box(0.05, 1.25, 0.014), new THREE.MeshStandardMaterial({ color: 0xeef2fa, roughness: 0.3, metalness: 0.35, emissive: 0x3a3e4a }), 0, 0.72, 0, b), 0.004); // lâmina clara, visível no céu escuro mesh(box(0.2, 0.035, 0.05), GOLD, 0, 0.08, 0, b); mesh(cyl(0.025, 0.025, 0.26, 8), STD(0x2a1410, 0.6), 0, -0.06, 0, b);
  const gl = []; for (let i = 0; i < 6; i++) { const s2 = glowSprite(cor, 0.45, 0.7); s2.position.set(0, 0.2 + i * 0.22, 0); b.add(s2); gl.push(s2); }
  return { b, glow(k, t) { gl.forEach((s2, i) => { s2.material.opacity = k * (0.55 + 0.25 * Math.sin(t * 6 + i)); s2.scale.setScalar(0.45 * (0.8 + 0.6 * k)); }); } };
}
function auraFogo(g, n = 10, cor = 0xffa040) {
  const fs = []; for (let i = 0; i < n; i++) { const s2 = glowSprite(cor, 1, 0); g.add(s2); fs.push(s2); }
  return (t, p, k) => fs.forEach((s2, i) => { const ph = (t * 0.9 + i / n) % 1; const a = i * 2.4 + t * 0.6; s2.position.set(p.x + Math.cos(a) * 0.45 * k, p.y - 0.6 + ph * 2.6 * Math.max(0.4, k), p.z + Math.sin(a) * 0.35 * k); s2.scale.setScalar((0.6 + 1.4 * k) * (1 - ph * 0.6)); s2.material.opacity = 0.55 * k * Math.sin(ph * Math.PI); });
}
function dedoNaMao(p) { const s = p.userData.s; p.userData.arms.forEach((a) => { const h = a.children[1]; const f = mesh(cap(0.024 * s, 0.11 * s), M(SKIN), 0, -0.1 * s, 0.02 * s, h); f.visible = false; a.userData.dedo = f; }); }
function pose(p) { p.userData.eyes.forEach((e) => e.e.scale.set(1, 0.45, 1)); p.userData.brows.forEach((b, i) => (b.rotation.z = (i ? 1 : -1) * 0.18)); }
function serio(p) { p.userData.smile.visible = false; p.userData.mouth.scale.set(0.9, 0.12, 0.5); p.userData.brows.forEach((b, i) => (b.rotation.z = (i ? -1 : 1) * 0.3)); }
function mascara(s = 1) {
  const g = new THREE.Group(); const bone = STD(0xf2efe6, 0.4);
  const m = mesh(sph(0.26 * s, 24, 18), bone, 0, 0, 0, g); m.scale.set(1, 1.15, 0.8); ol(m, 0.01 * s);
  [-1, 1].forEach((k) => { mesh(box(0.05 * s, 0.17 * s, 0.05 * s), new THREE.MeshBasicMaterial({ color: 0x0a0610 }), 0.09 * k * s, 0.04 * s, 0.2 * s, g); const h = mesh(new THREE.ConeGeometry(0.05 * s, 0.26 * s, 8), bone, 0.17 * k * s, 0.3 * s, -0.02 * s, g); h.rotation.z = -0.5 * k; ol(h, 0.006 * s); });
  for (let i = 0; i < 5; i++) mesh(box(0.03 * s, 0.07 * s, 0.03 * s), bone, -0.08 * s + i * 0.04 * s, -0.2 * s, 0.17 * s, g);
  const eg = []; [-1, 1].forEach((k) => { const e = glowSprite(0xffd23a, 0.12 * s, 0.9); e.position.set(0.09 * k * s, 0.05 * s, 0.23 * s); g.add(e); eg.push(e); });
  return g;
}
const KEYT = canvasTex(256, 128, (c) => { c.fillStyle = "#140c26"; c.fillRect(0, 0, 256, 128); c.strokeStyle = "#e8c46a"; c.lineWidth = 6; c.strokeRect(6, 6, 244, 116); c.fillStyle = "#e8c46a"; c.font = "700 30px 'Space Mono', monospace"; c.textAlign = "center"; c.fillText("★ KEY ★", 128, 46); c.fillStyle = "#ffffff"; c.font = "700 24px 'Space Mono', monospace"; c.fillText("XXXX-XXXX-XXXX", 128, 90); });
function carta() { return mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshBasicMaterial({ map: KEYT, side: THREE.DoubleSide })); }
function mundo(g, o = {}) { // céu, lua, deserto e árvores brancas do mundo do xadrez
  g.add(dustPts(o.stars ?? 500, [-60, 60, 6, 60, -70, -40], 0xffffff, 0.22, 0.9, ADD, o.seed ?? 3));
  if (o.lua !== false) luaCrescente(g, ...(o.lua || [-12, 9, -70]), o.luaSize || 22);
  deserto(g, o.deserto || 0xd8d4e2);
  [[-14, -18], [12, -22], [-20, -6], [18, -8], [-17, -30], [24, -30], [9, -42]].forEach(([x, z], i) => arvoreBranca(g, x, z, 4 + hash(i + (o.seed ?? 0)) * 3, i * 5 + (o.seed ?? 0)));
}
function fiosDe(g, n) { const fs = []; for (let i = 0; i < n; i++) fs.push(fio(g)); const beads = []; for (let i = 0; i < n * 3; i++) { const b2 = glowSprite(0xc08aff, 0.2, 0.9); g.add(b2); beads.push(b2); }
  const tmp = new THREE.Vector3();
  return (t, from, tos, sags, k = 1) => { tos.forEach((to, i) => fs[i](from, to, sags[i] ?? 0.5, t + i, 0.85 * k)); beads.forEach((b2, j) => { const i = Math.floor(j / 3); if (i >= tos.length) { b2.visible = false; return; } b2.visible = k > 0.02; const u = (t * 0.35 + (j % 3) / 3) % 1; const a = from, b = tos[i];
    tmp.set(lerp(a.x, b.x, u), lerp(a.y, b.y, u) - Math.sin(u * Math.PI) * (sags[i] ?? 0.5), lerp(a.z, b.z, u)); b2.position.copy(tmp); b2.material.opacity = 0.9 * k * Math.sin(u * Math.PI); }); };
}

// 1 · gancho: o estrategista ergue um dedo; o espadachim fica cada vez mais forte
addSet("s1-gancho", (g) => {
  mundo(g);
  const TB = tabuleiro(g);
  const layout = [["torre", "p", 0, 0], ["cavalo", "p", 1, 1], ["rainha", "p", 2, 0], ["rei", "p", 6, 0], ["bispo", "p", 7, 1], ["peao", "p", 1, 3], ["peao", "p", 6, 3],
    ["peao", "b", 0, 5], ["bispo", "b", 7, 6], ["torre", "b", 0, 7], ["cavalo", "b", 6, 7]];
  const pcs = layout.map(([tp, c, i, j]) => { const p = peca(tp, c, 1.55); p.position.set(...TB.at(i, j)); p.rotation.y = c === "p" ? 0.3 : -0.4; g.add(p); return p; });
  const strat = estrategista(); dedoNaMao(strat); g.add(strat); const hero = espadachim(); g.add(hero);
  const sw = espada(g); const aura = auraFogo(g, 12); const fios = fiosDe(g, 7);
  const L1 = new THREE.PointLight(0x9a6aff, 3.5, 9); g.add(L1); const L2 = new THREE.PointLight(0xffa040, 0, 7); g.add(L2);
  const moonL = new THREE.DirectionalLight(0xc8d0ff, 0.9); moonL.position.set(-12, 9, -70); g.add(moonL);
  const v = new THREE.Vector3(), w = new THREE.Vector3(), hp = new THREE.Vector3();
  const tops = pcs.slice(0, 7).map((p) => new THREE.Vector3(p.position.x, p.position.y + 2.5, p.position.z));
  return {
    bg: 0x07060c, fog: [30, 140],
    update(t) {
      strat.position.set(0.2, 0.08, -4.3); strat.rotation.y = 0.12; pReset(strat); pIdle(strat, t); pose(strat);
      const up = sm(seg(t, K.dedo0 - 0.6, K.dedo0 - 0.05)); strat.userData.arms[0].rotation.set(-0.3 - 2.3 * up, 0, -0.1); strat.userData.arms[0].userData.dedo.visible = up > 0.4;
      strat.userData.arms[1].rotation.set(-2.0, 0, 0.5 + Math.sin(t * 1.3) * 0.05); pEyesGlow(strat, 0.35 + 0.65 * sm(seg(t, K.porque0 - 0.3, K.porque0 + 0.2)));
      hero.position.set(1.4, 0.08, 3.0); hero.rotation.y = Math.PI + 0.25; pReset(hero); pIdle(hero, t, 2); serio(hero);
      hero.userData.arms[0].rotation.set(-1.25, 0, -0.15); hero.updateMatrixWorld(); hero.userData.arms[0].children[1].getWorldPosition(w);
      sw.b.position.copy(w); sw.b.rotation.set(0.15, 0, 0.12);
      const pw = 0.25 + 0.75 * sm(seg(t, K.deixou, K.forte + 0.3)); sw.glow(pw, t); hero.userData.head.getWorldPosition(hp); aura(t, hp.set(1.4, 1.4, 3.0), pw); L2.position.set(1.4, 1.8, 3.0); L2.intensity = 6 * pw;
      strat.updateMatrixWorld(); strat.userData.arms[1].children[1].getWorldPosition(v); L1.position.set(v.x + 0.6, v.y + 1.2, v.z - 0.8);
      fios(t, v, tops, tops.map((_, i) => 0.5 + i * 0.05), 1);
    },
    cam(t) { const sc = T.sc["s1-gancho"]; return keys(t, [[0, [3.3, 4.3, 8.4], [0.2, 1.5, -2.8]], [K.dedo0 - 0.6, [3.0, 4.1, 7.9], [0.2, 1.5, -2.8]], [K.dedo0 - 0.05, [1.6, 2.75, -1.0], [0.1, 2.7, -4.3]], [K.deixou - 0.3, [1.55, 2.7, -1.15], [0.1, 2.68, -4.3]], [K.deixou + 0.7, [-1.0, 2.15, 0.1], [1.35, 1.75, 3.0]], [K.forte + 0.2, [-1.05, 2.2, 0.3], [1.35, 1.8, 3.0]], [K.porque0 - 0.1, [1.2, 1.6, -1.3], [0.15, 2.65, -4.3]], [K.fica, [1.1, 1.65, -1.45], [0.15, 2.65, -4.3]], [K.fica + 0.9, [2.9, 3.7, 7.7], [0.3, 1.6, -3.0]], [sc[1], [2.7, 3.5, 7.3], [0.3, 1.6, -3.0]]]); },
  };
});

// 2 · o dedo: no alto de uma torre branca ao entardecer, a espada para num dedo; um corte; ele vai embora
addSet("s2-dedo", (g) => {
  skyDome(g, [[0, "#1a1430"], [0.55, "#6a3a6a"], [1, "#e8a07a"]], { stars: 80 });
  for (let i = 0; i < 9; i++) { const c = glowSprite(0xf0b0c0, 10 + hash(i) * 8, 0.45, NORM); c.material.fog = false; c.position.set(-70 + i * 18, 14 + hash(i + 3) * 10, -76); g.add(c); }
  const piso = floorP(18, 18, new THREE.MeshStandardMaterial({ map: rep(tiles("#f2efe8", "#c9c2b8", 8), 2, 2), roughness: 0.35 })); g.add(piso);
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; const m = mesh(box(2.1, 0.9, 0.5), STD(0xeeeae2, 0.6), Math.cos(a) * 8.2, 0.45, Math.sin(a) * 8.2, g); m.rotation.y = -a + Math.PI / 2; ol(m, 0.015); }
  mesh(new THREE.CylinderGeometry(8.6, 7.6, 60, 32, 1, true), STD(0xe2ddd2, 0.7), 0, -30.1, 0, g);
  [[-30, -40, 22], [25, -52, 30], [-55, -60, 18], [48, -35, 14], [10, -75, 40], [-18, -70, 26]].forEach(([x, z, h], i) => { mesh(cyl(2.4, 2.8, h, 16), STD(0xf2efe8, 0.6), x, h / 2 - 20, z, g); mesh(new THREE.ConeGeometry(3.2, 5, 16), STD(0x8a4a3a, 0.6), x, h - 20 + 2.5, z, g); });
  const strat = estrategista(); dedoNaMao(strat); g.add(strat); const hero = espadachim(); g.add(hero);
  const sw = espada(g); const aura = auraFogo(g, 10);
  const ring = mesh(new THREE.TorusGeometry(1, 0.05, 8, 48), glowM(0xfff2c8, 0), 0, 0, 0, g); const hitG = glowSprite(0xfff2c8, 1.2, 0); g.add(hitG);
  const sparks = flowPts(80, 0xffd890, 0.06); g.add(sparks.pts);
  const arc = mesh(new THREE.TorusGeometry(1.15, 0.035, 6, 40, Math.PI * 0.9), glowM(0xf4f0ff, 0), 0, 1.3, 0.5, g);
  const pillar = mesh(cyl(1.1, 1.1, 40, 24, 1, true), glowM(0xfff2c8, 0), 0, 20, -3.6, g);
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  return {
    bg: 0x241a30, fog: [30, 120],
    update(t) {
      const s = T.sc["s2-dedo"];
      const ch = sm(seg(t, K.atacou1 - 0.2, K.parou - 0.25)), fall = sm(seg(t, K.corte - 0.1, K.corte + 0.6)), go = sm(seg(t, K.embora - 0.3, s[1]));
      hero.position.set(0, lerp(0, -0.05, fall), lerp(3.2, 0.95, ch) + 0.7 * fall); hero.rotation.set(-1.35 * fall, Math.PI, 0); pReset(hero); pIdle(hero, t, 2); serio(hero);
      if (ch > 0.02 && ch < 0.98) pWalk(hero, t * 1.6, 1);
      const raise = sm(seg(t, K.atacou1 - 0.2, K.atacou1 + 0.4)), swing = sm(seg(t, K.parou - 0.5, K.parou - 0.15));
      hero.userData.arms[0].rotation.set(-1.2 - 1.6 * raise * (1 - swing) - 0.2 * swing, 0, -0.15); hero.updateMatrixWorld(); hero.userData.arms[0].children[1].getWorldPosition(w);
      sw.b.position.copy(w); sw.b.rotation.set(-0.3 - 0.5 * swing + 1.9 * fall, 0, 0); sw.glow(0.6 * (1 - fall), t); aura(t, v.set(hero.position.x, 1.3, hero.position.z), 0.5 * (1 - fall));
      strat.position.set(0, 0, lerp(-1.0, -3.6, go)); strat.rotation.y = go > 0.02 ? Math.PI : 0; pReset(strat); pIdle(strat, t); pose(strat); if (go > 0.02 && go < 0.98) pWalk(strat, t, 0.7);
      const fing = sm(seg(t, K.parou - 0.35, K.parou - 0.1)) * (1 - sm(seg(t, K.corte - 0.4, K.corte - 0.2)));
      strat.userData.arms[0].rotation.set(-2.55 * fing, 0, -0.12); strat.userData.arms[0].userData.dedo.visible = fing > 0.4;
      const cut = seg(t, K.corte - 0.25, K.corte + 0.05); strat.userData.arms[1].rotation.set(-1.4 * Math.sin(Math.min(1, cut) * Math.PI), -0.6 * cut, 0.3 + 1.2 * cut * (1 - cut) * 4);
      strat.userData.head.rotation.x = 0.35 * sm(seg(t, K.bastava - 0.3, K.bastava + 0.2)) * (1 - go);
      strat.updateMatrixWorld(); strat.userData.arms[0].userData.dedo.getWorldPosition(v); v.y += 0.08;
      const hit = Math.max(0, 1 - Math.abs(t - (K.parou - 0.1)) / 0.35) * 0.4 + Math.max(0, 1 - Math.abs(t - K.dedo1) / 0.4);
      ring.position.copy(v); ring.lookAt(camera.position); hitG.position.copy(v); hitG.material.opacity = 0.9 * Math.min(1, hit + (t > K.parou - 0.1 && t < K.dedo1 + 0.6 ? 0.5 : 0)); ring.scale.setScalar(0.2 + 1.6 * seg(t, K.dedo1 - 0.1, K.dedo1 + 0.6)); ring.material.opacity = 0.9 * hit;
      for (let i = 0; i < 80; i++) { const ph = ((t - K.parou) * 1.4 + hash(i)) % 1; const a = hash(i + 4) * Math.PI * 2, r = ph * (0.5 + hash(i + 5)); sparks.pos[i * 3] = v.x + Math.cos(a) * r; sparks.pos[i * 3 + 1] = v.y + Math.sin(a) * r * 0.8 - ph * ph * 0.6; sparks.pos[i * 3 + 2] = v.z + (hash(i + 6) - 0.5) * 0.3; }
      sparks.upd(); sparks.pts.material.opacity = 0.9 * Math.min(1, hit + (t > K.parou - 0.1 && t < K.dedo1 + 0.4 ? 0.6 : 0));
      arc.material.opacity = 0.95 * Math.max(0, 1 - Math.abs(t - K.corte) / 0.25); arc.rotation.set(0.2, 0, -0.6 + cut * 1.6);
      pillar.material.opacity = 0.35 * go;
    },
    cam(t) { const s = T.sc["s2-dedo"]; return keys(t, [[s[0], [3.4, 2.7, 6.8], [0, 1.6, 0]], [K.atacou1, [2.8, 1.9, 5.0], [0, 1.5, 0.8]], [K.parou - 0.25, [-3.5, 2.75, 0.25], [-0.1, 2.55, -0.25]], [K.dedo1 + 0.3, [-3.4, 2.7, 0.2], [-0.1, 2.55, -0.25]], [K.corte - 0.25, [3.0, 2.0, 3.6], [0, 1.2, 0.3]], [K.bastava, [0.75, 0.75, 2.9], [0, 1.85, -0.9]], [K.embora - 0.2, [0.8, 0.8, 3.1], [0, 1.9, -1.4]], [s[1], [1.3, 1.7, 5.2], [0, 1.8, -2.8]]]); },
  };
});

// 3 · o plano: num escritório à luz de velas, ele move as peças de um tabuleiro pequeno
addSet("s3-plano", (g) => {
  g.add(floorP(10, 10, M(0xffffff, { map: rep(planks("#3a2a1c", "#33241a"), 5, 5) })));
  mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshToonMaterial({ map: rep(stoneTex("#3a3238", "#332c32", "#1a161a"), 4, 2), gradientMap: grad }), 0, 2.5, -2.4, g);
  const spines = canvasTex(256, 256, (c) => { const cols = ["#6a1a2a", "#1a3a5a", "#2a5a3a", "#5a4a1a", "#3a1a5a", "#7a5a3a"]; for (let r = 0; r < 4; r++) { c.fillStyle = "#2a1a12"; c.fillRect(0, r * 64, 256, 64); for (let x = 4; x < 252;) { const w2 = 8 + hash(x + r * 31) * 14; c.fillStyle = cols[Math.floor(hash(x * 3 + r) * 6)]; c.fillRect(x, r * 64 + 10 + hash(x + r) * 10, w2 - 2, 54 - hash(x + r) * 10); x += w2; } } });
  [-3.0, 3.0].forEach((x) => { ol(mesh(box(2.2, 3.2, 0.5), M(0x3a2414), x, 1.6, -2.15, g), 0.02); mesh(new THREE.PlaneGeometry(2.0, 3.0), new THREE.MeshToonMaterial({ map: spines, gradientMap: grad }), x, 1.6, -1.89, g); });
  const win = mesh(new THREE.PlaneGeometry(1.4, 1.8), new THREE.MeshBasicMaterial({ map: skyTex([[0, "#0a0818"], [1, "#2a2050"]]) }), 0, 2.6, -2.38, g); luaCrescente(g, 0.25, 2.85, -2.37, 0.7);
  ol(mesh(box(1.5, 0.08, 1.9), M(0x2a1a10), 0, 2.6, -2.36, g), 0.01);
  ol(mesh(box(2.2, 0.08, 1.4), M(0x5a3a22), 0, 0.9, 0.0, g), 0.01); [[-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]].forEach(([x, z]) => mesh(box(0.08, 0.88, 0.08), M(0x3a2414), x, 0.44, z, g));
  const mini = tabuleiro(g, 8, 0.12, false); mini.b.position.set(0, 0.97, 0.1);
  const at = (i, j) => { const p = mini.at(i, j); return new THREE.Vector3(p[0], 1.02, p[2] + 0.1); };
  const knight = peca("cavalo", "b", 0.11); knight.position.copy(at(3, 6)); g.add(knight); const kg = glowSprite(0xffa040, 0.25, 0.6); g.add(kg);
  const foes = [[1, 1], [5, 0], [6, 2]].map(([i, j], k) => { const p = peca(["peao", "bispo", "torre"][k], "p", 0.1); p.position.copy(at(i, j)); g.add(p); return { p, from: at(i, j), to: at(3 + (k - 1) * 1, 5) }; });
  [["rei", "p", 4, 0], ["rainha", "p", 3, 0], ["peao", "b", 2, 7], ["torre", "b", 7, 7]].forEach(([tp, c, i, j]) => { const p = peca(tp, c, 0.1); p.position.copy(at(i, j)); g.add(p); });
  const cdl = [[-0.85, 0.35], [0.85, 0.4], [0.7, -0.45]].map(([x, z]) => { mesh(cyl(0.035, 0.035, 0.22, 10), M(0xf2efe6), x, 1.05, z, g); const f = glowSprite(0xffc070, 0.35, 0.9); f.position.set(x, 1.21, z); g.add(f); return f; });
  const CL = new THREE.PointLight(0xffa860, 7, 7); CL.position.set(0, 1.4, 0.4); g.add(CL);
  const strat = estrategista(); g.add(strat); const fios = fiosDe(g, 3);
  const v = new THREE.Vector3();
  return {
    bg: 0x0e0a10, fog: [10, 40],
    update(t) {
      const s = T.sc["s3-plano"]; cdl.forEach((f, i) => f.scale.setScalar(0.35 * (0.9 + 0.1 * Math.sin(t * 13 + i * 2)))); CL.intensity = 6.5 + Math.sin(t * 11) * 0.6;
      strat.position.set(0, 0, -0.95); strat.rotation.y = 0; pReset(strat); pIdle(strat, t); pose(strat); strat.userData.body.rotation.x = 0.18;
      strat.userData.arms[1].rotation.set(-1.15, 0, 0.25); strat.userData.arms[0].rotation.set(-0.5, 0, -0.1); pEyesGlow(strat, 0.4 + 0.6 * sm(seg(t, K.observava - 0.3, K.observava + 0.3)));
      strat.updateMatrixWorld(); strat.userData.arms[1].children[1].getWorldPosition(v);
      const ts = [K.inimigo, K.treino, K.luta]; let pow = 0;
      foes.forEach((o, k) => { const mv = sm(seg(t, ts[k] - 0.5, ts[k] - 0.05)), tip = sm(seg(t, ts[k], ts[k] + 0.35)); o.p.position.lerpVectors(o.from, o.to, mv); o.p.position.y += Math.sin(mv * Math.PI) * 0.06; o.p.rotation.set(0, 0, tip * 1.45); if (t > ts[k]) pow++; });
      kg.position.set(knight.position.x, knight.position.y + 0.12, knight.position.z); kg.scale.setScalar(0.25 + pow * 0.12); kg.material.opacity = 0.5 + pow * 0.15;
      fios(t, v, foes.map((o) => new THREE.Vector3(o.p.position.x, o.p.position.y + 0.16, o.p.position.z)), [0.08, 0.08, 0.08], 1);
    },
    cam(t) { const s = T.sc["s3-plano"]; return keys(t, [[s[0], [1.6, 2.0, 2.9], [0, 1.55, -0.3]], [K.observava - 0.2, [0.8, 2.25, 2.3], [0, 2.0, -0.95]], [K.nasceu, [0.75, 2.22, 2.15], [0, 2.0, -0.95]], [K.inimigo - 0.35, [0.35, 1.55, 1.15], [-0.06, 1.0, 0.33]], [K.luta + 0.4, [0.3, 1.52, 1.1], [-0.06, 1.0, 0.33]], [K.plano2 - 0.2, [1.5, 2.45, 3.1], [0, 1.95, -0.4]], [s[1], [1.6, 2.5, 3.3], [0, 1.95, -0.4]]]); },
  };
});

// 4 · keys: sob uma aurora violeta, ele distribui cartões de keys pelo tabuleiro
addSet("s4-keys", (g) => {
  mundo(g, { lua: [16, 12, -70], luaSize: 16, seed: 7 });
  const aur = []; for (let i = 0; i < 6; i++) { const a = mesh(new THREE.PlaneGeometry(14, 30), new THREE.MeshBasicMaterial({ map: softTex, color: i % 2 ? 0x7a4aff : 0x3affb0, transparent: true, opacity: 0.22, blending: ADD, depthWrite: false, fog: false }), -30 + i * 12, 22, -60, g); aur.push(a); }
  const T2 = tabuleiro(g);
  [["torre", "p", 0, 0], ["rei", "p", 7, 1], ["bispo", "b", 0, 7], ["cavalo", "b", 7, 6]].forEach(([tp, c, i, j]) => { const p = peca(tp, c, 1.55); p.position.set(...T2.at(i, j)); g.add(p); });
  const strat = estrategista(); dedoNaMao(strat); g.add(strat);
  const cards = []; for (let i = 0; i < 9; i++) { const c = carta(); g.add(c); cards.push(c); }
  const coins = []; for (let i = 0; i < 16; i++) { const c = mesh(cyl(0.08, 0.08, 0.015, 16), GOLD, 0, 0, 0, g); coins.push(c); }
  const L1 = new THREE.PointLight(0x9a6aff, 4, 9); L1.position.set(0.8, 3, 1.5); g.add(L1);
  const v = new THREE.Vector3();
  return {
    bg: 0x07060c, fog: [30, 140],
    update(t) {
      const s = T.sc["s4-keys"]; aur.forEach((a, i) => { a.position.x = -30 + i * 12 + Math.sin(t * 0.5 + i) * 2; a.material.opacity = 0.16 + 0.08 * Math.sin(t * 0.9 + i * 1.7); a.scale.y = 1 + 0.1 * Math.sin(t * 0.7 + i); });
      strat.position.set(0, 0.08, -1.0); strat.rotation.y = 0; pReset(strat); pIdle(strat, t); pose(strat);
      const pt = sm(seg(t, K.bio - 0.5, K.bio)) * (1 - sm(seg(t, K.sinistra - 0.6, K.sinistra - 0.2)));
      strat.userData.arms[0].rotation.set(-2.7 * pt - 0.3 * (1 - pt), 0, -0.1); strat.userData.arms[0].userData.dedo.visible = pt > 0.4;
      const toss = Math.sin(t * 5) * 0.25; strat.userData.arms[1].rotation.set(-1.1 + toss, 0, 0.35); pEyesGlow(strat, 0.5);
      strat.updateMatrixWorld(); strat.userData.arms[1].children[1].getWorldPosition(v);
      cards.forEach((c, i) => { const t0 = s[0] + 0.2 + i * 0.32, k = seg(t, t0, t0 + 1.1); const sq = T2.at(1 + (i % 4) * 2 - (i > 3 ? 1 : 0), 2 + Math.floor(i / 4) * 2);
        c.visible = t > t0; c.position.set(lerp(v.x, sq[0], k), lerp(v.y, 0.2, k) + Math.sin(k * Math.PI) * 1.4, lerp(v.z, sq[2] * 0.5, k)); c.rotation.set(-Math.PI / 2 * k + (1 - k) * Math.sin(t * 8 + i), (1 - k) * t * 6 + i, 0); });
      coins.forEach((c, i) => { const ph = ((t - K.steam) * 0.8 + hash(i)) % 1; c.visible = t > K.steam - 0.1; c.position.set((hash(i + 3) - 0.5) * 4, 4.5 - ph * 4.5, -0.4 + (hash(i + 4) - 0.5) * 2); c.rotation.set(t * 6 + i, t * 3, 0); });
    },
    cam(t) { const s = T.sc["s4-keys"]; return keys(t, [[s[0], [0.25, 2.15, 4.6], [0, 1.85, -1.0]], [s[1], [0.15, 2.05, 3.9], [0, 1.9, -1.0]]]); },
  };
});

// 5 · o laboratório: a criatura de máscara escapa do tanque e a luz dela vai até um berço
addSet("s5-lab", (g) => {
  const grid = canvasTex(256, 256, (c) => { c.fillStyle = "#1a1c22"; c.fillRect(0, 0, 256, 256); c.strokeStyle = "#2c3038"; c.lineWidth = 4; for (let i = 0; i <= 256; i += 64) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.moveTo(0, i); c.lineTo(256, i); c.stroke(); } });
  g.add(floorP(30, 30, new THREE.MeshStandardMaterial({ map: rep(grid, 12, 12), roughness: 0.4, metalness: 0.5 })));
  mesh(new THREE.PlaneGeometry(30, 8), STD(0x16181e, 0.7, 0.3), 0, 4, -5, g);
  for (let i = 0; i < 5; i++) { const pp = mesh(cyl(0.12, 0.12, 30, 10), STD(0x3a3e48, 0.4, 0.7), 0, 5.2 + i * 0.35, -4.6, g); pp.rotation.z = Math.PI / 2; ol(pp, 0.005); }
  const glass = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const tanque = (x, z, s2) => { const tg = new THREE.Group(); tg.position.set(x, 0, z); g.add(tg); ol(mesh(cyl(0.8 * s2, 0.9 * s2, 0.3, 24), STD(0x2a2e36, 0.4, 0.7), 0, 0.15, 0, tg), 0.01); ol(mesh(cyl(0.8 * s2, 0.8 * s2, 0.25, 24), STD(0x2a2e36, 0.4, 0.7), 0, 3.4 * s2 + 0.3, 0, tg), 0.01);
    const liq = mesh(cyl(0.72 * s2, 0.72 * s2, 3.1 * s2, 24), new THREE.MeshBasicMaterial({ color: 0x3affb0, transparent: true, opacity: 0.18, blending: ADD, depthWrite: false }), 0, 0.3 + 1.55 * s2, 0, tg); const gl = mesh(cyl(0.76 * s2, 0.76 * s2, 3.1 * s2, 24, 1, true), glass, 0, 0.3 + 1.55 * s2, 0, tg);
    const lg = glowSprite(0x3affb0, 2.4 * s2, 0.35); lg.position.set(0, 1.9 * s2, 0); tg.add(lg); return { tg, liq, gl, lg }; };
  [[-3.4, -2.6], [3.4, -2.6], [-5.6, -1.2], [5.6, -1.2], [-2.2, -4.2], [2.2, -4.2]].forEach(([x, z]) => tanque(x, z, 0.85));
  const big = tanque(0, -1.6, 1.15);
  const cria = new THREE.Group(); g.add(cria); const dark = STD(0x14121a, 0.5);
  ol(mesh(cap(0.32, 1.1), dark, 0, 1.2, 0, cria), 0.012); [-1, 1].forEach((k) => { const a = mesh(cap(0.09, 0.8), dark, 0.42 * k, 1.35, 0, cria); a.rotation.z = 0.35 * k; ol(a, 0.008); const l = mesh(cap(0.11, 0.7), dark, 0.16 * k, 0.45, 0, cria); ol(l, 0.008); });
  const mk = mascara(1.1); mk.position.set(0, 2.15, 0.06); cria.add(mk);
  const shards = flowPts(160, 0xdff6ff, 0.07, NORM); g.add(shards.pts);
  const stream = flowPts(140, 0xe8d0ff, 0.08); g.add(stream.pts);
  const berco = new THREE.Group(); berco.position.set(2.4, 0, 1.0); g.add(berco); ol(mesh(new THREE.SphereGeometry(0.55, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0x8a5a32), 0, 0.75, 0, berco), 0.01).scale.set(1.4, 0.7, 1);
  [-1, 1].forEach((k) => ol(mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 20, Math.PI), M(0x6a4428), 0.7 * k, 0.4, 0, berco), 0.005).rotation.set(0, Math.PI / 2, 0));
  const bg2 = glowSprite(0xffb060, 1.2, 0.5); bg2.position.set(0, 0.95, 0); berco.add(bg2); const bv = glowSprite(0xb07aff, 1.6, 0); bv.position.set(0, 1.0, 0); berco.add(bv);
  const strat = estrategista(); g.add(strat);
  const LG = new THREE.PointLight(0x3affb0, 6, 10); LG.position.set(0, 2.5, -0.6); g.add(LG); const LW = new THREE.PointLight(0xffb060, 0, 5); LW.position.set(2.4, 1.6, 1.4); g.add(LW);
  const P0 = new THREE.Vector3(0, 2.0, -1.6), P1 = new THREE.Vector3(1.3, 3.2, 0.2), P2 = new THREE.Vector3(2.4, 1.0, 1.0);
  return {
    bg: 0x0a0c10, fog: [12, 45],
    update(t) {
      const s = T.sc["s5-lab"], br = seg(t, K.atacou4 - 0.25, K.atacou4 + 1.2), out = sm(seg(t, K.atacou4, K.passou - 0.2)), inn = sm(seg(t, K.passou - 0.6, K.filho + 0.2));
      cria.position.set(0, -0.1 + Math.sin(t * 1.2) * 0.08 + out * 0.6, -1.6 + out * 0.9); cria.rotation.y = Math.sin(t * 0.7) * 0.2; cria.scale.setScalar(Math.max(0.001, 1 - out)); cria.visible = out < 0.99;
      big.gl.visible = t < K.atacou4 - 0.2; big.liq.scale.y = Math.max(0.001, 1 - sm(br) * 0.95); big.liq.position.y = 0.3 + 1.55 * 1.15 * big.liq.scale.y;
      for (let i = 0; i < 160; i++) { const k = Math.min(1, br * 1.6); const a = hash(i) * Math.PI * 2, r = 0.8 + k * (1 + hash(i + 1) * 3); shards.pos[i * 3] = Math.cos(a) * r; shards.pos[i * 3 + 1] = Math.max(0.05, 0.4 + hash(i + 2) * 3.4 + Math.sin(k * Math.PI) * 0.8 - k * k * 3); shards.pos[i * 3 + 2] = -1.6 + Math.sin(a) * r; }
      shards.upd(); shards.pts.material.opacity = br > 0 && br < 1 ? 0.9 : 0;
      const tmp = new THREE.Vector3(); for (let i = 0; i < 140; i++) { const u = ((t - K.atacou4) * 0.45 + hash(i)) % 1; const q = 1 - u; tmp.set(q * q * P0.x + 2 * q * u * P1.x + u * u * P2.x, q * q * P0.y + 2 * q * u * P1.y + u * u * P2.y, q * q * P0.z + 2 * q * u * P1.z + u * u * P2.z);
        stream.pos[i * 3] = tmp.x + (hash(i + 3) - 0.5) * 0.2; stream.pos[i * 3 + 1] = tmp.y + (hash(i + 4) - 0.5) * 0.2; stream.pos[i * 3 + 2] = tmp.z; }
      stream.upd(); stream.pts.material.opacity = 0.85 * sm(seg(t, K.atacou4, K.atacou4 + 0.5)) * (1 - sm(seg(t, K.filho, K.seja)));
      bv.material.opacity = 0.75 * inn; bg2.scale.setScalar(1.2 + inn * 0.8); LW.intensity = 2 + 5 * inn;
      strat.position.set(-2.0, 0, -2.4); strat.rotation.y = 0.55; pReset(strat); pIdle(strat, t); pose(strat); pEyesGlow(strat, 0.3 + 0.7 * sm(seg(t, K.nasceu4 - 0.3, K.nasceu4 + 0.3)));
    },
    cam(t) { const s = T.sc["s5-lab"]; return keys(t, [[s[0], [0.7, 2.3, 5.6], [0, 1.8, -1.6]], [K.laboratorio, [0.3, 2.1, 2.6], [0, 1.9, -1.6]], [K.atacou4 + 0.3, [1.3, 2.1, 4.8], [0.6, 1.6, -0.6]], [K.passou - 0.1, [3.2, 1.7, 3.6], [2.2, 0.85, 0.9]], [K.seja, [3.1, 1.65, 3.4], [2.3, 0.9, 0.95]], [K.nasceu4 - 0.3, [-0.7, 2.05, 0.4], [-2.0, 1.95, -2.4]], [s[1], [-0.8, 2.05, 0.6], [-2.0, 2.0, -2.4]]]); },
  };
});

// 6 · o experimento mais valioso: ele observa o espadachim por uma lente; um peão tenta capturar e ele puxa de volta
addSet("s6-experimento", (g) => {
  mundo(g, { lua: [-20, 14, -70], luaSize: 18, seed: 11 });
  const TB = tabuleiro(g);
  [["torre", "p", 0, 0], ["rei", "p", 4, 0], ["bispo", "b", 7, 7], ["rainha", "b", 0, 7]].forEach(([tp, c, i, j]) => { const p = peca(tp, c, 1.55); p.position.set(...TB.at(i, j)); g.add(p); });
  const pawn = peca("peao", "p", 1.55); g.add(pawn); const pFrom = new THREE.Vector3(...TB.at(5, 3)), pTo = new THREE.Vector3(...TB.at(4, 4));
  const strat = estrategista(); g.add(strat); const hero = espadachim(); g.add(hero);
  const sw = espada(g); const aura = auraFogo(g, 14);
  const lente = new THREE.Group(); g.add(lente); ol(mesh(new THREE.TorusGeometry(0.22, 0.025, 10, 40), GOLD, 0, 0, 0, lente), 0.005); mesh(new THREE.CircleGeometry(0.21, 32), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide }), 0, 0, 0, lente); mesh(cyl(0.02, 0.02, 0.3, 8), GOLD, 0, -0.36, 0, lente);
  const fios = fiosDe(g, 1); const L2 = new THREE.PointLight(0xffa040, 7, 8); g.add(L2); const L1 = new THREE.PointLight(0x9a6aff, 3, 8); g.add(L1);
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  return {
    bg: 0x07060c, fog: [30, 140],
    update(t) {
      const s = T.sc["s6-experimento"];
      hero.position.set(1.0, 0.08, 1.2); hero.rotation.y = -2.5; // de frente pro estrategista pReset(hero); pIdle(hero, t, 2); serio(hero);
      hero.userData.arms[0].rotation.set(-1.25, 0, -0.15); hero.updateMatrixWorld(); hero.userData.arms[0].children[1].getWorldPosition(w); sw.b.position.copy(w); sw.b.rotation.set(0.15, -2.5, 0.12);
      const pw = 0.7 + 0.3 * sm(seg(t, s[0], K.valioso)); sw.glow(pw, t); aura(t, v.set(1.0, 1.4, 1.2), pw); L2.position.set(1.0, 1.9, 1.4);
      strat.position.set(-1.6, 0.08, -2.4); strat.rotation.y = 0.55; pReset(strat); pIdle(strat, t); pose(strat); strat.userData.arms[0].rotation.set(-1.75, 0, 0.35);
      strat.updateMatrixWorld(); strat.userData.arms[0].children[1].getWorldPosition(v); lente.position.set(v.x + 0.05, v.y + 0.3, v.z + 0.1); lente.lookAt(1.0, 1.6, 1.2);
      const pull = sm(seg(t, K.jogar - 0.3, K.jogar + 0.4)), adv = sm(seg(t, K.matar - 0.3, K.matar + 0.5)) * (1 - pull);
      pawn.position.lerpVectors(pFrom, pTo, adv); pawn.position.y += Math.sin(adv * Math.PI) * 0.2;
      strat.userData.arms[1].rotation.set(-1.4 * Math.max(adv, pull), 0, 0.4); strat.userData.arms[1].children[1].getWorldPosition(v); L1.position.set(v.x, v.y + 0.8, v.z);
      fios(t, v, [new THREE.Vector3(pawn.position.x, pawn.position.y + 2.3, pawn.position.z)], [0.3], sm(seg(t, K.matar - 0.1, K.matar + 0.3)));
      pEyesGlow(strat, 0.4 + 0.6 * sm(seg(t, K.plano5 - 0.3, K.plano5 + 0.2)));
    },
    cam(t) { const s = T.sc["s6-experimento"]; return keys(t, [[s[0], [-2.2, 2.55, -0.9], [1.0, 1.7, 1.2]], [K.valioso + 0.4, [-2.0, 2.5, -1.2], [1.0, 1.75, 1.2]], [K.matar - 0.25, [4.4, 2.9, 4.6], [1.6, 1.0, 0.6]], [K.jogar + 0.4, [4.2, 2.8, 4.4], [1.4, 1.1, 0.5]], [K.plano5 - 0.2, [-0.4, 2.3, -0.4], [-1.6, 2.0, -2.4]], [s[1], [-0.5, 2.3, -0.3], [-1.6, 2.05, -2.4]]]); },
  };
});

// 7 · a solidão: o golpe final ao amanhecer; depois ele sozinho no tabuleiro vazio; duas peças da mesma altura
addSet("s7-solidao", (g) => {
  const ceu = plane(260, 120, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#0e0a1e"], [0.6, "#4a2a5a"], [1, "#e8b080"]]), fog: false })); ceu.position.set(0, 28, -90); g.add(ceu);
  g.add(dustPts(200, [-60, 60, 10, 60, -88, -80], 0xffffff, 0.2, 0.6, ADD, 5)); luaCrescente(g, 18, 6, -80, 16, 0xffd8b0); deserto(g, 0xe2d6cc);
  const TB = tabuleiro(g);
  const sand = flowPts(260, 0xf2e6d8, 0.06, NORM); g.add(sand.pts);
  const strat = estrategista(); g.add(strat); const hero = espadachim(); g.add(hero);
  const sw = espada(g, 0xffd080); const aura = auraFogo(g, 16, 0xffc060);
  const beam = mesh(new THREE.CylinderGeometry(0.35, 0.9, 5, 20, 1, true), glowM(0xfff0c8, 0), 0, 1.4, 0.3, g); beam.rotation.x = Math.PI / 2;
  const flash = glowSprite(0xfff4e0, 6, 0); g.add(flash);
  const cracks = []; for (let i = 0; i < 9; i++) { const c = mesh(box(0.02, 0.22 + hash(i) * 0.2, 0.01), glowM(0xffe8b0, 0), 0, 0, 0, g); cracks.push(c); }
  const rei = peca("rei", "b", 1.55), cav = peca("cavalo", "b", 1.55); g.add(rei, cav); const rg = glowSprite(0xb07aff, 3, 0), cg = glowSprite(0xffa040, 3, 0); g.add(rg, cg);
  const v = new THREE.Vector3();
  return {
    bg: 0x1a1226, fog: [34, 150],
    update(t) {
      const s = T.sc["s7-solidao"];
      for (let i = 0; i < 260; i++) { const ph = (t * 0.25 + hash(i)) % 1; sand.pos[i * 3] = -14 + ph * 28; sand.pos[i * 3 + 1] = 0.1 + hash(i + 1) * 2.4 + Math.sin(t * 2 + i) * 0.1; sand.pos[i * 3 + 2] = -8 + hash(i + 2) * 14; } sand.upd(); sand.pts.material.opacity = 0.5;
      const gone = sm(seg(t, K.solidao - 0.6, K.solidao + 0.2)); hero.visible = gone < 0.99; sw.b.visible = hero.visible;
      hero.position.set(0, 0.08, 2.3); hero.rotation.y = Math.PI; pReset(hero); pIdle(hero, t, 2); serio(hero);
      const sl = sm(seg(t, K.venceu - 0.5, K.venceu - 0.05)); hero.userData.arms[0].rotation.set(-2.6 + 1.8 * sl, 0, -0.15); hero.updateMatrixWorld(); hero.userData.arms[0].children[1].getWorldPosition(v);
      sw.b.position.copy(v); sw.b.rotation.set(-0.3 - 1.3 * sl, 0, 0); sw.glow(1, t); aura(t, v.set(0, 1.4, 2.3), (1 - gone) * 1.2);
      const hit = Math.max(0, 1 - Math.abs(t - K.venceu) / 0.5); beam.material.opacity = 0.85 * hit; flash.position.set(0, 1.6, -1.2); flash.material.opacity = 0.95 * Math.max(0, 1 - Math.abs(t - (K.venceu + 0.1)) / 0.35);
      const kn = sm(seg(t, K.venceu + 0.1, K.venceu + 0.9)) * (1 - sm(seg(t, K.queria - 0.5, K.queria + 0.3)));
      strat.position.set(0, 0.08, -1.6); strat.rotation.y = 0; pReset(strat); pIdle(strat, t); pose(strat);
      strat.userData.body.position.y -= 0.42 * strat.userData.s * kn; strat.userData.legs.forEach((l, i) => (l.rotation.x = (i ? 1.1 : -0.2) * kn)); strat.userData.head.rotation.x = 0.35 * kn;
      strat.userData.smile.visible = t < K.venceu; strat.userData.eyes.forEach((e) => e.e.scale.set(1, t > K.sentiu ? 0.25 : 0.45, 1)); pEyesGlow(strat, t < K.venceu ? 0.5 : 0);
      strat.updateMatrixWorld(); cracks.forEach((c, i) => { strat.userData.torso.getWorldPosition(v); c.position.set(v.x + (hash(i) - 0.5) * 0.5, v.y + (hash(i + 3) - 0.3) * 0.7, v.z + 0.32); c.rotation.z = (hash(i + 5) - 0.5) * 2; c.material.opacity = 0.9 * sm(seg(t, K.venceu, K.venceu + 0.3)) * (1 - sm(seg(t, K.solidao, K.fas))); });
      const rise = sm(seg(t, K.queria - 0.4, K.altura + 0.2)); rei.position.set(-1.6, lerp(-5, 0.08, rise), -0.6); cav.position.set(1.6, lerp(-5, 0.08, rise), -0.6); cav.scale.setScalar(1.25); cav.rotation.y = -0.6; rei.rotation.y = 0.5;
      rg.position.set(-1.6, 2.2, -0.6); cg.position.set(1.6, 2.2, -0.6); rg.material.opacity = 0.6 * rise; cg.material.opacity = 0.6 * rise;
    },
    cam(t) { const s = T.sc["s7-solidao"]; return keys(t, [[s[0], [3.6, 2.4, 5.2], [0, 1.6, 0.3]], [K.venceu - 0.2, [2.8, 2.0, 3.9], [0, 1.6, -0.6]], [K.sentiu, [0.9, 1.6, 0.0], [0, 1.4, -1.6]], [K.solidao, [0.8, 1.7, 0.3], [0, 1.25, -1.6]], [K.fas, [7.0, 11.0, 9.0], [0, 0.5, -1.6]], [K.queria - 0.2, [5.0, 6.5, 7.0], [0, 1.4, -1.2]], [s[1], [4.6, 5.4, 6.6], [0, 1.7, -1.0]]]); },
  };
});

// 8 · o fim: acorrentado, ele confunde o rei negro com cacos de espelho; o espadachim corta
addSet("s8-final", (g) => {
  const ceu = plane(260, 120, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#05030a"], [0.7, "#2a0a14"], [1, "#6a1a1a"]]), fog: false })); ceu.position.set(0, 28, -90); g.add(ceu);
  g.add(dustPts(300, [-30, 30, 0, 20, -40, 10], 0xff6a4a, 0.08, 0.7, ADD, 13));
  const TB = tabuleiro(g, 8, 1.4);
  const boss = peca("rei", "p", 4.0); boss.position.set(0, 0.08, -4.4); g.add(boss);
  const back = glowSprite(0xff2a1a, 26, 0.55); back.material.fog = false; back.position.set(0, 7, -12); g.add(back); const rimR = new THREE.DirectionalLight(0xff4a3a, 1.6); rimR.position.set(0, 8, -14); g.add(rimR); // contraluz vermelha pro rei negro
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const sp = mesh(new THREE.ConeGeometry(0.18, 1.2, 8), ONYX, Math.cos(a) * 0.95, 7.7, -4.4 + Math.sin(a) * 0.95, g); sp.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); }
  const eyes = [-1, 1].map((k) => { const e = glowSprite(0xff2a1a, 1.4, 0.95); e.position.set(0.32 * k, 5.6, -3.5); g.add(e); return e; });
  const ghosts = [-1, 1].map((k) => { const gh = peca("rei", "p", 4.0); gh.traverse((o) => { if (o.material && o.material !== outlineMat) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.3; } }); gh.position.set(3.5 * k, 0.08, -4.4); g.add(gh); return gh; });
  const chair = new THREE.Group(); chair.position.set(-3.4, 0.08, 1.2); chair.rotation.y = 0.5; g.add(chair); ol(mesh(box(1.1, 0.2, 1.0), STD(0x2a2632, 0.6), 0, 0.55, 0, chair), 0.01); ol(mesh(box(1.1, 2.6, 0.2), STD(0x2a2632, 0.6), 0, 1.75, -0.45, chair), 0.01);
  const strat = estrategista(); chair.add(strat); strat.position.set(0, 0.1, -0.05);
  const bands = []; for (let i = 0; i < 5; i++) { const b2 = mesh(new THREE.TorusGeometry(0.42, 0.03, 8, 32), glowM(0xb07aff, 0.8), 0, 0.7 + i * 0.35, -0.05, chair); b2.rotation.x = Math.PI / 2; bands.push(b2); }
  const shards = []; for (let i = 0; i < 14; i++) { const sh = mesh(new THREE.PlaneGeometry(0.5, 0.8), new THREE.MeshStandardMaterial({ color: 0xd8f0ff, roughness: 0.05, metalness: 1.0, side: THREE.DoubleSide, emissive: 0x3a4a6a }), 0, 0, 0, g); shards.push(sh); }
  const hero = espadachim(); g.add(hero); const sw = espada(g); const aura = auraFogo(g, 12);
  const arc = mesh(new THREE.TorusGeometry(3.0, 0.08, 6, 40, Math.PI * 0.9), glowM(0xffc060, 0), 0, 5, -3.2, g);
  const frags = flowPts(220, 0x2a2232, 0.16, NORM); g.add(frags.pts); const bflash = glowSprite(0xffd890, 14, 0); bflash.position.set(0, 6, -3.6); g.add(bflash);
  const v = new THREE.Vector3();
  return {
    bg: 0x0a0408, fog: [26, 110],
    update(t) {
      const s = T.sc["s8-final"]; const brk = seg(t, K.vencer - 0.15, K.vencer + 1.2);
      boss.visible = brk < 0.05; eyes.forEach((e) => (e.visible = boss.visible)); boss.rotation.y = Math.sin(t * 0.6) * 0.15 + sm(seg(t, K.proprio7, K.abriu)) * Math.sin(t * 7) * 0.12;
      const ill = sm(seg(t, K.proprio7 - 0.2, K.proprio7 + 0.5)); ghosts.forEach((gh, i) => { gh.visible = ill > 0.02 && brk < 0.05; gh.position.x = (i ? 1 : -1) * 3.5 * ill; gh.rotation.y = boss.rotation.y + (i ? 0.4 : -0.4); });
      pReset(strat); pIdle(strat, t); pose(strat); pEyesGlow(strat, 0.3 + 0.7 * ill); strat.userData.arms.forEach((a) => a.rotation.set(-0.2, 0, 0)); bands.forEach((b2, i) => (b2.material.opacity = 0.65 + 0.25 * Math.sin(t * 3 + i)));
      shards.forEach((sh, i) => { const a = t * 0.8 + (i / 14) * Math.PI * 2, r = lerp(1.5, 4.5, ill); sh.position.set(Math.cos(a) * r, 3 + Math.sin(t * 1.3 + i) * 1.5 + ill * 2, -4.4 + Math.sin(a) * r); sh.rotation.set(t + i, t * 0.7 + i, 0); sh.visible = brk < 0.3; });
      const jump = sm(seg(t, K.abriu - 0.5, K.abriu + 0.3)); hero.position.set(lerp(4.5, 1.2, jump), 0.08 + Math.sin(jump * Math.PI) * 3.2, lerp(2.5, -1.0, jump)); hero.rotation.y = -2.4; pReset(hero); pIdle(hero, t, 2); serio(hero);
      hero.userData.arms[0].rotation.set(-2.6 + 2.0 * sm(seg(t, K.abriu - 0.1, K.abriu + 0.2)), 0, -0.15); hero.updateMatrixWorld(); hero.userData.arms[0].children[1].getWorldPosition(v); sw.b.position.copy(v); sw.b.rotation.set(-0.6, -2.4, 0); sw.glow(1, t); aura(t, v.set(hero.position.x, hero.position.y + 1.3, hero.position.z), 1);
      arc.material.opacity = 0.95 * Math.max(0, 1 - Math.abs(t - (K.abriu + 0.1)) / 0.3); arc.rotation.set(0, 0, -0.8 + seg(t, K.abriu - 0.2, K.abriu + 0.4) * 1.4);
      for (let i = 0; i < 220; i++) { const k = brk; const a = hash(i) * Math.PI * 2, r = k * (2 + hash(i + 1) * 9); frags.pos[i * 3] = Math.cos(a) * r; frags.pos[i * 3 + 1] = 1 + hash(i + 2) * 10 + Math.sin(k * Math.PI) * 2 - k * k * 8; frags.pos[i * 3 + 2] = -4.4 + Math.sin(a) * r * 0.6; }
      frags.upd(); frags.pts.material.opacity = brk > 0 && brk < 1 ? 0.95 : 0; bflash.material.opacity = 0.9 * Math.max(0, 1 - Math.abs(t - K.vencer) / 0.4);
    },
    cam(t) { const s = T.sc["s8-final"]; return keys(t, [[s[0], [5.0, 2.2, 15.0], [0, 5.0, -3.5]], [K.proprio7 - 0.2, [-1.6, 2.4, 3.6], [-3.4, 2.2, 1.0]], [K.proprio7 + 0.6, [-1.5, 2.35, 3.4], [-3.3, 2.25, 0.9]], [K.abriu - 0.4, [5.4, 2.6, 15.2], [0, 4.6, -3.2]], [s[1], [5.6, 2.4, 15.6], [0, 4.2, -3.4]]]); },
  };
});

// 9 · pergunta: as duas peças frente a frente e os dois atrás delas, sob a lua
addSet("s9-pergunta", (g) => {
  mundo(g, { lua: [0, 16, -70], luaSize: 26, seed: 21 });
  const TB = tabuleiro(g);
  const rei = peca("rei", "b", 1.55), cav = peca("cavalo", "b", 1.55); rei.position.set(-1.0, 0.08, -0.4); cav.position.set(1.1, 0.08, 0.2); cav.scale.setScalar(1.2); rei.rotation.y = 0.6; cav.rotation.y = -2.3; g.add(rei, cav);
  const rg = glowSprite(0xb07aff, 3.2, 0.55), cg = glowSprite(0xffa040, 3.2, 0.55); rg.position.set(-1.0, 2.0, -0.4); cg.position.set(1.1, 2.0, 0.2); g.add(rg, cg);
  const strat = estrategista(); g.add(strat); const hero = espadachim(); g.add(hero); const sw = espada(g);
  const fogs = []; for (let i = 0; i < 10; i++) { const f = glowSprite(0xb8b0d8, 7, 0.25, NORM); g.add(f); fogs.push(f); }
  const v = new THREE.Vector3();
  return {
    bg: 0x07060c, fog: [26, 130],
    update(t) {
      fogs.forEach((f, i) => f.position.set(-12 + ((t * 0.5 + i * 2.6) % 24), 0.6, -6 + hash(i) * 10));
      strat.position.set(-2.0, 0.08, -2.4); strat.rotation.y = 0.6; pReset(strat); pIdle(strat, t); pose(strat); pEyesGlow(strat, 0.6);
      hero.position.set(2.2, 0.08, 1.6); hero.rotation.y = -2.3; pReset(hero); pIdle(hero, t, 2); serio(hero); hero.userData.arms[0].rotation.set(-1.2, 0, -0.15); hero.updateMatrixWorld(); hero.userData.arms[0].children[1].getWorldPosition(v); sw.b.position.copy(v); sw.b.rotation.set(0.15, -2.3, 0.12); sw.glow(0.7, t);
      rg.material.opacity = 0.45 + 0.15 * Math.sin(t * 2); cg.material.opacity = 0.45 + 0.15 * Math.sin(t * 2 + 1.5);
    },
    cam(t) { const s = T.sc["s9-pergunta"]; return keys(t, [[s[0], [4.2, 3.4, 10.5], [0, 1.6, -0.6]], [s[1], [-2.0, 3.2, 10.8], [0, 1.7, -0.6]]]); },
  };
});

// thumb: o mestre gigante ao fundo, sob a lua, puxando os fios do espadachim (de costas, como marionete)
addSet("thumb", (g) => {
  const ceu = plane(260, 140, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#05030c"], [0.55, "#1a0e36"], [1, "#3a1a5a"]]), fog: false })); ceu.position.set(0, 30, -90); g.add(ceu);
  g.add(dustPts(600, [-60, 60, 4, 60, -88, -60], 0xffffff, 0.24, 0.95, ADD, 31));
  luaCrescente(g, 0, 9.5, -64, 30, 0xc8b0ff);
  const halo = glowSprite(0x9a6aff, 22, 0.28); halo.material.fog = false; halo.position.set(0, 4.5, -12); g.add(halo);
  deserto(g, 0xb8b0d0);
  const TB = tabuleiro(g);
  const rei = peca("rei", "p", 1.55); rei.position.set(-1.65, 0.08, -2.3); rei.rotation.y = 0.4; g.add(rei);
  const torre = peca("torre", "b", 1.55); torre.position.set(1.75, 0.08, -2.0); g.add(torre);
  const mestre = estrategista(2.4); g.add(mestre);
  const hero = espadachim(1.0); g.add(hero); const sw = espada(g); const aura = auraFogo(g, 12);
  const fioM = new THREE.MeshBasicMaterial({ color: 0xd8b8ff, transparent: true, opacity: 0.95, blending: ADD, depthWrite: false });
  const tubos = []; const fioTubo = (a, b, sag) => { const mid = a.clone().lerp(b, 0.5); mid.y -= sag; const geo = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone()), 40, 0.018, 6, false); const m = new THREE.Mesh(geo, fioM); m.frustumCulled = false; g.add(m); tubos.push(m);
    for (let k = 1; k < 6; k++) { const q = new THREE.QuadraticBezierCurve3(a, mid, b).getPoint(k / 6); const bd = glowSprite(0xc89aff, 0.22, 0.9); bd.position.copy(q); g.add(bd); tubos.push(bd); } };
  const fog = []; for (let i = 0; i < 8; i++) { const f = glowSprite(0x8a7ab8, 9, 0.28, NORM); f.position.set(-12 + i * 3.4, 0.4, -5.5 - hash(i) * 3); g.add(f); fog.push(f); }
  const rimV = new THREE.DirectionalLight(0xb08aff, 1.4); rimV.position.set(0, 9, -40); g.add(rimV);
  const LA = new THREE.PointLight(0xffa040, 2.2, 3.5); g.add(LA); const LV = new THREE.PointLight(0x9a6aff, 3.5, 14); LV.position.set(0, 4, -4); g.add(LV);
  const v = new THREE.Vector3(), w = new THREE.Vector3(), a1 = new THREE.Vector3(), a2 = new THREE.Vector3();
  return {
    bg: 0x05030c, fog: [40, 160],
    update(t) {
      mestre.position.set(0, -1.25, -7.6); mestre.rotation.y = 0; pReset(mestre); pIdle(mestre, 0.4); pose(mestre); pEyesGlow(mestre, 1);
      mestre.userData.head.rotation.x = 0.28; mestre.userData.arms.forEach((a, i) => a.rotation.set(-1.05, 0, (i ? 1 : -1) * 0.55));
      mestre.updateMatrixWorld(); mestre.userData.arms[0].children[1].getWorldPosition(a1); mestre.userData.arms[1].children[1].getWorldPosition(a2);
      hero.position.set(0.8, 0.08, -0.3); hero.rotation.y = 0.35; // de frente pra câmera; o mestre atrás puxa os fios pReset(hero); pIdle(hero, 0.4, 2); serio(hero);
      hero.userData.head.rotation.x = 0.05; hero.userData.arms[0].rotation.set(-0.3, 0, -0.3); hero.userData.arms[1].rotation.set(-1.2, 0, 0.2);
      hero.updateMatrixWorld(); hero.userData.arms[1].children[1].getWorldPosition(w); sw.b.position.copy(w); sw.b.rotation.set(0.1, 0.35, -0.45); sw.glow(0.75, 0.4); aura(0.4, v.set(0.8, 1.3, -0.3), 0.55); LA.position.set(w.x, w.y + 0.4, w.z + 0.4);
      const hh = new THREE.Vector3(); hero.userData.head.getWorldPosition(hh); hh.y += 0.32; const hl = new THREE.Vector3(), hr = new THREE.Vector3(); hero.userData.arms[1].children[1].getWorldPosition(hl); hero.userData.arms[0].children[1].getWorldPosition(hr);
      const ombro = new THREE.Vector3(hh.x + 0.25, hh.y - 0.55, hh.z);
      if (!tubos.length) { fioTubo(a1, hh, 0.35); fioTubo(a1, hr, 0.45); fioTubo(a2, hl, 0.4); fioTubo(a2, ombro, 0.3); }
    },
    cam(t) { return { pos: [0.45, 2.55, 4.7], look: [-0.05, 2.35, -7.5] }; },
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
window.__hf.buildReady["aizen3d"] = (async () => {
  try { await document.fonts.load("700 48px 'Space Mono'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
