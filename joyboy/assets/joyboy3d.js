// Joy Boy
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
  if (u.chest.userData.y0 == null) u.chest.userData.y0 = u.chest.position.y; else u.chest.position.y = u.chest.userData.y0;
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
function clothWind(p, t, wind = 1, lag = null) {
  const u = p.userData, lx = lag ? lag[0] : 0, ly = lag ? lag[1] : 0, lz = lag ? lag[2] : 0;
  [...(u.tails || []), ...(u.scarfTails || [])].forEach((m, j) => { const a = m.geometry.attributes.position, b = m.userData.base; for (let i = 0; i < a.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], k = -y * 2, k2 = k * k; a.setXYZ(i, x + Math.sin(t * 3.1 + y * 6 + j) * 0.012 * k * wind + lx * k2, y + k2 * 0.01 * wind + ly * k2 * 0.5, b[i * 3 + 2] - k2 * 0.05 * wind - Math.sin(t * 4.3 + x * 9 + y * 7 + j * 2) * 0.03 * k * wind + lz * k2); } a.needsUpdate = true; m.geometry.computeVertexNormals(); });
  cloakWind(p, t, wind);
}
// mola amortecida sem estado: simula a última janela de tempo a partir de uma função de posição pos(τ) -> [x,y,z]
// e devolve o atraso da ponta (em metros, no mundo). Serve para cabelo, abas do casaco, cachecol, pena, bandeira.
function mola(t, pos, o = {}) {
  const k = o.k ?? 55, c = o.c ?? 6.5, Wn = o.w ?? 1.4, dt = 1 / 120, n = Math.round(Wn / dt), t0 = t - n * dt;
  const x = [0, 0, 0], v = [0, 0, 0]; let p0 = pos(t0 - dt), p1 = pos(t0);
  for (let i = 1; i <= n; i++) { const p2 = pos(t0 + i * dt); for (let j = 0; j < 3; j++) { const acc = (p2[j] - 2 * p1[j] + p0[j]) / (dt * dt), a = -k * x[j] - c * v[j] - acc; v[j] += a * dt; x[j] += v[j] * dt; } p0 = p1; p1 = p2; }
  return x;
}
// atraso do mundo para o referencial do personagem (girado por rotation.y)
function lagLocal(p, lag) { const a = -p.rotation.y, c = Math.cos(a), s_ = Math.sin(a); return [lag[0] * c - lag[2] * s_, lag[1], lag[0] * s_ + lag[2] * c]; }
// cabelo com mola: inclina as mechas contra o atraso (lag local, em metros)
function hairMola(p, L, gain = 6) { const hg = p.userData.head.userData.hairG; if (!hg) return; const k = p.userData.head.userData.hairLong ? 1.5 : 1; hg.rotation.x += clamp(L[2] * gain * k, -0.5, 0.5); hg.rotation.z += clamp(-L[0] * gain * k, -0.5, 0.5); }
// gargalhada com o corpo inteiro: cabeça para trás, ombros sacudindo, olhos apertados, boca aberta; k = intensidade, t0 = início
function riso(p, t, k = 1, t0 = 0, o = {}) {
  if (k <= 0) return;
  const u = p.userData, f = o.freq ?? 5.2, dec = 0.55 + 0.45 * Math.exp(-Math.max(0, t - t0) * 0.5), ph = (t - t0) * f * Math.PI * 2;
  const b = Math.abs(Math.sin(ph)) * dec * k;
  u.neck.rotation.x -= 0.28 * k; u.head.rotation.x -= 0.22 * k + b * 0.06;
  u.spine.rotation.x += -0.08 * k + b * 0.07; u.chest.rotation.x += b * 0.05;
  u.chest.position.y = (u.chest.userData.y0 ?? (u.chest.userData.y0 = u.chest.position.y)) + b * 0.014;
  u.sh.forEach((sh, i) => (sh.rotation.z += (i ? 1 : -1) * b * 0.06));
  if (u.mouth) setMouth(u.mouth, 0.45 + 0.4 * b, 1);
  if (u.brows) u.brows.forEach((br, i) => { br.position.y = 0.142 + 0.006 * k; br.rotation.z = (i ? 1 : -1) * -0.2 * k; });
  u.lidOpen = 1 - 0.65 * k;
}
// pés plantados sobre uma superfície que se move (convés do navio): posições no referencial do anfitrião
function standFeetOn(p, host, o = {}) {
  const u = p.userData, sc = p.scale.x, ang = p.rotation.y, sx = Math.cos(ang), sz = -Math.sin(ang), dx = Math.sin(ang), dz = Math.cos(ang);
  host.updateMatrixWorld(true); p.updateMatrixWorld(true);
  const hq = new THREE.Quaternion(); host.getWorldQuaternion(hq);
  [0, 1].forEach((i) => {
    const side = (i ? 1 : -1) * (u.d.hipW + 0.03) * sc * (o.spread ?? 1), fwd = (i ? 0.08 : -0.06) * sc;
    const fl = V3_(p.position.x + sx * side + dx * fwd, (o.y ?? 0), p.position.z + sz * side + dz * fwd);
    const fw = host.localToWorld(fl.clone()), pole = host.localToWorld(fl.clone().add(V3_(dx, 0.6 * sc, dz)));
    legIK(p, i, fw, pole);
    u.knee[i].updateMatrixWorld(true); u.knee[i].getWorldQuaternion(_gq); _gq.invert();
    _gq2.copy(hq).multiply(new THREE.Quaternion().setFromEuler(_gE.set(0, ang + (i ? 0.1 : -0.1), 0, "YXZ")));
    u.ankle[i].quaternion.copy(_gq.multiply(_gq2));
  });
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
  const tie = mesh(box(0.022, 0.2, 0.006), SM(0xc89a3a, { metalness: 0.5, roughness: 0.55 }), 0, 0.16, 0.124, u.chest); tie.rotation.x = -0.12; tie.castShadow = false;
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
// reflexo noturno para água e metais à noite: céu azul-escuro, luzes da cidade e a lua
let _envNoite = null;
function envNoite() {
  if (_envNoite) return _envNoite;
  const tx = canvasTex(1024, 512, (c, w, h) => { const g_ = c.createLinearGradient(0, 0, 0, h); g_.addColorStop(0, "#0a1430"); g_.addColorStop(0.45, "#1c2a4e"); g_.addColorStop(0.5, "#3a3a50"); g_.addColorStop(0.56, "#0c0e16"); g_.addColorStop(1, "#04060a"); c.fillStyle = g_; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const x = hash(i * 3.1) * w, y = h * (0.4 + hash(i * 7.7) * 0.11); c.fillStyle = `rgba(255,${170 + hash(i) * 60 | 0},${90 + hash(i * 5) * 60 | 0},${0.5 + hash(i * 9) * 0.5})`; c.fillRect(x, y, 3 + hash(i * 11) * 5, 3 + hash(i * 13) * 4); }
    c.fillStyle = "#e8ecff"; c.beginPath(); c.arc(w * 0.42, h * 0.18, 14, 0, 7); c.fill(); });
  tx.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); _envNoite = pm.fromEquirectangular(tx).texture; pm.dispose();
  return _envNoite;
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

// painel de parede com um arco vazado (para arcadas instanciadas)
function bayGeo(w, h, aw, ah, d) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  const hole = new THREE.Path(); hole.moveTo(-aw / 2, 0); hole.lineTo(aw / 2, 0); hole.lineTo(aw / 2, ah - aw / 2); hole.absarc(0, ah - aw / 2, aw / 2, 0, Math.PI, false); hole.lineTo(-aw / 2, 0); s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 10 }); geo.translate(0, 0, -d / 2); return geo;
}

// ================================================================ vídeo: Quem é o Joy Boy? (comum)
// Personagens e símbolos originais: nada desenhado da série; nomes só no texto e na narração.
// Animação v4: tecido e cabelo com mola (reagem a arrancadas, paradas e ao balanço do navio), gargalhada com o corpo
// inteiro, pés plantados no convés que balança, elefante de quatro patas com os pés plantados, gigante de ferro que
// desperta com antecipação, expressões presas à fala e câmera contínua.

// ---------------------------------------------------------------- câmera: posição em curva contínua (Catmull-Rom), olhar sem ultrapassar o alvo
// (o ponto de olhar interpola suave entre as chaves; evita a câmera "chicotear" quando os alvos estão muito longe um do outro)
function path2(t, ks) {
  const c = path(t, ks), n = ks.length;
  if (t <= ks[0][0] || t >= ks[n - 1][0]) return c;
  let i = 0; while (i < n - 2 && t > ks[i + 1][0]) i++;
  const u = sm(seg(t, ks[i][0], ks[i + 1][0]));
  return { ...c, look: lerp3(ks[i][2], ks[i + 1][2], u) };
}
// ---------------------------------------------------------------- utilidades de pose (pés plantados em posições dadas)
function plantFeet(p, feet, ang, toe = [0, 0]) {
  const u = p.userData; p.updateMatrixWorld(true);
  [0, 1].forEach((i) => {
    const f = feet[i]; legIK(p, i, V3(f[0], f[1], f[2]), V3(f[0] + Math.sin(ang) * 1.2, f[1] + 0.6, f[2] + Math.cos(ang) * 1.2));
    u.knee[i].updateMatrixWorld(true); u.knee[i].getWorldQuaternion(_gq); _gq.invert(); _gq2.setFromEuler(_gE.set(-(toe[i] || 0), ang, 0, "YXZ")); u.ankle[i].quaternion.copy(_gq.multiply(_gq2));
  });
}
const standPos = (x, z, ang, hw = 0.11, fwd = [0.05, -0.05], y = 0) => [0, 1].map((i) => { const side = (i ? 1 : -1) * hw; return [x + Math.cos(ang) * side + Math.sin(ang) * fwd[i], y, z - Math.sin(ang) * side + Math.cos(ang) * fwd[i]]; });

// ---------------------------------------------------------------- personagens (originais)
// chapéu de três pontas com pena
function tricornio(head, col = 0x1a1410, trim = 0xc8a050, pena = 0xf2ede0) {
  const h = grp(head, 0, 0.215, -0.005); h.rotation.x = 0.08;
  const m = TM(col);
  ol(mesh(cyl(0.085, 0.095, 0.09, 20), m, 0, 0.035, 0, h), 0.003);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + Math.PI / 3; const w = grp(h, 0, -0.005, 0); w.rotation.y = a; const b = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.01, 24, 1, false, -0.55, 1.1), m, 0, 0, 0, w); b.rotation.x = 0; const up = grp(w, 0, 0, 0.13); const wall = mesh(box(0.2, 0.07, 0.012), m, 0, 0.03, 0, up); up.rotation.x = -0.75; mesh(box(0.2, 0.008, 0.014), TM(trim), 0, 0.066, 0, up); }
  const pl = grp(h, 0.06, 0.06, -0.02); pl.rotation.set(-0.5, 0, -0.5);
  mesh(lockGeo([[0, 0, 0], [0.02, 0.08, -0.03], [0.05, 0.16, -0.09], [0.08, 0.2, -0.16]], 0.022, 0.004, 0.3, 12, 6), TM(pena, { side: THREE.DoubleSide }), 0, 0, 0, pl);
  h.userData.pena = pl;
  return h;
}
function bandana(head, col) { const b = mesh(new THREE.TorusGeometry(0.083, 0.014, 6, 30), TM(col), 0, 0.182, -0.012, head); b.rotation.x = Math.PI / 2 + 0.28; b.scale.set(1, 1.12, 1); const k = mesh(sph(0.02, 8, 6), TM(col), 0, 0.15, -0.105, head); return b; }
// o capitão que ri: barba cheia, casaco comprido verde-escuro, chapéu de três pontas com pena
const CAPITAO = { hair: 0x2a1a12, hairStyle: "longo", hairLen: 0.85, beard: 0x2a1a12, skin: SKINS.media, iris: 0x3a2a1a, jacket: 0x1e4a48, shirt: 0xe8e0cc, pants: 0x2a2430, boots: 0x1a120c, belt: 0x4a2a14, coatTail: true, jacketOpen: 0.36, cuff: 0xc8a050, seed: 41, brow: 0x2a1a12, lip: 0x9a5848 };
function barba(head, col, zAt) {
  const m = TM(col, { side: THREE.DoubleSide }), b = grp(head, 0, 0, 0);
  // barba de mechas que nascem na linha da mandíbula (abaixo da boca, que fica livre para rir)
  for (let row = 0; row < 2; row++) for (let i = 0; i < 22; i++) {
    const a = (i / 21 - 0.5) * 2.3, x = Math.sin(a) * 0.066, y = 0.036 - row * 0.016 - (1 - Math.cos(a)) * 0.03 + Math.min(0.012, Math.abs(a) * 0.012), z = (zAt ? zAt(x, y) : 0.07) - 0.006;
    const len = 0.05 + (1 - Math.abs(a) / 1.2) * 0.035 + hash(i + row * 31) * 0.012, dz = Math.cos(a) * 0.022, dx = Math.sin(a) * 0.012;
    mesh(lockGeo([[x, y, z], [x + dx * 0.5, y - len * 0.5, z + dz], [x + dx, y - len, z + dz * 0.6]], 0.008, 0.002, 0.55, 6, 5), m, 0, 0, 0, b);
  }
  mesh(sph(1, 12, 10), m, 0, 0.018, (zAt ? zAt(0, 0.022) : 0.07) - 0.012, b).scale.set(0.035, 0.022, 0.02);
  [-1, 1].forEach((k) => mesh(lockGeo([[k * 0.004, 0.069, (zAt ? zAt(0, 0.069) : 0.09) + 0.002], [k * 0.018, 0.066, (zAt ? zAt(k * 0.018, 0.066) : 0.09) + 0.001], [k * 0.032, 0.058, (zAt ? zAt(k * 0.032, 0.058) : 0.08) - 0.002], [k * 0.04, 0.064, (zAt ? zAt(k * 0.04, 0.064) : 0.08) - 0.006]], 0.0055, 0.0018, 0.6, 8, 5), m, 0, 0, 0, b));
  return b;
}
function capitao(o = {}) { const p = pessoa({ ...CAPITAO, beard: null, ...o }); const u = p.userData; u.tails.forEach((tl) => tl.scale.set(1.2, 1.35, 1)); u.hat = tricornio(u.head); u.hat.scale.setScalar(0.86); u.barba = barba(u.head, CAPITAO.beard, (x, y) => surfZ(u.headM, x, y)); return p; }
// tripulação (variações)
function tripulante(i) {
  const V = [
    { hair: 0x1a1210, hairStyle: "careca", skin: SKINS.morena, jacket: null, shirt: 0xd8c8a8, pants: 0x3a3028, boots: 0x2a1c12, belt: 0x5a3a1a, beard: 0x1a1210, seed: 51, band: 0xb8302a, dims: { shW: 0.21, chest: 0.21 } },
    { hair: 0x8a5a2a, hairStyle: "curto", skin: SKINS.clara, jacket: 0x3a4a6a, shirt: 0xf0e8dc, pants: 0x2a2a34, boots: 0x1a1410, seed: 52, band: 0xe8e0d0, dims: { thigh: 0.46, shin: 0.46 } },
    { hair: 0xa8402a, hairStyle: "longo", skin: SKINS.clara, jacket: 0x5a2a3a, shirt: 0xe8d8c0, pants: 0x2a2028, boots: 0x3a2014, seed: 53, lip: 0xc05a5a, hairLen: 1.2 },
    { hair: 0xb8b0a8, hairStyle: "curto", skin: SKINS.media, jacket: 0x4a3a28, shirt: 0xd0c8b0, pants: 0x3a3a3a, boots: 0x2a2018, beard: 0xc8c0b8, seed: 54, eyepatch: true },
  ][i % 4];
  const p = pessoa(V); if (V.band) bandana(p.userData.head, V.band); return p;
}
// o jovem pirata (original): cabelo preto bagunçado, camisa branca larga, bandana azul no pescoço
const JOVEM = { hair: 0x141218, hairStyle: "espetado", skin: SKINS.media, iris: 0x2a1a12, jacket: null, shirt: 0xf2eee4, pants: 0x34343e, boots: 0x3a2a1a, belt: 0x6a3a1a, scarf: 0x2a5ab8, seed: 61, brow: 0x141218, lip: 0xa85a50 };
const jovem = (o = {}) => pessoa({ ...JOVEM, ...o });
// o homem de luz (Joy Boy): silhueta de luz quente com um cachecol comprido; o rosto fica escondido pela luz
function homemLuz(o = {}) {
  const p = pessoa({ hairStyle: "curto", hair: 0xffffff, jacket: 0xffffff, coatTail: true, scarf: 0xffffff, fingers: true, seed: 71, ...o });
  const u = p.userData, core = new THREE.MeshBasicMaterial({ color: new THREE.Color(o.cor ?? 0xffd49a).multiplyScalar(o.brilho ?? 1.05) }), edge = olMat(0.008, 0xff9a30);
  p.traverse((c) => { if (c.isMesh) { if (c.userData.isOutline) c.material = edge; else { c.material = core; c.castShadow = false; } } });
  u.eyes.forEach((e) => (e.g.visible = false)); u.brows.forEach((b) => (b.visible = false)); if (u.mouth) u.mouth.g.visible = false;
  [...u.tails, ...u.scarfTails].forEach((tl) => tl.scale.set(1.1, o.cachecol ?? 2.2, 1));
  const gl = glowSprite(0xffc870, 3.2, 0.2); gl.position.y = 1.1; p.add(gl); const hg = glowSprite(0xfff0d0, 0.7, 0.55); hg.position.set(0, 0.12, 0.02); u.head.add(hg);
  const L = new THREE.PointLight(0xffc870, o.luz ?? 2.0, 7, 1.6); L.position.set(0, 1.3, 0.6); p.add(L);
  u.core = core; u.glow = gl; u.L = L;
  return p;
}

