# Live API Deployment Handoff

ProofRank's static fallback can rank demo evidence by itself, but true end-to-end
Bright Data collection needs the Node live review API deployed behind HTTPS.

Current no-secret production API shell:

```text
https://proofrank-ai-factory.vercel.app/api/review-project
```

Health check:

```text
https://proofrank-ai-factory.vercel.app/health
```

This production deployment is configured for direct public-fetch mode only. To
turn it into the full Bright Data live backend, add the secret variables in the
Vercel dashboard or approve that credential upload explicitly.

## Vercel Path

The repo now includes Vercel serverless wrappers in `api/` and a `/health`
rewrite in `vercel.json`, so this can run without Railway credits.

```bash
vercel login
vercel link
vercel env add BRIGHTDATA_API_TOKEN production
vercel env add PROOFRANK_FETCH_MODE production
vercel env add BRIGHTDATA_MCP_TOOLS production
vercel env add PROOFRANK_MAX_BRIGHTDATA_CALLS production
vercel env add PROOFRANK_REVIEW_TOKEN production
vercel env add PROOFRANK_RECEIPT_SIGNING_SECRET production
vercel env add PROOFRANK_ALLOWED_ORIGINS production
vercel env add PROOFRANK_ALLOWED_HOSTS production
vercel env add PROOFRANK_BRIGHTDATA_CAP_USD production
vercel --prod
```

Use these production values:

```text
BRIGHTDATA_API_TOKEN=your_valid_bright_data_token
PROOFRANK_FETCH_MODE=mcp
BRIGHTDATA_MCP_TOOLS=search_engine,scrape_as_markdown,discover
PROOFRANK_MAX_BRIGHTDATA_CALLS=12
PROOFRANK_REVIEW_TOKEN=generate_a_random_value
PROOFRANK_RECEIPT_SIGNING_SECRET=generate_a_different_random_value
PROOFRANK_ALLOWED_ORIGINS=https://your-app.nativelyai.app,https://vishwa-docs.github.io
PROOFRANK_ALLOWED_HOSTS=github.com,*.github.io,lablab.ai,*.nativelyai.app
PROOFRANK_BRIGHTDATA_CAP_USD=20
```

After deploy:

```bash
curl https://YOUR-VERCEL-DOMAIN/health
```

Use this endpoint in ProofRank:

```text
https://YOUR-VERCEL-DOMAIN/api/review-project
```

Vercel is the best zero-credit option for the public health gate and short
reviews. Full Bright Data proof runs can take longer than a free serverless
timeout, so the final sponsor receipt should still be generated locally with
`npm run final:receipt` or on a longer-timeout host if Vercel interrupts it.

## Railway Path

The repo includes `railway.json` and `npm run start:api`.

```bash
railway login
railway init
railway up
railway domain
```

Set these Railway variables before public judging:

```text
BRIGHTDATA_API_TOKEN=your_valid_bright_data_token
PROOFRANK_FETCH_MODE=mcp
BRIGHTDATA_MCP_TOOLS=search_engine,scrape_as_markdown,discover
PROOFRANK_MAX_BRIGHTDATA_CALLS=12
PROOFRANK_REVIEW_TOKEN=generate_a_random_value
PROOFRANK_RECEIPT_SIGNING_SECRET=generate_a_different_random_value
PROOFRANK_ALLOWED_ORIGINS=https://your-app.nativelyai.app,https://vishwa-docs.github.io
PROOFRANK_ALLOWED_HOSTS=github.com,*.github.io,lablab.ai,*.nativelyai.app
PROOFRANK_BRIGHTDATA_CAP_USD=20
```

After deploy:

```bash
curl https://YOUR-RAILWAY-DOMAIN/health
```

Use this endpoint in ProofRank:

```text
https://YOUR-RAILWAY-DOMAIN/api/review-project
```

Open the static or native.builder app with a short-lived review token:

```text
https://YOUR-APP-URL/?reviewToken=GENERATED_REVIEW_TOKEN
```

The browser sends that token as `x-proofrank-token`. The Bright Data token stays
server-side.

## Success Condition

Run a project review and export a receipt that contains the full sponsor proof
bundle:

```json
[
  {
    "provider": "bright-data",
    "traceStatus": "executed",
    "tool": "scrape_as_markdown"
  },
  {
    "provider": "bright-data",
    "traceStatus": "executed",
    "tool": "search_engine"
  },
  {
    "provider": "bright-data",
    "traceStatus": "executed",
    "tool": "discover"
  }
]
```

For the Bright Data prize demo, also show the signed `runReceipt` block with
`finalBrightDataGate.ok: true`.
