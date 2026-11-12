// Giorno
// Motor 3D v2 (Three.js r160), montado por tools/motor3d/montar.py. Tudo é função do tempo t (evento hf-seek).
// Novidades do v2: sombras suaves, pós-processamento (bloom + gradação de cor + vinheta + grão),
// céu com nuvens e sol, névoa em camadas, texturas procedurais com relevo (normal map),
// personagens articulados (cotovelo, joelho, dedos, pálpebras, cabelo em mechas) e câmera em curva.
import * as THREE from "./vendor/three.module.min.js";
import { EffectComposer } from "./vendor/EffectComposer.js";
import { RenderPass } from "./vendor/RenderPass.js";
import { UnrealBloomPass } from "./vendor/UnrealBloomPass.js";
import { ShaderPass } from "./vendor/ShaderPass.js";
import { OutputPass } from "./vendor/OutputPass.js";

const T = window.HF_T;
const K = T.k;
const W = 1080, H = 1920;

// ---------------------------------------------------------------- matemática
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const sm = (x) => x * x * (3 - 2 * x);
const smr = (t, a, b) => sm(seg(t, a, b));
const lerp = (a, b, x) => a + (b - a) * x;
const lerp3 = (a, b, x) => [lerp(a[0], b[0], x), lerp(a[1], b[1], x), lerp(a[2], b[2], x)];
const E = {
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  outBack: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  outElastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7 + 17.3) * 43758.5453; return s - Math.floor(s); }
// ruído suave (value noise), determinístico
function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }
function noise2(x, y, P = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const w = (v) => (P ? ((v % P) + P) % P : v);
  const a = hash2(w(ix), w(iy)), b = hash2(w(ix + 1), w(iy)), c = hash2(w(ix), w(iy + 1)), d = hash2(w(ix + 1), w(iy + 1));
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}
// fbm 0..1; com P > 0 fica repetível (textura sem emenda) no quadrado [0,1)
function fbm2(x, y, oct = 4, P = 0) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f, P ? P * f : 0); n += a; a *= 0.5; f *= 2; }
  return s / n;
}
function fbm1(x, oct = 3) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * noise1(x * f + i * 17.7); n += a; a *= 0.5; f *= 2.1; } return s / n; }
// câmera na mão: tremor orgânico (ruído, não seno)
function handCam(t, amp = 0.02, fr = 0.6, seed = 0) { return [fbm1(t * fr + seed) * amp, fbm1(t * fr + 31.3 + seed) * amp, fbm1(t * fr + 71.9 + seed) * amp * 0.5]; }

// ---------------------------------------------------------------- caminhos de câmera
// keys: para em cada chave (suave). path: passa pelas chaves sem parar (Catmull-Rom), suave no começo e no fim.
// Cada chave: [tempo, [pos], [olhar], fov?, roll?]
function keys(t, ks) {
  const out = (k) => ({ pos: k[1], look: k[2], fov: k[3], roll: k[4] });
  if (t <= ks[0][0]) return out(ks[0]);
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (t <= b[0]) {
      const x = E.inOut(seg(t, a[0], b[0]));
      return { pos: lerp3(a[1], b[1], x), look: lerp3(a[2], b[2], x), fov: a[3] != null && b[3] != null ? lerp(a[3], b[3], x) : (a[3] ?? b[3]), roll: lerp(a[4] || 0, b[4] || 0, x) };
    }
  }
  return out(ks[ks.length - 1]);
}
function crPt(p0, p1, p2, p3, u) { const u2 = u * u, u3 = u2 * u; return [0, 1, 2].map((i) => 0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * u + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * u2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * u3)); }
function path(t, ks) {
  const n = ks.length;
  if (n < 3) return keys(t, ks);
  if (t <= ks[0][0]) return { pos: ks[0][1], look: ks[0][2], fov: ks[0][3], roll: ks[0][4] || 0 };
  if (t >= ks[n - 1][0]) return { pos: ks[n - 1][1], look: ks[n - 1][2], fov: ks[n - 1][3], roll: ks[n - 1][4] || 0 };
  let i = 0; while (i < n - 2 && t > ks[i + 1][0]) i++;
  let u = seg(t, ks[i][0], ks[i + 1][0]);
  if (i === 0) u = u * u * (2 - u); // sai do repouso
  if (i === n - 2) u = u + u * u - u * u * u; // chega em repouso
  const P = (j) => ks[clamp(j, 0, n - 1)];
  const pos = crPt(P(i - 1)[1], P(i)[1], P(i + 1)[1], P(i + 2)[1], u), look = crPt(P(i - 1)[2], P(i)[2], P(i + 1)[2], P(i + 2)[2], u);
  const a = ks[i], b = ks[i + 1];
  return { pos, look, fov: a[3] != null && b[3] != null ? lerp(a[3], b[3], sm(u)) : (a[3] ?? b[3]), roll: lerp(a[4] || 0, b[4] || 0, sm(u)) };
}
function shakeCam(c, t, amp) {
  if (amp <= 0) return c;
  return { ...c, pos: [c.pos[0] + noise1(t * 37) * amp, c.pos[1] + noise1(t * 41 + 9) * amp, c.pos[2] + noise1(t * 29 + 3) * amp * 0.5] };
}
// tremor que decai depois de um impacto em t0
const impact = (t, t0, amp = 0.2, dur = 0.7) => (t >= t0 && t < t0 + dur ? amp * Math.pow(1 - (t - t0) / dur, 2) : 0);

// ---------------------------------------------------------------- renderizador e pós-processamento
const canvas = document.getElementById("c3d");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 2000);
scene.add(camera);

const rt0 = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: window.HF_MSAA ?? 4 });
const composer = new EffectComposer(renderer, rt0);
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.6, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.35 }, uGrain: { value: 0.03 }, uCA: { value: 0.004 },
    uSat: { value: 1.05 }, uCon: { value: 1.04 }, uLift: { value: new THREE.Vector3(0.0, 0.0, 0.0) }, uGain: { value: new THREE.Vector3(1, 1, 1) },
    uFlash: { value: 0 }, uFlashCol: { value: new THREE.Vector3(1, 1, 1) }, uFade: { value: 0 }, uFadeCol: { value: new THREE.Vector3(0, 0, 0) },
  },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uVig, uGrain, uCA, uSat, uCon, uFlash, uFade; uniform vec3 uLift, uGain, uFlashCol, uFadeCol; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5; float r2 = dot(c, c);
      vec2 o = c * uCA * r2 * 4.0;
      vec3 col = vec3(texture2D(tDiffuse, vUv + o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - o).b);
      col = col * uGain + uLift * (1.0 - col);
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, uSat);
      col = (col - 0.5) * uCon + 0.5;
      float v = 1.0 - smoothstep(0.18, 0.62, length(c * vec2(1.0, 0.82)));
      col *= mix(1.0 - uVig, 1.0, v);
      col += (h(vUv * vec2(1080.0, 1920.0) + fract(uTime * 7.31) * 97.0) - 0.5) * uGrain;
      col = mix(col, uFlashCol, uFlash);
      col = mix(col, uFadeCol, uFade);
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }`,
};
const grade = new ShaderPass(GradeShader);
composer.addPass(grade);
const GU = grade.uniforms;

// ---------------------------------------------------------------- luzes globais (cada cenário ajusta)
const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x3a3020, 0.7); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.03;
sun.shadow.radius = 3;
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight(0x8fa8ff, 0.0); scene.add(fill, fill.target);
// luz de contorno (rim) dos materiais toon: cor, força e expoente globais
const RIM = { col: { value: new THREE.Color(0xfff2dd) }, str: { value: 0.45 }, pow: { value: 3.2 } };

// ---------------------------------------------------------------- materiais
const ramp = (() => { // sombra / meio-tom / luz, com bordas suaves
  const n = 64, d = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    let v = x < 0.46 ? 0.34 : x < 0.54 ? lerp(0.34, 0.8, sm((x - 0.46) / 0.08)) : x < 0.84 ? 0.8 : x < 0.9 ? lerp(0.8, 1.0, sm((x - 0.84) / 0.06)) : 1.0;
    v = Math.round(v * 255); d.set([v, v, v, 255], i * 4);
  }
  const tx = new THREE.DataTexture(d, n, 1); tx.minFilter = tx.magFilter = THREE.LinearFilter; tx.needsUpdate = true; return tx;
})();
const MATS = {};
const hasTex = (o) => Object.values(o).some((v) => v && v.isTexture);
function rimify(m, k = 1) {
  const rimK = { value: k };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.rimCol = RIM.col; sh.uniforms.rimStr = RIM.str; sh.uniforms.rimPow = RIM.pow; sh.uniforms.rimK = rimK;
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 rimCol; uniform float rimStr; uniform float rimPow; uniform float rimK;")
      .replace("#include <opaque_fragment>", "float rimF = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), rimPow);\noutgoingLight += rimCol * rimF * rimStr * rimK * (0.35 + 0.65 * diffuseColor.rgb);\n#include <opaque_fragment>");
  };
  m.customProgramCacheKey = () => "rim";
  return m;
}
// toon com luz de contorno (personagens)
function TM(color, o = {}) {
  const key = "t" + color + JSON.stringify(o);
  if (!hasTex(o) && MATS[key]) return MATS[key];
  const m = rimify(new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...o }));
  if (!hasTex(o)) MATS[key] = m;
  return m;
}
// PBR (cenário)
function SM(color, o = {}) {
  const key = "s" + color + JSON.stringify(o);
  if (!hasTex(o) && MATS[key]) return MATS[key];
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, ...o });
  if (!hasTex(o)) MATS[key] = m;
  return m;
}
const BM = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
const ADD = THREE.AdditiveBlending, NORM = THREE.NormalBlending;
const glowM = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: ADD });
// contorno de espessura constante (empurra os vértices pela normal)
const OLM = {};
function olMat(w = 0.012, col = 0x160e12) {
  const k = w + "_" + col; if (OLM[k]) return OLM[k];
  const m = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uW: { value: w }, uC: { value: new THREE.Color(col) } }]),
    vertexShader: "uniform float uW;\n#include <fog_pars_vertex>\nvoid main(){ vec4 mvPosition = modelViewMatrix * vec4(position + normalize(normal) * uW, 1.0); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}",
    fragmentShader: "uniform vec3 uC;\n#include <fog_pars_fragment>\nvoid main(){ gl_FragColor = vec4(uC, 1.0);\n#include <fog_fragment>\n}",
    side: THREE.BackSide, fog: true,
  });
  OLM[k] = m; return m;
}
function ol(m, w = 0.012, col) { const o = new THREE.Mesh(m.geometry, olMat(w, col)); o.castShadow = false; o.receiveShadow = false; o.userData.isOutline = true; m.add(o); return m; }

// ---------------------------------------------------------------- geometria
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m; }
function grp(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; }
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const sph = (r, ws = 24, hs = 18) => new THREE.SphereGeometry(r, ws, hs);
const cyl = (rt, rb, h, s = 20) => new THREE.CylinderGeometry(rt, rb, h, s);
const cap = (r, l, cs = 6, rs = 14) => new THREE.CapsuleGeometry(r, l, cs, rs);
const lathe = (pts, s = 28, p0 = 0, pl = Math.PI * 2) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), s, p0, pl);
function noShadow(o) { o.traverse((c) => { if (c.isMesh) { c.castShadow = false; } }); return o; }
function shadows(o, cast = true, recv = true) { o.traverse((c) => { if (c.isMesh && !c.userData.isOutline) { c.castShadow = cast; c.receiveShadow = recv; } }); return o; }
// mecha/fio afinando: curva por pontos, raio r0 -> r1, seção achatada (flat < 1)
function lockGeo(pts, r0, r1 = 0, flat = 0.6, segs = 10, rad = 8) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const fr = curve.computeFrenetFrames(segs, false);
  const pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs, p = curve.getPointAt(u), r = lerp(r0, r1, Math.pow(u, 1.3)) * (i === 0 ? 0.85 : 1);
    const N = fr.normals[i], B = fr.binormals[i];
    for (let j = 0; j < rad; j++) { const a = (j / rad) * Math.PI * 2, cx = Math.cos(a) * r, cy = Math.sin(a) * r * flat; pos.push(p.x + N.x * cx + B.x * cy, p.y + N.y * cx + B.y * cy, p.z + N.z * cx + B.z * cy); }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < rad; j++) { const a = i * rad + j, b = i * rad + ((j + 1) % rad), c = a + rad, d = b + rad; idx.push(a, c, b, b, c, d); }
  const tip = curve.getPointAt(1); pos.push(tip.x, tip.y, tip.z); const ti = pos.length / 3 - 1; for (let j = 0; j < rad; j++) idx.push(segs * rad + j, ti, segs * rad + ((j + 1) % rad));
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// deforma os vértices de uma geometria (f recebe e devolve Vector3)
function deform(geo, f) { const p = geo.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); f(v, i); p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); return geo; }

// ---------------------------------------------------------------- texturas procedurais
const REDRAW = [];
function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = 8;
  if (o.redraw) REDRAW.push(() => { const g = c.getContext("2d"); g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; });
  return t;
}
function rep(tex, x, y) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(x, y); return tex; }
// gera cor e relevo (normal map) a partir de uma função de altura h(u,v) 0..1 e cor col(u,v,h) -> [r,g,b] 0..255
function texPair(size, hf, colf, strength = 3, o = {}) {
  const hs = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) hs[y * size + x] = hf(x / size, y / size);
  const mk = (fn, linear) => {
    const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d"); const im = g.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const i = (y * size + x) * 4, v = fn(x, y); im.data[i] = v[0]; im.data[i + 1] = v[1]; im.data[i + 2] = v[2]; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = linear ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
  };
  const H_ = (x, y) => hs[(((y + size) % size) * size) + ((x + size) % size)];
  const normalMap = mk((x, y) => { const dx = (H_(x + 1, y) - H_(x - 1, y)) * strength, dy = (H_(x, y + 1) - H_(x, y - 1)) * strength; const l = Math.hypot(dx, dy, 1); return [(-dx / l * 0.5 + 0.5) * 255, (dy / l * 0.5 + 0.5) * 255, (1 / l * 0.5 + 0.5) * 255]; }, true);
  const map = colf ? mk((x, y) => colf(x / size, y / size, H_(x, y)), false) : null;
  if (o.rep) { rep(normalMap, o.rep[0], o.rep[1]); if (map) rep(map, o.rep[0], o.rep[1]); }
  return { map, normalMap };
}
const hex2rgb = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const mixc = (a, b, x) => [lerp(a[0], b[0], x), lerp(a[1], b[1], x), lerp(a[2], b[2], x)];
const softTex = canvasTex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,.6)"); gr.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
// fumaça/vapor: bolha suave com detalhes de ruído
const puffTex = (() => {
  const s = 128, c = document.createElement("canvas"); c.width = c.height = s; const g = c.getContext("2d"); const im = g.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const dx = x / s - 0.5, dy = y / s - 0.5, r = Math.hypot(dx, dy) * 2; const n = fbm2(x / 22, y / 22, 4); const a = clamp((1 - r) * 1.6 - 0.25 + (n - 0.5) * 0.9) * clamp(1 - r); const i = (y * s + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = a * 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
// nuvens repetíveis (cinza), para o céu
const cloudTex = (() => {
  const s = 512, c = document.createElement("canvas"); c.width = c.height = s; const g = c.getContext("2d"); const im = g.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const v = fbm2((x / s) * 4, (y / s) * 4, 5, 4); const i = (y * s + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = v * 255; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
})();

// ---------------------------------------------------------------- céu, névoa e atmosfera
// Céu em domo (shader): degradê, sol com halo e nuvens. Cores em hex sRGB.
function skyDome(g, o = {}) {
  const C = (h) => new THREE.Color(h);
  const u = {
    uTop: { value: C(o.top ?? 0x2a5aa8) }, uHor: { value: C(o.hor ?? 0xbcd6f0) }, uGround: { value: C(o.ground ?? 0x4a5a6a) }, uExp: { value: o.exp ?? 0.55 },
    uMid: { value: o.mid != null ? C(o.mid) : C(o.hor ?? 0xbcd6f0).lerp(C(o.top ?? 0x2a5aa8), 0.35) }, uMidY: { value: o.midY ?? 0.14 },
    uSunDir: { value: new THREE.Vector3(...(o.sunDir ?? [0.3, 0.25, -1])).normalize() }, uSunCol: { value: C(o.sunCol ?? 0xfff0d0) }, uSunI: { value: o.sunI ?? 1.0 }, uDisk: { value: o.disk ?? 1.6 },
    uClouds: { value: cloudTex }, uCov: { value: o.cov ?? 0.5 }, uCloudA: { value: o.cloudA ?? 0.9 }, uCloudLit: { value: C(o.cloudLit ?? 0xffffff) }, uCloudSh: { value: C(o.cloudSh ?? 0x8a9ab8) },
    uOff: { value: new THREE.Vector2(0, 0) }, uScale: { value: o.cloudScale ?? 0.18 }, uStars: { value: o.stars ?? 0 },
  };
  const m = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform vec3 uTop, uHor, uMid, uGround, uSunDir, uSunCol, uCloudLit, uCloudSh; uniform float uExp, uSunI, uDisk, uCov, uCloudA, uScale, uStars, uMidY; uniform vec2 uOff; uniform sampler2D uClouds; varying vec3 vDir;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec3 d = normalize(vDir); float y = d.y;
        float yy = clamp(y, 0.0, 1.0);
        vec3 col = y > 0.0 ? (yy < uMidY ? mix(uHor, uMid, smoothstep(0.0, uMidY, yy)) : mix(uMid, uTop, pow((yy - uMidY) / (1.0 - uMidY), uExp))) : mix(uHor, uGround, clamp(-y * 5.0, 0.0, 1.0));
        float sd = max(dot(d, uSunDir), 0.0);
        if (uStars > 0.0 && y > 0.0) { vec2 sp = floor(d.xz / (y + 0.3) * 260.0); float s = step(0.9965, h(sp)) * (0.5 + 0.5 * h(sp + 3.1)); col += vec3(s) * uStars * smoothstep(0.0, 0.25, y); }
        float dr = radians(uDisk);
        col += uSunCol * uSunI * (smoothstep(cos(dr * 1.25), cos(dr), sd) * 22.0 + pow(sd, 40.0) * 1.2 + pow(sd, 6.0) * 0.3);
        if (y > 0.0 && uCloudA > 0.0) {
          vec2 cuv = d.xz / (y + 0.1) * uScale + uOff;
          float n = texture2D(uClouds, cuv).r * 0.65 + texture2D(uClouds, cuv * 2.7 + 0.37).r * 0.35;
          float c = smoothstep(uCov, uCov + 0.22, n) * smoothstep(0.0, 0.18, y);
          float lit = clamp(0.35 + 0.65 * pow(sd, 3.0) + (n - uCov) * 1.2, 0.0, 1.0);
          vec3 cc = mix(uCloudSh, uCloudLit, lit) + uSunCol * pow(sd, 10.0) * 0.6 * uSunI;
          col = mix(col, cc, c * uCloudA);
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), m); dome.renderOrder = -10; dome.frustumCulled = false; g.add(dome);
  dome.userData.u = u;
  return dome;
}
// camada de névoa baixa que se move (planos com ruído)
const mistTex = (() => {
  const s = 256, c = document.createElement("canvas"); c.width = c.height = s; const g = c.getContext("2d"); const im = g.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const v = fbm2((x / s) * 3, (y / s) * 3, 5, 3); const i = (y * s + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = clamp((v - 0.35) * 2.2) * 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
})();
function mistLayers(g, o = {}) {
  const n = o.n ?? 3, layers = [];
  for (let i = 0; i < n; i++) {
    const tex = mistTex.clone(); tex.needsUpdate = true; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(o.rep ?? 3, o.rep ?? 3);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(o.size ?? 300, o.size ?? 300), new THREE.MeshBasicMaterial({ map: tex, color: o.color ?? 0xdde6f0, transparent: true, opacity: (o.opacity ?? 0.35) * (1 - i * 0.18), depthWrite: false, fog: true }));
    m.rotation.x = -Math.PI / 2; m.position.set(o.x ?? 0, (o.y ?? 1) + i * (o.dy ?? 1.6), o.z ?? 0); m.renderOrder = 2; g.add(m);
    layers.push(m);
  }
  return (t) => layers.forEach((m, i) => { m.material.map.offset.set(t * (0.004 + i * 0.002), t * 0.002 * (i % 2 ? -1 : 1)); });
}
// raios de luz (planos aditivos em leque)
const rayTex = canvasTex(64, 256, (c, w, h) => {
  const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  const im = c.getImageData(0, 0, w, h); for (let x = 0; x < w; x++) { const k = Math.sin((x / (w - 1)) * Math.PI); for (let y = 0; y < h; y++) im.data[(y * w + x) * 4 + 3] *= k * k; } c.putImageData(im, 0, 0);
});
function godRays(g, origin, dir, o = {}) {
  const grpR = grp(g, ...origin); const d = new THREE.Vector3(...dir).normalize();
  grpR.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d);
  const rays = [];
  for (let i = 0; i < (o.n ?? 7); i++) {
    const len = (o.len ?? 60) * (0.7 + hash(i * 3.1) * 0.6), w = (o.w ?? 4) * (0.5 + hash(i * 5.7));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), new THREE.MeshBasicMaterial({ map: rayTex, color: o.color ?? 0xfff0c8, transparent: true, opacity: (o.opacity ?? 0.12) * (0.6 + hash(i) * 0.6), depthWrite: false, blending: ADD, side: THREE.DoubleSide, fog: false }));
    m.geometry.translate(0, -len / 2, 0);
    m.position.set((hash(i * 7.3) - 0.5) * (o.spread ?? 14), 0, (hash(i * 9.1) - 0.5) * (o.spread ?? 14));
    m.rotation.y = hash(i * 2.2) * Math.PI; m.rotation.z = (hash(i * 4.4) - 0.5) * 0.12;
    m.renderOrder = 5; grpR.add(m); rays.push(m);
  }
  grpR.userData.rays = rays;
  return grpR;
}
// partículas fixas (poeira no ar, estrelas, vaga-lumes)
function dustPts(n, b, color = 0xffe6b0, size = 0.06, opacity = 0.85, blending = ADD, seed = 0) {
  const p = [];
  for (let i = 0; i < n; i++) { const j = i + seed * 997; p.push(b[0] + hash(j) * (b[1] - b[0]), b[2] + hash(j + 7) * (b[3] - b[2]), b[4] + hash(j + 13) * (b[5] - b[4])); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: softTex, transparent: true, opacity, depthWrite: false, blending }));
  pts.userData.base = p.slice();
  return pts;
}
// poeira que flutua devagar (atualiza posições)
function floatDust(pts, t, amp = 0.3, sp = 0.2) {
  const a = pts.geometry.attributes.position, b = pts.userData.base;
  for (let i = 0; i < a.count; i++) a.setXYZ(i, b[i * 3] + noise1(t * sp + i * 1.7) * amp, b[i * 3 + 1] + noise1(t * sp * 0.8 + i * 2.3) * amp, b[i * 3 + 2] + noise1(t * sp + i * 3.1) * amp);
  a.needsUpdate = true;
}
// partículas com posições livres (atualize .pos e chame .upd())
function flowPts(n, color, size = 0.06, blending = ADD) {
  const pos = new Float32Array(n * 3); const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: softTex, transparent: true, depthWrite: false, blending }));
  pts.frustumCulled = false;
  return { pts, pos, geo, upd() { geo.attributes.position.needsUpdate = true; } };
}
function glowSprite(color, size = 1, opacity = 0.8, blending = ADD, tex = softTex) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false, blending })); s.scale.setScalar(size); return s; }
// vapor/fumaça: emissor determinístico de sprites (cada partícula tem ciclo de vida próprio)
function steam(g, o = {}) {
  const n = o.n ?? 24, life = o.life ?? 3.0, ps = [];
  for (let i = 0; i < n; i++) { const s = glowSprite(o.color ?? 0xf4f0ea, 1, 0, o.blending ?? NORM, puffTex); s.material.depthWrite = false; s.renderOrder = 6; g.add(s); ps.push(s); }
  const st = {
    origin: new THREE.Vector3(...(o.origin ?? [0, 0, 0])), rate: 1, spread: o.spread ?? 0.4, rise: o.rise ?? 1.2, grow: o.grow ?? 1.6, size: o.size ?? 0.6, op: o.opacity ?? 0.5, wind: o.wind ?? [0.3, 0, 0],
    upd(t, k = 1, origin) {
      if (origin) st.origin.copy(origin);
      ps.forEach((s, i) => {
        const age = ((t + hash(i * 1.37 + (o.seed ?? 0)) * life) % life) / life;
        const sx = (hash(i * 3.3) - 0.5) * st.spread, sz = (hash(i * 5.9) - 0.5) * st.spread;
        s.position.set(st.origin.x + sx + st.wind[0] * age * life + noise1(t * 0.7 + i) * 0.15 * st.size, st.origin.y + st.rise * age * life, st.origin.z + sz + st.wind[2] * age * life);
        s.scale.setScalar(st.size * (0.5 + age * st.grow));
        s.material.opacity = st.op * k * Math.sin(age * Math.PI) * (0.6 + hash(i * 7.7) * 0.4);
        s.material.rotation = hash(i) * 6 + age * (hash(i * 2) - 0.5) * 2;
        s.visible = k > 0.001;
      });
    },
  };
  return st;
}
// anel de poeira no chão (impacto de passo)
function dustRing(g, color = 0xc8b89a) {
  const ps = [];
  for (let i = 0; i < 14; i++) { const s = glowSprite(color, 1, 0, NORM, puffTex); s.renderOrder = 6; g.add(s); ps.push(s); }
  return (t, t0, pos, size = 3, dur = 1.6) => {
    const k = (t - t0) / dur, on = k >= 0 && k < 1;
    ps.forEach((s, i) => {
      s.visible = on; if (!on) return;
      const a = (i / ps.length) * Math.PI * 2 + hash(i) * 0.4, r = size * (0.3 + E.out(k) * (0.9 + hash(i * 3) * 0.5));
      s.position.set(pos.x + Math.cos(a) * r, pos.y + 0.2 + k * size * 0.25, pos.z + Math.sin(a) * r);
      s.scale.setScalar(size * (0.5 + k * 0.9)); s.material.opacity = 0.55 * (1 - k) * Math.min(1, k * 8);
    });
  };
}
// pássaros (V batendo as asas) seguindo um caminho
function birds(g, n = 7, o = {}) {
  const bs = [];
  const mat = new THREE.MeshBasicMaterial({ color: o.color ?? 0x1a1a22, side: THREE.DoubleSide, fog: true });
  for (let i = 0; i < n; i++) {
    const b = grp(g); const s = (o.size ?? 0.6) * (0.7 + hash(i) * 0.6);
    const wing = (k) => { const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.12 * s, 0, 0, -0.12 * s, k * s, 0, -0.05 * s], 3)); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat); b.add(m); return m; };
    b.userData.w = [wing(1), wing(-1)]; bs.push(b);
  }
  return (t) => bs.forEach((b, i) => {
    const ph = t * (o.speed ?? 0.12) + hash(i * 3) * 0.2, c = o.center ?? [0, 30, -40];
    b.position.set(c[0] + Math.sin(ph * 2 + i) * (o.rx ?? 20) + (hash(i * 7) - 0.5) * 6, c[1] + Math.sin(ph * 3 + i * 2) * 2 + hash(i * 5) * 4, c[2] + Math.cos(ph * 2 + i) * (o.rz ?? 8));
    b.rotation.y = -ph * 2 - i + Math.PI / 2;
    const f = Math.sin(t * 9 + i * 1.7) * 0.7; b.userData.w[0].rotation.x = f; b.userData.w[1].rotation.x = -f;
  });
}
// texto 3D em placa (canvas)
function textTex(lines, o = {}) {
  const { w = 512, h = 256, bg = null, fg = "#fff", size = 60, font = "Archivo Black" } = o;
  return canvasTex(w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } g.fillStyle = fg; g.font = `700 ${size}px '${font}', sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
    lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.2));
  }, { redraw: true });
}

// ---------------------------------------------------------------- cenários (conjuntos)
const SETS = {};
function addSet(name, build) { const g = new THREE.Group(); g.visible = false; scene.add(g); const s = build(g); s.group = g; SETS[name] = s; }

// ---------------------------------------------------------------- personagens v2 (originais, nada desenhado de séries)
// Esqueleto com quadril, coluna, peito, pescoço, cabeça, ombro/cotovelo/punho, quadril/joelho/tornozelo.
// Convenções (personagem olhando para +z): braço [0] = direito (-x), [1] = esquerdo (+x).
// Braço pra frente = rotação x negativa; cotovelo dobra com x negativo; coxa pra frente = x negativo; joelho dobra com x positivo.
const SKINS = { clara: 0xf1c9a5, media: 0xdba27a, morena: 0xb07850, escura: 0x75492f };
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
const _m4 = new THREE.Matrix4(), _q1 = new THREE.Quaternion();
const _ray = new THREE.Raycaster();
function surfZ(m, x, y, z0 = 2) { _ray.set(_v4.set(x, y, z0), new THREE.Vector3(0, 0, -1)); const h = _ray.intersectObject(m, false)[0]; return h ? h.point.z : 0; }

const HUMANO = { hipY: 0.95, spine: 0.1, chest: 0.2, neckY: 0.275, headY: 0.05, shW: 0.185, shY: 0.235, upper: 0.29, fore: 0.255, hipW: 0.092, thigh: 0.435, shin: 0.435 };
function skeleton(d) {
  const root = new THREE.Group();
  const hips = grp(root, 0, d.hipY, 0);
  const spine = grp(hips, 0, d.spine, 0);
  const chest = grp(spine, 0, d.chest, 0);
  const neck = grp(chest, 0, d.neckY, d.neckZ ?? 0);
  const head = grp(neck, 0, d.headY, d.headZ ?? 0.01);
  const sh = [-1, 1].map((k) => grp(chest, k * d.shW, d.shY, 0));
  const el = sh.map((s) => grp(s, 0, -d.upper, 0));
  const wr = el.map((e) => grp(e, 0, -d.fore, 0));
  const hipJ = [-1, 1].map((k) => grp(hips, k * d.hipW, -0.03, 0));
  const knee = hipJ.map((h) => grp(h, 0, -d.thigh, 0));
  const ankle = knee.map((k) => grp(k, 0, -d.shin, 0));
  return { root, hips, spine, chest, neck, head, sh, el, wr, hipJ, knee, ankle, d };
}

// cabeça: esfera deformada (mandíbula afinando, queixo, nuca)
function headGeo(o = {}) {
  const g = new THREE.SphereGeometry(1, 44, 32);
  const jaw = o.jaw ?? 0.3, chin = o.chin ?? 0.1;
  deform(g, (v) => {
    if (v.y < 0) { const k = Math.pow(-v.y, 1.35); v.x *= 1 - jaw * k; v.z += chin * k * Math.max(0, v.z); }
    if (v.z < 0) v.z *= o.back ?? 1.06;
    if (v.y > 0.3 && v.z > 0) v.z *= 1 - 0.07 * (v.y - 0.3);
    v.x *= 1 + (o.cheek ?? 0.05) * Math.exp(-((v.y + 0.08) ** 2) * 18) * Math.max(0, v.z);
  });
  g.scale(o.sx ?? 0.078, o.sy ?? 0.106, o.sz ?? 0.096);
  g.translate(0, o.cy ?? 0.11, 0);
  g.computeVertexNormals();
  return g;
}

// olho: globo + íris/pupila em calota + brilho; pálpebra de cima gira para piscar
function eye(parent, x, y, z, r, o = {}) {
  const g = grp(parent, x, y, z);
  const ball = grp(g);
  mesh(sph(r, 20, 16), TM(o.white ?? 0xf6f1ea), 0, 0, 0, ball);
  const capGeo = (rr, th) => { const c = new THREE.SphereGeometry(rr, 24, 8, 0, Math.PI * 2, 0, th); c.rotateX(Math.PI / 2); return c; };
  mesh(capGeo(r * 1.006, o.irisA ?? 0.68), TM(o.iris ?? 0x5a3a22), 0, 0, 0, ball);
  mesh(capGeo(r * 1.012, o.pupilA ?? 0.3), BM(0x0a0608), 0, 0, 0, ball);
  const hl = mesh(sph(r * 0.13, 8, 6), BM(o.hl ?? 0xc8c8c8), -r * 0.32, r * 0.36, r * 0.94, ball); hl.castShadow = false;
  const lidM = TM(o.lid ?? o.skin ?? SKINS.media);
  const up = grp(g);
  mesh(new THREE.SphereGeometry(r * 1.07, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), lidM, 0, 0, 0, up);
  const lash = mesh(new THREE.TorusGeometry(r * 1.07, r * (o.lash ?? 0.1), 6, 22, Math.PI), BM(o.lashCol ?? 0x140c0c), 0, 0, 0, up); lash.rotation.x = Math.PI / 2; lash.castShadow = false;
  const lo = mesh(new THREE.SphereGeometry(r * 1.05, 22, 8, 0, Math.PI * 2, Math.PI * 0.64, Math.PI * 0.36), lidM, 0, 0, 0, g);
  return { g, ball, up, lo, open: o.open ?? -0.5 };
}
function setEye(e, open, yaw = 0, pitch = 0) { e.up.rotation.x = lerp(1.05, e.open, clamp(open)); e.ball.rotation.set(pitch, yaw, 0); }

