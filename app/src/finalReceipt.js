import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";

const SOURCE_TRACE_PATTERN = /scrape|unlock|browser|crawl|request|dataset|web_data/i;
const OFFICIAL_BRIGHTDATA_MCP_ORIGIN = "https://mcp.brightdata.com";
const OFFICIAL_BRIGHTDATA_MCP_PATH = "/mcp";
const DEFAULT_FINAL_RECEIPT_PATH = "submission/final-brightdata-receipt.json";
const DEFAULT_DIRECT_DEBUG_RECEIPT_PATH = "/tmp/proofrank-final-brightdata-receipt-debug.json";

function contentHash(value = "") {
  const text = String(value || "");
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function traceDigest(traces = []) {
  return contentHash(
    traces
      .map((trace) => `${trace.provider}|${trace.tool}|${trace.traceStatus}|${trace.queryOrUrl}|${trace.byteCount}|${trace.contentHash}`)
      .join("\n")
  );
}

function executedBrightDataTraces(project = {}) {
  return (project.brightDataTraces || []).filter(
    (trace) => trace.provider === "bright-data" && trace.traceStatus === "executed" && trace.countsForSponsorFit !== false
  );
}

function isUsefulTrace(trace = {}) {
  return Number(trace.resultCount || 0) > 0 && Number(trace.byteCount || 0) > 0 && trace.contentHash && trace.contentHash !== "00000000";
}

function isSourceTrace(trace = {}) {
  return trace.tool !== "search_engine" && SOURCE_TRACE_PATTERN.test(String(trace.tool || "")) && isUsefulTrace(trace);
}

function signaturePayload(runReceipt = {}) {
  return JSON.stringify({
    runId: runReceipt.runId,
    issuedAt: runReceipt.issuedAt,
    collectionMode: runReceipt.collectionMode,
    provider: runReceipt.provider,
    traceCount: runReceipt.traceCount,
    executedTraceCount: runReceipt.executedTraceCount,
    tools: runReceipt.tools,
    supportingTools: runReceipt.supportingTools,
    traceDigest: runReceipt.traceDigest,
    replayCommand: runReceipt.replayCommand
  });
}

function verifyRunReceiptSignature(runReceipt = {}, signingSecret = "") {
  const secret = String(signingSecret || "").trim();
  if (!secret) return false;
  const actual = String(runReceipt.signature || "");
  if (!/^hmac-sha256:[a-f0-9]{64}$/i.test(actual)) return false;

  const expected = `hmac-sha256:${createHmac("sha256", secret).update(signaturePayload(runReceipt)).digest("hex")}`;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function assertOfficialBrightDataMcpEndpoint(endpoint = "") {
  let url;
  try {
    url = new URL(String(endpoint || ""));
  } catch {
    throw new Error("Final receipt requires the official Bright Data MCP endpoint.");
  }

  if (url.origin !== OFFICIAL_BRIGHTDATA_MCP_ORIGIN || url.pathname !== OFFICIAL_BRIGHTDATA_MCP_PATH) {
    throw new Error("Final receipt requires the official Bright Data MCP endpoint.");
  }

  return true;
}

export function resolveFinalReceiptOutputPath(root, env = {}, allowDirect = false) {
  const configuredPath = String(env.PROOFRANK_LIVE_RECEIPT_PATH || "").trim();
  const outputPath = path.resolve(root, configuredPath || (allowDirect ? DEFAULT_DIRECT_DEBUG_RECEIPT_PATH : DEFAULT_FINAL_RECEIPT_PATH));
  const canonicalPath = path.resolve(root, DEFAULT_FINAL_RECEIPT_PATH);

  if (allowDirect && outputPath === canonicalPath) {
    throw new Error("Direct debug mode refuses to write the canonical final Bright Data receipt path.");
  }

  return outputPath;
}

export function buildFinalReceiptGate(project = {}, options = {}) {
  const traces = executedBrightDataTraces(project);
  const sourceTrace = traces.find(isSourceTrace);
  const searchTrace = traces.find((trace) => trace.tool === "search_engine");
  const discoverTrace = traces.find((trace) => trace.tool === "discover");
  const runReceipt = project.runReceipt || {};
  const signed = /^hmac-sha256:[a-f0-9]{64}$/i.test(String(runReceipt.signature || ""));
  const signingSecret = String(options.signingSecret || "").trim();
  const signatureVerified = verifyRunReceiptSignature(runReceipt, signingSecret);
  const currentTraceDigest = traceDigest(project.brightDataTraces || []);
  const traceDigestVerified = Boolean(runReceipt.traceDigest) && runReceipt.traceDigest === currentTraceDigest;
  const executedTraceCount = (project.brightDataTraces || []).filter((trace) => trace.traceStatus === "executed").length;
  const failures = [];

  if (!sourceTrace) failures.push("no executed Bright Data source scrape trace");
  if (!searchTrace || !isUsefulTrace(searchTrace)) failures.push("no executed Bright Data search_engine trace");
  if (!discoverTrace || !isUsefulTrace(discoverTrace)) failures.push("no executed Bright Data discover trace");
  if (!runReceipt.runId) failures.push("run receipt is missing");
  if (runReceipt.provider !== "bright-data") failures.push("run receipt provider is not Bright Data");
  if (runReceipt.collectionMode !== "bright-data-mcp") failures.push("run receipt is not Bright Data MCP mode");
  if (!traceDigestVerified) failures.push("run receipt trace digest does not match traces");
  if (Number(runReceipt.traceCount || 0) !== (project.brightDataTraces || []).length) failures.push("run receipt trace count does not match traces");
  if (Number(runReceipt.executedTraceCount || 0) !== executedTraceCount) failures.push("run receipt executed trace count does not match traces");
  if (!signed) failures.push("run receipt is not signed");
  if (signed && !signingSecret) failures.push("receipt signing secret is required to verify signature");
  if (signed && signingSecret && !signatureVerified) failures.push("run receipt signature is invalid");

  return {
    ok: failures.length === 0,
    failures,
    provider: sourceTrace ? "bright-data" : "",
    traceStatus: sourceTrace ? "executed" : "",
    hasSourceTrace: Boolean(sourceTrace),
    sourceTool: sourceTrace?.tool || "",
    hasSearchEngine: Boolean(searchTrace && isUsefulTrace(searchTrace)),
    hasDiscover: Boolean(discoverTrace && isUsefulTrace(discoverTrace)),
    signed,
    signatureVerified,
    traceDigestVerified,
    runId: runReceipt.runId || ""
  };
}

export function assertFinalBrightDataReceipt(project = {}, options = {}) {
  const gate = buildFinalReceiptGate(project, options);
  if (!gate.ok) {
    throw new Error(gate.failures.join("; "));
  }
  return gate;
}
