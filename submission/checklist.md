# Final Submission Checklist

## Must Do In Native.builder

- Create native.builder account or open existing account.
- Authorize the Native.builder X/Privy login flow if prompted. Automation reached this boundary at the X OAuth screen before project creation.
- Apply Builder Plan promo code `AIFACTORY26`.
- Paste `submission/native-builder-prompt.md`.
- Let native.builder generate the app.
- Iterate until the app matches the local reference.
- Publish to a public `nativelyai.app` URL.
- Copy the public app URL.

## Must Do In Bright Data

- Create or open Bright Data account.
- Apply promo code `aiaccess50` if prompted.
- Copy Bright Data API token.
- Add token to native.builder server-side environment variables.
- Run one live audit if possible.
- Confirm the app shows a Bright Data trace in a proof receipt.

## Optional But Strong

- Create a public GitHub repo.
- Upload or link the local reference app and submission docs.
- Record a 2:35 demo video using `submission/demo-script.md`.
- Export CSV and selected receipt JSON during the demo.

## lablab.ai Submission Fields

Project name:

```text
ProofRank
```

Short description:

```text
Bright Data-powered public AI product diligence for hackathon judges, sponsors, accelerators, and grant reviewers. ProofRank audits project pages, demos, repos, decks, and technology claims, then exports ranked proof receipts with claim confidence, evidence gaps, and review actions.
```

Problem:

```text
AI project reviewers must verify many public claims under time pressure. Demo links break, repos are thin, sponsor usage is sometimes superficial, and originality is hard to check manually.
```

Target user:

```text
Hackathon judges, sponsor partner teams, accelerator reviewers, grant reviewers, procurement teams, and enterprise innovation teams.
```

How native.builder was used:

```text
native.builder generated and refined the ProofRank application structure, dashboard UI, stateful audit workflow, Claim Ledger, Proof Receipt panel, export actions, responsive layout, and public deployment from the prepared product brief.
```

Bright Data usage:

```text
Bright Data is the evidence acquisition layer. ProofRank uses Remote MCP, SERP API, Web Scraper API, Web Unlocker, and CLI-compatible collection steps to inspect public submission pages, demos, repos, decks, prior-art signals, and sponsor usage claims. Every proof receipt includes a Bright Data trace.
```

External tools:

```text
native.builder, Bright Data Remote MCP, Bright Data SERP API, Bright Data Web Scraper API, Bright Data Web Unlocker, Bright Data CLI, optional GitHub.
```

Required links to paste:

```text
Native.builder app URL: PASTE_AFTER_PUBLISH
GitHub URL: PASTE_AFTER_REPO_CREATE
Demo video URL: PASTE_AFTER_RECORDING
```
