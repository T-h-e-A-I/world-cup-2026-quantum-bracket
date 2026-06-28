# 🌌 WC26 Superposition

**Every 2026 FIFA World Cup reality, at once.**

All **2,147,483,648** possible knockout brackets exist in superposition, each with an
*exact* probability — and the wavefunction **collapses** as real results come in.

No Monte-Carlo guessing: because the Round-of-32 bracket is fixed, every number on the
site is computed exactly with a dynamic-programming pass over the bracket tree.

| | |
|---|---|
| **Superposition** | Title favorites, most-probable finals, the single likeliest reality, and a live counter of how many realities remain. |
| **Collapse the Bracket** | Click winners (real or imagined) and watch every probability re-weight instantly. Each result halves the realities left. Shareable via URL. |
| **My Team** | Round-by-round odds, the most-likely path to the final, and all **1,024** final scenarios (64 routes × 16 opponents) with predicted scores and confidence. |
| **Will They Meet?** | Any two teams can collide in exactly one round — see where, how likely, and the predicted result. |
| **The Math** | The full Elo → Poisson → exact-DP pipeline, explained. |

## How it works

```
engine/ (Python)            web/ (Next.js + TypeScript)
─────────────────           ───────────────────────────
Elo ratings                 live bracket DP (superposition + collapse)
   ↓                           ↑  reads
Poisson goal model          model.json  ← committed
   ↓                        results.json ← maintainer updates as matches finish
advance-probability matrix
   ↓  emits
src/data/model.json
```

- **Model layer (Python, slow-moving):** team strength + the pairwise match model
  (win probability, predicted scoreline, confidence). Today it's World-Football-Elo →
  Poisson. Swap in a model trained on Kaggle, or a Hugging Face match-outcome model —
  the bundle shape and the whole UI stay identical.
- **Bracket layer (TypeScript, live in browser):** the exact superposition math and its
  collapse, conditioned on whatever results exist. Runs in well under a millisecond.

## Run locally

```bash
# 1. (optional) regenerate the model bundle
cd engine && python3 build_data.py      # writes web/src/data/model.json

# 2. the web app
cd web && npm install && npm run dev     # http://localhost:3000
```

Build a static export (deploys anywhere):

```bash
cd web && npm run build                  # outputs web/out/
```

## Updating results (collapsing reality)

As each match finishes, add it to [`web/src/data/results.json`](web/src/data/results.json):

```json
{ "L1-2": 2 }   // node "L1-2" (Match 77, France/Sweden) → winner = team id 2 (France)
```

Node ids are `L{level}-{startIndex}` (level 1 = Round of 32 … 5 = Final); team ids are
indices into `model.json`'s `teams` array. Commit and push — Vercel redeploys and the
superposition collapses for everyone.

## Deploy

Hosted on Vercel. **Root Directory = `web`** (the Next app lives in a subfolder).
Static export — no server required.

## Tuning the predictions

Edit Elo ratings in [`engine/bracket.py`](engine/bracket.py) and re-run
`python3 build_data.py`. Model parameters (goals-per-Elo, baseline goals) live in
[`engine/model.py`](engine/model.py).

---

MIT © Awesh Islam · built in public 🌌