// cabelo em mechas (curvas afinando) sobre uma calota
function hairLocks(head, o) {
  const cx = 0, cy = o.cy ?? 0.11, ax = (o.ax ?? 0.078) + 0.006, ay = (o.ay ?? 0.106) + 0.006, az = (o.az ?? 0.096) + 0.006;
  const hm = TM(o.color, { side: THREE.DoubleSide }), hc = new THREE.Color(o.color);
  const shades = [hm, TM(hc.clone().offsetHSL(0, 0, 0.05).getHex(), { side: THREE.DoubleSide }), TM(hc.clone().offsetHSL(0, 0, -0.04).getHex(), { side: THREE.DoubleSide })];
  const slick = (o.style ?? "curto") === "penteado";
  const capG = new THREE.SphereGeometry(1, 30, 16, 0, Math.PI * 2, 0, Math.PI * (o.capA ?? (slick ? 0.6 : 0.42))); capG.scale(ax, ay, az);
  const hg = grp(head, 0, cy, 0); const hroot = grp(hg, 0, -cy, 0); head.userData.hairG = hg; head.userData.hairLong = (o.style ?? "curto") === "longo" || (o.len ?? 1) > 1.2;
  const capM = mesh(capG, hm, cx, cy, -0.004, hroot); capM.rotation.x = o.capTilt ?? (slick ? -0.95 : -0.42); if (!slick) ol(capM, 0.003);
  const style = o.style ?? "curto", n = o.n ?? (style === "longo" ? 96 : style === "penteado" ? 64 : 56);
  if (style === "penteado") { slickLocks(hroot, shades, { ax, ay, az, cy, n, seed: o.seed ?? 0, thick: o.thick ?? 0.017, len: o.len ?? 1 }); return; }
  const P = (th, ph, k = 1) => new THREE.Vector3(Math.sin(th) * Math.sin(ph) * ax * k, cy + Math.cos(th) * ay * k, Math.sin(th) * Math.cos(ph) * az * k);
  for (let i = 0; i < n; i++) {
    const ph = (i / n) * Math.PI * 2 + (hash(i * 3.7 + (o.seed ?? 0)) - 0.5) * 0.35;
    const front = Math.cos(ph) > 0.55, side = !front && Math.cos(ph) > -0.3;
    const th = front ? (0.12 + hash(i * 5.1) * 0.16) * Math.PI : (0.18 + hash(i * 5.1) * 0.22) * Math.PI;
    const root = P(th, ph, 0.96), nrm = root.clone().sub(new THREE.Vector3(0, cy, 0)).normalize();
    let len = (style === "longo" ? (front ? 0.09 : 0.24 + hash(i) * 0.1) : (front ? 0.075 : 0.07)) * (0.8 + hash(i * 9.3) * 0.45) * (o.len ?? 1);
    if (style === "espetado") len *= 0.8;
    // direção de penteado: franja cai pra frente/baixo, lados e nuca pra baixo
    const comb = front ? new THREE.Vector3(Math.sin(ph) * 0.4 + (hash(i) - 0.5) * 0.5, -0.75, 0.55) : style === "longo" ? new THREE.Vector3(nrm.x * 0.35, -1, Math.min(nrm.z * 0.2, 0) - 0.22) : new THREE.Vector3(nrm.x * 0.5, -1, nrm.z * 0.5);
    if (style === "espetado") comb.set(nrm.x, 0.6 + nrm.y, nrm.z);
    comb.normalize();
    const p1 = root.clone().addScaledVector(nrm, 0.018).addScaledVector(comb, len * 0.3);
    const p2 = p1.clone().addScaledVector(comb, len * 0.4).addScaledVector(nrm, front ? 0.008 : 0.004);
    const p3 = p2.clone().addScaledVector(comb, len * 0.35).add(new THREE.Vector3((hash(i * 4.4) - 0.5) * 0.02, 0, (hash(i * 6.6) - 0.5) * 0.015));
    if (front) { p2.z = Math.max(p2.z, az * 0.98); p3.z = Math.max(p3.z, az * 1.0); const yMin = cy + (o.bangY ?? 0.036); p2.y = Math.max(p2.y, yMin + 0.012); p3.y = Math.max(p3.y, yMin); }
    const w = (o.thick ?? (style === "longo" ? 0.012 : 0.016)) * (0.75 + hash(i * 2.9) * 0.5);
    if (style === "longo" && !front) { p1.addScaledVector(nrm, 0.012); p2.addScaledVector(nrm, 0.02); }
    const lm = mesh(lockGeo([root.toArray(), p1.toArray(), p2.toArray(), p3.toArray()], w, 0.0015, 0.55, 10, 7), shades[i % 3], 0, 0, 0, hroot);
    lm.castShadow = i % 2 === 0;
  }
  if (style === "rabo") { const pts = [[0, cy + 0.02, -az * 0.95], [0, cy - 0.02, -az * 1.25], [0, cy - 0.12, -az * 1.3], [0, cy - 0.22, -az * 1.15]]; ol(mesh(lockGeo(pts, 0.03, 0.004, 0.8, 14, 9), hm, 0, 0, 0, hroot), 0.003); }
}

// cabelo penteado para trás: mechas em planos paralelos ao meio da cabeça (testa → topo → nuca) e laterais da têmpora para trás
function slickLocks(hroot, shades, o) {
  const { ax, ay, az, cy, n } = o, nt = Math.round(n * 0.6);
  for (let i = 0; i < n; i++) {
    const r1 = hash(i * 3.7 + o.seed), r2 = hash(i * 5.1 + o.seed), r3 = hash(i * 9.3 + o.seed);
    let pts, w;
    if (i < nt) {
      // de cima: nasce na linha do cabelo (testa), passa por cima com volume e desce até a nuca
      const xs = ((i + 0.5) / nt * 2 - 1) * 0.9 + (r1 - 0.5) * 0.05, s0 = Math.sqrt(Math.max(0.05, 1 - xs * xs));
      const g0 = (0.25 + Math.abs(xs) * 0.14 + r2 * 0.03) * Math.PI, g1 = -(0.62 + r3 * 0.14 - Math.abs(xs) * 0.1) * Math.PI;
      pts = [0, 0.14, 0.3, 0.48, 0.66, 0.84, 1].map((u) => { const gg = lerp(g0, g1, u), vol = 0.085 * Math.sin(Math.min(1, u * 1.6) * Math.PI) * (1 - Math.abs(xs) * 0.6), lift = 1.035 + vol - (u > 0.85 ? (u - 0.85) * 0.06 : 0);
        return [xs * ax * (1 + u * 0.06) * lift, cy + Math.cos(gg) * ay * s0 * lift, Math.sin(gg) * az * s0 * lift]; });
      w = o.thick * (0.85 + r2 * 0.35);
    } else {
      // laterais: da têmpora para trás, acima da orelha
      const k = i - nt, side = k % 2 ? 1 : -1, m = Math.max(1, Math.floor((n - nt) / 2) - 1), hh = Math.floor(k / 2) / m;
      const yy = 0.6 - hh * 0.5 + (r3 - 0.5) * 0.04, p0 = (0.3 + r1 * 0.06 + hh * 0.1) * Math.PI, p1 = (0.95 + r2 * 0.05) * Math.PI;
      pts = [0, 0.25, 0.5, 0.75, 1].map((u) => { const ph = side * lerp(p0, p1, u), y2 = yy - u * u * (0.18 + hh * 0.2), s2 = Math.sqrt(Math.max(0.05, 1 - y2 * y2)), lift = 1.04 + 0.025 * Math.sin(u * Math.PI); return [Math.sin(ph) * ax * s2 * lift, cy + y2 * ay * lift, Math.cos(ph) * az * s2 * lift]; });
      w = o.thick * (0.6 + r2 * 0.25);
    }
    const lm = mesh(lockGeo(pts, w, w * 0.35, 0.5, 16, 7), shades[i % 3], 0, 0, 0, hroot); lm.castShadow = i % 2 === 0;
  }
}
// mão com dedos (2 falanges) e polegar; curl 0..1 fecha
function hand(wr, side, skinM, s = 1, fingers = true) {
  const h = grp(wr, 0, 0, 0); h.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; const tk = side < 0 ? -1 : 1;
  const palm = mesh(sph(1, 14, 10), skinM, 0, -0.045 * s, 0, h); palm.scale.set(0.04 * s, 0.05 * s, 0.021 * s);
  const fs = [];
  if (fingers) {
    [-0.025, -0.0085, 0.0085, 0.025].forEach((fx, i) => {
      const L = (i === 0 || i === 3 ? 0.022 : 0.027) * s;
      const k1 = grp(h, fx * s, -0.085 * s, 0.003 * s); mesh(cap(0.0085 * s, L, 3, 8), skinM, 0, -L / 2, 0, k1);
      const k2 = grp(k1, 0, -L - 0.006 * s, 0); mesh(cap(0.0078 * s, L * 0.8, 3, 8), skinM, 0, -L * 0.4, 0, k2);
      fs.push([k1, k2]);
    });
    const t1 = grp(h, tk * 0.032 * s, -0.035 * s, 0.012 * s); t1.rotation.set(0.3, 0, tk * 0.75);
    mesh(cap(0.01 * s, 0.022 * s, 3, 8), skinM, 0, -0.016 * s, 0, t1); const t2 = grp(t1, 0, -0.034 * s, 0); mesh(cap(0.009 * s, 0.018 * s, 3, 8), skinM, 0, -0.012 * s, 0, t2);
    fs.push([t1, t2]);
  } else { const mitt = mesh(sph(1, 12, 8), skinM, 0, -0.1 * s, 0.006 * s, h); mitt.scale.set(0.038 * s, 0.04 * s, 0.02 * s); }
  return { h, fs, tk };
}
function curlHand(hd, k, thumb = k) {
  hd.fs.forEach((f, i) => {
    if (i < 4) { f[0].rotation.x = -k * 1.35; f[1].rotation.x = -k * 1.5; }
    else { f[0].rotation.set(0.3 + thumb * 0.5, 0, hd.tk * (0.75 - thumb * 0.5)); f[1].rotation.x = -thumb * 0.9; }
  });
}

// boca: interior escuro que abre, lábios; sorriso por morph
function mouthRig(head, y, z, w, o = {}) {
  const g = grp(head, 0, y, z);
  const inner = mesh(sph(1, 16, 10), BM(o.inside ?? 0x2a0c10), 0, -0.002, -0.006, g); inner.scale.set(w * 0.9, 0.001, 0.012); inner.castShadow = false;
  const teeth = mesh(box(w * 1.1, 0.008, 0.01), TM(0xf4efe6), 0, 0.001, -0.004, g); teeth.visible = false;
  const lipPts = (dy, curve, smile) => [[-w, dy + smile, -0.008], [-w * 0.5, dy + curve * 0.6 + smile * 0.3, -0.001], [0, dy + curve, 0.001], [w * 0.5, dy + curve * 0.6 + smile * 0.3, -0.001], [w, dy + smile, -0.008]];
  const mkLip = (dy, curve, th) => {
    const a = lockGeo(lipPts(dy, curve, 0), th, th * 0.5, 0.6, 12, 6), b = lockGeo(lipPts(dy, curve, w * 0.45), th, th * 0.5, 0.6, 12, 6);
    a.morphAttributes.position = [b.attributes.position]; a.morphAttributes.normal = [b.attributes.normal];
    const m = mesh(a, TM(o.lip ?? 0xb05a52), 0, 0, 0, g); m.castShadow = false; return m;
  };
  const up = mkLip(0.002, 0.0015, 0.0035 * (o.lipW ?? 1)), lo = mkLip(-0.003, -0.002, 0.0045 * (o.lipW ?? 1));
  return { g, inner, teeth, up, lo, w };
}
function setMouth(m, open = 0, smile = 0) {
  m.inner.scale.y = 0.001 + open * 0.016; m.up.position.y = open * 0.004; m.lo.position.y = -open * 0.012;
  m.up.morphTargetInfluences[0] = smile; m.lo.morphTargetInfluences[0] = smile; m.teeth.visible = open > 0.15;
}

// pele do rosto humano pintada na UV da cabeça (frente em u=0.25): bochechas, sombras suaves e cicatriz opcional
const HFACE = {};
function humanFaceTex(skin, o = {}) {
  const k = skin + "_" + (o.scar ? 1 : 0) + "_" + (o.blush ?? 1); if (HFACE[k]) return HFACE[k];
  const Wd = 1024, Hd = 512, px = (ph) => (0.25 + ph / 360) * Wd, py = (th) => (th / 180) * Hd;
  const b = hex2rgb(skin), css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  return (HFACE[k] = canvasTex(Wd, Hd, (c) => {
    c.fillStyle = css(b); c.fillRect(0, 0, Wd, Hd);
    const rg = (x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, css(col, a)); g.addColorStop(1, css(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
    [-1, 1].forEach((s) => { rg(px(s * 30), py(104), 34, [235, 120, 110], 0.22 * (o.blush ?? 1)); rg(px(s * 25), py(90), 22, mixc(b, [90, 50, 60], 0.6), 0.22); });
    rg(px(0), py(80), 60, mixc(b, [255, 245, 235], 0.5), 0.18);
    rg(px(0), py(116), 30, mixc(b, [150, 80, 70], 0.5), 0.18);
    if (o.scar) { c.strokeStyle = css(mixc(b, [150, 70, 70], 0.7), 0.95); c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(px(23), py(72)); c.quadraticCurveTo(px(25), py(80), px(24.5), py(84)); c.moveTo(px(25), py(95)); c.quadraticCurveTo(px(26), py(101), px(27.5), py(107)); c.stroke(); }
  }));
}
const bandageTex = canvasTex(128, 256, (c, w, h) => { c.fillStyle = "#e8e0cc"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(150,135,110,.75)"; c.lineWidth = 3; for (let y = -w; y < h + w; y += 18) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + 24); c.stroke(); } c.fillStyle = "rgba(255,255,255,.25)"; for (let y = 0; y < h; y += 18) c.fillRect(0, y + 4, w, 4); });
// pessoa (humano original)
function pessoa(o = {}) {
  const P = { skin: SKINS.media, hair: 0x2a1a12, hairStyle: "curto", iris: 0x5a3a22, shirt: 0xd8cfbf, jacket: 0x6a4a34, pants: 0x3c3a44, boots: 0x2a1c14, belt: 0x2a1a10, fingers: true, olw: 0.0045, scale: 1, ...o };
  const S = skeleton({ ...HUMANO, ...(o.dims || {}) });
  const skinM = TM(P.skin), shirtM = TM(P.shirt), pantsM = TM(P.pants), bootM = TM(P.boots), jackM = P.jacket ? TM(P.jacket, { side: THREE.DoubleSide }) : null;
  const OL = (m, w = P.olw) => ol(m, w);
  // quadril e pernas
  OL(mesh(sph(1, 20, 14), pantsM, 0, -0.01, 0, S.hips)).scale.set(0.15, 0.11, 0.11);
  S.hipJ.forEach((hj, i) => {
    OL(mesh(lathe([[0.001, -0.45], [0.058, -0.44], [0.064, -0.3], [0.076, -0.1], [0.08, 0.0], [0.062, 0.05], [0.001, 0.065]], 18), pantsM, 0, 0, 0, hj));
    mesh(sph(0.058, 12, 10), pantsM, 0, 0, 0.004, S.knee[i]);
    OL(mesh(lathe([[0.001, -0.44], [0.05, -0.42], [0.056, -0.26], [0.062, -0.1], [0.06, 0.0], [0.001, 0.03]], 18), pantsM, 0, 0, 0, S.knee[i]));
    const bt = OL(mesh(lathe([[0.001, -0.05], [0.06, -0.05], [0.066, 0.0], [0.066, 0.12], [0.07, 0.17], [0.001, 0.17]], 16), bootM, 0, 0, 0, S.ankle[i]));
    const foot = OL(mesh(cap(0.055, 0.13, 4, 12), bootM, 0, -0.035, 0.065, S.ankle[i])); foot.rotation.x = Math.PI / 2; foot.scale.set(1, 1, 0.75);
  });
  // tronco: abdômen e peito em torno (lathe), jaqueta aberta na frente
  const abd = OL(mesh(lathe([[0.001, -0.06], [0.13, -0.06], [0.132, 0.05], [0.128, 0.13], [0.132, 0.21], [0.001, 0.21]], 26), shirtM, 0, 0, 0, S.spine)); abd.scale.z = 0.74;
  const chestPts = [[0.001, -0.02], [0.13, -0.02], [0.152, 0.06], [0.168, 0.15], [0.166, 0.22], [0.14, 0.27], [0.08, 0.305], [0.001, 0.31]];
  const ch = OL(mesh(lathe(chestPts, 28), shirtM, 0, 0, 0, S.chest)); ch.scale.z = 0.7;
  if (jackM) {
    const open = P.jacketOpen ?? 0.42;
    const jc = mesh(lathe(chestPts.map(([r, y]) => [r * 1.08 + 0.004, y]), 28, open, Math.PI * 2 - open * 2), jackM, 0, 0, 0, S.chest); jc.scale.z = 0.74; OL(jc);
    const ja = mesh(lathe([[0.142, -0.06], [0.142, 0.05], [0.14, 0.13], [0.145, 0.21]], 26, open, Math.PI * 2 - open * 2), jackM, 0, 0, 0, S.spine); ja.scale.z = 0.78; OL(ja);
    const hem = mesh(lathe([[0.152, -0.02], [0.17, -0.1], [0.185, -0.17]], 26, open * 1.3, Math.PI * 2 - open * 2.6), jackM, 0, 0.04, 0, S.hips); hem.scale.z = 0.82; OL(hem);
    const col = mesh(new THREE.TorusGeometry(0.075, 0.022, 8, 20, Math.PI * 1.5), jackM, 0, 0.29, -0.006, S.chest); col.rotation.set(Math.PI / 2, 0, Math.PI * 0.25 + Math.PI / 2); col.scale.set(1, 0.85, 1);
  }
  const belt = mesh(new THREE.TorusGeometry(0.135, 0.018, 6, 26), TM(P.belt), 0, 0.05, 0, S.hips); belt.rotation.x = Math.PI / 2; belt.scale.set(1, 0.78, 1);
  mesh(box(0.05, 0.035, 0.012), TM(0xb89a5a), 0, 0.05, 0.108, S.hips);
  // braços
  const armM = jackM || shirtM;
  const hands = S.sh.map((sh, i) => {
    mesh(sph(0.056, 14, 10), armM, 0, -0.012, 0, sh);
    OL(mesh(lathe([[0.001, -0.3], [0.045, -0.29], [0.049, -0.2], [0.053, -0.08], [0.057, 0.0], [0.04, 0.04], [0.001, 0.05]], 16), armM, 0, 0, 0, sh));
    mesh(sph(0.044, 10, 8), armM, 0, 0, 0, S.el[i]);
    OL(mesh(lathe([[0.001, -0.235], [0.04, -0.228], [0.043, -0.15], [0.046, -0.05], [0.047, 0.0], [0.001, 0.03]], 16), P.bandages ? TM(0xffffff, { map: bandageTex }) : armM, 0, 0, 0, S.el[i]));
    mesh(cyl(0.05, 0.048, 0.04, 14), TM(P.cuff ?? P.shirt), 0, -0.225, 0, S.el[i]);
    return hand(S.wr[i], i ? 1 : -1, skinM, 1, P.fingers);
  });
  // pescoço e cabeça
  OL(mesh(cyl(0.041, 0.047, 0.1, 14), skinM, 0, 0.03, 0, S.neck));
  const nl = mesh(new THREE.TorusGeometry(0.05, 0.014, 6, 18), shirtM, 0, 0.3, 0.004, S.chest); nl.rotation.x = Math.PI / 2 - 0.25;
  const hg = headGeo({ sx: 0.081, sy: 0.104, sz: 0.097, jaw: 0.22, chin: 0.07, cheek: 0.07, ...(P.headShape || {}) });
  const headM = mesh(hg, TM(0xffffff, { map: humanFaceTex(P.skin, { scar: P.scar, blush: P.blush }) }), 0, 0, 0); ol(headM, P.olw * 0.9);
  const zAt = (x, y) => surfZ(headM, x, y);
  S.head.add(headM);
  const ex = 0.031, ey = 0.117, er = 0.0148;
  const eyes = [-1, 1].map((k) => eye(S.head, k * ex, ey, zAt(k * ex, ey) - er * 0.62, er, { iris: P.iris, skin: P.skin }));
  const brows = [-1, 1].map((k) => {
    const b = grp(S.head, k * 0.031, 0.142, zAt(k * 0.031, 0.142) + 0.002);
    mesh(lockGeo([[-k * 0.019, -0.003, -0.004], [-k * 0.004, 0.001, 0], [k * 0.017, 0.0, -0.006]], 0.0042, 0.0016, 0.5, 8, 6), TM(P.brow ?? P.hair), 0, 0, 0, b).castShadow = false;
    return b;
  });
  const nz = zAt(0, 0.086);
  const nose = mesh(sph(1, 14, 10), skinM, 0, 0.088, nz + 0.004, S.head); nose.scale.set(0.012, 0.016, 0.014);
  mesh(cap(0.007, 0.03, 3, 8), skinM, 0, 0.104, zAt(0, 0.104) - 0.002, S.head).rotation.x = -0.25;
  [-1, 1].forEach((k) => { const ear = mesh(sph(1, 12, 10), skinM, k * 0.077, 0.108, -0.008, S.head); ear.scale.set(0.012, 0.026, 0.017); });
  const mouth = mouthRig(S.head, 0.058, zAt(0, 0.058) - 0.003, 0.021, { lip: P.lip ?? 0xa85a50 });
  if (P.hairStyle !== "careca") hairLocks(S.head, { color: P.hair, style: P.hairStyle, seed: P.seed ?? 0, len: P.hairLen ?? 1 });
  if (P.beard) { const bd = mesh(sph(1, 18, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), TM(P.beard), 0, 0.075, 0.008, S.head); bd.scale.set(0.074, 0.09, 0.09); }
  // gola alta
  if (P.collar === "alta" && jackM) { const cl = mesh(lathe([[0.066, 0.245], [0.07, 0.31], [0.074, 0.37], [0.078, 0.395]], 24, 0.45, Math.PI * 2 - 0.9), jackM, 0, 0, -0.004, S.chest); cl.scale.z = 0.92; OL(cl); }
  // cachecol com pontas que balançam
  let scarfTails = [];
  if (P.scarf) { const sm2 = TM(P.scarf, { side: THREE.DoubleSide }); const sr = mesh(new THREE.TorusGeometry(0.064, 0.026, 8, 22), sm2, 0, 0.3, 0.004, S.chest); sr.rotation.x = Math.PI / 2 - 0.2; OL(sr);
    scarfTails = [-1, 1].map((k) => { const tg = new THREE.PlaneGeometry(0.07, 0.36, 2, 8); tg.translate(0, -0.18, 0); const tl = mesh(tg, sm2, 0.03 * k + 0.02, 0.29, 0.07, S.chest); tl.rotation.set(-0.15, 0, 0.12 * k); tl.userData.base = Float32Array.from(tg.attributes.position.array); tl.frustumCulled = false; return tl; }); }
  // tapa-olho (olho esquerdo) que pode ser levantado
  let patch = null;
  if (P.eyepatch) { patch = grp(S.head, ex, ey + 0.021, zAt(ex, ey + 0.021) + 0.001); const pm = mesh(sph(1, 16, 12), TM(0x1c1612), 0, -0.021, 0.004, patch); pm.scale.set(0.026, 0.022, 0.011); OL(pm, 0.003);
    const strap = mesh(new THREE.TorusGeometry(0.094, 0.0034, 6, 40), TM(0x1c1612), 0, ey + 0.02, -0.004, S.head); strap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-0.62, -0.77, 0.14).normalize()); }
  // abas do casaco atrás (tecido)
  let tails = [];
  if (P.coatTail && jackM) tails = [-1, 1].map((k) => { const tg = new THREE.PlaneGeometry(0.15, 0.5, 3, 10); tg.translate(0, -0.25, 0); const tl = mesh(tg, jackM, 0.075 * k, -0.06, -0.13, S.hips); tl.rotation.x = 0.12; tl.userData.base = Float32Array.from(tg.attributes.position.array); tl.frustumCulled = false; return tl; });
  // capa opcional (tecido que balança)
  let cloak = null;
  if (P.cloak) {
    const cg = new THREE.PlaneGeometry(0.46, 1.0, 8, 14); cg.translate(0, -0.5, 0);
    cloak = mesh(cg, TM(P.cloak, { side: THREE.DoubleSide }), 0, 0.27, -0.13, S.chest); cloak.userData.base = Float32Array.from(cg.attributes.position.array); cloak.frustumCulled = false;
  }
  S.root.scale.setScalar(P.scale);
  shadows(S.root);
  S.root.userData = { ...S, eyes, brows, mouth, hands, cloak, P, headM, kind: "pessoa", patch, tails, scarfTails };
  restPose(S.root);
  return S.root;
}

// ---------------------------------------------------------------- poses e animação
function restPose(p) {
  const u = p.userData;
  u.hips.position.set(0, u.d.hipY, 0); u.hips.rotation.set(0, 0, 0);
  [u.spine, u.chest, u.neck, u.head].forEach((g) => g.rotation.set(0, 0, 0));
  u.sh.forEach((s, i) => s.rotation.set(0, 0, (i ? 1 : -1) * 0.07)); u.el.forEach((e) => e.rotation.set(-0.12, 0, 0)); u.wr.forEach((w) => w.rotation.set(0, 0, 0));
  u.hipJ.forEach((h) => h.rotation.set(0, 0, 0)); u.knee.forEach((k) => k.rotation.set(0, 0, 0)); u.ankle.forEach((a) => a.rotation.set(0, 0, 0));
  if (u.hands) u.hands.forEach((h) => curlHand(h, 0.25, 0.2));
  if (u.kind === "gigante") { u.spine.rotation.x = 0.1; u.neck.rotation.x = 0.16; u.head.rotation.x = -0.06; u.sh.forEach((s) => (s.rotation.x = -0.1)); u.el.forEach((e) => (e.rotation.x = -0.32)); u.knee.forEach((k) => (k.rotation.x = 0.1)); u.hipJ.forEach((h) => (h.rotation.x = -0.05)); }
  if (u.eyes) u.eyes.forEach((e) => setEye(e, 1));
  if (u.mouth) setMouth(u.mouth, 0, 0);
  if (u.chest.userData.sc0 == null) u.chest.userData.sc0 = u.chest.scale.clone();
}
// aplica uma pose: { hips:[x,y,z] (rotação), hipsPos:[dx,dy,dz], spine, chest, neck, head, armR:[shx,shy,shz,el], armL, legR:[hx,hy,hz,kn,an], legL, handR, handL }
function pose(p, q, k = 1) {
  const u = p.userData, R = (g, a) => { if (a) g.rotation.set(lerp(g.rotation.x, a[0], k), lerp(g.rotation.y, a[1] || 0, k), lerp(g.rotation.z, a[2] || 0, k)); };
  if (q.hipsPos) u.hips.position.set(lerp(u.hips.position.x, q.hipsPos[0], k), lerp(u.hips.position.y, u.d.hipY + q.hipsPos[1], k), lerp(u.hips.position.z, q.hipsPos[2], k));
  R(u.hips, q.hips); R(u.spine, q.spine); R(u.chest, q.chest); R(u.neck, q.neck); R(u.head, q.head);
  [["armR", 0], ["armL", 1]].forEach(([n, i]) => { const a = q[n]; if (!a) return; R(u.sh[i], [a[0], a[1], a[2]]); u.el[i].rotation.x = lerp(u.el[i].rotation.x, a[3] ?? -0.12, k); if (a[4] != null) R(u.wr[i], [a[4], a[5] || 0, a[6] || 0]); });
  [["legR", 0], ["legL", 1]].forEach(([n, i]) => { const a = q[n]; if (!a) return; R(u.hipJ[i], [a[0], a[1], a[2]]); u.knee[i].rotation.x = lerp(u.knee[i].rotation.x, a[3] ?? 0, k); u.ankle[i].rotation.x = lerp(u.ankle[i].rotation.x, a[4] ?? 0, k); });
  if (u.hands) { if (q.handR != null) curlHand(u.hands[0], q.handR); if (q.handL != null) curlHand(u.hands[1], q.handL); }
}
// respiração, piscadas e olhar vivo
function idle(p, t, seed = 0, amt = 1) {
  const u = p.userData, b = Math.sin(t * 1.7 + seed);
  const s0 = u.chest.userData.sc0 || new THREE.Vector3(1, 1, 1);
  u.chest.scale.set(s0.x * (1 + b * 0.012 * amt), s0.y * (1 + b * 0.006 * amt), s0.z * (1 + b * 0.02 * amt));
  u.chest.rotation.x += b * 0.012 * amt;
  u.spine.rotation.z += fbm1(t * 0.3 + seed) * 0.03 * amt;
  u.head.rotation.y += fbm1(t * 0.4 + seed * 3) * 0.12 * amt; u.head.rotation.x += fbm1(t * 0.35 + seed * 5) * 0.05 * amt;
  // troca de peso lenta, ombros que sobem com a respiração e braços com micro-movimento
  const ws = Math.sin(t * 0.42 + seed * 1.7);
  u.hips.position.x += ws * 0.01 * amt; u.hips.rotation.z += ws * 0.018 * amt; u.spine.rotation.z -= ws * 0.012 * amt;
  u.sh.forEach((sh, i) => { sh.rotation.z += (i ? 1 : -1) * b * 0.008 * amt; sh.rotation.x += fbm1(t * 0.45 + seed + i * 7) * 0.035 * amt; });
  u.el.forEach((e, i) => (e.rotation.x += fbm1(t * 0.38 + seed * 2 + i * 5) * 0.03 * amt));
  const hgp = u.head.userData.hairG;
  if (hgp) { const ha = u.head.userData.hairLong ? 2.2 : 1; hgp.rotation.z = (Math.sin(t * 1.15 + seed) * 0.018 + fbm1(t * 0.7 + seed) * 0.012) * ha; hgp.rotation.x = Math.sin(t * 0.85 + seed * 2) * 0.012 * ha; }
  if (u.eyes) {
    const ph = (t + hash(seed) * 4) % 3.9, bl = ph < 0.16 ? Math.sin((ph / 0.16) * Math.PI) : 0;
    const sacc = Math.floor(t * 1.3 + seed), yaw = (hash(sacc * 1.7 + seed) - 0.5) * 0.35 * amt, pit = (hash(sacc * 2.3 + seed) - 0.5) * 0.15 * amt;
    u.eyes.forEach((e) => setEye(e, (u.lidOpen ?? 1) * (1 - bl), yaw + (u.eyeYaw || 0), pit + (u.eyePitch || 0)));
  }
}
// ciclo de caminhada (fase em ciclos; amt = amplitude). Velocidade do corpo ≈ passada * cadência.
function walk(p, ph, amt = 1, o = {}) {
  const u = p.userData, a = ph * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
  const A = 0.42 * amt * (o.stride ?? 1);
  const thR = -s * A, thL = s * A;
  const knR = (0.06 + 0.95 * Math.pow(Math.max(0, c), 1.5) + 0.12 * Math.max(0, -s)) * amt, knL = (0.06 + 0.95 * Math.pow(Math.max(0, -c), 1.5) + 0.12 * Math.max(0, s)) * amt;
  u.hipJ[0].rotation.set(thR - (o.lean ?? 0) * 0.3, 0, -0.02); u.hipJ[1].rotation.set(thL - (o.lean ?? 0) * 0.3, 0, 0.02);
  u.knee[0].rotation.x = knR; u.knee[1].rotation.x = knL;
  u.ankle[0].rotation.x = -(thR + knR) * 0.75 + 0.1 * Math.max(0, c) * amt; u.ankle[1].rotation.x = -(thL + knL) * 0.75 + 0.1 * Math.max(0, -c) * amt;
  u.hips.position.y = u.d.hipY + (Math.cos(2 * a) * 0.022 - 0.012) * amt * (o.bob ?? 1);
  u.hips.rotation.set(o.lean ?? 0, s * 0.09 * amt, c * 0.03 * amt);
  u.chest.rotation.y = -s * 0.12 * amt; u.spine.rotation.x = (o.lean ?? 0) * 0.5;
  const arm = 0.36 * amt * (o.arms ?? 1);
  u.sh[0].rotation.set(s * arm, 0, -0.07 - 0.03 * amt); u.sh[1].rotation.set(-s * arm, 0, 0.07 + 0.03 * amt);
  u.el[0].rotation.x = -0.25 - 0.25 * Math.max(0, -s) * amt; u.el[1].rotation.x = -0.25 - 0.25 * Math.max(0, s) * amt;
  u.head.rotation.y = s * 0.06 * amt;
}
function run(p, ph, amt = 1) {
  const u = p.userData, a = ph * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
  const thR = -s * 0.75 * amt - 0.15 * amt, thL = s * 0.75 * amt - 0.15 * amt;
  u.hipJ[0].rotation.set(thR, 0, -0.02); u.hipJ[1].rotation.set(thL, 0, 0.02);
  u.knee[0].rotation.x = (0.25 + 1.5 * Math.pow(Math.max(0, c), 1.2)) * amt; u.knee[1].rotation.x = (0.25 + 1.5 * Math.pow(Math.max(0, -c), 1.2)) * amt;
  u.ankle[0].rotation.x = 0.3 * c * amt; u.ankle[1].rotation.x = -0.3 * c * amt;
  u.hips.position.y = u.d.hipY + (Math.abs(Math.cos(a)) * 0.05 - 0.04) * amt;
  u.hips.rotation.set(0.12 * amt, s * 0.12 * amt, 0); u.spine.rotation.x = 0.12 * amt; u.chest.rotation.y = -s * 0.18 * amt;
  u.sh[0].rotation.set(s * 0.8 * amt, 0, -0.12); u.sh[1].rotation.set(-s * 0.8 * amt, 0, 0.12);
  u.el[0].rotation.x = -1.35 * amt; u.el[1].rotation.x = -1.35 * amt;
  if (u.hands) u.hands.forEach((h) => curlHand(h, 0.75));
}
// cabeça (pescoço + cabeça) olhando para um ponto do mundo
function lookAtW(p, target, k = 1, maxYaw = 1.1) {
  const u = p.userData; p.updateMatrixWorld(true);
  const loc = u.neck.worldToLocal(_v1.copy(target));
  const yaw = clamp(Math.atan2(loc.x, loc.z), -maxYaw, maxYaw), pit = clamp(-Math.atan2(loc.y - 0.12 * (u.d.headS ?? 1), Math.hypot(loc.x, loc.z)), -0.7, 0.6);
  u.neck.rotation.y = lerp(u.neck.rotation.y, yaw * 0.45, k); u.head.rotation.y = lerp(u.head.rotation.y, yaw * 0.55, k);
  u.neck.rotation.x = lerp(u.neck.rotation.x, pit * 0.4, k); u.head.rotation.x = lerp(u.head.rotation.x, pit * 0.6, k);
}
// IK de 2 ossos: ombro/cotovelo (sign -1) ou quadril/joelho (sign +1) até um alvo no mundo, dobrando para o polo
function ik2(S, El, L1, L2, target, pole, sign = -1, k = 1) {
  const par = S.parent; par.updateMatrixWorld(true);
  const o = S.position, T_ = par.worldToLocal(_v1.copy(target)), Pp = par.worldToLocal(_v2.copy(pole));
  const dir = _v3.copy(T_).sub(o); let d = dir.length(); d = clamp(d, Math.abs(L1 - L2) + 1e-4, L1 + L2 - 1e-4); dir.normalize();
  const cosA = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1), A = Math.acos(cosA);
  const cosE = clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1), flex = Math.PI - Math.acos(cosE);
  const pv = Pp.sub(o); const n = pv.addScaledVector(dir, -pv.dot(dir)).normalize();
  const uu = dir.clone().multiplyScalar(Math.cos(A)).addScaledVector(n, Math.sin(A));
  let z = dir.clone().addScaledVector(uu, -dir.dot(uu)); if (z.lengthSq() < 1e-8) z.copy(n).negate(); z.normalize(); if (sign > 0) z.negate();
  const y = uu.clone().negate(), x = new THREE.Vector3().crossVectors(y, z).normalize(); z.crossVectors(x, y);
  _m4.makeBasis(x, y, z); _q1.setFromRotationMatrix(_m4);
  if (k >= 1) S.quaternion.copy(_q1); else S.quaternion.slerp(_q1, k);
  El.rotation.set(lerp(El.rotation.x, sign * flex, k), 0, 0);
}
function armIK(p, i, target, pole, k = 1) { const u = p.userData; ik2(u.sh[i], u.el[i], u.d.upper, u.d.fore + 0.07, target, pole, -1, k); }
function legIK(p, i, target, pole, k = 1) { const u = p.userData; ik2(u.hipJ[i], u.knee[i], u.d.thigh, u.d.shin + 0.05, target, pole, 1, k); }
// expressão: sorriso, boca aberta, sobrancelhas (bravo < 0 < surpreso), pálpebras
function face(p, f = {}) {
  const u = p.userData;
  if (u.mouth) setMouth(u.mouth, f.open ?? 0, f.smile ?? 0);
  if (u.brows) u.brows.forEach((b, i) => { const k = i ? 1 : -1; b.position.y = 0.142 + (f.brow ?? 0) * 0.006; b.rotation.z = k * ((f.angry ?? 0) * 0.35 - (f.sad ?? 0) * 0.3); });
  if (f.lid != null) u.lidOpen = f.lid;
}
// sentado no chão / ajoelhado
function sitPose(p, k = 1, o = {}) {
  const u = p.userData;
  pose(p, { hipsPos: [0, -(u.d.hipY - (o.seatY ?? 0.18)), 0], legR: [-1.45, 0.12, -0.05, 1.5, -0.2], legL: [-1.45, -0.12, 0.05, 1.5, -0.2], spine: [o.lean ?? -0.12, 0, 0] }, k);
}
function kneelPose(p, k = 1) {
  const u = p.userData;
  pose(p, { hipsPos: [0, -(u.d.thigh + 0.02), -0.15], legR: [0.1, 0, 0, 1.6, 0.6], legL: [0.1, 0, 0, 1.6, 0.6], spine: [0.35, 0, 0], chest: [0.15, 0, 0], neck: [0.25, 0, 0] }, k);
}
// tapa-olho: 0 = cobrindo, 1 = levantado na testa
function liftPatch(p, k) { const pt = p.userData.patch; if (pt) pt.rotation.x = -k * 2.1; }
// capa balançando ao vento
function clothWind(p, t, wind = 1) {
  const u = p.userData;
  [...(u.tails || []), ...(u.scarfTails || [])].forEach((m, j) => { const a = m.geometry.attributes.position, b = m.userData.base; for (let i = 0; i < a.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], k = -y * 2; a.setXYZ(i, x + Math.sin(t * 3.1 + y * 6 + j) * 0.012 * k * wind, y + k * k * 0.01 * wind, b[i * 3 + 2] - k * k * 0.05 * wind - Math.sin(t * 4.3 + x * 9 + y * 7 + j * 2) * 0.03 * k * wind); } a.needsUpdate = true; m.geometry.computeVertexNormals(); });
  cloakWind(p, t, wind);
}
function cloakWind(p, t, wind = 1) {
  const c = p.userData.cloak; if (!c) return;
  const a = c.geometry.attributes.position, b = c.userData.base;
  for (let i = 0; i < a.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], k = -y; a.setXYZ(i, x + Math.sin(t * 2.3 + y * 4) * 0.02 * k * wind, y, b[i * 3 + 2] - k * k * 0.12 * wind - Math.sin(t * 3.1 + x * 6 + y * 5) * 0.04 * k * wind); }
  a.needsUpdate = true; c.geometry.computeVertexNormals();
}

