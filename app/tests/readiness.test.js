import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { buildReadiness, readinessSummary } from "../src/readiness.js";

function executedTrace(tool, overrides = {}) {
  return {
    provider: "bright-data",
    traceStatus: "executed",
    tool,
    queryOrUrl: "https://github.com/example/project",
    resultCount: 1,
    countsForSponsorFit: true,
    byteCount: 1024,
    contentHash: "abcd1234",
    ...overrides
  };
}

const proofrank = fixtureProjects.find((project) => project.id === "proofrank");

const fallbackReadiness = buildReadiness(proofrank, {
  mode: "demo",
  liveApiUrl: "http://127.0.0.1:8787/api/review-project",
  pageOrigin: "http://127.0.0.1:4173",
  reviewerProjectCount: 0,
  projects: fixtureProjects
});

assert.equal(fallbackReadiness.canSubmit, true);
assert.equal(fallbackReadiness.sponsorProofReady, true);
assert.equal(fallbackReadiness.nativeBuilderReady, true);
assert.equal(fallbackReadiness.gates.find((gate) => gate.id === "public-app").status, "passed");
assert.equal(fallbackReadiness.gates.find((gate) => gate.id === "native-builder").status, "passed");
assert.equal(fallbackReadiness.gates.find((gate) => gate.id === "bright-data").status, "passed");
assert.equal(fallbackReadiness.gates.find((gate) => gate.id === "actual-review-target").status, "passed");
assert.equal(fallbackReadiness.gates.find((gate) => gate.id === "live-backend").status, "passed");
assert.match(readinessSummary(fallbackReadiness), /ready for final submission/i);

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
    executedTrace("scrape_as_markdown"),
    executedTrace("search_engine", {
      queryOrUrl: "\"ProofRank\" \"Bright Data\" hackathon",
      contentHash: "ef567890"
    }),
    executedTrace("discover", {
      queryOrUrl: "\"ProofRank\" \"Bright Data\" hackathon originality",
      contentHash: "1234abcd"
    })
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

const plannedProofrank = {
  ...proofrank,
  runReceipt: undefined,
  evidence: {
    ...proofrank.evidence,
    brightDataTrace: false,
    brightDataTraceStatus: "planned"
  },
  brightDataTraces: [
    {
      provider: "bright-data",
      traceStatus: "planned",
      tool: "Remote MCP",
      queryOrUrl: "https://example.com",
      countsForSponsorFit: true
    }
  ]
};

const unrelatedExecutedTrace = buildReadiness(plannedProofrank, {
  mode: "live",
  liveApiUrl: "http://127.0.0.1:8787/api/review-project",
  pageOrigin: "http://127.0.0.1:4173",
  reviewerProjectCount: 1,
  projects: [plannedProofrank, executedProject]
});

assert.equal(unrelatedExecutedTrace.gates.find((gate) => gate.id === "bright-data").status, "needs-action");
assert.equal(unrelatedExecutedTrace.sponsorProofReady, false);

const hostedWithoutReceiptProject = {
  ...executedProject,
  runReceipt: undefined
};

const hostedWithLocalhostEndpoint = buildReadiness(hostedWithoutReceiptProject, {
  mode: "live",
  liveApiUrl: "http://127.0.0.1:8787/api/review-project",
  pageOrigin: "https://vishwa-docs.github.io",
  reviewerProjectCount: 1,
  projects: [hostedWithoutReceiptProject]
});

assert.equal(hostedWithLocalhostEndpoint.gates.find((gate) => gate.id === "live-backend").status, "needs-action");
assert.equal(hostedWithLocalhostEndpoint.canSubmit, false);

console.log("readiness tests passed");
