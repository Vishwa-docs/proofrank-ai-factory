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
  return String(project.id || "").startsWith("review-") && !hasBrightDataSponsorProofBundle(project);
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
  if (traceState === "direct") return "Bright Data: direct debug evidence only";
  if (traceState === "planned") return "Bright Data: planned, not executed";
  return `Bright Data: ${traceState || "not collected"}`;
}

function proofPlanLine(project = {}) {
  if (!isDraft(project)) return "";
  return "\nBright Data plan: scrape_as_markdown + search_engine + discover planned, not executed";
}

function decisionFor(project = {}) {
  if (hasBrightDataSponsorProofBundle(project)) return "Shortlist";
  if (isDraft(project)) return "Request live evidence";
  if ((project.verdict?.label || "").toLowerCase() === "high risk") return "Do not advance yet";
  return "Escalate for evidence";
}

function nextActionFor(project = {}) {
  if (hasBrightDataSponsorProofBundle(project)) return "Export memo or inspect Evidence before final submission";
  if (isDraft(project)) return "Run private Bright Data live review before treating links as evidence";
  return "Collect source, search, discovery, and demo evidence";
}

export function buildPublicReviewCard(project = {}, options = {}) {
  const title = clean(project.title || "Untitled project");
  const team = clean(project.team || "Unknown team");
  const summary = clean(project.summary || "No summary supplied.");
  const receiptId = project.runReceipt?.runId ? `\nEvidence report: ${clean(project.runReceipt.runId)}` : "";
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

Note: Draft cards only describe supplied links. Private live review is required before repo contents, demo behavior, functionality, or Bright Data evidence are treated as collected.`;
}