// ---------------------------------------------------------------- mar animado (ondas somadas) e o navio que balança nele
const ONDAS = [[0.9, 0.11, 0.0, 0.85], [0.55, 0.19, 1.3, 1.25], [0.32, 0.31, 2.4, 1.7], [0.18, 0.47, 0.6, 2.3]]; // amplitude, número de onda, direção, velocidade
function ondaH(x, z, t, A = 1) { let h = 0; for (const [a, k, d, sp] of ONDAS) { const dx = Math.cos(d), dz = Math.sin(d); h += a * A * Math.sin((x * dx + z * dz) * k - t * sp); } return h; }
function oceano(g, o = {}) {
  const size = o.size ?? 420, segs = o.segs ?? 150, A = o.amp ?? 1;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs); geo.rotateX(-Math.PI / 2);
  const cols = new Float32Array(geo.attributes.position.count * 3); geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  const m = mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.rough ?? 0.2, metalness: 0.25, envMap: o.env ?? envGold(), envMapIntensity: o.envI ?? 0.55 }), o.x ?? 0, o.y ?? 0, o.z ?? 0, g); m.castShadow = false; m.frustumCulled = false;
  const base = Float32Array.from(geo.attributes.position.array), deep = new THREE.Color(o.deep ?? 0x0c2a3a), crest = new THREE.Color(o.crest ?? 0x5a8a98), foam = new THREE.Color(o.foam ?? 0xe8f0f0), c = new THREE.Color();
  return { m, upd(t) {
    const a = geo.attributes.position;
    for (let i = 0; i < a.count; i++) { const x = base[i * 3] + (o.x ?? 0), z = base[i * 3 + 2] + (o.z ?? 0), h = ondaH(x, z, t, A); a.setY(i, h); const k = clamp((h / (1.5 * A) + 0.5)); c.copy(deep).lerp(crest, k); if (k > 0.86) c.lerp(foam, (k - 0.86) * 4); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    a.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeVertexNormals();
  } };
}
// pose do navio sobre as ondas: altura, arfagem (proa sobe e desce) e balanço lateral
function naviaPose(x, z, ang, t, L = 12, W = 3.4, A = 1) {
  const fx = Math.sin(ang), fz = Math.cos(ang), sx = Math.cos(ang), sz = -Math.sin(ang);
  const hb = ondaH(x + fx * L * 0.42, z + fz * L * 0.42, t, A), hs = ondaH(x - fx * L * 0.42, z - fz * L * 0.42, t, A);
  const hp = ondaH(x - sx * W * 0.5, z - sz * W * 0.5, t, A), hr = ondaH(x + sx * W * 0.5, z + sz * W * 0.5, t, A);
  return { y: (hb + hs + hp + hr) / 4, pitch: Math.atan2(hb - hs, L * 0.84) * 0.8, roll: Math.atan2(hr - hp, W) * 0.55 };
}
// casco por seções (proa afinando, quilha curva, popa alta)
function cascoGeo(L, W, D) {
  const nz = 28, nt = 16, pos = [], idx = [];
  for (let i = 0; i <= nz; i++) {
    const u = i / nz, z = (u - 0.5) * L, bow = u > 0.72 ? Math.pow((u - 0.72) / 0.28, 1.6) : 0, stern = u < 0.1 ? (0.1 - u) / 0.1 : 0;
    const w = W * 0.5 * (1 - bow * 0.95) * (1 - stern * 0.12), d = D * (1 - bow * 0.45), top = 0.15 * bow * D + 0.35 * stern * D;
    for (let j = 0; j <= nt; j++) { const th = -Math.PI / 2 + (j / nt) * Math.PI; pos.push(Math.sin(th) * w, top - Math.cos(th) * d + (Math.abs(Math.sin(th)) > 0.95 ? 0 : 0), z); }
  }
  for (let i = 0; i < nz; i++) for (let j = 0; j < nt; j++) { const a = i * (nt + 1) + j, b = a + nt + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const uv = []; for (let i = 0; i <= nz; i++) for (let j = 0; j <= nt; j++) uv.push(i / nz * 4, j / nt); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}
// bandeira com o sol que ri (símbolo original)
const solRiTex = canvasTex(256, 192, (c, w, h) => {
  c.fillStyle = "#141018"; c.fillRect(0, 0, w, h); const cx = w / 2, cy = h / 2, r = 44;
  c.fillStyle = "#ffd25a"; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(a - 0.12) * r * 1.05, cy + Math.sin(a - 0.12) * r * 1.05); c.lineTo(cx + Math.cos(a) * r * 1.7, cy + Math.sin(a) * r * 1.7); c.lineTo(cx + Math.cos(a + 0.12) * r * 1.05, cy + Math.sin(a + 0.12) * r * 1.05); c.fill(); }
  c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); c.fillStyle = "#141018";
  c.beginPath(); c.ellipse(cx - 15, cy - 10, 5, 8, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(cx + 15, cy - 10, 5, 8, 0, 0, 7); c.fill();
  c.beginPath(); c.arc(cx, cy + 4, 24, 0.15, Math.PI - 0.15); c.lineTo(cx - 22, cy + 10); c.fill();
});
function bandeira(g, x, y, z, w = 2.2, h = 1.5, tex = solRiTex) {
  const geo = new THREE.PlaneGeometry(w, h, 10, 6); geo.translate(w / 2, -h / 2, 0);
  const m = mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }), x, y, z, g); m.userData.base = Float32Array.from(geo.attributes.position.array); m.frustumCulled = false;
  return { m, upd(t, wind = 1) { const a = geo.attributes.position, b = m.userData.base; for (let i = 0; i < a.count; i++) { const xx = b[i * 3], yy = b[i * 3 + 1], k = xx / w; a.setZ(i, (Math.sin(t * 5.5 - xx * 3.2) * 0.16 + Math.sin(t * 8.1 - xx * 5 + yy * 2) * 0.05) * k * wind); a.setY(i, yy - k * k * 0.12 * (1.2 - wind * 0.4)); } a.needsUpdate = true; geo.computeVertexNormals(); } };
}
// vela que enfuna (pano preso à verga)
function vela(g, x, y, z, w, h, col = 0xf0e6d0) {
  const geo = new THREE.PlaneGeometry(w, h, 8, 8); geo.translate(0, -h / 2, 0);
  const m = mesh(geo, new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.95 }), x, y, z, g); m.userData.base = Float32Array.from(geo.attributes.position.array); m.frustumCulled = false;
  return (t, wind = 1) => { const a = geo.attributes.position, b = m.userData.base; for (let i = 0; i < a.count; i++) { const xx = b[i * 3] / (w / 2), yy = -b[i * 3 + 1] / h, bel = (1 - xx * xx) * Math.sin(yy * Math.PI) * (0.55 + 0.08 * Math.sin(t * 1.7)) * wind; a.setZ(i, bel + Math.sin(t * 3 + yy * 4 + xx * 2) * 0.03 * wind); } a.needsUpdate = true; geo.computeVertexNormals(); };
}
// navio original (galeão): casco, convés, castelo de popa, mastros com velas, cordame, gurupés e figura de proa
function navio(g, o = {}) {
  const nv = grp(g), L = o.L ?? 13, W = o.W ?? 3.6, D = o.D ?? 1.9, deckY = 0.55;
  const tp = texPlanks([120, 82, 50], [92, 62, 38]), wood = SM(0xffffff, { map: rep(tp.map.clone(), 2, 1), normalMap: tp.normalMap, roughness: 0.8 }); wood.map.needsUpdate = true;
  const hullM = SM(o.casco ?? 0x5a3a24, { map: rep(texPlanks([110, 70, 44], [80, 52, 32]).map.clone(), 4, 1), roughness: 0.75 }); hullM.map.needsUpdate = true;
  const hull = mesh(cascoGeo(L, W, D), hullM, 0, deckY, 0, nv); hull.material.side = THREE.DoubleSide;
  mesh(box(W * 0.92, 0.12, L * 0.84), wood, 0, deckY - 0.02, -L * 0.04, nv);
  mesh(box(W * 0.98, 0.18, L * 0.86), SM(o.faixa ?? 0xc8a050, { metalness: 0.5, roughness: 0.4 }), 0, deckY - 0.35, -L * 0.04, nv).scale.set(1, 1, 1);
  // amuradas
  [-1, 1].forEach((sd) => { mesh(box(0.1, 0.55, L * 0.78), wood, sd * W * 0.45, deckY + 0.28, -L * 0.06, nv); mesh(box(0.16, 0.06, L * 0.78), SM(0x3a2414), sd * W * 0.45, deckY + 0.57, -L * 0.06, nv); });
  // castelo de popa com janelas acesas
  const cast = grp(nv, 0, deckY, -L * 0.36); mesh(box(W * 0.9, 1.6, L * 0.22), wood, 0, 0.8, 0, cast); mesh(box(W * 0.96, 0.12, L * 0.24), SM(0x3a2414), 0, 1.62, 0, cast);
  for (let i = 0; i < 3; i++) mesh(box(0.5, 0.45, 0.06), o.noite ? BM(0xffb860) : SM(0x2a2218), (i - 1) * 0.9, 0.85, -L * 0.11 - 0.02, cast);
  // mastros, vergas e velas
  const masts = o.mastros ?? [[0.12, 9.5], [-0.2, 8.0]], velas = [];
  masts.forEach(([zf, hgt], i) => {
    const z = zf * L, m = mesh(cyl(0.11, 0.16, hgt, 10), SM(0x5a3a22), 0, deckY + hgt / 2, z, nv);
    [[0.55, 3.2, 2.6], [0.85, 2.4, 1.8]].forEach(([yf, w, h]) => { const y = deckY + hgt * yf; mesh(cyl(0.06, 0.06, w + 0.4, 8), SM(0x4a3020), 0, y, z, nv).rotation.z = Math.PI / 2; velas.push(vela(nv, 0, y - 0.05, z + 0.08, w, h, o.vela ?? 0xf0e6d0)); });
    mesh(cyl(0.12, 0.12, 0.25, 10), SM(0x3a2414), 0, deckY + hgt * 0.7, z, nv);
  });
  const topMast = masts[0], flag = bandeira(nv, 0, deckY + topMast[1] + 0.1, topMast[0] * L, o.bw ?? 1.9, o.bh ?? 1.3, o.flagTex ?? solRiTex);
  // gurupés e cordame
  const bs = mesh(cyl(0.07, 0.11, 4.2, 8), SM(0x5a3a22), 0, deckY + 1.0, L * 0.55, nv); bs.rotation.x = Math.PI / 2 - 0.35;
  const rope = SM(0x2a2018);
  masts.forEach(([zf, hgt]) => [-1, 1].forEach((sd) => { const a = V3(sd * W * 0.45, deckY + 0.5, zf * L - 1.2), b = V3(0, deckY + hgt * 0.92, zf * L), d = b.clone().sub(a); const r = mesh(cyl(0.012, 0.012, d.length(), 4), rope, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, nv); r.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); }));
  // figura de proa: um sol dourado
  const fh = grp(nv, 0, deckY + 0.35, L * 0.5); const gm = GOLDM(); mesh(cyl(0.32, 0.32, 0.08, 24), gm, 0, 0, 0, fh).rotation.x = Math.PI / 2;
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = mesh(new THREE.ConeGeometry(0.07, 0.3, 4), gm, Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0, fh); r.rotation.z = a - Math.PI / 2; }
  fh.rotation.x = -0.4;
  shadows(nv);
  nv.userData = { velas, flag, deckY, L, W };
  return nv;
}

// ---------------------------------------------------------------- a pedra indestrutível (cubo de pedra escura com inscrições originais)
const glifoTex = canvasTex(512, 512, (c, w, h) => {
  c.fillStyle = "#000"; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 5; c.lineCap = "round";
  for (let r = 0; r < 9; r++) for (let k = 0; k < 9; k++) { const x = 40 + k * 50, y = 40 + r * 50, s = hash(r * 9 + k);
    c.beginPath(); if (s < 0.25) { c.arc(x, y, 12, 0.4, 5.5); } else if (s < 0.5) { c.moveTo(x - 12, y - 12); c.lineTo(x, y + 12); c.lineTo(x + 12, y - 12); } else if (s < 0.75) { c.moveTo(x - 12, y); c.lineTo(x + 12, y); c.moveTo(x, y - 12); c.lineTo(x, y + 12); c.arc(x, y, 6, 0, 7); } else { c.rect(x - 10, y - 10, 20, 20); c.moveTo(x - 10, y + 14); c.lineTo(x + 10, y + 14); } c.stroke(); }
}, { linear: true });
function pedraEterna(g, x, y, z, s = 2.4) {
  const st = texPair(256, (u, v) => fbm2(u * 6, v * 6, 4, 6) * 0.7 + 0.3, (u, v, h) => mixc([60, 22, 26], [92, 40, 42], h), 2.0);
  const m = new THREE.MeshStandardMaterial({ map: st.map, normalMap: st.normalMap, roughness: 0.55, metalness: 0.15, emissive: 0xffc060, emissiveMap: glifoTex, emissiveIntensity: 0 });
  const c = mesh(box(s, s, s), m, x, y + s / 2, z, g);
  return { c, m };
}

