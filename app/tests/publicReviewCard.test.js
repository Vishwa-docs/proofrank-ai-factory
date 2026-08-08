import assert from "node:assert/strict";
import { fixtureProjects } from "../src/fixtures.js";
import { buildPublicReviewCard } from "../src/publicReviewCard.js";

const draftProject = {
  id: "review-brightdata-brightdata-mcp",
  title: "Brightdata MCP",
  team: "Brightdata",
  summary: "Draft review for a public repository.",
  githubUrl: "https://github.com/brightdata/brightdata-mcp",
  demoUrl: "https://brightdata.com/",
  evidence: {
    hasGithub: false,
    hasPublicDemo: false,
    isFunctional: false,
    brightDataTraceStatus: "pending"
  },
  brightDataTraces: []
};

const draftCard = buildPublicReviewCard(draftProject, {
  reviewUrl: "https://proofrank.example/?reviewRepo=https%3A%2F%2Fgithub.com%2Fbrightdata%2Fbrightdata-mcp",
  roomUrl: "https://proofrank.example/"
});

assert.match(draftCard, /^ProofRank draft for Brightdata MCP/m);
assert.match(draftCard, /Draft review only/);
assert.match(draftCard, /URL format accepted, no repo\/demo fetch, no functionality check, no Bright Data evidence yet/);
assert.match(draftCard, /Decision: Request live evidence/);
assert.match(draftCard, /GitHub: URL accepted, content not fetched/);
assert.match(draftCard, /Demo: URL supplied, reachability not checked/);
assert.match(draftCard, /Bright Data evidence pending/);
assert.match(draftCard, /Bright Data plan: scrape_as_markdown \+ search_engine \+ discover planned, not executed/);
assert.match(draftCard, /Review link: https:\/\/proofrank\.example\//);
assert.doesNotMatch(draftCard, /verified|reachable|passed|certified|signed proof|finalist-ready|submission-ready/i);

const proofrank = fixtureProjects.find((project) => project.id === "proofrank");
const evidenceCard = buildPublicReviewCard(proofrank, {
  reviewUrl: "https://proofrank.example/?reviewRepo=https%3A%2F%2Fgithub.com%2FVishwa-docs%2Fproofrank-ai-factory",
  roomUrl: "https://proofrank.example/"
});

assert.match(evidenceCard, /Decision: Shortlist/);
assert.match(evidenceCard, /Bright Data: executed source \+ search \+ discovery/);
assert.match(evidenceCard, /Evidence report: pr-20260807t200529345z-23568b05/);
assert.match(evidenceCard, /Next: Export memo or inspect Evidence before final submission/);

console.log("public review card tests passed");
