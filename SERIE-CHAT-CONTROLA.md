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

## Plano rebalanceado: dá pra chegar no máximo, mas o caminho não é óbvio

Depois dos DIAS 1–4 o Armando está com 💰 20 · ❤️ 30 · 💘 20 · ⭐ 30. `python3 tools/balance_plan.py` simula **todos os caminhos de votação**:

- **Dá para chegar com as 4 barras no máximo:** o melhor caminho termina com 💰 95 · ❤️ 100 · 💘 100 · ⭐ 100, e há 2.058 finais diferentes com tudo em 70+.
- **Nenhuma estratégia simples funciona:** sempre A, sempre B ou "sempre a opção que parece somar mais" não chegam. Votando no aleatório, a chance é de ~8%.

### Regras para não deixar o caminho óbvio

1. **Os números nunca aparecem antes da votação.** O cartão de cada opção mostra só **"MEXE COM: 💰 ⭐"** (quais barras estão em jogo, sem + nem −). Os números aparecem só no episódio seguinte, na cena das barras.
2. **A narração não entrega o resultado.** Ela fala do que está em jogo de forma vaga ("uma enche o bolso… a outra pode sair caro"), nunca em pontos.
3. **As duas opções parecem razoáveis.** Nada de "devolver a carteira × roubar a carteira": o público tem que discutir.
4. **Surpresas e armadilhas:** algumas escolhas que parecem ótimas cobram depois (o investimento do Rodrigo), e algumas que parecem ruins dão certo (pedir pra apagar o vídeo e a marca pagar). Elas estão marcadas como SURPRESA ou ARMADILHA na tabela abaixo, que é **só para bastidores**.
5. **Ao mudar um dilema**, rode `python3 tools/balance_plan.py` e confira que o máximo continua possível e que nenhuma estratégia simples chega lá.

*O DIA 5 já foi postado mostrando os números. Do DIA 6 em diante vale a regra 1.*

### Semana 1 — Primeiros passos (DIAS 5–7)

| Dia | Dilema | Na tela | A (bastidor) | B (bastidor) |
| --- | --- | --- | --- | --- |
| 5 | Celular quebrado | MEXE COM: 💰 ⭐ | Parcelar em 12x (💰−15 ⭐+10) | Consertar com durex (⭐−5) |
| 6 | Tonhão chama pro churrasco na véspera do trabalho | MEXE COM: ❤️ 💘 | Ir e chamar a Carla (💘+15 ❤️−5) — _acorda destruído_ | Dormir cedo (❤️+10) |
| 7 | **CONSEQUÊNCIA:** a mãe liga perguntando da namorada | MEXE COM: 💘 ⭐ | Contar que tá conhecendo a Carla (💘+10 ⭐+5) | Dizer que já namora (⭐+10 💘−10) — _a mãe conta pra família toda; a Carla descobre pelo Instagram da tia_ |

### Semana 2 — As oportunidades (DIAS 8–14)

| Dia | Dilema | Na tela | A (bastidor) | B (bastidor) |
| --- | --- | --- | --- | --- |
| 8 | Tonhão pede R$ 50 emprestados pra consertar a moto | MEXE COM: 💰 ⭐ | Emprestar (💰+10 ⭐+5) — _SURPRESA no dia 15: ele devolve R$ 100_ | Negar (⭐−5) — _Tonhão fica chateado_ |
| 9 | Bico de fim de semana: lavar os carros do prédio | MEXE COM: 💰 ❤️ | Aceitar (💰+15 ❤️−5) | Recusar e ir correr (❤️+10) |
| 10 | Começar a se exercitar | MEXE COM: 💰 ❤️ ⭐ | Academia com promoção (❤️+15 💰−5) | Futebol com o Tonhão aos sábados (❤️+10 ⭐+5) |
| 11 | Rodrigo rouba a ideia dele na reunião | MEXE COM: 💘 ⭐ | Confrontar na frente de todos (⭐−5 💘+10) — _SURPRESA: o chefe acha barraco, mas a Carla vê o vídeo e acha corajoso_ | Mandar e-mail pro chefe com as provas (⭐+10) |
| 12 | Primeiro encontro com a Carla | MEXE COM: 💰 ❤️ 💘 | Restaurante chique (💘+15 💰−10) | Piquenique feito por ele (💘+10 ❤️+5) |
| 13 | Vídeo dele dançando viraliza | MEXE COM: 💰 💘 ⭐ | Abraçar o meme (⭐+10 💘+5) | Pedir pra apagar (⭐−5 💰+10) — _SURPRESA: a marca da música paga pelos direitos do vídeo_ |
| 14 | **CONSEQUÊNCIA:** proposta de emprego melhor | MEXE COM: 💰 ❤️ ⭐ | Aceitar (salário maior) (💰+25 ❤️−5) | Ficar e pedir aumento (💰+10 ⭐+5) |

