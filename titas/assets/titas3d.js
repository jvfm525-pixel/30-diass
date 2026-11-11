// Por que os Titãs atacavam humanos se nem precisavam comer? (motor 3D v2, gigantes e pessoas originais)
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
  const capG = new THREE.SphereGeometry(1, 30, 16, 0, Math.PI * 2, 0, Math.PI * (o.capA ?? 0.42)); capG.scale(ax, ay, az);
  const capM = mesh(capG, hm, cx, cy, -0.004, head); capM.rotation.x = o.capTilt ?? -0.42; ol(capM, 0.003);
  const style = o.style ?? "curto", n = o.n ?? (style === "longo" ? 96 : 56);
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
    const lm = mesh(lockGeo([root.toArray(), p1.toArray(), p2.toArray(), p3.toArray()], w, 0.0015, 0.55, 10, 7), shades[i % 3], 0, 0, 0, head);
    lm.castShadow = i % 2 === 0;
  }
  if (style === "rabo") { const pts = [[0, cy + 0.02, -az * 0.95], [0, cy - 0.02, -az * 1.25], [0, cy - 0.12, -az * 1.3], [0, cy - 0.22, -az * 1.15]]; ol(mesh(lockGeo(pts, 0.03, 0.004, 0.8, 14, 9), hm, 0, 0, 0, head), 0.003); }
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
    OL(mesh(lathe([[0.001, -0.235], [0.04, -0.228], [0.043, -0.15], [0.046, -0.05], [0.047, 0.0], [0.001, 0.03]], 16), armM, 0, 0, 0, S.el[i]));
    mesh(cyl(0.05, 0.048, 0.04, 14), TM(P.cuff ?? P.shirt), 0, -0.225, 0, S.el[i]);
    return hand(S.wr[i], i ? 1 : -1, skinM, 1, P.fingers);
  });
  // pescoço e cabeça
  OL(mesh(cyl(0.041, 0.047, 0.1, 14), skinM, 0, 0.03, 0, S.neck));
  const nl = mesh(new THREE.TorusGeometry(0.05, 0.014, 6, 18), shirtM, 0, 0.3, 0.004, S.chest); nl.rotation.x = Math.PI / 2 - 0.25;
  const hg = headGeo({ sx: 0.081, sy: 0.104, sz: 0.097, jaw: 0.22, chin: 0.07, cheek: 0.07, ...(P.headShape || {}) });
  const headM = mesh(hg, skinM, 0, 0, 0); ol(headM, P.olw * 0.9);
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
  // capa opcional (tecido que balança)
  let cloak = null;
  if (P.cloak) {
    const cg = new THREE.PlaneGeometry(0.46, 1.0, 8, 14); cg.translate(0, -0.5, 0);
    cloak = mesh(cg, TM(P.cloak, { side: THREE.DoubleSide }), 0, 0.27, -0.13, S.chest); cloak.userData.base = Float32Array.from(cg.attributes.position.array); cloak.frustumCulled = false;
  }
  S.root.scale.setScalar(P.scale);
  shadows(S.root);
  S.root.userData = { ...S, eyes, brows, mouth, hands, cloak, P, headM, kind: "pessoa" };
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
// capa balançando ao vento
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

// ================================================================ vídeo: Por que os Titãs atacavam humanos? (cenas 1–5)
// gigantes e pessoas originais; nada desenhado da série
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wpos = (o, v = V3()) => o.getWorldPosition(v);
// pele dos gigantes também ganha luz de contorno
function rimGiant(gi) { gi.traverse((c) => { if (c.isMesh && c.material && c.material.isMeshStandardMaterial && c.material.map && !c.material.userData.rim) { rimify(c.material, 0.45); c.material.userData.rim = true; c.material.needsUpdate = true; } }); return gi; }
// vapor saindo dos ombros e da nuca do gigante
function giantSteam(g, gi, o = {}) {
  const S = gi.scale.x;
  const em = [0, 1, 2].map((i) => steam(g, { n: o.n ?? 10, size: (o.size ?? 0.45) * S, rise: 0.25 * S, spread: 0.12 * S, life: 2.6, opacity: o.opacity ?? 0.45, color: o.color ?? 0xf4ece4, seed: i * 7 + (o.seed ?? 0), wind: [0.05 * S, 0, -0.02 * S] }));
  return (t, k = 1) => { const u = gi.userData; em[0].upd(t, k, wpos(u.sh[0])); em[1].upd(t, k, wpos(u.sh[1])); em[2].upd(t, k * 0.8, wpos(u.neck)); };
}
// lanterna com luz
function lantern(parent, x, y, z, I = 2) {
  const l = grp(parent, x, y, z);
  mesh(cyl(0.05, 0.06, 0.12, 8), SM(0x2a2018, { metalness: 0.5 }), 0, 0, 0, l);
  mesh(sph(0.04, 10, 8), BM(0xffd08a), 0, 0, 0, l);
  const gl = glowSprite(0xffb050, 0.9, 0.7); l.add(gl);
  const L = new THREE.PointLight(0xffb060, I, 9, 1.6); l.add(L);
  return { l, L, gl };
}

// 1 · gancho: amanhecer no vale; um gigante sobe atrás do morro, desce até a vila e sorri
addSet("s1-gancho", (g) => {
  const [a, b] = T.sc["s1-gancho"];
  const SD = [-0.86, 0.2, -0.47];
  const dome = skyDome(g, { top: 0x2a5aa8, hor: 0xffb46a, mid: 0xffe4bc, midY: 0.16, ground: 0x4a3a34, sunDir: SD, sunCol: 0xffa050, sunI: 1.1, cov: 0.55, cloudLit: 0xffe0b8, cloudSh: 0x6a7a9a, exp: 0.7, cloudScale: 0.14 });
  const hf = (x, z) => 7.5 * Math.exp(-((z + 20) ** 2) / 120) * (0.85 + 0.15 * Math.cos(x * 0.05)) - (z < -20 ? Math.min(7, (-20 - z) * 0.07) : 0) + (fbm2(x * 0.025 + 5, z * 0.025 + 1, 4) - 0.5) * 2.2;
  terrain(g, { h: hf, size: 700, segs: 220, grassA: 0x55703a, grassB: 0x8a9050 });
  grassField(g, 16000, [-14, 14, -26, 30], hf, { s: 0.8, colA: 0x58763a, colB: 0xb0a860, mask: (x, z) => !(Math.abs(x - 2) < 1.2 && z > 17 && z < 21) });
  forestInst(g, 420, [-260, 260, -260, -45], hf, { h: 11 });
  forestInst(g, 120, [-90, -28, -40, 40], hf, { h: 9 });
  forestInst(g, 120, [28, 90, -40, 40], hf, { h: 9 });
  for (let i = 0; i < 9; i++) rock(g, -12 + hash(i * 3) * 24, hf(-12 + hash(i * 3) * 24, -14 - hash(i * 5) * 10) - 0.3, -14 - hash(i * 5) * 10, 0.6 + hash(i) * 1.4, i + 3);
  // muralha original ao longe
  wallSeg(g, 620, 46, 10, { pos: [0, -6, -250] });
  [-180, -60, 70, 190].forEach((x, i) => tower(g, x, -244, 9, 62, { flag: i % 2 ? 0x8a2a24 : 0x2a3a6a }));
  // vila no pé do morro
  const houses = [];
  [[-9, 12, 0.4], [-14, 20, 0.2], [-7, 26, -0.3], [9, 11, -0.5], [14, 18, -0.2], [8, 28, 0.3], [-17, 30, 0.6], [17, 31, -0.6]].forEach(([x, z, r], i) => houses.push(house(g, x, z, { seed: i + 2, rotY: r, y: hf(x, z) - 0.4, lit: i % 3 === 0 ? 0.6 : 0, w: 5 + hash(i) * 2, h: 4 + hash(i * 2) * 2 })));
  const smoke = houses.slice(0, 4).map((h, i) => steam(g, { n: 8, size: 0.9, rise: 0.9, spread: 0.3, life: 4, opacity: 0.35, color: 0x8a8078, seed: i * 3, wind: [0.4, 0, 0.1] }));
  // morador com lanterna, de costas
  const vil = pessoa({ hair: 0x4a3020, hairStyle: "curto", jacket: 0x5a4632, shirt: 0xcfc3a8, pants: 0x3a3430, seed: 7, fingers: false });
  vil.position.set(2.2, hf(2.2, 19.5), 19.5); vil.rotation.y = Math.PI + 0.15; g.add(vil);
  const lan = lantern(g, 0, 0, 0, 2.5);
  // o gigante
  const gi = rimGiant(gigante({ tipo: "careca", scale: 8, seed: 1 }));
  g.add(gi);
  const vap = giantSteam(g, gi, { size: 0.28, opacity: 0.16, n: 6, color: 0xe8d8c8 });
  const rays = godRays(g, [-120, 40, -70], [0.86, -0.22, 0.47], { n: 9, len: 170, w: 12, spread: 40, opacity: 0.07, color: 0xffc890 });
  const mist = mistLayers(g, { y: 0.6, opacity: 0.3, color: 0xffe0c8, size: 400, n: 3, dy: 1.2 });
  const brd = birds(g, 9, { center: [-6, 24, -30], rx: 18, rz: 10, speed: 0.16, size: 0.8 });
  const dust = dustRing(g, 0xb8a080);
  const rise = (t) => E.out(seg(t, K.titas0 - 0.2, K.nem + 0.8));
  const gx = (t) => -1.5, gz = (t) => lerp(-30, -9, E.inOut(seg(t, K.mesmo - 0.3, K.porque0 + 0.4)));
  const head = V3();
  return {
    bg: 0xc8b8a8, fogExp: 0.0011, fogCol: 0xc0b4a8, dome,
    look: { exposure: 1.0, bloom: 0.5, bloomT: 0.86, bloomR: 0.55, sat: 1.15, vig: 0.42, con: 1.1, lift: [0.0, 0.0, 0.015] },
    sun: { dir: SD, col: 0xffae6a, I: 2.6, c: [0, 6, -12], r: 34 },
    hemi: { sky: 0x8aa0d0, ground: 0x5a4230, I: 0.62 },
    fill: { col: 0xffd8bc, I: 1.1, dir: [0.5, 0.45, 1] },
    rim: { col: 0xffc890, str: 0.7 },
    update(t) {
      const x = gx(t), z = gz(t), r = rise(t);
      gi.position.set(x, hf(x, z) - (1 - r) * 16, z); gi.rotation.y = 0.08;
      restPose(gi);
      if (t < K.mesmo - 0.3) {
        // subindo: mãos agarram o alto do morro
        pose(gi, { spine: [0.35 * (1 - r) + 0.12, 0, 0], neck: [0.1, 0, 0.12], head: [-0.15 * r, 0, 0] });
        [-1, 1].forEach((k, i) => { const tx = x + k * 4.2, tz = -21.5; armIK(gi, i, V3(tx, hf(tx, tz) + 0.4, tz), V3(x + k * 12, gi.position.y + 8, z - 6)); curlHand(gi.userData.hands[i], 0.7); });
      } else if (t < K.porque0 + 0.4) {
        giantWalk(gi, (t - K.mesmo) * 0.42, t, 1, { seed: 1, tilt: 0.2 });
      } else {
        const k = smr(t, K.porque0 + 0.2, K.porque0 + 1.2);
        pose(gi, { spine: [0.32 * k, 0, 0], chest: [0.12 * k, 0, 0], neck: [0.2 * k, 0, 0.3 * k], armR: [-0.2 * k, 0, -0.15, -0.5 * k], armL: [-0.1 * k, 0, 0.15, -0.3] });
      }
      gi.userData.lidOpen = 1; idle(gi, t, 1, 0.6);
      giantMouth(gi, t > K.fica + 0.6 ? 0.5 : 0);
      gi.updateMatrixWorld(true); wpos(gi.userData.head, head);
      if (t > K.porque0) lookAtW(gi, V3(head.x + 1.5, head.y + 1.2, head.z + 9), smr(t, K.porque0, K.porque0 + 0.8));
      vap(t, r);
      // morador
      restPose(vil); idle(vil, t, 3); lookAtW(vil, head, 0.9);
      const fear = smr(t, K.cacando - 0.4, K.cacando + 0.4);
      pose(vil, { hipsPos: [0, 0, -0.25 * fear], armR: [-0.5, 0.2, -0.25, -1.3], armL: [-0.2 * fear, 0, 0.12, -0.4 - 0.6 * fear] });
      vil.updateMatrixWorld(true); wpos(vil.userData.hands[0].h, lan.l.position); lan.l.position.y -= 0.1;
      lan.L.intensity = 2.4 + noise1(t * 6) * 0.4;
      // passos: poeira
      const ph = (t - K.mesmo) * 0.42;
      if (t > K.mesmo) { const st = Math.floor(ph * 2) / 2; const t0 = K.mesmo + st / 0.42; dust(t, t0, wpos(gi.userData.ankle[Math.round(st * 2) % 2 ? 1 : 0]), 3.5); }
      else dust(t, K.titas0 + 1.6, V3(x, hf(x, -21) + 0.5, -21.5), 6, 2.2);
      smoke.forEach((s, i) => s.upd(t, 1, V3().copy(houses[i].userData.chimney).applyMatrix4(houses[i].matrixWorld)));
      mist(t); brd(t + 3);
      dome.userData.u.uOff.value.set(t * 0.004, t * 0.001);
      rays.rotation.z = Math.sin(t * 0.2) * 0.02;
    },
    cam(t) {
      if (t < K.mesmo - 0.1) {
        const c = path(t, [[a, [3.2, 1.25, 6.5], [0, 7.5, -26], 42], [K.nem, [2.4, 1.4, 4.4], [-0.5, 10, -26], 40], [K.mesmo - 0.1, [1.8, 1.55, 3.2], [-1, 11.5, -26], 38]]);
        return shakeCam(c, t, impact(t, K.titas0 + 1.5, 0.14, 1.2) + impact(t, K.nem + 0.4, 0.08));
      }
      if (t < K.porque0 - 0.12) {
        const c = path(t, [[K.mesmo - 0.1, [4.3, 1.95, 25.5], [0, 7.5, -12], 44], [K.porque0 - 0.12, [3.7, 1.85, 24], [-0.5, 8.5, -9], 42]]);
        const ph = (t - K.mesmo) * 0.42, st = Math.floor(ph * 2) / 2;
        return shakeCam(c, t, impact(t, K.mesmo + st / 0.42, 0.05, 0.5));
      }
      return path(t, [[K.porque0 - 0.12, [head.x + 2.6, head.y + 1.3, head.z + 11], [head.x, head.y + 1.1, head.z], 34], [K.fica, [head.x + 1.2, head.y + 1.25, head.z + 7.5], [head.x, head.y + 1.15, head.z], 30], [b, [head.x + 0.5, head.y + 1.2, head.z + 6.2], [head.x, head.y + 1.15, head.z], 28]]);
    },
  };
});

