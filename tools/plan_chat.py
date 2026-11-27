"""Plano de dilemas da série O Chat Controla (DIAS 5–29).

Cada opção: (texto na tela, efeitos TOTAIS, nota de bastidor).
m=dinheiro h=saúde l=amor r=reputação. Os números NUNCA aparecem na tela antes
da votação: o cartão mostra só "MEXE COM: ..." e o resultado é revelado no
episódio seguinte. A nota explica surpresas e efeitos atrasados.
"""
PLAN = {
 5:  ("Celular quebrado", ("Parcelar em 12x", dict(m=-15, r=10), ""), ("Consertar com durex", dict(r=-5), "")),
 6:  ("Tonhão chama pro churrasco na véspera do trabalho", ("Ir e chamar a Carla", dict(l=15, h=-5), "acorda destruído"), ("Dormir cedo", dict(h=10), "")),
 7:  ("CONSEQUÊNCIA: a mãe liga perguntando da namorada", ("Contar que tá conhecendo a Carla", dict(l=10, r=5), ""), ("Dizer que já namora", dict(r=10, l=-10), "a mãe conta pra família toda; a Carla descobre pelo Instagram da tia")),
 8:  ("Tonhão pede R$ 50 emprestados pra consertar a moto", ("Emprestar", dict(m=10, r=5), "SURPRESA no dia 15: ele devolve R$ 100"), ("Negar", dict(r=-5), "Tonhão fica chateado")),
 9:  ("Bico de fim de semana: lavar os carros do prédio", ("Aceitar", dict(m=15, h=-5), ""), ("Recusar e ir correr", dict(h=10), "")),
 10: ("Começar a se exercitar", ("Academia com promoção", dict(h=15, m=-5), ""), ("Futebol com o Tonhão aos sábados", dict(h=10, r=5), "")),
 11: ("Rodrigo rouba a ideia dele na reunião", ("Confrontar na frente de todos", dict(r=-5, l=10), "SURPRESA: o chefe acha barraco, mas a Carla vê o vídeo e acha corajoso"), ("Mandar e-mail pro chefe com as provas", dict(r=10), "")),
 12: ("Primeiro encontro com a Carla", ("Restaurante chique", dict(l=15, m=-10), ""), ("Piquenique feito por ele", dict(l=10, h=5), "")),
 13: ("Vídeo dele dançando viraliza", ("Abraçar o meme", dict(r=10, l=5), ""), ("Pedir pra apagar", dict(r=-5, m=10), "SURPRESA: a marca da música paga pelos direitos do vídeo")),
 14: ("CONSEQUÊNCIA: proposta de emprego melhor", ("Aceitar (salário maior)", dict(m=25, h=-5), ""), ("Ficar e pedir aumento", dict(m=10, r=5), "")),
 15: ("Fatura do cartão chega alta", ("Vender o videogame", dict(m=10, l=-5), "ele jogava com a Carla"), ("Hora extra no fim de semana", dict(m=15, h=-10, l=-5), "")),
 16: ("Carla quer conhecer o apartamento", ("Faxina geral (vira a noite)", dict(l=15, h=-5), ""), ("Levar ela num café", dict(l=5, m=-5), "")),
 17: ("Rodrigo oferece um 'investimento garantido'", ("Entrar", dict(m=-15), "ARMADILHA: rende no começo, desmorona no dia 25"), ("Recusar e avisar a turma", dict(r=10), "")),
 18: ("Dor nas costas", ("Ir ao médico", dict(h=15, m=-5), ""), ("Fazer yoga com a Carla", dict(h=10, l=5), "")),
 19: ("A ex manda 'saudade 🥺'", ("Bloquear sem contar pra Carla", dict(l=5), ""), ("Mostrar a mensagem pra Carla", dict(l=15, h=-5), "briga feia, depois reconciliam mais fortes")),
 20: ("Nutricionista do plano de saúde", ("Seguir a dieta rígida", dict(h=15, l=-5), "fica mal-humorado"), ("Cozinhar junto com a Carla", dict(h=5, l=10), "")),
 21: ("CONSEQUÊNCIA: a mãe vem visitar", ("Apresentar a Carla", dict(l=15, r=5), ""), ("Almoçar na casa da mãe sozinho", dict(h=10, m=10), "volta com um mês de marmitas")),
 22: ("Sobrou dinheiro no mês", ("Poupança", dict(m=10), ""), ("A cripto do grupo da turma", dict(m=20, r=-5), "SURPRESA: a cripto sobe, mas o Rodrigo se gaba de ter indicado")),
 23: ("Corrida beneficente de 10 km", ("Correr", dict(h=10, r=10), ""), ("Doar e torcer", dict(m=-5, r=5, l=5), "a Carla corre e ele torce com cartaz")),
 24: ("Chefe oferece a gerência, mas ele teria que demitir o Tonhão", ("Aceitar e transferir o Tonhão de setor", dict(r=15, m=15, h=-5), ""), ("Indicar o Tonhão pra vaga", dict(r=10, l=5), "")),
 25: ("CONSEQUÊNCIA: o 'investimento' do Rodrigo desmorona", ("Denunciar o Rodrigo", dict(r=15, l=-5), "a turma se divide"), ("Ajudar a turma a recuperar o dinheiro", dict(r=10, m=-5), "")),
 26: ("Aniversário do Armando", ("Festa no prédio", dict(r=10, m=-10), ""), ("Jantar a dois com a Carla", dict(l=10), "")),
 27: ("Pedir a Carla em namoro", ("Pedido no terraço do prédio", dict(l=20, m=-5), ""), ("Pedir no reencontro, na frente da turma", dict(l=15, r=5), "risco: a turma inteira assiste")),
 28: ("Roupa pro reencontro", ("Terno sob medida", dict(m=-10, r=10), ""), ("Terno do pai, ajustado pela costureira", dict(m=-5, r=5, l=5), "")),
 29: ("Noite antes do reencontro", ("Dormir cedo", dict(h=10), ""), ("Ensaiar o discurso", dict(r=10), "")),
}
