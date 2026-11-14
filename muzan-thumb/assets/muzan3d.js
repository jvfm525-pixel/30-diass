// Cena 3D do vídeo de curiosidade "Por que o Muzan tem medo do Tanjiro?" (símbolos originais) (Three.js).
// Tudo é função do tempo t (hf-seek). Tempos-chave em window.HF_T (gerado por tools/build_muzan.py).
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
const sunTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#f3e7c9"; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
  g.strokeStyle = "#7a1414"; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.stroke();
  g.fillStyle = "#c81e1e"; g.beginPath(); g.arc(128, 128, 46, 0, 7); g.fill();
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.save(); g.translate(128, 128); g.rotate(a); g.beginPath(); g.moveTo(54, -7); g.lineTo(96, 0); g.lineTo(54, 7); g.closePath(); g.fill(); g.restore(); }
});
function earring(s = 1) {
  const g = new THREE.Group();
  const hook = mesh(new THREE.TorusGeometry(0.06 * s, 0.008 * s, 8, 20, Math.PI * 1.4), M(0xc9a227), 0, 0.3 * s, 0, g); hook.rotation.z = -0.4;
  mesh(cyl(0.006 * s, 0.006 * s, 0.1 * s, 6), M(0xc9a227), 0, 0.2 * s, 0, g);
  const disc = ol(mesh(cyl(0.15 * s, 0.15 * s, 0.02 * s, 40), [M(0xc9a227), new THREE.MeshToonMaterial({ map: sunTex, gradientMap: grad }), new THREE.MeshToonMaterial({ map: sunTex, gradientMap: grad })], 0, 0, 0, g), 0.006 * s);
  disc.rotation.x = Math.PI / 2;
  return g;
}
const redEyeM = new THREE.MeshBasicMaterial({ color: 0xff1a2a });
function shadowFigure(eyesOn = true) {
  const g = new THREE.Group();
  const dark = new THREE.MeshToonMaterial({ color: 0x07060a, gradientMap: grad, transparent: true, opacity: 1 });
  const body = mesh(new THREE.ConeGeometry(0.5, 2.0, 16, 1, true), dark, 0, 1.0, 0, g);
  const torso = mesh(sph(0.35, 16, 12), dark, 0, 1.75, 0, g); torso.scale.set(1.1, 0.8, 0.7);
  const head = mesh(sph(0.22, 18, 14), dark, 0, 2.2, 0, g); head.scale.set(1, 1.15, 1);
  const eyes = [-1, 1].map((s) => { const e = mesh(sph(0.03, 10, 8), redEyeM, 0.075 * s, 2.24, 0.2, g); e.scale.set(1.6, 0.7, 0.5); return e; });
  const aura = mesh(new THREE.PlaneGeometry(0.6, 0.25), glowM(0xff1a2a, 0.5), 0, 2.24, 0.21, g);
  aura.material.map = canvasTex(128, 64, (c) => { const gr = c.createRadialGradient(64, 32, 0, 64, 32, 60); gr.addColorStop(0, "rgba(255,30,40,.9)"); gr.addColorStop(1, "rgba(255,0,0,0)"); c.fillStyle = gr; c.fillRect(0, 0, 128, 64); }); aura.material.needsUpdate = true;
  const fog = dustPts(160, [-0.8, 0.8, 0, 2.4, -0.4, 0.4], 0x2a0a10, 0.06); g.add(fog);
  g.userData = { dark, eyes, aura, head, fog };
  return g;
}
function goldenSwordsman() {
  const g = new THREE.Group();
  const s = adult({ ghost: 0xffc94a, ghostOpacity: 0.75, ghostOutline: 0x6a4a00, style: "bald", noHair: true }); g.add(s);
  const arm = s.userData.arms[1];
  const blade = mesh(box(0.035, 1.1, 0.01), glowM(0xffe7a8, 1), 0, -1.25, 0.1, arm);
  const flames = [0, 1, 2].map((i) => { const f = mesh(new THREE.PlaneGeometry(0.22, 1.2), glowM([0xff4a1a, 0xff8a1a, 0xffc94a][i], 0.6), 0, -1.25, 0.12 + i * 0.01, arm); return f; });
  g.userData = { s, arm, flames };
  return g;
}
function flameCone(r = 0.15, h = 0.5) {
  const g = new THREE.Group();
  [0xff3a1a, 0xff7a1a, 0xffb31a, 0xfff2b0].forEach((c, i) => mesh(new THREE.ConeGeometry(r * (1 - i * 0.2), h * (1 - i * 0.15), 10), glowM(c, 0.75), 0, h * 0.5, 0, g));
  return g;
}
function flicker(f, t, i = 0) { f.children.forEach((c, k) => { c.scale.set(1 + Math.sin(t * 9 + k + i) * 0.12, 1 + Math.sin(t * 11 + k * 2 + i) * 0.2, 1); c.rotation.y = t * (k + 1); }); }

