import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "app");
const outputDir = path.join(root, "submission");
const assetDir = path.join(outputDir, "demo-assets");
const proofPath = path.join(outputDir, "workflow-proof.json");
const screenshotPath = path.join(assetDir, "workflow-proof.png");
const playwrightPackage =
  process.env.PLAYWRIGHT_PACKAGE_JSON ||
  "/Users/daver/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json";
const chromePath =
  process.env.CHROME_EXECUTABLE ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const require = createRequire(`file://${playwrightPackage}`);
const { chromium } = require("playwright");

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"]
]);

function safePath(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, "http://127.0.0.1").pathname);
  const normalized = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const target = path.join(appDir, normalized === "/" ? "index.html" : normalized);
  return target.startsWith(appDir) ? target : path.join(appDir, "index.html");
}

function createStaticServer() {
  return createServer((request, response) => {
    const target = safePath(request.url || "/");
    const filePath = existsSync(target) ? target : path.join(appDir, "index.html");
    response.writeHead(200, {
      "content-type": mimeTypes.get(path.extname(filePath)) || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function captureDownloadName(page, selector) {
  const [download] = await Promise.all([page.waitForEvent("download"), page.click(selector)]);
  return download.suggestedFilename();
}

await mkdir(assetDir, { recursive: true });

const server = createStaticServer();
const port = await listen(server);
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath
});

const startedAt = Date.now();
const messages = [];

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1,
    acceptDownloads: true
  });

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      messages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__proofrankCopiedText = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__proofrankCopiedText = String(text);
        }
      }
    });
  });
  await page.waitForSelector("#rankedList .project-row", { state: "attached", timeout: 5000 });
  await page.click('[data-section-tab="setup"]');
  await page.click("#runAudit");
  await page.waitForFunction(() => (document.querySelector("#statusLine")?.textContent || "").includes("submissions ranked"));
  await page.click("#pitchCheckDrawer summary");
  await page.click("#loadPitchSample");
  await page.click("#analyzePitch");
  await page.waitForFunction(() => document.querySelectorAll(".pitch-review-rows li").length === 7);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click("[data-load-sample]");
  await page.waitForFunction(() => (document.querySelector("#scorecard .focus-strip h2")?.textContent || "") === "ProofRank");
  await page.waitForFunction(() => /Bright Data evidence attached/i.test(document.querySelector("#liveProofStrip")?.textContent || ""));
  await page.click('[data-quick-mode="demo"]');
  await page.fill("#quickRepoUrl", "https://github.com/brightdata/brightdata-mcp");
  await page.fill("#quickDemoUrl", "https://brightdata.com/");
  await page.click("#quickAddReviewerProject");
  await page.waitForSelector('#rankedList [data-id="review-brightdata-brightdata-mcp"]', { state: "attached", timeout: 5000 });
  const draftReviewCard = await page.evaluate(() => {
    const card = document.querySelector(".draft-review-card");
    const brief = document.querySelector(".visitor-brief.draft");
    return {
      ready: Boolean(card && /Draft created/i.test(card.textContent || "") && /Not scored yet/i.test(card.textContent || "")),
      text: card?.textContent?.replace(/\s+/g, " ").trim() || "",
      briefReady: Boolean(
        brief &&
          /Draft review created/i.test(brief.textContent || "") &&
          /Source fetch, web search, and discovery are planned, not run yet/i.test(brief.textContent || "") &&
          /Run public review/i.test(brief.textContent || "")
      ),
      briefText: brief?.textContent?.replace(/\s+/g, " ").trim() || ""
    };
  });
  await page.click('[data-score-action="copy-card"]');
  await page.waitForFunction(() => /Draft review only/i.test(window.__proofrankCopiedText || ""));
  const copiedDraftCard = await page.evaluate(() => window.__proofrankCopiedText || "");
  await page.click('[data-section-tab="queue"]');
  await page.click('#rankedList [data-id="proofrank"]');
  await page.waitForFunction(() => (document.querySelector("#scorecard .focus-strip h2")?.textContent || "") === "ProofRank");

  await page.click('[data-section-tab="receipt"]');
  const selectedReceipt = await captureDownloadName(page, "#exportSelected");
  await page.locator(".export-menu summary").click();
  const packet = await captureDownloadName(page, "#exportPacket");
  const roomReport = await captureDownloadName(page, "#exportProgramReport");
  await page.click('[data-section-tab="overview"]');
  await page.evaluate(() => {
    const exportMenu = document.querySelector(".export-menu");
    if (exportMenu) exportMenu.open = false;
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const proof = await page.evaluate(
    ({ selectedReceipt, packet, roomReport, screenshotPath, durationMs, draftReviewCard, copiedDraftCard }) => {
      const readinessItems = [...document.querySelectorAll("#readinessList li")].map((item) => ({
        status: item.querySelector("span")?.textContent?.trim() || "",
        label: item.querySelector("strong")?.textContent?.trim() || "",
        detail: item.querySelector("p")?.textContent?.trim() || ""
      }));

      return {
        generatedAt: new Date().toISOString(),
        durationMs,
        appTitle: document.title,
        selectedProject: document.querySelector("#scorecard .focus-strip h2")?.textContent?.trim() || "",
        rankedRows: document.querySelectorAll(".project-row").length,
        reviewerRowPresent: Boolean(document.querySelector('#rankedList [data-id^="review-"]')),
        roomLinkReady: Boolean(document.querySelector("#copyAppLinkHero") && document.querySelector("#copyAppLink")),
        publicRoomNoteReady: /Public test room/i.test(document.querySelector(".public-room-note")?.textContent || ""),
        shareableReviewReady: (() => {
          const params = new URL(window.location.href).searchParams;
          return (
            !document.querySelector("#copyReviewLink")?.disabled &&
            params.get("reviewRepo") === "https://github.com/brightdata/brightdata-mcp" &&
            params.get("reviewDemo") === "https://brightdata.com/" &&
            params.get("reviewFocus") === "sponsor"
          );
        })(),
        reviewFocus: document.querySelector("[data-review-focus].is-active")?.textContent?.replace(/\s+/g, " ").trim() || "",
        draftReviewCardReadyBeforeReceipt: draftReviewCard.ready,
        draftReviewCardText: draftReviewCard.text,
        draftVisitorBriefReadyBeforeReceipt: draftReviewCard.briefReady,
        draftVisitorBriefText: draftReviewCard.briefText,
        copiedDraftCard,
        draftReviewCardGoneForReceipt: !document.querySelector(".draft-review-card"),
        evidenceVisitorBriefReady: Boolean(
          document.querySelector(".visitor-brief.evidence") &&
            /Evidence-backed review/i.test(document.querySelector(".visitor-brief.evidence")?.textContent || "") &&
            /source fetch, search, and discovery/i.test(document.querySelector(".visitor-brief.evidence")?.textContent || "")
        ),
        externalSampleReady: Boolean(document.querySelector("#loadExternalSample")),
        brightPathReady: document.querySelectorAll(".bright-path").length >= 2,
        sponsorMatrixRows: document.querySelectorAll("#sponsorMatrix .matrix-row").length,
        sponsorMatrixCells: document.querySelectorAll("#sponsorMatrix .matrix-cell").length,
        actionBoardCount: document.querySelectorAll(".action-board").length,
        actionButtonCount: document.querySelectorAll(".action-board [data-score-action]").length,
        prizeBriefCount: document.querySelectorAll(".prize-brief").length,
        prizeBriefLaneCount: document.querySelectorAll(".prize-brief .prize-lane").length,
        prizeBriefActionCount: document.querySelectorAll(".prize-brief [data-score-action]").length,
        prizeBriefText: document.querySelector(".prize-brief")?.textContent?.replace(/\s+/g, " ").slice(0, 500).trim() || "",
        fieldComparisonCount: document.querySelectorAll(".field-comparison article").length,
        pitchReviewReady: Boolean(document.querySelector(".pitch-review-panel")),
        pitchReviewRows: document.querySelectorAll(".pitch-review-rows li").length,
        pitchReviewText: document.querySelector(".pitch-review-panel")?.textContent?.replace(/\s+/g, " ").slice(0, 400).trim() || "",
        traceTimelineSteps: document.querySelectorAll(".trace-timeline li").length,
        modeLadderText: document.querySelector(".mode-ladder")?.textContent?.replace(/\s+/g, " ").trim() || "",
        statusLine: document.querySelector("#statusLine")?.textContent?.trim() || "",
        brightProof: document.querySelector("#liveProofStrip")?.textContent?.replace(/\s+/g, " ").trim() || "",
        scorecardText: document.querySelector("#scorecard")?.textContent?.replace(/\s+/g, " ").slice(0, 600).trim() || "",
        receiptText: document.querySelector("#receipt")?.textContent?.replace(/\s+/g, " ").slice(0, 600).trim() || "",
        forbiddenVisible: ["Signed proof", "Submission-ready", "Finalist-ready", "Overall 100", "Sponsor bundle executed"].filter((text) =>
          (document.body.innerText || "").includes(text)
        ),
        readinessItems,
        exportedFiles: [selectedReceipt, packet, roomReport],
        screenshotPath,
        consoleMessages: []
      };
    },
    {
      selectedReceipt,
      packet,
      roomReport,
      screenshotPath,
      durationMs: Date.now() - startedAt,
      draftReviewCard,
      copiedDraftCard
    }
  );

  proof.consoleMessages = messages;
  proof.ok =
    proof.appTitle === "ProofRank" &&
    proof.selectedProject === "ProofRank" &&
    proof.rankedRows >= 8 &&
    proof.reviewerRowPresent === true &&
    proof.roomLinkReady === true &&
    proof.publicRoomNoteReady === true &&
    proof.shareableReviewReady === true &&
    proof.draftReviewCardReadyBeforeReceipt === true &&
    proof.draftVisitorBriefReadyBeforeReceipt === true &&
    /Link-only draft/i.test(proof.draftVisitorBriefText) &&
    /repo content, demo reachability, functionality, and Bright Data evidence/i.test(proof.draftVisitorBriefText) &&
    /Source fetch, web search, and discovery are planned, not run yet/i.test(proof.draftVisitorBriefText) &&
    /Draft created/i.test(proof.draftReviewCardText) &&
    /Not scored yet/i.test(proof.draftReviewCardText) &&
    /Source fetch, web search, and discovery are planned, not run yet/i.test(proof.draftReviewCardText) &&
    /Draft review only/i.test(proof.copiedDraftCard) &&
    /no repo\/demo fetch|not fetched/i.test(proof.copiedDraftCard) &&
    /Bright Data evidence pending|no Bright Data evidence yet/i.test(proof.copiedDraftCard) &&
    !/verified|reachable|passed|certified|signed proof/i.test(proof.copiedDraftCard) &&
    proof.draftReviewCardGoneForReceipt === true &&
    proof.evidenceVisitorBriefReady === true &&
    /ProofRank sample result:\s*ProofRank/i.test(proof.brightProof) &&
    /Bright Data evidence attached/i.test(proof.brightProof) &&
    proof.externalSampleReady === true &&
    proof.brightPathReady === true &&
    proof.sponsorMatrixRows >= 1 &&
    proof.sponsorMatrixCells >= 6 &&
    proof.actionBoardCount === 1 &&
    proof.actionButtonCount >= 4 &&
    proof.prizeBriefCount === 1 &&
    proof.prizeBriefLaneCount === 3 &&
    proof.prizeBriefActionCount >= 3 &&
    /Bright Data prize case|Prize case gated|Link-only draft/i.test(proof.prizeBriefText) &&
    proof.fieldComparisonCount >= 5 &&
    proof.pitchReviewReady === true &&
    proof.pitchReviewRows === 7 &&
    /not video verification/i.test(proof.pitchReviewText) &&
    /Bright Data evidence status stays separate/i.test(proof.pitchReviewText) &&
    proof.traceTimelineSteps === 4 &&
    /Evidence checks/i.test(proof.receiptText) &&
    /Draft.*Public review.*ProofRank sample result/i.test(proof.modeLadderText) &&
    proof.exportedFiles.length === 3 &&
    proof.forbiddenVisible.length === 0 &&
    messages.length === 0;

  await writeFile(proofPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");

  if (!proof.ok) {
    console.error(JSON.stringify(proof, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ ok: true, proofPath, screenshotPath, exportedFiles: proof.exportedFiles }, null, 2));
  }
  await page.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
