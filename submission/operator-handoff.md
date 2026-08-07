# ProofRank Operator Handoff

Date: 2026-08-07

## What Is Ready

- Public fallback app: https://vishwa-docs.github.io/proofrank-ai-factory/
- Public repo: https://github.com/Vishwa-docs/proofrank-ai-factory
- Refreshed demo video release asset: https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-demo.mp4
- Native.builder prompt: `submission/native-builder-prompt.md`
- Submission copy: `submission/checklist.md` and `submission/project-description.md`
- Bright Data setup: `submission/bright-data-setup.md`
- Live API deployment: `submission/deploy-live-api.md`
- Submission Cockpit in the app showing required gates, competitive gates, and the next account-owner actions.

## What I Need From You

1. Valid Bright Data token
   - Current local token returns HTTP 401 on Bright Data account auth and hosted Remote MCP.
   - Get a new API token from Bright Data account settings or welcome email.
   - Put it in `.env.local` as `BRIGHTDATA_API_TOKEN=...`.
   - Keep or set `PROOFRANK_FETCH_MODE=mcp`.
   - Keep `PROOFRANK_MAX_BRIGHTDATA_CALLS=12` for the final proof run unless you explicitly raise the bounded limit.
   - Set `PROOFRANK_REVIEW_TOKEN`, `PROOFRANK_RECEIPT_SIGNING_SECRET`, `PROOFRANK_ALLOWED_ORIGINS`, and `PROOFRANK_ALLOWED_HOSTS` before exposing the backend outside localhost.
   - Run `npm run brightdata:auth-check`.
   - Run `npm run brightdata:mcp-smoke`.
   - Success condition: auth check returns `ok: true`, then `baseToolsPresent` is `true` for `search_engine`, `scrape_as_markdown`, and `discover`; final project receipt includes a signed `runReceipt`.

2. Native.builder publish
   - Open native.builder.
   - Apply promo code `AIFACTORY26` if prompted.
   - Paste `submission/native-builder-prompt.md`.
   - Build until the app matches the public fallback.
   - Publish the public `nativelyai.app` URL.
   - Use the native.builder URL as the primary lablab submission URL.

3. Actual project to review
   - Provide the real GitHub repo URL.
   - Provide the deployed demo/app URL.
   - Confirm the repo is public for judges, or provide temporary read-only access.
   - Run ProofRank live mode, add that repo/demo pair, and export the selected proof receipt.
   - Success condition: the Submission Cockpit shows the actual project, live backend, public app, source, demo video, and executed Bright Data gates as passed.

4. Final lablab submission
   - Paste the native.builder app URL.
   - Paste the GitHub fallback URL.
   - Paste the release demo video URL.
   - Use the Bright Data usage text from `submission/checklist.md`.
   - Submit from the authenticated team owner account.

5. Public live backend
   - Railway CLI is not currently authenticated in this workspace.
   - Use `submission/deploy-live-api.md` after `railway login`.
   - Set the Bright Data and ProofRank security variables before exposing the endpoint.

## Final Verification Commands

```bash
npm run test
bash scripts/verify.sh
npm run visual:check
npm run live:smoke:direct -- https://github.com/Vishwa-docs/proofrank-ai-factory https://vishwa-docs.github.io/proofrank-ai-factory/
```

After the Bright Data token is fixed:

```bash
npm run brightdata:auth-check
npm run brightdata:mcp-smoke
PROOFRANK_FETCH_MODE=mcp npm run live:smoke -- https://github.com/Vishwa-docs/proofrank-ai-factory https://vishwa-docs.github.io/proofrank-ai-factory/
PROOFRANK_FETCH_MODE=mcp npm run live:event-smoke -- https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits
npm run live:event-smoke -- https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits
npm run live:smoke -- https://github.com/Vishwa-docs/proofrank-ai-factory https://vishwa-docs.github.io/proofrank-ai-factory/
```

## Current Honest Status

ProofRank is submission-ready as a fallback app and collateral package. It is not yet fully eligible as the primary hackathon submission until the native.builder app URL exists. It is not yet Bright Data sponsor-proof until at least one receipt contains `provider: bright-data` and `traceStatus: executed`.