// 2 · raio-X holográfico: o "saco" no peito enche e esvazia
addSet("s2-estomago", (g) => {
  const [a, b] = T.sc["s2-estomago"];
  const grid = new THREE.GridHelper(40, 40, 0x3aa8d8, 0x123848); grid.material.transparent = true; grid.material.opacity = 0.5; grid.material.depthWrite = false; g.add(grid);
  const disc = mesh(new THREE.CircleGeometry(1.6, 48), glowM(0x2a8ac8, 0.35), 0, 0.01, 0, g); disc.rotation.x = -Math.PI / 2; disc.receiveShadow = false;
  const ringM = glowM(0x5ad8ff, 0.8);
  const ring = mesh(new THREE.TorusGeometry(1.25, 0.01, 6, 64), ringM, 0, 1, 0, g); ring.rotation.x = Math.PI / 2;
  const pillars = []; for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2; pillars.push(mesh(box(0.04, 3.4, 0.04), glowM(0x2a7aa8, 0.5), Math.cos(ang) * 2.6, 1.7, Math.sin(ang) * 2.6, g)); }
  const gi = gigante({ tipo: "careca", scale: 1.0, seed: 1 }); g.add(gi);
  const hm = holoMat(0x5ad8ff); holoify(gi, hm);
  // o saco (sem digestão): esfera laranja dentro do peito
  const sac = mesh(sph(1, 28, 20), new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color(0xff8a3a) }, uK: { value: 0.6 } }, vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vV = -mv.xyz; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }", fragmentShader: "uniform vec3 uC; uniform float uK; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6); gl_FragColor = vec4(uC * (0.25 + f * 2.2) * uK, 1.0); }", transparent: true, depthWrite: false, blending: ADD }), 0, 0, 0, gi.userData.spine);
  sac.renderOrder = 8;
  const dots = flowPts(70, 0xffc070, 0.035); g.add(dots.pts); dots.pts.renderOrder = 9;
  const spit = flowPts(90, 0xffa050, 0.04); g.add(spit.pts); spit.pts.renderOrder = 9;
  const bgDust = dustPts(260, [-8, 8, 0, 6, -8, 4], 0x3a9ad8, 0.03, 0.7); g.add(bgDust);
  const scan = mesh(new THREE.PlaneGeometry(3.4, 0.05), glowM(0x9af0ff, 0.9), 0, 1, 0.9, g);
  const P = (o) => wpos(o);
  return {
    bg: 0x02060c, fog: [6, 30],
    look: { exposure: 0.85, bloom: 0.75, bloomT: 0.35, bloomR: 0.45, vig: 0.55, sat: 1.1, con: 1.08, grain: 0.035 },
    sun: { dir: [0.3, 1, 0.4], col: 0x5ad8ff, I: 0.2, shadow: false }, hemi: { sky: 0x1a3a5a, ground: 0x02060c, I: 0.3 },
    update(t) {
      const lt = t - a;
      gi.position.set(0, 0, 0); gi.rotation.y = 0.5 + lt * 0.1;
      restPose(gi);
      const walkK = smr(t, K.voltam - 0.2, K.voltam + 0.6);
      if (walkK > 0) giantWalk(gi, (t - K.voltam) * 0.6, t, walkK, { seed: 2 });
      idle(gi, t, 2, 0.5);
      const fill = smr(t, K.saco - 0.3, K.enche + 0.2), empty = smr(t, K.vomitam - 0.1, K.vomitam + 0.5);
      const S = 0.06 + fill * 0.07 * (1 - empty) + Math.sin(t * 10) * 0.004 * fill * (1 - empty);
      sac.scale.set(S * 1.25, S, S); sac.position.set(0, 0.06, 0.05); sac.material.uniforms.uK.value = 0.5 + fill * 0.8 * (1 - empty) + empty * Math.max(0, 1 - (t - K.vomitam) * 2);
      gi.updateMatrixWorld(true);
      // pontos descendo da boca até o saco (o que ele engole)
      const mouth = wpos(gi.userData.head).add(V3(0, 0.14, 0.12)), neck = P(gi.userData.neck), sacP = P(sac);
      for (let i = 0; i < 70; i++) {
        const ph = ((lt * 0.55 + hash(i * 1.7)) % 1), on = t > K.digestivo && t < K.vomitam;
        const p = ph < 0.5 ? mouth.clone().lerp(neck, ph * 2) : neck.clone().lerp(sacP, (ph - 0.5) * 2);
        if (ph > 0.95 || !on) p.copy(sacP).add(V3((hash(i) - 0.5) * S * 2, (hash(i * 2) - 0.5) * S * 1.6, (hash(i * 3) - 0.5) * S * 1.6));
        if (t < K.digestivo) p.set(0, -50, 0);
        dots.pos.set([p.x, p.y, p.z], i * 3);
      }
      dots.upd(); dots.pts.material.opacity = 1 - empty;
      // vômito: jato de pontos saindo da boca
      for (let i = 0; i < 90; i++) {
        const k = t - K.vomitam - hash(i * 3.1) * 0.5, on = k > 0 && k < 1.4;
        const dir = V3(Math.sin(gi.rotation.y), -0.2, Math.cos(gi.rotation.y));
        const p = on ? mouth.clone().addScaledVector(dir, k * 2.2).add(V3((hash(i) - 0.5) * k * 0.6, -k * k * 1.6, (hash(i * 7) - 0.5) * k * 0.6)) : V3(0, -50, 0);
        spit.pos.set([p.x, p.y, p.z], i * 3);
      }
      spit.upd();
      scan.position.y = 0.2 + ((lt * 0.45) % 1) * 2.2; scan.lookAt(0, scan.position.y, 6); ring.position.y = scan.position.y;
      floatDust(bgDust, t, 0.2, 0.15);
      hm.uniforms.uC.value.set(t > K.voltam ? 0xff6a5a : 0x5ad8ff);
    },
    cam(t) {
      const c = path(t, [[a, [2.2, 1.5, 4.6], [0, 1.15, 0], 36], [K.saco, [1.2, 1.25, 2.7], [0, 1.05, 0], 32], [K.vomitam, [0.4, 1.55, 2.4], [0, 1.3, 0], 34], [b, [-1.6, 1.4, 3.6], [0, 1.1, 0], 38]]);
      return shakeCam(c, t, impact(t, K.vomitam, 0.03, 0.5));
    },
  };
});