// ---------------------------------------------------------------- material holográfico (raio-X)
const HOLO_T = { value: 0 };
function holoMat(color = 0x5ad8ff, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uT: HOLO_T, uA: { value: o.alpha ?? 1 } },
    vertexShader: "varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vV = -mv.xyz; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform vec3 uC; uniform float uT, uA; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); float sl = 0.65 + 0.35 * step(0.5, fract(vW.y * 6.0 - uT * 1.5)); gl_FragColor = vec4(uC * (0.06 + f * 1.6) * sl * uA, 1.0); }",
    transparent: true, depthWrite: false, blending: ADD, side: THREE.DoubleSide,
  });
}
function holoify(obj, mat) { obj.traverse((c) => { if (c.isMesh) { if (c.userData.isOutline) c.visible = false; else { c.material = mat; c.castShadow = false; c.receiveShadow = false; } } }); return obj; }

// ---------------------------------------------------------------- gigante (criatura original: pele pálida manchada, pano na cintura, sorriso vazio)
const GIG = { hipY: 0.9, spine: 0.1, chest: 0.21, neckY: 0.265, headY: 0.012, shW: 0.21, shY: 0.24, upper: 0.36, fore: 0.33, hipW: 0.1, thigh: 0.4, shin: 0.42, headS: 1.58 };
const GTEX = {};
function giantSkinTex(base, seed = 0) {
  const k = base + "_" + seed; if (GTEX[k]) return GTEX[k];
  const b = hex2rgb(base), dark = mixc(b, [150, 70, 60], 0.35), pale = mixc(b, [255, 240, 230], 0.25);
  GTEX[k] = texPair(512, (u, v) => fbm2(u * 8 + seed, v * 8, 4, 8) * 0.7 + fbm2(u * 32, v * 32 + seed, 3, 32) * 0.3,
    (u, v, h) => { const bl = fbm2(u * 4 + 7 + seed, v * 4 + 3, 4, 4); let c = mixc(b, dark, clamp((bl - 0.5) * 2.4)); c = mixc(c, pale, clamp((0.45 - bl) * 2)); const vein = Math.abs(fbm2(u * 6 + seed, v * 6 + 9, 4, 6) - 0.5) < 0.012 ? 0.12 : 0; c = mixc(c, [130, 120, 160], vein); return mixc(c, [0, 0, 0], (0.5 - h) * 0.12); }, 2.2, { rep: [2, 2] });
  return GTEX[k];
}
// rosto pintado (UV da esfera: frente em u=0.25): sombras dos olhos, nariz, vincos, sorriso com dentes; open 0..1
const GFACE = {};
function giantFaceTex(base, open = 0, o = {}) {
  const k = base + "_" + open + "_" + (o.sleep ? 1 : 0) + "_" + (o.wide ?? 1); if (GFACE[k]) return GFACE[k];
  const Wd = 2048, Hd = 1024, px = (ph) => (0.25 + ph / 360) * Wd, py = (th) => (th / 180) * Hd;
  const b = hex2rgb(base), css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  return (GFACE[k] = canvasTex(Wd, Hd, (c) => {
    c.fillStyle = css(b); c.fillRect(0, 0, Wd, Hd);
    for (let i = 0; i < 900; i++) { const r = 6 + hash(i * 3.1) * 40; c.fillStyle = css(mixc(b, hash(i) > 0.5 ? [170, 80, 70] : [255, 236, 222], 0.5), 0.05 + hash(i * 7) * 0.06); c.beginPath(); c.arc(hash(i * 5.3) * Wd, hash(i * 9.7) * Hd, r, 0, 7); c.fill(); }
    const rg = (x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, css(col, a)); g.addColorStop(1, css(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
    // olheiras e sombra da testa sobre os olhos
    [-1, 1].forEach((s) => { rg(px(s * 25), py(86), 95, [90, 40, 44], 0.42); rg(px(s * 25), py(92), 70, [120, 50, 60], 0.25); rg(px(s * 33), py(108), 90, [220, 110, 100], 0.18); });
    rg(px(0), py(70), 160, [255, 240, 230], 0.12);
    // rugas da testa
    c.strokeStyle = css(mixc(b, [90, 50, 50], 0.6), 0.35); c.lineWidth = 3;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(px(-26), py(66 + i * 3.2)); c.quadraticCurveTo(px(0), py(64.5 + i * 3.2), px(26), py(66 + i * 3.2)); c.stroke(); }
    // sobrancelhas ralas
    c.strokeStyle = css([70, 46, 36], 0.75); c.lineWidth = 2.5;
    [-1, 1].forEach((s) => { for (let i = 0; i < 26; i++) { const u = i / 25, ph = s * (14 + u * 22), th = 77 - Math.sin(u * Math.PI) * 2.2 + (hash(i * 3 + s) - 0.5); c.beginPath(); c.moveTo(px(ph), py(th + 1.2)); c.lineTo(px(ph + s * 2.4), py(th - 0.6)); c.stroke(); } });
    // nariz: luz no dorso, sombras nas laterais, narinas suaves
    const ng = c.createLinearGradient(px(-7), 0, px(7), 0); ng.addColorStop(0, css([150, 80, 70], 0.0)); ng.addColorStop(0.3, css([150, 80, 70], 0.28)); ng.addColorStop(0.5, css([255, 240, 228], 0.25)); ng.addColorStop(0.7, css([150, 80, 70], 0.28)); ng.addColorStop(1, css([150, 80, 70], 0.0));
    c.fillStyle = ng; c.fillRect(px(-7), py(86), px(7) - px(-7), py(103) - py(86));
    [-1, 1].forEach((s) => { c.fillStyle = css([90, 36, 36], 0.55); c.beginPath(); c.ellipse(px(s * 4.2), py(104.5), 13, 7, s * 0.4, 0, 7); c.fill(); rg(px(s * 8), py(102), 26, [160, 80, 72], 0.4); });
    // vincos do sorriso
    const W_ = o.wide ?? 1, cx0 = 40 * W_, cth = o.sleep ? 121 : 114;
    c.strokeStyle = css([110, 50, 50], 0.45); c.lineWidth = 5;
    [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(px(s * 10), py(103)); c.quadraticCurveTo(px(s * (cx0 - 6)), py(104), px(s * (cx0 + 3)), py(cth + 1)); c.stroke(); });
    // boca: lábios, interior escuro, dentes
    const up = (u) => py(cth + (1 - u * u) * 8.5), lo = (u) => py(cth + (1 - u * u) * (9.5 + open * 9 + (o.sleep ? -6 : 0)) + 1.5 + open * 2);
    const N = 40, P = (f) => { const pts = []; for (let i = 0; i <= N; i++) { const u = i / N * 2 - 1; pts.push([px(u * cx0), f(Math.abs(u))]); } return pts; };
    const pu = P(up), pl = P(lo);
    c.fillStyle = css([36, 8, 12], 1); c.beginPath(); pu.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); pl.slice().reverse().forEach(([x, y]) => c.lineTo(x, y)); c.closePath(); c.fill();
    if (!o.sleep) {
      c.save(); c.clip();
      const tooth = (x, y, w, h, dir) => { const g = c.createLinearGradient(0, y, 0, y + h * dir); g.addColorStop(0, "#fffaf0"); g.addColorStop(1, "#c8b898"); c.fillStyle = g; c.beginPath(); c.roundRect(x - w / 2, Math.min(y, y + h * dir), w, h, 5); c.fill(); };
      const nt = 18;
      for (let i = 0; i < nt; i++) { const u = (i + 0.5) / nt * 2 - 1, x = px(u * cx0 * 0.97), y = up(Math.abs(u)) - 4, w = (px(cx0) - px(-cx0)) / nt * 0.9; tooth(x, y, w, 30 - Math.abs(u) * 10, 1); }
      for (let i = 0; i < nt - 2; i++) { const u = (i + 0.5) / (nt - 2) * 2 - 1, x = px(u * cx0 * 0.9), y = lo(Math.abs(u)) + 4, w = (px(cx0) - px(-cx0)) / nt * 0.85; tooth(x, y, w, 18 + open * 8 - Math.abs(u) * 6, -1); }
      c.restore();
    }
    c.lineWidth = 9; c.strokeStyle = css([176, 96, 92], 1); c.beginPath(); pu.forEach(([x, y], i) => (i ? c.lineTo(x, y - 3) : c.moveTo(x, y - 3))); c.stroke();
    c.lineWidth = 12; c.strokeStyle = css([186, 106, 100], 1); c.beginPath(); pl.forEach(([x, y], i) => (i ? c.lineTo(x, y + 4) : c.moveTo(x, y + 4))); c.stroke();
    c.lineWidth = 3; c.strokeStyle = css([255, 210, 200], 0.5); c.beginPath(); pl.forEach(([x, y], i) => (i ? c.lineTo(x, y + 8) : c.moveTo(x, y + 8))); c.stroke();
    rg(px(0), py(cth + 22), 70, [140, 70, 66], 0.3);
  }));
}
function gigante(o = {}) {
  const v = o.tipo ?? "careca";
  const D = { ...GIG, ...(v === "magro" ? { hipY: 1.02, upper: 0.42, fore: 0.4, thigh: 0.46, shin: 0.48, shW: 0.19, neckY: 0.31, headS: 1.25 } : v === "gordo" ? { hipY: 0.78, thigh: 0.34, shin: 0.36, hipW: 0.13, shW: 0.25, upper: 0.32, fore: 0.3, headS: 1.6 } : {}), ...(o.dims || {}) };
  const S = skeleton(D), hs = D.headS, fat = v === "gordo" ? 1.35 : v === "magro" ? 0.74 : 1;
  const tx = giantSkinTex(o.skin ?? 0xe6b49a, o.seed ?? 0);
  const skinM = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tx.map, normalMap: tx.normalMap, normalScale: new THREE.Vector2(1.0, 1.0), roughness: 0.55, emissive: 0x4a1008, emissiveIntensity: 0.28 });
  const L = (prof, parent, y = 0, segs = 26) => mesh(lathe(prof.map(([r, yy]) => [Math.max(0.0008, r), yy]), segs), skinM, 0, y, 0, parent);
  // quadril, pano (com dobras) e pernas musculosas
  mesh(sph(1, 24, 18), skinM, 0, -0.01, 0, S.hips).scale.set(0.175 * fat, 0.14, 0.135 * fat);
  const clothM = new THREE.MeshStandardMaterial({ color: o.cloth ?? 0x6b5a48, roughness: 0.95, side: THREE.DoubleSide });
  const skirt = lathe([[0.18 * fat, 0.07], [0.188 * fat, -0.02], [0.205 * fat, -0.15], [0.212 * fat, -0.22]], 48);
  deform(skirt, (q) => { const a = Math.atan2(q.x, q.z), k = clamp((0.07 - q.y) / 0.29); const f = 1 + Math.sin(a * 9) * 0.05 * k; q.x *= f; q.z *= f * 0.86; if (Math.abs(Math.sin(a)) > 0.8) q.y += k * 0.06; });
  mesh(skirt, clothM, 0, 0, 0, S.hips);
  const rope = mesh(new THREE.TorusGeometry(0.182 * fat, 0.013, 6, 30), SM(0x4a3a2a), 0, 0.065, 0, S.hips); rope.rotation.x = Math.PI / 2; rope.scale.set(1, 0.86, 1);
  const T_ = D.thigh, Sh = D.shin;
  S.hipJ.forEach((hj, i) => {
    L([[0.001, -T_ - 0.07], [0.05 * fat, -T_ - 0.05], [0.062 * fat, -T_ - 0.01], [0.074 * fat, -T_ * 0.8], [0.094 * fat, -T_ * 0.4], [0.1 * fat, -T_ * 0.15], [0.092 * fat, 0.03], [0.05, 0.085], [0.001, 0.1]], hj);
    L([[0.001, -Sh - 0.03], [0.042 * fat, -Sh], [0.046 * fat, -Sh * 0.8], [0.066 * fat, -Sh * 0.38], [0.068 * fat, -Sh * 0.18], [0.06 * fat, 0.0], [0.05 * fat, 0.05], [0.001, 0.08]], S.knee[i]);
    mesh(sph(0.05 * fat, 14, 10), skinM, 0, -Sh * 0.3, -0.03 * fat, S.knee[i]).scale.set(1, 1.6, 1);
    const ft = mesh(cap(0.058, 0.16, 4, 14), skinM, 0, -0.03, 0.07, S.ankle[i]); ft.rotation.x = Math.PI / 2; ft.scale.set(1.2, 1, 0.6);
    mesh(sph(0.048, 12, 10), skinM, 0, -0.01, -0.01, S.ankle[i]);
    for (let k = 0; k < 5; k++) mesh(sph(0.019 - k * 0.0016, 8, 6), skinM, (k - 2) * 0.023 * (i ? -1 : 1), -0.052, 0.168 - Math.abs(k - 1.5) * 0.008, S.ankle[i]);
  });
  // tronco: abdômen, peito largo, trapézio e ombros que se fundem aos braços
  const abd = L([[0.001, -0.07], [0.155 * fat, -0.07], [0.165 * fat, 0.03], [0.152 * fat, 0.12], [0.155 * (v === "magro" ? 0.8 : 1), 0.22], [0.001, 0.22]], S.spine, 0, 30); abd.scale.z = 0.78;
  if (v === "gordo") { mesh(sph(0.21, 28, 20), skinM, 0, 0.03, 0.07, S.spine).scale.set(1.05, 0.95, 0.9); mesh(sph(0.009, 8, 6), SM(0x8a5048), 0, 0.02, 0.258, S.spine); }
  const cw = v === "magro" ? 0.84 : 1;
  const ch = L([[0.001, -0.03], [0.152 * cw, -0.03], [0.172 * cw, 0.07], [0.195 * cw, 0.16], [0.19 * cw, 0.22], [0.165 * cw, 0.27], [0.1, 0.305], [0.001, 0.315]], S.chest, 0, 30); ch.scale.z = 0.72;
  [-1, 1].forEach((k) => {
    mesh(sph(0.088, 18, 12), skinM, k * 0.07 * cw, 0.175, 0.058 * cw, S.chest).scale.set(1.45, 0.7, 0.3);
    mesh(sph(0.075, 16, 12), skinM, k * 0.095, 0.29, -0.015, S.chest).scale.set(1.35, 0.75, 0.95);
    mesh(sph(0.09, 16, 12), skinM, k * 0.08, 0.12, -0.075, S.chest).scale.set(1.1, 1.3, 0.55);
  });
  if (v === "magro") for (let r = 0; r < 4; r++) { const rib = mesh(new THREE.TorusGeometry(0.14, 0.006, 5, 24, Math.PI * 0.9), skinM, 0, 0.03 + r * 0.045, 0.0, S.chest); rib.rotation.set(Math.PI / 2, 0, Math.PI * 0.05); rib.scale.set(1, 0.72, 1); }
  // braços e mãos grandes
  const U = D.upper, F = D.fore;
  const hands = S.sh.map((sh, i) => {
    mesh(sph(0.082 * fat, 18, 14), skinM, 0, -0.012, 0, sh).scale.set(1, 1.05, 0.95);
    L([[0.001, -U - 0.06], [0.036 * fat, -U - 0.04], [0.046 * fat, -U], [0.05 * fat, -U * 0.85], [0.062 * fat, -U * 0.55], [0.064 * fat, -U * 0.35], [0.07 * fat, -U * 0.12], [0.062 * fat, 0.01], [0.001, 0.05]], sh);
    L([[0.001, -F - 0.02], [0.034 * fat, -F], [0.038 * fat, -F * 0.8], [0.053 * fat, -F * 0.35], [0.056 * fat, -F * 0.15], [0.05 * fat, 0.0], [0.04 * fat, 0.04], [0.001, 0.065]], S.el[i]);
    return hand(S.wr[i], i ? 1 : -1, skinM, 1.6, true);
  });
  // pescoço e cabeça (grande)
  const nk = v === "gordo" ? 1.3 : 1;
  L([[0.001, -0.02], [0.08 * nk, -0.02], [0.068 * nk, 0.05], [0.064 * nk, 0.12], [0.001, 0.14]], S.neck, 0, 20);
  const hg = headGeo({ sx: 0.078 * hs * (v === "gordo" ? 1.12 : 1), sy: 0.106 * hs, sz: 0.096 * hs, cy: 0.11 * hs, jaw: v === "gordo" ? 0.05 : v === "magro" ? 0.35 : 0.18, chin: 0.06, cheek: v === "gordo" ? 0.2 : 0.06 });
  const faces = [0, 0.5, 1].map((op) => giantFaceTex(o.skin ?? 0xe6b49a, op, { wide: v === "gordo" ? 1.1 : 1 }));
  const faceSleep = giantFaceTex(o.skin ?? 0xe6b49a, 0, { sleep: true });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: faces[0], normalMap: tx.normalMap, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.55, emissive: 0x4a1008, emissiveIntensity: 0.28 });
  const headM = mesh(hg, headMat, 0, 0, 0);
  const zAt = (x, y) => surfZ(headM, x, y);
  S.head.add(headM);
  const er = 0.0165 * hs * (v === "gordo" ? 0.8 : v === "magro" ? 1.15 : 1), ex = 0.033 * hs, ey = 0.12 * hs;
  const eyeOpen = v === "careca" ? 0.05 : v === "magro" ? -0.75 : -0.15;
  const eyes = [-1, 1].map((k) => eye(S.head, k * ex, ey, zAt(k * ex, ey) - er * (v === "magro" ? 0.45 : 0.62), er, { iris: o.iris ?? 0x8a7a6a, irisA: 0.5, pupilA: v === "magro" ? 0.1 : 0.16, skin: 0xe6b49a, lid: o.skin ?? 0xe6b49a, open: eyeOpen, white: 0xf2ead8, lashCol: 0x3a1a18 }));
  const brows = [];
  const nz = zAt(0, 0.092 * hs);
  const nose = mesh(sph(1, 18, 14), skinM, 0, 0.09 * hs, nz - 0.005 * hs, S.head); nose.scale.set(0.0125 * hs, 0.019 * hs, 0.012 * hs);
  [-1, 1].forEach((k) => { const ear = mesh(sph(1, 12, 10), skinM, k * 0.079 * hs * (v === "gordo" ? 1.1 : 1), 0.11 * hs, -0.005, S.head); ear.scale.set(0.012 * hs, 0.03 * hs, 0.02 * hs); });
  // cabelo: careca (nada), magro (fios ralos longos), gordo (curto)
  if (v === "magro") hairLocks(S.head, { color: o.hair ?? 0x3a2a20, style: "longo", n: 34, thick: 0.012 * hs, cx: 0, cy: 0.11 * hs, ax: 0.078 * hs, ay: 0.106 * hs, az: 0.096 * hs, capA: 0.3, seed: o.seed ?? 1, len: 1.6, bangY: 0.05 * hs });
  if (v === "gordo") hairLocks(S.head, { color: o.hair ?? 0x6a4a30, style: "curto", n: 40, thick: 0.02 * hs, cy: 0.11 * hs, ax: 0.078 * hs * 1.12, ay: 0.106 * hs, az: 0.096 * hs, capA: 0.36, seed: o.seed ?? 2, len: 1.3, bangY: 0.045 * hs });
  S.root.scale.setScalar(o.scale ?? 7);
  shadows(S.root);
  S.root.userData = { ...S, eyes, brows, mouth: null, gface: { mat: headMat, faces, sleep: faceSleep }, hands, headM, kind: "gigante", tipo: v, lidOpen: 1 };
  restPose(S.root);
  return S.root;
}
// boca do gigante: open 0..1 (mordida), grin estica
function giantMouth(p, open = 0, sleep = false) { const f = p.userData.gface; const tx = sleep ? f.sleep : f.faces[Math.round(clamp(open) * 2)]; if (f.mat.map !== tx) { f.mat.map = tx; } }
// caminhada pesada de gigante (balanço lento, braços soltos, cabeça torta)
function giantWalk(p, ph, t, amt = 1, o = {}) {
  walk(p, ph, amt, { stride: o.stride ?? 0.85, arms: o.arms ?? 0.45, bob: 1.6, lean: o.lean ?? 0.08 });
  const u = p.userData, a = ph * Math.PI * 2;
  u.hips.rotation.z = Math.cos(a) * 0.07 * amt; u.chest.rotation.z = -Math.cos(a) * 0.05 * amt;
  u.neck.rotation.z = fbm1(t * 0.25 + (o.seed ?? 0)) * 0.35 + (o.tilt ?? 0.15); u.head.rotation.x = 0.05 + fbm1(t * 0.3 + 4) * 0.12;
  u.sh[0].rotation.z = -0.12 - 0.06 * Math.max(0, Math.sin(a)); u.sh[1].rotation.z = 0.12 + 0.06 * Math.max(0, -Math.sin(a));
  u.el[0].rotation.x = -0.15 + Math.sin(a + 0.8) * 0.12; u.el[1].rotation.x = -0.15 - Math.sin(a + 0.8) * 0.12;
  if (u.hands) u.hands.forEach((h, i) => curlHand(h, 0.35 + 0.15 * Math.sin(a + i * 3)));
}
// pé que está no chão (para poeira e tremor): devolve 0 ou 1 e o instante do apoio
function footDown(ph) { const f = ((ph % 1) + 1) % 1; return f < 0.5 ? 1 : 0; }

// ---------------------------------------------------------------- animais (cavalo e vaca originais)
const cowTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#f4f1ea"; c.fillRect(0, 0, w, h); c.fillStyle = "#1c1816"; for (let i = 0; i < 9; i++) { c.beginPath(); const x = hash(i * 3) * w, y = hash(i * 7) * h, r = 18 + hash(i * 11) * 30; for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI * 2, rr = r * (0.7 + hash(i * 13 + k) * 0.5); k ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); } });
function quadrupede(o = {}) {
  const vaca = o.tipo === "vaca";
  const C = vaca ? { len: 0.9, r: 0.33, legH: 0.6, neckL: 0.36, headL: 0.36, col: 0xffffff } : { len: 0.95, r: 0.27, legH: 0.88, neckL: 0.66, headL: 0.5, col: o.col ?? 0x7a4a2a };
  const root = new THREE.Group(), body = grp(root, 0, C.legH + C.r * 0.75, 0);
  const bm = vaca ? TM(0xffffff, { map: cowTex }) : TM(C.col), dark = TM(o.mane ?? (vaca ? 0x1c1816 : 0x2a1a10));
  const OL = (m) => ol(m, 0.006, 0x1a1210);
  const tor = OL(mesh(cap(C.r, C.len, 6, 16), bm, 0, 0, 0, body)); tor.rotation.x = Math.PI / 2; tor.scale.set(1, 1, vaca ? 1.05 : 0.95);
  const neck = grp(body, 0, C.r * 0.35, C.len / 2 + C.r * 0.45); neck.rotation.x = vaca ? 1.0 : 0.62;
  OL(mesh(cap(C.r * (vaca ? 0.55 : 0.42), C.neckL, 4, 12), bm, 0, C.neckL / 2, 0, neck));
  const head = grp(neck, 0, C.neckL, 0); head.rotation.x = vaca ? 0.9 : 1.45;
  const hm = OL(mesh(cap(C.r * (vaca ? 0.42 : 0.3), C.headL, 4, 12), bm, 0, C.headL * 0.45, 0.02, head)); hm.scale.set(1, 1, vaca ? 1.1 : 1.15);
  mesh(sph(C.r * (vaca ? 0.4 : 0.27), 12, 10), TM(vaca ? 0xe8b8a8 : 0x3a2618), 0, C.headL * 0.95, 0.02, head);
  [-1, 1].forEach((k) => { mesh(sph(C.r * 0.07, 8, 6), BM(0x0a0608), k * C.r * (vaca ? 0.38 : 0.27), C.headL * 0.25, C.r * 0.12, head); const ear = mesh(new THREE.ConeGeometry(C.r * 0.09, C.r * 0.28, 8), bm, k * C.r * 0.24, C.headL * 0.02, -C.r * 0.1, head); ear.rotation.set(-0.5, 0, -k * 0.6); if (vaca) { const hn = mesh(new THREE.ConeGeometry(C.r * 0.05, C.r * 0.3, 8), TM(0xe8dcc0), k * C.r * 0.2, -C.headL * 0.02, -C.r * 0.18, head); hn.rotation.z = -k * 1.1; } });
  if (!vaca) for (let i = 0; i < 9; i++) { const y = (i / 8) * C.neckL; mesh(lockGeo([[0, y, -C.r * 0.36], [0, y + 0.04, -C.r * 0.55], [0.02 * (i % 2 ? 1 : -1), y - 0.05, -C.r * 0.62]], 0.035, 0.005, 0.5, 6, 6), dark, 0, 0, 0, neck); }
  const tail = grp(body, 0, C.r * 0.3, -C.len / 2 - C.r * 0.7); mesh(lockGeo([[0, 0, 0], [0, -0.1, -0.08], [0, -0.35, -0.1], [0, vaca ? -0.62 : -0.55, -0.06]], vaca ? 0.02 : 0.05, vaca ? 0.04 : 0.012, 0.8, 10, 7), dark, 0, 0, 0, tail);
  const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    const l = grp(body, sx * C.r * 0.55, -C.r * 0.4, sz * C.len * 0.45);
    OL(mesh(cap(C.r * 0.2, C.legH * 0.4, 4, 10), bm, 0, -C.legH * 0.25, 0, l));
    const k = grp(l, 0, -C.legH * 0.5, 0); OL(mesh(cap(C.r * 0.13, C.legH * 0.38, 4, 10), bm, 0, -C.legH * 0.25, 0, k));
    mesh(cyl(C.r * 0.16, C.r * 0.18, C.r * 0.2, 10), TM(0x1a1210), 0, -C.legH * 0.5 + C.r * 0.05, 0, k);
    return { l, k };
  });
  shadows(root);
  root.userData = { body, neck, head, tail, legs, vaca, C, n0: neck.rotation.x, h0: head.rotation.x };
  return root;
}
// pastar (k 0..1 abaixa o pescoço), rabo e passo
function animalAnim(a, t, graze = 0, step = 0, seed = 0) {
  const u = a.userData;
  u.neck.rotation.x = lerp(u.n0, u.vaca ? 2.0 : 2.15, graze) + Math.sin(t * 0.8 + seed) * 0.04;
  u.head.rotation.x = lerp(u.h0, 0.75, graze) + (graze > 0.5 ? Math.sin(t * 6 + seed) * 0.05 : 0);
  u.tail.rotation.set(Math.sin(t * 1.3 + seed) * 0.15, 0, Math.sin(t * 2.1 + seed * 2) * 0.35);
  u.legs.forEach((lg, i) => { const ph = t * 4 + (i === 0 || i === 3 ? 0 : Math.PI); lg.l.rotation.x = Math.sin(ph) * 0.35 * step; lg.k.rotation.x = Math.max(0, Math.cos(ph)) * 0.6 * step * (i < 2 ? -1 : 1); });
  u.body.position.y = u.C.legH + u.C.r * 0.75 + Math.abs(Math.sin(t * 4)) * 0.02 * step;
}

