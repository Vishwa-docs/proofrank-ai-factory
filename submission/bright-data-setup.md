# Bright Data Setup

## Hackathon Credit

- Promo code: `aiaccess50`
- Hackathon page lists $50 Bright Data credits, 30 day validity, no cap, and 5,000 free MCP requests per month.
- Bright Data is independent of the AI/ML API vs Featherless coupon restriction.

## Account Actions

1. Create or open a Bright Data account.
2. Apply promo code `aiaccess50` if prompted.
3. Copy the account API token from the welcome email or account settings.
4. Store the token server-side in native.builder, never in client JavaScript.

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
BRIGHTDATA_MCP_URL=https://mcp.brightdata.com/mcp?token=your_token_here
PROOFRANK_MODE=live
```

## Proof Receipt Trace Shape

```json
{
  "mode": "live",
  "tool": "scrape_as_markdown",
  "queryOrUrl": "https://example.com/submission",
  "resultCount": 1,
  "status": "ok",
  "collectedAt": "2026-08-07T10:30:00+05:30"
}
```
