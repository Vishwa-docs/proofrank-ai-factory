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
  uploadedProjects: []
};

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
  elements.statusLine.textContent = message;
  elements.statusLine.className = `status-line ${tone === "warn" ? "warn" : ""} ${tone === "error" ? "error" : ""}`.trim();
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
      return `
        <button class="project-row${selected}" type="button" data-id="${project.id}" role="listitem">
          <span class="rank-number">${index + 1}</span>
          <span>
            <h3>${project.title}</h3>
            <p>${project.team} - ${project.verdict.label}</p>
          </span>
          <span class="row-score">${project.scores.overall}</span>
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

function scoreTile(label, value) {
  return `
    <div class="score-tile">
      <span>${label}</span>
      <strong>${value}</strong>
      <div class="bar" style="--bar-width: ${value}%"><i></i></div>
    </div>
  `;
}

function renderClaimLedger(project) {
  const claims = buildClaimLedger(project);
  return `
    <section class="claim-ledger">
      <div class="section-head">
        <h2>Claim Ledger</h2>
        <span class="muted">confidence, not absolutism</span>
      </div>
      <div class="claim-grid">
        ${claims
          .map(
            (claim) => `
              <div class="claim-row">
                <span class="claim-status ${claim.status.toLowerCase().replace(/\s+/g, "-")}">${claim.status}</span>
                <div>
                  <h3>${claim.claim}</h3>
                  <p>${claim.evidence}</p>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderScorecard(project) {
  const scoreDeg = `${project.scores.overall * 3.6}deg`;
  const tags = project.technologies.map((technology) => `<span class="tag">${technology}</span>`).join("");
  const risks = project.verdict.risks.length
    ? project.verdict.risks
        .map((risk) => `<span class="risk-tag${risk.includes("Bright Data") ? " high" : ""}">${risk}</span>`)
        .join("")
    : `<span class="risk-tag">No major audit risk</span>`;

  elements.scorecard.innerHTML = `
    <section class="hero-score">
      <div>
        <h2>${project.title}</h2>
        <p>${project.summary}</p>
        <div class="tag-row">${tags}</div>
      </div>
      <div class="score-ring" style="--score-deg: ${scoreDeg}" aria-label="Overall score ${project.scores.overall}">
        <span>${project.scores.overall}</span>
      </div>
    </section>

    <section class="score-grid" aria-label="Score breakdown">
      ${scoreTile("Eligibility", project.scores.eligibility)}
      ${scoreTile("BD Dependency", project.scores.brightDataFit)}
      ${scoreTile("Business", project.scores.businessValue)}
      ${scoreTile("Originality", project.scores.originality)}
      ${scoreTile("Presentation", project.scores.presentation)}
    </section>

    <section class="detail-grid">
      <div class="detail-box">
        <h3>Verdict</h3>
        <p><strong>${project.verdict.label}</strong><br>${project.verdict.action}</p>
      </div>
      <div class="detail-box">
        <h3>Target Review</h3>
        <p>${project.domain} queue for ${project.trackTags.slice(0, 3).join(", ") || "general review"}.</p>
      </div>
      <div class="detail-box">
        <h3>Evidence Count</h3>
        <p>${(project.evidenceItems || []).length} receipt items and ${(project.brightDataTraces || []).length} Bright Data trace rows.</p>
      </div>
    </section>

    <section class="risk-row" aria-label="Review risks">
      ${risks}
    </section>

    ${renderClaimLedger(project)}
  `;
}

function renderReceipt(project) {
  const receiptItems = (project.evidenceItems || [])
    .map(
      (item) => `
      <article class="receipt-item">
        <h3>${item.title}</h3>
        <p>${item.excerpt}</p>
        <div class="source-meta">
          <span>${item.sourceType}</span>
          <span>${Math.round(item.confidence * 100)}% confidence</span>
          <span>${item.collector}</span>
        </div>
      </article>
    `
    )
    .join("");

  const traces = (project.brightDataTraces || [])
    .map(
      (trace) => `
      <tr>
        <td>${trace.tool}</td>
        <td>${trace.queryOrUrl}</td>
        <td>${trace.resultCount}</td>
        <td>${trace.status}</td>
      </tr>
    `
    )
    .join("");

  const livePlan = buildMcpQueries(elements.eventUrl.value || EVENT_URL, project)
    .map((query) => `<li><strong>${query.tool}</strong>: ${query.purpose}</li>`)
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

    <div class="receipt-item">
      <h3>Live Collection Plan</h3>
      <p>${state.mode === "live" ? "Ready for server-side Bright Data execution." : "Demo mode mirrors these live collection steps."}</p>
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
            <div class="map-cell">
              <h3>${domain}</h3>
              <p>${projects.length} project${projects.length === 1 ? "" : "s"} - avg Bright Data ${averageBright}</p>
              <div class="bar" style="--bar-width: ${averageBright}%"><i></i></div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function render() {
  const project = selectedProject();
  renderRankedList();
  renderScorecard(project);
  renderReceipt(project);
  renderFieldMap();
}

function runAudit() {
  const eventUrl = elements.eventUrl.value || EVENT_URL;
  const apiKey = elements.apiKey.value.trim();

  setStatus("Audit running across submission evidence...", "ready");
  elements.runAudit.disabled = true;

  window.setTimeout(() => {
    if (state.mode === "live" && !apiKey) {
      const checklist = setupChecklist().join(" ");
      setStatus(`Live token missing. Demo mode remains ready. ${checklist}`, "warn");
      elements.runAudit.disabled = false;
      render();
      return;
    }

    const sourceProjects = state.uploadedProjects.length ? state.uploadedProjects : fixtureProjects;
    state.projects = rankProjects(sourceProjects);
    if (!state.projects.some((project) => project.id === state.selectedId)) {
      state.selectedId = state.projects[0]?.id || "proofrank";
    }

    const commandCount = buildCliCommands(eventUrl, selectedProject()).length;
    setStatus(`${state.projects.length} submissions ranked. ${commandCount} Bright Data commands prepared.`, "ready");
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
    state.projects = rankProjects(state.uploadedProjects);
    state.selectedId = state.projects[0].id;
    setStatus(`${parsed.length} uploaded submission cards parsed.`, "ready");
    render();
  });
  reader.readAsText(file);
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
  setStatus(state.mode === "live" ? "Live mode selected. Add Bright Data token before running." : "Demo evidence ready", state.mode === "live" ? "warn" : "ready");
});

elements.runAudit.addEventListener("click", runAudit);
elements.htmlUpload.addEventListener("change", (event) => handleUpload(event.target.files[0]));

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
