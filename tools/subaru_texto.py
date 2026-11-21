"""Texto da narração do vídeo do Subaru (Re:Zero), com marcações {chave:Palavra}. Mesmo formato de tools/gojo_texto.py."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from light_texto import MARCA, palavras, texto_limpo, frases  # noqa: F401

PARS = [
    ("s1-abertura", None,
     "Imagina {morrer:morrer}... | e {acordar:acordar} de novo, | minutos {antes:antes}. | E não poder {contar:contar} isso pra ninguém. | Nem pra quem você mais {ama:ama}."),
    ("s2-volta", "VOLTAR DA MORTE",
     "O {subaru:Subaru} Natsuki caiu em outro {mundo:mundo} | com um único {poder:poder}: | quando {morre:morre}, ele {volta:volta} no tempo. | Ele {lembra:lembra} de tudo. | Os {outros:outros}, não. | Pra eles, aquilo {nunca:nunca} aconteceu."),
    ("s3-mao", "A MÃO",
     "Na primeira vez que ele tentou contar pra {emilia3:Emilia}, | o tempo {parou:parou}. | O mundo ficou {cinza:cinza}. | E uma {mao:mão} de sombra entrou no {peito:peito} dele... | e {apertou:apertou} o coração. | Toda {vez:vez} que ele tenta, | a mão {volta3:volta}."),
    ("s4-preco", "O PREÇO",
     "E {piora:piora}. | Às vezes a mão não aperta o coração {dele:dele}. | Aperta o de quem está {ouvindo:ouvindo}. | Numa das voltas, | quem {morreu:morreu} foi a {emilia4:Emilia}."),
    ("s5-bruxa", "A BRUXA",
     "Essa mão é da {bruxa:Bruxa} da Inveja, | a {satella:Satella}. | A teoria mais aceita é simples: | {inveja:inveja}. | Ela não quer {dividir:dividir} o Subaru com ninguém. | Só ela pode {saber:saber} o que ele {carrega:carrega}."),
    ("s6-discord", None, "Quer {aprender:aprender} a fazer esses vídeos? | {link:Link} do meu {discord:Discord} na bio."),
    ("s7-echidna", "A EXCEÇÃO",
     "Só uma pessoa conseguiu {ouvir:ouvir}: | a {echidna:Echidna}, a Bruxa da Ganância. | No {castelo:castelo} dos sonhos dela, | longe do {alcance:alcance} da Satella, | o Subaru {falou:falou} pela primeira vez. | E, pela primeira vez, | alguém {sabia:sabia}."),
    ("s8-heidegger", "SÓ DELE",
     "O filósofo {heidegger:Heidegger} escreveu | que ninguém pode {morrer8:morrer} no lugar de outra pessoa. | A morte é a coisa mais {sua:sua} que existe. | O Subaru vive isso ao pé da {letra:letra}: | ele já morreu {dezenas:dezenas} de vezes, | e cada morte é só {dele8:dele}. | Ninguém {lembra8:lembra}. | Ninguém sabe o quanto {custou:custou}."),
    ("s9-fim", None,
     "Talvez o {castigo:castigo} não seja morrer. | É {salvar:salvar} todo mundo... | e continuar {sozinho:sozinho}. | Se você pudesse {voltar9:voltar} no tempo, | mas nunca contar pra ninguém... | você {voltaria:voltaria}? | {comenta:Comenta} aí, | e me {segue:segue} pra mais."),
]
