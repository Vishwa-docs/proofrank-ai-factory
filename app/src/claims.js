import { brightDataTraceState, hasBrightDataSponsorProofBundle, hasExecutedBrightDataTrace } from "./scoring.js";

function statusFor(value, strongLabel = "Verified") {
  return value ? strongLabel : "Not Found";
}

function evidenceText(value, good, bad) {
  return value ? good : bad;
}

export function buildClaimLedger(project) {
  const evidence = project.evidence || {};
  const scores = project.scores || {};
  const brightTools = evidence.brightDataTools || [];
  const brightDependency = scores.brightDataFit ?? 0;
  const executedBrightTrace = hasExecutedBrightDataTrace(project);
  const sponsorProofBundle = hasBrightDataSponsorProofBundle(project);
  const traceState = brightDataTraceState(project);

  return [
    {
      claim: "Public demo is reachable and shows a workflow",
      status: evidence.hasPublicDemo && evidence.demoWorkflow ? "Verified" : evidence.hasDemo ? "Weak Evidence" : "Not Found",
      evidence: evidenceText(
        evidence.hasPublicDemo && evidence.demoWorkflow,
        "Public demo link and end-to-end workflow are visible from submitted evidence.",
        "Public demo or end-to-end workflow needs stronger evidence before final judging."
      )
    },
    {
      claim: "Project explains native.builder use",
      status: statusFor(evidence.nativeBuilderExplained),
      evidence: evidenceText(
        evidence.nativeBuilderExplained,
        "Submission evidence explains how native.builder shaped the app workflow or implementation.",
        "Add a direct description of native.builder usage in the submission."
      )
    },
    {
      claim: "Bright Data is load-bearing",
      status: brightDependency >= 80 && sponsorProofBundle ? "Verified" : brightDependency >= 50 ? "Weak Evidence" : "Not Found",
      evidence:
        brightTools.length > 0 && sponsorProofBundle
          ? `${brightTools.join(", ")} completed source, search, and discovery evidence with dependency score ${brightDependency}.`
          : brightTools.length > 0 && executedBrightTrace
            ? `${brightTools.join(", ")} executed partially with dependency score ${brightDependency}; sponsor bundle is incomplete.`
          : brightTools.length > 0
            ? `${brightTools.join(", ")} referenced with dependency score ${brightDependency}; trace state is ${traceState}.`
          : "No visible Bright Data tool usage in public evidence."
    },
    {
      claim: "Originality has public support",
      status: evidence.lowCrowdOverlap && evidence.differentiation ? "Verified" : evidence.differentiation ? "Weak Evidence" : "Needs Evidence",
      evidence: evidenceText(
        evidence.lowCrowdOverlap && evidence.differentiation,
        "The project has a specific wedge and lower overlap with the current field.",
        "Run broader prior-art discovery before making a strong originality claim."
      )
    },
    {
      claim: "Review packet is defensible",
      status: evidence.proofReceipt && sponsorProofBundle ? "Verified" : evidence.proofReceipt ? "Weak Evidence" : "Needs Evidence",
      evidence: evidenceText(
        evidence.proofReceipt && sponsorProofBundle,
        "Receipt includes source-backed evidence plus executed Bright Data source, search, and discovery traces.",
        "Add timestamped Bright Data source, search, and discovery traces with confidence labels."
      )
    },
    {
      claim: "Repository evidence is reproducible",
      status:
        evidence.secretRiskVisible
          ? "Needs Evidence"
          : evidence.repoTreeCollected && evidence.packageManifestPresent && evidence.licensePresent && evidence.builtDuringEvent
            ? "Verified"
            : evidence.repoTreeCollected && evidence.packageManifestPresent
              ? "Weak Evidence"
              : "Needs Evidence",
      evidence: evidence.secretRiskVisible
        ? "Public source evidence includes possible secret-bearing files or credential-looking values."
        : evidence.repoTreeCollected && evidence.packageManifestPresent && evidence.licensePresent && evidence.builtDuringEvent
          ? "Repository tree, package manifest, license, and hackathon-window commits are visible."
          : "Collect repository tree, package manifest, license, and event-window commits before treating the build as reproducible."
    }
  ];
}
