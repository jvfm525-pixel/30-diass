# "O Chat Faz um Craque" — plano dos 30 dias

## A série

**Biel**, 17 anos, da periferia, muito pobre e talentoso, sonha em ser o melhor jogador do mundo. No DIA 1 chega a notícia: **um olheiro europeu vai fazer uma PENEIRA no bairro daqui a 30 dias, e só um garoto será escolhido.** O público decide cada passo nos comentários (A ou B).

- **Personagens (todos fictícios):**
  - **Vó Cida:** a avó, que vende salgado na feira, é brava, engraçada e acredita nele.
  - **Professor Bigode:** treinador da várzea que "quase foi pro profissional", com um apito enferrujado e frases de efeito.
  - **Kauã:** o rival, filho do dono do mercadinho, com chuteira dourada, personal trainer e arrogância.
  - **Duda:** a melhor amiga, que grava tudo e quer ser jornalista esportiva.
- **Barras (0 a 100):** ⚽ Habilidade · 💪 Físico · 💰 Dinheiro · 🧠 Cabeça
- **Início:** ⚽ 35 · 💪 20 · 💰 5 · 🧠 25. **Meta para a peneira:** 70 em tudo.
- **Barra no zero = crise:**
  - 💪 0: lesão
  - 💰 0: sem dinheiro pro ônibus
  - 🧠 0: quer desistir
  - ⚽ 0: vira piada do bairro
- **Os dias 7, 14 e 21 são Dias de Consequência:** uma escolha antiga volta.
- **A aparência acompanha as barras:** o Biel magrelo vira atlético, a chuteira com fita vira chuteira nova e a cara de cansado vira cara de confiante.
- **Todo episódio tem:**
  - de 5 a 9 piadas
  - 2 opções no final
  - o gancho "Faltam X dias pra peneira… e o Kauã tá de olho."
  - a legenda do post pronta (`LEGENDAS-CRAQUE.md`)

## Estilo visual (diferente do Armando): "Álbum de Figurinhas"

- **Personagens e objetos em papel recortado:** contorno branco grosso de recorte, sombra de papel e movimento em "stop motion" a 12 quadros por segundo.
- **Fundo:** papel kraft e cartolina com textura, fita adesiva segurando as peças e grampos.
- **Cada personagem aparece como figurinha de álbum** quando é apresentado: moldura, número e nome.
- **Setas e jogadas em giz**, como numa prancheta de técnico, desenhadas na hora.
- **Legendas em tiras de papel rasgado**, com fonte de marcador.
- **Transições:** a página do álbum vira e as figurinhas são coladas com um "TAP!".
- **Barras como a "carta do jogador":** um card de figurinha com as 4 estatísticas, que sobe ou desce com carimbo.
- **Narração no estilo narrador de futebol:** voz masculina empolgada, com bordões como "Olha ele!" e "Que fase!".

## Regras da série (as mesmas do Armando)

- **Piadas:** de 5 a 9 por episódio, uma em cada cena (comparação absurda, narrador cutucando o público, etiqueta irônica, piada visual de fundo, barra que vira outra coisa).
- **2 opções no final**, sempre, com a legenda do post pronta em `LEGENDAS-CRAQUE.md`.
- **Votação acirrada ou não:** o episódio abre com o resultado da votação anterior (sem inventar porcentagem).
- **Números escondidos até a votação:** o cartão mostra só **"MEXE COM: ⚽ 💪"**, e os números aparecem no episódio seguinte, na cena das barras.
- **Dá pra chegar no máximo, mas o caminho não é óbvio:** `python3 tools/balance_plan.py craque` simula todos os caminhos de votação. O melhor caminho termina com ⚽ 95 · 💪 95 · 💰 100 · 🧠 95 (2.064 finais diferentes com tudo em 70+). Sempre A, sempre B ou "sempre a opção que parece melhor" não chegam. Votando no aleatório, a chance é de ~1%.

## Evolução visual do Biel (aparece a cada mudança de nível)

Cada barra muda o visual em 4 níveis (0–25, 26–50, 51–69, 70+), e a cena **"O QUE MUDOU"** mostra ANTES e DEPOIS em cada episódio, como no Armando. O formato é de figurinha: a figurinha dele vai de "COMUM" a "LENDÁRIA ✨".

