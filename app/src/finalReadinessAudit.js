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
  if (nativeBuilder.ok && nativeBuilder.renderCheck?.ok) {
    const bundle = nativeBuilder.renderCheck.publishedBundle ? ` / bundle ${nativeBuilder.renderCheck.publishedBundle}` : "";
    return `${nativeBuilder.url} / browser render verified in ${nativeBuilder.renderCheck.path}${bundle}.`;
  }
  if (nativeBuilder.renderCheck?.path) {
    const missing = nativeBuilder.renderCheck.missingCopy?.length
      ? `missing in browser render: ${nativeBuilder.renderCheck.missingCopy.join(", ")}`
      : "";
    const forbidden = nativeBuilder.renderCheck.forbiddenCopy?.length
      ? `forbidden copy visible: ${nativeBuilder.renderCheck.forbiddenCopy.join(", ")}`
      : "";
    const bundle = nativeBuilder.renderCheck.sameBundle === false ? "published bundle changed or not yet rechecked" : "";
    return [
      nativeBuilder.url || "No nativelyai.app URL configured.",
      `render check needs attention in ${nativeBuilder.renderCheck.path}`,
      missing,
      forbidden,
      bundle
    ]
      .filter(Boolean)
      .join(" / ");
  }
  if (nativeBuilder.ok && nativeBuilder.verifiedUrl) return `${nativeBuilder.url} / corrected public copy verified.`;
  if (nativeBuilder.missingCopy?.length || nativeBuilder.staleCopyFound?.length) {
    const missing = nativeBuilder.missingCopy?.length ? `missing: ${nativeBuilder.missingCopy.join(", ")}` : "";
    const stale = nativeBuilder.staleCopyFound?.length ? `stale: ${nativeBuilder.staleCopyFound.join(", ")}` : "";
    return [nativeBuilder.url || "No nativelyai.app URL configured.", missing, stale].filter(Boolean).join(" / ");
  }
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
  if (!liveReceipt.ok) return "No signed executed Bright Data project evidence record attached.";
  return [
    liveReceipt.runId || "run record",
    liveReceipt.provider || "unknown-provider",
    liveReceipt.traceStatus || "unknown-trace",
    liveReceipt.hasSourceTrace ? "source trace" : "missing source trace",
    liveReceipt.hasSearchEngine ? "search_engine" : "missing search_engine",
    liveReceipt.hasDiscover ? "discover" : "missing discover",
    liveReceipt.signatureVerified ? "signature verified" : liveReceipt.signed ? "signature unverified" : "unsigned"
  ].join(" / ");
}

function liveApiSecurityProof(liveApiSecurity = {}) {
  if (liveApiSecurity.ok) {
    return `unauthenticated POST HTTP ${liveApiSecurity.unauthenticatedStatus}; disallowed host HTTP ${liveApiSecurity.disallowedHostStatus}.`;
  }
  const unauthenticated = liveApiSecurity.unauthenticatedStatus
    ? `unauthenticated POST HTTP ${liveApiSecurity.unauthenticatedStatus}`
    : "unauthenticated POST not verified";
  const disallowedHost = liveApiSecurity.disallowedHostStatus
    ? `disallowed host HTTP ${liveApiSecurity.disallowedHostStatus}`
    : "disallowed host not verified";
  return `${unauthenticated}; ${disallowedHost}.`;
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
      action: "Deploy the public fallback app and confirm the Bright Data evidence strip is visible."
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
      proof: state.workflowProof?.path || "Workflow replay JSON was not generated.",
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
      action: "Republish and verify the Native.builder app with the current prompt, then use its public nativelyai.app URL."
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
      action: "Deploy the live review API and confirm /api/health returns ok."
    }),
    gate({
      id: "live-api-security",
      label: "Public live API security controls",
      passed: bool(state.liveApiSecurity?.ok),
      proof: liveApiSecurityProof(state.liveApiSecurity),
      action: "Set PROOFRANK_REVIEW_TOKEN and PROOFRANK_ALLOWED_HOSTS, then confirm unauthenticated POST returns 401 and a disallowed host returns 422."
    }),
    gate({
      id: "live-receipt",
      label: "Signed executed Bright Data evidence record",
      passed:
        bool(state.liveReceipt?.ok) &&
        state.liveReceipt?.provider === "bright-data" &&
        state.liveReceipt?.traceStatus === "executed" &&
        bool(state.liveReceipt?.hasSourceTrace) &&
        bool(state.liveReceipt?.hasSearchEngine) &&
        bool(state.liveReceipt?.hasDiscover) &&
        bool(state.liveReceipt?.signed) &&
        bool(state.liveReceipt?.signatureVerified),
      proof: liveReceiptProof(state.liveReceipt),
      action: "Run the actual project through MCP mode and export a signature-verified evidence record with executed Bright Data source, search, and discover traces."
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
    return `Final-ready: ${report.requiredPassed}/${report.requiredTotal} required gates checked.`;
  }
  return `Not final-ready: ${report.requiredPassed || 0}/${report.requiredTotal || 0} required gates checked. Next action: ${
    report.nextActions?.[0] || "Review missing gates."
  }`;
}
