import { EVENT_URL, fixtureProjects } from "./fixtures.js";
import { extractProjectsFromHtml } from "./parser.js";
import { brightDataTraceState, hasBrightDataSponsorProofBundle, rankProjects } from "./scoring.js";
import { buildClaimLedger } from "./claims.js";
import { buildTribunal } from "./tribunal.js";
import { buildOriginalityRadar } from "./originality.js";
import { buildReadiness, readinessSummary } from "./readiness.js";
import { buildWinnerBenchmark } from "./winnerBenchmark.js";
import { buildCliCommands, buildMcpQueries, setupChecklist } from "./brightDataAdapter.js";
import { buildProgramReport, buildReceipt, buildSubmissionPacket, downloadJson, downloadText, toCsv } from "./exporters.js";
import { buildPitchReview } from "./pitchReview.js";
import { buildPublicReviewCard } from "./publicReviewCard.js";
import { buildVisitorBrief } from "./visitorBrief.js";

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
  sponsorMatrix: document.querySelector("#sponsorMatrix"),
  proofTopology: document.querySelector("#proofTopology"),
  queueCount: document.querySelector("#queueCount"),
  scorecard: document.querySelector("#scorecard"),
  receipt: document.querySelector("#receipt"),
  fieldMap: document.querySelector("#fieldMap"),
  fieldSummary: document.querySelector("#fieldSummary"),
  heroDecision: document.querySelector("#heroDecision"),
  selectionSummaryMini: document.querySelector("#selectionSummaryMini"),
  readinessSummary: document.querySelector("#readinessSummary"),
  readinessMeter: document.querySelector("#readinessMeter"),
  readinessList: document.querySelector("#readinessList"),
  reviewerRepoUrl: document.querySelector("#reviewerRepoUrl"),
  reviewerDemoUrl: document.querySelector("#reviewerDemoUrl"),
  reviewerTitle: document.querySelector("#reviewerTitle"),
  reviewerTeam: document.querySelector("#reviewerTeam"),
  reviewerHint: document.querySelector("#reviewerHint"),
  addReviewerProject: document.querySelector("#addReviewerProject"),
  pitchCheckDrawer: document.querySelector("#pitchCheckDrawer"),
  pitchTranscript: document.querySelector("#pitchTranscript"),
  loadPitchSample: document.querySelector("#loadPitchSample"),
  analyzePitch: document.querySelector("#analyzePitch"),
  pitchHint: document.querySelector("#pitchHint"),
  quickRepoUrl: document.querySelector("#quickRepoUrl"),
  quickDemoUrl: document.querySelector("#quickDemoUrl"),
  quickAddReviewerProject: document.querySelector("#quickAddReviewerProject"),
  loadSampleProject: document.querySelector("#loadSampleProject"),
  loadExternalSample: document.querySelector("#loadExternalSample"),
  copyReviewLink: document.querySelector("#copyReviewLink"),
  reviewFocusButtons: [...document.querySelectorAll("[data-review-focus]")],
  starterProjectButtons: [...document.querySelectorAll("[data-starter-project]")],
  copyAppLink: document.querySelector("#copyAppLink"),
  copyAppLinkHero: document.querySelector("#copyAppLinkHero"),
  quickReviewHint: document.querySelector("#quickReviewHint"),
  reviewRoomStats: document.querySelector("#reviewRoomStats"),
  startTour: document.querySelector("#startTour"),
  startTourTop: document.querySelector("#startTourTop"),
  guidedTour: document.querySelector("#guidedTour"),
  tourStepLabel: document.querySelector("#tourStepLabel"),
  tourTitle: document.querySelector("#tourTitle"),
  tourBody: document.querySelector("#tourBody"),
  tourNext: document.querySelector("#tourNext"),
  tourClose: document.querySelector("#tourClose"),
  exportCsv: document.querySelector("#exportCsv"),
  exportReceipts: document.querySelector("#exportReceipts"),
  exportSelected: document.querySelector("#exportSelected"),
  heroExportPacket: document.querySelector("#heroExportPacket"),
  exportPacket: document.querySelector("#exportPacket"),
  exportProgramReport: document.querySelector("#exportProgramReport"),
  exportRoomMemo: document.querySelector("#exportRoomMemo"),
  navJumps: [...document.querySelectorAll("[data-nav-tab], [data-focus-target]")],
  sectionTabs: [...document.querySelectorAll(".section-tab[data-section-tab]")],
  sectionPanels: [...document.querySelectorAll("[data-section-panel]")]
};

const PUBLIC_REVIEW_API_URL = "https://proofrank-ai-factory.vercel.app/api/review-project";
const SAMPLE_REVIEW_LINKS = {
  repoUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory",
  demoUrl: "https://proofrank-ai-factory.vercel.app/"
};
const EXTERNAL_SAMPLE_ID = "external-openenv-review";
const EXTERNAL_SAMPLE_LINKS = {
  repoUrl: "https://github.com/Vishwa-docs/Meta_PyTorch_Scalar_OpenEnv-Hackathon",
  demoUrl: "https://huggingface.co/spaces/TheJackBright/polypharmacy-env"
};
const PITCH_SAMPLE_TRANSCRIPT = `ProofRank is built for hackathon judges and sponsor teams who need to review a crowded field fast.
Paste a GitHub repository and demo link, create a browser-safe draft, then upgrade the project with private Bright Data collection.
Bright Data fetches source pages, runs prior-art search, and discovers adjacent public evidence so every sponsor claim has a trace.
The judge gets a shortlist decision, evidence gaps, business value, originality checks, and an exportable reviewer memo.
The final ask is simple: use ProofRank to make Bright Data-powered review operations defensible.`;
const REVIEW_FOCI = {
  sponsor: {
    id: "sponsor",
    label: "Bright Data sponsor",
    shortLabel: "Sponsor lens",
    detail: "Check that source, search, and discovery evidence are actually live-web powered.",
    action: "Prioritize executed Bright Data traces and inspect the Evidence view."
  },
  judge: {
    id: "judge",
    label: "Hackathon judge",
    shortLabel: "Judge lens",
    detail: "Check eligibility, demo reachability, native.builder use, and originality gaps.",
    action: "Prioritize readiness gates, public demo access, and missing submission proof."
  },
  buyer: {
    id: "buyer",
    label: "Business buyer",
    shortLabel: "Buyer lens",
    detail: "Assess whether the product has a real user, repeatable workflow, and adoption reason.",
    action: "Prioritize business value, current blocker, and the review panel objections."
  }
};
const STARTER_PROJECTS = {
  proofrank: {
    label: "ProofRank",
    repoUrl: SAMPLE_REVIEW_LINKS.repoUrl,
    demoUrl: SAMPLE_REVIEW_LINKS.demoUrl,
    focus: "sponsor"
  },
  "brightdata-mcp": {
    label: "Bright Data MCP",
    repoUrl: "https://github.com/brightdata/brightdata-mcp",
    demoUrl: "",
    focus: "sponsor"
  },
  "speechmatics-academy": {
    label: "Speechmatics Academy",
    repoUrl: "https://github.com/speechmatics/speechmatics-academy",
    demoUrl: "",
    focus: "judge"
  }
};
const FIELD_COMPARISON = [
  {
    product: "ProofRank",
    domain: "Review operations",
    brightDataRole: "Verifies sponsor usage and public evidence",
    artifact: "Reviewer memo",
    visibility: "Receipt, traces, export"
  },
  {
    product: "Half-Life",
    domain: "Decision monitoring",
    brightDataRole: "Rechecks assumptions against the live web",
    artifact: "Decision retraction",
    visibility: "Premise changes"
  },
  {
    product: "CivicTwin",
    domain: "Small-business rules",
    brightDataRole: "Finds permit and fee source material",
    artifact: "Rule receipt",
    visibility: "Source-backed blockers"
  },
  {
    product: "Askable",
    domain: "Video evidence",
    brightDataRole: "Turns public media into answerable sources",
    artifact: "Timestamped answers",
    visibility: "Exact-second citations"
  },
  {
    product: "Querypex",
    domain: "Data analysis",
    brightDataRole: "Adds transparent source context",
    artifact: "SQL-backed answer",
    visibility: "Query disclosure"
  }
];

const state = {
  mode: "demo",
  reviewFocus: "sponsor",
  filter: "all",
  activeSection: "overview",
  selectedId: "proofrank",
  projects: rankProjects(fixtureProjects),
  uploadedProjects: [],
  reviewerProjects: [],
  pitchReview: null,
  tourIndex: null
};

if (elements.guidedTour && elements.guidedTour.parentElement !== document.body) {
  document.body.appendChild(elements.guidedTour);
}

