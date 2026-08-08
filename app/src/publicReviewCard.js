import { brightDataTraceState, hasBrightDataSponsorProofBundle } from "./scoring.js";

function clean(value = "") {
  return String(value).replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
}

function hasUrl(value = "") {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isDraft(project = {}) {
  return (
    String(project.id || "").startsWith("review-") &&
    !hasBrightDataSponsorProofBundle(project) &&
    brightDataTraceState(project) !== "direct"
  );
}

function githubLine(project = {}) {
  if (!hasUrl(project.githubUrl)) return "GitHub: not supplied";
  if (project.evidence?.hasGithub || project.evidence?.repoMetadataCollected) return `GitHub: evidence collected (${project.githubUrl})`;
  return `GitHub: URL accepted, content not fetched (${project.githubUrl})`;
}

function demoLine(project = {}) {
  if (!hasUrl(project.demoUrl)) return "Demo: not supplied";
  if (project.evidence?.hasPublicDemo || project.evidence?.demoWorkflow) return `Demo: evidence collected (${project.demoUrl})`;
  return `Demo: URL supplied, reachability not checked (${project.demoUrl})`;
}

function brightDataLine(project = {}) {
  if (hasBrightDataSponsorProofBundle(project)) return "Bright Data: executed source + search + discovery";

  const traceState = brightDataTraceState(project);
  if (traceState === "pending") return "Bright Data evidence pending";
  if (traceState === "direct") return "Bright Data: not used in public review; direct public evidence collected";
  if (traceState === "planned") return "Bright Data: planned, not executed";
  return `Bright Data: ${traceState || "not collected"}`;
}

function proofPlanLine(project = {}) {
  if (!isDraft(project)) return "";
  return "\nBright Data plan: source fetch, web search, and discovery are planned, not run yet";
}

function decisionFor(project = {}) {
  if (hasBrightDataSponsorProofBundle(project)) return "Shortlist";
  if (isDraft(project)) return "Request public review";
  if (brightDataTraceState(project) === "direct") return "Escalate for Bright Data review";
  if ((project.verdict?.label || "").toLowerCase() === "high risk") return "Do not advance yet";
  return "Escalate for evidence";
}

function nextActionFor(project = {}) {
  if (hasBrightDataSponsorProofBundle(project)) return "Export memo or inspect Evidence before you submit on lablab.ai";
  if (isDraft(project)) return "Run public review before treating links as evidence";
  if (brightDataTraceState(project) === "direct") return "Run a Bright Data evidence run before prize-track submission";
  return "Collect source, search, discovery, and demo evidence";
}

export function buildPublicReviewCard(project = {}, options = {}) {
  const title = clean(project.title || "Untitled project");
  const team = clean(project.team || "Unknown team");
  const summary = clean(project.summary || "No summary supplied.");
  const receiptId = project.runReceipt?.runId ? `\nReview ID: ${clean(project.runReceipt.runId)}` : "";
  const reviewUrl = hasUrl(options.reviewUrl) ? options.reviewUrl : hasUrl(options.roomUrl) ? options.roomUrl : "";
  const reviewLink = reviewUrl ? `\nReview link: ${reviewUrl}` : "";
  const draftNotice = isDraft(project)
    ? `Draft review only. URL format accepted, no repo/demo fetch, no functionality check, no Bright Data evidence yet.\n`
    : "";

  return `${isDraft(project) ? `ProofRank draft for ${title}` : "ProofRank public review card"}
Team: ${team}
${draftNotice}Decision: ${decisionFor(project)}
Summary: ${summary}
${githubLine(project)}
${demoLine(project)}
${brightDataLine(project)}${proofPlanLine(project)}${receiptId}
Next: ${nextActionFor(project)}${reviewLink}

Note: Draft cards only describe supplied links. Public review is required before repo contents or demo behavior are treated as collected. A Bright Data evidence run is required before Bright Data evidence is treated as collected.`;
}
