import { EVENT_URL, fixtureProjects } from "./fixtures.js";
import { extractProjectsFromHtml } from "./parser.js";
import { brightDataTraceState, hasBrightDataSponsorProofBundle, rankProjects } from "./scoring.js";
import { buildClaimLedger } from "./claims.js";
import { buildTribunal } from "./tribunal.js";
import { buildOriginalityRadar } from "./originality.js";
import { buildReadiness, readinessSummary } from "./readiness.js";
import { buildWinnerBenchmark } from "./winnerBenchmark.js";
import { buildEvidenceGapPenalty } from "./evidenceGapPenalty.js";
import { buildCliCommands, buildMcpQueries, setupChecklist } from "./brightDataAdapter.js";
import { buildProgramReport, buildReceipt, buildSubmissionPacket, downloadJson, downloadText, toCsv } from "./exporters.js";
import { buildPitchReview } from "./pitchReview.js";
import { buildPublicReviewCard } from "./publicReviewCard.js";
import { buildVisitorBrief } from "./visitorBrief.js";
import { buildPrizeBrief } from "./prizeBrief.js";
import { buildReviewCoach } from "./reviewCoach.js";
import { buildFlightRecorder } from "./flightRecorder.js";
import { verifyReceiptRecord } from "./receiptVerifier.js";

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
  fixList: document.querySelector("#fixList"),
  fixListSummary: document.querySelector("#fixListSummary"),
  fixListBody: document.querySelector("#fixListBody"),
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
  reviewCoach: document.querySelector("#reviewCoach"),
  outcomePreviewTitle: document.querySelector("#outcomePreviewTitle"),
  outcomePreviewList: document.querySelector("#outcomePreviewList"),
  openIntroReceipt: document.querySelector("#openIntroReceipt"),
  flightRecorderHero: document.querySelector("#flightRecorderHero"),
  loadSampleProject: document.querySelector("#loadSampleProject"),
  loadExternalSample: document.querySelector("#loadExternalSample"),
  sampleReplayButtons: [...document.querySelectorAll("[data-load-sample]")],
  copyReviewLink: document.querySelector("#copyReviewLink"),
  reviewFocusButtons: [...document.querySelectorAll("[data-review-focus]")],
  starterProjectButtons: [...document.querySelectorAll("[data-starter-project]")],
  copyAppLink: document.querySelector("#copyAppLink"),
  copyAppLinkHero: document.querySelector("#copyAppLinkHero"),
  quickReviewHint: document.querySelector("#quickReviewHint"),
  quickModeButtons: [...document.querySelectorAll("[data-quick-mode]")],
  reviewRoomStats: document.querySelector("#reviewRoomStats"),
  startTour: document.querySelector("#startTour"),
  startTourTop: document.querySelector("#startTourTop"),
  topbarProjects: document.querySelector("#topbarProjects"),
  topbarExportMenu: document.querySelector("#topbarExportMenu"),
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

