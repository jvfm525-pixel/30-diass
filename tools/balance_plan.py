"""Confere se o plano de dilemas permite chegar com as 4 barras no máximo (70+).

Simula todos os caminhos de votação a partir das barras atuais.
Uso: python3 tools/balance_plan.py
"""
import sys, random
sys.path.insert(0,'.'); from plan_chat import PLAN
K="mhlr"
def apply(s,e): return tuple(max(0,min(100,s[i]+e.get(K[i],0))) for i in range(4))
start=(20,30,20,30)
days=sorted(PLAN)
# DP: melhor "menor barra" no fim
states={start:[]}
for d in days:
    new={}
    for s,path in states.items():
        for c,(t,e) in zip("AB",PLAN[d][1:]):
            n=apply(s,e)
            if n not in new: new[n]=path+[c]
    states=new
best=max(states, key=lambda s:(min(s),sum(s)))
print("estados finais:",len(states)); print("melhor fim:",dict(zip(["💰","❤️","💘","⭐"],best)),"min",min(best))
print("caminho:","".join(states[best]))
ok=[s for s in states if min(s)>=70]; print("finais com tudo >=70:",len(ok),"de",len(states))
# votação aleatória
rnd=random.Random(1); hits=0
for _ in range(20000):
    s=start
    for d in days: s=apply(s,PLAN[d][1+rnd.randint(0,1)][1])
    hits+=min(s)>=70
print(f"chance de chegar com tudo >=70 votando aleatório: {hits/200:.1f}%")
# todos A / todos B
for opt in (1,2):
    s=start
    for d in days: s=apply(s,PLAN[d][opt][1])
    print("sempre","AB"[opt-1],s)