const TOUR_STEPS = [
  {
    label: "Step 1 of 5",
    title: "Paste public links",
    body: "Start with a GitHub repository and a deployed demo. Use sample if you want the shortest replay.",
    target: "#quickRepoUrl"
  },
  {
    label: "Step 2 of 5",
    title: "Read the result",
    body: "The Review view shows the next action, Bright Data state, and the claim sections worth opening.",
    section: "overview",
    target: "#scorecard"
  },
  {
    label: "Step 3 of 5",
    title: "Compare the queue",
    body: "Projects keeps your project beside the field, so judges can see why it should advance or what is missing.",
    section: "queue",
    target: "#rankedList"
  },
  {
    label: "Step 4 of 5",
    title: "Inspect the evidence",
    body: "Evidence separates collected source rows, Bright Data traces, limitations, and the exportable receipt.",
    section: "receipt",
    target: "#receipt"
  },
  {
    label: "Step 5 of 5",
    title: "Upgrade to live review",
    body: "Live setup holds Bright Data setup and the final readiness checklist. The public sample path stays safe for visitors.",
    section: "setup",
    target: "#modeSelect"
  }
];

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

function parsePublicGithubRepoUrl(value = "") {
  if (!isHttpUrl(value)) throw new Error("A public GitHub repository URL is required.");

  const url = new URL(value);
  if (url.hostname.toLowerCase() !== "github.com") {
    throw new Error("A public GitHub repository URL is required.");
  }

  const [owner, repoPart] = url.pathname.split("/").filter(Boolean);
  const repo = repoPart?.replace(/\.git$/i, "");
  if (!owner || !repo) throw new Error("A public GitHub repository URL must include an owner and repository name.");

  return {
    owner,
    repo,
    canonicalUrl: `https://github.com/${owner}/${repo}`
  };
}

function syncReviewTokenFromUrl() {
  try {
    const url = new URL(window.location.href);
    const originalHash = url.hash;
    const fragmentText = originalHash.replace(/^#/, "").replace(/^\?/, "");
    const fragmentParams = new URLSearchParams(fragmentText);
    const queryToken = url.searchParams.get("reviewToken") || url.searchParams.get("proofrankToken") || "";
    const fragmentToken = fragmentParams.get("reviewToken") || fragmentParams.get("proofrankToken") || "";
    const incomingToken = fragmentToken || queryToken;
    if (incomingToken) {
      sessionStorage.setItem("proofrankReviewToken", incomingToken);
      url.searchParams.delete("reviewToken");
      url.searchParams.delete("proofrankToken");
      fragmentParams.delete("reviewToken");
      fragmentParams.delete("proofrankToken");
      if (fragmentToken) url.hash = fragmentParams.toString();
      else url.hash = originalHash;
      window.history.replaceState({}, document.title, url.toString());
    }
    return sessionStorage.getItem("proofrankReviewToken") || "";
  } catch {
    // Token support is optional; failed storage should not break demo mode.
    return "";
  }
}

function shareableReviewParams() {
  try {
    const url = new URL(window.location.href);
    const repoUrl = url.searchParams.get("reviewRepo") || url.searchParams.get("repo") || "";
    const demoUrl = url.searchParams.get("reviewDemo") || url.searchParams.get("demo") || "";
    const focus = url.searchParams.get("reviewFocus") || "";
    return { repoUrl, demoUrl, focus, autorun: url.searchParams.get("autorun") === "1" };
  } catch {
    return { repoUrl: "", demoUrl: "", focus: "", autorun: false };
  }
}

function loadReviewParamsFromUrl() {
  const params = shareableReviewParams();
  if (params.focus && REVIEW_FOCI[params.focus]) setReviewFocus(params.focus, { silent: true });
  if (!params.repoUrl && !params.demoUrl) return false;

  if (params.repoUrl) {
    elements.quickRepoUrl.value = params.repoUrl;
    elements.reviewerRepoUrl.value = params.repoUrl;
  }
  if (params.demoUrl) {
    elements.quickDemoUrl.value = params.demoUrl;
    elements.reviewerDemoUrl.value = params.demoUrl;
  }
  setQuickHint(params.autorun ? "Review link loaded. Building a browser-safe draft review." : "Review link loaded. Click Create draft review to test it.", "ready");
  setCopyReviewLinkState();
  return params.autorun;
}

function updateShareableReviewUrl(payload) {
  if (!window.history?.replaceState) return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("reviewRepo", payload.repoUrl);
    if (payload.demoUrl) url.searchParams.set("reviewDemo", payload.demoUrl);
    else url.searchParams.delete("reviewDemo");
    if (payload.reviewFocus?.id) url.searchParams.set("reviewFocus", payload.reviewFocus.id);
    else url.searchParams.set("reviewFocus", state.reviewFocus);
    url.searchParams.delete("repo");
    url.searchParams.delete("demo");
    url.searchParams.delete("autorun");
    window.history.replaceState(null, "", url);
  } catch {
    // Keeping the browser review functional is more important than URL state.
  }
}

function isVerifiedSamplePayload(payload = {}) {
  return String(payload.repoUrl || "").toLowerCase() === SAMPLE_REVIEW_LINKS.repoUrl.toLowerCase();
}

function selectVerifiedSampleReview(payload = SAMPLE_REVIEW_LINKS) {
  updateShareableReviewUrl(payload);
  state.selectedId = "proofrank";
  const selectionDrawer = document.querySelector(".selection-drawer");
  if (selectionDrawer) selectionDrawer.open = true;
  elements.reviewerHint.textContent =
    "Built-in ProofRank receipt selected. It includes executed Bright Data source, search, and discovery evidence.";
  setQuickHint(
    "Built-in receipt loaded. Bright Data evidence is present; final lablab submission is still pending.",
    "ready"
  );
  setStatus("Built-in receipt selected. Open Evidence to inspect the Bright Data review record.", "ready");
  render();
  setActiveSection("overview", { scroll: true });
}

function selectExternalSampleReview() {
  elements.quickRepoUrl.value = EXTERNAL_SAMPLE_LINKS.repoUrl;
  elements.quickDemoUrl.value = EXTERNAL_SAMPLE_LINKS.demoUrl;
  syncFullReviewFormFromQuick();
  setReviewFocus("judge", { silent: true });
  updateShareableReviewUrl({ ...EXTERNAL_SAMPLE_LINKS, reviewFocus: REVIEW_FOCI.judge });
  state.selectedId = EXTERNAL_SAMPLE_ID;
  const selectionDrawer = document.querySelector(".selection-drawer");
  if (selectionDrawer) selectionDrawer.open = true;
  setCopyReviewLinkState();
  setQuickHint("External sample loaded. It shows ProofRank reviewing a separate public GitHub and demo project.", "ready");
  setStatus("External review sample selected. Inspect the result or replace the links with your own.", "ready");
  render();
  setActiveSection("overview", { scroll: true });
}

function shareableReviewUrlFromQuick() {
  const repoUrl = elements.quickRepoUrl.value.trim();
  const demoUrl = elements.quickDemoUrl.value.trim();
  const githubRepo = parsePublicGithubRepoUrl(repoUrl);
  const url = new URL(window.location.href);
  url.searchParams.set("reviewRepo", githubRepo.canonicalUrl);
  if (isHttpUrl(demoUrl)) url.searchParams.set("reviewDemo", demoUrl);
  else url.searchParams.delete("reviewDemo");
  url.searchParams.set("reviewFocus", state.reviewFocus);
  url.searchParams.delete("repo");
  url.searchParams.delete("demo");
  url.searchParams.set("autorun", "1");
  return url.toString();
}

function setCopyReviewLinkState() {
  if (!elements.copyReviewLink) return;
  try {
    shareableReviewUrlFromQuick();
    elements.copyReviewLink.disabled = false;
    elements.copyReviewLink.title = "Copy a link that preloads this repo and demo as a draft review.";
  } catch {
    elements.copyReviewLink.disabled = true;
    elements.copyReviewLink.title = "Paste a public GitHub repository URL first.";
  }
}

async function copyReviewLink() {
  let reviewUrl;
  try {
    reviewUrl = shareableReviewUrlFromQuick();
  } catch (error) {
    setQuickHint("Paste a GitHub repository URL like https://github.com/org/project before copying.", "error");
    setStatus(error.message, "error");
    setCopyReviewLinkState();
    return;
  }

  try {
    await navigator.clipboard.writeText(reviewUrl);
    setQuickHint("Draft link copied. It preloads these links and creates the browser-safe review.", "ready");
    setStatus("Shareable draft link copied.", "ready");
  } catch {
    window.prompt("Copy this review link:", reviewUrl);
    setQuickHint("Copy the review link from the browser prompt.", "ready");
  }
}

async function copyAppLink() {
  const appUrl = new URL(window.location.href);
  appUrl.search = "";
  appUrl.hash = "";

  try {
    await navigator.clipboard.writeText(appUrl.toString());
    setQuickHint("Room link copied. Anyone can paste their own public GitHub and demo URLs.", "ready");
    setStatus("Room link copied. Visitors can test their own public project links.", "ready");
  } catch {
    window.prompt("Copy this app link:", appUrl.toString());
    setQuickHint("Copy the room link from the browser prompt.", "ready");
    setStatus("Copy the room link from the browser prompt.", "ready");
  }
}

function setPitchHint(message, tone = "ready") {
  if (!elements.pitchHint) return;
  elements.pitchHint.textContent = message;
  elements.pitchHint.dataset.tone = tone;
}

function loadPitchSample() {
  if (!elements.pitchTranscript) return;
  elements.pitchTranscript.value = PITCH_SAMPLE_TRANSCRIPT;
  if (elements.pitchCheckDrawer) elements.pitchCheckDrawer.open = true;
  setPitchHint("Demo script loaded. Analyze it to see which claims need evidence.", "ready");
}

