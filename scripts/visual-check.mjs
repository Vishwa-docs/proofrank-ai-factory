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
    await page.click("#tourNext");
    await page.waitForTimeout(300);
    const tourStepTwo = await page.evaluate(() => {
      return (
        document.querySelector('[data-section-panel="overview"]')?.classList.contains("is-active") &&
        document.querySelector("#scorecard")?.classList.contains("is-tour-target")
      );
    });
    if (!tourStepTwo) {
      throw new Error("Guided review step 2 did not highlight the scorecard.");
    }
    await page.click("#tourNext");
    await page.waitForTimeout(300);
    const tourStepThree = await page.evaluate(() => {
      return (
        document.querySelector('[data-section-panel="queue"]')?.classList.contains("is-active") &&
        document.querySelector("#rankedList")?.classList.contains("is-tour-target")
      );
    });
    if (!tourStepThree) {
      throw new Error("Guided review step 3 did not switch to Projects and highlight the ranked list.");
    }
    await page.click("#tourNext");
    await page.waitForTimeout(300);
    const tourStepFour = await page.evaluate(() => {
      return (
        document.querySelector('[data-section-panel="receipt"]')?.classList.contains("is-active") &&
        document.querySelector("#receipt")?.classList.contains("is-tour-target")
      );
    });
    if (!tourStepFour) {
      throw new Error("Guided review step 4 did not switch to Evidence and highlight the receipt.");
    }
    await page.click("#tourNext");
    await page.waitForTimeout(300);
    const tourStepFive = await page.evaluate(() => {
      return (
        document.querySelector('[data-section-panel="setup"]')?.classList.contains("is-active") &&
        document.querySelector("#modeSelect")?.classList.contains("is-tour-target")
      );
    });
    if (!tourStepFive) {
      throw new Error("Guided review step 5 did not switch to Live setup and highlight review mode.");
    }
    await page.click("#tourClose");
    const firstStepControlsReady = await page.evaluate(() => {
      return (
        document.querySelectorAll("[data-review-focus]").length === 3 &&
        document.querySelectorAll("[data-starter-project]").length === 3 &&
        document.querySelectorAll(".mode-ladder span").length === 3
      );
    });
    if (!firstStepControlsReady) {
      throw new Error("Hero review lens, starter projects, or mode ladder did not render.");
    }
    await page.click('[data-review-focus="buyer"]');
    await page.waitForTimeout(100);
    const buyerFocusSelected = await page.evaluate(() => {
      return (
        document.querySelector('[data-review-focus="buyer"]')?.classList.contains("is-active") &&
        /Buyer lens/i.test(document.querySelector("#quickReviewHint")?.textContent || "")
      );
    });
    if (!buyerFocusSelected) {
      throw new Error("Review lens selector did not activate the buyer lens.");
    }
    await page.click('[data-starter-project="brightdata-mcp"]');
    await page.waitForTimeout(100);
    const starterLoaded = await page.evaluate(() => {
      return (
        document.querySelector("#quickRepoUrl")?.value === "https://github.com/brightdata/brightdata-mcp" &&
        document.querySelector("#quickDemoUrl")?.value === "" &&
        document.querySelector('[data-review-focus="sponsor"]')?.classList.contains("is-active")
      );
    });
    if (!starterLoaded) {
      throw new Error("Starter project did not populate links and focus.");
    }
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
    await page.fill("#quickRepoUrl", "https://github.com/brightdata/brightdata-mcp");
    await page.fill("#quickDemoUrl", "not-a-url");
    await page.click("#quickAddReviewerProject");
    await page.waitForTimeout(200);
    const invalidDemoRejected = await page.evaluate(() => {
      const status = document.querySelector("#statusLine")?.textContent || "";
      return /Demo app URL must start/i.test(status) && !document.querySelector('#rankedList [data-id="review-brightdata-brightdata-mcp"]');
    });
    if (!invalidDemoRejected) {
      throw new Error("Invalid non-empty demo URL was accepted without a warning.");
    }
    const repoDescribed = await page.getAttribute("#quickRepoUrl", "aria-describedby");
    const demoDescribed = await page.getAttribute("#quickDemoUrl", "aria-describedby");
    if (repoDescribed !== "quickRepoHelp" || demoDescribed !== "quickDemoHelp") {
      throw new Error("Hero review inputs are missing persistent QTip descriptions.");
    }
    await page.click("#loadSampleProject");
    await page.waitForTimeout(200);
    const verifiedSampleSelected = await page.evaluate(() => {
      const title = document.querySelector("#scorecard .focus-strip h2")?.textContent || "";
      const strip = document.querySelector("#liveProofStrip")?.textContent || "";
      return title === "ProofRank" && /Current proof:\s*ProofRank/i.test(strip) && /Bright Data evidence passed/i.test(strip);
    });
    if (!verifiedSampleSelected) {
      throw new Error("Verified sample did not select the signed Bright Data project.");
    }
    await page.fill("#quickRepoUrl", "https://github.com/brightdata/brightdata-mcp");
    await page.fill("#quickDemoUrl", "https://brightdata.com/");
    await page.click("#quickAddReviewerProject");
    await page.waitForTimeout(200);
    const shareableReviewReady = await page.evaluate(() => {
      const button = document.querySelector("#copyReviewLink");
      const params = new URL(window.location.href).searchParams;
      return Boolean(
        button &&
          !button.disabled &&
          params.get("reviewRepo") === "https://github.com/brightdata/brightdata-mcp" &&
          params.get("reviewDemo") === "https://brightdata.com/" &&
          params.get("reviewFocus") === "sponsor"
      );
    });
    if (!shareableReviewReady) {
      throw new Error("Valid hero review did not enable a shareable review link.");
    }
    const draftRoutePending = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#proofTopology .route-node")];
      const packetNode = nodes.find((node) => /Review memo/i.test(node.textContent || ""));
      return Boolean(packetNode?.classList.contains("pending") && /Draft memo ready/i.test(packetNode.textContent || ""));
    });
    if (!draftRoutePending) {
      throw new Error("Browser-created draft review looked like a fully passed live review packet.");
    }
    await page.evaluate(() => {
      const select = document.querySelector("#modeSelect");
      select.value = "live";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.click("#quickAddReviewerProject");
    await page.waitForTimeout(250);
    const quickLiveSwitchWarned = await page.evaluate(() => {
      const status = document.querySelector("#statusLine")?.textContent || "";
      const mode = document.querySelector("#modeSelect")?.value || "";
      return mode === "demo" && /switched to draft review/i.test(status);
    });
    if (!quickLiveSwitchWarned) {
      throw new Error("Hero quick review did not clearly warn when switching live mode back to draft review.");
    }
    const reviewRoomReady = await page.evaluate(() => {
      const room = document.querySelector("#reviewRoomStats");
      const text = document.querySelector(".review-room-strip")?.textContent || "";
      return Boolean(
        room &&
          room.querySelectorAll("article").length === 4 &&
          /Visitor drafts\s*1/i.test(text) &&
          document.querySelector("#exportRoomMemo") &&
          document.querySelector("#exportProgramReport")
      );
    });
    if (!reviewRoomReady) {
      throw new Error("Review Room summary or room memo export is not visible after adding a visitor project.");
    }
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
      reviewRoomStats: document.querySelectorAll("#reviewRoomStats article").length,
      reviewFocusCount: document.querySelectorAll("[data-review-focus]").length,
      starterCount: document.querySelectorAll("[data-starter-project]").length,
      modeLadderCount: document.querySelectorAll(".mode-ladder span").length,
      traceTimelineSteps: document.querySelectorAll(".trace-timeline li").length,
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
  if (result.metrics.reviewRoomStats !== 4) problems.push(`${result.spec.name}: review room stats did not render`);
  if (result.metrics.reviewFocusCount !== 3) problems.push(`${result.spec.name}: review focus controls did not render`);
  if (result.metrics.starterCount !== 3) problems.push(`${result.spec.name}: starter projects did not render`);
  if (result.metrics.modeLadderCount !== 3) problems.push(`${result.spec.name}: evidence mode ladder did not render`);
  if (result.metrics.traceTimelineSteps !== 4) problems.push(`${result.spec.name}: Bright Data run timeline did not render`);
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
