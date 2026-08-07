# Bright Data Setup

## Hackathon Credit

- Promo code: `aiaccess50`
- Hackathon page lists $50 Bright Data credits, 30 day validity, no cap, and 5,000 free MCP requests per month.
- Bright Data is independent of the AI/ML API vs Featherless coupon restriction.

## Account Actions

1. Create or open a Bright Data account.
2. Apply promo code `aiaccess50` if prompted.
3. Copy a real account API key from the welcome email or account settings.
4. Store the token server-side in native.builder, never in client JavaScript.
5. Run `npm run brightdata:auth-check` to confirm the token passes Bright Data account authentication.
6. Run `npm run brightdata:mcp-smoke` before the final demo.
7. Set `PROOFRANK_FETCH_MODE=mcp` for the final live proof run.
8. Set `BRIGHTDATA_MCP_TOOLS=search_engine,scrape_as_markdown,discover` so the final run requests the exact proof-bundle tools.
9. Keep `PROOFRANK_MAX_BRIGHTDATA_CALLS=12` unless you intentionally need a larger bounded run.
10. Set `PROOFRANK_REVIEW_TOKEN`, `PROOFRANK_RECEIPT_SIGNING_SECRET`, `PROOFRANK_ALLOWED_ORIGINS`, and `PROOFRANK_ALLOWED_HOSTS` before exposing the backend publicly.
11. Run `npm run final:receipt -- REPO_URL DEMO_URL` to create the signed sponsor proof artifact.

## Current Credential Status

- A Bright Data value can be stored locally in `.env.local`, which is ignored by Git.
- On 2026-08-07, the replacement admin key passed account auth and hosted Remote MCP when `BRIGHTDATA_MCP_TOOLS=search_engine,scrape_as_markdown,discover` was set.
- Keep the key server-side; do not commit it or place it in client JavaScript.
- Before final submission, use a key that passes `npm run brightdata:auth-check` and `npm run brightdata:mcp-smoke`.
- The browser UI now talks to a local/native.builder API endpoint; it never asks judges to paste a Bright Data token into client JavaScript.

## Remote MCP

Use token-only auth:

```text
https://mcp.brightdata.com/mcp?token=YOUR_API_TOKEN
```

Recommended scoped tools for ProofRank:

```text
tools=search_engine,scrape_as_markdown,scrape_batch,discover
```

Optional pro or expanded tools for later:

```text
groups=browser,ecommerce,social
```

ProofRank now includes a server-side Remote MCP client. It initializes the MCP
session, lists tools for the smoke check, calls `scrape_as_markdown` for
project/demo/event evidence, calls `search_engine` for prior-art search, and
calls `discover` for AI-ranked prior-art discovery in project reviews. The same
client redacts token values from HTTP or JSON-RPC error messages.

The live collector also enforces a per-run Bright Data call budget. This is a
hard call-count guard, not exact dollar metering; platform billing still belongs
to the Bright Data account. With the default value, one project review has enough
room for repo/demo evidence plus prior-art search without allowing runaway loops.

When deploying the live backend, keep the Bright Data token server-side and
protect the review endpoints with a short-lived judge token, restricted CORS
origins, and an allowlist of expected public hosts. The API rejects disallowed
origins and URL hosts before it can call Bright Data.
The browser accepts the token from `#reviewToken=...`, stores it in session
storage, removes it from the visible URL, and sends it as `x-proofrank-token`, so
the token does not need to appear as a visible UI field.

## CLI Commands For Evidence Collection

```bash
npx --yes --package @brightdata/cli brightdata scrape SUBMISSION_URL -f markdown --json
npx --yes --package @brightdata/cli brightdata search "PROJECT_TITLE Bright Data hackathon" --json --pretty
npx --yes --package @brightdata/cli brightdata scrape DEMO_URL -f markdown --json
npx --yes --package @brightdata/cli brightdata discover "PROJECT_TITLE" --intent "Find public evidence of originality, demo availability, and Bright Data usage" --num-results 5 --include-content --json
```

