"""Texto da narração do vídeo do Grisha, com marcações {chave:Palavra}. Mesmo formato de tools/light_texto.py."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from light_texto import MARCA, palavras, texto_limpo, frases  # noqa: F401

PARS = [
    ("s1-abertura", None,
     "Esta é a {historia:história} de um {pai:pai} | que fez a {pior:pior} coisa da vida dele... | e não sabia direito por {que1:quê}."),
    ("s2-muralha", "O DIA DA QUEDA",
     "No dia em que a {muralha:Muralha} Maria {caiu:caiu}, | o {grisha2:Grisha} não {fugiu:fugiu}. | {correu:Correu} na direção {contraria:contrária}, | até a {capela:capela} dos Reiss."),
    ("s3-missao", "A MISSÃO",
     "Anos {antes:antes}, | o {kruger:Kruger} tinha dado a ele | o {tita:Titã} de Ataque, | e uma {missao:missão}: | tomar o Titã {fundador:Fundador} | da família {real:real}."),
    ("s4-frieda", "A RAINHA QUE NÃO LUTOU",
     "Quem tinha esse {poder:poder} | era a {frieda:Frieda} Reiss. | Ela podia {salvar:salvar} as muralhas, | mas o {juramento:juramento} do primeiro rei | {proibia:proibia} lutar."),
    ("s5-caverna", "A CAVERNA",
     "O Grisha {implorou:implorou}. | Ela se {transformou:transformou}. | Na {caverna:caverna} de cristal, | ele a {devorou:devorou}, | e matou os {filhos:filhos} do Rod."),
    ("s6-discord", None, "{link:Link} do meu {discord:Discord} tá na bio."),
    ("s7-sartre", "CONDENADO",
     "O filósofo {sartre:Sartre} escreveu | que o homem está {condenado:condenado} | a ser {livre:livre}. | O Grisha {queria:queria} | não ter {escolha:escolha}."),
    ("s8-caminhos", "QUEM EMPURROU",
     "E, de certo {jeito:jeito}, não teve. | Ele {parou:parou} ali, {chorando:chorando}. | E dentro da {memoria:memória} dele | estava o próprio {filho8:filho}, o {eren:Eren}, | dizendo: | {siga:siga} em {frente:frente}."),
    ("s9-fim", None,
     "Um pai que {comecou:começou} tudo pelo filho... | {empurrado:empurrado} pelo {filho9:filho}. | "
     "Se você pudesse {voltar:voltar} | e falar uma frase | pra alguém do seu {passado:passado}, | qual {seria:seria}? | {comenta:Comenta} aí, | e me {segue:segue} pra mais."),
]
