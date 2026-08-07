import assert from "node:assert/strict";
import { createLiveReviewServer } from "../../scripts/live-review-server.mjs";

const server = createLiveReviewServer({
  collector: async () => ({
    id: "review-demo",
    title: "Demo",
    evidence: { hasGithub: true }
  })
});

assert.equal(typeof createLiveReviewServer, "function");
assert.equal(typeof server.listen, "function");
assert.equal(typeof server.close, "function");

console.log("live review server tests passed");
