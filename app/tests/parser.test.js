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

console.log("parser tests passed");
