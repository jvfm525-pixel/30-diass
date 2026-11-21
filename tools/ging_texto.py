"""Texto da narração do vídeo do Ging, com marcações {chave:Palavra} (hora de início vira T.k["chave"]).
Cada parágrafo é uma cena; | divide as frases de legenda. Mesmo formato de tools/light_texto.py."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from light_texto import MARCA, palavras, texto_limpo, frases  # noqa: F401

PARS = [
    ("s1-abertura", None,
     "Por que o {ging1:Ging} {abandonou:abandonou} o {gon1:Gon}, | se ele é um dos {maiores:maiores} Hunters do mundo? | "
     "E não, | não foi falta de {amor:amor}."),
    ("s2-lenda", "O PAI LENDÁRIO",
     "Pra {entender:entender}, | você precisa saber quem é o Ging. | Ele passou no {exame:exame} Hunter com {doze:doze} anos, | "
     "{restaurou:restaurou} ruínas que ninguém conseguia achar | e virou Hunter de duas {estrelas:estrelas}. | "
     "O próprio {netero:Netero} dizia | que ele estava entre os {cinco:cinco} maiores | usuários de {nen:Nen} do mundo."),
    ("s3-ilha", "A ILHA BALEIA",
     "E mesmo assim, | deixou o filho ainda {bebe:bebê} | com a prima, a {mito:Mito}, | na Ilha {baleia:Baleia}... | e {sumiu:sumiu}. | "
     "O Ging não foi comprar {cigarro:cigarro}. | Ele foi {construir:construir} uma ilha inteira."),
    ("s4-pistas", "A CAIXA",
     "Anos {depois:depois}, | o Gon conhece o {kite:Kite}, aluno do pai, | que conta quem ele era de verdade. | "
     "E na casa da Mito, | o Gon acha uma {caixa:caixa} | que só abria com a {aura:aura} dele. | "
     "Dentro, uma {fita:fita}, | um {anel:anel} | e o {cartao:cartão} de memória do {greed:Greed} Island, | o jogo que o Ging {criou:criou} com os amigos. | "
     "Na fita, | o Ging diz que não quer {encontrar:encontrar} o filho. | E quando tentaram ouvir o {resto:resto}, | a voz dele se {apagou:apagou} sozinha, com Nen."),
    ("s5-discord", None, "{link:Link} do meu {discord:Discord} tá na bio."),
    ("s6-porque", "O CAMINHO",
     "Então por que {fugir:fugir}? | Porque o Ging não sabe ser {pai:pai}. | Ele só sabe ser {hunter6:Hunter}. | "
     "Em vez de ficar, | ele deixou um caminho de {pistas6:pistas}, | e cada uma obrigava o Gon | a ficar mais {forte:forte}."),
    ("s7-arvore", "A ÁRVORE DO MUNDO",
     "Quando os dois finalmente se {encontram:encontram}, | no topo da {arvore:Árvore} do Mundo, | o Ging não pede {desculpa:desculpa}. | "
     "Ele pergunta se o Gon quer saber | quem é a {mae:mãe}. | E o Gon responde | que a mãe dele é a {mito7:Mito}. | "
     "Aí o Ging fala pra ele | aproveitar os {desvios:desvios} do caminho, | porque é ali que estão | as coisas mais {valiosas:valiosas}."),
    ("s8-fim", None,
     "O Ging nunca quis ser | o {destino:destino} do Gon. | Ele queria ser o {motivo:motivo} | dele {partir:partir}."),
]

if __name__ == "__main__":
    for cena, cap, tx in PARS:
        print(cena, cap)
        for f in frases(tx):
            print("   ", f)
