import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { buildVerdict, calculateScores, rankProjects } from "../src/scoring.js";

function executedTrace(tool, overrides = {}) {
  return {
    mode: "bright-data-request-api",
    provider: "bright-data",
    traceStatus: "executed",
    tool,
    queryOrUrl: "https://example.com/demo",
    resultCount: 1,
    status: "ok",
    byteCount: 1024,
    contentHash: "abcd1234",
    ...overrides
  };
}

const proofrank = fixtureProjects.find((project) => project.id === "proofrank");
const countersign = fixtureProjects.find((project) => project.id === "countersign");

const proofrankScores = calculateScores(proofrank);
assert.equal(proofrankScores.brightDataFit, 100);
assert.equal(proofrankScores.brightDataPrize, 100);
assert.equal(proofrankScores.businessValue, 100);
assert.equal(proofrankScores.originality, 82);
assert.equal(proofrankScores.overall, 97);

const countersignScores = calculateScores(countersign);
assert.equal(countersignScores.brightDataFit, 12);
assert.ok(countersignScores.overall < proofrankScores.overall);

const proofrankVerdict = buildVerdict(proofrank, proofrankScores);
assert.equal(proofrankVerdict.label, "Strong candidate");
assert.ok(!proofrankVerdict.risks.includes("Publish public demo before submission"));
assert.ok(!proofrankVerdict.risks.includes("Run the Bright Data sponsor evidence bundle"));

const ranked = rankProjects(fixtureProjects);
assert.equal(ranked[0].id, "proofrank");

const reviewBase = {
  brightDataTraces: [executedTrace("scrape_as_markdown")],
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
  brightDataTraces: [executedTrace("scrape_as_markdown")]
};

const sponsorBundleProject = {
  ...reviewBase,
  brightDataTraces: [
    executedTrace("scrape_as_markdown"),
    executedTrace("search_engine", {
      queryOrUrl: "\"ProofRank\" \"Bright Data\" hackathon",
      contentHash: "ef567890"
    }),
    executedTrace("discover", {
      queryOrUrl: "\"ProofRank\" \"Bright Data\" hackathon originality",
      contentHash: "1234abcd"
    })
  ]
};

const plannedTraceScores = calculateScores(plannedTraceProject);
const executedTraceScores = calculateScores(executedTraceProject);
const sponsorBundleScores = calculateScores(sponsorBundleProject);
assert.ok(executedTraceScores.brightDataFit > plannedTraceScores.brightDataFit);
assert.ok(executedTraceScores.brightDataPrize > plannedTraceScores.brightDataPrize);
assert.ok(plannedTraceScores.brightDataPrize <= 64);
assert.ok(executedTraceScores.brightDataPrize <= 78);
assert.ok(sponsorBundleScores.brightDataPrize >= 86);
assert.ok(buildVerdict(plannedTraceProject, plannedTraceScores).risks.includes("Run the Bright Data sponsor evidence bundle"));
assert.ok(buildVerdict(executedTraceProject, executedTraceScores).risks.includes("Complete the Bright Data sponsor evidence bundle"));
assert.equal(buildVerdict(sponsorBundleProject, sponsorBundleScores).label, "Strong candidate");

console.log("scoring tests passed");
