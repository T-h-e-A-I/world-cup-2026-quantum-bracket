# Roadmap / TODO

Ideas to implement **based on how people respond** after launch. Roughly ordered by
expected virality-per-effort. Nothing here is committed work — pick from it as signal comes in.

## Setup (do once, before/at launch)
- [ ] football-data.org token → repo secret `FOOTBALL_DATA_TOKEN`; enable Settings → Actions →
      "Allow GitHub Actions to create and approve pull requests". Then trigger the
      `Update live results` workflow manually and confirm the free tier exposes competition `WC`
      for 2026 — if not, swap the source to API-Football's free tier.
- [ ] Decide on a custom domain. If bought: add it in Vercel and set
      `NEXT_PUBLIC_SITE_URL=https://yourdomain` so OG cards + canonicals go absolute.
- [ ] Logo decision (still open): `web/public/image copy.png` is the **official FIFA WC26 emblem**
      (trademarked) — using it as the site logo is a takedown/IP risk. Options: keep the current
      custom mark, use the emblem anyway (accept risk), or a trophy-accent middle path.

## High-leverage if sharing takes off
- [ ] **Dynamic per-scenario OG image** — a rich preview for *any* shared bracket (`?r=…`), not just
      the 32 team pages. Needs one serverless OG function → would mean dropping pure static export
      (or a tiny separate edge function). Do this if shared links get traction.
- [ ] **Bracket battles / leaderboard** — "build the most likely bracket" or "predict the champion",
      with a shared scoreboard. Strongest retention loop, but needs a backend (Vercel KV / Supabase).
- [ ] **Dedicated project social account** (X / FB page, *not* personal) wired to auto-post the daily
      "collapse" as results land — e.g. "ARGENTINA OUT — 280M realities just collapsed." Trigger from
      the same results update. Keeps the personal feed clean; milestone posts > daily noise.

## Quick wins
- [ ] Show the Doctor Strange framing on **partial** brackets too (currently only at 31/31) — e.g.
      compare "1 in N so far" to 14,000,605 once a few picks are in, to make it more discoverable.
- [ ] **"Chaos vs Chalk" share** — let the cursed bracket (already a button) generate its own
      shareable card/post; "the most cursed 2026 World Cup, 1 in [astronomical]" is very Reddit/X-able.
- [ ] Sharper per-context share copy (team page: "1 in N to win"; finished bracket brag line).
- [ ] Short demo GIF/video for the README and launch posts.

## Launch
- [ ] One strong personal launch post (human story + Doctor Strange hook + screenshot/GIF).
- [ ] "Show HN" + relevant subreddits (r/soccer, r/dataisbeautiful) on day one.

## Maybe / later
- [ ] Embeddable bracket widget (iframe) for blogs/news.
- [ ] Pre-render `/matchup` for popular pairings (SEO long-tail).
- [ ] Swap the model to a Kaggle/HuggingFace-trained predictor (engine layer is already isolated).
