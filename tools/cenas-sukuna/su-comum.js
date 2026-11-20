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
  return { update(t) { rs.forEach((r, i) => { const ph = (t * 1.6 + hash(i * 7.3)) % 1; r.scale.setScalar(0.02 + ph * 0.16); r.material.opacity = (1 - ph) * 0.5; }); } };
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
  const root = new THREE.Group(), body = grp(root, 0, 0.62, 0);
  const tor = mesh(new THREE.CapsuleGeometry(0.2, 0.62, 3, 6), m, 0, 0, 0, body); tor.rotation.x = Math.PI / 2; tor.scale.set(1, 1, 1.05);
  mesh(new THREE.SphereGeometry(0.25, 6, 5), m, 0, 0.04, 0.3, body).scale.set(0.95, 1.05, 0.9); // peito
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
    const l = grp(body, sx * 0.12, -0.08, sz * 0.32); mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.32, 5), m, 0, -0.16, 0, l);
    const k = grp(l, 0, -0.3, 0); mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.26, 5), m, 0, -0.13, 0, k); mesh(new THREE.BoxGeometry(0.07, 0.04, 0.1), md, 0, -0.26, 0.02, k);
    return { l, k };
  });
  shadows(root);
  root.userData = { body, neck, head, tail, legs };
  return root;
}
// respira, mexe a cabeça e o rabo; rosna (abaixa a cabeça); corre (passo)
function loboAnim(p, t, o = {}) {
  const u = p.userData, b = Math.sin(t * 2.2 + (o.seed ?? 0));
  u.body.position.y = 0.62 + b * 0.008 + Math.abs(Math.sin(t * 7)) * 0.04 * (o.corre ?? 0);
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
      pontas: [...coroa(4, 0.2, 1.25, 0.72, 0.0, 0.0, 0.42, 0.22, -0.06, 0.3), ...coroa(4, 0.2, 1.25, 0.72, 0.0, 0.0, -0.64, 0.22, -0.06, 0.3), ...coroa(5, -0.2, 1.05, 0.7, 0.0, 0.0, 0.7, 0.6, -0.04, 0.3)] }, ...o });
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
  return { c, set(k, t = 0) { ls.forEach((l, i) => l.set(clamp(k * 1.5 - i * 0.15))); halo.material.opacity = 0.5 * k; L.intensity = 3 * k; } };
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