// ---------------------------------------------------------------- animação v3: andar sem deslizar, gestos com antecipação e acomodação
// curva de gesto: recua um pouco (antecipação), vai, passa do ponto e acomoda
function act(t, t0, t1, ant = 0.12, over = 0.08) {
  const u = seg(t, t0, t1);
  if (u <= 0) return 0;
  if (u < 0.22) return -ant * Math.sin((u / 0.22) * Math.PI);
  if (u < 0.75) return E.inOut((u - 0.22) / 0.53) * (1 + over);
  const s = (u - 0.75) / 0.25; return 1 + over * Math.cos(s * Math.PI * 1.5) * (1 - s);
}
// andar com os pés plantados: o corpo percorre `dist` metros a partir de `from` na direção `ang` (rad, 0 = +z);
// cada pé fica parado no chão durante o apoio e voa em arco na troca. hf(x,z) = altura do chão. run = corrida.
const _gq = new THREE.Quaternion(), _gq2 = new THREE.Quaternion(), _gE = new THREE.Euler();
function gait(p, dist, o = {}) {
  const u = p.userData, sc = p.scale.x, from = o.from ?? [0, 0, 0], hf = o.hf ?? (() => from[1]), hb = o.hb ?? hf;
  const a0 = o.ang ?? 0, PT = o.path ?? ((d) => [from[0] + Math.sin(a0) * d, from[2] + Math.cos(a0) * d, a0]);
  const run = o.run ?? 0, L = (o.step ?? (0.55 + run * 0.35)) * sc, stance = 0.62 - run * 0.24, lift = (o.lift ?? (0.09 + run * 0.12)) * sc;
  const [px, pz, ang] = PT(dist);
  const cyc = dist / (2 * L);
  // corpo: sobe e desce duas vezes por ciclo, balança de lado, inclina na corrida
  const ph = cyc * Math.PI * 2, bob = (Math.cos(2 * ph) * (0.016 + run * 0.03) - 0.035 - run * 0.05 - (o.crouch ?? 0)) * sc * (o.amt ?? 1);
  p.position.set(px, hb(px, pz), pz); p.rotation.set(0, ang, 0);
  u.hips.position.y = u.d.hipY + bob / sc; u.hips.position.x = Math.sin(ph) * 0.018 * (1 - run * 0.5);
  u.hips.rotation.set(0.06 * run + (o.lean ?? 0), Math.sin(ph) * (0.1 + run * 0.08), Math.cos(ph) * 0.03);
  u.spine.rotation.x = 0.1 * run + (o.lean ?? 0) * 0.6; u.chest.rotation.y = -Math.sin(ph) * (0.14 + run * 0.1);
  u.head.rotation.y = Math.sin(ph) * 0.05; u.neck.rotation.x = -0.06 * run - (o.lean ?? 0) * 0.5;
  p.updateMatrixWorld(true);
  const feet = [];
  [0, 1].forEach((i) => {
    const off = i * L, dd = dist - off + L * 0.5; // pé i planta à frente do corpo
    const k = Math.floor(dd / (2 * L)), uu = dd / (2 * L) - k;
    const plant = (kk) => off + kk * 2 * L - 0.5 * L + stance * L;
    const side = (i ? 1 : -1) * u.d.hipW * sc;
    const at = (d) => { const q = PT(d); return [q[0] + Math.cos(q[2]) * side, q[1] - Math.sin(q[2]) * side, q[2]]; };
    let fx, fz, fa, fy, toe = 0;
    if (uu < stance) { [fx, fz, fa] = at(plant(k)); fy = hf(fx, fz); toe = Math.max(0, (uu - stance + 0.12) / 0.12) * 0.5; }
    else {
      const s = E.inOut((uu - stance) / (1 - stance)), A = at(plant(k)), B = at(plant(k + 1));
      fx = lerp(A[0], B[0], s); fz = lerp(A[1], B[1], s); fa = lerp(A[2], B[2], s);
      const hA = hf(A[0], A[1]), hB = hf(B[0], B[1]);
      fy = lerp(hA, hB, sm(s)) + Math.sin(s * Math.PI) * (lift + Math.abs(hB - hA) * 0.6);
      toe = (1 - s) * 0.4 - Math.sin(s * Math.PI) * 0.15;
    }
    feet.push([fx, fy, fz]);
    const pole = V3_(fx + Math.sin(fa) * 1.2, fy + 0.6 * sc, fz + Math.cos(fa) * 1.2);
    legIK(p, i, V3_(fx, fy, fz), pole);
    // pé paralelo ao chão (só o giro), com o rolar do calcanhar para a ponta
    u.knee[i].updateMatrixWorld(true); u.knee[i].getWorldQuaternion(_gq); _gq.invert();
    _gq2.setFromEuler(_gE.set(-toe, fa + (p.parent ? 0 : 0), 0, "YXZ"));
    u.ankle[i].quaternion.copy(_gq.multiply(_gq2));
  });
  // braços opostos às pernas, cotovelo mais dobrado na corrida
  const arm = (0.34 + run * 0.5) * (o.arms ?? 1);
  u.sh[0].rotation.set(Math.sin(ph) * arm, 0, -0.08 - run * 0.08); u.sh[1].rotation.set(-Math.sin(ph) * arm, 0, 0.08 + run * 0.08);
  u.el[0].rotation.x = -0.25 - run * 1.1 - 0.2 * Math.max(0, -Math.sin(ph)); u.el[1].rotation.x = -0.25 - run * 1.1 - 0.2 * Math.max(0, Math.sin(ph));
  if (u.hands && run > 0.3) u.hands.forEach((h) => curlHand(h, 0.7));
  return { pos: [px, hb(px, pz), pz], feet, phase: ph, ang };
}
// distância (perto de d) em que os dois pés estão no chão: para parar de andar sem deslizar
function gaitStop(d, step = 0.55, run = 0) { const L = step, st = 0.62 - run * 0.24, k = Math.round((d + 0.5 * L) / (2 * L) - (st - 0.06)); return (k + st - 0.06) * 2 * L - 0.5 * L; }
// passada ajustada para parar exatamente na distância d com os dois pés no chão: devolve o comprimento do passo
function gaitFit(d, L0 = 0.55, run = 0) { const st = 0.62 - run * 0.24, c = 2 * (st - 0.06) - 0.5; let best = L0, err = 1e9; for (let k = 0; k < 40; k++) { const L = d / (2 * k + c); if (L <= 0) continue; const e = Math.abs(L - L0); if (e < err) { err = e; best = L; } } return best; }
// caminho em arco de círculo (centro, raio, ângulo inicial, sentido): devolve função d -> [x, z, rumo]
function arcPath(cx, cz, r, a0, dir = 1) { return (d) => { const a = a0 + (dir * d) / r; return [cx + Math.sin(a) * r, cz + Math.cos(a) * r, a + (dir > 0 ? Math.PI / 2 : -Math.PI / 2)]; }; }
// inércia do cabelo: inclina as mechas contra a aceleração (ax lateral, az para frente, no referencial do corpo)
function hairPush(p, ax = 0, az = 0, up = 0) { const hg = p.userData.head.userData.hairG; if (!hg) return; const k = p.userData.head.userData.hairLong ? 1.6 : 1; hg.rotation.x += clamp(az, -1.5, 1.5) * 0.08 * k + up * 0.05; hg.rotation.z += clamp(-ax, -1.5, 1.5) * 0.08 * k; }
const V3_ = (x, y, z) => new THREE.Vector3(x, y, z);
// ficar de pé parado com os pés plantados (sem deslizar depois de andar)
function standFeet(p, o = {}) {
  const u = p.userData, sc = p.scale.x, ang = p.rotation.y, hf = o.hf ?? (() => p.position.y);
  const sx = Math.cos(ang), sz = -Math.sin(ang), dx = Math.sin(ang), dz = Math.cos(ang);
  p.updateMatrixWorld(true);
  [0, 1].forEach((i) => {
    const side = (i ? 1 : -1) * (u.d.hipW + 0.02) * sc, fwd = (i ? 0.06 : -0.04) * sc * (o.spread ?? 1);
    const fx = p.position.x + sx * side + dx * fwd, fz = p.position.z + sz * side + dz * fwd, fy = hf(fx, fz);
    legIK(p, i, V3_(fx, fy, fz), V3_(fx + dx, fy + 0.6 * sc, fz + dz));
    u.knee[i].updateMatrixWorld(true); u.knee[i].getWorldQuaternion(_gq); _gq.invert(); _gq2.setFromEuler(_gE.set(0, ang + (i ? 0.12 : -0.12), 0, "YXZ")); u.ankle[i].quaternion.copy(_gq.multiply(_gq2));
  });
}
// rastro de movimento: cópias fantasma de um objeto em instantes anteriores (para golpes rápidos e voltar no tempo)
function ghostTrail(g, n, mat) {
  const gs = [];
  for (let i = 0; i < n; i++) { const m = mat.clone(); m.transparent = true; m.depthWrite = false; m.opacity = 0; gs.push(m); }
  return gs;
}
// espírito guardião dourado (original): corpo de luz dourada, rosto liso com um sol na testa
const sunEmblem = canvasTex(128, 128, (c, w) => { const r = w / 2; c.clearRect(0, 0, w, w); c.fillStyle = "#fff6d0"; c.beginPath(); c.arc(r, r, r * 0.26, 0, 7); c.fill(); c.strokeStyle = "#fff6d0"; c.lineWidth = 7; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.beginPath(); c.moveTo(r + Math.cos(a) * r * 0.36, r + Math.sin(a) * r * 0.36); c.lineTo(r + Math.cos(a) * r * (i % 2 ? 0.7 : 0.9), r + Math.sin(a) * r * (i % 2 ? 0.7 : 0.9)); c.stroke(); } });
const plateTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#000"; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 2.5;
  [0.02, 0.36, 0.69].forEach((x) => { c.beginPath(); for (let y = 0; y <= h; y += 8) { const xx = x * w + Math.sin(y * 0.05 + x * 9) * 4; y ? c.lineTo(xx, y) : c.moveTo(xx, y); } c.stroke(); });
  c.lineWidth = 2; [0.12, 0.88].forEach((y) => { c.beginPath(); c.moveTo(0, y * h); c.lineTo(w, y * h); c.stroke(); });
  c.fillStyle = "#fff"; [[0.19, 0.5], [0.52, 0.5], [0.85, 0.5]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x * w, y * h - 9); c.lineTo(x * w + 5, y * h); c.lineTo(x * w, y * h + 9); c.lineTo(x * w - 5, y * h); c.closePath(); c.fill(); }); }, { linear: true });
// reflexo quente para metais (ouro): ambiente equiretangular simples com céu claro, horizonte quente e janelas de luz
let _envGold = null;
function envGold() {
  if (_envGold) return _envGold;
  const tx = canvasTex(512, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#fff4e0"); g.addColorStop(0.42, "#ffd89a"); g.addColorStop(0.52, "#c8803a"); g.addColorStop(0.62, "#4a2c18"); g.addColorStop(1, "#1a1008"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = "#ffffff"; [[0.12, 0.2, 0.08, 0.12], [0.45, 0.12, 0.05, 0.2], [0.7, 0.25, 0.12, 0.08], [0.88, 0.15, 0.04, 0.15]].forEach(([x, y, ww, hh]) => c.fillRect(x * w, y * h, ww * w, hh * h)); });
  tx.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); _envGold = pm.fromEquirectangular(tx).texture; pm.dispose();
  return _envGold;
}
function espirito(o = {}) {
  const p = pessoa({ hairStyle: "careca", fingers: true, jacket: null, ...o });
  const gold = new THREE.MeshStandardMaterial({ color: o.cor ?? 0xf2b43a, metalness: 0.9, roughness: 0.26, emissive: o.emis ?? 0xffd070, emissiveMap: rep(plateTex.clone(), 2, 1), emissiveIntensity: o.emisI ?? 0.75, envMap: envGold(), envMapIntensity: o.env ?? 1.1 });
  gold.emissiveMap.needsUpdate = true;
  const lines = new THREE.MeshStandardMaterial({ color: 0x8a5a10, metalness: 0.9, roughness: 0.35, emissive: 0x3a2004, emissiveIntensity: 0.4, envMap: envGold(), envMapIntensity: 0.8 });
  rimify(gold, 1.6);
  p.traverse((c) => { if (c.isMesh && !c.userData.isOutline) { c.material = gold; c.castShadow = true; } if (c.isMesh && c.userData.isOutline) c.material = olMat(0.004, 0x3a2004); });
  const u = p.userData;
  u.eyes.forEach((e) => (e.g.visible = false)); u.brows.forEach((b) => (b.visible = false)); if (u.mouth) u.mouth.g.visible = false;
  // detalhes: linhas no peito, ombreiras, sol na testa, olhos de luz
  const zf = surfZ(u.headM, 0, 0.14);
  if (o.emblem !== false) { const em = mesh(new THREE.CircleGeometry(0.03, 24), new THREE.MeshBasicMaterial({ map: sunEmblem, transparent: true, color: 0xfff0b0 }), 0, 0.15, zf + 0.004, u.head); em.rotation.x = -0.35; em.castShadow = false; u.emblem = em; }
  u.eyeM = new THREE.MeshBasicMaterial({ color: o.eyeCol ?? 0xfff4c8 });
  [-1, 1].forEach((k) => { const ey = mesh(new THREE.CircleGeometry(0.012, 16), u.eyeM, k * 0.03, 0.115, surfZ(u.headM, k * 0.03, 0.115) + 0.003, u.head); ey.scale.set(1.6, 0.55, 1); ey.rotation.y = k * 0.28; ey.castShadow = false; });
  if (o.lines) lines.color.set(o.lines), lines.emissive.set(o.lines).multiplyScalar(0.3);
  [-1, 1].forEach((k, i) => { const pad = mesh(sph(0.075, 16, 10), lines, 0, 0.0, 0, u.sh[i]); pad.scale.set(1.15, 0.7, 1.05); });
  const belt = mesh(new THREE.TorusGeometry(0.15, 0.012, 6, 30), lines, 0, 0.16, 0, u.chest); belt.rotation.x = Math.PI / 2; belt.scale.set(1, 0.72, 1);
  const glow = glowSprite(o.glow ?? 0xffc860, 2.6, 0.16); glow.position.set(0, 1.15, -0.35); p.add(glow);
  const L = new THREE.PointLight(o.glow ?? 0xffc860, o.luz ?? 0.45, 3, 1.8); L.position.set(0, 1.3, 0.45); p.add(L);
  u.glow = glow; u.glowL = L; u.goldM = gold;
  return p;
}

