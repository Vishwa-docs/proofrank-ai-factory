const WEIGHTS = {
  eligibility: 0.25,
  brightDataFit: 0.25,
  businessValue: 0.2,
  originality: 0.15,
  presentation: 0.15
};

const BRIGHT_ROLE_POINTS = {
  none: 0,
  supporting: 24,
  "load-bearing": 48,
  agentic: 55
};

const SOURCE_TRACE_PATTERN = /scrape|unlock|browser|crawl|request|dataset|web_data/i;

function isBrightDataMode(value = "") {
  return /\bbright[-\s]?data\b|remote[-\s]?mcp|web[-\s]?unlocker|serp|web[-\s]?scraper/i.test(String(value));
}

function isBrightDataTrace(trace = {}) {
  return trace.provider === "bright-data" || isBrightDataMode(trace.mode);
}

function isUsefulTrace(trace = {}) {
  return Number(trace.resultCount || 0) > 0 && Number(trace.byteCount || 0) > 0 && trace.contentHash && trace.contentHash !== "00000000";
}

function isExecutedSponsorTrace(trace = {}) {
  return trace.countsForSponsorFit !== false && trace.traceStatus === "executed" && isBrightDataTrace(trace) && isUsefulTrace(trace);
}

function isSourceTrace(trace = {}) {
  return trace.tool !== "search_engine" && SOURCE_TRACE_PATTERN.test(String(trace.tool || "")) && isUsefulTrace(trace);
}

export function hasExecutedBrightDataTrace(project = {}) {
  const traces = project.brightDataTraces || [];

  return traces.some(isExecutedSponsorTrace);
}

export function hasBrightDataSponsorProofBundle(project = {}) {
  const traces = (project.brightDataTraces || []).filter(isExecutedSponsorTrace);
  const hasSourceTrace = traces.some(isSourceTrace);
  const hasSearchTrace = traces.some((trace) => trace.tool === "search_engine");
  const hasDiscoverTrace = traces.some((trace) => trace.tool === "discover");

  return hasSourceTrace && hasSearchTrace && hasDiscoverTrace;
}

export function brightDataTraceState(project = {}) {
  const evidence = project.evidence || {};
  const traces = project.brightDataTraces || [];

  if (hasExecutedBrightDataTrace(project)) return "executed";
  if (traces.some((trace) => trace.provider === "bright-data" && trace.traceStatus === "failed")) return "failed";
  if (evidence.brightDataTraceStatus === "executed") return "claimed";
  if (evidence.brightDataTraceStatus) return evidence.brightDataTraceStatus;
  if (traces.some((trace) => trace.traceStatus === "planned" || trace.mode === "planned")) return "planned";
  if (traces.some((trace) => trace.provider === "direct" && trace.traceStatus === "executed")) return "direct";
  if (evidence.brightDataTrace) return "planned";
  return "missing";
}

export function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function boolPoints(value, points) {
  return value ? points : 0;
}

