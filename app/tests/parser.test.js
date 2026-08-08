import assert from "node:assert/strict";
import { decodeHtml, extractProjectsFromHtml, stripTags } from "../src/parser.js";

assert.equal(decodeHtml("Bright Data &amp; native.builder"), "Bright Data & native.builder");
assert.equal(stripTags("<p>Ask <strong>anything</strong></p>"), "Ask anything");

const sample = `
  <a href="/ai-hackathons/nativebuilder-build-without-limits/team-x/project-y">
    <h2>Project Y</h2>
    <p>Agent workflow that uses Bright Data Web Scraper API to verify public claims for judges.</p>
    <span>Team X</span>
    <span>Team X</span>
    <span>Bright Data Web Scraper API</span>
    <span>AI/ML API</span>
  </a>
`;

const projects = extractProjectsFromHtml(sample);
assert.equal(projects.length, 1);
assert.equal(projects[0].title, "Project Y");
assert.equal(projects[0].team, "Team X");
assert.ok(projects[0].technologies.includes("Bright Data Web Scraper API"));
assert.equal(projects[0].evidence.brightDataRole, "supporting");
assert.equal(projects[0].evidence.brightDataTrace, false);
assert.equal(projects[0].evidence.brightDataTraceStatus, "claimed");
assert.equal(projects[0].brightDataTraces[0].traceStatus, "claimed");

const markdownSample = `
## Submitted concepts, prototypes and pitches

![Half-Life](https://example.com/half-life.png)
[Half-Life - Decisions That Stopped Being True](https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/kaizu/half-life-decisions-that-stopped-being-true)
Half-Life records why a decision was made, re-checks those assumptions against the live web on each one's own schedule, and retracts the decision when a premise fails.
Kaizu
Bright Data Datasets
AI/ML API
Speechmatics api

[CivicTwin - Proof-Carrying Rule Twin](/ai-hackathons/nativebuilder-build-without-limits/purrwolf/civictwin-proof-carrying-rule-twin)
Change one operating choice and watch permits, fees, blockers, and source-backed evidence receipts recompile for a multilingual small-business founder.
Purrwolf
Bright Data Web Scraper API
Speechmatics api
`;

const markdownProjects = extractProjectsFromHtml(markdownSample);
assert.equal(markdownProjects.length, 2);
assert.equal(markdownProjects[0].title, "Half-Life - Decisions That Stopped Being True");
assert.equal(markdownProjects[0].team, "Kaizu");
assert.ok(markdownProjects[0].technologies.includes("Bright Data Datasets"));
assert.equal(markdownProjects[1].title, "CivicTwin - Proof-Carrying Rule Twin");
assert.equal(markdownProjects[1].team, "Purrwolf");
assert.equal(markdownProjects[1].submissionUrl, "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/purrwolf/civictwin-proof-carrying-rule-twin");

console.log("parser tests passed");
