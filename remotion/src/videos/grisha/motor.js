// @ts-nocheck
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
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
// luz de rosto: presa na câmera, quente e suave (look.rosto), pra pele nunca ficar cinza/azulada nos closes
const luzRosto = new THREE.PointLight(0xffe4d2, 0, 3.5, 2); luzRosto.position.set(0.35, 0.25, 0.1); camera.add(luzRosto);

const rt0 = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: window.HF_MSAA ?? 4 });
const composer = new EffectComposer(renderer, rt0);
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
// profundidade de campo (fundo desfocado), ligada por cena em look.dof = { ap, max }; o foco vem da câmera (c.focus ou distância até o alvo)
const bokeh = new BokehPass(scene, camera, { focus: 5, aperture: 0.004, maxblur: 0.01 }); bokeh.enabled = false; composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.6, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.35 }, uGrain: { value: 0.03 }, uCA: { value: 0.004 },
    uSat: { value: 1.05 }, uCon: { value: 1.04 }, uLift: { value: new THREE.Vector3(0.0, 0.0, 0.0) }, uGain: { value: new THREE.Vector3(1, 1, 1) },
    uFlash: { value: 0 }, uFlashCol: { value: new THREE.Vector3(1, 1, 1) }, uFade: { value: 0 }, uFadeCol: { value: new THREE.Vector3(0, 0, 0) },
    uBlur: { value: new THREE.Vector2(0, 0) }, // borrão de movimento numa direção (transição de chicote); 0 = desligado
  },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uVig, uGrain, uCA, uSat, uCon, uFlash, uFade; uniform vec3 uLift, uGain, uFlashCol, uFadeCol; uniform vec2 uBlur; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5; float r2 = dot(c, c);
      vec2 o = c * uCA * r2 * 4.0;
      vec3 col;
      if (uBlur.x != 0.0 || uBlur.y != 0.0) { col = vec3(0.0); for (int i = 0; i < 24; i++) { float f = float(i) / 23.0 - 0.5; col += texture2D(tDiffuse, vUv + uBlur * f).rgb; } col /= 24.0; }
      else col = vec3(texture2D(tDiffuse, vUv + o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - o).b);
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

// ================================================================ personagens low-poly v7 (estilo da animação de referência, GUIA-ANIMACAO-ESTILO.md)
// Calibrado reconstruindo o Eren criança da própria animação e comparando lado a lado, no mesmo ângulo dos quadros de 9 s e 12 s.
// Rosto: retângulo em cima (laterais retas até o nariz) que afina num "U" comprido até um queixo estreito; frente plana e quinas marcadas. Medido nos rostos
//   de frente do vídeo (Kruger, Eren adulto, Eren criança, Armin). Olhos grandes de anime, nariz em pirâmide 3D, sobrancelhas
//   grossas, boca curta, blush. Os traços são decalques curvos que acompanham a pele.
// Cabelo: uma touca justa feita de MECHAS em triângulo com aresta no meio, saindo do redemoinho no topo e terminando em dentes
//   (franja, têmporas, nuca), mais alguns tufos largos no alto. Pouco volume, como no vídeo.
// Usa o mesmo esqueleto do motor: pose, idle, gait, standFeet e IK continuam funcionando.
const LPM = {};
function LPmat(color, o = {}) {
  const key = color + JSON.stringify(o); if (LPM[key]) return LPM[key];
  const m = new THREE.MeshStandardMaterial({ color, flatShading: !o.liso, roughness: o.rough ?? 0.8, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide, emissive: o.emis ?? 0x000000, emissiveIntensity: o.ei ?? 0 });
  return (LPM[key] = rimify(m, o.rim ?? 0.9));
}
const corCSS = (hex, dl = 0) => { const c = new THREE.Color(hex); if (dl) c.offsetHSL(0, 0, dl); return "#" + c.getHexString(); };
function decalMat(tex, o = {}) {
  if (o.basico) return new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, color: o.cor ?? 0xffffff, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  if (o.suave) return new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  return new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: o.rough ?? 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: o.ei ?? 0.1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
}
const ESP = new Map();
function espelho(tex) { if (ESP.has(tex)) return ESP.get(tex); const t = tex.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; t.needsUpdate = true; ESP.set(tex, t); return t; }
function decal(parent, tex, w, h, x, y, z, ry = 0, rz = 0, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), decalMat(o.espelho ? espelho(tex) : tex, o)); m.position.set(x, y, z); m.rotation.set(0, ry, rz);
  m.castShadow = false; m.receiveShadow = false; m.userData.isDecal = true; m.renderOrder = o.suave ? 3 : 2; parent.add(m); return m;
}
// decal curvo: a malha acompanha a superfície (zFn(x, y) = z da pele no espaço do pai), assim nada "entra" na pele
// quando o rosto é curvo. (x0, y0) = posição do decal no pai.
function decalSup(parent, tex, w, h, x0, y0, zFn, o = {}) {
  const g = new THREE.PlaneGeometry(w, h, o.sx ?? 12, o.sy ?? 4), pa = g.attributes.position, dz = o.dz ?? 0.0028;
  for (let i = 0; i < pa.count; i++) pa.setZ(i, zFn(x0 + pa.getX(i), y0 + pa.getY(i)) + dz);
  pa.needsUpdate = true; g.computeVertexNormals();
  const m = new THREE.Mesh(g, decalMat(o.espelho ? espelho(tex) : tex, o)); m.position.set(x0, y0, 0);
  m.castShadow = false; m.receiveShadow = false; m.userData.isDecal = true; m.renderOrder = o.suave ? 3 : 2; parent.add(m); return m;
}
// normais com vinco: suaves entre faces parecidas, quebradas nas quinas (o "low-poly liso" da referência)
function vincoNormais(geo, ang = 0.6) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(), pos = g.attributes.position, n = pos.count, fn = [], mapa = new Map();
  const chave = (i) => `${pos.getX(i).toFixed(5)},${pos.getY(i).toFixed(5)},${pos.getZ(i).toFixed(5)}`;
  const a = V3_(), b = V3_(), c = V3_();
  for (let f = 0; f < n; f += 3) {
    a.fromBufferAttribute(pos, f); b.fromBufferAttribute(pos, f + 1); c.fromBufferAttribute(pos, f + 2);
    fn.push(V3_().subVectors(c, b).cross(V3_().subVectors(a, b)).normalize());
    for (let k = 0; k < 3; k++) { const kk = chave(f + k); if (!mapa.has(kk)) mapa.set(kk, []); mapa.get(kk).push(f / 3); }
  }
  const cs = Math.cos(ang), nor = new Float32Array(n * 3), acc = V3_();
  for (let i = 0; i < n; i++) {
    const me = fn[Math.floor(i / 3)]; acc.set(0, 0, 0);
    for (const fj of mapa.get(chave(i))) if (fn[fj].dot(me) >= cs) acc.add(fn[fj]);
    if (acc.lengthSq() < 1e-10) acc.copy(me.lengthSq() > 0 ? me : V3_(0, 1, 0)); acc.normalize();
    nor[i * 3] = acc.x; nor[i * 3 + 1] = acc.y; nor[i * 3 + 2] = acc.z;
  }
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  return g;
}

// ---------------------------------------------------------------- texturas do rosto
const EYT = {};
// olho de anime da referência (o Eren criança, medido quadro a quadro): abertura alta e redonda; o traço de cima é um arco
// alto e grosso que desce pelos dois cantos (o externo desce mais, em gancho); íris enorme (~70% da largura) com o topo
// escondido sob o traço, anel escuro, raios claros, pupila e dois brilhos; linha de baixo fina e o vinco fino acima do olho.
// alt < 1 deixa o olho mais baixo (adultos, olhar sério).
function olhoTex(iris, o = {}) {
  const k = iris + JSON.stringify(o); if (EYT[k]) return EYT[k];
  return (EYT[k] = canvasTex(256, 200, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const al = o.alt ?? 1, L = 32, R = 224, T = 104 - 66 * al, B = 104 + 62 * al;
    const arco = () => { c.moveTo(L, 122); c.bezierCurveTo(L + 4, T + 18, L + 44, T, 128, T); c.bezierCurveTo(R - 34, T, R + 2, T + 22, R + 2, 112); };
    const abertura = () => { arco(); c.bezierCurveTo(R - 6, B - 10, 170, B + 2, 128, B + 2); c.bezierCurveTo(84, B + 2, L + 6, B - 18, L, 122); };
    c.save(); c.beginPath(); abertura(); c.closePath(); c.clip();
    c.fillStyle = o.esclera ?? "#f8f6f2"; c.fillRect(0, 0, w, h);
    const ix = 130 + (o.dx ?? 0), iy = 106, ir = 68 * Math.min(1.02, Math.max(0.7, al)) * (o.ir ?? 1);
    const g = c.createRadialGradient(ix, iy + ir * 0.4, ir * 0.1, ix, iy, ir);
    g.addColorStop(0, corCSS(iris, 0.22)); g.addColorStop(0.6, corCSS(iris, 0.04)); g.addColorStop(1, corCSS(iris, -0.14));
    c.fillStyle = g; c.beginPath(); c.arc(ix, iy, ir, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(255,255,255,.16)"; c.lineWidth = 3; for (let i = 0; i < 14; i++) { const an = (i / 14) * Math.PI * 2; c.beginPath(); c.moveTo(ix + Math.cos(an) * ir * 0.4, iy + Math.sin(an) * ir * 0.4); c.lineTo(ix + Math.cos(an) * ir * 0.86, iy + Math.sin(an) * ir * 0.86); c.stroke(); }
    c.strokeStyle = corCSS(iris, -0.34); c.lineWidth = 7; c.beginPath(); c.arc(ix, iy, ir - 3.5, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "#0b0809"; c.beginPath(); if (o.fenda) c.ellipse(ix, iy - 4, ir * 0.13, ir * 0.58, 0, 0, Math.PI * 2); else c.ellipse(ix + 2, iy - 6, ir * 0.33, ir * 0.37, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffffff"; c.beginPath(); c.ellipse(ix + ir * 0.3, iy - ir * 0.42, ir * 0.24, ir * 0.2, -0.3, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 0.85; c.beginPath(); c.arc(ix - ir * 0.36, iy + ir * 0.42, ir * 0.1, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    const sh = c.createLinearGradient(0, T, 0, T + 44); sh.addColorStop(0, "rgba(60,40,40,.5)"); sh.addColorStop(1, "rgba(60,40,40,0)"); c.fillStyle = sh; c.fillRect(0, 0, w, h);
    c.restore();
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = "rgba(140,96,84,.6)"; c.lineWidth = 3.5; c.beginPath(); c.moveTo(70, B - 2); c.bezierCurveTo(100, B + 6, 180, B + 2, R - 14, B - 22); c.stroke();        // linha de baixo
    c.strokeStyle = "rgba(140,96,84,.55)"; c.lineWidth = 3.5; c.beginPath(); c.moveTo(96, T - 14); c.bezierCurveTo(150, T - 22, R - 6, T - 14, R + 8, T + 18); c.stroke(); // vinco
    // traço de cima: fita de espessura variável seguindo o arco (fino no canto de dentro, grosso no alto e no canto de fora)
    const pts = []; { const P0 = [L + 6, 112], P1 = [L + 8, T + 16], P2 = [L + 44, T], P3 = [128, T], Q1 = [R - 34, T], Q2 = [R + 2, T + 22], Q3 = [R + 2, 112], Q4 = [R - 4, 136];
      const bz = (a, b_, c_, d_, t) => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b_[0] + 3 * u * t * t * c_[0] + t * t * t * d_[0], u * u * u * a[1] + 3 * u * u * t * b_[1] + 3 * u * t * t * c_[1] + t * t * t * d_[1]]; };
      for (let i = 0; i <= 20; i++) pts.push(bz(P0, P1, P2, P3, i / 20)); for (let i = 1; i <= 20; i++) pts.push(bz(P3, Q1, Q2, Q3, i / 20)); for (let i = 1; i <= 6; i++) { const t = i / 6; pts.push([Q3[0] + (Q4[0] - Q3[0]) * t, Q3[1] + (Q4[1] - Q3[1]) * t]); } }
    const esp = (i) => { const f = i / (pts.length - 1); return f < 0.4 ? lerp(1.5, 9, sm(f / 0.4)) : f < 0.85 ? 9 : lerp(9, 6, (f - 0.85) / 0.15); };
    const nrm = (i) => { const a_ = pts[Math.max(0, i - 1)], b_ = pts[Math.min(pts.length - 1, i + 1)], dx = b_[0] - a_[0], dy = b_[1] - a_[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    c.fillStyle = o.cilio ?? "#141010"; c.beginPath();
    pts.forEach((q, i) => { const [nx, ny] = nrm(i), e = esp(i); i ? c.lineTo(q[0] + nx * e, q[1] + ny * e) : c.moveTo(q[0] + nx * e, q[1] + ny * e); });
    for (let i = pts.length - 1; i >= 0; i--) { const [nx, ny] = nrm(i), e = esp(i); c.lineTo(pts[i][0] - nx * e * 0.6, pts[i][1] - ny * e * 0.6); }
    c.closePath(); c.fill();
  }));
}
// olho fechado (medido no Eren dormindo): arco escuro grosso curvado pra baixo, com cílios curtos embaixo
const olhoFechadoTex = canvasTex(256, 200, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "#141010"; c.lineCap = "round"; c.lineWidth = 13; c.beginPath(); c.moveTo(28, 104); c.bezierCurveTo(70, 140, 180, 146, 228, 100); c.stroke(); c.lineWidth = 5; [[80, 130], [110, 136], [140, 137], [170, 133], [198, 122]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3, y + 15); c.stroke(); }); });
// sobrancelha: barra comprida e grossa, mais grossa na ponta de dentro, arco suave e pontas arredondadas
const sobrancelha2Tex = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(10, 34); c.bezierCurveTo(60, 12, 150, 8, 246, 30); c.bezierCurveTo(250, 33, 246, 37, 240, 36); c.bezierCurveTo(160, 24, 80, 30, 18, 52); c.bezierCurveTo(8, 54, 4, 42, 10, 34); c.fill();
  c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 3; for (let i = 0; i < 9; i++) { const x = 30 + i * 22; c.beginPath(); c.moveTo(x, 40 - i * 1.2); c.lineTo(x + 18, 24 - i * 0.6); c.stroke(); } });
// rugas e olheiras (homens mais velhos): linhas finas, sem borda retangular
const rugasTex = canvasTex(256, 192, (c, w, h) => { c.clearRect(0, 0, w, h); c.lineCap = "round"; c.strokeStyle = "rgba(120,70,60,.55)"; c.lineWidth = 3;
  [-1, 1].forEach((k) => { const cx = 128 + k * 62; c.beginPath(); c.moveTo(cx - 26, 70); c.quadraticCurveTo(cx, 84, cx + 24, 70); c.stroke(); c.globalAlpha = 0.6; c.beginPath(); c.moveTo(cx - 18, 82); c.quadraticCurveTo(cx, 92, cx + 16, 82); c.stroke(); c.globalAlpha = 1;
    c.beginPath(); c.moveTo(128 + k * 30, 104); c.quadraticCurveTo(128 + k * 42, 128, 128 + k * 36, 150); c.stroke();
    c.globalAlpha = 0.5; c.beginPath(); c.moveTo(cx + k * 34, 44); c.lineTo(cx + k * 46, 38); c.moveTo(cx + k * 34, 52); c.lineTo(cx + k * 47, 54); c.stroke(); c.globalAlpha = 1; }); });
