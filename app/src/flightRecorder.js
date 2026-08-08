function traceText(trace = {}) {
  return `${trace.tool || ""} ${trace.queryOrUrl || ""}`.toLowerCase();
}

function traceState(trace = {}) {
  return String(trace.traceStatus || trace.status || "pending").toLowerCase();
}

function isExecutedTrace(trace = {}) {
  return traceState(trace) === "executed";
}

function findTrace(project = {}, matcher) {
  return (project.brightDataTraces || []).find((trace) => matcher(traceText(trace)));
}

function hasDirectPublicTrace(project = {}) {
  return (project.brightDataTraces || []).some(
    (trace) => trace.provider === "direct" && isExecutedTrace(trace)
  );
}

function stageFromTrace({ label, planned, trace }) {
  if (!trace) {
    return {
      label,
      state: planned ? "planned" : "missing",
      tool: planned ? "planned" : "not collected",
      detail: planned ? "Ready for private collection." : "No source row attached.",
      countsForSponsor: false
    };
  }

  const executed = isExecutedTrace(trace);
  return {
    label,
    state: executed ? "executed" : "pending",
    tool: trace.tool || "Bright Data",
    detail: `${trace.resultCount || 0} result${trace.resultCount === 1 ? "" : "s"}; ${trace.status || traceState(trace)}.`,
    countsForSponsor: executed && trace.provider !== "direct",
    byteCount: trace.byteCount || 0,
    contentHash: trace.contentHash || ""
  };
}

export function buildFlightRecorder(project = {}) {
  const traces = project.brightDataTraces || [];
  const planned = traces.length === 0 || traces.some((trace) => /pending|planned|waiting/i.test(traceState(trace)));
  const source = findTrace(project, (text) => /scrape|source|markdown|scraper/.test(text));
  const search = findTrace(project, (text) => /search|serp/.test(text));
  const discover = findTrace(project, (text) => /discover/.test(text));
  const receipt = project.runReceipt || null;
  const hasPublicOnly = hasDirectPublicTrace(project) && !source && !search && !discover;

  let stages = [
    stageFromTrace({ label: "Source fetch", planned, trace: source }),
    stageFromTrace({ label: "Web search", planned, trace: search }),
    stageFromTrace({ label: "Discovery", planned, trace: discover })
  ];

  if (hasPublicOnly) {
    stages = stages.map((stage) => ({
      ...stage,
      state: "public-only",
      tool: "direct public fetch",
      detail: "Public repo or demo evidence is attached; Bright Data sponsor calls are still gated.",
      countsForSponsor: false
    }));
  }

  stages.push({
    label: "Saved review",
    state: receipt?.traceDigest ? "saved" : planned || hasPublicOnly ? "planned" : "missing",
    tool: receipt?.runId || "review memo",
    detail: receipt?.traceDigest
      ? `${receipt.collectionMode || "collection"} saved review attached.`
      : "Export after source, search, and discovery are attached.",
    countsForSponsor: Boolean(receipt?.traceDigest)
  });

  const sponsorReady = stages.every((stage) => stage.countsForSponsor);
  const hasBrightDataAttempt = Boolean(source || search || discover || receipt?.traceDigest);
  const sponsorEvidence = sponsorReady ? "ready" : hasBrightDataAttempt || hasPublicOnly ? "gated" : "not run";
  const digest = sponsorReady
    ? "Bright Data source, search, discovery, and saved review are attached."
    : hasPublicOnly
      ? "Public review is attached; Bright Data sponsor calls still need private collection."
      : "No Bright Data calls have run yet. Source, search, and discovery are planned.";

  return {
    badge: "Bright Data flight recorder",
    sponsorEvidence,
    digest,
    stages
  };
}