### Semana 3 — As complicações (DIAS 15–21)

| Dia | Dilema | Na tela | A (bastidor) | B (bastidor) |
| --- | --- | --- | --- | --- |
| 15 | Fatura do cartão chega alta | MEXE COM: 💰 ❤️ 💘 | Vender o videogame (💰+10 💘−5) — _ele jogava com a Carla_ | Hora extra no fim de semana (💰+15 ❤️−10 💘−5) |
| 16 | Carla quer conhecer o apartamento | MEXE COM: 💰 ❤️ 💘 | Faxina geral (vira a noite) (💘+15 ❤️−5) | Levar ela num café (💘+5 💰−5) |
| 17 | Rodrigo oferece um 'investimento garantido' | MEXE COM: 💰 ⭐ | Entrar (💰−15) — _ARMADILHA: rende no começo, desmorona no dia 25_ | Recusar e avisar a turma (⭐+10) |
| 18 | Dor nas costas | MEXE COM: 💰 ❤️ 💘 | Ir ao médico (❤️+15 💰−5) | Fazer yoga com a Carla (❤️+10 💘+5) |
| 19 | A ex manda 'saudade 🥺' | MEXE COM: ❤️ 💘 | Bloquear sem contar pra Carla (💘+5) | Mostrar a mensagem pra Carla (💘+15 ❤️−5) — _briga feia, depois reconciliam mais fortes_ |
| 20 | Nutricionista do plano de saúde | MEXE COM: ❤️ 💘 | Seguir a dieta rígida (❤️+15 💘−5) — _fica mal-humorado_ | Cozinhar junto com a Carla (❤️+5 💘+10) |
| 21 | **CONSEQUÊNCIA:** a mãe vem visitar | MEXE COM: 💰 ❤️ 💘 ⭐ | Apresentar a Carla (💘+15 ⭐+5) | Almoçar na casa da mãe sozinho (❤️+10 💰+10) — _volta com um mês de marmitas_ |

### Semana 4 — A reta final (DIAS 22–29)

| Dia | Dilema | Na tela | A (bastidor) | B (bastidor) |
| --- | --- | --- | --- | --- |
| 22 | Sobrou dinheiro no mês | MEXE COM: 💰 ⭐ | Poupança (💰+10) | A cripto do grupo da turma (💰+20 ⭐−5) — _SURPRESA: a cripto sobe, mas o Rodrigo se gaba de ter indicado_ |
| 23 | Corrida beneficente de 10 km | MEXE COM: 💰 ❤️ 💘 ⭐ | Correr (❤️+10 ⭐+10) | Doar e torcer (💰−5 ⭐+5 💘+5) — _a Carla corre e ele torce com cartaz_ |
| 24 | Chefe oferece a gerência, mas ele teria que demitir o Tonhão | MEXE COM: 💰 ❤️ 💘 ⭐ | Aceitar e transferir o Tonhão de setor (⭐+15 💰+15 ❤️−5) | Indicar o Tonhão pra vaga (⭐+10 💘+5) |
| 25 | **CONSEQUÊNCIA:** o 'investimento' do Rodrigo desmorona | MEXE COM: 💰 💘 ⭐ | Denunciar o Rodrigo (⭐+15 💘−5) — _a turma se divide_ | Ajudar a turma a recuperar o dinheiro (⭐+10 💰−5) |
| 26 | Aniversário do Armando | MEXE COM: 💰 💘 ⭐ | Festa no prédio (⭐+10 💰−10) | Jantar a dois com a Carla (💘+10) |
| 27 | Pedir a Carla em namoro | MEXE COM: 💰 💘 ⭐ | Pedido no terraço do prédio (💘+20 💰−5) | Pedir no reencontro, na frente da turma (💘+15 ⭐+5) — _risco: a turma inteira assiste_ |
| 28 | Roupa pro reencontro | MEXE COM: 💰 💘 ⭐ | Terno sob medida (💰−10 ⭐+10) | Terno do pai, ajustado pela costureira (💰−5 ⭐+5 💘+5) |
| 29 | Noite antes do reencontro | MEXE COM: ❤️ ⭐ | Dormir cedo (❤️+10) | Ensaiar o discurso (⭐+10) |

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

## Regra de cenário (pedido do público/criador)

- Nunca reaproveitar o mesmo cenário entre séries ou episódios: cada cena ganha um lugar próprio.
- Fundos sempre detalhados: objetos, profundidade (frente/meio/fundo), luz e pequenos detalhes animados. Nada de fundo liso ou só com raios.
