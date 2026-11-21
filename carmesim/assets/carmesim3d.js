// Cena 3D do episódio sério "E se você tivesse esse poder na vida real?" (Three.js).
// Tudo é função do tempo t (hf-seek). Tempos-chave em window.HF_T (gerado por tools/build_carmesim.py).
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

// 1 · quarto, 3h da manhã
addSet("s1-acorda", (g) => {
  g.add(Object.assign(floorP(10, 8, M(0x2b2420)), {}));
  const wl = plane(10, 5, M(0x1c2236)); wl.position.set(0, 2.5, -2.2); g.add(wl);
  const wl2 = plane(8, 5, M(0x181d2e)); wl2.position.set(-2.6, 2.5, 0); wl2.rotation.y = Math.PI / 2; g.add(wl2);
  // janela com a cidade
  const sky = plane(2.4, 1.8, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#070a18"], [1, "#1b2547"]], (c, w, h) => { for (let i = 0; i < 40; i++) { c.fillStyle = hash(i) > 0.5 ? "#ffd27a" : "#6f86b3"; c.fillRect(hash(i + 3) * w, h * 0.55 + hash(i + 7) * h * 0.4, 5, 7); } }) }));
  sky.position.set(0.6, 2.2, -2.18); g.add(sky);
  [[0.6, 3.15, 2.6, 0.08], [0.6, 1.25, 2.6, 0.08], [0.6, 2.2, 2.4, 0.05]].forEach(([x, y, w, h]) => mesh(box(w, h, 0.1), M(0x0e1220), x, y, -2.15, g));
  [[-0.65], [1.85], [0.6]].forEach(([x]) => mesh(box(0.08, 1.95, 0.1), M(0x0e1220), x, 2.2, -2.15, g));
  // reflexo do espírito no vidro
  const refl = spirit(); refl.position.set(0.25, 0.5, -2.6); refl.scale.setScalar(0.55); g.add(refl);
  // cama
  ol(mesh(box(2.0, 0.35, 2.4), M(0x4a3628), 0.2, 0.18, -0.6, g), 0.02);
  ol(mesh(box(1.9, 0.18, 2.3), M(0xd9d4cc), 0.2, 0.44, -0.6, g), 0.015);
  ol(mesh(box(1.92, 0.12, 1.5), M(0x2f4a6b), 0.2, 0.55, -0.15, g), 0.015);
  ol(mesh(box(0.7, 0.14, 0.4), M(0xe9e4dc), 0.2, 0.6, -1.55, g), 0.01);
  ol(mesh(box(2.1, 1.0, 0.12), M(0x4a3628), 0.2, 0.8, -1.82, g), 0.015);
  // criado-mudo com relógio
  ol(mesh(box(0.5, 0.55, 0.45), M(0x3b2a20), -1.3, 0.28, -1.4, g), 0.01);
  const clock = mesh(box(0.32, 0.14, 0.12), M(0x111111), -1.3, 0.63, -1.35, g);
  mesh(new THREE.PlaneGeometry(0.28, 0.1), new THREE.MeshBasicMaterial({ map: textTex(["03:00"], { w: 256, h: 96, fg: "#ff2a3a", size: 70 }) }), -1.3, 0.63, -1.285, g);
  const kid = adult({ top: 0x5a6274, pants: 0x2f4a6b }); kid.position.set(0.2, 0.08, -0.9); g.add(kid);
  const sp = spirit(); sp.position.set(0.2, 0.3, -1.5); sp.scale.setScalar(0.95); g.add(sp); refl.visible = false;
  const moon = new THREE.PointLight(0x7f9cff, 3, 7); moon.position.set(0.6, 2.3, -1.6); g.add(moon);
  return {
    bg: 0x070a18,
    update(t) {
      sit(kid); breathe(kid, t, 0, 0.5);
      // acorda e senta devagar
      const up = sm(seg(t, 0, 1.6));
      kid.userData.body.rotation.x = lerp(-1.2, 0, up); kid.userData.body.position.y = -0.46 + lerp(-0.25, 0, up);
      kid.userData.head.rotation.y = t > K.atras ? -0.25 * sm(seg(t, K.atras, K.atras + 0.8)) : 0;
      const vis = sm(seg(t, K.atras - 0.6, K.espirito));
      spiritSet(sp, t, vis); sp.position.y += 0.3; refl.visible = false;
    },
    cam(t) { const s = T.sc["s1-acorda"]; return keys(t, [[s[0], [2.2, 1.5, 2.6], [0.2, 0.8, -1]], [K.atras, [1.2, 1.5, 1.8], [0.2, 1.2, -0.9]], [K.espirito + 0.6, [1.9, 1.9, 2.9], [0.2, 1.6, -1.3]], [s[1], [1.0, 1.8, 2.3], [0.2, 1.7, -1.3]]]); },
  };
});

// 2 · faixa de pedestres na chuva
const road = (g, len = 60) => {
  g.add(floorP(len, 12, M(0x1a1c22)));
  [-1, 1].forEach((s) => ol(mesh(box(len, 0.15, 3), M(0x4a4d55), 0, 0.075, s * 6.5, g), 0.01));
  for (let i = 0; i < 7; i++) mesh(box(0.5, 0.01, 4.5), M(0xe6e6e6), -1.5 + i * 0.6, 0.006, 0, g);
  // reflexos molhados
  for (let i = 0; i < 10; i++) mesh(new THREE.PlaneGeometry(0.3, 6), glowM(i % 3 ? 0xffd27a : 0xff2a3a, 0.08), -12 + i * 2.6, 0.01, 0, g).rotation.x = -Math.PI / 2;
  for (let i = 0; i < 12; i++) building(g, -24 + i * 4.3, -11 - (i % 3), 3.6, 6 + hash(i) * 10, 3, [0x2b3040, 0x262b3a, 0x32374a][i % 3], 0xffd27a, i);
};
function car(color) {
  const c = new THREE.Group();
  ol(mesh(box(2.2, 0.55, 1.1), M(color), 0, 0.5, 0, c), 0.02);
  ol(mesh(box(1.2, 0.45, 1.0), M(color), -0.1, 0.98, 0, c), 0.02);
  mesh(box(1.1, 0.35, 1.02), M(0x223344), -0.1, 1.0, 0, c);
  [[-0.7, 0.55], [0.7, 0.55], [-0.7, -0.55], [0.7, -0.55]].forEach(([x, z]) => { const w = mesh(cyl(0.24, 0.24, 0.18, 16), M(0x111111), x, 0.24, z, c); w.rotation.x = Math.PI / 2; });
  [-0.35, 0.35].forEach((z) => mesh(sph(0.08, 10, 8), glowM(0xfff2cc, 1), 1.1, 0.55, z, c));
  const beam = mesh(new THREE.PlaneGeometry(4.5, 1.6), glowM(0xfff2cc, 0.12), 3.3, 0.3, 0, c); beam.rotation.x = -Math.PI / 2;
  return c;
}
addSet("s2-rua", (g) => {
  road(g);
  const tl = new THREE.Group(); tl.position.set(-2.4, 0, -2.6); g.add(tl);
  mesh(cyl(0.06, 0.06, 3), M(0x2a2a2a), 0, 1.5, 0, tl);
  ol(mesh(box(0.3, 0.8, 0.25), M(0x1a1a1a), 0, 3.1, 0, tl), 0.01);
  const red = mesh(sph(0.09), glowM(0xff2a3a), 0, 3.35, 0.14, tl), grn = mesh(sph(0.09), glowM(0x2aff7a, 0.15), 0, 2.85, 0.14, tl);
  for (let i = 0; i < 4; i++) { mesh(cyl(0.05, 0.05, 4), M(0x2a2a2a), -12 + i * 8, 2, -5.5, g); mesh(sph(0.18), glowM(0xffd27a), -12 + i * 8, 4.05, -5.5, g); }
  const rainU = rain(g, 380, [-8, 8, 0, 9, -6, 6], 3);
  const realCar = car(0x6b0f1a); realCar.position.set(-30, 0, -1.2); g.add(realCar);
  const ghostCar = car(0xff2a3a); ghostCar.traverse((m) => { if (m.isMesh) { m.material = glowM(0xff2a3a, 0.25); } }); ghostCar.position.set(-30, 0, -1.2); g.add(ghostCar);
  const you = adult({ top: 0x3a3f4b, hood: true }); you.position.set(0, 0, 4.6); you.rotation.y = Math.PI; g.add(you);
  const sp = spirit(); g.add(sp);
  return {
    bg: 0x0a0d18,
    update(t) {
      rainU(t);
      red.material.opacity = 0.9; grn.material.opacity = 0.12;
      // você atravessa devagar até a hora de apagar
      const crossEnd = K.apaga1;
      const z = t < crossEnd ? lerp(4.6, 0.6, seg(t, T.sc["s2-rua"][0] + 0.3, crossEnd)) : (t < K.volta1 ? 0.6 : -4.7);
      you.position.z = z; you.rotation.y = Math.PI;
      if (t < crossEnd) walk(you, t, 0.7); else { still(you); breathe(you, t); }
      // previsão: carro fantasma vermelho atravessa a faixa
      const gx = seg(t, K.visao1, K.visao1 + 1.6);
      ghostCar.visible = t > K.visao1 && t < K.apaga1; ghostCar.position.x = lerp(-18, 14, gx);
      // carro real passa logo depois que o tempo volta
      const rx = seg(t, K.volta1 - 0.6, K.volta1 + 1.6);
      realCar.position.x = t < K.volta1 - 0.6 ? -30 : lerp(-16, 22, rx);
      const on = t > K.apaga1 && t < K.volta1 ? 1 : 0;
      spiritSet(sp, t, on); sp.position.set(0, 0, z + 0.6); sp.rotation.y = Math.PI;
    },
    cam(t) { const s = T.sc["s2-rua"]; return keys(t, [[s[0], [6, 3.0, 9], [0, 1, 1.5]], [K.visao1, [5, 2.4, 6], [-1, 1, 0]], [K.apaga1, [3.6, 2.0, 3.4], [0, 1.4, 0.6]], [K.volta1, [3.6, 2.0, 3.4], [0, 1.4, 0.6]], [s[1], [7, 3.4, 4], [0, 1.0, -2]]]); },
  };
});

// 3 · as câmeras
addSet("s3-camera", (g) => {
  road(g);
  const pole = new THREE.Group(); pole.position.set(2, 0, -5.8); g.add(pole);
  mesh(cyl(0.08, 0.1, 5), M(0x2a2a2a), 0, 2.5, 0, pole);
  const arm = mesh(box(1.2, 0.08, 0.08), M(0x2a2a2a), -0.5, 4.8, 0, pole);
  const camG = new THREE.Group(); camG.position.set(-1.0, 4.62, 0.05); pole.add(camG);
  ol(mesh(box(0.55, 0.22, 0.25), M(0xdedede), 0, 0, 0, camG), 0.01);
  const lens = mesh(cyl(0.07, 0.07, 0.1, 16), M(0x111111), -0.3, 0, 0, camG); lens.rotation.z = Math.PI / 2;
  const led = mesh(sph(0.03), glowM(0xff2a3a), -0.15, 0.08, 0.13, camG);
  const rainU = rain(g, 300, [-6, 6, 0, 8, -7, 3], 7);
  return {
    bg: 0x0a0d18,
    update(t) { rainU(t); led.material.opacity = Math.sin(t * 6) > 0 ? 1 : 0.15; camG.rotation.y = 0.5 + Math.sin(t * 0.6) * 0.3; },
    cam(t) { const s = T.sc["s3-camera"]; return keys(t, [[s[0], [3.2, 3.6, -1.5], [1.0, 4.6, -5.8]], [K.video, [1.6, 4.5, -3.6], [1.0, 4.62, -5.75]], [s[1], [1.3, 4.6, -4.6], [1.0, 4.62, -5.75]]]); },
  };
});

// 4 · ônibus à noite
addSet("s4-onibus", (g) => {
  g.add(floorP(4, 14, M(0x2e3138)));
  const wallM = M(0x8a8f99);
  [-1, 1].forEach((s) => { const w = plane(14, 2.6, wallM); w.position.set(s * 1.4, 1.3, 0); w.rotation.y = -s * Math.PI / 2; g.add(w); });
  const ceil = plane(3, 14, M(0x9aa0aa)); ceil.position.y = 2.5; ceil.rotation.x = Math.PI / 2; g.add(ceil);
  for (let i = 0; i < 4; i++) mesh(box(0.3, 0.03, 2.2), glowM(0xdff3ff, 0.9), 0, 2.48, -5 + i * 3.2, g);
  // janelas com a cidade passando
  const city = new THREE.Group(); g.add(city);
  for (let i = 0; i < 30; i++) { const h = 1 + hash(i) * 3; mesh(box(1.2, h, 0.5), M(0x1b2033), -1.75 - hash(i + 3) * 1.5, h / 2 - 0.3, -20 + i * 1.6, city); mesh(box(0.15, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0xffd27a }), -1.5, h - 0.6, -20 + i * 1.6, city); }
  [-1, 1].forEach((s) => { for (let i = 0; i < 5; i++) mesh(new THREE.PlaneGeometry(1.8, 0.8), new THREE.MeshBasicMaterial({ color: 0x0a0f1e, transparent: true, opacity: 0.55 }), s * 1.39, 1.65, -5.5 + i * 2.6, g).rotation.y = -s * Math.PI / 2; });
  for (let i = 0; i < 5; i++) [-1, 1].forEach((s) => { ol(mesh(box(0.9, 0.5, 0.5), M(0x2f5d9a), s * 0.85, 0.45, -5 + i * 2.2, g), 0.01); ol(mesh(box(0.9, 0.6, 0.12), M(0x2f5d9a), s * 0.85, 0.85, -5.25 + i * 2.2, g), 0.01); });
  [-2, 0.5, 3].forEach((z) => mesh(cyl(0.025, 0.025, 2.5), M(0xd9d9d9), 0.35, 1.25, z, g));
  mesh(cyl(0.02, 0.02, 14), M(0xd9d9d9), 0.6, 2.2, 0, g).rotation.x = Math.PI / 2;
  const pas = [[-0.85, -2.8, 0x6d597a, SK[2]], [0.85, -0.6, 0x7f5539, SK[4]], [-0.85, 1.6, 0x355070, SK[0]]].map(([x, z, c, sk]) => { const p = adult({ top: c, skin: sk }); p.position.set(x, 0, z); p.rotation.y = Math.PI; sit(p); g.add(p); return p; });
  const robber = adult({ top: 0x1a1a1a, pants: 0x1a1a1a, hood: true, skin: SK[2] }); robber.position.set(0.1, 0, -1.6); g.add(robber);
  robber.traverse((m) => { if (m.isMesh && m.material !== outlineMat) m.material = m.material.clone(); });
  const you = adult({ top: 0x3a3f4b, hood: true }); you.position.set(0.85, 0, 1.6); you.rotation.y = Math.PI; sit(you); g.add(you);
  const sp = spirit(); g.add(sp);
  return {
    bg: 0x0a0f1e,
    update(t) {
      city.position.z = (t * 6) % 1.6 - 0.8;
      pas.forEach((p, i) => { sit(p); breathe(p, t, i * 2, 0.6); });
      robber.rotation.y = 0.2; breathe(robber, t, 4); robber.userData.arms[1].rotation.set(-1.5, 0, 0);
      const er = t > K.apaga3 && t < K.salvar + 0.6;
      // no tempo apagado você levanta e tenta segurar o braço: a mão atravessa
      if (er) {
        still(you); you.rotation.y = Math.PI * 0.95;
        const reach = sm(seg(t, K.apaga3 + 0.4, K.regra));
        you.position.set(lerp(0.85, 0.35, reach), 0, lerp(1.6, -0.55, reach));
        you.userData.arms[1].rotation.set(-1.5 * reach, 0, 0);
        const through = sm(seg(t, K.tocar - 0.3, K.tocar + 0.5));
        you.userData.arms[1].position.z = -0.5 * through;
        const back = seg(t, K.salvar - 0.2, K.salvar + 0.6);
        if (back > 0) { you.position.set(lerp(0.35, 0.3, back), 0, lerp(-0.55, 5.5, back)); you.userData.arms[1].position.z = 0; you.userData.arms[1].rotation.x = 0; walk(you, t, 1, 1); }
        robber.traverse((m) => { if (m.isMesh && m.material && m.material !== outlineMat) { m.material.transparent = true; m.material.opacity = 0.55; } });
      } else {
        if (t < K.apaga3) { sit(you); breathe(you, t); you.position.set(0.85, 0, 1.6); }
        robber.traverse((m) => { if (m.isMesh && m.material && m.material !== outlineMat) { m.material.opacity = 1; m.material.transparent = false; } });
      }
      spiritSet(sp, t, er ? 1 : 0); sp.position.set(you.position.x + 0.15, 0, you.position.z + 0.5); sp.rotation.y = Math.PI;
    },
    cam(t) { const s = T.sc["s4-onibus"]; return keys(t, [[s[0], [0.2, 1.7, 4.8], [0, 1.2, -2]], [K.assalto, [0.6, 1.6, 3.0], [0.1, 1.5, -1.6]], [K.regra, [-1.1, 1.8, 1.6], [0.2, 1.4, -1.2]], [K.tocar + 0.5, [-1.0, 1.7, 1.0], [0.2, 1.4, -1.3]], [s[1], [0.2, 1.8, 3.4], [0.2, 1.2, 0]]]); },
  };
});

