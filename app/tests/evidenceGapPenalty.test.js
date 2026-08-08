import assert from "node:assert/strict";
import { buildEvidenceGapPenalty } from "../src/evidenceGapPenalty.js";
import { scoreProject } from "../src/scoring.js";

const strong = scoreProject({
  id: "strong",
  title: "Strong Evidence",
  demoUrl: "https://demo.example",
  githubUrl: "https://github.com/example/strong",
  evidence: {
    hasDemo: true,
    hasPublicDemo: true,
    demoWorkflow: true,
    hasGithub: true,
    hasPresentation: true,
    nativeBuilderExplained: true,
    builtDuringEvent: true,
    isFunctional: true,
    notLandingPage: true,
    repoTreeCollected: true,
    packageManifestPresent: true,
    licensePresent: true,
    targetUser: true,
    clearPain: true,
    repeatableWorkflow: true,
    buyerExists: true,
    urgency: true,
    differentiation: true,
    lowCrowdOverlap: true,
    proofReceipt: true,
    specificWedge: true,
    nonGenericAgent: true,
    brightDataRole: "agentic",
    brightDataTools: ["Bright Data MCP Server", "Bright Data SERP API", "Bright Data Web Scraper API"],
    agenticLoop: true
  },
  brightDataTraces: [
    {
      provider: "bright-data",
      traceStatus: "executed",
      tool: "scrape_as_markdown",
      resultCount: 1,
      byteCount: 1000,
      contentHash: "abc12345"
    },
    {
      provider: "bright-data",
      traceStatus: "executed",
      tool: "search_engine",
      resultCount: 3,
      byteCount: 1000,
      contentHash: "abc12346"
    },
    {
      provider: "bright-data",
      traceStatus: "executed",
      tool: "discover",
      resultCount: 2,
      byteCount: 1000,
      contentHash: "abc12347"
    }
  ]
});

const strongPenalty = buildEvidenceGapPenalty(strong);
assert.equal(strongPenalty.totalPenalty, 0);
assert.equal(strongPenalty.status, "Defensible shortlist");
assert.equal(strongPenalty.adjustedScore, strongPenalty.baseScore);
assert.ok(strongPenalty.dimensions.every((item) => item.status === "clear"));

const draft = scoreProject({
  id: "draft",
  title: "Draft Project",
  githubUrl: "https://github.com/example/draft",
  demoUrl: "https://draft.example",
  evidence: {
    hasDemo: true,
    hasPublicDemo: false,
    hasGithub: false,
    conciseSummary: true,
    brightDataTraceStatus: "pending",
    brightDataTools: []
  },
  brightDataTraces: []
});

const draftPenalty = buildEvidenceGapPenalty(draft);
assert.equal(draftPenalty.status, "Evidence gap blocks advancement");
assert.ok(draftPenalty.totalPenalty >= 50);
assert.ok(draftPenalty.adjustedScore < draftPenalty.baseScore);
assert.ok(draftPenalty.dimensions.find((item) => item.label === "Bright Data depth").penalty >= 16);
assert.match(draftPenalty.topAction, /Claim|Bright Data|Run|Collect|Attach|Name/);

const risky = scoreProject({
  id: "risky",
  title: "Risky Repo",
  githubUrl: "https://github.com/example/risky",
  evidence: {
    hasGithub: true,
    repoTreeCollected: true,
    packageManifestPresent: true,
    licensePresent: true,
    builtDuringEvent: true,
    secretRiskVisible: true,
    brightDataTraceStatus: "planned",
    brightDataTools: ["Bright Data MCP Server"]
  }
});

const riskyPenalty = buildEvidenceGapPenalty(risky);
const repoEvidence = riskyPenalty.dimensions.find((item) => item.label === "Repo evidence");
assert.equal(repoEvidence.status, "blocker");
assert.match(repoEvidence.reason, /secret-risk/i);
assert.ok(riskyPenalty.totalPenalty >= repoEvidence.penalty);

console.log("evidence gap penalty tests passed");
