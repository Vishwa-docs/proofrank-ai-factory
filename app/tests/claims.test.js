import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { scoreProject } from "../src/scoring.js";
import { buildClaimLedger } from "../src/claims.js";

const proofrank = scoreProject(fixtureProjects.find((project) => project.id === "proofrank"));
const countersign = scoreProject(fixtureProjects.find((project) => project.id === "countersign"));

const proofrankClaims = buildClaimLedger(proofrank);
assert.equal(proofrankClaims.find((claim) => claim.claim === "Bright Data is load-bearing").status, "Weak Evidence");
assert.equal(proofrankClaims.find((claim) => claim.claim === "Public demo is reachable and shows a workflow").status, "Verified");

const countersignClaims = buildClaimLedger(countersign);
assert.equal(countersignClaims.find((claim) => claim.claim === "Bright Data is load-bearing").status, "Not Found");

const sourceProofClaims = buildClaimLedger(
  scoreProject({
    id: "live-review",
    evidence: {
      hasPublicDemo: true,
      demoWorkflow: true,
      nativeBuilderExplained: true,
      brightDataRole: "agentic",
      brightDataTools: ["Remote MCP"],
      brightDataTrace: true,
      brightDataTraceStatus: "executed",
      proofReceipt: true,
      differentiation: true,
      lowCrowdOverlap: true,
      repoTreeCollected: true,
      packageManifestPresent: true,
      licensePresent: true,
      builtDuringEvent: true,
      secretRiskVisible: false
    },
    brightDataTraces: [
      {
        mode: "bright-data-request-api",
        provider: "bright-data",
        traceStatus: "executed",
        tool: "Remote MCP"
      }
    ]
  })
);

assert.equal(sourceProofClaims.find((claim) => claim.claim === "Repository evidence is reproducible").status, "Verified");

const riskySourceClaims = buildClaimLedger(
  scoreProject({
    id: "risky-review",
    evidence: {
      repoTreeCollected: true,
      packageManifestPresent: true,
      licensePresent: false,
      builtDuringEvent: false,
      secretRiskVisible: true
    }
  })
);

assert.equal(riskySourceClaims.find((claim) => claim.claim === "Repository evidence is reproducible").status, "Needs Proof");

console.log("claims tests passed");