// 3 · o sol: time-lapse do dia para a noite; os gigantes desaceleram e param
addSet("s3-sol", (g) => {
  const [a, b] = T.sc["s3-sol"];
  const dome = skyDome(g, { top: 0x3a6ab8, hor: 0xcfe2f0, sunDir: [0.3, 0.8, -0.5], cov: 0.5, stars: 0 });
  const hf = (x, z) => (fbm2(x * 0.02 + 9, z * 0.02 + 4, 4) - 0.5) * 3.5 + Math.max(0, -z - 90) * 0.12;
  terrain(g, { h: hf, size: 700, segs: 200, grassA: 0x5e7a3a, grassB: 0x9aa050 });
  grassField(g, 9000, [-20, 20, -10, 22], hf, { s: 0.75 });
  forestInst(g, 300, [-260, 260, -260, -70], hf, { h: 10 });
  wallSeg(g, 560, 40, 10, { pos: [0, -3, -200] }); [-150, -20, 120].forEach((x) => tower(g, x, -194, 8, 54, { lit: true }));
  const gs = [gigante({ tipo: "careca", scale: 6.5, seed: 1 }), gigante({ tipo: "magro", scale: 7, seed: 3, hair: 0x2a2018 }), gigante({ tipo: "gordo", scale: 5.6, seed: 5 })].map((x) => { rimGiant(x); g.add(x); return x; });
  const start = [[-11, -26], [1, -32], [12, -24]];
  const moon = mesh(sph(14, 32, 20), BM(0xeef2ff, { fog: false }), 0, 0, 0, g); const mg = glowSprite(0xbcd0ff, 90, 0.35); mg.material.fog = false; moon.add(mg);
  const C = (h) => new THREE.Color(h);
  const DAY = { top: C(0x2a5ab0), hor: C(0xbcd6ee), sun: C(0xfff2dc) }, DUSK = { top: C(0x3a3a6a), hor: C(0xff9a50), sun: C(0xff7a30) }, NIGHT = { top: C(0x050a1a), hor: C(0x1a2a4a), sun: C(0x6a8acc) };
  const tmp = { top: C(0), hor: C(0), sun: C(0) }, sd = V3();
  let u = 0;
  return {
    bg: 0xcfe2f0, fogExp: 0.0016, dome,
    look: { exposure: 1.0, bloom: 0.6, bloomT: 0.75 },
    update(t) {
      // 0 = meio-dia, 0.5 = pôr do sol, 1 = noite
      u = clamp(seg(t, a + 0.3, K.noite + 0.5) * 0.85 + smr(t, K.noite - 0.2, K.noite + 0.8) * 0.15);
      const el = lerp(1.1, -0.35, u), az = lerp(-0.3, 1.2, u);
      sd.set(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)).normalize();
      const k1 = clamp(u * 2), k2 = clamp(u * 2 - 1);
      ["top", "hor", "sun"].forEach((n) => tmp[n].copy(DAY[n]).lerp(DUSK[n], k1).lerp(NIGHT[n], k2));
      const U = dome.userData.u; U.uTop.value.copy(tmp.top); U.uHor.value.copy(tmp.hor); U.uSunDir.value.copy(sd); U.uSunCol.value.copy(tmp.sun); U.uSunI.value = 1.2 * (1 - k2); U.uStars.value = k2 * 1.2; U.uCloudLit.value.copy(tmp.hor).lerp(C(0xffffff), 0.4 * (1 - k2)); U.uCloudSh.value.copy(tmp.top); U.uCloudA.value = 0.9 - k2 * 0.5; U.uOff.value.set(t * 0.03, t * 0.01);
      scene.fog.color.copy(tmp.hor); scene.background.copy(tmp.hor);
      const sunUp = sd.y > -0.05;
      setSun(sunUp ? sd.toArray() : [-0.4, 0.6, 0.3], sunUp ? tmp.sun : C(0x8aa8ff), sunUp ? 2.6 * clamp(sd.y * 4 + 0.2) : 0.5, [0, 5, -24], 40);
      hemi.color.copy(tmp.top).lerp(C(0xffffff), 0.3); hemi.groundColor.set(0x3a3020); hemi.intensity = lerp(0.75, 0.25, k2);
      renderer.toneMappingExposure = lerp(1.0, 1.25, k2);
      RIM.col.value.copy(tmp.sun); RIM.str.value = 0.4 + k1 * 0.3;
      moon.position.set(-60 + 40 * u, lerp(-40, 70, k2), -260); moon.visible = k2 > 0.01;
      // gigantes: andam de dia, ficam lentos no fim da tarde, param à noite
      const speed = 1 - smr(u, 0.35, 0.9), still = smr(u, 0.75, 1.0);
      gs.forEach((gi, i) => {
        const dist = (t - a) * 1.6 * (0.7 + 0.3 * speed) - smr(t, a, b) * 2 * (1 - speed);
        const x = start[i][0], z = start[i][1] + Math.min(dist, 12);
        gi.position.set(x, hf(x, z), z); gi.rotation.y = 0.1 * (i - 1);
        restPose(gi);
        giantWalk(gi, (t - a) * 0.45 * (0.2 + 0.8 * speed) + i * 0.33, t, speed * (1 - still), { seed: i, tilt: 0.1 });
        pose(gi, { spine: [0.45 * still, 0, 0], neck: [0.5 * still, 0, 0.35 * still], armR: [0.1, 0, -0.08, -0.1], armL: [0.1, 0, 0.08, -0.1], hipsPos: [0, -0.06 * still, 0] }, still);
        gi.userData.lidOpen = 1 - 0.85 * still; idle(gi, t, i, 0.5 * (1 - still));
      });
    },
    cam(t) { return path(t, [[a, [6, 4.5, 34], [0, 9, -24], 46], [b, [3, 4, 30], [0, 9.5, -24], 44]]); },
  };
});

// 4 · animais: o gigante passa pelo pasto sem olhar os bichos e vira a cabeça pro humano
addSet("s4-animais", (g) => {
  const [a, b] = T.sc["s4-animais"];
  const SD = [0.75, 0.32, -0.55];
  const dome = skyDome(g, { top: 0x2f62b0, hor: 0xffdcb0, sunDir: SD, sunCol: 0xffc070, sunI: 1.1, cov: 0.58, cloudLit: 0xfff0d8, cloudSh: 0x8a8aa8, exp: 0.8 });
  const hf = (x, z) => (fbm2(x * 0.03 + 2, z * 0.03 + 7, 4) - 0.5) * 2.4;
  terrain(g, { h: hf, size: 600, segs: 200, grassA: 0x6a8a3a, grassB: 0xb0aa58 });
  grassField(g, 15000, [-18, 18, -14, 20], hf, { s: 0.7, colA: 0x6a8a3a, colB: 0xc0b468 });
  forestInst(g, 260, [-220, 220, -220, -60], hf, { h: 10 });
  // cerca de madeira
  const wood = SM(0x7a5a3a);
  for (let i = 0; i < 18; i++) { const x = -26 + i * 3; mesh(box(0.16, 1.3, 0.16), wood, x, hf(x, 8) + 0.55, 8, g); if (i < 17) { mesh(box(3, 0.1, 0.07), wood, x + 1.5, hf(x, 8) + 0.95, 8, g); mesh(box(3, 0.1, 0.07), wood, x + 1.5, hf(x, 8) + 0.5, 8, g); } }
  // bichos pastando
  const animals = [[-4, 2, 0.8, "vaca"], [1.5, 4.5, -0.5, "cavalo"], [-1, -3, 2.2, "vaca"], [5.5, 0.5, 1.4, "cavalo"], [-7, 5, -1.2, "vaca"], [3.5, -5.5, 0.2, "vaca"]].map(([x, z, r, tp], i) => { const an = quadrupede({ tipo: tp, col: [0x7a4a2a, 0x3a2418, 0xb08850][i % 3] }); an.position.set(x, hf(x, z), z); an.rotation.y = r; g.add(an); return an; });
  // casa da fazenda e o fazendeiro com lanterna
  const farm = house(g, -16, -38, { seed: 9, w: 7, h: 5, rotY: 0.5, lit: 0.8 });
  const far = pessoa({ hair: 0x3a2a1a, hairStyle: "curto", jacket: 0x4a5a3a, shirt: 0xd8ccb0, seed: 11, fingers: false }); far.position.set(-13.5, hf(-13.5, -34.5), -34.5); far.rotation.y = 0.9; g.add(far);
  const lan = lantern(g, 0, 0, 0, 3);
  tree(g, 12, hf(12, -6), -6, { h: 9, seed: 5 }); tree(g, -12, hf(-12, 3), 3, { h: 7, seed: 8 });
  const gi = rimGiant(gigante({ tipo: "magro", scale: 7.5, seed: 3, hair: 0x2a2018 })); g.add(gi);
  const vap = giantSteam(g, gi, { size: 0.3, opacity: 0.22, n: 8 });
  const dust = dustRing(g, 0xa89878);
  const turn = (t) => smr(t, K.atacam3 - 0.6, K.humanos + 0.2);
  const farP = V3();
  return {
    bg: 0xe8d8c0, fogExp: 0.0022, fogCol: 0xe0d4c0, dome,
    look: { exposure: 1.05, bloom: 0.6, bloomT: 0.78, sat: 1.15, lift: [0.02, 0.01, 0] },
    sun: { dir: SD, col: 0xffc080, I: 2.8, c: [0, 4, -4], r: 30 },
    hemi: { sky: 0x9ab4e0, ground: 0x5a4a28, I: 0.6 }, rim: { col: 0xffd0a0, str: 0.6 },
    update(t) {
      const lt = t - a, x = lerp(9, -7, seg(t, a, K.atacam3 + 0.4)), z = -10 + Math.sin(lt * 0.3) * 0.5;
      gi.position.set(x, hf(x, z), z); gi.rotation.y = -Math.PI / 2 + 0.15 + turn(t) * 0.55;
      restPose(gi);
      giantWalk(gi, lt * 0.42, t, 1 - turn(t) * 0.8, { seed: 3, tilt: 0.25, arms: 0.3 });
      idle(gi, t, 3, 0.4);
      gi.updateMatrixWorld(true); wpos(far.userData.head, farP);
      if (turn(t) > 0) lookAtW(gi, farP, turn(t), 1.4);
      gi.userData.lidOpen = 1; giantMouth(gi, turn(t) * 0.35);
      vap(t, 0.8);
      if (t < K.atacam3) { const st = Math.floor(lt * 0.42 * 2) / 2; dust(t, a + st / 0.42, wpos(gi.userData.ankle[Math.round(st * 2) % 2 ? 1 : 0]), 2.5); }
      animals.forEach((an, i) => animalAnim(an, t, i === 2 && t > K.cavalos ? 1 - smr(t, K.cavalos, K.cavalos + 0.6) * 0.8 : 1, 0, i));
      restPose(far); idle(far, t, 5); pose(far, { armR: [-0.4, 0.2, -0.2, -1.2] });
      far.updateMatrixWorld(true); wpos(far.userData.hands[0].h, lan.l.position);
    },
    cam(t) {
      if (t < K.atacam3 - 0.15) {
        const gx = gi.position.x; const c = path(t, [[a, [-3.5, 0.8, 6.6], [gx * 0.6 + 1, 4.8, -8], 48], [K.vacas, [-2.6, 0.85, 5.8], [gx * 0.6 + 0.5, 6.5, -9], 46], [K.atacam3 - 0.15, [-1.8, 0.95, 5.2], [gx * 0.6, 8.5, -10], 44]]);
        const st = Math.floor((t - a) * 0.42 * 2) / 2;
        return shakeCam(c, t, impact(t, a + st / 0.42, 0.04, 0.5));
      }
      const hp = wpos(gi.userData.head), dir = farP.clone().sub(hp).setY(0).normalize(), side = V3().crossVectors(dir, V3(0, 1, 0)).normalize();
      const p0 = hp.clone().addScaledVector(dir, -7).addScaledVector(side, 3.2).add(V3(0, 2.6, 0)), p1 = hp.clone().addScaledVector(dir, -5.5).addScaledVector(side, 2.6).add(V3(0, 2.2, 0));
      return path(t, [[K.atacam3 - 0.15, p0.toArray(), farP.toArray(), 34], [b, p1.toArray(), farP.toArray(), 28]]);
    },
  };
});

