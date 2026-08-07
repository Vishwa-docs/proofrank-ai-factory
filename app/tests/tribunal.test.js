import assert from "node:assert/strict";
import { buildTribunal } from "../src/tribunal.js";

const strongProject = {
  title: "ProofRank",
  scores: {
    overall: 88,
    brightDataFit: 96,
    businessValue: 92,
    originality: 84,
    eligibility: 90
  },
  evidence: {
    hasPublicDemo: true,
    demoWorkflow: true,
    hasGithub: true,
    nativeBuilderExplained: true,
    builtDuringEvent: true,
    brightDataRole: "agentic",
    brightDataTools: ["Remote MCP", "Web Scraper API", "Web Unlocker"],
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
    lowCrowdOverlap: true
  },
  evidenceItems: [{ id: "one" }, { id: "two" }, { id: "three" }],
  brightDataTraces: [
    {
      mode: "bright-data-request-api",
      provider: "bright-data",
      traceStatus: "executed",
      tool: "scrape_as_markdown"
    },
    {
      mode: "bright-data-request-api",
      provider: "bright-data",
      traceStatus: "executed",
      tool: "search_engine"
    }
  ]
};

const strong = buildTribunal(strongProject);
assert.equal(strong.panel.length, 3);
assert.deepEqual(
  strong.panel.map((judge) => judge.role),
  ["Bright Data sponsor judge", "Skeptical hackathon judge", "Business buyer"]
);
assert.equal(strong.finalRecommendation.label, "Push for sponsor shortlist");
assert.ok(strong.finalRecommendation.confidence >= 80);
assert.ok(strong.panel.find((judge) => judge.role === "Bright Data sponsor judge").stance.includes("load-bearing"));
assert.ok(strong.disputes.some((dispute) => dispute.topic === "Sponsor dependency"));

const risky = buildTribunal({
  title: "Thin Demo",
  scores: {
    overall: 51,
    brightDataFit: 12,
    businessValue: 45,
    originality: 30,
    eligibility: 42
  },
  evidence: {
    hasPublicDemo: false,
    demoWorkflow: false,
    hasGithub: true,
    nativeBuilderExplained: false,
    builtDuringEvent: false,
    brightDataRole: "none",
    brightDataTools: [],
    brightDataTrace: false,
    proofReceipt: false,
    repoTreeCollected: false,
    packageManifestPresent: false,
    licensePresent: false,
    secretRiskVisible: true,
    targetUser: false,
    clearPain: false,
    buyerExists: false,
    lowCrowdOverlap: false
  },
  evidenceItems: [],
  brightDataTraces: []
});

assert.equal(risky.finalRecommendation.label, "Hold until evidence improves");
assert.ok(risky.disputes.some((dispute) => dispute.topic === "Eligibility"));
assert.ok(risky.disputes.some((dispute) => dispute.topic === "Public-source hygiene"));
assert.ok(risky.panel.find((judge) => judge.role === "Skeptical hackathon judge").objections.length >= 2);

console.log("tribunal tests passed");
