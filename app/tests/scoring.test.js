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

console.log("scoring tests passed");
