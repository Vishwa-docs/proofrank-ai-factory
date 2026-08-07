# Vercel Live API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Vercel-compatible ProofRank live review API so the project can satisfy the public `/health` gate without Railway credits.

**Architecture:** Keep `app/src/liveReviewApi.js` as the single request contract. Add thin Vercel function wrappers under `api/` that adapt Node/Vercel request and response objects into `handleLiveReviewRequest`, with `vercel.json` rewriting `/health` to `/api/health`.

**Tech Stack:** Node ESM, Vercel Serverless Functions, existing ProofRank collectors, `node:assert` tests.

---

### Task 1: Serverless Adapter Test

**Files:**
- Create: `app/tests/vercelApi.test.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import { handleVercelLiveReview } from "../../api/_proofrank.js";

function createResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(body = "") {
      this.body = body;
    }
  };
}

const healthResponse = createResponse();
await handleVercelLiveReview({ method: "GET", headers: {}, body: "" }, healthResponse, "/health", {
  collector: async () => ({ id: "unused" })
});

assert.equal(healthResponse.statusCode, 200);
assert.deepEqual(JSON.parse(healthResponse.body), { ok: true, service: "proofrank-live-review" });

const reviewResponse = createResponse();
await handleVercelLiveReview(
  {
    method: "POST",
    headers: { "content-type": "application/json", "x-proofrank-token": "serverless-token" },
    body: { repoUrl: "https://github.com/example/project", title: "Serverless" }
  },
  reviewResponse,
  "/api/review-project",
  {
    authToken: "serverless-token",
    collector: async (payload) => ({
      id: "serverless-project",
      title: payload.title,
      githubUrl: payload.repoUrl
    })
  }
);

const reviewJson = JSON.parse(reviewResponse.body);
assert.equal(reviewResponse.statusCode, 200);
assert.equal(reviewJson.mode, "live");
assert.equal(reviewJson.project.title, "Serverless");
assert.equal(reviewJson.project.githubUrl, "https://github.com/example/project");

console.log("vercel API tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node app/tests/vercelApi.test.js`

Expected: FAIL with a module-not-found error for `api/_proofrank.js`.

- [ ] **Step 3: Add the test to the suite**

Update `package.json` so `npm run test` includes `node app/tests/vercelApi.test.js`.

### Task 2: Vercel API Wrapper

**Files:**
- Create: `api/_proofrank.js`
- Create: `api/health.js`
- Create: `api/review-project.js`
- Create: `api/review-event.js`
- Create: `vercel.json`

- [ ] **Step 1: Implement the adapter**

`api/_proofrank.js` exports `handleVercelLiveReview(req, res, pathname, options = {})`. It creates live collectors from environment variables, builds the existing security and collector options, calls `handleLiveReviewRequest`, then writes status, headers, and body to the Vercel response.

- [ ] **Step 2: Add route wrappers**

`api/health.js`, `api/review-project.js`, and `api/review-event.js` export default handlers that call `handleVercelLiveReview` with `/health`, `/api/review-project`, and `/api/review-event`.

- [ ] **Step 3: Add Vercel config**

`vercel.json` rewrites `/health` to `/api/health` and sets function max duration to the free-plan-safe ceiling where supported.

- [ ] **Step 4: Run adapter test to verify it passes**

Run: `node app/tests/vercelApi.test.js`

Expected: PASS and print `vercel API tests passed`.

### Task 3: Docs, Verification, Deploy Attempt

**Files:**
- Modify: `submission/deploy-live-api.md`
- Modify: `submission/operator-handoff.md`

- [ ] **Step 1: Update deployment docs**

Document the Vercel path, required environment variables, `/health` rewrite, and the limitation that long Bright Data reviews should be run locally or on a longer-timeout host if Vercel free function timeouts interrupt full project review.

- [ ] **Step 2: Run verification**

Run:

```bash
npm run test
npm run brightdata:mcp-smoke
npm run final:audit
```

Expected: tests pass; MCP smoke lists `search_engine`, `scrape_as_markdown`, `discover`; readiness audit has only native.builder, live API if not deployed, and lablab submission remaining.

- [ ] **Step 3: Deploy if Vercel auth is available**

Run: `vercel whoami`

If authenticated, deploy with project env vars configured. If not authenticated, stop and list the exact one-time user action needed: `vercel login` or connecting the GitHub repo to Vercel.
