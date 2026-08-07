import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { buildReadiness, readinessSummary } from "../src/readiness.js";

const proofrank = fixtureProjects.find((project) => project.id === "proofrank");

const fallbackReadiness = buildReadiness(proofrank, {
  mode: "demo",
  liveApiUrl: "http://127.0.0.1:8787/api/review-project",
  pageOrigin: "http://127.0.0.1:4173",
  reviewerProjectCount: 0,
  projects: fixtureProjects
});

assert.equal(fallbackReadiness.canSubmit, false);
assert.equal(fallbackReadiness.sponsorProofReady, false);
assert.equal(fallbackReadiness.nativeBuilderReady, false);
assert.equal(fallbackReadiness.gates.find((gate) => gate.id === "public-app").status, "passed");
assert.equal(fallbackReadiness.gates.find((gate) => gate.id === "native-builder").status, "needs-action");
assert.equal(fallbackReadiness.gates.find((gate) => gate.id === "bright-data").status, "needs-action");
assert.ok(fallbackReadiness.nextActions.some((action) => /native\.builder/i.test(action)));
assert.ok(fallbackReadiness.nextActions.some((action) => /Bright Data/i.test(action)));

const directTraceProject = {
  ...proofrank,
  id: "review-pending-proofrank",
  demoUrl: "https://example.nativelyai.app",
  brightDataTraces: [
    {
      provider: "bright-data",
      traceStatus: "pending",
      tool: "Remote MCP",
      queryOrUrl: "https://example.com",
      countsForSponsorFit: true
    }
  ]
};

const directReadiness = buildReadiness(directTraceProject, {
  mode: "live",
  liveApiUrl: "http://127.0.0.1:8787/api/review-project",
  pageOrigin: "http://127.0.0.1:4173",
  reviewerProjectCount: 1,
  projects: [directTraceProject]
});

assert.equal(directReadiness.gates.find((gate) => gate.id === "actual-review-target").status, "needs-action");
assert.equal(directReadiness.gates.find((gate) => gate.id === "bright-data").status, "needs-action");
assert.equal(directReadiness.canSubmit, false);

const executedProject = {
  ...proofrank,
  id: "review-proofrank",
  demoUrl: "https://proofrank.nativelyai.app",
  evidenceItems: [
    {
      sourceType: "github-metadata",
      title: "Repository metadata collected"
    }
  ],
  evidence: {
    ...proofrank.evidence,
    repoMetadataCollected: true
  },
  brightDataTraces: [
    {
      provider: "bright-data",
      traceStatus: "executed",
      tool: "scrape_as_markdown",
      queryOrUrl: "https://github.com/example/project",
      resultCount: 1,
      countsForSponsorFit: true
    }
  ]
};

const ready = buildReadiness(executedProject, {
  mode: "live",
  liveApiUrl: "http://127.0.0.1:8787/api/review-project",
  pageOrigin: "http://127.0.0.1:4173",
  reviewerProjectCount: 1,
  projects: [executedProject]
});

assert.equal(ready.canSubmit, true);
assert.equal(ready.requiredPassed, ready.requiredTotal);
assert.equal(ready.sponsorProofReady, true);
assert.equal(ready.nativeBuilderReady, true);
assert.match(readinessSummary(ready), /ready for final submission/i);

const unrelatedExecutedTrace = buildReadiness(proofrank, {
  mode: "live",
  liveApiUrl: "http://127.0.0.1:8787/api/review-project",
  pageOrigin: "http://127.0.0.1:4173",
  reviewerProjectCount: 1,
  projects: [proofrank, executedProject]
});

assert.equal(unrelatedExecutedTrace.gates.find((gate) => gate.id === "bright-data").status, "needs-action");
assert.equal(unrelatedExecutedTrace.sponsorProofReady, false);

const hostedWithLocalhostEndpoint = buildReadiness(executedProject, {
  mode: "live",
  liveApiUrl: "http://127.0.0.1:8787/api/review-project",
  pageOrigin: "https://vishwa-docs.github.io",
  reviewerProjectCount: 1,
  projects: [executedProject]
});

assert.equal(hostedWithLocalhostEndpoint.gates.find((gate) => gate.id === "live-backend").status, "needs-action");
assert.equal(hostedWithLocalhostEndpoint.canSubmit, false);

console.log("readiness tests passed");
