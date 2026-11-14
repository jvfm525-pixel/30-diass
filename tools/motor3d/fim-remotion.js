// ---------------------------------------------------------------- fim (versão Remotion): sem eventos, devolve renderAt e ready
function sceneAt(t) { for (const [n, a, b] of T.scenes) if (t >= a && t < b) return n; return T.scenes[T.scenes.length - 1][0]; }
const _sd = new THREE.Vector3(), _col = new THREE.Color();
FIM_CORPO
const ready = (async () => {
  try { await document.fonts.ready; } catch (e) { }
  if (window.HF_PRELOAD) { try { await Promise.all(window.HF_PRELOAD); } catch (e) { } }
  REDRAW.forEach((f) => f());
  for (const k in SETS) SETS[k].group.visible = true;
  try { await renderer.compileAsync(scene, camera); } catch (e) { }
})();
return { renderAt, ready, dispose: () => renderer.dispose() };
}