// 5 · keys: sala da torre à luz de vela, baú com cartões; o olho de um gigante espia pela janela
addSet("s5-keys", (g) => {
  const [a, b] = T.sc["s5-keys"];
  const bl = texBlocks([120, 112, 104], [96, 90, 84]);
  const wallM = (sx, sy) => { const m = bl.map.clone(), n = bl.normalMap.clone(); m.needsUpdate = n.needsUpdate = true; rep(m, sx, sy); rep(n, sx, sy); return SM(0xffffff, { map: m, normalMap: n, normalScale: new THREE.Vector2(1.5, 1.5), roughness: 0.95 }); };
  const pk = texPlanks(); const fm = pk.map.clone(), fn = pk.normalMap.clone(); fm.needsUpdate = fn.needsUpdate = true; rep(fm, 3, 3); rep(fn, 3, 3);
  mesh(box(8, 0.2, 8), SM(0xffffff, { map: fm, normalMap: fn }), 0, -0.1, 0, g);
  const back = mesh(box(8, 5, 0.4), wallM(2.5, 1.6), 0, 2.5, -3, g);
  mesh(box(0.4, 5, 8), wallM(2.5, 1.6), -3.6, 2.5, 0, g); mesh(box(0.4, 5, 8), wallM(2.5, 1.6), 3.6, 2.5, 0, g);
  // janela (abertura) com céu noturno; atrás dela, a cabeça de um gigante
  back.visible = false;
  [[-2.4, 2.5, 3.2, 5], [2.4, 2.5, 3.2, 5], [0, 0.6, 1.6, 1.2], [0, 4.2, 1.6, 1.6]].forEach(([x, y, w, h]) => mesh(box(w, h, 0.4), wallM(w / 3, h / 3), x, y, -3, g));
  mesh(box(1.8, 0.15, 0.6), SM(0x6a5a4a), 0, 1.2, -2.8, g);
  const sky = mesh(new THREE.PlaneGeometry(30, 20), BM(0x0c1a34, { fog: false }), 0, 4, -24, g);
  const stars = dustPts(120, [-12, 12, 0, 12, -22, -21], 0xffffff, 0.12, 0.9); g.add(stars);
  const gh = rimGiant(gigante({ tipo: "careca", scale: 7, seed: 1 })); gh.position.set(0.43, -9.77, -4.7); g.add(gh);
  const faceL = new THREE.PointLight(0x7a98ff, 1.6, 5, 1.5); faceL.position.set(-1.2, 3.2, -3.4); g.add(faceL);
  const warm = new THREE.PointLight(0xffa860, 2.2, 3.4, 1.5); warm.position.set(1.0, 1.9, 1.2); g.add(warm);
  // mesa, vela, baú e cartões
  const tw = texPlanks([140, 96, 60], [110, 74, 44]);
  mesh(box(2.6, 0.12, 1.4), SM(0xffffff, { map: tw.map, normalMap: tw.normalMap }), 0, 1.0, -0.6, g);
  [[-1.1, -1.15], [1.1, -1.15], [-1.1, -0.05], [1.1, -0.05]].forEach(([x, z]) => mesh(box(0.12, 1.0, 0.12), SM(0x5a3a22), x, 0.5, z, g));
  const chestG = grp(g, 0.1, 1.06, -0.65);
  const cw = SM(0x6a4426), band = SM(0xc8a050, { metalness: 0.8, roughness: 0.35 });
  mesh(box(0.9, 0.42, 0.55), cw, 0, 0.21, 0, chestG); [-0.3, 0.3].forEach((x) => mesh(box(0.06, 0.44, 0.57), band, x, 0.21, 0, chestG));
  const lid = grp(chestG, 0, 0.42, -0.275); mesh(box(0.9, 0.12, 0.55), cw, 0, 0.06, 0.275, lid); lid.rotation.x = -1.9;
  const cardTex = canvasTex(256, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#2a1a4a"); gr.addColorStop(1, "#c8572a"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,230,160,.9)"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#fff"; c.font = "700 54px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("KEY", w / 2, h / 2 - 12); c.font = "700 22px 'Space Mono', monospace"; c.fillText("ALEATÓRIA", w / 2, h / 2 + 34); }, { redraw: true });
  const cards = []; for (let i = 0; i < 9; i++) { const cd = mesh(box(0.32, 0.2, 0.01), new THREE.MeshStandardMaterial({ map: cardTex, emissive: 0xffffff, emissiveMap: cardTex, emissiveIntensity: 0.35, roughness: 0.4 }), 0, 0, 0, chestG); cards.push(cd); }
  const cglow = glowSprite(0xffc070, 1.6, 0.5); cglow.position.set(0, 0.5, 0); chestG.add(cglow);
  const candle = grp(g, -0.9, 1.06, -0.4); mesh(cyl(0.05, 0.055, 0.32, 12), SM(0xf2e8d0), 0, 0.16, 0, candle);
  const flame = glowSprite(0xffb050, 0.28, 0.95); flame.position.y = 0.4; candle.add(flame); const flame2 = glowSprite(0xfff0c0, 0.1, 1); flame2.position.y = 0.38; candle.add(flame2);
  const cl = new THREE.PointLight(0xffa050, 6, 8, 1.4); cl.position.set(0, 0.5, 0); cl.castShadow = true; cl.shadow.mapSize.set(1024, 1024); cl.shadow.bias = -0.002; candle.add(cl);
  const moonL = new THREE.SpotLight(0x8aa8ff, 30, 30, 0.5, 0.6, 1.2); moonL.position.set(0, 4, -12); moonL.target.position.set(0, 0.5, 1); g.add(moonL, moonL.target);
  const motes = dustPts(140, [-2, 2, 0.8, 3, -2.5, 1.5], 0xffd8a0, 0.025, 0.6); g.add(motes);
  return {
    bg: 0x050608, fog: [6, 40],
    look: { exposure: 1.15, bloom: 0.9, bloomT: 0.6, vig: 0.55, sat: 1.1, lift: [0.0, 0.01, 0.03] },
    sun: { dir: [0, 1, -1], col: 0x8aa8ff, I: 0.15, shadow: false }, hemi: { sky: 0x2a3a5a, ground: 0x1a1008, I: 0.35 }, rim: { col: 0xffb060, str: 0.5 },
    update(t) {
      const lt = t - a;
      cl.intensity = 6 + noise1(t * 7) * 1.2 + noise1(t * 13) * 0.6; flame.scale.setScalar(0.28 + noise1(t * 9) * 0.03);
      lid.rotation.x = -0.05 - 1.85 * E.outBack(smr(t, a + 0.1, K.steam - 0.2));
      const up = smr(t, K.steam - 0.3, K.bio + 0.3);
      cards.forEach((cd, i) => { const ang = (i / 9) * Math.PI * 2 + lt * 0.6; const r = 0.12 + up * 0.35; cd.position.set(Math.cos(ang) * r * 1.2, 0.3 + up * (0.35 + Math.sin(lt * 2 + i) * 0.06) + (i % 3) * 0.02, Math.sin(ang) * r * 0.6); cd.rotation.set(-0.3 + Math.sin(lt + i) * 0.2, -ang + Math.PI / 2, Math.sin(lt * 1.3 + i) * 0.2); });
      cglow.material.opacity = 0.35 + up * 0.4;
      restPose(gh); idle(gh, t, 1, 0.3); gh.userData.lidOpen = t > K.bio && t < K.bio + 0.25 ? 0 : 1;
      gh.userData.eyeYaw = 0.1; gh.userData.eyePitch = 0.15;
      gh.position.set(0.43, -9.77, -4.7); gh.updateMatrixWorld(true); const ep = wpos(gh.userData.eyes[0].g); gh.position.add(V3(0.15 - ep.x, 2.35 + Math.sin(t * 0.8) * 0.03 - ep.y, -3.75 - ep.z));
      floatDust(motes, t, 0.15, 0.2);
    },
    cam(t) { return path(t, [[a, [1.6, 1.9, 2.6], [0, 1.4, -1.2], 40], [K.bio, [0.8, 1.75, 1.6], [0.1, 1.45, -1.4], 36], [b, [0.3, 1.8, 1.2], [0.2, 1.6, -2], 34]]); },
  };
});

// ================================================================ vídeo: Por que os Titãs atacavam humanos? (cenas 6–10)
// chuva determinística (linhas que caem)
function rainFx(g, n, area, seed = 1, col = 0xaab8d0) {
  const pos = new Float32Array(n * 6), geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const ln = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.45, fog: true })); ln.frustumCulled = false; g.add(ln);
  return (t) => {
    for (let i = 0; i < n; i++) {
      const x = area[0] + hash(i + seed) * (area[1] - area[0]), z = area[4] + hash(i + seed + 50) * (area[5] - area[4]), span = area[3] - area[2];
      const y = area[3] - ((hash(i + seed + 90) * span + t * 14) % span);
      pos.set([x, y, z, x - 0.12, y + 0.7, z + 0.05], i * 6);
    }
    geo.attributes.position.needsUpdate = true;
  };
}
// raio (linha quebrada) que pisca
function bolt(g, from, to, seed = 1) {
  const pts = [], n = 14; for (let i = 0; i <= n; i++) { const u = i / n; pts.push(lerp(from[0], to[0], u) + (i && i < n ? (hash(i * 3 + seed) - 0.5) * 8 : 0), lerp(from[1], to[1], u), lerp(from[2], to[2], u) + (i && i < n ? (hash(i * 7 + seed) - 0.5) * 4 : 0)); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: 1, fog: false, blending: ADD })); l.frustumCulled = false; g.add(l);
  const tg = mesh(lockGeo(pts.reduce((a, v, i) => (i % 3 === 0 ? [...a, [pts[i], pts[i + 1], pts[i + 2]]] : a), []), 0.5, 0.2, 1, 40, 5), glowM(0xb8c8ff, 0.5), 0, 0, 0, g); tg.material.fog = false;
  return (on) => { l.visible = tg.visible = on; };
}
// pessoa sentada / ajoelhada
function sitPose(p, k = 1, o = {}) {
  const u = p.userData;
  pose(p, { hipsPos: [0, -(u.d.hipY - (o.seatY ?? 0.18)), 0], legR: [-1.45, 0.12, -0.05, 1.5, -0.2], legL: [-1.45, -0.12, 0.05, 1.5, -0.2], spine: [o.lean ?? -0.12, 0, 0] }, k);
}
function kneelPose(p, k = 1) {
  const u = p.userData;
  pose(p, { hipsPos: [0, -(u.d.thigh + 0.02), -0.15], legR: [0.1, 0, 0, 1.6, 0.6], legL: [0.1, 0, 0, 1.6, 0.6], spine: [0.35, 0, 0], chest: [0.15, 0, 0], neck: [0.25, 0, 0] }, k);
}
// gigante coberto de musgo, cipós e um ninho (anos parado)
function mossify(gi) {
  const u = gi.userData, mossM = SM(0x4a6a2a, { roughness: 1 }), moss2 = SM(0x6a8a3a, { roughness: 1 });
  const add = (parent, x, y, z, r, m = mossM) => { const b = mesh(foliageGeo(Math.floor(x * 100 + y * 37) & 7), m, x, y, z, parent); b.scale.set(r, r * 0.55, r); return b; };
  [-1, 1].forEach((k, i) => { add(u.sh[i], 0, 0.06, 0, 0.09, moss2); add(u.sh[i], k * 0.02, -0.12, 0.03, 0.06); add(u.hipJ[i], 0, -0.12, 0.08, 0.08, moss2); add(u.knee[i], 0, 0.02, 0.05, 0.06); });
  const hs = u.d.headS; add(u.head, 0.03, 0.27 * hs, -0.02, 0.09 * hs, moss2); add(u.head, -0.06 * hs, 0.22 * hs, -0.05, 0.06 * hs);
  add(u.chest, 0.05, 0.3, -0.05, 0.1); add(u.chest, -0.1, 0.12, 0.1, 0.05);
  const vine = SM(0x3a5a22);
  for (let i = 0; i < 8; i++) { const par = i % 2 ? u.sh[1] : u.sh[0], k = i % 2 ? 1 : -1; mesh(lockGeo([[0, 0.05, 0.02 * (i - 4)], [k * 0.03, -0.12, 0.05], [k * 0.02, -0.28 - hash(i) * 0.1, 0.06], [k * 0.01, -0.4 - hash(i * 3) * 0.12, 0.04]], 0.008, 0.003, 0.8, 10, 5), vine, 0, 0, 0, par); }
  const nest = grp(u.head, 0.02 * hs, 0.3 * hs, -0.01);
  mesh(new THREE.TorusGeometry(0.035, 0.016, 6, 14), SM(0x6a5034), 0, 0, 0, nest).rotation.x = Math.PI / 2;
  [0, 1, 2].forEach((i) => mesh(sph(0.011, 8, 6), SM(0xd8d0b8), Math.cos(i * 2.1) * 0.012, 0.008, Math.sin(i * 2.1) * 0.012, nest));
  shadows(gi);
}
// silhueta brilhante de uma pessoa encolhida (a pessoa dentro do gigante)
function ghostPerson(color = 0xffc070) {
  const p = pessoa({ fingers: false, hairStyle: "curto", seed: 21 });
  restPose(p);
  pose(p, { hipsPos: [0, -0.62, 0], legR: [-1.9, 0.1, 0, 2.2, 0], legL: [-1.9, -0.1, 0, 2.2, 0], spine: [0.5, 0, 0], chest: [0.3, 0, 0], neck: [0.5, 0, 0], armR: [-1.2, 0, -0.35, -1.4], armL: [-1.2, 0, 0.35, -1.4] });
  const m = holoMat(color, { alpha: 1 }); m.depthTest = false; holoify(p, m);
  p.traverse((c) => { c.renderOrder = 20; });
  const gl = glowSprite(color, 2.2, 0.35); gl.position.y = 0.55; gl.material.depthTest = false; gl.renderOrder = 19; p.add(gl);
  p.userData.glow = gl; p.userData.hm = m;
  return p;
}
// retrato pintado (mulher genérica, original) com moldura e vidro rachado
const portraitTex = canvasTex(512, 640, (c, w, h) => {
  const bgG = c.createRadialGradient(w * 0.45, h * 0.35, 20, w / 2, h / 2, h * 0.7); bgG.addColorStop(0, "#7a6248"); bgG.addColorStop(1, "#24180f"); c.fillStyle = bgG; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) { c.fillStyle = `rgba(${hash(i) > 0.5 ? "255,230,190" : "20,12,6"},${0.03 + hash(i * 3) * 0.04})`; c.fillRect(hash(i * 5) * w, hash(i * 7) * h, 2 + hash(i * 9) * 6, 1 + hash(i * 11) * 3); }
  const sh = c.createLinearGradient(0, h * 0.62, 0, h); sh.addColorStop(0, "#5a3a4a"); sh.addColorStop(1, "#2a1a24"); c.fillStyle = sh;
  c.beginPath(); c.moveTo(w * 0.08, h); c.bezierCurveTo(w * 0.12, h * 0.74, w * 0.3, h * 0.68, w * 0.4, h * 0.66); c.lineTo(w * 0.6, h * 0.66); c.bezierCurveTo(w * 0.7, h * 0.68, w * 0.88, h * 0.74, w * 0.92, h); c.fill();
  c.fillStyle = "#e8dcc8"; c.beginPath(); c.moveTo(w * 0.4, h * 0.66); c.quadraticCurveTo(w / 2, h * 0.76, w * 0.6, h * 0.66); c.fill();
  const nk = c.createLinearGradient(w * 0.42, 0, w * 0.58, 0); nk.addColorStop(0, "#b07858"); nk.addColorStop(0.5, "#d8a684"); nk.addColorStop(1, "#a06a4c"); c.fillStyle = nk; c.fillRect(w * 0.43, h * 0.5, w * 0.14, h * 0.18);
  const hr = c.createLinearGradient(0, h * 0.15, 0, h * 0.6); hr.addColorStop(0, "#4a2e1c"); hr.addColorStop(1, "#24160c"); c.fillStyle = hr;
  c.beginPath(); c.ellipse(w / 2, h * 0.38, w * 0.215, h * 0.22, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(w * 0.66, h * 0.56, w * 0.07, h * 0.12, -0.3, 0, 7); c.fill();
  const sk = c.createRadialGradient(w * 0.46, h * 0.38, 8, w / 2, h * 0.42, w * 0.2); sk.addColorStop(0, "#f2d0b0"); sk.addColorStop(0.7, "#d8a684"); sk.addColorStop(1, "#a8704e"); c.fillStyle = sk;
  c.beginPath(); c.ellipse(w / 2, h * 0.43, w * 0.145, h * 0.16, 0, 0, 7); c.fill();
  c.fillStyle = hr; c.beginPath(); c.moveTo(w * 0.33, h * 0.4); c.quadraticCurveTo(w * 0.36, h * 0.24, w / 2, h * 0.255); c.quadraticCurveTo(w * 0.64, h * 0.24, w * 0.67, h * 0.4); c.quadraticCurveTo(w * 0.6, h * 0.3, w * 0.5, h * 0.31); c.quadraticCurveTo(w * 0.4, h * 0.3, w * 0.33, h * 0.4); c.fill();
  [-1, 1].forEach((k) => { const ex = w / 2 + k * w * 0.062, ey = h * 0.415; c.fillStyle = "#f4ece0"; c.beginPath(); c.ellipse(ex, ey, 13, 6.5, 0, 0, 7); c.fill(); c.fillStyle = "#5a3a22"; c.beginPath(); c.arc(ex, ey, 5.5, 0, 7); c.fill(); c.fillStyle = "#120a06"; c.beginPath(); c.arc(ex, ey, 2.6, 0, 7); c.fill(); c.strokeStyle = "#3a2216"; c.lineWidth = 2.5; c.beginPath(); c.ellipse(ex, ey - 1, 14, 7.5, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(ex - 16, ey - 15 + k); c.quadraticCurveTo(ex, ey - 21, ex + 16, ey - 15 - k); c.stroke(); });
  c.strokeStyle = "rgba(120,70,50,.6)"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(w / 2 - 2, h * 0.43); c.quadraticCurveTo(w / 2 - 9, h * 0.475, w / 2 + 2, h * 0.485); c.stroke();
  c.fillStyle = "#b45e56"; c.beginPath(); c.moveTo(w / 2 - 22, h * 0.525); c.quadraticCurveTo(w / 2, h * 0.515, w / 2 + 22, h * 0.525); c.quadraticCurveTo(w / 2, h * 0.548, w / 2 - 22, h * 0.525); c.fill();
  c.fillStyle = "rgba(220,110,100,.18)"; [-1, 1].forEach((k) => { c.beginPath(); c.arc(w / 2 + k * 44, h * 0.475, 18, 0, 7); c.fill(); });
  c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 2.5;
  const cr = (x, y, n, s) => { c.beginPath(); c.moveTo(x, y); for (let i = 0; i < n; i++) { x += (hash(s + i) - 0.5) * 140; y += (hash(s + i * 3) - 0.3) * 120; c.lineTo(x, y); } c.stroke(); };
  cr(w * 0.7, h * 0.18, 5, 3); cr(w * 0.7, h * 0.18, 4, 9); cr(w * 0.7, h * 0.18, 4, 17); cr(w * 0.7, h * 0.18, 3, 29);
  const gl = c.createLinearGradient(0, 0, w, h); gl.addColorStop(0.3, "rgba(255,255,255,0)"); gl.addColorStop(0.45, "rgba(255,255,255,.1)"); gl.addColorStop(0.55, "rgba(255,255,255,0)"); c.fillStyle = gl; c.fillRect(0, 0, w, h);
});

// 6 · eram pessoas: prisioneiros acorrentados no alto do penhasco sob tempestade; o frasco; um gigante sobe do vapor
addSet("s6-pessoas", (g) => {
  const [a, b] = T.sc["s6-pessoas"];
  const dome = skyDome(g, { top: 0x141a26, hor: 0x3a4454, ground: 0x0a0e14, sunDir: [-0.3, 0.3, -1], sunCol: 0x8a9ab8, sunI: 0.2, cov: 0.28, cloudA: 1, cloudLit: 0x5a6478, cloudSh: 0x141822, cloudScale: 0.1 });
  const bl = texBlocks([110, 106, 100], [86, 84, 80]);
  const m = bl.map.clone(), n = bl.normalMap.clone(); m.needsUpdate = n.needsUpdate = true; rep(m, 3, 4); rep(n, 3, 4);
  mesh(box(12, 4, 24), SM(0xffffff, { map: m, normalMap: n, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.6 }), -2, -2, 0, g);
  const cliff = mesh(new THREE.CylinderGeometry(30, 46, 80, 9, 6, true), SM(0xffffff, { map: texRock().map, normalMap: texRock().normalMap, side: THREE.DoubleSide }), -24, -44, 0, g);
  deform(cliff.geometry, (v) => { const k = fbm2(v.x * 0.05, v.y * 0.05 + v.z * 0.05, 3); v.x *= 0.85 + k * 0.4; v.z *= 0.85 + k * 0.4; });
  // mar e praia lá embaixo (a ilha)
  const sea = mesh(new THREE.PlaneGeometry(900, 900, 1, 1), SM(0x1a2a34, { roughness: 0.25, metalness: 0.2 }), 0, -78, 0, g); sea.rotation.x = -Math.PI / 2;
  const hf = (x, z) => -78 + Math.max(0, (x - 30) * 0.08) + (fbm2(x * 0.02, z * 0.02, 3) - 0.5) * 4 - (x < 60 ? (60 - x) * 0.05 : 0);
  terrain(g, { h: hf, size: 600, segs: 120, x: 220, z: 0, grassA: 0x3a4a2a, grassB: 0x5a5a3a, dirt: 0x8a8070 });
  forestInst(g, 220, [120, 400, -260, 260], hf, { h: 14 });
  const islandG = [0, 1, 2, 3].map((i) => { const x = gigante({ tipo: ["careca", "magro", "gordo", "careca"][i], scale: 8 + i, seed: 10 + i }); x.position.set(110 + i * 34, hf(110 + i * 34, -60 + i * 40), -60 + i * 40); x.rotation.y = -1.2 + i * 0.5; g.add(x); return x; });
  // os prisioneiros e os guardas
  const pris = [0, 1, 2, 3, 4].map((i) => { const p = pessoa({ shirt: [0xb8ad98, 0x9a9080, 0xc0b49c, 0xa8a090, 0xb09c88][i], jacket: null, pants: 0x4a4440, boots: 0x3a2a20, hair: [0x2a1a10, 0x6a4a2a, 0x1a1210, 0x8a6a40, 0x3a2a1a][i], hairStyle: i === 1 ? "longo" : "curto", skin: [SKINS.media, SKINS.clara, SKINS.morena, SKINS.clara, SKINS.media][i], seed: 30 + i, fingers: i === 2 }); p.position.set(1.4, 0, -4 + i * 2); p.rotation.y = Math.PI / 2; g.add(p); return p; });
  const guards = [0, 1].map((i) => { const p = pessoa({ jacket: 0x1c2026, shirt: 0x2a2e34, pants: 0x1a1c20, boots: 0x101010, hair: 0x1a1410, seed: 40 + i, cuff: 0x2a2e34 }); const hel = mesh(new THREE.SphereGeometry(0.115, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), SM(0x3a3e44, { metalness: 0.7, roughness: 0.35 }), 0, 0.115, -0.005, p.userData.head); hel.scale.set(1.02, 1.05, 1.06); p.position.set(-1.6 + i * 0.4, 0, -5.2 + i * 10.4); p.rotation.y = Math.PI / 2 + (i ? 0.5 : -0.5); g.add(p); return p; });
  const handsPose = (p) => pose(p, { armR: [-0.55, 0.25, 0.15, -1.2], armL: [-0.55, -0.25, -0.15, -1.2], neck: [0.35, 0, 0], head: [0.15, 0, 0], handR: 0.6, handL: 0.6 });
  pris.forEach((p, i) => { restPose(p); handsPose(p); p.updateMatrixWorld(true); });
  const chains = []; pris.forEach((p, i) => { if (i < 4) { const h1 = wpos(p.userData.wr[1]), h2 = wpos(pris[i + 1].userData.wr[0]); chains.push(...chain(g, [h1.toArray(), [(h1.x + h2.x) / 2 + 0.15, Math.min(h1.y, h2.y) - 0.35, (h1.z + h2.z) / 2], h2.toArray()], 0.03)); } const w0 = wpos(p.userData.wr[0]), w1 = wpos(p.userData.wr[1]); chain(g, [w0.toArray(), [(w0.x + w1.x) / 2 + 0.05, w0.y - 0.06, (w0.z + w1.z) / 2], w1.toArray()], 0.022); });
  // o frasco
  const vial = grp(g);
  mesh(cyl(0.022, 0.022, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.1 }), 0, 0, 0, vial);
  const liq = mesh(cyl(0.017, 0.017, 0.085, 12), new THREE.MeshStandardMaterial({ color: 0x9ae86a, emissive: 0xb8f06a, emissiveIntensity: 0.9 }), 0, -0.015, 0, vial);
  mesh(cyl(0.003, 0.002, 0.07, 6), SM(0xd8d8e0, { metalness: 0.9, roughness: 0.2 }), 0, -0.09, 0, vial);
  const vg = glowSprite(0xb8ff7a, 0.22, 0.35); vial.add(vg); const vL = new THREE.PointLight(0xb8ff7a, 0.6, 2.5, 1.5); vial.add(vL);
  // vapor e o gigante que sobe lá embaixo
  const col = steam(g, { n: 46, size: 10, rise: 12, spread: 9, life: 3.0, opacity: 0.5, color: 0xd8d0c8, origin: [46, -76, 14] });
  const colL = new THREE.PointLight(0xffa060, 0, 90, 1.2); colL.position.set(46, -60, 14); g.add(colL);
  const gr = rimGiant(gigante({ tipo: "careca", scale: 11, seed: 2 })); gr.rotation.y = -Math.PI / 2 - 0.3; g.add(gr);
  const rainF = rainFx(g, 1400, [-12, 12, -6, 12, -12, 12], 3);
  const bolts = [bolt(g, [60, 120, -140], [30, -60, -90], 1), bolt(g, [-40, 140, -160], [-10, -40, -120], 5)];
  const T1 = K.pessoas - 0.3, T2 = K.fluido + 0.25, T3 = K.ilha - 0.2;
  const flashAt = (t) => Math.max(0, 1 - Math.abs(t - T1) / 0.12) + Math.max(0, 1 - Math.abs(t - T2) / 0.16) + Math.max(0, 1 - Math.abs(t - T3) / 0.1) * 0.7;
  return {
    bg: 0x2a323e, fogExp: 0.0045, fogCol: 0x2e3642, dome,
    look: { exposure: 1.1, bloom: 0.7, bloomT: 0.7, vig: 0.55, sat: 0.85, con: 1.1, lift: [0.0, 0.01, 0.03] },
    sun: { dir: [-0.4, 0.8, -0.3], col: 0x8a9ab8, I: 0.9, c: [0, 0, 0], r: 12 },
    hemi: { sky: 0x5a6a88, ground: 0x1a1c20, I: 0.6 }, fill: { col: 0x9ab0d8, I: 0.9, dir: [1, 0.35, 0.15] }, rim: { col: 0xa8c0ff, str: 0.55 },
    update(t) {
      const f = clamp(flashAt(t));
      GU.uFlash.value = f * 0.35; GU.uFlashCol.value.set(0.85, 0.9, 1);
      sun.intensity = 0.9 + f * 6; bolts[0](Math.abs(t - T1) < 0.12 || Math.abs(t - T3) < 0.1); bolts[1](Math.abs(t - T2) < 0.16);
      pris.forEach((p, i) => { restPose(p); handsPose(p); idle(p, t, i * 2, 0.6); face(p, { sad: 0.8, brow: -0.2 }); p.userData.lidOpen = 0.55; });
      guards.forEach((p, i) => { restPose(p); idle(p, t, 9 + i, 0.4); });
      // o guarda ergue o frasco
      const lift = smr(t, K.injecao - 0.6, K.injecao);
      pose(guards[0], { armR: [-1.1 * lift - 0.1, 0.3, -0.2, -0.9 * lift - 0.1], handR: 0.7 });
      guards[0].updateMatrixWorld(true); wpos(guards[0].userData.wr[0], vial.position); vial.position.y -= 0.06; vial.rotation.z = 0.15;
      liq.material.emissiveIntensity = 0.85 + Math.sin(t * 6) * 0.2;
      // vapor e o gigante subindo
      const rise = smr(t, T2 + 0.1, K.prisioneiros + 0.4);
      col.upd(t, smr(t, T2 - 0.1, T2 + 0.3)); colL.intensity = smr(t, T2, T2 + 0.3) * 260 * (1 - rise * 0.5);
      gr.position.set(46, -78 - 22 * (1 - rise), 14); restPose(gr); idle(gr, t, 2, 0.4); pose(gr, { spine: [0.25 * (1 - rise), 0, 0], neck: [-0.2, 0, 0.2] });
      giantMouth(gr, 0.5);
      islandG.forEach((x, i) => { restPose(x); giantWalk(x, t * 0.3 + i * 0.25, t, 1, { seed: 10 + i }); x.position.x += 0; });
      rainF(t);
      if (t > K.ilha - 0.15) { renderer.toneMappingExposure = 2.0; hemi.intensity = 1.2; scene.fog.density = 0.0022; }
    },
    cam(t) {
      if (t < K.injecao - 0.15) { const k = keys(t, [[a, [-4, 0, 0], [0, 0, 0]], [K.gente5, [-4, 0, 0], [0, 0, 0]], [K.forca - 0.1, [-2, 0, 0], [0, 0, 0]], [K.forca + 0.4, [-2, 0, 0], [0, 0, 0]], [K.injecao - 0.15, [0, 0, 0], [0, 0, 0]]]); const z = k.pos[0]; return { pos: [2.6, 1.5, z + 0.12], look: [1.4, 1.62, z], fov: 30 }; }
      if (t < T2 + 0.05) { const v = vial.position; return path(t, [[K.injecao - 0.15, [v.x + 0.55, v.y + 0.1, v.z + 0.45], [v.x, v.y, v.z], 30], [T2 + 0.05, [v.x + 0.38, v.y + 0.05, v.z + 0.3], [v.x, v.y, v.z], 26]]); }
      if (t < K.prisioneiros - 0.1) return shakeCam(path(t, [[T2 + 0.05, [104, -50, 88], [44, -54, 14], 40], [K.prisioneiros - 0.1, [96, -52, 80], [44, -50, 14], 38]]), t, impact(t, T2 + 0.1, 0.6, 0.8));
      if (t < K.ilha - 0.15) return path(t, [[K.prisioneiros - 0.1, [2.4, 1.05, -5.2], [1.4, 1.05, -2.5], 38], [K.ilha - 0.15, [2.4, 1.0, 3.4], [1.4, 1.0, 5.5], 38]]);
      return path(t, [[K.ilha - 0.15, [40, 30, -120], [140, -60, 20], 42], [b, [60, 24, -110], [150, -64, 30], 40]]);
    },
  };
});

