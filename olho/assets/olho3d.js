// Cena 3D do episódio "E se você tivesse um olho que copia tudo" (Three.js).
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

// ---------------------------------------------------------------- cenários
const SETS = {};
function addSet(name, build) { const g = new THREE.Group(); g.visible = false; scene.add(g); const s = build(g); s.group = g; SETS[name] = s; }

// 1 · banheiro de manhã (de frente pro espelho)
addSet("s1-acorda", (g) => {
  const wl = wall(10, 6, rep(tiles("#bde0fe", "#a2d2ff", 8), 3, 2)); wl.position.set(0, 3, -1.6); g.add(wl);
  const fl = floor(10, 6, rep(tiles("#ffe8d6", "#ffd7ba", 6), 3, 2)); fl.position.z = 1; g.add(fl);
  // moldura do espelho atrás (reflexo "lavado")
  ol(mesh(box(2.6, 2.4, 0.08), M(0x8c9ba5), 0, 2.4, -1.55, g), 0.02);
  mesh(new THREE.PlaneGeometry(2.4, 2.2), new THREE.MeshBasicMaterial({ color: 0xdff3ff }), 0, 2.4, -1.5, g);
  // pia
  ol(mesh(box(2.2, 0.15, 0.8), M(0xf1f3f5), 0, 0.95, -0.9, g), 0.02);
  ol(mesh(box(1.8, 0.9, 0.7), M(0x9b5de5), 0, 0.45, -0.95, g), 0.02);
  ol(mesh(cyl(0.05, 0.05, 0.4), M(0xc0c7cc), 0, 1.2, -1.2, g), 0.01);
  ol(mesh(cyl(0.1, 0.08, 0.25), M(0xffd166), -0.7, 1.15, -0.95, g), 0.01);
  mesh(box(0.03, 0.35, 0.03), M(0x22c3e6), -0.72, 1.35, -0.95, g).rotation.z = 0.2;
  mesh(box(0.03, 0.35, 0.03), M(0xff6fa8), -0.66, 1.35, -0.95, g).rotation.z = -0.15;
  ol(mesh(cyl(0.09, 0.09, 0.3), M(0x4cd964), 0.7, 1.17, -0.95, g), 0.01);
  // toalha e janela
  const tw = mesh(box(0.6, 1.0, 0.05), M(0xff6fa8), 2.2, 2.3, -1.5, g); ol(tw, 0.02);
  const win = windowFrame(1.2, 1.2, skyTex("#ffd6a5", "#fff6c2", (c) => { c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(170, 160, 40, 0, 7); c.fill(); })); win.position.set(-2.4, 2.8, -1.5); g.add(win);
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4), new THREE.MeshBasicMaterial({ color: 0xfff6c2, transparent: true, opacity: 0.18, depthWrite: false })); sun.position.set(-1.6, 2, -0.6); sun.rotation.z = 0.5; g.add(sun);
  const kid = person({ skin: SK[1], top: 0x7b5cff }); kid.position.set(0, 0, 0.6); g.add(kid);
  return {
    bg: 0xbde0fe,
    update(t) {
      const on = t >= K.olho ? 1 : 0;
      idle(kid, t);
      setSpecial(kid, on * seg(t, K.olho, K.olho + 0.3), t);
      face(kid, t > K.olho && t < K.olho + 1.4 ? "o" : "smile");
      brows(kid, t > K.olho ? -0.25 : 0);
      sun.material.opacity = 0.14 + 0.06 * Math.sin(t * 1.5);
    },
    cam(t) {
      return keys(t, [[T.sc["s1-acorda"][0], [0.9, 2.1, 6.6], [0, 1.7, 0]], [K.olho - 0.3, [0, 2.0, 4.0], [0, 1.9, 0.6]],
        [K.olho + 0.2, [-0.16, 1.95, 1.75], [-0.17, 1.92, 0.9]], [K.copia + 0.6, [-0.16, 1.95, 1.75], [-0.17, 1.92, 0.9]], [K.camera0, [0.8, 2.1, 3.6], [0, 1.8, 0.4]]]);
    },
  };
});