// 1 · rua antiga à noite
function oldStreet(g) {
  g.add(floorP(30, 40, M(0xffffff, { map: rep(tiles("#3a3330", "#332c29", 6), 8, 10) })));
  for (let side of [-1, 1]) for (let i = 0; i < 7; i++) {
    const x = side * 3.2, z = -2 - i * 3;
    ol(mesh(box(2.4, 2.6, 2.6), M(i % 2 ? 0x4a3628 : 0x3b2a20), x, 1.3, z, g), 0.03);
    const roof = mesh(new THREE.ConeGeometry(2.2, 0.9, 4), M(0x1d1a1e), x, 3.05, z, g); roof.rotation.y = Math.PI / 4; roof.scale.z = 1.3; ol(roof, 0.03);
    mesh(box(0.05, 1.2, 1.4), new THREE.MeshBasicMaterial({ color: 0xffc27a }), x - side * 1.22, 1.3, z, g);
    const l = mesh(sph(0.18, 12, 10), glowM(i % 2 ? 0xff5a2a : 0xffa04a, 0.95), x - side * 1.5, 2.3, z + 0.8, g); l.scale.y = 1.4;
  }
}
addSet("s1-rua", (g) => {
  oldStreet(g);
  const crowd = []; for (let i = 0; i < 9; i++) { const p = adult({ top: [0x2a2f45, 0x3a2a35, 0x2f3a30][i % 3], skin: SK[i % 3] }); p.position.set((hash(i) - 0.5) * 3.6, 0, -1 - hash(i + 3) * 9); p.rotation.y = hash(i + 5) > 0.5 ? 0 : Math.PI; g.add(p); crowd.push(p); }
  const sh = shadowFigure(); sh.position.set(0.2, 0, -6.5); g.add(sh);
  const warm = new THREE.PointLight(0xff8a4a, 5, 14); warm.position.set(0, 3, -4); g.add(warm);
  return {
    bg: 0x0a0710,
    update(t) {
      crowd.forEach((p, i) => { walk(p, t + i, 0.6, 0.8); p.position.z += 0; });
      sh.userData.aura.material.opacity = 0.5 + 0.2 * Math.sin(t * 4);
    },
    cam(t) { const s = T.sc["s1-rua"]; return keys(t, [[s[0], [0.6, 1.8, 4.5], [0, 1.6, -4]], [K.garoto, [0.35, 2.15, -3.4], [0.2, 2.22, -6.5]], [s[1], [0.28, 2.22, -4.6], [0.2, 2.23, -6.5]]]); },
  };
});

