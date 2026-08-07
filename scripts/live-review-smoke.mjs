import { collectReviewerProject } from "../app/src/liveReviewer.js";
import { createLiveCollectorsFromEnv } from "../app/src/liveFetchers.js";
import { loadLocalEnv } from "./env-loader.mjs";

loadLocalEnv();

const repoUrl = process.argv[2] || "https://github.com/Vishwa-docs/proofrank-ai-factory";
const demoUrl = process.argv[3] || "https://vishwa-docs.github.io/proofrank-ai-factory/";
const liveCollectors = createLiveCollectorsFromEnv(process.env);

const project = await collectReviewerProject(
  {
    repoUrl,
    demoUrl,
    eventUrl: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits"
  },
  {
    fetchText: liveCollectors.fetchText,
    searchText: liveCollectors.searchText,
    collectionMode: liveCollectors.collectionMode,
    signingSecret: process.env.PROOFRANK_RECEIPT_SIGNING_SECRET,
    now: () => new Date()
  }
);

const collectionMode = liveCollectors.collectionMode;
const successfulTraces = project.brightDataTraces.filter(
  (trace) => trace.traceStatus === "executed" && Number(trace.resultCount || 0) > 0
);
const executedBrightDataTraces = project.brightDataTraces.filter(
  (trace) => trace.provider === "bright-data" && trace.traceStatus === "executed"
);
const failures = [];

if (!project.evidence.hasPublicDemo) failures.push("public demo was not collected");
if (!successfulTraces.length) failures.push("no successful collection traces were recorded");
if (collectionMode !== "direct-fetch" && !executedBrightDataTraces.length) {
  failures.push("Bright Data mode did not record an executed Bright Data trace");
}
if (collectionMode === "bright-data-mcp" && !executedBrightDataTraces.some((trace) => trace.tool === "search_engine")) {
  failures.push("Bright Data MCP mode did not record an executed search_engine trace");
}

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      collectionMode,
      failures,
      project: {
        id: project.id,
        title: project.title,
        hasGithub: project.evidence.hasGithub,
        hasPublicDemo: project.evidence.hasPublicDemo,
        brightDataRole: project.evidence.brightDataRole,
        brightDataTools: project.evidence.brightDataTools,
        brightDataTrace: project.evidence.brightDataTrace,
        brightDataTraceStatus: project.evidence.brightDataTraceStatus,
        runReceipt: project.runReceipt
          ? {
              runId: project.runReceipt.runId,
              collectionMode: project.runReceipt.collectionMode,
              provider: project.runReceipt.provider,
              traceCount: project.runReceipt.traceCount,
              executedTraceCount: project.runReceipt.executedTraceCount,
              tools: project.runReceipt.tools,
              traceDigest: project.runReceipt.traceDigest,
              signed: Boolean(project.runReceipt.signature),
              replayCommand: project.runReceipt.replayCommand
            }
          : null,
        receiptItems: project.evidenceItems.length,
        receipts: project.evidenceItems.map((item) => ({
          sourceType: item.sourceType,
          title: item.title,
          confidence: item.confidence,
          excerpt: item.excerpt,
          limitations: item.limitations
        })),
        traces: project.brightDataTraces.map((trace) => ({
          provider: trace.provider,
          traceStatus: trace.traceStatus,
          tool: trace.tool,
          resultCount: trace.resultCount,
          byteCount: trace.byteCount,
          contentHash: trace.contentHash,
          status: trace.status
        }))
      }
    },
    null,
    2
  )
);

if (failures.length) {
  process.exitCode = 1;
}
