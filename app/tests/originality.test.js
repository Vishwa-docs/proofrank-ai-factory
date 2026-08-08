import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { buildOriginalityRadar } from "../src/originality.js";

const proofrank = fixtureProjects.find((project) => project.id === "proofrank");
const radar = buildOriginalityRadar(proofrank, fixtureProjects);

assert.equal(radar.riskLabel, "Distinct angle");
assert.ok(radar.score >= 75);
assert.ok(radar.similarProjects.length >= 3);
assert.ok(radar.similarProjects.every((project) => project.id !== "proofrank"));
assert.ok(radar.differentiators.some((item) => item.includes("evidence receipts") || item.includes("review panel")));
assert.ok(radar.brightDataQueries.some((query) => query.tool === "search_engine" && query.query.includes("ProofRank")));
assert.ok(radar.brightDataQueries.some((query) => query.tool === "discover"));

const clone = {
  ...proofrank,
  id: "proofrank-copy",
  title: "ProofRank Copy",
  team: "Copy Team"
};

const cloneRadar = buildOriginalityRadar(clone, [proofrank, ...fixtureProjects.filter((project) => project.id !== "proofrank")]);

assert.equal(cloneRadar.riskLabel, "High overlap risk");
assert.ok(cloneRadar.score < 55);
assert.equal(cloneRadar.similarProjects[0].id, "proofrank");
assert.ok(cloneRadar.similarProjects[0].overlap >= 80);

const singleProjectRadar = buildOriginalityRadar(proofrank, [proofrank]);
assert.equal(singleProjectRadar.riskLabel, "Needs broader prior-art field");
assert.equal(singleProjectRadar.score, 82);
assert.equal(singleProjectRadar.similarProjects.length, 0);

console.log("originality tests passed");
