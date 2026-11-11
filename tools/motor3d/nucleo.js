// __TITULO__
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
