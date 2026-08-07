import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  assertFinalBrightDataReceipt,
  assertOfficialBrightDataMcpEndpoint,
  buildFinalReceiptGate,
  resolveFinalReceiptOutputPath
} from "../src/finalReceipt.js";

const signingSecret = "unit-test-final-receipt-secret";

function contentHash(value = "") {
  const text = String(value || "");
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function traceDigest(traces) {
  return contentHash(
    traces
      .map((trace) => `${trace.provider}|${trace.tool}|${trace.traceStatus}|${trace.queryOrUrl}|${trace.byteCount}|${trace.contentHash}`)
      .join("\n")
  );
}

function signRunReceipt(runReceipt) {
  const payload = JSON.stringify({
    runId: runReceipt.runId,
    issuedAt: runReceipt.issuedAt,
    collectionMode: runReceipt.collectionMode,
    provider: runReceipt.provider,
    traceCount: runReceipt.traceCount,
    executedTraceCount: runReceipt.executedTraceCount,
    tools: runReceipt.tools,
    traceDigest: runReceipt.traceDigest,
    replayCommand: runReceipt.replayCommand
  });
  return {
    ...runReceipt,
    signature: `hmac-sha256:${createHmac("sha256", signingSecret).update(payload).digest("hex")}`
  };
}

function buildRunReceipt(traces, overrides = {}) {
  const executedTraces = traces.filter((trace) => trace.traceStatus === "executed");
  return signRunReceipt({
    issuer: "ProofRank live reviewer",
    issuedAt: "2026-08-07T14:00:00.000Z",
    runId: `pr-20260807t140000000z-${traceDigest(traces)}`,
    collectionMode: "bright-data-mcp",
    provider: "bright-data",
    traceCount: traces.length,
    executedTraceCount: executedTraces.length,
    tools: [...new Set(traces.map((trace) => trace.tool))],
    traceDigest: traceDigest(traces),
    replayCommand: "PROOFRANK_FETCH_MODE=mcp npm run live:smoke -- https://github.com/Vishwa-docs/proofrank-ai-factory https://vishwa-docs.github.io/proofrank-ai-factory/",
    ...overrides
  });
}

const validTraces = [
  {
    provider: "bright-data",
    traceStatus: "executed",
    tool: "scrape_as_markdown",
    queryOrUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory",
    resultCount: 1,
    byteCount: 2048,
    contentHash: "abcd1234"
  },
  {
    provider: "bright-data",
    traceStatus: "executed",
    tool: "search_engine",
    queryOrUrl: "\"ProofRank\" \"Bright Data\" hackathon originality",
    resultCount: 1,
    byteCount: 1024,
    contentHash: "ef567890"
  },
  {
    provider: "bright-data",
    traceStatus: "executed",
    tool: "discover",
    queryOrUrl: "\"ProofRank\" \"Bright Data\" hackathon originality",
    resultCount: 1,
    byteCount: 1536,
    contentHash: "1234abcd"
  }
];

const validProject = {
  title: "ProofRank AI Factory",
  runReceipt: buildRunReceipt(validTraces),
  brightDataTraces: validTraces
};

const validGate = buildFinalReceiptGate(validProject, { signingSecret });
assert.equal(validGate.ok, true);
assert.deepEqual(validGate.failures, []);
assert.equal(validGate.provider, "bright-data");
assert.equal(validGate.traceStatus, "executed");
assert.equal(validGate.hasSourceTrace, true);
assert.equal(validGate.hasSearchEngine, true);
assert.equal(validGate.hasDiscover, true);
assert.equal(validGate.signed, true);
assert.equal(validGate.signatureVerified, true);
assert.equal(validGate.traceDigestVerified, true);
assert.equal(validGate.runId, `pr-20260807t140000000z-${traceDigest(validTraces)}`);
assert.doesNotThrow(() => assertFinalBrightDataReceipt(validProject, { signingSecret }));

const directOnly = {
  ...validProject,
  runReceipt: buildRunReceipt(validTraces, { runId: "pr-direct", provider: "direct", collectionMode: "direct-fetch" }),
  brightDataTraces: validProject.brightDataTraces.map((trace) => ({
    ...trace,
    provider: "direct"
  }))
};

const directGate = buildFinalReceiptGate(directOnly, { signingSecret });
assert.equal(directGate.ok, false);
assert.ok(directGate.failures.includes("no executed Bright Data source scrape trace"));
assert.throws(() => assertFinalBrightDataReceipt(directOnly, { signingSecret }), /no executed Bright Data source scrape trace/);

const missingSearch = {
  ...validProject,
  brightDataTraces: [validProject.brightDataTraces[0]]
};
assert.ok(buildFinalReceiptGate(missingSearch, { signingSecret }).failures.includes("no executed Bright Data search_engine trace"));

const missingDiscover = {
  ...validProject,
  brightDataTraces: [validProject.brightDataTraces[0], validProject.brightDataTraces[1]]
};
missingDiscover.runReceipt = buildRunReceipt(missingDiscover.brightDataTraces);
assert.ok(buildFinalReceiptGate(missingDiscover, { signingSecret }).failures.includes("no executed Bright Data discover trace"));

const searchOnly = {
  ...validProject,
  brightDataTraces: [validProject.brightDataTraces[1]],
  runReceipt: buildRunReceipt([validProject.brightDataTraces[1]])
};
assert.ok(buildFinalReceiptGate(searchOnly, { signingSecret }).failures.includes("no executed Bright Data source scrape trace"));

const emptySourceTrace = {
  ...validProject,
  brightDataTraces: [
    {
      ...validProject.brightDataTraces[0],
      resultCount: 0,
      byteCount: 0
    },
    validProject.brightDataTraces[1]
  ]
};
emptySourceTrace.runReceipt = buildRunReceipt(emptySourceTrace.brightDataTraces);
assert.ok(buildFinalReceiptGate(emptySourceTrace, { signingSecret }).failures.includes("no executed Bright Data source scrape trace"));

const unsigned = {
  ...validProject,
  runReceipt: {
    runId: "pr-unsigned"
  }
};
assert.ok(buildFinalReceiptGate(unsigned, { signingSecret }).failures.includes("run receipt is not signed"));

const forgedSignature = {
  ...validProject,
  runReceipt: {
    ...validProject.runReceipt,
    signature: "hmac-sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  }
};
assert.ok(buildFinalReceiptGate(forgedSignature, { signingSecret }).failures.includes("run receipt signature is invalid"));

const mismatchedDigest = {
  ...validProject,
  brightDataTraces: [
    {
      ...validProject.brightDataTraces[0],
      byteCount: 4096
    },
    validProject.brightDataTraces[1]
  ]
};
assert.ok(buildFinalReceiptGate(mismatchedDigest, { signingSecret }).failures.includes("run receipt trace digest does not match traces"));

const missingSigningSecret = buildFinalReceiptGate(validProject);
assert.ok(missingSigningSecret.failures.includes("receipt signing secret is required to verify signature"));

assert.doesNotThrow(() => assertOfficialBrightDataMcpEndpoint("https://mcp.brightdata.com/mcp?token=redacted"));
assert.throws(() => assertOfficialBrightDataMcpEndpoint("https://mcp.example/mcp?token=redacted"), /official Bright Data MCP endpoint/);

assert.equal(
  resolveFinalReceiptOutputPath("/repo", {}, true),
  "/tmp/proofrank-final-brightdata-receipt-debug.json"
);
assert.equal(
  resolveFinalReceiptOutputPath("/repo", {}, false),
  "/repo/submission/final-brightdata-receipt.json"
);
assert.throws(
  () => resolveFinalReceiptOutputPath("/repo", { PROOFRANK_LIVE_RECEIPT_PATH: "submission/final-brightdata-receipt.json" }, true),
  /refuses to write the canonical/
);

console.log("final receipt tests passed");