// 2 · cozinha (câmera lenta)
addSet("s2-torrada", (g) => {
  const wl = wall(12, 6, rep(tiles("#e9f5f9", "#cde8f0", 8), 4, 2)); wl.position.set(0, 3, -2.5); g.add(wl);
  g.add(floor(12, 8, rep(tiles("#c9a27a", "#b98f66", 6), 4, 3)));
  for (let i = -2; i <= 2; i++) ol(mesh(box(1.1, 0.9, 0.5), M(0xe76f51), i * 1.2, 4.3, -2.2, g), 0.02);
  ol(mesh(box(5.5, 0.9, 0.7), M(0xe76f51), 0, 0.45, -2.1, g), 0.02); ol(mesh(box(5.6, 0.08, 0.8), M(0xf1f3f5), 0, 0.94, -2.1, g), 0.01);
  ol(mesh(box(1.1, 2.4, 0.8), M(0xf1f3f5), 3.3, 1.2, -2.0, g), 0.02); mesh(box(0.05, 0.6, 0.05), M(0xc0c7cc), 2.85, 1.6, -1.55, g);
  ol(mesh(box(0.5, 0.35, 0.3), M(0xc0c7cc), -1.6, 1.15, -2.0, g), 0.015);
  const win = windowFrame(1.6, 1.2, skyTex("#9bd1e5", "#e0f4ff", (c) => { c.fillStyle = "#fff"; c.beginPath(); c.arc(80, 80, 30, 0, 7); c.arc(110, 70, 34, 0, 7); c.fill(); })); win.position.set(0, 2.5, -2.45); g.add(win);
  const tb = table(1.8, 1.0); tb.position.set(0, 0, 0); g.add(tb);
  const plate = ol(mesh(cyl(0.22, 0.18, 0.04), M(0xffffff), 0.45, 1.0, 0.1, g), 0.01);
  ol(mesh(cyl(0.09, 0.08, 0.2), M(0xffffff), -0.5, 1.09, 0.1, g), 0.01);
  const toast = new THREE.Group(); g.add(toast);
  ol(mesh(box(0.32, 0.05, 0.3), M(0xd99a4e), 0, 0, 0, toast), 0.01);
  mesh(box(0.26, 0.02, 0.24), M(0xffe066), 0, 0.035, 0, toast);
  const kid = person({}); kid.position.set(-0.2, 0, 1.1); kid.rotation.y = 0.15; g.add(kid);
  return {
    bg: 0xcde8f0,
    update(t) {
      idle(kid, t, 0.5); setSpecial(kid, 1, t);
      // a torrada sai da mesa, cai devagar girando e pousa no prato com a manteiga pra cima
      const a = K.cai - 0.2, b = K.cima;
      const x = seg(t, a, b);
      const fall = Math.sin(x * Math.PI);
      toast.position.set(lerp(0.8, 0.45, x), 1.06 + fall * 0.55 - (x < 1 ? 0 : 0), lerp(0.2, 0.1, x));
      toast.rotation.set(0, x * 0.5, (1 - x) * Math.PI * 2 * 1.0 + 0);
      if (t < a) { toast.position.set(0.8, 1.06, 0.2); toast.rotation.set(0, 0, 0); }
      kid.userData.arms[1].rotation.x = -seg(t, a, a + 0.6) * 1.2 + seg(t, b, b + 0.4) * 1.2;
      kid.userData.arms[1].rotation.z = 0.12 + seg(t, a, a + 0.6) * 0.5;
      face(kid, t > b ? "smile" : "o");
    },
    cam(t) { const s = T.sc["s2-torrada"]; return keys(t, [[s[0], [2.4, 2.3, 5.0], [0.1, 1.2, 0.4]], [K.cai, [2.0, 1.8, 3.6], [0.5, 1.15, 0.2]], [K.cima, [1.5, 1.6, 2.4], [0.45, 1.05, 0.1]], [s[1], [1.6, 1.8, 3.2], [0.3, 1.1, 0.3]]]); },
  };
});