// 7 · voltar a ser humano: floresta de árvores gigantes à noite; o gigante coberto de musgo, a pessoa que brilha, o clarão
addSet("s7-voltar", (g) => {
  const [a, b] = T.sc["s7-voltar"];
  const dome = skyDome(g, { top: 0x060c1c, hor: 0x16243c, ground: 0x05080c, sunDir: [0.3, 0.7, -0.6], sunCol: 0xaabcff, sunI: 0.3, cov: 0.6, cloudA: 0.4, stars: 1.0 });
  const hf = (x, z) => (fbm2(x * 0.04 + 1, z * 0.04 + 2, 4) - 0.5) * 1.6;
  terrain(g, { h: hf, size: 400, segs: 160, grassA: 0x2a3a1e, grassB: 0x3a4a26, dirt: 0x3a3024 });
  grassField(g, 9000, [-14, 14, -14, 14], hf, { s: 0.6, colA: 0x2a4a22, colB: 0x4a6a32 });
  const bk = texBark();
  const trunks = [[-7, -6, 3.2], [8, -9, 4.0], [-14, 6, 3.6], [14, 8, 3.0], [0, -20, 4.6], [-22, -14, 4.2], [22, -18, 3.8], [-4, 18, 3.4], [18, 24, 4], [-26, 22, 3.6]];
  trunks.forEach(([x, z, r], i) => {
    const tr = mesh(lathe([[r * 1.6, 0], [r * 1.1, 2], [r, 6], [r * 0.85, 30], [r * 0.7, 70]], 20), SM(0xffffff, { map: bk.map, normalMap: bk.normalMap, normalScale: new THREE.Vector2(1.5, 1.5) }), x, hf(x, z) - 0.5, z, g);
    for (let k = 0; k < 5; k++) { const ang = hash(i * 5 + k) * 6.28, rt = mesh(new THREE.ConeGeometry(r * 0.35, r * 1.6, 8), SM(0x4a3a2c), x + Math.cos(ang) * r * 1.1, hf(x, z) + 0.2, z + Math.sin(ang) * r * 1.1, g); rt.rotation.set(Math.sin(ang) * 1.1, 0, -Math.cos(ang) * 1.1); }
    for (let k = 0; k < 4; k++) { const mm = mesh(foliageGeo(i + k), SM(0x3a5a26, { roughness: 1 }), x + (hash(i + k) - 0.5) * r, hf(x, z) + 1 + k * 3, z + r * 0.9, g); mm.scale.set(r * 0.4, r * 0.25, r * 0.3); }
  });
  forestInst(g, 160, [-120, 120, -140, -40], hf, { h: 30 });
  const rays = godRays(g, [6, 60, -14], [-0.12, -1, 0.15], { n: 7, len: 70, w: 3.5, spread: 18, opacity: 0.11, color: 0xa8c0ff });
  const mist = mistLayers(g, { y: 0.5, opacity: 0.22, color: 0x8aa0c8, size: 200, n: 3, dy: 1.4 });
  const flies = dustPts(160, [-12, 12, 0.4, 5, -10, 10], 0xd8ff8a, 0.07, 0.9); g.add(flies);
  // o gigante sentado contra a árvore, coberto de musgo
  const gi = gigante({ tipo: "gordo", scale: 5.6, seed: 6 }); rimGiant(gi); mossify(gi); g.add(gi);
  const G0 = V3(-5.2, hf(-5.2, -3.4), -3.4);
  // a pessoa que brilha (portadora de um dos Nove) e quem volta a ser humano
  const sh = pessoa({ jacket: 0x3a3a46, shirt: 0xd8d0c0, hair: 0x5a3a20, hairStyle: "curto", seed: 50, fingers: false }); g.add(sh);
  const aura = glowSprite(0xffc860, 2.8, 0.5); g.add(aura); const auraL = new THREE.PointLight(0xffb850, 0, 14, 1.4); g.add(auraL);
  const back = pessoa({ shirt: 0xb8ac98, jacket: null, pants: 0x4a4440, hair: 0x1e140e, hairStyle: "rabo", skin: SKINS.morena, seed: 51 }); back.position.set(-3.2, hf(-3.2, -0.6), -0.6); back.rotation.y = -0.5; g.add(back);
  const cloud = steam(g, { n: 30, size: 2.4, rise: 0.9, spread: 5.5, life: 3.4, opacity: 0.32, color: 0xb8c4e0, origin: [-5, 0, -3] });
  const embL = new THREE.PointLight(0xffb060, 0, 8, 1.5); embL.position.set(-3, 1.2, 0.4); g.add(embL);
  const moonL = new THREE.SpotLight(0xa8c0ff, 220, 90, 0.35, 0.6, 1.2); moonL.position.set(4, 60, -6); moonL.target.position.set(-4, 0, -2); moonL.castShadow = true; moonL.shadow.mapSize.set(1024, 1024); g.add(moonL, moonL.target);
  const TF = K.comeu - 0.12, gone = (t) => t > TF + 0.18;
  return {
    bg: 0x0a1222, fogExp: 0.022, fogCol: 0x101a2e, dome,
    look: { exposure: 1.25, bloom: 0.85, bloomT: 0.55, vig: 0.6, sat: 0.95, con: 1.08, lift: [0.0, 0.01, 0.04] },
    sun: { dir: [0.2, 1, -0.3], col: 0x8aa8ff, I: 0.35, c: [-3, 0, -2], r: 16 },
    hemi: { sky: 0x3a5088, ground: 0x0a0c10, I: 0.5 }, rim: { col: 0xa8c0ff, str: 0.6 },
    update(t) {
      // gigante sentado, olhos fechados até a pessoa chegar
      gi.visible = !gone(t);
      gi.position.copy(G0); gi.rotation.y = 0.45; restPose(gi);
      const wake = smr(t, K.ymir - 0.3, K.ymir + 0.6), reach = smr(t, TF - 0.8, TF);
      pose(gi, { hipsPos: [0, -(gi.userData.d.hipY - 0.16), 0], legR: [-1.3, 0.25, -0.1, 1.25, -0.2], legL: [-1.35, -0.3, 0.1, 1.3, -0.2], spine: [-0.15 + reach * 0.5, 0, 0], chest: [-0.05, 0, 0], neck: [0.55 * (1 - wake) + 0.1, 0, 0.25 * (1 - wake)], head: [0.2 * (1 - wake), 0.3 * wake, 0], armR: [0.15, 0, -0.35, -0.3], armL: [0.1, 0, 0.3, -0.2], handR: 0.3, handL: 0.3 });
      gi.userData.lidOpen = wake; idle(gi, t, 6, 0.25 * wake);
      gi.updateMatrixWorld(true);
      giantMouth(gi, reach > 0.3 ? 1 : wake * 0.5, wake < 0.05);
      // a pessoa que brilha entra na clareira
      const wk = seg(t, K.comer6 - 0.3, K.nove + 0.3), pz = lerp(5.5, 1.2, E.out(wk)), px = lerp(7, 1.8, E.out(wk));
      sh.position.set(px, hf(px, pz), pz); sh.rotation.y = Math.atan2(G0.x - px, G0.z - pz) + 0.2; sh.visible = t > K.comer6 - 0.4 && !gone(t);
      restPose(sh); if (wk < 1) walk(sh, (t - K.comer6) * 1.4, 1 - smr(wk, 0.8, 1)); idle(sh, t, 50); face(sh, { brow: 0.6, open: wake * 0.3 });
      const ap = wpos(sh.userData.chest); aura.position.copy(ap); aura.visible = sh.visible; aura.material.opacity = 0.45 + Math.sin(t * 5) * 0.08; auraL.position.copy(ap); auraL.intensity = sh.visible ? 26 : 0;
      if (reach > 0) armIK(gi, 0, ap.clone().add(V3(0.3, 0.4, 0)), V3(G0.x + 6, G0.y + 8, G0.z + 2), reach);
      // clarão e depois: vapor e a pessoa ajoelhada
      const fl = Math.max(0, 1 - Math.abs(t - TF) / 0.28);
      GU.uFlash.value = fl * 0.95; GU.uFlashCol.value.set(1, 0.92, 0.72);
      cloud.upd(t, gone(t) ? 1 - smr(t, b - 1.2, b) * 0.4 : 0); embL.intensity = gone(t) ? 9 * (1 - smr(t, TF + 0.2, b)) + 2 : 0;
      back.visible = gone(t); restPose(back); kneelPose(back); idle(back, t, 51, 0.4); pose(back, { armR: [-0.4, 0, -0.3, -0.8], armL: [-0.4, 0, 0.3, -0.8], neck: [0.1 - smr(t, K.marcel, b) * 0.5, 0, 0] }); back.userData.lidOpen = 0.6;
      floatDust(flies, t, 0.5, 0.25); mist(t);
    },
    cam(t) {
      if (t < K.comer6 - 0.1) return path(t, [[a, [6, 26, 14], [-4, 6, -4], 44], [K.humano6, [4, 14, 10], [-4.5, 5, -3], 42], [K.comer6 - 0.1, [3, 6, 9], [-4.5, 4, -3], 40]]);
      if (t < K.ymir - 0.1) return path(t, [[K.comer6 - 0.1, [9, 1.2, 9], [-2, 3.5, -2.5], 44], [K.ymir - 0.1, [8, 1.1, 7.6], [-2.5, 4, -3], 42]]);
      if (t < TF) { const hp = wpos(gi.userData.head); return path(t, [[K.ymir - 0.1, [hp.x + 3.2, hp.y + 0.9, hp.z + 5.2], [hp.x, hp.y + 0.6, hp.z], 32], [TF, [hp.x + 2.2, hp.y + 0.8, hp.z + 3.8], [hp.x, hp.y + 0.6, hp.z], 30]]); }
      return path(t, [[TF, [2.2, 1.5, 4.6], [-3.2, 1.0, -0.6], 38], [b, [0.8, 1.2, 2.8], [-3.2, 0.9, -0.6], 34]]);
    },
  };
});

