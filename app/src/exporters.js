import { brightDataTraceState, buildVerdict, calculateScores } from "./scoring.js";
import { buildClaimLedger } from "./claims.js";
import { buildTribunal } from "./tribunal.js";
import { buildOriginalityRadar } from "./originality.js";
import { buildReadiness, readinessSummary } from "./readiness.js";

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function visibleVerdictLabel(label = "") {
  return label || "Needs review";
}

export function toCsv(projects) {
  const headers = [
    "rank",
    "title",
    "team",
    "overall",
    "eligibility",
    "brightDataFit",
    "brightDataPrize",
    "businessValue",
    "originality",
    "presentation",
    "verdict",
    "action",
    "risks"
  ];

  const rows = projects.map((project, index) => {
    const scores = project.scores || calculateScores(project);
    const verdict = project.verdict || buildVerdict(project, scores);
    return [
      index + 1,
      project.title,
      project.team,
      scores.overall,
      scores.eligibility,
      scores.brightDataFit,
      scores.brightDataPrize,
      scores.businessValue,
      scores.originality,
      scores.presentation,
      visibleVerdictLabel(verdict.label),
      verdict.action,
      verdict.risks.join("; ")
    ].map(escapeCsv);
  });

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

export function buildReceipt(project, fieldProjects = []) {
  const scores = project.scores || calculateScores(project);
  const verdict = project.verdict || buildVerdict(project, scores);
  const tribunal = buildTribunal({ ...project, scores, verdict });
  const traceState = brightDataTraceState(project);
  const originalityRadar = buildOriginalityRadar(project, fieldProjects.length ? fieldProjects : [project]);
  const packageReadiness = buildReadiness(project, { projects: fieldProjects.length ? fieldProjects : [project] });
  const lablabSubmissionComplete = project.evidence?.lablabSubmissionComplete === true || project.evidence?.lablabSubmitted === true;
  const readiness = {
    ...packageReadiness,
    proofPackageReady: packageReadiness.proofPackageReady ?? packageReadiness.canSubmit,
    lablabSubmissionComplete,
    finalSubmissionTrackedSeparately: !lablabSubmissionComplete,
    canSubmit: Boolean((packageReadiness.proofPackageReady ?? packageReadiness.canSubmit) && lablabSubmissionComplete),
    nextActions: lablabSubmissionComplete
      ? packageReadiness.nextActions
      : [...new Set([...packageReadiness.nextActions, "Submit from the authenticated team-owner lablab.ai account."])]
  };

  return {
    id: project.id,
    title: project.title,
    team: project.team,
    collectedAt: new Date().toISOString(),
    scores,
    verdict,
    urls: {
      submission: project.submissionUrl,
      demo: project.demoUrl,
      nativeBuilder: project.nativeBuilderUrl,
      github: project.githubUrl,
      presentation: project.presentationUrl
    },
    reviewFocus: project.reviewFocus || null,
    technologies: project.technologies,
    traceState,
    readiness,
    displayVerdict: visibleVerdictLabel(verdict.label),
    claimLedger: buildClaimLedger(project),
    tribunal,
    originalityRadar,
    runReceipt: project.runReceipt || null,
    evidenceItems: project.evidenceItems || [],
    brightDataTraces: project.brightDataTraces || []
  };
}

export function buildSubmissionPacket(project, fieldProjects = []) {
  const receipt = buildReceipt(project, fieldProjects);
  const primarySubmissionStatus = receipt.readiness.nativeBuilderReady ? "NATIVE.BUILDER PRIMARY" : "FALLBACK ONLY";
  return `# ${project.title}

## Problem

Hackathon judges and sponsor teams review large numbers of public submissions under time pressure. They need to know which projects are accessible, functional, original, and genuinely using sponsor technology.

## Target User

Hackathon judges, sponsor partner teams, accelerator reviewers, grant reviewers, and community organizers.

## Solution

ProofRank audits public AI product pages, demos, repositories, presentations, and technology claims. It ranks projects and emits reviewer memos with source-backed findings, review risks, claim verdicts, and recommended diligence actions.

## Bright Data Usage

Bright Data is the evidence acquisition layer. The fallback app implements server-side collection through Bright Data's Request API plus Remote MCP source collection, search, and discovery, with Web Scraper API, Web Unlocker, and CLI workflows prepared for native.builder live mode. Sponsor-fit credit requires an executed Bright Data source, search, and discovery run in the saved review.

## Native.builder Usage

The competition app should be created and published through native.builder using the prepared prompt. Native.builder generates the UI routes, stateful audit workflow, export surfaces, and public deployment.

## Current Product Review

- Primary submission status: ${primarySubmissionStatus}
- Overall score: ${receipt.scores.overall}
- Bright Data fit: ${receipt.scores.brightDataFit}
- Bright Data prize score: ${receipt.scores.brightDataPrize}
- Bright Data evidence state: ${receipt.traceState}
- Review lens: ${receipt.reviewFocus?.label || "General review"}
- Review lens priority: ${receipt.reviewFocus?.detail || "Not specified"}
- Review ID: ${receipt.runReceipt?.runId || "Not issued"}
- Replay command: ${receipt.runReceipt?.replayCommand || "Run live collection first"}
- Evidence package readiness: ${readinessSummary(receipt.readiness)}
- Verdict: ${receipt.displayVerdict}
- Action: ${receipt.verdict.action}
- Risks: ${receipt.verdict.risks.length ? receipt.verdict.risks.join("; ") : "No major risks"}

## Readiness Checklist

${receipt.readiness.gates
  .map(
    (gate) =>
      `- ${gate.status === "passed" ? "PASS" : gate.required ? "ACTION" : "IMPROVE"}: ${gate.label} - ${gate.detail} Evidence: ${gate.proof}`
  )
  .join("\n")}

## Review Panel

- Final recommendation: ${receipt.tribunal.finalRecommendation.label}
- Panel confidence: ${receipt.tribunal.finalRecommendation.confidence}
- Sponsor judge: ${receipt.tribunal.panel.find((judge) => judge.role === "Bright Data sponsor judge")?.stance || "Not available"}
- Skeptical judge: ${receipt.tribunal.panel.find((judge) => judge.role === "Skeptical hackathon judge")?.stance || "Not available"}
- Business buyer: ${receipt.tribunal.panel.find((judge) => judge.role === "Business buyer")?.stance || "Not available"}
- Open disputes: ${
    receipt.tribunal.disputes.filter((dispute) => dispute.status === "open").length
      ? receipt.tribunal.disputes
          .filter((dispute) => dispute.status === "open")
          .map((dispute) => `${dispute.topic}: ${dispute.detail}`)
          .join("; ")
      : "None"
  }

## Similarity Check

- Originality risk: ${receipt.originalityRadar.riskLabel}
- Originality score: ${receipt.originalityRadar.score}
- Closest overlap: ${
    receipt.originalityRadar.similarProjects[0]
      ? `${receipt.originalityRadar.similarProjects[0].title} (${receipt.originalityRadar.similarProjects[0].overlap})`
      : "No comparison field attached"
  }
- Bright Data prior-art query: ${receipt.originalityRadar.brightDataQueries[0]?.query || "Not available"}

## Demo Workflow

Paste a public GitHub repo and demo app URL, add the project, inspect Review and Projects, open Checked Statements, review the evidence checks, and export the sponsor-ready reviewer memo.

## External Tools

native.builder, Bright Data Remote MCP, Bright Data SERP API, Bright Data Web Scraper API, Bright Data CLI, optional GitHub hosting, optional static deployment.
`;
}

function countBy(projects, predicate) {
  return projects.filter(predicate).length;
}

function projectReadinessLabel(project, projects) {
  const readiness = buildReadiness(project, { projects });
  if (readiness.proofPackageReady || readiness.canSubmit) return "review package ready";
  return readiness.nextActions[0] || "more evidence needed";
}

export function buildProgramReport(projects = [], options = {}) {
  const rankedProjects = projects.length
    ? projects.map((project) => ({ ...project, scores: project.scores || calculateScores(project) }))
    : [];
  const selected = options.selectedProject || rankedProjects[0] || null;
  const roomFocus = selected?.reviewFocus || options.reviewFocus || null;
  const executedBright = countBy(rankedProjects, hasBrightDataSponsorProject);
  const draftReviews = countBy(rankedProjects, (project) => String(project.id || "").startsWith("review-"));
  const withDemoLinks = countBy(rankedProjects, (project) => project.evidence?.hasPublicDemo || project.demoUrl);
  const verifiedDemo = countBy(rankedProjects, (project) => project.evidence?.hasPublicDemo === true);
  const withGithubLinks = countBy(rankedProjects, (project) => project.evidence?.hasGithub || project.githubUrl);
  const ready = countBy(rankedProjects, (project) => {
    const readiness = buildReadiness(project, { projects: rankedProjects });
    return readiness.proofPackageReady || readiness.canSubmit || project.verdict?.label === "Strong candidate";
  });

  const topRows = rankedProjects
    .slice(0, 8)
    .map((project, index) => {
      const scores = project.scores || calculateScores(project);
      const verdict = project.verdict || buildVerdict(project, scores);
      return `${index + 1}. ${project.title} - ${visibleVerdictLabel(verdict.label)}; Bright Data ${brightDataTraceState(project)}; overall ${scores.overall}; next: ${projectReadinessLabel(project, rankedProjects)}`;
    })
    .join("\n");

  return `# ProofRank Review Room Report

Generated: ${new Date().toISOString()}

## Room Summary

- Projects reviewed: ${rankedProjects.length}
- Visitor-added draft reviews: ${draftReviews}
- Projects with demo links supplied: ${withDemoLinks}
- Projects with fetched public demos: ${verifiedDemo}
- Projects with public GitHub links: ${withGithubLinks}
- Projects with executed Bright Data evidence: ${executedBright}
- Projects with review-ready packages: ${ready}
- Active review lens: ${roomFocus?.label || "Mixed reviewer lenses"}

## Selected Project

- Project: ${selected?.title || "None selected"}
- Team: ${selected?.team || "Not available"}
- Recommendation: ${selected ? visibleVerdictLabel(buildVerdict(selected, selected.scores || calculateScores(selected)).label) : "Not available"}
- Review lens: ${selected?.reviewFocus?.label || roomFocus?.label || "General review"}
- Bright Data state: ${selected ? brightDataTraceState(selected) : "not available"}
- Public demo: ${selected?.demoUrl || "not attached"}
- GitHub: ${selected?.githubUrl || "not attached"}

## Ranked Review Queue

${topRows || "No projects available yet."}

## Sponsor Review Notes

ProofRank is designed for program-level review, not a one-off demo. Visitors can paste a public GitHub repository and optional demo URL, generate a browser-safe draft review, run a public repo/demo check, copy a replay link, and export the selected project memo. Private Bright Data review upgrades the same flow through the server-side backend when reviewer access is present.

Bright Data remains the evidence layer. The room-level view shows which projects have executed source, search, and discovery evidence, and which projects only have sample or pending evidence. This lets sponsor judges separate actual live-web diligence from claims.
`;
}

function hasBrightDataSponsorProject(project) {
  const traceState = brightDataTraceState(project);
  return traceState === "executed" && Array.isArray(project.brightDataTraces) && project.brightDataTraces.length >= 3;
}

export function downloadText(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename, data) {
  downloadText(filename, JSON.stringify(data, null, 2), "application/json");
}
