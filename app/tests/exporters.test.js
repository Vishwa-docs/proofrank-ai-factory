import assert from "node:assert/strict";
import { buildReceipt, buildSubmissionPacket, toCsv } from "../src/exporters.js";

const project = {
  id: "proofrank",
  title: "ProofRank",
  team: "SilverSpoon",
  technologies: ["Bright Data Remote MCP"],
  submissionUrl: "https://example.com/submission",
  demoUrl: "https://example.com/demo",
  nativeBuilderUrl: "https://proofrank.nativelyai.app/",
  githubUrl: "https://github.com/example/proofrank",
  presentationUrl: "https://example.com/deck",
  scores: {
    overall: 88,
    eligibility: 90,
    brightDataFit: 96,
    brightDataPrize: 98,
    businessValue: 91,
    originality: 82,
    presentation: 85
  },
  verdict: {
    label: "Finalist-ready",
    action: "Shortlist for judge review",
    risks: []
  },
  evidence: {
    hasDemo: true,
    hasPublicDemo: true,
    demoWorkflow: true,
    hasGithub: true,
    nativeBuilderExplained: true,
    builtDuringEvent: true,
    brightDataRole: "agentic",
    brightDataTools: ["Remote MCP", "Web Scraper API"],
    brightDataTrace: true,
    brightDataTraceStatus: "executed",
    proofReceipt: true,
    repoTreeCollected: true,
    packageManifestPresent: true,
    licensePresent: true,
    secretRiskVisible: false,
    targetUser: true,
    clearPain: true,
    buyerExists: true,
    repeatableWorkflow: true,
    lowCrowdOverlap: true
  },
  evidenceItems: [{ id: "receipt-1" }],
  runReceipt: {
    issuer: "ProofRank live reviewer",
    issuedAt: "2026-08-07T12:00:00.000Z",
    runId: "pr-20260807t120000000z-1a2b3c4d",
    collectionMode: "bright-data-mcp",
    provider: "bright-data",
    traceCount: 3,
    executedTraceCount: 3,
    tools: ["scrape_as_markdown", "search_engine", "discover"],
    traceDigest: "1a2b3c4d",
    replayCommand: "PROOFRANK_FETCH_MODE=mcp npm run live:smoke -- https://github.com/example/proofrank https://example.com/demo"
  },
  brightDataTraces: [
    {
      mode: "bright-data-request-api",
      provider: "bright-data",
      traceStatus: "executed",
      tool: "scrape_as_markdown",
      queryOrUrl: "https://github.com/example/proofrank",
      resultCount: 1,
      byteCount: 2048,
      contentHash: "abcd1234"
    },
    {
      mode: "bright-data-request-api",
      provider: "bright-data",
      traceStatus: "executed",
      tool: "search_engine",
      queryOrUrl: "\"ProofRank\" \"Bright Data\" hackathon",
      resultCount: 1,
      byteCount: 1024,
      contentHash: "ef567890"
    },
    {
      mode: "bright-data-request-api",
      provider: "bright-data",
      traceStatus: "executed",
      tool: "discover",
      queryOrUrl: "\"ProofRank\" \"Bright Data\" originality",
      resultCount: 1,
      byteCount: 1536,
      contentHash: "1234abcd"
    }
  ]
};

const adjacentProject = {
  ...project,
  id: "adjacent",
  title: "Adjacent Proof Tool",
  team: "Another Team",
  summary: "A proof receipt tool for judges."
};

const receipt = buildReceipt(project, [project, adjacentProject]);
assert.equal(receipt.traceState, "executed");
assert.equal(receipt.runReceipt.runId, "pr-20260807t120000000z-1a2b3c4d");
assert.equal(receipt.runReceipt.traceDigest, "1a2b3c4d");
assert.equal(receipt.scores.brightDataPrize, 98);
assert.equal(receipt.readiness.sponsorProofReady, true);
assert.equal(receipt.readiness.nativeBuilderReady, true);
assert.equal(receipt.readiness.proofPackageReady, true);
assert.equal(receipt.readiness.lablabSubmissionComplete, false);
assert.equal(receipt.readiness.canSubmit, false);
assert.ok(receipt.readiness.nextActions.some((action) => /lablab.ai account/i.test(action)));
assert.equal(receipt.readiness.gates.find((gate) => gate.id === "bright-data").status, "passed");
assert.equal(receipt.urls.nativeBuilder, "https://proofrank.nativelyai.app/");
assert.equal(receipt.originalityRadar.riskLabel, "Distinct angle");
assert.equal(receipt.tribunal.panel.length, 3);
assert.equal(receipt.tribunal.finalRecommendation.label, "Push for sponsor shortlist");
assert.ok(receipt.tribunal.disputes.some((dispute) => dispute.topic === "Sponsor dependency"));

const packet = buildSubmissionPacket(project, [project, adjacentProject]);
assert.match(packet, /Review Panel/);
assert.match(packet, /Similarity Check/);
assert.match(packet, /Readiness Checklist/);
assert.match(packet, /Bright Data evidence state: executed/);
assert.match(packet, /Bright Data prize score: 98/);
assert.match(packet, /Evidence report: pr-20260807t120000000z-1a2b3c4d/);
assert.match(packet, /Replay command: PROOFRANK_FETCH_MODE=mcp npm run live:smoke/);
assert.match(packet, /Evidence package readiness: Evidence package ready/);
assert.doesNotMatch(packet, /Submission readiness:/);
assert.doesNotMatch(packet, /submission-safe/i);
assert.match(packet, /Primary submission status: NATIVE\.BUILDER PRIMARY/);
assert.match(packet, /Evidence: https:\/\/proofrank\.nativelyai\.app\//);
assert.match(packet, /Push for sponsor shortlist/);

const csv = toCsv([project]);
assert.match(csv.split("\n")[0], /brightDataPrize/);
assert.match(csv, /,98,/);

console.log("exporter tests passed");