// 8 · instinto: gigantes marchando ao amanhecer rumo à cidade; dentro do peito de cada um, uma pessoa que brilha
addSet("s8-instinto", (g) => {
  const [a, b] = T.sc["s8-instinto"];
  const SD = [0.05, 0.12, -1];
  const dome = skyDome(g, { top: 0x2a54a0, hor: 0xffbc78, ground: 0x4a3a30, sunDir: SD, sunCol: 0xffa040, sunI: 1.3, cov: 0.6, cloudLit: 0xffd0a0, cloudSh: 0x5a5a7a, exp: 0.75 });
  const hf = (x, z) => (fbm2(x * 0.02 + 3, z * 0.02 + 8, 4) - 0.5) * 3;
  terrain(g, { h: hf, size: 900, segs: 220, grassA: 0x5a6a34, grassB: 0x8a8a48 });
  grassField(g, 12000, [-16, 16, -6, 26], hf, { s: 0.75 });
  forestInst(g, 200, [-300, 300, -60, 200], hf, { h: 11, mask: (x, z) => Math.abs(x) > 60 });
  // a cidade murada
  wallSeg(g, 460, 36, 10, { pos: [0, -2, -190] });
  [-170, -60, 60, 170].forEach((x) => tower(g, x, -184, 8, 50, { lit: true }));
  const gate = grp(g, 0, 0, -184.5); mesh(box(16, 22, 2), SM(0x3a2a1a), 0, 9, 0, gate);
  for (let i = 0; i < 16; i++) house(g, -90 + (i % 8) * 24 + hash(i) * 6, -205 - Math.floor(i / 8) * 18, { seed: 60 + i, w: 7, h: 9 + hash(i) * 8, lit: 0.5 });
  const rays = godRays(g, [0, 30, -260], [0, -0.1, 1], { n: 9, len: 220, w: 16, spread: 60, opacity: 0.06, color: 0xffc080 });
  const mist = mistLayers(g, { y: 0.8, opacity: 0.25, color: 0xffd8b8, size: 500, n: 2 });
  const types = ["careca", "magro", "gordo", "careca", "magro", "gordo"];
  const gs = types.map((tp, i) => { const x = rimGiant(gigante({ tipo: tp, scale: 6.5 + (i % 3) * 1.2, seed: 70 + i, hair: [0x2a2018, 0x5a4030][i % 2] })); g.add(x); return x; });
  const P0 = [[-16, -20], [-4, -34], [10, -24], [22, -40], [-26, -46], [4, -56]];
  const ghosts = gs.map((x) => { const gp = ghostPerson(0xffc070); gp.scale.setScalar(0.36); x.userData.chest.add(gp); gp.position.set(0, 0.0, 0.0); return gp; });
  const dust = dustRing(g, 0xb8a080);
  return {
    bg: 0xe0b890, fogExp: 0.0018, fogCol: 0xd8b494, dome,
    look: { exposure: 1.0, bloom: 0.65, bloomT: 0.8, sat: 1.1, vig: 0.45, con: 1.06 },
    sun: { dir: SD, col: 0xffa860, I: 2.6, c: [0, 4, -30], r: 46 },
    hemi: { sky: 0x8aa0d0, ground: 0x5a4030, I: 0.62 }, fill: { col: 0xffd0b0, I: 0.6, dir: [0.2, 0.5, 1] }, rim: { col: 0xffb070, str: 0.8 },
    update(t) {
      const lt = t - a;
      const reach = smr(t, K.qualquer7 - 0.4, K.qualquer7 + 0.4);
      gs.forEach((gi, i) => {
        const z = P0[i][1] - lt * 1.3 * (0.8 + hash(i) * 0.4), x = P0[i][0] + Math.sin(lt * 0.2 + i) * 1.5;
        gi.position.set(x, hf(x, z), z); gi.rotation.y = Math.PI + (hash(i * 3) - 0.5) * 0.3;
        restPose(gi); giantWalk(gi, lt * 0.4 + i * 0.37, t, 1, { seed: 70 + i, tilt: 0.15 + hash(i) * 0.2 });
        if (i === 0 && reach > 0) pose(gi, { armR: [-1.6, 0, -0.2, -0.3], armL: [-1.3, 0, 0.3, -0.5], handR: 0.1, handL: 0.1 }, reach);
        ghosts[i].userData.hm.uniforms.uA.value = 0.55 + 0.25 * Math.sin(t * 3 + i) + smr(t, K.instinto - 0.3, K.instinto + 0.3) * 0.4;
        ghosts[i].userData.glow.material.opacity = 0.25 + 0.1 * Math.sin(t * 3 + i);
      });
      const g0 = gs[2];
      { const ph = lt * 0.4 + 2 * 0.37, st = Math.floor(ph * 2) / 2; dust(t, a + (st - 2 * 0.37) / 0.4, wpos(g0.userData.ankle[Math.round(st * 2) % 2 ? 1 : 0]), 3); }
      mist(t); dome.userData.u.uOff.value.set(t * 0.005, 0);
    },
    cam(t) {
      if (t < K.instinto - 0.15) return path(t, [[a, [14, 26, 34], [0, 6, -60], 44], [K.fome, [8, 18, 22], [0, 7, -60], 42], [K.instinto - 0.15, [4, 14, 14], [0, 8, -60], 40]]);
      if (t < K.sabiam - 0.1) { const cp = wpos(gs[2].userData.chest).add(V3(0, 0.6, 0)); return path(t, [[K.instinto - 0.15, [cp.x + 13, cp.y + 1.5, cp.z - 11], [cp.x, cp.y, cp.z], 36], [K.sabiam - 0.1, [cp.x + 10.5, cp.y + 1.0, cp.z - 8], [cp.x, cp.y, cp.z], 34]]); }
      const c = path(t, [[K.sabiam - 0.1, [-4, 1.5, -104], [-6, 12, -44], 46], [b, [-3, 1.3, -100], [-10, 14, -48], 44]]);
      return shakeCam(c, t, 0.02 + impact(t, K.qualquer7, 0.15, 0.8));
    },
  };
});