| Barra | Nível 1 (0–25) | Nível 2 (26–50) | Nível 3 (51–69) | Nível 4 (70+) |
| --- | --- | --- | --- | --- |
| ⚽ Habilidade | chinelo e bola murcha | chuteira emprestada com fita | chuteira usada inteira e bola cheia | **chuteira nova brilhando** e a bola "colando" no pé |
| 💪 Físico | magrelo, braços de palito, curvado | menos magro | atlético | **forte e definido**, postura de atleta |
| 💰 Dinheiro | camisa furada e shorts rasgado | camisa nova | uniforme do time da várzea | **agasalho completo e mochila esportiva** |
| 🧠 Cabeça | cara insegura e ombros caídos | sorriso tímido | olhar confiante | **olhar de craque e faixa de capitão** |

Com as 4 no máximo: **figurinha LENDÁRIA ✨** (moldura dourada holográfica), anunciada como "✨ CRAQUE COMPLETO".

## Plano dos dilemas (DIAS 3–29) — bastidores

Depois dos DIAS 1–2 o Biel está com ⚽ 45 · 💪 20 · 💰 0 · 🧠 30. Na tela, antes da votação, aparece só a coluna "Na tela". Os números e as notas são **só de bastidor** (`tools/plan_craque.py`).

### Semana 1 — Do zero (DIAS 3–7)

| Dia | Dilema | Na tela | A (bastidor) | B (bastidor) |
| --- | --- | --- | --- | --- |
| 3 | Como chegar no amistoso do bairro vizinho (8 km) | MEXE COM: ⚽ 💪 🧠 | Ir correndo (💪+10 ⚽−5) — _chega cansado_ | Pedir carona pro Kauã (🧠−10 ⚽+10) — _joga descansado, mas o Kauã filma tudo_ |
| 4 | Primeiro amistoso: faltou goleiro | MEXE COM: ⚽ 💪 💰 🧠 | Continuar no ataque (⚽+10 💪−5) | Ir pro gol (🧠+10 💰+5) — _SURPRESA: o time paga o lanche do herói_ |
| 5 | A Vó Cida oferece sociedade nos salgados | MEXE COM: 💪 💰 🧠 | Vender no intervalo dos jogos (💰+15 💪−5) | Vender geladinho na saída da escola (💰+10 🧠+5) |
| 6 | A chuteira emprestada rasga | MEXE COM: ⚽ 💪 🧠 | Jogar descalço, 'pé de pedra' (⚽+5 💪−5) | Trocar o álbum de figurinhas por uma chuteira usada (⚽+10 🧠−5) — _era o álbum do pai_ |
| 7 | **CONSEQUÊNCIA:** a Duda quer postar o vídeo do chapéu | MEXE COM: 💰 🧠 | Deixar postar (🧠+10 💰+10) — _SURPRESA: viraliza e uma loja dá uma camisa_ | Não postar (🧠−5) |

### Semana 2 — As primeiras chances (DIAS 8–14)

| Dia | Dilema | Na tela | A (bastidor) | B (bastidor) |
| --- | --- | --- | --- | --- |
| 8 | Bico pra juntar dinheiro | MEXE COM: ⚽ 💪 💰 🧠 | Entregador de bicicleta (💰+15 💪+5 ⚽−5) | Ajudante no lava-jato (💰+10 🧠+5) |
| 9 | O Kauã desafia pro 1x1 valendo a chuteira dourada | MEXE COM: ⚽ 💰 🧠 | Aceitar (⚽+10 🧠−10) — _ARMADILHA: ganha o 1x1, mas a chuteira não serve e o bairro zoa_ | Propor valendo um lanche (💰+5 🧠+5) |
| 10 | Treino às 5h na escadaria do morro | MEXE COM: 💪 🧠 | Ir (💪+15 🧠−5) | Dormir e treinar à noite (💪+5 🧠+5) |
| 11 | Comida da semana | MEXE COM: 💪 🧠 | Dieta da Vó: feijão, arroz e ovo (💪+10) | Shake de graça do personal do Kauã (💪+15 🧠−10) — _o Kauã posta 'ajudando os pobres'_ |
| 12 | O Professor Bigode quer ele de volante | MEXE COM: ⚽ 🧠 | Aceitar a posição nova (⚽+5 🧠+10) | Insistir em ser atacante (⚽+10 🧠−5) |
| 13 | Show de talentos da escola (prêmio de R$ 50) | MEXE COM: 💰 🧠 | Fazer embaixadinha (💰+15 🧠+5) | Levar a Vó Cida pra cantar (💰+10 🧠+10) — _SURPRESA: a Vó arrasa_ |
| 14 | **CONSEQUÊNCIA:** a Vó Cida fica doente | MEXE COM: ⚽ 🧠 | Ficar cuidando dela (🧠+10 ⚽−5) | Treinar e a Duda cuida (⚽+10 🧠−10) |

