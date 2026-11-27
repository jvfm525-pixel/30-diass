// @ts-nocheck
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
export function criarMotor(canvas, HF_T) {
// __TITULO__
// Motor 3D v2 (Three.js r160), montado por tools/motor3d/montar.py. Tudo é função do tempo t (evento hf-seek).
// Novidades do v2: sombras suaves, pós-processamento (bloom + gradação de cor + vinheta + grão),
// céu com nuvens e sol, névoa em camadas, texturas procedurais com relevo (normal map),
// personagens articulados (cotovelo, joelho, dedos, pálpebras, cabelo em mechas) e câmera em curva.

const T = HF_T;
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

// ================================================================ vídeo: Por que o Kira queria tanto uma vida normal? (comum)
// Estilo do vídeo do Eren (documentário): fotos de licença livre + cenários 3D originais. Nada desenhado da obra:
// o Kira aparece como um símbolo original, o homem sem rosto (assalariado de terno com o rosto liso de porcelana).
// Animação v5: pés plantados (gait, gaitFit, standFeet), gestos com antecipação e acomodação (act), gravata, paletó e
// cabelo com mola (mola + lagLocal), mãos que pegam objetos por IK, peso que passa de um pé pro outro e câmera contínua.
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wpos = (o, v = V3()) => o.getWorldPosition(v);
const GOLDM = () => new THREE.MeshStandardMaterial({ color: 0xe8b040, metalness: 0.92, roughness: 0.24, emissive: 0x4a2a00, emissiveIntensity: 0.35, envMap: envGold(), envMapIntensity: 1.1 });
// câmera: posição em curva contínua (Catmull-Rom), olhar interpolado suave entre as chaves (sem chicotear)
function path2(t, ks) {
  const c = path(t, ks), n = ks.length;
  if (t <= ks[0][0] || t >= ks[n - 1][0]) return c;
  let i = 0; while (i < n - 2 && t > ks[i + 1][0]) i++;
  const u = sm(seg(t, ks[i][0], ks[i + 1][0]));
  return { ...c, look: lerp3(ks[i][2], ks[i + 1][2], u) };
}
// pés plantados em posições dadas (mundo)
function plantFeet(p, feet, ang, toe = [0, 0]) {
  const u = p.userData; p.updateMatrixWorld(true);
  [0, 1].forEach((i) => {
    const f = feet[i]; legIK(p, i, V3(f[0], f[1], f[2]), V3(f[0] + Math.sin(ang) * 1.2, f[1] + 0.6, f[2] + Math.cos(ang) * 1.2));
    u.knee[i].updateMatrixWorld(true); u.knee[i].getWorldQuaternion(_gq); _gq.invert(); _gq2.setFromEuler(_gE.set(-(toe[i] || 0), ang, 0, "YXZ")); u.ankle[i].quaternion.copy(_gq.multiply(_gq2));
  });
}

// ---------------------------------------------------------------- fotos de licença livre (assets/img/<chave>.jpg), carregadas antes do 1º quadro
window.HF_PRELOAD = window.HF_PRELOAD || [];
const PHOTO = {};
const _photoLoader = new THREE.TextureLoader();
function photoMat(key, o = {}) {
  const m = new THREE.MeshBasicMaterial({ color: o.tint ?? 0xffffff, toneMapped: o.tm ?? false, fog: o.fog ?? false, transparent: o.transparent ?? false, opacity: o.opacity ?? 1, depthWrite: o.depthWrite ?? true, side: o.side ?? THREE.FrontSide });
  if (!(T.fotos || []).includes(key)) { m.color.set(o.fallback ?? 0x101018); return m; } // foto ainda não baixada: fica o fundo procedural
  if (!PHOTO[key]) {
    const P = (PHOTO[key] = { mats: [], tex: null });
    P.p = _photoLoader.loadAsync(`assets/img/${key}.jpg`).then((tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; P.tex = tex; P.mats.forEach((mm) => { mm.map = tex; mm.needsUpdate = true; }); }).catch(() => { P.mats.forEach((mm) => mm.color.set(o.fallback ?? 0x101018)); });
    window.HF_PRELOAD.push(P.p);
  }
  PHOTO[key].mats.push(m); if (PHOTO[key].tex) m.map = PHOTO[key].tex;
  return m;
}
// foto num plano (com recorte de proporção: aspect = largura/altura da foto; o plano mostra a faixa central)
function photoPlane(parent, key, w, h, o = {}) {
  const m = photoMat(key, o), pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  if (o.crop) { const uv = pl.geometry.attributes.uv; const [u0, v0, u1, v1] = o.crop; for (let i = 0; i < uv.count; i++) uv.setXY(i, lerp(u0, u1, uv.getX(i)), lerp(v0, v1, uv.getY(i))); }
  pl.castShadow = false; pl.receiveShadow = false; parent.add(pl); return pl;
}

// ---------------------------------------------------------------- o homem sem rosto (símbolo original)
// terno cinza-azulado, camisa branca, gravata vinho lisa, cabelo escuro penteado; rosto liso de porcelana, sem traços
const HOMEM = { hair: 0x1e1c22, hairStyle: "penteado", skin: 0xece9e4, iris: 0x222222, jacket: 0x2c3242, shirt: 0xf1eee6, pants: 0x2a3040, boots: 0x121012, belt: 0x16121a, jacketOpen: 0.26, cuff: 0xf1eee6, seed: 71, olw: 0.0042 };
const PORC = () => { const m = new THREE.MeshStandardMaterial({ color: 0xf2f1ee, roughness: 0.34, metalness: 0.0, emissive: 0x1a1c22, emissiveIntensity: 0.18 }); rimify(m, 0.9); return m; };
function semRosto(o = {}) {
  const p = pessoa({ ...HOMEM, ...o }), u = p.userData;
  u.eyes.forEach((e) => (e.g.visible = false)); u.brows.forEach((b) => (b.visible = false)); u.mouth.g.visible = false;
  u.headM.material = PORC();
  u.head.children.forEach((c) => { if (c.isMesh && c !== u.headM && Math.abs(c.position.x) < 0.01 && c.position.y > 0.08 && c.position.y < 0.112) c.visible = false; }); // nariz liso
  // gravata vinho com nó: pende de um pivô no colarinho (balança com a mola)
  const tieM = TM(o.tie ?? 0x5a1a26);
  const tg = grp(u.chest, 0, 0.285, 0.088);
  const knot = mesh(sph(1, 10, 8), tieM, 0, -0.008, 0.008, tg); knot.scale.set(0.017, 0.021, 0.011);
  // gravata que alarga e termina em ponta, curvada para deitar sobre o peito (perfil do peito: z = raio * 0.7)
  const chestZ = (y) => { const P_ = [[-0.02, 0.091], [0.06, 0.106], [0.15, 0.118], [0.22, 0.116], [0.27, 0.098], [0.305, 0.056]]; for (let i = 0; i < P_.length - 1; i++) if (y <= P_[i + 1][0]) return lerp(P_[i][1], P_[i + 1][1], (y - P_[i][0]) / (P_[i + 1][0] - P_[i][0])); return 0.056; };
  const rows = 9, tpos = [], tidx = [];
  for (let r = 0; r <= rows; r++) { const d = 0.016 + (r / rows) * 0.2, hw = lerp(0.011, 0.024, r / rows), zz = chestZ(0.285 - d) + 0.007 - 0.088; tpos.push(-hw, -d, zz, hw, -d, zz); }
  tpos.push(0, -0.244, chestZ(0.041) + 0.007 - 0.088);
  for (let r = 0; r < rows; r++) { const a = r * 2; tidx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  tidx.push(rows * 2, rows * 2 + 2, rows * 2 + 1);
  const tGeo = new THREE.BufferGeometry(); tGeo.setAttribute("position", new THREE.Float32BufferAttribute(tpos, 3)); tGeo.setIndex(tidx); tGeo.computeVertexNormals();
  const tie = mesh(tGeo, TM(o.tie ?? 0x5a1a26, { side: THREE.DoubleSide }), 0, 0, 0, tg); tie.castShadow = false;
  // botões do paletó e lenço no bolso (detalhes do "homem comum")
  mesh(sph(0.008, 8, 6), TM(0x1a1a20), 0.035, 0.05, 0.118, u.chest); mesh(sph(0.008, 8, 6), TM(0x1a1a20), 0.034, -0.02, 0.112, u.spine);
  u.tie = tg; u.tieMesh = tie;
  return p;
}
// mola da gravata e do cabelo a partir da posição do peito ao longo do tempo (fn(τ) -> [x,y,z] no mundo)
function molaHomem(p, t, posFn, o = {}) {
  const L = lagLocal(p, mola(t, posFn, { k: o.k ?? 60, c: o.c ?? 7, w: 1.2 }));
  // a gravata só sai do peito para a frente (parar de andar, inclinar o corpo); para os lados balança livre
  const u = p.userData; u.tie.rotation.x = -clamp(L[2] * 9, 0, 0.9) - Math.max(0, u.spine.rotation.x + u.chest.rotation.x + u.hips.rotation.x) * 0.85;
  u.tie.rotation.z = clamp(-L[0] * 9, -0.6, 0.6) * (1 + u.tie.rotation.x * -1.2);
  hairMola(p, L, 4);
  return L;
}
// pasta executiva (presa na mão direita)
function pasta(parent) {
  const b = grp(parent, 0, -0.1, 0.0), m = SM(0x2a1a14, { roughness: 0.55 });
  mesh(box(0.36, 0.27, 0.08), m, 0, -0.16, 0, b); mesh(box(0.37, 0.02, 0.085), SM(0x1a100c), 0, -0.035, 0, b);
  const hd = mesh(new THREE.TorusGeometry(0.045, 0.009, 6, 14, Math.PI), SM(0x1a100c), 0, -0.02, 0, b); hd.rotation.z = 0;
  [-0.11, 0.11].forEach((x) => mesh(box(0.025, 0.015, 0.088), SM(0xb8a070, { metalness: 0.8, roughness: 0.3 }), x, -0.05, 0, b));
  return b;
}
// o menino sem rosto (uniforme escolar escuro de gola alta, original)
function meninoSemRosto(o = {}) {
  const p = semRosto({ jacket: 0x1c1e28, pants: 0x1c1e28, shirt: 0xf1eee6, collar: "alta", jacketOpen: 0.05, scale: 0.72, tie: 0x1c1e28, seed: 72, dims: { headY: 0.06 }, ...o });
  p.userData.tie.visible = false;
  mesh(sph(0.006, 8, 6), SM(0xc8a050, { metalness: 0.8, roughness: 0.3 }), 0, 0.2, 0.125, p.userData.chest); mesh(sph(0.006, 8, 6), SM(0xc8a050, { metalness: 0.8, roughness: 0.3 }), 0, 0.12, 0.13, p.userData.chest);
  return p;
}
// silhueta (sombra por trás do papel da porta): pessoa toda escura, sem contorno
function silhueta(o = {}) {
  const p = pessoa({ fingers: false, ...o }), m = new THREE.MeshBasicMaterial({ color: 0x120a08, fog: false });
  p.traverse((c) => { if (c.isMesh) { if (c.userData.isOutline) c.visible = false; else { c.material = m; c.castShadow = false; c.receiveShadow = false; } } });
  return p;
}

// ---------------------------------------------------------------- texturas do Japão de bairro (originais, procedurais)
function texAsfalto() {
  if (TX.asf) return TX.asf;
  return (TX.asf = texPair(512, (u, v) => fbm2(u * 40, v * 40, 3, 40) * 0.6 + fbm2(u * 9, v * 9, 3, 9) * 0.4 - (Math.abs(fbm2(u * 5 + 3, v * 5, 4, 5) - 0.5) < 0.012 ? 0.25 : 0),
    (u, v, h) => { const n = fbm2(u * 4, v * 4, 4, 4); const c = mixc([58, 58, 62], [84, 84, 88], n); return mixc(c, [30, 30, 34], clamp((0.42 - h) * 2)); }, 3, { rep: [1, 1] }));
}
function texBloco() { return texBlocks([156, 154, 148], [128, 127, 122]); }
function texTelha() { return texRoof([72, 78, 90], [50, 56, 66]); }
function texSiding(c = "#d9cdb4") {
  const k = "sid" + c; if (TX[k]) return TX[k];
  return (TX[k] = canvasTex(256, 256, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) { g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(0, y, w, 2); g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(0, y + 2, w, 2); }
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${hash(i) > 0.5 ? "90,80,70" : "255,250,240"},${0.03 + hash(i * 3) * 0.05})`; g.beginPath(); g.arc(hash(i * 5) * w, hash(i * 7) * h, 3 + hash(i * 9) * 10, 0, 7); g.fill(); } }));
}
function texPapelParede(c1 = "#cfc4ae", c2 = "#c4b8a0") {
  const k = "pp" + c1 + c2; if (TX[k]) return TX[k];
  return (TX[k] = canvasTex(256, 256, (g, w, h) => { g.fillStyle = c1; g.fillRect(0, 0, w, h); g.fillStyle = c2; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 6, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(hash(i) * w, hash(i * 3) * h, 30, 2); } }));
}
function texAzulejo(c = "#e8eaec", grout = "#9aa2a8", n = 8) {
  const k = "az" + c + n; if (TX[k]) return TX[k];
  return (TX[k] = texPair(256, (u, v) => { const fu = (u * n) % 1, fv = (v * n) % 1; return Math.min(fu, 1 - fu, fv, 1 - fv) < 0.04 ? 0 : 1; },
    (u, v, h) => (h < 0.5 ? hex2rgb(parseInt(grout.slice(1), 16)) : mixc(hex2rgb(parseInt(c.slice(1), 16)), [255, 255, 255], hash2(Math.floor(u * n), Math.floor(v * n)) * 0.2)), 2));
}
function texTatami() {
  if (TX.tat) return TX.tat;
  return (TX.tat = canvasTex(256, 512, (g, w, h) => { g.fillStyle = "#b8b07a"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(${hash(y) > 0.5 ? "90,90,40" : "230,220,160"},.18)`; g.fillRect(0, y, w, 1.5); }
    g.fillStyle = "#2a2a1e"; g.fillRect(0, 0, 12, h); g.fillRect(w - 12, 0, 12, h); }));
}