// 5 · a briga com o pai
addSet("s5-pai", (g) => {
  g.add(floorP(10, 8, M(0x6b5a4a, { map: rep(tiles("#6b5a4a", "#5f4f40", 6), 3, 2) })));
  const wl = plane(10, 4, M(0x8b98a8)); wl.position.set(0, 2, -3); g.add(wl);
  const wl2 = plane(8, 4, M(0x7d8a9a)); wl2.position.set(3.5, 2, 0); wl2.rotation.y = -Math.PI / 2; g.add(wl2);
  ol(mesh(box(2.4, 0.5, 0.9), M(0x4a5568), -1.6, 0.25, -2.4, g), 0.02); ol(mesh(box(2.4, 0.6, 0.25), M(0x4a5568), -1.6, 0.75, -2.8, g), 0.02);
  ol(mesh(box(1.6, 0.9, 0.06), M(0x111111), 1.0, 1.6, -2.95, g), 0.01);
  ol(mesh(box(1.0, 2.1, 0.08), M(0x5a3b2b), 3.45, 1.05, 1.2, g), 0.01).rotation.y = -Math.PI / 2;
  const lamp = new THREE.PointLight(0xbfd8ff, 4, 9); lamp.position.set(-2.6, 2.6, -1.8); g.add(lamp);
  ol(mesh(cyl(0.02, 0.02, 1.6), M(0x222222), -2.6, 0.8, -2.2, g), 0.005); ol(mesh(cyl(0.12, 0.25, 0.3), M(0xe8e1d6), -2.6, 1.7, -2.2, g), 0.01);
  for (let i = 0; i < 3; i++) mesh(new THREE.PlaneGeometry(0.4, 0.5), M(0xffffff, { map: textTex([["📷", "👨‍👦", "🏖️"][i]], { w: 128, h: 160, bg: "#d9d2c3", size: 60 }) }), -2.6 + i * 0.6, 2.3, -2.97, g);
  const dad = adult({ top: 0x5c6b7a, beard: 0x3a2a20, hair: 0x3a2a20, skin: SK[2] }); dad.position.set(0.6, 0, -0.6); dad.rotation.y = -0.6; g.add(dad);
  const you = adult({ top: 0x3a3f4b, hood: true }); you.position.set(-0.6, 0, 0.4); you.rotation.y = 2.4; g.add(you);
  const sp = spirit(); g.add(sp);
  return {
    bg: 0x1b2230,
    update(t) {
      breathe(you, t); still(you); breathe(dad, t, 3);
      const du = dad.userData;
      const er = t > K.apaga4 && t < K.desculpa + 1.6;
      if (t < K.desculpa) { du.arms[1].rotation.set(-1.0 + Math.sin(t * 5) * 0.4, 0, 0.2); du.arms[0].rotation.set(-0.5 + Math.cos(t * 4) * 0.3, 0, -0.2); still(dad); }
      else if (t < K.desculpa + 1.6) { du.arms[1].rotation.set(-1.2, 0, -0.6); du.arms[0].rotation.set(0, 0, -0.06); du.head.rotation.x = 0.35; still(dad); }
      else { const w = seg(t, K.desculpa + 1.6, T.sc["s5-pai"][1]); dad.rotation.y = -Math.PI / 2 - 0.2; dad.position.set(lerp(0.6, 3.0, w), 0, lerp(-0.6, 1.0, w)); walk(dad, t, 0.8); du.head.rotation.x = 0.2; }
      spiritSet(sp, t, er ? 1 : 0); sp.position.set(you.position.x - 0.35, 0, you.position.z + 0.35); sp.rotation.y = 2.4;
    },
    cam(t) { const s = T.sc["s5-pai"]; return keys(t, [[s[0], [-2.4, 1.8, 3.4], [0.2, 1.5, -0.4]], [K.apaga4, [-1.8, 1.9, 2.6], [0, 1.6, -0.3]], [K.desculpa, [1.7, 1.8, 1.4], [0.6, 1.7, -0.6]], [K.nunca4, [-1.6, 1.8, 2.8], [0.8, 1.4, 0]], [s[1], [-2.0, 1.8, 3.4], [1.6, 1.2, 0.4]]]); },
  };
});

