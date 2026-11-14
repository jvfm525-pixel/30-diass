// Cena 3D do episódio "E se você acordasse com um relógio alienígena" (Three.js), design original.
// Tudo é função do tempo t (hf-seek). Tempos-chave vêm de window.HF_T (gerado pelo build).
import * as THREE from "./vendor/three.module.min.js";

const T = window.HF_T;
const K = T.k;
const W = 1080, H = 1920;
const INK = 0x15122b;

// ---------------------------------------------------------------- utilidades
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const sm = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, x) => a + (b - a) * x;
const lerp3 = (a, b, x) => [lerp(a[0], b[0], x), lerp(a[1], b[1], x), lerp(a[2], b[2], x)];
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function keys(t, ks) { // ks: [[t, pos, look], ...] -> {pos, look} com suavização
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
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 300);

const grad = (() => {
  const d = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  const tx = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  tx.minFilter = tx.magFilter = THREE.NearestFilter; tx.needsUpdate = true; return tx;
})();
const matCache = {};
function M(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!extra.map && matCache[key]) return matCache[key];
  const m = new THREE.MeshToonMaterial({ color, gradientMap: grad, ...extra });
  if (!extra.map) matCache[key] = m;
  return m;
}
const outlineMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m;
}
function ol(m, w = 0.045) { // contorno de HQ (casca invertida)
  const o = new THREE.Mesh(m.geometry, outlineMat);
  m.geometry.computeBoundingSphere();
  o.scale.setScalar(1 + w / Math.max(0.05, m.geometry.boundingSphere.radius));
  m.add(o); return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const sph = (r, ws = 24, hs = 18) => new THREE.SphereGeometry(r, ws, hs);
const cyl = (rt, rb, h, s = 20) => new THREE.CylinderGeometry(rt, rb, h, s);
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 14);

