"""Texto da narração do vídeo do Sukuna, com marcações de tempo para as cenas.

{nome:Palavra} marca uma palavra cuja hora de início vira T.k["nome"] (as cenas usam pra sincronizar ações).
Cada parágrafo é uma cena. A legenda é dividida por frase (3–10 palavras), como na animação de referência.
Usado por tools/timing_provisorio_sukuna.py (tempo estimado) e tools/build_sukuna.py (tempo real da narração).
"""
import re

# (cena, capítulo na tela ou None, texto marcado)
PARS = [
    ("s1-abertura", None,
     "Como o {light1:Light} perdeu pro {near1:Near} e pro {mello1:Mello}, | se ele era mais {inteligente:inteligente} que os dois? | "
     "A {resposta:resposta} é que ele nunca enfrentou os {dois1:dois} ao mesmo tempo... | até ser {tarde:tarde} demais."),
    ("s2-herdeiros", "O HERDEIRO DIVIDIDO",
     "O {l2:L} deixou dois {herdeiros:herdeiros}. | O {near2:Near} pensava como o L, | {frio:frio} e paciente. | O {mello2:Mello} agia como o L, | "
     "{impulsivo:impulsivo} e corajoso. | {separados:Separados}, nenhum dos dois vencia o Light. | E o próprio Near {admitiu:admitiu} isso."),
    ("s3-erro", "O ERRO DO DEUS",
     "{entao:Então}, onde o Light {errou:errou}? | Ele {confiou:confiou} demais. | Pra não sujar as {maos:mãos}, | entregou o {caderno3:caderno} ao {mikami3:Mikami}, | "
     "um fiel que agia {sozinho:sozinho}. | Pela primeira vez, o {plano:plano} do Light | dependia de alguém que ele não {controlava:controlava}."),
    ("s4-keys", None,
     "{rapidinho:Rapidinho}: no meu servidor do {discord:Discord} | tem {keys:keys} aleatórias, vários outros {itens:itens}, | "
     "e eu ainda {ensino:ensino} a fazer vídeos como este. | O link tá na {bio:bio}."),
    ("s5-sacrificio", "O SACRIFÍCIO",
     "Aí entrou o {mello5:Mello}. | Ele {sequestrou:sequestrou} a {takada:Takada}, | a porta-voz do {kira:Kira}, | e {forcou:forçou} o Light a agir. | "
     "O Mello {morreu:morreu} nesse dia... | mas {obrigou:obrigou} o {mikami5:Mikami} | a ir buscar o caderno {verdadeiro:verdadeiro}, | escondido num {cofre:cofre} de banco."),
    ("s6-falso", "O CADERNO FALSO",
     "Foi tudo que o {near6:Near} precisava. | Ele {seguiu:seguiu} o Mikami, | {achou:achou} o caderno | e {trocou:trocou} as {paginas:páginas} por falsas. | "
     "No galpão {yellow:Yellow} Box, | o Light {esperou:esperou} os nomes serem {escritos:escritos}... | e {ninguem:ninguém} morreu."),
    ("s7-fim", "YELLOW BOX",
     "O Light {riu:riu}, | tentou {fugir:fugir}, | {implorou:implorou}. | No {fim:fim}, o {ryuk:Ryuk} {escreveu:escreveu} o {nome:nome} dele, | como tinha {prometido:prometido} no primeiro dia."),
    ("s8-juntos", None,
     "O Light {venceu1:venceu} o Near. | {venceu2:Venceu} o Mello. | Mas {perdeu:perdeu} pros dois {juntos:juntos}."),
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
