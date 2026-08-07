import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildBrightDataMcpEndpoint } from "../app/src/brightDataMcpClient.js";
import { buildReceipt } from "../app/src/exporters.js";
import {
  assertFinalBrightDataReceipt,
  assertOfficialBrightDataMcpEndpoint,
  buildFinalReceiptGate,
  resolveFinalReceiptOutputPath
} from "../app/src/finalReceipt.js";
import { createLiveCollectorsFromEnv } from "../app/src/liveFetchers.js";
import { collectReviewerProject } from "../app/src/liveReviewer.js";
import { scoreProject } from "../app/src/scoring.js";
import { loadLocalEnv } from "./env-loader.mjs";

loadLocalEnv();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoUrl =
  process.argv[2] || process.env.PROOFRANK_REVIEW_REPO_URL || "https://github.com/Vishwa-docs/proofrank-ai-factory";
const demoUrl =
  process.argv[3] || process.env.PROOFRANK_REVIEW_DEMO_URL || "https://proofrank-ai-factory.vercel.app/";
const nativeBuilderUrl =
  process.env.PROOFRANK_NATIVE_BUILDER_URL || process.env.NATIVE_BUILDER_APP_URL || "https://80wmf4jpjww3g4j6wcymx9m8t.nativelyai.app/";
const allowDirect = process.argv.includes("--allow-direct");
const outputPath = resolveFinalReceiptOutputPath(root, process.env, allowDirect);

if (!process.env.PROOFRANK_RECEIPT_SIGNING_SECRET) {
  throw new Error("PROOFRANK_RECEIPT_SIGNING_SECRET is required so the final receipt is signed.");
}

if (allowDirect && process.env.PROOFRANK_FETCH_MODE !== "direct") {
  process.env.PROOFRANK_FETCH_MODE = "direct";
}

if (!allowDirect && process.env.PROOFRANK_FETCH_MODE !== "mcp") {
  process.env.PROOFRANK_FETCH_MODE = "mcp";
}

if (!allowDirect) {
  assertOfficialBrightDataMcpEndpoint(buildBrightDataMcpEndpoint(process.env));
}

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

const project = scoreProject({
  ...collected,
  nativeBuilderUrl,
  evidence: {
    ...collected.evidence,
    nativeBuilderPublished: Boolean(nativeBuilderUrl)
  }
});
const gate = buildFinalReceiptGate(project, { signingSecret: process.env.PROOFRANK_RECEIPT_SIGNING_SECRET });
if (!allowDirect) {
  assertFinalBrightDataReceipt(project, { signingSecret: process.env.PROOFRANK_RECEIPT_SIGNING_SECRET });
}

const receipt = {
  ...buildReceipt(project, [project]),
  finalBrightDataGate: gate,
  finalReceiptGeneratedAt: new Date().toISOString()
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      ok: gate.ok,
      debugDirectOk: allowDirect && project.evidence.brightDataTraceStatus === "direct",
      outputPath,
      title: project.title,
      collectionMode: liveCollectors.collectionMode,
      gate,
      traceCount: project.brightDataTraces.length,
      receiptItems: project.evidenceItems.length
    },
    null,
    2
  )
);

if (!allowDirect && !gate.ok) {
  process.exitCode = 1;
}