// 2 · o brinco
addSet("s2-brinco", (g) => {
  const er = earring(3); er.position.set(0, 1.6, 0); g.add(er);
  const sh = shadowFigure(); sh.position.set(0.4, -0.6, -5); sh.scale.setScalar(1.6); g.add(sh);
  const lantern = new THREE.PointLight(0xffb36b, 6, 8); lantern.position.set(1.2, 2.2, 1.6); g.add(lantern);
  const bok = dustPts(60, [-4, 4, -1, 5, -6, -2], 0xff8a4a, 0.12); g.add(bok);
  return {
    bg: 0x07050a,
    update(t) {
      er.rotation.z = Math.sin(t * 2.2) * 0.25; er.rotation.y = Math.sin(t * 1.3) * 0.5;
      const wide = sm(seg(t, K.olha - 0.2, K.olha + 0.4));
      sh.userData.eyes.forEach((e) => e.scale.set(1.6 + wide, 0.7 + wide * 1.1, 0.5));
      sh.userData.aura.material.opacity = 0.4 + wide * 0.5;
    },
    cam(t) { const s = T.sc["s2-brinco"]; return keys(t, [[s[0], [0.4, 1.7, 3.2], [0, 1.4, 0]], [K.olha, [0.2, 1.6, 2.2], [0, 1.4, -1]], [s[1], [0.15, 1.6, 1.9], [0, 1.5, -2]]]); },
  };
});

// 3 · 400 anos atrás
addSet("s3-passado", (g) => {
  const sky = plane(80, 40, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#2a1a0a"], [0.6, "#7a4a1a"], [1, "#e9b45a"]]) })); sky.position.set(0, 12, -25); g.add(sky);
  g.add(floorP(60, 60, M(0x6b5a2a)));
  for (let i = 0; i < 40; i++) { const b = mesh(cyl(0.01, 0.02, 0.6, 4), M(0x8a7a3a), (hash(i) - 0.5) * 10, 0.3, -1 - hash(i + 4) * 8, g); b.rotation.z = (hash(i + 7) - 0.5) * 0.4; }
  mesh(sph(1.4, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff1c9 }), 6, 9, -22, g);
  const sw = goldenSwordsman(); sw.position.set(-0.9, 0, 0); sw.rotation.y = 0.9; g.add(sw);
  const sh = shadowFigure(); sh.position.set(1.0, 0, -1.2); sh.rotation.y = -0.8; g.add(sh);
  return {
    bg: 0x2a1a0a,
    update(t) {
      breathe(sw.userData.s, t, 2, 0.5); still(sw.userData.s);
      const a = sw.userData.arm; a.rotation.set(-1.2 + Math.sin(t * 0.8) * 0.1, 0, 0.3);
      sw.userData.flames.forEach((f, i) => { f.scale.y = 1 + Math.sin(t * 10 + i) * 0.15; f.material.opacity = 0.45 + 0.2 * Math.sin(t * 8 + i); });
    },
    cam(t) { const s = T.sc["s3-passado"]; return keys(t, [[s[0], [3.0, 1.6, 3.6], [0, 1.4, -0.5]], [K.espadachim, [1.8, 1.4, 2.4], [-0.6, 1.4, 0]], [K.matou, [-2.2, 1.5, 2.6], [0.6, 1.6, -1]], [s[1], [-2.6, 1.6, 3.2], [0.6, 1.6, -1]]]); },
  };
});

// 4 · a ferida que não fecha
addSet("s4-ferida", (g) => {
  const sh = shadowFigure(); sh.scale.setScalar(1.4); g.add(sh);
  const slash = mesh(box(1.1, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xff7a1a }), 0, 2.45, 0.42, g); slash.rotation.z = -0.6;
  const slashGlow = mesh(new THREE.PlaneGeometry(1.4, 0.4), glowM(0xff5a1a, 0.6), 0, 2.45, 0.44, g); slashGlow.rotation.z = -0.6;
  const embers = dustPts(160, [-0.6, 0.6, 1.8, 3.6, 0.2, 0.6], 0xff8a2a, 0.05); g.add(embers);
  return {
    bg: 0x050307,
    update(t) {
      const p = 0.6 + 0.4 * Math.sin(t * 6);
      slashGlow.material.opacity = 0.4 + 0.4 * p; slash.scale.y = 1 + p;
      embers.position.y = (t * 0.4) % 0.8; embers.material.opacity = 0.6 + 0.3 * Math.sin(t * 5);
    },
    cam(t) { const s = T.sc["s4-ferida"]; return keys(t, [[s[0], [0, 2.6, 4.4], [0, 2.5, 0]], [K.seculos, [0.6, 2.5, 2.4], [0, 2.45, 0.3]], [s[1], [0.4, 2.5, 2.0], [0, 2.45, 0.3]]]); },
  };
});