// 9 · o pior: casa em ruínas ao pôr do sol; o retrato rachado no chão; a sombra do gigante passa
addSet("s9-pior", (g) => {
  const [a, b] = T.sc["s9-pior"];
  const SD = [-0.2, 0.22, -1];
  const dome = skyDome(g, { top: 0x2a2a5a, hor: 0xff8040, ground: 0x2a1a14, sunDir: SD, sunCol: 0xff7030, sunI: 0.75, cov: 0.55, cloudLit: 0xff9a60, cloudSh: 0x3a2a4a, exp: 0.6 });
  const pk = texPlanks([110, 76, 48], [86, 58, 36]); const fm = pk.map.clone(), fn = pk.normalMap.clone(); fm.needsUpdate = fn.needsUpdate = true; rep(fm, 2, 2); rep(fn, 2, 2);
  mesh(box(8, 0.2, 8), SM(0xffffff, { map: fm, normalMap: fn }), 0, -0.1, 0, g);
  const pl = texPlaster("#3a2618", "#c8b896");
  const wallM = SM(0xffffff, { map: pl, roughness: 0.95 });
  // parede de trás com um rombo serrilhado
  const sh = new THREE.Shape(); sh.moveTo(-4, 0); sh.lineTo(4, 0); sh.lineTo(4, 4.2); sh.lineTo(-4, 4.2); sh.lineTo(-4, 0);
  const hole = new THREE.Path(); const hp = [[-1.6, 0.5], [-0.8, 0.3], [0.2, 0.6], [1.2, 0.35], [2.1, 1.2], [1.8, 2.4], [2.3, 3.4], [1.1, 4.2], [-0.3, 3.7], [-1.4, 4.1], [-2.2, 2.9], [-1.9, 1.6]]; hp.forEach(([x, y], i) => (i ? hole.lineTo(x, y) : hole.moveTo(x, y))); hole.lineTo(hp[0][0], hp[0][1]); sh.holes.push(hole);
  const bw = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: false }), wallM, 0, 0, -3.6, g);
  const sw = new THREE.Shape(); sw.moveTo(-4, 0); sw.lineTo(4, 0); sw.lineTo(4, 1.6); sw.lineTo(2.2, 2.6); sw.lineTo(0.6, 1.9); sw.lineTo(-1.4, 3.6); sw.lineTo(-4, 4.2); sw.lineTo(-4, 0);
  const lw = mesh(new THREE.ExtrudeGeometry(sw, { depth: 0.3, bevelEnabled: false }), wallM, -3.7, 0, 4, g); lw.rotation.y = Math.PI / 2;
  const beamM = SM(0x3a2618);
  [[-2.5, 4.1, 0, 0], [0.5, 3.0, 0.3, 0.55], [2.6, 2.2, -0.4, -0.75]].forEach(([x, y, z, r]) => { const bm = mesh(box(0.25, 0.3, 8.5), beamM, x, y, z, g); bm.rotation.x = r * 0.4; bm.rotation.z = r; });
  for (let i = 0; i < 26; i++) { const rx = -3 + hash(i * 3) * 6, rz = -3 + hash(i * 5) * 5.5; if (Math.hypot(rx + 0.3, rz - 0.9) < 1.1 || (rz > 0.5 && Math.abs(rx) < 1.2)) continue; rock(g, rx, 0, rz, 0.12 + hash(i) * 0.35, 100 + i, { col: 0xd8c8b0 }); }
  const chair = grp(g, 1.8, 0.25, 0.8); chair.rotation.set(0, 0.6, Math.PI / 2); mesh(box(0.5, 0.06, 0.5), beamM, 0, 0, 0, chair); [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z]) => mesh(box(0.05, 0.5, 0.05), beamM, x, -0.25, z, chair));
  // o retrato no chão
  const fr = grp(g, -0.3, 0.05, 0.9); fr.rotation.set(-Math.PI / 2, 0, 0.25);
  mesh(box(0.62, 0.76, 0.05), SM(0x6a4a2a), 0, 0, 0, fr); mesh(new THREE.PlaneGeometry(0.5, 0.64), new THREE.MeshStandardMaterial({ map: portraitTex, roughness: 0.25, metalness: 0.05 }), 0, 0, 0.027, fr);
  // lá fora: rua, casas e o gigante passando
  const hfo = (x, z) => 0;
  terrain(g, { h: hfo, size: 300, segs: 20, z: -150, grassA: 0x6a5a40, grassB: 0x7a6a48 });
  [[-10, -16, 0.2], [9, -18, -0.3], [-18, -30, 0.1], [16, -34, -0.2]].forEach(([x, z, r], i) => house(g, x, z, { seed: 80 + i, rotY: r, w: 6, h: 5 }));
  const gi = rimGiant(gigante({ tipo: "careca", scale: 10, seed: 9 })); g.add(gi);
  const inL = new THREE.PointLight(0xffa868, 7, 9, 1.4); inL.position.set(1.4, 2.4, 1.8); g.add(inL);
  const motes = dustPts(220, [-3, 3, 0.2, 3.5, -3, 3], 0xffc890, 0.025, 0.7); g.add(motes);
  const rays = godRays(g, [0.2, 3.2, -3.6], [0.1, -0.35, 1], { n: 6, len: 9, w: 0.7, spread: 2.5, opacity: 0.12, color: 0xffb070 });
  return {
    bg: 0xc87850, fogExp: 0.006, fogCol: 0xc88060, dome,
    look: { exposure: 1.1, bloom: 0.6, bloomT: 0.85, vig: 0.55, sat: 1.05, con: 1.1, lift: [0.02, 0.0, 0.0] },
    sun: { dir: SD, col: 0xff8a40, I: 3.2, c: [0, 1, 0], r: 22 },
    hemi: { sky: 0x6a6aa8, ground: 0x3a2418, I: 0.75 }, rim: { col: 0xff9a50, str: 0.6 },
    update(t) {
      // o gigante atravessa atrás da parede; a sombra passa sobre o retrato
      const x = lerp(-40, 2, E.inOut(seg(t, a, K.primeira))), z = -34;
      gi.position.set(x, 0, z); gi.rotation.y = Math.PI / 2 - smr(t, K.primeira - 0.3, K.primeira + 0.6) * 1.35;
      restPose(gi);
      const stop = smr(t, K.primeira - 0.5, K.primeira + 0.2);
      giantWalk(gi, (t - a) * 0.38, t, 1 - stop * 0.9, { seed: 9, tilt: 0.25 });
      if (stop > 0) { lookAtW(gi, V3(0, 2, 0), stop); pose(gi, { spine: [0.3 * stop, 0, 0], neck: [0.25 * stop, 0, 0] }, stop); }
      giantMouth(gi, 0);
      // o sol fica atrás do gigante: a sombra dele cai dentro da casa
      setSun([SD[0] + (x + 7) * -0.006, SD[1], SD[2]], 0xff8a40, 3.2, [0, 1, 0], 22);
      floatDust(motes, t, 0.12, 0.12);
    },
    cam(t) {
      if (t < K.eren + 0.1) return path(t, [[a, [-0.05, 1.5, 1.8], [-0.3, 0.0, 0.85], 34], [K.eren + 0.1, [-0.1, 1.1, 1.45], [-0.3, 0.0, 0.85], 30]]);
      return path(t, [[K.eren + 0.1, [0.5, 1.2, 3.4], [0.6, 5.5, -30], 40], [b, [0.3, 1.3, 2.4], [1.0, 9, -34], 34]]);
    },
  };
});