const sobrancelhaTex = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(14, 26); c.bezierCurveTo(70, 4, 170, 4, 240, 26); c.bezierCurveTo(252, 30, 250, 46, 238, 44); c.bezierCurveTo(170, 28, 80, 30, 20, 58); c.bezierCurveTo(4, 62, 2, 34, 14, 26); c.closePath(); c.fill(); });
// sombra de anime sobre a testa e os olhos (olhar ameaçador), gota de suor e lágrimas
const sombraTex = canvasTex(128, 128, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(8,2,8,.97)"); g.addColorStop(0.62, "rgba(8,2,8,.85)"); g.addColorStop(1, "rgba(8,2,8,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); c.globalCompositeOperation = "destination-in"; const gx = c.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, "rgba(0,0,0,0)"); gx.addColorStop(0.18, "rgba(0,0,0,1)"); gx.addColorStop(0.82, "rgba(0,0,0,1)"); gx.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gx; c.fillRect(0, 0, w, h); });
const suorTex = canvasTex(64, 96, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "rgba(200,230,255,.95)"; c.strokeStyle = "#5a8ab8"; c.lineWidth = 4; c.beginPath(); c.moveTo(32, 6); c.bezierCurveTo(40, 30, 58, 50, 54, 68); c.arc(32, 66, 22, 0.1, Math.PI - 0.1); c.bezierCurveTo(6, 50, 24, 30, 32, 6); c.fill(); c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.ellipse(24, 64, 5, 9, -0.3, 0, Math.PI * 2); c.fill(); });
const lagrimaTex = canvasTex(64, 128, (c, w, h) => { c.clearRect(0, 0, w, h); const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(190,225,255,.9)"); g.addColorStop(1, "rgba(190,225,255,0)"); c.fillStyle = g; c.beginPath(); c.roundRect(22, 0, 20, h, 10); c.fill(); });
const BOCAT = {};
function bocaTex(tipo) {
  if (BOCAT[tipo]) return BOCAT[tipo];
  return (BOCAT[tipo] = canvasTex(256, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.lineCap = "round"; c.lineJoin = "round"; const cx = w / 2, cy = h / 2, cor = "#86402f";
    if (tipo === "linha") { c.fillStyle = cor; c.beginPath(); c.roundRect(cx - 60, cy - 11, 120, 22, 9); c.fill(); }
    else if (tipo === "sorriso") { c.strokeStyle = cor; c.lineWidth = 20; c.beginPath(); c.moveTo(cx - 58, cy - 10); c.quadraticCurveTo(cx, cy + 22, cx + 58, cy - 10); c.stroke(); }
    else if (tipo === "triste") { c.strokeStyle = cor; c.lineWidth = 20; c.beginPath(); c.moveTo(cx - 56, cy + 12); c.quadraticCurveTo(cx, cy - 18, cx + 56, cy + 12); c.stroke(); }
    else if (tipo === "aberta") { c.fillStyle = "#3a0c10"; c.beginPath(); c.ellipse(cx, cy, 34, 26, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#b8343a"; c.beginPath(); c.ellipse(cx, cy + 12, 22, 11, 0, 0, Math.PI * 2); c.fill(); }
    else if (tipo === "smirk") { c.strokeStyle = cor; c.lineWidth = 18; c.beginPath(); c.moveTo(cx - 54, cy + 4); c.bezierCurveTo(cx - 20, cy + 14, cx + 30, cy + 10, cx + 62, cy - 18); c.stroke(); c.lineWidth = 8; c.beginPath(); c.moveTo(cx + 56, cy - 22); c.lineTo(cx + 66, cy - 8); c.stroke(); }
    else if (tipo === "dentes") { c.fillStyle = "#2a0a0e"; c.beginPath(); c.moveTo(cx - 70, cy - 14); c.quadraticCurveTo(cx, cy + 46, cx + 70, cy - 14); c.quadraticCurveTo(cx, cy - 4, cx - 70, cy - 14); c.fill(); c.save(); c.clip(); c.fillStyle = "#f4efe6"; c.fillRect(cx - 70, cy - 16, 140, 15); c.fillStyle = "rgba(0,0,0,.25)"; for (let i = 1; i < 9; i++) c.fillRect(cx - 70 + i * 15.5, cy - 16, 2, 15); c.fillStyle = "#b8343a"; c.beginPath(); c.ellipse(cx, cy + 22, 26, 9, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    else if (tipo === "grito") { c.fillStyle = "#2a0a0e"; c.beginPath(); c.ellipse(cx, cy + 4, 40, 34, 0, 0, Math.PI * 2); c.fill(); c.save(); c.clip(); c.fillStyle = "#f4efe6"; c.fillRect(cx - 40, cy - 32, 80, 12); c.fillStyle = "#b8343a"; c.beginPath(); c.ellipse(cx, cy + 30, 26, 14, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    else if (tipo === "mastiga") { c.fillStyle = cor; c.beginPath(); c.roundRect(cx - 44, cy - 9, 88, 18, 9); c.fill(); c.strokeStyle = "rgba(120,60,50,.5)"; c.lineWidth = 6; [-1, 1].forEach((k) => { c.beginPath(); c.arc(cx + k * 62, cy, 10, k > 0 ? -1.2 : 1.9, k > 0 ? 1.2 : 4.4); c.stroke(); }); }
    else if (tipo === "ryuk") { // sorriso enorme do Ryuk: lábios escuros e grossos de orelha a orelha, dentes afiados
      c.fillStyle = "#1c1424"; c.beginPath(); c.moveTo(cx - 122, cy - 26); c.quadraticCurveTo(cx, cy + 58, cx + 122, cy - 26); c.quadraticCurveTo(cx, cy + 2, cx - 122, cy - 26); c.fill();
      c.fillStyle = "#3a1a40"; c.beginPath(); c.moveTo(cx - 108, cy - 18); c.quadraticCurveTo(cx, cy + 40, cx + 108, cy - 18); c.quadraticCurveTo(cx, cy + 14, cx - 108, cy - 18); c.fill();
      c.save(); c.clip(); c.fillStyle = "#f2ead8"; for (let i = 0; i < 18; i++) { const x = cx - 104 + i * 12.2; c.beginPath(); c.moveTo(x, cy - 20); c.lineTo(x + 11, cy - 20); c.lineTo(x + 5.5, cy + 6); c.fill(); } c.restore();
    }
    else if (tipo === "risada") { // sorriso de canto a canto do Sukuna, com a fileira de dentes
      c.fillStyle = "#2a0a0e"; c.beginPath(); c.moveTo(cx - 110, cy - 16); c.quadraticCurveTo(cx, cy + 40, cx + 110, cy - 16); c.quadraticCurveTo(cx, cy + 8, cx - 110, cy - 16); c.fill();
      c.save(); c.clip(); c.fillStyle = "#f4efe6"; for (let i = 0; i < 15; i++) c.fillRect(cx - 104 + i * 14, cy - 14, 11, 16); c.restore();
    }
  }));
}
function narizGeo(w, hh, p) {
  const T = [0, hh * 0.62, 0], E = [-w / 2, -hh * 0.38, 0], D = [w / 2, -hh * 0.38, 0], P = [0, -hh * 0.3, p];
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...T, ...E, ...P, ...T, ...P, ...D, ...E, ...D, ...P], 3)); g.computeVertexNormals(); return g;
}
const blushTex = canvasTex(128, 64, (c, w, h) => { c.clearRect(0, 0, w, h); const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, "rgba(242,128,120,.5)"); g.addColorStop(0.55, "rgba(242,128,120,.28)"); g.addColorStop(1, "rgba(242,128,120,0)"); c.fillStyle = g; c.save(); c.scale(1, h / w); c.beginPath(); c.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2); c.restore(); c.fill(); });
// marcas do Sukuna: o segundo par de olhos, as listras das bochechas e a marca da testa
const olhoExtraTex = canvasTex(256, 96, (c, w, h) => { c.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2; c.fillStyle = "#140a0c"; c.beginPath(); c.moveTo(cx - 116, cy + 4); c.quadraticCurveTo(cx, cy - 44, cx + 116, cy - 6); c.quadraticCurveTo(cx, cy + 40, cx - 116, cy + 4); c.fill();
  c.fillStyle = "#d8202c"; c.beginPath(); c.ellipse(cx, cy, 28, 20, 0, 0, 7); c.fill(); c.fillStyle = "#2a0606"; c.beginPath(); c.ellipse(cx, cy, 9, 18, 0, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(cx - 9, cy - 7, 5, 0, 7); c.fill(); });
const bochechaTex = canvasTex(256, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#16090c"; [[30, 34], [44, 74]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(w - 26, y - 14); c.lineTo(w - 32, y - 2); c.lineTo(x + 6, y + 12); c.closePath(); c.fill(); }); });
const testaTex = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#16090c"; c.beginPath(); c.moveTo(14, 20); c.lineTo(w / 2 - 22, 22); c.lineTo(w / 2, 58); c.lineTo(w / 2 + 22, 22); c.lineTo(w - 14, 20); c.lineTo(w - 14, 30); c.lineTo(w / 2 + 16, 32); c.lineTo(w / 2, 48); c.lineTo(w / 2 - 16, 32); c.lineTo(14, 30); c.closePath(); c.fill(); });

// ---------------------------------------------------------------- cabeça (v7)
// Medida nos rostos de frente da referência (Kruger, Eren adulto, Eren criança, Armin): um BLOCO RETANGULAR arredondado.
// Unidade u = meia-largura do rosto na linha dos olhos (CAB.HW, em metros); y em u a partir da linha dos olhos (EY).
//   - laterais retas desde a testa até o nariz; na boca o rosto tem ~80% da largura;
//   - depois afina num "U" comprido até um queixo estreito e arredondado (~27% da largura), a ~1,72 u abaixo dos olhos;
//   - frente plana (testa, olhos, bochechas), quinas marcadas entre a frente e os lados (low-poly);
//   - crânio arredondado em cima, ~1,8 u acima dos olhos.
const CAB = {
  HW: 0.075, EY: 0.093, nF: 3.4, nT: 2.3,
  // medido de frente no Kruger e no pai do Eren: reto até o nariz, depois afina num "U" comprido até um queixo estreito (~27%)
  larg: [[-1.72, 0], [-1.71, 0.2], [-1.68, 0.3], [-1.62, 0.39], [-1.56, 0.45], [-1.48, 0.52], [-1.36, 0.62], [-1.24, 0.71], [-1.12, 0.79], [-0.95, 0.86], [-0.75, 0.92], [-0.55, 0.96], [-0.3, 0.99], [0.0, 1.0], [0.7, 1.0], [1.1, 0.96], [1.42, 0.84], [1.66, 0.56], [1.78, 0.24], [1.8, 0]],
  frente: [[-1.72, 0.5], [-1.66, 0.62], [-1.5, 0.74], [-1.1, 0.84], [-0.3, 0.9], [0.5, 0.92], [1.05, 0.88], [1.42, 0.72], [1.66, 0.44], [1.8, 0]],
  tras: [[-1.72, -0.3], [-1.45, -0.1], [-1.0, 0.4], [-0.45, 0.95], [0.3, 1.26], [0.95, 1.28], [1.4, 1.06], [1.68, 0.6], [1.8, 0]],
  Y: [-1.72, -1.71, -1.68, -1.62, -1.56, -1.48, -1.36, -1.24, -1.12, -0.95, -0.75, -0.5, -0.2, 0.15, 0.5, 0.8, 1.1, 1.3, 1.48, 1.62, 1.72, 1.8],
};
function perfilY(pts, y) { if (y <= pts[0][0]) return pts[0][1]; for (let i = 0; i < pts.length - 1; i++) if (y <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (y - pts[i][0]) / (pts[i + 1][0] - pts[i][0])); return pts[pts.length - 1][1]; }
// ponto da superfície da cabeça (metros, espaço da cabeça) no ângulo ph (0 = frente, ±π/2 = lados, π = nuca) e altura y (u)
function supCab(ph, y, ext = 0, out = V3_()) {
  const H = CAB, s_ = Math.sin(ph), c_ = Math.cos(ph), fr = c_ >= 0, n = fr ? H.nF : H.nT;
  const w = perfilY(H.larg, y), d = fr ? perfilY(H.frente, y) : perfilY(H.tras, y);
  out.set(Math.sign(s_) * Math.pow(Math.abs(s_), 2 / n) * w, y, Math.sign(c_) * Math.pow(Math.abs(c_), 2 / n) * d);
  if (ext) { const nn = nrmCab(ph, y); out.addScaledVector(nn, ext / H.HW); }
  return out.set(out.x * H.HW, H.EY + out.y * H.HW, out.z * H.HW);
}
function nrmCab(ph, y) { // normal (aprox.) por diferenças finitas, no espaço u
  const e = 0.01, H = CAB, f = (a, b) => { const s_ = Math.sin(a), c_ = Math.cos(a), n = c_ >= 0 ? H.nF : H.nT, w = perfilY(H.larg, b), d = c_ >= 0 ? perfilY(H.frente, b) : perfilY(H.tras, b); return V3_(Math.sign(s_) * Math.pow(Math.abs(s_), 2 / n) * w, b, Math.sign(c_) * Math.pow(Math.abs(c_), 2 / n) * d); };
  const p0 = f(ph, y), tu = f(ph + e, y).sub(f(ph - e, y)), tv = f(ph, Math.min(1.8, y + e)).sub(f(ph, Math.max(-1.72, y - e)));
  const n = V3_().crossVectors(tu, tv); if (n.lengthSq() < 1e-12) n.copy(p0).setY(y > 0 ? 1 : -1); n.normalize();
  if (n.dot(V3_(p0.x, y > 1.7 ? 1 : y < -1.68 ? -1 : 0, p0.z)) < 0) n.negate();
  return n;
}
function headGeoLP(o = {}) {
  const NS = o.ns ?? 24, Y = CAB.Y, pos = [], idx = [], ph0 = Math.PI / NS; // meia volta de deslocamento: o meio do rosto cai numa face plana (sem risco no meio)
  for (let i = 0; i < Y.length; i++) for (let j = 0; j <= NS; j++) { const v = supCab(ph0 + (j / NS) * Math.PI * 2, Y[i]); pos.push(v.x, v.y, v.z); }
  for (let i = 0; i < Y.length - 1; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const q = o.queixo ?? 1; if (q !== 1) for (let i = 0; i < pos.length; i += 3) { const y = pos[i + 1], z = pos[i + 2]; if (y < 0.062) { const f = 1 + (q - 1) * Math.min(1, Math.max(0, (z + 0.01) / 0.07)); pos[i + 1] = 0.062 + (y - 0.062) * f; } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return vincoNormais(g, o.vinco ?? 0.62);
}

// ---------------------------------------------------------------- cabelo (v7)
// Como na referência: uma TOUCA justa no crânio (pouco volume), com a borda cortada em dentes triangulares (franja até perto
// das sobrancelhas, laterais nas têmporas, nuca) e só algumas pontas curtas no alto. Nada de tufos pra todo lado.
// mecha/ponta: lâmina grossa que afina até a ponta. Eixo Y = comprimento, X = largura, Z = espessura.
function laminaGeo(L, W, curva = -0.2, seg = 5, esp = 0.32) {
  const pos = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg, w = W * Math.pow(1 - u, 0.85), y = L * u, z = curva * L * u * u, t = W * esp * 0.5 * (1 - u) + 0.0012;
    pos.push(-w / 2, y, z, 0, y, z + t, w / 2, y, z, 0, y, z - t);
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < 4; j++) { const a = i * 4 + j, b = i * 4 + ((j + 1) % 4), c = a + 4, d = b + 4; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const _mb = new THREE.Matrix4();
function lamina(parent, base, dir, radial, L, W, mat, curva, esp, giro = 0) {
  const y = dir.clone().normalize(), z = radial.clone().addScaledVector(y, -radial.dot(y)); if (z.lengthSq() < 1e-6) z.set(0, 0, 1); z.normalize();
  if (giro) z.applyAxisAngle(y, giro);
  const x = V3_().crossVectors(y, z).normalize();
  const m = mesh(laminaGeo(L, W, curva, 5, esp), mat, base.x, base.y, base.z, parent); m.quaternion.setFromRotationMatrix(_mb.makeBasis(x, y, z)); m.castShadow = true;
  return m;
}
// altura (u) da borda da touca no ângulo ph: franja na frente, lados, nuca (interpolados)
function bordaY(o, ph) { const f = Math.cos(ph); return f > 0 ? lerp(o.ladoY ?? 0.2, o.franjaY ?? 0.75, Math.pow(f, o.franjaK ?? 2.2)) : lerp(o.ladoY ?? 0.2, o.nucaY ?? -0.55, Math.pow(-f, 1.1)); }
// touca de MECHAS (como no vídeo): mechas compridas em triângulo saindo do redemoinho no alto da cabeça e descendo até a borda.
// Cada mecha tem uma aresta no meio (crista), então mostra um lado claro e um escuro; as pontas formam os dentes da franja.
// Feito numa malha só: colunas alternam crista (mais alta, vai até a ponta do dente) e vale (mais baixa, termina no entalhe).
function toucaGeo(o) {
  const NT = o.dentes ?? 18, SH = NT * 2, SV = 12, seed = o.seed ?? 0, pos = [], idx = [];
  const topo = 1.8, espTopo = o.esp ?? 0.0075, espBorda = o.espBorda ?? 0.0032, dente = o.dente ?? 0.34, varia = o.varia ?? 0.1, crista = o.crista ?? 0.0034;
  for (let j = 0; j <= SH; j++) {
    const jj = j % SH, ph = (jj / SH) * Math.PI * 2 + (o.giro ?? 0), ponta = jj % 2 === 0, fr = Math.cos(ph);
    const yE = bordaY(o, ph) + (ponta ? -(dente * (fr > 0.35 ? (o.denteFranja ?? 1) : 1) * (0.8 + hash(jj * 1.7 + seed) * 0.4)) : (hash(jj * 2.3 + seed) - 0.5) * varia);
    for (let i = 0; i <= SV; i++) {
      const f = i / SV, y = lerp(topo, yE, Math.pow(f, 0.9));
      const e = lerp(espTopo, espBorda, Math.pow(f, 1.2)) + (ponta ? crista * sm(clamp(f * 6)) * (1 - 0.45 * f) : 0);
      const v = supCab(ph, y, e); pos.push(v.x, v.y, v.z);
    }
  }
  for (let j = 0; j < SH; j++) for (let i = 0; i < SV; i++) { const a = j * (SV + 1) + i, b = a + SV + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return vincoNormais(g, o.vinco ?? 0.42);
}
// ponto na casca da touca (y em u, ph em rad) e a normal pra fora
function naTouca(o, y, ph, ext = 0) { const fy = clamp((1.8 - y) / Math.max(0.01, 1.8 - bordaY(o, ph))), e = lerp(o.esp ?? 0.0075, o.espBorda ?? 0.0032, Math.pow(fy, 1.2)); return { w: supCab(ph, y, e + ext), n: nrmCab(ph, y) }; }
// pontas: [y (u), ph (frações de π), comprimento (u), largura (u), sobe (0 = deitada na cabeça, 1 = em pé), pra trás, curva]
function cabeloLP(head, o) {
  const cy = CAB.EY + 0.5 * CAB.HW;
  const hg = grp(head, 0, cy, 0), hr = grp(hg, 0, -cy, 0); head.userData.hairG = hg; head.userData.hairLong = false;
  const m = LPmat(o.cor, { rim: 1.0, liso: true, side: THREE.DoubleSide, rough: 0.8 });
  if (o.baixo) mesh(toucaGeo({ ...o, ...o.baixo }), LPmat(o.baixo.cor, { rim: 0.9, liso: true, side: THREE.DoubleSide, rough: 0.85 }), 0, 0, 0, hr); // camada de baixo (undercut)
  mesh(toucaGeo(o), m, 0, 0, 0, hr);
  const mp = o.pontaFacetada ? LPmat(o.cor, { rim: 1.0, side: THREE.DoubleSide, rough: 0.82 }) : m; // pontas com o mesmo sombreado da touca (se misturam ao cabelo)
  (o.pontas || []).forEach(([y, phf, L, W, sobe = 0.4, tras = 0, curva = 0.15, esp = 0.5, contra = 0], i) => {
    const ph = phf * Math.PI, A = naTouca(o, y, ph, -0.002), up = V3_(0, 1, 0);
    // direção: desce pela superfície (tangente) misturada com a normal (sobe) e pra trás
    const t = supCab(ph, y - 0.05).sub(supCab(ph, y + 0.05)).normalize(); if (contra) t.negate(); // contra = sobe pela cabeça (penteado pra trás)
    const d = t.multiplyScalar(1 - sobe).addScaledVector(A.n, sobe * 1.2).add(V3_(0, 0, -tras)).normalize();
    const lm = lamina(hr, A.w, d, A.n, L * CAB.HW, W * CAB.HW, mp, curva, esp, (hash(i * 3.1 + (o.seed ?? 0)) - 0.5) * 0.6); lm.geometry = vincoNormais(lm.geometry, 0.9);
  });
  return hg;
}

// ---------------------------------------------------------------- corpo
function perfilR(pts, y) { for (let i = 0; i < pts.length - 1; i++) if (y <= pts[i + 1][1]) return lerp(pts[i][0], pts[i + 1][0], (y - pts[i][1]) / (pts[i + 1][1] - pts[i][1])); return pts[pts.length - 1][0]; }
function pessoaLP(o = {}) {
  const P = { pele: 0xf2d4b8, olho: "#2a8a7a", roupa: 0x1b2232, calca: 0x1b2232, sapato: 0x141418, sola: 0xe4e0d8, botao: 0xd4aa50, seed: 1, scale: 1, ...o };
  const S = skeleton({ ...HUMANO, ...(o.dims || {}) });
  const skin = LPmat(P.pele, { rim: 0.45, liso: true, rough: 0.7 }), roupa = LPmat(P.roupa, { rim: 1, liso: true }), roupa2 = LPmat(P.roupa, { rim: 1, liso: true, side: THREE.DoubleSide }), calca = LPmat(P.calca, { liso: true }), sapato = LPmat(P.sapato, { rough: 0.5 }), botao = LPmat(P.botao, { metal: 0.6, rough: 0.35, rim: 0.4 });
  const R = 12;
  // quadril, pernas e tênis
  mesh(sph(1, R, 6), calca, 0, -0.01, 0, S.hips).scale.set(0.15, 0.11, 0.11);
  S.hipJ.forEach((hj, i) => {
    mesh(lathe([[0.001, -0.45], [0.058, -0.44], [0.066, -0.3], [0.078, -0.1], [0.082, 0.0], [0.062, 0.05], [0.001, 0.065]], R), calca, 0, 0, 0, hj);
    mesh(sph(0.058, R, 6), calca, 0, 0, 0.004, S.knee[i]);
    mesh(lathe([[0.001, -0.44], [0.054, -0.42], [0.058, -0.26], [0.062, -0.1], [0.06, 0.0], [0.001, 0.03]], R), calca, 0, 0, 0, S.knee[i]);
    mesh(box(0.1, 0.075, 0.23), sapato, 0, -0.03, 0.05, S.ankle[i]);
    mesh(box(0.104, 0.022, 0.236), LPmat(P.sola), 0, -0.07, 0.05, S.ankle[i]);
  });
  // tronco: casaco fechado de gola alta, barra até o quadril, botões
  const abdP = [[0.001, -0.06], [0.136, -0.06], [0.14, 0.05], [0.136, 0.13], [0.14, 0.21], [0.001, 0.21]];
  const abd = mesh(lathe(abdP, R + 2), roupa, 0, 0, 0, S.spine); abd.scale.z = 0.76;
  const chP = [[0.001, -0.02], [0.138, -0.02], [0.16, 0.06], [0.176, 0.15], [0.174, 0.22], [0.148, 0.27], [0.086, 0.305], [0.001, 0.31]];
  const ch = mesh(lathe(chP, R + 2), roupa, 0, 0, 0, S.chest); ch.scale.z = 0.72;
  const hem = mesh(lathe([[0.152, 0.07], [0.16, -0.03], [0.172, -0.13]], R + 2), roupa2, 0, 0, 0, S.hips); hem.scale.z = 0.84;
  const gola = mesh(new THREE.CylinderGeometry(0.058, 0.07, 0.06, R + 2, 1, true), roupa2, 0, 0.326, -0.004, S.chest); gola.scale.z = 0.94;
  if (P.botoes !== false) {
    [0.07, 0.15, 0.23].forEach((y) => { const b = mesh(cyl(0.012, 0.012, 0.006, 8), botao, 0, y, perfilR(chP.slice(1), y) * 0.72 + 0.002, S.chest); b.rotation.x = Math.PI / 2; });
    [0.04, 0.13].forEach((y) => { const b = mesh(cyl(0.012, 0.012, 0.006, 8), botao, 0, y, 0.137 * 0.76 + 0.002, S.spine); b.rotation.x = Math.PI / 2; });
  }
  if (P.capuz != null) { // capuz vermelho do moletom por baixo do casaco (Yuji)
    const cm = LPmat(P.capuz, { rim: 0.9, liso: true, side: THREE.DoubleSide });
    const cp = mesh(new THREE.SphereGeometry(1, 10, 7, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.5), cm, 0, 0.3, -0.1, S.chest); cp.scale.set(0.12, 0.11, 0.075); cp.rotation.x = -0.35;
    const an = mesh(new THREE.TorusGeometry(0.066, 0.016, 6, 14), cm, 0, 0.318, -0.004, S.chest); an.rotation.x = Math.PI / 2; an.scale.set(1, 0.92, 1);
  }
  // braços e mãos
  const hands = S.sh.map((sh, i) => {
    mesh(sph(0.06, R, 6), roupa, 0, -0.012, 0, sh);
    mesh(lathe([[0.001, -0.3], [0.048, -0.29], [0.052, -0.2], [0.056, -0.08], [0.06, 0.0], [0.042, 0.04], [0.001, 0.05]], R), roupa, 0, 0, 0, sh);
    mesh(sph(0.046, R, 6), roupa, 0, 0, 0, S.el[i]);
    mesh(lathe([[0.001, -0.235], [0.046, -0.228], [0.047, -0.15], [0.048, -0.05], [0.049, 0.0], [0.001, 0.03]], R), roupa, 0, 0, 0, S.el[i]);
    mesh(cyl(0.051, 0.051, 0.028, R), roupa, 0, -0.222, 0, S.el[i]);
    return hand(S.wr[i], i ? 1 : -1, skin, 1, true);
  });
  // pescoço, cabeça, orelhas
  mesh(cyl(0.036, 0.042, 0.1, R), skin, 0, 0.03, 0, S.neck);
  const V2 = P.rosto !== 1; // rosto v2: queixo mais curto, boca perto do nariz, sobrancelha afinando, rugas opcionais
  const headM = mesh(headGeoLP({ queixo: V2 ? (P.queixo ?? 0.7) : 1, ...(P.cabeca || {}) }), skin, 0, 0, 0);
  const zAt = (x, y) => { let z = surfZ(headM, x, y); if (z === 0) z = surfZ(headM, Math.sign(x) * Math.min(Math.abs(x), CAB.HW * 0.9), y) - 0.006; return z; };
  [-1, 1].forEach((k) => { const ea = mesh(sph(1, 7, 5), skin, k * 0.074, 0.081, -0.008); ea.scale.set(0.011, 0.023, 0.016); ea.rotation.y = k * 0.25; S.head.add(ea); });
  // rosto: olhos largos e baixos, sobrancelhas grossas, nariz em dois tons, bocas, blush
  const EX = 0.036, EY = CAB.EY, OW = 0.058 * (P.olhoTam ?? 1), OH = OW * 200 / 256;
  const olhos = [], fechados = [];
  if (!P.venda) [-1, 1].forEach((k) => {
    const g = grp(S.head, k * EX, EY, 0); g.rotation.set(0, 0, k * (P.olhoInc ?? 0));
    decalSup(g, olhoTex(P.olho, { fenda: P.fenda, alt: P.olhoAlt ?? 1, ...(P.olhoOpts || {}) }), OW, OH, 0, 0, (x, y) => zAt(k * EX + x, EY + y), { espelho: k < 0, ei: 0.28, dz: 0.0028 });
    const f = decalSup(S.head, olhoFechadoTex, OW, OH, k * EX, EY - 0.002, zAt, { espelho: k < 0, dz: 0.0032 }); f.visible = false;
    olhos.push(g); fechados.push(f);
  });
  const brows = [-1, 1].map((k) => { const y = EY + 0.04, rz0 = -k * (0.02 + (P.brava ?? 0) * 0.24), bx = k * (EX + 0.001); const g = grp(S.head, bx, y, 0); g.rotation.z = rz0; g.userData = { y0: y, rz0 }; decalSup(g, V2 ? sobrancelha2Tex : sobrancelhaTex, P.browW ?? 0.064, V2 ? 0.021 : 0.019, 0, 0, (x, yy) => zAt(bx + x, y + yy), { espelho: k < 0, basico: true, cor: P.sobrancelha ?? 0x2a1c18, dz: 0.0036 }); g.visible = !P.venda; return g; });
  mesh(narizGeo(0.0135, 0.024, 0.0085), LPmat(P.pele, { rim: 0.3, rough: 0.7 }), 0, 0.06, zAt(0, 0.06) - 0.0012, S.head); // nariz 3D
  const MY = V2 ? (P.bocaY ?? 0.03) : 0.009, mz = zAt(0, MY) + 0.003;
  if (P.rugas) { const r = decalSup(S.head, rugasTex, 0.15, 0.1125, 0, 0.058, zAt, { dz: 0.0026, suave: true }); r.material.opacity = Math.min(1, P.rugas); }
  if (P.barba3d != null) { const bm = LPmat(P.barba3d, { rim: 0.6 }); const zc = zAt(0, -0.02); const b = mesh(new THREE.ConeGeometry(0.03, 0.07, 5), bm, 0, -0.045, zc - 0.012, S.head); b.rotation.x = Math.PI + 0.35; b.scale.z = 0.7;
    [-1, 1].forEach((k) => { const m = mesh(box(0.034, 0.008, 0.012), bm, k * 0.019, MY + 0.011, zAt(k * 0.019, MY + 0.011) + 0.002, S.head); m.rotation.z = -k * 0.32; }); }
  const bocas = {};
  ["linha", "sorriso", "triste", "aberta"].forEach((t) => (bocas[t] = decalSup(S.head, bocaTex(t), V2 && t === "linha" ? 0.044 : 0.056, V2 && t === "linha" ? 0.022 : 0.028, 0, MY, zAt, { dz: 0.003 })));
  bocas.risada = decalSup(S.head, bocaTex("risada"), 0.066, 0.033, 0, MY, zAt, { dz: 0.0034 });
  ["smirk", "mastiga"].forEach((t) => (bocas[t] = decalSup(S.head, bocaTex(t), 0.056, 0.028, 0, MY, zAt, { dz: 0.003 }))); ["dentes", "grito"].forEach((t) => (bocas[t] = decalSup(S.head, bocaTex(t), 0.07, 0.036, 0, MY - 0.002, zAt, { dz: 0.0034 })));
  if (P.bocaRyuk) bocas.ryuk = decalSup(S.head, bocaTex("ryuk"), 0.12, 0.06, 0, MY + 0.004, zAt, { dz: 0.0034 });
  const sombra = decalSup(S.head, sombraTex, 0.15, 0.08, 0, EY + 0.012, zAt, { dz: 0.0042, suave: true, sx: 16, sy: 6 }); sombra.visible = false;
  const suor = decal(S.head, suorTex, 0.016, 0.024, 0.068, EY + 0.05, zAt(0.068, EY + 0.05) + 0.004, 0.5, 0, { suave: true }); suor.visible = false;
  const lagrimas = [-1, 1].map((k) => { const m = decalSup(S.head, lagrimaTex, 0.012, 0.05, k * 0.04, EY - 0.045, zAt, { dz: 0.0036, suave: true }); m.visible = false; return m; });
  if (P.blush) [-1, 1].forEach((k) => decal(S.head, blushTex, 0.042, 0.022, k * 0.045, 0.061, zAt(k * 0.045, 0.061) + 0.003, k * 0.15, 0, { suave: true }));
  let extras = null;
  if (P.sukuna) { // marcas do Sukuna
    extras = [-1, 1].map((k) => { const y = EY - 0.026, g = grp(S.head, k * 0.037, y, zAt(k * 0.037, y) + 0.003); g.rotation.set(0, 0, k * 0.1); decal(g, olhoExtraTex, 0.032, 0.012, 0, 0, 0); return g; });
    [-1, 1].forEach((k) => { const g = grp(S.head, k * 0.052, 0.048, zAt(k * 0.052, 0.048) + 0.004); g.rotation.set(0, k * 0.3, 0); decal(g, bochechaTex, 0.034, 0.017, 0, 0, 0, 0, 0, { espelho: k < 0 }); });
    decal(S.head, testaTex, 0.058, 0.014, 0, EY + 0.056, zAt(0, EY + 0.056) + 0.004);
  }
  S.head.add(headM);
  if (P.venda) { // venda do Gojo: faixa que acompanha o bloco da cabeça na linha dos olhos
    const NS = 28, pos = [], idx = [], Yv = [-0.42, 0.44];
    for (let r = 0; r < 2; r++) for (let j2 = 0; j2 <= NS; j2++) { const v = supCab((j2 / NS) * Math.PI * 2, Yv[r], 0.0035); pos.push(v.x, v.y, v.z); }
    for (let j2 = 0; j2 < NS; j2++) { const a = j2, b = j2 + NS + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const vg = new THREE.BufferGeometry(); vg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); vg.setIndex(idx); vg.computeVertexNormals();
    mesh(vg, LPmat(0x121216, { side: THREE.DoubleSide, rim: 0.6, liso: true }), 0, 0, 0, S.head);
  }
  if (P.cabelo) cabeloLP(S.head, P.cabelo);
  S.head.scale.setScalar(P.cabecaEscala ?? 1.35); // cabeça grande como na referência (≈70% da largura dos ombros)
  S.root.scale.setScalar(P.scale);
  shadows(S.root);
  S.root.traverse((c) => { if (c.userData && c.userData.isDecal) { c.castShadow = false; c.receiveShadow = false; } });
  S.root.userData = { ...S, eyes: null, brows: null, mouth: null, hands, P, headM, kind: "lp", tails: [], scarfTails: [], lp: { olhos, fechados, brows, bocas, extras, sombra, suor, lagrimas } };
  restPose(S.root);
  return S.root;
}
// expressões: piscada (olho vira a linha fechada), olhos fechados, sobrancelhas (bravo/triste/sobe), boca (linha, sorriso,
// triste, aberta, risada) e fala (boca abrindo)
function rostoLP(p, t, f = {}) {
  const u = p.userData, L = u.lp; if (!L) return;
  const per = f.piscaCada ?? 3.4, ph = (t + hash(u.P.seed) * 5) % per, piscando = ph < 0.12;
  const fecha = f.fechados || (piscando && !((f.choque ?? 0) > 0.5));
  L.olhos.forEach((g) => (g.visible = !fecha)); L.fechados.forEach((g) => (g.visible = fecha));
  if (!fecha) L.olhos.forEach((g) => (g.scale.y = clamp(f.palpebra ?? 1, 0.3, 1.2)));
  if (L.extras) L.extras.forEach((g) => (g.visible = !fecha));
  L.brows.forEach((g, i) => { const k = i ? 1 : -1; g.rotation.z = g.userData.rz0 - k * ((f.bravo ?? 0) * 0.32 - (f.triste ?? 0) * 0.3); g.position.y = g.userData.y0 + (f.sobe ?? 0) * 0.006 - (f.bravo ?? 0) * 0.003; });
  const chq = (f.choque ?? 0) > 0.5;
  L.olhos.forEach((g) => { const m = g.children[0]; if (!m || !m.material.map) return; if (!m.userData.texN) { const P = u.P, base = olhoTex(P.olho, { fenda: P.fenda, alt: P.olhoAlt ?? 1, ...(P.olhoOpts || {}), ir: 0.52 * (P.olhoOpts?.ir ?? 1) }); m.userData.texN = m.material.map; m.userData.texC = m.material.map.repeat.x < 0 ? espelho(base) : base; } const want = chq ? m.userData.texC : m.userData.texN; if (m.material.map !== want) { m.material.map = want; if (m.material.emissiveMap) m.material.emissiveMap = want; m.material.needsUpdate = true; } });
  if (L.sombra) { L.sombra.visible = (f.sombra ?? 0) > 0.02; L.sombra.material.opacity = clamp(f.sombra ?? 0); }
  if (L.suor) { L.suor.visible = (f.suor ?? 0) > 0.02; L.suor.position.y = CAB.EY + 0.05 - ((t * 0.03) % 0.03) * (f.suor ?? 0); }
  if (L.lagrimas) L.lagrimas.forEach((m) => { m.visible = (f.choro ?? 0) > 0.02; m.scale.y = Math.max(0.05, f.choro ?? 0); });
  let tipo = f.boca ?? "linha";
  if (f.fala) { const a = Math.abs(Math.sin(t * 12.5)) * f.fala; if (a > 0.4) tipo = "aberta"; L.bocas.aberta.scale.y = 0.6 + a * 0.5; }
  for (const k in L.bocas) L.bocas[k].visible = k === tipo;
}

// ---------------------------------------------------------------- elenco (v7): rosto em bloco retangular + touca justa com dentes
// touca: franjaY / ladoY / nucaY = altura (u) da borda na testa, nos lados e na nuca; dente = profundidade dos dentes (u);
// dentes = quantos em volta da cabeça; esp / espBorda = espessura (m) no alto e na borda (pouco volume, como no vídeo).
// pontas: [y (u), ph (frações de π: 0 testa, ±0,5 lados, 1 nuca), comprimento (u), largura (u), sobe (0 deitada, 1 em pé), pra trás, curva]
// anel de placas largas em volta da cabeça na altura y: n placas, comprimento L e largura W (u), sobe, pra trás;
// ph0/arco em frações de π (padrão: volta inteira começando na testa)
function coroa(n, y, L, W, sobe, tras, ph0 = 0, arco = 2, curva = 0.25, esp = 0.35) { const out = []; for (let i = 0; i < n; i++) { const f = arco >= 2 ? i / n : n === 1 ? 0.5 : i / (n - 1); out.push([y + (hash(i * 2.7 + y) - 0.5) * 0.06, ph0 + f * arco, L * (0.9 + hash(i * 1.3 + y) * 0.2), W, sobe, tras, curva, esp]); } return out; }
const JJK = { navy: 0x2f3b58, navy2: 0x222a3e, botao: 0xd4aa50 };
const CABELOS = {
  erenCrianca: { cor: 0x3a2618, dentes: 16, dente: 0.42, crista: 0.005, franjaY: 0.98, ladoY: 0.12, nucaY: -0.75, esp: 0.008, espBorda: 0.0034, varia: 0.08, seed: 2,
    // topo serrilhado: placas largas e baixas (não chifres), sobrepostas como escamas, com a ponta levantando um pouco
    pontas: coroa(7, 1.6, 0.36, 0.5, 0.55, 0.12, 0.08, 2, 0.05, 0.6) },
  undercut: { cor: 0x3e2226, dentes: 28, dente: 0.1, varia: 0.04, franjaY: 1.2, ladoY: 0.1, nucaY: -0.75, esp: 0.0026, espBorda: 0.0018 },
  yuji: { cor: 0xf09aa8, dentes: 14, dente: 0.3, crista: 0.0045, franjaY: 1.2, ladoY: 0.85, nucaY: 0.35, esp: 0.009, espBorda: 0.004, varia: 0.08, seed: 3,
    pontas: [[1.22, -0.06, 0.5, 0.34, -0.05, 0, -0.15, 0.5], [1.22, 0.08, 0.46, 0.32, -0.05, 0, -0.15, 0.5], // as duas mechas da franja caindo no meio da testa
      ...coroa(6, 1.42, 0.46, 0.46, 0.88, -0.12, -0.42, 0.84, 0.04, 0.6), ...coroa(5, 1.3, 0.4, 0.5, 0.45, 0.35, 0.58, 0.84, 0.06, 0.6)] }, // frente espetada pra cima; trás
  sukunaYuji: { cor: 0xf09aa8, dentes: 14, dente: 0.22, denteFranja: 0.2, crista: 0.0045, franjaY: 1.3, ladoY: 0.85, nucaY: 0.35, esp: 0.009, espBorda: 0.004, varia: 0.05, seed: 4,
    pontas: [...coroa(5, 1.2, 1.0, 0.6, 0.0, 0.75, -0.3, 0.6, -0.4, 0.45).map((q) => [...q, 1]), // penteado pra trás: mechas largas deitadas subindo da testa e dobrando pra trás
      ...coroa(5, 1.3, 0.4, 0.5, 0.45, 0.35, 0.58, 0.84, 0.06, 0.6)] },
  megumi: { cor: 0x2a2e3a, dentes: 14, dente: 0.46, crista: 0.005, franjaY: 1.0, ladoY: 0.2, nucaY: -0.55, esp: 0.01, espBorda: 0.0036, varia: 0.12, seed: 7,
    pontas: [...coroa(8, 1.5, 0.5, 0.56, 0.72, 0.04, 0.06, 2, 0.06, 0.6), ...coroa(6, 1.18, 0.46, 0.54, 0.55, 0.15, 0.3, 1.4, 0.06, 0.6)] }, // espetado pra todo lado, em tufos largos
  gojo: { cor: 0xe6eaf0, dentes: 14, dente: 0.38, crista: 0.0045, franjaY: 0.95, ladoY: 0.3, nucaY: -0.4, esp: 0.01, espBorda: 0.0036, varia: 0.1, seed: 9,
    pontas: [...coroa(8, 1.5, 0.5, 0.56, 0.85, 0.0, 0.06, 2, 0.06, 0.6), ...coroa(6, 1.25, 0.46, 0.52, 0.7, 0.1, 0.25, 1.5, 0.06, 0.6)] }, // pra cima
};
function yujiLP(o = {}) { return pessoaLP({ seed: 11, pele: 0xffe2b8, olho: "#b06a34", olhoAlt: 0.9, olhoTam: 0.96, capuz: 0xb3262c, roupa: JJK.navy, calca: JJK.navy, blush: true, sobrancelha: 0x4a2228, cabelo: { ...CABELOS.yuji, baixo: CABELOS.undercut }, ...o }); }
function sukunaYujiLP(o = {}) { return yujiLP({ seed: 12, olho: "#c41e2a", olhoAlt: 0.8, olhoInc: 0.05, blush: false, sukuna: true, brava: 0.6, cabelo: { ...CABELOS.sukunaYuji, baixo: CABELOS.undercut }, ...o }); }
function megumiLP(o = {}) { return pessoaLP({ seed: 21, pele: 0xfde0b6, olho: "#2f6070", olhoAlt: 0.8, olhoTam: 0.96, brava: 0.35, roupa: JJK.navy, calca: JJK.navy, sobrancelha: 0x14161c, cabelo: CABELOS.megumi, ...o }); }
function sukunaMegumiLP(o = {}) { return megumiLP({ seed: 22, olho: "#c41e2a", olhoInc: 0.05, sukuna: true, brava: 0.65, ...o }); }
function gojoLP(o = {}) { return pessoaLP({ seed: 31, pele: 0xffe6c8, venda: true, roupa: JJK.navy2, calca: JJK.navy2, scale: 1.08, cabelo: CABELOS.gojo, ...o }); }
// calibração: o Eren criança da referência (cena da árvore), pra comparar rosto e cabelo lado a lado
function erenCriancaLP(o = {}) { return pessoaLP({ seed: 6, pele: 0xffdcaa, olho: "#2a9a88", olhoAlt: 0.94, blush: true, roupa: 0x5c7a46, calca: 0x4a5a3a, botoes: false, sobrancelha: 0x2e1e14, cabelo: CABELOS.erenCrianca, ...o }); }

// ================================================================ vídeo: Por que o Sukuna escolheu o Megumi? (comum)
// Estilo da animação de referência (GUIA-ANIMACAO-ESTILO.md): low-poly, um mundo de cor por capítulo, câmera lenta e
// contínua, contraluz, linhas de luz que se desenham, anéis no chão, orbe de luz, roupa que muda de cor de baixo pra cima.
// Personagens da obra desenhados por nós em low-poly (lowpoly.js); nada de arte oficial.
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- câmera: curva contínua com olhar suave
function path2(t, ks) {
  const c = path(t, ks), n = ks.length;
  if (t <= ks[0][0] || t >= ks[n - 1][0]) return c;
  let i = 0; while (i < n - 2 && t > ks[i + 1][0]) i++;
  const u = sm(seg(t, ks[i][0], ks[i + 1][0]));
  return { ...c, look: lerp3(ks[i][2], ks[i + 1][2], u) };
}
// planos: lista [t0, fn(t, u)] → câmera do plano ativo (u = progresso no plano). Poucos cortes, como na referência.
function planos(t, lista, fim) {
  let i = 0; while (i < lista.length - 1 && t >= lista[i + 1][0]) i++;
  const t0 = lista[i][0], t1 = i < lista.length - 1 ? lista[i + 1][0] : fim;
  return lista[i][1](t, clamp((t - t0) / Math.max(0.01, t1 - t0)));
}
// plano com movimento lento e suave (dolly / grua / órbita curta)
const mov = (p0, p1, l0, l1 = l0, f0 = 32, f1 = f0, ease = E.inOut) => (t, u) => { const k = ease(u); return { pos: lerp3(p0, p1, k), look: lerp3(l0, l1, k), fov: lerp(f0, f1, k), near: 0.03 }; };
// chicote (transição): borrão horizontal forte nos últimos/primeiros instantes do plano
function chicote(t, tc, dur = 0.22, dir = 1) { const d = Math.abs(t - tc); if (d < dur) { const k = Math.pow(1 - d / dur, 1.6); GU.uBlur.value.set(dir * 0.22 * k, 0); } }
// flash branco centrado em tc
function flash(t, tc, sobe = 0.12, desce = 0.5, cor = [1, 1, 1]) { let k = 0; if (t >= tc - sobe && t < tc) k = sm((t - (tc - sobe)) / sobe); else if (t >= tc && t < tc + desce) k = 1 - sm((t - tc) / desce); if (k > 0) { GU.uFlash.value = Math.max(GU.uFlash.value, k); GU.uFlashCol.value.set(...cor); } }
function escurece(t, a, b, cor = [0, 0, 0], max = 1) { const k = smr(t, a, b) * max; if (k > 0) { GU.uFade.value = Math.max(GU.uFade.value, k); GU.uFadeCol.value.set(...cor); } }

// ---------------------------------------------------------------- troca de cor no corpo (um corte horizontal que sobe; abaixo dele, a cor nova)
function trocaCorPrep(obj, cor = 0xffc860) {
  const U = { uY: { value: -100 }, uCor: { value: new THREE.Color(cor) }, uBorda: { value: new THREE.Color(cor).multiplyScalar(2.5) }, uMix: { value: 1 } };
  obj.traverse((c) => {
    if (!c.isMesh || c.userData.isOutline) return;
    const conv = (m0) => {
      const m = m0.clone(), prev = m0.onBeforeCompile, key = m0.customProgramCacheKey ? m0.customProgramCacheKey() : "";
      m.onBeforeCompile = (sh, r) => {
        if (prev) prev.call(m0, sh, r);
        Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP;").replace("#include <fog_vertex>", "vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#include <fog_vertex>");
        sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP; uniform float uY; uniform vec3 uCor; uniform vec3 uBorda; uniform float uMix;")
          .replace("#include <opaque_fragment>", "float kC = smoothstep(uY + 0.012, uY - 0.012, vWP.y) * uMix;\noutgoingLight = mix(outgoingLight, uCor * (0.25 + 1.3 * dot(outgoingLight, vec3(0.3333))), kC);\noutgoingLight += uBorda * (1.0 - smoothstep(0.0, 0.025, abs(vWP.y - uY))) * uMix;\n#include <opaque_fragment>");
      };
      m.customProgramCacheKey = () => "troca" + key;
      return m;
    };
    c.material = Array.isArray(c.material) ? c.material.map(conv) : conv(c.material);
  });
  obj.userData.troca = U;
  return U;
}

// ---------------------------------------------------------------- linhas de luz que se desenham sozinhas (tubo com drawRange)
function linhaLuz(g, pts, o = {}) {
  const P = pts.map((p) => V3(...p));
  const curva = o.curva ? new THREE.CatmullRomCurve3(P, !!o.fechada, "centripetal") : (() => { const cp = new THREE.CurvePath(); for (let i = 0; i < P.length - 1; i++) cp.add(new THREE.LineCurve3(P[i], P[i + 1])); return cp; })();
  const nseg = o.seg ?? Math.max(16, (pts.length - 1) * 10), rs = 6;
  const geo = new THREE.TubeGeometry(curva, nseg, o.r ?? 0.012, rs, !!o.fechada && !!o.curva);
  const m = mesh(geo, glowM(o.cor ?? 0xffd27a, o.op ?? 1), 0, 0, 0, g); m.castShadow = m.receiveShadow = false; m.renderOrder = 4;
  const L = { m, k: 1, set(k) { L.k = clamp(k); geo.setDrawRange(0, Math.floor(L.k * nseg) * rs * 6); m.visible = L.k > 0.002; } };
  return L;
}
const circuloPts = (r, n = 48, y = 0, cx = 0, cz = 0, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.sin(a) * r, y, cz + Math.cos(a) * r]; });

// ---------------------------------------------------------------- anéis concêntricos que se espalham pelo chão
function aneisChao(g, o = {}) {
  const n = o.n ?? 4, rings = [];
  for (let i = 0; i < n; i++) { const r = mesh(new THREE.RingGeometry(0.97, 1, 72), glowM(o.cor ?? 0xffd27a, 0), 0, o.y ?? 0.02, 0, g); r.rotation.x = -Math.PI / 2; r.castShadow = r.receiveShadow = false; r.visible = false; r.renderOrder = 3; rings.push(r); }
  return {
    rings,
    update(t, t0) {
      rings.forEach((r, i) => {
        const tt = t - t0 - i * (o.gap ?? 0.32); if (tt < 0) { r.visible = false; return; }
        const k = tt / (o.dur ?? 2.4); r.visible = k < 1;
        r.scale.setScalar(lerp(o.r0 ?? 0.2, o.r1 ?? 6, E.out(clamp(k)))); r.material.opacity = Math.pow(1 - clamp(k), 1.4) * (o.op ?? 0.95);
      });
    },
  };
}

// ---------------------------------------------------------------- orbe de luz (com halo e luz própria)
function orbe(g, cor = 0xff2a2a, s = 0.5) {
  const o = grp(g), core = glowSprite(0xffffff, s * 0.32, 1), h1 = glowSprite(cor, s, 0.95), h2 = glowSprite(cor, s * 2.6, 0.35);
  o.add(core, h1, h2); const L = new THREE.PointLight(cor, 2.5, 4, 2); o.add(L);
  return { o, L, set(op, t = 0) { const pul = 1 + Math.sin(t * 9) * 0.06; core.material.opacity = op; h1.material.opacity = 0.95 * op; h2.material.opacity = 0.35 * op; core.scale.setScalar(s * 0.32 * pul); h1.scale.setScalar(s * pul); L.intensity = 2.5 * op; o.visible = op > 0.01; } };
}

// ---------------------------------------------------------------- veias de raio (o "lampejo"): galhos de luz que crescem e piscam
function raioPts(a, b, seed = 1, n = 14, amp = 0.18) {
  const A = V3(...a), B = V3(...b), d = B.clone().sub(A), L_ = d.length(), perp = V3(-d.y, d.x, 0).normalize(), perp2 = V3().crossVectors(d, perp).normalize(), out = [];
  for (let i = 0; i <= n; i++) { const f = i / n, w = Math.sin(f * Math.PI) * amp * L_, p = A.clone().addScaledVector(d, f).addScaledVector(perp, (hash(i * 3.1 + seed) - 0.5) * w).addScaledVector(perp2, (hash(i * 5.7 + seed) - 0.5) * w * 0.5); out.push(p.toArray()); }
  return out;
}
function raios(g, a, b, o = {}) {
  const ls = [linhaLuz(g, raioPts(a, b, o.seed ?? 1, 16, o.amp ?? 0.16), { r: o.r ?? 0.008, cor: o.cor ?? 0xffffff, seg: 64 })];
  const m = raioPts(a, b, o.seed ?? 1, 16, o.amp ?? 0.16);
  for (let i = 0; i < (o.galhos ?? 4); i++) { const j = 3 + Math.floor(hash(i * 7.7 + (o.seed ?? 1)) * 10), p = m[Math.min(j, m.length - 1)]; const q = [p[0] + (hash(i * 3.3) - 0.5) * 0.9 * (o.esc ?? 1), p[1] + (hash(i * 9.1) - 0.6) * 0.9 * (o.esc ?? 1), p[2] + (hash(i * 2.1) - 0.5) * 0.3]; ls.push(linhaLuz(g, raioPts(p, q, i * 13 + 5, 8, 0.25), { r: (o.r ?? 0.008) * 0.6, cor: o.cor ?? 0xffffff, seg: 32 })); }
  return { ls, set(k, t = 0) { ls.forEach((l, i) => { l.set(clamp(k * (i ? 1.6 : 1.2) - (i ? 0.3 : 0))); l.m.material.opacity = (0.7 + 0.3 * Math.sin(t * 60 + i)) * (k > 0 ? 1 : 0); }); } };
}

// ---------------------------------------------------------------- chuva (riscos que caem) e respingos
function chuva(g, o = {}) {
  const n = o.n ?? 900, [x0, x1, y0, y1, z0, z1] = o.area ?? [-8, 8, 0, 9, -8, 6], pos = new Float32Array(n * 6);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const lm = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: o.cor ?? 0xa8c0e8, transparent: true, opacity: o.op ?? 0.45, depthWrite: false, blending: ADD })); g.add(lm); lm.frustumCulled = false;
  const L = o.len ?? 0.35, V = o.vel ?? 11, vx = o.vento ?? -0.8;
  return {
    lm,
    update(t) {
      for (let i = 0; i < n; i++) {
        const ph = (t * V / (y1 - y0) + hash(i * 1.37)) % 1, y = y1 - ph * (y1 - y0), x = lerp(x0, x1, hash(i * 2.11)) + vx * ph, z = lerp(z0, z1, hash(i * 3.71));
        pos.set([x, y, z, x - vx * L / V * 2, y + L, z], i * 6);
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}
function respingos(g, n, area, cor = 0xa8c0e8) {
  const rs = []; for (let i = 0; i < n; i++) { const r = mesh(new THREE.RingGeometry(0.85, 1, 20), glowM(cor, 0), lerp(area[0], area[1], hash(i * 1.9)), 0.012, lerp(area[2], area[3], hash(i * 4.3)), g); r.rotation.x = -Math.PI / 2; r.castShadow = r.receiveShadow = false; rs.push(r); }
  return { update(t) { rs.forEach((r, i) => { const ph = (t * 1.6 + hash(i * 7.3)) % 1; r.scale.setScalar(0.02 + ph * 0.16); r.material.opacity = (1 - ph) * 0.22; }); } };
}

// ---------------------------------------------------------------- bolhas subindo (água)
function bolhas(g, n, area, o = {}) {
  const P = dustPts(n, area, o.cor ?? 0xbfe6ff, o.size ?? 0.04, o.op ?? 0.7, ADD, o.seed ?? 3); g.add(P);
  const base = P.geometry.attributes.position.array.slice();
  return { P, update(t) { const a = P.geometry.attributes.position.array, h = area[3] - area[2]; for (let i = 0; i < n; i++) { const y = area[2] + ((base[i * 3 + 1] - area[2] + t * (0.3 + hash(i) * 0.5)) % h); a[i * 3] = base[i * 3] + Math.sin(t * 2 + i) * 0.03; a[i * 3 + 1] = y; } P.geometry.attributes.position.needsUpdate = true; } };
}

// ---------------------------------------------------------------- fogo no horizonte e fumaça
function fogoLonge(g, x, z, s = 1) {
  const f = grp(g, x, 0, z), sp = [glowSprite(0xff7a20, 3 * s, 0.85), glowSprite(0xffc060, 1.5 * s, 0.9), glowSprite(0xff4010, 6 * s, 0.35)];
  sp.forEach((q, i) => { q.position.y = (i === 2 ? 1.5 : 0.8) * s; f.add(q); });
  const fumo = []; for (let i = 0; i < 5; i++) { const q = glowSprite(0x3a2a30, 4 * s, 0.4, NORM, puffTex); f.add(q); fumo.push(q); }
  return { update(t) { sp.forEach((q, i) => (q.material.opacity = (i === 2 ? 0.35 : 0.85) * (0.8 + 0.2 * noise1(t * 6 + x + i)))); fumo.forEach((q, i) => { const ph = (t * 0.08 + i / 5) % 1; q.position.set(Math.sin(i * 2.1) * s + ph * 2 * s, 2 * s + ph * 9 * s, 0); q.scale.setScalar((3 + ph * 6) * s); q.material.opacity = 0.42 * Math.sin(ph * Math.PI); }); } };
}

// ---------------------------------------------------------------- mundos de cor (pisos e fundos)
// palco infinito preto com linhas de luz convergindo (mundo "das ideias" da referência)
function palcoPreto(g, o = {}) {
  const chao = mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: o.chao ?? 0x07060a, roughness: 0.32, metalness: 0.55 }), 0, 0, 0, g); chao.rotation.x = -Math.PI / 2; chao.castShadow = false;
  const ls = [];
  for (let i = 0; i < (o.linhas ?? 14); i++) { const a = (i / (o.linhas ?? 14) - 0.5) * Math.PI * 1.6, r = 60; ls.push(linhaLuz(g, [[Math.sin(a) * 1.5, 0.01, Math.cos(a) * 1.5 - (o.fz ?? 0)], [Math.sin(a) * r, 0.01, Math.cos(a) * r - (o.fz ?? 0)]], { r: 0.012, cor: o.cor ?? 0xffc860, op: o.op ?? 0.55, seg: 24 })); }
  return { chao, ls };
}
// céu e névoa de cor única (vazios)
function vazio(g, top, hor, chao_ = 0x050405, o = {}) {
  return skyDome(g, { top, mid: o.mid ?? top, hor, ground: chao_, exp: o.exp ?? 0.8, sunDir: o.sunDir ?? [0, 0.1, -1], sunCol: o.sunCol ?? hor, sunI: o.sunI ?? 0.15, disk: o.disk ?? 0.2, cov: 0, cloudA: 0, cloudLit: hor, cloudSh: top, midY: 0.1 });
}

// ---------------------------------------------------------------- personagens novos (low-poly, mesmo estilo do elenco)
// cães divinos (lobos de sombra): corpo facetado, focinho em cunha, orelhas em pé, rabo cheio
function loboLP(o = {}) {
  const cor = o.cor ?? 0xe8e8ee, esc = o.escuro ?? 0x2a2a32, m = LPmat(cor, { rim: 1.1, rough: 0.8 }), md = LPmat(esc, { rim: 0.9, rough: 0.8 });
  const root = new THREE.Group(), body = grp(root, 0, 0.5, 0);
  const tor = mesh(new THREE.CapsuleGeometry(0.2, 0.62, 3, 6), m, 0, 0, 0, body); tor.rotation.x = Math.PI / 2; tor.scale.set(1, 1, 1.05);
  mesh(new THREE.SphereGeometry(0.2, 6, 5), m, 0, 0.02, 0.3, body).scale.set(1, 1.05, 0.85); // peito
  const neck = grp(body, 0, 0.12, 0.42); neck.rotation.x = -0.55;
  mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.3, 6), m, 0, 0.12, 0, neck);
  const head = grp(neck, 0, 0.3, 0.02); head.rotation.x = 0.55;
  mesh(new THREE.SphereGeometry(0.15, 6, 5), m, 0, 0, 0, head).scale.set(1, 0.9, 1.05);
  const fo = mesh(new THREE.ConeGeometry(0.085, 0.24, 4), m, 0, -0.03, 0.2, head); fo.rotation.x = Math.PI / 2; fo.rotation.y = Math.PI / 4; fo.scale.set(1, 1, 0.75);
  mesh(new THREE.SphereGeometry(0.03, 5, 4), LPmat(0x141418, { rim: 0.4 }), 0, -0.01, 0.32, head); // ponta do nariz
  [-1, 1].forEach((k) => {
    const ear = mesh(new THREE.ConeGeometry(0.055, 0.16, 3), m, k * 0.08, 0.15, -0.03, head); ear.rotation.set(-0.15, 0, -k * 0.25);
    const eye = mesh(new THREE.SphereGeometry(0.022, 6, 4), o.olhoMat ?? new THREE.MeshBasicMaterial({ color: o.olho ?? 0x101014 }), k * 0.075, 0.03, 0.115, head); eye.scale.set(1.3, 0.7, 0.6);
    const mk = mesh(new THREE.BoxGeometry(0.03, 0.012, 0.05), md, k * 0.09, 0.06, 0.09, head); mk.rotation.set(0.3, k * 0.4, k * 0.4); // marca acima do olho
  });
  const tail = grp(body, 0, 0.08, -0.48); tail.rotation.x = -0.7;
  mesh(new THREE.ConeGeometry(0.1, 0.5, 5), m, 0, -0.25, 0, tail).rotation.x = Math.PI;
  const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    const l = grp(body, sx * 0.12, -0.08, sz * 0.32); mesh(new THREE.CylinderGeometry(0.075, 0.05, 0.26, 5), m, 0, -0.12, 0, l);
    const k = grp(l, 0, -0.22, 0); mesh(new THREE.CylinderGeometry(0.048, 0.036, 0.2, 5), m, 0, -0.1, 0, k); mesh(new THREE.BoxGeometry(0.08, 0.04, 0.11), md, 0, -0.2, 0.02, k);
    return { l, k };
  });
  shadows(root);
  root.scale.setScalar(o.escala ?? 1.35);
  root.userData = { body, neck, head, tail, legs };
  return root;
}
// respira, mexe a cabeça e o rabo; rosna (abaixa a cabeça); corre (passo)
function loboAnim(p, t, o = {}) {
  const u = p.userData, b = Math.sin(t * 2.2 + (o.seed ?? 0));
  u.body.position.y = 0.5 + b * 0.008 + Math.abs(Math.sin(t * 7)) * 0.04 * (o.corre ?? 0);
  u.neck.rotation.x = -0.55 + (o.rosna ?? 0) * 0.45 + b * 0.02;
  u.head.rotation.set(0.55 - (o.rosna ?? 0) * 0.3 + Math.sin(t * 0.7 + (o.seed ?? 0)) * 0.04, (o.olha ?? 0) + Math.sin(t * 0.5 + (o.seed ?? 0)) * 0.08, 0);
  u.tail.rotation.set(-0.7 + (o.rosna ?? 0) * 0.5, Math.sin(t * 2.4 + (o.seed ?? 0)) * 0.25, 0);
  u.legs.forEach((lg, i) => { const ph = t * 9 + (i === 0 || i === 3 ? 0 : Math.PI); const a = o.corre ?? 0; lg.l.rotation.x = Math.sin(ph) * 0.55 * a; lg.k.rotation.x = Math.max(0, -Math.cos(ph)) * 0.8 * a * (i < 2 ? -1 : 1); });
}