// 3 · quarto com LED (a dança)
addSet("s3-danca", (g) => {
  const wl = wall(12, 6, null, 0x2a1e5c); wl.position.set(0, 3, -2.5); g.add(wl);
  g.add(floor(12, 8, rep(tiles("#3b2f5c", "#33284f", 6), 4, 3)));
  const led = mesh(box(12, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0xff3d7f }), 0, 4.6, -2.4, g);
  const poster = (txt, col, x) => { const p = mesh(new THREE.PlaneGeometry(1.1, 1.5), M(0xffffff, { map: textTex(txt, { w: 256, h: 350, bg: col, size: 44 }) }), x, 2.8, -2.45, g); return p; };
  poster(["🎧", "BEAT"], "#22c3e6", -2.6); poster(["🕺", "DANCE"], "#ffd23f", 2.6);
  ol(mesh(box(2.2, 0.5, 1.2), M(0x3a86ff), -3.2, 0.25, -1.4, g), 0.02); ol(mesh(box(2.2, 0.3, 1.2), M(0xffffff), -3.2, 0.62, -1.4, g), 0.02);
  // celular no tripé tocando o vídeo
  const tri = new THREE.Group(); tri.position.set(1.6, 0, 0.6); g.add(tri);
  [[0.2, 0], [-0.1, 0.17], [-0.1, -0.17]].forEach(([x, z]) => { const l = mesh(cyl(0.02, 0.02, 1.3), M(0x222222), x * 0.6, 0.62, z * 0.6, tri); l.rotation.z = -x; l.rotation.x = z; });
  const scr = mesh(box(0.42, 0.75, 0.04), M(0x111111), 0, 1.5, 0, tri); ol(scr, 0.01);
  const screen = mesh(new THREE.PlaneGeometry(0.36, 0.66), new THREE.MeshBasicMaterial({ map: textTex(["🕺", "▶ 0:15"], { w: 200, h: 360, bg: "#ff3d7f", fg: "#fff", size: 50 }) }), 0, 1.5, 0.025, tri);
  tri.rotation.y = -2.4;
  const kid = person({}); kid.position.set(0, 0, 0); g.add(kid);
  ol(mesh(cyl(1.1, 1.1, 0.02, 32), M(0xff6fa8), 0, 0.01, 0, g), 0.02);
  return {
    bg: 0x2a1e5c,
    update(t) {
      const u = kid.userData; setSpecial(kid, 1, t);
      const hue = (t * 0.25) % 1; led.material.color.setHSL(hue, 0.9, 0.6);
      const dance = t > K.copiou2 - 0.3 && t < K.dor - 0.1;
      if (dance) {
        const b = t * 7;
        u.body.position.y = Math.abs(Math.sin(b)) * 0.15; u.body.rotation.y = Math.sin(b * 0.5) * 0.6;
        u.arms[0].rotation.z = 0.5 + Math.sin(b) * 1.2; u.arms[1].rotation.z = -0.5 - Math.cos(b) * 1.2;
        u.legs[0].rotation.x = Math.sin(b) * 0.4; u.legs[1].rotation.x = -Math.sin(b) * 0.4;
        u.head.rotation.z = Math.sin(b) * 0.2; face(kid, "smile"); blink(kid, t);
      } else if (t >= K.dor - 0.1) {
        const x = seg(t, K.dor - 0.1, K.dor + 0.4);
        u.body.rotation.set(0.45 * x, 0, 0); u.body.position.y = 0;
        u.arms[1].rotation.set(-0.3 * x, 0, -2.2 * x); u.arms[0].rotation.z = 0.2;
        u.legs.forEach((l) => (l.rotation.x = 0)); face(kid, "o"); brows(kid, 0.35 * x); blink(kid, t);
      } else { idle(kid, t); u.head.rotation.y = -0.7; }
    },
    cam(t) { const s = T.sc["s3-danca"]; return keys(t, [[s[0], [2.4, 1.6, 3.4], [0.6, 1.3, 0]], [K.copiou2, [0.6, 1.8, 4.6], [0, 1.2, 0]], [K.dor, [0.4, 1.5, 3.0], [0, 1.2, 0]], [s[1], [-0.6, 1.4, 2.6], [0, 1.1, 0]]]); },
  };
});

// 4 · sala de aula (o bigode)
addSet("s4-aula", (g) => {
  const wl = wall(14, 6, null, 0xf2cc8f); wl.position.set(0, 3, -3); g.add(wl);
  g.add(floor(14, 10, rep(tiles("#a3785a", "#966b4e", 6), 5, 4)));
  const board = mesh(new THREE.PlaneGeometry(4.2, 1.8), new THREE.MeshBasicMaterial({ map: textTex(["x² + 3x − 4 = ?", "Δ = b² − 4ac"], { w: 840, h: 360, bg: "#2f5d3a", fg: "#ffffff", size: 64, font: "Permanent Marker" }) }), 0, 2.6, -2.95, g);
  ol(mesh(box(4.4, 2.0, 0.05), M(0x7a5233), 0, 2.6, -2.99, g), 0.01);
  const clk = mesh(cyl(0.3, 0.3, 0.05, 24), M(0xffffff), 2.8, 4.1, -2.95, g); clk.rotation.x = Math.PI / 2; ol(clk, 0.02);
  const hand = mesh(box(0.03, 0.22, 0.02), M(0xe63946), 2.8, 4.1, -2.9, g);
  mesh(new THREE.PlaneGeometry(1.4, 1.0), M(0xffffff, { map: textTex(["🗺️ MAPA"], { w: 280, h: 200, bg: "#9bd1e5", size: 40 }) }), -3.6, 2.7, -2.95, g);
  for (let r = 0; r < 2; r++) for (let c = -1; c <= 1; c++) { const d = table(1.0, 0.6, 0.75, 0xe9c46a); d.position.set(c * 1.8, 0, 0.6 + r * 1.5); g.add(d); const ch = chair(); ch.position.set(c * 1.8, 0, 1.05 + r * 1.5); ch.rotation.y = Math.PI; g.add(ch); }
  const prof = person({ skin: SK[0], style: "bald", hair: 0x8d8d8d, top: 0x6d597a, glasses: true, mustache: 0x5a4535, hood: false, tie: true }); prof.position.set(-1.4, 0, -2.2); g.add(prof);
  const kid = person({}); kid.position.set(0, 0, 1.0); kid.rotation.y = Math.PI * 0.95; g.add(kid);
  kid.userData.legs.forEach((l) => (l.rotation.x = -1.4)); kid.position.y = -0.2;
  return {
    bg: 0xf2cc8f,
    update(t) {
      idle(prof, t, 0.6, 2); idle(kid, t, 0.3); setSpecial(kid, 1, t);
      kid.userData.legs.forEach((l) => (l.rotation.x = -1.4));
      hand.rotation.z = -Math.floor(t) * 0.1;
      const pu = prof.userData;
      // professor escreve, depois coça o bigode
      if (t < K.copiou3) { pu.arms[1].rotation.set(-2.4, 0, 0.3 + Math.sin(t * 8) * 0.15); prof.rotation.y = 0.5; }
      else { prof.rotation.y = 0.1; pu.arms[1].rotation.set(-2.2, 0, -0.9 + Math.sin(t * 14) * 0.12); }
      const ku = kid.userData;
      if (t > K.jeito) ku.arms[1].rotation.set(-2.2, 0, -0.9 + Math.sin(t * 14) * 0.12); else ku.arms[1].rotation.set(0, 0, 0.12);
      face(prof, "smile"); face(kid, t > K.bigode ? "o" : "smile");
    },
    cam(t) { const s = T.sc["s4-aula"]; return keys(t, [[s[0], [3.4, 2.4, 4.6], [-0.8, 1.8, -1.2]], [K.copiou3, [2.0, 2.0, 3.2], [-0.6, 1.8, -0.6]], [K.jeito, [0.6, 1.4, -0.6], [0.0, 1.2, 1.0]], [s[1], [0.4, 1.35, -0.3], [0, 1.2, 1.0]]]); },
  };
});