// ---------------------------------------------------------------- cenário v2: terreno, vegetação, pedra, construções
const WIND = { value: 0 };
// texturas base (geradas uma vez, repetíveis)
const TX = {};
function texGround() {
  if (TX.ground) return TX.ground;
  return (TX.ground = texPair(512, (u, v) => fbm2(u * 16, v * 16, 4, 16) * 0.6 + fbm2(u * 64, v * 64, 2, 64) * 0.4,
    (u, v, h) => { const n = fbm2(u * 6, v * 6, 4, 6); const c = mixc([196, 205, 170], [235, 238, 215], n); return mixc(c, [150, 150, 130], clamp((0.45 - h) * 1.5)); }, 2.5));
}
function texRock() {
  if (TX.rock) return TX.rock;
  return (TX.rock = texPair(512, (u, v) => { const a = fbm2(u * 6, v * 6, 5, 6); const cr = Math.abs(fbm2(u * 4 + 3, v * 4, 4, 4) - 0.5); return a * 0.8 + (cr < 0.02 ? -0.2 : 0) + 0.2; },
    (u, v, h) => { const c = mixc([120, 116, 110], [170, 166, 156], h); return mixc(c, [100, 112, 80], clamp((fbm2(u * 3, v * 3, 3, 3) - 0.6) * 3) * 0.5); }, 5));
}
// pedra em blocos (muralha): fileiras alternadas com argamassa funda
function texBlocks(c1 = [168, 160, 146], c2 = [140, 134, 124]) {
  const k = "blk" + c1 + c2; if (TX[k]) return TX[k];
  const rows = 8, cols = 4;
  const cell = (u, v) => { const r = Math.floor(v * rows), off = (r % 2) * 0.5, cu = u * cols + off, c = Math.floor(cu); return { r, c, fu: cu - c, fv: v * rows - r }; };
  return (TX[k] = texPair(512, (u, v) => { const q = cell(u, v); const edge = Math.min(q.fu, 1 - q.fu, (q.fv) * 0.5, (1 - q.fv) * 0.5); const mortar = edge < 0.03 ? 0 : sm(clamp((edge - 0.03) / 0.05)); return mortar * (0.75 + fbm2(u * 24, v * 24, 3, 24) * 0.25) + hash2(q.r, q.c) * 0.08; },
    (u, v, h) => { const q = cell(u, v); const base = mixc(c1, c2, hash2(q.r * 3, q.c * 7)); const dirt = fbm2(u * 5, v * 5, 4, 5); let c = mixc(base, [100, 96, 90], clamp((dirt - 0.55) * 2)); if (h < 0.2) c = [70, 66, 62]; return mixc(c, [80, 100, 60], clamp((fbm2(u * 7 + 3, v * 7, 3, 7) - 0.68) * 4) * (v > 0.7 ? 0.6 : 0.2)); }, 6, { rep: [1, 1] }));
}
function texPlanks(c1 = [120, 82, 50], c2 = [96, 64, 38]) {
  const k = "pl" + c1 + c2; if (TX[k]) return TX[k];
  return (TX[k] = texPair(512, (u, v) => { const p = Math.floor(u * 6), fu = u * 6 - p; const gap = fu < 0.03 || fu > 0.97 ? 0 : 1; return gap * (0.7 + fbm2(u * 4, v * 40 + p * 3, 3, 40) * 0.3); },
    (u, v, h) => { const p = Math.floor(u * 6); const base = mixc(c1, c2, hash(p * 3.3)); const grain = fbm2(u * 30 + p, v * 3, 4, 3); return h < 0.1 ? [40, 28, 18] : mixc(base, mixc(base, [60, 40, 24], 0.5), grain * 0.8); }, 3));
}
function texBark() {
  if (TX.bark) return TX.bark;
  return (TX.bark = texPair(256, (u, v) => { const n = fbm2(u * 10, v * 2.5, 4, 10); return clamp(Math.abs(Math.sin(u * 40 + n * 6)) * 0.6 + n * 0.4); },
    (u, v, h) => mixc([62, 44, 32], [118, 92, 70], h), 6));
}
function texRoof(c1 = [130, 62, 44], c2 = [96, 46, 36]) {
  const k = "rf" + c1 + c2; if (TX[k]) return TX[k];
  return (TX[k] = texPair(256, (u, v) => { const r = Math.floor(v * 10), fv = v * 10 - r, off = (r % 2) * 0.5, cu = u * 8 + off, fu = cu - Math.floor(cu); return clamp(fv * 1.2) * (fu < 0.06 || fu > 0.94 ? 0.5 : 1); },
    (u, v, h) => { const r = Math.floor(v * 10), cu = Math.floor(u * 8 + (r % 2) * 0.5); return mixc(mixc(c1, c2, hash2(r, cu)), [40, 30, 28], (1 - h) * 0.5); }, 4));
}
function texPlaster(beam = "#3a2618", wall = "#d8cdb6") {
  const k = "pla" + beam + wall; if (TX[k]) return TX[k];
  return (TX[k] = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = wall; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(${hash(i) > 0.5 ? "120,100,80" : "255,250,240"},${0.04 + hash(i * 3) * 0.06})`; c.beginPath(); c.arc(hash(i * 5) * w, hash(i * 7) * h, 4 + hash(i * 9) * 16, 0, 7); c.fill(); }
    c.fillStyle = beam; [0, 0.48, 0.97].forEach((x) => c.fillRect(x * w - 6, 0, 14, h)); [0, 0.5, 0.97].forEach((y) => c.fillRect(0, y * h - 6, w, 13));
    c.lineWidth = 11; c.strokeStyle = beam; c.beginPath(); c.moveTo(0, h * 0.5); c.lineTo(w * 0.48, 0); c.moveTo(w * 0.48, h * 0.5); c.lineTo(w, h); c.stroke();
  }));
}

// terreno: grade com altura h(x,z), cores por altura/inclinação/ruído e textura de detalhe
function terrain(g, o = {}) {
  const size = o.size ?? 400, segs = o.segs ?? 180, hf = o.h ?? (() => 0);
  const geo = new THREE.PlaneGeometry(size, size, segs, segs); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, hf(p.getX(i) + (o.x ?? 0), p.getZ(i) + (o.z ?? 0)));
  geo.computeVertexNormals();
  const n = geo.attributes.normal, cols = new Float32Array(p.count * 3), c = new THREE.Color();
  const A = new THREE.Color(o.grassA ?? 0x5d7a3a), B = new THREE.Color(o.grassB ?? 0x8a9a4a), R = new THREE.Color(o.rock ?? 0x7a7468), D = new THREE.Color(o.dirt ?? 0x8a7458);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + (o.x ?? 0), z = p.getZ(i) + (o.z ?? 0), y = p.getY(i), sl = 1 - n.getY(i);
    c.copy(A).lerp(B, fbm2(x * 0.03, z * 0.03, 4));
    c.lerp(D, clamp((fbm2(x * 0.08 + 9, z * 0.08, 3) - 0.62) * 3) * 0.8);
    if (o.path) c.lerp(D, o.path(x, z));
    c.lerp(R, clamp((sl - 0.25) * 3));
    if (o.color) o.color(c, x, y, z, sl);
    cols.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  const tx = texGround(); const map = tx.map.clone(), nm = tx.normalMap.clone(); map.needsUpdate = nm.needsUpdate = true; rep(map, size / 6, size / 6); rep(nm, size / 6, size / 6);
  const m = mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map, normalMap: nm, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.96 }), o.x ?? 0, 0, o.z ?? 0, g);
  m.castShadow = false;
  return { mesh: m, h: hf };
}
// grama em tufos instanciados que balançam com o vento
function grassField(g, n, area, hf, o = {}) {
  const blade = new THREE.BufferGeometry();
  const w = o.w ?? 0.035, hgt = o.hgt ?? 0.32;
  blade.setAttribute("position", new THREE.Float32BufferAttribute([-w, 0, 0, w, 0, 0, -w * 0.6, hgt * 0.5, 0.02, w * 0.6, hgt * 0.5, 0.02, 0, hgt, 0.06], 3));
  blade.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); blade.computeVertexNormals();
  const tuft = new THREE.BufferGeometry(); // 3 lâminas cruzadas
  const parts = [0, 1, 2].map((k) => { const b = blade.clone(); b.rotateY((k / 3) * Math.PI + 0.3); b.translate((k - 1) * 0.04, 0, (k % 2) * 0.03); return b; });
  const merged = (() => { const pos = [], idx = []; let off = 0; parts.forEach((b) => { pos.push(...b.attributes.position.array); idx.push(...b.index.array.map((i) => i + off)); off += b.attributes.position.count; }); tuft.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); tuft.setIndex(idx); tuft.computeVertexNormals(); return tuft; })();
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uWind = WIND;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uWind;").replace("#include <begin_vertex>", `#include <begin_vertex>
      vec3 ip = vec3(0.0);
      #ifdef USE_INSTANCING
        ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      #endif
      float bend = position.y * position.y * 4.0;
      transformed.x += (sin(uWind * 1.6 + ip.x * 0.3 + ip.z * 0.17) * 0.08 + sin(uWind * 3.3 + ip.z * 0.9 + ip.x) * 0.025) * bend;
      transformed.z += cos(uWind * 1.2 + ip.x * 0.23) * 0.05 * bend;`);
  };
  m.customProgramCacheKey = () => "grass";
  const im = new THREE.InstancedMesh(merged, m, n); im.receiveShadow = true; im.castShadow = false; im.frustumCulled = false;
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), col = new THREE.Color();
  const cA = new THREE.Color(o.colA ?? 0x6a8a3a), cB = new THREE.Color(o.colB ?? 0xa8b45a);
  let k = 0;
  for (let i = 0; i < n * 4 && k < n; i++) {
    const x = area[0] + hash(i * 1.13 + 3) * (area[1] - area[0]), z = area[2] + hash(i * 2.71 + 7) * (area[3] - area[2]);
    if (o.mask && !o.mask(x, z)) continue;
    ps.set(x, hf(x, z) - 0.02, z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), hash(i * 5.3) * 6.28); const s = (o.s ?? 1) * (0.6 + hash(i * 7.7) * 0.8); sc.set(s, s * (0.7 + hash(i * 3.9) * 0.6), s);
    M4.compose(ps, q, sc); im.setMatrixAt(k, M4); col.copy(cA).lerp(cB, hash(i * 9.1) * 0.8 + fbm2(x * 0.05, z * 0.05, 2) * 0.4); im.setColorAt(k, col); k++;
  }
  im.count = k; g.add(im);
  return im;
}
// pedra irregular
function rock(g, x, y, z, r, seed = 1, o = {}) {
  const geo = new THREE.IcosahedronGeometry(1, 3);
  deform(geo, (v) => { const n = fbm2(v.x * 1.7 + seed, v.y * 1.7 + v.z * 1.3, 4); v.multiplyScalar(0.75 + n * 0.55); v.y *= o.flat ?? 0.7; });
  const t = texRock();
  const m = mesh(geo, SM(o.col ?? 0xffffff, { map: t.map, normalMap: t.normalMap, normalScale: new THREE.Vector2(1.2, 1.2) }), x, y, z, g);
  m.scale.setScalar(r); m.rotation.set(hash(seed) * 0.5, hash(seed + 1) * 6, hash(seed + 2) * 0.5);
  return m;
}
// árvore: tronco afinando com casca, galhos e copa em tufos irregulares
const FOL = {};
function foliageGeo(seed) {
  const k = seed % 6; if (FOL[k]) return FOL[k];
  const geo = new THREE.IcosahedronGeometry(1, 3);
  deform(geo, (v) => { const n = fbm2(v.x * 2.2 + k * 3, v.y * 2.2 + v.z * 1.7, 4); v.multiplyScalar(0.72 + n * 0.5); });
  return (FOL[k] = geo);
}
function tree(g, x, y, z, o = {}) {
  const t = grp(g, x, y, z), s = o.s ?? 1, seed = o.seed ?? 1, h = (o.h ?? 6) * s;
  const bk = texBark();
  const trunk = mesh(lathe([[0.45 * s, 0], [0.32 * s, h * 0.15], [0.26 * s, h * 0.5], [0.16 * s, h * 0.85], [0.06 * s, h]], 12), SM(0xffffff, { map: bk.map, normalMap: bk.normalMap }), 0, 0, 0, t);
  trunk.rotation.z = (hash(seed) - 0.5) * 0.08;
  const fc = new THREE.Color(o.leaf ?? 0x4a6a2a);
  const nb = o.blobs ?? 9;
  for (let i = 0; i < nb; i++) {
    const a = hash(seed * 7 + i) * Math.PI * 2, r = (0.3 + hash(seed * 3 + i) * 0.9) * (o.w ?? 1.8) * s, yy = h * (0.55 + hash(seed * 5 + i) * 0.45);
    const c = fc.clone().offsetHSL((hash(i * 3 + seed) - 0.5) * 0.04, 0, (hash(i * 7 + seed) - 0.5) * 0.12 + (yy / h - 0.7) * 0.15);
    const b = mesh(foliageGeo(seed + i), SM(c.getHex(), { roughness: 0.8 }), Math.cos(a) * r, yy, Math.sin(a) * r, t);
    b.scale.setScalar((1.1 + hash(seed * 11 + i) * 0.8) * s * (o.blob ?? 1));
    if (i < 3) { const br = mesh(cyl(0.05 * s, 0.12 * s, r * 1.1, 6), SM(0x4a3424), Math.cos(a) * r * 0.5, yy - 0.5 * s, Math.sin(a) * r * 0.5, t); br.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); }
  }
  return t;
}
// floresta de fundo instanciada (tronco + copa)
function forestInst(g, n, area, hf, o = {}) {
  const tg = cyl(0.12, 0.3, 1, 7); tg.translate(0, 0.5, 0);
  const tm = new THREE.InstancedMesh(tg, SM(0x4a3626), n), fm = new THREE.InstancedMesh(foliageGeo(3), SM(0xffffff, { roughness: 0.85 }), n * 2);
  const M4 = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion(), base = new THREE.Color(o.leaf ?? 0x3e5a28);
  let k = 0;
  for (let i = 0; i < n * 3 && k < n; i++) {
    const x = area[0] + hash(i * 3.17 + 1) * (area[1] - area[0]), z = area[2] + hash(i * 1.91 + 5) * (area[3] - area[2]);
    if (o.mask && !o.mask(x, z)) continue;
    const h = (o.h ?? 8) * (0.7 + hash(i * 4.4) * 0.6), y = hf(x, z);
    M4.compose(new THREE.Vector3(x, y - 0.3, z), q, new THREE.Vector3(h * 0.08, h * 0.6, h * 0.08)); tm.setMatrixAt(k, M4);
    for (let j = 0; j < 2; j++) { M4.compose(new THREE.Vector3(x + (j - 0.5) * h * 0.12, y + h * (0.62 + j * 0.2), z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), hash(i + j) * 6), new THREE.Vector3(h * 0.24, h * (0.3 - j * 0.06), h * 0.24)); fm.setMatrixAt(k * 2 + j, M4); col.copy(base).offsetHSL(0, 0, (hash(i * 2.2 + j) - 0.5) * 0.1); fm.setColorAt(k * 2 + j, col); }
    k++;
  }
  tm.count = k; fm.count = k * 2; tm.castShadow = fm.castShadow = !!o.shadow; tm.receiveShadow = fm.receiveShadow = true; tm.frustumCulled = fm.frustumCulled = false;
  g.add(tm, fm);
  return { tm, fm };
}

// muralha original: pedra em blocos, ameias, torres com telhado cônico e andaimes
function wallSeg(g, len, hgt, thick, o = {}) {
  const w = grp(g, ...(o.pos ?? [0, 0, 0])); w.rotation.y = o.rotY ?? 0;
  const tb = texBlocks();
  const mk = (sx, sy) => { const map = tb.map.clone(), nm = tb.normalMap.clone(); map.needsUpdate = nm.needsUpdate = true; rep(map, sx, sy); rep(nm, sx, sy); return SM(0xffffff, { map, normalMap: nm, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.92 }); };
  const front = mk(len / 12, hgt / 12);
  mesh(box(len, hgt, thick), front, 0, hgt / 2, 0, w);
  // base inclinada (talude)
  const ta = mesh(box(len, hgt * 0.18, thick * 0.5), mk(len / 12, 0.5), 0, hgt * 0.07, thick * 0.55, w); ta.rotation.x = -0.35;
  const mer = mk(0.4, 0.4); const n = Math.floor(len / 3.2);
  for (let i = 0; i < n; i++) { mesh(box(1.8, 2.2, thick * 0.25), mer, -len / 2 + 1.6 + i * 3.2, hgt + 1.1, thick * 0.38, w); mesh(box(1.8, 2.2, thick * 0.25), mer, -len / 2 + 1.6 + i * 3.2, hgt + 1.1, -thick * 0.38, w); }
  mesh(box(len, 0.7, thick * 1.08), SM(0x8a8478), 0, hgt + 0.1, 0, w);
  if (o.scaffold) {
    const wood = SM(0x6a4a2c);
    for (let i = 0; i < 6; i++) { const x = -len * 0.3 + i * 3; mesh(box(0.25, hgt * 0.55, 0.25), wood, x, hgt * 0.275, thick / 2 + 1.4, w); }
    for (let j = 0; j < 4; j++) mesh(box(16, 0.18, 1.4), wood, -len * 0.3 + 7.5, hgt * 0.14 * (j + 1), thick / 2 + 0.8, w);
  }
  return w;
}
function tower(g, x, z, r, h, o = {}) {
  const t = grp(g, x, 0, z), tb = texBlocks();
  const map = tb.map.clone(), nm = tb.normalMap.clone(); map.needsUpdate = nm.needsUpdate = true; rep(map, (r * 6.28) / 6, h / 6); rep(nm, (r * 6.28) / 6, h / 6);
  mesh(cyl(r, r * 1.08, h, 28), SM(0xffffff, { map, normalMap: nm, normalScale: new THREE.Vector2(1.3, 1.3) }), 0, h / 2, 0, t);
  mesh(cyl(r * 1.12, r * 1.12, 0.8, 28), SM(0x8a8478), 0, h, 0, t);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; mesh(box(1.2, 1.8, 0.9), SM(0xa8a090), Math.cos(a) * r * 1.05, h + 1.2, Math.sin(a) * r * 1.05, t).rotation.y = -a; }
  const rf = texRoof([70, 72, 92], [50, 52, 70]);
  mesh(new THREE.ConeGeometry(r * 1.25, r * 2.2, 28), SM(0xffffff, { map: rf.map, normalMap: rf.normalMap }), 0, h + 2.4 + r * 1.1, 0, t);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4, wy = h * (0.45 + (i % 2) * 0.2); const win = mesh(box(0.7, 1.4, 0.3), o.lit ? BM(0xffb860) : SM(0x15100c), Math.cos(a) * r * 0.99, wy, Math.sin(a) * r * 0.99, t); win.rotation.y = -a + Math.PI / 2; }
  if (o.flag) { mesh(cyl(0.08, 0.08, 4, 6), SM(0x3a2a1a), 0, h + 3 + r * 2.2, 0, t); const fl = mesh(new THREE.PlaneGeometry(2.2, 1.3, 6, 1), TM(o.flag, { side: THREE.DoubleSide }), 1.1, h + 4.3 + r * 2.2, 0, t); t.userData.flag = fl; }
  return t;
}
// casa de enxaimel com telhado de telhas, chaminé e janelas (acesas à noite)
function house(g, x, z, o = {}) {
  const h = grp(g, x, o.y ?? 0, z), w = o.w ?? 5, d = o.d ?? 4, hh = o.h ?? 4, seed = o.seed ?? 1;
  h.rotation.y = o.rotY ?? 0;
  const pl = texPlaster(o.beam ?? "#3a2618", o.wall ?? ["#d8cdb6", "#cfc2a4", "#e2d8c4", "#c9b896"][Math.floor(hash(seed) * 4)]);
  const wm = SM(0xffffff, { map: pl, roughness: 0.95 });
  mesh(box(w, hh, d), wm, 0, hh / 2, 0, h);
  mesh(box(w + 0.2, 0.6, d + 0.2), SM(0x6a6258), 0, 0.3, 0, h);
  const rh = d * 0.55, shape = new THREE.Shape(); shape.moveTo(-d / 2 - 0.5, 0); shape.lineTo(d / 2 + 0.5, 0); shape.lineTo(0, rh); shape.lineTo(-d / 2 - 0.5, 0);
  const rg = new THREE.ExtrudeGeometry(shape, { depth: w + 0.8, bevelEnabled: false }); rg.translate(0, 0, -(w + 0.8) / 2); rg.rotateY(Math.PI / 2);
  const rt = texRoof(...(hash(seed * 3) > 0.5 ? [[130, 62, 44], [96, 46, 36]] : [[92, 70, 60], [70, 52, 46]]));
  const rmap = rt.map.clone(), rnm = rt.normalMap.clone(); rmap.needsUpdate = rnm.needsUpdate = true; rep(rmap, 0.5, 0.5); rep(rnm, 0.5, 0.5);
  mesh(rg, SM(0xffffff, { map: rmap, normalMap: rnm }), 0, hh, 0, h);
  const gable = new THREE.Shape(); gable.moveTo(-d / 2, 0); gable.lineTo(d / 2, 0); gable.lineTo(0, rh * 0.92); gable.lineTo(-d / 2, 0);
  [-1, 1].forEach((k) => { const gg = mesh(new THREE.ShapeGeometry(gable), wm, k * (w / 2 + 0.01), hh, 0, h); gg.rotation.y = k * Math.PI / 2; });
  if (hash(seed * 5) > 0.3) mesh(box(0.7, 2.2, 0.7), SM(0x7a6a5a), w * 0.25, hh + rh * 0.7, d * 0.15, h);
  const lit = o.lit ?? 0;
  const winM = lit ? BM(new THREE.Color(0xffb35a).multiplyScalar(0.6 + lit * 1.4).getHex()) : SM(0x1a1612, { roughness: 0.3 });
  const nw = Math.max(1, Math.floor(w / 1.8));
  for (let i = 0; i < nw; i++) for (let fl = 0; fl < (hh > 5 ? 2 : 1); fl++) {
    if (hash(seed * 13 + i * 3 + fl) < 0.25) continue;
    const wx = -w / 2 + (i + 0.5) * (w / nw), wy = 1.6 + fl * 2.4;
    mesh(box(0.8, 1.0, 0.1), winM, wx, wy, d / 2 + 0.02, h);
    mesh(box(1.0, 0.12, 0.2), SM(0x3a2618), wx, wy - 0.58, d / 2 + 0.06, h);
  }
  mesh(box(1.0, 1.9, 0.12), SM(0x4a3020), w * -0.3, 0.95, d / 2 + 0.03, h);
  h.userData.chimney = new THREE.Vector3(w * 0.25, hh + rh * 0.7 + 1.2, d * 0.15);
  return h;
}
// corrente de elos
function chain(g, pts, linkR = 0.05, o = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))); const L = curve.getLength(), n = Math.max(2, Math.floor(L / (linkR * 2.6)));
  const lg = new THREE.TorusGeometry(linkR, linkR * 0.28, 6, 12), m = SM(o.col ?? 0x5a5a62, { metalness: 0.6, roughness: 0.45 }), links = [];
  for (let i = 0; i < n; i++) { const u = i / (n - 1), p = curve.getPointAt(u), tg = curve.getTangentAt(u); const l = mesh(lg, m, p.x, p.y, p.z, g); l.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tg); l.rotateX(i % 2 ? Math.PI / 2 : 0); l.scale.set(1.35, 1, 1); links.push(l); }
  return links;
}

// ================================================================ vídeo: Por que o Giorno é praticamente impossível de derrotar? (comum)
// Personagens e símbolos originais: nada desenhado da série; nomes só no texto e na narração.
// Animação v3: pés plantados (gait), gestos com antecipação e acomodação (act), cabelo e roupa com inércia,
// expressões presas às palavras da narração, rebobinar o tempo avaliando o movimento com o tempo invertido.
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wpos = (o, v = V3()) => o.getWorldPosition(v);
const GOLDM = () => new THREE.MeshStandardMaterial({ color: 0xe8b040, metalness: 0.92, roughness: 0.24, emissive: 0x4a2a00, emissiveIntensity: 0.35, envMap: envGold(), envMapIntensity: 1.1 });

// ---------------------------------------------------------------- o garoto de ouro (original)
// cabelo loiro-escuro penteado pra trás (sem cachos), terno branco com botões dourados, camisa escura
const GAROTO = { hair: 0xc8a060, hairStyle: "penteado", skin: SKINS.clara, iris: 0x2e6a8a, jacket: 0xf0ece2, shirt: 0x1c1a24, pants: 0xebe5d8, boots: 0x6a4428, belt: 0x2a2018, jacketOpen: 0.2, cuff: 0xf0ece2, coatTail: true, seed: 11, brow: 0x6a4a20, lip: 0xb06058 };
function garoto(o = {}) {
  const p = pessoa({ ...GAROTO, ...o }), u = p.userData, gm = GOLDM();
  // botões na borda do paletó (lado esquerdo do corpo), calculados na superfície do torno do paletó
  const onJacket = (parent, r, zs, x, y) => { const s = clamp(x / r, -1, 1); return mesh(sph(0.0095, 10, 8), gm, x, y, r * Math.sqrt(1 - s * s) * zs + 0.003, parent); };
  onJacket(u.chest, 0.168, 0.74, 0.046, 0.05); onJacket(u.chest, 0.183, 0.74, 0.048, 0.14); onJacket(u.spine, 0.146, 0.78, 0.045, 0.1);
  // broche de sol no peito
  const pin = mesh(new THREE.CircleGeometry(0.02, 20), new THREE.MeshStandardMaterial({ map: sunEmblem, transparent: true, color: 0xffd060, metalness: 0.6, roughness: 0.3, emissive: 0x6a4000, emissiveIntensity: 0.6 }), 0.085, 0.2, 0.124, u.chest); pin.rotation.y = 0.42; pin.castShadow = false;
  // gravata fina dourada
  const tie = mesh(box(0.022, 0.2, 0.006), gm, 0, 0.16, 0.124, u.chest); tie.rotation.x = -0.12; tie.castShadow = false;
  return p;
}

// ---------------------------------------------------------------- o chefe (original): casaco longo vermelho-escuro, chapéu, rosto na sombra
const CHEFE = { hair: 0x3a0e16, hairStyle: "longo", hairLen: 1.15, skin: SKINS.clara, iris: 0x4a2a2a, jacket: 0x5a0c16, shirt: 0x141016, pants: 0x161216, boots: 0x120c0c, belt: 0x0c0808, jacketOpen: 0.3, coatTail: true, cuff: 0x5a0c16, seed: 21, brow: 0x2a0a10, lip: 0x9a5050 };
function chefe(o = {}) {
  const p = pessoa({ ...CHEFE, ...o }), u = p.userData, coat = TM(CHEFE.jacket, { side: THREE.DoubleSide });
  u.tails.forEach((tl) => tl.scale.set(1.3, 1.5, 1));
  // abas da frente do casaco presas à coxa: acompanham a perna ao andar
  u.flaps = u.hipJ.map((hj, i) => { const fg = new THREE.PlaneGeometry(0.15, 0.66, 2, 6); fg.translate(0, -0.3, 0); const f = mesh(fg, coat, (i ? 1 : -1) * 0.035, 0.02, 0.085, hj); f.rotation.set(0.04, (i ? 1 : -1) * 0.5, 0); return f; });
  // chapéu de aba larga
  const hat = grp(u.head, 0, 0.205, -0.004); hat.rotation.x = 0.16;
  const hm = TM(0x1a0a0e), band = TM(0x7a1018);
  ol(mesh(cyl(0.083, 0.094, 0.1, 24), hm, 0, 0.04, 0, hat), 0.003);
  ol(mesh(cyl(0.165, 0.17, 0.008, 32), hm, 0, -0.008, 0, hat), 0.003);
  mesh(cyl(0.095, 0.096, 0.026, 24), band, 0, 0.004, 0, hat);
  u.hat = hat;
  return p;
}
function chefeFlaps(p, t, wind = 1) { const u = p.userData; (u.flaps || []).forEach((f, i) => { f.rotation.x = 0.04 + Math.sin(t * 3.3 + i * 2) * 0.03 * wind; f.rotation.z = (i ? 1 : -1) * (0.05 + Math.sin(t * 2.4 + i) * 0.03 * wind); }); }

// ---------------------------------------------------------------- espíritos (originais)
// dourado: rosto liso com sol na testa; carmesim: olhos brancos, sem emblema
const espDourado = (o = {}) => espirito({ glow: 0xffc860, ...o });
const espCarmesim = (o = {}) => espirito({ cor: 0x7a0a16, emis: 0xff2a36, glow: 0xff3048, emblem: false, lines: 0x2a0408, eyeCol: 0xffffff, ...o });
// coroa de raios atrás da cabeça e asas de luz (forma evoluída)
function evoluir(p) {
  const u = p.userData, gm = GOLDM(); gm.emissive.set(0xffb030); gm.emissiveIntensity = 0.9;
  const halo = grp(u.head, 0, 0.13, -0.1);
  mesh(new THREE.TorusGeometry(0.15, 0.007, 8, 48), gm, 0, 0, 0, halo);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = mesh(new THREE.ConeGeometry(0.011, i % 2 ? 0.07 : 0.11, 6), gm, Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0, halo); r.rotation.z = a - Math.PI / 2; }
  const hs = glowSprite(0xffd070, 0.6, 0.5); halo.add(hs);
  const wings = flowPts(160, 0xffd070, 0.035); u.chest.add(wings.pts);
  u.halo = halo; u.wings = wings; halo.scale.setScalar(0.001); wings.pts.visible = false;
  return p;
}
function evoAnim(p, t, k) {
  const u = p.userData; if (!u.halo) return;
  u.halo.scale.setScalar(Math.max(0.001, E.outBack(clamp(k)))); u.halo.rotation.z = t * 0.4; u.wings.pts.visible = k > 0.01; u.wings.pts.material.opacity = k * 0.9;
  for (let i = 0; i < 160; i++) { const side = i % 2 ? 1 : -1, j = Math.floor(i / 2), f = j / 80, ph = (t * 0.3 + hash(i * 1.7)) % 1;
    const a = 0.35 + f * 1.25, r = (0.25 + f * 0.75) * k; u.wings.pos.set([side * (0.12 + Math.cos(a) * r), 0.12 + Math.sin(a) * r * 0.9 - ph * 0.15 + Math.sin(t * 2 + f * 5) * 0.02, -0.18 - f * 0.08 + Math.sin(t * 1.4 + j) * 0.03], i * 3); }
  u.wings.upd();
}

// ---------------------------------------------------------------- a Flecha (original: dourada, com um sol gravado na ponta)
function flecha(g) {
  const a = grp(g), gm = GOLDM();
  const shaft = mesh(cyl(0.011, 0.011, 0.86, 10), gm, 0, 0, 0, a); shaft.rotation.x = Math.PI / 2;
  const blade = mesh(new THREE.ConeGeometry(0.055, 0.2, 4), gm, 0, 0, 0.53, a); blade.rotation.x = Math.PI / 2; blade.scale.set(1, 1, 0.22);
  [-1, 1].forEach((k) => { const em = mesh(new THREE.CircleGeometry(0.022, 20), new THREE.MeshBasicMaterial({ map: sunEmblem, transparent: true, color: 0x6a3a00, depthWrite: false }), 0, 0.0122 * k, 0.5, a); em.rotation.x = -k * Math.PI / 2; em.castShadow = false; });
  mesh(new THREE.TorusGeometry(0.022, 0.007, 6, 16), gm, 0, 0, 0.43, a);
  mesh(sph(0.02, 10, 8), gm, 0, 0, -0.43, a);
  const feat = new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xffd890, emissiveIntensity: 0.25, side: THREE.DoubleSide, roughness: 0.6 });
  for (let i = 0; i < 3; i++) { const f = grp(a, 0, 0, -0.36); f.rotation.z = (i / 3) * Math.PI * 2; const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.quadraticCurveTo(0.06, -0.02, 0.055, -0.13); fs.lineTo(0, -0.1); fs.lineTo(0, 0); const m = mesh(new THREE.ShapeGeometry(fs), feat, 0.008, 0, 0, f); m.rotation.y = Math.PI / 2; m.rotation.x = Math.PI / 2; }
  const tipGlow = glowSprite(0xffd070, 0.16, 0.35); tipGlow.position.z = 0.56; a.add(tipGlow);
  a.userData = { tipGlow };
  return a;
}

// ---------------------------------------------------------------- efeitos de tempo
// anéis dourados que se expandem a partir de um ponto (na direção dir)
function aneis(g, n = 3, color = 0xffd070) {
  const rs = []; for (let i = 0; i < n; i++) { const r = mesh(new THREE.TorusGeometry(1, 0.025, 8, 64), glowM(color, 0), 0, 0, 0, g); r.castShadow = r.receiveShadow = false; r.renderOrder = 8; rs.push(r); }
  return (t, t0, pos, dir = [0, 0, 1], size = 1.2, dur = 1.1) => rs.forEach((r, i) => {
    const k = (t - t0 - i * 0.12) / dur; r.visible = k > 0 && k < 1; if (!r.visible) return;
    r.position.copy(pos); r.lookAt(pos.x + dir[0], pos.y + dir[1], pos.z + dir[2]); r.scale.setScalar(Math.max(0.01, size * E.out(k))); r.material.opacity = (1 - k) * 0.9; r.material.needsUpdate = false;
  });
}
// número 3D brilhando (placa que sempre olha a câmera)
function glyph(g, txt, color = "#ffd070", size = 1) {
  const tx = canvasTex(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.font = "700 210px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.shadowColor = color; c.shadowBlur = 24; c.fillStyle = color; c.fillText(txt, w / 2, h / 2 + 8); c.shadowBlur = 0; c.fillStyle = "#fff8e0"; c.fillText(txt, w / 2, h / 2 + 8); }, { redraw: true });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, blending: ADD, opacity: 0 })); s.scale.setScalar(size); s.renderOrder = 9; g.add(s);
  return s;
}
// onda dourada (bolha que se expande e desfaz o efeito)
function ondaDourada(g) {
  const m = holoMat(0xffc040); const s = mesh(sph(1, 48, 32), m, 0, 0, 0, g); s.castShadow = s.receiveShadow = false; s.renderOrder = 7; s.visible = false;
  return (t, t0, pos, R = 30, dur = 1.0) => { const k = (t - t0) / dur; s.visible = k > 0 && k < 1; if (!s.visible) return; s.position.copy(pos); s.scale.setScalar(0.3 + R * E.out(k)); m.uniforms.uA.value = (1 - k) * 0.7; };
}
// cópias fantasma (holograma dourado) de um personagem, para o rastro de rebobinar
function fantasmas(g, make, n = 3, color = 0xffc040) {
  return Array.from({ length: n }, (_, i) => { const m = holoMat(color, { alpha: 0 }); const p = holoify(make(), m); p.userData.holo = m; p.visible = false; g.add(p); return p; });
}
// partículas douradas subindo em volta (aura)
function aura(g, n = 70, color = 0xffd070, size = 0.045) {
  const f = flowPts(n, color, size); g.add(f.pts);
  return (t, c, k = 1, R = 0.55, H = 2.1) => { f.pts.visible = k > 0.01; f.pts.material.opacity = k; for (let i = 0; i < n; i++) { const ph = (t * (0.25 + hash(i * 3) * 0.2) + hash(i * 1.3)) % 1, a = hash(i) * 6.28 + t * 0.6 * (hash(i * 7) - 0.5); const r = R * (0.6 + hash(i * 5) * 0.6) * (1 - ph * 0.4); f.pos.set([c.x + Math.cos(a) * r, c.y + ph * H, c.z + Math.sin(a) * r], i * 3); } f.upd(); };
}
// linha do tempo de uma ação que vai e volta: devolve o tempo da história (vai de 0 a 1, para, rebobina até 0)
function rebob(t, t0, t1, hold, back, ease = E.in) {
  if (t < t0) return 0; if (t < t1) return (t - t0) / (t1 - t0); if (t < t1 + hold) return 1;
  const k = seg(t, t1 + hold, t1 + hold + back); return 1 - ease(k);
}
// visual de "tempo apagado": tinta vermelha, contraste duro e grão (aplicar no after)
function lookApagado(k, t) {
  if (k <= 0) return;
  GU.uGain.value.set(lerp(GU.uGain.value.x, 1.2, k), lerp(GU.uGain.value.y, 0.62, k), lerp(GU.uGain.value.z, 0.66, k));
  GU.uLift.value.set(lerp(GU.uLift.value.x, 0.05, k), lerp(GU.uLift.value.y, 0.0, k), lerp(GU.uLift.value.z, 0.015, k));
  GU.uSat.value = lerp(GU.uSat.value, 0.72, k); GU.uCon.value = lerp(GU.uCon.value, 1.22, k); GU.uCA.value = lerp(GU.uCA.value, 0.014, k); GU.uGrain.value = lerp(GU.uGrain.value, 0.07, k);
  GU.uVig.value = lerp(GU.uVig.value, 0.7, k);
}
// visual de rebobinar: aberração cromática, tom dourado e leve dessaturação
function lookRebobina(k) {
  if (k <= 0) return;
  GU.uCA.value = lerp(GU.uCA.value, 0.014, k); GU.uSat.value = lerp(GU.uSat.value, 0.8, k);
  GU.uLift.value.set(lerp(GU.uLift.value.x, 0.05, k), lerp(GU.uLift.value.y, 0.035, k), GU.uLift.value.z);
}
// tempo "pulando quadros" (gagueira do tempo apagado)
const stutter = (t, fps = 7) => Math.floor(t * fps) / fps;

// ---------------------------------------------------------------- arquitetura italiana (original e genérica)
// travertino: blocos grandes e irregulares, argamassa clara, desgaste e furinhos
function texTravertino() {
  if (TXM.trav) return TXM.trav;
  const rows = 4, cols = 2;
  const cell = (u, v) => { const r = Math.floor(v * rows), off = (r % 2) * 0.5 + hash(r * 3.3) * 0.2, cu = u * cols + off, c = Math.floor(cu); return { r, c, fu: cu - c, fv: v * rows - r }; };
  return (TXM.trav = texPair(512, (u, v) => { const q = cell(u, v), e = Math.min(q.fu * 2, (1 - q.fu) * 2, q.fv, 1 - q.fv); const mortar = e < 0.025 ? 0.35 : 0.35 + 0.65 * sm(clamp((e - 0.025) / 0.05)); const pits = fbm2(u * 60, v * 60, 2, 60) > 0.8 ? -0.12 : 0; return mortar * (0.8 + fbm2(u * 14, v * 14, 4, 14) * 0.2) + pits + hash2(q.r, q.c) * 0.05; },
    (u, v, h) => { const q = cell(u, v); const base = mixc([226, 208, 176], [204, 184, 150], hash2(q.r * 3, q.c * 7)); let c = mixc(base, [168, 146, 116], clamp((fbm2(u * 6, v * 6, 4, 6) - 0.5) * 1.6) * 0.7); if (h < 0.4) c = mixc(c, [150, 132, 108], 0.5); return mixc(c, [120, 104, 84], clamp((0.3 - h) * 2)); }, 3.2));
}
// pedra lisa gasta (degraus, piso), sem blocos
function texPedraLisa(c1 = [214, 196, 166], c2 = [186, 166, 136]) {
  const k = "pl" + c1 + c2; if (TXM[k]) return TXM[k];
  return (TXM[k] = texPair(256, (u, v) => fbm2(u * 8, v * 8, 5, 8) * 0.8 + fbm2(u * 40, v * 40, 2, 40) * 0.2, (u, v, h) => mixc(mixc(c1, c2, fbm2(u * 4, v * 4, 4, 4)), [140, 122, 98], clamp((0.38 - h) * 1.5)), 1.6));
}
function matBlocos(tb, sx, sy, o = {}) { const map = tb.map.clone(), nm = tb.normalMap.clone(); map.needsUpdate = nm.needsUpdate = true; rep(map, sx, sy); rep(nm, sx, sy); return SM(o.col ?? 0xffffff, { map, normalMap: nm, normalScale: new THREE.Vector2(1.2, 1.2), roughness: o.rough ?? 0.9 }); }
const TXM = {};
function texMarmore(c1 = [236, 230, 222], c2 = [150, 140, 132], sz = 512) {
  const k = "mm" + c1 + c2; if (TXM[k]) return TXM[k];
  return (TXM[k] = texPair(sz, (u, v) => fbm2(u * 6, v * 6, 4, 6) * 0.3, (u, v) => { const n = fbm2(u * 3, v * 3, 5, 3), vein = Math.pow(1 - Math.abs(Math.sin((u * 3 + n * 4.5) * Math.PI)), 18); return mixc(mixc(c1, mixc(c1, c2, 0.25), fbm2(u * 9, v * 9, 3, 9)), c2, vein * 0.85); }, 0.6));
}
// coluna com caneluras (lathe deformado), base e capitel
const COLG = {};
function colunaGeo(h, r) {
  const k = h + "_" + r; if (COLG[k]) return COLG[k];
  const geo = lathe([[r * 1.0, 0], [r * 0.98, h * 0.5], [r * 0.86, h]], 40, 0, Math.PI * 2);
  deform(geo, (v) => { const a = Math.atan2(v.x, v.z), f = 1 - 0.045 * Math.pow(Math.abs(Math.cos(a * 10)), 0.6); v.x *= f; v.z *= f; });
  return (COLG[k] = geo);
}
function coluna(g, x, z, h, r, o = {}) {
  const c = grp(g, x, o.y ?? 0, z), m = o.mat ?? SM(0xe8dcc4, { roughness: 0.8 });
  mesh(box(r * 2.9, r * 0.5, r * 2.9), m, 0, r * 0.25, 0, c);
  mesh(cyl(r * 1.25, r * 1.32, r * 0.4, 28), m, 0, r * 0.7, 0, c);
  const sh = mesh(colunaGeo(h, r), m, 0, r * 0.9, 0, c);
  if (!o.broken) {
    mesh(cyl(r * 1.25, r * 0.92, r * 0.5, 28), o.cap ?? m, 0, r * 0.9 + h + r * 0.25, 0, c);
    mesh(box(r * 2.9, r * 0.4, r * 2.9), o.cap ?? m, 0, r * 0.9 + h + r * 0.7, 0, c);
  } else { sh.scale.y = o.broken; const top = mesh(cyl(r * 0.88, r * 0.9, r * 0.25, 28, 1), m, 0, r * 0.9 + h * o.broken, 0, c); top.rotation.set(0.25, 0, 0.18); }
  c.userData.top = r * 0.9 + h * (o.broken ?? 1) + r * 0.9;
  return c;
}
// fachada de prédio italiano: reboco colorido, janelas com venezianas, sacadas, cornija e telhado de telhas
const PALT = {};
function texFachada(wall, shutter, floors, cols, lit = 0, seed = 0) {
  const k = [wall, shutter, floors, cols, lit, seed].join("_"); if (PALT[k]) return PALT[k];
  const map = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = wall; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(${hash(i + seed) > 0.5 ? "90,60,40" : "255,245,225"},${0.03 + hash(i * 3 + seed) * 0.07})`; c.beginPath(); c.arc(hash(i * 5 + seed) * w, hash(i * 7 + seed) * h, 6 + hash(i * 9) * 26, 0, 7); c.fill(); }
    const fh = h / floors, cw = w / cols;
    for (let f = 0; f < floors; f++) {
      c.fillStyle = "rgba(255,250,235,.35)"; c.fillRect(0, f * fh + fh - 7, w, 7);
      for (let j = 0; j < cols; j++) {
        const x = j * cw + cw * 0.28, y = f * fh + fh * 0.2, ww = cw * 0.44, hh = fh * 0.58, on = hash(f * 7.3 + j * 3.1 + seed) < lit;
        c.fillStyle = "rgba(250,240,220,.8)"; c.fillRect(x - 6, y - 6, ww + 12, hh + 12);
        c.fillStyle = on ? "#ffc070" : "#2a2420"; c.fillRect(x, y, ww, hh);
        if (!on || hash(f + j * 5 + seed) > 0.5) { c.fillStyle = shutter; const op = hash(f * 3 + j + seed) > 0.4 ? 1 : 0; if (op) { c.fillRect(x - ww * 0.48, y, ww * 0.46, hh); c.fillRect(x + ww * 1.02, y, ww * 0.46, hh); } else { c.fillRect(x, y, ww, hh); } c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 2; for (let s = 0; s < 8; s++) { const yy = y + (s + 0.5) * hh / 8; if (op) { c.beginPath(); c.moveTo(x - ww * 0.48, yy); c.lineTo(x - ww * 0.02, yy); c.moveTo(x + ww * 1.02, yy); c.lineTo(x + ww * 1.48, yy); c.stroke(); } else { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + ww, yy); c.stroke(); } } }
      }
    }
  });
  const em = lit > 0 ? canvasTex(512, 512, (c, w, h) => { c.fillStyle = "#000"; c.fillRect(0, 0, w, h); const fh = h / floors, cw = w / cols; for (let f = 0; f < floors; f++) for (let j = 0; j < cols; j++) { if (hash(f * 7.3 + j * 3.1 + seed) < lit) { c.fillStyle = "#ffb060"; c.fillRect(j * cw + cw * 0.28, f * fh + fh * 0.2, cw * 0.44, fh * 0.58); } } }) : null;
  return (PALT[k] = { map, em });
}
function palazzo(g, x, z, o = {}) {
  const b = grp(g, x, o.y ?? 0, z), w = o.w ?? 10, d = o.d ?? 8, floors = o.floors ?? 4, h = floors * 3.2, seed = o.seed ?? 1;
  b.rotation.y = o.rotY ?? 0;
  const walls = ["#d89a5a", "#e8c48a", "#c8704a", "#e6d2a8", "#d4a070", "#b8604a"], wall = o.wall ?? walls[Math.floor(hash(seed * 1.7) * walls.length)];
  const shut = o.shutter ?? ["#2f5a3a", "#3a4a2a", "#5a3a22", "#2a4a5a"][Math.floor(hash(seed * 2.3) * 4)];
  const tf = texFachada(wall, shut, floors, Math.max(2, Math.round(w / 2.6)), o.lit ?? 0, seed), ts = texFachada(wall, shut, floors, Math.max(2, Math.round(d / 2.6)), o.lit ?? 0, seed + 7);
  const mk = (t) => new THREE.MeshStandardMaterial({ map: t.map, roughness: 0.92, emissive: t.em ? 0xffffff : 0x000000, emissiveMap: t.em, emissiveIntensity: t.em ? (o.litI ?? 1.4) : 0 });
  const mf = mk(tf), ms = mk(ts), plain = SM(new THREE.Color(wall).getHex(), { roughness: 0.95 });
  const bx = mesh(box(w, h, d), [ms, ms, plain, plain, mf, mf], 0, h / 2, 0, b);
  mesh(box(w + 0.5, 0.45, d + 0.5), SM(0xe8dcc0), 0, h + 0.22, 0, b);
  mesh(box(w + 0.15, 0.9, d + 0.15), SM(0x9a8c78), 0, 0.45, 0, b);
  if (o.roof !== false) { const rf = texRoof([168, 84, 52], [130, 62, 40]); const rm = rf.map.clone(), rn = rf.normalMap.clone(); rm.needsUpdate = rn.needsUpdate = true; rep(rm, w / 6, 1); rep(rn, w / 6, 1);
    const shp = new THREE.Shape(); shp.moveTo(-d / 2 - 0.3, 0); shp.lineTo(d / 2 + 0.3, 0); shp.lineTo(0, d * 0.22); shp.lineTo(-d / 2 - 0.3, 0);
    const rg = new THREE.ExtrudeGeometry(shp, { depth: w + 0.4, bevelEnabled: false }); rg.translate(0, 0, -(w + 0.4) / 2); rg.rotateY(Math.PI / 2); mesh(rg, SM(0xffffff, { map: rm, normalMap: rn }), 0, h + 0.44, 0, b); }
  // sacadas com grade
  if (o.balc !== false) { const iron = SM(0x1a1614, { metalness: 0.5, roughness: 0.5 }), cols = Math.max(2, Math.round(w / 2.6)), cw = w / cols;
    for (let f = 1; f < floors; f++) for (let j = 0; j < cols; j++) { if (hash(f * 5.1 + j * 2.7 + seed) > 0.42) continue; const bxx = -w / 2 + (j + 0.5) * cw, by = f * 3.2 + 0.25; mesh(box(cw * 0.7, 0.12, 0.7), SM(0xd8ccb4), bxx, by, d / 2 + 0.35, b); mesh(box(cw * 0.7, 0.05, 0.05), iron, bxx, by + 0.95, d / 2 + 0.68, b); for (let q = 0; q < 7; q++) mesh(box(0.025, 0.9, 0.025), iron, bxx - cw * 0.33 + q * cw * 0.11, by + 0.5, d / 2 + 0.68, b); } }
  b.userData.h = h;
  return b;
}
// cúpula de igreja com lanterna (silhueta da cidade)
function cupula(g, x, z, r, o = {}) {
  const c = grp(g, x, o.y ?? 0, z), m = SM(o.col ?? 0xd8c8a8), dm = SM(o.dome ?? 0x7a8a8a, { roughness: 0.6, metalness: 0.2 });
  mesh(cyl(r * 1.05, r * 1.1, r * 1.2, 32), m, 0, r * 0.6, 0, c);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const win = mesh(box(r * 0.12, r * 0.5, 0.2), o.lit ? BM(0xffb860) : SM(0x2a2420), Math.cos(a) * r * 1.06, r * 0.6, Math.sin(a) * r * 1.06, c); win.rotation.y = -a + Math.PI / 2; }
  const dome = mesh(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), dm, 0, r * 1.2, 0, c); dome.scale.y = 1.25;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const rib = mesh(new THREE.TorusGeometry(r * 1.004, r * 0.02, 4, 24, Math.PI / 2), m, 0, r * 1.2, 0, c); rib.rotation.set(0, -a, Math.PI / 2); rib.scale.set(1.25, 1, 1); }
  mesh(cyl(r * 0.16, r * 0.18, r * 0.5, 12), m, 0, r * 2.45 + r * 0.25, 0, c); mesh(new THREE.ConeGeometry(r * 0.12, r * 0.4, 12), dm, 0, r * 2.95 + r * 0.2, 0, c);
  mesh(sph(r * 0.06, 10, 8), GOLDM(), 0, r * 3.4, 0, c);
  return c;
}
// campanário
function campanario(g, x, z, w, h, o = {}) {
  const c = grp(g, x, 0, z), m = SM(o.col ?? 0xc89a6a);
  mesh(box(w, h, w), m, 0, h / 2, 0, c);
  mesh(box(w * 1.1, 0.4, w * 1.1), SM(0xe8dcc0), 0, h, 0, c);
  [0, 1, 2, 3].forEach((i) => { const a = (i * Math.PI) / 2; const op = mesh(box(w * 0.4, w * 0.7, 0.1), o.lit ? BM(0xffb060) : BM(0x16100c), Math.sin(a) * w * 0.51, h - w * 0.6, Math.cos(a) * w * 0.51, c); op.rotation.y = a; });
  mesh(new THREE.ConeGeometry(w * 0.72, w * 1.3, 4), SM(0x8a4a30), 0, h + w * 0.65, 0, c).rotation.y = Math.PI / 4;
  return c;
}
// cipreste (árvore alta e fina, silhueta toscana)
function cipreste(g, x, y, z, h = 9, seed = 1) {
  const c = grp(g, x, y, z); mesh(cyl(0.12, 0.2, h * 0.2, 6), SM(0x3a2a1a), 0, h * 0.1, 0, c);
  const geo = foliageGeo(seed); for (let i = 0; i < 4; i++) { const b = mesh(geo, SM(new THREE.Color(0x2a3a1e).offsetHSL(0, 0, (hash(seed + i) - 0.5) * 0.06).getHex(), { roughness: 0.9 }), (hash(i * 3 + seed) - 0.5) * 0.3, h * (0.3 + i * 0.18), (hash(i * 5 + seed) - 0.5) * 0.3, c); b.scale.set(h * (0.11 - i * 0.018), h * 0.2, h * (0.11 - i * 0.018)); }
  return c;
}
// piso de pedras (calçamento) com relevo
function texCalcada(c1 = [150, 138, 122], c2 = [110, 102, 92]) {
  const k = "calc" + c1 + c2; if (TXM[k]) return TXM[k];
  return (TXM[k] = texPair(512, (u, v) => { const cx = u * 10, cy = v * 10, ix = Math.floor(cx + (Math.floor(cy) % 2) * 0.5), fx = cx + (Math.floor(cy) % 2) * 0.5 - ix, fy = cy - Math.floor(cy); const e = Math.min(fx, 1 - fx, fy, 1 - fy); return sm(clamp(e / 0.12)) * (0.8 + hash2(ix, Math.floor(cy)) * 0.2); },
    (u, v, h) => { const cy = Math.floor(v * 10), ix = Math.floor(u * 10 + (cy % 2) * 0.5); const base = mixc(c1, c2, hash2(ix * 3, cy * 7)); return h < 0.15 ? mixc(c2, [40, 36, 30], 0.6) : mixc(base, [255, 250, 240], (fbm2(u * 20, v * 20, 3, 20) - 0.5) * 0.2); }, 4));
}
function chao(g, w, d, tex, rx, ry, o = {}) {
  const map = tex.map.clone(), nm = tex.normalMap.clone(); map.needsUpdate = nm.needsUpdate = true; rep(map, rx, ry); rep(nm, rx, ry);
  const f = mesh(new THREE.PlaneGeometry(w, d), SM(0xffffff, { map, normalMap: nm, roughness: o.rough ?? 0.85, metalness: o.metal ?? 0, envMapIntensity: 1 }), o.x ?? 0, o.y ?? 0, o.z ?? 0, g); f.rotation.x = -Math.PI / 2; f.castShadow = false;
  return f;
}

