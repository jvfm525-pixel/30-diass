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

## Semana 1 — O fundo do poço

| Dia | Dilema | A | B |
| --- | --- | --- | --- |
| 1 | Chefe pede hora extra no sábado | Aceitar (💰+15 ❤️−10) | Recusar (❤️+10 ⭐−10) |
| 2 | Geladeira vazia, R$ 20 no bolso | Miojo a semana toda (💰+10 ❤️−10) | Mercado de verdade (💰−10 ❤️+10) |
| 3 | Carla bate na porta pedindo açúcar, casa imunda | Abrir assim mesmo (💘+10 ⭐−10) | Fingir que não tá em casa (💘−5) |
| 4 | O celular quebra | Parcelar um novo em 12x (💰−15 ⭐+10) | Consertar com durex (⭐−5) |
| 5 | Tonhão chama pra churrasco na véspera do trabalho | Ir (⭐+10 ❤️−10) | Ficar dormindo (❤️+10 ⭐−5) |
| 6 | Acha uma carteira na rua com R$ 300 | Devolver (⭐+20) | Ficar com o dinheiro (💰+20 ⭐−15) |
| 7 | **CONSEQUÊNCIA:** balanço da semana + a mãe liga: "e a namorada?" | Mentir que tem namorada (⭐+10) | Contar a verdade (❤️+5 ⭐−5) |

## Semana 2 — As oportunidades

| Dia | Dilema | A | B |
| --- | --- | --- | --- |
| 8 | Entrevista num emprego melhor, no horário do trabalho | Faltar e ir (⭐−10, chance de 💰) | Não ir |
| 9 | Carla chama pra sair no dia do jogo com o Tonhão | Sair com a Carla (💘+15 ⭐−5) | Ir ao jogo (⭐+10 💘−5) |
| 10 | Academia na esquina com promoção | Matricular (💰−10 ❤️+15) | Correr na rua de graça (❤️+5) |
| 11 | Rodrigo rouba a ideia dele na reunião | Confrontar na frente de todos (⭐±15, arriscado) | Contar pro chefe em particular (⭐+5) |
| 12 | Primeiro encontro com a Carla | Restaurante caro (💰−15 💘+15) | Piquenique no parque (💘+10) |
| 13 | Vídeo dele dançando bêbado viraliza | Virar influencer (⭐+20 ❤️−5) | Pedir pra apagar (⭐−5) |
| 14 | **CONSEQUÊNCIA:** a entrevista do dia 8 deu certo (ou ele foi pego faltando) | Aceitar o emprego longe (💰+25 ❤️−15) | Ficar e pedir aumento (💰+10) |

## Semana 3 — As complicações

| Dia | Dilema | A | B |
| --- | --- | --- | --- |
| 15 | A fatura do cartão chega altíssima | Pagar o mínimo (💰−5, a dívida cresce) | Vender o videogame (💰+10 ❤️−5) |
| 16 | Carla quer conhecer o apartamento dele | Faxina a noite toda (❤️−10 💘+15) | Levar ela pra casa do Tonhão (💘−5 ⭐+5) |
| 17 | Rodrigo oferece entrar num "investimento garantido" | Entrar (💰+20 agora… risco no dia 26) | Recusar (⭐+5) |
| 18 | Dor forte nas costas | Ir ao médico (💰−10 ❤️+15) | Ignorar (❤️−15) |
| 19 | A ex manda mensagem: "saudade 🥺" | Responder (💘−15 se a Carla descobrir) | Bloquear (💘+10) |
| 20 | O dono da carteira do dia 6 aparece | Contar tudo (⭐+10 ou −10) | Negar (⭐−20 se tiver câmera) |
| 21 | **CONSEQUÊNCIA:** a mãe vem visitar e quer conhecer a "namorada" | Apresentar a Carla (💘±20, arriscado) | Confessar a mentira (⭐−10 ❤️+5) |

## Semana 4 — As grandes apostas

| Dia | Dilema | A | B |
| --- | --- | --- | --- |
| 22 | Sobrou um dinheiro | Apostar tudo na cripto do Rodrigo (💰 ×2 ou 0) | Poupança (💰+5) |
| 23 | Carla recebe proposta de trabalho em outra cidade | Pedir pra ela ficar (💘±15) | Apoiar ela ir (💘+10, ela some por uns dias) |
| 24 | Corrida beneficente no bairro | Correr os 10 km (❤️+10 ⭐+10, se a ❤️ estiver baixa ele desmaia) | Só doar (💰−10 ⭐+5) |
| 25 | O chefe oferece o cargo de gerente, mas ele teria que demitir o Tonhão | Aceitar (💰+30 ⭐−20) | Recusar (⭐+15) |
| 26 | O "investimento" do Rodrigo desmorona (quem entrou no dia 17 perde) | Denunciar o Rodrigo (⭐+15) | Ficar quieto e tentar recuperar (💰±) |
| 27 | Aniversário do Armando | Festa grande (💰−20 ⭐+15) | Jantar só com quem importa (💘+10 ❤️+5) |
| 28 | Momento de pedir a Carla em namoro | Pedido público e exagerado (💘±25) | Pedido simples a dois (💘+15) |
| 29 | Última noite antes do fim | Gastar tudo numa viagem (💰−30 ❤️+15 💘+10) | Guardar pro futuro (💰+10) |

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