// 5 · campinho (a falta)
addSet("s5-falta", (g) => {
  const grass = rep(canvasTex(256, 256, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#5cb85c" : "#4cae4c"; c.fillRect(0, i * 32, 256, 32); } }), 6, 6);
  g.add(floor(40, 40, grass));
  const sky = mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ map: skyTex("#6ec6ff", "#d6f0ff") }), 0, 12, -18, g);
  // gol
  const goal = new THREE.Group(); goal.position.set(-3, 0, -6); g.add(goal);
  [[-1.8, 1], [1.8, 1]].forEach(([x]) => ol(mesh(cyl(0.06, 0.06, 2), M(0xffffff), x, 1, 0, goal), 0.01));
  ol(mesh(box(3.7, 0.12, 0.12), M(0xffffff), 0, 2, 0, goal), 0.01);
  mesh(new THREE.PlaneGeometry(3.6, 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, side: THREE.DoubleSide }), 0, 1, -0.6, goal);
  // árvores
  for (let i = 0; i < 6; i++) { const tr = new THREE.Group(); tr.position.set(-9 + i * 3.5, 0, -11 - (i % 2) * 2); g.add(tr); mesh(cyl(0.15, 0.2, 1.5), M(0x6f5238), 0, 0.75, 0, tr); ol(mesh(sph(1.0, 14, 10), M(i % 2 ? 0x2a9d4b : 0x38a85a), 0, 2.1, 0, tr), 0.03); }
  // casa do vizinho com janela
  const house = new THREE.Group(); house.position.set(5, 0, -9); g.add(house);
  ol(mesh(box(4, 3, 3), M(0xf4a261), 0, 1.5, 0, house), 0.03);
  const roof = mesh(new THREE.ConeGeometry(3.2, 1.6, 4), M(0xc44536), 0, 3.8, 0, house); roof.rotation.y = Math.PI / 4; ol(roof, 0.03);
  mesh(box(0.8, 1.5, 0.05), M(0x6f4a2a), -1.0, 0.75, 1.52, house);
  const glass = mesh(box(1.1, 0.9, 0.05), new THREE.MeshBasicMaterial({ color: 0x9bd1e5 }), 0.9, 1.9, 1.52, house);
  ol(mesh(box(1.25, 1.05, 0.04), M(0xffffff), 0.9, 1.9, 1.5, house), 0.01);
  const shards = []; for (let i = 0; i < 14; i++) { const s = mesh(box(0.15, 0.15, 0.02), new THREE.MeshBasicMaterial({ color: 0xbfe6f5 }), 0, 0, 0, g); s.visible = false; shards.push(s); }
  const ball = new THREE.Group(); g.add(ball); ol(mesh(sph(0.16, 20, 14), M(0xffffff), 0, 0, 0, ball), 0.015);
  [0, 1, 2].forEach((i) => { const p = mesh(sph(0.06, 8, 6), M(INK), Math.cos(i * 2.1) * 0.13, Math.sin(i * 2.1) * 0.13, 0.05, ball); });
  const kid = person({ top: 0xe63946, hood: false }); kid.position.set(0, 0, 2); kid.rotation.y = Math.PI - 0.4; g.add(kid);
  const win = new THREE.Vector3(5.9, 1.9, -7.4);
  return {
    bg: 0x6ec6ff,
    update(t) {
      setSpecial(kid, 1, t); idle(kid, t, 0.4);
      const u = kid.userData, kick = K.chute + 0.25;
      const k = seg(t, kick - 0.5, kick); const k2 = seg(t, kick, kick + 0.3);
      u.legs[1].rotation.x = k < 1 ? 0.9 * sm(k) : 0.9 - 2.2 * sm(k2);
      // a bola faz a curva até a janela
      const x = sm(seg(t, kick, K.janela + 0.1));
      const p0 = new THREE.Vector3(0.25, 0.16, 1.6), c = new THREE.Vector3(-4, 4.5, -4), p1 = win;
      const pos = p0.clone().multiplyScalar((1 - x) * (1 - x)).add(c.clone().multiplyScalar(2 * x * (1 - x))).add(p1.clone().multiplyScalar(x * x));
      ball.position.copy(t < kick ? p0 : pos); ball.rotation.set(t * 9, t * 6, 0);
      const broke = t > K.janela + 0.1;
      glass.visible = !broke; ball.visible = !broke || t < K.janela + 0.15;
      shards.forEach((s, i) => {
        s.visible = broke; if (!broke) return;
        const dt = t - (K.janela + 0.1);
        s.position.set(win.x + (hash(i) - 0.5) * 1.2 + (hash(i + 9) - 0.5) * dt * 2, win.y + (hash(i + 3) - 0.5) * 0.8 + dt * 1.5 - dt * dt * 4.9, win.z + 0.1 + dt * 1.5 * hash(i + 5));
        s.rotation.set(dt * 8 * hash(i), dt * 6, 0);
      });
      face(kid, broke ? "o" : "smile");
    },
    cam(t) {
      const s = T.sc["s5-falta"], kick = K.chute + 0.25;
      if (t < kick) return keys(t, [[s[0], [2.2, 1.8, 5.4], [0, 1, 1.4]], [kick, [1.4, 1.3, 4.4], [0, 0.7, 1.4]]]);
      if (t < K.janela + 0.1) { const b = ball.position, x = sm(seg(t, kick, K.janela + 0.1)); return { pos: lerp3([1.4, 1.3, 4.4], [1.0, 2.6, 1.0], x), look: [b.x, b.y, b.z] }; }
      return keys(t, [[K.janela + 0.1, [1.0, 2.6, 1.0], [5.6, 2.0, -7.4]], [s[1], [2.0, 2.3, -1.2], [5.6, 1.9, -7.4]]]);
    },
  };
});