// 5 · 1.800 pedaços
addSet("s5-pedacos", (g) => {
  const sh = shadowFigure(); sh.scale.setScalar(1.3); g.add(sh);
  const N = 1800, base = [], dir = [];
  for (let i = 0; i < N; i++) { const a = hash(i) * Math.PI * 2, b = (hash(i + 3) - 0.5) * Math.PI; base.push((hash(i + 5) - 0.5) * 0.8, 0.3 + hash(i + 9) * 2.6, (hash(i + 11) - 0.5) * 0.5); dir.push(Math.cos(a) * Math.cos(b), Math.sin(b) + 0.2, Math.sin(a) * Math.cos(b)); }
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); g.add(pts);
  const cuts = [0, 1, 2].map((i) => { const c = mesh(box(4, 0.03, 0.03), glowM(0xffd27a, 1), 0, 0, 0, g); return c; });
  return {
    bg: 0x050307,
    update(t) {
      const ex = seg(t, K.explodiu, K.explodiu + 1.4), cut = seg(t, K.cortou - 0.3, K.cortou + 1.2);
      sh.visible = ex <= 0;
      for (let i = 0; i < N; i++) {
        const escaped = i % 6 === 0; // ~300 escapam
        const d = sm(ex) * (1.2 + hash(i + 17) * 2.5) + (escaped ? cut * 4 : 0);
        pos[i * 3] = base[i * 3] * 1.3 + dir[i * 3] * d; pos[i * 3 + 1] = base[i * 3 + 1] * 1.3 + dir[i * 3 + 1] * d; pos[i * 3 + 2] = base[i * 3 + 2] + dir[i * 3 + 2] * d;
        const alive = escaped ? 1 : 1 - seg(cut, hash(i) * 0.7, hash(i) * 0.7 + 0.3);
        col[i * 3] = alive; col[i * 3 + 1] = 0.05 * alive; col[i * 3 + 2] = 0.1 * alive;
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      pts.visible = ex > 0;
      cuts.forEach((c, i) => { const k = seg(t, K.cortou - 0.3 + i * 0.25, K.cortou + i * 0.25); c.visible = k > 0 && k < 1; c.position.set(lerp(-3, 3, k), 1.2 + i * 0.6, 0.3); c.rotation.z = -0.4 + i * 0.4; });
    },
    cam(t) { const s = T.sc["s5-pedacos"]; return keys(t, [[s[0], [0, 2.0, 4.6], [0, 1.7, 0]], [K.explodiu + 1.0, [0, 2.2, 7.5], [0, 1.6, 0]], [s[1], [0.8, 2.4, 9.5], [0, 1.6, 0]]]); },
  };
});

