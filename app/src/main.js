import { EVENT_URL, fixtureProjects } from "./fixtures.js";
import { extractProjectsFromHtml } from "./parser.js";
import { rankProjects } from "./scoring.js";
import { buildClaimLedger } from "./claims.js";
import { buildCliCommands, buildMcpQueries, setupChecklist } from "./brightDataAdapter.js";
import { buildReceipt, buildSubmissionPacket, downloadJson, downloadText, toCsv } from "./exporters.js";

const elements = {
  modeSelect: document.querySelector("#modeSelect"),
  eventUrl: document.querySelector("#eventUrl"),
  apiKey: document.querySelector("#apiKey"),
  htmlUpload: document.querySelector("#htmlUpload"),
  runAudit: document.querySelector("#runAudit"),
  statusLine: document.querySelector("#statusLine"),
  rankedList: document.querySelector("#rankedList"),
  queueCount: document.querySelector("#queueCount"),
  scorecard: document.querySelector("#scorecard"),
  receipt: document.querySelector("#receipt"),
  fieldMap: document.querySelector("#fieldMap"),
  fieldSummary: document.querySelector("#fieldSummary"),
  readinessList: document.querySelector("#readinessList"),
  reviewerRepoUrl: document.querySelector("#reviewerRepoUrl"),
  reviewerDemoUrl: document.querySelector("#reviewerDemoUrl"),
  reviewerTitle: document.querySelector("#reviewerTitle"),
  reviewerTeam: document.querySelector("#reviewerTeam"),
  reviewerHint: document.querySelector("#reviewerHint"),
  addReviewerProject: document.querySelector("#addReviewerProject"),
  exportCsv: document.querySelector("#exportCsv"),
  exportReceipts: document.querySelector("#exportReceipts"),
  exportSelected: document.querySelector("#exportSelected"),
  exportPacket: document.querySelector("#exportPacket")
};

const state = {
  mode: "demo",
  filter: "all",
  selectedId: "proofrank",
  projects: rankProjects(fixtureProjects),
  uploadedProjects: [],
  reviewerProjects: []
};

function displayText(value = "") {
  return String(value)
    .replace(/[—–]/g, "-")
    .replace(/→/g, "to")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value = "") {
  return displayText(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };
    return entities[char];
  });
}

function escapeAttr(value = "") {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function isHttpUrl(value = "") {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function labelFromSlug(value = "") {
  const acronyms = new Map([
    ["ai", "AI"],
    ["api", "API"],
    ["mcp", "MCP"],
    ["proofrank", "ProofRank"],
    ["ui", "UI"],
    ["ux", "UX"],
    ["github", "GitHub"]
  ]);

  return displayText(value)
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => acronyms.get(word.toLowerCase()) || word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function sourceProjects() {
  const base = state.uploadedProjects.length ? state.uploadedProjects : fixtureProjects;
  return [...state.reviewerProjects, ...base];
}

function selectedProject() {
  return state.projects.find((project) => project.id === state.selectedId) || state.projects[0];
}

function filteredProjects() {
  return state.projects.filter((project) => {
    const evidence = project.evidence || {};
    if (state.filter === "high-risk") return project.verdict.label === "High risk" || project.verdict.risks.length >= 2;
    if (state.filter === "bright-strong") return project.scores.brightDataFit >= 75;
    if (state.filter === "missing-demo") return !evidence.hasPublicDemo;
    if (state.filter === "missing-github") return !evidence.hasGithub;
    if (state.filter === "finalist-ready") return project.verdict.label === "Finalist-ready";
    return true;
  });
}

function setStatus(message, tone = "ready") {
  elements.statusLine.textContent = displayText(message);
  elements.statusLine.className = `status-line ${tone === "warn" ? "warn" : ""} ${tone === "error" ? "error" : ""}`.trim();
}

function statusClass(project) {
  if (project.verdict.label === "Finalist-ready") return "good";
  if (project.verdict.label === "High risk") return "risk";
  return "review";
}

function renderRankedList() {
  const projects = filteredProjects();
  elements.queueCount.textContent = String(projects.length);

  if (!projects.length) {
    elements.rankedList.innerHTML = `<div class="empty-state">No submissions match this filter.</div>`;
    return;
  }

  elements.rankedList.innerHTML = projects
    .map((project, index) => {
      const selected = project.id === state.selectedId ? " is-selected" : "";
      const tools = (project.evidence?.brightDataTools || []).slice(0, 2).map(escapeHtml).join(", ") || "No Bright Data proof";
      return `
        <button class="project-row queue-row${selected}" type="button" data-id="${escapeAttr(project.id)}" role="listitem">
          <span class="rank-number">${index + 1}</span>
          <span class="queue-main">
            <strong>${escapeHtml(project.title)}</strong>
            <span>${escapeHtml(project.team)} / ${escapeHtml(project.domain || "General")}</span>
          </span>
          <span class="queue-proof">${escapeHtml(tools)}</span>
          <span class="row-score ${statusClass(project)}">${project.scores.overall}</span>
        </button>
      `;
    })
    .join("");

  elements.rankedList.querySelectorAll(".project-row").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedId = row.dataset.id;
      render();
    });
  });
}