// 6 · pátio da escola (a cantada)
addSet("s6-crush", (g) => {
  g.add(floor(30, 30, rep(tiles("#d9d2c3", "#cfc6b4", 6), 8, 8)));
  const wl = wall(30, 6, null, 0xfcefc7); wl.position.set(0, 3, -5); g.add(wl);
  for (let i = -3; i <= 3; i++) { const wf = windowFrame(1.6, 1.2, skyTex("#9bd1e5", "#e0f4ff")); wf.position.set(i * 3, 3.2, -4.95); g.add(wf); }
  for (let i = -6; i <= 6; i++) ol(mesh(box(0.9, 2.2, 0.5), M(i % 2 ? 0x3a86ff : 0xe63946), i * 0.95, 1.1, -4.7, g), 0.015);
  const tree = new THREE.Group(); tree.position.set(3.5, 0, -2); g.add(tree); mesh(cyl(0.2, 0.25, 2), M(0x6f5238), 0, 1, 0, tree); ol(mesh(sph(1.3, 16, 12), M(0x2a9d4b), 0, 2.8, 0, tree), 0.03);
  const bench = new THREE.Group(); bench.position.set(-2.5, 0, -1.5); g.add(bench); ol(mesh(box(2, 0.1, 0.5), M(0x9c6b3f), 0, 0.5, 0, bench), 0.02); ol(mesh(box(2, 0.5, 0.08), M(0x9c6b3f), 0, 0.85, -0.22, bench), 0.02);
  const crush = person({ skin: SK[3], style: "long", hair: 0x1a1210, top: 0x9b5de5, hood: false, cheeks: true }); crush.position.set(0.7, 0, 0); crush.rotation.y = -0.5; g.add(crush);
  const gala = person({ skin: SK[2], style: "slick", hair: 0x1e1a24, top: 0x2b2d42, hood: false, shades: true }); gala.position.set(-2.5, 0, -1.2); gala.rotation.y = 0.4; g.add(gala);
  const kid = person({}); kid.position.set(-0.6, 0, 0.3); kid.rotation.y = 0.7; g.add(kid);
  return {
    bg: 0xfcefc7,
    update(t) {
      setSpecial(kid, 1, t); idle(kid, t); idle(gala, t, 0.5, 3); idle(crush, t, 0.6, 5);
      // galã de braços cruzados, desanimado
      gala.userData.arms[0].rotation.set(-1.2, 0, -0.9); gala.userData.arms[1].rotation.set(-1.2, 0, 0.9);
      const ku = kid.userData;
      if (t > K.cantada && t < K.fora) { ku.arms[1].rotation.set(-1.0 + Math.sin(t * 6) * 0.3, 0, 0.6); ku.arms[0].rotation.set(0, 0, 0.12); face(kid, Math.sin(t * 10) > 0 ? "o" : "smile"); }
      // ela vira as costas e vai embora
      const turn = sm(seg(t, K.fora - 0.1, K.fora + 0.4));
      crush.rotation.y = -0.5 + turn * Math.PI;
      crush.position.x = 0.7 + seg(t, K.fora + 0.3, K.fora + 2.5) * 3;
      face(crush, t > K.fora ? "o" : "smile"); brows(crush, t > K.fora ? 0.3 : 0);
      if (t > K.fora) { face(kid, "o"); ku.arms[1].rotation.set(0, 0, 0.12); }
    },
    cam(t) { const s = T.sc["s6-crush"]; return keys(t, [[s[0], [0.2, 1.9, 5.6], [-0.2, 1.4, 0]], [K.palavra, [-1.2, 1.9, 4.4], [0.2, 1.5, 0]], [K.fora, [0.4, 1.8, 4.6], [0.4, 1.3, 0]], [s[1], [1.2, 1.9, 5.6], [1.2, 1.2, 0]]]); },
  };
});

