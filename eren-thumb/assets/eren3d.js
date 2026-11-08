// Cena 3D do vídeo de curiosidade "Por que o Eren destruiu 80% da humanidade?" (símbolos originais + fotos livres) (Three.js).
// Tudo é função do tempo t (hf-seek). Tempos-chave em window.HF_T (gerado por tools/build_eren.py).
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
const dustPts = (n, b, color = 0xffe6b0, size = 0.02) => { const p = []; for (let i = 0; i < n; i++) p.push(b[0] + hash(i) * (b[1] - b[0]), b[2] + hash(i + 7) * (b[3] - b[2]), b[4] + hash(i + 13) * (b[5] - b[4])); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.8, depthWrite: false })); };
const PHOTOS = {};
const photoLoader = new THREE.TextureLoader();
function photoPlane(key, w, h) {
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  (PHOTOS[key] = PHOTOS[key] || []).push(m);
  return p;
}
async function loadPhotos() {
  for (const key of Object.keys(PHOTOS)) {
    const tex = await photoLoader.loadAsync(`assets/img/${key}.jpg`);
    tex.colorSpace = THREE.SRGBColorSpace;
    PHOTOS[key].forEach((m) => { m.map = tex; m.needsUpdate = true; });
  }
}
// mapa-múndi estilizado (continentes inventados em blobs) com a mancha vermelha avançando
const mapState = { p: 0 };
const mapTex = canvasTex(1024, 512, (g, w, h) => {
  g.fillStyle = "#0b2a4a"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(120,180,255,.12)"; g.lineWidth = 2;
  for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  const blobs = [[180, 170, 120, 90], [250, 330, 70, 110], [500, 160, 110, 70], [530, 300, 80, 110], [720, 180, 170, 100], [820, 360, 80, 50], [400, 420, 40, 20]];
  const land = (fill) => { g.fillStyle = fill; blobs.forEach(([x, y, rx, ry], i) => { g.beginPath(); for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 2, r = 1 + 0.18 * Math.sin(a * 3 + i) + 0.1 * Math.cos(a * 5 + i * 2); const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.fill(); }); };
  land("#3f7a4a");
  g.save(); g.beginPath(); g.rect(0, 0, w * mapState.p, h); g.clip(); land("#c4122a"); g.restore();
  g.fillStyle = "#ffd27a"; g.beginPath(); g.arc(610, 255, 9, 0, 7); g.fill();
});
const mapRedraw = REDRAW[REDRAW.length - 1];
let lastMapP = -1;
function setMap(p) { p = Math.round(p * 100) / 100; if (p === lastMapP) return; mapState.p = p; lastMapP = p; mapRedraw(); }
function globe(r = 1.4) {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshToonMaterial({ map: mapTex, gradientMap: grad }));
  g.add(s); ol(s, 0.03);
  const atm = mesh(sph(r * 1.08, 32, 24), new THREE.MeshBasicMaterial({ color: 0x4ab0ff, transparent: true, opacity: 0.08, side: THREE.BackSide }), 0, 0, 0, g);
  return g;
}
function stoneGiant(seed = 0) { // gigante de pedra sem rosto (original)
  const g = new THREE.Group();
  const st = M([0x5a5550, 0x4a4642, 0x67615a][seed % 3]);
  const parts = [[0, 4.5, 0, 1.6, 3.2, 1.0], [0, 7.0, 0, 1.0, 1.2, 0.9], [-1.2, 4.6, 0, 0.6, 3.0, 0.6], [1.2, 4.6, 0, 0.6, 3.0, 0.6], [-0.5, 1.4, 0, 0.7, 2.8, 0.7], [0.5, 1.4, 0, 0.7, 2.8, 0.7]];
  const legs = [];
  parts.forEach(([x, y, z, w, h, d], i) => { const pivot = new THREE.Group(); pivot.position.set(x, y + h / 2, z); g.add(pivot); const m = mesh(new THREE.BoxGeometry(w, h, d, 2, 3, 2), st, 0, -h / 2, 0, pivot); m.rotation.set((hash(seed * 9 + i) - 0.5) * 0.1, 0, (hash(seed * 7 + i) - 0.5) * 0.1); ol(m, 0.05); if (i >= 4) legs.push(pivot); if (i === 2 || i === 3) legs.push(pivot); });
  // fendas que brilham
  for (let i = 0; i < 10; i++) mesh(box(0.08, 0.5 + hash(seed + i) * 0.8, 0.02), glowM(0xff6a2a, 0.8), (hash(seed * 3 + i) - 0.5) * 1.4, 3.4 + hash(seed * 5 + i) * 3, 0.52, g);
  g.userData = { legs };
  return g;
}
function oldKey(s = 1) {
  const g = new THREE.Group();
  const m = new THREE.MeshPhongMaterial({ color: 0xc9a227, specular: 0xffffff, shininess: 60 });
  const bow = mesh(new THREE.TorusGeometry(0.22 * s, 0.05 * s, 12, 28), m, 0, 0.5 * s, 0, g);
  mesh(cyl(0.035 * s, 0.035 * s, 0.9 * s, 12), m, 0, 0, 0, g);
  mesh(box(0.18 * s, 0.06 * s, 0.05 * s), m, 0.08 * s, -0.36 * s, 0, g); mesh(box(0.12 * s, 0.06 * s, 0.05 * s), m, 0.06 * s, -0.24 * s, 0, g);
  const ms = []; g.traverse((o) => { if (o.isMesh) ms.push(o); }); ms.forEach((o) => ol(o, 0.01 * s));
  return g;
}
function bird() {
  const g = new THREE.Group(); const m = M(0x15121a);
  mesh(sph(0.06, 8, 6), m, 0, 0, 0, g).scale.set(1.6, 0.6, 0.6);
  const wings = [-1, 1].map((s) => { const p = new THREE.Group(); g.add(p); const w = mesh(new THREE.PlaneGeometry(0.28, 0.08), new THREE.MeshBasicMaterial({ color: 0x15121a, side: THREE.DoubleSide }), 0.14 * s, 0, 0, p); return p; });
  g.userData = { wings }; return g;
}

