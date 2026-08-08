import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "app");
const assetDir = path.join(root, "submission", "demo-assets");
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

async function capture(page, name, selector = "body") {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  await page.screenshot({
    path: path.join(assetDir, name),
    fullPage: false
  });
}

await mkdir(assetDir, { recursive: true });

const server = createStaticServer();
const port = await listen(server);
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath
});

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1
  });

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#rankedList .project-row", { state: "attached", timeout: 5000 });
  await page.route("https://proofrank-ai-factory.vercel.app/api/review-project-public", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Demo capture uses link-only fallback for deterministic recording." })
    })
  );

  await capture(page, "01-overview.png", ".workbench");
  await page.fill("#quickRepoUrl", "https://github.com/brightdata/brightdata-mcp");
  await page.fill("#quickDemoUrl", "https://brightdata.com/");
  await page.click("#quickAddReviewerProject");
  await page.waitForSelector(".draft-review-card", { state: "attached", timeout: 5000 });
  await capture(page, "02-draft-card.png", ".draft-review-card");
  await page.evaluate(() => {
    const drawer = document.querySelector("#reviewOptions");
    if (drawer && !drawer.open) drawer.open = true;
  });
  await page.waitForTimeout(120);
  await page.click("#loadSampleProject");
  await page.waitForFunction(() => (document.querySelector("#scorecard .focus-strip h2")?.textContent || "") === "ProofRank");
  await page.locator(".analysis-drawer summary", { hasText: "Claim check" }).click();
  await capture(page, "03-claim-ledger.png", ".claim-ledger");
  await page.click('[data-section-tab="receipt"]');
  await capture(page, "04-proof-receipt.png", ".evidence-rail");
  await page.click('[data-section-tab="setup"]');
  await page.locator("#modeSelect").selectOption("live");
  await page.waitForTimeout(180);
  await capture(page, "05-bright-data-live.png", ".source-rail");
  await page.click("#pitchCheckDrawer summary");
  await page.click("#loadPitchSample");
  await page.click("#analyzePitch");
  await page.waitForFunction(() => document.querySelectorAll(".pitch-review-rows li").length === 7);
  await page.locator(".analysis-drawer summary", { hasText: "Review evidence details" }).click();
  await page.waitForTimeout(700);
  await capture(page, "06-pitch-check.png", ".pitch-review-panel");
  await page.click('[data-section-tab="queue"]');
  await capture(page, "07-field-map.png", ".field-map");
  await page.locator(".export-menu summary").click();
  await capture(page, "08-exports-ready.png", ".topbar");
  await page.click('[data-section-tab="overview"]');
  await capture(page, "proofrank-demo-thumb.png", ".scorecard");

  await page.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log(`Captured demo assets in ${assetDir}`);