const REDRAW = [];
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  REDRAW.push(() => { const g = c.getContext("2d"); g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; });
  return t;
}
function tiles(c1, c2, n, line = "#00000022") {
  return canvasTex(512, 512, (g, w, h) => {
    const s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? c1 : c2; g.fillRect(i * s, j * s, s, s); }
    g.strokeStyle = line; g.lineWidth = 4;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  });
}
function rep(tex, x, y) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(x, y); return tex; }
function textTex(lines, opt = {}) {
  const { w = 512, h = 256, bg = "#ffffff", fg = "#15122b", size = 48, font = "Archivo Black" } = opt;
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = `${size}px '${font}', sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
    lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.2));
  });
}

// ---------------------------------------------------------------- o olho
function irisTex(special) {
  return canvasTex(256, 256, (g) => {
    const c = 128;
    if (!special) {
      const gr = g.createRadialGradient(c, c, 10, c, c, 128);
      gr.addColorStop(0, "#6b3f1d"); gr.addColorStop(1, "#3a210e");
      g.fillStyle = gr; g.beginPath(); g.arc(c, c, 126, 0, 7); g.fill();
      g.fillStyle = "#111"; g.beginPath(); g.arc(c, c, 52, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(c - 34, c - 38, 18, 0, 7); g.fill();
      return;
    }
    const gr = g.createRadialGradient(c, c, 10, c, c, 128);
    gr.addColorStop(0, "#ff4b4b"); gr.addColorStop(.7, "#d90b1c"); gr.addColorStop(1, "#7a0010");
    g.fillStyle = gr; g.beginPath(); g.arc(c, c, 126, 0, 7); g.fill();
    g.strokeStyle = "#140000"; g.lineWidth = 8; g.beginPath(); g.arc(c, c, 122, 0, 7); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.arc(c, c, 74, 0, 7); g.stroke();
    g.fillStyle = "#140000"; g.beginPath(); g.arc(c, c, 30, 0, 7); g.fill();
    // três marcas angulares (meias-luas com ponta), originais
    for (let k = 0; k < 3; k++) {
      const a = k * 2.094;
      g.save(); g.translate(c + Math.cos(a) * 74, c + Math.sin(a) * 74); g.rotate(a + 1.2);
      g.beginPath(); g.moveTo(-22, 0); g.lineTo(0, -18); g.lineTo(26, 6); g.lineTo(4, 2); g.closePath(); g.fill();
      g.restore();
    }
    g.fillStyle = "#ffffffaa"; g.beginPath(); g.arc(c - 40, c - 44, 14, 0, 7); g.fill();
  });
}
const IRIS_N = irisTex(false), IRIS_S = irisTex(true);
const glowTex = canvasTex(128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,40,40,1)"); gr.addColorStop(.4, "rgba(255,0,30,.5)"); gr.addColorStop(1, "rgba(255,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

// ---------------------------------------------------------------- personagens (boneco de vinil)
const SK = [0xf2c49b, 0xe0a87a, 0xb5794b, 0x8d5634, 0x5e3a22];
function person(o = {}) {
  const P = { skin: SK[1], hair: 0x2d1f17, top: 0x7b5cff, pants: 0x2b2d42, shoe: 0xffffff, style: "short", ...o };
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  // pernas
  const legs = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(0.15 * s, 0.72, 0); body.add(g);
    ol(mesh(cap(0.12, 0.42), M(P.pants), 0, -0.33, 0, g));
    ol(mesh(box(0.24, 0.14, 0.36), M(P.shoe), 0, -0.68, 0.06, g));
    return g;
  });
  // tronco
  const torso = ol(mesh(cap(0.33, 0.42), M(P.top), 0, 1.06, 0, body));
  torso.scale.set(1, 1, 0.8);
  if (o.hood !== false) ol(mesh(new THREE.TorusGeometry(0.22, 0.07, 10, 20), M(P.top), 0, 1.38, -0.06, body)).rotation.x = Math.PI / 2;
  if (o.apron) { const a = mesh(box(0.42, 0.48, 0.02), M(0xffb4c6), 0, 1.08, 0.27, body); ol(a, 0.015); }
  if (o.tie) mesh(box(0.08, 0.36, 0.03), M(0xe63946), 0, 1.18, 0.27, body);
  // braços
  const arms = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(0.4 * s, 1.32, 0); body.add(g);
    ol(mesh(cap(0.1, 0.38), M(P.top), 0, -0.26, 0, g));
    ol(mesh(sph(0.11), M(P.skin), 0, -0.56, 0, g));
    g.rotation.z = 0.12 * s;
    return g;
  });
  // cabeça
  const head = new THREE.Group(); head.position.set(0, 1.45, 0); body.add(head);
  ol(mesh(sph(0.46, 32, 24), M(P.skin), 0, 0.42, 0, head));
  mesh(sph(0.09), M(P.skin), -0.47, 0.4, 0, head); mesh(sph(0.09), M(P.skin), 0.47, 0.4, 0, head);
  const hm = M(P.hair);
  if (P.style !== "bald") {
    const cap1 = mesh(new THREE.SphereGeometry(0.49, 32, 16, 0, Math.PI * 2, 0, P.style === "long" ? 1.9 : 1.35), hm, 0, 0.44, -0.02, head);
    cap1.rotation.x = -0.35; ol(cap1, 0.02);
    if (P.style === "short") mesh(new THREE.ConeGeometry(0.08, 0.22, 8), hm, 0.05, 0.98, 0.1, head).rotation.z = -0.4;
    if (P.style === "long") { ol(mesh(cap(0.42, 0.5), hm, 0, 0.2, -0.18, head), 0.02).scale.set(1.05, 1, 0.6); }
    if (P.style === "bun") ol(mesh(sph(0.17), hm, 0, 0.98, -0.18, head), 0.02);
    if (P.style === "slick") { const q = mesh(sph(0.2), hm, 0.1, 0.9, 0.2, head); q.scale.set(1.6, .6, 1); }
  } else {
    mesh(new THREE.TorusGeometry(0.43, 0.06, 8, 24, Math.PI), hm, 0, 0.42, -0.08, head).rotation.y = Math.PI / 2;
  }
  // olhos
  const eyes = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(0.17 * s, 0.47, 0.4); head.add(g);
    const wh = mesh(sph(0.12), M(0xffffff), 0, 0, 0, g); wh.scale.z = 0.55; ol(wh, 0.02);
    const irisMat = new THREE.MeshBasicMaterial({ map: IRIS_N, transparent: true });
    const iris = mesh(new THREE.CircleGeometry(0.085, 32), irisMat, 0, 0, 0.068, g);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    glow.position.z = 0.07; g.add(glow);
    return { g, iris, irisMat, glow };
  });
  const brows = [-1, 1].map((s) => { const b = mesh(box(0.16, 0.035, 0.03), M(P.hair === 0xd9d9d9 ? 0x9a9a9a : P.hair), 0.17 * s, 0.66, 0.42, head); return b; });
  const mouthS = mesh(new THREE.TorusGeometry(0.09, 0.022, 8, 20, Math.PI), M(0x5a1a1a), 0, 0.25, 0.42, head); mouthS.rotation.z = Math.PI;
  const mouthO = mesh(sph(0.065), M(0x5a1a1a), 0, 0.24, 0.41, head); mouthO.scale.set(1, 1.2, 0.4); mouthO.visible = false;
  mesh(sph(0.05), M(P.skin), 0, 0.37, 0.46, head);
  if (o.mustache) { const m = mesh(cap(0.05, 0.22), M(o.mustache), 0, 0.31, 0.44, head); m.rotation.z = Math.PI / 2; ol(m, 0.01); }
  if (o.glasses) [-1, 1].forEach((s) => mesh(new THREE.TorusGeometry(0.13, 0.018, 8, 24), M(INK), 0.17 * s, 0.47, 0.47, head));
  if (o.shades) { const sg = mesh(box(0.62, 0.13, 0.05), M(0x111111), 0, 0.5, 0.45, head); ol(sg, 0.01); }
  if (o.cheeks) [-1, 1].forEach((s) => { const c = mesh(sph(0.06), M(0xff8fa3), 0.28 * s, 0.32, 0.38, head); c.scale.z = 0.3; });
  root.userData = { body, head, legs, arms, eyes, brows, mouthS, mouthO, torso };
  return root;
}
function setSpecial(p, on, t) { // liga o olho vermelho (olho esquerdo do personagem)
  const e = p.userData.eyes[0];
  e.irisMat.map = on > 0.5 ? IRIS_S : IRIS_N;
  e.iris.rotation.z = on > 0.5 ? -t * 4 : 0;
  e.glow.material.opacity = on * (0.75 + 0.25 * Math.sin(t * 9));
}
function blink(p, t, seed = 0) {
  const ph = (t + seed * 1.7) % 3.1;
  const s = ph < 0.12 ? 0.15 : 1;
  p.userData.eyes.forEach((e) => (e.g.scale.y = s));
}
function idle(p, t, amt = 1, seed = 0) {
  const u = p.userData;
  u.body.position.y = Math.abs(Math.sin(t * 2.2 + seed)) * 0.03 * amt;
  u.head.rotation.z = Math.sin(t * 1.3 + seed) * 0.06 * amt;
  u.head.rotation.y = Math.sin(t * 0.7 + seed) * 0.12 * amt;
  u.arms[0].rotation.x = Math.sin(t * 2 + seed) * 0.08 * amt; u.arms[1].rotation.x = -Math.sin(t * 2 + seed) * 0.08 * amt;
  blink(p, t, seed);
}
function face(p, mood) { // "smile" | "o"
  p.userData.mouthS.visible = mood !== "o"; p.userData.mouthO.visible = mood === "o";
}
function brows(p, ang) { p.userData.brows.forEach((b, i) => (b.rotation.z = ang * (i ? -1 : 1))); }

// ---------------------------------------------------------------- props
function floor(w, d, tex, color = 0xffffff) {
  const m = mesh(new THREE.PlaneGeometry(w, d), M(color, tex ? { map: tex } : {})); m.rotation.x = -Math.PI / 2; return m;
}
function wall(w, h, tex, color = 0xffffff) { return mesh(new THREE.PlaneGeometry(w, h), M(color, tex ? { map: tex } : {})); }
function table(w = 1.6, d = 0.9, h = 0.95, top = 0x9c6b3f) {
  const g = new THREE.Group();
  ol(mesh(box(w, 0.08, d), M(top), 0, h, 0, g), 0.02);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(box(0.08, h, 0.08), M(0x6f4a2a), a * (w / 2 - 0.08), h / 2, b * (d / 2 - 0.08), g));
  return g;
}
function plant(s = 1) {
  const g = new THREE.Group();
  ol(mesh(cyl(0.2 * s, 0.15 * s, 0.3 * s), M(0xe76f51), 0, 0.15 * s, 0, g), 0.02);
  for (let i = 0; i < 6; i++) { const l = mesh(sph(0.16 * s, 10, 8), M(i % 2 ? 0x2a9d4b : 0x4cbf6a), Math.cos(i) * 0.12 * s, 0.45 * s + (i % 3) * 0.12 * s, Math.sin(i) * 0.12 * s, g); l.scale.y = 1.6; }
  return g;
}
function chair(color = 0x3a86ff) {
  const g = new THREE.Group();
  ol(mesh(box(0.5, 0.06, 0.5), M(color), 0, 0.5, 0, g), 0.015);
  ol(mesh(box(0.5, 0.5, 0.06), M(color), 0, 0.78, -0.22, g), 0.015);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(box(0.05, 0.5, 0.05), M(0x6c757d), a * 0.2, 0.25, b * 0.2, g));
  return g;
}
function windowFrame(w, h, sky, frame = 0xffffff) {
  const g = new THREE.Group();
  mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sky }), 0, 0, 0, g);
  [[0, h / 2, w + 0.1, 0.1], [0, -h / 2, w + 0.1, 0.1], [0, 0, w, 0.06]].forEach(([x, y, ww, hh]) => mesh(box(ww, hh, 0.08), M(frame), x, y, 0.03, g));
  [[-w / 2, 0], [w / 2, 0], [0, 0]].forEach(([x]) => mesh(box(0.08, h + 0.1, 0.08), M(frame), x, 0, 0.03, g));
  return g;
}
function skyTex(top, bottom, extra) {
  return canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom);
    g.fillStyle = gr; g.fillRect(0, 0, w, h); if (extra) extra(g, w, h);
  });
}

// ---------------------------------------------------------------- luzes
const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 1.4); scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff1dd, 2.2); key.position.set(3, 6, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0x9fd8ff, 1.0); rim.position.set(-4, 3, -4); scene.add(rim);

const SETS = {};
function addSet(name, build) { const g = new THREE.Group(); g.visible = false; scene.add(g); const s = build(g); s.group = g; SETS[name] = s; }

// ---------------------------------------------------------------- relógio alienígena (design original: mostrador hexagonal com símbolo de órbita)
const glowM = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
const dialTex = canvasTex(256, 256, (g) => {
  g.fillStyle = "#0a1a10"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#5cff8a"; g.lineWidth = 10;
  g.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI * 2 + Math.PI / 6; const x = 128 + Math.cos(a) * 100, y = 128 + Math.sin(a) * 100; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.fillStyle = "#5cff8a"; g.beginPath(); g.arc(128, 128, 20, 0, 7); g.fill();
  g.lineWidth = 7; [[0], [1.05], [2.1]].forEach(([a]) => { g.save(); g.translate(128, 128); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 70, 26, 0, 0, 7); g.stroke(); g.restore(); });
});
function alienWatch(s = 1) {
  const g = new THREE.Group();
  const band = mesh(new THREE.TorusGeometry(0.13 * s, 0.045 * s, 10, 28), M(0x2a2f2a), 0, 0, 0, g); band.rotation.y = Math.PI / 2; ol(band, 0.01 * s);
  const body = ol(mesh(cyl(0.11 * s, 0.12 * s, 0.07 * s, 6), M(0x3a3f3a), 0, 0.15 * s, 0, g), 0.01 * s);
  const face = mesh(new THREE.CircleGeometry(0.09 * s, 6), new THREE.MeshBasicMaterial({ map: dialTex }), 0, 0.186 * s, 0, g); face.rotation.x = -Math.PI / 2; face.rotation.z = Math.PI / 6;
  const halo = mesh(new THREE.PlaneGeometry(0.6 * s, 0.6 * s), glowM(0x5cff8a, 0.5), 0, 0.19 * s, 0, g); halo.rotation.x = -Math.PI / 2;
  halo.material.map = canvasTex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(92,255,138,.9)"); gr.addColorStop(1, "rgba(92,255,138,0)"); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); }); halo.material.needsUpdate = true;
  g.userData = { face, halo };
  return g;
}
function attachWatch(p, s = 0.9) { const w = alienWatch(s); w.position.set(0, -0.48, 0); w.rotation.z = Math.PI / 2; p.userData.arms[0].add(w); p.userData.watch = w; return w; }
function aura(color, w = 1.6, h = 2.6) {
  const m = mesh(new THREE.PlaneGeometry(w, h), glowM(color, 0.0), 0, 1.2, -0.2);
  m.material.map = canvasTex(128, 192, (c) => { const gr = c.createRadialGradient(64, 96, 0, 64, 96, 90); gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gr; c.fillRect(0, 0, 128, 192); }); m.material.needsUpdate = true;
  return m;
}
const sparkPts = (n, b, color, size = 0.04) => { const p = []; for (let i = 0; i < n; i++) p.push(b[0] + hash(i) * (b[1] - b[0]), b[2] + hash(i + 7) * (b[3] - b[2]), b[4] + hash(i + 13) * (b[5] - b[4])); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); };
function car(color = 0xe63946) {
  const c = new THREE.Group();
  ol(mesh(box(2.0, 0.5, 1.0), M(color), 0, 0.5, 0, c), 0.02); ol(mesh(box(1.1, 0.45, 0.9), M(color), -0.1, 0.95, 0, c), 0.02);
  mesh(box(1.0, 0.33, 0.92), M(0x9fd8ef), -0.1, 0.97, 0, c);
  [[-0.65, 0.5], [0.65, 0.5], [-0.65, -0.5], [0.65, -0.5]].forEach(([x, z]) => { const w = mesh(cyl(0.22, 0.22, 0.16, 16), M(0x111111), x, 0.22, z, c); w.rotation.x = Math.PI / 2; });
  return c;
}
function streetSet(g, sky = ["#7fc8f8", "#e8f6ff"]) {
  const sk = mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ map: skyTex(sky[0], sky[1]) }), 0, 12, -25, g);
  g.add(floor(60, 40, rep(tiles("#555a66", "#4f5460", 4), 10, 8)));
  for (let i = 0; i < 14; i++) mesh(box(1.2, 0.01, 0.15), M(0xffffff), -16 + i * 2.5, 0.01, 0, g);
  [-1, 1].forEach((s) => ol(mesh(box(60, 0.2, 3), M(0xb8b8b0), 0, 0.1, s * 4.5, g), 0.01));
  for (let i = 0; i < 9; i++) { const h = 3 + hash(i) * 5, x = -16 + i * 4; ol(mesh(box(3.4, h, 3), M([0xf4a261, 0xe9c46a, 0x8ecae6, 0xcdb4db, 0xffafcc][i % 5]), x, h / 2, -8, g), 0.03); for (let r = 0; r < Math.floor(h / 1.2); r++) for (let c = 0; c < 3; c++) mesh(box(0.5, 0.6, 0.02), M(0xfff6c2), x - 1 + c, 0.9 + r * 1.2, -6.49, g); }
  for (let i = 0; i < 5; i++) { const tr = new THREE.Group(); tr.position.set(-14 + i * 7, 0, 5.8); g.add(tr); mesh(cyl(0.12, 0.15, 1.6), M(0x6f5238), 0, 0.8, 0, tr); ol(mesh(sph(0.9, 12, 10), M(0x3f8a3a), 0, 2.1, 0, tr), 0.03); }
}

// 1 · acordar com o relógio
addSet("s1-acorda", (g) => {
  const wl = wall(10, 6, null, 0x9ec8e8); wl.position.set(0, 3, -2.2); g.add(wl);
  g.add(floor(10, 8, rep(tiles("#c08552", "#b07845", 6), 3, 3)));
  const win = windowFrame(1.6, 1.3, skyTex("#ffd6a5", "#fff6c2", (c) => { c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(170, 150, 34, 0, 7); c.fill(); })); win.position.set(-1.6, 2.6, -2.15); g.add(win);
  ol(mesh(box(2.2, 0.45, 2.6), M(0x5a3b2b), 0.4, 0.22, -0.7, g), 0.02); ol(mesh(box(2.1, 0.2, 2.5), M(0xffffff), 0.4, 0.5, -0.7, g), 0.02); ol(mesh(box(2.12, 0.14, 1.6), M(0x2a9d8f), 0.4, 0.62, -0.2, g), 0.02); ol(mesh(box(0.8, 0.16, 0.45), M(0xf1f1f1), 0.4, 0.67, -1.7, g), 0.01);
  ol(mesh(box(0.6, 0.6, 0.5), M(0x8a5a35), -1.3, 0.3, -1.4, g), 0.01);
  mesh(new THREE.PlaneGeometry(0.9, 1.2), M(0xffffff, { map: textTex(["👽", "ALIENS"], { w: 220, h: 300, bg: "#3a86ff", size: 52 }) }), 1.8, 2.6, -2.15, g);
  const kid = person({ top: 0x2b2d42, hood: false }); kid.position.set(0.4, 0.2, -0.9); g.add(kid);
  const w = attachWatch(kid);
  const glowL = new THREE.PointLight(0x5cff8a, 0, 4); g.add(glowL);
  return {
    bg: 0x9ec8e8,
    update(t) {
      const u = kid.userData; const up = sm(seg(t, 0.2, 1.4));
      u.body.rotation.x = lerp(-1.3, 0, up); u.body.position.y = lerp(-0.3, 0, up); u.legs.forEach((l) => (l.rotation.x = -1.4));
      const wake = t > K.olho - 0.2; u.eyes.forEach((e) => (e.g.scale.y = wake ? 1 : 0.12)); if (wake) blink(kid, t);
      u.arms[0].rotation.set(t > K.relogio0 - 0.3 ? -1.6 : -0.2, 0, 0.3); u.head.rotation.x = t > K.relogio0 ? 0.35 : 0;
      face(kid, t > K.relogio0 && t < K.horas ? "o" : "smile"); brows(kid, t > K.relogio0 ? -0.2 : 0);
      const pulse = 0.5 + 0.5 * Math.sin(t * 5); w.userData.halo.material.opacity = (t > K.relogio0 - 0.3 ? 0.8 : 0.3) * (0.6 + 0.4 * pulse);
      const wp = new THREE.Vector3(); w.getWorldPosition(wp); glowL.position.copy(wp); glowL.intensity = t > K.relogio0 - 0.3 ? 3 : 0.5;
    },
    cam(t) { const s = T.sc["s1-acorda"]; return keys(t, [[s[0], [2.8, 2.5, 3.8], [0.4, 1.2, -0.9]], [K.relogio0, [1.9, 2.0, 1.6], [0.1, 1.3, -0.8]], [K.horas, [1.7, 1.95, 1.4], [0.1, 1.35, -0.8]], [s[1], [2.4, 2.2, 2.8], [0.4, 1.3, -0.9]]]); },
  };
});

// 2 · as 10 silhuetas
addSet("s2-silhuetas", (g) => {
  const w = alienWatch(4); w.position.set(0, 0.4, 0); g.add(w);
  const sil = [];
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Group(); g.add(s);
    const c = [0xff3a3a, 0x3ab0ff, 0xff8a1a, 0x9fefff, 0xb08aff, 0x5cff8a, 0xffd23f, 0xff6fd8, 0x8ce99a, 0xffffff][i];
    const m = glowM(c, 0.7);
    const kind = i % 5;
    mesh(kind === 1 ? cap(0.12, 0.5) : cap(0.18 + (kind === 0) * 0.08, 0.4), m, 0, 0.55, 0, s);
    mesh(sph(kind === 4 ? 0.22 : 0.15, 12, 10), m, 0, 1.05, 0, s);
    if (kind === 0) [-1, 1].forEach((k) => [0.2, 0.45].forEach((y) => { const a = mesh(cap(0.05, 0.35), m, k * 0.3, 0.55 + y * 0.6, 0, s); a.rotation.z = k * 0.6; }));
    if (kind === 3) for (let k = 0; k < 4; k++) mesh(new THREE.ConeGeometry(0.06, 0.25, 4), m, (k - 1.5) * 0.1, 1.25, 0, s);
    sil.push(s);
  }
  const st = sparkPts(300, [-5, 5, -2, 6, -6, -1], 0x5cff8a, 0.04); g.add(st);
  return {
    bg: 0x041008,
    update(t) {
      w.userData.halo.material.opacity = 0.6 + 0.3 * Math.sin(t * 4);
      sil.forEach((s, i) => { const a = (i / 10) * Math.PI * 2 + t * 0.6; const on = sm(seg(t, K.silhuetas - 0.6 + i * 0.08, K.silhuetas + i * 0.08)); s.position.set(Math.cos(a) * 1.9, 1.3 + Math.sin(t * 2 + i) * 0.08, Math.sin(a) * 1.9); s.scale.setScalar(1.7 * on * (1 + (i === 0 && t > K.escolhe ? 0.4 : 0))); s.rotation.y = -a; });
      st.rotation.y = t * 0.2;
    },
    cam(t) { const s = T.sc["s2-silhuetas"]; return keys(t, [[s[0], [0, 1.6, 2.2], [0, 0.6, 0]], [K.silhuetas, [0, 2.4, 5.4], [0, 1.2, 0]], [s[1], [1.2, 2.2, 4.6], [0, 1.3, 0]]]); },
  };
});

// 3 · força (4 braços de energia vermelha + carro erguido)
addSet("s3-forca", (g) => {
  streetSet(g);
  const kid = person({ top: 0x2b2d42, hood: false }); kid.position.set(0, 0, 1.6); kid.rotation.y = -0.4; g.add(kid); attachWatch(kid);
  const au = aura(0xff3a3a, 2.4, 3.4); kid.add(au);
  const arms = []; [-1, 1].forEach((s) => [0, 1].forEach((k) => { const a = new THREE.Group(); a.position.set(0.45 * s, 1.15 + k * 0.25, 0); kid.add(a); mesh(cap(0.11, 0.7), glowM(0xff3a3a, 0.75), 0, 0.45, 0, a); mesh(sph(0.14, 10, 8), glowM(0xff7a5a, 0.9), 0, 0.92, 0, a); a.rotation.z = -s * (0.25 + k * 0.25); arms.push(a); }));
  const c = car(0x3a86ff); c.position.set(0.1, 0, 0.4); g.add(c);
  const drivers = [0, 1].map((i) => { const d = car([0xe9c46a, 0x8ecae6][i]); d.position.set(-6 + i * 12, 0, 1.6); d.rotation.y = i ? Math.PI : 0; g.add(d); return d; });
  return {
    bg: 0x7fc8f8,
    update(t) {
      idle(kid, t, 0.4); face(kid, "smile");
      const on = sm(seg(t, K.forca - 0.6, K.forca)); au.material.opacity = 0.5 * on;
      arms.forEach((a) => (a.visible = on > 0.05, a.scale.setScalar(on + 0.001)));
      const lift = sm(seg(t, K.ergue - 0.3, K.ergue + 0.8));
      c.position.set(0.1, 0.0 + lift * 2.5, lerp(0.4, 1.3, lift)); c.rotation.z = lift * 0.15;
      kid.userData.arms.forEach((a) => a.rotation.set(-2.6 * lift, 0, 0));
      drivers.forEach((d, i) => { d.position.x = (i ? 6 : -6) + (i ? -1 : 1) * Math.min(2.5, Math.max(0, t - K.transito + 1.5) * 2); });
    },
    cam(t) { const s = T.sc["s3-forca"]; return keys(t, [[s[0], [3.4, 2.2, 6.6], [0, 1.5, 1]], [K.ergue, [2.6, 1.6, 5.2], [0, 2.2, 1]], [s[1], [-2.6, 2.4, 6.4], [0, 2.0, 1]]]); },
  };
});

// 4 · velocidade (rastro azul) + professora caindo + flash
addSet("s4-velocidade", (g) => {
  streetSet(g, ["#9fd0f5", "#fff1c9"]);
  const school = new THREE.Group(); school.position.set(14, 0, -2); g.add(school);
  ol(mesh(box(8, 4, 4), M(0xffe0b2), 0, 2, -3, school), 0.03); mesh(new THREE.PlaneGeometry(3, 0.8), M(0xffffff, { map: textTex(["COLÉGIO"], { w: 400, h: 110, bg: "#c44536", size: 64 }) }), 0, 3.4, -0.98, school);
  const kid = person({ top: 0x2b2d42, hood: false }); kid.rotation.y = Math.PI / 2; g.add(kid); attachWatch(kid);
  const au = aura(0x3ab0ff, 2, 3); kid.add(au);
  const trail = []; for (let i = 0; i < 8; i++) { const tr = mesh(new THREE.PlaneGeometry(1.5, 0.08), glowM(0x3ab0ff, 0.6), 0, 0, 0, g); trail.push(tr); }
  const prof = person({ skin: SK[1], style: "bun", hair: 0x5a3b2b, top: 0x9b5de5, hood: false, glasses: true }); prof.position.set(13.2, 0, 0.6); prof.rotation.y = -Math.PI / 2; g.add(prof);
  const papers = []; for (let i = 0; i < 8; i++) papers.push(mesh(new THREE.PlaneGeometry(0.25, 0.32), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), 0, 0, 0, g));
  return {
    bg: 0x9fd0f5,
    update(t) {
      const run = seg(t, K.quilometros - 0.4, K.chega + 0.6);
      kid.position.set(lerp(-14, 10.8, sm(run)), 0, 1.2);
      const fast = run > 0 && run < 1; au.material.opacity = fast ? 0.5 : 0.15;
      if (fast) { const u = kid.userData, c = t * 30; u.legs[0].rotation.x = Math.sin(c) * 1.1; u.legs[1].rotation.x = -Math.sin(c) * 1.1; u.body.rotation.x = 0.35; } else { idle(kid, t, 0.4); kid.userData.body.rotation.x = 0; kid.userData.legs.forEach((l) => (l.rotation.x = 0)); }
      trail.forEach((tr, i) => { tr.visible = fast; tr.position.set(kid.position.x - 0.8 - i * 0.6, 0.6 + (i % 4) * 0.35, 1.2); tr.material.opacity = 0.6 - i * 0.06; });
      const fall = sm(seg(t, K.caindo - 0.8, K.caindo));
      prof.rotation.set(0, -Math.PI / 2, -fall * 1.4); prof.position.y = -fall * 0.2; face(prof, fall > 0.2 ? "o" : "smile");
      papers.forEach((p, i) => { const dt = t - (K.caindo - 0.8); p.visible = dt > 0; p.position.set(13.2 + (hash(i) - 0.5) * 2 * Math.min(1, dt), 1.4 + dt * 0.8 - dt * dt * 0.5, 0.6 + (hash(i + 3) - 0.5) * 2 * Math.min(1, dt)); p.rotation.set(dt * 4 * hash(i), dt * 3, 0); });
      if (t > K.foto - 0.2) { kid.userData.arms[1].rotation.set(-1.6, 0, 0); }
    },
    cam(t) { const s = T.sc["s4-velocidade"]; const kx = kid.position.x; return t < K.chega + 0.6 ? { pos: [kx - 2, 2.0, 6], look: [kx + 1, 1.2, 1] } : keys(t, [[K.chega + 0.6, [10, 2.0, 6], [13, 1.2, 0.8]], [s[1], [11, 1.8, 4.6], [13, 1.0, 0.6]]]); },
  };
});

// 5 · salvar o mundo? ficar rico? errado.
addSet("s5-errado", (g) => {
  const gl = new THREE.Group(); gl.position.set(-0.9, 2.4, 0); g.add(gl);
  ol(mesh(sph(0.8, 32, 24), M(0x3a86ff), 0, 0, 0, gl), 0.02);
  for (let i = 0; i < 5; i++) mesh(sph(0.3, 10, 8), M(0x4cbf6a), Math.cos(i * 1.3) * 0.6, Math.sin(i * 2.1) * 0.5, 0.45 + (i % 2) * 0.1, gl).scale.set(1.3, 0.8, 0.5);
  const coins = new THREE.Group(); coins.position.set(1.0, 1.6, 0); g.add(coins);
  for (let i = 0; i < 9; i++) { const c = mesh(cyl(0.22, 0.22, 0.06, 20), M(0xffd23f), (hash(i) - 0.5) * 0.4, i * 0.07, (hash(i + 2) - 0.5) * 0.4, coins); ol(c, 0.01); }
  const st = sparkPts(200, [-5, 5, -2, 7, -6, -2], 0xffffff, 0.03); g.add(st);
  return {
    bg: 0x14122b,
    update(t) { gl.rotation.y = t * 0.6; coins.rotation.y = -t * 0.8; const e1 = seg(t, K.errado1, K.errado1 + 0.3), e2 = seg(t, K.errado2, K.errado2 + 0.3); gl.scale.setScalar(1 - e1 * 0.4); coins.scale.setScalar(1 - e2 * 0.4); },
    cam() { return { pos: [0, 2.2, 6], look: [0, 2.0, 0] }; },
  };
});

// 6 · fogo na mão
addSet("s6-fogo", (g) => {
  g.add(floor(30, 30, rep(tiles("#d9d2c3", "#cfc6b4", 6), 8, 8)));
  const wl = wall(30, 6, null, 0xfcefc7); wl.position.set(0, 3, -5); g.add(wl);
  for (let i = -6; i <= 6; i++) ol(mesh(box(0.9, 2.2, 0.5), M(i % 2 ? 0x3a86ff : 0xe63946), i * 0.95, 1.1, -4.7, g), 0.015);
  const crush = person({ skin: SK[3], style: "long", hair: 0x1a1210, top: 0x9b5de5, hood: false, cheeks: true }); crush.position.set(0.8, 0, -0.4); crush.rotation.y = -0.6; g.add(crush);
  const kid = person({ top: 0x2b2d42, hood: false }); kid.position.set(-0.7, 0, 0.3); kid.rotation.y = 0.7; g.add(kid); attachWatch(kid);
  const au = aura(0xff8a1a, 2, 3); kid.add(au);
  const fire = new THREE.Group(); g.add(fire);
  [0xff3a1a, 0xff7a1a, 0xffb31a, 0xfff2b0].forEach((c, i) => mesh(new THREE.ConeGeometry(0.16 * (1 - i * 0.2), 0.42 * (1 - i * 0.15), 10), glowM(c, 0.8), 0, 0.2, 0, fire));
  const fl = new THREE.PointLight(0xff8a2a, 0, 4); g.add(fl);
  const smoke = sparkPts(40, [-0.1, 0.1, 0, 0.8, -0.1, 0.1], 0xcccccc, 0.06); fire.add(smoke);
  return {
    bg: 0xfcefc7,
    update(t) {
      idle(kid, t, 0.4); idle(crush, t, 0.5, 4);
      const on = sm(seg(t, K.fogo - 0.4, K.fogo + 0.2)); au.material.opacity = 0.45 * on;
      kid.userData.arms[1].rotation.set(-1.4 * on, 0, 0.3);
      const hp = new THREE.Vector3(); kid.userData.arms[1].children[1].getWorldPosition(hp);
      fire.position.set(hp.x, hp.y + 0.08, hp.z); fire.scale.setScalar(on + 0.001); fire.children.forEach((c, k) => { if (c.isMesh) c.scale.set(1 + Math.sin(t * 9 + k) * 0.15, 1 + Math.sin(t * 11 + k) * 0.2, 1); });
      fl.position.copy(fire.position); fl.intensity = 4 * on;
      smoke.position.y = (t * 0.6) % 0.6;
      const shock = t > K.acender; face(crush, shock && t < K.classico + 0.4 ? "o" : "smile"); brows(crush, shock ? 0.3 : 0);
      face(kid, "smile");
    },
    cam(t) { const s = T.sc["s6-fogo"]; return keys(t, [[s[0], [0.2, 1.9, 4.6], [0, 1.4, 0]], [K.fogo, [-0.1, 1.8, 3.6], [-0.1, 1.4, 0]], [K.acender, [0.5, 1.9, 3.8], [0.2, 1.4, -0.2]], [s[1], [0.4, 1.9, 4.0], [0.1, 1.4, -0.1]]]); },
  };
});

// 7 · cristal na prova + invisível no recreio
addSet("s7-prova", (g) => {
  const wl = wall(14, 6, null, 0xf2cc8f); wl.position.set(0, 3, -3); g.add(wl);
  g.add(floor(14, 10, rep(tiles("#a3785a", "#966b4e", 6), 5, 4)));
  mesh(new THREE.PlaneGeometry(4.2, 1.8), new THREE.MeshBasicMaterial({ map: textTex(["PROVA FINAL", "Nº 1  2  3  4"], { w: 840, h: 360, bg: "#2f5d3a", fg: "#ffffff", size: 64, font: "Permanent Marker" }) }), 0, 2.6, -2.95, g);
  for (let c = -1; c <= 1; c++) { const d = table(1.0, 0.6, 0.75, 0xe9c46a); d.position.set(c * 1.8, 0, 0.4); g.add(d); }
  const kid = person({ top: 0x2b2d42, hood: false }); kid.position.set(0, 0, 0.95); kid.rotation.y = Math.PI; g.add(kid); attachWatch(kid);
  const crystals = []; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const cr = mesh(new THREE.OctahedronGeometry(0.25 + hash(i) * 0.15), new THREE.MeshPhongMaterial({ color: 0x9fefff, transparent: true, opacity: 0.75, shininess: 120, specular: 0xffffff }), Math.cos(a) * 1.0, 0.5 + hash(i + 3) * 1.4, 0.9 + Math.sin(a) * 1.0, g); cr.scale.y = 2.2; crystals.push(cr); }
  const kidMats = []; kid.traverse((m) => { if (m.isMesh && m.material && m.material.type === "MeshToonMaterial") { m.material = m.material.clone(); m.material.transparent = true; kidMats.push(m.material); } });
  const sparkles = sparkPts(120, [-1.2, 1.2, 0, 2.2, -0.2, 2.0], 0xb08aff, 0.05); g.add(sparkles);
  return {
    bg: 0xf2cc8f,
    update(t) {
      idle(kid, t, 0.3);
      const cr = sm(seg(t, K.cristal - 0.3, K.cristal + 0.4)) * (1 - sm(seg(t, K.invisivel - 0.5, K.invisivel)));
      crystals.forEach((c, i) => { c.scale.set(cr, 2.2 * cr, cr); c.rotation.y = t * 0.5 + i; c.visible = cr > 0.02; });
      const inv = sm(seg(t, K.invisivel - 0.2, K.invisivel + 0.5)) * (1 - sm(seg(t, K.passou + 0.6, K.passou + 1.2)));
      kidMats.forEach((m) => (m.opacity = 1 - inv * 0.85)); sparkles.visible = inv > 0.1; sparkles.position.y = Math.sin(t * 2) * 0.1;
      face(kid, t > K.passou ? "smile" : "smile");
    },
    cam(t) { const s = T.sc["s7-prova"]; return keys(t, [[s[0], [2.4, 2.4, -2.4], [0, 1.2, 0.9]], [K.cristal, [1.6, 2.1, -2.0], [0, 1.2, 0.9]], [K.invisivel, [0.6, 1.9, -1.8], [0, 1.3, 0.9]], [s[1], [1.8, 2.2, -2.4], [0, 1.3, 0.9]]]); },
  };
});

// 8 · o relógio sai do pulso
addSet("s8-fim", (g) => {
  const wl = wall(10, 6, null, 0x2a3355); wl.position.set(0, 3, -2.2); g.add(wl);
  g.add(floor(10, 8, rep(tiles("#6b4a35", "#5f412e", 6), 3, 3)));
  const win = windowFrame(1.6, 1.3, skyTex("#ff9e6d", "#ffd6a5", (c) => { c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(128, 200, 40, 0, 7); c.fill(); })); win.position.set(0.6, 2.6, -2.15); g.add(win);
  ol(mesh(box(1.6, 0.08, 0.8), M(0x8a5a35), -0.8, 0.85, -1.4, g), 0.01); ol(mesh(box(1.5, 0.8, 0.7), M(0x6f4a2a), -0.8, 0.42, -1.4, g), 0.01);
  const kid = person({ top: 0x2b2d42, hood: false }); kid.position.set(0.3, 0, -0.4); g.add(kid);
  const w = alienWatch(0.9); g.add(w);
  const sunL = new THREE.PointLight(0xffb36b, 3, 6); sunL.position.set(0.6, 2.6, -1.6); g.add(sunL);
  return {
    bg: 0x2a3355,
    update(t) {
      idle(kid, t, 0.4); face(kid, "smile");
      const off = sm(seg(t, K.sai - 0.3, K.sai + 0.9));
      const hp = new THREE.Vector3(); kid.userData.arms[0].children[1].getWorldPosition(hp);
      w.position.set(lerp(hp.x, -0.8, off), lerp(hp.y + 0.05, 0.92, off) + Math.sin(off * Math.PI) * 0.4, lerp(hp.z, -1.4, off)); w.rotation.set(off * 4, 0, Math.PI / 2 * (1 - off));
      w.userData.halo.material.opacity = 0.7 * (1 - off) + 0.05;
      kid.userData.arms[0].rotation.set(-1.0 * (1 - off), 0, 0.3);
      kid.userData.head.rotation.y = t > K.heroi - 0.5 ? 0.0 : -0.4;
    },
    cam(t) { const s = T.sc["s8-fim"]; return keys(t, [[s[0], [1.8, 1.9, 2.6], [0, 1.3, -0.6]], [K.sai, [1.8, 1.8, 1.8], [-0.3, 1.0, -0.8]], [K.heroi, [1.4, 1.95, 2.4], [0.3, 1.6, -0.4]], [s[1], [1.6, 2.0, 2.8], [0.3, 1.5, -0.4]]]); },
  };
});

// 9 · pergunta
addSet("s9-pergunta", (g) => {
  const w = alienWatch(3.5); w.position.set(0, 2.2, 0); w.rotation.x = 0.9; g.add(w);
  const st = sparkPts(400, [-8, 8, -4, 10, -10, -2], 0x5cff8a, 0.035); g.add(st);
  return { bg: 0x041008, update(t) { w.rotation.z = Math.sin(t) * 0.2; w.userData.halo.material.opacity = 0.5 + 0.3 * Math.sin(t * 4); st.rotation.y = t * 0.1; }, cam() { return { pos: [0, 2.6, 6.5], look: [0, 2.4, 0] }; } };
});

// thumb
addSet("thumb", (g) => {
  const st = sparkPts(400, [-8, 8, -4, 10, -10, -2], 0x5cff8a, 0.04); g.add(st);
  const kid = person({ top: 0x2b2d42, hood: false }); kid.position.set(0, 0.2, 0); g.add(kid);
  const w = attachWatch(kid, 1.1);
  const au = aura(0x5cff8a, 2.6, 3.6); au.material.opacity = 0.5; kid.add(au);
  const sil = [0xff3a3a, 0x3ab0ff, 0xff8a1a, 0x9fefff, 0xb08aff].map((c, i) => { const s = mesh(cap(0.25, 0.6), glowM(c, 0.6), -2 + i, 1.4, -1.6, g); mesh(sph(0.2, 12, 10), glowM(c, 0.6), -2 + i, 2.15, -1.6, g); return s; });
  return {
    bg: 0x041008,
    update() { const u = kid.userData; u.arms[0].rotation.set(-1.9, 0, 0.4); face(kid, "o"); brows(kid, -0.25); u.head.rotation.x = 0.1; w.userData.halo.material.opacity = 0.9; },
    cam() { return { pos: [0.3, 1.9, 3.4], look: [0, 1.75, 0] }; },
  };
});


// ---------------------------------------------------------------- render por tempo
function sceneAt(t) {
  for (const [n, a, b] of T.scenes) if (t >= a && t < b) return n;
  return T.scenes[T.scenes.length - 1][0];
}
function renderAt(t) {
  const n = sceneAt(t);
  for (const k in SETS) SETS[k].group.visible = k === n;
  const s = SETS[n];
  s.update(t);
  const c = s.cam(t);
  camera.position.set(...c.pos); camera.lookAt(...c.look);
  // leve tremida de câmera "na mão"
  camera.position.x += Math.sin(t * 1.3) * 0.015; camera.position.y += Math.sin(t * 1.7) * 0.012;
  scene.background = new THREE.Color(s.bg);
  renderer.render(scene, camera);
}
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady["relogio3d"] = (async () => {
  try { await Promise.all(["Archivo Black", "Permanent Marker"].map((f) => document.fonts.load(`48px '${f}'`))); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
