"""Confere se o plano de dilemas permite chegar com as 4 barras no máximo (70+)
e se o caminho não é óbvio (sempre A, sempre B, ou "a opção mais boazinha" não chegam).

Uso: python3 tools/balance_plan.py
"""
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
import importlib  # noqa: E402

# python3 tools/balance_plan.py          -> série do Armando
# python3 tools/balance_plan.py craque   -> série do Biel
_mod = importlib.import_module("plan_craque" if len(sys.argv) > 1 and sys.argv[1] == "craque" else "plan_chat")
PLAN = _mod.PLAN
K = getattr(_mod, "KEYS", "mhlr")
START = getattr(_mod, "START", (20, 30, 20, 30))
NAMES = getattr(_mod, "NAMES", ["dinheiro", "saude", "amor", "reputacao"])


def apply(s, e):
    return tuple(max(0, min(100, s[i] + e.get(K[i], 0))) for i in range(4))


def run(choose):
    s = START
    for d in sorted(PLAN):
        s = apply(s, PLAN[d][choose(d)][1])
    return s


states = {START: ""}
for d in sorted(PLAN):
    new = {}
    for s, path in states.items():
        for c, opt in zip("AB", PLAN[d][1:]):
            n = apply(s, opt[1])
            new.setdefault(n, path + c)
    states = new
best = max(states, key=lambda s: (min(s), sum(s)))
ok = [s for s in states if min(s) >= 70]
print("melhor final:", dict(zip(NAMES, best)))
print("finais diferentes com tudo >= 70:", len(ok), "de", len(states))
rnd = random.Random(1)
hits = sum(min(run(lambda d: 1 + rnd.randint(0, 1))) >= 70 for _ in range(20000))
print(f"votando aleatório, chance de tudo >= 70: {hits / 200:.1f}%")
for nome, f in [("sempre A", lambda d: 1), ("sempre B", lambda d: 2),
                ("sempre a opção que mais soma na hora", lambda d: 1 if sum(PLAN[d][1][1].values()) >= sum(PLAN[d][2][1].values()) else 2)]:
    s = run(f)
    print(f"{nome}: {s} -> {'chega' if min(s) >= 70 else 'NÃO chega'}")
