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
5. Run `npm run brightdata:mcp-smoke` before the final demo.

## Current Credential Status

- A Bright Data value has been stored locally in `.env.local`, which is ignored by Git.
- On 2026-08-07, both the Bright Data REST request smoke and hosted Remote MCP smoke returned HTTP 401 with that value.
- Before final submission, replace it with a Bright Data API key that passes `npm run brightdata:mcp-smoke`.
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
BRIGHTDATA_MCP_URL=https://mcp.brightdata.com/mcp?token=your_token_here
PROOFRANK_MODE=live
```

## Local Live Commands

```bash
npm run brightdata:mcp-smoke
npm run live:event-smoke -- https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits
npm run live:smoke -- https://github.com/OWNER/REPO https://DEPLOYED_APP_URL
npm run live:smoke:direct -- https://github.com/OWNER/REPO https://DEPLOYED_APP_URL
npm run live:server
```

When the live server is running, use this endpoint in the ProofRank UI:

```text
http://127.0.0.1:8787/api/review-project
```

Use `live:smoke:direct` only to validate real GitHub/demo ingestion while Bright Data credentials are being corrected. The lablab event page may block direct fetches with HTTP 403, so event-level collection should use Bright Data/Web Unlocker. The prize demo should use the Bright Data-backed path once `brightdata:mcp-smoke` passes. ProofRank marks direct fallback as `traceStatus: executed` with `provider: direct`, but sponsor-fit scoring only closes when `provider: bright-data` is executed.

## Proof Receipt Trace Shape

```json
{
  "mode": "bright-data-request-api",
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