// 6 · o avô na escada (pôr do sol)
addSet("s6-avo", (g) => {
  const sky = plane(80, 40, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#2a1f4a"], [0.5, "#e2725b"], [1, "#ffcf8a"]]) })); sky.position.set(0, 12, -25); g.add(sky);
  g.add(floorP(40, 30, M(0x8d8d8d)));
  ol(mesh(box(8, 4, 4), M(0xe9c46a), 0, 2, -4.5, g), 0.03);
  const roof = mesh(new THREE.ConeGeometry(6, 2.2, 4), M(0x9d2f22), 0, 5.1, -4.5, g); roof.rotation.y = Math.PI / 4; ol(roof, 0.04);
  ol(mesh(box(1.1, 2.1, 0.1), M(0x5a3b2b), 0, 1.65, -2.45, g), 0.01);
  [[-2.4, 2.4], [2.4, 2.4]].forEach(([x]) => { mesh(box(1.1, 0.9, 0.08), new THREE.MeshBasicMaterial({ color: 0xffd27a }), x, 2.2, -2.45, g); });
  for (let i = 0; i < 3; i++) ol(mesh(box(2.4, 0.2, 0.45), M(0xb0aaa0), 0, 0.1 + i * 0.2, -1.2 - i * 0.42, g), 0.01);
  [-1.6, 1.6].forEach((x) => { ol(mesh(cyl(0.25, 0.2, 0.4), M(0x9c4a2f), x, 0.2, -1.6, g), 0.01); ol(mesh(sph(0.35, 12, 10), M(0x2f7a3a), x, 0.65, -1.6, g), 0.02); });
  const sun = new THREE.DirectionalLight(0xffa060, 1.4); sun.position.set(-6, 3, 2); g.add(sun);
  const avo = adult({ top: 0x8a7a64, hair: 0xe8e8e8, style: "bald", glasses: true, skin: SK[0], cane: true }); g.add(avo);
  const ghost = adult({ ghost: 0xff2a3a, ghostOpacity: 0.4, style: "bald" }); g.add(ghost);
  const you = adult({ top: 0x3a3f4b, hood: true }); g.add(you);
  return {
    bg: 0x2a1f4a,
    update(t) {
      const top = [0, 0.6, -2.05];
      // previsão: o fantasma vermelho cai pra frente
      const gv = t > K.visao5 && t < K.corre;
      ghost.visible = gv; ghost.position.set(top[0], top[1], top[2]); ghost.rotation.set(sm(seg(t, K.visao5 + 0.3, K.visao5 + 1.6)) * 1.3, 0, 0);
      // o avô desce; tropeça perto do "segura"
      breathe(avo, t, 5, 0.5); still(avo);
      const trip = sm(seg(t, K.segura - 1.3, K.segura - 0.4));
      const caught = sm(seg(t, K.segura - 0.4, K.segura + 0.2));
      avo.position.set(top[0], top[1] - trip * 0.2, top[2] + trip * 0.4);
      avo.rotation.set(lerp(0, 0.9, trip) - caught * 0.35, 0, 0);
      avo.userData.arms.forEach((a, i) => a.rotation.set(-trip * 1.4, 0, (i ? 1 : -1) * trip * 0.3));
      // você corre de verdade
      const run = sm(seg(t, K.corre - 0.2, K.segura - 0.3));
      you.position.set(lerp(-4.5, -0.05, run), 0, lerp(1.6, -0.75, run)); you.rotation.y = lerp(1.0, Math.PI - 0.1, run);
      if (run > 0 && run < 1) walk(you, t, 1.8, 1.3); else { still(you); breathe(you, t); }
      if (caught > 0) you.userData.arms.forEach((a) => a.rotation.set(-1.4 * caught, 0, 0));
    },
    cam(t) { const s = T.sc["s6-avo"]; return keys(t, [[s[0], [3.6, 1.8, 4.2], [0, 1.2, -1.6]], [K.visao5, [3.6, 2.0, 3.4], [0, 1.4, -1.8]], [K.corre, [-3.0, 1.8, 5.2], [-1.0, 1.2, -0.5]], [K.segura, [2.4, 1.6, 2.6], [0, 1.2, -1.4]], [s[1], [2.8, 1.7, 3.0], [0, 1.2, -1.4]]]); },
  };
});

// 7 · o preço (linha do tempo)
addSet("s7-preco", (g) => {
  const gridTex = canvasTex(256, 256, (c) => { c.fillStyle = "#06080f"; c.fillRect(0, 0, 256, 256); c.strokeStyle = "#1d3a6b"; c.lineWidth = 2; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, 256); c.stroke(); c.beginPath(); c.moveTo(0, i * 32); c.lineTo(256, i * 32); c.stroke(); } });
  g.add(floorP(80, 80, new THREE.MeshBasicMaterial({ map: rep(gridTex, 20, 20) })));
  const bar = mesh(box(30, 0.25, 0.25), new THREE.MeshBasicMaterial({ color: 0x3a6fd8 }), 0, 1.4, 0, g);
  for (let i = 0; i <= 30; i++) mesh(box(0.03, i % 5 ? 0.25 : 0.5, 0.03), new THREE.MeshBasicMaterial({ color: 0x9fb8ff }), -15 + i, 1.0, 0, g);
  const holes = []; for (let i = 0; i < 14; i++) { const x = -14 + hash(i + 4) * 28; const hb = mesh(box(0.25 + hash(i) * 0.5, 0.32, 0.32), glowM(0xff1a3c, 1), x, 1.4, 0, g); holes.push([hb, x]); }
  const special = mesh(box(0.6, 0.36, 0.36), glowM(0xffc94a, 1), 9, 1.4, 0, g);
  return {
    bg: 0x06080f,
    update(t) {
      const s = T.sc["s7-preco"];
      holes.forEach(([h], i) => { const a = s[0] + 0.3 + i * 0.25; h.scale.setScalar(sm(seg(t, a, a + 0.25))); });
      special.visible = t > K.menos - 0.2; special.scale.setScalar(1 + 0.15 * Math.sin(t * 8));
    },
    cam(t) { const s = T.sc["s7-preco"]; return keys(t, [[s[0], [-14, 4.0, 10], [-5, 1.4, 0]], [K.minutos, [-2, 4.2, 11], [2, 1.4, 0]], [K.menos - 0.3, [6, 3.0, 7], [9, 1.4, 0]], [s[1], [8, 2.6, 5], [9, 1.4, 0]]]); },
  };
});

