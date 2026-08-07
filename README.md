# ProofRank

ProofRank is an agentic submission truth auditor for hackathons, accelerators, grant programs, and sponsor reviews.

Given a public event or project URL, it gathers evidence about submissions and produces a ranked judge queue with proof receipts for accessibility, demo completeness, originality, sponsor/tool usage, source availability, business value, and eligibility risk.

## Why This Exists

Hackathon judges and sponsor teams need to know which projects are real, accessible, original, and genuinely using partner technology. Manual review is slow and inconsistent. ProofRank turns public web evidence into a source-backed review packet.

## Bright Data Fit

Bright Data is the load-bearing evidence layer in the intended live workflow:

- The fallback app implements server-side collection through Bright Data's Request API.
- The fallback app also implements Bright Data Remote MCP collection through `scrape_as_markdown`, prior-art search through `search_engine`, and AI-ranked prior-art discovery through `discover`, with a reusable MCP client and smoke test.
- CLI commands are prepared to find submission pages, demo links, GitHub repos, presentations, and public comparison targets.
- Web Scraper API or Web Unlocker is the planned path for dynamic or protected pages.
- SERP checks title, team, and problem-statement similarity.
- Server-side live runs enforce `PROOFRANK_MAX_BRIGHTDATA_CALLS` so credentialed demos stay bounded under the user-confirmed spend cap.
- Public live backends can require `PROOFRANK_REVIEW_TOKEN`, restrict `PROOFRANK_ALLOWED_ORIGINS`, and reject URLs outside `PROOFRANK_ALLOWED_HOSTS` before Bright Data is called.
- Every receipt stores trace state, provider, byte count, and content hash so sponsor reviewers can separate executed Bright Data evidence from planned, claimed, direct, or failed collection.
- Live project reviews issue a run receipt with replay command, trace digest, and optional HMAC signature via `PROOFRANK_RECEIPT_SIGNING_SECRET`.

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
npm run brightdata:auth-check
npm run brightdata:mcp-smoke
```

Use the Remote MCP collector for live proof runs once the token is valid:

```bash
PROOFRANK_FETCH_MODE=mcp npm run live:smoke -- https://github.com/OWNER/REPO https://DEPLOYED_APP_URL
PROOFRANK_FETCH_MODE=mcp npm run live:event-smoke -- https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits
PROOFRANK_FETCH_MODE=mcp npm run live:server
```

Run one bounded reviewer collection through Bright Data once the token is valid:

```bash
npm run live:smoke -- https://github.com/OWNER/REPO https://DEPLOYED_APP_URL
npm run live:event-smoke -- https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits
```

Generate the signed final Bright Data proof receipt after the MCP smoke passes:

```bash
PROOFRANK_RECEIPT_SIGNING_SECRET=generate_a_private_value npm run final:receipt -- https://github.com/OWNER/REPO https://DEPLOYED_APP_URL
```

`final:receipt` forces MCP collection by default and fails unless the selected
project has an executed Bright Data source scrape trace, an executed
`search_engine` trace, an executed `discover` trace, a trace digest that matches
the receipt contents, and a signature verified with
`PROOFRANK_RECEIPT_SIGNING_SECRET`.

Direct debugging is available with `--allow-direct`; it writes to a `/tmp`
debug path by default and does not count as Bright Data sponsor proof.

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
`/api/review-event` endpoint to collect live event submission cards and asks the
backend for one bounded project-level follow-up when the top parsed project has
a real GitHub URL. Event intake traces remain `countsForSponsorFit: false`; the
project receipt still needs an executed Bright Data provider trace.

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
Workflow proof JSON: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/workflow-proof.json
Workflow proof screenshot: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/workflow-proof.png
```

The native.builder URL remains the required primary submission URL. Use the
GitHub Pages URL as a backup proof-of-work link or public reference if the
native.builder publish flow is still account-gated.

## Current Status

Built and verified:

- Dependency-free dashboard app in `app/`
- Deterministic scoring, parser, claim ledger, trace provenance, and export tests
- Executed-vs-planned trace scoring so sponsor fit is capped below "Bright strong" until the selected project has an executed Bright Data trace
- Bright Data Remote MCP client with initialize, tools/list, tools/call, SSE parsing, redacted auth errors, `scrape_as_markdown`, `search_engine`, `discover`, and `PROOFRANK_FETCH_MODE=mcp`
- Per-run Bright Data call budget guard with `PROOFRANK_MAX_BRIGHTDATA_CALLS`
- Live API token, CORS, and URL-host allowlist controls for public deployments
- GitHub project reviewer lane with metadata, README, tree, package, commits, releases, issues, license, demo, prior-art, and secret-risk evidence
- Evidence Route map that shows event source, repository, deployed app, Bright trace, claim ledger, and judge packet state for the selected project
- Submission Cockpit that separates required final-submission gates from competitive polish checks
- Originality Radar with similar-project overlap, Bright Data prior-art search, and Bright Data `discover` queries
- Hallmark design system files in `design.md`, `tokens.css`, and `app/tokens.css`
- Native.builder build prompt in `submission/native-builder-prompt.md`
- Bright Data setup and submission copy in `submission/`
- Live API deployment handoff in `submission/deploy-live-api.md`
- Demo video source assets can be generated with `scripts/create_demo_video.sh`
- Operator handoff for account-gated final steps in `submission/operator-handoff.md`
- Redacted Bright Data account authentication check with `npm run brightdata:auth-check`
- Server-issued run receipts with optional HMAC signatures for live project reviews
- One-command final Bright Data receipt writer at `npm run final:receipt`
- Replayable UI workflow proof artifact at `submission/workflow-proof.json`
- Machine-readable final readiness audit at `submission/final-readiness-audit.json`
- Responsive visual check covering 1440, 768, 414, 390, 375, and 320 px viewports

Refresh demo screenshots and video:

```bash
npm run demo:assets
bash scripts/create_demo_video.sh
npm run workflow:proof
npm run final:audit
```

Design and implementation plan:

- `docs/superpowers/specs/2026-08-07-proofrank-design.md`
- `docs/superpowers/plans/2026-08-07-proofrank-implementation.md`
- `research/bright-data-readiness.md`

Account-gated work still requiring the team owner:

- Authorize the Native.builder X/Privy login flow
- Apply the `AIFACTORY26` Builder Plan promo code
- Add a valid Bright Data API key server-side after claiming `aiaccess50`; current local value still returns HTTP 401 on `brightdata:auth-check`
- Deploy the live review API with the settings in `submission/deploy-live-api.md`
- Run one Bright Data-backed project audit so the receipt has an executed sponsor trace
- Generate `submission/final-brightdata-receipt.json` with `npm run final:receipt`
- Publish the native.builder app URL and paste it into the lablab.ai submission