function analyzePitchTranscript() {
  const transcript = elements.pitchTranscript?.value.trim() || "";
  if (!transcript) {
    if (elements.pitchCheckDrawer) elements.pitchCheckDrawer.open = true;
    setPitchHint("Paste a demo transcript or load the sample script first.", "error");
    setStatus("Presentation check needs pasted pitch text.", "error");
    return;
  }

  state.pitchReview = buildPitchReview(transcript, selectedProject());
  setPitchHint(
    `Pitch score ${state.pitchReview.score}. Pasted text only; live evidence remains separate.`,
    state.pitchReview.score >= 85 ? "ready" : "warn"
  );
  setStatus("Presentation check added to the Review panel. Bright Data evidence status was not changed.", "ready");
  render();
  setActiveSection("overview", { scroll: true });
}

function reviewUrlForProject(project = selectedProject()) {
  if (!project.githubUrl || !isHttpUrl(project.githubUrl)) throw new Error("Selected project has no public GitHub URL to share.");
  const url = new URL(window.location.href);
  url.searchParams.set("reviewRepo", project.githubUrl);
  if (project.demoUrl && isHttpUrl(project.demoUrl)) url.searchParams.set("reviewDemo", project.demoUrl);
  else url.searchParams.delete("reviewDemo");
  url.searchParams.set("reviewFocus", project.reviewFocus?.id || state.reviewFocus);
  url.searchParams.set("autorun", "1");
  url.hash = "";
  return url.toString();
}