// 1 · mapa vermelho
addSet("s1-mapa", (g) => {
  const gl = globe(1.5); gl.position.set(0, 2.2, 0); g.add(gl);
  const st = dustPts(400, [-10, 10, -6, 12, -14, -4], 0xffffff, 0.04); g.add(st);
  return {
    bg: 0x04060c,
    update(t) { gl.rotation.y = t * 0.15; gl.rotation.x = 0.25; setMap(0.8 * sm(seg(t, 0.3, K.pisoteou + 1.2))); },
    cam(t) { const s = T.sc["s1-mapa"]; return keys(t, [[s[0], [0, 2.2, 8.4], [0, 2.4, 0]], [s[1], [0, 2.2, 7.0], [0, 2.4, 0]]]); },
  };
});

// ilha cercada por muralha circular
function islandSet(g, storm = false) {
  const sea = floorP(80, 80, new THREE.MeshToonMaterial({ color: storm ? 0x1a2a3a : 0x1d5a8a, gradientMap: grad }), 0); g.add(sea);
  const waves = []; for (let i = 0; i < 40; i++) { const w = mesh(new THREE.TorusGeometry(0.4 + hash(i) * 0.8, 0.02, 4, 16, Math.PI), M(0xbfe0ff), (hash(i + 3) - 0.5) * 30, 0.02, -2 - hash(i + 5) * 26, g); w.rotation.x = -Math.PI / 2; waves.push(w); }
  const isl = new THREE.Group(); isl.position.set(0, 0, -6); g.add(isl);
  ol(mesh(cyl(3.2, 3.6, 0.5, 32), M(0x5a8a4a), 0, 0.2, 0, isl), 0.03);
  const wall = mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.9, 48, 1, true), new THREE.MeshToonMaterial({ color: 0xb8ab94, gradientMap: grad, side: THREE.DoubleSide }), 0, 0.9, 0, isl); ol(wall, 0.02);
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; mesh(box(0.12, 0.14, 0.12), M(0xa89c86), Math.cos(a) * 2.6, 1.42, Math.sin(a) * 2.6, isl); }
  for (let i = 0; i < 20; i++) { const a = hash(i) * Math.PI * 2, r = hash(i + 4) * 2.0; ol(mesh(box(0.25, 0.25, 0.25), M([0xc9a27a, 0xd9b48a, 0xa8835a][i % 3]), Math.cos(a) * r, 0.58, Math.sin(a) * r, isl), 0.01); }
  return { waves, isl };
}
addSet("s2-ilha", (g) => {
  const sky = plane(80, 40, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#7fa8d0"], [1, "#d9e8f2"]]) })); sky.position.set(0, 12, -30); g.add(sky);
  const { waves, isl } = islandSet(g);
  return {
    bg: 0x7fa8d0,
    update(t) { waves.forEach((w, i) => (w.position.x += 0) || (w.rotation.z = Math.sin(t + i) * 0.3)); isl.rotation.y = t * 0.05; },
    cam(t) { const s = T.sc["s2-ilha"]; return keys(t, [[s[0], [0, 9, 4], [0, 0, -6]], [K.existia, [3, 3, 2], [0, 0.8, -6]], [s[1], [5, 2.4, 0], [0, 0.8, -6]]]); },
  };
});

// 3 · o mundo contra a ilha (tempestade 3D + navios)
addSet("s3-mundo", (g) => {
  const sky = plane(80, 40, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#0b0f18"], [0.7, "#2a3448"], [1, "#4a5568"]]) })); sky.position.set(0, 12, -30); g.add(sky);
  const { waves, isl } = islandSet(g, true);
  const clouds = new THREE.Group(); g.add(clouds);
  for (let i = 0; i < 30; i++) { const c = mesh(sph(1.2 + hash(i) * 1.6, 12, 10), M(0x2a2f3a), (hash(i + 2) - 0.5) * 30, 7 + hash(i + 3) * 3, -6 - hash(i + 4) * 20, clouds); c.scale.y = 0.5; }
  const ships = []; for (let i = 0; i < 10; i++) { const sh = new THREE.Group(); g.add(sh); ol(mesh(box(1.2, 0.3, 0.4), M(0x3a3f4a), 0, 0.2, 0, sh), 0.02); ol(mesh(box(0.4, 0.4, 0.3), M(0x4a4f5a), 0.1, 0.55, 0, sh), 0.02); mesh(cyl(0.05, 0.05, 0.6, 6), M(0x2a2a2a), -0.2, 0.7, 0, sh); ships.push(sh); }
  const flash = new THREE.PointLight(0xbfd8ff, 0, 40); flash.position.set(-4, 9, -10); g.add(flash);
  const rain = dustPts(500, [-10, 10, 0, 10, -20, 4], 0x9fb8d9, 0.03); g.add(rain);
  return {
    bg: 0x0b0f18,
    update(t) {
      ships.forEach((s, i) => { const a = (i / 10) * Math.PI * 2 + t * 0.08; const r = lerp(9, 5, sm(seg(t, T.sc["s3-mundo"][0], K.cercada))); s.position.set(Math.cos(a) * r, 0, -6 + Math.sin(a) * r); s.rotation.y = -a; });
      flash.intensity = Math.sin(t * 1.7) > 0.97 || Math.sin(t * 2.9) > 0.985 ? 30 : 0;
      clouds.position.x = Math.sin(t * 0.1) * 2; rain.position.y = -((t * 6) % 10);
    },
    cam(t) { const s = T.sc["s3-mundo"]; return keys(t, [[s[0], [0, 6, 8], [0, 0, -6]], [s[1], [6, 4, 4], [0, 0.5, -6]]]); },
  };
});

// 4 · vingança? (foto do mar)
function stormSea(g, dawn = false) {
  const sky = plane(120, 50, new THREE.MeshBasicMaterial({ map: dawn ? skyTex([[0, "#1a2a4a"], [0.6, "#e07a5f"], [1, "#ffd27a"]]) : skyTex([[0, "#0a0f1a"], [1, "#3a4a66"]]) })); sky.position.set(0, 12, -40); g.add(sky);
  const geo = new THREE.PlaneGeometry(80, 60, 80, 60); geo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color: dawn ? 0x2a5a8a : 0x2a4a6a, gradientMap: grad })); g.add(sea);
  const base = geo.attributes.position.array.slice();
  const sun = dawn ? mesh(sph(2, 28, 20), new THREE.MeshBasicMaterial({ color: 0xffe2a0 }), 0, 1.5, -38, g) : null;
  return (t, amp = 1) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; p.setY(i, (Math.sin(x * 0.5 + t * 1.6) * 0.3 + Math.sin(z * 0.7 + t * 1.2) * 0.25) * amp); } p.needsUpdate = true; geo.computeVertexNormals(); };
}
addSet("s4-vinganca", (g) => {
  const wav = stormSea(g);
  const fl = new THREE.PointLight(0xbfd8ff, 0, 60); fl.position.set(-6, 12, -16); g.add(fl);
  return { bg: 0x05070c, update(t) { wav(t, 1.6); fl.intensity = Math.sin(t * 2.1) > 0.95 ? 40 : 0; }, cam(t) { return { pos: [0, 2.2 + Math.sin(t) * 0.1, 6], look: [0, 1.5, -10] }; } };
});