export function calculateScores(project) {
  const evidence = project.evidence || {};
  const brightTools = evidence.brightDataTools || [];
  const executedBrightTrace = hasExecutedBrightDataTrace(project);
  const sponsorProofBundle = hasBrightDataSponsorProofBundle(project);

  const eligibility = clampScore(
    boolPoints(evidence.hasDemo, 14) +
      boolPoints(evidence.hasPublicDemo, 12) +
      boolPoints(evidence.hasGithub, 8) +
      boolPoints(evidence.hasPresentation, 8) +
      boolPoints(evidence.nativeBuilderExplained, 18) +
      boolPoints(evidence.builtDuringEvent, 10) +
      boolPoints(evidence.isFunctional, 18) +
      boolPoints(evidence.notLandingPage, 12) +
      boolPoints(evidence.repoTreeCollected, 4) +
      boolPoints(evidence.packageManifestPresent, 4) +
      boolPoints(evidence.licensePresent, 3) +
      boolPoints(evidence.repoTreeCollected && !evidence.secretRiskVisible, 5) -
      boolPoints(evidence.secretRiskVisible, 8)
  );

  const rawBrightDataFit = clampScore(
    (BRIGHT_ROLE_POINTS[evidence.brightDataRole] || 0) +
      Math.min(brightTools.length, 3) * 7 +
      boolPoints(evidence.agenticLoop, 12) +
      boolPoints(executedBrightTrace, 5) +
      boolPoints(sponsorProofBundle, 5) +
      boolPoints(evidence.proofReceipt, 6)
  );
  const brightDataFit = sponsorProofBundle ? rawBrightDataFit : executedBrightTrace ? Math.min(rawBrightDataFit, 84) : Math.min(rawBrightDataFit, 72);

  const presentation = clampScore(
    boolPoints(evidence.hasDemo, 25) +
      boolPoints(evidence.hasPublicDemo, 15) +
      boolPoints(evidence.hasPresentation, 25) +
      boolPoints(evidence.demoWorkflow, 20) +
      boolPoints(evidence.conciseSummary, 15)
  );

  const businessValue = clampScore(
    boolPoints(evidence.targetUser, 20) +
      boolPoints(evidence.clearPain, 22) +
      boolPoints(evidence.repeatableWorkflow, 20) +
      boolPoints(evidence.buyerExists, 18) +
      boolPoints(evidence.urgency, 20)
  );

  const originality = clampScore(
    boolPoints(evidence.differentiation, 30) +
      boolPoints(evidence.lowCrowdOverlap, 18) +
      boolPoints(evidence.proofReceipt, 18) +
      boolPoints(evidence.specificWedge, 16) +
      boolPoints(evidence.nonGenericAgent, 18)
  );

  const overall = clampScore(
    eligibility * WEIGHTS.eligibility +
      brightDataFit * WEIGHTS.brightDataFit +
      businessValue * WEIGHTS.businessValue +
      originality * WEIGHTS.originality +
      presentation * WEIGHTS.presentation
  );
  const rawBrightDataPrize = clampScore(
    brightDataFit * 0.45 +
      eligibility * 0.15 +
      businessValue * 0.15 +
      originality * 0.15 +
      presentation * 0.1 +
      boolPoints(executedBrightTrace, 4) +
      boolPoints(sponsorProofBundle, 8)
  );
  const brightDataPrize = sponsorProofBundle ? rawBrightDataPrize : executedBrightTrace ? Math.min(rawBrightDataPrize, 78) : Math.min(rawBrightDataPrize, 64);

  return {
    eligibility,
    brightDataFit,
    brightDataPrize,
    presentation,
    businessValue,
    originality,
    overall
  };
}

export function buildVerdict(project, scores = calculateScores(project)) {
  const evidence = project.evidence || {};
  const executedBrightTrace = hasExecutedBrightDataTrace(project);
  const sponsorProofBundle = hasBrightDataSponsorProofBundle(project);
  const risks = [];

  if (!evidence.hasPublicDemo) risks.push("Publish public demo before submission");
  if (!evidence.nativeBuilderExplained) risks.push("Add native.builder usage explanation");
  if (!evidence.hasGithub) risks.push("Add public source or implementation evidence");
  if (!sponsorProofBundle) {
    risks.push(executedBrightTrace ? "Complete the Bright Data source/search/discovery run" : "Run the Bright Data source/search/discovery review");
  }
  if (evidence.secretRiskVisible) risks.push("Remove visible secrets or sensitive files from public repo");
  if (scores.brightDataFit < 55) risks.push("Bright Data usage is not load-bearing enough");
  if (scores.originality < 70) risks.push("Differentiate more sharply from adjacent entries");

  let label = "High risk";
  let action = "Manual review required";

  if (scores.overall >= 86 && evidence.hasPublicDemo && scores.brightDataFit >= 75 && sponsorProofBundle) {
    label = "Strong candidate";
    action = "Shortlist for judge review";
  } else if (scores.overall >= 78 && scores.brightDataFit >= 70) {
    label = "Strong but gated";
    action = evidence.hasPublicDemo ? "Verify live workflow" : "Publish then verify";
  } else if (scores.overall >= 62) {
    label = "Needs review";
    action = "Ask for missing evidence";
  }

  return {
    label,
    action,
    risks
  };
}

export function scoreProject(project) {
  const scores = calculateScores(project);
  return {
    ...project,
    scores,
    verdict: buildVerdict(project, scores)
  };
}

export function rankProjects(projects) {
  return projects.map(scoreProject).sort((a, b) => b.scores.overall - a.scores.overall);
}