## Required Environment Variables

```text
BRIGHTDATA_API_TOKEN=your_token_here
BRIGHTDATA_UNLOCKER_ZONE=mcp_unlocker
PROOFRANK_FETCH_MODE=mcp
BRIGHTDATA_MCP_TOOLS=search_engine,scrape_as_markdown,discover
PROOFRANK_MAX_BRIGHTDATA_CALLS=12
PROOFRANK_REVIEW_TOKEN=generate_a_random_value
PROOFRANK_RECEIPT_SIGNING_SECRET=generate_a_different_random_value
PROOFRANK_ALLOWED_ORIGINS=https://your-app.nativelyai.app,https://vishwa-docs.github.io
PROOFRANK_ALLOWED_HOSTS=github.com,*.github.io,lablab.ai,*.nativelyai.app
# Optional; omit to derive this from BRIGHTDATA_API_TOKEN.
BRIGHTDATA_MCP_URL=
PROOFRANK_MODE=live
```

## Local Live Commands

```bash
npm run brightdata:auth-check
npm run brightdata:mcp-smoke
PROOFRANK_FETCH_MODE=mcp npm run live:event-smoke -- https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits
PROOFRANK_FETCH_MODE=mcp npm run live:smoke -- https://github.com/OWNER/REPO https://DEPLOYED_APP_URL
PROOFRANK_RECEIPT_SIGNING_SECRET=generate_a_private_value npm run final:receipt -- https://github.com/OWNER/REPO https://DEPLOYED_APP_URL
npm run live:event-smoke -- https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits
npm run live:smoke -- https://github.com/OWNER/REPO https://DEPLOYED_APP_URL
npm run live:smoke:direct -- https://github.com/OWNER/REPO https://DEPLOYED_APP_URL
npm run live:server
```

When the live server is running, use this endpoint in the ProofRank UI:

```text
http://127.0.0.1:8787/api/review-project
```

Use `live:smoke:direct` only to validate real GitHub/demo ingestion while Bright Data credentials are being corrected. The lablab event page may block direct fetches with HTTP 403, so event-level collection should use Bright Data/Web Unlocker. The prize demo should use the Bright Data-backed path once `brightdata:mcp-smoke` passes. ProofRank marks direct fallback as `traceStatus: executed` with `provider: direct`, but sponsor-fit scoring only closes when `provider: bright-data` is executed. In MCP mode, `live:smoke` also requires an executed `search_engine` trace.

## Final Sponsor Receipt

After `brightdata:mcp-smoke` succeeds, generate the final proof artifact:

```bash
PROOFRANK_RECEIPT_SIGNING_SECRET=generate_a_private_value npm run final:receipt -- https://github.com/OWNER/REPO https://DEPLOYED_APP_URL
```

The command writes `submission/final-brightdata-receipt.json`. It refuses to pass
unless the run includes an executed Bright Data `scrape_as_markdown` or equivalent
source trace with content, an executed Bright Data `search_engine` trace, an
executed Bright Data `discover` trace, matching trace counts and digest, and an HMAC signature verified with
`PROOFRANK_RECEIPT_SIGNING_SECRET`. Direct mode can be tested with `--allow-direct`;
it writes to `/tmp/proofrank-final-brightdata-receipt-debug.json` by default and
should not be used for the Bright Data prize.

## Proof Receipt Trace Shape

```json
{
  "mode": "bright-data-mcp",
  "provider": "bright-data",
  "traceStatus": "executed",
  "tool": "scrape_as_markdown",
  "queryOrUrl": "https://example.com/submission",
  "resultCount": 1,
  "status": "ok",
  "collectedAt": "2026-08-07T10:30:00+05:30",
  "byteCount": 8421,
  "contentHash": "1a2b3c4d"
}
```

Server-issued project reviews also include a `runReceipt` with a run id, tool
list, trace digest, replay command, and optional `hmac-sha256` signature when
`PROOFRANK_RECEIPT_SIGNING_SECRET` is configured.
