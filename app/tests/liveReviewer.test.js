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
  if (url === "https://api.github.com/repos/Vishwa-docs/proofrank-ai-factory") {
    return JSON.stringify({
      default_branch: "main",
      pushed_at: "2026-08-07T11:58:04Z",
      license: {
        spdx_id: "MIT",
        name: "MIT License"
      }
    });
  }

  if (url.includes("/readme")) {
    return `
      # ProofRank AI Factory

      Built with native.builder as an agentic evidence workbench for hackathon judges.
      It uses Bright Data Remote MCP, SERP API, and Web Scraper API to collect live
      source-backed receipts, run originality checks, and inspect public demos.
    `;
  }

  if (url === "https://api.github.com/repos/Vishwa-docs/proofrank-ai-factory/git/trees/main?recursive=1") {
    return JSON.stringify({
      tree: [
        { path: "README.md", type: "blob" },
        { path: "LICENSE", type: "blob" },
        { path: "package.json", type: "blob" },
        { path: ".env.example", type: "blob" },
        { path: "app/src/main.js", type: "blob" },
        { path: "scripts/live-review-server.mjs", type: "blob" },
        { path: "submission/native-builder-prompt.md", type: "blob" }
      ]
    });
  }

  if (url === "https://raw.githubusercontent.com/Vishwa-docs/proofrank-ai-factory/main/package.json") {
    return JSON.stringify({
      scripts: {
        test: "node app/tests/scoring.test.js",
        "live:server": "node scripts/live-review-server.mjs"
      },
      dependencies: {
        "@modelcontextprotocol/sdk": "^1.0.0"
      }
    });
  }

  if (url === "https://raw.githubusercontent.com/Vishwa-docs/proofrank-ai-factory/main/LICENSE") {
    return "MIT License";
  }

  if (url.startsWith("https://api.github.com/repos/Vishwa-docs/proofrank-ai-factory/commits?")) {
    return JSON.stringify([
      {
        sha: "abc123456789",
        commit: {
          message: "Add live reviewer backend",
          author: {
            date: "2026-08-07T12:00:00Z"
          }
        }
      }
    ]);
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
assert.equal(project.evidence.repoTreeCollected, true);
assert.equal(project.evidence.packageManifestPresent, true);
assert.equal(project.evidence.licensePresent, true);
assert.equal(project.evidence.builtDuringEvent, true);
assert.equal(project.evidence.secretRiskVisible, false);
assert.equal(project.evidence.brightDataRole, "agentic");
assert.ok(project.evidence.brightDataTools.includes("Remote MCP"));
assert.ok(project.evidence.brightDataTools.includes("Web Scraper API"));
assert.ok(project.evidenceItems.some((item) => item.sourceType === "github-metadata"));
assert.ok(project.evidenceItems.some((item) => item.sourceType === "github-tree"));
assert.ok(project.evidenceItems.some((item) => item.sourceType === "package-manifest"));
assert.ok(project.evidenceItems.some((item) => item.sourceType === "github-commits"));
assert.ok(project.evidenceItems.some((item) => item.sourceType === "license"));
assert.ok(project.evidenceItems.some((item) => item.sourceType === "secret-risk-scan" && item.title.includes("passed")));
assert.ok(project.brightDataTraces.some((trace) => trace.tool === "scrape_as_markdown"));
assert.ok(fetchedUrls.includes("https://api.github.com/repos/Vishwa-docs/proofrank-ai-factory"));
assert.ok(fetchedUrls.includes("https://api.github.com/repos/Vishwa-docs/proofrank-ai-factory/readme"));
assert.ok(fetchedUrls.includes("https://api.github.com/repos/Vishwa-docs/proofrank-ai-factory/git/trees/main?recursive=1"));
assert.ok(fetchedUrls.includes("https://raw.githubusercontent.com/Vishwa-docs/proofrank-ai-factory/main/package.json"));
assert.ok(fetchedUrls.includes("https://raw.githubusercontent.com/Vishwa-docs/proofrank-ai-factory/main/LICENSE"));
assert.ok(fetchedUrls.some((url) => url.startsWith("https://api.github.com/repos/Vishwa-docs/proofrank-ai-factory/commits?")));
assert.ok(fetchedUrls.includes("https://vishwa-docs.github.io/proofrank-ai-factory/"));

const risky = await collectReviewerProject(
  {
    repoUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory"
  },
  {
    fetchText: async (url) => {
      if (url === "https://api.github.com/repos/Vishwa-docs/proofrank-ai-factory") {
        return JSON.stringify({ default_branch: "main", license: null });
      }
      if (url.includes("/readme")) return "# Risky";
      if (url.includes("/git/trees/")) {
        return JSON.stringify({
          tree: [
            { path: ".env", type: "blob" },
            { path: "credentials.json", type: "blob" },
            { path: "app.py", type: "blob" }
          ]
        });
      }
      if (url.includes("/commits?")) return JSON.stringify([]);
      throw new Error(`Unexpected fetch ${url}`);
    },
    now: () => new Date("2026-08-07T12:00:00.000Z")
  }
);

assert.equal(risky.evidence.secretRiskVisible, true);
assert.ok(risky.evidenceItems.some((item) => item.sourceType === "secret-risk-scan" && item.title.includes("risk")));

await assert.rejects(
  () => collectReviewerProject({ repoUrl: "https://example.com/nope" }, { fetchText: fakeFetchText }),
  /GitHub repository URL/
);

console.log("live reviewer tests passed");
