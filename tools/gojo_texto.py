"""Texto da narração do vídeo do Gojo (Reino da Prisão), com marcações {chave:Palavra}. Mesmo formato de tools/grisha_texto.py."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from light_texto import MARCA, palavras, texto_limpo, frases  # noqa: F401

PARS = [
    ("s1-abertura", None,
     "Esta é a {historia:história} do homem mais {forte:forte} do mundo... | que foi {vencido:vencido} | por uma {lembranca:lembrança}."),
    ("s2-shibuya", "SHIBUYA",
     "Em {shibuya:Shibuya}, o Gojo tinha acabado de {derrotar:derrotar} | {centenas:centenas} de maldições. | Aí {apareceu:apareceu} alguém | com o {rosto:rosto} do Suguru {geto:Geto}. | O {melhor:melhor} amigo dele... | que ele mesmo tinha {matado:matado}."),
    ("s3-instante", "UM INSTANTE",
     "Por um {instante:instante}, | a cabeça dele {voltou:voltou} | pros anos de {escola:escola} | ao lado do {amigo3:amigo}. | E esse instante {bastou:bastou}. | O Reino da {prisao3:Prisão} se {fechou:fechou}."),
    ("s4-caixa", "O REINO DA PRISÃO",
     "Uma {caixa:caixa} feita dos {restos:restos} | de um {monge:monge}, o {genshin:Genshin}. | Lá {dentro:dentro}, | nem o {gojo4:Gojo} consegue usar | {energia:energia} amaldiçoada."),
    ("s5-chaves", "AS CHAVES",
     "Mas por que ele ficou {tanto:tanto} tempo lá? | Só {duas:duas} ferramentas | abriam a porta de {tras:trás} da prisão: | a {lanca:Lança} Invertida do Céu | e a {corda:Corda} Negra. | E as duas tinham {sumido:sumido}... | nas mãos do {proprio:próprio} Gojo."),
    ("s6-anjo", "O ANJO",
     "A {saida:saída} foi o {anjo:Anjo}, | uma feiticeira com uma técnica | que {apaga:apaga} qualquer {tecnica:técnica}."),
    ("s7-discord", None, "{link:Link} do meu {discord:Discord} tá na bio."),
    ("s8-apego", "APEGO",
     "E o {budismo:budismo}, | a religião daquele monge, | ensina que o que {prende:prende} a gente | não são {correntes:correntes}. | É o {apego:apego}. | O Gojo podia {vencer:vencer} qualquer um... | menos o que {sentia:sentia} pelo {amigo8:amigo}."),
    ("s9-fim", None,
     "Na {historia9:história}, foram {semanas:semanas}. | Na vida {real:real}, | foram mais de {tres:três} anos, | e cento e trinta e um {capitulos:capítulos}. | "
     "Se você pudesse {rever:rever} alguém do seu {passado:passado} | por um instante... | quem {seria:seria}? | {comenta:Comenta} aí, | e me {segue:segue} pra mais."),
]
