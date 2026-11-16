# Submission checklist — Token Launch Radar (make.fun `token-radar-01`)

**Bounty:** "Build the best token launch radar" — $1,325 total (1st $1,000; 2nd–5th $50; 6th–10th $25).
**Deadline: Monday 2026-12-14, 10:00 UTC (17:00 WIB).** The last submission before the deadline is final.
**Results due:** 2026-12-28 22:10 UTC. Prizes are escrowed on Solana; claim window is 30 days after results.

Muse built the code but cannot submit it: submission needs your GitHub account and your Solana wallet. Do the steps below in order. Nothing here costs money (no entry fee; signing the entry message is free).

## 0. What you need

- Your **GitHub account** (the repo goes under your login).
- A **Solana wallet** for the payout. A fresh wallet is fine — its address becomes the payout wallet. Keep its keypair file (`wallet.json`, solana-keygen JSON) on your own machine and never send it to Muse or anyone else.
- **Node.js 22.18+** on the machine that runs the make.fun CLI.
- The make.fun kit CLI: `cli/makefun.mjs` in the kit on this VM (`workspace/.jarvis/idea-executions/4a97b0e9-5b44-4d5b-bbe8-7cb89ac49617/scratch/kit/token-radar-01-kit/`). Ask Muse for a copy if you run the CLI on another machine.

## 1. Create the GitHub repo

- Create a **new public** repo named `token-launch-radar` under your GitHub login. It must be created after the competition opened (2026-11-14 10:00 UTC) — a fresh repo now satisfies this. Do not reuse an old repo.
- Push **all** the files in this folder to it: `main.ts`, `lib/`, `vendor/`, `dashboard/`, `screenshots/`, `LICENSE`, `README.md`, `SUBMISSION-CHECKLIST.md`.
- **Do not hand-edit `main.ts`, `lib/model.ts` or the dashboard files after pushing.** The transcript bundle (step 5) proves the agent wrote this code; edits you make by hand dilute that proof. If a change is needed, ask Muse to make it in-session and re-bundle.

## 2. Fix the README badges — DONE

The two badge URLs in `README.md` now use your GitHub username `0xspotonchain` (found in your mail 2026-11-16):

```
https://make.fun/badge/token-radar-01/0xspotonchain/token-launch-radar/rank.svg
https://make.fun/badge/token-radar-01/0xspotonchain/token-launch-radar/reward.svg
```

The repo check requires all three live make.fun badges in the README (the competition badge is already live). No `{owner}` placeholders remain.

## 3. Set the repo About

On the repo's GitHub page (About → gear icon):

- **Website:** `https://make.fun/bounty/token-radar-01`
- **Topics:** `makefun` (required), plus `ai-agents`, `bounties`, `trading` (recommended).

## 4. Note the commit SHA

Copy the full SHA of the pushed commit (GitHub repo page → commit history → the latest commit). The submission names this exact commit.

## 5. Bundle the transcripts — DONE (already built)

The entry must include the transcripts of the agent session that wrote this code — this is how the bounty proves the work is the agent's. **The bundle is already built and in this folder: `transcripts.tar.gz`** (296,902 bytes, sha256 `8b20ff05d60d56e33aeed51e070f05b1b9a4b4131be462d0d419d57ee25413d3`). It was built from the session that authored this code, with its token usage attached and a run record — so the entry can take a paid place.

**Do NOT push `transcripts.tar.gz` to the public repo.** It is private: keep it on the machine you submit from and pass it to the submit command in step 7. The repo gets only the files listed in step 1.

If the code changes after this bundle was built, ask Muse to rebuild it before submitting — the transcripts must match the submitted code.

## 6. Sign in to make.fun

Sign in at [make.fun](https://make.fun) with **GitHub** (same login as the repo owner) and link your **Solana wallet**. If the repo owner is not your make.fun GitHub login, the repo also needs `.makefun/owner.json` containing `{"wallet": "<your-base58-solana-address>"}` — not needed when the logins match.

## 7. Submit (before 2026-12-14 10:00 UTC)

From the machine holding your Solana keypair, with the kit CLI and the bundle from step 5:

```
node cli/makefun.mjs submit --competition token-radar-01 \
  --repo-url https://github.com/<your-username>/token-launch-radar \
  --commit <full-sha-from-step-4> \
  --title "Token Launch Radar" \
  --bundle transcripts.tar.gz \
  --keypair wallet.json
```

The CLI signs the entry message ("make.fun entry v1") with your keypair — that signature is good for 10 minutes and covers one entry; the signing wallet is the payout wallet.

**Limits:** max 5 submissions/day, 10 total per account for this competition (hard limit 20). A rejected entry still counts against the day's limit, so submit once, carefully. Do not submit the same code twice and do not submit a duplicate of another account's entry.

## 8. After submitting

- Confirm the entry shows on your make.fun profile with the right repo, commit and title.
- Results are due 2026-12-28 22:10 UTC. If the entry places, claim the USDC prize from the escrow with the same Solana wallet within 30 days of results.
- Keep the repo public and the commit untouched until results are out.

## What was already verified (2026-11-16)

- `main.ts` runs clean (exit 0) and two runs produce byte-identical output (deterministic).
- Local replica of the 7 gate checks: **all pass** — dashboard files (3 files, 32,303 bytes, no external URLs), board file (178 rows, ranks 1–178, implied values non-increasing), farm steps (6 per row, 20–600 chars), sorted-by-value, coverage (40/40 watchlist), screenshots (3 PNGs, 1440×900, 128–155 KB each), dossier byte-match.
- Screenshots were taken of this exact dashboard (board, detail view of #1 Steakhouse Financial, Risk Curators filter) and visually checked; the detail view's model breakdown matches `board.json` exactly.
- Transcript bundle built from the authoring session (54 turns, usage row attached, run record complete) — `transcripts.tar.gz` in this folder. Private: do not push it to the public repo.
