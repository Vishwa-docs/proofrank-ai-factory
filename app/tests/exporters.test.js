import assert from "node:assert/strict";
import { buildReceipt, buildSubmissionPacket } from "../src/exporters.js";

const project = {
  id: "proofrank",
  title: "ProofRank",
  team: "SilverSpoon",
  technologies: ["Bright Data Remote MCP"],
  submissionUrl: "https://example.com/submission",
  demoUrl: "https://example.com/demo",
  githubUrl: "https://github.com/example/proofrank",
  presentationUrl: "https://example.com/deck",
  scores: {
    overall: 88,
    eligibility: 90,
    brightDataFit: 96,
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
  brightDataTraces: [
    {
      mode: "bright-data-request-api",
      provider: "bright-data",
      traceStatus: "executed",
      tool: "scrape_as_markdown"
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
assert.equal(receipt.originalityRadar.riskLabel, "Defensible wedge");
assert.equal(receipt.tribunal.panel.length, 3);
assert.equal(receipt.tribunal.finalRecommendation.label, "Push for sponsor shortlist");
assert.ok(receipt.tribunal.disputes.some((dispute) => dispute.topic === "Sponsor dependency"));

const packet = buildSubmissionPacket(project, [project, adjacentProject]);
assert.match(packet, /Adversarial Tribunal/);
assert.match(packet, /Originality Radar/);
assert.match(packet, /Bright Data trace state: executed/);
assert.match(packet, /Push for sponsor shortlist/);

console.log("exporter tests passed");
