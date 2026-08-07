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

const testServer = createLiveReviewServer({
  collector: async (payload) => ({
    id: "review-demo",
    title: "Demo",
    githubUrl: payload.repoUrl,
    evidence: { hasGithub: true }
  })
});

let skippedHttpListen = false;
let port;

try {
  port = await new Promise((resolve, reject) => {
    testServer.once("error", reject);
    testServer.listen(0, "127.0.0.1", () => resolve(testServer.address().port));
  });
} catch (error) {
  if (error.code !== "EPERM") throw error;
  skippedHttpListen = true;
}

if (!skippedHttpListen) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/review-project`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ repoUrl: "https://github.com/example/demo" })
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.mode, "live");
    assert.equal(body.project.githubUrl, "https://github.com/example/demo");
  } finally {
    await new Promise((resolve) => testServer.close(resolve));
  }
}

console.log("live review server tests passed");