// ================================================================ vídeo: Giorno · cenas 1–4
// pés plantados em posições dadas (IK) com o pé paralelo ao chão
function plantFeet(p, feet, ang, toe = [0, 0]) {
  const u = p.userData; p.updateMatrixWorld(true);
  [0, 1].forEach((i) => {
    const f = feet[i]; legIK(p, i, V3(f[0], f[1], f[2]), V3(f[0] + Math.sin(ang) * 1.2, f[1] + 0.6, f[2] + Math.cos(ang) * 1.2));
    u.knee[i].updateMatrixWorld(true); u.knee[i].getWorldQuaternion(_gq); _gq.invert(); _gq2.setFromEuler(_gE.set(-(toe[i] || 0), ang, 0, "YXZ")); u.ankle[i].quaternion.copy(_gq.multiply(_gq2));
  });
}
// posição dos pés parados (lado a lado) para um corpo em (x, z) com rumo ang
const standPos = (x, z, ang, hw = 0.11, fwd = [0.05, -0.05], y = 0) => [0, 1].map((i) => { const side = (i ? 1 : -1) * hw; return [x + Math.cos(ang) * side + Math.sin(ang) * fwd[i], y, z - Math.sin(ang) * side + Math.cos(ang) * fwd[i]]; });
const lerpF = (A, B, k) => [0, 1].map((i) => lerp3(A[i], B[i], k));
// estandarte de pano que ondula (vértices animados)
function estandarte(g, x, y, z, rotY, col = 0x8a1a1a, w = 1.3, h = 3.2) {
  const tx = canvasTex(128, 256, (c, ww, hh) => { c.fillStyle = "#" + new THREE.Color(col).getHexString(); c.fillRect(0, 0, ww, hh); c.fillStyle = "rgba(255,210,120,.85)"; c.fillRect(0, 10, ww, 8); c.fillRect(0, hh - 30, ww, 6); c.beginPath(); c.arc(ww / 2, hh * 0.42, 26, 0, 7); c.lineWidth = 5; c.strokeStyle = "rgba(255,210,120,.85)"; c.stroke(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.beginPath(); c.moveTo(ww / 2 + Math.cos(a) * 30, hh * 0.42 + Math.sin(a) * 30); c.lineTo(ww / 2 + Math.cos(a) * 42, hh * 0.42 + Math.sin(a) * 42); c.stroke(); } });
  const geo = new THREE.PlaneGeometry(w, h, 4, 10); geo.translate(0, -h / 2, 0);
  const m = mesh(geo, new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide, roughness: 0.9 }), x, y, z, g); m.rotation.y = rotY; m.userData.base = Float32Array.from(geo.attributes.position.array); m.frustumCulled = false;
  mesh(cyl(0.05, 0.05, w + 0.3, 8), SM(0x3a2a1a), x, y + 0.02, z, g).rotation.set(0, rotY, Math.PI / 2);
  return (t, wind = 1) => { const a = geo.attributes.position, b = m.userData.base; for (let i = 0; i < a.count; i++) { const xx = b[i * 3], yy = b[i * 3 + 1], k = -yy / h; a.setZ(i, b[i * 3 + 2] + (Math.sin(t * 1.7 + yy * 1.3 + x) * 0.12 + Math.sin(t * 3.1 + xx * 3 + yy * 2) * 0.04) * k * wind); } a.needsUpdate = true; geo.computeVertexNormals(); };
}
// tocheiro de ferro com chama (luz quente que tremula)
function lanternaArena(g, x, y, z) {
  const l = grp(g, x, y, z); mesh(cyl(0.12, 0.06, 0.25, 10), SM(0x2a221c, { metalness: 0.5 }), 0, 0, 0, l); mesh(cyl(0.03, 0.03, 0.5, 6), SM(0x2a221c), 0, -0.35, 0.12, l).rotation.x = 0.5;
  const fl = glowSprite(0xff9a40, 0.7, 0.85); fl.position.y = 0.22; l.add(fl); const L = new THREE.PointLight(0xff9040, 2.2, 7, 1.8); L.position.y = 0.3; l.add(L);
  l.userData = { fl, L }; TOCHAS.push(l); return l;
}
const TOCHAS = [];
function tochas(t) { TOCHAS.forEach((l, i) => { const f = 0.8 + noise1(t * 6 + i * 3) * 0.2; l.userData.fl.scale.setScalar(0.55 + 0.2 * f); l.userData.L.intensity = 2.0 * f; }); }
// painel de parede com um arco vazado (para arcadas instanciadas)
function bayGeo(w, h, aw, ah, d) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  const hole = new THREE.Path(); hole.moveTo(-aw / 2, 0); hole.lineTo(aw / 2, 0); hole.lineTo(aw / 2, ah - aw / 2); hole.absarc(0, ah - aw / 2, aw / 2, 0, Math.PI, false); hole.lineTo(-aw / 2, 0); s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 10 }); geo.translate(0, 0, -d / 2); return geo;
}

