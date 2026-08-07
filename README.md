# ProofRank

ProofRank is an agentic submission truth auditor for hackathons, accelerators, grant programs, and sponsor reviews.

Given a public event or project URL, it gathers evidence about submissions and produces a ranked judge queue with proof receipts for accessibility, demo completeness, originality, sponsor/tool usage, source availability, business value, and eligibility risk.

## Why This Exists

Hackathon judges and sponsor teams need to know which projects are real, accessible, original, and genuinely using partner technology. Manual review is slow and inconsistent. ProofRank turns public web evidence into a source-backed review packet.

## Bright Data Fit

Bright Data is the load-bearing evidence layer in the intended live workflow:

- The fallback app implements server-side collection through Bright Data's Request API.
- Remote MCP or CLI search is prepared to discover submission pages, demo links, GitHub repos, presentations, and public comparison targets.
- Web Scraper API or Web Unlocker is the planned path for dynamic or protected pages.
- SERP checks title, team, and problem-statement similarity.
- Every receipt stores trace state, provider, byte count, and content hash so sponsor reviewers can separate executed Bright Data evidence from planned, claimed, direct, or failed collection.

The local app also includes demo fixtures for reliable judging if credentials are not available.

## Native.builder Compliance

The competition submission should be built and published primarily through native.builder. This repository contains:

- Product design and implementation plan.
- A local fallback/reference app.
- Native.builder prompt and iteration instructions.
- Bright Data setup notes.
- Submission copy, pitch deck outline, and demo script.

The native.builder build prompt is in `submission/native-builder-prompt.md` once the implementation package is generated.

## Local Run

Start the static app:

```bash
python3 -m http.server 4173 --directory app
```

Open:

```text
http://127.0.0.1:4173
```

## Local Tests

```bash
npm run test
```

## Live Bright Data Run

Copy `.env.example` to `.env.local` and fill the real credentials. `.env.local`
is ignored by Git.

Check the hosted Bright Data MCP token:

```bash
npm run brightdata:mcp-smoke
```

Run one bounded reviewer collection through Bright Data once the token is valid:

```bash
npm run live:smoke -- https://github.com/OWNER/REPO https://DEPLOYED_APP_URL
npm run live:event-smoke -- https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits
```

Validate real GitHub/demo ingestion without Bright Data spend while token access is being fixed. Direct mode is useful for debugging, but it does not count as executed Bright Data proof. The lablab event page may return HTTP 403 in direct mode, which is why the event-level path is designed for Bright Data/Web Unlocker.

```bash
npm run live:smoke:direct -- https://github.com/OWNER/REPO https://DEPLOYED_APP_URL
```

Start the local API used by the browser UI:

```bash
npm run live:server
```

Then open the app, switch collection mode to `Bright Data live`, keep the live
API endpoint as `http://127.0.0.1:8787/api/review-project`, and add the real
GitHub repo plus deployed app URL. `Run review` calls the sibling
`/api/review-event` endpoint to collect live event submission cards.

The full verifier also starts a temporary static server and runs a smoke test:

```bash
bash scripts/verify.sh
```

## Public Static Fallback

This repository includes a GitHub Pages workflow at `.github/workflows/pages.yml`.
It deploys only the `app/` directory, so the public fallback contains the working
ProofRank dashboard without submission notes, private scratch files, or saved
hackathon HTML snapshots.

Public repo:

```text
https://github.com/Vishwa-docs/proofrank-ai-factory
```

Public fallback app:

```text
https://vishwa-docs.github.io/proofrank-ai-factory/
```

Public release assets:

```text
https://github.com/Vishwa-docs/proofrank-ai-factory/releases/tag/proofrank-submission-v1
```

The native.builder URL remains the required primary submission URL. Use the
GitHub Pages URL as a backup proof-of-work link or public reference if the
native.builder publish flow is still account-gated.

## Current Status

Built and verified:

- Dependency-free dashboard app in `app/`
- Deterministic scoring, parser, claim ledger, trace provenance, and export tests
- Executed-vs-planned trace scoring so sponsor fit is capped below "Bright strong" until the selected project has an executed Bright Data trace
- Submission Cockpit that separates required final-submission gates from competitive polish checks
- Originality Radar with similar-project overlap and Bright Data prior-art queries
- Native.builder build prompt in `submission/native-builder-prompt.md`
- Bright Data setup and submission copy in `submission/`
- Demo video source assets can be generated with `scripts/create_demo_video.sh`
- Operator handoff for account-gated final steps in `submission/operator-handoff.md`

Refresh demo screenshots and video:

```bash
npm run demo:assets
bash scripts/create_demo_video.sh
```

Design and implementation plan:

- `docs/superpowers/specs/2026-08-07-proofrank-design.md`
- `docs/superpowers/plans/2026-08-07-proofrank-implementation.md`
- `research/bright-data-readiness.md`

Account-gated work still requiring the team owner:

- Authorize the Native.builder X/Privy login flow
- Apply the `AIFACTORY26` Builder Plan promo code
- Add a valid Bright Data API key server-side after claiming `aiaccess50`
- Run one Bright Data-backed project audit so the receipt has an executed sponsor trace
- Publish the native.builder app URL and paste it into the lablab.ai submission