async function copySelectedProjectLink(project = selectedProject()) {
  let reviewUrl;
  try {
    reviewUrl = reviewUrlForProject(project);
  } catch (error) {
    setStatus(error.message, "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(reviewUrl);
    setStatus(`${project.title} replay link copied.`, "ready");
  } catch {
    window.prompt("Copy this project replay link:", reviewUrl);
    setStatus("Copy the project replay link from the browser prompt.", "ready");
  }
}

async function copySelectedReviewCard(project = selectedProject()) {
  let reviewUrl = "";
  try {
    reviewUrl = reviewUrlForProject(project);
  } catch {
    reviewUrl = new URL(window.location.href).toString();
  }

  const roomUrl = new URL(window.location.href);
  roomUrl.search = "";
  roomUrl.hash = "";
  const card = buildPublicReviewCard(project, {
    reviewUrl,
    roomUrl: roomUrl.toString()
  });

  try {
    await navigator.clipboard.writeText(card);
    setStatus("Draft review card copied. Link-only limits are included.", "ready");
    setQuickHint("Draft review card copied. Run Live setup before treating links as evidence.", "ready");
  } catch {
    window.prompt("Copy this draft review card:", card);
    setStatus("Copy the draft review card from the browser prompt.", "ready");
  }
}

function hasReviewToken() {
  return Boolean(syncReviewTokenFromUrl());
}

function selectedReviewFocus() {
  return REVIEW_FOCI[state.reviewFocus] || REVIEW_FOCI.sponsor;
}

function setReviewFocus(focusId, options = {}) {
  if (!REVIEW_FOCI[focusId]) return;
  state.reviewFocus = focusId;
  elements.reviewFocusButtons.forEach((button) => {
    const selected = button.dataset.reviewFocus === focusId;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-checked", selected ? "true" : "false");
  });
  setCopyReviewLinkState();
  if (!options.silent) {
    const focus = selectedReviewFocus();
    setQuickHint(`${focus.shortLabel} selected. ${focus.action}`, "ready");
    setStatus(`${focus.label} selected.`, "ready");
    render();
  }
}

function loadStarterProject(starterId) {
  const starter = STARTER_PROJECTS[starterId];
  if (!starter) return;
  setReviewFocus(starter.focus || state.reviewFocus, { silent: true });
  elements.quickRepoUrl.value = starter.repoUrl;
  elements.quickDemoUrl.value = starter.demoUrl || "";
  syncFullReviewFormFromQuick();
  setCopyReviewLinkState();
  setQuickHint(`${starter.label} loaded. Create a draft review to add it, or replace the links with your own.`, "ready");
  setStatus(`${starter.label} starter loaded.`, "ready");
  render();
}

function reviewHeaders() {
  const headers = {
    "Content-Type": "application/json"
  };

  const token = syncReviewTokenFromUrl();
  if (token) headers["x-proofrank-token"] = token;

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

function readinessContext() {
  return {
    mode: state.mode,
    liveApiUrl: elements.liveApiUrl.value.trim(),
    pageOrigin: window.location.origin,
    reviewerProjectCount: state.reviewerProjects.length,
    projects: state.projects
  };
}

function compactSentence(value = "") {
  const text = displayText(value);
  const first = text.split(". ")[0] || text;
  return first.endsWith(".") ? first : `${first}.`;
}

function filteredProjects() {
  return state.projects.filter((project) => {
    const evidence = project.evidence || {};
    if (state.filter === "high-risk") return project.verdict.label === "High risk" || project.verdict.risks.length >= 2;
    if (state.filter === "bright-strong") return hasBrightDataSponsorProofBundle(project);
    if (state.filter === "missing-demo") return !evidence.hasPublicDemo;
    if (state.filter === "missing-github") return !evidence.hasGithub;
    if (state.filter === "strong-candidate") return project.verdict.label === "Strong candidate";
    return true;
  });
}

function setStatus(message, tone = "ready") {
  elements.statusLine.textContent = displayText(message);
  elements.statusLine.className = `status-line ${tone === "warn" ? "warn" : ""} ${tone === "error" ? "error" : ""}`.trim();
}

function setQuickHint(message, tone = "ready") {
  if (!elements.quickReviewHint) return;
  elements.quickReviewHint.textContent = displayText(message);
  elements.quickReviewHint.className = `hint quick-review-hint ${tone === "warn" ? "warn" : ""} ${tone === "error" ? "error" : ""}`.trim();
}

function updateRunProfile() {
  elements.runModeLabel.textContent = state.mode === "live" ? "Live Bright Data review" : "Draft review";
}

function hasPendingFinalSubmission(project = {}) {
  return project.evidence?.lablabSubmissionPending === true || project.evidence?.lablabSubmissionComplete === false;
}

function isDraftProject(project = {}) {
  return String(project.id || "").startsWith("review-") && !hasBrightDataSponsorProofBundle(project);
}

function visibleVerdictLabel(label = "") {
  return label || "Needs review";
}

function displayVerdictLabel(project = {}) {
  if (hasPendingFinalSubmission(project) && hasBrightDataSponsorProofBundle(project)) return "Evidence report ready";
  return visibleVerdictLabel(project.verdict?.label);
}

function displayAction(project = {}, fallback = "") {
  if (hasPendingFinalSubmission(project) && hasBrightDataSponsorProofBundle(project)) {
    return "Submit final entry from the lablab team account";
  }
  return fallback || project.verdict?.action || "Review evidence";
}

function displayPrimaryBlocker(project = {}, fallback = "") {
  if (hasPendingFinalSubmission(project) && hasBrightDataSponsorProofBundle(project)) {
    return "Final submission not sent.";
  }
  return fallback || "No major audit risk visible in current evidence.";
}

function updateLiveProofStrip(project) {
  const traceState = brightDataTraceState(project);
  const sponsorBundle = hasBrightDataSponsorProofBundle(project);
  const receipt = project.runReceipt || {};
  const evidenceScope =
    state.mode === "live" && project.id.startsWith("review-")
      ? `Live review: ${project.title}`
      : hasBrightDataSponsorProofBundle(project)
        ? `${project.id === "proofrank" ? "Built-in receipt" : "Selected receipt"}: ${project.title}`
        : `Draft review: ${project.title}`;
  const className =
    sponsorBundle || traceState === "executed" ? "is-executed" : traceState === "direct" || traceState === "planned" ? "is-pending" : "is-missing";
  const title =
    sponsorBundle
      ? hasPendingFinalSubmission(project)
        ? "Bright Data receipt present"
        : "Bright Data evidence ready"
      : traceState === "executed"
        ? "Partial live evidence"
      : traceState === "direct"
        ? "Direct evidence only"
        : traceState === "planned"
          ? "Live replay prepared"
          : "Draft review only";
  const detail =
    sponsorBundle
      ? `${hasPendingFinalSubmission(project) ? "final lablab submission pending / " : ""}source fetch, prior-art search, and discovery checked / ${receipt.signature ? "server record attached" : "review record pending"}`
      : traceState === "executed"
        ? "Source, search, and discovery checks still need the complete review record"
      : traceState === "direct"
        ? "Bright Data replay can strengthen this review"
        : traceState === "planned"
          ? "Bright Data checks prepared"
          : "Run live collection when a private reviewer session is available";

  elements.liveProofStrip.className = `live-proof-strip ${className}`;
  elements.liveProofStrip.innerHTML = `
    <span>${escapeHtml(evidenceScope)}</span>
    <strong>${escapeHtml(title)}</strong>
    <small>${escapeHtml(detail)}</small>
  `;
}

function statusClass(project) {
  const label = displayVerdictLabel(project);
  if (label === "Strong candidate" || label === "Ready to hand off" || label === "Evidence report ready") return "good";
  if (project.verdict.label === "High risk") return "risk";
  return "review";
}

function setActiveSection(sectionName, options = {}) {
  state.activeSection = sectionName;
  elements.sectionTabs.forEach((tab) => {
    const selected = tab.dataset.sectionTab === sectionName;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", selected ? "true" : "false");
  });
  elements.sectionPanels.forEach((panel) => {
    const selected = panel.dataset.sectionPanel === sectionName;
    panel.hidden = !selected;
    panel.classList.toggle("is-active", selected);
  });

  if (options.scroll) {
    document.querySelector(".section-tabs")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

function clearTourTarget() {
  document.querySelectorAll(".is-tour-target").forEach((element) => element.classList.remove("is-tour-target"));
}

function renderTourStep() {
  if (state.tourIndex === null || !elements.guidedTour) return;
  const step = TOUR_STEPS[state.tourIndex];
  if (!step) {
    closeTour();
    return;
  }

  elements.guidedTour.hidden = false;
  elements.tourStepLabel.textContent = step.label;
  elements.tourTitle.textContent = step.title;
  elements.tourBody.textContent = step.body;
  elements.tourNext.textContent = state.tourIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next";

  if (step.section) setActiveSection(step.section, { scroll: true });

  window.setTimeout(() => {
    clearTourTarget();
    const target = document.querySelector(step.target);
    target?.classList.add("is-tour-target");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLButtonElement) {
      target.focus({ preventScroll: true });
    }
  }, step.section ? 240 : 80);
}

function startTour() {
  state.tourIndex = 0;
  setStatus("Guided review started. Follow the highlighted area.", "ready");
  renderTourStep();
}

function advanceTour() {
  if (state.tourIndex === null) {
    startTour();
    return;
  }
  state.tourIndex += 1;
  renderTourStep();
}

function closeTour() {
  state.tourIndex = null;
  clearTourTarget();
  if (elements.guidedTour) elements.guidedTour.hidden = true;
  setStatus("Guided review closed. Paste links or inspect the selected result.", "ready");
}

function renderHeroDecision(project) {
  const readiness = buildReadiness(project, readinessContext());
  const traceState = hasBrightDataSponsorProofBundle(project) ? "executed" : brightDataTraceState(project);
  const primaryBlocker = displayPrimaryBlocker(project, project.verdict.risks[0] || readiness.nextActions[0] || "Ready to export the review memo.");
  const nativeUrl = project.nativeBuilderUrl || (String(project.demoUrl || "").includes("nativelyai.app") ? project.demoUrl : "");
  const verdictLabel = displayVerdictLabel(project);
  const scoreLabel = hasPendingFinalSubmission(project) ? "Evidence" : "Overall";
  const scoreValue = hasPendingFinalSubmission(project) ? "Attached" : project.scores.overall;
  const bundleStatus = hasBrightDataSponsorProofBundle(project) ? "executed" : traceState;
  const focus = project.reviewFocus || selectedReviewFocus();

  elements.selectionSummaryMini.textContent = hasPendingFinalSubmission(project)
    ? `${displayText(project.title)} / evidence ready`
    : `${displayText(project.title)} / ${project.scores.overall}`;
  elements.selectionSummaryMini.dataset.mobileLabel = displayText(project.title);
  elements.heroDecision.innerHTML = `
    <div class="decision-head">
      <span class="verdict-pill ${statusClass(project)}">${escapeHtml(verdictLabel)}</span>
      <span class="decision-score"><span>${escapeHtml(scoreLabel)}</span><strong>${scoreValue}</strong></span>
    </div>
    <h2>${escapeHtml(project.title)}</h2>
    <p>${escapeHtml(compactSentence(project.summary))}</p>
    <div class="decision-metrics" aria-label="Selected project evidence metrics">
      <div>
        <span>Bright run</span>
        <strong>${escapeHtml(bundleStatus)}</strong>
      </div>
      <div>
        <span>Evidence</span>
        <strong>${escapeHtml(traceState)}</strong>
      </div>
      <div>
        <span>Final entry</span>
        <strong>${hasPendingFinalSubmission(project) ? "not sent" : nativeUrl ? "published" : "missing"}</strong>
      </div>
    </div>
    <div class="decision-focus">
      <span>${escapeHtml(focus.shortLabel || "Review lens")}</span>
      <strong>${escapeHtml(focus.detail || "Review context attached.")}</strong>
    </div>
    <div class="decision-blocker">
      <span>Next step</span>
      <strong>${escapeHtml(primaryBlocker)}</strong>
    </div>
  `;
}

function rankReason(project, index) {
  const traceState = hasBrightDataSponsorProofBundle(project) ? "executed" : brightDataTraceState(project);
  const draft = isDraftProject(project);
  const reasons = [];

  if (hasBrightDataSponsorProofBundle(project)) reasons.push("executed Bright Data traces");
  else if (traceState === "pending") reasons.push("Bright Data check pending");
  else if (traceState === "direct") reasons.push("direct web evidence only");
  else reasons.push(`${traceState} evidence`);

  if (draft && project.demoUrl) reasons.push("demo link supplied, not fetched");
  else if (project.evidence?.hasPublicDemo) reasons.push("demo link present");
  else reasons.push("demo needs review");

  if (project.evidence?.lowCrowdOverlap) reasons.push("lower prior-art overlap");
  else if (project.scores?.originality < 70) reasons.push("originality needs search");

  const rank = index + 1;
  return `Why #${rank}: ${reasons.slice(0, 3).join(", ")}.`;
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
      const tools = (project.evidence?.brightDataTools || []).slice(0, 2).map(escapeHtml).join(", ") || "No Bright Data evidence";
      return `
        <button class="project-row queue-row${selected}" type="button" data-id="${escapeAttr(project.id)}" role="listitem">
          <span class="rank-number">${index + 1}</span>
          <span class="queue-main">
            <strong>${escapeHtml(project.title)}</strong>
            <span>${escapeHtml(project.team)} / ${escapeHtml(project.domain || "General")}</span>
            <em>${escapeHtml(rankReason(project, index))}</em>
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
      const selectionDrawer = document.querySelector(".selection-drawer");
      if (selectionDrawer) selectionDrawer.open = true;
      setStatus(`${selectedProject().title} selected.`, "ready");
      render();
      setActiveSection("overview", { scroll: true });
    });
  });
}

function sponsorMatrixCell(label, status, detail = "") {
  const statusLabel = status === "passed" ? "Checked" : status === "pending" ? "Pending" : "Missing";
  return `
    <span class="matrix-cell ${escapeAttr(status)}" title="${escapeAttr(detail || statusLabel)}">
      <strong>${escapeHtml(label)}</strong>
      <small>${statusLabel}</small>
    </span>
  `;
}

function sponsorMatrixStatus(project, key) {
  const draft = isDraftProject(project);
  if (key === "repo") {
    if (!project.githubUrl) return { status: "missing", detail: "No repository link attached" };
    return project.evidence?.hasGithub === true && !draft
      ? { status: "passed", detail: "Repository evidence fetched" }
      : { status: "pending", detail: "Repository link supplied, not fetched in draft mode" };
  }
  if (key === "demo") {
    if (!project.demoUrl) return { status: "missing", detail: "No demo link attached" };
    return project.evidence?.hasPublicDemo === true && !draft
      ? { status: "passed", detail: "Demo evidence fetched" }
      : { status: "pending", detail: "Demo link supplied, not fetched in draft mode" };
  }
  if (key === "source") return traceStatusFor(project, (tool, query) => /scrape|source|markdown|scraper|request/i.test(`${tool} ${query}`));
  if (key === "search") return traceStatusFor(project, (tool, query) => /search|serp/i.test(`${tool} ${query}`));
  if (key === "discover") return traceStatusFor(project, (tool, query) => /discover/i.test(`${tool} ${query}`));
  if (key === "receipt") {
    const runReceipt = project.runReceipt || {};
    if (runReceipt.signature) return { status: "passed", detail: "Server record attached" };
    if (runReceipt.traceDigest) return { status: "pending", detail: "Run record needs final server confirmation" };
    return { status: "missing", detail: "No run record issued" };
  }
  return { status: "missing", detail: "Not checked" };
}

function renderSponsorMatrix() {
  if (!elements.sponsorMatrix) return;
  const projects = filteredProjects().slice(0, 8);
  if (!projects.length) {
    elements.sponsorMatrix.innerHTML = `<div class="empty-state">No projects match this filter.</div>`;
    return;
  }

  elements.sponsorMatrix.innerHTML = projects
    .map((project) => {
      const readiness = buildReadiness(project, readinessContext());
      const next = hasBrightDataSponsorProofBundle(project)
        ? "Shortlist"
        : isDraftProject(project)
          ? "Run live evidence"
          : readiness.nextActions[0] || "Review evidence";
      const cells = [
        ["Repo", "repo"],
        ["Demo", "demo"],
        ["Source", "source"],
        ["Search", "search"],
        ["Discover", "discover"],
        ["Receipt", "receipt"]
      ].map(([label, key]) => {
        const state = sponsorMatrixStatus(project, key);
        return sponsorMatrixCell(label, state.status, state.detail);
      });

      return `
        <article class="matrix-row" data-id="${escapeAttr(project.id)}">
          <button class="matrix-project" type="button" data-matrix-id="${escapeAttr(project.id)}">
            <strong>${escapeHtml(project.title)}</strong>
            <span>${escapeHtml(next)}</span>
          </button>
          <div class="matrix-cells">${cells.join("")}</div>
        </article>
      `;
    })
    .join("");

  elements.sponsorMatrix.querySelectorAll("[data-matrix-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.matrixId;
      setStatus(`${selectedProject().title} selected from sponsor matrix.`, "ready");
      render();
      setActiveSection("overview", { scroll: true });
    });
  });
}

function scoreTile(label, value, detail = "") {
  return `
    <div class="score-tile">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
      <p>${escapeHtml(detail)}</p>
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
  const isDraftReview = isDraftProject(project);
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
      status: routeStatus(!isDraftReview && project.evidence?.hasGithub === true, isHttpUrl(project.githubUrl || ""))
    },
    {
      label: "Deployed app",
      detail: project.demoUrl || "Public app missing",
      status: routeStatus(!isDraftReview && project.evidence?.hasPublicDemo === true, isHttpUrl(project.demoUrl || ""))
    },
    {
      label: "Bright Data check",
      detail: sponsorBundle ? "Source fetch, search, and discovery checked" : executedBright ? "Partial sponsor evidence" : `Current state: ${traceState}`,
      status: routeStatus(sponsorBundle, executedBright || ["planned", "claimed", "pending", "direct"].includes(traceState))
    },
    {
      label: "Checked statements",
      detail: `${evidenceItemCount} evidence item${evidenceItemCount === 1 ? "" : "s"}`,
      status: routeStatus(hasItems)
    },
    {
      label: "Review memo",
      detail: isDraftReview ? "Draft memo ready; live record missing" : hasPacket ? "Memo and exports ready" : "Review memo missing",
      status: routeStatus(hasPacket && !isDraftReview, isDraftReview || hasPacket)
    }
  ];

  elements.proofTopology.innerHTML = `
    <div class="module-head proof-head">
      <div>
        <h2>Evidence path</h2>
        <p class="hint">Bright Data provides the live web evidence behind the review.</p>
      </div>
      <span class="route-verdict ${sponsorBundle ? "passed" : "pending"}">${escapeHtml(
        sponsorBundle && hasPendingFinalSubmission(project)
          ? "Bright Data receipt present"
          : sponsorBundle
            ? "Bright Data evidence ready"
            : "Bright Data evidence incomplete"
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
      <p class="ledger-note">Source-backed, not absolute.</p>
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
        <h2>Review panel</h2>
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
        <h2>Similarity check</h2>
        <span class="hint">${escapeHtml(radar.riskLabel)} / ${radar.score}</span>
      </div>
      <div class="originality-grid">
        <div class="radar-summary">
          <span>Top overlap</span>
          <strong>${radar.topOverlap}</strong>
          <p>${escapeHtml(radar.riskLabel)}</p>
        </div>
        <div class="differentiator-list">
          <h3>What makes it different</h3>
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
        <h2>Prize fit</h2>
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

function renderFieldComparison() {
  return `
    <section class="field-comparison" aria-label="Field comparison">
      <div class="module-head compact">
        <h3>Against the field</h3>
        <span class="hint">Why this is a review product, not another assistant.</span>
      </div>
      <div class="field-comparison-grid">
        ${FIELD_COMPARISON.map(
          (item) => `
            <article class="${item.product === "ProofRank" ? "is-proofrank" : ""}">
              <span>${escapeHtml(item.domain)}</span>
              <strong>${escapeHtml(item.product)}</strong>
              <p>${escapeHtml(item.brightDataRole)}</p>
              <small>${escapeHtml(item.artifact)} / ${escapeHtml(item.visibility)}</small>
            </article>
          `
        ).join("")}
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
  const exportButton = `<button class="source-link" data-export-selected type="button">Export memo</button>`;

  if (!links.length) return `<p class="hint">No public source links attached yet.</p>${exportButton}`;

  return `${links
    .map(([label, url]) => `<a class="source-link" href="${escapeAttr(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`)
    .join("")}${exportButton}`;
}

function renderActionBoard(project, readiness) {
  const gaps = readiness.gates.filter((gate) => gate.status !== "passed").slice(0, 3);
  const gapRows = gaps.length
    ? gaps
        .map(
          (gate) => `
            <li>
              <span>${gate.required ? "Next" : "Improve"}</span>
              <strong>${escapeHtml(gate.label)}</strong>
              <p>${escapeHtml(gate.detail)}</p>
            </li>
          `
        )
        .join("")
    : `
      <li class="is-clear">
        <span>Ready</span>
        <strong>Core review package is closed</strong>
        <p>Open Evidence or export the memo for sponsor review.</p>
      </li>
  `;
  const canCopy = Boolean(project.githubUrl && isHttpUrl(project.githubUrl));
  const requiredGapCount = readiness.gates.filter((gate) => gate.required && gate.status !== "passed").length;
  const decision = hasBrightDataSponsorProofBundle(project)
    ? "Shortlist"
    : isDraftProject(project)
      ? "Request live evidence"
      : requiredGapCount >= 4 || project.verdict?.label === "High risk"
        ? "Do not advance yet"
        : "Escalate for evidence";

  return `
    <section class="action-board" aria-label="Recommended next clicks">
      <div class="action-board-copy">
        <span>Recommended decision</span>
        <strong>${escapeHtml(decision)}</strong>
        <p>${escapeHtml(readiness.canSubmit ? "Ready to hand off" : readinessSummary(readiness))}</p>
      </div>
      <div class="action-buttons">
        <button class="secondary-button small" data-score-action="evidence" type="button">Open evidence</button>
        <button class="secondary-button small" data-score-action="live" type="button">Live setup</button>
        <button class="secondary-button small" data-score-action="export" type="button">Export memo</button>
        <button class="secondary-button small" data-score-action="copy" type="button" ${canCopy ? "" : "disabled"}>Copy replay link</button>
      </div>
      <ul>${gapRows}</ul>
    </section>
  `;
}

function renderPitchReviewPanel() {
  const review = state.pitchReview;
  if (!review) return "";

  const rows = review.rows
    .map(
      (row) => `
        <li class="${row.status === "pass" ? "passed" : "needs-evidence"}">
          <span>${escapeHtml(row.status === "pass" ? "Covered" : "Needs evidence")}</span>
          <strong>${escapeHtml(row.label)}</strong>
          <p>${escapeHtml(row.detail)}</p>
        </li>
      `
    )
    .join("");
  const nextAction = review.evidenceActions[0] || "Compare pitch claims with live evidence.";

  return `
    <section class="pitch-review-panel" aria-label="Presentation evidence check">
      <div class="pitch-review-head">
        <div>
          <span>Presentation check</span>
          <h3>${escapeHtml(review.verdict)}</h3>
          <p>${escapeHtml(review.source)}; not video verification. Bright Data evidence status stays separate.</p>
        </div>
        <strong aria-label="Pitch score ${review.score}">${review.score}</strong>
      </div>
      <ul class="pitch-review-rows">${rows}</ul>
      <div class="pitch-review-action">
        <span>Next</span>
        <p>${escapeHtml(nextAction)}</p>
      </div>
    </section>
  `;
}

function renderDraftReviewCard(project) {
  if (!isDraftProject(project)) return "";

  const rows = [
    ["GitHub", project.githubUrl ? "URL accepted, content not fetched" : "Not supplied"],
    ["Demo", project.demoUrl ? "URL supplied, reachability not checked" : "Not supplied"],
    ["Bright Data", "Evidence pending"],
    ["Bright Data plan", "scrape_as_markdown + search_engine + discover planned, not executed"]
  ]
    .map(
      ([label, detail]) => `
        <li>
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(detail)}</strong>
        </li>
      `
    )
    .join("");

  return `
    <section class="draft-review-card" aria-label="Draft review card">
      <div class="draft-card-head">
        <div>
          <span>Draft review card</span>
          <strong>Link-only</strong>
        </div>
        <p>Draft review only. ProofRank accepted public URL formats in this browser; no repo/demo fetch, functionality check, or Bright Data evidence has run yet.</p>
      </div>
      <ul>${rows}</ul>
      <div class="draft-card-actions">
        <button class="primary-button small" data-score-action="live" type="button">Run Bright Data</button>
        <button class="secondary-button small" data-score-action="copy-card" type="button">Copy draft summary</button>
        <button class="text-button small" data-score-action="copy" type="button">Copy draft link</button>
      </div>
    </section>
  `;
}

function renderVisitorBrief(project) {
  const brief = buildVisitorBrief(project);
  const rows = brief.rows
    .map(
      (row) => `
        <li>
          <span>${escapeHtml(row.label)}</span>
          <strong>${escapeHtml(row.detail)}</strong>
        </li>
      `
    )
    .join("");
  const actions = brief.actions
    .map((item) => {
      const isPrimary = item.action === "live" || (brief.variant === "evidence" && item.action === "evidence");
      const className = isPrimary ? "primary-button small" : "secondary-button small";
      return `<button class="${className}" data-score-action="${escapeAttr(item.action)}" type="button">${escapeHtml(item.label)}</button>`;
    })
    .join("");

  return `
    <section class="visitor-brief ${escapeAttr(brief.variant)}" aria-label="Review brief">
      <div class="visitor-brief-head">
        <span>${escapeHtml(brief.badge)}</span>
        <h3>${escapeHtml(brief.title)}</h3>
        <p>${escapeHtml(brief.summary)}</p>
      </div>
      <ul>${rows}</ul>
      <div class="visitor-brief-actions">${actions}</div>
    </section>
  `;
}

function renderScorecard(project) {
  const reviewFocus = project.reviewFocus || selectedReviewFocus();
  const readiness = buildReadiness(project, readinessContext());
  const visibleTechnologies = project.technologies.slice(0, 3);
  const hiddenTechnologyCount = Math.max(0, project.technologies.length - visibleTechnologies.length);
  const tags = [
    `<span class="tag focus-tag">${escapeHtml(reviewFocus.shortLabel || reviewFocus.label || "Review lens")}</span>`,
    ...visibleTechnologies.map((technology) => `<span class="tag">${escapeHtml(technology)}</span>`),
    hiddenTechnologyCount
      ? `<span class="tag muted-tag" title="${escapeAttr(project.technologies.slice(visibleTechnologies.length).join(", "))}" aria-label="${escapeAttr(
          `${hiddenTechnologyCount} more technologies: ${project.technologies.slice(visibleTechnologies.length).join(", ")}`
        )}">+${hiddenTechnologyCount}</span>`
      : ""
  ].join("");
  const traceState = brightDataTraceState(project);
  const primaryRisk = displayPrimaryBlocker(project, project.verdict.risks[0] || "No major audit risk visible in current evidence.");
  const sourceCount = [project.submissionUrl, project.demoUrl, project.githubUrl, project.presentationUrl].filter((url) => url && isHttpUrl(url)).length;
  const verdictLabel = displayVerdictLabel(project);
  const actionLabel = displayAction(project, project.verdict.action);
  const scoreLabel = hasPendingFinalSubmission(project) ? "Review result" : "Review score";
  const scoreValue = hasPendingFinalSubmission(project) ? "Attached" : project.scores.overall;
  const scoreDetail = hasPendingFinalSubmission(project)
    ? `Bright Data check complete`
    : `Bright ${project.scores.brightDataPrize}`;
  const runReceipt = project.runReceipt || {};
  const sponsorProofReady = hasBrightDataSponsorProofBundle(project);
  const sponsorToolLabel = sponsorProofReady ? "Source + search + discovery" : "Source, search, and discovery needed";
  const replayState = state.mode === "live" ? (hasReviewToken() ? "private session ready" : "private token needed") : "Private live backend";

  elements.scorecard.innerHTML = `
    <section class="focus-strip">
      <div class="focus-copy">
        <span class="verdict-pill ${statusClass(project)}">${escapeHtml(verdictLabel)}</span>
        <h2>${escapeHtml(project.title)}</h2>
        <p>${escapeHtml(compactSentence(project.summary))}</p>
        <div class="tag-row">${tags}</div>
      </div>
      <div class="score-block ${hasPendingFinalSubmission(project) ? "is-proof-status" : ""}" aria-label="${escapeAttr(scoreLabel)} ${scoreValue}">
        <span>${escapeHtml(scoreLabel)}</span>
        <strong>${scoreValue}</strong>
        <small>${escapeHtml(scoreDetail)}</small>
      </div>
    </section>

    <section class="source-links" aria-label="Attached sources">
      ${renderSourceLinks(project)}
    </section>

    ${renderActionBoard(project, readiness)}

    ${renderDraftReviewCard(project)}

    ${renderVisitorBrief(project)}

    <section class="market-position" aria-label="Product readout">
      <article>
        <span>Buyer</span>
        <strong>Judges and sponsor teams</strong>
        <p>Compress public review into a shortlist with reasons, links, and open risks.</p>
      </article>
      <article>
        <span>Differentiator</span>
        <strong>Executed web evidence</strong>
        <p>Bright Data evidence rows are separated from planned, claimed, direct, and failed rows.</p>
      </article>
      <article>
        <span>Expansion</span>
        <strong>Public AI diligence</strong>
        <p>Hackathons are the entry point for accelerator, grant, and procurement review.</p>
      </article>
    </section>

    <section class="proof-highlights" aria-label="Bright Data evidence highlights">
      <article>
        <span>Bright Data evidence</span>
        <strong>${escapeHtml(sponsorToolLabel)}</strong>
        <p>${sponsorProofReady ? "Executed evidence counts; planned or claimed rows do not." : "Needs the complete source, search, and discover run."}</p>
      </article>
      <article>
        <span>Evidence report</span>
        <strong>${escapeHtml(runReceipt.runId || "No live record")}</strong>
        <p>${escapeHtml(runReceipt.traceDigest ? `${runReceipt.signature ? "Server record attached" : "Review record pending"} live run record` : "Live collection has not produced a report yet.")}</p>
      </article>
      <article>
        <span>Live rerun</span>
        <strong>${escapeHtml(replayState)}</strong>
        <p>Live review runs server-side so Bright Data secrets stay off the page.</p>
      </article>
    </section>

    ${renderPitchReviewPanel()}

    ${renderFieldComparison()}

    <details class="analysis-drawer score-drawer">
      <summary><span>Score breakdown</span><strong>${project.scores.overall} overall</strong></summary>
      <section class="score-grid" aria-label="Score breakdown">
        ${scoreTile("Eligibility", project.scores.eligibility, "Demo, repo, build evidence")}
        ${scoreTile("Bright fit", project.scores.brightDataFit, "Live web is load-bearing")}
        ${scoreTile("Bright prize", project.scores.brightDataPrize, "Sponsor run rank")}
        ${scoreTile("Business", project.scores.businessValue, "Clear user and urgency")}
        ${scoreTile("Originality", project.scores.originality, "Distinct angle and evidence")}
        ${scoreTile("Presentation", project.scores.presentation, "Judge-ready explanation")}
      </section>
    </details>

    <details class="analysis-drawer">
      <summary><span>Prize fit</span><strong>${project.scores.brightDataPrize}</strong></summary>
      ${renderWinnerBenchmark(project)}
    </details>

    <details class="analysis-drawer">
      <summary><span>Review panel</span><strong>${escapeHtml(verdictLabel)}</strong></summary>
      ${renderTribunal(project)}
    </details>

    <details class="analysis-drawer">
      <summary><span>Similarity check</span><strong>${project.scores.originality}</strong></summary>
      ${renderOriginalityRadar(project)}
    </details>

    <details class="analysis-drawer">
      <summary><span>Claim check</span><strong>${(project.evidenceItems || []).length} items</strong></summary>
      ${renderClaimLedger(project)}
    </details>
  `;
}

