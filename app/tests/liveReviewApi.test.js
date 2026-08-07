import assert from "node:assert/strict";
import { handleLiveReviewRequest } from "../src/liveReviewApi.js";

const collector = async (input) => ({
  id: "review-demo",
  title: input.title || "Collected Project",
  githubUrl: input.repoUrl,
  evidence: {
    hasGithub: true
  }
});

const health = await handleLiveReviewRequest({ method: "GET", pathname: "/health" }, { collector });
assert.equal(health.status, 200);
assert.deepEqual(JSON.parse(health.body), { ok: true, service: "proofrank-live-review" });

const review = await handleLiveReviewRequest(
  {
    method: "POST",
    pathname: "/api/review-project",
    body: JSON.stringify({
      repoUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory",
      title: "ProofRank"
    })
  },
  { collector }
);

assert.equal(review.status, 200);
const reviewJson = JSON.parse(review.body);
assert.equal(reviewJson.mode, "live");
assert.equal(reviewJson.project.title, "ProofRank");
assert.equal(reviewJson.project.githubUrl, "https://github.com/Vishwa-docs/proofrank-ai-factory");

const malformed = await handleLiveReviewRequest(
  {
    method: "POST",
    pathname: "/api/review-project",
    body: "{nope"
  },
  { collector }
);
assert.equal(malformed.status, 400);
assert.match(JSON.parse(malformed.body).error, /Invalid JSON/);

const missingRepo = await handleLiveReviewRequest(
  {
    method: "POST",
    pathname: "/api/review-project",
    body: JSON.stringify({ demoUrl: "https://example.com" })
  },
  { collector }
);
assert.equal(missingRepo.status, 422);
assert.match(JSON.parse(missingRepo.body).error, /repoUrl/);

const notFound = await handleLiveReviewRequest({ method: "GET", pathname: "/api/unknown" }, { collector });
assert.equal(notFound.status, 404);

console.log("live review API tests passed");
