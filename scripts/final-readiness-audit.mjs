import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFinalReadinessReport, summarizeFinalReadiness } from "../app/src/finalReadinessAudit.js";
import { createBrightDataMcpClient } from "../app/src/brightDataMcpClient.js";
import { buildFinalReceiptGate } from "../app/src/finalReceipt.js";
import { loadLocalEnv } from "./env-loader.mjs";

loadLocalEnv();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "submission", "final-readiness-audit.json");
const fallbackUrl = "https://vishwa-docs.github.io/proofrank-ai-factory/";
const releaseVideoUrl =
  "https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-demo.mp4";
const pitchDeckUrl =
  "https://github.com/Vishwa-docs/proofrank-ai-factory/releases/download/proofrank-submission-v1/proofrank-pitch-deck.pptx";
const defaultReviewRepoUrl = "https://github.com/Vishwa-docs/proofrank-ai-factory";
const defaultReviewDemoUrl = fallbackUrl;

function envValue(...keys) {
  for (const key of keys) {
    const value = String(process.env[key] || "").trim();
    if (value) return value;
  }
  return "";
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "ProofRank final readiness audit"
      }
    });
    const text = await response.text().catch(() => "");
    return {
      ok: response.ok,
      status: response.status,
      url,
      text
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      error: error.message,
      text: ""
    };
  }
}

async function fetchReachable(url) {
  if (!url) return { ok: false, status: 0, url: "" };
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "user-agent": "ProofRank final readiness audit"
      }
    });
    if (response.ok) return { ok: true, status: response.status, url };
  } catch {
    // Fall back to GET below for hosts that do not support HEAD.
  }

  const textResult = await fetchText(url);
  return {
    ok: textResult.ok,
    status: textResult.status,
    url,
    error: textResult.error
  };
}

function mediaDuration(filePath) {
  if (!existsSync(filePath)) return 0;
  try {
    return Number(
      execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath], {
        encoding: "utf8"
      }).trim()
    );
  } catch {
    return 0;
  }
}

async function workflowProof() {
  const proofPath = path.join(root, "submission", "workflow-proof.json");
  if (!existsSync(proofPath)) return { ok: false, path: "submission/workflow-proof.json" };

  try {
    const parsed = JSON.parse(await readFile(proofPath, "utf8"));
    return {
      ok: parsed.ok === true,
      path: "submission/workflow-proof.json",
      selectedProject: parsed.selectedProject || "",
      exportedFiles: Array.isArray(parsed.exportedFiles) ? parsed.exportedFiles.length : 0
    };
  } catch (error) {
    return {
      ok: false,
      path: "submission/workflow-proof.json",
      error: error.message
    };
  }
}