// ---------------------------------------------------------------- o gigante de ferro (colosso antigo original)
function colosso(o = {}) {
  const root = new THREE.Group(), sc = o.s ?? 1;
  const rt = texPair(256, (u, v) => fbm2(u * 8, v * 8, 4, 8), (u, v, h) => mixc(mixc([92, 86, 80], [70, 60, 52], h), [140, 70, 40], clamp((fbm2(u * 3 + 5, v * 3, 3, 3) - 0.55) * 3) * 0.6), 2.5);
  const metal = new THREE.MeshStandardMaterial({ map: rt.map, normalMap: rt.normalMap, roughness: 0.6, metalness: 0.65, envMap: envGold(), envMapIntensity: 0.35 });
  const dark = SM(0x2a2622, { metalness: 0.5, roughness: 0.6 }), glowC = new THREE.MeshBasicMaterial({ color: 0xffb040 });
  const hips = grp(root, 0, 2.2, 0), torso = grp(hips, 0, 0.4, 0), head = grp(torso, 0, 3.0, 0.2);
  mesh(box(2.4, 1.0, 1.6), metal, 0, 0, 0, hips);
  const tb = mesh(sph(1, 24, 18), metal, 0, 1.5, 0, torso); tb.scale.set(1.7, 1.6, 1.25);
  mesh(box(3.6, 0.5, 1.4), metal, 0, 2.5, 0, torso);
  const core = mesh(sph(0.34, 18, 14), glowC, 0, 1.7, 1.22, torso); const coreG = glowSprite(0xffb040, 2.4, 0.0); coreG.position.set(0, 1.7, 1.5); torso.add(coreG);
  mesh(new THREE.TorusGeometry(0.42, 0.07, 8, 24), dark, 0, 1.7, 1.18, torso);
  for (let i = 0; i < 5; i++) mesh(box(2.2, 0.08, 0.1), dark, 0, 0.6 + i * 0.36, 1.12 + Math.sin(i) * 0.02, torso).rotation.x = 0.1;
  const hd = mesh(new THREE.CylinderGeometry(0.72, 0.85, 1.25, 8, 1), metal, 0, 0.6, 0, head); mesh(new THREE.ConeGeometry(0.73, 0.45, 8), metal, 0, 1.45, 0, head).rotation.y = Math.PI / 8; mesh(box(0.14, 0.9, 1.5), dark, 0, 1.35, 0, head); mesh(box(1.5, 0.3, 0.3), dark, 0, 0.2, 0.62, head);
  const visor = mesh(box(1.1, 0.12, 0.2), glowC, 0, 0.72, 0.74, head); const visG = glowSprite(0xffb040, 1.6, 0); visG.position.set(0, 0.62, 0.8); head.add(visG);
  mesh(box(0.25, 0.5, 0.25), dark, 0, 1.35, 0, head);
  const arms = [-1, 1].map((k) => {
    const sh = grp(torso, k * 2.0, 2.3, 0); mesh(sph(0.6, 16, 12), metal, 0, 0, 0, sh);
    const up = mesh(cyl(0.42, 0.36, 2.0, 14), metal, 0, -1.0, 0, sh); const el = grp(sh, 0, -2.0, 0); mesh(sph(0.42, 14, 10), dark, 0, 0, 0, el);
    mesh(cyl(0.36, 0.32, 1.8, 14), metal, 0, -0.9, 0, el); const hand = grp(el, 0, -1.9, 0); mesh(box(0.8, 0.7, 0.5), metal, 0, -0.3, 0, hand);
    for (let f = 0; f < 3; f++) { const fg = grp(hand, (f - 1) * 0.25, -0.65, 0.05); mesh(cyl(0.1, 0.09, 0.45, 8), dark, 0, -0.22, 0, fg); fg.rotation.x = -0.4; }
    return { sh, el, hand };
  });
  const legs = [-1, 1].map((k) => { const hp = grp(hips, k * 0.85, -0.3, 0); mesh(cyl(0.55, 0.45, 1.8, 14), metal, 0, -0.9, 0, hp); const kn = grp(hp, 0, -1.8, 0); mesh(sph(0.5, 14, 10), dark, 0, 0, 0, kn); mesh(cyl(0.45, 0.5, 1.7, 14), metal, 0, -0.85, 0, kn); mesh(box(0.9, 0.35, 1.4), metal, 0, -1.75, 0.3, kn); return { hp, kn }; });
  // musgo e trepadeiras (ficou parado por séculos)
  const moss = SM(0x3a5a2a, { roughness: 1 }); for (let i = 0; i < 18; i++) { const a = hash(i * 3) * 6.28; const ms = mesh(sph(0.25 + hash(i) * 0.3, 8, 6), moss, Math.cos(a) * 1.5, 0.4 + hash(i * 5) * 2.6, Math.sin(a) * 1.1, torso); ms.scale.y = 0.4; }
  shadows(root); root.scale.setScalar(sc);
  root.userData = { hips, torso, head, arms, legs, core, coreG, visor, visG, glowC, metal };
  return root;
}
// pose sentada do colosso; acorda (0..1) com antecipação mecânica
function colossoPose(c, t, wake = 0, raise = 0) {
  const u = c.userData;
  u.hips.position.y = 1.0; u.legs.forEach((l, i) => { l.hp.rotation.set(-1.45, 0, (i ? 1 : -1) * 0.18); l.kn.rotation.x = 1.5; });
  u.torso.rotation.x = 0.35 - 0.3 * wake + Math.sin(t * 0.8) * 0.005 * wake; u.head.rotation.x = 0.6 - 0.75 * wake + (wake > 0 && wake < 1 ? Math.sin(t * 40) * 0.01 : 0);
  u.arms.forEach((a, i) => { a.sh.rotation.set(-0.5 + 0.2 * wake, 0, (i ? 1 : -1) * 0.35); a.el.rotation.x = -0.5; });
  if (raise > 0) { const a = u.arms[1]; a.sh.rotation.set(lerp(-0.3, -2.4, raise), lerp(0, -0.3, raise), lerp(0.35, 0.15, raise)); a.el.rotation.x = lerp(-0.5, -0.15, raise); a.hand.rotation.x = -0.6 * raise; }
  u.glowC.color.setRGB(1 * (0.15 + 0.85 * wake), 0.7 * (0.15 + 0.85 * wake), 0.25 * (0.15 + 0.85 * wake));
  u.coreG.material.opacity = 0.55 * wake + 0.4 * raise; u.visG.material.opacity = 0.5 * wake;
}

// ---------------------------------------------------------------- o elefante gigante (original), com as quatro patas plantadas
function elefante(o = {}) {
  const root = new THREE.Group(), sc = o.s ?? 1;
  const st = texPair(512, (u, v) => fbm2(u * 20, v * 20, 4, 20) * 0.5 + Math.abs(Math.sin(v * 140 + fbm2(u * 6, v * 6, 3, 6) * 6)) * 0.5, (u, v, h) => mixc([96, 92, 98], [132, 126, 128], h), 3.0);
  const skin = new THREE.MeshStandardMaterial({ map: rep(st.map, 3, 3), normalMap: rep(st.normalMap, 3, 3), roughness: 0.9 });
  const body = grp(root, 0, 0, 0); const B = mesh(sph(1, 32, 24), skin, 0, 0, 0, body); B.scale.set(1.0, 0.95, 1.55);
  // marcas antigas (faixas douradas desbotadas)
  const mk = SM(0xb89a5a, { roughness: 0.7, metalness: 0.3 }); for (let i = 0; i < 3; i++) { const r = mesh(new THREE.TorusGeometry(1.02, 0.03, 6, 48, Math.PI), mk, 0, 0, -0.6 + i * 0.6, body); r.rotation.y = Math.PI / 2; r.scale.set(1, 0.95, 1); }
  const head = grp(body, 0, 0.35, 1.45); mesh(sph(0.62, 24, 18), skin, 0, 0, 0, head).scale.set(1, 1.05, 0.95);
  const ears = [-1, 1].map((k) => { const e = grp(head, k * 0.42, 0.08, -0.12); const eg = new THREE.CircleGeometry(0.5, 20); eg.scale(1, 1.25, 1); eg.translate(k * 0.42, -0.1, 0); deform(eg, (v) => { v.z += (v.x * v.x) * 0.3; }); const m = mesh(eg, new THREE.MeshStandardMaterial({ map: st.map, side: THREE.DoubleSide, roughness: 0.9, color: 0xb8a8a8 }), 0, 0, 0, e); m.rotation.y = k * 0.35; return e; });
  [-1, 1].forEach((k) => { const tk = mesh(lockGeo([[0, 0, 0], [k * 0.08, -0.25, 0.18], [k * 0.1, -0.35, 0.48], [k * 0.05, -0.2, 0.75]], 0.07, 0.02, 0.9, 12, 8), SM(0xf2e8d2, { roughness: 0.5 }), k * 0.28, -0.25, 0.4, head); });
  [-1, 1].forEach((k) => { const ey = mesh(sph(0.05, 10, 8), BM(0x1a1210), k * 0.5, 0.12, 0.32, head); });
  const trunk = []; let par = grp(head, 0, -0.2, 0.55); for (let i = 0; i < 9; i++) { const r = 0.2 * (1 - i * 0.075); mesh(cyl(r * 0.92, r, 0.28, 12), skin, 0, -0.14, 0, par); const nx = grp(par, 0, -0.28, 0); trunk.push(par); par = nx; }
  // patas: coxa e canela (dois ossos para o IK), pés redondos
  const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    const hip = grp(body, sx * 0.62, -0.45, sz * 0.95); mesh(cyl(0.34, 0.3, 1.05, 14), skin, 0, -0.52, 0, hip);
    const knee = grp(hip, 0, -1.05, 0); mesh(sph(0.3, 12, 10), skin, 0, 0, 0, knee); mesh(cyl(0.3, 0.34, 0.95, 14), skin, 0, -0.47, 0, knee);
    const foot = grp(knee, 0, -0.95, 0); mesh(cyl(0.36, 0.38, 0.16, 16), SM(0x6a6060), 0, -0.02, 0, foot);
    return { hip, knee, foot, sx, sz };
  });
  const tail = grp(body, 0, 0.2, -1.5); mesh(lockGeo([[0, 0, 0], [0, -0.4, -0.15], [0, -0.85, -0.1]], 0.05, 0.02, 0.9, 8, 6), skin, 0, 0, 0, tail);
  // floresta e ruínas nas costas
  const back = grp(body, 0, 0.82, 0); const grass = SM(0x4a6a2a, { roughness: 1 }); const gm = mesh(sph(1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.35), grass, 0, -0.62, 0, back); gm.scale.set(0.95, 0.8, 1.45);
  for (let i = 0; i < 26; i++) { const a = hash(i * 3.3) * 6.28, r = Math.sqrt(hash(i * 5.7)) * 0.75, x = Math.cos(a) * r * 0.8, z = Math.sin(a) * r * 1.3; const tg = grp(back, x, -0.1 - r * r * 0.25, z); mesh(cyl(0.02, 0.035, 0.35, 5), SM(0x4a3020), 0, 0.17, 0, tg); const f = mesh(foliageGeo(i), SM(new THREE.Color(0x3a6a2a).offsetHSL((hash(i) - 0.5) * 0.04, 0, (hash(i * 2) - 0.5) * 0.1).getHex(), { roughness: 0.85 }), 0, 0.42, 0, tg); f.scale.setScalar(0.16 + hash(i * 7) * 0.12); }
  mesh(box(0.3, 0.25, 0.3), SM(0xc8b898), 0.25, -0.05, -0.35, back); mesh(cyl(0.05, 0.05, 0.4, 6), SM(0xc8b898), -0.3, 0.08, 0.4, back);
  shadows(root); root.scale.setScalar(sc);
  const D = { hipY: 2.45, L1: 1.05, L2: 1.0 };
  root.userData = { body, head, ears, trunk, legs, tail, D };
  return root;
}
// passo do elefante: sequência lateral (TE, DT? etc.) com cada pé plantado no apoio; d = distância andada (unidades do elefante)
function elefanteAnda(e, d, t, o = {}) {
  const u = e.userData, sc = e.scale.x, L = o.step ?? 0.9, ang = e.rotation.y, from = o.from ?? [0, 0, 0], hf = o.hf ?? (() => 0);
  const dx = Math.sin(ang), dz = Math.cos(ang);
  const px = from[0] + dx * d * sc, pz = from[2] + dz * d * sc;
  e.position.set(px, hf(px, pz), pz);
  const cyc = d / (2 * L), ph = cyc * Math.PI * 2;
  u.body.position.y = u.D.hipY + Math.cos(ph * 2) * 0.03; u.body.rotation.z = Math.sin(ph) * 0.025; u.body.rotation.x = Math.sin(ph * 2) * 0.008;
  e.updateMatrixWorld(true);
  const offs = [0.0, 0.5, 0.75, 0.25];
  u.legs.forEach((lg, i) => {
    const dd = d + offs[i] * 2 * L, k = Math.floor(dd / (2 * L)), uu = dd / (2 * L) - k, stance = 0.7;
    const plant = (kk) => kk * 2 * L - offs[i] * 2 * L + stance * L;
    let fd, lift = 0; if (uu < stance) fd = plant(k); else { const s = E.inOut((uu - stance) / (1 - stance)); fd = lerp(plant(k), plant(k + 1), s); lift = Math.sin(s * Math.PI) * 0.35; }
    const target = e.localToWorld(V3(lg.sx * 0.62, 0.17 + lift, lg.sz * 0.95 + (fd - d)));
    const pole = e.localToWorld(V3(lg.sx * 0.62, 1.2, lg.sz * 0.95 + (lg.sz > 0 ? -2.5 : 2.5)));
    ik2(lg.hip, lg.knee, u.D.L1, u.D.L2 + 0.12, target, pole, 1, 1);
  });
  // tromba balançando em onda (cada segmento com atraso), orelhas abanando, rabo
  u.trunk.forEach((s, i) => { s.rotation.x = (o.ergue ?? 0) * -0.42 * (i < 7 ? 1 : 0.5) + Math.sin(t * 1.6 - i * 0.55) * 0.08 * (1 - (o.ergue ?? 0)) + 0.05; s.rotation.z = Math.sin(t * 1.1 - i * 0.4) * 0.05; });
  u.ears.forEach((ea, i) => (ea.rotation.y = (i ? -1 : 1) * (0.15 + 0.25 * Math.max(0, Math.sin(t * 2.2 + i))) + (o.ergue ?? 0) * (i ? -0.5 : 0.5)));
  u.head.rotation.x = -0.25 * (o.ergue ?? 0) + Math.sin(ph * 2) * 0.02; u.tail.rotation.set(Math.sin(t * 1.4) * 0.2, 0, Math.sin(t * 2.3) * 0.3);
}

// ---------------------------------------------------------------- palmeira, painel holográfico, peixes
function palmeira(g, x, y, z, h = 6, seed = 1) {
  const p = grp(g, x, y, z), bend = 0.6 + hash(seed) * 0.8, dir = hash(seed * 3) * 6.28;
  const pts = [0, 0.3, 0.6, 1].map((u) => [Math.cos(dir) * bend * u * u, h * u, Math.sin(dir) * bend * u * u]);
  mesh(lockGeo(pts, 0.18, 0.11, 1, 12, 9), SM(0x6a5038, { roughness: 1 }), 0, 0, 0, p);
  const top = V3(...pts[3]), lm = SM(0x2a5a28, { side: THREE.DoubleSide, roughness: 0.85 }), leaves = [];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + hash(seed + i) * 0.4, len = 2.2 + hash(i * 3 + seed) * 0.8; const lg = new THREE.PlaneGeometry(len, 0.55, 8, 1); lg.translate(len / 2, 0, 0); deform(lg, (v) => { v.y -= (v.x / len) ** 2 * 1.1; v.z += Math.abs(v.y) * 0.0; }); const lf = mesh(lg, lm, top.x, top.y, top.z, p); lf.rotation.set(0, -a, -0.15); leaves.push(lf); }
  return { p, leaves, upd(t, w = 1) { leaves.forEach((lf, i) => (lf.rotation.z = -0.15 + Math.sin(t * 1.3 + i * 0.7 + seed) * 0.06 * w)); } };
}
function cardume(g, n, c, R, cor = 0xd8e8f0) {
  const geo = new THREE.ConeGeometry(0.06, 0.24, 5); geo.rotateX(Math.PI / 2);
  const im = new THREE.InstancedMesh(geo, SM(cor, { metalness: 0.6, roughness: 0.3 }), n); im.frustumCulled = false; g.add(im);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3();
  return (t) => { for (let i = 0; i < n; i++) { const a = t * 0.35 + (i / n) * Math.PI * 2 * 0.25 + hash(i) * 0.6, r = R * (0.7 + hash(i * 3) * 0.5); P.set(c[0] + Math.cos(a) * r, c[1] + Math.sin(t * 0.8 + i) * 0.4 + (hash(i * 5) - 0.5) * 1.2, c[2] + Math.sin(a) * r); Q.setFromEuler(new THREE.Euler(0, -a, 0)); M4.compose(P, Q, S); im.setMatrixAt(i, M4); } im.instanceMatrix.needsUpdate = true; };
}

// ================================================================ vídeo: Joy Boy · cenas 1–4
// lanterna de mão que balança com mola (pêndulo) presa à mão de quem segura
function lanternaMao(g) {
  const l = grp(g); const piv = grp(l); mesh(cyl(0.008, 0.008, 0.16, 4), SM(0x2a221c), 0, -0.08, 0, piv);
  const body = grp(piv, 0, -0.24, 0); mesh(cyl(0.09, 0.1, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0xffd8a0, emissive: 0xffa040, emissiveIntensity: 1.6, transparent: true, opacity: 0.9 }), 0, 0, 0, body);
  mesh(new THREE.ConeGeometry(0.11, 0.08, 8), SM(0x2a221c), 0, 0.13, 0, body); mesh(cyl(0.1, 0.1, 0.03, 8), SM(0x2a221c), 0, -0.1, 0, body);
  const gl = glowSprite(0xffb050, 1.4, 0.6); body.add(gl); const L = new THREE.PointLight(0xffa040, 2.6, 9, 1.7); body.add(L);
  return { l, piv, upd(pos, lag, t) { l.position.copy(pos); piv.rotation.set(clamp(lag[2] * 9, -0.9, 0.9), 0, clamp(-lag[0] * 9, -0.9, 0.9)); L.intensity = 2.4 + noise1(t * 7) * 0.4; } };
}

