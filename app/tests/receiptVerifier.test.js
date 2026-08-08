import assert from "node:assert/strict";
import { verifyReceiptRecord } from "../src/receiptVerifier.js";

const traces = [
  {
    provider: "bright-data",
    traceStatus: "executed",
    tool: "scrape_as_markdown",
    queryOrUrl: "https://github.com/example/proofrank",
    resultCount: 1,
    byteCount: 2048,
    contentHash: "abcd1234"
  },
  {
    provider: "bright-data",
    traceStatus: "executed",
    tool: "search_engine",
    queryOrUrl: "\"ProofRank\" \"Bright Data\"",
    resultCount: 3,
    byteCount: 1024,
    contentHash: "ef567890"
  },
  {
    provider: "bright-data",
    traceStatus: "executed",
    tool: "discover",
    queryOrUrl: "\"ProofRank\" hackathon reviewer",
    resultCount: 2,
    byteCount: 1536,
    contentHash: "1234abcd"
  }
];

function contentHash(value = "") {
  const text = String(value || "");
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function traceDigest(rows) {
  return contentHash(rows.map((trace) => `${trace.provider}|${trace.tool}|${trace.traceStatus}|${trace.queryOrUrl}|${trace.byteCount}|${trace.contentHash}`).join("\n"));
}

const validReceipt = {
  title: "ProofRank",
  runReceipt: {
    runId: "pr-test",
    traceDigest: traceDigest(traces),
    signature: "hmac-sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  },
  brightDataTraces: traces,
  claimLedger: [{ status: "Verified", claim: "Bright Data source trace exists" }]
};

const valid = verifyReceiptRecord(validReceipt);
assert.equal(valid.ok, true);
assert.equal(valid.sponsorTraceCount, 3);
assert.equal(valid.unsupportedClaims, 0);
assert.ok(valid.warnings.some((item) => /Signature format/i.test(item)));
assert.ok(valid.checks.some((item) => item.label === "Trace digest" && item.status === "passed"));

const broken = verifyReceiptRecord({
  ...validReceipt,
  runReceipt: {
    ...validReceipt.runReceipt,
    traceDigest: "bad-digest",
    signature: ""
  },
  brightDataTraces: traces.slice(0, 1),
  claimLedger: [{ status: "Needs proof", claim: "Search ran" }]
});

assert.equal(broken.ok, false);
assert.ok(broken.failures.some((item) => /Search/i.test(item)));
assert.ok(broken.failures.some((item) => /Discovery/i.test(item)));
assert.ok(broken.failures.some((item) => /Trace digest/i.test(item)));
assert.ok(broken.failures.some((item) => /Claim support/i.test(item)));

const invalid = verifyReceiptRecord("{not json");
assert.equal(invalid.ok, false);
assert.match(invalid.title, /could not be parsed/i);

console.log("receipt verifier tests passed");
