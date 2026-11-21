# Vídeo do Subaru (Re:Zero) — Plano de execução

> **Para quem executa:** usar superpowers:executing-plans (nativo). Passos com checkbox.

**Goal:** vídeo-ensaio vertical 1080×1920 (~103 s) "Por que o Subaru não consegue contar a ninguém que pode voltar da morte".
**Architecture:** mesmo pipeline do Gojo: texto marcado → tempos pela transcrição → 3D (Three.js no Remotion, cenas em `tools/cenas-subaru/`) → texto e som (HyperFrames em `subaru/`) → mix ffmpeg.
**Tech Stack:** Python (timing/som/build), JS do motor (`tools/motor3d`, kits do Grisha/Gojo), Remotion 4, HyperFrames 0.9.17, ffmpeg.
**Spec:** `ROTEIRO-SUBARU.md`

## Global Constraints
- Narração em 1,0x (sem acelerar); vídeo pode passar de 1 min.
- Chamada: "Quer aprender a fazer esses vídeos? Link do meu Discord na bio." + selo "QUER APRENDER? · link do Discord na bio".
- Cabelos fiéis ao estudo do spec; vento pelo `cabeloVento` novo, com `rigidez` por cabelo.
- Cenários originais, tudo apoiado no chão; nada de cena copiada de anime.
- Render 3D em partes de ≤ 1.150 quadros (limite de 2 h por tarefa).

## Review Focus
1. Mãos de sombra/silhueta da Satella podem estourar a luz (bloom) → conferir nos quadros dos trechos A MÃO e A BRUXA.
2. Cabelo comprido (Emilia, Echidna) atravessando corpo/costas no vento → conferir de lado e de costas.
3. Personagem sentado (Subaru, Echidna) com perna dentro da mesa/cadeira → conferir quadro do chá.
4. Câmera dentro de parede/árvore nas cenas da mansão → varredura de 0,5 s.
5. Legenda por cima de rosto em close → snapshot do HyperFrames nos closes.

---

### Task 1: Texto e tempos
**Files:** `tools/subaru_texto.py` (pronto), criar `tools/timing_subaru.py` (cópia do `timing_gojo.py`, sem CORTES/SEM_3D, FIX para "satela"→"satella", "equidna"→"echidna").
- [ ] Rodar `python3 tools/timing_subaru.py` → `subaru/assets/timing.js` e `remotion/src/videos/subaru/dados.json`; esperado "palavras sem par" ≤ 30 (vazios), total ≈ 102,7 s.
- [ ] Commit.

### Task 2: Personagens com cabelo fiel + aprovação
**Files:** criar `tools/cenas-subaru/su2-comum.js` (subaruLP, emiliaLP, echidnaLP, satellaSombra, maosSombra) e `tools/cenas-subaru/su2-teste.js` (folha dos três de frente, 3/4 e costas).
- [ ] Render da folha (still) → `renders/subaru-personagens.png`; conferir contra o estudo do spec; mandar ao usuário e esperar aprovação dos cabelos.
- [ ] Commit.

### Task 3: Cenários e cenas 3D
**Files:** criar `tools/cenas-subaru/su2-locais.js` (ruaCapital, jardimMansao, mundoCinza, vazioSatella, colinaCha, campoMarcos, telhadoAmanhecer), `su2-a.js` (s0–s4), `su2-b.js` (s5–s9); `remotion/src/videos/subaru/` + composições Subaru3D/Subaru3DPrev no `Root.tsx`.
- [ ] Montar motor; `node --check`; stills de teste por cena.
- [ ] Commit.

### Task 4: Varredura 0,5 s e correções
- [ ] Render `Subaru3DPrev` (1 quadro/0,5 s) → folhas; listar e corrigir: chão, objetos no ar, poses, câmera, luz (Review Focus 1–4).
- [ ] Repetir até limpo; commit.

### Task 5: Texto, som, render, capa, entrega
**Files:** criar `tools/som_subaru.py`, `tools/build_subaru.py` (cópias do Gojo com fichas: Heidegger "Ser e Tempo · 1927 · ninguém pode morrer no lugar do outro"; "Re:Zero · Tappei Nagatsuki").
- [ ] `npx hyperframes check` sem erros (fora o 3d.mp4); snapshot dos closes (Review Focus 5).
- [ ] Render 3D em 3 partes → concat → HF 60 fps → mix; conferir 20 quadros do final + volume.
- [ ] Capa com regras da youtube-thumbnail-design; commit; enviar.