// ---------------------------------------------------------------- 1 · gancho: arena ao entardecer; o golpe para no ar, rebobina e some
addSet("s1-gancho", (g) => {
  const [a, b] = T.sc["s1-gancho"];
  const dome = skyDome(g, { top: 0x23306a, mid: 0x7a5a8a, midY: 0.16, hor: 0xffa060, ground: 0x2a1a14, sunDir: [-0.22, 0.12, -1], sunCol: 0xffb060, sunI: 1.1, disk: 2.2, cov: 0.52, cloudA: 0.85, cloudLit: 0xffc8a0, cloudSh: 0x5a3a5a, cloudScale: 0.16 });
  const hf = () => 0, Rx = 30, Rz = 22, podH = 4.2;
  // areia
  const st = texPair(512, (u, v) => fbm2(u * 24, v * 24, 4, 24) * 0.7 + fbm2(u * 90, v * 90, 2, 90) * 0.3, (u, v, h) => mixc(mixc([200, 156, 108], [232, 196, 148], fbm2(u * 5, v * 5, 4, 5)), [150, 110, 76], clamp((0.42 - h) * 1.4)), 2.2);
  rep(st.map, 9, 9); rep(st.normalMap, 9, 9);
  const fl = mesh(new THREE.CircleGeometry(1, 96), SM(0xffffff, { map: st.map, normalMap: st.normalMap, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 1 }), 0, 0, 0, g); fl.rotation.x = -Math.PI / 2; fl.scale.set(Rx + 1, Rz + 1, 1); fl.castShadow = false;
  // muro do pódio, cornija e cávea (degraus) em elipse
  const tv = texTravertino();
  const pod = mesh(new THREE.CylinderGeometry(1, 1, podH, 128, 1, true), matBlocos(tv, 26, 0.55), 0, podH / 2, 0, g); pod.scale.set(Rx, 1, Rz); pod.material.side = THREE.DoubleSide; pod.castShadow = false;
  const cor = mesh(new THREE.CylinderGeometry(1, 1, 0.45, 128, 1, true), SM(0xeadcc0, { side: THREE.DoubleSide }), 0, podH, 0, g); cor.scale.set(Rx + 0.15, 1, Rz + 0.15); cor.castShadow = false;
  const N = 11, prof = [[Rz + 0.05, podH + 0.2]];
  for (let i = 0; i < N; i++) { const r = Rz + 0.6 + i * 0.85, y = podH + 0.5 + i * 0.5; prof.push([r, y], [r + 0.85, y]); }
  prof.push([Rz + 0.6 + N * 0.85 + 0.3, podH + 0.5 + N * 0.5], [Rz + 0.6 + N * 0.85 + 0.3, 0]);
  const cav = mesh(lathe(prof, 128), matBlocos(texPedraLisa(), 40, 8, { rough: 0.95 }), 0, 0, 0, g); cav.scale.set(Rx / Rz, 1, 1); cav.material.side = THREE.DoubleSide; cav.castShadow = false;
  // arcadas em três andares (painéis com arco vazado, instanciados), com um setor em ruína
  const rOut = Rz + 0.6 + N * 0.85 + 1.4, base = podH + 0.5 + N * 0.5, bg = bayGeo(4.4, 7.2, 2.7, 5.4, 2.0);
  const bm = matBlocos(tv, 0.16, 0.16, { col: 0xf6e8d0 });
  const per = 2 * Math.PI * Math.sqrt(((rOut * Rx / Rz) ** 2 + rOut ** 2) / 2), nb = Math.floor(per / 4.4);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S1 = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3();
  for (let tier = 0; tier < 3; tier++) {
    const im = new THREE.InstancedMesh(bg, bm, nb); let k = 0;
    for (let i = 0; i < nb; i++) {
      const an = (i / nb) * Math.PI * 2, ruin = Math.sin(an * 1.0 + 0.6) > 0.55 ? 2 - Math.floor(hash(i * 3.1) * 2) : 3;
      if (tier >= ruin) continue;
      P.set(Math.sin(an) * rOut * Rx / Rz, base + tier * 7.2, Math.cos(an) * rOut);
      Q.setFromAxisAngle(V3(0, 1, 0), Math.atan2(Math.sin(an) * Rz / Rx, Math.cos(an))); M4.compose(P, Q, S1); im.setMatrixAt(k++, M4);
    }
    im.count = k; im.castShadow = true; im.receiveShadow = true; g.add(im);
    const cr = mesh(new THREE.CylinderGeometry(1, 1, 0.6, 128, 1, true), SM(0xe8d8bc, { side: THREE.DoubleSide }), 0, base + (tier + 1) * 7.2 + 0.3, 0, g); cr.scale.set(rOut * Rx / Rz - 0.9, 1, rOut - 0.9); cr.castShadow = false;
  }
  // portões da arena e estandartes
  const gateG = bayGeo(6.2, 5.6, 3.4, 4.4, 1.4), iron = SM(0x1e1a18, { metalness: 0.6, roughness: 0.5 });
  [1, -1].forEach((s) => { const gt = grp(g, 0, 0, s * (Rz + 0.1)); gt.rotation.y = s > 0 ? Math.PI : 0;
    mesh(gateG, matBlocos(tv, 0.2, 0.2), 0, 0, 0, gt); mesh(box(3.6, 4.6, 5), SM(0x1a120c, { side: THREE.BackSide }), 0, 2.3, -2.6, gt);
    mesh(box(3.5, 0.1, 5), SM(0x3a2a1c), 0, 0.02, -2.6, gt);
    for (let i = 0; i < 9; i++) mesh(box(0.06, 3.4, 0.06), iron, -1.6 + i * 0.4, 2.0 + 1.6, -0.3, gt); for (let j = 0; j < 4; j++) mesh(box(3.4, 0.06, 0.06), iron, 0, 2.3 + j * 0.6 + 1.0, -0.3, gt);
    const tl = lanternaArena(gt, 2.3, 3.0, 0.9); const tr = lanternaArena(gt, -2.3, 3.0, 0.9); });
  const flags = [];
  for (let i = 0; i < 10; i++) { const an = (i / 10) * Math.PI * 2 + 0.31; if (Math.abs(Math.cos(an)) > 0.96) continue; const x = Math.sin(an) * (Rx - 0.2), z = Math.cos(an) * (Rz - 0.2); flags.push(estandarte(g, x, podH - 0.1, z, Math.atan2(x / Rx, z / Rz) + Math.PI, i % 2 ? 0x7a1418 : 0x8a5a14)); }
  // colunas quebradas e pedras na areia
  [[-9, -6, 0.5], [11, -9, 0.35], [-12, 7, 0.7], [13, 6, 0.45]].forEach(([x, z, br], i) => coluna(g, x, z, 5, 0.42, { broken: br, mat: SM(0xe2d2b6) }));
  for (let i = 0; i < 9; i++) rock(g, (hash(i * 3) - 0.5) * 40, 0.1, (hash(i * 7) - 0.5) * 30, 0.3 + hash(i) * 0.5, i + 3, { col: 0xe8d0b0 });
  const rays = godRays(g, [-6, 30, -40], [0.22, -0.4, 1], { n: 9, len: 70, w: 5, spread: 22, opacity: 0.08, color: 0xffc080 });
  const motes = dustPts(260, [-14, 14, 0.2, 7, -16, 8], 0xffd8a0, 0.045, 0.7); g.add(motes);
  const brd = birds(g, 9, { center: [0, 26, -14], rx: 26, rz: 12, speed: 0.08 });
  const dust = dustRing(g, 0xd8b890);

  // personagens
  const gi = garoto(); g.add(gi); const GX = 0, GZ = 2.0;
  const sp = espDourado(); sp.scale.setScalar(1.12); g.add(sp);
  const bo = chefe(); g.add(bo);
  const cr = espCarmesim(); g.add(cr);
  const gh = fantasmas(g, () => chefe(), 3, 0xffc040);
  const ring = aneis(g, 4), zero = glyph(g, "0", "#ffd070", 0.9), onda = ondaDourada(g);
  const auraG = aura(g, 60, 0xffd070, 0.04), auraR = aura(g, 50, 0xff4050, 0.04);
  const clockR = grp(g); { const cm = glowM(0xffc860, 0.0); const rr = mesh(new THREE.TorusGeometry(1.6, 0.02, 6, 96), cm, 0, 0, 0, clockR); rr.rotation.x = Math.PI / 2; for (let i = 0; i < 12; i++) { const an = (i / 12) * Math.PI * 2; const tk = mesh(box(0.05, 0.02, i % 3 ? 0.18 : 0.34), cm, Math.sin(an) * 1.6, 0, Math.cos(an) * 1.6, clockR); tk.rotation.y = an; } const hd = mesh(box(0.04, 0.02, 1.3), cm, 0, 0, 0.65, clockR); clockR.userData = { cm, hd }; }

  // a investida (tempo da história σ): corre, derrapa, o espírito carmesim avança e soca
  const tS = Math.max(0.6, K.chega - 3.2), sHit = K.chega - tS, sR = sHit - 1.0, V = 5.0, ACC = 0.35;
  const runD = (s) => (s <= 0 ? 0 : s < ACC ? 0.5 * (V / ACC) * s * s : 0.5 * V * ACC + V * (s - ACC));
  const ZE = -2.9, D = runD(sR), Z0 = ZE - D, X0 = -0.15;
  const fist = V3(GX - 0.02, 1.62, GZ - 0.32);
  // pés no fim da corrida (para a derrapagem) e postura firme
  restPose(bo); const endFeet = gait(bo, D, { from: [X0, 0, Z0], ang: 0, run: 1, hf }).feet.map((f) => f.slice());
  const braced = [[X0 - 0.16, 0, ZE + 0.05], [X0 + 0.12, 0, ZE + 1.0]];
  function bossAt(p, s, t, o = {}) {
    restPose(p); idle(p, t, 21, 0.5);
    const u = p.userData;
    if (s <= sR) {
      const d = runD(s), gr = gait(p, d, { from: [X0, 0, Z0], ang: 0, run: 1, hf, lean: 0.06 }), w = smr(s, 0, 0.32);
      if (w < 1) { plantFeet(p, lerpF(standPos(X0, Z0, 0), gr.feet, w), 0); u.sh.forEach((sh) => (sh.rotation.x *= w)); }
      if (!o.ghost) { clothWind(p, t, 0.6 + 2.2 * w); hairPush(p, 0, -1.2 * w); chefeFlaps(p, t, 1 + 2 * w); }
      face(p, { angry: 0.75, brow: -0.4, open: 0.2 + 0.1 * Math.sin(t * 9) });
    } else {
      const k = smr(s, sR, sR + 0.32), zb = ZE + 0.45 * E.out(k);
      p.position.set(X0, 0, zb); p.rotation.set(0, 0, 0);
      u.hips.position.y = u.d.hipY - 0.13 * k; u.hips.rotation.set(0.1 * k, -0.25 * k, 0); u.spine.rotation.x = 0.22 * k; u.chest.rotation.y = 0.2 * k;
      plantFeet(p, lerpF(endFeet, braced, k), 0, [0, 0]);
      const pa = act(s, sR + 0.05, sR + 0.7, 0.35, 0.06);
      pose(p, { armR: [-1.45 * pa - 0.2, 0.1, -0.1, -0.15 - 0.5 * (1 - pa)], armL: [0.45, 0, 0.35, -0.9], handR: 0.1, handL: 0.8 });
      if (!o.ghost) { clothWind(p, t, 2.4 - 1.6 * k); hairPush(p, 0, 1.2 * (1 - k)); chefeFlaps(p, t, 2); }
      face(p, { angry: 0.9, brow: -0.5, open: 0.45 * pa });
    }
  }
  function crimAt(c, s, t, bp) {
    restPose(c); idle(c, t, 31, 0.6);
    const u = c.userData, appear = E.outBack(smr(s, 0.25, 0.75));
    c.scale.setScalar(Math.max(0.001, appear * 1.1));
    const behind = V3(bp.x - 0.5, 0.35 + Math.sin(t * 3) * 0.05, bp.z - 0.95), hitPos = V3(GX + 0.22, 0.12, GZ - 0.97);
    const lu = s <= sR ? 0 : act(s, sR, sHit, 0.18, 0.03);
    c.position.copy(behind.clone().lerp(hitPos, clamp(lu, -0.2, 1.05))); c.rotation.set(0, -0.12 * clamp(lu), 0);
    pose(c, { hips: [0.35 * (1 - clamp(lu)), 0, 0], legR: [0.5 * (1 - clamp(lu)) + 0.1, 0, -0.05, 0.6], legL: [0.3 * (1 - clamp(lu)) + 0.15, 0, 0.05, 0.8], spine: [0.15, 0, 0] });
    if (lu <= 0.05) pose(c, { armR: [0.6, 0, -0.25, -0.4], armL: [0.6, 0, 0.25, -0.4] });
    else if (lu < 0.5) pose(c, { armR: [0.9, 0, -0.35, -1.9], armL: [-0.5, 0, 0.3, -1.4], chest: [0, -0.45, 0], handR: 1, handL: 1 }, smr(lu, 0.05, 0.4));
    else { pose(c, { armL: [0.5, 0, 0.3, -1.2], chest: [0, 0.35, 0], handR: 1, handL: 0.9 }); armIK(c, 0, fist, V3(fist.x - 0.6, fist.y - 0.6, fist.z - 0.6), smr(lu, 0.5, 0.9)); }
    lookAtW(c, V3(GX, 1.6, GZ), 0.8);
  }
  // tempo apagado: o chefe "pula" quadros e aparece colado no garoto
  const eA = K.apagar0 - 0.12, eB = K.funcionou, XS = 0.55, Zs = GZ - 1.0, D2 = Math.hypot(XS - X0, Zs - Z0), AS = Math.atan2(XS - X0, Zs - Z0);
  function bossErase(p, e, t, o = {}) {
    restPose(p); idle(p, t, 21, 0.5); const u = p.userData;
    if (e <= 0.8) { const d = (e / 0.8) * D2; const gr = gait(p, d, { from: [X0, 0, Z0], ang: AS, run: 1, hf }); const w = smr(e, 0, 0.12); if (w < 1) plantFeet(p, lerpF(standPos(X0, Z0, AS), gr.feet, w), AS); }
    else { const k = smr(e, 0.8, 1), A = -0.5; p.position.set(XS, 0, Zs); p.rotation.set(0, A, 0); u.hips.position.y = u.d.hipY - 0.06; u.spine.rotation.x = -0.12 * k; plantFeet(p, [[XS - 0.12, 0, Zs - 0.28], [XS + 0.05, 0, Zs + 0.3]], A); pose(p, { armR: [-2.6 * k, 0, -0.3, -1.3 * k], armL: [-0.4, 0, 0.3, -0.6], handR: 1 }); }
    face(p, { angry: 1, brow: -0.6, open: 0.5 });
    if (!o.ghost) { clothWind(p, t, 2.2); chefeFlaps(p, t, 2); }
  }
  const eraseE = (t) => { if (t < eA) return 0; if (t < eB) { const q = (t - eA) / (eB - eA); return q < 0.34 ? 0 : q < 0.67 ? 0.45 : 1; } return 1 - E.in(seg(t, eB + 0.12, eB + 0.95)); };
  const sigma = (t) => rebob(t, tS, K.chega, 0.5, 1.25, E.in) * sHit;
  const lateS = Math.max(K.porque0 - 0.4, eB + 1.0);

  return {
    bg: 0x2a1c22, fogExp: 0.006, fogCol: 0xc88a68, dome,
    look: { exposure: 1.05, bloom: 0.6, bloomT: 0.8, vig: 0.42, sat: 1.12, con: 1.07, lift: [0.02, 0.0, 0.03] },
    sun: { dir: [-0.22, 0.3, -1], col: 0xffb070, I: 2.7, c: [0, 1, -3], r: 18 }, hemi: { sky: 0x8a90c8, ground: 0x7a5034, I: 0.62 }, fill: { col: 0x7a8ac8, I: 0.55, dir: [0.4, 0.3, 1] }, rim: { col: 0xffc890, str: 0.6 },
    update(t0) {
      const er = t0 >= eA && t0 < eB, t = er ? stutter(t0, 6) : t0;
      // garoto: calmo; olha o punho que parou; sorriso de canto
      restPose(gi); gi.position.set(GX, 0, GZ); gi.rotation.set(0, Math.PI, 0); idle(gi, t, 11, 0.7);
      const look = smr(t, K.nenhum, K.chega - 0.1) * (1 - smr(t, K.chega + 1.5, K.chega + 2.2));
      lookAtW(gi, fist, look * 0.9);
      if (t > K.chega + 1.5) lookAtW(gi, V3(X0, 1.4, Z0), smr(t, K.chega + 1.6, K.chega + 2.4) * 0.6);
      const smile = 0.12 + 0.25 * smr(t, K.chega + 0.2, K.chega + 0.8);
      face(gi, { smile, brow: 0.1 * smr(t, K.porque0, K.porque0 + 1), lid: 0.88 - 0.15 * (er ? 1 : 0) });
      standFeet(gi, { hf }); clothWind(gi, t, 0.7 + 0.8 * smr(t, K.porque0, K.porque0 + 1.5)); hairPush(gi, 0, 0, 0);
      // espírito dourado: atrás do garoto; ergue a palma quando o golpe chega
      restPose(sp); sp.position.set(GX - 0.45, 0.14 + Math.sin(t * 1.4) * 0.03, GZ + 0.42); sp.rotation.set(0, Math.PI, 0); idle(sp, t, 2, 0.5);
      standFeet(sp, { hf: () => sp.position.y });
      const palm = act(t, K.chega - 0.45, K.chega + 0.1, 0.2, 0.06) * (1 - smr(t, K.chega + 1.0, K.chega + 1.6));
      pose(sp, { armL: [-0.3, 0, 0.12, -0.3], handL: 0.3 });
      if (palm > 0.01) armIK(sp, 0, V3(fist.x - 0.1, fist.y + 0.03, fist.z + 0.12), V3(fist.x - 0.3, fist.y - 0.6, fist.z + 0.9), clamp(palm));
      pose(sp, { handR: 0 });
      lookAtW(sp, fist, smr(t, K.chega - 0.6, K.chega) * 0.8);
      sp.userData.eyeM.color.setScalar(1 + 2 * smr(t, K.chega - 0.1, K.chega + 0.1) * (1 - smr(t, K.chega + 0.6, K.chega + 1.2)));
      auraG(t, V3(sp.position.x, 0, sp.position.z), 0.6 + 0.4 * smr(t, K.porque0, K.porque0 + 1));
      // chefe e espírito carmesim
      let bpos;
      if (t < eA) { const s = sigma(t); bossAt(bo, s, t); crimAt(cr, s, t, bo.position); bpos = bo.position.clone(); }
      else { const e = eraseE(t0 >= eB ? t0 : t); bossErase(bo, e, t); const k = e > 0.8 ? 1 : 0; crimAt(cr, k ? sR + 0.4 : 0.3, t, bo.position); if (e > 0.8) { cr.position.set(XS + 0.45, 0.4, Zs - 0.75); cr.rotation.set(0, -0.5, 0); pose(cr, { armR: [-2.4, 0, -0.4, -1.2], armL: [-2.4, 0, 0.4, -1.2], handR: 1, handL: 1 }); } cr.scale.setScalar(e > 0.05 ? 1 : 0.001); bpos = bo.position.clone(); }
      if (t > lateS) { // depois: o chefe longe, confuso, depois de joelhos
        const kn = act(t, K.destino0 - 1.1, K.destino0 - 0.1, 0.1, 0.05);
        restPose(bo); bo.position.set(X0, 0, Z0); bo.rotation.set(0, 0, 0); idle(bo, t, 21, 1.2);
        if (kn < 0.02) { standFeet(bo, { hf }); pose(bo, { armR: [-1.9, 0.2, -0.5, -2.0], handR: 0.4, head: [0.15, 0, 0] }, smr(t, lateS, lateS + 0.8)); }
        else { kneelPose(bo, clamp(kn)); const fu = bo.userData; pose(bo, { armR: [-0.9, 0, -0.2, -1.2], armL: [-0.9, 0, 0.2, -1.2], handR: 0.3, handL: 0.3, head: [0.45 - 0.75 * smr(t, K.assustador - 0.4, K.assustador + 0.2), 0, 0] }); }
        face(bo, { brow: 0.6, sad: 0.4, open: 0.35 + 0.15 * smr(t, K.assustador - 0.3, K.assustador), lid: 1 });
        cr.scale.setScalar(Math.max(0.001, 1.1 * (1 - smr(t, lateS, lateS + 0.5))));
        clothWind(bo, t, 0.8); chefeFlaps(bo, t, 1);
      }
      auraR(t, V3(cr.position.x, cr.position.y - 0.2, cr.position.z), cr.scale.x > 0.5 ? 0.7 : 0, 0.45, 1.8);
      // fantasmas dourados no rebobinar (o chefe em instantes "mais adiante" da história)
      const rw1 = t > K.chega + 0.5 && t < K.chega + 1.75, rw2 = t0 > eB + 0.1 && t0 < eB + 1.0;
      gh.forEach((p, i) => {
        p.visible = rw1 || rw2; if (!p.visible) return;
        if (rw1) { const s = Math.min(sHit, sigma(t) + (i + 1) * 0.16); bossAt(p, s, t, { ghost: true }); p.userData.holo.uniforms.uA.value = 0.55 - i * 0.14; }
        else { const e = Math.min(1, eraseE(t0) + (i + 1) * 0.08); bossErase(p, e, t, { ghost: true }); p.userData.holo.uniforms.uA.value = 0.55 - i * 0.14; }
      });
      // anéis, "0", onda dourada, relógio em volta do chefe
      ring(t, K.chega - 0.02, fist, [0, 0, 1], 0.9, 1.0);
      const zk = smr(t, K.chega - 0.05, K.chega + 0.15) * (1 - smr(t, K.chega + 0.7, K.chega + 1.1));
      zero.position.set(fist.x + 0.02, fist.y + 0.38, fist.z - 0.05); zero.material.opacity = zk; zero.scale.setScalar(0.25 + 0.25 * E.outBack(smr(t, K.chega - 0.05, K.chega + 0.25)));
      onda(t0, eB, V3(sp.position.x, 1.3, sp.position.z), 34, 1.1);
      const ck = smr(t, K.destino0 - 0.6, K.destino0 + 0.4);
      clockR.position.set(X0, 0.08, Z0); clockR.rotation.y = -t * 0.9; clockR.userData.hd.rotation.y = -t * 4; clockR.userData.cm.opacity = ck * 0.85; clockR.scale.setScalar(1.15 - 0.25 * smr(t, K.assustador - 0.5, b));
      dust(t, K.chega - 1.0, V3(X0, 0, ZE + 0.4), 1.1, 1.1); flags.forEach((f) => f(t, 1)); tochas(t); floatDust(motes, t, 0.5, 0.25); brd(t); dome.userData.u.uOff.value.set(t * 0.004, 0);
      rays.userData.rays.forEach((r, i) => (r.material.opacity = (0.06 + 0.03 * Math.sin(t * 0.7 + i)) * (er ? 0.3 : 1)));
    },
    after(t) {
      const er = t >= eA && t < eB;
      lookApagado(er ? 1 - smr(t, eB - 0.08, eB) * 0 : 0, t);
      if (er) { const q = Math.floor(t * 6); GU.uFlash.value = hash(q * 3.3) > 0.72 ? 0.35 : 0; GU.uFlashCol.value.set(1, 0.2, 0.2); }
      else { GU.uFlashCol.value.set(1, 0.95, 0.8); GU.uFlash.value = Math.max(0, 0.6 * (1 - seg(t, eB, eB + 0.35))) * (t >= eB ? 1 : 0) + 0.12 * (1 - seg(t, K.chega - 0.02, K.chega + 0.2)) * (t >= K.chega - 0.02 ? 1 : 0); }
      const rk = (t > K.chega + 0.5 && t < K.chega + 1.75) || (t > eB + 0.1 && t < eB + 1.0) ? 1 : 0;
      lookRebobina(rk);
    },
    cam(t0) {
      const t = t0 >= eA && t0 < eB ? stutter(t0, 6) : t0;
      const c = path(t, [
        [a, [4.2, 2.6, 9.5], [0.0, 1.5, 0.5], 42],
        [Math.min(1.8, K.nenhum - 1.2), [1.5, 2.0, 6.8], [-0.05, 1.45, -1.0], 38],
        [K.nenhum - 0.2, [0.95, 1.8, 5.2], [-0.05, 1.5, 0.2], 36],
        [K.chega, [2.1, 1.68, 1.75], [0.0, 1.58, 1.78], 36],
        [K.chega + 0.5, [1.4, 1.8, 3.6], [-0.1, 1.45, -2.0], 36],
        [K.chega + 1.6, [0.9, 1.85, 5.4], [-0.1, 1.4, -6.0], 36],
        [K.apagar0 + 0.1, [0.8, 1.8, 5.6], [0.1, 1.5, -1.0], 36],
        [K.funcionou - 0.05, [0.8, 1.75, 5.2], [0.2, 1.55, -0.4], 36],
        [K.funcionou + 0.5, [1.8, 1.5, -0.6], [0.0, 1.45, 1.8], 36],
        [K.porque0 + 0.6, [-0.4, 0.8, -0.9], [-0.1, 1.75, 2.2], 34],
        [K.impossivel, [0.5, 0.7, -0.8], [-0.15, 1.75, 2.2], 33],
        [K.fica + 0.2, [1.2, 1.6, 0.4], [X0, 1.2, Z0 + 2], 36],
        [K.destino0, [-0.4, 1.5, Z0 + 3.4], [X0, 0.75, Z0], 34],
        [b, [0.3, 1.3, Z0 + 2.2], [X0, 0.8, Z0], 30],
      ]);
      const sh = impact(t, K.chega, 0.06, 0.5) + impact(t0, eB, 0.12, 0.7);
      return { ...shakeCam(c, t, sh), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 2 · a Flecha: templo em ruínas ao entardecer; a flecha atravessa o espírito e ele evolui
addSet("s2-flecha", (g) => {
  const [a, b] = T.sc["s2-flecha"];
  const dome = skyDome(g, { top: 0x1c2858, mid: 0x7a5a86, midY: 0.17, hor: 0xff9658, ground: 0x2a1a14, sunDir: [0.12, 0.09, -1], sunCol: 0xffa050, sunI: 1.15, disk: 2.6, cov: 0.56, cloudA: 0.8, cloudLit: 0xffb890, cloudSh: 0x4a3a5a, cloudScale: 0.15 });
  const FY = 0.9, hf0 = () => FY;
  const hfT = (x, z) => { const r = Math.hypot(x * 0.8, z); return r < 16 ? -0.05 : (r - 16) * 0.05 * (0.6 + fbm2(x * 0.03, z * 0.03, 3)) + Math.max(0, r - 70) * 0.3 * fbm2(x * 0.01 + 3, z * 0.01, 3); };
  terrain(g, { h: hfT, size: 420, segs: 110, grassA: 0x55642e, grassB: 0x8a8640, dirt: 0x8a7050 });
  grassField(g, 2600, [-16, 16, -18, 18], hfT, { mask: (x, z) => Math.abs(x) > 6.4 || Math.abs(z) > 10.6, colA: 0x6a7a34, colB: 0xb8a85a, s: 1.3 });
  // plataforma (estilóbato) em três degraus
  const tv = texTravertino();
  [[12.4, 20.6, 0.15], [11.6, 19.8, 0.45], [10.8, 19.0, 0.75]].forEach(([w, d, y], i) => mesh(box(w, 0.3, d), matBlocos(tv, w / 5, d / 5), 0, y, 0, g));
  // colunatas (algumas quebradas), arquitraves e fragmento de frontão
  const cm = SM(0xead8bc, { roughness: 0.85 }), colH = 7.2, colR = 0.5, tops = [];
  [-4.3, 4.3].forEach((x, si) => { for (let i = 0; i < 7; i++) { const z = -8.1 + i * 2.7, h = hash(i * 3.3 + si * 7); const br = (si === 0 && (i === 2 || i === 5)) || (si === 1 && i === 4) ? 0.25 + h * 0.4 : null; if (si === 1 && i === 1) continue; const c = coluna(g, x, z, colH, colR, { y: FY, broken: br, mat: cm }); tops.push([x, z, br == null]); } });
  const arch = (x, z0, z1) => mesh(box(1.25, 0.9, z1 - z0 + 1.2), matBlocos(tv, 0.6, 1.2), x, FY + colR * 0.9 + colH + colR * 0.9 + 0.45, (z0 + z1) / 2, g);
  arch(-4.3, -8.1, -2.7); arch(4.3, 2.7, 8.1); arch(-4.3, 5.4, 8.1);
  const ped = new THREE.Shape(); ped.moveTo(-5, 0); ped.lineTo(5, 0); ped.lineTo(0, 2.2); ped.lineTo(-5, 0);
  const pg = mesh(new THREE.ExtrudeGeometry(ped, { depth: 0.8, bevelEnabled: false }), matBlocos(tv, 0.25, 0.25), -1.2, FY + colH + 2.25, -9.3, g); pg.rotation.z = 0.06;
  mesh(box(10.8, 4.5, 0.8), matBlocos(tv, 2, 1), 0, FY + 2.25, -9.6, g);
  // tambores de coluna caídos, entulho e grama nas frestas
  [[2.2, -5.8, 0.4], [-2.8, 4.6, 1.2], [5.6, -2.0, 2.0], [-6.5, 1.0, 0.7], [3.3, 6.2, 2.6]].forEach(([x, z, r], i) => { const d = mesh(colunaGeo(1.2, 0.48), cm, x, (Math.abs(x) > 5.4 ? 0 : FY) + 0.48, z, g); d.rotation.set(0, r, Math.PI / 2); });
  for (let i = 0; i < 14; i++) rock(g, (hash(i * 3.7) - 0.5) * 12, FY + 0.05, (hash(i * 5.3) - 0.5) * 18, 0.12 + hash(i) * 0.25, i + 11, { col: 0xe0ccb0 });
  // altar com a flecha
  const alt = grp(g, -0.7, FY, -3.2); mesh(box(1.0, 0.25, 1.0), cm, 0, 0.12, 0, alt); mesh(cyl(0.32, 0.38, 0.9, 20), cm, 0, 0.7, 0, alt); mesh(box(0.85, 0.16, 0.85), cm, 0, 1.22, 0, alt);
  [[-20, -26], [24, -30], [-34, -12], [30, 4], [-26, 18], [18, 26], [-44, -40], [40, -44], [0, -52]].forEach(([x, z], i) => cipreste(g, x, hfT(x, z), z, 8 + hash(i) * 5, i + 2));
  const rays = godRays(g, [0, 14, -26], [0, -0.32, 1], { n: 10, len: 60, w: 4.5, spread: 12, opacity: 0.09, color: 0xffb070 });
  const motes = dustPts(240, [-5, 5, FY, FY + 6, -8, 6], 0xffe0b0, 0.035, 0.75); g.add(motes);
  const brd = birds(g, 6, { center: [0, 22, -30], rx: 22, rz: 8, speed: 0.07 });

  const gi = garoto(); g.add(gi);
  const sp = evoluir(espDourado({ emisI: 0.5 })); sp.scale.setScalar(1.12); g.add(sp);
  const ar = flecha(g); ar.scale.setScalar(1.1);
  const ring = aneis(g, 4, 0xffe090), burst = aura(g, 140, 0xffd070, 0.05), onda = ondaDourada(g);
  const SX = -0.7, SZ0 = 0.7, L = 0.55 * 1.12, DS = gaitStop(1.55, L), SZ1 = SZ0 - DS;
  const chestY = FY + 1.52, hitZ = SZ1 + 0.02, A0 = -3.25;
  const tA = K.atravessou;
  // a flecha: flutua sobre o altar, sobe girando, aponta, recua (antecipação) e mergulha no peito do espírito
  const P0 = V3(SX, chestY + 0.3, A0), P1 = V3(SX, chestY + 2.0, -2.3), H = V3(SX, chestY, hitZ), dirH = H.clone().sub(P1).normalize(), P1b = P1.clone().addScaledVector(dirH, -0.4);
  const arrowAt = (t) => {
    if (t < K.flecha + 0.15) return { p: P0.clone().add(V3(0, Math.sin(t * 1.6) * 0.05, 0)), aim: V3(SX, P0.y, 10), roll: t * 0.9 };
    if (t < tA - 0.6) { const k = E.inOut(seg(t, K.flecha + 0.15, tA - 0.6)); const p = P0.clone().lerp(P1, k); p.x += Math.sin(k * Math.PI) * 0.6; return { p, aim: p.clone().add(V3(0, 0, 1).lerp(dirH, sm(seg(k, 0.4, 1)))), roll: t * 0.9 + k * 6 }; }
    if (t < tA - 0.22) { const k = E.inOut(seg(t, tA - 0.6, tA - 0.22)); return { p: P1.clone().lerp(P1b, k), aim: H, roll: (tA - 0.6) * 0.9 + 6 }; }
    if (t < tA) return { p: P1b.clone().lerp(H, E.in(seg(t, tA - 0.22, tA))), aim: H.clone().addScaledVector(dirH, 2), roll: (tA - 0.6) * 0.9 + 6 };
    return { p: H.clone().addScaledVector(dirH, 0.42 * E.out(seg(t, tA, tA + 0.12))), aim: H.clone().addScaledVector(dirH, 2), roll: (tA - 0.6) * 0.9 + 6 };
  };
  return {
    bg: 0x2a1c24, fogExp: 0.0075, fogCol: 0xc88a6a, dome,
    look: { exposure: 1.18, bloom: 0.6, bloomT: 0.82, vig: 0.4, sat: 1.1, con: 1.05, lift: [0.02, 0.01, 0.03] },
    sun: { dir: [0.12, 0.26, -1], col: 0xffaa66, I: 2.6, c: [0, 1, -2], r: 14 }, hemi: { sky: 0x9a9ad0, ground: 0x7a5a3a, I: 0.78 }, fill: { col: 0xffc8a0, I: 0.7, dir: [0.7, 0.35, -0.2] }, rim: { col: 0xffc890, str: 0.6 },
    update(t) {
      // o espírito anda dois passos em direção à flecha (pés plantados), é atravessado, se arqueia, sobe e evolui
      const u = sp.userData, walkK = smr(t, K.flecha - 0.1, tA - 0.75), hitK = act(t, tA, tA + 0.7, 0.05, 0.25);
      restPose(sp); idle(sp, t, 2, 0.5);
      const rise = 0.55 * E.inOut(smr(t, K.stand, K.evoluiu)) + 0.1 * smr(t, K.evoluiu, b);
      if (rise < 0.01) gait(sp, DS * walkK, { from: [SX, FY, SZ0], ang: Math.PI, hf: hf0, arms: 0.5 });
      else { sp.position.set(SX, FY + rise, SZ1); sp.rotation.set(0, Math.PI, 0); pose(sp, { legR: [0.25, 0, -0.05, 0.5, 0.35], legL: [0.1, 0, 0.08, 0.3, 0.3] }); }
      if (rise < 0.01 && walkK >= 1) standFeet(sp, { hf: hf0 });
      const arch = clamp(hitK) * (1 - smr(t, K.evoluiu - 0.3, K.evoluiu + 0.3));
      pose(sp, { spine: [-0.32 * arch, 0, 0], chest: [-0.2 * arch, 0, 0], neck: [-0.3 * arch, 0, 0], armR: [0.3 * arch, 0, -1.1 * arch, -0.3], armL: [0.3 * arch, 0, 1.1 * arch, -0.3], handR: 0.1, handL: 0.1 });
      const open = act(t, K.virou - 0.2, K.virou + 0.8, 0.15, 0.06);
      if (t > K.evoluiu - 0.3) pose(sp, { armR: [-0.3 - 0.2 * open, 0, -0.9 * open, -0.25], armL: [-0.3 - 0.2 * open, 0, 0.9 * open, -0.25], head: [-0.12 * open, 0, 0], handR: 0, handL: 0 }, smr(t, K.evoluiu - 0.3, K.evoluiu + 0.4));
      const ev = smr(t, K.evoluiu - 0.05, K.evoluiu + 0.6);
      u.goldM.emissiveIntensity = 0.5 + 1.6 * smr(t, tA, K.stand + 0.4) * (0.75 + 0.25 * Math.sin(t * 9)) * (1 - ev) + 0.45 * ev;
      sp.scale.setScalar(1.12 * (1 + 0.1 * ev)); evoAnim(sp, t, ev);
      u.eyeM.color.setScalar(1 + 2.5 * smr(t, K.evoluiu - 0.2, K.evoluiu + 0.2));
      // a flecha: flutua girando, recua, dispara, crava e se desfaz em luz
      const st = arrowAt(t), dis = smr(t, K.evoluiu - 0.25, K.evoluiu + 0.15);
      ar.position.copy(st.p); if (t >= tA) ar.position.y += rise; ar.lookAt(st.aim.x, st.aim.y + (t >= tA ? rise : 0), st.aim.z); ar.rotateZ(st.roll);
      ar.scale.setScalar(Math.max(0.001, 1.1 * (1 - dis))); ar.userData.tipGlow.material.opacity = 0.25 + 0.15 * Math.sin(t * 5);
      // garoto: olha a flecha e o espírito; se protege do clarão e depois olha maravilhado
      restPose(gi); gi.position.set(0.2, FY, 0.45); gi.rotation.set(0, Math.PI - 0.25, 0); idle(gi, t, 11, 0.6); standFeet(gi, { hf: hf0 });
      lookAtW(gi, t < tA + 0.3 ? ar.position : V3(SX, chestY + rise + 0.3, SZ1), 0.85);
      const shield = act(t, K.evoluiu - 0.35, K.evoluiu + 0.1, 0.2, 0.05) * (1 - smr(t, K.virou + 0.1, K.virou + 0.9));
      if (shield > 0.01) armIK(gi, 1, V3(0.26, FY + 1.68, 0.21), V3(0.9, FY + 1.0, 0.6), clamp(shield));
      face(gi, { brow: 0.7 * smr(t, tA - 0.1, tA + 0.2), open: 0.25 * smr(t, tA, tA + 0.3) * (1 - smr(t, K.virou, K.virou + 0.6)), smile: 0.3 * smr(t, K.virou, K.virou + 0.8), lid: 0.95 - 0.5 * shield });
      clothWind(gi, t, 0.6 + 2.2 * smr(t, K.evoluiu - 0.1, K.evoluiu + 0.3) * (1 - smr(t, K.evoluiu + 0.8, b)) + 0.4); hairPush(gi, 0, 1.5 * smr(t, K.evoluiu - 0.1, K.evoluiu + 0.2) * (1 - smr(t, K.evoluiu + 0.6, K.evoluiu + 1.4)));
      // luz: anéis no impacto, partículas girando na transformação, onda no clarão
      const cp = V3(SX, chestY + rise, SZ1);
      ring(t, tA, cp, dirH.toArray(), 1.1, 0.9); ring(t, K.evoluiu, cp, [0, 0, -1], 2.6, 1.2);
      burst(t, V3(SX, FY + rise, SZ1), smr(t, K.stand - 0.3, K.stand + 0.5) * (1 - 0.6 * smr(t, K.evoluiu + 0.6, b)), 0.9 + 0.6 * smr(t, K.stand, K.evoluiu), 3.2);
      onda(t, K.evoluiu, cp, 18, 1.0);
      floatDust(motes, t, 0.35, 0.2); brd(t); dome.userData.u.uOff.value.set(t * 0.004, 0);
      rays.userData.rays.forEach((r, i) => (r.material.opacity = 0.07 + 0.03 * Math.sin(t * 0.6 + i * 1.7) + 0.08 * smr(t, K.evoluiu, K.evoluiu + 0.4) * (1 - smr(t, K.evoluiu + 0.6, b))));
    },
    after(t) {
      GU.uFlashCol.value.set(1, 0.92, 0.7);
      GU.uFlash.value = 0.2 * (1 - seg(t, tA, tA + 0.25)) * (t >= tA ? 1 : 0) + 0.6 * Math.pow(1 - seg(t, K.evoluiu, K.evoluiu + 0.45), 2) * (t >= K.evoluiu ? 1 : 0);
    },
    cam(t) {
      const c = path(t, [
        [a, [SX + 0.45, chestY + 0.18, A0 + 0.98], [SX, chestY + 0.33, A0 + 0.6], 30],
        [K.flecha + 0.3, [SX + 0.45, chestY + 0.25, A0 - 1.9], [SX, chestY - 0.1, SZ1 + 0.4], 36],
        [tA - 0.75, [SX + 4.2, 3.05, -1.65], [SX, 3.0, -1.6], 42],
        [tA - 0.1, [SX + 4.0, 2.9, -1.5], [SX, 2.85, -1.45], 42],
        [tA + 0.6, [SX + 2.3, chestY - 0.2, -3.6], [SX, chestY + 0.1, SZ1], 38],
        [K.evoluiu - 0.3, [SX + 1.0, FY + 0.7, -4.4], [SX + 0.2, chestY + 0.5, SZ1 + 0.3], 40],
        [K.virou, [SX + 1.7, FY + 0.45, -4.6], [SX + 0.55, chestY + 0.6, SZ1 + 0.4], 40],
        [b, [SX + 2.3, FY + 0.5, -4.2], [SX + 0.6, chestY + 0.7, SZ1 + 0.4], 38],
      ]);
      return { ...shakeCam(c, t, impact(t, tA, 0.05, 0.45) + impact(t, K.evoluiu, 0.08, 0.8)), near: 0.02 };
    },
  };
});

// ---------------------------------------------------------------- 3 · voltar a zero: espaço do tempo sobre um relógio gigante; golpes que voltam como fita rebobinada
function clockTex(size = 1024, o = {}) {
  return canvasTex(size, size, (c, w) => {
    const r = w / 2; c.fillStyle = o.bg ?? "#0d0b16"; c.fillRect(0, 0, w, w);
    for (let i = 0; i < 160; i++) { c.strokeStyle = `rgba(${hash(i) > 0.5 ? "120,110,150" : "60,50,80"},${0.05 + hash(i * 3) * 0.07})`; c.lineWidth = 1 + hash(i * 5) * 3; c.beginPath(); c.moveTo(hash(i * 7) * w, hash(i * 11) * w); c.bezierCurveTo(hash(i * 13) * w, hash(i * 17) * w, hash(i * 19) * w, hash(i * 23) * w, hash(i * 29) * w, hash(i * 31) * w); c.stroke(); }
    const gold = o.col ?? "#f2c260";
    c.strokeStyle = gold; c.fillStyle = gold;
    [[0.985, 0.012], [0.93, 0.004], [0.66, 0.006], [0.62, 0.003], [0.16, 0.005]].forEach(([k, lw]) => { c.lineWidth = w * lw; c.beginPath(); c.arc(r, r, r * k, 0, 7); c.stroke(); });
    for (let i = 0; i < 60; i++) { const an = (i / 60) * Math.PI * 2, k0 = i % 5 ? 0.9 : 0.86; c.lineWidth = w * (i % 5 ? 0.003 : 0.007); c.beginPath(); c.moveTo(r + Math.sin(an) * r * k0, r - Math.cos(an) * r * k0); c.lineTo(r + Math.sin(an) * r * 0.93, r - Math.cos(an) * r * 0.93); c.stroke(); }
    const RN = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
    c.font = `700 ${Math.round(w * 0.075)}px serif`; c.textAlign = "center"; c.textBaseline = "middle";
    RN.forEach((n, i) => { const an = (i / 12) * Math.PI * 2; c.save(); c.translate(r + Math.sin(an) * r * 0.765, r - Math.cos(an) * r * 0.765); c.rotate(an); c.fillText(n, 0, 0); c.restore(); });
    for (let i = 0; i < 24; i++) { const an = (i / 24) * Math.PI * 2; c.lineWidth = w * 0.002; c.beginPath(); c.moveTo(r + Math.sin(an) * r * 0.18, r - Math.cos(an) * r * 0.18); c.lineTo(r + Math.sin(an) * r * (i % 2 ? 0.45 : 0.58), r - Math.cos(an) * r * (i % 2 ? 0.45 : 0.58)); c.stroke(); }
  });
}
function engrenagem(g, R, teeth, th, mat) {
  const s = new THREE.Shape(), n = teeth * 4;
  for (let i = 0; i <= n; i++) { const an = (i / n) * Math.PI * 2, k = i % 4 < 2 ? 1 : 0.86; const x = Math.cos(an) * R * k, y = Math.sin(an) * R * k; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  const hole = new THREE.Path(); hole.absarc(0, 0, R * 0.3, 0, Math.PI * 2, true); s.holes.push(hole);
  for (let k = 0; k < 6; k++) { const an = (k / 6) * Math.PI * 2 + 0.26, h2 = new THREE.Path(); h2.absarc(Math.cos(an) * R * 0.6, Math.sin(an) * R * 0.6, R * 0.13, 0, Math.PI * 2, true); s.holes.push(h2); }
  return mesh(new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false, curveSegments: 6 }), mat, 0, 0, 0, g);
}
addSet("s3-zero", (g) => {
  const [a, b] = T.sc["s3-zero"];
  const dt = clockTex(2048);
  const dial = mesh(new THREE.CircleGeometry(9, 128), new THREE.MeshStandardMaterial({ map: dt, emissive: 0xffffff, emissiveMap: dt, emissiveIntensity: 0.55, roughness: 0.32, metalness: 0.35 }), 0, 0, 0, g); dial.rotation.x = -Math.PI / 2; dial.castShadow = false;
  mesh(new THREE.TorusGeometry(9.05, 0.12, 10, 128), GOLDM(), 0, 0, 0, g).rotation.x = Math.PI / 2;
  const handM = GOLDM(); handM.emissive.set(0xffa020); handM.emissiveIntensity = 0.7;
  const mkHand = (len, w) => { const hg = grp(g, 0, 0.04, 0); const m = mesh(box(w, 0.05, len), handM, 0, 0, -len / 2 + 0.4, hg); m.castShadow = false; mesh(new THREE.ConeGeometry(w * 1.6, 0.8, 4), handM, 0, 0, -len - 0.1, hg).rotation.x = -Math.PI / 2; return hg; };
  const hH = mkHand(4.2, 0.22), hM = mkHand(7.0, 0.14); mesh(cyl(0.45, 0.5, 0.12, 24), GOLDM(), 0, 0.06, 0, g);
  // relógios flutuando no escuro, engrenagens e chuva de números
  const ct = clockTex(512, { bg: "#16121e", col: "#e8b860" }), clocks = [];
  [[-12, 7, -18, 3.2], [13, 10, -22, 4.2], [-17, 3, -6, 2.4], [16, 2, 4, 2.6], [-9, 13, -30, 5.5], [6, 15, -34, 3.6], [-15, 9, 10, 3.0], [11, 6, 14, 2.2]].forEach(([x, y, z, r], i) => {
    const c = grp(g, x, y, z); c.lookAt(0, 2, 0); c.rotateZ(hash(i) * 0.6);
    mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshStandardMaterial({ map: ct, emissive: 0xffffff, emissiveMap: ct, emissiveIntensity: 0.45, roughness: 0.4 }), 0, 0, 0, c);
    mesh(new THREE.TorusGeometry(r, r * 0.05, 8, 64), GOLDM(), 0, 0, 0, c);
    const h1 = grp(c, 0, 0, 0.05), h2 = grp(c, 0, 0, 0.08); mesh(box(r * 0.06, r * 0.55, 0.02), handM, 0, r * 0.27, 0, h1); mesh(box(r * 0.04, r * 0.82, 0.02), handM, 0, r * 0.4, 0, h2);
    clocks.push({ c, h1, h2, sp: 0.4 + hash(i * 3) * 1.2, y0: y });
  });
  const gm = new THREE.MeshStandardMaterial({ color: 0x8a6a30, metalness: 0.85, roughness: 0.4, envMap: envGold(), envMapIntensity: 0.6, emissive: 0x2a1a04 }), gears = [];
  [[-8, 6, -24, 5, 24], [-1.5, 9, -26, 3.2, 16], [10, 4, -20, 4, 20], [14, 12, -28, 2.6, 14]].forEach(([x, y, z, R, n], i) => { const gg = grp(g, x, y, z); gg.lookAt(0, 4, 0); const e = engrenagem(gg, R, n, 0.6, gm); e.position.z = -0.3; gears.push({ gg, e, sp: (i % 2 ? -1 : 1) * (0.18 / R) * 4 }); });
  const digT = "0123456789".split("").map((d) => canvasTex(128, 128, (c, w) => { c.clearRect(0, 0, w, w); c.font = "700 100px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#ffd890"; c.fillText(d, w / 2, w / 2 + 6); }));
  const digits = []; for (let i = 0; i < 70; i++) { const sMat = new THREE.SpriteMaterial({ map: digT[i % 3 === 0 ? 0 : Math.floor(hash(i * 3.7) * 10)], transparent: true, depthWrite: false, blending: ADD, opacity: 0.6 }); const sp_ = new THREE.Sprite(sMat); sp_.scale.setScalar(0.5 + hash(i) * 0.9); g.add(sp_); digits.push(sp_); }
  const swirl = flowPts(320, 0xffd27a, 0.04); g.add(swirl.pts); swirl.pts.material.opacity = 0.7;
  const ring = aneis(g, 4, 0xffd070), zero = glyph(g, "0", "#ffd070", 1.0);
  // personagens
  const sp = evoluir(espDourado({ emisI: 0.5 })); sp.scale.setScalar(1.15); g.add(sp);
  const bo = chefe(); g.add(bo); const cr = espCarmesim(); cr.scale.setScalar(1.1); g.add(cr); cr.userData.glow.material.opacity = 0.05; sp.userData.glow.material.opacity = 0.08;
  const crG = fantasmas(g, () => espCarmesim(), 3, 0xff4a5a); crG.forEach((p) => p.scale.setScalar(1.1));
  const shard = grp(g); { const sm_ = new THREE.MeshStandardMaterial({ color: 0xc81830, emissive: 0xff2040, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.3 }); const sh = mesh(new THREE.OctahedronGeometry(0.09, 0), sm_, 0, 0, 0, shard); sh.scale.set(0.6, 0.6, 2.2); const gl = glowSprite(0xff3048, 0.5, 0.6); shard.add(gl); }
  const shG = Array.from({ length: 4 }, () => { const s_ = glowSprite(0xffd070, 0.3, 0); g.add(s_); return s_; });
  const auraBo = aura(g, 120, 0xff3a3a, 0.06);
  const SPP = V3(0, 0.18, 2.0), BP = V3(0.25, 0, -2.6), CR0 = V3(-0.75, 0.32, -2.2), face0 = V3(0.0, 1.98, 1.6);
  const hand0 = () => { bo.updateMatrixWorld(true); return wpos(bo.userData.wr[0]); };
  // ações (tempo da história de cada uma)
  const q = K.qualquer2, ac = K.acao, gp = K.golpe;
  const punch1 = (t) => rebob(t, q - 0.4, q + 0.18, 0.3, 0.8, E.inOut);
  const thr = (t) => { if (t < ac - 0.5) return 0; if (t < ac + 0.35) return seg(t, ac - 0.5, ac + 0.35); if (t < ac + 0.65) return 1; return 1 - E.inOut(seg(t, ac + 0.65, ac + 1.35)); };
  const punch2 = (t) => { if (t < gp - 0.45) return 0; if (t < K.nunca2 - 0.15) { const k = seg(t, gp - 0.45, K.nunca2 - 0.15); return 0.985 * (1 - Math.pow(1 - k, 2.4)); } return 0.985 * (1 - E.in(seg(t, K.nunca2 - 0.15, K.nunca2 + 0.45))); };
  function crimAt(c, k, t, fistTo) {
    restPose(c); idle(c, t, 31, 0.7);
    const hit = V3(face0.x + 0.22, 0.32, face0.z - 1.05), lu = clamp(k);
    c.position.copy(CR0.clone().lerp(hit, E.inOut(lu))); c.position.y += Math.sin(t * 2.4) * 0.03; c.rotation.set(0, -0.15 * lu, 0);
    pose(c, { hips: [0.25 * (1 - lu), 0, 0], legR: [0.25, 0, -0.05, 0.5], legL: [0.1, 0, 0.06, 0.4], spine: [0.1 + 0.15 * lu, 0, 0], chest: [0, -0.35 + 0.7 * lu, 0], armL: [0.4, 0, 0.3, -1.3], handR: 1, handL: 0.9 });
    if (lu < 0.35) pose(c, { armR: [0.7, 0, -0.35, -1.9] }, smr(lu, 0, 0.3)); else armIK(c, 0, fistTo, V3(fistTo.x - 0.6, fistTo.y - 0.6, fistTo.z - 0.7), smr(lu, 0.35, 0.8));
    lookAtW(c, face0, 0.8);
  }
  return {
    bg: 0x05060d, fogExp: 0.028, fogCol: 0x0a0a1a,
    look: { exposure: 1.1, bloom: 0.75, bloomT: 0.7, bloomR: 0.7, vig: 0.55, sat: 1.12, con: 1.08, lift: [0.0, 0.0, 0.02] },
    sun: { dir: [0.25, 1, 0.35], col: 0xffd8a0, I: 1.5, c: [0, 1, 0], r: 8 }, hemi: { sky: 0x3a3a6a, ground: 0x2a1a08, I: 0.5 }, fill: { col: 0x6a7ad8, I: 0.5, dir: [-0.5, 0.3, -0.6] }, rim: { col: 0xffd090, str: 0.8 },
    update(t) {
      // ponteiros girando para trás; no "zero" travam no XII
      const snap = smr(t, K.zero2 - 0.25, K.zero2 + 0.1), snap2 = smr(t, K.ponto - 0.2, K.ponto + 0.1);
      const spin = -(t - a) * 1.4 * (1 - snap) - (t - K.ponto) * 0.9 * (t > K.ponto + 0.6 ? 1 : 0);
      hM.rotation.y = lerp(spin * 2.2 + 1.3, 0, snap) * (1 - snap2 * 0); hH.rotation.y = lerp(spin * 0.4 + 2.2, 0, snap);
      clocks.forEach((cl, i) => { cl.h1.rotation.z = t * cl.sp * 0.35; cl.h2.rotation.z = t * cl.sp * 2.1; cl.c.position.y = cl.y0 + Math.sin(t * 0.3 + i) * 0.4; });
      gears.forEach((ge) => (ge.e.rotation.z = -t * ge.sp));
      digits.forEach((d, i) => { const ph = (t * (0.05 + hash(i * 5) * 0.06) + hash(i * 2.3)) % 1, an = hash(i) * 6.28, r = 11 + hash(i * 7) * 16; d.position.set(Math.cos(an) * r, 16 - ph * 20, Math.sin(an) * r - 4); d.material.opacity = 0.55 * Math.sin(ph * Math.PI); });
      for (let i = 0; i < 320; i++) { const ph = (t * 0.06 + hash(i * 1.3)) % 1, an = hash(i) * 6.28 + ph * 4, r = 7.0 * (1 - ph) + 1.8; swirl.pos.set([Math.cos(an) * r, 0.12 + hash(i * 3) * 0.9 * (1 - ph) + Math.sin(ph * 9 + i) * 0.05, Math.sin(an) * r], i * 3); } swirl.upd();
      // espírito dourado: flutua, observa, ergue a palma no golpe final
      restPose(sp); sp.position.set(SPP.x, SPP.y + Math.sin(t * 1.3) * 0.04, SPP.z); sp.rotation.set(0, Math.PI, 0); idle(sp, t, 2, 0.4); evoAnim(sp, t, 1);
      pose(sp, { legR: [0.15, 0, -0.04, 0.3, 0.3], legL: [0.05, 0, 0.05, 0.2, 0.25], armR: [0.05, 0, -0.18, -0.35], armL: [0.05, 0, 0.18, -0.35] });
      const palm = act(t, gp - 0.3, gp + 0.4, 0.2, 0.05) * (1 - smr(t, K.nunca2 + 0.1, K.nunca2 + 0.8));
      if (palm > 0.01) armIK(sp, 1, V3(face0.x - 0.12, face0.y - 0.02, face0.z - 0.12), V3(face0.x + 0.6, face0.y - 0.7, face0.z + 0.5), clamp(palm));
      lookAtW(sp, cr.position.clone().add(V3(0, 1.6, 0)), 0.6);
      sp.userData.eyeM.color.setScalar(1 + 1.5 * (smr(t, q - 0.1, q + 0.2) * (1 - smr(t, q + 0.6, q + 1)) + palm));
      // chefe: arremessa, a pedra volta; a vontade (aura vermelha) se acende e é sugada de volta
      restPose(bo); bo.position.copy(BP); bo.rotation.set(0, -0.05, 0); idle(bo, t, 21, 0.8); standFeet(bo, { hf: () => 0, spread: 1.6 });
      const th = thr(t), wind = clamp(th / 0.47), rel = smr(th, 0.47, 0.62);
      const will = smr(t, K.vontade - 0.2, K.vontade + 0.6) * (1 - smr(t, K.volta2 - 0.1, K.volta2 + 0.5));
      pose(bo, { armR: [-0.2 + 1.3 * wind - 2.4 * rel, 0.2, -0.35 + 0.2 * rel, -1.6 * wind + 1.3 * rel], chest: [0, 0.45 * wind - 0.7 * rel, 0], spine: [0.05 + 0.25 * will, 0, 0], handR: 1 - rel, handL: 0.4 + 0.6 * will });
      pose(bo, { armL: [-0.35 * will, 0, 0.45 * will + 0.1, -1.4 * will - 0.2], armR: [-0.35 * will, 0, -0.45 * will - 0.1, -1.4 * will - 0.2], handR: 1 }, will);
      const fin = smr(t, K.nunca2 + 0.4, K.acontece + 0.2);
      if (fin > 0) pose(bo, { armR: [-1.0, 0.3, -0.3, -1.6], handR: 0.85, head: [0.35, 0.15, 0] }, fin);
      face(bo, { angry: Math.max(0.5 * smr(t, a, q), will) * (1 - fin), brow: -0.5 * will + 0.7 * fin + 0.4 * smr(t, K.volta2, K.volta2 + 0.4) * (1 - smr(t, K.ponto + 0.5, gp)), open: 0.35 * will + 0.25 * fin, lid: 1 });
      clothWind(bo, t, 0.6 + 1.6 * will); chefeFlaps(bo, t, 1 + will); hairPush(bo, 0, 0, will * 2);
      auraBo(t, V3(BP.x, 0, BP.z), will + 0.25 * smr(t, K.volta2, K.volta2 + 0.2) * (1 - smr(t, K.volta2 + 0.2, K.volta2 + 0.8)), 0.55 + 0.4 * will, 2.4 * (1 - smr(t, K.volta2, K.volta2 + 0.7)) + 0.2);
      // pedra arremessada: voa, para na frente do espírito e volta para a mão
      const hp = hand0(), stopP = V3(face0.x + 0.05, 1.55, face0.z - 0.55), fly = smr(th, 0.55, 1), sv = th > 0.5 && th < 1.0001;
      shard.visible = th > 0.02; shard.position.copy(hp.clone().lerp(stopP, E.out(fly))); shard.lookAt(stopP); shard.rotateZ(t * 8);
      shG.forEach((s_, i) => { const kk = Math.max(0, fly - (i + 1) * 0.06); s_.position.copy(hp.clone().lerp(stopP, E.out(kk))); s_.material.opacity = sv && t > ac + 0.65 ? 0.5 - i * 0.1 : 0; });
      // espírito carmesim: soco que volta (fita rebobinando) e o golpe final que nunca chega
      const p1 = punch1(t), p2 = punch2(t), kk = Math.max(p1, p2);
      crimAt(cr, kk, t, V3(face0.x + 0.02, face0.y, face0.z - (p2 > p1 ? 0.04 : 0.02)));
      const rw = (t > q + 0.48 && t < q + 1.3) || (t > K.nunca2 - 0.12 && t < K.nunca2 + 0.5);
      crG.forEach((p, i) => { p.visible = rw; if (!rw) return; const k2 = Math.min(1, kk + (i + 1) * 0.13); crimAt(p, k2, t, V3(face0.x + 0.02, face0.y, face0.z - 0.02)); p.userData.holo.uniforms.uA.value = 0.5 - i * 0.13; });
      // anéis e "0"
      ring(t, K.zero2, V3(0, 0.1, 0), [0, 1, 0], 9, 1.4); ring(t, K.ponto, V3(0, 0.1, 0), [0, 1, 0], 9, 1.4); ring(t, q + 0.15, face0.clone().add(V3(0, 0, -0.1)), [0, 0, 1], 0.9, 0.8);
      const zk = smr(t, K.zero2 - 0.1, K.zero2 + 0.2) * (1 - smr(t, K.zero2 + 0.5, K.zero2 + 0.8)) + smr(t, K.ponto - 0.1, K.ponto + 0.2) * (1 - smr(t, K.ponto + 0.7, K.ponto + 1.0));
      zero.position.set(0, 3.0, -0.5); zero.material.opacity = zk; zero.scale.setScalar(1.0 + 1.0 * E.outBack(clamp(zk)));
    },
    after(t) {
      const rk = (t > q + 0.48 && t < q + 1.3) || (t > ac + 0.65 && t < ac + 1.35) || (t > K.nunca2 - 0.12 && t < K.nunca2 + 0.5) || (t > K.volta2 && t < K.volta2 + 0.6) ? 1 : 0;
      lookRebobina(rk);
      GU.uFlashCol.value.set(1, 0.9, 0.65); GU.uFlash.value = 0.25 * Math.pow(1 - seg(t, K.zero2, K.zero2 + 0.4), 2) * (t >= K.zero2 ? 1 : 0) + 0.2 * Math.pow(1 - seg(t, K.ponto, K.ponto + 0.4), 2) * (t >= K.ponto ? 1 : 0);
    },
    cam(t) {
      const c = path(t, [
        [a, [0.6, 17, 3.5], [0, 0, -0.2], 48],
        [K.zero2 - 0.2, [5.5, 6.0, 8.0], [0, 1.0, 0], 42],
        [q - 0.3, [-0.55, 2.35, 4.0], [0.1, 1.85, 0.6], 38],
        [q + 1.2, [-0.75, 2.3, 4.2], [0.1, 1.8, 0.4], 38],
        [ac - 0.3, [1.1, 2.1, -5.6], [0.0, 1.55, 0.8], 36],
        [ac + 1.2, [0.8, 2.0, -5.3], [0.0, 1.5, 0.9], 36],
        [K.vontade + 0.3, [0.8, 1.65, -0.2], [0.25, 1.55, -2.6], 34],
        [K.volta2 + 0.2, [1.3, 2.0, -0.3], [0.25, 1.35, -2.6], 36],
        [K.ponto + 0.4, [4.0, 4.6, -5.0], [0, 0.6, -0.8], 42],
        [gp - 0.2, [4.7, 2.0, 1.2], [0.1, 1.9, 1.3], 34],
        [K.nunca2, [4.6, 2.0, 1.1], [0.1, 1.85, 1.2], 34],
        [K.acontece, [1.6, 1.8, -0.4], [0.25, 1.45, -2.6], 36],
        [b, [1.4, 1.7, -0.7], [0.25, 1.45, -2.6], 34],
      ]);
      return { ...shakeCam(c, t, impact(t, K.zero2, 0.06, 0.6) + impact(t, K.ponto, 0.06, 0.6)), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 4 · apagar o tempo: terraço sobre os telhados ao pôr do sol; o mundo congela em vermelho e a onda dourada desfaz tudo
function varal(g, A, B, n = 4) {
  const iron = SM(0x2a2420), pts = [];
  [A, B].forEach((p) => mesh(cyl(0.04, 0.05, p[1], 8), iron, p[0], p[1] / 2, p[2], g));
  const line = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(A[0], A[1], A[2]), V3((A[0] + B[0]) / 2, Math.min(A[1], B[1]) - 0.18, (A[2] + B[2]) / 2), V3(B[0], B[1], B[2])]), 20, 0.008, 4), SM(0xd8d0c0), 0, 0, 0, g);
  const cols = [0xf4f0e6, 0x4a6aa8, 0xe8c050, 0xf0ece4, 0xb84040], cloths = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.7) / (n + 0.4), x = lerp(A[0], B[0], u), z = lerp(A[2], B[2], u), y = lerp(A[1], B[1], u) - 0.18 * Math.sin(u * Math.PI) - 0.02;
    const w = i % 2 ? 0.6 : 0.95, h = i % 2 ? 0.75 : 1.1, geo = new THREE.PlaneGeometry(w, h, 5, 7); geo.translate(0, -h / 2, 0);
    const m = mesh(geo, new THREE.MeshStandardMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, roughness: 0.95 }), x, y, z, g); m.rotation.y = Math.atan2(B[0] - A[0], B[2] - A[2]) - Math.PI / 2; m.userData.base = Float32Array.from(geo.attributes.position.array); m.frustumCulled = false; cloths.push(m);
  }
  return (t, wind = 1) => cloths.forEach((m, j) => { const a = m.geometry.attributes.position, b = m.userData.base; for (let i = 0; i < a.count; i++) { const xx = b[i * 3], yy = b[i * 3 + 1], k = -yy; a.setZ(i, b[i * 3 + 2] + (Math.sin(t * 2.6 + xx * 2.5 + yy * 3 + j) * 0.09 + Math.sin(t * 5.3 + xx * 6 + j * 2) * 0.03 + 0.14) * k * wind); a.setX(i, xx + Math.sin(t * 1.9 + yy * 4 + j) * 0.03 * k * wind); } a.needsUpdate = true; m.geometry.computeVertexNormals(); });
}
function vaso(g, x, z, s = 1, seed = 1) {
  const v = grp(g, x, 0, z); mesh(lathe([[0.001, 0], [0.32, 0], [0.4, 0.5], [0.45, 0.58], [0.001, 0.58]], 20), SM(0xb8603a), 0, 0, 0, v);
  const tr = tree(v, 0, 0.55, 0, { s: 0.22 * s, h: 9, leaf: 0x3a6a2a, blobs: 7, seed });
  const lm = SM(0xf0c830, { roughness: 0.6 }); for (let i = 0; i < 9; i++) { const a = hash(i * 3 + seed) * 6.28, r = 0.25 + hash(i * 5 + seed) * 0.25; mesh(sph(0.045, 8, 6), lm, Math.cos(a) * r, 1.3 + hash(i * 7 + seed) * 0.6, Math.sin(a) * r, v).scale.set(1, 1.3, 1); }
  return v;
}
addSet("s4-tempo", (g) => {
  const [a, b] = T.sc["s4-tempo"];
  const dome = skyDome(g, { top: 0x26346e, mid: 0x9a6a8a, midY: 0.15, hor: 0xffa868, ground: 0x2a1c18, sunDir: [1, 0.1, 0.25], sunCol: 0xffb060, sunI: 1.1, disk: 2.4, cov: 0.5, cloudA: 0.85, cloudLit: 0xffc0a0, cloudSh: 0x5a4a6a, cloudScale: 0.16 });
  const hf = () => 0;
  // terraço: piso de lajotas, mureta e balaústres, casinha da escada
  const tile = canvasTex(256, 256, (c, w, h) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = hash2(x + 1, y + 3); c.fillStyle = `rgb(${178 + v * 30},${92 + v * 20},${62 + v * 12})`; c.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); } c.fillStyle = "rgba(220,200,170,.9)"; for (let i = 0; i <= 4; i++) { c.fillRect(i * 64 - 2, 0, 4, h); c.fillRect(0, i * 64 - 2, w, 4); } });
  const fl = mesh(new THREE.PlaneGeometry(10, 8), SM(0xffffff, { map: rep(tile, 5, 4), roughness: 0.85 }), 0, 0, 0, g); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
  mesh(box(10.4, 6, 8.4), SM(0xd89a6a), 0, -3.02, 0, g);
  const wallM = SM(0xe8c89a, { roughness: 0.9 }), capM = SM(0xf2e6d0);
  [[0, -4.1, 10.4, 0.25], [-5.1, 0, 0.25, 8.4]].forEach(([x, z, w, d]) => { mesh(box(w, 1.05, d), wallM, x, 0.52, z, g); mesh(box(w + 0.1, 0.1, d + 0.1), capM, x, 1.1, z, g); });
  const balM = SM(0xf0e4cc), bi = [];
  [[5.05, 0, 0, 8.2], [0, 4.05, 10.2, 0]].forEach(([x, z, wx, wz]) => { mesh(box(Math.max(0.3, wx), 0.14, Math.max(0.3, wz)), capM, x, 1.02, z, g); mesh(box(Math.max(0.3, wx), 0.12, Math.max(0.3, wz)), capM, x, 0.06, z, g); const n = Math.round(Math.max(wx, wz) / 0.32); for (let i = 0; i < n; i++) bi.push([x + (wx ? -wx / 2 + (i + 0.5) * wx / n : 0), z + (wz ? -wz / 2 + (i + 0.5) * wz / n : 0)]); });
  const balG = lathe([[0.001, 0], [0.07, 0], [0.07, 0.06], [0.045, 0.12], [0.075, 0.4], [0.04, 0.72], [0.06, 0.8], [0.06, 0.86], [0.001, 0.86]], 10), balI = new THREE.InstancedMesh(balG, balM, bi.length);
  bi.forEach(([x, z], i) => { const M4 = new THREE.Matrix4(); M4.setPosition(x, 0.12, z); balI.setMatrixAt(i, M4); }); balI.castShadow = true; balI.receiveShadow = true; g.add(balI);
  const hut = grp(g, -3.7, 0, -2.6); mesh(box(2.4, 2.9, 2.2), SM(0xd8a878, { map: texFachada("#d8a878", "#3a4a2a", 1, 1, 0, 7).map }), 0, 1.45, 0, hut); mesh(box(2.7, 0.18, 2.5), capM, 0, 2.95, 0, hut);
  const door = mesh(box(0.06, 2.0, 0.95), SM(0x5a3a22), 1.23, 1.0, 0.3, hut); mesh(box(0.08, 0.06, 0.06), GOLDM(), 1.27, 1.0, -0.05, hut);
  const vline = varal(g, [-2.6, 2.1, 3.1], [2.4, 2.25, 3.4], 5);
  vaso(g, 4.2, -3.3, 1, 3); vaso(g, -4.3, 3.2, 0.9, 5);
  mesh(cyl(0.45, 0.45, 0.05, 20), SM(0x2a2a2a, { metalness: 0.5 }), -1.2, 0.75, 2.2, g); mesh(cyl(0.04, 0.04, 0.75, 8), SM(0x2a2a2a), -1.2, 0.37, 2.2, g);
  [[-1.8, 1.9], [-0.6, 2.4]].forEach(([x, z]) => { const ch = grp(g, x, 0, z); mesh(box(0.42, 0.04, 0.42), SM(0x3a3a3a), 0, 0.45, 0, ch); mesh(box(0.42, 0.45, 0.04), SM(0x3a3a3a), 0, 0.68, -0.2, ch); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a_, b_]) => mesh(cyl(0.015, 0.015, 0.45, 6), SM(0x2a2a2a), a_, 0.22, b_, ch)); });
  // a cidade em volta: prédios abaixo, cúpulas e campanários ao longe
  const city = grp(g);
  for (let i = 0; i < 26; i++) { const an = (i / 26) * Math.PI * 2 + hash(i) * 0.2, r = 16 + hash(i * 3) * 22; const x = Math.cos(an) * r, z = Math.sin(an) * r; if (x > 3 && Math.abs(z) < 8) continue; palazzo(city, x, z, { y: -14 + hash(i * 7) * 6, w: 9 + hash(i * 5) * 6, d: 8 + hash(i * 9) * 4, floors: 4 + Math.floor(hash(i * 11) * 3), seed: i + 2, rotY: -an + Math.PI / 2, balc: r < 26 }); }
  for (let i = 0; i < 14; i++) { const x = 30 + hash(i * 3) * 60, z = (hash(i * 7) - 0.5) * 90; palazzo(city, x, z, { y: -16 + hash(i) * 5, w: 10, d: 9, floors: 5, seed: i + 40, balc: false }); }
  cupula(city, -48, -30, 9, { y: -6 }); cupula(city, 70, 26, 11, { y: -8, dome: 0x8a9a9a }); cupula(city, -30, 52, 6, { y: -6 }); campanario(city, -22, -44, 3.4, 26, { col: 0xd8a070 }); campanario(city, 46, -40, 3, 22); campanario(city, 24, 46, 2.6, 18);
  const brd = birds(g, 8, { center: [6, 12, -2], rx: 14, rz: 9, speed: 0.1 });
  const motes = dustPts(160, [-4, 5, 0.3, 4, -3.8, 3.8], 0xffe0b0, 0.03, 0.7); g.add(motes);
  // personagens
  const gi = garoto(); g.add(gi); const GP = V3(1.9, 0, 0.55), GA = Math.PI / 2;
  const sp = evoluir(espDourado({ emisI: 0.55 })); sp.scale.setScalar(1.12); g.add(sp); sp.userData.glow.material.opacity = 0.1;
  const bo = chefe(); g.add(bo); const cr = espCarmesim(); cr.scale.setScalar(1.08); g.add(cr); cr.userData.glow.material.opacity = 0.08;
  const gh = fantasmas(g, () => chefe(), 3, 0xffc040);
  const onda = ondaDourada(g), ring = aneis(g, 4, 0xffd070);
  // a ação do chefe (tempo da história σ): sai da porta, para, anda (no tempo apagado) até atrás do garoto e ergue o punho
  const fz = K.apagar3 - 0.12, cA = K.cancelou;
  const S0 = K.chefe - 0.35, sA = Math.max(1.2, K.apagar3 - 0.15 - S0), PA0 = [-2.35, -2.25], PA1 = [-1.25, -0.55];
  const angA = Math.atan2(PA1[0] - PA0[0], PA1[1] - PA0[1]), DA = Math.hypot(PA1[0] - PA0[0], PA1[1] - PA0[1]), LA = gaitFit(DA, 0.55);
  const PB1 = [GP.x - 1.0, GP.z + 0.1], sB0 = sA + 0.35, sB = Math.max(1.0, K.king + 0.35 - S0 - sB0);
  const angB = Math.atan2(PB1[0] - (PA0[0] + Math.sin(angA) * DA), PB1[1] - (PA0[1] + Math.cos(angA) * DA)), PBs = [PA0[0] + Math.sin(angA) * DA, PA0[1] + Math.cos(angA) * DA];
  const DB = Math.hypot(PB1[0] - PBs[0], PB1[1] - PBs[1]), LB = gaitFit(DB, 0.6), sF = sB0 + sB;
  const fB = [Math.sin(angB), Math.cos(angB)], lB = [Math.cos(angB), -Math.sin(angB)];
  const sigEnd = Math.min(cA - S0, sF + 1.2);
  const sigma = (t) => { if (t < S0) return 0; if (t < cA) return Math.min(t - S0, sigEnd); return sigEnd * (1 - E.inOut(seg(t, cA + 0.1, cA + 1.3))); };
  function bossAt(p, s, t, o = {}) {
    restPose(p); idle(p, t, 21, 0.6); const u = p.userData;
    const show = s > 0.02;
    if (s <= sA) { const k = E.inOut(seg(s, 0, sA)); gait(p, DA * k, { from: [PA0[0], 0, PA0[1]], ang: angA, hf, arms: 0.8, step: LA }); if (!o.ghost) { clothWind(p, t, 0.7 + 0.6 * Math.sin(k * Math.PI)); chefeFlaps(p, t, 1.3); } }
    else if (s <= sB0) { gait(p, DA, { from: [PA0[0], 0, PA0[1]], ang: angA, hf, step: LA }); if (!o.ghost) { clothWind(p, t, 0.6); chefeFlaps(p, t, 1); } }
    else { const k = E.inOut(seg(s, sB0, sF)); gait(p, DB * k, { from: [PBs[0], 0, PBs[1]], ang: angB, hf, arms: 0.7, step: LB }); if (!o.ghost) { clothWind(p, t, 0.7 + 0.8 * Math.sin(k * Math.PI)); chefeFlaps(p, t, 1.5); } }
    const fist = act(s, sF - 0.1, sF + 0.6, 0.25, 0.08);
    if (fist > 0) pose(p, { armR: [-2.75 * clamp(fist, 0, 1.1), 0, -0.25, -1.25 * clamp(fist)], handR: 1, spine: [-0.12 * clamp(fist), 0, 0], chest: [0, -0.2 * clamp(fist), 0] });
    lookAtW(p, V3(GP.x, 1.5, GP.z), smr(s, 0.6, 1.4) * 0.8);
    face(p, { angry: 0.65 + 0.35 * clamp(fist), brow: -0.4, open: 0.15 + 0.3 * clamp(fist), lid: 0.9 });
    if (u.hat) u.hat.visible = true;
    return show;
  }
  return {
    bg: 0x2a1c22, fogExp: 0.005, fogCol: 0xc8907a, dome,
    look: { exposure: 1.08, bloom: 0.55, bloomT: 0.82, vig: 0.42, sat: 1.12, con: 1.06, lift: [0.02, 0.0, 0.03] },
    sun: { dir: [1, 0.3, 0.25], col: 0xffb070, I: 2.6, c: [0, 1, 0], r: 9 }, hemi: { sky: 0x8a90c8, ground: 0x7a5034, I: 0.62 }, fill: { col: 0x7a8ac8, I: 0.5, dir: [-1, 0.4, -0.3] }, rim: { col: 0xffc890, str: 0.55 },
    update(t) {
      // tempo do mundo: congela no tempo apagado; volta de onde parou depois
      const frozen = t >= fz && t < cA, tw = t < fz ? t : t < cA ? fz : t - (cA - fz);
      // garoto e espírito dourado (congelados no tempo apagado)
      restPose(gi); gi.position.copy(GP); gi.rotation.set(0, GA, 0); idle(gi, tw, 11, 0.7); standFeet(gi, { hf }); face(gi, { smile: 0.15, lid: 0.85 }); clothWind(gi, tw, 1.1); lookAtW(gi, V3(12, 2.4, 1.5), 0.5);
      if (frozen) gi.userData.eyes.forEach((e) => setEye(e, 0.85, 0.05, 0));
      restPose(sp); sp.position.set(GP.x - 0.35, 0.16 + Math.sin(tw * 1.3) * 0.03, GP.z - 0.85); sp.rotation.set(0, GA, 0); idle(sp, tw, 2, 0.4); evoAnim(sp, tw, 1);
      pose(sp, { legR: [0.15, 0, -0.04, 0.3, 0.3], legL: [0.05, 0, 0.05, 0.2, 0.25], armR: [0.05, 0, -0.18, -0.35], armL: [0.05, 0, 0.18, -0.35] });
      // "mesmo assim": no tempo congelado o espírito vira a cabeça sozinho para o chefe
      const turn = smr(t, K.mesmo3 - 0.2, K.mesmo3 + 1.0) * (t < cA + 0.8 ? 1 : 1 - smr(t, cA + 0.8, cA + 2.0));
      // chefe e espírito carmesim
      const s = sigma(t), show = bossAt(bo, s, t);
      const bp = bo.position;
      if (turn > 0) lookAtW(sp, V3(bp.x, 1.7, bp.z), turn);
      sp.userData.eyeM.color.setScalar(1 + 2.2 * smr(t, K.mesmo3, K.mesmo3 + 0.5) * (1 - smr(t, cA + 0.4, cA + 1.2)));
      const appear = smr(s, 0.9, 1.6);
      restPose(cr); idle(cr, t, 31, 0.6); cr.scale.setScalar(Math.max(0.001, 1.08 * E.outBack(appear)));
      const ca = bo.rotation.y; cr.position.set(bp.x - Math.sin(ca) * 0.75 - Math.cos(ca) * 0.35, 0.3 + Math.sin(t * 2.2) * 0.04, bp.z - Math.cos(ca) * 0.75 + Math.sin(ca) * 0.35); cr.rotation.set(0, ca, 0);
      const cf = act(s, sF, sF + 0.6, 0.2, 0.08);
      pose(cr, { hips: [0.1, 0, 0], legR: [0.25, 0, -0.05, 0.5], legL: [0.1, 0, 0.06, 0.4], armR: [-2.6 * clamp(cf, 0, 1.1), 0, -0.4, -1.3 * clamp(cf)], armL: [-2.6 * clamp(cf, 0, 1.1), 0, 0.4, -1.3 * clamp(cf)], handR: 1, handL: 1 });
      lookAtW(cr, V3(GP.x, 1.6, GP.z), 0.7);
      // fantasmas dourados no rebobinar
      const rw = t > cA + 0.1 && t < cA + 1.3;
      gh.forEach((p, i) => { p.visible = rw; if (!rw) return; bossAt(p, Math.min(sigEnd, s + (i + 1) * 0.35), t, { ghost: true }); p.userData.holo.uniforms.uA.value = 0.5 - i * 0.13; });
      // depois: o chefe na porta, desnorteado (cabeça para os lados)
      if (t > cA + 1.3) { const k = smr(t, cA + 1.3, cA + 2.0); bo.userData.head.rotation.y += Math.sin((t - cA) * 2.2) * 0.45 * k; face(bo, { brow: 0.8 * k, open: 0.3 * k, lid: 1 }); }
      onda(t, cA, V3(sp.position.x, 1.6, sp.position.z), 40, 1.2); ring(t, cA, V3(sp.position.x, 2.0, sp.position.z), [0, 1, 0], 4, 1.0);
      vline(tw, 1); brd(tw); floatDust(motes, tw, 0.3, 0.2); dome.userData.u.uOff.value.set(tw * 0.004, 0);
    },
    after(t) {
      const er = t >= fz && t < cA;
      lookApagado(er ? smr(t, fz, fz + 0.25) : 0, t);
      GU.uFlashCol.value.set(1, 0.92, 0.7);
      GU.uFlash.value = 0.35 * Math.pow(1 - seg(t, cA, cA + 0.4), 2) * (t >= cA ? 1 : 0) + 0.35 * Math.pow(1 - seg(t, fz, fz + 0.3), 2) * (t >= fz && t < cA ? 1 : 0);
      if (t >= fz && t < fz + 0.3) GU.uFlashCol.value.set(1, 0.15, 0.15);
      lookRebobina(t > cA + 0.1 && t < cA + 1.3 ? 1 : 0);
    },
    cam(t) {
      const c = path(t, [
        [a, [6.6, 4.0, 5.6], [-0.6, 1.0, -0.6], 42],
        [K.chefe + 0.6, [4.1, 1.65, 1.0], [-1.0, 1.4, -0.4], 38],
        [K.apagar3 + 0.3, [4.0, 1.6, 1.1], [-0.6, 1.4, -0.2], 36],
        [K.king, [3.4, 1.35, 1.6], [1.1, 1.75, 0.55], 36],
        [K.mesmo3 + 0.3, [2.7, 2.3, 1.45], [1.5, 1.98, -0.3], 32],
        [cA - 0.1, [2.85, 2.25, 1.65], [1.45, 1.95, -0.25], 34],
        [cA + 1.0, [5.6, 3.0, 3.4], [-0.8, 1.2, -0.8], 42],
        [b, [4.9, 2.1, 2.5], [-2.2, 1.3, -1.8], 38],
      ]);
      return { ...shakeCam(c, t, impact(t, cA, 0.09, 0.7)), near: 0.05 };
    },
  };
});