### Semana 3 — As complicações (DIAS 15–21)

| Dia | Dilema | Na tela | A (bastidor) | B (bastidor) |
| --- | --- | --- | --- | --- |
| 15 | Um 'empresário' pede R$ 100 pra 'garantir a vaga' | MEXE COM: 💰 🧠 | Pagar (💰−15) — _GOLPE_ | Pesquisar o nome dele antes (🧠+10) |
| 16 | O tornozelo começa a doer | MEXE COM: ⚽ 💪 🧠 | Gelo e repouso (💪+5 ⚽−5) | Fisioterapia no posto de saúde (💪+10 🧠−5) — _fila de 4 horas_ |
| 17 | A padaria do bairro quer patrocinar | MEXE COM: 💪 💰 🧠 | Usar a camisa 'Pão Quente do Seu Zé' (💰+20 🧠−5 💪−5) — _a zoeira no bairro + pão de graça todo dia_ | Recusar e esperar algo melhor (🧠+5 💰+5) — _SURPRESA: a loja de esportes oferece um bico_ |
| 18 | Festa na laje na véspera do treino | MEXE COM: 💪 🧠 | Ir (🧠+10 💪−10) | Dormir cedo (💪+5) |
| 19 | Final da copa da várzea: pênalti decisivo | MEXE COM: ⚽ 💪 🧠 | Bater (⚽+15 🧠+10 💪−15) — _faz o gol… e torce o tornozelo comemorando em cima do alambrado_ | Passar a vez pro amigo (⚽+5 🧠+5) — _dá a assistência no rebote_ |
| 20 | O bairro quer fazer uma vaquinha pra ele | MEXE COM: 💰 🧠 | Aceitar (💰+20 🧠−5) — _a pressão aumenta_ | Dar aula de futebol pras crianças (💰+10 🧠+10) |
| 21 | **CONSEQUÊNCIA:** o 'empresário' volta | MEXE COM: 🧠 | Encarar, com a Duda gravando (🧠+15) | Fugir do assunto (🧠−10) |

### Semana 4 — A reta final (DIAS 22–29)

| Dia | Dilema | Na tela | A (bastidor) | B (bastidor) |
| --- | --- | --- | --- | --- |
| 22 | Chuteira nova antes da peneira | MEXE COM: ⚽ 💰 🧠 | Comprar (💰−20 ⚽+15) | Manter a de fita 'da sorte' (🧠+10) |
| 23 | Treino com o Zé Foguete, lenda do bairro | MEXE COM: ⚽ 💪 🧠 | Treino pesado (⚽+15 💪−5) | Treino leve de técnica (⚽+10 🧠+5) |
| 24 | O Kauã se machuca no treino | MEXE COM: ⚽ 🧠 | Ajudar o rival (🧠+15) | Aproveitar e treinar mais (⚽+10 🧠−10) |
| 25 | A Vó Cida inventa uma simpatia | MEXE COM: ⚽ 💪 🧠 | Fazer a simpatia (🧠+10) | Treino extra de pênalti (⚽+5 💪+5) |
| 26 | O que treinar por último | MEXE COM: ⚽ 💪 🧠 | Jogo coletivo (⚽+10 🧠+5) | Drible solo (⚽+10 💪+5) |
| 27 | Como chegar à peneira | MEXE COM: 💪 💰 🧠 | Ônibus às 4h da manhã (💪−5 💰−5 🧠+5) | Carona com o Kauã (🧠−10 💪+5) |
| 28 | A noite anterior | MEXE COM: 💪 🧠 | Dormir cedo (💪+10) | Assistir lances de craques (🧠+10) |
| 29 | O aquecimento na frente do olheiro | MEXE COM: ⚽ 🧠 | Tentar a bicicleta (⚽+20 🧠−5) — _arriscado_ | Jogar seguro (⚽+5 🧠+5) |

## DIA 30 — A peneira

As 4 barras aparecem na "carta do jogador", e cada ✅ é um carimbo do olheiro:

- **4 ✅:** "ESCOLHIDO!" O Biel embarca para a Europa (o melhor final).
- **3 ✅:** lista de espera, com o cartão do olheiro no bolso.
- **1 ou 2 ✅:** o Kauã é escolhido, mas o olheiro diz: "volta ano que vem".
- **0 ✅:** vira meme do bairro… e sobe a hashtag #VoltaBiel.

**Temporada 2?** A) O Biel na Europa · B) O Biel tenta de novo no Brasil