// 7 · cozinha à noite (o olhar de mãe)
addSet("s7-mae", (g) => {
  const wl = wall(12, 6, rep(tiles("#2e3a59", "#263150", 8), 4, 2)); wl.position.set(0, 3, -2.5); g.add(wl);
  g.add(floor(12, 8, rep(tiles("#3d3352", "#352c48", 6), 4, 3)));
  ol(mesh(box(5, 0.9, 0.7), M(0x5a4a7a), 0, 0.45, -2.1, g), 0.02); ol(mesh(box(5.1, 0.08, 0.8), M(0xc0c7cc), 0, 0.94, -2.1, g), 0.01);
  // pilha de louça
  for (let i = 0; i < 9; i++) ol(mesh(cyl(0.28, 0.24, 0.05), M(i % 3 ? 0xffffff : 0xa2d2ff), -0.6 + (i % 2) * 0.05, 1.0 + i * 0.07, -2.0, g), 0.008);
  for (let i = 0; i < 4; i++) ol(mesh(cyl(0.12, 0.1, 0.22), M(0xffd166), 0.4 + i * 0.28, 1.08, -2.0, g), 0.008);
  const win = windowFrame(1.4, 1.1, skyTex("#0c1033", "#1b2240", (c) => { c.fillStyle = "#fff4c2"; c.beginPath(); c.arc(190, 70, 26, 0, 7); c.fill(); })); win.position.set(1.8, 2.6, -2.45); g.add(win);
  const lamp = new THREE.PointLight(0xffc56b, 6, 8); lamp.position.set(0, 3.5, 0); g.add(lamp);
  ol(mesh(cyl(0.05, 0.35, 0.3), M(0xffd166), 0, 4.0, 0, g), 0.01);
  const mom = person({ skin: SK[2], style: "bun", hair: 0x3a2618, top: 0xe76f51, hood: false, apron: true }); mom.position.set(1.0, 0, -0.3); mom.rotation.y = -0.6; g.add(mom);
  const kid = person({}); kid.position.set(-0.9, 0, 0.5); kid.rotation.y = 0.6; g.add(kid);
  const mEyes = mom.userData.eyes;
  const redGlow = mEyes.map((e) => { e.glow.material.opacity = 0; return e; });
  return {
    bg: 0x263150,
    update(t) {
      idle(mom, t, 0.3, 4); idle(kid, t, 0.5);
      const mu = mom.userData; mu.arms[0].rotation.set(-1.2, 0, -0.9); mu.arms[1].rotation.set(-1.2, 0, 0.9);
      const glare = t > K.olhar - 0.1;
      redGlow.forEach((e) => { e.irisMat.map = glare ? IRIS_S : IRIS_N; e.glow.material.opacity = glare ? 0.9 : 0; e.iris.rotation.z = glare ? t * 3 : 0; e.g.scale.y = 1; });
      brows(mom, glare ? -0.45 : -0.2); face(mom, "smile");
      // o olho do filho tenta e apaga de medo
      const tryOn = t > K.louca - 0.3 && t < K.olhar;
      setSpecial(kid, glare ? Math.max(0, 1 - seg(t, K.olhar, K.olhar + 0.6)) : (tryOn ? 1 : 0.6), t);
      if (glare) { kid.position.x = -0.9 + Math.sin(t * 50) * 0.015 * (1 - seg(t, K.nivel + 0.5, K.nivel + 1)); face(kid, "o"); brows(kid, 0.35); }
      lamp.intensity = glare ? 3 : 6;
    },
    cam(t) { const s = T.sc["s7-mae"]; return keys(t, [[s[0], [-0.4, 2.0, 5.2], [0, 1.3, -0.2]], [K.olhar - 0.2, [0.2, 1.9, 3.4], [0.6, 1.6, -0.4]], [K.olhar + 0.4, [0.65, 1.95, 1.0], [1.0, 1.9, -0.3]], [s[1], [0.6, 1.95, 1.2], [1.0, 1.9, -0.3]]]); },
  };
});