// Mahoraga: gigante branco e musculoso (bloco facetado), asas no lugar dos olhos, faixa escura na cintura,
// lâmina presa ao antebraço direito e a roda de oito raios flutuando acima da cabeça
function mahoragaLP(o = {}) {
  const pele = LPmat(o.pele ?? 0xeceae4, { rim: 1.0, rough: 0.75 }), pano = LPmat(o.pano ?? 0x2a2733, { rim: 0.8, liso: true, side: THREE.DoubleSide }), ouro = LPmat(0xe2b24a, { metal: 0.7, rough: 0.35, rim: 0.6, emis: 0x5a3a00, ei: 0.4 });
  const S = skeleton({ ...HUMANO, shW: 0.21, upper: 0.3, fore: 0.27 });
  const L_ = (prof, parent, y = 0, s = 7) => mesh(lathe(prof, s), pele, 0, y, 0, parent);
  // pernas grossas e saia/hakama escura
  S.hipJ.forEach((hj, i) => { L_([[0.001, -0.45], [0.06, -0.43], [0.085, -0.3], [0.1, -0.12], [0.095, 0.0], [0.001, 0.06]], hj); mesh(sph(0.075, 7, 5), pele, 0, 0, 0, S.knee[i]); L_([[0.001, -0.44], [0.05, -0.42], [0.07, -0.3], [0.068, -0.1], [0.07, 0.0], [0.001, 0.03]], S.knee[i]); mesh(box(0.11, 0.06, 0.2), pele, 0, -0.03, 0.04, S.ankle[i]); });
  const saia = mesh(lathe([[0.17, 0.08], [0.2, -0.05], [0.25, -0.3], [0.28, -0.48]], 9), pano, 0, 0, 0, S.hips); saia.scale.z = 0.8;
  mesh(new THREE.TorusGeometry(0.175, 0.03, 4, 9), LPmat(0x8a2a2a, { rim: 0.6 }), 0, 0.05, 0, S.hips).rotation.x = Math.PI / 2; // faixa
  // tronco em V: peito largo, cintura fina, abdômen em blocos
  const tor = mesh(lathe([[0.001, -0.06], [0.13, -0.06], [0.14, 0.08], [0.17, 0.16], [0.001, 0.2]], 8), pele, 0, 0, 0, S.spine); tor.scale.z = 0.72;
  const ch = mesh(lathe([[0.001, -0.02], [0.17, -0.02], [0.23, 0.1], [0.25, 0.2], [0.22, 0.27], [0.12, 0.31], [0.001, 0.32]], 8), pele, 0, 0, 0, S.chest); ch.scale.z = 0.66;
  [-1, 1].forEach((k) => { const pc = mesh(new THREE.BoxGeometry(0.17, 0.11, 0.06), pele, k * 0.09, 0.19, 0.14, S.chest); pc.rotation.set(-0.15, k * 0.25, 0); }); // peitorais
  [0.0, 0.07, 0.14].forEach((y) => [-1, 1].forEach((k) => mesh(new THREE.BoxGeometry(0.07, 0.055, 0.04), pele, k * 0.04, y, 0.105, S.spine))); // abdômen
  // braços enormes; lâmina no antebraço direito
  S.sh.forEach((sh, i) => { mesh(sph(0.1, 7, 5), pele, 0, -0.01, 0, sh); L_([[0.001, -0.3], [0.07, -0.28], [0.09, -0.16], [0.085, -0.05], [0.09, 0.02], [0.001, 0.07]], sh); mesh(sph(0.065, 6, 5), pele, 0, 0, 0, S.el[i]); L_([[0.001, -0.25], [0.06, -0.24], [0.075, -0.12], [0.07, 0.0], [0.001, 0.03]], S.el[i]); mesh(box(0.1, 0.12, 0.07), pele, 0, -0.07, 0.01, S.wr[i]); });
  const lam = grp(S.el[0], -0.04, -0.12, 0.03); const bl = mesh(new THREE.ConeGeometry(0.035, 1.1, 4), LPmat(0xd8dde8, { metal: 0.8, rough: 0.25, rim: 1.2 }), 0, -0.6, 0, lam); bl.rotation.z = Math.PI; bl.scale.set(1, 1, 0.3);
  // pescoço, cabeça pequena com as asas no lugar dos olhos
  mesh(cyl(0.07, 0.085, 0.1, 7), pele, 0, 0.03, 0, S.neck);
  const hd = mesh(lathe([[0.001, -0.02], [0.06, 0.0], [0.08, 0.06], [0.082, 0.13], [0.06, 0.19], [0.001, 0.21]], 7), pele, 0, 0, 0, S.head); hd.scale.z = 0.95;
  const asas = [];
  [-1, 1].forEach((k) => [0, 1].forEach((j) => {
    const a = grp(S.head, k * 0.06, 0.1 + j * 0.035, 0.06); a.rotation.set(0, k * 0.5, k * (0.5 + j * 0.45));
    for (let f = 0; f < 4; f++) { const pena = mesh(new THREE.ConeGeometry(0.018, 0.12 - f * 0.018, 3), pele, k * (0.03 + f * 0.022), 0, 0, a); pena.rotation.z = -k * (Math.PI / 2 - f * 0.12); pena.scale.z = 0.35; }
    asas.push(a);
  }));
  // a roda de oito raios (flutua acima da cabeça, de frente)
  const roda = grp(S.head, 0, 0.42, -0.02), giro = grp(roda);
  mesh(new THREE.TorusGeometry(0.2, 0.018, 4, 16), ouro, 0, 0, 0, giro);
  mesh(cyl(0.035, 0.035, 0.04, 8), ouro, 0, 0, 0, giro).rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = grp(giro); rr.rotation.z = a; mesh(box(0.012, 0.19, 0.012), ouro, 0, 0.1, 0, rr); mesh(cyl(0.012, 0.012, 0.09, 5), ouro, 0, 0.245, 0, rr); mesh(sph(0.022, 5, 4), ouro, 0, 0.29, 0, rr); }
  const rodaLuz = glowSprite(0xffd890, 0.9, 0); roda.add(rodaLuz);
  shadows(S.root);
  S.root.scale.setScalar(o.escala ?? 2.1);
  S.root.userData = { ...S, kind: "mahoraga", roda, giro, rodaLuz, asas, hands: null };
  restPose(S.root);
  return S.root;
}
// a roda: gira devagar e TRAVA a cada adaptação (n cliques até o tempo t, cada clique = 1/8 de volta com pancada)
function rodaClique(m, t, cliques, o = {}) {
  const u = m.userData; let ang = 0, brilho = 0;
  cliques.forEach((tc) => { const d = t - tc; if (d > 0) { ang += (Math.PI / 4) * E.outBack(clamp(d / 0.35)); brilho = Math.max(brilho, d < 0.6 ? 1 - d / 0.6 : 0); } });
  u.giro.rotation.z = -ang - (o.livre ?? 0) * t * 0.2;
  u.rodaLuz.material.opacity = brilho * 0.9; u.rodaLuz.scale.setScalar(0.9 + brilho * 0.8);
  return brilho;
}

// Tsumiki: a irmã do Megumi (cabelo castanho na altura do queixo, olhar gentil)
function tsumikiLP(o = {}) {
  return pessoaLP({ seed: 41, pele: 0xffe2c0, olho: "#7a4a2e", olhoAlt: 0.95, blush: true, sobrancelha: 0x5a3a28, roupa: o.roupa ?? 0xe8e4dc, calca: 0x3a3e52, botoes: false, scale: 0.94,
    cabelo: { cor: 0x6a4630, dentes: 16, dente: 0.3, franjaY: 0.95, ladoY: -0.1, nucaY: -0.9, esp: 0.008, espBorda: 0.0034, crista: 0.004, varia: 0.06, seed: 12,
      pontas: [...coroa(4, 0.2, 1.9, 0.75, 0.0, 0.0, 0.42, 0.22, -0.04, 0.3), ...coroa(4, 0.2, 1.9, 0.75, 0.0, 0.0, -0.64, 0.22, -0.04, 0.3), ...coroa(5, -0.2, 1.6, 0.75, 0.0, 0.0, 0.7, 0.6, -0.04, 0.3)] }, ...o });
}

// ---------------------------------------------------------------- objetos de luz
// grades de luz vermelha (jaula): barras que descem do alto
function jaulaLuz(g, o = {}) {
  const n = o.n ?? 9, w = o.w ?? 2.4, h = o.h ?? 3, cor = o.cor ?? 0xff2020, bars = [];
  for (let i = 0; i < n; i++) { const x = (i / (n - 1) - 0.5) * w; const b = mesh(cyl(0.022, 0.022, h, 6), glowM(cor, 0.95), x, h / 2, o.z ?? 0, g); b.castShadow = b.receiveShadow = false; bars.push(b); const hb = mesh(cyl(0.06, 0.06, h, 6), glowM(cor, 0.25), 0, 0, 0, b); hb.castShadow = false; }
  const trilho = [0, h].map((y) => { const r = mesh(box(w + 0.1, 0.04, 0.04), glowM(cor, 0.9), 0, y, o.z ?? 0, g); r.castShadow = false; return r; });
  const luz = new THREE.PointLight(cor, 0, 6, 1.6); luz.position.set(0, h / 2, (o.z ?? 0) + 0.5); g.add(luz);
  return { bars, trilho, luz, set(k, t = 0) { bars.forEach((b, i) => { const d = clamp(k * 1.6 - (i % 3) * 0.12); b.position.y = h / 2 + (1 - E.out(d)) * (h + 1); b.visible = d > 0; b.material.opacity = 0.85 + 0.15 * Math.sin(t * 13 + i); }); trilho.forEach((r) => (r.visible = k > 0.7)); luz.intensity = 3 * clamp(k); } };
}
// chave de luz (argola, haste e dentes) que gira
function chaveLuz(g, o = {}) {
  const c = grp(g), cor = o.cor ?? 0xffd27a, r = o.r ?? 0.03;
  const ls = [linhaLuz(c, circuloPts(0.22, 40, 0, 0, 0).map(([x, y, z]) => [x, z + 0.55, 0]), { r, cor, seg: 60 }), linhaLuz(c, [[0, 0.33, 0], [0, -0.75, 0]], { r, cor, seg: 30 }), linhaLuz(c, [[0, -0.5, 0], [0.18, -0.5, 0], [0.18, -0.6, 0]], { r, cor, seg: 20 }), linhaLuz(c, [[0, -0.7, 0], [0.24, -0.7, 0], [0.24, -0.78, 0]], { r, cor, seg: 20 })];
  const halo = glowSprite(cor, 1.6, 0); c.add(halo); const L = new THREE.PointLight(cor, 0, 5, 2); c.add(L);
  return { c, set(k, t = 0) { ls.forEach((l, i) => l.set(clamp(k * 1.5 - i * 0.15))); halo.material.opacity = 0.25 * k; L.intensity = 3 * k; } };
}
// relógio de 1 minuto (holograma vermelho): anel com marcas e um ponteiro que dá a volta
function relogioLuz(g, o = {}) {
  const c = grp(g), cor = o.cor ?? 0xff3a3a, R = o.R ?? 0.6;
  const anel = linhaLuz(c, circuloPts(R, 60, 0).map(([x, y, z]) => [x, z, 0]), { r: 0.012, cor, seg: 120 });
  const marcas = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; marcas.push(linhaLuz(c, [[Math.sin(a) * R * 0.86, Math.cos(a) * R * 0.86, 0], [Math.sin(a) * R * 0.97, Math.cos(a) * R * 0.97, 0]], { r: 0.01, cor, seg: 4 })); }
  const pont = grp(c); const pl = linhaLuz(pont, [[0, 0, 0.01], [0, R * 0.8, 0.01]], { r: 0.016, cor: 0xffd0d0, seg: 8 });
  const centro = glowSprite(cor, 0.3, 0); c.add(centro);
  return { c, set(k, ang, t = 0) { anel.set(k); marcas.forEach((m, i) => m.set(clamp(k * 1.5 - i * 0.03))); pl.set(clamp(k * 2 - 0.6)); pont.rotation.z = -ang; centro.material.opacity = 0.8 * k; c.visible = k > 0.01; } };
}
// casa de linhas (vira jaula): contorno de uma casinha simples
function casaLinhas(g, o = {}) {
  const w = o.w ?? 1.6, d = o.d ?? 1.4, h = o.h ?? 1.9, tp = o.tp ?? 2.8, cor = o.cor ?? 0xffd27a;
  const P = (x, y, z) => [x * w / 2, y, z * d / 2];
  const caminhos = [
    [P(-1, 0, 1), P(1, 0, 1), P(1, 0, -1), P(-1, 0, -1), P(-1, 0, 1)],
    [P(-1, 0, 1), P(-1, h, 1), P(1, h, 1), P(1, 0, 1)], [P(-1, 0, -1), P(-1, h, -1), P(1, h, -1), P(1, 0, -1)],
    [P(-1, h, 1), P(0, tp, 1), P(1, h, 1)], [P(-1, h, -1), P(0, tp, -1), P(1, h, -1)], [P(0, tp, 1), P(0, tp, -1)],
    [P(-1, h, 1), P(-1, h, -1)], [P(1, h, 1), P(1, h, -1)],
    [P(-0.25, 0, 1), P(-0.25, h * 0.62, 1), P(0.25, h * 0.62, 1), P(0.25, 0, 1)],
  ];
  const ls = caminhos.map((c) => linhaLuz(g, c, { r: o.r ?? 0.014, cor, seg: 40 }));
  return { ls, set(k) { ls.forEach((l, i) => l.set(clamp(k * 1.8 - i * 0.09))); }, op(a) { ls.forEach((l) => (l.m.material.opacity = a)); } };
}
// boca que abre na bochecha (o pacto): decalque com dentes que cresce
const bocaBochechaTex = canvasTex(256, 128, (c, w, h) => { c.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2; c.fillStyle = "#1a0608"; c.beginPath(); c.moveTo(cx - 110, cy); c.quadraticCurveTo(cx, cy - 48, cx + 110, cy); c.quadraticCurveTo(cx, cy + 52, cx - 110, cy); c.fill(); c.save(); c.clip(); c.fillStyle = "#f2ece2"; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(cx - 96 + i * 24, cy - 30); c.lineTo(cx - 84 + i * 24, cy - 8); c.lineTo(cx - 72 + i * 24, cy - 30); c.fill(); c.beginPath(); c.moveTo(cx - 90 + i * 24, cy + 30); c.lineTo(cx - 78 + i * 24, cy + 8); c.lineTo(cx - 66 + i * 24, cy + 30); c.fill(); } c.restore(); c.strokeStyle = "#5a1014"; c.lineWidth = 6; c.beginPath(); c.moveTo(cx - 110, cy); c.quadraticCurveTo(cx, cy - 48, cx + 110, cy); c.quadraticCurveTo(cx, cy + 52, cx - 110, cy); c.stroke(); });
function bocaBochecha(p, lado = 1) {
  const u = p.userData, zAt = (x, y) => surfZ(u.headM, x, y);
  const x = lado * 0.05, y = 0.04, gg = grp(u.head, x, y, zAt(x, y) + 0.004); gg.rotation.set(0, lado * 0.45, lado * 0.15);
  const m = decal(gg, bocaBochechaTex, 0.05, 0.025, 0, 0, 0, 0, 0, {}); gg.scale.set(1, 0.001, 1);
  return { set(k) { gg.scale.set(0.6 + 0.4 * k, Math.max(0.001, k), 1); gg.visible = k > 0.01; } };
}
const GOLDM = () => new THREE.MeshStandardMaterial({ color: 0xe8b040, metalness: 0.92, roughness: 0.24, emissive: 0x4a2a00, emissiveIntensity: 0.35, envMap: envGold(), envMapIntensity: 1.1 });

// ================================================================ vídeo: Como o Light perdeu pro Near e pro Mello? (comum)
// Usa su-comum.js (efeitos de luz, câmera em planos, chuva, orbe, linhas de luz). Personagens de Death Note desenhados
// por nós em low-poly; cenários baseados nos lugares do anime, redesenhados (nada de print ou arte oficial).
function vive(p, t, seed, rosto = {}, amt = 0.4) { restPose(p); idle(p, t, seed, amt); standFeet(p); rostoLP(p, t, rosto); }
function olhosW(p) { p.updateMatrixWorld(true); return p.userData.head.localToWorld(V3(0, CAB.EY, CAB.HW * 0.9)); }
function peitoW(p) { p.updateMatrixWorld(true); return p.userData.chest.localToWorld(V3(0, 0.16, 0.12)); }
const arr = (v) => [v.x, v.y, v.z];
const add3 = (v, d) => [v.x + d[0], v.y + d[1], v.z + d[2]];
// close no rosto: câmera a d da frente do personagem (rotação y), com deslocamento lateral
function closeRosto(p, d = 0.8, lado = 0.15, dy = 0, fov = 30) { const e = olhosW(p), a = p.rotation.y; return { pos: [e.x + Math.sin(a) * d + Math.cos(a) * lado, e.y + dy, e.z + Math.cos(a) * d - Math.sin(a) * lado], look: [e.x, e.y - 0.03, e.z], fov, near: 0.02 }; }

