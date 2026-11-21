# 30-diass
Projeto de animações cinematográficas com IA para TikTok.

## HyperFrames (vídeo vertical 9:16)

Projeto configurado com [HyperFrames](https://hyperframes.heygen.com) (HTML + GSAP → MP4).

- Formato: 1080×1920 (9:16), 30 fps — raiz em `index.html` (`data-composition-id="main"`).
- Animações: GSAP 3.15.0 local em `assets/vendor/gsap.min.js` (padrão `ease: power3.out`).
- Cenas em `compositions/`, mídia e fontes em `assets/`, vídeos gerados em `renders/` (ignorado pelo git).
- Skills do agente em `.claude/skills/` (instaladas com `npx skills add heygen-com/hyperframes`).

Requisitos: Node.js 22+, FFmpeg/FFprobe e Chrome (`npx hyperframes browser ensure`).

```bash
npm run doctor        # diagnóstico do ambiente
npm run check         # lint + runtime + layout + contraste
npm run dev           # preview no navegador
npm run render:draft  # MP4 rápido -> renders/draft.mp4
npm run render        # MP4 padrão -> renders/out.mp4
npm run render:final  # MP4 final -> renders/final.mp4
```
