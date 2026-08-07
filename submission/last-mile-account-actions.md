# Last-Mile Account Actions

Date: 2026-08-07

ProofRank is currently at 10/11 required final readiness gates. Native.builder is published, the Bright Data proof package is ready, and the public live API security gate is now closed. The remaining external gate is the final lablab.ai submission URL.

## 1. Native.builder Status

Native.builder project workspace:

```text
https://builder.nativelyai.com/projects/878e0701-19ff-4ff3-9624-4513d891d1dd
```

Safari created this workspace. You logged in, created `JackB's Workspace`, the full ProofRank prompt was pasted, the MVP surface was generated, and the app was published at:

```text
https://80wmf4jpjww3g4j6wcymx9m8t.nativelyai.app/
```

Native.builder asked whether to connect Supabase for secure Bright Data Live mode, saying this is required for Edge Function secret storage on their platform. To avoid granting persistent access without action-time confirmation, the safe answer was selected: build with no real token stored in Native.builder, use Signed proof plus a Bright Data Live adapter pointed at a server-side API base URL, and keep Supabase Edge Functions as the recommended later native secure-secret path.

Current Native.builder state:

- Product Architect and Task Planner passes completed.
- ProofRank MVP surface generated.
- Public Native.builder app is published.
- Final UI correction is published in Native.builder and browser-render verified on desktop and 320px mobile.
- Current native.builder first viewport shows `Submission-ready`, `Bright Data proof passed`, `Bright proof 100`, `Overall self-audit 97`, and receipt ID `pr-20260807t194356580z-26e38064`.
- If Safari shows the old pre-publish bundle, hard refresh the tab or open the URL with a fresh query string; the saved render check used a cache-busting URL and passed.
- Use the Native.builder URL above as the primary submission URL.

If you explicitly want full native-builder-hosted Bright Data Live mode, connect Supabase for Edge Function secrets after confirming that integration. Do not paste the Bright Data key into client UI, prompt text, query params, or visible forms.

## 2. Run The Final Audit

Keep the published URL in `.env.local`:

```text
PROOFRANK_NATIVE_BUILDER_URL=https://80wmf4jpjww3g4j6wcymx9m8t.nativelyai.app/
```

Then run:

```bash
npm run final:audit
```

Expected state before lablab submit: 10/11 required gates, with only lablab final submission remaining.

## 3. Submit On lablab.ai

Use these values:

```text
Project name: ProofRank
Native.builder app URL: https://80wmf4jpjww3g4j6wcymx9m8t.nativelyai.app/
GitHub URL: https://github.com/Vishwa-docs/proofrank-ai-factory
Fallback app URL: https://proofrank-ai-factory.vercel.app/
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
Bright Data is the evidence acquisition layer. ProofRank's verified sponsor receipt uses Bright Data Remote MCP scrape_as_markdown, search_engine, and discover as the executed source/search/discovery proof bundle. Proof receipts show trace state, provider, byte count, content hash, trace digest, and signature status; sponsor-fit credit requires executed Bright Data traces, not merely planned or claimed rows. The Evidence Route exposes whether that gate has actually passed, while the Originality Radar uses Bright Data search and discover for field-overlap and prior-art review. Web Scraper API, Web Unlocker, and CLI-compatible collectors are prepared expansion paths for the native.builder live workflow.
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

Expected final state: 11/11 required gates.