// 8 · cozinha do avô (a receita)
addSet("s8-avo", (g) => {
  const wl = wall(12, 6, rep(canvasTex(256, 256, (c) => { c.fillStyle = "#f6d8a8"; c.fillRect(0, 0, 256, 256); c.fillStyle = "#e9c38a"; for (let i = 0; i < 8; i++) c.fillRect(i * 32, 0, 12, 256); }), 6, 3)); wl.position.set(0, 3, -2.5); g.add(wl);
  g.add(floor(12, 8, rep(tiles("#b07d4f", "#a06f43", 6), 4, 3)));
  ol(mesh(box(1.2, 2.2, 0.8), M(0xa8dadc), -3.0, 1.1, -2.0, g), 0.02);
  for (let i = 0; i < 4; i++) mesh(new THREE.PlaneGeometry(0.28, 0.22), M(0xffffff, { map: textTex([["👴", "👶", "🎂", "🐶"][i]], { w: 128, h: 100, bg: ["#ffd6a5", "#bde0fe", "#ffafcc", "#caffbf"][i], size: 56 }) }), -3.25 + (i % 2) * 0.4, 1.6 - Math.floor(i / 2) * 0.35, -1.59, g);
  ol(mesh(box(3, 0.9, 0.7), M(0x7a5233), 1.4, 0.45, -2.1, g), 0.02);
  for (let i = 0; i < 3; i++) { const p = ol(mesh(cyl(0.18, 0.15, 0.25), M(0xc0c7cc), 0.6 + i * 0.6, 1.05, -2.1, g), 0.01); }
  const tb = table(2.0, 1.1, 0.95, 0x8a5a3b); tb.position.set(0, 0, 0); g.add(tb);
  mesh(box(2.1, 0.01, 1.2), M(0xfff1e6), 0, 1.0, 0, g);
  const bowl = ol(mesh(new THREE.SphereGeometry(0.3, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0xe76f51, { side: THREE.DoubleSide }), 0.1, 1.3, 0, g), 0.01);
  mesh(cyl(0.27, 0.27, 0.02), M(0xffe5b4), 0.1, 1.22, 0, g);
  const spoon = mesh(cyl(0.02, 0.02, 0.5), M(0x9c6b3f), 0.1, 1.4, 0, g);
  [[-0.5, 0.2], [-0.6, 0.0], [-0.42, -0.1]].forEach(([x, z]) => { const e = ol(mesh(sph(0.07), M(0xfff8e7), x, 1.07, z, g), 0.005); e.scale.y = 1.25; });
  ol(mesh(box(0.3, 0.4, 0.2), M(0xffffff, { map: textTex(["FARINHA"], { w: 200, h: 260, size: 34 }) }), 0.7, 1.2, -0.2, g), 0.01);
  const warm = new THREE.PointLight(0xffb36b, 8, 9); warm.position.set(0, 3.2, 1); g.add(warm);
  const avo = person({ skin: SK[0], style: "bald", hair: 0xd9d9d9, top: 0x6c757d, glasses: true, mustache: 0xd9d9d9, hood: false, apron: true }); avo.position.set(0.9, 0, -0.9); avo.rotation.y = -0.3; g.add(avo);
  const kid = person({}); kid.position.set(-0.9, 0, -0.6); kid.rotation.y = 0.5; g.add(kid);
  return {
    bg: 0xf6d8a8,
    update(t) {
      idle(avo, t, 0.4, 7); idle(kid, t, 0.4);
      const au = avo.userData; au.arms[0].rotation.set(-0.9, 0, -0.5 + Math.sin(t * 5) * 0.15);
      spoon.position.set(0.1 + Math.cos(t * 5) * 0.12, 1.4, Math.sin(t * 5) * 0.12); spoon.rotation.set(Math.sin(t * 5) * 0.3, 0, Math.cos(t * 5) * 0.3);
      face(avo, "smile");
      // o olho começa a copiar… e ele fecha o olho
      const closeT = K.devagar - 0.4;
      const on = t < K.copiar8 ? 0 : (t < closeT ? 1 : 0);
      setSpecial(kid, on, t);
      if (t > closeT) { kid.userData.eyes[0].g.scale.y = 0.12; }
      face(kid, "smile"); kid.userData.head.rotation.y = 0.3;
    },
    cam(t) { const s = T.sc["s8-avo"]; return keys(t, [[s[0], [0.3, 2.5, 5.2], [0, 1.4, -0.5]], [K.copiar8, [-1.0, 2.2, 3.4], [-0.4, 1.7, -0.6]], [K.devagar, [-0.2, 2.05, 0.7], [-0.9, 1.9, -0.6]], [K.devagar + 1.5, [-0.4, 2.2, 3.6], [0, 1.5, -0.6]], [s[1], [0.6, 2.3, 4.6], [0.1, 1.4, -0.6]]]); },
  };
});

