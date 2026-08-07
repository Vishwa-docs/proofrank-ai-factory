import { EVENT_URL, fixtureProjects } from "./fixtures.js";
import { extractProjectsFromHtml } from "./parser.js";
import { brightDataTraceState, hasBrightDataSponsorProofBundle, rankProjects } from "./scoring.js";
import { buildClaimLedger } from "./claims.js";
import { buildTribunal } from "./tribunal.js";
import { buildOriginalityRadar } from "./originality.js";
import { buildReadiness, readinessSummary } from "./readiness.js";
import { buildWinnerBenchmark } from "./winnerBenchmark.js";
import { buildCliCommands, buildMcpQueries, setupChecklist } from "./brightDataAdapter.js";
import { buildReceipt, buildSubmissionPacket, downloadJson, downloadText, toCsv } from "./exporters.js";

const elements = {
  modeSelect: document.querySelector("#modeSelect"),
  runModeLabel: document.querySelector("#runModeLabel"),
  liveProofStrip: document.querySelector("#liveProofStrip"),
  eventUrl: document.querySelector("#eventUrl"),
  liveApiUrl: document.querySelector("#liveApiUrl"),
  htmlUpload: document.querySelector("#htmlUpload"),
  runAudit: document.querySelector("#runAudit"),
  statusLine: document.querySelector("#statusLine"),
  rankedList: document.querySelector("#rankedList"),
  proofTopology: document.querySelector("#proofTopology"),
  queueCount: document.querySelector("#queueCount"),
  scorecard: document.querySelector("#scorecard"),
  receipt: document.querySelector("#receipt"),
  fieldMap: document.querySelector("#fieldMap"),
  fieldSummary: document.querySelector("#fieldSummary"),
  readinessSummary: document.querySelector("#readinessSummary"),
  readinessMeter: document.querySelector("#readinessMeter"),
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

function reviewHeaders() {
  const headers = {
    "Content-Type": "application/json"
  };

  try {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("reviewToken") || params.get("proofrankToken") || "";
    if (queryToken) sessionStorage.setItem("proofrankReviewToken", queryToken);
    const token = sessionStorage.getItem("proofrankReviewToken") || "";
    if (token) headers["x-proofrank-token"] = token;
  } catch {
    // Token support is optional; failed storage should not break demo mode.
  }

  return headers;
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

function updateRunProfile() {
  elements.runModeLabel.textContent = state.mode === "live" ? "Bright Data live" : "Saved evidence";
}

function updateLiveProofStrip(project) {
  const traceState = brightDataTraceState(project);
  const sponsorBundle = hasBrightDataSponsorProofBundle(project);
  const receipt = project.runReceipt || {};
  const className =
    sponsorBundle || traceState === "executed" ? "is-executed" : traceState === "direct" || traceState === "planned" ? "is-pending" : "is-missing";
  const title =
    sponsorBundle
      ? "Sponsor bundle executed"
      : traceState === "executed"
        ? "Partial Bright Data run"
      : traceState === "direct"
        ? "Direct evidence only"
        : traceState === "planned"
          ? "Replay planned"
          : "No executed run yet";
  const detail =
    sponsorBundle
      ? `${receipt.runId || "Run receipt issued"} / ${receipt.signature ? "signed" : "unsigned"}`
      : traceState === "executed"
        ? "Source plus search plus discover required"
      : traceState === "direct"
        ? "Bright Data replay still required"
        : traceState === "planned"
          ? "Bright Data commands prepared"
          : "Live collection required";

  elements.liveProofStrip.className = `live-proof-strip ${className}`;
  elements.liveProofStrip.innerHTML = `
    <span>Bright proof</span>
    <strong>${escapeHtml(title)}</strong>
    <small>${escapeHtml(detail)}</small>
  `;
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

function routeStatus(passed, pending = false) {
  if (passed) return "passed";
  if (pending) return "pending";
  return "missing";
}

function routeStatusLabel(status) {
  if (status === "passed") return "Ready";
  if (status === "pending") return "Pending";
  return "Action";
}

function renderProofTopology(project) {
  const traceState = brightDataTraceState(project);
  const executedBright = traceState === "executed";
  const sponsorBundle = hasBrightDataSponsorProofBundle(project);
  const evidenceItemCount = (project.evidenceItems || []).length;
  const hasItems = evidenceItemCount > 0;
  const hasPacket = Boolean(project.evidence?.proofReceipt);
  const route = [
    {
      label: "Event source",
      detail: "lablab.ai submission context",
      status: routeStatus(isHttpUrl(project.eventUrl || elements.eventUrl.value))
    },
    {
      label: "Repository",
      detail: project.githubUrl || "Public source missing",
      status: routeStatus(isHttpUrl(project.githubUrl || ""), project.evidence?.hasGithub === true)
    },
    {
      label: "Deployed app",
      detail: project.demoUrl || "Public app missing",
      status: routeStatus(isHttpUrl(project.demoUrl || ""), project.evidence?.hasPublicDemo === true)
    },
    {
      label: "Bright bundle",
      detail: sponsorBundle ? "Source, search, discover executed" : executedBright ? "Partial sponsor proof" : `Current state: ${traceState}`,
      status: routeStatus(sponsorBundle, executedBright || ["planned", "claimed", "pending", "direct"].includes(traceState))
    },
    {
      label: "Claim ledger",
      detail: `${evidenceItemCount} evidence item${evidenceItemCount === 1 ? "" : "s"}`,
      status: routeStatus(hasItems)
    },
    {
      label: "Judge packet",
      detail: hasPacket ? "Receipt and exports ready" : "Receipt export missing",
      status: routeStatus(hasPacket)
    }
  ];

  elements.proofTopology.innerHTML = `
    <div class="module-head proof-head">
      <div>
        <h2>Evidence route</h2>
        <p class="hint">The Bright Data gate is the load-bearing sponsor proof.</p>
      </div>
      <span class="route-verdict ${sponsorBundle ? "passed" : "pending"}">${escapeHtml(
        sponsorBundle ? "Sponsor proof bundle executed" : "Sponsor proof bundle incomplete"
      )}</span>
    </div>
    <ol class="route-map">
      ${route
        .map(
          (item) => `
            <li class="route-node ${escapeAttr(item.status)}">
              <span>${escapeHtml(routeStatusLabel(item.status))}</span>
              <strong>${escapeHtml(item.label)}</strong>
              <p>${escapeHtml(item.detail)}</p>
            </li>
          `
        )
        .join("")}
    </ol>
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

function renderTribunal(project) {
  const tribunal = buildTribunal(project);
  const openCount = tribunal.disputes.filter((dispute) => dispute.status === "open").length;

  return `
    <section class="tribunal-panel">
      <div class="module-head compact">
        <h2>Adversarial tribunal</h2>
        <span class="hint">${tribunal.finalRecommendation.confidence}% confidence / ${openCount} open</span>
      </div>
      <div class="tribunal-verdict">
        <strong>${escapeHtml(tribunal.finalRecommendation.label)}</strong>
        <p>${escapeHtml(tribunal.finalRecommendation.action)}</p>
      </div>
      <div class="tribunal-grid">
        ${tribunal.panel
          .map(
            (judge) => `
              <article class="tribunal-card">
                <div>
                  <h3>${escapeHtml(judge.role)}</h3>
                  <span>${judge.confidence}</span>
                </div>
                <p>${escapeHtml(judge.stance)}</p>
                <ul>
                  ${[...judge.reasons, ...judge.objections].slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
              </article>
            `
          )
          .join("")}
      </div>
      <div class="dispute-row">
        ${tribunal.disputes
          .map((dispute) => `<span class="${escapeAttr(dispute.status)}">${escapeHtml(dispute.topic)}</span>`)
          .join("")}
      </div>
    </section>
  `;
}

function renderOriginalityRadar(project) {
  const radar = buildOriginalityRadar(project, state.projects);
  const similar = radar.similarProjects
    .map(
      (item) => `
        <article class="similarity-card">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <span>${item.overlap}</span>
          </div>
          <p>${escapeHtml(item.team || "Unknown team")}</p>
          <ul>${item.reasons.slice(0, 3).map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
        </article>
      `
    )
    .join("");
  const differentiators = radar.differentiators.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const queries = radar.brightDataQueries
    .map((query) => `<li><strong>${escapeHtml(query.tool)}</strong><span>${escapeHtml(query.query || query.intent)}</span></li>`)
    .join("");

  return `
    <section class="originality-panel">
      <div class="module-head compact">
        <h2>Originality radar</h2>
        <span class="hint">${escapeHtml(radar.riskLabel)} / ${radar.score}</span>
      </div>
      <div class="originality-grid">
        <div class="radar-summary">
          <span>Top overlap</span>
          <strong>${radar.topOverlap}</strong>
          <p>${escapeHtml(radar.riskLabel)}</p>
        </div>
        <div class="differentiator-list">
          <h3>Defensible wedge</h3>
          <ul>${differentiators}</ul>
        </div>
      </div>
      <div class="similarity-grid">${similar}</div>
      <div class="query-strip">
        <h3>Bright Data prior-art queries</h3>
        <ul>${queries}</ul>
      </div>
    </section>
  `;
}

function renderWinnerBenchmark(project) {
  const benchmark = buildWinnerBenchmark(project);
  const gapItems = benchmark.gaps.slice(0, 3);

  return `
    <section class="winner-benchmark">
      <div class="module-head compact">
        <h2>Winner benchmark</h2>
        <span class="hint">${escapeHtml(benchmark.tier)} / ${benchmark.score}</span>
      </div>
      <div class="benchmark-meter meter" style="--bar-width: ${benchmark.score}%"><i></i></div>
      <div class="benchmark-grid">
        <div>
          <h3>Signals matched</h3>
          <ul>
            ${benchmark.matches
              .map((item) => `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.proof)}</span></li>`)
              .join("")}
          </ul>
        </div>
        <div>
          <h3>Prize gaps</h3>
          <ul>
            ${gapItems
              .map((item) => `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.action)}</span></li>`)
              .join("") || `<li><strong>No open gaps</strong><span>Ready to defend the Bright Data prize story.</span></li>`}
          </ul>
        </div>
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
  const traceState = brightDataTraceState(project);
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
      ${scoreTile("Bright prize", project.scores.brightDataPrize, "Sponsor bundle rank")}
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
        <p>${(project.evidenceItems || []).length} receipt items, ${(project.brightDataTraces || []).length} collection traces, Bright Data ${traceState}.</p>
      </div>
      <div>
        <h3>Current blocker</h3>
        <ul>${risks}</ul>
      </div>
    </section>

    ${renderTribunal(project)}

    ${renderWinnerBenchmark(project)}

    ${renderOriginalityRadar(project)}

    ${renderClaimLedger(project)}
  `;
}

function renderReceipt(project) {
  const runReceipt = project.runReceipt;
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
        <td class="trace-run">
          <span class="trace-state ${escapeAttr(trace.traceStatus || "unknown")}">${escapeHtml(trace.traceStatus || "unknown")}</span>
          <small>${escapeHtml(trace.provider || trace.mode || "unknown")}</small>
        </td>
        <td>${escapeHtml(trace.queryOrUrl)}</td>
        <td>${trace.resultCount}</td>
        <td>${escapeHtml(`${trace.status}${trace.byteCount ? ` / ${trace.byteCount}b / ${trace.contentHash}` : ""}`)}</td>
      </tr>
    `
    )
    .join("");

  const livePlan = buildMcpQueries(elements.eventUrl.value || EVENT_URL, project)
    .map((query) => `<li><strong>${escapeHtml(query.tool)}</strong><span>${escapeHtml(query.purpose)}</span></li>`)
    .join("");

  elements.receipt.innerHTML = `
    <div class="run-receipt ${runReceipt ? "is-issued" : "is-empty"}">
      <span>Run receipt</span>
      <strong>${escapeHtml(runReceipt?.runId || "Not issued")}</strong>
      <small>${escapeHtml(runReceipt?.traceDigest ? `${runReceipt.collectionMode} / ${runReceipt.signature ? "signed" : "unsigned"} / ${runReceipt.traceDigest}` : "Live project collection has not issued a server receipt.")}</small>
    </div>

    <div class="receipt-list">
      ${receiptItems || `<div class="empty-state">No evidence items available.</div>`}
    </div>

    <table class="trace-table" aria-label="Bright Data traces">
      <thead>
        <tr>
          <th>Tool</th>
          <th>Run</th>
          <th>Query or URL</th>
          <th>Rows</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${traces || `<tr><td colspan="5">No Bright Data trace visible yet.</td></tr>`}
      </tbody>
    </table>

    <div class="receipt-item live-plan">
      <h3>Live collection plan</h3>
      <p>${state.mode === "live" ? "Ready for a server-side Bright Data workflow." : "Saved evidence mirrors these collection steps."}</p>
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
  const readiness = buildReadiness(project, {
    mode: state.mode,
    liveApiUrl: elements.liveApiUrl.value.trim(),
    pageOrigin: window.location.origin,
    reviewerProjectCount: state.reviewerProjects.length,
    projects: state.projects
  });

  elements.readinessSummary.innerHTML = `
    <strong>${readiness.canSubmit ? "Submission-safe" : "Still gated"}</strong>
    <span>${escapeHtml(readinessSummary(readiness))}</span>
    <small>${readiness.requiredPassed}/${readiness.requiredTotal} required / ${readiness.competitivePassed}/${readiness.competitiveTotal} competitive</small>
  `;
  elements.readinessMeter.style.setProperty("--bar-width", `${readiness.score}%`);

  elements.readinessList.innerHTML = readiness.gates
    .map(
      (item) => `
        <li class="${escapeAttr(item.status)}${item.required ? "" : " optional"}">
          <span>${item.status === "passed" ? "Passed" : item.required ? "Action" : "Improve"}</span>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.detail)}</p>
          <small>${escapeHtml(item.proof)}</small>
        </li>
      `
    )
    .join("");
}

function render() {
  const project = selectedProject();
  updateRunProfile();
  updateLiveProofStrip(project);
  renderProofTopology(project);
  renderRankedList();
  renderScorecard(project);
  renderReceipt(project);
  renderFieldMap();
  renderReadiness(project);
}

function liveEventEndpoint() {
  const endpoint = elements.liveApiUrl.value.trim();
  if (!isHttpUrl(endpoint)) throw new Error("A live API endpoint is required.");
  const url = new URL(endpoint);
  url.pathname = url.pathname.replace(/\/api\/review-project\/?$/, "/api/review-event");
  if (!url.pathname.endsWith("/api/review-event")) url.pathname = "/api/review-event";
  return url.toString();
}

async function collectEventViaApi(eventUrl) {
  const response = await fetch(liveEventEndpoint(), {
    method: "POST",
    headers: reviewHeaders(),
    body: JSON.stringify({ eventUrl, reviewFirstProject: true })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Live event API failed with status ${response.status}.`);
  return body;
}

