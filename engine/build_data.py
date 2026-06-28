"""
Emit the MODEL BUNDLE consumed by the web app: web/src/data/model.json

This is the slow-moving "physics" layer — team strengths and the pairwise match
model (win probability, predicted scoreline, confidence). The fast-moving bracket
math (superposition over all 2^31 realities, and its collapse as results come in)
runs live in TypeScript in the browser, conditioned on whatever results exist.

Today the model is Elo -> Poisson. Swap in a Kaggle / HuggingFace model later by
replacing engine/model.py — the bundle shape and the whole web app stay identical.
"""
import json
import os
from bracket import TEAMS, NAMES, ELO, N, ROUNDS, matches
from model import match, advance_prob
from engine import compute   # used only for a sanity printout

HALF = lambda i: 0 if i < 16 else 1


def build():
    elos = [ELO[NAMES[i]] for i in range(N)]

    teams = [{"id": i, "name": NAMES[i], "flag": TEAMS[i][1],
              "elo": elos[i], "half": HALF(i)} for i in range(N)]

    # adv[i][j] = P(i eliminates j) — the only thing the bracket DP needs.
    adv = [[round(advance_prob(elos[i], elos[j]), 6) if i != j else 0.0
            for j in range(N)] for i in range(N)]

    # Predicted scoreline / xG / confidence for every unordered pair (i<j), i's view.
    pairs = {}
    for i in range(N):
        for j in range(i + 1, N):
            m = match(elos[i], elos[j])
            pairs[f"{i}_{j}"] = {"score": m["score"], "xg": m["xg"],
                                 "confidence": m["confidence"],
                                 "confidenceLabel": m["confidence_label"]}

    data = {
        "meta": {
            "title": "2026 FIFA World Cup — Superposition",
            "rounds": ROUNDS,
            "realities": 2 ** (N - 1),   # number of distinct complete brackets
            "model": "World-Football-Elo → Poisson goals (neutral venue)",
        },
        "teams": teams,
        "matches": matches(),
        "adv": adv,
        "pairs": pairs,
    }

    root = os.path.dirname(os.path.dirname(__file__))
    out = os.path.join(root, "web", "src", "data", "model.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    # --- sanity printout (unconditioned champion odds) ---
    winsub, _ = compute()
    fav = sorted(range(N), key=lambda i: -winsub[i][5])[:5]
    print(f"wrote {out}  ({os.path.getsize(out)//1024} KB)")
    print(f"  realities held in superposition: {2**(N-1):,}")
    for i in fav:
        print(f"  {NAMES[i]:<12} champion {winsub[i][5]*100:5.1f}%")


if __name__ == "__main__":
    build()
