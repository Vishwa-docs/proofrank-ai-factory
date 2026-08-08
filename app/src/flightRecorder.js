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

function parseTimestamp(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf()) ? date : null;
}

function latestTimestamp(project = {}) {
  const dates = [
    project.runReceipt?.issuedAt,
    ...(project.brightDataTraces || []).map((trace) => trace.collectedAt),
    ...(project.evidenceItems || []).map((item) => item.collectedAt)
  ]
    .map(parseTimestamp)
    .filter(Boolean);

  return dates.length ? new Date(Math.max(...dates.map((date) => date.valueOf()))) : null;
}

function formatShortDate(date) {
  if (!date) return "No collection time";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function buildFreshness(project, { sponsorReady, hasPublicOnly, now = new Date() } = {}) {
  const collectedAt = latestTimestamp(project);

  if (!sponsorReady) {
    return {
      state: hasPublicOnly ? "public-only" : "waiting",
      label: hasPublicOnly ? "Public evidence only" : "Needs Bright Data timestamp",
      detail: hasPublicOnly
        ? "Run Bright Data source, search, and discovery before sponsor shortlisting."
        : "The review becomes time-boxed once source, search, and discovery execute."
    };
  }

  if (!collectedAt) {
    return {
      state: "unknown",
      label: "Collection time missing",
      detail: "Re-run Bright Data before using this in sponsor review."
    };
  }

  const ageHours = Math.max(0, Math.round((now.valueOf() - collectedAt.valueOf()) / 36e5));
  const state = ageHours <= 24 ? "fresh" : ageHours <= 72 ? "recheck-soon" : "recheck";
  const detail =
    state === "fresh"
      ? "Fresh enough for demo review. Re-run before final sponsor shortlisting."
      : state === "recheck-soon"
        ? "Still useful, but re-run if the shortlist decision is today."
        : "Stale for a live-web claim. Re-run Bright Data before relying on it.";

  return {
    state,
    label: `Fresh as of ${formatShortDate(collectedAt)}`,
    detail,
    ageHours
  };
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
      detail: planned ? "Ready for reviewer-access collection." : "No source row attached.",
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

export function buildFlightRecorder(project = {}, context = {}) {
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
      ? "Public review is attached; Bright Data sponsor calls still need reviewer access."
      : "No Bright Data calls have run yet. Source, search, and discovery are planned.";

  return {
    badge: "Bright Data flight recorder",
    sponsorEvidence,
    digest,
    freshness: buildFreshness(project, { sponsorReady, hasPublicOnly, now: context.now ? new Date(context.now) : new Date() }),
    stages
  };
}
