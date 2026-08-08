import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { buildPrizeBrief } from "../src/prizeBrief.js";

const proofrank = fixtureProjects.find((project) => project.id === "proofrank");
const proofrankBrief = buildPrizeBrief(proofrank, { totalProjects: fixtureProjects.length });

assert.equal(proofrankBrief.badge, "Bright Data prize case");
assert.equal(proofrankBrief.title, "Shortlist for sponsor review");
assert.match(proofrankBrief.summary, /source, search, and discovery/i);
assert.match(proofrankBrief.summary, /trace-backed sponsor memo/i);
assert.equal(proofrankBrief.actions[0].action, "export");
assert.equal(proofrankBrief.lanes.length, 3);
assert.deepEqual(
  proofrankBrief.lanes.map((lane) => lane.status),
  ["Ready", "Distinct", "Useful"]
);
assert.ok(proofrankBrief.fieldPressure.some((item) => /competing live-web products/i.test(item.detail)));

const publicOnly = buildPrizeBrief({
  ...proofrank,
  id: "review-public-project",
  brightDataTraces: [],
  evidence: {
    ...proofrank.evidence,
    proofReceipt: false,
    brightDataRole: "supporting",
    brightDataTools: [],
    hasPublicDemo: true,
    hasGithub: true
  },
  runReceipt: null
});

assert.equal(publicOnly.badge, "Prize case gated");
assert.equal(publicOnly.title, "Upgrade the evidence story");
assert.equal(publicOnly.actions[0].action, "live");
assert.match(publicOnly.lanes[0].detail, /Bright Data/i);

const draft = buildPrizeBrief({
  id: "review-brightdata-mcp",
  title: "Bright Data MCP",
  summary: "Public repo supplied.",
  demoUrl: "https://brightdata.com/",
  githubUrl: "https://github.com/brightdata/brightdata-mcp",
  technologies: ["Bright Data MCP Server"],
  evidence: {
    hasDemo: true,
    hasPublicDemo: false,
    hasGithub: false,
    brightDataRole: "planned",
    brightDataTools: [],
    proofReceipt: false,
    lowCrowdOverlap: false
  },
  evidenceItems: [],
  brightDataTraces: [],
  scores: {
    brightDataPrize: 0
  },
  verdict: {
    label: "Needs review",
    risks: []
  }
});

assert.equal(draft.badge, "Link-only draft");
assert.equal(draft.title, "Collect evidence before judging");
assert.equal(draft.actions[0].action, "public");
assert.ok(draft.summary.includes("not a ranking score"));
assert.ok(!/certified|proves|submission-ready|signed proof/i.test(JSON.stringify(draft)));

console.log("prize brief tests passed");