// 5 · ver o futuro
addSet("s5-futuro", (g) => {
  const eye = new THREE.Group(); eye.position.set(0, 2.2, 0); g.add(eye);
  const glass = mesh(sph(1.2, 40, 30), new THREE.MeshPhongMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.18, shininess: 120, specular: 0xffffff }), 0, 0, 0, eye);
  const iris = mesh(new THREE.TorusGeometry(0.55, 0.06, 12, 60), glowM(0x4ab0ff, 0.9), 0, 0, 0.9, eye);
  const pupil = mesh(sph(0.25, 20, 16), M(0x050505), 0, 0, 1.0, eye);
  const line = new THREE.Group(); eye.add(line);
  const tl = mesh(box(3.2, 0.03, 0.03), glowM(0xffd27a, 0.9), 0, -0.2, 0, line);
  const nodes = []; for (let i = 0; i < 9; i++) nodes.push(mesh(sph(0.06, 10, 8), glowM(i < 5 ? 0xffd27a : 0xff3a3a, 1), -1.6 + i * 0.4, -0.2, 0, line));
  const st = dustPts(300, [-6, 6, -2, 8, -10, -2], 0x4ab0ff, 0.03); g.add(st);
  return {
    bg: 0x03050a,
    update(t) { eye.rotation.y = Math.sin(t * 0.5) * 0.25; line.rotation.y = t * 0.6; nodes.forEach((n, i) => n.scale.setScalar(1 + 0.5 * Math.abs(Math.sin(t * 3 + i)))); iris.rotation.z = t; },
    cam(t) { const s = T.sc["s5-futuro"]; return keys(t, [[s[0], [0, 2.2, 6], [0, 2.2, 0]], [s[1], [0, 2.2, 4.2], [0, 2.2, 0]]]); },
  };
});