// 8 · telhado à noite
addSet("s8-telhado", (g) => {
  const sky = plane(120, 50, new THREE.MeshBasicMaterial({ map: skyTex([[0, "#05060f"], [0.7, "#1a1f3d"], [1, "#3a2a4a"]]) })); sky.position.set(0, 14, -40); g.add(sky);
  g.add(floorP(14, 10, M(0x4a4d55)));
  ol(mesh(box(14, 0.6, 0.3), M(0x5a5d66), 0, 0.3, -4.0, g), 0.01);
  ol(mesh(cyl(0.9, 0.9, 1.6), M(0x6c757d), 4, 1.3, -2.2, g), 0.02); [[-0.6, 0], [0.6, 0]].forEach(([x]) => mesh(box(0.08, 0.6, 0.08), M(0x333333), 4 + x, 0.3, -2.2, g));
  mesh(cyl(0.02, 0.02, 3), M(0x333333), -4, 1.5, -3, g); const blink = mesh(sph(0.06), glowM(0xff2a3a), -4, 3.05, -3, g);
  for (let i = 0; i < 26; i++) building(g, -40 + i * 3.2, -16 - (i % 4) * 3, 2.8, 4 + hash(i + 9) * 16, 2.5, 0x161a2b, 0xffd27a, i + 40);
  const you = adult({ top: 0x3a3f4b, hood: true }); you.position.set(0, 0, -2.6); you.rotation.y = Math.PI; g.add(you);
  const sp = spirit(); sp.position.set(0.2, 0, -1.9); sp.rotation.y = Math.PI; g.add(sp);
  return {
    bg: 0x05060f,
    update(t) {
      breathe(you, t); still(you); blink.material.opacity = Math.sin(t * 3) > 0 ? 1 : 0.1;
      const s = T.sc["s8-telhado"];
      spiritSet(sp, t, 1, sm(seg(t, K.presente, K.viver)));
      sp.position.set(0.2, 0, -1.9); sp.rotation.y = Math.PI;
    },
    cam(t) { const s = T.sc["s8-telhado"]; return keys(t, [[s[0], [3.0, 2.0, -0.6], [0, 1.6, -2.3]], [K.presente, [2.6, 1.9, -1.2], [0, 1.7, -2.3]], [s[1], [1.2, 2.6, 2.2], [0, 1.8, -8]]]); },
  };
});

