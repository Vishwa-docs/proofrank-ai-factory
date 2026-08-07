import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { scoreProject } from "../src/scoring.js";
import { buildClaimLedger } from "../src/claims.js";

const proofrank = scoreProject(fixtureProjects.find((project) => project.id === "proofrank"));
const countersign = scoreProject(fixtureProjects.find((project) => project.id === "countersign"));

const proofrankClaims = buildClaimLedger(proofrank);
assert.equal(proofrankClaims.find((claim) => claim.claim === "Bright Data is load-bearing").status, "Verified");
assert.equal(proofrankClaims.find((claim) => claim.claim === "Public demo is reachable and shows a workflow").status, "Weak Evidence");

const countersignClaims = buildClaimLedger(countersign);
assert.equal(countersignClaims.find((claim) => claim.claim === "Bright Data is load-bearing").status, "Not Found");

console.log("claims tests passed");
