import assert from "node:assert/strict";
import { buildVisitorBrief } from "../src/visitorBrief.js";

const draftProject = {
  id: "review-brightdata-brightdata-mcp",
  title: "Brightdata MCP",
  githubUrl: "https://github.com/brightdata/brightdata-mcp",
  demoUrl: "https://brightdata.com/",
  evidence: {
    hasGithub: false,
    hasPublicDemo: false,
    brightDataTraceStatus: "pending"
  },
  brightDataTraces: []
};

const receiptProject = {
  id: "proofrank",
  title: "ProofRank",
  githubUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory",
  demoUrl: "https://proofrank-ai-factory.vercel.app/",
  evidence: {
    hasGithub: true,
    hasPublicDemo: true,
    brightDataTraceStatus: "executed",
    proofReceipt: true
  },
  brightDataTraces: [
    { tool: "scrape_as_markdown", traceStatus: "executed" },
    { tool: "search_engine", traceStatus: "executed" },
    { tool: "discover", traceStatus: "executed" }
  ],
  runReceipt: {
    runId: "proofrank-final-brightdata",
    signature: "server-record"
  }
};

{
  const brief = buildVisitorBrief(draftProject);

  assert.equal(brief.variant, "draft");
  assert.equal(brief.badge, "Link-only draft");
  assert.match(brief.title, /Draft review created/i);
  assert.equal(brief.rows.length, 4);
  assert.deepEqual(
    brief.rows.map((row) => row.label),
    ["What was checked", "What still is not checked", "Bright Data plan", "Best next click"]
  );
  assert.match(brief.rows[0].detail, /URL format accepted/i);
  assert.match(brief.rows[1].detail, /repo content, demo reachability, functionality, and Bright Data evidence/i);
  assert.match(brief.rows[2].detail, /Source fetch/);
  assert.match(brief.rows[2].detail, /web search/);
  assert.match(brief.rows[2].detail, /discover/);
  assert.match(brief.rows[2].detail, /planned, not run yet/i);
  assert.equal(brief.actions[0].label, "Copy draft link");
  assert.equal(brief.actions[1].label, "Run public review");
  assert.equal(brief.actions[2].label, "Export draft memo");

  const fullText = JSON.stringify(brief);
  assert.doesNotMatch(fullText, /verified|reachable|passed|certified|signed proof|submission-ready|finalist-ready/i);
}

{
  const brief = buildVisitorBrief({
    ...draftProject,
    evidence: {
      ...draftProject.evidence,
      hasGithub: true,
      hasPublicDemo: true,
      repoMetadataCollected: true,
      brightDataTraceStatus: ""
    },
    brightDataTraces: [
      {
        provider: "direct",
        traceStatus: "executed",
        tool: "direct-fetch",
        queryOrUrl: "https://github.com/brightdata/brightdata-mcp"
      }
    ]
  });

  assert.equal(brief.variant, "review");
  assert.equal(brief.badge, "Public evidence");
  assert.equal(brief.title, "Public review ready");
  assert.match(brief.summary, /real public repo\/demo evidence/i);
  assert.match(brief.summary, /private Bright Data evidence/i);
  assert.equal(brief.actions[0].label, "Open evidence");
  assert.equal(brief.actions[1].label, "Private review");
  assert.equal(brief.actions[2].label, "Export memo");
}

{
  const brief = buildVisitorBrief(receiptProject);

  assert.equal(brief.variant, "evidence");
  assert.equal(brief.badge, "Bright Data ready");
  assert.match(brief.title, /Evidence-backed review/i);
  assert.match(brief.rows[0].detail, /source fetch, search, and discovery/i);
  assert.match(brief.rows[1].detail, /Saved review/i);
  assert.equal(brief.actions[0].label, "Open evidence");
  assert.equal(brief.actions[1].label, "Export memo");
  assert.equal(brief.actions[2].label, "Final submission");
}

console.log("visitor brief tests passed");
