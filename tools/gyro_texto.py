"""Texto da narração do vídeo do Gyro (Hunter x Hunter), com marcações {chave:Palavra}. Mesmo formato de tools/subaru_texto.py.
Tem que bater palavra a palavra com gyro-narracao.txt (o texto que vai para o ElevenLabs)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from light_texto import MARCA, palavras, texto_limpo, frases  # noqa: F401

PARS = [
    ("g1-abertura", None,
     "Existe um {vilao:vilão} em Hunter x Hunter que quase {ninguem:ninguém} viu. | Ele nunca {lutou:lutou}, | nunca mostrou o {rosto:rosto}, | e mesmo assim muita gente acha | que ele vai ser o {ultimo:último} inimigo do {gon:Gon}. | O nome dele é {gyro:Gyro}."),
    ("g2-obra", "O CANTEIRO",
     "O Gyro cresceu num {canteiro:canteiro} de obras. | Aprendeu a misturar {cimento:cimento} e a assentar {tijolo:tijolo} | antes mesmo de aprender a {falar:falar}. | O {pai:pai} dele quase não falava. | Depois do trabalho, {bebia:bebia} até cair, | e {batia:batia} no filho. | O Gyro vivia com {medo:medo} de fazer qualquer {barulho:barulho} | que acordasse o pai."),
    ("g3-febre", "A FEBRE",
     "Mesmo assim, ele {amava:amava} o pai. | Por um motivo só. | Quando era pequeno, teve uma {febre:febre} muito forte, | e {alguem:alguém} passou a noite inteira cuidando dele. | O Gyro sempre achou que tinha sido o {pai3:pai}."),
    ("g4-verdade", "A VERDADE",
     "Aos {doze:doze} anos, | um garoto {zombou:zombou} do pai dele, | e o Gyro partiu pra {cima:cima}. | Foi aí que ele ouviu a {verdade:verdade}. | Quem cuidou dele naquela noite | foi o {vizinho:vizinho}, um velho. | E o pai tinha dito pro velho | que não se {importava:importava} se o filho {morresse:morresse}."),
    ("g5-noite", None,
     "Naquela mesma {noite:noite}, | o Gyro {matou:matou} o pai, | pegou o {dinheiro:dinheiro} dele e {fugiu:fugiu}. | E chegou a uma {conclusao:conclusão}. | Se nem o próprio pai se importava, | o {mundo:mundo} também não se importava se ele {existia:existia}. | Então ele ia {devolver:devolver} pro mundo | toda a {maldade:maldade} que recebeu."),
    ("g6-discord", None, "Quer {aprender:aprender} a fazer esses vídeos? | {link:Link} do meu {discord:Discord} na bio."),
    ("g7-ngl", "A NGL",
     "Anos depois, | ele {fundou:fundou} a {ngl:NGL}, | um país que proíbe {maquinas:máquinas} | e vive só da {natureza:natureza}. | Por fora, {paz:paz}. | Por {baixo:baixo} da terra, | o Gyro fabricava uma {droga:droga} chamada {d2:D2} | e {espalhava:espalhava} pelo mundo inteiro. | A NGL era só uma {fachada:fachada}."),
    ("g8-formigas", "AS FORMIGAS",
     "Até que as {formigas:Formigas} Quimera chegaram. | A NGL foi {tomada:tomada}, | e o Gyro foi {devorado:devorado}. | Mas ele {renasceu:renasceu} como formiga, | com todas as {memorias:memórias} de quando era humano. | E se {recusou:recusou} a servir o {rei:Rei}. | Simplesmente foi {embora:embora}."),
    ("g9a-gon", "O ESPELHO",
     "E é aqui que ele vira o {espelho:espelho} do Gon. | O pai do Gon foi {embora9:embora}, | e o Gon atravessou o {mundo9:mundo} pra encontrar ele."),
    ("g9b-gyro", None,
     "O pai do Gyro ficou do {lado:lado} dele a vida inteira, | e nunca se {importou:importou}. | Um aprendeu a {amar:amar} o mundo. | O outro decidiu se {vingar:vingar} dele."),
    ("g10-fim", "HOJE",
     "Hoje, uma das formigas, o {welfin:Welfin}, | acredita que o Gyro está {vivo:vivo}, | e foi procurar por ele na {meteoro:Cidade} Meteoro. | O mangá nunca mostrou o {rosto10:rosto} dele, | e deixou a história do Gyro em {aberto:aberto}. | Você acha que o Gyro vai ser o {ultimo10:último} vilão do Gon? | {comenta:Comenta} aí."),
]