// 9 · pergunta (hologramas)
addSet("s9-pergunta", (g) => {
  const pts = new THREE.BufferGeometry(); const pp = []; for (let i = 0; i < 300; i++) pp.push((hash(i) - 0.5) * 20, (hash(i + 99) - 0.5) * 30, -4 - hash(i + 7) * 10);
  pts.setAttribute("position", new THREE.Float32BufferAttribute(pp, 3)); g.add(new THREE.Points(pts, new THREE.PointsMaterial({ color: 0xff3a5a, size: 0.05 })));
  const ringA = mesh(new THREE.TorusGeometry(1.0, 0.07, 12, 64, Math.PI * 1.65), glowM(0xff1a3c, 0.9), -1.3, 3.0, 0, g);
  const ringB = new THREE.Group(); ringB.position.set(1.3, 3.0, 0); g.add(ringB);
  mesh(new THREE.TorusGeometry(1.0, 0.05, 12, 64), glowM(0x4ad9ff, 0.8), 0, 0, 0, ringB);
  mesh(new THREE.OctahedronGeometry(0.5), glowM(0x4ad9ff, 0.5), 0, 0, 0, ringB);
  const sp = spirit(); sp.position.set(0, 0.2, -2.5); sp.scale.setScalar(1.4); g.add(sp);
  return {
    bg: 0x07040a,
    update(t) { ringA.rotation.set(t * 0.5, t * 0.8, 0); ringB.rotation.set(0, t * 0.9, t * 0.3); spiritSet(sp, t, 0.6); },
    cam(t) { const s = T.sc["s9-pergunta"]; return keys(t, [[s[0], [0, 2.6, 7], [0, 2.4, 0]], [s[1], [0, 2.6, 8.5], [0, 2.4, 0]]]); },
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
window.__hf.buildReady["carmesim3d"] = (async () => {
  try { await document.fonts.load("700 48px 'Space Mono'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
