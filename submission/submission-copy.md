# ProofRank Submission Copy

## Project Name

ProofRank

## Short Description

Bright Data-powered review workspace for AI hackathon judges. ProofRank checks demos, GitHub repos, project claims, and prior art, then exports reviewer memos with confidence scores, evidence gaps, and sponsor-prize actions.

## Problem

AI project reviewers must verify many public claims under time pressure. Demo links break, repositories are thin, sponsor usage is sometimes superficial, and originality is hard to check manually.

## Target User

Hackathon judges, sponsor partner teams, accelerator reviewers, grant reviewers, procurement teams, and enterprise innovation teams.

## How Native.builder Was Used

native.builder generated and refined the ProofRank application structure, dashboard UI, stateful review workflow, Claim Check, Evidence panel, export actions, responsive layout, and public deployment from the prepared product brief.

## Bright Data Usage

Bright Data is the evidence acquisition layer. ProofRank uses Bright Data Remote MCP `scrape_as_markdown`, `search_engine`, and `discover` for the executed source, search, and discovery checks behind its saved review. The interface shows whether those checks really ran, which provider was used, and which public claims still need support. Sponsor-fit credit requires executed Bright Data checks, not merely planned or claimed rows. The Evidence view exposes that gate, while the Similarity Check uses Bright Data search and `discover` for field-overlap and prior-art review. Web Scraper API, Web Unlocker, and CLI-compatible collectors are prepared expansion paths for the native.builder live workflow.

ProofRank does not replace judges. It gives judges and sponsors a Bright Data-backed evidence queue so they can verify accessibility, originality, sponsor usage, and demo claims faster.

Draft Review Cards make the public test path useful before credentials are involved. A visitor can paste a GitHub repo and optional demo URL, copy a link-only draft summary, and see exactly what still has not been fetched or checked. The same project can then be upgraded through private Bright Data source, search, and discovery review.

The Prize Brief turns each project into a plain judge action instead of another dashboard score. It shows the Bright Data lane, competition lane, buyer lane, and the next click: run public review, add private Bright Data evidence, open evidence, copy replay link, or export the memo.

The Presentation Check supports the final pitch by analyzing pasted demo transcript text for missing problem, user, workflow, Bright Data evidence, decision artifact, business value, and final ask claims. It stays honest: pasted text does not verify the video, the demo, the repository, or Bright Data traces.

## External Tools

native.builder, Bright Data Remote MCP, Bright Data `scrape_as_markdown`, Bright Data `search_engine`, Bright Data `discover`, GitHub, Vercel fallback app and API, GitHub Pages backup. Prepared expansion paths: Bright Data Web Scraper API, Web Unlocker, and CLI collectors.

## Required Links

Native.builder app URL: `https://80wmf4jpjww3g4j6wcymx9m8t.nativelyai.app/`

GitHub URL: `https://github.com/Vishwa-docs/proofrank-ai-factory`

Fallback app URL: `https://proofrank-ai-factory.vercel.app/`

Demo video URL: `https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-demo.mp4`

Final Bright Data review JSON: `https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/final-brightdata-receipt.json`

Workflow replay URL: `https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/workflow-proof.json`

Secondary external review proof URL: `https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/external-review-proof.json`