T.scenes.forEach(([n]) => { if (!SETS[n]) addSet(n, (g) => ({ bg: 0x101010, update() {}, cam: () => ({ pos: [0, 1, 5], look: [0, 1, 0], fov: 40 }) })); });

// ---------------------------------------------------------------- render por tempo
function sceneAt(t) { for (const [n, a, b] of T.scenes) if (t >= a && t < b) return n; return T.scenes[T.scenes.length - 1][0]; }
const _sd = new THREE.Vector3(), _col = new THREE.Color();
// luz do sol (direção, cor, força) e caixa de sombra (centro, raio)
function setSun(dir, col, I, c = [0, 0, 0], r = 30) {
  _sd.set(...dir).normalize(); sun.color.set(col); sun.intensity = I;
  sun.position.set(c[0] + _sd.x * r * 2, c[1] + _sd.y * r * 2, c[2] + _sd.z * r * 2); sun.target.position.set(...c);
  const sc = sun.shadow.camera; sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 0.5; sc.far = r * 5; sc.updateProjectionMatrix();
}
function applyLook(s) {
  const L = s.look || {};
  renderer.toneMapping = L.tm === "agx" ? THREE.AgXToneMapping : THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = L.exposure ?? 1.0;
  bloom.strength = L.bloom ?? 0.55; bloom.radius = L.bloomR ?? 0.6; bloom.threshold = L.bloomT ?? 0.82;
  GU.uVig.value = L.vig ?? 0.35; GU.uGrain.value = L.grain ?? 0.028; GU.uCA.value = L.ca ?? 0.004; GU.uSat.value = L.sat ?? 1.05; GU.uCon.value = L.con ?? 1.04;
  GU.uLift.value.set(...(L.lift ?? [0, 0, 0])); GU.uGain.value.set(...(L.gain ?? [1, 1, 1])); GU.uFlash.value = 0; GU.uFade.value = 0;
  const S_ = s.sun || {}; setSun(S_.dir ?? [0.5, 0.8, 0.4], S_.col ?? 0xfff0d8, S_.I ?? 2.4, S_.c ?? [0, 0, 0], S_.r ?? 30);
  sun.castShadow = S_.shadow !== false;
  const Hm = s.hemi || {}; hemi.color.set(Hm.sky ?? 0xbfd4ff); hemi.groundColor.set(Hm.ground ?? 0x3a3020); hemi.intensity = Hm.I ?? 0.7;
  const F = s.fill || {}; fill.color.set(F.col ?? 0x8fa8ff); fill.intensity = F.I ?? 0; fill.position.set(...(F.dir ?? [-0.6, 0.3, -0.5])); fill.target.position.set(0, 0, 0);
  RIM.col.value.set(s.rim?.col ?? 0xfff2dd); RIM.str.value = s.rim?.str ?? 0.45;
  const fc = s.fogCol ?? s.bg ?? 0x000000;
  if (s.fogExp) { if (!(scene.fog && scene.fog.isFogExp2)) scene.fog = new THREE.FogExp2(fc, s.fogExp); scene.fog.color.set(fc); scene.fog.density = s.fogExp; }
  else { if (!(scene.fog && scene.fog.isFog)) scene.fog = new THREE.Fog(fc, 30, 400); scene.fog.color.set(fc); scene.fog.near = s.fog ? s.fog[0] : 40; scene.fog.far = s.fog ? s.fog[1] : 400; }
  scene.background = _col.set(s.bg ?? 0x000000).clone();
}
function renderAt(t) {
  const n = sceneAt(t);
  for (const k in SETS) SETS[k].group.visible = k === n;
  const s = SETS[n];
  applyLook(s);
  WIND.value = t; HOLO_T.value = t; GU.uTime.value = t;
  s.update(t);
  const c = window.DBG_CAM ? { pos: window.DBG_CAM[0], look: window.DBG_CAM[1], fov: window.DBG_CAM[2] ?? 40 } : s.cam(t);
  camera.position.set(...c.pos); camera.lookAt(...c.look);
  if (s.hand !== 0) { const hh = handCam(t, s.hand ?? 0.012, 0.5); camera.position.x += hh[0]; camera.position.y += hh[1]; camera.position.z += hh[2]; camera.lookAt(...c.look); }
  if (c.roll) camera.rotateZ(c.roll);
  camera.fov = c.fov ?? 35; camera.near = c.near ?? 0.1; camera.updateProjectionMatrix();
  if (s.dome) s.dome.position.copy(camera.position);
  if (s.after) s.after(t);
  if (s.fadeIn) { const [a] = T.sc[n]; GU.uFade.value = Math.max(GU.uFade.value, 1 - seg(t, a, a + s.fadeIn)); }
  // transição curta entre cenas (mergulho no escuro) e câmera na mão sutil
  if (T.cut !== false && n !== T.scenes[0][0]) { const a0 = T.sc[n][0], d = t - a0; if (d < 0.2) { GU.uFade.value = Math.max(GU.uFade.value, Math.pow(1 - d / 0.2, 2) * 0.8); GU.uFadeCol.value.set(0, 0, 0); } }
  composer.render();
}
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady["giorno"] = (async () => {
  try { await document.fonts.load("700 48px 'Archivo Black'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  try { await renderer.compileAsync(scene, camera); } catch (e) { /* compila no primeiro quadro */ }
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