function scoreTile(label, value, detail = "") {
  return `
    <div class="score-tile">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
      <p>${escapeHtml(detail)}</p>
      <div class="meter" style="--bar-width: ${value}%"><i></i></div>
    </div>
  `;
}

function renderClaimLedger(project) {
  const claims = buildClaimLedger(project);
  return `
    <section class="claim-ledger">
      <div class="module-head compact">
        <h2>Claim ledger</h2>
        <span class="hint">Source-backed, not absolute</span>
      </div>
      <div class="claim-grid">
        ${claims
          .map(
            (claim) => `
              <article class="claim-row">
                <span class="claim-status ${claim.status.toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(claim.status)}</span>
                <div>
                  <h3>${escapeHtml(claim.claim)}</h3>
                  <p>${escapeHtml(claim.evidence)}</p>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSourceLinks(project) {
  const links = [
    ["Submission", project.submissionUrl],
    ["Demo", project.demoUrl],
    ["GitHub", project.githubUrl],
    ["Deck", project.presentationUrl]
  ].filter(([, url]) => url && isHttpUrl(url));

  if (!links.length) return `<p class="hint">No public source links attached yet.</p>`;

  return links
    .map(([label, url]) => `<a class="source-link" href="${escapeAttr(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`)
    .join("");
}

function renderScorecard(project) {
  const tags = project.technologies.map((technology) => `<span class="tag">${escapeHtml(technology)}</span>`).join("");
  const risks = project.verdict.risks.length
    ? project.verdict.risks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("")
    : `<li>No major audit risk visible in current evidence.</li>`;

  elements.scorecard.innerHTML = `
    <section class="focus-strip">
      <div class="focus-copy">
        <span class="verdict-pill ${statusClass(project)}">${escapeHtml(project.verdict.label)}</span>
        <h2>${escapeHtml(project.title)}</h2>
        <p>${escapeHtml(project.summary)}</p>
        <div class="tag-row">${tags}</div>
      </div>
      <div class="score-block" aria-label="Overall score ${project.scores.overall}">
        <span>Overall</span>
        <strong>${project.scores.overall}</strong>
      </div>
    </section>

    <section class="source-links" aria-label="Attached sources">
      ${renderSourceLinks(project)}
    </section>

    <section class="score-grid" aria-label="Score breakdown">
      ${scoreTile("Eligibility", project.scores.eligibility, "Demo, repo, build proof")}
      ${scoreTile("Bright fit", project.scores.brightDataFit, "Live web is load-bearing")}
      ${scoreTile("Business", project.scores.businessValue, "Clear user and urgency")}
      ${scoreTile("Originality", project.scores.originality, "Distinct wedge and proof")}
      ${scoreTile("Presentation", project.scores.presentation, "Judge-ready explanation")}
    </section>

    <section class="review-notes">
      <div>
        <h3>Recommended action</h3>
        <p>${escapeHtml(project.verdict.action)}</p>
      </div>
      <div>
        <h3>Evidence depth</h3>
        <p>${(project.evidenceItems || []).length} receipt items, ${(project.brightDataTraces || []).length} collection traces.</p>
      </div>
      <div>
        <h3>Current blocker</h3>
        <ul>${risks}</ul>
      </div>
    </section>

    ${renderClaimLedger(project)}
  `;
}

function renderReceipt(project) {
  const receiptItems = (project.evidenceItems || [])
    .map(
      (item) => `
      <article class="receipt-item">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.excerpt)}</p>
        <div class="source-meta">
          <span>${escapeHtml(item.sourceType)}</span>
          <span>${Math.round(item.confidence * 100)}% confidence</span>
          <span>${escapeHtml(item.collector)}</span>
        </div>
      </article>
    `
    )
    .join("");

  const traces = (project.brightDataTraces || [])
    .map(
      (trace) => `
      <tr>
        <td>${escapeHtml(trace.tool)}</td>
        <td>${escapeHtml(trace.queryOrUrl)}</td>
        <td>${trace.resultCount}</td>
        <td>${escapeHtml(trace.status)}</td>
      </tr>
    `
    )
    .join("");

  const livePlan = buildMcpQueries(elements.eventUrl.value || EVENT_URL, project)
    .map((query) => `<li><strong>${escapeHtml(query.tool)}</strong><span>${escapeHtml(query.purpose)}</span></li>`)
    .join("");

  elements.receipt.innerHTML = `
    <div class="receipt-list">
      ${receiptItems || `<div class="empty-state">No evidence items available.</div>`}
    </div>

    <table class="trace-table" aria-label="Bright Data traces">
      <thead>
        <tr>
          <th>Tool</th>
          <th>Query or URL</th>
          <th>Rows</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${traces || `<tr><td colspan="4">No Bright Data trace visible yet.</td></tr>`}
      </tbody>
    </table>

    <div class="receipt-item live-plan">
      <h3>Live collection plan</h3>
      <p>${state.mode === "live" ? "Ready for a server-side Bright Data workflow." : "Demo mode mirrors these collection steps."}</p>
      <ul>${livePlan}</ul>
    </div>
  `;
}

function renderFieldMap() {
  const groups = new Map();
  for (const project of state.projects) {
    const group = groups.get(project.domain) || [];
    group.push(project);
    groups.set(project.domain, group);
  }

  elements.fieldSummary.textContent = `${groups.size} clusters`;
  elements.fieldMap.innerHTML = `
    <div class="map-grid">
      ${[...groups.entries()]
        .map(([domain, projects]) => {
          const averageBright = Math.round(projects.reduce((sum, project) => sum + project.scores.brightDataFit, 0) / projects.length);
          return `
            <article class="map-cell">
              <h3>${escapeHtml(domain)}</h3>
              <p>${projects.length} project${projects.length === 1 ? "" : "s"} / avg Bright fit ${averageBright}</p>
              <div class="meter" style="--bar-width: ${averageBright}%"><i></i></div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderReadiness(project = selectedProject()) {
  const checklist = [
    {
      label: "Bright Data token",
      ready: state.mode === "live" && Boolean(elements.apiKey.value.trim()),
      detail: "Needed server-side for Remote MCP, SERP, scraping, and discovery."
    },
    {
      label: "Public app URL",
      ready: Boolean(project?.demoUrl && isHttpUrl(project.demoUrl)),
      detail: "Judges need a reachable end-to-end workflow."
    },
    {
      label: "GitHub source",
      ready: Boolean(project?.githubUrl && isHttpUrl(project.githubUrl)),
      detail: "Reviewer mode can inspect public repositories directly."
    },
    {
      label: "Native.builder URL",
      ready: Boolean(project?.evidence?.nativeBuilderExplained && project?.demoUrl?.includes("nativelyai.app")),
      detail: "Eligibility depends on showing meaningful native.builder use."
    },
    {
      label: "Demo video",
      ready: Boolean(project?.evidence?.hasDemo),
      detail: "Submission requires one complete workflow in under three minutes."
    }
  ];

  elements.readinessList.innerHTML = checklist
    .map(
      (item) => `
        <li class="${item.ready ? "ready" : "needed"}">
          <span>${item.ready ? "Ready" : "Needed"}</span>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.detail)}</p>
        </li>
      `
    )
    .join("");
}

function render() {
  const project = selectedProject();
  renderRankedList();
  renderScorecard(project);
  renderReceipt(project);
  renderFieldMap();
  renderReadiness(project);
}

function runAudit() {
  const eventUrl = elements.eventUrl.value || EVENT_URL;
  const apiKey = elements.apiKey.value.trim();

  setStatus("Review running across submission evidence.", "ready");
  elements.runAudit.disabled = true;

  window.setTimeout(() => {
    if (state.mode === "live" && !apiKey) {
      const checklist = setupChecklist().join(" ");
      setStatus(`Live token missing. Demo mode remains ready. ${checklist}`, "warn");
      elements.runAudit.disabled = false;
      state.projects = rankProjects(sourceProjects());
      render();
      return;
    }

    state.projects = rankProjects(sourceProjects());
    if (!state.projects.some((project) => project.id === state.selectedId)) {
      state.selectedId = state.projects[0]?.id || "proofrank";
    }

    const commandCount = buildCliCommands(eventUrl, selectedProject()).length;
    const liveNote = state.mode === "live" ? "server workflow required next" : "commands prepared";
    setStatus(`${state.projects.length} submissions ranked. ${commandCount} Bright Data ${liveNote}.`, "ready");
    elements.runAudit.disabled = false;
    render();
  }, 520);
}

function handleUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const parsed = extractProjectsFromHtml(String(reader.result || ""));
    if (!parsed.length) {
      setStatus("No submission cards found in uploaded HTML.", "error");
      return;
    }
    state.uploadedProjects = [fixtureProjects[0], ...parsed];
    state.projects = rankProjects(sourceProjects());
    state.selectedId = state.projects[0].id;
    setStatus(`${parsed.length} uploaded submission cards parsed.`, "ready");
    render();
  });
  reader.readAsText(file);
}

