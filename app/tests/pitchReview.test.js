import assert from "node:assert/strict";
import { buildPitchReview } from "../src/pitchReview.js";

const project = {
  id: "draft-project",
  title: "ProofRank",
  evidence: {
    hasPublicDemo: false,
    hasGithub: false,
    isFunctional: false,
    brightDataTraceStatus: "pending"
  },
  brightDataTraces: []
};

const strongTranscript = `
ProofRank is built for hackathon judges and sponsor teams who need to review a crowded field fast.
Paste a GitHub repository and demo link, create a browser-safe draft, then upgrade the project with private Bright Data collection.
Bright Data fetches source pages, runs prior-art search, and discovers adjacent public evidence so every sponsor claim has a trace.
The judge gets a shortlist decision, evidence gaps, business value, originality checks, and an exportable reviewer memo.
The final ask is simple: use ProofRank to make Bright Data-powered review operations defensible.
`;

const strongReview = buildPitchReview(strongTranscript, project);

assert.equal(strongReview.source, "pasted transcript");
assert.equal(strongReview.videoVerified, false);
assert.ok(strongReview.score >= 85);
assert.equal(strongReview.rows.length, 7);
assert.equal(strongReview.rows.find((row) => row.id === "bright-data-evidence").status, "pass");
assert.equal(strongReview.rows.find((row) => row.id === "workflow-shown").status, "pass");
assert.ok(strongReview.evidenceActions.some((action) => /Bright Data/i.test(action)));
assert.ok(strongReview.suggestedOneMinuteFlow.length >= 4);
assert.equal(project.evidence.hasPublicDemo, false);
assert.equal(project.evidence.hasGithub, false);
assert.equal(project.evidence.isFunctional, false);
assert.equal(project.evidence.brightDataTraceStatus, "pending");

const vagueReview = buildPitchReview("This is a cool AI app. It helps people and uses agents. Thanks.", project);

assert.ok(vagueReview.score < 55);
assert.equal(vagueReview.rows.find((row) => row.id === "target-user").status, "needs-evidence");
assert.equal(vagueReview.rows.find((row) => row.id === "bright-data-evidence").status, "needs-evidence");
assert.ok(vagueReview.missing.some((item) => /Bright Data/i.test(item)));
assert.ok(vagueReview.missing.some((item) => /workflow/i.test(item)));

console.log("pitch review tests passed");
