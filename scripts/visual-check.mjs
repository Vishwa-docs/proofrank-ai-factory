import { createRequire } from "node:module";
import path from "node:path";

const playwrightPackage =
  process.env.PLAYWRIGHT_PACKAGE_JSON ||
  "/Users/daver/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json";
const chromePath =
  process.env.CHROME_EXECUTABLE ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const targetUrl = process.env.PROOFRANK_URL || "http://127.0.0.1:4283/";

const require = createRequire(`file://${playwrightPackage}`);
const { chromium } = require("playwright");

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath
});

const results = [];

for (const spec of [
  { name: "desktop", width: 1440, height: 950 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-414", width: 414, height: 896 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-320", width: 320, height: 740 }
]) {
  const page = await browser.newPage({
    viewport: { width: spec.width, height: spec.height },
    deviceScaleFactor: 1
  });
  const messages = [];

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      messages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));

  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await page.waitForSelector("#rankedList .project-row", { state: "attached", timeout: 5000 });

  if (spec.name === "desktop") {
    await page.click('.topbar [data-focus-target="quickRepoUrl"]');
    await page.waitForTimeout(300);
    const focusedReviewTarget = await page.evaluate(() => document.activeElement?.id === "quickRepoUrl");
    if (!focusedReviewTarget) {
      throw new Error("Topbar Review target did not focus the hero GitHub repository field.");
    }
    await page.click("#startTourTop");
    await page.waitForTimeout(250);
    const tourVisible = await page.evaluate(() => {
      const tour = document.querySelector("#guidedTour");
      const repo = document.querySelector("#quickRepoUrl");
      return Boolean(tour && !tour.hidden && repo?.classList.contains("is-tour-target"));
    });
    if (!tourVisible) {
      throw new Error("Guided review did not open beside the repo field with a visible highlight.");
    }
    await page.click("#tourClose");
    await page.fill("#quickRepoUrl", "https://example.com/github.com/fake/project");
    await page.fill("#quickDemoUrl", "https://vishwa-docs.github.io/proofrank-ai-factory/");
    await page.click("#quickAddReviewerProject");
    await page.waitForTimeout(200);
    const fakeRepoRejected = await page.evaluate(() => {
      const status = document.querySelector("#statusLine")?.textContent || "";
      return /public GitHub repository URL/i.test(status) && !document.querySelector('#rankedList [data-id^="review-example"]');
    });
    if (!fakeRepoRejected) {
      throw new Error("Fake GitHub host was accepted by the hero review form.");
    }
    await page.fill("#quickRepoUrl", "https://github.com/Vishwa-docs/proofrank-ai-factory");
    await page.fill("#quickDemoUrl", "https://vishwa-docs.github.io/proofrank-ai-factory/");
    await page.click("#quickAddReviewerProject");
    await page.waitForTimeout(200);
    await page.click('[data-section-tab="queue"]');
    await page.click('#rankedList [data-id="proofrank"]');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
  }

  const metrics = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const panels = [...document.querySelectorAll(".panel, .filter-bar, .topbar")];
    const offscreenPanels = panels.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > html.clientWidth + 1;
    });

    return {
      title: document.title,
      rows: document.querySelectorAll(".project-row").length,
      selectedTitle: document.querySelector("#scorecard .focus-strip h2")?.textContent || "",
      routeNodes: document.querySelectorAll("#proofTopology .route-node").length,
      winnerBenchmarkCount: document.querySelectorAll(".winner-benchmark").length,
      readinessCount: document.querySelectorAll("#readinessList li").length,
      reviewerRowPresent: Boolean(document.querySelector('#rankedList [data-id^="review-"]')),
      scrollWidth: html.scrollWidth,
      clientWidth: html.clientWidth,
      horizontalOverflow: html.scrollWidth > html.clientWidth + 1,
      bodyHeight: Math.max(body.scrollHeight, html.scrollHeight),
      offscreenPanels: offscreenPanels.length
    };
  });

  const screenshotPath = path.join("/tmp", `proofrank-${spec.name}-redesign.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  results.push({ spec, metrics, messages, screenshotPath });
  await page.close();
}

await browser.close();

const failures = results.flatMap((result) => {
  const problems = [];
  if (result.messages.length) problems.push(`${result.spec.name}: console/page messages`);
  if (result.metrics.rows < 1) problems.push(`${result.spec.name}: no ranked rows rendered`);
  if (result.metrics.routeNodes !== 6) problems.push(`${result.spec.name}: proof route did not render`);
  if (result.metrics.winnerBenchmarkCount !== 1) problems.push(`${result.spec.name}: winner benchmark did not render`);
  if (result.metrics.horizontalOverflow) problems.push(`${result.spec.name}: horizontal overflow`);
  if (result.metrics.offscreenPanels) problems.push(`${result.spec.name}: offscreen panels`);
  if (result.spec.name === "desktop" && !result.metrics.reviewerRowPresent) {
    problems.push("desktop: reviewer project did not remain in queue");
  }
  return problems;
});

console.log(JSON.stringify(results, null, 2));

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
