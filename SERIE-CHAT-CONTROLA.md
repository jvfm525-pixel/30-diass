# "O Chat Controla a Vida do Armando" — 30 dias até o reencontro

## A meta (o gancho da série)

**Daqui a 30 dias é o reencontro de 10 anos da turma da escola, e o Armando mentiu no grupo.**

No DIA 1 chega a mensagem no grupo "Turma 3ºB 🎓": *"REENCONTRO em 30 dias!! Tragam a família 😍"*. Todo mundo posta foto de casamento, carro e viagem. Armando, de cueca no quarto imundo e comendo miojo, digita:

> "Claro! Vou com minha namorada 😎 tô bem de vida, sarado e sou gerente agora"

Enviado ✔✔. Ele se arrepende na hora, mas todo mundo já viu e reagiu.

**Agora ele tem 30 dias para transformar as 4 mentiras em verdade, e o chat controla cada decisão.** Cada barra é uma mentira que ele contou:

| Mentira no grupo | Barra | Meta no DIA 30 |
| --- | --- | --- |
| "tô bem de vida" | 💰 Dinheiro | 70+ |
| "tô sarado" | ❤️ Saúde | 70+ |
| "vou com minha namorada" | 💘 Amor | 70+ |
| "sou gerente agora" | ⭐ Reputação | 70+ |

Na tela fica sempre: **REENCONTRO EM: 30 DIAS** + as 4 barras com a linha da meta marcada.

**O vilão:** o Rodrigo foi o valentão da turma e hoje é colega de trabalho do Armando. Ele sabe a verdade e ameaça contar pra todo mundo no reencontro.

Gancho para fechar cada episódio: *"Faltam X dias… e o Rodrigo tá de olho."*

## Como funciona

- Um episódio por dia, de 20 a 30 s. Cada um termina com um dilema **A ou B** para o público comentar.
- A opção mais votada acontece no episódio seguinte, e as barras sobem ou descem na tela.
- **4 barras (0 a 100):** 💰 Dinheiro · ❤️ Saúde · 💘 Amor · ⭐ Reputação
- **Início:** 💰 15 · ❤️ 30 · 💘 10 · ⭐ 40
- **Nenhuma escolha é perfeita:** toda opção sobe uma barra e derruba outra.
- **Barra no zero = crise:** o episódio seguinte vira um episódio especial (💰 0 = despejo · ❤️ 0 = hospital · 💘 0 = coração partido · ⭐ 0 = cancelado na internet).
- **Todo episódio tem piadas (de 5 a 9):** uma logo no gancho, uma em cada cena e uma no gancho final. Tipos que funcionam:
  - comparação absurda ("a coluna estalou e o GPS falou: recalculando rota")
  - o narrador cutucando o público ("obrigado pela consideração, gente")
  - etiqueta irônica na tela ("BRONZEADO: MONITOR LED")
  - piada visual no fundo (o grampeador suando, o limão com chapéu de aniversário)
  - a barra virando outra coisa ("saúde igual bateria de celular às 23h: 20%")
- **Todo episódio sai com a legenda do post pronta** (ver `LEGENDAS.md`): gancho, piada, as 2 opções com o efeito nas barras, "comenta A ou B", hashtags fixas e o crédito da música quando for CC BY.
- **Os dias 7, 14 e 21 são "Dias de Consequência":** algo escolhido antes volta para cobrar o preço.

## Evolução visível (a partir do DIA 4)

**As mudanças na aparência e na vida do Armando têm que aparecer.** Cada barra muda o visual em 4 níveis (0–25, 26–50, 51–69 e 70+), de forma automática (`armando(..., stats=...)` em `tools/hq_lib.py`):

| Barra | Nível 1 (0–25) | Nível 2 (26–50) | Nível 3 (51–69) | Nível 4 (70+) |
| --- | --- | --- | --- | --- |
| ❤️ Saúde | muitas espinhas, pele amarelada, olheiras fundas | menos espinhas, olheiras menores | quase sem espinhas | **rosto fino e queixo marcado**, pele limpa, sem papada nem rugas |
| 💰 Dinheiro | regata furada e manchada, óculos com fita | regata nova e limpa, óculos sem fita | camisa polo, óculos modernos de armação fina | **blazer azul-marinho**, camisa social, óculos redondos de grife |
| 💘 Amor | barba por fazer, careca com fios de lado | barba aparada, cabelo raspado nascendo | barba feita, cabelo curto penteado | **topete com brilho, nariz mais fino, sorriso confiante brilhando ✨** |
| ⭐ Reputação | — | — | crachá da empresa | **gravata e crachá de GERENTE** |