function traceStatusFor(project, matcher) {
  const trace = (project.brightDataTraces || []).find((item) => matcher(String(item.tool || ""), String(item.queryOrUrl || "")));
  if (!trace) return { status: "missing", detail: "not collected" };
  const traceStatus = String(trace.traceStatus || trace.status || "pending").toLowerCase();
  const passed = traceStatus === "executed";
  return {
    status: passed ? "passed" : "pending",
    detail: passed
      ? `${trace.resultCount || 0} result${trace.resultCount === 1 ? "" : "s"} / ${trace.byteCount || 0} bytes`
      : trace.status || traceStatus
  };
}

function renderBrightDataTimeline(project) {
  const runReceipt = project.runReceipt || {};
  const source = traceStatusFor(project, (tool) => /scrape|source|markdown|scraper/i.test(tool));
  const search = traceStatusFor(project, (tool) => /search|serp/i.test(tool));
  const discover = traceStatusFor(project, (tool) => /discover/i.test(tool));
  const receipt = runReceipt.traceDigest
    ? {
        status: runReceipt.signature ? "passed" : "pending",
        detail: runReceipt.signature ? "server record attached" : "record pending"
      }
    : { status: "missing", detail: "not issued" };
  const steps = [
    ["Source fetch", "Fetch public repo, demo, and submission evidence", source],
    ["Prior-art search", "Find public overlap and corroboration", search],
    ["Signal discovery", "Rank adjacent public signals", discover],
    ["Review record", "Package the run into an exportable memo", receipt]
  ];

  return `
    <section class="trace-timeline" aria-label="Bright Data run timeline">
      <div class="module-head compact">
        <h2>Bright Data evidence path</h2>
        <span class="hint">What the live-web evidence shows.</span>
      </div>
      <p class="judge-meaning">Bright Data gathers public source, search, and discovery evidence. ProofRank separates collected facts from project claims before exporting the review record.</p>
      <ol>
        ${steps
          .map(
            ([label, body, step], index) => `
              <li class="${escapeAttr(step.status)}">
                <span>${index + 1}</span>
                <strong>${escapeHtml(label)}</strong>
                <p>${escapeHtml(body)}</p>
                <small>${escapeHtml(step.detail)}</small>
              </li>
            `
          )
          .join("")}
      </ol>
    </section>
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
        <td data-label="Tool">${escapeHtml(trace.tool)}</td>
        <td class="trace-run" data-label="Run">
          <span class="trace-state ${escapeAttr(trace.traceStatus || "unknown")}">${escapeHtml(trace.traceStatus || "unknown")}</span>
          <small>${escapeHtml(trace.provider || trace.mode || "unknown")}</small>
        </td>
        <td data-label="Query or URL">${escapeHtml(trace.queryOrUrl)}</td>
        <td data-label="Rows">${trace.resultCount}</td>
        <td data-label="Status">${escapeHtml(`${trace.status}${trace.byteCount ? ` / ${trace.byteCount}b / ${trace.contentHash}` : ""}`)}</td>
      </tr>
    `
    )
    .join("");

  const livePlan = buildMcpQueries(elements.eventUrl.value || EVENT_URL, project)
    .map((query) => `<li><strong>${escapeHtml(query.tool)}</strong><span>${escapeHtml(query.query || query.intent || query.url || query.purpose)}</span></li>`)
    .join("");

  elements.receipt.innerHTML = `
    ${renderBrightDataTimeline(project)}

    <div class="run-receipt ${runReceipt ? "is-issued" : "is-empty"}">
      <span>Review run</span>
      <strong>${escapeHtml(runReceipt?.runId || "No live record")}</strong>
      <small>${escapeHtml(runReceipt?.traceDigest ? `${runReceipt.collectionMode} / ${runReceipt.signature ? "server record attached" : "review record pending"}` : "Live project collection has not issued a server record.")}</small>
    </div>

    <div class="receipt-list">
      ${receiptItems || `<div class="empty-state">No evidence items available.</div>`}
    </div>

    <details class="receipt-drawer">
      <summary>Audit details</summary>
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
          ${traces || `<tr><td colspan="5" data-label="Trace">No Bright Data trace visible yet.</td></tr>`}
        </tbody>
      </table>
    </details>

    <details class="receipt-drawer">
      <summary>Live collection plan</summary>
      <div class="receipt-item live-plan">
        <h3>Planned collector calls</h3>
        <p>${state.mode === "live" ? "Live review runs on a private backend; tokens never belong in the browser." : "Demo review mirrors these collection steps without using live credentials."}</p>
        <ul>${livePlan}</ul>
      </div>
    </details>
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

function renderReviewRoom() {
  if (!elements.reviewRoomStats) return;
  const total = state.projects.length;
  const visitorAdded = state.reviewerProjects.length;
  const executedBright = state.projects.filter(hasBrightDataSponsorProofBundle).length;
  const ready = state.projects.filter((project) => {
    const readiness = buildReadiness(project, readinessContext());
    return readiness.proofPackageReady || readiness.canSubmit || project.verdict?.label === "Strong candidate";
  }).length;

  const stats = [
    ["Projects", total],
    ["Visitor drafts", visitorAdded],
    ["Bright Data ready", executedBright],
    ["Review-ready", ready]
  ];

  elements.reviewRoomStats.innerHTML = stats
    .map(
      ([label, value]) => `
        <article>
          <span>${escapeHtml(label)}</span>
          <strong>${value}</strong>
        </article>
      `
    )
    .join("");
}

function renderReadiness(project = selectedProject()) {
  const readiness = buildReadiness(project, readinessContext());

  elements.readinessSummary.innerHTML = `
    <strong>${readiness.canSubmit ? "Ready to hand off" : "Still gated"}</strong>
    <span>${escapeHtml(readinessSummary(readiness))}</span>
    <small>${readiness.requiredPassed}/${readiness.requiredTotal} required / ${readiness.competitivePassed}/${readiness.competitiveTotal} competitive</small>
  `;
  elements.readinessMeter.style.setProperty("--bar-width", `${readiness.score}%`);

  elements.readinessList.innerHTML = readiness.gates
    .map(
      (item) => `
        <li class="${escapeAttr(item.status)}${item.required ? "" : " optional"}">
          <span>${item.status === "passed" ? "Checked" : item.required ? "Action" : "Improve"}</span>
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
  renderHeroDecision(project);
  renderProofTopology(project);
  renderRankedList();
  renderSponsorMatrix();
  renderScorecard(project);
  renderReceipt(project);
  renderFieldMap();
  renderReviewRoom();
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
      setStatus(`Live review API missing. Demo review remains available. ${checklist}`, "warn");
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
        setStatus("Live event collection returned no submission cards. Demo review remains loaded.", "warn");
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
            ? `${liveProjects.length} live submissions collected and one project-level review completed. Check the selected evidence receipt for Bright Data status.`
            : `${liveProjects.length} live submissions collected. Event intake is not sponsor evidence; review a GitHub project next for the Bright Data evidence run.`,
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

