# ProofRank

ProofRank is an agentic submission truth auditor for hackathons, accelerators, grant programs, and sponsor reviews.

Given a public event or project URL, it gathers evidence about submissions and produces a ranked judge queue with proof receipts for accessibility, demo completeness, originality, sponsor/tool usage, source availability, business value, and eligibility risk.

## Why This Exists

Hackathon judges and sponsor teams need to know which projects are real, accessible, original, and genuinely using partner technology. Manual review is slow and inconsistent. ProofRank turns public web evidence into a source-backed review packet.

## Bright Data Fit

Bright Data is the load-bearing evidence layer in live mode:

- Remote MCP or CLI search discovers submission pages, demo links, GitHub repos, presentations, and public comparison targets.
- Web Scraper API or Web Unlocker fetches dynamic or protected pages.
- SERP checks title, team, and problem-statement similarity.
- Every receipt stores a Bright Data trace so sponsor reviewers can see exactly where the evidence came from.

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

After the app files are created:

```bash
python3 -m http.server 4173 --directory app
```

Open:

```text
http://127.0.0.1:4173
```

## Local Tests

After the test files are created:

```bash
node app/tests/scoring.test.js
node app/tests/parser.test.js
```

The full verifier will be:

```bash
bash scripts/verify.sh
```

## Current Status

Design and implementation plan are in:

- `docs/superpowers/specs/2026-08-07-proofrank-design.md`
- `docs/superpowers/plans/2026-08-07-proofrank-implementation.md`