**Cada categoria no máximo traz a sua parte do glow-up** (ver a tabela). Com as 4 no máximo, o Armando fica completo e a cena "O QUE MUDOU" anuncia "✨ GLOW-UP COMPLETO". Prévia: `docs/armando-categorias.png`.

**A expressão também muda:** quanto mais alto o conjunto das barras, mais confiante fica a cara "parada" dele (triste → neutra → sorriso de canto).

**Todo episódio tem a cena "O QUE MUDOU"** (`tools/upgrade_scene.py`), logo depois das barras: o Armando ANTES e DEPOIS lado a lado, as barras que mudaram (ex.: 💰 20 → 30) e a lista do que mudou ("💰 UPGRADE: regata nova e limpa"). Se nenhuma barra mudou de nível, a cena mostra quanto falta para o próximo visual ("Falta 5 de ❤️ pro próximo visual 👀").

**A narração de cada episódio tem uma frase para essa cena**, por exemplo: "E olha a diferença: a regata nova, sem furo!" ou "Saúde subiu de nível: as espinhas estão sumindo."

**A vida também muda** conforme as barras: o celular trincado vira um novo (💰), aparece comida na geladeira (❤️), a Carla começa a responder as mensagens (💘) e o Rodrigo para de rir no grupo (⭐).

## Personagens fixos

- **Armando**: o protagonista.
- **Seu Valdir**: o chefe mal-humorado.
- **Carla**: a vizinha do 302, possível par romântico.
- **Tonhão**: o melhor amigo e parceiro de churrasco.
- **Rodrigo**: o colega puxa-saco e rival.
- **Dona Neide**: a mãe, que vive ligando.

## Plano rebalanceado: dá pra chegar no máximo em tudo

Depois dos DIAS 1–4 o Armando está com 💰 20 · ❤️ 30 · 💘 20 · ⭐ 30. Os dilemas abaixo foram testados por um programa que simula **todos os caminhos de votação possíveis** (`tools/balance_plan.py`):

- **Existe um caminho em que as 4 barras chegam ao máximo visual (70+):** o melhor termina com 💰 90 · ❤️ 95 · 💘 100 · ⭐ 100.
- **Dá para errar algumas vezes:** há 1.850 finais diferentes com as 4 barras em 70+.
- **Não é automático:** votar sempre na A deixa o 💰 em 45, e votar sempre na B derruba tudo. Votando no aleatório, a chance de chegar com tudo no máximo é de só 0,3%. O público precisa pensar em cada escolha.
- As barras vão de 0 a 100. Barra no zero continua causando crise.

**Regra ao mudar um dilema:** rode `python3 tools/balance_plan.py` e confira que continua existindo um caminho com tudo em 70+.

### Semana 1 — Primeiros passos (DIAS 5–7)

| Dia | Dilema | A | B |
| --- | --- | --- | --- |
| 5 | Celular quebrado | Parcelar em 12x (💰−15 ⭐+10) | Consertar com durex (⭐−5) |
| 6 | Tonhão chama pro churrasco na véspera do trabalho | Ir e levar a Carla (💘+15 ❤️−5) | Dormir cedo (❤️+10) |
| 7 | **CONSEQUÊNCIA:** a mãe liga perguntando da namorada | Contar que tá conhecendo a Carla (💘+10 ⭐+5) | Mentir que já namora (⭐+10 💘−10) |

### Semana 2 — As oportunidades (DIAS 8–14)

