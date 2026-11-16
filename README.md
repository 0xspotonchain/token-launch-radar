# Token Launch Radar

[![make.fun](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/0xspotonchain/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/0xspotonchain/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01)

An entry for the [make.fun](https://make.fun) bounty **"Build the best token launch radar"** (`token-radar-01`, $1,325, closes 2026-12-14 10:00 UTC).

## What it is

A sealed snapshot of every protocol DefiLlama tracks goes in; a ranked board of the protocols that still record no token comes out, ranked by what their launch would be worth — plus a static web dashboard showing the board, a detail view for each protocol, and the steps to farm it.

- **178 ranked rows**: the snapshot's 40-protocol watchlist, plus 138 pre-token protocols below the $50M watchlist floor found by the same rule.
- **No wrapped, staked or bridged products**: they are someone else's token in another form, not a launch waiting to happen. Exchanges and versioned pools are out too.
- **Live tokens stay separate**: protocols that already trade are shown with the market's own value (market cap), never mixed into the ranked board.
- **The dashboard is static and offline**: no framework, no network, no fetch. It renders from `data.js`, written by the same run that writes `board.json`.

## The value model (radar-2)

Implied value follows only from the snapshot's own figures. No protocol name is special-cased; the same function scores every row.

```
implied = TVL × 0.30 × (1 + clamped 7-day growth × 0.60) × maturity
maturity = 0.65 + 0.35 × min(age_days, 730) / 730   (unknown age counts as 180 days)
growth clamped to −50% … +150%
```

- **Base** — TVL × 0.30: the value already locked is the anchor for what a launch would be worth.
- **Growth** — 7-day TVL change, weighted 0.60: momentum moves the value, but a single hot week cannot run away with it.
- **Maturity** — a protocol that has run longer with no token has more accrued launch value.

The dashboard states these constants and its sandbox lets the reader change the base multiple and growth weight and watch the board re-rank from the same figures.

## Farm plans

Every row carries a six-step farm plan derived from the protocol's own record (category, chains, TVL, age): a fresh wallet, the category's action with capital sized by TVL tier ($50–$500), a weekly qualifying action, a hold of 45–90 days, a verify-before-you-claim step, and a farm log. Each step states its cost and time. DYOR: verify every step on the protocol's own channels, never pay a fee to claim, never share a seed phrase.

## Run it

Node.js 22.18 or later, standard library only — nothing to install.

```sh
# With the sealed snapshot mounted at /input (the grader's layout):
node main.ts

# Locally, against the kit's snapshot:
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <path-to-snapshot.json>
```

`main.ts` writes `board.json`, `data.js`, `dashboard/`, `screenshots/` and `dossier.json` to the output directory, then exits. Two runs over the same snapshot produce identical bytes.

To view the dashboard locally, serve the output directory over HTTP (any static server) and open `dashboard/index.html`. Deep links: `#detail=<slug>` opens one protocol, `#cat=<category>` and `#chain=<chain>` filter, `#sort=<key>` sorts, `#live` shows the Live tokens view.

## Layout

| Path | What it is |
| --- | --- |
| `main.ts` | Entry point: reads the snapshot, writes the board, data, dashboard, screenshots and dossier |
| `lib/model.ts` | The value model, the board builder, farm plans, snapshot parsing |
| `vendor/makefun-board.ts` | make.fun's dossier library, copied from the kit as-is |
| `dashboard/` | The static page: `index.html`, `app.css`, `app.js` (no network, no external assets) |
| `screenshots/` | Three screenshots of the dashboard: the board, a detail view, a filtered view |
| `SUBMISSION-CHECKLIST.md` | Step-by-step: repo, badges, transcripts, submission |

## License

MIT — see [LICENSE](LICENSE).

## Built with

Built with [Muse](https://muse.ai) — deco's AI agent.
