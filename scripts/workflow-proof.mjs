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
  await page.waitForSelector("#rankedList .project-row", { state: "attached", timeout: 5000 });
  await page.click('[data-section-tab="setup"]');
  await page.click("#runAudit");
  await page.waitForFunction(() => (document.querySelector("#statusLine")?.textContent || "").includes("submissions ranked"));

  await page.click('[data-section-tab="setup"]');
  await page.fill("#reviewerRepoUrl", "https://github.com/Vishwa-docs/proofrank-ai-factory");
  await page.fill("#reviewerDemoUrl", "https://vishwa-docs.github.io/proofrank-ai-factory/");
  await page.click("#addReviewerProject");
  await page.waitForFunction(() => (document.querySelector("#scorecard .focus-strip h2")?.textContent || "").includes("ProofRank AI Factory"));
  await page.click('[data-section-tab="queue"]');
  await page.click('#rankedList [data-id="proofrank"]');
  await page.waitForFunction(() => (document.querySelector("#scorecard .focus-strip h2")?.textContent || "") === "ProofRank");

  await page.click('[data-section-tab="receipt"]');
  const selectedReceipt = await captureDownloadName(page, "#exportSelected");
  await page.locator(".export-menu summary").click();
  const packet = await captureDownloadName(page, "#exportPacket");
  await page.click('[data-section-tab="overview"]');
  await page.evaluate(() => {
    const exportMenu = document.querySelector(".export-menu");
    if (exportMenu) exportMenu.open = false;
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const proof = await page.evaluate(
    ({ selectedReceipt, packet, screenshotPath, durationMs }) => {
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
        statusLine: document.querySelector("#statusLine")?.textContent?.trim() || "",
        brightProof: document.querySelector("#liveProofStrip")?.textContent?.replace(/\s+/g, " ").trim() || "",
        scorecardText: document.querySelector("#scorecard")?.textContent?.replace(/\s+/g, " ").slice(0, 600).trim() || "",
        receiptText: document.querySelector("#receipt")?.textContent?.replace(/\s+/g, " ").slice(0, 600).trim() || "",
        readinessItems,
        exportedFiles: [selectedReceipt, packet],
        screenshotPath,
        consoleMessages: []
      };
    },
    {
      selectedReceipt,
      packet,
      screenshotPath,
      durationMs: Date.now() - startedAt
    }
  );

  proof.consoleMessages = messages;
  proof.ok =
    proof.appTitle === "ProofRank" &&
    proof.selectedProject === "ProofRank" &&
    proof.rankedRows >= 8 &&
    proof.reviewerRowPresent === true &&
    /Bright Data proof passed|executed/i.test(proof.brightProof) &&
    proof.exportedFiles.length === 2 &&
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