| Dia | Dilema | A | B |
| --- | --- | --- | --- |
| 8 | Acha uma carteira com R$ 300 na rua | Devolver ao dono (⭐+15) | Ficar com o dinheiro (💰+20 ⭐−15) |
| 9 | Bico de fim de semana: lavar carros do prédio | Aceitar (💰+15 ❤️−5) | Recusar e ir correr (❤️+10) |
| 10 | Academia nova com promoção | Matricular (❤️+15 💰−5) | Treinar na praça de graça (❤️+5) |
| 11 | Rodrigo rouba a ideia dele na reunião | Provar na frente de todos que a ideia é dele (⭐+15 💘−5) | Deixar quieto (⭐−10) |
| 12 | Primeiro encontro com a Carla | Restaurante chique (💘+15 💰−10) | Piquenique feito por ele (💘+10 ❤️+5) |
| 13 | Vídeo dele dançando viraliza | Abraçar o meme (⭐+10 💘+5) | Pedir pra apagar (⭐−5) |
| 14 | **CONSEQUÊNCIA:** proposta de emprego melhor | Aceitar (salário maior) (💰+25 ❤️−5) | Ficar e pedir aumento (💰+10 ⭐+5) |

### Semana 3 — As complicações (DIAS 15–21)

| Dia | Dilema | A | B |
| --- | --- | --- | --- |
| 15 | Fatura do cartão chega alta | Vender o videogame e pagar (💰+10 💘−5) | Pagar o mínimo (💰−10) |
| 16 | Carla quer conhecer o apartamento | Faxina geral (vira a noite) (💘+15 ❤️−5) | Levar ela num café (💘+5 💰−5) |
| 17 | Rodrigo oferece 'investimento garantido' | Entrar (💰+10) | Recusar e avisar a turma (⭐+10) |
| 18 | Dor nas costas | Ir ao médico (❤️+15 💰−5) | Ignorar (❤️−10) |
| 19 | A ex manda 'saudade 🥺' | Bloquear e contar pra Carla (💘+15) | Responder (💘−15 ⭐−5) |
| 20 | Nutricionista do plano de saúde da empresa nova | Seguir a dieta (❤️+15 💘−5) | Só cortar o miojo (❤️+5) |
| 21 | **CONSEQUÊNCIA:** a mãe vem visitar | Apresentar a Carla (💘+15 ⭐+5) | Esconder a Carla (💘−10) |

### Semana 4 — A reta final (DIAS 22–29)

| Dia | Dilema | A | B |
| --- | --- | --- | --- |
| 22 | Sobrou dinheiro no mês | Poupança (💰+10) | Cripto do Rodrigo (💰−10 ⭐−5) |
| 23 | Corrida beneficente de 10 km | Correr (❤️+10 ⭐+10) | Só doar (💰−5 ⭐+5) |
| 24 | Chefe oferece gerência, mas teria que demitir o Tonhão | Aceitar e salvar o Tonhão em outro setor (⭐+15 💰+15 ❤️−5) | Recusar (⭐+5) |
| 25 | O 'investimento' do Rodrigo desmorona | Denunciar o Rodrigo (⭐+15) | Ficar quieto (⭐−5) |
| 26 | Aniversário do Armando | Festa no prédio (⭐+10 💰−10) | Jantar a dois com a Carla (💘+10) |
| 27 | Pedir a Carla em namoro | Pedido no terraço do prédio (💘+20 💰−5) | Esperar mais (💘−5) |
| 28 | Roupa pro reencontro | Terno sob medida (💰−10 ⭐+10) | Terno alugado (💰−5 ⭐+5) |
| 29 | Noite antes do reencontro | Dormir cedo (❤️+10) | Ensaiar o discurso (⭐+10) |

## Dia 30 — O final

**O reencontro da turma.** Armando entra no salão e cada barra é conferida diante de todo mundo. A mentira que bateu a meta ganha ✅, e a que não bateu vira ❌, quando o Rodrigo expõe a verdade no microfone.

- **4 ✅ →** "Ele conseguiu": a turma inteira aplaude e o Rodrigo passa vergonha (o melhor final)
- **3 ✅ →** "Quase": uma mentira é descoberta, mas ele sai de cabeça erguida
- **1 ou 2 ✅ →** "Desmascarado": o Rodrigo humilha o Armando, mas alguém inesperado o defende
- **0 ✅ ou alguma barra em 0 →** final trágico-cômico: ele foge pela janela do banheiro

O episódio termina, como sempre, com 2 opções: **"Temporada 2? A) Continuar com o Armando · B) Começar com um personagem novo"**.

## Por que prende

- O público vê na hora o efeito da escolha dele nas barras.
- Os Dias de Consequência mostram que escolhas antigas importam, e quem perdeu um episódio quer voltar para entender.
- O risco de zerar uma barra gera torcida e briga nos comentários.
