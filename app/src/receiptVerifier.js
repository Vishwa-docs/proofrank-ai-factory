const SOURCE_TRACE_PATTERN = /scrape|unlock|browser|crawl|request|dataset|web_data|markdown|source/i;
const SIGNATURE_PATTERN = /^hmac-sha256:[a-f0-9]{64}$/i;

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

function normalizeReceipt(input) {
  if (typeof input === "string") return normalizeReceipt(JSON.parse(input));
  if (Array.isArray(input)) return input[0] || {};
  if (input?.receipt) return normalizeReceipt(input.receipt);
  if (input?.project) return normalizeReceipt(input.project);
  return input || {};
}

function isUsefulTrace(trace = {}) {
  return Number(trace.resultCount || 0) > 0 && Number(trace.byteCount || 0) > 0 && trace.contentHash && trace.contentHash !== "00000000";
}

function isSponsorTrace(trace = {}) {
  return trace.provider === "bright-data" && trace.traceStatus === "executed" && trace.countsForSponsorFit !== false;
}

function hasSourceTrace(trace = {}) {
  return trace.tool !== "search_engine" && SOURCE_TRACE_PATTERN.test(String(trace.tool || "")) && isUsefulTrace(trace);
}

function hasSearchTrace(trace = {}) {
  return /search|serp/i.test(String(trace.tool || "")) && isUsefulTrace(trace);
}

function hasDiscoverTrace(trace = {}) {
  return /discover/i.test(String(trace.tool || "")) && isUsefulTrace(trace);
}

function check(label, passed, detail, soft = false) {
  return {
    label,
    status: passed ? "passed" : soft ? "notice" : "failed",
    detail
  };
}

function notice(label, detail) {
  return { label, status: "notice", detail };
}

export function verifyReceiptRecord(input) {
  let receipt;
  try {
    receipt = normalizeReceipt(input);
  } catch (error) {
    return {
      ok: false,
      title: "Receipt could not be parsed",
      summary: error.message,
      checks: [check("Valid JSON", false, "Paste an exported ProofRank evidence JSON record.")],
      failures: ["Receipt JSON did not parse."]
    };
  }

  const traces = Array.isArray(receipt.brightDataTraces) ? receipt.brightDataTraces : [];
  const sponsorTraces = traces.filter(isSponsorTrace);
  const runReceipt = receipt.runReceipt || {};
  const currentDigest = traceDigest(traces);
  const digestMatches = Boolean(runReceipt.traceDigest && runReceipt.traceDigest === currentDigest);
  const signaturePresent = SIGNATURE_PATTERN.test(String(runReceipt.signature || ""));
  const sourceTrace = sponsorTraces.find(hasSourceTrace);
  const searchTrace = sponsorTraces.find(hasSearchTrace);
  const discoverTrace = sponsorTraces.find(hasDiscoverTrace);
  const claimLedger = Array.isArray(receipt.claimLedger) ? receipt.claimLedger : [];
  const unsupportedClaims = claimLedger.filter((claim) => !/verified|supported|clear/i.test(String(claim.status || ""))).length;

  const checks = [
    check("Run receipt", Boolean(runReceipt.runId), runReceipt.runId || "No run ID found."),
    check("Bright Data provider", sponsorTraces.length > 0, `${sponsorTraces.length} sponsor-counting Bright Data trace${sponsorTraces.length === 1 ? "" : "s"}.`),
    check("Source fetch", Boolean(sourceTrace), sourceTrace ? `${sourceTrace.tool} downloaded ${sourceTrace.byteCount} bytes.` : "No executed source scrape trace."),
    check("Search", Boolean(searchTrace), searchTrace ? `${searchTrace.tool} returned ${searchTrace.resultCount} result${searchTrace.resultCount === 1 ? "" : "s"}.` : "No executed search trace."),
    check("Discovery", Boolean(discoverTrace), discoverTrace ? `${discoverTrace.tool} returned ${discoverTrace.resultCount} result${discoverTrace.resultCount === 1 ? "" : "s"}.` : "No executed discovery trace."),
    check("Trace digest", digestMatches, digestMatches ? "Digest matches the exported trace rows." : "Digest is missing or does not match the trace rows."),
    signaturePresent
      ? notice("Signature format", "HMAC signature is present. Server-side secret is required for cryptographic validation.")
      : check("Signature format", false, "No HMAC signature found."),
    check(
      "Claim support",
      unsupportedClaims === 0,
      claimLedger.length
        ? `${unsupportedClaims} claim${unsupportedClaims === 1 ? "" : "s"} still need support or reviewer attention.`
        : "No claim ledger found.",
      claimLedger.length === 0
    )
  ];

  const failures = checks.filter((item) => item.status === "failed").map((item) => `${item.label}: ${item.detail}`);
  const warnings = checks.filter((item) => item.status === "notice").map((item) => `${item.label}: ${item.detail}`);
  const ok = failures.length === 0;

  return {
    ok,
    title: ok ? "Receipt structure checks out" : "Receipt needs reviewer attention",
    summary: ok
      ? "Bright Data source, search, discovery, digest, and claim checks are present in the exported record."
      : "One or more Bright Data receipt checks are missing or inconsistent.",
    checks,
    failures,
    warnings,
    runId: runReceipt.runId || "",
    traceDigest: runReceipt.traceDigest || "",
    computedTraceDigest: currentDigest,
    traceCount: traces.length,
    sponsorTraceCount: sponsorTraces.length,
    unsupportedClaims
  };
}
