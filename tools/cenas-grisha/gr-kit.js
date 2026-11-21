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
// CABELO NO VENTO (estudo em GUIA-ANIMACAO-ESTILO.md): o vento é do MUNDO (não gira com a cabeça); cada mecha dobra a partir da
// raiz (peso = (dist/comprimento)²), a ponta chega atrasada (a rajada que ela sente é a de um instante antes), rajadas lentas +
// tremor rápido só na ponta; a touca só mexe na borda (franja/nuca); cabelo duro (rigidez baixa) quase não dobra, só treme.
const _qv = new THREE.Quaternion(), _wv = new THREE.Vector3(), _wl = new THREE.Vector3();
const rajada = (t) => 0.62 + 0.28 * Math.sin(t * 0.85) + 0.14 * Math.sin(t * 2.1 + 1.3) + 0.06 * Math.sin(t * 5.3);
function cabeloVento(p, t, f = 1, dir = [1, 0, 0]) { const hg = p.userData.head && p.userData.head.userData.hairG; if (!hg) return;
  const rig = hg.userData.rig ?? 1; p.updateMatrixWorld(true);
  hg.traverse((m) => { if (!m.isMesh) return; const gm = m.geometry, a = gm.attributes.position; if (!gm.userData.b) gm.userData.b = a.array.slice(); const b = gm.userData.b;
    m.getWorldQuaternion(_qv).invert(); _wv.set(dir[0], dir[1] ?? 0, dir[2]).normalize(); const sc = m.getWorldScale(_wl).x || 1;
    if (m.userData.lock) { const L = m.userData.lock.L, ph = m.userData.lock.i * 1.7;
      for (let i = 0; i < a.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2], s = clamp(y / L), k = s * s;
        const g = rajada(t - 0.18 * s - ph * 0.05), tr = Math.sin(t * 11 - s * 6 + ph) * 0.35 * s;
        _wl.copy(_wv).applyQuaternion(_qv).multiplyScalar(f * L * (0.42 * rig * g + 0.1 * tr) * k / sc);
        a.setXYZ(i, x + _wl.x + Math.sin(t * 9 + ph) * 0.004 * f * k, y + _wl.y - 0.06 * k * L * f * rig * g * 0.3, z + _wl.z); } }
    else { let ymax = -1e9, ymin = 1e9; for (let i = 1; i < a.count * 3; i += 3) { ymax = Math.max(ymax, b[i]); ymin = Math.min(ymin, b[i]); }
      for (let i = 0; i < a.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2], e = clamp((ymin + (ymax - ymin) * 0.55 - y) / ((ymax - ymin) * 0.55)), k = e * e;
        if (k <= 0) { a.setXYZ(i, x, y, z); continue; } const ph = Math.atan2(x, z) * 3, g = rajada(t - 0.12 * e);
        _wl.copy(_wv).applyQuaternion(_qv).multiplyScalar(0.04 * f * rig * (0.7 * g + 0.25 * Math.sin(t * 10 + ph)) * k / sc); a.setXYZ(i, x + _wl.x, y + _wl.y, z + _wl.z); } }
    a.needsUpdate = true; gm.computeVertexNormals(); }); }

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
