import { brightDataTraceState, hasBrightDataSponsorProofBundle } from "./scoring.js";

function hasPublicEvidence(project = {}) {
  const evidence = project.evidence || {};
  return evidence.hasGithub === true || evidence.hasPublicDemo === true || brightDataTraceState(project) === "direct";
}

function isReviewerProject(project = {}) {
  return String(project.id || "").startsWith("review-");
}

function isDraftReview(project = {}) {
  return isReviewerProject(project) && !hasPublicEvidence(project) && !hasBrightDataSponsorProofBundle(project);
}

function checkpoint(label, state, detail) {
  return { label, state, detail };
}

export function buildReviewCoach(project = {}, context = {}) {
  const sponsorBundle = hasBrightDataSponsorProofBundle(project);
  const publicEvidence = hasPublicEvidence(project);
  const draft = isDraftReview(project);

  if (!context.reviewStarted) {
    return {
      badge: "Start here",
      title: "Test any public project",
      body:
        "No login needed. Paste a public GitHub repo and optional demo, then ProofRank shows what is checked and what still needs sponsor evidence.",
      primary: { action: "focusRepo", label: "Paste links" },
      secondary: { action: "sample", label: "Replay sample" },
      checkpoints: [
        checkpoint("Visitor can test links", "ready", "Public checks run without private keys."),
        checkpoint("Guided path", "ready", "The tour highlights review, projects, evidence, and readiness."),
        checkpoint("Bright Data sponsor check", "pending", "Private source, search, and discovery evidence stays gated until reviewer access exists.")
      ]
    };
  }

  if (draft) {
    return {
      badge: "Draft only",
      title: "Run public review next",
      body:
        "The links are saved, but repo content, demo reachability, prior-art search, and Bright Data evidence are not collected yet.",
      primary: { action: "public", label: "Run public review" },
      secondary: { action: "copy", label: "Copy replay link" },
      checkpoints: [
        checkpoint("Links saved", "ready", "The room can reopen this repo and demo."),
        checkpoint("Public evidence", "pending", "Fetch repo and demo signals before ranking."),
        checkpoint("Bright Data evidence", "pending", "Add source, search, and discovery for sponsor review.")
      ]
    };
  }

  if (publicEvidence && !sponsorBundle) {
    return {
      badge: "Public evidence",
      title: "Add the sponsor layer",
      body:
        "Public evidence helps other visitors test the workflow. Bright Data source, search, and discovery make the prize case defensible.",
      primary: { action: "live", label: "Bright Data evidence run" },
      secondary: { action: "evidence", label: "Open Bright Data receipt" },
      checkpoints: [
        checkpoint("Public evidence", "ready", "Repo or demo signals are attached."),
        checkpoint("Bright Data evidence", "pending", "Run private collection for source, search, and discovery."),
        checkpoint("Reviewer memo", "pending", "Export after the sponsor layer is visible.")
      ]
    };
  }

  return {
    badge: "Bright Data ready",
    title: "Export the reviewer memo",
    body:
      "Source, search, and discovery evidence are visible. Use the memo and evidence JSON for the sponsor review path.",
    primary: { action: "export", label: "Export memo" },
    secondary: { action: "evidence", label: "Open Bright Data receipt" },
    checkpoints: [
      checkpoint("Source fetch", "ready", "Bright Data source evidence is attached."),
      checkpoint("Search and discovery", "ready", "Prior-art and adjacent project signals are attached."),
      checkpoint("Reviewer memo", "ready", "The selected project can be exported.")
    ]
  };
}