// ---------------------------------------------------------------- elenco de Death Note
const DN = { terno: 0x2a2c34, camisa: 0xe8e8e4, gravata: 0x8a1a22 };
const CABELOS_DN = {
  light: { cor: 0x7a4a2c, dentes: 16, dente: 0.34, crista: 0.004, franjaY: 0.95, ladoY: 0.05, nucaY: -0.75, esp: 0.009, espBorda: 0.0036, varia: 0.08, seed: 51, giro: 0.15,
    pontas: [...coroa(4, 1.0, 0.62, 0.42, 0.0, 0.0, -0.32, 0.5, -0.1, 0.4), ...coroa(5, 1.45, 0.4, 0.48, 0.35, 0.3, 0.55, 0.9, 0.06, 0.6)] },
  near: { cor: 0xeef0f4, dentes: 14, dente: 0.22, crista: 0.004, franjaY: 1.0, ladoY: 0.2, nucaY: -0.4, esp: 0.012, espBorda: 0.006, varia: 0.06, seed: 52,
    pontas: [...coroa(10, 1.5, 0.3, 0.42, 0.45, 0.1, 0.0, 2, -0.5, 0.7), ...coroa(9, 1.1, 0.3, 0.42, 0.35, 0.2, 0.05, 2, -0.6, 0.7), ...coroa(7, 0.55, 0.28, 0.4, 0.2, 0.2, 0.3, 1.4, -0.6, 0.7)] },
  mello: { cor: 0xe8c860, dentes: 26, dente: 0.12, crista: 0.003, franjaY: 1.0, ladoY: -1.0, nucaY: -1.3, esp: 0.009, espBorda: 0.004, varia: 0.03, seed: 53, pontas: [] },
  mikami: { cor: 0x1a1a20, dentes: 18, dente: 0.24, crista: 0.004, franjaY: 1.15, ladoY: 0.0, nucaY: -0.7, esp: 0.008, espBorda: 0.0034, varia: 0.05, seed: 54, giro: -0.2,
    pontas: coroa(4, 1.05, 0.6, 0.4, 0.0, 0.0, 0.2, 0.5, -0.1, 0.4) },
  takada: { cor: 0x2a1c18, dentes: 22, dente: 0.14, crista: 0.003, franjaY: 1.0, ladoY: -0.9, nucaY: -1.1, esp: 0.009, espBorda: 0.004, varia: 0.03, seed: 55, pontas: [] },
  ryuk: { cor: 0x101014, dentes: 12, dente: 0.6, crista: 0.006, franjaY: 0.7, ladoY: -0.2, nucaY: -0.9, esp: 0.012, espBorda: 0.005, varia: 0.2, seed: 56,
    pontas: [...coroa(9, 1.45, 0.75, 0.42, 0.8, 0.2, 0.0, 2, 0.1, 0.5), ...coroa(8, 0.9, 0.7, 0.4, 0.6, 0.3, 0.1, 2, 0.1, 0.5)] },
};
function oculos(p, cor = 0x202024) { const u = p.userData, m = LPmat(cor, { metal: 0.6, rough: 0.3 }); [-1, 1].forEach((k) => { const r = mesh(new THREE.TorusGeometry(0.02, 0.0025, 4, 12), m, k * 0.036, CAB.EY, surfZ(u.headM, k * 0.036, CAB.EY) + 0.006, u.head); r.scale.y = 0.8; }); mesh(box(0.02, 0.003, 0.003), m, 0, CAB.EY + 0.004, surfZ(u.headM, 0, CAB.EY) + 0.007, u.head); }
function gravata(p, cor = DN.gravata) { const u = p.userData, m = LPmat(cor, { rim: 0.6 }); const g = mesh(new THREE.ConeGeometry(0.022, 0.2, 4), m, 0, 0.18, 0.125, u.chest); g.rotation.set(Math.PI + 0.12, Math.PI / 4, 0); g.scale.z = 0.3; mesh(box(0.034, 0.03, 0.02), m, 0, 0.29, 0.12, u.chest); }
function lightLP(o = {}) { const p = pessoaLP({ seed: 61, pele: 0xffe0bc, olho: o.kira ? "#c41e2a" : "#8a4a2a", olhoAlt: 0.86, olhoTam: 0.94, brava: 0.15, roupa: DN.terno, calca: DN.terno, botoes: false, sobrancelha: 0x5a3020, cabelo: CABELOS_DN.light, ...o }); gravata(p); return p; }
function nearLP(o = {}) { return pessoaLP({ seed: 62, pele: 0xfff0e4, olho: "#3a3a44", olhoAlt: 0.85, roupa: 0xf2f2f4, calca: 0xf2f2f4, botoes: false, sobrancelha: 0xcfd2d8, cabelo: CABELOS_DN.near, scale: 0.9, ...o }); }
function melloLP(o = {}) { return pessoaLP({ seed: 63, pele: 0xffe2c4, olho: "#3a6a7a", olhoAlt: 0.82, brava: 0.5, roupa: 0x141418, calca: 0x141418, botoes: false, sobrancelha: 0xb89a40, cabelo: CABELOS_DN.mello, ...o }); }
function mikamiLP(o = {}) { const p = pessoaLP({ seed: 64, pele: 0xffe4c8, olho: "#3a2a24", olhoAlt: 0.78, brava: 0.4, roupa: 0x1c1e26, calca: 0x1c1e26, botoes: false, sobrancelha: 0x141418, cabelo: CABELOS_DN.mikami, ...o }); oculos(p); gravata(p, 0x2a3a6a); return p; }
function takadaLP(o = {}) { return pessoaLP({ seed: 65, pele: 0xffe6cc, olho: "#4a2a24", olhoAlt: 0.9, blush: true, roupa: 0x6a2a3a, calca: 0x3a1a24, botoes: false, sobrancelha: 0x2a1c18, cabelo: CABELOS_DN.takada, scale: 0.95, ...o }); }
// Ryuk: shinigami alto, magro e curvado; rosto pálido azulado, olhos amarelos com pupila vermelha pequena, sorriso de lábios
// escuros de orelha a orelha, cabelo espetado, gola de penas, roupa de couro com cinto de corrente (sem asas abertas)
function ryukLP(o = {}) {
  const p = pessoaLP({ seed: 66, pele: 0xc4cede, olho: "#c41818", olhoOpts: { esclera: "#f0d23c", ir: 0.42, cilio: "#0a0a10" }, olhoAlt: 1.05, olhoTam: 1.18, brava: 0.15, roupa: 0x16161c, calca: 0x16161c, botoes: false, sobrancelha: 0x101014, cabelo: CABELOS_DN.ryuk, scale: 1.3, bocaRyuk: true, ...o });
  const u = p.userData, pena = LPmat(0x0c0c10, { rim: 0.9, rough: 0.9 }), metal = LPmat(0x9aa0aa, { metal: 0.85, rough: 0.3, rim: 0.6 });
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; const c = mesh(new THREE.ConeGeometry(0.028, 0.15, 3), pena, Math.sin(a) * 0.13, 0.3, Math.cos(a) * 0.1 - 0.01, u.chest); c.rotation.set(Math.cos(a) * 1.1, 0, -Math.sin(a) * 1.1); }
  // cinto de corrente e a corrente pendurada no quadril
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const r = mesh(new THREE.TorusGeometry(0.014, 0.004, 4, 8), metal, Math.sin(a) * 0.155, 0.04, Math.cos(a) * 0.125, u.hips); r.rotation.y = a + (i % 2) * 1.57; }
  for (let i = 0; i < 6; i++) { const r = mesh(new THREE.TorusGeometry(0.012, 0.0035, 4, 8), metal, 0.12 + i * 0.006, 0.0 - i * 0.022, 0.1 - i * 0.004, u.hips); r.rotation.set(0, (i % 2) * 1.57, 0.3); }
  // magro: tronco, braços e pernas mais finos (o comprimento fica igual para o IK)
  u.chest.userData.sc0 = new THREE.Vector3(0.84, 1, 0.86); u.chest.scale.copy(u.chest.userData.sc0); u.spine.scale.set(0.84, 1, 0.86);
  u.sh.forEach((g) => g.scale.set(0.8, 1, 0.8)); u.hipJ.forEach((g) => g.scale.set(0.8, 1, 0.8));
  u.headM.material = u.headM.material.clone(); u.headM.material.emissive = new THREE.Color(0x4a5268); u.headM.material.emissiveIntensity = 0.55;
  u.asas = null; u.curvado = true;
  return p;
}
// postura do Ryuk: costas curvadas, pescoço pra frente, cabeça erguida olhando
function ryukPostura(p, k = 1) { const u = p.userData; pose(p, { spine: [0.32, 0, 0], chest: [0.22, 0, 0], neck: [0.5, 0, 0], head: [-0.62, 0, 0] }, k); u.sh.forEach((g, i) => { g.rotation.x -= 0.25 * k; g.rotation.z += (i ? 1 : -1) * 0.06 * k; }); u.el.forEach((e) => (e.rotation.x -= 0.25 * k)); }
// o Near sentado no chão com o joelho direito levantado (pose clássica), a perna esquerda dobrada de lado
function nearSentado(p, k = 1) { const u = p.userData; pose(p, { hipsPos: [0, -(u.d.hipY - 0.12), 0], hips: [0, 0, 0], spine: [0.42, 0, 0], chest: [0.18, 0, 0], legR: [-2.25, -0.1, 0.05, 2.35, 0.25], legL: [-1.5, -0.35, -1.05, 2.3, 0.2] }, k); }

// ---------------------------------------------------------------- objetos
const capaTex = canvasTex(256, 360, (c, w, h) => { c.fillStyle = "#0c0c0e"; c.fillRect(0, 0, w, h); c.strokeStyle = "#3a3a40"; c.lineWidth = 4; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = "#e8e8e8"; c.font = "italic bold 46px serif"; c.textAlign = "center"; c.fillText("Caderno", w / 2, 150); c.fillText("da Morte", w / 2, 205); });
const paginaTex = canvasTex(256, 360, (c, w, h) => { c.fillStyle = "#f2efe6"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(60,80,140,.35)"; c.lineWidth = 2; for (let y = 40; y < h; y += 22) { c.beginPath(); c.moveTo(14, y); c.lineTo(w - 14, y); c.stroke(); } c.fillStyle = "#1a1a1a"; c.font = "22px serif"; ["Higuchi", "Kida", "Ooi", "Tanaka", "Watari"].forEach((n, i) => c.fillText(n, 24, 62 + i * 44)); });
function caderno(g, o = {}) {
  const c = grp(g), capa = new THREE.MeshStandardMaterial({ map: capaTex, roughness: 0.6 }), preto = LPmat(0x0c0c0e), pg = new THREE.MeshStandardMaterial({ map: paginaTex, roughness: 0.8, emissive: 0xffffff, emissiveMap: paginaTex, emissiveIntensity: 0.08 });
  mesh(box(0.26, 0.012, 0.36), preto, 0, 0.006, 0, c); const fol = mesh(box(0.25, 0.02, 0.35), LPmat(0xf0ece2), 0, 0.02, 0, c);
  const tampa = grp(c, -0.13, 0.031, 0); const tp = mesh(new THREE.PlaneGeometry(0.26, 0.36), capa, 0.13, 0.001, 0, tampa); tp.rotation.x = -Math.PI / 2;
  const pag = mesh(new THREE.PlaneGeometry(0.24, 0.34), pg, 0, 0.031, 0, c); pag.rotation.x = -Math.PI / 2; pag.visible = false;
  return { c, tampa, pag, abrir(k) { tampa.rotation.z = Math.PI * 0.95 * clamp(k); pag.visible = k > 0.4; } };
}
function maca(g, s = 1) { const m = grp(g); mesh(new THREE.IcosahedronGeometry(0.045 * s, 1), LPmat(0xb8141c, { rim: 0.8, rough: 0.4 }), 0, 0, 0, m).scale.y = 0.9; mesh(cyl(0.004 * s, 0.004 * s, 0.03 * s, 4), LPmat(0x3a2a18), 0, 0.045 * s, 0, m); const f = mesh(new THREE.ConeGeometry(0.012 * s, 0.03 * s, 3), LPmat(0x3a7a2a), 0.012 * s, 0.05 * s, 0, m); f.rotation.z = -1.2; return m; }
// peças de xadrez (o Light é o rei; o Near, peão branco; o Mello, peão preto)
function peca(g, tipo, cor) { const m = LPmat(cor, { rim: 0.8, rough: 0.35, metal: 0.1 }), p = grp(g); const prof = tipo === "rei" ? [[0.001, 0], [0.11, 0], [0.11, 0.03], [0.06, 0.06], [0.045, 0.3], [0.08, 0.34], [0.05, 0.38], [0.06, 0.46], [0.001, 0.48]] : [[0.001, 0], [0.09, 0], [0.09, 0.025], [0.05, 0.05], [0.035, 0.18], [0.06, 0.2], [0.001, 0.21]];
  mesh(lathe(prof, 8), m, 0, 0, 0, p); if (tipo === "rei") { mesh(box(0.02, 0.1, 0.02), m, 0, 0.53, 0, p); mesh(box(0.07, 0.02, 0.02), m, 0, 0.55, 0, p); } else mesh(sph(0.055, 8, 6), m, 0, 0.25, 0, p); return p; }
const tabuleiroTex = canvasTex(512, 512, (c, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? "#2a2420" : "#d8ccb4"; c.fillRect(i * 64, j * 64, 64, 64); } });
function tabuleiro(g, s = 1) { const t = grp(g); mesh(box(1.7 * s, 0.06, 1.7 * s), LPmat(0x3a2418), 0, 0.03, 0, t); const sup = mesh(new THREE.PlaneGeometry(1.6 * s, 1.6 * s), new THREE.MeshStandardMaterial({ map: tabuleiroTex, roughness: 0.35, metalness: 0.1 }), 0, 0.061, 0, t); sup.rotation.x = -Math.PI / 2; return t; }
// monitores (parede de telas da força-tarefa)
const telaTex = (txt, cor) => canvasTex(256, 160, (c, w, h) => { c.fillStyle = "#04070c"; c.fillRect(0, 0, w, h); c.fillStyle = cor; c.globalAlpha = 0.25; for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 1); c.globalAlpha = 1; c.font = "bold 64px serif"; c.textAlign = "center"; c.fillText(txt, w / 2, 104); });
function paredeTelas(g, x, z, cols, rows, o = {}) { const ts = []; const txts = o.txts || ["L", "N", "M", "K"]; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const tx = telaTex(txts[(i + j * 3) % txts.length], o.cor ?? "#7ad0ff"); const m = mesh(box(0.92, 0.58, 0.05), new THREE.MeshStandardMaterial({ color: 0x0a0c10, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 1.1, map: tx }), x + (i - (cols - 1) / 2) * 1.0, (o.y0 ?? 1.0) + j * 0.66, z, g); m.castShadow = false; ts.push(m); } return ts; }
// quebra-cabeça branco do Near (peças no chão)
function puzzle(g, n = 20, raio = 0.9) { const ps = []; const m = LPmat(0xf4f4f6, { rim: 0.5, rough: 0.5 }); for (let i = 0; i < n; i++) { const p = mesh(box(0.1, 0.012, 0.1), m, (hash(i) - 0.5) * raio * 2, 0.006, (hash(i * 3) - 0.5) * raio * 1.4, g); p.rotation.y = hash(i * 5) * 3; ps.push(p); } return ps; }
// galpão amarelo (Yellow Box): paredes de chapa ondulada amarela, porta de ferro, pilares, luz entrando pelo alto
const chapaTex = canvasTex(256, 256, (c, w, h) => { for (let x = 0; x < w; x += 16) { const g_ = c.createLinearGradient(x, 0, x + 16, 0); g_.addColorStop(0, "#b89428"); g_.addColorStop(0.5, "#e8c448"); g_.addColorStop(1, "#a07e1e"); c.fillStyle = g_; c.fillRect(x, 0, 16, h); } c.fillStyle = "rgba(60,40,10,.25)"; for (let i = 0; i < 30; i++) c.fillRect(hash(i) * w, hash(i * 3) * h, 2 + hash(i * 5) * 10, 20 + hash(i * 7) * 60); });
function galpao(g) {
  const parede = new THREE.MeshStandardMaterial({ map: rep(chapaTex, 6, 2), roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide }); parede.map.needsUpdate = true;
  mesh(box(16, 6, 0.2), parede, 0, 3, -6, g); [-8, 8].forEach((x) => mesh(box(0.2, 6, 14), parede, x, 3, 1, g)); mesh(box(16, 0.2, 14), LPmat(0x3a3020), 0, 6, 1, g);
  const chao = mesh(new THREE.PlaneGeometry(16, 14), new THREE.MeshStandardMaterial({ color: 0x5a5448, roughness: 0.4, metalness: 0.3 }), 0, 0, 1, g); chao.rotation.x = -Math.PI / 2;
  mesh(box(3.2, 4, 0.12), LPmat(0x4a4a50, { metal: 0.6, rough: 0.5 }), 0, 2, -5.85, g);
  [-4.5, 4.5].forEach((x) => [-3, 2].forEach((z) => mesh(box(0.35, 6, 0.35), LPmat(0x6a5a3a), x, 3, z, g)));
  for (let i = 0; i < 5; i++) { const j = mesh(box(1.4, 0.5, 0.05), new THREE.MeshBasicMaterial({ color: 0xfff0c0 }), -5 + i * 2.5, 5.2, -5.85, g); j.castShadow = false; }
  return godRays(g, [0, 5.4, -5], [0.15, -1, 0.9], { color: 0xffe0a0, n: 6, len: 9, w: 1.2, opacity: 0.06, spread: 8 });
}
// quarto do Light à noite: escrivaninha, luminária, janela com a cidade, cama
const cidadeTex = canvasTex(256, 256, (c, w, h) => { const g_ = c.createLinearGradient(0, 0, 0, h); g_.addColorStop(0, "#0a1024"); g_.addColorStop(1, "#2a2a4a"); c.fillStyle = g_; c.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { const x = i * 18 + hash(i) * 6, bh = 60 + hash(i * 3) * 120; c.fillStyle = "#0c0e18"; c.fillRect(x, h - bh, 16, bh); c.fillStyle = "#ffd890"; for (let k = 0; k < 10; k++) if (hash(i * 13 + k) > 0.6) c.fillRect(x + 3 + (k % 2) * 6, h - bh + 8 + Math.floor(k / 2) * 14, 4, 6); } });
function quartoLight(g) {
  const parede = LPmat(0x4a4a5a, { rim: 0.2, rough: 0.95 }), madeira = LPmat(0x6a4a30, { rim: 0.4 });
  const chao = mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.6 }), 0, 0, 0, g); chao.rotation.x = -Math.PI / 2;
  mesh(box(10, 4, 0.2), parede, 0, 2, -2.2, g); mesh(box(0.2, 4, 10), parede, -3.2, 2, 2, g); mesh(box(0.2, 4, 10), parede, 3.4, 2, 2, g);
  const jan = mesh(new THREE.PlaneGeometry(1.8, 1.4), new THREE.MeshBasicMaterial({ map: cidadeTex }), 1.2, 2.1, -2.08, g); jan.castShadow = false;
  [[0, 0.72], [0, -0.72]].forEach(() => {}); mesh(box(1.9, 0.08, 0.1), madeira, 1.2, 2.8, -2.05, g); mesh(box(1.9, 0.08, 0.1), madeira, 1.2, 1.4, -2.05, g); mesh(box(0.06, 1.4, 0.1), madeira, 1.2, 2.1, -2.05, g);
  // escrivaninha
  mesh(box(1.6, 0.06, 0.7), madeira, 0, 0.76, -1.65, g); [[-0.75, -1.95], [0.75, -1.95], [-0.75, -1.35], [0.75, -1.35]].forEach(([x, z]) => mesh(box(0.06, 0.76, 0.06), madeira, x, 0.38, z, g));
  const lum = grp(g, -0.55, 0.79, -1.85); mesh(cyl(0.08, 0.1, 0.03, 8), LPmat(0x1a1a1e), 0, 0, 0, lum); mesh(cyl(0.012, 0.012, 0.42, 5), LPmat(0x1a1a1e), 0, 0.21, 0, lum); const cup = mesh(new THREE.ConeGeometry(0.12, 0.14, 8, 1, true), LPmat(0x2a2a30, { side: THREE.DoubleSide }), 0.08, 0.44, 0.06, lum); cup.rotation.z = -0.6;
  const luz = new THREE.SpotLight(0xffd8a0, 1.6, 4, 0.8, 0.5, 1.5); luz.position.set(-0.45, 1.2, -1.75); luz.target.position.set(0, 0.76, -1.6); g.add(luz, luz.target); const bulbo = glowSprite(0xffd8a0, 0.12, 0.6); bulbo.position.set(-0.45, 1.18, -1.77); g.add(bulbo);
  // cadeira e cama
  mesh(box(0.5, 0.06, 0.5), LPmat(0x2a2a30), 0, 0.48, -0.95, g); mesh(box(0.5, 0.6, 0.06), LPmat(0x2a2a30), 0, 0.8, -0.72, g); mesh(cyl(0.03, 0.03, 0.46, 5), LPmat(0x1a1a1e), 0, 0.23, -0.95, g);
  mesh(box(1.1, 0.45, 2.1), LPmat(0x3a4a6a, { rim: 0.3 }), -2.4, 0.22, 0.4, g);
  return { luz, bulbo };
}

// cartões do Discord (keys) e claquete (aulas)
const keyTex = canvasTex(256, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#2a2050"); gr.addColorStop(1, "#7a5ad8"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,240,255,.9)"; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = "#fff"; c.font = "bold 54px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.fillText("KEY", w / 2, 82); c.font = "bold 22px sans-serif"; c.fillText("XXXX-XXXX-XXXX", w / 2, 122); });
const claqTex = canvasTex(256, 192, (c, w, h) => { c.fillStyle = "#1a1a1e"; c.fillRect(0, 0, w, h); c.fillStyle = "#f2f2f2"; for (let i = 0; i < 6; i++) { c.save(); c.translate(i * 48, 0); c.beginPath(); c.moveTo(0, 0); c.lineTo(24, 0); c.lineTo(48, 44); c.lineTo(24, 44); c.fill(); c.restore(); } c.font = "bold 30px sans-serif"; c.textAlign = "center"; c.fillText("AULA", w / 2, 110); c.font = "bold 22px sans-serif"; c.fillText("COMO FAZER", w / 2, 150); });

// ---------------------------------------------------------------- mãos e gestos (v2)
// objeto preso no punho fechado: o eixo z do objeto vai do mindinho ao polegar; dx empurra pra palma
function naMao(p, i, obj, o = {}) { const w = p.userData.wr[i], k = i ? -1 : 1; w.add(obj); obj.position.set(k * (o.dx ?? 0.012), o.dy ?? -0.07, o.dz ?? 0.0); obj.rotation.set(...(o.rot || [0, 0, 0])); const s = 1 / p.scale.x; obj.scale.setScalar((o.s ?? 1) * s); return obj; }
// pontos do corpo no mundo
function bocaW(p, fz = 0.03) { p.updateMatrixWorld(true); return p.userData.head.localToWorld(V3(0, 0.009, CAB.HW + fz)); }
function corpoW(p, osso, x, y, z) { p.updateMatrixWorld(true); return p.userData[osso].localToWorld(V3(x, y, z)); }
// ponto à frente do personagem (no referencial do corpo: x direita do personagem, y altura, z frente)
function frenteW(p, x, y, z) { const a = p.rotation.y, s = p.scale.x; return V3(p.position.x + (Math.cos(a) * -x + Math.sin(a) * z) * s, p.position.y + y * s, p.position.z + (Math.sin(a) * x + Math.cos(a) * z) * s); }
// mão i até o alvo (mundo), cotovelo pra fora e pra baixo
function maoEm(p, i, alvo, k = 1, o = {}) { if (k <= 0) return; const lado = i ? -1 : 1; const pole = frenteW(p, lado * (o.abre ?? 0.6), o.poleY ?? 0.4, o.poleZ ?? -0.3); armIK(p, i, alvo, pole, clamp(k)); }
const mixV = (a, b, k) => a.clone().lerp(b, clamp(k));
// mordida: 0 → mão no peito, 1 → na boca (com antecipação e volta)
function mordidas(t, ts, dur = 0.9) { let m = 0; ts.forEach((t0) => { const u = seg(t, t0, t0 + dur); if (u > 0 && u < 1) m = Math.max(m, Math.sin(u * Math.PI) ** 0.6); }); return m; }
// barra de chocolate (eixo longo em z) e caneta
function chocolate() { const c = grp(null); mesh(box(0.05, 0.014, 0.15), LPmat(0x4a2414, { rough: 0.5 }), 0, 0, 0.03, c); mesh(box(0.054, 0.018, 0.09), LPmat(0xc8ccd4, { metal: 0.8, rough: 0.25, rim: 0.8 }), 0, 0, -0.035, c); return c; }
function caneta(cor = 0x101012) { const c = grp(null); mesh(cyl(0.006, 0.006, 0.15, 6), LPmat(cor, { metal: 0.4, rough: 0.3 }), 0, 0, 0, c).rotation.x = Math.PI / 2; mesh(new THREE.ConeGeometry(0.006, 0.02, 6), LPmat(0xc0c0c8, { metal: 0.8 }), 0, 0, 0.085, c).rotation.x = Math.PI / 2; return c; }
// objeto solto no mundo, preso à mão i e apontando pra um alvo (ex.: a barra de chocolate apontando pra boca)
const _Z = new THREE.Vector3(0, 0, 1);
function apontaDaMao(obj, p, i, alvo, off = 0.05) { p.updateMatrixWorld(true); const k = i ? -1 : 1, s = p.scale.x; const de = p.userData.wr[i].localToWorld(V3(k * 0.02, -0.075, 0)); const d = alvo.clone().sub(de).normalize(); obj.position.copy(de).addScaledVector(d, off * s); obj.quaternion.setFromUnitVectors(_Z, d); return de; }

// câmera de depuração (só nos testes: window.TEST_CAM ≥ 1)
const DBGC = {
  "s1-abertura": [{ pos: [1.5, 1.0, -0.6], look: [0, 0.6, -1.1], fov: 45 }, { pos: [-1.4, 1.1, -0.2], look: [0, 0.6, -1.2], fov: 45 }],
  "s2-herdeiros": [{ pos: [0.2, 0.9, 1.6], look: [-0.9, 0.4, 0.3], fov: 45 }, { pos: [1.0, 1.4, 2.2], look: [1.0, 1.0, -0.1], fov: 45 }],
  "s3-erro": [{ pos: [0, 1.4, 3.4], look: [0, 1.0, -0.2], fov: 45 }, { pos: [2.4, 1.4, 1.2], look: [0.3, 1.0, -0.3], fov: 45 }],
  "s5-sacrificio": [{ pos: [0.5, 1.3, 2.5], look: [-0.3, 0.8, -0.6], fov: 45 }, { pos: [2.2, 1.6, -38.4], look: [0.2, 1.0, -39.6], fov: 45 }],
  "s6-falso": [{ pos: [0.2, 1.0, 1.2], look: [1.4, 0.5, 1.2], fov: 45 }, { pos: [0.0, 1.5, 3.2], look: [-1.6, 1.0, 0.6], fov: 45 }],
  "s7-fim": [{ pos: [0.6, 1.4, 2.4], look: [-1.3, 0.7, 0.0], fov: 45 }, { pos: [1.2, 1.8, 1.4], look: [-0.9, 1.4, -1.7], fov: 45 }],
};
function dbgCam(nome) { const c = (typeof window !== "undefined" && window.TEST_CAM) | 0; return c >= 1 ? (DBGC[nome] || [])[c - 1] || null : null; }

// ================================================================ vídeo: Por que o Grisha comeu a família real? (comum)
// Estilo do vídeo de referência (GUIA-ANIMACAO-ESTILO.md): vento nas folhas, na grama, no cabelo e no casaco; fundo desfocado;
// cenários de Attack on Titan redesenhados por nós em low-poly (muralhas, Shiganshina, capela dos Reiss, caverna de cristal,
// Caminhos). Usa su-comum.js e li-comum.js.

// ---------------------------------------------------------------- vento: folhas voando (instanciadas, determinísticas)
// box = [x0, x1, y0, y1, z0, z1]; dir = direção do vento; cada folha atravessa a caixa e volta (posição = função do tempo)
function folhasVento(g, n, box, o = {}) {
  const geo = new THREE.PlaneGeometry(0.07, 0.035); geo.translate(0.02, 0, 0);
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.7, emissive: o.brilho ?? 0x1a3a10, emissiveIntensity: 0.4 });
  const im = new THREE.InstancedMesh(geo, m, n); im.frustumCulled = false; im.castShadow = false; g.add(im);
  const cols = o.cores ?? [0x6aa83a, 0x8ac04a, 0x4a8a2a, 0xa8c858], col = new THREE.Color();
  for (let i = 0; i < n; i++) im.setColorAt(i, col.setHex(cols[i % cols.length]));
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const [x0, x1, y0, y1, z0, z1] = box, dir = new THREE.Vector3(...(o.dir ?? [1, -0.25, 0.15])).normalize(), vel = o.vel ?? 2.2, L = x1 - x0;
  return (t, forca = 1) => {
    for (let i = 0; i < n; i++) {
      const sp = vel * (0.7 + hash(i * 3.1) * 0.6) * forca, ph = hash(i * 1.7) * L, d = ((ph + t * sp) % L + L) % L;
      p.set(x0 + d, y0 + hash(i * 5.3) * (y1 - y0) + dir.y * d * 0.3 + Math.sin(t * 2.1 + i) * 0.12, z0 + hash(i * 7.9) * (z1 - z0) + dir.z * d + Math.cos(t * 1.7 + i * 2) * 0.1);
      e.set(t * (3 + hash(i) * 5) + i, t * (2 + hash(i * 2) * 4), t * 4 + i * 0.7); q.setFromEuler(e); const k = (o.s ?? 1) * (0.7 + hash(i * 9) * 0.8); s.set(k * 1.6, k, k);
      M4.compose(p, q, s); im.setMatrixAt(i, M4);
    }
    im.instanceMatrix.needsUpdate = true;
  };
}
// aba de casaco/cachecol que bate ao vento: plano com vértices ondulando (preso no osso 'osso')
function abaVento(p, osso, w, h, cor, pos, rot = [0, 0, 0], o = {}) {
  const u = p.userData, geo = new THREE.PlaneGeometry(w, h, 3, 8); geo.translate(0, -h / 2, 0);
  const m = mesh(geo, LPmat(cor, { rim: 0.8, side: THREE.DoubleSide }), ...pos, u[osso] || osso); m.rotation.set(...rot);
  const a = geo.attributes.position, b = a.array.slice();
  m.userData.vento = (t, forca = 1) => { for (let i = 0; i < a.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], k = Math.min(1, -y / h); a.setZ(i, b[i * 3 + 2] - (o.tras ?? 0.07) * k * forca * (1 + 0.25 * Math.sin(t * 3)) + Math.sin(t * 7 + y * 18 + x * 9) * 0.018 * k * forca); a.setX(i, x + Math.sin(t * 5.3 + y * 12) * 0.012 * k * forca); } a.needsUpdate = true; geo.computeVertexNormals(); };
  (u.abas = u.abas || []).push(m); return m;
}
function ventoAbas(p, t, f = 1) { (p.userData.abas || []).forEach((m) => m.userData.vento(t, f)); }

