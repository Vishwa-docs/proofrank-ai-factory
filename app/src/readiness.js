import { brightDataTraceState, hasBrightDataSponsorProofBundle } from "./scoring.js";

function isHttpUrl(value = "") {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function hostFromUrl(value = "") {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

function isLoopbackHost(host = "") {
  const normalized = String(host).toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1" || normalized === "";
}

function isUsableLiveEndpoint(endpoint = "", pageOrigin = "") {
  if (!isHttpUrl(endpoint)) return false;
  const endpointIsLoopback = isLoopbackHost(hostFromUrl(endpoint));
  if (!endpointIsLoopback) return true;
  if (!pageOrigin) return true;
  return isLoopbackHost(hostFromUrl(pageOrigin));
}

function looksLikeNativeBuilderUrl(project = {}) {
  const evidence = project.evidence || {};
  const urls = [project.demoUrl, project.submissionUrl, project.nativeBuilderUrl].filter(Boolean);
  return evidence.nativeBuilderPublished === true || urls.some((url) => /nativelyai\.app/i.test(String(url)));
}

function inferredReviewerCount(projects = []) {
  return projects.filter((project) => String(project.id || "").startsWith("review-")).length;
}

function hasLiveReviewerEvidence(project = {}) {
  if (!String(project.id || "").startsWith("review-")) return false;

  const evidence = project.evidence || {};
  const evidenceItems = project.evidenceItems || [];
  const traces = project.brightDataTraces || [];
  const collectedEvidence =
    evidence.repoMetadataCollected === true ||
    evidence.repoTreeCollected === true ||
    evidence.packageManifestPresent === true ||
    evidenceItems.some((item) =>
      ["github-readme", "github-metadata", "github-tree", "package-manifest", "github-commits", "public-demo"].includes(item.sourceType)
    );
  const nonPendingTrace = traces.some((trace) => ["executed", "failed"].includes(trace.traceStatus));

  return collectedEvidence && nonPendingTrace;
}

function hasExecutedProjectReceipt(project = {}) {
  return Boolean(project.runReceipt?.runId && project.runReceipt?.provider === "bright-data" && hasBrightDataSponsorProofBundle(project));
}

function gate({ id, label, required = true, passed, detail, proof, action }) {
  return {
    id,
    label,
    required,
    status: passed ? "passed" : "needs-action",
    detail,
    proof,
    action
  };
}

export function buildReadiness(project = {}, context = {}) {
  const projects = context.projects?.length ? context.projects : [project];
  const evidence = project.evidence || {};
  const reviewerProjectCount = Number.isFinite(context.reviewerProjectCount)
    ? context.reviewerProjectCount
    : inferredReviewerCount(projects);
  const liveApiConfigured =
    context.mode === "live" && isUsableLiveEndpoint(context.liveApiUrl || "", context.pageOrigin || "");
  const localhostBlocked =
    context.mode === "live" &&
    isHttpUrl(context.liveApiUrl || "") &&
    isLoopbackHost(hostFromUrl(context.liveApiUrl || "")) &&
    context.pageOrigin &&
    !isLoopbackHost(hostFromUrl(context.pageOrigin));
  const sponsorProofReady = hasBrightDataSponsorProofBundle(project);
  const nativeBuilderReady = looksLikeNativeBuilderUrl(project);
  const traceState = sponsorProofReady ? "executed" : brightDataTraceState(project);
  const selectedProjectHasLiveEvidence = hasLiveReviewerEvidence(project);
  const selectedProjectHasRunReceipt = hasExecutedProjectReceipt(project);
  const selectedProjectReviewed = selectedProjectHasLiveEvidence || selectedProjectHasRunReceipt;
  const liveBackendSatisfied = liveApiConfigured || selectedProjectHasRunReceipt;

  const gates = [
    gate({
      id: "native-builder",
      label: "Native.builder primary URL",
      passed: nativeBuilderReady,
      detail: nativeBuilderReady
        ? "Primary application URL points to a native.builder deployment."
        : "Publish the primary app from native.builder; the GitHub Pages build is only fallback evidence.",
      proof: nativeBuilderReady ? project.nativeBuilderUrl || project.demoUrl || project.submissionUrl : "No nativelyai.app URL attached.",
      action: "Publish the native.builder app and paste its public URL into the submission."
    }),
    gate({
      id: "bright-data",
      label: "Bright Data evidence bundle",
      passed: sponsorProofReady,
      detail: sponsorProofReady
        ? "Evidence report contains executed Bright Data source scrape, search, and discovery traces."
        : `Current trace state is ${traceState}; evidence bundle needs executed source scrape, search, and discovery traces.`,
      proof: sponsorProofReady
        ? "provider=bright-data with executed source scrape, search, and discovery traces"
        : "Single, planned, claimed, direct, pending, and failed traces do not pass this gate.",
      action: "Fix the Bright Data token, rerun live collection, and export the full sponsor evidence bundle."
    }),
    gate({
      id: "actual-review-target",
      label: "Actual project reviewed",
      passed: selectedProjectReviewed,
      detail:
        selectedProjectHasRunReceipt
          ? "Selected project has an executed Bright Data review record."
          : selectedProjectHasLiveEvidence
            ? "Selected project has fetched repository or demo evidence."
            : reviewerProjectCount > 0
              ? "A reviewer project is present, but the selected project only has pending/manual evidence."
              : "Add the real hackathon GitHub project and deployed app that ProofRank should review.",
      proof:
        selectedProjectHasRunReceipt
          ? "Selected review record contains executed Bright Data evidence."
          : selectedProjectHasLiveEvidence
            ? "Reviewer project has fetched repository/demo evidence and a non-pending collection trace."
            : reviewerProjectCount > 0
              ? "Pending reviewer intake does not count as an actual live review."
              : "Only built-in demonstration submissions are loaded.",
      action: "Run live collection against the actual GitHub repository and deployed app URL."
    }),
    gate({
      id: "live-backend",
      label: "Live collection backend",
      passed: liveBackendSatisfied,
      detail: selectedProjectHasRunReceipt
        ? "A server-side Bright Data run record is attached for this project."
        : liveApiConfigured
          ? "The UI is pointed at a live server-side review endpoint."
        : localhostBlocked
          ? "Hosted fallback pages cannot call a localhost review endpoint."
        : "Demo mode can rank fixtures, but real use needs the backend running in live mode.",
      proof: selectedProjectHasRunReceipt ? project.runReceipt.runId : liveApiConfigured ? context.liveApiUrl : localhostBlocked ? context.liveApiUrl : "Live mode is not configured.",
      action: "Start npm run live:server, switch to Bright Data live mode, and keep the endpoint server-side."
    }),
    gate({
      id: "public-app",
      label: "Public app URL",
      passed: isHttpUrl(project.demoUrl || ""),
      detail: "Judges need a reachable application URL for the complete workflow.",
      proof: project.demoUrl || "No public demo URL attached.",
      action: "Attach a public demo URL."
    }),
    gate({
      id: "source-evidence",
      label: "Public source evidence",
      passed: isHttpUrl(project.githubUrl || ""),
      detail: "Public implementation evidence makes native.builder and live-review claims easier to inspect.",
      proof: project.githubUrl || "No public repository URL attached.",
      action: "Attach the public GitHub repository or equivalent source evidence."
    }),
    gate({
      id: "demo-video",
      label: "Under-three-minute demo video",
      passed: Boolean(evidence.hasDemo),
      detail: "The hackathon requires a short video showing one complete workflow.",
      proof: evidence.hasDemo ? "Demo video artifact prepared." : "No demo video evidence attached.",
      action: "Upload the prepared demo video release asset to the submission."
    }),
    gate({
      id: "secret-hygiene",
      label: "No visible secret risk",
      required: false,
      passed: evidence.secretRiskVisible !== true,
      detail: "Public repos and receipts should not expose API keys, tokens, or private account state.",
      proof: evidence.secretRiskVisible ? "Potential secret exposure flagged." : "No visible secret-risk signal in current evidence.",
      action: "Remove any visible secrets before final judging."
    }),
    gate({
      id: "proof-export",
      label: "Exportable review memo",
      required: false,
      passed: Boolean(evidence.proofReceipt),
      detail: "A review package should include scores, claim checks, evidence rows, review panel, and similarity findings.",
      proof: evidence.proofReceipt ? "Evidence report surface available." : "Evidence export not available.",
      action: "Export the selected receipt and Markdown memo after the live run."
    })
  ];

  const required = gates.filter((item) => item.required);
  const competitive = gates.filter((item) => !item.required);
  const requiredPassed = required.filter((item) => item.status === "passed").length;
  const competitivePassed = competitive.filter((item) => item.status === "passed").length;
  const nextActions = gates
    .filter((item) => item.status !== "passed")
    .sort((a, b) => Number(b.required) - Number(a.required))
    .slice(0, 4)
    .map((item) => item.action);

  return {
    proofPackageReady: requiredPassed === required.length,
    canSubmit: requiredPassed === required.length,
    sponsorProofReady,
    nativeBuilderReady,
    traceState,
    requiredPassed,
    requiredTotal: required.length,
    competitivePassed,
    competitiveTotal: competitive.length,
    score: Math.round(((requiredPassed + competitivePassed * 0.5) / (required.length + competitive.length * 0.5)) * 100),
    gates,
    nextActions
  };
}

export function readinessSummary(readiness) {
  const proofPackageReady = readiness.proofPackageReady ?? readiness.canSubmit;
  if (proofPackageReady) {
    return `Evidence package ready: ${readiness.requiredPassed}/${readiness.requiredTotal} internal evidence gates checked. Final lablab submission is tracked separately.`;
  }

  return `Evidence package not ready: ${readiness.requiredPassed}/${readiness.requiredTotal} internal evidence gates checked. Next action: ${
    readiness.nextActions[0] || "Review missing proof."
  }`;
}