function reviewerProjectFromInputs() {
  const repoUrl = elements.reviewerRepoUrl.value.trim();
  const demoUrl = elements.reviewerDemoUrl.value.trim();

  if (!isHttpUrl(repoUrl) || !repoUrl.includes("github.com/")) {
    setStatus("Add a public GitHub repository URL before adding a project.", "error");
    return null;
  }

  const repoParts = new URL(repoUrl).pathname.split("/").filter(Boolean);
  const owner = repoParts[0] || "GitHub owner";
  const repo = repoParts[1] || "project";
  const title = elements.reviewerTitle.value.trim() || labelFromSlug(repo);
  const team = elements.reviewerTeam.value.trim() || labelFromSlug(owner);
  const hasDemo = isHttpUrl(demoUrl);
  const id = `review-${owner}-${repo}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    id,
    title,
    team,
    summary:
      "Reviewer-supplied hackathon project. ProofRank can inspect the repository, deployed app, submission copy, and public web evidence once live Bright Data collection is connected.",
    eventUrl: elements.eventUrl.value || EVENT_URL,
    submissionUrl: "",
    demoUrl: hasDemo ? demoUrl : "",
    githubUrl: repoUrl,
    presentationUrl: "",
    createdAt: new Date().toISOString().slice(0, 10),
    domain: "Reviewer input",
    technologies: ["GitHub", "Bright Data collection pending"],
    trackTags: ["Reviewer supplied"],
    evidence: {
      hasDemo,
      hasPublicDemo: hasDemo,
      hasGithub: true,
      hasPresentation: false,
      nativeBuilderExplained: false,
      builtDuringEvent: false,
      isFunctional: hasDemo,
      notLandingPage: false,
      demoWorkflow: false,
      conciseSummary: true,
      targetUser: false,
      clearPain: false,
      repeatableWorkflow: false,
      buyerExists: false,
      urgency: false,
      differentiation: false,
      lowCrowdOverlap: false,
      proofReceipt: true,
      specificWedge: false,
      nonGenericAgent: false,
      brightDataRole: "none",
      brightDataTools: [],
      agenticLoop: false,
      brightDataTrace: false
    },
    evidenceItems: [
      {
        id: `${id}-repo-input`,
        sourceType: "user-input",
        sourceUrl: repoUrl,
        title: "Reviewer supplied GitHub repository",
        excerpt:
          "Repository accepted locally. Run live collection to fetch README, recent commits, demo links, dependency evidence, and public originality signals.",
        collectedAt: new Date().toISOString(),
        collector: "ProofRank reviewer intake",
        confidence: 0.72,
        supports: ["Review target"],
        limitations: "No remote repository content has been fetched inside the static browser demo."
      }
    ],
    brightDataTraces: [
      {
        mode: "pending-live",
        tool: "Remote MCP",
        queryOrUrl: repoUrl,
        resultCount: 0,
        status: "waiting for server-side collection",
        collectedAt: new Date().toISOString()
      }
    ]
  };
}

function addReviewerProject() {
  const project = reviewerProjectFromInputs();
  if (!project) return;

  state.reviewerProjects = [project, ...state.reviewerProjects.filter((item) => item.id !== project.id)];
  state.projects = rankProjects(sourceProjects());
  state.selectedId = project.id;
  elements.reviewerHint.textContent = "Project added. Live Bright Data collection is still needed for a real evidence receipt.";
  setStatus(`${project.title} added to the review queue.`, "ready");
  render();
}

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.remove("is-active"));
    button.classList.add("is-active");
    state.filter = button.dataset.filter;
    renderRankedList();
  });
});

elements.modeSelect.addEventListener("change", () => {
  state.mode = elements.modeSelect.value;
  setStatus(state.mode === "live" ? "Live mode selected. Add a server-side Bright Data token before running." : "Demo evidence ready", state.mode === "live" ? "warn" : "ready");
  renderReadiness(selectedProject());
});

elements.apiKey.addEventListener("input", () => renderReadiness(selectedProject()));
elements.runAudit.addEventListener("click", runAudit);
elements.htmlUpload.addEventListener("change", (event) => handleUpload(event.target.files[0]));
elements.addReviewerProject.addEventListener("click", addReviewerProject);

elements.exportCsv.addEventListener("click", () => {
  downloadText("proofrank-judge-queue.csv", toCsv(state.projects), "text/csv");
});

elements.exportReceipts.addEventListener("click", () => {
  downloadJson("proofrank-all-receipts.json", state.projects.map(buildReceipt));
});

elements.exportSelected.addEventListener("click", () => {
  downloadJson(`${selectedProject().id}-proof-receipt.json`, buildReceipt(selectedProject()));
});

elements.exportPacket.addEventListener("click", () => {
  downloadText("proofrank-submission-packet.md", buildSubmissionPacket(fixtureProjects[0]), "text/markdown");
});

render();