// ---------------------------------------------------------------- elenco de Attack on Titan (desenho nosso)
const barbaTex = canvasTex(128, 64, (c, w, h) => { const g_ = c.createRadialGradient(w / 2, h * 0.72, 3, w / 2, h * 0.66, w * 0.42); g_.addColorStop(0, "rgba(40,30,26,.42)"); g_.addColorStop(0.6, "rgba(40,30,26,.22)"); g_.addColorStop(1, "rgba(40,30,26,0)"); c.fillStyle = g_; c.fillRect(0, 0, w, h); c.clearRect(w * 0.34, h * 0.36, w * 0.32, h * 0.2); });
function barba(p) { const u = p.userData; const zAt = (x, y) => surfZ(u.headM, x, y); decal(u.head, barbaTex, 0.13, 0.06, 0, -0.005, zAt(0, -0.005) + 0.004, 0, 0, { suave: true }); }
const CABELOS_AOT = {
  // Grisha: cabelo até o ombro preso atrás, repartido no meio, mechas caindo dos lados do rosto
  grisha: { cor: 0x3a2618, dentes: 22, dente: 0.2, crista: 0.003, franjaY: 0.92, ladoY: -0.95, nucaY: -1.0, esp: 0.009, espBorda: 0.004, varia: 0.06, seed: 91,
    pontas: [[1.05, 0.95, 0.6, 0.32, -0.75, 0.05, -0.1, 0.5], [1.05, -0.95, 0.6, 0.32, -0.75, 0.05, -0.1, 0.5], [1.22, 0.32, 0.42, 0.3, -0.45, 0.0, -0.15, 0.5], [1.22, -0.3, 0.4, 0.3, -0.5, 0.0, -0.15, 0.5]] },
  // Kruger: preto, bagunçado, mechas caindo na testa
  kruger: { cor: 0x1a1a1e, dentes: 18, dente: 0.3, crista: 0.004, franjaY: 0.95, ladoY: 0.05, nucaY: -0.7, esp: 0.009, espBorda: 0.0036, varia: 0.12, seed: 92,
    pontas: [...coroa(6, 1.28, 0.42, 0.4, -0.3, 0.05, -0.65, 1.3, -0.15, 0.5), ...coroa(5, 1.5, 0.36, 0.42, 0.3, 0.35, 0.6, 1.2, 0.05, 0.6)] },
  // Frieda: chanel preto com franja reta
  frieda: { cor: 0x141418, dentes: 30, dente: 0.1, crista: 0.003, franjaY: 0.86, ladoY: -0.62, nucaY: -0.9, esp: 0.009, espBorda: 0.004, varia: 0.03, seed: 93, pontas: [] },
  rod: { cor: 0x8a7050, dentes: 18, dente: 0.2, crista: 0.003, franjaY: 1.25, ladoY: 0.0, nucaY: -0.6, esp: 0.007, espBorda: 0.003, varia: 0.05, seed: 94, pontas: coroa(4, 1.45, 0.4, 0.45, 0.2, 0.5, -0.3, 0.6, 0.1, 0.5) },
  // Eren adulto: cabelo comprido até o queixo, repartido, meio coque
  erenAdulto: { cor: 0x2e1e14, dentes: 22, dente: 0.18, crista: 0.003, franjaY: 0.95, ladoY: -1.05, nucaY: -0.95, esp: 0.009, espBorda: 0.004, varia: 0.07, seed: 95,
    pontas: [[1.05, 1.0, 0.7, 0.34, -0.8, 0.05, -0.1, 0.5], [1.05, -1.0, 0.7, 0.34, -0.8, 0.05, -0.1, 0.5], [1.25, 0.3, 0.5, 0.3, -0.55, 0.0, -0.15, 0.5], [1.25, -0.28, 0.48, 0.3, -0.6, 0.0, -0.15, 0.5]] },
};
// óculos redondos do Grisha
function oculosRedondos(p) { const u = p.userData, m = LPmat(0x8a6a3a, { metal: 0.8, rough: 0.25, rim: 0.3, liso: true }); [-1, 1].forEach((k) => { mesh(new THREE.TorusGeometry(0.0205, 0.0013, 6, 32), m, k * 0.036, CAB.EY - 0.002, surfZ(u.headM, k * 0.036, CAB.EY) + 0.008, u.head); mesh(box(0.012, 0.0014, 0.0014), m, k * 0.062, CAB.EY + 0.004, surfZ(u.headM, k * 0.062, CAB.EY) + 0.002, u.head); }); mesh(box(0.016, 0.0014, 0.0014), m, 0, CAB.EY + 0.004, surfZ(u.headM, 0, CAB.EY) + 0.009, u.head); }
// coque/rabo de cavalo
function rabo(p, cor, y = 0.06, z = -0.1, L = 0.12) { const u = p.userData, m = LPmat(cor, { rim: 0.5 }); const r = mesh(new THREE.ConeGeometry(0.03, L, 5), m, 0, y - L / 2, z, u.head); r.rotation.x = Math.PI - 0.25; return r; }
function coque(p, cor) { const u = p.userData; mesh(sph(0.04, 7, 5), LPmat(cor, { rim: 0.5 }), 0, 0.16, -0.08, u.head); }
function casacoLongo(p, cor, L = 0.62) { const u = p.userData; const c = mesh(new THREE.CylinderGeometry(0.165, 0.25, L, 12, 1, true), LPmat(cor, { rim: 0.8, side: THREE.DoubleSide }), 0, -L / 2 + 0.06, -0.005, u.hips); c.scale.z = 0.82; abaVento(p, "hips", 0.2, L * 0.9, cor, [0.09, -0.04, -0.14], [0.1, 0, 0]); abaVento(p, "hips", 0.2, L * 0.9, cor, [-0.09, -0.04, -0.14], [0.1, 0, 0]); return c; }
function grishaLP(o = {}) { const p = pessoaLP({ seed: 101, pele: 0xf4d0aa, olho: "#4a3a24", olhoAlt: 0.76, olhoTam: 0.9, brava: 0.0, rugas: 0.28, browW: 0.06, roupa: 0x6a5238, calca: 0x3a3028, sapato: 0x2a1e14, sola: 0x2a1e14, botoes: false, sobrancelha: 0x3a2618, cabelo: CABELOS_AOT.grisha, ...o });
  oculosRedondos(p); rabo(p, 0x3a2618); casacoLongo(p, 0x6a5238); return p; }
function krugerLP(o = {}) { const p = pessoaLP({ seed: 102, pele: 0xf0cca4, olho: "#3a3a40", olhoAlt: 0.6, brava: 0.6, rugas: 0.5, queixo: 0.8, roupa: 0x16161a, calca: 0x16161a, botoes: true, botao: 0xb89a50, sobrancelha: 0x16161a, cabelo: CABELOS_AOT.kruger, ...o }); casacoLongo(p, 0x16161a, 0.7); return p; }
function friedaLP(o = {}) { const p = pessoaLP({ seed: 103, pele: 0xf8e0c8, olho: "#4a5a8a", olhoAlt: 0.95, olhoTam: 1.04, browW: 0.056, queixo: 0.68, roupa: 0xe8e2d4, calca: 0xe8e2d4, sapato: 0x3a2a24, botoes: false, sobrancelha: 0x141418, cabelo: CABELOS_AOT.frieda, scale: 0.94, ...o });
  const u = p.userData; const s = mesh(new THREE.CylinderGeometry(0.16, 0.3, 0.75, 14, 1, true), LPmat(0xe8e2d4, { rim: 0.8, side: THREE.DoubleSide }), 0, -0.38, 0, u.hips); s.scale.z = 0.85; abaVento(p, "hips", 0.3, 0.6, 0xe8e2d4, [0, -0.08, -0.16], [0.08, 0, 0], { tras: 0.08 }); return p; }
function rodLP(o = {}) { const p = pessoaLP({ seed: 104, pele: 0xf0cca8, olho: "#5a4a30", olhoAlt: 0.7, brava: -0.1, rugas: 0.8, barba3d: 0x8a7050, roupa: 0x3a2a3a, calca: 0x2a2028, botoes: true, botao: 0xd8b860, sobrancelha: 0x8a7050, cabelo: CABELOS_AOT.rod, ...o }); casacoLongo(p, 0x3a2a3a, 0.6); return p; }
function criancaLP(i, o = {}) { const cab = [0x8a6a40, 0x3a2a20, 0xc8a060, 0x5a3a28][i % 4]; return pessoaLP({ seed: 110 + i, pele: 0xf8dcc0, olho: "#4a5a6a", olhoAlt: 1.0, olhoTam: 1.1, blush: true, roupa: [0x5a6a8a, 0x8a5a4a, 0x6a7a5a, 0x7a6a8a][i % 4], calca: 0x3a3a44, botoes: false, sobrancelha: cab, cabelo: { ...CABELOS_AOT.kruger, cor: cab, seed: 120 + i }, scale: 0.62 + (i % 2) * 0.06, ...o }); }
function erenAdultoLP(o = {}) { const p = pessoaLP({ seed: 105, pele: 0xf2d2ae, olho: "#2a9a88", olhoAlt: 0.66, brava: 0.5, queixo: 0.78, roupa: 0x1e1e24, calca: 0x1e1e24, botoes: false, sobrancelha: 0x2e1e14, cabelo: CABELOS_AOT.erenAdulto, ...o }); coque(p, 0x2e1e14); casacoLongo(p, 0x1e1e24, 0.72); return p; }
function erenKidLP(o = {}) { return erenCriancaLP({ scale: 0.72, ...o }); }

