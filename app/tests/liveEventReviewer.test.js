import assert from "node:assert/strict";
import { collectEventProjects } from "../src/liveEventReviewer.js";
import { hasExecutedBrightDataTrace } from "../src/scoring.js";

const eventHtml = `
  <a href="/ai-hackathons/nativebuilder-build-without-limits/team-x/project-y">
    <h2>Project Y</h2>
    <p>Agent workflow that uses Bright Data Web Scraper API to verify public claims for judges.</p>
    <span>Team X</span>
    <span>Team X</span>
    <span>Bright Data Web Scraper API</span>
    <span>AI/ML API</span>
  </a>
`;

const result = await collectEventProjects(
  {
    eventUrl: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits"
  },
  {
    collectionMode: "bright-data-request-api",
    fetchText: async () => eventHtml,
    now: () => new Date("2026-08-07T12:30:00.000Z")
  }
);

assert.equal(result.projects.length, 1);
assert.equal(result.eventTrace.provider, "bright-data");
assert.equal(result.eventTrace.traceStatus, "executed");
assert.equal(result.eventTrace.countsForSponsorFit, false);
assert.equal(result.projects[0].title, "Project Y");
assert.equal(result.projects[0].brightDataTraces[0].provider, "bright-data");
assert.equal(result.projects[0].brightDataTraces[0].countsForSponsorFit, false);
assert.equal(hasExecutedBrightDataTrace(result.projects[0]), false);

await assert.rejects(
  () => collectEventProjects({ eventUrl: "not a url" }, { fetchText: async () => eventHtml }),
  /HTTP event URL/
);

console.log("live event reviewer tests passed");
