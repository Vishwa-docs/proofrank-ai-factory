const STOPWORDS = new Set([
  "about",
  "across",
  "after",
  "against",
  "agent",
  "agents",
  "built",
  "data",
  "demo",
  "from",
  "have",
  "into",
  "native",
  "project",
  "public",
  "that",
  "their",
  "them",
  "this",
  "through",
  "using",
  "with",
  "workflow"
]);

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function textForProject(project = {}) {
  return [
    project.title,
    project.summary,
    project.domain,
    ...(project.technologies || []),
    ...(project.trackTags || [])
  ]
    .filter(Boolean)
    .join(" ");
}

function tokensFor(project = {}) {
  const text = textForProject(project).toLowerCase();
  return new Set(
    text
      .replace(/[^a-z0-9.+#\s-]/g, " ")
      .split(/[\s/-]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4 && !STOPWORDS.has(token))
  );
}

function intersectionSize(a, b) {
  let count = 0;
  for (const item of a) {
    if (b.has(item)) count += 1;
  }
  return count;
}

function jaccard(a, b) {
  if (!a.size && !b.size) return 0;
  const overlap = intersectionSize(a, b);
  return overlap / (a.size + b.size - overlap);
}

function sharedValues(left = [], right = []) {
  const rightSet = new Set(right.map((item) => cleanText(item).toLowerCase()));
  return left.filter((item) => rightSet.has(cleanText(item).toLowerCase()));
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function titleOverlap(left = "", right = "") {
  const leftTokens = tokensFor({ title: left });
  const rightTokens = tokensFor({ title: right });
  return jaccard(leftTokens, rightTokens);
}

function overlapReasons(target, candidate, sharedTerms, sharedTech, sameDomain) {
  const reasons = [];
  if (sameDomain) reasons.push(`same ${target.domain} domain`);
  if (sharedTech.length) reasons.push(`shared tools: ${sharedTech.slice(0, 2).join(", ")}`);
  if (sharedTerms.length) reasons.push(`shared terms: ${sharedTerms.slice(0, 4).join(", ")}`);
  if (!reasons.length) reasons.push("low lexical overlap");
  return reasons;
}

function compareProject(target, candidate) {
  const targetTokens = tokensFor(target);
  const candidateTokens = tokensFor(candidate);
  const sharedTerms = [...targetTokens].filter((token) => candidateTokens.has(token));
  const sharedTech = sharedValues(target.technologies || [], candidate.technologies || []);
  const sameDomain = Boolean(target.domain && candidate.domain && target.domain === candidate.domain);
  const lexical = jaccard(targetTokens, candidateTokens);
  const title = titleOverlap(target.title, candidate.title);
  const tech = sharedTech.length / Math.max(1, Math.min((target.technologies || []).length, (candidate.technologies || []).length));
  const overlap = clampScore(title * 38 + lexical * 34 + tech * 18 + (sameDomain ? 10 : 0));

  return {
    id: candidate.id,
    title: candidate.title,
    team: candidate.team,
    overlap,
    reasons: overlapReasons(target, candidate, sharedTerms, sharedTech, sameDomain),
    risk: overlap >= 78 ? "high" : overlap >= 52 ? "watch" : "low"
  };
}

function buildDifferentiators(project = {}) {
  const evidence = project.evidence || {};
  const text = textForProject(project).toLowerCase();
  const differentiators = [];

  if (evidence.proofReceipt || text.includes("proof receipt") || text.includes("evidence receipt")) {
    differentiators.push("Turns judging into evidence records instead of one-shot summaries.");
  }

  if (text.includes("tribunal") || (evidence.proofReceipt && evidence.lowCrowdOverlap)) {
    differentiators.push("Combines claim checks with a multi-perspective review panel.");
  }

  if (evidence.repoTreeCollected && evidence.packageManifestPresent) {
    differentiators.push("Checks repository depth and reproducibility, not only submitted copy.");
  }

  if (evidence.brightDataTraceStatus === "executed") {
    differentiators.push("Shows executed Bright Data trace provenance inside the receipt.");
  } else if (evidence.brightDataTraceStatus) {
    differentiators.push(`Makes Bright Data trace state explicit as ${evidence.brightDataTraceStatus}.`);
  }

  if (!differentiators.length) {
    differentiators.push("Needs a sharper, source-backed wedge before final submission.");
  }

  return differentiators.slice(0, 4);
}

function buildQueries(project = {}, similarProjects = []) {
  const title = cleanText(project.title || "project");
  const team = cleanText(project.team || "team");
  const closest = similarProjects[0]?.title || "adjacent hackathon projects";

  return [
    {
      tool: "search_engine",
      purpose: "Exact project and team prior-art search",
      query: `"${title}" "${team}" hackathon`
    },
    {
      tool: "search_engine",
      purpose: "Sponsor-claim overlap search",
      query: `"${title}" "Bright Data" OR "evidence receipt" OR "source-backed"`
    },
    {
      tool: "discover",
      purpose: "Find adjacent products and copied-claim risk",
      query: `${title} compared with ${closest}`,
      intent: "Find public projects with overlapping title, workflow, buyer, sponsor usage, or proof claims."
    }
  ];
}

export function buildOriginalityRadar(project, fieldProjects = []) {
  const comparisons = fieldProjects
    .filter((candidate) => candidate && candidate.id !== project.id)
    .map((candidate) => compareProject(project, candidate))
    .sort((a, b) => b.overlap - a.overlap);

  const topOverlap = comparisons[0]?.overlap || 0;
  const differentiators = buildDifferentiators(project);
  const rawScore = clampScore(100 - topOverlap * 0.75 + Math.min(differentiators.length, 3) * 3);
  const score = comparisons.length ? rawScore : Math.min(rawScore, 82);
  const riskLabel = comparisons.length
    ? topOverlap >= 78
      ? "High overlap risk"
      : topOverlap >= 52
        ? "Watch overlap"
        : "Distinct angle"
    : "Needs broader prior-art field";

  return {
    riskLabel,
    score,
    topOverlap,
    similarProjects: comparisons.slice(0, 4),
    differentiators,
    brightDataQueries: buildQueries(project, comparisons)
  };
}