// 9 · varanda à meia-noite
addSet("s9-noite", (g) => {
  const sk = mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ map: skyTex("#05071a", "#1d2560") }), 0, 10, -20, g);
  const stars = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 260; i++) sp.push((hash(i) - 0.5) * 50, 4 + hash(i + 50) * 18, -19);
  stars.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  const st = new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 })); g.add(st);
  mesh(sph(1.2), new THREE.MeshBasicMaterial({ color: 0xfff4c2 }), 8, 12, -18, g);
  for (let i = 0; i < 26; i++) {
    const h = 2 + hash(i) * 6, x = -24 + i * 1.9;
    mesh(box(1.6, h, 1.6), M(0x141a3a), x, h / 2 - 2, -14, g);
    for (let j = 0; j < 4; j++) if (hash(i * 7 + j) > 0.4) mesh(box(0.25, 0.3, 0.02), new THREE.MeshBasicMaterial({ color: 0xffd23f }), x - 0.4 + (j % 2) * 0.8, h - 2.6 - Math.floor(j / 2) * 0.8, -13.19, g);
  }
  g.add(floor(10, 6, rep(tiles("#5a3b2b", "#4f3326", 6), 3, 2)));
  for (let i = -6; i <= 6; i++) ol(mesh(box(0.08, 1.0, 0.08), M(0x8a6248), i * 0.45, 0.5, -1.5, g), 0.01);
  ol(mesh(box(6, 0.1, 0.12), M(0x7a5233), 0, 1.0, -1.5, g), 0.01);
  const bulbs = []; for (let i = 0; i < 12; i++) bulbs.push(mesh(sph(0.07), new THREE.MeshBasicMaterial({ color: 0xffd27a }), -2.75 + i * 0.5, 2.6 - Math.sin((i / 11) * Math.PI) * 0.3, -1.4, g));
  const plate = ol(mesh(cyl(0.22, 0.18, 0.04), M(0xffffff), 0.7, 0.62, 0.3, g), 0.01);
  const cake = ol(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.16, 3, 1, false, 0, Math.PI / 2), M(0xc8814a), 0.7, 0.72, 0.3, g), 0.01);
  ol(mesh(box(0.8, 0.6, 0.6), M(0x6f4a2a), 0.7, 0.3, 0.3, g), 0.01);
  const kid = person({}); kid.position.set(-0.3, -0.25, 0.2); g.add(kid);
  kid.userData.legs.forEach((l) => (l.rotation.x = -1.4));
  return {
    bg: 0x05071a,
    update(t) {
      idle(kid, t, 0.3); kid.userData.legs.forEach((l) => (l.rotation.x = -1.4));
      const off = seg(t, K.apaga - 0.1, K.apaga + 0.4);
      setSpecial(kid, 1 - off, t); face(kid, "smile");
      kid.userData.head.rotation.y = t > K.bolo9 ? 0.6 : 0;
      st.material.size = 0.1 + 0.03 * Math.sin(t * 3);
      bulbs.forEach((b, i) => b.material.color.setHex(Math.sin(t * 2 + i) > 0 ? 0xffd27a : 0xc99a4a));
    },
    cam(t) { const s = T.sc["s9-noite"]; return keys(t, [[s[0], [0.8, 1.7, 5.0], [-0.1, 1.2, 0]], [K.apaga, [-0.25, 1.6, 2.1], [-0.3, 1.5, 0.2]], [K.dancar, [1.2, 1.9, 4.6], [0, 1.4, -2]], [s[1], [1.4, 1.6, 3.8], [0.3, 1.0, 0.2]]]); },
  };
});

// 10 · pergunta (olho gigante)
addSet("s10-pergunta", (g) => {
  const pts = new THREE.BufferGeometry(); const pp = [];
  for (let i = 0; i < 400; i++) pp.push((hash(i) - 0.5) * 30, (hash(i + 99) - 0.5) * 40, -6 - hash(i + 7) * 10);
  pts.setAttribute("position", new THREE.Float32BufferAttribute(pp, 3));
  g.add(new THREE.Points(pts, new THREE.PointsMaterial({ color: 0xff8fa3, size: 0.08 })));
  const eye = new THREE.Group(); eye.position.set(0, 2.6, -3); g.add(eye);
  const wh = ol(mesh(sph(2.2, 48, 32), M(0xffffff), 0, 0, 0, eye), 0.06); wh.scale.z = 0.45;
  const iris = mesh(new THREE.CircleGeometry(1.5, 64), new THREE.MeshBasicMaterial({ map: IRIS_S, transparent: true }), 0, 0, 1.0, eye);
  const glow = mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 }), 0, 0, 0.9, eye);
  const rings = [0, 1, 2].map((i) => { const r = mesh(new THREE.TorusGeometry(2.8 + i * 0.6, 0.04, 8, 80), new THREE.MeshBasicMaterial({ color: 0xff3d5a, transparent: true, opacity: 0.5 - i * 0.12 }), 0, 0, 0.5, eye); return r; });
  return {
    bg: 0x1a0610,
    update(t) {
      iris.rotation.z = -t * 1.5; glow.material.opacity = 0.45 + 0.2 * Math.sin(t * 4);
      rings.forEach((r, i) => { r.rotation.x = Math.sin(t * 0.8 + i) * 0.6; r.rotation.y = t * (0.4 + i * 0.2); });
      eye.rotation.y = Math.sin(t * 0.6) * 0.2; eye.rotation.x = Math.sin(t * 0.5) * 0.1;
    },
    cam(t) { const s = T.sc["s10-pergunta"]; return keys(t, [[s[0], [0, 1.0, 9.5], [0, 1.0, -3]], [s[1], [0, 1.0, 11.5], [0, 1.0, -3]]]); },
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
window.__hf.buildReady["olho3d"] = (async () => {
  try { await Promise.all(["Archivo Black", "Permanent Marker"].map((f) => document.fonts.load(`48px '${f}'`))); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
