import { collectReviewerProject } from "../app/src/liveReviewer.js";
import { createLiveFetchTextFromEnv } from "../app/src/liveFetchers.js";
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
    now: () => new Date()
  }
);

console.log(
  JSON.stringify(
    {
      ok: true,
      collectionMode: process.env.BRIGHTDATA_API_TOKEN ? "bright-data-request-api" : "direct-fetch",
      project: {
        id: project.id,
        title: project.title,
        hasGithub: project.evidence.hasGithub,
        hasPublicDemo: project.evidence.hasPublicDemo,
        brightDataRole: project.evidence.brightDataRole,
        brightDataTools: project.evidence.brightDataTools,
        receiptItems: project.evidenceItems.length,
        receipts: project.evidenceItems.map((item) => ({
          sourceType: item.sourceType,
          title: item.title,
          confidence: item.confidence,
          excerpt: item.excerpt,
          limitations: item.limitations
        })),
        traceTools: project.brightDataTraces.map((trace) => trace.tool)
      }
    },
    null,
    2
  )
);
