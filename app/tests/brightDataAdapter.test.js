import assert from "node:assert/strict";
import { buildMcpQueries } from "../src/brightDataAdapter.js";

const project = {
  title: "ProofRank",
  team: "Kaizu",
  githubUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory",
  demoUrl: "https://proofrank-ai-factory.vercel.app/",
  submissionUrl: "https://lablab.ai/apps/proofrank"
};

const queries = buildMcpQueries("https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits", project);

assert.deepEqual(
  queries.map((query) => query.tool),
  ["scrape_as_markdown", "search_engine", "discover"]
);
assert.equal(queries[0].url, project.githubUrl);
assert.match(queries[0].purpose, /repo/i);
assert.match(queries[1].query, /ProofRank/);
assert.match(queries[1].query, /Bright Data/);
assert.match(queries[2].intent, /repo/i);
assert.match(queries[2].intent, /demo/i);
assert.match(queries[2].intent, /source/i);
assert.equal(queries[2].numResults, 5);

console.log("Bright Data adapter tests passed");
