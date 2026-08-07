import assert from "node:assert/strict";
import { collectReviewerProject, parseGitHubRepoUrl } from "../src/liveReviewer.js";

const parsed = parseGitHubRepoUrl("https://github.com/Vishwa-docs/proofrank-ai-factory/tree/main");
assert.deepEqual(parsed, {
  owner: "Vishwa-docs",
  repo: "proofrank-ai-factory",
  canonicalUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory",
  readmeApiUrl: "https://api.github.com/repos/Vishwa-docs/proofrank-ai-factory/readme"
});

const fetchedUrls = [];
const fakeFetchText = async (url) => {
  fetchedUrls.push(url);
  if (url.includes("/readme")) {
    return `
      # ProofRank AI Factory

      Built with native.builder as an agentic evidence workbench for hackathon judges.
      It uses Bright Data Remote MCP, SERP API, and Web Scraper API to collect live
      source-backed receipts, run originality checks, and inspect public demos.
    `;
  }

  return `
    <html>
      <title>ProofRank</title>
      <body>
        <button>Run review</button>
        <section>Ranked queue, proof receipt, GitHub repository, export JSON.</section>
      </body>
    </html>
  `;
};

const project = await collectReviewerProject(
  {
    repoUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory",
    demoUrl: "https://vishwa-docs.github.io/proofrank-ai-factory/",
    eventUrl: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits"
  },
  {
    fetchText: fakeFetchText,
    now: () => new Date("2026-08-07T12:00:00.000Z")
  }
);

assert.equal(project.id, "review-vishwa-docs-proofrank-ai-factory");
assert.equal(project.title, "ProofRank AI Factory");
assert.equal(project.team, "Vishwa Docs");
assert.equal(project.githubUrl, "https://github.com/Vishwa-docs/proofrank-ai-factory");
assert.equal(project.demoUrl, "https://vishwa-docs.github.io/proofrank-ai-factory/");
assert.equal(project.evidence.hasGithub, true);
assert.equal(project.evidence.hasPublicDemo, true);
assert.equal(project.evidence.nativeBuilderExplained, true);
assert.equal(project.evidence.demoWorkflow, true);
assert.equal(project.evidence.brightDataRole, "agentic");
assert.ok(project.evidence.brightDataTools.includes("Remote MCP"));
assert.ok(project.evidence.brightDataTools.includes("Web Scraper API"));
assert.equal(project.evidenceItems.length, 2);
assert.ok(project.brightDataTraces.some((trace) => trace.tool === "scrape_as_markdown"));
assert.ok(fetchedUrls.includes("https://api.github.com/repos/Vishwa-docs/proofrank-ai-factory/readme"));
assert.ok(fetchedUrls.includes("https://vishwa-docs.github.io/proofrank-ai-factory/"));

await assert.rejects(
  () => collectReviewerProject({ repoUrl: "https://example.com/nope" }, { fetchText: fakeFetchText }),
  /GitHub repository URL/
);

console.log("live reviewer tests passed");