function syncFullReviewFormFromQuick() {
  elements.reviewerRepoUrl.value = elements.quickRepoUrl.value.trim();
  elements.reviewerDemoUrl.value = elements.quickDemoUrl.value.trim();
  elements.reviewerTitle.value = "";
  elements.reviewerTeam.value = "";
}

function loadSampleReviewLinks() {
  elements.quickRepoUrl.value = SAMPLE_REVIEW_LINKS.repoUrl;
  elements.quickDemoUrl.value = SAMPLE_REVIEW_LINKS.demoUrl;
  syncFullReviewFormFromQuick();
  setCopyReviewLinkState();
  selectVerifiedSampleReview(SAMPLE_REVIEW_LINKS);
}

function reviewerInputPayload() {
  const repoUrl = elements.reviewerRepoUrl.value.trim();
  const demoUrl = elements.reviewerDemoUrl.value.trim();
  let githubRepo;

  try {
    githubRepo = parsePublicGithubRepoUrl(repoUrl);
  } catch (error) {
    setStatus(error.message, "error");
    setQuickHint("Paste a GitHub repository URL like https://github.com/org/project.", "error");
    return null;
  }

  if (demoUrl && !isHttpUrl(demoUrl)) {
    const message = "Demo app URL must start with http:// or https://, or be left blank.";
    setStatus(message, "error");
    setQuickHint(message, "error");
    return null;
  }

  return {
    repoUrl: githubRepo.canonicalUrl,
    demoUrl,
    title: elements.reviewerTitle.value.trim(),
    team: elements.reviewerTeam.value.trim(),
    repoOwner: githubRepo.owner,
    repoName: githubRepo.repo,
    eventUrl: elements.eventUrl.value || EVENT_URL,
    reviewFocus: selectedReviewFocus()
  };
}

