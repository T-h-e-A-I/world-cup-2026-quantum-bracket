"""
Match prediction model.

Everything is driven by Elo. From the Elo gap we build a Poisson goals model,
and from that single model we derive EVERY quantity consistently:

  - advance probability (knockout: regulation result + 50/50 on a draw -> shootout)
  - most-likely exact scoreline
  - expected goals for each side
  - a confidence score (how decisive the tie is)

This keeps "who advances", "predicted goals" and "confidence" mutually consistent.

Swapping in a Kaggle / HuggingFace trained model later means only replacing
`advance_prob` + `score_model` here — the bracket engine and UI are untouched.
"""
import math

# --- tunable parameters -------------------------------------------------------
ELO_DIV = 400.0      # standard Elo scale
GOALS_PER_ELO = 130.0  # ~130 Elo points of edge ≈ 1 goal of supremacy
BASE_TOTAL = 2.5     # baseline combined expected goals in a knockout match
MAX_GOALS = 9        # truncate Poisson tails for the scoreline grid


def _poisson(k, lam):
    return math.exp(-lam) * lam ** k / math.factorial(k)


def goal_rates(elo_i, elo_j):
    """Expected goals (lambda) for i and j from the Elo gap."""
    sup = (elo_i - elo_j) / GOALS_PER_ELO
    sup = max(-3.0, min(3.0, sup))
    lam_i = max(0.18, BASE_TOTAL / 2 + sup / 2)
    lam_j = max(0.18, BASE_TOTAL / 2 - sup / 2)
    return lam_i, lam_j


def match(elo_i, elo_j):
    """Return a full prediction dict for i (perspective team) vs j."""
    lam_i, lam_j = goal_rates(elo_i, elo_j)
    pi = [_poisson(k, lam_i) for k in range(MAX_GOALS + 1)]
    pj = [_poisson(k, lam_j) for k in range(MAX_GOALS + 1)]

    p_win = p_draw = 0.0
    best_p, best_score = -1.0, (0, 0)
    for a in range(MAX_GOALS + 1):
        for b in range(MAX_GOALS + 1):
            p = pi[a] * pj[b]
            if a > b:
                p_win += p
            elif a == b:
                p_draw += p
            if p > best_p:
                best_p, best_score = p, (a, b)

    total = sum(pi) * sum(pj)                 # <1 by the truncated >MAX_GOALS tail
    advance = (p_win + 0.5 * p_draw) / total  # normalize so adv[i][j]+adv[j][i]=1
    decisiveness = abs(advance - 0.5) * 2     # 0 = coin flip, 1 = certain
    return {
        "advance": advance,
        "score": list(best_score),            # most likely exact scoreline
        "score_prob": round(best_p / total, 4),  # P(exactly this scoreline)
        "xg": [round(lam_i, 2), round(lam_j, 2)],
        "confidence": round(decisiveness * 100),
        "confidence_label": _label(decisiveness),
    }


def advance_prob(elo_i, elo_j):
    """Just the probability i eliminates j — hot path for the bracket DP."""
    lam_i, lam_j = goal_rates(elo_i, elo_j)
    pi = [_poisson(k, lam_i) for k in range(MAX_GOALS + 1)]
    pj = [_poisson(k, lam_j) for k in range(MAX_GOALS + 1)]
    p_win = p_draw = 0.0
    for a in range(MAX_GOALS + 1):
        for b in range(MAX_GOALS + 1):
            p = pi[a] * pj[b]
            if a > b:
                p_win += p
            elif a == b:
                p_draw += p
    return (p_win + 0.5 * p_draw) / (sum(pi) * sum(pj))


def _label(d):
    if d >= 0.50:
        return "High"
    if d >= 0.20:
        return "Medium"
    return "Toss-up"
