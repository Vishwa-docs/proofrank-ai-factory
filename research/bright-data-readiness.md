# ProofRank Bright Data Readiness Brief

Date: 2026-08-07
Event: AI Factory Native.builder Hackathon
Target prize: Best Agentic Use of Bright Data

## Executive Call

ProofRank should compete as a sponsor-side judge workbench: it reviews real hackathon projects by combining lablab submission pages, GitHub repositories, deployed demos, prior-art search, and proof receipts into a ranked review queue.

The winning angle is not "another research assistant." It is an evidence control plane for hackathon judging: live web collection becomes a defensible decision artifact.

## What I Need From The User

These are the pieces I cannot ethically or technically complete without the account owner:

1. Native.builder access
   - Complete the Native.builder login flow.
   - Apply `AIFACTORY26` if the builder plan screen appears.
   - Publish the native.builder app and give me the final public Native app URL.

2. Bright Data access
   - Bright Data value received and stored only in ignored `.env.local`.
   - Spend cap confirmed at $50.
   - Blocker: the current value returns HTTP 401 against both Bright Data REST request API and hosted Remote MCP.
   - Needed next: a valid Bright Data API key from account settings or welcome email, plus confirmation that `npm run brightdata:mcp-smoke` passes.

3. Real reviewer target
   - Provide the GitHub URL of the actual hackathon project you want reviewed.
   - Provide the deployed app/demo URL for that project.
   - If the repo is private, either make it public for judging or provide a read-only token with the smallest practical scope.
   - Confirm I may crawl the repo, README, issues, release assets, commit history, package files, and public deployment.

4. Final submission authority
   - Confirm the team name and exact author details.
   - Let me know which demo URL should be primary: native.builder URL first, GitHub Pages fallback second.
   - Approve the final lablab.ai submission because only your authenticated account can submit.

5. Optional model/API key
   - AI/ML API key received and stored only in ignored `.env.local`; spend cap confirmed at $10.
   - Speechmatics API key and promo code received and stored only in ignored `.env.local`.
   - These are optional for the Bright Data prize unless we add LLM adjudication or a narrated/audio submission workflow.

## What Is Left For True End-To-End Use

1. Server-side Bright Data executor
   - Added a local Node API at `/api/review-project`.
   - Added `/api/review-event` for event-level submission discovery.
   - Added direct-fetch fallback plus Bright Data REST request adapter.
   - Added hosted Remote MCP smoke check.
   - Remaining blocker: replace the failing Bright Data credential with a valid API key.
   - Tokens are loaded from `.env.local` or native.builder server secrets, never client JavaScript.

2. Live project ingestion
   - Implemented event-page ingestion endpoint and command-line smoke script.
   - Implemented GitHub repo metadata, README, package files, license, commits, deployed demo fetch, and public secret-risk scan.
   - Remaining: releases, public issues, and richer prior-art search once Bright Data auth is fixed.
   - Direct event fetch against lablab can return HTTP 403, so Bright Data/Web Unlocker is required for the real event scrape.

3. Evidence normalization
   - Implemented claim ledger.
   - Implemented trace provenance with provider, traceStatus, byte count, content hash, and sponsor-fit eligibility.
   - Implemented rule that planned, claimed, direct, pending, failed, and event-intake-only traces do not close sponsor-fit proof.

4. Adversarial judge loop
   - Implemented three perspectives: Bright Data sponsor judge, skeptical hackathon judge, and business buyer.
   - Implemented dispute log and final recommendation.

5. Export package
   - Implemented CSV, all receipts JSON, selected receipt JSON, and Markdown submission packet.
   - Remaining: optional PDF export after the native.builder app is published.

6. Native.builder implementation proof
   - Rebuild or mirror the final experience in native.builder.
   - Keep visible "built with native.builder" process evidence: workflow names, screenshots, generated routes, and public deployment.
   - Remaining account-gated blocker: publish the native.builder app URL.

## Research Pattern From Prior Bright Data Winners

The strongest Bright Data projects make live data load-bearing and decision-shaped:

- Verdict turned live web and sanctions checks into APPROVE / ESCALATE / BLOCK counterparty decisions with cited evidence, hostile-content handling, citation verification, risk scoring, and PDF audit export.
- ConsumerIQ turned marketplace and social scraping into Build / Pivot / Stop / Refine startup validation.
- ShotSpot used Bright Data discovery plus multimodal processing to turn web video discovery into timestamped training data, with a public repo and production-shaped architecture.
- LangBridge AI used Bright Data MCP to pull live regional web context, then generated localized marketing content; it won the Bright Data MCP sponsor track in the MCP-AWS challenge.

The common pattern:

1. High-value user with a painful manual workflow.
2. Live web data is central, not decorative.
3. Output is a decision or work product, not a generic summary.
4. Proof is visible: citations, trace, timestamps, and source-backed claims.
5. The demo proves one complete run on real public data.

## Current AI Factory Competitive Field

Strong current competitors already target source-backed decisions:

- Half-Life watches the assumptions behind business decisions and retracts decisions when live-web evidence invalidates premises.
- CivicTwin recompiles regulatory rules and proof receipts when a founder changes an operating choice.
- Querypex focuses on transparent data analysis where every answer shows the executed SQL.

ProofRank should stand apart by judging the judges' own problem: hackathon sponsors need to know which submissions are real, original, accessible, and genuinely using their tool. It is meta to the event, but practically useful to Bright Data, lablab.ai, accelerators, and sponsor teams.

## Features To Add For A Stronger Submission

1. Real GitHub reviewer lane
   - User gives a repo URL and demo URL.
   - Implemented first pass: README, deployed demo content, source links, Bright Data tool mentions, workflow claims, proof receipt traces, repository metadata, recursive tree, package manifest, event-window commits, license signal, and lightweight public secret-risk scan.
   - Next: copied README/code similarity, releases, public issues, and richer prior-art search once Bright Data auth is fixed.

2. Bright Data trace replay
   - Implemented trace provenance in receipts.
   - Judges can see provider, trace status, tool, URL/query, result count, retrieval time, byte count, and content hash.

3. Originality radar
   - Implemented deterministic field-overlap radar.
   - Implemented Bright Data `search_engine` and `discover` prior-art queries.
   - Separates "common idea" from "direct copy risk" without making unsupported accusations.

4. Demo proof runner
   - Check the public demo URL.
   - Record HTTP status, page title, obvious broken states, and whether critical text appears.
   - Optional browser screenshot if Bright Data browser tools are enabled.

5. Sponsor-fit tribunal
   - Three perspectives: Bright Data judge, skeptical hackathon judge, business buyer.
   - The final receipt includes where they agree and disagree.
   - Implemented.

6. No-demo-data mode
   - Partially implemented through live event review and live GitHub project review.
   - Remaining blocker: valid Bright Data credential and native.builder server-side deployment.

7. Submission composer
   - Create final lablab fields, tool list, demo script, and "how native.builder was used" explanation from the actual proof run.
   - Partially implemented through Markdown submission packet and checklist.

## Candidate Live Architecture

```mermaid
flowchart LR
    A["Event or project URL"] --> B["Native.builder workflow"]
    B --> C["Bright Data Remote MCP"]
    C --> D["Submission page scrape"]
    C --> E["GitHub repo scrape"]
    C --> F["Demo URL scrape"]
    C --> G["Prior-art search"]
    D --> H["Claim ledger"]
    E --> H
    F --> H
    G --> H
    H --> I["Adversarial judge agents"]
    I --> J["Ranked queue"]
    I --> K["Proof receipts"]
    K --> L["PDF and JSON export"]
```

## Source URLs Used In This Brief

- Current hackathon: https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits
- Web Data UNLOCKED results: https://lablab.ai/ai-hackathons/brightdata-ai-agents-web-data-hackathon/live
- Verdict: https://lablab.ai/ai-hackathons/brightdata-ai-agents-web-data-hackathon/verdict/verdict-ai-counterparty-due-diligence-agent
- ConsumerIQ repo: https://github.com/AMD-Hackathon-ISPM/BrightData-ConsumerIQ
- ShotSpot Devpost: https://devpost.com/software/shotspot-kfvp1n
- ShotSpot repo: https://github.com/aedutta/shot-spot-treehacks-26
- LangBridge AI Devpost: https://devpost.com/software/langbridge-ai
- Bright Data MCP repo: https://github.com/brightdata/brightdata-mcp
- Bright Data skills repo: https://github.com/brightdata/skills