function reviewerProjectFromInputs() {
  const payload = reviewerInputPayload();
  if (!payload) return null;

  const repoUrl = payload.repoUrl;
  const demoUrl = payload.demoUrl;

  const owner = payload.repoOwner || "GitHub owner";
  const repo = payload.repoName || "project";
  const title = payload.title || labelFromSlug(repo);
  const team = payload.team || labelFromSlug(owner);
  const hasDemo = isHttpUrl(demoUrl);
  const id = `review-${owner}-${repo}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    id,
    title,
    team,
    summary:
      `${payload.reviewFocus.label} draft review. ProofRank can inspect the repository, deployed app, submission copy, and public web evidence once live Bright Data collection is connected.`,
    reviewFocus: payload.reviewFocus,
    eventUrl: payload.eventUrl,
    submissionUrl: "",
    demoUrl: hasDemo ? demoUrl : "",
    githubUrl: repoUrl,
    presentationUrl: "",
    createdAt: new Date().toISOString().slice(0, 10),
    domain: "Reviewer input",
    technologies: ["GitHub", "Bright Data collection pending", payload.reviewFocus.shortLabel],
    trackTags: ["Reviewer supplied", payload.reviewFocus.label],
    evidence: {
      hasDemo,
      hasPublicDemo: false,
      hasGithub: false,
      hasPresentation: false,
      nativeBuilderExplained: false,
      builtDuringEvent: false,
      isFunctional: false,
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
      proofReceipt: false,
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
        title: `${payload.reviewFocus.label} GitHub repository`,
        excerpt:
          `Repository accepted locally. ${payload.reviewFocus.action} Run live collection to fetch README, recent commits, demo links, dependency evidence, and public originality signals.`,
        collectedAt: new Date().toISOString(),
        collector: "ProofRank reviewer intake",
        confidence: 0.72,
        supports: ["Review project"],
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

  if (state.mode !== "live" && isVerifiedSamplePayload(payload)) {
    selectVerifiedSampleReview(payload);
    return;
  }

  let project;
  elements.addReviewerProject.disabled = true;
  elements.quickAddReviewerProject.disabled = true;

  try {
    if (state.mode === "live") {
      setStatus("Collecting live repository and demo evidence.", "ready");
      project = await collectReviewerProjectViaApi(payload);
    } else {
      project = reviewerProjectFromInputs();
    }
  } catch (error) {
    setStatus(error.message, "error");
    elements.reviewerHint.textContent = "Live review failed. Check the backend server and try again.";
    setQuickHint("Live review failed. Switch to Draft review or retry the secure backend.", "error");
    elements.addReviewerProject.disabled = false;
    elements.quickAddReviewerProject.disabled = false;
    return;
  }

  elements.addReviewerProject.disabled = false;
  elements.quickAddReviewerProject.disabled = false;
  if (!project) return;

  state.reviewerProjects = [project, ...state.reviewerProjects.filter((item) => item.id !== project.id)];
  state.projects = rankProjects(sourceProjects());
  state.selectedId = project.id;
  updateShareableReviewUrl(payload);
  const selectionDrawer = document.querySelector(".selection-drawer");
  if (selectionDrawer) selectionDrawer.open = true;
  elements.reviewerHint.textContent =
    state.mode === "live"
      ? "Project collected with the live backend. Inspect the evidence report and replay traces."
      : "Project added. Live Bright Data review is available from Live setup when private reviewer access is loaded.";
  setQuickHint(
    state.mode === "live"
      ? "Live evidence collected. Open Evidence to inspect the report."
      : "Project added. Copy draft link lets another visitor open the same links. Live setup collects Bright Data evidence.",
    "ready"
  );
  setStatus(`${project.title} added to the review queue.`, "ready");
  render();
  setActiveSection("overview", { scroll: true });
}

async function addQuickReviewerProject() {
  syncFullReviewFormFromQuick();
  const switchedFromLive = state.mode === "live";
  if (state.mode === "live") {
    state.mode = "demo";
    elements.modeSelect.value = "demo";
    updateRunProfile();
    updateReviewerModeCopy();
  }
  await addReviewerProject();
  if (switchedFromLive) {
    setQuickHint("Quick review switched to draft review so visitors can test links without private live access.", "warn");
    setStatus("Quick review switched to draft review. Use Live setup for private Bright Data collection.", "warn");
  }
}

function updateReviewerModeCopy() {
  if (state.mode === "live") {
    elements.addReviewerProject.textContent = "Run live review";
    elements.reviewerHint.textContent = hasReviewToken()
      ? "Private live access loaded for this session; Bright Data tokens stay server-side."
      : "Use a private reviewer session before collecting live evidence.";
  } else {
    elements.addReviewerProject.textContent = "Add project";
    elements.reviewerHint.textContent = "Draft review works without credentials. Live review fetches Bright Data evidence.";
  }
}

function initializeLiveEndpoint() {
  if (elements.liveApiUrl.value) return;
  const localHosts = new Set(["localhost", "127.0.0.1", ""]);
  const hostname = window.location.hostname.toLowerCase();
  if (localHosts.has(hostname)) {
    elements.liveApiUrl.value = "http://127.0.0.1:8787/api/review-project";
  } else if (hostname === "proofrank-ai-factory.vercel.app") {
    elements.liveApiUrl.value = PUBLIC_REVIEW_API_URL;
  } else if (hostname.endsWith("nativelyai.app") && hasReviewToken()) {
    elements.liveApiUrl.value = PUBLIC_REVIEW_API_URL;
  }
}

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.remove("is-active"));
    button.classList.add("is-active");
    state.filter = button.dataset.filter;
    renderRankedList();
    renderSponsorMatrix();
  });
});

elements.sectionTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveSection(button.dataset.sectionTab, { scroll: true });
  });
});

elements.navJumps.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.focusTarget) {
      const target = document.querySelector(`#${button.dataset.focusTarget}`);
      if (target?.closest(".quick-review")) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => target.focus(), 220);
        return;
      }
      setActiveSection("setup", { scroll: true });
      window.setTimeout(() => target?.focus(), 220);
      return;
    }
    setActiveSection(button.dataset.navTab, { scroll: true });
  });
});

