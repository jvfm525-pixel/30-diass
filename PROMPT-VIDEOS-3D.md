# Prompts para os vídeos 3D de curiosidade e "E se você…"

Use em duas etapas, como fizemos aqui: primeiro o roteiro e a narração, depois a animação com o áudio.

---

## ETAPA 1 · Roteiro + narração (cole e troque o TEMA)

```
Crie um vídeo vertical 9:16 de ~75–90 segundos para TikTok sobre o tema:
"[TEMA — ex.: Por que o Muzan tem medo do Tanjiro? / E se você tivesse X na vida real?]"

Formato:
- Tipo: [curiosidade explicando a história / "e se você…" em situações reais]
- Tom: [documentário sério / suspense / humor leve com virada emocional]
- Gancho forte nos primeiros 3 segundos.
- Se for curiosidade: derrube 1 ou 2 palpites errados ("Vingança? ❌") e guarde a resposta pro final.
- Avise "⚠️ spoilers" se tiver.
- Use fatos corretos da obra ou da vida real; não invente números.
- Termine com uma pergunta A ou B pro público comentar.

Entregue:
1. Tabela com 9–11 cenas. Cada cena com cenário 3D próprio (nunca repetir), texto curto na tela e narração.
2. Narração completa para o ElevenLabs v3, com tags [serious], [mysterious], [dramatic], [sad], [whispers], [excited], [sarcastic] e [pause].
3. Descrição pra postar, com A/B, aviso de spoiler e hashtags.
4. Ideia de thumb: título curto em 3 linhas, com uma palavra em destaque.

Regras visuais:
- NÃO desenhar personagens, logos ou designs de anime, filme ou jogo.
- Representar os personagens por SÍMBOLOS ORIGINAIS: silhuetas, objetos, cores, luz.
- O nome dos personagens pode aparecer em texto e na narração.
```

---

## ETAPA 2 · Animação 3D (cole junto com o áudio do ElevenLabs)

```
Aqui está o áudio da narração. Anime o roteiro em 3D usando HyperFrames + Three.js:

Áudio e legendas:
- Acelere a voz em 8% e normalize em -15 LUFS.
- Transcreva com whisper e sincronize as legendas palavra por palavra (a palavra falada acende na cor de destaque).

Cena 3D (motor 3D v2, em tools/motor3d):
- Renderizada a partir do tempo (hf-seek), sem animação por relógio.
- Use o motor v2: sombras suaves, céu com nuvens e sol, névoa, bloom, gradação de cor, vinheta e grão.
- Personagens articulados (cotovelo, joelho, dedos), com pálpebras que piscam, boca com expressão e cabelo em mechas. Use IK para mãos e pés que tocam em coisas.
- Criaturas e gigantes com pele texturizada e rosto pintado.
- Cenários em camadas: terreno com relevo, grama ao vento, árvores, pedra com relevo, construções detalhadas, raios de luz, poeira e vapor.
- Câmera em curva (path), com tremor nos impactos. O quadro vertical é estreito na horizontal (cerca de metade do ângulo vertical), então centralize o assunto.
- Cada cena com câmera própria, sempre enquadrando o assunto. Nada de câmera dentro de objetos ou cabeças.

Textos e áudio:
- Textos na tela estilo documentário: etiquetas com borda lateral colorida e números grandes.
- Trilha sintetizada no clima do vídeo: grave e tensa para suspense, arpejo quente para emoção.
- Efeitos sonoros em cada momento-chave.
- Imagens de fundo só com licença livre (domínio público ou CC, do Wikimedia/Openverse), com crédito.

Antes de renderizar:
- Rode o check e tire snapshots de todas as cenas.
- Corrija enquadramento, contraste e texto cortado.

Entrega:
- Renderize em qualidade final e ajuste o volume para cerca de -14,5 LUFS.
- Faça a thumb 1080×1920 numa cena própria, com o título grande e uma palavra em vermelho ou amarelo.
- Me entregue o vídeo, a thumb e a descrição final.
```

---

## Dicas

- **ElevenLabs:** a voz que usamos foi a "Roberta – Smooth and Confident", modelo v3. Dá pra acelerar no próprio editor.
- **Duração:** 75–90 s funciona bem. Acima disso, corte uma cena.
- **Qualidade (pedido fixo):** a partir do vídeo dos Titãs, toda animação usa o motor 3D v2 e tem que ficar visivelmente melhor que a anterior: animação, personagens e cenários.
- **Foco atual (pedido fixo, depois do vídeo do Kakashi):** nos próximos vídeos, melhorar **só a animação**, ou seja, o movimento dos personagens e da câmera. Exemplos:
  - pés que não deslizam ao andar;
  - antecipação e acomodação nos gestos;
  - tecido e cabelo reagindo ao movimento;
  - expressões que mudam com a fala;
  - câmera com movimento contínuo.
  Personagens e cenários seguem o estilo atual. Não refazer vídeos já entregues sem pedido.
- **Viralizar:** gancho + pergunta no meio + resposta guardada pro final + A/B nos comentários.
- **Direitos autorais:** citar e analisar uma obra pode; copiar o desenho dos personagens não. O TikTok também derruba trechos oficiais de anime.
