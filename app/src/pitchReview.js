const ROWS = [
  {
    id: "problem-clarity",
    label: "Problem clarity",
    pass: [/problem|pain|slow|manual|crowded|time pressure|verify|claims?|review/i]
  },
  {
    id: "target-user",
    label: "Target user",
    pass: [/judges?|sponsors?|reviewers?|accelerators?|grants?|procurement|teams?/i]
  },
  {
    id: "workflow-shown",
    label: "Workflow shown",
    pass: [/paste|upload|add|create|run|upgrade|export|shortlist|workflow/i, /github|repo|demo|link|url/i]
  },
  {
    id: "bright-data-evidence",
    label: "Bright Data evidence",
    pass: [/bright data/i, /source|search|discover|scrape|web|evidence|trace/i]
  },
  {
    id: "decision-artifact",
    label: "Decision artifact",
    pass: [/memo|report|record|shortlist|decision|score|export/i]
  },
  {
    id: "business-value",
    label: "Business value",
    pass: [/business|buyer|value|faster|defensible|operations|practical|risk|cost/i]
  },
  {
    id: "final-ask",
    label: "Final ask",
    pass: [/ask|submit|use|try|judge|winner|prize|next/i]
  }
];

function normalize(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function countWords(value = "") {
  const words = normalize(value).match(/\b[\w'-]+\b/g);
  return words ? words.length : 0;
}

function rowStatus(row, text) {
  const passed = row.pass.every((pattern) => pattern.test(text));
  return passed ? "pass" : "needs-evidence";
}

function rowGuidance(row) {
  const guidance = {
    "problem-clarity": "Name the review pain before showing the product.",
    "target-user": "Say who uses it: judges, sponsor teams, or reviewers.",
    "workflow-shown": "Show the repo/demo intake and the review output as one end-to-end path.",
    "bright-data-evidence": "Tie the pitch claim to Bright Data source, search, and discovery evidence.",
    "decision-artifact": "End with the artifact a reviewer receives: memo, evidence record, report, or shortlist.",
    "business-value": "Explain why this matters outside the hackathon.",
    "final-ask": "Close with the exact action judges should take."
  };
  return guidance[row.id] || "Add one concrete sentence for this claim.";
}

export function buildPitchReview(transcript = "", project = {}) {
  const text = normalize(transcript);
  const words = countWords(text);
  const rows = ROWS.map((row) => {
    const status = rowStatus(row, text);
    return {
      id: row.id,
      label: row.label,
      status,
      detail: status === "pass" ? "Claim is present in pasted text." : rowGuidance(row)
    };
  });
  const passed = rows.filter((row) => row.status === "pass").length;
  const timingScore = words >= 70 && words <= 170 ? 8 : words >= 45 && words <= 210 ? 4 : 0;
  const score = Math.min(100, Math.round((passed / rows.length) * 92 + timingScore));
  const missing = rows.filter((row) => row.status !== "pass").map((row) => `${row.label}: ${row.detail}`);
  const title = normalize(project.title || "this project");

  return {
    source: "pasted transcript",
    videoVerified: false,
    score,
    wordCount: words,
    timing: words >= 70 && words <= 170 ? "one-minute fit" : words < 70 ? "too short for a full demo story" : "likely over one minute",
    verdict: score >= 85 ? "Pitch ready" : score >= 65 ? "Needs sharper evidence" : "Needs rewrite",
    rows,
    missing,
    evidenceActions: [
      "Compare every pitch claim with Bright Data source/search/discovery evidence.",
      "Keep repo and demo reachability separate from pasted transcript analysis.",
      `Export the reviewer memo for ${title} after public or sponsor evidence is collected.`
    ],
    suggestedOneMinuteFlow: [
      "Name the overloaded reviewer and the verification problem.",
      "Paste the public GitHub and demo links.",
      "Run Bright Data source, search, and discovery evidence.",
      "Show the decision artifact and evidence gaps.",
      "Close with the sponsor-ready next action."
    ]
  };
}
