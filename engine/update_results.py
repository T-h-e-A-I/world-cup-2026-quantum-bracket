"""
Live result updater (hybrid: writes results.json; a GitHub Action opens a PR you merge).

Sources real knockout results from football-data.org and maps each finished match
to its bracket node id (L{level}-{start}) + winning team id — the exact shape the
frontend consumes from web/src/data/results.json.

Usage:
  FOOTBALL_DATA_TOKEN=xxx python engine/update_results.py        # fetch + update
  python engine/update_results.py --print                        # show fetched, don't write
  python engine/update_results.py --set 95 Argentina             # manual override by FIFA match no
  python engine/update_results.py --selftest                     # offline mapping test (no API)

Design notes:
- We only record a winner when the API reports a clear HOME/AWAY winner. Matches
  decided on penalties (reported as DRAW) are LEFT for you to enter with --set,
  so the automation never guesses. The PR review is your safety net.
- Later-round nodes resolve from earlier results, so we process level 1 -> 5 in order.
"""

import json
import os
import re
import sys
import unicodedata
import urllib.request
import urllib.error

from bracket import NAMES, MATCH_NO, matches

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS_PATH = os.path.join(ROOT, "web", "src", "data", "results.json")
SCORES_PATH = os.path.join(ROOT, "web", "src", "data", "scores.json")
API_URL = "https://api.football-data.org/v4/competitions/WC/matches"

# football-data.org names that differ from ours (normalized key -> our canonical name)
ALIASES = {
    "usa": "United States",
    "united states of america": "United States",
    "bosnia and herzegovina": "Bosnia & Herzegovina",
    "cote d ivoire": "Ivory Coast",
    "cote divoire": "Ivory Coast",
    "dr congo": "Congo DR",
    "democratic republic of congo": "Congo DR",
    "cape verde": "Cabo Verde",
}

STAGE_LEVEL = {
    "ROUND_OF_32": 1, "LAST_32": 1,
    "ROUND_OF_16": 2, "LAST_16": 2,
    "QUARTER_FINALS": 3, "QUARTER_FINAL": 3,
    "SEMI_FINALS": 4, "SEMI_FINAL": 4,
    "FINAL": 5,
}


def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = s.lower()
    for ch in "&.'-/":
        s = s.replace(ch, " ")
    return " ".join(s.split())


NAME_BY_NORM = {norm(n): n for n in NAMES}
NAME_BY_NORM.update({norm(k): v for k, v in ALIASES.items()})
ID_BY_NAME = {n: i for i, n in enumerate(NAMES)}
NODE_BY_FIFA = {no: f"L{lvl}-{s}" for (lvl, s), no in MATCH_NO.items()}
NODES = matches()
NODE_BY_ID = {n["id"]: n for n in NODES}


def team_id(api_name):
    """Map a football-data.org team name to our team id, or None if unknown."""
    return ID_BY_NAME.get(NAME_BY_NORM.get(norm(api_name or "")))


def participants(node, results):
    """The two team ids contesting a node given results so far, or None if unresolved."""
    if node["level"] == 1:
        return list(node["teams"])
    a = results.get(node["feeders"][0])
    b = results.get(node["feeders"][1])
    return [a, b] if a is not None and b is not None else None


def build_results(finished, existing, existing_scores=None):
    """Pure mapper: finished = list of {idA, idB, winner_id, level_hint, gA?, gB?}.
    Returns (results, scores). scores[node] = [goals, goals] in participant order."""
    results = dict(existing)
    scores = dict(existing_scores or {})
    for level in range(1, 6):
        nodes = [n for n in NODES if n["level"] == level]
        for m in finished:
            if m["level_hint"] not in (None, level):
                continue
            pair = {m["idA"], m["idB"]}
            for node in nodes:
                parts = participants(node, results)
                if parts and set(parts) == pair:
                    results[node["id"]] = m["winner_id"]
                    if m.get("gA") is not None and m.get("gB") is not None:
                        # gA scored by idA (home), gB by idB (away); store in participant order
                        scores[node["id"]] = [
                            m["gA"] if parts[0] == m["idA"] else m["gB"],
                            m["gA"] if parts[1] == m["idA"] else m["gB"],
                        ]
                    break
    return results, scores


def fetch_finished(token):
    """Pull finished knockout matches from the API -> normalized finished list."""
    req = urllib.request.Request(API_URL, headers={"X-Auth-Token": token})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)

    out = []
    skipped = []
    for m in data.get("matches", []):
        stage = (m.get("stage") or "").upper()
        if m.get("status") != "FINISHED" or "GROUP" in stage or stage == "THIRD_PLACE":
            continue
        ida = team_id((m.get("homeTeam") or {}).get("name"))
        idb = team_id((m.get("awayTeam") or {}).get("name"))
        winner = (m.get("score") or {}).get("winner")
        if ida is None or idb is None:
            skipped.append(f"unmapped teams in stage {stage}: "
                           f"{(m.get('homeTeam') or {}).get('name')} vs {(m.get('awayTeam') or {}).get('name')}")
            continue
        if winner == "HOME_TEAM":
            wid = ida
        elif winner == "AWAY_TEAM":
            wid = idb
        else:  # DRAW after ET -> penalties; don't guess, enter with --set
            skipped.append(f"penalties/undecided ({stage}): {NAMES[ida]} vs {NAMES[idb]} — use --set")
            continue
        ft = (m.get("score") or {}).get("fullTime") or {}
        out.append({"idA": ida, "idB": idb, "winner_id": wid,
                    "level_hint": STAGE_LEVEL.get(stage),
                    "gA": ft.get("home"), "gB": ft.get("away")})
    return out, skipped


