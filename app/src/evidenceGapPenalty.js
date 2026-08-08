import { buildClaimLedger } from "./claims.js";
import { brightDataTraceState, hasBrightDataSponsorProofBundle, hasExecutedBrightDataTrace } from "./scoring.js";

function bool(value) {
  return value === true;
}

function status(label, penalty, reason, action) {
  return {
    label,
    penalty,
    status: penalty === 0 ? "clear" : penalty >= 14 ? "blocker" : "gap",
    reason,
    action
  };
}

function businessSignals(evidence = {}) {
  return [evidence.targetUser, evidence.clearPain, evidence.repeatableWorkflow, evidence.buyerExists, evidence.urgency].filter(Boolean).length;
}

export function buildEvidenceGapPenalty(project = {}) {
  const evidence = project.evidence || {};
  const claims = buildClaimLedger(project);
  const unsupportedClaims = claims.filter((claim) => ["Not Found", "Needs Evidence"].includes(claim.status));
  const weakClaims = claims.filter((claim) => claim.status === "Weak Evidence");
  const traceState = brightDataTraceState(project);
  const sponsorBundle = hasBrightDataSponsorProofBundle(project);
  const executedBright = hasExecutedBrightDataTrace(project);
  const businessCount = businessSignals(evidence);

  const dimensions = [
    unsupportedClaims.length === 0 && weakClaims.length <= 1
      ? status("Claim support", 0, "Core claims have support or only minor weak evidence.", "Keep claim wording matched to visible evidence.")
      : unsupportedClaims.length >= 2
        ? status("Claim support", 16, `${unsupportedClaims.length} claims still need evidence.`, "Open Claim Check and collect evidence for unsupported claims.")
        : status("Claim support", 8, `${unsupportedClaims.length} unsupported and ${weakClaims.length} weak claim${weakClaims.length === 1 ? "" : "s"}.`, "Tighten the claim or add source-backed evidence."),
    bool(evidence.hasPublicDemo) && bool(evidence.demoWorkflow)
      ? status("Demo liveness", 0, "Public demo and workflow evidence are visible.", "Keep the demo URL reachable for judges.")
      : project.demoUrl || evidence.hasDemo
        ? status("Demo liveness", 8, "Demo link exists, but workflow/reachability evidence is incomplete.", "Run live review or attach a workflow replay.")
        : status("Demo liveness", 14, "No public demo evidence is attached.", "Attach a reachable demo URL before advancing."),
    evidence.secretRiskVisible
      ? status("Repo evidence", 18, "Repository evidence includes possible secret-risk signals.", "Remove or explain risky public files before review.")
      : bool(evidence.repoTreeCollected) && bool(evidence.packageManifestPresent) && bool(evidence.licensePresent) && bool(evidence.builtDuringEvent)
        ? status("Repo evidence", 0, "Repo tree, manifest, license, and event-window commits are visible.", "Keep the public repo reachable.")
        : project.githubUrl || evidence.hasGithub
          ? status("Repo evidence", 8, "Repository link exists, but reproducibility evidence is incomplete.", "Collect tree, manifest, license, and event-window commits.")
          : status("Repo evidence", 14, "No repository evidence is attached.", "Attach a public GitHub repository."),
    sponsorBundle
      ? status("Bright Data depth", 0, "Source, search_engine, and discover traces are executed.", "Export the evidence receipt.")
      : executedBright
        ? status("Bright Data depth", 10, "Bright Data ran, but the complete source/search/discovery bundle is missing.", "Run the full Bright Data bundle.")
        : traceState === "planned" || traceState === "pending" || (evidence.brightDataTools || []).length
          ? status("Bright Data depth", 16, `Bright Data state is ${traceState}; the source/search/discovery run is not complete.`, "Run source fetch, search_engine, and discover.")
          : status("Bright Data depth", 20, "No Bright Data evidence path is visible.", "Make Bright Data the evidence acquisition layer."),
    businessCount >= 4
      ? status("Business value evidence", 0, "Target user, pain, repeatability, and buyer signal are visible.", "Keep the decision artifact tied to the buyer.")
      : businessCount >= 2
        ? status("Business value evidence", 8, "Some buyer signals are present, but the adoption story is thin.", "Clarify target user, repeatable workflow, and buyer value.")
        : status("Business value evidence", 14, "Business value evidence is not yet defensible.", "Name the buyer, pain, and repeated workflow.")
  ];

  const totalPenalty = dimensions.reduce((sum, item) => sum + item.penalty, 0);
  const blockers = dimensions.filter((item) => item.status === "blocker").length;
  const gaps = dimensions.filter((item) => item.status !== "clear").length;
  const baseScore = project.scores?.overall ?? 0;
  const adjustedScore = Math.max(0, Math.round(baseScore - totalPenalty));
  const topAction = dimensions.find((item) => item.status === "blocker") || dimensions.find((item) => item.status === "gap") || dimensions[0];

  return {
    baseScore,
    adjustedScore,
    totalPenalty,
    blockers,
    gaps,
    status:
      totalPenalty <= 10
        ? "Defensible shortlist"
        : totalPenalty <= 30
          ? "Evidence review needed"
          : "Evidence gap blocks advancement",
    summary:
      totalPenalty === 0
        ? "No rank penalty from current evidence gates."
        : `${totalPenalty} point rank penalty from ${gaps} evidence gap${gaps === 1 ? "" : "s"}.`,
    topAction: topAction?.action || "Keep evidence current.",
    dimensions
  };
}