// 6 · a dança na neve
addSet("s6-danca", (g) => {
  const sky = plane(80, 40, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#05070f"], [1, "#1a2440"]]) })); sky.position.set(0, 12, -25); g.add(sky);
  g.add(floorP(60, 60, M(0xe8eef5)));
  for (let i = 0; i < 6; i++) { const m = mesh(new THREE.ConeGeometry(4 + hash(i) * 3, 6 + hash(i + 3) * 4, 6), M(0x2a3550), -14 + i * 6, 3, -16 - hash(i + 5) * 4, g); mesh(new THREE.ConeGeometry(1.6, 1.8, 6), M(0xf2f6fb), -14 + i * 6, 5.4 + hash(i + 3) * 2, -16 - hash(i + 5) * 4, g); }
  ol(mesh(box(3, 2, 2.4), M(0x5a3b2b), -3.2, 1, -4, g), 0.03);
  const roof = mesh(new THREE.ConeGeometry(2.6, 1.3, 4), M(0xf2f6fb), -3.2, 2.6, -4, g); roof.rotation.y = Math.PI / 4;
  const fire = flameCone(0.35, 1.0); g.add(fire);
  const fireL = new THREE.PointLight(0xff8a3a, 8, 8); fireL.position.set(0, 1, 0); g.add(fireL);
  const fam = [0, 1, 2, 3].map((i) => { const p = adult({ top: [0x6b2a2a, 0x2a4a3a, 0x3a3a6b, 0x6b5a2a][i], skin: SK[1] }); const a = (i / 4) * Math.PI * 2 + 0.4; p.position.set(Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6); p.rotation.y = -a - Math.PI / 2 + Math.PI; p.scale.setScalar(i > 1 ? 0.75 : 1); g.add(p); return p; });
  const spiral = []; for (let i = 0; i < 200; i++) spiral.push(0, 0, 0);
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(spiral, 3));
  const sp = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffa04a, size: 0.08, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); g.add(sp);
  const snow = dustPts(400, [-8, 8, 0, 9, -8, 4], 0xffffff, 0.04); g.add(snow);
  return {
    bg: 0x0a1020,
    update(t) {
      flicker(fire, t); fireL.intensity = 7 + Math.sin(t * 13) * 1.5;
      fam.forEach((p, i) => { breathe(p, t, i); still(p); p.userData.arms.forEach((a, k) => a.rotation.set(-0.8 + Math.sin(t * 2 + i + k) * 0.5, 0, (k ? 1 : -1) * 0.5)); });
      const pa = sg.attributes.position;
      for (let i = 0; i < 200; i++) { const k = i / 200, a = k * 12 + t * 2, r = 0.2 + k * 1.2; pa.setXYZ(i, Math.cos(a) * r, 0.8 + k * 6 * sm(seg(t, K.danca - 0.5, K.disfarcada)), Math.sin(a) * r); }
      pa.needsUpdate = true;
      snow.position.y = -((t * 0.5) % 3);
    },
    cam(t) { const s = T.sc["s6-danca"]; return keys(t, [[s[0], [4.6, 2.8, 6.8], [0, 1.2, 0]], [K.danca, [3.6, 2.4, 5.6], [0, 1.4, 0]], [s[1], [2.6, 3.8, 7.0], [0, 3.0, 0]]]); },
  };
});

// 7 · 7 corações e 5 cérebros
addSet("s7-orgaos", (g) => {
  const holo = adult({ ghost: 0x2a6aff, ghostOpacity: 0.18, style: "bald", noHair: true }); holo.scale.setScalar(1.6); g.add(holo);
  const wire = new THREE.Group(); g.add(wire);
  holo.traverse((m) => { if (m.isMesh) { const w = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), new THREE.LineBasicMaterial({ color: 0x4ab0ff, transparent: true, opacity: 0.35 })); m.add(w); } });
  const hearts = [], brains = [];
  for (let i = 0; i < 7; i++) { const h = mesh(sph(0.07, 12, 10), glowM(0xff1a3a, 1), 0, 0, 0, g); hearts.push(h); }
  for (let i = 0; i < 5; i++) { const b = mesh(sph(0.08, 12, 10), glowM(0xff8ad0, 1), 0, 0, 0, g); b.scale.set(1.3, 0.9, 1); brains.push(b); }
  const grid = new THREE.GridHelper(20, 40, 0x1d3a6b, 0x10203a); g.add(grid);
  return {
    bg: 0x04060c,
    update(t) {
      holo.rotation.y = t * 0.3;
      hearts.forEach((h, i) => { const sl = Math.floor(t * 0.8 + i * 1.7); const a = hash(sl * 13 + i) * Math.PI * 2, y = 1.6 + hash(sl * 7 + i) * 1.2; const x = Math.cos(a) * 0.25, z = Math.sin(a) * 0.15; h.position.set(lerp(h.position.x || x, x, 0.2), y, z); h.scale.setScalar(1 + 0.3 * Math.abs(Math.sin(t * 6 + i))); h.visible = t > K.coracoes - 0.3 + i * 0.08; });
      brains.forEach((b, i) => { const sl = Math.floor(t * 0.7 + i * 2.3); const a = hash(sl * 17 + i + 50) * Math.PI * 2; b.position.set(Math.cos(a) * 0.22, 1.4 + hash(sl * 5 + i + 30) * 1.9, Math.sin(a) * 0.14); b.visible = t > K.cerebros - 0.3 + i * 0.08; });
    },
    cam(t) { const s = T.sc["s7-orgaos"]; return keys(t, [[s[0], [0, 2.2, 5.2], [0, 2.0, 0]], [s[1], [0, 2.3, 4.0], [0, 2.1, 0]]]); },
  };
});

