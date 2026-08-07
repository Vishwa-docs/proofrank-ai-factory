function gate({ id, label, required = true, passed, proof, action }) {
  return {
    id,
    label,
    required,
    status: passed ? "passed" : "needs-action",
    proof,
    action
  };
}

function bool(value) {
  return value === true;
}

function nativeBuilderProof(nativeBuilder = {}) {
  return nativeBuilder.url || "No nativelyai.app URL configured.";
}

function brightAuthProof(brightAuth = {}) {
  if (brightAuth.ok) return `HTTP ${brightAuth.httpStatus || 200}; account auth accepted.`;
  const status = brightAuth.httpStatus ? `HTTP ${brightAuth.httpStatus}` : "No Bright Data auth check passed";
  const shape = brightAuth.tokenShape?.looksLikeUuid ? "token shape looks UUID-like" : "token needs replacement";
  return `${status}; ${shape}.`;
}

function mcpToolsProof(mcpTools = {}) {
  if (mcpTools.baseToolsPresent) return `Base tools present: ${["search_engine", "scrape_as_markdown", "discover"].join(", ")}.`;
  const sample = (mcpTools.sampleTools || []).join(", ");
  return sample ? `Missing required base tools. Sample tools: ${sample}.` : "MCP tools were not listed.";
}

function liveReceiptProof(liveReceipt = {}) {
  if (!liveReceipt.ok) return "No signed executed Bright Data project receipt attached.";
  return [
    liveReceipt.runId || "run receipt",
    liveReceipt.provider || "unknown-provider",
    liveReceipt.traceStatus || "unknown-trace",
    liveReceipt.hasSearchEngine ? "search_engine" : "missing search_engine",
    liveReceipt.signed ? "signed" : "unsigned"
  ].join(" / ");
}

function releaseVideoProof(releaseVideo = {}) {
  const duration = Number(releaseVideo.durationSeconds || 0);
  const durationText = duration ? `${Math.round(duration)}s` : "duration unknown";
  return releaseVideo.url ? `${releaseVideo.url} / ${durationText}` : durationText;
}

export function buildFinalReadinessReport(state = {}) {
  const gates = [
    gate({
      id: "public-fallback",
      label: "Public fallback app",
      passed: bool(state.publicFallback?.ok),
      proof: state.publicFallback?.evidence || state.publicFallback?.url || "Fallback app was not verified.",
      action: "Deploy the public fallback app and confirm the Bright proof strip is visible."
    }),
    gate({
      id: "release-video",
      label: "Under-three-minute demo video",
      passed: bool(state.releaseVideo?.ok) && Number(state.releaseVideo?.durationSeconds || 999) <= 180,
      proof: releaseVideoProof(state.releaseVideo),
      action: "Upload a demo video shorter than three minutes and verify the public release asset."
    }),
    gate({
      id: "workflow-proof",
      label: "Replayable UI workflow proof",
      passed: bool(state.workflowProof?.ok),
      proof: state.workflowProof?.path || "Workflow proof JSON was not generated.",
      action: "Run npm run workflow:proof and attach the generated JSON artifact."
    }),
    gate({
      id: "target-review",
      label: "Actual review target URLs",
      passed: bool(state.targetReview?.ok) && bool(state.targetReview?.repoReachable) && bool(state.targetReview?.demoReachable),
      proof:
        state.targetReview?.repoUrl && state.targetReview?.demoUrl
          ? `${state.targetReview.repoUrl} / ${state.targetReview.demoUrl}`
          : "No review repo/demo pair verified.",
      action: "Provide a public GitHub repo and reachable deployed demo for the project to review."
    }),
    gate({
      id: "native-builder",
      label: "Native.builder primary URL",
      passed: bool(state.nativeBuilder?.ok) && /nativelyai\.app/i.test(String(state.nativeBuilder?.url || "")),
      proof: nativeBuilderProof(state.nativeBuilder),
      action: "Publish the native.builder app and paste the public nativelyai.app URL."
    }),
    gate({
      id: "bright-auth",
      label: "Bright Data account auth",
      passed: bool(state.brightAuth?.ok),
      proof: brightAuthProof(state.brightAuth),
      action: "Replace BRIGHTDATA_API_TOKEN with a real Bright Data account API key."
    }),
    gate({
      id: "mcp-tools",
      label: "Bright Data MCP base tools",
      passed: bool(state.mcpTools?.ok) && bool(state.mcpTools?.baseToolsPresent),
      proof: mcpToolsProof(state.mcpTools),
      action: "Run npm run brightdata:mcp-smoke until search_engine, scrape_as_markdown, and discover are listed."
    }),
    gate({
      id: "live-api",
      label: "Public live review API",
      passed: bool(state.liveApi?.ok),
      proof: state.liveApi?.url || "No public live API health check passed.",
      action: "Deploy the live review API and confirm /health returns ok."
    }),
    gate({
      id: "live-receipt",
      label: "Signed executed Bright Data receipt",
      passed:
        bool(state.liveReceipt?.ok) &&
        state.liveReceipt?.provider === "bright-data" &&
        state.liveReceipt?.traceStatus === "executed" &&
        bool(state.liveReceipt?.hasSearchEngine) &&
        bool(state.liveReceipt?.signed),
      proof: liveReceiptProof(state.liveReceipt),
      action: "Run the actual project through MCP mode and export a signed receipt with executed Bright Data traces."
    }),
    gate({
      id: "lablab-submission",
      label: "lablab.ai final submission",
      passed: bool(state.lablabSubmission?.ok),
      proof: state.lablabSubmission?.url || "No final lablab submission URL recorded.",
      action: "Submit from the authenticated team-owner lablab.ai account."
    }),
    gate({
      id: "candidate-targets",
      label: "Candidate review target shortlist",
      required: false,
      passed: bool(state.candidateTargets?.ok),
      proof: state.candidateTargets?.path || "No candidate target shortlist.",
      action: "Keep the scored shortlist updated if review targets change."
    }),
    gate({
      id: "pitch-deck",
      label: "Pitch deck artifact",
      required: false,
      passed: bool(state.pitchDeck?.ok),
      proof: state.pitchDeck?.url || "Pitch deck was not verified.",
      action: "Attach or regenerate the pitch deck if judges request slides."
    })
  ];

  const required = gates.filter((item) => item.required);
  const optional = gates.filter((item) => !item.required);
  const requiredPassed = required.filter((item) => item.status === "passed").length;
  const optionalPassed = optional.filter((item) => item.status === "passed").length;

  return {
    generatedAt: state.generatedAt || new Date().toISOString(),
    gitHead: state.gitHead || "",
    canSubmit: requiredPassed === required.length,
    requiredPassed,
    requiredTotal: required.length,
    optionalPassed,
    optionalTotal: optional.length,
    score: Math.round(((requiredPassed + optionalPassed * 0.5) / (required.length + optional.length * 0.5)) * 100),
    gates,
    nextActions: gates
      .filter((item) => item.status !== "passed")
      .sort((a, b) => Number(b.required) - Number(a.required))
      .map((item) => item.action)
  };
}

export function summarizeFinalReadiness(report = {}) {
  if (report.canSubmit) {
    return `Final-ready: ${report.requiredPassed}/${report.requiredTotal} required gates passed.`;
  }
  return `Not final-ready: ${report.requiredPassed || 0}/${report.requiredTotal || 0} required gates passed. Next action: ${
    report.nextActions?.[0] || "Review missing gates."
  }`;
}
