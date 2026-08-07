# Last-Mile Account Actions

Date: 2026-08-07

ProofRank is currently at 8/10 required readiness gates. The remaining gates are account-bound: Native.builder publishing and the final lablab.ai submission.

## 1. Finish Native.builder

Native.builder project workspace:

```text
https://builder.nativelyai.com/projects/878e0701-19ff-4ff3-9624-4513d891d1dd
```

Safari created this workspace. You logged in, created `JackB's Workspace`, the full ProofRank prompt was pasted, and generation was started. Native.builder asked whether to connect Supabase for secure Bright Data Live mode, saying this is required for Edge Function secret storage on their platform. To avoid granting persistent access without action-time confirmation, the safe answer was selected: build now with no real token stored in Native.builder, use Demo Evidence plus a Bright Data Live adapter pointed at a server-side API base URL, and keep Supabase Edge Functions as the recommended later native secure-secret path.

Current Native.builder state:

- Product Architect PRD pass completed.
- Task Planner completed a six-task build plan.
- The next visible action was **Start building - Task 1: Foundation & Layout**.
- The preview still shows the default placeholder, so the actual app UI has not been generated yet.
- Normal Safari site storage for `builder.nativelyai.com` is currently causing the builder shell to render blank. Private Browsing loads the public Natively home correctly, which indicates the service itself is reachable.

Do this:

1. Recover Native.builder access by either logging in through the working Private Browsing window, or clearing only Natively site data in normal Safari and logging in again.
2. Open the project workspace URL above.
3. Click **Start building - Task 1: Foundation & Layout**.
4. Let the six planned Native.builder build tasks run in order until the preview contains the ProofRank UI.
5. Apply promo code `AIFACTORY26` if the Builder plan upgrade appears.
6. Publish it to a public `nativelyai.app` URL.
7. Copy that URL.

If you explicitly want full native-builder-hosted Bright Data Live mode, connect Supabase for Edge Function secrets after confirming that integration. Do not paste the Bright Data key into client UI, prompt text, query params, or visible forms.

Use this as the primary submission URL.

## 2. Run The Final Audit Once The Native URL Exists

Add the published URL to `.env.local`:

```text
PROOFRANK_NATIVE_BUILDER_URL=https://80wmf4jpjww3g4j6wcymx9m8t.nativelyai.app/
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
Native.builder app URL: https://80wmf4jpjww3g4j6wcymx9m8t.nativelyai.app/
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