async function brightAuth() {
  const token = envValue("BRIGHTDATA_API_TOKEN", "BRIGHT_DATA_API_TOKEN", "BRIGHTDATA_TOKEN");
  if (!token) {
    return {
      ok: false,
      httpStatus: 0,
      tokenShape: {
        missing: true
      }
    };
  }

  try {
    const response = await fetch("https://api.brightdata.com/status", {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    return {
      ok: response.ok,
      httpStatus: response.status,
      tokenShape: {
        looksLikeUuid: /^[0-9a-f-]{36}$/i.test(token),
        length: token.length
      }
    };
  } catch (error) {
    return {
      ok: false,
      httpStatus: 0,
      error: error.message,
      tokenShape: {
        looksLikeUuid: /^[0-9a-f-]{36}$/i.test(token),
        length: token.length
      }
    };
  }
}

async function mcpTools(authResult) {
  if (!authResult.ok) return { ok: false, baseToolsPresent: false, sampleTools: [] };

  try {
    const client = createBrightDataMcpClient({ env: process.env, clientName: "proofrank-final-readiness-audit" });
    const tools = await client.listTools();
    const sampleTools = tools.slice(0, 10).map((tool) => tool.name);
    return {
      ok: true,
      baseToolsPresent: ["search_engine", "scrape_as_markdown", "discover"].every((name) => tools.some((tool) => tool.name === name)),
      sampleTools
    };
  } catch (error) {
    return {
      ok: false,
      baseToolsPresent: false,
      sampleTools: [],
      error: error.message
    };
  }
}

function healthUrl(value = "") {
  if (!value) return "";
  try {
    const url = new URL(value);
    url.pathname = "/health";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

async function liveApi() {
  const configured = envValue("PROOFRANK_LIVE_API_URL", "PROOFRANK_API_URL");
  const url = healthUrl(configured);
  if (!url) return { ok: false, url: configured };
  const result = await fetchText(url);
  return {
    ok: result.ok && /proofrank-live-review|\"ok\"\s*:\s*true/i.test(result.text),
    url,
    status: result.status
  };
}

async function nativeBuilder() {
  const url = envValue("PROOFRANK_NATIVE_BUILDER_URL", "NATIVE_BUILDER_APP_URL");
  if (!url) return { ok: false, url: "" };
  const reachable = await fetchReachable(url);
  return {
    ok: reachable.ok && /nativelyai\.app/i.test(url),
    url,
    status: reachable.status
  };
}

async function liveReceipt() {
  const relativePath = envValue("PROOFRANK_LIVE_RECEIPT_PATH") || "submission/final-brightdata-receipt.json";
  const receiptPath = path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
  if (!existsSync(receiptPath)) return { ok: false, path: relativePath };

  try {
    const parsed = JSON.parse(await readFile(receiptPath, "utf8"));
    const traces = parsed.brightDataTraces || parsed.project?.brightDataTraces || [];
    const runReceipt = parsed.runReceipt || parsed.project?.runReceipt || {};
    const gate = buildFinalReceiptGate(
      {
        brightDataTraces: traces,
        runReceipt
      },
      {
        signingSecret: envValue("PROOFRANK_RECEIPT_SIGNING_SECRET")
      }
    );
    return {
      ok: gate.ok,
      path: relativePath,
      provider: gate.provider,
      traceStatus: gate.traceStatus,
      hasSourceTrace: gate.hasSourceTrace,
      hasSearchEngine: gate.hasSearchEngine,
      signed: gate.signed,
      signatureVerified: gate.signatureVerified,
      traceDigestVerified: gate.traceDigestVerified,
      runId: gate.runId,
      failures: gate.failures
    };
  } catch (error) {
    return {
      ok: false,
      path: relativePath,
      error: error.message
    };
  }
}

async function buildAuditState() {
  const fallback = await fetchText(fallbackUrl);
  const videoPath = path.join(root, "submission", "proofrank-demo.mp4");
  const videoReachable = await fetchReachable(releaseVideoUrl);
  const targetRepoUrl = envValue("PROOFRANK_REVIEW_REPO_URL") || defaultReviewRepoUrl;
  const targetDemoUrl = envValue("PROOFRANK_REVIEW_DEMO_URL") || defaultReviewDemoUrl;
  const [targetRepo, targetDemo, authResult] = await Promise.all([fetchReachable(targetRepoUrl), fetchReachable(targetDemoUrl), brightAuth()]);
  const [mcpResult, liveApiResult, nativeBuilderResult, liveReceiptResult, workflowProofResult] = await Promise.all([
    mcpTools(authResult),
    liveApi(),
    nativeBuilder(),
    liveReceipt(),
    workflowProof()
  ]);

  return {
    generatedAt: new Date().toISOString(),
    gitHead: envValue("PROOFRANK_AUDIT_GIT_HEAD"),
    publicFallback: {
      ok: fallback.ok && /ProofRank/.test(fallback.text) && /Bright proof/.test(fallback.text),
      url: fallbackUrl,
      status: fallback.status,
      evidence: fallback.ok ? "ProofRank and Bright proof strip are present in deployed HTML." : `HTTP ${fallback.status || 0}`
    },
    releaseVideo: {
      ok: videoReachable.ok && existsSync(videoPath) && mediaDuration(videoPath) > 1 && mediaDuration(videoPath) <= 180,
      url: releaseVideoUrl,
      durationSeconds: mediaDuration(videoPath),
      sizeBytes: existsSync(videoPath) ? statSync(videoPath).size : 0,
      status: videoReachable.status
    },
    workflowProof: workflowProofResult,
    targetReview: {
      ok: targetRepo.ok && targetDemo.ok,
      repoUrl: targetRepoUrl,
      demoUrl: targetDemoUrl,
      repoReachable: targetRepo.ok,
      demoReachable: targetDemo.ok
    },
    nativeBuilder: nativeBuilderResult,
    brightAuth: authResult,
    mcpTools: mcpResult,
    liveApi: liveApiResult,
    liveReceipt: liveReceiptResult,
    lablabSubmission: {
      ok: Boolean(envValue("PROOFRANK_LABLAB_SUBMISSION_URL", "LABLAB_SUBMISSION_URL")),
      url: envValue("PROOFRANK_LABLAB_SUBMISSION_URL", "LABLAB_SUBMISSION_URL")
    },
    candidateTargets: {
      ok: existsSync(path.join(root, "research", "candidate-review-targets.md")),
      path: "research/candidate-review-targets.md"
    },
    pitchDeck: {
      ok: (await fetchReachable(pitchDeckUrl)).ok && existsSync(path.join(root, "submission", "proofrank-pitch-deck.pptx")),
      url: pitchDeckUrl
    }
  };
}

const report = buildFinalReadinessReport(await buildAuditState());
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ ...report, summary: summarizeFinalReadiness(report) }, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      canSubmit: report.canSubmit,
      summary: summarizeFinalReadiness(report),
      requiredPassed: report.requiredPassed,
      requiredTotal: report.requiredTotal,
      optionalPassed: report.optionalPassed,
      optionalTotal: report.optionalTotal,
      outputPath,
      nextActions: report.nextActions.slice(0, 6)
    },
    null,
    2
  )
);

if (process.argv.includes("--strict") && !report.canSubmit) {
  process.exitCode = 1;
}
