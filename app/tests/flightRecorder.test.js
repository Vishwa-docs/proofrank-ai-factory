import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { buildFlightRecorder } from "../src/flightRecorder.js";

const proofrank = fixtureProjects.find((project) => project.id === "proofrank");
const readyRecorder = buildFlightRecorder(proofrank, { now: "2026-08-08T09:30:00.000Z" });

assert.equal(readyRecorder.badge, "Bright Data flight recorder");
assert.equal(readyRecorder.sponsorEvidence, "ready");
assert.equal(readyRecorder.stages.length, 4);
assert.deepEqual(
  readyRecorder.stages.map((stage) => stage.state),
  ["executed", "executed", "executed", "saved"]
);
assert.ok(readyRecorder.stages.every((stage) => stage.countsForSponsor === true));
assert.match(readyRecorder.digest, /saved review/i);
assert.equal(readyRecorder.freshness.state, "fresh");
assert.match(readyRecorder.freshness.label, /Fresh as of/i);

const publicOnly = buildFlightRecorder({
  ...proofrank,
  id: "review-public",
  brightDataTraces: [
    {
      provider: "direct",
      traceStatus: "executed",
      tool: "fetch",
      queryOrUrl: "https://github.com/brightdata/brightdata-mcp",
      resultCount: 1,
      status: "direct public fetch"
    }
  ],
  runReceipt: null,
  evidence: {
    ...proofrank.evidence,
    brightDataTools: [],
    hasGithub: true,
    hasPublicDemo: true
  }
});

assert.equal(publicOnly.sponsorEvidence, "gated");
assert.ok(publicOnly.stages.some((stage) => stage.state === "public-only"));
assert.match(publicOnly.digest, /public review/i);
assert.equal(publicOnly.freshness.state, "public-only");
assert.match(publicOnly.freshness.detail, /Run Bright Data/i);
assert.doesNotMatch(JSON.stringify(publicOnly), /signed proof|certified|submission-ready|proves/i);

const draft = buildFlightRecorder({
  id: "review-draft",
  githubUrl: "https://github.com/brightdata/brightdata-mcp",
  demoUrl: "https://brightdata.com/",
  evidence: { hasGithub: false, hasPublicDemo: false, brightDataTools: [] },
  brightDataTraces: [],
  runReceipt: null
});

assert.equal(draft.sponsorEvidence, "not run");
assert.ok(draft.stages.every((stage) => stage.state === "planned"));
assert.match(draft.digest, /No Bright Data calls/i);
assert.equal(draft.freshness.state, "waiting");

console.log("flight recorder tests passed");
