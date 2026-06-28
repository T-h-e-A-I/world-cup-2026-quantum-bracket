"""
Exact bracket probability engine.

Core table: winsub[i][L] = probability that team i is the winner of the
size-2^L subtree that contains it.
  L=0 -> 1 (it is in the tournament)
  L=1 -> won its Round-of-32 match (reached Round of 16)
  L=2 -> won Round of 16 (reached Quarterfinal)
  L=3 -> reached Semifinal
  L=4 -> won its half (reached Final)
  L=5 -> champion

Recurrence (i in a subtree, S = its sibling sub-subtree):
  winsub[i][L] = winsub[i][L-1] * Σ_{j in S} winsub[j][L-1] * P(i beats j)
"""
from bracket import N, NAMES, ELO, meet_level
from model import advance_prob

L_MAX = 5  # 2^5 = 32


def _adv_matrix():
    """adv[i][j] = P(i eliminates j) once they actually face each other."""
    elos = [ELO[NAMES[i]] for i in range(N)]
    return [[advance_prob(elos[i], elos[j]) if i != j else 0.0
             for j in range(N)] for i in range(N)]


def compute():
    adv = _adv_matrix()
    winsub = [[0.0] * (L_MAX + 1) for _ in range(N)]
    for i in range(N):
        winsub[i][0] = 1.0

    for L in range(1, L_MAX + 1):
        block, half = 1 << L, 1 << (L - 1)
        for s in range(0, N, block):
            left = range(s, s + half)
            right = range(s + half, s + block)
            for i in left:
                opp = sum(winsub[j][L - 1] * adv[i][j] for j in right)
                winsub[i][L] = winsub[i][L - 1] * opp
            for j in right:
                opp = sum(winsub[i][L - 1] * adv[j][i] for i in left)
                winsub[j][L] = winsub[j][L - 1] * opp
    return winsub, adv


def reach(winsub, i):
    return {
        "r16": winsub[i][1], "qf": winsub[i][2], "sf": winsub[i][3],
        "final": winsub[i][4], "champion": winsub[i][5],
    }


def prob_meet(winsub, i, j):
    """Probability i and j actually play each other, and the round."""
    L = meet_level(i, j)
    p = winsub[i][L - 1] * winsub[j][L - 1]
    return p, L
