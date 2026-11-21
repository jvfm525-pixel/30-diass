// Cena 3D do episódio "E se você tivesse o caderno na vida real?" (Three.js).
// Tudo é função do tempo t (hf-seek). Tempos-chave em window.HF_T (gerado por tools/build_caderno.py).
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


const dustPts = (n, box3) => { const p = []; for (let i = 0; i < n; i++) p.push(box3[0] + hash(i) * (box3[1] - box3[0]), box3[2] + hash(i + 7) * (box3[3] - box3[2]), box3[4] + hash(i + 13) * (box3[5] - box3[4])); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffe6b0, size: 0.02, transparent: true, opacity: 0.7, depthWrite: false })); };
// ---------------------------------------------------------------- o caderno (original)
const paperTex = (lines = [], o = {}) => canvasTex(512, 700, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#efe3c2"); gr.addColorStop(1, "#d9c79c"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#b8a77f"; g.lineWidth = 2; for (let y = 90; y < h; y += 44) { g.beginPath(); g.moveTo(30, y); g.lineTo(w - 30, y); g.stroke(); }
  g.fillStyle = "#1a1410"; g.textAlign = "left"; g.textBaseline = "alphabetic";
  lines.forEach((l, i) => { g.font = `${i === 0 ? "700 46px" : "italic 32px"} Georgia, serif`; g.fillText(l, 40, 80 + i * 44 * (i === 0 ? 1 : 1)); });
  if (o.stain) { g.fillStyle = "rgba(90,60,30,.25)"; g.beginPath(); g.arc(400, 600, 60, 0, 7); g.fill(); }
});
const coverTex = canvasTex(512, 700, (g, w, h) => {
  g.fillStyle = "#0b0a0c"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(255,255,255,${hash(i) * 0.05})`; g.fillRect(hash(i + 1) * w, hash(i + 2) * h, 2, 2); }
  g.strokeStyle = "#3a3436"; g.lineWidth = 6; g.strokeRect(24, 24, w - 48, h - 48);
  g.fillStyle = "#b9b4ae"; g.font = "700 64px Georgia, serif"; g.textAlign = "center"; g.fillText("CADERNO", w / 2, 210);
  g.fillStyle = "#6b6560"; g.fillRect(w / 2 - 120, 236, 240, 3);
});
function notebook(open = 0) {
  const g = new THREE.Group();
  const back = mesh(box(0.42, 0.02, 0.58), M(0x0b0a0c), 0, 0, 0, g); ol(back, 0.004);
  mesh(box(0.4, 0.035, 0.56), M(0xe6d8b4), 0, 0.025, 0, g);
  const hinge = new THREE.Group(); hinge.position.set(-0.21, 0.045, 0); g.add(hinge);
  const cover = mesh(box(0.42, 0.012, 0.58), [M(0x0b0a0c), M(0x0b0a0c), new THREE.MeshToonMaterial({ map: coverTex, gradientMap: grad }), M(0x1a1416), M(0x0b0a0c), M(0x0b0a0c)], 0.21, 0, 0, hinge);
  ol(cover, 0.004);
  g.userData = { hinge, cover };
  return g;
}
function pen() {
  const g = new THREE.Group();
  ol(mesh(cyl(0.012, 0.012, 0.22, 12), M(0x111111), 0, 0, 0, g), 0.003);
  mesh(new THREE.ConeGeometry(0.012, 0.04, 12), M(0xc9a227), 0, -0.13, 0, g).rotation.x = Math.PI;
  mesh(cyl(0.013, 0.013, 0.02, 12), M(0xc9a227), 0, 0.06, 0, g);
  return g;
}
// ---------------------------------------------------------------- a criatura (original)
function creature() {
  const g = new THREE.Group();
  const dark = M(0x111014), dark2 = M(0x1d1a22);
  const robe = mesh(new THREE.ConeGeometry(0.55, 2.0, 18, 1, true), new THREE.MeshToonMaterial({ color: 0x0c0b0f, gradientMap: grad, side: THREE.DoubleSide }), 0, 1.0, 0, g); ol(robe, 0.02);
  for (let i = 0; i < 9; i++) { const sh = mesh(new THREE.ConeGeometry(0.08, 0.35, 5), dark, Math.cos(i / 9 * 6.28) * 0.5, 0.12, Math.sin(i / 9 * 6.28) * 0.5, g); sh.rotation.x = Math.PI; }
  const shoulders = mesh(sph(0.42, 18, 12), dark2, 0, 2.0, 0, g); shoulders.scale.set(1.3, 0.55, 0.8); ol(shoulders, 0.015);
  const head = new THREE.Group(); head.position.set(0, 2.42, 0.05); g.add(head);
  const skull = ol(mesh(sph(0.26, 22, 18), dark2, 0, 0, 0, head), 0.012); skull.scale.set(1, 1.15, 1);
  const hood = mesh(new THREE.SphereGeometry(0.34, 22, 14, Math.PI / 2 + 1.0, Math.PI * 2 - 2.0, 0, 2.1), new THREE.MeshToonMaterial({ color: 0x0c0b0f, gradientMap: grad, side: THREE.DoubleSide }), 0, 0.04, -0.04, head); hood.rotation.x = -0.25; ol(hood, 0.012);
  const eyeM = new THREE.MeshBasicMaterial({ color: 0xffd21a });
  const eyes = [-1, 1].map((s) => { const e = mesh(sph(0.05, 14, 10), eyeM, 0.1 * s, 0.05, 0.22, head); e.scale.set(1.2, 0.9, 0.5); mesh(sph(0.018, 8, 6), M(0x000000), 0.1 * s, 0.05, 0.245, head); return e; });
  const glow = mesh(new THREE.PlaneGeometry(0.6, 0.35), glowM(0xffc61a, 0.35), 0, 0.05, 0.25, head); glow.material.map = canvasTex(128, 64, (c) => { const gr = c.createRadialGradient(64, 32, 0, 64, 32, 60); gr.addColorStop(0, "rgba(255,210,26,.9)"); gr.addColorStop(1, "rgba(255,180,0,0)"); c.fillStyle = gr; c.fillRect(0, 0, 128, 64); }); glow.material.needsUpdate = true;
  const grin = new THREE.Group(); grin.position.set(0, -0.11, 0.21); head.add(grin);
  mesh(new THREE.TorusGeometry(0.15, 0.03, 8, 24, Math.PI), M(0x050505), 0, 0.05, 0, grin).rotation.z = Math.PI;
  for (let i = 0; i < 9; i++) { const a = Math.PI + (i + 0.5) / 9 * Math.PI; mesh(new THREE.ConeGeometry(0.016, 0.05, 4), M(0xf2f0e6), Math.cos(a) * 0.15, 0.05 + Math.sin(a) * 0.15 + 0.02, 0.02, grin).rotation.z = Math.PI; }
  const arms = [-1, 1].map((s) => {
    const a = new THREE.Group(); a.position.set(0.45 * s, 2.0, 0); g.add(a);
    ol(mesh(cap(0.05, 1.0), dark2, 0, -0.55, 0, a), 0.008);
    for (let f = 0; f < 3; f++) { const fi = mesh(new THREE.ConeGeometry(0.02, 0.2, 5), dark2, (f - 1) * 0.03, -1.18, 0, a); fi.rotation.x = Math.PI; }
    a.rotation.z = 0.15 * s; return a;
  });
  g.userData = { head, eyes, glow, arms, grin };
  return g;
}
function creatureIdle(c, t, vis = 1) {
  const u = c.userData; c.visible = vis > 0.01;
  c.position.y = Math.sin(t * 1.2) * 0.04;
  u.head.rotation.z = Math.sin(t * 0.7) * 0.12; u.head.rotation.y = Math.sin(t * 0.5) * 0.15;
  u.glow.material.opacity = (0.3 + 0.1 * Math.sin(t * 5)) * vis;
  u.arms.forEach((a, i) => (a.rotation.x = Math.sin(t * 0.9 + i) * 0.08));
}

// ---------------------------------------------------------------- cenários
function schoolYard(g, skyStops = [[0, "#2a1a3a"], [0.6, "#b3445a"], [1, "#ff9e6d"]]) {
  const sky = plane(80, 40, new THREE.MeshBasicMaterial({ map: skyTex(skyStops) })); sky.position.set(0, 14, -26); g.add(sky);
  g.add(floorP(40, 40, M(0xffffff, { map: rep(tiles("#8f8a84", "#857f79", 6), 10, 10) })));
  ol(mesh(box(16, 6, 3), M(0xc9b79c), 0, 3, -9, g), 0.04);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) mesh(box(1.1, 1.2, 0.05), new THREE.MeshBasicMaterial({ color: hash(r * 8 + c) > 0.6 ? 0xffd27a : 0x3a3f55 }), -6.3 + c * 1.8, 1.6 + r * 2.4, -7.48, g);
  for (let i = 0; i < 3; i++) { const tr = new THREE.Group(); tr.position.set(-6 + i * 6, 0, -5); g.add(tr); mesh(cyl(0.15, 0.2, 1.6), M(0x4a3628), 0, 0.8, 0, tr); ol(mesh(sph(1.0, 12, 10), M(0x2d5a32), 0, 2.2, 0, tr), 0.03); }
  ol(mesh(box(2, 0.1, 0.5), M(0x5a3b2b), 3, 0.5, -2, g), 0.01);
}
addSet("s1-patio", (g) => {
  schoolYard(g);
  const nb = notebook(); g.add(nb);
  const you = adult({ top: 0x2b2d42 }); you.position.set(-0.6, 0, 1.2); you.rotation.y = 2.6; g.add(you);
  const leaves = dustPts(80, [-4, 4, 0, 6, -4, 2]); leaves.material.color.set(0xd9a066); leaves.material.size = 0.06; g.add(leaves);
  return {
    bg: 0x2a1a3a,
    update(t) {
      still(you); breathe(you, t);
      const f = seg(t, K.cai - 0.3, K.cai + 1.4);
      nb.position.set(0.3, lerp(9, 0.02, f * f), lerp(-1.5, 0, f)); nb.rotation.set(f < 1 ? t * 3 : 0, f < 1 ? t * 4 : 0.4, f < 1 ? t * 2 : 0);
      leaves.position.y = -((t * 0.4) % 2);
      you.userData.head.rotation.x = t > K.cai + 1.4 ? 0.4 : -0.3 * f;
    },
    cam(t) { const s = T.sc["s1-patio"]; return keys(t, [[s[0], [2.4, 1.7, 4.4], [0, 2.4, -1]], [K.cai + 1.2, [1.6, 1.3, 2.6], [0.3, 0.2, 0]], [K.pagina, [0.6, 0.9, 0.9], [0.3, 0.05, 0]], [s[1], [0.45, 0.75, 0.55], [0.3, 0.03, 0]]]); },
  };
});

addSet("s2-regras", (g) => {
  g.add(floorP(10, 10, M(0x1a1614)));
  const nb = notebook(); nb.scale.setScalar(4); nb.position.set(0, 0, 0); g.add(nb); nb.userData.hinge.rotation.z = Math.PI * 0.98;
  const lines = [["REGRAS"], ["REGRAS", "1. O nome escrito nestas"], ["REGRAS", "1. O nome escrito nestas", "páginas... e a pessoa morre."], ["REGRAS", "1. O nome escrito nestas", "páginas... e a pessoa morre.", "2. É preciso saber o NOME"], ["REGRAS", "1. O nome escrito nestas", "páginas... e a pessoa morre.", "2. É preciso saber o NOME", "   e conhecer o ROSTO."]];
  const texs = lines.map((l) => paperTex(l, { stain: true }));
  const page = mesh(new THREE.PlaneGeometry(1.5, 2.1), new THREE.MeshBasicMaterial({ map: texs[0] }), 0, 0.26, 0, g); page.rotation.x = -Math.PI / 2;
  const cand = new THREE.PointLight(0xffb36b, 6, 4); cand.position.set(1.2, 1.2, 0.5); g.add(cand);
  return {
    bg: 0x0a0807,
    update(t) {
      const st = [T.sc["s2-regras"][0], K.morre - 0.6, K.morre + 0.2, K.nome1 - 0.2, K.rosto - 0.1];
      let k = 0; st.forEach((x, i) => { if (t >= x) k = i; });
      page.material.map = texs[k];
      cand.intensity = 5 + Math.sin(t * 9) * 0.6 + Math.sin(t * 13) * 0.4;
    },
    cam(t) { const s = T.sc["s2-regras"]; return keys(t, [[s[0], [0.3, 3.2, 1.6], [0, 0, 0]], [s[1], [0.1, 2.6, 1.0], [0, 0, 0.1]]]); },
  };
});

addSet("s3-feed", (g) => {
  const ph = new THREE.Group(); g.add(ph);
  ol(mesh(box(1.5, 3.0, 0.12), M(0x0d0d10), 0, 0, 0, ph), 0.02);
  const names = ["@ana.souza", "@lucas_m", "@biazinha", "@pedro.rx", "@carol.lima", "@joao.v", "@mari_s", "@gui.santos", "@leticia.r", "@rafa_08"];
  const cards = names.map((n, i) => {
    const tex = canvasTex(512, 220, (c, w, h) => { c.fillStyle = "#16161c"; c.fillRect(0, 0, w, h); c.fillStyle = ["#e76f51", "#2a9d8f", "#9b5de5", "#f4a261", "#3a86ff"][i % 5]; c.beginPath(); c.arc(100, 110, 70, 0, 7); c.fill(); c.fillStyle = "#0d0d10"; c.beginPath(); c.arc(100, 95, 28, 0, 7); c.fill(); c.beginPath(); c.arc(100, 175, 48, Math.PI, 0); c.fill(); c.fillStyle = "#fff"; c.font = "700 40px Inter, sans-serif"; c.fillText(n, 200, 100); c.fillStyle = "#888"; c.font = "30px Inter, sans-serif"; c.fillText("Seguir  ·  1,2 mil", 200, 150); });
    const m = mesh(new THREE.PlaneGeometry(1.36, 0.58), new THREE.MeshBasicMaterial({ map: tex }), 0, 0, 0.07, ph); return m;
  });
  const glow = mesh(new THREE.PlaneGeometry(3, 4.5), glowM(0x6a8cff, 0.08), 0, 0, -0.2, g);
  return {
    bg: 0x050508,
    update(t) {
      const off = (t * 0.6) % 0.62;
      cards.forEach((c, i) => { const y = 1.2 - i * 0.62 + (t - T.sc["s3-feed"][0]) * 0.6; const yy = ((y + 1.6) % (0.62 * cards.length)) - 1.6; c.position.y = yy; c.visible = yy > -1.45 && yy < 1.45; });
      ph.rotation.y = Math.sin(t * 0.5) * 0.15; ph.rotation.x = -0.1;
    },
    cam(t) { const s = T.sc["s3-feed"]; return keys(t, [[s[0], [0, 0, 5.2], [0, 0, 0]], [s[1], [0, 0, 4.2], [0, 0, 0]]]); },
  };
});

addSet("s4-sala", (g) => {
  g.add(floorP(14, 10, M(0xffffff, { map: rep(tiles("#6b5a4a", "#5f4f40", 6), 5, 4) })));
  const wl = plane(14, 5, M(0x7d8a7a)); wl.position.set(0, 2.5, -3.5); g.add(wl);
  mesh(new THREE.PlaneGeometry(4, 1.6), new THREE.MeshBasicMaterial({ map: textTex(["HISTÓRIA", "Prova sexta"], { w: 800, h: 320, bg: "#24402c", fg: "#e8e8e8", size: 70 }) }), 0, 2.4, -3.45, g);
  const desks = []; for (let r = 0; r < 2; r++) for (let c = -1; c <= 1; c++) { const d = new THREE.Group(); d.position.set(c * 1.6, 0, -0.8 + r * 1.6); g.add(d); ol(mesh(box(0.9, 0.06, 0.6), M(0xb08a5a), 0, 0.75, 0, d), 0.01); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(box(0.04, 0.75, 0.04), M(0x555555), a * 0.4, 0.375, b * 0.25, d)); desks.push(d); }
  const bully = adult({ top: 0xb5123a, skin: SK[1] }); bully.position.set(1.6, 0, -1.6); bully.rotation.y = -0.4; g.add(bully);
  const victim = adult({ top: 0x6c757d, skin: SK[3] }); victim.position.set(0.3, 0, -1.9); victim.rotation.y = 0.5; sit(victim); g.add(victim);
  const you = adult({ top: 0x2b2d42 }); you.position.set(-1.6, 0, 1.25); you.rotation.y = Math.PI; sit(you); g.add(you);
  const nb = notebook(); nb.position.set(-1.6, 0.79, 0.8); nb.scale.setScalar(0.9); g.add(nb);
  const p = pen(); g.add(p);
  return {
    bg: 0x2a3028,
    update(t) {
      sit(you); breathe(you, t); sit(victim); breathe(victim, t, 3); still(bully); breathe(bully, t, 5);
      bully.userData.arms[1].rotation.set(-1.3, 0, 0.3 + Math.sin(t * 8) * 0.2); bully.userData.body.position.y = Math.abs(Math.sin(t * 7)) * 0.03;
      victim.userData.head.rotation.x = 0.4;
      nb.userData.hinge.rotation.z = Math.PI * 0.95 * sm(seg(t, K.abre - 0.2, K.abre + 0.6));
      const pt = sm(seg(t, K.caneta - 0.6, K.caneta));
      p.position.set(-1.5 + Math.sin(t * 40) * 0.004 * pt, lerp(1.0, 0.9, pt), 0.82); p.rotation.set(-0.5, 0, 0.3);
    },
    cam(t) { const s = T.sc["s4-sala"]; return keys(t, [[s[0], [-2.6, 1.9, 3.4], [0.8, 1.2, -1.4]], [K.abre, [-0.6, 1.35, 0.2], [-1.6, 0.85, 0.95]], [K.caneta, [-1.0, 1.1, 0.35], [-1.55, 0.72, 0.85]], [s[1], [-1.05, 1.08, 0.4], [-1.55, 0.72, 0.85]]]); },
  };
});

addSet("s5-policia", (g) => {
  g.add(floorP(10, 8, M(0x2b2b30)));
  const wl = plane(10, 5, M(0x3a3e4a)); wl.position.set(0, 2.5, -2.5); g.add(wl);
  const board = ol(mesh(box(3.2, 2.0, 0.05), M(0x9c6b3f), 0, 2.0, -2.45, g), 0.01);
  const pts = []; for (let i = 0; i < 9; i++) { const x = -1.3 + hash(i) * 2.6, y = 1.2 + hash(i + 4) * 1.6; pts.push([x, y]); mesh(new THREE.PlaneGeometry(0.32, 0.4), M(0xf2efe6), x, y, -2.41, g); mesh(sph(0.03, 8, 6), M(0xe63946), x, y + 0.18, -2.39, g); }
  const strings = new THREE.BufferGeometry(); const sp = []; for (let i = 0; i < pts.length; i++) sp.push(pts[i][0], pts[i][1] + 0.18, -2.38, 0, 2.0, -2.38);
  strings.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); const strL = new THREE.LineSegments(strings, new THREE.LineBasicMaterial({ color: 0xe63946 })); g.add(strL);
  mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: textTex(["🏫"], { w: 128, h: 128, bg: "#f2efe6", size: 80 }) }), 0, 2.0, -2.39, g);
  ol(mesh(box(2.4, 0.08, 1.0), M(0x4a3628), 0, 0.8, -0.8, g), 0.01);
  const mon = ol(mesh(box(1.0, 0.62, 0.05), M(0x111111), 0.5, 1.25, -1.0, g), 0.01);
  const graph = canvasTex(400, 250, (c, w, h) => { c.fillStyle = "#06120a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#1f3a28"; for (let i = 0; i < 10; i++) { c.beginPath(); c.moveTo(i * 40, 0); c.lineTo(i * 40, h); c.stroke(); } c.strokeStyle = "#ff3a3a"; c.lineWidth = 6; c.beginPath(); [[0, 220], [60, 215], [120, 210], [180, 160], [240, 120], [300, 70], [360, 30]].forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.fillStyle = "#ff3a3a"; c.font = "700 26px monospace"; c.fillText("PADRÃO: 94%", 20, 40); });
  mesh(new THREE.PlaneGeometry(0.92, 0.55), new THREE.MeshBasicMaterial({ map: graph }), 0.5, 1.25, -0.97, g);
  const lamp = new THREE.PointLight(0xffd8a0, 4, 5); lamp.position.set(-0.8, 1.5, -0.6); g.add(lamp);
  ol(mesh(cyl(0.12, 0.2, 0.2), M(0x2a7a4a), -0.8, 1.35, -0.8, g), 0.01);
  return {
    bg: 0x0d0e14,
    update(t) { strL.geometry.setDrawRange(0, Math.floor(seg(t, K.padrao - 1.0, K.padrao + 0.6) * sp.length / 3)); },
    cam(t) { const s = T.sc["s5-policia"]; return keys(t, [[s[0], [1.6, 1.9, 2.6], [0, 1.8, -2.4]], [K.padrao, [0.4, 2.0, 0.6], [0, 1.9, -2.4]], [K.planilha, [0.9, 1.5, 0.4], [0.5, 1.25, -1.0]], [s[1], [0.75, 1.4, 0.0], [0.5, 1.25, -1.0]]]); },
  };
});

// quarto com espelho (cenas 6 e 7)
function bedroomMirror(g) {
  const fl = floorP(10, 14, M(0xffffff, { map: rep(tiles("#3b2f2a", "#352a26", 6), 4, 5) })); fl.position.z = -2; g.add(fl);
  const wm = M(0x232838);
  [[-2.8, 2.5, 4.4, 5], [2.8, 2.5, 4.4, 5]].forEach(([x, y, w, h]) => { const p = plane(w, h, wm); p.position.set(x, y, -2.0); g.add(p); });
  const top = plane(1.2, 2.4, wm); top.position.set(0, 3.8, -2.0); g.add(top);
  const bot = plane(1.2, 0.3, wm); bot.position.set(0, 0.15, -2.0); g.add(bot);
  const back = plane(10, 5, M(0x1a1e2c)); back.position.set(0, 2.5, -6.0); g.add(back);
  [[0, 2.55, 1.4, 0.1], [0, 0.25, 1.4, 0.1], [-0.65, 1.4, 0.1, 2.4], [0.65, 1.4, 0.1, 2.4]].forEach(([x, y, w, h]) => ol(mesh(box(w, h, 0.1), M(0x4a3628), x, y, -1.95, g), 0.01));
  const glass = mesh(new THREE.PlaneGeometry(1.2, 2.2), new THREE.MeshBasicMaterial({ color: 0x9fb2c9, transparent: true, opacity: 0.18, depthWrite: false }), 0, 1.4, -1.9, g);
  const lamp = new THREE.PointLight(0xff6a5a, 3, 6); lamp.position.set(1.5, 2.2, 0.5); g.add(lamp);
  ol(mesh(box(1.8, 0.5, 1.0), M(0x3a2a40), 2.6, 0.25, 0.2, g), 0.015);
  return glass;
}
function makeMirrorScene(name, withCreature) {
  addSet(name, (g) => {
    bedroomMirror(g);
    const you = adult({ top: 0x2b2d42 }); you.position.set(0, 0, 0.1); you.rotation.y = Math.PI; g.add(you);
    const nbA = notebook(); nbA.scale.setScalar(0.7); g.add(nbA);
    // reflexo: atrás do vidro, de frente pra câmera, com sorriso
    const refl = adult({ top: 0x2b2d42 }); refl.position.set(0, 0, -3.9); refl.rotation.y = 0; g.add(refl);
    const smile = mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 16, Math.PI), M(0x5a0a14), 0, 0.15, 0.19, refl.userData.head); smile.rotation.z = Math.PI;
    refl.userData.mouth.visible = false;
    const cr = creature(); cr.position.set(0.55, 0, -4.6); cr.scale.setScalar(1.05); g.add(cr);
    return {
      bg: 0x0b0c14,
      update(t) {
        still(you); breathe(you, t); still(refl); breathe(refl, t);
        you.userData.arms[1].rotation.set(-0.9, 0, 0.1);
        const hp = new THREE.Vector3(); you.userData.arms[1].children[1].getWorldPosition(hp); nbA.position.set(hp.x, hp.y, hp.z - 0.05); nbA.rotation.set(1.2, 0, 0);
        refl.userData.arms[1].rotation.set(-0.9, 0, -0.1);
        smile.visible = withCreature || t > K.virou - 0.3;
        const vis = withCreature ? sm(seg(t, K.sorrindo - 1.0, K.sorrindo)) : 0;
        creatureIdle(cr, t, vis); cr.visible = withCreature && vis > 0.02;
      },
      cam(t) {
        const s = T.sc[name];
        return withCreature ? keys(t, [[s[0], [0.75, 2.0, 1.5], [0.1, 1.9, -4]], [K.sorrindo, [0.6, 2.05, 1.0], [0.3, 2.1, -4.2]], [s[1], [0.55, 2.1, 0.85], [0.35, 2.3, -4.4]]])
          : keys(t, [[s[0], [1.4, 1.9, 2.4], [0, 1.5, -2.5]], [K.virou, [0.7, 1.95, 1.1], [-0.05, 1.8, -3.9]], [s[1], [0.6, 1.95, 0.95], [-0.05, 1.82, -3.9]]]);
      },
    };
  });
}
makeMirrorScene("s6-espelho", false);
makeMirrorScene("s7-criatura", true);

addSet("s8-gaveta", (g) => {
  g.add(floorP(10, 8, M(0xffffff, { map: rep(tiles("#3b2f2a", "#352a26", 6), 4, 3) })));
  const wl = plane(10, 5, M(0x2a2e3e)); wl.position.set(0, 2.5, -1.2); g.add(wl);
  ol(mesh(box(1.6, 0.08, 0.8), M(0x5a3b2b), 0, 0.85, -0.6, g), 0.01);
  ol(mesh(box(1.5, 0.8, 0.75), M(0x4a3020), 0, 0.42, -0.6, g), 0.01);
  const drawer = new THREE.Group(); g.add(drawer);
  ol(mesh(box(0.7, 0.22, 0.7), M(0x6b4426), 0, 0.62, -0.55, drawer), 0.01); mesh(box(0.16, 0.04, 0.04), M(0xc9a227), 0, 0.62, -0.18, drawer);
  const lock = mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), M(0xc9a227), 0.12, 0.62, -0.18, drawer);
  const nb = notebook(); nb.scale.setScalar(0.6); g.add(nb);
  const days = ["DIA 1", "DIA 7", "DIA 15", "DIA 30"].map((d) => textTex(["NOVEMBRO", d], { w: 300, h: 360, bg: "#f2efe6", fg: "#1a1a1a", size: 54 }));
  const cal = mesh(new THREE.PlaneGeometry(0.45, 0.54), new THREE.MeshBasicMaterial({ map: days[0] }), 0.6, 1.6, -1.18, g);
  const lamp = new THREE.PointLight(0xffc98a, 4, 5); lamp.position.set(-0.6, 1.6, 0); g.add(lamp);
  return {
    bg: 0x0d0e14,
    update(t) {
      const o = sm(seg(T.sc["s8-gaveta"][0], T.sc["s8-gaveta"][0] + 0.4, t)) ;
      const open = 1 - sm(seg(t, K.tranca + 0.6, K.tranca + 1.2));
      drawer.position.z = 0.35 * open;
      nb.position.set(0, lerp(1.1, 0.7, sm(seg(t, K.tranca - 0.4, K.tranca + 0.4))), -0.55 + 0.35 * open);
      lock.rotation.y = t > K.tranca + 1.2 ? Math.PI / 2 : 0;
      let k = 0; [K.dia7 - 0.1, K.semana - 0.1, K.dias30 - 0.1].forEach((x, i) => { if (t >= x) k = i + 1; });
      cal.material.map = days[k];
    },
    cam(t) { const s = T.sc["s8-gaveta"]; return keys(t, [[s[0], [0.9, 1.5, 1.4], [0, 0.7, -0.4]], [K.tranca + 1.2, [0.7, 1.3, 1.0], [0, 0.65, -0.3]], [K.dia7, [0.4, 1.5, 1.2], [0.5, 1.4, -1.1]], [s[1], [0.5, 1.55, 0.6], [0.6, 1.55, -1.15]]]); },
  };
});

addSet("s9-volta", (g) => {
  g.add(floorP(10, 8, M(0xffffff, { map: rep(tiles("#3b2f2a", "#352a26", 6), 4, 3) })));
  const wl = plane(10, 5, M(0x1b1f2e)); wl.position.set(0, 2.5, -2.0); g.add(wl);
  const win = plane(1.8, 1.6, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#04050c"], [1, "#151a3a"]], (c, w, h) => { c.fillStyle = "#fff4c2"; c.beginPath(); c.arc(190, 120, 40, 0, 7); c.fill(); }) })); win.position.set(-1.2, 2.0, -1.98); g.add(win);
  const moonL = new THREE.PointLight(0x8aa0ff, 4, 7); moonL.position.set(-1.2, 2.2, -1.0); g.add(moonL);
  const cr = creature(); cr.position.set(0.3, 0, -1.0); g.add(cr);
  const nb = notebook(); nb.scale.setScalar(0.7); g.add(nb);
  const you = adult({ top: 0x2b2d42 }); you.position.set(-0.6, 0, 1.0); you.rotation.y = Math.PI - 0.4; g.add(you);
  return {
    bg: 0x05060c,
    update(t) {
      still(you); breathe(you, t);
      const vis = sm(seg(t, K.aparece - 0.6, K.aparece + 0.4)) * (1 - sm(seg(t, K.tedio + 0.8, T.sc["s9-volta"][1])));
      creatureIdle(cr, t, vis);
      const u = cr.userData; const take = sm(seg(t, K.pega - 0.3, K.pega + 0.6));
      u.arms[1].rotation.set(-0.8 * take, 0, 0.15);
      const hp = new THREE.Vector3(); u.arms[1].getWorldPosition(hp);
      nb.position.set(lerp(-0.2, hp.x + 0.05, take), lerp(0.85, 1.4, take), lerp(0.2, -0.5, take)); nb.rotation.set(0.3, t * 0.2 * (1 - take), 0); nb.visible = vis > 0.05 || take < 0.1;
      if (t > K.tedio - 0.2) { u.arms[0].rotation.set(-1.2, 0, -1.0); u.head.rotation.z = 0.3; }
    },
    cam(t) { const s = T.sc["s9-volta"]; return keys(t, [[s[0], [1.8, 1.8, 3.2], [0, 1.6, -1]], [K.milhares, [1.6, 2.4, 2.6], [0.3, 2.1, -1]], [K.tedio, [1.2, 2.45, 1.8], [0.3, 2.3, -1]], [s[1], [1.6, 2.0, 2.6], [0.3, 1.8, -1]]]); },
  };
});

addSet("s10-pergunta", (g) => {
  const nb = notebook(); nb.scale.setScalar(3); nb.position.set(-0.4, 2.2, 0); g.add(nb);
  const fire = new THREE.Group(); fire.position.set(1.1, 1.4, 0); g.add(fire);
  const flames = [0, 1, 2, 3, 4].map((i) => mesh(new THREE.ConeGeometry(0.18 - i * 0.02, 0.6 + i * 0.1, 10), glowM([0xff3a1a, 0xff7a1a, 0xffb31a, 0xffd86b, 0xfff2b0][i], 0.7), 0, 0.3 + i * 0.03, 0, fire));
  const fl = new THREE.PointLight(0xff7a1a, 6, 6); fl.position.set(1.1, 1.8, 0.6); g.add(fl);
  const sp = dustPts(200, [-6, 6, -2, 8, -8, -2]); sp.material.color.set(0xff5a3a); g.add(sp);
  return {
    bg: 0x070405,
    update(t) {
      nb.rotation.set(0.9 + Math.sin(t * 0.6) * 0.1, t * 0.4, 0.1); nb.position.y = 2.2 + Math.sin(t) * 0.06;
      flames.forEach((f, i) => { f.scale.set(1 + Math.sin(t * 9 + i) * 0.12, 1 + Math.sin(t * 11 + i * 2) * 0.2, 1); f.rotation.y = t * (i + 1); });
      fl.intensity = 5 + Math.sin(t * 13) * 1.2;
    },
    cam(t) { const s = T.sc["s10-pergunta"]; return keys(t, [[s[0], [0, 2.2, 6.0], [0, 2.0, 0]], [s[1], [0, 2.2, 7.0], [0, 2.0, 0]]]); },
  };
});

// thumb: criatura atrás de você, caderno aberto em primeiro plano
addSet("thumb", (g) => {
  bedroomMirror(g);
  const cr = creature(); cr.position.set(0.25, 0, -0.9); cr.scale.setScalar(1.1); g.add(cr);
  const you = adult({ top: 0x2b2d42 }); you.position.set(-0.15, 0, 0.3); g.add(you);
  const nb = notebook(); nb.scale.setScalar(0.9); nb.position.set(-0.05, 1.28, 0.75); nb.rotation.set(1.0, 0.1, 0); nb.userData.hinge.rotation.z = Math.PI * 0.9; g.add(nb);
  const p = pen(); p.position.set(0.12, 1.42, 0.82); p.rotation.set(-0.4, 0, 0.5); g.add(p);
  const red = new THREE.PointLight(0xff2a3a, 6, 6); red.position.set(1.2, 2.0, 1.2); g.add(red);
  return {
    bg: 0x070608,
    update(t) { creatureIdle(cr, 1.3, 1); still(you); breathe(you, 0.5); you.userData.arms.forEach((a) => a.rotation.set(-1.0, 0, 0)); you.userData.head.rotation.x = 0.25; },
    cam() { return { pos: [0.5, 2.25, 3.6], look: [0.15, 2.5, -0.6] }; },
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
window.__hf.buildReady["caderno3d"] = (async () => {
  try { await document.fonts.load("700 48px 'Space Mono'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
