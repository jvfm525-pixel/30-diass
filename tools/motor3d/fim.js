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
window.__hf.buildReady["__ID__"] = (async () => {
  try { await document.fonts.load("700 48px 'Archivo Black'"); await document.fonts.ready; } catch (e) { /* sem fontes */ }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  try { await renderer.compileAsync(scene, camera); } catch (e) { /* compila no primeiro quadro */ }
  renderAt(0);
})();
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
