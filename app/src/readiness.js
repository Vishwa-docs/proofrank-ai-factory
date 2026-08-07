import { brightDataTraceState, hasExecutedBrightDataTrace } from "./scoring.js";

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
  const sponsorProofReady = hasExecutedBrightDataTrace(project);
  const nativeBuilderReady = looksLikeNativeBuilderUrl(project);
  const traceState = sponsorProofReady ? "executed" : brightDataTraceState(project);

  const gates = [
    gate({
      id: "native-builder",
      label: "Native.builder primary URL",
      passed: nativeBuilderReady,
      detail: nativeBuilderReady
        ? "Primary application URL points to a native.builder deployment."
        : "Publish the primary app from native.builder; the GitHub Pages build is only fallback evidence.",
      proof: nativeBuilderReady ? project.demoUrl || project.nativeBuilderUrl : "No nativelyai.app URL attached.",
      action: "Publish the native.builder app and paste its public URL into the submission."
    }),
    gate({
      id: "bright-data",
      label: "Executed Bright Data trace",
      passed: sponsorProofReady,
      detail: sponsorProofReady
        ? "At least one receipt contains an executed Bright Data provider trace."
        : `Current trace state is ${traceState}; sponsor proof needs an executed Bright Data run.`,
      proof: sponsorProofReady
        ? "provider=bright-data and traceStatus=executed"
        : "Planned, claimed, direct, pending, and failed traces do not pass this gate.",
      action: "Fix the Bright Data token, rerun live collection, and export a receipt with executed sponsor traces."
    }),
    gate({
      id: "actual-review-target",
      label: "Actual project reviewed",
      passed: reviewerProjectCount > 0,
      detail:
        reviewerProjectCount > 0
          ? `${reviewerProjectCount} user-supplied project${reviewerProjectCount === 1 ? "" : "s"} added to the queue.`
          : "Add the real hackathon GitHub project and deployed app that ProofRank should review.",
      proof: reviewerProjectCount > 0 ? "Reviewer project present in the current queue." : "Only built-in demonstration submissions are loaded.",
      action: "Add the actual GitHub repository and deployed app URL in the reviewer intake."
    }),
    gate({
      id: "live-backend",
      label: "Live collection backend",
      passed: liveApiConfigured,
      detail: liveApiConfigured
        ? "The UI is pointed at a live server-side review endpoint."
        : localhostBlocked
          ? "Hosted fallback pages cannot call a localhost review endpoint."
        : "Demo mode can rank fixtures, but real use needs the backend running in live mode.",
      proof: liveApiConfigured ? context.liveApiUrl : localhostBlocked ? context.liveApiUrl : "Live mode is not configured.",
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
      label: "Exportable proof packet",
      required: false,
      passed: Boolean(evidence.proofReceipt),
      detail: "A judge packet should include scores, claim ledger, traces, tribunal, and originality findings.",
      proof: evidence.proofReceipt ? "Proof receipt surface available." : "Receipt export not available.",
      action: "Export the selected receipt and Markdown packet after the live run."
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
  if (readiness.canSubmit) {
    return `Ready for final submission: ${readiness.requiredPassed}/${readiness.requiredTotal} required gates passed.`;
  }

  return `Not submission-safe yet: ${readiness.requiredPassed}/${readiness.requiredTotal} required gates passed. Next action: ${
    readiness.nextActions[0] || "Review missing proof."
  }`;
}