// ---------------------------------------------------------------- cenários de Attack on Titan
// textura de pedra das muralhas (blocos grandes cinza-bege com manchas)
const muroTex = canvasTex(512, 512, (c, w, h) => { c.fillStyle = "#cfc8b8"; c.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) { const y = r * 128, off = (r % 2) * 128; for (let k = -1; k < 3; k++) { const x = k * 256 + off, v = 190 + hash(r * 7 + k) * 30; c.fillStyle = `rgb(${v},${v - 6},${v - 18})`; c.fillRect(x + 3, y + 3, 250, 122); } c.fillStyle = "rgba(90,84,74,.55)"; c.fillRect(0, y, w, 3); for (let k = -1; k < 3; k++) c.fillRect(k * 256 + off, y, 3, 128); }
  for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(80,70,60,${0.04 + hash(i) * 0.08})`; c.fillRect(hash(i * 3) * w, hash(i * 5) * h, 4 + hash(i * 7) * 30, 20 + hash(i * 9) * 120); } }, { wrap: true });
function matMuro(sx, sy) { const map = muroTex.clone(); map.needsUpdate = true; rep(map, sx, sy); return SM(0xffffff, { map, roughness: 0.95 }); }
// muralha em arco (raio R, altura H): segmentos retos, ameias no topo, talude na base; gate opcional no ângulo 0
function muralha(g, R = 60, H = 50, o = {}) { const m = grp(g, ...(o.c ?? [0, 0, 0])), a0 = o.a0 ?? -0.6, a1 = o.a1 ?? 0.6, n = o.n ?? 10, esp = o.esp ?? 8;
  for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * (i + 0.5) / n, len = 2 * R * Math.sin((a1 - a0) / n / 2) + 0.4, s = grp(m, Math.sin(a) * R, 0, -Math.cos(a) * R); s.rotation.y = -a;
    mesh(box(len, H, esp), matMuro(len / 12, H / 6), 0, H / 2, 0, s); const ta = mesh(box(len, H * 0.2, esp * 0.6), matMuro(len / 12, 0.6), 0, H * 0.08, esp * 0.65, s); ta.rotation.x = -0.4;
    mesh(box(len, 1.0, esp * 1.1), SM(0x8a8478), 0, H + 0.4, 0, s); for (let k = 0; k < Math.floor(len / 3); k++) mesh(box(1.6, 1.8, 0.8), SM(0x9a948a), -len / 2 + 1.5 + k * 3, H + 1.6, esp * 0.5, s);
    if (o.portao && Math.abs(a) < (a1 - a0) / n / 2 + 1e-3) { const pt = mesh(new THREE.CylinderGeometry(7, 7, esp + 0.4, 16, 1, false, 0, Math.PI), SM(0x1a1612), 0, 9, 0, s); pt.rotation.x = Math.PI / 2; pt.rotation.z = Math.PI / 2 * 0; mesh(box(14, 9, esp + 0.4), SM(0x1a1612), 0, 4.5, 0, s); } }
  return m; }
// Titã Colossal: cabeça sem pele (fibras de músculo vermelhas), sem lábios, fileiras de dentes, olhos fundos, vapor
const musculoTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#a83a30"; c.fillRect(0, 0, w, h); for (let i = 0; i < 140; i++) { const x = hash(i) * w, lw = 1 + hash(i * 3) * 4, v = hash(i * 7); c.strokeStyle = v > 0.55 ? `rgba(240,140,120,${0.25 + v * 0.3})` : `rgba(90,20,18,${0.3 + v * 0.3})`; c.lineWidth = lw; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 8, h * 0.3, x - 8, h * 0.7, x + 4, h); c.stroke(); } });
function colossal(g, s = 1) { const c = grp(g), mus = new THREE.MeshStandardMaterial({ map: musculoTex, roughness: 0.55, color: 0xffffff, emissive: 0x3a0806, emissiveIntensity: 0.4 }), osso = LPmat(0xf0e4c8, { rim: 0.5, liso: true }), escuro = LPmat(0x1a0604);
  const cab = mesh(new THREE.SphereGeometry(9 * s, 28, 20), mus, 0, 0, 0, c); cab.scale.set(0.85, 1.12, 0.92); deform(cab.geometry, (v) => { v.x *= 1 + 0.08 * Math.sin(v.y * 0.6); if (v.z > 3 && v.y < -1) v.z += 0.6; if (v.z > 4 && Math.abs(v.x) < 2.2 && v.y > -1 && v.y < 2) v.z -= 0.9; });
  [-1, 1].forEach((k) => { const ma = mesh(new THREE.SphereGeometry(2.4 * s, 12, 10), mus, k * 4.6 * s, -3.4 * s, 6.0 * s, c); ma.scale.set(0.7, 1.4, 0.55); });
  const boca = mesh(box(8.4 * s, 4.6 * s, 2 * s), escuro, 0, -6.2 * s, 6.6 * s, c);
  for (let i = 0; i < 14; i++) { const x = (i - 6.5) * 0.62 * s, z = 7.7 * s - Math.abs(i - 6.5) * 0.22 * s; mesh(box(0.55 * s, 1.5 * s, 0.5 * s), osso, x, -4.5 * s, z, c); mesh(box(0.55 * s, 1.3 * s, 0.5 * s), osso, x, -7.6 * s, z - 0.2 * s, c); }
  [-1, 1].forEach((k) => { mesh(new THREE.SphereGeometry(1.7 * s, 12, 10), escuro, k * 3.0 * s, 2.4 * s, 6.9 * s, c); const ol = mesh(new THREE.SphereGeometry(0.85 * s, 12, 10), LPmat(0xf4ece0, { liso: true }), k * 3.0 * s, 2.3 * s, 7.6 * s, c); mesh(new THREE.SphereGeometry(0.32 * s, 8, 6), LPmat(0x1a1210, { liso: true }), k * 3.0 * s, 2.3 * s, 8.4 * s, c); });
  mesh(new THREE.ConeGeometry(0.9 * s, 1.4 * s, 4), escuro, 0, -0.2 * s, 8.2 * s, c).rotation.x = Math.PI;
  return c; }
// casa de enxaimel (paredes claras com vigas escuras) e telhado vermelho: Shiganshina
// materiais das casas compartilhados (centenas de casas na vista de cima não podem criar material cada uma)
const CASA_MAT = {}; function casaMats() { if (CASA_MAT.pm) return CASA_MAT; const pl = texPlaster(), rf = texRoof();
  CASA_MAT.pm = SM(0xffffff, { map: rep(pl.clone(), 1.5, 1.7) }); CASA_MAT.pm.map.needsUpdate = true;
  CASA_MAT.tel = SM(0xffffff, { map: rep(rf.map.clone(), 2, 2), normalMap: rf.normalMap }); CASA_MAT.tel.map.needsUpdate = true;
  CASA_MAT.jan = new THREE.MeshStandardMaterial({ color: 0x2a3040 }); CASA_MAT.janLuz = new THREE.MeshStandardMaterial({ color: 0x2a3040, emissive: 0xffc070, emissiveIntensity: 1.2 });
  CASA_MAT.porta = LPmat(0x4a3020); CASA_MAT.cham = SM(0x7a6a5a); return CASA_MAT; }
function casaEnx(g, x, z, o = {}) { const M = casaMats(); const h = grp(g, x, 0, z); h.rotation.y = o.ry ?? 0; const W = o.w ?? 4, D = o.d ?? 4, A = o.h ?? 5;
  mesh(box(W, A, D), M.pm, 0, A / 2, 0, h);
  [-1, 1].forEach((k) => { const r = mesh(box(W + 0.6, 0.2, D * 0.62), M.tel, 0, A + D * 0.22, k * D * 0.25, h); r.rotation.x = k * 0.75; });
  for (let j = 0; j < (o.janelas ?? 2); j++) [-1, 1].forEach((k) => mesh(box(0.6, 0.8, 0.06), o.luz ? M.janLuz : M.jan, k * W * 0.25, 1.6 + j * 1.6, D / 2 + 0.03, h));
  mesh(box(0.9, 1.6, 0.06), M.porta, 0, 0.8, D / 2 + 0.03, h); if (o.chamine !== false) mesh(box(0.5, 1.4, 0.5), M.cham, W * 0.3, A + D * 0.4, -D * 0.1, h); return h; }
function ruaPedra(g, w = 6, L = 60, z0 = 0) { const t = texBlocks([150, 140, 128], [118, 110, 100]), m = SM(0xffffff, { map: rep(t.map.clone(), w / 1.2, L / 1.2), normalMap: t.normalMap, roughness: 0.85 }); m.map.needsUpdate = true; const r = mesh(new THREE.PlaneGeometry(w, L), m, 0, 0.01, z0 - L / 2, g); r.rotation.x = -Math.PI / 2; return r; }
// multidão de gente pequena fugindo (silhuetas low-poly simples)
function multidao(g, n, area, o = {}) { const ps = []; const corpo = new THREE.CapsuleGeometry(0.16, 0.7, 3, 6), cab = new THREE.SphereGeometry(0.13, 6, 5);
  for (let i = 0; i < n; i++) { const p = grp(g), c = [0x5a4a3a, 0x6a5a4a, 0x4a4a5a, 0x7a6a4a, 0x3a3a3a][i % 5]; mesh(corpo, LPmat(c), 0, 0.55, 0, p); mesh(cab, LPmat(0xe8c8a8), 0, 1.15, 0, p); p.userData.b = [area[0] + hash(i * 3.3) * (area[1] - area[0]), area[2] + hash(i * 5.1) * (area[3] - area[2]), 0.7 + hash(i) * 0.5]; ps.push(p); }
  return (t, sp = 3) => ps.forEach((p, i) => { const [x, z, v] = p.userData.b; const zz = z + ((t * sp * v) % 40); p.position.set(x + Math.sin(t * 2 + i) * 0.2, Math.abs(Math.sin(t * 9 * v + i)) * 0.1, zz); p.rotation.set(0.15, 0, Math.sin(t * 9 * v + i) * 0.08); }); }
// capela dos Reiss: pedra, telhado escuro, torre com sino, vitral aceso
function capela(g) { const c = grp(g), pm = matMuro(2, 2), tel = LPmat(0x2a2a34, { rim: 0.4 });
  mesh(box(7, 6, 12), pm, 0, 3, 0, c); [-1, 1].forEach((k) => { const r = mesh(box(4.9, 0.3, 12.8), tel, -k * 1.9, 7.35, 0, c); r.rotation.z = k * 0.62; }); [-1, 1].forEach((k) => { const f = mesh(new THREE.CylinderGeometry(0.001, 3.6, 2.6, 3, 1), pm, 0, 7.1, k * 6.0, c); f.rotation.set(Math.PI / 2 * 0, Math.PI / 2, 0); f.scale.set(1, 1, 0.08); });
  const torre = grp(c, 0, 0, 6.5); mesh(box(3, 12, 3), pm, 0, 6, 0, torre); const ag = mesh(new THREE.ConeGeometry(2.4, 5, 4), tel, 0, 14.5, 0, torre); ag.rotation.y = Math.PI / 4; mesh(box(0.15, 1.4, 0.15), SM(0xd8c070), 0, 17.6, 0, torre); mesh(box(0.8, 0.15, 0.15), SM(0xd8c070), 0, 17.8, 0, torre);
  const vit = mesh(new THREE.CircleGeometry(1.1, 12), new THREE.MeshBasicMaterial({ color: 0xffc070 }), 0, 9, 8.02, c); mesh(box(1.4, 2.6, 0.1), new THREE.MeshBasicMaterial({ color: 0xffb060 }), 0, 1.3, 8.02, c);
  [-1, 1].forEach((k) => [-3, 0, 3].forEach((z) => mesh(box(0.1, 1.8, 0.9), new THREE.MeshBasicMaterial({ color: 0xffb060 }), k * 3.52, 3.5, z, c))); return c; }
// caverna de cristal embaixo da capela: cúpula escura, aglomerados de cristal azul brilhante, chão espelhado
function cavernaCristal(g, o = {}) { const c = grp(g), cr = new THREE.MeshStandardMaterial({ color: 0x9ad8ff, emissive: 0x2a8aff, emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.15, transparent: true, opacity: 0.88, flatShading: true });
  const cup = mesh(new THREE.SphereGeometry(18, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), LPmat(0x0c1424, { rim: 0.2, side: THREE.BackSide }), 0, 0, 0, c); deform(cup.geometry, (v) => v.multiplyScalar(0.92 + hash(v.x * 3 + v.z) * 0.12));
  const chao = mesh(new THREE.CircleGeometry(18, 24), new THREE.MeshStandardMaterial({ color: 0x1a2a40, metalness: 0.7, roughness: 0.18, emissive: 0x0a1a30, emissiveIntensity: 0.4 }), 0, 0.005, 0, c); chao.rotation.x = -Math.PI / 2;
  const crs = []; const N = o.n ?? 70; for (let i = 0; i < N; i++) { const a = hash(i * 1.3) * 6.28, r = 6 + hash(i * 2.9) * 10, h = 0.8 + hash(i * 4.1) * 3.5, x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.hypot(x, z) < 7 && z > -9) continue;
    const k = mesh(new THREE.OctahedronGeometry(1, 0), cr, x, h * 0.45, z, c); k.scale.set(0.35 + hash(i) * 0.5, h, 0.35 + hash(i * 7) * 0.5); k.rotation.set((hash(i * 3) - 0.5) * 0.5, hash(i * 5) * 3, (hash(i * 9) - 0.5) * 0.5); k.castShadow = false; crs.push(k); }
  for (let i = 0; i < 18; i++) { const a = i * 0.35, k = mesh(new THREE.OctahedronGeometry(1, 0), cr, Math.cos(a) * 12, 13 - hash(i) * 3, Math.sin(a) * 12 - 2, c); k.scale.set(0.3, 2.5 + hash(i) * 2, 0.3); k.rotation.x = Math.PI; }
  const luz = new THREE.PointLight(0x5ab0ff, 6, 30, 1.2); luz.position.set(0, 6, -4); c.add(luz); const luz2 = new THREE.PointLight(0x7ad0ff, 3, 18, 1.4); luz2.position.set(-5, 2, 3); c.add(luz2);
  const poeira = dustPts(220, [-10, 10, 0.2, 8, -10, 8], 0x9ae0ff, 0.05, 0.75); c.add(poeira);
  for (let i = 0; i < 26; i++) { const an = hash(i * 9.1) * 6.28, r = 4.5 + hash(i * 2.2) * 5, xx = Math.cos(an) * r, zz = Math.sin(an) * r - 3; if (Math.abs(xx) < 4 && zz > -7) continue; const k = mesh(new THREE.OctahedronGeometry(1, 0), cr, xx, 0.3, zz, c); k.scale.set(0.12 + hash(i) * 0.12, 0.4 + hash(i * 3) * 0.6, 0.12 + hash(i * 5) * 0.12); k.rotation.set((hash(i * 4) - 0.5) * 0.8, hash(i) * 3, (hash(i * 6) - 0.5) * 0.8); k.castShadow = false; crs.push(k); }
  const raiosC = godRays(c, [0, 16, -5], [0.05, -1, 0.15], { color: 0x9ad8ff, n: 5, len: 16, w: 1.4, opacity: 0.06, spread: 5 });
  const brilhos = estrelinhas(c, 50, [-9, 9, 0.3, 7, -12, 5], { cor: 0xbfe8ff, s: 0.18 });
  return { c, crs, cr, luz, poeira, brilhos }; }
// Caminhos: areia clara infinita, céu de estrelas, a árvore de luz ao longe (linhas de luz subindo e ramificando)
function caminhos(g) { const ceu = skyDome(g, { top: 0x04060e, mid: 0x0a1630, hor: 0x2a3a6a, ground: 0x0a0c14, sunDir: [0, 0.2, -1], sunCol: 0xa8d0ff, sunI: 0.4, disk: 0.5, cov: 0, cloudA: 0, stars: 1.6, midY: 0.15 });
  const ch = mesh(new THREE.PlaneGeometry(200, 200, 60, 60), new THREE.MeshStandardMaterial({ color: 0xc8b898, roughness: 0.95, flatShading: true }), 0, 0, 0, g); ch.rotation.x = -Math.PI / 2; deform(ch.geometry, (v) => { v.z = Math.sin(v.x * 0.12) * 0.4 + Math.cos(v.y * 0.1) * 0.5 - 0.5; });
  const arv = grp(g, 0, 0, -60); const ramos = []; const ramo = (x, y, z, a, L, d) => { if (d > 5) return; const x2 = x + Math.sin(a) * L * 0.6, y2 = y + L, z2 = z + Math.cos(a * 1.7) * L * 0.2; ramos.push(linhaLuz(arv, [[x, y, z], [(x + x2) / 2 + Math.sin(d + a) * 0.6, (y + y2) / 2, z], [x2, y2, z2]], { curva: true, r: 0.9 / (d + 1), cor: 0xbfe8ff, seg: 16 })); ramo(x2, y2, z2, a - 0.5, L * 0.72, d + 1); ramo(x2, y2, z2, a + 0.5, L * 0.72, d + 1); };
  ramo(0, 0, 0, 0, 26, 0); const brilho = glowSprite(0x9ad8ff, 60, 0.06); brilho.position.set(0, 40, -60); g.add(brilho);
  // os caminhos de luz no céu: fios que descem de todas as direções e convergem na árvore
  for (let i = 0; i < 14; i++) { const an = (i / 14) * Math.PI * 2, R = 70 + hash(i) * 40; ramos.push(linhaLuz(g, [[Math.cos(an) * R, 30 + hash(i * 3) * 25, -60 + Math.sin(an) * R * 0.6], [Math.cos(an) * R * 0.45, 45 + hash(i * 5) * 10, -60 + Math.sin(an) * R * 0.25], [0, 40, -60]], { curva: true, r: 0.18, cor: 0xbfe8ff, seg: 30 })); }
  const pts = dustPts(300, [-30, 30, 0.2, 20, -60, 10], 0xbfe8ff, 0.08, 0.8); g.add(pts); return { ceu, ramos, pts }; }
// árvore grande e redonda do morro (como a da referência): copa feita de muitos aglomerados de esferas, tronco grosso com raízes
function arvoreMorro(g, x, z, s = 1) { const a = grp(g, x, 0, z), bk = texBark(), cas = SM(0xffffff, { map: rep(bk.map.clone(), 1, 2), normalMap: bk.normalMap, color: 0xa88866, side: THREE.DoubleSide }); cas.map.needsUpdate = true;
  mesh(lathe([[0.7 * s, 0], [0.5 * s, 0.6 * s], [0.42 * s, 2.5 * s], [0.38 * s, 4.2 * s], [0.001, 4.4 * s]], 10), cas, 0, 0, 0, a);
  for (let i = 0; i < 5; i++) { const r = mesh(cyl(0.12 * s, 0.22 * s, 1.6 * s, 6), cas, Math.cos(i * 1.3) * 0.7 * s, 0.15 * s, Math.sin(i * 1.3) * 0.7 * s, a); r.rotation.set(Math.sin(i * 1.3) * 1.2, 0, -Math.cos(i * 1.3) * 1.2); }
  for (let i = 0; i < 4; i++) { const r = mesh(cyl(0.08 * s, 0.2 * s, 2.4 * s, 6), cas, Math.cos(i * 1.6) * 0.6 * s, 4.2 * s, Math.sin(i * 1.6) * 0.6 * s, a); r.rotation.set(Math.sin(i * 1.6) * 0.8, 0, -Math.cos(i * 1.6) * 0.8); }
  const fol = [0x3e8a2a, 0x4e9a32, 0x5aa83a, 0x6ab84a, 0x34782a].map((c) => LPmat(c, { rim: 0.6, rough: 0.8 })), cl = [];
  for (let i = 0; i < 120; i++) { const th = hash(i * 1.7) * 6.28, ph = hash(i * 2.3) * 1.35, r = (2.0 + hash(i * 3.1) * 1.2) * s; const m = mesh(new THREE.IcosahedronGeometry((0.42 + hash(i * 4.4) * 0.42) * s, 1), fol[i % 5], Math.cos(th) * Math.sin(ph + 0.3) * r, 5.6 * s + Math.cos(ph + 0.3) * r * 0.62, Math.sin(th) * Math.sin(ph + 0.3) * r, a); m.userData.b = m.position.clone(); cl.push(m); }
  return { a, cl, vento(t, f = 1) { cl.forEach((m, i) => { m.position.x = m.userData.b.x + Math.sin(t * 1.6 + i * 0.7) * 0.06 * f * s; m.position.y = m.userData.b.y + Math.sin(t * 2.1 + i) * 0.03 * f * s; }); } }; }
function morroGrama(g, o = {}) { const hf = o.hf ?? ((x, z) => Math.max(0, 1.2 - (x * x + z * z) * 0.004) - Math.max(0, (Math.hypot(x, z) - 25)) * 0.05);
  terrain(g, { size: 220, segs: 110, h: hf, grassA: 0x5a9a3a, grassB: 0x8ab84a, dirt: 0x7a8a4a, rock: 0x6a7a5a }); grassField(g, o.n ?? 5000, [-16, 16, -16, 16], hf, { s: 0.75, colA: 0x5a9a2a, colB: 0x9ac84a }); return hf; }

// câmeras de depuração
Object.assign(DBGC, {
  "s0-capa": [{ pos: [0, 1.5, 4], look: [0, 1, 0], fov: 40 }],
});

// ================================================================ kit de cenário v2 (copiado da referência "What Attack on Titan says about FATE")
// Natureza em camadas (grama alta perto da câmera, árvore grande de copa em bolhas, árvores distantes, morros na névoa),
// vento em várias camadas (folhas pontudas, riscos de vento, cabelo, copa), sol em contraluz com raios, estrelinhas,
// sombra de contato nos pés (nada flutua), muralha com canhões e o topo da muralha com parapeitos.

// ---------------------------------------------------------------- texturas
const raiosSolTex = canvasTex(512, 512, (c, w, h) => { const cx = w / 2, cy = h / 2; const g_ = c.createRadialGradient(cx, cy, 0, cx, cy, w / 2); g_.addColorStop(0, "rgba(255,255,255,1)"); g_.addColorStop(0.08, "rgba(255,250,230,.95)"); g_.addColorStop(0.2, "rgba(255,220,160,.35)"); g_.addColorStop(0.5, "rgba(255,180,120,.08)"); g_.addColorStop(1, "rgba(255,160,100,0)"); c.fillStyle = g_; c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = "lighter"; for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2 + hash(i) * 0.2, L = w * (0.22 + hash(i * 3) * 0.28); const gr = c.createLinearGradient(cx, cy, cx + Math.cos(a) * L, cy + Math.sin(a) * L); gr.addColorStop(0, "rgba(255,240,210,.45)"); gr.addColorStop(1, "rgba(255,240,210,0)"); c.strokeStyle = gr; c.lineWidth = 1 + hash(i * 5) * 3; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); c.stroke(); } });
const estrelaTex = canvasTex(128, 128, (c, w, h) => { const cx = w / 2; c.globalCompositeOperation = "lighter"; [[w / 2, 3], [w / 2.6, 2]].forEach(([L, lw], k) => { const g_ = c.createLinearGradient(0, 0, w, 0); g_.addColorStop(0, "rgba(255,255,255,0)"); g_.addColorStop(0.5, "rgba(255,255,255,1)"); g_.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g_; c.save(); c.translate(cx, cx); c.rotate(k * Math.PI / 4); c.fillRect(-L, -lw / 2, 2 * L, lw); c.fillRect(-lw / 2, -L, lw, 2 * L); c.restore(); }); const g2 = c.createRadialGradient(cx, cx, 0, cx, cx, 14); g2.addColorStop(0, "rgba(255,255,255,1)"); g2.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g2; c.fillRect(0, 0, w, h); });
const sombraPeTex = canvasTex(128, 128, (c, w, h) => { const g_ = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g_.addColorStop(0, "rgba(0,0,0,.6)"); g_.addColorStop(0.5, "rgba(0,0,0,.32)"); g_.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g_; c.fillRect(0, 0, w, h); });
const cascaTex = canvasTex(256, 512, (c, w, h) => { c.fillStyle = "#9a6a46"; c.fillRect(0, 0, w, h); for (let i = 0; i < 46; i++) { const x = hash(i) * w, lw = 2 + hash(i * 3) * 7, v = hash(i * 7); c.fillStyle = v > 0.5 ? `rgba(40,22,12,${0.35 + v * 0.3})` : `rgba(170,120,80,${0.2 + v * 0.25})`; c.beginPath(); c.moveTo(x, 0); for (let y = 0; y <= h; y += 32) c.lineTo(x + Math.sin(y * 0.02 + i) * 4, y); c.lineTo(x + lw, h); c.lineTo(x + lw, 0); c.fill(); } });

// ---------------------------------------------------------------- sol em contraluz (disco + halo + raios) e estrelinhas de 4 pontas
function solFlare(g, pos, s = 1, cor = 0xfff0d0) { const S = grp(g, ...pos); const r = new THREE.Sprite(new THREE.SpriteMaterial({ map: raiosSolTex, color: cor, transparent: true, blending: ADD, depthWrite: false, fog: false })); r.scale.setScalar(40 * s); S.add(r);
  const d = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: 0xffffff, transparent: true, blending: ADD, depthWrite: false, fog: false })); d.scale.setScalar(9 * s); S.add(d); r.renderOrder = d.renderOrder = 2; return { S, r, d }; }
function estrelinhas(g, n, box, o = {}) { const ss = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: estrelaTex, color: o.cor ?? 0xfff0d0, transparent: true, blending: ADD, depthWrite: false })); s.position.set(box[0] + hash(i * 3.1) * (box[1] - box[0]), box[2] + hash(i * 5.3) * (box[3] - box[2]), box[4] + hash(i * 7.7) * (box[5] - box[4])); s.userData.k = (o.s ?? 0.25) * (0.5 + hash(i * 9) * 0.9); g.add(s); ss.push(s); }
  return (t, k = 1) => ss.forEach((s, i) => { const tw = Math.max(0, Math.sin(t * (1.2 + hash(i) * 2) + i * 2.3)); s.material.opacity = k * tw ** 3; s.scale.setScalar(s.userData.k * (0.6 + 0.6 * tw)); s.material.rotation = t * 0.3 + i; }); }

// ---------------------------------------------------------------- árvore grande (copa em bolhas lisas + folhinhas nas bordas, tronco com sulcos e raízes)
const _ldGeo = (() => { const g_ = new THREE.BufferGeometry(); g_.setAttribute("position", new THREE.Float32BufferAttribute([0.07, 0, 0, 0.0, 0.022, 0.004, -0.045, 0, 0, 0.0, -0.022, 0.004], 3)); g_.setIndex([0, 1, 2, 0, 2, 3]); g_.computeVertexNormals(); return g_; })();
function arvoreRef(g, x, z, s = 1, o = {}) {
  const a = grp(g, x, o.y ?? 0, z), cas = new THREE.MeshStandardMaterial({ map: rep(cascaTex.clone(), 3, 2), color: 0xffffff, roughness: 0.95 }); cas.map.needsUpdate = true;
  const tr = mesh(lathe([[0.95 * s, 0], [0.62 * s, 0.35 * s], [0.5 * s, 1.2 * s], [0.44 * s, 3.0 * s], [0.4 * s, 3.6 * s], [0.001, 3.7 * s]], 14), cas, 0, 0, 0, a);
  for (let i = 0; i < 6; i++) { const an = i * 1.05 + 0.3, r = mesh(new THREE.ConeGeometry(0.2 * s, 1.9 * s, 6), cas, Math.cos(an) * 0.75 * s, 0.12 * s, Math.sin(an) * 0.75 * s, a); r.rotation.set(Math.sin(an) * 1.35, 0, -Math.cos(an) * 1.35); }
  const ramos = []; for (let i = 0; i < 6; i++) { const an = i * 1.1 + 0.5, L = (2.2 + hash(i) * 0.8) * s, r = mesh(cyl(0.1 * s, 0.24 * s, L, 7), cas, 0, 0, 0, a); r.position.set(Math.cos(an) * L * 0.38, 3.1 * s + L * 0.32, Math.sin(an) * L * 0.38); r.rotation.set(Math.sin(an) * 0.95, 0, -Math.cos(an) * 0.95); ramos.push(r); }
  const verdes = [0x3c8a28, 0x4e9e30, 0x62b23a, 0x78c44a, 0x92d45e], mats = verdes.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, emissive: c, emissiveIntensity: 0.12 }));
  const cy = 5.2 * s, bolhas = [], geoB = new THREE.IcosahedronGeometry(1, 2);
  for (let i = 0; i < (o.n ?? 150); i++) { const th = hash(i * 1.73) * 6.283, u = hash(i * 2.39) * 2 - 1, ph = Math.acos(u), rr = (0.75 + 0.25 * hash(i * 3.7)), x_ = Math.sin(ph) * Math.cos(th) * 2.9 * s * rr, y_ = Math.cos(ph) * 1.8 * s * rr, z_ = Math.sin(ph) * Math.sin(th) * 2.9 * s * rr;
    const alt = (y_ / (1.8 * s) + 1) / 2, mi = Math.min(4, Math.max(0, Math.floor(alt * 4.2 + (hash(i * 5.1) - 0.5) * 1.2))); const b = mesh(geoB, mats[mi], x_, cy + y_, z_, a); const rb = (0.42 + hash(i * 4.4) * 0.4) * s; b.scale.set(rb, rb * 0.85, rb); b.userData.b = b.position.clone(); bolhas.push(b); }
  // folhinhas grudadas nas bordas da copa
  const NF = o.nf ?? 520, fm = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.7 }), fi = new THREE.InstancedMesh(_ldGeo, fm, NF); fi.castShadow = false; a.add(fi); const col = new THREE.Color(), M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pv = new THREE.Vector3(), sv = new THREE.Vector3(), base = [];
  for (let i = 0; i < NF; i++) { const b = bolhas[i % bolhas.length], th = hash(i * 6.1) * 6.283, ph = Math.acos(hash(i * 8.3) * 2 - 1), rb = b.scale.x * 1.02; const p = new THREE.Vector3(b.position.x + Math.sin(ph) * Math.cos(th) * rb, b.position.y + Math.cos(ph) * rb * 0.85, b.position.z + Math.sin(ph) * Math.sin(th) * rb); base.push([p, th, ph, i]); fi.setColorAt(i, col.setHex(verdes[1 + (i % 4)]).multiplyScalar(1.05 + hash(i) * 0.25)); }
  const setF = (t, f) => { base.forEach(([p, th, ph, i]) => { e.set(ph - Math.PI / 2 + Math.sin(t * 6 + i) * 0.4 * f, th + Math.sin(t * 4 + i * 2) * 0.3 * f, 0); q.setFromEuler(e); sv.setScalar(s * (2.2 + hash(i * 2) * 1.6)); pv.copy(p); M4.compose(pv, q, sv); fi.setMatrixAt(i, M4); }); fi.instanceMatrix.needsUpdate = true; };
  setF(0, 0);
  return { a, bolhas, ramos, tr, cy, vento(t, f = 1) { bolhas.forEach((b, i) => { const k = (b.userData.b.y - cy + 2) * 0.03 * f * s; b.position.x = b.userData.b.x + Math.sin(t * 1.4 + i * 0.6) * k + 0.04 * f * s * Math.sin(t * 0.5); b.position.z = b.userData.b.z + Math.cos(t * 1.2 + i) * k * 0.6; }); setF(t, f); } };
}
// árvores distantes: copa redonda de 2 tons (escuro embaixo, claro em cima) em tronco fino, instanciadas
function arvoresLonge(g, n, r0, r1, hf, o = {}) {
  const tg = cyl(0.05, 0.09, 1, 5); tg.translate(0, 0.5, 0); const cg1 = new THREE.IcosahedronGeometry(1, 1), cg2 = new THREE.IcosahedronGeometry(0.72, 1); cg2.translate(0.1, 0.38, 0.05);
  const tm = new THREE.InstancedMesh(tg, new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.9 }), n), c1 = new THREE.InstancedMesh(cg1, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), n), c2 = new THREE.InstancedMesh(cg2, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), n);
  [tm, c1, c2].forEach((m) => { m.castShadow = !!o.sombra; m.receiveShadow = true; g.add(m); });
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color(), A = new THREE.Color(o.c1 ?? 0x3e7a2c), B = new THREE.Color(o.c2 ?? 0x6aa840); let k = 0;
  for (let i = 0; i < n * 3 && k < n; i++) { const an = (o.a0 ?? 0) + hash(i * 1.9) * (o.arco ?? 6.283), r = r0 + hash(i * 3.3) * (r1 - r0), x = Math.sin(an) * r, z = -Math.cos(an) * r; if (o.mask && !o.mask(x, z)) continue; const y = hf(x, z), h = (1.6 + hash(i * 5.7) * 1.6) * (o.s ?? 1), cr = (0.8 + hash(i * 7.1) * 0.7) * (o.s ?? 1);
    q.identity(); p.set(x, y, z); s.set(1, h, 1); M4.compose(p, q, s); tm.setMatrixAt(k, M4); p.set(x, y + h + cr * 0.6, z); s.set(cr, cr * 0.9, cr); M4.compose(p, q, s); c1.setMatrixAt(k, M4); c2.setMatrixAt(k, M4); c1.setColorAt(k, col.copy(A).multiplyScalar(0.85 + hash(i) * 0.3)); c2.setColorAt(k, col.copy(B).multiplyScalar(0.85 + hash(i * 2) * 0.3)); k++; }
  [tm, c1, c2].forEach((m) => (m.count = k)); return { tm, c1, c2 };
}
// grama alta em lâminas soltas (grande perto da câmera), base escura e ponta clara, balançando com o vento e as rajadas
function gramaAlta(g, n, area, hf, o = {}) {
  const bl = new THREE.BufferGeometry(), w = o.w ?? 0.05, h = 1; bl.setAttribute("position", new THREE.Float32BufferAttribute([-w, 0, 0, w, 0, 0, -w * 0.55, h * 0.55, 0.03, w * 0.55, h * 0.55, 0.03, 0, h, 0.1], 3));
  const cb = new THREE.Color(o.base ?? 0x3a6a22), ct = new THREE.Color(o.ponta ?? 0xb8d86a), cm = cb.clone().lerp(ct, 0.55); bl.setAttribute("color", new THREE.Float32BufferAttribute([cb.r, cb.g, cb.b, cb.r, cb.g, cb.b, cm.r, cm.g, cm.b, cm.r, cm.g, cm.b, ct.r, ct.g, ct.b], 3)); bl.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); bl.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => { sh.uniforms.uWind = WIND; sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uWind;").replace("#include <begin_vertex>", `#include <begin_vertex>
      vec3 ip = vec3(0.0);
      #ifdef USE_INSTANCING
        ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      #endif
      float bend = position.y * position.y;
      float gust = 0.55 + 0.45 * sin(uWind * 0.9 - ip.x * 0.35 + ip.z * 0.1);
      transformed.x += (0.16 * gust + sin(uWind * 2.6 + ip.x * 0.8 + ip.z * 0.5) * 0.07) * bend;
      transformed.z += cos(uWind * 2.1 + ip.x * 0.6) * 0.04 * bend;`); };
  m.customProgramCacheKey = () => "gramaAlta";
  const im = new THREE.InstancedMesh(bl, m, n); im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color(); let k = 0;
  for (let i = 0; i < n * 3 && k < n; i++) { const x = area[0] + hash(i * 1.31 + 5) * (area[1] - area[0]), z = area[2] + hash(i * 2.77 + 9) * (area[3] - area[2]); if (o.mask && !o.mask(x, z)) continue; p.set(x, hf(x, z) - 0.02, z); q.setFromEuler(new THREE.Euler((hash(i * 3) - 0.5) * 0.35, hash(i * 5.3) * 6.28, (hash(i * 4) - 0.5) * 0.35)); const hh = (o.h ?? 0.6) * (0.5 + hash(i * 7.7) * 0.9); s.set(1 + hash(i) * 0.8, hh, 1); M4.compose(p, q, s); im.setMatrixAt(k, M4); im.setColorAt(k, col.setScalar(0.85 + hash(i * 9.1) * 0.3)); k++; }
  im.count = k; g.add(im); return im;
}
// morros suaves e montanhas azuladas no horizonte (na névoa)
function montanhasLonge(g, r = 180, n = 14, cor = 0x8aa0b8, h = 30) { const mm = new THREE.MeshStandardMaterial({ color: cor, roughness: 1, flatShading: true }); for (let i = 0; i < n; i++) { const an = (i / n) * 6.283 + hash(i) * 0.3, m = mesh(new THREE.IcosahedronGeometry(1, 1), mm, Math.sin(an) * r, -h * 0.35, -Math.cos(an) * r, g); m.scale.set(50 + hash(i * 3) * 50, h * (0.5 + hash(i * 5) * 0.6), 30 + hash(i * 7) * 20); m.rotation.y = -an; m.castShadow = false; } }

// ---------------------------------------------------------------- vento
// folhas pontudas cruzando a tela (algumas grandes perto da câmera), girando; rajadas
function folhasRef(g, n, box, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.6, emissive: o.brilho ?? 0x20400c, emissiveIntensity: 0.35 }), im = new THREE.InstancedMesh(_ldGeo, m, n); im.frustumCulled = false; im.castShadow = false; g.add(im);
  const cols = o.cores ?? [0x5aa832, 0x7ac043, 0x3e8a26, 0x9ad05a], col = new THREE.Color(); for (let i = 0; i < n; i++) im.setColorAt(i, col.setHex(cols[i % cols.length]));
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(); const [x0, x1, y0, y1, z0, z1] = box, L = x1 - x0, dir = o.dir ?? [1, -0.22, 0.12];
  return (t, forca = 1) => { const gust = 0.75 + 0.35 * Math.sin(t * 0.8) + 0.15 * Math.sin(t * 2.3); for (let i = 0; i < n; i++) { const sp = (o.vel ?? 2.6) * (0.65 + hash(i * 3.1) * 0.7) * forca * gust, d = ((hash(i * 1.7) * L + t * sp) % L + L) % L;
      p.set(x0 + d, y0 + hash(i * 5.3) * (y1 - y0) + dir[1] * d + Math.sin(t * 2.1 + i) * 0.15, z0 + hash(i * 7.9) * (z1 - z0) + dir[2] * d + Math.cos(t * 1.7 + i * 2) * 0.12);
      e.set(t * (2 + hash(i) * 6) + i, t * (1.5 + hash(i * 2) * 4) + i * 0.5, t * 3 + i); q.setFromEuler(e); const k = (o.s ?? 1.4) * (0.6 + hash(i * 9) * 0.9) * (hash(i * 11) > 0.93 ? 2.2 : 1); s.set(k, k, k); M4.compose(p, q, s); im.setMatrixAt(i, M4); } im.instanceMatrix.needsUpdate = true; };
}
// riscos de vento: linhas finas claras que passam rápido (como na referência)
function riscosVento(g, n, box, o = {}) { const ls = [], m0 = new THREE.MeshBasicMaterial({ color: o.cor ?? 0xffffff, transparent: true, opacity: 0, blending: ADD, depthWrite: false, side: THREE.DoubleSide }); const geo = new THREE.PlaneGeometry(1, 0.006);
  for (let i = 0; i < n; i++) { const m = mesh(geo, m0.clone(), 0, 0, 0, g); m.castShadow = false; m.renderOrder = 5; ls.push(m); }
  const [x0, x1, y0, y1, z0, z1] = box, L = x1 - x0, life = o.vida ?? 1.1;
  return (t, k = 1) => ls.forEach((m, i) => { const per = life * (1.4 + hash(i * 3) * 1.6), ph = ((t + hash(i) * per) % per) / per; const vis = ph < life / per ? ph / (life / per) : 2; if (vis > 1) { m.visible = false; return; } m.visible = true;
      const ciclo = Math.floor((t + hash(i) * per) / per); m.position.set(x0 + vis * L * 1.2 - L * 0.1, y0 + hash(i * 5 + ciclo * 7.3) * (y1 - y0) + Math.sin(vis * 6 + i) * 0.05, z0 + hash(i * 7 + ciclo * 3.1) * (z1 - z0)); m.scale.set((o.comp ?? 1.6) * (0.5 + hash(i * 9 + ciclo) * 0.8), 1, 1); m.rotation.z = -0.08 + Math.sin(vis * 3 + i) * 0.05; m.lookAt(m.position.x, m.position.y, m.position.z + 1); m.material.opacity = (o.op ?? 0.55) * k * Math.sin(vis * Math.PI); }); }
// cabelo ao vento: as pontas (longe do couro cabeludo) se deslocam na direção do vento e tremulam
const _cv = new THREE.Vector3();
function cabeloVento(p, t, f = 1, dir = [1, 0, 0]) { const hg = p.userData.head && p.userData.head.userData.hairG; if (!hg) return; let j = 0;
  hg.traverse((m) => { if (!m.isMesh) return; const gm = m.geometry, a = gm.attributes.position; if (!gm.userData.b) gm.userData.b = a.array.slice(); const b = gm.userData.b; j++;
    for (let i = 0; i < a.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2]; const r = Math.hypot(x, y, z), k = clamp((r - 0.13) * 12) + clamp((-y - 0.03) * 6); if (k <= 0) { a.setXYZ(i, x, y, z); continue; }
      const w = 0.016 * f * k; a.setXYZ(i, x + (dir[0] * 0.8 + Math.sin(t * 7.5 + y * 40 + j) * 0.5) * w, y + Math.sin(t * 9 + x * 50 + j) * 0.3 * w, z + (dir[2] * 0.8 + Math.cos(t * 6.3 + x * 35 + j) * 0.4) * w); }
    a.needsUpdate = true; }); }

// ---------------------------------------------------------------- sombra de contato (o personagem sempre "pisa" no chão)
function sombraPe(g, p, s = 1) { const m = mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: sombraPeTex, transparent: true, depthWrite: false, opacity: 0.85 }), 0, 0, 0, g); m.rotation.x = -Math.PI / 2; m.castShadow = false; m.renderOrder = 1;
  return (chaoY = null) => { p.updateMatrixWorld(true); const u = p.userData, a = u.ankle[0].getWorldPosition(_cv).clone(), b = u.ankle[1].getWorldPosition(_cv).clone(), c = a.add(b).multiplyScalar(0.5); const y = chaoY ?? p.position.y; m.position.set(c.x, y + 0.012, c.z); const hgt = Math.max(0, c.y - y - 0.06); m.scale.setScalar(0.75 * s * p.scale.x * (1 + hgt)); m.material.opacity = 0.85 * clamp(1 - hgt * 2.5); m.visible = p.visible; }; }

// ---------------------------------------------------------------- muralha v2: blocos grandes, canhões e trilho no topo
function canhao(g, x, y, z, ry) { const c = grp(g, x, y, z); c.rotation.y = ry; const ferro = LPmat(0x2a2a2e, { metal: 0.7, rough: 0.4 }), mad = LPmat(0x5a3a22); mesh(box(1.2, 0.5, 1.6), mad, 0, 0.25, 0, c); [-1, 1].forEach((k) => { const r = mesh(cyl(0.38, 0.38, 0.12, 10), mad, k * 0.66, 0.38, 0.2, c); r.rotation.z = Math.PI / 2; }); const b = mesh(cyl(0.2, 0.28, 2.4, 10), ferro, 0, 0.75, 0.9, c); b.rotation.x = Math.PI / 2 - 0.12; return c; }
function muralhaV2(g, R, H, o = {}) { const m = muralha(g, R, H, o); const a0 = o.a0 ?? -0.6, a1 = o.a1 ?? 0.6, c = o.c ?? [0, 0, 0], N = o.canhoes ?? 0; for (let i = 0; i < N; i++) { const a = a0 + (a1 - a0) * (i + 0.5) / N; canhao(g, c[0] + Math.sin(a) * (R + 2), c[1] + H + 0.6, c[2] - Math.cos(a) * (R + 2), Math.PI - a); } return m; }
// topo de muralha: passarela de lajes com parapeitos dos dois lados indo até o horizonte (como na cena do Kruger da referência)
const lajeTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#9a8a7a"; c.fillRect(0, 0, w, h); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const v = 150 + hash(i * 2 + j) * 40; c.fillStyle = `rgb(${v + 20},${v + 6},${v - 8})`; c.fillRect(i * 128 + 3, j * 128 + 3, 122, 122); c.fillStyle = "rgba(60,40,30,.12)"; c.fillRect(i * 128 + 3 + hash(i + j * 3) * 80, j * 128 + 20, 30, 70); } });
function topoMuralha(g, L = 400, larg = 6, o = {}) { const t = grp(g, 0, 0, 0), mm = new THREE.MeshStandardMaterial({ map: rep(lajeTex.clone(), larg / 1.6, L / 1.6), roughness: 0.75 }); mm.map.needsUpdate = true; const piso = mesh(new THREE.PlaneGeometry(larg, L), mm, 0, 0, -L / 2 + 10, t); piso.rotation.x = -Math.PI / 2;
  [-1, 1].forEach((k) => { const pp = mesh(box(0.5, 1.0, L), matMuro(1, L / 8), k * (larg / 2 + 0.25), 0.5, -L / 2 + 10, t); mesh(box(0.7, 0.12, L), SM(0xb8a898), k * (larg / 2 + 0.25), 1.05, -L / 2 + 10, t); });
  const face = mesh(box(larg + 1, 60, L), matMuro(2, 8), 0, -30.01, -L / 2 + 10, t); return t; }

// ---------------------------------------------------------------- mundo das ideias (como o Boécio da referência): anéis de mostrador com marcas, estrada de luz, pilar de luz
function anelMostrador(g, R, o = {}) { const a = grp(g, ...(o.pos ?? [0, 0, 0])), m = new THREE.MeshBasicMaterial({ color: o.cor ?? 0xffd890, transparent: true, opacity: 1, blending: ADD, depthWrite: false });
  mesh(new THREE.TorusGeometry(R, R * 0.006, 4, 96, o.arco ?? Math.PI * 2), m, 0, 0, 0, a); mesh(new THREE.TorusGeometry(R * 0.93, R * 0.003, 4, 96, o.arco ?? Math.PI * 2), m, 0, 0, 0, a);
  const nt = o.marcas ?? 60; for (let i = 0; i < nt; i++) { const an = (i / nt) * (o.arco ?? Math.PI * 2); if (an > (o.arco ?? 7)) break; const L = i % 5 ? R * 0.035 : R * 0.07, tk = mesh(box(R * 0.006, L, R * 0.004), m, Math.cos(an) * (R * 0.965 - L / 2), Math.sin(an) * (R * 0.965 - L / 2), 0, a); tk.rotation.z = an + Math.PI / 2; tk.castShadow = false; }
  a.traverse((x) => { if (x.isMesh) { x.castShadow = false; x.renderOrder = 3; } }); a.userData.m = m; return a; }
function estradaLuz(g, n = 5, L = 120, larg = 6, cor = 0xffc860) { return Array.from({ length: n }, (_, i) => { const x = (i / (n - 1) - 0.5) * larg; return linhaLuz(g, [[x * 0.25, 0.012, 3], [x, 0.012, -L]], { r: 0.014, cor, seg: 24 }); }); }
function pilarLuz(g, pos, h = 40, w = 2.2, cor = 0xfff0c0) { const p = grp(g, ...pos); const m = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9, blending: ADD, depthWrite: false, side: THREE.DoubleSide }); const c1 = mesh(new THREE.CylinderGeometry(w, w, h, 24, 1, true), m, 0, h / 2, 0, p); const c2 = mesh(new THREE.CylinderGeometry(w * 2.2, w * 2.2, h, 24, 1, true), m.clone(), 0, h / 2, 0, p); c2.material.opacity = 0.25; const gl = glowSprite(cor, w * 6, 0.35); gl.position.y = 2; p.add(gl); m.opacity = 0.55; [c1, c2].forEach((c) => (c.castShadow = false)); return { p, c1, c2, gl }; }
// mar simples (para o topo da muralha à beira-mar)
function marSimples(g, y = -60, cor = 0x2a4a7a) { const m = mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.7, metalness: 0.05 }), 0, y, 0, g); m.rotation.x = -Math.PI / 2; m.castShadow = false; return m; }
// titã (silhueta musculosa de corpo inteiro, olhos acesos, vapor saindo); cabelo longo opcional (Titã de Ataque)
function titaFig(g, o = {}) { const t = grp(g), s = o.s ?? 1, pele = LPmat(o.cor ?? 0x6a4a3e, { rim: 1.3, rough: 0.8 }), esc = LPmat(o.cor2 ?? 0x4a3028, { rim: 1.0 });
  const tor = mesh(new THREE.IcosahedronGeometry(1, 2), pele, 0, 7.4 * s, 0, t); tor.scale.set(2.3 * s, 2.6 * s, 1.4 * s); const ab = mesh(new THREE.IcosahedronGeometry(1, 1), esc, 0, 5.2 * s, 0.1 * s, t); ab.scale.set(1.6 * s, 1.5 * s, 1.1 * s);
  [-1, 1].forEach((k) => { const om = mesh(new THREE.IcosahedronGeometry(1, 1), pele, k * 2.3 * s, 8.8 * s, 0, t); om.scale.setScalar(0.95 * s); const br = mesh(cap(0.55 * s, 3.4 * s, 3, 8), pele, k * 2.9 * s, 6.6 * s, 0.2 * s, t); br.rotation.z = k * 0.25; const ab2 = mesh(cap(0.5 * s, 3.0 * s, 3, 8), esc, k * 3.4 * s, 3.6 * s, 0.6 * s, t); ab2.rotation.z = k * 0.12;
    const co = mesh(cap(0.8 * s, 3.2 * s, 3, 8), pele, k * 0.95 * s, 2.6 * s, 0, t); });
  const ca = mesh(new THREE.IcosahedronGeometry(1, 1), pele, 0, 10.7 * s, 0.15 * s, t); ca.scale.set(1.15 * s, 1.35 * s, 1.15 * s); mesh(box(1.3 * s, 0.25 * s, 0.3 * s), LPmat(0xf0e4c8), 0, 10.0 * s, 1.15 * s, t);
  [-1, 1].forEach((k) => { const ol = glowSprite(o.olho ?? 0xffe0a0, 1.2 * s, 0.95); ol.position.set(k * 0.42 * s, 10.95 * s, 1.25 * s); t.add(ol); });
  if (o.cabelo) for (let i = 0; i < 14; i++) { const an = -0.5 + (i / 13) * 4.1, c = mesh(new THREE.ConeGeometry(0.32 * s, 3.2 * s, 4), LPmat(0x16141a, { rim: 0.8 }), Math.sin(an) * 1.0 * s, 10.0 * s, -Math.cos(an) * 0.9 * s, t); c.rotation.set(2.75, an, 0); }
  t.traverse((x) => { if (x.isMesh) x.castShadow = true; }); return t; }
// onda de choque (anel que se expande no chão) + clarão em cruz
function choque(g, pos, cor = 0xffe8c0) { const r = mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0, blending: ADD, depthWrite: false, side: THREE.DoubleSide }), pos[0], pos[1] + 0.05, pos[2], g); r.rotation.x = -Math.PI / 2; r.castShadow = false;
  const x = new THREE.Sprite(new THREE.SpriteMaterial({ map: estrelaTex, color: cor, transparent: true, blending: ADD, depthWrite: false, opacity: 0 })); x.position.set(pos[0], pos[1] + 3, pos[2]); g.add(x);
  return (t, t0) => { const k = seg(t, t0, t0 + 1.2); r.scale.setScalar(0.5 + 26 * E.out(k)); r.material.opacity = k > 0 && k < 1 ? 0.9 * (1 - k) : 0; const kx = seg(t, t0 - 0.05, t0 + 0.6); x.material.opacity = kx > 0 && kx < 1 ? Math.sin(kx * Math.PI) : 0; x.scale.setScalar(4 + 30 * kx); }; }

// ================================================================ locais de Attack on Titan (desenho nosso, sem copiar a referência)
// porão dos Yeager, porto de Liberio à noite, floresta na chuva, Shiganshina ao amanhecer, titãs de corpo inteiro.

// ---------------------------------------------------------------- texturas
const pedraPoraoTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#5a5048"; c.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) { const off = (r % 2) * 32; for (let k = -1; k < 5; k++) { const v = 90 + hash(r * 9 + k) * 40; c.fillStyle = `rgb(${v + 10},${v},${v - 10})`; c.fillRect(k * 64 + off + 2, r * 32 + 2, 60, 28); } } for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(20,15,10,${0.05 + hash(i) * 0.1})`; c.fillRect(hash(i * 3) * w, hash(i * 5) * h, 10 + hash(i * 7) * 30, 6 + hash(i * 9) * 20); } });
const madeiraTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#6a4428"; c.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { c.strokeStyle = `rgba(${hash(i) > 0.5 ? "40,24,12" : "140,96,60"},${0.15 + hash(i * 3) * 0.2})`; c.lineWidth = 1 + hash(i * 5) * 2; c.beginPath(); const y = hash(i * 7) * h; c.moveTo(0, y); c.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 3); c.stroke(); } });
const tijoloTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#3a2a24"; c.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) { const off = (r % 2) * 16; for (let k = -1; k < 9; k++) { const v = 0.75 + hash(r * 13 + k) * 0.35; c.fillStyle = `rgb(${(120 * v) | 0},${(60 * v) | 0},${(44 * v) | 0})`; c.fillRect(k * 32 + off + 1, r * 16 + 1, 30, 14); } } });
const fotoTex = canvasTex(128, 96, (c, w, h) => { const g_ = c.createLinearGradient(0, 0, 0, h); g_.addColorStop(0, "#d8c8a0"); g_.addColorStop(1, "#a89070"); c.fillStyle = g_; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(60,40,24,.75)"; [[40, 56, 12], [64, 50, 14], [88, 60, 9]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y - r * 1.4, r * 0.55, 0, 7); c.fill(); c.fillRect(x - r * 0.6, y - r * 0.8, r * 1.2, r * 2.4); }); c.strokeStyle = "#f0e8d8"; c.lineWidth = 6; c.strokeRect(0, 0, w, h); });
const capaLivroTex = (cor) => canvasTex(64, 96, (c, w, h) => { c.fillStyle = cor; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(220,190,120,.8)"; c.lineWidth = 2; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "rgba(220,190,120,.8)"; c.fillRect(14, 40, w - 28, 4); });
const bracadeiraTex = canvasTex(128, 32, (c, w, h) => { c.fillStyle = "#e8c840"; c.fillRect(0, 0, w, h); c.strokeStyle = "#2a2a6a"; c.lineWidth = 2.5; const cx = w / 2, cy = h / 2; c.beginPath(); for (let i = 0; i <= 9; i++) { const a = -Math.PI / 2 + i * (Math.PI * 4 / 9), r = 12; i ? c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.stroke(); });

// ---------------------------------------------------------------- objetos
function vela(g, x, y, z) { const v = grp(g, x, y, z); mesh(cyl(0.025, 0.028, 0.12, 8), LPmat(0xf0e8d8, { rim: 0.4 }), 0, 0.06, 0, v); mesh(cyl(0.05, 0.06, 0.012, 10), LPmat(0x8a6a3a, { metal: 0.6 }), 0, 0.006, 0, v); const ch = glowSprite(0xffb050, 0.12, 0.95); ch.position.y = 0.15; v.add(ch); const ch2 = glowSprite(0xffd890, 0.035, 1); ch2.position.y = 0.145; v.add(ch2); const L = new THREE.PointLight(0xffb060, 2.2, 6, 1.6); L.position.y = 0.2; L.castShadow = true; L.shadow.mapSize.set(1024, 1024); v.add(L); return { v, ch, L, upd(t) { const f = 0.85 + 0.15 * noise1(t * 9) + 0.05 * Math.sin(t * 23); L.intensity = 2.2 * f; ch.scale.setScalar(0.12 * (0.9 + 0.2 * noise1(t * 11))); } }; }
function livro(g, cor, x, y, z, ry = 0, aberto = false) { const l = grp(g, x, y, z); l.rotation.y = ry; const capa = new THREE.MeshStandardMaterial({ map: capaLivroTex(cor), roughness: 0.7 }); if (!aberto) { mesh(box(0.16, 0.04, 0.22), [LPmat(0xe8dcc0), LPmat(0xe8dcc0), capa, LPmat(0x2a1a10), LPmat(0xe8dcc0), LPmat(0xe8dcc0)], 0, 0.02, 0, l); } else { [-1, 1].forEach((k) => { const pg = mesh(box(0.15, 0.012, 0.22), LPmat(0xeee4cc, { rim: 0.2 }), k * 0.077, 0.012, 0, l); pg.rotation.z = -k * 0.06; }); } return l; }
function chave(g) { const c = grp(g); const m = LPmat(0xb89a50, { metal: 0.85, rough: 0.3, liso: true }); mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 16), m, 0, 0.05, 0, c); mesh(cyl(0.005, 0.005, 0.07, 6), m, 0, 0.0, 0, c); mesh(box(0.016, 0.01, 0.005), m, 0.008, -0.025, 0, c); mesh(box(0.012, 0.008, 0.005), m, 0.006, -0.012, 0, c); return c; }
function seringa(g) { const s = grp(g); mesh(cyl(0.012, 0.012, 0.11, 10), new THREE.MeshStandardMaterial({ color: 0xd8f0e8, transparent: true, opacity: 0.55, roughness: 0.1 }), 0, 0, 0, s); const liq = mesh(cyl(0.009, 0.009, 0.07, 10), new THREE.MeshStandardMaterial({ color: 0x9aff9a, emissive: 0x5aff7a, emissiveIntensity: 1.4 }), 0, -0.012, 0, s); mesh(cyl(0.002, 0.002, 0.05, 4), LPmat(0xd0d0d8, { metal: 0.9 }), 0, -0.08, 0, s); mesh(cyl(0.016, 0.016, 0.006, 10), LPmat(0x9a9aa0, { metal: 0.7 }), 0, 0.058, 0, s); const gl = glowSprite(0x9aff9a, 0.12, 0.5); s.add(gl); return { s, liq, gl }; }
function lampiao(g, x, z, h = 3.2) { const l = grp(g, x, 0, z), ferro = LPmat(0x1a1a1e, { metal: 0.6 }); mesh(cyl(0.05, 0.07, h, 6), ferro, 0, h / 2, 0, l); mesh(box(0.26, 0.34, 0.26), new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffc060, emissiveIntensity: 1.6 }), 0, h + 0.17, 0, l); mesh(new THREE.ConeGeometry(0.22, 0.16, 4), ferro, 0, h + 0.42, 0, l).rotation.y = Math.PI / 4; const L = new THREE.PointLight(0xffb860, 3.5, 12, 1.6); L.position.y = h + 0.1; l.add(L); const gl = glowSprite(0xffc070, 1.6, 0.55); gl.position.y = h + 0.17; l.add(gl); return l; }
function bracadeira(p) { const u = p.userData; const b = mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.07, 14, 1, true), new THREE.MeshStandardMaterial({ map: bracadeiraTex, side: THREE.DoubleSide, roughness: 0.8 }), 0, -0.13, 0, u.sh[1]); return b; }
function quepe(p, cor = 0x3a3a2e) { const u = p.userData, m = LPmat(cor, { rim: 0.6 }); const cp = mesh(cyl(0.118, 0.095, 0.045, 14), m, 0, 0.21, -0.01, u.head); cp.rotation.x = -0.12; const aba = mesh(cyl(0.09, 0.09, 0.008, 14, 1, false, -Math.PI / 2, Math.PI), LPmat(0x141414, { rim: 0.3 }), 0, 0.19, 0.03, u.head); aba.scale.z = 1.2; mesh(cyl(0.101, 0.101, 0.016, 14), LPmat(0xb89a50, { metal: 0.6 }), 0, 0.19, -0.01, u.head); }
// titã de corpo inteiro = pessoa low-poly gigante e nua (pele no lugar da roupa), com sorriso de dentes e vapor
function titaLP(o = {}) { const pele = o.pele ?? 0xd8a888; const p = pessoaLP({ seed: o.seed ?? 130, pele, roupa: pele, calca: pele, sapato: pele, sola: pele, botoes: false, olho: o.olho ?? "#4a8a6a", olhoAlt: o.olhoAlt ?? 0.75, brava: o.brava ?? 0.5, sobrancelha: o.sob ?? 0x2a2018, cabelo: o.cabelo, bocaRyuk: true, scale: o.s ?? 9, queixo: 0.82 });
  const u = p.userData; if (o.orelhas) [-1, 1].forEach((k) => { const e = mesh(new THREE.ConeGeometry(0.018, 0.05, 4), LPmat(pele, { rim: 0.6 }), k * 0.078, 0.11, -0.01, u.head); e.rotation.z = -k * 1.2; });
  // marcas de músculo no rosto (linhas das bochechas, como os titãs da obra)
  if (o.marcas !== false) [-1, 1].forEach((k) => { const m = mesh(box(0.004, 0.05, 0.004), LPmat(0x8a4a3a), k * 0.05, 0.035, surfZ(u.headM, k * 0.05, 0.035) - 0.001, u.head); m.rotation.z = k * 0.4; });
  return p; }

