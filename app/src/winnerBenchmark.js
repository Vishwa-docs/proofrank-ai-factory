import { hasBrightDataSponsorProofBundle } from "./scoring.js";

function looksLikeNativeBuilderUrl(project = {}) {
  const evidence = project.evidence || {};
  const urls = [project.demoUrl, project.submissionUrl, project.nativeBuilderUrl].filter(Boolean);
  return evidence.nativeBuilderPublished === true || urls.some((url) => /nativelyai\.app/i.test(String(url)));
}

function brightToolCount(project = {}) {
  return new Set((project.evidence?.brightDataTools || []).map((tool) => String(tool).toLowerCase())).size;
}

function hasDecisionOutput(project = {}) {
  const evidence = project.evidence || {};
  const searchable = `${project.title || ""} ${project.summary || ""}`.toLowerCase();
  return (
    evidence.proofReceipt === true ||
    (evidence.targetUser && evidence.clearPain && evidence.repeatableWorkflow) ||
    /\b(rank|score|receipt|audit|review|decision|approve|block|escalate|validate)\b/.test(searchable)
  );
}

function hasVisibleProof(project = {}) {
  return Boolean(project.evidence?.proofReceipt) && (project.evidenceItems || []).length >= 2;
}

function hasOriginalityWedge(project = {}) {
  const evidence = project.evidence || {};
  return Boolean(evidence.specificWedge && evidence.nonGenericAgent && (evidence.lowCrowdOverlap || evidence.differentiation));
}

function hasPublicWorkflow(project = {}) {
  const evidence = project.evidence || {};
  return Boolean(evidence.hasDemo && evidence.hasPublicDemo && evidence.hasGithub) || Boolean(project.demoUrl && project.githubUrl);
}

const BENCHMARKS = [
  {
    id: "decision-work-product",
    label: "Decision-shaped output",
    points: 16,
    test: hasDecisionOutput,
    proof: "Transforms public evidence into a ranked review action, not a generic summary.",
    action: "Frame the result as a decision, score, audit receipt, or workflow artifact."
  },
  {
    id: "executed-live-web",
    label: "Executed live-web bundle",
    points: 20,
    test: hasBrightDataSponsorProofBundle,
    proof: "Bright Data source scrape, search_engine, and discover traces are executed and useful.",
    action: "Run Bright Data source, search, and discovery traces, then export the verified evidence receipt."
  },
  {
    id: "multi-tool-bright-data",
    label: "Multi-tool Bright Data dependency",
    points: 14,
    test: (project) => ["load-bearing", "agentic"].includes(project.evidence?.brightDataRole) && brightToolCount(project) >= 2,
    proof: "Bright Data is represented by more than one live-data surface and is central to the workflow.",
    action: "Make Bright Data load-bearing with at least two visible tools or MCP capabilities."
  },
  {
    id: "judge-visible-proof",
    label: "Judge-visible proof trail",
    points: 16,
    test: hasVisibleProof,
    proof: "Evidence items, claim checks, and receipt surfaces make verification inspectable.",
    action: "Expose evidence snippets, trace provenance, limitations, and exportable receipts."
  },
  {
    id: "defensible-originality",
    label: "Defensible originality wedge",
    points: 12,
    test: hasOriginalityWedge,
    proof: "Specific wedge and low-overlap reasoning are visible before the judge asks.",
    action: "Show why this is not a copy: overlap, differentiators, and prior-art queries."
  },
  {
    id: "public-end-to-end",
    label: "Public end-to-end workflow",
    points: 10,
    test: hasPublicWorkflow,
    proof: "Judges can inspect a public app, public source, and a complete demo path.",
    action: "Attach public app, public source, and a complete workflow demo."
  },
  {
    id: "native-builder-primary",
    label: "Native.builder primary deployment",
    points: 12,
    test: looksLikeNativeBuilderUrl,
    proof: "Primary URL is a public native.builder deployment.",
    action: "Publish the public native.builder URL and use it as the primary submission app."
  }
];

function tierForScore(score) {
  if (score >= 90) return "Sponsor-prize ready";
  if (score >= 60) return "Prize-shaped but gated";
  if (score >= 35) return "Promising but thin";
  return "Not prize-shaped";
}

export function buildWinnerBenchmark(project = {}) {
  const matches = [];
  const gaps = [];

  for (const benchmark of BENCHMARKS) {
    const passed = benchmark.test(project);
    const item = {
      id: benchmark.id,
      label: benchmark.label,
      points: benchmark.points,
      proof: benchmark.proof,
      action: benchmark.action
    };

    if (passed) matches.push(item);
    else gaps.push(item);
  }

  const score = matches.reduce((sum, item) => sum + item.points, 0);

  return {
    score,
    tier: tierForScore(score),
    matches,
    gaps
  };
}
