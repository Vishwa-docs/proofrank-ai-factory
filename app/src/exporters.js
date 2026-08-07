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
      verdict.label,
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
  const readiness = buildReadiness(project, { projects: fieldProjects.length ? fieldProjects : [project] });

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
      github: project.githubUrl,
      presentation: project.presentationUrl
    },
    technologies: project.technologies,
    traceState,
    readiness,
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

ProofRank audits public AI product pages, demos, repositories, presentations, and technology claims. It ranks projects and emits proof receipts with source-backed evidence, review risks, claim verdicts, and recommended diligence actions.

## Bright Data Usage

Bright Data is the evidence acquisition layer. The fallback app implements server-side collection through Bright Data's Request API plus Remote MCP scrape_as_markdown, search_engine, and discover, with Web Scraper API, Web Unlocker, and CLI workflows prepared for native.builder live mode. Sponsor-fit credit requires an executed Bright Data source, search, and discovery bundle in the receipt.

## Native.builder Usage

The competition app should be created and published through native.builder using the prepared prompt. Native.builder generates the UI routes, stateful audit workflow, export surfaces, and public deployment.

## Current Self-Audit

- Primary submission status: ${primarySubmissionStatus}
- Overall score: ${receipt.scores.overall}
- Bright Data fit: ${receipt.scores.brightDataFit}
- Bright Data prize score: ${receipt.scores.brightDataPrize}
- Bright Data trace state: ${receipt.traceState}
- Run receipt: ${receipt.runReceipt?.runId || "Not issued"}
- Replay command: ${receipt.runReceipt?.replayCommand || "Run live collection first"}
- Submission readiness: ${readinessSummary(receipt.readiness)}
- Verdict: ${receipt.verdict.label}
- Action: ${receipt.verdict.action}
- Risks: ${receipt.verdict.risks.length ? receipt.verdict.risks.join("; ") : "No major risks"}

## Submission Gates

${receipt.readiness.gates
  .map(
    (gate) =>
      `- ${gate.status === "passed" ? "PASS" : gate.required ? "ACTION" : "IMPROVE"}: ${gate.label} - ${gate.detail} Proof: ${gate.proof}`
  )
  .join("\n")}

## Adversarial Tribunal

- Final recommendation: ${receipt.tribunal.finalRecommendation.label}
- Tribunal confidence: ${receipt.tribunal.finalRecommendation.confidence}
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

## Originality Radar

- Originality risk: ${receipt.originalityRadar.riskLabel}
- Originality score: ${receipt.originalityRadar.score}
- Closest overlap: ${
    receipt.originalityRadar.similarProjects[0]
      ? `${receipt.originalityRadar.similarProjects[0].title} (${receipt.originalityRadar.similarProjects[0].overlap})`
      : "No comparison field attached"
  }
- Bright Data prior-art query: ${receipt.originalityRadar.brightDataQueries[0]?.query || "Not available"}

## Demo Workflow

Paste the AI Factory event URL, run the audit, inspect the ranked queue, open the claim ledger, review proof receipts, and export the sponsor-ready diligence packet.

## External Tools

native.builder, Bright Data Remote MCP, Bright Data SERP API, Bright Data Web Scraper API, Bright Data CLI, optional GitHub hosting, optional static deployment.
`;
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