// ---------------------------------------------------------------- porão dos Yeager (o segredo do Grisha): pedra, vigas, escada com a porta lá em cima, mesa com vela, os três livros, a foto, a chave, estantes de médico
function porao(g) { const P = grp(g), pm = new THREE.MeshStandardMaterial({ map: rep(pedraPoraoTex.clone(), 3, 1.5), roughness: 0.95 }); pm.map.needsUpdate = true; const mad = new THREE.MeshStandardMaterial({ map: rep(madeiraTex.clone(), 2, 1), roughness: 0.8 }); mad.map.needsUpdate = true;
  const chao = mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshStandardMaterial({ map: rep(madeiraTex.clone(), 4, 4), color: 0x9a8070, roughness: 0.85 }), 0, 0, 0, P); chao.rotation.x = -Math.PI / 2; chao.material.map.needsUpdate = true;
  mesh(box(7, 3, 0.3), pm, 0, 1.5, -2.6, P); [-1, 1].forEach((k) => mesh(box(0.3, 3, 7), pm, k * 3.2, 1.5, 0, P)); mesh(box(7, 0.2, 7), mad, 0, 3.0, 0, P);
  for (let i = 0; i < 5; i++) mesh(box(0.22, 0.26, 7), mad, -2.6 + i * 1.3, 2.8, 0, P);
  // escada subindo para a porta (luz do dia entrando)
  for (let i = 0; i < 9; i++) mesh(box(1.1, 0.12, 0.32), mad, 2.4, 0.1 + i * 0.3, 1.6 - i * 0.32, P); const porta = mesh(box(1.0, 1.9, 0.08), new THREE.MeshBasicMaterial({ color: 0xfff0d0 }), 2.4, 3.6, -1.3, P); porta.castShadow = false;
  const raios = godRays(P, [2.4, 3.6, -1.1], [-0.35, -0.75, 0.55], { color: 0xffe8c0, n: 5, len: 5, w: 0.7, opacity: 0.08, spread: 0.8 });
  // mesa, cadeira, estantes com frascos
  const mesa = grp(P, -0.6, 0, -1.5); mesh(box(1.6, 0.06, 0.8), mad, 0, 0.76, 0, mesa); [[-0.74, -0.34], [0.74, -0.34], [-0.74, 0.34], [0.74, 0.34]].forEach(([x, z]) => mesh(box(0.07, 0.76, 0.07), mad, x, 0.38, z, mesa)); mesh(box(1.5, 0.3, 0.6), mad, 0, 0.58, -0.05, mesa);
  const cad = grp(P, -0.6, 0, -0.85); mesh(box(0.46, 0.05, 0.46), mad, 0, 0.48, 0, cad); mesh(box(0.46, 0.55, 0.05), mad, 0, 0.78, 0.22, cad); [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z]) => mesh(box(0.04, 0.48, 0.04), mad, x, 0.24, z, cad));
  [-2.9, 2.9].forEach((x, k) => { if (k) return; for (let j = 0; j < 4; j++) { mesh(box(0.35, 0.04, 2.4), mad, x, 0.5 + j * 0.55, -0.5, P); for (let i = 0; i < 9; i++) { const vid = new THREE.MeshStandardMaterial({ color: [0x5a8a5a, 0x8a5a3a, 0x3a5a8a, 0xb89a50][(i + j) % 4], transparent: true, opacity: 0.75, roughness: 0.15, metalness: 0.2 }); mesh(cyl(0.05, 0.05, 0.16 + hash(i + j * 9) * 0.12, 8), vid, x + 0.02, 0.6 + j * 0.55 + 0.07, -1.5 + i * 0.25, P); } } });
  const vl = vela(P, -1.05, 0.79, -1.55);
  const livros = [livro(P, "#4a2a1a", -0.25, 0.79, -1.6, 0.2), livro(P, "#2a3a4a", -0.24, 0.83, -1.6, 0.25), livro(P, "#3a2a3a", -0.26, 0.87, -1.62, 0.15), livro(P, "#4a3a2a", -0.65, 0.79, -1.35, 0, true)];
  const foto = mesh(new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshStandardMaterial({ map: fotoTex, roughness: 0.6 }), -1.25, 0.95, -1.82, P); foto.rotation.x = -0.25; mesh(box(0.18, 0.14, 0.01), LPmat(0x3a2414), -1.25, 0.948, -1.826, P).rotation.x = -0.25;
  const ch = chave(P); ch.position.set(-0.95, 0.8, -1.25); ch.rotation.set(Math.PI / 2, 0, 0.6);
  const poeira = dustPts(240, [-2.5, 2.5, 0.2, 2.8, -2.4, 2], 0xffe0b0, 0.03, 0.75); P.add(poeira);
  return { P, vl, livros, ch, poeira, raios, mesa, cad }; }

// ---------------------------------------------------------------- porto de Liberio à noite (Marley): armazéns de tijolo, lampiões, cais, navios, mar ao luar e a ilha de Paradis no horizonte
function portoLiberio(g) { const L = grp(g); skyDome(L, { top: 0x04060f, mid: 0x0a1230, hor: 0x1e2a50, ground: 0x06080e, sunDir: [-0.3, 0.35, -1], sunCol: 0xd8e4ff, sunI: 0.15, disk: 0.4, cov: 0.3, cloudLit: 0x4a5a88, cloudSh: 0x0a0e1c, stars: 1.4, midY: 0.18 });
  const lua = glowSprite(0xe8eeff, 10, 0.3); lua.position.set(-80, 120, -400); L.add(lua); const lua2 = glowSprite(0xffffff, 3.5, 1); lua2.position.copy(lua.position); L.add(lua2);
  const mar = mesh(new THREE.PlaneGeometry(3000, 3000, 80, 80), new THREE.MeshStandardMaterial({ color: 0x0e1a34, roughness: 0.25, metalness: 0.6, flatShading: true }), 0, -1.2, -1500, L); mar.rotation.x = -Math.PI / 2; deform(mar.geometry, (v) => { v.z = Math.sin(v.x * 0.3) * 0.15 + Math.cos(v.y * 0.25) * 0.12; });
  const rastro = mesh(new THREE.PlaneGeometry(6, 400), new THREE.MeshBasicMaterial({ color: 0xbfd0ff, transparent: true, opacity: 0.18, blending: ADD, depthWrite: false }), -12, -1.1, -220, L); rastro.rotation.x = -Math.PI / 2; rastro.rotation.z = 0.2;
  const ilha = mesh(new THREE.ConeGeometry(130, 30, 9), new THREE.MeshStandardMaterial({ color: 0x1a2240, roughness: 1, flatShading: true }), 25, -2, -440, L); ilha.scale.z = 0.25;
  const cais = mesh(box(14, 0.4, 40), new THREE.MeshStandardMaterial({ map: rep(madeiraTex.clone(), 6, 18), roughness: 0.8 }), 0, -0.2, -6, L); cais.material.map.needsUpdate = true;
  for (let i = 0; i < 8; i++) [-1, 1].forEach((k) => mesh(cyl(0.18, 0.2, 2.4, 6), LPmat(0x2a1e14), k * 6.8, -1.3, -24 + i * 5, L));
  const tij = new THREE.MeshStandardMaterial({ map: rep(tijoloTex.clone(), 4, 2), roughness: 0.9 }); tij.map.needsUpdate = true;
  for (let i = 0; i < 5; i++) { const a = grp(L, -11, 0, 10 - i * 9); mesh(box(8, 7 + hash(i) * 3, 8), tij, 0, 4, 0, a); mesh(box(8.4, 0.4, 8.4), LPmat(0x2a2020), 0, 8.2 + hash(i) * 3, 0, a); for (let j = 0; j < 3; j++) mesh(box(0.06, 1.0, 0.7), new THREE.MeshStandardMaterial({ color: 0x1a1410, emissive: hash(i * 3 + j) > 0.5 ? 0xffb860 : 0x000000, emissiveIntensity: 1.2 }), 4.03, 2.5 + j * 2, -2.5 + j * 2.2, a); }
  const lamps = [[-5.5, 2], [-5.5, -8], [5.5, -4], [5.5, -14]].map(([x, z]) => lampiao(L, x, z));
  const navio = grp(L, 14, -1.2, -20); mesh(box(4, 2.2, 22), LPmat(0x1a1612), 0, 1.1, 0, navio); mesh(box(3.4, 2.6, 6), LPmat(0x2a2420), 0, 3.4, 3, navio); mesh(cyl(0.5, 0.6, 5, 8), LPmat(0x3a2a24), 0, 6.5, 2, navio); [-3, 0, 3].forEach((z) => mesh(box(0.1, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xffd890 }), -2.02, 1.5, z, navio));
  const fumaca = steam(L, { origin: [14, 8.5, -18], n: 18, size: 2.5, spread: 1, rise: 1.5, opacity: 0.25, color: 0x3a3a48, wind: [-0.4, 0, 0] });
  return { L, lamps, fumaca, ilha }; }

// ---------------------------------------------------------------- floresta à noite, chuva
function florestaChuva(g) { const F = grp(g); skyDome(F, { top: 0x04060c, mid: 0x0a1018, hor: 0x1a2230, ground: 0x06080a, sunDir: [0, 0.3, -1], sunI: 0, cov: 0.8, cloudLit: 0x2a3040, cloudSh: 0x0a0c10 });
  const hf = (x, z) => Math.sin(x * 0.2) * 0.25 + Math.cos(z * 0.18) * 0.2;
  terrain(F, { size: 120, segs: 70, h: hf, grassA: 0x1a2a1a, grassB: 0x24321e, dirt: 0x2a2418, rock: 0x2a2a2a });
  grassField(F, 2500, [-10, 10, -10, 8], hf, { s: 0.7, colA: 0x1e3a1e, colB: 0x2e4a24 });
  forestInst(F, 120, 30, hf, { leaf: 0x16281a }); [[-2.2, -2.6], [2.4, -3.2], [-3.4, 0.6], [3.2, 1.5]].forEach(([x, z], i) => tree(F, x, hf(x, z), z, { s: 0.55, seed: 20 + i }));
  const chuva_ = chuva(F, { n: 1600, area: [-6, 6, 0, 8, -6, 6], cor: 0xa8c0e0, op: 0.4, vel: 12, vento: -0.6 });
  const lan = grp(F, 0.5, hf(0.5, 0.6), 0.6); mesh(box(0.16, 0.22, 0.16), new THREE.MeshStandardMaterial({ color: 0xffd090, emissive: 0xffa040, emissiveIntensity: 1.5 }), 0, 0.11, 0, lan); const LL = new THREE.PointLight(0xffb060, 3, 8, 1.6); LL.position.y = 0.3; LL.castShadow = true; lan.add(LL); const lg = glowSprite(0xffb060, 1.2, 0.5); lg.position.y = 0.12; lan.add(lg);
  return { F, hf, chuva_, LL }; }

// ---------------------------------------------------------------- Shiganshina ao amanhecer, vista de cima (telhados, a Muralha Maria, pássaros)
function shiganshinaAlto(g) { const S = grp(g); skyDome(S, { top: 0x3a5a9a, mid: 0xe8a07a, hor: 0xffd8a8, ground: 0x4a4038, sunDir: [0.6, 0.06, -0.8], sunCol: 0xfff0c8, sunI: 1.0, disk: 1.8, cov: 0.4, cloudLit: 0xffc8a0, cloudSh: 0x7a6a8a, midY: 0.2 });
  const ch = mesh(new THREE.PlaneGeometry(800, 800), LPmat(0x6a6a4a), 0, -0.02, 0, S); ch.rotation.x = -Math.PI / 2;
  // quarteirões em grade com ruas (como uma cidade de verdade), praça no meio
  let n_ = 0; for (let gx = -6; gx <= 6; gx++) for (let gz = -6; gz <= 6; gz++) { const cx = gx * 12, cz = gz * 12; if (Math.hypot(cx, cz) > 80 || (Math.abs(gx) < 1 && Math.abs(gz) < 1)) continue; if (gx === 0 || gz === 0) continue;
    for (let k = 0; k < 4; k++) { const ox = (k % 2 ? 2.6 : -2.6), oz = (k < 2 ? 2.6 : -2.6), i = n_++; casaEnx(S, cx + ox, cz + oz, { ry: (k % 2 ? 0 : Math.PI) + (hash(i) > 0.5 ? Math.PI / 2 : 0), w: 4.4, d: 4.4, h: 4 + hash(i * 3) * 4, luz: hash(i * 7) > 0.75, chamine: hash(i * 9) > 0.5, janelas: 1 }); } }
  [0, Math.PI / 2].forEach((r) => { const rua = ruaPedra(S, 7, 170, 85); rua.rotation.z = r; });
  muralhaV2(S, 95, 50, { c: [0, 0, 0], a0: -3.14, a1: 3.14, n: 40, canhoes: 24 });
  const aves = birds(S, 9, { center: [0, 30, -20], rx: 30, rz: 12 });
  return { S, aves }; }

// ================================================================ vídeo: Grisha · cenas 0–4 (capa, morro, Shiganshina, missão, Frieda)
const _sp4 = [];
const DOF_CLOSE = { ap: 0.008, max: 0.014 }, DOF_MED = { ap: 0.005, max: 0.012 };
const CORES_OURO = [0xffd890, 0xffb860, 0xffe8b8, 0xffc070];

function cenaShiganshina(g, o = {}) {
  skyDome(g, { top: 0x2a2048, mid: 0xc06048, hor: 0xffb070, ground: 0x2a2020, sunDir: [0.25, 0.1, -1], sunCol: 0xffd090, sunI: 0.9, disk: 1.6, cov: 0.5, cloudLit: 0xffb080, cloudSh: 0x5a3a4a, midY: 0.2 });
  const ch = mesh(new THREE.PlaneGeometry(600, 600), LPmat(0x4a4038), 0, -0.01, 0, g); ch.rotation.x = -Math.PI / 2;
  ruaPedra(g, 7, 90, 30);
  for (let i = 0; i < 11; i++) [-1, 1].forEach((k) => casaEnx(g, k * (6.2 + hash(i * 3 + k) * 0.8), 24 - i * 6.5, { ry: k > 0 ? -Math.PI / 2 : Math.PI / 2, w: 5.5, d: 4.5, h: 5 + hash(i + k) * 3, luz: hash(i * 7 + k * 3) > 0.45 }));
  for (let i = 0; i < 26; i++) { const k = i % 2 ? 1 : -1; casaEnx(g, k * (14 + hash(i) * 20), 20 - hash(i * 3) * 60, { ry: hash(i * 5) * 6, w: 5, d: 5, h: 5 + hash(i * 7) * 4, luz: hash(i) > 0.6 }); }
  muralhaV2(g, 330, 50, { c: [0, 0, 260], a0: -0.16, a1: 0.16, n: 7, portao: true, canhoes: 10 });
  const co = colossal(g, 1); co.position.set(0, 58, -70); co.rotation.x = 0.28;
  // as mãos do Colossal agarrando o topo da muralha
  const mus = LPmat(0xb8463a, { rim: 0.9 }); [-1, 1].forEach((k) => { const m = grp(g, k * 11, 49.5, -70.5); for (let f = 0; f < 4; f++) { const d = mesh(cap(0.9, 3.6, 3, 6), mus, (f - 1.5) * 2.0, 0.2, 2.2, m); d.rotation.x = 1.25; } mesh(box(8.5, 3, 4), mus, 0, 0.6, -0.6, m); });
  const vap = steam(g, { origin: [10, 50, -66], n: 30, size: 10, spread: 16, rise: 7, grow: 2.2, opacity: 0.28, life: 4, color: 0xf2dcd0, wind: [1.2, 0, 0] });
  const fum = steam(g, { origin: [0, 3, -56], n: 26, size: 9, spread: 10, rise: 5, opacity: 0.35, color: 0x5a4a44, wind: [1.2, 0, 0] });
  const sol = solFlare(g, [60, 70, -320], 1.6, 0xffe0b0);
  const pedras = []; for (let i = 0; i < 18; i++) { const r = mesh(new THREE.DodecahedronGeometry(1.2 + hash(i) * 2.4, 0), matMuro(0.3, 0.3), (hash(i * 3) - 0.5) * 18, 0.9, -40 - hash(i * 5) * 16, g); r.rotation.set(i, i * 2, i * 3); pedras.push(r); }
  const brasa = estrelinhas(g, 40, [-8, 8, 1, 14, -40, 6], { cor: 0xffa060, s: 0.22 });
  return { co, vap, fum, sol, brasa };
}
const LUZ_SHIG = { bg: 0x2a2048, fog: [30, 520], fogCol: 0x9a6a5a, look: { exposure: 1.05, bloom: 0.5, bloomT: 0.8, vig: 0.5, sat: 1.1, con: 1.08, dof: DOF_MED },
  sun: { dir: [0.25, 0.35, -1], col: 0xffb070, I: 2.4, c: [0, 3, -10], r: 30 }, hemi: { sky: 0xd8a0a0, ground: 0x3a2a30, I: 0.85 }, fill: { col: 0xffc8a0, I: 0.6, dir: [0.3, 0.4, 1] }, rim: { col: 0xffb070, str: 1.4 } };
// ---------------------------------------------------------------- 0 · capa: o Grisha na caverna de cristal, luz azul nos óculos
addSet("s0-capa", (g) => {
  const __n = "s0-capa";
  const CV = cavernaCristal(g);
  const gr = grishaLP(); g.add(gr); gr.position.set(0, 0, 0.2); gr.rotation.y = 0.25;
  return { bg: 0x060a14, fog: [10, 40], fogCol: 0x0a1428, hand: 0, look: { exposure: 1.1, bloom: 0.7, bloomT: 0.72, vig: 0.55, sat: 1.1, con: 1.08, dof: DOF_CLOSE, rosto: 0.5 },
    sun: { dir: [0.6, 0.6, 0.6], col: 0x9ad0ff, I: 1.4, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x3a6aaa, ground: 0x0a1020, I: 0.5 }, fill: { col: 0xffd8c0, I: 0.35, dir: [-0.5, 0.2, 1] }, rim: { col: 0x8ad8ff, str: 1.6 },
    update(t) { CV.brilhos(t); vive(gr, t, 101, { boca: "linha", triste: 0.4, palpebra: 0.85, piscaCada: 99 }, 0.1); },
    cam() { { const d = dbgCam(__n); if (d) return d; } return closeRosto(gr, 0.75, 0.12, 0, 30); } };
});

// ---------------------------------------------------------------- 1 · abertura: o porão dos Yeager à luz de vela; o Grisha escreve os diários
addSet("s1-abertura", (g) => {
  const __n = "s1-abertura";
  const [a, b] = T.sc["s1-abertura"];
  const PO = porao(g);
  const gr = grishaLP(); g.add(gr); gr.position.set(-0.6, 0, -0.82); gr.rotation.y = Math.PI;
  const pen = naMao(gr, 0, caneta(0x2a1a10), { dx: 0.006, dy: -0.075, rot: [1.2, 0, 0] });
  return {
    bg: 0x0a0806, fog: [6, 20], fogCol: 0x0a0806, hand: 0.006,
    look: { exposure: 1.12, bloom: 0.55, bloomT: 0.75, vig: 0.55, sat: 1.08, con: 1.08, dof: DOF_MED, rosto: 0.35, lift: [0.01, 0.005, 0] },
    sun: { dir: [0.4, 0.8, 0.5], col: 0xffe8c0, I: 0.35, c: [0, 1, -1], r: 4 }, hemi: { sky: 0x4a3a2a, ground: 0x0a0806, I: 0.35 }, fill: { col: 0xffb870, I: 0.25, dir: [-0.5, 0.2, -1] }, rim: { col: 0xffc080, str: 1.2 },
    update(t) {
      flash(t, a, 0.001, 0.35); GU.uFlash.value *= 0.55; PO.vl.upd(t); floatDust(PO.poeira, t, 0.15, 0.1);
      // o Grisha sentado escrevendo; para no "não sabia por quê" e olha pra vela
      restPose(gr); idle(gr, t, 101, 0.2); sitPose(gr, 1, { seatY: 0.56, lean: 0.28 }); pose(gr, { neck: [0.32, 0, 0], handR: 0.85, handL: 0.35 }, 1);
      const para = smr(t, K.que1 - 1.0, K.que1 - 0.3), esc = Math.sin(t * 7.5) * 0.02 * (1 - para), linha = ((t * 0.3) % 1) * 0.07 * (1 - para);
      maoEm(gr, 0, V3(-0.6 + 0.04 + esc, 0.82, -1.33 - linha), 1, { abre: 0.5, poleY: 0.3, poleZ: 0.1 }); maoEm(gr, 1, V3(-0.85, 0.81, -1.2), 1, { abre: 0.5, poleY: 0.3, poleZ: 0.1 });
      pose(gr, { neck: [0.32 - 0.25 * para, -0.35 * para, 0], head: [0, -0.2 * para, 0] }, 1);
      rostoLP(gr, t, { boca: "linha", triste: 0.35 + 0.3 * para, palpebra: 0.82, piscaCada: 4.5 });
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([2.4, 2.9, 1.0], [1.5, 1.9, 0.4], [-0.6, 0.95, -1.4], [-0.6, 1.0, -1.3], 44, 40)],
        [K.pior - 0.15, mov([-0.12, 1.06, -1.78], [-0.16, 1.02, -1.72], [-0.58, 0.82, -1.34], [-0.58, 0.82, -1.34], 36, 34)],
        [K.que1 - 1.1, (tt, u) => ({ pos: [lerp(0.5, 0.35, u), 1.3, -1.72], look: [-0.7, 1.2, -0.95], fov: 30, near: 0.02 })],
      ], b);
    },
  };
});
const _c1 = new THREE.Color();

// ---------------------------------------------------------------- 2 · Shiganshina: o Colossal, a multidão fugindo; o Grisha corre ao contrário; a capela dos Reiss ao entardecer
addSet("s2-muralha", (g) => {
  const __n = "s2-muralha";
  const [a, b] = T.sc["s2-muralha"];
  const S = cenaShiganshina(g);
  const mul = multidao(g, 40, [-3.2, -1.3, -40, 4]), mul2 = multidao(g, 22, [2.4, 3.3, -40, 4]);
  const gr = grishaLP(); g.add(gr); const sp = sombraPe(g, gr);
  // capela dos Reiss no alto de um morro gramado (x=300), céu do fim de tarde, árvores, caminho
  const C = grp(g, 300, 0, 0);
  const hfC = (x, z) => 6 * Math.exp(-((x - 300) * (x - 300) + z * z) / 900) - 0.5;
  terrain(C, { size: 260, segs: 90, x: 300, h: (x, z) => hfC(x, z), grassA: 0x4a6a32, grassB: 0x6a8a3a, dirt: 0x5a5a3a, rock: 0x5a6a4a });
  const cp = capela(C); cp.position.set(0, hfC(300, -2) - 0.2, -2);
  arvoresLonge(C, 70, 14, 90, (x, z) => hfC(x + 300, z), { c1: 0x2a4a2a, c2: 0x4a6a3a, mask: (x, z) => !(x > 4 && z > 8) });
  const solC = solFlare(C, [-60, 25, -200], 1.4, 0xffc890);
  const D = 9, L = gaitFit(D, 0.8, 1);
  return { ...LUZ_SHIG, hand: 0.01,
    update(t) {
      chicote(t, a, 0.22, 1); S.vap.upd(t); S.fum.upd(t); S.brasa(t); mul(t, 3.2); mul2(t, 3.0);
      const run = clamp((t - a) / (K.capela - 0.3 - a)); gait(gr, D * run, { from: [0.6, 0, 4], ang: Math.PI, step: L, run: 1 }); rostoLP(gr, t, { boca: "aberta", bravo: 0.5, palpebra: 1.0, suor: 0.6 }); ventoAbas(gr, t, 1.6); cabeloVento(gr, t, 1.4, [0, 0, 1]); sp(0);
      S.co.position.y = 58 + Math.sin(t * 0.5) * 0.3;
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.2, 1.3, 9], [1.0, 1.4, 6.5], [0, 30, -60], [0, 38, -60], 52, 50)],
        [K.grisha2 - 0.2, (tt, u) => { const c = gr.position; return { pos: [c.x + 0.9, 1.5, c.z + 2.2], look: [c.x, 1.3, c.z - 2], fov: 40 }; }],
        [K.correu - 0.2, (tt, u) => { const c = gr.position; return { pos: [c.x - 0.6, 1.2, c.z - 3.4], look: [c.x, 1.25, c.z], fov: 40 }; }],
        [K.contraria - 0.1, mov([4, 9, 14], [3.5, 8, 11], [0, 1, -6], [0, 1, -10], 46, 44)],
        [K.capela - 0.3, mov([316, 7, 30], [311, 8, 24], [300, 9, -2], [300, 10, -2], 42, 40)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 3 · a missão: o porto de Liberio à noite; o Kruger (oficial de Marley) entrega a seringa; Paradis no horizonte
addSet("s3-missao", (g) => {
  const __n = "s3-missao";
  const [a, b] = T.sc["s3-missao"];
  const LB = portoLiberio(g);
  const kr = krugerLP(); g.add(kr); quepe(kr); kr.position.set(0.7, 0, -2.0); kr.rotation.y = -1.45;
  const gr = grishaLP(); g.add(gr); bracadeira(gr); gr.position.set(-0.7, 0, -2.05); gr.rotation.y = 1.5;
  const spK = sombraPe(g, kr), spG = sombraPe(g, gr);
  const SR = seringa(null); naMao(kr, 0, SR.s, { dx: 0.02, dy: -0.07, rot: [0, 0, 0] });
  const brilhoIlha = glowSprite(0xffd070, 110, 0); brilhoIlha.position.set(25, 22, -430); g.add(brilhoIlha);
  const coroa_ = grp(g, 25, 42, -420); for (let i = 0; i < 7; i++) mesh(new THREE.ConeGeometry(2.5, 9, 4), new THREE.MeshBasicMaterial({ color: 0xffd860, transparent: true, opacity: 0, blending: ADD }), Math.cos(i / 7 * 6.28) * 11, 0, Math.sin(i / 7 * 6.28) * 11, coroa_);
  const ris = riscosVento(g, 16, [-5, 5, 0.3, 3, -6, 2], { cor: 0xbfd0ff, op: 0.35 });
  return {
    bg: 0x060a1c, fog: [30, 1600], fogCol: 0x0e1630, hand: 0,
    look: { exposure: 1.12, bloom: 0.6, bloomT: 0.74, vig: 0.55, sat: 1.08, con: 1.08, dof: DOF_MED, rosto: 0.45 },
    sun: { dir: [-0.3, 0.6, -0.8], col: 0x9ab0e8, I: 0.9, c: [0, 1, -2], r: 10 }, hemi: { sky: 0x2a3a6a, ground: 0x0a0a12, I: 0.55 }, fill: { col: 0xffb870, I: 0.45, dir: [0.8, 0.3, 0.4] }, rim: { col: 0xffc080, str: 1.4 },
    update(t) {
      chicote(t, a, 0.22, -1); LB.fumaca.upd(t); ris(t, 0.8);
      vive(kr, t, 102, { boca: t > K.kruger - 0.1 && t < K.missao + 0.8 && Math.sin(t * 9) > 0.2 ? "aberta" : "linha", bravo: 0.55, palpebra: 0.8 }, 0.15); ventoAbas(kr, t, 0.8);
      vive(gr, t, 101, { boca: "linha", sobe: t > K.tita ? 0.4 : 0, palpebra: t > K.tita ? 1.0 : 0.85 }, 0.15); ventoAbas(gr, t, 0.8);
      // o Kruger estende a seringa; o Grisha pega no "missão"
      const est = act(t, K.tita - 0.8, K.tita - 0.1) * (1 - smr(t, K.missao + 0.2, K.missao + 0.8)); const meio = kr.position.clone().lerp(gr.position, 0.5).setY(1.15);
      maoEm(kr, 0, mixV(frenteW(kr, 0.18, 0.9, 0.1), meio, est), Math.max(0.001, Math.min(1, est * 3)), { abre: 0.5, poleY: 0.0, poleZ: -0.4 }); pose(kr, { handR: 0.6 }, 1);
      const pega = smr(t, K.missao - 0.4, K.missao + 0.1) * (1 - smr(t, K.fundador, K.fundador + 0.6)); maoEm(gr, 0, mixV(frenteW(gr, 0.18, 0.9, 0.1), meio.clone().add(V3(-0.05, -0.02, 0)), pega), Math.max(0.001, pega), { abre: 0.5, poleY: 0.0, poleZ: -0.4 });
      SR.s.visible = t > K.tita - 0.9; SR.liq.material.emissiveIntensity = 1.2 + 0.4 * Math.sin(t * 4); SR.gl.material.opacity = 0.5 + 0.2 * Math.sin(t * 4);
      // Paradis no horizonte: o brilho dourado da família real
      const cr = smr(t, K.fundador - 0.3, K.real + 0.3); brilhoIlha.material.opacity = 0.35 * cr; coroa_.children.forEach((m) => (m.material.opacity = 0.9 * cr)); coroa_.rotation.y = t * 0.3;
      spK(0); spG(0);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([3.2, 1.5, 6.5], [2.6, 1.6, 5.2], [-0.5, 1.6, -4], [-0.3, 1.5, -3], 42, 40)],
        [K.kruger - 0.2, (tt, u) => ({ ...closeRosto(kr, lerp(1.0, 0.82, E.inOut(u)), -0.35, 0, 30) })],
        [K.tita - 0.45, (tt, u) => { const c = SR.s.getWorldPosition(V3()); return { pos: [c.x - 0.22, c.y + 0.14, c.z + lerp(0.72, 0.58, u)], look: [c.x, c.y, c.z], fov: 36, near: 0.02 }; }],
        [K.missao - 0.1, (tt, u) => ({ ...closeRosto(gr, lerp(1.0, 0.82, E.inOut(u)), 0.35, 0, 30) })],
        [K.fundador - 0.5, mov([-1.4, 1.6, -0.2], [-1.2, 1.7, -0.6], [0, 1.4, -6], [25, 30, -420], 40, 30)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 4 · Frieda: a caverna de cristal; a família Reiss; a muralha de luz que ela podia erguer; o juramento que a prende
addSet("s4-frieda", (g) => {
  const __n = "s4-frieda";
  const [a, b] = T.sc["s4-frieda"];
  const CV = cavernaCristal(g);
  const fr = friedaLP(); g.add(fr); fr.position.set(0, 0, -1.5);
  const rod = rodLP(); g.add(rod); rod.position.set(1.4, 0, -3.2); rod.rotation.y = -0.3;
  const kids = [0, 1, 2, 3].map((i) => { const k = criancaLP(i); g.add(k); k.position.set(-1.6 + i * 0.6 + (i > 1 ? 1.4 : 0), 0, -3.0 - (i % 2) * 0.4); k.rotation.y = 0.2 - i * 0.12; return k; });
  const holo = muralha(g, 8, 2.2, { c: [0, 0, -1.5 + 0], a0: -3.14, a1: 3.14, n: 18, esp: 0.3 }); holo.traverse((m) => { if (m.isMesh) { m.material = new THREE.MeshBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }); m.castShadow = false; } }); holo.position.z = -1.5 + 8 * 0; holo.scale.setScalar(1);
  const aneis = [0, 1, 2].map((i) => { const r = mesh(new THREE.TorusGeometry(0.55 + i * 0.08, 0.012, 6, 40), new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }), 0, 0.6 + i * 0.4, -1.5, g); r.castShadow = false; return r; });
  return {
    bg: 0x060a14, fog: [10, 40], fogCol: 0x0a1428, hand: 0,
    look: { exposure: 1.12, bloom: 0.7, bloomT: 0.72, vig: 0.55, sat: 1.1, con: 1.06, dof: DOF_MED, rosto: 0.55 },
    sun: { dir: [0, 1, 0.3], col: 0x7ab8ff, I: 1.0, c: [0, 1, -2], r: 8 }, hemi: { sky: 0x3a6aaa, ground: 0x0a1020, I: 0.6 }, fill: { col: 0x9ad0ff, I: 0.9, dir: [0, 0.3, 1] }, rim: { col: 0x8ad8ff, str: 1.4 },
    update(t) {
      chicote(t, a, 0.22, 1);
      vive(fr, t, 103, { boca: t > K.proibia ? "triste" : "linha", triste: 0.25 + 0.4 * smr(t, K.juramento, K.proibia), palpebra: 0.85 - 0.15 * smr(t, K.proibia, K.proibia + 0.5) }, 0.2);
      pose(fr, { neck: [0.25 * smr(t, K.proibia - 0.3, K.proibia + 0.4), 0, 0] }, 1);
      vive(rod, t, 104, { boca: "linha", palpebra: 0.8 }, 0.2); kids.forEach((k, i) => vive(k, t, 110 + i, { boca: "sorriso" }, 0.3));
      CV.cr.emissiveIntensity = 0.85 + 0.2 * Math.sin(t * 1.5); CV.brilhos(t); floatDust(CV.poeira, t, 0.2, 0.1); cabeloVento(fr, t, 0.3, [1, 0, 0]);
      const sv = smr(t, K.salvar - 0.3, K.salvar + 0.6) * (1 - smr(t, K.juramento - 0.2, K.juramento + 0.4)); holo.traverse((m) => { if (m.isMesh) m.material.opacity = 0.35 * sv; }); holo.scale.y = Math.max(0.01, E.outBack(sv));
      aneis.forEach((r, i) => { const k = smr(t, K.juramento - 0.1 + i * 0.2, K.juramento + 0.5 + i * 0.2), aperta = smr(t, K.proibia - 0.2, K.proibia + 0.5); r.material.opacity = 0.9 * k; r.scale.setScalar(lerp(2.2, 1, k) * lerp(1, 0.55, aperta)); r.rotation.set(Math.PI / 2 + Math.sin(t + i) * 0.2, t * (1 + i * 0.4), 0); });
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0, 3.5, 9], [0, 2.4, 6.5], [0, 2.5, -4], [0, 1.4, -2], 46, 44)],
        [K.frieda - 0.2, (tt, u) => ({ ...closeRosto(fr, lerp(1.1, 0.85, E.inOut(u)), 0.15, 0, 30) })],
        [K.salvar - 0.3, mov([2.5, 2.2, 5], [1.8, 2.6, 4.4], [0, 0.8, -1.5], [0, 1.0, -1.5], 46, 44)],
        [K.juramento - 0.2, mov([0.6, 1.5, 2.2], [0.4, 1.45, 1.6], [0, 1.2, -1.5], [0, 1.3, -1.5], 40, 38)],
        [K.proibia - 0.2, (tt, u) => ({ ...closeRosto(fr, lerp(0.9, 0.75, E.inOut(u)), -0.1, 0.03, 30) })],
      ], b);
    },
  };
});

