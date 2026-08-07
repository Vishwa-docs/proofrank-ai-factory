# Final Submission Checklist

## Must Do In Native.builder

- Native.builder workspace exists: `JackB's Workspace`.
- Native.builder project workspace: `https://builder.nativelyai.com/projects/878e0701-19ff-4ff3-9624-4513d891d1dd`.
- The full ProofRank prompt was pasted and generation was started.
- Product Architect PRD pass completed.
- Task Planner completed a six-task build plan.
- Next Native.builder action: click **Start building - Task 1: Foundation & Layout** once builder access is recovered.
- Normal Safari site storage currently makes `builder.nativelyai.com` render blank; Private Browsing loads the public site, so recover by logging in there or clearing Natively site data in normal Safari.
- For truly native-builder-hosted Bright Data Live mode, confirm and connect Supabase for secure Edge Function secrets. Otherwise continue with the no-secret external live adapter already selected.
- Apply Builder Plan promo code `AIFACTORY26`.
- Iterate until the app matches the local reference.
- Publish to a public `nativelyai.app` URL.
- Copy the public app URL.

## Must Do In Bright Data

- Create or open Bright Data account.
- Apply promo code `aiaccess50` if prompted.
- Current local Bright Data proof is complete.
- `npm run brightdata:mcp-smoke` has verified `search_engine`, `scrape_as_markdown`, and `discover`.
- `submission/final-brightdata-receipt.json` shows `finalBrightDataGate.ok: true`.
- The public release includes `final-brightdata-receipt.json`.
- If you want Native.builder itself to run full Bright Data live mode, add the Bright Data token only as a server-side/secure environment variable. Do not paste it into client UI or prompt text.

## Optional But Strong

- Create a public GitHub repo and enable the included GitHub Pages workflow as a fallback app URL.
- Keep the included MIT `LICENSE` file in the public repo for submission compliance.
- Upload or link the local reference app and submission docs.
- Use the generated 2:20 demo video at `submission/proofrank-demo.mp4`.
- Attach `submission/workflow-proof.json` if judges ask for an interaction proof artifact.
- Run `npm run final:audit` and keep `submission/final-readiness-audit.json` with the final packet.
- Keep `submission/final-brightdata-receipt.json` with the final packet.
- If a public video URL is required, upload `submission/proofrank-demo.mp4` to the team YouTube, Drive, or lablab-supported video host.
- Use the generated pitch deck at `submission/proofrank-pitch-deck.pptx` if the judges or sponsor team want a concise presentation artifact.
- Export CSV and selected receipt JSON during the demo.
- Show Originality Radar and its Bright Data prior-art queries.
- Show the Evidence Route map so the sponsor judge can see where Bright Data is load-bearing and where proof is still pending.
- Show the Submission Cockpit so judges see native.builder, executed Bright Data, and real-project readiness at a glance.

Public support links already created:

```text
GitHub repo: https://github.com/Vishwa-docs/proofrank-ai-factory
Fallback app: https://vishwa-docs.github.io/proofrank-ai-factory/
Release assets: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/tag/proofrank-submission-v1
Demo video asset: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-demo.mp4
Pitch deck asset: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-pitch-deck.pptx
Workflow proof artifact: submission/workflow-proof.json
Workflow proof URL: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/workflow-proof.json
Workflow proof screenshot: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/workflow-proof.png
Final Bright Data receipt: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/final-brightdata-receipt.json
Public live API health: https://proofrank-ai-factory.vercel.app/health
Public live API shell: https://proofrank-ai-factory.vercel.app/api/review-project
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
Bright Data is the evidence acquisition layer. ProofRank's verified sponsor receipt uses Bright Data Remote MCP `scrape_as_markdown`, `search_engine`, and `discover` as an executed source/search/discovery proof bundle, with Web Scraper API, Web Unlocker, and CLI-compatible collection steps prepared for the native.builder live workflow. Proof receipts show trace state, provider, byte count, content hash, trace digest, and signature status; sponsor-fit credit requires executed Bright Data traces, not merely planned or claimed rows. The Submission Cockpit exposes whether that gate has actually passed, while the Originality Radar uses Bright Data search and `discover` for field-overlap and prior-art review.
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
Final Bright Data receipt URL: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/final-brightdata-receipt.json
```