const PRIVATE_REVIEW_API_URL = "https://proofrank-ai-factory.vercel.app/api/review-project";
const PUBLIC_DIRECT_REVIEW_API_URL = "https://proofrank-ai-factory.vercel.app/api/review-project-public";
const SAMPLE_REVIEW_LINKS = {
  repoUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory",
  demoUrl: "https://proofrank-ai-factory.vercel.app/"
};
const EXTERNAL_SAMPLE_ID = "external-openenv-review";
const EXTERNAL_SAMPLE_LINKS = {
  repoUrl: "https://github.com/Vishwa-docs/Meta_PyTorch_Scalar_OpenEnv-Hackathon",
  demoUrl: "https://huggingface.co/spaces/TheJackBright/polypharmacy-env"
};
const REVIEW_MODES = {
  demo: {
    label: "Save draft",
    runLabel: "Save draft",
    button: "Save draft only",
    addButton: "Save draft",
    status: "Draft selected. ProofRank will save a shareable link-only review.",
    hint: "Draft review is link-only. Public review fetches safe public evidence without using Bright Data credits."
  },
  public: {
    label: "Public review",
    runLabel: "Public review",
    button: "Run public review",
    addButton: "Run public review",
    status: "Public review selected. ProofRank will fetch public GitHub and demo evidence without Bright Data spend.",
    hint: "Public review collects real public evidence. A Bright Data evidence run can add source, search, and discovery later."
  },
  live: {
    label: "Bright Data evidence run",
    runLabel: "Bright Data evidence run",
    button: "Run Bright Data run",
    addButton: "Run Bright Data run",
    status: "Bright Data evidence run selected. Server-side access is required before collection.",
    hint: "Bright Data evidence run adds source, search, and discovery later. API keys never belong in the browser."
  }
};
const PITCH_SAMPLE_TRANSCRIPT = `ProofRank is built for hackathon judges and sponsor teams who need to review a crowded field fast.
Paste a GitHub repository and demo link, create a browser-safe draft, then upgrade the project with server-side Bright Data collection.
Bright Data fetches source pages, runs prior-art search, and discovers adjacent public evidence so every sponsor claim has a source row.
The judge gets a shortlist decision, evidence gaps, business value, originality checks, and an exportable reviewer memo.
The final ask is simple: use ProofRank to make Bright Data-powered review operations defensible.`;
const REVIEW_FOCI = {
  sponsor: {
    id: "sponsor",
    label: "Bright Data sponsor",
    shortLabel: "Sponsor lens",
    detail: "Check that source, search, and discovery evidence are actually live-web powered.",
    action: "Prioritize collected Bright Data evidence and inspect the Evidence view."
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
    label: "Bright Data sample repo",
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
    visibility: "Evidence, memo, export"
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
    artifact: "Rule memo",
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
  mode: "public",
  reviewFocus: "sponsor",
  filter: "all",
  activeSection: "overview",
  selectedId: "proofrank",
  projects: rankProjects(fixtureProjects),
  uploadedProjects: [],
  reviewerProjects: [],
  pitchReview: null,
  reviewStarted: false,
  tourIndex: null,
  receiptVerifierInput: "",
  receiptVerification: null
};

if (elements.guidedTour && elements.guidedTour.parentElement !== document.body) {
  document.body.appendChild(elements.guidedTour);
}

const TOUR_STEPS = [
  {
    label: "Step 1 of 4",
    title: "Paste public links",
    body: "Start with a public GitHub repository. Add a demo URL if the project has one.",
    target: "#quickRepoUrl"
  },
  {
    label: "Step 2 of 4",
    title: "Run public review",
    body: "Use the default button first. It checks public repo and demo signals without asking for keys.",
    target: "#quickAddReviewerProject"
  },
  {
    label: "Step 3 of 4",
    title: "Read the memo",
    body: "The result explains what was checked, what is still missing, and the next best click.",
    target: "#outcomePreview"
  },
  {
    label: "Step 4 of 4",
    title: "Upgrade to Bright Data",
    body: "Open Advanced evidence options when you need a Bright Data source, search, and discovery run or an exportable receipt.",
    target: "#reviewOptions"
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

function isLocalPreviewHost() {
  return new Set(["localhost", "127.0.0.1", ""]).has(window.location.hostname.toLowerCase());
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
  setQuickHint(params.autorun ? "Review link loaded. Building a public-safe review." : "Review link loaded. Click Run public review to test it.", "ready");
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
  state.reviewStarted = true;
  state.selectedId = "proofrank";
  const selectionDrawer = document.querySelector(".selection-drawer");
  if (selectionDrawer) selectionDrawer.open = true;
  elements.reviewerHint.textContent =
    "ProofRank sample selected. It includes executed Bright Data source, search, and discovery evidence.";
  setQuickHint(
    "ProofRank sample result loaded. Bright Data evidence is attached; submit on lablab.ai from the team account.",
    "ready"
  );
  setStatus("ProofRank sample selected. Open Bright Data receipt to inspect the review.", "ready");
  render();
  setActiveSection("overview", { scroll: true });
}

function openIntroReceipt() {
  selectVerifiedSampleReview();
  setActiveSection("receipt", { scroll: true });
  setQuickHint("ProofRank sample receipt opened. It shows the executed Bright Data source, search, and discovery path.", "ready");
}

function selectExternalSampleReview() {
  state.reviewStarted = true;
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
    elements.copyReviewLink.textContent = "Copy public review link";
    elements.copyReviewLink.title = "Copy a link that preloads this repo and runs the public review path.";
  } catch {
    elements.copyReviewLink.disabled = true;
    elements.copyReviewLink.textContent = "Enter repo to copy review link";
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
    setQuickHint("Public review link copied. It preloads these links and runs the browser-safe review path.", "ready");
    setStatus("Shareable public review link copied.", "ready");
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
    `Pitch score ${state.pitchReview.score}. Pasted text only; public and Bright Data evidence remain separate.`,
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
    setQuickHint("Draft review card copied. Run Public review before treating links as evidence.", "ready");
  } catch {
    window.prompt("Copy this draft review card:", card);
    setStatus("Copy the draft review card from the browser prompt.", "ready");
  }
}

function selectedReceiptJson() {
  return JSON.stringify(buildReceipt(selectedProject(), state.projects), null, 2);
}

function loadSelectedReceiptIntoVerifier() {
  state.receiptVerifierInput = selectedReceiptJson();
  state.receiptVerification = verifyReceiptRecord(state.receiptVerifierInput);
  setStatus("Evidence JSON loaded into the receipt verifier.", state.receiptVerification.ok ? "ready" : "warn");
  render();
  setActiveSection("receipt", { scroll: true });
}

function verifyReceiptInput() {
  const input = document.querySelector("#receiptVerifierInput")?.value.trim() || "";
  if (!input) {
    state.receiptVerifierInput = "";
    state.receiptVerification = verifyReceiptRecord("");
    setStatus("Paste evidence JSON or load the selected receipt first.", "warn");
    render();
    setActiveSection("receipt", { scroll: true });
    return;
  }

  state.receiptVerifierInput = input;
  state.receiptVerification = verifyReceiptRecord(input);
  setStatus(
    state.receiptVerification.ok ? "Receipt checks passed. Trace digest and Bright Data coverage are consistent." : "Receipt needs reviewer attention.",
    state.receiptVerification.ok ? "ready" : "warn"
  );
  render();
  setActiveSection("receipt", { scroll: true });
}

function clearReceiptVerifier() {
  state.receiptVerifierInput = "";
  state.receiptVerification = null;
  setStatus("Receipt verifier cleared.", "ready");
  render();
  setActiveSection("receipt", { scroll: true });
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

function reviewEndpointForMode(mode = state.mode) {
  if (mode === "public") return PUBLIC_DIRECT_REVIEW_API_URL;
  const endpoint = elements.liveApiUrl.value.trim();
  if (isHttpUrl(endpoint)) return endpoint;
  return mode === "live" ? PRIVATE_REVIEW_API_URL : PUBLIC_DIRECT_REVIEW_API_URL;
}

function syncReviewModeControls() {
  const mode = currentReviewMode();
  if (elements.modeSelect && elements.modeSelect.value !== state.mode) {
    elements.modeSelect.value = state.mode;
  }
  elements.quickModeButtons.forEach((button) => {
    const selected = button.dataset.quickMode === state.mode;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-checked", selected ? "true" : "false");
  });
  if (elements.quickAddReviewerProject) elements.quickAddReviewerProject.textContent = mode.button;
  if (elements.addReviewerProject) elements.addReviewerProject.textContent = mode.addButton;
}

function setReviewMode(modeName, options = {}) {
  if (!REVIEW_MODES[modeName]) return;
  state.mode = modeName;
  if (modeName === "public") {
    elements.liveApiUrl.value = PUBLIC_DIRECT_REVIEW_API_URL;
  } else if (modeName === "live" && (!elements.liveApiUrl.value || elements.liveApiUrl.value === PUBLIC_DIRECT_REVIEW_API_URL)) {
    elements.liveApiUrl.value = PRIVATE_REVIEW_API_URL;
  }

  updateRunProfile();
  syncReviewModeControls();
  updateReviewerModeCopy();
  if (!options.silent) {
    const tone = modeName === "live" && !hasReviewToken() ? "warn" : "ready";
    setQuickHint(REVIEW_MODES[modeName].hint, tone);
    setStatus(
      modeName === "live" && !hasReviewToken()
        ? "Bright Data evidence run selected. Public visitors can run Public review; reviewer access unlocks Bright Data collection."
        : REVIEW_MODES[modeName].status,
      tone
    );
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
  setQuickHint(`${starter.label} loaded. Run public review to test it, or replace the links with your own.`, "ready");
  setStatus(`${starter.label} starter loaded.`, "ready");
  render();
}

function reviewHeaders() {
  const headers = {
    "Content-Type": "application/json"
  };

  if (state.mode === "public") return headers;

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

function hasActiveReview(project = selectedProject()) {
  return Boolean(project && (state.reviewStarted || project.id !== "proofrank"));
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

function currentReviewMode() {
  return REVIEW_MODES[state.mode] || REVIEW_MODES.demo;
}

function updateRunProfile() {
  elements.runModeLabel.textContent = currentReviewMode().runLabel;
}

function hasPendingFinalSubmission(project = {}) {
  return project.evidence?.lablabSubmissionPending === true || project.evidence?.lablabSubmissionComplete === false;
}

function isDraftProject(project = {}) {
  return (
    String(project.id || "").startsWith("review-") &&
    !hasBrightDataSponsorProofBundle(project) &&
    !["direct", "executed"].includes(brightDataTraceState(project))
  );
}

function isPublicReviewProject(project = {}) {
  return String(project.id || "").startsWith("review-") && brightDataTraceState(project) === "direct" && !hasBrightDataSponsorProofBundle(project);
}

function visibleVerdictLabel(label = "") {
  return label || "Needs review";
}

function displayVerdictLabel(project = {}) {
  if (isDraftProject(project)) return "Draft created";
  if (isPublicReviewProject(project)) return "Public review ready";
  if (hasPendingFinalSubmission(project) && hasBrightDataSponsorProofBundle(project)) return "Evidence attached";
  return visibleVerdictLabel(project.verdict?.label);
}

function displayAction(project = {}, fallback = "") {
  if (isDraftProject(project)) return "Run public review";
  if (isPublicReviewProject(project)) return "Run Bright Data sponsor check";
  if (hasPendingFinalSubmission(project) && hasBrightDataSponsorProofBundle(project)) {
    return "Submit final entry from the lablab team account";
  }
  return fallback || project.verdict?.action || "Review evidence";
}

function displayPrimaryBlocker(project = {}, fallback = "") {
  if (isDraftProject(project)) {
    return "Public or Bright Data evidence has not collected repo, demo, or prior-art signals yet.";
  }
  if (isPublicReviewProject(project)) {
    return "Public repo/demo evidence is collected; Bright Data source, search, and discovery evidence is not attached yet.";
  }
  if (hasPendingFinalSubmission(project) && hasBrightDataSponsorProofBundle(project)) {
    return "Submit this entry from the team lablab.ai account.";
  }
  return fallback || "No major audit risk visible in current evidence.";
}

function reviewTargetLabelFromQuick() {
  const repoUrl = elements.quickRepoUrl?.value.trim() || "";
  if (!repoUrl) return "";
  try {
    const repo = parsePublicGithubRepoUrl(repoUrl);
    return `${repo.owner}/${repo.repo}`;
  } catch {
    return "";
  }
}

function outcomePreviewRows(project = selectedProject()) {
  const targetLabel = reviewTargetLabelFromQuick();
  if (!state.reviewStarted && project.id === "proofrank") {
    return {
      title: targetLabel ? `Ready to review ${targetLabel}.` : "A plain review memo, not a score wall.",
      rows: [
        ["Action", "shortlist or fix gaps"],
        ["Evidence gaps", "what is still missing"],
        ["Bright Data lane", "source, search, discovery"],
        ["Shareable memo", "copy link or export"]
      ]
    };
  }

  if (isDraftProject(project)) {
    return {
      title: `${project.title} is saved as a link-only draft.`,
      rows: [
        ["Next click", "run public review"],
        ["Repo", "not fetched yet"],
        ["Demo", "not checked yet"],
        ["Bright Data", "waiting for reviewer access"]
      ]
    };
  }

  if (isPublicReviewProject(project)) {
    return {
      title: `${project.title} has a public review result.`,
      rows: [
        ["Action", displayAction(project)],
        ["Public evidence", "repo and demo signals"],
        ["Bright Data", "upgrade available"],
        ["Memo", "copy or export"]
      ]
    };
  }

  return {
    title: `${project.title} has reviewer evidence attached.`,
    rows: [
      ["Action", displayAction(project)],
      ["Sources", "collected rows"],
      ["Field check", "competition compared"],
      ["Memo", "ready to export"]
    ]
  };
}

function renderOutcomePreview(project = selectedProject()) {
  if (!elements.outcomePreviewTitle || !elements.outcomePreviewList) return;
  const preview = outcomePreviewRows(project);
  elements.outcomePreviewTitle.textContent = preview.title;
  elements.outcomePreviewList.innerHTML = preview.rows
    .map(
      ([label, value]) => `
        <li>
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </li>
      `
    )
    .join("");
}

function updateLiveProofStrip(project) {
  if (!state.reviewStarted && project.id === "proofrank") {
    elements.liveProofStrip.className = "live-proof-strip is-missing";
    elements.liveProofStrip.innerHTML = `
      <span>No project reviewed yet</span>
      <strong>Paste links to start</strong>
      <small>Run a public review first. Replay the ProofRank sample only if you want to inspect a finished review.</small>
    `;
    return;
  }

  const traceState = brightDataTraceState(project);
  const sponsorBundle = hasBrightDataSponsorProofBundle(project);
  const receipt = project.runReceipt || {};
  const evidenceScope =
    state.mode === "live" && project.id.startsWith("review-")
      ? `Bright Data evidence run: ${project.title}`
      : hasBrightDataSponsorProofBundle(project)
        ? `${project.id === "proofrank" ? "ProofRank sample result" : "Saved review"}: ${project.title}`
        : isPublicReviewProject(project)
          ? `Public review: ${project.title}`
          : `Draft review: ${project.title}`;
  const className =
    sponsorBundle || traceState === "executed" ? "is-executed" : traceState === "direct" || traceState === "planned" ? "is-pending" : "is-missing";
  const title =
    sponsorBundle
      ? hasPendingFinalSubmission(project)
        ? "Bright Data evidence attached"
        : "Bright Data evidence ready"
      : traceState === "executed"
        ? "Bright Data check incomplete"
      : traceState === "direct"
        ? "Direct evidence only"
          : traceState === "planned"
          ? "Reviewer-access run prepared"
          : "Draft review only";
  const detail =
    sponsorBundle
      ? `${hasPendingFinalSubmission(project) ? "Still needs to be submitted on lablab.ai. " : ""}Sources, web search, and similar projects checked; ${receipt.signature ? "saved review attached" : "saved review pending"}.`
      : traceState === "executed"
        ? "Sources, web search, and similar-project checks still need the saved review"
      : traceState === "direct"
        ? "Bright Data evidence run can strengthen this result"
        : traceState === "planned"
          ? "Bright Data checks prepared"
          : "Run Public review for real GitHub/demo evidence, or Bright Data evidence run for server-side collection.";

  elements.liveProofStrip.className = `live-proof-strip ${className}`;
  elements.liveProofStrip.innerHTML = `
    <span>${escapeHtml(evidenceScope)}</span>
    <strong>${escapeHtml(title)}</strong>
    <small>${escapeHtml(detail)}</small>
  `;
}

function statusClass(project) {
  const label = displayVerdictLabel(project);
  if (isDraftProject(project)) return "review";
  if (label === "Strong candidate" || label === "Ready to hand off" || label === "Evidence attached") return "good";
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
  const draft = isDraftProject(project);
  const scoreLabel = draft ? "Review" : hasPendingFinalSubmission(project) ? "Evidence" : "Overall";
  const scoreValue = draft ? "Draft" : hasPendingFinalSubmission(project) ? "Attached" : project.scores.overall;
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
        <span>Bright Data</span>
        <strong>${escapeHtml(bundleStatus)}</strong>
      </div>
      <div>
        <span>Evidence</span>
        <strong>${escapeHtml(traceState)}</strong>
      </div>
      <div>
        <span>Final entry</span>
        <strong>${draft ? "not scored" : hasPendingFinalSubmission(project) ? "not submitted" : nativeUrl ? "published" : "missing"}</strong>
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

  if (hasBrightDataSponsorProofBundle(project)) reasons.push("collected Bright Data evidence");
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
      state.reviewStarted = true;
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
    if (runReceipt.signature) return { status: "passed", detail: "Saved review attached" };
    if (runReceipt.traceDigest) return { status: "pending", detail: "Saved review needs final confirmation" };
    return { status: "missing", detail: "No saved review yet" };
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
          ? "Run public review"
          : readiness.nextActions[0] || "Review evidence";
      const cells = [
        ["Repo", "repo"],
        ["Demo", "demo"],
        ["Source", "source"],
        ["Search", "search"],
        ["Discover", "discover"],
        ["Record", "receipt"]
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
      state.reviewStarted = true;
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
      detail: sponsorBundle ? "Sources, web search, and similar projects checked" : executedBright ? "Bright Data check incomplete" : `Current state: ${traceState}`,
      status: routeStatus(sponsorBundle, executedBright || ["planned", "claimed", "pending", "direct"].includes(traceState))
    },
    {
      label: "Checked statements",
      detail: `${evidenceItemCount} evidence item${evidenceItemCount === 1 ? "" : "s"}`,
      status: routeStatus(hasItems)
    },
    {
      label: "Review memo",
      detail: isDraftReview ? "Draft memo ready; evidence export not ready yet" : hasPacket ? "Memo and exports ready" : "Review memo missing",
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
          ? "Bright Data evidence attached"
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
        <h2>Bright Data prize readiness</h2>
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
          <h3>What still blocks the prize case</h3>
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

function fixStatusLabel(status) {
  if (status === "clear") return "Clear";
  if (status === "blocker") return "Blocker";
  return "Gap";
}

function renderFixList(project) {
  if (!elements.fixListBody) return;
  const penalty = buildEvidenceGapPenalty(project);
  const draft = isDraftProject(project);
  const openItems = penalty.dimensions.filter((item) => item.status !== "clear");
  const displayItems = (openItems.length ? openItems : penalty.dimensions).slice(0, 5);
  const scoreDelta = Math.max(0, penalty.baseScore - penalty.adjustedScore);

  if (elements.fixListSummary) {
    elements.fixListSummary.textContent = draft
      ? "Draft only"
      : penalty.totalPenalty === 0
        ? "No open blockers"
        : `${penalty.gaps} open / -${scoreDelta} if judged today`;
  }

  elements.fixListBody.innerHTML = `
    <div class="fix-score-strip">
      <div>
        <span>Score if judged today</span>
        <strong>${draft ? "Draft" : penalty.adjustedScore}</strong>
        <small>${escapeHtml(draft ? "No ranking score until public or Bright Data evidence runs." : `Base score ${penalty.baseScore}; evidence gaps reduce the shortlist rank.`)}</small>
      </div>
      <div>
        <span>Best next click</span>
        <strong>${escapeHtml(draft ? "Collect public evidence" : penalty.status)}</strong>
        <small>${escapeHtml(draft ? "Run the public repo/demo check first; add Bright Data source/search/discovery checks for final judging." : penalty.topAction)}</small>
      </div>
    </div>
    <div class="fix-card-grid">
      ${displayItems
        .map(
          (item) => `
            <article class="${escapeAttr(item.status)}">
              <div>
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(fixStatusLabel(item.status))}</span>
              </div>
              <p>${escapeHtml(item.reason)}</p>
              <small>${escapeHtml(item.action)}</small>
            </article>
          `
        )
        .join("")}
    </div>
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
  const draft = isDraftProject(project);
  const draftGates = [
    {
      required: true,
      label: "Run public review",
      detail: "Fetch repository and demo signals through the public-safe review endpoint."
    },
    {
      required: true,
      label: "Check demo reachability",
      detail: "Confirm the deployed app loads and shows a complete workflow."
    },
    {
      required: false,
      label: "Search prior art",
      detail: "Use source, search, and discovery to explain whether the project is distinct."
    }
  ];
  const gaps = draft ? draftGates : readiness.gates.filter((gate) => gate.status !== "passed").slice(0, 3);
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
        <p>Open Bright Data receipt or export the memo for sponsor review.</p>
      </li>
  `;
  const canCopy = Boolean(project.githubUrl && isHttpUrl(project.githubUrl));
  const requiredGapCount = readiness.gates.filter((gate) => gate.required && gate.status !== "passed").length;
  const decision = draft
    ? "Collect evidence"
    : hasBrightDataSponsorProofBundle(project)
    ? "Shortlist"
    : requiredGapCount >= 4 || project.verdict?.label === "High risk"
      ? "Do not advance yet"
      : "Escalate for evidence";
  const actionSummary = draft
    ? "Draft created. Public evidence is required before ranking."
    : readiness.canSubmit
      ? "Ready to hand off"
      : readinessSummary(readiness);

  return `
    <section class="action-board" aria-label="Recommended next clicks">
      <div class="action-board-copy">
        <span>Judge action</span>
        <strong>${escapeHtml(decision)}</strong>
        <p>${escapeHtml(actionSummary)}</p>
      </div>
      <div class="action-buttons">
        <button class="secondary-button small" data-score-action="evidence" type="button">Open Bright Data receipt</button>
        ${draft ? '<button class="primary-button small" data-score-action="public" type="button">Run public review</button>' : ""}
        <button class="secondary-button small" data-score-action="live" type="button">Bright Data evidence run</button>
        <button class="secondary-button small" data-score-action="export" type="button">Export memo</button>
        <button class="secondary-button small" data-score-action="copy" type="button" ${canCopy ? "" : "disabled"}>Copy replay link</button>
      </div>
      <ul>${gapRows}</ul>
    </section>
  `;
}

function renderJudgeMemoCard(project, readiness) {
  const draft = isDraftProject(project);
  const sponsorReady = hasBrightDataSponsorProofBundle(project);
  const traceState = brightDataTraceState(project);
  const requiredGapCount = readiness.gates.filter((gate) => gate.required && gate.status !== "passed").length;
  const decision = draft
    ? "Collect evidence"
    : sponsorReady
      ? "Shortlist for sponsor review"
      : traceState === "direct"
        ? "Escalate to Bright Data"
        : requiredGapCount >= 4
          ? "Fix gaps before ranking"
          : displayAction(project);
  const evidence = draft
    ? "Links accepted only. Repo content, demo behavior, and Bright Data evidence are not collected yet."
    : sponsorReady
      ? "Bright Data source, web search, similar-project discovery, and saved review are attached."
      : traceState === "direct"
        ? "Public GitHub and demo evidence is collected. Bright Data still needs to run."
        : "Public evidence is partial. Source, search, and discovery still need reviewer access.";
  const nextAction = draft
    ? "Run public review"
    : sponsorReady
      ? "Export memo"
      : "Bright Data evidence run";
  const delta = sponsorReady
    ? "Bright Data turns the review into a sponsor-grade memo by adding source fetch, web search, and discovery rows."
    : "Bright Data is the upgrade path: source fetch, web search, and discovery explain whether the public claims hold up.";

  return `
    <section class="judge-memo-card" aria-label="Judge memo summary">
      <div class="judge-memo-head">
        <span>Judge memo</span>
        <h3>${escapeHtml(decision)}</h3>
        <p>${escapeHtml(compactSentence(project.summary))}</p>
      </div>
      <ul class="judge-memo-grid">
        <li>
          <span>Decision</span>
          <strong>${escapeHtml(decision)}</strong>
        </li>
        <li>
          <span>Evidence collected</span>
          <strong>${escapeHtml(evidence)}</strong>
        </li>
        <li>
          <span>Next action</span>
          <strong>${escapeHtml(nextAction)}</strong>
        </li>
      </ul>
      <div class="bright-delta">
        <span>Bright Data changes the review</span>
        <strong>${escapeHtml(delta)}</strong>
      </div>
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
  const nextAction = review.evidenceActions[0] || "Compare pitch claims with public or Bright Data evidence.";

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
    ["Bright Data plan", "Source fetch, web search, and discovery are planned, not run yet"]
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
          <span>Draft created</span>
          <strong>Not scored yet</strong>
        </div>
        <p>ProofRank accepted the public link formats in this browser. It has not fetched repo content, checked demo behavior, or collected Bright Data evidence yet.</p>
      </div>
      <ul>${rows}</ul>
      <div class="draft-card-actions">
        <button class="primary-button small" data-score-action="public" type="button">Run public review</button>
        <button class="secondary-button small" data-score-action="live" type="button">Bright Data evidence run</button>
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
      const isPrimary = item.action === "public" || item.action === "live" || (brief.variant === "evidence" && item.action === "evidence");
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

function rubricStatus(score = 0, blocked = false) {
  if (blocked) return "gap";
  if (score >= 85) return "strong";
  if (score >= 70) return "partial";
  return "gap";
}

function rubricLabel(status = "partial") {
  if (status === "strong") return "Strong";
  if (status === "gap") return "Needs evidence";
  return "Partial";
}

function buildRubricMemoRows(project) {
  const traceState = brightDataTraceState(project);
  const sponsorReady = hasBrightDataSponsorProofBundle(project);
  const pitchReady = state.pitchReview?.score >= 80;
  const hasFieldEvidence = project.evidence?.lowCrowdOverlap === true || project.scores.originality >= 80;
  return [
    {
      criterion: "Application of Technology",
      score: project.scores.brightDataPrize,
      status: rubricStatus(project.scores.brightDataPrize, !sponsorReady),
      evidence: sponsorReady
        ? "Bright Data source, search, discovery, and saved review are attached."
        : traceState === "direct"
          ? "Public repo/demo evidence is collected; Bright Data sponsor evidence is still missing."
          : "Show the Bright Data source, search, and discovery path before judging."
    },
    {
      criterion: "Presentation",
      score: project.scores.presentation,
      status: rubricStatus(project.scores.presentation, !pitchReady && project.scores.presentation < 85),
      evidence: pitchReady
        ? "Pitch text covers problem, workflow, evidence, business value, and final ask."
        : "Use Presentation Check to confirm the demo explains the workflow and evidence."
    },
    {
      criterion: "Business Value",
      score: project.scores.businessValue,
      status: rubricStatus(project.scores.businessValue),
      evidence: "Buyer, urgency, repeatable workflow, and adoption risk are summarized for the reviewer."
    },
    {
      criterion: "Originality",
      score: project.scores.originality,
      status: rubricStatus(project.scores.originality, !hasFieldEvidence && project.scores.originality < 85),
      evidence: hasFieldEvidence
        ? "The field comparison shows a distinct product wedge."
        : "Inspect Similarity check and prior-art queries before awarding originality."
    }
  ];
}

function renderRubricMemo(project) {
  const rows = buildRubricMemoRows(project)
    .map(
      (row) => `
        <article class="${escapeAttr(row.status)}">
          <div>
            <span>${escapeHtml(row.criterion)}</span>
            <strong>${escapeHtml(rubricLabel(row.status))}</strong>
          </div>
          <p>${escapeHtml(row.evidence)}</p>
          <small>${row.score}/100</small>
        </article>
      `
    )
    .join("");

  return `
    <section class="rubric-memo" aria-label="lablab judging rubric memo">
      <div class="module-head compact">
        <h3>Rubric memo</h3>
        <span class="hint">Application, presentation, business value, originality.</span>
      </div>
      <div class="rubric-grid">${rows}</div>
    </section>
  `;
}

function renderPrizeBrief(project) {
  const brief = buildPrizeBrief(project, { totalProjects: state.projects.length });
  const lanes = brief.lanes
    .map(
      (lane) => `
        <article class="prize-lane">
          <span>${escapeHtml(lane.label)}</span>
          <strong>${escapeHtml(lane.status)}</strong>
          <p>${escapeHtml(lane.detail)}</p>
        </article>
      `
    )
    .join("");
  const fieldPressure = brief.fieldPressure
    .map(
      (item) => `
        <li>
          <span>${escapeHtml(item.label)}</span>
          <p>${escapeHtml(item.detail)}</p>
        </li>
      `
    )
    .join("");
  const actions = brief.actions
    .map((item, index) => {
      const className = index === 0 ? "primary-button small" : "secondary-button small";
      return `<button class="${className}" data-score-action="${escapeAttr(item.action)}" type="button">${escapeHtml(item.label)}</button>`;
    })
    .join("");

  return `
    <section class="prize-brief" aria-label="Prize brief">
      <div class="prize-brief-head">
        <div>
          <span>${escapeHtml(brief.badge)}</span>
          <h3>${escapeHtml(brief.title)}</h3>
          <p>${escapeHtml(brief.summary)}</p>
        </div>
        <div class="prize-actions">${actions}</div>
      </div>
      <div class="prize-lanes">${lanes}</div>
      <ul class="prize-pressure">${fieldPressure}</ul>
    </section>
  `;
}

function renderScorecard(project) {
  const reviewFocus = project.reviewFocus || selectedReviewFocus();
  const readiness = buildReadiness(project, readinessContext());
  const draft = isDraftProject(project);
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
  const scoreLabel = draft ? "Draft review" : hasPendingFinalSubmission(project) ? "Review result" : "Evidence-based score";
  const scoreValue = draft ? "Not scored" : hasPendingFinalSubmission(project) ? "Ready" : project.scores.overall;
  const scoreDetail = draft
    ? "Run public review for ranking"
    : hasPendingFinalSubmission(project)
    ? `Bright Data evidence attached`
    : `Bright Data fit: ${project.scores.brightDataPrize}`;
  const runReceipt = project.runReceipt || {};
  const sponsorProofReady = hasBrightDataSponsorProofBundle(project);
  const sponsorToolLabel = sponsorProofReady ? "Source + search + discovery" : "Source, search, and discovery needed";
  const replayState = state.mode === "live" ? (hasReviewToken() ? "reviewer access ready" : "reviewer token needed") : "server-side backend";

  elements.scorecard.innerHTML = `
    <section class="focus-strip">
      <div class="focus-copy">
        <span class="verdict-pill ${statusClass(project)}">${escapeHtml(verdictLabel)}</span>
        <h2>${escapeHtml(project.title)}</h2>
        <p>${escapeHtml(compactSentence(project.summary))}</p>
        <div class="tag-row">${tags}</div>
      </div>
      <div class="score-block ${draft || hasPendingFinalSubmission(project) ? "is-proof-status" : ""}" aria-label="${escapeAttr(scoreLabel)} ${scoreValue}">
        <span>${escapeHtml(scoreLabel)}</span>
        <strong>${scoreValue}</strong>
        <small>${escapeHtml(scoreDetail)}</small>
        <button class="score-help" data-score-action="score-help" type="button">Why this score?</button>
      </div>
    </section>

    <section class="source-links" aria-label="Attached sources">
      ${renderSourceLinks(project)}
    </section>

    ${renderJudgeMemoCard(project, readiness)}

    ${renderPrizeBrief(project)}

    ${renderActionBoard(project, readiness)}

    ${renderDraftReviewCard(project)}

    ${renderVisitorBrief(project)}

    ${draft ? "" : `<details class="analysis-drawer decision-details">
      <summary><span>Review evidence details</span><strong>${escapeHtml(sponsorProofReady ? "Bright Data ready" : "Needs evidence")}</strong></summary>
      ${renderRubricMemo(project)}
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
          <span>Review ID</span>
          <strong>${escapeHtml(runReceipt.runId || "No saved review yet")}</strong>
          <p>${escapeHtml(runReceipt.traceDigest ? `${runReceipt.signature ? "Saved review attached" : "Saved review pending"} live run record` : "Live collection has not produced a report yet.")}</p>
        </article>
        <article>
          <span>Live rerun</span>
          <strong>${escapeHtml(replayState)}</strong>
          <p>Sponsor review runs server-side so Bright Data secrets stay off the page.</p>
        </article>
      </section>
      ${renderPitchReviewPanel()}
      ${renderFieldComparison()}
    </details>`}

    ${draft ? "" : `<details class="analysis-drawer score-drawer">
      <summary><span>Score breakdown</span><strong>${project.scores.overall} overall</strong></summary>
      <section class="score-grid" aria-label="Score breakdown">
        ${scoreTile("Eligibility", project.scores.eligibility, "Demo, repo, build evidence")}
        ${scoreTile("Bright fit", project.scores.brightDataFit, "Live web is load-bearing")}
        ${scoreTile("Bright prize", project.scores.brightDataPrize, "Reviewer-access rank")}
        ${scoreTile("Business", project.scores.businessValue, "Clear user and urgency")}
        ${scoreTile("Originality", project.scores.originality, "Distinct angle and evidence")}
        ${scoreTile("Presentation", project.scores.presentation, "Judge-ready explanation")}
      </section>
    </details>`}

    ${draft ? "" : `<details class="analysis-drawer">
      <summary><span>Bright Data prize</span><strong>${project.scores.brightDataPrize}</strong></summary>
      ${renderWinnerBenchmark(project)}
    </details>`}

    ${draft ? "" : `<details class="analysis-drawer">
      <summary><span>Review panel</span><strong>${escapeHtml(verdictLabel)}</strong></summary>
      ${renderTribunal(project)}
    </details>`}

    ${draft ? "" : `<details class="analysis-drawer">
      <summary><span>Similarity check</span><strong>${project.scores.originality}</strong></summary>
      ${renderOriginalityRadar(project)}
    </details>`}

    ${draft ? "" : `<details class="analysis-drawer">
      <summary><span>Claim check</span><strong>${(project.evidenceItems || []).length} items</strong></summary>
      ${renderClaimLedger(project)}
    </details>`}
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
      ? `${trace.resultCount || 0} result${trace.resultCount === 1 ? "" : "s"} / downloaded ${formatBytes(trace.byteCount || 0)}`
      : trace.status || traceStatus
  };
}

function formatBytes(bytes = 0) {
  const value = Number(bytes) || 0;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} bytes`;
}

function renderBrightDataBudget(project = {}) {
  const traces = project.brightDataTraces || [];
  const brightTraces = traces.filter((trace) => trace.provider === "bright-data");
  const sponsorTraces = brightTraces.filter((trace) => trace.countsForSponsorFit !== false);
  const executedSponsorTraces = sponsorTraces.filter((trace) => trace.traceStatus === "executed");
  const directTraces = traces.filter((trace) => trace.provider === "direct");
  const toolList = [...new Set(executedSponsorTraces.map((trace) => trace.tool).filter(Boolean))];
  const byteTotal = executedSponsorTraces.reduce((sum, trace) => sum + Number(trace.byteCount || 0), 0);
  const route = project.runReceipt?.collectionMode || (brightTraces.length ? "bright-data planned" : directTraces.length ? "direct public review" : "not run");
  const cap = 12;
  const callLabel = brightTraces.length
    ? `${executedSponsorTraces.length}/${sponsorTraces.length || brightTraces.length} sponsor-counting`
    : "0 sponsor-counting";
  const budgetLabel = brightTraces.length ? `${brightTraces.length}/${cap} call cap` : `0/${cap} call cap`;
  const toolLabel = toolList.length ? toolList.join(", ") : directTraces.length ? "direct public fetch only" : "source, search, discovery planned";

  return `
    <section class="trace-budget" aria-label="Bright Data route and budget">
      <div>
        <span>Route</span>
        <strong>${escapeHtml(route)}</strong>
      </div>
      <div>
        <span>Budget</span>
        <strong>${escapeHtml(budgetLabel)}</strong>
      </div>
      <div>
        <span>Prize calls</span>
        <strong>${escapeHtml(callLabel)}</strong>
      </div>
      <div>
        <span>Tools</span>
        <strong>${escapeHtml(toolLabel)}</strong>
      </div>
      <div>
        <span>Downloaded</span>
        <strong>${escapeHtml(formatBytes(byteTotal))}</strong>
      </div>
    </section>
  `;
}

function renderBrightDataTimeline(project) {
  const runReceipt = project.runReceipt || {};
  const source = traceStatusFor(project, (tool) => /scrape|source|markdown|scraper/i.test(tool));
  const search = traceStatusFor(project, (tool) => /search|serp/i.test(tool));
  const discover = traceStatusFor(project, (tool) => /discover/i.test(tool));
  const receipt = runReceipt.traceDigest
    ? {
        status: runReceipt.signature ? "passed" : "pending",
        detail: runReceipt.signature ? "saved review attached" : "saved review pending"
      }
    : { status: "missing", detail: "not saved yet" };
  const steps = [
    ["Source fetch", "Fetch public repo, demo, and submission evidence", source],
    ["Web search", "Find public overlap and corroboration", search],
    ["Similar-project discovery", "Rank adjacent public signals", discover],
    ["Saved review", "Package the run into an exportable memo", receipt]
  ];

  return `
    <section class="trace-timeline" aria-label="Bright Data run timeline">
      <div class="module-head compact">
        <h2>Evidence checks</h2>
        <span class="hint">What ProofRank fetched and what is still missing.</span>
      </div>
      <p class="judge-meaning">Bright Data gathers public source, search, and discovery evidence. ProofRank separates collected facts from project claims before exporting the reviewer memo.</p>
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

function renderReadinessEmpty() {
  elements.readinessSummary.innerHTML = `
    <strong>Waiting for a public project</strong>
    <span>Paste links first. ProofRank will then separate public checks from reviewer-access Bright Data evidence.</span>
    <small>0/4 first-run gates</small>
  `;
  elements.readinessMeter.style.setProperty("--bar-width", "0%");
  elements.readinessList.innerHTML = [
    ["GitHub repository", "Paste a public github.com/owner/repo URL."],
    ["Demo URL", "Optional, but a live app gives the reviewer stronger evidence."],
    ["Public review", "Fetch public repo and demo signals before ranking."],
    ["Bright Data evidence", "Upgrade with source, search, and discovery when reviewer access is available."]
  ]
    .map(
      ([label, detail]) => `
        <li class="pending">
          <span>Action</span>
          <strong>${escapeHtml(label)}</strong>
          <p>${escapeHtml(detail)}</p>
          <small>Not checked yet.</small>
        </li>
      `
    )
    .join("");
}

function renderEmptyReviewState(project = selectedProject()) {
  if (elements.fixListSummary) elements.fixListSummary.textContent = "Waiting for links";
  elements.fixListBody.innerHTML = `
    <section class="empty-review-state" aria-label="First review path">
      <div>
        <span>Start with your links</span>
        <strong>No selected project yet.</strong>
        <p>Paste a public GitHub repository above. ProofRank will create a memo with a decision, evidence gaps, and the Bright Data upgrade path.</p>
      </div>
      <ol>
        <li><strong>Paste</strong><span>GitHub repo and optional demo URL.</span></li>
        <li><strong>Review</strong><span>Run the public repo and demo check.</span></li>
        <li><strong>Verify</strong><span>Inspect evidence JSON in the receipt verifier.</span></li>
      </ol>
    </section>
  `;

  elements.scorecard.innerHTML = `
    <section class="empty-scorecard" aria-label="No selected review">
      <div>
        <span>Public test room</span>
        <h2>Paste a project to get a judge memo.</h2>
        <p>The first result is intentionally blank. Samples are available, but visitors should be able to test their own public project first.</p>
      </div>
      <div class="empty-action-row">
        <button class="primary-button small" data-score-action="focus" type="button">Paste links</button>
        <button class="secondary-button small" data-score-action="sample" type="button">Replay sample</button>
        <button class="secondary-button small" data-score-action="verify" type="button">Verify receipt</button>
      </div>
    </section>
  `;

  elements.proofTopology.innerHTML = `
    <div class="module-head proof-head">
      <div>
        <h2>Review path</h2>
        <p class="hint">The selected project path appears after a visitor runs or opens a review.</p>
      </div>
      <span class="route-verdict pending">Not started</span>
    </div>
    <ol class="route-map empty-route">
      ${["Paste links", "Public check", "Bright Data evidence", "Export memo"]
        .map(
          (label) => `
            <li class="route-node missing">
              <span>Action</span>
              <strong>${escapeHtml(label)}</strong>
              <p>${label === "Bright Data evidence" ? "Reviewer-access source, search, and discovery." : "Waiting for visitor input."}</p>
            </li>
          `
        )
        .join("")}
    </ol>
  `;

  elements.receipt.innerHTML = `
    ${renderReceiptVerifier(project, { empty: true })}
    <section class="empty-receipt" aria-label="No evidence selected">
      <span>No selected evidence yet</span>
      <strong>Exported ProofRank JSON can be checked here.</strong>
      <p>Load the sample receipt or paste an exported evidence record to confirm Bright Data traces, digest consistency, and claim support.</p>
    </section>
  `;

  renderReadinessEmpty();
}

function renderReceiptVerifier(project = selectedProject(), options = {}) {
  const result = state.receiptVerification;
  const resultRows = result
    ? result.checks
        .map(
          (item) => `
            <li class="${escapeAttr(item.status)}">
              <span>${escapeHtml(item.status === "passed" ? "Checked" : item.status === "notice" ? "Notice" : "Action")}</span>
              <strong>${escapeHtml(item.label)}</strong>
              <p>${escapeHtml(item.detail)}</p>
            </li>
          `
        )
        .join("")
    : "";
  const buttonLabel = options.empty ? "Load sample receipt" : "Load selected receipt";

  return `
    <section class="receipt-verifier" aria-label="Public receipt verifier">
      <div class="verifier-head">
        <div>
          <span>Receipt verifier</span>
          <h3>${escapeHtml(result?.title || "Check an exported evidence JSON.")}</h3>
          <p>${escapeHtml(
            result?.summary ||
              "Paste a ProofRank evidence record. Browser verification checks trace digest, Bright Data source/search/discovery coverage, and claim support."
          )}</p>
        </div>
        <strong class="${result ? (result.ok ? "passed" : "failed") : "notice"}">${escapeHtml(
          result ? (result.ok ? "Checks passed" : "Needs review") : "Paste JSON"
        )}</strong>
      </div>
      <label class="field compact" for="receiptVerifierInput">
        <span>Evidence JSON</span>
        <textarea id="receiptVerifierInput" rows="6" placeholder="Paste exported proofrank evidence JSON">${escapeHtml(state.receiptVerifierInput)}</textarea>
      </label>
      <div class="verifier-actions">
        <button class="primary-button small" data-receipt-action="verify" type="button">Verify JSON</button>
        <button class="secondary-button small" data-receipt-action="load-selected" type="button">${escapeHtml(buttonLabel)}</button>
        <button class="text-button small" data-receipt-action="clear" type="button">Clear</button>
      </div>
      ${result ? `<ul class="verifier-checks">${resultRows}</ul>` : ""}
      <p class="verifier-note">Saved review format can be checked in the browser. Full validation stays server-side because signing secrets must not be pasted into a public page.</p>
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
        <td data-label="Status">${escapeHtml(`${trace.status}${trace.byteCount ? ` / downloaded ${formatBytes(trace.byteCount)} / hash ${trace.contentHash}` : ""}`)}</td>
      </tr>
    `
    )
    .join("");

  const livePlan = buildMcpQueries(elements.eventUrl.value || EVENT_URL, project)
    .map((query) => `<li><strong>${escapeHtml(query.tool)}</strong><span>${escapeHtml(query.query || query.intent || query.url || query.purpose)}</span></li>`)
    .join("");

  elements.receipt.innerHTML = `
    ${renderReceiptVerifier(project)}

    ${renderFlightRecorder(project)}

    ${renderBrightDataBudget(project)}

    ${renderBrightDataTimeline(project)}

    <div class="run-receipt ${runReceipt ? "is-issued" : "is-empty"}">
      <span>Review run</span>
      <strong>${escapeHtml(runReceipt?.runId || "No saved review yet")}</strong>
      <small>${escapeHtml(runReceipt?.traceDigest ? `${runReceipt.collectionMode} / ${runReceipt.signature ? "saved review attached" : "saved review pending"}` : "No saved review has been created for this project yet.")}</small>
    </div>

    <div class="receipt-list">
      ${receiptItems || `<div class="empty-state">No evidence items available.</div>`}
    </div>

    <details class="receipt-drawer">
      <summary>Audit details</summary>
      <table class="trace-table" aria-label="Bright Data source details">
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
          ${traces || `<tr><td colspan="5" data-label="Source detail">No Bright Data source detail visible yet.</td></tr>`}
        </tbody>
      </table>
    </details>

    <details class="receipt-drawer">
      <summary>Live collection plan</summary>
      <div class="receipt-item live-plan">
        <h3>Planned collector calls</h3>
        <p>${state.mode === "live" ? "Sponsor review runs on the server-side backend; tokens never belong in the browser." : "Public and draft review mirror these collection steps without using Bright Data credentials."}</p>
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

function renderReviewCoach(project = selectedProject()) {
  if (!elements.reviewCoach) return;
  const coach = buildReviewCoach(project, {
    reviewStarted: state.reviewStarted,
    currentMode: state.mode,
    reviewFocus: selectedReviewFocus()
  });
  const checkpoints = coach.checkpoints
    .map(
      (item) => `
        <li class="${escapeAttr(item.state)}">
          <span>${escapeHtml(item.state === "ready" ? "Ready" : "Pending")}</span>
          <strong>${escapeHtml(item.label)}</strong>
          <small>${escapeHtml(item.detail)}</small>
        </li>
      `
    )
    .join("");
  const primary = coach.primary
    ? `<button class="secondary-button small" data-coach-action="${escapeAttr(coach.primary.action)}" type="button">${escapeHtml(coach.primary.label)}</button>`
    : "";
  const secondary = coach.secondary
    ? `<button class="text-button small" data-coach-action="${escapeAttr(coach.secondary.action)}" type="button">${escapeHtml(coach.secondary.label)}</button>`
    : "";
  const checkpointList = checkpoints ? `<ul class="review-coach-checks">${checkpoints}</ul>` : "";

  elements.reviewCoach.innerHTML = `
    <div class="review-coach-head">
      <span>${escapeHtml(coach.badge)}</span>
      <strong>${escapeHtml(coach.title)}</strong>
      <p>${escapeHtml(coach.body)}</p>
    </div>
    <div class="review-coach-actions">${primary}${secondary}</div>
    ${checkpointList}
  `;
}

function renderFlightRecorder(project = selectedProject(), options = {}) {
  const recorder = buildFlightRecorder(project);
  const compact = options.compact === true;
  const stages = recorder.stages
    .map(
      (stage) => `
        <li class="${escapeAttr(stage.state)}">
          <span>${escapeHtml(stage.label)}</span>
          <strong>${escapeHtml(stage.state)}</strong>
          <small>${escapeHtml(compact ? stage.tool : `${stage.tool}: ${stage.detail}`)}</small>
        </li>
      `
    )
    .join("");

  return `
    <section class="flight-recorder ${compact ? "compact" : ""}" aria-label="Bright Data flight recorder">
      <div class="flight-recorder-head">
        <div>
          <span>${escapeHtml(recorder.badge)}</span>
          <h3>${escapeHtml(recorder.sponsorEvidence === "ready" ? "Sponsor evidence attached" : recorder.sponsorEvidence === "gated" ? "Sponsor evidence gated" : "Sponsor evidence not run")}</h3>
          <p>${escapeHtml(recorder.digest)}</p>
        </div>
        <strong>${escapeHtml(recorder.sponsorEvidence)}</strong>
      </div>
      <div class="flight-recorder-freshness ${escapeAttr(recorder.freshness.state)}">
        <span>Freshness</span>
        <strong>${escapeHtml(recorder.freshness.label)}</strong>
        <small>${escapeHtml(recorder.freshness.detail)}</small>
      </div>
      <ol class="flight-recorder-stages">${stages}</ol>
    </section>
  `;
}

function render() {
  const project = selectedProject();
  const showHeroEvidence = hasActiveReview(project);
  const selectionDrawer = document.querySelector(".selection-drawer");
  updateRunProfile();
  updateLiveProofStrip(project);
  renderReviewCoach(project);
  renderOutcomePreview(project);
  if (selectionDrawer) selectionDrawer.hidden = !showHeroEvidence;
  if (elements.topbarProjects) elements.topbarProjects.hidden = !showHeroEvidence;
  if (elements.topbarExportMenu) elements.topbarExportMenu.hidden = !showHeroEvidence;
  if (showHeroEvidence) {
    if (elements.flightRecorderHero) elements.flightRecorderHero.innerHTML = renderFlightRecorder(project, { compact: true });
    renderHeroDecision(project);
  } else {
    if (elements.flightRecorderHero) elements.flightRecorderHero.innerHTML = "";
    if (elements.heroDecision) elements.heroDecision.innerHTML = "";
    if (elements.readinessSummary) elements.readinessSummary.innerHTML = "";
    if (elements.readinessMeter) elements.readinessMeter.style.setProperty("--bar-width", "0%");
  }
  if (showHeroEvidence) {
    renderProofTopology(project);
    renderFixList(project);
    renderScorecard(project);
    renderReceipt(project);
    renderReadiness(project);
  } else {
    renderEmptyReviewState(project);
  }
  renderRankedList();
  renderSponsorMatrix();
  renderFieldMap();
  renderReviewRoom();
}

function liveEventEndpoint() {
  const endpoint = elements.liveApiUrl.value.trim();
  if (!isHttpUrl(endpoint)) throw new Error("A review API endpoint is required.");
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
      setStatus(`Review API missing. Draft review remains available. ${checklist}`, "warn");
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
        state.reviewStarted = true;
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
          ? `${liveProjects.length} live submissions collected and one project-level review completed. Check the selected Evidence view for Bright Data status.`
            : `${liveProjects.length} live submissions collected. Event intake is not a project review; review a GitHub project next for the Bright Data evidence run.`,
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
    state.reviewStarted = true;

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
    state.reviewStarted = true;
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
      `${payload.reviewFocus.label} draft review. ProofRank can inspect the repository, deployed app, submission copy, and public web evidence once a public check or server-side Bright Data evidence run finishes.`,
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
          `Repository accepted locally. ${payload.reviewFocus.action} Run server-side collection to fetch README, recent commits, demo links, dependency evidence, and public originality signals.`,
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
  const endpoint = reviewEndpointForMode();
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

  if (state.mode === "demo" && isVerifiedSamplePayload(payload)) {
    selectVerifiedSampleReview(payload);
    return;
  }

  let project;
  let usedPublicFallback = false;
  elements.addReviewerProject.disabled = true;
  elements.quickAddReviewerProject.disabled = true;

  try {
    if (state.mode === "live" || state.mode === "public") {
      setStatus(
        state.mode === "live" ? "Collecting Bright Data repository and demo evidence." : "Collecting public repository and demo evidence.",
        "ready"
      );
      project = await collectReviewerProjectViaApi(payload);
    } else {
      project = reviewerProjectFromInputs();
    }
  } catch (error) {
    if (state.mode === "public") {
      project = reviewerProjectFromInputs();
      if (project) {
        usedPublicFallback = true;
        project.summary = `${payload.reviewFocus.label} draft saved after the public evidence service was unavailable. Run public review again to fetch repo and demo evidence.`;
        project.evidenceItems = [
          {
            ...(project.evidenceItems?.[0] || {}),
            title: "Public review fallback",
            excerpt: `Public evidence service was unavailable, so ProofRank saved a link-only draft instead. Retry public review when the service is reachable. Last error: ${displayText(
              error.message
            )}`,
            limitations: "No public GitHub, demo, or Bright Data evidence was fetched during the fallback."
          }
        ];
        elements.reviewerHint.textContent = "Public evidence service unavailable; draft saved instead.";
        setQuickHint("Public evidence service unavailable; saved a draft instead. Retry public review from the result card.", "warn");
        setStatus("Public evidence service unavailable; saved draft instead.", "warn");
      }
    } else {
      setStatus(error.message, "error");
      elements.reviewerHint.textContent = "Review failed. Check the endpoint or switch to Draft.";
      setQuickHint("Bright Data evidence run failed. Switch to Draft/Public review or retry with reviewer access.", "error");
      elements.addReviewerProject.disabled = false;
      elements.quickAddReviewerProject.disabled = false;
      return;
    }
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
    usedPublicFallback
      ? "Draft saved after public evidence service fallback. Retry public review when the service is reachable."
      : state.mode === "live"
      ? "Project collected with the Bright Data evidence backend. Inspect the evidence and saved review."
      : state.mode === "public"
        ? "Project collected with public repo/demo evidence. Run the Bright Data evidence run later for source, search, and discovery checks."
        : "Project added. Public review or a Bright Data evidence run can deepen this result.";
  setQuickHint(
    usedPublicFallback
      ? "Draft saved. No repo, demo, or Bright Data evidence was fetched; retry public review from the result card."
      : state.mode === "live"
      ? "Bright Data evidence collected. Open Bright Data receipt to inspect the saved review."
      : state.mode === "public"
        ? "Public evidence collected. Open Bright Data receipt to inspect the review, or run Bright Data evidence run for source, search, and discovery checks."
        : "Project added. Copy draft link lets another visitor open the same links. Public review collects real evidence.",
    usedPublicFallback ? "warn" : "ready"
  );
  setStatus(usedPublicFallback ? `${project.title} draft saved after public service fallback.` : `${project.title} added to the review queue.`, usedPublicFallback ? "warn" : "ready");
  state.reviewStarted = true;
  render();
  setActiveSection("overview", { scroll: true });
}

async function addQuickReviewerProject() {
  syncFullReviewFormFromQuick();
  const switchedFromLockedLive = state.mode === "live" && !hasReviewToken();
  if (switchedFromLockedLive) {
    setReviewMode(isLocalPreviewHost() ? "demo" : "public", { silent: true });
  }
  await addReviewerProject();
  if (switchedFromLockedLive) {
    if (isLocalPreviewHost()) {
      setQuickHint("Bright Data evidence run needs reviewer access. Local preview created a draft instead.", "warn");
      setStatus("Bright Data evidence run needs reviewer access. Draft review ran instead.", "warn");
    } else {
      setQuickHint("Bright Data evidence run needs reviewer access, so ProofRank ran the public evidence check instead.", "warn");
      setStatus("Bright Data evidence run needs reviewer access. Public review ran instead.", "warn");
    }
  }
}

async function handleCoachAction(action) {
  if (action === "focusRepo") {
    elements.quickRepoUrl.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => elements.quickRepoUrl.focus(), 160);
    setStatus("Paste a public GitHub repository to start.", "ready");
    return;
  }
  if (action === "sample") {
    loadSampleReviewLinks();
    return;
  }
  if (action === "public") {
    const project = selectedProject();
    if (project.githubUrl) {
      elements.quickRepoUrl.value = project.githubUrl;
      elements.quickDemoUrl.value = project.demoUrl || "";
    }
    setReviewMode("public", { silent: true });
    await addQuickReviewerProject();
    return;
  }
  if (action === "live") {
    setActiveSection("setup", { scroll: true });
    setReviewMode("live");
    window.setTimeout(() => elements.modeSelect?.focus(), 220);
    return;
  }
  if (action === "evidence") {
    setActiveSection("receipt", { scroll: true });
    setStatus("Evidence opened.", "ready");
    return;
  }
  if (action === "export") {
    exportSubmissionPacket();
    setStatus("Project memo export started.", "ready");
    return;
  }
  if (action === "copy") {
    if (selectedProject().githubUrl) await copySelectedProjectLink();
    else await copyReviewLink();
  }
}

function updateReviewerModeCopy() {
  if (state.mode === "live") {
    elements.addReviewerProject.textContent = REVIEW_MODES.live.addButton;
    elements.reviewerHint.textContent = hasReviewToken()
      ? "Reviewer access loaded for this session; Bright Data tokens stay server-side."
      : "Public visitors can create drafts or public reviews. Reviewer access unlocks Bright Data collection.";
  } else if (state.mode === "public") {
    elements.addReviewerProject.textContent = REVIEW_MODES.public.addButton;
    elements.reviewerHint.textContent = "Public review fetches public GitHub and common demo-host evidence without reviewer credentials.";
  } else {
    elements.addReviewerProject.textContent = REVIEW_MODES.demo.addButton;
    elements.reviewerHint.textContent = "Draft review works without credentials. Public review can fetch real public evidence next.";
  }
  syncReviewModeControls();
}

function initializeLiveEndpoint() {
  if (elements.liveApiUrl.value) return;
  const hostname = window.location.hostname.toLowerCase();
  if (isLocalPreviewHost()) {
    elements.liveApiUrl.value = "http://127.0.0.1:8787/api/review-project";
  } else if (hostname === "proofrank-ai-factory.vercel.app") {
    elements.liveApiUrl.value = hasReviewToken() ? PRIVATE_REVIEW_API_URL : PUBLIC_DIRECT_REVIEW_API_URL;
  } else if (hostname.endsWith("nativelyai.app") && hasReviewToken()) {
    elements.liveApiUrl.value = PRIVATE_REVIEW_API_URL;
  } else {
    elements.liveApiUrl.value = PUBLIC_DIRECT_REVIEW_API_URL;
  }
}

function initializeReviewMode() {
  if (hasReviewToken()) {
    setReviewMode("live", { silent: true });
  } else {
    setReviewMode("public", { silent: true });
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
  setReviewMode(elements.modeSelect.value);
});
elements.quickModeButtons.forEach((button) => {
  button.addEventListener("click", () => setReviewMode(button.dataset.quickMode));
});

elements.liveApiUrl.addEventListener("input", () => renderReadiness(selectedProject()));
elements.runAudit.addEventListener("click", runAudit);
elements.htmlUpload.addEventListener("change", (event) => handleUpload(event.target.files[0]));
elements.addReviewerProject.addEventListener("click", addReviewerProject);
elements.loadPitchSample?.addEventListener("click", loadPitchSample);
elements.analyzePitch?.addEventListener("click", analyzePitchTranscript);
elements.quickAddReviewerProject.addEventListener("click", addQuickReviewerProject);
elements.reviewCoach?.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-coach-action]")?.dataset.coachAction;
  if (action) await handleCoachAction(action);
});
elements.loadSampleProject.addEventListener("click", loadSampleReviewLinks);
elements.sampleReplayButtons.forEach((button) => {
  button.addEventListener("click", loadSampleReviewLinks);
});
elements.loadExternalSample?.addEventListener("click", selectExternalSampleReview);
elements.copyReviewLink?.addEventListener("click", copyReviewLink);
elements.copyAppLink?.addEventListener("click", copyAppLink);
elements.copyAppLinkHero?.addEventListener("click", copyAppLink);
elements.openIntroReceipt?.addEventListener("click", openIntroReceipt);
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
  if (action === "focus") {
    elements.quickRepoUrl.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => elements.quickRepoUrl.focus(), 160);
    setStatus("Paste a public GitHub repository to start.", "ready");
  } else if (action === "sample") {
    loadSampleReviewLinks();
  } else if (action === "verify") {
    setActiveSection("receipt", { scroll: true });
    setStatus("Receipt verifier opened. Paste evidence JSON or load the sample receipt.", "ready");
  } else if (action === "evidence") {
    setActiveSection("receipt", { scroll: true });
    setStatus("Evidence opened.", "ready");
  } else if (action === "score-help") {
    setActiveSection("queue", { scroll: true });
    setStatus("Score rationale opened. Compare evidence checklist and category map.", "ready");
  } else if (action === "public") {
    const project = selectedProject();
    if (project.githubUrl) {
      elements.quickRepoUrl.value = project.githubUrl;
      elements.quickDemoUrl.value = project.demoUrl || "";
      syncFullReviewFormFromQuick();
      setReviewMode("public", { silent: true });
      await addReviewerProject();
    } else {
      setStatus("Selected project has no GitHub URL for public review.", "error");
    }
  } else if (action === "live") {
    setActiveSection("setup", { scroll: true });
    window.setTimeout(() => elements.modeSelect?.focus(), 220);
    setStatus("Readiness opened. Use reviewer access for the Bright Data evidence run.", "ready");
  } else if (action === "export") {
    exportSubmissionPacket();
    setStatus("Project memo export started.", "ready");
  } else if (action === "copy") {
    await copySelectedProjectLink();
  } else if (action === "copy-card") {
    await copySelectedReviewCard();
  }
});
elements.receipt?.addEventListener("input", (event) => {
  if (event.target?.id === "receiptVerifierInput") {
    state.receiptVerifierInput = event.target.value;
  }
});
elements.receipt?.addEventListener("click", (event) => {
  const action = event.target.closest("[data-receipt-action]")?.dataset.receiptAction;
  if (!action) return;
  if (action === "verify") verifyReceiptInput();
  else if (action === "load-selected") loadSelectedReceiptIntoVerifier();
  else if (action === "clear") clearReceiptVerifier();
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
elements.quickRepoUrl.addEventListener("input", () => {
  setCopyReviewLinkState();
  renderOutcomePreview(selectedProject());
});
elements.quickDemoUrl.addEventListener("input", () => {
  setCopyReviewLinkState();
  renderOutcomePreview(selectedProject());
});

elements.exportCsv.addEventListener("click", () => {
  downloadText("proofrank-judge-queue.csv", toCsv(state.projects), "text/csv");
});

elements.exportReceipts.addEventListener("click", () => {
  downloadJson("proofrank-all-evidence-records.json", state.projects.map((project) => buildReceipt(project, state.projects)));
});

elements.exportSelected.addEventListener("click", () => {
  downloadJson(`${selectedProject().id}-evidence-record.json`, buildReceipt(selectedProject(), state.projects));
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
initializeReviewMode();
const shouldAutorunReview = loadReviewParamsFromUrl();
updateReviewerModeCopy();
setActiveSection(state.activeSection);
render();
setCopyReviewLinkState();
if (shouldAutorunReview) window.setTimeout(addQuickReviewerProject, 120);