// ================================================================ vídeo: Grisha · cenas 5–9 (caverna, Discord, Sartre, Caminhos, fim)

// ---------------------------------------------------------------- 5 · a caverna: o Grisha implora; a Frieda se transforma (raio); o titã do Grisha a devora; as crianças viram luz
addSet("s5-caverna", (g) => {
  const __n = "s5-caverna";
  const [a, b] = T.sc["s5-caverna"];
  const CV = cavernaCristal(g);
  const fr = friedaLP(); g.add(fr); fr.position.set(0, 0, -2.2);
  const gr = grishaLP(); g.add(gr); gr.position.set(0, 0, 0.2); gr.rotation.y = Math.PI;
  const kids = [0, 1, 2, 3].map((i) => { const k = criancaLP(i); g.add(k); k.position.set(-1.2 + i * 0.55, 0, -4.4 - (i % 2) * 0.3); k.rotation.y = 0.2 - i * 0.1; return k; });
  const rod = rodLP(); g.add(rod);
  const raio = raios(g, [0, 14, -2.2], [0, 0, -2.2], { cor: 0xffe8a0, r: 0.08, amp: 0.8, galhos: 5 });
  // titãs: corpo inteiro musculoso, olhos acesos, vapor; o da Frieda e o de Ataque (cabelo longo)
  const tF = titaLP({ seed: 131, pele: 0xc8947a, olho: "#5a7aa8", olhoAlt: 0.9, brava: 0.1, sob: 0x141418, cabelo: { ...CABELOS_AOT.frieda, seed: 141 }, s: 8.2 }); g.add(tF); tF.position.set(0, 0, -7); tF.visible = false;
  const tG = titaLP({ seed: 132, pele: 0xb07a60, olho: "#2aaa7a", olhoAlt: 0.62, brava: 0.85, sob: 0x1a1410, cabelo: { cor: 0x1a1410, dentes: 22, dente: 0.28, crista: 0.004, franjaY: 0.9, ladoY: -1.2, nucaY: -1.3, esp: 0.01, espBorda: 0.004, varia: 0.12, seed: 142, pontas: [] }, s: 9.2, orelhas: true }); g.add(tG); tG.position.set(2, 0, 3.5); tG.rotation.y = Math.PI - 0.3; tG.visible = false;
  const onda = choque(g, [0, 0, -2.2], 0xfff0c8), onda2 = choque(g, [2, 0, 3], 0xffb090);
  const vapT = steam(g, { origin: [0, 7, -9.5], n: 16, size: 3.0, spread: 6, rise: 1.5, grow: 2.0, opacity: 0.12, life: 3.5, color: 0x8a8890 });
  const vapG = steam(g, { origin: [2, 7, 6], n: 14, size: 3.0, spread: 5, rise: 1.5, grow: 2.0, opacity: 0.1, life: 3.5, color: 0x8a8890 });
  const luzT = new THREE.PointLight(0xffa070, 0, 30, 1.0); g.add(luzT);
  const vap = steam(g, { origin: [0, 0.5, -9], n: 26, size: 3.0, spread: 12, rise: 2, grow: 2.0, opacity: 0.08, life: 4, color: 0x9aa8c0 });
  const luzesK = kids.map(() => dustPts(60, [-0.3, 0.3, 0, 1.0, -0.3, 0.3], 0x9ad8ff, 0.05, 0.9)); luzesK.forEach((p, i) => { kids[i].parent.add(p); p.position.copy(kids[i].position); p.visible = false; });
  const luzR = new THREE.PointLight(0xff8048, 0, 20, 1.2); luzR.position.set(1, 6, 0); g.add(luzR);
  return {
    bg: 0x060a14, fog: [10, 40], fogCol: 0x0a1428, hand: 0.008,
    look: { exposure: 1.08, bloom: 0.6, bloomT: 0.78, vig: 0.6, sat: 1.12, con: 1.1, dof: DOF_MED, rosto: 0.6 },
    sun: { dir: [0, 1, 0.3], col: 0x7ab8ff, I: 1.0, c: [0, 1, -2], r: 10 }, hemi: { sky: 0x3a6aaa, ground: 0x0a1020, I: 0.6 }, fill: { col: 0x9ad0ff, I: 0.8, dir: [0, 0.3, 1] }, rim: { col: 0x8ad8ff, str: 1.4 },
    update(t) {
      chicote(t, a, 0.22, -1); vap.upd(t, smr(t, K.transformou, K.transformou + 0.6)); vapT.upd(t, 0.45 * smr(t, K.transformou + 0.2, K.transformou + 0.8) * (1 - smr(t, K.devorou - 0.6, K.devorou - 0.3))); vapG.upd(t, 0.45 * smr(t, K.devorou - 0.2, K.devorou + 0.4)); onda(t, K.transformou); onda2(t, K.devorou); CV.brilhos(t); floatDust(CV.poeira, t, 0.2, 0.1);
      // o Grisha de joelhos implorando, mãos juntas
      restPose(gr); idle(gr, t, 101, 0.2); kneelPose(gr); pose(gr, { handR: 0.6, handL: 0.6 }, 1); rostoLP(gr, t, { boca: t < K.transformou ? "aberta" : "grito", triste: 0.7, choro: 0.6, palpebra: 1.0, choque: smr(t, K.transformou, K.transformou + 0.2) });
      const jun = frenteW(gr, 0, 0.95, 0.28); maoEm(gr, 0, jun.clone().add(V3(0.03, 0, 0)), 1, { abre: 0.5, poleY: 0.0, poleZ: -0.3 }); maoEm(gr, 1, jun.clone().add(V3(-0.03, 0, 0)), 1, { abre: 0.5, poleY: 0.0, poleZ: -0.3 }); ventoAbas(gr, t, 0.4);
      const tr = t > K.transformou; fr.visible = !tr; vive(fr, t, 103, { boca: "linha", triste: 0.5, palpebra: 0.8 }, 0.2);
      raio.set(smr(t, K.transformou - 0.1, K.transformou) * (1 - smr(t, K.transformou + 0.3, K.transformou + 0.7)), t); flash(t, K.transformou, 0.03, 0.35, [1, 0.95, 0.8]); GU.uFlash.value *= 0.6;
      tF.visible = tr && t < K.devorou - 0.32; if (tF.visible) { vive(tF, t, 131, { boca: "ryuk", palpebra: 0.9 }, 0.3); tF.position.y = -5 + 5 * E.out(smr(t, K.transformou, K.transformou + 0.8)); }
      tG.visible = t > K.devorou - 0.4; if (tG.visible) { vive(tG, t, 132, { boca: "ryuk", bravo: 0.9, palpebra: 0.85 }, 0.3); tG.position.y = -5 + 5 * E.out(smr(t, K.devorou - 0.4, K.devorou + 0.2)); }  luzR.intensity = 0.35 * smr(t, K.devorou - 0.2, K.devorou + 0.2) * (1 - smr(t, K.filhos - 0.2, K.filhos + 0.3));
      if (tG.visible) gr.visible = false; else gr.visible = true;
      // titã à vista: luz quente de frente, menos contorno azul e menos luz de preenchimento (não fica fantasma)
      if (tF.visible) { luzT.color.set(0xffa070); luzT.position.set(0, 7, -1.5); luzT.intensity = 2.4 * smr(t, K.transformou + 0.2, K.transformou + 0.9); } else if (tG.visible) { luzT.position.set(-0.5, 8, -2.5); luzT.intensity = 1.9; luzT.color.set(0xffd4b4); } else luzT.intensity = 0;
      if (tF.visible || tG.visible) { RIM.str.value = 0.55; fill.intensity *= 0.45; }
      // as crianças viram luz azul; o Rod foge pelo túnel
      kids.forEach((k, i) => { const d = smr(t, K.filhos + i * 0.15, K.filhos + 0.9 + i * 0.15); k.visible = d < 0.5; vive(k, t, 110 + i, { boca: "aberta", choque: 1, triste: 0.6 }, 0.3); luzesK[i].visible = d > 0.05; luzesK[i].material.opacity = 0.9 * (1 - smr(t, K.filhos + 1, K.filhos + 1.8)); luzesK[i].position.y = kids[i].position.y + d * 1.2; });
      const D = 4, f = clamp((t - (K.filhos - 0.5)) / 1.6); gait(rod, D * f, { from: [2.5, 0, -4.5], ang: 2.4, step: gaitFit(D, 0.8, 1), run: 1 }); rostoLP(rod, t, { boca: "grito", choque: 1, suor: 1 });
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([1.45, 1.1, -1.05], [1.25, 1.08, -0.92], [0, 0.88, 0.1], [0, 0.9, 0.1], 40, 38)],
        [K.implorou + 0.4, (tt, u) => ({ ...closeRosto(gr, lerp(0.95, 0.8, E.inOut(u)), 0.15, 0, 30) })],
        [K.transformou - 0.15, mov([0.4, 1.2, 5.5], [0.3, 1.0, 7.5], [0, 2, -4], [0, 10, -7], 46, 52)],
        [K.caverna - 0.1, mov([-6, 4, 9], [-5, 5, 8], [0, 8, -6], [0, 10, -6], 50, 48)],
        [K.devorou - 0.3, mov([-3, 7, -8], [-3.6, 7.5, -9.5], [2, 11.5, 3.5], [2, 12, 3.5], 46, 44)],
        [K.filhos - 0.55, mov([0.2, 1.3, 0.6], [0.1, 1.4, 0.1], [-0.3, 0.7, -4.5], [-0.3, 1.2, -4.6], 44, 44)],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 6 · Discord: rapidinho
addSet("s6-discord", (g) => {
  const [a, b] = T.sc["s6-discord"];
  vazio(g, 0x0c0820, 0x3a2a7a, 0x06040c);
  const cards = []; for (let i = 0; i < 12; i++) { const c = mesh(box(0.34, 0.21, 0.01), new THREE.MeshStandardMaterial({ map: keyTex, emissive: 0xffffff, emissiveMap: keyTex, emissiveIntensity: 0.6 }), 0, 0, 0, g); c.castShadow = false; cards.push(c); }
  return { bg: 0x0c0820, fog: [6, 30], fogCol: 0x140c30, hand: 0, look: { exposure: 1.1, bloom: 0.8, bloomT: 0.7, vig: 0.5 },
    sun: { dir: [0, 0.6, 1], col: 0xd8c8ff, I: 1.6, c: [0, 1, 0], r: 4 }, hemi: { sky: 0x6a5ab8, ground: 0x0a0814, I: 0.7 }, fill: { col: 0xffffff, I: 0.4, dir: [0, 0.3, 1] }, rim: { col: 0xb0a0ff, str: 1 },
    update(t) { chicote(t, a, 0.2, 1); const lt = t - a; cards.forEach((c, i) => { const up = E.outBack(smr(t, a + i * 0.04, a + 0.5 + i * 0.04)), an = (i / 12) * Math.PI * 2 + lt * 1.2, r = 0.25 + up * 0.75; c.position.set(Math.cos(an) * r, 1.2 + Math.sin(an * 2 + lt) * 0.25, -0.5 + Math.sin(an) * r * 0.5); c.rotation.set(0.2, an + Math.PI / 2, 0.1); c.scale.setScalar(Math.max(0.001, up)); }); },
    cam(t) { return { ...path2(t, [[a, [0, 1.3, 2.6], [0, 1.2, -0.5], 40], [b, [0, 1.3, 2.1], [0, 1.2, -0.5], 38]]), near: 0.03 }; } };
});

// ---------------------------------------------------------------- 7 · Sartre: a floresta na chuva, à noite; o Grisha ajoelhado diante do Eren criança, com a seringa na mão (a escolha)
addSet("s7-sartre", (g) => {
  const __n = "s7-sartre";
  const [a, b] = T.sc["s7-sartre"];
  const FL = florestaChuva(g);
  const ek = erenKidLP(); g.add(ek); ek.position.set(0.45, FL.hf(0.45, -0.3), -0.3); ek.rotation.y = -1.45;
  const gr = grishaLP(); g.add(gr); gr.position.set(-0.06, FL.hf(-0.06, -0.25), -0.25); gr.rotation.y = 1.5;
  const SR = seringa(null); naMao(gr, 0, SR.s, { dx: 0.02, dy: -0.07 });
  const spE = sombraPe(g, ek), spG = sombraPe(g, gr);
  return {
    bg: 0x06080c, fog: [6, 40], fogCol: 0x0c1218, hand: 0.006,
    look: { exposure: 1.12, bloom: 0.55, bloomT: 0.74, vig: 0.6, sat: 0.95, con: 1.08, dof: DOF_MED, rosto: 0.5, lift: [0.0, 0.01, 0.025] },
    sun: { dir: [0.3, 0.9, 0.3], col: 0x8a9ab8, I: 0.6, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x2a3448, ground: 0x08090a, I: 0.45 }, fill: { col: 0xffb870, I: 0.3, dir: [0.6, 0.1, 0.8] }, rim: { col: 0xa8c0e0, str: 1.4 },
    update(t) {
      chicote(t, a, 0.22, 1); FL.chuva_.update(t); FL.LL.intensity = 3 * (0.9 + 0.1 * noise1(t * 7));
      // o Eren em pé, com medo; o Grisha ajoelhado, a seringa brilhando; a mão treme no "não ter escolha"
      vive(ek, t, 6, { boca: t > K.queria ? "triste" : "aberta", triste: 0.8, choro: 0.6, palpebra: 1.05, sobe: 0.6 }, 0.25); pose(ek, { handR: 0.6, handL: 0.6 }, 1);
      restPose(gr); idle(gr, t, 101, 0.15); kneelPose(gr); pose(gr, { spine: [0.15, 0, 0], neck: [0.1, 0, 0] }, 1);
      const treme = smr(t, K.queria - 0.3, K.queria + 0.2) * Math.sin(t * 38) * 0.008, sobe = smr(t, K.livre - 0.6, K.livre);
      maoEm(gr, 0, frenteW(gr, 0.16, 0.72 + 0.1 * sobe + treme, 0.28 + 0.04 * sobe), 1, { abre: 0.6, poleY: 0.1, poleZ: -0.3 }); pose(gr, { handR: 0.85 }, 1);
      maoEm(gr, 1, corpoW(ek, "chest", 0.11, 0.12, 0.03), smr(t, a + 0.3, a + 1.0), { abre: 0.85, poleY: -0.6, poleZ: -0.1 });
      rostoLP(gr, t, { boca: "triste", triste: 0.7, choro: 0.4 + 0.4 * smr(t, K.queria, K.escolha), palpebra: lerp(0.85, 0.55, smr(t, K.escolha - 0.2, K.escolha + 0.3)) });
      SR.liq.material.emissiveIntensity = 1.3 + 0.4 * Math.sin(t * 5); spE(FL.hf(0.45, -0.3)); spG(FL.hf(-0.4, -0.25));
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.2, 1.3, 3.6], [0.15, 1.2, 2.9], [0, 0.9, -0.3], [0, 0.9, -0.3], 42, 40)],
        [K.condenado - 0.3, (tt, u) => ({ ...closeRosto(gr, lerp(0.95, 0.8, E.inOut(u)), -0.45, 0.02, 30) })],
        [K.livre - 0.4, (tt, u) => { const c = SR.s.getWorldPosition(V3()); return { pos: [c.x + 0.1, c.y + 0.12, c.z + lerp(0.8, 0.62, u)], look: [c.x, c.y, c.z], fov: 32, near: 0.02 }; }],
        [K.queria - 0.2, (tt, u) => ({ ...closeRosto(ek, lerp(0.75, 0.65, E.inOut(u)), 0.55, 0.02, 30) })],
        [K.escolha - 0.2, (tt, u) => ({ ...closeRosto(gr, lerp(0.9, 0.75, E.inOut(u)), -0.45, 0.02, 30) })],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 8 · os Caminhos: o Grisha de joelhos chorando na areia; o Eren adulto atrás; "siga em frente"
addSet("s8-caminhos", (g) => {
  const __n = "s8-caminhos";
  const [a, b] = T.sc["s8-caminhos"];
  const CM = caminhos(g);
  const gr = grishaLP(); g.add(gr); gr.position.set(0, 0, 0); gr.rotation.y = 0.1;
  const er = erenAdultoLP(); g.add(er); er.position.set(0.35, 0, -0.75); er.rotation.y = 0.05;
  const brE = glowSprite(0x9ad8ff, 2.4, 0); g.add(brE);
  const spG = sombraPe(g, gr), spE = sombraPe(g, er); const areia = riscosVento(g, 30, [-6, 6, 0.05, 1.2, -4, 5], { cor: 0xe8dcc8, op: 0.45, comp: 2.6 }); const graos = folhasRef(g, 120, [-8, 8, 0.05, 1.5, -5, 5], { cores: [0xe8dcc0, 0xd8c8a8, 0xf0e8d8], brilho: 0x302a20, vel: 3.2, s: 0.5 }); const est = estrelinhas(g, 60, [-30, 30, 4, 30, -60, -10], { cor: 0xd8ecff, s: 0.6 });
  return {
    bg: 0x04060e, fog: [40, 420], fogCol: 0x0a1028, hand: 0,
    look: { exposure: 1.0, bloom: 0.42, bloomT: 0.86, vig: 0.55, sat: 1.12, con: 1.1, dof: { ap: 0.003, max: 0.006 }, rosto: 0.55 },
    sun: { dir: [0.3, 0.45, -1], col: 0xa8d0ff, I: 1.1, c: [0, 1, 0], r: 6 }, hemi: { sky: 0x3a5a9a, ground: 0x1a1a22, I: 0.55 }, fill: { col: 0xbfe0ff, I: 0.6, dir: [0.3, 0.3, 1] }, rim: { col: 0x9ad8ff, str: 1.5 },
    update(t) {
      flash(t, a, 0.001, 0.35, [0.8, 0.9, 1]); GU.uFlash.value *= 0.45; floatDust(CM.pts, t, 0.2, 0.1); areia(t, 1); graos(t, 1); est(t); spG(0); spE(0); cabeloVento(gr, t, 0.8, [1, 0, 0]); cabeloVento(er, t, 1.2, [1, 0, 0]); CM.ramos.forEach((r, i) => r.set(smr(t, a + i * 0.01, a + 1.5 + i * 0.01)));
      // o Grisha ajoelhado chorando; no "siga em frente" ele levanta o rosto
      restPose(gr); idle(gr, t, 101, 0.25); kneelPose(gr); const ergue = smr(t, K.siga - 0.2, K.frente + 0.4);
      pose(gr, { neck: [0.55 * (1 - ergue), 0, 0], head: [0.15 * (1 - ergue), 0, 0], handR: 0.7, handL: 0.7 }, 1);
      maoEm(gr, 0, frenteW(gr, 0.06, 1.05, 0.2).lerp(frenteW(gr, 0.16, 0.55, 0.2), ergue), 1, { abre: 0.4, poleY: 0.0, poleZ: -0.3 }); maoEm(gr, 1, frenteW(gr, -0.06, 1.05, 0.2).lerp(frenteW(gr, -0.16, 0.55, 0.2), ergue), 1, { abre: 0.4, poleY: 0.0, poleZ: -0.3 });
      rostoLP(gr, t, { boca: ergue > 0.5 ? "linha" : "triste", triste: 0.8, choro: 0.9, palpebra: 0.6 + 0.4 * ergue, choque: ergue > 0.3 && ergue < 0.9 ? 1 : 0 }); ventoAbas(gr, t, 0.6);
      // o Eren aparece atrás, como luz, e põe a mão no ombro do pai
      const ap = smr(t, K.memoria - 0.3, K.memoria + 0.8); er.visible = ap > 0.02; er.traverse((m) => { if (m.isMesh && m.material) { m.material.transparent = ap < 1; m.material.opacity = ap; } });
      vive(er, t, 105, { boca: t > K.siga - 0.2 && t < K.frente + 0.3 ? "aberta" : "linha", bravo: 0.5, palpebra: 0.8 }, 0.2); ventoAbas(er, t, 0.6);
      const mao = smr(t, K.filho8 - 0.3, K.filho8 + 0.4); maoEm(er, 0, corpoW(gr, "chest", -0.14, 0.27, 0), mao, { abre: 0.5, poleY: 0.0, poleZ: -0.3 }); pose(er, { handR: 0.4 * mao }, 1);
      brE.position.copy(olhosW(er)).add(V3(0, -0.5, -0.2)); brE.material.opacity = 0.35 * ap * (1 - smr(t, K.memoria + 0.8, K.memoria + 2));
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, mov([0.2, 0.9, 4.6], [0.15, 0.85, 3.6], [0, 0.7, -1], [0, 0.75, -1], 40, 38)],
        [K.chorando - 0.3, (tt, u) => ({ ...closeRosto(gr, lerp(1.35, 1.15, E.inOut(u)), 0.3, 0.12, 32) })],
        [K.memoria - 0.3, mov([0.9, 1.0, 2.8], [0.7, 1.2, 2.4], [0.1, 1.1, -0.4], [0.2, 1.4, -0.6], 42, 40)],
        [K.eren - 0.25, (tt, u) => ({ ...closeRosto(er, lerp(1.0, 0.8, E.inOut(u)), -0.15, 0, 30) })],
        [K.siga - 0.2, (tt, u) => ({ ...closeRosto(gr, lerp(0.85, 0.72, E.inOut(u)), 0.12, 0, 30) })],
      ], b);
    },
  };
});

// ---------------------------------------------------------------- 9 · fim: a chave do porão no pescoço do Eren; o pai e o filho na porta de casa em Shiganshina ao amanhecer; a câmera sobe sobre os telhados até a Muralha Maria
addSet("s9-fim", (g) => {
  const __n = "s9-fim";
  const [a, b] = T.sc["s9-fim"];
  const SA = shiganshinaAlto(g);
  ruaPedra(g, 12, 30, 12);
  const casa = casaEnx(g, 0, -4.2, { w: 6, d: 5, h: 6, luz: true });
  const sol = solFlare(g, [300, 40, -420], 1.4, 0xffe0b0);
  const ek = erenKidLP(); g.add(ek); ek.position.set(0.35, 0, -0.9); ek.rotation.y = 0.15;
  const gr = grishaLP(); g.add(gr); gr.position.set(-0.05, 0, -1.25); gr.rotation.y = 0.9;
  const ch = chave(null); ek.userData.chest.add(ch); ch.position.set(0, 0.12, 0.16); ch.scale.setScalar(1 / ek.scale.x * 1.0); const cord = mesh(new THREE.TorusGeometry(0.11, 0.003, 4, 24, Math.PI), LPmat(0x5a3a22), 0, 0.22, 0.05, ek.userData.chest); cord.rotation.z = Math.PI;
  const brilho = estrelinhas(g, 1, [0, 0, 0, 0, 0, 0], { cor: 0xfff0c0, s: 0.045 });
  const spE = sombraPe(g, ek), spG = sombraPe(g, gr);
  const fol = folhasRef(g, 60, [-6, 6, 0.3, 4, -4, 4], { cores: [0xe8c890, 0xd8a868, 0xf0e0c0], brilho: 0x302010, vel: 1.4, s: 1.4 });
  return {
    bg: 0xe8a07a, fog: [40, 600], fogCol: 0xe8b8a0, hand: 0,
    look: { exposure: 1.06, bloom: 0.45, bloomT: 0.82, vig: 0.42, sat: 1.12, con: 1.06, dof: DOF_MED, rosto: 0.35 },
    sun: { dir: [0.7, 0.25, -0.65], col: 0xffc890, I: 2.6, c: [0, 2, -1], r: 10 }, hemi: { sky: 0xe8c0a8, ground: 0x4a4038, I: 0.9 }, fill: { col: 0xffd8b0, I: 0.5, dir: [-0.4, 0.3, 1] }, rim: { col: 0xffc080, str: 1.5 },
    update(t) {
      chicote(t, a, 0.22, 1); SA.aves(t); fol(t, 0.7);
      vive(ek, t, 6, { boca: "linha", palpebra: 1.0, sobe: 0.3 }, 0.2); cabeloVento(ek, t, 0.6, [1, 0, 0]);
      vive(gr, t, 101, { boca: t > K.filho9 ? "sorriso" : "linha", triste: 0.3, palpebra: 0.8 }, 0.2); pose(gr, { neck: [0.3, 0.2, 0] }, 1); ventoAbas(gr, t, 0.7);
      // a mão do pai no ombro do filho
      maoEm(gr, 0, corpoW(ek, "head", 0.0, 0.17, -0.01), smr(t, K.empurrado - 0.6, K.empurrado), { abre: 0.9, poleY: -0.2, poleZ: -0.1 }); pose(gr, { handR: 0.2 }, 1);
      const cw = ch.getWorldPosition(V3()); brilho(t, 1); g.children.filter((c) => c.isSprite && c.material.map === estrelaTex).forEach((s_) => s_.position.copy(cw).add(V3(0.01, 0.02, 0.03)));
      spE(0); spG(0);
      escurece(t, b - 0.7, b, [0, 0, 0], 1);
    },
    cam(t) {
      { const d = dbgCam(__n); if (d) return d; }
      return planos(t, [
        [a, (tt, u) => { const c = ch.getWorldPosition(V3()); return { pos: [c.x + 0.05, c.y + 0.05, c.z + lerp(0.42, 0.34, u)], look: [c.x, c.y, c.z], fov: 32, near: 0.02 }; }],
        [K.empurrado - 0.5, mov([1.6, 1.2, 2.6], [1.3, 1.25, 2.2], [-0.05, 0.95, -1.0], [-0.05, 1.0, -1.0], 40, 38)],
        // sobe sobre os telhados até ver Shiganshina inteira e a Muralha Maria ao amanhecer
        [K.voltar - 0.4, (tt, u) => { if (u < 0.35) { const k = E.inOut(u / 0.35); return { pos: [0.4, lerp(1.25, 3.5, k), lerp(2.2, 14, k)], look: [0, lerp(1.0, 2.5, k), -1], fov: 40 }; } const k = E.inOut((u - 0.35) / 0.65); return { pos: [lerp(0.4, 4, k), lerp(3.5, 60, k), lerp(14, 70, k)], look: [lerp(0, -10, k), lerp(2.5, 10, k), lerp(-1, -120, k)], fov: lerp(40, 50, k) }; }],
      ], b);
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
  GU.uLift.value.set(...(L.lift ?? [0, 0, 0])); GU.uGain.value.set(...(L.gain ?? [1, 1, 1])); GU.uFlash.value = 0; GU.uFade.value = 0; GU.uBlur.value.set(0, 0); GU.uFlashCol.value.set(1, 1, 1);
  luzRosto.intensity = L.rosto ?? 0;
  bokeh.enabled = !!L.dof; if (L.dof) { bokeh.uniforms.aperture.value = L.dof.ap ?? 0.004; bokeh.uniforms.maxblur.value = L.dof.max ?? 0.01; }
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
  if (bokeh.enabled) bokeh.uniforms.focus.value = c.focus ?? camera.position.distanceTo(_sd.set(...c.look));
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