// 6 · ódio? (tempestade 3D)
addSet("s6-odio", (g) => {
  const clouds = new THREE.Group(); g.add(clouds);
  for (let i = 0; i < 40; i++) { const c = mesh(sph(1 + hash(i) * 1.5, 12, 10), M(0x3a4258), (hash(i + 2) - 0.5) * 16, (hash(i + 3) - 0.5) * 14 + 2, -4 - hash(i + 4) * 10, clouds); c.scale.y = 0.6; }
  const fl = new THREE.PointLight(0xffffff, 0, 30); fl.position.set(2, 6, -2); g.add(fl);
  return { bg: 0x07090f, update(t) { clouds.rotation.z = t * 0.03; fl.intensity = Math.sin(t * 2.3) > 0.9 ? 30 : 2; }, cam() { return { pos: [0, 2, 6], look: [0, 2, 0] }; } };
});

// 7 · os gigantes de pedra marchando
addSet("s7-estrondo", (g) => {
  const sky = plane(120, 50, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#1a0f0a"], [0.6, "#5a2a14"], [1, "#b8602a"]]) })); sky.position.set(0, 14, -60); g.add(sky);
  g.add(floorP(200, 200, M(0x3a2a1e)));
  const giants = []; for (let i = 0; i < 9; i++) { const gi = stoneGiant(i); gi.position.set(-16 + i * 4 + (hash(i) - 0.5) * 2, 0, -20 - (i % 3) * 8); gi.scale.setScalar(0.9 + hash(i + 4) * 0.4); g.add(gi); giants.push(gi); }
  const dust = dustPts(600, [-20, 20, 0, 6, -40, 0], 0xb8905a, 0.12); g.add(dust);
  const fogP = plane(200, 20, new THREE.MeshBasicMaterial({ color: 0x8a5a3a, transparent: true, opacity: 0.25, depthWrite: false })); fogP.position.set(0, 2, -14); g.add(fogP);
  return {
    bg: 0x1a0f0a,
    update(t) {
      giants.forEach((gi, i) => { gi.position.z = -20 - (i % 3) * 8 + (t - T.sc["s7-estrondo"][0]) * 1.4; gi.userData.legs.forEach((l, k) => (l.rotation.x = Math.sin(t * 1.6 + i + k * Math.PI) * 0.25)); gi.position.y = Math.abs(Math.sin(t * 1.6 + i)) * 0.15; });
      dust.position.z = (t * 0.6) % 4;
    },
    cam(t) { const s = T.sc["s7-estrondo"]; const shake = Math.sin(t * 25) * 0.04 * (Math.sin(t * 1.6) > 0.8 ? 1 : 0.2); return keys(t, [[s[0], [0, 1.2 + shake, 8], [0, 5, -20]], [s[1], [2, 1.0 + shake, 4], [0, 6, -16]]]); },
  };
});

// 8 · por que parou nos 80%?
addSet("s8-oitenta", (g) => {
  const gl = globe(1.5); gl.position.set(0, 2.2, 0); g.add(gl);
  const st = dustPts(400, [-10, 10, -6, 12, -14, -4], 0xffffff, 0.04); g.add(st);
  const ring = mesh(new THREE.TorusGeometry(1.95, 0.04, 8, 80, Math.PI * 2 * 0.8), glowM(0xff2a3a, 0.9), 0, 2.2, 0.2, g);
  const rest = mesh(new THREE.TorusGeometry(1.95, 0.04, 8, 80, Math.PI * 2 * 0.2), glowM(0x4ab0ff, 0.7), 0, 2.2, 0.2, g); rest.rotation.z = Math.PI * 2 * 0.8;
  return {
    bg: 0x04060c,
    update(t) { gl.rotation.y = t * 0.15; gl.rotation.x = 0.25; setMap(0.8); ring.rotation.z = 0; },
    cam(t) { const s = T.sc["s8-oitenta"]; return keys(t, [[s[0], [0, 2.2, 5.0], [0, 2.2, 0]], [s[1], [0, 2.2, 6.4], [0, 2.2, 0]]]); },
  };
});

// 9 · a resposta (foto dos pássaros + chave)
addSet("s9-resposta", (g) => {
  const ph = photoPlane("passaros", 4.6, 6.1); ph.position.set(0, 2.2, -0.5); g.add(ph);
  const k = oldKey(1.3); k.position.set(0.9, 1.4, 1.2); g.add(k);
  const warm = new THREE.PointLight(0xffd27a, 5, 6); warm.position.set(1.4, 2, 2.4); g.add(warm);
  return {
    bg: 0x0a0d14,
    update(t) { const s = T.sc["s9-resposta"]; ph.scale.setScalar(1.05 + (t - s[0]) * 0.006); k.rotation.y = t * 0.6; k.position.y = 1.4 + Math.sin(t) * 0.05; k.visible = t > K.proteger - 0.3; },
    cam() { return { pos: [0, 2.2, 6.6], look: [0, 2.2, 0] }; },
  };
});

// 10 · ser livre (pássaros 3D voando sobre o mar)
addSet("s10-livre", (g) => {
  const wav = stormSea(g, true);
  const k = oldKey(0.7); k.position.set(0, 2.0, 1.0); g.add(k);
  const birds = []; for (let i = 0; i < 12; i++) { const b = bird(); g.add(b); birds.push(b); }
  return {
    bg: 0x0a0d14,
    update(t) {
      const s = T.sc["s10-livre"], dt = t - s[0];
      wav(t, 0.6); birds.forEach((b, i) => { const sp = 0.5 + hash(i) * 0.4; b.position.set(-6 + ((dt * sp * 2 + hash(i + 3) * 12) % 12), 3.0 + hash(i + 7) * 3 + dt * 0.1, -4 - hash(i + 9) * 6); b.scale.setScalar(3); b.userData.wings.forEach((w, k) => (w.rotation.x = 0, w.rotation.z = (k ? 1 : -1) * Math.sin(t * 10 + i) * 0.7)); });
      k.rotation.y = t * 0.5;
    },
    cam() { return { pos: [0, 2.6, 7.6], look: [0, 2.6, -4] }; },
  };
});

// 11 · pergunta
addSet("s11-pergunta", (g) => {
  const gl = globe(0.85); gl.position.set(0, 2.85, -1); g.add(gl);
  const k = oldKey(0.6); k.position.set(1.6, 3.6, -0.5); g.add(k);
  const st = dustPts(300, [-8, 8, -6, 12, -12, -3], 0xffffff, 0.03); g.add(st);
  return { bg: 0x05060c, update(t) { gl.rotation.y = t * 0.2; setMap(0.8); k.rotation.y = -t * 0.6; }, cam() { return { pos: [0, 2.6, 6.8], look: [0, 2.4, 0] }; } };
});

// thumb: mapa vermelho + gigantes na névoa
addSet("thumb", (g) => {
  const sky = plane(120, 50, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#140a08"], [0.6, "#4a1a10"], [1, "#a0401a"]]) })); sky.position.set(0, 14, -60); g.add(sky);
  g.add(floorP(200, 200, M(0x2a1c14)));
  for (let i = 0; i < 5; i++) { const gi = stoneGiant(i); gi.position.set(-8 + i * 4, 0, -18 - (i % 2) * 6); g.add(gi); }
  const fogP = plane(200, 30, new THREE.MeshBasicMaterial({ color: 0x6a3a2a, transparent: true, opacity: 0.3, depthWrite: false })); fogP.position.set(0, 2, -12); g.add(fogP);
  const gl = globe(1.0); gl.position.set(0, 5.6, -6); gl.rotation.set(0.25, 0.9, 0); g.add(gl);
  return { bg: 0x140a08, update() { setMap(0.8); }, cam() { return { pos: [0, 1.6, 6], look: [0, 4.6, -14] }; } };
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
window.__hf.buildReady["eren3d"] = (async () => {
  try { await document.fonts.load("700 48px 'Space Mono'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  await loadPhotos();
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
