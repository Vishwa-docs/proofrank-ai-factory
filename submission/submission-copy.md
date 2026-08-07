# ProofRank Submission Copy

## Project Name

ProofRank

## Short Description

Bright Data-powered public AI product diligence for hackathon judges, sponsors, accelerators, and grant reviewers. ProofRank audits project pages, demos, repos, decks, and technology claims, then exports ranked proof receipts with claim confidence, evidence gaps, and review actions.

## Problem

AI project reviewers must verify many public claims under time pressure. Demo links break, repositories are thin, sponsor usage is sometimes superficial, and originality is hard to check manually.

## Target User

Hackathon judges, sponsor partner teams, accelerator reviewers, grant reviewers, procurement teams, and enterprise innovation teams.

## How Native.builder Was Used

native.builder generated and refined the ProofRank application structure, dashboard UI, stateful audit workflow, Claim Ledger, Proof Receipt panel, export actions, responsive layout, and public deployment from the prepared product brief.

## Bright Data Usage

Bright Data is the evidence acquisition layer. ProofRank's verified sponsor receipt uses Bright Data Remote MCP `scrape_as_markdown`, `search_engine`, and `discover` as an executed source/search/discovery proof bundle, with Web Scraper API, Web Unlocker, and CLI-compatible collection steps prepared for the native.builder live workflow. Proof receipts show trace state, provider, byte count, content hash, trace digest, and signature status; sponsor-fit credit requires executed Bright Data traces, not merely planned or claimed rows. The Evidence Route exposes whether that gate has actually passed, while the Originality Radar uses Bright Data search and `discover` for field-overlap and prior-art review.

## External Tools

native.builder, Bright Data Remote MCP, Bright Data SERP API, Bright Data Web Scraper API, Bright Data Web Unlocker, Bright Data CLI, GitHub, GitHub Pages, Vercel API shell.

## Required Links

Native.builder app URL: `https://80wmf4jpjww3g4j6wcymx9m8t.nativelyai.app/`

GitHub URL: `https://github.com/Vishwa-docs/proofrank-ai-factory`

Fallback app URL: `https://vishwa-docs.github.io/proofrank-ai-factory/`

Demo video URL: `https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-demo.mp4`

Final Bright Data receipt URL: `https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/final-brightdata-receipt.json`

Workflow proof URL: `https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/workflow-proof.json`
