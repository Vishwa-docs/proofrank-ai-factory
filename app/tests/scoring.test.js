import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { buildVerdict, calculateScores, rankProjects } from "../src/scoring.js";

const proofrank = fixtureProjects.find((project) => project.id === "proofrank");
const countersign = fixtureProjects.find((project) => project.id === "countersign");

const proofrankScores = calculateScores(proofrank);
assert.equal(proofrankScores.brightDataFit, 72);
assert.ok(proofrankScores.brightDataFit < 75);
assert.ok(proofrankScores.brightDataPrize <= 64);
assert.equal(proofrankScores.businessValue, 100);
assert.ok(proofrankScores.overall >= 85);

const countersignScores = calculateScores(countersign);
assert.equal(countersignScores.brightDataFit, 12);
assert.ok(countersignScores.overall < proofrankScores.overall);

const proofrankVerdict = buildVerdict(proofrank, proofrankScores);
assert.equal(proofrankVerdict.label, "Strong but gated");
assert.ok(!proofrankVerdict.risks.includes("Publish public demo before submission"));
assert.ok(proofrankVerdict.risks.includes("Run at least one executed Bright Data collection trace"));

const ranked = rankProjects(fixtureProjects);
assert.equal(ranked[0].id, "proofrank");

const reviewBase = {
  brightDataTraces: [
    {
      mode: "bright-data-request-api",
      traceStatus: "executed",
      tool: "scrape_as_markdown",
      queryOrUrl: "https://example.com/demo",
      resultCount: 1,
      status: "ok"
    }
  ],
  evidence: {
    hasDemo: true,
    hasPublicDemo: true,
    hasGithub: true,
    hasPresentation: false,
    nativeBuilderExplained: true,
    builtDuringEvent: true,
    isFunctional: true,
    notLandingPage: true,
    demoWorkflow: true,
    conciseSummary: true,
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
    brightDataTools: ["Remote MCP", "Web Scraper API"],
    agenticLoop: true,
    brightDataTrace: true,
    brightDataTraceStatus: "executed"
  }
};

const deepReviewScores = calculateScores({
  ...reviewBase,
  evidence: {
    ...reviewBase.evidence,
    repoTreeCollected: true,
    packageManifestPresent: true,
    licensePresent: true,
    secretRiskVisible: false
  }
});

const shallowReviewScores = calculateScores({
  ...reviewBase,
  evidence: {
    ...reviewBase.evidence,
    repoTreeCollected: false,
    packageManifestPresent: false,
    licensePresent: false,
    secretRiskVisible: true
  }
});

assert.ok(deepReviewScores.eligibility > shallowReviewScores.eligibility);
assert.ok(deepReviewScores.overall > shallowReviewScores.overall);

const riskyVerdict = buildVerdict({ evidence: { ...reviewBase.evidence, secretRiskVisible: true } }, shallowReviewScores);
assert.ok(riskyVerdict.risks.includes("Remove visible secrets or sensitive files from public repo"));

const plannedTraceProject = {
  ...reviewBase,
  brightDataTraces: [
    {
      mode: "planned",
      traceStatus: "planned",
      tool: "scrape_as_markdown",
      queryOrUrl: "https://example.com/demo",
      resultCount: 0,
      status: "server-side replay target"
    }
  ],
  evidence: {
    ...reviewBase.evidence,
    brightDataTrace: false,
    brightDataTraceStatus: "planned"
  }
};

const executedTraceProject = {
  ...reviewBase,
  brightDataTraces: [
    {
      mode: "bright-data-request-api",
      traceStatus: "executed",
      tool: "scrape_as_markdown",
      queryOrUrl: "https://example.com/demo",
      resultCount: 1,
      status: "ok"
    }
  ]
};

const plannedTraceScores = calculateScores(plannedTraceProject);
const executedTraceScores = calculateScores(executedTraceProject);
assert.ok(executedTraceScores.brightDataFit > plannedTraceScores.brightDataFit);
assert.ok(executedTraceScores.brightDataPrize > plannedTraceScores.brightDataPrize);
assert.ok(plannedTraceScores.brightDataPrize <= 64);
assert.ok(executedTraceScores.brightDataPrize >= 86);
assert.ok(buildVerdict(plannedTraceProject, plannedTraceScores).risks.includes("Run at least one executed Bright Data collection trace"));
assert.equal(buildVerdict(executedTraceProject, executedTraceScores).label, "Finalist-ready");

console.log("scoring tests passed");