async function runAudit() {
  const eventUrl = elements.eventUrl.value || EVENT_URL;
  const liveApiUrl = elements.liveApiUrl.value.trim();

  setStatus("Review running across submission evidence.", "ready");
  elements.runAudit.disabled = true;

  if (state.mode === "live") {
    if (!isHttpUrl(liveApiUrl)) {
      const checklist = setupChecklist().join(" ");
      setStatus(`Review API missing. Saved evidence remains ready. ${checklist}`, "warn");
      elements.runAudit.disabled = false;
      state.projects = rankProjects(sourceProjects());
      render();
      return;
    }

    try {
      setStatus("Collecting live event submissions through the backend.", "ready");
      const result = await collectEventViaApi(eventUrl);
      const liveProjects = (result.projects || []).filter((project) => project.id !== "proofrank");
      if (!liveProjects.length) {
        setStatus("Live event collection returned no submission cards. Saved evidence remains loaded.", "warn");
      } else {
        state.uploadedProjects = [fixtureProjects[0], ...liveProjects];
        state.projects = rankProjects(sourceProjects());
        state.selectedId = result.reviewedProject?.id || state.projects[0]?.id || "proofrank";
        if (result.reviewError) {
          setStatus(
            `${liveProjects.length} live submissions collected. Project-level follow-up failed: ${result.reviewError}`,
            "warn"
          );
          elements.runAudit.disabled = false;
          render();
          return;
        }
        setStatus(
          result.reviewedProject
            ? `${liveProjects.length} live submissions collected and one project-level review completed. Check the selected receipt for sponsor-proof trace state.`
            : `${liveProjects.length} live submissions collected. Event intake is not sponsor proof; review a GitHub project next for the Bright Data proof bundle.`,
          result.reviewedProject ? "ready" : "warn"
        );
      }
    } catch (error) {
      setStatus(error.message, "error");
    }

    elements.runAudit.disabled = false;
    render();
    return;
  }

  window.setTimeout(() => {
    state.projects = rankProjects(sourceProjects());
    if (!state.projects.some((project) => project.id === state.selectedId)) {
      state.selectedId = state.projects[0]?.id || "proofrank";
    }

    const commandCount = buildCliCommands(eventUrl, selectedProject()).length;
    const liveNote = state.mode === "live" ? "server workflow required next" : "collection steps prepared";
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

function reviewerInputPayload() {
  const repoUrl = elements.reviewerRepoUrl.value.trim();
  const demoUrl = elements.reviewerDemoUrl.value.trim();

  if (!isHttpUrl(repoUrl) || !repoUrl.includes("github.com/")) {
    setStatus("Add a public GitHub repository URL before adding a project.", "error");
    return null;
  }

  return {
    repoUrl,
    demoUrl: isHttpUrl(demoUrl) ? demoUrl : "",
    title: elements.reviewerTitle.value.trim(),
    team: elements.reviewerTeam.value.trim(),
    eventUrl: elements.eventUrl.value || EVENT_URL
  };
}

function reviewerProjectFromInputs() {
  const payload = reviewerInputPayload();
  if (!payload) return null;

  const repoUrl = payload.repoUrl;
  const demoUrl = payload.demoUrl;

  const repoParts = new URL(repoUrl).pathname.split("/").filter(Boolean);
  const owner = repoParts[0] || "GitHub owner";
  const repo = repoParts[1] || "project";
  const title = payload.title || labelFromSlug(repo);
  const team = payload.team || labelFromSlug(owner);
  const hasDemo = isHttpUrl(demoUrl);
  const id = `review-${owner}-${repo}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    id,
    title,
    team,
    summary:
      "Reviewer-supplied hackathon project. ProofRank can inspect the repository, deployed app, submission copy, and public web evidence once live Bright Data collection is connected.",
    eventUrl: payload.eventUrl,
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
      brightDataTrace: false,
      brightDataTraceStatus: "pending",
      brightDataTraceVisible: true
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
        provider: "bright-data",
        traceStatus: "pending",
        tool: "Remote MCP",
        queryOrUrl: repoUrl,
        resultCount: 0,
        status: "waiting for server-side collection",
        collectedAt: new Date().toISOString(),
        byteCount: 0,
        contentHash: "00000000"
      }
    ]
  };
}

async function collectReviewerProjectViaApi(payload) {
  const endpoint = elements.liveApiUrl.value.trim();
  if (!isHttpUrl(endpoint)) throw new Error("A live API endpoint is required.");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: reviewHeaders(),
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Live API failed with status ${response.status}.`);
  if (!body.project) throw new Error("Live API response did not include a project.");
  return body.project;
}

async function addReviewerProject() {
  const payload = reviewerInputPayload();
  if (!payload) return;

  let project;
  elements.addReviewerProject.disabled = true;

  try {
    if (state.mode === "live") {
      setStatus("Collecting live repository and demo evidence.", "ready");
      project = await collectReviewerProjectViaApi(payload);
    } else {
      project = reviewerProjectFromInputs();
    }
  } catch (error) {
    setStatus(error.message, "error");
    elements.reviewerHint.textContent = "Live collection failed. Check the backend server and try again.";
    elements.addReviewerProject.disabled = false;
    return;
  }

  elements.addReviewerProject.disabled = false;
  if (!project) return;

  state.reviewerProjects = [project, ...state.reviewerProjects.filter((item) => item.id !== project.id)];
  state.projects = rankProjects(sourceProjects());
  state.selectedId = project.id;
  elements.reviewerHint.textContent =
    state.mode === "live"
      ? "Project collected with the live backend. Inspect the receipt and replay traces."
      : "Project added. Live Bright Data collection is still needed for a real evidence receipt.";
  setStatus(`${project.title} added to the review queue.`, "ready");
  render();
}

function updateReviewerModeCopy() {
  if (state.mode === "live") {
    elements.addReviewerProject.textContent = "Collect project";
    elements.reviewerHint.textContent = "Repo and demo will be collected server-side with recorded traces.";
  } else {
    elements.addReviewerProject.textContent = "Add pending target";
    elements.reviewerHint.textContent = "Pending targets stay gated until Bright Data collection runs.";
  }
}

function initializeLiveEndpoint() {
  const localHosts = new Set(["localhost", "127.0.0.1", ""]);
  if (!elements.liveApiUrl.value && localHosts.has(window.location.hostname)) {
    elements.liveApiUrl.value = "http://127.0.0.1:8787/api/review-project";
  }
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
  setStatus(state.mode === "live" ? "Bright Data live selected. Start the backend before collecting." : "Saved evidence ready", state.mode === "live" ? "warn" : "ready");
  updateRunProfile();
  updateReviewerModeCopy();
  render();
});

elements.liveApiUrl.addEventListener("input", () => renderReadiness(selectedProject()));
elements.runAudit.addEventListener("click", runAudit);
elements.htmlUpload.addEventListener("change", (event) => handleUpload(event.target.files[0]));
elements.addReviewerProject.addEventListener("click", addReviewerProject);

elements.exportCsv.addEventListener("click", () => {
  downloadText("proofrank-judge-queue.csv", toCsv(state.projects), "text/csv");
});

elements.exportReceipts.addEventListener("click", () => {
  downloadJson("proofrank-all-receipts.json", state.projects.map((project) => buildReceipt(project, state.projects)));
});

elements.exportSelected.addEventListener("click", () => {
  downloadJson(`${selectedProject().id}-proof-receipt.json`, buildReceipt(selectedProject(), state.projects));
});

elements.exportPacket.addEventListener("click", () => {
  downloadText(`${selectedProject().id}-submission-packet.md`, buildSubmissionPacket(selectedProject(), state.projects), "text/markdown");
});

initializeLiveEndpoint();
updateReviewerModeCopy();
render();
