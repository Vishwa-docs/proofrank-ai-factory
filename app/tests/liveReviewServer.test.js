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
  allowAnonymousPost: true,
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

const previousReviewToken = process.env.PROOFRANK_REVIEW_TOKEN;
process.env.PROOFRANK_REVIEW_TOKEN = "server-token";
const protectedServer = createLiveReviewServer({
  collector: async (payload) => ({
    id: "review-protected",
    title: "Protected",
    githubUrl: payload.repoUrl,
    evidence: { hasGithub: true }
  })
});

let skippedProtectedListen = false;
let protectedPort;

try {
  protectedPort = await new Promise((resolve, reject) => {
    protectedServer.once("error", reject);
    protectedServer.listen(0, "127.0.0.1", () => resolve(protectedServer.address().port));
  });
} catch (error) {
  if (error.code !== "EPERM") throw error;
  skippedProtectedListen = true;
} finally {
  if (previousReviewToken === undefined) delete process.env.PROOFRANK_REVIEW_TOKEN;
  else process.env.PROOFRANK_REVIEW_TOKEN = previousReviewToken;
}

if (!skippedProtectedListen) {
  try {
    const blocked = await fetch(`http://127.0.0.1:${protectedPort}/api/review-project`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ repoUrl: "https://github.com/example/demo" })
    });
    assert.equal(blocked.status, 401);

    const allowed = await fetch(`http://127.0.0.1:${protectedPort}/api/review-project`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-proofrank-token": "server-token"
      },
      body: JSON.stringify({ repoUrl: "https://github.com/example/demo" })
    });
    assert.equal(allowed.status, 200);
  } finally {
    await new Promise((resolve) => protectedServer.close(resolve));
  }
}

console.log("live review server tests passed");