// ---------------------------------------------------------------- 1 · gancho: praia de uma ilha misteriosa à noite; o capitão abre a câmara e cai na gargalhada
addSet("s1-gancho", (g) => {
  const [a, b] = T.sc["s1-gancho"];
  const dome = skyDome(g, { top: 0x050a20, mid: 0x0e1a3c, midY: 0.14, hor: 0x2a3456, ground: 0x04060a, sunDir: [0.15, 0.2, 1], sunCol: 0xd8e4ff, sunI: 0, cov: 0.55, cloudA: 0.45, cloudLit: 0x6a7aa8, cloudSh: 0x0a1020, stars: 1.4 });
  const moon = mesh(sph(26, 40, 30), BM(0xe6e8f0, { fog: false }), 30, 70, 330, g); const mg = glowSprite(0x9aaae8, 110, 0.13); mg.material.fog = false; moon.add(mg);
  const hf = (x, z) => -Math.max(0, z - 1.5) * 0.09 - Math.max(0, z - 10) * 0.12 + fbm2(x * 0.2, z * 0.2, 3) * 0.12 - 0.06;
  terrain(g, { h: (x, z) => (z < -7 ? 3 + fbm2(x * 0.1, z * 0.1, 4) * 6 : hf(x, z)), size: 200, segs: 140, grassA: 0x8a8070, grassB: 0xa8a090, dirt: 0x9a8c78, rock: 0x4a4a52 });
  const sea = oceano(g, { y: -1.3, z: 120, size: 240, segs: 110, deep: 0x06121e, crest: 0x2a4258, foam: 0xa8b8c8, env: envNoite(), envI: 1.1, amp: 0.45 });
  // falésia com a câmara de pedra
  for (let i = 0; i < 16; i++) rock(g, -22 + i * 3 + hash(i) * 2, 1.5 + hash(i * 3) * 2.5, -8.5 - hash(i * 7) * 3, 3.2 + hash(i * 5) * 2.5, i + 30, { col: 0x8a8a96, flat: 1.1 });
  const vault = grp(g, 0, 0, -6.3);
  const vg = bayGeo(5.6, 5.2, 2.6, 3.9, 1.6), stoneM = SM(0x8a8478, { map: texPedraLisa([140, 132, 120], [110, 104, 96]).map, roughness: 0.9 });
  mesh(vg, stoneM, 0, 0, 0, vault);
  const carv = canvasTex(512, 512, (c, w, h) => { c.fillStyle = "#000"; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 6; c.beginPath(); c.arc(w / 2, h * 0.3, 70, 0, 7); c.stroke(); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * 85, h * 0.3 + Math.sin(a) * 85); c.lineTo(w / 2 + Math.cos(a) * 125, h * 0.3 + Math.sin(a) * 125); c.stroke(); } c.beginPath(); c.arc(w / 2, h * 0.32, 38, 0.2, Math.PI - 0.2); c.stroke(); }, { linear: true });
  const doorM = new THREE.MeshStandardMaterial({ color: 0x9a948a, map: texPedraLisa([150, 142, 130], [118, 112, 104]).map, roughness: 0.85, emissive: 0xffc060, emissiveMap: carv, emissiveIntensity: 0 });
  const doorH = grp(vault, -1.3, 0, 0.55); const door = mesh(box(2.6, 3.9, 0.35), doorM, 1.3, 1.95, 0, doorH);
  const inner = mesh(box(2.5, 3.8, 3.0), new THREE.MeshBasicMaterial({ color: 0x9a7438, side: THREE.BackSide }), 0, 1.9, -1.0, vault);
  const vL = new THREE.PointLight(0xffc860, 0, 30, 1.2); vL.position.set(0, 1.8, -0.6); vault.add(vL);
  const vGlow = glowSprite(0xffd070, 4.5, 0); vGlow.position.set(0, 1.9, -0.6); vault.add(vGlow);
  const beam = godRays(g, [0, 2.0, -6.0], [0, 0.1, 1], { n: 9, len: 22, w: 1.8, spread: 2.2, opacity: 0, color: 0xffd890 });
  const sky = godRays(g, [0, 0.5, -6.2], [0, 1, 0.15], { n: 6, len: 60, w: 2.6, spread: 2.0, opacity: 0, color: 0xffd890 });
  const palms = [[-7, 2.5], [-9.5, -1], [8, 1.5], [10.5, -2.5], [-13, 4], [13, 5]].map(([x, z], i) => palmeira(g, x, hf(x, z), z, 6 + hash(i) * 2.5, i + 3));
  for (let i = 0; i < 12; i++) rock(g, (hash(i * 3.1) - 0.5) * 26, -0.1, (hash(i * 5.3)) * 10 - 3, 0.25 + hash(i) * 0.5, i + 60, { col: 0x8a8a90 });
  const flies = dustPts(140, [-8, 8, 0.3, 5, -6, 4], 0xffe0a0, 0.04, 0.0); g.add(flies);
  // a tripulação sobe a praia (pés plantados no declive) e para diante da câmara
  const cap = capitao(); g.add(cap);
  const crew = [0, 1, 2, 3].map((i) => { const p = tripulante(i); g.add(p); return p; });
  const lan = lanternaMao(g);
  const ENDS = [[0, -4.75], [-1.35, -3.85], [1.25, -3.75], [-0.55, -3.05], [0.65, -2.95]], WALK = 4.2;
  const all = [cap, ...crew];
  const fits = all.map((_, i) => gaitFit(WALK + (i ? 0.0 : 0.25), 0.62));
  const tW0 = a + 0.1, tW1 = Math.max(tW0 + 2.0, K.descobriu - 0.9);
  const walkD = (i, t) => (WALK + (i ? 0 : 0.25)) * E.inOut(smr(t, tW0 + i * 0.08, tW1 + i * 0.05));
  const posOf = (i, t) => { const d = walkD(i, t), e = ENDS[i]; return [e[0], hf(e[0], e[1] + (WALK + (i ? 0 : 0.25)) - d), e[1] + (WALK + (i ? 0 : 0.25)) - d]; };
  const openK = (t) => E.inOut(smr(t, K.descobriu - 0.35, K.descobriu + 0.9));
  return {
    bg: 0x050812, fogExp: 0.008, fogCol: 0x0e1628, dome,
    look: { exposure: 1.25, bloom: 0.75, bloomT: 0.7, bloomR: 0.7, vig: 0.5, sat: 1.05, con: 1.08, lift: [0.0, 0.01, 0.04] },
    sun: { dir: [0.2, 0.55, 1], col: 0xa8bcff, I: 1.1, c: [0, 1, -3], r: 12 }, hemi: { sky: 0x34446e, ground: 0x14161c, I: 0.6 }, fill: { col: 0x6a7ab8, I: 0.4, dir: [-0.5, 0.3, -0.4] }, rim: { col: 0xb8c8ff, str: 0.7 },
    update(t) {
      const ok = openK(t);
      doorH.rotation.y = 1.6 * ok; doorM.emissiveIntensity = 0.9 * smr(t, K.descobriu - 0.6, K.descobriu - 0.2) * (1 - 0.6 * ok);
      vL.intensity = 3.2 * ok; vGlow.material.opacity = 0.32 * ok; inner.visible = ok > 0.02;
      beam.userData.rays.forEach((r, i) => (r.material.opacity = (0.05 + 0.02 * Math.sin(t * 2 + i)) * ok));
      const up = smr(t, K.fica - 0.4, K.fica + 1.2); sky.userData.rays.forEach((r, i) => (r.material.opacity = 0.12 * up * (0.8 + 0.2 * Math.sin(t * 1.5 + i))));
      flies.material.opacity = 0.8 * ok;
      // caminhada com pés plantados e mola no cabelo/casaco (atraso calculado pela trajetória)
      all.forEach((p, i) => {
        const e = ENDS[i], d = walkD(i, t), L0 = WALK + (i ? 0 : 0.25);
        restPose(p); idle(p, t, 41 + i, 0.6);
        gait(p, d, { from: [e[0], 0, e[1] + L0], ang: Math.PI, hf, step: fits[i], arms: 0.8 });
        if (i === 0) { // o capitão se vira para a tripulação para rir junto (pés trocam de apoio no giro)
          const turn = E.inOut(smr(t, K.rir - 0.25, K.rir + 0.3));
          if (turn > 0) { const ang = lerp(Math.PI, 0.12, turn), y0 = hf(e[0], e[1]), A_ = standPos(e[0], e[1], Math.PI, 0.11, [0.05, -0.05], y0), B_ = standPos(e[0], e[1], 0.12, 0.11, [0.05, -0.05], y0), f0 = smr(turn, 0, 0.6), f1 = smr(turn, 0.4, 1);
            p.rotation.y = ang; const ft = [lerp3(A_[0], B_[0], f0), lerp3(A_[1], B_[1], f1)]; ft[0][1] += Math.sin(f0 * Math.PI) * 0.07; ft[1][1] += Math.sin(f1 * Math.PI) * 0.07; plantFeet(p, ft, ang); }
        }
        const lag = mola(t, (tt) => posOf(i, tt), { k: 40, c: 6 }), Lc = lagLocal(p, lag);
        clothWind(p, t, 0.5, [Lc[0] * 0.6, 0, Lc[2] * 0.6 - 0.02]); hairMola(p, Lc, 5);
      });
      // o capitão empurra a porta (mãos presas à pedra) e cai na gargalhada
      const push = smr(t, K.descobriu - 0.55, K.descobriu - 0.2) * (1 - smr(t, K.descobriu + 0.5, K.descobriu + 0.9));
      if (push > 0.01) {
        doorH.updateMatrixWorld(true); const pa = door.localToWorld(V3(-0.6, 0.0, 0.2)), pb = door.localToWorld(V3(-0.25, 0.25, 0.2));
        pose(cap, { spine: [0.25 * push, 0, 0], chest: [0.1 * push, 0, 0] });
        armIK(cap, 0, pa, pa.clone().add(V3(0.6, -0.8, 1)), push); armIK(cap, 1, pb, pb.clone().add(V3(-0.6, -0.8, 1)), push); pose(cap, { handR: 0.05, handL: 0.05 });
      }
      const lt = [K.rir - 0.1, K.rir + 0.25, K.rir + 0.45, K.rir + 0.15, K.rir + 0.35];
      all.forEach((p, i) => {
        const k = smr(t, lt[i], lt[i] + 0.35) * (1 - 0.35 * smr(t, K.fica, b));
        if (k <= 0) { face(p, { brow: 0.6 * smr(t, K.descobriu - 0.2, K.descobriu + 0.3), open: 0.35 * smr(t, K.descobriu, K.descobriu + 0.4), lid: 1 }); lookAtW(p, V3(0, 1.9, -6.3), 0.7 * smr(t, K.descobriu - 0.5, K.descobriu)); return; }
        riso(p, t, k, lt[i], { freq: 4.6 + i * 0.35 });
        const ph = Math.abs(Math.sin((t - lt[i]) * (4.6 + i * 0.35) * Math.PI)) * k;
        p.updateMatrixWorld(true); const u = p.userData, belly = wpos(u.spine).add(V3(0, 0.12, 0)), fwd = V3(Math.sin(p.rotation.y), 0, Math.cos(p.rotation.y));
        if (i === 0 || i === 3) { const tg = belly.clone().addScaledVector(fwd, 0.17); armIK(p, 0, tg.clone().add(V3(-0.06, 0, 0)), tg.clone().add(V3(-0.6, -0.5, 0)), k); armIK(p, 1, tg.clone().add(V3(0.06, -0.03, 0)), tg.clone().add(V3(0.6, -0.5, 0)), k); }
        else if (i === 1) { const knee = wpos(u.knee[1]).addScaledVector(fwd, 0.08).add(V3(0, 0.05 + ph * 0.08, 0)); armIK(p, 1, knee, knee.clone().add(V3(0.6, 0.3, 0)), k); pose(p, { spine: [0.25 * k, 0, 0] }); }
        else { pose(p, { armR: [-2.6 * k, 0, -0.5, -0.4], armL: [-2.6 * k, 0, 0.5, -0.4], handR: 0, handL: 0 }); }
      });
      // a lanterna de um tripulante balança (pêndulo com mola)
      const lh = crew[1]; lh.updateMatrixWorld(true); const hp = wpos(lh.userData.hands[0].h);
      if (smr(t, lt[2], lt[2] + 0.35) <= 0) pose(lh, { armR: [-0.35, 0, -0.15, -0.5], handR: 0.9 });
      lh.updateMatrixWorld(true); wpos(lh.userData.hands[0].h, hp);
      lan.upd(hp.add(V3(0, -0.05, 0)), mola(t, (tt) => { const q = posOf(2, tt); return [q[0] - 0.25, q[1] + 0.8, q[2]]; }, { k: 30, c: 3 }), t);
      sea.upd(t); palms.forEach((pm) => pm.upd(t)); floatDust(flies, t, 0.6, 0.3); dome.userData.u.uOff.value.set(t * 0.002, 0);
    },
    after(t) { GU.uFlashCol.value.set(1, 0.9, 0.6); GU.uFlash.value = 0.18 * Math.pow(1 - seg(t, K.descobriu, K.descobriu + 0.6), 2) * (t >= K.descobriu ? 1 : 0); },
    cam(t) {
      const c = path2(t, [
        [a, [2.4, 1.45, 6.2], [0, 1.4, -2.0], 42],
        [K.descobriu - 0.3, [1.5, 1.6, -0.6], [0, 1.6, -5.4], 40],
        [K.rir + 0.6, [0.1, 2.35, -2.3], [0, 1.6, -4.75], 38],
        [K.quem0, [0.05, 2.05, -3.25], [0, 1.64, -4.75], 36],
        [K.fica + 0.3, [1.2, 4.0, -1.0], [0, 1.6, -4.4], 42],
        [b, [0, 9.5, 7.0], [0, 2.0, -5.5], 46],
      ]);
      return { ...shakeCam(c, t, impact(t, K.descobriu, 0.05, 0.6)), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 2 · o Século Perdido: cidade antiga em chamas, páginas se desfazendo; a pedra que nada destrói
addSet("s2-seculo", (g) => {
  const [a, b] = T.sc["s2-seculo"];
  const dome = skyDome(g, { top: 0x120a18, mid: 0x3a1a22, midY: 0.14, hor: 0x8a3a22, ground: 0x0a0606, sunDir: [-0.4, 0.06, -1], sunCol: 0xff7030, sunI: 0.6, disk: 3, cov: 0.6, cloudA: 0.75, cloudLit: 0xa84a2a, cloudSh: 0x1a0a0a, cloudScale: 0.14 });
  const hf = () => 0;
  chao(g, 120, 120, texCalcada([110, 96, 84], [74, 64, 56]), 50, 50, { rough: 0.95 });
  const tv = texTravertino(), wm = matBlocos(tv, 2, 1, { col: 0xb8a890 });
  // ruínas: muros quebrados, arcos, colunas, entulho
  [[-7, -6, 6, 4, 0.3], [6, -8, 8, 6, -0.4], [-10, 3, 5, 3, 1.2], [9, 4, 6, 5, -1.1], [0, -14, 10, 7, 0], [-4, -11, 4, 3, 0.6]].forEach(([x, z, w, h, r], i) => { const wl = mesh(box(w, h, 0.8), wm, x, h / 2, z, g); wl.rotation.y = r; const brk = mesh(box(w * 0.4, h * 0.5, 0.82), wm, x + Math.cos(r) * w * 0.3, h + h * 0.2, z - Math.sin(r) * w * 0.3, g); brk.rotation.set(0, r, 0.25); });
  const archG = bayGeo(5, 6, 2.8, 4.6, 1.0); [[-5.5, -9, 0.2], [5.5, -10, -0.3], [0, -15.5, 0]].forEach(([x, z, r]) => { const ar = mesh(archG, wm, x, 0, z, g); ar.rotation.y = r; });
  const cm = SM(0xc8b8a0, { roughness: 0.85 });
  [[-3.6, -3.4, 0.5], [3.8, -3.0, null], [-4.6, 2.6, 0.35], [4.4, 3.0, 0.7], [-1.8, -7.0, null], [2.4, -7.4, 0.4]].forEach(([x, z, br]) => coluna(g, x, z, 6.2, 0.42, { broken: br, mat: cm }));
  for (let i = 0; i < 22; i++) rock(g, (hash(i * 3) - 0.5) * 24, 0.1, (hash(i * 7) - 0.5) * 22, 0.2 + hash(i) * 0.6, i + 80, { col: 0xb0a08a, flat: 0.6 });
  // a pedra eterna no centro; a coluna que cai sobre ela e se despedaça
  const pe = pedraEterna(g, 0, 0, 0, 2.4);
  const fallC = coluna(g, 2.6, -1.0, 6.2, 0.42, { mat: cm }); const fallPiv = grp(g, 2.6, 0, -1.0); g.remove(fallC); fallPiv.add(fallC); fallC.position.set(0, 0, 0);
  const chunks = Array.from({ length: 14 }, (_, i) => { const c = mesh(colunaGeo(0.5 + hash(i) * 0.4, 0.38), cm, 0, 0, 0, g); c.visible = false; return c; });
  // fogo, brasas, fumaça e páginas queimando no ar
  const fires = [[-6, -4], [5, -5], [-8, 4], [7, 2], [-2, -10], [3, 6]].map(([x, z], i) => { const f = grp(g, x, 0, z); const gl = glowSprite(0xff7020, 2.4, 0.7); gl.position.y = 0.8; f.add(gl); const gl2 = glowSprite(0xffb040, 1.2, 0.8); gl2.position.y = 0.6; f.add(gl2); const L = new THREE.PointLight(0xff6a20, 8, 16, 1.5); L.position.y = 1.2; f.add(L); return { gl, gl2, L, i }; });
  const smoke = [[-6, 1.5, -4], [5, 1.5, -5], [-8, 1.5, 4], [7, 1.5, 2]].map((o_, i) => steam(g, { n: 16, origin: o_, color: 0x2a2220, opacity: 0.35, size: 1.6, rise: 1.4, spread: 1.2, life: 4, seed: i * 3 }));
  const embers = flowPts(260, 0xff8a30, 0.06); g.add(embers.pts);
  const pageTex = canvasTex(128, 160, (c, w, h) => { c.fillStyle = "#e8dcc0"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(60,40,30,.75)"; for (let i = 0; i < 14; i++) c.fillRect(12, 16 + i * 9, 30 + hash(i) * 74, 3); c.strokeStyle = "rgba(120,80,40,.6)"; c.lineWidth = 3; c.strokeRect(4, 4, w - 8, h - 8); });
  const pages = Array.from({ length: 34 }, (_, i) => { const m = new THREE.MeshStandardMaterial({ map: pageTex, side: THREE.DoubleSide, transparent: true, emissive: 0xff6a20, emissiveIntensity: 0 }); const p = mesh(new THREE.PlaneGeometry(0.42, 0.56), m, 0, 0, 0, g); p.castShadow = false; return p; });
  const dust = dustRing(g, 0x8a7a6a);
  const tF = K.destruir - 0.75, tHit = K.destruir - 0.05;
  return {
    bg: 0x140a0a, fogExp: 0.03, fogCol: 0x2a1410, dome,
    look: { exposure: 1.32, bloom: 0.65, bloomT: 0.76, vig: 0.5, sat: 1.1, con: 1.06, lift: [0.03, 0.01, 0.0] },
    sun: { dir: [-0.4, 0.45, -1], col: 0xff9a60, I: 1.6, c: [0, 1, 0], r: 14 }, hemi: { sky: 0x8a5a4a, ground: 0x2a140c, I: 0.75 }, fill: { col: 0xff8a40, I: 0.6, dir: [0.4, 0.3, 1] }, rim: { col: 0xff9a60, str: 0.65 },
    update(t) {
      fires.forEach((f) => { const fl = 0.8 + noise1(t * 6 + f.i * 3) * 0.25; f.gl.scale.setScalar(2.4 * fl); f.gl2.scale.setScalar(1.2 * fl); f.L.intensity = 8 * fl; });
      smoke.forEach((s) => s.upd(t, 1));
      for (let i = 0; i < 260; i++) { const ph = (t * (0.18 + hash(i) * 0.15) + hash(i * 2.1)) % 1, f = fires[i % 6]; const p0 = f.gl.parent.position; embers.pos.set([p0.x + (hash(i * 3) - 0.5) * 2 + Math.sin(t + i) * 0.4 * ph, 0.5 + ph * 9, p0.z + (hash(i * 5) - 0.5) * 2], i * 3); } embers.upd();
      // páginas: giram no ar e queimam (bordas acesas) até sumir
      pages.forEach((p, i) => { const ph = (t * 0.09 + hash(i * 1.7)) % 1, an = hash(i) * 6.28 + t * 0.25 * (hash(i * 3) - 0.5), r = 2.5 + hash(i * 5) * 7;
        p.position.set(Math.cos(an) * r, 0.8 + ph * 6 + Math.sin(t * 1.3 + i) * 0.3, Math.sin(an) * r - 1); p.rotation.set(t * (0.6 + hash(i)) + i, t * 0.7 + i * 2, t * 0.4); p.material.opacity = Math.sin(ph * Math.PI) * (1 - smr(ph, 0.6, 0.95)); p.material.emissiveIntensity = 1.4 * smr(ph, 0.45, 0.85); });
      // inscrições acendem quando "ficou gravado"; a coluna cai, quebra e a pedra fica intacta
      pe.m.emissiveIntensity = 0.95 * smr(t, K.gravado - 0.3, K.gravado + 0.4) + 0.6 * Math.pow(1 - seg(t, tHit, tHit + 0.8), 2) * (t > tHit ? 1 : 0);
      const fk = E.in(seg(t, tF, tHit)); fallPiv.rotation.z = 0.53 * fk; fallC.visible = t < tHit + 0.02;
      chunks.forEach((c, i) => { const k = seg(t, tHit, tHit + 1.6); c.visible = t >= tHit && k < 1; if (!c.visible) return; const a_ = Math.PI * (0.55 + (i / 14) * 0.9) + hash(i) * 0.3, sp = 1.5 + hash(i * 3) * 2.5; c.position.set(Math.cos(a_) * sp * k * 1.4 + 0.6, 2.6 + (3 + hash(i * 5) * 2) * k - 9.8 * k * k * 1.2, Math.sin(a_) * sp * k - 0.4); if (c.position.y < 0.3) c.position.y = 0.3; c.rotation.set(k * 6 + i, k * 4 + i, k * 5); });
      dust(t, tHit, V3(0.5, 0, -0.2), 3.2, 1.6);
      dome.userData.u.uOff.value.set(t * 0.004, 0);
    },
    after(t) { GU.uFlashCol.value.set(1, 0.8, 0.5); GU.uFlash.value = 0.3 * Math.pow(1 - seg(t, tHit, tHit + 0.4), 2) * (t >= tHit ? 1 : 0); },
    cam(t) {
      const c = path2(t, [
        [a, [9, 10.5, 11], [0, 1.5, -2], 46],
        [K.pedaco, [6.5, 5.2, 7.5], [0, 1.8, -1], 42],
        [K.gravado - 0.3, [3.6, 2.6, 4.6], [0, 1.4, 0], 38],
        [tHit - 0.2, [4.2, 2.2, 5.2], [0.8, 2.2, -0.4], 40],
        [b, [3.0, 1.8, 4.2], [0, 1.3, 0], 36],
      ]);
      return { ...shakeCam(c, t, impact(t, tHit, 0.14, 0.8)), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 3 · o primeiro pirata: mar ao amanhecer; o navio com a bandeira do sol que ri e o homem de luz na proa; a transmissão no céu
function holoPainel(g) {
  const p = grp(g), W = 14, H = 7.5;
  const tx = canvasTex(512, 280, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "rgba(140,220,255,.9)"; c.lineWidth = 4; c.strokeRect(6, 6, w - 12, h - 12); c.lineWidth = 2; c.strokeRect(16, 16, w - 32, h - 32); c.fillStyle = "rgba(120,200,255,.12)"; c.fillRect(16, 16, w - 32, h - 32);
    c.strokeStyle = "rgba(160,230,255,.8)"; c.beginPath(); c.arc(w / 2, 90, 46, 0, 7); c.stroke(); c.beginPath(); c.arc(w / 2, 90, 30, 0, 7); c.stroke(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * 30, 90 + Math.sin(a) * 30); c.lineTo(w / 2 + Math.cos(a) * 46, 90 + Math.sin(a) * 46); c.stroke(); } }, { linear: false });
  const scr = mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, blending: ADD, side: THREE.DoubleSide }), 0, 0, 0, p); scr.castShadow = false;
  const bars = Array.from({ length: 28 }, (_, i) => { const m = mesh(box(0.28, 1, 0.05), new THREE.MeshBasicMaterial({ color: 0x8ae0ff, transparent: true, opacity: 0, depthWrite: false, blending: ADD }), (i - 13.5) * 0.4, -1.6, 0.05, p); m.castShadow = false; return m; });
  const halo = glowSprite(0x6ad0ff, 18, 0); p.add(halo);
  return { p, upd(t, k) { p.visible = k > 0.01; scr.material.opacity = 0.85 * k; halo.material.opacity = 0.18 * k; bars.forEach((m, i) => { const v = 0.15 + Math.abs(noise1(t * 6 + i * 0.7)) * 1.6 * (0.5 + 0.5 * Math.sin(t * 2 + i * 0.3)); m.scale.y = Math.max(0.05, v); m.material.opacity = 0.85 * k; }); } };
}
addSet("s3-pirata", (g) => {
  const [a, b] = T.sc["s3-pirata"];
  const dome = skyDome(g, { top: 0x2a4a8a, mid: 0xc88a7a, midY: 0.12, hor: 0xffb070, ground: 0x1a2028, sunDir: [1, 0.07, -0.35], sunCol: 0xffb060, sunI: 1.0, disk: 2.6, cov: 0.5, cloudA: 0.8, cloudLit: 0xffd0a8, cloudSh: 0x6a5a7a, cloudScale: 0.15 });
  const sea = oceano(g, { size: 360, segs: 150, deep: 0x0e3448, crest: 0x4a8aa0, foam: 0xf0f4f4, env: envGold(), envI: 0.8, amp: 0.8 });
  const nv = navio(g, { casco: 0x4a2c1a, faixa: 0xd8a848, vela: 0xe8d8b8 }); const SP = V3(0, 0, 0), SA = 0.25;
  const hl = homemLuz({ luz: 1.0, brilho: 0.9 }); nv.add(hl); hl.position.set(0, nv.userData.deckY + 0.08, 4.6); hl.rotation.y = 0.0;
  const holo = holoPainel(g); holo.p.position.set(-4, 16, -26); holo.p.lookAt(4, 4, 10);
  const brd = birds(g, 8, { center: [0, 14, 6], rx: 18, rz: 10, speed: 0.12, color: 0x2a2a30 });
  const sunR = godRays(g, [110, 16, -40], [-1, -0.12, 0.35], { n: 8, len: 140, w: 8, spread: 30, opacity: 0.04, color: 0xffc080 });
  const shipAt = (t) => { const d = (t - a) * 1.6, x = SP.x + Math.sin(SA) * d, z = SP.z + Math.cos(SA) * d, q = naviaPose(x, z, SA, t, 13, 3.6, 0.8); return { x, z, ...q }; };
  return {
    bg: 0x6a7090, fogExp: 0.006, fogCol: 0xd8a890, dome,
    look: { exposure: 1.0, bloom: 0.5, bloomT: 0.86, vig: 0.4, sat: 1.12, con: 1.06, lift: [0.02, 0.01, 0.03] },
    sun: { dir: [1, 0.35, -0.35], col: 0xffc080, I: 2.6, c: [0, 2, 2], r: 14 }, hemi: { sky: 0x9ab0e0, ground: 0x2a3a48, I: 0.7 }, fill: { col: 0xffd8b0, I: 0.5, dir: [0.4, 0.3, 1] }, rim: { col: 0xffd0a0, str: 0.6 },
    update(t) {
      const s = shipAt(t); nv.position.set(s.x, s.y - 0.35, s.z); nv.rotation.set(0, SA, 0); nv.rotateX(-s.pitch); nv.rotateZ(s.roll);
      nv.userData.velas.forEach((v) => v(t, 1)); nv.userData.flag.upd(t, 1.2 + 0.3 * Math.sin(t));
      // o homem de luz na proa: equilíbrio contra o balanço (tronco compensa), cachecol com mola e vento
      restPose(hl); idle(hl, t, 71, 0.5); standFeetOn(hl, nv, { y: nv.userData.deckY + 0.08 });
      pose(hl, { spine: [s.pitch * 0.5, 0, -s.roll * 0.7], chest: [0, 0, -s.roll * 0.3], armL: [-0.15, 0, 0.25, -0.3], armR: [0.05, 0, -0.2, -0.3] });
      const lag = mola(t, (tt) => { const q = shipAt(tt); return [q.x, q.y + Math.sin(q.pitch) * 4.6, q.z]; }, { k: 30, c: 4 });
      clothWind(hl, t, 1.6, [lagLocal(hl, lag)[0], 0, -0.06]); hairMola(hl, lagLocal(hl, lag), 6);
      const pk = smr(t, K.primeiro - 0.2, K.primeiro + 0.4); hl.userData.glow.material.opacity = 0.14 + 0.16 * pk; hl.userData.core.color.setRGB(0.9 + 0.25 * pk, 0.72 + 0.18 * pk, 0.52 + 0.12 * pk);
      holo.upd(t, smr(t, K.mensagem - 0.3, K.mensagem + 0.4) * (1 - 0.5 * smr(t, K.historia2, b)));
      sea.upd(t); brd(t); dome.userData.u.uOff.value.set(t * 0.004, 0);
    },
    cam(t) {
      const s = shipAt(t), bow = V3(s.x + Math.sin(SA) * 4.8, s.y + 1.9, s.z + Math.cos(SA) * 4.8);
      const c = path2(t, [
        [a, [bow.x + 2.6, 1.6, bow.z + 5.0], [bow.x, bow.y + 0.3, bow.z], 40],
        [K.mensagem + 0.3, [bow.x + 4.0, 3.0, bow.z + 7.5], [bow.x - 1.2, bow.y + 5.5, bow.z - 6], 46],
        [K.primeiro - 0.1, [bow.x + 2.2, 1.9, bow.z + 3.6], [bow.x, bow.y + 0.4, bow.z], 38],
        [b, [bow.x - 2.8, 2.4, bow.z + 4.4], [bow.x, bow.y + 0.6, bow.z - 1], 40],
      ]);
      return { ...c, near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 4 · a promessa: reino no fundo do mar; o homem de luz toca a pedra do pedido de desculpas
addSet("s4-promessa", (g) => {
  const [a, b] = T.sc["s4-promessa"];
  const hf = (x, z) => fbm2(x * 0.08, z * 0.08, 4) * 1.4 - 0.7;
  const sandT = texPair(512, (u, v) => Math.sin(u * 80 + fbm2(u * 6, v * 6, 3, 6) * 6) * 0.3 + 0.5 + fbm2(u * 30, v * 30, 2, 30) * 0.2, (u, v, h) => mixc([150, 150, 130], [200, 196, 170], h), 2.5);
  rep(sandT.map, 10, 10); rep(sandT.normalMap, 10, 10);
  terrain(g, { h: hf, size: 220, segs: 120, grassA: 0xb8b498, grassB: 0xd8d0b0, dirt: 0xa89c80, rock: 0x6a7068 });
  // palácio de coral e conchas (cúpulas peroladas), corais, algas
  const pal = grp(g, 0, 0, -26); cupula(pal, 0, 0, 7, { col: 0xf0e0e8, dome: 0x8ad8d0 }); cupula(pal, -12, 4, 4.5, { col: 0xf0e0e8, dome: 0xf0a8b8 }); cupula(pal, 12, 3, 4.5, { col: 0xf0e0e8, dome: 0xf0a8b8 });
  [-6, 6].forEach((x) => { mesh(cyl(0.9, 1.3, 16, 16), SM(0xf2e6ea), x, 8, 2, pal); mesh(new THREE.ConeGeometry(1.4, 4, 16), SM(0x8ad8d0, { roughness: 0.4 }), x, 18, 2, pal); });
  const coralC = [0xff7a6a, 0xff9ab8, 0xffd06a, 0x8ae0c0, 0xc88aff];
  for (let i = 0; i < 46; i++) { const x = (hash(i * 3.1) - 0.5) * 30, z = (hash(i * 5.7) - 0.5) * 26 - 4; if (Math.hypot(x, z + 1) < 4) continue; const cg = grp(g, x, hf(x, z) - 0.1, z), col = coralC[i % 5];
    for (let k = 0; k < 4; k++) { const br = mesh(lockGeo([[0, 0, 0], [(hash(i + k) - 0.5) * 0.4, 0.5, (hash(i * 2 + k) - 0.5) * 0.4], [(hash(i * 3 + k) - 0.5) * 0.8, 1.0 + hash(k) * 0.6, (hash(i * 4 + k) - 0.5) * 0.8]], 0.12, 0.05, 1, 8, 7), SM(col, { roughness: 0.6, emissive: col, emissiveIntensity: 0.12 }), 0, 0, 0, cg); br.scale.setScalar(0.8 + hash(i * 7) * 0.9); } }
  const kelp = []; for (let i = 0; i < 40; i++) { const x = (hash(i * 7.1) - 0.5) * 34, z = (hash(i * 3.3) - 0.5) * 28 - 6; if (Math.hypot(x, z + 1) < 4.5) continue; const h = 3 + hash(i) * 5; const kg = grp(g, x, hf(x, z), z); const segs = []; let par = kg; for (let k = 0; k < 6; k++) { const s_ = grp(par, 0, k ? h / 6 : 0, 0); mesh(box(0.25, h / 6, 0.02), SM(0x3a7a3a, { side: THREE.DoubleSide, roughness: 0.8 }), 0, h / 12, 0, s_); segs.push(s_); par = s_; } kelp.push({ segs, i }); }
  for (let i = 0; i < 14; i++) rock(g, (hash(i * 9) - 0.5) * 30, 0, (hash(i * 4) - 0.5) * 24 - 4, 0.6 + hash(i) * 1.4, i + 120, { col: 0x5a6a6a });
  // a pedra do pedido de desculpas (com inscrições que acendem) e o homem de luz ajoelhado tocando-a
  const pe = pedraEterna(g, 0, hf(0, -1.5) - 0.2, -1.5, 2.2); pe.c.rotation.y = 0.2;
  const hl = homemLuz({ luz: 1.2, brilho: 0.95, cachecol: 2.4 }); hl.position.set(0.3, hf(0.3, 0.6), 0.65); hl.rotation.y = Math.PI + 0.15; g.add(hl);
  const fishA = cardume(g, 40, [0, 4, -4], 7, 0xc8e0f0), fishB = cardume(g, 26, [-6, 6, -10], 4, 0xffc070);
  const bub = flowPts(160, 0xd8f4ff, 0.08); g.add(bub.pts);
  const rays = godRays(g, [0, 30, -4], [0.05, -1, 0.1], { n: 12, len: 40, w: 3, spread: 22, opacity: 0.08, color: 0x9ae8ff });
  const caust = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#000"; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 3; for (let i = 0; i < 40; i++) { c.beginPath(); let x = hash(i) * w, y = hash(i * 3) * h; c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (hash(i * 7 + k) - 0.5) * 70; y += (hash(i * 11 + k) - 0.5) * 70; c.lineTo(x, y); } c.stroke(); } }, { linear: true });
  rep(caust, 8, 8); const cp = mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: caust, color: 0x6ad0e0, transparent: true, opacity: 0.12, blending: ADD, depthWrite: false }), 0, 0.05, -4, g); cp.rotation.x = -Math.PI / 2; cp.castShadow = false;
  return {
    bg: 0x04324a, fogExp: 0.045, fogCol: 0x0a4a62,
    look: { exposure: 1.15, bloom: 0.65, bloomT: 0.74, vig: 0.5, sat: 1.1, con: 1.05, lift: [0.0, 0.02, 0.04] },
    sun: { dir: [0.1, 1, 0.2], col: 0xa8f0ff, I: 1.6, c: [0, 0, -2], r: 12 }, hemi: { sky: 0x4ac0e0, ground: 0x0a2a3a, I: 0.75 }, fill: { col: 0x6ad8ff, I: 0.4, dir: [0.3, 0.2, 1] }, rim: { col: 0xa8f0ff, str: 0.7 }, hand: 0.01,
    update(t) {
      // ajoelhado diante da pedra; a mão vai até ela (antecipação) quando "deixou um pedido de desculpas"; depois abaixa a cabeça
      restPose(hl); idle(hl, t, 71, 0.4); kneelPose(hl, 1);
      const reach = act(t, K.deixou - 0.2, K.desculpas + 0.2, 0.15, 0.05);
      if (reach > 0.01) { hl.updateMatrixWorld(true); const tgt = V3(0.15, hf(0, -1.5) + 1.25, -0.42); armIK(hl, 1, tgt, tgt.clone().add(V3(0.5, -0.8, 0.6)), clamp(reach)); pose(hl, { handL: 0 }); }
      const bow = smr(t, K.conseguir - 0.2, K.promessa + 0.4);
      pose(hl, { spine: [0.35 + 0.25 * bow, 0, 0], neck: [0.2 + 0.35 * bow, 0, 0] });
      clothWind(hl, t, 0.5, [Math.sin(t * 0.7) * 0.05, 0.05, Math.cos(t * 0.6) * 0.05]);
      const gl = smr(t, K.desculpas - 0.3, K.desculpas + 0.5); pe.m.emissiveIntensity = 0.85 * gl * (1 - 0.5 * bow) + 0.12;
      hl.userData.core.color.setRGB(0.95 - 0.25 * bow, 0.8 - 0.2 * bow, 0.62 - 0.1 * bow); hl.userData.glow.material.opacity = 0.2 - 0.1 * bow;
      kelp.forEach((k) => k.segs.forEach((s, j) => (s.rotation.set(Math.sin(t * 0.9 + k.i + j * 0.6) * 0.12, 0, Math.sin(t * 0.7 + k.i * 2 + j * 0.5) * 0.15))));
      fishA(t); fishB(t * 1.2);
      for (let i = 0; i < 160; i++) { const ph = (t * (0.15 + hash(i) * 0.1) + hash(i * 1.9)) % 1; bub.pos.set([(hash(i * 3) - 0.5) * 20 + Math.sin(t * 2 + i) * 0.2, ph * 14, (hash(i * 5) - 0.5) * 16 - 4], i * 3); } bub.upd();
      caust.offset.set(Math.sin(t * 0.3) * 0.2, t * 0.03);
      rays.userData.rays.forEach((r, i) => (r.material.opacity = 0.06 + 0.03 * Math.sin(t * 0.8 + i * 1.3)));
    },
    cam(t) {
      return { ...path2(t, [
        [a, [3.5, 7.5, 12], [0, 2.5, -10], 46],
        [K.deixou, [3.6, 2.2, 5.0], [0.1, 1.2, -0.8], 40],
        [K.desculpas + 0.4, [2.6, 1.6, 3.4], [0.0, 1.1, -0.6], 38],
        [b, [-2.4, 1.5, 3.6], [0.1, 1.0, -0.4], 38],
      ]), near: 0.05 };
    },
  };
});

// ================================================================ vídeo: Joy Boy · cenas 5–9
// cena num referencial que balança (cabine do navio): transforma posições da câmera do quarto para o mundo
function roomCam(room, c) { room.updateMatrixWorld(true); const p = room.localToWorld(V3(...c.pos)), l = room.localToWorld(V3(...c.look)); return { ...c, pos: p.toArray(), look: l.toArray() }; }
function bauOuro(g, x, y, z) {
  const c = grp(g, x, y, z), wood = SM(0x6a2a18, { roughness: 0.6 }), gm = GOLDM();
  mesh(box(0.92, 0.42, 0.56), wood, 0, 0.21, 0, c); [-0.32, 0.32].forEach((xx) => mesh(box(0.06, 0.44, 0.58), gm, xx, 0.21, 0, c)); mesh(box(0.96, 0.05, 0.6), gm, 0, 0.02, 0, c);
  const lid = grp(c, 0, 0.42, -0.28); mesh(box(0.92, 0.13, 0.56), wood, 0, 0.065, 0.28, lid); [-0.32, 0.32].forEach((xx) => mesh(box(0.06, 0.15, 0.58), gm, xx, 0.065, 0.28, lid));
  mesh(box(0.12, 0.12, 0.04), gm, 0, 0.36, 0.29, c);
  return { c, lid };
}

// ---------------------------------------------------------------- 5 · keys: cabine do navio (que balança); o jovem pirata abre o baú e as keys voam
addSet("s5-keys", (g) => {
  const [a, b] = T.sc["s5-keys"];
  const room = grp(g, 0, 0, 0);
  const pk = texPlanks([128, 86, 52], [96, 64, 40]), wallM = SM(0xffffff, { map: rep(pk.map.clone(), 3, 1.4), normalMap: pk.normalMap, roughness: 0.8 }); wallM.map.needsUpdate = true;
  const floorM = SM(0xffffff, { map: rep(texPlanks([110, 74, 44], [84, 56, 34]).map.clone(), 2.5, 2.5), roughness: 0.75 }); floorM.map.needsUpdate = true;
  mesh(box(7, 0.2, 6), floorM, 0, -0.1, 0, room); mesh(box(7, 0.2, 6), wallM, 0, 3.3, 0, room);
  mesh(box(7, 3.4, 0.2), wallM, 0, 1.6, -3, room); mesh(box(0.2, 3.4, 6), wallM, -3.5, 1.6, 0, room); mesh(box(0.2, 3.4, 6), wallM, 3.5, 1.6, 0, room);
  for (let i = 0; i < 6; i++) mesh(box(0.22, 0.25, 6), SM(0x4a2c18), -3 + i * 1.2, 3.1, 0, room);
  // escotilhas com o mar lá fora (horizonte que balança contra a cabine)
  const seaTex = canvasTex(128, 128, (c, w, h) => { const g_ = c.createLinearGradient(0, 0, 0, h); g_.addColorStop(0, "#ffd0a0"); g_.addColorStop(0.48, "#ff9a6a"); g_.addColorStop(0.5, "#2a5a7a"); g_.addColorStop(1, "#0a2a40"); c.fillStyle = g_; c.fillRect(0, 0, w, h); });
  const ports = [-1.6, 1.6].map((x) => { const pt = grp(room, x, 1.9, -2.88); mesh(new THREE.TorusGeometry(0.42, 0.07, 8, 24), GOLDM(), 0, 0, 0.02, pt); const v = mesh(new THREE.CircleGeometry(0.4, 24), new THREE.MeshBasicMaterial({ map: seaTex }), 0, 0, 0, pt); return v; });
  // mesa com mapas, lanterna pendurada que balança como pêndulo (a cabine inclina, a lanterna segue a gravidade)
  const mapT = canvasTex(256, 192, (c, w, h) => { c.fillStyle = "#e0cc9a"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(90,60,30,.7)"; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(40 + hash(i) * 180, 40 + hash(i * 3) * 110, 12 + hash(i * 5) * 30, 8 + hash(i * 7) * 20, hash(i) * 3, 0, 7); c.stroke(); } c.setLineDash([6, 6]); c.beginPath(); c.moveTo(20, 170); c.bezierCurveTo(80, 90, 160, 160, 230, 30); c.stroke(); c.setLineDash([]); c.fillStyle = "#a82a1a"; c.font = "700 26px serif"; c.fillText("✕", 220, 40); });
  mesh(box(2.2, 0.1, 1.2), SM(0x5a3a22), 1.6, 0.85, -1.6, room); [[0.6, -2.1], [2.6, -2.1], [0.6, -1.1], [2.6, -1.1]].forEach(([x, z]) => mesh(box(0.1, 0.85, 0.1), SM(0x3a2414), x, 0.42, z, room));
  const mp = mesh(new THREE.PlaneGeometry(1.4, 1.0), SM(0xffffff, { map: mapT }), 1.6, 0.91, -1.6, room); mp.rotation.x = -Math.PI / 2; mp.rotation.z = 0.15;
  const hook = grp(room, -1.2, 3.2, -0.6); const pend = grp(hook); mesh(cyl(0.01, 0.01, 0.5, 4), SM(0x2a221c), 0, -0.25, 0, pend);
  const lampB = grp(pend, 0, -0.62, 0); mesh(cyl(0.12, 0.14, 0.26, 8), new THREE.MeshStandardMaterial({ color: 0xffd8a0, emissive: 0xffa040, emissiveIntensity: 1.6, transparent: true, opacity: 0.9 }), 0, 0, 0, lampB);
  const lampL = new THREE.PointLight(0xffa850, 5, 10, 1.5); lampB.add(lampL); const lampG = glowSprite(0xffb060, 1.2, 0.55); lampB.add(lampG);
  // o baú e as keys
  const ch = bauOuro(room, 0, 0, -1.0);
  const cardTex = canvasTex(256, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#1a1a3a"); gr.addColorStop(1, "#c8962a"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,230,160,.9)"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#fff"; c.font = "700 54px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("KEY", w / 2, h / 2 - 12); c.font = "700 22px 'Space Mono', monospace"; c.fillText("ALEATÓRIA", w / 2, h / 2 + 34); }, { redraw: true });
  const cards = []; for (let i = 0; i < 12; i++) cards.push(mesh(box(0.32, 0.2, 0.01), new THREE.MeshStandardMaterial({ map: cardTex, emissive: 0xffffff, emissiveMap: cardTex, emissiveIntensity: 0.4, roughness: 0.4 }), 0, 0, 0, room));
  const cg = glowSprite(0xffc070, 1.8, 0); cg.position.set(0, 0.8, -1.0); room.add(cg);
  const coins = flowPts(80, 0xffd060, 0.04); room.add(coins.pts);
  const motes = dustPts(120, [-3, 3, 0.3, 3, -2.8, 2], 0xffe0b0, 0.022, 0.6); room.add(motes);
  // o jovem pirata ajoelhado diante do baú
  const jv = jovem(); room.add(jv); jv.position.set(0, 0, -0.05); jv.rotation.y = Math.PI;
  const roll = (t) => 0.045 * Math.sin(t * 0.85) + 0.012 * Math.sin(t * 2.1), pitch = (t) => 0.02 * Math.sin(t * 0.6 + 1);
  const hinge = V3(0, 0.42, -1.28);
  return {
    bg: 0x1a1008, fog: [8, 30],
    look: { exposure: 1.15, bloom: 0.7, bloomT: 0.72, vig: 0.52, sat: 1.12, con: 1.05 },
    sun: { dir: [0.2, 0.6, -1], col: 0xffb070, I: 1.0, c: [0, 1, -1], r: 5 }, hemi: { sky: 0x8a6040, ground: 0x2a1408, I: 0.55 }, fill: { col: 0xffc890, I: 0.35, dir: [0.3, 0.5, 1] }, rim: { col: 0xffc070, str: 0.6 }, hand: 0.006,
    update(t) {
      room.rotation.set(pitch(t), 0, roll(t));
      pend.rotation.set(-pitch(t - 0.3) * 1.25, 0, -roll(t - 0.35) * 1.3);
      lampL.intensity = 4.6 + noise1(t * 6) * 0.5; ports.forEach((v, i) => (v.material.map.offset.y = roll(t) * 2.5));
      // tampa abre com as duas mãos; as keys sobem e giram; no "agora" ele vira para a câmera sorrindo
      const la = -1.75 * E.outBack(smr(t, K.rapidinho + 0.5, K.steam - 0.2)); ch.lid.rotation.x = la;
      restPose(jv); idle(jv, t, 61, 0.5); kneelPose(jv, 1); pose(jv, { spine: [0.25, 0, 0] });
      const grab = smr(t, a + 0.3, K.rapidinho + 0.45) * (1 - smr(t, K.steam + 0.2, K.steam + 0.8));
      room.updateMatrixWorld(true);
      if (grab > 0.01) [-1, 1].forEach((sx, i) => { const e = V3(sx * 0.3, hinge.y + Math.sin(-la) * 0.56 + 0.13 * Math.cos(-la), hinge.z + Math.cos(-la) * 0.56); const w_ = room.localToWorld(e.clone()), pl = room.localToWorld(e.clone().add(V3(sx * 0.8, -0.6, 0.8))); armIK(jv, i === 0 ? 1 : 0, w_, pl, grab); });
      const cheer = act(t, K.steam - 0.1, K.steam + 0.6, 0.2, 0.08) * (1 - smr(t, K.agora - 0.4, K.agora));
      if (cheer > 0.01) pose(jv, { armR: [-2.4 * clamp(cheer), 0, -0.4, -0.3], armL: [-2.4 * clamp(cheer), 0, 0.4, -0.3], handR: 1, handL: 1, spine: [-0.1, 0, 0] }, clamp(cheer));
      const turn = smr(t, K.agora - 0.1, K.agora + 0.35);
      if (turn > 0) { lookAtW(jv, room.localToWorld(V3(1.3, 1.3, -1.8)), turn, 1.4); }
      face(jv, { smile: 0.35 + 0.55 * smr(t, K.steam - 0.3, K.steam) + 0.2 * turn, open: 0.3 * clamp(cheer), brow: 0.4 * clamp(cheer) + 0.2 * turn, lid: 1 });
      clothWind(jv, t, 0.4, [0, 0, -0.02 * Math.sin(t)]);
      const up = smr(t, K.steam - 0.4, K.bio + 0.2), lt = t - a;
      cards.forEach((cd, i) => { const ang = (i / 12) * Math.PI * 2 + lt * 0.7, r = 0.1 + up * (0.42 + (i % 3) * 0.12); cd.position.set(Math.cos(ang) * r * 1.3, 0.55 + up * (0.55 + Math.sin(lt * 2 + i) * 0.08 + (i % 4) * 0.12), -1.0 + Math.sin(ang) * r * 0.7); cd.rotation.set(-0.3 + Math.sin(lt + i) * 0.2, -ang + Math.PI / 2, Math.sin(lt * 1.3 + i) * 0.2); cd.visible = up > 0.01; });
      cg.material.opacity = 0.45 * up;
      for (let i = 0; i < 80; i++) { const ph = (t * 0.5 + hash(i * 1.7)) % 1, an = hash(i) * 6.28 + t; coins.pos.set([Math.cos(an) * (0.2 + ph * 0.9), 0.5 + ph * 1.3 * up, -1.0 + Math.sin(an) * (0.2 + ph * 0.6)], i * 3); } coins.pts.material.opacity = up * 0.8; coins.upd();
      floatDust(motes, t, 0.2, 0.15);
    },
    cam(t) {
      return { ...roomCam(room, path2(t, [
        [a, [1.6, 1.5, 2.4], [0, 0.7, -1.0], 40],
        [K.steam, [1.0, 1.25, 1.2], [0, 0.9, -1.0], 38],
        [K.agora - 0.1, [1.5, 1.3, -1.7], [0, 1.0, -0.2], 36],
        [b, [1.2, 1.3, -1.9], [0, 1.05, -0.2], 34],
      ])), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 6 · o amigo que esperou: ilha-laboratório em ruínas; o gigante de ferro desperta e solta a onda dourada
addSet("s6-gigante", (g) => {
  const [a, b] = T.sc["s6-gigante"];
  const dome = skyDome(g, { top: 0x2a3070, mid: 0xb06a6a, midY: 0.13, hor: 0xffa058, ground: 0x2a1a14, sunDir: [-1, 0.1, 0.3], sunCol: 0xffa050, sunI: 1.1, disk: 2.4, cov: 0.55, cloudA: 0.85, cloudLit: 0xffc0a0, cloudSh: 0x4a3a5a });
  const hf = (x, z) => (z < -6 ? 2 + fbm2(x * 0.08, z * 0.08, 4) * 6 : fbm2(x * 0.1, z * 0.1, 3) * 0.6 - 0.2);
  terrain(g, { h: hf, size: 260, segs: 120, grassA: 0x4a5a30, grassB: 0x6a7040, dirt: 0x6a5a48, rock: 0x5a5a60 });
  grassField(g, 2200, [-14, 14, -6, 12], hf, { colA: 0x5a6a30, colB: 0x9a9a50, s: 1.2 });
  const sea = oceano(g, { y: -1.2, z: 150, size: 260, segs: 90, deep: 0x1a2a3a, crest: 0x6a7a8a, foam: 0xf0e0d0, amp: 0.4 });
  // ruínas metálicas: cúpulas partidas, canos, painéis
  const panel = texPair(256, (u, v) => { const gx = (u * 6) % 1, gy = (v * 6) % 1; return Math.min(gx, gy, 1 - gx, 1 - gy) < 0.04 ? 0.2 : 0.8 + fbm2(u * 20, v * 20, 2, 20) * 0.2; }, (u, v, h) => mixc([150, 156, 162], [110, 116, 122], fbm2(u * 4, v * 4, 3, 4)), 2.2);
  const mt = new THREE.MeshStandardMaterial({ map: panel.map, normalMap: panel.normalMap, metalness: 0.55, roughness: 0.5, envMap: envGold(), envMapIntensity: 0.4, side: THREE.DoubleSide });
  [[-12, -10, 7], [13, -12, 9], [-20, 4, 5]].forEach(([x, z, r], i) => { const d = mesh(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * (1.2 + hash(i) * 0.5), 0, Math.PI / 2), mt, x, hf(x, z) - 0.5, z, g); d.rotation.y = hash(i * 3) * 6; });
  for (let i = 0; i < 10; i++) { const x = (hash(i * 7) - 0.5) * 30, z = (hash(i * 3) - 0.5) * 16 - 2; const pc = mesh(cyl(0.3, 0.3, 4 + hash(i) * 5, 12), mt, x, 0.3, z, g); pc.rotation.set(Math.PI / 2, hash(i * 5) * 3, 0.2); }
  for (let i = 0; i < 14; i++) { const x = (hash(i * 9) - 0.5) * 26, z = (hash(i * 4) - 0.5) * 14; const pn = mesh(box(1.5 + hash(i) * 2, 0.15, 1 + hash(i * 2) * 1.5), mt, x, hf(x, z) + 0.2, z, g); pn.rotation.set(hash(i * 3) - 0.5, hash(i * 5) * 3, hash(i * 7) - 0.5); }
  // o gigante de ferro sentado, com trepadeiras
  const co = colosso({ s: 1.25 }); co.position.set(0, hf(0, -3.5), -3.5); g.add(co);
  const vines = SM(0x3a6a2a); for (let i = 0; i < 10; i++) { const a_ = hash(i) * 6.28; mesh(lockGeo([[Math.cos(a_) * 1.6, 3.5, Math.sin(a_) * 1.2], [Math.cos(a_) * 1.9, 2.2, Math.sin(a_) * 1.5], [Math.cos(a_) * 1.7, 0.8, Math.sin(a_) * 1.6]], 0.06, 0.02, 1, 8, 6), vines, 0, 0, 0, co.userData.torso); }
  // lembrança: o homem de luz tocando a mão do gigante (aparece translúcido)
  const mem = homemLuz({ luz: 0.6, brilho: 0.8 }); mem.position.set(2.4, 0, -0.6); mem.rotation.y = -1.9; g.add(mem); mem.traverse((c) => { if (c.userData.isOutline) c.visible = false; });
  const wave = ondaDourada(g), ring = aneis(g, 4, 0xffd070), beamUp = godRays(g, [0, 4, -2], [0.05, 1, 0.25], { n: 8, len: 70, w: 3.5, spread: 4, opacity: 0, color: 0xffd070 });
  const nvP = navio(g, { L: 6, W: 2.0, D: 1.0, mastros: [[0.05, 5.5]], bw: 1.1, bh: 0.75, vela: 0xf0e6d0 }); nvP.scale.setScalar(1.0);
  const dust = flowPts(160, 0xa89878, 0.08, NORM); g.add(dust.pts); dust.pts.material.opacity = 0;
  const wakeK = (t) => { const k = smr(t, K.guardou - 0.3, K.anos5 + 0.4); return k + (k > 0 && k < 1 ? Math.sin(t * 38) * 0.05 * (1 - k) : 0); };
  return {
    bg: 0x2a1a20, fogExp: 0.006, fogCol: 0xc8907a, dome,
    look: { exposure: 1.08, bloom: 0.6, bloomT: 0.78, vig: 0.42, sat: 1.12, con: 1.06, lift: [0.02, 0.0, 0.03] },
    sun: { dir: [-1, 0.35, 0.3], col: 0xffb070, I: 2.6, c: [0, 2, -2], r: 16 }, hemi: { sky: 0x8a90c8, ground: 0x6a5034, I: 0.62 }, fill: { col: 0x8a9ad0, I: 0.45, dir: [1, 0.3, 0.5] }, rim: { col: 0xffc890, str: 0.6 },
    update(t) {
      const wk = clamp(wakeK(t)), raise = act(t, K.usou - 0.3, K.usou + 0.6, 0.15, 0.06), off = smr(t, K.escapar + 0.2, b);
      colossoPose(co, t, wk * (1 - 0.8 * off), clamp(raise) * (1 - 0.6 * off));
      // poeira e musgo caindo quando ele se mexe
      dust.pts.material.opacity = 0.7 * smr(t, K.guardou, K.guardou + 0.4) * (1 - smr(t, K.anos5 + 0.6, K.anos5 + 1.6)) + 0.6 * smr(t, K.usou - 0.2, K.usou) * (1 - smr(t, K.usou + 0.8, K.usou + 1.6));
      for (let i = 0; i < 160; i++) { const ph = (t * 0.5 + hash(i * 1.3)) % 1; dust.pos.set([(hash(i) - 0.5) * 6, 9 - ph * 9, -3.5 + (hash(i * 3) - 0.5) * 3], i * 3); } dust.upd();
      // lembrança do homem de luz
      const mk = smr(t, K.amigo5 - 0.4, K.amigo5 + 0.2) * (1 - smr(t, K.guardou - 0.3, K.guardou + 0.2));
      mem.visible = mk > 0.01; restPose(mem); idle(mem, t, 71, 0.4); standFeet(mem, { hf }); co.updateMatrixWorld(true);
      const hp = wpos(co.userData.arms[0].hand); armIK(mem, 1, hp.clone().add(V3(0.15, 0.1, 0.25)), hp.clone().add(V3(0.8, -0.5, 1)), 1);
      mem.traverse((c) => { if (c.isMesh && c.material && c.material.isMeshBasicMaterial) { c.material.transparent = true; c.material.opacity = mk * 0.7; } }); mem.userData.glow.material.opacity = 0.2 * mk;
      // a onda dourada que abre caminho; o navio pequeno escapando ao fundo
      const hand = wpos(co.userData.arms[1].hand);
      wave(t, K.usou + 0.25, hand, 60, 1.6); ring(t, K.usou + 0.2, hand, [0, 1, 0.3], 6, 1.2);
      beamUp.userData.rays.forEach((r, i) => (r.material.opacity = 0.14 * smr(t, K.usou + 0.1, K.usou + 0.4) * (1 - smr(t, K.escapar, K.escapar + 1.0))));
      const sx = -18 + (t - a) * 2.2, q = naviaPose(sx, 60, 1.4, t, 6, 2, 0.4); nvP.position.set(sx, -1.2 + q.y, 60); nvP.rotation.set(0, 1.4, 0); nvP.rotateZ(q.roll); nvP.userData.velas.forEach((v) => v(t, 1)); nvP.userData.flag.upd(t, 1);
      sea.upd(t); dome.userData.u.uOff.value.set(t * 0.004, 0); dome.userData.u.uCov.value = 0.55 + 0.25 * smr(t, K.usou + 0.3, K.escapar);
    },
    after(t) {
      const mk = smr(t, K.amigo5 - 0.4, K.amigo5 + 0.2) * (1 - smr(t, K.guardou - 0.3, K.guardou + 0.2));
      if (mk > 0) { GU.uSat.value = lerp(GU.uSat.value, 0.45, mk); GU.uLift.value.set(lerp(GU.uLift.value.x, 0.08, mk), lerp(GU.uLift.value.y, 0.05, mk), GU.uLift.value.z); }
      GU.uFlashCol.value.set(1, 0.92, 0.7); GU.uFlash.value = 0.4 * Math.pow(1 - seg(t, K.usou + 0.2, K.usou + 0.7), 2) * (t >= K.usou + 0.2 ? 1 : 0);
    },
    cam(t) {
      const c = path2(t, [
        [a, [7, 3.5, 11], [0, 4.5, -3.5], 42],
        [K.amigo5, [4.4, 2.2, 3.6], [1.4, 2.6, -1.4], 38],
        [K.guardou + 0.4, [2.2, 5.6, 4.8], [0, 6.4, -3.0], 36],
        [K.usou + 0.3, [5.5, 2.8, 9.0], [0, 7.5, -2], 44],
        [b, [8.5, 4.0, 14], [0, 6.5, 6], 46],
      ]);
      return { ...shakeCam(c, t, impact(t, K.usou + 0.2, 0.12, 0.8)), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 7 · a fruta: mar ao amanhecer; o elefante gigante para, ergue a tromba e brada; tambores de luz no céu
addSet("s7-fruta", (g) => {
  const [a, b] = T.sc["s7-fruta"];
  const dome = skyDome(g, { top: 0x2a3a78, mid: 0xa07a8a, midY: 0.12, hor: 0xffb070, ground: 0x1a2028, sunDir: [0.15, 0.03, -1], sunCol: 0xffc070, sunI: 0.8, disk: 3.2, cov: 0.62, cloudA: 0.9, cloudLit: 0xffc8a8, cloudSh: 0x5a5a7a, cloudScale: 0.14 });
  const SC = 9, WY = 7.2;
  const sea = oceano(g, { y: WY, size: 520, segs: 150, deep: 0x0c2a42, crest: 0x2a6a8a, foam: 0xc8dce6, env: envGold(), envI: 0.6, amp: 0.8 });
  const el = elefante({ s: SC }); el.rotation.y = 0.35; g.add(el);
  const drums = Array.from({ length: 5 }, () => { const r = mesh(new THREE.TorusGeometry(1, 0.035, 8, 96), glowM(0xffd070, 0), 0, 0, 0, g); r.castShadow = false; return r; });
  const sunB = godRays(g, [12, 30, -150], [-0.08, -0.15, 1], { n: 10, len: 200, w: 10, spread: 40, opacity: 0, color: 0xffd090 });
  const motes = dustPts(260, [-60, 60, 10, 70, -60, 40], 0xffe0a0, 0.25, 0.0); g.add(motes);
  const brd = birds(g, 9, { center: [0, 60, -10], rx: 40, rz: 18, speed: 0.07, color: 0x1a1a22 });
  const stopT = K.zunesha - 0.4, V = 0.55;
  const dist = (t) => V * (Math.min(t, stopT) - a) + V * 0.5 * smr(t, stopT, stopT + 0.9) * 0.9;
  return {
    bg: 0x5a6a8a, fogExp: 0.0026, fogCol: 0xd8a890, dome,
    look: { exposure: 1.05, bloom: 0.6, bloomT: 0.8, vig: 0.42, sat: 1.12, con: 1.06, lift: [0.02, 0.01, 0.03] },
    sun: { dir: [0.3, 0.35, -1], col: 0xffc080, I: 2.4, c: [0, 15, 0], r: 45 }, hemi: { sky: 0x9ab0e0, ground: 0x2a3a48, I: 0.7 }, fill: { col: 0xffd8b0, I: 0.5, dir: [-0.4, 0.3, 1] }, rim: { col: 0xffd0a0, str: 0.6 },
    update(t) {
      const ergue = act(t, K.zunesha - 0.2, K.zunesha + 0.7, 0.15, 0.06) * (1 - 0.3 * smr(t, K.voltou + 0.8, b));
      elefanteAnda(el, dist(t), t, { from: [-8, 0, -10], step: 1.0, ergue: clamp(ergue) });
      // tambores da libertação: anéis que pulsam no céu na batida
      const dk = smr(t, K.despertou - 0.3, K.despertou + 0.2);
      drums.forEach((r, i) => { const beat = [0, 0.22, 0.9, 1.12, 1.8][i], k = ((t - K.despertou - beat) % 2.4 + 2.4) % 2.4 / 1.3; r.visible = dk > 0.01 && k < 1; if (!r.visible) return; r.position.set(0, 46, -60); r.lookAt(0, 20, 40); r.scale.setScalar(4 + 26 * E.out(k)); r.material.opacity = (1 - k) * 0.7 * dk; });
      const sk = smr(t, K.voltou - 0.2, K.voltou + 0.8);
      dome.userData.u.uSunI.value = 0.8 + 1.4 * sk; dome.userData.u.uCov.value = 0.62 + 0.2 * sk;
      sunB.userData.rays.forEach((r, i) => (r.material.opacity = 0.09 * sk * (0.8 + 0.2 * Math.sin(t + i))));
      motes.material.opacity = 0.8 * sk; floatDust(motes, t, 2, 0.12);
      sea.upd(t); brd(t); dome.userData.u.uOff.value.set(t * 0.003, 0);
    },
    after(t) { GU.uFlashCol.value.set(1, 0.92, 0.7); GU.uFlash.value = 0.3 * Math.pow(1 - seg(t, K.voltou, K.voltou + 0.6), 2) * (t >= K.voltou ? 1 : 0); },
    cam(t) {
      el.updateMatrixWorld(true); const hp = wpos(el.userData.head);
      const c = path2(t, [
        [a, [hp.x + 46, WY + 5, hp.z + 70], [hp.x - 6, hp.y - 8, hp.z - 6], 40],
        [K.zunesha - 0.2, [hp.x + 38, WY + 3.5, hp.z + 58], [hp.x - 4, hp.y - 2, hp.z - 4], 42],
        [K.voltou, [hp.x + 30, WY + 8, hp.z + 66], [hp.x - 6, hp.y + 6, hp.z - 14], 44],
        [b, [hp.x + 18, WY + 26, hp.z + 86], [hp.x - 8, hp.y + 2, hp.z - 30], 44],
      ]);
      return { ...shakeCam(c, t, impact(t, K.zunesha, 0.25, 1.0)), near: 0.1 };
    },
  };
});

// ---------------------------------------------------------------- 8 · não é o Joy Boy: salão escuro com trono vazio e lua vermelha; o jovem pirata se levanta sorrindo
addSet("s8-imu", (g) => {
  const [a, b] = T.sc["s8-imu"];
  const mm = texMarmore([26, 24, 30], [90, 70, 80]);
  const fl = mesh(new THREE.PlaneGeometry(30, 50), new THREE.MeshStandardMaterial({ map: rep(mm.map, 4, 6), roughness: 0.12, metalness: 0.25, envMap: envNoite(), envMapIntensity: 0.5 }), 0, 0, -12, g); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
  const colM = SM(0x1a1820, { roughness: 0.35, metalness: 0.3 }); [-5, 5].forEach((x) => { for (let i = 0; i < 6; i++) coluna(g, x, -2 - i * 5, 12, 0.7, { mat: colM, cap: GOLDM() }); });
  mesh(box(30, 0.6, 50), SM(0x0c0a10), 0, 14.5, -12, g);
  // janela redonda com a lua vermelha e o trono vazio no alto dos degraus
  const win = grp(g, 0, 9, -34); mesh(new THREE.TorusGeometry(6, 0.4, 10, 64), GOLDM(), 0, 0, 0, win);
  for (let i = 0; i < 8; i++) { const a_ = (i / 8) * Math.PI; mesh(box(0.15, 12, 0.2), SM(0x1a1418), 0, 0, 0.1, win).rotation.z = a_; }
  const skyW = mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshBasicMaterial({ color: 0x3a0a10 }), 0, 0, -0.3, win);
  const moonM = new THREE.MeshBasicMaterial({ color: 0xff2a2a }); const moon = mesh(new THREE.CircleGeometry(2.6, 48), moonM, 0.8, 0.6, -0.25, win); const moonG = glowSprite(0xff2a2a, 12, 0.35); moonG.position.set(0.8, 0.6, -0.1); win.add(moonG);
  mesh(box(30, 30, 0.6), SM(0x0c0a10), 0, 9, -34.6, g);
  for (let i = 0; i < 6; i++) mesh(box(9 - i * 0.6, 0.35, 1.2), SM(0x1a1820, { roughness: 0.3 }), 0, 0.17 + i * 0.35, -24 - i * 1.1, g);
  const th = grp(g, 0, 2.1, -30.5); const thM = SM(0x2a0a10, { roughness: 0.5 }), gm = GOLDM();
  mesh(box(1.8, 0.4, 1.4), thM, 0, 0.6, 0, th); mesh(box(1.8, 4.2, 0.35), thM, 0, 2.8, -0.55, th); [-0.85, 0.85].forEach((x) => { mesh(box(0.3, 1.0, 1.4), thM, x, 1.1, 0, th); mesh(new THREE.ConeGeometry(0.18, 0.7, 6), gm, x, 5.2, -0.55, th); }); mesh(new THREE.ConeGeometry(0.3, 1.1, 6), gm, 0, 5.4, -0.55, th);
  const redL = new THREE.PointLight(0xff2030, 30, 50, 1.4); redL.position.set(0, 9, -30); g.add(redL);
  const rays = godRays(g, [0, 13, -33], [0, -0.45, 1], { n: 10, len: 40, w: 3, spread: 7, opacity: 0.1, color: 0xff4040 });
  const mist = mistLayers(g, { y: 0.15, opacity: 0.22, color: 0x4a1a2a, size: 60, n: 2 });
  const gold = flowPts(160, 0xffd070, 0.06); g.add(gold.pts);
  // o jovem pirata: começa caído (de joelhos), ouve a voz, se levanta, limpa a boca, sorri e fecha o punho
  const jv = jovem(); jv.position.set(0, 0, -6); jv.rotation.y = Math.PI; g.add(jv);
  return {
    bg: 0x050306, fogExp: 0.03, fogCol: 0x12060a,
    look: { exposure: 1.2, bloom: 0.75, bloomT: 0.7, vig: 0.62, sat: 1.1, con: 1.12 },
    sun: { dir: [0, 0.45, -1], col: 0xff4050, I: 1.0, c: [0, 1, -8], r: 14 }, hemi: { sky: 0x3a1a2a, ground: 0x050306, I: 0.42 }, fill: { col: 0x6a4a8a, I: 0.35, dir: [0.4, 0.3, 1] }, rim: { col: 0xff5060, str: 0.8 }, hand: 0.01,
    update(t) {
      const gk = smr(t, K.herdou - 0.3, K.historia7);      // vermelho vira dourado
      moonM.color.setRGB(1, 0.16 + 0.66 * gk, 0.16 + 0.2 * gk); moonG.material.color.setRGB(1, 0.16 + 0.6 * gk, 0.16 + 0.2 * gk); skyW.material.color.setRGB(0.23 + 0.5 * gk, 0.04 + 0.35 * gk, 0.06 + 0.1 * gk);
      redL.color.setRGB(1, 0.13 + 0.62 * gk, 0.19 + 0.1 * gk); redL.intensity = 30 + 10 * Math.sin(t * 1.3) + 25 * smr(t, K.imu - 0.2, K.imu + 0.3) * (1 - smr(t, K.disse7 + 0.6, K.herdou));
      rays.userData.rays.forEach((r, i) => { r.material.color.setRGB(1, 0.25 + 0.6 * gk, 0.25 + 0.2 * gk); r.material.opacity = 0.09 + 0.03 * Math.sin(t + i); });
      restPose(jv); idle(jv, t, 61, 0.6);
      const up = act(t, K.herdou - 0.3, K.herdou + 0.9, 0.18, 0.05);
      if (up < 0.98) { kneelPose(jv, 1 - clamp(up)); pose(jv, { spine: [0.35 * (1 - clamp(up)), 0, 0], head: [0.4 * (1 - clamp(up)) - 0.2 * smr(t, K.imu, K.imu + 0.4) * (1 - clamp(up)), 0, 0] }); }
      if (up > 0.6) standFeet(jv, { hf: () => 0 });
      const wipe = act(t, K.vontade - 0.2, K.vontade + 0.5, 0.15, 0.05) * (1 - smr(t, K.vontade + 0.6, K.vontade + 1.0));
      if (wipe > 0.01) { jv.updateMatrixWorld(true); const m_ = wpos(jv.userData.head).add(V3(0.08, 0.05, -0.12)); armIK(jv, 0, m_, m_.clone().add(V3(0.5, -0.6, 0)), clamp(wipe)); }
      const fist = act(t, K.historia7 - 0.3, K.historia7 + 0.4, 0.2, 0.08);
      if (fist > 0.01) pose(jv, { armL: [-1.3 * clamp(fist), 0, 0.3, -1.9 * clamp(fist)], handL: 1 }, clamp(fist));
      face(jv, { brow: 0.6 * smr(t, K.nao7, K.nao7 + 0.3) * (1 - gk) - 0.1 * gk, sad: 0.4 * (1 - gk), smile: 0.75 * smr(t, K.vontade, K.historia7), angry: 0.2 * smr(t, K.historia7 - 0.2, K.historia7 + 0.3), lid: 0.92 });
      clothWind(jv, t, 0.6 + 1.6 * gk, [0, 0, 0.05 * gk]); hairPush(jv, 0, 0.6 * gk);
      gold.pts.material.opacity = 0.8 * gk; for (let i = 0; i < 160; i++) { const ph = (t * 0.25 + hash(i * 1.3)) % 1; gold.pos.set([(hash(i) - 0.5) * 8, ph * 6, -6 + (hash(i * 3) - 0.5) * 6 - ph * 6], i * 3); } gold.upd();
      mist(t);
    },
    cam(t) {
      const c = path2(t, [
        [a, [0.6, 1.4, 6.5], [0, 2.4, -24], 40],
        [K.imu - 0.2, [1.0, 2.2, -1.0], [0, 3.6, -26], 38],
        [K.herdou - 0.4, [1.6, 1.0, -8.6], [0, 0.9, -6], 38],
        [K.historia7, [0.9, 1.5, -8.4], [0, 1.45, -6], 34],
        [b, [0.6, 1.55, -8.0], [0, 1.5, -6], 32],
      ]);
      return { ...shakeCam(c, t, impact(t, K.imu, 0.06, 1.0)), near: 0.05 };
    },
  };
});

// ---------------------------------------------------------------- 9 · pergunta: o jovem pirata na proa ao nascer do sol; a bandeira do sol que ri ao vento
addSet("s9-pergunta", (g) => {
  const [a, b] = T.sc["s9-pergunta"];
  const dome = skyDome(g, { top: 0x2a5aa0, mid: 0xd8a888, midY: 0.12, hor: 0xffc890, ground: 0x1a2a38, sunDir: [-0.55, 0.12, -1], sunCol: 0xffc070, sunI: 1.0, disk: 2.8, cov: 0.5, cloudA: 0.75, cloudLit: 0xffe0c0, cloudSh: 0x7a7a9a });
  const sea = oceano(g, { size: 360, segs: 140, deep: 0x0e3a52, crest: 0x5a9ab0, foam: 0xf4f8f8, amp: 0.7 });
  [[-60, -140, 28], [40, -170, 36], [110, -120, 20]].forEach(([x, z, s_], i) => { const il = mesh(sph(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), SM(0x3a5a3a), x, -1, z, g); il.scale.set(s_, s_ * 0.35, s_ * 0.6); });
  const nv = navio(g, { L: 8, W: 2.6, D: 1.3, mastros: [[0.0, 7.0]], bw: 1.6, bh: 1.1, casco: 0x6a4024, faixa: 0x2a5ab8 });
  const jv = jovem(); nv.add(jv); jv.position.set(0, nv.userData.deckY + 0.06, 2.6); jv.rotation.y = 0;
  const ghost = holoify(capitao(), holoMat(0xffc860, { alpha: 0 })); ghost.scale.setScalar(7); ghost.position.set(-6, -2, -34); g.add(ghost);
  const brd = birds(g, 7, { center: [0, 12, 0], rx: 14, rz: 8, speed: 0.13 });
  const SA = -0.3, shipAt = (t) => { const d = (t - a) * 1.2, x = Math.sin(SA) * d, z = Math.cos(SA) * d, q = naviaPose(x, z, SA, t, 8, 2.6, 0.7); return { x, z, ...q }; };
  return {
    bg: 0x8aa0c0, fogExp: 0.004, fogCol: 0xe8c8a8, dome,
    look: { exposure: 1.05, bloom: 0.55, bloomT: 0.84, vig: 0.4, sat: 1.14, con: 1.05, lift: [0.02, 0.01, 0.03] },
    sun: { dir: [-0.55, 0.4, -1], col: 0xffc890, I: 2.6, c: [0, 2, 0], r: 10 }, hemi: { sky: 0xa8c0e8, ground: 0x2a3a48, I: 0.75 }, fill: { col: 0xffe0c0, I: 0.6, dir: [0.4, 0.3, 1] }, rim: { col: 0xffe0b0, str: 0.6 },
    update(t) {
      const s = shipAt(t); nv.position.set(s.x, s.y - 0.25, s.z); nv.rotation.set(0, SA, 0); nv.rotateX(-s.pitch); nv.rotateZ(s.roll);
      nv.userData.velas.forEach((v) => v(t, 1.1)); nv.userData.flag.upd(t, 1.4);
      restPose(jv); idle(jv, t, 61, 0.6); standFeetOn(jv, nv, { y: nv.userData.deckY + 0.06, spread: 1.3 });
      pose(jv, { spine: [s.pitch * 0.5, 0, -s.roll * 0.8], chest: [0, 0, -s.roll * 0.3] });
      const look = smr(t, K.voce - 0.2, K.voce + 0.6), point = act(t, K.terminar - 0.2, K.terminar + 0.6, 0.18, 0.06) * (1 - smr(t, K.comenta + 0.6, b));
      if (point > 0.01) pose(jv, { armR: [-1.55 * clamp(point), 0.25, -0.15, -0.15], handR: 0.3 }, clamp(point));
      nv.updateMatrixWorld(true); const camP = nv.localToWorld(V3(0.6, 2.4, 6.4));
      lookAtW(jv, camP, look * (1 - smr(t, K.terminar - 0.3, K.terminar + 0.2)) + smr(t, K.comenta - 0.3, K.comenta + 0.2), 1.2);
      face(jv, { smile: 0.55 + 0.35 * look, brow: 0.2 * look, open: 0.15 * smr(t, K.comenta - 0.2, K.comenta + 0.3), lid: 0.92 });
      const lag = mola(t, (tt) => { const q = shipAt(tt); return [q.x, q.y + Math.sin(q.pitch) * 2.6, q.z]; }, { k: 30, c: 4 }), L = lagLocal(jv, lag);
      clothWind(jv, t, 1.6, [L[0], 0, -0.05]); hairMola(jv, L, 6);
      const gk = smr(t, K.riu - 0.3, K.riu + 0.4) * (1 - smr(t, K.cedo + 0.4, K.voce - 0.2)); ghost.visible = gk > 0.01;
      if (ghost.visible) { restPose(ghost); idle(ghost, t, 41, 0.5); riso(ghost, t, 1, K.riu); ghost.traverse((c) => { if (c.isMesh && c.material.uniforms && c.material.uniforms.uA) c.material.uniforms.uA.value = gk * 0.5; }); }
      sea.upd(t); brd(t); dome.userData.u.uOff.value.set(t * 0.004, 0);
    },
    cam(t) {
      const s = shipAt(t); nv.updateMatrixWorld(true);
      const P = (x, y, z) => nv.localToWorld(V3(x, y, z)).toArray();
      const c = path2(t, [
        [a, P(3.0, 2.2, 9.5), P(0, 1.6, 2.2), 40],
        [K.riu - 0.2, P(4.5, 3.4, 10.0), P(-1.5, 7.5, -8), 46],
        [K.voce - 0.2, P(1.2, 2.3, 6.6), P(0, 1.75, 2.6), 36],
        [b, P(0.6, 2.3, 5.8), P(0, 1.8, 2.6), 32],
      ]);
      return { ...c, near: 0.05 };
    },
  };
});

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
window.__hf.buildReady["joyboy"] = (async () => {
  try { await document.fonts.load("700 48px 'Archivo Black'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  try { await renderer.compileAsync(scene, camera); } catch (e) { /* compila no primeiro quadro */ }
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
