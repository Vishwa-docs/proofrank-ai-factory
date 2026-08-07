import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { buildVerdict, calculateScores, rankProjects } from "../src/scoring.js";

const proofrank = fixtureProjects.find((project) => project.id === "proofrank");
const countersign = fixtureProjects.find((project) => project.id === "countersign");

const proofrankScores = calculateScores(proofrank);
assert.equal(proofrankScores.brightDataFit, 100);
assert.equal(proofrankScores.businessValue, 100);
assert.ok(proofrankScores.overall >= 85);

const countersignScores = calculateScores(countersign);
assert.equal(countersignScores.brightDataFit, 12);
assert.ok(countersignScores.overall < proofrankScores.overall);

const proofrankVerdict = buildVerdict(proofrank, proofrankScores);
assert.equal(proofrankVerdict.label, "Strong but gated");
assert.ok(proofrankVerdict.risks.includes("Publish public demo before submission"));

const ranked = rankProjects(fixtureProjects);
assert.equal(ranked[0].id, "half-life");
assert.ok(ranked.findIndex((project) => project.id === "proofrank") <= 2);

const reviewBase = {
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
    brightDataTrace: true
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

console.log("scoring tests passed");
