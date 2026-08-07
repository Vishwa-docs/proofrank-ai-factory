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

export function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function boolPoints(value, points) {
  return value ? points : 0;
}

export function calculateScores(project) {
  const evidence = project.evidence || {};
  const brightTools = evidence.brightDataTools || [];

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

  const brightDataFit = clampScore(
    (BRIGHT_ROLE_POINTS[evidence.brightDataRole] || 0) +
      Math.min(brightTools.length, 3) * 7 +
      boolPoints(evidence.agenticLoop, 12) +
      boolPoints(evidence.brightDataTrace, 6) +
      boolPoints(evidence.proofReceipt, 6)
  );

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

  return {
    eligibility,
    brightDataFit,
    presentation,
    businessValue,
    originality,
    overall
  };
}

export function buildVerdict(project, scores = calculateScores(project)) {
  const evidence = project.evidence || {};
  const risks = [];

  if (!evidence.hasPublicDemo) risks.push("Publish public demo before submission");
  if (!evidence.nativeBuilderExplained) risks.push("Add native.builder usage explanation");
  if (!evidence.hasGithub) risks.push("Add public source or implementation evidence");
  if (!evidence.brightDataTrace) risks.push("Show Bright Data collection trace");
  if (evidence.secretRiskVisible) risks.push("Remove visible secrets or sensitive files from public repo");
  if (scores.brightDataFit < 55) risks.push("Bright Data usage is not load-bearing enough");
  if (scores.originality < 70) risks.push("Differentiate more sharply from adjacent entries");

  let label = "High risk";
  let action = "Manual review required";

  if (scores.overall >= 86 && evidence.hasPublicDemo && scores.brightDataFit >= 75) {
    label = "Finalist-ready";
    action = "Shortlist for judge review";
  } else if (scores.overall >= 78 && scores.brightDataFit >= 70) {
    label = "Strong but gated";
    action = evidence.hasPublicDemo ? "Verify live workflow" : "Publish then verify";
  } else if (scores.overall >= 62) {
    label = "Needs review";
    action = "Request missing proof";
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
