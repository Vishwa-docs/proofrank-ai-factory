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
- Set live collection mode to `mcp` for the final sponsor-prize proof run.
- Confirm `npm run brightdata:mcp-smoke` lists `search_engine`, `scrape_as_markdown`, and `discover`.
- Run one live Bright Data-backed audit.
- Confirm the proof receipt shows at least one `provider: bright-data` trace with `traceStatus: executed`.
- Confirm the Submission Cockpit marks the Bright Data gate as passed.

## Optional But Strong

- Create a public GitHub repo and enable the included GitHub Pages workflow as a fallback app URL.
- Keep the included MIT `LICENSE` file in the public repo for submission compliance.
- Upload or link the local reference app and submission docs.
- Use the generated 2:20 demo video at `submission/proofrank-demo.mp4`.
- Attach `submission/workflow-proof.json` if judges ask for an interaction proof artifact.
- Run `npm run final:audit` and keep `submission/final-readiness-audit.json` with the final packet.
- If a public video URL is required, upload `submission/proofrank-demo.mp4` to the team YouTube, Drive, or lablab-supported video host.
- Use the generated pitch deck at `submission/proofrank-pitch-deck.pptx` if the judges or sponsor team want a concise presentation artifact.
- Export CSV and selected receipt JSON during the demo.
- Show Originality Radar and its Bright Data prior-art queries.
- Show the Submission Cockpit so judges see native.builder, executed Bright Data, and real-project readiness at a glance.

Public support links already created:

```text
GitHub repo: https://github.com/Vishwa-docs/proofrank-ai-factory
Fallback app: https://vishwa-docs.github.io/proofrank-ai-factory/
Release assets: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/tag/proofrank-submission-v1
Demo video asset: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-demo.mp4
Pitch deck asset: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-pitch-deck.pptx
Workflow proof artifact: submission/workflow-proof.json
```

Operator handoff:

```text
submission/operator-handoff.md
```

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
Bright Data is the evidence acquisition layer. The current fallback app implements server-side review through Bright Data's Request API plus Remote MCP `scrape_as_markdown` and `search_engine`, with planned Web Scraper API, Web Unlocker, `discover`, and CLI-compatible collection steps for the native.builder live workflow. Proof receipts show trace state, provider, byte count, and content hash; sponsor-fit credit requires an executed Bright Data trace, not merely a planned or claimed row. The Submission Cockpit exposes whether that gate has actually passed, while the Originality Radar prepares expanded Bright Data `discover` queries for field-overlap and prior-art review.
```

External tools:

```text
native.builder, Bright Data Remote MCP, Bright Data SERP API, Bright Data Web Scraper API, Bright Data Web Unlocker, Bright Data CLI, optional GitHub.
```

Required links to paste:

```text
Native.builder app URL: PASTE_AFTER_PUBLISH
GitHub URL: https://github.com/Vishwa-docs/proofrank-ai-factory
Fallback app URL: https://vishwa-docs.github.io/proofrank-ai-factory/
Demo video URL: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-demo.mp4
```
