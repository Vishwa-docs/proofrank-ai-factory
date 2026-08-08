import assert from "node:assert/strict";
import {
  DEFAULT_HACKATHON_PROFILE,
  GENERIC_HACKATHON_PROFILE,
  HACKATHON_PIPELINE_STAGES,
  buildHackathonProfile,
  summarizeHackathonPipeline
} from "../src/hackathonPipeline.js";
import { EVENT_URL } from "../src/fixtures.js";

const aiFactory = buildHackathonProfile(EVENT_URL);
assert.equal(aiFactory.id, DEFAULT_HACKATHON_PROFILE.id);
assert.equal(aiFactory.primarySponsorLane, "Best Agentic Use of Bright Data");
assert.ok(aiFactory.requiredArtifacts.includes("native.builder project or app URL"));
assert.equal(aiFactory.judgingCriteria.reduce((sum, item) => sum + item.weight, 0), 100);

const custom = buildHackathonProfile("https://example.devpost.com/");
assert.equal(custom.id, GENERIC_HACKATHON_PROFILE.id);
assert.equal(custom.eventUrl, "https://example.devpost.com/");
assert.ok(custom.requiredArtifacts.includes("source repository"));
assert.equal(custom.judgingCriteria.reduce((sum, item) => sum + item.weight, 0), 100);

assert.deepEqual(
  HACKATHON_PIPELINE_STAGES.map((stage) => stage.id),
  ["brief", "build", "submit", "triage", "deep-review", "postmortem"]
);
assert.ok(HACKATHON_PIPELINE_STAGES.every((stage) => stage.builderPain && stage.judgePain && stage.proofrankFeature));
assert.ok(HACKATHON_PIPELINE_STAGES.some((stage) => /Scraper Studio|Web Unlocker|Remote MCP/i.test(stage.brightDataUse)));

const summary = summarizeHackathonPipeline(aiFactory);
assert.equal(summary.headline, "AI Factory: Best Agentic Use of Bright Data");
assert.equal(summary.artifactCount, aiFactory.requiredArtifacts.length);
assert.equal(summary.criteriaWeight, 100);
assert.equal(summary.builderLoop.length, 2);
assert.equal(summary.judgeLoop.length, 2);
assert.equal(summary.operatorLoop.length, 2);
assert.ok(summary.sponsorStageCount >= 4);

console.log("hackathon pipeline tests passed");
