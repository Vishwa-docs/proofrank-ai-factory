import { collectReviewerProject } from "../app/src/liveReviewer.js";
import { createLiveFetchTextFromEnv, describeLiveFetchMode } from "../app/src/liveFetchers.js";
import { loadLocalEnv } from "./env-loader.mjs";

loadLocalEnv();

const repoUrl = process.argv[2] || "https://github.com/Vishwa-docs/proofrank-ai-factory";
const demoUrl = process.argv[3] || "https://vishwa-docs.github.io/proofrank-ai-factory/";

const project = await collectReviewerProject(
  {
    repoUrl,
    demoUrl,
    eventUrl: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits"
  },
  {
    fetchText: createLiveFetchTextFromEnv(process.env),
    collectionMode: describeLiveFetchMode(process.env),
    now: () => new Date()
  }
);

const collectionMode = describeLiveFetchMode(process.env);
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