// 8 · 12 formas → 13ª
addSet("s8-formas", (g) => {
  const flames = []; for (let i = 0; i < 12; i++) { const f = flameCone(0.12, 0.45); const a = (i / 12) * Math.PI * 2; f.position.set(Math.cos(a) * 1.6, 2 + Math.sin(a) * 1.6, 0); f.rotation.z = a - Math.PI / 2; g.add(f); flames.push(f); }
  const ring = mesh(new THREE.TorusGeometry(1.6, 0.05, 10, 80), glowM(0xff8a2a, 0.0), 0, 2, 0, g);
  const core = mesh(sph(0.3, 20, 16), glowM(0xfff2b0, 0), 0, 2, 0, g);
  const embers = dustPts(300, [-4, 4, -1, 6, -4, 1], 0xff7a2a, 0.04); g.add(embers);
  return {
    bg: 0x050307,
    update(t) {
      flames.forEach((f, i) => { const on = seg(t, K.formas - 0.4 + i * 0.12, K.formas - 0.2 + i * 0.12); f.scale.setScalar(0.001 + on); flicker(f, t, i); });
      const c = seg(t, K.circulo - 0.3, K.decima);
      ring.material.opacity = c; ring.rotation.z = t * 2;
      const rot = sm(c) * t * 3; flames.forEach((f, i) => { const a = (i / 12) * Math.PI * 2 + rot; f.position.set(Math.cos(a) * 1.6, 2 + Math.sin(a) * 1.6, 0); f.rotation.z = a - Math.PI / 2; });
      const burst = seg(t, K.decima - 0.1, K.decima + 0.6); core.material.opacity = burst > 0 ? 0.9 * (1 - burst) : 0; core.scale.setScalar(1 + burst * 1.5);
      embers.rotation.z = t * 0.2;
    },
    cam(t) { const s = T.sc["s8-formas"]; return keys(t, [[s[0], [0, 2, 6.5], [0, 2, 0]], [s[1], [0, 2, 5.2], [0, 2, 0]]]); },
  };
});

