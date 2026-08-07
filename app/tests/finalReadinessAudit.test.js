import assert from "node:assert/strict";
import { buildFinalReadinessReport, summarizeFinalReadiness } from "../src/finalReadinessAudit.js";

const baseState = {
  generatedAt: "2026-08-07T14:00:00.000Z",
  gitHead: "abc1234",
  publicFallback: {
    ok: true,
    url: "https://vishwa-docs.github.io/proofrank-ai-factory/",
    evidence: "ProofRank with Bright Data proof strip is live."
  },
  releaseVideo: {
    ok: true,
    url: "https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-demo.mp4",
    durationSeconds: 139.96,
    sizeBytes: 4419918
  },
  workflowProof: {
    ok: true,
    path: "submission/workflow-proof.json",
    selectedProject: "ProofRank AI Factory",
    exportedFiles: 2
  },
  targetReview: {
    ok: true,
    repoUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory",
    demoUrl: "https://vishwa-docs.github.io/proofrank-ai-factory/",
    repoReachable: true,
    demoReachable: true
  },
  nativeBuilder: {
    ok: false,
    url: ""
  },
  brightAuth: {
    ok: false,
    httpStatus: 401,
    tokenShape: {
      looksLikeUuid: true
    }
  },
  mcpTools: {
    ok: false,
    baseToolsPresent: false,
    sampleTools: []
  },
  liveApi: {
    ok: false,
    url: ""
  },
  liveApiSecurity: {
    ok: false,
    unauthenticatedStatus: 0,
    disallowedHostStatus: 0
  },
  liveReceipt: {
    ok: false,
    provider: "",
    traceStatus: "",
    hasSourceTrace: false,
    hasSearchEngine: false,
    hasDiscover: false,
    signed: false,
    signatureVerified: false
  },
  lablabSubmission: {
    ok: false,
    url: ""
  },
  candidateTargets: {
    ok: true,
    path: "research/candidate-review-targets.md"
  },
  pitchDeck: {
    ok: true,
    url: "https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-pitch-deck.pptx"
  }
};

const incomplete = buildFinalReadinessReport(baseState);
assert.equal(incomplete.canSubmit, false);
assert.equal(incomplete.requiredPassed, 4);
assert.equal(incomplete.requiredTotal, 11);
assert.equal(incomplete.gates.find((gate) => gate.id === "bright-auth").status, "needs-action");
assert.equal(incomplete.gates.find((gate) => gate.id === "bright-auth").proof, "HTTP 401; token shape looks UUID-like.");
assert.equal(incomplete.gates.find((gate) => gate.id === "native-builder").status, "needs-action");
assert.match(incomplete.gates.find((gate) => gate.id === "live-api").action, /\/api\/health/);
assert.doesNotMatch(incomplete.gates.find((gate) => gate.id === "live-api").action, /confirm \/health/);
assert.ok(incomplete.nextActions[0].includes("Republish and verify the Native.builder app"));
assert.match(summarizeFinalReadiness(incomplete), /Not final-ready/);

const complete = buildFinalReadinessReport({
  ...baseState,
  nativeBuilder: {
    ok: true,
    url: "https://proofrank.nativelyai.app",
    verifiedUrl: "https://proofrank.nativelyai.app/?verify=1",
    liveBundle: "/assets/index-verified.js",
    missingCopy: [],
    staleCopyFound: [],
    renderCheck: {
      ok: true,
      path: "submission/native-builder-render-check.json",
      publishedBundle: "/assets/index-verified.js",
      liveBundle: "/assets/index-verified.js",
      sameBundle: true
    }
  },
  brightAuth: {
    ok: true,
    httpStatus: 200,
    tokenShape: {
      looksLikeUuid: false
    }
  },
  mcpTools: {
    ok: true,
    baseToolsPresent: true,
    sampleTools: ["search_engine", "scrape_as_markdown", "discover"]
  },
  liveApi: {
    ok: true,
    url: "https://proofrank-live.example.com/api/health"
  },
  liveApiSecurity: {
    ok: true,
    unauthenticatedStatus: 401,
    disallowedHostStatus: 422
  },
  liveReceipt: {
    ok: true,
    provider: "bright-data",
    traceStatus: "executed",
    hasSourceTrace: true,
    hasSearchEngine: true,
    hasDiscover: true,
    signed: true,
    signatureVerified: true,
    runId: "pr-20260807t140000000z-11111111"
  },
  lablabSubmission: {
    ok: true,
    url: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/silverspoon/submission"
  }
});

assert.equal(complete.canSubmit, true);
assert.equal(complete.requiredPassed, complete.requiredTotal);
assert.equal(complete.nextActions.length, 0);
assert.equal(
  complete.gates.find((gate) => gate.id === "live-receipt").proof,
  "pr-20260807t140000000z-11111111 / bright-data / executed / source trace / search_engine / discover / signature verified"
);
assert.match(summarizeFinalReadiness(complete), /Final-ready/);

const unsignedReceipt = buildFinalReadinessReport({
  ...baseState,
  nativeBuilder: {
    ok: true,
    url: "https://proofrank.nativelyai.app",
    verifiedUrl: "https://proofrank.nativelyai.app/?verify=1",
    liveBundle: "/assets/index-verified.js",
    missingCopy: [],
    staleCopyFound: [],
    renderCheck: {
      ok: true,
      path: "submission/native-builder-render-check.json",
      publishedBundle: "/assets/index-verified.js",
      liveBundle: "/assets/index-verified.js",
      sameBundle: true
    }
  },
  brightAuth: {
    ok: true,
    httpStatus: 200,
    tokenShape: {
      looksLikeUuid: false
    }
  },
  mcpTools: {
    ok: true,
    baseToolsPresent: true,
    sampleTools: ["search_engine", "scrape_as_markdown", "discover"]
  },
  liveApi: {
    ok: true,
    url: "https://proofrank-live.example.com/api/health"
  },
  liveApiSecurity: {
    ok: true,
    unauthenticatedStatus: 401,
    disallowedHostStatus: 422
  },
  liveReceipt: {
    ok: true,
    provider: "bright-data",
    traceStatus: "executed",
    hasSourceTrace: true,
    hasSearchEngine: true,
    hasDiscover: true,
    signed: true,
    signatureVerified: false,
    runId: "pr-forged"
  },
  lablabSubmission: {
    ok: true,
    url: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/silverspoon/submission"
  }
});

assert.equal(unsignedReceipt.canSubmit, false);
assert.equal(unsignedReceipt.gates.find((gate) => gate.id === "live-receipt").status, "needs-action");

console.log("final readiness audit tests passed");