def load_results():
    try:
        with open(RESULTS_PATH) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def write_results(results):
    ordered = {n["id"]: results[n["id"]] for n in NODES if n["id"] in results}
    with open(RESULTS_PATH, "w") as f:
        json.dump(ordered, f, indent=2)
        f.write("\n")
    return ordered


def load_scores():
    try:
        with open(SCORES_PATH) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def write_scores(scores):
    ordered = {n["id"]: scores[n["id"]] for n in NODES if n["id"] in scores}
    with open(SCORES_PATH, "w") as f:
        json.dump(ordered, f, indent=2)
        f.write("\n")
    return ordered


def summarize(results):
    for n in NODES:
        if n["id"] in results:
            w = results[n["id"]]
            print(f"  {n['round']:<13} {n['id']:<7} -> {NAMES[w]}")


def cmd_set(fifa_no, rest):
    # rest = [team words ...] optionally ending with a "W-L" score (winner's goals first)
    score = None
    if rest and re.fullmatch(r"\d+-\d+", rest[-1]):
        score = rest[-1]
        rest = rest[:-1]
    team_name = " ".join(rest)

    node_id = NODE_BY_FIFA.get(int(fifa_no))
    if not node_id:
        sys.exit(f"No bracket node for FIFA match {fifa_no}")
    results = load_results()
    parts = participants(NODE_BY_ID[node_id], results)
    if parts is None:
        sys.exit(f"{node_id} isn't resolvable yet — record its feeding matches first")
    wid = team_id(team_name)
    if wid is None or wid not in parts:
        opts = " / ".join(NAMES[p] for p in parts)
        sys.exit(f"'{team_name}' is not a participant of {node_id}. Options: {opts}")
    results[node_id] = wid
    ordered = write_results(results)

    msg = f"Set {node_id} ({NAMES[wid]})"
    if score:
        wg, lg = (int(x) for x in score.split("-"))
        loser = parts[1] if parts[0] == wid else parts[0]
        # store in participant order [parts[0] goals, parts[1] goals]
        sc = [wg, lg] if parts[0] == wid else [lg, wg]
        scores = load_scores()
        scores[node_id] = sc
        write_scores(scores)
        msg += f" {NAMES[wid]} {wg}-{lg} {NAMES[loser]}"
    print(f"{msg}. Now {len(ordered)}/31 decided.")


def main():
    args = sys.argv[1:]

    if args and args[0] == "--selftest":
        return selftest()

    if args and args[0] == "--set":
        if len(args) < 3:
            sys.exit("usage: --set <fifa_match_no> <winning team> [winnerGoals-loserGoals]")
        return cmd_set(args[1], args[2:])

    dry = args and args[0] == "--print"
    token = os.environ.get("FOOTBALL_DATA_TOKEN")
    if not token:
        print("FOOTBALL_DATA_TOKEN not set — nothing to do (no changes).")
        return

    try:
        finished, skipped = fetch_finished(token)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        print(f"API fetch failed ({e}); leaving results unchanged.")
        return

    existing = load_results()
    existing_scores = load_scores()
    results, scores = build_results(finished, existing, existing_scores)

    for s in skipped:
        print(f"  skip: {s}")

    if results == existing and scores == existing_scores:
        print(f"No change ({len(existing)}/31 decided).")
        return

    if dry:
        print("Would write:")
        summarize(results)
        return

    ordered = write_results(results)
    write_scores(scores)
    print(f"Updated results.json — {len(ordered)}/31 decided:")
    summarize(ordered)


def selftest():
    """Offline check: feed a synthetic full tournament and confirm 31 nodes resolve."""
    # Favorites-win synthetic results: in every node the lower team id "wins".
    finished = []
    results = {}
    for level in range(1, 6):
        for n in NODES:
            if n["level"] != level:
                continue
            parts = participants(n, results)
            winner = min(parts)  # arbitrary but deterministic
            results[n["id"]] = winner
            finished.append({"idA": parts[0], "idB": parts[1],
                             "winner_id": winner, "level_hint": level})
    # Now reconstruct purely through the mapper, from empty, ignoring level hints
    blind = [{**m, "level_hint": None} for m in finished]
    rebuilt, _ = build_results(blind, {})
    assert len(rebuilt) == 31, f"expected 31 nodes, got {len(rebuilt)}"
    assert rebuilt == results, "mapper did not reconstruct the synthetic bracket"
    # Alias sanity
    for a, want in [("USA", "United States"), ("Cape Verde", "Cabo Verde"),
                    ("DR Congo", "Congo DR"), ("Bosnia and Herzegovina", "Bosnia & Herzegovina")]:
        got = team_id(a)
        assert got is not None and NAMES[got] == want, f"alias {a} -> {got}"
    print("selftest OK: 31/31 nodes reconstructed; aliases resolve.")


if __name__ == "__main__":
    main()
