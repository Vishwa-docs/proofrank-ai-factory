# Last-Mile Account Actions

Date: 2026-08-07

ProofRank is currently at 8/10 required readiness gates. The remaining gates are account-bound: Native.builder publishing and the final lablab.ai submission.

## 1. Finish Native.builder

Safari is already on Native.builder with the full ProofRank prompt pasted. The automation clicked **Start building** and stopped at the **Log in or sign up** modal.

Do this:

1. Log in or sign up using email, Google, or Twitter.
2. Apply promo code `AIFACTORY26` if the Builder plan upgrade appears.
3. If the prompt disappears after login, paste `submission/native-builder-prompt.md` again.
4. Let Native.builder generate the app.
5. Publish it to a public `nativelyai.app` URL.
6. Copy that URL.

Use this as the primary submission URL.

## 2. Run The Final Audit Once The Native URL Exists

Add the published URL to `.env.local`:

```text
PROOFRANK_NATIVE_BUILDER_URL=https://YOUR-PUBLISHED-APP.nativelyai.app
```

Then run:

```bash
npm run final:audit
```

Expected after Native.builder publish: 9/10 required gates, with only lablab final submission remaining.

## 3. Submit On lablab.ai

Use these values:

```text
Project name: ProofRank
Native.builder app URL: paste the nativelyai.app URL
GitHub URL: https://github.com/Vishwa-docs/proofrank-ai-factory
Fallback app URL: https://vishwa-docs.github.io/proofrank-ai-factory/
Demo video URL: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-demo.mp4
Final Bright Data receipt URL: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/final-brightdata-receipt.json
Release assets: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/tag/proofrank-submission-v1
```

Short description:

```text
Bright Data-powered public AI product diligence for hackathon judges, sponsors, accelerators, and grant reviewers. ProofRank audits project pages, demos, repos, decks, and technology claims, then exports ranked proof receipts with claim confidence, evidence gaps, and review actions.
```

Bright Data usage:

```text
Bright Data is the evidence acquisition layer. ProofRank's verified sponsor receipt uses Bright Data Remote MCP scrape_as_markdown, search_engine, and discover as an executed source/search/discovery proof bundle, with Web Scraper API, Web Unlocker, and CLI-compatible collection steps prepared for the native.builder live workflow. Proof receipts show trace state, provider, byte count, content hash, trace digest, and signature status; sponsor-fit credit requires executed Bright Data traces, not merely planned or claimed rows. The Submission Cockpit exposes whether that gate has actually passed, while the Originality Radar uses Bright Data search and discover for field-overlap and prior-art review.
```

How native.builder was used:

```text
native.builder generated and refined the ProofRank application structure, dashboard UI, stateful audit workflow, Claim Ledger, Proof Receipt panel, export actions, responsive layout, and public deployment from the prepared product brief.
```

## 4. After Submission

Put the final lablab submission URL in `.env.local`:

```text
PROOFRANK_LABLAB_SUBMISSION_URL=https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/YOUR_TEAM/YOUR_PROJECT
```

Run:

```bash
npm run final:audit
```

Expected final state: 10/10 required gates.
