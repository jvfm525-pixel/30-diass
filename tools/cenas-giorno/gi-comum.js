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
