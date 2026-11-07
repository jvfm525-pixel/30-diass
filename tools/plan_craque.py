"""Plano de dilemas de "O Chat Faz um Craque" (DIAS 3–29).

PLAN[n] = dilema mostrado no fim do DIA n-1, cujo resultado aparece no DIA n.
Cada opção: (texto na tela, efeitos TOTAIS, nota de bastidor).
s=⚽ habilidade f=💪 físico m=💰 dinheiro c=🧠 cabeça.
Na tela, antes da votação, só aparece "MEXE COM: ..." (sem números).
"""
KEYS = "sfmc"
ICONS = {"s": "⚽", "f": "💪", "m": "💰", "c": "🧠"}
NAMES = ["habilidade", "fisico", "dinheiro", "cabeca"]
START = (45, 20, 0, 30)  # depois do DIA 2 (B venceu no DIA 1)
PLAN = {
 3:  ("Como chegar no amistoso do bairro vizinho (8 km)", ("Ir correndo", dict(f=10, s=-5), "chega cansado"), ("Pedir carona pro Kauã", dict(c=-10, s=10), "joga descansado, mas o Kauã filma tudo")),
 4:  ("Primeiro amistoso: faltou goleiro", ("Continuar no ataque", dict(s=10, f=-5), ""), ("Ir pro gol", dict(c=10, m=5), "SURPRESA: o time paga o lanche do herói")),
 5:  ("A Vó Cida oferece sociedade nos salgados", ("Vender no intervalo dos jogos", dict(m=15, f=-5), ""), ("Vender geladinho na saída da escola", dict(m=10, c=5), "")),
 6:  ("A chuteira emprestada rasga", ("Jogar descalço, 'pé de pedra'", dict(s=5, f=-5), ""), ("Trocar o álbum de figurinhas por uma chuteira usada", dict(s=10, c=-5), "era o álbum do pai")),
 7:  ("CONSEQUÊNCIA: a Duda quer postar o vídeo do chapéu", ("Deixar postar", dict(c=10, m=10), "SURPRESA: viraliza e uma loja dá uma camisa"), ("Não postar", dict(c=-5), "")),
 8:  ("Bico pra juntar dinheiro", ("Entregador de bicicleta", dict(m=15, f=5, s=-5), ""), ("Ajudante no lava-jato", dict(m=10, c=5), "")),
 9:  ("O Kauã desafia pro 1x1 valendo a chuteira dourada", ("Aceitar", dict(s=10, c=-10), "ARMADILHA: ganha o 1x1, mas a chuteira não serve e o bairro zoa"), ("Propor valendo um lanche", dict(m=5, c=5), "")),
 10: ("Treino às 5h na escadaria do morro", ("Ir", dict(f=15, c=-5), ""), ("Dormir e treinar à noite", dict(f=5, c=5), "")),
 11: ("Comida da semana", ("Dieta da Vó: feijão, arroz e ovo", dict(f=10), ""), ("Shake de graça do personal do Kauã", dict(f=15, c=-10), "o Kauã posta 'ajudando os pobres'")),
 12: ("O Professor Bigode quer ele de volante", ("Aceitar a posição nova", dict(s=5, c=10), ""), ("Insistir em ser atacante", dict(s=10, c=-5), "")),
 13: ("Show de talentos da escola (prêmio de R$ 50)", ("Fazer embaixadinha", dict(m=15, c=5), ""), ("Levar a Vó Cida pra cantar", dict(m=10, c=10), "SURPRESA: a Vó arrasa")),
 14: ("CONSEQUÊNCIA: a Vó Cida fica doente", ("Ficar cuidando dela", dict(c=10, s=-5), ""), ("Treinar e a Duda cuida", dict(s=10, c=-10), "")),
 15: ("Um 'empresário' pede R$ 100 pra 'garantir a vaga'", ("Pagar", dict(m=-15), "GOLPE"), ("Pesquisar o nome dele antes", dict(c=10), "")),
 16: ("O tornozelo começa a doer", ("Gelo e repouso", dict(f=5, s=-5), ""), ("Fisioterapia no posto de saúde", dict(f=10, c=-5), "fila de 4 horas")),
 17: ("A padaria do bairro quer patrocinar", ("Usar a camisa 'Pão Quente do Seu Zé'", dict(m=20, c=-5, f=-5), "a zoeira no bairro + pão de graça todo dia"), ("Recusar e esperar algo melhor", dict(c=5, m=5), "SURPRESA: a loja de esportes oferece um bico")),
 18: ("Festa na laje na véspera do treino", ("Ir", dict(c=10, f=-10), ""), ("Dormir cedo", dict(f=5), "")),
 19: ("Final da copa da várzea: pênalti decisivo", ("Bater", dict(s=15, c=10, f=-15), "faz o gol… e torce o tornozelo comemorando em cima do alambrado"), ("Passar a vez pro amigo", dict(s=5, c=5), "dá a assistência no rebote")),
 20: ("O bairro quer fazer uma vaquinha pra ele", ("Aceitar", dict(m=20, c=-5), "a pressão aumenta"), ("Dar aula de futebol pras crianças", dict(m=10, c=10), "")),
 21: ("CONSEQUÊNCIA: o 'empresário' volta", ("Encarar, com a Duda gravando", dict(c=15), ""), ("Fugir do assunto", dict(c=-10), "")),
 22: ("Chuteira nova antes da peneira", ("Comprar", dict(m=-20, s=15), ""), ("Manter a de fita 'da sorte'", dict(c=10), "")),
 23: ("Treino com o Zé Foguete, lenda do bairro", ("Treino pesado", dict(s=15, f=-5), ""), ("Treino leve de técnica", dict(s=10, c=5), "")),
 24: ("O Kauã se machuca no treino", ("Ajudar o rival", dict(c=15), ""), ("Aproveitar e treinar mais", dict(s=10, c=-10), "")),
 25: ("A Vó Cida inventa uma simpatia", ("Fazer a simpatia", dict(c=10), ""), ("Treino extra de pênalti", dict(s=5, f=5), "")),
 26: ("O que treinar por último", ("Jogo coletivo", dict(s=10, c=5), ""), ("Drible solo", dict(s=10, f=5), "")),
 27: ("Como chegar à peneira", ("Ônibus às 4h da manhã", dict(f=-5, m=-5, c=5), ""), ("Carona com o Kauã", dict(c=-10, f=5), "")),
 28: ("A noite anterior", ("Dormir cedo", dict(f=10), ""), ("Assistir lances de craques", dict(c=10), "")),
 29: ("O aquecimento na frente do olheiro", ("Tentar a bicicleta", dict(s=20, c=-5), "arriscado"), ("Jogar seguro", dict(s=5, c=5), "")),
}
