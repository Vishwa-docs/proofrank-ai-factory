import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { buildReviewCoach } from "../src/reviewCoach.js";

const proofrank = fixtureProjects.find((project) => project.id === "proofrank");

const initialCoach = buildReviewCoach(proofrank, {
  reviewStarted: false,
  currentMode: "public",
  reviewFocus: { shortLabel: "Sponsor lens" }
});

assert.equal(initialCoach.badge, "Start here");
assert.equal(initialCoach.title, "Test any public project");
assert.equal(initialCoach.primary.action, "focusRepo");
assert.match(initialCoach.body, /No login/i);
assert.equal(initialCoach.checkpoints.length, 3);

const draftCoach = buildReviewCoach(
  {
    id: "review-brightdata-mcp",
    title: "Bright Data MCP",
    githubUrl: "https://github.com/brightdata/brightdata-mcp",
    demoUrl: "https://brightdata.com/",
    evidence: {
      hasGithub: false,
      hasPublicDemo: false,
      brightDataTools: []
    },
    brightDataTraces: []
  },
  { reviewStarted: true, currentMode: "demo" }
);

assert.equal(draftCoach.badge, "Draft only");
assert.equal(draftCoach.title, "Run public review next");
assert.equal(draftCoach.primary.action, "public");
assert.ok(draftCoach.checkpoints.some((item) => item.state === "pending" && /public evidence/i.test(item.label)));
assert.doesNotMatch(JSON.stringify(draftCoach), /signed proof|submission-ready|certified|proves/i);

const publicCoach = buildReviewCoach(
  {
    ...proofrank,
    id: "review-public",
    evidence: {
      ...proofrank.evidence,
      hasGithub: true,
      hasPublicDemo: true,
      brightDataTools: []
    },
    brightDataTraces: [
      {
        provider: "direct",
        traceStatus: "executed",
        tool: "fetch"
      }
    ],
    runReceipt: null
  },
  { reviewStarted: true, currentMode: "public" }
);

assert.equal(publicCoach.badge, "Public evidence");
assert.equal(publicCoach.primary.action, "live");
assert.match(publicCoach.body, /Bright Data source, search, and discovery/i);

const readyCoach = buildReviewCoach(proofrank, {
  reviewStarted: true,
  currentMode: "live"
});

assert.equal(readyCoach.badge, "Bright Data ready");
assert.equal(readyCoach.title, "Export the reviewer memo");
assert.equal(readyCoach.primary.action, "export");
assert.ok(readyCoach.checkpoints.every((item) => item.state === "ready"));

console.log("review coach tests passed");
