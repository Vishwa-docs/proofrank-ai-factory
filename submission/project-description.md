# ProofRank Project Description

## One-Liner

ProofRank is a Bright Data-powered public AI product diligence engine that turns public submission pages, demos, repos, decks, and technology claims into ranked, source-backed proof receipts.

## Problem

Judges and sponsor teams review many AI projects under time pressure. Claims are scattered across project pages, demo apps, GitHub repos, slides, videos, and the public web. Manual review is slow, inconsistent, and easy to game with polished writing but weak evidence.

## Target User

- Hackathon judges.
- Sponsor partner teams.
- Accelerator and grant reviewers.
- Enterprise innovation and procurement teams evaluating public AI products.

## Solution

ProofRank audits public project evidence and creates a diligence queue. For every project it scores eligibility, Bright Data dependency, business value, originality, and presentation. It opens each score into a Claim Ledger, Adversarial Tribunal, and Proof Receipt, showing source snippets, confidence, limitations, trace provenance, disputes, and the recommended review action.

## Why Bright Data

Bright Data is the load-bearing evidence acquisition layer. ProofRank needs live public web access to inspect submission pages, demo URLs, GitHub repos, presentations, prior-art signals, and sponsor usage claims. In live mode it uses Remote MCP, SERP API, Web Scraper API, Web Unlocker, and CLI-compatible commands. Receipts distinguish executed Bright Data traces from direct fallback, planned, claimed, pending, or failed rows. Without Bright Data, ProofRank is limited to uploaded snapshots and demo fixtures.

## Why Native.builder

The competition app should be generated, refined, and published through native.builder. Native.builder is used for the app structure, dashboard UI, stateful audit workflow, export actions, responsive layout, and deployment. This local workspace provides the specification, reference implementation, fixtures, and submission assets to drive the native.builder build.

## Differentiation

ProofRank is not an AI judge and not a generic scraper. It is a diligence engine. It extracts public claims, checks the evidence behind them, labels confidence, surfaces evidence gaps, runs three adversarial perspectives, and exports a defensible review packet.

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
2. Run Demo Evidence audit on the AI Factory event URL.
3. Inspect the ranked queue.
4. Select a project.
5. Open the Claim Ledger.
6. Review the Adversarial Tribunal, Proof Receipt, and trace table.
7. Export the sponsor-ready diligence packet.
