# Live API Deployment Handoff

ProofRank's static fallback can rank demo evidence by itself, but true end-to-end
Bright Data collection needs the Node live review API deployed behind HTTPS.

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
PROOFRANK_MAX_BRIGHTDATA_CALLS=12
PROOFRANK_REVIEW_TOKEN=generate_a_random_value
PROOFRANK_ALLOWED_ORIGINS=https://your-app.nativelyai.app,https://vishwa-docs.github.io
PROOFRANK_ALLOWED_HOSTS=github.com,*.github.io,lablab.ai,*.nativelyai.app
PROOFRANK_BRIGHTDATA_CAP_USD=50
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

Run a project review and export a receipt that contains:

```json
{
  "provider": "bright-data",
  "traceStatus": "executed",
  "tool": "scrape_as_markdown"
}
```

For the Bright Data prize demo, also show an executed `search_engine` trace.
