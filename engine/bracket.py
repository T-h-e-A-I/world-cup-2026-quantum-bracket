"""
2026 Men's FIFA World Cup — Round of 32 knockout bracket.

The bracket is FIXED (seeded), so every probability in this app is computed
EXACTLY (no Monte-Carlo) via a dynamic-programming pass over the bracket tree.

The 32 teams are laid out as a single-elimination binary tree:
  - adjacent pairs (0,1),(2,3),... meet in the Round of 32
  - their winners meet in the Round of 16, and so on up to the Final.
Indices 0..15 are the LEFT half of the bracket, 16..31 the RIGHT half.

Leaf order is taken directly from the bracket image (match numbers in comments).
"""

# name, flag emoji, World-Football-Elo rating (approx, mid-2026 — EDIT THESE to retune)
TEAMS = [
    # ---------------- LEFT HALF (indices 0..15) ----------------
    ("Germany",              "\U0001F1E9\U0001F1EA", 1935),  # M74
    ("Paraguay",             "\U0001F1F5\U0001F1FE", 1730),  # M74
    ("France",               "\U0001F1EB\U0001F1F7", 2085),  # M77
    ("Sweden",               "\U0001F1F8\U0001F1EA", 1785),  # M77
    ("South Africa",         "\U0001F1FF\U0001F1E6", 1700),  # M73
    ("Canada",               "\U0001F1E8\U0001F1E6", 1760),  # M73
    ("Netherlands",          "\U0001F1F3\U0001F1F1", 1965),  # M75
    ("Morocco",              "\U0001F1F2\U0001F1E6", 1845),  # M75
    ("Portugal",             "\U0001F1F5\U0001F1F9", 1990),  # M83
    ("Croatia",              "\U0001F1ED\U0001F1F7", 1865),  # M83
    ("Spain",                "\U0001F1EA\U0001F1F8", 2080),  # M84
    ("Austria",              "\U0001F1E6\U0001F1F9", 1790),  # M84
    ("United States",        "\U0001F1FA\U0001F1F8", 1795),  # M81
    ("Bosnia & Herzegovina", "\U0001F1E7\U0001F1E6", 1740),  # M81
    ("Belgium",              "\U0001F1E7\U0001F1EA", 1905),  # M82
    ("Senegal",              "\U0001F1F8\U0001F1F3", 1815),  # M82
    # ---------------- RIGHT HALF (indices 16..31) ----------------
    ("Brazil",               "\U0001F1E7\U0001F1F7", 2025),  # M76
    ("Japan",                "\U0001F1EF\U0001F1F5", 1835),  # M76
    ("Ivory Coast",          "\U0001F1E8\U0001F1EE", 1770),  # M78
    ("Norway",               "\U0001F1F3\U0001F1F4", 1805),  # M78
    ("Mexico",               "\U0001F1F2\U0001F1FD", 1800),  # M79
    ("Ecuador",              "\U0001F1EA\U0001F1E8", 1825),  # M79
    # England has no ISO flag — use the GB-ENG subdivision tag sequence
    ("England", "\U0001F3F4\U000E0067\U000E0062\U000E0065\U000E006E\U000E0067\U000E007F", 1985),  # M80
    ("Congo DR",             "\U0001F1E8\U0001F1E9", 1700),  # M80
    ("Argentina",            "\U0001F1E6\U0001F1F7", 2105),  # M86
    ("Cabo Verde",           "\U0001F1E8\U0001F1FB", 1650),  # M86
    ("Australia",            "\U0001F1E6\U0001F1FA", 1720),  # M88
    ("Egypt",                "\U0001F1EA\U0001F1EC", 1750),  # M88
    ("Switzerland",          "\U0001F1E8\U0001F1ED", 1820),  # M85
    ("Algeria",              "\U0001F1E9\U0001F1FF", 1760),  # M85
    ("Colombia",             "\U0001F1E8\U0001F1F4", 1880),  # M87
    ("Ghana",                "\U0001F1EC\U0001F1ED", 1720),  # M87
]

NAMES = [t[0] for t in TEAMS]
FLAGS = {t[0]: t[1] for t in TEAMS}
ELO = {t[0]: t[2] for t in TEAMS}

N = len(TEAMS)  # 32
ROUNDS = ["Round of 32", "Round of 16", "Quarterfinal", "Semifinal", "Final"]
# level L (subtree size 2^L) -> name of the match played to win that subtree
LEVEL_ROUND = {1: "Round of 32", 2: "Round of 16", 3: "Quarterfinal",
               4: "Semifinal", 5: "Final"}


L_MAX_LEVEL = 5  # 2^5 = 32 teams


def meet_level(i, j):
    """Smallest level L such that i and j share the size-2^L subtree (their LCA)."""
    L = 1
    while (i >> L) != (j >> L):
        L += 1
    return L


# Official FIFA match numbers per bracket node, keyed by (level, block-start).
# Level 1 = Round of 32 ... level 5 = Final. Taken from the bracket image.
MATCH_NO = {
    (1, 0): 74, (1, 2): 77, (1, 4): 73, (1, 6): 75, (1, 8): 83, (1, 10): 84,
    (1, 12): 81, (1, 14): 82, (1, 16): 76, (1, 18): 78, (1, 20): 79, (1, 22): 80,
    (1, 24): 86, (1, 26): 88, (1, 28): 85, (1, 30): 87,
    (2, 0): 89, (2, 4): 90, (2, 8): 93, (2, 12): 94,
    (2, 16): 91, (2, 20): 92, (2, 24): 95, (2, 28): 96,
    (3, 0): 97, (3, 8): 98, (3, 16): 99, (3, 24): 100,
    (4, 0): 101, (4, 16): 102, (5, 0): 104,
}


def matches():
    """Every bracket node (match) bottom-up: id, level, round, slot, child node ids."""
    out = []
    for L in range(1, L_MAX_LEVEL + 1):
        block = 1 << L
        for s in range(0, N, block):
            node = {
                "id": f"L{L}-{s}", "no": MATCH_NO.get((L, s)),
                "level": L, "round": LEVEL_ROUND[L], "start": s, "size": block,
            }
            if L == 1:
                node["teams"] = [s, s + 1]            # concrete R32 participants
            else:
                half = block >> 1
                node["feeders"] = [f"L{L-1}-{s}", f"L{L-1}-{s+half}"]
            out.append(node)
    return out