elements.modeSelect.addEventListener("change", () => {
  state.mode = elements.modeSelect.value;
  setStatus(
    state.mode === "live"
      ? hasReviewToken()
        ? "Secure live mode selected. Private reviewer access is loaded for this browser session."
        : "Secure live mode selected. Use a private reviewer session before collecting."
      : "Draft review selected. Sample/local data is available without credentials.",
    state.mode === "live" ? "warn" : "ready"
  );
  updateRunProfile();
  updateReviewerModeCopy();
  render();
});

elements.liveApiUrl.addEventListener("input", () => renderReadiness(selectedProject()));
elements.runAudit.addEventListener("click", runAudit);
elements.htmlUpload.addEventListener("change", (event) => handleUpload(event.target.files[0]));
elements.addReviewerProject.addEventListener("click", addReviewerProject);
elements.loadPitchSample?.addEventListener("click", loadPitchSample);
elements.analyzePitch?.addEventListener("click", analyzePitchTranscript);
elements.quickAddReviewerProject.addEventListener("click", addQuickReviewerProject);
elements.loadSampleProject.addEventListener("click", loadSampleReviewLinks);
elements.loadExternalSample?.addEventListener("click", selectExternalSampleReview);
elements.copyReviewLink?.addEventListener("click", copyReviewLink);
elements.copyAppLink?.addEventListener("click", copyAppLink);
elements.copyAppLinkHero?.addEventListener("click", copyAppLink);
elements.reviewFocusButtons.forEach((button) => {
  button.addEventListener("click", () => setReviewFocus(button.dataset.reviewFocus));
});
elements.starterProjectButtons.forEach((button) => {
  button.addEventListener("click", () => loadStarterProject(button.dataset.starterProject));
});
document.querySelectorAll(".qmark").forEach((button) => {
  button.addEventListener("focus", () => button.setAttribute("aria-expanded", "true"));
  button.addEventListener("blur", () => {
    button.dataset.toggled = "false";
    button.setAttribute("aria-expanded", "false");
  });
  button.addEventListener("click", () => {
    const alreadyOpen = button.dataset.toggled === "true" && button.getAttribute("aria-expanded") === "true";
    document.querySelectorAll(".qmark").forEach((item) => {
      item.dataset.toggled = "false";
      item.setAttribute("aria-expanded", "false");
    });
    if (alreadyOpen) {
      button.blur();
      return;
    }
    button.dataset.toggled = "true";
    button.setAttribute("aria-expanded", "true");
    button.focus({ preventScroll: true });
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll(".qmark").forEach((button) => {
    button.dataset.toggled = "false";
    button.setAttribute("aria-expanded", "false");
    if (document.activeElement === button) button.blur();
  });
});
elements.scorecard?.addEventListener("click", async (event) => {
  if (event.target.closest("[data-export-selected]")) exportSubmissionPacket();
  const action = event.target.closest("[data-score-action]")?.dataset.scoreAction;
  if (!action) return;
  if (action === "evidence") {
    setActiveSection("receipt", { scroll: true });
    setStatus("Evidence report opened.", "ready");
  } else if (action === "live") {
    setActiveSection("setup", { scroll: true });
    window.setTimeout(() => elements.modeSelect?.focus(), 220);
    setStatus("Live setup opened. Use private reviewer access for Bright Data collection.", "ready");
  } else if (action === "export") {
    exportSubmissionPacket();
    setStatus("Project memo export started.", "ready");
  } else if (action === "copy") {
    await copySelectedProjectLink();
  } else if (action === "copy-card") {
    await copySelectedReviewCard();
  }
});
elements.startTour?.addEventListener("click", startTour);
elements.startTourTop?.addEventListener("click", startTour);
elements.tourNext?.addEventListener("click", advanceTour);
elements.tourClose?.addEventListener("click", closeTour);
elements.quickRepoUrl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addQuickReviewerProject();
  }
});
elements.quickDemoUrl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addQuickReviewerProject();
  }
});
elements.quickRepoUrl.addEventListener("input", setCopyReviewLinkState);
elements.quickDemoUrl.addEventListener("input", setCopyReviewLinkState);

elements.exportCsv.addEventListener("click", () => {
  downloadText("proofrank-judge-queue.csv", toCsv(state.projects), "text/csv");
});

elements.exportReceipts.addEventListener("click", () => {
  downloadJson("proofrank-all-evidence-receipts.json", state.projects.map((project) => buildReceipt(project, state.projects)));
});

elements.exportSelected.addEventListener("click", () => {
  downloadJson(`${selectedProject().id}-evidence-receipt.json`, buildReceipt(selectedProject(), state.projects));
});

function exportSubmissionPacket() {
  downloadText(`${selectedProject().id}-submission-packet.md`, buildSubmissionPacket(selectedProject(), state.projects), "text/markdown");
}

function exportProgramReport() {
  downloadText(
    "proofrank-review-room-report.md",
    buildProgramReport(state.projects, { selectedProject: selectedProject(), reviewFocus: selectedReviewFocus() }),
    "text/markdown"
  );
}

elements.heroExportPacket?.addEventListener("click", exportSubmissionPacket);
elements.exportPacket.addEventListener("click", exportSubmissionPacket);
elements.exportProgramReport?.addEventListener("click", exportProgramReport);
elements.exportRoomMemo?.addEventListener("click", exportProgramReport);

syncReviewTokenFromUrl();
initializeLiveEndpoint();
const shouldAutorunReview = loadReviewParamsFromUrl();
updateReviewerModeCopy();
setActiveSection(state.activeSection);
render();
setCopyReviewLinkState();
if (shouldAutorunReview) window.setTimeout(addQuickReviewerProject, 120);
