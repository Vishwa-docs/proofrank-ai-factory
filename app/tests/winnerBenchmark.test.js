import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { buildWinnerBenchmark } from "../src/winnerBenchmark.js";

function executedTrace(tool, overrides = {}) {
  return {
    provider: "bright-data",
    traceStatus: "executed",
    tool,
    queryOrUrl: "https://github.com/example/project",
    resultCount: 1,
    countsForSponsorFit: true,
    byteCount: 2048,
    contentHash: "abcd1234",
    ...overrides
  };
}

const proofrank = fixtureProjects.find((project) => project.id === "proofrank");
const current = buildWinnerBenchmark(proofrank);

assert.equal(current.tier, "Sponsor-prize ready");
assert.ok(current.score >= 90);
assert.equal(current.gaps.length, 0);
assert.ok(!current.gaps.some((gap) => /native\.builder/i.test(gap.action)));
assert.ok(current.matches.some((match) => match.id === "judge-visible-proof"));
assert.ok(current.matches.some((match) => match.id === "decision-work-product"));
assert.ok(current.matches.some((match) => match.id === "native-builder-primary"));
assert.ok(current.matches.some((match) => match.id === "executed-live-web"));

const finalist = buildWinnerBenchmark({
  ...proofrank,
  demoUrl: "https://proofrank.nativelyai.app",
  nativeBuilderUrl: "https://proofrank.nativelyai.app",
  evidence: {
    ...proofrank.evidence,
    nativeBuilderPublished: true,
    repoMetadataCollected: true,
    repoTreeCollected: true,
    packageManifestPresent: true,
    licensePresent: true
  },
  runReceipt: {
    runId: "proofrank-final",
    signature: "signed"
  },
  brightDataTraces: [
    executedTrace("scrape_as_markdown"),
    executedTrace("search_engine", {
      queryOrUrl: "\"ProofRank\" \"Bright Data\" hackathon",
      contentHash: "ef567890"
    }),
    executedTrace("discover", {
      queryOrUrl: "\"ProofRank\" \"Bright Data\" originality",
      contentHash: "1234abcd"
    })
  ]
});

assert.equal(finalist.tier, "Sponsor-prize ready");
assert.ok(finalist.score >= 90);
assert.equal(finalist.gaps.length, 0);
assert.ok(finalist.matches.some((match) => match.id === "executed-live-web"));

const generic = buildWinnerBenchmark({
  id: "generic-chatbot",
  title: "Generic Chatbot",
  summary: "Answers questions with AI.",
  demoUrl: "",
  githubUrl: "",
  technologies: ["ChatGPT"],
  evidence: {
    hasDemo: false,
    hasPublicDemo: false,
    hasGithub: false,
    proofReceipt: false,
    brightDataRole: "none",
    brightDataTools: [],
    agenticLoop: false,
    specificWedge: false,
    nonGenericAgent: false,
    lowCrowdOverlap: false,
    secretRiskVisible: false
  },
  evidenceItems: [],
  brightDataTraces: []
});

assert.equal(generic.tier, "Not prize-shaped");
assert.ok(generic.score < 35);
assert.ok(generic.gaps.length >= 4);

console.log("winner benchmark tests passed");
