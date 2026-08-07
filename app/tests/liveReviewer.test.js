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
assert.equal(project.evidence.brightDataTrace, false);
assert.equal(project.evidence.brightDataTraceStatus, "direct");
assert.equal(project.runReceipt.replayCommand, "PROOFRANK_FETCH_MODE=direct npm run live:smoke -- https://github.com/Vishwa-docs/proofrank-ai-factory https://vishwa-docs.github.io/proofrank-ai-factory/");
assert.ok(project.evidenceItems.some((item) => item.sourceType === "github-metadata"));
assert.ok(project.evidenceItems.some((item) => item.sourceType === "github-tree"));
assert.ok(project.evidenceItems.some((item) => item.sourceType === "package-manifest"));
assert.ok(project.evidenceItems.some((item) => item.sourceType === "github-commits"));
assert.ok(project.evidenceItems.some((item) => item.sourceType === "license"));
assert.ok(project.evidenceItems.some((item) => item.sourceType === "secret-risk-scan" && item.title.includes("passed")));
assert.ok(project.brightDataTraces.some((trace) => trace.tool === "scrape_as_markdown"));
assert.ok(project.brightDataTraces.some((trace) => trace.traceStatus === "executed" && trace.mode === "direct-fetch"));
assert.ok(project.brightDataTraces.every((trace) => typeof trace.byteCount === "number"));
assert.ok(project.brightDataTraces.every((trace) => /^[a-f0-9]{8}$/.test(trace.contentHash) || trace.traceStatus === "failed"));
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

const brightCollected = await collectReviewerProject(
  {
    repoUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory",
    demoUrl: "https://vishwa-docs.github.io/proofrank-ai-factory/"
  },
  {
    fetchText: fakeFetchText,
    collectionMode: "bright-data-request-api",
    now: () => new Date("2026-08-07T12:00:00.000Z")
  }
);

assert.equal(brightCollected.evidence.brightDataTrace, true);
assert.equal(brightCollected.evidence.brightDataTraceStatus, "executed");
assert.ok(brightCollected.brightDataTraces.some((trace) => trace.mode === "bright-data-request-api" && trace.traceStatus === "executed"));

const mcpCollected = await collectReviewerProject(
  {
    repoUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory",
    demoUrl: "https://vishwa-docs.github.io/proofrank-ai-factory/"
  },
  {
    fetchText: fakeFetchText,
    searchText: async (query) => `Search result for ${query}: ProofRank is distinct from generic judging dashboards and uses source-backed evidence.`,
    collectionMode: "bright-data-mcp",
    signingSecret: "test-signing-secret",
    now: () => new Date("2026-08-07T12:00:00.000Z")
  }
);

assert.equal(mcpCollected.evidence.brightDataTrace, true);
assert.equal(mcpCollected.evidence.brightDataTraceStatus, "executed");
assert.equal(mcpCollected.runReceipt.issuer, "ProofRank live reviewer");
assert.equal(mcpCollected.runReceipt.collectionMode, "bright-data-mcp");
assert.equal(mcpCollected.runReceipt.traceCount, mcpCollected.brightDataTraces.length);
assert.match(mcpCollected.runReceipt.runId, /^pr-20260807t120000000z-[a-f0-9]{8}$/);
assert.match(mcpCollected.runReceipt.traceDigest, /^[a-f0-9]{8}$/);
assert.match(mcpCollected.runReceipt.signature, /^hmac-sha256:[a-f0-9]{64}$/);
assert.ok(!JSON.stringify(mcpCollected.runReceipt).includes("test-signing-secret"));
assert.equal(mcpCollected.runReceipt.replayCommand, "PROOFRANK_FETCH_MODE=mcp npm run live:smoke -- https://github.com/Vishwa-docs/proofrank-ai-factory https://vishwa-docs.github.io/proofrank-ai-factory/");
assert.ok(mcpCollected.runReceipt.tools.includes("search_engine"));
assert.ok(mcpCollected.runReceipt.tools.includes("scrape_as_markdown"));
assert.ok(mcpCollected.brightDataTraces.some((trace) => trace.mode === "bright-data-mcp" && trace.provider === "bright-data"));
assert.ok(mcpCollected.brightDataTraces.some((trace) => trace.tool === "search_engine" && trace.traceStatus === "executed"));
assert.ok(mcpCollected.brightDataTraces.every((trace) => trace.traceStatus === "executed"));
assert.ok(mcpCollected.evidence.brightDataTools.includes("SERP API"));
assert.ok(mcpCollected.evidenceItems.some((item) => item.sourceType === "prior-art-search"));

const brightFailed = await collectReviewerProject(
  {
    repoUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory"
  },
  {
    fetchText: async () => {
      throw new Error("Bright Data fetch failed 401");
    },
    collectionMode: "bright-data-request-api",
    now: () => new Date("2026-08-07T12:00:00.000Z")
  }
);

assert.equal(brightFailed.evidence.brightDataTrace, false);
assert.equal(brightFailed.evidence.brightDataTraceStatus, "failed");
assert.ok(brightFailed.brightDataTraces.every((trace) => trace.traceStatus === "failed"));
assert.ok(brightFailed.brightDataTraces.some((trace) => trace.status.includes("401")));

await assert.rejects(
  () => collectReviewerProject({ repoUrl: "https://example.com/nope" }, { fetchText: fakeFetchText }),
  /GitHub repository URL/
);

console.log("live reviewer tests passed");
