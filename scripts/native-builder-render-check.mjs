import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetDir = path.join(root, "submission", "demo-assets");
const outputPath = path.join(root, "submission", "native-builder-render-check.json");
const playwrightPackage =
  process.env.PLAYWRIGHT_PACKAGE_JSON ||
  "/Users/daver/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json";
const chromePath =
  process.env.CHROME_EXECUTABLE ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl =
  process.env.PROOFRANK_NATIVE_BUILDER_URL ||
  process.env.NATIVE_BUILDER_APP_URL ||
  "https://80wmf4jpjww3g4j6wcymx9m8t.nativelyai.app/";
const checkedAt = new Date();
const url = new URL(baseUrl);
url.searchParams.set("verify", String(checkedAt.getTime()));

async function expectedReceiptRunId() {
  try {
    const receipt = JSON.parse(await readFile(path.join(root, "submission", "final-brightdata-receipt.json"), "utf8"));
    return receipt.runReceipt?.runId || receipt.project?.runReceipt?.runId || "";
  } catch {
    return "";
  }
}

const expectedRunId = await expectedReceiptRunId();
const wantedInPage = [
  "ProofRank",
  "Submission-ready",
  "Bright Data proof passed",
  "Bright Data",
  "Overall audit",
  expectedRunId
].filter(Boolean);
const wantedInViewport = ["ProofRank", "Run review", "Proof receipt", "Bright Data", "Submission-ready"];
const forbiddenStrings = [
  "WIN",
  "Strong Pass",
  "Finalist-ready",
  "Sponsor bundle executed",
  "pr-20260807t145909828z-553fb028",
  "Demo Evidence",
  "AUDIT CONTROLS",
  "REVIEWER INTAKE",
  "Submission URL",
  "Ranked Queue",
  "Submission Cockpit",
  "AgentArena"
];

const require = createRequire(`file://${playwrightPackage}`);
const { chromium } = require("playwright");

function screenshotName(viewportName) {
  return viewportName === "desktop" ? "native-builder-desktop.png" : "native-builder-mobile-320.png";
}

async function visibleText(page) {
  return page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const chunks = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const value = node.nodeValue.replace(/\s+/g, " ").trim();
      if (!value) continue;
      const parent = node.parentElement;
      if (!parent) continue;
      const style = window.getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
      const rect = parent.getBoundingClientRect();
      const intersects =
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <= window.innerHeight &&
        rect.left <= window.innerWidth;
      if (intersects) chunks.push(value);
    }
    return chunks.join(" ");
  });
}

await mkdir(assetDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath
});

const results = [];
let title = "";
let publishedBundle = "";

try {
  for (const spec of [
    { name: "desktop", width: 1440, height: 950 },
    { name: "mobile-320", width: 320, height: 740 }
  ]) {
    const page = await browser.newPage({
      viewport: { width: spec.width, height: spec.height },
      deviceScaleFactor: 1
    });
    const messages = [];
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) messages.push(`${message.type()}: ${message.text()}`);
    });
    page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));

    await page.goto(url.toString(), { waitUntil: "networkidle" });
    await page.waitForSelector("body", { state: "attached", timeout: 10000 });
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo(0, 0));
    title ||= await page.title();
    publishedBundle ||=
      (await page
        .locator("script[src*='assets/']")
        .first()
        .getAttribute("src")
        .catch(() => "")) || "";

    const bodyText = await page.locator("body").innerText();
    const viewportText = await visibleText(page);
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    const screenshotPath = path.join(assetDir, screenshotName(spec.name));
    await page.screenshot({ path: screenshotPath, fullPage: false });

    results.push({
      name: spec.name,
      width: spec.width,
      height: spec.height,
      missingInPage: wantedInPage.filter((text) => !bodyText.includes(text)),
      missingInViewport: wantedInViewport.filter((text) => !viewportText.includes(text)),
      forbiddenInPage: forbiddenStrings.filter((text) => bodyText.includes(text)),
      forbiddenInViewport: forbiddenStrings.filter((text) => viewportText.includes(text)),
      scrollWidth: metrics.scrollWidth,
      clientWidth: metrics.clientWidth,
      horizontalOverflow: metrics.scrollWidth > metrics.clientWidth + 1,
      consoleMessages: messages
    });

    await page.close();
  }
} finally {
  await browser.close();
}

const report = {
  checkedAt: checkedAt.toISOString(),
  url: baseUrl,
  verifiedUrl: url.toString(),
  title,
  publishedBundle,
  screenshots: {
    desktop: "submission/demo-assets/native-builder-desktop.png",
    mobile320: "submission/demo-assets/native-builder-mobile-320.png"
  },
  viewports: results,
  wantedInPage,
  wantedInViewport,
  forbiddenStrings,
  cacheNote:
    "The verifiedUrl appends a cache-busting query because Safari previously showed a stale pre-publish bundle in an existing tab.",
  ok: results.every(
    (viewport) =>
      !viewport.horizontalOverflow &&
      viewport.missingInPage.length === 0 &&
      viewport.missingInViewport.length === 0 &&
      viewport.forbiddenInPage.length === 0 &&
      viewport.forbiddenInViewport.length === 0 &&
      viewport.consoleMessages.length === 0
  )
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ok: report.ok, outputPath, verifiedUrl: report.verifiedUrl }, null, 2));
if (!report.ok) process.exitCode = 1;