// 9 · o verdadeiro medo: o sol nasce
addSet("s9-sol", (g) => {
  const skyM = new THREE.MeshBasicMaterial({ map: skyTex([[0, "#05050f"], [0.7, "#2a1430"], [1, "#ff8a4a"]]) });
  const sky = plane(80, 40, skyM); sky.position.set(0, 10, -25); g.add(sky);
  g.add(floorP(60, 60, M(0x14121a)));
  const sun = mesh(sph(1.4, 28, 20), new THREE.MeshBasicMaterial({ color: 0xffd27a }), 0, -1.6, -20, g);
  const sunGlow = mesh(new THREE.PlaneGeometry(14, 14), glowM(0xffa04a, 0.5), 0, -1.6, -19.8, g);
  sunGlow.material.map = canvasTex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,180,90,.9)"); gr.addColorStop(1, "rgba(255,120,40,0)"); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); }); sunGlow.material.needsUpdate = true;
  const sh = shadowFigure(); sh.position.set(0, 0, -3); sh.rotation.y = Math.PI; g.add(sh);
  const er = earring(0.9); er.position.set(1.15, 1.3, 0.4); g.add(er);
  const dawn = new THREE.DirectionalLight(0xffb36b, 0); dawn.position.set(0, 2, -10); g.add(dawn);
  return {
    bg: 0x05050f,
    update(t) {
      const r = sm(seg(t, T.sc["s9-sol"][0], K.lembranca + 1.5));
      sun.position.y = lerp(-1.6, 1.6, r); sunGlow.position.y = sun.position.y; dawn.intensity = r * 2.2;
      sh.position.z = lerp(-3, -1.2, sm(seg(t, K.carrega - 0.5, K.lembranca + 1.5)));
      sh.userData.aura.material.opacity = 0.6 - r * 0.4;
      er.rotation.y = t * 0.8; er.rotation.z = Math.sin(t * 1.5) * 0.2;
    },
    cam(t) { const s = T.sc["s9-sol"]; return keys(t, [[s[0], [1.6, 1.8, 3.6], [0, 1.6, -6]], [s[1], [0.8, 1.6, 2.4], [0, 1.8, -8]]]); },
  };
});

// 10 · pergunta
addSet("s10-pergunta", (g) => {
  const st = dustPts(400, [-8, 8, -6, 12, -12, -3], 0xffd27a, 0.03); g.add(st);
  const sun = new THREE.Group(); sun.position.set(-1.0, 3.0, 0); g.add(sun);
  mesh(sph(0.55, 24, 18), glowM(0xffd27a, 0.95), 0, 0, 0, sun);
  for (let i = 0; i < 12; i++) { const ray = mesh(new THREE.ConeGeometry(0.08, 0.5, 6), glowM(0xffb31a, 0.8), 0, 0, 0, sun); const a = (i / 12) * Math.PI * 2; ray.position.set(Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0); ray.rotation.z = a - Math.PI / 2; }
  const er = earring(2.2); er.position.set(1.0, 2.7, 0); g.add(er);
  const fire = flameCone(0.25, 0.7); fire.position.set(1.0, 1.6, 0); g.add(fire);
  const key2 = new THREE.PointLight(0xffc94a, 6, 8); key2.position.set(0, 3.5, 2); g.add(key2);
  return {
    bg: 0x070405,
    update(t) { sun.rotation.z = t * 0.5; er.rotation.y = t * 1.2; flicker(fire, t); },
    cam(t) { const s = T.sc["s10-pergunta"]; return keys(t, [[s[0], [0, 2.6, 6.5], [0, 2.6, 0]], [s[1], [0, 2.6, 7.6], [0, 2.6, 0]]]); },
  };
});

// thumb: olhos vermelhos na sombra e o brinco em primeiro plano
addSet("thumb", (g) => {
  oldStreet(g);
  const sh = shadowFigure(); sh.position.set(0.1, 0, -3.2); sh.scale.setScalar(1.25); g.add(sh);
  sh.userData.eyes.forEach((e) => e.scale.set(2.4, 1.6, 0.5)); sh.userData.aura.material.opacity = 0.9;
  const er = earring(1.0); er.position.set(-0.32, 2.05, 1.2); er.rotation.y = 0.35; g.add(er);
  const rim2 = new THREE.PointLight(0xffb36b, 5, 4); rim2.position.set(-0.8, 2.4, 2.4); g.add(rim2);
  return { bg: 0x0a0710, update() {}, cam() { return { pos: [0.0, 2.35, 3.2], look: [0.0, 2.45, -2] }; } };
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
window.__hf.buildReady["muzan3d"] = (async () => {
  try { await document.fonts.load("700 48px 'Space Mono'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