// ---------------------------------------------------------------- peças da rua residencial (bairro tranquilo, à noite)
// poste de concreto com cruzeta, isoladores e às vezes um transformador; devolve os pontos de fixação dos fios
function posteJP(g, x, z, h = 8.5, o = {}) {
  const p = grp(g, x, 0, z), cm = SM(0x8c8a84, { roughness: 0.9 });
  mesh(cyl(0.11, 0.15, h, 12), cm, 0, h / 2, 0, p);
  const arm = mesh(box(1.7, 0.09, 0.09), SM(0x5a5a5e, { metalness: 0.5, roughness: 0.6 }), 0, h - 0.55, 0, p);
  [-0.75, 0, 0.75].forEach((dx) => mesh(cyl(0.035, 0.045, 0.12, 8), SM(0xd8d4cc, { roughness: 0.4 }), dx, h - 0.45, 0, p));
  if (o.trafo) { mesh(cyl(0.22, 0.22, 0.6, 14), SM(0x7a8088, { metalness: 0.4, roughness: 0.5 }), 0.32, h - 1.6, 0, p); }
  mesh(box(0.06, 0.4, 0.06), SM(0xd8c040), 0, 2.2, 0.12, p); // faixa amarela de aviso
  p.rotation.y = o.rot ?? 0; p.updateMatrixWorld(true);
  return [-0.75, 0, 0.75].map((dx) => p.localToWorld(V3(dx, h - 0.42, 0)).toArray());
}
// fio que verga entre dois pontos
function fio(g, a, b, sag = 0.45, r = 0.012, col = 0x16161a) {
  const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push(V3(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * sag, lerp(a[2], b[2], u))); }
  const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 4), new THREE.MeshBasicMaterial({ color: col }), 0, 0, 0, g); m.castShadow = false; return m;
}
// muro de blocos de concreto com capa no topo
function muroBloco(g, x, z, len, h = 1.5, ang = 0) {
  const w = grp(g, x, 0, z); w.rotation.y = ang; const t = texBloco();
  const m = SM(0xffffff, { map: rep(t.map.clone(), len / 1.6, h / 1.2), normalMap: rep(t.normalMap.clone(), len / 1.6, h / 1.2), roughness: 0.92 }); m.map.needsUpdate = true; m.normalMap.needsUpdate = true;
  mesh(box(len, h, 0.15), m, 0, h / 2, 0, w); mesh(box(len + 0.02, 0.06, 0.2), SM(0x9a9890), 0, h + 0.03, 0, w);
  return w;
}
// casa japonesa de dois andares (telhado de cerâmica, varanda, ar-condicionado, janelas acesas ou apagadas)
function casaJP(g, x, z, o = {}) {
  const c = grp(g, x, 0, z), W_ = o.w ?? 7, D_ = o.d ?? 6, H_ = o.h ?? 5.6; c.rotation.y = o.rot ?? 0;
  const sid = texSiding(o.cor ?? "#d9cdb4"), wallM = SM(0xffffff, { map: rep(sid.clone(), W_ / 2.5, H_ / 2.5), roughness: 0.85 }); wallM.map.needsUpdate = true;
  mesh(box(W_, H_, D_), wallM, 0, H_ / 2, 0, c);
  mesh(box(W_ + 0.06, 0.12, D_ + 0.06), SM(0x6a6460), 0, H_ * 0.5, 0, c); // faixa entre os andares
  // telhado de duas águas em cerâmica escura, com beiral
  const rt = texTelha(), roofM = SM(0xffffff, { map: rep(rt.map.clone(), W_ / 1.8, 2), normalMap: rep(rt.normalMap.clone(), W_ / 1.8, 2), roughness: 0.45, metalness: 0.15 }); roofM.map.needsUpdate = true; roofM.normalMap.needsUpdate = true;
  const rh = o.rh ?? 1.7, half = D_ / 2 + 0.55, sl = Math.hypot(half, rh);
  [-1, 1].forEach((k) => { const r = mesh(box(W_ + 1.0, 0.12, sl), roofM, 0, H_ + rh / 2, k * half / 2, c); r.rotation.x = k * Math.atan2(rh, half); });
  mesh(box(W_ + 1.05, 0.16, 0.22), SM(0x2e3238), 0, H_ + rh + 0.02, 0, c);
  const gab = new THREE.Shape([new THREE.Vector2(-D_ / 2, 0), new THREE.Vector2(D_ / 2, 0), new THREE.Vector2(0, rh)]);
  [-1, 1].forEach((k) => { const gg = mesh(new THREE.ShapeGeometry(gab), wallM, k * W_ / 2 * 0.999, H_, 0, c); gg.rotation.y = k * Math.PI / 2; });
  // janelas: acesas (quente) ou escuras; caixilho de alumínio
  const wins = [];
  (o.janelas ?? [[-1.6, 1.4, 1], [1.6, 1.4, 0], [-1.6, 4.0, 0], [1.6, 4.0, 1]]).forEach(([wx, wy, lit], i) => {
    const fr = mesh(box(1.5, 1.15, 0.08), SM(0xa8acb0, { metalness: 0.6, roughness: 0.35 }), wx, wy, D_ / 2 + 0.02, c);
    const glassM = lit ? new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: o.luzJanela ?? 0xffb860, emissiveIntensity: 1.4 * (lit === true ? 1 : lit), roughness: 0.4 }) : SM(0x1a2230, { roughness: 0.15, metalness: 0.3 });
    const gl = mesh(box(1.32, 0.98, 0.05), glassM, wx, wy, D_ / 2 + 0.06, c);
    mesh(box(0.04, 0.98, 0.07), SM(0xa8acb0, { metalness: 0.6, roughness: 0.35 }), wx, wy, D_ / 2 + 0.07, c);
    if (lit) { const cur = mesh(box(0.5, 0.9, 0.02), new THREE.MeshStandardMaterial({ color: 0xf0d8b0, emissive: 0xffa850, emissiveIntensity: 0.6, roughness: 0.9 }), wx - 0.38, wy, D_ / 2 + 0.085, c); cur.castShadow = false; }
    wins.push({ gl, m: glassM, x: wx, y: wy });
  });
  // varanda do segundo andar com grade
  if (o.varanda !== false) { const vx = o.varandaX ?? 1.6; mesh(box(2.4, 0.08, 0.9), SM(0x8a8480), vx, 3.15, D_ / 2 + 0.45, c); for (let i = 0; i <= 12; i++) mesh(box(0.025, 0.8, 0.025), SM(0x9aa0a6, { metalness: 0.6, roughness: 0.4 }), vx - 1.2 + i * 0.2, 3.58, D_ / 2 + 0.88, c); mesh(box(2.42, 0.04, 0.05), SM(0x9aa0a6, { metalness: 0.6, roughness: 0.4 }), vx, 3.98, D_ / 2 + 0.88, c); }
  // ar-condicionado externo
  const ac = grp(c, o.acX ?? -2.6, 0.35, D_ / 2 + 0.3); mesh(box(0.8, 0.55, 0.28), SM(0xd8d6d0, { roughness: 0.6 }), 0, 0, 0, ac); const fan = mesh(new THREE.CircleGeometry(0.2, 18), SM(0x3a3a3e), 0.12, 0, 0.142, ac); fan.castShadow = false;
  // porta de entrada com luz
  mesh(box(1.0, 2.1, 0.1), SM(0x4a3a2c, { roughness: 0.6 }), o.portaX ?? 0, 1.05, D_ / 2 + 0.03, c);
  return { c, wins, D: D_, W: W_, H: H_ };
}
// máquina de bebidas acesa (fileiras de garrafas genéricas)
const maqTex = canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = "#e8eef4"; g.fillRect(0, 0, w, h);
  const cols = ["#d8342a", "#2a6ad8", "#f0c030", "#38a84a", "#f08a2a", "#8a3ad8", "#2ac8c8", "#e85a8a"];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) { const x = 16 + i * 38, y = 30 + r * 92; g.fillStyle = cols[(r * 3 + i) % cols.length]; g.beginPath(); g.roundRect(x + 6, y + 14, 20, 52, 6); g.fill(); g.fillRect(x + 11, y + 4, 10, 12); g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(x + 9, y + 20, 4, 40);
    g.fillStyle = "#1a1a1a"; g.fillRect(x + 4, y + 72, 26, 10); g.fillStyle = "#4aff6a"; g.fillRect(x + 8, y + 74, 4, 6); }
  g.fillStyle = "#c8ccd0"; g.fillRect(0, 400, w, 112); g.fillStyle = "#2a2a2e"; g.fillRect(40, 440, 176, 40);
});
function maquinaBebidas(g, x, z, ang = 0) {
  const m = grp(g, x, 0, z); m.rotation.y = ang;
  mesh(box(1.0, 1.85, 0.75), SM(0xd8343a, { roughness: 0.5 }), 0, 0.925, 0, m);
  const fr = mesh(new THREE.PlaneGeometry(0.86, 1.64), new THREE.MeshStandardMaterial({ map: maqTex, emissive: 0xffffff, emissiveMap: maqTex, emissiveIntensity: 0.72, roughness: 0.25 }), 0, 0.95, 0.38, m); fr.castShadow = false;
  const L = new THREE.PointLight(0xe8f0ff, 2.1, 7, 1.6); L.position.set(0, 1.0, 0.9); m.add(L);
  const gl = glowSprite(0xdfeaff, 2.0, 0.22); gl.position.set(0, 1.0, 0.5); m.add(gl);
  return { m, L };
}
const coneTex = canvasTex(16, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
// poste de luz da rua (cabeça de LED fria ou lâmpada de sódio quente), com cone de luz
function luzRua(g, x, z, o = {}) {
  const p = grp(g, x, 0, z), h = o.h ?? 5.2, col = o.col ?? 0xdfe6ff; p.rotation.y = o.rot ?? 0;
  mesh(cyl(0.05, 0.07, h, 10), SM(0x6a6c70, { metalness: 0.5, roughness: 0.5 }), 0, h / 2, 0, p);
  const arm = mesh(cyl(0.035, 0.035, 1.1, 8), SM(0x6a6c70, { metalness: 0.5, roughness: 0.5 }), 0, h - 0.05, 0.5, p); arm.rotation.x = Math.PI / 2 - 0.15;
  const head = grp(p, 0, h - 0.12, 1.05); mesh(box(0.42, 0.08, 0.2), SM(0x4a4c50, { metalness: 0.5, roughness: 0.5 }), 0, 0, 0, head);
  const lamp = mesh(box(0.36, 0.02, 0.15), new THREE.MeshBasicMaterial({ color: col }), 0, -0.05, 0, head);
  const L = new THREE.SpotLight(col, o.I ?? 26, 16, 0.85, 0.6, 1.6); L.position.set(0, -0.08, 0); head.add(L); const tg = grp(head, 0, -6, 0.3); L.target = tg;
  const glow = glowSprite(col, 1.6, 0.6); glow.position.set(0, -0.12, 0); head.add(glow);
  const cone = mesh(new THREE.ConeGeometry(1.7, h - 0.3, 32, 1, true), new THREE.MeshBasicMaterial({ color: col, map: coneTex, transparent: true, opacity: 0.11, depthWrite: false, blending: ADD, side: THREE.DoubleSide, fog: false }), 0, -(h - 0.3) / 2 - 0.08, 0, head); cone.castShadow = false;
  return { p, L, glow, lamp, cone, I: o.I ?? 26 };
}
// gato preto sentado no muro (cauda que balança, olhos que brilham e seguem um alvo)
function gato(g, x, y, z, ang = 0) {
  const c = grp(g, x, y, z); c.rotation.y = ang; const m = SM(0x121014, { roughness: 0.7 });
  const body = mesh(sph(1, 14, 10), m, 0, 0.13, 0, c); body.scale.set(0.11, 0.15, 0.13);
  const head = grp(c, 0, 0.32, 0.04); mesh(sph(0.075, 14, 10), m, 0, 0, 0, head);
  [-1, 1].forEach((k) => { const e = mesh(new THREE.ConeGeometry(0.03, 0.06, 4), m, k * 0.045, 0.07, 0, head); e.rotation.z = -k * 0.25; });
  const eyeM = new THREE.MeshBasicMaterial({ color: 0xd8ff6a }); [-1, 1].forEach((k) => mesh(sph(0.012, 8, 6), eyeM, k * 0.028, 0.008, 0.066, head));
  const tail = grp(c, 0, 0.06, -0.11); mesh(lockGeo([[0, 0, 0], [0, -0.04, -0.1], [0.04, -0.12, -0.16], [0.08, -0.22, -0.12]], 0.02, 0.012, 1, 10, 6), m, 0, 0, 0, tail);
  return { c, head, tail };
}
// lua cheia com halo
function lua(g, pos, size = 9) {
  const tex = canvasTex(256, 256, (c, w) => { const r = w / 2; const gr = c.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, "#fffbee"); gr.addColorStop(0.92, "#f2ead6"); gr.addColorStop(1, "rgba(242,234,214,0)"); c.fillStyle = gr; c.beginPath(); c.arc(r, r, r, 0, 7); c.fill();
    for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(160,150,140,${0.12 + hash(i) * 0.12})`; c.beginPath(); c.arc(r + (hash(i * 3) - 0.5) * r * 1.2, r + (hash(i * 5) - 0.5) * r * 1.2, 8 + hash(i * 7) * 30, 0, 7); c.fill(); } });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffffff, fog: false, depthWrite: false })); s.scale.setScalar(size); s.position.set(...pos); g.add(s);
  const h = glowSprite(0xcfdcff, size * 4, 0.35); h.material.fog = false; h.position.set(...pos); g.add(h);
  return s;
}
// texto pintado no asfalto ("止まれ" = pare) e placa triangular de pare (sinalização genérica de rua japonesa)
const tomareTex = canvasTex(512, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "rgba(240,240,236,.92)"; c.font = "700 170px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("止まれ", w / 2, h / 2 + 8); });
function placaPare(g, x, z, ang = 0) {
  const p = grp(g, x, 0, z); p.rotation.y = ang; mesh(cyl(0.035, 0.035, 2.4, 8), SM(0x8a8c90, { metalness: 0.5 }), 0, 1.2, 0, p);
  const tri = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#c8202a"; c.beginPath(); c.moveTo(w / 2, h * 0.92); c.lineTo(w * 0.04, h * 0.1); c.lineTo(w * 0.96, h * 0.1); c.closePath(); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 10; c.stroke(); c.fillStyle = "#fff"; c.font = "700 54px sans-serif"; c.textAlign = "center"; c.fillText("止まれ", w / 2, h * 0.42); });
  const s = mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshStandardMaterial({ map: tri, transparent: true, roughness: 0.5, side: THREE.DoubleSide }), 0, 2.3, 0.04, p); s.castShadow = false;
  return p;
}

// ================================================================ vídeo: Kira · cenas 1–5

// ---------------------------------------------------------------- utilidades de cena
// distância percorrida com velocidade constante e desaceleração final (chega em D no instante t1, parado)
function andarAte(t, t0, t1, D, td = 1.1) {
  const T_ = t1 - t0, v = D / (T_ - td / 2), tau = clamp(t - t0, 0, T_);
  if (tau < T_ - td) return v * tau;
  const s = tau - (T_ - td); return v * (T_ - td) + v * s - (v * s * s) / (2 * td);
}
// pasta pendurada na mão: fica na vertical (gira só no rumo do corpo) e balança com a mola
function pastaPendura(b, p, L) {
  const pq = new THREE.Quaternion(); b.parent.getWorldQuaternion(pq);
  const want = new THREE.Quaternion().setFromEuler(new THREE.Euler(clamp(L[2] * 5, -0.5, 0.5), p.rotation.y, clamp(-L[0] * 5, -0.5, 0.5), "YXZ"));
  b.quaternion.copy(pq.invert().multiply(want));
}
// cidade distante (prédios com janelas acesas), para o fundo das cenas de rua
const janelasTex = canvasTex(256, 512, (c, w, h) => { c.fillStyle = "#0a0c14"; c.fillRect(0, 0, w, h); for (let y = 8; y < h; y += 18) for (let x = 6; x < w; x += 14) { const r = hash2(x * 0.37, y * 0.71); if (r > 0.55) { c.fillStyle = r > 0.9 ? "#ffe8b0" : r > 0.75 ? "#ffc878" : "#9ab4d8"; c.globalAlpha = 0.35 + r * 0.5; c.fillRect(x, y, 8, 10); } } c.globalAlpha = 1; });
function cidadeLonge(g, z0, n = 40, o = {}) {
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshBasicMaterial({ map: janelasTex, color: o.tint ?? 0xffffff, fog: true });
  const blds = [];
  for (let i = 0; i < n; i++) {
    const w = 8 + hash(i * 3.1) * 16, h = 12 + Math.pow(hash(i * 5.7), 2) * (o.hmax ?? 70), x = (i / n - 0.5) * (o.span ?? 420) + (hash(i * 7.3) - 0.5) * 12, z = z0 - hash(i * 9.1) * 60;
    const m = new THREE.Mesh(geo, mat.clone()); m.material.map = janelasTex.clone(); m.material.map.needsUpdate = true; m.material.map.wrapS = m.material.map.wrapT = THREE.RepeatWrapping; m.material.map.repeat.set(w / 18, h / 34); m.material.map.offset.set(hash(i), hash(i * 2));
    m.scale.set(w, h, w * 0.8); m.position.set(x, 0, z); g.add(m); blds.push(m);
    if (h > 50) { const red = glowSprite(0xff3030, 4, 0.8); red.position.set(x, h + 1, z); g.add(red); blds.push(red); }
  }
  return blds;
}

// ---------------------------------------------------------------- 1 · rua residencial à noite: o homem sem rosto volta pra casa; uma janela acesa
addSet("s1-rua", (g) => {
  const [a, b] = T.sc["s1-rua"];
  // céu noturno, lua, cidade no fim da rua
  const dome = skyDome(g, { top: 0x03060f, mid: 0x0c1428, hor: 0x2a2c40, ground: 0x05060a, exp: 0.6, sunDir: [-0.15, 0.32, -1], sunCol: 0xc8d8ff, sunI: 0.12, disk: 0.6, cov: 0.62, cloudA: 0.55, cloudLit: 0x6a7898, cloudSh: 0x1a2236, stars: 0.9, cloudScale: 0.14 });
  lua(g, [38, 66, 172], 11);
  cidadeLonge(g, 250, 46, { hmax: 80 });
  // chão: rua de asfalto com faixas brancas, quintais, calçamento na frente dos portões
  const at = texAsfalto(), road = SM(0xffffff, { map: rep(at.map.clone(), 3, 48), normalMap: rep(at.normalMap.clone(), 3, 48), roughness: 0.62, metalness: 0.05 }); road.map.needsUpdate = road.normalMap.needsUpdate = true;
  const rd = mesh(new THREE.PlaneGeometry(6.2, 170), road, 0, 0, 20, g); rd.rotation.x = -Math.PI / 2;
  [-2.6, 2.6].forEach((x) => { const l = mesh(new THREE.PlaneGeometry(0.12, 170), SM(0xd8d8d0, { roughness: 0.5 }), x, 0.006, 20, g); l.rotation.x = -Math.PI / 2; l.receiveShadow = true; });
  const tm = mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshStandardMaterial({ map: tomareTex, transparent: true, roughness: 0.6, depthWrite: false }), -1.3, 0.008, 13.2, g); tm.rotation.x = -Math.PI / 2; tm.castShadow = false;
  mesh(new THREE.PlaneGeometry(2.6, 0.25), SM(0xd8d8d0), -1.3, 0.007, 12.0, g).rotation.x = -Math.PI / 2;
  placaPare(g, -3.15, 11.8, Math.PI / 2);
  const yard = SM(0x2a3020, { roughness: 1 });
  [-1, 1].forEach((k) => { const y_ = mesh(new THREE.PlaneGeometry(24, 170), yard, k * 15.1, -0.01, 20, g); y_.rotation.x = -Math.PI / 2; });
  // muros de blocos dos dois lados (com portões) e casas atrás
  const gates = { L: [-6, 22, 36, 50, -20], R: [2, 16, 30, 44, -12] };
  const muroLado = (k, zs) => { const xs = k * 3.15; let z = 70; zs.slice().sort((p, q) => q - p).forEach((gz) => { const len = z - (gz + 0.7); if (len > 0.2) muroBloco(g, xs, (z + gz + 0.7) / 2, len, 1.5, Math.PI / 2); z = gz - 0.7; [gz + 0.75, gz - 0.75].forEach((pz) => mesh(box(0.32, 1.75, 0.32), SM(0x8a8680, { roughness: 0.9 }), xs, 0.875, pz, g)); }); muroBloco(g, xs, (z - 40) / 2, z + 40, 1.5, Math.PI / 2); };
  muroLado(-1, [...gates.L, 9.5, 7.1]); muroLado(1, gates.R);
  const cores = ["#d9cdb4", "#c8c4bc", "#d4c0a8", "#bcc4c8", "#e0d6c4", "#c4b49c", "#d8d0c0", "#b8b0a4"];
  const casas = [];
  gates.L.forEach((z, i) => casas.push(casaJP(g, -8.4, z, { rot: Math.PI / 2, cor: cores[i], janelas: z === -6 ? [[-1.6, 1.4, 0], [1.6, 1.4, 0], [-1.6, 4.0, 0.55], [1.6, 4.0, 0]] : [[-1.6, 1.4, hash(i) > 0.5 ? 0.6 : 0], [1.6, 1.4, 0], [-1.6, 4.0, hash(i * 3) > 0.6 ? 0.5 : 0], [1.6, 4.0, 0]], acX: -2.6, varandaX: 1.6 })));
  gates.R.forEach((z, i) => casas.push(casaJP(g, 8.4, z, { rot: -Math.PI / 2, cor: cores[i + 4], janelas: [[-1.6, 1.4, hash(i * 7) > 0.4 ? 0.5 : 0], [1.6, 1.4, hash(i * 2) > 0.6 ? 0.45 : 0], [-1.6, 4.0, 0], [1.6, 4.0, hash(i * 9) > 0.5 ? 0.45 : 0]] })));
  const minha = casas[0];
  // luz da janela do quarto (a única acesa da casa) e lâmpada do portão
  const winL = new THREE.PointLight(0xffb060, 1.2, 8, 1.6); winL.position.set(-4.85, 4.0, -4.4); g.add(winL);
  const gateLamp = grp(g, -3.15, 1.9, -6.85); mesh(box(0.16, 0.22, 0.12), new THREE.MeshStandardMaterial({ color: 0xffe0b0, emissive: 0xffb060, emissiveIntensity: 1.6 }), 0, 0, 0, gateLamp);
  const gl0 = new THREE.PointLight(0xffb870, 1.6, 5, 1.6); gl0.position.set(0.3, 0, 0); gateLamp.add(gl0); gateLamp.add(glowSprite(0xffc080, 0.9, 0.5));
  mesh(box(0.06, 0.3, 0.22), SM(0x2a2a2e), -3.0, 1.2, -5.25, g); // caixa de correio
  // postes, fios, luzes da rua, máquina de bebidas, gato no muro, vasos e bicicleta
  const PZ = [54, 40, 26, 12, -2, -16, -30], tops = PZ.map((z, i) => posteJP(g, 2.75, z, 8.6, { trafo: i === 3 || i === 0 }));
  for (let i = 0; i < tops.length - 1; i++) for (let j = 0; j < 3; j++) fio(g, tops[i][j], tops[i + 1][j], 0.55 + j * 0.06, 0.011);
  [[-1, 36], [-1, 22], [-1, -6], [1, 30], [1, 16], [1, 2], [1, -12]].forEach(([k, z]) => fio(g, tops[Math.min(PZ.length - 1, Math.max(0, Math.round((54 - z) / 14)))][k < 0 ? 0 : 2], [k * 5.25, 4.9, z + 1.6], 0.35, 0.008));
  const luzes = [luzRua(g, -2.95, 5.5, { rot: Math.PI / 2, col: 0xdfe8ff, I: 22 }), luzRua(g, -2.95, -9.5, { rot: Math.PI / 2, col: 0xdfe8ff, I: 22 }), luzRua(g, 2.95, 19, { rot: -Math.PI / 2, col: 0xffc890, I: 20 }), luzRua(g, -2.95, 33, { rot: Math.PI / 2, col: 0xdfe8ff, I: 18 }), luzRua(g, 2.95, 47, { rot: -Math.PI / 2, col: 0xffc890, I: 16 })];
  const maq = maquinaBebidas(g, -2.6, -1.0, Math.PI / 2);
  const cat = gato(g, -3.15, 1.56, 2.3, Math.PI / 2);
  const vaso = (x, z, s = 1) => { mesh(cyl(0.16 * s, 0.12 * s, 0.32 * s, 12), SM(0x8a4a30, { roughness: 0.8 }), x, 0.16 * s, z, g); [0, 1, 2].forEach((i) => mesh(sph(0.14 * s, 10, 8), SM(0x2a4a24, { roughness: 0.9 }), x + (hash(i + x) - 0.5) * 0.16 * s, 0.38 * s + i * 0.06, z + (hash(i * 3 + z) - 0.5) * 0.16, g)); };
  vaso(-2.8, -4.9, 1.1); vaso(-2.8, -7.1, 0.9); vaso(2.8, 1.0); vaso(2.75, 17.1, 1.2); vaso(-2.8, 23.3); vaso(2.8, 3.1, 0.8);
  const bike = grp(g, 2.65, 0, 14.4); bike.rotation.y = 0.05; const bm = SM(0x3a6a8a, { metalness: 0.5, roughness: 0.4 });
  [-0.5, 0.5].forEach((z) => { const w = mesh(new THREE.TorusGeometry(0.32, 0.025, 6, 24), SM(0x1a1a1a), 0, 0.34, z, bike); w.rotation.y = Math.PI / 2; });
  mesh(box(0.04, 0.04, 0.9), bm, 0, 0.55, 0, bike); mesh(box(0.04, 0.45, 0.04), bm, 0, 0.6, -0.15, bike); mesh(box(0.05, 0.03, 0.22), SM(0x1a1a1a), 0, 0.85, -0.15, bike); mesh(box(0.5, 0.03, 0.03), SM(0x8a8a8a, { metalness: 0.7 }), 0, 0.92, 0.42, bike);
  // folhas secas e mariposas nas luzes
  const folhas = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.07, 0.05), SM(0x7a5a2a, { side: THREE.DoubleSide, roughness: 0.9 }), 120);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(); for (let i = 0; i < 120; i++) { M4.compose(V3((hash(i) - 0.5) * 5.6, 0.012, 30 - hash(i * 3) * 42), Q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, hash(i * 5) * 6)), V3(1, 1, 1)); folhas.setMatrixAt(i, M4); } g.add(folhas);
  const moths = luzes.slice(0, 2).map((l, i) => { const d = dustPts(14, [-0.5, 0.5, -0.4, 0.4, -0.5, 0.5], 0xfff4dc, 0.035, 0.9, ADD, i + 3); d.position.copy(wpos(l.lamp)); g.add(d); return d; });
  // o homem sem rosto, de pasta na mão: anda até o portão de casa e para com os dois pés no chão
  const p = semRosto(); g.add(p); const u = p.userData; const case_ = pasta(u.wr[0]); case_.position.set(0, -0.11, 0.02);
  const X0 = -1.45, Z0 = 4.6, ZS = -5.95, D = Z0 - ZS, L = gaitFit(D, 0.62), tStop = K.normal0 + 0.15;
  const distF = (t) => andarAte(t, a - 0.4, tStop, D, 1.3);
  const chestPos = (tt) => { const d = distF(tt), ph = (d / (2 * L)) * Math.PI * 2; return [X0 + Math.sin(ph) * 0.02, 1.32 + Math.cos(2 * ph) * 0.016, Z0 - d]; };
  const janela = V3(-5.34, 4.0, -4.4);
  return {
    bg: 0x070a14, fog: [16, 150], fogCol: 0x0c1020, dome,
    look: { exposure: 1.2, bloom: 0.8, bloomT: 0.66, bloomR: 0.55, vig: 0.48, sat: 1.05, con: 1.06, lift: [0.01, 0.015, 0.032] },
    sun: { dir: [0.3, 0.7, 0.65], col: 0x9ab0e8, I: 0.85, c: [-1, 0, -2], r: 16 }, hemi: { sky: 0x3a4a78, ground: 0x0e0e16, I: 0.6 }, fill: { col: 0x6a80c0, I: 0.12 }, rim: { col: 0xb8c8ff, str: 0.5 }, hand: 0.008,
    update(t) {
      dome.userData.u.uOff.value.set(t * 0.002, 0);
      const d = distF(t);
      restPose(p);
      const gg = gait(p, d, { from: [X0, 0, Z0], ang: Math.PI, step: L, amt: 0.95 });
      const walking = clamp((tStop - t) / 0.6);
      u.sh[0].rotation.x *= 0.3; u.el[0].rotation.x = -0.1; u.sh[0].rotation.z = -0.1; // braço da pasta quase parado
      idle(p, t, 7, 0.25 + 0.75 * (1 - walking));
      // parado no portão: vira a cabeça e o peito para a janela acesa (antecipação e acomodação)
      const lk = act(t, K.normal0 + 0.05, K.fica + 0.3, 0.1, 0.08);
      if (lk > 0) { lookAtW(p, janela, clamp(lk), 1.25); u.chest.rotation.y += 0.35 * lk; u.spine.rotation.y += 0.15 * lk; }
      const Lg = molaHomem(p, t, chestPos);
      pastaPendura(case_, p, Lg);
      // gato acompanha o homem com a cabeça; a cauda balança
      const cp = cat.c.position, ang = Math.atan2(X0 - cp.x, gg.pos[2] - cp.z) - Math.PI / 2;
      cat.head.rotation.y = clamp(-ang, -1.2, 1.2) * 0.8 + Math.sin(t * 0.7) * 0.05; cat.tail.rotation.z = Math.sin(t * 1.6) * 0.35; cat.tail.rotation.y = Math.sin(t * 0.9) * 0.2;
      // a luz da rua pisca quando a narração diz "assassino"
      const fl = t > K.assassino0 - 0.1 && t < K.assassino0 + 1.1 ? (noise1(t * 31) > 0.1 ? 1 : 0.15) * (0.6 + 0.4 * noise1(t * 9)) : 1;
      luzes[1].L.intensity = luzes[1].I * fl; luzes[1].glow.material.opacity = 0.6 * fl; luzes[1].cone.material.opacity = 0.05 * fl; luzes[1].lamp.material.color.setScalar(0.25 + 0.75 * fl);
      maq.L.intensity = 2.1 + noise1(t * 3) * 0.15;
      moths.forEach((m, i) => floatDust(m, t * (1.6 + i * 0.3), 0.35, 1.2));
      // a janela do quarto pulsa de leve (alguém lá dentro)
      const w = minha.wins[2]; w.m.emissiveIntensity = 0.55 + Math.sin(t * 2.1) * 0.03; winL.intensity = 1.2 + Math.sin(t * 2.1) * 0.08;
    },
    cam(t) {
      if (T.cortes) { // estilo novo: um ângulo diferente a cada ~1,5 s, cada um com leve empurrão
        const z = Z0 - distF(t), S = [
          [0, [0.4, 1.0, z - 2.6], [-1.45, 1.55, z], 34], [1.6, [-0.3, 7.5, z - 9], [-1.4, 0.8, z + 3], 38], [3.0, [0.9, 0.5, z - 1.5], [-1.45, 1.7, z], 40],
          [4.6, [-2.3, 1.7, z - 1.2], [-1.45, 1.55, z], 30], [6.1, [0.35, 0.8, z - 1.4], [-1.45, 1.65, z], 28], [7.6, [-0.2, 2.2, z + 2.4], [-1.45, 1.4, z - 1], 36],
          [8.8, [0.9, 2.15, -7.6], [-5.3, 4.05, -4.6], 34]];
        let i = 0; while (i < S.length - 1 && t >= S[i + 1][0]) i++;
        const k = seg(t, S[i][0], (S[i + 1] || [S[i][0] + 1.5])[0]), c = S[i];
        return { pos: lerp3(c[1], lerp3(c[1], c[2], 0.12), k), look: c[2], fov: c[3] - 2 * k };
      }
      return path2(t, [
        [a, [-0.3, 9.0, -16.0], [-1.3, 0.8, 2.5], 38],
        [K.so0 + 0.2, [-0.6, 4.0, -9.5], [-1.4, 1.2, 0.6], 36],
        [K.oito0 + 0.4, [0.1, 1.9, -7.6], [-1.45, 1.35, -2.2], 36],
        [K.assassino0 + 0.3, [0.25, 0.95, -8.6], [-1.42, 1.5, -4.6], 34],
        [K.normal0 + 0.3, [0.3, 1.35, -9.9], [-1.5, 1.55, -6.0], 34],
        [K.fica + 0.25, [0.6, 1.95, -9.3], [-3.2, 2.9, -6.0], 34],
        [b, [0.9, 2.15, -7.6], [-5.3, 4.05, -4.6], 34],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 2 · a rotina: o quarto. Chega às 20h, afrouxa a gravata; às 23h, leite morno; luz apagada, 8 horas de sono
// relógio de parede analógico (ponteiros giram com a hora dada)
function relogioParede(parent, x, y, z, r = 0.26) {
  const c = grp(parent, x, y, z);
  const face = canvasTex(256, 256, (g, w) => { const R = w / 2; g.fillStyle = "#f4f0e6"; g.beginPath(); g.arc(R, R, R, 0, 7); g.fill(); g.fillStyle = "#1a1a1e"; g.font = "700 30px 'Archivo Black', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    for (let i = 1; i <= 12; i++) { const a_ = (i / 12) * Math.PI * 2; g.fillText(String(i), R + Math.sin(a_) * R * 0.76, R - Math.cos(a_) * R * 0.76); }
    for (let i = 0; i < 60; i++) { const a_ = (i / 60) * Math.PI * 2, r0 = i % 5 ? 0.92 : 0.88; g.fillRect(R + Math.sin(a_) * R * r0 - 1.5, R - Math.cos(a_) * R * r0 - 1.5, 3, 3); } });
  mesh(cyl(r + 0.025, r + 0.025, 0.05, 40), SM(0x2a2622, { roughness: 0.5 }), 0, 0, -0.01, c).rotation.x = Math.PI / 2;
  const fm = mesh(new THREE.CircleGeometry(r, 40), SM(0xffffff, { map: face, roughness: 0.6 }), 0, 0, 0.018, c); fm.castShadow = false;
  const hand_ = (len, w, col, z_) => { const h = grp(c, 0, 0, z_); mesh(box(w, len, 0.006), SM(col, { roughness: 0.4 }), 0, len * 0.4, 0, h); return h; };
  const hh = hand_(r * 0.55, 0.022, 0x141418, 0.024), mm = hand_(r * 0.8, 0.014, 0x141418, 0.03), ss = hand_(r * 0.85, 0.005, 0xc8202a, 0.036);
  mesh(cyl(0.012, 0.012, 0.03, 10), SM(0x141418), 0, 0, 0.03, c).rotation.x = Math.PI / 2;
  return { c, set(hours) { const m = (hours % 1) * 60; hh.rotation.z = -((hours % 12) / 12) * Math.PI * 2; mm.rotation.z = -(m / 60) * Math.PI * 2; ss.rotation.z = -((m * 60) % 60) / 60 * Math.PI * 2; } };
}
addSet("s2-rotina", (g) => {
  const [a, b] = T.sc["s2-rotina"];
  const RX = 2.3, RZ0 = -2.0, RZ1 = 2.6, RH = 2.5;
  // paredes, piso, teto (janela de verdade na parede do fundo: a lua entra por ela)
  const pp = texPapelParede("#cbbfa8", "#c2b59c"), wallM = SM(0xffffff, { map: rep(pp.clone(), 4, 2), roughness: 0.9 }); wallM.map.needsUpdate = true;
  const pk = texPlanks([150, 112, 76], [128, 92, 60]), floorM = SM(0xffffff, { map: rep(pk.map.clone(), 2.5, 2.5), normalMap: rep(pk.normalMap.clone(), 2.5, 2.5), roughness: 0.55 }); floorM.map.needsUpdate = floorM.normalMap.needsUpdate = true;
  mesh(box(RX * 2, 0.1, RZ1 - RZ0), floorM, 0, -0.05, (RZ0 + RZ1) / 2, g);
  mesh(box(RX * 2, 0.1, RZ1 - RZ0), SM(0xe8e4dc, { roughness: 0.95 }), 0, RH + 0.05, (RZ0 + RZ1) / 2, g);
  const WX0 = -1.55, WX1 = -0.35, WY0 = 1.0, WY1 = 2.05;
  mesh(box(WX0 + RX, RH, 0.12), wallM, (-RX + WX0) / 2, RH / 2, RZ0 - 0.06, g);
  mesh(box(RX - WX1, RH, 0.12), wallM, (WX1 + RX) / 2, RH / 2, RZ0 - 0.06, g);
  mesh(box(WX1 - WX0, WY0, 0.12), wallM, (WX0 + WX1) / 2, WY0 / 2, RZ0 - 0.06, g);
  mesh(box(WX1 - WX0, RH - WY1, 0.12), wallM, (WX0 + WX1) / 2, (RH + WY1) / 2, RZ0 - 0.06, g);
  mesh(box(0.12, RH, RZ1 - RZ0), wallM, -RX - 0.06, RH / 2, (RZ0 + RZ1) / 2, g);
  // parede direita com o vão da porta (z de -0.6 a 0.3)
  mesh(box(0.12, RH, -0.6 - RZ0), wallM, RX + 0.06, RH / 2, (RZ0 - 0.6) / 2, g); mesh(box(0.12, RH, RZ1 - 0.3), wallM, RX + 0.06, RH / 2, (RZ1 + 0.3) / 2, g); mesh(box(0.12, RH - 2.05, 0.9), wallM, RX + 0.06, (RH + 2.05) / 2, -0.15, g);
  mesh(box(4.6, 0.08, 0.02), SM(0x6a4a30), 0, 0.04, RZ0 + 0.005, g); // rodapé
  // caixilho da janela, vidro, cortinas e a vista da cidade à noite (céu, lua, prédios)
  const frM = SM(0xe8e4dc, { roughness: 0.5 });
  [[WX0, (WY0 + WY1) / 2, 0.05, WY1 - WY0], [WX1, (WY0 + WY1) / 2, 0.05, WY1 - WY0], [(WX0 + WX1) / 2, WY0, WX1 - WX0, 0.05], [(WX0 + WX1) / 2, WY1, WX1 - WX0, 0.05], [(WX0 + WX1) / 2, (WY0 + WY1) / 2, 0.035, WY1 - WY0]].forEach(([x, y, w, h]) => mesh(box(w, h, 0.07), frM, x, y, RZ0 - 0.04, g));
  const vista = canvasTex(512, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#040814"); gr.addColorStop(0.6, "#101a34"); gr.addColorStop(1, "#2a2a40"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + hash(i) * 0.6})`; c.fillRect(hash(i * 3) * w, hash(i * 5) * h * 0.55, 1.5, 1.5); }
    const mg = c.createRadialGradient(150, 120, 0, 150, 120, 90); mg.addColorStop(0, "rgba(255,250,235,1)"); mg.addColorStop(0.32, "rgba(250,244,226,1)"); mg.addColorStop(0.36, "rgba(200,215,255,.35)"); mg.addColorStop(1, "rgba(160,180,255,0)"); c.fillStyle = mg; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 28; i++) { const bx = (i / 28) * w + hash(i) * 10, bw = 14 + hash(i * 3) * 26, bh = 60 + hash(i * 7) * 170; c.fillStyle = "#070a12"; c.fillRect(bx, h - bh, bw, bh); for (let yy = h - bh + 6; yy < h - 4; yy += 9) for (let xx = bx + 3; xx < bx + bw - 3; xx += 6) if (hash2(xx, yy) > 0.62) { c.fillStyle = hash2(yy, xx) > 0.5 ? "rgba(255,200,120,.8)" : "rgba(160,190,230,.6)"; c.fillRect(xx, yy, 3, 4); } } });
  const vw = mesh(new THREE.PlaneGeometry(5.2, 4.4), new THREE.MeshBasicMaterial({ map: vista, fog: false }), (WX0 + WX1) / 2, 1.6, RZ0 - 2.6, g); vw.castShadow = false; vw.receiveShadow = false;
  const vidro = mesh(new THREE.PlaneGeometry(WX1 - WX0, WY1 - WY0), new THREE.MeshStandardMaterial({ color: 0x9ab0d0, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.2, depthWrite: false }), (WX0 + WX1) / 2, (WY0 + WY1) / 2, RZ0 - 0.03, g); vidro.castShadow = false;
  const curGeo = () => { const geo = new THREE.PlaneGeometry(0.55, 1.5, 12, 1); geo.userData.base = Float32Array.from(geo.attributes.position.array); return geo; };
  const curM = new THREE.MeshStandardMaterial({ color: 0xc8b8d0, roughness: 0.95, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
  const curtains = [WX0 - 0.12, WX1 + 0.12].map((x) => { const m = mesh(curGeo(), curM, x, (WY0 + WY1) / 2 + 0.12, RZ0 + 0.06, g); m.castShadow = true; return m; });
  // cama de casal arrumada, criado-mudo, abajur, despertador, copo de leite, tapete, chinelos, guarda-roupa, cabideiro, quadro
  const bed = grp(g, -1.55, 0, -0.95);
  mesh(box(1.5, 0.32, 2.1), SM(0x5a3a26, { roughness: 0.6 }), 0, 0.16, 0, bed); mesh(box(1.55, 0.95, 0.08), SM(0x4a2e1e, { roughness: 0.6 }), 0, 0.5, -1.06, bed);
  mesh(box(1.42, 0.22, 2.0), SM(0xf0ece4, { roughness: 0.9 }), 0, 0.43, 0, bed);
  [-0.35, 0.35].forEach((x) => { const pl = mesh(sph(1, 16, 10), SM(0xf4f2ec, { roughness: 0.95 }), x, 0.6, -0.78, bed); pl.scale.set(0.3, 0.07, 0.17); });
  const duvGeo = new THREE.PlaneGeometry(1.5, 1.46, 18, 18); duvGeo.rotateX(-Math.PI / 2);
  const duvBase = Float32Array.from(duvGeo.attributes.position.array);
  const duvet = mesh(duvGeo, SM(0x6a7a96, { roughness: 0.92, side: THREE.DoubleSide }), 0, 0.56, 0.41, bed);
  const setDuvet = (body) => { const P_ = duvGeo.attributes.position; for (let i = 0; i < P_.count; i++) { const x = duvBase[i * 3], z = duvBase[i * 3 + 2], edge = Math.max(0, Math.abs(x) - 0.62) * 2.2; let y = -edge * 0.5 + Math.sin(x * 9 + z * 3) * 0.006;
      if (body) { const ex = Math.exp(-(x * x) / 0.15), sh = smr(z, -0.73, -0.55); y += ex * (0.31 - Math.max(0, z - 0.2) * 0.14) * sh + ex * 0.1 * (1 - sh); }
      P_.setY(i, y); } P_.needsUpdate = true; duvGeo.computeVertexNormals(); };
  setDuvet(false);
  const ns = grp(g, -0.5, 0, -1.72); mesh(box(0.5, 0.58, 0.42), SM(0x5a3a26, { roughness: 0.6 }), 0, 0.29, 0, ns); mesh(box(0.52, 0.03, 0.44), SM(0x4a2e1e, { roughness: 0.5 }), 0, 0.595, 0, ns);
  mesh(box(0.3, 0.03, 0.02), SM(0xb8a070, { metalness: 0.7, roughness: 0.3 }), 0, 0.42, 0.215, ns);
  const lampG = grp(ns, -0.15, 0.61, -0.11); mesh(cyl(0.05, 0.07, 0.04, 16), SM(0x2a2622), 0, 0.02, 0, lampG); mesh(cyl(0.012, 0.012, 0.3, 8), SM(0xb8a070, { metalness: 0.7 }), 0, 0.18, 0, lampG);
  const shadeM = new THREE.MeshStandardMaterial({ color: 0xf0e0c0, emissive: 0xffb860, emissiveIntensity: 0, roughness: 0.9, side: THREE.DoubleSide });
  mesh(cyl(0.08, 0.13, 0.17, 20, 1, true), shadeM, 0, 0.36, 0, lampG);
  const lampL = new THREE.PointLight(0xffb060, 0, 5, 2); lampL.position.set(0, 0.33, 0); lampG.add(lampL);
  const lampGl = glowSprite(0xffc070, 0.7, 0); lampGl.position.set(0, 0.36, 0); lampG.add(lampGl);
  const alarmTex = canvasTex(128, 64, (c, w, h) => { c.fillStyle = "#0a0606"; c.fillRect(0, 0, w, h); c.fillStyle = "#ff3a2a"; c.font = "700 40px 'Space Mono', monospace"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("23:00", w / 2, h / 2 + 2); }, { redraw: true });
  const alarm = grp(ns, -0.12, 0.61, 0.08); alarm.rotation.y = 0.5; mesh(box(0.14, 0.07, 0.06), SM(0x1a1a1e, { roughness: 0.4 }), 0, 0.035, 0, alarm);
  const alD = mesh(new THREE.PlaneGeometry(0.12, 0.055), new THREE.MeshBasicMaterial({ map: alarmTex }), 0, 0.037, 0.031, alarm); alD.castShadow = false;
  const G0 = V3(-0.47, 0.61, -1.6);
  const copo = grp(g, G0.x, G0.y, G0.z);
  mesh(cyl(0.036, 0.031, 0.13, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }), 0, 0.065, 0, copo);
  const leite = mesh(cyl(0.033, 0.029, 0.1, 20), SM(0xfbf8f0, { roughness: 0.4 }), 0, 0.052, 0, copo);
  const vap = steam(g, { origin: [G0.x, G0.y + 0.14, G0.z], n: 14, size: 0.05, rise: 0.06, grow: 1.4, opacity: 0.32, life: 2.6, spread: 0.03, wind: [0.005, 0, 0.004], color: 0xffffff });
  const tapete = mesh(new THREE.CircleGeometry(1.1, 40), SM(0x6a3a3a, { roughness: 1 }), 0.4, 0.004, 0.2, g); tapete.rotation.x = -Math.PI / 2; tapete.scale.set(1, 0.75, 1);
  [-0.12, 0.12].forEach((dz, i) => { const sl = mesh(cap(0.045, 0.16, 4, 8), SM(0x8a8a9a, { roughness: 0.9 }), -0.55, 0.03, -1.02 + dz, g); sl.rotation.set(Math.PI / 2, 0, Math.PI / 2 + i * 0.2); sl.scale.set(1, 1, 0.4); });
  const wardrobe = mesh(box(0.62, 2.1, 1.3), SM(0x6a4a30, { roughness: 0.6 }), RX - 0.31, 1.05, 1.5, g);
  mesh(box(0.02, 1.9, 0.02), SM(0xb8a070, { metalness: 0.7 }), RX - 0.63, 1.05, 1.5, g);
  const cab = grp(g, 1.75, 0, -1.55); mesh(cyl(0.02, 0.025, 1.75, 8), SM(0x4a2e1e), 0, 0.875, 0, cab); mesh(cyl(0.18, 0.2, 0.03, 16), SM(0x4a2e1e), 0, 0.015, 0, cab);
  const quadro = grp(g, -RX + 0.005, 1.55, -0.6); quadro.rotation.y = Math.PI / 2; mesh(box(0.9, 0.62, 0.04), SM(0x2a2018, { roughness: 0.5 }), 0, 0, 0, quadro);
  const qTex = canvasTex(256, 176, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#9ab8d0"); gr.addColorStop(0.55, "#e8d8b8"); gr.addColorStop(0.56, "#4a6a5a"); gr.addColorStop(1, "#2a4a3a"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#f4f4f4"; c.beginPath(); c.moveTo(60, 98); c.lineTo(128, 30); c.lineTo(196, 98); c.fill(); c.fillStyle = "#6a7a8a"; c.beginPath(); c.moveTo(100, 98); c.lineTo(128, 58); c.lineTo(156, 98); c.fill(); });
  mesh(new THREE.PlaneGeometry(0.8, 0.52), SM(0xffffff, { map: qTex, roughness: 0.7 }), 0, 0, 0.022, quadro);
  const clock = relogioParede(g, 1.65, 1.85, RZ0 + 0.005);
  // luz do teto e a porta (abre para dentro, com antecipação)
  const tetoM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f6ff, emissiveIntensity: 1.2 });
  mesh(cyl(0.3, 0.3, 0.05, 32), tetoM, 0, RH - 0.03, 0.2, g);
  const tetoL = new THREE.PointLight(0xf2f2ff, 4.5, 9, 1.4); tetoL.position.set(0, RH - 0.25, 0.2); g.add(tetoL);
  const door = grp(g, RX + 0.02, 0, 0.3); mesh(box(0.05, 2.02, 0.9), SM(0x7a5a3c, { roughness: 0.6 }), 0, 1.01, -0.45, door); mesh(sph(0.03, 8, 6), SM(0xb8a070, { metalness: 0.8 }), -0.05, 1.0, -0.82, door);
  const hall = new THREE.PointLight(0xffe0b0, 1.6, 4, 1.5); hall.position.set(RX + 1.2, 1.9, -0.15); g.add(hall);
  mesh(box(0.1, 2.6, 3), SM(0x8a7a64), RX + 2.3, 1.3, -0.15, g); mesh(box(2.3, 0.1, 3), floorM, RX + 1.15, -0.05, -0.15, g);
  // o homem (paletó com cor própria nesta cena: dá para "tirar" o paletó trocando a cor por branco)
  const JK = 0x2c3243, p = semRosto({ jacket: JK }); g.add(p); const u = p.userData, jackM = TM(JK, { side: THREE.DoubleSide });
  const caseH = pasta(u.wr[0]); caseH.position.set(0, -0.11, 0.02);
  const caseF = grp(g, 1.3, 0, -0.5); const cf = pasta(caseF); cf.position.set(0, 0.43, 0); caseF.rotation.y = -Math.PI / 2; caseF.visible = false;
  const X0 = 2.9, Z0 = -0.15, D = 1.5, L = gaitFit(D, 0.6), tIn = a + 0.02, tStop = tIn + 1.9;
  const distF = (t) => andarAte(t, tIn, tStop, D, 1.0);
  const tBend = tStop + 0.05, tRel = tBend + 0.75, tUp = tRel + 0.55, tTie = tUp + 0.1;
  const chestPos = (tt) => { const d = distF(tt), ph = (d / (2 * L)) * Math.PI * 2, bend = Math.sin(Math.PI * smr(tt, tBend, tUp)); return [X0 - d - bend * 0.12, 1.32 + Math.cos(2 * ph) * 0.016 - bend * 0.35, Z0 + Math.sin(ph) * 0.02]; };
  const tSit = K.cama, tDark = K.oito1 - 0.12;
  const SEAT = [-0.8, -1.22];
  const mouth = (t) => { u.head.updateMatrixWorld(true); return u.head.localToWorld(V3(0, 0.05, 0.13)); };
  let dark = 0;
  return {
    bg: 0x0a0a10, fog: [10, 40], fogCol: 0x0a0a10,
    look: { exposure: 1.1, bloom: 0.5, bloomT: 0.9, vig: 0.42, sat: 1.04, con: 1.05, lift: [0.006, 0.006, 0.012] },
    sun: { dir: [0.3, 0.62, -0.72], col: 0x9ab4ff, I: 0.3, c: [-0.8, 0.6, -0.9], r: 4 }, hemi: { sky: 0xd8d4e0, ground: 0x4a3a2a, I: 0.45 }, fill: { col: 0xffe0c0, I: 0.0 }, rim: { col: 0xfff0e0, str: 0.45 }, hand: 0.006,
    update(t) {
      const night = smr(t, tSit - 0.05, tSit + 0.5), off = smr(t, tDark, tDark + 0.12);
      dark = off * (1 - smr(t, tDark + 0.18, tDark + 0.6));
      // luzes: teto (até as 23h) → abajur (até apagar) → só a lua
      tetoL.intensity = 4.5 * (1 - night); tetoM.emissiveIntensity = 1.2 * (1 - night);
      lampL.intensity = 0.32 * night * (1 - off); shadeM.emissiveIntensity = 0.9 * night * (1 - off); lampGl.material.opacity = 0.5 * night * (1 - off);
      hemi.intensity = lerp(0.45, 0.12, night) * (1 - off * 0.55); sun.intensity = lerp(0.3, 0.45, night) + off * 0.75;
      clock.set(20 + (t - a) / 60 + 3 * smr(t, tSit - 0.05, tSit + 0.55));
      curtains.forEach((m, i) => { const P_ = m.geometry.attributes.position, B_ = m.geometry.userData.base; for (let k = 0; k < P_.count; k++) { const x = B_[k * 3], y = B_[k * 3 + 1]; P_.setZ(k, Math.sin(x * 26 + i) * 0.03 + Math.sin(t * 0.8 + x * 4 + i) * 0.015 * (0.75 - y / 1.5)); } P_.needsUpdate = true; m.geometry.computeVertexNormals(); });
      door.rotation.y = 1.45 * act(t, a - 0.45, a + 0.35, 0.06, 0.05);
      vap.upd(t, 0.9);
      restPose(p);
      caseH.visible = t < tRel; caseF.visible = t >= tRel;
      if (t < tSit) {
        // 1) entra, para com os dois pés no chão, põe a pasta no chão e afrouxa a gravata
        jackM.color.set(JK);
        const d = distF(t);
        gait(p, d, { from: [X0, 0, Z0], ang: -Math.PI / 2, step: L, amt: 0.95 });
        const walking = clamp((tStop - t) / 0.5);
        u.sh[0].rotation.x *= 0.3; u.el[0].rotation.x = -0.1;
        idle(p, t, 3, 0.3 + 0.7 * (1 - walking));
        const bend = Math.sin(Math.PI * smr(t, tBend, tUp));
        if (bend > 0.001) {
          pose(p, { hipsPos: [0, -0.34 * bend, -0.1 * bend], spine: [0.55 * bend, 0, 0], neck: [0.25 * bend, 0, 0] }, 1);
          standFeet(p);
          armIK(p, 0, V3(1.27, 0.43 + (1 - bend) * 0.5, -0.47), V3(2.2, 1.0, -0.6), clamp(bend * 1.6));
        }
        // gravata: a mão direita vai ao nó, puxa pra baixo e solta; a cabeça inclina
        const tk = act(t, tTie, tTie + 0.55, 0.1, 0.06) * (1 - smr(t, tTie + 0.75, tTie + 1.15));
        if (tk > 0.001) {
          u.tie.updateMatrixWorld(true); const knot = u.tie.localToWorld(V3(0, -0.01 - 0.05 * clamp(tk), 0.05));
          armIK(p, 0, knot, wpos(u.chest).add(V3(0.2, -0.5, -0.6)), clamp(tk * 1.4)); curlHand(u.hands[0], 0.7 * clamp(tk));
          u.neck.rotation.z += 0.18 * tk; u.head.rotation.z += 0.1 * tk; u.tie.position.y = 0.285 - 0.03 * clamp(tk);
        }
        const Lg = molaHomem(p, t, chestPos);
        pastaPendura(caseH, p, Lg);
      } else if (t < tDark + 0.15) {
        // 2) às 23h: sem paletó, sentado na beira da cama; pega o leite com a mão esquerda, bebe e devolve
        jackM.color.set(0xeeebe4);
        p.position.set(SEAT[0], 0, SEAT[1]); p.rotation.set(0, Math.PI / 2, 0);
        idle(p, t, 5, 0.6);
        sitPose(p, 1, { seatY: 0.56, lean: -0.05 });
        plantFeet(p, [[SEAT[0] + 0.5, 0, SEAT[1] + 0.12], [SEAT[0] + 0.48, 0, SEAT[1] - 0.12]], Math.PI / 2);
        const t0 = K.leite - 0.25, grab = act(t, t0, t0 + 0.45, 0.08, 0.05), lift = act(t, t0 + 0.5, t0 + 1.0, 0.06, 0.06), back = smr(t, K.oito1 - 0.75, K.oito1 - 0.35);
        const up = clamp(lift) * (1 - back);
        const mp = mouth(t), gp = G0.clone().lerp(mp.clone().add(V3(0.0, -0.1, 0)), up);
        if (t > t0 + 0.42 && t < K.oito1 - 0.3) { copo.position.copy(gp); copo.rotation.set(0, 0, -0.9 * Math.sin(Math.PI * smr(t, t0 + 0.75, t0 + 1.35))); } else { copo.position.copy(G0); copo.rotation.set(0, 0, 0); }
        const reach = clamp(grab) * (1 - smr(t, K.oito1 - 0.33, K.oito1 - 0.1));
        if (reach > 0.001) { armIK(p, 1, copo.position.clone().add(V3(-0.05, 0.06, 0.02)), wpos(u.chest).add(V3(0.3, -0.4, -1)), reach); curlHand(u.hands[1], 0.65 * reach, 0.5 * reach); }
        u.spine.rotation.x += 0.08 * clamp(grab) * (1 - up); u.neck.rotation.x -= 0.25 * Math.sin(Math.PI * smr(t, t0 + 0.75, t0 + 1.35));
        vap.upd(t, 0.9, copo.position.clone().add(V3(0, 0.14, 0)));
        molaHomem(p, t, () => [SEAT[0], 1.2, SEAT[1]]);
      } else {
        // 3) luz apagada: deitado de barriga pra cima, coberto, respirando devagar sob a luz da lua
        jackM.color.set(0xeeebe4);
        p.position.set(-1.55, 0.67, 0.12); p.rotation.set(-Math.PI / 2, 0, 0);
        idle(p, t, 9, 0.25); u.head.rotation.y = 0.15;
        u.chest.scale.multiplyScalar(1 + Math.sin(t * 1.1) * 0.012);
        setDuvet(true);
        copo.position.copy(G0); copo.rotation.set(0, 0, 0);
        molaHomem(p, t, () => [-1.55, 0.8, -0.8]);
      }
      if (t < tDark + 0.15) setDuvet(false);
    },
    after(t) { if (dark > 0) { GU.uFade.value = Math.max(GU.uFade.value, dark * 0.96); GU.uFadeCol.value.set(0, 0, 0); } },
    cam(t) {
      return path2(t, [
        [a, [-1.1, 1.55, 2.4], [1.7, 1.15, -0.25], 40],
        [tStop - 0.3, [-0.95, 1.5, 2.55], [1.4, 1.0, -0.25], 40],
        [tTie + 0.4, [-0.2, 1.5, 1.7], [1.3, 1.3, -0.3], 37],
        [K.casa1 + 0.35, [0.85, 1.62, -0.15], [1.65, 1.85, -1.95], 34],
        [tSit + 0.6, [1.05, 1.72, -0.75], [1.65, 1.85, -1.95], 30],
        [K.leite - 0.15, [1.35, 1.32, -0.55], [-0.62, 0.98, -1.42], 40],
        [tDark, [1.15, 1.3, -0.7], [-0.68, 1.05, -1.4], 37],
        [tDark + 0.3, [-0.95, 2.3, 0.55], [-1.5, 0.62, -1.0], 40],
        [b, [-1.1, 2.6, 0.95], [-1.52, 0.56, -0.9], 38],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 3 · os potes: escrivaninha com cristaleira, potes de vidro com o ano (1983 → 1999) e o caderno com o gráfico
addSet("s3-potes", (g) => {
  const [a, b] = T.sc["s3-potes"];
  const RX = 1.6, BZ = -1.2, FZ = 2.6, RH = 2.6;
  const pp = texPapelParede("#3a3446", "#332e3e"), wallM = SM(0xffffff, { map: rep(pp.clone(), 3, 2), roughness: 0.9 }); wallM.map.needsUpdate = true;
  const pk = texPlanks([96, 66, 44], [78, 52, 34]), floorM = SM(0xffffff, { map: rep(pk.map.clone(), 2, 2), normalMap: rep(pk.normalMap.clone(), 2, 2), roughness: 0.6 }); floorM.map.needsUpdate = floorM.normalMap.needsUpdate = true;
  mesh(box(RX * 2, 0.1, FZ - BZ), floorM, 0, -0.05, (BZ + FZ) / 2, g); mesh(box(RX * 2, 0.1, FZ - BZ), SM(0x2a2630), 0, RH + 0.05, (BZ + FZ) / 2, g);
  mesh(box(RX * 2, RH, 0.1), wallM, 0, RH / 2, BZ - 0.05, g); mesh(box(0.1, RH, FZ - BZ), wallM, RX + 0.05, RH / 2, (BZ + FZ) / 2, g);
  // parede esquerda com janela de persiana (a luz fria da rua entra em listras)
  const WZ0 = -0.55, WZ1 = 0.75, WY0 = 0.9, WY1 = 2.1;
  mesh(box(0.1, RH, WZ0 - BZ), wallM, -RX - 0.05, RH / 2, (BZ + WZ0) / 2, g); mesh(box(0.1, RH, FZ - WZ1), wallM, -RX - 0.05, RH / 2, (WZ1 + FZ) / 2, g);
  mesh(box(0.1, WY0, WZ1 - WZ0), wallM, -RX - 0.05, WY0 / 2, (WZ0 + WZ1) / 2, g); mesh(box(0.1, RH - WY1, WZ1 - WZ0), wallM, -RX - 0.05, (RH + WY1) / 2, (WZ0 + WZ1) / 2, g);
  for (let i = 0; i < 16; i++) { const sl = mesh(box(0.06, 0.035, WZ1 - WZ0), SM(0xc8c4bc, { roughness: 0.6 }), -RX + 0.04, WY0 + 0.04 + i * 0.075, (WZ0 + WZ1) / 2, g); sl.rotation.z = 0.45; }
  const rua = mesh(new THREE.PlaneGeometry(3, 2.4), new THREE.MeshBasicMaterial({ color: 0x5a6a90, fog: false }), -RX - 1.4, 1.5, 0.1, g); rua.rotation.y = Math.PI / 2;
  // escrivaninha com cristaleira (madeira escura): tampo, gavetas, prateleiras, portas de vidro (a esquerda aberta)
  const wood = SM(0x3a2416, { roughness: 0.5 }), wood2 = SM(0x2c1a10, { roughness: 0.55 });
  const desk = grp(g, 0, 0, BZ);
  mesh(box(1.7, 0.76, 0.6), wood, 0, 0.38, 0.3, desk); mesh(box(1.76, 0.04, 0.64), wood2, 0, 0.78, 0.32, desk);
  [-0.55, 0, 0.55].forEach((x) => { mesh(box(0.5, 0.2, 0.02), wood2, x, 0.6, 0.61, desk); mesh(sph(0.015, 8, 6), SM(0xb8a070, { metalness: 0.8, roughness: 0.3 }), x, 0.6, 0.625, desk); });
  mesh(box(1.7, 1.32, 0.04), wood, 0, 1.6, 0.02, desk); mesh(box(0.05, 1.32, 0.36), wood, -0.83, 1.6, 0.18, desk); mesh(box(0.05, 1.32, 0.36), wood, 0.83, 1.6, 0.18, desk);
  mesh(box(1.76, 0.06, 0.4), wood2, 0, 2.29, 0.2, desk);
  const SH = [0.98, 1.28, 1.58, 1.88];
  SH.forEach((y) => mesh(box(1.62, 0.025, 0.34), wood2, 0, y - 0.0125, 0.18, desk));
  const glassM = new THREE.MeshStandardMaterial({ color: 0xc8d8e0, transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.1, envMap: envGold(), envMapIntensity: 0.5, depthWrite: false, side: THREE.DoubleSide });
  const doorL = grp(desk, -0.82, 0, 0.37); mesh(box(0.8, 1.25, 0.012), glassM, 0.4, 1.6, 0, doorL); [[0.02, 0.025, 1.25], [0.79, 0.025, 1.25]].forEach(([x, w, h]) => mesh(box(w, h, 0.02), wood2, x, 1.6, 0, doorL)); [0.98, 2.22].forEach((y) => mesh(box(0.8, 0.025, 0.02), wood2, 0.4, y, 0, doorL));
  const doorR = grp(desk, 0.82, 0, 0.37); mesh(box(0.8, 1.25, 0.012), glassM, -0.4, 1.6, 0, doorR); [[-0.02, 0.025, 1.25], [-0.79, 0.025, 1.25]].forEach(([x, w, h]) => mesh(box(w, h, 0.02), wood2, x, 1.6, 0, doorR)); [0.98, 2.22].forEach((y) => mesh(box(0.8, 0.025, 0.02), wood2, -0.4, y, 0, doorR));
  doorL.rotation.y = -1.9; doorR.rotation.y = 0.12;
  // potes de vidro com tampa e etiqueta do ano (dentro, lascas claras de unha)
  const jarGlass = new THREE.MeshStandardMaterial({ color: 0xe0eef0, transparent: true, opacity: 0.15, roughness: 0.06, metalness: 0.05, envMap: envGold(), envMapIntensity: 0.35, side: THREE.DoubleSide, depthWrite: false });
  const lidM = SM(0x8a8070, { metalness: 0.75, roughness: 0.35 }), chipG = new THREE.TorusGeometry(0.009, 0.0022, 4, 8, Math.PI), chipM = SM(0xf0e6d8, { roughness: 0.6 });
  const slots = []; SH.slice().reverse().forEach((y, si) => [-0.6, -0.3, 0, 0.3, 0.6].forEach((x, ci) => slots.push([x, y, si, ci])));
  const RES = slots.findIndex(([x, y]) => x === 0 && y === SH[1]);
  const jars = {};
  const mkJar = (year, parent) => {
    const j = grp(parent);
    mesh(cyl(0.062, 0.058, 0.17, 22, 1, true), jarGlass, 0, 0.085, 0, j); mesh(cyl(0.058, 0.058, 0.006, 22), jarGlass, 0, 0.003, 0, j);
    mesh(cyl(0.066, 0.066, 0.03, 22), lidM, 0, 0.185, 0, j);
    const lt = canvasTex(128, 64, (c, w, h) => { c.fillStyle = "#efe4c8"; c.fillRect(0, 0, w, h); c.strokeStyle = "#8a6a3a"; c.lineWidth = 3; c.strokeRect(3, 3, w - 6, h - 6); c.fillStyle = "#2a1a10"; c.font = "700 34px 'Space Mono', monospace"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(year), w / 2, h / 2 + 2); }, { redraw: true });
    const lab = mesh(new THREE.CylinderGeometry(0.0635, 0.0635, 0.06, 22, 1, true, -0.9, 1.8), SM(0xffffff, { map: lt, roughness: 0.8 }), 0, 0.09, 0, j); lab.castShadow = false;
    const n = 6 + Math.floor(hash(year) * 14) + ([1986, 1988, 1991, 1994, 1997].includes(year) ? 26 : 0);
    const chips = new THREE.InstancedMesh(chipG, chipM, n); const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) { const r = Math.sqrt(hash(i + year)) * 0.045, an = hash(i * 3 + year) * 6.28; M4.compose(V3(Math.cos(an) * r, 0.01 + hash(i * 7 + year) * 0.02 * (1 + n / 20), Math.sin(an) * r), Q.setFromEuler(new THREE.Euler(hash(i) * 3, hash(i * 2) * 6, hash(i * 5) * 3)), V3(1, 1, 1)); chips.setMatrixAt(i, M4); }
    j.add(chips);
    return j;
  };
  let k = 0;
  for (let year = 1983; year <= 1998; year++) { if (k === RES) k++; const [x, y] = slots[k++]; const j = mkJar(year, desk); j.position.set(x, y, 0.2); j.rotation.y = (hash(year) - 0.5) * 0.3; jars[year] = j; }
  const novo = mkJar(1999, g), SLOT = V3(0, SH[1], BZ + 0.2);
  // caderno aberto com o gráfico do crescimento das unhas (a linha é desenhada pela caneta)
  const nbC = document.createElement("canvas"); nbC.width = 768; nbC.height = 512; const nbG = nbC.getContext("2d"); const nbT = new THREE.CanvasTexture(nbC); nbT.colorSpace = THREE.SRGBColorSpace; nbT.anisotropy = 8;
  const DATA = [8, 7.5, 9, 31, 8, 30.5, 7, 9, 33, 8.5, 7.5, 32, 9, 8, 34, 8.2, 8.8];
  const gx = (i) => 150 + i * 34, gy = (v) => 440 - v * 10.5;
  let nbP = -1;
  const drawNB = (p) => {
    const c = nbG, w = 768, h = 512; c.fillStyle = "#f2ead8"; c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(90,140,200,.35)"; c.lineWidth = 1; for (let y = 20; y < h; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.fillStyle = "rgba(0,0,0,.12)"; c.fillRect(w / 2 - 4, 0, 8, h);
    c.strokeStyle = "#2a2a3a"; c.lineWidth = 3; c.beginPath(); c.moveTo(gx(0) - 20, 60); c.lineTo(gx(0) - 20, 445); c.lineTo(gx(16) + 20, 445); c.stroke();
    c.fillStyle = "#2a2a3a"; c.font = "700 16px 'Space Mono', monospace"; c.textAlign = "center"; for (let i = 0; i < 17; i += 2) c.fillText("'" + String(83 + i).slice(-2), gx(i), 470);
    c.textAlign = "right"; [10, 20, 30].forEach((v) => { c.fillText(v + " cm", gx(0) - 26, gy(v) + 5); });
    c.setLineDash([8, 6]); c.strokeStyle = "rgba(200,30,40,.7)"; c.lineWidth = 2; c.beginPath(); c.moveTo(gx(0) - 20, gy(30)); c.lineTo(gx(16) + 10, gy(30)); c.stroke(); c.setLineDash([]);
    const n = p * 16, full = Math.floor(n);
    c.lineWidth = 4; c.lineJoin = "round"; c.lineCap = "round";
    for (let i = 0; i < Math.min(16, Math.ceil(n)); i++) { const f = i < full ? 1 : n - full, x0 = gx(i), y0 = gy(DATA[i]), x1 = lerp(x0, gx(i + 1), f), y1 = lerp(y0, gy(DATA[i + 1]), f); c.strokeStyle = DATA[i + 1] > 25 || DATA[i] > 25 ? "#c81e2a" : "#1a2a5a"; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
    for (let i = 0; i <= Math.min(16, full); i++) { c.fillStyle = DATA[i] > 25 ? "#c81e2a" : "#1a2a5a"; c.beginPath(); c.arc(gx(i), gy(DATA[i]), 6, 0, 7); c.fill(); }
    if (p > 0.93) { c.fillStyle = "#c81e2a"; c.font = "700 30px 'Archivo Black', sans-serif"; c.textAlign = "left"; c.save(); c.translate(gx(11) - 40, gy(36)); c.rotate(-0.08); c.fillText("+30 cm!! PERFEITO", 0, 0); c.restore(); }
    nbT.needsUpdate = true;
  };
  const NB = V3(0.3, 0.802, BZ + 0.42);
  const nb = grp(g, NB.x, NB.y, NB.z); nb.rotation.y = -0.12;
  const page = mesh(new THREE.PlaneGeometry(0.48, 0.32), SM(0xffffff, { map: nbT, roughness: 0.85 }), 0, 0.004, 0, nb); page.rotation.x = -Math.PI / 2; page.castShadow = false;
  mesh(box(0.5, 0.012, 0.34), SM(0x5a2a2a, { roughness: 0.7 }), 0, -0.004, 0, nb);
  const toW = (px, py) => nb.localToWorld(V3((px / 768 - 0.5) * 0.48, 0.006, (py / 512 - 0.5) * 0.32));
  // abajur de mesa (luz quente que fica vermelha no fim), livros, calendário, cadeira
  const lamp = grp(g, -0.58, 0.8, BZ + 0.42); mesh(cyl(0.07, 0.08, 0.03, 16), SM(0xb8a070, { metalness: 0.8, roughness: 0.3 }), 0, 0.015, 0, lamp); mesh(cyl(0.01, 0.01, 0.32, 8), SM(0xb8a070, { metalness: 0.8 }), 0, 0.17, 0, lamp);
  const shade = mesh(new THREE.CylinderGeometry(0.06, 0.14, 0.1, 18, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a4a2a, emissive: 0xffb050, emissiveIntensity: 0.1, roughness: 0.4, side: THREE.DoubleSide }), 0.06, 0.35, 0.04, lamp); shade.rotation.z = -0.5;
  const lampL = new THREE.PointLight(0xffb060, 1.2, 4.5, 1.6); lampL.position.set(0.1, 0.28, 0.06); lamp.add(lampL);
  const lampGl = glowSprite(0xffc070, 0.5, 0.45); lampGl.position.set(0.1, 0.3, 0.06); lamp.add(lampGl);
  [[-0.3, 0.07, 0x6a2a2a], [-0.24, 0.06, 0x2a3a5a], [-0.19, 0.05, 0x3a4a2a]].forEach(([x, w, c]) => { const bk = mesh(box(w, 0.28, 0.2), SM(c, { roughness: 0.7 }), x, 0.94, BZ + 0.15, g); bk.rotation.z = 0.04; });
  const cal = canvasTex(256, 320, (c, w, h) => { c.fillStyle = "#f4f0e6"; c.fillRect(0, 0, w, h); c.fillStyle = "#c81e2a"; c.fillRect(0, 0, w, 70); c.fillStyle = "#fff"; c.font = "700 44px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.fillText("1999", w / 2, 52); c.fillStyle = "#2a2a3a"; c.font = "700 20px 'Space Mono', monospace"; for (let i = 0; i < 30; i++) c.fillText(String(i + 1), 26 + (i % 7) * 34, 110 + Math.floor(i / 7) * 42); }, { redraw: true });
  mesh(new THREE.PlaneGeometry(0.34, 0.42), SM(0xffffff, { map: cal, roughness: 0.8 }), 1.15, 1.6, BZ + 0.006, g);
  const chair = grp(g, 0.95, 0, -0.1); chair.rotation.y = -0.6; mesh(box(0.46, 0.05, 0.44), wood, 0, 0.46, 0, chair); mesh(box(0.46, 0.5, 0.04), wood, 0, 0.72, -0.2, chair); [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].forEach(([x, z]) => mesh(box(0.04, 0.46, 0.04), wood2, x, 0.23, z, chair));
  const motes = dustPts(160, [-1.4, 0.4, 0.8, 2.2, -0.6, 0.8], 0xcfe0ff, 0.012, 0.7); g.add(motes);
  const redL = new THREE.PointLight(0xff1a1a, 0, 6, 1.4); redL.position.set(0.9, 1.9, 0.9); g.add(redL);
  // luz de vitrine dentro da cristaleira (os potes brilham como peças de museu)
  const vit = [[2.1, 0.9], [1.45, 0.5]].map(([y, I]) => { const L_ = new THREE.PointLight(0xffd8a0, I, 1.8, 1.6); L_.position.set(0, y, BZ + 0.3); g.add(L_); return L_; });
  // o homem: em pé diante da cristaleira, com o pote de 1999 na mão; guarda o pote e depois escreve no caderno
  const p = semRosto(); g.add(p); const u = p.userData; p.position.set(-0.04, 0, -0.32); p.rotation.y = Math.PI;
  const pen = mesh(cyl(0.004, 0.003, 0.14, 8), SM(0x1a1a22, { metalness: 0.4, roughness: 0.3 }), 0, -0.075, 0.02, u.hands[0].h); pen.rotation.x = 0.35; pen.visible = false;
  const tA = K.guardava - 0.05, tW0 = K.quando2 - 0.45, tW1 = K.bom + 0.1;
  const S0 = V3(0.19, 0.86, -0.36);
  const jarAt = (t) => { const kk = clamp(act(t, tA, tA + 0.95, 0.08, 0.04)); return S0.clone().lerp(SLOT, kk).add(V3(0, 0.16 * Math.sin(Math.PI * clamp(kk)), 0)); };
  return {
    bg: 0x0c0a12, fog: [8, 30], fogCol: 0x0c0a12,
    look: { exposure: 1.2, bloom: 0.6, bloomT: 0.8, vig: 0.52, sat: 1.02, con: 1.08, lift: [0.01, 0.008, 0.02] },
    sun: { dir: [-1, 0.42, 0.18], col: 0x8aaaf0, I: 1.5, c: [-0.2, 1.1, -0.7], r: 2.6 }, hemi: { sky: 0x4a4466, ground: 0x1a1410, I: 0.32 }, fill: { col: 0xffd0a0, I: 0.0 }, rim: { col: 0xffe0c0, str: 0.4 }, hand: 0.005,
    update(t) {
      const red = smr(t, K.bom - 0.35, K.bom + 0.25);
      lampL.color.setHex(0xffb060).lerp(_col.setHex(0xff2020), red); lampL.intensity = 1.2 + red * 0.8 + noise1(t * 5) * 0.04; lampGl.material.color.setHex(0xffc070).lerp(_col.setHex(0xff3030), red);
      redL.intensity = 1.4 * red; vit.forEach((L_, i) => (L_.intensity = (i ? 0.5 : 0.9) * (1 - red * 0.6))); sun.color.setHex(0x8aaaf0).lerp(_col.setHex(0xff5060), red * 0.7);
      floatDust(motes, t, 0.15, 0.2);
      const pr = Math.round(smr(t, tW0 + 0.35, tW1 - 0.15) * 160) / 160; if (pr !== nbP) { nbP = pr; drawNB(pr); }
      restPose(p); idle(p, t, 4, 0.7);
      p.position.set(-0.04, 0, -0.32); p.rotation.set(0, Math.PI, 0);
      const writeK = smr(t, tW0, tW0 + 0.6);
      const lean = 0.18 * Math.sin(Math.PI * clamp(act(t, tA, tA + 1.0, 0.1, 0.05))) + 0.42 * writeK;
      pose(p, { spine: [lean * 0.7, -0.12 * writeK, 0], chest: [lean * 0.3, -0.1 * writeK, 0], neck: [0.2 * writeK, 0, 0] }, 1);
      standFeet(p);
      // pote: na mão até guardar; depois fica na prateleira
      const placed = t > tA + 0.95;
      novo.position.copy(placed ? SLOT : jarAt(t)); novo.rotation.set(0, 0.2, 0);
      const holdK = 1 - smr(t, tA + 0.95, tA + 1.45);
      if (holdK > 0.001) { armIK(p, 0, novo.position.clone().add(V3(0.05, 0.12, 0.06)), wpos(u.chest).add(V3(1, -0.6, 0.6)), holdK); curlHand(u.hands[0], 0.8 * holdK); }
      // escreve: a ponta da caneta segue a ponta da linha do gráfico
      pen.visible = t > tW0 - 0.2;
      if (writeK > 0.001) {
        const n = nbP * 16, i0 = Math.min(15, Math.floor(n)), f = n - i0, px = lerp(gx(i0), gx(i0 + 1), f), py = lerp(gy(DATA[i0]), gy(DATA[i0 + 1]), f);
        const tip = toW(px, py), wob = Math.sin(t * 24) * 0.003;
        armIK(p, 0, tip.add(V3(0.03 + wob, 0.11, 0.05)), wpos(u.chest).add(V3(1.2, 0.2, 0.4)), writeK); curlHand(u.hands[0], 0.75 * writeK, 0.6);
        armIK(p, 1, NB.clone().add(V3(-0.28, 0.06, 0.05)), wpos(u.chest).add(V3(-1, 0, 0.6)), writeK * 0.9);
      }
      molaHomem(p, t, () => [-0.04, 1.3, -0.32]);
    },
    cam(t) {
      return path2(t, [
        [a, [-0.44, 1.96, -0.26], [-0.6, 1.92, -1.0], 34],
        [K.ano83 + 0.9, [-0.05, 1.86, -0.22], [-0.32, 1.72, -1.0], 33],
        [K.assassino2 + 0.25, [0.95, 1.62, 1.45], [0.0, 1.42, -0.9], 38],
        [K.potes, [0.78, 1.52, 0.6], [-0.05, 1.32, -0.95], 36],
        [K.cresciam, [0.98, 1.42, -0.42], [0.3, 0.82, -0.8], 36],
        [K.bom, [0.82, 1.33, -0.55], [0.32, 0.8, -0.82], 34],
        [b, [0.77, 1.28, -0.6], [0.33, 0.8, -0.82], 32],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 4 · culpa? Banheiro: no espelho embaçado aparece "CULPA?"; no "não" o vapor some e o reflexo mostra o rosto liso; ele lava as mãos, calmo
// copia a pose (posições/rotações locais de todos os nós) de um personagem para outro idêntico (o reflexo)
function copyPose(src, dst) { const A = [], B = []; src.traverse((o) => A.push(o)); dst.traverse((o) => B.push(o)); for (let i = 0; i < Math.min(A.length, B.length); i++) { B[i].position.copy(A[i].position); B[i].quaternion.copy(A[i].quaternion); B[i].scale.copy(A[i].scale); B[i].visible = A[i].visible; } }
addSet("s4-culpa", (g) => {
  const [a, b] = T.sc["s4-culpa"];
  const MZ = -1.0, RX = 1.2, FZ = 2.4, RH = 2.5, MX0 = -0.42, MX1 = 0.42, MY0 = 1.12, MY1 = 2.0;
  const az = texAzulejo("#e6ecea", "#9aa6a2", 10), az2 = texAzulejo("#a8c4b8", "#6a827a", 10);
  const tileM = (s) => { const m = SM(0xffffff, { map: rep(az.map.clone(), s[0], s[1]), normalMap: rep(az.normalMap.clone(), s[0], s[1]), roughness: 0.35 }); m.map.needsUpdate = m.normalMap.needsUpdate = true; return m; };
  const tileG = (s) => { const m = SM(0xffffff, { map: rep(az2.map.clone(), s[0], s[1]), normalMap: rep(az2.normalMap.clone(), s[0], s[1]), roughness: 0.35 }); m.map.needsUpdate = m.normalMap.needsUpdate = true; return m; };
  // o banheiro (montado duas vezes: o real e o refletido atrás do espelho)
  const room = (P, mirror) => {
    mesh(box(RX * 2, 0.1, FZ - MZ), tileG([4, 6]), 0, -0.05, (MZ + FZ) / 2, P); mesh(box(RX * 2, 0.1, FZ - MZ), SM(0xe0e4e0, { roughness: 0.9 }), 0, RH + 0.05, (MZ + FZ) / 2, P);
    [-1, 1].forEach((k) => { mesh(box(0.1, 1.2, FZ - MZ), tileG([6, 2]), k * (RX + 0.05), 0.6, (MZ + FZ) / 2, P); mesh(box(0.1, RH - 1.2, FZ - MZ), tileM([6, 2]), k * (RX + 0.05), 1.2 + (RH - 1.2) / 2, (MZ + FZ) / 2, P); });
    if (!mirror) {
      // parede do espelho com o vão (o "vidro" mostra o banheiro refletido)
      mesh(box(MX0 + RX, RH, 0.1), tileM([2, 4]), (-RX + MX0) / 2, RH / 2, MZ - 0.05, P); mesh(box(RX - MX1, RH, 0.1), tileM([2, 4]), (MX1 + RX) / 2, RH / 2, MZ - 0.05, P);
      mesh(box(MX1 - MX0, MY0, 0.1), tileG([1.4, 1]), 0, MY0 / 2, MZ - 0.05, P); mesh(box(MX1 - MX0, RH - MY1, 0.1), tileM([1.4, 1]), 0, (RH + MY1) / 2, MZ - 0.05, P);
      [[MX0 - 0.02, (MY0 + MY1) / 2, 0.04, MY1 - MY0 + 0.08], [MX1 + 0.02, (MY0 + MY1) / 2, 0.04, MY1 - MY0 + 0.08], [0, MY0 - 0.02, MX1 - MX0 + 0.08, 0.04], [0, MY1 + 0.02, MX1 - MX0 + 0.08, 0.04]].forEach(([x, y, w, h]) => mesh(box(w, h, 0.03), SM(0xb8bcc0, { metalness: 0.8, roughness: 0.25 }), x, y, MZ + 0.01, P));
    } else {
      mesh(box(RX * 2, RH, 0.1), tileM([3, 4]), 0, RH / 2, FZ + 0.05, P); // a parede de trás (só aparece no reflexo)
      mesh(box(0.8, 2.05, 0.06), SM(0x6a7a7a, { roughness: 0.6 }), -0.6, 1.02, FZ - 0.02, P);
    }
    // pia, torneira, prateleira com copo e escovas, toalha, luminária
    const pia = grp(P, 0, 0, MZ + 0.24);
    mesh(cyl(0.1, 0.14, 0.78, 16), SM(0xf2f2ee, { roughness: 0.25 }), 0, 0.39, -0.02, pia);
    mesh(lathe([[0.02, 0.0], [0.2, 0.04], [0.27, 0.13], [0.28, 0.16], [0.24, 0.16], [0.17, 0.06], [0.02, 0.04]], 28), SM(0xf6f6f2, { roughness: 0.2, side: THREE.DoubleSide }), 0, 0.72, 0, pia);
    const tq = grp(pia, 0, 0.88, -0.2); mesh(cyl(0.018, 0.022, 0.1, 12), SM(0xd0d4d8, { metalness: 0.9, roughness: 0.15 }), 0, 0, 0, tq); const bico = mesh(cyl(0.012, 0.012, 0.14, 10), SM(0xd0d4d8, { metalness: 0.9, roughness: 0.15 }), 0, 0.045, 0.065, tq); bico.rotation.x = Math.PI / 2.3;
    [-1, 1].forEach((k) => mesh(cyl(0.022, 0.022, 0.03, 10), SM(0xd0d4d8, { metalness: 0.9, roughness: 0.15 }), k * 0.09, 0.03, 0, tq));
    mesh(box(0.72, 0.025, 0.12), SM(0xf2f2ee, { roughness: 0.3 }), 0, MY0 - 0.1, MZ + 0.07, P);
    const cup = mesh(cyl(0.03, 0.026, 0.09, 12), SM(0x6aa8c8, { roughness: 0.3 }), 0.24, MY0 - 0.04, MZ + 0.07, P);
    [0, 1].forEach((i) => { const br = mesh(cyl(0.006, 0.006, 0.17, 6), SM(i ? 0xe84a4a : 0x4a8ae8), 0.235 + i * 0.012, MY0 + 0.03, MZ + 0.07, P); br.rotation.z = (i - 0.5) * 0.3; });
    mesh(new THREE.TorusGeometry(0.1, 0.008, 6, 20), SM(0xd0d4d8, { metalness: 0.9, roughness: 0.15 }), 0.85, 1.3, MZ + 0.02, P);
    const toalha = mesh(box(0.24, 0.5, 0.03), SM(0xc84a4a, { roughness: 0.95 }), 0.85, 1.05, MZ + 0.04, P);
    const luz = grp(P, 0, MY1 + 0.17, MZ + 0.08); mesh(box(0.5, 0.05, 0.08), SM(0xb8bcc0, { metalness: 0.7, roughness: 0.3 }), 0, 0, 0, luz);
    const bulbM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd8a0, emissiveIntensity: 2.2 }); mesh(sph(0.045, 12, 10), bulbM, 0, -0.06, 0.03, luz);
    const L_ = new THREE.PointLight(0xffd8a8, 1.0, 5, 1.6); L_.position.set(0, -0.1, 0.12); luz.add(L_); const gl_ = glowSprite(0xffe0b0, 0.5, 0.5); gl_.position.set(0, -0.06, 0.05); luz.add(gl_);
    return { L: L_, bulbM, gl: gl_ };
  };
  const R1 = room(g, false);
  const mir = grp(g, 0, 0, 2 * MZ); mir.scale.z = -1;
  const R2 = room(mir, true);
  // vidro e vapor no espelho: "CULPA?" escrito com o dedo, letra por letra, com gotas escorrendo
  const glassP = mesh(new THREE.PlaneGeometry(MX1 - MX0, MY1 - MY0), new THREE.MeshStandardMaterial({ color: 0xa0b8c0, transparent: true, opacity: 0.08, roughness: 0.02, metalness: 0.4, depthWrite: false }), 0, (MY0 + MY1) / 2, MZ + 0.002, g); glassP.castShadow = false;
  const fC = document.createElement("canvas"); fC.width = 420; fC.height = 440; const fG = fC.getContext("2d"); const fT = new THREE.CanvasTexture(fC); fT.colorSpace = THREE.SRGBColorSpace;
  const fogP = mesh(new THREE.PlaneGeometry(MX1 - MX0, MY1 - MY0), new THREE.MeshBasicMaterial({ map: fT, transparent: true, depthWrite: false, fog: false }), 0, (MY0 + MY1) / 2, MZ + 0.006, g); fogP.castShadow = false; fogP.renderOrder = 4;
  const noiseC = document.createElement("canvas"); noiseC.width = 420; noiseC.height = 440; { const ng = noiseC.getContext("2d"), im = ng.createImageData(420, 440); for (let y = 0; y < 440; y++) for (let x = 0; x < 420; x++) { const i = (y * 420 + x) * 4, v = fbm2(x / 40, y / 40, 4); im.data[i] = 196; im.data[i + 1] = 204; im.data[i + 2] = 208; im.data[i + 3] = (0.42 + v * 0.3 + (hash2(x, y) - 0.5) * 0.08) * 255; } ng.putImageData(im, 0, 0); }
  let fKey = "";
  const drawFog = (wp, dp) => {
    const key = Math.round(wp * 60) + "_" + Math.round(dp * 40); if (key === fKey) return; fKey = key;
    const c = fG; c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, 420, 440); c.drawImage(noiseC, 0, 0);
    c.globalCompositeOperation = "destination-out"; c.font = "900 70px 'Archivo Black', sans-serif"; c.textAlign = "left"; c.textBaseline = "middle";
    const txt = "CULPA?", w = c.measureText(txt).width, x0 = (420 - w) / 2;
    c.save(); c.beginPath(); c.rect(0, 0, x0 + w * wp, 440); c.clip(); c.fillStyle = "rgba(0,0,0,.92)"; c.fillText(txt, x0, 78); c.restore();
    for (let i = 0; i < 9; i++) { const dx = x0 + 18 + i * (w - 30) / 8 + hash(i) * 10, len = dp * (40 + hash(i * 3) * 150) * (dx < x0 + w * wp ? 1 : 0); if (len < 2) continue; c.fillStyle = "rgba(0,0,0,.8)"; c.beginPath(); c.roundRect(dx, 108, 5 + hash(i * 5) * 3, len, 3); c.fill(); c.beginPath(); c.arc(dx + 3.5, 108 + len, 5, 0, 7); c.fill(); }
    fT.needsUpdate = true;
  };
  const agua = mesh(cyl(0.006, 0.009, 0.2, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.55, roughness: 0.05, emissive: 0x405060, emissiveIntensity: 0.3 }), 0, 0.82, MZ + 0.11, g);
  const gota = mesh(sph(0.007, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe0f4ff, transparent: true, opacity: 0.8, roughness: 0.05 }), 0, 0.9, MZ + 0.11, g);
  const vapor = dustPts(90, [-1.0, 1.0, 0.6, 2.3, MZ + 0.1, MZ + 1.8], 0xffffff, 0.08, 0.12, NORM, 4); g.add(vapor);
  // o homem e o reflexo (mesma pose copiada para o boneco espelhado)
  const p = semRosto(), q = semRosto(); g.add(p); mir.add(q); const u = p.userData;
  const PZ = MZ + 0.58, tWash0 = K.kira3 - 0.1, tWash1 = K.culpa3b + 0.35;
  return {
    bg: 0x0a0c0c, fog: [8, 30], fogCol: 0x0a0c0c,
    look: { exposure: 0.98, bloom: 0.45, bloomT: 0.9, vig: 0.52, sat: 0.92, con: 1.08, lift: [0.0, 0.012, 0.01], gain: [0.98, 1.02, 1.0] },
    sun: { dir: [0.2, 1, 0.4], col: 0xc8d8d0, I: 0.2, c: [0, 1, MZ + 0.5], r: 3 }, hemi: { sky: 0xd0dcd8, ground: 0x4a5450, I: 0.28 }, fill: { col: 0xc8e0d8, I: 0.15 }, rim: { col: 0xffe8d0, str: 0.4 }, hand: 0.005,
    update(t) {
      const fl = 1 - 0.08 * Math.max(0, noise1(t * 7)); [R1, R2].forEach((R) => { R.L.intensity = 1.0 * fl; R.bulbM.emissiveIntensity = 1.4 * fl; });
      const wp = smr(t, K.culpa3 - 0.85, K.culpa3 + 0.35), dp = smr(t, K.culpa3 + 0.1, K.nao3 + 0.6);
      drawFog(wp, dp);
      fogP.material.opacity = 1 - 0.88 * smr(t, K.nao3 - 0.05, K.nao3 + 0.75);
      vapor.material.opacity = 0.12 * (1 - 0.6 * smr(t, K.nao3, K.nao3 + 1));
      floatDust(vapor, t, 0.25, 0.15);
      // torneira: gota caindo; depois água correndo enquanto ele lava as mãos
      const run = smr(t, tWash0 - 0.15, tWash0 + 0.1) * (1 - smr(t, tWash1 - 0.2, tWash1));
      agua.visible = run > 0.02; agua.scale.set(1, run, 1); agua.position.y = 0.92 - 0.1 * run;
      const dph = ((t - a) % 1.3) / 1.3; gota.visible = run < 0.02; gota.position.y = 0.92 - dph * dph * 0.2; gota.scale.setScalar(dph < 0.08 ? dph / 0.08 : 1);
      restPose(p); idle(p, t, 2, 0.5);
      p.position.set(-0.1, 0, PZ); p.rotation.set(0, Math.PI, 0);
      // apoiado na pia, cabeça baixa; no "não" ergue a cabeça e encara o espelho; depois lava as mãos devagar
      const upK = act(t, K.nao3 - 0.15, K.nao3 + 0.45, 0.12, 0.06), wash = smr(t, tWash0 - 0.1, tWash0 + 0.35) * (1 - smr(t, tWash1 - 0.3, tWash1 + 0.1));
      pose(p, { spine: [0.32 - 0.12 * clamp(upK), 0, 0], neck: [0.32 - 0.36 * clamp(upK), 0, 0], head: [0.1 - 0.12 * clamp(upK), 0, 0] }, 1);
      standFeet(p);
      const lean = 1 - wash, rub = Math.sin((t - tWash0) * 9) * 0.025 * wash;
      [0, 1].forEach((i) => {
        const s_ = i ? 1 : -1, edge = V3(-0.05 - s_ * 0.24, 0.89, MZ + 0.4), under = V3(-0.02 + s_ * (0.035 + rub), 0.86 + Math.abs(rub), MZ + 0.12 + rub * s_);
        const tgt = edge.clone().lerp(under, wash);
        armIK(p, i, tgt.add(V3(0, 0.07, 0.03)), V3(-0.05 + s_ * 0.9, 0.6, PZ + 0.4), 1); curlHand(u.hands[i], 0.35 + 0.2 * wash);
      });
      // ajeita a gravata olhando o reflexo
      const tie = act(t, tWash1 + 0.05, tWash1 + 0.55, 0.08, 0.05) * (1 - smr(t, b - 0.25, b));
      if (tie > 0.001) { u.tie.updateMatrixWorld(true); armIK(p, 0, u.tie.localToWorld(V3(0, -0.01, 0.06)), wpos(u.chest).add(V3(0.6, -0.5, 0.8)), clamp(tie)); curlHand(u.hands[0], 0.75 * clamp(tie)); }
      molaHomem(p, t, () => [-0.05, 1.3, PZ]);
      p.updateMatrixWorld(true); copyPose(p, q);
    },
    cam(t) {
      return path2(t, [
        [a, [0.72, 1.8, MZ + 2.05], [0.02, 1.52, MZ - 0.1], 40],
        [K.nao3, [0.6, 1.74, MZ + 1.75], [0.0, 1.52, MZ - 0.2], 37],
        [K.nunca3 + 0.3, [0.52, 1.7, MZ + 1.55], [-0.02, 1.5, MZ - 0.25], 35],
        [b, [0.48, 1.68, MZ + 1.45], [-0.02, 1.5, MZ - 0.3], 34],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 5 · sempre em 3º: palco da escola com pódio; o menino sem rosto sobe no 3º lugar; redação, corrida e violino com fita de bronze; o 1º lugar no escuro
function texCortina(c1 = "#7a1018", c2 = "#3a060c") {
  const k = "cort" + c1; if (TX[k]) return TX[k];
  return (TX[k] = canvasTex(512, 256, (c, w, h) => { for (let x = 0; x < w; x++) { const v = 0.5 + 0.5 * Math.sin((x / w) * Math.PI * 2 * 9 + Math.sin(x * 0.05) * 0.6); const gr = c.createLinearGradient(0, 0, 0, h); c.fillStyle = `rgb(${lerp(58, 140, v) | 0},${lerp(6, 22, v) | 0},${lerp(12, 30, v) | 0})`; c.fillRect(x, 0, 1, h); } }));
}
addSet("s5-terceiro", (g) => {
  const [a, b] = T.sc["s5-terceiro"];
  // palco de madeira, cortinas de veludo, faixa, tela com a foto da escola, plateia de cadeiras vazias
  const pk = texPlanks([156, 112, 70], [132, 94, 58]), stM = SM(0xffffff, { map: rep(pk.map.clone(), 4, 3), normalMap: rep(pk.normalMap.clone(), 4, 3), roughness: 0.45 }); stM.map.needsUpdate = stM.normalMap.needsUpdate = true;
  mesh(box(9, 0.8, 5), stM, 0, -0.4, -1.5, g); mesh(box(9, 0.8, 0.06), SM(0x3a2416), 0, -0.4, 1.02, g);
  mesh(box(30, 0.1, 20), SM(0x2a1e18, { roughness: 0.8 }), 0, -0.85, 9, g);
  const ct = texCortina(), curM = SM(0xffffff, { map: rep(ct.clone(), 3, 1), roughness: 0.75 }); curM.map.needsUpdate = true;
  const fundo = new THREE.PlaneGeometry(9.5, 6, 60, 1); deform(fundo, (v) => { v.z = Math.sin(v.x * 7) * 0.08; }); mesh(fundo, curM, 0, 2.6, -3.9, g);
  [-1, 1].forEach((k) => { const sg = new THREE.PlaneGeometry(1.6, 6, 16, 1); deform(sg, (v) => { v.z = Math.sin(v.x * 9) * 0.1; }); const sd = mesh(sg, curM, k * 3.9, 2.6, -1.2, g); sd.rotation.y = -k * 0.5; });
  const topo = new THREE.PlaneGeometry(9.5, 0.9, 40, 1); deform(topo, (v) => { v.y += Math.cos(v.x * 2.2) * 0.12; v.z = Math.sin(v.x * 9) * 0.05; }); mesh(topo, curM, 0, 5.05, -1.0, g);
  const banner = canvasTex(1024, 128, (c, w, h) => { c.fillStyle = "#f4ead0"; c.fillRect(0, 0, w, h); c.strokeStyle = "#c8a040"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#3a1a10"; c.font = "700 60px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PREMIAÇÃO ESCOLAR", w / 2, h / 2 + 3); }, { redraw: true });
  mesh(new THREE.PlaneGeometry(4.2, 0.52), SM(0xffffff, { map: banner, roughness: 0.8 }), 0.4, 4.35, -3.82, g);
  const escolaTex = canvasTex(768, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#f4b878"); gr.addColorStop(0.55, "#f8dcb0"); gr.addColorStop(0.56, "#a8a090"); gr.addColorStop(1, "#8a8070"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = "#e8e4dc"; c.fillRect(120, 150, 540, 140); c.fillStyle = "#d8d2c8"; c.fillRect(120, 150, 540, 18); for (let fl = 0; fl < 3; fl++) for (let i = 0; i < 14; i++) { c.fillStyle = (i + fl) % 5 ? "#5a7088" : "#8aa0b8"; c.fillRect(138 + i * 37, 178 + fl * 36, 26, 22); }
    c.fillStyle = "#e8e4dc"; c.fillRect(350, 100, 80, 60); c.fillStyle = "#fff"; c.beginPath(); c.arc(390, 128, 20, 0, 7); c.fill(); c.strokeStyle = "#222"; c.lineWidth = 3; c.beginPath(); c.moveTo(390, 128); c.lineTo(390, 114); c.moveTo(390, 128); c.lineTo(401, 133); c.stroke();
    for (let i = 0; i < 9; i++) { const x = 40 + i * 88, y = 300; c.fillStyle = "#6a4a3a"; c.fillRect(x - 4, y - 10, 8, 50); c.fillStyle = `rgba(${240 + hash(i) * 15},${170 + hash(i * 3) * 40},${190 + hash(i * 5) * 30},.95)`; c.beginPath(); c.arc(x, y - 22, 34 + hash(i) * 10, 0, 7); c.fill(); }
    c.fillStyle = "#c8c0b0"; c.fillRect(0, 330, w, 182); });
  const tela = grp(g, 0.4, 2.75, -3.75); mesh(box(3.1, 2.1, 0.05), SM(0x1a1a1a), 0, 0, -0.03, tela);
  const telaM = photoMat("escola", { fallback: 0xffffff }); if (!telaM.map) telaM.map = escolaTex;
  const telaP = mesh(new THREE.PlaneGeometry(2.96, 1.97), telaM, 0, 0, 0.0, tela); telaP.castShadow = false;
  const projL = new THREE.PointLight(0xffe8d0, 0.6, 4, 1.6); projL.position.set(0.4, 2.7, -3.0); g.add(projL);
  const chairM = SM(0x4a4e58, { metalness: 0.4, roughness: 0.5 });
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const ch = grp(g, -4 + i * 1.0 + (r % 2) * 0.5, -0.8, 2.6 + r * 1.2); mesh(box(0.45, 0.04, 0.42), chairM, 0, 0.45, 0, ch); mesh(box(0.45, 0.45, 0.04), chairM, 0, 0.7, -0.2, ch); [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].forEach(([x, z]) => mesh(box(0.03, 0.45, 0.03), chairM, x, 0.225, z, ch)); }
  // pódio 1-2-3
  const numTex = (n) => canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#f4f2ec"; c.fillRect(0, 0, w, h); c.fillStyle = n === 1 ? "#c8a040" : n === 2 ? "#9aa0a8" : "#b0683a"; c.font = "700 170px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(n), w / 2, h / 2 + 10); }, { redraw: true });
  const BL = { 2: [0.55, 0.42], 1: [1.2, 0.62], 3: [1.85, 0.3] };
  Object.entries(BL).forEach(([n, [x, h]]) => { const bx = grp(g, x, 0, -1.0); mesh(box(0.62, h, 0.6), SM(0xf4f2ec, { roughness: 0.5 }), 0, h / 2, 0, bx); const f = mesh(new THREE.PlaneGeometry(0.42, Math.min(0.42, h - 0.04)), SM(0xffffff, { map: numTex(+n), roughness: 0.5 }), 0, h / 2, 0.302, bx); f.castShadow = false; });
  const trofeu = grp(g, 1.2, 0.62, -1.0); const gm = GOLDM(); mesh(lathe([[0.0, 0], [0.09, 0], [0.09, 0.03], [0.03, 0.05], [0.025, 0.16], [0.06, 0.2], [0.11, 0.34], [0.12, 0.38], [0.0, 0.38]], 24), gm, 0, 0, 0, trofeu);
  [-1, 1].forEach((k) => { const al = mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 14, Math.PI), gm, k * 0.12, 0.3, 0, trofeu); al.rotation.z = k * Math.PI / 2; });
  // as três provas: redação (folha com carimbo 3º), corrida (barreira com medalha de bronze), violino (no suporte, fita de bronze)
  const bronze = SM(0xb0683a, { metalness: 0.85, roughness: 0.32 });
  const fita = (parent, x, y, z) => { const f = grp(parent, x, y, z); mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 24), bronze, 0, 0, 0, f).rotation.x = Math.PI / 2; [-1, 1].forEach((k) => { const r = mesh(box(0.05, 0.16, 0.004), SM(0x8a2a2a), k * 0.03, -0.11, -0.004, f); r.rotation.z = k * 0.25; }); const lt = canvasTex(64, 64, (c, w) => { c.fillStyle = "#f0d0a0"; c.font = "700 34px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("3º", w / 2, w / 2 + 2); }, { redraw: true }); mesh(new THREE.CircleGeometry(0.06, 20), new THREE.MeshBasicMaterial({ map: lt, transparent: true }), 0, 0, 0.008, f); return f; };
  const papel = canvasTex(384, 512, (c, w, h) => { c.fillStyle = "#f6f2e6"; c.fillRect(0, 0, w, h); c.fillStyle = "#2a2a3a"; c.font = "700 26px 'Archivo Black', sans-serif"; c.fillText("REDAÇÃO", 30, 50); c.strokeStyle = "rgba(60,60,90,.55)"; c.lineWidth = 2; for (let y = 90; y < h - 40; y += 24) { c.beginPath(); c.moveTo(30, y); c.lineTo(30 + 300 * (0.6 + hash(y) * 0.4), y); c.stroke(); }
    c.save(); c.translate(270, 400); c.rotate(-0.25); c.strokeStyle = "#c81e2a"; c.lineWidth = 7; c.beginPath(); c.arc(0, 0, 58, 0, 7); c.stroke(); c.fillStyle = "#c81e2a"; c.font = "700 54px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("3º", 0, 4); c.restore(); }, { redraw: true });
  const cav = grp(g, -2.55, 0, -1.25); [[-0.25, 0.1], [0.25, 0.1], [0, -0.3]].forEach(([x, z]) => { const l = mesh(box(0.03, 1.5, 0.03), SM(0x6a4a2a), x, 0.74, z, cav); l.rotation.x = z < 0 ? -0.2 : 0.08; });
  const folha = mesh(new THREE.PlaneGeometry(0.42, 0.56), SM(0xffffff, { map: papel, roughness: 0.85 }), 0, 1.15, 0.13, cav); folha.rotation.x = -0.08; fita(cav, 0.22, 0.86, 0.15);
  const bar = grp(g, -1.65, 0, -1.25); const bm = SM(0xf2f2ee, { roughness: 0.5 }), bk = SM(0x1a1a1a);
  [-0.42, 0.42].forEach((x) => { mesh(box(0.04, 0.84, 0.04), bm, x, 0.42, 0, bar); mesh(box(0.04, 0.03, 0.5), bk, x, 0.015, 0, bar); });
  for (let i = 0; i < 4; i++) mesh(box(0.21, 0.12, 0.02), i % 2 ? bk : bm, -0.315 + i * 0.21, 0.78, 0, bar);
  const med = fita(bar, 0.0, 0.62, 0.03); med.scale.setScalar(1.2);
  const vio = grp(g, -0.8, 0, -1.3); mesh(box(0.03, 0.8, 0.03), SM(0x2a2a2a, { metalness: 0.5 }), 0, 0.4, 0, vio); mesh(cyl(0.18, 0.2, 0.02, 12), SM(0x2a2a2a, { metalness: 0.5 }), 0, 0.01, 0, vio);
  const vb = grp(vio, 0, 1.02, 0.04); vb.rotation.z = 0.12; const vw = SM(0x8a3a14, { roughness: 0.35 });
  const vShape = new THREE.Shape(); vShape.moveTo(0, -0.18); vShape.bezierCurveTo(0.13, -0.18, 0.13, -0.05, 0.07, -0.02); vShape.bezierCurveTo(0.05, 0.0, 0.05, 0.04, 0.07, 0.06); vShape.bezierCurveTo(0.12, 0.1, 0.1, 0.18, 0, 0.18); vShape.bezierCurveTo(-0.1, 0.18, -0.12, 0.1, -0.07, 0.06); vShape.bezierCurveTo(-0.05, 0.04, -0.05, 0.0, -0.07, -0.02); vShape.bezierCurveTo(-0.13, -0.05, -0.13, -0.18, 0, -0.18);
  const vGeo = new THREE.ExtrudeGeometry(vShape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 3 }); vGeo.translate(0, 0, -0.025); mesh(vGeo, vw, 0, 0, 0, vb);
  mesh(box(0.03, 0.26, 0.02), SM(0x1a1210), 0, 0.29, 0.035, vb); mesh(sph(0.025, 10, 8), vw, 0, 0.43, 0.03, vb);
  for (let i = 0; i < 4; i++) mesh(cyl(0.0012, 0.0012, 0.56, 4), SM(0xe8e0d0, { metalness: 0.8 }), -0.012 + i * 0.008, 0.12, 0.05, vb);
  fita(vio, 0.16, 0.7, 0.08);
  // luzes: canhão quente no 3º lugar; o 1º no escuro até "chama atenção" (aí um canhão branco e flashes)
  const spot = (x, col, I, ang = 0.32) => { const L_ = new THREE.SpotLight(col, I, 14, ang, 0.5, 1.4); L_.position.set(x, 6.5, 2.5); const tg = grp(g, x, 0.3, -1.0); L_.target = tg; g.add(L_); const cone = mesh(new THREE.ConeGeometry(0.9, 6.6, 28, 1, true), new THREE.MeshBasicMaterial({ color: col, map: coneTex, transparent: true, opacity: 0.08, depthWrite: false, blending: ADD, side: THREE.DoubleSide, fog: false }), 0, 0, 0, g); cone.position.set(x, 3.4, 0.75); cone.lookAt(x, 6.5, 2.5); cone.rotateX(Math.PI / 2); return { L: L_, cone, I }; };
  const s3 = spot(1.85, 0xffc890, 18, 0.2), s1_ = spot(1.2, 0xffffff, 0, 0.17), sProv = spot(-1.65, 0xffd8a8, 18, 0.5);
  const flashes = []; for (let i = 0; i < 9; i++) { const f = glowSprite(0xffffff, 1.6, 0); f.position.set(-3 + hash(i * 3) * 6.5, 0.4 + hash(i * 5) * 1.0, 2.8 + hash(i * 7) * 4); g.add(f); flashes.push(f); }
  const poeira = dustPts(200, [-3, 3, 0, 5, -2.5, 2], 0xfff0d8, 0.02, 0.6); g.add(poeira);
  // o menino sem rosto (uniforme escuro), com medalha de bronze, sobe no degrau do 3º lugar vindo de trás do pódio
  const p = meninoSemRosto(); g.add(p); const u = p.userData;
  const medal = grp(u.chest, 0, 0.0, 0.0); const rib = mesh(new THREE.TorusGeometry(0.11, 0.006, 4, 24, Math.PI * 1.1), SM(0x8a2a2a), 0, 0.2, 0.06, medal); rib.rotation.set(0, 0, Math.PI * 1.45); mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 18), bronze, 0, 0.1, 0.135, medal).rotation.x = Math.PI / 2;
  const hf = (x, z) => (z > -1.31 && z < -0.69 && x > 1.53 && x < 2.17 ? 0.3 : 0), hb = (x, z) => 0.3 * smr(z, -1.5, -1.12);
  const Z0 = -2.55, D = 1.55, Lb = gaitFit(D, 0.4), tW0 = a + 0.15, tW1 = K.lugar4 - 0.1;
  const distF = (t) => andarAte(t, tW0, tW1, D, 0.8);
  return {
    bg: 0x0a0606, fog: [12, 40], fogCol: 0x0a0606,
    look: { exposure: 1.1, bloom: 0.7, bloomT: 0.72, vig: 0.55, sat: 1.06, con: 1.07, lift: [0.012, 0.006, 0.004] },
    sun: { dir: [0.1, 0.8, 0.6], col: 0xffe0c0, I: 0.25, c: [0, 0.5, -1], r: 5 }, hemi: { sky: 0x6a4a40, ground: 0x1a0c08, I: 0.32 }, fill: { col: 0xffc8a0, I: 0.12, dir: [0, 0.3, 1] }, rim: { col: 0xffe0c0, str: 0.5 }, hand: 0.007,
    update(t) {
      const att = smr(t, K.primeiro - 0.1, K.primeiro + 0.15);
      s1_.L.intensity = 38 * att; s1_.cone.material.opacity = 0.14 * att; s3.L.intensity = 18 * (1 - 0.55 * att); s3.cone.material.opacity = 0.08 * (1 - 0.5 * att);
      sProv.L.intensity = 18 * (1 - smr(t, K.sempre - 0.2, K.sempre + 0.4)) + 4;
      flashes.forEach((f, i) => { const tf = K.primeiro + 0.05 + i * 0.17 + hash(i) * 0.08, k = t > tf && t < tf + 0.12 ? 1 - (t - tf) / 0.12 : 0; f.material.opacity = 0.95 * k; f.scale.setScalar(1.2 + k * 1.4); });
      floatDust(poeira, t, 0.2, 0.15);
      restPose(p);
      const d = distF(t);
      gait(p, d, { from: [1.85, 0, Z0], ang: 0, step: Lb, hf, hb, amt: 0.9 });
      idle(p, t, 11, 0.3 + 0.7 * clamp((t - tW1) / 0.5));
      // olha para o 1º lugar no "de propósito"; recua o rosto quando a luz acende lá
      const lk = act(t, K.proposito - 0.2, K.proposito + 0.5, 0.1, 0.06) * (1 - smr(t, K.primeiro + 0.4, K.primeiro + 0.9));
      if (lk > 0.001) lookAtW(p, V3(1.2, 0.9, -1.0), clamp(lk), 1.3);
      const fl = act(t, K.primeiro + 0.05, K.primeiro + 0.5, 0.05, 0.1);
      if (fl > 0) { u.neck.rotation.y -= 0.35 * fl; u.spine.rotation.x -= 0.06 * fl; u.sh.forEach((s_) => (s_.rotation.x -= 0.05 * fl)); }
      molaHomem(p, t, (tt) => { const dd = distF(tt); return [1.85, 0.95 + hb(1.85, Z0 + dd), Z0 + dd]; });
    },
    cam(t) {
      return path2(t, [
        [a, [0.6, 1.9, 5.2], [0.6, 1.2, -1.2], 36],
        [K.terceiro + 0.3, [1.3, 1.45, 3.2], [1.5, 1.0, -1.1], 36],
        [K.redacao + 0.15, [-2.35, 1.3, 0.85], [-2.5, 1.1, -1.25], 34],
        [K.corrida + 0.15, [-1.55, 1.3, 0.95], [-1.65, 0.62, -1.25], 34],
        [K.violino + 0.25, [-0.7, 1.25, 0.6], [-0.78, 1.0, -1.3], 34],
        [K.sempre + 0.45, [1.55, 1.25, 1.75], [1.75, 1.1, -1.0], 34],
        [K.proposito + 0.4, [2.2, 1.35, 1.95], [1.65, 1.0, -1.0], 33],
        [K.primeiro + 0.3, [1.2, 1.6, 3.4], [1.45, 0.95, -1.0], 36],
        [b, [1.0, 1.75, 4.2], [1.35, 0.95, -1.0], 38],
      ]);
    },
  };
});

// ================================================================ vídeo: Kira · cenas 6–10

// ---------------------------------------------------------------- 6 · keys: a loja de departamentos à noite (vitrines, manequins sem rosto, escada rolante); as keys sobem da caixa de presente
addSet("s6-keys", (g) => {
  const [a, b] = T.sc["s6-keys"];
  const floorT = canvasTex(512, 512, (c, w, h) => { c.fillStyle = "#cfc8bc"; c.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = (x + y) % 2 ? "#c4bcae" : "#d8d2c6"; c.fillRect(x * 128 + 2, y * 128 + 2, 124, 124); } for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(120,110,100,${hash(i) * 0.08})`; c.fillRect(hash(i * 3) * w, hash(i * 5) * h, 2 + hash(i * 7) * 8, 2); } });
  const fl = mesh(new THREE.PlaneGeometry(30, 30), SM(0xffffff, { map: rep(floorT, 12, 12), roughness: 0.12, metalness: 0.15 }), 0, 0, -6, g); fl.rotation.x = -Math.PI / 2;
  mesh(new THREE.PlaneGeometry(30, 30), SM(0x2a2a30, { roughness: 0.9 }), 0, 4.2, -6, g).rotation.x = Math.PI / 2;
  mesh(box(30, 4.2, 0.2), SM(0x3a3a44, { roughness: 0.8 }), 0, 2.1, -16, g);
  // luminárias do teto (metade apagada: loja fechada), placa de saída verde, pilares
  const panels = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const on = (i + j) % 2 === 0; const pm = mesh(box(1.2, 0.04, 0.4), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeef2ff, emissiveIntensity: on ? 1.3 : 0.05 }), -4.5 + i * 1.8, 4.16, 2 - j * 3.6, g); panels.push(pm); }
  const saida = canvasTex(256, 96, (c, w, h) => { c.fillStyle = "#1a8a3a"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "700 54px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("SAÍDA", w / 2 + 20, h / 2 + 3); c.fillRect(22, 30, 30, 40); }, { redraw: true });
  mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshBasicMaterial({ map: saida }), -3.5, 3.2, -15.88, g);
  [[-3.2, -3], [3.2, -3], [-3.2, -10], [3.2, -10]].forEach(([x, z]) => mesh(box(0.6, 4.2, 0.6), SM(0xe8e2d8, { roughness: 0.4 }), x, 2.1, z, g));
  // escada rolante ao fundo
  const esc = grp(g, 3.6, 0, -12); esc.rotation.y = -0.4; const em = SM(0x9aa0a8, { metalness: 0.7, roughness: 0.3 });
  for (let i = 0; i < 18; i++) mesh(box(1.0, 0.2, 0.36), em, 0, 0.1 + i * 0.22, -i * 0.34, esc);
  [-0.55, 0.55].forEach((x) => { const r = mesh(box(0.08, 0.9, 7.2), SM(0x1a1a1e, { roughness: 0.3 }), x, 2.3, -2.9, esc); r.rotation.x = Math.atan2(4, 6.1); });
  // manequins sem rosto de terno (o homem comum, multiplicado)
  const mqs = []; [[-2.4, -6.5, 0.3], [-1.6, -7.2, -0.1], [2.2, -6.8, -0.4], [2.9, -5.6, -0.7]].forEach(([x, z, r], i) => { const m = semRosto({ jacket: [0x3a3a44, 0x4a3a2a, 0x2a3a4a, 0x3a2a3a][i], pants: 0x2a2a30, hairStyle: "careca", seed: 80 + i }); m.userData.tie.visible = i % 2 === 0; m.position.set(x, 0.12, z); m.rotation.y = r; g.add(m); mesh(cyl(0.3, 0.32, 0.12, 20), SM(0xe8e2d8, { roughness: 0.3 }), x, 0.06, z, g); restPose(m); pose(m, { armR: [0.1, 0, -0.25, -0.3], armL: [-0.15, 0, 0.2, -0.5] }); mqs.push(m); });
  // vitrines com caixas de presente; no centro, a caixa de onde sobem as keys
  const vidro = new THREE.MeshStandardMaterial({ color: 0xd8e8f0, transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const balcao = (x, z, w = 1.8) => { const c = grp(g, x, 0, z); mesh(box(w, 0.75, 0.6), SM(0x2a2018, { roughness: 0.5 }), 0, 0.375, 0, c); mesh(box(w, 0.42, 0.6), vidro, 0, 0.96, 0, c); mesh(box(w + 0.02, 0.02, 0.62), SM(0xc8b080, { metalness: 0.8, roughness: 0.3 }), 0, 1.17, 0, c); const L_ = new THREE.PointLight(0xffe4c0, 0.6, 2, 1.6); L_.position.set(0, 1.0, 0); c.add(L_); return c; };
  const presente = (parent, x, y, z, s, col, rib) => { const p = grp(parent, x, y, z); mesh(box(s, s * 0.7, s), SM(col, { roughness: 0.5 }), 0, s * 0.35, 0, p); mesh(box(s * 1.01, s * 0.71, s * 0.14), SM(rib, { roughness: 0.4 }), 0, s * 0.35, 0, p); mesh(box(s * 0.14, s * 0.71, s * 1.01), SM(rib, { roughness: 0.4 }), 0, s * 0.35, 0, p); return p; };
  [[-2.2, -1.6], [2.2, -1.6], [-2.4, -3.9], [2.4, -3.9]].forEach(([x, z], i) => { const c = balcao(x, z); for (let k = 0; k < 3; k++) presente(c, -0.5 + k * 0.5, 0.78, 0, 0.2 + hash(i * 3 + k) * 0.08, [0xc83a3a, 0x3a6ac8, 0xe8c040, 0x3aa86a][(i + k) % 4], 0xf4f0e6); });
  const centro = balcao(0, -0.4, 1.4);
  const caixa = presente(centro, 0, 0.78, 0, 0.3, 0x5a2a8a, 0xffd060); const tampa = grp(caixa, 0, 0.22, -0.15); mesh(box(0.32, 0.05, 0.32), SM(0x5a2a8a, { roughness: 0.5 }), 0, 0.02, 0.15, tampa);
  const cardTex = canvasTex(256, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#14142e"); gr.addColorStop(1, "#7a4ac8"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(220,200,255,.9)"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#fff"; c.font = "700 46px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.fillText("KEY", w / 2, 100); c.fillStyle = "#ffd060"; c.font = "700 22px 'Space Mono', monospace"; c.fillText("★ ★ ★", w / 2, 135); c.fillStyle = "#fff"; c.beginPath(); c.roundRect(w / 2 - 34, 20, 68, 34, 14); c.fill(); c.fillStyle = "#14142e"; c.fillRect(w / 2 - 22, 34, 14, 5); c.fillRect(w / 2 - 17, 29, 5, 15); c.beginPath(); c.arc(w / 2 + 16, 33, 4, 0, 7); c.arc(w / 2 + 22, 41, 4, 0, 7); c.fill(); }, { redraw: true });
  const cards = []; for (let i = 0; i < 12; i++) cards.push(mesh(box(0.3, 0.19, 0.008), new THREE.MeshStandardMaterial({ map: cardTex, emissive: 0xffffff, emissiveMap: cardTex, emissiveIntensity: 0.45, roughness: 0.35 }), 0, 0, 0, g));
  const cg = glowSprite(0xc8a0ff, 2.0, 0); cg.position.set(0, 1.3, -0.4); g.add(cg);
  const sparks = flowPts(90, 0xe0c8ff, 0.035); g.add(sparks.pts);
  const keyL = new THREE.PointLight(0xc8a0ff, 0, 5, 1.5); keyL.position.set(0, 1.5, -0.2); g.add(keyL);
  const motes = dustPts(160, [-3, 3, 0.3, 3.8, -5, 2], 0xfff4e0, 0.018, 0.5); g.add(motes);
  return {
    bg: 0x0c0c12, fog: [6, 22], fogCol: 0x0c0c12,
    look: { exposure: 1.25, bloom: 0.75, bloomT: 0.7, vig: 0.48, sat: 1.08, con: 1.05, lift: [0.01, 0.008, 0.022] },
    sun: { dir: [0.3, 1, 0.5], col: 0xe8ecff, I: 0.8, c: [0, 0, -2], r: 7 }, hemi: { sky: 0x8a8aa0, ground: 0x3a3428, I: 0.55 }, fill: { col: 0xffe0c0, I: 0.2, dir: [0, 0.4, 1] }, rim: { col: 0xd8c8ff, str: 0.5 }, hand: 0.008,
    update(t) {
      tampa.rotation.x = -1.9 * E.outBack(smr(t, K.rapidinho + 0.1, K.keys + 0.1));
      const up = smr(t, K.keys - 0.2, K.steam + 0.4), out = smr(t, K.agora - 0.3, K.agora + 0.5), lt = t - a;
      cards.forEach((cd, i) => { const ang = (i / 12) * Math.PI * 2 + lt * 0.8, r = 0.06 + up * (0.42 + (i % 3) * 0.13) * (1 + out * 2.5), yy = 1.05 + up * (0.35 + Math.sin(lt * 2 + i) * 0.06 + (i % 4) * 0.13) + out * 1.4;
        cd.position.set(Math.cos(ang) * r, yy, -0.4 + Math.sin(ang) * r * 0.75); cd.rotation.set(-0.25 + Math.sin(lt + i) * 0.2, -ang + Math.PI / 2, Math.sin(lt * 1.3 + i) * 0.25); cd.scale.setScalar(Math.max(0.001, up * (1 - out * 0.7))); });
      const pulse = K.bio && t > K.bio - 0.05 && t < K.bio + 0.4 ? 1 - (t - K.bio + 0.05) / 0.45 : 0;
      cg.material.opacity = 0.4 * up * (1 - out) + pulse * 0.35; keyL.intensity = 1.6 * up * (1 - out) + pulse * 1.5;
      for (let i = 0; i < 90; i++) { const ph = (t * 0.45 + hash(i * 1.7)) % 1, an = hash(i) * 6.28 + t * 0.6; sparks.pos.set([Math.cos(an) * (0.15 + ph * 0.6), 1.05 + ph * 1.4 * up, -0.4 + Math.sin(an) * (0.15 + ph * 0.45)], i * 3); } sparks.pts.material.opacity = up * 0.8 * (1 - out); sparks.upd();
      panels.forEach((pm, i) => (pm.material.emissiveIntensity = (pm.material.emissiveIntensity > 0.5 ? 1.3 : 0.05) * (1 - out * 0.6)));
      floatDust(motes, t, 0.2, 0.15);
    },
    cam(t) {
      return path2(t, [
        [a, [0.5, 1.75, 3.6], [0, 1.15, -1.6], 40],
        [K.steam, [0.15, 1.6, 2.6], [0, 1.4, -0.4], 38],
        [K.bio + 0.3, [0.05, 1.45, 1.75], [0, 1.6, -0.4], 36],
        [b, [-0.6, 1.9, 1.3], [-1.6, 1.3, -6.0], 38],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 7 · só disfarce? Mural da investigação: recortes, fotos, fios vermelhos ligados à silhueta com "?"; no "também não" os fios caem
addSet("s7-disfarce", (g) => {
  const [a, b] = T.sc["s7-disfarce"];
  const wallT = texPapelParede("#5a5448", "#544e42"), wm = SM(0xffffff, { map: rep(wallT.clone(), 4, 2), roughness: 0.9 }); wm.map.needsUpdate = true;
  mesh(box(8, 3.2, 0.1), wm, 0, 1.6, -0.05, g); mesh(box(8, 0.1, 5), SM(0x3a3026, { roughness: 0.8 }), 0, -0.05, 2.4, g);
  const cork = texPair(256, (u, v) => fbm2(u * 30, v * 30, 3, 30), (u, v, h) => mixc([150, 108, 64], [196, 150, 96], h), 2, { rep: [3, 2] });
  const board = mesh(box(2.6, 1.7, 0.04), SM(0xffffff, { map: cork.map, normalMap: cork.normalMap, roughness: 0.95 }), 0, 1.62, 0.04, g);
  mesh(box(2.7, 1.8, 0.03), SM(0x5a3a22), 0, 1.62, 0.02, g);
  const papers = [];
  const paper = (x, y, w, h, draw, rot = 0) => { const tx = canvasTex(256, Math.round(256 * h / w), draw, { redraw: true }); const m = mesh(new THREE.PlaneGeometry(w, h), SM(0xffffff, { map: tx, roughness: 0.85 }), x, y, 0.07 + papers.length * 0.0015, g); m.rotation.z = rot; m.castShadow = false; papers.push(m); const pin = mesh(sph(0.018, 10, 8), SM(0xc81e2a, { roughness: 0.3 }), x, y + h * 0.42, 0.09, g); return { m, pin: pin.position.clone() }; };
  const jornal = (titulo) => (c, w, h) => { c.fillStyle = "#e8e2d2"; c.fillRect(0, 0, w, h); c.fillStyle = "#1a1a1a"; c.font = "700 26px 'Archivo Black', sans-serif"; c.fillText(titulo, 12, 36); c.fillStyle = "rgba(30,30,30,.55)"; for (let y = 54; y < h - 10; y += 12) c.fillRect(12, y, (w - 24) * (0.7 + hash(y) * 0.3), 5); c.fillStyle = "rgba(60,60,60,.6)"; c.fillRect(w - 96, 50, 84, 70); };
  const foto = (seed) => (c, w, h) => { c.fillStyle = "#f4f2ec"; c.fillRect(0, 0, w, h); const gr = c.createLinearGradient(0, 14, 0, h - 50); gr.addColorStop(0, "#1a2240"); gr.addColorStop(1, "#4a4a5a"); c.fillStyle = gr; c.fillRect(14, 14, w - 28, h - 64); c.fillStyle = "#0a0c14"; for (let i = 0; i < 5; i++) c.fillRect(14 + i * 46, h - 50 - 60 - hash(i + seed) * 70, 40, 60 + hash(i + seed) * 70); c.fillStyle = "#ffd890"; c.fillRect(60 + seed * 20, 90, 10, 12); };
  const sil = (c, w, h) => { c.fillStyle = "#f4f2ec"; c.fillRect(0, 0, w, h); c.fillStyle = "#1a1a22"; c.beginPath(); c.ellipse(w / 2, 92, 46, 56, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(w / 2 - 90, h - 10); c.quadraticCurveTo(w / 2 - 80, 160, w / 2, 152); c.quadraticCurveTo(w / 2 + 80, 160, w / 2 + 90, h - 10); c.fill(); c.fillStyle = "#c81e2a"; c.font = "700 120px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("?", w / 2, 108); };
  const P = [
    paper(-0.85, 2.05, 0.6, 0.42, jornal("CASO SEM SOLUÇÃO"), -0.05), paper(0.88, 2.08, 0.6, 0.42, jornal("NENHUMA PISTA"), 0.06), paper(-0.95, 1.2, 0.42, 0.5, foto(0)), paper(0.95, 1.18, 0.42, 0.5, foto(1), 0.04),
    paper(-0.3, 0.98, 0.5, 0.36, jornal("BAIRRO TRANQUILO"), 0.03), paper(0.38, 0.95, 0.42, 0.5, foto(2), -0.06),
  ];
  const S = paper(0, 1.68, 0.5, 0.62, sil);
  // fios vermelhos dos alfinetes até a silhueta (caem no "também não")
  const fios = P.map((pp, i) => { const m = mesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 5), SM(0xd01e2a, { roughness: 0.6 }), 0, 0, 0.1, g); m.castShadow = false; return { m, A: pp.pin, B: S.pin, i }; });
  const setFio = (f, A, B) => { const d = B.clone().sub(A); f.m.position.copy(A).addScaledVector(d, 0.5); f.m.scale.set(1, d.length(), 1); f.m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); };
  // mesa com abajur, café, pastas; janela com chuva e luzes da cidade
  const desk = grp(g, 0.2, 0, 1.0); mesh(box(1.8, 0.05, 0.8), SM(0x4a3222, { roughness: 0.5 }), 0, 0.76, 0, desk); [[-0.85, -0.35], [0.85, -0.35], [-0.85, 0.35], [0.85, 0.35]].forEach(([x, z]) => mesh(box(0.05, 0.76, 0.05), SM(0x2a1a10), x, 0.38, z, desk));
  mesh(cyl(0.04, 0.035, 0.1, 14), SM(0xf2f2ee, { roughness: 0.3 }), 0.5, 0.83, 0.1, desk); mesh(box(0.34, 0.03, 0.26), SM(0xc8a060, { roughness: 0.8 }), -0.4, 0.795, 0.05, desk);
  const lampD = grp(desk, -0.7, 0.78, -0.15); mesh(cyl(0.06, 0.07, 0.03, 14), SM(0x2a2a2a, { metalness: 0.6 }), 0, 0.015, 0, lampD); const arm = mesh(cyl(0.01, 0.01, 0.45, 6), SM(0x2a2a2a, { metalness: 0.6 }), 0.08, 0.22, 0, lampD); arm.rotation.z = -0.4;
  const lampL = new THREE.SpotLight(0xffd8a0, 3.2, 6, 0.85, 0.6, 1.5); lampL.position.set(0.2, 0.5, 0.1); lampD.add(lampL); const tg = grp(g, 0, 1.55, 0.05); lampL.target = tg;
  const chuvaT = canvasTex(128, 256, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 70; i++) { c.strokeStyle = `rgba(200,220,255,${0.15 + hash(i) * 0.35})`; c.lineWidth = 1; const x = hash(i * 3) * w, y = hash(i * 5) * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y + 12 + hash(i * 7) * 20); c.stroke(); } });
  const jan = grp(g, 2.55, 1.7, 0.0); mesh(box(1.2, 1.3, 0.05), SM(0x2a2a2a), 0, 0, 0.0, jan);
  const cidade = mesh(new THREE.PlaneGeometry(1.1, 1.2), new THREE.MeshBasicMaterial({ map: janelasTex.clone(), color: 0x8a9ac8 }), 0, 0, 0.03, jan); cidade.material.map.needsUpdate = true;
  const rain = mesh(new THREE.PlaneGeometry(1.1, 1.2), new THREE.MeshBasicMaterial({ map: rep(chuvaT, 2, 2), transparent: true, depthWrite: false }), 0, 0, 0.05, jan);
  const motes = dustPts(90, [-1.5, 1.5, 0.4, 2.8, 0.2, 2], 0xfff0d0, 0.014, 0.5); g.add(motes);
  return {
    bg: 0x0a0806, fog: [6, 20], fogCol: 0x0a0806,
    look: { exposure: 1.15, bloom: 0.55, bloomT: 0.82, vig: 0.58, sat: 0.95, con: 1.1, lift: [0.01, 0.008, 0.004] },
    sun: { dir: [0.4, 0.6, 1], col: 0x8aa0d0, I: 0.25, c: [0, 1.5, 0], r: 3 }, hemi: { sky: 0x5a5040, ground: 0x1a140e, I: 0.35 }, fill: { col: 0xffd0a0, I: 0.0 }, rim: { col: 0xffe0c0, str: 0.3 }, hand: 0.009,
    update(t) {
      rain.material.map.offset.y = -t * 0.9; floatDust(motes, t, 0.15, 0.2);
      const cut = K.tambem - 0.05;
      fios.forEach((f) => { const k = clamp((t - cut - f.i * 0.06) / 0.5); const A = f.A.clone(), B = f.B.clone(); if (k > 0) { const fall = E.in(k); B.copy(f.A).add(V3(0.04 * (f.i % 2 ? 1 : -1), -0.6 * fall - 0.05, 0.02)); B.lerp(f.B, (1 - k) * (1 - k)); } setFio(f, A, B); });
      const dim = smr(t, cut + 0.1, cut + 0.6); lampL.intensity = 3.2 * (1 - dim * 0.55) + noise1(t * 8) * 0.12;
    },
    cam(t) {
      return path2(t, [
        [a, [0.35, 1.7, 3.4], [0, 1.6, 0], 38],
        [K.disfarce6 + 0.2, [0.12, 1.7, 2.2], [0, 1.64, 0], 36],
        [b, [0.08, 1.68, 1.95], [0, 1.62, 0], 35],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 8 · o objetivo: jardim de pedras ao entardecer; o homem toma chá na varanda; o bambu-fonte bate a cada "sem…"; no fim, uma linha vermelha corre escondida entre os sulcos do cascalho
addSet("s8-objetivo", (g) => {
  const [a, b] = T.sc["s8-objetivo"];
  const dome = skyDome(g, { top: 0x2a2a5a, mid: 0x8a5a7a, hor: 0xf0a070, ground: 0x2a2028, exp: 0.7, sunDir: [-0.6, 0.06, -1], sunCol: 0xffb070, sunI: 1.0, disk: 1.8, cov: 0.55, cloudA: 0.7, cloudLit: 0xffc8a0, cloudSh: 0x6a4a6a, midY: 0.12 });
  // cascalho rastelado: linhas retas e anéis em volta das pedras (relevo e sulcos), 8 x 8 m
  const ROCKS = [[-1.2, -1.6, 0.5], [0.9, -2.4, 0.38], [1.9, -0.9, 0.3]], SZ = 8, CZ = -1.6;
  const rake = (u, v) => { const x = (u - 0.5) * SZ, z = (v - 0.5) * SZ + CZ; let best = 1e9, R = 0; ROCKS.forEach(([rx, rz, rr]) => { const d = Math.hypot(x - rx, z - rz) - rr * 1.1; if (d < best) { best = d; R = rr; } }); const ring = best < 0.75; return ring ? 0.5 + 0.5 * Math.cos(Math.max(0, best) * Math.PI * 2 / 0.11) : 0.5 + 0.5 * Math.cos(z * Math.PI * 2 / 0.11); };
  const gr = texPair(1024, rake, (u, v, h) => { const n = hash2(u * 997, v * 991); return mixc([168, 164, 156], [214, 210, 200], h * 0.7 + n * 0.3); }, 2.2);
  const grav = mesh(new THREE.PlaneGeometry(SZ, SZ), SM(0xffffff, { map: gr.map, normalMap: gr.normalMap, normalScale: new THREE.Vector2(1.6, 1.6), roughness: 0.95 }), 0, 0.001, CZ, g); grav.rotation.x = -Math.PI / 2;
  mesh(new THREE.PlaneGeometry(40, 40), SM(0x2a3020, { roughness: 1 }), 0, -0.01, -8, g).rotation.x = -Math.PI / 2;
  ROCKS.forEach(([x, z, r], i) => { const rk = rock(g, x, r * 0.25, z, r, 3 + i * 5, { flat: 0.65 }); const moss = mesh(sph(r * 1.05, 14, 8, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), SM(0x3a5a2a, { roughness: 1 }), x, 0.04, z, g); moss.rotation.x = Math.PI; moss.scale.y = 0.3; });
  // a linha vermelha (desenhada aos poucos sobre os sulcos)
  const rC = document.createElement("canvas"); rC.width = rC.height = 1024; const rG = rC.getContext("2d"); const rT = new THREE.CanvasTexture(rC); rT.colorSpace = THREE.SRGBColorSpace;
  const redP = mesh(new THREE.PlaneGeometry(SZ, SZ), new THREE.MeshBasicMaterial({ map: rT, transparent: true, depthWrite: false, fog: false }), 0, 0.006, CZ, g); redP.rotation.x = -Math.PI / 2; redP.castShadow = false;
  const toPx = (x, z) => [((x / SZ) + 0.5) * 1024, (((z - CZ) / SZ) + 0.5) * 1024];
  const redPath = []; { for (let i = 0; i <= 60; i++) { const k = i / 60, x = -3.8 + k * 2.4; redPath.push([x, -0.3 + Math.round(0.0 / 0.11) * 0.11]); } const [rx, rz, rr] = ROCKS[0]; for (let i = 0; i <= 80; i++) { const a_ = Math.PI * 0.5 + (i / 80) * Math.PI * 1.6, rad = rr * 1.1 + 0.44; redPath.push([rx + Math.sin(a_) * rad, rz + Math.cos(a_) * rad]); } for (let i = 0; i <= 50; i++) redPath.push([rx + rr * 1.1 + 0.44 + (i / 50) * 3.6, -2.19]); }
  let rKey = -1;
  const drawRed = (p) => { const key = Math.round(p * 120); if (key === rKey) return; rKey = key; rG.clearRect(0, 0, 1024, 1024); if (p <= 0) { rT.needsUpdate = true; return; } rG.strokeStyle = "rgba(190,10,24,.95)"; rG.lineWidth = 7; rG.lineCap = rG.lineJoin = "round"; rG.shadowColor = "rgba(255,40,50,.8)"; rG.shadowBlur = 10; rG.beginPath(); const n = Math.floor(p * (redPath.length - 1)); redPath.slice(0, n + 1).forEach(([x, z], i) => { const [px, py] = toPx(x, z); i ? rG.lineTo(px, py) : rG.moveTo(px, py); }); rG.stroke(); rT.needsUpdate = true; };
  // varanda de madeira (engawa), parede com shoji iluminado, beiral do telhado
  const pk = texPlanks([120, 84, 52], [100, 68, 40]), dk = SM(0xffffff, { map: rep(pk.map.clone(), 1, 4), normalMap: rep(pk.normalMap.clone(), 1, 4), roughness: 0.55 }); dk.map.needsUpdate = dk.normalMap.needsUpdate = true;
  const deck = mesh(box(7, 0.08, 1.4), dk, 0, 0.42, 1.95, g); deck.rotation.y = Math.PI / 2; deck.scale.set(1, 1, 1); deck.rotation.y = 0;
  [-3.3, -1.1, 1.1, 3.3].forEach((x) => mesh(box(0.1, 0.42, 0.1), SM(0x4a3020), x, 0.21, 1.3, g));
  const shojiT = canvasTex(256, 512, (c, w, h) => { c.fillStyle = "#f6e8c8"; c.fillRect(0, 0, w, h); c.fillStyle = "#3a2618"; for (let x = 0; x <= w; x += w / 3) c.fillRect(x - 3, 0, 6, h); for (let y = 0; y <= h; y += h / 6) c.fillRect(0, y - 3, w, 6); });
  for (let i = 0; i < 5; i++) { const sj = mesh(new THREE.PlaneGeometry(1.0, 1.9), new THREE.MeshStandardMaterial({ map: shojiT, emissive: 0xffc070, emissiveMap: shojiT, emissiveIntensity: 0.38, roughness: 0.9 }), -2.2 + i * 1.1, 1.42, 2.62, g); sj.rotation.y = Math.PI; }
  mesh(box(7, 0.25, 0.2), SM(0x3a2618), 0, 2.45, 2.62, g); mesh(box(7.6, 0.08, 2.2), SM(0x2a2a30, { roughness: 0.5 }), 0, 2.75, 1.95, g).rotation.x = 0.18;
  [-3.2, 3.2].forEach((x) => mesh(box(0.14, 2.35, 0.14), SM(0x4a3020), x, 1.6, 1.3, g));
  const casaL = new THREE.PointLight(0xffb060, 1.2, 4, 1.6); casaL.position.set(0, 1.3, 2.3); g.add(casaL);
  const pedra = mesh(box(0.7, 0.15, 0.42), SM(0x8a8680, { roughness: 0.9 }), 0, 0.075, 0.92, g);
  // lanterna de pedra com luz, bordo vermelho com folhas caindo, cerca de bambu, bambu-fonte (shishi-odoshi)
  const tr = grp(g, -1.05, 0, 0.05), stoneM = SM(0x7a7670, { roughness: 0.95 });
  mesh(cyl(0.22, 0.28, 0.12, 8), stoneM, 0, 0.06, 0, tr); mesh(cyl(0.08, 0.1, 0.55, 10), stoneM, 0, 0.39, 0, tr); mesh(cyl(0.24, 0.16, 0.1, 6), stoneM, 0, 0.71, 0, tr);
  const lbox = mesh(box(0.3, 0.26, 0.3), new THREE.MeshStandardMaterial({ color: 0x6a6660, emissive: 0xffa040, emissiveIntensity: 0.0, roughness: 0.9 }), 0, 0.89, 0, tr);
  mesh(new THREE.ConeGeometry(0.34, 0.24, 6), stoneM, 0, 1.14, 0, tr); mesh(sph(0.05, 8, 6), stoneM, 0, 1.28, 0, tr);
  const lanL = new THREE.PointLight(0xffa040, 1.4, 4, 1.6); lanL.position.set(0, 0.89, 0); tr.add(lanL); const lanG = glowSprite(0xffb060, 0.7, 0.55); lanG.position.set(0, 0.89, 0.17); tr.add(lanG);
  const maple = tree(g, -1.9, 0, 0.9, { h: 3.4, s: 0.75, leaf: 0xb8322a, blobs: 10, w: 1.1 });
  const leaves = []; for (let i = 0; i < 26; i++) { const lf = mesh(new THREE.PlaneGeometry(0.07, 0.06), SM(i % 3 ? 0xc83a2a : 0xe8602a, { side: THREE.DoubleSide, roughness: 0.8 }), 0, 0, 0, g); lf.castShadow = false; leaves.push(lf); }
  for (let i = 0; i < 46; i++) { const x = -4 + i * 0.18; mesh(cyl(0.035, 0.035, 1.8, 8), SM(i % 4 ? 0x8a8a4a : 0x7a7a3a, { roughness: 0.6 }), x, 0.9, -5.6, g); }
  [0.5, 1.3].forEach((y) => mesh(box(8.4, 0.05, 0.06), SM(0x3a2a1a), 0, y, -5.52, g));
  forestInst(g, 40, [-14, 14, -14, -7], () => 0, { h: 7, leaf: 0x1a2a1a });
  const sod = grp(g, 0.9, 0, 0.75); mesh(cyl(0.34, 0.38, 0.16, 16), stoneM, -0.15, 0.08, -0.2, sod); mesh(cyl(0.3, 0.3, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.05, metalness: 0.4 }), -0.15, 0.165, -0.2, sod);
  [-0.12, 0.12].forEach((x) => mesh(cyl(0.02, 0.02, 0.5, 8), SM(0x8a8a4a), 0.35, 0.25, x, sod));
  const tubo = grp(sod, 0.35, 0.45, 0); const bam = SM(0x9a9a4a, { roughness: 0.5 }); const tb = mesh(cyl(0.045, 0.045, 0.62, 12), bam, 0, 0, 0, tubo); tb.rotation.z = Math.PI / 2;
  const toc = [K.vitorias - 0.05, K.derrotas - 0.05, K.inimigos - 0.05];
  // o homem sentado na beira da varanda, com a xícara de chá
  const p = semRosto(); g.add(p); const u = p.userData;
  const cup = grp(g); mesh(cyl(0.04, 0.032, 0.07, 16), SM(0x6a7a6a, { roughness: 0.3 }), 0, 0.035, 0, cup); mesh(cyl(0.036, 0.036, 0.004, 16), SM(0xa8a060, { roughness: 0.2 }), 0, 0.062, 0, cup);
  const vap = steam(g, { n: 12, size: 0.05, rise: 0.07, grow: 1.4, opacity: 0.28, life: 2.4, spread: 0.03, wind: [0.01, 0, -0.01], color: 0xffffff });
  const SEAT = V3(0, 0, 1.42);
  return {
    bg: 0x2a2028, fog: [10, 40], fogCol: 0x6a4a5a, dome,
    look: { exposure: 1.05, bloom: 0.6, bloomT: 0.78, vig: 0.45, sat: 1.1, con: 1.05, lift: [0.01, 0.006, 0.012] },
    sun: { dir: [-0.8, 0.28, -0.6], col: 0xffa868, I: 1.5, c: [0, 0.5, -0.5], r: 6 }, hemi: { sky: 0x9a7aa0, ground: 0x3a2a2a, I: 0.55 }, fill: { col: 0xffc8a0, I: 0.15 }, rim: { col: 0xffc890, str: 0.55 }, hand: 0.006,
    update(t) {
      const red = smr(t, K.assassinatos - 0.3, K.assassinatos + 0.6);
      const U = dome.userData.u; U.uTop.value.setHex(0x2a2a5a).lerp(_col.setHex(0x2a0a14), red); U.uMid.value.setHex(0x8a5a7a).lerp(_col.setHex(0x8a1a24), red); U.uHor.value.setHex(0xf0a070).lerp(_col.setHex(0xff4a3a), red); U.uOff.value.set(t * 0.003, 0);
      sun.color.setHex(0xffa868).lerp(_col.setHex(0xff3a2a), red);
      lanL.color.setHex(0xffa040).lerp(_col.setHex(0xff2a1a), red); lbox.material.emissiveIntensity = 0.7; lanG.material.color.setHex(0xffb060).lerp(_col.setHex(0xff3a2a), red);
      drawRed(smr(t, K.assassinatos - 0.1, K.rotina + 0.2));
      // bambu-fonte: enche, inclina e bate (toc) nos três "sem…"
      let tilt = 0.18; toc.forEach((tt) => { const k = t - tt; if (k > -0.6 && k < 0) tilt = 0.18 - 0.32 * smr(t, tt - 0.6, tt); else if (k >= 0 && k < 0.5) tilt = -0.55 * (1 - E.out(k / 0.5)) + 0.18 * E.out(k / 0.5); });
      tubo.rotation.z = tilt;
      leaves.forEach((lf, i) => { const ph = ((t * 0.08 + hash(i * 3.3)) % 1), x0 = -1.3 + (hash(i) - 0.5) * 2.2, z0 = 0.2 + (hash(i * 5) - 0.5) * 1.8; lf.position.set(x0 + Math.sin(t * 0.9 + i) * 0.3 - ph * 1.2, 3.0 - ph * 3.0, z0 + Math.cos(t * 0.7 + i) * 0.25 + ph * 0.8); lf.rotation.set(t * 1.3 + i, t * 0.9 + i * 2, t * 0.6); lf.visible = ph < 0.98; });
      restPose(p); idle(p, t, 6, 0.5);
      p.position.copy(SEAT); p.rotation.set(0, Math.PI, 0);
      sitPose(p, 1, { seatY: 0.46, lean: -0.04 });
      plantFeet(p, [[SEAT.x + 0.13, 0.15, SEAT.z - 0.5], [SEAT.x - 0.13, 0.15, SEAT.z - 0.48]], Math.PI);
      // xícara nas duas mãos; no "feliz" leva ao rosto e bebe
      const sip = act(t, K.isso - 0.3, K.isso + 0.35, 0.1, 0.05) * (1 - smr(t, K.feliz + 0.3, K.feliz + 0.9));
      u.head.updateMatrixWorld(true);
      const lap = V3(SEAT.x, 0.82, SEAT.z - 0.36), face_ = u.head.localToWorld(V3(0, 0.03, 0.14));
      const cp = lap.clone().lerp(face_.add(V3(0, -0.07, 0)), clamp(sip)); cup.position.copy(cp); cup.rotation.set(-0.6 * Math.sin(Math.PI * smr(t, K.isso + 0.1, K.feliz + 0.4)), 0, 0);
      armIK(p, 0, cp.clone().add(V3(0.06, 0.05, 0.02)), V3(SEAT.x + 0.6, 0.4, SEAT.z + 0.2), 1); armIK(p, 1, cp.clone().add(V3(-0.06, 0.03, 0.02)), V3(SEAT.x - 0.6, 0.4, SEAT.z + 0.2), 1);
      curlHand(u.hands[0], 0.55, 0.4); curlHand(u.hands[1], 0.55, 0.4);
      u.neck.rotation.x -= 0.22 * Math.sin(Math.PI * smr(t, K.isso + 0.1, K.feliz + 0.4)); u.neck.rotation.x += 0.12 * (1 - clamp(sip));
      vap.upd(t, 1, cup.position.clone().add(V3(0, 0.08, 0)));
      molaHomem(p, t, () => [SEAT.x, 1.2, SEAT.z]);
    },
    cam(t) {
      return path2(t, [
        [a, [0.3, 2.4, -5.4], [0.1, 0.9, 1.2], 40],
        [K.objetivo + 0.2, [0.0, 1.55, -2.9], [0, 0.85, 1.4], 36],
        [K.inimigos + 0.3, [1.15, 1.2, -1.4], [0.4, 0.7, 1.2], 36],
        [K.feliz, [0.35, 1.32, -0.78], [0.02, 1.24, 1.5], 36],
        [K.assassinatos + 0.6, [0.55, 2.3, -1.0], [-0.6, 0.0, -1.8], 42],
        [b, [0.3, 2.9, -1.4], [-0.8, 0.0, -2.3], 44],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 9 · o rosto roubado: quarto de tatame; ele coloca uma máscara de porcelana com rosto; atrás do papel da porta, a família jantando em silhuetas
addSet("s9-rosto", (g) => {
  const [a, b] = T.sc["s9-rosto"];
  const tat = texTatami(); const tm = SM(0xffffff, { map: rep(tat.clone(), 3, 2), roughness: 0.9 }); tm.map.needsUpdate = true;
  mesh(box(6, 0.1, 5), tm, 0, -0.05, 0.5, g); mesh(box(6, 0.1, 5), SM(0x3a2a1e, { roughness: 0.8 }), 0, 2.45, 0.5, g);
  const wallM = SM(0xd8ccb4, { roughness: 0.95 });
  mesh(box(0.1, 2.5, 5), wallM, -2.5, 1.25, 0.5, g); mesh(box(0.1, 2.5, 5), wallM, 2.5, 1.25, 0.5, g);
  // parede do fundo: portas de papel (shoji) iluminadas por trás; a da direita desliza
  const shojiT = canvasTex(256, 512, (c, w, h) => { c.fillStyle = "#f2e2c0"; c.fillRect(0, 0, w, h); c.fillStyle = "#2a1a10"; for (let x = 0; x <= w; x += w / 4) c.fillRect(x - 3, 0, 6, h); for (let y = 0; y <= h; y += h / 8) c.fillRect(0, y - 3, w, 6); });
  const paperM = new THREE.MeshStandardMaterial({ map: shojiT, emissive: 0xffb060, emissiveMap: shojiT, emissiveIntensity: 0.6, roughness: 0.9, transparent: true, opacity: 0.62 });
  const panels = [-1.5, -0.5, 0.5, 1.5].map((x) => mesh(new THREE.PlaneGeometry(1.0, 2.0), paperM, x, 1.0, -1.95, g));
  mesh(box(4.2, 0.12, 0.1), SM(0x2a1a10), 0, 2.05, -1.95, g); mesh(box(4.2, 0.06, 0.1), SM(0x2a1a10), 0, 0.0, -1.95, g); mesh(box(0.8, 2.5, 0.1), wallM, -2.1, 1.25, -1.95, g); mesh(box(0.8, 2.5, 0.1), wallM, 2.1, 1.25, -1.95, g); mesh(box(4.2, 0.4, 0.1), wallM, 0, 2.3, -1.95, g);
  // sala de jantar atrás do papel: luz quente, mesa baixa e a família (silhuetas: esposa e filho)
  const back = new THREE.PointLight(0xffb060, 3.0, 8, 1.4); back.position.set(0.1, 1.5, -3.6); g.add(back);
  mesh(box(5, 0.1, 3), SM(0x6a4a2a), 0, -0.05, -3.5, g); mesh(box(5, 2.5, 0.1), SM(0xc8a878), 0, 1.25, -5.0, g);
  mesh(box(1.3, 0.06, 0.45), new THREE.MeshBasicMaterial({ color: 0x120a08 }), 0.1, 0.36, -2.22, g); [[-0.5, -2.1], [0.7, -2.1]].forEach(([x, z]) => mesh(box(0.05, 0.36, 0.05), new THREE.MeshBasicMaterial({ color: 0x120a08 }), x, 0.18, z, g));
  const esposa = silhueta({ hairStyle: "longo", hairLen: 1.3, seed: 91, jacket: null }), filho = silhueta({ scale: 0.68, hairStyle: "curto", seed: 92, jacket: null });
  g.add(esposa, filho); esposa.position.set(-0.42, 0, -2.2); esposa.rotation.y = Math.PI / 2; filho.position.set(0.72, 0, -2.2); filho.rotation.y = -Math.PI / 2;
  const sombra = grp(g, 0, 0, -1.935); sombra.scale.z = 0.02; const shM = new THREE.MeshBasicMaterial({ color: 0x2a1206, transparent: true, opacity: 0.8, depthWrite: false, fog: false });
  const dup = (src) => { const d = silhueta(src === esposa ? { hairStyle: "longo", hairLen: 1.3, seed: 91, jacket: null } : { scale: 0.68, hairStyle: "curto", seed: 92, jacket: null }); d.traverse((c) => { if (c.isMesh) { c.material = shM; c.renderOrder = 12; } }); sombra.add(d); return d; };
  const shE = dup(esposa), shF = dup(filho); esposa.visible = filho.visible = false;
  mesh(box(0.85, 0.06, 0.4), shM, 0.15, 0.36, 0, sombra).renderOrder = 12; [[-0.22], [0.52]].forEach(([x]) => { const lg = mesh(box(0.05, 0.36, 0.4), shM, x, 0.18, 0, sombra); lg.renderOrder = 12; });
  const tigS = mesh(sph(0.07, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), shM, 0, 0, 0, sombra); tigS.rotation.x = Math.PI; tigS.renderOrder = 12;
  const tigela = mesh(sph(0.07, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x120a08 }), 0, 0, 0, g); tigela.rotation.x = Math.PI;
  // penteadeira com espelho; a máscara de porcelana com rosto num suporte
  const pen_ = grp(g, -2.15, 0, 0.2); mesh(box(0.5, 0.42, 1.0), SM(0x4a2a1a, { roughness: 0.5 }), 0, 0.21, 0, pen_); const esp = mesh(box(0.04, 0.9, 0.6), SM(0x2a1a10), -0.15, 0.95, 0, pen_);
  mesh(new THREE.PlaneGeometry(0.52, 0.8), new THREE.MeshStandardMaterial({ color: 0x8090a0, roughness: 0.05, metalness: 0.9 }), -0.12, 0.95, 0, pen_).rotation.y = Math.PI / 2;
  const maskTex = canvasTex(512, 512, (c, w, h) => { c.fillStyle = "#f0e6d6"; c.fillRect(0, 0, w, h); const cx = w / 2;
    const rg = (x, y, r, col) => { const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, col); gg.addColorStop(1, "rgba(240,230,214,0)"); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); };
    [-1, 1].forEach((s) => { rg(cx + s * 70, 300, 60, "rgba(230,150,140,.35)"); c.fillStyle = "#1a1210"; c.beginPath(); c.ellipse(cx + s * 62, 250, 30, 13, 0, 0, 7); c.fill(); c.fillStyle = "#f8f4ee"; c.beginPath(); c.ellipse(cx + s * 62 - 4, 247, 7, 5, 0, 0, 7); c.fill(); c.strokeStyle = "#3a2a20"; c.lineWidth = 7; c.beginPath(); c.moveTo(cx + s * 30, 212); c.quadraticCurveTo(cx + s * 62, 198, cx + s * 98, 214); c.stroke(); });
    c.strokeStyle = "rgba(150,100,90,.55)"; c.lineWidth = 5; c.beginPath(); c.moveTo(cx - 6, 262); c.quadraticCurveTo(cx - 14, 318, cx - 18, 332); c.quadraticCurveTo(cx, 344, cx + 18, 332); c.stroke();
    c.strokeStyle = "#a85a52"; c.lineWidth = 9; c.beginPath(); c.moveTo(cx - 42, 380); c.quadraticCurveTo(cx, 392, cx + 42, 380); c.stroke(); }, { redraw: true });
  const maskGeo = new THREE.SphereGeometry(1, 32, 24, Math.PI * 0.08, Math.PI * 0.84, Math.PI * 0.12, Math.PI * 0.68); maskGeo.scale(0.083, 0.11, 0.1); maskGeo.translate(0, 0.11, 0.004);
  const uvM = maskGeo.attributes.uv; for (let i = 0; i < uvM.count; i++) uvM.setXY(i, uvM.getX(i), uvM.getY(i));
  const mask = mesh(maskGeo, new THREE.MeshStandardMaterial({ map: maskTex, roughness: 0.32, side: THREE.DoubleSide }), 0, 0, 0, g); mask.castShadow = false;
  const MASK0 = V3(-2.02, 0.62, 0.2); const sup = grp(g, MASK0.x, 0.42, MASK0.z); mesh(cyl(0.01, 0.01, 0.2, 6), SM(0x2a1a10), 0, 0.1, 0, sup); mesh(cyl(0.06, 0.06, 0.02, 12), SM(0x2a1a10), 0, 0.01, 0, sup);
  // relógio na parede da direita (no fim volta no tempo), janela com a sirene da polícia
  const clock = relogioParede(g, 2.44, 1.75, 0.6, 0.22); clock.c.rotation.y = -Math.PI / 2;
  const sirR = new THREE.PointLight(0xff2a2a, 0, 6, 1.4), sirB = new THREE.PointLight(0x2a5aff, 0, 6, 1.4); sirR.position.set(2.0, 1.6, 2.2); sirB.position.set(2.0, 1.6, 1.4); g.add(sirR, sirB);
  const luz = new THREE.PointLight(0xffd8a8, 0.8, 5, 1.6); luz.position.set(0, 2.2, 0.8); g.add(luz);
  const keyM = new THREE.PointLight(0xffe0c0, 1.3, 3, 1.6); keyM.position.set(-1.7, 1.75, 1.0); g.add(keyM);
  // o homem: em pé, de frente para a penteadeira; pega a máscara, coloca no rosto, vai até a porta e a abre
  const p = semRosto(); g.add(p); const u = p.userData;
  const P0 = V3(-1.25, 0, 0.25), tPick = K.roubou - 0.35, tWear = K.rosto + 0.25, tTurn = K.outro - 0.2, tGo = K.continuar - 0.6, tOpen = K.tranquilo - 0.1;
  const DG = 1.25, LG = gaitFit(DG, 0.55);
  return {
    bg: 0x0c0806, fog: [8, 30], fogCol: 0x0c0806,
    look: { exposure: 1.1, bloom: 0.6, bloomT: 0.78, vig: 0.55, sat: 1.04, con: 1.07, lift: [0.01, 0.006, 0.004] },
    sun: { dir: [0.3, 1, 0.6], col: 0xffe0c0, I: 0.2, c: [-0.5, 1, -0.5], r: 4 }, hemi: { sky: 0x8a6a50, ground: 0x2a1a10, I: 0.35 }, fill: { col: 0xffc890, I: 0.15, dir: [0, 0.3, -1] }, rim: { col: 0xffc890, str: 0.55 }, hand: 0.006,
    update(t) {
      const sir = smr(t, K.descoberto - 0.25, K.descoberto) * (1 - smr(t, K.rosto, K.rosto + 0.6)), ph = Math.floor(t * 5) % 2;
      sirR.intensity = 3.5 * sir * (ph ? 1 : 0.15); sirB.intensity = 3.5 * sir * (ph ? 0.15 : 1);
      // relógio volta no tempo no "continuar"
      const rew = smr(t, K.continuar - 0.2, K.tranquilo + 0.4); clock.set(19.5 + (t - a) / 60 - rew * 1.2);
      // a família: a esposa serve a tigela, o filho vira a cabeça
      [esposa, filho].forEach((s, i) => { restPose(s); sitPose(s, 1, { seatY: 0.16, lean: 0.05 }); idle(s, t, 20 + i, 0.6); });
      const serve = act(t, K.esposa - 0.2, K.esposa + 0.6, 0.1, 0.05) * (1 - smr(t, K.filho + 0.5, K.filho + 1.0));
      esposa.updateMatrixWorld(true); const bowl = V3(-0.12 + 0.3 * clamp(serve), 0.43, -2.2);
      armIK(esposa, 1, bowl.clone().add(V3(0, 0.05, 0.05)), V3(-0.6, 0.3, -1.6), clamp(serve * 1.3)); armIK(esposa, 0, bowl.clone().add(V3(0, 0.05, -0.05)), V3(-0.6, 0.3, -2.8), clamp(serve * 1.3));
      tigela.position.copy(bowl).add(V3(0, -0.01, 0)); tigS.position.set(bowl.x, bowl.y - 0.01, 0);
      [[esposa, shE], [filho, shF]].forEach(([src, d]) => { copyPose(src, d); d.position.set(src.position.x, 0, 0); d.visible = true; });
      const look = act(t, K.filho - 0.2, K.filho + 0.4, 0.1, 0.05); filho.userData.neck.rotation.y += 0.6 * clamp(look); filho.userData.head.rotation.x -= 0.1 * clamp(look);
      // o homem
      restPose(p); idle(p, t, 8, 0.6);
      const walkK = smr(t, tGo, tGo + 0.05), dd = andarAte(t, tGo, tOpen, DG, 0.6);
      if (t < tGo) { p.position.copy(P0); p.rotation.set(0, -Math.PI / 2 + 0.25 * smr(t, tTurn, tTurn + 0.6) * 0, 0); standFeet(p); }
      else gait(p, dd, { from: [P0.x, 0, P0.z], path: (d) => { const k = clamp(d / DG); return [P0.x + 0.55 * k, P0.z - 1.15 * k, lerp(-Math.PI / 2, Math.PI, sm(clamp(d / 0.6)))]; }, step: LG, amt: 0.9 });
      // pega a máscara (mão direita), leva ao rosto e encaixa; vira a cabeça para a porta
      const grab = act(t, tPick, tPick + 0.5, 0.1, 0.05), wear = smr(t, tPick + 0.55, tWear);
      u.head.updateMatrixWorld(true);
      const onFace = wear >= 1;
      if (!onFace) { const hold = MASK0.clone().lerp(u.head.localToWorld(V3(0, 0.11, 0.22)), sm(wear)); mask.position.copy(hold); const q = new THREE.Quaternion(); u.head.getWorldQuaternion(q); const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)); mask.quaternion.copy(q0.slerp(q, sm(wear))); mask.scale.setScalar(1); if (mask.parent !== g) g.add(mask); }
      else if (mask.parent !== u.head) { u.head.add(mask); }
      if (onFace) { mask.position.set(0, 0, 0.012); mask.quaternion.identity(); mask.scale.set(1.04, 1.02, 1.08); }
      const reach = clamp(grab) * (1 - smr(t, tWear, tWear + 0.4));
      if (reach > 0.001) { const hp = onFace ? u.head.localToWorld(V3(0.04, 0.11, 0.16)) : mask.getWorldPosition(V3()).add(V3(0.02, 0, 0.05)); armIK(p, 0, hp, wpos(u.chest).add(V3(0, -0.4, 0.8)), reach); curlHand(u.hands[0], 0.5 * reach); if (wear > 0.2) { armIK(p, 1, hp.clone().add(V3(0, 0, -0.12)), wpos(u.chest).add(V3(0, -0.4, -0.8)), reach * 0.8); } }
      const tc = act(t, tWear + 0.05, tWear + 0.6, 0.1, 0.06) * (1 - smr(t, K.casa8 - 0.5, K.casa8)), tl = act(t, K.casa8 - 0.45, K.casa8 + 0.2, 0.1, 0.05) * (1 - walkK);
      if (tc > 0.001) { lookAtW(p, V3(-0.3, 1.55, 1.8), clamp(tc), 1.4); u.chest.rotation.y -= 0.25 * clamp(tc); }
      if (tl > 0.001) lookAtW(p, V3(0.5, 1.3, -1.9), clamp(tl), 1.2);
      // abre a porta de papel da direita (desliza) no fim
      const op = act(t, tOpen, tOpen + 0.7, 0.06, 0.04); panels[2].position.x = 0.5 + 0.95 * clamp(op);
      if (op > 0.01) { armIK(p, 0, V3(panels[2].position.x - 0.45, 1.05, -1.9), wpos(u.chest).add(V3(0.6, -0.5, 0.4)), clamp(op * 2) * (1 - smr(t, tOpen + 0.8, tOpen + 1.2))); }
      back.intensity = 3.0 + 1.5 * clamp(op);
      molaHomem(p, t, (tt) => { const d2 = andarAte(tt, tGo, tOpen, DG, 0.6), k = clamp(d2 / DG); return [P0.x + 0.55 * k, 1.3, P0.z - 1.15 * k]; });
    },
    cam(t) {
      return path2(t, [
        [a, [0.6, 1.6, 2.6], [-1.3, 1.2, 0.2], 40],
        [K.roubou + 0.2, [-1.5, 1.62, 1.5], [-1.45, 1.52, 0.2], 34],
        [K.rosto + 0.9, [-0.85, 1.72, 1.55], [-1.3, 1.95, 0.25], 34],
        [K.casa8 + 0.3, [0.9, 1.45, 2.1], [0.0, 1.0, -2.0], 38],
        [K.filho + 0.3, [0.75, 1.4, 1.9], [0.15, 0.9, -2.2], 37],
        [b, [0.45, 1.55, 2.6], [-0.3, 1.0, -2.0], 40],
      ]);
    },
  };
});

// ---------------------------------------------------------------- 10 · o beco das almas: viela à noite, lanternas, chão molhado; ele olha pra trás e mãos de luz o arrastam para o escuro; depois a câmera sobe até o céu
function maoFantasma(g, mat) {
  const a = grp(g); const fore = mesh(cap(0.045, 1, 4, 10), mat, 0, 0.5, 0, a); fore.castShadow = false;
  const hd = grp(a, 0, 1.0, 0); mesh(sph(1, 12, 10), mat, 0, 0.05, 0, hd).scale.set(0.045, 0.06, 0.022);
  const fs = [-0.025, -0.008, 0.009, 0.026].map((x) => { const f = grp(hd, x, 0.1, 0); mesh(cap(0.009, 0.05, 3, 6), mat, 0, 0.03, 0, f); return f; });
  const th = grp(hd, 0.04, 0.04, 0.01); th.rotation.z = -0.8; mesh(cap(0.01, 0.04, 3, 6), mat, 0, 0.025, 0, th);
  return { a, fore, hd, fs };
}
function maoPoe(m, base, tip, curl) {
  const d = tip.clone().sub(base), L = Math.max(0.05, d.length());
  m.a.position.copy(base); m.a.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize());
  m.fore.scale.set(1, L / 1.0, 1); m.fore.position.y = L / 2; m.hd.position.y = L;
  m.fs.forEach((f) => (f.rotation.x = -curl * 1.4));
}
addSet("s10-beco", (g) => {
  const [a, b] = T.sc["s10-beco"];
  const dome = skyDome(g, { top: 0x02040c, mid: 0x0a1028, hor: 0x1a1c30, ground: 0x02030a, exp: 0.6, sunDir: [0.1, 0.4, -1], sunCol: 0xc8d8ff, sunI: 0.0, disk: 0.5, cov: 0.6, cloudA: 0.5, cloudLit: 0x5a6a90, cloudSh: 0x10182a, stars: 1.0, cloudScale: 0.14 });
  lua(g, [-8, 60, -150], 12);
  cidadeLonge(g, -330, 60, { hmax: 62, span: 820 });
  // chão molhado com poças; prédios dos dois lados com janelas, placas, canos, ar-condicionado
  const wetT = canvasTex(512, 512, (c, w, h) => { c.fillStyle = "#1c1c22"; c.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { c.fillStyle = "rgba(8,8,12,.85)"; c.beginPath(); c.ellipse(hash(i) * w, hash(i * 3) * h, 20 + hash(i * 5) * 60, 10 + hash(i * 7) * 30, hash(i) * 3, 0, 7); c.fill(); } for (let i = 0; i < 800; i++) { c.fillStyle = `rgba(90,90,100,${hash(i) * 0.25})`; c.fillRect(hash(i * 3) * w, hash(i * 5) * h, 2, 2); } });
  const fl = mesh(new THREE.PlaneGeometry(3.4, 40), SM(0xffffff, { map: rep(wetT, 1, 10), roughness: 0.16, metalness: 0.35 }), 0, 0, -12, g); fl.rotation.x = -Math.PI / 2;
  const bldTex = (c1, seed) => canvasTex(256, 512, (c, w, h) => { c.fillStyle = c1; c.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(0,0,0,${hash(i + seed) * 0.12})`; c.fillRect(hash(i * 3 + seed) * w, hash(i * 5 + seed) * h, 6, 6 + hash(i * 7) * 30); } for (let y = 60; y < h; y += 110) for (let x = 30; x < w - 40; x += 90) { const lit = hash2(x + seed, y) > 0.72; c.fillStyle = lit ? "#ffcf8a" : "#141820"; c.fillRect(x, y, 50, 60); c.fillStyle = "#3a3a40"; c.fillRect(x - 3, y + 60, 56, 5); } });
  const signs = ["居酒屋", "スナック", "ラーメン", "麻雀", "BAR", "喫茶"];
  [-1, 1].forEach((k) => { for (let i = 0; i < 6; i++) { const z = 3 - i * 4.2, h = 6 + hash(i * 7 + k) * 5; const m = mesh(box(3, h, 4.1), SM(0xffffff, { map: bldTex(["#5a5450", "#4a4e54", "#6a5a4a", "#545a50"][(i + (k > 0 ? 1 : 0)) % 4], i * 13 + k), roughness: 0.9 }), k * 3.2, h / 2, z, g);
      const sg = canvasTex(64, 256, (c, w, h2) => { c.fillStyle = ["#c81e2a", "#1a1a1a", "#f2e8d0", "#2a4a8a"][(i + k + 4) % 4]; c.fillRect(0, 0, w, h2); c.fillStyle = (i + k) % 4 === 2 ? "#1a1a1a" : "#fff"; c.font = "700 46px sans-serif"; c.textAlign = "center"; const s = signs[(i * 2 + (k > 0 ? 1 : 0)) % signs.length]; [...s].forEach((ch, j) => c.fillText(ch, w / 2, 52 + j * 52)); }, { redraw: true });
      const sp = mesh(box(0.06, 1.2, 0.34), new THREE.MeshStandardMaterial({ color: 0xffffff, map: sg, emissive: 0xffffff, emissiveMap: sg, emissiveIntensity: 0.55, roughness: 0.5 }), k * 1.62, 2.6 + hash(i) * 1.2, z + 1.0, g);
      mesh(box(0.5, 0.36, 0.3), SM(0xd0ccc4, { roughness: 0.6 }), k * 1.52, 0.9 + hash(i * 3) * 1.8, z - 0.8, g);
      mesh(cyl(0.04, 0.04, h, 8), SM(0x5a5a5e, { metalness: 0.5 }), k * 1.66, h / 2, z - 1.6, g); } });
  // lanternas de papel (apagam uma a uma conforme ele é arrastado), fios por cima, vapor de um respiro
  const lanTex = canvasTex(64, 128, (c, w, h) => { c.fillStyle = "#ff3a2a"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(0,0,0,.2)"; for (let y = 8; y < h; y += 12) c.fillRect(0, y, w, 2); c.fillStyle = "#fff"; c.font = "700 34px sans-serif"; c.textAlign = "center"; c.fillText("祭", w / 2, h / 2 + 12); });
  const lans = []; for (let i = 0; i < 8; i++) { const k = i % 2 ? 1 : -1, z = 2.4 - i * 1.6; const lg = grp(g, k * 1.35, 2.5, z); mesh(cyl(0.004, 0.004, 0.4, 4), SM(0x1a1a1a), 0, 0.3, 0, lg);
    const lm = new THREE.MeshStandardMaterial({ map: lanTex, emissive: 0xff6a3a, emissiveMap: lanTex, emissiveIntensity: 1.2, roughness: 0.8 });
    const body = mesh(sph(0.2, 16, 12), lm, 0, 0, 0, lg); body.scale.set(1, 1.35, 1); mesh(cyl(0.12, 0.12, 0.04, 12), SM(0x1a1a1a), 0, 0.27, 0, lg); mesh(cyl(0.12, 0.12, 0.04, 12), SM(0x1a1a1a), 0, -0.27, 0, lg);
    const L_ = i < 5 ? new THREE.PointLight(0xff7a4a, 1.6, 5, 1.6) : null; if (L_) lg.add(L_); const gl_ = glowSprite(0xff7a4a, 0.9, 0.5); lg.add(gl_); lans.push({ lg, lm, L: L_, gl: gl_, z }); }
  for (let i = 0; i < 6; i++) fio(g, [-1.6, 5.5 + hash(i) * 1.5, 2 - i * 3.3], [1.6, 5.2 + hash(i * 3) * 1.5, 1.2 - i * 3.3], 0.3, 0.01);
  const vapor = steam(g, { origin: [1.35, 0.1, -3.6], n: 22, size: 0.5, rise: 0.4, grow: 2.2, opacity: 0.16, life: 4.5, spread: 0.2, wind: [-0.05, 0, 0.04], color: 0xb8c0d0 });
  const fundo = glowSprite(0x6a5aa8, 6, 0.25, ADD); fundo.position.set(0, 1.6, -15); g.add(fundo);
  // o homem e as mãos de luz
  const p = semRosto(); g.add(p); const u = p.userData;
  const ghostM = new THREE.MeshStandardMaterial({ color: 0xcfd6ff, emissive: 0xa8b4ff, emissiveIntensity: 0.9, transparent: true, opacity: 0.78, roughness: 0.4, depthWrite: false });
  const maos = []; for (let i = 0; i < 12; i++) maos.push(maoFantasma(g, ghostM));
  const ghostL = new THREE.PointLight(0xa8b4ff, 0, 5, 1.5); g.add(ghostL);
  const Z0 = 2.4, D = 2.6, L = gaitFit(D, 0.62), tStop = K.morreu - 0.05, tLook = K.morreu + 0.2, tGrab = K.alma - 0.1, tDrag = K.arrastada - 0.05, tGone = K.paz9b + 0.15;
  const distF = (t) => andarAte(t, a - 0.6, tStop, D, 1.2);
  const dragZ = (t) => { const k = clamp((t - tDrag) / (tGone - tDrag)); return Z0 - D - 9.5 * E.in(k) - 0.5 * k; };
  const ATT = [["ankle", 0, [0, 0, 0]], ["ankle", 1, [0, 0, 0]], ["knee", 0, [0, 0, 0.05]], ["knee", 1, [0, 0, 0.05]], ["wr", 0, [0, 0, 0]], ["wr", 1, [0, 0, 0]], ["hips", -1, [0.1, 0, -0.1]], ["hips", -1, [-0.1, 0, -0.1]], ["chest", -1, [0.12, 0.1, -0.12]], ["chest", -1, [-0.12, 0.1, -0.12]], ["spine", -1, [0, 0, -0.14]], ["chest", -1, [0, 0.25, -0.1]]];
  return {
    bg: 0x04040a, fog: [5, 17], fogCol: 0x05050c, dome,
    look: { exposure: 1.15, bloom: 0.9, bloomT: 0.6, bloomR: 0.6, vig: 0.55, sat: 1.05, con: 1.08, lift: [0.008, 0.006, 0.022] },
    sun: { dir: [0.2, 0.9, -0.4], col: 0x8a9ad8, I: 0.45, c: [0, 0, -1], r: 8 }, hemi: { sky: 0x2a3050, ground: 0x0a0a10, I: 0.35 }, fill: { col: 0x6a70c0, I: 0.1 }, rim: { col: 0xd0c8ff, str: 0.6 }, hand: 0.009,
    update(t) {
      dome.userData.u.uOff.value.set(t * 0.002, 0);
      vapor.upd(t, 1);
      const sky = smr(t, tGone, K.voce + 1.5); scene.fog.near = lerp(5, 60, sky); scene.fog.far = lerp(17, 520, sky); scene.fog.color.setHex(0x05050c).lerp(_col.setHex(0x0a1024), sky);
      const zNow = t < tDrag ? Z0 - distF(t) : dragZ(t);
      lans.forEach((ln, i) => { const off = smr(t, tDrag + 0.25 + i * 0.32, tDrag + 0.4 + i * 0.32); const fl = 1 - off; ln.lm.emissiveIntensity = 1.2 * fl * (0.9 + 0.1 * noise1(t * 7 + i)); if (ln.L) ln.L.intensity = 1.6 * fl; ln.gl.material.opacity = 0.5 * fl; ln.lg.rotation.z = Math.sin(t * 1.3 + i) * 0.05; });
      restPose(p);
      if (t < tDrag) {
        gait(p, distF(t), { from: [0, 0, Z0], ang: Math.PI, step: L, amt: 0.9 });
        idle(p, t, 12, 0.3 + 0.7 * clamp((t - tStop) / 0.4));
        // olha pra trás por cima do ombro (a regra do beco)
        const lk = act(t, tLook, tLook + 0.65, 0.12, 0.08);
        if (lk > 0) { u.spine.rotation.y += 0.4 * lk; u.chest.rotation.y += 0.55 * lk; u.neck.rotation.y += 0.55 * lk; u.head.rotation.y += 0.35 * lk; }
      } else {
        // arrastado para trás: pés fora do chão, corpo inclinado, braços estendidos para a câmera
        const k = clamp((t - tDrag) / 0.5);
        p.position.set(Math.sin(t * 3) * 0.04 * k, 0.12 * k, zNow); p.rotation.set(0, Math.PI, 0);
        pose(p, { spine: [-0.45 * k, 0.3, 0], chest: [-0.2 * k, 0.3, 0], neck: [-0.25 * k, 0.4, 0], legR: [0.25 * k, 0, 0, 0.3 * k, 0.4], legL: [0.1 * k, 0, 0, 0.5 * k, 0.4], armR: [-2.3 * k, 0, -0.4, -0.2], armL: [-2.0 * k, 0, 0.5, -0.4], handR: 0.2, handL: 0.4 }, 1);
        u.sh.forEach((s_, i) => (s_.rotation.x += Math.sin(t * 9 + i * 2) * 0.12 * k));
      }
      // mãos: brotam do chão em volta dele, agarram tornozelos, joelhos, pulsos, cintura e paletó, e puxam
      p.updateMatrixWorld(true);
      const rise = smr(t, tGrab - 0.15, tGrab + 0.45), dragK = smr(t, tDrag, tDrag + 0.6);
      maos.forEach((m, i) => {
        const [part, idx, off] = ATT[i], node = idx >= 0 ? u[part][idx] : u[part];
        const tip = node.localToWorld(V3(...off));
        const sideX = (i % 2 ? 1 : -1) * (0.35 + hash(i) * 0.6), base = V3(sideX * (1 - dragK * 0.4), 0, zNow - 0.4 - hash(i * 3) * 0.8 - dragK * (0.8 + hash(i) * 1.2));
        const reachTip = base.clone().lerp(tip, clamp((rise - i * 0.03) * 1.2));
        m.a.visible = rise > 0.02 && t < tGone + 0.6;
        maoPoe(m, base, reachTip, clamp(rise * 1.6 - 0.6));
      });
      ghostM.opacity = 0.78 * rise * (1 - smr(t, tGone - 0.3, tGone + 0.5)); ghostM.emissiveIntensity = 0.9 + 0.3 * noise1(t * 6);
      ghostL.position.set(0, 0.8, zNow - 0.3); ghostL.intensity = 2.2 * rise * (1 - smr(t, tGone - 0.3, tGone + 0.5));
      p.visible = t < tGone + 0.5;
      molaHomem(p, t, (tt) => [0, 1.3, tt < tDrag ? Z0 - distF(tt) : dragZ(tt)]);
    },
    cam(t) {
      return path2(t, [
        [a, [0.55, 1.65, 6.2], [0, 1.3, 0.0], 40],
        [tStop, [0.42, 1.58, 3.2], [0, 1.35, -0.6], 36],
        [tLook + 0.5, [0.6, 1.52, 1.85], [-0.05, 1.5, -0.25], 34],
        [tDrag + 1.4, [0.3, 1.4, 1.75], [0, 1.0, -4.2], 38],
        [tGone, [0.25, 1.6, 1.4], [0, 1.0, -9.0], 38],
        [K.voce + 1.2, [0.2, 6.5, 1.5], [0, 8.0, -30], 42],
        [b, [0.15, 12.5, 0.5], [-2, 30, -120], 42],
      ]);
    },
  };
});
// ---------------------------------------------------------------- fim (versão Remotion): sem eventos, devolve renderAt e ready
function sceneAt(t) { for (const [n, a, b] of T.scenes) if (t >= a && t < b) return n; return T.scenes[T.scenes.length - 1][0]; }
const _sd = new THREE.Vector3(), _col = new THREE.Color();
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

const ready = (async () => {
  try { await document.fonts.ready; } catch (e) { }
  if (window.HF_PRELOAD) { try { await Promise.all(window.HF_PRELOAD); } catch (e) { } }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  try { await renderer.compileAsync(scene, camera); } catch (e) { }
})();
return { renderAt, ready, dispose: () => renderer.dispose() };
}
