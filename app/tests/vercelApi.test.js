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
    headers: {
      "content-type": "application/json",
      "x-proofrank-token": "serverless-token"
    },
    body: {
      repoUrl: "https://github.com/example/project",
      title: "Serverless"
    }
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
