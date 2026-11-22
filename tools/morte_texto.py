"""Texto da narração do vídeo do Demônio da Morte (Chainsaw Man), com marcações {chave:Palavra}. Mesmo formato de tools/gyro_texto.py.
Tem que bater palavra a palavra com o roteiro de ROTEIRO-MORTE.md (o texto que foi para o ElevenLabs, sem as tags)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from light_texto import MARCA, texto_limpo, frases  # noqa: F401
from light_texto import palavras as _palavras


def palavras(texto):
    """Como light_texto.palavras, mas pontuação solta depois de uma marca ("{x:x}...", "{x:x},") gruda na palavra anterior,
    para a contagem bater com frases() (senão as legendas escorregam uma palavra a cada pontuação)."""
    out = []
    for w, k in _palavras(texto):
        if out and not any(c.isalnum() for c in w):
            out[-1] = (out[-1][0] + w, out[-1][1])
        else:
            out.append((w, k))
    return out

PARS = [
    ("m1-gancho", None,
     "Em {csm:Chainsaw} Man, existe um {demonio:demônio} mais forte que todos os {outros:outros}... | e ele passou a história inteira {escondido:escondido} do lado do {denji:Denji}. | {spoiler:Spoiler} do mangá, hein."),
    ("m2-regra", "A REGRA",
     "A {regra:regra} desse mundo é simples: | quanto mais as pessoas têm {medo:medo} de alguma coisa, | mais {forte:forte} fica o demônio dela. | Tem gente que não tem medo de {arma:arma}, | de {escuro:escuro} ou de {altura:altura}. | Mas {todo:todo} mundo, em qualquer lugar e em qualquer época, | tem medo de {morrer:morrer}."),
    ("m3-cavaleiros", "OS CAVALEIROS",
     "Por isso, o Demônio da {morte:Morte} é o demônio mais forte que existe. | Ela é a irmã mais {velha:velha} da {makima:Makima}, | da {yoru:Yoru} e do Demônio da {fome:Fome}: | os Quatro {cavaleiros:Cavaleiros} do Apocalipse."),
    ("m4-profecia", "A PROFECIA",
     "E a profecia de {nostradamus:Nostradamus} diz que, | em {julho:julho} de 1999, | ela vai {descer:descer} à Terra, | acabar com a {humanidade:humanidade} | e começar a {era:Era} dos Demônios. | E o {pior:pior}: esse poder acorda {sozinho:sozinho}. | Basta o medo da morte {explodir:explodir} no mundo... | e ela {mata:mata} todo mundo, mesmo {inconsciente:inconsciente}."),
    ("m5-discord", None, "Quer {aprender:aprender} a fazer esses vídeos? | {link:Link} do meu {discord:Discord} na bio."),
    ("m6-fami", "A FAMI",
     "Agora vem a parte que ninguém {esperava:esperava}. | Ela estava na {escola:escola} do Denji o tempo todo. | Era a {fami:Fami}, | a menina calma que vivia {comendo:comendo} | e dizia ser o Demônio da {fome6:Fome}."),
    ("m7-poderes", "OS PODERES",
     "Ela {matanahora:mata} na hora, | {ressuscita:ressuscita} os mortos | e {come:come} outros demônios vivos | pra transformar em {fantoches:fantoches}. | Até um Medo {primordial:Primordial}, | o Demônio da {queda:Queda}, virou {servo:servo} dela. | E ela fez isso com a própria {irma:irmã}."),
    ("m8-oca", "A MORTE NÃO MORRE",
     "Mas ela não {queria:queria} acabar com a humanidade. | Ela ama a {comida:comida} dos humanos. | Então tentou se {matar:matar}: | tirou todos os {orgaos:órgãos} do próprio corpo... | e continuou {viva:viva}. | Porque a morte não {naomorre:morre}."),
    ("m9-plano", "O PLANO",
     "E, se um dia {morresse:morresse}, | outro Demônio da Morte {nasceria:nasceria}. | Um que talvez não gostasse nem um pouco da {gente:gente}. | Por isso ela deixou o {chainsaw:Chainsaw} Man e a {yoru9:Yoru} | cada vez mais {fortes:fortes}: | pra que um dia alguém conseguisse {matarela:matar} ela."),
    ("m10-fim", "O FIM",
     "No fim, o {pochita:Pochita} {devorou:devorou} a Morte | e {apagou:apagou} a morte do mundo. | E era exatamente isso que a {yoru10:Yoru} queria: | um mundo onde {ninguem:ninguém} morre... | e a {guerra:guerra} nunca acaba. | A morte só {voltou:voltou} a existir | quando o próprio Chainsaw Man foi {apagado:apagado} da história."),
    ("m11-pergunta", None,
     "Então, o que dá mais {medo11:medo}: | um mundo {com:com} o Demônio da Morte... | ou um mundo {sem:sem} ela? | {comenta:Comenta} aí."),
]
