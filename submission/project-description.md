# ProofRank Project Description

## One-Liner

ProofRank is a Bright Data-powered public AI product diligence engine that turns public submission pages, demos, repos, decks, and technology claims into ranked, source-backed evidence receipts.

## Problem

Judges and sponsor teams review many AI projects under time pressure. Claims are scattered across project pages, demo apps, GitHub repos, slides, videos, and the public web. Manual review is slow, inconsistent, and easy to game with polished writing but weak evidence.

## Target User

- Hackathon judges.
- Sponsor partner teams.
- Accelerator and grant reviewers.
- Enterprise innovation and procurement teams evaluating public AI products.

## Solution

ProofRank audits public project evidence and creates a diligence queue. For every project it scores eligibility, Bright Data dependency, business value, originality, and presentation. It opens each score into a Claim Check, Review Panel, Winner Benchmark, Similarity Check, and Evidence Receipt, showing source snippets, confidence, limitations, trace provenance, release/demo artifacts, public issue signals, similar-project overlap, disputes, and the recommended review action.

For public visitors, ProofRank now creates a Draft Review Card after they paste a GitHub repo and optional demo URL. The card is intentionally link-only: it says the repository was supplied but not fetched, the demo URL was supplied but reachability was not checked, and Bright Data evidence is pending. Visitors can copy the draft summary or draft link, then upgrade the same project through private Bright Data live review.

The Links tab keeps the workflow honest by separating project intake, event collection, required final-submission gates, and competitive-strength checks. It shows whether the native.builder URL exists, whether the full Bright Data sponsor evidence run is present, whether an actual reviewer-supplied project has been audited, whether the live backend is configured, and whether the demo/source/video/export package are ready.

The Winner Benchmark compares each project against patterns seen in strong Bright Data sponsor-prize projects: decision-shaped output, executed live-web evidence, multi-tool Bright Data dependency, judge-visible evidence trails, defensible originality, public end-to-end workflow, and a native.builder primary deployment. This makes the sponsor-prize strategy visible to judges instead of hiding it in the implementation.

The Presentation Check adds a lightweight reviewer aid for the final demo. A user can paste the 45-60 second pitch transcript or notes, and ProofRank flags whether the pitch states the problem, target user, workflow, Bright Data evidence, decision artifact, business value, and final ask. It is intentionally labeled as pasted-text analysis, not video verification, and it does not change demo, repo, or Bright Data evidence status.

## Why Bright Data

Bright Data is the load-bearing evidence acquisition layer. ProofRank needs live public web access to inspect submission pages, demo URLs, GitHub repos, presentations, prior-art signals, and sponsor usage claims. The current fallback app implements Bright Data Request API collection plus Remote MCP `scrape_as_markdown`, `search_engine`, and `discover`, and prepares Web Scraper API, Web Unlocker, and CLI-compatible steps for the native.builder live workflow. Receipts distinguish the executed Bright Data source/search/discovery bundle from direct fallback, planned, claimed, pending, or failed rows. Without Bright Data, ProofRank is limited to uploaded snapshots and demo fixtures.

## Why Native.builder

The competition app was generated, refined, and published through native.builder at `https://80wmf4jpjww3g4j6wcymx9m8t.nativelyai.app/`. Native.builder was used for the app structure, dashboard UI, stateful audit workflow, export actions, responsive layout, and deployment. This local workspace provides the specification, reference implementation, fixtures, and submission assets that drove the native.builder build.

## Differentiation

ProofRank is not an AI judge and not a generic scraper. It is a diligence engine. It extracts public claims, checks the evidence behind them, labels confidence, surfaces evidence gaps, runs three review perspectives, compares field overlap through a Similarity Check, and exports a defensible review packet.

## External APIs And Tools

- native.builder
- Bright Data Remote MCP
- Bright Data SERP API
- Bright Data Web Scraper API
- Bright Data Web Unlocker
- Bright Data CLI
- Optional GitHub hosting
- Optional static deployment fallback

## Current Demo Workflow

1. Open ProofRank.
2. Paste a public GitHub repo and demo app URL.
3. Add the project and inspect the ranked queue.
4. Copy the Draft Review Card if the project is still link-only.
5. Select a project.
6. Open the Claim Check.
7. Review the Review Panel, Winner Benchmark, Similarity Check, Evidence Receipt, and trace table.
8. Check the Links tab for remaining native.builder, Bright Data, and real-project gates.
9. Optionally run the Presentation Check to find pitch claims that still need evidence.
10. Export the sponsor-ready diligence packet.
