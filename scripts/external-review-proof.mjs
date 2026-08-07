import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildReceipt } from "../app/src/exporters.js";
import { fixtureProjects } from "../app/src/fixtures.js";
import { createLiveCollectorsFromEnv } from "../app/src/liveFetchers.js";
import { collectReviewerProject } from "../app/src/liveReviewer.js";
import { scoreProject } from "../app/src/scoring.js";
import { loadLocalEnv } from "./env-loader.mjs";

loadLocalEnv();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoUrl =
  process.argv[2] ||
  process.env.PROOFRANK_EXTERNAL_REVIEW_REPO_URL ||
  "https://github.com/Vishwa-docs/Meta_PyTorch_Scalar_OpenEnv-Hackathon";
const demoUrl =
  process.argv[3] ||
  process.env.PROOFRANK_EXTERNAL_REVIEW_DEMO_URL ||
  "https://huggingface.co/spaces/TheJackBright/polypharmacy-env";
const outputPath = path.join(root, "submission", "external-review-proof.json");

const liveCollectors = createLiveCollectorsFromEnv(process.env);
const collected = await collectReviewerProject(
  {
    repoUrl,
    demoUrl,
    eventUrl: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits"
  },
  {
    fetchText: liveCollectors.fetchText,
    searchText: liveCollectors.searchText,
    discoverText: liveCollectors.discoverText,
    collectionMode: liveCollectors.collectionMode,
    signingSecret: process.env.PROOFRANK_RECEIPT_SIGNING_SECRET,
    now: () => new Date()
  }
);

const project = scoreProject(collected);
const receipt = buildReceipt(project, [project, ...fixtureProjects]);
const proof = {
  generatedAt: new Date().toISOString(),
  purpose:
    "Secondary non-ProofRank review target showing the product can audit an actual public GitHub/demo project, not only its own submission.",
  collectionMode: liveCollectors.collectionMode,
  repoUrl,
  demoUrl,
  project: {
    id: project.id,
    title: project.title,
    verdict: project.verdict,
    scores: project.scores,
    traceState: receipt.traceState,
    runReceipt: project.runReceipt
      ? {
          runId: project.runReceipt.runId,
          provider: project.runReceipt.provider,
          collectionMode: project.runReceipt.collectionMode,
          traceCount: project.runReceipt.traceCount,
          executedTraceCount: project.runReceipt.executedTraceCount,
          tools: project.runReceipt.tools,
          supportingTools: project.runReceipt.supportingTools,
          signed: Boolean(project.runReceipt.signature),
          traceDigest: project.runReceipt.traceDigest
        }
      : null,
    evidenceItemCount: project.evidenceItems.length,
    brightDataTraces: project.brightDataTraces.map((trace) => ({
      provider: trace.provider,
      traceStatus: trace.traceStatus,
      tool: trace.tool,
      resultCount: trace.resultCount,
      byteCount: trace.byteCount,
      contentHash: trace.contentHash,
      countsForSponsorFit: trace.countsForSponsorFit
    })),
    readinessSummary: receipt.readiness.nextActions,
    originalityRadar: receipt.originalityRadar
  }
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      outputPath,
      collectionMode: liveCollectors.collectionMode,
      title: project.title,
      verdict: project.verdict.label,
      score: project.scores.overall,
      traceState: receipt.traceState,
      runId: project.runReceipt?.runId || ""
    },
    null,
    2
  )
);
