"""Texto da narração do vídeo do Sukuna, com marcações de tempo para as cenas.

{nome:Palavra} marca uma palavra cuja hora de início vira T.k["nome"] (as cenas usam pra sincronizar ações).
Cada parágrafo é uma cena. A legenda é dividida por frase (3–10 palavras), como na animação de referência.
Usado por tools/timing_provisorio_sukuna.py (tempo estimado) e tools/build_sukuna.py (tempo real da narração).
"""
import re

# (cena, capítulo na tela ou None, texto marcado)
PARS = [
    ("s1-abertura", None,
     "Por que o {sukuna1:Sukuna} {abandonou:abandonou} o corpo do {yuji1:Yuji} | e ficou com o do {megumi1:Megumi}? | "
     "A {resposta:resposta} começa bem {antes:antes} do que parece."),
    ("s2-olhar", "O PRIMEIRO OLHAR",
     "{quando:Quando} o Sukuna {assumiu:assumiu} o Yuji pela primeira vez, | no {reformatorio:reformatório}, ele {lutou:lutou} contra o {megumi2:Megumi} | "
     "e enxergou ali um {potencial:potencial} enorme. | A {partir:partir} desse dia, | nunca mais tirou os {olhos:olhos} daquele {garoto:garoto}."),
    ("s3-jaula", "A JAULA",
     "O {detalhe:detalhe} é que o corpo do Yuji | nunca foi uma {casa:casa} pro Sukuna. | Era uma {jaula:jaula}. | "
     "O Yuji conseguia {prender:prender} ele lá {dentro:dentro}, | e o próprio Sukuna {admitiu:admitiu} isso."),
    ("s4-sombras", "AS DEZ SOMBRAS",
     "{entao:Então}, por que logo o {megumi4:Megumi}? | Por causa das {dez:Dez} {sombras:Sombras}, | a {tecnica:técnica} que {nasceu:nasceu} no corpo dele. | "
     "E {junto:junto} dela vem o {mahoraga1:Mahoraga}, | o {shikigami:shikigami} que se {adapta:adapta} a qualquer {ataque:ataque}."),
    ("s5-keys", None,
     "{rapidinho:Rapidinho}: no meu servidor do {discord:Discord} | tem {keys:keys} aleatórias, vários outros {itens:itens}, | "
     "e eu ainda {ensino:ensino} a fazer vídeos como este. | O link tá na {bio:bio}."),
    ("s6-pacto", "O PACTO",
     "No {capitulo:capítulo} {c212:212}, | o Sukuna {ativou:ativou} o {pacto:pacto} de um {minuto:minuto} | que tinha {arrancado:arrancado} do Yuji, | "
     "{cortou:cortou} um {dedo:dedo} | e {obrigou:obrigou} o Megumi a {engolir:engolir}. | {trocou:Trocou} de corpo como quem muda de {casa2:casa}... | "
     "sem pagar o {aluguel:aluguel}."),
    ("s7-banho", "O BANHO",
     "{mas:Mas}, pra não ganhar outra {jaula2:jaula}, | ele precisava {afundar:afundar} a {alma:alma} do Megumi. | "
     "E {escolheu:escolheu} o caminho mais {cruel:cruel}: | {matou:matou} a {irma:irmã} dele, a {tsumiki:Tsumiki}, | {possuida:possuída} pela {yorozu:Yorozu}, | "
     "{usando:usando} o corpo do {proprio:próprio} {megumi7:Megumi}."),
    ("s8-manual", "O MANUAL",
     "E pra ele {valeu:valeu} a pena. | Foi {vendo:vendo} o {mahoraga2:Mahoraga} se {adaptar:adaptar} | que o Sukuna {aprendeu:aprendeu} a {cortar:cortar} o próprio {espaco:espaço} | "
     "e {atravessou:atravessou} o {infinito:Infinito} do {gojo:Gojo}. | Nas {palavras:palavras} dele: | \"{eu:eu} tinha um ótimo {manual:manual}\"."),
    ("s9-chave", None,
     "O {yuji9:Yuji} era a {prisao:prisão}. | O {megumi9:Megumi} foi a {chave:chave}."),
]

MARCA = re.compile(r"\{(\w+):([^}]+)\}")


def palavras(texto):
    """Lista de (palavra, chave ou None) na ordem do texto."""
    out = []
    pos = 0
    limpo = []
    for m in MARCA.finditer(texto):
        limpo.append((texto[pos:m.start()], None))
        limpo.append((m.group(2), m.group(1)))
        pos = m.end()
    limpo.append((texto[pos:], None))
    for trecho, chave in limpo:
        ws = [w for w in trecho.split() if w != "|"]
        for i, w in enumerate(ws):
            out.append((w, chave if (chave and i == 0) else None))
    return out


def texto_limpo(texto):
    return " ".join(w for w in MARCA.sub(lambda m: m.group(2), texto).split() if w != "|")


def frases(texto):
    """Frases de legenda (3–10 palavras), divididas à mão com | no texto."""
    return [" ".join(p.split()) for p in MARCA.sub(lambda m: m.group(2), texto).split("|") if p.strip()]


if __name__ == "__main__":
    for cena, cap, tx in PARS:
        print(cena, cap)
        for f in frases(tx):
            print("   ", f)