// 10 · pergunta: o gigante sentado no morro à noite, olhando a lua; a cidade ao longe
addSet("s10-pergunta", (g) => {
  const [a, b] = T.sc["s10-pergunta"];
  const dome = skyDome(g, { top: 0x040a1a, hor: 0x1a2c4c, ground: 0x05080c, sunDir: [0.2, 0.25, -1], sunCol: 0xc8d8ff, sunI: 0.25, cov: 0.62, cloudA: 0.45, cloudLit: 0x8aa0c8, cloudSh: 0x0a1020, stars: 1.4 });
  const hf = (x, z) => 6 * Math.exp(-((x * x + (z + 2) * (z + 2)) / 200)) + (fbm2(x * 0.03, z * 0.03, 4) - 0.5) * 2 - Math.max(0, -z - 30) * 0.05;
  terrain(g, { h: hf, size: 700, segs: 200, grassA: 0x22321e, grassB: 0x34442a });
  grassField(g, 9000, [-14, 14, -12, 16], hf, { s: 0.7, colA: 0x2a4024, colB: 0x4a5a34 });
  const moon = mesh(sph(16, 40, 30), BM(0xd8dce4, { fog: false }), 6, 52, -260, g); const mg = glowSprite(0xa8b8e8, 90, 0.22); mg.material.fog = false; moon.add(mg);
  // cidade ao longe com luzes
  wallSeg(g, 300, 24, 8, { pos: [-20, -10, -200] });
  const lights = dustPts(260, [-140, 100, -8, 6, -215, -195], 0xffb060, 0.9, 0.95); lights.material.fog = false; g.add(lights);
  const gi = rimGiant(gigante({ tipo: "careca", scale: 7, seed: 11 })); g.add(gi);
  const vap = giantSteam(g, gi, { size: 0.26, opacity: 0.2, n: 8, color: 0xc8d4e8 });
  const flies = dustPts(140, [-10, 10, 0.5, 6, -6, 12], 0xd8ff8a, 0.08, 0.9); g.add(flies);
  const mist = mistLayers(g, { y: -2, opacity: 0.25, color: 0x6a80a8, size: 500, n: 2 });
  const G0 = V3(0, hf(0, -2), -2);
  return {
    bg: 0x0c1830, fogExp: 0.0035, fogCol: 0x142440, dome,
    look: { exposure: 1.1, bloom: 0.5, bloomT: 0.9, vig: 0.6, sat: 0.95, con: 1.06, lift: [0.0, 0.01, 0.04] },
    sun: { dir: [0.2, 0.4, -1], col: 0xb8c8ff, I: 1.1, c: [0, 4, -2], r: 18 }, hemi: { sky: 0x3a5088, ground: 0x0a0c10, I: 0.45 }, rim: { col: 0xc8d8ff, str: 0.45 },
    update(t) {
      gi.position.copy(G0); gi.rotation.y = Math.PI + 0.25; restPose(gi);
      pose(gi, { hipsPos: [0, -(gi.userData.d.hipY - 0.16), 0], legR: [-1.55, 0.15, -0.05, 2.0, -0.3], legL: [-1.55, -0.15, 0.05, 2.0, -0.3], spine: [0.25, 0, 0], neck: [-0.35, 0, 0.1], head: [-0.2, 0, 0], armR: [-0.9, 0.3, -0.2, -1.2], armL: [-0.9, -0.3, 0.2, -1.2], handR: 0.5, handL: 0.5 });
      gi.updateMatrixWorld(true); [0, 1].forEach((i) => { const kp = wpos(gi.userData.knee[i]); armIK(gi, i, kp.add(V3(0, -0.6, 0.0)), wpos(gi.userData.sh[i]).add(V3(i ? 4 : -4, -2, 0))); curlHand(gi.userData.hands[i], 0.6); });
      idle(gi, t, 11, 0.3); gi.userData.lidOpen = 0.8; giantMouth(gi, 0);
      vap(t, 0.8); floatDust(flies, t, 0.5, 0.25); mist(t);
    },
    cam(t) { return path(t, [[a, [-7, 5, 14], [1, 12, -10], 44], [K.comenta, [-9, 4.6, 18], [1.5, 13, -12], 46], [b, [-10, 4.4, 20], [2, 13.5, -14], 46]]); },
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
  if (c.roll) camera.rotateZ(c.roll);
  camera.fov = c.fov ?? 35; camera.updateProjectionMatrix();
  if (s.dome) s.dome.position.copy(camera.position);
  if (s.after) s.after(t);
  if (s.fadeIn) { const [a] = T.sc[n]; GU.uFade.value = Math.max(GU.uFade.value, 1 - seg(t, a, a + s.fadeIn)); }
  composer.render();
}
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady["titas3d"] = (async () => {
  try { await document.fonts.load("700 48px 'Archivo Black'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  try { await renderer.compileAsync(scene, camera); } catch (e) { /* compila no primeiro quadro */ }
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
